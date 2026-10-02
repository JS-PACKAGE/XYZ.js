import {
  readFile,
  stat,
  realpath,
  writeFile,
  mkdtemp,
  rm,
} from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import { checksum, encodePNG } from './asset-recipe-lib.mjs';
import { assetRecipe } from '../src/data/asset-recipe.ts';
import { assetLimits } from '../src/data/assets.ts';
import { createDracoWorkerAdapter } from './asset-recipe-draco-worker.mjs';
const exec = promisify(execFile);
export const platformFormats = Object.freeze({
  bc: {
    target: 'BC7',
    format: 'bc7-rgba-unorm',
    vk: 145,
    gl: [0x8e8c, 0x8e8d],
    model: 134,
  },
  etc2: {
    target: 'ETC2',
    format: 'etc2-rgba8unorm',
    vk: 151,
    gl: [0x9278, 0x9279],
    model: 161,
  },
  astc: {
    target: 'ASTC',
    format: 'astc-4x4-unorm',
    vk: 157,
    gl: [0x93b0, 0x93d0],
    model: 162,
  },
});
export async function boundedFile(path, limit) {
  if (!(await stat(path)).isFile() || (await stat(path)).size > limit)
    throw new Error('Codec/profile file exceeds budget.');
  const bytes = await readFile(path);
  if (bytes.length > limit)
    throw new Error('Codec/profile file exceeds budget.');
  return bytes;
}
export async function verifyFile(pin, base, limit = assetRecipe.outputBytes) {
  if (
    !pin ||
    typeof pin.path !== 'string' ||
    !/^[a-f0-9]{64}$/.test(pin.sha256)
  )
    throw new Error('Tool needs an independently recorded SHA-256 pin.');
  const path = await realpath(resolve(base, pin.path));
  if (checksum(await boundedFile(path, limit)) !== pin.sha256)
    throw new Error(`External tool checksum mismatch: ${path}`);
  return path;
}
function container(levels, vk, dfd) {
  const indexEnd = 80 + levels.length * 24;
  let size = (indexEnd + dfd.length + 7) & ~7;
  const offsets = [];
  for (let i = levels.length - 1; i >= 0; i--) {
    offsets[i] = size;
    size = (size + levels[i].data.length + 7) & ~7;
  }
  if (size > assetLimits.textureBytes)
    throw new Error('Compressed texture exceeds engine fetch budget.');
  const out = Buffer.alloc(size);
  Buffer.from([171, 75, 84, 88, 32, 50, 48, 187, 13, 10, 26, 10]).copy(out);
  out.writeUInt32LE(vk, 12);
  out.writeUInt32LE(1, 16);
  out.writeUInt32LE(levels[0].width, 20);
  out.writeUInt32LE(levels[0].height, 24);
  out.writeUInt32LE(1, 36);
  out.writeUInt32LE(levels.length, 40);
  out.writeUInt32LE(indexEnd, 48);
  out.writeUInt32LE(dfd.length, 52);
  dfd.copy(out, indexEnd);
  levels.forEach((level, i) => {
    const p = 80 + i * 24;
    out.writeBigUInt64LE(BigInt(offsets[i]), p);
    out.writeBigUInt64LE(BigInt(level.data.length), p + 8);
    out.writeBigUInt64LE(BigInt(level.data.length), p + 16);
    level.data.copy(out, offsets[i]);
  });
  return out;
}
function dfdFor(format) {
  // Khronos createDFDCompressed layout: ETC2 stores alpha before its color block.
  const samples = format.model === 161 ? 2 : 1;
  const dfd = Buffer.alloc(28 + samples * 16);
  dfd.writeUInt32LE(dfd.length);
  dfd.writeUInt16LE(2, 8);
  dfd.writeUInt16LE(dfd.length - 4, 10);
  dfd[12] = format.model;
  dfd[13] = 1;
  dfd[14] = 1;
  dfd[16] = 3;
  dfd[17] = 3;
  dfd[20] = 16;
  for (let i = 0; i < samples; i++) {
    const p = 28 + i * 16;
    dfd.writeUInt16LE(i * 64, p);
    dfd[p + 2] = samples === 2 ? 63 : 127;
    dfd[p + 3] = samples === 2 ? (i === 0 ? 15 : 2) : 0;
    dfd.writeUInt32LE(0xffffffff, p + 12);
  }
  return dfd;
}
function ktxBlocks(bytes, width, height, format) {
  const id = Buffer.from([171, 75, 84, 88, 32, 49, 49, 187, 13, 10, 26, 10]);
  if (
    bytes.length < 68 ||
    !bytes.subarray(0, 12).equals(id) ||
    bytes.readUInt32LE(12) !== 0x04030201 ||
    bytes.readUInt32LE(16) !== 0 ||
    bytes.readUInt32LE(24) !== 0 ||
    !format.gl.includes(bytes.readUInt32LE(28)) ||
    bytes.readUInt32LE(36) !== width ||
    bytes.readUInt32LE(40) !== height ||
    bytes.readUInt32LE(44) !== 0 ||
    bytes.readUInt32LE(48) !== 0 ||
    bytes.readUInt32LE(52) !== 1 ||
    bytes.readUInt32LE(56) !== 1
  )
    throw new Error('External tool returned incompatible KTX1.');
  const p = 64 + bytes.readUInt32LE(60),
    expected = Math.ceil(width / 4) * Math.ceil(height / 4) * 16;
  if (
    p + 4 > bytes.length ||
    bytes.readUInt32LE(p) !== expected ||
    p + 4 + expected !== bytes.length
  )
    throw new Error('External KTX1 block payload is corrupt.');
  return bytes.subarray(p + 4);
}
export async function loadRecipeProfile(path) {
  if (!path)
    return {
      version: 2,
      formats: [],
      textures: {},
      defaultTexture: { kind: 'linear', alpha: 'straight' },
    };
  const profile = JSON.parse(
    (await boundedFile(path, assetRecipe.profileBytes)).toString('utf8'),
  );
  if (
    profile.version !== 2 ||
    !Array.isArray(profile.formats) ||
    new Set(profile.formats).size !== profile.formats.length ||
    profile.formats.some((f) => !Object.hasOwn(platformFormats, f)) ||
    !profile.textures ||
    typeof profile.textures !== 'object'
  )
    throw new Error('Invalid recipe profile version/formats/textures.');
  for (const semantics of [
    profile.defaultTexture,
    ...Object.values(profile.textures),
  ])
    if (
      semantics &&
      (!['linear', 'srgb', 'normal'].includes(semantics.kind) ||
        !['straight', 'premultiplied', 'opaque'].includes(semantics.alpha))
    )
      throw new Error('Invalid explicit texture semantics.');
  return profile;
}
export async function externalCodecs(profile, profilePath, staging) {
  const base = dirname(resolve(profilePath ?? '.'));
  let basis;
  const tools = {};
  if (profile.tools?.basis) {
    const pin = profile.tools.basis;
    if (
      pin.version !== assetRecipe.basisVersion ||
      pin.platform !== process.platform ||
      pin.arch !== process.arch
    )
      throw new Error('Basis tool platform/version pin does not match.');
    const executable = await verifyFile(pin, base);
    const run = async (args, cwd = staging) => {
      // Recheck immediately before execution; fixed argv, never an asset-provided command.
      if (
        checksum(await boundedFile(executable, assetRecipe.outputBytes)) !==
        pin.sha256
      )
        throw new Error('Basis executable changed after verification.');
      return exec(executable, args, {
        cwd,
        timeout: assetRecipe.codecTimeoutMilliseconds,
        maxBuffer: assetRecipe.codecOutputBytes,
        env: { ...process.env, LC_ALL: 'C' },
      });
    };
    const version = (await run(['-version'])).stdout;
    if (!/System v2\.50\.0\b/.test(version))
      throw new Error('Basis executable version does not match 2.50.0.');
    basis = { run };
    tools.basis = {
      version: pin.version,
      sha256: pin.sha256,
      platform: pin.platform,
      arch: pin.arch,
    };
  }
  if (profile.formats.length && !basis)
    throw new Error(
      'BC/ETC2/ASTC variants require a verified official Basis 2.50 executable.',
    );
  const draco = profile.tools?.draco
    ? await createDracoWorkerAdapter(profile.tools.draco, base)
    : undefined;
  if (profile.draco && !draco)
    throw new Error(
      'Draco encoding requires the verified official draco3d 1.5.7 module.',
    );
  if (draco) tools.draco = draco.evidence;
  return {
    basis,
    tools,
    dracoPaths: draco?.paths,
    decodeDraco: async (asset) => {
      if (
        draco &&
        (asset.document.meshes ?? []).some((mesh) =>
          mesh.primitives?.some(
            (p) => p.extensions?.KHR_draco_mesh_compression,
          ),
        )
      )
        return draco.decode(asset);
    },
    encodeDraco: draco
      ? (asset) => draco.encode(asset, profile.draco)
      : undefined,
    async decodeBasis(bytes) {
      if (!basis)
        throw new Error(
          'Basis/compressed image requires a verified official Basis tool.',
        );
      const temp = await mkdtemp(join(staging, '.codec-'));
      try {
        await writeFile(join(temp, 'input.ktx2'), bytes, { flag: 'wx' });
        const output = join(temp, 'decoded.dds');
        await basis.run(
          [
            '-export_dds',
            'RGBA32',
            '-file',
            join(temp, 'input.ktx2'),
            '-output_file',
            output,
          ],
          temp,
        );
        const dds = await boundedFile(output, assetRecipe.outputBytes);
        // Basis 2.50 exports a non-array 2D image with arraySize=0 (KTX convention).
        if (
          dds.length < 148 ||
          dds.readUInt32LE(0) !== 0x20534444 ||
          dds.readUInt32LE(4) !== 124 ||
          dds.toString('ascii', 84, 88) !== 'DX10' ||
          ![28, 29].includes(dds.readUInt32LE(128)) ||
          dds.readUInt32LE(132) !== 3 ||
          dds.readUInt32LE(136) !== 0 ||
          ![0, 1].includes(dds.readUInt32LE(140))
        )
          throw new Error('Official Basis RGBA DDS output is incompatible.');
        const width = dds.readUInt32LE(16),
          height = dds.readUInt32LE(12);
        if (
          !width ||
          !height ||
          width > assetLimits.textureDimension ||
          height > assetLimits.textureDimension ||
          width * height > assetLimits.texturePixels ||
          148 + width * height * 4 > dds.length
        )
          throw new Error(
            'Official Basis raster exceeds budget or is truncated.',
          );
        return encodePNG({
          width,
          height,
          data: dds.subarray(148, 148 + width * height * 4),
        });
      } finally {
        await rm(temp, { recursive: true, force: true });
      }
    },
    async encodeTexture(levels, semantics) {
      if (!basis || !profile.formats.length) return { variants: {} };
      const temp = await mkdtemp(join(staging, '.codec-'));
      try {
        const payloads = Object.fromEntries(
          profile.formats.map((f) => [f, []]),
        );
        const universal = [];
        let dfd;
        for (let i = 0; i < levels.length; i++) {
          const image = join(temp, `mip-${i}.png`),
            encoded = join(temp, `mip-${i}.ktx2`);
          await writeFile(image, encodePNG(levels[i]), { flag: 'wx' });
          await basis.run(
            [
              '-uastc',
              '-uastc_level',
              '2',
              '-ktx2',
              '-ktx2_no_zstandard',
              '-no_multithreading',
              '-force_alpha',
              semantics.kind === 'srgb' ? '-srgb' : '-linear',
              '-file',
              image,
              '-output_file',
              encoded,
            ],
            temp,
          );
          const bytes = await boundedFile(encoded, assetLimits.textureBytes);
          if (
            bytes.length < 104 ||
            bytes.readUInt32LE(12) !== 0 ||
            bytes.readUInt32LE(40) !== 1 ||
            bytes.readUInt32LE(44) !== 0
          )
            throw new Error('Basis tool returned incompatible UASTC KTX2.');
          const offset = Number(bytes.readBigUInt64LE(80)),
            length = Number(bytes.readBigUInt64LE(88));
          if (
            !Number.isSafeInteger(offset) ||
            !Number.isSafeInteger(length) ||
            offset + length > bytes.length
          )
            throw new Error('Corrupt UASTC output.');
          dfd ??= bytes.subarray(
            bytes.readUInt32LE(48),
            bytes.readUInt32LE(48) + bytes.readUInt32LE(52),
          );
          universal.push({
            ...levels[i],
            data: bytes.subarray(offset, offset + length),
          });
          for (const f of profile.formats) {
            const format = platformFormats[f];
            await basis.run(
              [
                '-export_ktx',
                format.target,
                '-file',
                encoded,
                '-output_path',
                temp,
              ],
              temp,
            );
            const blocks = ktxBlocks(
              await boundedFile(
                join(temp, `mip-${i}_${format.target}.ktx`),
                assetLimits.textureBytes,
              ),
              levels[i].width,
              levels[i].height,
              format,
            );
            payloads[f].push({ ...levels[i], data: blocks });
          }
        }
        return {
          basis: container(universal, 0, dfd),
          variants: Object.fromEntries(
            profile.formats.map((f) => [
              f,
              container(
                payloads[f],
                platformFormats[f].vk,
                dfdFor(platformFormats[f]),
              ),
            ]),
          ),
        };
      } finally {
        await rm(temp, { recursive: true, force: true });
      }
    },
  };
}

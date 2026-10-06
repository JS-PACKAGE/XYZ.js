import { Buffer } from 'node:buffer';
import { TextDecoder } from 'node:util';
import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, relative, dirname, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { modelLimits, assetLimits, assetRecipe } from './asset-tool-paths.mjs';

export const checksum = (bytes) =>
  createHash('sha256').update(bytes).digest('hex');
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(',')}}`;
  return JSON.stringify(value);
}
const integer = (n, label, max = Number.MAX_SAFE_INTEGER) => {
  if (!Number.isSafeInteger(n) || n < 0 || n > max)
    throw new Error(`Invalid ${label}.`);
  return n;
};
const table = (document, name) => {
  const entries = document[name] ?? [];
  if (
    !Array.isArray(entries) ||
    entries.length > modelLimits.entries ||
    entries.some(
      (item) => !item || typeof item !== 'object' || Array.isArray(item),
    )
  )
    throw new Error(`Invalid or oversized ${name}.`);
  return entries;
};
const item = (entries, index, label) => {
  integer(index, label);
  if (!entries[index]) throw new Error(`Missing ${label}.`);
  return entries[index];
};

export function parseModel(bytes) {
  if (bytes.length > modelLimits.inputBytes)
    throw new Error('Input exceeds engine model budget.');
  let json = bytes,
    binary;
  if (bytes.length >= 4 && bytes.readUInt32LE(0) === 0x46546c67) {
    if (
      bytes.length < 20 ||
      bytes.readUInt32LE(4) !== 2 ||
      bytes.readUInt32LE(8) !== bytes.length
    )
      throw new Error('Invalid GLB header.');
    let offset = 12,
      chunks = 0;
    while (offset < bytes.length) {
      if (offset + 8 > bytes.length) throw new Error('Truncated GLB chunk.');
      const size = bytes.readUInt32LE(offset),
        type = bytes.readUInt32LE(offset + 4);
      offset += 8;
      if (size % 4 || offset + size > bytes.length)
        throw new Error('Invalid GLB chunk range.');
      if (chunks === 0 && type !== 0x4e4f534a)
        throw new Error('GLB JSON must be first.');
      if (type === 0x4e4f534a) {
        if (chunks !== 0) throw new Error('Duplicate GLB JSON chunk.');
        json = bytes.subarray(offset, offset + size);
      } else if (type === 0x004e4942) {
        if (binary) throw new Error('Duplicate GLB BIN chunk.');
        binary = bytes.subarray(offset, offset + size);
      } else throw new Error('Unknown GLB chunk.');
      offset += size;
      chunks++;
    }
  }
  const document = JSON.parse(
    new TextDecoder('utf-8', { fatal: true }).decode(json),
  );
  if (document?.asset?.version !== '2.0')
    throw new Error('Only glTF 2.0 is supported.');
  return { document, binary };
}

/** Never fetch URLs or follow symlinks outside the input directory. */
export async function ingest(input, codecs) {
  input = await realpath(input);
  const base = dirname(input),
    sources = [],
    buffers = [];
  let fetched = 0;
  const record = (name, bytes) => {
    fetched += bytes.length;
    if (fetched > modelLimits.fetchedBytes)
      throw new Error('Input resources exceed model byte budget.');
    sources.push({ name, bytes: bytes.length, sha256: checksum(bytes) });
    return bytes;
  };
  const bounded = async (path, cap) => {
    if ((await stat(path)).size > cap)
      throw new Error('Input resource exceeds byte budget.');
    const bytes = await readFile(path);
    if (bytes.length > cap)
      throw new Error('Input resource exceeds byte budget.');
    return bytes;
  };
  const raw = record('input', await bounded(input, modelLimits.inputBytes));
  const { document, binary } = parseModel(raw);
  const resource = async (uri, cap) => {
    if (typeof uri !== 'string')
      throw new Error('Resource URI must be a string.');
    if (uri.startsWith('data:')) {
      const match = /^data:([^,]*);base64,([A-Za-z0-9+/]*={0,2})$/.exec(uri);
      if (!match || match[2].length > (cap * 4) / 3 + 4)
        throw new Error(
          'Only bounded canonical base64 data URIs are accepted.',
        );
      const bytes = Buffer.from(match[2], 'base64');
      if (bytes.toString('base64') !== match[2] || bytes.length > cap)
        throw new Error('Invalid base64 resource.');
      return record(`data:${checksum(bytes)}`, bytes);
    }
    if (/^[a-z][a-z0-9+.-]*:|[?#\\]/i.test(uri))
      throw new Error('Only local relative resources are accepted.');
    const path = await realpath(resolve(base, decodeURIComponent(uri)));
    const rel = relative(base, path);
    if (rel.startsWith('..') || isAbsolute(rel))
      throw new Error('Resource escapes the input directory.');
    return record(rel.split('\\').join('/'), await bounded(path, cap));
  };
  for (const [index, def] of table(document, 'buffers').entries()) {
    integer(def.byteLength, 'buffer byteLength', modelLimits.decodedBytes);
    // Meshopt-only fallback buffers have no bytes and cannot be packed as a real resource.
    if (
      def.extensions?.EXT_meshopt_compression?.fallback &&
      def.uri === undefined &&
      !(index === 0 && binary)
    )
      throw new Error(
        'Meshopt virtual fallback buffers require an external uncompressed export for this recipe.',
      );
    const bytes =
      def.uri === undefined
        ? index === 0
          ? binary
          : undefined
        : await resource(def.uri, modelLimits.fetchedBytes);
    if (
      !bytes ||
      bytes.length < def.byteLength ||
      (def.uri === undefined && bytes.length > def.byteLength + 3)
    )
      throw new Error('Buffer length does not match glTF declaration.');
    buffers.push(bytes.subarray(0, def.byteLength));
  }
  const images = [];
  for (const def of table(document, 'images')) {
    let bytes;
    if (def.uri !== undefined)
      bytes = await resource(def.uri, assetLimits.textureBytes);
    else {
      const view = item(
        table(document, 'bufferViews'),
        def.bufferView,
        'image bufferView',
      );
      const source = item(buffers, view.buffer, 'image buffer');
      const offset = integer(view.byteOffset ?? 0, 'image offset'),
        length = integer(
          view.byteLength,
          'image length',
          assetLimits.textureBytes,
        );
      if (offset + length > source.length)
        throw new Error('Image bufferView is out of bounds.');
      bytes = source.subarray(offset, offset + length);
    }
    images.push({ bytes, mimeType: def.mimeType });
  }
  const asset = { document, buffers, images, sources };
  if (codecs) await codecs.decodeDraco(asset);
  preflight(asset.document, { basis: !!codecs?.basis });
  return asset;
}

const supported = new Set([
  'KHR_materials_emissive_strength',
  'KHR_materials_unlit',
  'KHR_materials_ior',
  'KHR_materials_specular',
  'KHR_materials_clearcoat',
  'KHR_materials_sheen',
  'KHR_materials_transmission',
  'KHR_materials_volume',
  'KHR_materials_variants',
  'KHR_materials_anisotropy',
  'KHR_materials_iridescence',
  'KHR_materials_dispersion',
  'KHR_texture_transform',
  'KHR_lights_punctual',
  'KHR_mesh_quantization',
  'EXT_meshopt_compression',
]);
export function recipeSupportsExtension(name) {
  return (
    supported.has(name) ||
    ['KHR_draco_mesh_compression', 'KHR_texture_basisu'].includes(name)
  );
}
export function preflight(document, codecs = {}) {
  if (
    document.extensionsRequired !== undefined &&
    !Array.isArray(document.extensionsRequired)
  )
    throw new Error('extensionsRequired must be an array.');
  for (const extension of document.extensionsRequired ?? [])
    if (
      !supported.has(extension) &&
      !(extension === 'KHR_texture_basisu' && codecs.basis)
    )
      throw new Error(
        `Required codec/extension ${extension} is not included. Configure verified official codec tools.`,
      );
  for (const name of [
    'nodes',
    'meshes',
    'accessors',
    'bufferViews',
    'skins',
    'animations',
    'scenes',
    'textures',
    'samplers',
    'materials',
    'images',
    'buffers',
  ])
    table(document, name);
  const materials = table(document, 'materials'),
    accessors = table(document, 'accessors');
  let vertices = 0,
    indices = 0;
  for (const mesh of table(document, 'meshes')) {
    if (
      !Array.isArray(mesh.primitives) ||
      mesh.primitives.length > modelLimits.entries
    )
      throw new Error('Invalid primitives.');
    for (const primitive of mesh.primitives) {
      if ((primitive.mode ?? 4) !== 4)
        throw new Error('Only TRIANGLES topology is supported.');
      const attributes = primitive.attributes ?? {};
      for (const semantic of Object.keys(attributes)) {
        if (/^TEXCOORD_/.test(semantic) && !/^TEXCOORD_[01]$/.test(semantic))
          throw new Error('Only TEXCOORD_0 and TEXCOORD_1 are supported.');
        if (
          /^(JOINTS|WEIGHTS)_/.test(semantic) &&
          !/^(JOINTS|WEIGHTS)_[01]$/.test(semantic)
        )
          throw new Error('More than eight skin influences are unsupported.');
      }
      if (
        (attributes.JOINTS_1 === undefined) !==
          (attributes.WEIGHTS_1 === undefined) ||
        (attributes.JOINTS_0 === undefined) !==
          (attributes.WEIGHTS_0 === undefined) ||
        (attributes.JOINTS_1 !== undefined && attributes.JOINTS_0 === undefined)
      )
        throw new Error(
          'Skin influence sets require paired joints and weights.',
        );
      const position = item(
        accessors,
        primitive.attributes?.POSITION,
        'POSITION',
      );
      if (position.type !== 'VEC3') throw new Error('POSITION must be VEC3.');
      vertices += integer(
        position.count,
        'POSITION count',
        modelLimits.vertices,
      );
      const count =
        primitive.indices === undefined
          ? position.count
          : item(accessors, primitive.indices, 'indices').count;
      indices += integer(count, 'index count', modelLimits.indices);
      if (
        !count ||
        count % 3 ||
        vertices > modelLimits.vertices ||
        indices > modelLimits.indices
      )
        throw new Error('Triangle/vertex/index budget exceeded.');
      if (primitive.targets?.length > modelLimits.morphTargets)
        throw new Error('Morph target budget exceeded.');
      if (primitive.extensions?.KHR_draco_mesh_compression) {
        // A complete glTF fallback may be used without installing any decoder.
        for (const accessor of [
          ...Object.values(primitive.attributes),
          ...(primitive.indices === undefined ? [] : [primitive.indices]),
        ])
          if (
            item(accessors, accessor, 'Draco fallback accessor').bufferView ===
            undefined
          )
            throw new Error('Draco has no uncompressed fallback.');
        delete primitive.extensions.KHR_draco_mesh_compression;
      }
      const primitiveMaterials = [];
      if (primitive.material !== undefined)
        primitiveMaterials.push(
          item(materials, primitive.material, 'material'),
        );
      const mappings = primitive.extensions?.KHR_materials_variants?.mappings;
      if (mappings !== undefined) {
        if (!Array.isArray(mappings) || !mappings.length)
          throw new Error('Invalid material variant mappings.');
        const variants = document.extensions?.KHR_materials_variants?.variants;
        if (!Array.isArray(variants) || !variants.length)
          throw new Error(
            'Material variant mappings require declared variants.',
          );
        for (const mapping of mappings) {
          if (!Array.isArray(mapping.variants) || !mapping.variants.length)
            throw new Error('Material variant mapping requires variants.');
          for (const index of mapping.variants)
            item(variants, index, 'material variant');
          primitiveMaterials.push(
            item(materials, mapping.material, 'variant material'),
          );
        }
      }
      for (const material of primitiveMaterials) {
        for (const slot of textureSlots(material)) {
          const texCoord =
            slot.extensions?.KHR_texture_transform?.texCoord ??
            slot.texCoord ??
            0;
          integer(texCoord, 'texture texCoord', 1);
          if (primitive.attributes?.[`TEXCOORD_${texCoord}`] === undefined)
            throw new Error(
              `Textured primitives require TEXCOORD_${texCoord}.`,
            );
        }
      }
    }
  }
  for (const skin of table(document, 'skins'))
    if (
      !Array.isArray(skin.joints) ||
      !skin.joints.length ||
      skin.joints.length > modelLimits.joints
    )
      throw new Error('Skin joint budget exceeded.');
  for (const texture of table(document, 'textures')) {
    if (texture.extensions?.KHR_texture_basisu) {
      if (codecs.basis)
        texture.source = texture.extensions.KHR_texture_basisu.source;
      else if (texture.source === undefined)
        throw new Error(
          'Basis requires an uncompressed source fallback; no Basis codec is configured.',
        );
      delete texture.extensions.KHR_texture_basisu;
    }
  }
  document.extensionsUsed = (document.extensionsUsed ?? []).filter(
    (name) =>
      name !== 'KHR_draco_mesh_compression' && name !== 'KHR_texture_basisu',
  );
  document.extensionsRequired = (document.extensionsRequired ?? []).filter(
    (name) => name !== 'KHR_texture_basisu',
  );
  for (const material of materials) {
    for (const name of Object.keys(material.extensions ?? {}))
      if (!supported.has(name))
        throw new Error(`Unsupported material extension ${name}.`);
    const extensions = material.extensions ?? {};
    if (
      extensions.KHR_materials_dispersion &&
      !extensions.KHR_materials_transmission
    )
      throw new Error('Dispersion requires a transmission extension.');
    if (
      extensions.KHR_materials_volume &&
      !extensions.KHR_materials_transmission
    )
      throw new Error('Volume requires transmission.');
    if (
      extensions.KHR_materials_unlit &&
      [
        'KHR_materials_ior',
        'KHR_materials_specular',
        'KHR_materials_clearcoat',
        'KHR_materials_sheen',
        'KHR_materials_transmission',
        'KHR_materials_volume',
        'KHR_materials_anisotropy',
        'KHR_materials_iridescence',
        'KHR_materials_dispersion',
      ].some((name) => extensions[name])
    )
      throw new Error('Unlit cannot use PBR extensions.');
    for (const slot of textureSlots(material)) {
      const transform = slot.extensions?.KHR_texture_transform ?? {};
      integer(transform.texCoord ?? slot.texCoord ?? 0, 'texture texCoord', 1);
      item(table(document, 'textures'), slot.index, 'texture');
    }
  }
}
function textureSlots(material) {
  const slots = [];
  const visit = (object) => {
    if (!object || typeof object !== 'object') return;
    for (const [key, value] of Object.entries(object)) {
      if (key.endsWith('Texture') && value && typeof value === 'object')
        slots.push(value);
      else if (key !== 'extras') visit(value);
    }
  };
  visit(material);
  return slots;
}

/** Shared author-time texture semantics; coverage is explicit rather than slot-inferred. */
export function validateTextureSemantics(semantics) {
  if (
    !semantics ||
    !['linear', 'srgb', 'normal'].includes(semantics.kind) ||
    !['straight', 'premultiplied', 'opaque'].includes(semantics.alpha)
  )
    throw new Error('Invalid explicit texture semantics.');
  if (semantics.kind === 'normal' && semantics.alpha === 'premultiplied')
    throw new Error('Normal maps cannot use premultiplied alpha.');
  const cutoff = semantics.alphaCoverageCutoff;
  if (
    cutoff !== undefined &&
    (!Number.isFinite(cutoff) ||
      cutoff <= 0 ||
      cutoff >= 1 ||
      semantics.kind === 'normal' ||
      semantics.alpha === 'opaque')
  )
    throw new Error(
      'Alpha coverage requires a finite cutoff between zero and one and color alpha.',
    );
}

/** Explicit semantics: no material-name or slot inference. */
export function mipChain(
  width,
  height,
  rgba,
  semantics = { kind: 'linear', alpha: 'straight' },
) {
  integer(width, 'texture width', assetLimits.textureDimension);
  integer(height, 'texture height', assetLimits.textureDimension);
  if (
    !width ||
    !height ||
    width * height > assetLimits.texturePixels ||
    rgba.length !== width * height * 4
  )
    throw new Error('Invalid texture dimensions/pixels.');
  validateTextureSemantics(semantics);
  const linear = (v) =>
    v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  const srgb = (v) =>
    v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  const byte = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  const levels = [{ width, height, data: Buffer.from(rgba) }];
  if (semantics.alpha === 'opaque')
    for (let i = 3; i < levels[0].data.length; i += 4) levels[0].data[i] = 255;
  if (semantics.alpha === 'premultiplied') {
    // XYZ materials consume straight alpha; normalize explicitly declared input once.
    for (let i = 0; i < levels[0].data.length; i += 4) {
      const alpha = levels[0].data[i + 3] / 255;
      for (let c = 0; c < 3; c++)
        levels[0].data[i + c] = alpha
          ? byte(levels[0].data[i + c] / 255 / alpha)
          : 0;
    }
  }
  while (width > 1 || height > 1) {
    const source = levels.at(-1).data,
      w = Math.max(1, width >> 1),
      h = Math.max(1, height >> 1),
      data = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const x0 = Math.floor((x * width) / w),
          x1 = Math.floor(((x + 1) * width) / w),
          y0 = Math.floor((y * height) / h),
          y1 = Math.floor(((y + 1) * height) / h),
          count = (x1 - x0) * (y1 - y0);
        const sums = [0, 0, 0];
        let alpha = 0;
        for (let sy = y0; sy < y1; sy++)
          for (let sx = x0; sx < x1; sx++) {
            const offset = (sy * width + sx) * 4;
            const a = source[offset + 3] / 255;
            alpha += a;
            for (let c = 0; c < 3; c++) {
              let value = source[offset + c] / 255;
              if (semantics.kind === 'srgb') value = linear(value);
              if (semantics.kind === 'normal') value = value * 2 - 1;
              sums[c] +=
                value *
                (semantics.alpha !== 'opaque' && semantics.kind !== 'normal'
                  ? a
                  : 1);
            }
          }
        const offset = (y * w + x) * 4;
        if (semantics.kind === 'normal') {
          const length = Math.hypot(...sums);
          for (let c = 0; c < 3; c++)
            data[offset + c] = byte(
              ((length > 1e-12 ? sums[c] / length : c === 2 ? 1 : 0) + 1) / 2,
            );
        } else {
          for (let c = 0; c < 3; c++) {
            let value =
              sums[c] / (semantics.alpha !== 'opaque' ? alpha || 1 : count);
            if (semantics.kind === 'srgb') value = srgb(value);
            data[offset + c] = byte(value);
          }
        }
        data[offset + 3] =
          semantics.alpha === 'opaque' ? 255 : byte(alpha / count);
      }
    levels.push({ width: w, height: h, data });
    width = w;
    height = h;
  }
  if (semantics.alphaCoverageCutoff !== undefined && levels.length > 1) {
    const threshold = Math.ceil(semantics.alphaCoverageCutoff * 255);
    let baseCovered = 0;
    const base = levels[0].data;
    for (let i = 3; i < base.length; i += 4)
      if (base[i] >= threshold) baseCovered++;
    const ratio = baseCovered / (base.length / 4);
    const histogram = new Uint32Array(256);
    // Rescale after filtering the entire chain: RGB and later mip weighting stay unchanged.
    for (let level = 1; level < levels.length; level++) {
      const data = levels[level].data,
        target = (ratio * data.length) / 4;
      histogram.fill(0);
      let originalCovered = 0;
      for (let i = 3; i < data.length; i += 4) {
        histogram[data[i]]++;
        if (data[i] >= threshold) originalCovered++;
      }
      let bestError = Math.abs(originalCovered - target),
        scale = 1,
        covered = 0;
      for (let alpha = 255; alpha >= 1; alpha--) {
        covered += histogram[alpha];
        if (!histogram[alpha]) continue;
        const error = Math.abs(covered - target);
        const candidate = (threshold - 0.5 + 1e-9) / alpha;
        if (
          error < bestError ||
          (error === bestError &&
            Math.abs(Math.log(candidate)) < Math.abs(Math.log(scale)))
        ) {
          bestError = error;
          scale = candidate;
        }
      }
      // Zero coverage can be the nearest attainable result; tied minima prefer no rescale.
      if (target < bestError) scale = 0;
      if (scale !== 1)
        for (let i = 3; i < data.length; i += 4)
          data[i] = Math.min(255, Math.round(data[i] * scale));
    }
  }
  return levels;
}

/** KTX 2.0, VK_FORMAT_R8G8B8A8_UNORM, standard RGBA DFD; no fake compression. */
export function encodeKTX2(levels) {
  const dfd = Buffer.alloc(92);
  dfd.writeUInt32LE(92, 0);
  dfd.writeUInt16LE(2, 8);
  dfd.writeUInt16LE(88, 10);
  dfd[12] = 1;
  dfd[13] = 1;
  dfd[14] = 1;
  dfd[20] = 4;
  for (let c = 0; c < 4; c++) {
    const offset = 28 + c * 16;
    dfd.writeUInt16LE(c * 8, offset);
    dfd[offset + 2] = 7;
    dfd[offset + 3] = c === 3 ? 15 : c;
    dfd.writeUInt32LE(255, offset + 12);
  }
  const dfdOffset = 80 + levels.length * 24;
  let size = (dfdOffset + dfd.length + 7) & ~7;
  const offsets = [];
  // KTX2 convention: smallest mip payload first, index remains base-level first.
  for (let i = levels.length - 1; i >= 0; i--) {
    offsets[i] = size;
    size = (size + levels[i].data.length + 7) & ~7;
  }
  if (size > assetLimits.textureBytes)
    throw new Error('Encoded KTX2 exceeds engine image fetch budget.');
  const bytes = Buffer.alloc(size);
  Buffer.from([
    0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a,
  ]).copy(bytes);
  bytes.writeUInt32LE(37, 12);
  bytes.writeUInt32LE(1, 16);
  bytes.writeUInt32LE(levels[0].width, 20);
  bytes.writeUInt32LE(levels[0].height, 24);
  bytes.writeUInt32LE(1, 36);
  bytes.writeUInt32LE(levels.length, 40);
  bytes.writeUInt32LE(dfdOffset, 48);
  bytes.writeUInt32LE(dfd.length, 52);
  dfd.copy(bytes, dfdOffset);
  levels.forEach((level, i) => {
    const offset = 80 + i * 24;
    bytes.writeBigUInt64LE(BigInt(offsets[i]), offset);
    bytes.writeBigUInt64LE(BigInt(level.data.length), offset + 8);
    bytes.writeBigUInt64LE(BigInt(level.data.length), offset + 16);
    level.data.copy(bytes, offsets[i]);
  });
  return bytes;
}
const crc32 = (bytes) => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
};
export function encodePNG({ width, height, data }) {
  const chunk = (type, payload) => {
    const bytes = Buffer.alloc(12 + payload.length);
    bytes.writeUInt32BE(payload.length);
    bytes.write(type, 4);
    payload.copy(bytes, 8);
    bytes.writeUInt32BE(crc32(bytes.subarray(4, -4)), bytes.length - 4);
    return bytes;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const rows = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++)
    data.copy(
      rows,
      y * (width * 4 + 1) + 1,
      y * width * 4,
      (y + 1) * width * 4,
    );
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  if (png.length > assetLimits.textureBytes)
    throw new Error('PNG fallback exceeds engine image fetch budget.');
  return png;
}

export function packBuffers(document, buffers) {
  const offsets = [],
    parts = [];
  let length = 0;
  buffers.forEach((bytes) => {
    offsets.push(length);
    parts.push(bytes);
    length += bytes.length;
    const padding = (4 - (length % 4)) % 4;
    parts.push(Buffer.alloc(padding));
    length += padding;
  });
  if (length > modelLimits.fetchedBytes || length > assetRecipe.outputBytes)
    throw new Error('Packed buffer exceeds byte budget.');
  for (const view of table(document, 'bufferViews')) {
    const buffer = item(buffers, view.buffer, 'bufferView buffer');
    const start = integer(view.byteOffset ?? 0, 'bufferView offset'),
      size = integer(view.byteLength, 'bufferView length');
    if (start + size > buffer.length)
      throw new Error('bufferView is out of bounds.');
    view.byteOffset = offsets[view.buffer] + start;
    view.buffer = 0;
    const meshopt = view.extensions?.EXT_meshopt_compression;
    if (meshopt) {
      const source = item(buffers, meshopt.buffer, 'meshopt buffer');
      const offset = integer(meshopt.byteOffset ?? 0, 'meshopt offset'),
        bytes = integer(meshopt.byteLength, 'meshopt length');
      if (offset + bytes > source.length)
        throw new Error('Meshopt payload is out of bounds.');
      meshopt.byteOffset = offsets[meshopt.buffer] + offset;
      meshopt.buffer = 0;
    }
  }
  document.buffers = [{ uri: 'payload.bin', byteLength: length }];
  return Buffer.concat(parts, length);
}

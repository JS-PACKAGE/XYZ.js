/* global window, document, location, requestAnimationFrame, Headers, Request, Blob, crypto -- browser evaluation */
import {
  readFile,
  readdir,
  realpath,
  stat,
  mkdtemp,
  writeFile,
} from 'node:fs/promises';
import {
  join,
  resolve,
  relative,
  isAbsolute,
  dirname,
  basename,
} from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import { Buffer } from 'node:buffer';
import { tmpdir } from 'node:os';
import { assetBrowser } from './asset-recipe-browser.mjs';
import { checksum } from './asset-recipe-lib.mjs';
import { assetRecipe } from '../src/data/asset-recipe.ts';
import { modelLimits } from '../src/data/models.ts';

import { externalCodecs, loadRecipeProfile } from './asset-recipe-codecs.mjs';
const readBounded = async (path, cap) => {
  if ((await stat(path)).size > cap)
    throw new Error('Deployment metadata exceeds byte budget.');
  const bytes = await readFile(path);
  if (bytes.length > cap)
    throw new Error('Deployment metadata exceeds byte budget.');
  return bytes;
};

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
if (
  (args.length !== 4 && args.length !== 6 && args.length !== 8) ||
  args[0] !== '--package' ||
  args[2] !== '--bundle' ||
  (args.length >= 6 && args[4] !== '--renderer') ||
  (args.length === 8 && args[6] !== '--profile')
)
  throw new Error(
    'Usage: node scripts/verify-asset-deployment.mjs --package extracted/package --bundle built/bundle [--renderer webgl2|webgpu [--profile trusted-profile.json]]',
  );
const consumer = await realpath(resolve(args[1])),
  bundle = await realpath(resolve(args[3]));
const renderer = args[5] ?? 'webgl2';
if (!['webgl2', 'webgpu'].includes(renderer))
  throw new Error(
    'Deployment verification requires a 3D backend: webgl2 or webgpu.',
  );
const metadata = JSON.parse(
  await readBounded(join(consumer, 'package.json'), modelLimits.inputBytes),
);
if (
  metadata.name !== 'xyz.js' ||
  metadata.exports?.['.']?.import !== './dist/src/index.js'
)
  throw new Error(
    'Expected an extracted XYZ.js pnpm pack with its official root export.',
  );
const manifest = JSON.parse(
  await readBounded(join(bundle, 'manifest.json'), modelLimits.inputBytes),
);
if (
  manifest.version !== assetRecipe.version ||
  manifest.profile !== assetRecipe.bundleProfile ||
  !Array.isArray(manifest.files) ||
  manifest.files.length > assetRecipe.outputFiles
)
  throw new Error('Unsupported asset bundle manifest.');
if (
  !Array.isArray(manifest.textures) ||
  manifest.textures.length > modelLimits.entries ||
  manifest.toolchain?.node !== assetRecipe.node ||
  manifest.toolchain?.playwright !== assetRecipe.playwright ||
  manifest.toolchain?.chromium !== assetRecipe.chromium ||
  manifest.toolchain?.revision !== assetRecipe.chromiumRevision
)
  throw new Error(
    'Bundle codec/toolchain requirements do not match this pinned recipe.',
  );
const safeFile = async (base, name) => {
  if (typeof name !== 'string' || !/^[A-Za-z0-9._-]+$/.test(name))
    throw new Error('Manifest file path is unsafe.');
  const path = await realpath(join(base, name)),
    rel = relative(base, path);
  if (rel.startsWith('..') || isAbsolute(rel))
    throw new Error('Manifest path escapes bundle.');
  return path;
};
let bytes = 0;
const sums = new Map();
const byteIdentities = new Map();
for (const line of (
  await readBounded(join(bundle, 'SHA256SUMS'), assetRecipe.outputFiles * 100)
)
  .toString('utf8')
  .trim()
  .split('\n')) {
  const match = /^([a-f0-9]{64}) {2}([A-Za-z0-9._-]+)$/.exec(line);
  if (!match || sums.has(match[2]))
    throw new Error('Invalid/duplicate SHA256SUMS entry.');
  sums.set(match[2], match[1]);
}
for (const file of [
  ...manifest.files,
  { path: 'manifest.json', sha256: sums.get('manifest.json') },
]) {
  const path = await safeFile(bundle, file.path);
  const size = (await stat(path)).size;
  bytes += size;
  if (
    bytes > assetRecipe.outputBytes ||
    (file.bytes !== undefined && size !== file.bytes)
  )
    throw new Error('Bundle size/checksum budget mismatch.');
  const hash = checksum(
    await readBounded(path, assetRecipe.outputBytes - bytes + size),
  );
  if (hash !== file.sha256 || hash !== sums.get(file.path))
    throw new Error(`Bundle checksum mismatch: ${file.path}`);
  byteIdentities.set(file.path, { bytes: size, sha256: hash });
}
const expectedFiles = [
  ...manifest.files.map((file) => file.path),
  'manifest.json',
  'SHA256SUMS',
].sort();
const actualFiles = (await readdir(bundle)).sort();
if (
  JSON.stringify(expectedFiles) !== JSON.stringify(actualFiles) ||
  sums.size !== expectedFiles.length - 1
)
  throw new Error('Bundle contains missing, duplicate, or untracked files.');
const walk = async (path, prefix = '') => {
  const files = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const name = `${prefix}${entry.name}`;
    if (entry.isDirectory())
      files.push(...(await walk(join(path, entry.name), `${name}/`)));
    else if (entry.isFile()) files.push(name);
    else
      throw new Error(
        'Vendor deployment may not contain symlinks/special files.',
      );
  }
  return files.sort();
};
const official = join(root, 'vendor/opm'),
  packed = join(consumer, 'dist/vendor/opm');
const vendorFiles = await walk(official),
  packedFiles = await walk(packed);
if (JSON.stringify(vendorFiles) !== JSON.stringify(packedFiles))
  throw new Error('Packed vendor tree does not match the official inventory.');
for (const path of vendorFiles)
  if (
    checksum(await readFile(join(official, path))) !==
    checksum(await readFile(join(packed, path)))
  )
    throw new Error(`Official vendor bytes changed: ${path}`);
const profilePath = args.length === 8 ? resolve(args[7]) : undefined;
const codecs = await externalCodecs(
  await loadRecipeProfile(profilePath),
  profilePath,
  tmpdir(),
);
const session = await assetBrowser({
  engine: join(consumer, 'dist'),
  bundle,
  recipe: join(root, 'scripts'),
  ...(codecs.dracoPaths
    ? {
        decoder: dirname(codecs.dracoPaths.decoder),
        decoderWasm: dirname(codecs.dracoPaths.decoderWasm),
      }
    : {}),
});
const errors = [],
  failedRequests = [],
  pageWorklets = [];
session.page.on('pageerror', (error) => errors.push(error.message));
session.page.on('response', (response) => {
  if (response.status() >= 400)
    errors.push(`HTTP ${response.status()}: ${response.url()}`);
  if (response.url().includes('/vendor/opm/dist/worklet/'))
    pageWorklets.push({ url: response.url(), status: response.status() });
});
session.page.on('requestfailed', (request) =>
  failedRequests.push({
    url: request.url(),
    requestId: request.headers()['x-xyz-deployment-request'],
    errorText: request.failure()?.errorText,
    method: request.method(),
    type: request.resourceType(),
    timing: request.timing(),
    failedAt: Date.now(),
  }),
);
try {
  const evidence = await mkdtemp(join(tmpdir(), 'xyz-asset-deployment-'));
  const results = [];
  // Observe the loader's actual reader, not a cloned/second request. Chromium can
  // report ERR_ABORTED after a Fetch stream has reached EOF; only exact bytes,
  // their manifest pin, and this same completed host response can disambiguate it.
  await session.page.evaluate(() => {
    const nativeFetch = window.fetch;
    window.deploymentTransfers = [];
    window.deploymentTransferHashes = [];
    window.deploymentLoads = [];
    window.fetch = async (input, init) => {
      const url = new URL(
        input instanceof Request ? input.url : input,
        location.href,
      );
      if (
        url.origin !== location.origin ||
        !url.pathname.startsWith('/bundle/')
      )
        return nativeFetch(input, init);
      const entry = {
        requestId: `deployment-${window.deploymentTransfers.length}`,
        url: url.href,
        load: window.deploymentLoad?.file,
        startedAt: Date.now(),
        aborted: false,
        canceled: false,
      };
      window.deploymentTransfers.push(entry);
      const headers = new Headers(
        init?.headers ?? (input instanceof Request ? input.headers : undefined),
      );
      headers.set('X-XYZ-Deployment-Request', entry.requestId);
      const signal =
        init?.signal ?? (input instanceof Request ? input.signal : undefined);
      entry.aborted = !!signal?.aborted;
      signal?.addEventListener(
        'abort',
        () => {
          entry.aborted = true;
        },
        { once: true },
      );
      const response = await nativeFetch(input, { ...init, headers });
      entry.status = response.status;
      if (response.body) {
        const getReader = response.body.getReader.bind(response.body);
        response.body.getReader = (...args) => {
          const reader = getReader(...args);
          const read = reader.read.bind(reader),
            cancel = reader.cancel.bind(reader);
          const chunks = [];
          reader.read = (...args) =>
            read(...args).then((result) => {
              if (result.value) chunks.push(result.value);
              if (result.done) {
                entry.completedAt = Date.now();
                window.deploymentTransferHashes.push(
                  (async () => {
                    const bytes = await new Blob(chunks).arrayBuffer();
                    entry.bytes = bytes.byteLength;
                    entry.sha256 = [
                      ...new Uint8Array(
                        await crypto.subtle.digest('SHA-256', bytes),
                      ),
                    ]
                      .map((byte) => byte.toString(16).padStart(2, '0'))
                      .join('');
                  })(),
                );
              }
              return result;
            });
          reader.cancel = (...args) => {
            entry.canceled = true;
            return cancel(...args);
          };
          return reader;
        };
      }
      return response;
    };
  });
  if (codecs.dracoPaths)
    await session.page.evaluate(
      async ({ script, wasm }) => {
        const { createDracoBrowserDecoder } =
          await import('/recipe/asset-recipe-browser-codecs.mjs');
        window.recipeDracoDecoder = await createDracoBrowserDecoder(
          script,
          wasm,
        );
      },
      {
        script: `/decoder/${basename(codecs.dracoPaths.decoder)}`,
        wasm: `/decoderWasm/${basename(codecs.dracoPaths.decoderWasm)}`,
      },
    );
  for (const [file, nativeTextures] of [
    ['model.gltf', true],
    ['fallback.gltf', false],
    ['manifest.json', undefined],
  ]) {
    const result = await session.page.evaluate(
      async ({ file, nativeTextures, renderer }) => {
        const engine = await import('/engine/src/index.js');
        const lifecycle = { file, startedAt: Date.now() };
        window.deploymentLoads.push(lifecycle);
        window.deploymentLoad = lifecycle;
        const game = await engine.Game.create({
          canvas: '#game',
          width: 256,
          height: 256,
          renderer,
          pixelRatio: 1,
        });
        let asset;
        try {
          asset =
            file === 'manifest.json'
              ? await engine.loadAssetBundle(
                  new URL('/bundle/manifest.json', location.href).href,
                  {
                    renderer: game.graphics,
                    loader: new engine.GLTFLoader(),
                    options: { dracoDecoder: window.recipeDracoDecoder },
                  },
                )
              : await new engine.GLTFLoader().load(
                  new URL(`/bundle/${file}`, location.href).href,
                  { nativeTextures },
                );
          const scene = new engine.Scene();
          scene.camera3D.position.set(0, 0, 3);
          scene.camera3D.lookAt(new engine.Vector3(0, 0, 0));
          scene.ambientLight = 1;
          scene.add(asset.scene);
          const textures = new Set();
          const visit = (node) => {
            if (node instanceof engine.Mesh)
              for (const value of Object.values(node.material))
                if (value instanceof engine.Texture) textures.add(value);
            for (const child of node.children) visit(child);
          };
          visit(asset.scene);
          const formats = [...textures].map((texture) => ({
            kind: texture.kind,
            levels: texture.levels?.length ?? 1,
            format: texture.format ?? 'raster',
            width: texture.width,
            height: texture.height,
          }));
          const failures = [];
          game.addEventListener('error', (event) =>
            failures.push(event.detail.message),
          );
          await game.start(scene);
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          );
          const canvas = document.querySelector('#game');
          const copy = document.createElement('canvas');
          copy.width = canvas.width;
          copy.height = canvas.height;
          const context = copy.getContext('2d', { willReadFrequently: true });
          const pixels = await new Promise((resolve) =>
            requestAnimationFrame(() => {
              context.drawImage(canvas, 0, 0);
              resolve(context.getImageData(0, 0, copy.width, copy.height).data);
            }),
          );
          let colored = 0;
          for (let i = 0; i < pixels.length; i += 4)
            if (pixels[i] > 80 || pixels[i + 1] > 80 || pixels[i + 2] > 80)
              colored++;
          if (!colored)
            throw new Error(
              'Packaged engine did not render visible model pixels. Verification expects the centered unit-size recipe fixture.',
            );
          if (failures.length) throw new Error(failures.join('\n'));
          return {
            file,
            renderer: game.graphics.backend,
            coloredPixels: colored,
            formats,
            bundleVariant: asset.bundleVariant,
            image: copy.toDataURL('image/png').split(',')[1],
          };
        } finally {
          lifecycle.destroyedAt = Date.now();
          try {
            game.destroy();
          } finally {
            asset?.dispose();
          }
        }
      },
      { file, nativeTextures, renderer },
    );
    const { image, ...measurement } = result;
    for (const texture of manifest.textures) {
      const native = result.bundleVariant?.nativeTextures ?? nativeTextures;
      const expected = native ? texture.levels : 1;
      if (
        !result.formats.some(
          (format) =>
            format.width === texture.width &&
            format.height === texture.height &&
            format.kind === (native ? 'native' : 'image') &&
            format.levels === expected,
        )
      )
        throw new Error(
          'Packaged loader did not preserve expected texture source/mip chain.',
        );
    }
    await writeFile(
      join(
        evidence,
        file === 'manifest.json'
          ? 'selected.png'
          : file === 'model.gltf'
            ? 'native.png'
            : 'fallback.png',
      ),
      Buffer.from(image, 'base64'),
      { flag: 'wx' },
    );
    results.push(measurement);
  }
  // Trusted browser click invokes the real engine unlock path. No synthetic AudioWorklet substitute.
  await session.page.evaluate(async () => {
    const engine = await import('/engine/src/index.js');
    window.consumerAudio = new engine.AudioManager(
      () => undefined,
      (error) => {
        throw error;
      },
    );
    document.querySelector('#unlock').onclick = () => {
      window.consumerUnlock = window.consumerAudio.unlock().then(
        () => ({ unlocked: window.consumerAudio.unlocked }),
        (error) => ({
          unlocked: false,
          error: {
            name: error.name,
            message: error.message,
            cause: error.cause?.message,
            stack: error.stack,
          },
        }),
      );
    };
  });
  await session.page.locator('#unlock').click();
  const audio = await session.page.evaluate(async () => {
    const result = await window.consumerUnlock;
    window.consumerAudio.destroy();
    return result;
  });
  await session.page.waitForLoadState('networkidle');
  const network = await session.page.evaluate(async () => {
    await Promise.all(window.deploymentTransferHashes);
    return {
      transfers: window.deploymentTransfers,
      loads: window.deploymentLoads,
    };
  });
  const completedStreamTeardowns = [];
  for (const failure of failedRequests) {
    const transfer = network.transfers.find(
      (entry) => entry.requestId === failure.requestId,
    );
    const pathname = new URL(failure.url).pathname;
    const expected = byteIdentities.get(pathname.slice('/bundle/'.length));
    const hosted = session.requests.filter(
      (entry) => entry.requestId === failure.requestId,
    );
    const lifecycle = network.loads.find(
      (entry) => entry.file === transfer?.load,
    );
    if (
      failure.errorText === 'net::ERR_ABORTED' &&
      failure.method === 'GET' &&
      failure.type === 'fetch' &&
      transfer &&
      expected &&
      lifecycle &&
      transfer.url === failure.url &&
      transfer.status === 200 &&
      !transfer.aborted &&
      !transfer.canceled &&
      transfer.completedAt <= failure.failedAt &&
      failure.failedAt < lifecycle.destroyedAt &&
      transfer.bytes === expected.bytes &&
      transfer.sha256 === expected.sha256 &&
      hosted.length === 1 &&
      hosted[0].url === pathname &&
      hosted[0].status === 200 &&
      hosted[0].finished &&
      hosted[0].bytes === expected.bytes &&
      hosted[0].sha256 === expected.sha256
    ) {
      completedStreamTeardowns.push({
        ...failure,
        transfer,
        hosted: hosted[0],
      });
    } else {
      errors.push(`Request failed: ${JSON.stringify(failure)}`);
    }
  }
  for (const request of session.requests)
    if (!request.finished || request.error || request.status >= 400)
      errors.push(`Host request failed: ${JSON.stringify(request)}`);
  await writeFile(
    join(evidence, 'network.json'),
    JSON.stringify(
      {
        ...network,
        failedRequests,
        completedStreamTeardowns,
        serverRequests: session.requests,
        errors,
      },
      null,
      2,
    ),
    { flag: 'wx' },
  );
  // AudioWorklet loading may occur outside Playwright's page-network target.
  // The actual static host records completed responses, independently of CDP visibility.
  const workletPath = '/engine/vendor/opm/dist/worklet/processor.js';
  const workletHash = checksum(
    await readFile(join(official, 'dist/worklet/processor.js')),
  );
  const worklets = session.requests.filter(
    (request) => request.url === workletPath,
  );
  if (
    !audio.unlocked ||
    !worklets.length ||
    worklets.some(
      (entry) => entry.status !== 200 || entry.sha256 !== workletHash,
    )
  )
    throw new Error(
      `Official AudioWorklet did not load successfully from the packed URL: ${JSON.stringify(
        {
          audio,
          worklets,
          pageWorklets,
          errors,
          serverRequests: session.requests,
          evidence,
        },
      )}`,
    );
  const report = {
    package: metadata.version,
    toolchain: session.toolchain,
    assetChecksums: manifest.files.length,
    vendorFiles: vendorFiles.length,
    results,
    audio,
    worklets,
    pageWorklets,
    completedStreamTeardowns,
    errors,
    evidence,
  };
  await writeFile(
    join(evidence, 'report.json'),
    JSON.stringify(report, null, 2),
    { flag: 'wx' },
  );
  if (errors.length) throw new Error(JSON.stringify(report));
  console.log(JSON.stringify(report));
} finally {
  await session.page
    .evaluate(() => window.consumerAudio?.destroy())
    .catch(() => {});
  await session.close();
}

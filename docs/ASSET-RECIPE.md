# Reproducible headless asset recipe

This development-time recipe uses the existing engine and pinned development browser. It adds no runtime dependency and never downloads a codec, invokes shell commands from an asset, or modifies the official OPM vendor tree. Runtime package metadata remains 1.8.0.

## Prerequisites and commands

Use **Node 26.7.0**, **pnpm 12.6.0**, **playwright-core 1.63.0**, and **Chromium 153.0.8010.12 (revision 1243)**. Pins live in `src/data/asset-recipe.ts`; the CLI checks both installed browser metadata and the launched browser version. Install dependencies with the existing frozen lockfile. If needed, explicitly install the known browser with `pnpm exec playwright-core install chromium`. A `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` override must still match the pin. The recipe itself never installs or downloads anything.

Build the engine first; preflight imports its actual `dist/src/index.js` in a localhost headless browser, not a second glTF implementation.

```sh
pnpm build
node scripts/build-assets.mjs --input examples/asset-recipe/source.gltf --out /tmp/xyz-assets-a
node scripts/build-assets.mjs --input examples/asset-recipe/source.gltf --out /tmp/xyz-assets-b
diff /tmp/xyz-assets-a/SHA256SUMS /tmp/xyz-assets-b/SHA256SUMS
pnpm pack --pack-destination /tmp
mkdir /tmp/xyz-packed-consumer
tar -xzf /tmp/xyz.js-1.8.0.tgz -C /tmp/xyz-packed-consumer
node scripts/verify-asset-deployment.mjs --package /tmp/xyz-packed-consumer/package --bundle /tmp/xyz-assets-a --renderer webgl2
node scripts/verify-asset-deployment.mjs --package /tmp/xyz-packed-consumer/package --bundle /tmp/xyz-assets-a --renderer webgpu
```

Use new output/extraction directories. `--input` and `--out` are required in that order. glTF JSON and GLB v2 are accepted; textures may be referenced locally, embedded in GLB views, or carried in canonical base64 data URIs. Network resources, query/fragment resource URLs, traversal, and symlink escape outside the input file's directory are rejected. PNG/JPEG and other static raster formats supported by the pinned browser are decoded headlessly. Plain RGB(A) KTX2 with no or ZLIB supercompression is supported. Animated image inputs are not an animation pipeline.

Requested package script entries (integration owner adds these):

```json
{
  "assets:build": "node scripts/build-assets.mjs",
  "check:asset-deployment": "node scripts/verify-asset-deployment.mjs"
}
```

For example: `pnpm assets:build --input authoring/model.glb --out public/assets/model`.

## Preflight and conversion

The profile is **glTF 2.0, triangle topology, one TEXCOORD_0 stream, engine-supported materials/extensions**. Preflight rejects UV1, absent UVs on textured primitives, conflicting per-material texture transforms, unsupported material extensions, incompatible unlit/PBR combinations, required external codecs, invalid primitive counts, and entry/vertex/index/skin/morph budgets. The packaged GLTFLoader then validates both generated variants, including accessors, node hierarchy, skins, animations, material values, image decoding, meshopt decoding, and aggregate engine resource budgets, before publication.

All actual buffer payloads are packed into one 4-byte-aligned `payload.bin`; every bufferView and preserved meshopt compressed-source offset is relocated. GLB embedded images are externalized. Used texture sources are converted to:

- `texture-<sha256>.ktx2`: genuine uncompressed **RGBA8 UNORM** KTX2 with a standard data format descriptor and a full native mip chain down to 1×1;
- `texture-<sha256>.png`: deterministic RGBA PNG base-level fallback.

Mip generation is a specified integer box filter, including odd edge texels, performed on the decoded RGBA bytes. It does **not** apply gamma-aware filtering, normal-map renormalization, semantic color-space inference, or lossy/compressed GPU encoding. Alpha is filtered as a separate channel. Browser canvas readback can quantize translucent decoded colors; this is a deterministic raster conversion, not a promise to preserve original encoded-image bytes. Reproducibility requires the same pinned toolchain/platform and identical input bytes. PNG uses Node's pinned zlib with filter 0 and compression level 9; output has no timestamps or absolute source paths. Texture payload filenames deduplicate identical converted bytes.

Meshopt payloads are preserved and checked by the built-in engine decoder; this recipe is **not** a meshopt encoder. Virtual meshopt fallback buffers with no real payload require an external uncompressed authoring export. Draco and Basis are **not included**. Optional Draco data is removed only when every accessor has an uncompressed bufferView; optional Basis is removed only when a regular image source exists. Required Draco/Basis, compressed KTX2, and missing fallbacks fail with an explicit diagnostic. No external adapter or binary is configured, and no arbitrary manifest command can run. If an external codec recipe is introduced later it must independently pin its version and verify the binary checksum before execution; installing an unknown binary is not a fallback.

## Bundle and browser consumer

`model.gltf` selects native RGBA mip images. `fallback.gltf` selects generated PNGs. `manifest.json` records exact toolchain, codec requirements, model options, texture dimensions/levels, input checksums, and every payload's size/SHA-256. `SHA256SUMS` also covers the manifest. The manifest is an offline bundle descriptor, **not** an executable `AssetManifest` instance or an automatic runtime fallback negotiator.

Deploy the entire bundle beside the **complete extracted package `dist/`**, including `dist/vendor/opm/`. Use HTTPS (or localhost). A plain static HTTP server suffices; no Vite, bundler, npm package resolver, or development source import is required.

```js
import { GLTFLoader } from '/engine/dist/src/index.js';
const asset = await new GLTFLoader().load('/assets/model/model.gltf', {
  nativeTextures: true,
});
scene.add(asset.scene);
// Explicit legacy/raster alternative, chosen by the application:
// new GLTFLoader().load('/assets/model/fallback.gltf', { nativeTextures: false });
// Remove scene consumers before asset.dispose(); the asset owns its textures.
```

The deployment verifier expects the included centered, unit-size `source.gltf` fixture (or an asset similarly visible from `(0,0,3)`); it is a reproducible real-browser deployment probe, not an automatic model-framing viewer. It verifies all bundle hashes and rejects missing/untracked files. It compares the **complete official vendor tree**, including LICENSE and provenance, byte-for-byte with the extracted package. Then it imports the package root through plain localhost HTTP, renders native and fallback variants through actual `Game → Scene → Renderer`, checks visible model pixels and actual texture kind/mip levels, and uses a trusted browser click to call the real AudioManager unlock. Successful official AudioWorklet URL responses and unlocked state are required. This verifies worklet deployment/initialization, **not audible playback** or cross-browser certification. WebGPU is an explicit separate backend run, never silently replaced by WebGL2. Canvas2D remains 2D-only.

Worklet fetch evidence comes from completed responses recorded by the actual localhost static server, with the served processor's SHA-256 checked against the official vendor bytes. Playwright page-network observations are supplementary: worklet-isolate requests need not appear in that page target. Failure diagnostics include unlock result/cause, both network observation sources, browser request failures, and the evidence directory; neither a missing page event nor a plain manual `fetch()` substitutes for successful native unlock.

The verifier prints JSON measurements and an `evidence` directory containing `native.png` and `fallback.png` captured from the actual rendered canvas. Retain these as acceptance evidence, inspect them, and remove that temporary directory when no longer needed.

## Ownership, budgets, and failures

Inputs and existing outputs are never overwritten. Conversion stages in a uniquely owned sibling temporary directory, reserves the final output exclusively, then publishes the completed directory by rename. Error cleanup removes only the staging directory (and an empty publication reservation if rename failed). Browser pages, browser process, and localhost server are closed on success/failure; acquired engine models are disposed. Parent directories created for the requested destination may remain empty after failure. A forcibly killed process can leave a `.xyz-assets-*` staging directory; remove only the identified abandoned directory.

Input and decoded resource ceilings reuse `src/data/models.ts` / `src/data/assets.ts`: 32 MiB model input, 128 MiB fetched/decoded model budget, 10,000 entries, 1,000,000 vertices, 3,000,000 indices, 256 joints, 64 morph targets, 8 MiB per fetched texture, at most 8,192 pixels per side / 4,194,304 raster pixels. Both native KTX2 and PNG must fit the 8 MiB image fetch ceiling. The additional bundle ceiling is 128 MiB / 20,004 files. These are offline bounded-output and engine-compatibility checks, **not** an OS sandbox, a global concurrent-memory budget, or protection against transient allocation inside platform image decoders. Only trusted authoring inputs should be raster-decoded.

Regression coverage is `tests/asset-recipe.test.mjs`: corrupt GLB ranges, topology/UV/material incompatibilities, missing external codecs/fallbacks, odd-dimension mip content through the real KTX2 decoder, out-of-range packing views, and symlink escape. Implementation and fixture are present; acceptance results must be recorded only after the integration owner runs the commands above.

# Reproducible headless asset recipe

This **v1.10 / 1.10.0** development recipe uses the existing engine and pinned development browser. It adds no runtime dependency and never downloads codecs, executes asset-provided commands, or modifies official OPM bytes. Historical P50 evidence remains in ACCEPTANCE; release verification does not imply cross-platform codec certification.

## Prerequisites and commands

Use **Node 26.7.0**, **pnpm 12.6.0**, **playwright-core 1.63.0**, and **Chromium 153.0.8010.12 (revision 1243)**. Pins live in `src/data/asset-recipe.ts`; the CLI checks both installed browser metadata and the launched browser version. Install dependencies with the existing frozen lockfile. If needed, explicitly install the known browser with `pnpm exec playwright-core install chromium`. A `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` override must still match the pin. The recipe itself never installs or downloads anything.

The engine package supports Node.js 22 and later. This reproducibility recipe independently requires its exact Node 26.7.0 pin; it is not the engine's minimum Node version.

Build the engine first; preflight imports its actual `dist/src/index.js` in a localhost headless browser, not a second glTF implementation.

```sh
pnpm build
node scripts/build-assets.mjs --input examples/asset-recipe/source.gltf --out /tmp/xyz-assets-a
node scripts/build-assets.mjs --input examples/asset-recipe/source.gltf --out /tmp/xyz-assets-b
diff /tmp/xyz-assets-a/SHA256SUMS /tmp/xyz-assets-b/SHA256SUMS
pnpm pack --pack-destination /tmp
mkdir /tmp/xyz-packed-consumer
tar -xzf /tmp/xyz.js-1.10.0.tgz -C /tmp/xyz-packed-consumer
node scripts/verify-asset-deployment.mjs --package /tmp/xyz-packed-consumer/package --bundle /tmp/xyz-assets-a --renderer webgl2
node scripts/verify-asset-deployment.mjs --package /tmp/xyz-packed-consumer/package --bundle /tmp/xyz-assets-a --renderer webgpu
```

Use new output/extraction directories. `--input` and `--out` are required in that order. glTF JSON and GLB v2 are accepted; textures may be referenced locally, embedded in GLB views, or carried in canonical base64 data URIs. Network resources, query/fragment resource URLs, traversal, and symlink escape outside the input file's directory are rejected. PNG/JPEG and other static raster formats supported by the pinned browser are decoded headlessly. Plain RGB(A) KTX2 with no or ZLIB supercompression is supported. Animated image inputs are not an animation pipeline.

Package script entries:

```json
{
  "assets:build": "node scripts/build-assets.mjs",
  "check:asset-deployment": "node scripts/verify-asset-deployment.mjs"
}
```

For example: `pnpm assets:build --input authoring/model.glb --out public/assets/model`.

## Preflight and conversion

The profile is **glTF 2.0, triangle topology, one TEXCOORD_0 stream, engine-supported materials/extensions**. Preflight rejects UV1, absent UVs on textured primitives, conflicting per-material transforms, unsupported extensions/material combinations, invalid primitive counts and resource budgets. Required external codecs need independently pinned tools; absent tools/fallbacks reject. The packaged GLTFLoader validates generated variants, accessors, hierarchy, skins, animations, materials, images and aggregate budgets before publication.

All actual buffer payloads are packed into one 4-byte-aligned `payload.bin`; every bufferView and preserved meshopt compressed-source offset is relocated. GLB embedded images are externalized. Used texture sources are converted to:

- `texture-<sha256>.ktx2`: genuine uncompressed **RGBA8 UNORM** KTX2 with a standard data format descriptor and a full native mip chain down to 1×1;
- `texture-<sha256>.png`: deterministic RGBA PNG base-level fallback.

V2 filtering is explicit per texture: `kind: 'linear' | 'srgb' | 'normal'`, `alpha: 'straight' | 'premultiplied' | 'opaque'`. sRGB filters in linear light; normals are renormalized; alpha policy participates in filtering, including odd edges. Without a profile the default is linear/straight, not inferred material semantics. Browser raster readback can quantize translucent colors; original encoded bytes are not promised. PNG uses pinned Node zlib, filter0/level9, with no timestamps/absolute paths. Same toolchain/platform/input/profile is required for reproducibility.

`--profile trusted-profile.json` follows `--input … --out …`. Version2 profile declares `formats: ['bc','etc2','astc']`, `textures` keyed by source URI and optional `defaultTexture`; `tools.basis` declares path/SHA-256/version2.50/platform/arch. Official Basis v2_50 supplies UASTC universal KTX2 and native BC7/ETC2 RGBA8/ASTC4×4 chains. `tools.draco` pins official draco3d1.5.7 module files; optional `draco` enables encoding, producing compressed and expanded geometry variants. Tools are external trusted build prerequisites, never runtime dependencies. Hashes are rechecked before fixed-argv execution, with bounded output/timeout; no manifest shell commands. Meshopt is preserved/decoded, not encoded.

Draco adapter requests carry accessor componentType/normalized metadata. Raw integers, normalized logical values and semantic streams must stay distinct; UINT32 adapter preservation above Float32 exact range does not certify the entire consumer path. Official upper-UInt32 encoder rejection and existing custom UINT32→Float32 loader limits remain. Required Basis/Draco without verified tools and unavailable real fallback fail explicitly.

## Bundle and browser consumer

Version2 manifest profile is `xyz-gltf2-semantic-platform-v2`: ordered native/compressed/Draco variants followed by an obligatory codec-free raster fallback, exact toolchain/input checksums, dimensions/levels and file sizes/SHA-256. SHA256SUMS also covers the manifest. This descriptor is distinct from authoring AssetManifest. Runtime `loadAssetBundle` selects the first compatible variant from renderer 3D/dimensions/native formats/block restrictions and codec availability, verifies fetched snapshots, and parses through GLTFLoader. Only availability selects fallback before decode; hash/fetch/parse/decode failure is fatal, never silent downgrade. Optional trusted manifestSHA256 pins descriptor integrity; self-declared hashes are not signatures.

Deploy the entire bundle beside the **complete extracted package `dist/`**, including `dist/vendor/opm/`. Use HTTPS (or localhost). A plain static HTTP server suffices; no Vite, bundler, npm package resolver, or development source import is required.

```js
import { GLTFLoader, loadAssetBundle } from '/engine/dist/src/index.js';
const asset = await loadAssetBundle('/assets/model/manifest.json', {
  renderer: game.graphics,
  loader: new GLTFLoader(),
  // options: { dracoDecoder }, // independently supplied external adapter
});
scene.add(asset.scene);
// Remove consumers before asset.dispose(); the asset owns its textures.
```

The deployment verifier expects the included centered, unit-size `source.gltf` fixture (or an asset similarly visible from `(0,0,3)`); it is a reproducible real-browser deployment probe, not an automatic model-framing viewer. It verifies all bundle hashes and rejects missing/untracked files. It compares the **complete official vendor tree**, including LICENSE and provenance, byte-for-byte with the extracted package. Then it imports the package root through plain localhost HTTP, renders native and fallback variants through actual `Game → Scene → Renderer`, checks visible model pixels and actual texture kind/mip levels, and uses a trusted browser click to call the real AudioManager unlock. Successful official AudioWorklet URL responses and unlocked state are required. This verifies worklet deployment/initialization, **not audible playback** or cross-browser certification. WebGPU is an explicit separate backend run, never silently replaced by WebGL2. Canvas2D remains 2D-only.

Worklet fetch evidence comes from completed responses recorded by the actual localhost static server, with the served processor's SHA-256 checked against the official vendor bytes. Playwright page-network observations are supplementary: worklet-isolate requests need not appear in that page target. Failure diagnostics include unlock result/cause, both network observation sources, browser request failures, and the evidence directory; neither a missing page event nor a plain manual `fetch()` substitutes for successful native unlock.

The verifier prints JSON measurements and an `evidence` directory containing `native.png` and `fallback.png` captured from the actual rendered canvas. Retain these as acceptance evidence, inspect them, and remove that temporary directory when no longer needed.

## Ownership, budgets, and failures

Inputs and existing outputs are never overwritten. Conversion stages in a uniquely owned sibling temporary directory, reserves the final output exclusively, then publishes the completed directory by rename. Error cleanup removes only the staging directory (and an empty publication reservation if rename failed). Browser pages, browser process, and localhost server are closed on success/failure; acquired engine models are disposed. Parent directories created for the requested destination may remain empty after failure. A forcibly killed process can leave a `.xyz-assets-*` staging directory; remove only the identified abandoned directory.

Input and decoded resource ceilings reuse `src/data/models.ts` / `src/data/assets.ts`: 32 MiB model input, 128 MiB fetched/decoded model budget, 10,000 entries, 1,000,000 vertices, 3,000,000 indices, 256 joints, 64 morph targets, 8 MiB per fetched texture, at most 8,192 pixels per side / 4,194,304 raster pixels. Both native KTX2 and PNG must fit the 8 MiB image fetch ceiling. The additional bundle ceiling is 128 MiB / 20,004 files. These are offline bounded-output and engine-compatibility checks, **not** an OS sandbox, a global concurrent-memory budget, or protection against transient allocation inside platform image decoders. Only trusted authoring inputs should be raster-decoded.

Acceptance records historical P50 and new external-codec runs separately. The handoff records two identical real-tool builds (19 files / 22,596 bytes) with manifest SHA-256 `55cb924956142f0fe1ad06ec2ade7d0619353c218dd0dbf410ddd6fb79210923`, using official Basis v2_50 commit `9bebe16726b3a61c8c213eeee3b7cffb462ef34e` and Draco1.5.7. This is same-host reproducibility, not cross-platform codec equality or physical audio/device certification. Deployment/runtime evidence remains owned by ACCEPTANCE, including any unresolved diagnostics; do not infer success merely from a generated bundle.

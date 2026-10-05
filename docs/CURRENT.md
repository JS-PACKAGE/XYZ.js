---
title: Current contracts · v1.16
---

# XYZ.js v1.16 — current contracts

**Normative for package 1.16.0, Apache-2.0, browser runtime, zero runtime dependencies.** npm remains unpublished. This page describes current supported profiles including P104–P118, not an acceptance report or upstream compatibility promise. [GitHub v1.16](https://github.com/JS-PACKAGE/XYZ.js/releases/tag/v1.16) is published after the existing CI gate, with its downloaded archive/checksum verified; the historical v1.14 archive does not contain P104–P118. Historical dates, test counts, release versions and originally excluded features remain in [ACCEPTANCE](https://github.com/JS-PACKAGE/XYZ.js/blob/main/ACCEPTANCE.md). English / 繁體中文 / 日本語：目前契約／現在の契約。Older exclusions do not override the current profiles below.

## Public API and distribution

The supported public entry is `xyz.js` (or the complete built tree's `engine/src/index.js` on the static site). It exports core, graphics, math, assets, input and audio; ECS is an internal model, not a separate root export. Use the generated **API v1.16.0** portal for exact classes, types, methods and overloads. Its search includes API names, comments and this document; inherited members can be shown with the visibility filters.

`pnpm docs:api` generates `.vite/site/api/1.16.0/` and its documentation landing pages. `pnpm build:site` builds the examples and the same searchable API into the complete `.vite/site/` distribution. Serve over HTTP/HTTPS and open `docs/` or `api/1.16.0/`; generated HTML is not tracked or included in the engine tarball. Relative API links and search assets stay within the version directory, so deployment under a path prefix does not require URL rewriting. Source documentation is not a claim that the hosted site has been deployed.

For standalone consumers, build and pack, then use `node scripts/create-game.mjs /absolute/my-game --template 2d --package /absolute/xyz.js-1.16.0.tgz --name my-game` (or `3d`). Deploy the complete starter `dist/`. No-bundler engine deployment likewise requires the complete engine `dist/`, including the unchanged official `dist/vendor/opm/` distribution and licenses.

CommonJS and ESM use separate constructor graphs. Choose one format for every
engine object in an application; cross-format Texture/Scene/Mesh instances are
not interchangeable. Canonical type declarations do not imply shared runtime
identity. CDN metadata selects ESM; the GitHub release does not publish npm.

## Capability matrix

These are implementation profiles, **not three-backend equivalence or physical qualification**. Check `game.graphics.capabilities` and optional renderer methods instead of inferring support from the backend name.

| Surface                                                                                    | WebGPU                                          | WebGL2                                          | Canvas2D / shared boundary                                                                            |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Sprite, atlas, text, HUD/UI, raster paths, isolation, masks, basic blends, render textures | Supported                                       | Supported                                       | Supported; raster paths/text are texture-backed, not native vector tessellation                       |
| Native Material2D, Filter2D, Mesh2D, shader postprocessing                                 | Supported, native WGSL                          | Supported, native GLSL                          | Explicitly unsupported; no software shader/3D fallback                                                |
| Mesh/PBR, instancing, skinning, shadows, 3D postprocessing                                 | Supported                                       | Supported subject to capabilities/extensions    | No visible 3D; HDR/weighted transparency on GL require float color attachments                        |
| Native compressed textures / supplied mips                                                 | Capability-gated formats                        | Capability-gated formats                        | Native sources rejected; select a real raster fallback                                                |
| GPU 3D particles                                                                           | Native analytic vertex particles; prepare first | Native analytic vertex particles; prepare first | Explicitly unsupported; CPU Sprite-particle profiles remain available                                 |
| Initialization                                                                             | `auto` tries WebGPU → WebGL2 → Canvas2D         | Forced backend never switches                   | `auto` fallback is initialization-only                                                                |
| Runtime loss                                                                               | Default same-backend recovery                   | Default same-backend recovery                   | Recreate renderer-owned targets/snapshots after recovery; failure or `recoverGraphics:false` is fatal |

WebGPU and AudioWorklet require a secure origin (localhost is allowed). Device availability is not implied by `navigator.gpu`; the current public compute profile is the bounded WebGPU-only ComputeProgram/ComputeBuffer API. Native shader/particle descriptors must be prepared before rendering; callers own their destruction after removing consumers. Auto presentation uses a copy to the original canvas and is not a performance-equivalent forced backend.

## Shared subsystem profiles

| Surface                         | Current support and important bounds                                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lifecycle / simulation          | Game/Scene ownership, atomic prepared-scene publication, cooperative abort, fixed gameplay updates and opt-in physics interpolation. Time is seconds; pause/hidden time does not accumulate. Do not update physics again inside `fixedUpdate`.                                                                                                          |
| Assets / glTF                   | Task-based preload, manifest/bundles, ResourcePool leases/scopes, bounded streamed reads and cleanup. glTF triangles, UV0/UV1, independent per-map texture transforms, four/eight skin influences, morph and `COLOR_0`; `COLOR_1` and unsupported required extensions reject. Meshopt is built in; Draco/Basis use explicitly supplied external codecs. |
| Asset production                | Semantic platform bundles contain capability-selected variants and a codec-free raster fallback. Preflight accepts `TEXCOORD_0` and `TEXCOORD_1`, requires each textured primitive's selected stream, and keeps material-map transforms independent. Default KTX2 decoding is base-level RGBA8; native sources preserve supported payloads/mips.        |
| Physics2D                       | Dynamic/static/kinematic bodies, sleep, five joints, static concave decomposition/chains, convex character sweep/slide/platform carry and bounded relative translation/rotation CCD. Sensors are discrete; no dynamic concave/compound/deforming sweeps.                                                                                                |
| Physics3D / navigation          | Bounded primitive dynamic bodies, joints, relative/angular CCD, capsule character/crouch/moving support, queries; graphs, polygon navmeshes, layered/partitioned sampled worlds and collision-derived navigation use documented work/storage quotas, not unlimited world size.                                                                          |
| Animation                       | Ordered layers, masks, reference-relative additive animation, fades/crossfades, state machines, 1D/triangulated 2D blend trees, two-bone IK, GPU skinning with lazy CPU queries and conservative animated bounds.                                                                                                                                       |
| Content / input / accessibility | Tiled JSON including bounded infinite chunks/groups/parallax/animation/templates; input contexts, remapping and portable settings/saves; semantic-only DOM focus/activation mirror. A semantic mirror is not DOM-rendered gameplay or assistive-technology certification.                                                                               |
| Audio                           | Immutable official OPM.js v1.11.1 bytes (tag v1.11.1), eight slots/contexts including release; native samples reuse the first unlocked context. Gesture unlock precedes decode/play; Game pause does not automatically pause audio. Native effects/automation/ducking/world bindings do not imply audible hardware verification.                        |
| Scale / rendering budgets       | Visibility/LOD/HLOD, streaming, workers, bounded light/shadow selection and observability. Worker results still incur main-thread Geometry validation/copy. Per Scene: up to 1024 point and 1024 spot lights; per draw: 32 each; shadows: four cascades/eight point/eight spot.                                                                         |
| Deployment / compatibility      | 1.x additive profiles, optional renderer extensions, standalone 2D/3D starters, strict-CSP hosting and opt-in offline assets. Offline support does not cache arbitrary missing resources or relax origin/security rules.                                                                                                                                |

Official OPM.js v1.11.1 (tag `v1.11.1`) normalizes voices to v7 internally; the engine-exposed `OPMVoice` retains the published `version: 1` contract. `game.audio.opm` is the engine's legacy compatibility facade backed by the first official instance, not that native instance itself. It preserves writable context/node handles and a mutable voice `Map` with v1 voices. Direct escape-hatch use still bypasses engine budgeting and lifecycle management; managed playback and teardown continue to use official `panic()`/`dispose()` internally without modifying vendor bytes.

### Reusable procedural PBR materials

The root exports `ProceduralMaterial`, `ProceduralMaterialKind` (`'wood' | 'brick' | 'stone' | 'metal' | 'fabric' | 'marble'`) and `ProceduralMaterialOptions` (`size?: number; seed?: number`). `await ProceduralMaterial.create(kind, options?)` generates deterministic, seamlessly periodic immutable maps once on the CPU, without external assets or new dependencies. `size` is an integer 32–1024 (default 256); `seed` is an unsigned 32-bit integer 0–4294967295 (default 1). Invalid inputs reject.

The caller owns the returned preset, whose readonly `kind`, `material: PBRMaterial` and `textures` expose four `Texture` sources: `baseColor` (sRGB RGB), `normal` (linear tangent-space), `metallicRoughness` (linear G roughness/B metallic) and `occlusion` (linear R). Defaults are opaque, repeat sampling for all slots, roughness factor 1 and metallic factor 1 for metal or 0 otherwise. `createMaterial(options?: Partial<PBRMaterialOptions>)` creates a fresh material borrowing its maps, with caller overrides applied last.

Remove all consumers before calling synchronous, idempotent `destroy()`, which releases only generated textures, not override textures or materials. Mesh/Scene do not automatically own the preset. The `destroyed` getter reports state; `createMaterial()` rejects after destruction. Core generation uses assets' existing `Texture.fromImage`; geometry and backend rendering stay unchanged, with no frame-time generation. The [pbr3d gallery](https://github.com/YueyuHoshizora/XYZ.js/tree/main/examples/pbr3d) offers six presets and texture-map previews. Canvas2D remains 2D-only. Actual browser/runtime verification is recorded separately in ACCEPTANCE.

## P104–P118 additive profiles in the current source

These approved profiles are integrated in package 1.16.0. Publication does not
certify runtime/browser behavior beyond the recorded scope; actual evidence and
remaining gaps belong in [ACCEPTANCE](../ACCEPTANCE.md). Public names and exact
signatures are in the generated root API.

| Area                            | Contract and boundary                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CommonJS / delivery             | The package has separate CommonJS and ESM consumer entries; CDN metadata remains canonical ESM. The strict package inventory must explicitly cover each reviewed output, including CommonJS artifacts. A package build is not npm publication.                                                                                                                        |
| Atlas / distance-field fonts    | The asset producer accepts atlas, bitmap, SDF and MSDF profiles and emits pages plus descriptors consumed by existing loaders. SDF is a single-channel distance field; MSDF uses independently encoded RGB edge distances, not three duplicate SDF channels.                                                                                                          |
| Asset watch / scene reload      | `xyz-assets watch` publishes immutable generations and advances `current.json` only on successful builds. Failed builds retain the previous generation; polling and retained generations are bounded. Vite scene reload replaces a Scene only after its candidate succeeds; it does not create another game loop or canvas owner.                                     |
| Narrative                       | CutsceneDirector uses Scene simulation time for tracks/cues, seek, pause, cancel, repeat and barriers. Dialogue supports validated branching, conditions, variables and locale data; QuestSystem bounds progress and validates restored state so rewards are not replayed.                                                                                            |
| Crowd / physics profiles        | Crowd steering uses reciprocal-avoidance constraints with bounded neighbor work and stable ordering, then submits preferred motion through character sweep. Physics vehicle suspension/tire forces, ragdoll joint/bone blending, soft-body springs/contacts and debug lines are bounded profiles, not general-purpose high-fidelity simulation.                       |
| RNG / object pool               | SeededRandom supports reproducible state save/restore/clone and bounded integer/choose/shuffle operations. ObjectPool has fixed capacity and explicit create/reset/destroy callbacks; release ownership, reset failure and terminal destruction are defined.                                                                                                          |
| Native 2D lighting              | GPU/GL Sprite normal-map shading supports bounded lights and world/screen lighting. Canvas2D explicitly rejects this feature; combining it with a custom material is unsupported.                                                                                                                                                                                     |
| Video texture                   | VideoTexture updates a stable canvas-backed source from decoded frames; VideoTextureDecoder accepts encoded elementary chunks through WebCodecs, not MP4/container demux. Caller controls decoder configuration and ownership.                                                                                                                                        |
| GPU compute                     | ComputeProgram/ComputeBuffer expose bounded WGSL dispatch and typed storage readback on WebGPU. WebGL2 and Canvas2D explicitly report unsupported; buffer contents must be recreated/reuploaded after loss.                                                                                                                                                           |
| Render graph / temporal effects | Render graphs validate immutable DAGs and explicit native passes/inputs; descriptors are borrowed. TAA uses jittered history/reprojection and reset conditions; SSR ray-marches depth with environment fallback. Reflection probes capture six scene views and blend bounded environment layers. These are not Canvas features or universal image-quality guarantees. |
| Text3D / visibility             | Text3D remains browser-rasterized canvas text, not SDF mesh text. Async updates are latest-wins and preserve the prior result on failure. Existing instance/morph culling is retained; no duplicate culling API is implied.                                                                                                                                           |

WebCodecs/container support, arbitrary MSDF font-outline parsing, unbounded simulation,
Canvas shader/compute/3D fallbacks, and cross-browser qualification are not implied.

Live 3D maps are additive overrides: TextureMaterialOptions.textureSource,
PBRMaterialOptions.sources and NativeMaterial3DOptions.textureSources. Existing
immutable Texture options/getters retain their types; a real borrowed fallback
is required for the base map. Renderer upload/cache/shadow tracking uses effective
sources and versions. Remove all consumers before releasing borrowed maps.

No Visual Editor, Visual Scripting, Shader Graph, Networking, native desktop runtime, JavaScript software rasterizer, shader transpiler, full glTF extension set or drop-in three.js/PixiJS/Excalibur parity is promised.

Installed asset projects use the development CLI `xyz-assets preflight --manifest project.json` and `xyz-assets build --manifest project.json --out NEW_DIRECTORY` (`--profile trusted-profile.json` is build-only). The version-1 project manifest's unique-ID entries cover model/map/tileset/atlas/bitmapFont/font/texture/json/text/binary, local relative dependencies and named bundles. Preflight validates bounded immutable snapshots through real parsers/loaders; build publishes a new checksummed deployment, never overwrites inputs, and cancels/cleans owned browser/staging work. Model-only `recipe:true` invokes semantic conversion. External browser/codec development tooling is explicit, not an engine runtime dependency; see the asset recipe link below.

## Task-based acquisition, abort and cleanup

A `PreloadBatch` owns **cancellation**, not generic returned resources. Shared texture/audio cache acquisitions borrow loader-owned resources; cancelling one subscriber does not destroy shared data. A `GLTFLoader.task` is a unique acquisition: unsuccessful/cancelled batch work disposes that task's model. Successful ownership transfers to the consumer, which must dispose the model after removing its users. Custom tasks must implement their own partial-failure cleanup and observe the supplied signal.

This example runs after `game` has been created. Supply a real model URL and an `AbortSignal`; it does not unlock or play audio. Types/classes are imported from the root entry, never private package paths.

```ts
import {
  GLTFLoader,
  PreloadBatch,
  Scene,
  type Game,
  type GLTFAsset,
} from 'xyz.js';

async function showModel(game: Game, url: string, signal: AbortSignal) {
  const batch = new PreloadBatch([new GLTFLoader().task('model', url)]);
  let model: GLTFAsset | undefined;
  const scene = new Scene();
  try {
    model = (await batch.load({ signal })).get('model') as GLTFAsset;
    signal.throwIfAborted();
    scene.add(model.scene);
    await game.setScene(scene, { signal });
    // Successful model ownership belongs to this application.
    return async () => {
      if (game.scene === scene) await game.setScene(new Scene());
      else scene.destroy();
      model?.dispose(); // Consumers are gone before textures are disposed.
    };
  } catch (error) {
    scene.destroy();
    model?.dispose();
    throw error;
  }
}

const pending = new AbortController();
// const releaseModel = await showModel(game, '/models/scene.glb', pending.signal);
// pending.abort() cancels preparation; after success await releaseModel() on teardown.
```

The returned cleanup first removes the Scene's consumers. Abort after a completed batch is not an automatic lifetime manager. Scene preparation failure leaves the prior active Scene intact; use Scene's `preload(game, signal)` barrier when acquiring resources for atomic scene switching. Scene destroys its owned objects, but borrowed textures/material descriptors and loader-owned assets require their respective owner cleanup. Game.destroy tears down its renderer, input, audio and asset loaders; it does not replace disposal of independently acquired GLTF assets.

## Support evidence is a separate contract

Managed Chromium/Firefox/WebKit browser runs establish only their recorded paths. **Managed WebKit is not Safari**, injected touch/gamepad is not physical hardware, `GPUDevice.destroy()` is not uncontrolled driver reset, native signal analysis is not hearing speakers, and RAF/RSS are not presentation completion/VRAM. Physical Safari/mobile/gamepad/IME/audio/assistive-technology/low-tier/driver qualification remains blocked where real fixtures are unavailable; tools must report that explicitly, never substitute emulation.

Configured Windows CI testing does not certify physical Windows hardware or drivers. Browser qualification expands only with actual recorded evidence for the tested browser, host and paths; a configured job or pending CI run is not a passing result.

Windows hosted Chromium uses Microsoft's **WARP CPU rasterizer** through ANGLE D3D11 and Dawn, not a physical GPU. Historical [CI run 37085323026, attempt 1](https://github.com/YueyuHoshizora/XYZ.js/actions/runs/37085323026/attempts/1) passed Windows Node22/24/26 quality, 1058 tests, build, API compatibility and negative-smoke, but package creation and browser gates failed. [Run 37092521565](https://github.com/YueyuHoshizora/XYZ.js/actions/runs/37092521565) additionally passed all three Windows installed-package/CLI gates, signed native endpoint bootstraps and the complete Firefox job; Chromium WebGL pixels and WebKit pixels/audio still fail. The user-approved official SHA256-pinned, Authenticode-verified [VB-CABLE](https://vb-audio.com/Cable/) bootstrap remains ephemeral-CI-only. The runner's existing Code Integrity flags `0x282203` remain unchanged; this is not test-signing-prohibited environment qualification. Official installer/SYS/Microsoft catalog signatures remain mandatory. Unverified signatures, debugger bypass, changed flags, added TrustedPublisher certificates, unexpected installer exits or missing active default render endpoints fail the gate. No reboot, emulated unlock or driver distribution is allowed. [Upstream donationware licensing](https://vb-audio.com/Services/licensing.htm), including professional-use obligations, applies.

Historical guides and upgrade profiles: [English usage](https://github.com/YueyuHoshizora/XYZ.js/blob/main/docs/USAGE.md), [繁體中文使用說明](https://github.com/YueyuHoshizora/XYZ.js/blob/main/docs/USAGE-zh.md), [English technical reference](https://github.com/YueyuHoshizora/XYZ.js/blob/main/docs/TECHNICAL.md), [繁體中文技術參考](https://github.com/YueyuHoshizora/XYZ.js/blob/main/docs/TECHNICAL-zh.md), [asset recipe](https://github.com/YueyuHoshizora/XYZ.js/blob/main/docs/ASSET-RECIPE.md). These retain historical version strings/counts; this page and the generated root API are the current entry points.

## Performance qualification

Run `node scripts/production-workloads.mjs --calibrate /absolute/new-profile.json --runs 5 --renderer webgl2` against the built engine to collect planned repeated measurements without retries or overwriting an existing profile. Calibration writes **CALIBRATED_NOT_CERTIFIED**; review/pin the host/GPU/backend/quality/workload provenance and bounds, then independently run `node scripts/production-workloads.mjs --profile /absolute/reviewed-profile.json --renderer webgl2`.

The gate separates loading and steady RAF p95/max/hitch fraction (>50ms) from CPU frame/submit p95/max, retaining the mandatory 5000ms teardown bound. A provenance mismatch is BLOCKED/nonzero. `--limit` without a reviewed profile is functional measurement only, not performance qualification; it remains performance BLOCKED/nonzero. Workloads include 2D/3D, dense overlapping physics sensors, concurrent navigation replanning and large visible/invisible mesh populations; Canvas excludes native 3D/visibility workloads. Existing dense sweep and O(N) spatial pose checks are not claimed optimized. An operator-policy hosted profile is not repeated calibration, physical qualification or universal 60FPS certification.

The hosted macOS operator policy pins `expected.presentation: "native-foreground"` and runs with `--presentation native-foreground`. Each workload gets a fresh headed managed Chromium/profile; public `connectOverCDP({noDefaults:true})` attaches only to its default context, preventing Playwright's focus override from being installed. New incognito contexts do not honor this option and are not used. The loopback ephemeral CDP transport argument is explicitly pinned; no scheduling flags, timestamps, workload counts or budgets change. Native spawn/CDP PID agreement and before/after AppKit/normal-window evidence accompany actual DOM focus/visibility observations at every production observer callback and through lifecycle events. Sending `false` on a separate CDP handler cannot remove another handler's focus capture. Missing or interrupted evidence fails while completed measurements remain available. This requires an unlocked foreground-capable desktop and does not prove continuous OS foreground, GPU presentation completion or physical qualification.

The default remains honestly labelled `headless`; native-foreground currently requires macOS. Reviewed profiles must pin `expected.presentation`; unknown/missing or changed modes do not qualify or automatically recalibrate. Same-host/same-binary ABBA isolated a headless-mode effect (≈100ms RAF p95 versus ≈19ms foreground), not an exact App Nap/Viz mechanism. Run 37092521565 passed the five original workload gates but failed the real focus-loss control, so its emulated DOM focus evidence is not qualified. The public no-defaults cutover passes the local real focus-loss control; complete revised hosted qualification remains pending.

The complete five-workload policy and genuine focus-loss guard passed in [run 37105917252](https://github.com/YueyuHoshizora/XYZ.js/actions/runs/37105917252), closing RAF qualification. Windows Chromium still loses its native WebGL context, and WebKit exact pixels still fail despite the attempted `colorSpaceConversion:'none'` policy; that global decode change is removed. The same run proves Windows WebKit exposes neither `AudioContext` nor `AudioWorkletNode`, matching the pinned upstream [ENABLE_WEB_AUDIO OFF](https://github.com/WebKit/WebKit/blob/4d05d732e5a84f32675bef4cc135a2e7a9269a87/Source/cmake/OptionsWin.cmake). The user explicitly approved **UNSUPPORTED** audio only for this native Windows WebKit capability boundary; all graphics/input/lifecycle/cleanup gates remain required, while Chromium/Firefox retain trusted native unlock. This does not certify Windows WebKit audio or weaken signatures, DSP ownership or other gates.

`node scripts/check-production-foreground.mjs` exercises the unchanged 2D workload with a genuine second owned page taking focus and then returning it. It requires the interruption to reject qualification while retaining complete loading/steady native measurements; it neither emulates focus nor supplies a performance profile. CI preserves `.vite/production-focus-guard/` separately from the original all-workload gate. A locked desktop cannot execute this scenario and must not be bypassed.

## Physical qualification workflow

`node scripts/platform-hardware.mjs --inventory /absolute/new-inventory.json` records read-only host facts, not certification. `--prepare physical-gamepad /absolute/new-evidence.json` creates a schema-2 blocked evidence form; `--instructions` lists native scenarios and `--verify /absolute/evidence.json /absolute/review.json` validates artifacts and independent review. Gates cover physical-mobile/gamepad, OS IME/background, BFCache, thermal, physical-audio, spoken-AT and driver recovery. Status is **BLOCKED**, **EVIDENCE-READY-FOR-REVIEW**, or **PHYSICAL-PASS-HUMAN-ATTESTED**, with certification false or explicitly human-attestation-only. Hashes and `isTrusted` cannot prove physical authenticity.

The manual collector serves the built root on loopback by default at `?renderer=canvas2d&physical=1`, without opening a browser or playing sound. External serving requires explicit owned-scope authorization and an existing TLS certificate/key; it does not pair/forward devices. Safari tooling requires authorization for an owned isolated session before starting a driver/browser. Do not use shared/user Safari, modify OS/drivers, or play physical sound. Audible audio and spoken AT remain explicitly BLOCKED under the current no-sound boundary; unavailable owned hardware/operators remain BLOCKED. Exact evidence schemas/scenarios are in [physical qualification procedures](https://github.com/YueyuHoshizora/XYZ.js/blob/main/docs/PHYSICAL-QUALIFICATION.md).

## API compatibility safeguards

`pnpm check:api-compatibility` compares current emitted declarations against the verified published v1.12.1 declaration baseline, retaining the historical v1.11 value/type namespace guard and versioned consumers. The structural checks cover constructors, methods/overloads, generic constraints/defaults, nested options/interfaces, writable members, implementors and protected/abstract subclass obligations. Additive concrete-class members are permitted; private implementation details and structural stand-ins for concrete classes are excluded. `node scripts/check-api-compatibility.mjs --negative-smoke` exercises representative breaking/additive mutations.

This is TypeScript **source** compatibility, not runtime/behavioral, binary or arbitrary historical-version certification. Timing, ownership, cancellation and event behavior require separate regression/actual-consumer evidence. The compatibility report is `.vite/api-compatibility/report.json`; neither generated API pages nor passing declaration checks replace runtime support evidence.

## Package hygiene

After building, run `node scripts/check-package-hygiene.mjs` (optional `--output DIRECTORY`) to compare clean/disposable polluted packs using the same built bytes and pinned pnpm 12.6.0. The reviewed inventory permits exact module outputs, CLI import closures, this source document and 164 vendor entries: all 162 unchanged official OPM.js v1.11.1 dist files, the official LICENSE and the provenance manifest, not generated site/API output. It rejects unknown/missing paths, links, unsafe entry types and invalid archive checksums/end markers, comparing every approved file's bytes/SHA and executable flags.

`--archive /absolute/xyz.js-1.16.0.tgz` checks an actual supplied archive without repacking. The JSON report retains tar hashes, approved file facts and deliberately added cache/development pollution. Extracted-bin help/root math and byte-exact starter creation are consumer smoke, not installed browser gameplay; use the separate starter/browser gate for that. User source/vendor/caches are never removed to make a package pass, and this gate does not build or publish.

## Integrated current-version soak

After building, create the output parent and run `node scripts/mixed-soak.mjs --renderer all --preset smoke --parallel 1 --output .vite/mixed-smoke.json --timeout 400` for a short scenario run (default 30s). Qualification requires the independent hour invocation: `node scripts/mixed-soak.mjs --renderer all --preset hour --parallel 1 --output .vite/mixed-hour.json --timeout 3900`. Hour defaults to 3600 actual active seconds per backend and rejects `--duration` below 3600; active time excludes teardown and completes the in-flight whole cycle. `--parallel 1` runs independent backend browsers concurrently with shared host contention; `--parallel 0` runs sequentially and requires more than three hours overall. The larger smoke watchdog accommodates the measured frame-paced WebGPU recovery, not an optimized recovery claim. There is no extra `--scenario` switch.

The formal Scene cycles combine streamed collision cells, scheduler routes, character goals and GPU/GL dynamic 3D; explicit pause/audio pause, owned IndexedDB SceneSnapshot restoration into a fresh candidate, actual crossfade and same-backend API-loss recovery; then continued gameplay/native PCM and actor render-target pixel proof. Canvas remains actual 2D, with 3D/recovery explicitly unavailable, never emulated. Audio sinks are zero-gain before contexts and Chromium is muted; gesture unlock is still required.

Reports `xyz-mixed-soak-driver-v3` / `xyz-mixed-soak-v3` retain bounded cycle history, leases/scopes/targets/audio/errors/cleanup and separate CDP heap/GC/process trends. Source Git/tree, emitted tree, authored harness and manifest hashes bind the run; optional `--consumer /absolute/extracted/package --packageArchive /absolute/matching.tgz` records the actual consumer/archive. A short smoke, heap trend, tracked-resource cleanup or API-loss recovery is not one-hour success, global no-leak/VRAM proof, physical driver reset or cross-browser certification. Actual duration/version/result evidence belongs in ACCEPTANCE, not inferred from these commands.

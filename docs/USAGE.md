# XYZ.js Usage Guide

English · [Traditional Chinese](USAGE-zh.md) · [Technical reference](TECHNICAL.md)

**Current normative entry:** [v1.22.1 contracts, public API and support boundaries](CURRENT.md). `pnpm docs:api` generates the searchable root API; `pnpm build:site` publishes it in the static distribution at `api/1.22.1/` (landing page `docs/`). This guide retains versioned recipes and historical upgrade/evidence notes; those notes do not redefine current support.

XYZ.js is a browser game engine with the P42 playable reference Beacon Run. Current metadata is **1.22.1 / Apache-2.0** (npm unpublished); historical evidence remains unchanged. APIs are inspired by three.js/PixiJS/Excalibur, not drop-in parity, with no new runtime dependency. Browser/emulation observations and configured Windows CI testing are not physical-device or Windows-driver certification; browser qualification requires actual recorded evidence. See [PLAN](../PLAN.md), [technical reference](TECHNICAL.md) and [ACCEPTANCE](../ACCEPTANCE.md).

## Historical Stage-Profile Orientation

| Need                      | Historical stage profile / boundary                                                                                                                                                                                                                                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Portable 2D               | Sprite/HUD/atlas/raster/isolation/masks/basic blends on all three backends. Native Material2D/Filter2D/Mesh2D require GPU/GL; Canvas explicitly rejects unsupported requests.                                                                                                                                                                                  |
| 3D                        | WebGPU/WebGL2 only; PBR/instancing/shadows/post/weighted transparency use documented bounded profiles. WebGL2 HDR/weighted needs float color attachments.                                                                                                                                                                                                      |
| Physics2D                 | Kinematic bodies, convex character sweep/slide/support and bounded relative dynamic/rotational CCD; sleep/joints/static concave decomposition and dynamic convex-hull/compound colliders remain available. Sensors are discrete; deforming sweeps are unsupported.                                                                                             |
| Models / textures         | glTF `COLOR_0` supported, `COLOR_1` rejected; built-in meshopt, external Draco/Basis codecs. Ordinary KTX2 decodes base-level RGBA8; opt-in native KTX2 preserves all mips. `NativeTexture2D` supports RGBA8 and capability-gated BC/ETC2/ASTC; Canvas rejects native sources.                                                                                 |
| Recovery                  | Default GPU/GL `recoverGraphics:true` rebuilds the same backend; recreate old RenderTextures/snapshots. Recovery failure is fatal; no real-driver or cross-browser certification follows.                                                                                                                                                                      |
| P40–P42 scoped acceptance | P41 UI/contexts/budgets/warmup/typed content passed three-backend built-root regression. P42 native GPU skin/animated bounds/mips, 3D physics/dynamics/queries/capsule movement, authored navigation, masks/additive/blend trees/two-bone IK and complete Beacon Run passed scoped acceptance. No physical-device, cross-browser or performance certification. |

Stage-specific counts, browser observations and original exclusions below are historical. Use CURRENT for the normative matrix and ACCEPTANCE for recorded evidence; package metadata alone does not certify a browser or physical device.

## 1. Start the Development Environment

The minimum supported Node.js major is 22. Use Node >=22.13.0 (required by the pinned lint/test toolchain) and pnpm 12.6.0. From the repository root:

```sh
npx pnpm@12.6.0 install
npx pnpm@12.6.0 dev
```

Run `npx pnpm@12.6.0 examples` to start the server and open the gallery at `http://127.0.0.1:5173/examples/` (filters by feature, per-backend links), or open `http://127.0.0.1:5173/examples/showcase/` for integrated 2D, 3D, and audio. Click the audio button to unlock playback. The development server binds only to localhost. Do not open pages with `file://`: WebGPU and AudioWorklet require a secure context; use HTTPS in production.

Alternatively open the root [example index](../index.html) at `http://127.0.0.1:5173/`. Root and `/examples/` share the complete directory catalog, filters and backend links. Every example directory URL executes on open, with no console bootstrap. Most instructions are English; starters and accessibility-game have complete English/Traditional-Chinese application screens. 3D-only pages explicitly reject Canvas2D; audio still needs a trusted gesture.

| Example                                                 | Purpose                                                                                                                                     |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| [triangle](../examples/triangle/)                       | WebGPU triangle, pause/resume/destroy                                                                                                       |
| [sprite](../examples/sprite/)                           | Shared textures, opacity, ordering, sound                                                                                                   |
| [pong](../examples/pong/)                               | Keyboard, pointer, gamepad, camera, scoring                                                                                                 |
| [cube3d](../examples/cube3d/)                           | Perspective, lighting, depth, textures                                                                                                      |
| [fallback-demo](../examples/fallback-demo/)             | Backend selection and capabilities                                                                                                          |
| [showcase](../examples/showcase/)                       | Scene switching, 2D + 3D + audio                                                                                                            |
| [beacon-run](../examples/beacon-run/)                   | Playable four-beacon extraction, 3D physics/navigation/animation, menu/HUD/pause/settings/save-load/audio/cleanup; scoped GPU/GL acceptance |
| [advanced3d](../examples/advanced3d/)                   | Hierarchy, controls/picking, glTF skin, PBR/shadows, instances/HDR                                                                          |
| [physics2d](../examples/physics2d/)                     | Bodies, materials, sensor trigger, gravity                                                                                                  |
| [particles2d](../examples/particles2d/)                 | Emitter presets, bursts, nozzles, additive layer                                                                                            |
| [tilemap2d](../examples/tilemap2d/)                     | Tile layers, tile collision, camera follow/bounds/shake/zoom                                                                                |
| [transitions2d](../examples/transitions2d/)             | fade/crossfade/slide, easing, cancellation, Scene timers                                                                                    |
| [ui2d](../examples/ui2d/)                               | Text2D, bitmap fonts, NineSlice, HUD, accessible buttons                                                                                    |
| [input-lab](../examples/input-lab/)                     | Keyboard/pointer/gamepad state, rebindable ActionMap                                                                                        |
| [audio-lab](../examples/audio-lab/)                     | Unlock, OPM music/SFX, PCM sample, volumes, PreloadBatch                                                                                    |
| [pbr3d](../examples/pbr3d/)                             | Procedural PBR surfaces, metallic/roughness grid, shadows, environment, fog, exposure/bloom                                                 |
| [instancing3d](../examples/instancing3d/)               | InstancedMesh batches, culling probes, RenderStats                                                                                          |
| [picking3d](../examples/picking3d/)                     | Nested Groups, OrbitControls, Raycaster, camera projection                                                                                  |
| [gltf3d](../examples/gltf3d/)                           | Skinned glTF clip playback, morph targets                                                                                                   |
| [lightweight2d](../examples/lightweight2d/)             | Firefly garden, pause/resume/reset/destroy, actual graphics stats and unused-service flags                                                  |
| [resource-lifecycle](../examples/resource-lifecycle/)   | Shared leases, failed-release retry, in-memory saves, rejected-load isolation and fresh publication                                         |
| [character-platforms](../examples/character-platforms/) | Walk/jump/crouch, moving lift, rotating support and blocked standing                                                                        |
| [joints3d](../examples/joints3d/)                       | Motorized hinge, distance-linked chain, angular-locked ball socket and live error metrics                                                   |
| [ccd3d](../examples/ccd3d/)                             | Dynamic-pair/rotational CCD, on/off comparison and real fixed-step contacts                                                                 |
| [navigation-bake](../examples/navigation-bake/)         | Bake collision surfaces, change goals and tune the aggregate Scene navigation quota                                                         |
| [text-i18n](../examples/text-i18n/)                     | Native canvas editing of bidi/grapheme samples, selection geometry and font fallback                                                        |
| [audio-effects](../examples/audio-effects/)             | Trusted unlock, PCM/stream playback, effects, duck release, cancel-hold and spatial binding                                                 |
| [gameplay2d](../examples/gameplay2d/)                   | Integrated 2D gameplay and native effects                                                                                                   |
| [rendering2d](../examples/rendering2d/)                 | Shared 2D rendering profiles                                                                                                                |
| [authoring-lab](../examples/authoring-lab/)             | Canvas UI, contexts, resource leases and typed content                                                                                      |
| [objects3d](../examples/objects3d/)                     | 3D objects and weighted transparency                                                                                                        |
| [shadows3d](../examples/shadows3d/)                     | Native shadow rendering                                                                                                                     |
| [physics2d-lab](../examples/physics2d-lab/)             | Joints, sleeping and collisions                                                                                                             |
| [animation-lab](../examples/animation-lab/)             | Animation authoring and playback                                                                                                            |
| [save-lab](../examples/save-lab/)                       | Content save and fresh rebuild                                                                                                              |
| [motion2d](../examples/motion2d/)                       | Kinematic platforms, character slopes/stairs, relative rotational CCD                                                                       |
| [locomotion3d](../examples/locomotion3d/)               | Fixed animation/controller walk, run, jump and support                                                                                      |
| [world-visibility](../examples/world-visibility/)       | Visibility, LOD/HLOD and native occlusion queries                                                                                           |
| [native-material3d](../examples/native-material3d/)     | Native material hooks and bounded lighting                                                                                                  |
| [world-streaming](../examples/world-streaming/)         | Cell publication/retirement, shared resources and navigation seams                                                                          |
| [world-nature](../examples/world-nature/)               | Terrain/splat, analytic water, moving-object trail and seeded wind grass; native 3D only                                                    |
| [cpu-workers](../examples/cpu-workers/)                 | Native geometry jobs, transfer/copy costs, cancellation                                                                                     |
| [tiled-import](../examples/tiled-import/)               | Orthogonal JSON, external atlas, GID flips and real colliders                                                                               |
| [gpu-particles3d](../examples/gpu-particles3d/)         | Native GPU particle simulation/rendering                                                                                                    |
| [accessibility-game](../examples/accessibility-game/)   | Bilingual playable keyboard/preferences/error/results flow                                                                                  |
| [asset-recipe](../examples/asset-recipe/)               | Asset production and deployment entry                                                                                                       |
| [narrative](../examples/narrative/)                     | Simulation-time cutscenes, branching dialogue, quest progress and save/restore                                                              |
| [lighting2d](../examples/lighting2d/)                   | Native normal-map lighting; explicit Canvas2D capability rejection                                                                          |
| [asset-hot-reload](../examples/asset-hot-reload/)       | Vite scene replacement, preserving the prior scene when a candidate fails                                                                   |
| [gpu-compute](../examples/gpu-compute/)                 | WebGPU WGSL storage buffers, dependent dispatches and typed readback                                                                        |
| [render-graph](../examples/render-graph/)               | Native WebGPU/WebGL2 render graph with multi-input passes                                                                                   |

## 2. Use It on Your Website

Build from the engine repository:

```sh
npx pnpm@12.6.0 build
```

Build writes minified engine JavaScript, TypeScript declarations, and source maps to `dist/`, preserving the ESM directory structure. The already-minified official OPM vendor is copied unchanged. No separate minification command or source-file modification is needed.

Copy the **entire `dist/` tree** into `/vendor/xyz/dist/` on your website, including `vendor/opm/`, chunks, and worklets, not just the entry point. Serve the following files through your website's HTTP development server.

For a bundler project, run `npx pnpm@12.6.0 pack` in the engine repository to create a local tarball, then install that file in the consuming project. Replace the URL import below with `import { Game, Scene, Primitive2D } from 'xyz.js'`. Do not assume this version is available from the registry.

### Standalone starters and complete static deployment

From the engine repository, build/pack once and create an empty destination:

```sh
npx pnpm@12.6.0 build
npx pnpm@12.6.0 pack
node scripts/create-game.mjs /absolute/my-game --template 2d --package /absolute/xyz.js-1.14.0.tgz --name my-game
npx pnpm@12.6.0 --dir /absolute/my-game install
npx pnpm@12.6.0 --dir /absolute/my-game dev
npx pnpm@12.6.0 --dir /absolute/my-game build
```

Use `--template 3d` for the capsule course; `--package` also accepts a built package directory. The installed CLI `xyz-create` accepts the same arguments; repository `create:game` forwards them. Nonempty destinations are rejected; generation does not install/publish. Both starters are installed public-root `xyz.js` consumers, not workspace-source demos, with loading/menu/play/pause/settings/results/restart, gesture-gated or muted sound, validated IndexedDB checkpoints, explicit retry/recovery/conflict UI and teardown.

Starter `assets:engine` copies the complete installed package `dist/` into `public/engine/`; `dev` and `build` run it automatically. Deploy **all starter `dist/`**, including `engine/vendor/`, workers and worklets. For a fixed prefix, build with `GAME_BASE=/games/my-game/`; the default `./` is relocatable. For manual unbundled deployment, `mkdir -p /absolute/site/vendor/xyz/dist` then `cp -R dist/. /absolute/site/vendor/xyz/dist/` from the engine repository preserves the complete public module tree.

```sh
npx pnpm@12.6.0 build:site
npx pnpm@12.6.0 smoke:site
```

The website builder emits root/gallery/every example and benchmark HTML into `.vite/site/`, copies the complete engine `dist/` unchanged to `engine/`, and preserves fixtures/public assets/module workers. Deploy the entire output to root or a subpath on an HTTP/HTTPS static server with directory indexes; no Vite dev middleware or `file://` is required or supported. `smoke:site` exercises the built static tree in its own managed muted Chromium, with native zero-gain physical-output sinks. It does not certify audible output, Safari, physical hardware or screen readers; inspect its actual report before claiming success.

For parallel verification, run all four shards after the single local site build (POSIX shell):

```sh
pids=""
for shard in 1 2 3 4; do
  node scripts/smoke-site.mjs --shard "$shard/4" --output ".vite/site-smoke/shard-$shard-of-4" &
  pids="$pids $!"
done
status=0
for pid in $pids; do
  wait "$pid" || status=1
done
test "$status" -eq 0
```

`--shard index/count` is 1-based, with `1 <= index <= count <= 32`. Sorted source example paths are assigned by ordinal modulo count before filters; every example's original renderer routes (including explicit unsupported Canvas2D/3D checks) remain together. Every shard still verifies both complete catalogues and their local links. `results.json` records the shard identity, full available case manifest, ordered planned/completed/exercised case IDs and completeness; empty selections, unavailable backends, missing cases and failures cannot pass. `--example` and `--renderer` remain diagnostic filters, not full-site coverage; omit `--shard` for a single-example run unless its assigned shard is known. Without `--shard`, the original complete serial execution remains.

This is concurrent independent Node/browser processes, **not JavaScript threads inside a page**. Each process owns its static server, muted managed Chromium and unique output directory; all shards must succeed before claiming complete coverage. CI builds the site independently in four required macOS/Metal-host shard jobs; production workloads/starters run in another macOS job, while native audio retains its original Linux/PulseAudio environment in a separate required job. The reusable CI workflow gates release on all jobs. No retries, workload reductions or timeout relaxations are introduced. Reports retain available, planned, completed and exercised case identities; preserve every shard report to audit their union. This schedules work concurrently; it does not certify speedups, Linux software-GPU workloads, physical low-tier hardware or universal FPS.

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <meta charset="utf-8" />
  <title>XYZ.js</title>
  <style>
    canvas {
      width: 800px;
      max-width: 100%;
      height: 450px;
      touch-action: none;
    }
  </style>
  <canvas id="game"></canvas>
  <p id="status">ArrowLeft / ArrowRight</p>
  <script type="module" src="./app.js"></script>
</html>
```

Create `app.js`, a complete runnable plain-JavaScript example:

```js
import { Game, Scene, Primitive2D } from '/vendor/xyz/dist/src/index.js';

const status = document.querySelector('#status');
let game;
try {
  game = await Game.create({
    canvas: '#game',
    renderer: 'auto',
    width: 800,
    height: 450,
  });
  game.addEventListener('error', (event) => {
    status.textContent = event.detail.message;
  });
  const player = await Primitive2D.rectangle(40, 40, '#40c8ff');
  player.position.set(100, 120);
  class PlayScene extends Scene {
    update(dt) {
      const keys = game.input.keyboard;
      const axis =
        Number(keys.isDown('ArrowRight')) - Number(keys.isDown('ArrowLeft'));
      player.position.x += axis * 180 * dt;
    }
  }
  const scene = new PlayScene();
  scene.add(player);
  await game.setScene(scene);
  game.start();
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) game.destroy();
  });
} catch (error) {
  game?.destroy();
  status.textContent = error instanceof Error ? error.message : String(error);
}
```

You should see a blue square. The arrow keys move it horizontally at 180 logical pixels per second. `dt` is in seconds; angles are in radians. GameObject itself is invisible: use Sprite, Primitive2D, or Mesh for visual output.

## 3. Scenes and Game Controls

The following snippets extend an existing `game` and `scene`; they are not independent complete programs.

```js
game.pause();
game.resume();
await game.setScene(new Scene());
```

`setScene` initializes a candidate before switching. Preparation failure preserves the old Scene and rejects the Promise. Successful switching destroys the old Scene, so do not reuse destroyed objects or Scenes. `scene.remove(object)` detaches ownership without destroying; a removed object can be added to another Scene.

Override `update(dt)` for frame logic. For asynchronous preparation, override `initialize(game, signal)`, honor cancellation, and synchronously release your resources in `onDestroy()`. See the [Scene contract](TECHNICAL.md#10-core-world-p02). After a fatal graphics error, destroy/recreate instead of attempting resume.

## 4. Sprites, Textures, and Sizing

Add `Sprite` to the import and provide a real `/image.png` on your website:

```js
const texture = await game.assets.loadTexture('/image.png');
const sprite = scene.add(
  new Sprite({
    texture,
    position: [160, 120],
    opacity: 0.75,
  }),
);
sprite.zIndex = 2;
sprite.rotation = Math.PI / 4;
sprite.scale.set(1.5, 1.5);
```

Canonical URLs share Textures. The default anchor is the image center; right/down are positive. Larger zIndex values draw later, and equal values retain insertion order. Sprite.destroy does not destroy a shared Texture. Game cleans up `game.assets` textures; independently created `Texture.fromImage(source)` textures are your responsibility. Primitive2D owns its generated texture.

Canvas CSS size and GPU backing pixels are separate; do not change `canvas.width` every frame. By default, autoResize follows the CSS content box, and pixelRatio is capped at 2. `game.resize(800,450)` updates the engine fallback, but author CSS remains authoritative. Set `autoResize:false` when creating Game if you manage rendering dimensions yourself.

## 5. Camera and Input

`scene.camera2D.position` is the world coordinate at the viewport's top-left; `zoom` must be positive. Add `Vector2` to the module import and create one reusable output container outside the update loop:

```js
const pointerWorld = new Vector2();
```

Run the following inside Scene.update:

```js
scene.camera2D.zoom = 1.25;
if (game.input.keyboard.wasPressed('Space')) {
  sprite.visible = !sprite.visible;
}
if (game.input.pointer.isDown(0)) {
  scene.camera2D.screenToWorld(game.input.pointer.position, pointerWorld);
  sprite.position.set(pointerWorld.x, pointerWorld.y);
}
const verticalAxis = game.input.gamepads[0]?.axes[1] ?? 0;
```

`isDown` reports held state; `wasPressed`/`wasReleased` report frame edges without consuming them. Edges clear at frame end. Keyboard uses `KeyboardEvent.code`, such as KeyW, rather than typed characters. Editable fields do not start tracking gameplay presses, but still release previously held keys. Blur, hidden, and pause transitions clear held state. Gamepad slots may be empty; physical hardware remains unverified.

For gamepads, prefer the mapped API over raw `game.input.gamepads`: `game.input.gamepad.stick('left')` returns a deadzone-filtered `{x,y}`, and `game.input.actions` binds named actions to pad buttons, stick directions and keys:

```js
const { actions } = game.input;
actions.bind('jump', { button: 'a' }, { key: 'Space' });
actions.bind('left', { axis: 'leftX', direction: -1 }, { key: 'KeyA' });
if (actions.wasPressed('jump')) player.jump();
// Rebinding UI: wait for game.input.gamepad.firstPressed(), then
actions.rebind('jump', [{ button: game.input.gamepad.firstPressed() }]);
localStorage.setItem('bindings', JSON.stringify(actions.export())); // actions.import(...) restores
```

Only `mapping === 'standard'` pads are used. Spatial sample audio: pass `spatial: { position: { x, y, z } }` to `sample.play(...)` and move sources with `playback.position3D = {...}`; place the listener with `game.audio.listener.setPosition(x,y,z)` / `setOrientation(forward, up)`.

## 6. Add 3D

Add `Mesh`, `Geometry`, and `TextureMaterial` to the import. Reuse your loaded `texture` and current `scene`:

```js
if (game.graphics.capabilities.threeD) {
  scene.add(
    new Mesh({
      geometry: Geometry.cube(),
      material: new TextureMaterial({ texture }),
      position: [0, 0, 0],
    }),
  );
  scene.camera3D.position.set(0, 0, 5);
}
```

The camera faces local −Z. 3D renders before the 2D overlay. The original P05 primitives/custom indexed geometry and ambient/directional lighting remain supported alongside the advanced features below. Index topology stays immutable; deliberate vertex-only edits require `geometry.markUpdated()` for GPU uploads.

`auto` falls back through WebGPU → WebGL2 → Canvas2D only during initialization. A forced backend never switches on failure. Canvas2D has no 3D: inspect capabilities instead of submitting visible Meshes. Runtime device/context loss does not trigger automatic backend switching.

## 7. Audio

Copy [sfx.json](../examples/sprite/sfx.json) to `/sound.json` on your website. This format contains OPM voice and note data, not MP3/WAV audio. Add `<button id="sound" disabled>Play sound</button>` to the HTML and run this after Game creation:

```js
const sound = await game.audio.load('/sound.json');
const button = document.querySelector('#sound');
button.disabled = false;
button.addEventListener('click', async () => {
  try {
    await game.audio.unlock();
    sound.play({ channel: 'sfx' });
    game.audio.master.volume = 0.8;
  } catch (error) {
    status.textContent = String(error);
  }
});
```

First playback requires unlock from a user gesture. Master/music/sfx/ui volume ranges from 0 to 1. Audio belongs to the current Scene by default; switching stops nonpersistent playback. `sound.play({ persistent:true })` survives Scene changes. `sound.stop()` stops the asset; calling `.stop()` on a playback handle stops only that playback. Game.pause does not stop audio.

The eight-voice budget includes release tails. Overflow steals only the oldest SFX, not BGM. When no SFX can be stolen, the new note is skipped. The eight OPM slots share the manager's single AudioContext; avoid bypassing `game.audio` to manipulate underlying OPM instances casually.

OPM needs AudioWorklet (HTTPS or localhost). If it cannot start, `unlock()` still resolves so samples and streams play; check `game.audio.opmState === 'ready'` before playing OPM assets and read `game.audio.opmError` for the cause. Calling `unlock()` again retries OPM.

To load OPM from a CDN instead of the vendored copy, pass a commit-pinned module URL; the vendored files stay the default:

```js
const game = await Game.create({
  canvas: '#game',
  opmModuleUrl:
    'https://cdn.jsdelivr.net/gh/JS-PACKAGE/OPM.js@4fdbff0f2d6a509763e3bef0066c059ba88ad154/dist/api/index.js',
});
```

The CDN must serve OPM.js 1.13.1 with CORS, and your CSP must allow it. Its bytes cannot be integrity-checked; see the technical reference before relying on it.

## 8. Asset Safety and Cleanup

| Resource                   | Fixed limit |
| -------------------------- | ----------- |
| Image response bytes       | 8 MiB       |
| Audio JSON response bytes  | 1 MiB       |
| Notes per audio asset      | 16,384      |
| Texture dimension per side | 8,192       |
| Total texture pixels       | 4,194,304   |

Oversized assets reject; they are not cropped or downscaled. Byte caps count actual response-stream bytes rather than trusting Content-Length. Defaults are centralized in `src/data/assets.ts`, not Game.create options.

**All browser-supported image formats are retained, so pixel checks happen after decoding.** This does not prevent transient decoder memory amplification and is not a global cache/concurrent-download budget. Use a trusted asset pipeline and manage asset counts and lifetimes. Do not process assets using unsafe HTML or eval.

Call `game.destroy()` when leaving the game to stop the loop and release graphics, input, Scene, audio, and loaders. Do not give one Canvas to two Games concurrently. Do not unconditionally destroy on pagehide when preserving BFCache; the complete example handles that distinction.

## 9. Troubleshooting and Release Checks

- No picture: verify Canvas, HTTP/HTTPS paths, and imports; inspect Game.create rejections and error events. An empty Scene does not draw a triangle.
- WebGPU unavailable: use auto or check secure context, browser, and driver support. navigator.gpu does not guarantee device availability.
- No audio: check gesture-based unlock, JSON format, worklet relative paths, and the complete vendor tree.
- Rejected image/JSON: inspect HTTP status, format, note/byte/pixel limits, and the error cause.
- Diagnostics: import `logger` from the entry and set `logger.level = 'debug'`. Production can use error/silent. Never log secrets.

```sh
npx pnpm@12.6.0 build
npx pnpm@12.6.0 typecheck
npx pnpm@12.6.0 test
npx pnpm@12.6.0 lint
npx pnpm@12.6.0 format:check
```

Tool checks do not replace actual browser output and interaction verification. Safari/Edge/Firefox, physical gamepads, and the complete BFCache matrix remain unverified. See the [benchmark](../benchmarks/sprites/) for measurements; approximately 60fps is not a cross-device guarantee. When distributing, keep the root `LICENSE`, the OPM LICENSE and the complete dist tree.

## 10. Canvas Text and Scene-Local Timers

Available in the post-v1.0 source additions, not the existing v1.0 release archive. With an initialized `game`, this replaces the quickstart scene:

```js
import { Scene, Text2D } from '/vendor/xyz/dist/src/index.js';

const scene = new Scene();
const label = await Text2D.create('Seconds: 0', {
  fontSize: 28,
  color: '#40c8ff',
});
label.position.set(180, 60);
scene.add(label);
let seconds = 0;
const timer = scene.timers.every(1, () => {
  void label.setText(`Seconds: ${++seconds}`).catch((error) => {
    game.pause();
    console.error(error);
  });
});
scene.timers.after(5, () => timer.cancel());
await game.setScene(scene);
game.start();
```

The timer uses simulation seconds: pausing freezes it, and replacing/destroying the Scene cancels it. No `setTimeout` cleanup is needed. It is not a wall-clock countdown. Cancel individual timers with `timer.cancel()`; `timer.active` reports whether they remain scheduled.

Text supports newlines and normal Sprite transforms, anchor, opacity and zIndex. Await custom font readiness and handle `setText()` rejections; overlapping updates are latest-request-wins. The original v1.1 immutable-style/no-wrap profile is historical: P27 adds styled layout and typed font assets (section 18). Generated textures belong to the label; do not share them with other Sprites.

Open [Pong](../examples/pong/) to see score text, delayed serves, Pause/Resume and Restart scene. Restart while paused leaves the new scene paused until Resume.

## 11. Advanced 3D

Open [advanced3d](../examples/advanced3d/) with `?renderer=webgpu` or `?renderer=webgl2`. It combines a floor, 24-instance ring, metallic sphere, animated glTF ribbon, shadows and HDR bloom. Canvas2D remains 2D-only. The following snippets extend an existing game/scene/texture and require the named classes imported from the unified entry.

### Hierarchy, Camera, Controls, and Picking

```js
const group = scene.add(new Group());
const mesh = group.add(
  new Mesh({
    geometry: Geometry.cube(),
    material: new TextureMaterial({ texture }),
  }),
);
group.position.x = 1;
scene.camera3D = new OrthographicCamera();
scene.camera3D.height = 8;
scene.camera3D.position.set(0, 3, 8);
scene.camera3D.lookAt(new Vector3());
const controls = new OrbitControls(scene.camera3D, game.canvas);
controls.minZoom = 0.5;
controls.maxZoom = 4;
const raycaster = new Raycaster();
raycaster.setFromCamera(0, 0, scene.camera3D, 800 / 450);
const hits = raycaster.intersectObjects(scene.objects);
console.log(hits[0]?.object, hits[0]?.instanceId);
```

Use the actual logical viewport aspect and convert pointer coordinates to NDC (x=2*screenX/width−1, y=1−2*screenY/height). Raycaster uses exact two-sided triangles and its own near/far, independent of camera clipping; results are world-distance sorted. Hiding group hides descendants; world transforms include ancestors. Cycles/cross-Scene parenting reject. Removing a subtree detaches without destroying; destroying a parent destroys descendants. Call controls.update() after external target/camera edits and controls.destroy() during your Scene cleanup. Limits include distance, orthographic zoom, polar and azimuth angles.

### Models and Animation

```js
const asset = await new GLTFLoader().load('/model.glb', { signal });
scene.add(asset.scene);
if (asset.animations[0]) {
  const action = scene.animations.clipAction(asset.animations[0]);
  action.loop = true;
  action.play();
}
```

Here signal is your initialization AbortSignal; provide a real model URL. `parse(bytesOrJSON,baseURL,{signal})` also supports GLB/glTF. Game advances scene.animations after timers and before Scene.update; do not double-update it. TRS clips support STEP/LINEAR/CUBICSPLINE, reverse, repeat/once/pingpong and P34 ordered weighted layers/fades/crossfades. At weight 1 later layers replace earlier writes; partial weights blend rather than normalize all actions. `play()` resumes; `stop()` resets time without restoring pose. See the technical animation contracts.

Triangle primitives, normalized/strided/sparse accessors, textures, four- or eight-influence skins and morph targets (POSITION/NORMAL deltas, mesh/node weights, `weights` animation) are supported, along with `KHR_mesh_quantization`, `KHR_materials_emissive_strength`, `KHR_materials_unlit` (approximated), `KHR_texture_transform` (independent UV0/UV1 selection and affine transform for each material map, without baking shared vertex UVs) and `KHR_lights_punctual` (returned as `asset.lights`, in raw glTF units; add them to the scene yourself). Eight influences require paired `JOINTS_1`/`WEIGHTS_1`; all eight weights are normalized together, not truncated to four. Missing selected UVs, UV2+ and additional influence sets reject. Other required extensions and other topology explicitly reject. SkinnedMesh uses native GPU palettes for rendering and a CPU deformation oracle for bounds/picking; drive morphs with `mesh.morph.weights.set(index, weight)` or a loaded clip (weights of one node's primitives are shared). Model budgets: input 32 MiB, fetched/tracked decoded 128 MiB each, lists 10,000 entries, accessor scalar elements 4,194,304, total vertices 1,000,000/indices 3,000,000, joints 256, 64 morph targets per mesh and hierarchy depth 256. These are not total process-memory limits; image post-decode caveats still apply.

Current loader additions include `COLOR_0` float/normalized unsigned VEC3/VEC4 (including alpha), built-in `EXT_meshopt_compression`, external Draco/Basis decoder interfaces and documented P39 PBR extensions. Unsupported required extensions reject. A real `dracoDecoder` must return logical-space attributes/triangle indices matching accessors; without it required Draco rejects and optional Draco needs real uncompressed fallback accessors. Default KTX2 decoding returns base-level RGBA8 using built-in plain 2D RGB(A) no/ZLIB decoding or a supplied `ktx2Transcoder`; XYZ.js bundles no Draco/Basis WebAssembly. Opt-in `nativeTextures: true` preserves every KTX2 mip and accepts `ktx2NativeTranscoder` for encodings requiring an external codec. `KHR_texture_basisu` uses the transcoder or native path, otherwise a regular source fallback is needed. Decoder quality/speed/memory and a broad asset corpus are not certified. See [section 22](#22-p42-3d-gameplay-and-animation).

Stop actions/remove consumers and call asset.dispose() in your resource cleanup, including on initialization failure. Scene destruction does not dispose loader-owned textures; never dispose while another live mesh borrows them. Mesh/materials do not own shared textures.

### PBR, Shadows, HDR, and Instances

```js
scene.add(
  new Mesh({
    geometry: Geometry.sphere(),
    material: new PBRMaterial({ texture, metallic: 0.8, roughness: 0.3 }),
  }),
);
scene.pointLights.push(new PointLight({ position: new Vector3(2, 3, 2) }));
scene.shadows.enabled = true;
scene.shadows.mapSize = 1024;
scene.shadows.extent = 12;
scene.postProcessing.enabled = true;
scene.postProcessing.exposure = 1.2;
scene.postProcessing.toneMapping = 'aces';
scene.postProcessing.bloomStrength = 0.25;
const instances = scene.add(
  new InstancedMesh({
    geometry: Geometry.cube(),
    material: new TextureMaterial({ texture }),
    count: 24,
  }),
);
instances.setMatrixAt(0, new Matrix4());
```

PBR borrows base/emissive sRGB and linear metallicRoughness (G/B), normal/occlusion (R) maps. alphaMode selects OPAQUE/MASK/BLEND, alphaCutoff controls MASK and doubleSided controls culling. PBR alphaMode is authoritative; legacy TextureMaterial uses opacity/transparent. Default sorted translucent meshes draw farthest-first with stable ties, but intersecting surfaces can still composite incorrectly; weighted mode is an opt-in approximation. The Scene allows 8 point and 8 spot lights, rejecting excess. P37 supports point/spot shadows and 2–4 directional cascades alongside fixed directional 3×3 PCF; enable light `castShadow` as well as mesh flags. See the technical shadow limits.

#### Reusable Procedural PBR Presets

`ProceduralMaterial.create(kind, options?)` generates seamless, deterministic maps once on the CPU, without external assets or dependencies. The 459 `ProceduralMaterialKind` values are `'wood' | 'brick' | 'stone' | 'metal' | 'fabric' | 'marble' | 'concrete' | 'tiles' | 'leather' | 'sand' | 'rust' | 'snow' | 'asphalt' | 'gravel' | 'cobblestone' | 'bark' | 'moss' | 'mud' | 'granite' | 'slate' | 'terrazzo' | 'denim' | 'burlap' | 'carpet' | 'plaster' | 'terracotta' | 'cork' | 'rubber' | 'carbonfiber' | 'diamondplate' | 'paper' | 'wicker' | 'bamboo' | 'hammeredmetal' | 'galvanized' | 'corrugatedmetal' | 'perforatedmetal' | 'expandedmetal' | 'wiremesh' | 'velvet' | 'terrycloth' | 'boucle' | 'geode' | 'quartz' | 'pyrite' | 'shiplap' | 'glassblock' | 'thatch' | 'charredwood' | 'driftwood' | 'peelingpaint' | 'tiretread' | 'honeycomb' | 'frost' | 'stainedglass' | 'soapstone' | 'butcherblock' | 'wallpaper' | 'embroidery' | 'macrame' | 'brickpaving' | 'steppingstone' | 'woodendeck' | 'cheese' | 'sugarfrosting' | 'candleswax' | 'vinylrecord' | 'graphpaper' | 'notebookpaper' | 'lace' | 'crochet' | 'basketweave' | 'zipper' | 'velcro' | 'button' | 'traintracks' | 'manholecover' | 'speedbump' | 'circuitboard' | 'solarpanel' | 'heattile' | 'pianokeys' | 'drumskin' | 'gongsurface' | 'lensarray' | 'prismtape' | 'fresnel' | 'bandage' | 'pillblister' | 'sutures' | 'trellis' | 'terracottapot' | 'hedgerow' | 'collar' | 'petbed' | 'scratchpost' | 'runningtrack' | 'bouldermat' | 'pooltile' | 'envelope' | 'chalkboard' | 'corkboard' | 'snowdrift' | 'icicle' | 'dewdrops' | 'mooncrater' | 'starfield' | 'nebula' | 'pleats' | 'shoelace' | 'tassel' | 'woksurface' | 'cutlery' | 'choppingboard' | 'faucet' | 'showerhead' | 'bathmat' | 'blinds' | 'curtain' | 'shadecloth' | 'sandstone' | 'travertine' | 'pumice' | 'parquet' | 'mosaic' | 'hexagontiles' | 'knit' | 'corduroy' | 'felt' | 'roofshingles' | 'rooftiles' | 'stucco' | 'lichen' | 'leaflitter' | 'endgrain' | 'acousticfoam' | 'closedcellfoam' | 'linoleum' | 'suede' | 'snakeskin' | 'crocodile' | 'herringbone' | 'tweed' | 'seersucker' | 'knurledmetal' | 'engineturned' | 'goldleaf' | 'orangepeel' | 'coconut' | 'watermelon' | 'limestone' | 'breccia' | 'gneiss' | 'plywood' | 'osb' | 'chipboard' | 'wafflecloth' | 'cableknit' | 'quilting' | 'crackleglaze' | 'flutedceramic' | 'encaustictiles' | 'fishscales' | 'tortoiseshell' | 'feathers' | 'reedmat' | 'rope' | 'straw' | 'studdedrubber' | 'groovedrubber' | 'recycledrubber' | 'breadcrust' | 'wafer' | 'chocolate' | 'pretzel' | 'bagel' | 'croissant' | 'butterflywing' | 'beetlewing' | 'spiderweb' | 'cirrus' | 'cumulus' | 'lightning' | 'kelp' | 'seaweed' | 'anemone' | 'candy' | 'marshmallow' | 'nougat' | 'frostedglass' | 'rippledglass' | 'bubbleglass' | 'saddlestitch' | 'tooledleather' | 'patentleather' | 'appleskin' | 'peachskin' | 'grapeskin' | 'broccoli' | 'cabbage' | 'onion' | 'bedsheet' | 'pillow' | 'mattress' | 'tealeaf' | 'matcha' | 'teabag' | 'sanddune' | 'pebblebeach' | 'foamedge' | 'lavaflow' | 'cooledlava' | 'ashfield' | 'stalactite' | 'flowstone' | 'cavefloor' | 'jam' | 'peanutbutter' | 'sprinkles' | 'icecream' | 'popsicle' | 'sorbet' | 'spaghetti' | 'macaroni' | 'lasagna' | 'origami' | 'paperlace' | 'papercut' | 'sunflower' | 'daisy' | 'clover' | 'puzzletile' | 'legobrick' | 'rubberband' | 'haybale' | 'corncrib' | 'fencepost' | 'poolfelt' | 'icesurface' | 'climbingwall' | 'oledpanel' | 'crtscanline' | 'keyboardkey' | 'filmstrip' | 'postagestamp' | 'halftoneprint' | 'radiator' | 'screwhead' | 'chainlink' | 'friedegg' | 'sushirice' | 'chocolatechip' | 'cargomat' | 'dashboardgrain' | 'licenseplate' | 'flowerbed' | 'grassstripe' | 'topiary' | 'confetti' | 'ribbonstreamer' | 'pinatafringe' | 'xylophone' | 'tambourine' | 'castanet' | 'pillcapsule' | 'pilltablet' | 'bathbomb' | 'basketball' | 'tennisball' | 'golfball' | 'boardformedconcrete' | 'ribbedconcrete' | 'splitfaceblock' | 'chainmail' | 'rivetedmetal' | 'weldedmetal' | 'cactus' | 'pinecone' | 'corncob' | 'corrugatedcardboard' | 'creasedpaper' | 'layeredpaper' | 'basalt' | 'scoria' | 'obsidian' | 'malachite' | 'agate' | 'lapislazuli' | 'rice' | 'sesame' | 'coffeebeans' | 'lotusleaf' | 'bananaleaf' | 'fernleaf' | 'braincoral' | 'starcoral' | 'seasponge' | 'houndstooth' | 'tartan' | 'damask' | 'zebrafur' | 'leopardfur' | 'giraffefur' | 'scallopshell' | 'oystershell' | 'nautilusshell' | 'cantaloupe' | 'dragonfruit' | 'kiwiskin' | 'rosepetal' | 'lilypetal' | 'fritillarypetal' | 'birchbark' | 'palmtrunk' | 'sycamorebark' | 'elephanthide' | 'ostrichleather' | 'sharkskin' | 'tactilepaving' | 'roadmarking' | 'draincover' | 'mushroomgills' | 'morel' | 'bracketfungus' | 'pineapple' | 'strawberry' | 'lychee' | 'walnutshell' | 'peanutshell' | 'almondshell' | 'sandpaper' | 'steelwool' | 'wirebrush' | 'cheesegrater' | 'ovenrack' | 'muffintin' | 'gauze' | 'elasticbandage' | 'icepack' | 'bubblewrap' | 'sequin' | 'pennyround' | 'volleyball' | 'bowlingball' | 'rugbyball' | 'wafflecone' | 'donutglaze' | 'brownie' | 'soapbar' | 'loofah' | 'scrubbypad' | 'orangeflesh' | 'kiwiflesh' | 'avocadoflesh' | 'turquoise' | 'rhodonite' | 'tigereye' | 'tatami' | 'flutedwood' | 'subwaytiles' | 'canewebbing' | 'rammedearth' | 'copperpatina' | 'birdseyemaple' | 'breezeblock' | 'basketweavepavers' | 'ripstop' | 'octagondot' | 'truchettiles' | 'standingseam' | 'damascus' | 'windmillpavers' | 'castiron' | 'porphyry' | 'linen' | 'chippedenamel' | 'perforatedleather' | 'argyle' | 'chevronparquet' | 'ginkgoleaf' | 'pressedtin' | 'sashiko' | 'ashlar' | 'gabion' | 'gingham' | 'mossypavers' | 'bamboocrosscut' | 'moire' | 'oakleaf' | 'rhombille' | 'fossillimestone' | 'seigaihatiles' | 'tuftedleather' | 'louveredmetal' | 'herringbonebrick' | 'shibori' | 'scallopedslate' | 'saltpan' | 'dogbonepavers' | 'palmendgrain' | 'asanoha' | 'lotusseedpod' | 'crowncaps' | 'cofferedconcrete' | 'woodworm' | 'calcadawaves' | 'ikat' | 'slottedwood' | 'hollyleaf' | 'englishbond' | 'rebar' | 'starfruit' | 'diamondrustication' | 'bargello' | 'saffiano' | 'cocoamat' | 'suminagashi' | 'vermiculite' | 'cairotiles' | 'guilloche' | 'seaurchintest' | 'crystallineglaze' | 'shirring' | 'sunburstveneer' | 'rakedgravel' | 'flintwall' | 'frenchknots' | 'artichoke' | 'splitlockwashers' | 'flemishbond' | 'satinweave' | 'lotusroot' | 'cardboardedge' | 'hexnuts' | 'orbicularjasper' | 'acornbarnacles' | 'circularpavers' | 'snowflaketiles' | 'sawblades' | 'pistachios' | 'polkadotfabric' | 'cucumberslices' | 'monsteraleaf' | 'crossstitch' | 'staranise' | 'logcabinparquet' | 'countersunkmetal' | 'trilobitefossil' | 'eyeletcotton' | 'dendriticagate' | 'ravioli' | 'rollerchain' | 'mapleleaf' | 'smocking' | 'quatrefoiltile' | 'okraslice' | 'eggcarton' | 'greekkey' | 'seedbeads'`; `ProceduralMaterialOptions` accepts integer `size` 32–1024 (default 256) and unsigned 32-bit integer `seed` 0–4294967295 (default 1), plus an optional `tint` of three per-channel 0–4 multipliers that recolors the pigment without changing mortar or the other maps. Pass a `ProceduralMapCache` as `cache` to reuse identical generations; each preset still owns its textures. Set `heightMap: true` to also generate a linear height map (R, 0 deepest–1 highest); `createMaterial()` binds it as `opticalMaps.heightTexture`, which PBR parallax (`finish.heightScale`) then samples instead of normal Z. It does not enable parallax by itself, is included in cache keys and worker transfers, and is destroyed with the preset. Passing `workerPool` (from `createProceduralWorkerPool()`, a borrowed `NativeWorkerPool` running the published `workers/procedural-material.worker.js` or an app module installing `trustedProceduralMapsJob` as `procedural.maps`) moves generation off the calling thread with byte-identical output; without it generation stays synchronous. The caller owns and destroys the pool; texture acquisition still happens on the main thread. Invalid values reject creation. Metal, rust, copperpatina, chippedenamel, gabion, diamondplate, hammeredmetal, galvanized, corrugatedmetal, standingseam, damascus, castiron, pressedtin, louveredmetal, crowncaps, rebar, guilloche, splitlockwashers, hexnuts, sawblades, countersunkmetal, rollerchain, perforatedmetal, expandedmetal, wiremesh, knurledmetal, engineturned, goldleaf, chainmail, rivetedmetal, weldedmetal, draincover and pyrite use metallic factor 1; other kinds use 0 and stay dielectric.

Also accepted: `flutedwood` for rounded wooden wall-panel slats, recessed dark grooves and longitudinal grain. Use `await ProceduralMaterial.create('flutedwood', { seed: 7 })`; `proceduralRepeats('flutedwood', 1)` returns 3.125 repeats per meter. The four maps stay opaque dielectric (metallic 0), without geometry displacement; remove borrowers before destroying the preset.

`subwaytiles` provides green glazed rectangular tiles in staggered rows, with flat faces, rounded bevels and rough recessed grout. Each 0.6 m tile contains two columns and four rows. Its four seeded periodic maps remain opaque dielectric (metallic 0); relief is normal mapping only, without new geometry, displacement or ownership rules.

`canewebbing` combines woven cardinal ribbons and two diagonal lacing directions around recessed octagons. Each 0.24 m tile contains eight-by-eight cells. Use `await ProceduralMaterial.create('canewebbing', { seed: 7 })`; all four maps are seeded, periodic, opaque dielectric (metallic 0). Openings are dark backing with normal/AO shading, not transparent holes or displaced geometry; options, repeats and resource ownership are unchanged.

`rammedearth` provides eight compacted earth layers with gently warped seams, fine grains and pores; one UV tile spans 2 m. Use `await ProceduralMaterial.create('rammedearth', { seed: 7 })`. Layer colors do not become raised terraces. The four maps are seeded, periodic, opaque dielectric (metallic 0), with normal/roughness/AO relief only; geometry, options, repeats and texture ownership are unchanged.

`copperpatina` mixes exposed copper and green oxide across a 0.5 m tile. Use `await ProceduralMaterial.create('copperpatina', { seed: 7 })`. Shared coverage drives color, metallic, roughness and shallow relief: exposed copper is metallic 1, while rough oxide is dielectric 0. Both `material` and `createMaterial()` default to metallic factor 1 so the map retains this mixture. Four seeded periodic maps remain OPAQUE; no new geometry or shader is introduced, and options and caller ownership are unchanged.

`birdseyemaple` provides scattered dark eyes, fine elliptical rings and bending longitudinal grain across six-by-six seeded cells per 0.24 m tile. Use `await ProceduralMaterial.create('birdseyemaple', { seed: 7 })`. Dark eyes do not become raised knots: relief is shallow normal mapping only. Four periodic maps remain opaque dielectric (metallic 0), without new geometry or shaders; options, repeats and texture ownership are unchanged.

`breezeblock` provides rounded quatrefoil recesses, rough concrete frames and narrow grout seams across four-by-four cells per 0.8 m tile. Use `await ProceduralMaterial.create('breezeblock', { seed: 7 })`. Openings are dark opaque recesses with normal/AO shading, not transparent or geometric holes. Four seeded periodic maps remain opaque dielectric (metallic 0); options, repeats and texture ownership are unchanged.

`basketweavepavers` pairs two rectangular clay bricks per square, alternating their orientation between neighboring squares, with beveled edges, recessed grout and seeded per-brick color variation. A 0.8 m tile holds four-by-four squares and 32 bricks. Use `await ProceduralMaterial.create('basketweavepavers', { seed: 7 })`. Four seeded periodic maps remain opaque dielectric (metallic 0); this is shading/normal mapping only, with unchanged options, repeats and texture ownership.

`ripstop` models fine warp/weft texture separately from paired reinforcement threads, with four-by-four reinforced squares per 0.04 m tile. Use `await ProceduralMaterial.create('ripstop', { seed: 7 })`. Four seeded periodic maps remain opaque dielectric (metallic 0); this is appearance/normal mapping only, not cloth geometry or tear-resistance physics. Options, repeats and texture ownership are unchanged.

`octagondot` combines light octagonal tiles with equally raised dark diamond insets, smooth bevels and rough recessed grout. A 0.8 m tile contains four-by-four main tiles. Use `await ProceduralMaterial.create('octagondot', { seed: 7 })`. Four seeded periodic maps remain opaque dielectric (metallic 0); this is shading/normal mapping only, with unchanged options, repeats and texture ownership.

`truchettiles` rotates paired quarter-circle motifs by seed, joining at edge midpoints into curved patterns. A 0.8 m tile holds four-by-four glazed square tiles; pigment does not raise the surface. Use `await ProceduralMaterial.create('truchettiles', { seed: 7 })`. Four seeded periodic maps remain opaque dielectric (metallic 0); this is shading/normal mapping only, with unchanged options, repeats and texture ownership.

`standingseam` provides broad flat pans, narrow flat-topped seams and recessed toes, unlike continuously corrugated metal. A 2 m tile holds four panels. Use `await ProceduralMaterial.create('standingseam', { seed: 7 })`. Four seeded periodic maps remain opaque; metallic B and the default factor are both 1, representing unpainted metal. This is shading/normal mapping only, not geometry; options, repeats and texture ownership are unchanged.

`damascus` combines fine strata and seeded local eye-like folds on etched steel. Dark layers are rougher and slightly recessed across a 0.12 m tile; relief remains shallow rather than embossed. Use `await ProceduralMaterial.create('damascus', { seed: 7 })`. Four seeded periodic maps remain opaque, with metallic B and the default factor both 1. No new geometry or BRDF is introduced; options, repeats and texture ownership are unchanged.

`windmillpavers` wraps four 2:1 clay pavers around an equally raised dark square, with smooth bevels, recessed grout and seeded fine grain and tone variation. One 0.9 m tile contains four windmill groups (20 pavers). Use `await ProceduralMaterial.create('windmillpavers', { seed: 7 })`. Four opaque dielectric maps use metallic 0; no geometry or shader is added, and options, repeats and texture ownership are unchanged.

`castiron` combines fine casting grain with sparse seeded pores that are darker, rougher and recessed below the base surface, rather than broad overlapping hammer impressions. Use `await ProceduralMaterial.create('castiron', { seed: 7 })` for a 0.1 m tile. Four opaque maps use metallic B and default factor 1, representing unpainted, unoxidized metal. No geometry, shader or oxide-film simulation is added; options, repeats and texture ownership remain unchanged.

`porphyry` embeds seeded pale, elongated feldspar crystals at varied orientations in a fine red-purple matrix. The crystals are smoother but flush with the polished base, not raised stone fragments. Use `await ProceduralMaterial.create('porphyry', { seed: 7 })` for a 0.3 m tile. Four opaque dielectric maps use metallic 0; no geometry or shader is added, and options, repeats and texture ownership are unchanged.

`linen` uses seeded warp and weft yarns whose widths vary along their length, with smooth alternating fiber coverage and raised plain-weave crossings. Use `await ProceduralMaterial.create('linen', { seed: 7 })` for a 0.04 m tile with 16×16 crossings. Yarn gaps are rough opaque recesses, not alpha holes. Four opaque dielectric maps use metallic 0; no geometry, shader or transmission model is added, and options, repeats and texture ownership are unchanged.

`chippedenamel` places glossy ivory dielectric enamel over rougher metal. Seeded irregular chips expose darker recessed metal without curled paint edges. Use `await ProceduralMaterial.create('chippedenamel', { seed: 7 })` for a 0.25 m tile. Intact enamel uses metallic B=0 and exposed metal B=255; default factor 1 preserves the mixed map. Four maps remain opaque, with no new geometry or shader; options, repeats and texture ownership are unchanged.

`perforatedleather` combines fine seeded brown leather grain with eight-by-eight staggered round perforations per 0.04 m tile. Smooth hole walls descend to dark rough opaque backing, without raised quill collars. Use `await ProceduralMaterial.create('perforatedleather', { seed: 7 })`. Four periodic opaque dielectric maps use metallic 0; this is normal/AO shading, not transparent holes or geometry. Options, repeats and texture ownership are unchanged.

`argyle` overlays fine crossing diagonal lines on alternating burgundy/rose diamonds. Seeded fine grain and plain-weave yarns supply relief independently of the pigment; diamond edges are not raised or grouted. Use `await ProceduralMaterial.create('argyle', { seed: 7 })` for a 0.16 m tile. Four periodic opaque dielectric maps use metallic 0; no geometry or shader is added, and options, repeats and texture ownership are unchanged.

`chevronparquet` joins opposing 45-degree wooden boards at miters to form V-shaped rows, with seeded per-board tones, longitudinal grain, smooth bevels and recessed joints. It differs from basket-pattern parquet. Use `await ProceduralMaterial.create('chevronparquet', { seed: 7 })` for a 0.6 m tile. Four periodic opaque dielectric maps use metallic 0; relief is normal mapping only, with unchanged geometry, options, repeats and texture ownership.

`ginkgoleaf` provides golden fan-shaped leaves with seeded orientations and tones, a central notch, a narrow petiole and fine radial veins. Dark gaps are opaque backing. Use `await ProceduralMaterial.create('ginkgoleaf', { seed: 7 })` for a 0.24 m tile. Four periodic opaque dielectric maps use metallic 0; no leaf geometry, alpha cutouts or transmission model is added, and options, repeats and texture ownership are unchanged.

`pressedtin` is a 0.6 m tile of stamped tin ceiling panels: four framed panels carry four raised petals and a central boss over a seeded fine-grain metal sheet. These smooth embossed ornaments are not random hammer dents. All four maps are opaque; the metallic map and default factor are 1, with no added geometry or renderer capability.

`sashiko` is a 0.064 m tile of indigo sashiko cloth: raised ivory running stitches alternate along both axes with seeded row/column phases, leaving dark indigo plain weave between stitches and at grid intersections. This is neither a printed motif nor continuous reinforcement yarn. All four maps are opaque dielectric, metallic 0, with no added geometry or renderer capability.

`ashlar` is a 1.2 m tile of modular cut-stone masonry: eleven unequal rectangular stones have seeded per-stone tones, mineral grain, smooth bevels and recessed T joints. Internal lookup grid lines do not become joints, unlike a regular equal-sized brick pattern. All four maps are opaque dielectric, metallic 0, with no added geometry or renderer capability.

`gabion` is a 0.4 m tile of steel-mesh stone gabion surface: a smoother square steel grid sits above rounded stones with seeded sizes, orientations and tones, over dark opaque backing. All four maps are opaque; metallic B is 1 on steel and 0 on stone, with default metallic factor 1. This is not penetrable cage geometry and adds no renderer capability.

`gingham` is a 0.08 m tile of blue and white plain-woven check cloth: equal-width warp/weft color bands form light, dark and mixed checks. Mixed checks expose alternating dyed and undyed yarns rather than a flat intermediate paint color. Relief comes only from weave and seeded fiber grain, not raised color squares. All four maps are opaque dielectric, metallic 0, with no added geometry or renderer capability.

`mossypavers` combines beveled gray paving stones with patchy green moss confined to recessed joints. Moss cushions rise above bare joints but remain below the smoother stone crowns; stone faces retain neutral seeded variation instead of a blanket green tint. Its 0.8 m tile uses four opaque dielectric maps and the existing options and ownership contract.

`bamboocrosscut` shows pale annular cut walls, dark hollow backing and smoother outer rinds. Seeded tube diameters and wall thicknesses vary; fine pores distinguish the cut face without timber growth rings. Its 0.24 m tile uses four opaque dielectric maps: hollows are dark backing, not perforated geometry. Existing options and ownership remain unchanged.

`moire` is purple watered silk: a smooth low-frequency beat envelope modulates color and roughness, while only fine yarns affect height and AO. Broad bands are not embossed. Its 0.08 m tile uses four opaque dielectric maps; this baked appearance approximation adds no diffraction, view-dependent color shift or anisotropic BRDF. Existing options and ownership remain unchanged.

`oakleaf` provides green oak leaves with seeded rotations and tones, paired rounded lobes and deep sinuses, a central rib, branching veins and short petioles rather than ginkgo fans. Its 0.3 m tile uses four opaque dielectric maps; gaps are dark backing, not cutout geometry. Existing options and ownership remain unchanged.

`rhombille` combines three tonal four-sided lozenges into a cube-like tiling illusion, with beveled edges and neutral grout at shared junctions. All tile faces remain coplanar: the cube illusion is tonal, not raised cube geometry. Its 0.9 m tile uses four opaque dielectric maps and the existing options and ownership contract.

`fossillimestone` is polished spiral-fossil limestone: a beige matrix contains seeded sizes, elliptical orientations and coil phases, with pale spiral walls and fine septa separating darker mineral-filled chambers. Fossils remain flush with the matrix; only fine stone grain contributes relief, not the coil or outline. This is a cut stone surface rather than a raised intact nautilus shell. The tile covers 0.6 m, uses four opaque maps and metallic 0, and retains existing borrowing and destruction contracts.

`seigaihatiles` prints staggered groups of nested ivory wave arcs on blue glaze, with seeded tonal variation and front rows covering lower arcs behind them. Independent square-tile bevels and neutral gray joints divide the surface. The wave pigment is coplanar rather than raised tubing. The tile covers 0.6 m, uses four opaque maps and metallic 0, and retains existing borrowing and destruction contracts.

`tuftedleather` is dark brown diamond-tufted upholstery with padded crowns, crossing compressed folds, recessed pockets and round leather-covered buttons. Each button rises above its pocket but remains below the cushion crown. Seeded fine leather grain and wear variation cover the surface; there are no quilting yarns or metallic studs. The tile covers 0.8 m, uses four opaque maps and metallic 0, and retains existing borrowing and destruction contracts.

`louveredmetal` is stamped metal vent sheet: each blade joins the plate at both ends and rises from its upper attachment to a higher lower lip, followed by a dark recessed slot with opaque backing. It is neither endless corrugation nor symmetric tubing. Seeded fine grain, a 0.6 m tile and four opaque maps use metallic B and default factor 1. There are no actual cut-through holes, transparency or added geometry; borrowing and destruction contracts are unchanged.

`herringbonebrick` interlocks 2:1 red paving bricks in alternating horizontal and vertical diagonal bands with T joints. Each brick has seeded fired-clay variation, fine grain, beveled edges and neutral gray joints. A long brick spans its internal grid boundary without a false joint; this is neither running bond nor woven herringbone. The tile covers 1.2 m, uses four opaque maps and metallic 0, and retains existing borrowing and destruction contracts.

`shibori` is indigo resist-dyed cotton with paired pale rings, seeded irregular feathered boundaries and radial tie marks. Centers and spaces between rings retain indigo. Dye changes pigment only: the rings are not embossed, and the underlying plain-weave relief and fine grain remain independent. The tile covers 0.24 m, uses four opaque maps and metallic 0, and retains existing borrowing and destruction contracts.

`scallopedslate` models staggered rounded-tail slate shingles. Upper tails overlap lower courses, with raised curved lips and recessed shadows below them; seeded slate tones, grain and strata continue across each face. Three courses composite from back to front to preserve overlap at row wrap. These are shaped overlapping tails, not curved color decals or straight tabs. The 1.2 m tile uses four opaque maps and metallic 0; overlap is baked into maps, not added geometry, and existing borrowing and destruction contracts remain unchanged.

`saltpan` models evaporated salt crust: seeded irregular polygons have low interiors enclosed by connected pale, raised and rougher salt ridges, with fine grain and small crystals across the surface. Shared half-plane boundaries and smooth shoulders retain corner and wrap continuity. Unlike dry mud cracks or glaze crazing, the boundaries rise above the interiors. The 3 m tile uses four opaque maps and metallic 0, adds no geometry, and retains existing borrowing and destruction contracts.

`dogbonepavers` interlocks concrete pavers with wide ends joined through narrow waists. Adjacent columns shift half a brick so each wide end fills its neighbor’s waist recess. Smooth shoulders, beveled edges, neutral gray joints, seeded tones, aggregate and fine grain define the surface. The complementary outlines actually tessellate; they are not decals on rectangular bricks or isolated dogbone shapes. The 0.8 m tile uses four opaque maps and metallic 0 and retains existing borrowing and destruction contracts.

`palmendgrain` shows a palm wood cross section: dark vascular bundles with seeded offsets, rotations and axis lengths sit flush in a pale golden-brown matrix, while paired cut vessels form localized recesses. There are no annual rings, raised knots or hollow bamboo tubes. Fine grain and matrix tone use independent periodic fields. The 0.024 m tile uses four opaque maps and metallic 0 and retains existing borrowing and destruction contracts.

`asanoha` prints ivory hemp-leaf geometry on burgundy cloth: a three-direction triangular lattice and three internal spokes per triangle form connected leaf motifs. Smooth saturated lattice strokes cover triangle ownership boundaries. Dye changes color only, not relief; an independent plain weave and seeded fine grain control height, roughness and AO. The 0.12 m tile uses four opaque maps and metallic 0 and retains existing borrowing and destruction contracts.

`lotusseedpod` shows dried lotus pods with a central chamber and six surrounding seeded chambers in brown receptacles. Raised lips border each recess; smoother seeds rise from chamber floors but stay below the pod face. Pod sizes, chamber positions, apertures and fine grain vary reproducibly. Dark gaps and chambers have opaque backing, not cutout geometry. The 0.3 m tile uses four opaque maps and metallic 0 and retains existing borrowing and destruction contracts.

`crowncaps` forms metal crown bottle caps with flat tops, raised rolled rims and descending skirts. Twenty-one crimps per cap, with seeded rotation, affect both outer outlines and skirt height; fine grain preserves the flat crowns. Angular modulation is confined to the skirt, avoiding a pole singularity. Dark gaps retain opaque metal backing. The 0.112 m tile uses four opaque maps, metallic B 255 and material factor 1, retaining existing borrowing and destruction contracts.

`cofferedconcrete` models a coffered concrete slab: continuous flat-topped crossing ribs surround nine flat-bottomed square chambers, with sloping walls joining the ribs smoothly. Wall corners use a smooth product rather than a cusped max. Seeded aggregate, grain and shallow pores preserve the structural tiers; chamber beds have reduced AO. The 2.4 m tile uses four opaque dielectric maps with metallic 0, normal mapping rather than added geometry, and unchanged borrowing and destruction contracts.

`woodworm` exposes finite winding insect galleries across longitudinal timber grain, with seeded rotation and bend amplitude. Round exit bores at both ends are deeper than the galleries and retain opaque backing rather than alpha-cut holes. Smooth unions join each gallery to its bores, compact supports remain inside their cells, and grain/fibers use cached noise. The 0.16 m tile uses four opaque dielectric maps with metallic 0, normal mapping rather than added geometry, and unchanged borrowing and destruction contracts.

`calcadawaves` forms Portuguese black-and-white wave pavement from 256 beveled stone tesserae. Each entire stone stays black or white; the arrangement creates undulating bands rather than a printed curve crossing stones or joints. Band color does not control height, roughness or AO. Seeded grain and aggregate supply microvariation, with lower gray joints separating the stones. The 1.28 m tile uses four opaque dielectric maps with metallic 0, normal mapping rather than added geometry, and unchanged borrowing and destruction contracts.

`ikat` is warp-dyed cloth with pale diamonds on deep indigo. Seeded alignment shifts along the warp create feathered dye edges, repeating along the same yarns in successive rows. Dye affects pigment only: independent 64-thread plain weave controls height, roughness and AO, without embossed diamonds; softened tips avoid derivative cusps. The 0.16 m tile uses four opaque dielectric maps with metallic 0 and unchanged borrowing and destruction contracts.

`slottedwood` models a wood panel with 32 finite capsule slots, staggered by half a cell between rows. Smooth sidewalls and circular ends join intact timber bridges. Distances account for rectangular cell pitch so end caps remain circular on the square UV tile. Seeded longitudinal grain stays on the wood; slot floors use rougher dark opaque backing. The 0.8 m tile uses four opaque dielectric maps with metallic 0. This is surface normal mapping, not cutout geometry or acoustic simulation; borrowing and destruction contracts are unchanged.

`hollyleaf` depicts seeded rotated glossy green holly leaves with three pairs of pointed marginal spines, an apical point, recessed notches, a lower petiole and raised central/branch veins. Compact smooth supports keep edges and tips differentiable, unlike the rounded lobes of oak leaves. The 0.24 m tile uses four opaque dielectric maps with metallic 0; this is surface shading, not plant geometry or transparent cutouts. Borrowing and destruction contracts are unchanged.

`englishbond` alternates square header courses with double-width stretcher courses. Stretcher joints align with neighboring header centers. All 48 seeded red-brown bricks use the same physical mortar and bevel widths, with smooth corners, recessed joints and grain restricted to brick faces. The 0.8 m tile uses four opaque dielectric maps with metallic 0; this is surface shading, not masonry geometry or structural simulation. Borrowing and destruction contracts are unchanged.

`rebar` forms four rounded steel shafts with twelve raised angled ribs each, reversing rib direction on neighboring bars. Circular crowns taper smoothly into recessed dark metal backing; seeded grain preserves the ridge/valley relief. The 0.12 m tile uses four opaque maps, metallic B 255 and material factor 1. This is surface shading, not rebar geometry or structural simulation; borrowing and destruction contracts are unchanged.

`starfruit` depicts nine seeded rotated five-lobed slices with golden edges, flat pale-yellow flesh and five radial elliptical seed chambers. Chambers are darker, lower and rougher than the flesh. Smooth supports preserve edge continuity, while the whole central region is independent of polar angle. The 0.18 m tile uses four opaque dielectric maps with metallic 0, not fruit geometry, transparency or subsurface scattering; borrowing and destruction contracts are unchanged.

`diamondrustication` forms sixteen diamond-point stone bosses. Four approximately planar flanks meet at central apexes and diagonal ridges; softened boss feet join independent flat stone collars before outer bevels descend into mortar. Seeded stone tones and grain preserve the apex/collar/joint tiers. The 1.6 m tile uses four opaque dielectric maps with metallic 0, not masonry geometry; borrowing and destruction contracts are unchanged.

`bargello` forms purple-toned flame needlepoint from 32 columns of long vertical stitches. Neighboring columns step by a quarter stitch length, rising and falling into four-tone flame bands. Rounded yarn crowns and longitudinal fibers meet dark backing smoothly at sides and ends; color tiers do not add separate relief. The 0.064 m tile uses four opaque dielectric maps with metallic 0, not yarn geometry; borrowing and destruction contracts are unchanged.

`saffiano` forms brown crosshatched leather with two fine diagonal groove families. Grooves are lower, darker and rougher than the leather plateaus. A smooth union gives intersections the same pressed depth as single grooves rather than double-depth pits; seeded micrograin preserves the fine surface. The 0.032 m tile uses four opaque dielectric maps with metallic 0, without added leather geometry or BRDF; borrowing and destruction contracts are unchanged.

`cocoamat` forms a coir coconut-fiber mat: four seeded, rotated short curved fibers per cell in an 8×8 grid overlap across wrapped neighbours. Smooth unions retain rounded crowns while compact sides and tips descend to the dark, rough backing. The 0.08 m tile uses four opaque dielectric maps with metallic 0, distinct from straight straw or regular carpet tufts; it adds no fiber geometry and preserves borrowing and destruction contracts.

`suminagashi` forms ink-marbled paper with seeded two-axis domain warping and smooth contour bands of charcoal ink separated by warm bare paper. Ink affects color and roughness only; independent paper tooth and fibers provide the shallow relief, while flat-sheet AO avoids engraved ink grooves. The 0.24 m tile uses four opaque dielectric maps with metallic 0, without fluid simulation or paper geometry; borrowing and destruction contracts are unchanged.

`vermiculite` forms expanded golden-brown mineral granules with accordion-like lamellae. Thirty-six seeded, rotated elongated flakes in staggered rows have higher, brighter, smoother crests and lower, darker, rougher interlayers. Crests also widen the flake edges rather than merely painting stripes; dark backing separates the grains. The 0.06 m tile uses four opaque dielectric maps with metallic 0, without mineral geometry or expansion simulation; borrowing and destruction contracts are unchanged.

`cairotiles` is a true Cairo pentagonal tessellation: thirty-two congruent tiles alternate reflections and rotations, each with two right angles and three 120-degree corners forming four-way and three-way joints. All five edges share physical grout and smooth bevel widths; seeded warm-brown tones do not change tile height. This is not a print on square tiles. The 0.8 m tile uses four opaque dielectric maps with metallic 0, adds no paving geometry and preserves borrowing and destruction contracts.

`guilloche` engraves three nested, closed eight-lobed contours in each of four seeded rosettes on silver-colored metal. Cuts are lower, darker and rougher than the unbroken plate; every cut stays clear of the polar centre and cell boundaries. The 0.1 m tile uses four opaque maps with metallic B uniformly 255 and factory factor 1, distinct from circular abrasions or raised embossing. It adds no engraving geometry and preserves borrowing and destruction contracts.

`seaurchintest` forms nine seeded, rotated ivory sea urchin skeletal shells. Each domed face has five paired radial pore rows, a recessed apical opening and interradial tubercles. Fifty paired pores are lower, darker and rougher than the shell; the edge slopes smoothly into a dark backing. The 0.24 m tile uses four opaque dielectric maps with metallic 0, not transparent holes or shell geometry, and preserves borrowing and destruction contracts.

`crystallineglaze` embeds sixteen seeded crystal rosettes with radial needles, growth bands and irregular rims in blue-green ceramic glaze. Crystals change only color and roughness; independent coating grain supplies height and AO stays flat, rather than forming raised frost. The 0.16 m tile uses four opaque dielectric maps with metallic 0. It adds no crystal geometry or firing simulation and preserves borrowing and destruction contracts.

`shirring` forms mauve gathered fabric with twenty-four fine folds compressed by four horizontal elastic stitch rows. Between rows the gathers rise and wander slightly; each row retains forty-eight short stitches and a fine weave. The 0.12 m tile uses four opaque dielectric maps with metallic 0, distinct from straight pleats, striped seersucker or diamond quilting. It adds no cloth geometry or elasticity simulation and preserves borrowing and destruction contracts.

`sunburstveneer` inlays four circular medallions, each with twelve veneer wedges whose elongated grain follows its radial axis. The centre plug, wedges and surrounding dark board stay flush; only narrow inlay joints recess, darken and become rougher. The 0.8 m tile uses four opaque dielectric maps with metallic 0, not end-grain rings or raised disks. It adds no wood geometry and preserves borrowing and destruction contracts.

`rakedgravel` forms eight parallel garden rake channels with flat beds, rounded shoulders and raised banks. Seeded stone caps and inter-grain shadows remain on both the channel beds and banks, rather than becoming fine sandy sinusoidal ripples. The 0.8 m tile uses four opaque dielectric maps with metallic 0. It adds no stone geometry or raking simulation and preserves borrowing and destruction contracts.

`flintwall` uses a six-by-six staggered arrangement of seeded angular flints: dark knapped interiors have shallow eccentric fracture arcs, pale chalk cortex is rougher, and mortar joints sit below the stone faces. Seed controls each stone’s rotation, outline and tone. These are not domed cobbles or metallic coatings. The 1.2 m tile uses four opaque dielectric maps, metallic 0 and the existing borrowing/destroy contract; no masonry geometry is added.

`frenchknots` places six-by-six pink knots on cream woven cloth. Two gently warped yarn-wrap ridges surround each closed central dimple; seed controls placement, elliptical rotation and phase, while independent fine weave remains visible between knots. These are not long satin stitches or continuous boucle yarn courses, and the dimples do not open holes through the backing. The 0.06 m tile uses four opaque dielectric maps, metallic 0 and the existing borrowing/destroy contract; no embroidery geometry or needle simulation is added.

`artichoke` uses six-by-six staggered overlapping green bracts with broad roots, tapering lifted tips, a central midrib and three pairs of fine branching veins. Seed controls bract tones and micrograin; overlap edges retain subtle AO shadows. These are not woody truncated pinecone scales or sparse dragonfruit projections. The 0.18 m tile uses four opaque dielectric maps, metallic 0 and the existing borrowing/destroy contract; no leaf geometry is added.

`splitlockwashers` places four-by-four seeded rotated split rings on a low steel plate. Each flat radial band rises helically around the ring, leaving separated high and low cut ends with narrow inner/outer bevels. Center holes, cuts and outer gaps expose the same opaque plate rather than transparent holes. These are not closed chainmail rings or solid crown caps. The 0.08 m tile uses four opaque maps; both the plate and washers have metallic channel/factory factor 1. Borrowing/destroy behavior is unchanged; no washer geometry or spring simulation is added.

`flemishbond` alternates four pairs of dark headers and double-width stretchers within each of sixteen courses, yielding 128 bricks. Adjacent courses shift so each header centers over a stretcher. Horizontal and vertical mortar/bevels retain equal physical widths; seeded brick tones and micrograin/aggregate do not give the two orientations different face heights. Unlike English bond, every course contains both orientations. The 1.2 m tile uses four opaque dielectric maps, metallic 0 and the existing borrowing/destroy contract; no brick geometry is added.

`satinweave` forms a 25-by-25 five-harness warp satin: four warp floats precede each isolated weft interlacing, with a two-thread step between courses. Height and roughness exchange yarn dominance at those crossings; seed controls fine-fiber phase and micrograin. This is neither one-over-one plain weave nor continuous twill. Gloss still uses existing roughness/normal maps, not a new anisotropic BRDF. The 0.02 m tile uses four opaque dielectric maps, metallic 0 and the existing borrowing/destroy contract; no cloth geometry is added.

`lotusroot` forms a 3-by-3 array of pale rhizome slices with thin brown rind, eight radially elongated air canals and a small central hole. Seed controls slice rotation and canal axes. Flesh bridges and rind remain flush; canals sit below the flesh without seedpod seeds or raised collars. The 0.24 m tile uses four opaque dielectric maps, metallic 0 and existing borrowing/destroy semantics. Low dark backing fills canals and spaces between slices; no alpha holes or slice geometry are added.

`cardboardedge` shows six stacked cut sections, each with four sinusoidal medium periods meeting paired flat liners. Seed controls per-layer phase and pulp detail. Medium and liners share the cut-face height without doubled contact ridges; cavities have low dark backing. Unlike the face corrugation of `corrugatedcardboard`, this depicts the exposed edge. The 0.024 m tile uses four opaque dielectric maps, metallic 0 and existing borrowing/destroy semantics; no cardboard geometry or alpha holes are added.

`hexnuts` forms a 4-by-4 array of seeded rotated hexagonal metal faces with six straight beveled sides, separate circular recessed bores and fine concentric machining marks. Corners extend beyond the flat-side radius; bores and outside spaces expose the same low steel backing. This is neither a circular washer nor a cross-recessed screw head, and machining marks do not represent helical threads. The 0.08 m tile uses four opaque maps, full metallic channels and factory factor 1, with existing borrowing/destroy semantics; no nut geometry or alpha holes are added.

`orbicularjasper` embeds 25 separate orbicles in green matrix. Seed controls center offsets, radii and three or four pale concentric mineral rings. Unlike connected banding or a geode cavity, these polished inclusions affect only color/roughness: height contains independent micrograin and AO remains 1. The 0.12 m tile uses four opaque dielectric maps, metallic 0 and existing borrowing/destroy semantics; no mineral geometry is added.

`acornbarnacles` forms a 4-by-4 array of seeded rotated shells with six radial wall-plate seams, 48 fine striae and a recessed diamond aperture. Walls rise inward from the broad base; the aperture lies below the rim, unlike sea-urchin paired pore rows or circular coral septa. The 0.12 m tile uses four opaque dielectric maps, metallic 0 and existing borrowing/destroy semantics. Low dark backing fills apertures and outside gaps; no barnacle geometry, alpha holes or biological animation is added.

`circularpavers` forms a 2-by-2 array of circular paving medallions. Each contains a center disk and four courses of 8/16/24/32 wedge stones, totaling 324 stones. Alternating courses shift by half a sector; seed controls medallion rotation and stone tones. Circular and radial joints share physical grout/bevel widths, and stone faces remain flush. The 1.6 m tile uses four opaque dielectric maps, metallic 0 and existing borrowing/destroy semantics; no paving geometry is added.

`snowflaketiles` forms a 4-by-4 array of blue glazed ceramic tiles with seeded rotations of six-armed snowflakes, each arm carrying two pairs of diagonal branches. White pigment changes color/roughness only; tile faces remain flush, with normal/AO describing the square joints and micrograin rather than embossed snowflakes. The 0.8 m tile uses four opaque dielectric maps, metallic 0 and existing borrowing/destroy semantics; no snow-crystal geometry or transparency is added.

`sawblades` forms a 4-by-4 array of seeded rotated metal disks, each with 24 asymmetric teeth, long backs, short leading edges, recessed gullets and a round arbor hole. Flat blade faces carry fine concentric machining marks; holes and exterior spaces expose the same low metal backing. The 0.8 m tile uses four opaque maps, full metallic channels and factory factor 1 with existing borrowing/destroy semantics; no blade geometry, transparent holes or rotation animation is added.

`pistachios` forms a 5-by-5 array of seeded rotated elongated nuts. Pale shell lips sit above green kernels, with darker, lower gaps on both sides of each kernel and fine longitudinal fibers on the shell. Exterior spaces retain a low opaque backing. The 0.15 m tile uses four opaque dielectric maps, metallic 0 and existing borrowing/destroy semantics; no shell geometry or transparent openings are added.

`polkadotfabric` places a 6-by-6 array of cream dots on blue plain-woven cloth, shifting alternate rows by half a cell. Seed controls print translation and micrograin. Pigment changes color/roughness only; the underlying 96-thread warp/weft relief and AO remain independent of dot rims. The 0.12 m tile uses four opaque dielectric maps, metallic 0 and existing borrowing/destroy semantics; no bead geometry or transparent mesh is added.

`cucumberslices` forms a 3-by-3 array of seeded rotated circular cuts with dark green rind, pale flesh and three radial gel chambers containing three elongated pale seeds each. Flesh, gel, seeds and rind share a flush cut face; color/roughness differences do not create air canals or raised seeds. The 0.18 m tile uses four opaque dielectric maps, metallic 0 and existing borrowing/destroy semantics; no slice geometry or translucent flesh is added.

`monsteraleaf` forms a 3-by-3 array of seeded rotated broad leaves with six enclosed elongated fenestrations, six open margin cuts, a basal notch, central rib and oblique side veins. Leaf bridges separate the enclosed holes from the open cuts; holes and exterior spaces expose the same low dark backing. The 0.9 m tile uses four opaque dielectric maps, metallic 0 and existing borrowing/destroy semantics; no transparent holes, leaf geometry or growth animation is added.

`crossstitch` places an 8-by-8 array of raised X stitches on woven cloth. Each X consists of two finite diagonal yarns with rounded cross-sections and softened ends; the upper yarn consistently covers the lower yarn at the crossing without adding their heights. Seeded yarn tones and fine fibers complement the cloth weave. The 0.08 m tile uses four opaque dielectric maps, metallic 0 and existing borrowing/destroy semantics; no yarn geometry or punched holes are added.

`staranise` arranges nine seeded rotated stars, each with eight pointed woody pods surrounding recessed cavities and smoother seeds. Pod walls sit above the seeds, seeds above their cavity floors, and gaps between the rays expose a low dark backing. The 0.12 m tile uses four opaque dielectric maps, metallic 0 and existing borrowing/destroy semantics; no pod geometry or transparent gaps are added.

`logcabinparquet` builds four square wood blocks, each containing a central square and eight increasingly long butt-jointed boards in a spiral. Grain follows each board’s long axis, and internal lookup-cell boundaries do not create extra joints. Flat board faces meet recessed narrow seams and smooth bevels. The 1.2 m tile uses four opaque dielectric maps, metallic 0 and existing borrowing/destroy semantics; no board geometry is added.

`countersunkmetal` forms a 6-by-6 grid of deep round bores in a flat metal plate. Each bore has a steep inner wall and a wider conical seat with a straight middle slope and smooth shoulders; fine brushed grain remains subordinate to that profile. The 0.3 m tile uses four opaque maps with a fully metallic B channel and material factor 1, including the low backing inside holes. Existing borrowing/destroy semantics remain unchanged; no transparent holes or machined geometry are added.

`trilobitefossil` places nine seeded rotated low-relief trilobites in lighter stone. Broad head shields carry paired eyes; a raised axial lobe joins the head to a narrower tail, with ten curved paired thoracic ribs separated by recessed grooves. Compact shield overlaps and segment envelopes keep the surface periodic and smooth. The 0.45 m tile uses four opaque dielectric maps, metallic 0 and existing borrowing/destroy semantics; no fossil geometry or scientific species reconstruction is added.

`eyeletcotton` makes a 6-by-6 array of dark circular openings in ivory woven cotton. Each opening has a raised continuous embroidered ring with sixteen seeded radial stitch crests; even the valleys between stitches stay above the cloth. The 0.06 m tile uses four opaque dielectric maps, metallic 0 and existing borrowing/destroy semantics. Openings retain a low opaque backing rather than transparent cutouts; no yarn or hole geometry is added.

`dendriticagate` embeds nine seeded branching mineral inclusions in warm pale polished agate. Five binary branching generations form progressively thinner dark branches without leaf blades or a raised relief silhouette. The 0.15 m tile uses four opaque dielectric maps, metallic 0, and existing borrowing/destroy semantics; color inclusions do not add branch-shaped normal, roughness or AO ridges. This is a stylized mineral pattern, not a geological growth simulation.

`ravioli` makes sixteen golden pasta pillows with slightly seeded filling offsets, flat sealed rims, twenty fork-pressed grooves per piece and gently scalloped cut edges. The central filling stays above the rim while fork marks indent only its outer border. The 0.16 m tile uses four opaque dielectric maps, metallic 0, and existing borrowing/destroy semantics; it adds neither pasta geometry nor filling or cooking simulation.

`rollerchain` shows four staggered rows of roller-chain sideplates, with six links per row. Waisted dogbone plates alternate inner and raised outer layers at shared circular hinge pins, with recessed collar rings and slightly crowned rivet heads. The 0.24 m tile uses four opaque maps with a fully metallic B channel and material factor 1, including the low dark backing between chains. Existing borrowing/destroy semantics are unchanged; this side-profile texture adds no chain geometry, animation or transmission physics.

`mapleleaf` places nine seeded rotated autumn-orange maple motifs, each with five palmate lobes, shallow edge serrations, five raised radiating veins and a narrow petiole. Deep lobe notches reveal the dark backing while the petiole continues below the blade. The 0.3 m tile uses four opaque dielectric maps, metallic 0 and existing borrowing/destroy semantics; this stylized leaf surface adds neither leaf geometry nor botanical species simulation.

`smocking` forms blue-violet honeycomb gathers from paired cloth folds that converge alternately on adjacent rows. Thirty-six short horizontal stitches bind the compressed pinches below the open fold crowns; fine weave and seeded fibers stay subordinate to this gathered profile. The 0.12 m tile uses four opaque dielectric maps, metallic 0 and existing borrowing/destroy semantics. This is a smocked surface, not quilting, simulated cloth, yarn geometry or through-holes.

`quatrefoiltile` places twenty-five turquoise four-lobed glazed tiles between dark diamond inserts. Circular lobes meet in concave shoulders above recessed, rough grout; the smaller diamond inserts sit slightly lower than the main tiles. The 0.5 m tile uses four opaque dielectric maps, metallic 0 and existing borrowing/destroy semantics. It adds no tile geometry or displacement.

`okraslice` arranges nine seeded rotated green okra cross sections. Each five-lobed rind surrounds five recessed chambers, each holding two pale rounded seeds below the solid central tissue and dividing walls. The 0.09 m tile uses four opaque dielectric maps, metallic 0 and existing borrowing/destroy semantics; it adds neither vegetable geometry, actual holes nor food simulation.

`eggcarton` forms a four-by-four tray of grey-beige molded pulp. Sixteen round cups sink below flat saddles, each cup wall carries one raised rib ring, and cone tips rise where four cups meet. Fine pulp fibers stay subordinate to the tray profile. The 0.16 m tile uses four opaque dielectric maps, metallic 0 and existing borrowing/destroy semantics; it adds neither packaging geometry, actual holes nor egg or fiber simulation.

`greekkey` carves a gilded Greek key fret into deep blue-black ceramic. Each of nine square-spiral hooks winds inward to an open tip, and the baseline reaches both cell edges so hooks chain across the tile wrap with a brighter core down every raised line. The 0.45 m tile uses four opaque dielectric maps, metallic 0 and existing borrowing/destroy semantics; it adds neither relief geometry nor real gold or ceramic simulation.

`seedbeads` weaves glossy seed beads in a half-bead-staggered peyote pattern. Each of forty-eight cylindrical beads has a crowned barrel profile and a recessed thread hole at both ends, thread gaps stay low and rough between beads, and per-bead tones are seeded across the blue-to-gold ramp. The 0.06 m tile uses four opaque dielectric maps, metallic 0 and existing borrowing/destroy semantics; it adds neither bead geometry, transparency nor thread simulation.

Also accepted: `chainstitch` for five columns of six linked, tapered hollow embroidery loops above dark blue cloth. Use `await ProceduralMaterial.create('chainstitch', { seed: 7 })`; `proceduralRepeats('chainstitch', 1)` returns 8⅓ repeats per meter (0.12 m tile). Four opaque dielectric maps, metallic 0, optional height and borrowing/destroy semantics are unchanged; no yarn geometry, transparent holes or cloth simulation.

Also accepted: `wingnuts` for paired raised oblique wings and recessed central bores, arranged as sixteen silver nuts alternating by 90° above dark steel backing. Use `await ProceduralMaterial.create('wingnuts', { seed: 7 })`; its 0.12 m tile defaults to metallic 1. Existing four maps, optional height and borrowing/destroy contracts apply; no actual nut geometry, holes, threads or mechanical simulation.

Also accepted: `pomegranateslice` for nine red-rimmed fruit cross sections, each with pale pith, six recessed chambers and seven raised red arils per chamber. Use `await ProceduralMaterial.create('pomegranateslice', { seed: 7 })`; its 0.15 m tile is opaque dielectric with metallic 0. Maps, optional height and borrowing/destroy remain unchanged; no actual fruit geometry, transparency or transmission.

Also accepted: `pawprinttiles` for sixteen ivory glazed squares stamped with recessed cobalt paw prints: four separate toes and a three-lobed palm above rough grey grout. Use `await ProceduralMaterial.create('pawprinttiles', { seed: 7 })`; the 0.6 m tile is opaque dielectric (metallic 0). Existing maps, optional height and ownership apply; no tile geometry or physical stamping.

Also accepted: `dovetailjoint` for outward-flared trapezoidal wood tongues with recessed seams and alternating grain directions. Use `await ProceduralMaterial.create('dovetailjoint', { seed: 7 })`; one UV tile covers 0.48 m and contains eight tongues. Opaque dielectric maps, metallic 0, optional height and ownership stay unchanged; no actual joinery geometry or structural simulation.

Also accepted: `starsocketbolts` for sixteen domed silver bolt heads with recessed closed-bottom six-lobed star sockets alternating by 30°. Use `await ProceduralMaterial.create('starsocketbolts', { seed: 7 })`; the 0.12 m tile defaults to metallic 1. Existing maps, optional height and ownership apply; no bolt geometry, transparent holes or real threads.

Also accepted: `sanddollar` for nine flat oval shells with five petal grooves and five narrow lunules. Use `await ProceduralMaterial.create('sanddollar', { seed: 7, size: 512 })` to inspect fine petal outlines; the 0.3 m tile is opaque dielectric (metallic 0). Existing maps, optional height and ownership apply. Lunules are opaque shaded recesses, not transparent holes or shell geometry.

Also accepted: `brogueleather` for six-petaled punched medallions and double rows of small border holes on brown leather. Use `await ProceduralMaterial.create('brogueleather', { seed: 7 })`; one 0.18 m tile contains nine flowers. Opaque dielectric maps, metallic 0, optional height and ownership remain unchanged; holes are shaded opaque recesses, not actual geometry or transparency.

Also accepted: `clovebuds` for rounded dried clove heads, four-lobed calyx collars and slender stems alternating by 90°. Use `await ProceduralMaterial.create('clovebuds', { seed: 7 })`; one 0.08 m tile contains sixteen cloves. Opaque dielectric maps, metallic 0, optional height and ownership remain unchanged; no spice geometry or food simulation.

Also accepted: `starcrosstiles` for teal eight-pointed stars and ivory crosses with recessed grout. Use `await ProceduralMaterial.create('starcrosstiles', { seed: 7 })`; one 0.8 m tile contains sixteen stars. Opaque dielectric maps, metallic 0, optional height and ownership remain unchanged; no actual tile geometry or paving simulation.

Also accepted: `maplesamara` for paired V-shaped winged fruits with flared veined wings and raised dark kernels. Use `await ProceduralMaterial.create('maplesamara', { seed: 7 })`; one 0.2 m tile contains sixteen pairs alternating by 180°. Opaque dielectric maps, metallic 0, optional height and ownership remain unchanged; no fruit geometry, transparent membranes or flight simulation.

Also accepted: `lenoweave` for paired twisting warp yarns locking horizontal wefts, with alternating over/under crossings. Use `await ProceduralMaterial.create('lenoweave', { seed: 7 })`; one 0.06 m tile contains six pairs and six wefts. Opaque dielectric maps, metallic 0, optional height and ownership remain unchanged; mesh cells are opaque shaded recesses, not transparent holes or cloth geometry.

Also accepted: `circlips` for open C-shaped silver retaining rings with two pierced round lugs, alternating by 180°. Use `await ProceduralMaterial.create('circlips', { seed: 7 })`; the 0.08 m tile contains sixteen clips and defaults to metallic 1. Existing maps, optional height and ownership remain unchanged; bores/gaps are opaque shaded recesses, not transparent openings, geometry or spring simulation.

Also accepted: `tuliptiles` for cobalt three-petaled tulips, slender stems and paired pointed leaves on ivory glazed squares. Use `await ProceduralMaterial.create('tuliptiles', { seed: 7 })`; the 0.6 m tile contains sixteen flowers. Opaque dielectric maps, metallic 0, optional height and ownership remain unchanged; no flower or tile geometry, transparent joints or plant simulation.

Also accepted: `gingerslice` for knobbly four-lobed ginger cross sections with pale fibrous flesh and a thin brown rind. Use `await ProceduralMaterial.create('gingerslice', { seed: 7 })`; the 0.2 m tile contains sixteen slices alternating by 90°. Opaque dielectric maps, metallic 0, optional height and ownership remain unchanged; no rhizome geometry or food/plant simulation.

Also accepted: `fivebarplate` for five-rib groups with round ends and alternating diagonal orientations. Use `await ProceduralMaterial.create('fivebarplate', { seed: 7, size: 512 })` to inspect thin ribs; the 0.6 m tile contains sixteen groups and defaults to metallic 1. Existing maps, optional height and ownership remain unchanged; no plate geometry or slip-resistance/structural simulation.

Also accepted: `cinnamonswirl` for golden bun cross sections with recessed brown cinnamon spirals and darker baked rims. Use `await ProceduralMaterial.create('cinnamonswirl', { seed: 7 })`; the 0.32 m tile contains sixteen buns alternating by 180°. Opaque dielectric maps, metallic 0, optional height and ownership remain unchanged; no food geometry or baking simulation.

Also accepted: `wheatears` for stylized golden ears with paired grooved kernels, slender awns and a central rachis. Use `await ProceduralMaterial.create('wheatears', { seed: 7, size: 512 })` to inspect fine details; the 0.24 m tile contains sixteen ears alternating by 180°. Opaque dielectric maps, metallic 0, optional height and ownership remain unchanged; no plant geometry, growth or wind simulation.

Also accepted: `scalemail` for staggered riveted steel scales with raised ribs and overlapping rolled rims. Use `await ProceduralMaterial.create('scalemail', { seed: 7 })`; the 0.24 m tile contains 6×8 scales over opaque steel backing and defaults to metallic 1. Existing maps, optional height and ownership remain unchanged; no scale geometry, transparent holes or protective simulation.

Also accepted: `trihexagonaltiles` for blue hexagons interspersed with ivory triangles and shared recessed neutral grout. Use `await ProceduralMaterial.create('trihexagonaltiles', { seed: 7 })`; the 0.84 m tile contains 56 hexagons and 112 triangles. Opaque dielectric maps, metallic 0, optional height and ownership remain unchanged; no tile geometry, collision or construction simulation.

Also accepted: `burlwood` for brown-gold figured wood with contoured grain and nine dark pith eyes, rather than straight plank fibers. Use `await ProceduralMaterial.create('burlwood', { seed: 7 })`; the 0.24 m tile keeps fixed eye positions with seeded grain variation. Opaque dielectric maps, metallic 0, optional height and ownership remain unchanged; no wood geometry, species identification or growth simulation.

Also accepted: `slottedmetal` for staggered vertical slots with circular ends and machined beveled walls. Use `await ProceduralMaterial.create('slottedmetal', { seed: 7 })`; the 0.4 m tile contains 8×4 wells with opaque steel floors and defaults to metallic 1. Existing maps, optional height and ownership remain unchanged; no through-hole geometry, transparency, ventilation or structural simulation.

Also accepted: `peppercorns` for dark dried berries with domed, shallow-wrinkled skin and recessed stalk scars. Use `await ProceduralMaterial.create('peppercorns', { seed: 7 })`; the 0.08 m tile contains 25 stylized berries. Opaque dielectric maps, metallic 0, optional height and ownership remain unchanged; no berry geometry or food/plant simulation.

Also accepted: `castellatednuts` for steel hex nuts with round bores and six recessed radial crown slots between raised segments. Use `await ProceduralMaterial.create('castellatednuts', { seed: 7 })`; the 0.08 m tile has 4×4 alternating orientations. Opaque metallic maps/default factor 1, optional height and ownership remain unchanged; no nut geometry, transparent through-holes, screw threads or fastening physics.

Also accepted: `farfalle` for golden bow-tie pasta with narrow gathered waists, flared pleated wings and scalloped end cuts. Use `await ProceduralMaterial.create('farfalle', { seed: 7 })`; the 0.16 m tile has 4×4 alternating orientations. Opaque dielectric maps, metallic 0, optional height and ownership remain unchanged; no pasta geometry, transparency, cooking or soft-body physics.

Also accepted: `cardamompods` for stylized green closed spice pods with tapered tips, longitudinal ribs and attached short stalks. Use `await ProceduralMaterial.create('cardamompods', { seed: 7 })`; the 0.08 m tile has 4×4 alternating diagonal orientations. Opaque dielectric maps, metallic 0, optional height and ownership remain unchanged; no pod geometry, transparency, opening animation or plant/food simulation.

Also accepted: `brickarches` for red-brick semicircular arch motifs with nine wedge blocks, radial mortar joints and three courses per supporting pier. Use `await ProceduralMaterial.create('brickarches', { seed: 7 })`; the 2.4 m tile has 4×4 decorative arches. Opaque dielectric maps, metallic 0, optional height and ownership remain unchanged; openings are dark opaque shading, not transparent doorways, building geometry or structural/collision physics.

Also accepted: `knottednet` for bowed tan cord spans joined by raised crossed knots with tightening creases and dark mesh centers. Use `await ProceduralMaterial.create('knottednet', { seed: 7 })`; the 0.3 m tile has a 6×6 knot lattice. Opaque dielectric maps, metallic 0, optional height and ownership remain unchanged; no net geometry, transparent openings, tension or cloth physics.

Also accepted: `fiddleheads` for stylized green fern shoots with tapering spiral heads, open coil gaps and attached bent stems. Use `await ProceduralMaterial.create('fiddleheads', { seed: 7 })`; the 0.24 m tile has 4×4 alternating mirrored motifs. Opaque dielectric maps, metallic 0, optional height and ownership remain unchanged; no plant geometry, transparency, growth simulation or botanical/photorealistic certification.

Also accepted: `cowrieshells` for ivory shell undersides with narrow dark apertures and nine raised teeth on each opposing lip. Use `await ProceduralMaterial.create('cowrieshells', { seed: 7 })`; the 0.2 m tile has 4×4 alternating orientations. Opaque dielectric maps, metallic 0, optional height and ownership remain unchanged; no shell geometry, transparent apertures or marine-life simulation.

Also accepted: `cotterpins` for steel split pins with loop eyes, separated shafts and unequal outward-bent tails. Use `await ProceduralMaterial.create('cotterpins', { seed: 7 })`; the 0.12 m tile has 4×4 alternating upright/inverted pins. Opaque metallic maps/default factor 1, optional height and ownership remain unchanged; no hardware geometry, transparent holes, fastening or bending physics.

Also accepted: `seedstitch` for sage-green seed-stitch knitting with alternating open V stitches and horizontal purl bumps in both directions. Use `await ProceduralMaterial.create('seedstitch', { seed: 7 })`; the 0.12 m tile has 12×12 stitches. Opaque dielectric maps/metallic 0, optional height and ownership remain unchanged; no yarn geometry, transparency or cloth simulation.

Also accepted: `mangosteenslice` for thick purple-red rinds surrounding six raised ivory pulp lobes with recessed radial gaps and a connected center. Use `await ProceduralMaterial.create('mangosteenslice', { seed: 7 })`; the 0.32 m tile has 4×4 slices alternating by 30°. Opaque dielectric maps/metallic 0, optional height and ownership remain unchanged; no fruit geometry, transparency or botanical simulation.

Also accepted: `pickettiles` for staggered teal glazed elongated hexagons with pointed ends and recessed neutral grout. Use `await ProceduralMaterial.create('pickettiles', { seed: 7 })`; the 0.9 m tile contains 36 tiles, nominally 0.1×0.3 m before grout/bevel. Opaque dielectric maps/metallic 0, optional height and ownership remain unchanged; no tile geometry, transparency or construction simulation.

Also accepted: `squarewashers` for closed square steel frames with beveled sides and round recessed center bores. Use `await ProceduralMaterial.create('squarewashers', { seed: 7 })`; the 0.16 m tile has 4×4 washers alternating by 45°. Opaque metallic maps/default factor 1, optional height and ownership remain unchanged; bores remain dark opaque steel backing. No washer geometry, transparent holes, fastening or load simulation.

Also accepted: `eucalyptusleaf` for blue-green lanceolate leaves with curved raised midribs, five pairs of oblique veins, tapered tips and connected short stalks. Use `await ProceduralMaterial.create('eucalyptusleaf', { seed: 7 })`; the 0.48 m tile has 4×4 leaves alternating by ±45°. Opaque dielectric maps/metallic 0, optional height and ownership remain unchanged; no leaf geometry, transparency, wind or botanical simulation.

Also accepted: `twillweave` for balanced two-over-two twill, pairing light tan weft crossings and dark brown warp crossings in continuous diagonal rows. Use `await ProceduralMaterial.create('twillweave', { seed: 7 })`; the 0.16 m tile contains 16×16 crossings. Opaque dielectric maps/metallic 0, optional height and ownership remain unchanged; no yarn geometry, transparent gaps or cloth simulation.

Also accepted: `pumpkinseeds` for pale tapered seed hulls with raised perimeter rims and intact lower central faces. Use `await ProceduralMaterial.create('pumpkinseeds', { seed: 7 })`; the 0.12 m tile has 4×4 hulls alternating by ±45°. Opaque dielectric maps/metallic 0, optional height and ownership remain unchanged; no seed geometry, transparent hulls, cracking or botanical simulation.

Also accepted: `spurgears` for stylized steel gears with twelve external block teeth, recessed round bores and raised hubs. Use `await ProceduralMaterial.create('spurgears', { seed: 7 })`; the 0.2 m tile has 4×4 gears alternating by 15°. Opaque metallic maps/default factor 1, optional height and ownership remain unchanged; bore/gullet gaps remain dark opaque steel backing. No gear geometry, transparent holes, involute-profile certification or transmission simulation.

Also accepted: `diamondcheckertiles` for diagonal black and cream ceramic checker floors with softened bevels, recessed neutral grout and seeded face tones. Use `await ProceduralMaterial.create('diamondcheckertiles', { seed: 7 })`; the 1.2 m tile has 32 square faces rotated 45° and alternating along both diagonal axes. Opaque dielectric maps/metallic 0, optional height and ownership remain unchanged; no tile geometry, transparency or physics.

Also accepted: `appleslice` for pale apple cross sections with thin red-brown peel and five separate recessed chambers containing dark seeds above their floors. Use `await ProceduralMaterial.create('appleslice', { seed: 7 })`; the 0.4 m tile has 4×4 cross sections alternating by 36°, distinct from the intact exterior in `appleskin`. Opaque dielectric maps/metallic 0, optional height and ownership remain unchanged; no fruit geometry, transparent chambers, cutting, juice or botanical simulation.

Also accepted: `paperclips` for silver wire clips with three connected legs, two nested return bends and open-ended recessed slots. Use `await ProceduralMaterial.create('paperclips', { seed: 7 })`; the 0.24 m tile has 4×4 clips alternating by ±45°. Opaque metallic maps/default factor 1, optional height and ownership remain unchanged; slots retain dark opaque steel backing. No wire geometry, transparency or clamping simulation.

Also accepted: `ivyleaf` for green three-lobed ivy leaves with pointed tips, two deep notches, raised palmate veins and connected petioles. Use `await ProceduralMaterial.create('ivyleaf', { seed: 7 })`; the 0.32 m tile has 4×4 leaves alternating by ±45°, distinct from the five-lobed `mapleleaf`. Opaque dielectric maps/metallic 0, optional height and ownership remain unchanged; no leaf geometry, transparency, wind animation or botanical simulation.

Also accepted: `ribknit` for rose-brown one-by-one rib knitting with raised V-knit columns alternating with lower horizontal purl columns. Use `await ProceduralMaterial.create('ribknit', { seed: 7 })`; the 0.12 m tile has 12×12 stitches, and each column keeps its stitch type across all rows rather than alternating as in `seedstitch`. Opaque dielectric maps/metallic 0, optional height and ownership remain unchanged; no yarn geometry, transparent holes, elasticity or cloth simulation.

Also accepted: `pillowtiles` for ivory glazed rounded-square tiles with continuous domed cushion faces, softened bevels, recessed neutral grout and seeded face tones. Use `await ProceduralMaterial.create('pillowtiles', { seed: 7 })`; the 0.6 m tile has 6×6 raised-center tiles, distinct from flat-topped heat-shield tiles. Opaque dielectric maps/metallic 0, optional height and ownership remain unchanged; no tile geometry, displacement or transparency.

Also accepted: `coffeerings` for irregular brown coffee cup tide marks with lighter interior staining on pale paper. Use `await ProceduralMaterial.create('coffeerings', { seed: 7 })`; the 0.36 m tile has 3×3 seeded elliptical rings, local fading and near-flat paper grain rather than carved grooves. Opaque dielectric maps/metallic 0, optional height and ownership remain unchanged; no paper/cup geometry, liquid transparency, fluid, absorption or drying simulation.

Also accepted: `cashews` for cream C-shaped cashew kernels with raised curved bodies, unequal blunt tips and open mouths. Use `await ProceduralMaterial.create('cashews', { seed: 7 })`; the 0.16 m tile has 4×4 kernels in alternating ±45° orientations with seeded tones and fine surface grain. Opaque dielectric maps/metallic 0, optional height and ownership remain unchanged; no kernel geometry, transparent holes, subsurface scattering or food physics.

Also accepted: `hinges` for steel hinge faces with paired rounded mounting leaves, six countersunk bores, five convex barrel knuckles and a continuous lower pin in the joint grooves. Use `await ProceduralMaterial.create('hinges', { seed: 7 })`; the 0.4 m tile has 4×4 hinges and seeded brushed grain. Opaque metallic maps/metallic 1, optional height and ownership remain unchanged; no hinge geometry, transparent holes, articulation or rigid-body physics.

Also accepted: `coins` for gold coin faces with raised circular rims, lower fields and embossed five-point stars. Use `await ProceduralMaterial.create('coins', { seed: 7 })`; the 0.12 m tile has 4×4 coins, alternating 36° star orientations, seeded tones and fine grain. Opaque metallic maps/metallic 1, optional height and ownership remain unchanged; no coin geometry, lettering, transparency, currency system or rigid-body physics.

Also accepted: `righttriangletiles` for blue-grey/cream right-isosceles glazed triangles with alternating diagonal joints. Use `await ProceduralMaterial.create('righttriangletiles', { seed: 7 })`; the 1 m tile contains 32 independently shaded triangles in 4×4 split squares, with recessed neutral grout and matching straight/diagonal bevel widths. Opaque dielectric maps/metallic 0, optional height and ownership remain unchanged; no tile geometry, displacement or transparency.

Also accepted: `cherryblossom` for stylized pink five-petal flowers with split-tip notches, lower hearts and twelve raised pale pollen dots. Use `await ProceduralMaterial.create('cherryblossom', { seed: 7 })`; the 0.24 m tile has 4×4 flowers with alternating 36° orientations, seeded tones and fine grain. Opaque dielectric maps/metallic 0, optional height and ownership remain unchanged; no flower geometry, transparent holes, growth, wind or subsurface-scattering simulation.

Also accepted: `punchcard` for thin cream paper data cards with a clipped upper corner and rectangular punch patterns. Use `await ProceduralMaterial.create('punchcard', { seed: 7 })`; the 0.44 m tile has 2×4 cards, 20×8 punch positions per card and two distinct seeded punches per column, with intact paper webs and about 0.3 mm paper relief. Opaque dielectric maps/metallic 0, optional height and ownership remain unchanged; slots expose opaque backing, not transparency. No card geometry, real data encoding/reading or paper physics.

Also accepted: `braidedcord` for three-strand cotton-colored flat plaits with alternating over/under crossings and visibly distinct strand tones. Use `await ProceduralMaterial.create('braidedcord', { seed: 7 })`; the 0.08 m tile has four vertical braids with four periods each, unlike twisted rope or two-strand cable knitting. Opaque dielectric maps/metallic 0, optional height and ownership remain unchanged; no strand geometry, transparent holes, braiding process or cloth physics.

Also accepted: `crossbeddedsandstone` for sandstone with inclined curved laminae truncated within horizontal beds. Use `await ProceduralMaterial.create('crossbeddedsandstone', { seed: 7 })`; the 1.2 m tile has four alternating dip sets, shared contact bands, subtle recessed laminae and sandy grain, unlike nearly horizontal parallel strata. Opaque dielectric maps/metallic 0, optional height and ownership remain unchanged; no rock geometry, displacement, stratigraphic generation, sedimentation or erosion simulation.

Also accepted: `grommetcanvas` for raised brass eyelet rings on rough brown woven canvas with dark opaque bores. Use `await ProceduralMaterial.create('grommetcanvas', { seed: 7 })`; the 0.16 m tile has 4×4 convex rings with smooth inner/outer bevels. Its authored metallic map keeps brass at 1 and cloth/backing at 0; default material metallic factor 1 preserves this split. Existing maps, optional height and ownership remain unchanged; no geometry, transparent cutouts or cloth physics.

Also accepted: `fishscaletiles` for interlocking teal glazed fan mosaics with semicircular tops, concave lower arcs and neutral curved grout. Use `await ProceduralMaterial.create('fishscaletiles', { seed: 7 })`; the 0.4 m tile has four columns and eight staggered rows with seeded glaze tones on coplanar faces. It is an opaque dielectric with metallic 0; `tint` recolors glaze without coloring grout. Existing maps, optional height and ownership remain unchanged; no geometry, transparency or tiling simulation.

Also accepted: `hexkeys` for black oxide L-shaped hex keys with unequal arms, round elbows, flat cut ends and faceted rod profiles. Use `await ProceduralMaterial.create('hexkeys', { seed: 7 })`; the 0.4 m tile has 4×4 seeded quarter-turn poses, flat crowns and two side facets. It is opaque metallic with map and default factor 1. Existing maps, optional height and ownership remain unchanged; no tool geometry, mechanical assembly or physics.

Also accepted: `driedfigslice` for tapered dried fig slices with tan wrinkled rind, dark brown flesh and tiny pale seeds. Use `await ProceduralMaterial.create('driedfigslice', { seed: 7 })`; the 0.24 m tile has 4×4 alternating slices and seeded jittered grains confined to the flesh. It is an opaque dielectric with metallic 0. Existing maps, optional height and ownership remain unchanged; no fruit geometry, transparency, food generation or biological simulation.

Also accepted: `creamcrackers` for golden baked crackers with four scalloped borders, nine dark docking pits, browned rims and toasted blisters. Use `await ProceduralMaterial.create('creamcrackers', { seed: 7 })`; the 0.24 m tile has 4×4 separate seeded crackers, not a continuous wafer grid. It is an opaque dielectric with metallic 0. Existing maps, optional height and ownership remain unchanged; no food geometry, transparent holes, baking or food physics.

Also accepted: `doorkeys` for flat brass door keys with circular bored bows, three rounded bittings, longitudinal grooves and chamfered tips. Use `await ProceduralMaterial.create('doorkeys', { seed: 7 })`; the 0.32 m tile has 4×4 seeded quarter-turn keys with continuous flat necks and asymmetric blades. It is opaque metallic with map and default factor 1. Existing maps, optional height and ownership remain unchanged; no key geometry, transparent holes, lock mechanisms or mechanical simulation.

Also accepted: `dodecagontiles` for blue-teal twelve-sided glazed tiles with small pale triangular inserts and neutral grout. Use `await ProceduralMaterial.create('dodecagontiles', { seed: 7 })`; the 0.7 m tile contains 56 dodecagons and 112 inserts with seeded tones and coplanar faces. Its canonical 3.12.12 rectangular period is fitted to square UVs, so it is not a physical regular-polygon measurement reference. It is an opaque dielectric with metallic 0; existing maps, optional height and ownership remain unchanged. No geometry, transparency or tiling simulation.

Also accepted: `ballchain` for silver pull chains with solid spherical beads, narrow straight connectors and gentle periodic meanders. Use `await ProceduralMaterial.create('ballchain', { seed: 7 })`; the 0.064 m tile has four chains of eight beads, distinct from bored seed beads or ring links. It is opaque metallic with map and default factor 1. Existing maps, optional height and ownership remain unchanged; no chain geometry, transparency or chain physics.

Also accepted: `succulentrosettes` for gray-green succulent rosettes with three staggered whorls of raised fleshy spoon leaves. Use `await ProceduralMaterial.create('succulentrosettes', { seed: 7 })`; the 0.64 m tile has 4×4 seeded orientations, six leaves per whorl, convex crowns and taller inner growth. It is an opaque dielectric with metallic 0. Existing maps, optional height and ownership remain unchanged; no plant geometry, transparency, subsurface scattering or biological simulation.

Also accepted: `foldingfans` for ivory paper fans with radial accordion pleats, exposed wooden ribs, side guards and round pivot caps. Use `await ProceduralMaterial.create('foldingfans', { seed: 7 })`; the 1 m tile has 4×4 alternating 140-degree fans, each with twelve paper folds and thirteen ribs. It is an opaque dielectric with metallic 0. Existing maps, optional height and ownership remain unchanged; no fan geometry, transparent holes, opening animation or folding physics.

Also accepted: `togglebuttons` for two-hole wooden barrel toggles, with rounded tapered ends, convex crowns and longitudinal grain. Use `await ProceduralMaterial.create('togglebuttons', { seed: 7 })`; the 0.32 m tile arranges 4×4 alternating horizontal/vertical toggles, distinct from the four-hole round `button` preset. It is an opaque dielectric with metallic 0. Existing maps, optional height and ownership remain unchanged; no button geometry, transparent holes, cords or garment physics.

Also accepted: `greenpeapods` for closed green pea pods with curved pointed shells, raised side seams, short stems and five covered pea bulges. Use `await ProceduralMaterial.create('greenpeapods', { seed: 7 })`; the 0.48 m tile arranges 4×4 alternating diagonal pods, distinct from ribbed cardamom pods and pitted lotus seed heads. It is an opaque dielectric with metallic 0. Existing maps, optional height and ownership remain unchanged; no pod geometry, transparent shells, opening animation or plant simulation.

Also accepted: `beltbuckles` for rounded brass belt buckle frames, lower center bars, raised tapered tongues and round pivot caps. Use `await ProceduralMaterial.create('beltbuckles', { seed: 7 })`; the 0.32 m tile arranges 4×4 alternating horizontal/vertical buckles. It is opaque metallic, with metallic factor/map 1 including dark lower backing; open-looking chambers are not transparent. Existing maps, optional height and ownership remain unchanged; no buckle geometry, belt material, fastening animation or mechanical simulation.

Also accepted: `hextruchettiles` for dark blue hexagonal glaze tiles with three ivory arcs each. Use `await ProceduralMaterial.create('hextruchettiles', { seed: 7 })`; the 0.7 m tile contains 56 tiles with two seeded orientations, six edge-midpoint connections and recessed neutral grout. Arcs are flat glaze, not raised tubes; square UV fitting stretches one axis about 1%. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no tile geometry or path/puzzle gameplay.

Also accepted: `scoredmango` for oval mango cheeks with thin intact skin rims, recessed crossing score cuts and rounded golden flesh blocks. Use `await ProceduralMaterial.create('scoredmango', { seed: 7 })`; the 0.48 m tile contains 4×4 alternating horizontal/vertical cheeks. Cuts retain a continuous flesh floor and blocks stay within the inner oval. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no everted/separated fruit geometry, transparency or cutting physics.

Also accepted: `waxseals` for red wax seals with irregular melted edges, recessed round impressions, raised circular rims and five-lobed embossed emblems. Use `await ProceduralMaterial.create('waxseals', { seed: 7 })`; the 0.16 m tile contains 4×4 seeded seals. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no seal geometry, text/custom-emblem input, melting animation or wax-fluid simulation.

Also accepted: `cottonbolls` for open cotton bolls with four ivory fiber tufts, a lower central join and pointed brown bracts. Use `await ProceduralMaterial.create('cottonbolls', { seed: 7 })`; the 0.24 m tile contains 4×4 bolls alternating by 45 degrees, with seeded fine/nap shading. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no fiber geometry, transparent fuzz, subsurface scattering or plant growth.

Also accepted: `carabiners` for aluminum-colored D-shaped frames with straight spines, slanted gates, recessed gate joints and raised hinge pins. Use `await ProceduralMaterial.create('carabiners', { seed: 7 })`; the 0.32 m tile contains 4×4 alternating horizontal/vertical frames. Opaque metallic, factor/map 1 including dark lower backing; the opening is not transparent. Existing maps, optional height and ownership remain unchanged; no carabiner geometry, opening mechanism, collision or load-rating certification.

Also accepted: `pencilends` for hexagonal pencil cross sections with thin dark painted rims, pale cut wood and slightly lower solid graphite cores. Use `await ProceduralMaterial.create('pencilends', { seed: 7 })`; the 0.04 m tile contains 4×4 ends alternating by 30 degrees, with distinct paint/wood/core roughness. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no pencil geometry, sharpening/writing features or electrical simulation.

Also accepted: `corrugatedplasticedge` for blue twin-wall plastic cut edges with two flat skins, straight webs and rectangular cavities. Use `await ProceduralMaterial.create('corrugatedplasticedge', { seed: 7 })`; the 0.064 m tile contains eight half-cell-staggered rows of eight flutes, with flush skin/web junctions. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; cavities are lower opaque backing rather than transparent holes. No board geometry, structural mechanics or plastic performance certification.

Also accepted: `haircombs` for amber-colored plastic hair combs with flat spines and fourteen tapered, round-ended teeth. Use `await ProceduralMaterial.create('haircombs', { seed: 7 })`; the 0.48 m tile contains 4×4 alternating horizontal/vertical combs with flush roots and open-ended recessed gaps. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no comb geometry, transparent plastic, hair interaction or deformation simulation.

Also accepted: `blackberries` for dark-purple glossy oval fruits formed by nineteen convex drupelets with lower, filled joints. Use `await ProceduralMaterial.create('blackberries', { seed: 7 })`; the 0.16 m tile contains 4×4 alternating horizontal/vertical berries, distinct from grapeskin bloom patches or lychee rind polygons. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no fruit geometry, transparent flesh, plant growth or food physics.

Also accepted: `musselshells` for blue-black teardrop shells with narrow hinges, wide rounded ends, solid convex crowns and fine curved growth channels. Use `await ProceduralMaterial.create('musselshells', { seed: 7 })`; the 0.32 m tile contains 4×4 alternating horizontal/vertical shells, not scallop radial ribs, oyster laminae or cowrie apertures. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no shell geometry, bivalve opening, transparent shells or biological simulation.

Also accepted: `safetypins` for steel-colored closed safety pins with spring coils, two convex wire legs and raised guards covering the needle tips, including shallow clasp seams. Use `await ProceduralMaterial.create('safetypins', { seed: 7 })`; the 0.16 m tile contains 4×4 alternating horizontal/vertical pins. Opaque metallic, factor/map 1 including dark lower backing; gaps are not transparent. Existing maps, optional height and ownership remain unchanged; no pin geometry, opening mechanisms, spring physics or puncturing features.

Also accepted: `poppyseedpods` for dry closed capsules with fluted convex bodies, lower thin stalks and raised flattened eight-lobed stigma crowns with radial ridges. Use `await ProceduralMaterial.create('poppyseedpods', { seed: 7 })`; the 0.24 m tile contains 4×4 alternating horizontal/vertical capsules, not lotus seed chambers or pointed cardamom pods. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no capsule geometry, transparent skins, splitting, seed dispersal or plant simulation.

Also accepted: `leatherbookspines` for convex brown leather book spines with four curved raised bands, rounded blind-stamped frames and shallow panel floors. Use `await ProceduralMaterial.create('leatherbookspines', { seed: 7 })`; the 0.32 m tile contains eight parallel spines with pores and deep separating seams. Opaque dielectric, metallic 0, no text/metal foil; existing maps, optional height and ownership remain unchanged. No book geometry, typography, page turning or binding physics.

Also accepted: `matchsticks` for pale wooden square-ended shafts with longitudinal grain and wider convex dark-red rough coating heads. Use `await ProceduralMaterial.create('matchsticks', { seed: 7 })`; the 0.2 m tile contains 4×4 alternating horizontal/vertical matches with distinct wood/head height, pigment and roughness. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no match geometry, ignition, combustion, emission or chemistry simulation.

Also accepted: `porcelaininsulators` for cream-glazed insulator side profiles with five rounded skirts, lower connected necks, domed caps and short stems. Use `await ProceduralMaterial.create('porcelaininsulators', { seed: 7 })`; the 0.8 m tile contains 4×4 alternating horizontal/vertical insulators. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no insulator geometry, metal fittings, electrical-field/leakage simulation or insulation certification.

Also accepted: `dominoes` for ivory rounded domino faces with standard recessed black pips and shallow center grooves. Use `await ProceduralMaterial.create('dominoes', { seed: 7 })`; the 0.24 m tile contains 4×4 alternating horizontal/vertical faces, each with two independently seeded 0–6 pip layouts. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged. Pips are filled recesses, not alpha cutouts; no domino geometry, game rules or physics.

Also accepted: `woodenspoons` for wooden spoons with concave oval bowls, higher rims, continuous necks and widening handles. Use `await ProceduralMaterial.create('woodenspoons', { seed: 7 })`; the 0.4 m tile contains 4×4 alternating horizontal/vertical spoons with longitudinal wood fibers. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; the cavity is filled above backing, not a cutout. No spoon geometry, volume/fluid simulation or food-safety certification.

Also accepted: `chessrooks` for ivory rook side profiles with three crown teeth, two outward-open notches, continuous shafts, collars and broad rounded bases. Use `await ProceduralMaterial.create('chessrooks', { seed: 7 })`; the 0.24 m tile contains 4×4 alternating horizontal/vertical profiles. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged. This is surface relief only, not chess-piece geometry, board/rules/AI or physics.

Also accepted: `threadspools` for dark-red wound thread barrels with broader higher wooden end flanges, continuous cores and fine winding relief. Use `await ProceduralMaterial.create('threadspools', { seed: 7 })`; the 0.24 m tile contains 4×4 alternating horizontal/vertical spools, with rougher thread than wood. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no spool/yarn geometry, unwinding/tension simulation or cloth physics.

Also accepted: `bellpepperslices` for green bell pepper crosscuts with a three-lobed fleshy ring, lower pale pith membranes, three chambers and six attached seeds. Use `await ProceduralMaterial.create('bellpepperslices', { seed: 7 })`; the 0.32 m tile contains 4×4 alternating crosscuts. Chambers expose lower opaque backing, not alpha cutouts. Dielectric metallic 0, existing maps, optional height and ownership remain unchanged; no pepper geometry, transparent cavities or food/biological/fluid simulation.

Also accepted: `sharkteeth` for ivory pointed triangular enamel crowns with fine serrated edges, lower rough double roots, continuous necks and outward-open root notches. Use `await ProceduralMaterial.create('sharkteeth', { seed: 7 })`; the 0.24 m tile contains 4×4 alternating horizontal/vertical teeth. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no tooth geometry, species/age identification, dental/biological simulation or physics.

Also accepted: `grinderburrs` for steel grinding burr rings with six curved raised lands, rougher lower grooves, one central bore and three mounting holes. Use `await ProceduralMaterial.create('grinderburrs', { seed: 7 })`; the 0.4 m tile contains 4×4 seeded orientations. Holes expose low opaque metal backing, not alpha cutouts. Metallic 1 including backing, matching material factor, existing maps, optional height and ownership remain unchanged; no grinding geometry, cutting/coffee-grinding simulation or physics.

Also accepted: `cowhide` for irregular black-and-white patches over continuous short hair. Use `await ProceduralMaterial.create('cowhide', { seed: 7 })`; one UV tile represents 0.8 m. Patches are pigmentation rather than separate raised hide pieces or carved seams. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no hair geometry, grooming, cloth/biological or animal simulation.

Also accepted: `spaltedwood` for pale longitudinal wood grain with sparse dark curved zone lines. Use `await ProceduralMaterial.create('spaltedwood', { seed: 7 })`; one UV tile represents 0.6 m. Spalt lines are pigment, not carved cracks or missing wood. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no wood geometry, decay/fungal-growth/biological simulation or structural-safety assessment.

Also accepted: `canlids` for stamped metal can lids with reinforcing beads, recessed scoring, twin-hole pull tabs and rivets. Use `await ProceduralMaterial.create('canlids', { seed: 7 })`; one UV tile represents 0.28 m. Both raised tab openings reveal the intact lid, not transparent cutouts. Opaque metallic, metallic 1, existing maps, optional height and ownership remain unchanged; no geometry, can-opening/tearing/deformation or mechanical simulation.

Also accepted: `crinoidossicles` for pale crinoid stem fossil discs with five-lobed sediment-filled lumens and twenty fine radial ribs in limestone matrix. Use `await ProceduralMaterial.create('crinoidossicles', { seed: 7 })`; one UV tile represents 0.08 m. Lumens are opaque sediment recesses, not transparent holes; discs retain shallow relief rather than spiral fossil chambers. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no geometry, species identification or paleobiological/biological simulation.

Also accepted: `pythagoreantiles` for Pythagorean two-size square tiles with a 2:1 side ratio, dark large squares, pale small squares and shared recessed grout. Use `await ProceduralMaterial.create('pythagoreantiles', { seed: 7 })`; one UV tile represents 0.4 m and contains five squares of each size. This is not the rectangular windmill-paver layout. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no geometry, construction/structural or physics simulation.

Also accepted: `dinnerforks` for metal dinner forks with four tapered rounded tines, three backed slots and continuous broad heads, narrow necks and widened handles. Use `await ProceduralMaterial.create('dinnerforks', { seed: 7 })`; one UV tile represents 0.96 m. Tine roots join without doubled thickness; slots reveal opaque backing. Opaque metallic, metallic 1, existing maps, optional height and ownership remain unchanged; no utensil geometry, transparent holes, food-contact/deformation or physics simulation.

Also accepted: `goldbrocade` for raised gold-thread floral motifs over dark nonmetallic woven cloth. Use `await ProceduralMaterial.create('goldbrocade', { seed: 7 })`; one UV tile represents 0.24 m. Even yarn interstices inside a flower reveal dielectric cloth. Material metallic factor 1 preserves the authored metal/cloth map rather than making the whole tile metallic. Opaque maps, optional height and ownership remain unchanged; no yarn geometry, transparent holes, textile/cloth/spectral or physics simulation.

Also accepted: `mudtiretracks` for paired muddy ruts with curved pressed tread marks and slightly raised mud edges. Use `await ProceduralMaterial.create('mudtiretracks', { seed: 7 })`; one UV tile represents 3 m with thirty-six impressions per rut. The tracks lower continuous mud rather than raising rubber blocks. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no terrain geometry, wheel/collision/dynamic-deformation/vehicle or physics simulation.

Also accepted: `peacockfeathers` for green-gold feather ocelli with a gold rim, green inner band and dark offset pupil. Use `await ProceduralMaterial.create('peacockfeathers', { seed: 7 })`; one UV tile represents 0.64 m. Eye marks are pigment over continuous shafts/barbs, not carved rings or hollow pupils. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no feather geometry, transparent holes, grooming/bird/biological or iridescent-optics simulation.

Also accepted: `tangramtiles` for a standard seven-piece tangram of five right-isosceles triangles in three sizes, one square and one parallelogram with recessed grout. Use `await ProceduralMaterial.create('tangramtiles', { seed: 7 })`; one UV tile represents 0.6 m with a 2×2 square-panel layout. This is not the two-piece diagonal pattern of righttriangletiles. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no tile geometry, interactive puzzle or physics simulation.

Also accepted: `batterypositivecaps` for cylindrical battery positive end caps with raised metal contacts, pale dielectric insulation rings and rolled metal rims. Use `await ProceduralMaterial.create('batterypositivecaps', { seed: 7 })`; one UV tile represents 0.12 m in a 4×4 cap layout. Material metallic factor 1 preserves conductor/insulator regions in the authored map, not an all-metal face. Opaque backing, existing maps, optional height and ownership remain unchanged; no battery geometry, electrical conduction, electrochemistry, circuit or physics simulation.

Also accepted: `passionfruitslice` for yellow passion fruit cuts with pale pith, filled pulp and dark seeds in convex golden sacs. Use `await ProceduralMaterial.create('passionfruitslice', { seed: 7 })`; one UV tile represents 0.32 m in a 4×4 fruit layout. Seeds fill the center rather than a single kiwi-like ring; dark kernels are pigment, not holes in the sacs. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no fruit geometry, transparency, SSS/transmission, biological or physics simulation.

Also accepted: `screwterminalblocks` for dielectric polymer terminal housings with metal cross-head screws and lower contacts inside backed wire entries. Use `await ProceduralMaterial.create('screwterminalblocks', { seed: 7 })`; one UV tile represents 0.08 m in a 4×4 layout. Material metallic factor 1 preserves the screw/contact map while polymer and port floors stay dielectric; screw slots remain recessed metal, not painted crosses or holes. Opaque maps, optional height and ownership remain unchanged; no component geometry, transparent holes, electrical conduction, circuit, mechanical or physics simulation.

Also accepted: `dragonfruitflesh` for continuous white dragon fruit pulp with scattered elongated black seeds. Use `await ProceduralMaterial.create('dragonfruitflesh', { seed: 7 })`; one UV tile represents 0.06 m of flesh rather than repeated fruit discs. Embedded seeds change pigment/roughness, not pulp height or holes; the existing dragonfruit preset remains the rind. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no fruit geometry, transparency, SSS/transmission, biological or physics simulation.

Also accepted: `speakercones` for black paper speaker dishes with fine radial ribs, domed central dust caps and higher rubber rolls. Use `await ProceduralMaterial.create('speakercones', { seed: 7 })`; one UV tile represents 0.64 m with a 4×4 cone layout. These are filled surface/normal-map features, not empty cups or metal gong rings. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no speaker geometry, transparent holes, acoustic/electromechanical/diaphragm or physics simulation, and no Audio changes.

Also accepted: `septarianstone` for polished brown stone with closed angular nodules and filled pale-gold calcite veins. Use `await ProceduralMaterial.create('septarianstone', { seed: 7 })`; one UV tile represents 0.48 m. The brighter, smoother veins fill the continuous stone surface instead of becoming dark open cracks. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no rock geometry, transparent crystals, mineral layers, geological or physics simulation.

Also accepted: `axialresistors` for rounded insulating resistor bodies with three dark painted rings, a separate pale ring and two metal leads. Use `await ProceduralMaterial.create('axialresistors', { seed: 7 })`; one UV tile represents 0.12 m. The body and all paint remain dielectric, with metallic confined to exposed leads; rings do not encode a claimed resistance or add embossed relief. Opaque mixed-metallic, default factor 1, existing maps, optional height and ownership remain unchanged; no component geometry, conductivity, circuit, electrothermal or physics simulation.

Also accepted: `tomatoslices` for red tomato cuts with solid flesh septa, a central core and five filled gel locules carrying paired pale seeds. Use `await ProceduralMaterial.create('tomatoslices', { seed: 7 })`; one UV tile represents 0.32 m with 4×4 cuts. Gel chambers are filled surface features rather than pepper-like open cavities; the slightly raised seeds remain opaque dielectric. Metallic 0, existing maps, optional height and ownership remain unchanged; no fruit geometry, transparency, SSS/transmission, biological or physics simulation.

Also accepted: `pinstripewool` for dark navy wool twill with narrow pale vertical warp-yarn stripes, interrupted by dark weft crossings rather than painted over them. Use `await ProceduralMaterial.create('pinstripewool', { seed: 7 })`; one UV tile represents 0.08 m. Dye does not emboss the pinstripes; opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged. No yarn geometry, transparent holes, fur/sheen BRDF, cloth or physics simulation.

Also accepted: `chrysanthemumstone` for polished black stone with embedded pale radial crystal rosettes and connected pale centers. Use `await ProceduralMaterial.create('chrysanthemumstone', { seed: 7 })`; one UV tile represents 0.48 m. Mineral pigment/roughness do not sculpt petals or pits; opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged. No rock/crystal geometry, transparency, crystal refraction, mineral identification, geological or physics simulation.

Also accepted: `sewingsnaps` for alternating metal snap studs and recessed sockets with four sewing holes. Use `await ProceduralMaterial.create('sewingsnaps', { seed: 7 })`; one UV tile represents 0.12 m. Sewing holes and the female bore have opaque nonmetal floors, not transparent openings; faces, posts and socket collars retain metallic 1. The mixed-material default factor 1, existing maps, optional height and ownership remain unchanged. No geometry, sewing threads, fastening/spring or physics simulation.

Also accepted: `lathplaster` for damaged pale plaster revealing lower horizontal timber laths and deeper dark backing between them. Use `await ProceduralMaterial.create('lathplaster', { seed: 7 })`; one UV tile represents 0.8 m. The three layers remain opaque surface/normal-map features, not transparent wall openings or upward paint curls. Metallic 0, existing maps, optional height and ownership remain unchanged; no wall geometry, nails/threads, destruction, structural or physics simulation.

Also accepted: `ceramiccapacitors` for domed insulating ceramic discs with two same-edge metal leads, unlike axial resistors' opposite-ended wires. Use `await ProceduralMaterial.create('ceramiccapacitors', { seed: 7 })`; one UV tile represents 0.12 m. Ceramic coats the lead roots and stays dielectric while exposed leads remain metal. Opaque mixed-metallic, default factor 1, existing maps, optional height and ownership remain unchanged; no capacitance encoding, component geometry, conductivity, circuit, electrothermal or physics simulation.

Also accepted: `fennelseeds` for bowed pointed fennel seed coats with five converging raised ribs, rather than stemmed cardamom pods. Use `await ProceduralMaterial.create('fennelseeds', { seed: 7 })`; one UV tile represents 0.096 m. Seeded rotations, jitter and tones remain bounded in the periodic tile. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no seed geometry, overlapping scatter, growth, nutrition, flavor or physics simulation.

Also accepted: `ballbearingfaces` for open bearing faces with concentric inner/outer rings, a recessed continuous raceway and eight raised steel balls. Use `await ProceduralMaterial.create('ballbearingfaces', { seed: 7 })`; one UV tile represents 0.16 m. The bore is opaque nonmetal backing, not a transparent opening. Opaque mixed-metallic, default factor 1, existing maps, optional height and ownership remain unchanged; no bearing geometry, cage, rolling, rotation, lubrication, mechanical or physics simulation.

Also accepted: `baseballleather` for white grained leather, two curved recessed joins and paired raised red threads, unlike rugby-ball lacing. Use `await ProceduralMaterial.create('baseballleather', { seed: 7 })`; one UV tile represents 0.24 m. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no ball/thread geometry, complete spherical panel UV layout, sporting certification, sewing, cloth, collision or physics simulation.

Also accepted: `toothbrushheads` for lower capsule-shaped blue plastic bases with eighteen higher pale bristle tufts in a 3×6 grid. Use `await ProceduralMaterial.create('toothbrushheads', { seed: 7 })`; one UV tile represents 0.12 m. Smooth lower plastic stays visible between rough tuft crowns. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no head/individual-bristle geometry, handle, transparent gaps, bending, brushing, cleaning or physics simulation.

Also accepted: `bowtieinlay` for flush dark butterfly repair keys across warped dark splits, with transverse key grain against longitudinal boards. Use `await ProceduralMaterial.create('bowtieinlay', { seed: 7 })`; one UV tile represents 0.6 m. Keys restore split height/occlusion within the board's micro-height envelope, not raised patches. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no woodworking geometry, transparent cracks, actual reinforcement, strength certification, fracture, destruction or physics simulation.

Also accepted: `redcabbagecut` for filled purple cabbage cuts with narrow folded pale veins, solid pale cores and dark outer rims. Use `await ProceduralMaterial.create('redcabbagecut', { seed: 7 })`; one UV tile represents 0.48 m. Veins and core vary color/roughness, not filled cut height or occlusion. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no leaf geometry, transparent leaves, transmission/subsurface solving, growth, anatomical certification or physics simulation.

Also accepted: `slottedturners` for rounded metal turner blades with three closed long slots and same-height short necks, not open fork tines. Use `await ProceduralMaterial.create('slottedturners', { seed: 7 })`; one UV tile represents 0.32 m. Slot floors remain lower opaque nonmetal backing, and the blade/neck join does not double its height. Opaque mixed-metallic, default factor 1, existing maps, optional height and ownership remain unchanged; no utensil geometry, full-length handle, transparent slots, bending, cooking, heat transfer or physics simulation.

Also accepted: `triglidesliders` for pinless molded plastic strap sliders with two closed windows and a flat middle rail. Use `await ProceduralMaterial.create('triglidesliders', { seed: 7 })`; one UV tile represents 0.16 m. Windows show lower opaque backing, not transparent holes; the center rail stays level with the frame. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no buckle/strap geometry, threading, sliding, friction, load certification or physics simulation.

Also accepted: `popcorn` for irregular pale connected puff crowns with lower pointed toasted hull cores. Use `await ProceduralMaterial.create('popcorn', { seed: 7 })`; one UV tile represents 0.24 m. Unequal overlapping lobes share thickness; the golden hull remains lower than the pale puff. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no food geometry, transparent holes, popping, cooking, heat transfer, nutrition or physics simulation.

Also accepted: `dualinlinechips` for dark dual-inline IC packages with fourteen lower metal leads and one recessed pin-one mark. Use `await ProceduralMaterial.create('dualinlinechips', { seed: 7 })`; one UV tile represents 0.16 m. The black dielectric covers lead roots; the dimple stays a solid lower surface. Opaque mixed-metallic, default factor 1, existing maps, optional height and ownership remain unchanged; no component geometry, transparent holes, connectivity, electrical/logic, heat transfer, soldering or physics simulation.

Also accepted: `tortoiseshellacetate` for polished flat amber plastic with irregular dark brown mottles. Use `await ProceduralMaterial.create('tortoiseshellacetate', { seed: 7 })`; one UV tile represents 0.2 m. Pigment stays beneath one smooth face, not raised shell plates or dark holes. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no geometry, transparency/transmission/refraction, chemical manufacturing, natural shell material or physics simulation.

Also accepted: `cathedralquilt` for cathedral-window cloth with raised curved cream folds around lower blue insets. Use `await ProceduralMaterial.create('cathedralquilt', { seed: 7 })`; one UV tile represents 0.6 m. The windows are solid blue cloth, not transparent openings; the folded band sits above the cream backing and inset. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no cloth geometry, folding, sewing, cloth mechanics or physics simulation.

Also accepted: `buckwheathulls` for rotated triangular brown hulls with three rounded faces and fine raised ridges. Use `await ProceduralMaterial.create('buckwheathulls', { seed: 7 })`; one UV tile represents 0.064 m. Three tapered ridges share one seed layer and remain smoother than nearby faces. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no seed geometry, transparent holes, hulling, growth, cooking, nutrition or physics simulation.

Also accepted: `rutilatedquartz` for opaque polished milky quartz with two crossed golden-brown needle bundles. Use `await ProceduralMaterial.create('rutilatedquartz', { seed: 7 })`; one UV tile represents 0.2 m. The mineral inclusions remain dielectric pigment, not metal wires, raised threads or AO holes. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no geometry, transparency/transmission/refraction, inclusion depth, multilayer volume scattering, mineral growth or physics simulation.

Also accepted: `peppermintcanes` for red-white peppermint hooks with one long rounded stem and one short return, over neutral opaque backing. Use `await ProceduralMaterial.create('peppermintcanes', { seed: 7 })`; one UV tile represents 0.32 m. Red-white stripes are pigment only, not alternating height grooves; the hook interior remains opaque backing. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no candy geometry, transparent holes, sugar crystallization, melting, cooking, nutrition or physics simulation.

Also accepted: `rubbergrommets` for molded rubber cable grommets with high inner lips and lower grooved flanges. Use `await ProceduralMaterial.create('rubbergrommets', { seed: 7 })`; one UV tile represents 0.16 m. Bores show low opaque backing, not transparent holes; the entire ring is nonmetal rubber. Opaque dielectric, metallic 0, existing maps, optional height and ownership remain unchanged; no fastener/cable geometry, elasticity, sealing, threading, electrical insulation certification or physics simulation.

Also accepted: `chioggiabeetcuts` for filled Chioggia beet cuts with six flush alternating red rings and pale gaps, a solid pale core and a lower thin red rind. Use `await ProceduralMaterial.create('chioggiabeetcuts', { seed: 7 })`; one UV tile represents 0.24 m. Red pigment does not create height steps or holes. Opaque dielectric, metallic 0, neutral backing, existing maps, optional height and ownership remain unchanged; no geometry, transparent holes, juice, cutting, growth, nutrition or physics simulation.

Also accepted: `flatflexcables` for amber flat-flex insulation with six buried-conductor ridges and six lower exposed silver pads at one end only. Use `await ProceduralMaterial.create('flatflexcables', { seed: 7 })`; one UV tile represents 0.24 m. Only exposed pads are metallic, not buried traces, gaps or the opposite end. Opaque mixed-metal, default factor 1, neutral backing, existing maps, optional height and ownership remain unchanged; no cable/connector geometry, transparent film, bending, conductivity, heat-resistance certification or physics simulation.

Also accepted: `celerycuts` for open crescent celery cuts with pale flesh, lower thin green rind and five dark vascular dimples. Use `await ProceduralMaterial.create('celerycuts', { seed: 7 })`; one UV tile represents 0.24 m. The mouth opens onto opaque backing and dimples remain solid. Opaque dielectric, metallic 0, maps, optional height and ownership remain unchanged; no geometry, transparent holes, juice, cutting, growth, nutrition or physics simulation.

Also accepted: `tactileswitches` for four-legged tactile switches with silver metal covers and raised insulated black plungers. Use `await ProceduralMaterial.create('tactileswitches', { seed: 7 })`; one UV tile represents 0.24 m. Only exposed leads and cover are metallic; the housing, buried lead roots and solid plunger remain dielectric. Opaque mixed-metal, default factor 1, neutral backing, maps, optional height and ownership remain unchanged; no geometry, pressing, conductivity, switch logic, durability certification or physics simulation.

Also accepted: `paisleybrocade` for navy cloth with curved pointed golden yarn outlines and three raised inset dots. Use `await ProceduralMaterial.create('paisleybrocade', { seed: 7 })`; one UV tile represents 0.4 m. Gold-colored yarn remains nonmetal and the outlined interior remains solid blue cloth. Opaque dielectric, metallic 0, maps, optional height and ownership remain unchanged; no yarn geometry, transparent holes or cloth physics.

Also accepted: `siliconepastrybrushes` for orange one-piece silicone pastry brushes with long handles, wide heads and seven separated prongs. Use `await ProceduralMaterial.create('siliconepastrybrushes', { seed: 7 })`; one UV tile represents 0.32 m. Prong gaps show opaque backing and handle-end marks are solid dimples, not holes. Opaque dielectric, metallic 0, maps, optional height and ownership remain unchanged; no brush geometry, bristle/liquid/bending simulation, food-contact or heat-resistance certification, or physics.

Also accepted: `graphicgranite` for polished pink feldspar with pointed paired quartz intergrowth scripts. Use `await ProceduralMaterial.create('graphicgranite', { seed: 7 })`; one UV tile represents 0.2 m. Dark scripts are flat mineral pigment, not carved writing or raised veins; quartz and feldspar share the polished surface. Opaque dielectric, metallic 0, maps, optional height and ownership remain unchanged; no geometry, transparent quartz, crystal growth or physics simulation.

Also accepted: `brasspadlocks` for closed U shackles, higher brass bodies and low solid nonmetal keyhole motifs. Use `await ProceduralMaterial.create('brasspadlocks', { seed: 7 })`; one UV tile represents 0.24 m. The keyhole is a dark opaque recess, not a transparent opening. Opaque mixed-metal, default factor 1, neutral backing, maps, optional height and ownership remain unchanged; no geometry, unlocking/locking state, security certification or physics simulation.

Also accepted: `carrotcuts` for orange cross sections with filled pale medullae, twelve fine radial pigment rays and thin darker rinds. Use `await ProceduralMaterial.create('carrotcuts', { seed: 7 })`; one UV tile represents 0.24 m. The pale core and rays are flat pigment, not holes or carved citrus segments. Opaque dielectric, metallic 0, neutral backing, maps, optional height and ownership remain unchanged; no geometry, transparent medullae, juice, cutting/growth/nutrition or physics simulation.

Also accepted: `bluepushpins` for blue plastic double-flange pushpins with a narrow waist and exposed metallic tapered needles. Use `await ProceduralMaterial.create('bluepushpins', { seed: 7 })`; one UV tile represents 0.16 m. Plastic covers the roots and remains nonmetal; only exposed needles are metallic. Opaque mixed-metal, default factor 1, neutral backing, maps, optional height and ownership remain unchanged; no geometry, piercing, fastening/load certification, transparency or physics simulation.

Also accepted: `oatflakes` for broad pale flattened oat flakes with low solid central creases and six fine longitudinal fibers. Use `await ProceduralMaterial.create('oatflakes', { seed: 7 })`; one UV tile represents 0.06 m. The crease remains a solid low surface, not an open split; the broad flakes differ from slender rice and ribbed fennel seeds. Opaque dielectric, metallic 0, neutral backing, maps, optional height and ownership remain unchanged; no geometry, transparent splits, cooking/nutrition or physics simulation.

Also accepted: `tigerfur` for orange short fur with wavy dark bands and genuinely joined pointed branches. Use `await ProceduralMaterial.create('tigerfur', { seed: 7 })`; one UV tile represents 0.4 m. Pigment reuses the existing directional pile without carving stripes into its height. Opaque dielectric, metallic 0, maps, optional height and ownership remain unchanged; no fur geometry, transparency, animal/hair dynamics or physics simulation.

Also accepted: `grosgrainribbons` for blue woven ribbon strips with transverse ribs and three higher selvedge wales per edge. Use `await ProceduralMaterial.create('grosgrainribbons', { seed: 7 })`; one UV tile represents 0.06 m. Gutters remain neutral opaque backing, not transparent openings; ribbed ribbons differ from full-surface corduroy and twisted streamers. Opaque dielectric, metallic 0, maps, optional height and ownership remain unchanged; no geometry, knotting, cloth dynamics or physics simulation.

Also accepted: `azuritemalachite` for stylized blue azurite globule clusters with fine pigment rings in green malachite. Use `await ProceduralMaterial.create('azuritemalachite', { seed: 7 })`; one UV tile represents 0.2 m. Blue globules, rings and green matrix share one polished face, not raised nodules or carved circles. Opaque dielectric, metallic 0, maps, optional height and ownership remain unchanged; no geometry, transparent crystals, mineral growth or physics simulation.

Also accepted: `openendspanners` for double open-ended metal spanners with unequal raised jaws and a connected narrow shaft. Use `await ProceduralMaterial.create('openendspanners', { seed: 7 })`; one UV tile represents 0.4 m. Open jaws expose neutral opaque dielectric backing, not transparent holes. Opaque mixed-metal, default factor 1, maps, optional height and ownership remain unchanged; no geometry, fastening/torque behavior, tool certification or physics simulation.

Also accepted: `lentilseeds` for near-round convex whole lentils with short low opaque side hila. Use `await ProceduralMaterial.create('lentilseeds', { seed: 7 })`; one UV tile represents 0.04 m. The side hilum is a finite solid scar, not a long central crease or a split seed. Opaque dielectric, metallic 0, neutral backing, maps, optional height and ownership remain unchanged; no geometry, transparent splits, germination, cooking/nutrition or physics simulation.

Also accepted: `blueprintpaper` for deep blue technical paper with tiered grids, white rounded plate outlines, circles, crosshairs and finite dimension bars with short end ticks. Use `await ProceduralMaterial.create('blueprintpaper', { seed: 7 })`; one UV tile represents 0.4 m. Ink changes pigment only, not paper height, roughness or AO; distinct from grid-only `graphpaper`. Opaque dielectric, metallic 0, maps, optional height and ownership remain unchanged; no geometry, CAD parsing/export, typesetting or document certification.

Also accepted: `horsechestnutleaf` for stylized seven-leaflet compound leaves with thin individual petiolules, a common petiole and brighter raised midribs. Use `await ProceduralMaterial.create('horsechestnutleaf', { seed: 7 })`; one UV tile represents 0.8 m. Pointed lightly serrated leaflets and stalk gaps are opaque shading over neutral backing, not continuous maple lobes or transparent openings. Opaque dielectric, metallic 0, maps, optional height and ownership remain unchanged; no geometry, botanical growth/physiology or physics simulation.

Also accepted: `binderclips` for black coated trapezoid binder clips with two constant-width silver U-wire handles and a raised lower lip. Use `await ProceduralMaterial.create('binderclips', { seed: 7 })`; one UV tile represents 0.32 m. Exposed handles use metallic 1; black coating, cavities and exterior neutral opaque backing stay metallic 0, with default material factor 1. Maps, optional height and ownership remain unchanged; no geometry, transparent holes, clamping/spring/load behavior or physics simulation.

Also accepted: `charoite` for stylized purple polished stone with twisting fine fiber bundles, paler broad bands and sparse dark solid inclusions. Use `await ProceduralMaterial.create('charoite', { seed: 7 })`; one UV tile represents 0.2 m. Inclusions and fiber pigment share one polished plane with tiny grain only, not dark pits or carved bands. Opaque dielectric, metallic 0, maps, optional height and ownership remain unchanged; no geometry, transparent mineral cavities, mineral growth, dynamic chatoyant optics or physics simulation.

Also accepted: `chenilleyarn` for pink puffy yarn cords with dense brighter raised short transverse pile and loose pointed fringe beyond both core edges. Use `await ProceduralMaterial.create('chenilleyarn', { seed: 7 })`; one UV tile represents 0.08 m. Rounded cores and individually tapered tufts differ from continuous corduroy cloth and flat grosgrain strips. Gaps remain neutral opaque backing; dielectric metallic 0, maps, optional height and ownership are unchanged. No geometry, transparent pile gaps, yarn topology, cloth/hair or physics simulation.

Also accepted: `ceramicfuses` for matte white convex ceramic cartridge bodies with two full-width metal caps and raised collars. Use `await ProceduralMaterial.create('ceramicfuses', { seed: 7 })`; one UV tile represents 0.16 m. Metal caps use metallic 1, ceramic and neutral opaque exterior backing stay metallic 0, with default material factor 1; these are solid cartridges without resistor-like thin leads or transparent glass. Maps, optional height and ownership remain unchanged; no geometry, electrical/thermal/fuse-blow simulation, ratings or safety certification.

Also accepted: `hazelnutshells` for whole pointed-top rounded-base woody hazelnuts with shell-following longitudinal grain and low pale rough solid attachment scars. Use `await ProceduralMaterial.create('hazelnutshells', { seed: 7 })`; one UV tile represents 0.1 m. Basal scars are solid shaded shell surfaces, not holes exposing kernels; distinct from continuous walnut ridges or almond pore sheets. Opaque dielectric, metallic 0, neutral backing, maps, optional height and ownership remain unchanged; no geometry, transparent shell openings, kernels/cooking/botanical growth or physics simulation.

Also accepted: `yagasuricloth` for stylized cream arrow-fletching-inspired pigment with three pointed feather pairs on a shaft, alternating directions in neighboring columns over plum woven cloth. Use `await ProceduralMaterial.create('yagasuricloth', { seed: 7 })`; one UV tile represents 0.24 m. Pigment does not engrave or emboss the cloth; woven height, roughness and AO continue through both colors, and 96 threads retain normal relief at the default 256px texture size. Opaque dielectric, metallic 0, maps, optional height and ownership remain unchanged; no geometry, real weaving/dye-process/cultural craftsmanship certification or cloth physics.

Also accepted: `balloonwhisks` for three projected oval metal cage loops on a continuous neck and grip with four raised polished rings. Use `await ProceduralMaterial.create('balloonwhisks', { seed: 7 })`; one UV tile represents 0.8 m. Wires, neck and grip use metallic 1, cage gaps and neutral opaque exterior backing remain metallic 0, with default material factor 1. These are stylized shaded projections, not exact constant-width wire geometry or transparent openings. Maps, optional height and ownership remain unchanged; no mixing/food-contact certification or physics simulation.

Also accepted: `orthocerasstone` for stylized pointed straight chambered fossils with eight curved septa in dark polished stone. Use `await ProceduralMaterial.create('orthocerasstone', { seed: 7 })`; one UV tile represents 0.4 m. Pale mineral chambers, dark septa and surrounding matrix stay flush on the same polished plane rather than raised or engraved fossils. Opaque dielectric, metallic 0, AO 1, mortar 0, maps, optional height and ownership remain unchanged; no geometry, holes, paleontological/provenance certification, growth or physics simulation.

Also accepted: `rickracktrim` for continuous rose wavy textile strips with two raised selvedges and diagonal fine weave. Use `await ProceduralMaterial.create('rickracktrim', { seed: 7 })`; one UV tile represents 0.12 m. Six strips each form eight waves; tangent-corrected local width avoids simple horizontal-width pinching at slopes, without claiming exact global curve distance. Opaque dielectric, metallic 0, neutral backing, maps, optional height and ownership remain unchanged; no geometry, transparent strip gaps, real braiding or cloth physics.

Also accepted: `toroidalinductors` for twelve higher bare-copper projected turns over a dark ferrite ring. Use `await ProceduralMaterial.create('toroidalinductors', { seed: 7 })`; one UV tile represents 0.16 m. Copper uses metallic 1, ferrite and the neutral opaque central hole/exterior backing remain metallic 0, with default material factor 1. These are stylized component faces, not functioning inductors or enamel-coated wires. Maps, optional height and ownership remain unchanged; no geometry, transparent holes, leads, electromagnetic/thermal simulation, ratings or safety certification.

Also accepted: `pennerigate` for straight slanted-cut tubes with five higher longitudinal ridges and two low shaded solid mouths. Use `await ProceduralMaterial.create('pennerigate', { seed: 7 })`; one UV tile represents 0.16 m. Mouths are opaque lower shaded surfaces, not transparent holes or a real pasta bore; this is distinct from bent macaroni. Opaque dielectric, metallic 0, neutral backing, maps, optional height and ownership remain unchanged; no geometry, cooking/food or physics simulation.

Also accepted: `lepidolitemica` for lavender lepidolite-inspired mica with three higher, brighter, smoother nested hexagonal cleavage tiers on a continuous rougher matrix, not expanded wavy vermiculite. Use `await ProceduralMaterial.create('lepidolitemica', { seed: 7 })`; one UV tile represents 0.2 m. This is a stylized seeded pattern, not mineral-composition certification, crystal physics or iridescence. Opaque dielectric, metallic 0, mortar0, maps, optional height and ownership remain unchanged; no geometry, transparency/transmission, particles or physics simulation.

Also accepted: `brassjinglebells` for raised brass faces with a crimped seam and four round-ended low opaque cross slots. Use `await ProceduralMaterial.create('brassjinglebells', { seed: 7 })`; one UV tile represents 0.16 m. Brass is metallic 1, the low dark solid slots and neutral opaque exterior backing metallic 0, with default factor 1. Stylized top-face shading, not functioning bells or transparent holes; maps, optional height and ownership remain unchanged. No geometry, internal bead, suspension loop, impact/audio, acoustics or physics simulation.

Also accepted: `nutmeghalves` for oval nutmeg cut faces with lower rough dark rind and coplanar twisted dark pigment marbling in a pale-brown kernel. Use `await ProceduralMaterial.create('nutmeghalves', { seed: 7 })`; one UV tile represents 0.12 m. Marbling does not raise/lower the cut surface or change roughness/AO. Opaque dielectric, metallic0, neutral backing, maps, optional height and ownership remain unchanged. Stylized cut-face shading; no geometry, transparency/transmission, food/plant/cooking or physics simulation.

Also accepted: `coaxialcablecuts` for coplanar cable cuts with a silver central conductor, pale dielectric, forty isolated shield-strand sections and black jacket. Use `await ProceduralMaterial.create('coaxialcablecuts', { seed: 7 })`; one UV tile represents0.12 m. Conductor/shield are metallic1, dielectric/jacket/neutral opaque backing metallic0, with default factor1. All components share a nearly flat cut plane. Maps, optional height and ownership remain unchanged; no geometry, transparency/transmission, real strands/connectors, electrical/EM/RF simulation, ratings or safety certification.

Also accepted: `shippocloth` for cream interlocking complete-circle pigment on continuous navy cloth. Use `await ProceduralMaterial.create('shippocloth', { seed: 7 })`; one UV tile represents0.24 m. Ink only changes pigment; the96-thread weave independently controls height/roughness/AO, with actual default256 two-axis normal detail under both colors. Opaque dielectric, metallic0, mortar0, maps, optional height and ownership remain unchanged. Shippo-inspired print, not raised embroidery or semicircular tiles; no geometry, transparent holes, yarn/fiber, cloth or physics simulation.

Also accepted: `driedtamarindpods` for four rough brown shell bulges with three lower, narrower waists and a short stalk. Use `await ProceduralMaterial.create('driedtamarindpods', { seed: 7 })`; one UV tile represents 0.32 m. The silhouette itself narrows, unlike bulges inside a continuous green-pea pod. Opaque dielectric, metallic 0, neutral backing, maps, optional height and ownership remain unchanged. Stylized dry shell shading; no geometry, transparent holes, shell peeling, inner flesh/seeds, plant/food/cooking or physics simulation.

Also accepted: `conicalsampletubes` for opaque blue tube faces with a tapered lower body, higher smooth closed cap, lower side tether and rough frosted oval label. Use `await ProceduralMaterial.create('conicalsampletubes', { seed: 7 })`; one UV tile represents 0.24 m. The label changes roughness as well as color/height; it is not an image decal or transparent window. Opaque dielectric, metallic 0, neutral backing, maps, optional height and ownership remain unchanged. No geometry, transparency/transmission, real bore, liquids, volume/lid-opening/centrifugation simulation or medical/sterility/ratings/safety certification.

Also accepted: `botryoidalcopper` for higher brighter smoother native-copper-inspired rounded nodules above low dark rough metallic valleys, not concave hammer dents. Use `await ProceduralMaterial.create('botryoidalcopper', { seed: 7 })`; one UV tile represents 0.16 m. The whole opaque surface including valleys uses metallic 1/mortar 0 and default factor 1; no dielectric backing. Maps, optional height and ownership remain unchanged. Stylized seeded nodules, not a certified mineral specimen; no geometry, particles, crystal-growth, metallurgy, chemistry or physics simulation.

Also accepted: `pencilshavings` for half-annular wood fans with twelve radial corrugations and a darker smoother outer paint rim, not hexagonal pencil cut faces. Use `await ProceduralMaterial.create('pencilshavings', { seed: 7 })`; one UV tile represents 0.16 m. Paint changes color/roughness while preserving the same fluted height and AO. Opaque dielectric, metallic 0, neutral backing, maps, optional height and ownership remain unchanged; the inner area and open half are not transparent. No geometry, particles/real wood scraps or bending/sharpening/damage/physics simulation.

Also accepted: `papayacuts` for oval ripe-papaya cuts with thick higher orange flesh and twenty-eight raised dark kernels in a lower central pit. Use `await ProceduralMaterial.create('papayacuts', { seed: 7 })`; one UV tile represents 0.16 m. Seeds are higher than the pit but lower than the flesh, and change roughness/AO as well as color/height rather than being black ink dots. Opaque dielectric, metallic 0, neutral backing, maps, optional height and ownership remain unchanged; the pit is not a transparent bore. Stylized bounded seed layout; no geometry, transparency/transmission or liquid/growth/cutting/decay/physics simulation.

Also accepted: `sewingthimbles` for closed round-top silver-colored thimble faces with twenty-four lower darker rougher blind dimples and a higher smoother wider rolled lower lip. Use `await ProceduralMaterial.create('sewingthimbles', { seed: 7 })`; one UV tile represents 0.16 m. Body/lip/dimples are metallic 1 with default factor 1, complete-body mortar 0 and neutral dielectric backing; blind dimples are not punched holes. Maps, optional height and ownership remain unchanged. Front-face shading only; no geometry, transparent holes, real interior, sewing/puncture/collision/deformation/physics simulation or protective rating.

Also accepted: `boullebrassinlay` for coplanar brass S-scrolls and oval finials on polished mottled synthetic tortoiseshell-inspired resin. Use `await ProceduralMaterial.create('boullebrassinlay', { seed: 7 })`; one UV tile represents 0.24 m. Brass is metallic 1, resin and empty curls metallic 0, with default factor 1 and mortar 0 throughout. Both share the same polished height/AO; nearly flat normal and white AO previews are intentional, not raised gold badges or carved grooves. Maps, optional height and ownership remain unchanged. Stylized Boulle-inspired synthetic material only; no geometry, real tortoiseshell, transparency/transmission or volume/manufacture/restoration/physics simulation.

Also accepted: `diamondpanelparquet` for four mitered frame boards around clipped diagonal diamond boards with alternating board-aligned grain and recessed dark wood joints. Use `await ProceduralMaterial.create('diamondpanelparquet', { seed: 7 })`; one UV tile represents 0.8 m. Metallic 0 and mortar 0 cover the whole opaque panel, including dark wood joints, not neutral grout or transparent gaps. Maps, optional height and ownership remain unchanged. This is a framed diamond layout, not an authenticity claim for historical parquet; no geometry, real boards/displacement, floor collision/installation/deformation or physics simulation.

Also accepted: `dendriticfrost` for raised rough opaque frost crystals with six connected stems and twenty-four explicit 60° sidebranches over a smoother dark-blue face. Use `await ProceduralMaterial.create('dendriticfrost', { seed: 7 })`; one UV tile represents 0.12 m. Ice changes height and roughness as well as pigment, unlike printed snowflakes. Metallic 0 and mortar 0 cover the entire opaque tile, with maps, optional height and ownership unchanged. No geometry, transparency/transmission or crystal-growth/weather/snow-accumulation/melting/physics simulation.

Also accepted: `bullionknots` for elongated golden embroidery knots with twelve raised transverse wraps and closed rounded ends over dark-blue woven cloth. Use `await ProceduralMaterial.create('bullionknots', { seed: 7 })`; one UV tile represents 0.12 m. The wraps change height, roughness, color and AO above continuous lower yarn valleys rather than being printed stripes; golden yarn is dielectric pigment, not metal. Metallic 0 and mortar 0 cover yarn and cloth, with maps, optional height and ownership unchanged. No geometry, real helical yarn topology, transparent cloth holes or needle/thread/cloth/sewing/physics simulation.

Also accepted: `orecchiette` for cupped golden semolina ear pasta with a continuous high rolled rim and lower darker rougher off-center bowl. Use `await ProceduralMaterial.create('orecchiette', { seed: 7 })`; one UV tile represents 0.16 m. The bowl remains opaque dough, not a hole or raised ravioli filling; height, color, roughness and AO describe the cup. Metallic 0 spans the tile, with mortar 0 on dough and mortar 1 on exterior backing; maps, optional height and ownership are unchanged. Stylized surface only: no geometry, actual pasta form/displacement/thickness/holes or cooking/hydration/deformation/food/physics simulation.

Also accepted: `solderlessbreadboard` for an opaque white plastic face with sixteen rows of two five-hole banks, rounded-square dark recesses, intact white bridges and a continuous lower central trough. Use `await ProceduralMaterial.create('solderlessbreadboard', { seed: 7 })`; the 0.04064 m tile gives 2.54 mm hole pitch and 7.62 mm inner-column separation. Metallic 0/mortar 0 cover plastic, trough and positive-height opaque floors; no alpha holes or exposed metal contacts. Maps, optional height and ownership remain unchanged. Signal-face surface only: no geometry, actual holes, hidden metal contacts, power rails/labels/wiring or circuit/electrical/insertion/physics simulation.

Also accepted: `kyaniteblades` for opaque blue kyanite-inspired bundles of three parallel cleaved blades with staggered oblique ends and three raised longitudinal striae per blade on darker rougher lower mineral matrix. Use `await ProceduralMaterial.create('kyaniteblades', { seed: 7 })`; one UV tile represents 0.16 m. Striae alter height, color, roughness and AO, not just pigment; all blades and matrix retain metallic 0/mortar 0, maps, optional height and ownership. Stylized surface, not mineral identification/crystallographic certification or real anisotropic optics; no geometry, transparent/transmissive crystals or crystal-growth/cleavage-fracture/physics simulation.

Also accepted: `internaltoothwashers` for closed silver-colored washer rims with twelve inward metal teeth, alternating six raised and six lowered tips around an opaque star-shaped recess. Use `await ProceduralMaterial.create('internaltoothwashers', { seed: 7 })`; one UV tile represents 0.16 m. The outer band stays closed and flat; alternate teeth differ in height/AO, not metal pigment or roughness. Material metallic factor 1 preserves map metallic 1 on ring/teeth and 0 on opaque recessed/exterior backing; maps, optional height and ownership are unchanged. No geometry, transparent holes or spring/preload/anti-loosening/deformation/mechanical/physics simulation.

Also accepted: `driedchillies` for curved tapering dried red chillies with real shrivelled wrinkle relief, higher olive-green calyces and connected thin stems. Use `await ProceduralMaterial.create('driedchillies', { seed: 7 })`; one UV tile represents 0.16 m. Wrinkle valleys are lower, darker, rougher and more occluded, not painted stripes. Metallic 0 spans the opaque tile; fruit/stem/calyx retain mortar 0, with mortar 1 on exterior backing. Maps, optional height and ownership are unchanged. No geometry or plant-growth/drying/food/cooking/physics simulation.

Also accepted: `utilityknifeblades` for silver-colored trapezoidal utility blades with two spine indexing notches and a continuous lower smoother brighter honed edge. Use `await ProceduralMaterial.create('utilityknifeblades', { seed: 7 })`; one UV tile represents 0.24 m. The edge changes height, roughness, color and AO, not merely pigment, and remains metallic. Material metallic factor 1 preserves map metallic 1 across blade/edge and 0 in notches/exterior opaque backing; maps, optional height and ownership are unchanged. Surface only: no geometry, actual holes/sharp edges or cutting/honing/wear/tool/physics simulation.

Also accepted: `windmillparquet` for five-board windmill parquet with four rotating wood-grain staves around a wooden center square and lower darker rougher wooden joints. Use `await ProceduralMaterial.create('windmillparquet', { seed: 7 })`; one UV tile represents 0.8 m. Grain follows each board, and long staves are uninterrupted across interior unit lines. The existing windmillpavers owner layout is reused, but wood-grain finish and all-wood joints replace stone/grout. Faces and joints are metallic 0 and mortar 0; four maps, optional height and ownership are unchanged. Surface only: no geometry, installation or physics simulation.

Also accepted: `bismuthhoppers` for gold-violet bismuth-inspired hopper faces with six descending square metallic terraces around an opaque recessed center. Use `await ProceduralMaterial.create('bismuthhoppers', { seed: 7 })`; one UV tile represents 0.16 m. Terraces become lower, darker, rougher and more occluded inward, not merely differently painted. Material metallic factor 1 preserves metallic 1 on all six terraces and 0 on the center/exterior backing. Four maps, optional height and ownership are unchanged. Surface only: no geometry, actual holes, physical iridescence/thin-film optics, crystal growth or physics simulation.

Also accepted: `splitvanillapods` for nine curved brown split vanilla pods with two continuous high skin rails and closed ends around a lower dark rough opaque channel containing sixteen raised darker seed clusters. Use `await ProceduralMaterial.create('splitvanillapods', { seed: 7 })`; one UV tile represents 0.6 m. Clusters rise above the channel floor but stay below the skins; all surfaces remain metallic 0. Four maps, optional height and ownership are unchanged. Seed clusters are stylized aggregates, not individual seed-scale geometry. Surface only: no actual slit, seed objects, drying/food or physics simulation.

Also accepted: `seamrippers` for asymmetric steel seam rippers with a long curved tapered tine, a shorter blue protective ball-capped tine and a nonmetal navy handle. Use `await ProceduralMaterial.create('seamrippers', { seed: 7 })`; one UV tile represents 0.6 m. The U slot exposes backing between unequal tines. Material metallic factor 1 preserves steel metallic 1 and plastic handle/ball metallic 0, with distinct height and roughness rather than only colors. Four maps, optional height and ownership are unchanged. Surface only: no geometry, actual sharp edges/cuts, seam ripping/sewing/tool or physics simulation.

Also accepted: `flakedarrowheads` for stemmed flint-inspired points with two open lateral notches, a raised central ridge and five lower darker rougher oblique flake scars on each front facet. Use `await ProceduralMaterial.create('flakedarrowheads', { seed: 7 })`; one UV tile represents 0.4 m. Scars affect height, roughness, pigment and AO, not just color; notches expose opaque backing and all surfaces remain metallic 0. Four maps, optional height and ownership are unchanged. Stylized surface only: no geometry, actual sharp edges/holes, knapping/flight/impact/weapon or physics simulation or archaeological-authenticity claim.

Also accepted: `dandelionseeds` for stylized seeds with sixteen thin off-white pappus fibers, a connected lower tan stalk and a raised brown seed. Use `await ProceduralMaterial.create('dandelionseeds', { seed: 7 })`; one UV tile represents 0.09 m. Fibers, stalk and seed differ in height, roughness, color and AO; gaps expose opaque backing, not transparency, and all surfaces remain metallic 0. Four maps, optional height and ownership are unchanged. Stylized surface only: no geometry, transparent fibers/holes, growth, wind/seed flight or physics simulation or microscopic/botanical-authenticity certification.

Also accepted: `shojipaperlattice` for an opaque shoji-inspired surface with a continuous six-by-six raised brown wood grid, rail-aligned grain and lower white fibrous paper. Use `await ProceduralMaterial.create('shojipaperlattice', { seed: 7 })`; one tile spans 0.9 m. Wood is higher, darker and smoother than paper; horizontal wood grain continues through crossings at a single height. All metal and mortar values are zero, so panes are opaque material rather than holes or gray grout. The existing four maps, optional height, Worker/cache/tint and cleanup contracts apply. This does not add transmission, transparent paper, scattering or geometry.

Also accepted: `nyloncableties` for cream nylon ties with one wider open locking head, a continuous narrow strap, seventeen physically raised darker smoother ratchet teeth and a tapered tail. Use `await ProceduralMaterial.create('nyloncableties', { seed: 7 })`; one tile spans 0.6 m. The locking head is higher than strap and teeth; openings expose low opaque backing and all metal values are zero. Existing four maps, optional height, Worker/cache/tint and cleanup contracts apply. This is a stylized surface, not transparent holes, geometry or functional locking/load physics.

Also accepted: `weavingshuttles` for pointed hollow wooden boat shuttles with longitudinal grain, twelve raised cream yarn windings and exposed lower metal spindle ends. Use `await ProceduralMaterial.create('weavingshuttles', { seed: 7 })`; one tile spans 0.6 m. Wood is highest, yarn sits lower around the recessed spindle, and side clearances expose opaque backing. Public factor1 preserves only the exposed spindle's metal1 while wood/yarn/backing remain metal0; existing maps, optional height, Worker/cache/tint and cleanup apply. No transparent holes, geometry, functional weaving or tension simulation is added.

Also accepted: `tailorstapes` for four unnumbered cream woven ribbons with dual-edge black graduations and blank central cloth lanes. Use `await ProceduralMaterial.create('tailorstapes', { seed: 7 })`; one tile spans 0.1 m. Each edge has one hundred positions grouped as eight short, one medium and one long per ten; ink is darker/smoother and retains woven microrelief. All metal values are zero, cloth is opaque, and existing four maps/optional height/Worker/cache/tint/cleanup apply. This is a stylized printed surface, not numbers, a measurement API, real calibration, cloth simulation or geometry.

Also accepted: `woodenclothespins` for stylized open-jaw wooden pegs with two continuous longitudinal-grain jaws, a flared central slit and three higher exposed metal spring wraps. Use `await ProceduralMaterial.create('woodenclothespins', { seed: 7 })`; one tile spans 0.6 m. Wood is lower and rougher than the spring, and slit/inter-wrap clearances expose opaque backing. Public factor1 preserves wire metal1 and wood/backing metal0; existing maps, optional height, Worker/cache/tint and cleanup apply. This does not add transparent holes, geometry, working clamping/spring physics or product certification.

Also accepted: `cinnamonbarkcoils` for open cinnamon bark-coil end faces with three and a half raised spiral turns, lower darker rougher outer bark, and true center/inter-turn clearances. Use `await ProceduralMaterial.create('cinnamonbarkcoils', { seed: 7 })`; one tile spans 0.09 m. The clearances expose low opaque backing, not transparency or pastry filling; all metal values are zero. Existing four maps, optional height, Worker/cache/tint and cleanup apply. This does not add geometry, curling/food simulation or botanical authenticity certification.

Also accepted: `compactcassettefaces` for dark rounded cassette faces with two lower hollow six-spoke reels, a raised blank cream title label, three lower access openings and a visible magnetic ribbon. Use `await ProceduralMaterial.create('compactcassettefaces', { seed: 7 })`; one tile spans 0.45 m. All metal values are zero and cutouts expose opaque backing. The existing four maps, optional height, Worker/cache/tint and cleanup apply. The unprinted title label is intentional; this surface adds no text/font API, transparency, geometry, recording/playback or audio functionality.

Also accepted: `kintsugiceramic` for sixteen dark teal glazed ceramic shards joined by continuous coplanar gold-filled seams and smooth repaired triple junctions. Use `await ProceduralMaterial.create('kintsugiceramic', { size: 512, seed: 7, heightMap: true })`; inspect it at `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. Ceramic interiors are nonmetallic and gold seam cores metallic with material factor 1. Both share a filled flat micro-height and AO 0.99, not open cracks or raised gold wires. The 0.32 m tile uses 0.0003 m relief; existing Worker/cache/tint/height/resource ownership contracts remain unchanged. This adds only a repair appearance, not damage/repair simulation or new geometry.

Also accepted: `pleatedfilterpapers` for cream filter-paper faces with continuous flat bases, rising thirty-two-fold annular walls and phase-matched scalloped rims. Use `await ProceduralMaterial.create('pleatedfilterpapers', { size: 512, seed: 7, heightMap: true })`; inspect `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. The ridges and valleys have distinct height, color, roughness and AO, while all paper stays nonmetallic. Outer scallop gaps show low opaque backing, not transparency. The 0.36 m tile and 0.004 m relief preserve Worker/cache/tint/height/resource ownership. This is a surface appearance, not new cup geometry, pore/permeability certification or filtration simulation.

Also accepted: `splitcedarshakes` for four half-staggered courses of six variable-width warm cedar shake faces with longitudinal grain, thicker frayed butts and two round-ended splits open through each butt. Use `await ProceduralMaterial.create('splitcedarshakes', { size: 512, seed: 7, heightMap: true })`; inspect `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. All wood is nonmetallic; splits and gutters show lower opaque backing, not transparency. A 2 m tile with 0.008 m relief preserves Worker/cache/tint/height/resource ownership. Static authored taper and splits do not add damage/weathering simulation, new geometry or roof construction certification.

Also accepted: `swavepavers` for four half-staggered courses of eight granular concrete blocks with genuinely curved S-profile recessed side joints. Use `await ProceduralMaterial.create('swavepavers', { size: 512, seed: 7, heightMap: true })`; inspect `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. The curve changes height, roughness, AO and mortar coverage rather than merely pigment, with full nonmetal stone over lower opaque neutral grout. A 0.96 m tile and 0.006 m relief preserve Worker/cache/tint/height/resource ownership. This is an authored paving appearance, not new geometry, rigid-body interlock or construction/traffic simulation.

Also accepted: `mushroomslices` for mushroom cross-sections with a cream dome, lower darker rougher brown perimeter, twelve attached lower dark gill fingers and a continuous fibrous stem. Use `await ProceduralMaterial.create('mushroomslices', { size: 512, seed: 7, heightMap: true })`; inspect `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. All phases are nonmetallic and inter-gill gaps show lower opaque backing, not transparency. A 0.18 m tile and 0.004 m relief preserve Worker/cache/tint/height/resource ownership. This adds only a cut-surface appearance, not new geometry, fungal growth or species/edibility certification.

Also accepted: `insulatedringlugs` for silver hollow ring/neck plates under higher red dielectric collars with two lower nonmetal crimp bands. Use `await ProceduralMaterial.create('insulatedringlugs', { size: 512, seed: 7, heightMap: true })`; inspect `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. Silver is M1, red polymer and both indentations M0; material factor 1 keeps the mixed map active. Bore and gaps are lower opaque backing, not transparency. A 0.18 m tile and 0.004 m relief preserve Worker/cache/tint/height/resource ownership. This is only terminal appearance, not geometry, electrical/crimp simulation or dielectric/voltage certification.

Also accepted: `bananaslices` for cream elliptical banana cross-sections with a lower rougher pale rim, three continuous recessed Y partitions and six paired dark seed rudiments. Use `await ProceduralMaterial.create('bananaslices', { size: 512, seed: 7, heightMap: true })`; inspect `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. The rim, partitions and seeds have distinct height, color, roughness and AO; all tissue remains nonmetallic over low opaque backing. A 0.12 m tile and 0.004 m relief preserve Worker/cache/tint/height/resource ownership. This adds a static cut-fruit appearance, not geometry, ripening/growth simulation or food certification.

Also accepted: `rosemarysprigs` for continuous pale stems bearing sixteen narrow slanted green needle leaves and brighter higher smoother midribs. Use `await ProceduralMaterial.create('rosemarysprigs', { size: 512, seed: 7, heightMap: true })`; inspect `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. Needle faces sit above the paler lower stem, with open gaps between pairs, all M0 over low opaque backing. The 0.18 m tile and 0.004 m relief preserve Worker/cache/tint/height/resource ownership. This adds a static herb-sprig appearance, not geometry, growth, botany or herbal/food certification.

Also accepted: `pencilsharpeners` for all-metal sharpener faces with open round housing bores, eight low grip bands, a raised honed blade and a higher slotted screw. Use `await ProceduralMaterial.create('pencilsharpeners', { size: 512, seed: 7, heightMap: true })`; inspect `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. All solid parts and recesses retain M1; bores and exterior use low opaque M0 backing. A 0.15 m tile and 0.004 m relief preserve Worker/cache/tint/height/resource ownership. This adds a static surface, not geometry, sharpening/cutting mechanics, precise hardware dimensions or safety certification.

Also accepted: `scissors` for open scissors with two true hollow red oval handles, continuous silver necks, two splayed honed pointed blades and a higher round silver pivot. Use `await ProceduralMaterial.create('scissors', { size: 512, seed: 7, heightMap: true })`; inspect `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. Red loops remain M0, silver blades/necks/pivot M1, and holes/exterior low opaque M0 backing. A 0.25 m tile and 0.004 m relief preserve Worker/cache/tint/height/ownership. This adds a static surface, not geometry, moving hinges, cutting mechanics or safety certification.

Also accepted: `serpentinesprings` for one continuous silver wire with six runs, five alternating true semicircular U bends and two rounded free ends. Use `await ProceduralMaterial.create('serpentinesprings', { size: 512, seed: 7, heightMap: true })`; inspect `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. The curved crown retains M1 on full wire cores while gaps are low opaque M0 backing. A 0.2 m tile and 0.004 m relief preserve Worker/cache/tint/height/ownership. This is static flat serpentine-wire appearance, not geometry, helical spring construction, elasticity/force simulation or safety certification.

Also accepted: `impellerfaces` for six swept pointed silver blades with six open sectors, a higher annular hub and a true center bore. Use `await ProceduralMaterial.create('impellerfaces', { size: 512, seed: 7, heightMap: true })`; inspect `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. Connected hub/blade cores remain M1; bore/sectors use low opaque M0 backing. Radial blade relief rises outward, with a lower darker rougher hone, below the hub. A 0.3 m tile and 0.004 m relief preserve Worker/cache/tint/height/ownership. This adds a static surface, not geometry, rotation, fluid/aerodynamic mechanics or safety certification.

Also accepted: `chipresistors` for a higher black rectangular chip body, two lower silver wrap terminals and a white nonmetal 103 marking. Use `await ProceduralMaterial.create('chipresistors', { size: 512, seed: 7, heightMap: true })`; inspect `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. The zero counter is opaque black high body, not low backing or a physical bore. Both white ink and black body remain M0, silver terminals M1; ink is thin and rougher. A 0.12 m tile and 0.004 m relief preserve Worker/cache/tint/height/ownership. The marking is cosmetic, not a tested resistance, circuit simulation, precise component rating or electrical/safety certification.

Also accepted: `memorycardbacks` for eight recessed gold contacts over a high black keyed shell, seven high opaque insulating gaps, a truly clipped corner and an open side notch. Use `await ProceduralMaterial.create('memorycardbacks', { size: 512, seed: 7, heightMap: true })`; inspect `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. Only gold pads are M1; black shell/gaps are M0, with low opaque M0 backing through corner/notch cuts. A 0.15 m tile and 0.004 m relief preserve Worker/cache/tint/height/ownership. This is generic static appearance without brands/logos, not storage access, circuitry, precise dimensions, SD compliance or security/electrical/safety certification.

Also accepted: `gnocchi` for cream floured oval pillows with rounded crowns and seven genuinely curved lower fork impressions. Use `await ProceduralMaterial.create('gnocchi', { size: 512, seed: 7, heightMap: true })`; inspect `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. Curved grooves are darker, lower, rougher and lower-AO than intact dough, without holes; the full face remains M0 with exact mortar-zero. Flour affects pigment/roughness, not particles. A 0.12 m tile and 0.004 m relief preserve Worker/cache/tint/height/ownership. This adds static appearance, not geometry, cooking/growth simulation or food/safety certification.

Also accepted: `rectangularsocketfaces` for a closed silver bezel around an open low socket cavity, an opaque high black tongue and four higher silver pads. Use `await ProceduralMaterial.create('rectangularsocketfaces', { size: 512, seed: 7, heightMap: true })`; inspect `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. The silver ring/pins are M1; the black tongue and its three insulating gaps remain high M0 and exact mortar-zero, not holes. Low cavity/backing stays M0. A 0.09 m tile and 0.004 m relief preserve Worker/cache/tint/height/ownership. This adds static appearance, not port geometry, electrical I/O, precise dimensions, USB compliance or electrical/safety certification.

Also accepted: `saffronthreads` for three curved red threads sharing one intact root with widened rounded tips and two open low fork gaps. Use `await ProceduralMaterial.create('saffronthreads', { size: 512, seed: 7, heightMap: true })`; inspect `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. The shared root and curved core traces stay high, opaque, M0 and exact mortar-zero; the fork gaps and old straight-chord controls stay low backing. Tip widths and rounded crowns survive actual512 sampling. A 0.06 m tile and 0.004 m relief preserve Worker/cache/tint/height/ownership. This adds static appearance, not flower geometry, growth/cooking simulation or food/safety certification.

Also accepted: `fishhooks` for closed true-eye rings connected to straight shanks, lower semicircular J bends, tapered upper points and inward barbs. Use `await ProceduralMaterial.create('fishhooks', { size: 512, seed: 7, heightMap: true })`; inspect `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. Full silver cores stay M1 and exact mortar-zero; the eye bore, upward-open J cavity and outward barb mirror remain low M0 backing. Final bore subtraction includes the shank, so it cannot fill the eye hole. A 0.15 m tile and 0.004 m relief preserve Worker/cache/tint/height/ownership. This adds static appearance over opaque backing, not hook geometry, fishing physics, strength or safety certification.

Also accepted: `violinfholes` for mirrored paired cubic f-hole cuts in continuous warm wood, connected round terminal eyes and two side nicks per hole. Use `await ProceduralMaterial.create('violinfholes', { size: 512, seed: 7, heightMap: true })`; inspect `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. Curved cores, terminal eyes and nicks are low dark-brown cavities; old straight-axis controls and the central strip stay high intact wood. Both wood and cavities are M0 and exact mortar-zero, with continuous world-periodic grain across pose cells. A 0.45 m tile and 0.004 m relief preserve Worker/cache/tint/height/ownership. This adds static appearance over opaque backing, not violin/through-hole geometry, sound synthesis, acoustic simulation or instrument certification.

Also accepted: `palmiers` for golden heart-shaped pastries with two genuine lower caramel spirals, central folds, notched double crowns and tapered lower points. Use `await ProceduralMaterial.create('palmiers', { size: 512, seed: 7, heightMap: true })`; inspect `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. Coils are lower, darker, smoother and lower-AO than intact same-radius opposite-angle crumb controls, proving spirals rather than rings. The central fold is lower/darker/rougher, not a hole; all full pastry cores remain M0 and exact mortar-zero over low opaque backing. A 0.18 m tile and 0.004 m relief preserve Worker/cache/tint/height/ownership. This adds static appearance, not pastry geometry, baking/growth simulation or food/safety certification.

Also accepted: `barbedwire` for seamless rounded silver wire pairs with real alternating over-under height, raised collars and four connected pointed barbs at each knot. Use `await ProceduralMaterial.create('barbedwire', { size: 512, seed: 7, heightMap: true })`; inspect `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. Strand height order reverses between exposed arms; crossings retain a single top-wire height rather than adding both wires. Collars are higher than barbs, which are higher than uncovered crossings. Full metal cores stay M1 and exact mortar-zero; true interwire/interbarb gaps stay low opaque M0. A 0.4 m tile and 0.004 m relief preserve Worker/cache/tint/height/ownership. This adds static appearance, not fence geometry, mechanics or load/strength/electrical/safety certification.

Also accepted: `oxfordweave` for paired blue warp and pale weft cotton yarns with alternating raised crossings and exposed lower yarns. Use `await ProceduralMaterial.create('oxfordweave', { size: 512, seed: 7, heightMap: true })` and select it in `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. The opaque dielectric uses metallic 0, a 0.08 m tile and 0.001 m relief; tint, repeats, Worker/cache and caller-owned cleanup work as before. This adds surface shading, not yarn geometry, transparent holes or cloth simulation.

Also accepted: `lacewood` for pale, irregular elongated medullary rays across warm longitudinal wood grain. Use `await ProceduralMaterial.create('lacewood', { size: 512, seed: 7, heightMap: true })` and select it in `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. The opaque dielectric has metallic 0, a 0.35 m tile and 0.001 m relief. Ray pigment is smoother, not raised; tint, repeats, Worker/cache and caller-owned cleanup work as before. No geometry, displacement or anisotropic shader is added.

Also accepted: `papyrus` for pale vertical plant strips pressed over a lower horizontal layer, fine longitudinal fibers and warm opaque backing. Use `await ProceduralMaterial.create('papyrus', { size: 512, seed: 7, heightMap: true })` and select it in `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. It is dielectric with metallic 0, a 0.3 m tile and 0.0015 m relief; tint, repeats, Worker/cache and caller-owned cleanup work as before. This is layered surface shading, not an alternating weave, geometry, transparent holes or papermaking simulation.

Also accepted: `larimar` for blue merging mineral pools, milky cloud veins and pale curved fibers on one polished opaque surface. Use `await ProceduralMaterial.create('larimar', { size: 512, seed: 7, heightMap: true })` and select it in `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. It is metallic-zero dielectric with a 0.25 m tile and 0.001 m relief; tint, repeats, Worker/cache and caller-owned cleanup work as before. No crystal geometry, transparency, SSS or anisotropic shader is added.

Also accepted: `paperbark` for pale papery bark flakes, irregular torn edges and raised lower rolled lips over fibrous underbark. Use `await ProceduralMaterial.create('paperbark', { size: 512, seed: 7, heightMap: true })` and select it in `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. It stays opaque metallic-zero/mortar-zero with a 0.4 m tile and 0.002 m relief; tint, repeats, Worker/cache and caller-owned cleanup remain unchanged. This is surface shading, not bark geometry, displacement or peeling simulation.

Also accepted: `horseshoes` for iron U-shaped shoes with six recessed nail holes, open heels and a continuous lower fuller. Use `await ProceduralMaterial.create('horseshoes', { size: 512, seed: 7, heightMap: true })` and select it in `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. The public metallic factor is 1; maps retain metallic iron cores and nonmetal lower opaque hole/opening backing, with mortar 0. The tile is 0.6 m and relief is 0.01 m; tint, repeats, Worker/cache and caller-owned cleanup work as before. No geometry, transparent holes, collision or equine simulation is added.

Also accepted: `durianpeel` for olive rind with dense staggered six-facet tapered spines, rounded ridges and softened tips. Use `await ProceduralMaterial.create('durianpeel', { size: 512, seed: 7, heightMap: true })` and select it in `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. All pixels are opaque metallic-zero/mortar-zero; the tile is 0.24 m and relief is 0.012 m. Tint, repeats, Worker/cache and caller-owned cleanup remain unchanged. These are normal/height details, not protruding spine geometry, silhouette displacement, holes or fruit simulation.

Also accepted: `flystitch` for pale Y-shaped V arms and anchoring stems raised above dark finely woven cloth, with no doubled junction height. Use `await ProceduralMaterial.create('flystitch', { size: 512, seed: 7, heightMap: true })` and select it in `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. All pixels remain opaque metallic-zero/mortar-zero; the tile is 0.12 m and relief is 0.0012 m. Tint, repeats, Worker/cache and caller-owned cleanup work as before. No thread geometry, transparent holes, needlework or cloth simulation is added.

Also accepted: `abaloneshells` for concave abalone interiors, raised rims, static pale growth bands and five low holes along one edge, with intact opposite faces and bridges. Use `await ProceduralMaterial.create('abaloneshells', { size: 512, seed: 7, heightMap: true })` and select it in `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. All pixels stay opaque metallic-zero/mortar-zero; the tile is 0.45 m and relief is 0.006 m. Tint, repeats, Worker/cache and caller-owned cleanup work as before. No geometry, transparent holes, view-dependent iridescence/thin-film shader, transmission or shellfish simulation is added.

Also accepted: `gyroidinfill` for orange rounded bands from a seeded-shifted `z=π/4` gyroid slice over low opaque backing. Use `await ProceduralMaterial.create('gyroidinfill', { size: 512, seed: 7, heightMap: true })` and select it in `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. All pixels remain metallic-zero/mortar-zero; the tile is 0.16 m and relief is 0.0015 m. Tint, repeats, Worker/cache and caller-owned cleanup work as before. This is an implicit-field texture, not a constant-width toolpath, 3D lattice/mesh generator, geometry export, transparent opening or printing simulation.

Also accepted: `cloisonne` for closed raised brass six-petal flower outlines and center rings over cyan enamel. Use `await ProceduralMaterial.create('cloisonne', { size: 512, seed: 7, heightMap: true })` and select it in `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. The factor is 1 so the map distinguishes metallic brass from nonmetal enamel; all pixels stay opaque/mortar-zero, with a 0.18 m tile and 0.001 m relief. Tint, repeats, Worker/cache and caller-owned cleanup work as before. No geometry, transparent glass, transmission, thin-film shader or firing simulation is added.

Also accepted: `rambutanskin` for red rind with raised root collars and curved tapering golden fruit hairs. Use `await ProceduralMaterial.create('rambutanskin', { size: 512, seed: 7, heightMap: true })` and select it in `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. All pixels remain opaque metallic-zero/mortar-zero; the tile is 0.12 m with 0.0035 m relief. Tint, repeats, Worker/cache and caller-owned cleanup work as before. This is surface shading, not hair geometry, displacement, transparent gaps, SSS, growth or fruit simulation.

Also accepted: `rackgears` for seven-tooth silver straight racks with connected roots, two low mounting bores and a lower longitudinal machining groove. Use `await ProceduralMaterial.create('rackgears', { size: 512, seed: 7, heightMap: true })` and select it in `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. Factor 1 preserves metallic rack faces versus nonmetal backing/bore floors; all pixels stay opaque/mortar-zero, with a 0.6 m tile and 0.007 m relief. Tint, repeats, Worker/cache and caller-owned cleanup work as before. No geometry, transparent holes, gear meshing, precision involute model or mechanical simulation is added.

Also accepted: `poplin` for rose cotton with finer denser warp, broader weft ribs and real single-yarn one-over-one lift. Use `await ProceduralMaterial.create('poplin', { size: 512, seed: 7, heightMap: true })` and select it in `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. All pixels remain opaque metallic-zero/mortar-zero, with a 0.016 m tile and 0.0003 m relief. Tint, repeats, Worker/cache and caller-owned cleanup work as before. No yarn geometry, transparent weave openings, cloth physics or anisotropy shader is added.

Also accepted: `ooliticlimestone` for pale honed limestone with concentric cortex ooids and darker nuclei. Use `await ProceduralMaterial.create('ooliticlimestone', { size: 512, seed: 7, heightMap: true })` and select it in `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. The cortex/nuclei are pigment, not raised beads or pits; AO stays 1 and total micro-height variation≤0.24 μm. All pixels are opaque metallic-zero/mortar-zero, with a 0.024 m tile and 0.00012 m relief. Tint, repeats, Worker/cache and caller-owned cleanup work as before. No geometry, displacement, transmission or geological growth simulation is added.

Also accepted: `ogeetiles` for interlocking teal glazed lantern tiles with mirrored S sides, pointed ends and continuous lower neutral grout. Use `await ProceduralMaterial.create('ogeetiles', { size: 512, seed: 7, heightMap: true })` and select it in `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. The glaze is genuinely raised; field-based joints are not constant-width Euclidean offsets. All pixels stay opaque metallic-zero, with a 0.72 m tile and 0.004 m relief. Tint leaves full grout neutral; repeats, Worker/cache and caller-owned cleanup work as before. No geometry, displacement, transparent joints, installation or glaze-optics simulation is added.

Also accepted: `bittermelonskin` for green bitter melon rind with uninterrupted gently warped ribs, rounded irregular papillae and connected lower channels. Use `await ProceduralMaterial.create('bittermelonskin', { size: 512, seed: 7, heightMap: true })` and select it in `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. Warts, ribs and channels have distinct real height levels, not sharp durian spikes or netted melon pigment. All pixels stay opaque metallic-zero/mortar-zero, with a 0.18 m tile and 0.0045 m relief. Tint, repeats, Worker/cache and caller-owned cleanup work as before. No fruit geometry, displacement, transparent openings, subsurface scattering or growth simulation is added.

Also accepted: `cocobolo` for polished orange-red heartwood with dark flowing broad grain and fine interleaved streaks. Use `await ProceduralMaterial.create('cocobolo', { size: 512, seed: 7, heightMap: true })` and select it in `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. Grain is pigment, not raised ribs or cracks; total micro-height variation≤0.32 μm and AO stays 1. All pixels remain opaque metallic-zero/mortar-zero, with a 0.24 m tile and 0.00016 m relief. Tint, repeats, Worker/cache and caller-owned cleanup work as before. No geometry, displacement, subsurface scattering, anisotropy shader or wood-growth simulation is added.

Also accepted: `doubleedgerazorblades` for silver double-edge blades with four low corner cutouts, a connected three-lobe center slot and two genuinely lower brighter smoother long honing facets. Use `await ProceduralMaterial.create('doubleedgerazorblades', { size: 512, seed: 7, heightMap: true })` and select it in `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. Factor 1 preserves metallic steel versus nonmetal lower backing/slot floors. All pixels stay opaque/mortar-zero, with a 0.18 m tile and 0.0003 m relief. Tint, repeats, Worker/cache and caller-owned cleanup work as before. No geometry, transparent holes, cutting, collision or mechanical simulation is added.

Also accepted: `chiastolite` for polished brown crystal sections with connected dark graphitic crosses, outward-flaring arms and four warm quadrants. Use `await ProceduralMaterial.create('chiastolite', { size: 512, seed: 7, heightMap: true })` and select it in `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. Crystals/inclusions are pigment on a shared cut plane, not raised blocks or grooves; micro-height variation≤0.24 μm and AO stays 1. All pixels remain opaque metallic-zero/mortar-zero, with a 0.12 m tile and 0.00012 m relief. Tint, repeats, Worker/cache and caller-owned cleanup work as before. No geometry, displacement, transmission or mineral-growth simulation is added.

Also accepted: `dimity` for ivory plain-weave cotton with six paired raised warp ribs among fine yarns. Use `await ProceduralMaterial.create('dimity', { size: 512, seed: 7, heightMap: true })` and select it in `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. Two of every eight warp ends are thick high cords; single-yarn crossings still alternate and continuous weft rises across both. These are real height ribs, not printed stripes. All pixels remain opaque metallic-zero/mortar-zero, with a 0.02 m tile and 0.0003 m relief. Tint, repeats, Worker/cache and caller-owned cleanup work as before. No yarn geometry, transparent weave openings, cloth physics or anisotropy shader is added.

Also accepted: `juniperberries` for rounded blue gray bloomed berries with three lower radial scale seams and a recessed central scar. Use `await ProceduralMaterial.create('juniperberries', { size: 512, seed: 7, heightMap: true })` and select it in `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. The quiet sectors really stand above the seams, not merely painted lines. All pixels remain opaque metallic-zero/mortar-zero, with a 0.064 m tile and 0.006 m relief. Tint, repeats, Worker/cache and caller-owned cleanup work as before. No fruit geometry, translucent flesh, SSS or growth simulation is added.

Also accepted: `gabbro` for polished coarse dark rock interlocking with pale plagioclase grains and fine optical twin bands. Use `await ProceduralMaterial.create('gabbro', { size: 512, seed: 7, heightMap: true })` and select it in `/examples/pbr3d/?renderer=webgpu` or `?renderer=webgl2`. Mineral borders and twins are pigment on a common polished plane, not deep seams; micro-height variation≤0.24 μm and AO stays 1. Optional height remains range-normalized as before and is not a physical height scale. All pixels remain opaque metallic-zero/mortar-zero, with a 0.18 m tile and 0.00012 m relief. Tint, repeats, Worker/cache and caller-owned cleanup work as before. No crystal geometry, displacement, transmission or geological simulation is added.

`turnbuckles` adds nine seeded rotated steel eye-eye tensioners: a closed elongated frame, recessed open center, connected lower threaded rods and closed end rings. Openings remain opaque dark nonmetal backing, not transparency. Mirrored thread grooves have lower height, darker pigment and higher roughness; the metal mask uses factor 1. Tile size is 0.24 m with 0.003 m relief and zero mortar. Optional height, tint, repeats, Worker/cache and ownership are unchanged; no geometry, true holes, displacement or mechanical simulation is added. Create with `await ProceduralMaterial.create('turnbuckles', { size: 512, seed: 7, heightMap: true })` and select it in the PBR gallery.

`rhodochrosite` adds a rose matrix with six wavy broad white laminae and fine companion bands, rather than closed agate rings. Cached 3×3 and 9×3 noise warp a continuous six-period phase; compact squared broad/fine shoulders stay C1. Separate 12² pigment and 128² grain fields retain one polished plane with micro-height variation≤0.24 μm and AO 1. Laminae change pigment/roughness, not carved relief. All pixels remain opaque metallic-zero/mortar-zero, with a 0.18 m tile and 0.00012 m relief. Optional height, tint, repeats, Worker/cache and ownership are unchanged; no crystal geometry, displacement, transmission or geological simulation is added. Create with `await ProceduralMaterial.create('rhodochrosite', { size: 512, seed: 7, heightMap: true })`; select it in the PBR gallery.

`bayleaf` adds nine seeded rotated olive pointed smooth blades, short petioles, raised midribs, seven recurved side-vein pairs and fine marginal veins. Compact blade/stem coverage and smooth squared shoulders stay C1; axis fading removes the absolute-coordinate cusp beneath the midrib. Setup caches four-value poses, seven vein roots and 128² grain. Grain micro-height variation≤6.4 μm stays below 40 μm side veins instead of hiding them. All pixels remain opaque metallic-zero/mortar-zero, with a 0.24 m tile and 0.0016 m relief. Optional height, tint, repeats, Worker/cache and ownership are unchanged; no leaf geometry, transparent cutout, SSS or plant simulation is added. Create with `await ProceduralMaterial.create('bayleaf', { size: 512, seed: 7, heightMap: true })` and select it in the PBR gallery.

`gabardine` adds khaki dense warp-faced two-over-one steep twill. It reuses poplin compact yarn coverage, crossing lift and fiber sampling, but advances a three-crossing draft by one warp per pick on 48 warp×24 weft pitches, giving an approximately 63.4° diagonal rather than plain weave or equal-pitch two-over-two twill. Warp radius/core is 0.495/0.44 versus weft 0.25/0.18. Both yarns use base/crown 0.34/0.04 and ±0.1 lift fading before owner changes. Cached 128² grain and 192/96-frequency fibers require no per-point allocation or trig. All pixels remain opaque metallic-zero/mortar-zero, with a 0.018 m tile and 0.0003 m relief. Optional height, tint, repeats, Worker/cache and ownership are unchanged; no yarn geometry, transparent holes or cloth simulation is added. Create with `await ProceduralMaterial.create('gabardine', { size: 512, seed: 7, heightMap: true })` and select it in the PBR gallery.

`oilspotglaze` adds 64 seeded elliptical iron-oxide spots with brown interiors, brighter annular rims and fine crystalline pigment on glossy black-brown ceramic glaze. Seven cached pose values store cos/sin, two offsets, two inverse squared radii and tone. Maximum radius 0.34 plus jitter 0.1 stays below 0.5; compact spot/rim shoulders vanish C1 before owners change, with no per-point allocation, hash, trig or sqrt. Cached 128² grain supplies one glaze plane with micro-height variation≤0.24 μm; 64² crystal noise changes pigment only and AO stays 1. Bright brown markings remain dielectric, not metal rings. All pixels remain opaque metallic-zero/mortar-zero, with a 0.16 m tile and 0.00012 m relief. Optional height, tint, repeats, Worker/cache and ownership are unchanged; no crystal geometry, displacement, transmission or kiln simulation is added. Create with `await ProceduralMaterial.create('oilspotglaze', { size: 512, seed: 7, heightMap: true })` and select it in the PBR gallery.

`persimmonslice` adds nine seeded rotated orange cut discs with eight separate radial dark seeds, pale centers and thin darker rinds. Following the existing fruit flush-cut contract, seeds/pulp/rind share one cut plane with grain micro-height variation≤8 μm; seeds change pigment and roughness, not open cavities. Setup caches four-value poses, eight axis pairs, 128² grain and inverse squared constants. Radius 0.38 plus jitter 0.025 stays below 0.5; compact smooth disc/rind/pith/seed shoulders remain C1 without per-point allocation, hash, trig or sqrt. All pixels remain opaque metallic-zero/mortar-zero, with a 0.24 m tile and 0.002 m relief. Optional height, tint, repeats, Worker/cache and ownership are unchanged; no fruit geometry, transparent pulp, SSS or growth simulation is added. Create with `await ProceduralMaterial.create('persimmonslice', { size: 512, seed: 7, heightMap: true })` and select it in the PBR gallery.

`kitkattiles` adds 24 columns×4 rows of stacked jade narrow finger tiles with 6:1 pitch, genuinely concave longitudinal glaze troughs and equal-UV-width neutral gray grout. Unlike convex wood slats or flat subway tiles, trough centers sit 0.48 mm below both shoulders and fade at each end. Four compact smooth face edges follow subwaytiles; mortar is 1-face. Cached 96 owner tones and 128² grain require no per-point allocation, hash, trig or sqrt; grain micro-height variation≤6 μm. All pixels remain opaque metallic-zero, with a 0.6 m tile and 0.003 m relief. Optional height, tint, repeats, Worker/cache and ownership are unchanged; no geometry, displacement, transparency or tile-layout simulation is added. Create with `await ProceduralMaterial.create('kitkattiles', { size: 512, seed: 7, heightMap: true })` and select it in the PBR gallery.

`brakediscs` adds nine seeded rotated silver disc faces with a central bore, five mounting holes, two half-step-staggered rings of twelve ventilation holes, raised center hubs and fine concentric wear. Holes and exterior remain opaque dark metallic-zero backing; the steel mask uses factor 1. Squared annular faces and compact hole shoulders follow bearing conventions. Setup caches two-value poses, 29 three-value hole records and 128² grain; no per-point allocation, hash, trig or sqrt is added. Compact periodic wear in squared radius avoids center singularities and is only 4 μm deep, not coarse carved grooves. Mortar stays zero; tile size is 0.72 m with 0.004 m relief. Optional height, tint, repeats, Worker/cache and ownership are unchanged; no geometry, transparent holes, displacement or brake physics is added. Create with `await ProceduralMaterial.create('brakediscs', { size: 512, seed: 7, heightMap: true })` and select it in the PBR gallery.

`mulberrypaper` adds warm cream cloudy pulp with 192 randomly oriented long curved bast fibers and occasional tan inclusions, not woven strips or folded paper. Following compact paper-fiber neighborhood sampling, separate light/dark complement unions bound intersecting fibers without additive height spikes. Eight cached values per fiber, three fibers per 8×8 cell and fixed 3×3 lookup require no per-point allocation, hash, trig or sqrt. Maximum half-length 0.9, bend≤0.04 and width≤0.03 give support<0.942; omitted cells start at distance 1.15, so fibers vanish C1 before owners change. Squared axial envelopes and side caps taper both tips. Fiber lift≤7 μm and total micro-height variation≤13.6 μm retain AO 1. All pixels remain opaque metallic-zero/mortar-zero, with a 0.16 m tile and 0.0002 m relief. Optional height, tint, repeats, Worker/cache and ownership are unchanged; no fiber geometry, translucent paper, SSS or papermaking simulation is added. Create with `await ProceduralMaterial.create('mulberrypaper', { size: 512, seed: 7, heightMap: true })` and select it in the PBR gallery.

`howlite` adds ivory mineral blocks separated by fine irregular gray matrix veins. Two cached site values per 12×12 cell and paired periodic 4² warp fields distort the network. Normalized overlap of compact eighth-power radial weights in a fixed 3×3 neighborhood replaces nearest-site switching; the gray veins are not carved grooves. Support1.2 vanishes C1 before omitted sites at distance1.3, while global coverage prevents division by zero. No per-point allocation, hash, trig or sqrt. A common polished plane has only ≤0.2 μm grain relief and AO1; matrix veins affect color and roughness only. A 0.24 m tile/0.0001 m relief retains opaque M0/mortar0 and existing options/Worker/cache/ownership; no geometry, transparent cracks, displacement or mineral simulation.

`ottoman` adds purple transverse ribs made of paired coarse weft picks bound by fine warps, with recessed inter-rib gaps. It reuses poplin/gabardine compact yarn coverage, fading lift and fiber sampling: 48 warps/24 wefts share one draft across two consecutive picks, reverse on the next pair and alternate on adjacent warps. Each pair shifts inward by 0.1 pitch, giving 0.8 within-pair and 1.2 between-pair spacing. Weft support0.38 and lift half0.36 vanish C1 before the nearest owner boundary at0.4. Lift0.18 puts over-yarn above under-yarn at crossings; elevated coarse weft base/crown forms the transverse ribs. A 0.024 m tile/0.0004 m relief retains opaque M0/mortar0 and existing options/Worker/cache/ownership; no geometry, transparent yarn gaps, anisotropy or cloth simulation.

`shackles` adds nine seeded rotated silver U-bow shackles with rounded tubing, two enlarged end bosses, one raised cross-pin and a drilled flattened pin tab. It reuses isolated hardware pose caching, compact unions and normalized height to avoid double thickness at joints. A continuous nearest-curve distance joins the upper semicircle to two straight legs, using one necessary hypot per point and no per-point allocation, hash or trig. All supports including jitter remain inside tile owners; bow, bosses, pin, tab and hole are C1. The center and tab hole are opaque M0 dark backing, with metal face masks multiplied by factor1 and mortar0. A 0.6 m tile/0.004 m relief retains existing options/Worker/cache/ownership; no geometry, transparent holes, displacement, screw operation or load-bearing physics.

`watercaltrops` adds nine seeded rotated black-brown rounded shells with two symmetric upward-curved tapered horns, fine longitudinal wrinkles and a low stem scar. It reuses rambutanskin compact curved tapered supports and isolated pose caching, but joins paired thick horns to a central shell. Smooth centerline bending, finite tip width and C1 root/tip fades combine with bounded union/normalized relief to avoid root height spikes. Conservative support radius<0.465 remains below0.5 including jitter; no per-point allocation, hash, trig or sqrt. A 0.24 m tile/0.003 m relief retains opaque M0/mortar0 and existing height/tint/repeats/Worker/cache/ownership; no geometry, transparent backing, displacement or plant-growth simulation.

`fluorite` adds nine seeded rotated purple crystal faces with nested nearly square growth-color zones in a pale mineral matrix, not circular agate rings or raised square tiles. It reuses isolated crystal poses and a common polished mineral plane with six cached values per crystal. Eighth-power polynomial contours avoid max-axis derivative cusps; four polynomial zoning periods remain C1 at phase wraps. Maximum half-extent0.335 gives support radius<0.435, below0.5 including jitter; no per-point allocation, hash, trig or sqrt. Zones affect color/roughness only, with ≤0.2 μm grain variation, AO1 and opaque M0/mortar0 on one polished plane. A 0.06 m tile/0.0001 m relief retains existing options/Worker/cache/ownership; no geometry, transparency/refraction, fluorescence, displacement or crystal-growth simulation.

`wenge` adds dark straight wood grain, pale longitudinal parenchyma bands and 192 elongated open vessel pores, not recolored generic grain or raised cloth ribs. It reuses compact wood-pore and cached longitudinal-noise sampling: four cached values per 24×8 pore, half-width0.035–0.055 and half-length0.15–0.35 vanish C1 inside their owners. Three cached noise fields need no per-point allocation, hash, trig or sqrt. Vessel pores are genuinely32 μm lower, rougher and more occluded; pale bands affect pigment only, with ≤1.2 μm grain variation. A 0.12 m tile/0.0004 m relief retains opaque M0/mortar0 and existing options/height/tint/repeats/Worker/cache/ownership; no geometry, transparent holes, displacement, anisotropy or wood-growth simulation.

`parchment` adds cream cloudy writing skin, fine longitudinal scraped color marks and 256 randomly oriented shallow residual follicles, not coarse pebbled leather or pulp fibers. It reuses compact elliptical pores and cached noise with six values per 16×16 follicle. Maximum support0.08 vanishes before the nearest owner boundary at0.2; no per-point allocation, hash, trig or sqrt. Scraping affects pigment without deep grooves; follicles are2.4 μm lower, cloudy skin variation≤3 μm plus grain≤0.4 μm retains AO≥0.96. A 0.04 m tile/0.0002 m relief retains opaque M0/mortar0 and existing options/height/tint/repeats/Worker/cache/ownership; no geometry, transparency/transmission, displacement, text or parchment-making simulation.

`cavalrytwill` adds olive paired broad/narrow steep diagonal wales. It reuses poplin/gabardine/ottoman compact yarn coverage, lift and fiber sampling: 72 warps/36 wefts form an approximately63.4° slope. A six-step warp-face110100 draft creates two unequal-width wales, advancing one warp per row; this is a surface pattern, not certification of a historical weaving specification. Warp/weft radii0.495/0.25 and cores0.44/0.18 retain C1 lift fading before ownership boundaries, with no per-point allocation, hash, trig or sqrt. A 0.024 m tile/0.0003 m relief retains opaque M0/mortar0 and existing options/height/tint/repeats/Worker/cache/ownership; no geometry, transparent yarn gaps, anisotropy or cloth simulation.

`screwhooks` adds nine silver open ring hooks connected to tapered threaded shanks. Compact C1 annulus and thread-phase masks leave the open mouths, ring cavities and background opaque nonmetal recesses; steel uses metallic factor1. Approximately0.00016 UV-height thread grooves darken pigment/occlusion and raise roughness. A positive tip-distance width factor avoids terminal floating-point cancellation/division by zero; normalized overlaps avoid doubled height. The0.36 m reference tile/0.004 UV relief reuses existing options, Worker, cache and ownership without per-point allocation, hash, trigonometry or square roots. No geometry, transparent openings, screw mating or physics simulation is added.

`nigellaseeds` adds25 randomly rotated charcoal seeds with elongated three-sided angular coats, rather than round grains or tall-ribbed buckwheat hulls. Products of compact C1 halfplanes use aspect0.9/1.15: support≤0.368 plus jitter0.015 stays inside the0.5 owner. Five cached values per seed and128² grain/256² pore fields produce0.0009375 UV-height recessed pits (22.5μm only at the0.024 m reference scale, not measured displacement) that darken pigment/occlusion and raise roughness without piling particles at edges. Opaque metallic0/mortar0 maps use a0.024 m reference tile/0.0375 UV relief and existing options, Worker, cache and ownership; no per-point allocation, hash, trigonometry, square roots, geometry, transparent holes or biological simulation.

`phyllite` adds 48 fine wavy foliation ridges and satin mica flecks to gray-green rock, not slate terraces or broad gneiss bands. Cached 4² warp and 128² grain/mica fields drive compact C1 periodic ridges without per-point allocation, hash, trigonometry or square roots. Mica changes pigment and lowers roughness, without extra height or metallic response. A 0.18 m reference tile uses 0.018 UV relief; ridge contrast is 0.00117 UV (about 210.6μm only at that reference scale, not measured displacement). Opaque metallic0/mortar0 maps retain options, Worker, cache and ownership, without geometry, displacement, anisotropy, interference colors or geological simulation.

`shantung` adds warm ivory 64-warp/32-weft 1/1 plain weave with 96 irregular raised weft slubs. It reuses the compact yarn/lift path of poplin, gabardine, Ottoman and cavalry twill; each of three segments per weft caches its center, inverse squared half-length and strength. C1 slubs thicken and widen the weft radius from0.22 up to0.37 (core0.15 up to0.28), staying inside the0.5 owner. Warp-over crossings occlude the slubs; lift fades before ownership changes. A 0.024 m reference tile/0.018 UV relief keeps opaque metallic0/mortar0 maps and existing options, Worker, cache and ownership. No per-point allocation, hash, trigonometry, square roots, geometry, transparent yarn gaps, anisotropy or cloth simulation.

`hempcrete` adds a pale porous mineral binder with 144 embedded brown fibrous hemp shivs, rather than overlapping OSB flakes. Seven cached values per shiv drive compact x⁸+y⁴ rounded strips, with 128² grain/96² pore fields. Maximum support about0.391 plus jitter0.03 stays within the0.5 owner; no per-point allocation, hash, trigonometry or square roots. Shiv coats stay nearly flush without piled height or binder pores drilling through them. Pores recess by at most0.0036 UV. A 0.24 m reference tile/0.015 UV relief corresponds to at most0.864 mm pore depth only at that reference scale, not measured displacement. Opaque metallic0/mortar0 maps retain options, Worker, cache and ownership without geometry, transparent holes, physics or structural/thermal certification.

`utilityblades` adds nine silver trapezoid blade faces with two open mounting notches in the short back edge and only one honed longer lower edge, not double-edge razors. Four compact C1 linear halfplanes and two notch masks use five cached values per blade; support about0.404 plus jitter0.008 stays inside the0.5 owner without per-point allocation, hash, trigonometry or square roots. Steel uses metallic factor1 while notches/background are opaque metallic0 recesses with mortar0. A 0.24 m reference tile/0.004 UV relief gives a0.00052 UV hone height contrast (124.8μm only at that reference scale, not measured displacement). Existing options, Worker, cache and ownership remain; no geometry, transparent cuts, cutting or mechanical simulation.

`chrysocolla` adds 36 turquoise clusters containing 108 joined rounded nodules over a dark green matrix, not metallic botryoidal copper or polished growth bands. Eight cached values per cluster and 128² grain/64² pigment fields drive three compact C1 circular faces; normalized dome averaging retains saddles without adding overlapping heights. Support at most 0.38 plus jitter 0.025 stays inside the 0.5 owner without per-point allocation, hash, trigonometry or square roots. A 0.12 m reference tile/0.012 UV relief retains opaque metallic factor 0/mortar 0 maps, options, Worker, cache and ownership without geometry, displacement, transmission, metallic optics or chemical/geological simulation.

`sichuanpepperhusks` adds 49 rough reddish-brown empty pericarps with compact C1 squared-distance ring walls, continuously warped irregular contours and an outward split; opposite attachment scars are lower, darker and rougher, unlike whole peppercorns or transparent holes. Six cached pose values per husk and 128² grain/40² wrinkle fields keep support at most 0.385 plus jitter 0.03 inside the 0.5 owner without per-point allocation, hash, trigonometry or square roots. A 0.05 m reference tile/0.015 UV relief gives pore depth 0.000825 UV and scar depth 0.0024 UV (41.25μm and 120μm by reference scale only, not measured displacement). Opaque metallic factor 0/mortar 0 maps retain options, Worker, cache and ownership without geometry, transparent cutouts, plant growth or chemical simulation.

`huckaback` adds 40×40 warp/weft yarns with a 10×10 draft and 32 diagonally alternating pairs of five-pick warp floats (64 long floats), not waffle pits or five disconnected crossing beads. It reuses the formal cloth sampler; this preset still allocates 600 Float64 values/4800 bytes for whole equal-draft-run offsets, squared half-spans and inverse shoulders. Long floats stay continuous across intermediate owners and fade C1 at run ends; Lyocell and Hopsack each reuse the same whole-run profile builder with 96 values, while the other pre-existing members of this cloth family still allocate no whole-run profile buffer. A 128² grain field and 160×160 fiber periods need no per-point allocation, hash, trigonometry or square roots. A 0.032 m reference tile/0.022 UV relief gives one-sided lift 0.00308 UV (98.56μm by reference scale only, not measured displacement). Opaque metallic factor 0/mortar 0 maps retain options, Worker, cache and ownership without yarn geometry, pile loops, transmission, water absorption or anisotropic optics.

`anorthosite` adds a polished cut dominated by pale gray plagioclase grains, sparse dark accessories and grain-local parallel twin-albedo lamellae, reusing the formal gabbro grain sampler rather than a mafic matrix or raised mineral tiles. Six cached values for each of 100 sites and a 128² grain field drive normalized sixteenth-power compact weights over a 3×3 neighborhood. Radius 1.2 stays below omitted-site distance 1.3; own-site squared distance at most 0.98 keeps weight positive without per-point allocation, hash, trigonometry or square roots. A 0.2 m reference tile/0.004 UV relief limits micrograin height span to 0.000008 UV (1.6μm by reference scale only, not measured displacement); twins and grain boundaries share one flat cut plane. Opaque metallic factor 0/AO 1/mortar 0 maps retain options, Worker, cache and ownership without geometry, transmission, Schiller/birefringent optics, geological simulation or certified mineral proportions.

`cubebberries` adds 64 dark brown wrinkled pepper berries with connected narrow woody pedicels, not stalkless peppercorns or detached tails. A compact C1 ellipse covers the capsule pedicel root with bounded coverage; at full berry coverage the berry owns neck height rather than adding or averaging both complete layer heights. Six cached pose values per berry and 128² grain/64² wrinkle fields keep per-axis support at most 0.468×0.98 plus jitter 0.025 = 0.48364 inside the 0.5 owner without per-point allocation, hash, trigonometry or square roots. A 0.08 m reference tile/0.04 UV relief gives wrinkle height 0.0022 UV/pore depth 0.0012 UV (176μm/96μm by reference scale only, not measured displacement). The berry is rougher than its woody tail; opaque metallic factor 0/mortar 0 maps retain options, Worker, cache and ownership without geometry, transmission, botanical or chemical simulation.

`seraphinite` provides a procedural polished deep-green face with pale curved mineral feather bands: 16 bundles vary in orientation, length, width and frequency and overlap through a periodic 3×3 neighborhood rather than being clipped into owner-local leaf stickers. Nine cached values per bundle use 144 Float64 values / 1152 bytes, with 8² matrix / 12² warp / 128² grain fields and no per-sample allocation, hash, trig or sqrt. It reuses the existing feather-axis fade and mineral-neighborhood patterns: C1 axis fading removes the absolute-distance cusp, squared-distance fine veins vanish before phase wraps, and maximum support 1.1 stays below the nearest omitted site at 1.3. The 0.16 m reference tile and 0.006 UV relief bound cut-face micrograin height variation to 0.000012 UV (1.92 μm at the reference scale, not displacement or a device measurement). Mineral feathers affect albedo, not raised leaf geometry. All maps remain opaque M0 / AO1 / mortar0 with unchanged options, Worker, cache and ownership; no geometry, transmission, directional chatoyancy, Schiller or anisotropic optical simulation is added.

`hexsocketheads` provides 25 seed-rotated round steel bolt heads with blind, flat-bottomed six-flat hex sockets. It reuses the existing round-head support and hex half-plane patterns: three paired C1 half-plane profiles multiply to retain six flats, six extended corners and smooth bevels without a max-distance corner crease. Five cached pose values per head use 125 Float64 values / 1000 bytes, a 128² grain field and a fixed hex constant evaluated at initialization; no per-sample allocation, hash, trig or sqrt is added. Cap support 0.38 plus jitter 0.025 is 0.405, below owner half-width 0.5; socket corner radius about 0.207846 stays inside the full top-face radius 0.33. The 0.18 m reference tile and 0.03 UV relief give nominal recess depth 0.0126 UV and bound flat-floor micrograin variation to 0.00006 UV (2.268 mm and 10.8 μm at the reference scale, not displacement or device measurements). The blind floor remains M1 above neutral M0 backing, blending between top and floor rather than cutting through the backing. All pixels are opaque; mortar is one minus cap coverage, and default `createMaterial()` metallic factor 1 preserves the regional metal map. Options, Worker, cache and ownership stay unchanged; no geometry, shaft, screw thread, physical perforation or load certification is added.

`datepits` provides 25 elongated tan date stones with raised cheeks and a finite curved longitudinal furrow. It reuses cached seed poses and closed squared-distance support: a finite polynomial bow offsets the ellipse, and the groove fades C1 before both tips without per-sample allocation, hash, trig, sqrt or division by a vanishing tip width. The furrow is not a coffee-bean split or a through-hole. Five cached values per pit use 125 Float64 values / 1000 bytes and a 128² grain field; conservative rotated support about 0.431937 plus per-axis jitter 0.025 remains below owner half-width 0.5. The 0.08 m reference tile and 0.025 UV relief give nominal furrow depth 0.00475 UV and micrograin height span 0.0003 UV (380 μm and 24 μm at the reference scale, not displacement or device measurements). The darker, rougher, lower-AO groove floor remains above the background and both tips stay closed. All pixels are opaque M0 / mortar0 with unchanged options, Worker, cache and ownership; no geometry, botanical, food or chemical simulation is added.

`sapele` provides a reddish-brown quartersawn ribbon-figure approximation with broad light/dark longitudinal bands and fine shallow open vessels, directly reusing the production wenge sampler rather than adding a duplicate branch. Four cached values for each of 320 pores use 1280 Float64 values / 10240 bytes, with 3×4 warp / 64×4 fiber / 128² grain fields. Seven broad C1 squared-distance bands and compact elongated pore supports remain UV-periodic: maximum x support 0.044 plus site maximum 0.75 and maximum y support 0.26 plus site maximum 0.6 both stay below owner edge 1. No per-sample allocation, hash, trig or sqrt is added. The 0.3 m reference tile and 0.002 UV relief give pore depth 0.00016 UV and flat-face micrograin height span 0.000006 UV (48 μm and 1.8 μm at the reference scale, not displacement or device measurements). Broad wood ribbons affect albedo, not raised ribs; fine vessels are genuine shallow depressions with higher roughness and lower AO. All pixels are opaque M0 / mortar0, with unchanged options, Worker, cache and ownership and no geometry, tree growth, anisotropic or chatoyant optical simulation; the preset represents fixed ribbon color rather than certified moving reflections.

Added `chambray`, a blue-dyed-warp / white-weft balanced 1/1 plain weave with 32×32 equal-width yarns and alternating exposure at every crossing, not denim twill or a float draft. It reuses the production poplin sampler with equal 0.42 supports / 0.3 cores, 0.34 bases / 0.04 crowns and C1 crossing lifts; only chambray selects warp tone 0.18 and weft tone 0.92, leaving previous cloth calculations unchanged. It uses the shared 128² grain / 128-directional fiber profiles, no extra pose or draft cache and no new per-sample allocation. A 0.016 m reference tile and 0.012 UV relief give 0.00168 UV crossing lift (26.88μm when converted using the reference scale, not displacement or a device measurement). Opaque nonmetal / mortar0; options, Worker, cache and ownership contracts are unchanged. Equal-height yarns are not poplin ribs; cloth dynamics and anisotropic optics are not implemented.

Added `nephrite`, an opaque polished-nephrite approximation with muted mottled greens and fine interlocking mineral color. A 6² cloud, two 4² warp lattices, 96×8 / 8×96 axial and 64×8 integer-diagonal fiber lattices use a 0.07 UV warp and C1 threshold blends; 128² grain retains a flat micro-polish. Mineral color does not form raised yarns, separated coarse grains or recessed cracks: AO1, opaque nonmetal / mortar0. Translucency, subsurface scattering, jade toughness and anisotropic optics are not simulated. Seeded lattices are cached once, with no per-sample allocation / hash / trig / sqrt; integer diagonal coordinates and periodic warps preserve signed UV tiling. A 0.16 m reference tile / 0.003 UV relief gives a 0.000006 UV micrograin height span (0.96μm when converted using the reference scale, not geometry, displacement or a device measurement). Existing options, Worker, cache and ownership contracts are unchanged.

Added `diorite`, a polished salt-and-pepper coarse-stone approximation with 256 jittered mineral sites, abundant pale plagioclase-like color and substantial dark mafic color. The 0.35 pale threshold assigns seeded pigment classes, not geological volume fractions. It directly reuses the production gabbro / anorthosite sampler: normalized compact cap¹⁶ weights in a 3×3 neighborhood, six cached values per site (1536 Float64 values / 12288 bytes) and 128² grain. Radius1.2 vanishes before omitted sites can approach within1.3; the own site has squared distance at most0.98, keeping the denominator positive. Grain-local ten-cycle twin lamellae affect albedo only, not the polished cut plane. A 0.16 m reference tile / 0.004 UV relief gives a 0.000008 UV micrograin span (1.28μm at the reference scale, not geometry, displacement or a device measurement). Opaque nonmetal / AO1 / mortar0, no per-sample allocation / hash / trig / sqrt; options, Worker, cache and ownership remain unchanged. Mineral composition and anisotropic optics are not simulated.

Added `carawayseeds`, 64 narrow brown crescent-shaped caraway fruits with five paler converging longitudinal ridges. Bend0.16 exceeds halfWidth0.065; finite polynomial taper closes the pointed tips without dividing by a vanishing width. It reuses the production fennelseeds sampler, with five cached pose values per fruit (320 Float64 values / 2560 bytes) and 96² grain, no per-sample allocation / hash / trig / sqrt. Conservative rotated support sqrt((0.16+0.065)²+0.38²)+0.025 is about0.4666, below the owner half-width0.5, preserving seeded signed UV tiling. A 0.04 m reference tile / 0.02 UV relief gives nominal length0.0038 m and rib lift0.0011 UV (44μm at the reference scale, not geometry, displacement or a device measurement). Opaque nonmetal / mortar0, unchanged options, Worker, cache and ownership. These fruits are commonly called seeds; plant growth and transparent gaps are not simulated.

Added `springpinends`, 36 randomly oriented slotted hollow steel tube end faces: one flat C-shaped wall around a low opaque bore with a single narrow slot continuously connecting the bore to the exterior. It is not a twin-lug retaining circlip or a blind socket. Existing cached-pose and compact squared-annulus / C1-slot patterns blend inner and outer bevels with the slot by products, avoiding angular seams or nearest-edge creases. Five values per end use 180 Float64 values / 1440 bytes plus 128² grain; no per-sample allocation / hash / trig / sqrt. Outer radius 0.36 plus jitter 0.025 remains below owner half-width 0.5. A 6×6 layout preserves visible wall samples at the supported 32² minimum map size, unlike the initially aliased 8×8 draft. A 0.064 m reference tile / 0.03 UV relief gives a 0.00006 UV face micrograin span (3.84μm at the reference scale, not displacement or a device measurement). Metal-1 walls and metal-0 backing blend continuously with mortar 1-face; the facade metallic factor is 1. Everything remains opaque: bores and slots are not transparent geometry. Press-fit deformation and elasticity are not simulated; options, Worker, cache and ownership remain unchanged.

Added `rhyolite`, a pink-brown fine-groundmass flow-banded stone approximation with 14 periodic curved pigment bands and sparse pale phenocrysts. It directly reuses the production porphyry sampler and polished cut-plane contract: 256 potential rotated crystal sites, six values per site (1536 Float64 values / 12288 bytes) and 96² grain. Only rhyolite allocates a 3² flow-warp lattice, with 0.6 phase warp and squared-distance C1 shoulders; squared radius and inverse shoulder are computed once per sampler. Maximum crystal support sqrt(0.14²+0.06²), about 0.1524, remains below the nearest owner-boundary distance 0.35; absent crystals leave no ghost mask. CrystalChance 0.25 is a seeded procedural assignment, not a geological fraction. Both matrix bands and brighter, smoother crystals remain flush rather than raising the cut plane. A 0.12 m reference tile / 0.0005 UV relief gives a 0.0000075 UV micrograin span (0.9μm at the reference scale, not geometry, displacement or a device measurement). Opaque nonmetal / mortar0, no per-sample allocation / hash / trig / sqrt. Existing porphyry allocates no flow lattice and retains its original calculations; options, Worker, cache and ownership are unchanged. Lava dynamics, mineral composition and optical certification are not implemented.

Added `tonkabeans`, 64 randomly rotated, slightly curved, closed elongated dark-brown to near-black seeds with irregular meandering longitudinal recessed drying-fold approximations and fine skin grain. These are not single-furrow date pits or stalked round cubeb berries. Existing isolated owner-cell pose, squared elliptical body and C1 shoulder patterns use five values per seed (320 Float64 values / 2560 bytes), cached 40×6 wrinkle and 3×6 warp lattices and 128² grain. Conservative support sqrt(0.36²+(0.16+0.02)²)+0.015, about 0.4175, stays below the owner half-width 0.5. Folds are simultaneously darker, lower, rougher and more occluded rather than painted-on grooves; both ends remain closed, with no cut kernel. A 0.20 m reference tile / 0.0275 UV relief gives an 18 mm nominal length and 8 mm width; wrinkleDepth 0.12 is 0.0033 UV (0.66 mm at the reference scale, not geometry, displacement or a device measurement), with a 27.5μm reference micrograin span. Opaque nonmetal / mortar0, no per-sample allocation / hash / trig / sqrt. Existing options, Worker, cache and ownership are unchanged; drying dynamics, interiors and chemical or culinary uses are not implemented.

Added `pentalobescrewheads`, 36 randomly oriented flat steel screw heads with five rounded connected blind-socket lobes and a flat steel floor, without a center security post; not the existing six-lobed starsocketbolts. Existing isolated owner-cell cached-pose, compact squared-profile and C1 product-union patterns use 180 Float64 pose values / 1440 bytes, ten Float64 lobe-center offsets / 80 bytes and 128² grain. All sin/cos runs only during sampler creation; local axes rotate only after a pixel hits a head, with no per-sample allocation / hash / trig / sqrt. Head support 0.37 + jitter 0.025 = 0.395 stays below the owner half-width 0.5; socket support 0.19 is inside the flat head core 0.35. The central floor connects all five lobes without nearest-arc creases. A 0.048 m reference tile / 0.03 UV relief gives a 5.92 mm nominal head diameter, 0.012 UV socket depth (0.576 mm at the reference scale) and 2.88μm reference micrograin span: not geometry, displacement, device measurements or P2/P5/P6 size and tool-fit certification. Steel heads and blind floors are M1 above M0 backing, mortar1-face, with facade metallic factor1. Opaque, not a transparent through-hole; options, Worker, cache and ownership are unchanged, with no fastening mechanics, tool or product-specific capability.

Added `padauk`, selecting warm red-orange straight African-padauk face grain with coarser, sparser longitudinal open vessels and 18 subtle low-contrast pigment bands, rather than seven broad reddish-brown sapele ribbons or dark wenge. It directly reuses their production sampler: 128 potential four-value pore sites (512 Float64 values / 4096 bytes), selected with seeded poreChance 0.65; unoccupied sites use zero inverse length and leave their whole owner pore-free. Longitudinal centers span 0.3–0.7 to avoid uniformly punched rows, with cached 3×4 warp, 64×4 fiber and 128² grain. Maximum half-width 0.055 is below the shortest site-to-x-boundary distance 0.25; maximum half-length 0.27 stays below the y-boundary distance 0.3. New preset bandContrast 0.09 is selected once per sampler; the two existing woods retain 0.3 and their original calculations. No extra noise field or per-sample allocation / hash / trig / sqrt. Bands remain coplanar pigment, while actual vessel recesses are darker, lower, rougher and more occluded. A 0.16 m reference tile / 0.002 UV relief gives poreDepth 0.12 = 0.00024 UV (38.4μm at the reference scale, not geometry, displacement or a device measurement), with a 0.96μm reference micrograin span. Opaque nonmetal / mortar0; options, Worker, cache and ownership are unchanged. Natural aging, UV fluorescence and wood mechanics are not implemented; procedural pore counts are not botanical measurements.

`cottonflannel` approximates solid brushed cotton flannel over a plain-woven ground; it does not define all flannel as cotton or plain weave. It directly reuses the balanced 32×32 one-over-one yarn support/lift core. Continuous short nap conceals 94% of the ground color and leaves only 4% of its height, bridging the former weave gaps rather than exposing open mesh, leather pores, or upright velvet pile. Only this kind adds cached 5×5 brush and 96×32 nap fields (3,097 Float64 values / 24,776 B); a small periodic warp creates directional short-grain variation without hard edges, reusing the existing 128×128 grain field with no per-point allocation, hashing, trigonometry, or square roots. Its 0.024 m reference tile and 0.01 UV relief give the main nap field a theoretical 0.001 UV height span (24μm at that reference scale), with a 4.8μm reference cloud span—not measured fiber length, geometry displacement, or a microscopic scan. The surface stays opaque, nonmetallic, mortar-free, highly rough, and softly occluded even over ground gaps, preserving existing options, Worker, cache, and ownership contracts without individual hair geometry, view-dependent fuzz BRDF, or cloth simulation.

`pinolith` approximates grey-included pale pointed magnesite lenses in a polished dark matrix, not carved rice or simulated mineral growth. A C1 intersection of offset ellipses, variable axes/offsets and periodic cloud warp creates varied kernels: 500 nine-value crystal poses occupy 4,500 Float64 values / 36,000 B. Each wrapped 3×3 neighborhood has a precomputed canonical opacity order in 4,500 Uint16 entries / 9,000 B, so an upper crystal hides buried outlines instead of tracing every black rim like transparent leaves; point sampling does not sort, allocate, hash, use trigonometry, or take square roots. Cached conservative per-crystal radii stay below 0.903 while omitted owners start at distance 1.1, with cached 32² cloud and 128² grain fields. A 0.1 m reference tile and 0.001 UV relief keep crystals and rims on one cut plane; only grain has a theoretical 0.000003 UV height span (0.3μm at the reference scale), not geometry displacement, a microscopic scan, or measured crystal dimensions. It remains opaque, nonmetallic, mortar-free and AO1, preserving options, Worker, cache and ownership without refraction, actual cleavage, or rock physics.

`tripointscrewheads` approximates 36 independently seeded rotated round steel screw heads, each with three straight round-ended blind channels meeting at the center at 120 degrees, not offset Tri-Wing slots or a center post. It directly shares the pentalobe head/backing core; squared-segment distances with bounded C1 product union join all three channels into one flat floor. The 180 Float64 head-pose values / 1,440 B and six Float64 unit-axis values / 48 B are prepared once with cached 128² grain. The surface sampler needs no per-point allocation, hashing, trigonometry or square roots. The maximum channel support radius 0.3 is inside the full head radius 0.35, and head radius plus jitter 0.395 stays inside the owner half-width 0.5. Both head and blind floor are M1 over M0 low backing, with facade metallic factor 1 and mortar equal to 1 minus face rather than the socket mask. Opaque maps and existing options/Worker/cache/ownership remain unchanged. The 0.048 m reference tile and 0.03 UV relief give a 0.012 UV recess depth, equivalent to 0.576 mm at that reference scale; the theoretical grain span is 0.00006 UV, equivalent to 2.88 μm. This is shading/normal mapping only, not threads or driver geometry, dimensional Y00 fit, standards certification, torque or tamper-resistance performance.

`septarian` approximates a polished interior crop with warm grey-brown host polygons, brown linings and pale cream calcite-filled fractures, not carved open gaps or a complete round concretion. Its 36 periodic site triples occupy 108 Float64 values / 864 B. Preparation clips 48 candidate half-planes from a 7×7 neighborhood with reusable 52-vertex scratch buffers and retains only active normalized Voronoi facets. The three measured seeds each have 216 facets / 648 Float64 values; that measured count is not a new all-seed contract. Point sampling uses 5×5 candidates with a covering-radius cull: the radius is below 1.344, omitted owners start at 2.05, and omitted neighboring sites start at 3.1, beyond twice that radius. Cached 3² cloud, 12² fine fracture warp and 128² grain fields keep a conservative warp-perturbation Jacobian infinity-norm bound of 0.63 below 1. Variable-width pale fill and brown linings use C1 products of actual facet shoulders rather than nearest-plane switches, with no per-point surface-sampler allocation, hashing, trigonometry or square roots. The 0.12 m reference tile / 0.001 UV relief keeps all mineral phases coplanar; only grain spans a theoretical 0.000003 UV, equivalent to 0.36 μm at that reference scale. Opaque M0/mortar0/AO1 maps keep all mineral pigments tintable with existing options/Worker/cache/ownership; no geometry, transparent cavities, mineral-growth simulation or universal composition certification is added.

`squaresocketheads` has 25 independently seeded rotated round steel heads with four-flat blind square recesses, directly sharing the established hexsocketheads head/backing core. Two paired absolute-half-plane shoulders multiply to keep corners C1, not max-distance creases, six-flat drives or round holes; the old hex retains its left-associated three-mask multiplication order. The 125 Float64 pose values / 1,000 B and cached 128² grain are prepared once without an extra square-axis table or per-point surface-sampler allocation, hashing, trigonometry or square roots. The square support radius about 0.25456 stays within the full head radius 0.33, and head radius plus jitter 0.405 stays within the owner half-width 0.5. Head and nearly planar blind floor are M1 over M0 low backing, with facade metallic factor 1, mortar equal to 1 minus face rather than the socket mask, and opaque maps. A 0.06 m reference tile / 0.03 UV relief gives a nominal 0.0126 UV head-to-floor depth, equivalent to 0.756 mm at that reference scale; the floor-grain theoretical span is 0.00006 UV, equivalent to 3.6 μm. Existing options/Worker/cache/ownership remain unchanged. This is shading/normal mapping only, not certified Robertson or driver-size fit, physical taper, threads or cam-out performance.

`bronzite` approximates a selected polished dark-brown stone face with differently oriented fine bronze striations lighting only in localized flecks. Dark grain and bright flecks share one level cut—not globally aligned engraving, blue-grey Pietersite, metallic ore or raised gold leaf. It reuses the irregular five-half-plane fragment leaf and old Pietersite arithmetic order; only the new kind adds a 96² C1 fleck gate, sampled once per point outside the neighbor loop. This is fixed pigment resembling one illumination snapshot, not view-dependent schiller/chatoyancy or an optical model. Four hundred 23-value fragment owners plus 5×7 cloud, 128² grain and 96² flecks retain 34,835 Float64 values / 278,680 bytes of tables, not total RAM. Seeded poses, trigonometry and support are cached in the constructor; points allocate nothing and use no hashes, trigonometry or square roots. The 3×3 neighborhood and circle cull have a conservative support bound about 1.224216 below the nearest omitted owner distance 1.25; five multiplied C1 shoulders and periodic fields preserve signed continuity. The authored 0.12 m nominal tile and 0.0008 UV relief are references, not metre-valued geometry displacement. Pigment never engraves height; AO one, metallic/mortar zero, opaque channels and near-flat normals agree. Optional height, tint/Worker/cache/repeats and ownership remain unchanged. No photograph scan, real geometry, dynamic sheen, transmission or mineral/species, locality, treatment, hardness, value or healing certification is supplied.

`pietersite` is a stylized polished cut of blue-grey and golden-brown cemented fibrous angular fragments, not globally parallel tiger-eye bands, metallic pigment or excavated cracks. Each of 36 irregular five-half-plane clasts has its own fiber direction, curved bands/fine fibers and blue/gold phase; 23 pose values each total 828 Float64 values / 6,624 B. Cached 5×7 cloud and 128² grain contain 16,419 values. The 3×3 owner neighborhood and circle cull use a conservative support bound 1.045164 below the nearest omitted owner distance 1.15. Five C1 shoulder products avoid nearest-plane corner creases without per-point surface-sampler allocation, hashing, trigonometry or square roots; needsDetail bypass remains. One authored blue-grey-to-golden ramp keeps all mineral pigment tintable, with opaque M0/mortar0/AO1. All phases share a polished plane, with only a theoretical 0.000003 UV grain-height span; the 0.06 m reference tile / 0.001 UV relief gives 0.18 μm at that reference scale, not displacement geometry or measured fiber dimensions. Existing options/Worker/cache/ownership remain unchanged; view-dependent chatoyancy, anisotropy, translucency, locality authentication and geological simulation are not certified.

`castorbeans` has 16 independently seeded rotated/jittered glossy mottled oval seed coats, each with one connected paler, rougher apical caruncle—not wrinkled tonka beans, grooved date pits, paired caruncles or transparent seeds. The 80 Float64 pose values / 640 B and 16×9 spots, 5×7 warp and 128² grain (16,563 values) are prepared once. Existing oval-seed squared caps, C1 shoulders and ordered compositing keep the caruncle connected to the testa. A conservative rotated support bound 0.29+0.09 plus jitter 0.025 gives 0.405, below the owner half-width 0.5. Dark testa mottling changes pigment only, not carved height; coat and caruncle have smooth convex domes, opaque M0/mortar0. No per-point surface-sampler allocation, hashing, trigonometry or square roots; needsDetail bypass remains. The 0.064 m reference tile / 0.03 UV relief gives a 9.6 mm coat long axis and 2.88 mm caruncle width at that reference scale; the theoretical 0.000045 UV grain-height span corresponds to 2.88 μm. These are reference dimensions, not botanical measurement or displacement geometry. Existing options/tint/Worker/cache/ownership remain unchanged, without growth, capsules, medicinal or edible functionality.

`zebrawood` is a pale golden-brown wood face with dark, varying-width gently wavy longitudinal streaks and sparse open vessels on both light and dark regions—not zebra fur, end-grain rings, carved stripes or a recolored wenge alias. It reuses existing hardwood seeded elliptical-vessel/C1-shoulder and cached-noise conventions, adding smoothly varying dark-streak widths. The streaks change pigment only; only vessels are shallow depressions, with opaque M0/mortar0 throughout. The 512 Float64 vessel-pose values / 4,096 B and 3×5 warp, 18×4 width, 64×4 fiber and 128² grain (16,727 values) are cached once. No per-point allocation, hashing, trigonometry or square roots; needsDetail bypass remains. At the 0.16 m reference tile / 0.002 UV relief, nominal vessel depth 0.0002 UV corresponds to 32 μm and theoretical grain-height span 0.000006 UV to 0.96 μm. These are reference dimensions, not anatomical measurement or displacement geometry. Existing options/tint/Worker/cache/ownership stay unchanged, without growth, species identification, anisotropy or dynamic chatoyancy.

`twopinscrewheads` has 25 independently seeded rotated/jittered round steel heads, each with two opposed disjoint circular blind recesses, flat metal floors and an intact central steel bridge—not a connected slot, three holes, a center pin or punched-through backing. It falls through to the existing hex/square head/backing/blind-floor core, adding two disjoint squared-circle C1 shoulders; the original four-/six-flat product order is unchanged. The 125 Float64 pose values / 1,000 B and 128² grain are initialized once. No per-point surface-sampler allocation, hashing, trigonometry or square roots; needsDetail bypass remains. Maximum hole support 0.222 is below full head radius 0.32; center separation 0.31 exceeds twice hole radius 0.134, leaving a 0.176 central bridge. Head radius plus jitter 0.395 is below owner half-width 0.5. Head and blind floors are M1, lower backing M0, mortar is 1−face and every map is opaque; the public facade uses metallic factor 1. At the 0.06 m reference tile / 0.03 UV relief, nominal depth 0.0129 UV corresponds to 0.774 mm and theoretical floor-grain span 0.00006 UV to 3.6 μm. These are reference dimensions, not measured mechanical dimensions, displacement geometry, screw threads or certified driver fit. Existing options/tint/Worker/cache/ownership remain unchanged.

`redberyl` approximates raspberry-red beryl in pale granular rhyolite, selecting an end-on surface view of flat hexagonal basal terminations rather than pretending to reconstruct the photographs’ tall side-view prisms. It is not pointed Quartz, circular spots, six-lobed flowers, square tablets, printing or pits. A compact leaf follows existing cached-noise, seeded-pose and C1 squared-half-plane conventions: three squared strips 60° apart form six straight sides and a genuinely raised flat top. Seeded rotation, offset, radius, top height and sparse occupancy vary the crystals. Eight pose values for each of 4×4 owners plus 8² cloud and 128² grain total 16,576 Float64 values / 132,608 bytes of tables, not total RAM. Squared support and shoulder reciprocals are constructor-baked; a conservative 0.0556-cell owner margin avoids neighbor searches. No per-point allocations, seed hashes, trigonometry or square roots. Smoother crystal faces contrast with a rough granular host; opaque dielectric maps use shallow AO contrast, not black cavity shading. Signed C1 behavior and the existing per-image height normalization remain. Nominal tile 0.18 m; use root `await ProceduralMaterial.create('redberyl', { size: 512, seed: 7, heightMap: true })` with existing Worker/cache/ownership/destroy contracts. This is a five-map visual approximation, not crystal-column meshes, transmission/refraction/pleochroism/scattering or mineral/origin/treatment/hardness/rarity/value/healing certification. No photographs are bundled.

`cottondrill` approximates warm-khaki 3/1 warp-faced cotton drill: matching warp/weft dye, continuous three-pick warp floats and a consistently advancing diagonal—not plain weave, 2/2 basket, reversing herringbone, navy/cream Ticking or painted diagonal lines. It directly reuses the existing profiledWeave whole-float kernel; construction selects the new preset and matching yarn tones. A 144-warp/96-weft integer lattice and 4×4 draft preserve periodicity. Squared C1 coverage, rounded crowns and whole-float shoulders keep raised runs continuous across owners instead of pinching each pick into a bead. The 4×4×6 float profiles and 128² grain total 16,480 Float64 values / 131,840 bytes of tables, not total RAM; per-point evaluation adds no allocations, seed hashes, trigonometry or square roots, and no nap/slub cache. Nominal tile 0.08 m, default metallic 0 and five opaque maps retain shallow normals, matte roughness and dense AO; narrow interstices are a lower dielectric bed, not transparent holes. The existing height writer normalizes each image independently, so its range does not certify cloth thickness. Use root `await ProceduralMaterial.create('cottondrill', { size: 512, seed: 7, heightMap: true })` with the existing Worker/cache/ownership/destroy contracts. No cloth simulation, transmission or fiber geometry; no cotton-content, GSM/yarn-count/physical-density, durability/safety or care certification.

`bluelaceagate` approximates a polished pale Blue Lace Agate face with unequal alternating broad and fine white lacy companion laminae in a coplanar blue matrix—not cobalt Lapis, gray stone, equal-width printing, raised white ridges or carved grooves. It directly shares the existing Rhodochrosite flat-band kernel instead of adding another sampler. Only construction selects a 48×3 fine-warp grid for the new kind; the original kind retains 9×3, its arithmetic order and unchanged preset values. The local calcite name becomes the neutral paleBand. Nine integer band periods combine broad/fine smooth warp and two disjoint squared shoulders; existing C1 caches and periodic wrapping preserve signed seams. Pigment bands add no height or false AO trenches. The 3²/48×3/12²/128² caches contain 16,681 Float64 values / 133,448B of tables, not total RAM. Point evaluation adds no allocations, seed hashing, trigonometry or square roots. The nominal tile is 0.12m and default metallic0; all five maps are opaque and normals remain near-flat. Optional height retains the existing per-map min/max normalization, so a 0–255 image range does not imply macroscopic relief. Tint/repeats and native Worker/cache ownership are unchanged. This is a static visual approximation, not mineral, natural/treated-color, provenance, dimensional, hardness or gem-value certification; translucent edges, scattering, crystal optics and healing effects are not simulated. Use `await ProceduralMaterial.create('bluelaceagate', { size: 512, seed: 7, heightMap: true, repeats: 3 })`; destroy the owned preset after its borrowers stop using it.

`linchpins` approximates silver-colored round-keep Linch Pins: a closed round-wire retaining ring, thicker solid shank and raised cold-headed end, with two dark dielectric interior clearances. It is not an open R-clip, split cotter pin, flat washer or printed prohibition sign. A compact independent leaf follows the existing periodic cached-noise, squared-annulus/capsule and smooth-coverage conventions; an eighth-power superellipse rounds the headed block. Genuine height crowns layer the keep behind the shank and the head rather than flattening all three surfaces. An even 4×4 alternating diagonal layout preserves signed periods. Construction computes inverse sizes and conservative support, leaving at least 0.117 cell margin by default; no neighbor search is needed, empty support skips geometry and zero coverage skips crowns. The 96² grain table contains 9216 Float64 values / 73,728B, not total RAM. Point evaluation allocates nothing and adds no seed hashing, trigonometry or square roots. The nominal tile is 0.2m and default metallic1, but the metallic map covers only the hardware while clearances remain M0. All five maps are opaque, not alpha cutouts or genuinely perforated meshes. Optional height/tint/repeats and native Worker/cache ownership are unchanged. This is a static closed-pose visual approximation, not DIN dimensional, coating-chemistry/corrosion, load-retention or safety certification, and it simulates no latch, spring, collision or rotation. Use `await ProceduralMaterial.create('linchpins', { size: 512, seed: 7, heightMap: true, repeats: 3 })`; destroy the owned preset after its borrowers stop using it.

`silknoil` approximates natural-cream matte Silk Noil with fine alternating plain-weave yarn crowns and sparse small raised short-fiber neps in both yarn directions. It is not shiny reeled Shantung, satin, dark pitting, printed brown flecks or large pebbles. “Raw silk” is a commercial name sometimes used for Noil, not a claim that the fibers retain unwashed sericin. A compact independent leaf reuses periodic cached noise and squared compact-support primitives. Alternating yarn terms and slopes vanish at every yarn owner; the even 128-thread repeat preserves signed periods. Each of 48² nep owners caches admission, position, axis, inverse sizes and a cream-to-tan tone; squared elliptical crowns genuinely raise height while smooth coverage changes pigment, roughness and AO. The maximum default support leaves 0.08 cell margin, so no neighbor search is needed. The 48²×6 nep table plus 128² grain contains 30,208 Float64 values / 241,664B of tables, not total RAM. Point evaluation adds no allocations, seed hashing, trigonometry or square roots. The nominal tile is 0.12m and default metallic0; ordinary five-map PBR, optional height/tint/repeats and native Worker/cache ownership remain unchanged. This is a static visual approximation, not a fiber blend, sericin, provenance, care, density, momme, drape, strength or safety certification, and it does not simulate cloth dynamics or real short fibers. Use `await ProceduralMaterial.create('silknoil', { size: 512, seed: 7, heightMap: true, repeats: 3 })`; destroy the owned preset after its borrowers stop using it.

`bloodwood` adds a selected vivid-red Bloodwood (Brosimum rubescens / Satine) longitudinal face with fine, slightly wandering straight grain and sparse small, short recessed vessel traces. It is not orange Padauk, purpleheart, grayscale or neon red paint, dense black burn-like pits, endgrain, or raised corduroy ribbons. The existing sparse-vessel wood kernel remains unchanged except for three admissions of the new kind: compact squared pore supports, constructor-only seed work, coplanar pigment bands, 256×10 fine fibers and the 128² grain lattice. The 48×16×4 pore cache plus 3×4 warp, fiber and grain tables total 22,028 Float64 values / 176,224B of tables, not total RAM; maximum supports leave at least 0.185/0.155 owner margins. Sampling adds no allocations, seed hashing, trigonometry, square roots or neighbor search. The nominal tile is 0.12m. Vessel interiors lower height, roughen and occlude slightly; the lustrous-looking red surface remains dielectric with default metallic0. This approximates selected red stock only, not all Bloodwood grain, species/provenance certification, calibrated color, view-dependent chatoyancy, anatomical dimensions, sunlight aging, dust safety or mechanical properties. Use `await ProceduralMaterial.create('bloodwood', { size: 512, seed: 7, heightMap: true, repeats: 3 })`; destroy the owned preset after its borrowers stop using it.

`cavansite` approximates sparse brilliant-blue raised short-acicular rosettes on a dominant pale, warm granular mineral matrix. It is not a polished blue cabochon, a flat painted flower, a square zoned Fluorite crystal or a long-spiked Pentagonite star. The selected museum specimens motivate the blue aggregate and pale host only; opaque five-map PBR does not reproduce actual crystal optics, chemistry, transparency, fluorescence, mineral identification, provenance or calibrated dimensions. A small dedicated leaf reuses periodic cached noise and smooth compact supports: a squared radial crown blends with 36 constructor-cached, slightly irregular short radial needle profiles through complement products, with C1 pigment/height/AO at the radial body boundary. Seeded admission, orientation, scale and jitter are cached per owner; the maximum default support leaves at least 0.155 cell margin, so no adjacent-owner search is needed. The 4²×6 site cache, 36×4 needle cache, 128² grain and 32² host lattice total 17,648 Float64 values / 141,184B of tables, not total RAM. Point sampling adds no allocations, seed hashes, trigonometry or square roots. Nominal tile 0.16m; blue crystals are genuinely raised and smoother than the host, with dielectric default metallic0 despite the real mineral containing vanadium. Use `await ProceduralMaterial.create('cavansite', { size: 512, seed: 7, heightMap: true, repeats: 3 })`; destroy the returned owned preset after its borrowers stop using it.

`matelasse` is a warm-ivory woven-quilt approximation with a continuous raised diamond binding network, softly lofted panels and fine alternating yarn crowns—not the sunken dashed sewing lines of `quilting`, cathedral-window folds, an inflated cushion grid or a printed diamond pattern. The selected cotton-like look follows a real diamond Matelasse coverlet; it is not a fiber, weave-machine, provenance, dimensional, care or durability certification. A dedicated small leaf reuses the existing periodic lattice and smooth support primitives: two diagonal compact ribs blend with a bounded smooth union rather than nearest-rib ownership or double-height intersections, squared panel supports meet flat at their owners, and the alternating yarn term and slope vanish at every yarn owner. The even 128-thread layout and six diagonal repeats preserve signed UV periods. One immutable 128² grain table uses 16,384 Float64 values (131,072B of tables, not total RAM); point evaluation adds no allocations, seed hashing, trigonometry, square roots or neighbor search. The nominal tile is 0.24m, the default metallic multiplier is 0, and the five ordinary PBR maps describe static visual relief only, not cloth dynamics, batting or actual fiber structure. Seven consumer cases cover raised binding versus shallow panel loft, adjacent over/under crowns, C1 shoulders/owners, actual512 opaque ivory dielectric maps and signed periods; sixteen independent negative controls and a legal wider-rib variation were exercised before integration.

```ts
const matelasse = await ProceduralMaterial.create('matelasse', {
  size: 512,
  seed: 7,
  heightMap: true,
});
// Destroy this owned preset after all borrowing meshes/materials stop using it.
matelasse.destroy();
```

`yellowheart` adds a selected straight-grained golden Yellowheart (Euxylophora paraensis / Pau Amarello) face with fine, low-contrast longitudinal grain and sparse short open-vessel traces. It is not orange Padauk, purple wood, neon paint, dense ring-porous stripes, raised ribbon grain, endgrain or a true satinwood identification. The existing Padauk/Iroko/Purpleheart/Sapele/Wenge kernel is reused unchanged apart from admitting the new fine-grain preset: constructor-only sparse vessel admission, compact squared ellipses, periodic warped pigment bands, 224×6 fine fibers, 128² grain and genuine shallow pore recesses. The 40×12×4 pore cache, 3×4 warp and fiber/grain lattices total 19,660 Float64 values / 157,280 B of tables, not total RAM. Maximum vessel supports leave at least 0.17/0.11 owner margins, preserving C1 joins; color grain stays on one satin plane while the sparse vessel interiors lower height, raise roughness and occlude slightly. Sampling adds no allocation, hashing, trig, square roots or neighbor scan. The nominal tile is 0.12 m. Five maps, optional height/tint/repeats, native Worker/cache, dielectric default and explicit metallic override, isolated textures and destroy contracts remain unchanged. This is a static visual approximation of selected golden stock, not species/provenance certification, calibrated color, anatomical dimensions, sunlight aging, dust safety or mechanical wood properties. Use `await ProceduralMaterial.create('yellowheart', { size: 512, seed: 7, heightMap: true, repeats: 3 })`; destroy the returned preset when no longer needed.

`rclips` adds a bright spring-wire R-clip approximation with a single round pull loop, one long straight insertion leg, an inward-necked bowed spring leg and a flared short tip. The eye, spring clearances and free-end gaps stay connected to the dark recessed background; the result is not a closed washer, flat split cotter or two parallel U-legs. It reuses the paperclip capsule/half-ring kernel and complement union, caching 13 five-value segments, one five-value bend and the existing 96² grain lattice: 9,286 Float64 values / 74,288 B of tables, not total RAM. A second smooth cover rounds only the R-clip wire crown, with metal following the wire mask and the empty bed remaining dielectric; the existing paperclip branch stays unchanged. Squared distances are reused between face and crown profiles. Sampling adds no allocation, hashing, trig or square roots; the maximum 0.42605 local support stays strictly inside a half-cell, and smooth capsule projections, overlapped arc shoulders, seed grain and signed UV repeats remain C1. The tile is 0.12 m and alternating ±45° clip placement is deterministic; seed varies micrograin, not the manufactured outline. Five maps, optional height/tint/repeats, native Worker/cache, explicit metallic override, isolated textures and destroy contracts remain unchanged. This is a height-field visual approximation, not a certified DIN part, dimensional drawing, material grade, spring-force, fatigue or retention simulation. Use `await ProceduralMaterial.create('rclips', { size: 512, seed: 7, heightMap: true, repeats: 3 })`; destroy the returned preset when no longer needed.

`ticking` adds a navy-and-cream mattress-ticking approximation: a broad dyed center stripe is flanked by two fine lines on a dense 2/1 warp-faced twill. The stripes follow the warp yarns, while cream weft crossings remain visible; they are neither printed solid bars nor a plaid, brushed nap, open gauze or embossed stripe relief. It reuses the existing woven-yarn kernel and whole-run float profiles, so a two-pick warp float stays raised through its intermediate owner boundary rather than turning into beads. The 3×3 draft uses 54 cached Float64 profile values plus the existing 128² grain lattice: 16,438 values / 131,504 B of tables, not total RAM; the immutable stripe draft is ordinary authoring data. Narrow yarn supports and squared smooth float profiles preserve C1 joins at yarn owners, shoulders, fibers and signed UV seams. Stripe pigment does not drive height, roughness or occlusion. Seed work stays in the constructor; sampling adds no allocations, hashes, trig or square roots. The five-map, height/tint/repeats, Worker/cache, isolated texture ownership and destroy contracts remain unchanged. The nominal tile is 0.048 m; the visual preset makes no feather-proof, textile-density, wear, fire-safety or manufacturer certification claim, and existing woven presets remain unchanged. Use `await ProceduralMaterial.create('ticking', { size: 512, seed: 7, heightMap: true, repeats: 3 })`; destroy the returned preset when no longer needed.

`sodalite` adds an opaque polished blue-to-blue-violet approximation with fine granular matrix variation, narrow irregular white calcite-like veinlets and occasional pale patches. It is not metallic pyrite, raised white ribbons, open cracks, a transparent orange-yellow specimen, fluorescence or photochromic hackmanite. A new leaf reuses the existing periodic cached-noise and smooth squared-cover primitives: two domain-warped carrier scales (11² and 43²), 6² cloud, 128² grain and two 4² warp tables total 18,422 Float64 values / 147,376 B of tables, not total RAM. Squared distance from the carrier level forms smoothly feathered filled veins, joined to pale cloud patches by a complement product; there are no nearest-site or angular seams. Seed hashing is paid only during construction; point sampling has no allocation, hash, trig, square root or neighbor scan. Pigment and modestly rougher white veins remain on one flat micrograin plane with AO 1, metallic 0 and mortar 0. The 0.12 m nominal tile and 0.0002 UV relief are authored, not calibrated mineral dimensions or optical properties. The existing CPU maps, optional height, facade controls, cache, native Worker and cleanup contracts remain unchanged. Create it with `await ProceduralMaterial.create('sodalite', { seed: 7 })`; destroy the preset after its consumers finish.

`dalmatianstone` adds a polished creamy feldspar/quartz-like matrix with variable-size dark green-black aggregates, not raised pebbles, pores, ringed orbs or white snowflakes. The name follows the GIA paper’s recommendation of Dalmatian stone rather than the trade misnomer Dalmatian jasper; this is an authored appearance, not a chemical or provenance identification. One seeded candidate per 10×10 cell is variably admitted, rotated, sized and curved; the 128² cached grain also smoothly perturbs its squared contour, and neighboring spots can join across owner boundaries. A fixed periodic 3×3 neighborhood avoids clipped edge aggregates. With contour multiplier at least 0.6, maximum support is below 0.393 cell units, far inside the nearest omitted-site distance 1.15. The 800 pose values plus 128² grain and 12² matrix caches total 17,328 Float64 values / 138,624 B of tables, not total RAM. All pose hashing/trigonometry/inverse radii are constructor work; point sampling allocates nothing and uses no hashes, trig or square roots. Smooth covers affect pigment and slightly rougher dark inclusions only: one polished plane retains shallow micrograin height, AO 1, metallic 0 and mortar 0. The nominal 0.06 m tile and 0.002 UV relief are authored values, not calibrated specimen dimensions. CPU maps, optional height, facade controls, cache, native Worker and cleanup contracts remain unchanged. Create it with `await ProceduralMaterial.create('dalmatianstone', { seed: 7 })`; destroy the preset after its consumers finish.

`purpleheart` adds a static exposed eggplant-purple Purpleheart face with mostly straight medium grain and sparse, closed-ended longitudinal vessels. It represents an authored exposed-color state, not freshly cut gray/brown stock, UV/oxidation animation, fluorescence, wood identification, or calibrated physical properties. It shares the existing Padauk/Iroko/Sapele/Wenge vessel kernel, selecting the fine sparse profile at construction only; each occupied vessel has a dark recessed floor, slightly rougher walls and local AO, while all long-grain bands remain flat pigment rather than proud ribbons. The 30×10 candidate sites store 1,200 inverse-ellipse/position values, with 3×4 warp, 192×6 fiber and 128² micrograin: 18,748 Float64 values / 149,984 B of tables, not total RAM. Candidate centers and support stay inside their owner (horizontal center 0.25–0.75 with radius at most 0.09; vertical center 0.35–0.65 with radius at most 0.28), so periodic single-owner evaluation and smooth squared covers remain C1. Point sampling adds no allocation, hash, trig or square root; the existing point kernel and arithmetic order for all four sibling kinds are unchanged. Metallic and mortar stay 0. The nominal 0.12 m tile and 0.003 UV relief are authored dimensions; CPU maps, optional height, controls/cache/native Worker and cleanup follow the same contract. Create it with `await ProceduralMaterial.create('purpleheart', { seed: 7 })` and destroy the preset once its consumers are finished.

`blackpalm` adds a satin-finished longitudinal Black Palm approximation: dense narrow dark fibrovascular bundles run mostly along V through tan/brown ground tissue, unlike the dotted cut bundles and recessed vessels of `palmendgrain`. There are no annual rings, knots, board seams, dark holes, or pigment-carved relief. It reuses the existing Tigerwood/Snakewood compact curved-spindle pigment kernel unchanged; seeded positions, inverse squared widths/lengths, small slopes and bends are cached at construction. The 80×12 owners with two candidate bundles each use 11,520 pose values plus 96×6 wood, 128×8 fiber and 128² micrograin caches, totaling 29,504 Float64 values / 236,032 B of tables, not total RAM. Including jitter, support is at most 0.758 owner units across and 1.38 along, below the 1.5 bound for the existing periodic 3×3 neighborhood. Smooth squared covers overlap as pigment on one fine-grained face; point sampling adds no allocation, hash, trig or square root. Metallic stays 0, AO stays 1, mortar stays 0, and roughness is satin; only the shared fine grain contributes shallow height. The 0.096 m nominal tile and 0.004 UV relief are authored choices, not calibrated fiber dimensions, wood grading, mechanical properties or a new shading model. The CPU maps, optional height, facade/cache/Worker controls and existing cleanup contract remain unchanged. Create it through `await ProceduralMaterial.create('blackpalm', { seed: 7 })`; destroy the returned preset after its consumers are finished, as for the other procedural kinds.

`eclips` adds stainless E retaining clips with three inward contact lugs, two broad wing windows joined to the shaft opening, and a flared side mouth—not the existing C clips with plier eyelets. Sixteen slightly rotated, jittered and scaled poses use 80 cached values plus 96² grain: 9,296 Float64 values / 74,368 B of tables, not total RAM. Compact squared-radius covers and smooth half-planes keep every clip within 0.35 cell units per axis, including jitter, below the 0.5 owner boundary. The central lug or empty bore protects the mirrored pocket's absolute-x join. Sampling has no allocation, hash, trigonometry, square root or neighbor search; empty backing skips grain. Metal face, height, roughness and AO share the same cover. Authored metallic maps are 1 on steel and 0 on opaque backing; the default material factor is 1. The nominal 0.064 m tile and 0.004 UV relief are authored, not dimensional certification. Existing maps, optional height, tint, repeats, Worker/cache and ownership remain unchanged; no mesh holes, transparency, shaft assembly, spring mechanics or load-rating simulation is added. Use `await ProceduralMaterial.create('eclips', { seed: 7 })`.

`snowflakeobsidian` adds an authored polished black face with flush gray radiating inclusions, not the existing Obsidian fracture scars, raised flowers or smooth painted disks. Thirty-six seeded clusters each use 24 compact radial blades and a variable 0.4–1.1 scale; the scaled support plus jitter is at most 0.4657 cell units, below the 0.5 owner boundary. It reuses the Chrysanthemum Stone kernel with constructor-selected pigment/roughness profiles and scaled cached bases. The 3,564 geometry values plus 96² grain total 12,780 Float64 values / 102,240 B of tables, not total RAM. Sampling has no allocation, hash, trigonometry or square root. Only micrograin shapes height; the gray inclusions are slightly rougher than the black matrix. The authored 0.12 m nominal tile and 0.001 UV relief are not specimen measurements. Opaque dielectric maps (metallic 0), optional height, tint, repeats, Worker/cache and caller ownership remain unchanged; no fracture/crystal geometry, transparency, mineral identification or calibrated optical simulation is added. Use `await ProceduralMaterial.create('snowflakeobsidian', { seed: 7 })`.

`rhombitrihexagonaltiles` adds an authored rhombitrihexagonal (3.4.6.4) glazed tiling: regular hexagons on a triangular lattice, a square on every lattice edge turned to one of three directions 60° apart, and an equilateral triangle at the center of every lattice triangle, so each vertex meets a triangle, a square, a hexagon and a second square; the hexagons are cream glaze, the squares slate blue, the triangles navy, and every face has a narrow bevelled edge inside rougher gray grout. It is not `snubsquaretiles` (3.3.4.3.4), `trihexagonaltiles` (hexagons and triangles), `dodecagontiles` (canonical 3.12.12) or the other existing tile presets, and a search of README/PLAN/DESIGN/CURRENT/TECHNICAL and the preset catalog for rhombitri and 3.4.6.4 found no preset with this vertex type. The actually read Wikipedia Rhombitrihexagonal tiling page (a semiregular tiling with one triangle, two squares and one hexagon at each vertex, Schläfli symbol rr{3,6}, an expanded hexagonal tiling, related to the truncated trihexagonal tiling) supplies the topology; the geometry is derived and numerically checked rather than copied: for unit edges hexagon centers sit on a triangular lattice of pitch 1 + √3 ≈ 2.73205 (apothem √3/2 + square edge 1 + apothem √3/2), the hexagon edges face the lattice directions, each lattice edge carries a square centered on its midpoint, each lattice triangle holds one triangle at its centroid, a cell is 1 hexagon + 3 squares + 2 triangles of area (1 + √3)²√3/2 ≈ 6.4641, and 300,000 random points in the 7 × 4 supercell each land in exactly one polygon (no gaps or overlaps). The 7 columns × 4 double rows per UV tile (56 hexagons + 168 squares + 112 triangles, a 1.04% wider-than-tall supercell stretched onto the square UV tile, the same near-square convention as the existing 7 × 8 hexagonal tile presets), 0.03 grout per side (0.06 edge in total), 0.02 shoulder, navy/cream palette (20,52,88 / 244,232,200), glaze roughness 0.3, grout roughness 0.92, 0.012 UV-relative relief and the 1.2 m nominal tile (edge about 0.0628 m) are authored approximations; no tile thickness, glaze chemistry, grout material, size standard or product is claimed. The independent kernel stores 12 polygon-center values, 72 edge-normal values, 336 per-tile tones and a 96² grain, 9,636 Float64 values / 77,088 B of tables, not total RAM, plus three six-entry constants; each point tests the 3 × 3 lattice-node neighborhood × 6 polygons (54 squared circumradius checks) and evaluates one smooth half-plane per edge only for polygons that can contain it, so no hypot, square root, trigonometry, hash or allocation runs per point; generic detail is skipped. Each face is a product of smooth half-planes inset by the grout, so neighboring supports never overlap and corners need no smooth minimum; tone indices wrap across the supercell with the lattice shift of its slanted period. Seeds change only tile tone (hexagons 0.82–0.94, squares 0.3–0.4, triangles 0.08–0.18) and fine grain while the lattice stays fixed; opaque dielectric four maps, default metallic 0, optional height, tint/repeats, Worker/cache and individual texture ownership stay unchanged, without added meshes, transparency or displacement.

Use root factory `await ProceduralMaterial.create('rhombitrihexagonaltiles', {size:512,seed:7,heightMap:true})`; the default material factor is 0 and `preset.createMaterial({metallic:1})` explicitly overrides it without rewriting the dielectric maps. Seeds change only each tile's tone and fine grain while the lattice, tile edges and grout stay fixed; one UV tile represents 1.2 m (7 columns × 4 double rows: 56 hexagons, 168 squares and 112 triangles), the 512 maps resolve bevelled edges and grout, and 32 only retains the macro cream/slate/navy tiling. Remove consumers before destroying the preset and its owned textures; caller-owned Worker pools and caches remain caller-managed.

`snubsquaretiles` adds an authored snub square (3.3.4.3.4) glazed tiling: unit-edge squares alternately turned about +15° and −15° on a half-lattice checkerboard, with equilateral triangles filling every gap so each vertex meets three triangles and two squares; the squares are dark blue glaze, the triangles cream glaze, and every face has a narrow bevelled edge inside rougher gray grout. It is not the existing hexagon–triangle (`trihexagonaltiles`), Cairo-pentagon (`cairotiles`) or right-isosceles-triangle (`righttriangletiles`) tile presets, and a search of README/PLAN/DESIGN/CURRENT/TECHNICAL and the preset catalog for snub, 3.3.4.3.4 and Archimedean found no preset with this vertex type (the only hit was the Archimedean spiral of `cinnamonbarkcoils`). The actually read Wikipedia Snub square tiling page (a semiregular tiling with three triangles and two squares at every vertex, Schläfli symbol s{4,4}, related to the elongated triangular tiling 3.3.3.4.4) supplies the topology; the geometry is derived and numerically checked rather than copied from a source: for unit edges the square lattice constant is (1 + √3)/√2 ≈ 1.93185, squares sit on lattice nodes (turned +15°) and cell centers (turned −15°), the four outward equilateral triangles on each node square's edges complete the cell, and 200,000 random points each land in exactly one of the 2 squares + 4 triangles per cell (no gaps or overlaps, areas sum to the cell area). The 3 × 3 lattice cells per UV tile (18 squares + 36 triangles), 0.035 grout per side (0.07 edge in total), 0.02 shoulder, blue/cream palette (34,64,98 / 238,226,192), glaze roughness 0.3, grout roughness 0.92, 0.012 UV-relative relief and the 0.6 m nominal tile (edge about 0.1035 m) are authored approximations; no tile thickness, glaze chemistry, grout material, size standard or product is claimed. The independent kernel stores 12 polygon-center values, 48 edge-normal values, 54 per-tile tones and a 96² grain, 9,330 Float64 values / 74,640 B of tables, not total RAM, plus three six-entry constants; each point tests the 3 × 3 lattice-node neighborhood × 6 polygons (54 squared circumradius checks) and evaluates one smooth half-plane per edge only for polygons that can contain it, so no hypot, square root, trigonometry, hash or allocation runs per point; generic detail is skipped. Each face is a product of smooth half-planes inset by the grout, so neighboring supports never overlap and corners need no smooth minimum. Seeds change only tile tone (squares 0.1–0.22, triangles 0.78–0.92) and fine grain while the lattice stays fixed; opaque dielectric four maps, default metallic 0, optional height, tint/repeats, Worker/cache and individual texture ownership stay unchanged, without added meshes, transparency or displacement.

Use root factory `await ProceduralMaterial.create('snubsquaretiles', {size:512,seed:7,heightMap:true})`; the default material factor is 0 and `preset.createMaterial({metallic:1})` explicitly overrides it without rewriting the dielectric maps. Seeds change only each tile's tone and fine grain while the lattice, tile edges and grout stay fixed; one UV tile represents 0.6 m (3 × 3 lattice cells, 18 squares and 36 triangles), the 512 maps resolve bevelled edges and grout, and 32 only retains the macro blue/cream tiling. Remove consumers before destroying the preset and its owned textures; caller-owned Worker pools and caches remain caller-managed.

`starfish` adds an authored five-armed sea-star approximation: most owner cells each hold one randomly rotated star made of a rounded central disc and five arms that taper from base to tip, with slightly irregular angular gaps and arm lengths, a raised dome and spine ridge along every arm, three rows of small tubercles along and beside the ridge, and a rougher darker gray-sand host between the stars. It is not Starcoral's corallite cups with radial septa, Staranise's eight woody pods around recessed seed cavities, Seaurchintest's ivory shell with paired pore rows, or the scalloped overlap family (`scalemail`, `fishscales`). The actually read Wikipedia Starfish article (a central disc with usually five arms, an aboral surface that is smooth, granular or spiny with overlapping plates, often red or orange, and a sieve-like madreporite) and the actually viewed Wikimedia Commons Starfish montage supply the shape idea; the silhouette of the orange specimen in the montage, measured with PIL from the downloaded image, gives five tips 171–183 px from the center, valleys at about 0.17–0.26 of the tip radius, arm widths of about 0.195 R at 0.5 R and 0.148 R at 0.85 R, and tip gaps of 63.5–88.5°. Other specimens in the same montage are narrower or wider (about 0.25–0.3 R for the wide horned sandy one), so these numbers describe one specimen, not the species. The 3 × 3 grid, exactly five arms, ±0.1 rad axis jitter, ±6% length jitter, 0.4 cell radius, 0.25 R disc, base/tip half-widths 0.1 R / 0.07 R, tubercle rows (pitch 0.05 cell, radius 0.017), gray-sand host, gray-to-orange palette, roughness 0.66, 0.02 UV-relative relief and the 0.3 m nominal tile are authored approximations: no species, madreporite, tube feet, spines, color calibration, real size or marine-biology data is claimed. The independent kernel stores 180 pose Float64 values (9 owners × 20) plus a 128² grain and a 16² host field, 16,820 Float64 values / 134,560 B of tables, not total RAM; each point picks the arm with the largest projection (no angle trigonometry), uses two hypot calls and twelve SmoothStep calls, and has no per-point allocation, hash or trigonometry (`cos`/`sin` only while building poses); generic detail is skipped. Arm width tapers with a smoothstep so the slope vanishes at the tip and base; arm-owned relief fades in only beyond 0.2 R–0.25 R from the center so the fold line where neighboring arms hand over shows no relief kink; disc and arms combine as `1 − (1 − arm)(1 − disc)`. Seeds change which owners hold a star, plus rotation, arm jitter, tone and fine grain; opaque dielectric four maps, default metallic 0, optional height, tint/repeats, Worker/cache and individual texture ownership stay unchanged, without added meshes, transparency or real arm geometry.

Use root factory `await ProceduralMaterial.create('starfish', {size:512,seed:7,heightMap:true})`; the default material factor is 0 and `preset.createMaterial({metallic:1})` explicitly overrides it without rewriting the dielectric maps. Seeds change which owners hold a star plus rotation, arm jitter, tone and fine grain, while the five-arm layout, preset radii and tubercle rows stay fixed; one UV tile represents 0.3 m (3 × 3 stars), the 512 maps resolve arms, ridges and tubercle rows, and 32 only retains macro arms and shading. Remove consumers before destroying the preset and its owned textures; caller-owned Worker pools and caches remain caller-managed.

`fishscaleshingles` adds an authored fish-scale metal shingle approximation: eight courses of twelve semicircular lower-edge lobes, each shingle two lobes wide, alternate courses staggered by half a lobe, upper courses overlapping lower ones with an under-lap shadow, and narrow dark seams between slightly different painted shingles. It is not Hopsack/Waffleweave cloth cells, Slate/Tiles rectangular tiles, or Snowflaketiles/Circularpavers geometric paving. The actually read Berridge Fish Scale Shingles page (24-gauge steel, lightly textured rounded scalloped profile, each shingle covering 8 1/2 in tall by 11 1/2 in wide, 148 per square; 8.5 × 11.5 × 148 = 14,467 in², roughly consistent with 100 ft² = 14,400 in² (about 0.5% apart)) and two actually viewed white/beige product images (two semicircular lobes along each shingle's lower edge, neighboring courses offset and overlapping, faint wavy embossing) supply the geometry; the Yusheng fish-scale stone-coated tile page (small overlapping scalloped unit, about 2.8 tiles per m²) was read but none of its numbers are used. The Berridge coverage ratio gives a course-height to lobe-width ratio of 2 × 8.5 / 11.5 ≈ 1.478 for two lobes per shingle; this material's 12 lobes × 8 courses give 1.5 (about 1.5% away) and uses 12 × 5.75 in ≈ 1.75 m as the nominal tile. The sources and images give no readable course offset, lip thickness, shadow width, seam width, paint color or per-shingle tone difference, so the half-lobe stagger, lip, shadow, seam and palette values are authored approximations; no embossing, metallic reflection, steel bending, fasteners, specification certification or wood shingle is claimed. The independent kernel has only a 48-entry shingle tone table (8 × 6) and a 128² grain, 16,432 Float64 values / 131,456 B of tables, not total RAM; each point uses four hypot calls and twelve SmoothStep calls, merges the two nearest lobe distances with a polynomial smooth minimum (avoiding a slope crease along the distance-field medial axis), and has no per-point allocation, hash or trigonometry; generic detail is skipped. Each course computes its own color, height and AO before coverage blends them, so a seam's tone step stays hidden under the seam color instead of leaving a jump. The 0.012 UV-relative relief and palette are authored approximations; seeds change only shingle tone and fine grain while lobes, seams and courses stay fixed; opaque dielectric four maps, default metallic 0, optional height, tint/repeats, Worker/cache and individual texture ownership stay unchanged, without added meshes, transparency, refraction or real overlap geometry. It belongs to the same scalloped-overlap family as the existing `scallopedslate` (4 columns × 6 rows, 1.2 m tile, one rounded tail per blue-grey slate tile, no seams between tiles), `fishscaletiles` (4 columns × 8 rows of coplanar glazed mosaic) and `scalemail`, so treat it as a variant derived from the Berridge coverage ratio — 12 lobes × 8 courses, two lobes per shingle, narrow seams with painted tone differences, a 1.75 m tile and under-lap shadows — rather than a new roof-tile class.

Use root factory `await ProceduralMaterial.create('fishscaleshingles', {size:512,seed:7,heightMap:true})`; the default material factor is 0 and `preset.createMaterial({metallic:1})` explicitly overrides it without rewriting the dielectric maps. Seeds change only each shingle's tone and fine grain while lobes, seams and courses stay fixed; one UV tile represents 1.75 m, the 512 maps resolve lobe edges, lip steps and under-lap shadows, and 32 only retains macro shading and coarse normals. Remove consumers before destroying the preset and its owned textures; caller-owned Worker pools and caches remain caller-managed.

`waffleweave` adds an authored waffle-weave cloth approximation: rounded float ridges on a fixed 14×16 lattice enclose recessed square pockets with shallow bowl floors, weft-direction (horizontal) ridges stand higher than warp-direction (vertical) ridges, and the two ridge directions rise into small knots where they cross. It is not Matelasse's raised quilted diamonds, Basketweave/Hopsack continuous basket floats, or Honeycomb's golden hexagonal comb. The actually read Wikipedia Waffle fabric (also called honeycomb fabric; long warp and weft floats around plain-weave centers form square ridges and hollows), Ashford's "The Squish is real" (long floats interlock on a grid, ridges outline the cells, pockets are the tighter interlacing, finishing puffs the floats) and LinenMe's waffle-towel guide (recessed cells and raised ridges; new cloth is flatter and washing makes the structure more pronounced), plus the actually viewed Wikimedia Commons "An example of waffle fabric" close-up (stronger horizontal ridges, rounded knots at crossings, hollow cells), are the sources; the Ashford and LinenMe page images were viewed but showed only a loom and hanging towels with no readable structure, so they are not appearance evidence. None gives cell sizes, ridge heights or warp/weft ridge ratios, so the 14×16 cells (about 8.6×7.5 mm on the 0.12 m tile), pocket width, 0.9/0.7 weft/warp ridge heights, bowl depth and knot strength are authored approximations; "horizontal ridges stronger" is one photograph's observation, not a fabric specification. No real warp/weft interlacement, weave draft, cloth physics, absorbency or cotton/linen/microfibre specification is claimed. The independent kernel has no per-cell table: only a 128² grain and 8² cloud, 16,448 Float64 values / 131,584 B of tables, not total RAM; each point uses two fract/abs reductions and at most four SmoothStep calls, with no allocation, hash, trigonometry or square root, and generic detail is skipped. The 0.12 m nominal tile, 0.012 UV-relative relief and cool grey-white palette are authored approximations; seeds move only fine grain and cloud tone while the lattice and ridge positions stay fixed; opaque dielectric four maps, default metallic 0, optional height, tint/repeats, Worker/cache and individual texture ownership stay unchanged, without added meshes, transparent holes, cloth simulation, real knit/woven structure or specification certification. It belongs to the same fabric family as the existing `wafflecloth` (8×8 symmetric raised rims; measured warp and weft crests differ by only about 0.6% and crossings are no higher than the crests), so treat it as a finer 14×16 variant rather than a new fabric class: here weft crests stand about 0.08 relief units above warp crests, pockets are bowl-shaped, each crossing adds a knot about 0.10 units above the weft crest, and the references are different.

Use root factory `await ProceduralMaterial.create('waffleweave', {size:512,seed:7,heightMap:true})`; the default material factor is 0 and `preset.createMaterial({metallic:1})` explicitly overrides it without rewriting the dielectric maps. Seeds change only fine grain and cloud shading while the lattice and ridge positions stay fixed; the 512 maps resolve rounded ridge, pocket-bowl and crossing-knot normals, while 32 only retains macro shading and coarse normals. Remove consumers before destroying the preset and its owned textures; caller-owned Worker pools and caches remain caller-managed.

`halite` adds an authored milky cube hopper-face approximation: most owners carry one flush, randomly rotated square cube face with two concentric square terraces stepping down inside it, like the stepped hollows of a hopper crystal; the face is milky and low-roughness on a rough pale grey-pink salt host. It is not Calcite's 75-degree oblique plates, Celestine/Barite rectangular plates, Wulfenite near-square plates, or an unstepped flat square. The actually read Handbook of Mineralogy (isometric, perfect {001} cleavage, skeletal/hopper-shaped faces, colorless or white when pure) and Minerals.net (cubes sometimes distorted with hopper growths), plus its actually viewed pink hopper cluster and white Death Valley cube cluster photographs, give no readable terrace ratio or depth numbers; the face radius, terrace radii of about 0.74/0.44 of the face half-size (each ±0.06) and the 0.08 height-unit drop per terrace are therefore authored approximations, with no measured or certified salt-crystal dimensions, transparency, dissolution physics or mineral identification. The independent kernel stores 9 pose/terrace values for each of 16 seeded owners plus a 128² grain and 16² host table: 16,784 Float64 values / 134,272 B of tables, not total RAM. The largest square face support including jitter is about 0.4455, below the 0.5 owner boundary; each point uses one rotation and at most six SmoothStep calls, with no allocation, hash, trigonometry or square root, and generic detail is skipped. The 0.08 m nominal tile, 0.004 UV-relative relief and palette are authored approximations; opaque dielectric four maps, default metallic 0, optional height, tint/repeats, Worker/cache and individual texture ownership stay unchanged, without added meshes, transparency, refraction, lattice, dissolution simulation or chemical certification. It belongs to the same rotated nested-square hopper family as the existing `bismuthhoppers` (4×4 rotated square faces, six metal terraces, gold-violet, 0.16 m tile); this is only a white dielectric salt variant with two terraces, smaller face half-widths of 0.21–0.27 (versus 0.34), a 0.08 m tile and a rough salt host, not a new crystal class.

Use root factory `await ProceduralMaterial.create('halite', {size:512,seed:7,heightMap:true})`; the default material factor is 0 and `preset.createMaterial({metallic:1})` explicitly overrides it without rewriting the dielectric maps. Seeds change face placement, turn and the two terrace ratios; the 512 maps resolve rim and terrace normals, while 32 only retains macro color and coarse normals. Remove consumers before destroying the preset and its owned textures; caller-owned Worker pools and caches remain caller-managed.

`calcite` adds an authored milky oblique cleavage-plate approximation: most owners carry one flush rhomb-shaped plate whose two edge pairs meet at about 75 degrees, with a parallel nested step plate slightly off center; the plate is milky and low-roughness on a rough dark brown mineral host. It is not Celestine/Barite rectangular plates, Wulfenite near-square plates, or Pyromorphite/Vanadinite hexagonal ends. The 75-degree angle is authored: the actually read Handbook of Mineralogy (perfect {1011} cleavage), Wikipedia and LibreTexts (rhombohedral cleavage, commonly white cleavage fragments) and the Minerals.net transparent Iceland spar photograph provide no readable face-angle value, so no measured or certified cleavage angle, crystal optics, transparency or birefringence is claimed. The independent kernel stores 10 pose/step values for each of 16 seeded owners plus a 128² grain and 16² host table: 16,800 Float64 values / 134,400 B of tables, not total RAM. The largest plate support including jitter is about 0.4692, below the 0.5 owner boundary; each point uses one rotation, one oblique conversion and at most four SmoothStep calls, with no allocation, hash, trigonometry or square root, and generic detail is skipped. The 0.1 m nominal tile, 0.0035 UV-relative relief and palette are authored approximations; opaque dielectric four maps, default metallic 0, optional height, tint/repeats, Worker/cache and individual texture ownership stay unchanged, without added meshes, transparency, refraction, lattice or chemical certification.

Use root factory `await ProceduralMaterial.create('calcite', {size:512,seed:7,heightMap:true})`; the default material factor is 0 and `preset.createMaterial({metallic:1})` explicitly overrides it without rewriting the dielectric maps. Seeds change plate placement, turn and step offsets; the 512 maps resolve shoulder and step normals, while 32 only retains macro color and coarse normals. Remove consumers before destroying the preset and its owned textures; caller-owned Worker pools and caches remain caller-owned.

`flangenuts` adds an authored top-view approximation of steel hexagonal flange nuts: a trimmed six-flat hex body stands on a lower circular conical flange with an open central bore revealing rougher dark steel backing; it is neither flangeless Hex Nuts nor the closed dome of Cap Nuts. Proportions follow only the DIN 6923 M5–M20 table and drawing trend: flange diameter dc is about 1.38–1.48 across-flats s, minimum across-corners e is about 1.10–1.115 s, minimum bore da is about 0.60–0.67 s, and the drawing shows a 15–30 degree flange face; this material uses a flange/flat ratio near 1.40 and a bore/flat ratio near 0.68. Sixteen seeded owners cache six plane normals; 16×12 plane values plus 96² grain use 9,408 Float64 elements / 75,264 table bytes, not total RAM. The 0.413 flange radius stays inside the 0.5 owner; each point uses six smooth plane products, one hypot and a few SmoothStep calls, with no allocation, hash, trigonometry or neighboring-cell scan, and generic detail is skipped. The 0.08 m nominal tile follows Hex Nuts; the 0.03 UV-relative relief and palette are authored approximations. The whole tile including dark steel backing is metallic 1, the root-factory default is 1, and explicit factor 0 does not rewrite maps. It does not include underside serrations, full 3D nuts, internal threads, transparency, steel hardness, corrosion data or DIN/ISO certification.

Use root factory `await ProceduralMaterial.create('flangenuts', {size:512,seed:7,heightMap:true})`; the default material factor is 1 and `preset.createMaterial({metallic:0})` explicitly overrides it without rewriting the steel/backing maps. Seeds change nut orientation and fine grain; the 512 maps resolve steep hex, bore and flange normals, while 32 only retains macro color and coarse normals. Remove consumers before destroying the preset and its owned textures; caller-owned Worker pools and caches remain caller-owned.

`capnuts` adds an authored top-view approximation of steel hexagonal cap nuts: six straight flats on a lightly trimmed hex body, a closed circular dome and rougher dark steel backing; it is not the through-bored Hex Nuts material. Proportions follow only the DIN 1587 table trend: dome diameter dk is about 0.93–0.96 of across-flats s, minimum across-corners e is about 1.106–1.113 s, and a lower 30-degree chamfer ring approximates the corners. Sixteen seeded owners cache six plane normals in the constructor; 16×12 plane values plus 96² grain use 9,408 Float64 elements / 75,264 table bytes, not total RAM. The 0.421 corner trim radius stays inside the 0.5 owner; each point uses six smooth plane products, one hypot and a few squares/SmoothStep calls, with no allocation, hash, trigonometry or neighboring-cell scan, and generic detail is skipped. The 0.08 m nominal tile follows Hex Nuts; the 0.03 UV-relative relief, dome crown and palette are authored approximations, not real nut dimensions, threads, corrosion or material certification. The whole tile including dark steel backing is metallic 1, the root-factory default is 1, and explicit factor 0 does not rewrite maps. It does not include full 3D nuts, internal threads, transparency, steel hardness, DIN/ISO certification or measured steel data.

Use root factory `await ProceduralMaterial.create('capnuts', {size:512,seed:7,heightMap:true})`; the default material factor is 1 and `preset.createMaterial({metallic:0})` explicitly overrides it without rewriting the steel/backing maps. Seeds change nut orientation and fine grain; the 512 maps resolve steep bevel/dome normals, while 32 only retains macro color and coarse normals. Remove consumers before destroying the preset and its owned textures; caller-owned Worker pools and caches remain caller-owned.

`bedfordcord` adds an authored khaki warp-direction woven-rib surface approximation: twenty vertical cords are each made of twenty-four flat weft-direction dashes, adjacent cords are staggered by half a dash pitch, and continuous fine grooves separate the cords; the cord body lies below the dashes and the grooves lower still. It is neither corduroy cut-pile wales, rib-knit loops, faille/grosgrain transverse weft ribs nor a yarn-by-yarn draft float. A separate case is used instead of forcing this lattice into the existing warp/weft yarn kernel: each point performs only floor/fract, squares and SmoothStep composition, with no allocation, hash, trigonometry, square root or neighboring-cell scan, and generic detail is skipped. The 20×24 dash-tone table plus 96² grain use 9,696 Float64 elements / 77,568 table bytes, not total RAM; dash half-extents 0.45/0.46 remain inside the 0.5 owner. The seed changes dash tone and fine grain only; cord pitch, dash pitch and stagger are fixed. The 0.07 m nominal tile, 0.0018 UV-relative relief, 20 cords / 24 rows and khaki palette are authored approximations, not calibrated to fabric weight, yarn count or photograph scale; metallic maps and the root-factory default are 0, and explicit factor 1 does not rewrite maps. It does not include real warp/stuffer interlacement, cloth physics, transmission, fuzz, fiber meshes or cotton specification/provenance certification.

Use root factory `await ProceduralMaterial.create('bedfordcord', {size:512,seed:7,heightMap:true})`; `preset.createMaterial({metallic:1})` explicitly overrides default factor 0 without rewriting dielectric maps. Different seeds change dash tone and fine grain only, not the cord lattice. Actual 512 maps resolve shallow staggered dashes; 32 retains macro color and very low normal amplitude. Remove consumers before destroying the preset and its owned textures; caller-owned Worker pools and caches remain caller-owned.

`staurolite` adds authored dark-brown 60-degree crossed-prism surface profiles: two straight-sided, blunt-ended prisms join into four arms and share one flat top rather than stacking double height at the crossing. Both the light coarse-grained host and lower-roughness crystals are opaque dielectric. Sixteen seeded owners cache both axis cosine/sine pairs, centers, inverse scales and tints; the relative angle is calculated in the constructor. Sixteen × eight pose values plus 128² grain use 16,512 Float64 elements / 132,096 table bytes, not total RAM. The per-axis support bound hypot(0.32,0.07)×0.98+0.07=0.391016 stays below 0.5; point sampling has no allocations, hashes, trig, square roots or neighboring-cell scans and skips generic detail. The 0.12 m nominal tile, 0.0035 UV-relative relief and 60-degree UV angle are authored surface approximations, not calibrated crystal dimensions; no full prism meshes, schist foliation, transmission/refraction, mineral identification or chemical/specimen certification.

Use root factory `await ProceduralMaterial.create('staurolite', {size:512,seed:7,heightMap:true})`; `preset.createMaterial({metallic:1})` explicitly overrides default factor 0 without rewriting dielectric maps. Actual 512 maps resolve shallow rims; 32 retains macro color and low-amplitude normals, not the same fine contour detail. Remove consumers before destroying the preset and its owned textures; caller-owned Worker pools and caches remain caller-owned.

`dowelpins` adds authored silver solid unthreaded headless pin side elevations: parallel straight shafts, one rounded end, an opposite small entry bevel and a shallow transverse cylindrical crown. There is no Clevis Pin head/tail bore, Linchpin loop or flat key face. It reuses the Clevis Pin seeded-pose, smooth-cover and crown kernel, selecting headless/holeless branches and precalculating end curvature in the constructor without evaluating skipped head/hole profiles or adding another pin kernel. Sixteen six-value poses plus 96² grain remain 9,312 Float64 values / 74,496B of tables, not total RAM; there is no new table. Maximum rotated support hypot(0.36,0.095)×0.95+0.016=0.369708 stays inside the 0.5 owner boundary. Sampling allocates nothing and uses no hashes, trigonometry, square roots or neighbor scans; backing skips grain and generic detail is skipped. Steel is metallic 1 and opaque gray backing 0, with default material factor 1/explicit 0. The 0.12m nominal tile, 0.0032 UV-relative relief and proportions are authored approximations, not calibrated DIN dimensions or hardness. Four maps/optional height, tint/repeats, Worker/cache and individual texture ownership remain intact, without full cylinder meshes, transparency, threaded extraction bores, press/interference-fit physics, load, rustproofing or DIN/ISO certification.

Use root factory `await ProceduralMaterial.create('dowelpins', {size:512,seed:7,heightMap:true})`; `preset.createMaterial({metallic:0})` explicitly overrides default factor 1 without rewriting steel/nonmetal-backing maps. Remove consumers before destroying the preset and its own textures.

`europeanbeech` adds an authored pale pink-tan fine straight-grained radial face with numerous diffuse shallow longitudinal vessels and minute flush ray flecks, distinct from White Ash coarse earlywood bands, broad White Oak flecks and raised burls. It reuses the existing White Ash/White Oak cached-noise, compact-vessel and curved-ray kernel, equalizing early/late vessel widths and probability, reducing band contrast and using constructor-only pore jitter to reduce regular column structure. Rays change pigment/finish and suppress vessels without adding raised height. The 48×24×4 vessel values, 6×18×6 ray values and 4×3, 96×4, 128² noise total 22,036 Float64 values / 176,288B of tables, not total RAM. Support including jitter stays within vessel X≤0.445/Y≤0.485 and ray X≤0.42/Y≤0.25844 owner-cell units, below 0.5. Sampling allocates nothing and uses no hashes, trigonometry, square roots or neighbor scans; generic detail is skipped. The 0.24m nominal tile, 0.0012 UV-relative relief, pigment and density are authored approximations, not calibrated timber dimensions or vessel diameters. Opaque dielectric M0/explicit override, four maps/optional height, tint/repeats, Worker/cache and individual texture ownership remain intact; there are no vessel meshes, transmission, species identification, steaming/chemical, waterproofing, structural or provenance certifications.

Use root factory `await ProceduralMaterial.create('europeanbeech', {size:512,seed:7,heightMap:true})`; `preset.createMaterial({metallic:1})` explicitly overrides its factor without rewriting dielectric maps. Remove consumers before destroying the preset and its own textures.

`habotai` adds an authored pearl-white fine dense 1/1 plain silk surface with same-dye warp/weft, shallow crossing relief and soft sheen, distinct from matte cotton Batiste, Surah twill, long-float Sateen and irregular Shantung slubs. It reuses the existing balanced-plain kernel and smooth yarn shoulders, adding only a preset/constructor selection; the 128² grain totals 16,384 Float64 values / 131,072B of tables, not total RAM, with no extra float table. Sampling allocates nothing and performs no hashes, trigonometry or square roots; generic detail is skipped. The 84/84 yarn and 336/336 filament-shading counts, 0.04m nominal tile and 0.0002 UV-relative relief are authored selections, not calibrated textile density or thickness. Pearl pigment and lower roughness give soft reflection without adding an anisotropic silk BRDF. Opaque dielectric M0/explicit overrides, four maps/optional height, tint/repeats, Worker/cache and individual texture ownership remain unchanged. Real Habotai may be sheer; this preset selects an opaque surface approximation, without transmission, fold/fiber meshes, cloth physics, momme/composition or conservation-performance certification.

Use root factory `await ProceduralMaterial.create('habotai', {size:512,seed:7,heightMap:true})`; `preset.createMaterial({metallic:1})` explicitly overrides its factor without rewriting dielectric maps. Remove consumers before destroying the preset and its own textures.

`azurite` adds authored deep-blue broad tabular/prismatic faces with strongly oblique parallel ends, shallow longitudinal striae and locally parallel triples rotated between clusters above dark rough mineral backing. It differs from radiating short Cavansite needles, narrow strongly ridged Kyanite blades and near-square orange Wulfenite plates. It reuses the existing Celestine/Barite/Kyanite seeded-plate kernel, adding only a profile: twenty-five six-value poses plus 128² grain total 16,534 Float64 values / 132,272B of tables, not total RAM. Rotated support hypot(0.23,0.3446)×0.975+0.025=0.428948 stays inside the 0.5 owner boundary. Sampling allocates nothing, performs no hashes or neighbor scans, retains one existing stria cosine and skips generic detail. Low-roughness opaque dielectric M0 faces do not bake photographic white specular reflections into metallic maps or white pigment. The 0.1m nominal tile, 0.0034 UV-relative relief, colors and cluster density are authored approximations. Four maps/optional height, tint/repeats, Worker/cache and individual texture ownership remain unchanged. No complete crystal meshes, transparency/refraction, pleochroism, growth, mineral/chemical or copper-safety certification is added.

Use root factory `await ProceduralMaterial.create('azurite', {size:512,seed:7,heightMap:true})`; `preset.createMaterial({metallic:1})` explicitly overrides the factor without rewriting dielectric maps. Remove consumers before destroying the preset and its own textures.

`whiteoak` adds an authored warm olive-brown quarter-sawn face with broad long flush transverse ray flecks across straight grain and shallower recessed longitudinal vessels. It differs from White Ash without broad flecks, compact dense Lacewood scales and raised burls. It reuses the White Ash ring-porous/cached-noise kernel, adding eighteen six-value curved-ray records only for White Oak: 18,680 Float64 values / 149,440B of tables, not total RAM. Ray support including jitter stays within X≤0.46 and Y≤0.47124 owner-cell units, below 0.5. Sampling allocates nothing and uses no hashes, trigonometry, square roots or neighbor scans; unused generic detail is skipped. Rays alter pigment and finish, suppressing vessels at full coverage without raising height; only micrograin and vessel recesses shape normals. The 0.24m nominal tile, 0.0016 UV-relative relief, colors and density are authored approximations, not calibrated specimens. Opaque dielectric M0/explicit overrides, four maps/optional height, tint/repeats, Worker/cache and individual texture ownership remain unchanged. No pore meshes, transmission, species identification, resin chemistry, waterproofing, structural or sourcing certification is added.

Use root factory `await ProceduralMaterial.create('whiteoak', {size:512,seed:7,heightMap:true})`; `preset.createMaterial({metallic:1})` explicitly overrides the material factor without rewriting its dielectric maps. Remove consumers before destroying the preset and its own textures.

`clevispins` adds an authored silver side elevation of an unthreaded cylindrical pin: a short head projects on both sides of its shaft, with one enclosed circular transverse bore near the opposite end. The shaft has a shallow rounded crown, without a Linchpin retaining ring, bent R-clip wire, one-sided Gib head or a solid key end. An independent kernel follows existing seeded-pose/smooth-cover conventions, uniting a short rectangular head and straight shaft with small tip chamfers before cutting the bore. Sixteen six-value poses plus 96² grain total 9,312 Float64 values / 74,496B of tables, not total RAM. Maximum rotated support sqrt(0.38²+0.18²)×0.95+0.016=0.415452 remains inside the 0.5 owner boundary. Sampling allocates nothing and uses no hashes, trigonometry, square roots or neighbor searches; empty backing/full bores skip grain and generic detail noise is disabled. Steel metallic is 1, opaque bore/backing 0; default material factor 1 allows explicit 0. The 0.12m nominal tile, 0.0032 UV-relative relief and proportions are authored, not DIN measurements. Four maps/optional height, tint/repeats, Worker/cache and independent texture ownership remain unchanged, without complete cylindrical/through-hole meshes, transparency, inserted cotter/R-clip assembly, hinge physics, load ratings or standards certification.

Use root factory `await ProceduralMaterial.create('clevispins', {size:512,seed:7,heightMap:true})`; `preset.createMaterial({metallic:0})` explicitly overrides the factor without rewriting maps. Remove all consumers before destroying the preset and its own textures.

`whipcord` adds authored charcoal single steep ribs and same-dye warp/weft yarns: a selected warp-faced 3/1 draft with continuous three-pick floats, lower single-point weft bindings, densely packed warps and sparser wefts produces an approximately 72° diagonal. This is distinct from existing fine short-float Gabardine, paired Cavalry Twill wales, plain weave, transverse Grosgrain ribs and cut-pile Corduroy. It reuses the existing profiled-weave/whole-float tables and smooth yarn shoulders rather than creating another cloth kernel; 4×4×6 profiles plus 128² grain total 16,480 Float64 values / 131,840B of tables, not total RAM. Sampling allocates nothing and performs no hashes, trigonometry or square roots; unused generic detail noise is skipped. The 0.06m nominal tile, 0.0016 UV-relative relief, yarn counts and dye are authored approximations; 3/1 is not a universal Whipcord specification. Existing opaque dielectric M0/override1, four maps/optional height, tint/repeats, Worker/cache and individual texture ownership remain unchanged, without translucency, fiber/cloth meshes, anisotropic shading or garment physics.

Create the preset with root-public `ProceduralMaterial.create('whipcord', {size:512,seed:7,heightMap:true})`, then explicitly opt into POM with `preset.createMaterial({finish:{heightScale:0.0016}})`; it remains disabled otherwise. Remove consumers before destroying the preset; material creation does not transfer texture ownership and is not cloth displacement or collision.

`vanadinite` adds authored orange-brown raised hexagonal crystal rims with one smaller aligned recessed hexagon and a darker flat opaque floor over pale rough mineral backing. Unlike solid flat Pyromorphite/Red Beryl terminations, four-sided Bismuth hoppers, pointed crystals or transparent tubes, this profile selects a single recessed termination. An independent kernel follows existing smooth-hexagonal-half-plane/seeded-pose conventions, separately blending the outer rim and inner depression rather than introducing max/absolute radial-distance seams. The 5×5×6 poses, 8² cloud and 128² grain total 16,598 Float64 values / 132,784B of tables, not total RAM; support (0.24+0.05)/sqrt(0.75)+0.06=0.394863 stays below the 0.5 owner boundary. Sampling has no allocation, hash, trigonometry, square root or neighbor search and skips generic detail noise. The 0.1m nominal tile, 0.0038 UV-relative relief, palette and density are authored approximations. Opaque dielectric M0/explicit overrides, four maps/optional height, tint/repeats, Worker/cache and independent texture ownership remain unchanged; no complete crystal-prism/cluster mesh, transparency/refraction, growth/genesis simulation, chemistry/XRD, provenance or lead-safety certification. Use `await ProceduralMaterial.create('vanadinite', { size: 512, seed: 7, heightMap: true })`; remove consumers before destroying the preset and its owned textures.

`tabwashers` adds authored flat silver annuli with one closed round bore and exactly one straight-ended external flat lug. Ring and tab share one plane, unlike split-lock, internally toothed, spherical or cup washers. An independent kernel follows seeded-pose/compact-cover conventions: smooth disk and rectangular covers are united before cutting the round bore. The 4×4×6 poses plus 96² grain total 9,312 Float64 values / 74,496B of tables, not total RAM. Maximum support sqrt(0.43²+0.09²)×0.95+0.02=0.437352 stays below the 0.5 owner boundary. Sampling has no allocation, hash, trigonometry, square root or neighbor search; empty backing skips grain and generic detail noise is disabled. Steel metallic is 1, opaque bore/backing 0; the default factor is 1 with explicit override 0, and height/roughness/AO share coverage. The 0.1m nominal tile, 0.0028 UV-relative relief, proportions and palette are authored, not DIN measurements. Four maps/optional height, tint/repeats, Worker/cache and independent texture ownership remain unchanged; no mesh holes, transparency, bent-tab/nut assembly, anti-loosening mechanics, load or standards certification. Use `await ProceduralMaterial.create('tabwashers', { size: 512, seed: 7, heightMap: true })`; remove consumers before destroying the preset and its owned textures.

`whiteash` adds an authored pale warm-brown straight longitudinal face: coarser, more numerous earlywood vessels cluster in coplanar growth bands, while latewood openings are finer and sparse. Only longitudinal openings recess, darken and roughen; this is not a recolored dark-striped wood, endgrain round pores, raised grain or broad oak rays. Its independent kernel follows existing compact-vessel/cached-periodic-noise conventions. The 32×14×4 pore cache, 4×3 warp, 96×4 fiber and 128² grain total 18,572 Float64 values / 148,576B of tables, not total RAM. Local pore supports stay within x=0.2–0.8 and y=0.02–0.98; smooth coordinate warp does not clip owners. Sampling has no allocation, hash, trigonometry, square root or neighbor search and skips unused generic detail noise. The 0.24m nominal tile, 0.0018 UV-relative relief, palette and density are authored approximations, not photographic measurements. Opaque dielectric/metallic 0, optional height, tint/repeats/explicit factor overrides, Worker/cache and independent texture ownership remain unchanged; no board/tree geometry, transparent holes, wood physics, species/provenance or legal-sourcing certification. Use the root factory `await ProceduralMaterial.create('whiteash', { size: 512, seed: 7, heightMap: true })`; destroy the returned preset and its owned textures after removing consumers.

`gibheadkeys` selects an authored silver solid gib-head taper-key side elevation: on one flat face, one end carries a raised head with a chamfered outer end and a single vertical step to a straight shank whose top edge has a slight 1:100-class slope. It is not double-rounded `parallelkeys` or half-moon Woodruff keys. Four-by-four slightly rotated, jittered and scaled poses use 96 cached values plus 96² grain: 9,312 Float64 values / 74,496 B of tables, not total RAM. Maximum support sqrt(0.42²+0.2²)×0.97+0.025=0.476232 stays below the 0.5 owner boundary. Sampling has no allocation, hash, trigonometry, square root or neighbor search; empty backing skips grain. Metal face, height, roughness and AO share the same cover; authored metallic maps are 1 on steel and 0 on the opaque backing, with default material factor 1. The 0.2 m nominal tile, 0.0022 UV-relative relief and silver palette are authored approximations, not measured dimensions, fits or standards. Four maps, optional height, tint/repeats/Worker/cache and separate texture ownership are unchanged. No full 3D key body/top face, keyway/hub fit or extraction action, tolerance, material/load rating or standards-compliance certification is added. Use the root factory `await ProceduralMaterial.create('gibheadkeys', { size: 512, seed: 7, heightMap: true })`; destroy the returned material and its owned textures when finished.

`grosgrain` selects an authored cool grey-blue grosgrain surface: fine dense longitudinal warp alternates one over one across broader single rounded transverse ribs, with smooth two-sided crown falloff, crossing lift, fine fibers and lower opaque interstices. It is not Faille’s broad flat ribs, Poplin’s shallower crowns, Ottoman’s paired cords, balanced plain cloth, open mesh or long satin floats. Only the existing continuous-yarn constructor’s crown selection is extended; its complete point evaluator is verbatim unchanged, without new per-point allocation, hash, trigonometry, search or runtime dependencies. Parameters live in `src/data/materials.ts`. The reused 128² grain holds 16,384 Float64 / 131,072B of tables, not total RAM; warp/weft supports 0.21/0.46 stay below the 0.5 owner boundary and lifts fade out before owner changes. The 0.025m nominal tile, 0.00045 UV-relative relief, density and dye are authored approximations, not photographic/textile measurements. Opaque dielectric rendering, default metallic=0, explicit factor overrides, height/tint/repeats, Worker/cache and separate texture ownership remain unchanged. No selvage/ribbon mesh, Petersham scalloped edges, transparency, drape/stiffness/strength physics, anisotropy or polyester/fiber-content/thickness/laundering certification is added. Use the root factory `await ProceduralMaterial.create('grosgrain', { size: 512, seed: 7, heightMap: true })`; destroy the returned material and its owned textures when finished.

`pyromorphite` selects authored yellow-green flat hexagonal crystal termination faces scattered over pale rough granular mineral backing: raised smoother faces retain six straight sides, varied orientations/sizes and nearly flat tops. It is not green Smithsonite’s botryoidal domes, red Red Beryl, round spots or square tablets. This preset approximates only the ends of hexagonal prisms, not whole prismatic/barrel crystals, needles, crystal-cluster mesh or transparent refraction. The existing Red Beryl constructor and complete point evaluator are reused, selecting a preset by kind without new per-point allocation, hash, trigonometry or search. The 6×6×8 poses, 8² cloud and 128² grain total 16,736 Float64 / 133,888B of tables, not total RAM. Maximum support (0.18+0.13)/sqrt(0.75)+0.10=0.457958<0.5 stays inside its owner. The nominal 0.1 m tile, 0.0048 UV-relative relief and yellow-green dye are authored approximations, not measured specimen color or dimensions. Opaque dielectric rendering, default metallic=0, height/tint/repeats, explicit factor overrides, Worker/cache and independent texture ownership remain unchanged; there is no chemical/XRD identification, mineral-genesis/provenance or lead-safety certification.

`kingwood` selects an authored polished, nearly straight longitudinal deep red-brown heartwood face: unequal fine purple-black streaks lie flush with the field, while only sparse short vessels are recessed, darker and rougher. It is not cream-pink Brazilian Tulipwood, amber-brown Macassar, solid-purple Purpleheart, equal pinstripes, raised grain ribs or the reference photographs’ cathedrals, eyes or yellow sapwood. Only the existing Macassar/Tulipwood/Zebrawood/Bocote constructor’s fineStreaks/streakPreset selection is extended; its complete point evaluator is verbatim unchanged, without new per-point allocation, hash, trigonometry or search. Parameters live in `src/data/materials.ts`. The 32×20×4 pore cache plus 32×4 warp, 36×4 width, 64×4 fiber and 128² grain total 19,472 Float64 / 155,776B of tables, not total RAM. Maximum band support is 0.3×(0.18+1.25)=0.429<0.5; pore supports remain within x=0.17–0.83 and y=0.08–0.92 of their cell, avoiding owner truncation. The nominal 0.24 m tile, 0.0016 UV-relative relief and dye are authored, not measured grain. Opaque dielectric rendering, default metallic=0, height/tint/repeats, Worker/cache and independent texture destruction remain unchanged; there is no board/tree mesh, aging/oil/physical-property/toxicity model, current-regulation/legal-sourcing, provenance or species certification.

`faille` is opaque ivory plain-weave ribbed cloth: fine dense warp alternates one over one with broad, flatter single weft ribs above lower opaque interstices, with real crossing lift and fine fiber detail. It is neither Ottoman’s paired cords nor batiste’s balanced yarns. Only the existing continuous-yarn sampler’s constructor selects the flatter weft crown; its entire point evaluator is reused verbatim, with no added per-point allocation, hash, trigonometry or search. Dye, roughness, relief, yarn density/support and crown live in `src/data/materials.ts`; the nominal 0.03 m tile is authored, not measured thread density or fiber size. Opaque rendering, default metallic=0, explicit factor overrides, height/tint/repeat, Worker/cache and independent texture destruction remain unchanged; cloth transmission, thickness/drape simulation, anisotropy and fiber-content certification are not provided.

`celestine` selects authored pale-blue broad flat tabular celestine faces on neutral rough mineral backing: five-by-five groups of three locally parallel raised plates with staggered ends are brighter and smoother than their host—not cream Barite, orange near-square Wulfenite, narrow dark-blue three-raised-stria Kyanite or round caps. Only kind/preset selection is added; the complete existing Barite/Kyanite evaluator is verbatim unchanged, retaining its stria cosine without new per-point allocation, hash, neighbor search or runtime dependency. All 802 old 32px four-map outputs and seven adjacent minerals' 32/512 three-seed five-map outputs remain byte-identical. Twenty-five six-value cached poses plus 128² grain use 16,534 Float64 / 132,272B of tables, not total RAM. Maximum rotated corner reach sqrt((0.18+0.083)² + (0.27+0.12×0.083)²)×0.96 + jitter 0.04 = 0.408754 < 0.5 prevents owner changes from cutting plates. The 0.1m nominal tile, 0.0025 UV-relative relief and pale-blue palette are authored approximations, not measured specimens, plate thickness in metres or calibrated mineral optics. Opaque M0, optional height, tint, repeats, Worker, cache and independently owned textures remain; transmission/refraction, actual geode/crystal mesh, fibrous/prismatic forms, elemental/mineral/origin/value and safety certification are not added. Use the root factory `await ProceduralMaterial.create('celestine', { size: 512, seed: 7, heightMap: true })`; destroy the returned material and owned textures when no longer needed.

`braziliantulipwood` selects an authored polished Brazilian tulipwood longitudinal face: unequal-width, nearly straight pink-red streaks lie flush with a warm cream-yellow field, with only sparse short vessels recessed, darker and rougher—not American Tulip Poplar, black Macassar streaks, horizontal grain, equal pinstripes or raised wooden ribs. It reuses the complete Macassar/Zebrawood/Bocote kernel with constructor-only fineStreaks/streakPreset selection and warp-cache dimensions; the per-point evaluator is verbatim unchanged. All 801 old 32px four-map outputs and seven nearby woods' 32/512 three-seed five-map outputs stay byte-identical, with no new per-point allocation, hash, trig, sqrt or runtime dependency. The 32×20×4 pore poses, 24×4 warp, 28×4 width, 64×4 fiber and 128² grain total 19,408 Float64 / 155,264B of tables, not total RAM. Maximum pore half-width 0.08 < 0.25 owner margin and half-length 0.27 < 0.35, compact C1 shoulders and integer periodic caches preserve signed UV repeats. The 0.12m nominal tile, 0.0016 UV-relative relief and pink/cream palette are authored approximations, not measured specimens, thickness in metres or species identification. Opaque M0, optional height, tint, repeats, Worker, cache and independent texture ownership remain; board/tree geometry, aging/oil/hardness/toxicity, regulation, origin, value and legal-sourcing certification are not added. Use the root factory `await ProceduralMaterial.create('braziliantulipwood', { size: 512, seed: 7, heightMap: true })`; destroy the returned material and owned textures when no longer needed.

`batiste` selects an authored ivory fine-cotton plain-weave face: sixty balanced yarns per axis alternate one over and one under, with 240 fibers per axis, equally dyed/elevated warp and weft, raised crossings, subtle normals and opaque recessed interstices—not Poplin ribs, Ramie's deeper relief, long-float satin, printed checks, transparent mesh or brushed nap. It reuses the complete continuous-yarn core; only constructor ramie selection becomes balancedPlain with a selected preset. The per-point evaluator is verbatim unchanged, all 800 old 32px four-map outputs and seven adjacent textiles' 32/512 three-seed five-map outputs remain byte-identical. Only 128² noise uses 16,384 Float64 / 131,072B of tables, not total RAM; no float-profile/pose table or per-point allocation, hash, trig or sqrt is added. Even yarn counts and integer fiber/noise periods retain signed UV repetition; radius 0.42 < 0.5 and compact lift shoulders end before owner boundaries. The 0.04m nominal tile, 0.0002 UV-relative relief and 0.72 roughness are authored approximations, not measured yarn count/weight, physical thickness or mercerization. Opaque M0, optional height, tint, repeats, Worker, cache and independent texture ownership remain; translucent transmission, cloth/pleat/lace geometry, anisotropic BRDF, wash/breathability/fiber and safety certification are not added. Use the root factory `await ProceduralMaterial.create('batiste', { size: 512, seed: 7, heightMap: true })`; destroy the returned material and owned textures when no longer needed.

`wulfenite` selects authored orange near-square tabular crystals: flat raised faces of varied sizes and scattered orientations are brighter and smoother than dark-brown rough mineral backing—not domes, narrow blue blades, regular Barite triples or printed squares. A standalone leaf follows existing cached seeded-pose, periodic-noise and smooth compact-shoulder conventions. The 7×7 seven-value sites, 128² grain and 16² host use 16,983 Float64 / 135,864B of tables, not total RAM; occupancy 0.68 does not guarantee equal crystal counts across seeds. Maximum rotated corner reach sqrt(0.22² + (0.22×1.08)²) + jitter 0.16 = 0.483812 < 0.5 prevents owner changes from cutting faces. Squared-distance smooth products avoid center absolute-value cusps; sampling has no allocation, hash, trig, sqrt or neighbor scan, with inverse squares, directions and tone cached by the constructor. The 0.06m nominal tile, 0.003 UV-relative relief and orange palette are authored references, not specimen dimensions, plate thickness in metres or calibrated optics. Opaque M0, optional height, tint, repeats, cache, native Worker and independently owned textures remain; transmission/refraction, actual crystal/cluster mesh, bipyramidal form, lead chemistry/toxicity and mineral, origin, value or safety certification are not added. Use the root factory `await ProceduralMaterial.create('wulfenite', { size: 512, seed: 7, heightMap: true })`; destroy the material and its owned textures when no longer needed.

`lignumvitae` selects an authored polished dark olive-brown longitudinal lignum-vitae face: fine long grain and softly interleaved pigment remain coplanar, with only sparse short vessels recessed, darker and rougher—not golden Iroko, blood-red Bloodwood, purple Purpleheart or exaggerated zebra stripes. It reuses the complete Iroko/fine-grain core with constructor-only kind/preset selection and unused generic-detail exclusion; the per-point evaluator is verbatim unchanged. All 798 old four-map outputs and seven neighboring woods' 32/512 three-seed five-map outputs remain byte-identical, without new per-sample allocation, hash, trig, sqrt or runtime dependencies. The 32×20×4 pore poses, 3×4 warp, 256×10 fiber and 128² grain use 21,516 Float64 / 172,128B of tables, not total RAM. Maximum vessel half-width 0.06 is below its 0.25 owner margin and half-length 0.21 below 0.35; band support 0.46 < 0.5, five integer bands and periodic caches retain C1 and signed UV periods. The 0.12m nominal tile, 0.002 UV-relative relief, roughness 0.32 and olive-brown palette are authored references, not measured fiber sizes, thickness in metres or luster. Opaque M0, optional height, tint, repeats, cache, native Worker and independently owned textures remain; no wood/vessel mesh, transparent pores, oil/varnish layer, directional BRDF, species/endgrain or Guaiacum/substitute identification, oil/density/self-lubrication properties, origin or legal-sourcing certification is provided. Use the root factory `await ProceduralMaterial.create('lignumvitae', { size: 512, seed: 7, heightMap: true })`; destroy the material and its owned textures when no longer needed.

`sateen` selects authored ivory five-harness filling-faced cotton sateen: one isolated warp binder per row and column in a 5×5 repeat, dispersed by a two-step satin counter, with the other four crossings forming continuous filling floats across four warp ends—not adjacent twill, plain weave, crossing-by-crossing beads or the existing purple warp-faced Satin. Only constructor preset selection changes; the former fineTwill flag is renamed fineCloth to include satin structure, and the complete per-point evaluator is unchanged. All 797 old 32px four-map outputs and seven adjacent fabrics' 32/512 three-seed five-map outputs remain byte-identical. The 55×55 yarns, 220×220 fiber frequencies, 5×5×6 float profiles and 128² grain use 16,534 Float64 / 132,272B of tables, not total RAM. Fifty-five is divisible by five, closing the draft at UV seams while avoiding an all-gap alias at 32px without resolution-specific branches. Radius 0.495 < 0.5, continuous floats and C1 yarn shoulders reuse the existing core without new per-sample allocation, hash, trig, sqrt or runtime dependencies. The 0.04m nominal tile, 0.0008 UV-relative relief, ivory palette and roughness 0.45 are authored references, not measured thread count, thickness, dye or luster. Opaque M0, optional height, tint, repeats, cache, native Worker and independently owned textures remain; no yarn/cloth mesh, transmission, drape physics, directional BRDF or cotton-content, fiber, textile-grade, finishing-process or durability certification is added. Use the root factory `await ProceduralMaterial.create('sateen', { size: 512, seed: 7, heightMap: true })`; destroy the material and its owned textures when no longer needed.

`parallelkeys` approximates a top view of double-rounded Form A parallel keys: solid silver-gray long bars with broad flat faces, parallel sides and two curved ends, smoothly beveled into dark, rougher dielectric backing. They are not cylinders, ellipses, square-ended bars, hollow rings or Woodruff segments. It follows the existing hardware seeded-pose and cached-grain pattern, using squared distance to a line segment for a bounded capsule footprint, with no per-sample allocation, hash, trigonometry or square root and no new runtime dependency. The 4×4 six-value poses plus 96² grain total 9,312 Float64 / 74,496B of tables, not total RAM; maximum rotated reach times scale plus jitter is 0.399525 < 0.5, preventing owner boundaries from cutting a key. The 0.12m nominal tile and 0.003 UV-relative relief are authored references, not CAD dimensions or displacement in metres. Metal tops remain separate from M0 backing; the factory defaults its metallic factor to 1 to preserve the map and still honors an explicit 0 override. Opaque four-map output, optional height, tint, repeats, cache, native Worker and independent texture ownership are retained. No key mesh, keyway assembly or mechanics is added, and DIN dimensions/tolerances, C45 composition, heat treatment, torque and safety are not certified. Use the root factory `await ProceduralMaterial.create('parallelkeys', { size: 512, seed: 7, heightMap: true })` and destroy the returned material when its owned textures are no longer needed.

`smithsonite` selects an authored apple-green botryoidal appearance: irregular rounded crowns join into one bounded relief layer, with brighter, smoother crowns and darker, rougher green interstices. It is not a flat green-dot pattern or sky-blue Hemimorphite with pale interstices. It reuses the complete smooth joined-cap core; only constructor preset selection and unused generic-detail exclusion change, with no added per-point allocation, hash, trig, sqrt or runtime dependency. The 0.12m nominal tile and 0.006 UV-relative relief are authored references, not measured crystal dimensions or displacement in metres. It stays opaque M0 with the existing optional height, tint, repeats, cache, native Worker and independent texture-ownership contracts; transmission, refraction, dispersion, clearcoat and crystal meshes are not added, and mineral identity, chemistry, provenance and physical properties are not certified. Create through the root with `await ProceduralMaterial.create('smithsonite', { size: 512, seed: 7, heightMap: true })`; destroy the returned material when its independently owned textures are no longer needed.

`macassarebony` approximates an authored polished longitudinal Macassar-ebony face: dark brown with unequal near-black streaks and fine sparse recessed vessels that are rougher and more occluded. Pigment stays coplanar—not carved grooves, board seams, pale-gold Zebrawood or closed-eye Bocote figure. It reuses the complete Bocote/Zebrawood kernel; constructor-only kind/preset selection chooses a 32×4 warp cache while both old kinds retain 3×5. The per-sample evaluator is verbatim unchanged. The 32×24×4 pores, 32×4 warp, 32×4 width, 64×4 fiber and 128² grain total 19,968 Float64 / 159,744B tables, not total RAM. Maximum band support is 0.39 < 0.5, each signed shoulder equation has a u-derivative lower bound of 1.76 > 0, and maximum vessel half-width/length 0.06/0.31 remain within their owners. Sampling adds no allocation/hash/trig/sqrt or runtime dependency. The 0.18m nominal tile, 0.0016 UV relief and brown palette are authored references, not measured growth rings, wood-fiber dimensions or displacement in meters. Opaque dielectric/M0, optional height, tint/repeats, Worker/cache and caller ownership retain their contracts; no board/vessel mesh, transparent holes, varnish layer or directional BRDF, and no species, endgrain/mineral-fill, mechanical/durability, origin/legal-sourcing or safety certification. Related Zebrawood tests now observe actual surfaces rather than copying private hash/noise code.

`serge` approximates authored matte navy balanced 2/2 Serge: equally dyed warp/weft stagger one yarn per row, with continuous two-over/two-under short floats on both axes, broad smooth yarn shoulders and weak grain—not printed diagonal stripes, crossing-by-crossing beads, plain weave or warp-faced 3/1. Constructor-only preset/fineCloth selection reuses the complete Surah/Lyocell kernel; the per-sample evaluator is verbatim unchanged. The 52×52 yarns, 208×208 fiber frequencies and four-step draft use 4×4×6 profiles plus 128² grain: 16,480 Float64 / 131,840B tables, not total RAM. Radius 0.495 stays inside each thread owner; C1 shoulders and signed periods remain, without new per-sample allocation/hash/trig/sqrt or runtime dependencies. Fifty-two yarns avoid the all-gap alias at the supported 32px minimum without a resolution special case. The 0.04m nominal tile, 0.004 UV relief and navy palette are authored references, not measured yarn density, fiber dimensions, thickness in meters or calibrated dye. Opaque dielectric/M0, optional height, tint/repeats, Worker/cache and caller ownership are unchanged; no fuzzy wool mesh, double-sided garment/drape/transmission physics or directional fabric BSDF, and no fiber, uniform-grade, warmth, durability, fire or acoustic certification.

`garterstitch` approximates an authored warm-cream garter surface: soft horizontal ridges carry staggered curved purl crowns and lower return arcs, uniform dye, weak grain and gentle seeded course wander—not a straight V/bar knitting chart, printed stripes, vertical ribbing, seed-stitch dots or metal. The standalone leaf uses existing cachedNoise/smooth with compact elliptical-ring and half-plane shoulders; three front neighbors and both half-cell return neighbors retain their support, with product unions and exposed underpasses rather than a max crease. The 24-column/20-ridge preset caches 96² grain plus a 24×20 course field: 9696 Float64 / 77,568B tables, not total RAM. Conservative full-ellipse row support is 0.465660 < 0.5, course half-width 0.49 < 0.5, and horizontal outer support 0.576906 is below the nearest discarded-neighbor distance 1. No per-sample allocation/hash/trig/sqrt is added. The nominal authored tile is 0.12m; actual height/normals create the relief, not printing. Opaque dielectric/metallic 0, optional height, tint/repeats, Worker/cache and ownership retain existing contracts. No complete intermeshed-yarn/fuzz mesh, elasticity/drape/two-sided garment construction, fiber composition, measured physical gauge or calibrated BRDF is supplied. Existing Seed Stitch and Rib Knit remain unchanged.

`woodruffkeys` approximates scattered silver-grey solid Woodruff-key faces: a straight chord and one circular arc bound a shallow disc segment, with seeded orientation, position, size and small tone changes—not coins, triangles, oblong slots or bored washers. Existing periodic cachedNoise/hash/smooth combine circular and half-plane compact C1 shoulders, nearly flat raised metal with weak grain and a dark matte dielectric backing, not transparent gaps. The constructor caches 4×4×6 poses plus 96² grain: 9312 Float64 / 74,496B tables, not total RAM. The rotated whole-disc support plus jitter is 0.434 < 0.5, so owner changes cannot cut a part; no per-sample allocation, hash, trig or sqrt is added. The nominal authored tile is 0.08m; opaque RGBA, optional height, tint/repeats, Worker/cache and texture ownership retain existing contracts. The default material metallic factor is 1 while the actual metal map separates parts from the dielectric ground, and explicit overrides still win. No thickness mesh, shaft/keyway assembly, load/material-grade/DIN/safety certification or photo-calibrated dimensions, color or BRDF is supplied.

`barite` approximates selected opaque pale-cream tabular baryte: locally parallel triples of broad four-sided plates with staggered ends, nearly flat faces smoother than a matte brown mineral host—not narrow blue three-ridged Kyanite, round caps, a tile grid or a color print. It shares the complete existing Kyanite blade sampler; only the original 0.05 face-tilt and 0.08 ridge-height coefficients move to its preset and are captured once by the constructor, while Barite selects 0 / 0.002. Old Kyanite values, multiplication order and output are preserved. No new synthesis engine or per-sample allocation/hash/trig/sqrt is added; the existing stria cosine remains. The 4²×6 poses plus 128² grain total 16,480 Float64 / 131,840B of tables, not total RAM. Plate half-width 0.09 stays below the nearest-blade owner half-pitch 0.095; maximum rotated bundle support plus jitter is about 0.419992, below the cell-owner half-width 0.5. Smooth product shoulders and signed periods remain. Nominal 0.08m tile and 0.003 UV relief are authored references, not measured crystal dimensions, thickness or meter-unit displacement. Opaque dielectric/M0, optional height, tint/repeats, Worker/cache and caller ownership remain unchanged. No transparency/refraction, real crystal mesh/complete specimen, cleavage optics or radial desert-rose cluster, nor composition, origin, value, density, use or safety certification is supplied. Related old Kyanite private-hash/pose assertions are replaced by blind connected-face/PCA transverse profiles detecting three real raised smoother ridges, not an implementation oracle.

`surah` approximates an authored warm copper-colored, balanced 2/2 fine silk-twill surface: two over/two under stepping one yarn per row, with continuous two-pick floats on both axes—not plain weave, warp-faced 3/1, grouped 2×2 basket weave, crossing-by-crossing beads or copper metal. It reuses the complete existing Lyocell-family weave sampler: constructor-only fineCloth/preset selection uses existing whole-run float profiles and equally dyed warp/weft; the per-sample evaluator is verbatim unchanged. The 60×60 yarns, 240×240 fibers and four-step draft use 4×4×6 profiles plus 128² grain: 16,480 Float64 / 131,840B tables, not total RAM; no new per-sample allocation/hash/trig/sqrt or runtime dependency. Radius 0.495 stays inside each thread owner; C1 shoulders and signed UV periods remain. Nominal 0.015m tile, 0.0007 UV relief and warm copper palette are authored references, not measured sett, fiber dimensions, geometry thickness, meter-unit displacement or calibrated dye. Opaque dielectric/M0, optional height, tint/repeats, Worker/cache and caller ownership remain unchanged. SILKNOW defines Surah only as soft twilled silk; Première Vision’s Silk Twill provides the two-over/two-under reference and its viewed photograph is blue, not copper. This does not make every Surah 2/2 or copper-colored. No silk-composition, origin, hand, durability or safety certification, true reverse-side/drape/transmission, directional silk luster or new sheen BSDF. Sixty yarns retain complete four-step repeats without the all-gap 32px sampling alias of 64 yarns; the adjusted nominal tile keeps authored yarn density unchanged, with no minimum-resolution special case.

`bocote` approximates a selected polished longitudinal Bocote face with a golden-brown body, high-contrast dark-brown to near-black grain and locally closed eye figure—not a claim that all Bocote has eyes, an endgrain anatomy diagram, pasted concentric targets or raised rings. It reuses the complete Zebrawood sampling kernel with only constructor preset selection; stronger authored phase warping folds longitudinal grain back into closed contours. Light and dark figure remain coplanar; only sparse short longitudinal vessels recess. A 16×8×4 pore table plus 3×5 warp, 24×4 width, 64×4 fiber and 128² grain total 17,263 Float64 values / 138,104 bytes of tables, not total RAM. There are no new point allocations, hashes, trigonometry, square roots or synthesis engine. Maximum band support 0.392 stays below the 0.5 phase-owner half-width; maximum vessel half-width 0.06 and half-length 0.31 fit inside the nearest owner margins 0.25 and 0.35. C1 shoulders and signed periods are retained. Vessels are an authored surface appearance, not circular copies of the few medium-to-large endgrain pores. The 0.24 m nominal tile and 0.0016 UV relief are not measured grain spacing, pore diameter, meter-valued displacement or wood thickness. Opaque dielectric maps (metallic 0), optional height, tint, repeats, Worker/cache and caller ownership are unchanged. No real vessel geometry, directional luster, aging or species/figure-origin/oil/finish/durability/mechanical/toxicity/sustainability certification is supplied. Use `await ProceduralMaterial.create('bocote', { seed: 7 })`.

`hemimorphite` approximates a selected sky-blue botryoidal mineral crust: irregularly sized and positioned rounded caps join across cells, leaving pale recesses and fine grain—not flat polka dots, a regular equal-bead grid, metallic copper or a complete stalactite mesh. It follows the existing cached C1 noise, compact circular support and weighted-globule conventions, but connects variable-radius caps through 3×3 periodic neighbors. Normalized weighted height stays inside one layer instead of adding overlap heights; the existing Chrysocolla and Botryoidal Copper leaves remain unchanged. An 8²×5 pose table, 128² grain and 5×7 plus 17×19 frost fields total 17,062 Float64 values / 136,496 bytes of tables, not total RAM. Seeds, radii and fixed weights are prepared at construction; sampling allocates nothing and performs no hashes, trigonometry or square roots, sharing one normalization reciprocal. Maximum support 0.72 is below the nearest omitted-neighbor distance 1.26. C1 shoulders, joined surfaces and signed UV periods are retained. Two C1 pigment frequencies avoid single-grid frosting; actual AO output is also checked against hard halos. The authored 0.12 m nominal tile and 0.008 UV relief are not calibrated specimen dimensions, meter-valued geometry displacement or mineral thickness. Opaque dielectric maps (metallic 0), optional height, tint, repeats, Worker/cache and caller ownership are unchanged. No transmission, refraction, microcrystal sparkle, complete specimen geometry or mineral/locality/filling/composition/hardness/value/safety certification is provided. Use `await ProceduralMaterial.create('hemimorphite', { seed: 7 })`.

`monkscloth` approximates a selected natural-cream coarse four-by-four Monk’s Cloth. Thirty-two warp and weft yarns alternate in 4×4 basket groups; three recessed internal grooves keep each group’s four yarns distinct, and individual floats remain continuous across four crossings—not 2×2 Hopsack, single-yarn plain weave, diagonal twill, painted checkerboard or merged wide strips. It reuses the existing whole-run float builder and point arithmetic; only constructor basket selection is extended from Hopsack to the appropriate preset. An 8²×6 profile table plus 128² grain retains 16,768 Float64 values / 134,144 bytes, not total RAM, without new point allocations, hashes, trigonometry, square roots or caches. Integer 32-yarn counts divide the eight-step draft, and radius 0.46 stays within owner half-width 0.5, preserving C1 shoulders and signed periods. Warp and weft use the same dye; base color does not bake fake checkerboard lighting, while genuine height/normal conveys four-yarn direction and float continuity. The authored 0.03 m nominal tile and 0.0018 UV relief are references, not measured yarn diameter, calibrated 7.5 count or metre-valued displacement. Matte opaque dielectric metallic-zero maps, recessed-interstice AO, optional height, tint/Worker/cache/repeats and ownership remain unchanged. No transparent holes, yarn geometry, embroidery/punch-needle interaction or cloth simulation is supplied. Not every Monk’s Cloth is claimed 4×4; Oxford double threads and white guidelines are not copied, and cotton content, brand, density, durability, care/shrinkage or safety are not certified.

`hopsack` adds navy 2×2 basket-weave suiting: 32 warp and 32 weft yarns, paired on both axes, with continuous two-pick floats and a recessed groove separating the two yarns in each group. It is not painted checkerboard, diagonal 2/2 twill or single-yarn plain weave. Both yarn systems use the same dye. It reuses the existing whole-run cloth profile builder without changing the sampling kernel: a 128² grain lattice plus 96 profile values total 16,480 Float64 values / 131,840 B of table storage, not total RAM. The authored nominal tile is 0.016 m and UV relief is 0.0025, not measured thread diameter or thickness. Opaque dielectric maps (metallic 0), optional height, tint, repeats, Worker/cache and caller ownership remain unchanged. Recesses are opaque shading, not transparent holes; no cloth geometry, simulation, fiber-composition or breathability certification is added.

`basswood` approximates a selected finely sanded unfinished longitudinal Tilia americana face: uniform pale cream/light tan color, low-contrast long straight grain and shallow micrograin, not every Tilia species, endgrain anatomy, coarse dark vessels, transverse curl, knots, coating or species identification. The Wood Database account and both raw/finished photographs were actually read/viewed; only the raw appearance is selected. The source explicitly describes diffuse porosity and medium, very numerous endgrain vessels: a smooth face approximation is not a claim of pore-free anatomy. Direct fallthrough reuses the formal NickelSilver two-cache affine field with a constructor-only preset choice. A 96×4 long-grain field and 128² micrograin total 16,768 Float64 values / 134,144 bytes of lattice arithmetic, not total RAM or texture-cache size. Lower pigment/height coefficients, a different long-grain axis and a pale cream palette distinguish it from merely setting a metal factor to 0 while retaining the old transverse brush. Every old NickelSilver key/value and point operation order remains unchanged. Each point retains two cached lookups with no new allocation, hash, trigonometry, square root, kind branch or neighbor scan; no unused zero-curl Anigre fields, third cache or second synthesizer are added. Fine color/roughness and very shallow height approximate sanded wood shading, not coarse grooves, raised strips, actual fibers or displacement. The authored 0.10 m nominal tile and 0.0012 UV relief are not photograph-measured thickness. Metallic maps and actual default/createMaterial factor are 0, AO 1/mortar 0; four opaque default maps and optional height retain options, tint, Worker/cache, repeats and ownership. No runtime dependency, mesh, coating shader, mechanical/acoustic/hardness/health or anatomical certification is added. At actual512, very shallow signed normal slopes primarily quantize to adjacent127/128 bytes; this does not claim larger resolved relief. Normal direction is checked against raw height slope rather than increasing relief to force a visible normal.

`sphericalwashers` approximates selected silver form-C-style stainless spherical washers as complete circular annuli intentionally flipped convex seating-face up. The normally upward flat bearing face, mating D/G conical seats, outward-rising straight cup-washer walls and three-wave spring washers are different surfaces. The actually viewed Halder stainless product photograph and section identify the spherical face on the underside in normal assembly; this preset explicitly reverses its display orientation instead of mislabeling the flat top as convex. Twenty-five fixed-center owners cache only per-ring tones and 128² grain, totaling 16,409 Float64 values / 131,272 bytes of field-table arithmetic, not total RAM or texture-cache size. Following the existing annular squared-radius C1 shoulders, lower opaque dielectric backing and cachedNoise conventions, the true spherical profile uses sqrt(R²-q), not a paraboloid, inverted cup cone or torus. This genuinely different geometry keeps a short independent case rather than adding profile dispatch or another closure to the old cup hot path. Only nonempty metal faces require one necessary square root and one grain lookup; no point allocation, hashing, trigonometry or neighbor scan is added. R 0.54 exceeds outer radius 0.36, leaving a spherical radicand of at least 0.162 throughout support and 0.14 clearance to the 0.5 owner half-width. Grain affects pigment/roughness only, not carved concentric grooves. The continuous inward-high/outward-low metal face is M1, round bores/backing M0, with coherent C1 partial coverage and AO 0.3/0.95; actual default/createMaterial factor 1 preserves authored B. The authored 0.10 m nominal tile and 0.025 UV relief are not DIN dimensions or measured thickness. Four opaque default maps and optional height retain options, tint, Worker/cache, repeats and ownership. No mesh holes, knurled sidewalls, transparency, mating-part reconstruction, tilt compensation, clamping/contact mechanics, grade/corrosion/hardness/load/DIN certification or photograph bundle is added.

`mungbeans` approximates selected intact dry green mung seeds viewed hilum-side up: green coats, a narrow dark-green hilar halo and a longer cream-white hilum. These are not cream black-eyed cowpeas, red adzuki, black gram (Vigna mungo), yellow dehulled splits, cooked beans, pods or sprouts. The actually viewed USDA/APHIS SeedImages photograph shows three seeds; its description says cylindrical to rhombic with often compressed ends. This preset deliberately uses stylized smooth rounded-oblong convex caps rather than claim exact truncated ends, wrinkles, dust-layer microstructure or full-volume reconstruction. It directly shares the formal eye-pigmented bean sampler through fallthrough with a constructor-only preset choice: 36 cosine/sine/base-coat pose triples plus 5×7 coat and 128² grain total 16,527 Float64 values / 132,216 bytes of field-table arithmetic, not total RAM or texture-cache size. A maximum half-length of 0.32 stays within the 0.5 owner half-width with 0.18 clearance; foreground sampling retains two cached lookups and an early lower-opaque-backing return, with no new point allocation, hash, trigonometry, square root, kind branch or neighbor scan. Halo and hilum affect pigment only, not engraved grooves, through-holes, split beans or raised caruncles; height remains the intact convex coat, with foreground AO 0.98 and backing AO 0.3. The authored 0.045 m nominal tile and 0.018 UV relief are not measured seed thickness or physical displacement. M0/mortar0, four opaque default maps and optional height retain existing options, tint, Worker/cache, repeats and ownership. No new mesh/runtime dependency or botanical, cultivar-identification, nutritional/health, optical or physical certification API is added.

`thomsonite` approximates a selected opaque pink/cream concentric-eye polished cut, not the rare green/black variety, basalt host or every Thomsonite specimen. A direct fallthrough reuses the formal Orbicularjasper sampler with only constructor preset selection: four cached center/inverse-squared-radius/three-or-four-ring values for each of 36 eyes, plus 96² grain and 8² matrix, total 9,424 Float64 values/75,392 bytes as an arithmetic table/record budget, not total RAM or texture-cache memory. Maximum radius 0.43 plus offset 0.04 equals 0.47, below owner half-width 0.5 by 0.03; compact squared-radial skirts return rings to a filled matrix before owner edges. The existing one cosine inside support is retained, not falsely reported as zero trigonometry; there is no new per-point allocation, hash, square root, kind branch or neighbor scan. Rings affect color/roughness only; independent height 0.4+0.004grain and AO 1 keep the face flush, with all old Orbicularjasper parameters/point arithmetic unchanged. The 0.048 m nominal tile and 0.004 UV relief are authored, not measured thickness. At most 0.000016 UV microheight span can quantize to the near-flat 8-bit floor in actual512 normals; it is not visible raised/carved ring relief. Four default opaque metallic-0/mortar-0 maps and optional height retain options, tint, Worker, cache, repeats and ownership without crystal/fiber geometry, transparency, mineral-growth, spectral/physical/geological certification or runtime dependency.

`nickelsilver` adds a subtly warm silvery opaque alloy sheet with long irregular fine brush grain and shallow micrograin, not elemental silver, silver plating, a lacquered coating, corrosion, hammered pits or 48 coarse carved grooves. It reuses the formal C1 periodic cachedNoise builder and existing one-closure-per-preset pattern: 4×192 brush plus 128² grain lattices total 17,152 Float64 values/137,216 bytes as an arithmetic lattice budget, not total RAM or texture-cache memory. There is no per-point allocation, hash, trigonometry, square root, new kind branch or neighbor scan; existing metal arithmetic/data stay unchanged. The 0.025 m nominal tile and 0.0012 UV relief are authored, not measured thickness. Metallic maps and both `material`/`createMaterial()` default factors are 1, with AO 1/mortar 0; four default maps and optional height retain options, tint, Worker, cache, repeats and ownership. Directional micro-normals do not add an anisotropic BRDF. No sheet geometry, coating/spectral/composition/grade/mechanical/physical certification or runtime dependency is introduced.

`lyocell` approximates one selected fine, uniformly beige-dyed opaque Lyocell twill face. The original Core Fabrics product and two actually viewed surface photos provide appearance references, not baked macro folds. The merchant states twill but no exact repeat: the four-phase 3/1 draft is an engine-selected interpretation, not an image-derived or merchant-certified weave count. A 0.012 m nominal tile, 48×48 yarns and 192-axis fiber frequencies reuse existing Huckaback whole-run profiles so each three-pick warp float remains raised through internal owner joins rather than becoming three crossing beads. Warp and weft share one dye tone, unlike two-tone denim, Ramie plain weave or open Huckaback figure. It reuses the Poplin textile family with constructor-only preset/tone/profile selection and related private-local name generalization, preserving every old data key/value and point arithmetic order. The 128² cached grain plus 4² six-scalar float profiles total 16,480 Float64 values / 131,840 bytes of arithmetic table/record budget, not total RAM or texture cache. No new point variant branch, allocation, hash, sqrt, trig or neighbor scan is introduced. M0/no grout, four opaque default maps, optional height, tint, Worker, cache, repeats and ownership remain. UV relief 0.0005 is not metre-valued thickness; nominal tile size is not measured from photos. No cloth physics, drape mesh, new anisotropy shader, Tencel brand alias, bundled photos, composition, physical, optical, strength, sustainability, OEKO-TEX or Pantone certification is implied.

`tigerwood` selects one warm reddish-brown polished long-grain Goncalo alves / Astronium-style heartwood face with irregular elongated dark-brown to near-black figure, not every stock sample (the primary source also shows unfigured stock). Commercial synonyms are not separate public kinds. It reuses Snakewood's bounded bent-ellipse pigment union with a 7-column / 2-row layout, two slots, chance 0.62 and longer 0.48+0.31 axes instead of creating a second wood synthesizer. The 96x6 wood, 128x8 fiber and 128-square micrograin tables total 17,984 Float64 values; 28 six-scalar shape records add 168, for 145,216 bytes of arithmetic table/record budget, not total RAM or texture-cache usage. Existing 3x3-owner/two-slot point work remains. No new point variant branch, hash, square root, trigonometry or allocation is added. Dark figure is pigment only over continuous fine wood height/roughness/AO, with M0, AO1, no grout, four opaque default maps and optional height. UV relief 0.002 is not thickness in metres; the nominal 0.18m tile is an engine choice, not image-derived dimensions. Existing tint, Worker, cache and ownership remain; no transparent resin, new clearcoat API, endgrain, plank gaps, bundled reference photos, runtime dependencies, wood anatomy, mechanical, species, finish or physical certification are implied.

`thulite` approximates a selected fine-grained pink/pale-mineral-mottled polished Thulite face: dense small pale grains within dominant pink, not a reconstruction of every pink zoisite, coarse dark accessory phase, host band or rough fracture. It shares the existing Unakite three-cache bounded-polynomial field, with one constructor-only variant selection and normalized base/inclusion-contrast scalars; every existing Unakite greenBase/pinkContrast key and point arithmetic order is retained, without a second compositor. A nominal 0.12 m tile uses 7² coarse / 37² medium / 191² fine lattices and 0.12/0.18/0.70 weights, changing to a fine-dominant distribution rather than only recoloring the palette. These are 37,899 Float64 values / 303,192 bytes of field tables, not total RAM or texture-cache size. Each point retains three cached lookups without new point branches, allocations, hashes, square roots, trigonometry or neighbor scans. C1 polynomial pigment does not make hard white grains, grout grids, false crystal ribs or depth/AO cuts. All domains share a nearly flat fine-micrograin polish with AO 1 / M0 / mortar 0 /actual default factor 0; UV relief 0.00012 is not meter-valued thickness. Opaque maps/optional height, tint, Worker, cache, repeats and ownership remain intact; this adds no mesh, transparent quartz, physical displacement, mineral/proportion/origin identification or physical/optical/healing certification API.

`blackeyedpeas` approximates selected dry ivory-cream oblong cowpea seeds viewed hilum-side up: a localized dark oval eye surrounds one short pale hilum on an intact convex coat. Eye and hilum change pigment only, not holes, split beans, engraved grooves or castor caruncles; this does not depict green pods, cooked beans or every cowpea cultivar. A nominal 0.06 m tile contains 5×5 fixed-center owners with seeded orientation and coat value; constructor-baked cosine/sine/base-coat values and shoulder reciprocals plus 5×7 coat and 128² grain total 16,494 Float64 values / 131,952 bytes of field tables, not total RAM or texture-cache size. It directly shares the formal convex-bean/capsule/C1 oval pigment-halo sampler with `mungbeans` through a constructor-only preset choice, retaining this kind’s original data and point arithmetic, two cached foreground lookups, an early backing return and no point allocations, hashes, trigonometry, square roots or neighbor scans. Height is solely the smooth convex body; fine grain affects pigment/roughness only. UV relief 0.025 is not thickness in meters; the metallic map and actual default factor are 0, with lower opaque backing retained. This adds no mesh, physical displacement, botanical/cultivar identification or physical/optical certification API.

`wavewashers` approximates selected circular silver closed three-wave spring washers: a continuous narrow metal annulus, a three-wave height profile consistent across the full-metal width at a fixed angle, and a central bore over lower opaque dielectric backing. A nominal 0.1 m tile has 5×5 fixed-center owners with seeded phases; constructor-baked amplitude/phase coefficient pairs and radial shoulder reciprocals plus 128² grain total 16,434 Float64 values / 131,472 bytes of field tables. Normalizing the cubic harmonic by r³ prevents false radial flare. Only nonempty metal faces require one necessary radial square root and one grain lookup; no point angles/trigonometry, hashes, allocations or neighbor searches are added, and empty bores never reach the denominator. Compact inner/outer C1 shoulders vanish before owner edges. Default PBR metallic=1 preserves M1 faces, M0 bores/backing and smooth partial coverage in the maps; everything remains opaque. No real mesh bores, displacement, spring compression or load simulation is added. The 0.02 relief is UV height, not thickness in meters. Existing normal/roughness/AO, optional height, neutral-backing tint behavior, repeats, NativeWorker/cache and independent ownership contracts remain unchanged. Not every wave washer has three waves; no SKU, alloy, DIN/ISO or load/deflection certification is implied.

`iroko` approximates a selected natural golden-brown Iroko long-grain face, with fine longitudinal color grain, gently warped light/dark ribbons and sparse elongated open-vessel recesses; it does not assign every Iroko sample the same color or cut. It extends the existing Padauk/Sapele/Wenge family with constructor-only sparse/fine-fiber parameter selection and a baked pore-shoulder reciprocal, not a second wood algorithm. Each point retains three existing cached lookups without new point branches, allocations, hashes, square roots, trigonometry or neighbor searches. A nominal 0.18 m tile has 36×12 vessel owners; four values per owner plus 3×4 warp, 256×8 fine-fiber and 128² grain total 20,172 Float64 values / 161,376 bytes. Grain/ribbons remain pigment on a flat face; only open vessels genuinely recess. Compact C1 pore shoulders vanish before owner edges; dark lower-AO cores remain opaque dielectric / M0. Existing periodic UV, normal/roughness/AO, optional height, tint, repeats, NativeWorker/cache and independent ownership contracts remain unchanged. The 0.003 relief is UV height, not displacement in meters. No wood aging, directional luster, species identification, durability or permeability model is added; African teak is a trade name, not genuine Tectona teak.

`ramie` approximates a selected natural off-white Ramie plain-weave swatch: equally dense fine warp/weft yarns, alternating 1/1 crossing lifts, fine longitudinal fibers and lower dark opaque backing. Ramie fiber does not imply that every fabric has this weave or color. The existing balanced plain-weave family gains constructor-only uniform-tone/equal-yarn selection, not a second weaving algorithm or a new pose table. Each point uses the existing 128² grain lookup; total cache is 16,384 Float64 values / 131,072 bytes, with no point allocations, hashing, sqrt, trig or neighbor search. A 0.04 m nominal tile, 48×48 yarns and 192×192 directional fiber cadence are not measured swatch density or dimensions. Yarn support half-width 0.42 and lift half-length 0.46 vanish before the owner half-width 0.5, with established C1 yarn/lift shoulders, fiber joins and cache interpolation. Equal ivory tones and equal yarn crowns/bases preserve balanced 1/1 relief rather than blue/white Chambray, coarse-weft Poplin ribs, satin long floats or brushed pile. Interstices are lower opaque backing, not alpha-cut holes, true transmission, drape/cloth physics or shader anisotropy. M0/factor 0, opaque maps, optional height, tint, workers, cache, repeats and ownership remain unchanged. A 0.004 UV relief is not metre-valued geometry displacement; supplier composition, 80 gsm, width, tensile strength, breathability or other mechanical/environmental properties are not certified.

`eudialyte` approximates interlocking angular dark-raspberry fragments, black matrix and fine dark intergrain contacts in a selected cabochon. It depicts the dominant colors of eudialyte-bearing multi-mineral rock, not a pure single crystal or a separate model of every pale accessory phase. A 0.12 m tile has 8×8 owners with two independent seeded sites each: 384 cached center-x/center-y/baked-pigment values plus 192² grain, totaling 37,248 Float64 values / 297,984 bytes. Existing compact weighted-crystal, Howlite squared-weight-overlap and cachedNoise conventions are reused: sites in 0.2–0.8 and radius-1.18 cap¹⁶ weights normalize over 3×3 owners / 18 sites. The worst own-site squared distance 1.28 is below support² 1.3924, so total weight and its square stay strictly positive without epsilon or a fake fallback; omitted sites cannot enter before distance 1.2, after support vanishes. sum(weight²)/sum(weight)² through a smooth 0.50–0.56 shoulder creates fine dark contacts without nearest-owner/max/min junction creases; fine noise multiplicatively varies pigment and supplies micrograin. A shared reciprocal normalizes pigment and overlap. Each point uses one grain lookup and a fixed local site search, without allocations, hashing, sqrt or trig. Pigment classes are selected once in the constructor, not by a UV hard threshold; shared detail is bypassed. No false parallel crystal ribs are added: fragments and matrix share one fine-micrograin polished plane with AO 1 / M0 / mortar 0 / factor 0, without carving intergrain contacts into cavities. Opaque maps, optional height, tint, workers, cache, repeats and ownership are unchanged. A 0.00012 UV relief is not metre-valued geometry displacement; no transparent refraction, complete mineral proportions, chemical/origin/identification, healing or radiation-safety certification is added.

`unakite` approximates the dominant mottled green/salmon-pink contrast and fine granular interfaces of a selected polished Unakite face on one level cut plane. It does not identify the rock as a single mineral or separately track all quartz/accessory phases. Existing cached-periodic-noise and polished-plane conventions are reused: a 0.12 m tile caches 8² coarse, 24² medium and 96² fine layers, totaling 9,856 Float64 values / 78,848 bytes. Positive weights 0.70/0.22/0.08 sum to one; smooth(smooth(mixture)) followed by smooth(tone²) creates bounded polynomial green/pink contrast without hard thresholds, nearest-owner color blocks or false longitudinal crystal ribs. Fine noise supplies both fine pigment and micrograin, without a duplicated cache. Each point uses three cached field lookups, no allocations, hashing, sqrt, trig or neighbor search; shared detail is bypassed. Green/pink domains do not directly drive height or AO: all share the same fine-micrograin polished plane with AO 1 / M0 / mortar 0 / factor 0 and unchanged opaque maps, optional height, tint, workers, cache, repeats and ownership. A 0.00012 UV relief is not metre-valued geometry displacement. There is no transparent quartz, precise mineral-proportion/composition/origin/hardness identification, crystal-face geometry, optical interference or healing certification.

`safflowerseeds` approximates selected white whole Carthamus tinctorius safflower achenes: broad-apex/narrow-base obovate outlines, smooth ivory hulls, pale yellow front-visible longitudinal ribs and a small depressed scar along one lateral ridge. It is not a hulled kernel, black-striped sunflower hull, flat pumpkin seed, dark mottled castor bean or central large bean eye. A 0.06 m tile uses 6×6 seeded rotated/offset bodies, five-value poses and 128² grain: 16,564 Float64 values / 132,512 bytes. Existing asymmetric cap/cap² contour, C1 smooth body/squared-rib shoulder and elliptical-scar conventions are reused. Two front-visible pale ribs approximate the referenced four-ridged achene, not a complete four-angled 3D cross-section. Ribs and scar follow each fruit’s local axes; dome, raised ribs and shallow lateral scar separately affect height rather than passing painted bands off as relief. Conservative rotated per-axis support plus jitter is below 0.475, within one owner, without point allocations, hashing, sqrt, trig or neighbor search; shared detail is bypassed. Opaque maps, optional height, M0/factor 0, tint, workers, cache, repeats and ownership are unchanged. UV relief is not metre-valued geometry displacement. There are no pappus scales, complete hull geometry, transparent cuts, precise four-angled cross-sections or seed identification/germination/cultivar/nutrition/scale certification; not every specimen is claimed to lack dark stripes or a pappus.

`snakewood` approximates a selected straight-grained Snakewood (Brosimum guianense) face: irregular bent solid dark-brown to nearly black patches and smoothly joined overlapping figure on reddish-brown wood, with fine longitudinal fibers continuing across the dark pigment. It is not snakeskin scales, birdseye pits, pale medullary rays, an endgrain diagram, a decay-crack network or zebrawood continuous dark streaks. A 0.16 m tile uses 8×12 owners with two independent sparse seeded slots each: six center/inverse-size/slope/bend values per slot, plus 96×6 wood, 128×8 fiber and 128² grain, totaling 19,136 Float64 values / 153,088 bytes. A fixed 3×3 neighborhood considers at most 18 candidates, using existing compact bent-ellipse/C1 shoulder and complement-product smooth-union conventions for freely offset variable-size patches, without point allocations, hashing, sqrt, trig or max-union creases. Worst-case x/y support is 0.896/0.4, vanishing before omitted sites can enter at distance 1.2; owner changes do not cut off motifs. Anisotropic cached scalar grain forms straight fibers, not a new anisotropy shader. Dark patches change pigment only; all share one fine-grain polished plane and roughness with AO 1 / M0 / mortar 0, unchanged opaque maps, optional height, tint, workers, cache, repeats, ownership and factor 0. A 0.003 UV relief is not metre-valued geometry displacement. No scales, raised patches, holes, wood identification, origin/legal-trade/density/hardness/durability certification or aging simulation is added.

`squareholewashers` approximates flat silver-metal washers with round exteriors and central square through-openings: 25 individually offset and rotated complete round outlines surround four straight inner sides and retained square corners exposing the same low opaque nonmetallic backing as the outer gaps. This is not the square exterior / round bore of squarewashers, a conical cupwasher, a blind screw socket or a toothed lock washer. A 0.10 m tile retains five-value cosine/sine/center/tone poses plus 128² grain: 16,509 Float64 values / 132,072 bytes. Existing squared-radius smooth outer shoulders combine with paired-axis smooth half-plane products for the square opening; metal coverage is outer × (1 − hole), without a max crease or a substituted circular bore. Angles and reciprocals are cached, with no point allocations, hashing, sqrt, trig or neighbor search. Maximum outer support plus jitter is 0.39 < 0.5, inside one owner; shared detail is bypassed. Flat lands are M1, holes/gaps M0 and edges smooth partial coverage, with AO and height following the actual coverage. Opaque maps, optional height, tint, workers, cache, repeats, ownership and factor 1 remain unchanged. UV relief is not metre-valued geometry displacement. There are no transparent geometry holes, metallic socket floors, backfaces, bolts, assembly, anti-rotation/load simulation, DIN conformance, coating/material certification or claim that all square-hole washers are metallic.

`larvikite` approximates a polished dark-grey Larvikite face with sparse static blue-grey feldspar flashes and grain-local parallel tonal traces. It reuses the existing diorite/anorthosite/gabbro coarse-feldspar sampler rather than duplicating a rock algorithm. A 0.12 m tile uses 10×10 seeded sites, six position/tone/orientation/phase values per site and 128² grain: 16,984 Float64 values / 135,872 bytes. Normalized high-order compact weights over a fixed 3×3 neighborhood form a continuous coarse-grained mosaic; local bands reuse existing C1 smooth shoulders without point allocations, hashing, sqrt or trig. Radius-1.2 support vanishes before omitted sites can enter at distance 1.3; the own site is at most squared distance 0.98 < 1.44, keeping the denominator positive without a hole-filling fallback. All grains share a fine polished plane with AO 1 / M0 / mortar 0 and unchanged opaque maps, optional height, tint, worker, cache, repeats, ownership and factor 0. Real Larvikite blue Schiller involves light interference in cryptoperthitic feldspar intergrowths; this preset is only a fixed photographic-appearance approximation, not angle-dependent blue optics, physical lamellae, emission, transparent crystals, raised grains, composition/origin identification or healing certification. Its 0.00012 UV relief is not meter-unit geometry displacement, and tonal traces are not measured atomic-scale exsolution lamellae.

`cupwashers` approximates the countersunk-finishing style of metal cup washer: 25 individually offset complete silver annuli have central bores exposing low opaque nonmetallic backing, lower inner lands, straight conical walls and high outer rims—not a continuous countersunkmetal sheet, a flat washer, a split lock washer, a blind screw socket or a 90-degree basic cup. The 0.10 m tile retains 16,459 Float64 values / 131,672 bytes for three-value poses and 128² grain. Squared-radius smooth shoulders define inner and outer support; C1 quadratic endpoint shoulders join a genuinely linear radial cone wall. Each covered-metal sample uses one necessary sqrt, with empty bores/backing returning early; there is no point hashing, trig, allocation or neighboring-owner scan, and shared detail is bypassed. Maximum support plus jitter is 0.385 < 0.5. Rims/walls are M1, bores/gaps M0 and edge coverage blends smoothly; default and createMaterial() metallic factors are both 1. Opaque maps, optional height and existing tint, worker, cache, repeats and ownership remain unchanged; UV relief is not meter-unit geometry displacement. No transparent hole, geometry/backside, screw/assembly, standardized angle, load/torque/pull-through performance or electrical-insulation safety is added or certified.

`makore` approximates a selected reddish-brown mottled/curly Makore veneer: fine longitudinal grain carries transverse curls of locally varying, fading strength and sparse relatively wider short recessed longitudinal vessels—not uniform washboard stripes, straight zebrawood streaks, cream-gold Anigre or an endgrain pore diagram. It reuses the Anigre synthesizer and old arithmetic order; only the new kind adds a 5×9 C1 figure gate. Twenty-two integer-period curls change pigment, not height, roughness or AO; only vessels genuinely recess. The authored 0.18 m nominal tile retains four-value pores over 28×18 owners plus 3×5 warp, 96×4 fiber, 128² grain, 5² cloud and 5×9 figure: 18,869 Float64 values / 150,952 bytes of tables, not total RAM. Seed data is cached in the constructor; points allocate nothing and use no hashes, trigonometry, square roots or neighbor searches; generic detail is bypassed. Maximum pore half-width 0.04 / half-length 0.16 stay inside each owner, and the conservative main-axis curl derivative bound is 10.75 > 0. Opaque dielectric metallic-zero maps, optional height, tint/Worker/cache/repeats and ownership remain unchanged; UV relief is not metre-valued geometry displacement. Not all Makore is claimed curly; no photographs, directional optical sheen, fiber geometry, anatomical simulation or species, physical pore density, finishing/aging, mechanical or safety certification is supplied.

`anigre` approximates a selected light golden-pink figured Anigre veneer: irregular transverse curl bands cross fine longitudinal fibers and sparse open vessels—not zebrawood dark longitudinal streaks, birdseye knots, an endgrain diagram or raised corrugations. The 0.16 m tile uses 24 integer-period curl phases with seeded warp and the existing C1 smooth periodic-profile convention. Curl changes pigment only, not height, roughness or AO; only open vessels recess. Four-value pores over 32×16 sites, 3×5 warp, 96×4 fiber, 5² cloud and 128² grain retain 18,856 Float64 values / 150,848 bytes. Point sampling allocates nothing, hashes nothing, uses no sqrt/trig or neighboring-site scan, and bypasses shared detail. Pore support vanishes inside each owner; the conservative phase-axis derivative lower bound is 15 > 0. Opaque dielectric maps, metallic 0 / mortar 0 and existing tint, worker, cache, optional height, repeats and ownership remain unchanged. This is an appearance approximation, not a guarantee that every Anigre board is figured, species identification, a scanned section, a directional optical shader, rippled geometry or durability/mechanical/safety certification; UV relief is not meter-unit geometry displacement.

`adzukibeans` approximates red adzuki seeds (Vigna angularis) with burgundy-to-russet coats, one long central cream hilum and an intact convex face—not flattened lentils, an apical castor caruncle or an open split. A 0.05 m tile has 25 seeded rotated oval seeds. A thin round-ended capsule changes hilum pigment only: it neither raises nor engraves height and does not cut an AO hole. Five-value poses, a 5×7 coat field and 128² grain retain 16,544 Float64 values / 132,352 bytes. Squared-ellipse and squared-capsule smooth shoulders reuse the existing C1 convention; point sampling allocates nothing, hashes nothing, uses no sqrt/trig and bypasses shared detail. The maximum rotated support is 0.28 + 0.035 jitter < 0.5; the conservative hilum q bound is about 0.291 < the 0.88 full-body boundary, keeping the scar inside one coat and owner. Coat tones, cream scar, fine grain and backing use opaque dielectric maps / optional height with default metallic 0 and unchanged tint, worker, cache, repeats and ownership. The 5.6×4.4 mm outline is a tile-reference scale only; UV height is not meter-unit geometry displacement. This stylized outward-facing seed per cell is not a scanned cultivar, packed seed geometry, internal cotyledons, SEM microcracks or food/optical simulation.

`amazonite` approximates a polished aqua feldspar face with broken intersecting pale streaks and fine cloud variation—not circular larimar pools, a complete grid, recessed cracks, raised threads or transparent crystals. Two integer UV phases run along (32,8) / (−8,32), reusing existing band/cached-field and C1 smooth-shoulder conventions. Finer seeded warp, variable widths and gates break regular long stripes; bounded product union smooths crossings. The 5² cloud, 7×9/9×7 warp, 32×16/16×32 widths, 8×32/32×8 gates and 128² grain cache 18,071 Float64 values / 144,568 B once. No per-point allocation, hashing, trigonometry or square roots; needsDetail bypass remains. Maximum phase support 0.1485 is below wrap half-width 0.5; the signed shoulder equation has a positive primary-axis derivative bound 19.898. Every phase is opaque M0/mortar0/AO1, with pigment-only streaks on one plane. The theoretical grain-height span 0.000002 UV corresponds to 0.12 μm at the 0.06 m reference tile / 0.001 UV relief, not measured lattice detail or displacement geometry. No optical twinning, cleavage fracture, geological or healing simulation. Existing options/tint/Worker/cache/ownership remain unchanged.

Tatami (`tatami`) has yellow-green rush ridges, recessed gaps, transverse bindings alternating over and under neighboring reeds, and fine longitudinal fibers. Its four seeded periodic maps remain opaque dielectric with metallic 0; one UV tile represents 0.16 m. This is surface shading/normal mapping only, not reed geometry, transparent openings or physics; existing options, repeats and ownership are unchanged.

Fruit-rind surfaces include pineapple with golden/olive diamond-like polygonal eyes in diagonal staggered rows, narrow brown-green recessed seams and a recessed central eye within a rounded crown; strawberry with red skin, irregularly staggered elongated recessed pockets and small ochre seeds inside them; and lychee with pink/red densely packed irregular polygonal raised tubercles, softened pointed crowns and narrow dark recessed fissures. These are distinct from overlapping pinecone scales, round orange-peel glands and orderly pineapple eyes, respectively. All three are opaque dielectrics with zero metallic B channel and default factor, using the existing seeded deterministic periodic baseColor, normal, metallicRoughness and occlusion maps. Relief is shading/normal mapping only: no geometry, displacement, transparency, subsurface scattering (SSS), transmission or new BRDF. Existing options, physical repeats, caller ownership and borrowed-map lifetimes are unchanged.

Fungal surfaces include mushroomgills with cream/tan densely spaced radial long gills and shorter outer gills around quiet attachment zones; morel with warm ochre/brown irregular elongated recessed chambers and narrow rounded connecting ridges, not regular hexagons or positive coral labyrinths; and bracketfungus with overlapping thin cream/rust/brown fans, broad multitone concentric zones, pale smooth margins and fine velvet-like grain. All three are opaque dielectrics with zero metallic B channel and default factor, using the same four seeded deterministic periodic maps and physical repeats. Relief is surface shading/normal mapping only, without geometry, displacement, alpha, subsurface scattering, transmission, biological growth simulation or a new BRDF; options, caller ownership and borrowed-map lifetimes are unchanged.

Municipal surfaces include tactilepaving with muted safety-yellow cement/ceramic tiles, recessed joints and orderly flat-topped truncated warning domes with rounded shoulders and subordinate fine grain; roadmarking with broad worn off-white painted bands, coherent paint loss exposing dark granular asphalt and slightly raised rounded paint edges smoother than the substrate; and draincover with a rectangular cast-iron frame, parallel elongated rounded-ended slots, raised bars and a crossbrace, cast grain and worn rounded shoulders. Tactilepaving and roadmarking are opaque dielectrics with zero metallic B channel and default factor. Draincover uses default metallic factor 1, metallic B=1 on full frame/bars/crossbrace and B=0 on opaque shaded recess floors and outside, with smooth transitions at rounded shoulders. All use the same four seeded deterministic periodic baseColor/normal/metallicRoughness/occlusion maps and physical repeats; existing options, caller ownership, borrowed-map lifetimes and backend boundaries remain unchanged. Relief is shading/normal-map only: no actual holes, geometry, displacement, alpha or new BRDF. These visual assets do not provide retroreflection, accessibility certification or road-safety compliance.

Animal-skin surfaces include elephanthide with matte grey skin, coarse meandering intersecting recessed wrinkles, rounded shoulders and finer subordinate folds; ostrichleather with warm tan leather, widely spaced irregular recessed quill follicles inside low raised rounded collars and a subordinate fine pebbled background; and sharkskin with dense tiny directional grey-blue denticles tapering downstream, two or three fine lengthwise keels per denticle and shallow overlap shading. These are distinct from generic leather pebbles, almond pores and large rounded fishscales or single-keel snakeskin diamonds. All three are opaque dielectrics with zero metallic B channel and default metallic factor, using the same four CPU-generated seeded deterministic periodic baseColor/normal/metallicRoughness/occlusion maps and physical repeats. Existing size/seed/contrast/roughnessBias/repeats options, caller ownership, borrowed-map lifetimes and backend boundaries remain unchanged. Relief is surface shading/normal-map only: no geometry, displacement, transparency, transmission, subsurface scattering (SSS) or anisotropic BRDF.

Tree-bark surfaces include birchbark with pale papery bark, short irregular horizontal dark lenticels recessed with occlusion, and shallow papery seams; palmtrunk with dry tan/brown fibers, unevenly spaced transverse leaf scars recessed beneath raised shoulders, and subordinate fine longitudinal fibers; and sycamorebark with broad irregular cream/olive-grey exfoliating patches at several tonal levels and shallow peeling edges. They are distinct from vertical wood grain, bamboo nodes and peeling-paint recolors. All three are opaque dielectrics with zero metallic channel and default factor, using the same four seeded deterministic periodic maps and physical repeats. Relief is shading/normal-map only: no geometry, displacement, alpha, transmission, SSS or new BRDF. Existing options, caller ownership, borrowed-map lifetimes and backend boundaries remain unchanged.

Nutshell surfaces include walnutshell with irregular winding and branching coarse ridges over deeper brown concavities; peanutshell with pale straw/tan reticulation, stronger longitudinal ribs and subordinate cross-links around irregular elongated cells (not woven crossings); and almondshell with a buff surface, scattered elongated recessed pores and subtle directional grain, with negative relief and occlusion rather than pigment-only spots or raised beads. All three are opaque dielectrics with zero metallic B channel and default metallic factor, using the same four seeded deterministic periodic baseColor/normal/metallicRoughness/occlusion maps and physical repeats. These are surface-shading/normal-map effects only, not complete nut geometry, displacement, cutouts, translucency, transmission, subsurface scattering or a new BRDF.

Petal surfaces include rosepetal with wine/red-to-rose soft flowing folds and dense tiny raised papillae, giving a rough velvety microtexture rather than cloth weave, hair or pores; lilypetal with cream/ivory-to-warm yellow fine longitudinal ribs, shallow folds and scattered irregular elongated reddish-brown pigment speckles, with smoother satin roughness than rose and no speckle-shaped holes; and fritillarypetal with purple/cream checker pigmentation alternating across both axes, softly wandering cell margins and fine longitudinal striation, with gentle rib relief independent of the color checks rather than tile grout or woven checks. All three are opaque dielectrics with zero metallic B channel and default metallic factor in both `material` and `createMaterial()`, using only the existing CPU-generated four seeded deterministic periodic baseColor/normal/metallicRoughness/occlusion maps and physical repeat defaults. The preceding 162 kinds must retain byte-identical maps; public size/seed/contrast/roughnessBias/repeats options, caller ownership and borrowed-map lifetimes remain unchanged. Scalar fields must remain C1 at periodic seams and interior support joins. These are surface-shading/normal-map effects only, without flower geometry, alpha, displacement, transmission, subsurface scattering (SSS), simulation or new BRDF capabilities.

Additional fruit skins include cantaloupe with tan raised, irregular interconnected curved netting over subdued green/ochre rind (not hexagonal honeycomb walls or a recolored giraffe pigment network); dragonfruit with saturated rose/magenta waxy skin and staggered tapered bracts transitioning toward yellow-green tips, with shallow lifted tips and underlap shading (not regular triangles or recolored pinecone); and kiwiskin with brown rind, dense fine short hairs in varied directions and small follicle pits (not coarse longitudinal coconut fibers or recolored vertical zebra fur). All three are opaque dielectrics with zero metallic B channel and default factor in both `material` and `createMaterial()`, using only the existing CPU-generated four seeded deterministic periodic baseColor/normal/metallicRoughness/occlusion maps and physical repeat defaults. Caller ownership, borrowed-map lifetimes and public size/seed/contrast/roughnessBias/repeats options remain unchanged. These are surface-shading/normal-map effects only, without alpha, geometry, displacement, actual hair geometry, transmission, subsurface scattering (SSS), simulation or new BRDF capabilities.

For shell-face surfaces, choose scallopshell for warm cream/pink fan-shaped faces, diverging radial ribs and subtle crossing growth rings (not recolored starcoral); oystershell for rough gray/cream calcified overlapping irregular growth laminae, lifted lips and undercut shading (not regular corrugation or recolored layeredpaper); or nautilusshell for cream/russet coiled faces, curved spiral growth and chamber/stripe subdivisions (not concentric endgrain rings or ordinary dots). These distinct morphologies are opaque dielectrics with zero metallic B channel and default factor in both `material` and `createMaterial()`, using only the existing CPU-generated four seeded deterministic periodic baseColor/normal/metallicRoughness/occlusion maps, physical repeat sampling, caller ownership and unchanged size/seed options. These are stylized shell-face shading/normal-map effects only, not geometry, displacement, transparency, transmission, subsurface scattering, iridescence or animal simulation.

For short-coat surfaces, choose zebrafur for sinuous, varying-width black/ivory stripes that fork and merge, not uniform sine bands; leopardfur for irregular broken dark rosettes around warmer centers, not solid polka dots or recolored stone; or giraffefur for irregular angular brown patches separated by a connected pale network, not rectangular brick/tile cells. Each combines its distinct pigmentation with fine short directional fiber relief and roughness; pigment boundaries do not form raised armor plates or deep cracks. All three are opaque dielectrics with zero metallic B channel and default factor in both `material` and `createMaterial()`, using only the existing CPU-generated four seeded deterministic periodic baseColor/normal/metallicRoughness/occlusion maps, physical repeat sampling, caller ownership and unchanged size/seed options. These are shallow surface-shading/normal-map effects, not actual fur geometry, alpha, displacement, an anisotropic BRDF or animal simulation.

For patterned textiles, choose houndstooth for black/ivory broken checks and stepped tooth shapes from woven twill, not an ordinary checkerboard; tartan for warm muted broad and fine crossing bands with visible interlaced yarn crossings, not plain tiles; or damask for paired symmetric floral leaf-and-petal motifs with raised jacquard-like relief on woven backing. These distinct patterns are not recolors or rescales of fabric, herringbone, tweed or seersucker. All three are opaque dielectrics with zero metallic B channel and default factor in both `material` and `createMaterial()`, using the existing CPU-generated four seeded deterministic periodic baseColor/normal/metallicRoughness/occlusion maps, physical repeat sampling, caller ownership and unchanged size/seed options. Relief is surface shading/normal maps only, without real fibers, geometry, alpha, displacement, anisotropy, new BRDF capabilities or cloth simulation.

For marine-skeleton surfaces, choose braincoral for sinuous labyrinthine rounded ridges and dark intervening valleys; starcoral for distinct corallites whose radial septa surround recessed mouths; or seasponge for an irregular interconnected porous skeleton and channels at multiple scales. These are structurally distinct, not recolors or rescales of scoria, pumice, foam or one another. All three are opaque dielectrics with zero metallic B channel and default factor in both `material` and `createMaterial()`, using the same CPU-generated seeded deterministic periodic baseColor/normal/metallicRoughness/occlusion maps, physical repeat sampling, caller ownership and size/seed options. Relief is surface shading and normal mapping only, not actual coral or sponge geometry, holes, live polyp geometry, alpha, displacement, subsurface scattering (SSS) or underwater optics/simulation/behavior.

For green-leaf surfaces, choose lotusleaf for broad rounded leaves with radial veins and central attachment relief; bananaleaf for elongated broad panels with a strong midrib and closely spaced parallel/oblique side veins; or fernleaf for alternating tapered pinnae along a rachis, each with fine vein relief. They have distinct morphology rather than recoloring or rescaling leaflitter. These opaque green dielectrics keep metallic channel and default factor at zero, using the same four seeded deterministic periodic baseColor/normal/metallicRoughness/occlusion maps, repeat sampling, caller ownership and size/seed options. They are surface-shading/normal-map textures, not alpha cutouts, real vegetation geometry, displacement, subsurface scattering, wetness simulation or wind behavior.

For stylized bulk-grain surfaces, choose rice for slender ivory kernels with varied orientations and gentle longitudinal relief; sesame for small warm tan asymmetric teardrop seeds with rounded raised keels and tapered tips; or coffeebeans for broader dark roasted-brown oval beans with curved central splits and fine uneven roasting grain. Each has its own shape field, not a recolored or rescaled shared pattern. These opaque dielectrics keep metallic channel and default factor at zero, using the same four seeded deterministic periodic maps, repeat sampling, caller ownership and size/seed options. Relief is shading/normal-map-only, not individual-grain simulation, physical stacking, geometry, displacement, transparency or subsurface scattering.

For pavement, choose asphalt for dark granular binder with embedded aggregate, gravel for irregular pebbles with dark recesses, or cobblestone for staggered rounded paving blocks. All three use opaque, repeating color/normal/metallic-roughness/occlusion maps.

For natural surfaces, choose bark for ridges and deep fissures, moss for dense soft green growth, or mud for earthy clumps with shallow cracks. These opaque dielectrics use the same four repeating maps.

For stone finishes, choose granite for speckled mineral grains, slate for layered dark stone with fine ridges, or terrazzo for contrasting stone chips in a smooth binder. These opaque dielectrics use the same four repeating maps with a zero metallic channel.

For textiles, choose denim for diagonal twill, burlap for a coarse cross weave, or carpet for a cut-pile surface. These opaque dielectrics use the same four repeating maps with a zero metallic channel, not geometry, hair simulation or transparent weave holes.

For soft textiles, choose knit for muted stockinette-like repeating V-shaped stitches with rounded raised yarn and recessed loop gaps; corduroy for warm brown parallel rounded raised wales with fine pile speckle and deep narrow valleys; or felt for a muted slate-green matte nonwoven surface with randomly oriented fine fibers and low relief. These opaque dielectrics use the same four deterministic periodic maps with zero metallic channel and factor; relief is normal-map-only, without yarn/fur geometry or transparent loops.

For building finishes, choose plaster for pale gypsum with shallow sweeping trowel marks and fine pores, terracotta for unglazed reddish fired clay with irregular kiln mottling and pits (no tile grout), or cork for tan/brown compressed flakes with cellular boundaries. These opaque dielectrics use the same four repeating maps with a zero metallic channel, not geometry or physical simulation.

For industrial surfaces, choose rubber for charcoal molded elastomer with fine pebbled stipple, carbonfiber for dark resin-coated tow bundles with alternating diagonal twill directions, or diamondplate for silver rolled metal with raised alternating diagonal lozenges. Rubber and carbonfiber are opaque dielectrics with a zero metallic channel; diamondplate has metallic channel 1 and default metallic factor 1. All use the same four periodic RGBA maps; relief is normal-map-only, not geometry. Carbon weave does not add a special anisotropic shader, clearcoat or physical simulation.

For craft materials, choose paper for ivory uncoated paper with fine irregular pulp fibers and subtle formation clouding, wicker for broad rounded tan rattan strips interlaced over deep opaque recesses with fine longitudinal strip grain, or bamboo for golden longitudinal fibers and periodically staggered darker node bands. Paper is not recolored plaster; wicker differs from coarse burlap. These opaque dielectrics use the same four periodic maps with zero metallic channel and factor; relief is normal-map-only, not geometry, transparent holes, segmented objects or physical simulation.

For formed metals, choose hammeredmetal for warm copper-like metal with overlapping shallow rounded hammer dimples and smooth continuous relief (not rough rock), galvanized for cool silver zinc spangles with crystallite tonal/roughness contrast and very shallow relief (not gravel), or corrugatedmetal for rolled silver sheet with parallel smooth flutes and faint longitudinal wear. All three use the same four deterministic periodic maps with fully metallic B=255 (1) and default metallic factor 1, unlike mixed-metallic rust. Relief is normal-map-only, without geometry displacement or silhouette changes.

For porous and sedimentary stone, choose sandstone for warm wavy sedimentary strata with granular grit (distinct from dark slate and loose sand), travertine for cream limestone with irregular elongated shallow vugs and subtle horizontal mineral banding, or pumice for pale gray volcanic rock with dense randomly distributed small rounded vesicles (not recolored gravel or stone). These opaque dielectrics use the same four deterministic periodic maps with zero metallic channel and factor; pits are normal-map relief, not transparent or geometric holes.

For floor finishes, choose parquet for basketweave wood blocks made of several narrow slats with alternating longitudinal grain directions and dark recessed seams; mosaic for tiny square glazed tesserae with seeded tile-to-tile tonal variation and narrow recessed grout, distinct from larger tiles; or hexagontiles for six-sided ceramic cells and narrow recessed grout in a seamless periodic tiling. These opaque dielectrics use only the same four maps with zero metallic channel and factor; relief is normal-map-only and seams do not split geometry.

For exterior finishes, choose roofshingles for dark mineral-granule asphalt courses with staggered rectangular tabs and overlap shadow bands; rooftiles for terracotta barrel-tile courses with curved crowns, recessed channels and course lap bands; or stucco for warm off-white sprayed/troweled plaster with irregular raised aggregate and pits, coarser than plaster. These opaque dielectrics use the same four deterministic periodic maps with zero metallic channel and factor. Roof overlap and surface relief are shading/normal-map effects only, not geometry, silhouette changes or physical simulation.

For natural detail, choose lichen for irregular shallow crustose colonies; leaflitter for dry oriented leaves with central veins and recessed gaps; or endgrain for curved wood growth rings, pores and radial checks. These opaque dielectrics use the same four deterministic periodic maps with zero metallic channel and factor. Relief is conveyed only by shading and normal maps, not vegetation or wood geometry.

For indoor functional surfaces, choose acousticfoam for charcoal softened pyramidal foam relief; closedcellfoam for a blue-gray fine closed-cell membrane with shallow dimples; or linoleum for a muted green/teal smooth marbled sheet floor with fine elongated pigment flecks. These opaque dielectrics use the same four seeded deterministic periodic maps with zero metallic channel and factor. Relief is conveyed only by shading and normal maps, without foam geometry, sound absorption or physical simulation.

For leather finishes, choose suede for tan short brushed nap and fine pores; snakeskin for olive/brown staggered small pointed/rounded diamond scales with central keels and recessed boundaries; or crocodile for dark brown large rounded rectangular scutes and wrinkle creases. These opaque dielectrics use the same four seeded deterministic periodic maps with zero metallic channel and factor. They are synthetic surface patterns with shading/normal-map relief only, not animal geometry or displacement.

For woven finishes, choose herringbone for alternating diagonal broken-twill chevrons; tweed for coarse mottled yarn with fine flecks and crossing fibers; or seersucker for pale blue/cream alternating flat and puckered bands with a fine weave. These opaque dielectrics use the same four seeded deterministic periodic maps with zero metallic channel and factor. These are surface-shading/normal-map effects only, not cloth geometry, anisotropy or simulation.

For worked metals, choose knurledmetal for fine crossed diagonal ridges and raised diamond grip; engineturned for overlapping circular silver machining swirls; or goldleaf for warm gold crumple wrinkles and lap seams. These opaque presets use only the same four seeded deterministic periodic maps, with fully metallic B=255 (1) and default metallic factor 1 for both `material` and `createMaterial()`; explicit caller overrides remain effective. Rust keeps its varying metallic map and default factor 1; dielectrics keep default 0. These are surface-shading/normal-map effects only, without actual anisotropy, foil thickness, machining geometry or translucency.

For fruit surfaces, choose orangepeel for fine oil-gland dimples and waxy orange skin; coconut for a rough brown husk with fine longitudinal fibers and fissures; or watermelon for green irregular wavy longitudinal rind bands and mottled speckles. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. These are surface-shading/normal-map effects, without fruit geometry, transmission or subsurface scattering.

For geological surfaces, choose limestone for warm pale rounded carbonate grains in a porous matrix; breccia for angular fractured clasts in cement; or gneiss for folded alternating light/dark mineral bands and crystalline flecks. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without actual rock geometry, displacement or translucency.

For wood composites, choose plywood for a warm rotary-cut face veneer with cathedral grain and knot eyes, not exposed edge layers; osb for large overlapping elongated oriented wood strands; or chipboard for dense finer randomly oriented wood chips in binder. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without new board geometry or displacement.

For relief textiles, choose wafflecloth for raised woven waffle rims and recessed square pockets; cableknit for intertwined wool cable braids with crossover relief and smaller flanking knit ribs; or quilting for padded diamond cloth cells and recessed diagonal stitched seams. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without cloth geometry, displacement, transmission or subsurface scattering.

For decorative ceramic and tile finishes, choose crackleglaze for pale celadon smooth faces and a fine irregular dark recessed crack network; flutedceramic for ivory polished ceramic with vertical rounded flutes; or encaustictiles for cream/muted-blue ornamental cement tiles with floral/geometric pigment inlays and recessed grout. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. These are surface-shading/normal-map effects only, without actual cracks, geometry, displacement, transmission or a new coating system.

For organic coverings, choose fishscales for blue-gray/teal overlapping staggered rounded scalloped scales with concentric growth marks and exposed lips; tortoiseshell for brown/amber irregular polygon scutes with dark seams, domes and growth rings; or feathers for gray-brown layered pointed vanes with shafts and angled barbs. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. These are surface pigment/normal-map effects only, without geometry, cutout, transmission, iridescence, subsurface scattering or a new shader feature.

For plant-fiber surfaces, choose reedmat for slender parallel reeds and transverse binding threads; rope for adjacent three-strand twisted rope bands with helical grooves and fine fibers; or straw for golden dry thin scattered straight stems with occasional nodes and layered bedding. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. These are surface-shading/normal-map effects only, without cylinders, geometry, cutout or displacement.

For rubber flooring, choose studdedrubber for round flat-topped charcoal studs with beveled shoulders; groovedrubber for broad flat dark-gray ribs with narrow drainage grooves; or recycledrubber for dense fine blue-gray irregular rubber granules in dark binder. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. These are surface-shading/normal-map effects only, not actual friction or drainage physics, geometry or displacement.

For open metalwork, choose perforatedmetal for a bright metal sheet with staggered round recessed holes and flat web between them; expandedmetal for two diagonal strand families joined at raised nodes around recessed rhombic openings; or wiremesh for plain-woven round wires alternating over and under above dark open gaps. These opaque metals use only the same four seeded deterministic periodic maps with metallic channel and default factor 1. Relief is a surface-shading/normal-map effect, without sheet geometry, real holes, bent strands or displacement.

For pile textiles, choose velvet for dense flat upright pile whose soft crush clouds shift pigment and sheen; terrycloth for staggered rounded loop crowns over the woven ground; or boucle for yarn courses carrying raised annular loop crests around recessed centers above open channels. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without cloth geometry, cut loops, displacement or subsurface scattering.

For crystal surfaces, choose geode for concentric mineral bands rippling around a fine crystalline druse core; quartz for hexagonal prisms carrying pyramidal apices at varied heights; or pyrite for interlocking stepped cube tops with fine parallel striations. Geode and quartz are opaque dielectrics with zero metallic channel and default factor; pyrite is an opaque metal with metallic channel and default factor 1. All three use only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without crystal geometry, cut facets or displacement.

For building envelopes, choose shiplap for lap boards shadowed at their overlaps with seeded tones fading into each seam; glassblock for rounded block faces over recessed seams with trapped bubbles domed inside; or thatch for layered straw courses hanging over shadowed laps. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without board, block or straw geometry and without displacement.

For weathered surfaces, choose charredwood for rounded charcoal scales lifted above deep alligator cracks; driftwood for silvered grain ridges split by grain-aligned weathered cracks; or peelingpaint for intact paint faces curled up at their rims over exposed substrate. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without bark, board or paint-chip geometry and without displacement.

For patterned utility surfaces, choose tiretread for staggered tread blocks stepping above their grooves with fine sipes; honeycomb for hexagonal wax walls cresting around recessed cell floors; or frost for feathery crystal arms radiating from a faded center. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without tread, comb or crystal geometry and without displacement.

For decorative panels, choose stainedglass for lead came lifting between irregular panes of different pigment tones; soapstone for soft pale veining sweeping above a dark talc ground; or butcherblock for alternating checker end-grain blocks over recessed joints. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without lead, stone or block geometry and without displacement.

For homeware textiles, choose wallpaper for a raised damask medallion repeating in exact mirror symmetry; embroidery for raised satin stitches fading at their own support; or macrame for staggered rounded knots stepping above twisted crossing cords. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without thread, stitch or knot geometry and without displacement.

For outdoor hardscapes, choose brickpaving for running-bond pavers stepping above sandy joints; steppingstone for rounded flagstone pads lifted over gritty ground; or woodendeck for board faces over narrow gaps with domed screw heads and recessed cross slots. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without paver, stone, board or screw geometry and without displacement.

For kitchen and candle surfaces, choose cheese for smooth rounded eyes of varied sizes sunk below the paste; sugarfrosting for piped rosette peaks swelling over smooth icing; or candleswax for rounded drips whose noses bulge above their runs. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without food or wax geometry and without displacement.

For sound and paper surfaces, choose vinylrecord for fine concentric grooves rippling around a smooth label disc; graphpaper for major rules sinking deeper than minor rules over the sheet; or notebookpaper for ruled lines, a margin line and punch holes sinking progressively into the page. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without record, paper or punched geometry and without displacement.

For woven craft surfaces, choose lace for diagonal netting threads crossing above diamond voids; crochet for plush loops raised on half-cell-offset rows over recessed gaps; or basketweave for per-block alternating strips crested by ridges above the gaps between strips. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without thread, yarn or wicker geometry and without displacement.

For fastener surfaces, choose zipper for offset tooth rows interlocking over a recessed seam beside woven tape; velcro for staggered hook-pin rings above dimpled cores and backing; or button for raised rims above stitched faces and recessed hole pits. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without teeth, pins or button geometry and without displacement.

For road and rail surfaces, choose traintracks for rails crowning above crosswise sleepers and ballast grain; manholecover for a raised frame ring over a radially and concentrically ribbed panel; or speedbump for rounded crests above their feet and recessed seams under warning stripes. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without rail, cover or bump geometry and without displacement.

For technology surfaces, choose circuitboard for pads cresting over routed traces above the substrate and recessed via pits; solarpanel for busbars and fine fingers riding raised cell faces out of their gaps; or heattile for rounded tile faces above recessed seams. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without circuitry, cells or tile geometry and without displacement.

For instrument surfaces, choose pianokeys for black keys rising over white faces split by recessed seams; drumskin for rim lugs crowning the rim above a taut creased membrane; or gongsurface for hammered rings rippling around a raised center boss. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without key, skin or gong geometry and without displacement.

For optical surfaces, choose lensarray for microlens domes rising out of a fine supporting web; prismtape for diagonal prism ridges cresting over their feet and the tape base; or fresnel for concentric saw rings descending outward around a raised center boss. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without lens, prism or stepped lens geometry and without displacement.

For medical and hygiene surfaces, choose bandage for a rounded pad cushioning over woven gauze; pillblister for blister domes swelling over scored foil; or sutures for stitch cords bridging the incision above needle pits and bare skin. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without pad, dome, cord or needle geometry and without displacement.

For garden and outdoor surfaces, choose trellis for crossed slats knotted above the open grid; terracottapot for a proud rim band riding over thrown wall ribs; or hedgerow for leafy clumps swelling over shadowed branch gaps. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without slat, pot or foliage geometry and without displacement.

For pet care surfaces, choose collar for a buckle rising over stitched webbing and bare backing; petbed for a bolster ring around the dished cushion and base weave; or scratchpost for rope ridges cresting above tight grooves. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without buckle, bolster or rope geometry and without displacement.

For sports ground surfaces, choose runningtrack for lane lines riding granular rubber above drainage seams; bouldermat for quilted diamonds puffing inside a raised border band; or pooltile for tile faces meeting recessed grout under broad caustic light bands. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without line, quilt or tile geometry and without displacement.

For office and stationery surfaces, choose envelope for crosshatch ridges framing the recessed flap seam; chalkboard for a frame band surrounding streaked slate above clean passes; or corkboard for granules lifted over the board and deep pin holes. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without flap, frame or pin geometry and without displacement.

For natural phenomena surfaces, choose snowdrift for wind ripples riding over fine snow grain; icicle for rounded columns hanging over shadowed gaps; or dewdrops for two drop sizes beading over faint leaf veins. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without drift, icicle or droplet geometry and without displacement.

For astronomy surfaces, choose mooncrater for rims rising over the surface around sunken bowls; starfield for stars and dust points twinkling over the nebula base; or nebula for bright swirl bands flowing around dark dust lanes. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without crater, star or cloud geometry and without displacement.

For garment detail surfaces, choose pleats for accordion folds cresting over fabric valleys; shoelace for woven cords crossing over the base above punched eyelets; or tassel for strands hanging below the raised binding ring. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without fold, cord or strand geometry and without displacement.

For cookware surfaces, choose woksurface for hammered dimples over scratched steel under an oil sheen; cutlery for beaded borders framing the brushed handle face; or choppingboard for end-grain blocks holding knife scars above the recessed border. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without dimple, bead or block geometry and without displacement.

For bathroom fixture surfaces, choose faucet for a polished dome rising over its base plate and scale spots; showerhead for spray holes sinking into the grooved panel face; or bathmat for suction cups doming over the woven backing. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without dome, nozzle or cup geometry and without displacement.

For window shading surfaces, choose blinds for tilted slat faces rising over the shadowed gaps between them; curtain for draped fold crests over the fabric valleys; or shadecloth for woven threads crossing over the open gaps. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without slat, fold or thread geometry and without displacement.

For food surfaces, choose breadcrust for cracked toasted bread crust; wafer for fine baked orthogonal pockets and ribs; or chocolate for broad smooth bar squares with recessed score lines. These opaque dielectrics use only the same four seeded deterministic periodic maps with physical repeats, zero metallic channel and default factor. These are flat-surface shading/normal-map effects only, without geometry, displacement, subsurface scattering, transmission, translucency or edible/physics simulation.

For bakery surfaces, choose pretzel for interlaced dough ropes knotted over the gaps with salt specks; bagel for a chewy ring doming over the recessed hole with sesame specks; or croissant for buttered layer ridges stacked above the browned seams. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without knot, ring or layer geometry and without displacement.

For insect and web surfaces, choose butterflywing for scale tiles rising above the recessed veins; beetlewing for domed elytra plates over their sutured seams; or spiderweb for radial spokes and concentric silk rings raised over the open cells, beaded with dew. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without tile, plate, spoke or ring geometry and without displacement.

For sky and weather surfaces, choose cirrus for wind-combed streaks feathering across the open high air; cumulus for puffy cauliflower domes piling above the shaded gaps; or lightning for a jagged bolt core glowing above the dark storm sky. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without streak, dome or bolt geometry and without displacement.

For sea life surfaces, choose kelp for broad slick blades rippling above the shadowed troughs; seaweed for fine branching threads weaving over the shaded gaps; or anemone for ringed tentacles rising around the recessed central mouth. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without blade, thread or tentacle geometry and without displacement.

For candy and sweets surfaces, choose candy for glossy hard-candy stripes twisting above their shallow seams; marshmallow for soft piped ridges rolling over their rounded grooves with starch dusting; or nougat for nut chunks and bubble pits breaking the chewy sugar base. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without stripe, ridge or chunk geometry and without displacement.

For glass surfaces, choose frostedglass for fine acid-etch speckle scattering over the pane; rippledglass for vertical rolled ribs rippling across the drawn glass; or bubbleglass for seeded round bubbles doming over the clear glass body. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without speckle, rib or bubble geometry and without displacement.

For leatherwork surfaces, choose saddlestitch for dashed raised thread along the seam above grained leather; tooledleather for embossed medallions and swirl rings over the compressed ground; or patentleather for fine orange-peel ripple across the mirror lacquer. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without thread, medallion or lacquer geometry and without displacement.

For fruit skin surfaces, choose appleskin for blush streaks banding the taut skin with lenticel freckles; peachskin for fine fuzz over the blush beside the recessed suture groove; or grapeskin for bloom patches dusting the smooth stretched skin. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without streak, fuzz or bloom geometry and without displacement.

For vegetable surfaces, choose broccoli for dense floret buds clustering above the shaded gaps; cabbage for leafy folds rippling beside the recessed veins; or onion for concentric layer bands arcing over papery skin fibers. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without bud, fold or layer geometry and without displacement.

For bedding surfaces, choose bedsheet for soft pressed wrinkles drifting across the weave; pillow for lofty quilted puffs doming between recessed piped seams; or mattress for button tufts pulling dimples into the coarse woven surface. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without wrinkle, puff or tuft geometry and without displacement.

For tea surfaces, choose tealeaf for curled leaf pieces piling over the shaded gaps; matcha for whisk streaks combing across the fine powder bed; or teabag for filter-paper mesh threads crossing over the open pores. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without leaf, streak or thread geometry and without displacement.

For beach and coast surfaces, choose sanddune for wind ripples combing fine grain across the dune face; pebblebeach for round pebbles doming over the coarse sand; or foamedge for foam clumps and bubble specks washing over the thin water film. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without ripple, pebble or foam geometry and without displacement.

For volcano surfaces, choose lavaflow for pahoehoe ropes coiling above the dark cracks; cooledlava for crusted blocks cracking apart over the pitted surface; or ashfield for fine ash drifts mounding over the dusted ground. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without rope, block or drift geometry and without displacement.

For cave surfaces, choose stalactite for dripping cone tips hanging over the shadowed pockets; flowstone for terraced flow bands stepping over the fine drip ripples; or cavefloor for rubble breaking around the smooth shallow puddles. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without cone, terrace or rubble geometry and without displacement.

For dessert topping surfaces, choose jam for glossy fruit chunks sitting in the clear set syrup; peanutbutter for chopped nut pieces breaking the smooth swirled paste; or sprinkles for sugar rods scattering over the frosted base. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without chunk, piece or rod geometry and without displacement.

For frozen dessert surfaces, choose icecream for piped cream ridges rolling between melting drip specks; popsicle for frozen drip ridges running down the frosted ice pop; or sorbet for scoop scrapes ridging over the fruit-flecked surface. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without ridge, drip or scoop geometry and without displacement.

For pasta surfaces, choose spaghetti for winding noodle strands coiling over the sauce; macaroni for short bent tube shells piling over the gaps; or lasagna for layered pasta sheets stacking over the sauce seams. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without strand, shell or layer geometry and without displacement.

For paper craft surfaces, choose origami for folded facets rising between pressed crease lines; paperlace for die-cut holes sinking through the paper webbing; or papercut for layered cutout shapes rising over the flat backing. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without facet, hole or cutout geometry and without displacement.

For flower surfaces, choose sunflower for domed seed heads packing the disk; daisy for radial petals fanning around the recessed seed center; or clover for three heart lobes spreading from the stem join. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without head, petal or lobe geometry and without displacement.

For toy surfaces, choose puzzletile for jigsaw pieces and rounded knobs bridging the seams; legobrick for cylindrical studs doming over the smooth brick plate; or rubberband for crossed elastic bands stretching over the base wrap. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without piece, stud or band geometry and without displacement.

For farm surfaces, choose haybale for combed straw streaks beside the compressed bind bands; corncrib for slatted crib rails crossing over the open gaps; or fencepost for weathered vertical grain ridges split by dark checks. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without straw, rail or grain geometry and without displacement.

For sports surfaces, choose poolfelt for white marking dots over the dense felt nap; icesurface for zamboni sweep arcs glossing above the troughs beside frost flecks; or climbingwall for rounded holds over the gritty panels. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without dot, sweep or hold geometry and without displacement.

For display and peripherals, choose oledpanel for glowing subpixel stripes behind the dark matrix mask; crtscanline for bright phosphor scanlines above the dark line gaps; or keyboardkey for sculpted rounded-square caps over the recessed gaps. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without stripe, scanline or key geometry and without displacement.

For imaging and print surfaces, choose filmstrip for perforation holes between divider grooves; postagestamp for a raised medallion framed by border perforations; or halftoneprint for tone-varying ink dots on a rotated lattice. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without perforation, medallion or dot geometry and without displacement.

For hardware and fixtures, choose radiator for round tubes cresting above the recessed seams; screwhead for cross-recessed heads inside shallow panel dimples; or chainlink for diamond wires twisting thicker at the crossing nodes. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without tube, screw or wire geometry and without displacement.

For table food surfaces, choose friedegg for a yolk dome above the warped white and the pan; sushirice for rice grains doming above the crevices; or chocolatechip for chocolate discs rising above the cookie crumb. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without yolk, grain or chip geometry and without displacement.

For vehicle interiors, choose cargomat for rubber ribs cresting above the cross grooves; dashboardgrain for pebbled leather grain above the valleys and seam creases; or licenseplate for a raised border framing the text bars over the inset. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without rib, pebble or border geometry and without displacement.

For garden surfaces, choose flowerbed for four-fold rosettes doming above the soil; grassstripe for mowed bands glossing above the troughs; or topiary for clipped leaf clusters rising above the trimmed gaps. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without flower, blade or cluster geometry and without displacement.

For festive decorations, choose confetti for scattered chips rising above the paper gaps; ribbonstreamer for wide twisted bands cresting above the troughs; or pinatafringe for dense strands hanging above the tiers and gaps. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without chip, ribbon or strand geometry and without displacement.

For instrument surfaces, choose xylophone for tuned bars cresting above the cord holes and gaps; tambourine for tilted jingle discs doming over the drum skin; or castanet for paired shells rimming above their dimples and the felt. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without bar, disc or shell geometry and without displacement.

For wellness surfaces, choose pillcapsule for elongated halves doming above their seams and the backing; pilltablet for round crowns rising above the score grooves; or bathbomb for fizz staying above the diagonal fissures. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without capsule, tablet or fissure geometry and without displacement.

For sports-ball surfaces, choose basketball for orange pebbled leather with recessed dark panel seams; tennisball for yellow-green felt with a pale curved seam; or golfball for a glossy white surface with regular round concave dimples. These opaque dielectrics use only the same four seeded deterministic periodic maps with physical repeats, zero metallic channel and default factor. These are periodic surface-shading/normal-map approximations, not true spherical panel topology, geometry, displacement, fiber or shell volume, subsurface scattering, transmission or ball physics.

For architectural concrete finishes, choose boardformedconcrete for gray cast concrete with horizontal timber-board impressions, subtle long grain and recessed board joints (not recolored wood); ribbedconcrete for evenly spaced broad vertical concrete ribs with rounded shoulders, troughs and fine pores; or splitfaceblock for staggered rectangular blocks with rough fractured faces inside smooth recessed mortar joints (not recolored brick). These opaque dielectrics use only the same four seeded deterministic periodic maps with physical repeats, zero metallic channel and default factor. These are shading/normal-map effects only, not actual cast geometry, displacement or masonry physics.

For fabricated metals, choose chainmail for overlapping/interleaved metallic ring relief over dark opaque dielectric backing (not true openings or transparency); rivetedmetal for sheet-panel seams and discrete rounded raised rivets; or weldedmetal for raised periodically scalloped weld beads on flatter metal sheet. These opaque presets use only the same four seeded deterministic periodic maps with physical repeats. Both `material` and `createMaterial()` default to metallic factor 1, before caller overrides; chainmail's metallic channel follows ring coverage with zero on the backing, while rivetedmetal/weldedmetal are uniformly metallic (B=255). Relief is shading/normal-map-only, without geometry, displacement or physics; options and caller ownership are unchanged.

For botanical surfaces, choose cactus for longitudinal green ribs, repeated areoles and fine radial spine impressions; pinecone for staggered overlapping angular woody scales with raised exposed tips and depressed overlap seams (not rounded fishscales); or corncob for tightly arranged plump oblong kernels with rounded crowns and narrow interstices (not recolored brick). These opaque dielectrics use only the same four seeded deterministic periodic maps with physical repeats, zero metallic channel and default factor in both `material` and `createMaterial()`. These are surface-shading/normal-map effects only, not complete plant/fruit topology, geometry, true thorns, displacement or thorn/plant physics; options and caller ownership are unchanged.

For paper packaging surfaces, choose corrugatedcardboard for exposed rounded paper flutes, ridges and troughs over fibrous kraft (not recolored metal); creasedpaper for intersecting raised fold ridges and recessed fold shoulders over subtle pulp (not merely noise); or layeredpaper for overlapping irregular, torn-edged paper strips with distinct ledges and undercut shading (not recolored paper). These opaque dielectrics use only the same four seeded deterministic periodic baseColor/normal/metallicRoughness/occlusion maps with physical repeats, zero metallic B channel and default factor in both `material` and `createMaterial()`. Flutes, folds and layered edges are surface-shading/normal-map effects only, without geometry, cutaways, displacement, transparent torn silhouettes or tearing physics; public options, caller ownership and borrowed-map lifetimes are unchanged.

For volcanic stone surfaces, choose basalt for dark fine grain, rounded polygonal column-cap relief and recessed joints; scoria for warm dark-red rock with varied compact recessed gas pits and raised rims; or obsidian for very dark glossy opaque volcanic glass with curved conchoidal flake scars. These opaque dielectrics use only the same four seeded deterministic periodic maps with physical repeats and zero metallic B channel and default factor in both `material` and `createMaterial()`. Relief is surface shading/normal maps only, not actual columns, holes, geometry, displacement, transparent glass, refraction or emission.

For abrasive surfaces, choose sandpaper for staggered grit domes above the backing and shedding pits; steelwool for tangled strand ridges crossing along three wrapped diagonal families; or wirebrush for dense parallel bristles leaning above their grooves. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without grit, strand or bristle geometry and without displacement.

For kitchen-tool surfaces, choose cheesegrater for punched holes below raised rim rings; ovenrack for round rods above thin crossbars with lifted crossings; or muffintin for cup recesses below raised rim rings. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without hole, rod or cup geometry and without displacement.

For medical-dressing surfaces, choose gauze for undulating over-under threads above open gaps; elasticbandage for diagonal stretch ribs crossing recessed selvedge grooves; or icepack for squircle quilted cells above their seam grid. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without thread, rib or cell geometry and without displacement.

For circular-unit surfaces, choose bubblewrap for sealed domes puffing above a thin film web; sequin for staggered discs dimpled at each stitched hub over bare cloth; or pennyround for small round glazed tiles above recessed grainy grout. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without dome, disc or tile geometry and without displacement.

For ball-skin surfaces, choose volleyball for curved panels over recessed seams and a dimpled skin; bowlingball for a polished pearl swirl around three recessed finger holes; or rugbyball for pebbled leather under a stitched lacing seam. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without ball, hole or lacing geometry and without displacement.

For baked-sweet surfaces, choose wafflecone for diagonal lattice ridges over toasted diamond pockets; donutglaze for smooth glaze puddles over porous cake crumb; or brownie for walnut chunks above a cracked fudge top. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without ridge, glaze, crack or nut geometry and without displacement.

For bath-cleaning surfaces, choose soapbar for rounded beveled bars with an embossed oval over fine pores; loofah for crossing wavy strands over an open network; or scrubbypad for abrasive speckle around recessed hexagonal cut-outs. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without bar, strand or cut-out geometry and without displacement.

For fruit-section surfaces, choose orangeflesh for radial juice segments meeting at recessed pith under a raised rind ring; kiwiflesh for a pale core, dark seed ring and radiating fibers; or avocadoflesh for buttery smooth flesh cradling an elliptical central pit. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without segment, seed or pit geometry and without displacement.

For ornamental mineral surfaces, choose turquoise for dark spiderweb matrix veins webbing across polished robin-egg blue stone; rhodonite for dark branching manganese oxide dendrites shot through rose-pink stone; or tigereye for silky chatoyant golden-yellow and dark amber fibrous bands. These opaque dielectrics use only the same four seeded deterministic periodic maps with zero metallic channel and default factor. Relief is a surface-shading/normal-map effect, without vein, dendrite or band geometry and without displacement.

For decorative mineral surfaces, choose malachite for rich green nested rounded botryoidal growth bands and subtle polish relief; agate for warm cream/red/orange elongated wavy nested bands, distinct in contour topology and scale; or lapislazuli for deep ultramarine granular stone with pale irregular calcite veins/inclusions, not gold pyrite or metallic flecks. These opaque dielectrics use only the same four seeded deterministic periodic maps, physical repeats and public options, with zero metallic B channel and default factor in both `material` and `createMaterial()`. Polish and relief are surface shading/normal maps only, without transparency, refraction, iridescence or gemstone geometry.

With an existing 3D `scene`, reuse one preset across meshes:

```js
import { Geometry, Mesh, ProceduralMaterial } from 'xyz.js';

const preset = await ProceduralMaterial.create('wood', { size: 256, seed: 7 });
const first = scene.add(
  new Mesh({ geometry: Geometry.cube(), material: preset.material }),
);
const second = scene.add(
  new Mesh({
    geometry: Geometry.sphere(),
    material: preset.createMaterial({ normalScale: 0.5 }),
  }),
);
second.position.x = 2;

// On teardown, remove every borrower before releasing the maps.
scene.remove(first);
scene.remove(second);
first.destroy();
second.destroy();
preset.destroy();
```

Readonly `kind`, `material` and `textures` expose the preset: `textures.baseColor` is sRGB RGB, `normal` is linear tangent-space, `metallicRoughness` stores roughness in G and metallic in B, and `occlusion` stores linear occlusion in R. These four immutable `Texture` sources use the existing PBR/rendering path. Defaults are opaque, repeat sampling for all slots, roughness factor 1, and metallic factor 1 for presets with authored metal regions (including fully metallic nickelsilver and mixed-metallic rust or copperpatina), preserving the B channel; pure dielectric presets use factor 0. See the individual kind descriptions for the complete contract.

`createMaterial(options?: Partial<PBRMaterialOptions>)` creates a new `PBRMaterial` borrowing the same maps, with caller overrides applied last; it does not regenerate textures. Scene/mesh destruction does not own the preset. Its synchronous, idempotent `destroy()` releases only its generated textures, never caller override textures; `destroyed` reports its state and later `createMaterial()` calls reject. Do not reuse released maps. The [pbr3d gallery](../examples/pbr3d/) provides preset selection and texture-map previews; Canvas2D remains 2D-only.

#### Material finishes, material assets and glTF variants

Pass `finish` to any `PBRMaterial` (or `preset.createMaterial`) to add anisotropy, iridescence, subsurface wrap, dispersion, parallax height, wetness, snow, dirt, damage, a detail layer, triplanar sampling or a lightmap on the maps you already have. Zero strengths cost nothing; no extra texture slot is used.

```js
import { MaterialAsset, setMeshMaterial } from 'xyz.js';

const asset = await MaterialAsset.fromImages(
  { base: baseBlob, normal: normalBlob, lightmap: bakedBlob },
  { roughness: 0.4, finish: { wetness: 0.6, lightmapStrength: 1 } },
);
setMeshMaterial(mesh, asset.material); // validated; the renderer rebinds
// After every mesh using it is gone:
asset.destroy(); // releases only the textures it decoded
```

A glTF with `KHR_materials_variants` is read with `gltfVariants(gltf)`: `.variants` lists them, `.selectVariant('red')` switches and `.selectVariant(undefined)` restores defaults. The [pbr3d gallery](../examples/pbr3d/) has a Finish selector. Effects are approximations; see the technical reference for what each one does and what is unverified.

For image-based lighting and a skybox, build an `EnvironmentMap` from an equirect (2:1) image and assign it to the scene. It lights `PBRMaterial` only and replaces its flat `ambientLight`:

```js
import { EnvironmentMap } from 'xyz.js';

const sky = EnvironmentMap.fromRGBE(
  await (await fetch('/sky.hdr')).arrayBuffer(),
);
// or: EnvironmentMap.gradient({ zenith: [0.15, 0.35, 0.8], horizon: [0.9, 0.75, 0.6], ground: [0.1, 0.1, 0.1] })
scene.environment = sky;
scene.background = sky; // optional skybox; may be a different map
scene.environmentIntensity = 1;
// later, after removing it from the scene: sky.destroy();
```

Maps are at most 2048×1024. Only WebGPU and WebGL2 draw them; Canvas2D is 2D-only.

Distance fog fades 3D meshes toward a color (not the skybox or 2D layer):

```js
scene.fog.enabled = true;
scene.fog.mode = 'linear'; // or 'exp2' with scene.fog.density
scene.fog.color = [0.6, 0.65, 0.75]; // display sRGB, 0..1
scene.fog.near = 6;
scene.fog.far = 30;
```

`Game.create({ antialias })` (default `true`) enables 4× MSAA for the WebGPU 3D pass; pass `false` to save GPU cost. See the [technical notes](TECHNICAL.md#21-advanced-3d-p09p12) for what it does not cover.

GPU/GL loss triggers recovery by default: observe `graphicslost` / `graphicsrecovered`; frames are skipped while the same backend is rebuilt. Recreate any old `RenderTexture2D` or snapshot handles after recovery. Recovery failure/restore timeout is fatal; `recoverGraphics:false` makes loss fatal immediately. Recorded Chromium WebGL2 `WEBGL_lose_context` checks are not evidence of real mobile/driver resets or browser WebGPU-loss certification.

To post-process only the 3D image (not sprites or the HUD), prepare a `PostProcessor2D` and add it to `scene.effects3D`; it uses the same `effect(color, uv, screen)` shader signature as `effects2D`. `game.graphics.stats` reports draw calls, triangles and culled meshes for the last frame. For first-person mouse-look, create `new FirstPersonControls(camera, canvas)`, call `await controls.lock()` from a click handler, and call `controls.update(dt)` every frame.

HDR exposure/ACES and actual 9-tap threshold bloom run before the unaffected 2D overlay. WebGL2 requires EXT_color_buffer_float; requested HDR processing explicitly fails without it. InstancedMesh count is fixed; setMatrixAt increments version and getMatrixAt(index,out) reads a transform. Do not mutate raw matrices directly. World transforms compose mesh world × instance matrix. See the [technical contracts](TECHNICAL.md#21-advanced-3d-p09p12) for detailed defaults and supported boundaries.

For per-map sampling, pass textureSampler/metallicRoughnessSampler/normalSampler/occlusionSampler/emissiveSampler with minFilter/magFilter ('nearest'|'linear') and addressModeU/V ('clamp-to-edge'|'repeat'|'mirror-repeat'). Ordinary PBR defaults are linear/clamp; glTF defaults to repeat and preserves separate samplers on shared images. Native sources additionally use `mipmapFilter`, `lodMinClamp` and `lodMaxClamp`; opt-in native glTF loading preserves mip sampling. Ordinary image textures remain base-level sources.

For oblique surfaces, set `textureSampler: { maxAnisotropy: 8 }` (and the desired
PBR map samplers); Sprite uses `sampler: { maxAnisotropy: 8 }`. Requests are integers
1–16, require linear filtering above one and do not generate missing mips.
`game.graphics.capabilities.textureAnisotropy` separates the request ceiling from
the effective driver ceiling; WebGPU reports the latter as null, not a guarantee.
Canvas2D/absent GL extensions use one. See [filtering limits](TECHNICAL.md#p120-anisotropic-texture-filtering).

Native mip uploads passed scoped P42 acceptance. EnvironmentMap roughness mips are a separate path. See section 22 for native source construction and device-format checks.

## 12. Atlas Graphics and HUD (P13)

Import these names from `xyz.js` (or your deployed root ESM URL). `texture` below is an already loaded atlas containing both rectangles; Scene owns objects, not borrowed textures.

```js
import { Group2D, ScreenElement, SpriteSheet, FrameAnimation } from 'xyz.js';

const sheet = new SpriteSheet(texture, [
  { x: 0, y: 0, width: 16, height: 16 },
  { x: 16, y: 0, width: 16, height: 16 },
]);
const group = scene.add(new Group2D());
group.position.set(120, 100);
group.rotation = 0.3;
const sprite = group.add(sheet.createSprite(0));
sprite.scale.set(3, 3);
new FrameAnimation(
  sprite,
  sheet.frames.map((source) => ({ source, duration: 0.2 })),
  { strategy: 'pingpong' },
).play();
const hud = scene.add(new ScreenElement());
hud.add(sheet.createSprite(1, { anchor: [0, 0], position: [16, 16] }));
```

Use `SpriteSheet.grid(texture,{frameWidth,frameHeight,columns,rows,origin:[x,y],spacing:[x,y]})` for regular cells. Sheet frames require integer source pixels; direct `sprite.source={x,y,width,height}` also allows finite fractional pixels within the texture. `undefined` restores the full image. Sprite width/height are natural source dimensions: resize with scale, not displayWidth/displayHeight. Nested groups inherit visibility, opacity, tint and z; screen roots ignore camera motion and draw after world objects. Reparent preserves local transform. Remove detaches a reusable subtree; destroy recursively destroys children without destroying borrowed textures.

`new SpriteFont(sheet,{alphabet:'012AB',lineHeight:10,fallback:'0',advance:8})` maps one Unicode code point per sheet frame. `new SpriteText(font,'A012B\n210BA',{align:'center',letterSpacing:1,lineSpacing:2})` owns glyph children; synchronous `setText(text)` reuses them and preserves old text on invalid input. Without fallback an unmapped character rejects. This does not import BMFont files.

That constructor maps an already provided sheet; P27 separately provides bounded text/JSON BMFont loading and multipage metrics/kerning. It is no longer correct to describe the whole engine as lacking BMFont support; see section 18 and the technical profiles.

`new NineSlice(texture,{left:3,right:3,top:3,bottom:3,width:60,height:28,mode:'tile'})` borrows the texture and owns patches. Source/margins are integer pixels; optional source selects a panel inside an atlas. `resize(width,height)` accepts bounded fractional destination sizes. Stretch is default; tile clips last partial repeats (including fractional source remainder); tile-fit distributes complete repeats evenly. Small destinations compress opposite margins proportionally; `drawCenter:false` omits the center.

FrameAnimation also supports loop (default), freeze and hide, nonnegative speed, pause/play, reset, reverse, goToFrame(index), and stop (pause plus reset). Game advances it centrally; do not update it twice. Listen for native animationframe/animationloop/animationend on the animation or Sprite; loop detail includes aggregated count for large elapsed steps.

### Formal P13–P20 Playground

Open [gameplay2d](../examples/gameplay2d/) with `?renderer=webgpu|webgl2|canvas2d|auto` or change its Renderer selector. It defaults to forced WebGPU; choose auto explicitly for initialization fallback. This completed root-export consumer has real all-three-backend browser proof, not fake resource tasks or a second engine. P13–P20 profiles, the formal example and final build/typecheck/lint/format/37files252tests plus packed ES2022 consumer are accepted in recorded scope.

| Controls                                                                      | Actual behavior                                                                                                                                                             |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drag colored sprite / bitmap text; Move camera / Toggle group                 | Native nested parent-inverse drag and fixed screen HUD; diagnostics show viewport-culling tile counts                                                                       |
| Move + fade sequence / Follow + bounds / Shake                                | Simulation-timed actions, ordered camera strategies and seeded visual-only shake                                                                                            |
| Off-center impulse / Edit both maps                                           | Angular impulses; orthogonal (2,0) cycles atlas frame/toggles solid, isometric (2,1) toggles elevation                                                                      |
| Toggle local/world emission / Burst both spaces                               | Stop preserves particles until expiry; burst emits24 in each coordinate space                                                                                               |
| Unlock + PCM + OPM / Pause-resume PCM / Seek + rate PCM / Stop audio / Master | Gesture unlock eight existing contexts, PCM plus OPM; PCM seek0.2s/rate1.5; Game pause does not pause audio                                                                 |
| Transition kind / Preload + switch scene / Cancel pending-effect              | Actual OPM/PCM/PNG batch3/3 before initialize; 1.5s fade/crossfade/left-slide with sineInOut; cancel re-selects published Scene without destroying it                       |
| Toggle Sprite material / Toggle world + HUD post                              | Prepared native WGSL/GLSL on GPU/GL; Canvas displays explicit UnsupportedGraphicsError                                                                                      |
| Pause / Resume / Destroy                                                      | Simulation/actions/particles/transition clock freeze, pointer capture cancels; abort UI listeners/monitor, destroy Game, then caller-owned fixtures/descriptors/object URLs |

Progress/transition-events/audio/effects/tile/simulation labels expose actual state. All three final consumer surfaces have no browser console errors; audio analyser is not a speaker-audibility claim. No new cross-browser or performance claim.

## 13. Preload and Native Samples (Landed P18 Modules)

P18 includes the Scene.preload/Game.loading integration, accepted in the recorded Chromium scope. Provide real URLs; this direct batch example extends an initialized game and scene with a real #sound button.

```js
import { PreloadBatch } from 'xyz.js';

const controller = new AbortController();
const batch = new PreloadBatch([
  game.assets.textureTask('atlas', '/atlas.png'),
  game.audio.sampleTask('tone', '/tone.wav'),
  {
    key: 'settings',
    load: (signal) => game.assets.loadJSON('/settings.json', { signal }),
  },
]);
batch.addEventListener('progress', (event) => {
  console.log(event.detail.completed, event.detail.total, event.detail.ratio);
});
const resources = await batch.load({ signal: controller.signal });
const sample = resources.get('tone');
document.querySelector('#sound').addEventListener('click', async () => {
  try {
    await game.audio.unlock();
    const playback = await sample.play({ channel: 'sfx', scene, volume: 0.5 });
    console.log(playback.state, playback.position);
  } catch (error) {
    console.error(error);
  }
});
```

Handle batch rejection in your initialization error path. Before gesture unlock, sampleTask/loadSample fetch encoded bytes only: decoded=false and duration/sampleRate/channels undefined. Explicit sample.decode() and play reject before unlock; play lazily decodes afterward. Batch completion does not mean decoded-ready. game.audio.opmTask(key,url) loads OPM JSON; textureTask returns loader-owned textures. Batch state/progress, native progress/complete/error events, cancel(reason?) and load({signal?}) use task-count progress; empty ratio=1. No automatic retries or resource destruction by batch.

game.assets.loadBinary(url,{signal,maxBytes}) returns ArrayBuffer, loadText UTF-8 text, loadJSON parsed data (not schema validation). Defaults: binary8 MiB, text/JSON1 MiB; maxBytes is a positive integer <=8 MiB. Generic readers support HTTP/HTTPS/data/blob. Shared texture/OPM/sample acquisition abort only rejects that subscriber; loader destruction aborts shared requests and releases owned cache. Custom tasks must cooperate with signal; never destroy a shared loader to cancel one batch.

game.audio.loadSample(url,{signal}) returns cached SampleAudioAsset. Native browser codecs only; WAV/PCM was exercised. Asset loop/persistent defaults can be overridden by play options channel ('music'|'sfx'|'ui'), scene, persistent, loop, volume (0..1), playbackRate (0,16], offset within duration and scheduledStartTime (absolute AudioContext seconds, not Game clock). Playback has state ('playing'|'paused'|'stopped'|'ended'), position, mutable volume/playbackRate, pause()/resume()/seek(seconds)/stop(). Pause preserves position; seek rejects finished playback. Resume/seek replace one-shot sources; natural end differs from stop. Game pause does not pause audio: explicitly call playback.pause().

Samples reuse the first unlocked OPM context, not a ninth, with independent32-playback capacity; exhaustion rejects rather than steals OPM slots. Existing master/channel volume applies; worklet reset preserves samples. Scene cleanup stops nonpersistent handles, persistent survives until stop/Game destroy. Do not destroy cached SampleAudioAsset yourself.

Encoded cap8 MiB; bounds **after decode**:2,097,152 frames／8 channels／192kHz／8,388,608 values. Decoder transient allocations are not prevented; not a global memory budget. Chromium analyser output proves nonzero PCM alongside OPM, not speaker audibility or other-browser certification.

### Scene Preparation and Model Tasks

```js
import { Scene, Sprite, PreloadBatch } from 'xyz.js';

class ReadyScene extends Scene {
  preload(game) {
    const batch = new PreloadBatch([
      game.assets.textureTask('atlas', '/atlas.png'),
      game.audio.sampleTask('tone', '/tone.wav'),
    ]);
    batch.addEventListener('progress', (event) => {
      document.querySelector('#loading').textContent =
        `${event.detail.completed}/${event.detail.total}`;
    });
    return batch;
  }
  async initialize(game, signal) {
    const texture = await game.assets.loadTexture('/atlas.png', { signal });
    this.add(new Sprite({ texture, position: [100, 100] }));
  }
}
await game.setScene(new ReadyScene());
```

Provide a #loading label and handle setScene rejection. In TypeScript the protected preload(game,signal) hook returns PreloadBatch|void|Promise<PreloadBatch|void>. Game runs it before initialize; game.loading exposes only the current candidate's batch while preparing. Read loading?.progress for an external loading UI; do not call internal setLoading. Successful preparation atomically publishes the candidate and destroys old Scene. Failure/cancellation preserves the old Scene, which keeps updating unless paused; a candidate never initializes on failed preload. Superseded batches cannot clear newer loading. Preparation/publication may complete while paused, but the new Scene does not tick until resume.

Add new GLTFLoader().task('model','/model.glb') to a batch for a uniquely owned model acquisition. Failure/cancellation of an unfinished batch disposes that task's model and owned textures, not unrelated models or shared loader assets. After success the caller owns the GLTFAsset and must dispose it after removing/stopping consumers. Custom LoadTask implementations remain responsible for their own unique resources and cooperative signal cleanup. Direct generic tasks and shared loader results are not automatically destroyed by batch.

## 14. Actions, Pointer Targets and Camera (P14)

The following fragments use a live Scene and a Sprite already added to it. Durations are simulation seconds, rotation is radians, and actions change local transforms before physics. Do not manually advance their queues from Scene.update.

```js
import { Actions, Easings, CameraStrategies } from 'xyz.js';

sprite.pointerEnabled = true;
sprite.draggable = true;
sprite.addEventListener('dragmove', (event) => {
  console.log(event.detail.pointerId, event.detail.screen, event.detail.world);
});
const handle = sprite.actions.run(
  Actions.sequence(
    Actions.parallel(
      Actions.moveBy(40, 0, 0.5, Easings.quadInOut),
      Actions.fadeTo(0.5, 0.5),
    ),
    Actions.call((owner) => {
      owner.opacity = 1;
    }),
  ),
);
const result = await handle.finished;

const follow = scene.camera2D.addBehavior(
  CameraStrategies.follow(sprite, { axis: 'both', smoothTime: 0.15 }),
);
scene.camera2D.addBehavior(
  CameraStrategies.bounds({ x: 0, y: 0, width: 1000, height: 600 }),
);
scene.camera2D.shake({ duration: 0.25, amplitude: [4, 3], seed: 7 });
```

Retain the follow token and call scene.camera2D.removeBehavior(follow) when following is no longer needed; removing it immediately would prevent the next camera update from using it.

ActionQueue.run returns state queued/running/completed/cancelled and finished resolves completed/cancelled; handle.cancel cancels one run, sprite.actions.clear cancels the queue. Factories also include moveTo, rotateTo, scaleTo, tween(target, numericValues, duration, easing?), delay, repeat(action,count), repeatForever(action). Sequence carries excess time, parallel completes all branches, repeated runs capture fresh starting values. Infinite repeats must consume time; excessive callback work rejects. Built-in Easings are linear, quadIn/Out/InOut, cubicIn/Out/InOut, sineIn/Out/InOut and bounceOut; custom easing must stay finite in [0,1]. No back/elastic easing is promised.

Native target-only events: initialize once at first active tick; add/remove detail {scene}; preupdate/postupdate detail {dt}; destroy; actionstart/actioncomplete/actioncancel detail {action,handle}. Callback removal/re-addition invalidates the old registration and defers continuation to the next frame. A preupdate from an invalidated tick need not have a postupdate. Events do not bubble.

Pointer events pointerenter/leave/down/up/move/cancel and dragstart/move/end carry PointerTargetEventDetail {pointerId,button,screen,world,target,originalEvent?}, with stable Vector2 snapshots. Topmost screen/HUD precedes world, graphics bounds use inverse affine transforms, singular transforms skip; hitTestMode='collider' uses the attached collider instead. No pixel-alpha picking. Native capture permits outside-canvas dragging; parent-inverse deltas preserve nested transforms and a second pointer cannot steal the same drag. Pause/hidden/removal/destruction cancel routing; resume does not replay paused samples.

CameraStrategies.follow additionally accepts a viewport-relative deadZone rectangle. Bounds account for viewport/zoom and center views larger than the bounds. Camera2D.moveTo(x,y,duration,easing?), zoomTo(zoom,duration,easing?) return ActionHandles; motion and zoom have independent FIFO channels. Behaviors run in insertion order after physics/particles, before rendering; later bounds may override motion/follow. clearBehaviors releases strategies. Seeded shake changes renderOffset only, not logical position; picking uses the last rendered camera. Game pause freezes queues and camera progression.

## 15. Physics, Maps and CPU Particles (P15–P17)

### Rigid Bodies and Triggers

```js
import { GameObject, RigidBody2D, Colliders, Trigger2D, Vector2 } from 'xyz.js';

scene.physics.gravity.set(0, 980);
const ball = scene.add(new GameObject());
ball.position.set(100, 40);
ball.collider = Colliders.circle(8);
ball.body = new RigidBody2D({ mass: 2, restitution: 0.3, friction: 0.5 });
const floor = scene.add(new GameObject());
floor.position.set(100, 180);
floor.collider = Colliders.box(200, 16);
floor.body = new RigidBody2D({ type: 'static' });
ball.body.applyImpulse(new Vector2(20, -30), new Vector2(104, 40));
const trigger = scene.add(
  new Trigger2D(Colliders.box(60, 30), {
    repeat: Infinity,
    filter: (other) => other === ball,
  }),
);
trigger.position.set(100, 100);
trigger.addEventListener('triggerenter', (event) =>
  console.log(event.detail.other),
);
```

GameObject itself has no visual; add an atlas Sprite instead when displaying a body, matching source-local collider geometry to Sprite scale. Colliders.box is centered at the owner origin; all factories accept {offset:[x,y]}. Colliders.polygon accepts 3–32 strictly convex finite vertices; concavity/degeneracy reject. Dynamic bodies require world-space roots, static colliders may be nested; circles require uniform absolute world scale, not an ellipse approximation. GameObject body/collider setters register automatically with Scene.physics.

RigidBody2D exposes velocity, angularVelocity, mass, restitution, friction, linearDamping, angularDamping, gravityScale and lockRotation; applyForce/applyImpulse accept an optional world lever point, clearForces clears accumulators. No body means a static collider. Category/mask are reciprocal unsigned 32-bit filters; sensor=true detects without response. collisionstart/precollision/postcollision/collisionend carry self/other, stable normal/points, penetration, sensor and cancelResponse(); cancellation only suppresses that precollision step's response. Trigger2D clones a sensor shape, defaults to one accepted enter, accepts repeat=Infinity explicitly, and emits triggerenter/triggerexit {self,other}; it does not auto-destroy.

Scene.physics.overlap(collider,owner) returns shape-accurate contacts; raycast(origin,direction,maxDistance,mask?) returns distance-sorted surface hits. The fixed-step solver is capped; droppedTime reports discarded catch-up. P31 adds `body.ccd` for dynamic translation against static non-sensors (no rotation/dynamic-pair sweep), sleep and `DistanceJoint`/`RevoluteJoint`/`PrismaticJoint`/`WeldJoint`/`MouseJoint` through addJoint/removeJoint. `Colliders.polygon` remains strictly convex; use `StaticConcave2D`/`StaticChain2D` for static convex-piece composites. Dynamic concave shapes use `convexHull(points, options?)` (3–256 points → polygon collider), `Compound2D(pieces, options?)` (1–256 convex pieces sharing one dynamic body, derived mass/inertia) or `DynamicConcave2D(vertices, options?)` (`decomposeConvex` pieces on one body); hit-testing and contacts walk `colliderPieces`. Zero-width edges and deforming sweeps remain unsupported. P42 separately approves 3D colliders/queries/character/dynamic bodies and navigation/pathfinding; these old exclusions do not remove that scope. Full limits are in [TECHNICAL](TECHNICAL.md).

Those P31 exclusions are historical: P76 adds kinematic bodies, convex character motion and bounded relative rotational/dynamic CCD (section 39); P42 and later supply current 3D physics.

### Atlas Maps

```js
import { TileMap, IsometricMap, SpriteSheet } from 'xyz.js';

const sheet = SpriteSheet.grid(texture, { frameWidth: 32, frameHeight: 32 });
const map = scene.add(
  new TileMap({
    columns: 8,
    rows: 4,
    tileWidth: 32,
    tileHeight: 32,
    sheet,
  }),
);
map.setTile(2, 2, { frame: 0, solid: true, metadata: { name: 'floor' } });
const iso = scene.add(
  new IsometricMap({
    columns: 4,
    rows: 4,
    tileWidth: 32,
    tileHeight: 16,
    sheet,
    elevationStep: 8,
  }),
);
iso.position.set(320, 100);
iso.setTile(1, 1, { frame: 1, solid: true, elevation: 2 });
const origin = iso.tileToWorld(1, 1);
const picked = iso.pickTile(origin);
map.setTile(2, 2, { solid: false });
```

Use a live atlas texture large enough for the referenced frames. getTile returns an immutable cell {frame,solid,elevation,collider?,metadata?}; setTile validates a partial edit before publication, clearTile resets the cell. tileToLocal/tileToWorld include configured elevation and optionally reuse a Vector2 output. worldToTile(point,out?) returns integer coordinates (possibly outside grid) on the elevation-zero plane; pickTile handles elevated topmost graphic rectangles, not pixel alpha or exact diamond geometry. Singular inverse transforms reject, while pickTile returns undefined.

Orthogonal origins are top-left; isometric origins are diamond top vertices, depth ordered by diagonal/elevation/insertion. Generated Sprite children borrow the sheet texture and remain pooled when hidden or cleared. Conservative transformed camera culling does not remove solid physics. Solids default to boxes/diamonds; collider can supply a custom convex shape. Edits/removal/destruction update Scene collision registration. Destroy maps before the separately owned atlas Texture. No editor-format imports, hex/staggered grids or navigation.

The editor-format exclusion above describes the original TileMap profile; P83 now supplies the separate bounded Tiled orthogonal JSON importer (section 39), without expanding hex/staggered support.

That navigation exclusion belongs to the original map profile; current finite grid/graph pathfinding and character following are available. Hex/staggered editor imports remain unsupported.

### Particle Emitters

```js
import { ParticleEmitter } from 'xyz.js';

const emitter = scene.add(
  new ParticleEmitter({
    texture,
    capacity: 128,
    rate: 24,
    seed: 7,
    space: 'world',
    lifetime: [0.5, 1],
    speed: [20, 40],
    angle: [-Math.PI, 0],
    acceleration: [0, 40],
    nozzle: { kind: 'circle', radius: 5 },
    startSize: [6, 6],
    endSize: [1, 1],
    startColor: [1, 0.5, 0, 1],
    endColor: [1, 0.5, 0, 0],
  }),
);
emitter.position.set(120, 80);
emitter.emit(12);
emitter.start();
// Later: emitter.stop() retains survivors; emitter.clear() retires them.
```

ParticleEmitter extends Group2D and starts stopped. rate is births/second; emit(count) is a burst even while stopped. lifetime/speed/angle are ordered ranges (seconds, logical units/second, radians); startSize/endSize are width/height pairs, not random ranges. Optional source is an atlas rectangle; nozzle is point, rectangle {width,height} or circle {radius}. Capacity overflow drops new births, without queued backlog. activeCount/emitting are readonly views.

CPU simulation uses a fixed borrowed-texture Sprite pool: fractional births age within the current tick, acceleration integrates analytically, size/tint/alpha interpolate over lifetime. Local particles follow emitter ancestors; world particles preserve the full birth world affine axes, position, velocity and acceleration when parents move, while new births use the new transform. This simulation space is separate from inherited world/screen rendering space. stop retains survivors until expiry; clear resets live slots/fraction for reuse; Game pause freezes age; destroy owns pooled children, not the borrowed Texture. No GPU simulation.

## 16. Native Sprite Materials and 2D Post (P20)

The following uses a live GPU/GL Game, Scene and Sprite. Prepare descriptors before attaching them to a visible consumer; handle compiler rejection.

```js
import { Material2D, PostProcessor2D } from 'xyz.js';

const material = new Material2D({
  uniforms: [0, 1, 0, 1],
  wgsl: `fn effect(color: vec4f, uv: vec2f, screen: vec2f) -> vec4f {
    return vec4f(color.rgb * uniformValue(0u).rgb, color.a);
  }`,
  glsl: `vec4 effect(vec4 color, vec2 uv, vec2 screen) {
    return vec4(color.rgb * uniformValue(0).rgb, color.a);
  }`,
});
const mirror = new PostProcessor2D({
  uniforms: [0.75],
  wgsl: `fn effect(color: vec4f, uv: vec2f, screen: vec2f) -> vec4f {
    return sampleInput(vec2f(1.0 - uv.x, uv.y)) * uniformValue(0u).x;
  }`,
  glsl: `vec4 effect(vec4 color, vec2 uv, vec2 screen) {
    return sampleInput(vec2(1.0 - uv.x, uv.y)) * uniformValue(0).x;
  }`,
});
await game.graphics.prepareMaterial(material);
await game.graphics.preparePostProcessor(mirror);
sprite.material = material;
scene.effects2D.push(mirror);
material.setUniforms([1, 1, 0, 1]);
```

Both native sources are required, immutable, nonempty and limited to 65,536 characters each. uniforms is a 16-slot Float32Array; setUniforms accepts at most 16 finite float-representable numbers and zero-fills unused slots. Direct finite uniform mutations are uploaded on the next draw. WGSL declares uniforms.values as array&lt;vec4f,4&gt;, GLSL declares vec4 uniforms[4]; uniformValue(index) reads vec4 indices 0–3, not individual float indices. User code defines only the native effect function, not a full vertex/fragment entrypoint.

Material color is premultiplied sampled texture × inherited tint/opacity, uv is source-frame normalized, screen is logical pixels. Return premultiplied RGBA. Post color/uv cover the transparent entire world-2D+HUD layer; sampleInput takes top-left normalized UV on both backends. Stage order: 3D/P12 HDR → transparent 2D+HUD → ordered effects2D ping-pong → composite → whole-frame transition. A Sprite material changes only that Sprite; 2D post never processes the 3D/HDR base.

Prepared pipelines/programs and uniform resources survive resize or temporary disable for the descriptor lifetime; re-enable needs no async reprepare. Resize/disable releases mutable layer/transition attachments, not owned snapshots. Descriptors are caller-owned and can be borrowed by multiple consumers. Remove references before material.destroy()/mirror.destroy(); destruction immediately releases their prepared entries, rendering a destroyed/unprepared effect rejects GraphicsError. Renderer loss/destruction releases all native resources. Canvas2D preparation, a visible material or nonempty effects2D explicitly throws UnsupportedGraphicsError; do not silently ignore it or assume auto will select a shader-capable backend. No transpiler/Shader Graph/arbitrary resources.

## 17. Whole-Frame Scene Transitions (P19)

Accepted actual Game handoff on all three backends covers crossfade/fade, synchronous old destruction, pause/pending Promise, resize/immutable capture, resume/completion and final custom easing endpoint. Supplemental real native captures prove cancellation of a positively presented slide while retaining the published Scene, asynchronous capture version supersession/late disposal, synchronous cancel-listener reentry/latest winner and destruction during held capture. All12 native snapshots were disposed; errors=[] on every backend. Destruction releases Scenes/captures and stops frames immediately, but a pending setScene Promise still awaits the controlled native capture return before rejecting; no early capture-Promise abortion is claimed. The formal example also proves paused-effect cancellation. Final toolchain37files/252tests and packed consumer passed; existing instant switches remain the default.

```js
import { Easings } from 'xyz.js';

game.addEventListener('transitioncomplete', (event) => {
  console.log(event.detail.kind, event.detail.to);
});
await game.setScene(nextScene, {
  transition: {
    kind: 'slide',
    duration: 0.5,
    direction: 'left',
    easing: Easings.sineInOut,
    blockInput: true,
  },
});
```

SetSceneOptions.transition is TransitionOptions {kind:'fade'|'crossfade'|'slide',duration,easing?,color?,direction?,blockInput?}. Duration is finite nonnegative simulation seconds, normalized ColorRGBA defaults to opaque black, direction defaults left, easing linear, blockInput true. Fade goes outgoing→color→incoming; crossfade blends; slide supports left/right/up/down. game.transitioning indicates an active visual effect, not candidate loading.

Preparation leaves the old Scene active; successful preparation and owned capture, followed by cancellation/version checks, precede publication and old destruction. Only the new Scene simulates during visual blending. The Promise resolves after the last composited frame, not merely publication. Pause/hidden freezes transition time, including an outstanding Promise; resize preserves/scales the immutable outgoing snapshot. Initial no-old/idle switches and duration=0 skip visual capture/events and finish atomically. Preparation/capture failure preserves current Scene; replacement cancels the candidate/effect, rejects its pending Promise and releases its snapshot.

Native Game transitionstart/transitioncomplete/transitioncancel detail SceneTransitionEventDetail {from,to,kind} is emitted only for actual visual transitions. blockInput clears capture and blocks targeted object pointer routing, not keyboard/global input polling. Snapshot lifetime ends on completion/cancel/explicit destruction/renderer loss/destruction, not old Texture destruction or resize.

Low-level Renderer.captureScene(scene,width,height):Promise&lt;RenderSnapshot&gt; redraws without simulation into owned storage (all 3D/P12, world/HUD and enabled effects; no transition overlay). Width/height arguments are logical pixels; snapshot width/height are backing pixels. RenderSnapshot exposes only backend/width/height/destroyed/destroy; wrong-renderer/destroyed handles and active-frame nested capture reject. Renderer.render(scene?,width?,height?,{transition}) accepts TransitionFrame {kind,progress,snapshot?,color,direction}; normalized progress 0–1, missing snapshot uses color. PresentedRenderer forwards capture and presents already composited output; no delayed read of preserveDrawingBuffer=false canvas. Leave Game-owned frame/capture management to setScene rather than issuing competing frames from its RAF loop.

## 18. PixiJS-Inspired Expansion Status (P21–P29)

The finite profiles in [PLAN](../PLAN.md) are integrated in source and were exercised in one environment (macOS arm64, managed headless Chromium with a WebGPU adapter); [ACCEPTANCE](../ACCEPTANCE.md) lists what was observed and what was not. Do not treat the historical 252 tests or GitHub v1.2 as verification of these APIs. The runnable reference is [examples/rendering2d](../examples/rendering2d/index.html) (`?renderer=webgpu|webgl2|canvas2d`), which drives atlas views, retained paths, isolation/masks/blends/filters, native meshes, render targets, styled and bitmap text, manifests, interaction/accessibility and particles on one Game.

The approved path stays Game→Scene→Renderer. Ordinary Groups retain global ordering; only explicit IsolatedGroup boundaries prevent external objects interleaving with descendants. Cached child edits require manual invalidation and do not pause simulation. Offscreen RenderTexture and independent generated CPU Texture are not the immutable whole-frame transition RenderSnapshot.

Canvas supports the approved ordinary/raster 2D profile; visible native meshes and native filters must throw rather than silently disappear or switch backend. Image-mask input is bounds-only, even at transparent pixels; rectangle/path masks include geometric holes. Hierarchy events/accessibility are opt-in, preserving default target-only routing and semantic-only DOM lifecycle.

Resources remain explicit: views, meshes, fonts and particles borrow sources; remove borrowers before destroying their owning asset. Native texture unload leaves CPU sources usable. Atlas anchors/borders, CanvasTexture updates, generated RGBA fonts, ParticleLayer and preparation/unload are required, not optional. These profiles do not promise full Pixi, HTML/SDF/video/compressed/plugin/automatic-GC parity.

The compressed-source exclusion is historical P21–P29 scope: P32 KTX2 decoding/external codecs and P42 native compressed/mip profiles expand that boundary, not the other Pixi non-goals. Exercised formats and remaining limits are in ACCEPTANCE.

The authored [fixture factory](../examples/rendering2d/fixtures.ts) produces disposable object URLs for atlas/pattern/masks and multipage text/JSON BMFont. Its real font [provenance/license](../examples/rendering2d/assets/README.md) is separate from engine licensing.

### Affine helpers: observed P21 source foundation

On a live Scene Sprite, pixel pivot and radian skew are independent of normalized anchor. Helpers operate in logical Scene world (also for HUD), not camera or CSS coordinates:

```js
import { Vector2 } from 'xyz.js';

sprite.pivot = new Vector2(8, 4);
sprite.skew = new Vector2(0.1, -0.05);
const point = new Vector2(4, 7);
sprite.toWorld(point, point);
sprite.toLocal(point, point); // approximately (4, 7); output may alias input
const worldBounds = { x: 0, y: 0, width: 0, height: 0 };
sprite.getWorldBounds(worldBounds); // conservative transformed AABB
sprite.pivot.x += 10; // mutable-vector edits are recomposed
```

Singular inverse transforms throw RangeError. Isolation, masks, native filters, blends and offscreen targets share one API surface (Canvas2D throws `UnsupportedGraphicsError` for filters and visible meshes):

```js
import { BlurFilter2D, IsolatedGroup2D, Mask2D, Sprite } from 'xyz.js';

const group = scene.add(new IsolatedGroup2D());
group.add(new Sprite({ texture }));
group.mask = Mask2D.rectangle({ x: 0, y: 0, width: 64, height: 64 });
group.filters = [new BlurFilter2D({ radius: 3 })]; // WebGPU / WebGL2 only
group.blendMode = 'add'; // normal | add | multiply | screen | erase

const target = game.graphics.createRenderTexture({
  width: 160,
  height: 100,
  resolution: 2,
});
await game.graphics.renderToTexture(target, group); // never advances simulation
const pixels = await game.graphics.extractPixels(target); // straight-alpha RGBA
target.destroy();
```

## Weighted 3D transparency

```ts
scene.transparency = 'weighted'; // default: 'sorted'
const material = new TextureMaterial({ texture, transparent: true });
```

Use `transparent: true` for TextureMaterial texture/vertex alpha at opacity one;
opacity below one already opts in. PBR uses `alphaMode: 'BLEND'`.
Sprite3D/Text3D opt in automatically. Weighted OIT approximates intersecting
surfaces without exact layer sorting. It requires WebGPU or WebGL2 with float
color attachments, and does not add multilayer refraction or transparent depth
for SSAO/DOF. Try the toggle and reverse-order button in
[objects3d](../examples/objects3d/index.html).

## P40 Rendering Diagnostics and Browser Regression (scoped acceptance)

Read `game.graphics.stats` without retaining the mutable object as a historical snapshot: copy fields you need. Existing 3D draw/triangle/shadow counters retain their definitions. `drawCalls2D`, `instances2D`, `renderPasses2D`, `uploadBytes` are per-frame CPU work counters including native effects/composition; Canvas reports paint/pass work, not GPU batch parity. `renderTargetBytes` estimates live owned attachments (including offscreen caches/captures) and `peakRenderTargetBytes` their renderer-lifetime peak; they are not reset by frame begin. Release/destroy decreases resident bytes, not the lifetime peak. These are **not GPU timers**, driver memory, general resource budgets or an FPS-improvement claim. DebugOverlay displays the new fields; [TECHNICAL](TECHNICAL.md) documents adjacent batching constraints and reset boundaries.

The deep runner is `pnpm regression:browser` after `pnpm build` and `pnpm exec playwright-core install chromium`. Default required backends are Canvas2D/WebGL2; WebGPU is probed and explicitly SKIPped when unavailable. `--renderer canvas2d|webgl2|webgpu` (comma-separated list) selects required backends; requesting WebGPU or `--require-webgpu` fails if unavailable. `--output DIR` selects assertion JSON/canvas PNG artifact output (default `.vite/browser-regression`). The installed Chromium software-rendering CI gate and existing example smoke are distinct from cross-browser/real-GPU certification; WebGL context loss uses the real extension, while private-device WebGPU loss injection remains an explicit SKIP. Actual three-backend Chromium 153 evidence and historical hosted CI failures are in ACCEPTANCE.

Linux scripts use the shared SwiftShader launcher with Vulkan enabled for the compositor as well as the WebGPU adapter. The canvas swap-buffer correction passed required three-backend regression on isolated Ubuntu 24.04 arm64; it is not yet verified on hosted Ubuntu x64. Use `--require-webgpu` to require adapter availability during local verification; no fallback or assertion is suppressed.

For P41/P42 approval boundaries and all third-round options, use [PLAN](../PLAN.md) and [DESIGN](../DESIGN.md); do not treat historical non-goals as permission to omit approved work.

## 21. P41 Authoring/Device Flow

Scoped Chromium three-backend proof is recorded in [ACCEPTANCE](../ACCEPTANCE.md). Use the existing renderer, not a DOM visual overlay. See [bounded contracts and ownership](TECHNICAL.md#41-p41-authoringdevice-contracts).

| Example                                     | Purpose                                                                                                         |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| [authoring-lab](../examples/authoring-lab/) | Formal root consumer: UI/focus/modal, contexts/virtual controls, texture leases/warmup, typed content/save-load |

### Canvas UI and routed actions

```ts
import {
  Game,
  Scene,
  UIRoot,
  UIElement,
  UILabel,
  UIButton,
  UICheckbox,
  UISlider,
} from 'xyz.js';

const game = await Game.create({
  canvas: '#game',
  renderer: 'auto',
  resourceBudgets: {
    decodedTextureBytes: 32 * 1024 * 1024,
    nativeTextureBytes: 32 * 1024 * 1024,
    nativeGeometryBytes: 16 * 1024 * 1024,
  },
});
const scene = new Scene();
const root = scene.add(
  new UIRoot(game, { direction: 'column', padding: 16, gap: 8 }),
);
const title = root.add(await UILabel.create('Settings'));
const open = root.add(await UIButton.create('Open settings'));
const modal = root.add(
  new UIElement({ direction: 'column', width: 280, gap: 8 }),
);
modal.add(await UICheckbox.create('Music', { checked: true }));
modal.add(
  await UISlider.create('Volume', { min: 0, max: 1, step: 0.1, value: 0.5 }),
);
const close = modal.add(await UIButton.create('Close'));
modal.visible = false;
open.addEventListener('click', () => {
  modal.visible = true;
  root.focus.pushModal(modal);
});
close.addEventListener('click', () => {
  root.focus.popModal();
  modal.visible = false;
});
await title.setText('Settings ready');
await game.setScene(scene, { warmup: { maxItems: 2, maxMilliseconds: 4 } });
game.start();
root.focus.focus(open);

const world = game.input.contexts.create('world', {
  priority: 0,
  consume: true,
  bindings: {
    interact: [{ key: 'Space' }, { pointerButton: 0 }, { virtual: 'interact' }],
  },
});
world.activate(); // Read world.wasPressed('interact') during scene update.
game.input.virtual.set('interact', 1);
game.input.virtual.set('interact', 0); // Release on cancel/up/blur too; reset() neutralizes all.
const savedBindings = world.exportBindings();
world.importBindings(savedBindings);
// On teardown: world.destroy(); game.destroy();
```

UI contexts activate only while live semantic focus/modal exists; focus/keyboard/gamepad activation and pointer consumption share source precedence. DOM is semantic only. Modal pop restores eligible previous focus. Held input on activation/unblocking is not a new press; raw polling remains raw. `gamepadIndex` selects the actual browser index. Additional bindings include signed virtual controls, wheel axis/direction and recognized gestures. Use async `setText`; layout is bounded row/column/overlay, not full CSS.

### Typed content with explicit ownership

```ts
import {
  GameObject,
  FactoryRegistry,
  defineFactory,
  buildContentScene,
  parseContentScene,
} from 'xyz.js';

const registry = new FactoryRegistry({
  marker: defineFactory<{ x: number }, GameObject, { origin: number }>({
    parse(value: unknown) {
      if (
        typeof value !== 'object' ||
        value === null ||
        !('x' in value) ||
        typeof value.x !== 'number' ||
        !Number.isFinite(value.x)
      )
        throw new TypeError('marker.x must be finite');
      return { x: value.x };
    },
    create(options, context) {
      const node = context.own(new GameObject());
      node.position.x = context.services.origin + options.x;
      return node;
    },
  }),
});
const definition = {
  version: 1,
  nodes: [{ id: 'player', kind: 'marker', options: { x: 24 } }],
} as const;
const content = await buildContentScene(registry, definition, { origin: 10 });
const player = content.get('player'); // GameObject | undefined
const dynamicDefinition = parseContentScene(
  registry,
  JSON.parse('{"version":1,"nodes":[]}'),
);
const dynamicContent = await buildContentScene(registry, dynamicDefinition, {
  origin: 10,
});
dynamicContent.scene.destroy();
await game.setScene(content.scene, { warmup: { maxItems: 2 } });
content.require('player', 'marker').position.y = 20;
```

Call `context.own` before fallible awaits in async factories; return fresh detached owned subtrees, not shared/live objects. Services/assets stay borrowed. JSON parents and `references: { alias: 'id' }` are preflighted; factories access only declared aliases through `context.reference(alias)`. Build is unpublished until setScene. The serializer includes explicit 2D IDs only, not 3D or unnamed prefab descendants.

For loader textures use `const lease = await game.assets.acquireTexture(url)` and borrow `lease.texture`; remove borrowers before `lease.release()`. Legacy loadTexture pins until unload/destroy. Manual `await game.warmup(scene, options)` leases must be released explicitly; setScene warmup protects the candidate for scene lifetime and preserves the old scene on combined-budget failure. Item/time boundaries are between resources; one resource can exceed the chunk time, and dependency snapshots do not track mutations. Progress excludes old-scene protection prelude.

Decoded CPU/native texture/native geometry budgets are independent cache estimates. Native eviction only affects idle unprotected allocations and allows reprepare, not borrowed CPU ownership. Canvas native residency is zero. Caller bitmaps/derivedCanvas/attachments/scratch/driver/pipelines are excluded; budgets are not total VRAM or hard process-memory limits. Inspect `game.assets.residency` and `game.graphics.residency` separately.

## 22. P42 3D Gameplay and Animation

The root API includes finite 3D primitive physics, capsule movement, authored waypoint navigation and the bounded animation profiles described in [TECHNICAL](TECHNICAL.md#42-p42-native-rendering-physics-navigation-and-animation-profiles). Physics runs automatically with the active Scene; character/path updates are explicitly gameplay-controlled.

```ts
import {
  Scene,
  Object3D,
  Vector3,
  PlaneCollider3D,
  CapsuleCollider3D,
  CharacterController3D,
  NavigationGraph3D,
  PathFollower3D,
} from 'xyz.js';

const scene = new Scene();
const floor = new Object3D();
floor.collider = new PlaneCollider3D();
scene.add(floor);
const player = new Object3D();
player.collider = new CapsuleCollider3D(0.25, 1.5);
player.position.set(0, 1, 0);
scene.add(player);
const character = new CharacterController3D(player, scene.physics3D);
const graph = new NavigationGraph3D({
  nodes: [
    { id: 'start', position: new Vector3(0, 1, 0) },
    { id: 'goal', position: new Vector3(2, 1, 2) },
  ],
  connections: [{ from: 'start', to: 'goal', cost: Math.sqrt(8) }],
});
const follower = new PathFollower3D(character, { speed: 2 });
follower.setPath(graph.findPath('start', 'goal'));
let playing = true;
scene.update = (deltaSeconds: number): void => {
  if (playing) follower.update(deltaSeconds);
};
function setGameplayPaused(paused: boolean): void {
  playing = !paused;
  scene.physics3D.enabled = !paused;
  scene.animations.paused = paused;
}
// Publish with await game.setScene(scene), then game.start().
// On owned gameplay teardown: follower.destroy(); character.destroy();
// Scene/Game teardown handles its objects and worlds.
```

Graph points are capsule centers; author obstacle-safe routes yourself. The controller does not supply gravity or jumping: call `character.move` with your own displacement when those are needed. Copy its reused movement/contact values before the next move. A blocked follower needs explicit `resume()` after the obstruction changes. Gameplay pause keeps Game running so engine HUD controls remain interactive; `Game.pause()` instead freezes the entire simulation. Audio must be paused/resumed explicitly in either case.

For animation, assign explicit `AnimationMask` channel allowlists; use `AnimationReferencePose` with `action.setAdditive` for reference-relative overlays. `AnimationBlendTree` owns synchronized leaf actions for 1D points or explicitly triangulated 2D parameters. Add `TwoBoneIKConstraint` to the same mixer for a direct root/middle/tip chain. Animation sampling/IK precedes Scene.update, so gameplay can adjust the final pose afterward. Mixers borrow targets; clear/destroy releases playback/constraints, not those objects.

### Native skin and mip textures

WebGPU/WebGL2 render skin palettes natively; conservative animated bounds use transformed influence boxes, while exact CPU deformation is lazy for queries. Morph deformation precedes skinning. This is a bounded profile, not a throughput claim. Native textures likewise require GPU/GL: check `game.graphics.capabilities.supportedTextureFormats` for the actual device, not just the backend name.

```ts
import { NativeTexture2D, decodeKTX2Native, GLTFLoader } from 'xyz.js';
import type { NativeTextureMip } from 'xyz.js';

const levels: NativeTextureMip[] = [
  { width: 2, height: 2, data: new Uint8Array(16).fill(255) },
  { width: 1, height: 1, data: new Uint8Array([255, 255, 255, 255]) },
];
const texture = new NativeTexture2D({
  format: 'rgba8unorm',
  width: 2,
  height: 2,
  levels,
});
// Assign texture to a material; opt into mip sampling with textureSampler:
// { minFilter: 'linear', magFilter: 'linear', mipmapFilter: 'linear', lodMaxClamp: 1 }
const response = await fetch('/assets/model.ktx2');
if (!response.ok) throw new Error(`KTX2 HTTP ${response.status}`);
const native = await decodeKTX2Native(
  new Uint8Array(await response.arrayBuffer()),
);
const asset = await new GLTFLoader().load('/assets/model.glb', {
  nativeTextures: true,
});
// Remove all borrowers first, then texture.destroy(), native.destroy(), asset.dispose().
```

Mip dimensions halve (rounded down, minimum one); each payload must match its exact RGBA/block layout. Native KTX2 preserves every supplied mip for supported Vulkan formats with no/ZLIB supercompression. Basis or other encodings require a real `KTX2NativeTranscoder` (glTF option `ktx2NativeTranscoder`), not the ordinary RGBA `ktx2Transcoder`. Unsupported formats reject without decompression or backend switching; ordinary images and the default base-level KTX2 path are unchanged. See [technical section 42](TECHNICAL.md#42-p42-native-rendering-physics-navigation-and-animation-profiles) for root profiles and [ACCEPTANCE](../ACCEPTANCE.md) for native evidence and limits.

### Play Beacon Run

Open [Beacon Run](../examples/beacon-run/) through the local examples server, optionally with `?renderer=webgpu` or `?renderer=webgl2`. Canvas2D (including an `auto` fallback to Canvas) shows an explicit unsupported-3D error; it does not substitute a 2D game. Complete GPU/GL gameplay flows passed scoped P42 acceptance.

- **Loading/menu:** pipeline warmup and real OPM asset fetches show progress. On asset failure choose **Retry asset loading**. **Start with sound** needs a trusted pointer click or Enter/Space activation of its semantic control; fetch alone does not unlock/decode audio. **Play muted** starts without audio unlock. Settings offers **Enable sound / retry unlock**.
- **Play:** collect all four cyan beacons and return to the green extraction pad before the 75-second timer expires. Avoid the red patrol drone; interception or timeout loses. Push dynamic crates or jump around obstacles. The HUD shows signals/time and status; win/lose panels offer **Restart run** or **Main menu**.
- **Controls:** WASD/arrows or the standard gamepad left stick move; Space/gamepad A or the canvas **Jump** button jumps when grounded. Pointer/touch/keyboard direction sliders reset on release/cancel/blur. Tab reaches engine semantic controls; focused UI takes precedence over world movement. Use **Return focus to arena** or click the arena to return to gameplay.
- **Pause/settings:** Escape or **Pause** freezes timer, physics, navigation and animation while renderer/UI remain live; blur/hidden-page also pauses. **Resume run** continues. Settings traps modal focus and persists master volume, mute and reduced character motion. Gameplay audio uses an explicit pause reason, not an assumption that `Game.pause()` pauses sound.
- **Saves:** validated local-browser storage keeps preferences and one continuation, including time/signals/player/patrol/crate transforms and velocities. Progress autosaves periodically, on collection and pause; **Save run**, **Load saved run** (restores paused), and menu **Continue saved run** support reloads. Ended runs cannot continue; missing/corrupt/storage-unavailable state reports a message instead of fabricating progress.
- **Teardown/recovery:** **Destroy game** or non-persisted pagehide saves an unfinished run where possible and releases input contexts, controllers/follower, Scene physics/UI borrowers, audio and the shared native mip texture; reload to play again. Graphics loss pauses the run; resume after recovery. A persisted pagehide pauses rather than destroying.

## 23. Fixed Gameplay and Presentation

Use `fixedUpdate` for simulation-sensitive movement and continuous forces; keep frame UI and one-shot input collection in `update`. The Game advances both physics worlds after every fixed callback.

```ts
import {
  Scene,
  Object3D,
  RigidBody3D,
  SphereCollider3D,
  Vector3,
} from 'xyz.js';

class FixedScene extends Scene {
  readonly actor = this.add(new Object3D());
  private readonly thrust = new Vector3(120, 0, 0);
  constructor() {
    super({ fixedDelta: 1 / 120, maxFixedSteps: 12, interpolatePhysics: true });
    this.actor.collider = new SphereCollider3D(0.5);
    this.actor.body = new RigidBody3D({ gravityScale: 0 });
  }
  override fixedUpdate(): void {
    this.actor.body!.applyForce(this.thrust);
  }
}
```

Do not also call `physics.update`/`physics3D.update` from either hook. `fixedFrame`/`fixedElapsed` describe completed scene ticks, and `droppedSimulationTime` records bounded catch-up loss. Interpolation affects only Game rendering, not the actor's simulation position or queries. Frame-submitted forces are time-weighted, including frames with no physics tick; `clearForces()` cancels pending impulse. See [the timing contract](TECHNICAL.md#43-fixed-gameplay-frame-forces-and-presentation).

## 24. Release Verification (P44)

Use `pnpm regression:browser --renderer webgpu` for a mandatory available-GPU proof; the default run also covers Canvas2D/WebGL. Release tags depend on the same reusable CI verification gate, before packing/publication. Inspect `.vite/browser-regression/` and `.vite/example-smoke/` when a gate fails; source changes/local runs are not proof of hosted Ubuntu recovery.

## 25. 3D Candidate Statistics (P45)

Read a copy of `scene.physics3D.stats` after a fixed tick/query to retain candidatePairs/narrowphaseTests/queryCandidates. Immediate mutable-transform edits/removal are reconciled on query, so a shared spatial index does not imply wholly sublinear query time. [Contract](TECHNICAL.md#45-shared-3d-spatial-index-p45).

## 26. Incremental Navigation (P46)

Create `new NavigationGrid2D({columns:64,rows:64})`, then `grid.createSearch({column:0,row:0},{column:63,row:63})`. Call `job.step(32)` once per gameplay tick; consume `job.result` only at terminal found/unreachable. Cancel abandoned jobs; grid edits invalidate pending jobs. Eight simultaneous jobs per owner is a deliberate bound, not an unlimited scheduler.

## 27. Dynamic Authored Routes (P47)

Create `NavigationFollower3D` around an owned CharacterController3D, then `navigate({graph,start,goal,agentRadius})` and update it from fixed gameplay. Update authored topology with graph.setConnection/setConnections; use clearance as a radius in world units. Revision/physical blockage initiates bounded replanning from the last reached anchor; do not keep moving with a stale path. [States and limits](TECHNICAL.md#47-dynamic-navigation-and-replanning-p47).

## 28. Mixed Load and Soak (P48)

Open `/benchmarks/mixed/`, or run `pnpm soak:mixed --preset smoke --duration 60 --renderer all --parallel 1 --output /tmp/mixed.json --timeout 400`; use `--preset hour --timeout 3900` for an actual hour per backend and `--consumer /absolute/extracted/package` for the packaged root. `--parallel 1` shares host contention; `--parallel 0` runs three backends sequentially and requires more than three hours overall. Keep the page visible. Review RAF tails, separately measured CPU phases and every cycle's cleanup assertions; a short successful run does not establish indefinite cache/driver-memory plateau.

## 29. Save Dynamic 2D/3D Content (P49)

Save `JSON.stringify(content.capture())`; reconstruct with `await rebuildContentScene(registry, JSON.parse(json), services)`, then publish candidate.scene through game.setScene. Keep the candidate ContentScene for subsequent spawn/remove/save. Factories reconstruct geometry/assets; declare children aliases/stable IDs and state adapters for named prefab descendants/custom SceneObjects. Every live object must have an authored ID; dangling references block removal. [Ownership contract](TECHNICAL.md#49-explicit-3d-and-content-round-trip-p49).

## 30. Reproducible Assets and Deployment (P50)

Run `pnpm assets:build --input examples/asset-recipe/source.gltf --out /tmp/xyz-assets`; after `pnpm pack` and extraction, run `pnpm check:asset-deployment --package /absolute/extracted/package --bundle /tmp/xyz-assets --renderer webgl2` (repeat with webgpu). Follow the pinned-toolchain/manifest/codec requirements in [Asset Recipe](ASSET-RECIPE.md). Deploy the entire dist tree, including official vendor worklet assets.

Recipes preserve `KHR_materials_variants`, anisotropy/iridescence maps and dispersion (with transmission) across bundle choices. Select variants with `gltfVariants(asset).selectVariant(name)`. Optical maps remain linear data; declare explicit texture semantics in the trusted profile. For authored materials, pass `opticalMaps: { anisotropyTexture, iridescenceTexture, iridescenceThicknessTexture, iridescenceThicknessMinimum: 100, iridescenceThicknessMaximum: 400 }` alongside `finish`; maps are borrowed and share the existing optical sampler array. Per-map UV transforms use `textureCoordinates.anisotropy`, `.iridescence`, `.iridescenceThickness`.

## 31. Native Text Editing (P51)

```ts
const root = scene.add(new UIRoot(game, { direction: 'column', gap: 8 }));
const field = root.add(
  await UITextInput.create({
    label: 'Name',
    value: '語',
    maxLength: 32,
    layout: { width: 280, height: 40 },
  }),
);
root.focus.focus(field);
field.setSelectionRange(0, field.value.length);
```

Keyboard/clipboard/undo/IME edit the native transparent input, while canvas draws text/selection/caret. Offsets and maxLength use UTF-16. Focus after publication/layout; normal gameplay keyboard polling excludes editing targets. [Events and limits](TECHNICAL.md#51-native-editing-canvas-text-input-p51).

## 32. Scroll and Bounded Virtual Lists (P52)

Add widgets through `view.content.add(widget)` on UIScrollView; set a finite viewport layout and use scrollTo/reveal. UIVirtualList requires a synchronous fresh-detached owned-row factory and synchronous bind that resets reused item state; prepare async canvas widgets before passing them to that factory. Stable keys preserve active rows on reorder, focusKey reveals unmounted rows, and mounted/pool counts stay bounded. Destroy any unused prepared rows yourself. [Viewport/focus contract](TECHNICAL.md#52-scrolling-focus-reveal-and-virtual-lists-p52).

## 33. Triangle Floors and Walls (P53)

Attach `new TriangleMeshCollider3D(xyz, triangleIndices, {sidedness:'double'})` to a static/collider-only Object3D. It is a surface, not volumetric solid containment; use front for authored counterclockwise one-sided collision. Replacing the descriptor rebakes owned geometry; changing a Mesh's render vertices alone does not. [Transforms and queries](TECHNICAL.md#53-static-triangle-mesh-colliders-p53).

## 34. Compound Shapes (P54)

Build CompoundCollider3D from flat child collider/position/rotation/scale descriptors. Center primitive children at their uniform-density COM before attaching a dynamic body; root filters apply to the union and gaps stay empty. A mesh child makes the whole compound static-only. [Inertia and bounds](TECHNICAL.md#54-compound-colliders-and-inertia-p54).

## 35. Continuous 3D Translation (historical P55)

P55 introduced `new RigidBody3D({continuous:true})` for static-target translation sweeps. That historical exclusion of rotation/dynamic pairs is superseded by the v1.10 bounded dynamic-pair/angular solver in section 38; public translation sweeps keep their translation-only contract. Keep fixed steps reasonably small. Iteration exhaustion retains only a proven-free prefix rather than inventing an impact. [Current bounded policy](TECHNICAL.md#55-bounded-3d-continuous-rigid-motion-p55-v110-expansion).

## 36. Consume Root Motion (P56)

Create AnimationRootMotion(skeletonRoot,{target:actor}) and assign that same binding to each locomotion action via setRootMotion. Alternatively provide a sink, transform reused body-local deltas into world coordinates and pass them to CharacterController3D.move. A dedicated AnimationMixer advanced from fixedUpdate avoids double-advancing Scene.animations. [Loops, callbacks, units and ownership](TECHNICAL.md#56-animation-root-motion-p56).

## 37. Retarget Before Playback (P57)

Declare one-to-one source/target nodes and explicit bind transforms in AnimationRetargeter mappings, including each non-root direct parent; set corresponding skeleton roots. Retarget the source clip once, then use the resulting clip with the existing target mixer/skin/root-motion consumers. Never mutate source tracks to adapt them. [Scale/interpolation restrictions](TECHNICAL.md#57-explicit-bind-pose-retargeting-p57).

## 38. Production Contracts (v1.10)

These additions are included in **v1.10 / 1.10.0 / Apache-2.0**, not changes to published v1.9 assets; historical dates/counts above remain historical. [Technical contracts](TECHNICAL.md) define bounds, ownership and error behavior; [asset recipe](ASSET-RECIPE.md) defines the real external toolchain.

- **Startup:** Scene physics/animation/3D camera/navigation initialize on use. Canvas startup does not load GPU backend chunks; shared root-facade reachability remains, so this is not a separate microengine.
- **Assets:** pinned official Basis v2_50 and Draco 1.5.7 produce semantic gamma/normal/alpha mips, BC7/ETC2 RGBA8/ASTC 4×4, universal Basis and PNG/RGBA fallbacks, plus compressed/expanded glTF. Runtime selection is capability-driven, not silent backend switching. Codecs remain external, with no runtime dependency added. Typed Draco preserves raw/normalized/logical accessor metadata; do not assume arbitrary UInt32 values survive the entire Float32 glTF consumer path.
- **Ownership/save publication:** use ResourcePool scopes for shared acquisitions, candidate rollback and borrower-first teardown. Register factory-created nodes through `ctx.own`; late cancelled factories are tracked. Fresh save candidates publish only after successful preparation; failure/cancellation preserves the previous live scene. Cleanup failures are surfaced and retained for retry, not swallowed.
- **Measured work:** spatial queries refresh/refit geometry only when changed, but public mutable pose checks remain O(N). Navigation searches, admissions and collision bakes share one bounded cooperative Scene quota per visible Game frame, not an independent budget per NPC. Pause/lifecycle cancellation and debug counters are integrated. Work units are not a preemptive millisecond guarantee.
- **3D physics:** upright capsule controllers carry moving/rotating support motion, detach on jump/removal/teleport and preserve feet while changing stance; blocked standing remains crouched. Distance, ball-socket and hinge joints include bounded spring/motor/limit/break profiles. Opt-in continuous bodies now cover dynamic pairs and angular motion; exhausted CCD retains conservative free motion and reports exhaustion. This does **not** expand Physics2D translation-only CCD.
  That Physics2D exclusion is historical P58–P70 scope; P76 now adds bounded relative dynamic/rotational CCD (section 39).
- **Navigation:** `NavigationGridBakeJob2D` samples collision occupancy; `NavigationSurfaceBakeJob3D` now retains bounded multiple supports and swept capsule edge clearance. Bake/rebake publication is atomic and revision-sensitive. P78 expands the historical topmost-only profile to a finite multisurface lattice, not polygon navmesh generation.
- **Text:** native 2D text/input supports bidi visual order, grapheme-safe caret/selection and fallback font runs. Trusted browser editing evidence is not OS IME certification. Text3D still uses native fillText, not the new 2D run/caret renderer.
- **Audio:** channel/master native biquad, compressor and prepared convolution effects apply to sample/stream/OPM sources; activity-driven ducking, absolute manager-clock automation/cancel-and-hold, and listener/emitter world bindings use the manager's single shared context (since P137; previously eight contexts). Pause uses explicit audio reasons, not implicit `Game.pause()`. Bindings borrow objects/playbacks; unbind before owner teardown.

### Aggregate navigation example

This runs in an existing page with an initialized `game`; normal Game frames advance the scheduler, so do not update it again from each NPC:

```ts
import { Scene, NavigationGrid2D } from 'xyz.js';

const scene = new Scene({ navigationWorkBudget: 32 });
await game.setScene(scene);
const grid = new NavigationGrid2D({ columns: 8, rows: 8 });
const search = grid.scheduleSearch(
  scene.navigation,
  { column: 0, row: 0 },
  { column: 7, row: 7 },
);
// Inspect search.status/result and a copy of scene.navigation.stats on later frames.
// Scene destruction cancels scene-owned scheduled work.
```

### Native music processing example

Call from a trusted user gesture on an initialized `game`. These settings process actual music routed through the manager, not a synthetic mock:

```ts
await game.audio.unlock();
game.audio.music.setEffects([
  { type: 'biquad', filter: 'lowpass', frequency: 1800, Q: 0.7 },
  { type: 'compressor', threshold: -24, ratio: 4 },
]);
game.audio.setDucking([
  { source: 'sfx', target: 'music', gain: 0.25, attack: 0.02, release: 0.2 },
]);
game.audio.music.automate(0.5, game.audio.currentTime, 0.3, 'linear');
// Real active sfx playbacks duck music automatically.
// game.audio.music.cancelAutomation() holds the current gain.
```

### Verification and runnable diagnostics

Use `pnpm check:tree-shaking`, `pnpm platform:browser` and `pnpm smoke:text` for focused diagnostics. Asset commands require real paths: `pnpm assets:build --input /absolute/model.gltf --out /absolute/new-bundle --profile /absolute/trusted-profile.json`, then `pnpm check:asset-deployment --package /absolute/extracted/package --bundle /absolute/new-bundle --renderer webgl2 --profile /absolute/trusted-profile.json`. Output must not already exist; profile setup is documented in [asset recipe](ASSET-RECIPE.md). For mixed runtime measurement use `pnpm soak:mixed --duration 3600 --renderer all --output /tmp/mixed-hour.json`; specifying an hour is not evidence that an hour was completed. Keep the page visible and use the observability instructions in [ACCEPTANCE](../ACCEPTANCE.md).

Current handoff evidence includes scoped Chromium 153/Firefox 155/managed WebKit 26.6 paths (Firefox WebGPU adapter unsupported), actual pinned codec CLI runs, built-root physics/navigation/resource scenarios and native Chromium WebAudio signal measurements. The 10-second native Apple M5 shared-host observability smoke measured heap/GC/RSS and GL GPU timestamps; Canvas GPU timing is unsupported (`null`). RSS is not VRAM. Hour/low-tier results require separately recorded completed runs. Mobile emulation is not physical-device certification. Safari formal verification, physical mobile/gamepad/audio hardware and OS IME remain unverified; do not run Safari automation against another owner's session. Final platform reruns and long-run evidence are recorded in ACCEPTANCE, not inferred from these examples.

## 39. P71–P87 Production Expansion

These v1.11 contracts use metadata **1.11.0** and npm unpublished. Source delivery, historical browser observations and final native acceptance are different: use [ACCEPTANCE](../ACCEPTANCE.md) for exercised gates, never infer parity/certification from this list.

| Surface                 | Consumer contract / boundary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P71 audio               | Prepare streams with `autoplay:false` when loading outside a gesture, then call `play()` directly from a trusted action. Context unlock is not a global media autoplay guarantee. Pause/stop/cancel supersede pending startup; native failures remain observable. Independent contexts preserve local rendered gain envelopes; no hard-real-time/device timing promise.                                                                                                                                                   |
| P72–P73 consumers       | Use the starters and installed public root above; keep the full dist/vendor/worker tree. Existing stage counts/dates describe their historical versions, not this expansion.                                                                                                                                                                                                                                                                                                                                              |
| P74 saves               | SaveManager revisions reject observed stale owners; native IndexedDB transactions or LocalStorage Web Locks coordinate tabs. Custom backends are process-local; LocalStorage is not crash-atomic. `load(slot,{recovery:true})` reads backup without overwriting corrupt text; explicit `restore(slot)` archives the damaged payload. AutosaveController owns timers/pending writes, exposes visible state, requires explicit retry after error and must be destroyed by its owner. Load/resolve stale state before retry. |
| P75 platforms           | Hardware gates require actual identity/version/session and native scenario evidence. Emulation, managed WebKit and accessibility trees are not physical-device, Safari or assistive-technology certification. Audible-output proof is blocked by the no-sound requirement.                                                                                                                                                                                                                                                |
| P76 2D motion           | CharacterController2D borrows an upright registered root convex owner/world; call `move` in `Scene.fixedUpdate` with `epoch:scene.fixedFrame`, supply gravity/jump, then destroy the controller. Platform carry is consumed once per epoch. Bounded relative rotational CCD reports omitted unproven time on exhaustion, not fabricated contacts or velocity clamps; sensors remain discrete.                                                                                                                             |
| P77 locomotion          | `scene.createLocomotion3D(controller,options)` owns an independent fixed mixer/driver, borrowing the capsule and visual skeleton. Set input in fixedUpdate; never also manually advance the driver or add its mixer to ordinary Scene animations. Scene destroys the driver, not borrowed objects. Upright capsule/yaw profile; no universal climbing/swimming controller.                                                                                                                                                |
| P78 navigation          | Finite multilayer sampled lattice: default 4/max 8 support slots, at most 8192 total slots, bounded support sampling and capsule clearance; not polygon navmesh or continuous support proof. Projection requires horizontal/vertical distance bounds and certified agent radius. Bake/search share Scene quota. Explicit special links need real traversal handlers; missing handlers block, never teleport through floors.                                                                                               |
| P79 visibility          | Renderer-owned visible collections preserve offscreen shadow casters/full shadow instances. Screen LOD/HLOD use coverage and owned-node replacement; resources remain borrowed. Native occlusion is opt-in exact-state depth-query proof; pending/stale/exhausted proofs stay visible. Mutable pose refresh remains O(meshes), instance tests O(instances); unknown custom displacement stays conservatively visible.                                                                                                     |
| P80/P84 material/lights | NativeMaterial3D supplies explicit WGSL/GLSL mesh hooks, borrowed textures/uniforms and a finite deformation bound when available; no shader transpiler or Canvas3D fallback. Native preparation failures must be handled before publication. Finite camera/shadow distances and per-draw point/spot selection are separate from Scene light pools; budgets select/reject explicitly, never imply every authored light/shadow affects every draw. Native backend acceptance remains separately recorded.                  |
| P81 streaming           | `scene.createWorldStreaming` owns bounded cell admissions and pause/publication/retirement. Loaders own detached roots before fallible awaits, acquire through pooled scopes and release after consumer teardown. Active cells alone supply colliders/navigation; cancelled late reservations persist until settlement. Errors are sticky and retry explicit. Cell caps are not VRAM budgets or CPU preemption.                                                                                                           |
| P82 workers             | NativeWorkerPool runs trusted module URLs on actual Workers with bounded queue/byte admission, explicit transfer/copy ownership and hard running cancellation. Destroy terminates owned workers. Successful outputs become caller-owned; definitions reclaim unpublished native payloads. Geometry publication still validates/interleaves/copies on the main thread and reports that cost; transfer is not zero-copy publication or an FPS guarantee.                                                                    |
| P83 import              | Tiled finite orthogonal right-down JSON supports atlas tilesets, GID transforms/layers/properties and actual object/tile colliders. Unsupported formats/fields reject precisely; no editor GUI or arbitrary external code. ResourcePool/content scopes protect shared borrowers and late decoded assets.                                                                                                                                                                                                                  |
| P85 particles           | Native GPU particles use bounded seed/time/rate/burst/capacity/lifetime and emitter-space contracts on GPU/GL; Canvas2D is unsupported. Scene owns simulation time/lifetime; GPU visual particles are not CPU physics colliders or an exact replay/readback promise.                                                                                                                                                                                                                                                      |
| P86 measurement         | WebGPU timestamps sum actual native render/compute pass intervals, excluding gaps/queue/presentation; WebGL reports native command intervals. Unsupported/empty/quantized/invalid samples remain nullable, never CPU fallback durations. Representative loading/steady workloads separate frame/CPU/GPU/hitch/heap/RSS/residency estimates and apply device-specific explicit limits, not universal FPS claims.                                                                                                           |
| P87 accessibility       | Game-local preferences apply actual canvas text scaling/high contrast/reduced decorative motion with OS defaults/player overrides. Essential simulation continues. Semantic DOM mirrors focus/modal/live announcements, not visuals; application closes modals and owns remapping/localization. Full bilingual route is keyboard playable; real spoken assistive output remains unverified/blocked, not certified by AX snapshots.                                                                                        |

All manual owners must cancel/destroy their controllers, pools, UI and borrowed-resource scopes at their actual lifetime boundary; Scene/Game ownership only covers APIs explicitly created through those owners. Browser signal verification uses independently owned muted processes/native zero-gain sinks, never shared sessions, Safari or physical audible proof.

Current authored ceilings are 1024 point and 1024 spot lights per Scene, with at most 32 of each selected per draw; shadow allocation is separate (up to four directional cascades, eight point and eight spot shadows, finite configured reach). These are bounded storage/shading/atlas contracts, not unlimited clustered lighting or performance promises. GPU particles schedule bounded birth commands on CPU while native vertices compute motion; local follows the current affine transform, world retains birth affine. Capacity is at most 65536, with drop-new admission; stop ages survivors, pause freezes time, clear releases native ownership.

### Online deployment and scoped native verification

`npx pnpm@12.6.0 build:site` builds 54 HTML entries, including every one of the 45 example directories and both catalogs. Deploy the entire `.vite/site/` through HTTP/HTTPS; retain engine modules, emitted workers and all 14 canonical official OPM files. Do not open `file://`, remove vendor/worker subtrees, or mistake a visible Canvas3D unsupported message for 3D support. The Tiled example respects explicit renderer queries on all three supported 2D backends.

The recorded 212-route smoke and independently installed starters are scoped browser/deployment proofs, not hardware certification. Three native audio engines were exercised with zero-gain physical sinks before playback; these are upstream PCM/reference/cleanup proofs, not audible output. Original failures and subsequent explicitly frozen reruns are retained separately in ACCEPTANCE.

The production runner captures live output before teardown and accepts explicit operator limits, for example `node scripts/production-workloads.mjs --renderer webgpu --limit stages.steady.cpuSubmitMs.p95=30 --limit stages.steady.frameIntervalMs.p95=60 --limit stages.asset-loading.frameIntervalMs.max=250`. Missing limits/metrics are BLOCKED; exceeding a supplied limit is FAIL, never silently retried or reclassified. Also supply texture/geometry/render-target estimate limits appropriate to the target device; those estimates and process RSS do not measure VRAM. The current local limits and five completed runs are recorded in ACCEPTANCE. Canvas2D's full untinted snapshot fast path fixed a measured 66.75ms RAF p95 failure without relaxing the 60ms gate; this is not a universal frame-rate guarantee.

The hosted macOS policy runs `node scripts/production-workloads.mjs --renderer webgl2 --presentation native-foreground --profile benchmarks/production/hosted-macos-webgl2.policy.json --limit operations.teardownWallMs=5000`. The default remains `headless`; calibration and verification must use the same explicitly pinned mode. Native-foreground requires macOS and an unlocked foreground-capable desktop. Each workload owns a fresh headed browser/default context attached with public `connectOverCDP({noDefaults:true})`, rather than ineffectively sending `false` on another session. Actual native PID/AppKit/window and DOM focus/visibility are verified; missing or interrupted evidence fails. Do not alter signing, clocks, workloads or performance bounds to obtain PASS. The local real focus-loss guard passes; complete revised hosted qualification remains pending, not hardware certification.

Update: [run 37105917252](https://github.com/YueyuHoshizora/XYZ.js/actions/runs/37105917252) passed all five hosted foreground workloads and the real focus-loss guard. Release remains blocked by Windows native graphics failures. With explicit user approval, compiled-out native WebAudio/AudioWorklet in the pinned Windows WebKit is reported UNSUPPORTED, not an unlock PASS; WebKit graphics/input/lifecycle/cleanup and Windows Chromium/Firefox native audio remain required.

## 40. Compatible expansion profiles (P88–P96)

These profiles retain the public 1.x root and package metadata. Historical P71–P87 restrictions above describe those stages; current extensions and their exercised evidence are recorded separately in [ACCEPTANCE](../ACCEPTANCE.md). They do not certify physical hardware.

- **Compatibility:** `check:api-compatibility` retains the published value/type export snapshot and compiles the maintained v1.10 custom-renderer fixture. It is not exhaustive historical signature certification. A custom renderer may omit `prepareGpuParticles`; test the method before calling it. Engine wrappers reject that missing capability explicitly.
- **Continuous gates:** CI additionally requires production-site smoke, silent native audio loading, production benchmark execution and independently packed/installed 2D/3D starters. A configured workflow is not evidence that a new hosted run has passed.
- **glTF:** UV0/UV1 and independent `KHR_texture_transform` coordinates are supported for all fourteen material texture slots. Eight influences require paired `JOINTS_1`/`WEIGHTS_1`; four-influence callers keep their existing layout. Missing referenced UV streams and third UV/influence sets reject rather than silently selecting or truncating.
- **Tiled:** The formal resource/content path imports finite/infinite orthogonal atlas maps, negative sparse chunks, nested groups, repeat/parallax image layers, atlas animation and relative object templates. The async loader handles bounded native gzip/zlib; the sync parser handles arrays and uncompressed base64. `setGid` updates collision/display inside the imported grid. Unsupported orientations, image-collection tilesets and out-of-profile object shapes still reject.
- **Performance:** Choose `--quality baseline|low|high` independently of `--device native|simulated-low-tier|simulated-low-tier-heavy`. Quality changes actual viewport/content counts; simulated device profiles apply named CPU/network pressure and explicitly do not identify physical low-tier hardware. Report RAF, CPU submit, GPU intervals and memory estimates separately.
- **Navigation:** `NavigationMesh3D` uses authored convex coplanar polygons, exact shared edges, certified headroom, radius-safe corridors and explicit links; overlapping floors remain separate. `NavigationTiledGraph3D` snapshots existing authored/collision-baked graphs and explicit seams, retaining the original per-graph 8192-node limit. Both use budgeted sparse search on the shared scheduler. Mesh waypoints are feet positions; pass the center-to-feet offset to `NavigationMeshFollower3D.follow`. Missing traversal handlers block.
- **Native graphics:** `scene.shadows` exposes `cascadeBlend`, `slopeBias`, `cache` and `invalidate()`. Mutable state invalidates shadow reuse; static cache counters are not FPS promises. Native material hooks remain explicit WGSL/GLSL and device-bound; `shadowCache:'tracked'` promises deterministic output from tracked vertex inputs/uniforms/maps, while the default is dynamic. There is no shader transpiler or Canvas3D fallback.
- **Settings/files:** Construct `SettingsManager` with storage, preferences and named input contexts. It persists complete remaps and overrides, migrates accessibility-only v1 settings and resets durably. `PortableSaveFiles` validates a fresh disposable candidate before revision/CAS persistence; later guarded Scene publication is a separate transaction. Starters expose actual remapping, reset and portable checkpoint/settings controls. Downloads are prepared first and started by a second trusted click; rejected original file bytes remain downloadable.
- **Deployment:** Starter builds emit strict CSP header artifacts; the host must actually apply them. Set `GAME_OFFLINE=1` to add a base-relative verified service worker/cache and visible update/removal controls. Failed installs preserve the prior complete generation; activation waits for old tabs to close. Remove offline storage without deleting player saves. Preserve the whole build, including emitted workers and immutable OPM assets; do not deploy source/credential trees.

```sh
npx pnpm@12.6.0 check:api-compatibility
npx pnpm@12.6.0 smoke:starters
node scripts/production-workloads.mjs --renderer webgl2 --quality low --device simulated-low-tier --limit operations.teardownWallMs=5000
GAME_BASE=/games/2d/ GAME_OFFLINE=1 npx pnpm@12.6.0 build
node node_modules/xyz.js/scripts/deployment-server.mjs dist /games/2d/ 4173
```

The final two commands run inside a generated starter. The teardown-only benchmark bound is a runner/cleanup guard, not a frame-rate gate; supply target-specific RAF/CPU/GPU/residency limits for performance qualification. Production headers, offline gameplay, native audio/worker behavior and physical-device certification remain distinct evidence.

## 41. Current documentation and consumer tools (P97–P103)

[CURRENT](CURRENT.md) is the normative v1.12.4 capability/API/support entry; older versioned recipes above remain historical profiles. `pnpm docs:api` generates searchable public root-export documentation at `.vite/site/api/1.12.4/`; `pnpm build:site` includes the same portal in the deployed static site. Ownership/abort/cleanup examples are included there.

Installed `pnpm exec xyz-assets preflight --manifest project.json` validates project references through actual loaders; `build --manifest project.json --out NEW_DIRECTORY` publishes checksummed assets without overwriting source. See [asset recipe](ASSET-RECIPE.md) for schema, pinned development tooling and optional model conversion. Reviewed host/backend performance profiles and physical qualification have separate statuses/limits in CURRENT: calibration is not certification, and unavailable physical evidence remains BLOCKED.

## Unreleased source additions (P104–P118)

These additions are not in the existing GitHub v1.14 archive. Package metadata stays
1.14.0; npm remains unpublished. See [CURRENT](CURRENT.md) for implementation
boundaries and [ACCEPTANCE](../ACCEPTANCE.md) for evidence. New examples are listed
above; their presence in source is not itself a runtime/browser pass.

The installed `xyz-produce-assets PROFILE.json NEW_DIRECTORY` producer is separate
from the `xyz-assets` project CLI. Install the pinned development browser tooling
described in [ASSET-RECIPE](ASSET-RECIPE.md). The repository equivalent is
`node scripts/produce-assets.mjs PROFILE.json NEW_DIRECTORY`; both produce bounded
atlas and bitmap/SDF/MSDF assets through the same implementation.
SDF and MSDF are distinct: MSDF profiles require authored polygon contours; arbitrary font
outline parsing is not provided. Video containers are limited to the bounded MP4
snapshot path (`demuxMP4` / `VideoTextureDecoder.fromMP4`).

### CommonJS and live 3D maps

`require('xyz.js')` and `import ... from 'xyz.js'` use separate constructor graphs.
Choose one format throughout an application's engine objects; do not pass a
CommonJS Texture/Scene/Mesh to the ESM engine or vice versa. Browser/CDN consumers
use the complete ESM `dist/` tree, including official vendor and worker files.

Legacy material `texture`, PBR map properties and native `textures` retain their
immutable `Texture` types. Supply a real borrowed fallback and use the additive
override options for canvas/video sources:

```ts
import { PBRMaterial, Texture, VideoTexture } from 'xyz.js';

async function videoMaterial(video: HTMLVideoElement, fallback: Texture) {
  const frames = await VideoTexture.fromVideo(video);
  const material = new PBRMaterial({
    texture: fallback,
    textureSource: frames,
    sources: { emissiveTexture: frames },
    emissive: [1, 1, 1],
  });
  return { material, frames };
}
```

Remove material consumers before destroying `frames`; the fallback remains borrowed.
`PBRMaterialOptions.sources` uses exported `PBRTextureKey`/`PBRTextureSources`.
NativeMaterial3D uses `textureSources` for its four indexed hook maps; the base
map uses the same `textureSource` option. WebCodecs consumes configured elementary
chunks, or bounded MP4 snapshots through `demuxMP4`/`VideoTextureDecoder.fromMP4`
(single video track, avc1/vp09/av01; fragmented/encrypted containers reject).
Canvas2D supports video Sprites, not 3D materials.

Mesh feature variants compile lazily; no application opt-in is needed. Prepare
resources before publication when avoiding cold draw compilation matters. Cache
eviction or backend recovery may compile again. Native vertex code can optionally
define `xyzDeformInstance(position, normal, uv, instance)` (`XYZVertex` result,
WGSL `mat4x4f`/GLSL `mat4` local instance matrix); color/shadows use the same hook.
Without it, the existing `xyzDeform` hook remains unchanged.

## Opt-in material anti-aliasing (P121, unreleased source)

For a loaded leaf/cutout texture, construct the material with
`alphaMode: 'MASK', alphaCutoff: 0.5, alphaToCoverage: true`.
Keep `Game.create({ antialias: true, ... })`; check
`game.graphics.capabilities.alphaToCoverage` before choosing the feature.
`hdrSamples`/`rgba8Samples` must exceed one for the corresponding target.
Omitting the capability does not establish availability. Canvas2D cannot render
these 3D materials, and disabled/unsupported MSAA requests fail explicitly.
Add `specularAntiAliasing: 1` for noisy base/clearcoat highlights, or a smaller
strength for less normal/roughness filtering. Defaults remain off. Supply proper
normal mips; this approximation is not a substitute for TAA or supersampling.

Author matching coverage mips through the existing trusted profile workflow:

```json
{
  "version": 2,
  "formats": [],
  "textures": {
    "0": { "kind": "srgb", "alpha": "straight", "alphaCoverageCutoff": 0.5 }
  }
}
```

Run `xyz-build-assets --input model.gltf --out new-bundle --profile profile.json`.
The image index is explicit; use the same cutoff in the MASK material. RGB and
base filtering stay unchanged. Tied alpha/small mips and lossy compression can
prevent exact coverage. Do not apply this recipe to normal or opaque maps.
See [the bounded quality contracts](TECHNICAL.md#p121-specular-filtering-and-masked-coverage).

## IBL material quality (P122, unreleased source)

Existing `scene.environment = EnvironmentMap.gradient(...)` automatically uses
GGX roughness mips and numerical BRDF integration. No new material flag or
texture slot is required. Keep reflection colors in the physical 0–1 range;
use `emissive` for HDR light emission. Clearcoat owns its independent roughness
and normal; `sheenColor` enables a bounded Charlie indirect kernel with additional
sampling cost. Existing scene intensity/exposure controls remain explicit.

Run `pnpm smoke:ibl-quality` (or append `--built`) for native HDR/lifecycle evidence.
Read [the quality bounds](TECHNICAL.md#p122-bounded-ggx-and-charlie-ibl) before
interpreting white-furnace preservation as reference-renderer accuracy.

## Byte-offset bundle archives

Use `loadAssetBundleRange('/manifest.json', configuration)` with the same renderer,
loader, signal and trusted manifest pin as `loadAssetBundle`. The manifest adds
`archive: { path: 'archive.bin', bytes, members: [{ path, offset, bytes }] }`;
each member matches a descriptor file and its SHA-256. Offsets address plain,
uncompressed concatenated bytes, not compressed ZIP entries. Directory bundles
continue to use the existing `loadAssetBundle` API.

Servers honoring Range return exact `206 Content-Range` bounds. An ignored Range
(`200`) is read once and retained for that load; unsupported Range (`405`, `416`,
`501`) retries without Range. Full reads are capped at the declared archive size
(at most 128 MiB); malformed partial responses, excess bytes or bad hashes reject.
Abort cancels the reader, and temporary archive bytes/object URLs are released
when loading finishes. Returned model ownership remains unchanged.

## Animated GIF/APNG

Import `AnimatedImageTexture` and `SpriteSheet` from `xyz.js`. Fetch/read your own
bounded bytes, then `await AnimatedImageTexture.decode(bytes, 'image/gif')` (APNG uses
`'image/png'`). ImageDecoder must be available; unsupported browsers reject without
a fallback. Use the result as a borrowed Sprite texture and call
`texture.updateAnimation(deltaSeconds)` from your simulation update. Pause/reset/play
are explicit; reset preserves pause and finite file loops freeze at their last frame.

For sheet-based animation, call `const atlas = texture.createAtlas()` and
`const sheet = new SpriteSheet(atlas.texture, atlas.frames)`; pair each region with
the corresponding `atlas.durations[index]` seconds in your animation frames.
The atlas survives `texture.destroy()`. Remove consumers before destroying each
owned texture/atlas; SpriteSheet does not destroy its borrowed texture.

## Frame profiling

```ts
const game = await Game.create({
  canvas,
  renderer: 'webgpu',
  gpuTiming: { enabled: true },
});
const profiler = new Profiler(game.graphics, {
  enabled: true,
  windowFrames: 240,
});
console.log(profiler.format());
const snapshot = profiler.report(); // JSON-compatible; no GPU handles
profiler.enabled = false;
profiler.destroy();
```

Read snapshots after frames have run. GPU results are asynchronous and may be
unsupported; null is not zero. CPU frame/submit, raw RAF cadence and GPU latency
remain separate. Presentation/GPU FPS and JS allocations are not measured.
Use `npx pnpm@12.6.0 run regression:browser --browser chromium --renderer webgl2`
or `--renderer webgpu` for the deterministic two-native-backend pixel gate.

## Moving-object trails

Create `new Trail3D({ target, material, lifetime: 1, maxPoints: 128 })`, add it as
an unparented identity-transform mesh, and call `trail.sample(elapsedSeconds,
cameraViewDirection)` after moving the target. Use `transparent: true` on the
borrowed material for age-based alpha; optional `curve` keys specify normalized
`age`, full `width`, and linear RGBA `color`, spanning ages zero to one.
`Ribbon3D` instead accepts manual mesh-local points through `addPoint()` followed
by `update()`. Time must be monotonic; `clear()` resets it. Both forced native
backends use existing dynamic Geometry uploads; Canvas2D does not render 3D trails.

## Exporting a glTF snapshot

```ts
import { exportGLTF, exportGLB } from 'xyz.js';

const { json, buffers } = await exportGLTF(scene, {
  bufferURI: 'scene.bin',
  animations: clips,
});
const jsonBlob = new Blob([JSON.stringify(json)], { type: 'model/gltf+json' });
const binaryBlob = new Blob(buffers, { type: 'application/octet-stream' });
const glbBlob = new Blob([await exportGLB(scene, { animations: clips })], {
  type: 'model/gltf-binary',
});
```

Save the first two blobs together under matching filenames, or save the GLB blob.
The engine does not download/write them or own application-created object URLs.
Embedded textures require browser PNG encoding. For external images use
`{textures:'external',textureURI:texture=>imageURLs.get(texture)!}`; every borrowed
Texture needs a URL. Input may instead be a parentless mesh/group or root array.
Supply source clips explicitly: animation mixer state is not baked. Unsupported
live/native/custom features reject; see [contract](TECHNICAL.md#gltf-export).

## Building a nature scene

Open [world-nature](../examples/world-nature/) with `?renderer=webgl2` or
`?renderer=webgpu`; Canvas2D explicitly does not support this 3D scene.
`&stress=1` requests 1,048,576 source height samples and 10,000 grass instances;
these are workload sizes, not measured FPS guarantees.

With an existing scene and live borrowed `texture`, import the following from
`xyz.js`. These snippets supply their own CPU height data:

```ts
import {
  Terrain3D,
  TextureMaterial,
  Water3D,
  VegetationMaterial,
  createGrassGeometry,
  scatterVegetation,
  Vector3,
} from 'xyz.js';

const terrain = scene.add(
  new Terrain3D({
    heightmap: { width: 3, height: 3, heights: [0, 0, 0, 0, 1, 0, 0, 0, 0] },
    material: new TextureMaterial({ texture }),
    width: 20,
    depth: 20,
  }),
);
const water = scene.add(
  new Water3D({ texture, width: 20, depth: 20, foam: true }),
);
const wind = new VegetationMaterial({ texture, doubleSided: true });
const normal = new Vector3();
const foliage = scatterVegetation({
  geometry: createGrassGeometry(),
  material: wind,
  bounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 },
  count: 1000,
  seed: 1,
  sampleSurface: (x, z) => {
    terrain.normalAt(x, z, normal);
    return {
      height: terrain.heightAt(x, z)!,
      normal: [normal.x, normal.y, normal.z],
    };
  },
});
scene.add(foliage.root);
// In Scene.update(deltaTime):
// water.update(deltaTime);             // delta seconds
// wind.update(game.clock.elapsedTime); // absolute simulation seconds
```

Height/surface sampling is local: this example assumes the terrain and scatter
root share identity transforms. Surface normals filter slope but do not tilt
blades. Edit `terrain.heights` then call `terrain.markUpdated()`; physics and
navigation are not automatically generated. For textured layers use
`await TerrainSplatMaterial.create({layers,weights,size})` and pass its `material`
to Terrain3D. Layers are baked once; rebake by creating another preset.

Scene teardown destroys owned objects, and Water3D destroys its own material.
Foliage/terrain borrow their materials and maps: remove/destroy all consumers
before destroying `wind` or the splat preset; release the borrowed texture
separately. Wind/water shader displacement does not change CPU picking or
collision geometry. Water foam is crest-based, not shoreline depth foam.
For trails reuse `Trail3D` with monotonic simulation time and an unparented
identity-transform root; see the moving-object trails section above.
API limits and streaming ownership are in the
[technical reference](TECHNICAL.md#world-nature-terrain-water-and-vegetation).
Runtime and performance evidence are recorded separately in ACCEPTANCE/CURRENT.

## Reproducing material references

After `pnpm build`, run `pnpm check:material-reference` to verify the committed
numeric baseline in real managed Chromium on both forced native backends.
Use `pnpm check:material-reference --regenerate` only when intentionally adopting
a reviewed rendering change, then inspect the measured JSON and PNGs and review
the golden JSON diff. Visit `/tests/browser/material-reference.html?renderer=webgl2`
or `renderer=webgpu` under `pnpm dev` to inspect the fixed grids.
`perturb=1` changes a real material and is expected to fail baseline comparison.

## Exercising material lifecycle

After building, run `pnpm regression:browser --browser chromium --renderer
webgl2,webgpu --require-webgpu` for the durable native lifecycle gate, or inspect
`/tests/browser/material-lifecycle.html?renderer=webgl2` (or `webgpu`) under
`pnpm dev`. Review per-cycle baseline/peak/after counters, actual loss/recovery
events, pixels and unexpected-error counts. Destroy consumers before textures,
volumes, captures and atlases they borrow; unload renderer geometry after its
last consumer is gone. An empty-renderer byte return is not physical VRAM
qualification; see ACCEPTANCE for measured local scope and blockers.

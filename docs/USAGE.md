# XYZ.js Usage Guide

English · [Traditional Chinese](USAGE-zh.md) · [Technical reference](TECHNICAL.md)

XYZ.js is a browser game engine with the P42 playable reference Beacon Run. Current metadata is **1.8.0 / Apache-2.0** (npm unpublished); historical evidence remains unchanged. APIs are inspired by three.js/PixiJS/Excalibur, not drop-in parity, with no new runtime dependency. P40–P42 passed scoped Chromium acceptance. See [PLAN](../PLAN.md), [technical reference](TECHNICAL.md) and [ACCEPTANCE](../ACCEPTANCE.md).

## Current Support at a Glance

| Need                      | Available now / important boundary                                                                                                                                                                                                                                                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Portable 2D               | Sprite/HUD/atlas/raster/isolation/masks/basic blends on all three backends. Native Material2D/Filter2D/Mesh2D require GPU/GL; Canvas explicitly rejects unsupported requests.                                                                                                                                                                                  |
| 3D                        | WebGPU/WebGL2 only; PBR/instancing/shadows/post/weighted transparency use documented bounded profiles. WebGL2 HDR/weighted needs float color attachments.                                                                                                                                                                                                      |
| Physics2D                 | Sleep, five joints, translation-only dynamic→static CCD, static concave decomposition/chains. Dynamic concave/compound and rotational/dynamic-pair CCD remain unsupported.                                                                                                                                                                                     |
| Models / textures         | glTF `COLOR_0` supported, `COLOR_1` rejected; built-in meshopt, external Draco/Basis codecs. Ordinary KTX2 decodes base-level RGBA8; opt-in native KTX2 preserves all mips. `NativeTexture2D` supports RGBA8 and capability-gated BC/ETC2/ASTC; Canvas rejects native sources.                                                                                 |
| Recovery                  | Default GPU/GL `recoverGraphics:true` rebuilds the same backend; recreate old RenderTextures/snapshots. Recovery failure is fatal; no real-driver or cross-browser certification follows.                                                                                                                                                                      |
| P40–P42 scoped acceptance | P41 UI/contexts/budgets/warmup/typed content passed three-backend built-root regression. P42 native GPU skin/animated bounds/mips, 3D physics/dynamics/queries/capsule movement, authored navigation, masks/additive/blend trees/two-bone IK and complete Beacon Run passed scoped acceptance. No physical-device, cross-browser or performance certification. |

Stage-specific counts and browser observations below are historical; current P42 evidence is recorded separately in ACCEPTANCE.

## 1. Start the Development Environment

Use Node >=26 and pnpm 12.6.0. From the repository root:

```sh
npx pnpm@12.6.0 install
npx pnpm@12.6.0 dev
```

Run `npx pnpm@12.6.0 examples` to start the server and open the gallery at `http://127.0.0.1:5173/examples/` (filters by feature, per-backend links), or open `http://127.0.0.1:5173/examples/showcase/` for integrated 2D, 3D, and audio. Click the audio button to unlock playback. The development server binds only to localhost. Do not open pages with `file://`: WebGPU and AudioWorklet require a secure context; use HTTPS in production.

| Example                                     | Purpose                                                                                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| [triangle](../examples/triangle/)           | WebGPU triangle, pause/resume/destroy                                                                                                       |
| [sprite](../examples/sprite/)               | Shared textures, opacity, ordering, sound                                                                                                   |
| [pong](../examples/pong/)                   | Keyboard, pointer, gamepad, camera, scoring                                                                                                 |
| [cube3d](../examples/cube3d/)               | Perspective, lighting, depth, textures                                                                                                      |
| [fallback-demo](../examples/fallback-demo/) | Backend selection and capabilities                                                                                                          |
| [showcase](../examples/showcase/)           | Scene switching, 2D + 3D + audio                                                                                                            |
| [beacon-run](../examples/beacon-run/)       | Playable four-beacon extraction, 3D physics/navigation/animation, menu/HUD/pause/settings/save-load/audio/cleanup; scoped GPU/GL acceptance |
| [advanced3d](../examples/advanced3d/)       | Hierarchy, controls/picking, glTF skin, PBR/shadows, instances/HDR                                                                          |
| [physics2d](../examples/physics2d/)         | Bodies, materials, sensor trigger, gravity                                                                                                  |
| [particles2d](../examples/particles2d/)     | Emitter presets, bursts, nozzles, additive layer                                                                                            |
| [tilemap2d](../examples/tilemap2d/)         | Tile layers, tile collision, camera follow/bounds/shake/zoom                                                                                |
| [transitions2d](../examples/transitions2d/) | fade/crossfade/slide, easing, cancellation, Scene timers                                                                                    |
| [ui2d](../examples/ui2d/)                   | Text2D, bitmap fonts, NineSlice, HUD, accessible buttons                                                                                    |
| [input-lab](../examples/input-lab/)         | Keyboard/pointer/gamepad state, rebindable ActionMap                                                                                        |
| [audio-lab](../examples/audio-lab/)         | Unlock, OPM music/SFX, PCM sample, volumes, PreloadBatch                                                                                    |
| [pbr3d](../examples/pbr3d/)                 | PBR grid, shadows, environment, fog, exposure/bloom                                                                                         |
| [instancing3d](../examples/instancing3d/)   | InstancedMesh batches, culling probes, RenderStats                                                                                          |
| [picking3d](../examples/picking3d/)         | Nested Groups, OrbitControls, Raycaster, camera projection                                                                                  |
| [gltf3d](../examples/gltf3d/)               | Skinned glTF clip playback, morph targets                                                                                                   |

## 2. Use It on Your Website

Build from the engine repository:

```sh
npx pnpm@12.6.0 build
```

Build writes minified engine JavaScript, TypeScript declarations, and source maps to `dist/`, preserving the ESM directory structure. The already-minified official OPM vendor is copied unchanged. No separate minification command or source-file modification is needed.

Copy the **entire `dist/` tree** into `/vendor/xyz/dist/` on your website, including `vendor/opm/`, chunks, and worklets, not just the entry point. Serve the following files through your website's HTTP development server.

For a bundler project, run `npx pnpm@12.6.0 pack` in the engine repository to create a local tarball, then install that file in the consuming project. Replace the URL import below with `import { Game, Scene, Primitive2D } from 'xyz.js'`. Do not assume this version is available from the registry.

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

The eight-voice budget includes release tails. Overflow steals only the oldest SFX, not BGM. When no SFX can be stolen, the new note is skipped. Eight independent contexts/worklets have a resource cost; avoid bypassing `game.audio` to manipulate underlying OPM instances casually.

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

Triangle primitives, normalized/strided/sparse accessors, textures, four-influence skins and morph targets (POSITION/NORMAL deltas, mesh/node weights, `weights` animation) are supported, along with `KHR_mesh_quantization`, `KHR_materials_emissive_strength`, `KHR_materials_unlit` (approximated), `KHR_texture_transform` (baked into UVs; one shared transform per material) and `KHR_lights_punctual` (returned as `asset.lights`, in raw glTF units; add them to the scene yourself). Other required extensions and other topology explicitly reject. SkinnedMesh uses native GPU palettes for rendering and a CPU deformation oracle for bounds/picking; drive morphs with `mesh.morph.weights.set(index, weight)` or a loaded clip (weights of one node's primitives are shared). Model budgets: input 32 MiB, fetched/tracked decoded 128 MiB each, lists 10,000 entries, accessor scalar elements 4,194,304, total vertices 1,000,000/indices 3,000,000, joints 256, 64 morph targets per mesh and hierarchy depth 256. These are not total process-memory limits; image post-decode caveats still apply.

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

Scene.physics.overlap(collider,owner) returns shape-accurate contacts; raycast(origin,direction,maxDistance,mask?) returns distance-sorted surface hits. The fixed-step solver is capped; droppedTime reports discarded catch-up. P31 adds `body.ccd` for dynamic translation against static non-sensors (no rotation/dynamic-pair sweep), sleep and `DistanceJoint`/`RevoluteJoint`/`PrismaticJoint`/`WeldJoint`/`MouseJoint` through addJoint/removeJoint. `Colliders.polygon` remains strictly convex; use `StaticConcave2D`/`StaticChain2D` for static convex-piece composites. No dynamic concave/compound, kinematic/zero-width-edge or current 3D physics. P42 separately approves 3D colliders/queries/character/dynamic bodies and navigation/pathfinding; these old exclusions do not remove that scope. Full limits are in [TECHNICAL](TECHNICAL.md).

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

That navigation exclusion belongs to the original map profile; P42 now provides finite authored grid/graph pathfinding and character following. Editor importers/hex/staggered remain excluded.

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

The deep runner is `pnpm regression:browser` after `pnpm build` and `pnpm exec playwright-core install chromium`. Default required backends are Canvas2D/WebGL2; WebGPU is probed and explicitly SKIPped when unavailable. `--renderer canvas2d|webgl2|webgpu` (comma-separated list) selects required backends; requesting WebGPU or `--require-webgpu` fails if unavailable. `--output DIR` selects assertion JSON/canvas PNG artifact output (default `.vite/browser-regression`). The installed Chromium software-rendering CI gate and existing example smoke are distinct from cross-browser/real-GPU certification; WebGL context loss uses the real extension, while private-device WebGPU loss injection remains an explicit SKIP. Actual three-backend Chromium 153 evidence is in ACCEPTANCE; hosted CI has not been run.

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

Open `/benchmarks/mixed/`, or run `pnpm soak:mixed --duration 60 --renderer all --output /tmp/mixed.json`; use `--duration 3600` for an actual hour and `--consumer /absolute/extracted/package` for the packaged root. Keep the page visible. Review RAF tails, separately measured CPU phases and every cycle's cleanup assertions; a short successful run does not establish indefinite cache/driver-memory plateau.

## 29. Save Dynamic 2D/3D Content (P49)

Save `JSON.stringify(content.capture())`; reconstruct with `await rebuildContentScene(registry, JSON.parse(json), services)`, then publish candidate.scene through game.setScene. Keep the candidate ContentScene for subsequent spawn/remove/save. Factories reconstruct geometry/assets; declare children aliases/stable IDs and state adapters for named prefab descendants/custom SceneObjects. Every live object must have an authored ID; dangling references block removal. [Ownership contract](TECHNICAL.md#49-explicit-3d-and-content-round-trip-p49).

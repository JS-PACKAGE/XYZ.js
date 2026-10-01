# XYZ.js Technical Reference

English · [Traditional Chinese](TECHNICAL-zh.md)

This reference covers the current **1.8.0 / Apache-2.0** source package; npm is unpublished. Stage-specific dates, counts and release metadata below are historical evidence, not P40–P42 acceptance. The API is three.js/PixiJS/Excalibur-inspired, not drop-in compatible or full upstream parity, and adds no runtime dependencies. [PLAN](../PLAN.md) and [DESIGN](../DESIGN.md) define the approved P40–P42 contracts; [ACCEPTANCE](../ACCEPTANCE.md) alone records exercised support and unverified limits. The user authorized pushing and the GitHub v1.8 release, not npm publication.

## Current Support Matrix

| Surface                     | Current supported profile / restriction                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WebGPU / WebGL2             | 2D sprites, isolation/masks/blends, native materials/filters/meshes; 3D lighting/PBR/instancing/shadows/post/weighted transparency. WebGPU needs a secure origin; WebGL2 HDR/weighted transparency require floating-point color attachments.                                                                                                                                                                                 |
| Canvas2D                    | Native 2D paint, isolation/masks/basic blends/offscreen textures; no visible 3D or Mesh2D, Material2D, native Filter2D, effects2D/effects3D. Unsupported requests reject rather than silently switching backend.                                                                                                                                                                                                             |
| Physics2D (P31)             | Sleep; translation CCD against static non-sensors only; five bounded joint types; static concave decomposition/thick chains. No rotational/dynamic-pair CCD, dynamic concave/compound or kinematic bodies.                                                                                                                                                                                                                   |
| glTF / KTX2 (P32–P42)       | UV0 triangles/four-influence skin/morph/`COLOR_0` and documented extensions; `COLOR_1` rejected. Meshopt is built in; Draco/Basis codecs are external. Default KTX2 remains base RGBA8; opt-in native sources preserve supported GPU payloads and supplied mips (sections 30, 42).                                                                                                                                           |
| Animation (P34–P42)         | Ordered layers/fades/crossfades/flat state machine/tween/timeline, explicit masks/additive references, 1D/triangulated 2D blend trees and two-bone IK. Native GPU skinning, lazy exact CPU queries and conservative animated bounds passed scoped P42 acceptance.                                                                                                                                                            |
| Loss recovery               | Default `recoverGraphics:true` rebuilds GPU/GL on the same backend; old renderer-owned targets/snapshots are invalid. Failure or opting out is fatal. P42 exercised actual WEBGL_lose_context and fixture-only GPUDevice.destroy on Chromium; this is not driver-reset or cross-browser certification.                                                                                                                       |
| P40 (scoped acceptance)     | Adjacent 2D batching, full render metrics and deep browser regression passed on Canvas2D/WebGL2/WebGPU Chromium 153; CI configuration added, hosted CI not run. No throughput or cross-browser certification.                                                                                                                                                                                                                |
| P41 / P42 scoped acceptance | P41 UI/contexts/residency/warmup/typed content passed built-root three-backend Chromium regression. P42 GPU skin/animated bounds/native mips and complete Beacon Run passed forced GPU/GL paths; primitive 3D physics/dynamics, authored navigation and animation masks/additive/blend trees/IK are integrated. Injected touch/simulated gamepads are not physical-device certification. See ACCEPTANCE for actual evidence. |

Older stage exclusions describe their original bounded profiles; the approved expansions above supersede those exclusions only for the named capabilities. All other non-goals remain unchanged.

## 1. Modules and Execution Flow

```text
src/index.ts                    Unified ESM / TypeScript API
  ├─ packages/core             Game / Clock / Scene, objects, cameras, logger
  │    ├─ packages/ecs         World / Entity / Component / System (internal)
  │    └─ Game.create() → createRenderer()
  ├─ packages/graphics         Renderer / capabilities / errors
  │    └─ WebGPU → WebGL2 → Canvas2D (automatic initialization fallback)
  ├─ packages/math             Vector2 / 3, Matrix3 / 4, Quaternion, Transform
  ├─ packages/assets           AssetLoader / Texture / AssetError
  ├─ packages/input            Keyboard / Pointer / Gamepad
  └─ packages/audio            AudioManager / Asset / Channel / OPMAdapter
       └─ vendor/opm           Official OPM.js v1.1.0

requestAnimationFrame(timestamp)
  → Synchronize DPR → Clock.tick(timestamp) → Camera2D.resize(logical viewport)
  → Input.update() → Scene.timers.update(deltaTime)
  → Scene.animations.update(deltaTime)
  → Scene.update(deltaTime) → World.update(deltaTime)
  → Renderer.beginFrame() → Renderer.render(scene, width, height)
  → Renderer.endFrame()
  → Input.endFrame() (clear edges in finally)
  → Schedule the next requestAnimationFrame if still running
```

- `Game.create()` is an async factory; the default renderer is `auto`. The constructor does not start asynchronous initialization. ECS is accessed through `scene.world`, without an additional root export or npm subpath entry.
- `Game` owns the loop, Canvas sizing, and Renderer lifecycle. Ordinary game code does not need access to GPUDevice.
- `Renderer` receives a Scene and logical viewport dimensions without exposing GPU resources to the core.
- The triangle shader belongs to the production Renderer. Example pages only create a Game and wire controls; they do not implement a second renderer.
- `src/data/defaults.ts` centralizes viewport defaults, delta clamping, the pixel-ratio cap, and clear color. `src/data/audio.ts` centralizes audio slots, timer intervals, lookahead, and release guard.
- RuntimeError, AssetError, AudioError, and GraphicsError share XYZError, defined by graphics. Game owns AudioManager, whose scheduling is independent of RAF; pausing or hiding the game does not stop audio.

## 2. Clock: Simulation Time Is Not Frame Rate

`tick(timestamp)` accepts a requestAnimationFrame timestamp in **milliseconds**. Public time values use **seconds**.

```text
frameInterval = max(0, (timestamp - previousTimestamp) / 1000)
deltaTime     = min(maxDeltaTime, frameInterval)
elapsedTime  += deltaTime
fps           = frameInterval > 0 ? 1 / frameInterval : 0
```

The first frame has no previous timestamp, so delta and fps are both zero. `fps` is the reciprocal of the instantaneous frame interval, **not a moving average or GPU execution time**. With a 500ms interval and a 100ms clamp, simulation advances by 0.1 seconds, but fps must be 2, not 10.

- `suspend()` clears the previous timestamp, delta, and fps while retaining elapsed time and frame count.
- `reset()` also clears elapsed time and frame count.
- The first frame after a pause or hidden interval does not incorporate the suspended time into simulation.
- A backward timestamp neither reverses time nor counts that interval again on the following frame.
- The frame counter counts ticks; it does not guarantee that the GPU has presented those frames on screen.

## 3. Graphics Initialization and Capability Boundaries

Three backends are available. Automatic fallback applies only during initialization:

| Renderer setting                 | Behavior                                                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `webgpu` / `webgl2` / `canvas2d` | Initialize the selected backend directly; never switch on failure                                                           |
| `auto`                           | Try WebGPU → WebGL2 → Canvas2D on separate canvases; if all fail, throw UnsupportedGraphicsError with the underlying causes |

WebGPU requires a secure context and browser/driver support. Localhost is suitable for development; production deployment must satisfy the browser's secure-context requirements. The presence of `navigator.gpu` does not guarantee an available adapter or device.

WebGPU initialization includes the preferred canvas format, opaque canvas configuration, WGSL compilation diagnostics, and a validation error scope. A successful `requestDevice()` alone does not establish Renderer readiness. Graphics errors retain the subsystem and cause to distinguish unsupported environments, initialization failures, and runtime device loss.

## 4. Triangle GPU Pipeline

The triangle demonstration path remains available when there is no active Scene. With a Scene, only its contents are drawn; an empty Scene does not trigger a fallback triangle. The WebGPU triangle's WGSL vertex shader generates three vertices and RGB colors from `vertex_index`; the fragment shader outputs interpolated color. This path needs no vertex buffer, texture, or depth buffer.

The WebGPU triangle clears the canvas and uses a centered square viewport to preserve proportions. This is not the Camera2D or PerspectiveCamera scaling rule: ordinary Scenes use the logical viewport and their corresponding camera. WebGL2 provides a GLSL triangle; Canvas2D provides a gradient illustration rather than an exact replacement for per-vertex interpolation.

Every frame obtains the current swapchain texture view and creates a new command encoder, render pass, and command buffer for submission. **Submitted GPU command buffers cannot be reused.** Reducing JS descriptor allocations must not rely on invalid reuse of GPU work objects.

## 5. Usage and Distribution

```ts
import { Game } from 'xyz.js';

const game = await Game.create({
  canvas: '#game',
  renderer: 'webgpu',
});
game.addEventListener('error', (event) => {
  const error = (event as CustomEvent<Error>).detail;
  console.error(error);
});
game.start();
```

Initialization failures reject `Game.create()`. Game error events carry their cause in `CustomEvent<Error>.detail`; register listeners before starting. Fatal frame, renderer, or automatic-resize errors pause the game and block resume. Candidate preparation failures from `start(scene)` and audio scheduling errors can also dispatch error events without becoming fatal. Callers handle the rejected Promise from `await game.setScene()`. Although `createRenderer` is exported from the unified entry, ordinary callers should let Game manage the Renderer lifecycle.

Use Node >=26 and pnpm 12.6.0. `npx pnpm@12.6.0 build` runs TypeScript, `scripts/minify-dist.mjs`, and `scripts/copy-vendor.mjs`, producing minified `dist/src/index.js` and internal modules, declaration files, composed source maps, and the complete unchanged `dist/vendor/opm/` tree. npm exports point to the same entry. The package files list includes only dist, with npm also including standard metadata and README files. The package is **not published to npm**. Installing a local tarball also supports bare imports; public publication is not required.

A website without a bundler can copy the complete `dist/` tree:

```html
<script type="module">
  import { Game } from '/vendor/xyz/dist/src/index.js';
  const game = await Game.create({ canvas: '#game' });
  game.start();
</script>
```

Do not copy index.js alone: its relative `.js` imports require the remaining directories. Declaration files are not executed by the browser but provide types to TypeScript consumers. The root package is licensed under Apache-2.0 (see `LICENSE`), and `package.json` declares `license: "Apache-2.0"`; release assets published up to v1.5 still carry UNLICENSED metadata.

## 6. Verification and Performance Terminology

```sh
npx pnpm@12.6.0 install
npx pnpm@12.6.0 build
npx pnpm@12.6.0 typecheck
npx pnpm@12.6.0 test
npx pnpm@12.6.0 lint
npx pnpm@12.6.0 format:check
npx pnpm@12.6.0 dev
```

Check all six `/examples/` pages in a browser: triangle, sprite, cube3d, pong, fallback-demo, and showcase. Verify real output and interaction. Showcase combines 2D, 3D, and audio in one Scene, including cleanup on switching. Cube3D explicitly does not run 3D on Canvas2D; showcase retains 2D and audio there. Compilation or passing GPU mocks does not prove visual correctness. Error paths are checked through actual device/context loss or explicitly identified event simulations. P08 recorded 16 files / 73 tests; subsequent optimization recorded 16 files / 75 tests and five passing checks. ACCEPTANCE preserves these separate records; documentation-only updates do not imply fresh runtime verification.

Performance reporting must distinguish:

1. JS container allocation counts and lifetimes.
2. CPU submission time and GC overhead.
3. GPU work duration, presentation cadence, and actual fps.

Reducing the first does not establish proportional improvements in the second or third. The P01 triangle is not representative of 1,000 Sprites. `/benchmarks/sprites/` provides a fixed-workload, independent RAF and CPU-submission measurement, not direct GPU or GC timing.

Open `/benchmarks/sprites/`. It defaults to direct WebGPU; the query can select auto, webgl2, or canvas2d. The workload uses 1,000 moving Sprites sharing one texture, a 1280×720 backing store, and DPR 1. It measures 600 frames after 120 warmup frames and aborts if the tab becomes hidden. Its own RAF drives the production Renderer without calling Game.start. CPU timing covers only beginFrame/render/endFrame, excluding animation updates. RAF fps is neither GPU completion rate nor physical display scanout rate, and does not represent the complete Game Loop workload.

## 7. Game State, Ownership, and Error Policy

Normal state transitions:

```text
Game.create() → idle
idle / paused --start or resume--> running
running       --pause-----------> paused
any live state --destroy--------> destroyed
```

A hidden tab stops scheduling and clears Clock's previous timestamp while preserving the user's running/paused intent. Only a previously running Game resumes when visible. A manually paused Game does not restart just because the tab becomes visible.

A Canvas can belong to only one Game at a time, including pending initialization. The Canvas claim is acquired before asynchronous GPU initialization and released on failure or destruction. Otherwise, another Game could reconfigure the same GPUCanvasContext while the original loop continues running. This is a resource-ownership rule, not a check for DOM attachment.

Fatal runtime failure differs from a user pause: Game retains the first fatal failure, stops the loop, dispatches an error and rejects subsequent start/resume calls. GPU/GL loss is recoverable by default (`recoverGraphics:true`): rebuild the same backend, not an automatic backend switch; see section 21 for events, invalidated handles and failure/timeout behavior. Opting out or failed recovery remains fatal; destroy/recreate a fatally failed Game rather than unconditionally resuming from every error listener. Nonfatal Scene/audio errors do not necessarily change Game.state.

Normal destruction is repeatable: cancel RAF, remove observers/listeners, restore engine-owned containment settings, and release the Renderer. Failure at any initialization step must roll back acquired resources. A cleanup failure must not prevent the remaining cleanup attempts or release of the Canvas claim; stale ownership must not prevent a replacement Game.

Examples distinguish BFCache navigation in `pagehide`: when `event.persisted` is true, the browser retains the page, so the Game must not be destroyed. Destroy it only when truly leaving. This differs from an explicit Game.destroy call. Actual BFCache eligibility also depends on the browser and other page resources.

## 8. CSS Dimensions and GPU Backing Pixels

There are two size layers:

- **CSS content box:** layout width and height in CSS pixels, excluding borders, padding, and CSS transforms.
- **Backing store:** `canvas.width` and `canvas.height` in device pixels; these are the dimensions accepted by Renderer.resize.

```text
backingWidth  = max(1, round(logicalWidth  × pixelRatio))
backingHeight = max(1, round(logicalHeight × pixelRatio))
```

Without an explicit pixelRatio, the engine uses devicePixelRatio subject to the centralized cap. An explicit pixelRatio is used as supplied. The GPU's maxTextureDimension2D is a separate limit, not the pixel-ratio cap.

### Default Layout and Author CSS

CSS `contain: size` and `contain-intrinsic-size` isolate intrinsic layout from backing attributes. The engine does not assign canvas width/height CSS. Default intrinsic dimensions come from Game width/height; author stylesheets, classes, cascade layers, and inline width/height can still determine layout. Percentage sizes must continue to follow their container rather than being frozen to pixels at initialization.

Even a canvas without author CSS needs stable CSS dimensions. If backing attributes directly determine intrinsic layout, a DPR 2 resize can also double CSS width and repeatedly amplify it through ResizeObserver. Size containment prevents this feedback; it is not a visual theme. Existing layout/paint/style containment is preserved. Cleanup restores inline settings that remain under engine control. The engine does not inject a stylesheet that interferes with the cascade or requires relaxing CSP.

`autoResize:true` follows the displayed content box. Its observer only synchronizes logical/backing dimensions, without changing author CSS. `game.resize(w,h)` updates the engine's intrinsic fallback; author width/height remain authoritative. Calling resize(200,100) on a canvas with author-defined dimensions of 420×210 does not override that CSS. Canvas width/height attributes also provide an aspect-ratio hint. Manual resize therefore first updates the backing aspect ratio to the requested dimensions, then measures the actual CSS content box, and synchronizes backing dimensions again only if needed. Failure must restore the previous dimensions. Authors can explicitly set CSS `aspect-ratio` to avoid an auto-sized axis depending on backing proportions.

`autoResize:false` does not track the DOM content box. The caller manages the relationship between layout and rendering dimensions. This supports integrations that own their viewport, rather than promising automatic adaptation to all external CSS changes.

Resize must validate both backing dimensions before writing either canvas attribute. Exceeding GPU limits reports an error without partially changing a dimension. Game must also avoid retaining oversized CSS fallback or logical dimensions after failure.

## 9. WebGPU Lifecycle and Hot Paths

Every initialization await is a resource-race boundary. If destroy occurs while requestDevice is pending, the late device must still be destroyed, and initialization must not resolve successfully. The same rule applies to adapter acquisition and shader validation: check that the Renderer remains alive after every await.

CPU-side configuration containers can survive across frames: render-pass descriptors, color attachments and their arrays, and queue submission arrays. Replace only the texture view and command buffer each frame, then clear those references after API consumption so containers do not prolong swapchain-resource lifetimes. Keeping the previous frame's texture view is not a valid way to avoid creating a new GPU view.

Viewport geometry can be calculated on resize, and static pipelines do not need rebuilding then. Directly changing canvas backing attributes is a low-level operation. Ordinary callers should use Game.resize or DOM layout/ResizeObserver rather than bypassing size validation and ownership.

See ACCEPTANCE for before/after measurements. Test-side interception of real GPU APIs can record descriptor identity, but this instrumentation and GPU handles must not enter the public Game API. Container identity should not become a permanent consumer contract test.

## 10. Core World (P02)

- `Scene` contains a World and object lifecycles; it is not an Entity. `scene.add(object)` creates an internal Entity and registers a GameObject's Transform2D. `scene.remove(object)` detaches without destroying, allowing transfer. Scene.destroy destroys its remaining objects and systems.
- `SceneObject` provides ownership and `onDestroy` without requiring a 2D transform. `GameObject` provides position, rotation in radians, and scale. The low-level World supports component CRUD, queries, and ordered System lifecycles; ordinary callers need not manipulate Entity IDs.
- Scene hooks: `protected initialize(game, signal)` may return a Promise; `update(dt)` runs each visible frame; `protected onDestroy()` synchronously releases Scene resources. Asynchronous initialization should honor AbortSignal and must not keep registering resources after cancellation.
- `await game.setScene(next)` prepares the candidate, publishes it only after success, then synchronously cleans up the old Scene. Preparation failure cleans up the candidate and preserves the old Scene. If old-Scene cleanup throws, the new Scene is already active, but the Promise still reports the cleanup error. Reentrant switching during disposal is rejected.
- Each Scene can be owned by only one Game over its lifetime. Replacing a pending candidate aborts and destroys it. Game.destroy also aborts candidates and cleans up the active Scene. Cancellation is cooperative; it does not forcibly terminate user Promises.
- `game.start(scene?)` remains synchronous and returns void. Preparation failures dispatch error events without turning ordinary Scene preparation failure into fatal GPU failure. Await setScene first when the preparation result is needed. An actual update exception still puts the Runtime into the fatal paused state.
- Systems update in insertion order. Systems added during an update run on the next frame; removed systems stop running immediately. Cleanup uses reverse order. Pausing or destroying during Scene.update prevents subsequent Renderer submission.
- Mutable Vector2 operations return the same instance. Matrix3 uses a column-major Float32Array; compose is translation × rotation × scale, and invert rejects singular matrices. `transformPoint(point, out)` can reuse an output container. Transform2D's `updateMatrix()` reuses its matrix.

## 11. Texture and Sprite (P03)

- `game.assets.loadTexture(url)` shares pending Promises and Textures by absolute URL, ignoring fragments. Failures evict the cache entry for retry. Reloading a destroyed Texture downloads and decodes again. AssetLoader.destroy aborts downloads and closes late bitmaps.
- AssetLoader owns cached CPU ImageBitmaps. `Texture.fromImage(source)` creates an independently owned bitmap that the caller must destroy. Sprites do not own shared Textures. Game.destroy cleans up assets after the renderer.
- Sprite provides texture, position, rotation in radians, scale, anchor (center by default), opacity, visible, and zIndex. Equal zIndex values retain Scene insertion order. Coordinates use logical CSS pixels with a top-left origin.
- WebGPU shares one Sprite pipeline and reuses a growable instance buffer. Adjacent equal textures after sorting are batched into draws. The GPU texture cache is separate from AssetLoader; unused or destroyed assets release their GPU resources.
- Uploads use premultiplied alpha. The shader applies opacity to both RGB and alpha; blending uses one/one-minus-src-alpha. Without a Scene, the triangle remains; with a Scene, only Scene contents are drawn.

## 12. Camera and Input (P04)

- Every Scene owns a Camera2D. `screen=(world-position)*zoom`, with positive zoom applied to both axes. Game synchronizes the viewport before each update. Both conversion directions support output parameters to avoid allocation. Resize preserves pipelines, Textures, and the instance buffer.
- Game owns InputManager. Keyboard uses `KeyboardEvent.code`, ignores editable input for new key presses, and does not globally suppress browser defaults. Pointer uses capture/cancel and converts coordinates to canvas content-box logical coordinates independently of DPR. Canvas `touch-action:none` can control touch scrolling.
- `update()` obtains Gamepad slots before Scene execution. `endFrame()` clears pressed/released edges in finally. Pause, blur, and hidden transitions clear held state; destroy removes listeners. Physical gamepad hardware remains unverified; tests cover connection/disconnection snapshots.
- Pong uses proportional camera scaling, keyboard/drag/gamepad controls, paddle collisions, and scoring, without introducing a physics engine.
- Gamepad: `game.input.gamepad` (`GamepadState`) tracks the first connected pad whose `mapping==='standard'` (non-standard pads are ignored; `preferredIndex` locks a slot). Buttons use W3C names (`a b x y lb rb lt rt back start ls rs up down left right home`), `button(name)` is analog 0..1, `isDown/wasPressed/wasReleased` use `pressThreshold` (default 0.5), `firstPressed()` supports rebind prompts. `stick('left'|'right')`/`axis(name)` apply a radial `deadzone` (default 0.15, [0,1)) rescaled to 0..1. A newly selected pad does not report held buttons as presses; a vanished pad reports one release. `game.input.actions` (`ActionMap`) binds named actions to `{button}`, `{axis,direction:±1}` and `{key: KeyboardEvent.code}` with `bind/rebind/unbind/bindings/value/isDown/wasPressed/wasReleased`; `export()`/`import()` round-trip JSON, and `import` validates everything before replacing. Edges are computed once per `InputManager.update`. Verified with synthetic `getGamepads` snapshots only; physical hardware, vibration and non-standard mappings are unverified/unsupported.

## 13. 3D (P05)

- Matrix4 is column-major and right-handed, with −Z forward. Perspective uses WebGPU depth 0..1. Quaternion.setFromEuler accepts radians. Transform3D reuses matrices; Mesh and Transform3D register with the Scene's World.
- Geometry copies and validates custom position/normal/uv/index data, interleaves vertices at a stride of eight floats, and uses Uint32Array indices. Index topology stays immutable. After deliberately changing vertex position/normal/UV data, call `markUpdated()` to increment `version` and notify renderer upload caches. cube/sphere/plane/quad provide outward normals and winding; BoxGeometry.unit is a named primitive geometry factory.
- Mesh does not destroy shared Geometry, TextureMaterial, or Texture. Material provides a texture, RGB tint, and opacity. The camera computes view-projection from fov/near/far, position, and Quaternion rotation.
- WebGPU uses a shared mesh pipeline, a reused uniform buffer per mesh, and geometry/texture caches. Normals use the inverse-transpose of the model 3×3 matrix, supporting nonuniform scale. Lighting combines ambient and directional diffuse terms.
- The 3D pass uses depth24plus and less comparison; a separate color-load pass overlays Sprites. Default sorted transparency retains depth writes and premultiplied blending. Opt-in weighted transparency tests opaque depth without writing transparent depth; see the transparency section below.
- Resize preserves shaders, geometry, and textures while replacing size-dependent depth/HDR attachments; destroy releases GPU caches.

## 14. Compatibility (P06)

- Browser Canvas context binding is irreversible. Auto does not attempt GPU contexts on the user's canvas: it initializes backends on separate canvases, then presents through the original canvas's 2D context. This avoids DOM replacement and preserves input listeners. Each frame adds a drawImage copy, whose cost must be measured separately. Forced backends do not incur this copy.
- WebGL2 uses instanced Sprite batching, shared GLSL pipelines, and geometry/texture caches. Mesh rendering converts WebGPU 0..1 clip depth to GL −1..1, with the same normal, lighting, and premultiplied-blending rules.
- ImageBitmap uses straight alpha. WebGL uploads do not rely on ignored pixelStore flags; the shader multiplies by alpha. UV=0 addresses the first image row, without an additional flip.
- Canvas2D uses native affine transforms, drawImage, and alpha. Its triangle is a gradient illustration, not GPU per-vertex interpolation. Primitive2D rectangles/circles rasterize once at creation, then reuse the Sprite path. Destroy releases only their generated Texture.
- Capabilities: all WebGPU booleans are true; WebGL2 sets threeD/customShaders/instancing to true and the others to false; all Canvas2D booleans are false. maxTextureSize reports the backend limit, with a conservative 8192 for Canvas2D. This is capability discovery, not a public custom-shader or compute execution API.

## 15. Audio

- `game.audio.load(url)` shares pending/cache entries by canonical URL, ignoring fragments. Failures evict entries; destroy immediately cancels pending waits. JSON must contain an officially parseable `voice` and nonempty `notes`: MIDI 0–127, time ≥0, and duration (0,60] seconds. Optional channel (music/sfx/ui), loop, and duration specify defaults and loop period; the period cannot end before the final note. Loaded voice/notes are immutable. See [sfx.json](../examples/sprite/sfx.json) and [music.json](../examples/sprite/music.json).
- Call `await game.audio.unlock()` from a user gesture such as a click. Before unlock, play throws AudioError rather than silently creating AudioContexts or queuing playback. OPMAdapter may import the official module while validating a loaded voice, but only unlock creates the eight contexts/worklets. Each slot reserves one voice including ADSR release and guard. Master/channel volumes in 0–1 multiply through GainNodes.
- Official OPM globally steals the oldest voice for a ninth voice, and soft stop retains a release tail. Eight isolated instances therefore allow SFX overflow without interrupting BGM or forking the vendor. Only the oldest SFX may be hard-reset. If none is available, skip the new note without cancelling the music track. The budget includes UI and release tails.
- Scheduling uses a 25ms timer and 100ms lookahead. After throttling, skip missed loops rather than replaying the entire missed song. Timing/slot constants live in `src/data/audio.ts`. Game pause does not mean audio pause; explicitly stop when needed.
- `asset.play(options)` and `game.audio.play(asset, options)` return AudioPlayback; stop preserves natural release. Playback belongs to the current Scene by default or an explicitly supplied `scene`. Without a Scene, stop, completion, or Game destruction governs its lifetime. Scene destruction hard-cancels nonpersistent scheduling and release tails. `persistent:true` survives Scene changes, but Game destruction closes everything. `game.audio.opm` exposes the first official instance as an advanced escape hatch; direct use bypasses budgeting and lifecycle management.
- The vendor tree contains the [source and SHA256 manifest](../vendor/opm/manifest.json) and [official Apache-2.0 LICENSE](../vendor/opm/LICENSE), without private patches. The root package is separately licensed under Apache-2.0. Build copies the complete vendor into dist, preserving relative chunk/worklet URLs. Deployment must retain the entire dist tree, and AudioWorklet also requires a secure context.

## 16. Logging and Hardening

Public `logger.debug/info/warn/error(...args)` methods use a `logger.level` of debug/info/warn/error/silent, defaulting to warn. All output has the `[XYZ]` prefix. Backend initialization/fallback and fatal Game errors provide diagnostics, not per-frame logging. Production can select error or silent.

After WebGPU device loss or WebGL context loss, resize rejects before changing backing dimensions. Game pauses and rejects resume; destroy/recreate is required. Even if input cleanup fails, destroy disconnects the resize observer and continues releasing other resources. The error hierarchy includes XYZError, GraphicsError, AssetError, AudioError, RuntimeError, and backend subclasses.

```text
XYZError
├─ GraphicsError
│  ├─ WebGPUNotSupportedError
│  ├─ WebGPUInitializationError
│  ├─ WebGPUDeviceLostError
│  ├─ WebGL2InitializationError
│  ├─ WebGL2ContextLostError
│  ├─ Canvas2DInitializationError
│  ├─ GraphicsBackendUnavailableError
│  └─ UnsupportedGraphicsError
├─ AssetError
├─ AudioError
└─ RuntimeError
```

These are public error classes, not a promise to rewrap every exception from user code. Cleanup may report an AggregateError preserving multiple causes. [Acceptance records](../ACCEPTANCE.md) define verified support and limitations; synthetic events or headless Chromium results do not certify every browser.

## 17. Subsequent Hot-Path Maintenance

- World compacts its systems array only after removal, using stable linear movement without changing update-time removal/addition or exception-cleanup semantics.
- WebGPU skips Sprite viewport uniform uploads while logical dimensions remain unchanged. Sprite transform/instance data still updates every frame; publicly mutable objects are not assumed immutable.
- Keyboard editable-target filtering only prevents tracking new text-input presses. A previously held gameplay key must still release when keyup arrives in an editable field, avoiding stuck keys across focus transitions.
- Measurements confirm fewer redundant uniform uploads, not improved CPU time or fps. See ACCEPTANCE's subsequent optimization record for timings and limitations.

## 18. Asset Safety Budgets

`src/data/assets.ts` centralizes fixed defaults: 8 MiB for image responses, 1 MiB for audio JSON responses, and 16,384 audio notes. Textures are limited to 8,192 per side and 4,194,304 total pixels, approximately 16 MiB of RGBA data.

Internal `readResponse` counts bytes delivered by the browser's response reader after HTTP decompression. It does not trust Content-Length, which may be absent, inaccurate, or describe compressed data. Overflow cancels the reader and rejects. AbortSignal also cancels a stalled reader. JSON parsing starts only after a complete bounded read; note count is checked before map/sort/freeze. Public failures remain AssetError/AudioError, with the underlying byte-cap error retained as cause. Failed cache entries are still evicted for retry.

Post-decode Texture checks cover both loadTexture and fromImage. These paths close engine-owned bitmaps on rejection. Callers invoking the Texture constructor directly remain responsible for their source resources if construction fails. Valid assets are neither downscaled nor truncated.

**Compatibility decision: retain all browser-supported image formats.** There is no format allowlist or complete pre-decode dimension parser, so pixel limits do not prevent transient decoder allocations. Response chunks themselves are also allocated by the browser before inspection. These are per-asset budgets, not limits on total cache size, concurrent downloads, or process memory. Untrusted images should still pass through a controlled asset pipeline, and applications must manage asset lifetimes.

Security-fix verification on 2026-09-30 covered 17 files / 82 tests and integration checks. Actual Chromium scenarios exercised note/byte/pixel boundaries and Showcase graphics/audio playback. See ACCEPTANCE for detailed evidence.

## 19. Minified Distribution

Build minifies every engine-generated `.js` file in dist individually using the minifier exported by the existing Vite development dependency. It preserves ES2022 ESM, relative module paths, exported symbols, public property names, and function/class names (including error names). It does not bundle modules, modify source files, or add runtime dependencies. TypeScript declarations remain unchanged; minifier maps are composed with TypeScript maps and referenced by sourceMappingURL.

The official OPM distribution is already minified and is copied byte-for-byte, retaining its LICENSE, manifest, chunks, and worklet URLs. It is deliberately excluded from re-minification to preserve release checksum integrity.

The verified build reduced 36 engine JavaScript files from 189,706 to 98,707 bytes (about 48%, excluding maps, declarations, and vendor). All 46 distribution JavaScript files include those 36 files and 10 official vendor files. Static HTTP smoke loaded the documented ESM example without Vite transformation, exercised keyboard movement, read back a rendered pixel, preserved error names, and unlocked an official audio worklet. Minification reduces file size; it is neither encryption nor a security boundary.

## 20. Text2D and Scene Timers (Post-v1.0 Additions)

Historical v1.1 baseline (package 1.1.0), not the previously published v1.0 tag. The original style/loading/wrapping exclusions below were expanded by P27 styled Text2D/font assets; UI layout/widgets/focus are now approved P41 work. Historical release metadata is unchanged.

- `await Text2D.create(text, { fontSize, fontFamily, color, padding })` creates a Sprite using the existing backend texture path. Defaults live in `src/data/text.ts`. Newlines produce left-aligned lines; glyph overhang and descenders are included in measured bounds. Empty text is transparent. Dimensions/pixels are checked before allocating the full raster canvas.
- Transform, anchor, opacity, visibility and zIndex behave like Sprite. Style is immutable; create another Text2D to change it. Await custom font loading before creation; font availability and glyph rasterization depend on the browser. There is no automatic font loading, text layout GUI, wrapping or text-animation system.
- `await label.setText(value)` publishes the latest request only. `label.text` is the displayed text. An unchanged displayed value avoids rasterization and invalidates pending older updates. Failed updates reject and preserve the display. Superseded or post-destroy results are discarded and their textures released. Handle the Promise; do not rasterize every frame unnecessarily.
- Text2D owns its generated textures, releases replaced textures, and destroys its current owned texture with the Scene. A caller-assigned external `texture` remains borrowed, as with Primitive2D. Do not share a Text2D-owned texture with another live Sprite: updating the label destroys that texture.
- `scene.timers.after(seconds, callback)` and `.every(seconds, callback)` return `TimerHandle` with `active` and idempotent `cancel()`. One-shot delays must be finite and nonnegative; repeating intervals must be finite and positive. Zero delay means the next timer tick, not a synchronous call.
- Game advances timers with clamped simulation delta before Scene.update, even when subclasses do not call super.update. Paused/hidden time is excluded. Due callbacks run in registration order within the current tick; a repeating timer fires at most once per tick and skips missed periods rather than bursting. Newly scheduled callbacks wait until the next tick.
- Callbacks are synchronous; do not use an async callback expecting the scheduler to await it. A thrown error follows Game's fatal frame error path. Recursive timer advancement is rejected. Scene destruction cancels all remaining callbacks, clears their references, and rejects new scheduling; pending scene preparation does not advance timers. Pause requests take effect after the current synchronous timer batch.
- Pong demonstrates canvas score text, one-second delayed serves, pause/resume and scene replacement. The feature check passed 96 tests; Chromium text rendering was exercised on WebGPU, WebGL2 and Canvas2D. This is not a new cross-browser certification.

## 21. Advanced 3D (P09–P12)

### Hierarchy, Cameras, Controls, and Picking

- `Object3D` extends SceneObject with mutable position/Quaternion rotation/scale, `transform`, `visible`, `parent`, readonly `children`, and `worldMatrix`. `Group` is a non-rendering Object3D; Mesh extends Object3D. `updateWorldMatrix()` recomposes mutable locals and ancestors as parent-world × local. `worldVisible` includes all ancestors.
- `parent.add(child)` registers an attached subtree with its Scene; same-Scene reparenting preserves ownership, but cycles, destroyed members, and cross-Scene ownership reject before changing the hierarchy. `parent.remove(child)` or `scene.remove(root)` detaches and unregisters the subtree without destroying it. Scene.objects includes registered descendants. Destroying a parent destroys descendants; shared geometry/material/textures remain borrowed.
- `scene.camera3D` is replaceable with PerspectiveCamera or OrthographicCamera. Both expose mutable position, rotation, near/far, `lookAt(Vector3)` and `updateMatrix(aspect)`. Perspective fov is radians; orthographic `height=10`, `zoom=1` gives vertical extent height/zoom, with width set by aspect. Forward is local −Z.
- `new OrbitControls(camera, canvas)` handles left-drag rotation, right/modified-left pan and middle/wheel dolly on that Canvas. Configure `target`, enable flags, speeds, min/maxDistance, min/maxZoom (orthographic), min/maxPolarAngle and min/maxAzimuthAngle (radians). `update()` reconciles external changes; `destroy()` releases capture/listeners and restores engine-owned touch-action. It is not automatically owned by Scene.
- `new FirstPersonControls(camera, canvas)` adds mouse-look and WASD movement. `await controls.lock()` requests Pointer Lock (it must run inside a user gesture, and rejects if the browser refuses); `unlock()`, `isLocked`, and `lock`/`unlock` events (an `EventTarget`) follow the canvas' lock state. While locked (`requireLock`), pointer `movementX/Y` change `yaw`/`pitch` by `lookSpeed` radians per pixel with pitch clamped to `[minPitch,maxPitch]`, and `update(deltaTime)` moves the camera at `moveSpeed` units/second along `keys` (`KeyboardEvent.code`, rebindable: forward/back/left/right/up/down/sprint; `sprintMultiplier`). Movement is horizontal unless `fly` is true. Held keys are cleared when the lock ends or the canvas blurs. Initial yaw/pitch come from the camera rotation (roll is dropped), `setRotation(yaw,pitch)` sets them. Call `update` once per frame yourself; `destroy()` unlocks and removes all listeners. Verified by unit tests with a fake document and canvas only; real browser Pointer Lock (including refusal outside a gesture, and touch devices) was not exercised.
- `Raycaster.setFromCamera(x,y,camera,aspect)` takes NDC. `intersectObjects(iterable,recursive=true,out=[])` replaces out and sorts exact indexed-triangle hits by world distance, with object/point/distance/faceIndex and instanceId for instances. Hidden ancestors exclude descendants; duplicate roots do not duplicate meshes. Tests are two-sided independently of material culling; Raycaster near=0/far=Infinity are independent of camera clipping. Skinning is refreshed before picking.

### glTF, Animation, and Geometry Updates

- `GLTFLoader.load(url,{signal,allowedOrigins})` and `parse(ArrayBuffer|string,baseURL?,{signal,allowedOrigins}?)` return `GLTFAsset` with scene:Group, animations:AnimationClip[] and idempotent dispose(). External/embedded buffers and images, relative URIs, GLB 2, triangle primitives, normalized/strided/sparse accessors, node TRS and decomposable affine TRS matrices, metallic-roughness materials, UV0 textures, and skins with up to four influences are supported. Buffers/images referenced by the model may be fetched only from the model's own origin (`baseURL`) or from origins listed in `allowedOrigins` (e.g. `['https://cdn.example']`); `data:`/`blob:` URIs are always allowed, and any other origin rejects with `AssetError` before a request is made. Missing normals are generated and missing UVs are zero.
- Non-triangle topology, `COLOR_1`, UV sets other than UV0, extra skin influences, shear matrices, animated matrix nodes, and morph attributes other than POSITION/NORMAL/TANGENT reject explicitly; required extensions outside the supported set reject. `COLOR_0` now supports float and normalized unsigned-byte/unsigned-short VEC3/VEC4, including alpha (section 34). Morph targets support POSITION/NORMAL deltas (float/normalized integer, sparse; missing entries zero), mesh/node weights and STEP/LINEAR/CUBICSPLINE weights channels. TANGENT deltas are ignored because tangents are not consumed. All primitives of one mesh require the same target count; node weights must match. Image decoder limits remain in section 18.
- Implemented extensions: `KHR_mesh_quantization` (integer/normalized accessors are already dequantized to float); `KHR_materials_emissive_strength` (multiplies `emissiveFactor`, negative rejects); `KHR_materials_unlit`, approximated with existing PBR as black base color, roughness 1, and base color routed to emission (alpha still comes from base color; image-based specular of a dielectric F0 remains faintly visible); `KHR_texture_transform`, baked into UV0 on the CPU per primitive (`uv' = offset + R·S·uv` with the spec's rotation matrix), so every texture slot of one material must share the same transform or the model rejects, and a transform's own `texCoord` other than 0 rejects; `KHR_lights_punctual`, exposed as `asset.lights` (`point: PointLight[]`, `spot: SpotLight[]`, `directional: {direction,color,intensity}[]`) evaluated once at load at each node's world transform, with raw glTF photometric intensity and `range` absent → 0 (unbounded). Lights are not added to a Scene automatically, do not follow node animation, and directional lights map to the single `scene.directionalLight` only by your choice. Mipmapped sampler minification filters (9984–9987) are accepted and degrade to the matching nearest/linear filter because no mipmaps are generated. Other optional extensions are ignored using their core fallback. Verified with unit tests on synthetic models only; no third-party model corpus was run.
- P39 also implements required `KHR_materials_ior`, `KHR_materials_specular`, `KHR_materials_clearcoat`, `KHR_materials_sheen`, `KHR_materials_transmission` and `KHR_materials_volume`; see section 37 for material contracts and raster approximations.
- P32 adds built-in `EXT_meshopt_compression`, conditional `KHR_draco_mesh_compression` via `dracoDecoder`, and conditional `KHR_texture_basisu` via `ktx2Transcoder`; see section 30 for fallback behavior. Supplying a callback is not bundled codec support or certification of external decoder quality, speed or memory use.
- `src/data/models.ts` fixes input at 32 MiB, aggregate fetched and tracked decoded allocations at 128 MiB each, entries per top-level list at 10,000, accessor scalar elements at 4,194,304, total vertices at 1,000,000, indices at 3,000,000, joints per skin at 256, morph targets per mesh at 64, and hierarchy depth at 256. Limits reject rather than truncate; these accounting budgets are not a total browser-memory guarantee.
- Applications must call `asset.dispose()` after removing/stopping all consumers: it destroys loader-owned nodes and textures. Scene destruction alone does not release the asset's owned textures; do not dispose while another live object borrows them. Abort/parse failure cleans up owned resources.
- `KeyframeTrack(target,path,times,values,interpolation='LINEAR')` targets translation/rotation/scale on an `Object3D`, or `'weights'` on a `MorphWeights` (values are `keys × targetCount` scalars; cubic triplets apply per weight); STEP, LINEAR and CUBICSPLINE are supported. Times are increasing nonnegative seconds; cubic values use incoming tangent/value/outgoing tangent triplets. Linear Quaternion interpolation uses the shortest path; cubic results are normalized.
- Morphing is CPU-side: `Mesh({morph: new MorphTargets({positions,normals?,weights})})` owns its Geometry; weights drive cached `base + Σ w·Δ` deformation and normalized normals. `SkinnedMesh` morphs its render bind pose before GPU skinning; exact CPU query geometry is refreshed lazily (section 42). glTF primitives of one node share morph weights.
- `AnimationClip(name,tracks)` derives duration from final keys; `scene.animations.clipAction(clip)` caches an action. `play()` resumes without resetting time; `stop()` resets time without restoring pose. Repeat/once/pingpong, reverse time, weights/fades/crossfades and ordered layer blending are documented in section 32 (P34), which supersedes the P10 no-blending baseline. `stopAll()` stops actions and `destroy()` releases them.
- Game advances scene.animations after timers and before user Scene.update with clamped simulation delta; pause/hidden time is excluded. Do not manually update the same mixer. `SkinnedMesh.updateRenderDeformation()` updates its joint palette and animated bounds; `updateSkin()` updates the exact CPU mirror for queries, not ordinary rendering. Index topology remains immutable (section 42).

### PBR, Lighting, Shadows, HDR, and Instancing

- `PBRMaterial` extends TextureMaterial and borrows all slots. Base texture and emissiveTexture RGB are sRGB decoded; factors and lighting are linear. metallicRoughnessTexture is linear (G roughness/B metallic), normalTexture is linear tangent-space UV0 (normalScale), and occlusionTexture is linear R (occlusionStrength, indirect illumination only). Metallic/roughness default to 0/0.5; emissive defaults to zero.
- alphaMode is OPAQUE, MASK (alphaCutoff) or BLEND; doubleSided controls culling and backface normals. Direct construction defaults to BLEND (MASK when positive cutoff supplied), doubleSided=true; glTF uses its OPAQUE/false defaults. PBR alphaMode is authoritative even with opacity below one. Legacy TextureMaterial enters the transparent pass with opacity below one or explicit `transparent: true` (for texture/vertex alpha). Default sorted meshes follow opaque/MASK meshes, farthest to nearest by bounding-sphere-center distance, with stable ties and reusable sort storage. Intersecting surfaces can still composite incorrectly; opt into weighted transparency when that approximation is preferable.
- Scene.pointLights and spotLights accept PointLight/SpotLight. Position/color/intensity/range are mutable; range=0 is unlimited. Spot direction points toward the illuminated surface and innerAngle/outerAngle are radians. At most 8 point and 8 spot lights are supported; exceeding limits rejects, not truncates.
- `scene.shadows` defaults disabled; mapSize=1024, extent=10, near=0.1, far=50, bias=0.002 and target retain the original fixed directional camera. Mesh.castShadow/receiveShadow default true. P37 adds point/spot shadows and 2–4 directional cascades using a bounded depth atlas and 3×3 PCF; see section 35, including light flags and device-dimension limits.
- scene.postProcessing defaults disabled. When enabled, 3D renders into an HDR floating-point attachment before fullscreen exposure (default 1), toneMapping ('aces' default or 'none') and actual 9-tap threshold bloom (strength=0, threshold=1, radius=2 output pixels). The 2D overlay runs afterward and is unaffected. Resize/disable/destroy release size-dependent targets. WebGL2 requires EXT_color_buffer_float and explicitly rejects requested HDR processing when unavailable.
- `InstancedMesh({...meshOptions,count})` has fixed positive count and identity-initialized matrices. Use setMatrixAt(index,Matrix4) for finite invertible affine matrices; it increments version so upload caches notice changes. getMatrixAt(index,out) reuses out. Do not directly mutate matrices without notification. Indexed hardware instancing shares geometry/material, composing mesh.worldMatrix × instance matrix with inverse-transpose normals.
- Environment (`EnvironmentMap`, WebGPU/WebGL2 only): `scene.environment` lights PBRMaterial with image-based light and `scene.background` draws a skybox; both take the same or different maps, `environmentIntensity`/`backgroundIntensity` (nonnegative, default 1) scale them, and a destroyed map is treated as absent. Maps are immutable 2:1 equirect radiance images (height 4..1024, width 2×height, linear light): `fromPixels(w,h,float RGB|RGBA)`, `fromImageData(8-bit sRGB)`, `fromRGBE(hdrBytes)` (Radiance .hdr, flat or RLE, -Y +X orientation only, bounds-checked) and procedural `gradient({zenith,horizon,ground,sun?})`. Direction convention: u=0.5 looks toward −Z, v=0 is +Y. Construction filters once on the CPU (about 160 ms for 2048×1024 in Chromium): an order-2 SH irradiance (÷π, cosine-convolved) for diffuse light and up to 7 half-float mips whose levels ≥2 are cosine-power lobes for roughness = level/(mips−1); level 1 is a box average. Shaders use `textureLod` at `roughness × (mips−1)` and Karis' analytic split-sum BRDF (no LUT). With an environment the flat `ambientLight` term is dropped for PBR; punctual/directional lights still add; TextureMaterial is unchanged. The skybox is a fullscreen triangle drawn first without depth, unprojecting two points per pixel so perspective and orthographic cameras work; it samples level 0 (no minification filter) and is tone mapped with the 3D pass. GPU copies are renderer caches keyed by map, released when unused or destroyed. Not implemented: environment rotation, box-projected/parallax reflections, sun shadowing from the map, and background blur. Verified by unit tests (SH/mips/RGBE) and in Chromium on WebGL2 and WebGPU (sky orientation, IBL spheres, HDR path, orthographic camera, runtime swaps; no console errors); other browsers and real-GPU visual parity are unverified.
- The preceding no-box-projection exclusion is the historical environment baseline: P38 now provides bounded baked `ReflectionProbe` box projection and cubemap inputs converted to equirect data (section 36), not native cube textures or automatic probe capture.
- Frustum culling (WebGPU/WebGL2) tests the mesh bounding sphere transformed by world matrix and largest axis scale. Ordinary Geometry bounds are cached per `version`; call `markUpdated` after edits. Skinned meshes use conservative animated influence bounds, including morph changes (section 42). InstancedMesh and ordinary morphed meshes remain uncullable. Outside meshes keep caches warm; shadow casters outside the camera view can still render. `frustumCulled=false` disables culling.
- Fog (`scene.fog`, `FogSettings`, WebGPU/WebGL2): disabled by default; `enabled`, `mode` `'linear'` (`near`<`far`, coverage `(d−near)/(far−near)` clamped) or `'exp2'` (`density`, coverage `1−exp(−(density·d)²)`), `color` as display sRGB 0..1. `d` is the world distance from the camera position to the fragment, so orthographic cameras fog by radial distance too. Both `TextureMaterial` and `PBRMaterial` fade toward the fog color; the fade acts on premultiplied color, so translucent surfaces stay translucent. The color is decoded to linear only when post-processing renders the 3D pass in linear HDR. The skybox, 2D overlay and Canvas2D are not fogged. Settings are mutable and validated every frame. Uniform block: `FOG_FLOAT_COUNT` in `src/data/rendering.ts`. Verified by unit tests and by toggling it in the advanced3d example on Chromium WebGL2 and WebGPU (no console errors, visibly lighter distant geometry); exact pixel parity between backends and other browsers are unverified.
- Antialiasing (`GameOptions.antialias`, default `true`): WebGPU renders the 3D pass into 4× multisampled color and depth textures (color `rgba8`/canvas format, or `rgba16float` when post-processing is on) and resolves into the canvas or the HDR target; the shadow pass and the 2D overlay are not multisampled. WebGL2 passes the flag to `getContext` as `antialias`; the browser then decides whether the default framebuffer is multisampled, and the WebGL2 post-processing framebuffer and Canvas2D never are. `false` skips the multisample textures. Toggling requires creating a new Game. In Chromium WebGPU the unique-color count of the advanced3d frame rose from 6194 (off) to 7449 (on), consistent with edge blending; no per-pixel comparison, other browsers or GPU cost were measured.
- Context loss recovery (`GameOptions.recoverGraphics`, default `true`; WebGL2 and WebGPU): a `ResilientRenderer` wraps the backend. On WebGL2 `webglcontextlost` (or WebGPU `device.lost`) it emits `graphicslost` on the Game and cancels any active transition, skips frames, waits for `webglcontextrestored` (WebGL2 only; WebGPU requests a new device immediately), builds and initializes a replacement renderer, prepares every still-live Material2D/PostProcessor2D again, restores the last size, and emits `graphicsrecovered`. Scenes, Textures and geometry are CPU-owned, so they re-upload lazily. Renderer-owned handles do not survive: `RenderTexture2D` targets and `RenderSnapshot`s from before the loss must be recreated, and calls that need the GPU (`createRenderTexture`, `prepareTextures`, `captureScene`, …) throw a `GraphicsError` while recovering. If the replacement fails to initialize, the Game receives a `GraphicsError` whose `cause` is the failure and stops as before; `recoverGraphics: false` keeps the old fatal behavior. Verified with mock-renderer unit tests (both backends) and in Chromium by `WEBGL_lose_context` on WebGL2, twice in a row and with the HDR path on; the real WebGPU device-loss path was not exercised in a browser, and Canvas2D has no loss handling.
- WebGL2 restore timeout: if `webglcontextrestored` does not arrive within `graphicsRecoveryLimits.restoreTimeoutMs` (10 s, `src/data/rendering.ts`), recovery fails with a `GraphicsError` (its `cause` explains the timeout) and the Game stops as it does when a replacement cannot initialize. The timer is cleared on restore and on `Game.destroy()`. WebGPU requests a device immediately and has no such wait.
- Scene effect chain (`scene.effects3D`, WebGPU and WebGL2): an ordered list of `PostProcessor2D` descriptors, with the same WGSL/GLSL `effect(color, uv, screen)` ABI, uniforms, `await graphics.preparePostProcessor(effect)` requirement and lifetime rules as `effects2D`. The chain sees the finished, display-space, premultiplied RGBA8 3D image (meshes, skybox, and HDR/bloom/tone mapping when enabled) and its result replaces it before the 2D layer is drawn, so sprites and HUD are not processed. Each frame with a chain uses two extra full-size RGBA8 targets (WebGPU: canvas-format source plus the shared ping-pong pair; WebGL2: an RGBA8 color/depth target plus the effect target), released when the chain is emptied or the canvas resizes. WebGPU still multisamples the 3D pass and resolves it into the source; the WebGL2 chain path renders into an offscreen target that is not multisampled. Canvas2D throws `UnsupportedGraphicsError` for a non-empty chain. `renderToTexture`/`generateTexture` of a Scene do not apply it. Verified in Chromium on both backends by swapping red/blue on a lit cube (with and without HDR post-processing) and comparing to the unprocessed frame; other browsers and 2D-overlay interaction were not tested.
- Render stats (`game.graphics.stats`) reuse one `RenderStats` object; copy fields to retain them. `meshes`, `culled`, `drawCalls`, `triangles` (instances included) and `shadowDrawCalls` preserve their 3D definitions. `frame` counts frames started by every backend, including 2D-only frames. P40 adds per-frame `drawCalls2D`, `instances2D`, `renderPasses2D`, `uploadBytes` and resident/lifetime-peak `renderTargetBytes`/`peakRenderTargetBytes`; see section 39. Canvas2D's 3D counters remain zero, not its 2D paint/target estimates. The earlier Chromium 3D-only check (4 meshes, 1 culled, 3 draws, 84 triangles) is historical evidence, not verification of P40 metrics.

See [advanced3d](../examples/advanced3d/) and the [usage guide](USAGE.md#11-advanced-3d). These are WebGPU/WebGL2 3D features; Canvas2D remains 2D-only. Actual Chromium observations do not certify other browsers or throughput.

### Per-Slot Texture Sampling

PBRMaterial per-slot samplers accept `TextureSamplerOptions`: `minFilter`, `magFilter`, `mipmapFilter` are `'nearest' | 'linear'`; address modes are `'clamp-to-edge' | 'repeat' | 'mirror-repeat'`; finite LOD clamps satisfy `0 <= lodMinClamp <= lodMaxClamp <= 32`. Defaults retain linear/clamp sampling. GLTFLoader uses repeat wrapping and distinct samplers on shared images without duplicating ownership. Native supplied-mip semantics and glTF filter mapping are described in section 42.

Ordinary decoded-image textures still have only level zero; no automatic general mip generation is provided. EnvironmentMap roughness mips remain a separate specialized path.

## 22. 2D Hierarchy and Atlas Graphics (P13)

- GameObject remains the public 2D facade. Mutable local position/rotation/scale compose into reused worldMatrix (parent × local), preserving shear and reflection. Group2D is a non-drawing container; add/remove, parent/children, updateWorldMatrix, getLocalBounds and containsPoint use the existing Scene ownership flow. Cycles/cross-Scene ownership reject; same-Scene reparent preserves local pose. Remove unregisters without destroying; parent destruction recursively destroys children.
- worldVisible ANDs visibility, worldOpacity/worldTint multiply, worldZIndex adds; root space is inherited. ScreenElement extends Group2D with screen space. Stable world-before-screen ordering puts HUD after all world sprites; equal z preserves insertion order. Bounds include Sprite anchor; singular-transform point tests return false, not pixel-alpha picking.
- Sprite source is a copied/frozen finite positive in-texture Rect2D; fractional x/y/width/height are supported. Undefined means whole texture. Texture replacement validates the current source before publishing. Natural width/height do not include scale; no displayWidth/displayHeight aliases. Texture is borrowed. SpriteSheet constructor/grid validates immutable integer frames, supports origin/spacing and creates Sprites without cropping/copying images.
- FrameAnimation(sprite,frames,{strategy,speed}) binds to one Sprite; frame duration is positive finite seconds. Strategies loop/pingpong/freeze/hide, getters frame/playing, play/pause/reset/reverse/goToFrame/stop; reset restores visibility/first frame, stop pauses and resets. Source changes use frozen frames. Scene advances centrally with simulation delta; removed objects do not advance. Native animationframe/animationloop/animationend dispatch on both animation and Sprite; large dt aggregates loop counts. Sprite destruction pauses and releases its animation reference.
- SpriteFont maps Unicode code points to sheet frames with validated alphabet, optional case-insensitive mapping/fallback, glyphWidth/advance/lineHeight. SpriteText text updates preflight bounded layout and glyph allocation, reuse existing glyphs, and reject without publishing invalid text. Newline/letterSpacing/lineSpacing/left-center-right alignment are supported; no BMFont importer.
- That no-BMFont statement applies to the original P13 sheet constructor, not the whole current engine: P27 supports bounded text/JSON multipage BMFont loading and metrics (section 28).
- NineSlice validates integer source/margins and finite nonnegative bounded destination dimensions, including fractional sizes. Stretch/tile/tile-fit and drawCenter use owned pooled Sprite children. Tile uses actual fractional source remainder; tile-fit repeats full cells at fitted scale. Small destinations proportionally compress opposite margins. Resize preflights before publication; hidden retained pool patches do not inflate Group bounds. Both composites borrow texture and destroy only children.
- All backends receive flattened affine/source/tint/opacity data; GPU/GL batches retain source UV and adjacent ordering. P13 pixels/resource observations are in ACCEPTANCE, not FPS/full-frame-parity claims. See [usage](USAGE.md#12-atlas-graphics-and-hud-p13). P13–P20 profiles/formalconsumer/finaltoolchain37files252tests are accepted in recorded scope.

## 23. Preload and Sample Audio (P18)

- Public root exports: PreloadBatch, LoadTask, PreloadProgress, PreloadState, ResourceLoadOptions; SampleAudioAsset, SamplePlayback, SamplePlayOptions, SamplePlaybackState. AudioManager loadSample/sampleTask/opmTask, AssetLoader textureTask/loadBinary/loadText/loadJSON and GLTFLoader.task are available. Scene protected preload(game,signal) returns PreloadBatch|void|Promise<PreloadBatch|void>, awaited before initialize. Game.loading is a readonly current candidate batch view; internal owner checks prevent stale candidates clearing newer loading.
- PreloadBatch(tasks) validates unique nonempty keys and snapshots bound load methods; limits4 concurrent/4096 tasks. load({signal?}) shares one operation and resolves typed ReadonlyMap; state idle/loading/ready/failed/cancelled. Immutable progress snapshots completed/total/ratio/currentKey; task-count completion, empty ratio=1. Native progress/complete/error detail: snapshot/map/actual cause. cancel(reason?) cooperatively aborts unfinished tasks without destroying results; no retries/byte estimates.
- Texture/OPM/sample canonical caches use per-subscriber abort; cancelling a caller preserves loader-owned fetch/other borrowers. Loader destroy aborts underlying requests. Generic reads are independent/no cache and signal cancels request: binary default8 MiB, text/JSON1 MiB, optional maxBytes positive integer<=8 MiB; HTTP/HTTPS/data/blob and streamed actual-byte bounds. loadJSON<T> is a cast, not schema validation.
- SampleAudioAsset begins encoded-only, decoded=false, metadata undefined. decode/play require gesture unlock; decodeAudioData consumes a private copy, preserving cached bytes. play lazily decodes and captures Scene ownership before await; manager owns decoded data shared by sources. sampleTask completion is not decoded readiness.
- Source→perplay Gain→sample channel Gain→sample master Gain→destination uses first OPM AudioContext, no ninth/vendor changes; existing volume controls refresh sample buses, worklet reset preserves them. Separate32-playback limit rejects overflow without stealing OPM slots.
- SamplePlayOptions extends channel/scene/persistent/loop with volume0..1, playbackRate(0,16], offset within duration, finite nonnegative absolute AudioContext scheduledStartTime; past schedule clamps to currentTime. Scheduled-but-not-started state remains playing with stable initial position. State playing/paused/stopped/ended; mutable volume/rate, pause/resume/seek/stop. Pause preserves position; resume/seek replace one-shot sources without decoding, old ended cannot finish replacement, finished seek rejects, natural end differs from stop.
- Spatial audio: `SamplePlayOptions.spatial` `{position:{x,y,z}, refDistance=1, maxDistance=10000, rolloffFactor=1, distanceModel='inverse'|'linear'|'exponential', panningModel='equalpower'|'HRTF'}` routes perplay Gain→PannerNode→channel bus; invalid options (non-finite, refDistance/maxDistance≤0, negative rolloff, linear with rolloff>1 or maxDistance≤refDistance, unknown models) throw AudioError before any node is created. `SamplePlayback.position3D` reads/moves the emitter (setter throws on a non-spatial playback). `game.audio.listener` (`AudioListenerState`) has `setPosition(x,y,z)` and `setOrientation(forward,up)` (non-zero, non-parallel), retains state before unlock and replays it once the sample context exists; an untouched listener leaves the browser defaults. Units and handedness follow Web Audio. Unit tests use mocked nodes; no hearing/speaker or HRTF quality verification.
- Game pause independent of audio clock; Scene stops nonpersistent/detaches persistent, manager/Game destroy stops all and releases cache/buses/late results. Encoded8 MiB; **after decodeAudioData** bounds2,097,152 frames/8 channels/192,000Hz/8,388,608 values. Not prevention of decoder transient amplification or a global cache budget.
- P18 was accepted in the recorded Chromium scope after central Scene integration: corrected 4 files/35 scoped tests and 12 owned-file formatting checks, with Promise.withResolvers disabled in the ES2022 runtime smoke. Prior 33-test module proof remains historical, not added. See [usage](USAGE.md#13-preload-and-native-samples-landed-p18-modules); no new full-suite, hearing-speakers or other-browser claim.
- Scene prepare failure/cancel destroys only candidate and clears its loading; old Scene continues unless paused. Preparation/publication may finish while paused; simulation resumes afterward. Destroy cancels active/pending exactly once. Unique GLTFLoader.task acquired assets install signal cleanup, so partial batch failure disposes only that model/owned textures; successful batch transfers ownership to caller. Shared loader results/unrelated direct models stay alive; custom tasks still own resource cleanup. GLTFAsset.dispose remains caller responsibility after consumers stop.

## 24. Actions, Lifecycle, Pointer and Camera (P14)

- Root exports Actions, Easings, ActionQueue, Action/ActionOwner/ActionHandle/ActionState/Easing, CameraStrategies, CameraController2D, CameraBehavior2D/CameraFollowOptions/CameraShakeOptions, PointerTargetEventDetail. GameObject.actions lazily allocates one FIFO queue; passive composites do not allocate queues during Scene iteration.
- Action factories: moveTo/moveBy(x,y,duration,easing?), rotateTo(angle,duration,easing?), scaleTo(x,y,duration,easing?), fadeTo(opacity,duration,easing?), tween(target,values,duration,easing?), delay(duration), call(ownerCallback), sequence(...actions), parallel(...actions), repeat(action,count), repeatForever(action). Values/durations are finite, duration nonnegative seconds, opacity [0,1], tween properties already numeric. Start values capture at run start; sequence consumes overshoot, parallel consumes the longest branch, repetition uses fresh runtime. Infinite repeat must consume time; 10,000 bounded runtime steps/update reject runaway callback work.
- ActionQueue.run returns handle {state,finished,cancel}; finished resolves 'completed'/'cancelled' (including owner destruction), clear cancels detached current list before listeners may enqueue a new run. Queue settlement precedes completion/cancellation callbacks. Callback continuation checks Scene identity/registration generation and Game activity; remove/re-add waits a frame and invalidated generations do not emit postupdate.
- Native target-only events: initialize once on first active tick, add/remove {scene}, preupdate/postupdate {dt}, destroy; actionstart/actioncomplete/actioncancel {action,handle}. Native listener once/signal semantics remain. Not bubbling or guaranteed paired pre/post on invalidated ticks; unobserved lifecycle events are not allocated.
- GameObject.pointerEnabled/draggable and hitTestMode 'graphics'|'collider'. Router picks visible topmost world/HUD objects using inverse affine geometry or shape-accurate collider, ignores singular graphic transforms; no pixel alpha. Detail snapshots {pointerId,button,screen,world,target,originalEvent?}; pointerenter/leave/down/up/move/cancel, dragstart/move/end. Multi-pointer DOM capture and parent-inverse drag preserve nested local coordinates, one pointer owns each drag. Ingestion bounded 256 samples/32 active views with move coalescing; pause/hidden/teardown cancels routing and resume drops stale samples. Existing aggregate polling is retained.
- CameraStrategies.follow(target,{axis?,smoothTime?,deadZone?}) follows world origin, not screen-space or destroyed/foreign target; deadZone uses viewport-relative logical screen pixels. bounds(rect) clamps with current viewport/zoom or centers undersized bounds. Camera2D.addBehavior/removeBehavior/clearBehaviors preserve insertion order; moveTo/zoomTo return ActionHandles on independent channels. Update order is motion→zoom→strategies→shake, after systems/physics/particles and before rendering/culling; later bounds may override earlier motion/follow.
- CameraShakeOptions {duration,amplitude:[x,y],frequency?,seed?}; amplitude nonnegative, frequency positive (default30), integer seed (default0), duration×frequency bounded uint32. Seeded time noise decays into renderOffset, leaves logical focus unchanged, ends/cancels at offset0. Game pause/hidden freezes simulation; picking uses the most recently rendered camera. Camera destruction settles pending handles/releases strategies.
- Built-in normalized Easings: linear; quad/cubic/sine In/Out/InOut; bounceOut. Custom output must stay finite [0,1], no back/elastic scope. Actual Canvas native drag/pause/camera proof and distinct scoped test counts are in ACCEPTANCE. [Usage](USAGE.md#14-actions-pointer-targets-and-camera-p14).

## 25. Bounded World Physics, Maps and Particles (P15–P17)

### Physics

- Root exports RigidBody2D/RigidBodyOptions, Collider2D/Colliders/ColliderKind/ColliderOptions, PhysicsWorld2D/PhysicsWorldOptions/CollisionDetail/ContactQuery/PhysicsRayHit, Trigger2D/TriggerOptions. Scene.physics owns automatic GameObject.body/collider registration; collider-only objects are static. Body type static/dynamic is immutable; velocity is mutable Vector2, angularVelocity radians/second, mass positive, restitution [0,1], friction/damping nonnegative, finite gravityScale, lockRotation. applyForce/applyImpulse(Vector2,worldPoint?) create lever-arm torque; clearForces clears force/torque.
- Collider geometry snapshots: centered circle(radius), box(width,height), polygon(vertices), optional local offset. Strictly convex consistently wound 3–32 vertices; normalized winding, invalid/degenerate/star/concave reject. Geometry extent bounded 1,000,000; nonsingular transforms, circles uniform absolute world scale. Dynamic body requires world root, nested static permits affine transforms; no screen physics. Scaling refreshes geometry/inertia.
- Discrete fixed-step sweep broadphase plus exact circle/convex contacts and clipped faces; iterative linear/angular impulse, restitution/tangent friction and positional correction. Default gravityY980, fixedDelta1/120, maxSubSteps12, velocityIterations8, positionIterations3; configurable positive fixedDelta, substeps1–120 and iterations1–64. At most16,384 registered colliders. droppedTime accumulates excess catch-up time. P43 samples frame force/torque as time-weighted impulse, preserving unfinished-tick contributions; fixed gameplay force is queued for the ensuing physics step, and clearForces cancels queued force (see section 43). No kinematic bodies, dynamic concave/compound bodies, zero-width edges or 3D in this 2D world; high-speed tunneling remains for bodies without `ccd` and for dynamic-vs-dynamic pairs.
- Reciprocal category/mask uint32 defaults1/all bits; sensor detects without response. collisionstart/precollision/postcollision/collisionend native detail {self,other,normal,points,penetration,sensor,cancelResponse}; stable snapshots, reversed normal for other receiver, cancel only current precollision response. Callback removal/filter changes/destruction end surviving contacts safely. overlap(collider,owner) returns exact ContactQuery[] excluding owner with reciprocal filters; raycast(origin,direction,maxDistance,mask?) normalizes nonzero direction and sorts PhysicsRayHit[] by surface distance.
- Trigger2D(collider,{filter?,repeat?,onEnter?}) clones a static sensor; default one accepted enter, repeat0 inactive, explicit Infinity unlimited. triggerenter/triggerexit detail {self,other}, readonly remainingRepeats; filter rejected enters do not consume count. Does not destroy itself automatically.
- Sleeping (P31): a dynamic body whose linear speed stays below `physicsDefaults.sleepLinearVelocity` (0.1) and angular speed below `sleepAngularVelocity` (0.05) for `sleepTime` (0.5 s) falls asleep, but only when every dynamic body in its non-sensor contact group is also idle, so a stack sleeps as a unit. Sleeping bodies are skipped by integration and contact solving and their velocity is zeroed. They wake on `applyForce`/`applyImpulse`/`velocity`/`angularVelocity`/`wake()`, on transform edits (`isSleeping` compares the pose recorded when it fell asleep), on sensor contacts, when a moving body touches the group, and when a touching contact ends or a touching static collider moves. `RigidBodyOptions.allowSleep` (default true, also a setter) and `body.isSleeping` expose it; `isSleeping` is a getter that may wake the body if it detects a pose or velocity change.
- Continuous collision (P31): `RigidBodyOptions.ccd` / `body.ccd` (default false) sweeps a dynamic body's translation each fixed step against static, non-sensor colliders that pass the reciprocal category/mask test. It only runs when the step's travel exceeds `physicsDefaults.ccdTravelRatio` (0.25) of the body's smaller AABB extent. The test is exact for translation of convex shapes (circle and convex polygons, via the ray-vs-Minkowski-difference of the pair): the body is pulled back to the first contact and pushed `ccdPenetration` (0.01) along its motion so the normal solver then applies restitution, friction and correction with the unchanged velocity. Limits: rotation during the step is not swept, only static targets are swept (dynamic-vs-dynamic tunneling remains), contacts already active at the start of the step are skipped, and the cost is O(ccd bodies × colliders) per step.
- Joints (P31): `scene.physics.addJoint(joint)` attaches `DistanceJoint` (rigid, or a soft spring with `frequencyHz`/`dampingRatio`), `RevoluteJoint` (pin with optional angle limits and motor), `PrismaticJoint` (slide along an axis with translation limits and motor, rotation locked), `WeldJoint` and `MouseJoint` (soft drag toward `setTarget(x, y)`, bounded by `maxForce`); `removeJoint`/`joints` manage them (at most 4,096). Bodies must already be registered, at least one must be dynamic, and a joint is detached automatically when either body is unregistered. `anchor` is a world point on `bodyA` and `anchorB` (default `anchor`) a world point on `bodyB`; both are converted to body-local anchors from the poses at attach time and ignore scale. With no `bodyB` the fixed world becomes side A, so angles, translations, axes and motor speeds are the body's own relative to the world. Constraints use sequential impulses without warm starting inside the existing velocity/position iteration counts, so very stiff chains need more `velocityIterations`. Jointed bodies do not collide unless `collideConnected`; they sleep as a group and a joint wakes a sleeping partner. `breakForce` removes the joint once the step's anchor reaction (impulse per second) exceeds it and calls `onBreak` once. Limits: no rope/gear/pulley/wheel/friction joints and no warm starting.
- Concave and chain shapes (P31): `decomposeConvex(vertices)` splits a simple polygon (either winding, up to 256 vertices, collinear points tolerated) into strictly convex counterclockwise pieces of at most 32 vertices by ear clipping plus Hertel–Mehlhorn merging; self-intersecting or zero-area input throws `RangeError`, and the pieces are not minimal. `StaticConcave2D(vertices, options?)` is a GameObject whose children are static convex pieces (`friction`, `restitution`, `category`, `mask` apply to each), so it can be moved or affinely scaled but there are no dynamic concave bodies. `StaticChain2D(points, {closed?, thickness?})` builds one thin convex quad per segment (default thickness 2, ends extended by half the thickness). Chains are solid strips, not zero-width edges: bodies thinner than the thickness, or moving farther than it per step, can still tunnel unless they use `ccd`. Add them with `scene.add(shape)`; every child registers like any collider-only object.
- Restitution threshold (P31): a contact only bounces when its approach speed exceeds `max(restitutionThreshold 1, |gravity| × fixedDelta × restitutionGravitySteps 2)`, so a bouncy body resting under gravity at pixel scale can settle and sleep instead of jittering forever. Hard impacts still bounce.
- Debug draw (P31): `world.debugSnapshot()` copies the current colliders (kind, world points or circle center/radius, bounds, `dynamic`, `sensor`, `sleeping`), active contacts (points, normal) and joints (`type`, world `anchors`) as plain data. `PhysicsDebugDraw2D.create(world, {colliders, contacts, joints, bounds, region, zIndex})` rasterizes that through `Graphics2D` on every backend: static blue, awake dynamic green, sleeping gray, sensor yellow, contacts red, joints cyan. Add `debug.display` to the Scene and call `refresh()` (calls that arrive during a redraw are skipped); `visible` toggles it and `destroy()` releases the raster. It is a debugging aid, not per-frame production rendering: every refresh re-rasterizes the bounding box of everything drawn, the overlay lags the simulation by the rasterization time, and without `region` a body beyond the Graphics2D coordinate/texture budget makes the refresh reject (logged, previous overlay stays). Pass `region` (for example the visible area) to skip shapes and contacts outside it and joints with an anchor outside it; a shape that only partly overlaps is still drawn whole.

### Maps

- TileMapOptions {columns,rows,tileWidth,tileHeight,sheet}; positive integer grid ≤65,536 cells, positive finite logical dimensions. IsometricMapOptions adds nonnegative elevationStep (default tileHeight/2). Both Group2D facades borrow SpriteSheet/Texture and reuse generated Sprite/collider children.
- Immutable Tile {frame:number|undefined,solid,elevation,collider?,metadata?}; setTile(column,row,Partial<Tile>) preflights frame/shape/registration before publication, getTile validates grid coordinates, clearTile resets all cell data. Default solid shape is top-left box or isometric diamond, optional custom convex collider; solid cells may exist without visible frame. Screen-space solid edits reject.
- tileToLocal(column,row,out?)/tileToWorld include cell elevation; orthogonal top-left/isometric top vertex. worldToTile(point,out?) inverts current hierarchy onto elevation-zero plane, returns integer coordinates possibly outside grid. No known-elevation overload. pickTile(point,out?) tests elevated topmost rendered graphic rectangles ordered by diagonal/elevation/insertion, not alpha/diamond exact geometry; singular pick returns undefined, inverse conversion rejects.
- Camera-local transformed conservative culling includes elevation/overhang and renderOffset; only renderEnabled changes, solid registration remains. Hidden/cleared Sprite pool is retained/reused without growing bounds. Edits, transforms, Scene removal and destruction update static colliders; destroy owned children, not borrowed atlas. No hex/staggered/multilayer/editor format importers/navigation.
- Navigation was excluded from the original map profile; P42 now explicitly approves navigation/pathfinding. Editor importers/hex/staggered remain outside the approved expansion.

### Particles

- ParticleEmitter/ParticleEmitterOptions/ParticleNozzle export from root. Options required texture, capacity1–16,384, rate≥0, lifetime/speed/angle ordered pairs, startSize/endSize width-height pairs and normalized startColor/endColor; optional source, acceleration, nozzle, seed, space local/world. Lifetime strictly positive, angle radians; point default, rectangle width/height or circle radius. Options are validated/snapshotted; borrowed Texture/source dimensions do not change during size animation.
- CPU fixed Sprite pool and typed simulation state; analytic constant acceleration, lifetime interpolation, deterministic seeded sampling. Fractional continuous births age within current tick; emit(count) bursts immediately, including stopped emitter. Capacity overflow drops new births, no unbounded backlog/loop. Initial stopped, start/stop, clear, readonly activeCount/emitting. Stop leaves survivors aging, clear retires/reset fraction without pool reallocation, destroy owns children only.
- Local follows ancestor affine; world captures complete birth world axes/position and transforms birth velocity/acceleration, so existing particles do not follow later parent movement and new births use current parent. Simulation local/world differs from inherited world/screen rendering layer; HUD emitters work without physics. Game pause freezes age; Scene runs particle simulation after physics, never by caller duplicating update.
- P15–P17 real Game/Scene forced Canvas/GL/GPU:48 assertions/21 screenshots/0 errors, 3 files/40 scoped tests and owned format, source-Vite/procedural atlas/test-only GPU COPY_SRC. Borrowed texture survives teardown until owner cleanup; no published-dist/other-browser/performance claim. [Usage](USAGE.md#15-physics-maps-and-cpu-particles-p15p17).

## 26. Native 2D Shader ABI and Lifetime (P20)

- Root Material2D/PostProcessor2D/NativeEffect2DOptions; options require immutable wgsl/glsl strings, each nonempty ≤65,536 characters, optional finite float-representable uniforms≤16. EventTarget descriptors expose wgsl/glsl/destroyed, uniforms Float32Array(16), setUniforms (zero-fill remainder), idempotent destroy with native destroy event. Descriptors are caller-owned, Scene.effects2D and Sprite.material borrow them.
- Await Renderer.prepareMaterial/preparePostProcessor Promise<void> for each renderer before visible rendering; same descriptor preparation is cached/coalesced. Compiler/validation errors are GraphicsError; unprepared/destroyed rejects, no fallback. Pending teardown cannot publish/leak late preparation.
- WGSL fn effect(color:vec4f,uv:vec2f,screen:vec2f)->vec4f; GLSL vec4 effect(vec4 color,vec2 uv,vec2 screen). Renderer supplies fixed native vertex/input/texture/sampler/uniform declarations, no IR/transpiler. Four vec4s: WGSL uniforms.values:array<vec4f,4>, GLSL vec4 uniforms[4]; uniformValue(index) reads indices0–3. Input/return color premultiplied RGBA, material uv source-local normalized, screen logical pixels. Post sampleInput(topLeftNormalizedUV) provides renderer-normalized orientation on both backends.
- Stage: existing 3D/P12 HDR exposure/ACES/bloom→transparent RGBA8 world2D+HUD layer→ordered effects2D ping-pong→composite→whole-frame transition. Per-Sprite material keeps source UV/tint/opacity/hierarchy/z and affects no unrelated Sprite. 2D post does not process 3D/HDR. Empty effects retains original path.
- Approved lifetime: prepared viewport-independent pipelines/programs and uniform resources remain for live descriptor across resize/disable, avoiding asynchronous reprepare. Mutable layer/transition attachments release on resize/disable. Descriptor destroy synchronously releases its entry; renderer loss/destroy releases all. Independently owned immutable snapshots survive/scale on resize and survive old Scene/Texture destruction until completion/cancel/explicit destroy/loss/renderer destroy. Caller removes consumers before destroying shared descriptors.
- Canvas2D prepare, visible material, nonempty effects2D throw UnsupportedGraphicsError; auto does not guarantee customShaders capability, no silent ignore. No arbitrary bindgroups, extra texture slots/custom vertices/Shader Graph.
- Native GPU/GL uniform/order/top-left pixels and unchanged GPUHDR/coexisting captures, 20 resize-disable-reenable cycles, immediate descriptor cleanup and all tracked native teardown0 are recorded in ACCEPTANCE; not total driver memory/FPS/GC/full-frame parity. [Usage](USAGE.md#16-native-sprite-materials-and-2d-post-p20).

## 27. Whole-Frame Transitions (P19)

- Root TransitionOptions/TransitionController/SetSceneOptions/SceneTransitionEventDetail and graphics RenderSnapshot/TransitionFrame/FrameEffects. Game.setScene(next,options?:SetSceneOptions):Promise<void>, options.transition?:TransitionOptions; readonly Game.transitioning reports visual effect only. kind fade/crossfade/slide, finite duration≥0 seconds, optional normalized color opaque-black default, easing linear, direction left/right/up/down (defaultleft), blockInput defaulttrue.
- Game protocol: prepare while old updates; successful owned capture and version/abort checks precede publication/old synchronous destruction; new Scene alone simulates. Promise awaits final rendered/composited frame. Pause/hidden freezes visual clock, resize preserves/scales capture. Initial no-old/idle and duration0 atomically skip capture/visual events. Candidate/capture failure preserves active; replacement cancels visual/candidate with existing SceneCancelledError and exactly-once snapshot disposal; loss/destroy cancel.
- Native transitionstart/transitioncomplete/transitioncancel {from,to,kind} only for actual visual transitions. blockInput resets capture and suppresses target object pointer routing, not global keyboard/pointer polling. TransitionController validates options, exposes kind/progress/complete getters and readonly duration/blockInput, advance(dt) reuses one TransitionFrame, destroy idempotently releases owned snapshot; does not own Scenes.
- Renderer.captureScene(scene,width,height):Promise<RenderSnapshot> redraws full frame without simulation, excluding active transition overlay; logical arguments/backing capture dimensions. Native texture/FBO/copy canvas owned independently of old resources; no delayed default WebGL canvas read. Snapshot handle exposes backend,width,height,destroyed,destroy; wrong-owner/destroyed/nested active-frame capture rejects. Renderer.render accepts optional fourth FrameEffects {transition?:TransitionFrame}; frame requires normalized progress/color and valid kind/direction, missing snapshot uses color. Auto PresentedRenderer forwards backend capture and presents final composite.
- Accepted actual three-backend Game crossfade/fade proves old synchronous teardown/one incoming simulation, pause-pending Promise, resize-owned capture, final composited completion/release and forced normalized custom-easing endpoint. Initial central4files/30tests covered capture/version/reentry/failure races; supplemental actual native Games now also prove positively presented-slide cancellation, held nativecapture supersession/late disposal, synchronous cancel-listener reentry/latest winner and held-capture destruction:12 snapshots disposed, errors=[] per backend. Destroy immediately releases Scenes/captures and stops frames, while the public Promise still awaits the deliberately controlled native capture return before cancellation rejection; no early await abortion is claimed. Formal root consumer additionally proves paused-effect cancellation retaining published Scene, actual3-resource preload/native8-context audio/native-effects-or-Canvas-rejection/teardown on all three. Finaltoolchain37files252tests plus built/extracted ES2022rootruntime and strict declarationconsumer passed;14vendorfiles byte-identical. [Usage](USAGE.md#17-whole-frame-scene-transitions-p19).

## 28. PixiJS-Inspired Profiles (P21–P29; integrated, one environment tested)

The baseline is [stable PixiJS v8.21.0](https://github.com/pixijs/pixijs/releases/tag/v8.21.0), not main or external plugins. [PLAN](../PLAN.md) defines the approved finite scope; [ACCEPTANCE](../ACCEPTANCE.md) records what was actually observed (one environment: macOS arm64 managed headless Chromium with a WebGPU adapter) and what remains unverified. The earlier 252-test result and GitHub v1.2 release do not include this expansion. WebGPU, WebGL2 and Canvas2D all execute the same collected 2D command stream; the formal example is [examples/rendering2d](../examples/rendering2d/index.html).

- P21 affine helpers preserve mutable vectors, natural Sprite dimensions, global summed-z/stable registration order and world-before-HUD. Pixel pivot is distinct from normalized anchor; coordinate helpers use logical Scene world, not Camera conversions.
- P22 immutable views borrow one source: physical frame/trim/original size, clockwise 0/90 rotation, resolution, anchors and borders. Atlas acquisition owns its pages; ordinary views/Sprites do not. Tiling transforms and nearest/linear/roundPixels belong to the bounded profile.
- P23 retained Graphics are bounded Canvas2D raster textures, including centered strokes, curves, holes, gradients and local patterns; scaling beyond raster resolution can blur. They are not GPU vectors or a full SVG importer.
- P24 mutable renderer-bound offscreen targets are not P19 opaque immutable whole-frame RenderSnapshot handles. Explicit isolation contributes one outer ordering slot; ordinary Groups remain globally sorted. Cache changes require manual updateCache; child simulation continues. CanvasTexture owns a versioned snapshot. Extraction/generated CPU textures have independent ownership.
- P25 rectangle/path masks clip geometric picking, including holes; image-mask picking uses transformed source bounds, not pixel alpha. Default mask channel is alpha, deliberately unlike Pixi's red default. Premultiplied erase affects only earlier transparent 2D, not 3D/P12. Masks and five blends target all three backends; ordered native Alpha/ColorMatrix/Blur/Noise/Displacement filters target GPU/GL and must explicitly reject Canvas.
- P26 native meshes/plane/rope/true projective quad target GPU/GL, with triangle picking and atomic invalid-quad rejection. Visible Canvas meshes must throw UnsupportedGraphicsError; no software fallback or backend switch is implied.
- P27 browser-shaped Text2D is separate from code-point SpriteText, which promises no grapheme/ligature shaping. Bounded text/JSON multipage BMFont includes proportional metrics, zero-area whitespace and kerning. FontFace registration, dynamic RGBA atlas generation and owned manifest unload are required; aliases/bundles reuse PreloadBatch task-count progress.
- P28 hierarchy capture/target/bubble is opt-in; default P14 routing and lifecycle remain target-only. Image picking remains bounds-only. Game-owned accessibility mirrors semantics/focus/activation, not visual rendering, and must clean up DOM/listeners with ownership.
- P29 fixed-capacity drop-new ParticleLayer and versioned static setters/dynamic fields reuse P17 simulation. Explicit prepareTextures/unload separate native uploads from borrowed CPU sources; unload must not destroy the CPU image.

Required components include anchors/borders, CanvasTexture, generated font atlases, ParticleLayer and preparation/unload. Full SVG/HTMLText/SDF/MSDF, native vector tessellation, video/raw/compressed/mipmapped sources, anisotropy, extra advanced blends, generic plugins/render layers, independent Ticker and automatic general GC remain outside this profile. No throughput, browser-wide, real-hardware or full-frame-parity claim follows from the observed pixels.

Compressed/mipmapped sources were excluded from P21–P29, not forever: P32 adds base-level RGBA8 KTX2 decoding/external codec interfaces, and P42 approves native compressed/mip uploads. Other profile exclusions above remain unchanged.

## 29. Save Slots and Scene Snapshots (P30)

- `game.saves` is a `SaveManager` over an injectable `SaveStorage` (`GameOptions.saveStorage`, `saveSchema`). The default is an isolated in-memory `MemoryStorage`, so nothing persists unless a browser backend is injected: `LocalStorageBackend(namespace)` or `IndexedDBStorage(namespace, database)`. Backends are async, namespace-scoped (`clear()` never touches another namespace) and reject values over `storageLimits.maxBytes` (2 MiB, `src/data/storage.ts`) with `StorageError('size')`. Quota failures become `StorageError('quota')`, unavailable IndexedDB `'unavailable'`, other failures `'io'`.
- `save(slot, data, playTime?)` accepts only plain JSON: NaN/Infinity, functions, symbols, bigint, `undefined`, Dates, class instances, cycles and sparse arrays are rejected with `StorageError('invalid')` instead of being silently coerced. The stored envelope holds the record (`version`, `data`, `metadata.savedAt/playTime`) plus a non-cryptographic FNV-1a checksum; it detects accidental corruption, not tampering.
- `load(slot)` returns `{status:'missing'}`, `{status:'loaded', record}` or `{status:'corrupt', raw, error}`. Corrupt, future-version, checksum-mismatching or schema-invalid payloads are reported with the original text preserved and never deleted or overwritten. Older versions run `SaveSchema.migrate(fromVersion, data)` once per version step in order (the stored payload is not rewritten until the next `save`); `validate(data)` runs after migration.
- `Serializer(scene)` is an explicit, opt-in registry: `register(id, object, state?)` binds a stable id to a GameObject in that Scene (default `gameObjectState` captures local position/rotation/scale/pivot/skew, visibility, opacity, `RigidBody2D` velocity and `Text2D.text`; pass a `Serializable` for custom state). `capture()` returns a detached `SceneSnapshot` (JSON-safe); `restore(snapshot, 'ignore' | 'error')` validates the whole snapshot first and reports `{restored, unknown, missing}`; `'error'` throws before applying anything if ids mismatch. It never creates objects, components, assets or scenes, so the game must rebuild the Scene before restoring. `isSceneSnapshot(value)` narrows loaded JSON.
- Not covered: encryption, cloud sync, cross-tab locking, automatic reflection of arbitrary objects, and snapshotting of GPU/asset resources.
- `game.i18n` (`GameOptions.i18n`, class `I18n`, an `EventTarget`) keeps per-locale message tables. Nested tables flatten to dotted keys (`menu.start`); a table whose keys are all `Intl.PluralRules` categories with an `other` string is a plural message (so a nested table consisting only of such keys is not expressible). Lookup walks the active locale's parents (`zh-Hant-TW` → `zh-Hant` → `zh`), then each `fallback` locale and its parents. `{name}` interpolates `params`; numbers are formatted with `Intl.NumberFormat` for the active locale; `{{` and `}}` are literal braces; a missing parameter throws `I18nError`. Plural messages require a finite numeric `count`. Missing keys return the key (default), throw (`missing: 'error'`) or call a function. `formatNumber`/`formatDate` wrap `Intl`; locale tags are canonicalized and invalid tags throw.
- `setLocale()` dispatches `localechange` (`detail: {locale, previous}`) only on a real change and refreshes every `bindText(text2d, key, params)` binding. A binding re-rasterizes through `Text2D.setText` (so the latest-wins Text2D rules apply), logs failures through `logger`, unbinds itself when the Text2D is destroyed, and `Game.destroy()` drops all bindings. Dynamic text that is not a single key (such as a status line) must be re-rendered by the caller on `localechange`. Message data is not loaded from files; load JSON yourself and call `addMessages`.

## 30. glTF Compression and KTX2 (P32)

- `EXT_meshopt_compression` is decoded by `decodeMeshopt(target, count, stride, source, mode, filter?)` (also exported): a from-scratch implementation of the meshoptimizer vertex codec (versions 0 and 1), triangle and index-sequence codecs, and the `OCTAHEDRAL`, `QUATERNION`, `EXPONENTIAL` and `COLOR` filters. Every read is bounds-checked against the compressed input, output is written only into a target sized `count × stride`, and a malformed stream throws `AssetError`. `GLTFLoader` decodes compressed `bufferViews` while parsing, ignoring their uncompressed-fallback `buffer`/`byteOffset`. A buffer with `EXT_meshopt_compression.fallback: true` is never fetched; an uncompressed view that points to it is rejected. The extension is therefore accepted as `extensionsRequired`. Decoding is eager (also for unreferenced views) and counts against `modelLimits.decodedBytes`.
- `KHR_draco_mesh_compression` needs a decoder you supply: `GLTFLoadOptions.dracoDecoder({data, attributes})` receives the compressed bytes and the semantic → Draco attribute id map and returns `{indices?, attributes}` with one array per semantic, in the accessor's logical space (dequantized floats; normalized floats for normalized integer accessors). The loader checks lengths against the accessors and finite values, then uses them instead of the accessor's `bufferView`. XYZ.js bundles no Draco WebAssembly. Without a decoder the extension is rejected when required; when it is only "used", a primitive loads only if its `POSITION` accessor has an uncompressed fallback `bufferView`, so zeros are never rendered silently.
- Default KTX2: `parseKTX2(bytes)` validates header, descriptors and level ranges. `decodeKTX2(bytes, transcoder?, signal?)` returns base RGBA8; plain uncompressed `R8G8B8(A8)_UNORM/SRGB` with no or bounded ZLIB supercompression is decoded internally. Basis/GPU block formats/Zstandard require an external RGBA8 transcoder. Only plain 2D is supported, and additional mips are ignored by this default path. GLTFLoader recognizes KTX2 bytes/MIME. `KHR_texture_basisu` selects its extension source when `ktx2Transcoder` or `nativeTextures` is provided; otherwise the regular source is used when available. Native opt-in has a separate callback and preserves mips (section 42).
- The preceding base-RGBA8 behavior is the default decoded-image profile, not the native opt-in restriction. P42 adds `decodeKTX2Native` and `GLTFLoadOptions.nativeTextures` (section 42). Quaternion filter output may differ by one least-significant step from C++; external Draco/Basis decoder quality and speed remain the caller's responsibility.

## 31. Gestures, Gamepad Mappings/Rumble and Audio Sprites/Streams/Pause (P33)

- `game.input.gestures` (`GestureRecognizer`, an `EventTarget`) observes the pointer stream and emits `CustomEvent<GestureDetail>` for `tap`, `doubletap`, `longpress`, `swipe`, `pan`, `pinch`, `rotate`; `on(type, listener)` returns an unsubscribe function. It never consumes samples or changes Scene pointer routing. Detail: `phase` (`start`/`change`/`end`/`cancel`; discrete gestures report `end` only), `pointerIds`, `pointerType`, `center`, `translation`, `velocity` (px/s), `direction` (swipe, dominant axis), `scale` (pinch) and `rotation` (radians, unwrapped across ±π). Thresholds are `gestureDefaults` in `src/data/input.ts` (tap slop 10 px / 300 ms, double tap 300 ms / 30 px, long press 500 ms, swipe ≥ 40 px, ≤ 500 ms, ≥ 300 px/s, pan 8 px, pinch 5 %, rotate 0.1 rad) and can be overridden per recognizer. A tap is always reported; `doubletap` follows the second tap. `longpress` is promoted from the per-frame update, so it only fires while the Game runs. Only the first two simultaneous pointers are tracked, mouse uses the primary button, a second pointer cancels a pan in progress, and the pointer that remains after a pinch never becomes a tap. Page hide/blur/pause resets and cancels in-flight gestures.
- `GamepadState.addMapping({match, buttons?, triggerAxes?, axes?})` lets a non-standard pad be read through your own raw-index → standard-name table (`match`: case-insensitive substring or RegExp of `pad.id`; later registrations win; the function returned removes it). Without a matching mapping a non-standard pad is still ignored, and standard pads are never remapped. Unlisted outputs read neutral. XYZ.js ships no device database, so every mapping must be verified on the real device. `gamepad.mapping` reports the profile in use.
- `gamepad.rumble({duration, strong, weak, startDelay})` plays a dual-rumble effect through `vibrationActuator.playEffect` (Chromium) or the legacy `hapticActuators[0].pulse` (older Firefox) and resolves `true` only when the effect completed (`false`: no pad/actuator, preempted or refused); `stopRumble()` calls `reset()`. Parameters outside 0..5000 ms / 0..1 throw `RangeError`.
- Audio sprites: `SampleAudioAsset.defineSprites({name: {start, end}})` names sections (seconds, up to 1,024) of one decoded buffer; `playSprite(name, options)` plays only that section (looping loops inside it, the position stays within it, pause/seek/rate work, ranges beyond the decoded duration are rejected at play time). `SamplePlayOptions.region` is the underlying option.
- Streaming: `audio.stream(url, {channel, loop, volume, playbackRate, startTime, autoplay, crossOrigin, signal, scene, persistent})` plays a long file through an `HTMLAudioElement` wired into the channel bus, so it starts before the download ends and is never decoded into memory. `AudioStream` has `play()`, `pause()`, `seek()`, `stop()`, `state`, `position`, `duration`, `loop`, `volume`, `playbackRate` and `ended`/`error` events. It needs an unlocked context like samples, counts toward `gameplayAssetLimits.samplePlaybacks`, follows Scene ownership and `AudioManager.destroy()`. Cross-origin URLs default to `crossOrigin='anonymous'` and need CORS headers, otherwise Web Audio receives silence. Streams are not sample-accurate, loops may have a gap, and seeking needs a range-capable server.
- Pause policy: `audio.pause(reason = 'user')` / `audio.resume(reason)` / `audio.paused` freeze audio until every reason has been resumed. OPM tracks are silenced and their timeline stops, continuing at the next note without replaying the one that was sounding; sample and stream playbacks pause at their position and resume together (ones the app had paused itself stay paused), and playbacks created while paused wait for the resume. `GameOptions.audioPause = {onPause, onHidden}` (both default false, so existing behaviour is unchanged) ties it to `game.pause()`/`resume()` and to page visibility.

## 32. Animation Blending, State Machine, Tween and Timeline (P34)

- `AnimationAction` gains `weight` (0–1), `fadeIn(seconds)`, `fadeOut(seconds)`, `crossFadeTo(other, seconds)`, `loopMode` (`'once' | 'repeat' | 'pingpong'`; the `loop` boolean remains a switch between `repeat` and `once`), `normalizedTime`, `effectiveWeight` (weight × fade factor), and `on('loop' | 'finished', listener)`. Assigning `time` seeks; the next `update` samples there. Actions are layered in insertion order: each action samples over the pose the earlier ones left, scaled by its effective weight (translation, scale and morph weights by linear mix, rotations by shortest-path normalized lerp), so weight 1 replaces — the previous "last action wins" behaviour — and partial weights blend. A first layer below weight 1 blends over the pose the target already holds, so fading in a lone action starts from the current pose and fading it out freezes the pose rather than returning to a rest pose.
- `crossFadeTo(other, d)` raises `other` to the top layer and fades it in over this action, which keeps playing at full weight underneath and stops when the fade completes (a direct straight mix; `d = 0` switches immediately). A fade-out that reaches zero stops the action and resets its time.
- `new AnimationStateMachine(mixer, {states, transitions, initial, parameters, triggers})` (for example `scene.animations`) registers with the mixer and is evaluated before every `update`, so no extra call is needed. States name a clip plus `loop`/`speed`; parameters are numbers or booleans whose type is fixed by the initial value (`setParameter`, `parameter`); triggers are one-shot (`trigger(name)` arms it until a transition consumes it). Transitions are tried in order from the current state (or `*`); every given condition must hold: `when(parameters)`, `trigger`, and `exitTime` (fraction of the source clip). A transition with none of these waits for a non-looping source to finish. `duration` is the cross-fade (default 0.2 s). Transitions are interruptible: the current state is always the destination of the latest fade. `setState(name, fade)` forces a state, `statechange` events carry `{from, to}`, and `destroy()` detaches it. Construction validates unknown states, triggers, ranges and unconditional transitions from looping states.
- `Tween.to(target, values, options)` / `Tween.from(...)` animate finite numeric properties of any object, including nested paths such as `'position.x'` (validated at construction). Options: `duration`, `delay`, `easing` (an `Easings` name or function), `repeat` (integer or `Infinity`), `yoyo`, `onStart`/`onUpdate`/`onComplete`. Start values are read when the tween first runs, so chained tweens continue from where the previous one ended; `reset()`/`stop()` restore the values the properties had before the first run. A tween whose target reports `destroyed === true` ends quietly.
- `Timeline` places `Tween`s (or nested timelines) with `add(item, at | label, offset)`, `then(item, gap)`, `label(name, at)` and `call(callback, at)`, and supports `play`, `pause`, `stop`, `seek`, `timeScale`, `repeat` and `onComplete`. Scrubbing with `seek` renders state only: callbacks run only when playback passes them, once per pass. Items the playhead is before are restored (latest first). A timeline cannot contain an endlessly repeating item.
- `scene.tweens` (`TweenGroup`) starts and advances tweens and timelines with scene time right after `scene.timers`, drops finished items, is cleared by `clear()` without finishing them and is destroyed with the Scene. `tweens.to/from(...)` are shortcuts. The 2D `Actions` API is unchanged and remains the choice for sprite sequences; Tween/Timeline target arbitrary properties.
- Historical P34 layering is order-dependent, not a normalized weighted average, and state machines remain flat (no sub-state machines). P42 now implements explicit masks/additive layers, blend trees and two-bone IK as bounded profiles in section 42; these additions do not imply full animation-system parity or completed integration acceptance.

## 33. Tooling: DebugOverlay, Example Smoke, Release Workflow, Tree Shaking, Benchmarks (P35 historical baseline)

- `DebugOverlay.attach(game, {position, interval, extra})` adds a plain DOM `<pre>` over the canvas (`aria-hidden`, no pointer events) with wall-clock fps and ms/frame (from frame counts over real time, never from the clamped simulation delta), backend, state, logical and backing canvas size, the renderer's last-frame 3D counters, collider and tween counts, audio state and active pointers. `extra()` appends your own lines; `visible` toggles it; `destroy()` removes it, and it removes itself when the Game is destroyed. It refreshes on a timer (default 250 ms, minimum 16) and is not drawn by the engine. `formatDebugSample` is the pure formatter. `PhysicsWorld2D.colliderCount` was added for it.
- `pnpm smoke:examples` (`scripts/smoke-examples.mjs`, devDependency `playwright-core` 1.63.0 which does not download browsers) starts Vite, opens every example for every renderer listed in the gallery metadata and fails a page on console errors, page errors, unhandled rejections, or a canvas whose downscaled 64×64 readback is a single colour. `--browser chromium|firefox|webkit`, `--example <slug>`, `--renderer <name>`, `--port`. Chromium is taken from Playwright's cache or from `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. The browser's own `/favicon.ico` request is ignored; `Canvas2D has no 3D` on a forced canvas2d 3D example is an allowed message. This is a smoke check of "loads and draws without errors", not a visual or performance comparison.
- `.github/workflows/release.yml` runs on `v*` tags: frozen install, typecheck, lint, test, build, `pnpm pack`, `SHA256SUMS` and `gh release create --verify-tag --generate-notes` with `contents: write` permission and the same commit-pinned actions as CI. It has been parsed and its pack/checksum steps run locally, but GitHub has not executed it.
- `package.json` declares `"sideEffects": false`, and `pnpm check:tree-shaking` (`scripts/check-tree-shaking.mjs`) bundles `import { Vector2 }` and `import * as XYZ` from `src/index.ts` with Vite and requires the first to stay under 4,096 bytes (currently 712 bytes against 748,561 bytes for the whole API; before the flag it was 41,535 bytes). The flag is valid only while no module has import-time effects; the script fails when one is introduced. OPM is loaded dynamically and is not part of this measurement.
- `benchmarks/physics2d`, `benchmarks/particles2d`, `benchmarks/3d` and the existing `benchmarks/sprites` share `benchmarks/measurement.ts`: 120 warmup + 600 measured frames, fixed 1/60 s simulation per frame, 1280×720, DPR 1. Results keep display-paced RAF intervals (`fps`, p50/p95/max), CPU submit time (`beginFrame`/`render`/`endFrame`, not GPU completion) and the simulation/update time as separate figures, plus last-frame `renderStats` (3D only). The tab must stay visible; a hidden tab aborts the run.
- `pnpm docs:api` runs TypeDoc 0.28.20 (its peer range includes TypeScript 6.0.x) over `src/index.ts` with `typedoc.json` and writes the API reference to `docs/api/` (ignored by git, prettier and eslint; about 11 MB; no warnings at the time of writing). It is not published anywhere.
- Not provided: a CI job for the smoke script or the API docs, GPU timing, memory/GC measurement.
- The P35 absence of smoke CI and 3D-only debug/benchmark counters is historical. P40 expands render metrics/DebugOverlay and deep browser regression/CI; the exercised Chromium 153 evidence is in ACCEPTANCE. A workflow file is not a successful hosted CI run.

## 34. 3D Helper Objects: LOD, Billboard, Line3D, Text3D (P36)

- `CameraDependent3D` (`updateForCamera(camera)`) marks objects that need the final 3D camera pose. The Scene calls it once per frame for every registered, world-visible such object after `physics`, particles and 2D camera behaviours, immediately before rendering (`isCameraDependent` is the type guard, so user classes can opt in).
- `LOD` is a `Group` whose children are levels: `addLevel(object, distance)` (levels are kept sorted; the child is hidden until selected). Each frame the level with the largest `distance` not exceeding the distance between the LOD's world position and the camera is the only visible one; `level` reports its index. `hysteresis` (world units, default 0) keeps the current level until the camera is that far beyond the boundary being crossed, to avoid flicker. Distance is to the LOD's origin, not a bounding volume.
- `Billboard` is a `Mesh` on a shared unit quad with `width`/`height` (the quad's scale) and `mode` `'spherical'` (fully faces the camera) or `'cylindrical'` (turns around the Y axis only). It overwrites its own rotation every frame from its world position, so parent rotation and non-uniform parent scale are not compensated; keep billboards in the Scene root or under translation-only groups. Orthographic cameras are faced against the view direction.
- `Line3D(points, {material, width, closed})` draws a polyline as camera-facing ribbons: one quad (4 vertices) per segment, rebuilt each frame in the object's local space, with `setPoint`/`point`/`pointCount`; `width` is in local units across the ribbon and may be changed. The point count is fixed at construction. Segments are independent quads, so very sharp corners show a small gap or overlap, there is no per-vertex width or color and no round joins. UVs run 0–1 across the ribbon and along the whole line.
- `Text3D.create(text, {fontSize, fontFamily, color, height, padding, mode, position…})` rasterizes text into an owned Texture displayed on a Billboard. Width follows text aspect ratio, height is in world units, text is fixed at creation, and destroy releases its texture. Like Sprite3D, it opts into the transparent pass; per-object sorted or weighted approximation applies.
- Limits: no LOD cross-fade, no screen-size based switching, no depth-aware thick line caps, no multi-line text layout or right-to-left shaping beyond what the browser's `fillText` gives, and these helpers are not rendered by Canvas2D (no 3D there).

### Sprite3D (P36c)

`new Sprite3D({texture, source?, width?, height?, mode?, color?, opacity?, position…})`
creates an unlit, camera-facing atlas image. It borrows a static `Texture` and owns its quad;
destroying the sprite does not destroy the texture. `source` is an integer, in-bounds
physical-pixel rectangle, also obtainable from `SpriteSheet.getFrame()`. Width defaults to
one world unit; omitted height follows the initial region's aspect ratio.
`setSource(rect)` changes UVs without cropping a bitmap or changing world size;
`setSource()` restores the full texture. Invalid frames leave the previous frame intact.
Linear filtering across atlas edges requires padded frames. Facing modes and the
root/translation-only-parent restriction match Billboard; shadows default off.
CanvasTexture2D/TextureView2D and Canvas2D rendering are not supported by this 3D helper.

The objects3d gallery's **Next sprite frame** button cycles the four atlas regions.

### Decal (P36d)

`new Decal({target, material, position, rotation?, size, normalOffset?, cullBackfaces?})`
clips the receiver's actual triangles against six planes of an oriented projector box.
`position` is its world-space center, `rotation` is XYZ Euler radians or a Quaternion,
and `size` is world-space width/height/depth; local +Z points out of the receiver.
UVs use projector X/Y, with V downward. Backfaces are omitted unless `cullBackfaces: false`.
An empty intersection throws RangeError without attaching a child; it never creates a
substitute quad. Singular receiver transforms are rejected.

The result is automatically attached to `target`, so it follows the receiver hierarchy
and is destroyed with it. Geometry and UVs are baked once; vertex deformation or changing
the projector requires a new decal. Rotated/nonuniform parents are supported at creation;
the default 0.001 world-unit normal lift uses inverse-transpose normals and is baked too,
so later receiver scaling also scales that lift. The decal borrows its TextureMaterial
(including PBR subclasses) and textures, does not cast shadows, and may receive shadows.
Instanced, skinned and morph receivers are rejected rather than silently detaching the
decal from their deformation. Canvas2D remains 2D-only.

The objects3d gallery's **Hide decals** button toggles the projected patch on every LOD.

### Vertex and Instance Colors (P36b)

`GeometryData.colors` and `geometry.setColors(colors)` accept linear RGB or RGBA per vertex.
Geometry copies the input into RGBA storage, supplying alpha 1 for RGB; `setColors(undefined)`
removes it. RGB components are finite and nonnegative; alpha is in [0, 1]. If you edit
`geometry.colors` in place, call `markUpdated()` to refresh GPU uploads.

`InstancedMesh.setColorAt(index, r, g, b)` sets linear RGB multipliers per instance;
`getColorAt(index, out)` reads them into a reusable tuple. Unset instances are white, and
storage is allocated only when a color is first set. Matrix and color uploads are versioned
independently. Use `setColorAt` rather than editing `colors` directly.

Both GPU backends multiply vertex RGB, instance RGB and material tint into the base color.
Vertex alpha also affects blending and PBR alpha masks, including shadow masks; OPAQUE PBR
materials still ignore alpha as required by glTF. Color attributes do not affect emissive light.
glTF `COLOR_0` supports float and normalized unsigned-byte/unsigned-short VEC3/VEC4 accessors,
including alpha, and skinned geometry retains its colors. `COLOR_1` remains unsupported.
The instancing example now combines per-instance brightness and vertex gradients. Canvas2D
remains 2D-only; these additions do not add a 3D software renderer.

## 35. Point, Spot and Cascaded Shadows (P37)

`scene.shadows.enabled` enables the depth atlas on either GPU backend. `mapSize` is
the resolution **per tile**, not the whole atlas; active tiles occupy a square grid.
The device's maximum texture/framebuffer dimensions still apply. Eight point lights,
eight spot lights and four directional cascades need at most 60 tiles. Each point
light draws every caster six times; use shadow-casting lights sparingly.

Point and spot lights accept `castShadow` (default false), `shadowNear` (default 0.1)
and `shadowFar` (default 50). A positive `range` replaces the shadow far plane.
The near plane must be positive and smaller than the far plane. A shadow-casting
spot requires `outerAngle < Math.PI / 2`. Point shadows select one of six perspective
faces; spot shadows use the light's outer cone. They affect only that light's direct
diffuse/specular contribution, not ambient or environment lighting.

Directional shadows retain the fixed `extent`/`target` camera by default.
Set `scene.shadows.cascades` to 2–4 to fit slices of the active perspective or
orthographic camera. `cascadeDistance` (default 100) limits their view depth;
`cascadeLambda` (default 0.5, range 0–1) mixes uniform and logarithmic splits.
Each cascade uses a bounding sphere and texel-snapped projection translation.
Receivers past the final split are unshadowed. Transitions are hard, without blending.

All tiles use clamped 3×3 depth PCF with the existing normalized depth `bias`.
`Mesh.castShadow` and `receiveShadow`, instancing, deformation and alpha masks
continue to apply. There is no slope-scaled bias, cube-face seam filtering, temporal
stabilization across changing camera orientations, cached static shadows, or
Canvas2D 3D rendering. `/examples/shadows3d/` exposes each shadow mode and both flags.

## 36. Cubemap Environments (P38a)

`EnvironmentMap.fromCubemap(size, faces, channels = 3)` accepts six equal square
linear RGB/RGBA arrays in **+X, −X, +Y, −Y, +Z, −Z** order (`CubemapFaces`).
Rows run top to bottom. The face U/V directions are respectively
−Z/−Y, +Z/−Y, +X/+Z, +X/−Z, +X/−Y and −X/−Y.
Alpha is ignored. Radiance must be finite and nonnegative.
`fromCubemapImageData(faces)` accepts six equal square RGBA ImageData-like objects,
decodes 8-bit sRGB to linear radiance, and also ignores alpha.

Construction bilinearly converts the faces to the existing equirectangular
representation at `4 * size` × `2 * size`, then performs the same SH and roughness
mip filtering as other environments. This is an input-format conversion, **not a
native GPU cube texture**; faces clamp at their edges during conversion.
The existing environment size limits apply to the converted image. Inputs are not
retained, and uploads, cache eviction and `destroy()` use the existing lifecycle.
Both background and diffuse/specular IBL accept the resulting map. The PBR example
has a six-face cubemap switch; sharply colored faces make orientation visible.

### Local Reflection Probes (P38d)

`scene.reflectionProbes` contains borrowed `ReflectionProbe` objects:

```ts
scene.reflectionProbes.push(
  new ReflectionProbe({
    environment: roomRadiance,
    position: [0, 1, 0],
    min: [-3, 0, -3],
    max: [3, 3, 3],
  }),
);
```

`position` is the capture position; `min`/`max` are an axis-aligned **world-space**
influence box. They accept tuples or Vector3 at construction and remain mutable
Vector3 fields. Bounds must have positive extent and contain the capture position.
`enabled` and `boxProjection` default to true; `intensity` defaults to 1 and is
independent of the global `environmentIntensity`. Invalid mutations fail rendering
validation rather than uploading invalid uniforms.

For each Mesh, its world origin selects the nearest enabled, live-map probe whose
inclusive box contains that origin; equal distances use array order. Outside all
boxes, or when a map is destroyed, the global environment is used. Selection applies
to the whole mesh, including all instances, without spatial blending. Probe radiance
supplies diffuse SH and specular, clearcoat and sheen IBL, not the sky background.
Box projection intersects the reflected ray with the box and redirects sampling from
the capture position; fragments outside the box keep the uncorrected direction.

These are **baked radiance probes**, not automatic scene capture or screen-space
reflections. Supply an EnvironmentMap from a captured cubemap, HDR image or other
existing constructor. Maps remain immutable and borrowed: replacing/removing probes
or destroying the Scene does not destroy them. Uploads reuse the environment cache;
no additional material texture unit is consumed. WebGPU and WebGL2 support probes;
Canvas2D does not render 3D. The PBR example can enable a local box over its right
two columns while retaining the global sky.

### FXAA (P38b)

With `scene.postProcessing.enabled = true`, `scene.postProcessing.fxaa = true`
adds a fullscreen FXAA pass after HDR exposure/bloom/tone mapping and sRGB encoding,
before `effects3D` and the 2D overlay. It filters high-contrast edges in the resolved
image, so it can complement MSAA or run when `GameOptions.antialias` is false.
The default is false; algorithm thresholds and the maximum 8-pixel span live in
`src/data/rendering.ts`. Low-contrast regions keep their center sample.

Enabling it lazily allocates one output-sized color target; disabling it, disabling
postprocessing, resizing or destroying releases that target. It is ordinary
single-frame spatial AA, not temporal AA, and may soften fine textures. It does
not antialias the later 2D UI and requires the existing HDR postprocessing capability.

### SSAO and Depth of Field (P38c)

These effects require `scene.postProcessing.enabled`. The main scene depth is
sampleable: WebGPU takes the closest MSAA depth sample, while WebGL2 uses a depth
texture on its single-sample HDR target. View-depth reconstruction supports both
perspective and orthographic cameras, including orthographic near = 0.

- `ssao` enables deterministic, 16-tap screen-space ambient occlusion. `ssaoRadius`
  is a positive world-space sampling radius (default 0.75), `ssaoStrength` is 0–2
  (default 1), and `ssaoBias` is a nonnegative world-space elevation threshold
  (default 0.02). Normals are reconstructed from nearby depth, choosing the shorter
  depth derivative at silhouettes. This **post** AO multiplies the entire shaded
  3D color, not just the material's ambient term. Sky and out-of-screen samples do
  not occlude. There is no temporal accumulation, denoising or hidden-geometry AO.
- `depthOfField` enables a 24-tap disk defocus in linear HDR color.
  `dofFocusDistance` is positive camera **view depth** (default 10), not distance
  from the eye; `dofFocusRange` (positive, default 2) is the depth difference over
  which blur grows to `dofBlurRadius` (backing pixels, default 8, range 0–64).
  Focused pixels remain unchanged; sharp foreground samples are excluded from
  background blur. This is an approximate screen-space effect, not a physical
  thin lens: it cannot reconstruct occluded backgrounds or correctly composite
  all near/far bokeh layers. Large blur radii can show sparse-sampling artifacts.

Defocus and AO run before bloom/tone mapping; FXAA and `effects3D` run afterward,
and the later 2D overlay remains unaffected. Kernels are baked once, not evaluated
with trigonometry per fragment. Disabled effects skip their depth sampling. The PBR
example exposes both effects and a focus-depth slider. Transparent layers use the
depth already written by the existing mesh pass; there is no separate transparent
depth solution. GPU cost rises with the enabled kernels and MSAA sample count.

## 37. IOR and Specular Materials (P39a)

`PBRMaterial` adds `ior` (default 1.5), `specular` (0–1, default 1), and
`specularColor` (linear RGB, nonnegative, default white; values above 1 are valid).
IOR is either at least 1 or exactly 0. The latter is the glTF compatibility mode
with angle-independent dielectric Fresnel, not a physical index of refraction.
IOR 1 has zero normal-incidence reflectance but still reflects at grazing angles.

`specularTexture` uses **linear alpha**, while `specularColorTexture` uses **sRGB
RGB**. Their respective `specularSampler` / `specularColorSampler` options follow
the existing per-slot sampling contract. All textures are borrowed. Both WebGPU
and WebGL2 apply the factors and maps to direct lighting and specular IBL:
normal-incidence reflectance is `min(specularColor × ((ior-1)/(ior+1))², 1) × specular`.
Zero specular strength removes dielectric reflection including grazing response;
metallic reflection is unaffected. Diffuse energy uses the maximum RGB dielectric
reflectance, avoiding complementary-color diffuse tint.

GLTFLoader accepts required `KHR_materials_ior` and `KHR_materials_specular`,
including both texture slots and samplers. They cannot coexist with
`KHR_materials_unlit`. As with other slots, all material textures must use UV0 and
agree on their baked `KHR_texture_transform`; incompatible transforms reject.
The existing approximate environment prefilter / analytic split-sum BRDF remains;
this is not a reference-path-tracer accuracy claim. See the
[IOR specification](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_ior)
and [specular specification](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_specular).

### Clearcoat (P39b)

`clearcoat` and `clearcoatRoughness` are 0–1, default 0. `clearcoatTexture`
multiplies intensity by linear R, and `clearcoatRoughnessTexture` multiplies
roughness by linear G. `clearcoatNormalTexture` is a separate tangent-space normal:
without it the layer uses geometric normals, never the base normal map.
`clearcoatNormalScale` defaults to 1 and may be signed. All three slots have their
own matching `*Sampler` options and borrow their textures.

The fixed-IOR 1.5 microfacet layer reflects directional, point, spot and environment
lighting above the base material, including metallic surfaces. View-normal Fresnel
attenuates the underlying lighting **and emission**. Intensity 0 skips the layer.
The numerical roughness floor is 0.04, as in the base BRDF; this is an infinitely
thin coat, not refraction or inter-layer scattering. Independent normals use the
existing UV0 derivative tangent frame, not imported MikkTSpace tangents.

GLTFLoader accepts required `KHR_materials_clearcoat`, its factors, all three maps,
normal scale and samplers, with the existing shared-transform restriction.
Combining it with unlit rejects. Layering follows the non-normative simple Fresnel
model in the [clearcoat specification](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_clearcoat);
the environment contribution retains the existing analytic split-sum approximation.

### Sheen (P39c)

`sheenColor` is linear RGB in 0–1 (default black, disabling sheen) and
`sheenRoughness` is 0–1 (default 0; the numerical BRDF floor is 0.04).
`sheenColorTexture` multiplies color by decoded sRGB RGB;
`sheenRoughnessTexture` multiplies roughness by linear alpha. Matching
`sheenColorSampler` / `sheenRoughnessSampler` follow the borrowed-slot contract.
GLTFLoader accepts required `KHR_materials_sheen`, its factors and both maps,
rejecting unlit combinations and incompatible per-slot transforms.

Both backends use Charlie distribution and visibility for direct sheen. The
view-only albedo-scaling approximation attenuates base direct/indirect lighting,
not emission; clearcoat is applied above sheen and emission. A baked 32×32
directional-albedo table is integrated with 128 elevation × 256 azimuth samples
per entry, bounded to 0–1, bilinearly interpolated and uploaded once as a 4 KiB
uniform buffer, not an extra texture slot. Regenerate it with
`node scripts/generate-sheen-lut.mjs`, then format `src/data/sheen.ts`.
No quadrature or table uploads run per frame.

Sheen IBL uses the directional albedo and the existing roughness-filtered
environment; that filter is not a dedicated Charlie convolution. This and the
finite lookup resolution are approximations, not a strict energy-conservation or
reference-renderer guarantee. Equations and layering are described in the
[sheen specification](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_sheen).

### Transmission and Volume (P39d)

`transmission` is 0–1 (default 0); `transmissionTexture` multiplies it by linear
R. It replaces diffuse response, not specular reflection or alpha coverage,
and has no effect on a fully metallic base. `thickness` is finite and
nonnegative in mesh-local units (default 0); `thicknessTexture` multiplies it by
linear G. Their `transmissionSampler` / `thicknessSampler` follow the borrowed
slot contract. `attenuationColor` is linear RGB in 0–1 (default white);
`attenuationDistance` is positive in world units (default `Infinity`, disabling
absorption). Beer–Lambert attenuation is `color ** (worldLength / distance)`.

Zero thickness is a thin wall without macroscopic refraction. A positive
thickness denotes a closed volume: back faces are discarded even when
`doubleSided` is true. A Snell ray uses the base IOR; its local thickness is
converted to world length with the inverse object-and-instance transform,
including nonuniform scale. Its projected endpoint samples the opaque scene.
Rough transmission uses a nine-tap screen-space filter, with blur reducing to
zero at IOR 1; this is not a reference GGX BTDF convolution.

Visible transmission lazily enables a linear HDR capture, even with
`postProcessing.enabled = false`. Sky and opaque nontransmitting objects render
first; then transmitting and alpha-blended objects render against that snapshot.
Depth survives the split; WebGPU stores and reloads its MSAA attachment, while
WebGL2 retains the existing single-sample HDR target. Disabled postprocessing
uses a neutral sRGB resolve, not configured exposure, tone mapping or effects.
The capture resizes with the canvas and is released when no longer needed.
WebGL2 requires `EXT_color_buffer_float`; unavailable HDR support rejects rather
than silently rendering an opaque substitute.
Two optical maps of arbitrary, independent dimensions share a packed two-layer
array. Native texels are copied once without resampling; metadata preserves
nearest/linear min/mag filtering and clamp/repeat/mirror addressing. The material
and scene together remain within the 16 sampled-texture minimum on both backends.

GLTFLoader accepts required transmission/volume extensions, factors, maps and
samplers with the existing UV0/shared-transform restriction. Volume requires
transmission; unlit combinations reject. Alpha mode remains independent.
See the [transmission](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_transmission)
and [volume](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_volume)
specifications.

This raster approximation sees opaque objects, not recursively transmitted or
alpha-blended layers. Offscreen samples clamp to the capture edge. It does not
ray-trace an exit surface, handle nested IOR/camera-inside total internal
reflection, scatter light, or cast colored/transmitted shadows; the existing
opaque shadow silhouettes remain.

## Weighted 3D Transparency

Set `scene.transparency = 'weighted'` to opt into weighted blended OIT; `'sorted'`
remains the default. WebGPU accumulates weighted linear color and revealage with
MRT; WebGL2 uses separate accumulation and revealage passes. Transparent fragments
test opaque depth but do not write depth. The result is composited into HDR before
tone mapping, effects3D and the unchanged 2D overlay. WebGL2 requires
`EXT_color_buffer_float`; requested unsupported rendering fails explicitly.

This is an approximation, not exact per-pixel sorting or depth peeling. Colors
can differ from sorted blending, half-float accumulation has finite range, and
many layers can lose precision. WebGPU retains 4× MSAA when enabled; WebGL2 uses
single-sample offscreen attachments. SSAO/DOF see opaque depth, not transparent
surfaces. Transmission still samples only the existing opaque snapshot, not
other transparent layers. Size-dependent OIT targets are released on resize,
disable/no scene, and destroy. Canvas2D remains 2D-only.

Use `new TextureMaterial({texture, transparent: true})` for alpha textures or
vertex colors at opacity one. Sprite3D/Text3D set this automatically. PBR uses
`alphaMode`, not that legacy flag. The objects3d example provides a weighted
toggle and insertion-order reversal; scoped verification is in ACCEPTANCE.

## 39. P40 2D Batching and Render Metrics (scoped acceptance)

GPU/GL batching merges adjacent compatible plain Sprite commands only, retaining source-local UVs, affine transforms, atlas trim/rotation/reflection, tint/opacity, anchors and roundPixels per instance. It does not texture-sort or change ordinary global stable z/equal-z insertion order/world→HUD. Material and tiling sprites, meshes, ParticleLayer and isolation commands separate plain-sprite runs; source, effective nearest/linear sampling and world/HUD boundaries split incompatible runs. ParticleLayer uses its own ordered active-slot runs and versioned uploads. Native shader ABI, isolation/masks/filters/blends, P19 immutable whole-frame captures and the 3D HDR/MSAA/OIT stages remain unchanged. Canvas2D uses native painting, not GPU instancing.

| Field                   | Meaning / reset boundary                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `drawCalls2D`           | Per-frame submitted native 2D draws/Canvas paint commands, including effect/composition quads or paints; not just Scene object count. |
| `instances2D`           | Per-frame instances submitted by those draws (including effect quads); Canvas paint counts are not GPU batch parity.                  |
| `renderPasses2D`        | Per-frame 2D target passes, including clear-only passes, local effects and composition.                                               |
| `uploadBytes`           | Per-frame bytes actually transferred to buffers/textures; numeric capacity-only allocation is not upload data.                        |
| `renderTargetBytes`     | Current resident attachment-byte estimate; persists across frame begin and falls on owned-target release.                             |
| `peakRenderTargetBytes` | Highest resident attachment estimate since that renderer's creation; persists across frame begin and target release.                  |

`FrameStats.begin()` resets per-frame counters but preserves resident/peak estimates. CPU estimates use attachment format/sample counts: RGBA8 4 bytes/pixel, RGBA16F 8, R8 1 and depth24plus/depth32float estimates 4. They include owned 2D targets/captures/effect attachments and tracked 3D depth/MSAA color/shadow/HDR/refraction/FXAA/weighted-OIT attachments; Canvas counts RGBA offscreen caches/scratch/captures/targets. Default framebuffer, driver allocation/alignment overhead, source texture residency, buffers and CPU decoder allocations are excluded, so this is not total resource memory. These are counters/estimates, **not GPU timers**, GPU completion, memory/GC telemetry or proof of a performance improvement. A no-Scene frame resets per-frame work; resident targets/captures remain accounted until release. Destroy releases owned targets; a replacement renderer has its own lifetime peak.

P41 budget/warmup estimates are separate from these counters; see section 41. P42 texture/skinning/physics/animation/navigation profiles passed the scoped acceptance recorded in [ACCEPTANCE](../ACCEPTANCE.md); [PLAN](../PLAN.md)/[DESIGN](../DESIGN.md) retain bounded contracts. No cross-browser certification is claimed.

## 41. P41 Authoring/Device Contracts

Scoped Chromium three-backend acceptance is recorded in [ACCEPTANCE](../ACCEPTANCE.md); historical evidence above is unchanged. The formal [authoring-lab](../examples/authoring-lab/) consumer uses the root API; typed examples are in [USAGE](USAGE.md#21-p41-authoringdevice-flow).

- **UI:** `UIRoot(game?, layout)` owns `focus: UIFocusManager`; `UIElement` accepts `UILayout`. Only UIElement children participate in retained screen-space row/column/overlay layout. Width/height accept finite bounded numbers, `'auto'`, `'fill'`; min/max, gap, padding (number or top/right/bottom/left tuple), align and justify are supported, not CSS flexbox parity. Async `UILabel.create(text, options)`, `UIButton.create`, `UICheckbox.create` and `UISlider.create` reuse engine visuals/unit raster; `setText` is async. Checkbox `checked` and slider `value` expose state; slider has finite increasing min/max and positive step. Controls emit `click`/`change`. DOM mirrors semantics/focus, never visuals. `focus.focus`, `move`, `pushModal`, `popModal` trap/restore eligible focus. Bound UI contexts activate only for live semantic focus/modal; actual widget pointer sources consume lower actions in the same frame, not all pointer activity globally.
  Live canvas pointer-down explicitly enters canvas focus and cancels the browser's later compatibility mouse focus; routed widget focus therefore survives touch taps and subsequent keyboard traversal.
- **Input:** `input.contexts.create(name, { bindings, priority, consume, gamepadIndex })` starts inactive. Use activate/deactivate/destroy/value/isDown/wasPressed/wasReleased/rebind/exportBindings/importBindings. Greater priority wins; latest activation breaks ties. Consumption reserves physical sources against lower contexts and legacy actions, never raw keyboard/pointer/gamepad polling. Held activation/unblocking does not manufacture press edges. `gamepadIndex` is actual browser Gamepad.index. ActionBinding additionally accepts `{ pointerButton }`, `{ wheel: 'x' | 'y' | 'z', direction: 1 | -1 }`, `{ gesture }`, `{ virtual, direction?: 1 | -1 }`; `input.virtual.set/value/reset` provides signed controls.
- **Residency:** Game options `resourceBudgets` separate `decodedTextureBytes`, `nativeTextureBytes`, `nativeGeometryBytes`. `assets.acquireTexture(url, { signal? })` returns a texture lease; release it after removing all borrowers. Legacy loadTexture pins until unload/destroy. `assets.residency` reports decoded CPU estimates; `graphics.residency` reports native estimates. `configureResidency`, `prepareGeometry`, `unloadGeometry`, `prepareResource`, `retainFrameResources` expose explicit native preparation/protection. Native LRU evicts only idle entries outside active/retained allocations; borrowed CPU resources survive eviction and can reprepare. Canvas native GPU residency is zero. Caller bitmaps, derivedCanvas, attachments, scratch, driver allocations and pipelines are excluded: this is not total VRAM, GC or a hard process-memory bound.
  `prepareResource(source, { signal? })` accepts `ResourcePreparationOptions`; cancellation releases an in-flight native preparation lease without destroying the borrowed CPU source. Recovery replays only still-registered resources and never revives a resource unloaded during preparation. Offscreen capture pins are scoped to submission, not asynchronous bitmap readback, and do not replace the last submitted main-frame resource set.
  Explicit `prepareGeometry` pins its allocation until `unloadGeometry`; use `prepareResource(geometry)` and release its returned lease to make that allocation eligible for idle LRU eviction.
- **Warmup:** `game.warmup(scene, { maxItems, maxMilliseconds, signal, onProgress })` returns a releaseable residency-protection lease, not ownership of borrowed CPU resources. Defaults are eight resources/four milliseconds per RAF chunk. Boundaries apply between resources; one item can exceed the time limit. Progress reports completed/total/ratio/chunks for a dependency snapshot, not later mutations. The previous-scene protection prelude is chunked separately and excluded from candidate progress. `setScene(next, { warmup })` initializes/prepares before atomic publication, protects old-scene allocations and rejects an insufficient combined budget without damaging its frame; candidate protection lasts for the published scene lifetime. Release manual leases explicitly.
  Pending warmups abort when the current scene is published/replaced or disposed. A completed `setScene` warmup does not cancel its own publication. Before admitting candidates, the chunked prelude restores and protects the visible current scene, including when warming that same scene after offscreen work evicted its idle allocations.
- **Content:** `defineFactory`/`FactoryRegistry` require explicit unknown-input parsers and injected services; create fresh detached owned prefab subtrees, claim them with `context.own` before fallible awaits. Abort/failure destroys new owned leaves, not borrowed service assets. No reflection/eval or automatic resource ownership. `parseContentScene(registry, unknown)` and `buildContentScene(registry, definition, services, { signal? })` preflight version-1 finite JSON, unique IDs, known kinds/options, parents and explicit reference aliases/dependencies before construction. Bounds: 4096 nodes, depth 32, 65536 values, 4096-character strings, 128-character keys/IDs. Build returns an unpublished new Scene plus typed `content.get(id)` and kind-checked `content.require(id, kind)`; publish with Game.setScene. Serializer registers explicit 2D content IDs only, not unnamed descendants or 3D objects.

## 42. P42 Native Rendering, Physics, Navigation and Animation Profiles

These profiles use the public root API and existing Scene clock/lifecycle. P42 passed scoped integration acceptance; native-render and complete playable-flow evidence are recorded in [ACCEPTANCE](../ACCEPTANCE.md), not inferred from exports.

### GPU skinning and exact queries

`SkinnedMesh` owns separate render bind-pose and exact-query geometries, while borrowing joints. `renderGeometry` is the bind-pose stream used by WebGPU/WebGL2 color and shadow passes; `geometry` is the lazy exact CPU mirror. Four nonnegative normalized influences and at most 256 joints form linear-blend skinning. `updateRenderDeformation()` computes `inverse(meshWorld) × jointWorld × inverseBind`, updates the `jointPalette`/`paletteVersion` only on changes, and updates bounds without skinning every vertex for joint motion. CPU morphing updates the bind stream before skinning.

Raycaster/exact queries call `updateDeformation()`/`updateSkin()` to refresh the CPU mirror only after deformation changed. Normal directions use determinant-sign-corrected cofactors of the blended matrix, normalized afterward, including mirrored/nonuniform transforms; this is not blending independent joint normals. Conservative local bounds union transformed per-joint influence boxes, then form a padded sphere. Morph changes rebuild influence boxes, including negative morph weights; joint changes update bounds even while outside the view, permitting frustum re-entry. Geometry uploads and palette uploads have separate versions; ordinary rendering does not upload CPU-skinned vertices each animated frame.

### Native texture payloads, formats and samplers

`NativeTexture2D({ format, width, height, levels })` extends Texture with `kind: 'native'` and no decoded `image`. It snapshots each supplied `Uint8Array`; materials borrow the source and do not destroy it. Levels are a nonempty contiguous prefix starting at zero, at most `floor(log2(max(width,height))) + 1`, with level dimensions `max(1,floor(base / 2**level))`. No missing mip is generated. Each level must match `nativeTextureLayout` exactly: row bytes `ceil(width/blockWidth) × blockBytes`, rows `ceil(height/blockHeight)`, total their product. Dimensions are safe positive integers up to 8192; one supplied chain is bounded to 32 MiB.

The format registry includes RGBA8 unorm/sRGB (1×1, 4 bytes); BC1/BC4 (4×4, 8 bytes), BC2/BC3/BC5/BC6H/BC7 (4×4, 16 bytes); ETC2 RGB/RGB-A1 and EAC R (4×4, 8 bytes), ETC2 RGBA and EAC RG (4×4, 16 bytes). Signed variants exist for BC4/5 and EAC, float/ufloat for BC6H, and sRGB variants for color formats. ASTC unorm/sRGB uses 16-byte blocks at 4×4, 5×4, 5×5, 6×5, 6×6, 8×5, 8×6, 8×8, 10×5, 10×6, 10×8, 10×10, 12×10 and 12×12. A registry entry is not universal device support.

Read `graphics.capabilities.supportedTextureFormats` and `maxTextureSize` on the actual backend. WebGPU lists formats enabled by device BC/ETC2/ASTC features and rejects compressed base dimensions not divisible by their block size; smaller mips use block-rounded upload extents. WebGL2 requires the matching S3TC/S3TC-sRGB, RGTC, BPTC, ETC or ASTC extension and advertised compressed-format enum. Canvas2D rejects native texture use rather than decoding or switching backend. Encoded sRGB payloads upload through their unorm twin because existing material shaders own RGB color conversion.

Native sampling uses only supplied levels, with LOD clamped to the chain; min/mag filtering and nearest/linear mip interpolation are independent. TextureMaterial uses its native mip chain; PBR slots accept explicit mip/LOD sampler settings. In glTF native opt-in, 9984/9985 select nearest mip, 9986/9987 linear mip, while 9728/9729 clamp maximum LOD to zero. Default decoded loading still maps mip filters to their base filter and supplies only level zero.

`decodeKTX2Native(bytes, transcoder?, signal?)` preserves every level of registry VkFormats with no supercompression or bounded ZLIB inflation. Other formats/Basis/Zstandard require a real `KTX2NativeTranscoder` returning exact native options with unchanged dimensions and level count; no codec is bundled and no silent RGBA decompression substitutes for native output. Only plain 2D is supported, not arrays/cubes/3D. `GLTFLoadOptions.nativeTextures: true` selects this path and `ktx2NativeTranscoder` supplies the callback; asset disposal owns loader-created textures. Default `decodeKTX2`/`ktx2Transcoder` retain their base-RGBA8 contract.

Native residency counts actual supplied payload bytes separately from decoded image estimates, with geometry/texture admission and idle LRU rules from section 41. Preparation leases, unload/reprepare and same-backend loss recovery borrow live CPU payloads; destroying a source prevents revival. GPU allocations, targets and palette resources belong to the renderer; recovery rebuilds them, not old target/snapshot handles. These accounting budgets do not cover every driver allocation, and support does not certify codec performance, FPS or other browsers.

### 3D dynamics and character movement

`Scene.physics3D` owns a `PhysicsWorld3D`; assign `Object3D.collider` and optional `Object3D.body` before `scene.add`. `SphereCollider3D`, `BoxCollider3D`, `CapsuleCollider3D` and two-sided `PlaneCollider3D` support reciprocal category/mask filtering and sensors. `RigidBody3D` has static/dynamic/kinematic types, mass, restitution, friction, linear/angular velocity, forces, impulses, sleep/wake and rotation locking. Finite primitive pairs use geometric narrowphase, box face/edge manifolds and iterative linear/angular impulses, not world-AABB response. Plane bodies are static. Dynamic/kinematic owners are roots with zero collider offset; orthogonal positive transforms are required, rounded shapes require uniform scale. Shear, reflection and singular transforms reject.

The default fixed step is 1/120 second with bounded substeps and reported `droppedTime`. Game advances 2D then 3D physics after user/system/object updates, before particles and final camera-dependent transforms. `world.enabled = false` freezes its accumulator and contacts without paused-time catch-up; caller-driven character/follower updates must also be gated. This is a gameplay pause, distinct from `Game.pause()` stopping the whole simulation/UI.

`raycast`, `overlap`, `sweepSphere` and `sweepCapsule` use transformed primitive geometry; queries can ignore an owner, filter category masks and opt into sensors. Stable `collisionstart`/`collisionend` details describe the other owner, world point and normal toward the receiver. Removal/destruction invalidates registrations and contacts. Attachment/hierarchy validation rolls back rejected changes.

`CharacterController3D(object, world, options?)` borrows a live registered upright root capsule with unit scale, zero offset and a kinematic body; it creates that body only when absent. `move(displacement)` performs bounded overlap recovery, conservative capsule sweep/slide, slope/ground probing, stepping and optional dynamic-body push. The caller supplies gravity/jump displacement and delta; yaw is allowed. Its result and contact views are reused until the next move: copy values that must survive. Destroy releases only a body created by that controller, never the borrowed object/world.

This is a bounded primitive gameplay profile: discrete rigid bodies can tunnel at high speed. It is not a general CCD/rotational-sweep solver, joint system, mesh/concave/compound collision engine or arbitrary-scale character controller.

### Deterministic pathfinding

`NavigationGrid2D({ columns, rows })` provides weighted A*, atomic `setCell`/`setCells`, revisions and immutable path results. Destination-cell cost applies; diagonal movement and corner cutting are explicit query options. `isPathCurrent` checks the recorded revision. The grid is bounded to 65,536 cells.

`NavigationGraph3D({ nodes, connections })` owns immutable finite waypoint/edge snapshots. IDs are explicit; edges have nonnegative total costs, including zero, and are bidirectional unless `directed`. A distance heuristic scaled by the cheapest edge remains admissible; zero-cost spatial edges reduce it to Dijkstra. Bounds are 8,192 nodes/65,536 connections. `findPath` returns immutable `found`/`unreachable` results.

`PathFollower3D(controller, { speed?, arrivalTolerance? })` snapshots a found graph route and is explicitly advanced from scene gameplay updates. Waypoints describe the capsule owner's root/center position, not feet. Movement calls the borrowed character, obeys the per-update speed budget and becomes `blocked` when collision prevents progress; only an explicit `resume` retries. Pause/stop/destroy do not destroy the character. Graph construction does not bake a navmesh, infer clearance from colliders, attach to tilemaps or supply gravity.

### Masks, additive layers, blend trees and IK

`AnimationMask([{ target, paths?, weight? }])` is an explicit channel allowlist, not implicit descendant expansion. Assign an action's `mask`, or a state's mask. `AnimationReferencePose` snapshots explicitly supplied TRS/morph values while borrowing targets; `action.setAdditive(reference)` and state `additiveReference` require complete nonsingular reference channels. Additive translation/morph uses differences, scale uses ratios and rotation composes the weighted shortest quaternion delta after the current local base. Mixer overlays restore the previous base before sampling, avoiding repeated held-pose accumulation while respecting external overwrites.

`AnimationBlendTree(mixer, options)` supports 1D ordered points and 2D points with explicit nondegenerate triangle topology, normalized weights, parameter smoothing and nearest-boundary projection. Distinct positive-duration clips must have matching ordered target/property channels. Leaves synchronize normalized phase across different durations; seek/reverse/repeat/pingpong/once and pause are supported. The tree owns its leaf playback controls, not target objects.

`TwoBoneIKConstraint(mixer, { root, middle, tip, target, pole?, weight?, minBend?, maxBend? })` solves a direct two-segment chain after animation sampling, including pole selection, reach/bend clamping and weighted rotations. Chain ancestors need positive uniform scale. Singular poses remain unchanged; invalid hierarchy or removed/destroyed borrowed object goals disable/unbind the constraint. Goals/poles can also be borrowed vectors. No full-body solver, arbitrary chain or implicit retargeting is provided.

Mixer order is controllers → ordered action sampling → constraints; a subsequent `Scene.update` can still override the final pose before rendering/picking. `scene.animations.paused` freezes these animation stages. `clear`/destroy release controllers, constraints and overlays without destroying borrowed targets.

## 43. Fixed Gameplay, Frame Forces and Presentation

`new Scene({ fixedDelta?, maxFixedSteps?, interpolatePhysics? })` defaults to 1/120 second, 12 catch-up ticks and interpolation disabled. `Scene.fixedUpdate(deltaSeconds)` runs immediately before both physics worlds, zero or more times after the ordinary frame update and ECS systems. `fixedFrame`, `fixedElapsed`, `fixedInterpolationAlpha` and `droppedSimulationTime` describe scene simulation; they are not wall-clock FPS. Each world retains its own configured step size. Pause/hidden frames do not accumulate game time; interrupted gameplay does not replay omitted ticks.

For both body types, frame-submitted `applyForce`/torque contributes **force × frame delta** impulse. Zero-substep frames retain time-weighted impulse, rather than adding multiple whole-frame force magnitudes; multiple substeps consume the queued impulse over simulated time. Samples sharing an unfinished tick are time-averaged. Fixed-callback forces contribute impulse over that callback's exact delta, independently of a world's different step size. Catch-up time omitted by a cap also omits its force impulse. `applyImpulse` stays instantaneous; `clearForces()` also cancels unconsumed frame/fixed impulse. Do not manually update a Scene-owned physics world in addition to the Game loop.

`interpolatePhysics:true` interpolates previous/current moving-body translation and shortest-path rotation only during Game presentation. Authoritative transforms, collision queries and gameplay remain current fixed poses; external transform edits bypass the stale interpolation pair. It adds at most one physics-step presentation latency and does not interpolate arbitrary actions, animation poses or cameras. Mutable scale is not smoothed.

Input edges remain frame-based. Queue one-shot commands in `update`, then consume them once in `fixedUpdate`; polling the same frame's `wasPressed` repeatedly is not a new physical press. Held movement/force can be evaluated every fixed tick.

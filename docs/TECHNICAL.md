# XYZ.js Technical Reference

English · [Traditional Chinese](TECHNICAL-zh.md)

This document describes **package version 1.1.0**, including P01–P08, Text2D/SceneTimers, and the P09–P12 advanced 3D expansion. The API is three.js-inspired, not a drop-in replacement or an implementation of all addons; no runtime dependency was added. See [ACCEPTANCE](../ACCEPTANCE.md) for measured evidence and unverified limitations. Version changes and publication remain the owner's decision.

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

Do not copy index.js alone: its relative `.js` imports require the remaining directories. Declaration files are not executed by the browser but provide types to TypeScript consumers. The package is currently UNLICENSED. The owner must decide the license before public distribution; do not substitute an open-source license without authorization.

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

Fatal runtime failure differs from a user pause: Game retains the first fatal failure, stops the loop, and dispatches an error. Subsequent start/resume calls reject. There is no automatic device recovery; destroy and recreate the Game instead. Do not unconditionally resume from every error listener. Nonfatal Scene/audio errors do not necessarily change Game.state; see section 5.

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

## 13. 3D (P05)

- Matrix4 is column-major and right-handed, with −Z forward. Perspective uses WebGPU depth 0..1. Quaternion.setFromEuler accepts radians. Transform3D reuses matrices; Mesh and Transform3D register with the Scene's World.
- Geometry copies and validates custom position/normal/uv/index data, interleaves vertices at a stride of eight floats, and uses Uint32Array indices. Index topology stays immutable. After deliberately changing vertex position/normal/UV data, call `markUpdated()` to increment `version` and notify renderer upload caches. cube/sphere/plane/quad provide outward normals and winding; BoxGeometry.unit is a named primitive geometry factory.
- Mesh does not destroy shared Geometry, TextureMaterial, or Texture. Material provides a texture, RGB tint, and opacity. The camera computes view-projection from fov/near/far, position, and Quaternion rotation.
- WebGPU uses a shared mesh pipeline, a reused uniform buffer per mesh, and geometry/texture caches. Normals use the inverse-transpose of the model 3×3 matrix, supporting nonuniform scale. Lighting combines ambient and directional diffuse terms.
- The 3D pass uses depth24plus, a less comparison, and depth writes. A separate color-load pass overlays Sprites. Material alpha uses premultiplied blending. 3D submits in Scene order and writes depth; callers must insert overlapping transparent geometry back-to-front. Order-independent transparency is not provided.
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
- The vendor tree contains the [source and SHA256 manifest](../vendor/opm/manifest.json) and [official Apache-2.0 LICENSE](../vendor/opm/LICENSE), without private patches. The root package remains UNLICENSED. Build copies the complete vendor into dist, preserving relative chunk/worklet URLs. Deployment must retain the entire dist tree, and AudioWorklet also requires a secure context.

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

These additions ship in v1.1 (package 1.1.0), not the previously published v1.0 tag.

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
- `Raycaster.setFromCamera(x,y,camera,aspect)` takes NDC. `intersectObjects(iterable,recursive=true,out=[])` replaces out and sorts exact indexed-triangle hits by world distance, with object/point/distance/faceIndex and instanceId for instances. Hidden ancestors exclude descendants; duplicate roots do not duplicate meshes. Tests are two-sided independently of material culling; Raycaster near=0/far=Infinity are independent of camera clipping. Skinning is refreshed before picking.

### glTF, Animation, and Geometry Updates

- `GLTFLoader.load(url,{signal})` and `parse(ArrayBuffer|string,baseURL?,{signal}?)` return `GLTFAsset` with scene:Group, animations:AnimationClip[] and idempotent dispose(). External/embedded buffers and images, relative URIs, GLB 2, triangle primitives, normalized/strided/sparse accessors, node TRS and decomposable affine TRS matrices, metallic-roughness materials, UV0 textures, and skins with up to four influences are supported. Missing normals are generated and missing UVs are zero.
- Required extensions, non-triangle topology, morph targets/weights animation, vertex colors, UV sets other than UV0, extra skin influences, shear matrices and animated matrix nodes reject explicitly. This is not complete glTF extension support. Optional extensions are not implemented; use their core fallback. Image decoder limits remain those in section 18.
- `src/data/models.ts` fixes input at 32 MiB, aggregate fetched and tracked decoded allocations at 128 MiB each, entries per top-level list at 10,000, accessor scalar elements at 4,194,304, total vertices at 1,000,000, indices at 3,000,000, joints per skin at 256, and hierarchy depth at 256. Limits reject rather than truncate; these accounting budgets are not a total browser-memory guarantee.
- Applications must call `asset.dispose()` after removing/stopping all consumers: it destroys loader-owned nodes and textures. Scene destruction alone does not release the asset's owned textures; do not dispose while another live object borrows them. Abort/parse failure cleans up owned resources.
- `KeyframeTrack(target,path,times,values,interpolation='LINEAR')` targets translation/rotation/scale; STEP, LINEAR and CUBICSPLINE are supported. Times are increasing nonnegative seconds; cubic values use incoming tangent/value/outgoing tangent triplets. Linear Quaternion interpolation uses the shortest path; cubic results are normalized.
- `AnimationClip(name,tracks)` derives duration from final keys. `scene.animations.clipAction(clip)` caches an action. `play()` starts/resumes without resetting time; `stop()` resets time to zero without restoring a pose. Default loop=true wraps time; loop=false samples/clamps the endpoint and stops. timeScale may be negative for reverse playback. Mixer actions apply in creation/insertion order; the last playing action writing a property wins, without weights/blending. `stopAll()` stops actions and `destroy()` releases them.
- Game advances scene.animations after timers and before user Scene.update with clamped simulation delta; pause/hidden time is excluded. Do not also update that mixer manually. `SkinnedMesh` performs CPU linear-blend skinning into its cloned Geometry using joint world matrices and inverse binds relative to mesh world. Renderers and picking refresh it via updateSkin(); vertex changes advance Geometry.version for uploads. Index topology remains immutable.

### PBR, Lighting, Shadows, HDR, and Instancing

- `PBRMaterial` extends TextureMaterial and borrows all slots. Base texture and emissiveTexture RGB are sRGB decoded; factors and lighting are linear. metallicRoughnessTexture is linear (G roughness/B metallic), normalTexture is linear tangent-space UV0 (normalScale), and occlusionTexture is linear R (occlusionStrength, indirect illumination only). Metallic/roughness default to 0/0.5; emissive defaults to zero.
- alphaMode is OPAQUE, MASK (alphaCutoff) or BLEND; doubleSided controls culling and backface normals. Direct construction defaults to BLEND (MASK when positive cutoff supplied), doubleSided=true; glTF uses its OPAQUE/false defaults. Transparent objects still require caller-managed back-to-front insertion; no order-independent transparency or environment IBL is provided. TextureMaterial retains legacy diffuse lighting.
- Scene.pointLights and spotLights accept PointLight/SpotLight. Position/color/intensity/range are mutable; range=0 is unlimited. Spot direction points toward the illuminated surface and innerAngle/outerAngle are radians. At most 8 point and 8 spot lights are supported; exceeding limits rejects, not truncates.
- scene.shadows defaults disabled. Mutable mapSize=1024, extent=10 (full orthographic width/height), near=0.1, far=50, bias=0.002 and target configure directional-only 3×3 PCF. Mesh.castShadow/receiveShadow default true. Point/spot shadows and cascades are not supported.
- scene.postProcessing defaults disabled. When enabled, 3D renders into an HDR floating-point attachment before fullscreen exposure (default 1), toneMapping ('aces' default or 'none') and actual 9-tap threshold bloom (strength=0, threshold=1, radius=2 output pixels). The 2D overlay runs afterward and is unaffected. Resize/disable/destroy release size-dependent targets. WebGL2 requires EXT_color_buffer_float and explicitly rejects requested HDR processing when unavailable.
- `InstancedMesh({...meshOptions,count})` has fixed positive count and identity-initialized matrices. Use setMatrixAt(index,Matrix4) for finite invertible affine matrices; it increments version so upload caches notice changes. getMatrixAt(index,out) reuses out. Do not directly mutate matrices without notification. Indexed hardware instancing shares geometry/material, composing mesh.worldMatrix × instance matrix with inverse-transpose normals.

See [advanced3d](../examples/advanced3d/) and the [usage guide](USAGE.md#11-advanced-3d). These are WebGPU/WebGL2 3D features; Canvas2D remains 2D-only. Actual Chromium observations do not certify other browsers or throughput.

### Per-Slot Texture Sampling

PBRMaterial options and readonly fields `textureSampler`, `metallicRoughnessSampler`, `normalSampler`, `occlusionSampler`, and `emissiveSampler` accept `TextureSamplerOptions`: minFilter/magFilter are 'nearest' or 'linear'; addressModeU/addressModeV are 'clamp-to-edge', 'repeat' or 'mirror-repeat'. Ordinary PBR defaults stay linear/clamp. GLTFLoader applies glTF per-slot defaults (repeat wrapping), including distinct samplers on one shared image without duplicating texture ownership. Explicit mipmapped minification filters reject; mipmap generation/filtering is not supported.

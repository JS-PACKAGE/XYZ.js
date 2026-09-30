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
- Gamepad: `game.input.gamepad` (`GamepadState`) tracks the first connected pad whose `mapping==='standard'` (non-standard pads are ignored; `preferredIndex` locks a slot). Buttons use W3C names (`a b x y lb rb lt rt back start ls rs up down left right home`), `button(name)` is analog 0..1, `isDown/wasPressed/wasReleased` use `pressThreshold` (default 0.5), `firstPressed()` supports rebind prompts. `stick('left'|'right')`/`axis(name)` apply a radial `deadzone` (default 0.15, [0,1)) rescaled to 0..1. A newly selected pad does not report held buttons as presses; a vanished pad reports one release. `game.input.actions` (`ActionMap`) binds named actions to `{button}`, `{axis,direction:±1}` and `{key: KeyboardEvent.code}` with `bind/rebind/unbind/bindings/value/isDown/wasPressed/wasReleased`; `export()`/`import()` round-trip JSON, and `import` validates everything before replacing. Edges are computed once per `InputManager.update`. Verified with synthetic `getGamepads` snapshots only; physical hardware, vibration and non-standard mappings are unverified/unsupported.

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

- `GLTFLoader.load(url,{signal,allowedOrigins})` and `parse(ArrayBuffer|string,baseURL?,{signal,allowedOrigins}?)` return `GLTFAsset` with scene:Group, animations:AnimationClip[] and idempotent dispose(). External/embedded buffers and images, relative URIs, GLB 2, triangle primitives, normalized/strided/sparse accessors, node TRS and decomposable affine TRS matrices, metallic-roughness materials, UV0 textures, and skins with up to four influences are supported. Buffers/images referenced by the model may be fetched only from the model's own origin (`baseURL`) or from origins listed in `allowedOrigins` (e.g. `['https://cdn.example']`); `data:`/`blob:` URIs are always allowed, and any other origin rejects with `AssetError` before a request is made. Missing normals are generated and missing UVs are zero.
- Required extensions, non-triangle topology, vertex colors, UV sets other than UV0, extra skin influences, shear matrices, animated matrix nodes, and morph target attributes other than POSITION/NORMAL/TANGENT reject explicitly. Morph targets are supported: per-primitive POSITION and NORMAL deltas (float or normalized integer, including sparse; missing entries are zero; TANGENT deltas are ignored because tangents are not consumed) with mesh/node `weights`, and `weights` animation channels (LINEAR/STEP/CUBICSPLINE). All primitives of a mesh must declare the same target count and a node's weights must match it. This is not complete glTF extension support. Optional extensions are not implemented; use their core fallback. Image decoder limits remain those in section 18.
- `src/data/models.ts` fixes input at 32 MiB, aggregate fetched and tracked decoded allocations at 128 MiB each, entries per top-level list at 10,000, accessor scalar elements at 4,194,304, total vertices at 1,000,000, indices at 3,000,000, joints per skin at 256, morph targets per mesh at 64, and hierarchy depth at 256. Limits reject rather than truncate; these accounting budgets are not a total browser-memory guarantee.
- Applications must call `asset.dispose()` after removing/stopping all consumers: it destroys loader-owned nodes and textures. Scene destruction alone does not release the asset's owned textures; do not dispose while another live object borrows them. Abort/parse failure cleans up owned resources.
- `KeyframeTrack(target,path,times,values,interpolation='LINEAR')` targets translation/rotation/scale on an `Object3D`, or `'weights'` on a `MorphWeights` (values are `keys × targetCount` scalars; cubic triplets apply per weight); STEP, LINEAR and CUBICSPLINE are supported. Times are increasing nonnegative seconds; cubic values use incoming tangent/value/outgoing tangent triplets. Linear Quaternion interpolation uses the shortest path; cubic results are normalized.
- Morphing is CPU-side, like skinning: `Mesh({morph: new MorphTargets({positions,normals?,weights})})` takes ownership of its Geometry (a Geometry can be claimed once) and `mesh.morph.weights.set(i,w)` drives it. `Mesh.updateDeformation()` (called by renderers and Raycaster before reading vertices) re-blends `base + Σ w·Δ` only when a weight changed, renormalizing morphed normals, then calls `geometry.markUpdated()`. A `SkinnedMesh` morphs its bind pose before skinning. glTF primitives of one node share one `MorphWeights`, reachable via `mesh.morph.weights`. Every changed-weight frame re-uploads the whole vertex buffer; verified by unit tests only, no GPU pixel proof.
- `AnimationClip(name,tracks)` derives duration from final keys. `scene.animations.clipAction(clip)` caches an action. `play()` starts/resumes without resetting time; `stop()` resets time to zero without restoring a pose. Default loop=true wraps time; loop=false samples/clamps the endpoint and stops. timeScale may be negative for reverse playback. Mixer actions apply in creation/insertion order; the last playing action writing a property wins, without weights/blending. `stopAll()` stops actions and `destroy()` releases them.
- Game advances scene.animations after timers and before user Scene.update with clamped simulation delta; pause/hidden time is excluded. Do not also update that mixer manually. `SkinnedMesh` performs CPU linear-blend skinning into its cloned Geometry using joint world matrices and inverse binds relative to mesh world. Renderers and picking refresh it via updateSkin(); vertex changes advance Geometry.version for uploads. Index topology remains immutable.

### PBR, Lighting, Shadows, HDR, and Instancing

- `PBRMaterial` extends TextureMaterial and borrows all slots. Base texture and emissiveTexture RGB are sRGB decoded; factors and lighting are linear. metallicRoughnessTexture is linear (G roughness/B metallic), normalTexture is linear tangent-space UV0 (normalScale), and occlusionTexture is linear R (occlusionStrength, indirect illumination only). Metallic/roughness default to 0/0.5; emissive defaults to zero.
- alphaMode is OPAQUE, MASK (alphaCutoff) or BLEND; doubleSided controls culling and backface normals. Direct construction defaults to BLEND (MASK when positive cutoff supplied), doubleSided=true; glTF uses its OPAQUE/false defaults. Transparent objects still require caller-managed back-to-front insertion; no order-independent transparency is provided. TextureMaterial retains legacy diffuse lighting.
- Scene.pointLights and spotLights accept PointLight/SpotLight. Position/color/intensity/range are mutable; range=0 is unlimited. Spot direction points toward the illuminated surface and innerAngle/outerAngle are radians. At most 8 point and 8 spot lights are supported; exceeding limits rejects, not truncates.
- scene.shadows defaults disabled. Mutable mapSize=1024, extent=10 (full orthographic width/height), near=0.1, far=50, bias=0.002 and target configure directional-only 3×3 PCF. Mesh.castShadow/receiveShadow default true. Point/spot shadows and cascades are not supported.
- scene.postProcessing defaults disabled. When enabled, 3D renders into an HDR floating-point attachment before fullscreen exposure (default 1), toneMapping ('aces' default or 'none') and actual 9-tap threshold bloom (strength=0, threshold=1, radius=2 output pixels). The 2D overlay runs afterward and is unaffected. Resize/disable/destroy release size-dependent targets. WebGL2 requires EXT_color_buffer_float and explicitly rejects requested HDR processing when unavailable.
- `InstancedMesh({...meshOptions,count})` has fixed positive count and identity-initialized matrices. Use setMatrixAt(index,Matrix4) for finite invertible affine matrices; it increments version so upload caches notice changes. getMatrixAt(index,out) reuses out. Do not directly mutate matrices without notification. Indexed hardware instancing shares geometry/material, composing mesh.worldMatrix × instance matrix with inverse-transpose normals.
- Environment (`EnvironmentMap`, WebGPU/WebGL2 only): `scene.environment` lights PBRMaterial with image-based light and `scene.background` draws a skybox; both take the same or different maps, `environmentIntensity`/`backgroundIntensity` (nonnegative, default 1) scale them, and a destroyed map is treated as absent. Maps are immutable 2:1 equirect radiance images (height 4..1024, width 2×height, linear light): `fromPixels(w,h,float RGB|RGBA)`, `fromImageData(8-bit sRGB)`, `fromRGBE(hdrBytes)` (Radiance .hdr, flat or RLE, -Y +X orientation only, bounds-checked) and procedural `gradient({zenith,horizon,ground,sun?})`. Direction convention: u=0.5 looks toward −Z, v=0 is +Y. Construction filters once on the CPU (about 160 ms for 2048×1024 in Chromium): an order-2 SH irradiance (÷π, cosine-convolved) for diffuse light and up to 7 half-float mips whose levels ≥2 are cosine-power lobes for roughness = level/(mips−1); level 1 is a box average. Shaders use `textureLod` at `roughness × (mips−1)` and Karis' analytic split-sum BRDF (no LUT). With an environment the flat `ambientLight` term is dropped for PBR; punctual/directional lights still add; TextureMaterial is unchanged. The skybox is a fullscreen triangle drawn first without depth, unprojecting two points per pixel so perspective and orthographic cameras work; it samples level 0 (no minification filter) and is tone mapped with the 3D pass. GPU copies are renderer caches keyed by map, released when unused or destroyed. Not implemented: environment rotation, box-projected/parallax reflections, sun shadowing from the map, and background blur. Verified by unit tests (SH/mips/RGBE) and in Chromium on WebGL2 and WebGPU (sky orientation, IBL spheres, HDR path, orthographic camera, runtime swaps; no console errors); other browsers and real-GPU visual parity are unverified.

See [advanced3d](../examples/advanced3d/) and the [usage guide](USAGE.md#11-advanced-3d). These are WebGPU/WebGL2 3D features; Canvas2D remains 2D-only. Actual Chromium observations do not certify other browsers or throughput.

### Per-Slot Texture Sampling

PBRMaterial options and readonly fields `textureSampler`, `metallicRoughnessSampler`, `normalSampler`, `occlusionSampler`, and `emissiveSampler` accept `TextureSamplerOptions`: minFilter/magFilter are 'nearest' or 'linear'; addressModeU/addressModeV are 'clamp-to-edge', 'repeat' or 'mirror-repeat'. Ordinary PBR defaults stay linear/clamp. GLTFLoader applies glTF per-slot defaults (repeat wrapping), including distinct samplers on one shared image without duplicating texture ownership. Explicit mipmapped minification filters reject; mipmap generation/filtering is not supported.

## 22. 2D Hierarchy and Atlas Graphics (P13)

- GameObject remains the public 2D facade. Mutable local position/rotation/scale compose into reused worldMatrix (parent × local), preserving shear and reflection. Group2D is a non-drawing container; add/remove, parent/children, updateWorldMatrix, getLocalBounds and containsPoint use the existing Scene ownership flow. Cycles/cross-Scene ownership reject; same-Scene reparent preserves local pose. Remove unregisters without destroying; parent destruction recursively destroys children.
- worldVisible ANDs visibility, worldOpacity/worldTint multiply, worldZIndex adds; root space is inherited. ScreenElement extends Group2D with screen space. Stable world-before-screen ordering puts HUD after all world sprites; equal z preserves insertion order. Bounds include Sprite anchor; singular-transform point tests return false, not pixel-alpha picking.
- Sprite source is a copied/frozen finite positive in-texture Rect2D; fractional x/y/width/height are supported. Undefined means whole texture. Texture replacement validates the current source before publishing. Natural width/height do not include scale; no displayWidth/displayHeight aliases. Texture is borrowed. SpriteSheet constructor/grid validates immutable integer frames, supports origin/spacing and creates Sprites without cropping/copying images.
- FrameAnimation(sprite,frames,{strategy,speed}) binds to one Sprite; frame duration is positive finite seconds. Strategies loop/pingpong/freeze/hide, getters frame/playing, play/pause/reset/reverse/goToFrame/stop; reset restores visibility/first frame, stop pauses and resets. Source changes use frozen frames. Scene advances centrally with simulation delta; removed objects do not advance. Native animationframe/animationloop/animationend dispatch on both animation and Sprite; large dt aggregates loop counts. Sprite destruction pauses and releases its animation reference.
- SpriteFont maps Unicode code points to sheet frames with validated alphabet, optional case-insensitive mapping/fallback, glyphWidth/advance/lineHeight. SpriteText text updates preflight bounded layout and glyph allocation, reuse existing glyphs, and reject without publishing invalid text. Newline/letterSpacing/lineSpacing/left-center-right alignment are supported; no BMFont importer.
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
- Discrete fixed-step sweep broadphase plus exact circle/convex contacts and clipped faces; iterative linear/angular impulse, restitution/tangent friction and positional correction. Default gravityY980, fixedDelta1/120, maxSubSteps12, velocityIterations8, positionIterations3; configurable positive fixedDelta, substeps1–120 and iterations1–64. At most16,384 registered colliders. droppedTime accumulates excess catch-up time; accumulated force/torque applies across simulated substeps of one update, then clears for simulated bodies. No CCD/kinematic/joints/sleep/concave/composite/edge/3D; high-speed tunneling remains.
- Reciprocal category/mask uint32 defaults1/all bits; sensor detects without response. collisionstart/precollision/postcollision/collisionend native detail {self,other,normal,points,penetration,sensor,cancelResponse}; stable snapshots, reversed normal for other receiver, cancel only current precollision response. Callback removal/filter changes/destruction end surviving contacts safely. overlap(collider,owner) returns exact ContactQuery[] excluding owner with reciprocal filters; raycast(origin,direction,maxDistance,mask?) normalizes nonzero direction and sorts PhysicsRayHit[] by surface distance.
- Trigger2D(collider,{filter?,repeat?,onEnter?}) clones a static sensor; default one accepted enter, repeat0 inactive, explicit Infinity unlimited. triggerenter/triggerexit detail {self,other}, readonly remainingRepeats; filter rejected enters do not consume count. Does not destroy itself automatically.

### Maps

- TileMapOptions {columns,rows,tileWidth,tileHeight,sheet}; positive integer grid ≤65,536 cells, positive finite logical dimensions. IsometricMapOptions adds nonnegative elevationStep (default tileHeight/2). Both Group2D facades borrow SpriteSheet/Texture and reuse generated Sprite/collider children.
- Immutable Tile {frame:number|undefined,solid,elevation,collider?,metadata?}; setTile(column,row,Partial<Tile>) preflights frame/shape/registration before publication, getTile validates grid coordinates, clearTile resets all cell data. Default solid shape is top-left box or isometric diamond, optional custom convex collider; solid cells may exist without visible frame. Screen-space solid edits reject.
- tileToLocal(column,row,out?)/tileToWorld include cell elevation; orthogonal top-left/isometric top vertex. worldToTile(point,out?) inverts current hierarchy onto elevation-zero plane, returns integer coordinates possibly outside grid. No known-elevation overload. pickTile(point,out?) tests elevated topmost rendered graphic rectangles ordered by diagonal/elevation/insertion, not alpha/diamond exact geometry; singular pick returns undefined, inverse conversion rejects.
- Camera-local transformed conservative culling includes elevation/overhang and renderOffset; only renderEnabled changes, solid registration remains. Hidden/cleared Sprite pool is retained/reused without growing bounds. Edits, transforms, Scene removal and destruction update static colliders; destroy owned children, not borrowed atlas. No hex/staggered/multilayer/editor format importers/navigation.

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

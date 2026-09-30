# XYZ.js Usage Guide

English · [Traditional Chinese](USAGE-zh.md) · [Technical reference](TECHNICAL.md)

XYZ.js is a browser game engine, not a complete game. This guide covers version 1.1.0 with P01–P08 and Text2D/SceneTimers delivered. The package is not published to npm and the root license remains UNLICENSED. See [acceptance records](../ACCEPTANCE.md) for verified support and limitations.

## 1. Start the Development Environment

Use Node >=26 and pnpm 12.6.0. From the repository root:

```sh
npx pnpm@12.6.0 install
npx pnpm@12.6.0 dev
```

Open `http://127.0.0.1:5173/examples/showcase/` for integrated 2D, 3D, and audio. Click the audio button to unlock playback. The development server binds only to localhost. Do not open pages with `file://`: WebGPU and AudioWorklet require a secure context; use HTTPS in production.

| Example                                     | Purpose                                     |
| ------------------------------------------- | ------------------------------------------- |
| [triangle](../examples/triangle/)           | WebGPU triangle, pause/resume/destroy       |
| [sprite](../examples/sprite/)               | Shared textures, opacity, ordering, sound   |
| [pong](../examples/pong/)                   | Keyboard, pointer, gamepad, camera, scoring |
| [cube3d](../examples/cube3d/)               | Perspective, lighting, depth, textures      |
| [fallback-demo](../examples/fallback-demo/) | Backend selection and capabilities          |
| [showcase](../examples/showcase/)           | Scene switching, 2D + 3D + audio            |

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

The camera faces local −Z. 3D renders before the 2D overlay. Supported features include cube/sphere/plane/quad, custom indexed geometry, and ambient plus directional lighting, not glTF, shadows, or skeletal animation. Do not mutate Geometry buffers in place.

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

Tool checks do not replace actual browser output and interaction verification. Safari/Edge/Firefox, physical gamepads, and the complete BFCache matrix remain unverified. See the [benchmark](../benchmarks/sprites/) for measurements; approximately 60fps is not a cross-device guarantee. Preserve the OPM LICENSE and complete dist tree, and obtain the owner's root-license decision before public distribution.

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

Text supports newlines and normal Sprite transforms, anchor, opacity and zIndex. Await `document.fonts.load(...)` before creating labels that require a custom font. Handle `setText()` rejections; rapid overlapping updates keep only the latest request. Style is immutable and generated textures belong to the label, so do not share them with other Sprites.

Open [Pong](../examples/pong/) to see score text, delayed serves, Pause/Resume and Restart scene. Restart while paused leaves the new scene paused until Resume.

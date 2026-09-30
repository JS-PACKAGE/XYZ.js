# XYZ.js

Browser-native TypeScript game engine. Package metadata is **1.0.0**; **P01–P08 are implemented and verified as recorded in ACCEPTANCE.md**. The package is not published on npm; its license remains UNLICENSED.

技術文件／Technical reference／技術資料：[docs/TECHNICAL.md](docs/TECHNICAL.md)（繁體中文）。

## 繁體中文

### 目前可用

引擎提供 Game／Scene／ECS、2D／3D Math、Texture／Sprite、Camera／Input 與 Mesh 深度／光照管線。`auto` 依 WebGPU→WebGL2→Canvas2D 初始化降級；強制 backend 失敗不切換。以 `game.graphics.capabilities.threeD` 判斷 3D 支援，Canvas2D 只有 2D。WebGPU 需要安全來源（localhost 可用）。Audio 使用官方 OPM.js；在使用者手勢中呼叫 `await game.audio.unlock()`。

```html
<canvas id="game"></canvas>
```

在可解析 `xyz.js` 的 npm/bundler 專案中：

```ts
import { Game } from 'xyz.js';

const game = await Game.create({ canvas: '#game', renderer: 'webgpu' });
game.addEventListener('error', (event) =>
  console.error((event as CustomEvent<Error>).detail),
);
game.start();

// 如需控制：game.pause(); game.resume(); game.resize(1280, 720); game.destroy();
// game.clock.deltaTime、elapsedTime（秒）、frame、fps
```

`Game.create` 還可設定 `width`、`height`（預設 1280×720 CSS 像素）、`maxDeltaTime`（預設 0.1 秒）、`pixelRatio`（預設裝置比例上限 2）、`autoResize`（預設 true）。引擎使用 size containment 提供預設 intrinsic 尺寸，不覆寫作者的 width／height CSS；可在有尺寸的容器中設定 canvas `width:100%;height:100%`，或使用 width 搭配明確的 CSS `aspect-ratio`。`resize()` 更新 intrinsic fallback，autoResize 時仍以作者 CSS 的 content box 為準；`fps` 使用未 clamp 的真實幀間隔。每個 Canvas 限一個 Game（含初始化期間）。初始化失敗會 reject；執行中錯誤回報 `error` 事件並暫停，需 destroy／重新 create，不能直接 resume。一般 pause 仍可正常 resume；狀態為 `idle`、`running`、`paused`、`destroyed`。

開發：先執行 `npx pnpm install`，再執行 `npx pnpm dev`，於 WebGPU 瀏覽器開啟 `http://127.0.0.1:5173/examples/triangle/`。正式檢查命令：`npx pnpm build`、`npx pnpm typecheck`、`npx pnpm test`、`npx pnpm lint`、`npx pnpm format:check`；文件不聲稱這些檢查已執行。`npx pnpm build` 輸出可發佈的 `dist/`（含 JS 與 `.d.ts`）。npm 套件發佈並安裝後可使用上述 bare import；若不透過 npm/bundler，將完整 `dist/` 複製到網站（例如 `/vendor/xyz/dist/`），在瀏覽器改用 `import { Game } from '/vendor/xyz/dist/src/index.js'`，不要只複製入口檔。

可執行範例：`triangle`、`sprite`、`pong`、`cube3d`、`fallback-demo`、`showcase`（2D＋3D＋音訊同場）。驗收證據見 `ACCEPTANCE.md`；各階段獨立 `[Pxx]` commit，不 push。

## English

### Available now

Game/Scene/ECS, 2D/3D math, Texture/Sprite, camera/input and lit, depth-tested Mesh rendering are available. `auto` tries WebGPU→WebGL2→Canvas2D including initialization failures; forced backends never fall back. Check `game.graphics.capabilities.threeD`: Canvas2D is 2D-only. WebGPU requires a secure origin. Audio uses official OPM.js; call `await game.audio.unlock()` from a user gesture.

```ts
import { Game } from 'xyz.js';

const game = await Game.create({ canvas: '#game', renderer: 'webgpu' });
game.addEventListener('error', (event) =>
  console.error((event as CustomEvent<Error>).detail),
);
game.start();
```

Add `<canvas id="game"></canvas>` to the page. Options include `width`/`height` (1280×720 CSS pixels), `maxDeltaTime` (0.1s), `pixelRatio` (device ratio capped at 2), and `autoResize` (true). Size containment supplies intrinsic defaults without replacing authored width/height CSS. Use `width:100%;height:100%` in a sized container, or width plus an explicit CSS `aspect-ratio`. `resize()` updates intrinsic defaults; autoResize still follows the authored content box. Clock exposes seconds, frame count, and instantaneous fps from the unclamped interval. Each canvas permits one Game, including pending initialization. `pause()` can be resumed; fatal runtime errors emit `error` with `detail`, pause the Game, and require destroy/recreate rather than resume. Initialization failures reject `create`.

Install tools with `npx pnpm install`, start `npx pnpm dev`, then open `http://127.0.0.1:5173/examples/triangle/` in a WebGPU-capable browser. For project verification, run `npx pnpm build`, `npx pnpm typecheck`, `npx pnpm test`, `npx pnpm lint`, `npx pnpm format:check` (results are not asserted here). npm usage requires that this package has actually been published and installed. For unbundled vendor use, copy the **entire** compiled `dist/` tree into the site and import its `/vendor/xyz/dist/src/index.js` URL instead of the bare specifier; relative `.js` imports need the rest of `dist/`.

Runnable examples: `triangle`, `sprite`, `pong`, `cube3d`, `fallback-demo`, and `showcase` (2D + 3D + audio together). See `ACCEPTANCE.md` for verification evidence and limitations. Each phase is committed separately; nothing is pushed automatically.

## 日本語

### 現在利用可能

Game／Scene／ECS、2D／3D 数学、Texture／Sprite、Camera／Input、深度と照明付き Mesh を提供します。`auto` は初期化失敗時も WebGPU→WebGL2→Canvas2D の順に降格します。強制 backend は切り替えません。`game.graphics.capabilities.threeD` で判定し、Canvas2D は 2D 専用です。WebGPU はセキュアなオリジンが必要です。音声は公式 OPM.js を使用し、ユーザー操作から `await game.audio.unlock()` を呼び出します。

```ts
import { Game } from 'xyz.js';

const game = await Game.create({ canvas: '#game', renderer: 'webgpu' });
game.addEventListener('error', (event) =>
  console.error((event as CustomEvent<Error>).detail),
);
game.start();
```

ページに `<canvas id="game"></canvas>` を用意してください。`width`／`height`（既定 1280×720 CSS ピクセル）、`maxDeltaTime`（0.1 秒）、`pixelRatio`（デバイス比の上限 2）、`autoResize`（true）を設定できます。size containment で既定 intrinsic サイズを指定し、利用者の width／height CSS は上書きしません。サイズ付きコンテナ内で `width:100%;height:100%`、または幅と明示的な CSS `aspect-ratio` を使用します。`resize()` は intrinsic 既定値を更新し、autoResize は利用者 CSS の content box に従います。fps は clamp 前の実フレーム間隔から計算します。初期化中も含め Canvas は一つの Game 専用です。通常の pause は resume できますが、実行時障害は `error` イベントで通知し、destroy／再 create が必要です。初期化失敗は Promise の reject で通知します。

`npx pnpm install`、`npx pnpm dev` を実行し、WebGPU 対応ブラウザーで `http://127.0.0.1:5173/examples/triangle/` を開きます。検証コマンドは `npx pnpm build`、`npx pnpm typecheck`、`npx pnpm test`、`npx pnpm lint`、`npx pnpm format:check` です（ここでは実行結果を主張しません）。npm import は公開・インストール後に使用できます。bundler を使わない場合、ビルド済みの `dist/` **全体**をサイトにコピーし、bare specifier ではなく `/vendor/xyz/dist/src/index.js` のような URL から import してください。

実行可能なサンプル：`triangle`、`sprite`、`pong`、`cube3d`、`fallback-demo`、`showcase`（2D＋3D＋音声）。検証結果と制限は `ACCEPTANCE.md` を参照してください。各段階は個別 commit し、push はしません。

## Scene／Core World

```ts
import { Game, Scene, GameObject } from 'xyz.js';

class MovingScene extends Scene {
  player = this.add(new GameObject());
  override update(dt: number): void {
    this.player.position.x += 120 * dt;
  }
}
const game = await Game.create({ canvas: '#game' });
await game.setScene(new MovingScene());
game.start();
await game.setScene(new Scene());
game.destroy();
```

Scene 是 world 容器；GameObject 無視覺外觀，Sprite 加上貼圖呈現。切換先準備新 Scene，成功才清理舊 Scene；失敗保留舊 Scene，取消時提供 AbortSignal。Scene owns its objects; successful switching destroys the old Scene, while preparation failure preserves it. Scene は Entity ではなく lifecycle 容器であり、切替失敗時は旧 Scene を保持します。詳見 [生命週期契約](docs/TECHNICAL.md#10-core-worldp02)。

## Texture／Sprite

```ts
import { Scene, Sprite } from 'xyz.js';

const texture = await game.assets.loadTexture('/image.png');
const scene = new Scene();
scene.add(new Sprite({ texture, position: [160, 120], opacity: 0.75 }));
await game.setScene(scene);
game.start();
```

`/examples/sprite/` demonstrates shared textures, transforms, opacity and z-order. Sprite destruction does not destroy its shared Texture; `game.assets` owns cached textures until Game destruction. Anchor defaults to the image center; coordinates use logical CSS pixels, right/down positive.

## Camera／Input

`scene.camera2D.position` is the world coordinate at the viewport's top-left; `zoom` scales both axes uniformly. `worldToScreen` and `screenToWorld` use logical pixels, independent of DPR. `game.input.keyboard.isDown('ArrowUp')`, `.wasPressed(code)`, `.wasReleased(code)` expose held/edge state. Pointer uses the same methods with button numbers and `.position`; `game.input.gamepads` retains browser slot indices. Edges are available during Scene updates and cleared afterward. Blur, hidden pages, pause and destruction clear held state.

## 3D

```ts
import { Mesh, Geometry, TextureMaterial } from 'xyz.js';
const cube = scene.add(
  new Mesh({
    geometry: Geometry.cube(),
    material: new TextureMaterial({ texture, color: [1, 0.8, 0.6] }),
    position: [0, 0, 0],
  }),
);
cube.rotation.setFromEuler(0.2, 0.5, 0);
scene.camera3D.position.set(0, 0, 5);
```

`Geometry.sphere()`, `.plane()`, `.quad()` and custom indexed position/normal/UV data are supported. Treat geometry buffers as immutable. Angles are radians; the perspective camera looks along local −Z. Scene lighting uses `ambientLight` and `directionalLight` (surface-to-light direction, color, intensity). 3D is depth-tested before the 2D overlay.

## Compatibility

`auto` initializes backends on isolated canvases and copies the selected output to the original canvas through Canvas2D. This preserves DOM/input ownership and permits fallback after context binding, at the cost of one presentation copy per frame. Explicit `webgpu`, `webgl2`, or `canvas2d` renders directly. `Primitive2D.rectangle(width,height,color)` and `.circle(radius,color)` asynchronously create owned rasterized shapes usable on all backends. `cube3d/?renderer=canvas2d` explicitly reports that 3D is unavailable.

## Audio

```ts
const sound = await game.audio.load('/sound.json');
// Inside a user gesture:
await game.audio.unlock();
sound.play({ channel: 'sfx' });
game.audio.master.volume = 0.8;
```

JSON contains an OPM `voice` and `notes: [{ note: 60, time: 0, duration: 0.2 }]` (MIDI note; seconds). Optional `channel`, `loop`, and `duration` select defaults and loop period. `music`, `sfx`, `ui`, and `master` expose volume 0–1. Playback is scene-owned unless `persistent: true`; scene teardown cancels future notes and release tails. The eight-slot budget includes release, and only the oldest SFX can be stolen. Eight isolated official OPM instances prevent upstream global voice stealing from cutting BGM; this costs eight AudioContexts/worklets. See `examples/sprite/` and [technical details](docs/TECHNICAL.md).

## Diagnostics & benchmark

`import { logger } from 'xyz.js'; logger.level = 'debug';` enables backend diagnostics. Levels: `debug`, `info`, `warn` (default), `error`, `silent`; methods use the `[XYZ]` prefix.

Run `npx pnpm dev`, open `/benchmarks/sprites/`, and keep the tab visible. The reproducible 1,000-Sprite benchmark reports RAF intervals and CPU submission separately after 120 warmup and 600 measured frames. The recorded Chromium/WebGPU run reached ~60 fps; this is not a cross-device guarantee or GPU timing measurement.

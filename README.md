# XYZ.js

Browser-native TypeScript game engine. Package metadata is **1.0.0**; **P01–P03 are implemented**. Later phases remain tracked in PLAN.md; the version does not imply the entire roadmap is available. The package is not claimed published on npm yet.

技術文件／Technical reference／技術資料：[docs/TECHNICAL.md](docs/TECHNICAL.md)（繁體中文）。

## 繁體中文

### 目前可用（P01–P03）

瀏覽器必須支援 WebGPU 並在安全來源執行（localhost 可用）。引擎提供 Game／Clock、WebGPU triangle、Scene／GameObject、內部 ECS、2D Math、AssetLoader／Texture／Sprite。`game.start()` 可不帶 Scene；也可 `game.start(scene)`，或先 `await game.setScene(scene)` 再 start。3D、Audio 與相容 backend 仍待後續階段。`auto` 目前只試 WebGPU。

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

後續 P04 Camera／Input、P05 3D、P06 WebGL2→Canvas2D fallback 與 capabilities、P07 OPM.js 音效、P08 完整 hardening／六範例；細節與驗收條件見 `PLAN.md`、`ACCEPTANCE.md`。每階段驗收後立刻個別 `[Pxx]` commit，不 push。

## English

### Available now (P01–P03)

Run on a secure origin in a WebGPU-capable browser. Game, Clock, the WebGPU triangle, Scene/GameObject, internal ECS, 2D math, AssetLoader/Texture/Sprite are available. Use `game.start(scene)` or `await game.setScene(scene); game.start()`. Calling `start()` without a Scene retains the triangle. 3D, audio and compatibility backends remain planned; `auto` currently tries only WebGPU.

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

Planned, not yet available: P04 camera/input; P05 3D rendering; P06 WebGL2/Canvas2D fallback and capabilities; P07 OPM.js audio; P08 hardening and six runnable examples. See `PLAN.md` and `ACCEPTANCE.md` for gates. Independently commit each verified `[Pxx]` phase immediately; never push automatically.

## 日本語

### 現在利用可能（P01–P03）

WebGPU 対応ブラウザーのセキュアなオリジン（localhost 可）で利用します。Game／Clock、WebGPU 三角形、Scene／GameObject、内部 ECS、2D 数学、AssetLoader／Texture／Sprite を提供します。`game.start(scene)` または `await game.setScene(scene); game.start()` で Scene を開始できます。Scene なしの `start()` も利用可能です。3D、音声、互換 backend は今後の段階で、`auto` は現在 WebGPU のみ試します。

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

P04 Camera／Input、P05 3D、P06 WebGL2／Canvas2D 自動降格と capabilities、P07 OPM.js 音声、P08 hardening と六つのサンプルは今後の段階です。`PLAN.md` と `ACCEPTANCE.md` を参照してください。各段階の検収後すぐに `[Pxx]` で**個別 commit** し、push はしません。

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

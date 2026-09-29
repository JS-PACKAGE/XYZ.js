# XYZ.js

Browser-native TypeScript game engine. Package metadata is **1.0.0**, while the **current implemented phase is P01 WebGPU Foundation only** (the proposal's original v0.0.1 phase). The version number does **not** mean the complete eight-phase roadmap is available. The package is not claimed published on npm yet.

技術文件／Technical reference／技術資料：[docs/TECHNICAL.md](docs/TECHNICAL.md)（繁體中文）。

## 繁體中文

### 目前可用（P01）

瀏覽器必須支援 WebGPU，並在安全來源執行（本機開發可用 localhost）。目前引擎提供 Game／Clock／WebGPU triangle；`game.start()` **不需要 Scene**，Scene、Sprite、3D、Audio 及 WebGL2／Canvas2D 留待後續階段。當 `renderer:'auto'` 時目前只試 WebGPU，無法使用時會明確失敗，不會自動降級。

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

後續 P02 Scene／ECS、P03 Texture／Sprite、P04 Camera／Input、P05 3D、P06 WebGL2→Canvas2D fallback 與 capabilities、P07 OPM.js 音效、P08 完整 hardening／六範例；細節與驗收條件見 `PLAN.md`、`ACCEPTANCE.md`。每階段驗收後立刻個別 `[Pxx]` commit，不 push。

## English

### Available now (P01)

Run in a WebGPU-capable browser on a secure origin (localhost works for local development). This phase provides Game, Clock, and a triangle rendered through the real WebGPU renderer. No Scene parameter is needed for `start()` yet. Scenes, sprites, 3D, audio and WebGL2/Canvas2D are **not implemented**. `auto` currently tries only WebGPU and reports failure if unavailable.

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

Planned, not yet available: P02 Scene/ECS; P03 textures/sprites; P04 camera/input; P05 3D rendering; P06 WebGL2/Canvas2D fallback and capabilities; P07 OPM.js audio; P08 hardening and six runnable examples. See `PLAN.md` and `ACCEPTANCE.md` for gates. Independently commit each verified `[Pxx]` phase immediately; never push automatically.

## 日本語

### 現在利用可能（P01）

WebGPU 対応ブラウザーのセキュアなオリジン（ローカル開発では localhost）で利用します。現在は Game、Clock、正式な WebGPU Renderer を経由する三角形のみ提供します。`start()` に Scene はまだ不要です。Scene、Sprite、3D、音声、WebGL2／Canvas2D は**未実装**です。`auto` も現段階では WebGPU のみ試し、利用不可なら明確に失敗します。

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

P02 Scene／ECS、P03 Texture／Sprite、P04 Camera／Input、P05 3D、P06 WebGL2／Canvas2D 自動降格と capabilities、P07 OPM.js 音声、P08 hardening と六つのサンプルは今後の段階です。`PLAN.md` と `ACCEPTANCE.md` を参照してください。各段階の検収後すぐに `[Pxx]` で**個別 commit** し、push はしません。

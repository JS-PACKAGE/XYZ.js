# XYZ.js

Browser-native TypeScript game engine for 2D and 3D.

[繁體中文](#繁體中文) · [English](#english) · [日本語](#日本語)

**1.22.0 · [Apache-2.0](LICENSE) · npm 尚未發佈 / not published / 未公開**

## 繁體中文

XYZ.js 是以瀏覽器原生 API 打造的 TypeScript 遊戲引擎，不是遊戲本體，也不包含視覺化編輯器。透過統一的 `xyz.js` 入口使用 `Game`、`Scene` 與遊戲物件，不必直接操作內部 ECS。

- **2D**：Sprite、圖集與動畫、文字、Tilemap、粒子、UI、遮罩與混合。
- **3D**：glTF／GLB、PBR 與可重用程序式材質（自然、建築、工業與生活素材，含 peyote 小米珠、鎏金希臘回紋、模壓紙漿蛋盒、秋葵切片與四葉弧形釉面磚，可用 `tint` 配合色盤調色，並可經 `workerPool` 在 Worker 生成、以 `cache` 重用，`heightMap` 可接上 parallax）、光照與陰影、骨骼動畫、instancing、後處理。
- **遊戲系統**：輸入、物理、導航、場景切換、資源載入、存檔，以及 OPM／取樣音訊。
- **渲染**：WebGPU、WebGL2、Canvas2D；各 backend 的功能不同，詳見[目前支援契約](docs/CURRENT.md)。

API 受到 three.js／PixiJS／Excalibur 啟發，但不是相容替代品。引擎無 npm runtime dependencies；第三方 vendor 隨套件附帶並保留各自授權。

### 先跑範例

需要 **Node.js ≥22.13.0** 與 **pnpm 12.6.0**。在此倉庫根目錄執行：

```sh
npx pnpm@12.6.0 install
npx pnpm@12.6.0 examples
```

瀏覽器會開啟 `http://127.0.0.1:5173/examples/`，可依功能篩選並選擇 backend。若只想啟動開發伺服器，改用 `npx pnpm@12.6.0 dev`。請透過 HTTP／HTTPS 存取，不要直接開啟 `file://`。

### 在自己的專案使用

npm 尚未發佈，請使用 [GitHub Releases](https://github.com/JS-PACKAGE/XYZ.js/releases) 的套件附件，或在本機建置封裝：

```sh
npx pnpm@12.6.0 build
npx pnpm@12.6.0 pack
```

將產生的 `xyz.js-1.22.0.tgz` 複製到你的專案，再於該專案安裝：

```sh
npx pnpm@12.6.0 add ./xyz.js-1.22.0.tgz
```

在可解析 `xyz.js` 的 TypeScript／bundler 專案中，先加入畫布：

```html
<canvas id="game"></canvas>
```

再從入口模組啟動：

```ts
import { Game } from 'xyz.js';

const game = await Game.create({ canvas: '#game', renderer: 'webgpu' });
game.addEventListener('error', (event) =>
  console.error((event as CustomEvent<Error>).detail),
);
game.start();
```

這是既有的 WebGPU triangle 入門範例；不支援 WebGPU 時會報錯。一般遊戲可省略 `renderer`，採預設 `auto`，並使用自己的 `Scene`。暫停、恢復與清理分別使用 `game.pause()`、`game.resume()`、`game.destroy()`。

需要完整專案流程，請看[使用說明](docs/USAGE-zh.md)中的獨立 2D／3D starter、Scene、Sprite 與部署範例。

### 開始前要知道

- **Fallback 只發生在初始化**：`auto` 依 WebGPU → WebGL2 → Canvas2D 嘗試；強制指定 backend 不會偷偷切換。執行中 GPU／GL 遺失預設嘗試同 backend 復原，舊 render targets／snapshots 需重建。
- **Canvas2D 不是完整替代**：僅支援 2D，不支援 3D 或 native shader effects。使用 `game.graphics.capabilities` 判斷功能，不要只看 backend 名稱。
- **音訊需要使用者操作**：在點擊等手勢中呼叫 `await game.audio.unlock()`。`game.pause()` 不會自動暫停音訊。WebGPU／AudioWorklet 需要安全來源，localhost 可用，正式部署使用 HTTPS；OPM 無法啟動時取樣／串流音訊仍可用，播放 OPM 前請確認 `game.audio.opmState === 'ready'`。
- **部署要保留完整產物**：無 bundler 時複製整個 `dist/`，包含 `dist/vendor/opm/`、其他 vendor、workers／worklets 與授權檔；不要只拿入口 JS。不要混用 CommonJS 與 ESM 建立的引擎物件。可選的 `opmModuleUrl` 能改從以 commit 釘住的 CDN 載入 OPM，但無法驗證內容完整性（見技術參考）。
- **支援不等於實機認證**：managed WebKit 不是 Safari；模擬輸入、CI 與音訊訊號量測不代表實體手把、手機、可聽輸出或所有 GPU 已驗證。實測範圍與剩餘限制以 [ACCEPTANCE](ACCEPTANCE.md) 為準。

## Examples／範例／サンプル

先從以下範例挑一個；連結指向原始碼目錄，執行時使用開發伺服器的 `/examples/<name>/`。完整清單見[範例目錄](examples/index.html)或[使用說明](docs/USAGE-zh.md)。

| 範例 / Example                           | 看什麼 / Purpose                                   |
| ---------------------------------------- | -------------------------------------------------- |
| [showcase](examples/showcase/)           | 2D＋3D＋音訊與 Scene 切換 / integrated engine demo |
| [pong](examples/pong/)                   | 小型 2D 遊戲、輸入與計分 / input and scoring       |
| [gameplay2d](examples/gameplay2d/)       | 動畫、物理、地圖與粒子 / 2D gameplay systems       |
| [rendering2d](examples/rendering2d/)     | 遮罩、混合與渲染功能 / 2D rendering                |
| [pbr3d](examples/pbr3d/)                 | 程序式材質、光照與貼圖預覽 / PBR materials         |
| [gltf3d](examples/gltf3d/)               | 模型、骨骼動畫與 morph / model animation           |
| [beacon-run](examples/beacon-run/)       | 載入到存檔、重玩的完整流程 / playable 3D reference |
| [fallback-demo](examples/fallback-demo/) | 切換 backend 與檢查能力 / backend capabilities     |

## 文件與開發 / Documentation

| 想做什麼 / Goal                                | 入口 / Reference                                                |
| ---------------------------------------------- | --------------------------------------------------------------- |
| 寫第一個遊戲 / Get started                     | [繁體中文](docs/USAGE-zh.md) · [English](docs/USAGE.md)         |
| 查功能與 backend 限制 / Check support          | [Current contracts](docs/CURRENT.md)                            |
| 查 API、生命週期與資源管理 / API and ownership | [繁體中文](docs/TECHNICAL-zh.md) · [English](docs/TECHNICAL.md) |
| 製作與部署資產 / Asset pipeline                | [Asset recipe](docs/ASSET-RECIPE.md)                            |
| 理解架構與範圍 / Architecture and scope        | [DESIGN](DESIGN.md) · [PLAN](PLAN.md)                           |
| 查歷史驗收與未驗事項 / Verification history    | [ACCEPTANCE](ACCEPTANCE.md)                                     |
| 回報安全問題 / Security                        | [Security policy](SECURITY.md)                                  |

常用命令（已安裝 pnpm 12.6.0 時可省略 `npx pnpm@12.6.0`，直接使用 `pnpm`）：

```sh
npx pnpm@12.6.0 build
npx pnpm@12.6.0 typecheck
npx pnpm@12.6.0 test
npx pnpm@12.6.0 lint
npx pnpm@12.6.0 format:check
```

`npx pnpm@12.6.0 docs:api` 產生可搜尋的 API 文件；`npx pnpm@12.6.0 build:site` 建置範例與文件網站至 `.vite/site/`，文件入口為 `docs/`，API 位於 `api/1.22.0/`。部署時保留整個網站目錄，並以支援 directory index 的 HTTP／HTTPS 伺服器提供。

README 只提供入門與導覽；各版本的階段紀錄、測試數與效能量測留在驗收文件，不視為目前版本的通用保證。

## English

XYZ.js is a browser-native TypeScript game engine with 2D/3D rendering, scenes, animation, physics, navigation, UI, input, assets and audio. Use the public `xyz.js` entry; ECS stays internal. It is not a visual editor or a drop-in replacement for three.js, PixiJS or Excalibur. There are no npm runtime dependencies; bundled vendors retain their licenses.

**Start here:** with Node.js ≥22.13.0, run `npx pnpm@12.6.0 install`, then `npx pnpm@12.6.0 examples`. Open `http://127.0.0.1:5173/examples/`. For your own project, install a GitHub release tarball or build and pack locally; npm is unpublished. The [English guide](docs/USAGE.md) covers installation, standalone 2D/3D starters and deployment.

- Procedural PBR presets cover natural, architectural, industrial and everyday surfaces, including peyote seed beads, gilded Greek key fret, molded pulp egg carton, okra cross sections and quatrefoil glazed mosaic; maps are generated once and reusable, and `tint` recolors the pigment to fit a palette, `workerPool` generates them off the main thread, `cache` reuses identical generations, and `heightMap` feeds height-map parallax.
- `auto` tries WebGPU → WebGL2 → Canvas2D at initialization only. Forced backends do not switch. Runtime GPU/GL recovery uses the same backend; recreate renderer-owned targets and snapshots.
- Canvas2D is 2D-only and rejects native shader effects. Check `game.graphics.capabilities`; see [current contracts](docs/CURRENT.md) for feature-specific limits.
- Unlock audio with `await game.audio.unlock()` inside a user gesture. Game pause does not pause audio. WebGPU/AudioWorklet need HTTPS or localhost; if OPM cannot start, samples and streams still play, so check `game.audio.opmState === 'ready'` before playing OPM assets.
- Deploy the complete `dist/` tree, including vendors, licenses, workers and worklets. Do not mix CommonJS and ESM engine instances. `build:site` produces the complete static site in `.vite/site/`. The opt-in `opmModuleUrl` can load OPM from a commit-pinned CDN instead, without integrity verification (see the technical reference).
- Managed-browser checks are not Safari, physical-device, audible-output or universal performance certification. See [ACCEPTANCE](ACCEPTANCE.md) for evidence and remaining limitations, and the [technical reference](docs/TECHNICAL.md) for API and resource ownership.

## 日本語

XYZ.js はブラウザーのネイティブ API を使う TypeScript ゲームエンジンです。2D／3D 描画、Scene、アニメーション、物理、ナビゲーション、UI、入力、アセット、音声を提供します。公開入口は `xyz.js` で、ECS は内部実装です。ビジュアルエディターや three.js／PixiJS／Excalibur の互換置換ではありません。npm runtime dependencies はなく、同梱 vendor のライセンスを保持します。

**まず動かす：** Node.js ≥22.13.0 で `npx pnpm@12.6.0 install`、続いて `npx pnpm@12.6.0 examples` を実行し、`http://127.0.0.1:5173/examples/` を開きます。npm は未公開のため、自分のプロジェクトには GitHub Release の tarball、またはローカルで build／pack したものをインストールしてください。導入・2D／3D starter・配信手順は [English guide](docs/USAGE.md) を参照してください。

- プロシージャル PBR 材質は自然・建築・工業・生活用品の表面（ペヨーテステッチのシードビーズ、金彩のグリークキー文様、モールドパルプの卵パック、オクラの輪切り、四葉形の施釉タイルを含む）を扱い、マップは一度生成して再利用でき、`tint` で顔料色をパレットに合わせ、`workerPool` で Worker 上に生成し、`cache` で同一条件の生成結果を再利用し、`heightMap` で視差用ハイトマップも生成できます。
- `auto` は初期化時だけ WebGPU → WebGL2 → Canvas2D を試します。指定 backend は切り替わりません。実行中の GPU／GL 復旧は同じ backend を使い、render targets／snapshots は再作成が必要です。
- Canvas2D は 2D 専用で native shader effects は非対応です。`game.graphics.capabilities` と[現在の契約](docs/CURRENT.md)で機能を確認してください。
- 音声はユーザー操作内で `await game.audio.unlock()` が必要です。Game の pause は音声を停止しません。WebGPU／AudioWorklet には HTTPS または localhost が必要です。OPM を起動できない場合もサンプル／ストリーム音声は再生できるため、OPM の再生前に `game.audio.opmState === 'ready'` を確認してください。
- 配信時は vendor、ライセンス、workers／worklets を含む `dist/` 全体を保持し、CommonJS と ESM のインスタンスを混在させないでください。`build:site` は完全な静的サイトを `.vite/site/` に生成します。任意の `opmModuleUrl` で commit を固定した CDN から OPM を読み込めますが、内容の完全性は検証できません（技術参照を参照）。
- managed browser の検証は Safari、実機、可聴出力、全環境の性能を保証しません。検証範囲は [ACCEPTANCE](ACCEPTANCE.md)、API と資源管理は[技術参照](docs/TECHNICAL.md)を確認してください。

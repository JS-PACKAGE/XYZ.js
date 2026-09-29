# XYZ.js 設計與階段邊界

## 目前交付：P01 WebGPU Foundation

`xyz.js` npm 版本設定為 `1.0.0`，**不表示八階段全部完成**。P01 的路徑是 `src/index.ts`（統一公開入口）→ `packages/core` 的 Game／Clock → `packages/graphics` 的 Renderer → WebGPU canvas。`examples/triangle/` 透過 Game 走這條正式路徑，不建立第二套範例渲染器。

- Game 為 `EventTarget`，以 `Game.create(options)` 非同步取得 renderer；以 `requestAnimationFrame` 推動 Clock 與 Renderer beginFrame→render→endFrame。`game.start()` 目前不接 Scene；Scene 與 ECS 待 P02。
- `game.state` 為 `idle | running | paused | destroyed`。支援 `pause()`、`resume()`、`resize(width,height)`、`destroy()`；`game.clock` 提供 `deltaTime`（秒）、`elapsedTime`（秒）、`frame`、`fps`；時間增量限制與預設 viewport 等可調常數集中 `src/data/`。隱藏分頁暫停計時，不讓回切後的時間累積進遊戲步長。
- 畫布邏輯尺寸預設 1280×720 CSS 像素；pixel ratio 預設上限 2，可設定尺寸及 `autoResize`。如需跟隨容器，可在已有尺寸的容器內設定 canvas `style="width:100%;height:100%"`；Game 只在未指定 inline 尺寸時補預設 CSS 尺寸。resize 更新 backing 與 renderer，不應持續重建靜態資源。
- Renderer 介面隔離 backend；對一般使用者不暴露 `GPUDevice` 等內部資源。P01 的 `webgpu` 使用 WGSL triangle；`renderer:'auto'` **只試 WebGPU**，缺乏 WebGPU 即明確失敗，強制 `webgl2`／`canvas2d` 則明確表示尚未支援。失去 GPU device 或 GPU 錯誤透過 callback 回報，Game 暫停並觸發 `CustomEvent<Error>('error')`；呼叫者需監聽。
- 發佈為 TypeScript strict ESM 與宣告檔；`tsc` 保留目錄結構，入口 `dist/src/index.js`，内部相對引用含 `.js`。npm 透過 `exports` 使用相同入口；無 bundler vendor 時須**完整複製** `dist/` 以維持相對路徑，從目標 HTTP 伺服器 import 其 `dist/src/index.js`，不要只抽出入口一檔。WebGPU 要求支援環境及安全來源；本機 localhost 可用於開發。

## 後續架構（未實作）

- P02 Scene 是 lifecycle/world 容器而非 Entity；Entity／Component／System 為內核，Transform／Math 支援對外物件 facade。P03 將 Asset cache 與 renderer-specific GPU resources 分離，Sprite 支援貼圖、opacity、z-order，避免每 Sprite 單獨 pipeline。
- P04 Camera2D、Keyboard、Pointer Events、Gamepad 與遊戲邏輯分離；Screen↔World 有可測逆轉換。P05 加 Mesh（含自訂 vertex data 與 cube／sphere／plane／quad）、貼圖材質、PerspectiveCamera、depth、ambient＋directional lighting；同 Scene 先渲染 3D 再按 z-order 渲染 2D。v1 路線不含進階 3D、模型載入或自製 Shader IR。
- P06 實現固定 `auto` 次序 WebGPU→WebGL2→Canvas2D（含初始化失敗 fallback），強制指定失敗**絕不**自動切換；`graphics.capabilities` 引導遊戲邏輯，不依賴 backend 字串。WebGL2 內建 GLSL ES，Canvas2D 僅基本 2D、`threeD:false`，不實作 software rasterizer。
- P07 音效 core 採 OPM.js v1.1.0 官方發佈包（需驗證 SHA256SUMS、保留 LICENSE 與完整 `dist/` 工作檔案），引擎只負責 facade／channels／game 與 Scene lifecycle，不 fork 也不重寫 DSP。設計受 8 聲部（含 release）及 256 worklet 排程佇列限制；首次使用者手勢前遵守 autoplay policy。
- P08 收斂完整 Error hierarchy、logging、裝置遺失等邊界和六個驗收範例。每階段驗證證據記錄於 `ACCEPTANCE.md`，驗收後立即獨立 `[Pxx]` commit，絕不 push。

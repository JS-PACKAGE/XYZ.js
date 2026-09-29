# XYZ.js 設計與階段邊界

## 目前交付：P01–P06

`xyz.js` npm 版本設定為 `1.0.0`，**不表示八階段全部完成**。P01 的路徑是 `src/index.ts`（統一公開入口）→ `packages/core` 的 Game／Clock → `packages/graphics` 的 Renderer → WebGPU canvas。`examples/triangle/` 透過 Game 走這條正式路徑，不建立第二套範例渲染器。

- Game 為 `EventTarget`，以 `Game.create(options)` 非同步取得 renderer；requestAnimationFrame 依序推動 Clock→Scene.update→Systems.update→Renderer。`game.start(scene?)` 可非同步準備 Scene；需等待切換結果時使用 `await game.setScene(scene)`。SceneObject 提供 ownership，GameObject 加入 Transform2D；ECS 保持內核，使用者透過 scene.add 操作物件。
- `game.state` 為 `idle | running | paused | destroyed`。支援 pause／resume／resize／destroy；同一 Canvas 在非同步初始化開始前即被保留，成功前後皆不可由第二個 Game 接管，初始化失敗或 destroy 釋放 ownership。第一個執行中 failure 會被保留並送出 error；失敗後 resume 明確拒絕，避免重試已遺失的 GPUDevice。
- `game.clock` 提供模擬 delta／elapsed（秒）、tick frame 數與未 clamp 幀間隔計算的瞬時 fps。隱藏分頁及 pause 不累積時間；預設最大 delta 0.1s 不應掩飾真正低幀率。
- 畫布以 size containment／contain-intrinsic-size 隔離 CSS intrinsic 尺寸與 backing pixels；預設 1280×720 CSS 像素，預設 pixel ratio 上限 2。作者 width／height CSS（含 cascade layer）仍主導 layout；autoResize 以 content box 同步 GPU，手動 resize 更新 intrinsic fallback。越界 resize 必須保留舊 CSS／logical／backing 狀態；清理還原引擎接管且尚未被使用者改動的 inline containment。
- Renderer 隔離 backend，P01 僅 WebGPU。JS render-pass descriptor／attachment／submit 容器跨幀重用，但每幀仍建立必要的 GPU view／encoder／command buffer，消費後清除暫時參照。viewport 在 resize 時計算，GPU 上限驗證在 canvas 寫入之前。初始化的各 await 邊界檢查 teardown，晚到的 GPUDevice 必須銷毀。
- `auto` 依 WebGPU→WebGL2→Canvas2D 降級，強制 backend 失敗不切換。auto 使用獨立 backend canvas 加原 canvas 的 2D presentation，避免不可逆 context binding 阻止 fallback；強制 backend 直接渲染。device lost／context lost 使 Game 暫停並送出 error；不做自動 device recovery。
- 發佈為 TypeScript strict ESM 與宣告檔；`tsc` 保留目錄結構，入口 `dist/src/index.js`，内部相對引用含 `.js`。npm 透過 `exports` 使用相同入口；無 bundler vendor 時須**完整複製** `dist/` 以維持相對路徑，從目標 HTTP 伺服器 import 其 `dist/src/index.js`，不要只抽出入口一檔。WebGPU 要求支援環境及安全來源；本機 localhost 可用於開發。
- API 細節、Clock 算式、尺寸 ownership、錯誤策略與效能量測方法見 [技術參考](docs/TECHNICAL.md)；前後驗收證據見 `ACCEPTANCE.md`。範例的 BFCache `pagehide.persisted` 不銷毀 Game，避免瀏覽器恢復已經 teardown 的頁面。

## World 與後續架構

- P02 Scene 已完成：候選初始化成功才發佈，準備失敗保留舊 Scene，取消使用 AbortSignal，清理同步且只執行一次。Scene／物件均不可跨 owner 共用；移除物件可重新加入，destroy 則終結生命週期。P03 已將 Asset cache 與 renderer-specific GPU resources 分離，Sprite 支援貼圖、opacity、z-order，共用 instanced pipeline。
- P04 已完成 Camera2D 與輸入。P05 已完成 Vector3／Quaternion／Matrix4／Transform3D、Mesh（自訂頂點與 cube／sphere／plane／quad）、貼圖材質、PerspectiveCamera、depth、ambient＋directional lighting；同 Scene 先渲染 3D 再按 z-order 疊加 2D。GPU 幾何／材質資源與 CPU 資產分離，resize 只更換 depth attachment。v1 路線不含進階 3D、模型載入或自製 Shader IR。
- P06 已完成三級初始化 fallback、capabilities、WebGL2 GLSL 2D／3D、Canvas2D Sprite 與跨 backend Primitive2D。Canvas2D threeD=false，遇可見 Mesh 明確拒絕；不做 software rasterizer。Capabilities 描述 backend 硬體能力，不表示已公開 custom shader／compute facade。
- P07 音效 core 採 OPM.js v1.1.0 官方發佈包（需驗證 SHA256SUMS、保留 LICENSE 與完整 `dist/` 工作檔案），引擎只負責 facade／channels／game 與 Scene lifecycle，不 fork 也不重寫 DSP。設計受 8 聲部（含 release）及 256 worklet 排程佇列限制；首次使用者手勢前遵守 autoplay policy。
- P08 收斂完整 Error hierarchy、logging、裝置遺失等邊界和六個驗收範例。每階段驗證證據記錄於 `ACCEPTANCE.md`，驗收後立即獨立 `[Pxx]` commit，絕不 push。

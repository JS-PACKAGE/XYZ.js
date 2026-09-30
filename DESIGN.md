# XYZ.js 設計與階段邊界

## 目前交付：P01–P08

`xyz.js` npm 版本設定為 `1.0.0`，P01–P08 驗收證據見 `ACCEPTANCE.md`，不代表已發佈 npm 或已驗證所有瀏覽器。正式路徑是 `src/index.ts`（統一公開入口）→ `packages/core` 的 Game／Clock → `packages/graphics` 的 Renderer；範例不建立第二套渲染器。

- Game 為 `EventTarget`，以 `Game.create(options)` 非同步取得 renderer；requestAnimationFrame 依序同步 DPR→Clock→Camera2D viewport→Input→Scene.update→World Systems→Renderer，最後清除 input edges。`game.start(scene?)` 可非同步準備 Scene；需等待切換結果時使用 `await game.setScene(scene)`。SceneObject 提供 ownership，GameObject 加入 Transform2D；ECS 保持內核，使用者透過 scene.add 操作物件。
- `game.state` 為 `idle | running | paused | destroyed`。支援 pause／resume／resize／destroy；同一 Canvas 在非同步初始化開始前即被保留，初始化失敗或 destroy 釋放 ownership。第一個 fatal frame／graphics failure 會被保留並送出 error；失敗後 resume 明確拒絕。Scene 準備失敗與 Audio 排程錯誤也可送出 error，但不把 graphics 鎖成 fatal。
- `game.clock` 提供模擬 delta／elapsed（秒）、tick frame 數與未 clamp 幀間隔計算的瞬時 fps。隱藏分頁及 pause 不累積時間；預設最大 delta 0.1s 不應掩飾真正低幀率。
- 畫布以 size containment／contain-intrinsic-size 隔離 CSS intrinsic 尺寸與 backing pixels；預設 1280×720 CSS 像素，預設 pixel ratio 上限 2。作者 width／height CSS（含 cascade layer）仍主導 layout；autoResize 以 content box 同步 GPU，手動 resize 更新 intrinsic fallback。越界 resize 必須保留舊 CSS／logical／backing 狀態；清理還原引擎接管且尚未被使用者改動的 inline containment。
- Renderer 隔離三種 backend。WebGPU 的 JS render-pass descriptor／attachment／submit 容器跨幀重用，但每幀仍建立必要的 GPU view／encoder／command buffer，消費後清除暫時參照。viewport 在 resize 時計算，GPU 上限驗證在 canvas 寫入之前。初始化各 await 邊界檢查 teardown，晚到的 GPUDevice 必須銷毀。
- `auto` 依 WebGPU→WebGL2→Canvas2D 降級，強制 backend 失敗不切換。auto 使用獨立 backend canvas 加原 canvas 的 2D presentation，避免不可逆 context binding 阻止 fallback；強制 backend 直接渲染。device lost／context lost 使 Game 暫停並送出 error；不做自動 device recovery。
- 產物為 TypeScript strict ESM 與宣告檔；build 依序執行 `tsc`、逐檔最小化自有 JavaScript 並串接 source maps、原樣複製官方已最小化 vendor。入口 `dist/src/index.js`，內部相對引用含 `.js`，保留公開名稱與類別名稱。npm `exports` 使用相同入口；無 bundler 部署須**完整複製** `dist/`（含 `dist/vendor/opm/`），不可只抽出入口。WebGPU／AudioWorklet 要求安全來源，localhost 可用。根套件仍 UNLICENSED、未 npm publish；OPM 自有 Apache-2.0 LICENSE 不代表根套件授權。
- API 細節、Clock 算式、尺寸 ownership、錯誤策略與效能量測方法見 [繁體中文技術參考](docs/TECHNICAL-zh.md)／[English](docs/TECHNICAL.md)；前後驗收證據見 `ACCEPTANCE.md`。範例的 BFCache `pagehide.persisted` 不銷毀 Game，避免瀏覽器恢復已經 teardown 的頁面。

## 已交付子系統與限制

- P02 Scene 已完成：候選初始化成功才發佈，準備失敗保留舊 Scene，取消使用 AbortSignal，清理同步且只執行一次。Scene／物件均不可跨 owner 共用；移除物件可重新加入，destroy 則終結生命週期。P03 已將 Asset cache 與 renderer-specific GPU resources 分離，Sprite 支援貼圖、opacity、z-order，共用 instanced pipeline。
- P04 已完成 Camera2D 與輸入。P05 已完成 Vector3／Quaternion／Matrix4／Transform3D、Mesh（自訂頂點與 cube／sphere／plane／quad）、貼圖材質、PerspectiveCamera、depth、ambient＋directional lighting；同 Scene 先渲染 3D 再按 z-order 疊加 2D。GPU 幾何／材質資源與 CPU 資產分離，resize 只更換 depth attachment。v1 路線不含進階 3D、模型載入或自製 Shader IR。
- P06 已完成三級初始化 fallback、capabilities、WebGL2 GLSL 2D／3D、Canvas2D Sprite 與跨 backend Primitive2D。Canvas2D threeD=false，遇可見 Mesh 明確拒絕；不做 software rasterizer。Capabilities 描述 backend 硬體能力，不表示已公開 custom shader／compute facade。
- P07 已整合 OPM.js v1.1.0 官方完整 dist／LICENSE／release checksum，build 原樣複製 vendor。八個獨立 OPM instance 各保留一個聲部，總預算含 release，overflow 只 hard-reset 最舊 SFX 的 worklet；不影響 BGM，也不修改官方 DSP。代價是八個 AudioContexts/worklets。首次手勢 unlock 前不建 AudioContext；bounded lookahead 避免填滿官方 256-event queue；Scene 清理取消非 persistent 音訊。
- P08 已完成完整 Error hierarchy、可調等級 logger、loss 後 resize 拒絕與 cleanup 邊界、六個驗收範例及 1,000 Sprite benchmark。實際 device/context loss 使 Game paused 並拒絕 resume；沒有自動 recovery。各階段獨立 `[Pxx]` commit，不 push。Safari／Edge／Firefox、實體 gamepad、真實背景分頁／BFCache 矩陣、跨螢幕 DPR 與 driver reset 仍未認證。
- 後續優化保持公開 API：World 按需穩定壓縮 Systems、WebGPU 只在 logical viewport 改變時重傳對應 uniform；Keyboard 在 focus 轉入 editable 後仍處理既有按鍵釋放。時間量測未證明 CPU／FPS 改善，見 ACCEPTANCE，不以 API call 減少冒充 throughput 提升。
- 安全維護：圖片與音訊共用內部 bounded response reader，依實際 response stream bytes 計數，不信任 Content-Length。JSON 在 byte cap 後解析並檢查 notes 上限；Texture 在解碼後檢查尺寸／像素且超限釋放。依使用者選擇保留所有瀏覽器支援圖片格式，因此不宣稱防止解碼瞬間放大或提供全域 cache 預算。

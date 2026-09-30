# XYZ.js 設計與階段邊界

## 已驗收基礎：P01–P08

`xyz.js` 套件版本設定為 `1.1.0`，P01–P08 驗收證據見 `ACCEPTANCE.md`，不代表已發佈 npm 或已驗證所有瀏覽器。正式路徑是 `src/index.ts`（統一公開入口）→ `packages/core` 的 Game／Clock → `packages/graphics` 的 Renderer；範例不建立第二套渲染器。

- Game 為 `EventTarget`，以 `Game.create(options)` 非同步取得 renderer；requestAnimationFrame 依序同步 DPR→Clock→Camera2D viewport→Input→Scene timers→Scene animations→Scene.update→World Systems→Renderer，最後清除 input edges。`game.start(scene?)` 可非同步準備 Scene；需等待切換結果時使用 `await game.setScene(scene)`。SceneObject 提供 ownership，GameObject 加入 Transform2D；ECS 保持內核，使用者透過 scene.add 操作物件。
- `game.state` 為 `idle | running | paused | destroyed`。支援 pause／resume／resize／destroy；同一 Canvas 在非同步初始化開始前即被保留，初始化失敗或 destroy 釋放 ownership。第一個 fatal frame／graphics failure 會被保留並送出 error；失敗後 resume 明確拒絕。Scene 準備失敗與 Audio 排程錯誤也可送出 error，但不把 graphics 鎖成 fatal。
- `game.clock` 提供模擬 delta／elapsed（秒）、tick frame 數與未 clamp 幀間隔計算的瞬時 fps。隱藏分頁及 pause 不累積時間；預設最大 delta 0.1s 不應掩飾真正低幀率。
- 畫布以 size containment／contain-intrinsic-size 隔離 CSS intrinsic 尺寸與 backing pixels；預設 1280×720 CSS 像素，預設 pixel ratio 上限 2。作者 width／height CSS（含 cascade layer）仍主導 layout；autoResize 以 content box 同步 GPU，手動 resize 更新 intrinsic fallback。越界 resize 必須保留舊 CSS／logical／backing 狀態；清理還原引擎接管且尚未被使用者改動的 inline containment。
- Renderer 隔離三種 backend。WebGPU 的 JS render-pass descriptor／attachment／submit 容器跨幀重用，但每幀仍建立必要的 GPU view／encoder／command buffer，消費後清除暫時參照。viewport 在 resize 時計算，GPU 上限驗證在 canvas 寫入之前。初始化各 await 邊界檢查 teardown，晚到的 GPUDevice 必須銷毀。
- `auto` 依 WebGPU→WebGL2→Canvas2D 降級，強制 backend 失敗不切換。auto 使用獨立 backend canvas 加原 canvas 的 2D presentation，避免不可逆 context binding 阻止 fallback；強制 backend 直接渲染。device lost／context lost 使 Game 暫停並送出 error；不做自動 device recovery。
- 產物為 TypeScript strict ESM 與宣告檔；build 依序執行 `tsc`、逐檔最小化自有 JavaScript 並串接 source maps、原樣複製官方已最小化 vendor。入口 `dist/src/index.js`，內部相對引用含 `.js`，保留公開名稱與類別名稱。npm `exports` 使用相同入口；無 bundler 部署須**完整複製** `dist/`（含 `dist/vendor/opm/`），不可只抽出入口。WebGPU／AudioWorklet 要求安全來源，localhost 可用。根套件仍 UNLICENSED、未 npm publish；OPM 自有 Apache-2.0 LICENSE 不代表根套件授權。
- API 細節、Clock 算式、尺寸 ownership、錯誤策略與效能量測方法見 [繁體中文技術參考](docs/TECHNICAL-zh.md)／[English](docs/TECHNICAL.md)；前後驗收證據見 `ACCEPTANCE.md`。範例的 BFCache `pagehide.persisted` 不銷毀 Game，避免瀏覽器恢復已經 teardown 的頁面。

## 已交付子系統與限制

- P02 Scene 已完成：候選初始化成功才發佈，準備失敗保留舊 Scene，取消使用 AbortSignal，清理同步且只執行一次。Scene／物件均不可跨 owner 共用；移除物件可重新加入，destroy 則終結生命週期。P03 已將 Asset cache 與 renderer-specific GPU resources 分離，Sprite 支援貼圖、opacity、z-order，共用 instanced pipeline。
- P04 已完成 Camera2D 與輸入。原 P05 範圍為 Vector3／Quaternion／Matrix4／Transform3D、Mesh（自訂頂點與 cube／sphere／plane／quad）、貼圖材質、PerspectiveCamera、depth、ambient＋directional lighting；同 Scene 先渲染 3D 再按 z-order 疊加 2D。原階段不含進階 3D／模型載入；下列 P09–P12 已擴充此範圍，自製 Shader IR 仍非目標。
- P06 已完成三級初始化 fallback、capabilities、WebGL2 GLSL 2D／3D、Canvas2D Sprite 與跨 backend Primitive2D。Canvas2D threeD=false，遇可見 Mesh 明確拒絕；不做 software rasterizer。Capabilities 描述 backend 硬體能力，不表示已公開 custom shader／compute facade。
- P07 已整合 OPM.js v1.1.0 官方完整 dist／LICENSE／release checksum，build 原樣複製 vendor。八個獨立 OPM instance 各保留一個聲部，總預算含 release，overflow 只 hard-reset 最舊 SFX 的 worklet；不影響 BGM，也不修改官方 DSP。代價是八個 AudioContexts/worklets。首次手勢 unlock 前不建 AudioContext；bounded lookahead 避免填滿官方 256-event queue；Scene 清理取消非 persistent 音訊。
- P08 已完成完整 Error hierarchy、可調等級 logger、loss 後 resize 拒絕與 cleanup 邊界、六個驗收範例及 1,000 Sprite benchmark。實際 device/context loss 使 Game paused 並拒絕 resume；沒有自動 recovery。各階段獨立 `[Pxx]` commit，不 push。Safari／Edge／Firefox、實體 gamepad、真實背景分頁／BFCache 矩陣、跨螢幕 DPR 與 driver reset 仍未認證。
- 後續優化保持公開 API：World 按需穩定壓縮 Systems、WebGPU 只在 logical viewport 改變時重傳對應 uniform；Keyboard 在 focus 轉入 editable 後仍處理既有按鍵釋放。時間量測未證明 CPU／FPS 改善，見 ACCEPTANCE，不以 API call 減少冒充 throughput 提升。
- 安全維護：圖片與音訊共用內部 bounded response reader，依實際 response stream bytes 計數，不信任 Content-Length。JSON 在 byte cap 後解析並檢查 notes 上限；Texture 在解碼後檢查尺寸／像素且超限釋放。依使用者選擇保留所有瀏覽器支援圖片格式，因此不宣稱防止解碼瞬間放大或提供全域 cache 預算。

## v1.1 新增能力

- Text2D 繼承 Sprite，Canvas2D 只負責 rasterization，輸出 Texture 仍走正式 renderer；不用 DOM overlay 假冒文字繪製。Style 固定、內容非同步更新，latest-request-wins 並釋放過期結果；自有貼圖與外部借用貼圖分開管理，字型需使用者預先載入。尺寸／像素在完整 canvas 配置前檢查。
- SceneTimers 使用同一 Game Clock 的模擬 delta，在 subclass update 前推進；候選 Scene／paused／hidden 時不推進。動態 Set 維持註冊順序，tick 不複製整份 timer 列表；新工作延至下一 tick，repeat 每 tick 至多一次、跳過漏掉的週期。Handle 取消清除 callback 參照，Scene teardown 先銷毀 timers。同步 callback exception 走既有 fatal frame error。
- Pong 的 Text2D／timers 整合不新增 renderer、不加 runtime dependency，不實作物理、文字動畫或編輯器；3D 動畫另屬 P10。既有 v1.0 tag／release 不改動。

## three.js 參考擴充：P09–P12

- Object3D／Group／Mesh 共用 local Transform3D，worldMatrix 依祖先變換組合，worldVisible 包含祖先可見性。Scene 註冊整個子樹，禁止 cycle／跨 Scene ownership；移除解除註冊，destroy 清理子樹。
- Scene 可替換 PerspectiveCamera／OrthographicCamera，提供 lookAt；OrbitControls 只接管指定 Canvas 並需 destroy。Raycaster 使用世界距離精確雙面三角形交點，涵蓋階層、instance 與變形後的 skin。
- GLTFLoader 支援受預算限制的 glTF 2.0／GLB triangles、TRS、材質／textures／skins 與 transform clips；必要 extension、morph、其他 topology 明確拒絕。GLTFAsset.dispose 由應用負責，Scene 清理不代替 loader-owned textures 的釋放。
- Game 在 timers 後、使用者 update 前推進 scene.animations，使用同一模擬 delta；mixer 依 action 插入順序寫入，不提供 blending。CPU skinning 更新自有 geometry，vertex-only markUpdated 通知 GPU cache，index topology 不可變。
- WebGPU／WebGL2 共用 PBR slots、8 point＋8 spot 上限、方向光 3×3 PCF shadows、indexed instancing 與 HDR offscreen→exposure／ACES／9-tap bloom→2D。WebGL2 缺 EXT_color_buffer_float 時啟用 HDR 後處理明確失敗；不含 point／spot shadows 或環境 IBL。
- API 是 three.js-inspired，非 drop-in 相容或全部 addons；Canvas2D 仍 2D-only、沒有新增 runtime dependency。版本仍 1.1.0，由所有者決定升版／發佈；本輪不自動 commit／push／publish。實測與未完成驗證以 ACCEPTANCE 為準。

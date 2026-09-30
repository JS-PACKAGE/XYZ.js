# XYZ.js 執行計畫

## 強制執行範圍（硬規則）

- 依《XYZ.js — Web 遊戲引擎開發企劃書》實作瀏覽器遊戲引擎，非遊戲本體。套件版本為 **1.1.0**；**P01–P08 已完成並各自驗收提交**，目前進入維護。企劃書原 v0.0.1–v0.0.8 對應 P01–P08；完成狀態以 [驗收紀錄](ACCEPTANCE.md) 為準，版本號不代表跨瀏覽器認證或 npm 發佈。
- 每個里程碑的驗收硬指標全部通過後，**立即單獨提交該里程碑的 git commit**，commit message 必須以該階段前綴開頭（例如 `[P01] WebGPU Foundation`）；不得合併兩個或更多里程碑為同一 commit，亦不得提前提交未通過驗收的階段。**嚴禁 push，由使用者親自推送。**
- 開發者對外使用統一 `xyz.js` API；ECS 保持內部資料模型。`auto` 已提供 WebGPU→WebGL2→Canvas2D 初始化降級，強制指定 backend 不得靜默切換；執行中 loss 不自動切換 backend。
- 本版不做 Visual Editor、Visual Scripting、Shader Graph、Physics、Networking、Particle／Animation／Tilemap／Navigation／Inspector／Scene GUI Editor、JS Software Rasterizer、自製 Shader IR／transpiler、Native Desktop Runtime；也不包含 PBR、法線貼圖、陰影、骨骼動畫、glTF 載入器。
- TypeScript strict、Web 原生 API、零 runtime dependencies（P07 的 OPM.js 官方 vendor 發佈包除外）。禁止為了過關而另寫獨立 triangle demo 繞開正式 Game→Renderer→WebGPU 路徑。

## 倉庫結構

- `src/`：公開統一入口及集中可調常數 `src/data/`。
- `packages/core/`：Game、Clock、Scene、2D／3D 物件與相機、logger；`packages/graphics/`：Renderer 契約、WebGPU／WebGL2／Canvas2D 與 auto presentation。
- `packages/ecs/`：內部 World；`packages/math/`：2D／3D 數學；`packages/assets/`：Texture／cache；`packages/input/`：Keyboard／Pointer／Gamepad；`packages/audio/`：OPM orchestration。
- `examples/`：`triangle/`、`sprite/`、`cube3d/`、`pong/`、`fallback-demo/`、`showcase/` 六個可執行範例；`benchmarks/sprites/`：1,000 Sprite 可重現負載量測。
- `vendor/opm/`：官方 OPM.js v1.1.0 完整 dist、LICENSE、來源／checksum manifest；`scripts/copy-vendor.mjs` 在 build 後原樣複製到 `dist/vendor/opm/`。
- `tests/`：行為測試；`dist/`：JS／宣告與 vendor 產物；`docs/TECHNICAL.md`／`TECHNICAL-zh.md`：英文／繁體中文技術參考；`docs/USAGE.md`／`USAGE-zh.md`：英文／繁體中文使用說明；根目錄含 pnpm workspace、文件六件套與 `.nojekyll`（不表示已部署）。

## 里程碑與階段提交

| 階段（對應企劃原階段）                | 新增實作與範例                                                                                                                                                      | 通過後的獨立提交前綴 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| P01 — WebGPU Foundation（已驗收）     | Game、Clock、Game Loop、Canvas、Graphics 抽象、WebGPU 初始化、WGSL Renderer、triangle                                                                               | `[P01]`              |
| P02 — Core World（已驗收）            | Scene lifecycle／切換／清理、Entity／Component／System、Transform、2D Math                                                                                          | `[P02]`              |
| P03 — Texture & Sprite（已驗收）      | 有 cache 的 Asset Loader、Texture、Sprite、WGSL sprite pipeline、alpha、transform、z-order、sprite 範例                                                             | `[P03]`              |
| P04 — Camera & Input（已驗收）        | Camera2D、Keyboard／Pointer Events／Gamepad、resize handling、pong 範例                                                                                             | `[P04]`              |
| P05 — 3D Rendering Pipeline（已驗收） | Vector3／Matrix4／Quaternion、3D Transform、Mesh（基本幾何及自訂頂點）、貼圖材質、PerspectiveCamera、深度測試、ambient＋directional 光照、WGSL 3D 管線、cube3d 範例 | `[P05]`              |
| P06 — Compatibility（已驗收）         | WebGL2（含 3D 管線）／Canvas2D、三級 auto fallback、Capability System、fallback-demo                                                                                | `[P06]`              |
| P07 — Audio（已驗收）                 | OPM.js v1.1.0 官方 release 完整 vendor＋LICENSE＋SHA256 驗證、AudioManager／AudioAsset／AudioChannel／OPMAdapter、unlock、聲部預算、Scene 整合                      | `[P07]`              |
| P08 — Hardening（已驗收）             | 完整 Error hierarchy／Logging、device lost／resize 邊界、triangle／sprite／cube3d／pong／fallback-demo／showcase 全數可跑、測試與文件收斂                           | `[P08]`              |

## 技術要點

- Game 以 async factory 建立，`requestAnimationFrame` 驅動 Clock→更新→Renderer；秒為 delta 單位，最大 delta 預設 0.1s 並避免隱藏分頁時間累積，生命週期包含 pause／resume／resize／destroy。
- Renderer 隔離 backend；WebGPU 使用 WGSL，WebGL2 使用 GLSL。P06 已完成包含初始化失敗的三級 fallback；強制 backend 不切換，執行中 device/context loss 回報 fatal error。
- 遊戲邏輯以 `graphics.capabilities` 判斷功能；WebGL2 使用 GLSL ES，Canvas2D 只支援 2D 並回報 `threeD === false`。Capabilities 描述 backend 能力，不代表已有公開 custom shader／compute API。
- Scene 為 world/lifecycle 容器，不是 Entity；公開 Sprite 等物件 facade，ECS 為內核。Asset cache 與 backend GPU resource 分離；同 Scene 的 3D 先作 depth-test，再以 z-order 疊加 2D。
- Audio 使用未修改的官方 OPM.js DSP／worklet。XYZ.js 以八個隔離 OPM instances 管理八個 slot（含 release），只搶最舊 SFX，不切斷 BGM；每個 worklet 的 256-event queue 以 bounded lookahead 控制。手勢 unlock 前不建立 AudioContext，代價是 unlock 後共八個 contexts／worklets。
- 可調值集中 `src/data/`；ESM 相對匯入附 `.js`，輸出 `.d.ts`，使 npm 與無 bundler 的 vendor 複製兩種發佈路徑皆可使用。

## 驗收硬指標

1. **P01**：triangle 經 Game→Renderer→WebGPU 正式路徑畫出；不支援環境明確報錯。
2. **P02**：Scene 可建立、切換、清理；ECS 增刪改查單元測試通過。
3. **P03**：多個 Sprite 共用 texture 時不重複下載；z-order／opacity 正確。
4. **P04**：Screen↔World 座標轉換有測試；resize 不變形、不重建整份資源。
5. **P05**：透視視角下貼圖 cube／sphere 的 depth 與光照正確；同 Scene 中 3D／2D 混排順序正確。
6. **P06**：三級環境 `auto` 選對 backend；強制失敗回對應 Error 不切換；三 backend 的 Sprite 位置／順序／透明度視覺一致；WebGL2 3D 與 WebGPU 視覺一致，Canvas2D `threeD === false`。
7. **P07**：首次手勢前無音訊輸出；8 聲部 BGM＋SFX 溢位只丟最舊 SFX。
8. **P08**：六個範例皆能執行（cube3d 在 Canvas2D 明確不跑 3D；showcase 同場 2D＋3D＋音效）；Vitest 全綠、交付清單全過。效能參考值為 Apple Silicon＋Chrome WebGPU、1000 個常駐 Sprite 60fps，須實測，非承諾。

各項實際證據與待驗事項記在 `ACCEPTANCE.md`；未經瀏覽器檢驗不得標為完成。每階段**先驗收、再立即單獨 commit、絕不 push**。

## 維護與發佈前待驗項

P01–P08 的功能驗收與獨立 commits 見 [ACCEPTANCE.md](ACCEPTANCE.md)。下列項目是已交付版本的驗證限制／發佈前工作，不是尚未實作的階段。

| 項目             | 已確認                                                                                   | 尚未確認或需決策                                                           |
| ---------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 瀏覽器與輸入     | managed Chromium 150；鍵盤／pointer 互動；gamepad snapshot 測試                          | Safari／Edge／Firefox、實體 gamepad                                        |
| 視窗與 lifecycle | CSS content-box／DPR／resize、visibility／BFCache 事件模擬、實際 API device/context loss | 真實背景分頁／BFCache 往返矩陣、跨螢幕 DPR、真實 driver reset              |
| 效能             | 1,000 Sprite WebGPU direct，約 60fps；CPU submit 平均 0.6358ms                           | GPU timestamps／GC、其他硬體與 auto presentation copy 的效能比較           |
| 封裝與授權       | Node 26／pnpm 12.6.0、tarball JS／TS、無 bundler ESM 消費端                              | 所有者決定授權後才能公開發佈；目前 UNLICENSED、未 npm publish，不自動 push |

## 交付前自檢

- [x] 已完成 P01–P08 範圍；統一公開入口、ESM 相對路徑與 `.d.ts` 契約維持一致。
- [x] build、typecheck、test、lint、format:check 已執行；結果記於 `ACCEPTANCE.md`。
- [x] 真實 Chromium 開啟六個範例，確認 showcase 圖形＋音訊及 loss 錯誤分支；其他瀏覽器尚未驗證。
- [x] 六件文件區分現在／未來功能，未留臨時測試檔或公開測試掛鉤。
- 提交規則：每個 Pxx 驗收後立刻獨立 commit，不併入下一階段、不 push。

開始執行。

## v1.0 後的實用性擴充

依使用者要求自行評估並追加：優先補足 Canvas 文字與 scene-local 模擬計時器，而非跨入現有非目標的 Physics／Animation／Tilemap。新增 Text2D、SceneTimers／TimerHandle，整合 Pong 畫布計分、延遲發球與 pause／restart 操作。此輪不重編 P01–P08、不重寫原驗收、不自動發佈新版本；驗證見 ACCEPTANCE 最新紀錄。

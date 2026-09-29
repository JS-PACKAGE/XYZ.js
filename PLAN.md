# XYZ.js 執行計畫

## 強制執行範圍（硬規則）

- 依《XYZ.js — Web 遊戲引擎開發企劃書》實作瀏覽器遊戲引擎，非遊戲本體。套件版本直接設定 **1.0.0**；本次僅交付 **P01 WebGPU Foundation**。企劃書原 v0.0.1–v0.0.8 開發步驟對應 P01–P08，原 v0.1 範圍為本路線目標；套件版本號不代表八階段已完成，不得將規劃功能寫成已實作。
- 每個里程碑的驗收硬指標全部通過後，**立即單獨提交該里程碑的 git commit**，commit message 必須以該階段前綴開頭（例如 `[P01] WebGPU Foundation`）；不得合併兩個或更多里程碑為同一 commit，亦不得提前提交未通過驗收的階段。**嚴禁 push，由使用者親自推送。**
- 開發者對外使用統一 `xyz.js` API；ECS 保持內部資料模型。強制指定 backend 不得靜默切換；`auto` 的三級降級僅於 P06 完成，之前不可宣稱相容 WebGL2／Canvas2D。
- 第一階段不做 Visual Editor、Visual Scripting、Shader Graph、Physics、Networking、Particle／Animation／Tilemap／Navigation／Inspector／Scene GUI Editor、JS Software Rasterizer、自製 Shader IR／transpiler、Native Desktop Runtime；本路線也不包含 PBR、法線貼圖、陰影、骨骼動畫、glTF 載入器。
- TypeScript strict、Web 原生 API、零 runtime dependencies（P07 的 OPM.js 官方 vendor 發佈包除外）。禁止為了過關而另寫獨立 triangle demo 繞開正式 Game→Renderer→WebGPU 路徑。

## 倉庫結構

- `src/`：公開統一入口及集中可調常數 `src/data/`。
- `packages/core/`：Game、Clock、loop 等 runtime；`packages/graphics/`：Renderer 介面與 WebGPU backend。這兩包在 P01 建立。
- `packages/ecs/`、`packages/math/`、`packages/assets/`、`packages/input/`、`packages/audio/`：按里程碑需求才建立，不預放空殼。
- `examples/triangle/`：P01 瀏覽器驗收；後續增加 `sprite/`、`cube3d/`、`pong/`、`fallback-demo/`、`showcase/`。
- `tests/`：與實作同步建立具行為價值的測試。`dist/` 是 tsc 發佈產物；根目錄為 pnpm workspace、工具設定與文件六件套。

## 里程碑與階段提交

| 階段（對應企劃原階段）                   | 新增實作與範例                                                                                                                                                      | 通過後的獨立提交前綴 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| P01 — WebGPU Foundation（原 v0.0.1）     | Game、Clock、Game Loop、Canvas、Graphics 抽象、WebGPU 初始化、WGSL Renderer、triangle                                                                               | `[P01]`              |
| P02 — Core World（原 v0.0.2）            | Scene lifecycle／切換／清理、Entity／Component／System、Transform、2D Math                                                                                          | `[P02]`              |
| P03 — Texture & Sprite（原 v0.0.3）      | 有 cache 的 Asset Loader、Texture、Sprite、WGSL sprite pipeline、alpha、transform、z-order、sprite 範例                                                             | `[P03]`              |
| P04 — Camera & Input（原 v0.0.4）        | Camera2D、Keyboard／Pointer Events／Gamepad、resize handling、pong 範例                                                                                             | `[P04]`              |
| P05 — 3D Rendering Pipeline（原 v0.0.5） | Vector3／Matrix4／Quaternion、3D Transform、Mesh（基本幾何及自訂頂點）、貼圖材質、PerspectiveCamera、深度測試、ambient＋directional 光照、WGSL 3D 管線、cube3d 範例 | `[P05]`              |
| P06 — Compatibility（原 v0.0.6）         | WebGL2（含 3D 管線）／Canvas2D、三級 auto fallback、Capability System、fallback-demo                                                                                | `[P06]`              |
| P07 — Audio（原 v0.0.7）                 | OPM.js v1.1.0 官方 release 完整 vendor＋LICENSE＋SHA256 驗證、AudioManager／AudioAsset／AudioChannel／OPMAdapter、unlock、聲部預算、Scene 整合                      | `[P07]`              |
| P08 — Hardening（原 v0.0.8）             | 完整 Error hierarchy／Logging、device lost／resize 邊界、triangle／sprite／cube3d／pong／fallback-demo／showcase 全數可跑、測試與文件收斂                           | `[P08]`              |

## 技術要點

- Game 以 async factory 建立，`requestAnimationFrame` 驅動 Clock→更新→Renderer；秒為 delta 單位，最大 delta 預設 0.1s 並避免隱藏分頁時間累積，生命週期包含 pause／resume／resize／destroy。
- Renderer 隔離 backend 實作；WebGPU 走 adapter→device→canvas context→configure，使用 preferred canvas format、WGSL；初始化失敗與 device lost 必須明確回報。P01 僅支援 WebGPU，`auto` 在缺乏 WebGPU 時明確失敗，不假裝已提供 fallback。
- 路線目標是遊戲邏輯使用 `graphics.capabilities` 而非 backend 名稱；WebGL2 使用 GLSL ES，Canvas2D 只支援基本 2D 並回報 `threeD === false`；不建自製 shader 語言。
- Scene 為 world/lifecycle 容器，不是 Entity；公開 Sprite 等物件 facade，ECS 為內核。Asset cache 與 backend GPU resource 分離；同 Scene 的 3D 先作 depth-test，再以 z-order 疊加 2D。
- Audio DSP／worklet／voice/scheduling 交由 OPM.js，XYZ.js 僅 orchestration；官方 release 整包保留 chunks／worklet，8 聲部（含 release）與 256 worklet 事件限制影響聲部預算及 look-ahead 排程；遵守瀏覽器 autoplay 手勢限制。
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

## P01 優化後的後續優先項（尚未完成）

本輪先處理已重現的尺寸覆蓋、Canvas ownership、Clock fps、GPU 初始化取消及每幀 JS 容器配置；技術契約集中於 [技術文件](docs/TECHNICAL.md)。不將這些修正冒充 P02–P08 的功能完成。

| 優先順序 | 缺口與下一步                                                                                                      | 對應驗收                                                          |
| -------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1        | P02 的 Scene 非同步切換需先定義資源 ownership、取消與重入語義，再實作 ECS；沿用本輪初始化失敗必須 rollback 的原則 | 舊 Scene 只清理一次；切換失敗不留下半啟用 World                   |
| 2        | P03 Asset cache 需區分共享下載 Promise、資產 CPU 資料與 backend GPU resource 的生命週期                           | 失敗可重新載入；共享 texture 不因其中一個 Sprite 銷毀而失效       |
| 3        | P04／P08 增加真實背景分頁、BFCache 往返與 DPR／跨螢幕場景；目前事件模擬不足以宣稱完整支援                         | Safari／Edge／Chrome 實際往返後恢復畫面，沒有 resize feedback     |
| 4        | P06 降級需處理 Canvas context 綁定及部分初始化失敗，不只檢查 navigator.gpu                                        | GPU device／context 初始化各失敗點仍能正確選擇下一 backend        |
| 5        | P08 建立多 Sprite 真實負载 benchmark，分開 CPU 提交、GC、GPU／呈現節奏                                            | 固定資產及畫布規格，有可重現報告，不以 triangle 幀率推估          |
| 6        | 發佈前確定授權、驗證 npm tarball 與無 bundler 消費端、決定支援的 Node 工具鏈與瀏覽器版本                          | 乾淨環境 import JS／TS 產物成功；不依賴工作區 source 或未發佈檔案 |

## 交付前自檢

- [x] P01 僅含本階段應有範圍；已確認公開入口、ESM 相對路徑與 `.d.ts` 契約。
- [x] build、typecheck、test、lint、format:check 已執行；結果記於 `ACCEPTANCE.md`。
- [x] 真實 Chromium 開啟 triangle，確認畫面與錯誤分支；其他瀏覽器尚未驗證。
- [x] 六件文件區分現在／未來功能，未留臨時測試檔或公開測試掛鉤。
- 提交規則：P01 驗收後立刻獨立 `[P01]` commit，不併入下一階段、不 push。

開始執行。

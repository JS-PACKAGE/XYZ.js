# XYZ.js 驗收紀錄

**目前狀態：1.0.0 的 P01–P08 均已驗收並獨立提交。** P08 為 16 檔／73 測試與六個範例 Chromium smoke；2026-09-30 後續優化為 16 檔／75 測試，build、typecheck、lint、format:check 通過，詳見末節。套件未 npm publish，授權仍為 UNLICENSED；階段提交不包含 push，後續變更不自動提交。

以下各階段保留**當時**的測試數、環境與觀察，不以最新結果改寫歷史。P01 當時只有 WebGPU；目前三級 fallback 以 P06 及後續紀錄為準。未驗證的平台、硬體與效能項目仍不視為通過。

## P01 — WebGPU Foundation（驗收通過）

- [x] `npx pnpm install` 與 `npx pnpm build` 成功；`dist/src/index.js`、`dist/src/index.d.ts` 和內部 packages 的 JS／型別文件存在；相對 ESM 匯入可在瀏覽器解析。
- [x] `npx pnpm typecheck`、`npx pnpm test`、`npx pnpm lint`、`npx pnpm format:check` 通過。
- [x] WebGPU 瀏覽器實際顯示 WGSL triangle；走 Game→Renderer→WebGPU，無獨立 demo 渲染器。
- [x] 缺少 WebGPU 時 `webgpu`／`auto` 明確報錯，強制 `webgl2`／`canvas2d` 不暗中切換。
- [x] Clock、pause／resume、resize／destroy、device lost／GPU error event 已驗證，方法與環境如下。
- 本紀錄隨獨立 `[P01] WebGPU Foundation` commit 提交；不含 P02，不 push。

### 實際檢查紀錄

2026-09-29，macOS arm64；Node 26.7.0、pnpm 12.6.0、managed Chromium 150.0.0.0，localhost 安全來源。

- 工具檢查：build、typecheck、lint、format:check 成功；Vitest **1 檔／4 測試通過**，覆蓋秒數換算、clamp、暫停時間排除、倒退時間、reset 與無效輸入。
- 真實畫面：`/examples/triangle/` 顯示紅／綠／藍插值三角形；按 Pause／Resume／Destroy 觀察正確狀態，窄視窗截圖中三角形比例保持一致。正常渲染無 browser errors。
- 發佈產物 smoke：瀏覽器直接 import `/dist/src/index.js`，使用真實 GPU 建立 Game。DPR 2 下初始 320×180 對應 backing 640×360；resize 180×320 對應 360×640，pipeline 建立次數維持一次。
- Lifecycle smoke：重複 start 不重啟 loop；pause 不增加 frame；resume 首幀 delta 為零且 elapsed 不跳增；destroy 冪等，destroy 後 start 回報 RuntimeError。
- Visibility 分支：暫時覆寫 `document.hidden` 並送出 `visibilitychange` 驗證停止／恢復及首幀 delta 為零；這是事件模擬，**不是 OS 真實背景分頁驗證**。
- Device lost：測試側攔截真實 `requestDevice` 回傳值，再外部 destroy 該 GPUDevice；Game 回報 `WebGPUDeviceLostError` 並暫停。正常 Game.destroy 不多送錯誤。
- GPU error：使用真實 GPUDevice 建立 `usage:0` 的無效 buffer，觀察實際 uncaptured validation error 被轉為 `GraphicsError` 事件，Game 暫停。
- Unsupported 分支：測試側暫時遮蔽 `navigator.gpu`，強制 WebGPU 回 `WebGPUNotSupportedError`、auto 回 `UnsupportedGraphicsError`；強制 WebGL2／Canvas2D 回 `GraphicsBackendUnavailableError`。這不代表已在無 WebGPU 的實體瀏覽器驗收相容性。
- 套件管理：初次安裝自動替最新 lint 相依新增 release-age 豁免，已移除；改鎖相容的 typescript-eslint 8.70.0，啟用 `minimumReleaseAgeStrict` 並重建 lockfile，安裝及 lint 成功，未保留政策豁免。

P01 當時尚未驗證 Safari／Edge／Firefox、真實 driver reset、負載效能，P02–P08 尚未實作；後續進度見各階段紀錄。瀏覽器 smoke 是臨時驗收操作，未將 GPU mock 或測試掛鉤加入產品 API。

## P01 深度優化與技術文件（驗收通過）

2026-09-29，沿用 macOS arm64／Node 26.7.0／pnpm 12.6.0／Chromium 150 環境。以下為獨立 P01 優化提交，不包含 P02 功能。

### 缺陷重現與修正後對照

| 項目               | 修正前實際觀察                                 | 修正後實際觀察                                                           |
| ------------------ | ---------------------------------------------- | ------------------------------------------------------------------------ |
| FPS／clamp         | 500ms 幀間隔、clamp 0.1s，錯顯示 10fps         | 模擬 delta 保持 0.1s，fps 正確為 2                                       |
| CSS ownership      | 作者 420×210 被覆寫為 1280×720                 | 含 `@layer` 的 420×210 保留；DPR 2 backing 為 840×420                    |
| 手動 resize        | logical／backing 200×100，但 CSS 仍為 1280×720 | 無作者尺寸時 resize(180,320) 的 CSS 為 180×320、DPR 2 backing 為 360×640 |
| 同一 Canvas        | 允許兩個 Game configure 同一 context           | 同時初始化及已有 Game 皆拒絕第二個建立；destroy 後可重新建立             |
| 初始化途中 destroy | 晚到 device 未被銷毀，初始化仍 resolved        | 初始化 rejects；實際取得的晚到 device 被 destroy 一次                    |
| 過大 resize        | 100000000px 寬度直接寫入 canvas                | GraphicsError；舊 logical／CSS intrinsic／backing 全數不變               |
| BFCache 事件       | persisted pagehide 銷毀 Game，後續 resume 拋錯 | 模擬 persisted pagehide 後 Pause／Resume 可恢復 Running                  |

### 熱路徑量測

在測試側攔截真實 GPU API，只記錄 JS 物件 identity；正式產品沒有暴露 GPU 測試掛鉤。

| 容器                   | 修正前 12 幀  | 修正後 12 幀 |
| ---------------------- | ------------- | ------------ |
| render-pass descriptor | 12 個不同物件 | 1 個重用物件 |
| color attachment array | 12 個不同物件 | 1 個重用物件 |
| queue submission array | 12 個不同物件 | 1 個重用物件 |

實際確認：GPU texture view／command buffer 在 API 消費後不殘留於這些容器；resize 後 pipeline 建立總數仍為 1。**這不是 FPS／CPU／GPU throughput 提升百分比**；P01 優化當時尚未執行多 Sprite 或 GC benchmark，後續 Sprite 實測見 P08，GC 仍未量測。

### 額外邊界驗證

- 百分比容器從 400×200 改為 300×180，ResizeObserver 後 backing 正確為 600×360（DPR 2）。
- ShadowRoot 中 420×210 border-box、10px padding、5px border、CSS scale(0.5)，logical content box 為 390×180，backing 為 780×360；沒有錯把 transform 算進像素尺寸。
- 明確保留並恢復原本 inline `contain:paint !important` 及 intrinsic-size。修正過程也重現 CSSOM 將 `200px 200px` 正規化為 `200px` 導致清理失敗，現在方形尺寸 destroy 可正確還原。
- 原生 size containment 取代會和 CSS layers／CSP 衝突的 stylesheet 方案；在 `style-src 'none'` 下建立 Game 並實際提交一幀成功，未放寬 CSP。
- 真實 GPUDevice.destroy 觸發 `WebGPUDeviceLostError`；Game 暫停，resume 以 RuntimeError 拒絕且 cause 指向原錯誤。destroy／recreate 後可重新渲染。
- Triangle 畫面及 Pause／Resume／Destroy 互動正常；BFCache 只驗證事件模擬，未宣稱完成瀏覽器實際歷史往返測試。

### 工具與文件

- build、typecheck、lint、format:check 通過；Vitest **3 檔／16 測試通過**。新測試涵蓋 ownership／失敗 rollback／fatal 狀態與 GPU 初始化競態，真實 CSS 行為另由瀏覽器 smoke 驗證。
- 原生 ESM 產物以 `python3 -m http.server 5174 --bind 127.0.0.1` 提供並由瀏覽器 import `/dist/src/index.js`。驗證中發現既有 Vite 對 dist 的回應仍含舊 Clock；已改用靜態伺服器檢查當次 build，不以該快取結果當作新版本證據。
- [繁體中文技術文件](docs/TECHNICAL-zh.md)（另有 [English](docs/TECHNICAL.md)）提供模組邊界、Clock 算式、Canvas／DPR 與 aspect-ratio 契約、GPU 資源、錯誤策略及部署方式；README 中／英／日用法與 DESIGN 同步更新。
- 本段為 P01 優化當時的紀錄；P02–P08 後續驗收見下文。Safari／Edge／Firefox、實際 BFCache／背景分頁與 driver reset 仍未完成驗證矩陣，不因功能交付而視為認證通過。

## P02 Core World（驗收通過）

- 新增 Scene／SceneObject／GameObject、World ECS、Vector2／Matrix3／Transform2D。Scene 準備失敗保留 active Scene；切換／destroy 清理物件與 systems；取消採 cooperative AbortSignal。
- 整合檢查：build、typecheck 及 **6 檔／29 測試通過**；涵蓋 ECS CRUD、system lifecycle、矩陣 inverse、Scene ownership／切換失敗／非同步取消及原 P01 回歸。
- 真實 Chromium／WebGPU Game smoke：Scene.update 改變物件位置；候選初始化拋錯被拒絕且舊 Scene 保留；成功切換後舊 Scene 及物件 destroyed；Game.destroy 清理新 Scene。初始化／失敗候選清理／兩個正常 Scene 清理的實際順序皆符合契約。
- 加入使用者要求的根目錄 `.nojekyll`，不涉及遠端部署。

## P03 Texture & Sprite（瀏覽器驗收通過）

- 真實 Chromium／WebGPU 以兩個共用 URL（含 fragment 變體）載入 Texture，只觀察到一次 fetch 且取得相同物件。
- 64×64 實際 GPU 畫布讀回：紅底／半透明藍色交疊為 `[128,0,128,255]`；調低藍色 zIndex 得紅色，opacity=1 得藍色，visible=false 得紅色，移出畫面得背景 `[6,9,17,255]`。
- `/examples/sprite/` 實際畫面與按鈕確認 rotation、scale、anchor、z-order、opacity。無逐 Sprite pipeline。
- 瀏覽器發現並修正手動 destroy cached Texture 後仍回傳死資產的問題；修正後重新載入結果為不同 Texture 且 destroyed=false，加入對應 regression test。
- build、typecheck、lint、format:check 通過；Vitest **8 檔／38 測試通過**。

## P04 Camera & Input（驗收通過）

- build、typecheck、lint 通過；Vitest **10 檔／47 測試通過**，包含座標逆轉換、alias output、輸入 edges／cancel／blur／gamepad snapshot。
- 真實 Chromium Pong 畫面可玩，ArrowDown 移動左球拍，實際 pointer 拖曳改變球拍位置，計分持續更新。
- 真實 Game 使用 camera position=(10,10)、zoom=2，紅 Sprite 世界座標(20,20)在 screen(20,20)讀回 `[255,0,0,255]`；resize 100×100→200×100 後同點仍為紅色，viewport 更新，Texture 仍存活。screenToWorld 回復(20,20)，keydown held=true，blur 後 cleared=true。
- 尚未以實體 gamepad、Safari／Firefox／Edge、跨螢幕或 BFCache 驗證；不將合成事件測試當作硬體相容性保證。

## P05 3D Rendering（驗收通過）

- build、typecheck、lint 通過；Vitest **12 檔／58 測試通過**，涵蓋矩陣逆轉換、near/far 投影、幾何 winding／normal／UV 與 ownership。
- 真實 Chromium／WebGPU `/examples/cube3d/` 顯示旋轉貼圖 cube、sphere 的透視與光照，以及 2D overlay。
- 64×64 畫布讀回驗證：先加入近紅 quad、後加入遠藍 quad，中心仍為紅 `[255,0,0,255]`；隱藏近物件得藍；關閉 ambient／directional 得黑；開啟正向 directional 得紅；加入 2D 白 Sprite 得白。resize 後沒有 error 事件。

## P06 Compatibility（驗收通過）

- 真實 Chromium 操作 fallback-demo 下拉選單，WebGPU／WebGL2／Canvas2D 均顯示 Sprite／circle；GPU backends 顯示 lit cube；Canvas2D 不假裝有 3D。
- 發現並修正 WebGL UV 多翻一次造成上下顛倒。修正後三 backend 的四個 sample pixels 完全一致：`[240,75,60,255]`、`[240,75,60,255]`、`[65,130,240,255]`、`[128,110,41,255]`，涵蓋方向與 alpha；GPU／GL 的近紅遠藍 depth 結果均為紅。
- 真實 API failure injection：無 adapter→WebGL2；無 GPU／GL→Canvas2D；GPU configure 在 context 綁定後拋錯→WebGL2；強制 WebGPU 同樣失敗→WebGPUInitializationError，不切換。
- cube3d 強制 Canvas2D 明確顯示 no 3D capability。實測為 Chromium，不等同宣稱其他瀏覽器已驗證。
- build、typecheck、lint、format:check 通過；Vitest **14 檔／62 測試通過**。

## P07 Audio（驗收通過）

- 官方 v1.1.0 archive SHA256：`1344a3c2e6e2904b32cd273854ededca318e9a25e97bca20bfc5d331a3b8121e`；完整 dist 加 LICENSE 共 13 檔與 archive 逐位元組相同。來源記於 `vendor/opm/manifest.json`，build 保留 vendor 相對 URL。
- 真實 Chromium sprite 範例手勢解鎖後八個 AudioContexts 均 running；AudioWorklet AnalyserNode 觀測到非零 PCM。六聲部 BGM 加四連發 SFX，只 disconnect 原兩個 SFX worklets；六個 BGM worklets 均保留。
- Vitest 覆蓋 SFX-only stealing、release、channel gain、Scene／persistent、loop catch-up、cache／abort／failure；**15 檔／69 測試通過**。build、typecheck、lint、format:check 通過。
- Audio 未 unlock 時 play 明確拒絕；load 只解析 voice，不建立 AudioContext。八個官方 instance 的資源成本已公開；不宣稱跨瀏覽器音訊認證。

## P08 Hardening（驗收通過）

- 日期：2026-09-30；macOS arm64、Node 26、pnpm 12.6.0、Chromium 150，viewport 1365×768／DPR 1.25。
- build、typecheck、lint、format:check 通過；Vitest **16 檔／73 測試通過**。新增 logger severity、loss resize 與 cleanup regression。
- 六個範例均實際開啟並截圖；showcase 同 Scene 顯示 animated Sprite／Primitive、lit cube／sphere，操作 audio unlock、SFX 及 Scene switch。Canvas2D showcase 明確省略 3D；cube3d Canvas2D 降級已於 P06 驗證。
- 真實 `WEBGL_lose_context` 使 Game paused 並拒絕 resume；真實 GPUDevice.destroy 使 Game paused，resize 拒絕且保留 250×125 backing。
- npm pack 後解壓至獨立 `/tmp` 消費端：Node import 成功、strict NodeNext TypeScript 宣告檢查成功；純 HTTP、無 Vite/bundler 載入 packaged ESM，WebGL2 渲染及官方 OPM voice validation 成功。
- `/benchmarks/sprites/`：WebGPU direct、1,000 個移動常駐 Sprite、共用 texture、1280×720 backing／DPR 1；120 warmup＋600 samples。RAF **59.9988 fps**，間隔平均 **16.667ms**／p95 **17.3ms**；CPU submit 平均 **0.6358ms**／p95 **1.2ms**。CPU 不含動畫更新，不等於 GPU completion；未量測 GPU timestamps／GC，不保證其他裝置效能。
- 未認證 Safari／Edge／Firefox、實體 gamepad、真實背景分頁／BFCache 往返矩陣、跨螢幕 DPR 與真實 driver reset。套件仍 UNLICENSED，未 npm publish；各階段提交未 push。

## 階段總表

| 階段                      | 硬指標                                                                                                                                             | 狀態                        |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| P02 Core World            | Scene 建立／切換／清理；ECS 增刪改查有單元測試                                                                                                     | 已通過，獨立 `[P02]` commit |
| P03 Texture & Sprite      | 共用 texture 不重複下載；Sprite z-order／opacity 正確                                                                                              | 已通過，獨立 `[P03]` commit |
| P04 Camera & Input        | Screen↔World 轉換有測試；resize 不變形、不卡在整份資源重建                                                                                         | 已通過，獨立 `[P04]` commit |
| P05 3D Rendering Pipeline | cube／sphere 在透視視角的貼圖、深度與基礎光照正確；2D／3D 同 Scene 排序正確                                                                        | 已通過，獨立 `[P05]` commit |
| P06 Compatibility         | `auto` 三級選擇、強制 backend 失敗錯誤；Sprite 三 backend 視覺一致，WebGL2 3D 與 WebGPU 一致；Canvas2D 回報 `threeD === false`                     | 已通過，獨立 `[P06]` commit |
| P07 Audio                 | 首次手勢前無聲；8 聲部 BGM＋SFX 溢位只棄最舊 SFX                                                                                                   | 已通過，獨立 `[P07]` commit |
| P08 Hardening             | triangle／sprite／cube3d／pong／fallback-demo／showcase 全數可跑；cube3d Canvas2D 明確無 3D；showcase 同場 2D＋3D＋音效；Vitest 全綠與交付清單全過 | 已通過，獨立 `[P08]` commit |

效能參考（非硬指標）已由上述 benchmark 實測；不推廣為跨裝置 60fps 保證。

## 對應提交

| 階段                 | Commit    |
| -------------------- | --------- |
| P01 Foundation       | `f65de9c` |
| P01 優化             | `6323c65` |
| P02 Core World       | `7b3c18e` |
| P03 Texture & Sprite | `58c83c6` |
| P04 Camera & Input   | `cc446c6` |
| P05 3D Rendering     | `fda86b1` |
| P06 Compatibility    | `ca0d36c` |
| P07 Audio            | `08e5f66` |
| P08 Hardening        | `4bfef73` |

文件同步保留上述驗收結果；單純編修文件不表示重新執行全部 runtime／瀏覽器驗證。

## P08 後續分析與優化（2026-09-30）

- 範圍：檢視三 backend Sprite 收集／排序／資源清理、ECS update、Input polling／鍵盤及 Audio bounded scheduler。既有穩定排序、GPU 資源回收與八聲部音訊契約保留，未引入 dirty-transform 或跨幀排序 cache。
- ECS 只在移除 System 時標記需壓縮；update finally 改為有需要才做穩定線性壓縮，取代每幀掃描與多次 splice。保留移除即失效、新 System 延至下一幀及例外後清理契約。
- WebGPU Sprite viewport uniform 僅尺寸改變才上傳；真實 GPUQueue instrumentation 觀察同尺寸 12 幀，16-byte uniform writeBuffer **12→1**。100→100→200→200→100 logical width 的中心紅色讀回均 `[255,0,0,255]`。讀回在 submit 後、下一次 presentation 前執行，避免已過期 canvas 內容。
- 鍵盤缺陷：遊戲按鍵按住後 focus 移至 INPUT，keyup 被忽略使 held 卡住。瀏覽器 DOM 事件 smoke 修正前 true、修正後 false；現在僅忽略 editable keydown，keyup 仍釋放已追蹤按鍵，不新增未追蹤的 release edge。
- 工具：build、typecheck、lint、format:check 通過，Vitest **16 檔／75 測試通過**；新增 focus transition 與 ECS 批次移除／update exception 回歸。Showcase 實際顯示 2D／3D；音訊／vendor 未改動，不宣稱重新完成音訊稽核。
- 同一 Chromium 150／macOS arm64、1,000 Sprite、1280×720／DPR 1、120 warmup＋600 samples：前後均 **60.0006 RAF fps**；CPU submit 平均 **0.1702→0.4940ms**，p95 **0.3→0.7ms**。ECS 單次微量測（1,000 systems、1,000 warmup＋5,000 updates）**14.5→15.9ms**。這些單次時間結果沒有證明加速，甚至後測較高；只確認減少冗餘工作與回歸行為，不宣稱 CPU／FPS 提升，不作跨裝置推論。
- `CLAUDE.md` 保留 AGENTS 引用並加入弱點掃描／安全控制規範；這不是已啟用掃描器或已完成依賴／secret／安全稽核的證據。

## 安全掃描與資產上限修正（2026-09-30）

- 環境：macOS arm64、Node 26.7.0、pnpm 12.6.0、Chromium 150。重新執行 `pnpm audit --json --registry https://registry.npmjs.org`，169 dependencies 範圍（含 dev／optional）回報各級已知弱點均 0；未升版、未 audit fix，這不保證沒有未知弱點。
- 原缺口：response.blob／json 無 byte cap；100,000 notes（3,600,376 bytes）曾成功載入。新增共用串流計數，圖片 8 MiB／JSON 1 MiB；notes 16,384；Texture 每邊 8,192／總像素 4,194,304。常數集中 src/data/assets.ts。
- Chromium 修正後：1 與 16,384 notes 接受；16,385 拒絕；100,000 在 byte cap 拒絕。2048×2048 接受，2049×2048 拒絕；8 MiB＋1 byte 圖片 response 拒絕。Showcase 實際顯示 2D／3D，手勢 unlock 後顯示 Music playing。
- build、typecheck、lint、format:check 通過；Vitest **17 檔／82 測試通過**。回歸涵蓋 missing／低報 Content-Length 的串流邊界、超限取消、停滯 stream abort、圖片超限 bitmap 釋放、音訊 notes 邊界與 byte-cap 拒絕；未做破壞性 OOM 測試。
- **明確保留的風險**：使用者選擇保留所有瀏覽器支援圖片格式，因此只在解碼後檢查 pixels，不宣稱已防止解碼瞬間記憶體放大；單資產上限也不等於全域 cache／並行記憶體上限。未重新認證其他瀏覽器、production 部署或底層影像解碼器。
- 本次修正不自動 commit／push；先前文件安全規範不等於已啟用持續 CI 掃描。

## 雙語文件與最小化發佈（2026-09-30）

- 原繁體中文技術參考移至 docs/TECHNICAL-zh.md，docs/TECHNICAL.md 為完整英文；新增 docs/USAGE.md／USAGE-zh.md 操作指南，維持雙向語言連結與根文件導覽。
- Build：tsc → 既有 Vite minifier → 官方 vendor 原樣複製。36 個引擎 JS 由 189,706→98,707 bytes；dist 共 46 個 JS，另 10 個為已最小化的官方 vendor。宣告保留、source maps 串接回 TS、公開 export／property／class 名稱不變，無新增依賴。
- macOS arm64／Node 26.7.0／pnpm 12.6.0：build、typecheck、Vitest 17 檔／82 測試通過；新增 build script 的首次 lint 發現 Node globals 未明確 import，已改為 node: imports 後驗證。Source map 的 texture budget 錯誤位置可追到原 TypeScript；所有 map source paths 存在，dist vendor 與官方 13 檔完全一致。
- 真實 Chromium 150 以 Python 靜態 HTTP server 載入 dist（不經 Vite）：使用說明完整 HTML／JS 顯示藍色方塊，ArrowRight 使 backing x 由 100→149；正式 WebGPU 紅色方塊讀回 `[255,0,0,255]`；RuntimeError／AssetError 名稱保留；JSON 音訊載入及使用者手勢後 AudioContext running／worklet 初始化成功。不是所有 backend／瀏覽器重新認證，也不是 FPS 提升聲明。
- 最終 build／lint／format:check 通過；兩次 build 的全部 122 個 dist 檔案 SHA-256 一致。中英文技術參考各 19 節、使用說明各 9 節；69 個文件相對連結／anchor 均可解析，英文正文無中文字元，雙語 quickstart JavaScript 相同。

## Text2D 與 Scene 計時器（2026-09-30，v1.0 後新增）

- 補足引擎內文字與模擬時間排程；Text2D 支援多行、Sprite transform、latest-request-wins、貼圖更新／destroy 釋放；SceneTimers 支援 after／every、取消、場景自動清理、pause 凍結，不依賴 subclass 呼叫 super.update。
- macOS arm64／Node 26.7.0／pnpm 12.6.0：build、typecheck、lint、format:check 與 **19 檔／96 測試通過**。涵蓋更新先後顛倒、失敗保留舊畫面、destroy 後晚到 bitmap、外部借用貼圖、文字預算、timer 邊界／取消／重入／錯誤／Scene teardown，以及真正 Game loop 的 pause 時間排除與 timer callback 銷毀 Game。雙語新範例一致、71 個相對文件連結／anchor 可解析。
- Chromium Pong 畫面有 `0 : 0`／Get ready，Pause 後 Restart 並等待 1.2 秒，仍保持 Serving；Resume 後 Playing，遊玩後畫布與 DOM 同步顯示 `0 : 6`。截圖觀察文字、球拍、球與按鈕；DOM 分數仍保留供輔助閱讀。
- 靜態 HTTP 直接 import 最小化 dist（未經 Vite）：WebGPU／WebGL2／Canvas2D 各繪製含多行與中文字的 Text2D，白色像素分別 613／606／606；更新後舊貼圖 destroyed，Game destroy 後目前貼圖亦 destroyed。Canvas2D 文字從 `0`→`999` 有 624 個像素改變；Game timer 暫停 200ms 後仍 0 次，resume 後 1 次。
- 新 build 最小化 39 個引擎 JS：197,981→103,071 bytes；保持 vendor 原樣。這不是效能幀率或跨瀏覽器認證。新增功能以 v1.1／套件 1.1.0 發佈，既有 v1.0 保持不變。

## P09–P12 初步 runtime smoke（2026-09-30，尚非完整階段驗收）

以下由整合 worker 的真實 Chromium WebGPU／WebGL2 操作提供，兩 backend 均觀察到；不改寫上列歷史日期／測試數，也不宣稱完整工具鏈或階段驗收已通過。

- Hierarchy 紅色畫面、祖先 hide、正交 camera 與 instance pixels 一致；拾取回 instanceId=1。Advanced3d 實際截圖有 floor、24-instance ring、metal sphere、animated ribbon、shadows，無 errors。
- PBR directional RGB 為 [148,105,81]，point／spot [223,161,124]，spot 背向為黑；HDR exposure low [156,104,70]→high [243,227,205]，green 2D overlay 不受影響；resize／disable 無 errors。
- Directional shadow 關閉灰階 206→開啟 26，castShadow／receiveShadow=false 恢復 206；mapSize=512 無 errors。
- .gltf 與 synthesized GLB 各載入 1 clip；skin vertex 最大變化 1.1293，畫面改變 pixels 為 WebGPU 1870／WebGL2 2011；frozen snapshot 不變。
- Per-map sampling：UV=1.25 的 repeat 得 red [255,0,0]，clamp／mirror 得 blue [0,0,255]；LINEAR repeat 在 UV=0 seam 得 purple [128,0,128]；shared image base-repeat／emissive-clamp 得 magenta [255,0,255]，無 errors。
- 實際 bloom：HDR emissive geometry 不變，radius=2 的鄰邊 edge+1 pixels 由 off [1,2,4]→on [124,2,4]，兩 backend 相同。
- Trusted wheel 將 ortho zoom 改為 0.938，實際 left／right drag 改變 camera／target，Floor pick distance=11.83；pause 100ms framebuffer 完全不變，destroy 還原 touchAction。
- 本節是當時初步紀錄；最終 tests／lint／format、maps／alpha／loss／原範例回歸與分階段結果見 [最終整合驗收](#p09p12-整合驗收2026-09-30限定已測環境)。未新增 runtime dependency，Canvas2D 保持 2D-only；未驗其他瀏覽器／效能，版本仍 1.1.0，未自動 commit／push／publish。

## P09–P12 整合驗收（2026-09-30，限定已測環境）

整合 worker 最終紀錄：macOS arm64、Node 26.7.0、pnpm 12.6.0、managed Chromium；正式 Game→Renderer 路徑在 WebGPU／WebGL2 通過下列觀察。原初步 smoke 保留為歷史紀錄，本節補充最終工具鏈／回歸，不把支援範圍擴大成 three.js 全相容。

- build、typecheck、test、lint、format:check 全部通過；Vitest **25 檔／150 測試通過**。首次 GPU lifecycle mock 缺少新增初始化 API，補全 fixture 後保留原行為 assertions；graph traversal lint 與範例 glTF formatting 修正後通過。未新增 runtime dependency。

### P09 — Scene & Interaction（限定環境驗收通過）

階層／繼承 visibility、正交 camera、精確 triangle／instance picking、實際 wheel／左拖旋轉／右拖平移、pause framebuffer、controls destroy touchAction 還原均有真實畫面或狀態觀察，見初步 smoke 的具體數值。

### P10 — Models & Animation（支援 profile 驗收通過）

.gltf／GLB 各 1 clip、CPU skin vertex／pixel 變形與 frozen snapshot 已有 runtime proof。公開契約支援有界 triangles／TRS／所列 skins 與 STEP／LINEAR／CUBICSPLINE，不宣稱所有 extensions／morph；完整行為測試總數見上。

### P11 — Materials & Lighting（限定環境驗收通過）

兩 backend named pixels 一致：base [165,143,116]、normal map [89,69,39]、normalScale=0 恢復 base；metal [255,247,151]、metallic-roughness map [165,143,116]、AO [144,128,110]、emissive [202,143,116]。OPAQUE [165,143,116]、MASK discard 背景 [6,9,17]、BLEND [46,43,42]；mirrored geometry 正面仍 base，culled backface 為背景。Directional／point／spot、方向光 PCF 與 cast／receive 控制見初步數值；不含 IBL 或 point／spot shadows。

### P12 — Instancing & Postprocessing（限定環境驗收通過）

實際 WebGPU drawIndexed(36,24) 與 WebGL2 drawElementsInstanced(indices=36,instances=24)，每 color frame 為 hardware instance draw，啟用陰影另有 shadow-pass draw。HDR exposure／ACES、9-tap bloom 鄰邊亮化、2D overlay 不受影響、resize／disable 已觀察，非 shader-only scaffold。

### 共用 sampler、回歸與封裝證據

- glTF 正確套用 repeat 預設；nearest／linear、clamp／repeat／mirror 及共用 image 的不同 per-map samplers 觀察見初步 smoke。TextureSamplerOptions 經 core barrel／root 統一入口匯出；明確 mipmapped min filters 仍拒絕。
- 六個原範例均實際開啟、截圖且無 errors。Showcase 實際手勢 unlock 後八個 AudioContexts running，Analyser PCM peak **0.037088677**；SFX 與 music 同場，切到 Scene B，pagehide cleanup 後八個 contexts closed。WebGL2 showcase 有 3D；Canvas2D showcase 保留 2D-only。Advanced3d 明確拒絕 Canvas2D 3D，不假冒支援。
- Advanced3d 真實 GPUDevice.destroy 顯示 device-lost fatal 訊息；WEBGL_lose_context 顯示 context-lost fatal 訊息。這是實際 API loss，不是實體 driver reset 認證。
- npm pack 1.1.0 解壓至獨立 /tmp，以純 HTTP 提供最小化 ESM（不經 Vite），58 個 engine JS 產物；WebGPU／WebGL2 再驗 hierarchy／picking／ortho／instance／PBR／lights／post／overlay／resize、glTF／GLB skin 與 samplers，named pixels 相同、無 errors。Pack 不等於 publish；未修改原 release、未 commit／push。
- 邊界：只驗此工作站 managed Chromium，未認證 Safari／Firefox／Edge、真實 driver reset 或新效能數據；named sample pixels 一致不等於整張 framebuffer 逐像素一致。Canvas2D 仍 2D-only；不含 IBL、point／spot shadows、全部 glTF extensions／three.js addons。套件保持 1.1.0，升版／公開授權與發佈由所有者決定。

## P13–P20 明確profile與整合驗收（2026-09-30，限定已測環境）

**P13–P20 profiles、正式rootconsumer與共用整合門檻驗收通過。** 最後Node26.7.0／pnpm12.6.0 frozeninstall／build／typecheck／37files252tests／lint／format，built-dist及packed ES2022consumer通過。ActualChromium三backend Game／nativeeffects與audio詳見各節；追加actual三backend native-capture cancel／version／reentry／destroy proof完成，12captures全釋放／errors=[]。P01–P12歷史日期／25檔150不改，套件1.1.0／UNLICENSED、不npm發佈／自動commit-push／新dependency／OPMvendor更動。

### 共用驗收門檻（限定已測環境驗收通過）

- [x] 正式 Game→Renderer browser surface：P13–P19在三backend逐profile驗收、正式gameplay2d rootconsumer三backend完整互動／errors=[]；P20 GPU／GLnative material／post、Canvas explicit UnsupportedGraphicsError。正式範例gate DONE。
- [x] 保持GameObject facade／內部ECS、whole-textureSprite／Text2D／borrowedTexture／inputpolling／timers／OPM／3D-P12／Scene failure；既有六examples＋advanced3d browsermatrix、37files252tests與新formalconsumer證明相應路徑。Pause／hidden及callbackownership依各scopedtests／actualproof，不冒稱未測browser。
- [x] 最後build／typecheck／37files252tests／lint／format通過，frozeninstall／pack／strictisolatedES2022types／extractedrootruntime亦通過。下節記當次結果與初次diagnostics；Safari／Firefox／Edge／新performance仍未驗。

### P13 — 2D hierarchy／atlas／animation／font／NineSlice／HUD（限定環境驗收通過）

- [x] 既有 GameObject＋Group2D nested rotation／nonuniform／negative scale 與 inherited visibility／opacity／tint／z，Scene subtree ownership／cycle／reparent／remove／destroy；三 backend 正式 Game 路徑與 targeted behavior tests。
- [x] Sprite sparse source／SpriteSheet grid、atlas anchor／flip／natural size 與 borrowed Texture；Sprite.source 允許 fractional pixels，SpriteSheet frame 僅 integer。Width／height 是自然 source 尺寸，縮放用 scale，沒有 displayWidth／displayHeight。
- [x] FrameAnimation loop／pingpong／freeze／hide、duration boundaries／large dt／speed／reverse／pause／reset／goToFrame／stop／native events 與 Scene-owned ticking，範例呈現 source frame 動畫。
- [x] SpriteFont／SpriteText glyph reuse／invalid update preservation／layout，以及 NineSlice stretch／tile fractional remainder／tile-fit／small-size bounds／resize；owned children 不 destroy borrowed Texture。
- [x] ScreenElement HUD 不受 world camera pan／zoom 影響，world-before-screen 呈現；不是 widgets／layout／editor。

#### P13 實際證據（2026-09-30）

- Core lead 回報 build／typecheck 成功、4 檔／21 targeted tests；renderer 4 tests、primitives 4 tests 成功。Primitives 4 tests 與 21 有重疊，**不加總成 29**；沒有新 full-suite／lint 通過聲明，歷史 150 不變。
- WebGPU／WebGL2／Canvas2D 真正 Game pixels：fractional .25 source green `[0,255,0,255]`；inherited shear／reflection／tint／opacity `[50,52,103,255]`；祖先 hidden background `[6,9,17,255]`；alpha probe `[15,16,20,255]`；HUD red 在 camera 改動後固定。
- GPU／GL：3 個共用 atlas Sprites，3 frames 僅 upload 一次、每 frame 一個 instanced draw。這是 API／資源觀察，不是新 FPS／throughput 或所有場景 draw-count 保證。
- NineSlice .25 fractional tile remainder 在 scale=4 仍一個正確 orange pixel `[255,96,0]`，相鄰 green 在三 backend 正確；glyph 相同字數更新與 invalid update preservation、shrink bounds `3×2` 正確。
- 真正 `/examples/gameplay2d/` 三 backend 已截圖，errors 為零；Canvas2D pause 180ms 後 backing changed channels=0。Live Game.start RAF 的 WebGPU composite screenshot 由 director 實際查看：字形／面板 composites 可見且無 errors。
- 原 primitives screenshot 的 GPU blank 是在 Game.destroy／unconfigure **之後**拍攝；named pixels 在 destroy **之前**擷取有效。後續 live screenshot 已釐清，**不是 product bug，也沒有因此改 source**。不把 post-destroy blank screenshot 當有效 runtime 畫面。
- 僅已記錄 Chromium 環境，不認證 Safari／Firefox／Edge、新效能或整張 framebuffer 逐像素 parity。P14–P20 的 pending criteria 不因本節通過而自動打勾。

### P14 — events／actions／pointer／camera（限定 Chromium 驗收通過）

- [x] Native target-only CustomEvent initialize／preupdate／postupdate／add／remove／destroy、once listeners、callback reentry／remove／destroy／remove-readd generation guards與next-frame continuation。失效tick跳過postupdate，不宣稱pre／post總數配對。
- [x] Actions moveTo／moveBy／rotateTo／scaleTo／fadeTo／finite numeric tween／delay／call、sequence overshoot／parallel completion／repeat fresh state／repeatForever cancellation；handle finished complete／cancel／destroy都settle，zero-time infinite repeat拒絕。Linear／quad／cubic／sine／bounceOut，local actions先於physics、pause凍結／resume完成。
- [x] Rotated nested atlas／HUD native pointer drag、two-pointer regression、target-only topmost／capture／parent-inverse drag、collider／singular graphics、第二pointer不搶drag與teardown。不是pixel-alpha picking／bubbling。
- [x] Camera follow／axis／smooth／deadZone／viewport-aware bounds、move／zoom／seeded shake與renderOffset／focus分離，input對齊最近呈現camera，remove target安全。

#### P14 實際證據（2026-09-30）

- Central integration **4檔／27 tests**；additional registration callback regression後pointer單檔 **7 tests** 另記；actions follow-up **2檔／18 tests** 與ES2022禁用Promise.withResolvers實際smoke。這些不是full-suite加總，歷史150不變。
- 正式gameplay2d Canvas native atlas拖曳：local(0,0)→(14.9,0.6)，screen(305.5,189.7)→(345.5,209.7)，證明parent-inverse delta。HUD local(24,24)→(54,39)，screen delta(30,15)。Held pointer下keyboard啟動Pause同步pointercancel／dragend；probe重複strings來自雙MutationObservers，恰一次以targeted regression判定。
- Paused UI sequence之cropped compositor140ms相同，resume顯示action sequence completed；實際Follow／Actions／Shake畫面已觀察、browser errors=0。真Game→Scene→Canvas renderer proof：move／zoom handles完成，follow+bounds focusX=23.33333333333333、target x90→screen(100,50)；shake3個displaced frames sample offset(-2.2525357234208383,-0.09846128849789076)，actual sprite `[255,0,0,255]`、focus不變，結束offset=0。
- Game pause70ms backing diff=0／Sprite x90／handle queued，resume到x120；callback remove／readd在frame13、續callback frame14。Destroy取消pending handle，initialize／destroy各一次；失效remove／readd tick不發postupdate是預期。Managed Chromium Canvas正式interaction proof；其他backend共同render證據由對應階段供應，不新增cross-browser／FPS／GC聲明。

### P15 — discrete rigid-body physics／triggers（限定 Chromium 三backend驗收通過）

- [x] Circle／box／3–32 strictly convex polygon真實contacts／point／overlap／sorted ray queries、invalidshape拒絕；dynamic worldroot、nestedstatic、circle uniform absolute worldscale、inertia隨geometry更新。
- [x] Fixed-step iterative linear／angular impulses：unequal-mass momentum／restitution／friction／off-center force與impulse／bounded rest jitter／dt partition與droppedTime cap。無CCD／joints／sleep／concave／edge／3D，高速tunneling明示。
- [x] Reciprocal masks／sensor／collisionstart-precollision-postcollision-end stablepayload／reversednormal、step-onlycancel、transientcontacts與callbackfilter／remove／destroy安全。
- [x] Triggerfilter／acceptedenter repeat／exit／explicit Infinity，真實three-backend circle floor／angularbox／trigger／isopolygon、pause／teardown。Physical outcome非debug geometry。

### P16 — orthogonal／isometric maps（限定 Chromium 三backend驗收通過）

- [x] Rotated／scaled tileToLocal／tileToWorld、elevation-zero worldToTile inverse、elevated topmost rectangle pickTile／depth／boundaries；不聲稱未提供的known-elevation overload。
- [x] Atlas pooledchildren／transformed conservativecull／camera pan顯hidden tile，setTile／clearTile preflightgraphics／metadata／registration、不複製Texture。
- [x] Orthbox／isodiamond／customconvex solids與P15真contact、edit更新碰撞；destroyowned children而非borrowedsheet。無editorimporter／hex／staggered／navigation。

### P17 — CPU pooled particles（限定 Chromium 三backend驗收通過）

- [x] Seeded point／rectangle／circle、fractionalrate／emitburst／dropnewcapacity、analyticposition／acceleration／lifetime／size／color與pixels；fixedpool／borrowedTexture。
- [x] Stop留survivors、clear重用、local跟parent／worldbirthaffine保留、新birth用新parent；pause凍age、destroypool／Scene refs、borrowedTexture仍alive。無GPU simulation。

#### P15–P17 正式 Game browser proof（2026-09-30）

- Managed Chromium150／macOS，source root exports viaVite；forced Canvas2D／WebGL2／WebGPU皆真Game→Scene→Renderer，640×400／pixelRatio1。**48 pixel assertions全部pass、21live screenshots、各backend errors=0；3files／40tests與ownedformat通過**。不是published dist／fulltoolchain／其他browser或throughput proof。
- 三backend circle rest y≈146.00568、orthosolid support≈87.00585；angularcontact峰值≈3.2347–4.4171、each trigger2enter／2exit、isopolygoncontact1。Ray solidmutation1→0，ortho ball穿removedtile落至y121.69–126.51。Unitregressions另驗mass momentum／rotatedfaces／friction／boxrestjitter<0.02、velocity<0.1、spin<0.05及dtpartition／catch-up。
- Localparticle移parent後到(160,285)、worldoldbirth保留(320,285)、newbirth採新parent；analytic tint／alpha、burst50 bounded12／12、stop後survivors到期。Pause freezesrenderframes／state；destroy Game／Scene／physics／maps／pool，activecounts0／Sceneobjects0，borrowedatlasalive直到ownerdispose。
- GPU COPY_SRC只加在throwaway proofcanvas的readback instrumentation，非renderer source變更；GL同task readPixels、preserveDrawingBuffer=false。RealRAF elapsed不同，逐backend獨立assertstaticRGBA／dynamicanalytictint。兩個harnesssample錯誤修正未改product；暫時harness移除、三tabs釋放。不測CCD／joints／concave／3D／Safari／Firefox／mobile／新performance。

### P18 — preload／native sampled audio alongside OPM（限定 Chromium 驗收通過）

- [x] PreloadBatch unique keys／bounded concurrency／task-count progress／empty／failure／cooperative abort與shared ownership；Scene.preload成功才initialize／publish，Game.loading owner guards、取消／失敗保留舊Scene。
- [x] Preunlock encoded fetch-only、不建contexts／不decoded-ready／play拒絕；gesture8contexts、first reused、worklet reset保持PCM。
- [x] Browser PCM decode／analyser alongside OPM，pause／resume／seek／loop／schedule／gain／rate／position／end／stop、Scene／Game teardown與persistent ownership。
- [x] PCM獨立voice budget、master／channel gain、Game pause audio clock獨立；native codec／post-decode budgets與transient caveat，analyser-only不宣稱聽見。

#### P18 modules 初步證據（2026-09-30；當時 phase 仍 PENDING）

以下保留當時audio/assets module-scoped紀錄：當時中央Scene整合尚待驗，4檔／33 tests通過、不改歷史150；後續phase整合結果見下節，不把33與35加總或重寫當時結果。

- 真正 Chromium：unlock 前0 contexts、sample not decoded、play reject；gesture 後8 running contexts，PCM重用第一個，decode metadata48000Hz／mono／0.5s。PCM analyser peak `0.1999878`，同場 OPM `0.5307934`；只證 analyser，不宣稱聽見聲音。
- Pause position `0.0693333` 保持；rate=2 resume到 `0.26`、seek／loop `0.0726667`；volume=.25 peak `0.04999695`，master／channel mute=0。Worklet reset後 PCM仍 `0.04999695`，sample bus未切斷。
- Scheduled start前position=`0.1`、後=`0.172`；natural state ended。Scene cleanup owned stopped／persistent playing；destroy後8 contexts全部closed、errors=0。Game pause與audio clock獨立。
- Assets4 tasks progress `0,.25,.5,.75,1`；shared Texture=true／2×3，JSON Unicode `雪`，binary `[1,2,3,4]`、empty ratio=1；loader destroy釋texture。Shared cache subscriber abort只拒該caller，loader destroy中止shared fetch。
- Decode budgets在browser decode **後**：encoded8 MiB／2,097,152frames／8channels／192kHz／8,388,608values；不防decoder transient memory amplification、非global memory budget。Vendor未改、不增第九個context，其他瀏覽器未驗。

#### P18 Scene／Game 整合驗收（2026-09-30）

- Audio integration修正後 **4檔／35 tests**，12個owned files format通過；ES2022 runtime禁用Promise.withResolvers仍跑通。不是新full-suite／project-wide lint／build通過聲明。
- 真正Chromium Canvas Game：Scene.preload failure保留exact cause、old持續update，candidate沒有initialize且destroy／loading clear；cancel同樣保留old。Supersession晚到batch cancel不能清新loading。Paused old不tick、新candidate可prepare／publish，resume後new才tick；destroy active／pending各一次、promise reject／loading clear／shared resources released。
- Progress：failure `0,.25,.5,.75`、cancel `0,.5`、next `0,.5,1`、destroy `0,.5`；initialize僅old與next。
- Unique GLTFLoader.task partial failure destroy owned model與一個owned Texture，unrelated direct model／shared Texture存活；successful batch轉移ownership，不廣泛dispose loader。
- 修正後native audio仍8contexts、first reused、duration0.5s、analyser peak `0.04999695`，destroy全部closed／errors=0；不宣稱聽見聲音。僅記錄的Chromium scope，其他browser／新performance未驗。

### P19 — whole-frame fade／crossfade／slide（限定 Chromium 驗收通過）

- [x] 三 backend renderer真實geometry＋world／HUD／3D capture、fade／crossfade／四方向slide endpoint／midpoint及wholeframe-last pixels；actual三backend Game crossfade／fade另證publication／Promise與immutablecapture。
- [x] Prepare／ownedcapture／versioncheck才publish，old同步恰一次destroy／stopupdates、onlynewsimulate；snapshot不借oldTexture、preserveDrawingBuffer=false不agedread。Asyncfailure由scopedtests覆蓋；supersession／latesnapshot另有actual三backend nativecapture proof。
- [x] ActualGame pause-freeze／pendingPromise／resizepreservecapture／resumefinalframe→complete＋release／normalizedeasingendpoint；追加actual三backend effectcancel／nativecapture-version／synchronous listenerreentry／held-capture destroy。Inputblock／failure／loss與zero-duration／initialatomic由scopedtests及相應rendererproof覆蓋。

#### P19 renderer pixels／captures（2026-09-30）

- 三backend renderer whole-frame crossfade midpoint `[128,0,128,255]`，fade endpoints／midpoints與四方向slide；Canvas96 fractional-boundary cases。Owned capture跨舊Scene／Texture destruction與resize存活／scale。Foreign／destroyed capture、nested capture與loss cleanup為actual runtime；不以renderer proof替代setScene Promise／events／input／publication lifecycle。

#### P19 實際 Game 三backend handoff proof（2026-09-30）

- Central **4檔／30tests**：async capture atomicity／old updates untilcapture、pause Promise／snapshotresize、failure／supersession／latesnapshot、transitioncancel listenerreentry、fatal render preservepublishedScene、invalidoptions-beforeclaim與asymptotic easingendpoint。非fullsuite加總。
- Real root exports／Game.create／Scene／Sprite／ScreenElement＋native renderer，GPU／GL／Canvas三獨立Game，160×100 redworld→greenworld＋yellowHUD。PauseprogressGPU0.2332／GL-Canvas0.2，old updates start/final1/1且同步destroy，snapshotlive／Promisepending／transitioningtrue。Compositor PNG browserdecode驗GPUcenter `[196,59,0,255]`、GL-Canvas `[204,51,0,255]`，各吻合progressblend±1，HUD皆 `[255,255,0,255]`；非aged GLdrawingbuffer讀值。
- Pause resize200×120仍保160×100immutable capture／unchangedprogress；resume至原Promise完成，each nativeevents恰start→complete、finalprogress1／snapshotdestroyed／transitioningfalse／old仍updates1／errors=[]。FinalactualGame三backend另驗fade custom easing(t)=1-exp(-3*t)，完成強制progress1／disposeold＋capture／start-complete／errors=[]。
- 初始phase由上述actual三backend Game及4檔／30scopedtests接受，當時額外capture／version／reentry fault-races只依scopedtests；後續actual三backend補充見下節。正式gameplay2d另已真UI證明paused-effect cancel保publishedScene；formalexample與fulltoolchain DONE，最後37files252tests另記、不把scopedcounts加總。

#### P19 追加 actual native Game cancel／version／reentry／destroy（2026-09-30）

- 三獨立root Game.create強制且report WebGPU／WebGL2／Canvas2D，實際Scene／world Sprite／yellow HUD及native capture／render。Observers呼叫原native方法；已真正allocated capture以明確gate延後回傳，非renderer mocks。每個await有5秒上限、皆無timeout；source保持凍結。
- Presented left slide在progressGPU≈0.167／GL≈0.1663／Canvas≈0.1667 pause，live screenshot可見green outgoing＋yellow HUD／blue incoming stripe。原visual Promise仍pending；setScene(publishedScene)保published Scene、reject原Promise cancellation、恰start→cancel、dispose capture，後續只incoming更新。
- Async nativecapture gate期間old仍alive且updatesGPU／GL3→5、Canvas5→7；新version原子publish winner／dispose old＋obsolete candidate。放行late capture後obsolete Promise reject、late snapshot dispose、winner不變，never-published request不emit visual event。
- Active paused nativefade的transitioncancel listener同步setScene(latestBlue)，listener恰一次；active及outer interrupted兩個Promise都reject cancellation，nested latest resolves／remains current。Interrupted candidate／先前Scene／capture全dispose，無錯誤complete。
- Held nativecapture期間Game.destroy立即清current／pending、dispose全部renderer-owned captures、borrowed textures保留，跨兩次real RAF無新simulation。公共setScene Promise仍等受控capture回傳；放行後5秒內reject、不publish，**不聲明提前abort native await**。
- 三Games各4真native snapshots，共12且0live；各scenario Game errors=[]。Borrowed external textures由實際owner另destroy；全部Games／captures與owned tab已cleanup。此為追加觀察，非新增fullsuite／其他browser／driver-memory或performance認證。

### P20 — native WGSL／GLSL materials／2D layer post（限定 Chromium 驗收通過）

- [x] GPU／GL prepare後per-Sprite native effect／16-float uniforms有指定pixels，source UV／premultiplied RGBA／tint／opacity／hierarchy／z保留。Invalid shader GraphicsError／unprepared／destroyed拒絕，pending preparation cancel／loss實際清理，不fake fallback。
- [x] **Transparent 2D world＋HUD→ordered ping-pong post→composite over unchanged 3D／P12→P19 whole-frame transition**。Prepared pipeline／program＋uniforms跨resize／disable保留、無async reprepare；mutable attachments釋放，descriptor destroy立即釋其entry，loss／renderer destroy清全部；snapshots不因resize／disable銷毀。
- [x] Canvas2D prepare／visible material／nonempty effects2D明確UnsupportedGraphicsError，ordinary 2D仍支援；無transpiler／IR／Graph／任意bindgroups／多texture slot／custom vertex attributes。

#### P20 實際 native pixels／lifetime（2026-09-30）

- **2檔／7 graphics/material tests**；真GPU／GL native uniform material green `[0,255,0,255]`→yellow `[255,255,0,255]`，ordered post forward `[128,0,0,255]`／reversed `[96,0,0,255]`，top-left sampleInput pixels已驗。Source cap65536 chars／native language、16floats、WGSL uniforms.values[4]／GLSL uniforms[4]／uniformValue(index)，回premultiplied RGBA。
- GPU 3D HDR mesh `[0,244,0]`不受2D post改變，owned HDR capture crossfade `[0,122,128]`。Actual invalid compiler／unprepared／destroyed descriptors、foreign／destroyed capture、nested capture、pending prepare cancellation／loss皆已exercise；errors不silent swallow。
- GPU／GL各 **20 resize／disable／reenable cycles**：prepared counts穩定、不async reprepare，mutable targets每disable回exact baseline。GPU pipeline baseline12；live textures4／buffers7→descriptor destroy buffers5；GL programs8→descriptor destroy6、targets回textures2／FBO1／renderbuffer1。Renderer teardown所有tracked native texture／buffer／FBO／renderbuffer／program／shader皆0，snapshotDestroyed=true、errors=[]。這是tracked resource proof，不claim總driver-memory／GC或新performance。
- P19／P20限定已記錄Chromium profiles；formalconsumer／最後fulltoolchain亦通過。無Safari／Firefox／Edge／整張framebuffer parity聲明。

只依以上 explicit profiles 驗收；upstream-main-only lighting／serializer／pause plugin architecture 與外部 plugins／editor formats 持續排除，不自動加需求。多語 README／usage／technical／DESIGN 的功能說明與已通過標記須等各階段真實 smoke 再更新。

## 正式 gameplay2d P13–P20 消費者整合（2026-09-30，DONE）

- Source-Vite `/examples/gameplay2d/`只用rootexports，forcedWebGPU／WebGL2／Canvas2D各真Game。Atlas／glyph／NineSliceHUD、native nested/text drag／Actions／follow-bounds／camera culling、angularbody／trigger、orthosolid edit＋isoelevation、local/worldparticle stop-expire→0/0／burst24/24均實際操作；three finalsurfaces／resource-surfaces screenshots可見，各errors.entries=[]。
- Pause前後diagnostics ticks／body／contact／particle完全相同；三backend trustedtouchcancel pointer2、dragend localGPU(74,39)／GL-Canvas(69,39)、HUD固定。Camera pan visibleorthotiles66/96→0/96、iso12/12；tilecontrol真正切frame1／solidfalse／elevation0。
- 每Scene真PreloadBatch OPM／PCM／PNG三resources，3/3ready且Game.loading ownedbatch-at-completion true。Nativeaudio經gestureunlock，exactly8runningAudioContexts／PCMcontext0；GPU PCMpeak0.07999511808156967／OPM0.027916936203837395。PCM pause不斷OPM、seek0.2s／rate1.5／looptrue／resume；非聽見聲音。
- 每backendfade／crossfade／slide完成；pausedvisual保持transitioningtrue，Cancel pending/effect保publishedScene2，之後能完成新switch。GPU／GL visibleMaterial／world＋HUDpostenabled，Canvas兩控制明確UnsupportedGraphicsError、不app consoleerror。
- Destroy三backend真Game／Scene／native descriptors／borrowed authoredfixtures／AudioContexts／objectURL cleanup，GL／Canvas各記8contexts closed。Formalconsumer／新controls與完整工具鏈DONE，Actions最後37files252tests／packproof另記。無其他browser／dist-only browser consumer／新performance。

## 本輪既有範例 browser 回歸（2026-09-30）

Managed Chromium／既有Vite localhost5173，未改application source；六個既有範例加advanced3d皆errors.entries=[]。實際矩陣：

| 範例          | 已exercise backend／surface                                                                                                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| triangle      | WebGPU RGB triangle，native Pause／Resume／Destroy                                                                                                                                                                                          |
| sprite        | WebGPU overlap、z1→-1／opacity0.55→1／sharedTexture；unlock八nativecontexts，四SFX只reset6／7、music0–5保持，OPM peak0.028024163；Stop／pagehide close8                                                                                     |
| cube3d        | GPU／GL texturedcube／sphere／overlay；Canvas明確no3Dcapability                                                                                                                                                                             |
| fallback-demo | Native backenddropdown GPU／GL／Canvas；GPU／GL sprites／circle／cube、Canvas僅sprites／circle，capability相符                                                                                                                              |
| pong          | Auto→WebGPU，ArrowDown／nativepointerhold移paddle；pause1400ms serving不變、resume score0:1、restart0:0／serving                                                                                                                            |
| showcase      | GPU／GL litcube／sphere／animated2D，Canvas2Dprofile；GPUunlock／SFX／pause／resume／volume／SceneB：八contexts，60%peak0.02225318、keyboardHome muteall0、25%music≈0.007、SceneB nonpersistentstopall0                                     |
| advanced3d    | GPU／GL PBRsphere／shadowinstances／greenGLTFribbon；GPUorthographic／shadowsoff／post／Floorpickdistance15.06／nativeorbit／pause-resume-destroy；pauseSHA256400ms相同、resumechanged；GLpause-resume-destroy；Canvasexplicit3Dunsupported |

Audio是analyser非聽見；pagehide以實際registered handler的PageTransitionEvent(persisted:false)清八contexts、非BFCache測試。Helper／realm／screenshotselector harness問題已修正，finalapp無regression／errors。只以上backendmatrix，不擴成每example全backend／auto全部、cross-browser／newperformance；最後工具鏈通過另記下節。

## P13–P20 最後工具鏈與封裝驗收（2026-09-30）

- macOS arm64，Node **26.7.0**／pnpm **12.6.0**。Frozen-lockfile install／build／typecheck／test／lint／format:check最後全部exit0；Vitest **37檔／252tests passed、0failed**。Build minify **103JS files，620274→333256bytes，vendor unchanged**。不是FPS／GPU-memory改善。
- 初次diagnostics 36files244pass／2fail（246total）、stabilization37files250pass／2fail（252total）保留為修正前結果；最後37／252才是通過值。Compilation／fixtures／lint-format由owners修正後重跑成功，不將initialfail隱藏、也不改P09–P12歷史25／150。
- Built-dist與實際pack後extractedarchive各跑rootconsumer：91exports／103JS＋103d.ts／14vendorfilesbyteidentical；Promise.withResolvers unavailable，actioncompleted／move80／fade0.25／camerafocus30／shakecancelled／coordinate-roundtriptrue／preload42。這是真compiled-root runtime，不只export或mock check；不是dist browserrender/audio認證。
- `xyz.js` **1.1.0** pack共 **325entries**（103JS＋103maps＋103declarations＋14vendor＋metadata），strict isolated ES2022 declarationconsumer exit0。第一次directCLI typeconsumer遇TS5112 tsconfigconflict，明確`--ignoreConfig`後最終成功；`--skipLibCheck`僅略library internals、consumer仍strict。產物僅本地pack，未npm publish、未升版／改license／commit／push。
- 上述是codefreeze後最後實跑紀錄；最後documentation-only changes只重做ownedformat／link-snippetcheck、不把既有runtimechecks再跑成新證據。Archive SHA由最後交付artifact回報，避免文檔封裝後自我改hash；無Safari／Firefox／Edge／mobile／newperformance／整framebufferparity聲明。

### Extracted minified pack 的真正 native browser consumer（2026-09-30）

- Managed headless Chromium150，從實際archive解壓並以plain HTTP static files import `/dist/src/index.js`，無Vite／transformation／TypeScript sourceimports。強制且report WebGPU／WebGL2／Canvas2D三個獨立Game；不是Node runtime或source browser證據替代。
- 三backend Actions皆完成至x112／y64／opacity0.5後pause。原位置變回background `[6,9,17,255]`，moved-faded pixel GPU／GL `[130,132,136,255]`、Canvas `[131,132,136,255]`。GPU／GL prepared native material pixel `[0,255,0,255]`；Canvas明確unsupported、原白sprite保留 `[255,255,255,255]`；untouched sprite三者皆white。
- Preload before gesture各0audioContexts／未decode，preunlockplay各AudioError。Trusted native gesture後各8runningcontexts，PCM重用first context、1native source、RMS GPU≈0.259572／GL≈0.260023／Canvas≈0.259876；pause positionstable／resumeplaying／stopstopped。不是聽見聲音或其他codec／browser認證。
- 各Game errors=[]，最後Game.destroy／playback stopped；3tabs closed、staticserver停止、temporary extractedarchive／consumerfixtures移除。Finalpack在README freeze後刷新，唯README不同，**323個dist／vendor／maps／declarations byte-identical於browser已測archive**。SHA由交付artifact提供，不再改README。
- 此限定packedconsumer補充action/material/PCM的compiled-browser路徑；全formalgameplay2d／world48assertions／其他範例仍是各自已記source-Vite profiles，不擴稱全部examples／cross-browser／performance pass。Documentation-only證據補記不重跑相同engine／vendor。

## GitHub v1.2 發佈與後續 PixiJS 工作邊界（2026-09-30）

使用者已確認 GitHub **v1.2** 指向 exact commit **`299afe29713b71dca2d120d3a4452812208c3c27`**；該 source commit 的 package metadata 歷史值為 **1.1.0**。後續 release asset 修正為 **`xyz.js-1.2.0.tgz`**、archive 內 package version **1.2.0**，舊 asset 已移除，新 SHA256 **`8f750720d5e47f418ed8b633e7dae53c64518354ac9eb773738c3ed3017d863f`**；323 個 code／dist／vendor 內容 byte-identical，未改 tag／commit。這是外部 release artifact metadata 修正，不是本 working tree 升版、npm publish 或授權變更。暫停期間 PixiJS 變更保留但未納入 release，**P21–P29 未發佈／未驗收**。上方當時 37 檔／252 tests、日期、1.1.0 本地 archives 與當時未 commit／push 紀錄保留，不改寫歷史。

## P21–P29 已批准 profiles：整合實跑紀錄（2026-09-30）

官方比較基準：[PixiJS v8.21.0](https://github.com/pixijs/pixijs/releases/tag/v8.21.0)，2026-09-17 發佈，pinned commit `ecd3797cf9b57766b045f3eea8388db9677744f8`。批准範圍見 [PLAN 的 P21–P29 profiles](PLAN.md)。下表「已驗」只指下方 [整合實跑證據](#p21p29-整合實跑證據2026-09-30) 實際觀察的項目，「未驗」為尚未執行的 boundary／環境；不以既有 252 tests 或研究閱讀代替。

| 階段 | 已驗（單一環境，見整合實跑證據）                                                                                                                                                                                     | 未驗                                                                                                                             | 目前狀態             |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| P21  | 三 backend 共用 command stream 的 global z／HUD／skew／mutable pivot／round-trip／singular／native capture／trusted skew-parent drag；WebGPU 已改用同一 command 模型                                                 | combined P19 transition 與新 command 的組合 regression                                                                           | 主流程已驗           |
| P22  | 三 backend asymmetric／rotated／trimmed／resolution2 atlas：四角像素、trim 位置、旋轉與 nearest 下鄰 frame 不 bleed，三 backend 位元組一致；正式範例 tiling 與 wheel；abort／failure page cleanup 有 regression test | tileRotation／roundPixels 專項像素、linear 取樣邊界、animation orig anchor 逐幀                                                  | 主流程已驗，專項未驗 |
| P23  | 三 backend Graphics2D hole／fill／center stroke 像素一致，`containsPoint` 尊重 hole；範例 gradient 與 latest-wins update                                                                                             | curve／cap／join／miter／pattern 專項像素、allocation budget 邊界、late destroy                                                  | 主流程已驗，專項未驗 |
| P24  | IsolatedGroup2D outer z、RenderTexture render／extract／generateTexture、cache stale-until-update、五種 blend 像素三 backend 一致；CanvasTexture update 後 Canvas2D 範例截圖色彩改變                                 | feedback／foreign／resize／device loss 拒絕的 runtime 專項、P19 snapshot 不變性專項、GPU／GL 的 CanvasTexture 像素               | 主流程已驗，故障未驗 |
| P25  | rect／image mask 與 inverse、五 blend 數值；Alpha／ColorMatrix／Blur／Noise 在 WebGPU 與 WebGL2 位元組一致，Displacement 僅 WebGPU 像素觀察；Canvas 對 filter 明確 UnsupportedGraphicsError                          | nested／red-channel mask 專項、geometric hole hit 拒絕（僅 Graphics2D 已驗）、Displacement 於 WebGL2 的像素、filter padding 邊界 | 主流程已驗，專項未驗 |
| P26  | Plane2D 與 true projective PerspectiveQuad2D 網格 UV 四象限在 WebGPU／WebGL2 位元組一致；invalid quad atomic reject 有 test；Canvas visible mesh 明確 UnsupportedGraphicsError                                       | Rope2D／triangle picking／z／reflection 專項                                                                                     | 主流程已驗，專項未驗 |
| P27  | 真 Abel FontFace、Text2D 樣式與 setText／setStyle、proportional 多頁 BMFont（AV kerning／non-BMP）、動態 RGBA atlas、typed manifest（範例三 backend）；manifest 失敗 cleanup 與 parser 惡意輸入有 test               | wrap／align／descent 專項像素、manifest cancel 對 Scene 保留、FontFace 於其他瀏覽器                                              | 主流程已驗，專項未驗 |
| P28  | 預設 target-only 不變；opt-in capture→target→bubble 順序（trusted pointer）；drag／wheel；語意 DOM focus 後 Enter／Space activate                                                                                    | two-pointer／upoutside／tap 專項、masked geometry 與 accessibility clip、disabled／cleanup 邊界                                  | 主流程已驗，專項未驗 |
| P29  | ParticleLayer2D 三 backend 像素（含 tint）；prepareTextures／unloadTexture 於範例實跑無誤；minified dist 於 plain HTTP 三 backend 正式 Game 執行                                                                     | capacity／drop-new／versioned setter 的 runtime 專項（僅 module 層舊紀錄）、native upload 是否真的預熱不可由 API 觀察、效能      | 主流程已驗，專項未驗 |

共用驗收：正式 Game→Scene→Renderer，不另建 renderer demo。原 Sprite width／height 自然尺寸、P14 target-only default／lifecycle、普通 global stable z、P20 prepared descriptor lifetime、P19 final whole-frame transition保持。只有 opt-in isolated subtree改outer compositing slot。Native owner／resize／disable／loss／destroy／late Promise 故障與 borrowed-vs-owned資源逐階段驗證；測試數只記實跑，不加總scoped suites，pixels不等於整framebuffer parity，analyser不等於聽見。

Profile 限制：raster Graphics不是GPU vector；Canvas native Mesh2D／Filter2D明确error；HTMLText／SDF-MSDF／fullSVG、video/raw/compressed/mipmaps/anisotropy、其他advanced blends、generalRenderLayer／plugin registry／arbitrarybindings／independentTicker／generalGC未納入，不宣稱 full Pixi parity。Required CanvasTexture／fontgeneration／ParticleLayer／preparation不得以早期「optional」措辭省略。其他browser／硬體／CSP／codec／性能仍須另驗。無新runtime dependencies／Pixi sourcecopy／OPM變更／version-license／commit-push授權。

### P21–P29 authored fixtures 驗證（2026-09-30，非功能驗收）

- 新增 `examples/rendering2d/fixtures.ts`：procedural asymmetric PNG atlas／clockwise packed frame／trim／orig／resolution2／anchor／borders／named animation、pattern、horizontal-red／vertical-alpha mask、two-page authored bitmap glyphs與 AngelCode text／JSON（AV kerning -2／unequal advance／U+1F600）。Returned object URLs由 caller dispose；重複 dispose冪等，failure釋已建立URLs。
- Real managed Chromium 以既有 localhost source server載入fixture模組，實際encode/decode PNG並drawCanvas：32×32 atlas、rotated red `[255,0,0,255]`與yellow `[255,255,0,255]`位置、mask channels、2 fontpages／non-BMP／kerning metadata觀察通過；double dispose後fetch URL失敗。Screenshot可見atlas／mask／glyphs及browser FontFace文字。這只驗fixtures，不是P22／P25／P27 Game rendering／parser驗收。
- Licensed webfont為 **unmodified Abel-Regular.ttf，35220bytes，SIL OFL1.1**；`assets/OFL.txt`保留copyright／reserved name Abel／完整license。[Pinned官方Google Fonts source](https://github.com/google/fonts/blob/9437b806936896fa1a8c812e561067a5f30f5933/ofl/abel/Abel-Regular.ttf)，SHA256 **`8809dcad25318225052f88333e208c5aad4adcb7b2c934c135735ec19aa410b4`**，browser fetch核對digest且FontFace.status=`loaded`；沒有新的runtime dependency或根套件license改變。
- Fixture單檔 strict ES2022＋DOM／noEmit TypeScript成功；未跑project-wide tools／formatters，交由main於integrated freeze後一次驗證。額外Vite service啟動因5197已使用而失敗；讀實際錯誤後使用既有server，未停止其他owner服務；browser tab已關閉。尚未作P21–P29完整source／packedconsumer／跨browser／performance proof。
- 後續依使用者要求僅format owned fixture／PLAN／ACCEPTANCE／DESIGN／asset README，成功；新增 [font provenance](examples/rendering2d/assets/README.md)保留pinned URL／SHA／用途／license責任。Scoped actual BitmapFontLoader.parse(JSON)已確認zero-area space(0×0, advance4)／AVkern-2／non-BMP保留；malformed `kernings:[null]`當時raw TypeError已回報module owner，未以此宣稱parser安全／P27功能驗收。

### P21 source foundation 實跑證據（2026-09-30；integration owner 回報）

- 正式 source Game 強制 WebGPU／WebGL2／Canvas2D：interleaved ordinary Group／equal inherited global z pixel 為 blue `[0,0,255,255]`，HUD 即使 z=-100 為 green `[0,255,0,255]`，reflected/skew hierarchy 為 red `[255,0,0,255]`。三 backend 直接修改 `pivot.x += 10` 後 `(90,40)` 從 red 變 background `[6,9,17,255]`，保留 mutable-vector 重 compose 契約。
- Alias-safe local／world round-trip `(4,7)` 得約 `(4.00000474,7.00000243)`；singular inverse 為 RangeError。三 backend actual native captureScene snapshots 為 160×100 且 cleanup 後 destroyed=true；Game.destroy 後 borrowed Textures 存活，各 backend errors=[]。
- Trusted Canvas drag 在 skewed parent 下，screen delta `(30,20)` 對應 local delta 約 `(29.15565,14.27900)`，target event 真實觀察。此 source foundation gate 先於後續 native expansion；不是全部 P21–P29／packed consumer／cross-browser 驗收。Combined P19 transition regression、最後 integration tools／counts 待完成，不重用歷史 252。
- 本 documentation worker 的 read-only P27 browser schema review 曾觀察 JSON `info.size:"16"` 被 BitmapFontLoader.parse 以 Math.abs 強制轉為 16；此 defect 已於整合階段修正，現在 numeric string 與 `kernings:[null]` 均以 AssetError 拒絕，並由 `tests/rendering2d-assets.test.ts` 覆蓋。

### P22／P27 shared asset primitive proof（非 phase 驗收）

Atlas recovery owner 回報 actual source-root browser 以 controlled createImageBitmap 完成時序驗證：unique acquisition 在 queued abort depth1／depth2 reject 且 closeCalls=1；depth3 已交付 caller ownership，loader.destroy 不關 bitmap（closeCalls=0），caller.destroy 後為1。Shared loadTexture depth2 abort 只 reject subscriber，closeCalls=0，後續 cached Texture 仍 alive。這證明該 late-abort ownership primitive 修正，不代表 atlas pixels／正式 Game／P22 或 P27 acceptance，也不是 native GPU upload／driver memory 證據。

P22 acquisition／metadata 的 source-root actual browser proof（同 owner 回報）：第二個 multipage image malformed 時為 AssetError，已取得第一個 unique native bitmap closeCalls=1；queue-depth2 atlas abort reject `atlas cancel`，已取得 bitmap closeCalls=1。同 URL independently cached shared bitmap 在兩次 failure 後仍 alive。實際讀得 rotation90／resolution2／natural10×8／trim(4,3,12,8)／anchor(.5,.5)／panel borders3／named turn；Sprite(view).destroy 不釋 borrowed page。此處尚未證正式 Game atlas pixels／sampler／tiling／animation，P22 仍 pending。

### P23 native path boundary proof（非 Game／phase 驗收）

Graphics recovery owner 回報 Chromium native Path2D：outer rect(0,0,10,10) 與 outside hole(20,0,5,5) 的 conservative bounds 為 `{x:0,y:0,width:25,height:10}`；native raster `(22,2)` 為 `[255,0,0,255]`、containsPoint=true，SVG path counterpart hit=true。Bounds／picking 必須符合 native fill 的 outside subpath 結果，不能因「hole」名稱錯誤忽略範圍。Transactional owned Graphics2D facade 已落 source，但 formal Game／gradient／stroke／pattern／latest-wins proof 尚待完成，P23 不以此接受。

### P29 ParticleLayer source Canvas Game proof（native／整合仍待驗）

Particle recovery owner 回報 canonical root Canvas Game：capacity2 第3次 add 回 -1／count2；capacity1 target-emitter emit2 仍1，drop-new 無 backlog。dynamicAttributes=0 時，red view＋inherited tint `[.5,1,1,1]`／parent opacity .5 pixel `[67,4,8,255]`，blue 為 `[3,4,136,255]`。Remove／reuse slot0 增 generation 並 blue 取代 red，setSource(red) 恢復 red。

Local／world emitter green pixel `[0,255,0,255]`；parent 在 birth 後 +20，local x≈41.667／world x≈81.667（birth world80 保留），old local pixel 回 background `[6,9,17,255]`。Actual Game pause100ms transform／pixel 完全凍結；stop 保留 live1，clear count0 並回 background，errors=[]；Game.destroy 後 borrowed CanvasTextures 存活。

另 scoped module runtime 同 seed 的 local／world affine 對 P17 Sprite fallback maxDiff0；source setters 保 generation／active owner，舊 emitter 不改 externally removed／reused slots；destroyed-source failed emit 留0／0，修正原1／0 ownership。未跑 project tools，GPU／GL particles、native prepare／unload／全部 P29 consumer 與 packed integration 待驗；不宣稱 GPU simulation／FPS。

### P22／P24 source module ownership／validation proof（非 Game pixels）

Atlas recovery owner 回報 source-root browser：CanvasTexture2D 自有 red snapshot 不受 borrowed canvas 改 blue 影響；explicit update 後 blue／version1，zero-dimension update atomic reject 保舊 image／version／dimensions；destroy 不改 borrowed canvas12×12。Tiling coverage42×30 獨立於 res2 view natural6×4，invalid resize／rotation 不改有效狀態，subnormal scale reciprocal overflow 拒絕。NineSlice.fromView physical borders3／res2 得 logical corner1.5，fractional coverage15.25×13.5／partial tiles 為42 children，child teardown 後 borrowed atlas page 存活。正式三 backend Game sampling／tiling／CanvasTexture refresh 尚待驗；module 結果不提升 P22／P24 acceptance。

### P21–P29 整合實跑證據（2026-09-30）

**環境**：macOS arm64、managed headless Chromium（有 WebGPU adapter；未區分實體 GPU 與軟體 adapter）、localhost Vite source server 與 plain HTTP static server。這是唯一環境：**未驗** 其他瀏覽器、實體 GPU／driver、CSP、效能／FPS、device／context loss 回復。

- **工具鏈**：`tsc -p tsconfig.check.json`、`eslint .`、`prettier --check .` 全通過；`vitest run` **39 檔／262 tests** 通過（本輪新增 `tests/rendering2d-assets.test.ts` 7 tests；歷史 37 檔／252 tests 保留原紀錄）。Build（tsc＋minify 130 個 JS 檔 967696→513589 bytes＋vendor copy）成功，dist 含 `dist/vendor/opm/`。
- **WebGPU 2D 重寫**：原 sprite-only pipeline 已由 `packages/graphics/src/webgpu-render2d.ts` 取代，sprites／tiling／meshes／particles／isolated groups／masks／filters／blends／render targets 與 WebGL2、Canvas2D 共用 command stream。錄製期間退役的 GPU 資源延到 submit 後才 destroy。
- **三 backend 像素**：同一組場景以 Game 的 `createRenderTexture`／`renderToTexture`／`extractPixels` 讀回。WebGPU 與 WebGL2 的 blends（normal `[64,64,191,255]`、add `[128,128,255,255]`、multiply `[64,64,128,255]`、screen `[128,128,191,255]`、erase `[128,128,128,128]`）、Alpha／ColorMatrix／Blur／Noise、Plane2D／PerspectiveQuad2D、ParticleLayer、cache、generateTexture、nearest 取樣皆位元組一致；Canvas2D 與 WebGPU 的共同子集僅有 ±1 量化差（`192` 對 `191`、erase `127` 對 `128`）。Atlas asymmetric／rotated 四角顏色與 Graphics2D hole／fill／stroke 在三 backend 位元組一致。
- **WebGPU 專項**：image mask、inverse rectangle mask、Displacement、ParticleLayer 與 live frame loop 於實際 Game 執行，`errors=[]`。
- **正式範例** [examples/rendering2d](examples/rendering2d/index.html)：`?renderer=webgpu|webgl2|canvas2d` 三者載入 typed manifest（atlas／pattern／mask／FontFace／BMFont）並依序執行 22 次控制項操作（16 種控制項，含 mask×4／blend×4 循環），均無 error；Canvas2D 的 filters／mesh 控制以 renderer 真實的 `UnsupportedGraphicsError`（`Canvas2D does not support native Filter2D.`／`…visible Mesh2D.`）回報，不切 backend。Trusted pointer：atlas sprite drag、背景 wheel；opt-in hierarchy 事件順序為 `parent-capture`→`child-target`→`parent-bubble`，預設 target-only 為 `child-target`；語意 DOM 節點 focus 後 Enter 與 Space 各觸發 `activate`。
- **既有範例回歸**：triangle／cube3d／advanced3d／sprite／gameplay2d／pong／showcase／fallback-demo 在 WebGPU 皆載入且 console 無 error；showcase 與 gameplay2d 截圖顯示 3D 與 2D 疊合、particles、nine-slice、tiling 正常。WebGL2 與 Canvas2D 僅以範例 rendering2d 與上述像素場景涵蓋，未重跑全部舊範例。
- **Minified dist**：以 plain HTTP 載入 `dist/src/index.js`，WebGPU／WebGL2／Canvas2D 三個正式 Game 的 rectangle mask 場景讀回 inside `[255,0,0,255]`、outside `[0,0,0,0]`。未執行 strict declaration consumer 與 extracted `npm pack` archive 重驗。
- **本輪修正的缺陷**：unique texture 取消時 bitmap 可能遺失所有權（`tests/rendering2d-assets.test.ts` 以掃描 abort 深度重現，移除修正後於 depth 1 失敗）；`Text2D.setText` 回到已顯示文字時未取消較舊 pending 更新；`Canvas2DRenderer` 在無 `DOMMatrix` 的環境建構失敗；`ColorMatrixFilter2D` 先複製後驗長度；WebGPU noise hash 與 WebGL2 不一致；WGSL tiling varying 順序錯誤。
- **未驗／非宣稱**：packed archive 與 declaration consumer、跨瀏覽器、效能、device loss、上表所列各階段專項，以及 Rope2D、透明 image-mask pixel picking（設計上僅 bounds）。無版本、授權、runtime dependency、commit／push／publish 變更。

## v1.4／v1.5 增量紀錄（限定已測環境）

**範圍**：v1.3 之後共 22 個 commit。v1.4 發佈安全強化與 Release；v1.5 包含空間音效、Gamepad、morph targets、EnvironmentMap、視錐剔除、glTF extensions、fog、WebGPU 4× MSAA、context／device 遺失復原、半透明排序、`FirstPersonControls`、`graphics.stats`、`scene.effects3D` 與 CI workflow。GitHub v1.4 tag 指向 `ccd9a67`；v1.5 tag 指向 `d5128fa`，Release 附 `xyz.js-1.5.0.tgz` 與 `SHA256SUMS`（tgz SHA-256 `9bfa9a457b0f68386c981a4f1ba36db3b2fd06d95069a58674ef891506d20e5c`）。

- **工具鏈（v1.5 HEAD）**：`prettier --check .`、`tsc -p tsconfig.check.json`、`eslint .` 全通過；`vitest run` **49 檔／338 tests** 通過；build 成功並保留 `dist/vendor/opm/`。`npm pack` 為 433 個檔案、433.8 kB。直接 import `dist/src/index.js` 可載入 `Game`、`FirstPersonControls`、`FogSettings`、`Frustum`、`GLTFLoader`、`EnvironmentMap`、`ActionMap`。這是 Node import，**不是**瀏覽器 consumer 驗證。
- **遠端 CI**：GitHub Actions `CI` workflow 在 v1.5 push 後於 `main` 成功（44 秒）。
- **行為變更**：`antialias` 預設 true（WebGPU 4× MSAA，多一份記憶體／填充成本）；`recoverGraphics` 預設 true（遺失後繼續執行，RenderTexture2D／snapshot 需重建）。
- **範例 `firstperson`**：`?renderer=webgpu`／`webgl2` 於 managed Chromium 載入，225 根柱子，stats 讀回 `meshes 226 · culled 124 · draw calls 102`（兩 backend 一致），fog 開啟時遠景淡出，3D-only tint 切換後畫面改變，console 無 error。Pointer Lock 需真實手勢，headless 無法觸發，**未驗**；起點（3, 1.7, 15）曾誤置於柱內而修正。
- **未驗／非宣稱**：真實 WebGPU device loss（僅 mock）；Pointer Lock 實機（僅 fake document）；實體 gamepad（僅合成 snapshot）；空間音效聽感（僅 mock nodes）；Safari／Firefox／Edge／行動裝置；minified `dist/` 的 extracted `npm pack` 重驗；新功能三 backend 逐項一致性。glTF `COLOR_0` 仍被拒絕；Draco／KTX2 因需外部 decoder 不支援。未 npm publish。
- **minified dist 瀏覽器 consumer（純 HTTP，不經 Vite）**：載入 `dist/src/index.js`，WebGPU 與 WebGL2 各建立 Game、fog 場景與一個視錐外 Mesh，`graphics.stats` 皆為 `meshes 2 · culled 1 · drawCalls 1`，`FirstPersonControls` 可載入，console 無 error。這只驗最小化後的入口與上述路徑，不是完整功能矩陣。
- **授權**：所有者授權後，根套件改為 Apache-2.0（新增根目錄 `LICENSE`、`package.json` 的 `license`）。已發佈的 v1.5 附件內 metadata 仍是 UNLICENSED，未重發。

## 弱點掃描紀錄（2026-10-01，v1.5 之後的 HEAD）

**範圍與工具**：本機、唯讀；Node v26.7.0、pnpm 12.6.0。依賴稽核會把套件名稱與版本送到 npm registry，未上傳原始碼或 lockfile 到第三方掃描服務。這是人工＋腳本檢查，**不是**專業滲透測試或 CI 掃描器。

- **依賴稽核**：`pnpm audit`（含 dev dependencies）回報 _No known vulnerabilities found_。runtime dependencies 為零；lockfile 與 `minimumReleaseAgeStrict` 未改動。
- **OPM vendor**：下載官方 `opm.js-1.1.0.tgz`，SHA-256 `1344a3c2…8121e` 與官方 `SHA256SUMS` 及 `vendor/opm/manifest.json` 相符；官方 `dist/`、`LICENSE` 與 `vendor/opm/`、`dist/vendor/opm/` 逐檔 `diff -r` 完全相同，無私人 patch。
- **Secrets**：對追蹤檔（排除 dist、lockfile、vendor）比對常見 token／私鑰／key 樣式，並檢查是否追蹤 `.env`、`.pem` 等檔名，皆無命中。git 歷史中無 `BEGIN PRIVATE` 字串。
- **危險 sink**：`packages`、`src`、`scripts`、`examples` 內無 `eval`、`new Function`、`innerHTML`／`outerHTML`／`insertAdjacentHTML`、`document.write`、`importScripts`、`localStorage`／`sessionStorage`／`document.cookie`。
- **打包內容**：`npm pack` 內容為 LICENSE、README、`dist/`（js／map／d.ts／json）與 OPM LICENSE；source map 只含相對路徑、無 `sourcesContent`，`dist` 內無本機使用者路徑。`ci.yml` 權限為 `contents: read`，用 `pull_request` 而非 `pull_request_target`。
- **不可信 glTF 輸入（v1.5 新增路徑）**：以臨時腳本（已刪除）送入 21 種惡意文件：morph target 為 null／字串／10 萬項／accessor 越界／不支援屬性／頂點數不符、weights 為 NaN 字串或長度不符、light 型別未知／索引 1e12／intensity 為字串／負 range／spot 角度顛倒／extension 型別錯誤、texture transform 為字串或 1e308、負 emissive strength、`extensions: null`、`emissiveStrength: 3e38`、`__proto__` 汙染。其中 19 種以 `AssetError` 快速拒絕（皆 ≤ 9ms）；`emissiveStrength: 3e38`（見下方資訊性項目）與 `__proto__` 文件（結果為空場景）被接受，`Object.prototype` 未被汙染。
- **Radiance／環境貼圖**：解碼器有 header／行長／RLE run／資料截斷檢查，尺寸上限 2048×1024；輸入極小但 header 宣告最大尺寸時會先配置約 25 MB 的 Float32Array 再因資料截斷而拒絕（受上限約束，列為資訊性）。
- **資訊性（非弱點）**：glTF 允許 Float32 範圍內的極大有限值（例如 `emissiveStrength: 3e38`、light `intensity`）；相乘溢位會被 `PBRMaterial` 以 RangeError 拒絕，但單獨的極大值會被接受，可能在 shader 中產生 Infinity 並造成畫面異常，不涉及記憶體安全。若要收緊，可對這些欄位加合理上限。`recoverGraphics` 在 WebGL2 等待 `webglcontextrestored` 時沒有逾時；若瀏覽器永不還原，畫面會停止更新而不會送出 error。CI 的 GitHub Actions 用 `@v4` tag 而非 commit SHA 釘選。
- **結論與未驗**：未發現已確認的可利用弱點，因此沒有程式碼修改或新增回歸測試。未涵蓋：真實瀏覽器 GPU driver／WebGPU 實作缺陷、Pointer Lock 與 Gamepad 實機行為、跨來源 CSP 部署設定、Audio 解碼器（瀏覽器內建）、對全部舊模組（v1.3 以前）的重新審查（僅依賴其既有測試與先前的強化紀錄）。此結果不代表安全稽核完成。

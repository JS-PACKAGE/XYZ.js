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
- **範例 `firstperson`（已移除）**：曾新增 `examples/firstperson` 並在 managed Chromium 的 WebGPU／WebGL2 驗證（stats `meshes 226 · culled 124 · draw calls 102`、fog、3D-only tint、console 無 error）；之後應所有者要求刪除該範例，v1.5.1 tag 仍含此目錄，目前工作樹已無。`FirstPersonControls`、`scene.effects3D` 與 fog 的 API 仍在，只是沒有專屬範例（fog 仍見 `advanced3d`）。
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
- **掃描後修補（同日）**：(1) `ResilientRenderer` 等待 `webglcontextrestored` 加上 10 秒逾時（`graphicsRecoveryLimits.restoreTimeoutMs`），逾時以 `GraphicsError` 結束復原並讓 Game 停止，還原或 destroy 時清除計時器；新增 2 個以 fake timers 驅動的測試（不依賴實際時間）。(2) `.github/workflows/ci.yml` 的 `actions/checkout`、`actions/setup-node` 改用 v4 tag 解析出的 commit SHA 釘選（註解保留 `# v4`）。GitHub Actions 仍未實際執行此變更。glTF 極大有限值未動，維持資訊性。

## P30 存檔與 Scene Snapshot（2026-10-01，限定已測環境）

- **新增**：`game.saves`（`SaveManager`）、`MemoryStorage`／`LocalStorageBackend`／`IndexedDBStorage`、`Serializer`／`gameObjectState`／`isSceneSnapshot`，範例 `examples/save-lab/`。與前述弱點掃描的「危險 sink」清單相比，`localStorage`／`indexedDB` 現在由 `packages/core/src/storage.ts` 使用，掃描結論不涵蓋此新程式碼。
- **自動化**：`tests/storage.test.ts` 8 個測試（round trip 與資料分離、依序 migration 且不改寫原儲存、corrupt／checksum／未來版本／schema 無效保留原文、非法 JSON 拒絕、namespace 隔離與位元組上限、localStorage quota 轉型與 IndexedDB 不可用、snapshot 擷取還原、unknown／missing id 與 strict 模式不套用）。完整套件目前 50 檔／348 測試通過；`tsc -p tsconfig.check.json`、`eslint .` 無輸出（通過）。歷史測試數保留不改。
- **實際瀏覽器**：managed headless Chromium 的 canvas2d，localStorage 與 IndexedDB 各自移動、儲存、重新載入頁面後還原位置（localStorage x=180、IndexedDB x=130），console 無錯誤。
- **未驗**：webgpu／webgl2 下 save-lab、Firefox／Safari 的 localStorage／IndexedDB 行為（含私密模式配額）、跨分頁並行寫入、真實配額耗盡、IndexedDB 在 `onblocked` 的實況。`build` 未執行（`dist/` 於發佈時一併重建）。

## P30b i18n（2026-10-01，限定已測環境）

- **新增**：`game.i18n`（`I18n`、`I18nError`、`bindText`）；`examples/save-lab/` 加入英文／繁體中文／日文切換。
- **自動化**：`tests/i18n.test.ts` 7 個測試（巢狀 key 與 locale lineage／fallback、插值與跳脫與缺參數、複數與數字格式、missing 政策、無效 tag 與表、localechange 次數、bindText 同步／解除／destroyed 忽略）。完整套件目前 51 檔／355 測試通過；`tsc -p tsconfig.check.json`、`eslint` 無輸出（通過）。
- **實際瀏覽器**：managed headless Chromium 在 canvas2d／webgl2／webgpu 開啟 save-lab（`lang=zh-Hant`）後切換到日文，Text2D 與狀態列重繪為日文，存檔後訊息為「保存しました」，console 無 error／warning；canvas2d 截圖確認日文 Text2D 顯示。
- **未驗**：Firefox／Safari；`Intl.PluralRules` 在 `ar`／`ru` 等多形式語言的實際輸出（只測了 en／zh-Hant）；RTL 排版與雙向文字；字型缺字回退。

## P31 Physics2D 擴充（2026-10-01，限定已測環境）

- **新增**：body 休眠（`allowSleep`／`isSleeping`／`wake`）、`ccd` 連續碰撞、`DistanceJoint`／`RevoluteJoint`／`PrismaticJoint`／`WeldJoint`／`MouseJoint`、`decomposeConvex`／`StaticConcave2D`／`StaticChain2D`、`world.debugSnapshot()` 與 `PhysicsDebugDraw2D`；範例 `examples/physics2d-lab/`。另修正一個實測發現的問題：restitution 門檻原為固定 1 px/s，在像素尺度重力（600）下靜止的彈性 body 每步都被重力推出約 10 px/s 的接近速度而反彈，永遠無法休眠；現改為 `max(1, |gravity| × fixedDelta × 2)`（`restitutionGravitySteps`）。這會改變「低速接觸是否反彈」的行為，但高速撞擊不變。
- **自動化**：新增 `tests/physics2d-sleep.test.ts`（含 restitution 回歸）、`physics2d-ccd.test.ts`（5）、`physics2d-joints.test.ts`（10）、`physics2d-shapes.test.ts`（4）、`physics2d-debug.test.ts`（3，含 region 過濾）。完整套件目前 56 檔／381 測試通過；`tsc -p tsconfig.check.json`、`eslint .`、`prettier --check .` 通過。歷史測試數保留不改。
- **實際瀏覽器**：managed headless Chromium 在 canvas2d／webgl2／webgpu 開啟 `examples/physics2d-lab/`：8 個 joint 運作；CCD 開啟時以 4000 px/s 發射的子彈被 4 px 薄牆擋住，關閉後穿牆；8 顆球落入凹形杯後全部休眠（Sleeping: 8）；以 canvas 上的 PointerEvent 拖曳彈簧重物時 joint 數 8→9→8；canvas2d 重新載入後 console 無 error／warning（debug overlay 預設啟用，需 `region` 才不會在子彈飛出世界時 raster 超出預算——此問題在實測中發現並修正）。
- **未驗**：dynamic 對 dynamic 的 CCD、旋轉掃掠、joint warm starting 的穩定性（硬鏈需更多 iterations）、Firefox／Safari、實機 touch 拖曳、大量 body（>1,000）下 sleep／CCD／debug overlay 的效能。Debug overlay 每次 refresh 重新 rasterize，未量測其 CPU 成本。`build` 未執行（`dist/` 於發佈時一併重建）。

## P32 glTF 壓縮與 KTX2（2026-10-01，限定已測環境）

- **新增**：`decodeMeshopt`（`EXT_meshopt_compression`，含 fallback buffer）、`GLTFLoadOptions.dracoDecoder`（`KHR_draco_mesh_compression` 的可注入解碼器）、`parseKTX2`／`decodeKTX2`／`GLTFLoadOptions.ktx2Transcoder`（`KHR_texture_basisu` 與未壓縮／ZLIB 的 KTX2）。
- **對照官方實作**：以 npm `meshoptimizer@1.3.0` 的官方編碼器產生資料，並以官方 wasm 解碼器對照。拋棄式差異測試共 450 個案例（vertex v0／v1 × 7 種 stride × 10 種數量 × 3 種資料，triangle 與 index sequence 的 16／32 位元各數種大小，octahedral 8／16、quaternion、exponential、color 8／16 filter）：449 個與官方輸出逐位元組相同；quaternion 有 1 個位元組差 1 個最小單位（浮點精度）。永久測試使用其中 10 組小型向量（`tests/fixtures/meshopt-vectors.ts`，記錄產生器與版本）。
- **Draco 實測**：以 npm `draco3d@1.5.7` 內附的官方 `bunny.drc`（34,834 點、69,451 面）在拋棄式測試中透過 `dracoDecoder` 載入，通過 loader 的索引與長度驗證（該檔因體積不納入 repo）；永久測試用假解碼器涵蓋錯誤長度、NaN、缺屬性、索引越界與 fallback。
- **自動化**：`tests/meshopt.test.ts` 11、`tests/gltf-compression.test.ts` 6、`tests/ktx2.test.ts` 6。完整套件目前 59 檔／404 測試通過；`tsc -p tsconfig.check.json`、`eslint .`、`prettier --check .` 通過。
- **實際瀏覽器**：managed headless Chromium（webgl2 分頁）用真實編碼的 meshopt 資料與 `CompressionStream('deflate')` 產生的 ZLIB KTX2 載入同一個 glTF，頂點數 5、索引 `[0,1,2,0,2,3,4,0,1]`（triangle codec 可旋轉三角形頂點順序）、`POSITION[2]=[2,2,0]`，console 無 error。
- **未驗**：真實 Basis Universal／Zstandard transcoder 的整合（只用假 transcoder 驗證介面）、大型壓縮模型的解碼時間與記憶體、`COLOR` filter 的 16 位元路徑在真實模型上的表現、Firefox／Safari 的 `DecompressionStream`、原生壓縮 GPU 紋理上傳（未實作）、`KHR_draco_mesh_compression` 搭配 morph target 或 sparse accessor 的組合。`build` 未執行（`dist/` 於發佈時重建）。

## P33 手勢、Gamepad 對照／震動與音訊 sprite／stream／暫停（2026-10-01，限定已測環境）

- **新增**：`game.input.gestures`（`GestureRecognizer`）、`GamepadState.addMapping`／`rumble`／`stopRumble`、`SampleAudioAsset.defineSprites`／`playSprite`、`audio.stream`（`AudioStream`）、`audio.pause`／`resume`／`paused`、`GameOptions.audioPause`；`examples/input-lab` 加入 Gestures 面板與 Rumble 按鈕，`examples/audio-lab` 加入 sprite、stream 與 Pause 控制。
- **自動化**：`tests/gestures.test.ts` 10、`tests/gamepad.test.ts` 新增 5（共 12）、`tests/audio-streaming.test.ts` 5、`tests/audio.test.ts` 新增 1（OPM 時間軸暫停）、`tests/game.test.ts` 新增 1（`audioPause` 與 pause／resume／可見性連動，以 mock 的文件事件驅動）。完整套件目前 61 檔／426 測試通過；`tsc -p tsconfig.check.json`、`eslint .`、`prettier --check .` 通過（見下方最終紀錄）。測試以假的 AudioContext／HTMLAudioElement／Gamepad 驅動，驗證邏輯而非聲音。
- **實際瀏覽器**：managed headless Chromium。`input-lab`（canvas2d）以合成 PointerEvent 經真實 `InputManager` 觸發：tap→tap→doubletap、長按 700 ms→longpress、快速拖曳→pan start/end＋swipe right、兩指→pinch ×1.22→×2.24 與 rotate 0.17→0.46 rad。因合成 pointer id 無法被 `setPointerCapture`，雙指測試替換了 canvas 的 capture 方法；真實觸控螢幕未測。`audio-lab`（canvas2d 與 webgpu）：sprite head 由 0 播到 0.20 s 後 `ended`、sprite tail 在 0.25–0.5 s 內循環、以 blob: URL 串流真實 `HTMLAudioElement`（位置推進）、`Pause audio` 後 stream 位置凍結在 0.20 s、`Resume` 後從 0.48 s 繼續、`Stop all` 後 stream 為 stopped。
- **未驗**：實際聽見聲音（只驗證狀態與位置，無法在 headless 確認揚聲器輸出）；真實手把的 mapping 與 rumble（沒有實體裝置，僅假物件測試，且未內建任何裝置 mapping）；真實多點觸控與 pen；Firefox／Safari 的 `MediaElementAudioSourceNode`、跨來源 CORS 串流、range seek；OPM 暫停期間「暫停當下正在響的音符」的聽感；`GameOptions.audioPause` 的 `onHidden` 在真實分頁切換下的行為（只以 mock 的 visibilitychange 驗證）。`build` 未執行（`dist/` 於發佈時重建）。

## P34 動畫混合、State Machine、Tween 與 Timeline（2026-10-01，限定已測環境）

- **新增**：`AnimationAction` 的 weight／fade／`crossFadeTo`／`loopMode`（含 ping-pong）／事件、`AnimationStateMachine`、`Tween`、`Timeline`、`TweenGroup`（`scene.tweens`，由 Game 在 `scene.timers` 之後推進）；範例 `examples/animation-lab/`。行為變更：`AnimationAction.loop` 保留為布林開關，權重 1 時與舊的「最後一個 action 勝出」相同（既有 `tests/animation.test.ts`、`models.test.ts`、`morph.test.ts` 未修改且通過）。
- **自動化**：`tests/animation-blend.test.ts` 11（分層與權重、cross-fade 與順序、單一 action fadeIn、旋轉混合、ping-pong／loop／finished 事件、`time` seek、state machine 的參數／trigger／exitTime／驗證／destroy）、`tests/tween.test.ts` 10（巢狀屬性與 easing、delay／repeat／yoyo、串接與拖曳回捲、`from` 與還原、驗證與 destroyed 目標、零長度、Timeline 標籤／callback／巢狀、repeat／timeScale／reset、TweenGroup）。完整套件目前 63 檔／447 測試通過；`tsc -p tsconfig.check.json`、`eslint .`、`prettier --check .` 通過（見最終紀錄）。
- **實際瀏覽器**：managed headless Chromium 的 webgl2 與 webgpu 開啟 `examples/animation-lab/`：速度提高後 idle→run 的 cross-fade 期間顯示 `weight 0.50`／`0.54`，完成後為 1.00；按 Jump 進入 `jump`（立方體 y≈1.08），非循環片段結束後經 exitTime 回到 idle（速度仍高時再由 `when` 轉到 run，符合轉場規則）；Pulse 按鈕啟動 Timeline（球 scale 0.50→0.99、y −1.60→−0.85，`running tweens 1`），結束後回到 0.50／−1.60 且 `running tweens 0`。webgpu 截圖確認立方體與球體繪出。
- **未驗**：canvas2d（3D 範例本身不支援）；glTF 模型上的 state machine 與 skinned mesh 混合；大量 action／tween（>1,000）的效能；`AnimationAction` 的 additive／mask／IK／blend tree（未實作）；Timeline 對 `repeat` 邊界精確時間點的行為只以單元測試覆蓋。`build` 未執行（`dist/` 於發佈時重建）。

## P35 工具（DebugOverlay、範例 smoke、release workflow、tree shaking、benchmarks、TypeDoc）（2026-10-01，限定已測環境）

- **新增**：`DebugOverlay`、`PhysicsWorld2D.colliderCount`、`scripts/smoke-examples.mjs`（`pnpm smoke:examples`，devDependency `playwright-core` 1.63.0 與更新後的 `pnpm-lock.yaml`）、`scripts/check-tree-shaking.mjs`（`pnpm check:tree-shaking`）、`package.json` 的 `"sideEffects": false`、`.github/workflows/release.yml`、`benchmarks/{physics2d,particles2d,3d}` 與共用的 `benchmarks/measurement.ts`、`typedoc.json`／`pnpm docs:api`（devDependency `typedoc` 0.28.20；輸出 `docs/api/` 被 git／prettier／eslint 忽略）。
- **自動化**：`tests/debug-overlay.test.ts` 2 個（純格式化器）；DebugOverlay 的實際 DOM 定位只在 `examples/physics2d-lab` 的 webgl2 分頁手動確認。完整套件目前 64 檔／449 測試通過；`tsc -p tsconfig.check.json`、`eslint .`、`prettier --check .` 通過。
- **範例 smoke（`scripts/smoke-examples.mjs`，本次實際執行）**：Chromium 150（managed，WebGPU 可用，darwin/arm64）以 `auto`／`webgpu`／`webgl2`／`canvas2d` 開啟所有範例：**76/76 通過**（console／page error 為 0，且 canvas 縮放回讀非單色）。Playwright WebKit 26.6 對 `webgl2`：**23/23 通過**（含 `sprite`／`triangle` 這兩個 WebGPU 範例）。Playwright 內附 Firefox Nightly（headless）對 `webgl2`：**19/23 通過**；`pbr3d` 與 `showcase` 的 canvas 回讀為單色（原因未調查：可能是 headless Firefox 的 WebGL2／讀回限制，也可能是真正的繪製差異，**未判定**），`sprite`／`triangle` 因 Firefox 沒有 WebGPU 而失敗（這兩個範例本就固定使用 WebGPU）。這是 smoke 檢查，不是視覺比對或效能。
- **Tree shaking**：加上 `"sideEffects": false` 前，僅匯入 `Vector2` 的 Vite bundle 為 41,535 位元組；加上後為 712 位元組（完整 API 748,561 位元組）。腳本設有 4,096 位元組預算。
- **Benchmarks（managed Chromium、webgl2、1280×720、DPR 1、一次執行，非統計樣本）**：physics2d 600 圓：RAF 60.0 fps，CPU submit 平均 0.42 ms，物理步進平均 7.43 ms（603 colliders）；particles2d 4×8,192：38.0 fps（p95 33.4 ms），CPU submit 平均 20.76 ms，粒子更新 5.44 ms（32,632 活躍）；3d 400 mesh：webgl2 與 webgpu 皆 60.0 fps，submit 0.38／0.65 ms，渲染統計 400 次 draw call。RAF 受顯示器 60 Hz 限制，所以 60 fps 的項目只表示「達到更新率」，不是上限。**WebGPU 上的 physics／particles 與其他瀏覽器未測**。
- **Release workflow**：已用 `pnpm pack` 在本機產生 tgz 並計算 SHA-256，確認 tarball 內容；**GitHub Actions 尚未實際執行**，`gh release create` 步驟與權限未驗證。
- **未驗**：smoke 腳本沒有加入 CI；Firefox 兩個範例的差異原因；TypeDoc 輸出的內容品質與連結（只確認產生成功、無警告）；DebugOverlay 在 `position: static` 以外的版面（例如 CSS transform 的祖先）下的定位；`build` 未執行。

## P36 3D 輔助物件：LOD、Billboard、Line3D、Text3D（2026-10-01，限定已測環境）

- **新增**：`LOD`、`Billboard`、`Line3D`、`Text3D`、`CameraDependent3D`／`isCameraDependent`，Scene 每幀在渲染前呼叫 `updateForCamera`；範例 `examples/objects3d/`。不涉及 GPU 管線變更。
- **自動化**：`tests/objects3d.test.ts` 11 個（Billboard 球面／圓柱對透視相機、正交相機與父層位置、LOD 排序與距離選擇、hysteresis、Line3D 的帶寬與翻面、封閉環與父層變換、參數驗證、Scene 每幀呼叫與隱藏／移除後停止）。完整套件目前 65 檔／460 測試通過；`tsc -p tsconfig.check.json`、`eslint .`、`prettier --check .` 通過。`Text3D` 需要 2D canvas，只在瀏覽器驗證，沒有單元測試。
- **實際瀏覽器**：managed headless Chromium 的 webgl2 與 webgpu 開啟 `examples/objects3d/`：把相機距離調到 8／14／22／35 時 LOD 依序為 32×16 球、12×6 球、6×3 球、立方體；繞行 120° 的截圖顯示 Billboard 卡片、Text3D 文字與螺旋 Line3D 帶皆正對相機；console 無 error。
- **未驗**：canvas2d（無 3D）；Firefox／Safari 的 `Text3D` 字型光柵化；大量 Billboard／Line3D（>1,000）的每幀 CPU 成本；Line3D 每幀重建頂點後的 GPU 上傳成本；與透明物件的排序。`build` 未執行。

## P36b 頂點與 Instance 顏色（2026-10-01，限定已測環境）

- **新增**：Geometry RGB／RGBA 顏色、`setColors`；InstancedMesh `setColorAt`／`getColorAt`；WebGPU／WebGL2 顏色屬性與 alpha／shadow mask；glTF `COLOR_0`，蒙皮保留顏色。Instancing 範例加入 instance 亮度與頂點漸層。
- **自動化**：新增 8 個顏色測試，涵蓋獨立儲存、修改／移除、alpha 與錯誤原子性、instance 預設／索引／版本、glTF RGB／RGBA／normalized byte 與不支援屬性。typecheck、lint 與完整 66 檔／468 tests 通過。
- **實際瀏覽器**：managed Chromium，正式 Game／Renderer 路徑，WebGPU 與 WebGL2 各自讀回三個四邊形：紅色／綠色 instances 與共用幾何的白色普通 Mesh。初始 RGB 為 [255,0,0]／[0,255,0]／[255,255,255]；頂點 RGB 與 alpha 皆 0.5 後，紅色樣本為 [67,5,9]（背景參與混合）；移除頂點色並把紅 instance 改藍後為 [0,0,255]／[0,255,0]／[255,255,255]，兩 backend 結果一致。另渲染 2,145 頂點球體，涵蓋共用白色 buffer 擴容再切換自有顏色 buffer，console 無錯誤。Instancing 範例兩 backend 截圖確認漸層與個別亮度。
- **未驗**：其他瀏覽器、實際 glTF 蒙皮動畫顏色與陰影 alpha 的像素對照；build 尚未執行。沒有把這些未驗項記為通過。

## P37 Point／Spot 與 Cascaded Shadows（2026-10-01，限定已測環境）

- **新增**：Point／Spot `castShadow`、near／far clipping；單一 depth atlas、point 六面與 spot 光錐投影；Directional 2–4 cascades、uniform／log splits、texel snapping；3×3 PCF；`examples/shadows3d/` 與 gallery 登錄。保留預設單片 directional shadow。
- **自動化**：新增 5 個 shadow camera 測試，驗證六軸與 clipping、spot 光錐邊界／非法 clipping、cascade 切片中心與相機移動、正交 near=0 的切片八角覆蓋，以及移除／關閉陰影不留 stale slots。完整 67 檔／473 tests、typecheck、lint 通過。
- **實際瀏覽器**：managed Chromium 的 WebGPU／WebGL2 均以正式 Game／Renderer 渲染 point、spot、四 cascades；範例截圖顯示三種投影，原 pbr3d directional 範例仍正常。獨立 320×200 場景即時像素回讀，point 開關造成 7,915／7,916 像素 RGB sum 減少 >30，spot 為 7,720／7,722，cascade 為 592／602。關閉 floor.receiveShadow 或 caster.castShadow 與全關陰影的畫面完全相同；重新開啟與原畫面完全相同；每格由 256 改成 512 後三種模式仍有陰影，console／page error 為 0。
- **限制與未驗**：其他瀏覽器、最大 60 格負載／效能、實際 glTF alpha mask 或蒙皮／instancing shadow 的像素對照未測。沒有 cube-face seam filtering、cascade blending、slope bias 或靜態快取。mapSize 指每格解析度，整張 atlas 尺寸仍需符合裝置上限。build 延後最後整合執行。

## P38a Cubemap Environment（2026-10-01，限定已測環境）

- **新增**：`EnvironmentMap.fromCubemap`、`fromCubemapImageData`、公開 `CubemapFaces`；六面轉既有 equirectangular 格式，沿用 SH／roughness mip／GPU cache 生命週期；PBR 範例的六面環境開關。
- **自動化**：新增 3 個測試涵蓋六面的方向與面內旋轉、輸入修改不影響輸出、sRGB 解碼／忽略 alpha、尺寸與非法 radiance。完整 67 檔／476 tests、typecheck、lint 通過。
- **實際瀏覽器**：managed Chromium 的 WebGPU 與 WebGL2 切換 PBR 範例 cubemap；截圖確認彩色六面背景與金屬球上的方向性反射，切回原 procedural environment 正常，page error 為 0。
- **限制與未驗**：不是原生 GPU cube texture；轉換時每面邊緣 clamp。未測六張外部影像的網路載入、其他瀏覽器與最大尺寸效能。Reflection probe 尚未包含在本功能提交；build 延後最後整合執行。

## P38b FXAA（2026-10-01，限定已測環境）

- **新增**：`PostProcessingSettings.fxaa`（預設 false）；HDR resolve／tone mapping 後、effects3D／2D overlay 前的單幀 FXAA；lazy color target、停用／resize／destroy 釋放；PBR 範例開關。
- **自動化**：既有完整 67 檔／476 tests、typecheck、lint 通過。沒有新增僅驗證 shader wiring 的永久測試。
- **實際瀏覽器**：managed Chromium WebGPU／WebGL2，PBR 範例啟用 FXAA 截圖正常，另以正式 Game 路徑、antialias=false、192×128 白三角即時像素讀回；兩 backend 結果一致：中間亮度邊緣像素由 0 增為 275，共 1,155 bytes 改變，角落維持 [6,9,17,255]。停用 FXAA 與原畫面完全相同；停用／重開 postprocessing 後與啟用畫面完全相同；resize 為 160×100 後仍有 213 個中間亮度邊緣像素。page error 為 0。
- **限制與未驗**：不是 temporal AA，也不處理稍後的 2D UI；細節可能柔化。其他瀏覽器、透明邊緣與高解析度成本未測。build 延後最後整合執行。

## P38c SSAO 與 Depth of Field（2026-10-01，限定已測環境）

- **新增**：可取樣 scene depth（WebGPU 取最近 MSAA sample、WebGL2 HDR depth texture）、透視／正交 view-depth 重建、16-tap SSAO、24-tap disk defocus、focus distance／range／blur radius；PBR 範例開關與 focus slider。停用效果跳過 depth 取樣，kernel 只建立一次。
- **自動化**：既有完整 67 檔／476 tests、typecheck、lint 通過；GPU 效果以真實 renderer smoke 驗證，沒有增加 source-text／shader wiring 測試。
- **實際瀏覽器**：managed Chromium，兩 backend，正式 Game 路徑，antialias 開／關與透視／正交（near=0）共八組。SSAO strength=0 或停用時與原畫面完全相同；cube／floor contact 場景在預設 antialias 下，RGB sum 變暗 >9 的像素為 WebGPU 398／708（透視／正交），WebGL2 390／636。獨立白三角設 focus depth=3 時畫面完全不變，改為 10 則有數千 bytes 改變；停用 DOF 回到原畫面，與 FXAA 合用有額外可觀察的像素變化，停用／重新啟用 postprocessing 後畫面完全相同。192×128→160×100→256×128 的 resize 後仍有 2,554–3,433 個 defocused 像素，page error 為 0。
- **修正的邊界**：孤立三角輪廓最初有 1–4 個像素被錯誤 AO，原因是 depth derivative 跨到空背景而產生不可靠法線；現在遇到超出取樣半徑的 derivative 不計 AO。兩 backend、透視／正交、192×128／160×100 的同一路徑確認錯誤變暗像素為 0。沒有永久 GPU regression suite，這個分支仍以即時 smoke 覆蓋。
- **限制與未驗**：AO 是 shaded-color post multiplier，不是只作用於 ambient；沒有 temporal accumulation／denoising。DOF 是 screen-space 近似，無法重建遮蔽背景或正確合成所有 near／far bokeh，最大半徑可能有稀疏取樣痕跡。其他瀏覽器、透明層、GPU 耗時與大型場景成本未測。build 延後最後整合執行。

## P39a PBR IOR 與 Specular（2026-10-01，限定已測環境）

- **新增**：`PBRMaterial` IOR／specular strength／linear RGB tint、兩個借用貼圖 slots／samplers；WebGPU／WebGL2 的直接光與 IBL；glTF required `KHR_materials_ior`／`KHR_materials_specular`。strength texture 取 linear A，color texture 取 sRGB RGB；IOR=0 相容模式、IOR≥1、color>1、metallic 不受 dielectric strength 影響。
- **自動化**：新增 16 個參數／glTF 拒絕測試，涵蓋非有限與越界 factors、sampler、不相容 unlit 與 UV transform；完整 67 檔／492 tests、typecheck、lint、format:check 通過。
- **實際瀏覽器**：managed Chromium，兩 backend、128×128、正式 Game／Renderer，direct／IBL 各自比較：specular=0 改變 2,520／4,764 bytes；IOR=2.42 改變 4,176／4,764 bytes；alpha=0、alpha=128 的 strength map 與相對應 factor、RGB=[128,255,255] map 與 sRGB decode factor 均為 0 bytes 差異。metallic=1 時改 IOR／specular／tint 為 0 bytes 差異。另把含兩個 required extensions、真實 PNG alpha／color maps 的 glTF 載入並渲染，兩 backend 都與同等直接建構材質完全相同，中心像素 [4,15,9,255]；page error 為 0。
- **根因修正**：WebGL2 的 texture／environment 首次 upload 強制切到 texture unit 0，覆蓋別的 slot，導致第一幀材質貼圖與 IBL 錯誤；現在沿用呼叫者選定的 unit。同一 smoke 在修正前出現 map／factor 差異及第一幀 IBL 漏失，修正後所有 map 等價比較為零，direct／IBL 的因素差異也與 WebGPU 一致。
- **限制與未驗**：仍沿用近似 environment mip filter／解析 split-sum BRDF，不宣稱 reference-renderer 精度。其他瀏覽器、large／非均勻貼圖與 glTF skinned material 的組合未測；沒有永久 GPU regression suite。build 延後最後整合執行。

## P39b PBR Clearcoat（2026-10-01，限定已測環境）

- **新增**：clearcoat／roughness／normal scale，三個借用 maps 與個別 sampler；glTF required `KHR_materials_clearcoat`；兩 backend 的 directional／point／spot／IBL layer、獨立法線與底層 emission attenuation。固定 IOR 1.5，不沿用 base IOR／normal。
- **自動化**：新增 13 個 invalid factor／sampler、unlit 排斥與三個 map transform 衝突測試；完整 67 檔／505 tests、typecheck、lint、format:check 通過。
- **實際瀏覽器**：managed Chromium，兩 backend、128×128，正式 Game／Renderer。強度 1 與未塗層相比，directional／point／spot／IBL 改變 1,080／1,284／1,320／4,764 bytes（兩 backend 一致）；R=0 map 等於未塗層，R=128 強度 map 與 factor、G=128 roughness map 與 factor 都是 0 bytes 差異。獨立 tilted normal 改變可見高光，normal scale=0 與無 coat normal map 完全相同；clearcoat=0 時 coat normal 不影響 base normal。metallic=1 仍有 coat 反射，page error 為 0。
- **glTF 與 emission**：含真實 PNG 的三個 coat maps、normal scale=0，並與 IOR／specular extensions 合用的 glTF，兩 backend 與等效直接建構材質完全相同，中心 [5,16,10,255]。無外部光的 emission-only quad，coat=1 中心 [204,174,146,255]，與未塗層 emission×0.96 的中心相同；原 emission 中心 [206,177,149,255]。
- **限制與未驗**：roughness 最低數值 0.04；simple Fresnel coat、近似 split-sum IBL、UV0 derivative tangent frame，不做 refraction／層間 scattering 或 reference-renderer 視覺精度承諾。其他瀏覽器、非均勻 normal／roughness 圖、skinned model 與陰影開啟時 coat 的像素對照未測；沒有永久 GPU regression suite。build 延後最後整合執行。

## P39c PBR Sheen（2026-10-01，限定已測環境）

- **新增**：sheen RGB／roughness、sRGB color map／linear alpha roughness map／個別 sampler，glTF required `KHR_materials_sheen`；兩 backend Charlie distribution／visibility、view-only albedo scaling、clearcoat 上層合成。32×32 directional-albedo lookup 以離線 128×256 hemisphere quadrature 產生，限制 0–1；4 KiB uniform buffer 初始化時上傳一次，不多占 texture slot，不逐幀積分。
- **自動化**：新增 12 個 factor／sampler 範圍、unlit 排斥與兩個 map transform 衝突測試；完整 67 檔／517 tests、typecheck、lint、format:check 通過。實際執行 `node scripts/generate-sheen-lut.mjs`；1024 個 lookup samples 都有限、介於 0–1。
- **實際瀏覽器**：managed Chromium，兩 backend、128×128，正式 Game／Renderer。Sheen 對 directional／point／spot／IBL 改變 4,372／4,540／4,532／4,720 bytes（兩 backend 一致）；sRGB color map 與 decode factors、A=128 roughness map 與 factor 都是 0 bytes 差異；零色 map／零 factors 與未啟用完全相同。Metallic 與 clearcoat 合用仍有可觀察 sheen，page error 為 0。
- **glTF 與 emission**：真實 PNG maps，與 IOR／specular／clearcoat 共存的 glTF，在 tilted normal 下，sheen 中心 [4,4,3,255]、停用為 [2,2,2,255]；兩 backend 都與等效直接建構材質全畫面完全相同。無光 emission-only quad 啟用 sheen 後全畫面不變，中心 [206,177,149,255]（此項在 WebGL2 實測，未重新宣稱 WebGPU 通過）。
- **限制與未驗**：有限 lookup 解析度／0.04 roughness floor／view-only scaling；IBL 沿用原 roughness mip，並非專用 Charlie convolution，不宣稱嚴格能量守恆或 reference-renderer 視覺精度。其他瀏覽器、非均勻 maps、skinned model 與陰影合用的像素對照未測；沒有永久 GPU regression suite。build 延後最後整合執行。

## P39d Transmission 與 Volume（2026-10-01，限定已測環境）

- **新增**：透射／厚度 factors、linear R／G maps／個別 sampler、mesh-local thickness 至 world length 的 object／instance inverse-transform 換算、Beer–Lambert RGB 吸收；required glTF transmission／volume。Opaque snapshot 與兩階段正式 renderer，不改 alpha mode，保留 base specular／sheen／clearcoat；兩個原生尺寸不同的 maps 以無重取樣的 two-layer array 共用一個 slot，材質與 scene 合計不超過最低 16 sampled textures。
- **自動化**：新增 20 個 factor／sampler 邊界、unlit 排斥、volume dependency 與兩個 UV-transform 衝突測試；完整 67 檔／537 tests、typecheck、lint 通過。既有 GPU lifecycle fixture 補上 compute pipeline／usage constants，保留 resize 原子性與 device-loss 測試；沒有增加 shader wiring／source-text 測試。
- **實際瀏覽器**：managed Chromium，兩 backend、128×128，正式 Game／Renderer。玻璃先加入 Scene，後加入背景 opaque quad；IOR=1／無反射 thin wall 與單獨背景全畫面零差異，中心 [188,149,124,255]。厚度 1／distance 1／color [.5,.2,1] 中心 [137,69,124,255]；uniform scale 2 配 thickness .5 相同。Transmission R=128 的 7×3 map、thickness G=128 的 3×11 map，各自及合用與等效 factors 都是零差異；R=0 與未透射、metallic=1 改透射強度也為零差異。
- **取樣與 glTF**：六組非均勻 7×3／97×5 maps，涵蓋 min／mag nearest／linear 和 clamp／repeat／mirror，與 native AO-sampler oracle 的最大 8-bit 差異為 1 byte（兩 backend 一致）。真實 PNG glTF 同時啟用全部 14 個 material maps，合用 IOR／specular／clearcoat／sheen／transmission／volume；兩 backend 與等效直接建構材質全畫面完全相同，中心 [115,82,79,255]。
- **體積與生命週期**：256×256、antialias=true 的棋盤背景，改 IOR／thickness 可觀察折射位移，roughness=.8 明顯模糊；直接擷取 canvas PNG 確認可見色吸收與折射（viewport screenshot API 超時，未取得 viewport 截圖）。Scale [2,1,.5] 的中心 [160,102,124,255]，旋轉 Y=π/2 後 [99,29,124,255]，符合 world-length 改變。兩個非均勻／旋轉 instances 與等效獨立 Mesh 全畫面零差異；開啟 sky／IBL／cascade shadows／SSAO／DOF／FXAA 後，no-scene／opaque-only 切換再回到玻璃仍零差異，128×128→96×80→128×128 正常；page error 為 0。
- **Coverage 與 disabled post**：兩 backend、96×96，OPAQUE 材質 opacity=0 與 1 全畫面零差異；disabled post 下設定非中性的 exposure／ACES／bloom／AO／DOF／FXAA，與 neutral settings 全畫面零差異，未被 opaque quad 覆蓋的 clear color 為 [6,9,17,255]。遮蔽真實 WebGL2 context 的 float extension 後，disabled post 下仍明確拋 GraphicsError，沒有不透明替代。
- **限制與未驗**：只擷取 opaque nontransmitting 物件，不做透明多層遞迴、exit-surface ray tracing、nested IOR／camera-inside TIR、scattering 或彩色／傳光陰影；offscreen clamp、nine-tap screen-space roughness filter 均為近似。WebGPU 延續 MSAA attachment，WebGL2 沿用單取樣 HDR target，需要 EXT_color_buffer_float。其他瀏覽器、skinned-volume 組合與大型場景成本未測，沒有永久 GPU regression suite；build 延後最後整合執行。

## P36c Sprite3D（2026-10-01，限定已測環境）

- **新增**：靜態 Texture 的世界空間 sprite、pixel-region atlas／`setSource`、球面／圓柱 camera-facing，與 Billboard 共用朝向計算；獨立可更新 quad、借用紋理，世界尺寸不隨 frame 變動。objects3d 範例新增 frame 按鈕。
- **自動化**：新增無效 frame 不破壞既有 frame 的狀態轉移測試；完整 67 檔／538 tests、typecheck、lint、format:check 通過。刪除既有 Billboard 的 quad identity／scale forwarding 實作細節斷言，保留參數及朝向行為測試。
- **實際瀏覽器**：獨立 Chromium 150、WebGPU／WebGL2 正式 Game／Renderer，96×96。紅 frame 中心 [255,0,0,255]、半透明綠 frame [3,132,8,255]；非法越界 frame 拋錯且全畫面零差異，切回紅 frame 全畫面零差異。透視 spherical／cylindrical 與正交 spherical 都可見；sprite destroy 後借用 Texture 仍有效。
- **Gallery**：WebGPU 的 Next sprite frame 改變 28,390 channels，四次切換回初始全畫面零差異；WebGL2 點擊 frame、orbit=120°，直接 canvas PNG 確認 sprite 與既有 Billboard／LOD／Line3D／Text3D 可見，page error 為 0。
- **環境限制**：managed browser 的 native RAF 不送幀；獨立 headed Chromium 加 `--disable-frame-rate-limit` 後 native RAF 與 Gallery 正常。此為功能驗證設定，不是效能量測。viewport screenshot 仍超時，使用 canvas PNG；WebGL2 在 endFrame 同步複製以避免未保留 drawing buffer 被呈現後清空。
- **未驗**：其他瀏覽器、atlas 邊緣 padding／mip、父群組旋轉與非等比縮放（同 Billboard 明確不補償）、大量 sprite 成本；不支援動態 2D texture 或 Canvas2D 3D。build 延後最後整合。

## P36d Projected Decal（2026-10-01，限定已測環境）

- **新增**：六平面裁切實際 receiver 三角形、projector UV、背面排除及 world normal lift；產生 Mesh 並自動掛在 receiver 下，不用浮空 quad。建立時計入旋轉／非等比父群組；沒有交集或 singular transform 明確報錯，geometry／UV／lift 靜態烘焙。
- **自動化**：四個永久測試涵蓋深度／寬高 clipping 的面積與 UV、恰在邊界的三角形及 winding、非等比父群組的世界尺寸／lift／移動，以及 miss／背面失敗不掛子物件。完整 68 檔／542 tests、typecheck、lint、format:check 通過。
- **Clipping smoke**：瀏覽器產生 1,000 個固定 seed 三角形，與獨立 polygon-area oracle 比較，337 個有交集；最大面積差 1.775e-8，所有輸出位於 projector box 內。此為一次性驗證，未新增永久 wiring 測試。
- **實際瀏覽器**：獨立 Chromium 150（同 P36c 關閉 frame-rate limiter 的驗證環境），WebGL2／WebGPU、192×192 正式 Game／Renderer。半透明圓形圖案投影球體後改變 5,790／5,865 channels；178 個貼花三角形的 Z 範圍 .550552–1.001，直接 canvas PNG 確認貼合曲面。hidden 與原場景全畫面零差異；receiver destroy 移除 decal，借用紋理仍有效。
- **Gallery**：兩 backend 的 Hide decals 改變 8,603／8,602 channels，重新顯示後與初始全畫面零差異。WebGL2 的距離 14／22／35 正常切換至 LOD 1／2／3，page error 為 0。
- **限制與未驗**：靜態幾何，不追蹤 projector 或頂點變形；明確拒絕 instanced／skinned／morph receiver。之後的 receiver scaling 同時縮放 lift。PBR normal maps／shadow 合用、負 scale、其他瀏覽器與大型 receiver 建立成本未測；build 延後最後整合。

## P38d Local Reflection Probes（2026-10-01，限定已測環境）

- **新增**：每網格世界原點選擇最近的有效 box probe；局部 diffuse SH／specular／clearcoat／sheen IBL、box-projected reflection、全域 fallback；重用 environment texture slot／cache。PBR 範例右側兩欄 probe 開關。
- **自動化**：三個測試涵蓋父群組移動、等距順序、含邊界／出界、disabled／destroyed map 狀態轉移，以及可變 bounds 的非法狀態／修復。完整 69 檔／545 tests、typecheck、lint、format:check 通過。
- **實際瀏覽器**：自有 headed Chromium 150、原生 RAF、`--disable-frame-rate-limit`（非效能量測），WebGPU／WebGL2 的 192² 畫面同時顯示紅／綠局部反射與藍色全域 fallback，沒有最後一個 draw uniform 覆蓋其他網格的問題；intensity = 0 黑色、disabled／destroyed 恢復藍色。六面 map 的偏心 quad 在 box projection 開／關時分別取到 +X 紅色／+Z 藍色，resize 後恢復紅色；Game 銷毀後 borrowed map／Texture 仍有效。
- **實際範例**：native RAF 的 PBR 範例（shadow／HDR／bloom，WebGPU 預設 4× MSAA）切換 probe：WebGPU 93,800、WebGL2 91,897 個 color channel 改變，停用後兩者與原畫面 0 差異。實際 canvas 截圖確認只有右側局部反射變色，背景保持不變。
- **限制與未驗**：使用已烘焙的 EnvironmentMap，不含自動場景 capture、動態 reflection、空間 blending 或旋轉影響 box。InstancedMesh 共用 mesh 原點的選擇；未驗其他瀏覽器、最大數量及效能。build 延至最後整合。

## Weighted 3D Transparency 整合（2026-10-01，限定已測環境）

- **新增**：Scene.transparency sorted／weighted（預設 sorted）、TextureMaterial transparent opt-in、Sprite3D／Text3D alpha 分類。WebGPU MRT／WebGL2 two-pass weighted color＋revealage，以 opaque depth 測試、不寫透明 depth；在 HDR resolve／effects3D／2D 前合成。Resize／停用／無 Scene／destroy 清理尺寸相關 targets，prepared shader 保留。objects3d 加入開關與插入順序反轉。
- **工具鏈**：typecheck、完整 69 檔／545 tests、lint、build、format:check 通過。Build 最小化 169 個 JavaScript files，1,454,438→774,378 bytes，vendor 未改。沿用分類／穩定排序行為測試，不加入 shader wiring 測試。
- **正式 Game pixels**：Chromium 150、128²、WebGPU antialias 開／關與 WebGL2 開／關。共面紅藍 opacity=.5 在 sorted 下中心 [130,5,9,255]，weighted 為 [165,2,165,255]；反轉順序全畫面 0 差異。另兩個旋轉 Y=±.7 的交錯 quad，兩 backend 反轉後 0 bytes 差異。Opaque 綠 blocker 中心 [0,255,0,255]，隱藏後恢復全畫面零差異。
- **狀態／alpha**：HDR、FXAA／SSAO／DOF 合用正常；停用 post、96×80→128² resize、sorted→weighted 恢復皆與 weighted 原畫面零差異。MASK opacity=.2／cutoff=.5 與零 alpha 不改背景；正確以 Texture.fromImage 解碼的 A=128 texture 搭 transparent=true，與 opacity=128/255 factor 在兩 backend 全畫面相同。最初 throwaway harness 用預設 premultiplied ImageBitmap 造成 GL 差異，改用正式 straight-alpha 契約後消失，沒有修改 upload 掩蓋輸入錯誤。
- **組合／資源**：Opaque／BLEND transmission 仍呈現綠色 opaque 背景；WebGPU antialias=false 的 opaque thin wall 與背景零差異。WebGL2 antialias=true 因切換單取樣 HDR 邊緣有 828 bytes 差異，不記成全畫面等價。HUD 白色中心 [255,255,255,255]，隱藏後原畫面零差異。兩 backend 真實 captureScene 得 128² snapshot，destroy 後 destroyed=true，Game destroy 不釋借用 Texture。另 WebGPU native OIT helper 1／4 samples 的 27 allocated textures 全部 destroy、同尺寸 reuse／改尺寸 release、validationError=null；這是 helper 資源證據，不宣稱整個 driver 零配置。
- **範例／dist**：兩 backend 操作 objects3d weighted／reverse，實際 screenshot 確認交錯透明卡片與 LOD／sprite／text／ribbon 可見，page errors=[]。Built minified root entry 經正式 Game 在兩 backend 驗證交錯順序與 alpha texture 等價、空透明場景背景及 teardown，errors=[]；不是 extracted pack／plain-static 發佈驗收。遮蔽真實 WebGL2 float extension：sorted 可跑，weighted 明確報錯並 pause，不切 backend。
- **限制與未驗**：近似權重與 half-float 累積，不保證精確逐像素／大量透明層；WebGL2 離屏單取樣。Depth effects 只看 opaque depth，transmission 不遞迴取透明層。其他瀏覽器、instancing／skinning／shadow／environment 組合、loss recovery、large-scene 成本及全部 driver resources 未測。工具 tab 跨 call 偶發 detached，採同 call 完成 open／smoke／close；並非引擎錯誤。未 commit／push／publish。

## v1.7 發佈前驗證（2026-10-01）

- 使用者授權 push 與 GitHub release，並於推送前更正版本為 v1.7／package 1.7.0；沿用 Apache-2.0，不做 npm publish、不改歷史 tags。原 v1.8 atomic push 因遠端新增 CNAME 被拒絕，未推送或發佈。
- Node 26.7.0／pnpm 12.6.0：frozen install、typecheck、69 檔／545 tests、lint、build、format:check 全部通過。Build 169 個 JS files，vendor 不變。
- 更正前曾 pack／解壓 1.8.0 metadata 並通過 Node ESM root consumer／vendor LICENSE 檢查；更正後重新封裝 1.7.0 與驗證 metadata，未把先前附件發佈。此前 Chromium OIT／minified dist 證據仍依上一節限定範圍，不宣稱新的跨瀏覽器驗收。
- GitHub tag workflow 執行獨立 Ubuntu 工具鏈、封裝與 SHA256SUMS 上傳；實際線上發佈結果以 GitHub Release／Actions 為準。

## P40 Rendering & Browser Regression（2026-10-01，限定已測環境）

- **正式架構**：WebGPU／WebGL2 的相鄰相容普通 Sprite 使用 native instancing；不依 texture 重排，sampler／world-HUD／material／tiling／isolation／mask／filter barriers 保留。ParticleLayer 維持出生順序、壓縮 live slots，重用 staging／instance buffers，靜態資料僅在 generation／version／dirty span 變動時上傳。沒有新增 runtime dependency，OPM 官方 vendor 不變。
- **Metrics**：三 backend 共用 `FrameStats`，新增每幀 2D draw／instance／pass／upload counters 與 renderer lifetime live／peak attachment bytes 估計；DebugOverlay 顯示。GPU／GL 的 1024 atlas sprites 場景實測皆為 2 native 2D draws／1026 instances（含背景與合成），Canvas 1027 paint commands；不是 FPS 改善、GPU timer、driver memory 或全資源駐留預算。
- **工具鏈**：Node 26.7.0／pnpm 12.6.0，frozen install、build、typecheck、完整 68 files／543 tests、lint、format:check 通過。移除 2 個 debug formatter wording／incidental-default tests，不重新固定文字。Build 169 JavaScript files，vendor 未改；原 69 files／545 tests 留在歷史紀錄，不重寫。
- **真正瀏覽器 regression**：Chrome for Testing 153.0.8010.12／macOS arm64，built minified root entry → Game → Scene → forced Canvas2D／WebGL2／WebGPU 全部 PASS，page errors=[]。實際 pixels／PNG 涵蓋 atlas trim／rotation／reflection／tint／opacity、相鄰 ordering、texture／sampler／world-HUD／tiling boundaries、particle holes／refill／static invalidation、native material／isolation／mask／filter（GPU／GL）、Canvas tinted／tiling scratch pass accounting、resize／pause／resume／crossfade、localStorage 真 reload、render-target readback／resident accounting 與 held-stat teardown。Assertions／PNG 本機證據位於 `.vite/browser-regression/`。
- **實測修正**：WebGPU pause 後銷毀 explicit render target 原本 deferred 到下一 frame，resident bytes 維持 4096；改為 idle 時立即釋放、active encoder 時仍安全 deferred，原 browser case 修正後通過。Canvas group tint／tiling scratch 與 explicit target copy 的 pass counters 補齊，真像素／相對 pass accounting regression 通過。
- **正式範例**：25 examples 的全 registry matrix 逐例啟動 Chromium，合計 82/82 PASS、nonblank readback／errors=[]，包括 showcase auto／GPU／GL／Canvas。分組 machine evidence 在 `.vite/browser-smoke-grouped.json`。單一 browser 連跑全部範例兩次中途關閉（browser logs 含 CVDisplayLink／SharedImage errors），不記為原單程序命令通過，也未證實關閉根因。額外實際 rendering2d WebGL2 trusted filter toggle 與 canvas screenshots／zero page errors 已確認。
- **3D 組合 smoke**：built root consumer 在 GPU／GL 建立 PBR caster＋兩張 weighted 半透明 cards、HDR、shadow、antialias、capture；中心分別為 [137,1,138,255]，反轉透明插入順序後兩 backend 全畫面 0 bytes 差異。Active attachment estimates 分別 5,849,088／4,653,056 bytes，held `RenderStats` 在 Game.destroy 後皆為 0；真 objects3d weighted／reverse trusted 操作與 screenshot、errors=[]。Machine evidence 在 `.vite/p40-native-3d-proof.json`；僅此靜態組合，不宣稱全部 OIT profiles。
- **CI**：加入 pinned Chromium install、mandatory Canvas／GL selectable examples、deep regression 與 assertions／PNG artifact upload；workflow 定義不等於 hosted CI 通過。四個 mandatory example commands 實跑皆 1/1 PASS。Fixed-WebGPU sprite example 不用假 renderer query 冒稱 Canvas／GL，smoke runner 對 `sprite --renderer canvas2d` 明確 exit 1，拒絕 registry 未列的 backend。
- **限制**：WebGL2 用真 `WEBGL_lose_context` 觸發 loss／recovery；Canvas loss 不適用，WebGPU private-device injection 明確 SKIP。Safari／Firefox／Edge、真硬體／driver reset、跨裝置性能、新 audio unlock／聽感與其他 OIT 組合未在本階段重新驗證。P41／P42 全部批准 scope 仍待實作／驗收，不由 P40 推論完成；未 push／publish／改版本。

## P41 Authoring & Device Flow（2026-10-01，限定已測環境）

- **正式架構**：retained row／column／overlay layout、UILabel／UIButton／UICheckbox／UISlider、semantic focus／modal trap 與 restore；canvas HUD 是唯一 visuals，DOM 只 semantics／focus。Action contexts 按 priority／最新 activation 消耗 physical sources，保留 raw polling；touch／virtual controls 與 actual Gamepad.index routing。Typed factories／version-1 JSON content preflight、顯式 borrowed ownership／2D serializer、正式 authoring-lab consumer；無 runtime dependency／vendor patch。
- **資源契約**：decoded CPU texture leases、獨立 native texture／geometry budgets、idle LRU eviction／reprepare、explicit preparation pins／releaseable preparation leases；按 RAF chunks 的 dependency warmup、舊 frame protection／atomic scene publication、取消／destroy／recovery race cleanup。預算只估算指定 cache allocations，不是 total VRAM／process memory 上限。
- **工具鏈**：Node 26.7.0／pnpm 12.6.0，typecheck、完整 72 files／591 tests、lint、format:check、build 通過；build 178 JavaScript files，vendor unchanged。七件變更文件相對連結檢查無失效目標。歷史 counts／dates 不改寫。
- **真正 browser regression**：Chrome for Testing 153.0.8010.12／macOS arm64，built minified root → Game／Scene／forced Canvas2D、WebGL2、WebGPU 各自獨立啟動全部 PASS、page errors=[]。可信 mouse／keyboard／Chromium touch injection 驗 UI activation 不漏 world/default actions、fresh world pointer 不被 focus reconcile 吃掉、checkbox／slider／virtual control、modal Tab／Shift-Tab trap／restore、movement／pause／resume／responsive resize／destroy。模擬 standard Gamepad snapshots 使用 browser indices 7／2，涵蓋獨立 routing、UI activation consumption、解除 UI 不重播 held confirm、release／repress；不是實體手把或觸控硬體認證。
- **真資源／內容行為**：validated JSON 建構已呈現的 parent／reference prefab；serializer 實際 restore transform，非法 topology 不動既有 scene；warmup 跨 RAF chunks。Native combined old/candidate budget 拒絕後舊 scene 繼續 running，32² readback 為 [0,255,0,255]；geometry buffer 精確 bytes、explicit pin 拒絕／unload、released idle lease eviction／reprepare。Native red offscreen capture 在真 createImageBitmap 完成後受控延遲，main scene 仍於 64-byte texture budget 送幀，產出 [255,0,0,255]；failed capture 後 distinct idle texture 可 admission、main scene 恢復。Decoded leased bitmap eviction 不關 live borrowers，destroy 清 targets／CPU residency。
- **實測修正**：foreign attached factory root 必須在 ownership claim 前拒絕，失敗不 destroy 外部 hierarchy；touch compatibility mouse 不再偷走 routed widget focus；physical press generations 區分真正 fresh pointer 與已消耗 held edges，cross-device source handoff 不製造 duplicate press／release，wheel／gesture 保持每事件 pulse。Native explicit preparation 持有 pins 到 unload，idle eviction regression 正確使用可 release lease，未削弱正式保護契約。
- **證據與限制**：assertions／UI PNG 在 `.vite/p41-canvas2d/`、`.vite/p41-webgl2/`、`.vite/p41-webgpu/`，實際 screenshot 確認 canvas widgets／actor 可見。三 backend 單程序命令曾在 Chromium context 建立時關閉，不記為通過；以各 backend 獨立進程完成上述驗證。Canvas loss 不適用，WebGL2 沿真 WEBGL_lose_context 路徑，WebGPU 無 public loss injection 而明確 SKIP。Safari／Firefox／Edge、實體裝置、新 audio unlock／聽感、hosted CI、性能未重驗；P42 仍待整合，不 push／publish／改版本。
- **正式範例 smoke**：authoring-lab 在 forced Canvas2D／WebGL2／WebGPU 各自獨立 Chromium 153 啟動，三次均 1/1 PASS、nonblank pixels、errors=[]；此 smoke 證明正式範例啟動／畫面，不冒充上述 deeper fixture 的全互動結果。

## P42 Playable Reference & Advanced Profiles（2026-10-01，限定已測環境）

- **正式架構**：Scene.physics3D／Object3D body-collider ownership、finite sphere／OBB／capsule／plane narrowphase、iterative linear／angular rigid dynamics／sleep、shape queries／capsule sweep-slide-step controller；weighted grid／authored graph A* 與借用 character 的 bounded follower。動畫 explicit mask、reference-relative additive／nonaccumulating overlays、同步 1D／triangulated 2D blend tree、post-sampling two-bone IK；root 統一入口，無新 runtime dependency。
- **早期 CPU targeted 證據**：當時新 physics3d／character3d／navigation／navigation-follower／animation-profiles 共 5 files／56 tests 通過，含 logical physics pause 保留 fractional accumulator／contacts、無 catch-up；既有 animation／animation-blend／morph／models／object3d／scene／game 另 7 files／79 tests 通過。這是早期數量，不取代下方目前完整 suite。
- **正式 source-root runtime**：Node＋Vite SSR 由 src/index.ts 建立真 Scene，600 次 1/120 秒更新：follower finished，capsule center [1.9999999999999978,1,2]；box 落地 y=0.4976578994390556 並 sleep；masked additive x=10.5 無持續累積；IK tip world [1.5,1,0]。Physics／animations logical pause 100 秒保持 body／pose／phase；controller／follower／Scene destroy 清 registrations 與 owned objects。實跑輸出 P42_CPU_FORMAL_RUNTIME_OK，throwaway script 隨驗證後移除；這不是 GPU／GL pixels 或完整參考遊戲驗收。
- **CPU 邊界**：discrete 3D bodies 無 general CCD／rotation sweep／joints／mesh-concave-compound；root dynamic／kinematic、positive orthogonal transforms、rounded uniform scale、upright unit capsule。Nav 是 authored finite grid／graph，非自動 navmesh／clearance bake。IK 是 direct two-bone／positive uniform ancestors，非 full-body。
- **消費者可見 regression 修正**：additive finished／loop callback clear 能恢復 base，pause／controller stop 同 tick 停後續 sampling／constraints，mixer 拒 reentrant update；外部 pose edit 不被舊 base 覆蓋。睡眠 body 在非 sensor support 移除／分離時先 wake 再送 collisionend；awake body 的純角運動以 contact-point velocity 喚醒對方，destroy 不無故 wake。Hierarchy 註冊驗 final parent transform，失敗還原 parent／order／membership，add listener remove／destroy 不留下 ECS／physics 殘骸。四個 animation regression 先實跑失敗、修後通過，均保留行為測試。
- **目前完整工具鏈**：Node 26.7.0／pnpm 12.6.0，frozen-lockfile install、typecheck、79 files／678 tests、lint、build 通過；198 minified JavaScript files，1789195→951088 bytes，官方 vendor unchanged。新增 native capabilities 也同步既有 lifecycle／fallback mocks，沒有為兼容不完整 mock 削弱真 GPUAdapter 契約。
- **built-root CPU smoke**：minified `dist/src/index.js` 真 Scene sphere 在 floor 支撐 y=0.49763317848443783 並 sleep，remove support 後醒來、60 次 1/120 秒下落到 -0.7490543215155623；真 Raycaster 對 translated GPU-skin mesh hit [2,0,0]／distance 5，joint 再移到 x20 後旧 ray 無 hit，immutable bind vertex 仍 -0.5。輸出 P42_BUILT_RIGID_WAKE_RUNTIME_OK／P42_BUILT_NATIVE_SKIN_PICKING_OK。
- **native renderer proof**：Chrome for Testing 153.0.8010.12／macOS arm64，background headless、built minified root，forced WebGL2／WebGPU 各獨立 PASS、page errors=[]。四 influences／mirrored nonuniform joint normals、morph-before-skin、joint-only offscreen→visible culling 與 shadow 都對 exact CPU oracle 做完整 256² pixel comparison，badPixels=0；兩者 receiver shadowPixels=2947，exact CPU vertex error≤5.960464477539063e-8。真 RGBA 與 BC1 三層 RGB mip selection、source-copy ownership、prepare／unload／reprepare exact bytes、immutable capture-after-unload、resize、destroy／borrowed source rejection皆實跑。
- **native loss／fallback**：WebGL2 真 WEBGL_lose_context；WebGPU 在新 native fixture 用 fixture-only structural hook 呼叫實際 GPUDevice.destroy，再由正式 ResilientRenderer 回復同 backend／CPU source mip replay，recovered pixel oracle badPixels=0。舊 P40／P41 fixture 的 public-only WebGPU injection SKIP 保留，不改歷史證據。Canvas2D 普通 image 正式路徑仍可畫，native-only texture 明確 UnsupportedGraphicsError，3D native scenarios 明示 SKIP；不是解壓／換 backend／假 3D。Capabilities 支援表不等於所有 BC／ETC2-EAC／ASTC 格式逐個 driver／codec corpus 認證；本次 compressed pixels 實跑 BC1。
- **完整 Beacon Run**：forced GPU／GL 均以真正可信 keyboard／semantic controls 走 loading→menu→Start with sound（unlock／play true）→Space jump／WASD 移動→pause（timer／player／patrol 500ms 不變、audio stop）→volume／reduced-motion settings→save／真 page reload→Continue restore→Load saved run／restart→收齊四信標／綠色平台 win（餘約62.48秒）→restart／red patrol interception lose→menu／Play muted（mute true、audioPlaying false）→Destroy game（cleanup true），app errors／page errors=[]。No public mutation-only test hooks；`beaconRun.report` 僅觀察。實際 PNG 確認 arena、skinned runner、動態 crates、HUD／結果與 focus visuals，不以 nonblank 啟動冒充可玩流程。
- **整合 regression／sample smoke**：P40 deep rendering／P41 authoring／新 P42 native fixture 以 forced Canvas2D／GL／GPU 各獨立進程全部 PASS。`showcase` 三 backend 各 1/1 nonblank／errors=[]；正式 `beacon-run?renderer=auto` 1/1 PASS。深度 assertions／PNG 在 `.vite/p42-canvas2d/`、`.vite/p42-webgl2/`、`.vite/p42-webgpu/`；完整實際遊戲 PNG／reports 在 `.vite/p42-beacon-webgl2/`、`.vite/p42-beacon-webgpu/`。
- **界線**：native compressed codecs 不內建 Basis／Draco，default ordinary KTX2 base RGBA8 path 不變；explicit native opt-in 才保留全部 supplied levels。無新 runtime dependency／official vendor patch／版本或 release 修改，feature commit 不 push／publish。Safari／Firefox／Edge、實體手把／觸控、真正 driver reset／BFCache、喇叭聽感、hosted CI 與 performance／FPS improvement 未驗，不從單一 Chromium pixels／CPU byte estimates 外推。
- **失敗／邊界流程**：每個 case 自己獨立 headless Chromium，以真 HTTP 503 驗 asset error→可信 Retry→menu／muted play；實際損毀 continuation／preferences envelope 顯示 warning、new run 重寫有效 records；注入 browser Storage SecurityError 仍可遊玩／pause；注入 AudioContext.resume rejection 顯示 unlock error後 muted 重玩。Canvas unsupported 也經實際正式初始化／清理；全部 expected app errors 有記錄、unexpected page errors=[]，各 case Destroy cleanup true。Timeout 分支用**導航前安裝的受控 browser RAF clock**推進76秒，真 Game→Scene timer降到0／lost／restart；不是75秒 wall-clock／背景分頁認證。長時間 native wait 曾終止於 closed context，未記為通過；clock 不能在 Game 已排 native RAF 後才替換。六 case reports／PNG 在 `.vite/p42-beacon-errors/`，throwaway drivers 驗後移除。
- **文件驗證**：全倉 format:check 通過；八件變更文件的250個相對 links（含 Markdown heading anchors）全部有效。README 中／英／日、雙語 USAGE／TECHNICAL、PLAN／DESIGN 同步目前契約，歷史數量／日期保留。文件檢查不冒稱重新驗證其他 browser／hardware。

## v1.8 發佈前驗證（限定已測環境）

- 使用者於 P40／P41／P42 獨立提交後授權推送及 GitHub v1.8 發佈；package metadata 更新為 1.8.0／Apache-2.0。保留歷史 tags／附件，不做 npm publish；README、PLAN、DESIGN 與雙語 USAGE／TECHNICAL 同步版本與本次授權。
- Node 26.7.0／pnpm 12.6.0 重新執行 frozen install、typecheck、79 files／678 tests、lint、build、全倉 format:check，全部通過。Build 198 minified JavaScript files，官方 vendor unchanged。
- 真正 `pnpm pack` 產生 `xyz.js-1.8.0.tgz`，解壓至 consumer 的 node_modules 後用 Node ESM `import ... from 'xyz.js'` 驗正式 root exports／1.8.0 metadata／Apache-2.0 LICENSE。真 Scene sphere 落地 sleep，移除支撐即 wake／下落；navigation 繞牆 cost=4／完整 route，destroy 清 registrations。封裝內 14 件官方 vendor 檔案逐位元組與來源一致，保留完整 dist 樹；輸出 V18_EXTRACTED_PACKAGE_CONSUMER_OK。
- 本次只改版本與發佈文件，不冒稱重新進行 browser／device 驗收；P40–P42 的真 headless Chromium pixels／完整參考遊戲／失敗分支與未驗限制保留於各節。Tag workflow 另於 Ubuntu 執行工具鏈、pack 與 SHA256SUMS 上傳；實際發佈結果以 GitHub Release／Actions 為準。

## P43 Fixed Simulation & Presentation（限定已測環境）

- **實作**：Scene 統一 fixed gameplay，在每次 callback 後推進兩個 physics worlds；frame force／torque 按提交時間加權，fixed force 按該 tick 計 impulse。Catch-up 丟棄時間與 force share 同步移除；clear／body replacement／destroy 不保留 stale impulse。Game opt-in render matrix interpolation 不修改 authoritative pose／queries。
- **真封裝 CPU smoke**：Node 26.7.0，實際 `pnpm pack` 解壓 root consumer，在 30／60／120／144／240 Hz 的 frame／fixed forces 下，2D／3D velocity 均為 120、fixedFrame=120、dropped time=0；呈現 matrix=.5、模擬 position=1，外部 teleport=20 不插值回舊位置。Sleeping 60 ticks 後 F120 一個 tick 在兩個維度皆 velocity=1；修正前已觀察 3D velocity=1/61，根因是 sleeping ticks 未消費 queued frame-time denominator。
- **真 Game pixels**：自建 headless Chromium shell／獨立 profile 的 Canvas2D Game，controlled RAF 0→12.5ms 驅動正式 update／render；2×2 紅 sprite 的像素 centroid 9.5→10.5，authoritative x=12、fixedFrame=1、alpha=.5000000000000001，無 runtime errors。Destroy 後 Scene registrations=0。這是呈現契約證明，不是實際 FPS 量測。
- **回歸**：保留 fixed simulation／force-clear／sleep-wake 行為測試；整合工作樹的 typecheck、93 files／780 tests、lint、build 已通過，這是全部本輪 source 的共用整合結果，不冒稱此單一 commit 當時含全部測試檔。Machine evidence：`.vite/production-cpu.json` 的 fixedSimulation／integrityForceRegressions；完整其他階段另記。
- **界線**：插值預設關閉，不改碰撞判斷／input picking 的 authoritative world；沒有 FPS 提升、跨瀏覽器／真背景節流認證。套件仍 1.8.0，逐功能提交，不 push／publish。

## P44 Native Frame Regression & Release Gate（限定已測環境）

- WebGPU oracle 改讀本次已提交的 frame texture，不在 presentation 後重新抓 swapchain；保留 tint／opacity native pixels 與 explicit loss／restore 分支，失敗 JSON／PNG／diagnostics 不被壓成成功。
- CI 共用完整 browser gate，release 必须依賴該 gate；headless launch 採 pinned Playwright 預設 shell，明示 executable override 才使用外部 path，沒有 backend fallback／重試。
- 本機 macOS arm64 已通過 forced Canvas2D／WebGL2／WebGPU deep regression 與 actual UI pixels；先前 hosted Ubuntu run 36885098433 的 alpha=0／device-loss failure 保留為真實失敗。未觸發遠端 Actions，不宣稱該 Ubuntu 環境已恢復；未來 release 仍由 mandatory gate 阻擋。
- 最後以預設 headless launch 再跑三 backend regression 全 passed；Canvas2D 無 native GPU／3D，WebGPU 沒有 public canvas device-loss injection，對應案例明示 SKIP，未假稱 true WebGPU device-loss injection 通過。

## P45 Shared 3D Spatial Index（限定已測環境）

- 真封裝 consumer 的 200 separated boxes 為 0 candidate pairs；isolated query 僅 1 candidate。Pose／scale 的直接 mutation、移除／filter 與 ray 距離 2.5 皆涵蓋；既有 exact narrowphase 維持正式結果。
- 採 deterministic balanced conservative AABB hierarchy，collision／overlap／ray／sweep 共用。因公開 transforms 可直接修改，每 tick／public query 必須 O(n) refresh／refit；只有 hierarchy traversal／narrowphase candidate reduction，不宣稱整個 query 已 sublinear 或 FPS 提升。
- 保留 broadphase consumer-visible regressions；actual mixed soak 的 physics／candidate counters 另記 P48。

## P46 Budgeted Navigation Jobs（限定已測環境）

- Root grid／graph incremental jobs 在 expansion budgets 1／2 下與同步最短 route 同 cost；cancel、revision invalidation、workspace bounds／destroy 都由真封裝 CPU smoke 覆蓋。
- Owner 使用有限 workspace／expansion budget；同步與增量共用搜尋核心，不另建假 worker／無預算 fallback。保留 deterministic route／budget／transition regressions。

## P47 Dynamic Navigation & Physical Replan（限定已測環境）

- 動態連線／clearance／revision 與 follower bounded replans 已整合；consumer 的真 capsule 受物理阻擋後 replan 一次，替代 route 最大 z=2，41 ticks 抵達 [4,1,0]；最大一次位移 .30000000000000027。
- 以 controller 的 blocked 結果為準；零 displacement 不因 floating tolerance 誤判。No stale route、cancel／destroy 與再修改 blocking 的行為保留回歸。
- 仍是 authored anchors／connections，不宣稱自動 navmesh／nearest-node projection。

## P48 Mixed Workload & Lifecycle Soak（限定已測環境）

- 真 `pnpm pack` 解壓 consumer、pinned Chromium headless shell 153.0.8010.12／macOS arm64；forced WebGPU／WebGL2／Canvas2D 各 60 秒，全數 passed、無 runtime errors，各完成 11／11／14 churn cycles。Canvas 明示 3D unsupported，採 2D／navigation／UI／asset churn，未用假 3D 冒充。
- 整體 native RAF p95 為 17／16.75／17ms，max 為 16.8／150.1／233.5ms，>50ms frames 為 0／2／15。Running CPU simulation-work mean 為 .00834／.00680／.01455ms，physics-update mean 3.58571／3.60666／.00124ms，submit mean .26211／.20834／6.31539ms；CPU／RAF／awaited operation wall durations 分开，沒有 GPU completion 時間或 FPS 改善宣告。
- 115／115／149 texture leases 全釋放，11／11／14 captures 全 destroy；decoded/native entries／liveBytes、borrowers、Scene／physics registrations、held attachment bytes 全為 0。Histogram／online trends／last-32 cycle observations 有界。
- Native geometry budget 修正為 active old＋candidate mesh uniforms／真 vertex-index bytes 的工作集加 reserve，預設 320KiB；未削弱 renderer admission／減少 workload。最初 8KiB 失敗與 full Chrome app 約 31 秒自主斷線診斷皆保留，獨立無 Vite 的 35 秒 probe 也觀察斷線；改用 Playwright 正式 headless executable 後通過，未將該現象冒稱 renderer crash 根因。
- Evidence：`.vite/production-mixed-headless-shell.json`。只有 60 秒有限觀察，不宣稱一小時 soak、process memory／GC／總 VRAM plateau；cache bytes 是引擎估計。

## P49 Content 3D & Dynamic Round-trip（限定已測環境）

- 真封裝 consumer 的 1375-byte JSON 重建 stable-ID parents／references／prefab children／custom factory topology，還原 3D pose／dynamic body／custom state，25 created nodes 正確清理。
- Factory failure 不出版 candidate，borrowed 16-byte texture 保持可用；live JSON restore 的半 tick pending force／torque 經 epoch clear 後 velocity／angular／position 全為 0。修正前 velocity=.5 的失敗已實際觀察。
- `capture`／`spawn`／`remove`／`rebuild` 走正式 ContentScene 與 factories；版本／schema／snapshot validation 保持 transactional，非任意 executable scene serialization。

## P50 Reproducible Asset Recipe & Deployment（限定已測環境）

- 同 pinned toolchain 對真 glTF／RGBA8 KTX2 supplied mips／PNG fallback 轉換兩次，7 files／5399 bytes 與 manifest SHA256 全一致；unknown toolchain／unsupported profile 明確失敗，不自製 BC／ASTC encoder。
- 真 pack 解壓的 browser consumer 在 forced WebGL2／WebGPU 顯示 2×2／2 mips 與 fallback PNG（各 21904 colored pixels）；5 asset checksums、14 official vendor files 逐位元組驗證通過。
- Real AudioManager.unlock=true，官方 8 processor assets 的 server responses 全 HTTP 200／2109 bytes／相同官方 checksum；worklet worker traffic 不能用 page request events 的空陣列冒稱沒載入。完整 `dist/vendor/opm/` 對官方 inventory 無 extras。
- Build 只清理 generated vendor mirror 再複製，不修改官方 source。清理前的額外 duplicate generated files 已完整備份至自有 /tmp archive；不推論其產生原因。

## P51 Native UITextInput & IME（限定已測環境）

- 自有 headless Chromium／independent profile，在 Canvas2D／WebGL2／WebGPU 的正式 Game／Scene／UIRoot 實測全部 passed：透明 native input、canvas text visuals、trusted keyboard selection [4,5]／Backspace、native browser undo（execCommand）與 value 同步。
- Synthetic composition start／update／input／end 顯示 isComposing true→false、值「語喵」；這不是 OS／硬體 IME 認證。UTF-16 selection、modal focus trap／pop restore、pause-resume、context／listener teardown 皆覆蓋。
- remove 後 listener 立即 inert，native DOM 依 semantic frame 清理（2 RAF 後 disconnected）；Game.destroy 後 semantic nodes／objects／attachments=0，errors=[]。Evidence：`.vite/production-ui.json` 與三 backend PNG。

## P52 ScrollView & Keyed Virtual List（限定已測環境）

- 三 backend actual UI surface 覆蓋 16 controls 的 focus reveal（scrollY=384）、viewport clip 下 hidden button click=0、wheel／empty-viewport drag 384→344。
- 10000 stable-key items 只 prepare 12 rows，實際 mounted=6。Trusted Tab 9000→9001；整體 reversal 後 key9001 的同 row／native focus 保持，scrollY=31936、mounted=6；destroy 無 semantic／row leaks。
- 真瀏覽器先抓到 reorder focus 丟失：focused key 必須 reveal 新位置；semantic wrapper 不可無條件重新 append 已聚焦 DOM。已修正並由三 backend 再實測通過，保留 consumer-visible focus-reorder regression。

## P53 Static Triangle Mesh Collider（限定已測環境）

- 真封裝 triangle BVH／narrowphase 的 three supported primitives 於 mesh rest heights .247633／.247633／.497633，ray distance=2、edge sweep fraction=.7763914、capsule grounded y=.50299998；不是外框假碰撞。
- Sidedness、degenerate／ownership validation、scale、candidate triangle limits 與 moving-mesh rejection 保留回歸。靜態 mesh profile，不宣稱 dynamic triangle mesh／arbitrary concave moving bodies。

## P54 Compound Collider（限定已測環境）

- Child-local transforms 的真封裝 ray gap hit 為 z=3、lobe distance=2.75，combined tensor inertia 的非中心 force/angular response 實測；沒有以整個外框填滿 gap。
- Flat compound／supported child profiles、local scale／volume／inertia、ray／overlap／sweep／contacts 與 moving-body validation 保留回歸；不加入遞迴 compound／moving plane-mesh 支援。

## P55 Translation CCD（限定已測環境）

- 真封裝 velocity=600 的 9 primitive×static target combinations（primitive／mesh／compound）全部無 tunneling，x≈-.26／-.25、velocity=0、各 1 contact；off-center impact 的 angular response=499.569。
- First-impact translation CCD 走正式 shared index／sweeps／contact response，filters／rebound／destroy 維持回歸。明示不含 rotational CCD／dynamic-pair CCD，不以降速／增厚牆或靜默 clamp velocity 假通過。

## P56 Animation Root Motion（限定已測環境）

- 真封裝 root stride／loop turn delta=[-1,1,0]、reverse／seek 的 reset 邊界與 blending／pause 契約已驗；兩次 strides 交給真 capsule controller，受牆阻擋於 x=.647，原 skeleton root 不被偷偷移動。
- Translation／rotation delta 提供 gameplay 消費，不自動覆蓋 authoritative body／碰撞；保留 loop／reverse／ping-pong／seek／blend／ownership consumer-visible regressions。

## P57 Explicit Animation Retargeting（限定已測環境）

- 真封裝 explicit bind mappings 跨 rest-axis／比例產生 target pose 與改變 skinned vertex，source tracks／source ownership 保持不變；保留 interpolation、mapping／transactional validation、destruction regressions。
- 只做明示 mapping／bind transforms 的 retarget，不宣稱 humanoid auto-rig／automatic bone matching。P43–P57 CPU smoke 合計 733 assertions（含 424 lifecycle cleanup assertions），實際 suite count 及最後工具鏈結果另以整合驗證為準。

## P43–P57 本輪完整整合驗證（限定本機環境）

- Node 26.7.0／pnpm 12.6.0，frozen install、typecheck、test（93 files／780 tests）、lint、build（210 JavaScript modules）與 format:check 全部通過；每個功能另以只含該階段與既有階段的獨立 staged tree 完成相同檢查，並連同相符 dist 逐功能提交。套件維持 1.8.0，不 push／publish／改 tag。
- 自有 isolated headless Chromium 153.0.8010.12／macOS arm64：完整 gallery smoke 89/89；Canvas2D／WebGL2／WebGPU deep regression 全部通過適用項目。真 WebGL context loss 已覆蓋；WebGPU 真 device-loss injection 明示 SKIP，Canvas2D 的 GPU／3D 項目亦明示 SKIP，不以 SKIP 冒充完成。
- 正式 Game 的受控 RAF＋實際 Canvas2D readback 證明 presentation：red pixel centroid 9.5→10.5、authoritative body x=12、fixedFrame=1、alpha≈0.5；不是測試矩陣代替實際渲染。Evidence：`.vite/production-p43-game-presentation.json`。
- 解壓封裝的 CPU consumer smoke 733 assertions；三 backend 原生文字編輯／composition／scroll／10000 keyed rows 的實際 UI 與 PNG 皆通過。兩次 asset recipe manifest SHA256 相同，解壓封裝於 WebGL2／WebGPU 實際畫出 native mips 與 PNG fallback；AudioManager unlock 與八份官方 AudioWorklet 的真 HTTP 載入皆通過。
- 混合 soak：WebGPU 60.011 s／11 cycles、WebGL2 60.014 s／11 cycles、Canvas2D 60.022 s／14 cycles；Scene／physics registrations、decoded／native entries 與 live bytes／borrowers、held attachments 清理後皆為 0，leases 與 captures 全數配對釋放。RAF mean 分別 16.666／16.731／17.840 ms，CPU simulation／physics／submit 分開記錄；這不是 GPU completion／VRAM 或 process-memory plateau 證明。Evidence：`.vite/production-mixed-headless-shell.json`。
- 正式 Playwright launcher 使用 pinned headless shell，保留 explicit executable override 的驗證與錯誤；獨立 full-app probe 曾於約 31.6 s 自行結束，未捏造原因。最後完整 smoke 與 soak 均用 headless shell 通過。自有 browser／profile 與本輪自有 Vite 服務已清理，未連接使用者 browser／relay。
- 限制：未執行 hosted Ubuntu CI、其他 browser／driver／硬體認證、OS／硬體 IME、真 WebGPU driver-loss 或一小時 soak；本機結果不外推以上項目。歷史驗收日期與當時 test counts 保留。
- 九份本輪文件的 278 個相對連結／heading anchors 全部通過檢查；文件格式檢查通過，不將文件檢查記成重新驗證 browser runtime。

## v1.9 發佈前驗證（限定已測環境）

- 使用者於 P43–P57 分功能提交後授權提交、推送與 GitHub v1.9 發佈；package metadata 更新為 1.9.0／Apache-2.0。前述 1.8.0／不推送記錄是當時狀態；本次不做 npm publish，不改歷史 tags。
- 重新執行 frozen install、typecheck、test（93 files／780 tests）、lint、build（210 minified JavaScript modules）及全倉 format:check，全部通過。此輪只變更版本與文件，不冒稱重新跑 browser／device 驗收。
- 真正 pnpm pack 產生 xyz.js-1.9.0.tgz；解壓後以 Node ESM 正式套件入口驗證 1.9.0 metadata、Apache-2.0 LICENSE 與 Scene／GameObject ownership／destroy，輸出 V19_EXTRACTED_PACKAGE_CONSUMER_OK。14 件官方 vendor 檔案逐位元組一致。初次 smoke 錯將已解除 ownership 的 undefined 判為 null，依正式契約修正 smoke 後通過，未修改引擎。
- 推送 v1.9 tag 觸發既有 GitHub Release workflow，必須先通過共用 CI 才能封裝及上傳 tgz／SHA256SUMS；線上執行與發佈結果以 GitHub Actions／Release 為準。
- 首次 hosted Ubuntu Release run 36915861881：工具鏈、四項 example smoke 與 Canvas2D／WebGL2 deep regression 通過；WebGPU 首個 atlas 場景 device loss，recovery 無 adapter，release 正確被阻止。新增 fixture graphicslost 原因記錄；macOS WebGPU diagnostic smoke 通過，不把本機通過當成 Linux 修復證明。使用者明確授權修正後重建 v1.9 tag。
- 保留 graphicslost 原因於 JSON，不將預期 WebGL loss 事件寫為 console error；各 backend 改用獨立 browser process，避免故意 context-loss 後沿用同一 GPU process。macOS 三 backend deep regression、typecheck、targeted lint／format 通過；Linux 成因與修復以後續 hosted run 為準，未降低任何 assertion／gate。
- Hosted run 36918414573 仍於 WebGPU 第一個場景失敗，排除 backend 共用 browser process 假設，撤回該隔離變更。Linux 原 flags 只選 ANGLE／WebGL SwiftShader，未選 Dawn／WebGPU adapter；依 [Chromium adapter selection source](https://github.com/chromium/chromium/blob/main/gpu/command_buffer/service/webgpu_decoder_impl.cc) 加入 --use-webgpu-adapter=swiftshader，明確使用 Vulkan CPU fallback。未停用 GPU sandbox、未放寬引擎錯誤處理；效果待 hosted CI 驗證。

## v1.9 Linux WebGPU swap-buffer 修正（限定本機 Ubuntu arm64）

- Hosted run 36918930363 仍於第一個 WebGPU atlas 場景失敗，僅指定 Dawn SwiftShader adapter 未解決問題；run 36919322863 的 Chromium stderr 在 device loss 前先報 `Could not find SharedImageBackingFactory`／`Unable to create shared image`，對象是 512×512 WebGPU swap buffer。Recovery 的 `GPUDevice.destroy()` 是後續清理，不是最初觸發點；該 run 最終取消，未建立 Release。
- 2026-10-02：新建隔離 Lima Ubuntu 24.04 arm64 VM，不改原有 Editkin VM；Node 26.7.0／pnpm 12.6.0／pinned Chromium headless shell 153.0.8010.12。原 launcher 在真 built-root `--renderer webgpu` 路徑重現相同缺 backing／non-existent mailbox 訊息，首場景失敗，evidence `.vite/v19-linux-before/`。
- 依 [Chromium 153 interop detection](https://github.com/chromium/chromium/blob/153.0.8010.12/gpu/config/gpu_util.cc) 與 [backing registration](https://github.com/chromium/chromium/blob/153.0.8010.12/gpu/command_buffer/service/shared_image/shared_image_factory.cc)：SwiftShader 停用 GL／WebGPU interop，而原 compositor 沒有 Vulkan backing。共用 Linux launcher 只新增 `--enable-features=Vulkan`／`--use-vulkan=swiftshader`；不加 sandbox bypass、不改正式 renderer／recovery、不增加重試／fallback／skip。
- 正式 launcher（非 probe wrapper）以 `--require-webgpu` 執行 Canvas2D／WebGL2／WebGPU deep regression 全部通過適用項目，四項 workflow example smoke 全部通過。真 WebGL loss／restore 保持驗證；主 Game fixture 的 WebGPU public canvas loss injection 仍明示 SKIP，既有 native-profile fixture-only loss/replay 與 uncontrolled driver reset 分開。實際 WebGPU atlas PNG 已觀察；evidence `.vite/v19-linux-vulkan-fixed/`。
- 修正後 macOS arm64 再跑 frozen install、format:check、typecheck、lint、93 files／780 tests、build（210 modules）及 `--require-webgpu` 三 backend deep regression 全部通過。八份同步文件的 274 個相對連結存在性檢查通過，格式檢查通過；本輪沒有新增公開 API、修改 vendor 或建立只檢查旗標字串的測試。
- 限制：本機 Linux arm64 修正已實測，hosted Ubuntu x64 尚未套用並驗證；不宣稱 hosted CI／v1.9 Release 已恢復，也不認證其他 browser／driver／硬體。

## P58–P70 2026-10-02 unreleased working tree：逐階段證據

本節依本輪 runtime handoff 與實際 observability JSON 記錄時間順序上的新工作，不改寫上述歷史日期、counts、release 或限制。以下證據取得於分功能提交前的 working tree；使用者後續授權依 P58–P70 分別建立 commit。Package metadata 仍 1.9.0／Apache-2.0，未 push／publish／改版本，以下功能不是既有 v1.9 release 的完成宣告。

### P58 — Startup／lazy subsystems

- Canvas2D startup 實際不載 GPU startup chunks；普通 Sprite 不初始化 physics／3D services。Source startup 158990 gzip bytes、built-root startup 146413 gzip bytes，對照先前 214169 gzip bytes；math consumer 722／726 minified bytes。入口 startup 與完整 reachable chunks 分開，不將共享 facade 冒稱 microengine，也不推論每個 consumer 的同等縮減。
- 成本 runtime smoke 的 static root trailing slash 與 RAF 內 native readback 修正後通過：source／built-root Canvas 首幀 pixel `[235,41,67,255]`、零 GPU implementation downloads、13 個未使用 services 皆未初始化。Forced backends、auto→GL→Canvas、native GPU configure failure、GL loss／GPUDevice.destroy 同 backend recovery，以及 3D→2D render target bytes 回落均實驗證；不是僅靜態 bundle counts。

### P59 — Browser／platform matrix

- Chromium 153、Firefox 155、managed WebKit 26.6 正式 deep regression：Canvas2D／WebGL2 適用項目通過；WebGPU 在 Chromium／WebKit 通過，Firefox adapter unsupported，未靜默換 backend。
- Formal platform 的 Chromium desktop＋mobile emulation 三 backend 通過，涵蓋 pixels／UI、native touch（focus 後重讀實際 bounds）、trusted native editing、Enter keydown 的 trusted unlock、storage、pagehide、pause／resume、resize／cleanup。Synthetic composition 與 Firefox `insertText` 產生的 native composition 分開，不等於 OS IME。
- Firefox 原生缺 `cancelAndHoldAtTime` 且 listener 九個 AudioParams 不可用，已以精確 per-context exponential／crossfade hold 與原生 legacy listener position/orientation 路徑修正。後續正式 Chromium 三 backend、Firefox Canvas／GL、managed WebKit 三 backend，各 desktop／mobile emulation 共 16 個適用組合通過；Firefox WebGPU 明列 unsupported。
- Native Safari 27.0.1 最初自有 probe session 已建立並刪除；formal runner 因既有 pairing blocked，即使停止自有 idle driver 仍阻擋。使用者明確選擇 **PRESERVE SAFARI**：不重試、不關閉或更動使用者 Safari／OS。Managed WebKit 不等於 Safari 認證。
- Independent engine-free CDP probe 無 freeze events 且 RAF 持續；headed／headless／minimized probe 也未轉換。此 host native freeze capability 記 unsupported，保留其他 host 有能力時的 strict actual-freeze assertion；不是 OS background freeze pass。無 Xcode simulator、adb 或實體 iOS／Android，無 OS IME／實體 gamepad／真 driver reset 證據；mobile emulation 不取代硬體 gate。

### P60 — Pinned semantic assets／typed decode／packed deployment

- 官方 Basis v2_50 commit `9bebe16726b3a61c8c213eeee3b7cffb462ef34e`，binary SHA256 `9f612da6e4708420744a7b757221fb120038ca0a2b71aa1a0080f6b7e46c4827`；官方 Draco 1.5.7 external tools，不新增 runtime dependency。真 CLI 兩次產生 19 files／22596 bytes，manifest SHA256 同為 `55cb924956142f0fe1ad06ec2ade7d0619353c218dd0dbf410ddd6fb79210923`。
- 實際 BC7／ETC2 RGBA8／ASTC 4×4、gamma／normal／alpha 語意 mips、Basis universal、PNG／RGBA fallback 與 compressed／expanded glTF；正式 runtime selection 按 capability 選擇，不冒稱 Canvas native compressed upload。
- 真 typed Draco CLI／decoder 驗證 skinned joints／weights／color／UV、raw／normalized／logical accessor metadata；UINT32 `[16777217,33554435,1073741823]` 在 adapter boundary 精確保留。更高 UInt32 官方 encoder 拒絕，GLTFLoader custom UInt32→Float32 仍有限制，不宣稱 whole-32-bit consumer path。
- 最終獨立解壓 consumer `/tmp/xyz-production-consumer-8F1InC/consumer-final/package`，tgz SHA256 `6f00498f9436673231c1858b9814df6dadb75d3c264b45b9e13c4d5c7dcc8eed`；native WebGL2／WebGPU deployment 通過：17 checksums、14 件官方 vendor inventory、3 models／21904 colored pixels、native 3 mips＋raster 1 mip、manifest fallback-draco、八份官方 worklets、trusted unlock。
- 初始 WebGPU verifier 將成功 stream EOF 後 `net::ERR_ABORTED` 誤列失敗。Independent engine-free 1200 native fetch experiment：stream 99 次該事件，arrayBuffer 0／400，exact bytes 保持；未改 asset engine。Classifier 只接受同 request-ID、server finish／完整 delivered bytes、manifest SHA／EOF 且在 `Game.destroy` 前完成、沒有實際 abort/cancel 的已驗成功請求；不是 blanket cancellation suppression。真 negative abort、hash corruption、pageerror 仍 fatal。

### P61 — Acquisition／release scopes

- Built-root runtime 驗證 shared asset acquisitions、strict consumer barriers、last release、失敗 release 保留 retry，以及 cancelled late factory 經 tracked `ctx.own` rollback。Actual Game cancellation disposal counts `[1,1,1,1]`、independent spawn scopes=2；texture／model／font／audio／custom ownership 不提前 destroy shared borrower。
- Cancellation cleanup 等 successful consumer barriers；未 claim 的 external async side effects 仍由 caller 負責，不冒稱任意 Promise 都可強制取消。

### P62 — Fresh save candidate publication

- 新 content loader 在 schema migration 後建立新 candidate、完成全部 restore 才 guarded publication；後方 adapter failure 保留舊 Scene，cancel／supersession 清候選。Built-root fresh-load／scope runtime proof 通過，不以部分 live mutation 當 transactional load。
- Legacy `Serializer.restore` 仍是 sequential、nontransactional；新契約不偽稱舊 API 原地還原已改成 atomic。

### P63 — Observability／low-tier／long soak

- 先前三 backend 10 秒 native observability smoke 通過，Apple M5／10 logical CPUs／24 GiB／macOS 27，三自有 process 共用 host；heap／GC／RSS／VSZ 實測。WebGL native 434 samples、mean 1.0522 ms／max 1.598 ms／invalid 0；Canvas GPU unsupported／null。
- 後續 `.vite/mixed-simulated-low-tier.json`：真解壓 consumer、Chromium 153.0.8010.12、80-body 配置，CPU 4× throttle＋150 ms latency＋download 200000／upload 90000 bytes/s，三自有 browser 並行、不是實體低階硬體。Canvas／GL／GPU 各 passed、errors=0：elapsed 120.0402／120.7828／120.1552 s，cycles 25／20／18；RAF mean 18.4665／24.6349／28.6214 ms、p95 17／83.5／100.25 ms、>50 ms frames 105／380／524。Canvas 走 2D／navigation／UI churn，不用假 3D。
- GL query 3945 valid samples、mean 1.5150 ms／max 6.524083 ms／invalid 0；WebGPU timestamp source 存在但 3171 invalid、0 samples、milliseconds=null，不是 measured GPU time 或零成本。Canvas unsupported／null；CPU submit、RAF interval、awaited wall durations 與 GPU completion 分開。
- Native bounded GC traces event counts Canvas／GL／GPU 76／950／961，observed GC durations 181.246／1084.532／1206.681 ms。JS heap first 534528 bytes，last 11221592／13070920／31486576 bytes；短窗口分類 Canvas variable、GL／GPU sustained-growth，包含 startup，不是 memory plateau／leak certification。RSS／VSZ 是 process memory，不是總 VRAM；引擎 cache bytes 是估計。
- 清理 registrations／physics registrations／decoded／native live ownership／held attachments 均歸零；leases 189／140／125 全配對釋放，captures 25／20／18 全配對 destroy。CPU 16.67 ms 僅 observational cooperative budget，不是 preemptive deadline。
- `.vite/mixed-native-hour.json` 的 isolated packed consumer／unique cache／HMR-off 一小時實測完成：Canvas／GL／GPU elapsed 3601.1663／3602.4244／3602.5382 s，834／537／537 cycles，全 passed／errors=0。RAF mean 16.9770／23.4185／23.4256 ms；CPU render-submit mean 10.2155／0.3220／0.4543 ms，兩者不可混用。GL 96392 valid native queries，aggregate mean 1.9588 ms／max 13.876291 ms／invalid 0；GPU 0 valid／96120 invalid，milliseconds=null，Canvas unsupported。
- 同一一小時 native CDP heap first 534528 bytes、last Canvas／GL／GPU 14021452／27402036／30464008 bytes；尾端分類 plateau／variable／variable，renderer RSS last 306348032／282214400／278577152 bytes，尾端皆 plateau。GC observed events 2036／40979／40733、wall durations 2919.736／21318.518／21960.292 ms，bounded trace windows 有 drain gaps／unmatched events，沒有 forced GC，不把 GC durations 當純 stop-the-world pauses。RSS／VSZ／GPU-process RSS 不是 VRAM；尾端分類不是 leak-free 認證。
- 一小時 leases 8622／4518／4504 全配對釋放，captures 834／537／537 全配對 destroy；registrations／physics registrations／decoded/native live bytes／held targets 全歸零，navigation maximum work=512。此 snapshot 早於最後 Firefox audio hold／listener 修正，不冒稱該 audio patch 跑滿一小時。先前中止 runner 仍不算 pass；真低階／硬體／VRAM plateau 限制保留。

### P64 — Scene quota／changed-only spatial

- 共享 Scene scheduler aggregate work／expansion quota、pause／lifecycle／debug stats 已驗；low-tier 三 backend maximum navigation work=512，bounded cooperative units 不超 quota。
- 100 unchanged spatial queries 產生 0 geometry refresh／refit，mutable transforms 保持 query 結果；pose checks 仍 O(N)，不宣稱整個 query sublinear，亦不以 stale bounds 換成本。

### P65 — Moving support／stance

- Built-root 真 character sweep 驗 moving lift translation／yaw carry、jump／support removal detach、wall slide、ceiling crush／rotation；crouch／blocked stand 原子保持姿態與 feet invariant。不是直接 teleport 穿過 blocker；此證據不改寫歷史 2D translation-only controller 限制。

### P66 — 3D joints

- Built-root vehicle spring suspension、hinge axis／limits／motor 與 articulated chain 實際 linear／angular response 通過，含 ball/socket angular constraints 與 ownership／cleanup；不是 debug geometry 或 export wiring 證據。

### P67 — Dynamic／rotational CCD

- 真相向 dynamic pair ±600 bounce、rotational blade 與 compound／mesh stop 已驗，維持 filters／contact response，不降速或加厚牆。Blade 13 iterations、1 impact、1 次 budget exhaustion，保留 conservative prefix 並誠實回報，不宣稱任意 rotational motion 都能無界求解。

### P68 — Collision bake／NPC scheduling

- 真 collision bake alternative path cost=6；120 NPC／120 replans、187 ticks、maximum aggregate work=17，走 shared scheduler 與 character 路徑，而非獨立無預算搜尋。Clearance／slope／step、edit／rebake／cancel 與 scheduler lifecycle 在限定 bake profile 內。
- Bake 是 sampled topmost single-layer grid／surface graph，不是 polygon／multi-layer navmesh；不把此限制隱藏成完整 geometry navigation certification。

### P69 — International text visuals

- 初次真 RTL screenshot 暴露 consumer bug：reference ink 339 px／1762 pixels，actual 僅 6 px／34 pixels；layoutWidth=920 但 pre-arrange horizontalOffset=340.078125。修正 paintSelection 依實際可用寬度 clamp 後 actual 337 px／1526 pixels、offset=0。
- Native browser driver 另畫完整 Hebrew reference，要求 visible width≥90%／ink≥70%，保存 `rtl-full-paragraph.png`。Chromium 三 backend、Firefox Canvas／GL、WebKit 三 backend 共八個適用組合通過；bidi discontiguous selections、direction／locale、ZWJ／combining grapheme boundaries、native caret／trusted Unicode editing／UTF-16 selection、CJK readiness／fallback 持續通過。Synthetic composition 不等於 OS／硬體 IME；Text3D native fillText 限制不因此取消。

### P70 — Native audio graph／automation／world binding

- Chromium trusted unlock、實際 sample／stream／官方 OPM 在八 WebAudio contexts 通過：RMS base .517515、EQ .034139、compress .056392、duck .103607、overlap .103473、release .51737、held .568333、cancelled .295261、fade 0、reverb .112539；stream .517607→.004304、OPM .113162→.0002198，spatial near .201561／far .0287268。
- Context-time automation／pause／cancel-hold、convolution immutable copy、borrower-safe world-transform following 與 binding lifecycle 已有 native Chromium proof；analyser RMS 不等於 physical audio hardware certification。
- Firefox 缺原生 `cancelAndHoldAtTime` 的精確 exponential／effect crossfade hold 修正已完成，不使用 `AudioParam.value` 近似。Native Firefox 155 八 contexts sample／stream／官方 OPM／effects／overlap／automation／pause／world bindings 通過：base .516477、duck .103586、overlap .103628、release .517345；rapid model error 2.56e-8、native reference error 0。Chromium 153 同路徑通過，rapid native reference error 2.98e-8；WebKit default cancellation clock 只取樣一次，避免 currentTime 跨 tick 判為過去。
- Managed WebKit 26.6 serial 八-context native audio run 通過；後續 concurrent run 仍觀察到原生 `stream.play()` AudioError 與 control-arrival reference difference .003699，因此不宣稱 WebKit streaming 在並行負載下穩定認證。不 suppression／retry／fake fallback，也不更動官方 DSP。正式 platform unlock 矩陣通過與這個更強的 audio stress 限制分開記錄。

### 本輪整合狀態與剩餘 gate

- RTL 修正後 Node 26.7.0／pnpm 12.6.0 typecheck、104 files／859 tests、build（229 JavaScript modules）曾通過；那是當時 working tree 結果，不更改歷史 93／780。
- 最終 audio 修正後 Node 22.13.0／24.21.0／26.7.0 各 typecheck、104 files／859 tests／build 通過，229 JS modules：2171981→1150101 bytes。九組實際 Node×Chromium／Firefox／managed WebKit 本機矩陣共 60 個 CLI stages 通過，涵蓋 built-root Canvas examples、Chromium mandatory GL examples／WebGPU regression、三 engines deep regression、desktop／mobile emulation 與 retained text pixel proof；這不是 hosted Ubuntu CI 實跑。
- 新增八個英文可操作範例，根 `/index.html` 與 `/examples/` 共用 35-entry catalog／filters／backend links。Chromium 153 built-root 35 個範例的 117 個登錄 renderer routes 全部 non-blank pixels／pageerror-free 通過。多語 translation dictionaries／RTL／CJK／emoji 只作示範資料，不是非英文 authored instructions。
- `git pull --ff-only` 已 fast-forward `c0c05ca→98bcfeb`，保留遠端 `engines.node >=22.0.0` 和本機四個新增 scripts；package version 仍 1.9.0。最低 Node major=22，固定 lint/test 開發工具需至少 22.13.0；獨立 asset recipe 仍 exact Node 26.7.0 pin。
- CI 定義為 Node 22／24／26 quality jobs、Ubuntu 三 Node×三 engines 九 browser jobs，另保留 macOS WebKit／Node26 gate；Firefox Linux 提供 native PulseAudio null sink。未 push／觸發 hosted workflow。Safari explicit-preserve、真行動／低階硬體、OS IME／gamepad／driver、host freeze unsupported，以及 WebGPU timestamp invalid／WebKit concurrent audio 限制均保留。
- 最終整合後 Node 26.7.0／pnpm 12.6.0 再次完整執行 lint、format:check、typecheck、104 files／859 tests、build（229 JS modules：2172592→1150101 bytes）與 check:tree-shaking，全部 exit 0。Lint 也暴露一個範例遺失 error cause（已修）；`.vite/` 暫存證據目錄與 `.prettierignore` 一致地排除於 ESLint。
- 分功能提交時，P58–P70 的隔離 index 快照逐階段通過 typecheck，涉及 runtime 的階段各自重建對應 dist；最終隔離快照以既有工具直接執行 lint、format:check、typecheck、104 files／859 tests、build 與 check:tree-shaking，全數通過。Chromium 153 built-root `lightweight2d`／Canvas2D 再 smoke：1/1 non-blank、無 page error；10 份文件的 327 個相對 Markdown 路徑／heading links 通過。這輪沒有重跑九組 browser 矩陣、hour soak 或 Safari gate，也沒有 push／觸發 hosted CI；11 個既有未追蹤編號 vendor 副本保持原樣，不列入 commit。

## v1.10 發佈前驗證（限定已測環境）

- 使用者於 P58–P70 分功能提交後授權 GitHub v1.10 發佈；package metadata 更新為 1.10.0／Apache-2.0，推送 main 與新 tag。前述 1.9.0 working-tree／不推送敘述是當時狀態；不做 npm publish，不改歷史 tags。
- Node 26.7.0／pnpm 12.6.0 重新執行 frozen install、typecheck、104 files／859 tests、lint、build（229 minified JavaScript modules：2172592→1150101 bytes）、format:check 與 check:tree-shaking，全數通過。10 份文件的 327 個相對 Markdown 路徑／heading links 通過；本輪版本／文件調整未宣稱重新跑 browser matrix、hour soak 或硬體 gate。
- 真正 pnpm pack 產生 xyz.js-1.10.0.tgz；解壓後以 Node ESM 正式 root 入口驗證版本／Apache-2.0 LICENSE 與 ResourcePool 跨 scope acquisition：同 request 只 load 一次，第一個 scope release 不 dispose，最後 borrower release 才 dispose 一次，輸出 V110_EXTRACTED_PACKAGE_CONSUMER_OK。14 件官方 OPM vendor 檔案逐位元組一致，保留完整 dist 目錄树。
- 推送 v1.10 tag 觸發既有 Release workflow：共用 Node22／24／26 quality 與三 engines browser gates 成功後，才封裝並上傳 tgz／SHA256SUMS；線上執行與發佈結果以 GitHub Actions／Release 為準。Safari、實機 mobile／gamepad／OS IME／driver、WebGPU timestamp invalid 與 WebKit concurrent audio 等既有未驗／限制不因版本號消失。
- Hosted [Release run 36966119517](https://github.com/YueyuHoshizora/XYZ.js/actions/runs/36966119517) 全部 14 jobs success：Node22／24／26 quality、Ubuntu24.04 三 Node×Chromium／Firefox／WebKit 九組 browser jobs、macOS WebKit／Node26，以及 release。Chromium 保留 required WebGPU／GL native gates，三 engines 均執行 desktop／mobile emulation／bidi pixel proofs；未降低 assertions、未增加 retries／skip。這是新增 hosted 證據，不改寫先前 Linux 修正的當時待驗紀錄。
- [GitHub v1.10](https://github.com/YueyuHoshizora/XYZ.js/releases/tag/v1.10) 正式發佈（非 draft／prerelease），附件 xyz.js-1.10.0.tgz／SHA256SUMS 已下載，shasum -a 256 -c 通過。Tarball SHA256 為 `40e35bbf9da9cc8a31486e3de7a42412de011e15bb2c3b554f9a00665844e7d3`，與前述已實際驗證的本機封裝逐位元組一致，故相同 root consumer／14 件官方 vendor 證據適用於發佈附件。Tag 固定在 release metadata commit 90ec809；後續 hosted 結果文件獨立提交，不移動 tag。

## P71–P87 原始需求與驗收 gates

使用者於 v1.10 後批准全部缺口補強；完整範圍見 PLAN 的 P71–P87 表。此節保留批准當時的驗收要求，不改寫歷史 dates／counts／release facts；套件維持 1.10.0。後續實作／限定 native 證據如下，不能由功能清單推論 platform certification。

每個階段须記錄實際 source／package consumer、backend／browser／OS／設備、命令與 runtime 證據。功能不可用時必須區分實作缺陷、明確 unsupported、設備／授權缺少與尚未執行；不以 scaffold／exports／mock／non-blank 畫面替代指定行為驗收。

- P71：已知 WebKit concurrent AudioError／control-arrival 差異作為修正基準；保持真 native playback error 可見，官方 vendor 不改。
- P72–P74：獨立 2D／3D consumer 完整可玩與持久存檔、正式部署；版本／API 契約可查；排序／跨頁競寫／corrupt recovery／autosave 成功及失敗均可觀察。
- P75／P87：真 mobile／gamepad／OS IME／audio／background／thermal／driver／輔具與自動化證據分開；Safari preserve。缺少可安全使用的設備／session／授權時具名 blocked，不能冒稱 pass。
- P76–P78：真平台角色運動／高速 2D 碰撞、fixed locomotion 無 drift、同 XZ 多層路徑與合法 connectors，所有 lifecycle／revision／quota 邊界。
- P79–P85：正式 GPU／GL visibility／LOD／HLOD／occlusion／custom shader／lights／particles pixels 與 loss／cleanup；streaming 真內容／資產／物理／導航；worker 真 execution；Tiled 真匯出格式。
- P86：WebGPU timing 根因與有效或 unsupported 證據；代表性 workload 有明確配置及門檻，RAF／CPU submit／GPU completion／heap／RSS／VRAM 不混用。

## P71–P87 working-tree 驗證（2026-10-02，未發佈）

正式 runtime／公開 root／starters／範例／工具已整合；下列是實際執行過的限定證據，不是全平台認證。Metadata 保持 **1.10.0／Apache-2.0**；驗證當時未 commit／push／tag／publish，之後依使用者要求分功能提交，仍未 push／tag／publish。歷史驗收原 dates／counts 保留。Source／dist／site 既有額外編號 vendor 副本未刪除；package/site 僅 allowlist canonical 14 件官方檔案。

### 環境、獨立性與靜音

- 本機 formal shell Node **26.7.0**／pnpm **12.6.0**；eval host 的 Node26.3.0 是不同 runtime，不混記。Playwright-managed Chromium **153.0.8010.12**、Firefox **155**、WebKit **26.6**；read-only 實機 inventory 為 Mac17,3／Apple M5／24GB／macOS27.0.1 build26A434。Native GL identity 為 Apple M5 ANGLE Metal，WebGPU 為 browser-exposed Apple metal-3；driver version 未暴露。
- 每個 native session 由本輪自行 launch，在私有 context／page／ephemeral server 上執行並關閉。未連入 shared browser／使用者 Safari，未調 OS／foreign driver。
- Audio 在 native playback 前接 gain0 physical destinations，media 先受 guarded routing 控制；Chromium 另加 `--mute-audio`。Read-only analyser 在 sink 上游量測 real PCM。這是 signal proof，不是 speakers／audible output／Safari 認證；全程不向實體裝置發出聲音。

### 正式功能與可觀察結果

| 階段 | 實際證據與保留邊界                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P71  | WebKit／Chromium／Firefox 各一次 concurrency2 的6頁 native load gates 全 PASS。8個原生 contexts、3 streams／4 samples／real OPM mix、constant signal／lowpass attenuation；reference max error **0**（原1e-6 assertion不變）。Pause8 clocks advance0；等待8個原發出的 resume promises後8 clocks running／3 streams playing。Cleanup後 errors[]／pageErrors[]、8 contexts closed／graph0／sources stopped／URLs0。PCM proof 是 mixed music，不冒稱逐 source isolated proof。                                                                                                                                                                                                                                                                        |
| P72  | 明確 frozen bg228 tgz SHA256 `b61884e34e44cbc726447f174dfb7eed3d1207547bbb337c6d6830a69781a189`；2D／3D 分別 fresh install／strict typecheck／production build／installed CLI 生成，完整818 engine files與canonical14 vendor逐 bytes相同。實際部署2D `/relative/courier/`、3D `/games/courier/`。Native keyboard／touch injection／jump／wall blocking／pause／settings／reload／Continue／five-crystal WIN／patrol LOSE／restart／destroy；3D最新完整rerun，2D不變的完整流程透明沿用先前同 runtime 證據。真 rounded-corner位置 `[0.8230016878898517,0.9001979876628258,3.7474396308356215]` Pause durable save→reload→Continue exact，squared corner distance .0925547734>=.09；penetrating／outside／below-floor probes都 invalid，primary不變。 |
| P73  | README 中／英／日、雙語 USAGE／TECHNICAL 與相容性／遷移指南同步 current root、ownership、unsupported、version與custom Renderer契約；不將P58–P70當時859 tests／35 demos等歷史 counts 改寫成目前結果。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| P74  | 真 IndexedDB 與 LocalStorage Web Locks、兩真 tabs／不同 wrappers同 namespace：CAS一commit／一stale、remove／recreate ABA保monotonic revision、corrupt唯讀／backup／explicit restore／archive原始UTF8 bytes與hash一致、corrupt兩份拒絕且sentinel不變。Native transaction abort造成可見save error，5.5秒無silentretry，explicit Retry才成功；stale UI不overwrite，destroy後pending autosave不寫。Textarea會normalize CRLF，不冒稱其 `.value` 保留原line endings。LocalStorage不是crash-atomic。                                                                                                                                                                                                                                                      |
| P75  | Read-only host inventory與具名 evidence validator已執行；validator只產生 evidence-ready-for-review，不自動授予certification。Physical mobile／gamepad／OS IME／audible／background-thermal／driver scenarios仍blocked，原因見下方。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| P76  | Dynamic pair ±1200真 restitution／一次impact；rotating blade真contact與honest budget exhaustion，不加厚牆／clamp速度。Stairs／slope／support／carry／jump detach／removed support／ownership；Scene fixed30／60／144／240相同位置 `[1.9207178,7.039867]`。Owned Chromium三native backends motion2d真鍵盤移動／牆與blade／lift／jump／cleanup physics0。                                                                                                                                                                                                                                                                                                                                                                                            |

### 未取得或禁止的實體驗收

- **BLOCKED**：安全可控owned physical mobile／gamepad／OS IME／background-thermal session不可得；設定中Zhuyin／device list／emulation不構成場景證據。Safari preserve：不連入或操控使用者Safari/sharedsessions。
- **BLOCKED**：真OS assistive session／spoken output與driver-reset授權不可得；禁止發聲使physical audible／spoken-output gates不能執行。Native application loss/recovery不是實體driver reset。
- **UNVERIFIED upstream attestation**：official OPM v1.1.0 archive／SHA256SUMS URLs及authenticated release查詢曾404；未重試／修改官方檔。Local canonical14 bytesidentity／license/manifest完整，不冒稱重新下載驗checksum通過。
- Original unclassified centered-contact save timeout、uninstrumented textureabort、早期audio數值／cleanup失敗保留；不回填根因或叫它們PASS。獨立可重現rounded-corner與Canvashitch已各以真实rootcause修正及新的正／負或before／after證據確認，其餘未改功能沿用具名nativeproof。

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
- [技術文件](docs/TECHNICAL.md) 提供模組邊界、Clock 算式、Canvas／DPR 與 aspect-ratio 契約、GPU 資源、錯誤策略及部署方式；README 中／英／日用法與 DESIGN 同步更新。
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

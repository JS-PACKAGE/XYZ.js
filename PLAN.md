# XYZ.js 執行計畫

## 強制執行範圍（硬規則）

- 依《XYZ.js — Web 遊戲引擎開發企劃書》實作瀏覽器遊戲引擎；P42 另批准完整可玩參考流程，不改成只交付遊戲本體。**目前 metadata 1.16.0／Apache-2.0，npm 未發佈**。P01–P08 的 v0.0.1–v0.0.8 對應與後續各輪 counts／日期／release facts 均保留為歷史，不作新階段驗收。完成狀態以 [驗收紀錄](ACCEPTANCE.md) 為準，版本號不代表跨瀏覽器認證。
- P01–P08 的驗收後獨立 `[Pxx]` commit 與 P09–P39 當時的提交限制是歷史規則；使用者本輪另授權 **P40／P41／P42 分階段驗收後提交**，僅由整合主代理執行。三階段完成後再授權 push 與 GitHub v1.8 release／package 1.8.0；不做 npm publish，不改歷史 tags。
- P43–P57 已依使用者授權逐功能提交；使用者另授權推送 main 與 GitHub v1.9 release／package 1.9.0，不做 npm publish，不改歷史 tags。
- P58–P70 已依使用者授權逐功能提交；使用者另授權 GitHub v1.10 release／package 1.10.0，推送 main 與新 tag 由既有 CI／release workflow 驗證後封裝。不做 npm publish，不改歷史 tags；以下發佈前的 working-tree／不推送敘述保留為當時狀態。
- P71–P87 已依使用者要求分功能提交；本次另授權升版 1.11.0、推送 main／v1.11 tag，沿既有 CI gate 發佈 GitHub Release 與 checksum。不做 npm publish，不改歷史 tags；本輪原先不提交／未發佈文字保留為當時狀態。
- P88–P96 完成後，使用者另授權升版 1.12.0、推送 main／v1.12 tag，沿既有 CI／Release workflow 發佈 GitHub 套件與 checksum；不做 npm publish、不修改歷史 tags。以下未推送敘述保留為當時狀態。
- P97–P103 已分功能提交，當時 v1.12.2 納入官方 OPM.js1.8.0（tag `v1.8`），維持1.x契約。已推送 v1.12.2／v1.12.3 tags 不變；[Release37067932861](https://github.com/YueyuHoshizora/XYZ.js/actions/runs/37067932861) dense2d 功能 PASS／效能 FAIL，v1.12.3 dense2d 真修正後 CPU frame p9532.5ms，但 [Release37071402430](https://github.com/YueyuHoshizora/XYZ.js/actions/runs/37071402430) 2D／3D／navigation RAF FAIL，兩次未建立 Release。使用者授權調查確認根因、修正、v1.12.4、main／新 tag 推送與 GitHub 套件／checksum，並加入 Windows CI。[CI37092521565](https://github.com/YueyuHoshizora/XYZ.js/actions/runs/37092521565) Windows Node22／24／26 quality／API／negative-smoke／installed CLI、signed endpoint、Firefox完整流程 PASS；Chromium WebGL pixels／WebKit pixels與audio仍 FAIL。Hosted五個 workload PASS但失焦 guard FAIL：另一 CDP handler 的 `false` 不會撤銷原 capture。正式 driver 已改用 public `noDefaults`／每 workload 新 default context，本機真失焦 guard PASS；完整 revised hosted qualification待執行，原 counts／budgets不變，額外 loopback ephemeral transport argv明示 pin。必要 gates PASS 前不建立 v1.12.4 tag／Release，不 npm publish、不改歷史 tags／已發佈 v1.12.1 baseline，不宣稱完整 Windows／實機認證；缺 owned hardware／授權的資格仍 BLOCKED。
- 後續 [CI37105917252](https://github.com/YueyuHoshizora/XYZ.js/actions/runs/37105917252) 五原 workload及真失焦guard全PASS，RAF根因修正已完成實際hosted資格；Windows Chromium原生loss／WebKitexactpixels仍阻擋發佈。使用者明示批准 pinned WindowsWebKit編譯關閉的WebAudio／AudioWorklet記UNSUPPORTED，WebKit其他graphics／input／lifecycle／cleanup gates及WindowsChromium／Firefox音訊仍必須通過；不自製DSP／patchvendor。Color-conversion-none嘗試實跑無效撤除，不能冒稱pixel根因已修好。
- 使用者另授權提交 OPM.js 1.11.1 更新、升版 1.13.0、推送 main／新 `v1.13` tag，沿既有 CI／Release workflow 發佈 GitHub archive 與 checksum；不做 npm publish，不改歷史 tags 或既有驗證門檻。
- 使用者本輪授權提交程序貼圖材質、升版 1.14.0、推送 main／新 `v1.14` tag，沿既有 CI／Release workflow 發佈 GitHub archive 與 checksum；不做 npm publish、不移動歷史 tags、不降低驗證門檻。
- 使用者另授權 P104–P118 分功能提交、升版 1.16.0、最後推送 main／新 `v1.16` tag，沿既有 CI／Release workflow 發佈 GitHub archive 與 checksum；不做 npm publish、不移動歷史 tags、不降低驗證門檻。前述 working-tree／未提交敘述保留為當時狀態。
- 首次 `v1.16` release workflow 因 packaged asset CLI help／CJS offline MIME 失敗而未發佈；使用者另明確授權修正後替換這個尚未發佈的 `v1.16` tag，任何更早歷史 tag 仍不可移動，gates 不變。
- 開發者對外使用統一 `xyz.js` API；ECS 保持內部資料模型。`auto` 已提供 WebGPU→WebGL2→Canvas2D 初始化降級，強制指定 backend 不得靜默切換；執行中 loss 不自動切換 backend。
- 原 v1.0–v1.1 非目標中的場景階層、模型載入、Animation、PBR、法線貼圖與陰影依決策納入 P09–P12；Physics／Tilemap／Particle 納入 P15–P17，P30–P39 再擴充 bounded profiles。原排除的 UI layout／widgets、GPU skinning／animated bounds、native compressed／mip textures、3D physics／character／dynamic bodies、Navigation／pathfinding、animation masks／additive／blend tree／IK 已依使用者批准納入 P41／P42，下方契約不得以舊 non-goal 刪減。仍不做 Visual Editor、Visual Scripting、Shader Graph、Networking、Inspector／Scene GUI Editor、JS Software Rasterizer、自製 Shader IR／transpiler、Native Desktop Runtime；不承諾對齊 three.js addons 或 Excalibur 全部 API／plugins／main-only 功能。
- TypeScript strict、Web 原生 API、零 runtime dependencies（P07 的 OPM.js 官方 vendor 發佈包除外）。禁止為了過關而另寫獨立 triangle demo 繞開正式 Game→Renderer→WebGPU 路徑。

## 本輪批准追加：可重用程序式 PBR 與 gallery

使用者批准 additive `ProceduralMaterial`／`ProceduralMaterialKind`／`ProceduralMaterialOptions`，支援 wood／brick／stone／metal／fabric／marble 六種。`create()` 一次生成 deterministic／seamless immutable baseColor／normal／metallicRoughness／occlusion maps；size 為整數 32–1024（預設 256），seed 為無號 32-bit 整數（預設 1）。預設 opaque／repeat、roughness factor 1，metal 的 metallic factor 1、其餘 0。呼叫者擁有預設，可借 `material` 或以 `createMaterial(overrides)` 重用 maps；所有使用者移除後才同步、冪等 `destroy()`，只釋放生成貼圖；`destroyed` 可查，銷毀後不再建立借用材質。

整合既有 pbr3d gallery 的六種預設切換與貼圖預覽，不新增外部素材／依賴、不改共用 geometry／renderer／core-assets 邊界、不改 Scene／mesh ownership。初次實作未授權 commit／push／升版／release；使用者後續明確授權 v1.14 發佈，依頁首規則執行。實際品質與 browser 證據見 ACCEPTANCE，不由批准或文件推論驗收。

## 倉庫結構

- `src/`：公開統一入口及集中可調常數 `src/data/`。
- `packages/core/`：Game、Clock、Scene、2D／3D 物件與相機、logger；`packages/graphics/`：Renderer 契約、WebGPU／WebGL2／Canvas2D 與 auto presentation。
- `packages/ecs/`：內部 World；`packages/math/`：2D／3D 數學；`packages/assets/`：Texture／cache；`packages/input/`：Keyboard／Pointer／Gamepad；`packages/audio/`：OPM orchestration。
- `examples/`：`index.html` 範例目錄（`pnpm examples` 開啟）；原 P08 六個範例 `triangle/`、`sprite/`、`cube3d/`、`pong/`、`fallback-demo/`、`showcase/`，另增 `advanced3d/`、`gameplay2d/`、`rendering2d/`、`authoring-lab/`、`beacon-run/` 與功能聚焦範例 `physics2d/`、`particles2d/`、`tilemap2d/`、`transitions2d/`、`ui2d/`、`input-lab/`、`audio-lab/`、`pbr3d/`、`instancing3d/`、`picking3d/`、`gltf3d/`；`benchmarks/sprites/`：1,000 Sprite 可重現負載量測。
- `vendor/opm/`：官方 OPM.js v1.11.1（tag `v1.11.1`）完整 dist、LICENSE、來源／checksum manifest；`scripts/copy-vendor.mjs` 在 build 後原樣複製到 `dist/vendor/opm/`。
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
- Renderer 隔離 backend；WebGPU 使用 WGSL，WebGL2 使用 GLSL。P06 完成初始化失敗的三級 fallback，強制 backend 不切換；目前預設 `recoverGraphics:true` 對 runtime loss 重建同 backend，renderer-owned handles 失效、復原失敗或明確關閉 recovery 才走 fatal。
- 遊戲邏輯以 `graphics.capabilities` 判斷功能；WebGL2 使用 GLSL ES，Canvas2D 只支援 2D 並回報 `threeD === false`。Capabilities 描述 backend 能力，不代表已有公開 custom shader／compute API。
- Scene 為 world/lifecycle 容器，不是 Entity；公開 Sprite 等物件 facade，ECS 為內核。Asset cache 與 backend GPU resource 分離；同 Scene 的 3D 先作 depth-test，再以 z-order 疊加 2D。
- Audio 使用未修改的官方 OPM.js v1.11.1（tag `v1.11.1`）DSP／worklet；voice 內部正規化為 v7，公開 `OPMVoice` 保留 `version: 1` 契約。上游可選聲部數，但 XYZ.js 仍以八個隔離 OPM instances 管理八個 slot（含 release），只搶最舊 SFX，不切斷 BGM；每個 worklet 的 256-event queue 以 bounded lookahead 控制。手勢 unlock 前不建立 AudioContext，代價是 unlock 後共八個 contexts／worklets。此 vendor 升級不新增引擎功能或擴大認證範圍。
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

各項實際證據與待驗事項記在 `ACCEPTANCE.md`；未經瀏覽器檢驗不得標為完成。原提交限制按歷史階段保留，本輪 P40／P41／P42 分階段提交授權以下節為準，永不推論 push／publish。

## 維護與發佈前待驗項

P01–P08 的功能驗收與獨立 commits 見 [ACCEPTANCE.md](ACCEPTANCE.md)。下列項目是已交付版本的驗證限制／發佈前工作，不是尚未實作的階段。

| 項目             | 已確認                                                                                   | 尚未確認或需決策                                                   |
| ---------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 瀏覽器與輸入     | managed Chromium 150；鍵盤／pointer 互動；gamepad snapshot 測試                          | Safari／Edge／Firefox、實體 gamepad                                |
| 視窗與 lifecycle | CSS content-box／DPR／resize、visibility／BFCache 事件模擬、實際 API device/context loss | 真實背景分頁／BFCache 往返矩陣、跨螢幕 DPR、真實 driver reset      |
| 效能             | 1,000 Sprite WebGPU direct，約 60fps；CPU submit 平均 0.6358ms                           | GPU timestamps／GC、其他硬體與 auto presentation copy 的效能比較   |
| 封裝與授權       | Node 26／pnpm 12.6.0、tarball JS／TS、無 bundler ESM 消費端                              | 根套件授權 Apache-2.0（所有者已授權）；未 npm publish，不自動 push |

## 交付前自檢

- [x] 已完成 P01–P08 範圍；統一公開入口、ESM 相對路徑與 `.d.ts` 契約維持一致。
- [x] build、typecheck、test、lint、format:check 已執行；結果記於 `ACCEPTANCE.md`。
- [x] 真實 Chromium 開啟六個範例，確認 showcase 圖形＋音訊及 loss 錯誤分支；其他瀏覽器尚未驗證。
- [x] 六件文件區分現在／未來功能，未留臨時測試檔或公開測試掛鉤。
- 提交規則：P01–P39 當時規則保留為歷史紀錄；本輪只授權主代理依 P40／P41／P42 分階段提交，無 push／publish／version change。

開始執行。

## v1.0 後的實用性擴充

當時依使用者要求優先補足 Canvas 文字與 scene-local 模擬計時器，未跨入 Physics／3D Animation／Tilemap。新增 Text2D、SceneTimers／TimerHandle，整合 Pong 畫布計分、延遲發球與 pause／restart 操作。這是 Text2D 階段的歷史範圍；3D Animation 現已納入下列 P10，文字動畫仍非目標。此輪不重編 P01–P08、不重寫原驗收、不自動發佈新版本；驗證見 ACCEPTANCE 最新紀錄。

## three.js 參考擴充：P09–P12（歷史驗收與當時範圍）

參考 [three.js](https://github.com/mrdoob/three.js/) 的場景、相機、互動、模型與渲染能力，以 XYZ.js 正式架構實作，不加入 three.js runtime dependency，不改寫 P01–P08 歷史驗收。

| 階段                              | 契約與驗收目標                                                                                                                                                                                                                          |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P09 — Scene & Interaction         | Object3D／Group 父子變換與可見性、ownership／cycle 防護；可替換透視／正交相機、lookAt、OrbitControls 旋轉／平移／縮放與清理；Raycaster 按世界距離排序精確三角形交點，涵蓋階層與 instance。                                              |
| P10 — Models & Animation          | glTF 2.0 JSON／GLB、外部與內嵌 buffer／圖片、節點／材質／skin；有界解析、abort 與失敗清理。translation／rotation／scale 的 STEP／LINEAR／CUBICSPLINE、Scene 模擬時間與骨骼變形。未支援的必要 extension／primitive／morph 動畫明確拒絕。 |
| P11 — Materials & Lighting        | Metallic-roughness PBR、base／normal／metallic-roughness／occlusion／emissive maps、點光源／聚光燈；可調方向光 shadow map、cast／receive 與 PCF。保留原 TextureMaterial 光照外觀；不含 point／spot shadow 或環境 IBL。                  |
| P12 — Instancing & Postprocessing | 共用幾何的 GPU indexed instancing 與各 instance 變換／normal；3D HDR offscreen→exposure／ACES／bloom→2D overlay，包含 resize／disable／destroy 資源生命週期。WebGL2 缺少 HDR attachment extension 時明確報錯。                          |

P09–P12 已在 managed Chromium 的 WebGPU／WebGL2 正式 Game 路徑完成限定支援 profile 的整合驗收；既有六個範例、loss／cleanup 與 build／typecheck／test／lint／format:check 回歸通過，25 檔／150 測試。分階段具體證據見 [ACCEPTANCE](ACCEPTANCE.md#p09p12-整合驗收2026-09-30限定已測環境)，不表示完整 three.js／glTF extensions 相容或其他瀏覽器認證。Canvas2D 維持 2D-only。套件仍 1.1.0，既有 release 不變，版本／發佈由所有者決定；不自動 commit／publish／push。

## Excalibur 參考擴充：P13–P20（歷史 profiles／共用整合驗收）

2026-09-30 使用者批准以下八階段；P13–P20 明確profile與正式rootconsumer限定 Chromium 驗收，P19包括renderer pixels／實際三backend Game handoff；最後frozeninstall／build／typecheck／37files252tests／lint／format與packed ES2022consumer通過。沿用既有 facade／內部 ECS，不另建 Actor／Engine，不引入 Excalibur source／assets／dependency，不改 OPM vendor；套件仍1.1.0，不自動版本／授權／發佈／commit。

| 階段                             | 明確支援 profile／驗收硬指標（P13–P20／共用整合已限定驗收）                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P13 — 2D Graphics & Hierarchy    | Group2D 父子變換與 inherited visibility／opacity／tint／z、Scene ownership；Sprite source regions／SpriteSheet、FrameAnimation loop／pingpong／freeze／hide、SpriteFont／SpriteText、NineSlice stretch／tile／tile-fit、ScreenElement HUD。Sprite width／height 為 source 自然尺寸，縮放使用 scale；不增 displayWidth／displayHeight。三 backend 實際 atlas／動畫／字形／面板／HUD pixels 與生命周期驗證。                                                                             |
| P14 — Gameplay Interaction       | native CustomEvent 生命週期；Actions sequence／parallel／repeat／cancel 與 linear／quad／cubic／sine／bounceOut easing；多 pointer target-only routing／capture／drag；Camera follow／deadZone／bounds／move／zoom／seeded shake。實際互動、時間邊界與重入清理，picking 對齊最近已呈現的 camera。                                                                                                                                                                                      |
| P15 — Physics & Triggers         | discrete fixed-step、真實 linear／angular iterative impulses；circle／box／嚴格 convex polygon、static／dynamic、sensor／Trigger2D、reciprocal category／mask、shape-accurate queries／contacts。Dynamic 僅 world-space root；static 可階層化，circle 要求均勻絕對 world scale。驗證質量／反彈／摩擦／偏心 angular response／靜止接觸；無 CCD／joints／sleep／concave／edge／3D physics，明示高速 tunneling 限制。                                                                     |
| P16 — Tilemaps                   | Orthogonal TileMap／IsometricMap、atlas children pooling、變換後座標／elevation picking／depth、保守 viewport culling、solid box／diamond／custom convex colliders 與即時 tile edits；實際渲染與 P15 碰撞。無 editor format importer／hex／staggered／navigation。                                                                                                                                                                                                                     |
| P17 — Particles                  | CPU pooled Sprite particles、seeded point／rectangle／circle nozzle、fractional rate／burst、lifetime／velocity／acceleration／size／color、bounded capacity；local 隨 emitter，world 固定出生 world transform。驗證 pause／stop／clear／destroy 與三 backend pixels；無 GPU particles。                                                                                                                                                                                               |
| P18 — Preload & Sample Audio     | bounded task-count PreloadBatch progress／failure／abort／Scene prepare；native PCM SampleAudioAsset／SamplePlayback alongside OPM，重用第一個已 unlock context，不建第九個。Preunlock sample fetch-only、play 拒絕；實際 decode／analyser／pause／resume／seek／loop／rate／volume／scheduled start／cleanup。Game pause 不自動暫停音訊，支援瀏覽器原生 codec，不新增 decoder。                                                                                                       |
| P19 — Scene Transitions          | fade／crossfade／slide為wholeframe最後合成；prepare／ownedcapture後publish／oldsyncdestroy、onlyincoming simulate。三backendrenderer pixels及actualGame handoff／pause-pendingPromise／resizecapture／complete／normalizedendpoint已驗；追加三backend真native capture cancellation／async version supersession／listener reentry／held-capture destroy已驗，failure另見scopedtests。Initial／duration0atomic；captures至complete／cancel／explicitdestroy／loss／rendererdestroy釋放。 |
| P20 — Native 2D Materials & Post | 每 Sprite native WGSL／GLSL Material2D 與 ordered PostProcessor2D；transparent 2D world＋HUD→ping-pong→疊到 unchanged 3D／P12→P19 全 frame transition。65536 chars／language、16 floats、premultiplied ABI／top-left sampleInput。Prepared pipeline／program＋uniforms 跨 resize／disable 保留，mutable attachments 釋放；descriptor destroy 立即釋該entry，loss／destroy全部釋放。Canvas2D 明確 UnsupportedGraphicsError，無 transpiler／Shader Graph／任意 shader resources。        |

P15 的「無 CCD／joints／sleep／concave」為當時限制，P31現有bounded static-target translation CCD／五 joints／sleep／static concave／chains；P42另批准3D colliders／queries／character／dynamic bodies與navigation／pathfinding。P13的無layout widgets由P41擴充；其餘未批准non-goals保持。

共同硬門檻：P13–P19 經正式 Game→Renderer 在 WebGPU／WebGL2／Canvas2D 做 browser smoke；P20 在 WebGPU／WebGL2 真正 native shader 執行並驗 Canvas2D unsupported。Behavior／boundary tests 與整合工具鏈由實際結果補記，不以 exports／mock echoes／debug geometry 代替畫面或物理／音訊證據。歷史日期與 25 檔／150 測試不重寫成新階段結果。

P13當時core build／typecheck、4檔／21targeted、renderer4／primitives4（重疊不加總）與三backendpixels／formalexamplescope保留。Sprite.source fractional／SpriteSheet integer；本輪最後fullsuite另記37檔／252tests，不改歷史150，不擴為crossbrowser／performance／fullframeparity。

P18 已有 Scene.preload／Game.loading 真正 Game integration：失敗／取消保留舊Scene、supersession loading ownership、pause／destroy／unique GLTF task cleanup，修正後4檔／35 scoped tests、12個owned files format通過，ES2022 runtime未使用Promise.withResolvers；原module 4檔／33紀錄保留不加總。Native PCM＋OPM、progress／resources於Chromium驗證，analyser不等於聽見聲音，非full-suite／跨browser pass。

P14 實際 Canvas native transformed atlas／HUD drag、held-pointer pause cancel、actions pause／resume／camera pixel proof與remove／readd next-frame guards通過；4檔／27 scoped tests、最新pointer單檔／7與actions follow-up2檔／18各別記錄，不當suite加總，ES2022禁用Promise.withResolvers亦跑通。P20 GPU／GL native uniform／ordered post／3D HDR不變／20次resize-disable-reenable與零tracked native teardown通過；2檔／7 graphics/material tests。P19 renderer三backend pixels／Canvas96fractionalcases，actual三backendGame crossfade／fade／pause-pendingPromise／resize保capture／old同步destroy／completion與asymptoticeasing final1通過，初始4檔／30scopedtests；追加actual三backend presented-slide cancel／async nativecapture supersession／synchronous listenerreentry／held-capture destroy、12nativecaptures全釋放／errors=[]。Destroy立即cleanup，受控capture尚未return時不宣稱Promise已reject。

P15–P17正式source-Vite Game→Scene→forced Canvas／GL／GPU proof：48 pixel assertions／21 live screenshots／0errors，circle-floor rest y≈146.00568、orthomap support≈87.00585、angular contact／trigger2enter2exit／iso polygon，solid edit ray1→0／fall121.69–126.51，local／world particles move／new birth／tint／bounded12slots／start-stop-age／pause／owned teardown。3檔／40 tests及owned format通過，暫時harness已移除；GPU COPY_SRC僅test readback instrumentation、非renderer更動。其他browser／dist／新performance未驗。

正式gameplay2d rootconsumer三backend全部P13–P20控制／真OPM-PCM-PNG3resourcebatch／eight-context nativeaudio／GPU-GLnativeeffects與Canvasexplicitreject／pause-cancel-switch／teardown已驗。最後完整工具鏈與325-entry packconsumer proof見ACCEPTANCE；另有真正archive-extracted／plain-static-HTTP三backend Game actions pixels／native material-or-Canvasreject／trusted native PCM proof，不把此限定consumer證據擴成整個source-Vite gameplay2d的dist-browser重驗。

明確排除 upstream-main-only 2D lighting／serializer／pause plugin architecture、Tiled／Aseprite／LDtk／Sprite Fusion 等 plugin／editor importer、Excalibur drop-in parity；上列非目標不得拿來省略任何已批准 P13–P20 組件。逐階段證據／最終整合見 [ACCEPTANCE](ACCEPTANCE.md#p13p20-明確profile與整合驗收2026-09-30限定已測環境)；多語文件已依真實smoke／最後工具鏈更新。

## PixiJS 參考擴充：P21–P29（歷史批准範圍／限定環境實測）

2026-09-30 已批准以下明確 profiles；比較基準為官方 [PixiJS v8.21.0](https://github.com/pixijs/pixijs/releases/tag/v8.21.0)（2026-09-17 發佈，commit `ecd3797cf9b57766b045f3eea8388db9677744f8`），不是 dev/main 或外部 plugins。此節是實作契約；實際整合與觀察結果只記在 [ACCEPTANCE](ACCEPTANCE.md)，P13–P20 的 37 檔／252 tests 與當時日期、提交／推送事實不改寫成 P21–P29 證據。套件版本／授權不變，不新增 runtime dependency、不複製 Pixi source、不改 OPM vendor、不自動 commit／push／publish。

| 階段                                        | 已批准契約與待驗可觀察結果                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P21 — Shared Display & Affine               | 單一共用 render-command collector；pivot／skew、toLocal／toWorld／world bounds。三 backend 保持普通物件 global stable z、world→HUD、shear／reflection、mutable vector、Sprite 自然 width／height；驗 drag／P19 capture 與 singular inverse。                                                                                                                                        |
| P22 — Views, Atlas & Tiling                 | Immutable TextureView2D frame／orig／trim／0 或 90 度／resolution；bounded atlas acquisition／named animation；TilingSprite2D independent tile offset／scale／rotation、nearest／linear／roundPixels。三 backend 不 bleed 鄰 atlas frame，動畫 orig anchor 不跳，failure／abort 不釋 borrowed image。                                                                               |
| P23 — Retained Raster Graphics              | Shared immutable CPU paths／instructions，Canvas2D raster→正式 Texture；curves／arcs／polygon／holes、centered caps／joins／miter strokes、gradient／local pattern paint。三 backend 真 pixels、bounds／padding／latest-wins cleanup；明示 raster resolution／放大模糊，不是 GPU vector tessellation。                                                                              |
| P24 — Isolation & Render Targets            | Opt-in IsolatedGroup2D 一個 outer z slot；renderer-owned RenderTexture2D／renderToTexture／extractPixels／generateTexture／explicit cache invalidation；**CanvasTexture2D versioned update 必做**。三 backend 無 simulation advance／feedback／foreign owner，cache stale-until-update、CPU output independent、snapshot immutable。                                                |
| P25 — Masks, Filters & Blends               | 三 backend geometric／image alpha 或 red／inverse／nested masks，normal／add／multiply／screen／erase；erase 僅 transparent 2D，不改 3D／P12／P19。GPU／GL ordered Alpha／ColorMatrix／Blur／Noise／Displacement native filters；Canvas native Filter2D 明確 UnsupportedGraphicsError。Geometric holes 拒 picking；image mask 僅 transformed bounds，不宣稱 pixel-alpha picking。   |
| P26 — Native Mesh2D                         | GPU／GL validated positions／UV／indices、Plane2D／Rope2D／true homogeneous PerspectiveQuad2D、triangle picking／hierarchy／z。Degenerate／self-crossing quad atomic reject；Canvas visible Mesh2D 明確 unsupported，不切 backend、不加 software rasterizer。                                                                                                                       |
| P27 — Text & Typed Assets                   | Transactional styled Text2D wrap／align／spacing／stroke／shadow／resolution；proportional／kerning／multipage SpriteFont、bounded AngelCode text／JSON BMFont、owned browser FontFace、**bounded dynamic RGBA font atlas generation 必做**；manifest aliases／bundles→既有 PreloadBatch。Actual font readiness／metrics／supersession／cancel，preserve old Scene。                |
| P28 — Hierarchy Interaction & Accessibility | Default target-only P14／lifecycle 不變；opt-in capture→target→bubble、hit areas／children pruning／cursor／wheel／tap／upoutside／global observer；Game-owned semantic-only DOM focus／label／activation mirror。驗 mutation／reentry／two-pointer capture／masked geometry／trusted keyboard／teardown；不用 DOM 假畫面。                                                         |
| P29 — Particles, Preparation & Consumer     | **ParticleLayer2D fixed-capacity drop-new、versioned static setters／dynamic fields 與 prepareTextures native upload 必做**；重用 P17 simulation，explicit native unload 不 destroy CPU source；共用 conservative bounds culling／finite target budgets。正式 root consumer 三 backend＋真正 extracted minified pack／ES2022；整合 freeze 後一次完整工具鏈，只有實跑才補記 counts。 |

保留既有 Game→Scene→Renderer／facade／內部 ECS。普通 Group 不隔離、不改深度優先 ordering；只有明確 IsolatedGroup 有 compositing boundary。P20 native ABI／prepared lifetime、P19 whole-frame immutable capture／最後 transition stage 保持。各阶段须有真实 Game pixels／interaction／资源生命周期证据，不能用 exports／mock wiring 替代。

P21–P29 已整合並在單一環境（macOS arm64 managed headless Chromium，WebGPU adapter 可用）實測：三 backend 共用 2D command stream，WebGPU 原有 sprite-only pipeline 已改為與 WebGL2／Canvas2D 相同的 native command engine。逐項已驗與**未驗**（跨瀏覽器、真實 GPU／driver、效能、device loss 回復、部分邊界）以 ACCEPTANCE 為準，此處不宣稱完整 Pixi parity。

已批准的有限 profile **不是 full Pixi parity**。仍缺／排除：native vector triangulation、full SVG document／HTMLText、SDF／MSDF、live video／raw buffer／compressed／mipmapped texture sources與 anisotropy、advanced bundled blends 除上述五 modes、general RenderLayer、arbitrary vertex shader／resources／extension registry、independent shared Ticker／general automatic GC。P23 不含 inside／outside strokes、device pixel-line、world-continuous pattern；P22 不含全部 GroupD8／mutable views／clampMargin compatibility；P28 不含 Pixi passive／auto／static／dynamic modes或 idle-pointer synthetic refresh。外部 pixi-filters／Spine／sound／UI plugins 另列，不能把 built-in opt-in 模組誤稱外部 plugin。

上述 compressed／mipmapped sources 是 **P21–P29 當時排除項**；P32 已有 bounded KTX2 base-level RGBA8 decode／external Draco與Basis接口，P42 另批准 native compressed／mip uploads。這不是 full codec／Pixi parity；其餘排除项保持，不可將接口誤稱內建 decoder 或將待驗 profile 誤稱已交付。

官方參考：[Graphics](https://pixijs.com/8.x/guides/components/scene-objects/graphics)、[Textures](https://pixijs.com/8.x/guides/components/textures)、[Filters](https://pixijs.com/8.x/guides/components/filters)、[Mesh](https://pixijs.com/8.x/guides/components/scene-objects/mesh)、[Text](https://pixijs.com/8.x/guides/components/scene-objects/text)、[Events](https://pixijs.com/8.x/guides/components/events)、[Accessibility](https://pixijs.com/8.x/guides/components/accessibility)。Rolling guide 有 drift：stable 已有 [CanvasRenderer](https://github.com/pixijs/pixijs/blob/v8.21.0/src/rendering/renderers/canvas/CanvasRenderer.ts)；[GCSystem](https://github.com/pixijs/pixijs/blob/v8.21.0/src/rendering/renderers/shared/GCSystem.ts) 為毫秒式；[CanvasFilterSystem](https://github.com/pixijs/pixijs/blob/v8.21.0/src/filters/CanvasFilterSystem.ts) 可 CSS filter 且 unsupported warn/skip，XYZ 不照搬 silent skip。以 pinned stable source 為準，未實跑不宣稱跨 browser／performance／整 framebuffer parity。

## Weighted 3D transparency 整合（歷史批准與驗收）

延續工作區既有 OIT 實作：`scene.transparency = 'weighted'` 提供 WebGPU／WebGL2
加權透明近似，預設 sorted 不變；TextureMaterial 增加 alpha 貼圖／頂點色的
`transparent` opt-in，Sprite3D／Text3D 自動使用。保留 opaque transmission snapshot、
HDR／MSAA 與最後 2D overlay。不是精確透明排序或多層折射；限定驗證與限制記於
ACCEPTANCE；當時不自動 commit／push／publish的限制保留為歷史，這次 staged commits授權依下節、仍不授權push／publish。

## 已批准三輪：P40–P42 已限定驗收

使用者本輪批准三輪及第三輪全部選項；不更動既有版本、tags、release assets、歷史 counts／日期／授權事實。每輪完成正式路徑行為證據與整合檢查後，由主代理寫入 ACCEPTANCE 並分別提交；這張表不是完成宣告，也不授權 push／publish／version change。

| 階段                                         | 完整批准範圍                                                                                                                                                                                                                                                                                | 可觀察 gate                                                                                                                                                                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P40 — Rendering & Regression                 | GPU／GL 相鄰相容 2D commands batching；三 backend full render metrics／debug overlay；deep browser regression／CI；修復 current 多語文件與歷史邊界。                                                                                                                                        | 真 Game→Scene→Renderer pixels／ordering／material／isolation／mask／filter／capture／OIT 與 teardown；計數反映實際提交／upload／attachments，不用單色 readback 當完整證據；CI 設定不等於 CI 已執行。                                                  |
| P41 — Authoring & Device Flow                | UI layout／widgets／focus；keyboard／pointer／touch／gamepad cross-device action contexts；resident resource budget／warmup；typed factories 與正式 consumer。                                                                                                                              | 同一 canvas visual UI＋keyboard focus／pointer／gamepad activation，context precedence／release／pause；budget eviction／reprepare／borrowed ownership、typed root consumer與失敗原子性。                                                             |
| P42 — Playable Reference & Advanced Profiles | 完整可玩參考流程（載入→選單→遊玩→pause／settings→結果→restart／save-load／teardown）；GPU skinning、animated bounds、native compressed／mip textures、3D colliders／queries／character、dynamic rigid bodies、navigation／pathfinding、animation masks／additive／blend tree／IK 全數納入。 | 真 native GPU／GL render／shadow／picking 一致與 loss／resize／destroy；角色／body 接觸與 query／navigation 行為、動畫層／IK 邊界；例子可完成並重玩而不只展示 API。Backend／格式／solver 限制隨實作明記，不得無聲縮成 scaffold 或以舊 non-goal 排除。 |

P40 batching 只合併**相鄰且相容** commands，不以 texture sorting 改 ordinary global stable z／equal-z insertion order／world→HUD。Material、sampling、blend、render-target 與 isolation／mask／filter boundaries 保持語意，native WGSL／GLSL ABI、P19 immutable capture、PBR／HDR／MSAA／OIT stage 不變。

Metrics 共用 `FrameStats`：每幀 `drawCalls2D`、`instances2D`、`renderPasses2D`、`uploadBytes`，含 effect／composition commands 與實際 uploads；`renderTargetBytes` 是 live attachments resident bytes 估計，`peakRenderTargetBytes` 是 renderer lifetime peak，begin 不清除兩者。既有 `drawCalls`／`triangles`／`shadowDrawCalls` 維持 3D 定義。這是 CPU counters／estimates，不是 GPU timers、driver memory／GC 或新性能保證。P41 budget 不得把此 target estimate 假充所有 CPU／GPU resident resources。

Current 支援矩陣見 [README](README.md)、[TECHNICAL](docs/TECHNICAL.md)／[繁體中文](docs/TECHNICAL-zh.md)：P31 有限 CCD／joints／static concave、P32 decoder 接口、P34 ordered blending、P36b `COLOR_0`、P37 shadows、P38 probes／post、P39 material／weighted transparency 都不可再誤寫成不存在；新批准但未驗功能仍明確 pending。跨 browser／真硬體／driver、codec corpus、效能證明各自需要實測，不從既有 Chromium 結果外推。

P40 已在 Chromium 153.0.8010.12／macOS arm64 完成三 backend deep regression、逐範例 82/82 smoke 與完整工具鏈（68 files／543 tests）；CI 定義已接入但 hosted job 未執行。單一 Chromium 連跑整個 smoke 曾中途關閉，WebGPU loss injection、其他瀏覽器與新效能量測未驗；詳見 ACCEPTANCE，不能外推 P41／P42。

v1.9 CI 修正：隔離 Ubuntu 24.04 arm64／Chromium 153 已重現缺少 SharedImageBackingFactory；共用 Linux launcher 為 compositor 加入 `--enable-features=Vulkan`／`--use-vulkan=swiftshader` 後，required 三 backend deep regression 與四項 CI example smoke 通過。這不是 hosted Ubuntu x64 修正驗收，亦不新增 runtime fallback／放寬 assertions；當前證據與歷史失敗保留於 ACCEPTANCE。

P41 已在 Chromium 153 的三 backend built-root 正式路徑限定驗收，72 files／591 tests 與工具鏈通過，詳見 ACCEPTANCE；不認證真手把／觸控硬體或其他瀏覽器。正式 [authoring-lab](examples/authoring-lab/) 以 root API 使用 canvas UI／semantic focus／modal、contexts／virtual controls、leased textures／bounded warmup、typed content／save-load。公開使用與 bounded profiles 見 [USAGE](docs/USAGE-zh.md#21-p41-authoringdevice-flow)、[TECHNICAL](docs/TECHNICAL-zh.md#41-p41-authoringdevice-contracts)。UI context 只在 live semantic focus／modal 時啟用，pointer consumption 同幀 reconcile；modal trap／restore 不以 DOM visuals 取代 renderer。Context priority／最新 activation 消耗 physical sources 與 legacy actions，不改 raw polling；held activation／unblock 不形成新 press。

`resourceBudgets` 分 `decodedTextureBytes`／`nativeTextureBytes`／`nativeGeometryBytes`，LRU 只淘汰 idle／未 retain native allocations；CPU lease 與 native residency 各自管理，legacy loadTexture pin 到 unload／destroy。排除 caller bitmaps／derivedCanvas／attachments／scratch／driver／pipelines，Canvas native residency 為零。Warmup 以資源 dependency snapshot 按 RAF chunks 準備；保護舊 scene，合併預算不足拒絕 candidate，不損舊 frame；candidate retain 到 scene 結束。單項可超時，資源變動不自動追蹤，previous-scene prelude 不計 candidate progress。Factories 使用 explicit parser／services、fresh detached owned subtree；await 前 context.own，有限 version-1 JSON graph preflight／明示 aliases，不反射／eval／自動接管 borrowed resources／3D serializer。

P42 全批准 scope 已整合並在 Chromium 153／macOS arm64 限定驗收：GPU skin palettes／animated bounds、native RGBA／compressed supplied mips；primitive 3D colliders／queries／capsule movement／linear-angular rigid dynamics；finite authored grid／graph A* 與 character follower；animation mask／reference-relative additive／1D-2D blend trees／two-bone IK。正式 [Beacon Run](examples/beacon-run/) 在 forced GPU／GL 走完 loading→sound-unlock 或 muted→play→pause／settings→win／lose→save-load／restart→destroy，不是 API gallery。當時完整工具鏈為 79 files／678 tests；native pixel oracle／real loss replay、實際流程與未驗限制見 ACCEPTANCE。當時 feature 階段不 push／publish／改版本；其後另獲 v1.8 推送與 GitHub release 授權。

## 本輪完整批准：P43–P57 production closure

使用者批准前次分析的全部缺口並要求**逐功能提交**。下列每項須完成正式架構實作、行為回歸、實際 runtime smoke 與文件後，由整合主代理建立各自 `[Pxx]` commit；不授權 push／publish／改版本。所有 browser 驗證只用自有 headless browser。原 P01–P42 counts／日期與歷史限制保持原樣，不把新增能力追記成當時已完成。

| 階段 | 完整功能                                                        | 可觀察驗收                                                                                                                            |
| ---- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| P43  | 幀率無關持續力、統一 fixed gameplay、presentation interpolation | 30／60／120／144／240 Hz 相同力 impulse；fixed callback 在 physics 前；渲染插值不污染模擬與 queries；pause／catch-up／clear           |
| P44  | WebGPU regression 根因修正與 release gate                       | 保留 tint／opacity pixels oracle；精確 native frame readback／loss 生命週期；發佈前完整 browser gate                                  |
| P45  | 3D broadphase 與共用空間索引                                    | exact collision／query 結果不變、候選縮減、mutable transforms／removal／filters                                                       |
| P46  | 有預算、可恢復、可取消 navigation jobs                          | concurrent grid／graph 最佳路徑與同步一致；有限 expansions／cancel／revision invalidation                                             |
| P47  | 動態連線、clearance、follower replan                            | 修改阻擋路線後實際找到並執行替代路徑；無 stale route／無同步無預算重算                                                                |
| P48  | 混合 workload 與 lifecycle soak                                 | 分開 RAF／CPU simulation／submit／load hitches／cache estimates；bounded traces／destroy cleanup                                      |
| P49  | 3D／動態 content round-trip                                     | factories 重建 stable-ID topology／prefab children／parents／references 後還原 pose／body／custom state；失敗 candidate 清理          |
| P50  | 可重現 asset recipe 與 consumer deploy                          | version-pinned profile preflight／實際轉換／manifest／checksums；pack 解壓 browser consumer／vendor 路徑                              |
| P51  | UITextInput／原生 IME                                           | canvas visuals、native selection／composition／keyboard editing、focus／modal／contexts／cleanup                                      |
| P52  | ScrollView／focus reveal／virtual list                          | viewport clipping／wheel／drag／bounds、鍵盤焦點捲入、bounded keyed row reuse 與 teardown                                             |
| P53  | 靜態 triangle-mesh collider／BVH                                | 真 triangle narrowphase／ray／sweep／rigid contacts／character；sidedness／scale／ownership                                           |
| P54  | compound collider                                               | child-local transforms／gap queries／contacts／combined inertia，不以外框假碰撞                                                       |
| P55  | 3D translation CCD                                              | 真高速 primitive body 對 static primitive／mesh／compound 不 tunneling；filters／contacts／rebound；rotation／dynamic-pair scope 明示 |
| P56  | animation root motion                                           | translation／rotation delta、loop／reverse／ping-pong／seek／blending／pause，能交由 controller／physics 消費                         |
| P57  | explicit animation retargeting                                  | 不同 bind orientation／比例的 target pose、原 interpolation／source ownership／transactional validation                               |

此表列出本輪批准的契約；P43–P57 已在 macOS arm64／自有 headless Chromium 完成限定驗收與逐功能提交，完整工具鏈為 93 files／780 tests，gallery smoke 89/89，三 backend mixed soak 各至少 60 秒。每項實際證據與未驗限制見 [ACCEPTANCE](ACCEPTANCE.md#p43p57-本輪完整整合驗證限定本機環境)；套件維持 1.8.0，不 push／publish／改 tag。仍不擴成 editor／networking／native desktop，也不從本機單一 Chromium 推論 hosted Ubuntu／跨 browser／真 driver 認證。

## 本輪批准：P58–P70 production usability

使用者於 v1.9 發佈後批准全部實務缺口補強，並於整合驗證後授權分功能提交。以下是本輪實作與驗收契約，不是完整平台認證宣告；套件維持 1.9.0，依 P58–P70 分別建立 commit，不 push／publish，不改 vendor 或歷史 tags。先前各輪日期、counts 與平台限制保留，新增證據另記 ACCEPTANCE。

| 階段 | 完整範圍                                                              | 可觀察 gate                                                                                                                                                  |
| ---- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P58  | Backend 延遲載入、Scene 未使用子系統延遲初始化、實際 2D consumer 成本 | 真 Canvas2D startup 不載 GPU chunks；普通 Sprite 不建立 physics／3D services；入口與完整 chunks 分開量測，既有 auto／recovery 保持                           |
| P59  | Firefox／WebKit 正式路徑、行動與真機驗證流程                          | 實際 browser/version、pixels／UI／audio unlock／storage／lifecycle／cleanup；WebKit 不冒称 Safari、emulation 不冒稱真機，缺少硬體明列                        |
| P60  | Pinned 外部資產工具、語意 mip、平台編碼、runtime bundle selection     | 真 codec／encoder 轉換、checksum/version preflight、gamma／normal mip、supported formats／明確 fallback、正式 Game 呈現                                      |
| P61  | 跨資產 acquisition／release scope                                     | 共享 borrower／最後 release、取消 rollback、texture/model/font/audio/custom ownership、scene teardown 不 destroy borrowed resources                          |
| P62  | 安全 candidate 存檔載入                                               | schema migration 後新 candidate 全還原再發布；後方 adapter 失敗保留舊 Scene，取消／supersession 清候選                                                       |
| P63  | GPU timing、heap／GC／process-memory、長 soak／低階 workload          | 真 native timing 或 explicit unsupported；CPU／GPU／cache／heap/process 分開，有限 traces、真長時間 churn 與 teardown                                        |
| P64  | 全 Scene 工作預算、3D index 刷新成本                                  | 全局 work/expansion cap；mutable transforms query 結果保持，unchanged leaves 不重算/refit，不能用 stale bounds 換速度                                        |
| P65  | 角色移動平台承接、姿態切換                                            | translation／rotation carry 走真 sweep，jump／remove detach；低頂 crouch、blocked stand 原子保留姿態                                                         |
| P66  | 3D joints／constraints                                                | distance/spring suspension、hinge axis/limit/motor、ball/socket angular limits 與 articulated chain 的真 linear/angular response、ownership/cleanup          |
| P67  | Dynamic-pair／rotational CCD                                          | 高速相向 moving bodies、旋轉薄物體與 primitive／compound／static mesh 真碰撞、filters/events/rebound；不 clamp 速度或假厚牆                                  |
| P68  | Collision／geometry navigation bake、共用導航排程                     | walkable geometry 產 grid／surface graph、clearance/slope/step、edit/rebake/cancel、全局 expansions cap、真 character 路徑                                   |
| P69  | 國際化文字視覺定位                                                    | explicit direction/locale、bidi discontiguous selections、grapheme／ZWJ／combining boundaries、CJK font readiness/fallback、native editing 與 canvas visuals |
| P70  | Audio bus effects／ducking／automation、場景聲源                      | 官方 OPM/sample/stream 的 native graph、EQ/compressor/convolution、overlap duck envelopes、context-time automation、world-transform follow／cleanup          |

維持統一 root facade、零新增 runtime dependencies、正式 Game／Scene 路徑與明確 unsupported errors。Visual Editor、Networking、Shader Graph、GUI Inspector 與 Native Desktop 仍非目標。跨瀏覽器自動化、行動 emulation、實際 Safari／iOS／Android 硬體、OS IME、實體 gamepad 與真 driver reset 分別記錄；不可用前者替代後者驗收。

### 2026-10-02 實作狀態（unreleased working tree）

P58–P70 的批准功能已實作並有逐項限定 runtime 證據，見 [本輪驗收紀錄](ACCEPTANCE.md#p58p70-2026-10-02-unreleased-working-tree逐階段證據)。以下 working-tree 驗證早於本輪分功能提交；本輪 commit 依使用者後續授權建立，不表示完整平台認證或 v1.9 已發佈功能，metadata 仍為 1.9.0，沒有 push／publish／version change。

- P58：backend／Scene services 延遲初始化與實際 startup 成本；P60：官方 pinned Basis／Draco、語意 mips／平台格式／fallback；P61–P62：共享 acquisition scope、取消 rollback 與完整還原後的新 candidate 發布，均已有正式 consumer 證據。
- P64–P68：Scene aggregate quota、changed-only spatial geometry refresh、moving support／crouch、3D joints、dynamic／angular CCD、collision bake 與共享導航 scheduler 已有實際物理／路徑證據。Spatial pose checks 仍 O(N)，bake 為 sampled topmost single layer，CCD exhaustion 保留 conservative prefix，不擴稱 arbitrary navmesh／無界 CCD。
- P69 完整 RTL 可見段落已在八個適用 browser/backend 組合驗證；P70 Chromium／Firefox 八 context native effects／ducking／automation／world binding 通過，Firefox 缺 cancelAndHoldAtTime／listener AudioParams 的正式路徑已修正。Managed WebKit serial audio 通過，但 concurrent stream.play／control-arrival 差異仍明列，不冒稱負載下穩定音訊認證。
- P59 三 engine deep regression 與全部 16 個適用 desktop／mobile-emulation backend 組合通過。Safari formal pairing blocked 且使用者明確選擇保留 Safari，不再操作該 session／OS；無 simulator／adb／實體 iOS／Android／gamepad／OS IME。Engine-free CDP probe 證明本 host 無 native freeze transition，不冒稱 OS background freeze 通過。
- P63 三 backend 120 秒 simulated-low-tier 與 isolated packed consumer／HMR-off 一小時 churn 均完成，native timing／heap／GC／RSS 與零 owned cleanup 分別記錄；WebGPU timestamp 全 invalid，不捏造 GPU duration。Hour snapshot 早於最終 Firefox audio patch；沒有真低階／VRAM／leak-free 認證。最終整合後三版 Node 的 typecheck／104 files／859 tests／build、九組 Node×browser 60 個 CLI stages，以及 Node 26 lint／format:check／tree-shaking 均已實測通過；hosted CI 未觸發。

### 英文範例、Node 22 與 CI 契約

- 根 `/index.html` 與 `/examples/` 共用一份 35-entry English catalog，新增 lightweight2d／resource-lifecycle／character-platforms／joints3d／ccd3d／navigation-bake／text-i18n／audio-effects 八個正式 root-facade consumers。範例 UI／說明／註解用英文，多語字典與文字內容僅為 localization／bidi 示範資料；不以 mock／第二套 engine 展示能力。
- Node 最低 major=22；遠端 fast-forward 保留 package `>=22.0.0`，固定 repository lint/test 工具鏈需至少 22.13.0。獨立資產 reproducibility recipe 仍 exact Node26.7.0 pin，不誤當全專案最低版本。README 中／英／日與雙語技術／使用文件同步。
- 參考 [OPM.js CI](https://github.com/YueyuHoshizora/OPM.js/blob/main/.github/workflows/ci.yml)，Node22／24／26 quality matrix 與 Ubuntu 三 Node×Chromium／Firefox／WebKit 九 browser jobs，保留 macOS WebKit／Node26 gate、native Chromium WebGPU 必要 gate與 Firefox PulseAudio。Local matrix 與 hosted CI 分開記錄；本輪不 push／觸發外部 workflow。

### v1.10 hosted 發佈結果

使用者授權後 main 與 v1.10 tag 推送成功；Release run [36966119517](https://github.com/YueyuHoshizora/XYZ.js/actions/runs/36966119517) 的 14 jobs 全數通過，包括三 Node quality、Ubuntu 九組 browser matrix、macOS WebKit 與 release。GitHub v1.10 正式附件為 xyz.js-1.10.0.tgz／SHA256SUMS，下載 checksum 通過且與已驗本機 consumer 封裝逐位元組相同。此前 hosted 待驗／未觸發敘述保留為當時紀錄；不擴稱實機硬體／Safari／driver 或音訊 stress 認證，不做 npm publish、不移動歷史 tags。

## 本輪批准：P71–P87 production integration（working-tree 實作與限定驗證）

使用者於 v1.10 發佈後的缺口分析回覆「全做吧」，批准下列核心補強與選配能力。沿正式 Game／Scene／root facade 增量實作，套件維持 1.10.0；本輪不自動 commit／push／tag／publish。此表保留需求與 gate；新增實作與 native 證據見 ACCEPTANCE，不覆寫歷史版本的 dates／counts／限制，也不把實機 blocked 標成完成。

| 階段 | 完整範圍                                                                                       | 可觀察 gate                                                                                                                              |
| ---- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| P71  | WebKit 並行 stream 與 audio automation 可靠性                                                  | 真 native 併發播放／效果／cancel 與 per-context clock；錯誤不得 suppression／silent retry；官方 OPM 不改                                 |
| P72  | 獨立 2D／3D starters 與安全生成器                                                              | 解壓套件 consumer，loading→menu／unlock→play／pause／settings→results／restart／persistent save→destroy；正式 production 部署含 vendor   |
| P73  | 現行 API／能力契約、版本相容性政策與升級指南                                                   | 現況與歷史分開；公開入口、ownership／timing／unsupported、版本差異與遷移步驟可查                                                         |
| P74  | 存檔 revision／排序、跨分頁協調、有效備份恢復與 autosave 狀態                                  | 舊寫不能覆新、真跨頁競寫；失敗可見、corrupt 原文保留、last-known-good 恢復與 migration／candidate 契約                                   |
| P75  | 實機與平台品質 gates                                                                           | 實體 mobile／gamepad／OS IME／audio／background／thermal／driver identity 與真實證據；設備不可得具名 blocked，不用 emulation 填 pass     |
| P76  | 2D kinematic／character／支撐與 dynamic/angular CCD                                            | 真可玩平台關卡；跨 render rate 落地／坡階／moving carry／jump detach；高速 dynamic pair／旋轉碰撞、filters／impulses／有限 budget        |
| P77  | Fixed-step animation locomotion                                                                | 獨立 mixer 接 root motion／character／gravity／jump／blocked movement；pause／seek／support、無 double advance／drift                    |
| P78  | 多層 sampled navigation bake                                                                   | 同 XZ 多樓面、合法階梯／顯式跨層 links、clearance／revision／cancel、共用 scheduler quota；不冒稱 polygon navmesh                        |
| P79  | Render visibility index、instance／morph culling、screen-size LOD／cross-fade、HLOD／occlusion | 保守可見集合、真 native 遮擋證據、shadow／picking 不失真、moving camera／occluder 不漏畫；量測前不宣稱性能提升                           |
| P80  | Per-mesh native 3D shader material                                                             | GPU／GL 真 vertex／surface、uniform／texture ABI；skin／instance／shadow／transparency／loss／cleanup 與明確 compile failure             |
| P81  | 世界分區 streaming                                                                             | 真 asset／physics／navigation 進退區、快速反向取消、atomic publication、shared leases、seams／budget／teardown                           |
| P82  | Native CPU worker jobs                                                                         | Trusted module、bounded queues／transfers、真 worker execution、abort／late result／destroy；主線程與結果成本分開                        |
| P83  | Tiled JSON 正式關卡匯入                                                                        | 有限 orthogonal maps、tilesets／layers／GID flags／object colliders、精確 unsupported；正式 package render／physics／ownership           |
| P84  | 大量局部光源與有效選光                                                                         | 16+ 局部燈真 coverage／attenuation、bounded selection／shadow atlas／統計；不只增加常數                                                  |
| P85  | GPU particles                                                                                  | GPU／GL 原生模擬與繪製、seed／rate／burst／space／capacity／pause／loss／cleanup；CPU 模擬不得冒稱 GPU                                   |
| P86  | WebGPU timing 根因與目標 workload                                                              | 真有效 native timing 或精確 capability 證據；代表性 2D／3D frame-time／hitch／memory 門檻，不混淆 RAF／CPU／GPU／VRAM                    |
| P87  | 可完成遊戲的 accessibility 流程                                                                | Keyboard／focus／modal／status announcement、text scale／contrast／reduced motion 與 canvas 同步；真輔具證據獨立，不用 DOM snapshot 認證 |

仍不做 Visual Editor／Visual Scripting／Shader Graph／Networking／GUI Inspector／Native Runtime／software rasterizer／Shader IR。本輪 P83 僅批准既有引擎的外部關卡格式匯入，P80 僅批准原生 shader 契約，不取消上述 non-goals。Safari preserve 維持：不得操作使用者 Safari／foreign drivers 或以未授權 OS 操作取得證據。實機與 driver-reset 驗收若缺獨立設備／明確安全授權，保留 blocker；其餘可實作與驗證工作不得因此縮減。

### 本輪實作狀態與交付範圍

P71–P74、P76–P87 的正式 runtime／consumer／工具／範例已接入既有架構；P75 提供實機 evidence gates 與 read-only host inventory。實際驗證包含三引擎 native 靜音 audio、獨立 2D／3D 安裝與部署、native 跨頁 save／恢復、可玩角色／多層路徑、GPU／GL 圖形與 cleanup、default emitted worker、Tiled 與完整鍵盤 accessibility。P86 的各 workload 門檻及失敗前後結果獨立記錄，不等於 universal FPS／low-tier／一小時認證。

45 個 example directories 均有直接啟動頁，根目錄與 `/examples/` 共用唯一 metadata catalog。靜態 site 建置產生 54 HTML entries，正式 HTTP smoke 實際檢查 212 條 renderer routes；3D-only 的 Canvas 路徑必須顯示 unsupported，而不是假裝提供 Canvas3D。部署整棵 `.vite/site/`，不可只搬 HTML 或遺漏 engine／workers／14 件官方 OPM vendor。

所有 browser 證據使用自行啟動的獨立 managed processes；音訊在播放前接 native zero-gain physical sinks，Chromium 另加 mute。使用者 Safari／shared sessions、實體發聲、OS／driver 修改未操作。Physical mobile／gamepad／OS IME／background-thermal／真輔具／driver-reset 仍因 owned 設備或安全授權不足而 blocked；可取得的正式工作不因此省略。官方 OPM upstream v1.1.0 重新下載曾回 404，只證明本機 canonical vendor 的逐位元組 identity，不冒稱獨立上游 attestation。

## 本輪批准：P88–P96 compatibility、interoperability 與 deployment

使用者於 v1.11 缺口分析後要求「全都做了吧」，並明確選擇維持 **1.x 相容**。
已發佈 tag 不移動；本輪不 push／tag／publish，不自動變更套件版本。
各階段完成實作與實際 gate 後依 AGENTS 分別建立 `[Pxx]` commit；
完成狀態與新證據另記 ACCEPTANCE，以下是批准範圍，不是驗收宣告。

| 階段 | 範圍                                                                                  | Gate                                                                                                                         |
| ---- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| P88  | Renderer 1.x source compatibility、公開出口與 consumer 相容 gate                      | v1.10 自訂 Renderer 編譯；缺少新增 capability 明確拒絕；保留已發佈 value/type exports                                        |
| P89  | CI integration：完整 site、native muted audio、production workload、packaged starters | Fresh archive 安裝／部署與真 gameplay；各 gate 自動執行、錯誤失敗、證據保留                                                  |
| P90  | glTF 多 UV、各材質 map 獨立 transform、八 skin influences                             | 真 UV0/UV1 fixture pixels、CPU/native deformation、預算／ownership／錯誤分支                                                 |
| P91  | Tiled infinite chunks、groups、image/parallax、animation、compressed data、templates  | 負座標／繼承與 runtime collider、pause／edit／cleanup；bounded decode／取消與明確 unsupported                                |
| P92  | 品質與裝置壓力 profiles                                                               | baseline/low/high 固定 workload、native/simulated 分開；CPU／RAF／GPU／memory 與 explicit operator gates                     |
| P93  | 大世界 navigation 與 polygon navmesh                                                  | 真 surface projection／corridor／clearance／多樓層／tile seam；revision／cancel／scheduler budgets；保留 sampled API         |
| P94  | Shadow 品質／靜態快取、visibility scalability、native extension 契約                  | GPU/GL 真 pixels 與 cache invalidation；mutable pose 正確；CPU 成本量測，不以配置數冒充 FPS                                  |
| P95  | 可重用 settings persistence 與 portable save                                          | reload／reset／bindings／migration；valid fresh candidate、invalid/conflict 不污染 live state；兩 starters 實際流程          |
| P96  | Opt-in offline 與 strict CSP deployment                                               | 真 installed production app offline reload、base-relative vendor/worker/worklet、versioned atomic cache update、CSP 正負案例 |

既定 non-goals 維持。Physical mobile／gamepad／OS IME／thermal／spoken AT／driver-reset
仍須 owned 設備與安全授權；工具可取得的工作全部完成，不以模擬證據填補 physical PASS。
OPM official vendor 維持 immutable，不能為 CSP／offline 改官方檔或新增私人 DSP patch。

### 本輪交付狀態

P88–P96 的可達正式實作已完成，依階段分開提交並保留 1.11.0；沒有 push／tag／publish。
三引擎 native browser、完整 deployed site、native zero-gain audio、fresh installed
2D／3D starter 的 gameplay／settings／offline update／rollback 已實際驗證；
詳細 scopes、失敗前後與證據見 ACCEPTANCE 的 P88–P96 紀錄。
品質 profiles 的 PASS 僅限明示 operator gate：high WebGPU 3D 未達 60 FPS，
短期 memory trends 不認證無 leak，CDP pressure 不認證 physical low-tier hardware。
前述實機／安全授權 blocker 保留；新 hosted CI job 僅完成設定，未冒稱本輪遠端已執行。

### v1.12.0 release gate 修正

原v1.12 tag保留為當時snapshot，hosted新增surface gate失敗，沒有附件。使用者後續要求英文SECURITY.md與site smoke並行；目前以四個獨立macOS／Metal site shards保留完整212 cases，release-surfaces另以相同host跑原baseline production workload與fresh starters。Linux既有三engine regression matrix仍保留，不將Metal結果宣稱為Linux效能修復；新v1.12.0 tag須等所有CI jobs通過。詳見 [ACCEPTANCE](ACCEPTANCE.md) 與 [SECURITY](SECURITY.md)。

v1.12.0 hosted四個site shards與原production benchmark已PASS，但portable-settings remap仍用350ms wall hold，且Linux concurrent audio有unchanged duck retarget邊界reference失敗；驗收保留原FAIL，不重跑／放寬threshold假冒修復。v1.12.1 patch使未變更single-target curve保持連續、仍處理new future boundaries與tau change；remap以一個HUD gameplay second驅動，exported checkpoint位移門檻不變。原tags不移動，新patch仍走全部CI gates。

## 本輪批准：P97–P103 工程保障與消費端工具

使用者在 v1.12.1 缺口評估後要求「全部都做」。沿用 1.x 相容、零新增
runtime dependency 與既定 non-goals；當時不升版、不推送、不建立 tag 或發佈，後續 v1.12.2 授權見頁首。
各階段實作與實際驗證完成後依 AGENTS 分開建立 `[Pxx]` commit。
以下是批准範圍，不是通過宣告；實際結果另記 ACCEPTANCE。

| 階段 | 範圍                         | 驗收指標                                                                                                                                                                               |
| ---- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P97  | 完整公開 API 相容性保障      | 已發佈宣告 baseline、nested signatures／constructor／options／return／implementor 契約、舊 consumer 編譯及 timing／ownership／events 行為；兼容新增通過、破壞變更拒絕                  |
| P98  | 可校準的效能回歸門檻         | Host／backend／quality provenance 綁定的 RAF／CPU／hitch gate；loading 與 steady 分開，dense physics／navigation replanning／大型可見及不可見場景保留語意驗證                          |
| P99  | 目前版本跨子系統長時間驗證   | 實際一小時整合 streaming／physics／navigation／pause／save-restore／scene transition／同 backend recovery 與恢復玩法；記錄版本 identity、leases／targets／audio／heap／errors／cleanup |
| P100 | 專案級資產工具與合法真實語料 | 安裝套件即可使用 authoring／preflight；整體 models／maps／atlases／fonts／references／deployment paths 檢查、檔案及位置診斷、固定來源與授權的真實資產                                  |
| P101 | 目前版本正式文件             | 現行 capability／API／support matrix 與歷史分開；可搜尋、具版本的公開 API reference；task-based ownership／abort／cleanup；中英日 README 與雙語操作／技術文件同步                      |
| P102 | 嚴格套件內容保障             | 明示 approved archive inventory，排除 caches／dev 污染；相同 build／toolchain 下 clean 與 disposable polluted workspace 的批准路徑及內容相同                                           |
| P103 | 實體平台資格流程與證據界線   | Owned device 的 iOS／Android／gamepad／OS IME／background／BFCache／thermal／spoken AT／driver recovery 可執行流程；identity／operator／artifact 驗證；不可得證據具名 BLOCKED          |

P103 不授權操作使用者 Safari／shared sessions、OS／driver 或實體發聲。
Managed WebKit、viewport／touch emulation、合成事件、CPU pressure 與人工 attestation
均不得冒稱獨立實體認證；缺 owned hardware／安全授權時，完成可達工具並保留 blocker。
P98 的量測不承諾 universal 60 FPS；P99 的 heap 趨勢及 tracked resources 不等於
全程序無 leak 或 driver VRAM 上限。既有 FAIL、歷史驗收與已發佈 tags 保留。

## 本輪批准：P104–P118 功能擴充

使用者在 v1.14 的缺口分析後要求「全部都實作」。以下是批准範圍與驗收指標，
不是完成宣告；實際結果另記 ACCEPTANCE。保持 1.x additive API、零新增 runtime
dependency、官方 OPM immutable vendor 與既定非目標。每階段驗收後獨立
`[Pxx]` commit；不推送、不移動 tag、不自動升版。npm 實際發佈仍須取得
帳號權限與明確外部操作確認；發佈準備與已 publish 不可混寫。

| 階段 | 範圍                        | 驗收指標                                                                                                   |
| ---- | --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| P104 | CJS／CDN／發佈準備          | 實際 extracted package 的 require／ESM consumers；完整 vendor／worker URL、型別、核准 inventory 不變質     |
| P105 | Texture atlas 打包          | 產物經既有 AtlasLoader 載入；trim／padding／extrusion／多頁 bounds、像素與 ownership                       |
| P106 | SDF／MSDF 字型              | 真正 distance fields／多通道邊緣，不以三份相同 SDF 冒充 MSDF；產生、載入與縮放繪製                         |
| P107 | Watch／incremental／HMR     | 依賴失效、實際增量 build、immutable generation publication；失敗保留舊代、取消與 teardown                  |
| P108 | Cutscene／Dialogue／Quest   | 模擬時間、分支／條件／選擇、seek／pause／cancel、validated save／restore 與 rewards 不重複                 |
| P109 | Crowd／steering             | 真 reciprocal avoidance、bounded work／速度、角色 sweep 執行路徑；交會／障礙不以 teleport 假避碰           |
| P110 | 3D debug／RNG／pool         | 真 collider／contact／joint visuals；seed／state 重現；容量／租借／reset／destroy invariants               |
| P111 | Pinch／rotate／swipe        | 先核对既有 Gestures API；真 pointer pairing／cancel／blur／teardown，不重建第二套 input                    |
| P112 | 2D 光照／normal maps        | GPU／GL 真 albedo-normal-light shading；變換／HUD space／批次／loss；Canvas 支援界線明示                   |
| P113 | Video／WebCodecs textures   | 2D／3D 真逐幀像素、播放／暫停／frame ownership；decode cancellation／error／teardown                       |
| P114 | Bounded compute             | 真 WGSL dispatch／typed buffer readback；準備／limits／loss／destroy；GL／Canvas 明示 unsupported          |
| P115 | Render graph／custom pass   | 真 native GPU／GL 多輸入／target passes、DAG／feedback validation、依賴與資源清理                          |
| P116 | TAA／SSR／probes            | 真 jitter／history／disocclusion、depth ray march、六面 scene capture／空間 blending；resize／loss reset   |
| P117 | Vehicle／ragdoll／soft body | 真 suspension／輪胎 forces／constraints／deformation／contacts；重用 physics／animation ownership          |
| P118 | Text3D／visibility          | 多行／文字更新 transaction；先核對 P79／P94 的 instance／morph culling，僅補真正缺口且不漏 shadow／picking |

Physical mobile／gamepad／OS IME／audible audio／AT／driver 等資格仍需 owned fixtures，
不得以新增程式碼或 emulation 消除現有 BLOCKED。已有 raw CDN ESM 消費能力、
Gestures 與 visibility profiles 的實作須先核對；前次分析的未查到不視為不存在證據。

### P104–P118 working-tree 交付與實測範圍

本輪正式 source／公開入口／generated distribution 與 consumer 範例已整合，
逐階段的實際功能與證據見 [ACCEPTANCE](ACCEPTANCE.md#p104p118-本輪實作與限定驗證2026-10-05未發佈)。
交付當時沒有 stage／commit／push／tag／npm publish，metadata 為 1.14.0；
使用者後續授權後已建立 P104–P118 十五個功能提交及獨立共用整合提交，升版為 1.16.0；發佈結果另記 ACCEPTANCE。
本機 native automation 的能力與 physical qualification 分開；
npm 身分／名稱權限與明確外部操作確認仍 BLOCKED。

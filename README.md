# XYZ.js

Browser-native TypeScript game engine. Package metadata is **1.12.2**, licensed under **Apache-2.0** (see [LICENSE](LICENSE)); npm is unpublished. Historical evidence and physical-device limitations remain in [ACCEPTANCE](ACCEPTANCE.md); historical release assets up to v1.5 retain their original `UNLICENSED` metadata.

**Current / 目前 / 現在:** [v1.12.2 normative capability, API and support contracts](docs/CURRENT.md). Generate the searchable versioned public API with `pnpm docs:api`; `pnpm build:site` includes it at `api/1.12.2/`, with the landing page at `docs/`. The following release/stage narratives are historical; their dates, counts and version strings do not redefine current support.

GitHub **v1.10** uses `xyz.js-1.10.0.tgz` and `SHA256SUMS`, published only after the shared CI gates pass. It adds P58–P70 lazy startup, pinned semantic assets, scoped resource ownership, safe save-candidate publication, observability, shared navigation budgets, moving-platform/crouch controllers, 3D joints, dynamic/angular CCD, collision-derived navigation, international text geometry and native audio effects/automation/world bindings, plus eight English demos and Node 22/24/26 CI. Support remains limited to documented profiles. Earlier releases remain unchanged; v1.9 introduced P43–P57 and v1.8 introduced P40–P42/Beacon Run. Deploy the complete `dist/` tree, including `dist/vendor/opm/`.

GitHub **v1.11 / 1.11.0** packages P71–P87 and all 45 direct-launch examples. The tag-triggered Release workflow verifies the shared CI gates before publishing `xyz.js-1.11.0.tgz` and `SHA256SUMS`. Existing physical-device, audible-output, Safari, assistive-technology and driver-reset limitations remain unchanged. 本次發佈不擴大驗收範圍；今回の公開は検証範囲を拡張しません。

GitHub **v1.12.1 / package 1.12.1** packages P88–P96 while retaining 1.x compatibility. The tag-triggered workflow verifies CI before publishing `xyz.js-1.12.1.tgz` and `SHA256SUMS`. The failed `v1.12` and `v1.12.0` tags remain unchanged; corrected verification uses the new patch tag. 本次發佈納入 P88–P96 與 release-gate 修正，不擴大實機或效能認證；今回の公開は P88–P96 と release-gate 修正を含み、実機・性能の検証範囲を拡張しません。

GitHub **v1.12.2 / package 1.12.2** includes the committed P97–P103 API compatibility assurance against the published v1.12.1 baseline, calibrated performance gates, integrated long-run tooling, installed asset tools, current/versioned API documentation, strict archive inventory and physical-qualification evidence tools, plus official OPM.js **1.8.0** (tag `v1.8`). The user authorizes pushing `main` and the new `v1.12.2` tag for the existing CI-gated Release workflow to publish `xyz.js-1.12.2.tgz` and `SHA256SUMS`; no npm publish. Historical releases and failed tags remain unchanged. Physical qualification remains **BLOCKED** where owned hardware or authorization is unavailable; this release adds no physical-device, Safari, audible-output, assistive-technology or driver-reset certification. 本次發佈不擴大實機認證；今回の公開は実機の検証範囲を拡張しません。

文件導覽／Documentation／資料：[計畫與範圍](PLAN.md) · [驗收與 commits](ACCEPTANCE.md) · [設計](DESIGN.md) · 使用說明 [English](docs/USAGE.md)／[繁體中文](docs/USAGE-zh.md) · 技術參考 [English](docs/TECHNICAL.md)／[繁體中文](docs/TECHNICAL-zh.md) · [Security policy](SECURITY.md) · [執行指引](AGENTS.md) · [工作約定](CLAUDE.md)。

## 繁體中文

### 目前可用

目前規範以 [v1.12.2 契約](docs/CURRENT.md)及生成的 root API 為準；`pnpm docs:api` 提供搜尋，`build:site` 納入完整靜態網站。以下舊版／階段描述保留歷史，managed WebKit 不是 Safari、模擬輸入不是實體裝置驗收。

引擎提供 Game／Scene／ECS、2D／3D Math、Texture／Sprite、Camera／Input 與 Mesh 深度／光照管線。`auto` 依 WebGPU→WebGL2→Canvas2D 初始化降級；強制 backend 失敗不切換。以 `game.graphics.capabilities.threeD` 判斷 3D 支援，Canvas2D 只有 2D。WebGPU 需要安全來源（localhost 可用）。Audio 使用官方 OPM.js v1.8.0（tag `v1.8`）；在使用者手勢中呼叫 `await game.audio.unlock()`。上游雖可選聲部數，引擎仍維持八個隔離 slot；此 vendor 升級不新增引擎功能或擴大認證範圍。

新增 3D：Object3D／Group 階層、透視／正交相機與 lookAt、OrbitControls、精確 Raycaster、glTF 2.0／GLB、關鍵幀與 native GPU skin palette（lazy exact CPU queries／保守 animated bounds）、PBR／點光源／聚光燈、方向光 PCF 陰影、InstancedMesh，以及 HDR exposure／ACES／bloom（2D overlay 不受影響）。P42 的 bounded physics／navigation／animation profiles 與 Beacon Run 已限定 Chromium 驗收。API 參考 three.js，非 drop-in replacement／全 addons；無新 runtime dependency。詳細限制見雙語技術參考。

P13 新增既有 GameObject 的 2D 階層／Group2D、atlas Sprite source／SpriteSheet、FrameAnimation、SpriteFont／SpriteText、NineSlice 與 ScreenElement HUD，已驗三 backend 正式路徑。Sprite width／height 是自然 source 尺寸，縮放用 scale；Sprite.source 可為 fractional pixels，SpriteSheet frames 為 integer。`/examples/gameplay2d/` 展示動畫／字形／面板／HUD。

P18 已完成限定 Chromium 驗收：PreloadBatch task-count progress、Scene.preload→initialize barrier／Game.loading、bounded text／JSON／binary、unique GLTFLoader.task 與 native PCM/WAV sample alongside OPM。Unlock 前只 fetch，decode／play 要手勢 unlock，重用第一個 OPM context（共八個，不建第九個）；Game pause 不自動暫停音訊。沒有跨瀏覽器／新效能或聽見喇叭聲聲明。

P14–P20 歷史驗收：target-only lifecycle／pointer／drag、Actions／CameraStrategies、discrete circle／box／convex physics、maps、CPU particles、native GPU／GL 2D effects 與三 backend whole-frame transitions；正式 playground／完整工具鏈為 37 檔／252 tests。這不是目前功能上限：P31 已加入有限 CCD、sleep、joints 與 static concave／chain。GPU particles／editor importer 仍不提供。Native Material2D／PostProcessor2D 需先 await prepare；Canvas2D 明確拒絕，prepared entries 跨 resize／disable 保留，mutable targets 釋放、owned captures 保留／scale。詳見雙語 guides。

P21–P29 已批准有限 PixiJS-inspired profiles 已整合為 source 並在單一環境（macOS arm64 managed headless Chromium，含 WebGPU adapter）實測：三 backend 共用 2D command stream、affine／atlas／raster paths／offscreen isolation／masks／blends／native filters-mesh／text-assets／opt-in interaction-accessibility／particles-preparation，正式範例 [examples/rendering2d](examples/rendering2d/index.html) 於三 backend 執行；Canvas native filters／visible mesh 明確拒絕。這**不是** full Pixi parity、跨瀏覽器／真實硬體／效能證明，也未納入 GitHub v1.2；驗證範圍與未驗項見 [ACCEPTANCE](ACCEPTANCE.md)，profiles 見 [PLAN](PLAN.md)。

本輪新增 fixed gameplay／時間加權 force 與 opt-in physics presentation；使用 `Scene.fixedUpdate()`、`new Scene({ interpolatePhysics: true })`，不要從 hook 再呼叫 physics world update。新驗收與限制見 [ACCEPTANCE](ACCEPTANCE.md)，歷史測試數仍保留。

### v1.10 production 契約

Package **1.10.0** 納入以下 P58–P70 分功能提交：lazy Scene subsystems／Canvas startup 不載入 GPU chunks；固定版官方 Basis／Draco semantic asset pipeline 與 capability 選擇／fallback；ResourcePool／ResourceScope 共享 leases、取消 rollback 與 fresh save candidate publication；Scene 共用 navigation work quota、changed-only spatial geometry refresh；3D moving support／crouch、distance／ball-socket／hinge joints、dynamic-pair／angular CCD；collision-derived navigation bake／NPC scheduling；bidi／grapheme／fallback-font native text；native audio effects／ducking／automation／world bindings。參見[新使用契約](docs/USAGE-zh.md#38-production-契約v110)與[技術參考](docs/TECHNICAL-zh.md)。GitHub 發佈須通過既有 CI gates，不做 npm publish。

P71–P87 v1.11 production surfaces（metadata 1.11.0；正式實作與限定 native gates 已記錄，實機另列 blocked）：手勢音訊／可觀測錯誤、獨立 2D／3D starter、revision／備份／明示復原／autosave、具名實機 gates、kinematic／角色／relative rotational 2D CCD、獨立 fixed mixer locomotion、有限多層 navigation、visibility／LOD／HLOD／native occlusion、NativeMaterial3D、cell streaming、native CPU workers、Tiled JSON、有界多燈／shadow atlas、GPU particles、真 pass timing／代表負載、雙語無障礙遊戲。[使用契約](docs/USAGE-zh.md#39-p71p87-production-擴充)說明 ownership／預算／部署；native／平台證據只依 ACCEPTANCE。

P88–P96 維持1.x相容：optional renderer capability／公開 API gate、CI site／silent audio／production benchmark／真封裝 starter gates、glTF UV0／UV1與各材質 map transform／八 skin influences、Tiled infinite chunks／groups／parallax／animation／templates、獨立品質與模擬裝置負載 profiles、polygon navmesh／partitioned sampled world、shadow blend／slope bias／static cache、持久化 remap／portable settings與save、strict CSP／opt-in offline 部署。操作與限制見[相容擴充契約](docs/USAGE-zh.md#40-1x-相容擴充-profilesp88p96)；新 hosted run、實機及逐 backend 證據不從功能表推論。

Camera／shadow reach 與 per-draw light budget 分開；Scene pools 各1024 point／spot、每 draw 各32，shadow atlas 最多4 cascades／8 point／8 spot。舊 NavigationGraph3D 仍每 graph8192 nodes；新 polygon／tiled profiles 有獨立 aggregate／scheduler 預算。Worker transfer 後 Geometry 仍有 main-thread validate／copy。這些不是 unlimited lighting／zero-copy／效能認證。

v1.10 已由 [Release run 36966119517](https://github.com/YueyuHoshizora/XYZ.js/actions/runs/36966119517) 成功發佈：Node22／24／26 quality、Ubuntu 九組 browser matrix、macOS WebKit 與封裝共 14 jobs 通過。下載附件 checksum 與本機 consumer 已驗封裝一致；下列舊階段的 hosted「待驗」是當時狀態，最新範圍與限制見 ACCEPTANCE。

目前證據涵蓋 Chromium 153／Firefox 155／managed WebKit 26.6 的限定 browser paths（Firefox 無可用 WebGPU adapter）、實際官方 codec CLI 與 native WebAudio signal measurements；managed WebKit **不是 Safari 認證**。歷史 10 秒 observability smoke 量測 heap／GC／RSS 與 native GL GPU timestamps；本輪 P86 新增有效 native WebGPU pass-sum 與固定品質負載。RSS 不是 VRAM，RAF 不是 GPU／呈現 completion，短測不是一小時或 low-tier 證明。尚無實機 mobile／OS IME／gamepad／音訊硬體認證；mobile emulation 不等於實機。最終結果以 [ACCEPTANCE](ACCEPTANCE.md) 為準。P58–P70 的 translation-only 2D CCD／single-layer bake 是歷史邊界；Text3D native fillText 與 spatial O(N) pose checks 限制維持。

P71–P87 當時的45個線上範例共212條實際 renderer routes 通過，三引擎並行 native 音訊 reference error 為0且 cleanup 無錯誤。P76 已提供有界 relative dynamic／rotational CCD，P78 當時提供有限多層 sampled lattice、不是新 P93 polygon navmesh。2D／3D starters 當時已以獨立安裝／完整 engine tree／subpath 部署驗證；本次新增 gates 與實機 blockers 另記 ACCEPTANCE，不代表新 release 或所有平台認證。

本輪 production 擴充：

- P44：共用 CI／release browser gate，保留實際 native submitted-frame pixels 與失敗證據；Linux launcher 啟用 SwiftShader Vulkan compositor，已在隔離 Ubuntu 24.04 arm64 重現並修正 swap-buffer 失敗，hosted Ubuntu x64 修正仍待驗。
- P45：共用 3D AABB hierarchy 與 candidate statistics；公開 mutable transforms 的 refresh 仍為 O(n)。
- P46：有 expansion budget、可取消及 revision invalidation 的 incremental grid／graph A*。
- P47：動態 authored connections／clearance 與實際 character 阻擋後有限重新規劃。
- P48：[混合負載與 lifecycle soak](benchmarks/mixed/index.html)，分開 RAF／CPU phases／cache estimates。
- P49：stable-ID 2D／3D／動態 content topology、body 與 custom state save／rebuild。
- P50：[固定版本 asset recipe](docs/ASSET-RECIPE.md)、mip／fallback outputs、checksums 與真 extracted-package 部署驗證。
- P51：`UITextInput` 以透明原生 input 處理 IME／selection／editing，視覺維持 canvas。
- P52：`UIScrollView`／`UIVirtualList`、clip-aware input／focus reveal 與 bounded keyed rows。
- P53：static `TriangleMeshCollider3D`／triangle BVH、實際 contacts／ray／sweep。
- P54：`CompoundCollider3D` 的 child-local union／真 gaps／combined inertia。
- P55（歷史）：opt-in static-target 3D translation CCD；當時不涵蓋 rotation／dynamic-pair CCD。未發佈擴充見上。
- P56：可交由 actor／controller 消費的 animation root motion。
- P57：explicit bind-pose animation retargeting；不修改 source tracks。

### 歷史階段矩陣與批准範圍（目前規範見 CURRENT）

| 能力           | 歷史階段契約／限制                                                                                                                                                                                                                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2D／3D backend | 三 backend 共用 2D ordering／isolation／masks；3D、native Material2D／Filter2D／Mesh2D 僅 WebGPU／WebGL2，Canvas2D 明確拒絕，不切 backend。                                                                                                                                                                          |
| Physics2D      | Kinematic／convex character motion／bounded relative dynamic與rotational CCD；sleep／五種 joints／static concave凸片。Sensor discrete；無 dynamic concave／compound／deforming sweeps。                                                                                                                              |
| glTF／textures | `COLOR_0` 支援、`COLOR_1` 拒絕；meshopt 內建、Draco／Basis codecs 外部提供。普通 KTX2 路徑為 base-level RGBA8；opt-in `nativeTextures`／`decodeKTX2Native` 保留完整 mip payload。`NativeTexture2D` 支援 RGBA8 與 capability-gated BC／ETC2／ASTC profiles，Canvas 明確拒絕。                                         |
| 遺失復原       | GPU／GL 預設 `recoverGraphics:true` 重建同 backend；舊 RenderTexture／snapshot 失效，失敗為 fatal。P42 實跑 Chromium WEBGL_lose_context 與 fixture-only GPUDevice.destroy；非真 driver reset／跨瀏覽器認證。                                                                                                         |
| P40–P42        | 三輪皆已限定 Chromium 驗收；當時 79 files／678 tests。P42 包含 GPU skin palettes／animated bounds、native compressed mips、3D colliders／queries／capsule movement／dynamic bodies、authored navigation、masks／additive／blend tree／two-bone IK 與完整 Beacon Run。非跨瀏覽器／效能認證，證據及限制見 ACCEPTANCE。 |

P40 `graphics.stats` 的 `drawCalls2D`／`instances2D`／`renderPasses2D`／`uploadBytes` 為每幀 CPU 計數；`renderTargetBytes`／`peakRenderTargetBytes` 為 resident／歷來 peak attachment bytes 估計，不是 GPU timers／driver memory／效能提升證明。Batch 只能合併相鄰且相容 commands，不能破壞 global stable z、world→HUD、native materials、isolation／masks／filters、immutable captures 或 OIT。Decoder 接口不等於內建外部 codec；profiles 與待驗門檻見 [PLAN](PLAN.md)、[TECHNICAL](docs/TECHNICAL-zh.md)。

P41：`UIRoot(game, layout)`／`UIElement` 的 row／column／overlay layout 與非同步 widgets 使用引擎 HUD visuals；DOM 只提供 semantics／focus。Contexts 依 priority／最新 activation 消耗實體來源，不改 raw polling；held source 不因啟用／解除遮擋產生新 press。CPU decoded textures 與 native texture／geometry budgets 分開估算，排除 caller bitmaps、derivedCanvas、attachments、scratch、driver／pipeline；Canvas native residency 為零。Warmup 限制每 RAF chunk 的資源數／資源間時間，單一資源可超時；typed factories 以 parser／注入 services 建立 fresh owned prefab，不反射／eval。正式 [authoring-lab](examples/authoring-lab/) 與 [使用方式](docs/USAGE-zh.md#21-p41-authoringdevice-flow) 展示已限定驗收契約。

```html
<canvas id="game"></canvas>
```

在已安裝本機 tarball 或可解析 `xyz.js` 的 npm/bundler 專案中（尚未 npm publish）：

```ts
import { Game } from 'xyz.js';

const game = await Game.create({ canvas: '#game', renderer: 'webgpu' });
game.addEventListener('error', (event) =>
  console.error((event as CustomEvent<Error>).detail),
);
game.start();

// 如需控制：game.pause(); game.resume(); game.resize(1280, 720); game.destroy();
// game.clock.deltaTime、elapsedTime（秒）、frame、fps
```

`Game.create` 預設 `renderer:'auto'`；上例刻意指定 WebGPU 顯示 triangle。其他設定：`width`／`height`（1280×720 CSS 像素）、`maxDeltaTime`（0.1 秒）、`pixelRatio`（裝置比例上限 2）、`autoResize`（true）。size containment 不覆寫作者 width／height CSS；可在有尺寸的容器使用 `width:100%;height:100%`，或 width 加明確 `aspect-ratio`。`resize()` 更新 intrinsic fallback，autoResize 仍以 content box 為準；`fps` 使用未 clamp 幀間隔。每個 Canvas 限一個 Game（含初始化）；一般 pause 可 resume。初始化失敗會 reject；fatal frame／graphics 錯誤送出 `error` 並暫停，需 destroy／重新 create。Scene 準備與 Audio 排程錯誤也可能送出 `error`，但不一定是 fatal。狀態為 idle／running／paused／destroyed。

工具鏈最低支援 Node.js 22（目前固定工具鏈需 22.13.0 以上）、pnpm 12.6.0。執行 `npx pnpm@12.6.0 install`、`npx pnpm@12.6.0 dev`，開啟 `http://127.0.0.1:5173/examples/triangle/`；完整檢查是同一 pnpm 版本的 `build`、`typecheck`、`test`、`lint`、`format:check`。P08 的 2026-09-30 紀錄為五項通過、16 檔／73 測試通過，詳見 [驗收紀錄](ACCEPTANCE.md)。build 輸出 JS、`.d.ts` 與官方 vendor；無 bundler 時完整複製 `dist/`（含 `dist/vendor/opm/`），再從 `/vendor/xyz/dist/src/index.js` 等部署 URL import。根套件目前為 Apache-2.0（見 [LICENSE](LICENSE)）；舊 release 的 UNLICENSED metadata 不回寫，OPM vendor 保留自身授權。

Build 自動最小化 `dist/` 的引擎 JavaScript，保留 ESM 目錄、公開名稱、宣告與 source maps；官方已最小化的 OPM vendor 原樣複製。歷史量測為 36 個引擎 JS 約減少 48% 體積，當時安全修正與發佈驗證為 17 檔／82 測試通過；不是目前最新驗收或新效能證明。

v1.4／v1.5 歷史新增（additive、無新 runtime dependency）：空間 sample audio／listener、標準 Gamepad、glTF morph／常用 extensions、EnvironmentMap IBL／skybox、frustum culling／fog、WebGPU 4× MSAA、半透明排序、effects3D、FirstPersonControls、graphics.stats與GPU／GL loss recovery。RenderTexture／snapshot在loss後需重建。WebGPU真device loss、Pointer Lock實機、實體gamepad與空間音效聽感仍未認證；目前 P36b 已支援 `COLOR_0`，P32 已有 meshopt／有限KTX2 decode與外部Draco／Basis接口（見上方矩陣），不可再誤寫成全部拒絕。

新增 opt-in `scene.transparency = 'weighted'`（WebGPU／WebGL2）：加權透明近似，預設 sorted 不變；objects3d 可切換並反轉插入順序。不是精確逐像素排序或多層折射，WebGL2 需 float color attachment。驗證範圍見 [ACCEPTANCE](ACCEPTANCE.md)。

可執行範例：`triangle`、`sprite`、`pong`、`cube3d`、`fallback-demo`、`showcase`（2D＋3D＋音訊同場）、`advanced3d`（進階 3D，含 Environment 與 fog）、`gameplay2d`、`rendering2d`。驗收證據見 `ACCEPTANCE.md`；本倉庫不自動 push／publish。

已驗證 managed Chromium 150；Safari／Edge／Firefox、實體 gamepad、真實背景分頁／BFCache 矩陣、跨螢幕 DPR 與 driver reset 尚未認證。WebGPU／AudioWorklet 需要安全來源；benchmark 的約 60fps 不是跨裝置保證。

## English

### Available now

[Current v1.12.2 contracts](docs/CURRENT.md) and generated root API are normative. `pnpm docs:api` provides search; `build:site` distributes the portal. Older release/stage narratives remain historical. Managed WebKit is not Safari and simulated input is not physical qualification.

Game/Scene/ECS, 2D/3D math, Texture/Sprite, camera/input and lit, depth-tested Mesh rendering are available. `auto` tries WebGPU→WebGL2→Canvas2D including initialization failures; forced backends never fall back. Check `game.graphics.capabilities.threeD`: Canvas2D is 2D-only. WebGPU requires a secure origin. Audio uses official OPM.js v1.8.0 (tag `v1.8`); call `await game.audio.unlock()` from a user gesture. Despite upstream selectable voice counts, the engine retains eight isolated slots; this vendor upgrade adds no engine features or certification claims.

Advanced 3D includes Object3D/Group hierarchies, perspective/orthographic cameras and lookAt, OrbitControls, exact Raycaster picking, glTF 2.0/GLB, keyframes and native GPU skin palettes (lazy exact CPU queries/conservative animated bounds), PBR/point/spot lights, directional PCF shadows, InstancedMesh and HDR exposure/ACES/bloom before the unaffected 2D overlay. P42 bounded physics/navigation/animation profiles and Beacon Run passed scoped Chromium acceptance. The API is three.js-inspired, not drop-in/all-addon parity; no runtime dependency was added. See the bilingual technical references.

P13 adds 2D hierarchy/Group2D, atlas Sprite source/SpriteSheet, FrameAnimation, SpriteFont/SpriteText, NineSlice and ScreenElement HUD to existing GameObject, exercised on all three backends. Sprite width/height are natural source dimensions; use scale. Sprite.source permits fractional pixels; SpriteSheet frames require integer pixels. Open `/examples/gameplay2d/` for animation, glyphs, panels and HUD.

P18 is accepted in the recorded Chromium scope: task-count PreloadBatch, Scene.preload→initialize barrier/Game.loading, bounded text/JSON/binary, uniquely owned GLTFLoader.task, native PCM/WAV samples alongside OPM. Preunlock fetch does not decode; gesture unlock is required for decode/play, reusing the first OPM context (eight total, no ninth). Game pause does not pause audio. No new cross-browser/performance or speaker-audibility claim.

Historical P14–P20 acceptance covers target-only lifecycle/pointer/drag, Actions/camera strategies, discrete circle/box/convex physics, maps, CPU particles, native GPU/GL 2D effects and three-backend whole-frame transitions; the formal playground/full toolchain recorded 37 files/252 tests. This is not the current ceiling: P31 adds bounded CCD, sleep, joints and static concave/chains. GPU particles/editor importers remain unsupported. Prepare native Material2D/PostProcessor2D before use; Canvas2D explicitly rejects them. Prepared entries survive resize/disable, mutable targets release and owned captures survive/scale. See the bilingual guides.

P21–P29 are approved bounded PixiJS-inspired profiles, now integrated and exercised in one environment only (macOS arm64 managed headless Chromium with a WebGPU adapter): one shared 2D command stream across all three backends for affine utilities, atlases, raster paths, offscreen isolation, masks, blends, native filters/meshes, text/assets, opt-in interaction/accessibility and particles/preparation. The formal [examples/rendering2d](examples/rendering2d/index.html) example runs on all three; Canvas explicitly rejects native filters and visible meshes. This is neither full Pixi parity nor cross-browser, real-hardware or performance evidence, and it is not part of GitHub v1.2. See [ACCEPTANCE](ACCEPTANCE.md) for verified scope and unverified items, and [PLAN](PLAN.md) for the profiles.

Fixed gameplay, time-weighted forces and opt-in physics presentation use `Scene.fixedUpdate()` and `new Scene({ interpolatePhysics: true })`; do not manually advance physics from that hook. New evidence and limits are in [ACCEPTANCE](ACCEPTANCE.md); historical counts remain historical.

### v1.10 Production Contracts

Package **1.10.0** includes the separately committed P58–P70 additions: lazy Scene subsystems and GPU-free Canvas startup chunks; pinned official Basis/Draco semantic asset production and capability selection/fallback; ResourcePool/ResourceScope shared leases, cancellation rollback and fresh save-candidate publication; aggregate Scene navigation work quotas and changed-only spatial geometry refresh; 3D moving supports/crouch, distance/ball-socket/hinge joints and dynamic-pair/angular CCD; collision-derived navigation baking/NPC scheduling; bidi/grapheme/fallback-font native text; native audio effects/ducking/automation/world bindings. See [new usage contracts](docs/USAGE.md#38-production-contracts-v110) and [technical reference](docs/TECHNICAL.md). GitHub publication requires the existing CI gates; npm remains unpublished.

P71–P87 v1.11 surfaces (metadata 1.11.0; with scoped native gates recorded and hardware blockers kept explicit): gesture-preserving audio/observable errors, standalone 2D/3D starters, revision/backup/explicit recovery/autosave, named hardware gates, kinematic/character/relative rotational 2D CCD, independent fixed-mixer locomotion, finite multisurface navigation, visibility/LOD/HLOD/native occlusion, NativeMaterial3D, cell streaming, native CPU workers, Tiled JSON, bounded many-light/shadow atlases, GPU particles, real-pass timing/workloads and bilingual accessibility. [Usage contracts](docs/USAGE.md#39-p71p87-production-expansion) specify ownership/budgets/deployment; only ACCEPTANCE establishes native/platform proof.

P88–P96 retain 1.x compatibility: optional renderer capabilities/public API gate, CI site/silent-audio/production-benchmark/packed-starter gates, glTF UV0/UV1 with independent map transforms/eight skin influences, Tiled infinite chunks/groups/parallax/animation/templates, separate quality and simulated-device workload profiles, polygon navmesh/partitioned sampled worlds, shadow blending/slope bias/static caching, persistent remapping/portable settings and saves, and strict-CSP/opt-in offline deployment. See [compatible expansion contracts](docs/USAGE.md#40-compatible-expansion-profiles-p88p96); features alone do not establish new hosted runs, hardware or backend certification.

Camera/shadow reach and per-draw light budgets are separate: Scene pools allow 1024 point/spot lights each, draws select at most 32 each, shadows at most four cascades/eight point/eight spot. Existing NavigationGraph3D retains 8192 nodes per graph; new polygon/tiled profiles have independent aggregate/scheduler budgets. Worker output still incurs main-thread Geometry validation/copy. No unlimited-light, zero-copy or performance certification follows.

v1.10 was published by [Release run 36966119517](https://github.com/YueyuHoshizora/XYZ.js/actions/runs/36966119517): all 14 jobs passed, including Node22/24/26 quality, nine Ubuntu browser combinations, macOS WebKit and packaging. Downloaded assets match the checksum and the exercised local package. Older stage-specific hosted-pending statements describe their original dates; ACCEPTANCE records the current scope and limits.

Current scoped evidence includes Chromium 153/Firefox 155/managed WebKit 26.6 browser paths (Firefox has no supported WebGPU adapter), actual official codec CLI runs and native WebAudio signal measurements. Managed WebKit is **not Safari certification**. Historical 10-second observability measured heap/GC/RSS and native GL timestamps; P86 adds valid native WebGPU pass-sum timing and fixed-quality workloads. RSS is not VRAM, RAF is not GPU/presentation completion, and short runs do not prove an hour or low-tier performance. Physical mobile, OS IME, gamepads and audio hardware are not certified; emulation is not device proof. See [ACCEPTANCE](ACCEPTANCE.md). Translation-only 2D CCD and single-layer baking were P58–P70 boundaries; Text3D native fillText and O(N) mutable-pose checks remain.

At P71–P87 acceptance, all 45 online example directories passed 212 actual renderer routes; three-engine concurrent native audio measured zero reference error and no cleanup errors. P76 supplies bounded relative dynamic/rotational CCD; P78's finite multisurface sampled navigation is distinct from the new P93 polygon mesh. Both starters then passed independent installation/full-engine-tree/subpath checks. New gates and physical-device blockers are recorded separately in ACCEPTANCE, not a new release or universal platform certification.

Production additions in this round:

- P44: shared CI/release browser gate with native submitted-frame pixels and failure evidence; the Linux launcher enables the SwiftShader Vulkan compositor. Swap-buffer failure was reproduced and fixed on isolated Ubuntu 24.04 arm64; the hosted Ubuntu x64 correction remains unverified.
- P45: shared 3D AABB hierarchy and candidate statistics; mutable public poses still need O(n) refresh.
- P46: incremental grid/graph A* with expansion budgets, cancellation and revision invalidation.
- P47: dynamic authored connections/clearance and bounded replanning after real character blockage.
- P48: [mixed load/lifecycle soak](benchmarks/mixed/index.html), separating RAF, CPU phases and cache estimates.
- P49: stable-ID 2D/3D/dynamic content topology, body and custom-state save/rebuild.
- P50: [pinned asset recipe](docs/ASSET-RECIPE.md), mip/fallback outputs, checksums and real extracted-package deployment.
- P51: `UITextInput` uses transparent native editing/IME/selection with canvas visuals.
- P52: `UIScrollView`/`UIVirtualList`, clip-aware input, focus reveal and bounded keyed rows.
- P53: static `TriangleMeshCollider3D`/triangle BVH with real contacts/ray/sweep.
- P54: `CompoundCollider3D` child-local unions, real gaps and combined inertia.
- P55 (historical): opt-in static-target 3D translation CCD, then excluding rotational/dynamic-pair CCD. See v1.10 extensions above.
- P56: animation root motion consumed by an actor/controller.
- P57: explicit bind-pose animation retargeting without mutating source tracks.

### Historical stage matrix and approved scope (current contracts: CURRENT)

| Capability       | Historical stage contract / restriction                                                                                                                                                                                                                                                                                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2D / 3D backends | All three share 2D ordering/isolation/masks; 3D and native Material2D/Filter2D/Mesh2D require WebGPU/WebGL2. Canvas2D explicitly rejects them without switching backend.                                                                                                                                                                                                                |
| Physics2D        | Kinematic bodies, convex character motion and bounded relative dynamic/rotational CCD; sleep/five joints/static concave pieces. Sensors remain discrete; no dynamic concave/compound/deforming sweeps.                                                                                                                                                                                  |
| glTF / textures  | `COLOR_0` supported, `COLOR_1` rejected; built-in meshopt, externally supplied Draco/Basis codecs. Ordinary KTX2 uses base-level RGBA8; opt-in `nativeTextures` / `decodeKTX2Native` preserves every mip payload. `NativeTexture2D` supports RGBA8 and capability-gated BC/ETC2/ASTC profiles; Canvas explicitly rejects native sources.                                                |
| Loss recovery    | GPU/GL default `recoverGraphics:true` rebuilds the same backend; old RenderTextures/snapshots become invalid and recovery failure is fatal. P42 exercised Chromium WEBGL_lose_context and fixture-only GPUDevice.destroy, not real-driver resets or cross-browser certification.                                                                                                        |
| P40–P42          | All three stages passed scoped Chromium acceptance; then 79 files/678 tests. P42 includes GPU skin palettes/animated bounds, native compressed mips, 3D colliders/queries/capsule movement/dynamic bodies, authored navigation, masks/additive/blend trees/two-bone IK and the complete Beacon Run. No cross-browser/performance certification; see ACCEPTANCE for evidence and limits. |

P40 `graphics.stats` fields `drawCalls2D`/`instances2D`/`renderPasses2D`/`uploadBytes` are per-frame CPU counters; `renderTargetBytes`/`peakRenderTargetBytes` estimate resident/lifetime-peak attachment bytes, not GPU timers, driver memory or proof of improved throughput. Batching merges only adjacent compatible commands without changing global stable z, world→HUD, native materials, isolation/masks/filters, immutable captures or OIT. Decoder interfaces do not bundle external codecs; profiles and pending gates are in [PLAN](PLAN.md) and [TECHNICAL](docs/TECHNICAL.md).

P41 `UIRoot(game, layout)`/`UIElement` row/column/overlay layout and async widgets use engine HUD visuals; DOM supplies semantics/focus only. Contexts consume physical sources by priority/latest activation, not raw polling; held activation/unblocking is not a new press. Decoded CPU texture and native texture/geometry budgets are separate estimates excluding caller bitmaps, derivedCanvas, attachments, scratch, driver/pipelines; Canvas native residency is zero. Warmup bounds resource count/time between resources per RAF chunk, not the duration of one resource. Typed factories use parsers/injected services and fresh owned prefabs, not reflection/eval. See [authoring-lab](examples/authoring-lab/) and [usage](docs/USAGE.md#21-p41-authoringdevice-flow) for scoped accepted contracts.

Opt-in `scene.transparency = 'weighted'` adds approximate weighted transparency on WebGPU/WebGL2; sorted remains the default. The objects3d example toggles it and reverses insertion order. This is not exact per-pixel sorting or multilayer refraction; WebGL2 requires float color attachments. See [ACCEPTANCE](ACCEPTANCE.md) for verification scope.

```ts
import { Game } from 'xyz.js';

const game = await Game.create({ canvas: '#game', renderer: 'webgpu' });
game.addEventListener('error', (event) =>
  console.error((event as CustomEvent<Error>).detail),
);
game.start();
```

Add `<canvas id="game"></canvas>`. The default renderer is `auto`; the example explicitly requests WebGPU for the triangle. Other defaults are `width`/`height` (1280×720 CSS pixels), `maxDeltaTime` (0.1s), `pixelRatio` (device ratio capped at 2), and `autoResize` (true). Size containment preserves authored CSS; use a sized container or width plus explicit `aspect-ratio`. `resize()` updates intrinsic defaults; autoResize follows the content box. Clock fps uses the unclamped interval. Each canvas permits one Game, including initialization. Normal pause is resumable. Initialization failures reject; fatal frame/graphics errors emit `error` with `detail`, pause the Game and require destroy/recreate. Scene preparation and audio scheduling errors may also emit `error` without being fatal.

The minimum supported Node.js major is 22 (use 22.13.0 or later for the pinned toolchain), with pnpm 12.6.0: `npx pnpm@12.6.0 install`, then `npx pnpm@12.6.0 dev` and open `http://127.0.0.1:5173/examples/triangle/`. Run `build`, `typecheck`, `test`, `lint`, and `format:check` with the same pnpm version. The historical P08 run on 2026-09-30 passed all five, with 16 files / 73 tests; see [ACCEPTANCE.md](ACCEPTANCE.md). npm is unpublished; resolve bare imports through a local tarball or resolver. For unbundled use, copy the **entire** built `dist/` tree, including `dist/vendor/opm/`, and import a deployed URL such as `/vendor/xyz/dist/src/index.js`. The current root package is Apache-2.0 ([LICENSE](LICENSE)); old releases retain their UNLICENSED metadata, and OPM retains its own vendor license.

Build automatically minifies engine JavaScript in `dist/`, preserving the ESM tree, public names, declarations and source maps; the already-minified official OPM vendor is copied unchanged. Historical measurements recorded about 48% reduction across 36 engine JS files and 17 files / 82 tests for the then-current security/distribution verification. These are not the latest acceptance or a new performance claim.

Historical v1.4/v1.5 additions (additive, no new runtime dependency): spatial sample audio/listener, standard Gamepad, glTF morph/common extensions, EnvironmentMap IBL/skybox, frustum culling/fog, WebGPU 4× MSAA, blended sorting, effects3D, FirstPersonControls, graphics.stats and GPU/GL loss recovery. Recreate RenderTexture/snapshot handles after loss. Real WebGPU loss, hardware Pointer Lock/gamepads and spatial-audio listening remain uncertified. Current P36b supports `COLOR_0`; P32 provides meshopt, bounded KTX2 decoding and external Draco/Basis interfaces (matrix above), not blanket rejection.

Runnable examples: `triangle`, `sprite`, `pong`, `cube3d`, `fallback-demo`, `showcase` (2D + 3D + audio), `advanced3d` (with Environment and fog), `gameplay2d` and `rendering2d`. See `ACCEPTANCE.md` for evidence and limitations. This repository does not push or publish automatically.

Historical observations used managed Chromium 150. Current browser evidence and remaining hardware/platform limits are stated above; Safari/Edge certification, physical gamepads, cross-monitor DPR and real driver resets remain unverified. WebGPU/AudioWorklet require a secure origin. The ~60 fps benchmark result is not a cross-device guarantee.

## 日本語

### 現在利用可能

現在の規範は [v1.12.2 契約](docs/CURRENT.md) と生成された root API です。`pnpm docs:api` で検索可能な API を生成し、`build:site` が静的サイトへ含めます。旧版・段階の記述は履歴です。managed WebKit は Safari 認証ではなく、模擬入力は実機検証ではありません。

Game／Scene／ECS、2D／3D 数学、Texture／Sprite、Camera／Input、深度と照明付き Mesh を提供します。`auto` は初期化失敗時も WebGPU→WebGL2→Canvas2D の順に降格します。強制 backend は切り替えません。`game.graphics.capabilities.threeD` で判定し、Canvas2D は 2D 専用です。WebGPU はセキュアなオリジンが必要です。音声は公式 OPM.js v1.8.0（tag `v1.8`）を使用し、ユーザー操作から `await game.audio.unlock()` を呼び出します。上流では声部数を選択できますが、エンジンは八つの隔離 slot を維持します。この vendor 更新はエンジンの新機能や認証範囲を追加しません。

高度な 3D は Object3D／Group 階層、透視／正投影カメラと lookAt、OrbitControls、正確な Raycaster、glTF 2.0／GLB、キーフレームと native GPU skin palette（lazy exact CPU queries／保守的 animated bounds）、PBR／点光源／スポットライト、方向光 PCF シャドウ、InstancedMesh、2D overlay 前の HDR exposure／ACES／bloom を提供します。P42 の限定 physics／navigation／animation profiles と Beacon Run は Chromium の限定環境で検証済みです。Three.js 参考 API は互換置換／全 addons 対応ではなく、runtime dependency 追加なし。制限は技術参照へ。

P13 は既存 GameObject の2D階層／Group2D、atlas source／SpriteSheet、FrameAnimation、SpriteFont／SpriteText、NineSlice、ScreenElement HUD を三backendで検証済みです。Sprite width／height は自然サイズ、表示サイズはscale、sourceは小数pixel可、SpriteSheet framesは整数のみ。`/examples/gameplay2d/` で確認できます。

P18 は限定Chromium環境で検証済みです：PreloadBatch progress、Scene.preload→initialize／Game.loading、有界readers、unique GLTFLoader.task、OPMと併用するPCM/WAV sample。Unlock前はfetchのみ、decode／playはユーザー操作unlockが必要、最初のOPM contextを再利用（合計八個、九個目なし）。Game pauseは音声を停止しません。他browser／新性能／スピーカーで聞こえたとの主張はありません。

P14–P20 の歴史的検証範囲は target-only lifecycle／pointer／drag、Actions／camera、discrete circle／box／convex physics、maps、CPU particles、GPU／GL native 2D effects、三 backend whole-frame transitions です。正式 playground／toolchain の記録は 37 files／252 tests。現在の上限ではなく、P31 で限定 CCD／sleep／joints／static concave／chain を追加しました。GPU particles／editor importer は未対応です。Native Material2D／PostProcessor2D は prepare を await し、Canvas2D は明示的に拒否します。Prepared entries は resize／disable で保持、mutable targets は解放、owned captures は保持／scale します。双語 guides を参照してください。

P21–P29 の限定 PixiJS-inspired profiles は統合済みで、単一環境（macOS arm64 の managed headless Chromium、WebGPU adapter あり）でのみ実行確認しました。三 backend が共通の 2D command stream を使い、正式サンプル [examples/rendering2d](examples/rendering2d/index.html) も三 backend で動作します。Canvas の native filters／visible meshes は明示的に拒否します。完全な Pixi 互換、クロスブラウザ／実ハードウェア／性能の証明ではなく、GitHub v1.2 にも含まれません。検証範囲と未検証項目は [ACCEPTANCE](ACCEPTANCE.md)、profile は [PLAN](PLAN.md) を参照してください。

Fixed gameplay／時間加重 force／opt-in physics presentation は `Scene.fixedUpdate()` と `new Scene({ interpolatePhysics: true })` を使います。Hook 内で physics を二重更新しないでください。新しい証拠と制限は [ACCEPTANCE](ACCEPTANCE.md)、旧テスト数は当時の記録です。

### v1.10 Production 契約

Package **1.10.0** は P58–P70 ごとに commit した追加機能を含みます：lazy Scene subsystems／Canvas 起動で GPU chunks を読まない構成、固定版公式 Basis／Draco semantic asset pipeline と capability 選択／fallback、ResourcePool／ResourceScope の共有 leases／取消 rollback／fresh save candidate publication、Scene 共通 navigation work quota／変更時のみ spatial geometry refresh、3D moving support／crouch／distance・ball-socket・hinge joints／dynamic-pair・angular CCD、collision-derived navigation bake／NPC scheduling、bidi／grapheme／fallback-font native text、native audio effects／ducking／automation／world bindings。[新 usage contracts](docs/USAGE.md#38-production-contracts-v110) と[技術参照](docs/TECHNICAL.md)を参照してください。GitHub 公開は既存 CI gates の通過が必要で、npm は未公開です。

P71–P87 v1.11 機能（metadata 1.11.0。限定 native gates を記録し実機 blockers は明示）：gesture 音声／可視エラー、独立 2D／3D starter、revision／backup／明示復元／autosave、実機別 gates、kinematic／character／相対回転 2D CCD、独立 fixed mixer locomotion、有限多層 navigation、visibility／LOD／HLOD／native occlusion、NativeMaterial3D、cell streaming、native CPU workers、Tiled JSON、上限付き多灯／shadow atlas、GPU particles、実 pass timing／負荷、英語・繁中 accessibility。[使用契約](docs/USAGE.md#39-p71p87-production-expansion)に ownership・予算・deployment を記載し、native／platform 検証は ACCEPTANCE のみを根拠とします。

P88–P96 は1.x互換を維持します：optional renderer capability／公開 API gate、CI site／silent audio／production benchmark／pack済み starter gates、glTF UV0／UV1・map別 transform・8 skin influences、Tiled infinite chunks／groups／parallax／animation／templates、品質と模擬 device の独立負荷 profiles、polygon navmesh／partitioned sampled world、shadow blend／slope bias／static cache、永続 remap／portable settings・save、strict CSP／opt-in offline deployment。[相互運用契約](docs/USAGE.md#40-compatible-expansion-profiles-p88p96)を参照。機能一覧だけで新 hosted run・実機・backend 認証を示しません。

Camera／shadow reach と draw ごとの light budget は別です。Scene pool は point／spot 各1024、draw は各32、shadow は最大4 cascades／8 point／8 spot。既存 NavigationGraph3D は graph別8192 nodesを維持し、新 polygon／tiled profiles は独立 aggregate／scheduler 予算を持ちます。Worker transfer 後も Geometry の main-thread validate／copy が必要です。無制限照明・zero-copy・性能認証ではありません。

v1.10 は [Release run 36966119517](https://github.com/YueyuHoshizora/XYZ.js/actions/runs/36966119517) で公開済みです。Node22／24／26 quality、Ubuntu 九組 browser matrix、macOS WebKit、packaging の全14 jobsが通過しました。ダウンロードした添付は checksum とローカル consumer 検証済み package に一致します。以下の旧段階の hosted 未検証記述は当時の状態で、最新の範囲と制限は ACCEPTANCE を参照してください。

限定証拠は Chromium 153／Firefox 155／managed WebKit 26.6 の browser paths（Firefox の WebGPU adapter は非対応）、実公式 codec CLI と native WebAudio signal measurements です。Managed WebKit は **Safari 認証ではありません**。当時の10秒 observability は heap／GC／RSS と native GL timestamps を測定し、P86 は有効な native WebGPU pass-sum と固定品質負荷を追加します。RSS は VRAM、RAF は GPU／presentation completion ではなく、短測は一時間／low-tier の証明でもありません。実機 mobile／OS IME／gamepad／音声 hardware は未認証、emulation は実機証拠ではありません。[ACCEPTANCE](ACCEPTANCE.md) を参照。translation-only 2D CCD／single-layer bake は P58–P70 当時の境界で、Text3D native fillText と O(N) pose checks は維持します。

P71–P87 当時は45個のオンライン example directories の実 renderer routes 212件が通過し、三 engines の並行 native 音声は reference error0・cleanup errors0でした。P76 は有限 relative dynamic／rotational CCD、P78 の有限多層 sampled navigation は新 P93 polygon mesh と別です。両 starter は当時、独立 install／完全 engine tree／subpath deployment を検証済み。新 gates と実機 blockers は ACCEPTANCE に別記し、新 release・全 platform 認証とはしません。

今回の production 拡張：

- P44：native submitted-frame pixels／失敗証拠を残す共通 CI／release browser gate。Linux launcher は SwiftShader Vulkan compositor を有効化し、隔離 Ubuntu 24.04 arm64 で swap-buffer の失敗再現と修正を確認済み。Hosted Ubuntu x64 の修正確認は未実施です。
- P45：共用 3D AABB hierarchy／candidate statistics。公開 mutable pose の refresh は O(n) です。
- P46：expansion budget／cancel／revision invalidation 対応の incremental grid／graph A*。
- P47：動的 authored connections／clearance と実 character の障害後の bounded replan。
- P48：[mixed load／lifecycle soak](benchmarks/mixed/index.html)。RAF／CPU phases／cache estimates は別に計測します。
- P49：stable-ID の 2D／3D／動的 content topology、body、custom state の save／rebuild。
- P50：[固定版 asset recipe](docs/ASSET-RECIPE.md)、mip／fallback outputs、checksums、実 extracted-package deploy。
- P51：`UITextInput` は透明 native input で IME／selection／editing を処理し、visuals は canvas に維持します。
- P52：`UIScrollView`／`UIVirtualList`、clip-aware input／focus reveal／bounded keyed rows。
- P53：static `TriangleMeshCollider3D`／triangle BVH、実 contacts／ray／sweep。
- P54：`CompoundCollider3D` の child-local union／実 gaps／combined inertia。
- P55（歴史）：opt-in static-target 3D translation CCD。当時 rotation／dynamic-pair CCD は対象外。v1.10 拡張は上記参照。
- P56：actor／controller が消費できる animation root motion。
- P57：source tracks を変更しない explicit bind-pose animation retargeting。

### 過去の段階別対応表と承認範囲（現在の規範は CURRENT）

| 機能           | 過去の段階別契約／制限                                                                                                                                                                                                                                                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2D／3D backend | 三 backend で 2D ordering／isolation／masks を共有。3D、native Material2D／Filter2D／Mesh2D は WebGPU／WebGL2 のみ。Canvas2D は拒否し backend を切り替えません。                                                                                                                                                                                            |
| Physics2D      | Kinematic／convex character motion／上限付き相対 dynamic・rotational CCD、sleep／五種 joints／static concave pieces。Sensor は discrete、dynamic concave／compound／deforming sweeps は非対応。                                                                                                                                                             |
| glTF／textures | `COLOR_0` 対応、`COLOR_1` 拒否。Meshopt 内蔵、Draco／Basis codecs は外部提供。通常の KTX2 は base-level RGBA8、opt-in `nativeTextures`／`decodeKTX2Native` は全 mip payload を保持。`NativeTexture2D` は RGBA8 と capability-gated BC／ETC2／ASTC profiles に対応し、Canvas は native sources を明示的に拒否します。                                        |
| Loss recovery  | GPU／GL は既定 `recoverGraphics:true` で同 backend を再構築。旧 RenderTexture／snapshot は無効、復旧失敗は fatal。P42 は Chromium WEBGL_lose_context と fixture-only GPUDevice.destroy を実行確認。実 driver reset／クロスブラウザ認証ではありません。                                                                                                      |
| P40–P42        | 三段階とも限定 Chromium 検証済み。当時 79 files／678 tests。P42 は GPU skin palettes／animated bounds、native compressed mips、3D colliders／queries／capsule movement／dynamic bodies、authored navigation、masks／additive／blend trees／two-bone IK と完成した Beacon Run を含みます。クロスブラウザ／性能認証ではなく、証拠と制限は ACCEPTANCE を参照。 |

P40 `graphics.stats` の `drawCalls2D`／`instances2D`／`renderPasses2D`／`uploadBytes` は毎フレーム CPU 計数、`renderTargetBytes`／`peakRenderTargetBytes` は resident／累積 peak attachment bytes の推定です。GPU timer／driver memory／性能改善の証明ではありません。Batch は隣接する互換 commands のみを結合し global stable z、world→HUD、native materials、isolation／masks／filters、immutable captures、OIT を保持します。Decoder interface は外部 codec の内蔵ではありません。[PLAN](PLAN.md) と [TECHNICAL](docs/TECHNICAL.md) を参照してください。

P41 の `UIRoot(game, layout)`／`UIElement` は row／column／overlay と非同期 widgets をエンジン HUD で描画し、DOM は semantics／focus のみを担当します。Contexts は priority／最新 activation で物理 source を消費し raw polling は変更しません。Held source の有効化／遮断解除は新 press ではありません。CPU decoded texture と native texture／geometry budgets は別の推定で、caller bitmaps／derivedCanvas／attachments／scratch／driver／pipelines を除外します。Canvas の native residency はゼロ。Warmup は RAF chunk の資源数と資源間時間を制限し、単一資源の時間は保証しません。Parser／注入 services を使う typed factories は fresh owned prefab を生成し、reflection／eval は使いません。[authoring-lab](examples/authoring-lab/) と [usage](docs/USAGE.md#21-p41-authoringdevice-flow) は限定検証済み契約を示します。

```ts
import { Game } from 'xyz.js';

const game = await Game.create({ canvas: '#game', renderer: 'webgpu' });
game.addEventListener('error', (event) =>
  console.error((event as CustomEvent<Error>).detail),
);
game.start();
```

ページに `<canvas id="game"></canvas>` を用意します。既定 renderer は `auto` で、上の例は triangle 用に WebGPU を指定しています。他の既定値は width／height＝1280×720 CSS ピクセル、maxDeltaTime＝0.1 秒、pixelRatio＝デバイス比の上限 2、autoResize＝true です。size containment は利用者の CSS を維持し、resize は intrinsic fallback、autoResize は content box に従います。fps は clamp 前の実フレーム間隔を使います。Canvas は初期化中も一つの Game 専用です。通常の pause は resume できます。初期化失敗は reject、fatal frame／graphics 障害は error イベントと停止で通知し、destroy／再 create が必要です。Scene 準備や音声の error は必ずしも fatal ではありません。

最低対応は Node.js 22（固定ツールチェーンには 22.13.0 以降が必要）と pnpm 12.6.0 です。`npx pnpm@12.6.0 install`、`npx pnpm@12.6.0 dev` を実行し、`http://127.0.0.1:5173/examples/triangle/` を開きます。同じ pnpm で build／typecheck／test／lint／format:check を実行します。2026-09-30 の歴史的 P08 記録は全項目と 16 ファイル／73 テスト通過です（[検証記録](ACCEPTANCE.md)）。npm 未公開のため bare import はローカル tarball 等で解決してください。bundler なしでは `dist/vendor/opm/` を含む `dist/` **全体**を配置し `/vendor/xyz/dist/src/index.js` 等から import します。現在の root は Apache-2.0（[LICENSE](LICENSE)）、旧 release の UNLICENSED metadata は保持し OPM vendor のライセンスも別途維持します。

Build は `dist/` の JavaScript を自動最小化し ESM 構造、公開名、型宣言、source maps を保持します。最小化済み公式 OPM vendor はそのままコピーします。歴史的量測は 36 ファイルで約 48% 減、当時の安全性／配布検証は 17 ファイル／82 テスト通過です。最新検証や新しい性能証明ではありません。

v1.4／v1.5 の歴史的追加（additive、runtime dependency 追加なし）：空間 sample audio／listener、標準 Gamepad、glTF morph／主要 extensions、EnvironmentMap IBL／skybox、frustum culling／fog、WebGPU 4× MSAA、半透明ソート、effects3D、FirstPersonControls、graphics.stats、GPU／GL loss recovery。Loss 後の RenderTexture／snapshot は再作成が必要です。実 WebGPU loss、実機 Pointer Lock／gamepad、空間音声の聴感は未認証。現在は P36b の `COLOR_0` と P32 の meshopt／限定 KTX2 decode／外部 Draco・Basis interface に対応し、一律非対応ではありません（上記表参照）。

`scene.transparency = 'weighted'` で WebGPU／WebGL2 の近似 weighted transparency を有効化できます。既定は sorted のままです。objects3d で切替と挿入順の反転を試せます。厳密なピクセル単位ソートや多層屈折ではなく、WebGL2 は float color attachment が必要です。検証範囲は [ACCEPTANCE](ACCEPTANCE.md) を参照してください。

実行可能なサンプル：`triangle`、`sprite`、`pong`、`cube3d`、`fallback-demo`、`showcase`（2D＋3D＋音声）、`advanced3d`（Environment と fog を含む）、`gameplay2d`、`rendering2d`。検証結果と制限は `ACCEPTANCE.md` を参照してください。このリポジトリは自動で push／publish しません。

歴史的観察は managed Chromium 150 を使用しました。現在の browser 証拠と hardware／platform 制限は上記参照。Safari／Edge 認証、実機 gamepad、モニター間 DPR と実 driver reset は未確認です。WebGPU／AudioWorklet にはセキュアなオリジンが必要です。約 60fps は全環境の保証ではありません。

## Examples／範例／サンプル

Run `npx pnpm@12.6.0 examples` (dev server plus browser at the gallery `http://127.0.0.1:5173/examples/`), or `dev` and open a `/examples/<name>/` URL yourself. The gallery lists every example with feature filters and per-backend links. Links below open the source directories. The examples added after 1.5.2 (physics2d through gltf3d) were each opened on the backends they support in the managed headless Chromium of the session that added them, with console errors checked; `audio-lab` and gamepad paths were verified by state readouts only (no speaker audibility, no physical gamepad), and no cross-browser claim is made.

Run `npx pnpm@12.6.0 dev` and open `http://127.0.0.1:5173/`. Root and `/examples/` share the complete 45-directory catalog. Every example directory URL starts on open; audio requires a trusted gesture. Most instructions are English; starters/accessibility-game provide complete English/Traditional-Chinese flows. `npx pnpm@12.6.0 build:site` produces deployable `.vite/site/`; publish the entire tree over HTTP/HTTPS, never `file://`.

根目錄與 `/examples/` 共用完整45個範例目錄，各 directory URL 開啟即執行，音訊仍需可信手勢。多數介面為英文；starter／accessibility-game 有完整英語／繁中流程。`npx pnpm@12.6.0 build:site` 產生可部署的 `.vite/site/`，整棵目錄以 HTTP／HTTPS 提供，不用 `file://`。

ルートと `/examples/` は全45個の directory catalog を共有し、各 directory URL は開くと実行します。音声は操作が必要です。多くの UI は英語、starter／accessibility-game は英語・繁中の全画面を提供します。`npx pnpm@12.6.0 build:site` の `.vite/site/` を完全な tree のまま HTTP／HTTPS で配信し、`file://` は使いません。

| Example                                              | 驗證內容／Purpose                                                                                                                                                                                                      |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [triangle](examples/triangle/)                       | WebGPU triangle；Pause／Resume／Destroy                                                                                                                                                                                |
| [sprite](examples/sprite/)                           | Shared Texture、z-order／opacity、六聲部 BGM＋SFX                                                                                                                                                                      |
| [pong](examples/pong/)                               | Camera2D、keyboard／pointer／gamepad API、計分                                                                                                                                                                         |
| [cube3d](examples/cube3d/)                           | Lit cube／sphere、depth、2D overlay；Canvas2D 明確不跑 3D                                                                                                                                                              |
| [fallback-demo](examples/fallback-demo/)             | Backend selector、capabilities、Sprite／Primitive／Mesh                                                                                                                                                                |
| [showcase](examples/showcase/)                       | 同 Scene 2D＋3D＋audio、volume、Scene switch／cleanup                                                                                                                                                                  |
| [advanced3d](examples/advanced3d/)                   | Group、OrbitControls／picking、glTF skin、PBR／shadow／HDR bloom、24 instances                                                                                                                                         |
| [gameplay2d](examples/gameplay2d/)                   | P13–P20 real root consumer: graphics／drag/actions/camera／physics/maps/particles／preload/audio／transitions；GPU/GL native effects, Canvas explicit rejection                                                        |
| [physics2d](examples/physics2d/)                     | Static/dynamic bodies, circle/box/polygon, materials, sensor Trigger2D, gravity control                                                                                                                                |
| [particles2d](examples/particles2d/)                 | ParticleEmitter presets (fountain/fire/snow/trail), bursts, nozzles, additive isolated layer                                                                                                                           |
| [tilemap2d](examples/tilemap2d/)                     | Two TileMap layers, solid tile colliders, Camera2D follow/dead zone/bounds/shake/zoom                                                                                                                                  |
| [transitions2d](examples/transitions2d/)             | fade／crossfade／slide between three Scenes, easing／duration／blockInput, cancel by newer request, Scene timers                                                                                                       |
| [ui2d](examples/ui2d/)                               | Text2D, SpriteFont／SpriteText, NineSlice, ScreenElement HUD, accessible pointer buttons                                                                                                                               |
| [input-lab](examples/input-lab/)                     | Live Keyboard／Pointer／Gamepad state, runtime-rebindable ActionMap                                                                                                                                                    |
| [audio-lab](examples/audio-lab/)                     | Gesture unlock, OPM music／SFX, PCM sample, channel volumes, PreloadBatch progress                                                                                                                                     |
| [pbr3d](examples/pbr3d/)                             | PBR metallic／roughness grid, shadows, point light, environment, fog, exposure／bloom                                                                                                                                  |
| [instancing3d](examples/instancing3d/)               | Animated InstancedMesh batches, frustum-culled probe meshes, RenderStats, unclamped RAF fps                                                                                                                            |
| [picking3d](examples/picking3d/)                     | Nested Groups, OrbitControls, Raycaster picking, perspective／orthographic switch, reparenting                                                                                                                         |
| [gltf3d](examples/gltf3d/)                           | GLTFLoader skinned clip playback, MorphTargets driven by sliders and a weights keyframe clip                                                                                                                           |
| [authoring-lab](examples/authoring-lab/)             | P41 formal root consumer: canvas UI／native semantic focus／modal, action contexts／virtual controls, leased textures／bounded warmup, typed content／save-load                                                        |
| [beacon-run](examples/beacon-run/)                   | P42 playable reference: loading/menu, four-beacon extraction, 3D physics/navigation/skinned animation, HUD/pause/settings, trusted sound or muted play, local save/load/restart and teardown; scoped GPU/GL acceptance |
| [lightweight2d](examples/lightweight2d/)             | Animated firefly garden, pause/resume/reset/destroy, render stats and lazy-service initialization                                                                                                                      |
| [resource-lifecycle](examples/resource-lifecycle/)   | Shared ResourceScope leases, failed-release retry, in-memory saves and guarded fresh candidate publication                                                                                                             |
| [character-platforms](examples/character-platforms/) | Moving lift, rotating support, jump, crouch and ceiling-blocked standing                                                                                                                                               |
| [joints3d](examples/joints3d/)                       | Distance/Hinge/BallSocket joints, motor, suspended chain and constraint error                                                                                                                                          |
| [ccd3d](examples/ccd3d/)                             | Dynamic-pair and rotational CCD on/off, a real fixed step, contacts and solver counters                                                                                                                                |
| [navigation-bake](examples/navigation-bake/)         | Collision-surface bake, shared Scene work quota and many navigation followers                                                                                                                                          |
| [text-i18n](examples/text-i18n/)                     | Native retained editing, bidi/disjoint selection, graphemes and declared/system font fallback                                                                                                                          |
| [audio-effects](examples/audio-effects/)             | Trusted unlock, native bus effects, overlapping ducking, automation and bound spatial sources                                                                                                                          |
| [rendering2d](examples/rendering2d/)                 | Shared 2D rendering／共用 2D rendering／共通 2D 描画                                                                                                                                                                   |
| [objects3d](examples/objects3d/)                     | Objects and weighted transparency／物件與加權透明／物体と加重透明                                                                                                                                                      |
| [shadows3d](examples/shadows3d/)                     | Native shadows／原生陰影／native shadow                                                                                                                                                                                |
| [physics2d-lab](examples/physics2d-lab/)             | Joints, sleep, collisions／約束休眠碰撞／拘束・sleep・衝突                                                                                                                                                             |
| [animation-lab](examples/animation-lab/)             | Animation authoring／動畫編排／animation 操作                                                                                                                                                                          |
| [save-lab](examples/save-lab/)                       | Content save/rebuild／內容存檔重建／content 保存再構築                                                                                                                                                                 |
| [motion2d](examples/motion2d/)                       | Kinematic support/character/rotational CCD／平台角色回轉 CCD／platform・character・回転 CCD                                                                                                                            |
| [locomotion3d](examples/locomotion3d/)               | Fixed animation/controller locomotion／固定角色運動／fixed 移動                                                                                                                                                        |
| [world-visibility](examples/world-visibility/)       | Visibility/LOD/HLOD/native queries／可見集合原生查詢／visibility・native query                                                                                                                                         |
| [native-material3d](examples/native-material3d/)     | Native material/bounded lighting／原生材質多燈／native material・上限照明                                                                                                                                              |
| [world-streaming](examples/world-streaming/)         | Cell/resource/physics/navigation lifetime／分區生命週期／cell lifecycle                                                                                                                                                |
| [cpu-workers](examples/cpu-workers/)                 | Native geometry jobs/copy-transfer costs／原生工作複製成本／native jobs・copy cost                                                                                                                                     |
| [tiled-import](examples/tiled-import/)               | Orthogonal JSON/atlas flips/colliders／正交地圖碰撞／orthogonal map・衝突                                                                                                                                              |
| [gpu-particles3d](examples/gpu-particles3d/)         | Native GPU particles／原生 GPU 粒子／native GPU particles                                                                                                                                                              |
| [accessibility-game](examples/accessibility-game/)   | Bilingual playable keyboard/preferences flow／雙語鍵盤偏好流程／英語・繁中 keyboard flow                                                                                                                               |
| [asset-recipe](examples/asset-recipe/)               | Asset recipe/deployment／資產部署／asset deployment                                                                                                                                                                    |

`cube3d`, `fallback-demo`, `showcase`, `physics2d`, `particles2d`, `tilemap2d`, `transitions2d`, `ui2d`, `input-lab` and `audio-lab` accept `?renderer=auto|webgpu|webgl2|canvas2d`; `pbr3d`, `instancing3d`, `picking3d`, `gltf3d` and `beacon-run` are 3D-only and show a clear message on Canvas2D. Beacon Run accepts the same renderer query; see its [play guide](docs/USAGE.md#play-beacon-run). Canvas2D showcase retains 2D + audio and omits 3D. In `particles2d`, world-space emitters inside an additive `IsolatedGroup2D` rendered nothing in the recorded Canvas2D probe, so fire emits in local space there.

Static site／完整靜態網站／静的サイト：`npx pnpm@12.6.0 build:site` → `npx pnpm@12.6.0 smoke:site`. Deploy **all `.vite/site/`**, including complete `engine/` (dist/workers/worklets/vendor), to HTTP/HTTPS root/subpath with directory indexes. 部署全部網站樹，保留完整引擎與 directory index。全サイト tree と完全 engine を directory index 対応 host に配置します。

Smoke owns a separate muted browser and native zero-gain output sinks; signal evidence is not audible-output, Safari, physical-device or assistive-technology certification. Smoke 僅用自有靜音 browser／zero-gain sinks，不冒稱可聽輸出、Safari、實機或輔具認證。独立 muted browser／zero-gain sinks の信号は可聴出力・Safari・実機・支援技術の認証ではありません。

Standalone consumer／獨立 consumer／独立 consumer：`node scripts/create-game.mjs /absolute/new-game --template 2d --package /absolute/xyz.js-1.12.2.tgz --name my-game` (or `3d` / built package directory), then `npx pnpm@12.6.0 --dir /absolute/new-game install` and `dev`/`build`. Destination must be empty; deploy the entire starter `dist/`. 使用空目的目錄與本機套件，部署全部 starter `dist/`。空 destination と local package を使い、starter `dist/` 全体を配置します。

`lightweight2d`, `resource-lifecycle`, `text-i18n`, `audio-effects`, `motion2d`, `tiled-import` and `accessibility-game` offer portable 2D paths. Native 3D examples require WebGPU/WebGL2 and report Canvas2D unsupported. Trusted audio unlock is still required; physical audio and OS IME remain outside automated certification.

## Scene／Core World

```ts
import { Game, Scene, GameObject } from 'xyz.js';

class MovingScene extends Scene {
  player = this.add(new GameObject());
  override update(dt: number): void {
    this.player.position.x += 120 * dt;
  }
}
const game = await Game.create({ canvas: '#game' });
await game.setScene(new MovingScene());
game.start();
await game.setScene(new Scene());
game.destroy();
```

Scene 是 world 容器；GameObject 無視覺外觀，Sprite 加上貼圖呈現。切換先準備新 Scene，成功才清理舊 Scene；失敗保留舊 Scene，取消時提供 AbortSignal。Scene owns its objects; successful switching destroys the old Scene, while preparation failure preserves it. Scene は Entity ではなく lifecycle 容器であり、切替失敗時は旧 Scene を保持します。詳見 [生命週期契約](docs/TECHNICAL-zh.md#10-core-worldp02)。

## Texture／Sprite

```ts
import { Scene, Sprite } from 'xyz.js';

const texture = await game.assets.loadTexture('/image.png');
const scene = new Scene();
scene.add(new Sprite({ texture, position: [160, 120], opacity: 0.75 }));
await game.setScene(scene);
game.start();
```

`/examples/sprite/` demonstrates shared textures, transforms, opacity and z-order. Sprite destruction does not destroy its shared Texture; `game.assets` owns cached textures until Game destruction. Anchor defaults to the image center; coordinates use logical CSS pixels, right/down positive.

## Camera／Input

`scene.camera2D.position` is the world coordinate at the viewport's top-left; `zoom` scales both axes uniformly. `worldToScreen` and `screenToWorld` use logical pixels, independent of DPR. `game.input.keyboard.isDown('ArrowUp')`, `.wasPressed(code)`, `.wasReleased(code)` expose held/edge state. Pointer uses the same methods with button numbers and `.position`; `game.input.gamepads` retains browser slot indices. Edges are available during Scene updates and cleared afterward. Blur, hidden pages, pause and destruction clear held state.

## 3D

```ts
import { Mesh, Geometry, TextureMaterial } from 'xyz.js';
const cube = scene.add(
  new Mesh({
    geometry: Geometry.cube(),
    material: new TextureMaterial({ texture, color: [1, 0.8, 0.6] }),
    position: [0, 0, 0],
  }),
);
cube.rotation.setFromEuler(0.2, 0.5, 0);
scene.camera3D.position.set(0, 0, 5);
```

`Geometry.sphere()`, `.plane()`, `.quad()` and custom indexed position/normal/UV data are supported. Index topology stays immutable; after deliberately changing vertex data, call `geometry.markUpdated()` to increment its version and notify GPU upload caches. Angles are radians; cameras look along local −Z. Legacy TextureMaterial keeps ambient/directional diffuse lighting. See [advanced 3D contracts](docs/TECHNICAL.md#21-advanced-3d-p09p12) and [usage](docs/USAGE.md#11-advanced-3d).

## Compatibility

`auto` initializes backends on isolated canvases and copies the selected output to the original canvas through Canvas2D. This preserves DOM/input ownership and permits fallback after context binding, at the cost of one presentation copy per frame. Explicit `webgpu`, `webgl2`, or `canvas2d` renders directly. `Primitive2D.rectangle(width,height,color)` and `.circle(radius,color)` asynchronously create owned rasterized shapes usable on all backends. `cube3d/?renderer=canvas2d` explicitly reports that 3D is unavailable.

## Audio

```ts
const sound = await game.audio.load('/sound.json');
// Inside a user gesture:
await game.audio.unlock();
sound.play({ channel: 'sfx' });
game.audio.master.volume = 0.8;
```

JSON contains an official OPM `voice` and nonempty `notes: [{ note: 60, time: 0, duration: 0.2 }]` (MIDI 0–127; time ≥0 and duration (0,60] seconds). Optional `channel`, `loop`, and `duration` select defaults and loop period; the period cannot end before the last note. `music`, `sfx`, `ui`, and `master` expose volume 0–1. Playback belongs to the current Scene unless another `scene` is provided or `persistent: true`; without a current Scene it lasts until stopped/ended or Game destruction. Scene teardown cancels its nonpersistent notes and release tails. Game pause does not pause audio. The eight-slot budget includes release; only the oldest SFX can be stolen, and a saturated budget with no SFX skips the incoming note. Eight isolated official OPM instances prevent global voice stealing from cutting BGM, at the cost of eight AudioContexts/worklets. See [sample JSON](examples/sprite/sfx.json), [vendor provenance](vendor/opm/manifest.json), and [technical details](docs/TECHNICAL.md).

## Diagnostics & benchmark

`import { logger } from 'xyz.js'; logger.level = 'debug';` enables backend diagnostics. Levels: `debug`, `info`, `warn` (default), `error`, `silent`; methods use the `[XYZ]` prefix.

Run `npx pnpm@12.6.0 dev`, open `/benchmarks/sprites/`, and keep the tab visible. The [benchmark source](benchmarks/sprites/) uses 1,000 moving resident Sprites, one texture, 1280×720 backing, DPR 1, 120 warmup and 600 measured frames. Default is direct WebGPU; `?renderer=auto`, `webgl2` or `canvas2d` selects another path. It drives Renderer from its own RAF rather than Game.start, reporting frame intervals and CPU begin/render/end submission separately; it is not an end-to-end Game Loop or GPU/GC timing measurement. P08 recorded **59.9988 fps**, CPU submit mean **0.6358 ms**, p95 **1.2 ms**; no cross-device guarantee.

Post-P08 maintenance removes redundant viewport uploads and unconditional ECS compaction, and fixes held keys after focus moves into an input field. The subsequent run passed **75 tests**; timing did **not** establish a CPU/FPS improvement. Before/after measurements and limits are recorded in [ACCEPTANCE.md](ACCEPTANCE.md).

## Asset safety limits

URL-loaded images are capped at 8 MiB of response bytes; audio JSON at 1 MiB and 16,384 notes. Texture dimensions are capped at 8,192 per side and 4,194,304 pixels, including `Texture.fromImage`. Limits are centralized in `src/data/assets.ts`; oversized assets reject rather than truncate or downscale.

All browser-supported image formats remain available. Pixel validation occurs **after decoding**, so these limits do not prevent transient decoder memory amplification. They are per-asset limits, not a total cache/memory budget. Only load trusted images where that residual risk is unacceptable. Security verification and remaining limits are recorded in [ACCEPTANCE.md](ACCEPTANCE.md).

## Post-v1.0 gameplay additions / v1.0 後遊戲開發擴充

- **Text2D**：引擎內多行文字、非同步更新與自有貼圖清理，沿用三種 renderer 的 Sprite 路徑。
- **Scene timers**：`scene.timers.after()`／`every()` 使用模擬秒數，暫停凍結、Scene 清理取消，無須自行維護 browser timeout。
- Pong 現在使用畫布內計分、延遲發球，並提供 Pause／Resume／Restart scene。
- Text2D provides owned, asynchronously updateable text Sprites; scene timers follow simulation time and scene lifetime. See the bilingual usage guides for examples.
- These additions originally shipped in **v1.1** (package **1.1.0**), not the earlier **v1.0** release. 此為歷史新增範圍；既有 v1.0 tag 與發佈附件保持不變，npm仍未發佈，目前metadata見頁首。

# XYZ.js

Browser-native TypeScript game engine. Package metadata is **1.8.0**, licensed under **Apache-2.0** (see [LICENSE](LICENSE)); npm is unpublished. The recorded pre-P40 local integration passed build/typecheck/lint/format and **69 files/545 tests**. This is historical evidence, not a P40–P42 pass; scoped Chromium observations and unverified limitations are in [ACCEPTANCE](ACCEPTANCE.md). Historical release assets up to v1.5 retain their original `UNLICENSED` metadata.

GitHub **v1.8** uses `xyz.js-1.8.0.tgz` and `SHA256SUMS`. It adds P40 rendering metrics/batching and browser regression, P41 retained UI/input contexts/resource budgets/warmup/typed authoring, and P42 native GPU skinning/mip textures, bounded 3D dynamics/navigation/animation profiles and the complete Beacon Run reference. Support is limited to the documented profiles, not full upstream parity or cross-browser certification. Earlier releases remain unchanged; v1.7 introduced extended 3D rendering and opt-in weighted transparency. Deploy the complete `dist/` tree, including `dist/vendor/opm/`.

文件導覽／Documentation／資料：[計畫與範圍](PLAN.md) · [驗收與 commits](ACCEPTANCE.md) · [設計](DESIGN.md) · 使用說明 [English](docs/USAGE.md)／[繁體中文](docs/USAGE-zh.md) · 技術參考 [English](docs/TECHNICAL.md)／[繁體中文](docs/TECHNICAL-zh.md) · [執行指引](AGENTS.md) · [工作約定](CLAUDE.md)。

## 繁體中文

### 目前可用

引擎提供 Game／Scene／ECS、2D／3D Math、Texture／Sprite、Camera／Input 與 Mesh 深度／光照管線。`auto` 依 WebGPU→WebGL2→Canvas2D 初始化降級；強制 backend 失敗不切換。以 `game.graphics.capabilities.threeD` 判斷 3D 支援，Canvas2D 只有 2D。WebGPU 需要安全來源（localhost 可用）。Audio 使用官方 OPM.js；在使用者手勢中呼叫 `await game.audio.unlock()`。

新增 3D：Object3D／Group 階層、透視／正交相機與 lookAt、OrbitControls、精確 Raycaster、glTF 2.0／GLB、關鍵幀與 native GPU skin palette（lazy exact CPU queries／保守 animated bounds）、PBR／點光源／聚光燈、方向光 PCF 陰影、InstancedMesh，以及 HDR exposure／ACES／bloom（2D overlay 不受影響）。P42 的 bounded physics／navigation／animation profiles 與 Beacon Run 已限定 Chromium 驗收。API 參考 three.js，非 drop-in replacement／全 addons；無新 runtime dependency。詳細限制見雙語技術參考。

P13 新增既有 GameObject 的 2D 階層／Group2D、atlas Sprite source／SpriteSheet、FrameAnimation、SpriteFont／SpriteText、NineSlice 與 ScreenElement HUD，已驗三 backend 正式路徑。Sprite width／height 是自然 source 尺寸，縮放用 scale；Sprite.source 可為 fractional pixels，SpriteSheet frames 為 integer。`/examples/gameplay2d/` 展示動畫／字形／面板／HUD。

P18 已完成限定 Chromium 驗收：PreloadBatch task-count progress、Scene.preload→initialize barrier／Game.loading、bounded text／JSON／binary、unique GLTFLoader.task 與 native PCM/WAV sample alongside OPM。Unlock 前只 fetch，decode／play 要手勢 unlock，重用第一個 OPM context（共八個，不建第九個）；Game pause 不自動暫停音訊。沒有跨瀏覽器／新效能或聽見喇叭聲聲明。

P14–P20 歷史驗收：target-only lifecycle／pointer／drag、Actions／CameraStrategies、discrete circle／box／convex physics、maps、CPU particles、native GPU／GL 2D effects 與三 backend whole-frame transitions；正式 playground／完整工具鏈為 37 檔／252 tests。這不是目前功能上限：P31 已加入有限 CCD、sleep、joints 與 static concave／chain。GPU particles／editor importer 仍不提供。Native Material2D／PostProcessor2D 需先 await prepare；Canvas2D 明確拒絕，prepared entries 跨 resize／disable 保留，mutable targets 釋放、owned captures 保留／scale。詳見雙語 guides。

P21–P29 已批准有限 PixiJS-inspired profiles 已整合為 source 並在單一環境（macOS arm64 managed headless Chromium，含 WebGPU adapter）實測：三 backend 共用 2D command stream、affine／atlas／raster paths／offscreen isolation／masks／blends／native filters-mesh／text-assets／opt-in interaction-accessibility／particles-preparation，正式範例 [examples/rendering2d](examples/rendering2d/index.html) 於三 backend 執行；Canvas native filters／visible mesh 明確拒絕。這**不是** full Pixi parity、跨瀏覽器／真實硬體／效能證明，也未納入 GitHub v1.2；驗證範圍與未驗項見 [ACCEPTANCE](ACCEPTANCE.md)，profiles 見 [PLAN](PLAN.md)。

本輪新增 fixed gameplay／時間加權 force 與 opt-in physics presentation；使用 `Scene.fixedUpdate()`、`new Scene({ interpolatePhysics: true })`，不要從 hook 再呼叫 physics world update。新驗收與限制見 [ACCEPTANCE](ACCEPTANCE.md)，歷史測試數仍保留。

本輪 production 擴充：

- P44：共用 CI／release browser gate，保留實際 native submitted-frame pixels 與失敗證據；hosted Ubuntu 結果不由本機推論。
- P45：共用 3D AABB hierarchy 與 candidate statistics；公開 mutable transforms 的 refresh 仍為 O(n)。
- P46：有 expansion budget、可取消及 revision invalidation 的 incremental grid／graph A*。
- P47：動態 authored connections／clearance 與實際 character 阻擋後有限重新規劃。
- P48：[混合負載與 lifecycle soak](benchmarks/mixed/index.html)，分開 RAF／CPU phases／cache estimates。
- P49：stable-ID 2D／3D／動態 content topology、body 與 custom state save／rebuild。
- P50：[固定版本 asset recipe](docs/ASSET-RECIPE.md)、mip／fallback outputs、checksums 與真 extracted-package 部署驗證。
- P51：`UITextInput` 以透明原生 input 處理 IME／selection／editing，視覺維持 canvas。
- P52：`UIScrollView`／`UIVirtualList`、clip-aware input／focus reveal 與 bounded keyed rows。
- P53：static `TriangleMeshCollider3D`／triangle BVH、實際 contacts／ray／sweep。

### 目前支援矩陣與已批准擴充

| 能力           | 目前契約／限制                                                                                                                                                                                                                                                                                                       |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2D／3D backend | 三 backend 共用 2D ordering／isolation／masks；3D、native Material2D／Filter2D／Mesh2D 僅 WebGPU／WebGL2，Canvas2D 明確拒絕，不切 backend。                                                                                                                                                                          |
| Physics2D      | CCD 僅 dynamic 平移對 static 非 sensor，不 sweep 旋轉／dynamic 配對；sleep 與五種 joints；concave／chain 僅 static 凸片段，不是 dynamic 凹形剛體。                                                                                                                                                                   |
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

工具鏈要求 Node >=26、pnpm 12.6.0。執行 `npx pnpm@12.6.0 install`、`npx pnpm@12.6.0 dev`，開啟 `http://127.0.0.1:5173/examples/triangle/`；完整檢查是同一 pnpm 版本的 `build`、`typecheck`、`test`、`lint`、`format:check`。P08 的 2026-09-30 紀錄為五項通過、16 檔／73 測試通過，詳見 [驗收紀錄](ACCEPTANCE.md)。build 輸出 JS、`.d.ts` 與官方 vendor；無 bundler 時完整複製 `dist/`（含 `dist/vendor/opm/`），再從 `/vendor/xyz/dist/src/index.js` 等部署 URL import。根套件目前為 Apache-2.0（見 [LICENSE](LICENSE)）；舊 release 的 UNLICENSED metadata 不回寫，OPM vendor 保留自身授權。

Build 自動最小化 `dist/` 的引擎 JavaScript，保留 ESM 目錄、公開名稱、宣告與 source maps；官方已最小化的 OPM vendor 原樣複製。歷史量測為 36 個引擎 JS 約減少 48% 體積，當時安全修正與發佈驗證為 17 檔／82 測試通過；不是目前最新驗收或新效能證明。

v1.4／v1.5 歷史新增（additive、無新 runtime dependency）：空間 sample audio／listener、標準 Gamepad、glTF morph／常用 extensions、EnvironmentMap IBL／skybox、frustum culling／fog、WebGPU 4× MSAA、半透明排序、effects3D、FirstPersonControls、graphics.stats與GPU／GL loss recovery。RenderTexture／snapshot在loss後需重建。WebGPU真device loss、Pointer Lock實機、實體gamepad與空間音效聽感仍未認證；目前 P36b 已支援 `COLOR_0`，P32 已有 meshopt／有限KTX2 decode與外部Draco／Basis接口（見上方矩陣），不可再誤寫成全部拒絕。

新增 opt-in `scene.transparency = 'weighted'`（WebGPU／WebGL2）：加權透明近似，預設 sorted 不變；objects3d 可切換並反轉插入順序。不是精確逐像素排序或多層折射，WebGL2 需 float color attachment。驗證範圍見 [ACCEPTANCE](ACCEPTANCE.md)。

可執行範例：`triangle`、`sprite`、`pong`、`cube3d`、`fallback-demo`、`showcase`（2D＋3D＋音訊同場）、`advanced3d`（進階 3D，含 Environment 與 fog）、`gameplay2d`、`rendering2d`。驗收證據見 `ACCEPTANCE.md`；本倉庫不自動 push／publish。

已驗證 managed Chromium 150；Safari／Edge／Firefox、實體 gamepad、真實背景分頁／BFCache 矩陣、跨螢幕 DPR 與 driver reset 尚未認證。WebGPU／AudioWorklet 需要安全來源；benchmark 的約 60fps 不是跨裝置保證。

## English

### Available now

Game/Scene/ECS, 2D/3D math, Texture/Sprite, camera/input and lit, depth-tested Mesh rendering are available. `auto` tries WebGPU→WebGL2→Canvas2D including initialization failures; forced backends never fall back. Check `game.graphics.capabilities.threeD`: Canvas2D is 2D-only. WebGPU requires a secure origin. Audio uses official OPM.js; call `await game.audio.unlock()` from a user gesture.

Advanced 3D includes Object3D/Group hierarchies, perspective/orthographic cameras and lookAt, OrbitControls, exact Raycaster picking, glTF 2.0/GLB, keyframes and native GPU skin palettes (lazy exact CPU queries/conservative animated bounds), PBR/point/spot lights, directional PCF shadows, InstancedMesh and HDR exposure/ACES/bloom before the unaffected 2D overlay. P42 bounded physics/navigation/animation profiles and Beacon Run passed scoped Chromium acceptance. The API is three.js-inspired, not drop-in/all-addon parity; no runtime dependency was added. See the bilingual technical references.

P13 adds 2D hierarchy/Group2D, atlas Sprite source/SpriteSheet, FrameAnimation, SpriteFont/SpriteText, NineSlice and ScreenElement HUD to existing GameObject, exercised on all three backends. Sprite width/height are natural source dimensions; use scale. Sprite.source permits fractional pixels; SpriteSheet frames require integer pixels. Open `/examples/gameplay2d/` for animation, glyphs, panels and HUD.

P18 is accepted in the recorded Chromium scope: task-count PreloadBatch, Scene.preload→initialize barrier/Game.loading, bounded text/JSON/binary, uniquely owned GLTFLoader.task, native PCM/WAV samples alongside OPM. Preunlock fetch does not decode; gesture unlock is required for decode/play, reusing the first OPM context (eight total, no ninth). Game pause does not pause audio. No new cross-browser/performance or speaker-audibility claim.

Historical P14–P20 acceptance covers target-only lifecycle/pointer/drag, Actions/camera strategies, discrete circle/box/convex physics, maps, CPU particles, native GPU/GL 2D effects and three-backend whole-frame transitions; the formal playground/full toolchain recorded 37 files/252 tests. This is not the current ceiling: P31 adds bounded CCD, sleep, joints and static concave/chains. GPU particles/editor importers remain unsupported. Prepare native Material2D/PostProcessor2D before use; Canvas2D explicitly rejects them. Prepared entries survive resize/disable, mutable targets release and owned captures survive/scale. See the bilingual guides.

P21–P29 are approved bounded PixiJS-inspired profiles, now integrated and exercised in one environment only (macOS arm64 managed headless Chromium with a WebGPU adapter): one shared 2D command stream across all three backends for affine utilities, atlases, raster paths, offscreen isolation, masks, blends, native filters/meshes, text/assets, opt-in interaction/accessibility and particles/preparation. The formal [examples/rendering2d](examples/rendering2d/index.html) example runs on all three; Canvas explicitly rejects native filters and visible meshes. This is neither full Pixi parity nor cross-browser, real-hardware or performance evidence, and it is not part of GitHub v1.2. See [ACCEPTANCE](ACCEPTANCE.md) for verified scope and unverified items, and [PLAN](PLAN.md) for the profiles.

Fixed gameplay, time-weighted forces and opt-in physics presentation use `Scene.fixedUpdate()` and `new Scene({ interpolatePhysics: true })`; do not manually advance physics from that hook. New evidence and limits are in [ACCEPTANCE](ACCEPTANCE.md); historical counts remain historical.

Production additions in this round:

- P44: shared CI/release browser gate with native submitted-frame pixels and failure evidence; local success is not hosted Ubuntu proof.
- P45: shared 3D AABB hierarchy and candidate statistics; mutable public poses still need O(n) refresh.
- P46: incremental grid/graph A* with expansion budgets, cancellation and revision invalidation.
- P47: dynamic authored connections/clearance and bounded replanning after real character blockage.
- P48: [mixed load/lifecycle soak](benchmarks/mixed/index.html), separating RAF, CPU phases and cache estimates.
- P49: stable-ID 2D/3D/dynamic content topology, body and custom-state save/rebuild.
- P50: [pinned asset recipe](docs/ASSET-RECIPE.md), mip/fallback outputs, checksums and real extracted-package deployment.
- P51: `UITextInput` uses transparent native editing/IME/selection with canvas visuals.
- P52: `UIScrollView`/`UIVirtualList`, clip-aware input, focus reveal and bounded keyed rows.
- P53: static `TriangleMeshCollider3D`/triangle BVH with real contacts/ray/sweep.

### Current support matrix and approved expansion

| Capability       | Current contract / restriction                                                                                                                                                                                                                                                                                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2D / 3D backends | All three share 2D ordering/isolation/masks; 3D and native Material2D/Filter2D/Mesh2D require WebGPU/WebGL2. Canvas2D explicitly rejects them without switching backend.                                                                                                                                                                                                                |
| Physics2D        | CCD sweeps dynamic translation against static non-sensors only, not rotation/dynamic pairs; sleep and five joint types; concave/chains are static convex pieces, not dynamic concave bodies.                                                                                                                                                                                            |
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

Use Node >=26 and pnpm 12.6.0: `npx pnpm@12.6.0 install`, then `npx pnpm@12.6.0 dev` and open `http://127.0.0.1:5173/examples/triangle/`. Run `build`, `typecheck`, `test`, `lint`, and `format:check` with the same pnpm version. The historical P08 run on 2026-09-30 passed all five, with 16 files / 73 tests; see [ACCEPTANCE.md](ACCEPTANCE.md). npm is unpublished; resolve bare imports through a local tarball or resolver. For unbundled use, copy the **entire** built `dist/` tree, including `dist/vendor/opm/`, and import a deployed URL such as `/vendor/xyz/dist/src/index.js`. The current root package is Apache-2.0 ([LICENSE](LICENSE)); old releases retain their UNLICENSED metadata, and OPM retains its own vendor license.

Build automatically minifies engine JavaScript in `dist/`, preserving the ESM tree, public names, declarations and source maps; the already-minified official OPM vendor is copied unchanged. Historical measurements recorded about 48% reduction across 36 engine JS files and 17 files / 82 tests for the then-current security/distribution verification. These are not the latest acceptance or a new performance claim.

Historical v1.4/v1.5 additions (additive, no new runtime dependency): spatial sample audio/listener, standard Gamepad, glTF morph/common extensions, EnvironmentMap IBL/skybox, frustum culling/fog, WebGPU 4× MSAA, blended sorting, effects3D, FirstPersonControls, graphics.stats and GPU/GL loss recovery. Recreate RenderTexture/snapshot handles after loss. Real WebGPU loss, hardware Pointer Lock/gamepads and spatial-audio listening remain uncertified. Current P36b supports `COLOR_0`; P32 provides meshopt, bounded KTX2 decoding and external Draco/Basis interfaces (matrix above), not blanket rejection.

Runnable examples: `triangle`, `sprite`, `pong`, `cube3d`, `fallback-demo`, `showcase` (2D + 3D + audio), `advanced3d` (with Environment and fog), `gameplay2d` and `rendering2d`. See `ACCEPTANCE.md` for evidence and limitations. This repository does not push or publish automatically.

Verified in managed Chromium 150. Safari/Edge/Firefox, physical gamepads, real background-tab/BFCache matrices, cross-monitor DPR and driver resets are not certified. WebGPU/AudioWorklet require a secure origin. The ~60 fps benchmark result is not a cross-device guarantee.

## 日本語

### 現在利用可能

Game／Scene／ECS、2D／3D 数学、Texture／Sprite、Camera／Input、深度と照明付き Mesh を提供します。`auto` は初期化失敗時も WebGPU→WebGL2→Canvas2D の順に降格します。強制 backend は切り替えません。`game.graphics.capabilities.threeD` で判定し、Canvas2D は 2D 専用です。WebGPU はセキュアなオリジンが必要です。音声は公式 OPM.js を使用し、ユーザー操作から `await game.audio.unlock()` を呼び出します。

高度な 3D は Object3D／Group 階層、透視／正投影カメラと lookAt、OrbitControls、正確な Raycaster、glTF 2.0／GLB、キーフレームと native GPU skin palette（lazy exact CPU queries／保守的 animated bounds）、PBR／点光源／スポットライト、方向光 PCF シャドウ、InstancedMesh、2D overlay 前の HDR exposure／ACES／bloom を提供します。P42 の限定 physics／navigation／animation profiles と Beacon Run は Chromium の限定環境で検証済みです。Three.js 参考 API は互換置換／全 addons 対応ではなく、runtime dependency 追加なし。制限は技術参照へ。

P13 は既存 GameObject の2D階層／Group2D、atlas source／SpriteSheet、FrameAnimation、SpriteFont／SpriteText、NineSlice、ScreenElement HUD を三backendで検証済みです。Sprite width／height は自然サイズ、表示サイズはscale、sourceは小数pixel可、SpriteSheet framesは整数のみ。`/examples/gameplay2d/` で確認できます。

P18 は限定Chromium環境で検証済みです：PreloadBatch progress、Scene.preload→initialize／Game.loading、有界readers、unique GLTFLoader.task、OPMと併用するPCM/WAV sample。Unlock前はfetchのみ、decode／playはユーザー操作unlockが必要、最初のOPM contextを再利用（合計八個、九個目なし）。Game pauseは音声を停止しません。他browser／新性能／スピーカーで聞こえたとの主張はありません。

P14–P20 の歴史的検証範囲は target-only lifecycle／pointer／drag、Actions／camera、discrete circle／box／convex physics、maps、CPU particles、GPU／GL native 2D effects、三 backend whole-frame transitions です。正式 playground／toolchain の記録は 37 files／252 tests。現在の上限ではなく、P31 で限定 CCD／sleep／joints／static concave／chain を追加しました。GPU particles／editor importer は未対応です。Native Material2D／PostProcessor2D は prepare を await し、Canvas2D は明示的に拒否します。Prepared entries は resize／disable で保持、mutable targets は解放、owned captures は保持／scale します。双語 guides を参照してください。

P21–P29 の限定 PixiJS-inspired profiles は統合済みで、単一環境（macOS arm64 の managed headless Chromium、WebGPU adapter あり）でのみ実行確認しました。三 backend が共通の 2D command stream を使い、正式サンプル [examples/rendering2d](examples/rendering2d/index.html) も三 backend で動作します。Canvas の native filters／visible meshes は明示的に拒否します。完全な Pixi 互換、クロスブラウザ／実ハードウェア／性能の証明ではなく、GitHub v1.2 にも含まれません。検証範囲と未検証項目は [ACCEPTANCE](ACCEPTANCE.md)、profile は [PLAN](PLAN.md) を参照してください。

Fixed gameplay／時間加重 force／opt-in physics presentation は `Scene.fixedUpdate()` と `new Scene({ interpolatePhysics: true })` を使います。Hook 内で physics を二重更新しないでください。新しい証拠と制限は [ACCEPTANCE](ACCEPTANCE.md)、旧テスト数は当時の記録です。

今回の production 拡張：

- P44：native submitted-frame pixels／失敗証拠を残す共通 CI／release browser gate。本機の成功は hosted Ubuntu の証明ではありません。
- P45：共用 3D AABB hierarchy／candidate statistics。公開 mutable pose の refresh は O(n) です。
- P46：expansion budget／cancel／revision invalidation 対応の incremental grid／graph A*。
- P47：動的 authored connections／clearance と実 character の障害後の bounded replan。
- P48：[mixed load／lifecycle soak](benchmarks/mixed/index.html)。RAF／CPU phases／cache estimates は別に計測します。
- P49：stable-ID の 2D／3D／動的 content topology、body、custom state の save／rebuild。
- P50：[固定版 asset recipe](docs/ASSET-RECIPE.md)、mip／fallback outputs、checksums、実 extracted-package deploy。
- P51：`UITextInput` は透明 native input で IME／selection／editing を処理し、visuals は canvas に維持します。
- P52：`UIScrollView`／`UIVirtualList`、clip-aware input／focus reveal／bounded keyed rows。
- P53：static `TriangleMeshCollider3D`／triangle BVH、実 contacts／ray／sweep。

### 現在の対応表と承認済み拡張

| 機能           | 現在の契約／制限                                                                                                                                                                                                                                                                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2D／3D backend | 三 backend で 2D ordering／isolation／masks を共有。3D、native Material2D／Filter2D／Mesh2D は WebGPU／WebGL2 のみ。Canvas2D は拒否し backend を切り替えません。                                                                                                                                                                                            |
| Physics2D      | CCD は dynamic の平行移動対 static 非 sensor のみで回転／dynamic 同士は対象外。Sleep と五種の joints、static concave／chain 凸片分割に対応し、dynamic 凹形 body ではありません。                                                                                                                                                                            |
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

Node >=26 と pnpm 12.6.0 を使用します。`npx pnpm@12.6.0 install`、`npx pnpm@12.6.0 dev` を実行し、`http://127.0.0.1:5173/examples/triangle/` を開きます。同じ pnpm で build／typecheck／test／lint／format:check を実行します。2026-09-30 の歴史的 P08 記録は全項目と 16 ファイル／73 テスト通過です（[検証記録](ACCEPTANCE.md)）。npm 未公開のため bare import はローカル tarball 等で解決してください。bundler なしでは `dist/vendor/opm/` を含む `dist/` **全体**を配置し `/vendor/xyz/dist/src/index.js` 等から import します。現在の root は Apache-2.0（[LICENSE](LICENSE)）、旧 release の UNLICENSED metadata は保持し OPM vendor のライセンスも別途維持します。

Build は `dist/` の JavaScript を自動最小化し ESM 構造、公開名、型宣言、source maps を保持します。最小化済み公式 OPM vendor はそのままコピーします。歴史的量測は 36 ファイルで約 48% 減、当時の安全性／配布検証は 17 ファイル／82 テスト通過です。最新検証や新しい性能証明ではありません。

v1.4／v1.5 の歴史的追加（additive、runtime dependency 追加なし）：空間 sample audio／listener、標準 Gamepad、glTF morph／主要 extensions、EnvironmentMap IBL／skybox、frustum culling／fog、WebGPU 4× MSAA、半透明ソート、effects3D、FirstPersonControls、graphics.stats、GPU／GL loss recovery。Loss 後の RenderTexture／snapshot は再作成が必要です。実 WebGPU loss、実機 Pointer Lock／gamepad、空間音声の聴感は未認証。現在は P36b の `COLOR_0` と P32 の meshopt／限定 KTX2 decode／外部 Draco・Basis interface に対応し、一律非対応ではありません（上記表参照）。

`scene.transparency = 'weighted'` で WebGPU／WebGL2 の近似 weighted transparency を有効化できます。既定は sorted のままです。objects3d で切替と挿入順の反転を試せます。厳密なピクセル単位ソートや多層屈折ではなく、WebGL2 は float color attachment が必要です。検証範囲は [ACCEPTANCE](ACCEPTANCE.md) を参照してください。

実行可能なサンプル：`triangle`、`sprite`、`pong`、`cube3d`、`fallback-demo`、`showcase`（2D＋3D＋音声）、`advanced3d`（Environment と fog を含む）、`gameplay2d`、`rendering2d`。検証結果と制限は `ACCEPTANCE.md` を参照してください。このリポジトリは自動で push／publish しません。

managed Chromium 150 で検証済みです。Safari／Edge／Firefox、実機 gamepad、実際の背景タブ／BFCache 往復、モニター間 DPR と driver reset は未認証です。WebGPU／AudioWorklet にはセキュアなオリジンが必要です。約 60fps の測定値は全環境での保証ではありません。

## Examples／範例／サンプル

Run `npx pnpm@12.6.0 examples` (dev server plus browser at the gallery `http://127.0.0.1:5173/examples/`), or `dev` and open a `/examples/<name>/` URL yourself. The gallery lists every example with feature filters and per-backend links. Links below open the source directories. The examples added after 1.5.2 (physics2d through gltf3d) were each opened on the backends they support in the managed headless Chromium of the session that added them, with console errors checked; `audio-lab` and gamepad paths were verified by state readouts only (no speaker audibility, no physical gamepad), and no cross-browser claim is made.

| Example                                  | 驗證內容／Purpose                                                                                                                                                                                                      |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [triangle](examples/triangle/)           | WebGPU triangle；Pause／Resume／Destroy                                                                                                                                                                                |
| [sprite](examples/sprite/)               | Shared Texture、z-order／opacity、六聲部 BGM＋SFX                                                                                                                                                                      |
| [pong](examples/pong/)                   | Camera2D、keyboard／pointer／gamepad API、計分                                                                                                                                                                         |
| [cube3d](examples/cube3d/)               | Lit cube／sphere、depth、2D overlay；Canvas2D 明確不跑 3D                                                                                                                                                              |
| [fallback-demo](examples/fallback-demo/) | Backend selector、capabilities、Sprite／Primitive／Mesh                                                                                                                                                                |
| [showcase](examples/showcase/)           | 同 Scene 2D＋3D＋audio、volume、Scene switch／cleanup                                                                                                                                                                  |
| [advanced3d](examples/advanced3d/)       | Group、OrbitControls／picking、glTF skin、PBR／shadow／HDR bloom、24 instances                                                                                                                                         |
| [gameplay2d](examples/gameplay2d/)       | P13–P20 real root consumer: graphics／drag/actions/camera／physics/maps/particles／preload/audio／transitions；GPU/GL native effects, Canvas explicit rejection                                                        |
| [physics2d](examples/physics2d/)         | Static/dynamic bodies, circle/box/polygon, materials, sensor Trigger2D, gravity control                                                                                                                                |
| [particles2d](examples/particles2d/)     | ParticleEmitter presets (fountain/fire/snow/trail), bursts, nozzles, additive isolated layer                                                                                                                           |
| [tilemap2d](examples/tilemap2d/)         | Two TileMap layers, solid tile colliders, Camera2D follow/dead zone/bounds/shake/zoom                                                                                                                                  |
| [transitions2d](examples/transitions2d/) | fade／crossfade／slide between three Scenes, easing／duration／blockInput, cancel by newer request, Scene timers                                                                                                       |
| [ui2d](examples/ui2d/)                   | Text2D, SpriteFont／SpriteText, NineSlice, ScreenElement HUD, accessible pointer buttons                                                                                                                               |
| [input-lab](examples/input-lab/)         | Live Keyboard／Pointer／Gamepad state, runtime-rebindable ActionMap                                                                                                                                                    |
| [audio-lab](examples/audio-lab/)         | Gesture unlock, OPM music／SFX, PCM sample, channel volumes, PreloadBatch progress                                                                                                                                     |
| [pbr3d](examples/pbr3d/)                 | PBR metallic／roughness grid, shadows, point light, environment, fog, exposure／bloom                                                                                                                                  |
| [instancing3d](examples/instancing3d/)   | Animated InstancedMesh batches, frustum-culled probe meshes, RenderStats, unclamped RAF fps                                                                                                                            |
| [picking3d](examples/picking3d/)         | Nested Groups, OrbitControls, Raycaster picking, perspective／orthographic switch, reparenting                                                                                                                         |
| [gltf3d](examples/gltf3d/)               | GLTFLoader skinned clip playback, MorphTargets driven by sliders and a weights keyframe clip                                                                                                                           |
| [authoring-lab](examples/authoring-lab/) | P41 formal root consumer: canvas UI／native semantic focus／modal, action contexts／virtual controls, leased textures／bounded warmup, typed content／save-load                                                        |
| [beacon-run](examples/beacon-run/)       | P42 playable reference: loading/menu, four-beacon extraction, 3D physics/navigation/skinned animation, HUD/pause/settings, trusted sound or muted play, local save/load/restart and teardown; scoped GPU/GL acceptance |

`cube3d`, `fallback-demo`, `showcase`, `physics2d`, `particles2d`, `tilemap2d`, `transitions2d`, `ui2d`, `input-lab` and `audio-lab` accept `?renderer=auto|webgpu|webgl2|canvas2d`; `pbr3d`, `instancing3d`, `picking3d`, `gltf3d` and `beacon-run` are 3D-only and show a clear message on Canvas2D. Beacon Run accepts the same renderer query; see its [play guide](docs/USAGE.md#play-beacon-run). Canvas2D showcase retains 2D + audio and omits 3D. In `particles2d`, world-space emitters inside an additive `IsolatedGroup2D` rendered nothing in the recorded Canvas2D probe, so fire emits in local space there.

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

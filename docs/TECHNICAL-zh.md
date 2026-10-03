# XYZ.js 技術參考

[English](TECHNICAL.md) · 繁體中文

**目前支援規範：**[v1.12.4 契約](CURRENT.md)與 `pnpm docs:api` 生成的 root-export API。`pnpm build:site` 納入可搜尋版本目錄 `api/1.12.4/`。本頁保留詳細子系統 recipes、歷史階段／升級描述，與目前契約及歷史驗收分開。

本參考描述 **1.12.4／Apache-2.0**；npm 未發佈。[PLAN](../PLAN.md)／[DESIGN](../DESIGN.md) 定義已批准至 P103 的契約，[ACCEPTANCE](../ACCEPTANCE.md) 記實跑與未驗限制。歷史日期、counts 與 release metadata 保留為當時證據。API 參考 three.js／PixiJS／Excalibur，非 drop-in parity，未新增 runtime dependency。v1.12.3 production gate 失敗後，使用者已授權新的 GitHub v1.12.4 發佈，保留 v1.12.2 與 v1.12.3 tags。v1.12.4 仍待 CI 與 release 驗證，此處不宣稱 hosted 驗證或發佈已完成。Windows CI 測試設定不認證實體 Windows 硬體或驅動；browser qualification 只依實際記錄的 browser／host／path 證據擴充。

五個原 hosted workload與真失焦guard已於[CI37105917252](https://github.com/YueyuHoshizora/XYZ.js/actions/runs/37105917252)通過；Windows原生圖形failures仍阻擋發佈。使用者批准只有 pinned native WindowsWebKit在secure origin實測AudioContext／AudioWorkletNode均不存在、符合上游ENABLE_WEB_AUDIO OFF時音訊記UNSUPPORTED。WebKit其他gates及WindowsChromium／Firefox原生音訊assertions仍必須通過，不能宣稱WindowsWebKit音訊認證。

第58節 production 契約納入 **v1.10／1.10.0**；發佈封裝不擴大文件記載的平台、硬體或效能證據。

## 歷史階段 profile 導覽

| 項目                       | 歷史階段 profile／限制                                                                                                                                                                                                                                                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| WebGPU／WebGL2             | 2D sprites／isolation／masks／blends／native materials-filters-meshes；3D lighting／PBR／instancing／shadows／post／weighted transparency。WebGPU 需安全來源，WebGL2 HDR／weighted 需 float color attachments。                                                                                                                                                    |
| Canvas2D                   | Native 2D paint／isolation／masks／basic blends／offscreen；無可見 3D／Mesh2D、Material2D、native Filter2D、effects2D／effects3D。明確拒絕，不靜默切 backend。                                                                                                                                                                                                     |
| Physics2D（P76）           | Sleep、kinematic、bounded relative 平移／旋轉 CCD、凸形 character sweep／平台 carry；五種 joints、static concave 分割／thick chains。Sensor 仍 discrete，無 dynamic concave／compound／deformation CCD。                                                                                                                                                           |
| glTF／KTX2（P32–P42／P90） | UV0／UV1 triangles、四／八 influences skin、morph、COLOR_0；拒 COLOR_1。Meshopt 內建、Draco／Basis 外部提供。預設 KTX2 為 base RGBA8；native opt-in 保留支援 GPU payload／supplied mips（第30、42節）。                                                                                                                                                            |
| Animation（P34–P42）       | Ordered layers／fades／crossfades／flat state machine／tween／timeline、masks／additive references、1D／triangulated 2D blend trees／two-bone IK。Native GPU skinning／lazy exact CPU queries／保守 animated bounds 已限定 P42 驗收。                                                                                                                              |
| Loss recovery              | 預設 `recoverGraphics:true` 重建同 GPU／GL backend；舊 renderer-owned targets／snapshots 失效，失敗或關閉 recovery 為 fatal。P42 實跑 Chromium WEBGL_lose_context 與 fixture-only GPUDevice.destroy；非 driver reset／跨瀏覽器認證。                                                                                                                               |
| P40（限定驗收）            | Adjacent 2D batching／full render metrics／deep browser regression 已在 Canvas2D／WebGL2／WebGPU Chromium 153 通過；CI 已定義、hosted CI 未執行。無新 throughput／cross-browser 認證聲明。                                                                                                                                                                         |
| P41／P42 限定驗收          | P41 UI／contexts／residency／warmup／typed content 通過三 backend built-root Chromium regression。P42 native skin／animated bounds／mips 與完整 Beacon Run 通過 forced GPU／GL 路徑，primitive 3D physics／dynamics、authored navigation、animation masks／additive／blend trees／IK 已整合。Touch injection／模擬 gamepad 非實體裝置認證，實際證據見 ACCEPTANCE。 |

此表為歷史階段 profile 摘要，不是目前規範矩陣。舊階段排除項描述當時範圍；CURRENT 定義目前邊界，ACCEPTANCE 保留實跑環境與限制。

## 1. 模組與執行路徑

```text
src/index.ts                    統一 ESM／TypeScript API
  ├─ packages/core             Game／Clock／Scene、物件與相機、logger
  │    ├─ packages/ecs         World／Entity／Component／System（內核）
  │    └─ Game.create() → createRenderer()
  ├─ packages/graphics         Renderer／capabilities／錯誤
  │    └─ WebGPU → WebGL2 → Canvas2D（auto 初始化降級）
  ├─ packages/math             Vector2／3、Matrix3／4、Quaternion、Transform
  ├─ packages/assets           AssetLoader／Texture／AssetError
  ├─ packages/input            Keyboard／Pointer／Gamepad
  └─ packages/audio            AudioManager／Asset／Channel／OPMAdapter
       └─ vendor/opm           官方 OPM.js v1.11.1（tag v1.11.1）

requestAnimationFrame(timestamp)
  → 同步 DPR → Clock.tick(timestamp) → Camera2D.resize(logical viewport)
  → Input.update() → Scene.timers.update(deltaTime)
  → Scene.animations.update(deltaTime)
  → Scene.update(deltaTime) → World.update(deltaTime)
  → Renderer.beginFrame() → Renderer.render(scene, width, height)
  → Renderer.endFrame()
  → Input.endFrame()（finally 清除 edges）
  → 仍 running 時排程下一次 requestAnimationFrame
```

- `Game.create()` 是 async factory，renderer 預設 `auto`；constructor 不啟動非同步初始化。ECS 經 `scene.world` 管理，沒有額外的 root export／npm subpath entry。
- `Game` 擁有 loop、Canvas 尺寸與 Renderer 的生命週期；一般遊戲使用者不需要存取 GPUDevice。
- `Renderer` 接收 Scene 與 logical viewport 尺寸，不向核心公開 GPU resource。
- Triangle 的 shader 位於正式 Renderer，範例頁僅建立 Game 與操作按鈕，沒有第二套渲染器。
- `src/data/defaults.ts` 集中 viewport、delta clamp、pixel ratio 上限與 clear color；`src/data/audio.ts` 集中音訊 slot／timer／lookahead／release guard。
- RuntimeError、AssetError、AudioError 與 GraphicsError 共用 graphics 定義的 XYZError。AudioManager 由 Game 擁有，排程不依賴 RAF；pause／hidden 不等同停止音訊。

## 2. Clock：模擬時間不等於畫面幀率

`tick(timestamp)` 接受 requestAnimationFrame 的**毫秒**時間戳；對外時間為**秒**。

```text
frameInterval = max(0, (timestamp - previousTimestamp) / 1000)
deltaTime     = min(maxDeltaTime, frameInterval)
elapsedTime  += deltaTime
fps           = frameInterval > 0 ? 1 / frameInterval : 0
```

第一幀沒有前一時間戳，delta 與 fps 都為零。`fps` 是瞬時幀間隔倒數，**不是移動平均、不是 GPU 執行時間**。例如兩幀相隔 500ms、clamp 為 100ms 時，模擬前進 0.1 秒，但 fps 應為 2，不能顯示 10。

- `suspend()` 清除前一時間戳、delta 與 fps，保留 elapsed 和 frame。
- `reset()` 另外清零 elapsed 與 frame。
- 暫停及隱藏分頁後的第一幀不把停留時間納入模擬。
- 時間戳倒退不使時間倒流，也不在下一幀重複累積那段時間。
- frame 計算 tick 次數；並非保證 GPU 已將該幀呈現到螢幕。

## 3. 圖形初始化與能力邊界

目前提供三級 backend，僅在初始化階段自動降級：

| renderer 設定                  | 行為                                                                                          |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| `webgpu`／`webgl2`／`canvas2d` | 直接初始化指定 backend，失敗不切換                                                            |
| `auto`                         | 獨立 canvas 依 WebGPU→WebGL2→Canvas2D 初始化；全失敗回 UnsupportedGraphicsError 並保留 causes |

WebGPU 要求安全來源及瀏覽器／driver 支援。localhost 可用於開發；Production 必須採用符合瀏覽器安全來源要求的部署。`navigator.gpu` 存在不等於一定能取得 adapter 或 device。

WebGPU 初始化包含 preferred canvas format、opaque canvas configuration、WGSL compilation diagnostics 與 validation error scope。不能僅因 `requestDevice()` 成功就宣告 Renderer 可用。圖形錯誤保留 subsystem 與原因，便於區分不支援、初始化失敗與執行中裝置遺失。

## 4. Triangle 的 GPU 管線

沒有 active Scene 時保留 triangle 示範路徑；有 Scene 時只繪製 Scene 內容，即使是空 Scene 也不補 triangle。WebGPU triangle 的 WGSL vertex shader 以 `vertex_index` 產生三個頂點及 RGB，fragment shader 輸出插值色彩；此 triangle 路徑不需要 vertex buffer、texture 或 depth buffer。

WebGPU triangle 先 clear，再以中央 square viewport 保持比例。這不是 Camera2D／PerspectiveCamera 的縮放規則；一般 Scene 使用邏輯 viewport 與對應相機。WebGL2 提供 GLSL triangle，Canvas2D 為漸層示意，並非逐頂點插值的精確替代。

每幀必須取得目前 swapchain texture view，建立新的 command encoder／render pass／command buffer 並提交。**已提交的 GPU command buffer 不可重複使用**；減少 JS descriptor 配置不能靠錯誤重用 GPU 工作物件來換取。

## 5. 使用與發佈

```ts
import { Game } from 'xyz.js';

const game = await Game.create({
  canvas: '#game',
  renderer: 'webgpu',
});
game.addEventListener('error', (event) => {
  const error = (event as CustomEvent<Error>).detail;
  console.error(error);
});
game.start();
```

初始化錯誤由 `Game.create()` 的 rejected Promise 處理；Game error 事件以 `CustomEvent<Error>.detail` 攜帶原因，應在 start 之前註冊。Fatal frame／renderer／自動 resize 錯誤會暫停並阻止 resume；`start(scene)` 的候選準備錯誤與 Audio 排程錯誤也可送出 error，但不因此鎖成 fatal。`await game.setScene()` 的失敗由呼叫者處理 Promise。`createRenderer` 雖由統一入口匯出，一般使用者仍應讓 Game 管理 Renderer 的生命週期。

最低支援 Node.js 22；目前固定開發工具鏈需 Node >=22.13.0／pnpm 12.6.0。`npx pnpm@12.6.0 build` 依序執行 TypeScript、`scripts/minify-dist.mjs` 與 `scripts/copy-vendor.mjs`，產生最小化的 `dist/src/index.js`／內部 modules、`.d.ts`、串接回 TypeScript 的 source maps 及原樣保留的完整 `dist/vendor/opm/`。npm exports 指向同一入口，package files 僅包含 dist（npm 另帶標準 metadata／README）；目前**未發佈 npm**。本機 tarball 安裝也能使用 bare import，不需要先公開發佈。

無 bundler 的網站可完整複製 `dist/`：

```html
<script type="module">
  import { Game } from '/vendor/xyz/dist/src/index.js';
  const game = await Game.create({ canvas: '#game' });
  game.start();
</script>
```

不得只複製 index.js，因為相對 `.js` imports 需要其餘目錄。型別檔不參與瀏覽器執行，但提供 TS 消費端型別。根套件授權為 Apache-2.0（見根目錄 `LICENSE`），`package.json` 的 `license` 為 `Apache-2.0`；v1.5 以前已發佈的附件仍標示 UNLICENSED。

## 6. 驗證方法與效能用語

```sh
npx pnpm@12.6.0 install
npx pnpm@12.6.0 build
npx pnpm@12.6.0 typecheck
npx pnpm@12.6.0 test
npx pnpm@12.6.0 lint
npx pnpm@12.6.0 format:check
npx pnpm@12.6.0 dev
```

瀏覽器檢查六個 `/examples/` 範例（triangle／sprite／cube3d／pong／fallback-demo／showcase），確認實際畫面與互動；showcase 包含同 Scene 2D＋3D＋音訊及切換清理。Cube3D 在 Canvas2D 明確不跑 3D，showcase 則保留 2D＋音訊。編譯或 GPU mock 通過不是畫面正確的證明。Error 分支以實際 device/context loss 或明確標示的事件模擬驗證。P08 為 16 檔／73 測試，後續優化為 16 檔／75 測試及五項檢查通過，分別保留於 ACCEPTANCE；不是每次文件同步都重跑。

效能數據須區分：

1. JS 容器的配置數量與生命週期。
2. CPU 提交時間與 GC 開銷。
3. GPU 工作時間、呈現節奏與實際 fps。

減少第 1 項，不代表第 2、3 項必然以相同比例改善。P01 triangle 不能代表 1,000 Sprite 場景；`/benchmarks/sprites/` 提供固定規格的獨立 RAF／CPU submit 量測，未直接量測 GPU 或 GC。

Benchmark 開啟 `/benchmarks/sprites/`：預設 direct WebGPU，query 可選 auto／webgl2／canvas2d。1,000 個移動 Sprite 共用 texture，1280×720 backing／DPR 1；120 warmup 後量 600 幀，切至 hidden 則中止。此工具使用自己的 RAF 驅動正式 Renderer，不呼叫 Game.start；CPU 計時只包含 beginFrame／render／endFrame，不含動畫更新。RAF fps 不是 GPU completion 或實際螢幕掃描率，亦不能當完整 Game Loop workload 的結果。

## 7. Game 狀態、ownership 與錯誤策略

正常狀態轉移：

```text
Game.create() → idle
idle / paused --start 或 resume--> running
running      --pause-----------> paused
任何未銷毀狀態 --destroy-------> destroyed
```

隱藏分頁停止排程並清除 Clock 的前一時間戳，但保留使用者的 running／paused 意圖；只有原先 running 的 Game 會在可見時恢復。手動 pause 的 Game 不會因分頁切回而自行 start。

同一 Canvas 同時只能有一個 Game，包含初始化尚未完成的期間。Canvas claim 在開始非同步 GPU 初始化前保留，失敗或 destroy 後釋放；否則第二個 Game 會重新 configure 同一 GPUCanvasContext，第一個 loop 卻仍然執行。這個約束是資源 ownership，不是 DOM 元件是否仍存在的判斷。

Fatal 執行失敗與使用者 pause 不同：Game 保留第一個 fatal failure、停止 loop／送出 error，其後 start／resume 拒絕。GPU／GL loss 預設可復原（`recoverGraphics:true`），重建同 backend，不自動切換 backend；事件／失效 handles／逾時與失敗行為見第 21 節。關閉復原或復原失敗仍 fatal，應 destroy／recreate，不可在所有 error listener 無條件 resume。非 fatal Scene／Audio error 不一定改變 Game.state。

正常 destroy 應可重複呼叫，取消 RAF、移除 observer／listener、還原引擎接管的 containment 設定並釋放 Renderer。初始化任何一步失敗也要 rollback 已取得的資源。清理其中一個動作失敗，仍必須嘗試其餘清理並釋放 Canvas claim；不能留下阻止重新建立 Game 的幽靈 ownership。

範例的 `pagehide` 特別區分 BFCache：`event.persisted` 為 true 時瀏覽器保留頁面，不能 destroy Game；真正離頁才銷毀。這和主動 Game.destroy 是不同事件。實際 BFCache 是否啟用也受瀏覽器與頁面其他資源影響。

## 8. CSS 尺寸與 GPU backing pixels

尺寸分成兩層：

- **CSS content box**：畫布在 layout 中的寬高，以 CSS pixel 計算；不包含 border、padding 或 CSS transform。
- **backing store**：`canvas.width`／`canvas.height`，以裝置像素計算；Renderer.resize 接受這一層。

```text
backingWidth  = max(1, round(logicalWidth  × pixelRatio))
backingHeight = max(1, round(logicalHeight × pixelRatio))
```

未指定 pixelRatio 時採用 devicePixelRatio，並受集中設定的上限約束；明確指定 pixelRatio 則使用該數值。GPU 自身的 maxTextureDimension2D 是另一個獨立限制，不等於 pixel ratio 上限。

### 預設 layout 與作者 CSS

引擎透過 CSS `contain: size` 與 `contain-intrinsic-size` 隔離 backing attributes 對 intrinsic layout 的影響，不寫入 canvas 的 width／height CSS。containment 的預設 intrinsic size 來自 Game 的 width／height；使用者 stylesheet、class、cascade layer 或 inline width／height 仍可決定畫面大小。百分比尺寸可以持續跟隨容器，不能在初始化時被凍結成 px。

沒有作者 CSS 的 canvas 也需要穩定的 CSS 尺寸：若直接讓 backing attributes 決定 intrinsic layout，DPR 2 的 resize 可能把 CSS 寬度也放大，再經 ResizeObserver 反覆放大。size containment 是為了隔離這個 feedback，不是視覺主題。引擎保留既有的 layout／paint／style containment，清理時還原仍由引擎控制的 inline 設定；不插入會影響 CSS cascade 或要求放寬 CSP 的 stylesheet。

`autoResize:true` 以顯示 content box 為準；observer 只同步 logical／backing dimensions，不修改作者 CSS。`game.resize(w,h)` 更新引擎 intrinsic fallback 尺寸；作者 width／height 仍具優先權，所以在作者固定 420×210 的 canvas 上呼叫 resize(200,100)，不會強行蓋掉作者 CSS。Canvas width／height attributes 也會提供 CSS aspect-ratio hint，因此手動 resize 先以要求的尺寸更新 backing 比例，再量測作者 CSS 的實際 content box；若不同才再次同步 backing。失敗須回復舊尺寸。作者也可明確設定 CSS `aspect-ratio`，避免 auto-sized 軸依賴 backing 比例。

`autoResize:false` 不追蹤 DOM content box；呼叫者自行管理 layout 與渲染尺寸的配合。適合自行控制 viewport 的整合，而非保證所有外部 CSS 變更會自動跟隨。

resize 必須在寫入 canvas 前同時驗證兩個 backing dimensions；超過 GPU 上限時回報錯誤，不先改掉其中一個維度。Game 亦必須避免失敗後留下已更新的巨大 CSS fallback 或 logical dimensions。

## 9. WebGPU 生命週期與熱路徑

初始化過程中的 await 是資源競態邊界。如果呼叫 destroy 時 requestDevice 尚未完成，稍後回傳的 device 仍然需要 destroy，初始化 Promise 也不能回報成功。相同原則套用至 adapter 取得及 shader validation：每一個 await 回來都要確認 Renderer 未被銷毀。

可以跨 frame 保留的是 CPU 側設定容器：render-pass descriptor、color attachment／array、queue submission array。每幀只替換 texture view 與 command buffer；API 消費後移除這些參照，避免容器延長 swapchain 資源生命週期。不能透過保留上一幀 texture view 來省掉必要的 GPU view 建立。

viewport 幾何可在 resize 時計算，靜態 pipeline 亦不因 resize 重建。對外修改 canvas backing attributes 屬低階操作；一般使用者應透過 Game.resize 或 DOM layout／ResizeObserver，避免繞過大小驗證與 ownership。

具體前後數據見 ACCEPTANCE。量測時可在測試側攔截真實 GPU API 記錄 descriptor identity；不得把這種 instrumentation 或測試用 GPU handle 加入公開 Game API，也不應將 container identity 當作消費端的永久契約測試。

## 10. Core World（P02）

- `Scene` 是 World 與物件生命週期容器，不是 Entity。`scene.add(object)` 建立內部 Entity 並註冊 GameObject 的 Transform2D，`scene.remove(object)` 解除關聯但不 destroy，方便搬移；Scene.destroy 會 destroy 仍屬於它的物件和 systems。
- `SceneObject` 提供 ownership 與 `onDestroy`，不綁定 2D transform；`GameObject` 提供 position／rotation（弧度）／scale。低階 World 具 component 增刪查改、query 及有序 System lifecycle；一般使用者不需要接觸 Entity ID。
- Scene hooks：`protected initialize(game, signal)` 可回傳 Promise；`update(dt)` 每可見幀呼叫；`protected onDestroy()` 同步釋放 Scene 資源。非同步初始化應遵守 AbortSignal，不能在已取消後繼續註冊資源。
- `await game.setScene(next)` 先準備候選、成功後才發佈，再同步清理舊 Scene。準備失敗清理候選並保留舊 Scene；若舊 Scene 的 cleanup 拋錯，新 Scene 已經生效，Promise 仍回報 cleanup 錯誤。dispose 期間拒絕重入切換。
- 每個 Scene 一生限由一個 Game 接管。新候選取代待初始化候選會 abort／destroy 前者；Game.destroy 也會 abort 候選及清理 active Scene。取消訊號是 cooperative，不會強制終止使用者 Promise。
- `game.start(scene?)` 維持同步 void，準備失敗透過 error 事件回報，但不把正常 Scene 準備失敗鎖成 fatal GPU failure。需取得準備結果時先 await setScene。更新中的真正 exception 仍讓 Runtime 進入 fatal paused 狀態。
- 系統依加入順序更新；更新途中新加的 System 下一幀才執行，已移除者不再執行；清理按相反順序。Scene.update 中 pause／destroy 不會繼續提交 Renderer。
- Vector2 可變操作回傳自身；Matrix3 使用 column-major Float32Array，compose 為 translation × rotation × scale，invert 拒絕 singular matrix。`transformPoint(point, out)` 可提供輸出容器避免配置。Transform2D 的 `updateMatrix()` 重用自己的矩陣。

## 11. Texture 與 Sprite（P03）

- `game.assets.loadTexture(url)` 以絕對 URL（忽略 fragment）共用 pending Promise 與 Texture；失敗移除 cache，可重試。已 destroy 的 Texture 再載入會重新下載／解碼。AssetLoader.destroy 中止下載，晚到的 bitmap 仍會關閉。
- AssetLoader 擁有 cache 中的 CPU ImageBitmap；`Texture.fromImage(source)` 建立獨立 bitmap，需由呼叫者 destroy。Sprite 不擁有共享 Texture。Game.destroy 清理 renderer 後清理 assets。
- Sprite 提供 texture、position、rotation（弧度）、scale、anchor（預設中心）、opacity、visible、zIndex；相同 zIndex 保持 Scene 加入順序。座標使用左上原點的 logical CSS pixels。
- WebGPU 共用一個 Sprite pipeline，重用可成長的 instance buffer，依排序後相鄰 texture 合併 draw。GPU texture cache 與 AssetLoader 分離，未使用或已銷毀的資產會釋放 GPU resource。
- 上傳採 premultiplied alpha，shader 同時乘 RGB／alpha 的 opacity，混色為 one／one-minus-src-alpha。無 Scene 保留 triangle；有 Scene 則只畫 Scene 內容。

## 12. Camera 與 Input（P04）

- 每個 Scene 擁有 Camera2D；`screen=(world-position)*zoom`，正 zoom 同時作用兩軸。Game 每幀在 update 前同步 viewport；可用兩方向轉換的 out 參數避免配置。resize 保留 pipeline、Texture 與 instance buffer。
- InputManager 由 Game 擁有。Keyboard 使用 `KeyboardEvent.code`，忽略輸入欄位，不全面阻止瀏覽器預設操作。Pointer 使用 capture／cancel 並轉成 canvas content-box logical 座標，與 DPR 無關；canvas 可設定 `touch-action:none` 控制觸控捲動。
- `update()` 在 Scene 前取得 Gamepad slots，`endFrame()` 在 finally 清除 pressed／released edges。pause、blur、hidden 清除 held state；destroy 移除 listeners。實際 gamepad 硬體尚未驗證，測試涵蓋連接／斷開 snapshot。
- Pong 使用相機等比例縮放、鍵盤／拖曳／gamepad 控制、球拍碰撞與計分，不引入物理引擎。
- Gamepad：`game.input.gamepad`（`GamepadState`）追蹤第一個 `mapping==='standard'` 的已連線 pad（非 standard 忽略；`preferredIndex` 可鎖定槽位）。按鈕使用 W3C 名稱（`a b x y lb rb lt rt back start ls rs up down left right home`），`button(name)` 為 0..1 analog，`isDown／wasPressed／wasReleased` 依 `pressThreshold`（預設 0.5），`firstPressed()` 供 rebind 提示。`stick('left'|'right')`／`axis(name)` 套用 radial `deadzone`（預設 0.15，[0,1)）並重新縮放到 0..1。新選中的 pad 不把已按住的鍵當按下；pad 消失時回報一次 release。`game.input.actions`（`ActionMap`）將具名 action 綁到 `{button}`、`{axis,direction:±1}`、`{key: KeyboardEvent.code}`，提供 `bind／rebind／unbind／bindings／value／isDown／wasPressed／wasReleased`；`export()`／`import()` 可 JSON round-trip，`import` 先全部驗證才取代。Edge 每次 `InputManager.update` 計算一次。僅以合成 `getGamepads` 快照驗證；實體硬體、震動與非 standard mapping 未驗證／不支援。

## 13. 3D（P05）

- Matrix4 為 column-major，RH／−Z forward，perspective 使用 WebGPU depth 0..1；Quaternion.setFromEuler 使用弧度。Transform3D 重用矩陣；Mesh 與 Transform3D 註冊到 Scene 的 World。
- Geometry 拷貝並驗證自訂 position／normal／uv／index，合併為 stride=8 floats，indices 為 Uint32Array。Index topology 不可變；刻意修改 vertex 的 position／normal／UV 後，呼叫 markUpdated() 增加 version 通知 renderer upload cache。cube／sphere／plane／quad 提供 outward normals／winding；BoxGeometry.unit 為命名基本幾何工廠。
- Mesh 不銷毀共享 Geometry／TextureMaterial／Texture。Material 提供 texture、RGB tint 與 opacity；相機由 fov／near／far、position／Quaternion rotation 計算 view-projection。
- WebGPU 使用共用 mesh pipeline、每 mesh 重用 uniform buffer、geometry／texture cache。normal 使用 model 3×3 inverse-transpose，支持非均勻 scale。光照為 ambient 加 directional diffuse。
- 3D pass 使用 depth24plus／less，再以 load color 的獨立 pass 疊加 Sprite。預設 sorted 透明保留 depth write 與 premultiplied blending；opt-in weighted 透明只測 opaque depth、不寫透明 depth，詳見下方透明章節。
- resize 保留 shader／geometry／texture，替換尺寸相關 depth／HDR attachments；destroy 釋放 GPU caches。

## 14. Compatibility（P06）

- 瀏覽器 Canvas context 綁定不可逆。auto 不在使用者 canvas 上嘗試 GPU context，而是以獨立 canvas 完成 backend 初始化，再由原 canvas 的 2D context 呈現；不替換 DOM，也不破壞 input listeners。每幀增加一次 drawImage copy，效能應獨立量測。強制 backend 無此 copy。
- WebGL2 使用 instanced Sprite batching、共用 GLSL pipelines 與 geometry／texture cache。Mesh 將 WebGPU 0..1 clip depth 轉成 GL −1..1，使用同樣的 normal／light／premultiplied blending。
- ImageBitmap 為 straight alpha，上傳 WebGL 不依賴會被忽略的 pixelStore flags；shader 乘 alpha。UV=0 對應圖片第一列，不額外翻轉。
- Canvas2D 使用 native affine／drawImage／alpha；triangle 為漸層示意而非 GPU 的逐頂點插值。Primitive2D rectangle／circle 在建立時 rasterize 一次，之後重用 Sprite 路徑，destroy 只釋放自己的生成 Texture。
- capabilities：WebGPU 全部 boolean=true；WebGL2 threeD／customShaders／instancing=true，其餘 false；Canvas2D 全 false。maxTextureSize 為 backend 上限（Canvas2D 採保守 8192）。這是能力查詢，不是 custom shader 或 compute 的公開執行 API。

## 15. Audio

- `game.audio.load(url)` 共享 canonical URL（忽略 fragment）的 pending/cache；失敗會逐出，destroy 立即取消等待。JSON 必須含官方可解析 `voice` 及非空 `notes`，每音符 MIDI 0–127、time ≥ 0、duration (0,60] 秒。可選 channel（music/sfx/ui）、loop、duration（loop period，不能短於最後音符結束）。載入後 voice/notes immutable；格式示例見 [sfx.json](../examples/sprite/sfx.json) 與 [music.json](../examples/sprite/music.json)。
- Voice 驗證在內部透過官方 v7 格式正規化，仍接受 legacy v1 輸入。引擎公開的 `OPMVoice` 保留已發佈的 `version: 1` 契約，不暴露 native v7 representation；歷史驗收與升級驗證紀錄不改寫。
- 在使用者 click 等手勢內 `await game.audio.unlock()`；之前 play 拋 AudioError，不偷偷建立 AudioContext 或排隊。OPMAdapter 在 load 驗證 voice 時可先 import 官方模組，但僅 unlock 建立八個 context/worklet。每 slot 保留一個聲部，含 ADSR release 與 guard；master/channel volume 0–1 經 GainNode 相乘。
- 官方 OPM.js v1.11.1（tag `v1.11.1`）可選聲部數，但 XYZ.js 仍維持八個隔離 instance，每 slot 保留一個聲部。soft stop 仍有 release，隔離可在不 fork 的情況保證 SFX overflow 不斷 BGM。只有 oldest SFX 可以透過官方 `opm.panic()` 清除音符，保留 managed node／routing；teardown 使用官方 `opm.dispose()`。沒有 SFX 可搶時略過新音符，不取消 music track。預算包含 UI 與 release。此 vendor 升級不新增引擎功能或擴大認證範圍。
- 25ms timer、100ms lookahead；timer throttling 後跳過漏掉的 loop，不追補整首歌。時間／slot 常數集中 `src/data/audio.ts`。Game pause 不代表 audio pause；需要時明確 stop。
- `asset.play(options)`／`game.audio.play(asset, options)` 回傳 AudioPlayback；stop 保留自然 release。預設關聯當前 Scene，也可指定 `scene`；沒有 Scene 時由 stop／結束／Game destroy 管理。Scene destroy hard-cancel 非 persistent 排程與 release；`persistent:true` 可跨 Scene，Game destroy 仍全部關閉。`game.audio.opm` 是由第一個官方 instance 支援的進階 legacy compatibility facade，並非 native instance 本身。它保留可寫 context／node handles 與可變的 voice `Map`，聲部仍使用已發佈的 v1 契約；直接操作會繞過預算／lifecycle。Managed playback／teardown 在內部使用官方 native `panic()`／`dispose()`。
- [來源與 SHA256 manifest](../vendor/opm/manifest.json)、[官方 Apache-2.0 LICENSE](../vendor/opm/LICENSE) 位於 vendor，沒有私人 patch；根套件另以 Apache-2.0 授權。build 複製完整 vendor 到 dist，保留 modules／worklet 的相對 URL；部署必須保留整個 dist，AudioWorklet 亦需安全來源。

## 16. Logging 與 hardening

公開 `logger.debug/info/warn/error(...args)`，`logger.level` 可設 debug／info／warn／error／silent，預設 warn。所有輸出帶 `[XYZ]`；backend 初始化／fallback 與 fatal Game error 有診斷，不逐幀輸出。Production 可設 error 或 silent。

WebGPU device lost／WebGL context lost 後 resize 在修改 backing 前拒絕；Game 暫停且禁止 resume，需 destroy/recreate。destroy 即使 input 清理失敗仍 disconnect resize observer，繼續釋放其他資源。完整錯誤樹包含 XYZError、GraphicsError、AssetError、AudioError、RuntimeError 與各 backend 子類。

```text
XYZError
├─ GraphicsError
│  ├─ WebGPUNotSupportedError
│  ├─ WebGPUInitializationError
│  ├─ WebGPUDeviceLostError
│  ├─ WebGL2InitializationError
│  ├─ WebGL2ContextLostError
│  ├─ Canvas2DInitializationError
│  ├─ GraphicsBackendUnavailableError
│  └─ UnsupportedGraphicsError
├─ AssetError
├─ AudioError
└─ RuntimeError
```

這是公開錯誤類別，不代表所有使用者程式例外都會被重新包裝；cleanup 也可能回報保留多個原因的 AggregateError。支援與限制以 [驗收紀錄](../ACCEPTANCE.md) 為準，不將合成事件或 headless Chromium 結果推廣成所有瀏覽器認證。

## 17. 後續熱路徑維護

- World 只有 System 移除後才壓縮陣列，採穩定線性搬移；不改變更新中移除／加入與例外清理語義。
- WebGPU Sprite viewport uniform 在邏輯尺寸不變時不重傳；Sprite transform／instance 資料仍逐幀更新，不假設公開可變物件是 immutable。
- Keyboard 的 editable 過濾只阻止開始追蹤文字輸入；已按住的遊戲鍵即使在輸入框收到 keyup 也必須釋放，避免 focus transition 卡鍵。
- 實測確認冗餘 uniform 上傳減少，不表示 CPU／FPS 已提升；前後時間與限制見 ACCEPTANCE 的後續優化紀錄。

## 18. 資產安全預算

`src/data/assets.ts` 集中固定預設：圖片 response 8 MiB、音訊 JSON response 1 MiB、音訊 notes 16,384；Texture 每邊最多 8,192、總像素最多 4,194,304（約 16 MiB RGBA）。

內部 `readResponse` 使用 reader 累計瀏覽器交付的 response bytes（HTTP 解壓縮後），不依賴可能缺失、虛報或描述壓縮內容的 Content-Length。超限即取消 reader 並拒絕；AbortSignal 也取消停滯中的 reader。JSON 只在完整有界讀取後解析，notes 數量在 map／sort／freeze 前驗證。對外仍由 AssetError／AudioError 回報，底層 byte-cap 原因保留於 cause；失敗 cache 仍移除以允許重試。

Texture 的解碼後檢查同時涵蓋 loadTexture 與 fromImage；這兩條路徑在拒絕時關閉引擎擁有的 bitmap，直接呼叫 Texture constructor 的 caller 仍負責建構失敗時的來源資源。合法大小不縮放、不截斷。

**相容性取捨：使用者選擇保留所有瀏覽器支援圖片格式。** 沒有格式白名單／解碼前完整尺寸解析，因此像素上限不能阻止解碼器瞬間配置；response chunk 本身也由瀏覽器先行配置。限制是單一資產預算，不是總 cache、並行下載或整個 process 的記憶體保證；不可信圖片仍應在受控資產管線處理，並由應用管理資產生命週期。

2026-09-30 安全修正驗證：17 檔／82 測試與整合檢查，實際 Chromium 驗證 notes／bytes／pixels 邊界與 Showcase 圖形及音訊播放；詳細證據見 ACCEPTANCE。

## 19. 最小化發佈產物

Build 使用既有 Vite 開發依賴匯出的 minifier，逐檔最小化 dist 中每個引擎產生的 `.js`。保留 ES2022 ESM、相對模組路徑、匯出名稱、公開 property 與 function／class 名稱（包含錯誤名稱）；不 bundle、不改原始碼、不加 runtime dependency。TypeScript 宣告不改動；minifier maps 與 TypeScript maps 串接，由 sourceMappingURL 引用。

官方 OPM 發佈包本身已最小化，維持逐位元組複製，保留 LICENSE、manifest、modules 與 worklet URL；刻意不重新壓縮，以維持官方 release checksum 完整性。

實測 36 個引擎 JavaScript 由 189,706 降至 98,707 bytes（約 48%，不含 maps、宣告與 vendor）。dist 共 46 個 JavaScript，包括上述 36 個與官方 vendor 的 10 個。靜態 HTTP smoke 未經 Vite 轉譯，載入使用說明的 ESM 範例，驗證鍵盤移動、畫面像素讀回、錯誤名稱與官方 audio worklet unlock。最小化是體積優化，不是加密或安全邊界。

## 20. Text2D 與 Scene 計時器（v1.0 後新增）

歷史 v1.1 基線（套件 1.1.0），不在先前 v1.0 tag。下方原有 style／font-loading／wrapping 排除項已由 P27 styled Text2D／font assets 擴充；UI layout／widgets／focus 現已批准 P41。歷史 release metadata 保持不變。

- `await Text2D.create(text, { fontSize, fontFamily, color, padding })` 產生沿用既有 backend 貼圖路徑的 Sprite。預設值集中於 `src/data/text.ts`；換行分成靠左行，量測包含字形左右溢出與下緣。空字串透明；完整 raster canvas 配置前先驗證尺寸／像素預算。
- Transform、anchor、opacity、visible、zIndex 與 Sprite 相同。Style 不可變，更換樣式請建立新 Text2D。自訂字型應先等待載入；字型與字形結果由瀏覽器決定。不包含自動字型載入、文字 GUI、自動換行或文字動畫系統。
- `await label.setText(value)` 只發佈最後一次請求，`label.text` 是目前顯示的內容。與已顯示文字相同時不重繪並取消舊的 pending 更新；失敗會 reject 並保留舊畫面。過期或 destroy 後完成的結果會釋放貼圖、不再顯示。應處理 Promise，不要無必要地每幀重繪。
- Text2D 擁有自己產生的貼圖，更新與 Scene 銷毀會釋放舊／目前貼圖；外部另指定的 `texture` 與 Primitive2D 一樣是借用，不由 Text2D 銷毀。不要把 Text2D 的自有貼圖共享給其他仍存活 Sprite，因為更新文字會銷毀它。
- `scene.timers.after(seconds, callback)`／`.every(seconds, callback)` 回傳具有 `active` 與冪等 `cancel()` 的 `TimerHandle`。單次 delay 必須有限且非負；重複 interval 必須有限且大於零。零秒是在下一個 timer tick 執行，不是同步立即呼叫。
- Game 在 Scene.update 前以 clamp 後的模擬 delta 推進計時器，不依賴 subclass 呼叫 super.update。Pause／hidden 時間不累積；同 tick 到期 callback 依註冊順序執行，每個重複 timer 每 tick 至多一次，漏掉的週期跳過、不爆發補跑。Callback 內新註冊的工作留至下個 tick。
- Callback 是同步的，不要用 async callback 期待 scheduler 等待它；拋錯走 Game 的 fatal frame error。禁止遞迴推進 timer。Scene destroy 取消所有剩餘 callback 並清除參照，也拒絕再新增；候選 Scene 準備期間不推進。Callback 中 pause 在目前同步 timer batch 結束後生效。
- Pong 示範畫布文字計分、延遲一秒發球、pause／resume 與 Scene 替換。新增功能驗證共 96 測試；Chromium 實測 WebGPU／WebGL2／Canvas2D 的文字畫面，不代表新增跨瀏覽器認證。

## 21. 進階 3D（P09–P12）

### 階層、相機、控制與拾取

- Object3D 繼承 SceneObject，提供可變 position／Quaternion rotation／scale、transform、visible、parent、唯讀 children 及 worldMatrix。Group 是不繪製的 Object3D，Mesh 也繼承它。updateWorldMatrix() 重算本地與祖先變換（parent-world × local）；worldVisible 包含所有祖先可見性。
- parent.add(child) 將附屬子樹註冊到 Scene；同 Scene reparent 保留 ownership，cycle／destroyed member／跨 Scene 則在改動階層前拒絕。parent.remove(child) 或 scene.remove(root) 解除子樹註冊與父關係，但不銷毀。Scene.objects 包含已註冊 descendants；destroy parent 會銷毀子孫，共用 geometry／material／textures 仍為借用。
- scene.camera3D 可換成 PerspectiveCamera 或 OrthographicCamera。兩者提供可變 position／rotation／near／far、lookAt(Vector3) 與 updateMatrix(aspect)。透視 fov 為弧度；正交 height=10、zoom=1，垂直範圍為 height/zoom，寬度由 aspect 決定；本地 −Z 為前方。
- new OrbitControls(camera,canvas) 在指定 Canvas 處理左拖旋轉、右鍵／修飾鍵左拖平移、中鍵／wheel dolly。可設 target、enable flags、speeds、min/maxDistance、min/maxZoom（正交）、min/maxPolarAngle 與 min/maxAzimuthAngle（弧度）。update() 協調外部修改；destroy() 移除 capture／listeners 並還原引擎接管的 touch-action。Scene 不自動管理它。
- new FirstPersonControls(camera,canvas) 提供滑鼠視角與 WASD 移動。`await controls.lock()` 要求 Pointer Lock（必須在使用者手勢內呼叫，瀏覽器拒絕時 reject）；`unlock()`、`isLocked` 與 `lock`／`unlock` 事件（為 `EventTarget`）反映 canvas 的鎖定狀態。鎖定期間（`requireLock`），pointer 的 `movementX/Y` 以每像素 `lookSpeed` 弧度改變 `yaw`／`pitch`，pitch 限制在 `[minPitch,maxPitch]`；`update(deltaTime)` 依 `keys`（`KeyboardEvent.code`，可重新綁定：forward／back／left／right／up／down／sprint；`sprintMultiplier`）以 `moveSpeed` 單位／秒移動相機。除非 `fly` 為 true，否則水平移動。鎖定結束或 canvas blur 會清除按住的鍵。初始 yaw／pitch 取自相機旋轉（捨棄 roll），也可用 `setRotation(yaw,pitch)` 設定。請自行每幀呼叫一次 `update`；`destroy()` 解除鎖定並移除所有 listeners。僅以假的 document 與 canvas 做 unit tests；真實瀏覽器 Pointer Lock（含非手勢呼叫被拒、觸控裝置）未實測。
- Raycaster.setFromCamera(x,y,camera,aspect) 接受 NDC；intersectObjects(iterable,recursive=true,out=[]) 替換 out，按世界距離排序精確 indexed-triangle 交點，含 object／point／distance／faceIndex，instance 另含 instanceId。隱藏祖先排除子孫，重複 roots 不重複 Mesh。拾取固定雙面、不依材質 culling；Raycaster near=0／far=Infinity 與 camera clipping 獨立，skin 在拾取前更新。

### glTF、動畫與幾何更新

- GLTFLoader.load(url,{signal,allowedOrigins}) 與 parse(ArrayBuffer|string,baseURL?,{signal,allowedOrigins}?) 回傳 GLTFAsset：scene:Group、animations:AnimationClip[]、冪等 dispose()。支援外部／內嵌 buffers 和 images、relative URI、GLB2、triangle primitives、normalized／strided／sparse accessors、node TRS與可分解 affine TRS matrices、metallic-roughness 材質、UV0／UV1 textures、四／八 influences skins。引用的 buffers／images 只從模型自身 origin（baseURL）或 allowedOrigins 列出的 origin（例如 ['https://cdn.example']）取得；data:／blob: 一律允許，其他 origin 在請求前以 AssetError 拒絕。缺 normals 時產生；缺 referenced UV stream 明示拒絕，untextured geometry 可保留 zero UV0。
- 非 triangle topology、`COLOR_1`、UV2+、超過兩組成對 skin influences、shear matrix、animated matrix node、POSITION／NORMAL／TANGENT 以外的 morph attributes 明確拒絕；supported set 外 required extension 拒絕。`COLOR_0` 支援 float與normalized unsigned-byte／unsigned-short VEC3／VEC4、含alpha（第34節）。Morph 支援 POSITION／NORMAL deltas（float／normalized integer／sparse、缺項零）、mesh／node weights與STEP／LINEAR／CUBICSPLINE channels；未使用的TANGENT deltas忽略。同一mesh primitives的target數須一致、node weights需匹配。影像解碼限制仍見第18節。
- 已實作 extensions：`KHR_mesh_quantization`（整數／normalized accessors 已還原為 float）；`KHR_materials_emissive_strength`（乘上 `emissiveFactor`，負值拒絕）；`KHR_materials_unlit`，以既有 PBR 近似：黑色 base color、roughness1、base color 導向 emission（alpha 仍取 base color，dielectric F0 的 image-based specular 仍微弱可見）；`KHR_texture_transform` 每個 map 獨立保留 `uv' = offset + R·S·uv`，支援 UV0／UV1 與 extension 的 `texCoord` override，不要求 shared transform，UV2+拒絕。`KHR_lights_punctual` 以 `asset.lights`（`point: PointLight[]`／`spot: SpotLight[]`／`directional: {direction,color,intensity}[]`）提供，載入時依各 node world transform 計算一次，保留 glTF 原始光度值，缺 `range` 視為0（無限）。Lights 不自動加入 Scene／跟隨 node 動畫，directional 是否對應 `scene.directionalLight` 由 caller 決定。Mipmapped minification filters9984–9987接受並降為對應 nearest／linear，不產生 mipmaps。其他 optional extensions 使用 core fallback。原 unit 證據使用合成模型；P90另有 native GPU／GL 各map reference與八influences fixture，不宣稱第三方模型集認證。
- P39 另支援 required `KHR_materials_ior`、`KHR_materials_specular`、`KHR_materials_clearcoat`、`KHR_materials_sheen`、`KHR_materials_transmission`、`KHR_materials_volume`；材質契約與 raster 近似見第 37 節。
- P32 加入內建 `EXT_meshopt_compression`，透過 `dracoDecoder` 有條件支援 `KHR_draco_mesh_compression`、透過 `ktx2Transcoder` 有條件支援 `KHR_texture_basisu`，fallback 詳見第 30 節。提供 callback 不等於引擎內建 codec，也不保證外部 decoder 的品質／速度／記憶體。
- src/data/models.ts 固定 input 32 MiB、aggregate fetched 與 tracked decoded allocations 各 128 MiB；各 top-level list entries 10,000、accessor scalar elements 4,194,304、total vertices 1,000,000、indices 3,000,000、每 skin joints 256、每 mesh morph targets 64、hierarchy depth 256。超限拒絕、不截斷；此 accounting 不是整個瀏覽器記憶體保證。
- 應用在移除／停止所有 consumers 後必須 asset.dispose()，釋放 loader-owned nodes／textures。僅 Scene destroy 不釋放 asset-owned textures；仍有 live borrower 時不可 dispose。Abort／parse failure 清理自有資源。
- KeyframeTrack(target,path,times,values,interpolation='LINEAR') 支援 `Object3D` 的 translation／rotation／scale，或 `MorphWeights` 的 `'weights'`（values 為 keys × targetCount 個 scalar，cubic triplet 對每個 weight 套用），以及 STEP／LINEAR／CUBICSPLINE。Times 為嚴格遞增非負秒數；cubic values 是 incoming tangent／value／outgoing tangent triplets。Linear Quaternion 取最短路徑，cubic 結果 normalize。
- Morph 在 CPU 執行：Mesh／MorphTargets 擁有 Geometry，以 weights 更新 cached bind vertices／normalized normals；SkinnedMesh 先 morph render bind pose 再 GPU skinning，exact CPU query geometry lazy 更新（第 42 節）。同一 glTF node primitives 共用 morph weights。
- `AnimationClip(name,tracks)` 由最後 keys 算 duration；`scene.animations.clipAction(clip)` cache action。`play()` 繼續而不重設時間、`stop()` 歸零而不還原 pose。Repeat／once／pingpong、reverse、weights／fades／crossfades／ordered layer blending 見第 32 節（P34），已取代 P10 無 blending 基線。`stopAll()` 停止、`destroy()` 釋放。
- Game 在 timers 後、Scene.update 前以 clamp simulation delta 更新 animations，pause／hidden 不累積。勿手動更新同 mixer。SkinnedMesh.updateRenderDeformation() 更新 palette／bounds；updateSkin() 為 exact queries 更新 CPU mirror，不是一般 rendering 路徑。Index topology 不變。

### PBR、光源、陰影、HDR 與 Instancing

- PBRMaterial 繼承 TextureMaterial，全部 slots 借用。Base texture／emissiveTexture RGB 從 sRGB decode；factors／lighting 為 linear。metallicRoughnessTexture 為 linear（G roughness／B metallic）、normalTexture 為 linear tangent-space、使用該 map 獨立 transform 後的 UV0／UV1 derivatives（normalScale）、occlusionTexture 為 linear R（occlusionStrength，只作用於 indirect illumination）。Metallic／roughness 預設0／0.5，emissive 為零。
- alphaMode 為 OPAQUE、MASK（alphaCutoff）或 BLEND；doubleSided 控制 culling／背面 normals。直接建構預設 BLEND（有正 cutoff 則 MASK）、doubleSided=true；glTF 預設 OPAQUE／false。PBR 以 alphaMode 為準，即使 opacity 小於一也不改分類。一般 TextureMaterial 在 opacity 小於一或明確 `transparent: true`（貼圖／頂點 alpha）時進透明 pass。預設 sorted 在 opaque／MASK 後按 bounding sphere 中心距離由遠到近，等距穩定、重用排序儲存；穿插表面仍可能錯誤，可選 weighted 近似。
- Scene.pointLights／spotLights 接受可變 PointLight／SpotLight pools；range=0 無限，spot angles 為弧度。P84 以 bounded selection 取代原八燈 Scene 上限，見第59節；shadow atlas 限制獨立。
- `scene.shadows` 預設 disabled；mapSize=1024、extent=10、near=0.1、far=50、bias=0.002／target 保留原固定 directional camera。Mesh.castShadow／receiveShadow 預設 true。P37 已加入 point／spot shadows 與 2–4 directional cascades，共用 bounded depth atlas／3×3 PCF；光源 flags／device dimensions 見第 35 節。
- scene.postProcessing 預設 disabled。啟用時 3D 先進 HDR floating-point attachment，再 fullscreen exposure（1）、toneMapping（預設 'aces' 或 'none'）、實際 9-tap threshold bloom（strength=0、threshold=1、radius=2 output pixels）。2D overlay 在後且不受影響；resize／disable／destroy 釋放尺寸相關 targets。WebGL2 需 EXT_color_buffer_float，缺少時明確拒絕啟用 HDR processing。
- InstancedMesh({...meshOptions,count}) count 固定且正，matrices 初始 identity。以 setMatrixAt(index,Matrix4) 設有限、可逆 affine matrix，增加 version 通知 upload cache；getMatrixAt(index,out) 重用 out，不要直接改 matrices 而不通知。Indexed hardware instancing 共用 geometry／material，world 為 mesh.worldMatrix × instance matrix，normal 使用 inverse-transpose。
- Environment（`EnvironmentMap`，僅 WebGPU／WebGL2）：`scene.environment` 以 image-based light 照亮 PBRMaterial，`scene.background` 繪製 skybox；兩者可用同一或不同 map，`environmentIntensity`／`backgroundIntensity`（非負，預設 1）縮放，destroyed map 視為不存在。Map 為不可變 2:1 equirect 輻射度影像（height 4..1024、width=2×height、linear light）：`fromPixels(w,h,float RGB|RGBA)`、`fromImageData(8-bit sRGB)`、`fromRGBE(hdrBytes)`（Radiance .hdr，flat 或 RLE，僅 -Y +X 方向，含邊界檢查）與程序化 `gradient({zenith,horizon,ground,sun?})`。方向約定：u=0.5 朝 −Z，v=0 為 +Y。建構時在 CPU 一次過濾（Chromium 中 2048×1024 約 160 ms）：order-2 SH irradiance（÷π、cosine 卷積）供 diffuse，最多 7 層 half-float mip，level≥2 為 cosine-power lobe（roughness=level/(mips−1)），level 1 為 box average。Shader 以 `roughness × (mips−1)` 做 `textureLod`，並用 Karis 解析 split-sum BRDF（無 LUT）。有 environment 時，PBR 略過平面 `ambientLight`，點光／方向光仍疊加；TextureMaterial 不變。Skybox 是先繪製、不使用 depth 的 fullscreen triangle，每像素反投影兩點，故 perspective 與 orthographic 相機皆可；取樣 level 0（無縮小濾波）並與 3D pass 一起 tone map。GPU 副本是以 map 為 key 的 renderer cache，不再使用或 destroy 後釋放。未實作：environment 旋轉、box-projected／視差反射、由 map 產生太陽陰影、背景模糊。已用 unit tests（SH／mips／RGBE）與 Chromium 的 WebGL2、WebGPU 驗證（天空方向、IBL 球體、HDR 路徑、orthographic、runtime 切換，無 console errors）；其他瀏覽器與真實 GPU 視覺一致性未驗證。
- 上段「無 box-projected」是歷史 environment 基線：P38 現有 bounded baked `ReflectionProbe` box projection與cubemap輸入→equirect（第36節）；不是native cube textures／automatic probe capture。
- Frustum culling（WebGPU／WebGL2）測試 world-transformed bounding sphere；一般 Geometry 按 version cache，改 vertices 後需 markUpdated。SkinnedMesh 使用含 morph 的 conservative animated bounds（第 42 節）；InstancedMesh／一般 morph mesh 仍不剔除。視錐外 mesh 保持 cache、shadow caster 仍可繪製；frustumCulled=false 關閉剔除。
- Fog（`scene.fog`、`FogSettings`，WebGPU／WebGL2）：預設停用；`enabled`、`mode` 為 `'linear'`（`near`<`far`，覆蓋率 `(d−near)/(far−near)` 並 clamp）或 `'exp2'`（`density`，覆蓋率 `1−exp(−(density·d)²)`），`color` 為顯示用 sRGB 0..1。`d` 是相機位置到片元的世界距離，因此 orthographic 相機也是以徑向距離計算。`TextureMaterial` 與 `PBRMaterial` 皆向 fog color 漸變；漸變作用於 premultiplied 顏色，半透明表面仍保持半透明。只有 post-processing 以 linear HDR 繪製 3D pass 時才把顏色轉為 linear。Skybox、2D overlay 與 Canvas2D 不受 fog 影響。設定可變，每幀驗證。Uniform 區塊見 `src/data/rendering.ts` 的 `FOG_FLOAT_COUNT`。已用 unit tests，以及在 Chromium WebGL2／WebGPU 的 advanced3d 範例切換驗證（無 console errors、遠處幾何明顯變淡）；兩個 backend 的逐像素一致性與其他瀏覽器未驗證。
- 抗鋸齒（`GameOptions.antialias`，預設 `true`）：WebGPU 以 4× multisample 的 color 與 depth texture 繪製 3D pass（color 為 canvas 格式，post-processing 開啟時為 `rgba16float`），結束時 resolve 到 canvas 或 HDR target；shadow pass 與 2D overlay 不做 multisample。WebGL2 把此旗標傳給 `getContext` 的 `antialias`，預設 framebuffer 是否 multisample 由瀏覽器決定；WebGL2 的 post-processing framebuffer 與 Canvas2D 永不 multisample。`false` 則不建立 multisample texture。切換需重建 Game。在 Chromium WebGPU 上，advanced3d 畫面的獨特顏色數由 6194（關）升到 7449（開），與邊緣混色一致；未做逐像素比較，也未量測其他瀏覽器或 GPU 成本。
- Context 遺失復原（`GameOptions.recoverGraphics`，預設 `true`；WebGL2 與 WebGPU）：`ResilientRenderer` 包住 backend。WebGL2 `webglcontextlost`（或 WebGPU `device.lost`）時，Game 送出 `graphicslost`、取消進行中的 transition、略過 frame；WebGL2 等待 `webglcontextrestored`（WebGPU 直接重新要求 device），建立並初始化替換 renderer，重新 prepare 所有仍存活的 Material2D／PostProcessor2D，還原最後尺寸，最後送出 `graphicsrecovered`。Scene、Texture、geometry 都由 CPU 持有，會延遲重新上傳。Renderer 擁有的 handle 不會保留：遺失前的 `RenderTexture2D` target 與 `RenderSnapshot` 必須重建，復原期間需要 GPU 的呼叫（`createRenderTexture`、`prepareTextures`、`captureScene` 等）會拋 `GraphicsError`。替換 renderer 初始化失敗時，Game 收到 `cause` 為該失敗的 `GraphicsError` 並像以前一樣停止；`recoverGraphics: false` 維持舊的 fatal 行為。已用 mock renderer unit tests（兩個 backend）與 Chromium 以 `WEBGL_lose_context` 驗證 WebGL2（連續兩次、含 HDR 路徑）；未在瀏覽器實測真實 WebGPU device loss，Canvas2D 沒有遺失處理。
- WebGL2 還原逾時：若 `webglcontextrestored` 在 `graphicsRecoveryLimits.restoreTimeoutMs`（10 秒，`src/data/rendering.ts`）內沒有到達，復原以 `GraphicsError`（`cause` 說明逾時）失敗，Game 的行為與替換 renderer 無法初始化時相同。還原或 `Game.destroy()` 時計時器會被清除。WebGPU 直接要求新 device，沒有這段等待。
- 場景效果鏈（`scene.effects3D`，WebGPU 與 WebGL2）：由 `PostProcessor2D` descriptor 組成的有序清單，WGSL／GLSL `effect(color, uv, screen)` ABI、uniforms、需先 `await graphics.preparePostProcessor(effect)` 及生命週期規則都與 `effects2D` 相同。效果鏈看到的是完成後、顯示空間、premultiplied 的 RGBA8 3D 影像（網格、skybox，啟用時含 HDR／bloom／tone mapping），其結果在繪製 2D layer 之前取代原影像，所以 sprite 與 HUD 不受處理。有效果鏈的每幀多用兩個全尺寸 RGBA8 target（WebGPU：canvas 格式的來源加上共用的 ping-pong 對；WebGL2：一個 RGBA8 color／depth target 加上 effect target），清空效果鏈或 canvas 改變大小時釋放。WebGPU 的 3D pass 仍做 multisample 並 resolve 到來源；WebGL2 的效果鏈路徑渲染到離屏 target，不做 multisample。Canvas2D 遇非空效果鏈拋 `UnsupportedGraphicsError`。對 Scene 的 `renderToTexture`／`generateTexture` 不套用。已在 Chromium 兩個 backend 以對打光立方體交換紅藍（含與不含 HDR post-processing）並與未處理畫面比較驗證；其他瀏覽器與 2D overlay 互動未測。
- 渲染統計 `game.graphics.stats` 重用一個 `RenderStats`，需保存時請複製欄位。`meshes`／`culled`／`drawCalls`／`triangles`（含 instances）／`shadowDrawCalls` 保持 3D 定義。`frame` 記各 backend 開始的 frames，包含 2D-only。P40 加入每幀 `drawCalls2D`／`instances2D`／`renderPasses2D`／`uploadBytes` 與 resident／lifetime-peak `renderTargetBytes`／`peakRenderTargetBytes`，見第 39 節。Canvas2D 的 3D counters 為零，不是全部 2D paint／target estimate 都零。原 Chromium 3D-only check（4 meshes／1 culled／3 draws／84 triangles）是歷史證據，不作 P40 metrics 驗收。

見 [advanced3d](../examples/advanced3d/) 與 [使用說明](USAGE-zh.md#11-進階-3d)。上述為 WebGPU／WebGL2 的 3D 功能，Canvas2D 仍 2D-only；Chromium 觀察不等於其他瀏覽器認證或 throughput 保證。

### 每 Slot 的 Texture Sampling

PBRMaterial per-slot TextureSamplerOptions 支援 nearest／linear 的 minFilter、magFilter、mipmapFilter；address modes 為 clamp-to-edge／repeat／mirror-repeat；finite LOD clamps 必須 `0 <= lodMinClamp <= lodMaxClamp <= 32`。預設 linear／clamp，glTF 使用 repeat；同 image 可有不同 sampler、不重複 ownership。Native mip semantics 見第 42 節。

一般 decoded-image texture 仍只 level zero，沒有自動 general mip generation；EnvironmentMap roughness mips 是專用路徑。

## 22. 2D 階層與 Atlas 圖形（P13）

- GameObject 仍為公開 2D facade；mutable local position／rotation／scale 以 parent × local 重算可重用 worldMatrix，保留 shear／reflection。Group2D 不绘製，add／remove、parent／children、updateWorldMatrix／getLocalBounds／containsPoint 沿既有 Scene ownership。Cycle／cross-Scene 拒絕，same-Scene reparent 保留 local pose；remove 解除註冊不 destroy，destroy parent 遞迴清理 children。
- worldVisible 為 visibility AND，worldOpacity／worldTint 相乘、worldZIndex 相加，space 繼承 root。ScreenElement 為 screen-space Group2D；stable world-before-screen 讓 HUD 在所有 world sprites 後，equal z 保留 insertion order。Sprite bounds 含 anchor，singular transform point test 回 false，不是 pixel-alpha picking。
- Sprite.source 為 copied／frozen、有限且正尺寸的 texture 內 Rect2D，可用 fractional x／y／width／height；undefined 整張貼圖。Texture replacement 先驗現有 source 再發布。Width／height 為自然尺寸不含 scale，無 displayWidth／displayHeight。貼圖借用；SpriteSheet constructor／grid 限 immutable integer frames，支援 origin／spacing，createSprite 不 crop／copy images。
- FrameAnimation(sprite,frames,{strategy,speed}) 綁定單 Sprite，duration 為正有限秒。Loop／pingpong／freeze／hide、frame／playing getters、play／pause／reset／reverse／goToFrame／stop；reset 恢復可見與首 frame，stop pause 加 reset。Source 使用 frozen frames，Scene 以模擬 delta 中央推進、removed object 不前進。Native animationframe／animationloop／animationend 同送 animation 與 Sprite，large dt aggregate loops；Sprite destroy pause 並清 animation reference。
- SpriteFont 驗證 Unicode alphabet mapping，可設 caseInsensitive／fallback／glyphWidth／advance／lineHeight。SpriteText 先 preflight 有界 layout／allocation，再重用 glyphs；invalid input 不發布。支援 newline／letterSpacing／lineSpacing／left-center-right，不 import BMFont。
- 上述無BMFont指原P13 sheet constructor，不是目前整個引擎：P27有bounded text／JSON multipage BMFont loading與metrics（第28節）。
- NineSlice source／margins 為 integer pixels、destination 為非負有限有界尺寸（可 fractional）。Stretch／tile／tile-fit／drawCenter 由 owned pooled Sprite children 呈現；tile 使用真實 fractional source remainder，tile-fit 擬合完整 cells。小 destination 同比壓縮相對 margins，resize 先 preflight；hidden pool patches 不放大 Group bounds。兩種 composites 都只 destroy children、不 destroy borrowed Texture。
- 三backend共用flattened affine／source／tint／opacity data，GPU／GL保留UV／adjacent order。P13 pixels／resources見ACCEPTANCE、非FPS／fullframe parity。P13–P20 profiles／formalconsumer／最後工具鏈37files252tests限定scope驗收；見[usage](USAGE-zh.md#12-atlas-圖形與-hudp13)。

## 23. Preload 與 Sample Audio（P18）

- Root exports：PreloadBatch／LoadTask／PreloadProgress／PreloadState／ResourceLoadOptions、SampleAudioAsset／SamplePlayback／SamplePlayOptions／SamplePlaybackState。AudioManager loadSample／sampleTask／opmTask、AssetLoader textureTask／loadBinary／loadText／loadJSON、GLTFLoader.task可用。Scene protected preload(game,signal)回PreloadBatch|void|Promise<PreloadBatch|void>、成功後才initialize；Game.loading只讀current candidate batch，owner guards防舊candidate清新loading。
- PreloadBatch(tasks) 驗 unique nonempty keys、snapshot bound load methods；4 concurrent／4096 tasks。Load({signal?}) 共用單 operation、回 typed ReadonlyMap，state idle／loading／ready／failed／cancelled。Immutable progress completed／total／ratio／currentKey，依 tasks、不依 bytes，empty ratio=1。Native progress／complete／error detail：snapshot／map／actual cause；cancel(reason?) cooperative abort unfinished tasks、不 destroy results／retries。
- Texture／OPM／sample canonical cache 為 per-subscriber abort，單 caller cancel 不 abort loader fetch／其他 borrowers；loader destroy 才中止 underlying requests。Generic 非 cache、signal cancel 個別 request：binary8 MiB、text／JSON1 MiB預設，maxBytes 正整數≤8 MiB；HTTP／HTTPS／data／blob、stream actual-byte bounds。LoadJSON<T> 僅 cast、非 schema validation。
- SampleAudioAsset 初始 encoded-only／decoded=false／metadata undefined；decode／play 需 gesture unlock，decodeAudioData 用 private copy保留 cache。Play lazy decode、await 前 snapshot Scene ownership；manager owns decoded data、sources 共用，sampleTask complete 不等於 decoded-ready。
- Source→perplay Gain→sample channel Gain→sample master Gain→destination 使用第一個 OPM AudioContext，不建第九個／不改 vendor；既有 volume controls 更新 sample buses，worklet reset 保留。獨立32-playback超限拒絕、不搶 OPM slots。
- SamplePlayOptions 加 volume0..1、playbackRate（0,16]）、duration內offset、非負有限scheduledStartTime（絕對 AudioContext 秒），past schedule clamp currentTime。尚未 start 仍playing／position保持offset。State playing／paused／stopped／ended，可變volume／rate，pause／resume／seek／stop；pause固定position，resume／seek換one-shot source不decode，舊ended不污染新source、finished seek拒絕、natural end不等於stop。
- Spatial audio：`SamplePlayOptions.spatial` `{position:{x,y,z}, refDistance=1, maxDistance=10000, rolloffFactor=1, distanceModel='inverse'|'linear'|'exponential', panningModel='equalpower'|'HRTF'}` 將 perplay Gain→PannerNode→channel bus；無效選項（非有限值、refDistance／maxDistance≤0、負 rolloff、linear 且 rolloff>1 或 maxDistance≤refDistance、未知 model）在建立任何 node 前拋 AudioError。`SamplePlayback.position3D` 讀取／移動 emitter（非 spatial playback 的 setter 會拋錯）。`game.audio.listener`（`AudioListenerState`）提供 `setPosition(x,y,z)`、`setOrientation(forward,up)`（非零、不平行），unlock 前保存狀態、sample context 建立後重放；未設定時保留瀏覽器預設。單位與手性依 Web Audio。單元測試用 mock nodes；未做聽感／喇叭或 HRTF 品質驗證。
- Game pause獨立audio clock，Scene stop nonpersistent／detach persistent，manager／Game destroy stop all、釋cache／buses／late results。Encoded8 MiB，**decodeAudioData後**檢查2,097,152frames／8channels／192,000Hz／8,388,608values；不防decoder transient amplification、非global cache budget。
- P18中央整合後限定Chromium驗收：修正後4檔／35 scoped tests、12 owned-file format、ES2022 runtime禁用Promise.withResolvers。原33 tests為歷史、不加總；見[module usage](USAGE-zh.md#13-preload-與-native-samples已落地-p18-modules)，无新full-suite／聽見聲音／其他browser聲明。
- Scene prepare failure／cancel只destroy candidate與清其loading，old非pause繼續update；pause中可完成prepare／publish，resume才simulation。Destroy active／pending恰一次。Unique GLTFLoader.task signal cleanup在partial batch failure只dispose該model／owned textures，成功轉ownership給caller；shared loader results／unrelated direct models仍alive。Custom tasks仍own cleanup，GLTFAsset.dispose在consumers停止後由caller負責。

## 24. Actions、Lifecycle、Pointer 與 Camera（P14）

- Root exports Actions／Easings／ActionQueue、Action／ActionOwner／ActionHandle／ActionState／Easing、CameraStrategies／CameraController2D、CameraBehavior2D／CameraFollowOptions／CameraShakeOptions／PointerTargetEventDetail。GameObject.actions lazy FIFO，passive composites不因Sceneiteration建queue。
- Factories：moveTo／moveBy(x,y,duration,easing?)、rotateTo(angle,duration,easing?)、scaleTo(x,y,duration,easing?)、fadeTo(opacity,duration,easing?)、tween(target,values,duration,easing?)、delay／call(ownerCallback)／sequence(...actions)／parallel(...actions)／repeat(action,count)／repeatForever。Finitevalues／nonnegative秒／opacity[0,1]、tweenproperties已numeric；開始capture起值、sequence傳overshoot、parallel longest branch、repeat freshruntime。Infinite repeat要耗時、10,000 runtime steps／update拒runaway。
- ActionQueue.run回{state,finished,cancel}，finished resolve completed／cancelled含ownerdestroy；clear先detachlist再cancel，listener可enqueue新run。Settlement在complete／cancel usercallbacks前；Sceneidentity／registrationgeneration／Gameactive guards防stale work，remove／readd下frame續跑、失效generation跳postupdate。
- Native target-only initialize首次active tick一次、add／remove {scene}、preupdate／postupdate {dt}、destroy、actionstart／actioncomplete／actioncancel {action,handle}。Native once／signal保持；無bubbling／失效tickprepost配對保證，unobserved lifecycle不建Event。
- PointerEnabled／draggable與hitTestMode graphics／collider。Topmostworld／HUD inverseaffine或shapeaccurate，singulargraphic skip、非pixelalpha；detail {pointerId,button,screen,world,target,originalEvent?} stablevectors。Pointerenter／leave／down／up／move／cancel、dragstart／move／end；multiDOMcapture／parentinverse delta、eachdrag一pointer。256samples／32activeviews／movecoalesce；pause／hidden／teardown cancel，resume丟stale samples，aggregatepolling保留。
- CameraStrategies.follow(target,{axis?,smoothTime?,deadZone?})跟worldorigin，忽略screen／destroyed／foreign target；deadZone viewport-relative logicalpixels。Bounds依zoom／viewport、smallboundscenter。Camera2D.addBehavior／removeBehavior／clearBehaviors insertionorder，moveTo／zoomTo各獨立FIFO回handle；motion→zoom→strategies→shake在systems／physics／particles後render前，laterbounds可覆蓋motion／follow。
- CameraShakeOptions {duration,amplitude:[x,y],frequency?,seed?}；amplitude≥0／frequency>0（default30）／integerseed（default0）／duration×frequency≤uint32。Seedednoise decay只改renderOffset不漂focus、complete／cancel回0。Pause／hidden凍simulation，picking用最近rendercamera；destroy settleshandles／釋strategies。
- Easings linear、quad／cubic／sine In／Out／InOut、bounceOut；customoutput finite[0,1]、無back／elastic。實際Canvas nativeinteraction／camera與各scopedcounts見ACCEPTANCE；[usage](USAGE-zh.md#14-actionspointer-targets-與-camerap14)。

## 25. Bounded World Physics、Maps 與 Particles（P15–P17）

### Physics

- Root exports RigidBody2D／RigidBodyOptions、Collider2D／Colliders／ColliderKind／ColliderOptions、PhysicsWorld2D／PhysicsWorldOptions／CollisionDetail／ContactQuery／PhysicsRayHit、Trigger2D／TriggerOptions。Scene.physics 自動註冊 GameObject.body／collider；collider-only 為 static。不可變 body type 是 static／dynamic／kinematic；velocity 為 Vector2，angularVelocity 為弧度／秒。Kinematic 使用規定速度、零反質量／慣性；dynamic 保留 force／damping／gravity／sleep。
- Collider snapshot 為 centered circle／box／strictly convex polygon＋optional offset；polygon 3–32 vertices，invalid／degenerate／concave 拒絕。Extent 上限1,000,000；transform nonsingular，circle uniform scale。所有 non-static body 必須 world root，nested static 可 affine；無 screen physics。Scale 更新 geometry／inertia。
- Discrete fixed-step broadphase／exact convex contacts 使用 iterative linear／angular impulse 與 positional correction。Default gravityY980／fixedDelta1/120／maxSubSteps12／velocityIterations8／positionIterations3；step 正 finite、substeps1–120／iterations1–64，≤16,384 colliders；droppedTime 報 discarded catch-up。P43 time-weighted force／torque 保留 unfinished-tick contribution，fixed force 排下個 step，clearForces 取消 queue。無 dynamic concave／compound／zero-width edges／3D；無 CCD 可穿隧。
- Reciprocaluint32category／mask default1／all，sensor只detect。collisionstart／precollision／postcollision／collisionend detail {self,other,normal,points,penetration,sensor,cancelResponse} stable snapshots／receiverreversednormal／currentstep-onlycancel；callbackfilter／remove／destroy保safeend。overlap(collider,owner) exactContactQuery[]排self／reciprocalfilter，raycast(origin,direction,maxDistance,mask?) normalize非零direction、sortedPhysicsRayHit[]。
- v1.12.3 對不可觀察的 receiver 不建立 collision snapshot／event，sensor 不計算不使用的 restitution；contact membership 與 response 語意不變。每個 receiver 前檢查 observation，callback 中新增 listener 仍收到當次事件，custom dispatch interception 也保留。實測 frame time 與未放寬的 host-scoped gates 分別記 ACCEPTANCE。
- Trigger2D(collider,{filter?,repeat?,onEnter?}) clone static sensor，default1acceptedenter／repeat0inactive／Infinityexplicit，triggerenter／triggerexit {self,other}／readonlyremainingRepeats，filterreject不耗count、不autodestroy。
- Sleeping（P31）：dynamic body 的線速度低於 `physicsDefaults.sleepLinearVelocity`（0.1）且角速度低於 `sleepAngularVelocity`（0.05）持續 `sleepTime`（0.5 秒）才會休眠，而且必須是其非 sensor 接觸群組內所有 dynamic body 都閒置，所以一疊物體會一起休眠。休眠 body 不做積分與接觸求解，速度歸零。以下情況會喚醒：`applyForce`／`applyImpulse`／`velocity`／`angularVelocity`／`wake()`、transform 被修改（`isSleeping` 比較入睡時記下的姿態）、sensor 接觸、運動中的 body 碰到該群組、接觸結束或接觸中的 static collider 移動。`RigidBodyOptions.allowSleep`（預設 true，亦有 setter）與 `body.isSleeping` 為對外介面；`isSleeping` 是 getter，偵測到姿態或速度變化時可能順便喚醒 body。
- Continuous collision：RigidBodyOptions.ccd／body.ccd 預設 false；P76 以 bounded relative rigid-motion CCD、真 contact response／explicit exhaustion 取代 P31 translation-only static-target algorithm（第59節）。
- Joints（P31）：`scene.physics.addJoint(joint)` 可附加 `DistanceJoint`（剛性，或以 `frequencyHz`／`dampingRatio` 變成軟彈簧）、`RevoluteJoint`（銷接，可選角度限制與馬達）、`PrismaticJoint`（沿軸滑動，含位移限制與馬達，旋轉鎖定）、`WeldJoint`，以及 `MouseJoint`（朝 `setTarget(x, y)` 軟拖曳，受 `maxForce` 限制）；以 `removeJoint`／`joints` 管理（上限 4,096）。Body 必須已註冊、至少一個為 dynamic，任一 body 被 unregister 時 joint 會自動分離。`anchor` 是 `bodyA` 上的世界座標點，`anchorB`（預設同 `anchor`）是 `bodyB` 上的世界座標點；兩者於附加時依當下姿態轉成 body-local anchor，不含 scale。未給 `bodyB` 時固定世界成為 A 側，所以角度、位移、軸與馬達速度都是該 body 相對世界的值。拘束使用不含 warm starting 的 sequential impulses，沿用既有 velocity／position iterations，很硬的鏈需要更多 `velocityIterations`。jointed body 預設不互相碰撞（`collideConnected` 可開），會成群休眠，joint 會喚醒休眠的夥伴。`breakForce` 在該 step 的 anchor 反作用力（每秒衝量）超過時移除 joint 並呼叫一次 `onBreak`。限制：無 rope／gear／pulley／wheel／friction joint，無 warm starting。
- 凹形與 chain（P31）：`decomposeConvex(vertices)` 將簡單多邊形（任一繞向、最多 256 個頂點、容許共線點）以 ear clipping 加 Hertel–Mehlhorn 合併，切成最多 32 頂點、嚴格凸且逆時針的片段；自交或零面積輸入拋 `RangeError`，片段數不保證最少。`StaticConcave2D(vertices, options?)` 是子物件為 static 凸片段的 GameObject（`friction`、`restitution`、`category`、`mask` 套用到每片），可移動或仿射縮放，但沒有 dynamic 的凹形 body。`StaticChain2D(points, {closed?, thickness?})` 每段建立一個細長凸四邊形（預設厚度 2，兩端各延伸半個厚度）。Chain 是有厚度的實心帶，不是零寬 edge：比厚度更薄的 body，或每 step 移動超過厚度者，除非使用 `ccd` 仍可能穿隧。以 `scene.add(shape)` 加入，各子物件如同 collider-only 物件註冊。
- Restitution 門檻（P31）：接觸的接近速度超過 `max(restitutionThreshold 1, |gravity| × fixedDelta × restitutionGravitySteps 2)` 才會反彈，所以像素尺度下靜止在重力中的彈性 body 能穩定並休眠，不會永遠抖動；強烈撞擊仍會反彈。
- Debug draw（P31）：`world.debugSnapshot()` 以純資料複製目前的 collider（種類、世界座標點或圓心／半徑、bounds、`dynamic`、`sensor`、`sleeping`）、活躍接觸（點、法線）與 joint（`type`、世界座標 `anchors`）。`PhysicsDebugDraw2D.create(world, {colliders, contacts, joints, bounds, region, zIndex})` 透過 `Graphics2D` 在所有 backend 繪出：static 藍、清醒的 dynamic 綠、休眠灰、sensor 黃、接觸紅、joint 青。把 `debug.display` 加入 Scene 並呼叫 `refresh()`（重繪進行中的呼叫會被略過）；`visible` 切換顯示、`destroy()` 釋放 raster。這是除錯輔助，不是每幀正式繪製：每次 refresh 都重新 rasterize 所有繪製內容的外框，overlay 會落後模擬一個 rasterize 的時間；沒給 `region` 時，超出 Graphics2D 座標／紋理預算的 body 會讓 refresh 被拒絕（記錄 log，保留上一張 overlay）。傳入 `region`（例如可視範圍）可略過範圍外的 shape、接觸，以及任一 anchor 在範圍外的 joint；只部分重疊的 shape 仍會整個繪出。

### Maps

- TileMapOptions {columns,rows,tileWidth,tileHeight,sheet}正integergrid≤65,536cells／positivefinite dimensions；IsometricMapOptions加elevationStep≥0（defaulttileHeight/2）。Group2D借sheet／Texture、重用Sprite／colliderchildren。
- ImmutableTile {frame:number|undefined,solid,elevation,collider?,metadata?}，setTile(column,row,Partial<Tile>) preflightgraphics／shape／registration，getTile驗grid、clearTile reset。Solid預設top-leftbox／isodiamond或customconvex；可無visibleframe，screensolid拒絕。
- tileToLocal／tileToWorld(column,row,out?)含cellelevation，orthotopleft／isotopvertex。worldToTile(point,out?) hierarchyinverse到zero-plane、可回grid外integer；無known-elevation overload。pickTile(point,out?) elevatedtopmostgraphicrectangle／diagonal-elevation-insertionorder，非alpha／exactdiamond；singularpickundefined、inverse拒絕。
- Camera transformedconservativecull含elevation／overhang／renderOffset，只改renderEnabled、不移solids；hidden／clearedpool保留重用且不擴bounds。Edits／transform／Scene removal／destroy更新colliders，destroyownedchildren不destroyborrowedatlas。無hex／staggered／multilayer／editorimporter／navigation。
- Navigation為原map profile排除項；P42現已批准navigation／pathfinding，editor importers／hex／staggered仍不在新批准範圍。

### Particles

- Root ParticleEmitter／ParticleEmitterOptions／ParticleNozzle；必填texture／capacity1–16,384／rate≥0／lifetime-speed-angleorderedpairs／startSize-endSize widthheight／normalizedstartColor-endColor；optionalsource／acceleration／nozzle／seed／space local-world。Lifetime>0／angleradians；defaultpoint、rectangle widthheight或circleradius。Optionssnapshot、sizeanimation不改borrowedTexture／sourcedimensions。
- CPUfixedSpritepool／typedstate、analyticconstantacceleration／lifetimeinterpolation／seedednozzle。Fractionalrate newborn按birthtimeage，emit(count) stopped可burst；dropnewcapacity不backlog／unboundedloop。Initialstopped、start／stop／clear、activeCount／emittingreadonly；stop留survivors、clearresetfraction／reuse，destroy只ownedchildren。
- Local承ancestor，worldcapturefullbirthaxes／position／velocity／acceleration，oldbirth不隨parentmove、新birth採newparent。Simulationlocal／world與renderworld／screen分開、HUD可用不physics；pause凍age，Scene在physics後更新、不由caller重複推。
- 三forcedbackend正式Game48assertions／21screenshots／0errors、3files40tests／ownedformat，sourceVite／proceduralatlas／test-onlyGPU COPY_SRC；borrowedTexture保至ownercleanup。非dist／其他browser／performance；[usage](USAGE-zh.md#15-physicsmaps-與-cpu-particlesp15p17)。

## 26. Native 2D Shader ABI 與 Lifetime（P20）

- Root Material2D／PostProcessor2D／NativeEffect2DOptions：必填immutablewgsl／glsl nonempty各≤65,536chars，optionalfinitefloatrepresentableuniforms≤16。EventTarget descriptor wgsl／glsl／destroyed／uniforms Float32Array16、setUniforms zero-fill、idempotentdestroy發native destroy。Callerowned、Scene.effects2D／Sprite.material借。
- 每renderer先await prepareMaterial／preparePostProcessor Promise<void>，same-descriptorcache／coalesce；compiler／validation GraphicsError、unprepared／destroyed拒絕無fallback。Pendingteardown不publish／leaklateprepare。
- Native WGSL fn effect(color:vec4f,uv:vec2f,screen:vec2f)->vec4f、GLSL vec4 effect(vec4 color,vec2 uv,vec2 screen)。Renderer固定vertex／input／texture／sampler／uniformdecl、非IR／transpiler。Fourvec4：WGSL uniforms.values:array<vec4f,4>／GLSL vec4 uniforms[4]，uniformValue讀0–3vec4；input／returnpremultRGBA、materialuvsource-localnormalized、screenlogicalpixels。Post sampleInput(topLeftNormalizedUV)兩backend同orientation。
- Stage既有3D／P12HDR exposure-ACES-bloom→transparentRGBA8 world2D＋HUD→ordered effects2D pingpong→composite→wholeframe transition。Material保sourceUV／tint／opacity／hierarchy／z只改attachedSprite；2Dpost不處理3D／HDR、emptyeffects原path。
- 核准lifetime：viewport-independent preparedpipeline／program＋uniforms跨resize／disable保至descriptor、無asyncreprepare；mutablelayer／transitionattachments釋放。Descriptordestroy同步釋entry、rendererloss／destroy清all。Ownedimmutablesnapshot跨oldScene／Texturedestroy／resize存活scale，complete／cancel／explicitdestroy／loss／rendererdestroy才釋放。Caller先移consumers再destroyshared descriptors。
- Canvasprepare／visiblematerial／nonempty effects2D拋UnsupportedGraphicsError，auto不保customShaders、不silentignore。無arbitrarybindgroups／extratextures／customvertices／ShaderGraph。
- ActualGPU／GLuniform-order-top-leftpixels、GPUHDR不變與capture、20resize-disable-reenable／descriptordestroy／trackednativeteardown0見ACCEPTANCE，非totaldrivermemory／FPS／GC／fullframeparity；[usage](USAGE-zh.md#16-native-sprite-materials-與-2d-postp20)。

## 27. Whole-Frame Transitions（P19）

- Root TransitionOptions／TransitionController／SetSceneOptions／SceneTransitionEventDetail與graphicsRenderSnapshot／TransitionFrame／FrameEffects。Game.setScene(next,options?:SetSceneOptions):Promise<void>，options.transition；Game.transitioning readonlyvisualonly。Kindfade／crossfade／slide、finite duration≥0秒、normalizedcolor opaque-blackdefault／easinglinear／directionleft-right-up-down（leftdefault）／blockInputtrue。
- Prepare時oldupdate，ownedcapture／version-abortchecks成功才publish／syncdestroyold、只有newsimulate；Promise等lastcompositedframe。Pause／hidden凍clock、resize保snapshot／scale；initialno-old／idle／duration0 atomic skipcapture／visualevents。Failure保active，replacementcancelvisual／candidate以existingSceneCancelledErrorreject／exact-once dispose；loss／destroycancel。
- Native transitionstart／complete／cancel {from,to,kind}只actualvisual；blockInput resetcapture／停targetpointerrouting、非globalkeyboard／pointerpolling。Controller驗options，kind／progress／complete getters與readonlyduration／blockInput，advance(dt)重用同TransitionFrame、destroyidempotentownedcapture，不ownScenes。
- Renderer.captureScene(scene,width,height):Promise<RenderSnapshot>無simulation重畫全frame、排transitionoverlay，logicalargs／backingdims；ownedtexture／FBO／copycanvas不借oldresources、不延後讀defaultGLcanvas。Handle backend／width／height／destroyed／destroy；wrongowner／destroyed／nestedactiveframecapture拒。Render第四FrameEffects.transition {kind,progress,snapshot?,color,direction}需normalizedprogress／color；missingcapture用color。AutoPresentedRenderer forwardcapture／presentfinalcomposite。
- Actual三backend Game crossfade／fade已限定驗收：oldsyncdestroy／onlyincoming simulation、pause-pendingPromise／resize-ownedcapture／finalcompositedcomplete＋release／customeasingfinal1。初始central4files30tests covercapture／version／reentry／failure races；追加actual nativeGames另證presented-slide cancel、held nativecapture supersession／late disposal、同步cancel-listener reentry／latest winner及held-capture destroy：12snapshots全dispose，各backend errors=[]。Destroy立即釋Scenes／captures與停frames，公共Promise仍等受控native capture回傳才reject cancellation，不聲明提前abort await。正式rootconsumer另證三backendpaused-effect cancel保publishedScene／真3resources preload／native8contexts PCM＋OPM／nativeeffects-or-Canvasreject／teardown；最後工具鏈37files252tests／built-extracted ES2022rootruntime／strictdeclarationconsumer通過、14vendorfilesbyteidentical。[Usage](USAGE-zh.md#17-whole-frame-scene-transitionsp19)。

## 28. PixiJS-inspired Profiles（P21–P29；已整合，單一環境已測）

比較基準為 [stable PixiJS v8.21.0](https://github.com/pixijs/pixijs/releases/tag/v8.21.0)，不是 main／外部 plugins。[PLAN](../PLAN.md) 定義批准有限範圍，[ACCEPTANCE](../ACCEPTANCE.md) 記錄實際觀察（單一環境：macOS arm64 managed headless Chromium，含 WebGPU adapter）與未驗項。既有 252 tests 與 GitHub v1.2 不包含本輪擴充。WebGPU／WebGL2／Canvas2D 執行同一份 2D command stream；正式範例見 [examples/rendering2d](../examples/rendering2d/index.html)。

- P21 保留 mutable vectors、Sprite 自然尺寸、summed global z／stable registration／world→HUD。Pixel pivot 不同於 normalized anchor；座標 helpers 是 logical Scene world，不含 Camera conversion。
- P22 immutable views 借同一 source，記錄 physical frame／trim／orig、clockwise 0／90、resolution／anchors／borders。Atlas acquisition 擁有 pages，普通 views／Sprites 不擁有。Tiling transforms／nearest-linear／roundPixels 為有限 profile。
- P23 Graphics 為 bounded Canvas2D raster textures，含 centered strokes／curves／holes／gradient／local patterns；放大超過 raster resolution 可模糊，非 GPU vectors／full SVG importer。
- P24 renderer-bound mutable offscreen targets 不同於 P19 opaque immutable whole-frame RenderSnapshot。明確 isolation 才佔一個 outer ordering slot，普通 Group 仍 global sort；cache 變更須手動 updateCache，children 繼續 simulation。CanvasTexture 擁有 versioned snapshot，extract／generated CPU texture 獨立 ownership。
- 目前 Canvas2D 的完整未 tint image frame 借既有 versioned source snapshot，不為每 sprite 重畫 shared scratch。Cropped／packed-rotated／flipped／tinted frame 保留 pixel conversion path；source version invalidation／borrowed ownership 不變。Native 效能觀察只涵蓋已記錄的 workload／host，不承諾通用 FPS。
- P25 rectangle／path masks picking 含 geometric holes；image mask 只測 transformed source bounds，不讀 pixel alpha。預設 alpha 有意不同於 Pixi red。Premultiplied erase 只影響 earlier transparent 2D，不擦 3D／P12。Masks／五 blends 目標三 backend；ordered Alpha／ColorMatrix／Blur／Noise／Displacement native filters 目標 GPU／GL，Canvas 必須明確拒絕。
- P26 native meshes／plane／rope／true projective quad 目標 GPU／GL，triangle picking／invalid quad atomic reject。Canvas visible meshes 必須 UnsupportedGraphicsError，不暗示 software fallback／backend switch。
- P27 browser-shaped Text2D 不同於 code-point SpriteText；後者不承諾 grapheme／ligature shaping。Bounded text／JSON multipage BMFont 含 proportional metrics／zero-area whitespace／kerning。FontFace、dynamic RGBA atlas generation／owned manifest unload 必做；aliases／bundles 重用 PreloadBatch task-count progress。
- P28 hierarchy capture-target-bubble 為 opt-in，P14 default routing／lifecycle 仍 target-only；image picking 仍 bounds-only。Game-owned accessibility 只 mirror semantics／focus／activation，不畫視覺替代，DOM／listeners 須隨 ownership 清理。
- P29 fixed-capacity drop-new ParticleLayer、versioned static setters／dynamic fields 重用 P17 simulation；prepareTextures／unload 區分 native upload 與 borrowed CPU source，unload 不 destroy CPU image。

Anchors／borders、CanvasTexture、generated font atlas、ParticleLayer、prepare／unload 全必做。Full SVG／HTMLText／SDF-MSDF／native vector tessellation、video／raw／compressed／mipmaps／anisotropy、其他 advanced blends、generic plugins／render layers、independent Ticker／general automatic GC 不在範圍；已觀察的 pixels 不等於 throughput／跨 browser／真實硬體／full-frame parity 證據。

Compressed／mip sources是P21–P29當時排除、非永久non-goal：P32加入base-level RGBA8 KTX2／外部codec接口，P42批准native compressed／mip upload；其餘上述排除項保持。

## 29. 存檔欄位與 Scene Snapshot（P30）

- `game.saves` 是建立在可注入 `SaveStorage` 上的 `SaveManager`（`GameOptions.saveStorage`、`saveSchema`）。預設為隔離的記憶體 `MemoryStorage`，所以不注入瀏覽器 backend 就不會持久化：可用 `LocalStorageBackend(namespace)` 或 `IndexedDBStorage(namespace, database)`。Backend 皆為 async、以 namespace 隔離（`clear()` 不影響其他 namespace），超過 `storageLimits.maxBytes`（2 MiB，`src/data/storage.ts`）以 `StorageError('size')` 拒絕；配額錯誤為 `'quota'`，IndexedDB 不可用為 `'unavailable'`，其他為 `'io'`。
- `save(slot, data, playTime?)` 只接受純 JSON：NaN／Infinity、function、symbol、bigint、`undefined`、Date、class instance、循環參照與稀疏陣列都以 `StorageError('invalid')` 拒絕，不會被悄悄轉型。儲存的 envelope 含 record（`version`、`data`、`metadata.savedAt／playTime`）與非密碼學 FNV-1a checksum，只偵測意外損毀，不防竄改。
- `load(slot)` 回傳 `{status:'missing'}`、`{status:'loaded', record}` 或 `{status:'corrupt', raw, error}`。損毀、較新版本、checksum 不符或 schema 驗證失敗的內容會保留原文並回報，不會刪除或覆寫。舊版本依序逐版呼叫 `SaveSchema.migrate(fromVersion, data)`（原儲存內容在下次 `save` 前不會被改寫），migrate 後再跑 `validate(data)`。
- `Serializer(scene)` 是明確、opt-in 的註冊表：`register(id, object, state?)` 將穩定 id 綁到該 Scene 內的 `SceneObject`。預設 `sceneObjectState` 對 2D 選用 `gameObjectState`（transform、visibility、opacity、`RigidBody2D` 速度及 `Text2D.text`），對 3D 選用 `object3DState`（transform 與 rigid-body 狀態）；其他物件型別須明確提供 `Serializable`。`capture()` 回傳分離的 JSON-safe `SceneSnapshot`。`restore(snapshot, 'ignore' | 'error')` 先驗證 JSON 結構與 id，再套用 adapter，回報 `{restored, unknown, missing}`；`'error'` 在 id 不一致時於套用前拋錯。Adapter 專屬驗證發生在套用時，live restore 並不是跨 adapter 的交易。它不會建立物件、組件、資產或 Scene；動態內容先用 `ContentScene.rebuild()` 重建再 restore。`isSceneSnapshot(value)` 用於縮窄載入的 JSON。
- 不涵蓋加密、雲端同步、任意物件自動反射與 GPU／資產 snapshot；P74 新增有界原生跨分頁協調（第59節）。
- `game.i18n`（`GameOptions.i18n`，`I18n` 類別，為 `EventTarget`）保存各 locale 的訊息表。巢狀表會攤平成點分隔 key（`menu.start`）；所有 key 都是 `Intl.PluralRules` 類別且含字串 `other` 的表視為複數訊息（因此只含這類 key 的巢狀表無法表達）。查詢會先走目前 locale 的父層（`zh-Hant-TW` → `zh-Hant` → `zh`），再走各 `fallback` locale 及其父層。`{name}` 以 `params` 插值，數字以目前 locale 的 `Intl.NumberFormat` 格式化；`{{`、`}}` 為字面大括號；缺少參數會拋 `I18nError`。複數訊息需要有限數字 `count`。缺 key 預設回傳 key 本身，也可設 `missing: 'error'` 拋錯或傳入函式。`formatNumber`／`formatDate` 包裝 `Intl`；locale tag 會正規化，無效 tag 拋錯。
- `setLocale()` 只在 locale 真的改變時送出 `localechange`（`detail: {locale, previous}`）並更新所有 `bindText(text2d, key, params)` 綁定。綁定經 `Text2D.setText` 重新 rasterize（沿用其 latest-wins 規則），失敗透過 `logger` 記錄，Text2D 被 destroy 時自動解除，`Game.destroy()` 會清掉全部綁定。不是單一 key 的動態文字（例如狀態列）需由呼叫端在 `localechange` 時自行重繪。訊息不會自動從檔案載入；請自行載入 JSON 後呼叫 `addMessages`。

## 30. glTF 壓縮與 KTX2（P32）

- `EXT_meshopt_compression` 由 `decodeMeshopt(target, count, stride, source, mode, filter?)`（亦為公開匯出）解碼：從零實作 meshoptimizer 的 vertex codec（版本 0 與 1）、triangle 與 index-sequence codec，以及 `OCTAHEDRAL`、`QUATERNION`、`EXPONENTIAL`、`COLOR` filter。所有讀取都對壓縮輸入做邊界檢查，輸出只寫入大小為 `count × stride` 的 target，格式錯誤拋 `AssetError`。`GLTFLoader` 在解析時解碼壓縮的 `bufferViews`，忽略其未壓縮 fallback 的 `buffer`／`byteOffset`。`EXT_meshopt_compression.fallback: true` 的 buffer 不會被讀取；指向它的未壓縮 view 會被拒絕。因此此擴充可作為 `extensionsRequired`。解碼為 eager（含未被引用的 view），並計入 `modelLimits.decodedBytes`。
- `KHR_draco_mesh_compression` 需要自行提供解碼器：`GLTFLoadOptions.dracoDecoder({data, attributes})` 收到壓縮位元組與 semantic → Draco attribute id 對照，回傳 `{indices?, attributes}`，每個 semantic 一個陣列，使用 accessor 的邏輯值空間（反量化後的浮點數；normalized 整數 accessor 為 normalized 浮點數）。Loader 會檢查長度與有限值，並以其取代 accessor 的 `bufferView`。XYZ.js 不內建 Draco WebAssembly。沒有解碼器時：required 會被拒絕；只是 used 時，只有 `POSITION` accessor 帶有未壓縮 fallback `bufferView` 的 primitive 才會載入，不會悄悄渲染成全 0。
- 預設 KTX2：parseKTX2 驗證 header／descriptors／level ranges；decodeKTX2(bytes, transcoder?, signal?) 回 base RGBA8，plain R8G8B8(A8)_UNORM/SRGB 支援無或 bounded ZLIB supercompression。Basis／GPU block formats／Zstandard 需外部 RGBA8 transcoder。只 plain 2D、此預設路徑忽略額外 mips。GLTFLoader 辨識 KTX2 bytes／MIME；提供 ktx2Transcoder 或 nativeTextures 時使用 KHR_texture_basisu extension source，否則用可用的一般 source。Native opt-in 使用獨立 callback、保留 mips（第 42 節）。
- 上述 base-RGBA8 是預設 decoded profile，不是 native opt-in 限制。P42 加入 decodeKTX2Native／GLTFLoadOptions.nativeTextures（第 42 節）。Quaternion filter 可能與 C++ 差一最小單位；外部 Draco／Basis 品質／速度仍由呼叫者負責。

## 31. Gestures、Gamepad 對照與震動、Audio Sprite／Stream／暫停（P33）

- `game.input.gestures`（`GestureRecognizer`，為 `EventTarget`）觀察 pointer 串流並送出 `CustomEvent<GestureDetail>`：`tap`、`doubletap`、`longpress`、`swipe`、`pan`、`pinch`、`rotate`；`on(type, listener)` 回傳取消訂閱的函式。它不消耗 sample，也不改變 Scene 的 pointer 路由。Detail 包含 `phase`（`start`／`change`／`end`／`cancel`；離散手勢只送 `end`）、`pointerIds`、`pointerType`、`center`、`translation`、`velocity`（px/s）、`direction`（swipe，取主軸）、`scale`（pinch）與 `rotation`（弧度，跨越 ±π 時展開）。門檻是 `src/data/input.ts` 的 `gestureDefaults`（tap 位移 10 px／300 ms、double tap 300 ms／30 px、long press 500 ms、swipe ≥ 40 px 且 ≤ 500 ms 且 ≥ 300 px/s、pan 8 px、pinch 5 %、rotate 0.1 rad），可針對每個 recognizer 覆寫。tap 一律會送出，`doubletap` 在第二次 tap 後追加；`longpress` 由每幀 update 判定，所以只在 Game 執行中觸發。只追蹤前兩個同時存在的 pointer，滑鼠只用主鍵，第二個 pointer 會取消進行中的 pan，pinch 後留下的 pointer 不會變成 tap。頁面隱藏／blur／pause 會重置並取消進行中的手勢。
- `GamepadState.addMapping({match, buttons?, triggerAxes?, axes?})` 讓非標準手把經由你提供的「原始索引 → 標準名稱」表讀取（`match`：`pad.id` 的不分大小寫子字串或 RegExp；後註冊者優先；回傳的函式可移除）。沒有符合的 mapping 時非標準手把仍會被忽略，標準手把也不會被重新對應；未列出的輸出為中立值。XYZ.js 不內建裝置資料庫，每個 mapping 都必須在實體裝置上自行驗證。`gamepad.mapping` 顯示目前採用的 profile。
- `gamepad.rumble({duration, strong, weak, startDelay})` 透過 `vibrationActuator.playEffect`（Chromium）或舊版 `hapticActuators[0].pulse`（舊 Firefox）播放 dual-rumble，只有效果完整播完才 resolve `true`（`false`：沒有手把／actuator、被取代或被瀏覽器拒絕）；`stopRumble()` 呼叫 `reset()`。超出 0..5000 ms／0..1 的參數拋 `RangeError`。
- Audio sprite：`SampleAudioAsset.defineSprites({name: {start, end}})` 為同一個已解碼 buffer 的區段（秒，上限 1,024 個）命名；`playSprite(name, options)` 只播放該區段（loop 在區段內循環，position 保持在區段內，pause／seek／rate 可用，超出解碼長度的區段於播放時拒絕）。底層選項為 `SamplePlayOptions.region`。
- Streaming：`audio.stream(url, {channel, loop, volume, playbackRate, startTime, autoplay, crossOrigin, signal, scene, persistent})` 透過接進 channel bus 的 `HTMLAudioElement` 播放長檔，下載完成前即可開始，且不會解碼進記憶體。`AudioStream` 提供 `play()`、`pause()`、`seek()`、`stop()`、`state`、`position`、`duration`、`loop`、`volume`、`playbackRate` 與 `ended`／`error` 事件。與 sample 一樣需要已解鎖的 context，計入 `gameplayAssetLimits.samplePlaybacks`，遵循 Scene 所有權與 `AudioManager.destroy()`。跨來源 URL 預設 `crossOrigin='anonymous'`，伺服器需提供 CORS，否則 Web Audio 只會收到靜音。Stream 沒有取樣精度，loop 可能有間隙，seek 需要支援 range 的伺服器。
- 暫停政策：`audio.pause(reason = 'user')`／`audio.resume(reason)`／`audio.paused` 會凍結音訊，直到所有 reason 都已 resume。OPM 軌道靜音且時間軸停止，resume 後從下一個音符繼續，不重播暫停當下正在響的音符；sample 與 stream 在目前位置暫停並一起恢復（應用程式自己先暫停的維持暫停），暫停期間建立的 playback 會等到 resume 才開始。`GameOptions.audioPause = {onPause, onHidden}`（皆預設 false，既有行為不變）可連動 `game.pause()`／`resume()` 與頁面可見性。

## 32. 動畫混合、State Machine、Tween 與 Timeline（P34）

- `AnimationAction` 新增 `weight`（0–1）、`fadeIn(秒)`、`fadeOut(秒)`、`crossFadeTo(other, 秒)`、`loopMode`（`'once' | 'repeat' | 'pingpong'`；`loop` 布林仍可切換 `repeat`／`once`）、`normalizedTime`、`effectiveWeight`（weight × fade 係數）與 `on('loop' | 'finished', listener)`。指派 `time` 會 seek，下一次 `update` 在該處取樣。Action 依加入順序分層：每個 action 在前面 action 留下的姿態上，以其有效權重取樣（translation、scale、morph weights 線性混合；rotation 以最短路徑 normalized lerp），所以權重 1 即取代（維持先前「最後一個 action 勝出」的行為），部分權重則混合。權重低於 1 的第一層會與目標當前姿態混合，因此單獨 fadeIn 會從目前姿態出發，單獨 fadeOut 會凍結姿態而不是回到靜止姿態。
- `crossFadeTo(other, d)` 把 `other` 升到最上層，在本 action 之上淡入；本 action 在底下維持完整權重，淡入完成後才停止（即單純線性混合；`d = 0` 立即切換）。fadeOut 歸零時 action 會停止並重設時間。
- `new AnimationStateMachine(mixer, {states, transitions, initial, parameters, triggers})`（例如 `scene.animations`）向 mixer 註冊，每次 `update` 前評估，不需額外呼叫。State 指定 clip 與 `loop`／`speed`；parameter 為數字或布林，型別由初始值決定（`setParameter`、`parameter`）；trigger 是一次性的（`trigger(name)` 武裝後直到被某個 transition 消耗）。Transition 依序從目前 state（或 `*`）嘗試，所有給定的條件都必須成立：`when(parameters)`、`trigger`、`exitTime`（來源 clip 的比例）。三者都沒有時，等待非循環的來源 state 結束。`duration` 是 cross-fade（預設 0.2 秒）。Transition 可被打斷：目前 state 永遠是最新一次 fade 的目的地。`setState(name, fade)` 強制切換，`statechange` 事件帶 `{from, to}`，`destroy()` 解除註冊。建構時會驗證未知 state／trigger、範圍，以及從循環 state 出發的無條件 transition。
- `Tween.to(target, values, options)`／`Tween.from(...)` 讓任何物件的有限數值屬性（含巢狀路徑，例如 `'position.x'`，建構時即驗證）產生動畫。選項：`duration`、`delay`、`easing`（`Easings` 名稱或函式）、`repeat`（整數或 `Infinity`）、`yoyo`、`onStart`／`onUpdate`／`onComplete`。起始值在 tween 第一次執行時讀取，所以串接的 tween 會接續上一個結束的位置；`reset()`／`stop()` 還原第一次執行前屬性的值。目標回報 `destroyed === true` 時 tween 會安靜結束。
- `Timeline` 以 `add(item, at | label, offset)`、`then(item, gap)`、`label(name, at)`、`call(callback, at)` 安排 `Tween`（或巢狀 timeline），支援 `play`、`pause`、`stop`、`seek`、`timeScale`、`repeat` 與 `onComplete`。以 `seek` 拖曳只會呈現狀態：callback 只在播放經過時執行，每個 pass 一次。播放頭位於其前方的項目會被還原（後加入者先還原）。Timeline 不能包含無限重複的項目。
- `scene.tweens`（`TweenGroup`）以 Scene 時間在 `scene.timers` 之後啟動並推進 tween 與 timeline，丟棄已完成者，`clear()` 不會讓它們跑完，並隨 Scene 銷毀。`tweens.to/from(...)` 是捷徑。2D 的 `Actions` API 不變，仍適合 sprite 序列；Tween／Timeline 針對任意屬性。
- 歷史 P34 layering 依順序、不是 normalized weighted average；state machine 仍扁平。P42 現有 masks／additive layers／blend trees／two-bone IK bounded profiles（第 42 節），不代表完整 parity 或整合驗收完成。

## 33. 工具：DebugOverlay、範例 Smoke、Release Workflow、Tree Shaking、Benchmarks（P35 歷史基線）

- `DebugOverlay.attach(game, {position, interval, extra})` 在 canvas 上方加入純 DOM 的 `<pre>`（`aria-hidden`、不接收 pointer），顯示以真實時間計算的 fps 與 ms/frame（由實際經過時間內的幀數得出，不使用被 clamp 的模擬 delta）、backend、狀態、邏輯與 backing canvas 尺寸、renderer 上一幀的 3D 計數、collider 與 tween 數量、音訊狀態與作用中的 pointer。`extra()` 可附加自訂行；`visible` 切換顯示；`destroy()` 移除，Game 被 destroy 時會自行移除。它以計時器更新（預設 250 ms，最小 16），不由引擎繪製。`formatDebugSample` 是純函式格式化器。為此新增 `PhysicsWorld2D.colliderCount`。
- `pnpm smoke:examples`（`scripts/smoke-examples.mjs`，devDependency `playwright-core` 1.63.0，不會下載瀏覽器）啟動 Vite，依 gallery metadata 對每個範例的每個 renderer 開啟頁面；出現 console error、page error、未處理的 rejection，或縮成 64×64 回讀後只有單一顏色的 canvas 即判定失敗。選項：`--browser chromium|firefox|webkit`、`--example <slug>`、`--renderer <name>`、`--port`。Chromium 取自 Playwright 快取或 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`。瀏覽器自行請求的 `/favicon.ico` 會被忽略；強制 canvas2d 的 3D 範例所顯示的 `Canvas2D has no 3D` 屬允許訊息。這只是「能載入且繪出、沒有錯誤」的 smoke 檢查，不是畫面或效能比較。
- `.github/workflows/release.yml` 在 `v*` tag 觸發：frozen install、typecheck、lint、test、build、`pnpm pack`、`SHA256SUMS`，並以 `gh release create --verify-tag --generate-notes` 發佈（權限 `contents: write`，與 CI 相同以 commit 釘選 actions）。已解析並在本機執行 pack／checksum 步驟，但 GitHub 尚未實際執行。
- `package.json` 宣告 `"sideEffects": false`，`pnpm check:tree-shaking`（`scripts/check-tree-shaking.mjs`）用 Vite 打包 `src/index.ts` 的 `import { Vector2 }` 與 `import * as XYZ`，並要求前者低於 4,096 位元組（目前 712 位元組，整體 API 為 748,561 位元組；加上此旗標前為 41,535 位元組）。此旗標只在沒有模組於 import 時產生副作用時才正確；一旦引入，腳本會失敗。OPM 為動態載入，不在此量測內。
- `benchmarks/physics2d`、`benchmarks/particles2d`、`benchmarks/3d` 與既有 `benchmarks/sprites` 共用 `benchmarks/measurement.ts`：120 暖機＋600 量測幀，每幀固定 1/60 秒模擬，1280×720，DPR 1。結果分別保留受顯示器節奏限制的 RAF 間隔（`fps`、p50/p95/max）、CPU submit 時間（`beginFrame`／`render`／`endFrame`，不等於 GPU 完成）與模擬／更新時間，並附上最後一幀的 `renderStats`（僅 3D）。分頁必須保持可見，隱藏即中止。
- `pnpm docs:api` 以 `typedoc.json` 對 `src/index.ts` 執行 TypeDoc 0.28.20（peer 範圍包含 TypeScript 6.0.x），把 API 參考寫到 `docs/api/`（被 git、prettier、eslint 忽略；約 11 MB；撰寫當下沒有警告）。未發佈到任何地方。
- 未提供：smoke 或 API 文件的 CI job、GPU 計時、記憶體／GC 量測。
- P35 缺 smoke CI／debug-benchmark 只記 3D 是歷史範圍。P40 擴充 metrics／DebugOverlay 與 deep browser regression／CI；Chromium 153 實跑證據見 ACCEPTANCE，workflow file 不等於 hosted CI 已執行成功。

## 34. 3D 輔助物件：LOD、Billboard、Line3D、Text3D（P36）

- `CameraDependent3D`（`updateForCamera(camera)`）標示需要最終 3D 相機姿態的物件。Scene 每幀對每個已註冊且世界可見的此類物件呼叫一次，時機在 `physics`、粒子與 2D 相機行為之後、渲染之前（`isCameraDependent` 是型別守衛，使用者自訂類別也可加入）。
- `LOD` 是 `Group`，其子物件即各層級：`addLevel(object, distance)`（層級自動依距離排序；子物件在被選中前為隱藏）。每幀選出 `distance` 不超過「LOD 世界位置到相機距離」的最大層級，只有它可見；`level` 回報其索引。`hysteresis`（世界單位，預設 0）讓相機必須越過正在跨越的邊界這麼遠才切換，避免閃爍。距離是到 LOD 原點，不是包圍體。
- `Billboard` 是共用單位四邊形的 `Mesh`，`width`／`height` 為其縮放，`mode` 為 `'spherical'`（完全面向相機）或 `'cylindrical'`（只繞 Y 軸）。它每幀依世界位置覆寫自己的旋轉，所以不補償父層旋轉與非等比縮放；請放在 Scene 根或只有平移的群組下。正交相機會對著視線方向。
- `Line3D(points, {material, width, closed})` 以面向相機的帶狀四邊形繪製折線：每段一個四邊形（4 個頂點），每幀在物件本地座標重建，提供 `setPoint`／`point`／`pointCount`；`width` 為本地單位的帶寬，可修改。點數在建構時固定。各段是獨立四邊形，銳角處會有小縫或重疊，沒有逐頂點寬度或顏色，也沒有圓角接合。UV 在帶寬方向為 0–1，沿整條線為 0–1。
- `Text3D.create(text, {fontSize, fontFamily, color, height, padding, mode, position…})` 光柵化成自有 Texture 並顯示於 Billboard；寬度依文字比例、height 為世界單位，文字建立後固定，destroy 釋放紋理。與 Sprite3D 一樣自動進透明 pass，適用物件排序或 weighted 近似。
- P79 新增 screen-size LOD、coverage cross-fade 與 HLOD（第59節），取代原 LOD 排除。仍無 depth-aware thick-line caps／多行文字排版；shaping 受 browser fillText 限制。Canvas2D 不畫這些 3D helpers。

### Sprite3D（P36c）

`new Sprite3D({texture, source?, width?, height?, mode?, color?, opacity?, position…})`
建立不受光照、面向相機的 atlas 圖像。它借用靜態 `Texture` 並擁有自己的四邊形；
銷毀 sprite 不會銷毀紋理。`source` 是整數、位於紋理範圍內的實體像素矩形，
可使用 `SpriteSheet.getFrame()`。寬度預設一個世界單位，省略高度時依初始區域的長寬比決定。
`setSource(rect)` 只改 UV，不裁切 bitmap，也不改世界尺寸；`setSource()` 還原整張紋理。
無效 frame 不會改變原有 frame。線性過濾的 atlas 邊緣需要 padding。
面向模式及根層／只有平移的父群組限制同 Billboard，陰影預設關閉。
不接受 CanvasTexture2D／TextureView2D，也不由 Canvas2D 繪製。

objects3d gallery 的 **Next sprite frame** 按鈕會循環切換四個 atlas 區域。

### Decal（P36d）

`new Decal({target, material, position, rotation?, size, normalOffset?, cullBackfaces?})`
用有方向的 projector box 六個平面裁切接收網格的真實三角形。`position` 為世界中心，
`rotation` 為 XYZ Euler radians 或 Quaternion，`size` 為世界單位的寬／高／深，
本地 +Z 朝接收表面外側。UV 取 projector X／Y，V 向下；背面預設不產生貼花，
可設 `cullBackfaces: false`。沒有表面交集時拋 RangeError，且不掛上子物件，
不以浮空四邊形代替；拒絕不可逆的 receiver transform。

結果會自動掛在 `target` 下，跟隨其階層並隨 receiver 銷毀。幾何與 UV 只在建立時烘焙；
頂點變形或改 projector 必須建立新 decal。建立時支援旋轉／非等比縮放的父群組，
預設 0.001 世界單位的 normal lift 透過 inverse-transpose 法線計算，也會烘焙，
所以之後 receiver 縮放會一併縮放 lift。借用 TextureMaterial（含 PBR 子類）及其紋理，
不投影陰影，可接收陰影。Instanced／skinned／morph receiver 明確拒絕，
不假裝貼花能跟隨變形。Canvas2D 維持 2D-only。

objects3d gallery 的 **Hide decals** 按鈕會切換每一個 LOD 網格上的投影貼花。

### 頂點與 Instance 顏色（P36b）

`GeometryData.colors` 與 `geometry.setColors(colors)` 接受每個頂點的線性 RGB 或 RGBA。
Geometry 複製輸入為 RGBA，RGB 輸入補 alpha 1；`setColors(undefined)` 移除顏色。
RGB 必須有限且非負，alpha 必須在 [0, 1]。直接修改 `geometry.colors` 後要呼叫
`markUpdated()` 更新 GPU 上傳。

`InstancedMesh.setColorAt(index, r, g, b)` 設定個別 instance 的線性 RGB 乘數；
`getColorAt(index, out)` 寫入可重用 tuple。尚未設定的 instance 為白色，首次設定時
才配置儲存空間；矩陣與顏色分別追蹤上傳版本。請透過 `setColorAt` 修改，不直接寫入 `colors`。

兩個 GPU backend 都把頂點 RGB、instance RGB 與材質 tint 乘入底色。頂點 alpha
也影響混合、PBR alpha mask 與陰影遮罩；OPAQUE PBR 材質依 glTF 規則忽略 alpha。
顏色屬性不影響自發光。glTF `COLOR_0` 支援 float 與 normalized unsigned-byte／unsigned-short
的 VEC3／VEC4 accessor（保留 alpha），蒙皮幾何也保留顏色；仍不支援 `COLOR_1`。
Instancing 範例現在同時展示逐 instance 亮度與頂點漸層。Canvas2D 維持 2D-only。

## 35. Point、Spot 與 Cascaded Shadows（P37）

`scene.shadows.enabled` 在兩個 GPU backend 啟用 depth atlas。`mapSize` 是**每格**
解析度，啟用的陰影格排列為方形網格，整張 atlas 仍受裝置 texture／framebuffer 上限限制。
最多八個 point、八個 spot 加四個 directional cascades，共 60 格。每個 point 光源
需要把所有 caster 畫六次，請節制使用投影光源。

Point 與 spot 接受 `castShadow`（預設 false）、`shadowNear`（預設 0.1）、
`shadowFar`（預設 50）；正值 `range` 取代陰影遠平面。近平面必須大於零且小於遠平面，
投影 spot 的 `outerAngle` 必須小於 `Math.PI / 2`。Point 依接收點方向選擇六個透視面
之一；spot 使用外側光錐。陰影只衰減該光源的直接 diffuse／specular，不影響 ambient／environment。

Directional 預設保留固定 `extent`／`target` 投影。把 `scene.shadows.cascades` 設成
2–4，會依目前透視或正交相機的 view-depth 切片擬合投影；`cascadeDistance`（預設 100）
限制最遠覆蓋距離，`cascadeLambda`（預設 0.5，範圍 0–1）混合均勻與對數切分。
每片使用包圍球並把投影平移吸附至 texel 網格；最後一片之外不投影。P94 以
`cascadeBlend`（預設0.1、範圍0–0.5）混合重疊區域；零保留 hard transitions。

每格保留 3×3 depth PCF 與 normalized depth `bias`。P94 加入 receiver-plane
slope correction（`slopeBias` 預設1、有限非負、零關閉），point-light angular taps
跨接縫時會選相鄰 cube face。`Mesh.castShadow`／`receiveShadow`、instancing、
變形與各 map 獨立 alpha sampling 仍適用；沒有相機旋轉時的 temporal
accumulation／stabilization，也沒有 Canvas2D 3D renderer。

`scene.shadows.cache` 預設true；只有 light／camera／caster／resource 的完整
tracked snapshots 相同才重用整張 atlas，不使用可能碰撞的 hashes。Mutable parent
pose、變形、instance／geometry versions、alpha sampling、visibility／membership、
resize／graphics loss 都會 invalidate。資源仍需遵守既有 update APIs；外部無 version
的變更呼叫 `scene.shadows.invalidate()`。Native material 預設
`shadowCache:'dynamic'`；opt-in `'tracked'` 表示其陰影 inputs 遵守上述更新契約。
Optional renderer counters `shadowPasses`／`shadowCacheHits` 是提交 pass 次數，
不是 GPU time 或 FPS。`/examples/shadows3d/` 可切換各模式與兩個 Mesh 旗標。

## 36. Cubemap Environment（P38a）

`EnvironmentMap.fromCubemap(size, faces, channels = 3)` 接受六個同尺寸正方形
線性 RGB／RGBA 陣列，依 **+X、−X、+Y、−Y、+Z、−Z** 排列（`CubemapFaces`）。
列由上往下；各面的 U／V 方向依序為 −Z／−Y、+Z／−Y、+X／+Z、+X／−Z、
+X／−Y、−X／−Y。忽略 alpha，radiance 必須有限且非負。
`fromCubemapImageData(faces)` 接受六個同尺寸正方形 RGBA ImageData-like 物件，
將 8-bit sRGB 解碼為線性 radiance，同樣忽略 alpha。

建構時以雙線性取樣轉為現有的 `4 * size` × `2 * size` equirectangular 格式，
接著沿用 SH 與 roughness mip 過濾。這是**輸入格式轉換，不是原生 GPU cube texture**；
轉換時每個面的邊緣使用 clamp。轉換結果仍受既有 environment 尺寸限制，不保留
輸入陣列，上傳、cache eviction 與 `destroy()` 生命週期不變。背景與 diffuse／specular
IBL 都能使用結果。PBR 範例加入六面 cubemap 開關，以明顯面色展示方向。

### 局部 Reflection Probe（P38d）

`scene.reflectionProbes` 放置借用的 `ReflectionProbe`：

```ts
scene.reflectionProbes.push(
  new ReflectionProbe({
    environment: roomRadiance,
    position: [0, 1, 0],
    min: [-3, 0, -3],
    max: [3, 3, 3],
  }),
);
```

`position` 是 capture 位置，`min`／`max` 是軸對齊的**世界空間**影響範圍。
建構時接受 tuple 或 Vector3，建構後為可變 Vector3。各軸範圍必須為正，
且包含 capture 位置。`enabled`／`boxProjection` 預設 true，`intensity` 預設 1，
獨立於全域 `environmentIntensity`。非法欄位修改會在 rendering validation
報錯，不會上傳無效 uniform。

每個 Mesh 依世界原點選擇包含該原點、啟用且 map 未銷毀的最近 probe；
邊界包含在內，等距時採陣列順序。未落在任何範圍或 map 銷毀時使用全域 environment。
選擇作用於整個網格及其所有 instances，不做空間混合。Probe 提供 diffuse SH、
specular／clearcoat／sheen IBL，不改 sky background。Box projection 把反射射線
與 box 相交，再從 capture 位置取樣；box 外的片元保留未校正方向。

這是**烘焙 radiance probe**，不自動擷取場景，也不是 screen-space reflection。
透過既有 EnvironmentMap constructor 載入 captured cubemap、HDR 或其他來源。
Map 不可變且由外部管理；替換／移除 probe 或銷毀 Scene 不會銷毀它。
上傳共用 environment cache，不多占 material texture unit。WebGPU／WebGL2 支援，
Canvas2D 不繪製 3D。PBR 範例可在右側兩欄啟用局部 box，同時保留全域天空。

### FXAA（P38b）

在 `scene.postProcessing.enabled = true` 時，把 `scene.postProcessing.fxaa` 設成
true 會在 HDR exposure／bloom／tone mapping 與 sRGB 編碼之後，`effects3D` 和 2D
overlay 之前加入 fullscreen FXAA。它過濾 resolve 後影像的高對比邊緣，可搭配 MSAA，
也可用於 `GameOptions.antialias = false`。預設 false；演算法閾值與最多 8-pixel 取樣跨度
位於 `src/data/rendering.ts`，低對比區域保留中心樣本。

啟用時才配置一個輸出尺寸 color target，停用 FXAA／postprocessing、resize 或 destroy
時釋放。它是單幀 spatial AA，不是 temporal AA，可能柔化細緻紋理，不處理稍後的 2D UI，
並且需要既有 HDR postprocessing capability。

### SSAO 與 Depth of Field（P38c）

兩者都需要 `scene.postProcessing.enabled`。Scene depth 可取樣：WebGPU 取最靠近的
MSAA depth sample，WebGL2 則在 single-sample HDR target 使用 depth texture。
View-depth 重建支援透視／正交相機，包含正交 near = 0。

- `ssao` 啟用 deterministic 16-tap screen-space ambient occlusion。`ssaoRadius`
  是正值 world-space 取樣半徑（預設 0.75）；`ssaoStrength` 為 0–2（預設 1），
  `ssaoBias` 為非負 world-space elevation 閾值（預設 0.02）。由鄰近 depth 重建法線，
  在輪廓處選較短的 depth derivative。這個 **post** AO 乘入整個 3D shaded color，
  不是只乘 material 的 ambient term；sky／畫面外樣本不遮蔽。沒有 temporal accumulation、
  denoising 或隱藏幾何的 AO。
- `depthOfField` 啟用線性 HDR 上的 24-tap disk defocus。`dofFocusDistance` 是正值
  相機 **view depth**（預設 10），不是到眼睛的距離；`dofFocusRange`（正值，預設 2）
  決定 depth 差異增加多少才達到最大 `dofBlurRadius`（backing pixels，預設 8，0–64）。
  焦內像素不變，背景模糊會排除清晰前景樣本。這是 screen-space 近似，不是物理 thin lens：
  無法重建被遮住的背景，也無法正確合成所有近／遠 bokeh 層；大半徑可能顯出稀疏取樣痕跡。

Defocus／AO 在 bloom／tone mapping 前，FXAA／`effects3D` 在後，稍後的 2D overlay
不受影響。Kernel 只建立一次，不在每個 fragment 計算三角函數；停用效果時跳過 depth
取樣。PBR 範例提供兩個開關與 focus-depth slider。透明層使用現有 mesh pass 已寫入的
depth，沒有另做透明 depth 解法；GPU 成本隨 kernel 與 MSAA sample 數增加。

## 37. IOR 與 Specular 材質（P39a）

`PBRMaterial` 新增 `ior`（預設 1.5）、`specular`（0–1，預設 1）與
`specularColor`（linear RGB、非負、預設白色，允許大於 1）。
IOR 必須至少為 1 或恰為 0；0 是 glTF 的 angle-independent dielectric Fresnel
相容模式，不是物理折射率。IOR 1 的正入射反射為零，但仍有 grazing reflection。

`specularTexture` 取 **linear alpha**，`specularColorTexture` 取 **sRGB RGB**。
對應的 `specularSampler`／`specularColorSampler` 沿用既有每 slot 取樣契約，
所有貼圖都借用。WebGPU／WebGL2 的直接光與 specular IBL 都套用因素與貼圖；
正入射反射為 `min(specularColor × ((ior-1)/(ior+1))², 1) × specular`。
強度為零會移除 dielectric reflection（包含 grazing），不影響 metallic reflection。
Diffuse 能量以 RGB dielectric reflectance 的最大值扣除，不產生互補色 diffuse tint。

GLTFLoader 接受 required `KHR_materials_ior`／`KHR_materials_specular`，
包含兩個貼圖 slots 與 samplers；不可與 `KHR_materials_unlit` 共存。
各 material map 可獨立選 UV0／UV1及 affine `KHR_texture_transform`，不要求 shared
transform。Environment prefilter／解析 split-sum BRDF 仍是
既有近似，沒有宣稱 reference path tracer 精度。規格見
[IOR](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_ior)
與 [specular](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_specular)。

### Clearcoat（P39b）

`clearcoat`／`clearcoatRoughness` 都是 0–1、預設 0。`clearcoatTexture` 以
linear R 乘強度，`clearcoatRoughnessTexture` 以 linear G 乘粗糙度。
`clearcoatNormalTexture` 是獨立 tangent-space normal；沒有此貼圖時 layer 使用
幾何法線，不沿用 base normal map。`clearcoatNormalScale` 預設 1，允許 signed 值。
三個 slots 各有對應的 `*Sampler`，所有貼圖都借用。

固定 IOR 1.5 的 microfacet layer 在 base 上反射 directional／point／spot／environment
lighting，包含 metallic 表面；view-normal Fresnel 同時衰減底層 lighting **與 emission**。
強度 0 跳過 layer；roughness 的數值下限與 base BRDF 相同為 0.04。
這是無限薄 coating，不做 refraction 或層間 scattering。獨立法線使用該 map 的
transformed UV0／UV1 derivative tangent frame，不匯入 MikkTSpace tangents。

GLTFLoader 接受 required `KHR_materials_clearcoat`、factors、三個 maps、normal scale
與 samplers，各 map 獨立 UV0／UV1 transform；與 unlit 共存會拒絕。
Layering 採用 [clearcoat 規格](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_clearcoat)
中的 non-normative simple Fresnel model；環境光仍採既有解析 split-sum 近似。

### Sheen（P39c）

`sheenColor` 是 0–1 的 linear RGB（預設黑色，停用 sheen），`sheenRoughness`
為 0–1（預設 0，BRDF 數值下限 0.04）。`sheenColorTexture` 以 sRGB decode 後的
RGB 乘顏色，`sheenRoughnessTexture` 以 linear alpha 乘粗糙度。
`sheenColorSampler`／`sheenRoughnessSampler` 沿用借用 slot 契約。
GLTFLoader 接受 required `KHR_materials_sheen`、factors 與兩個 maps，
拒絕 unlit 共存與不相容的 slot transforms。

兩 backend 的直接光 sheen 採 Charlie distribution／visibility；view-only
albedo-scaling 近似衰減底層直接／間接 lighting，但不衰減 emission；
clearcoat 再疊在 sheen 與 emission 上。預先產生的 32×32 directional-albedo table
每格以 128 elevation × 256 azimuth 樣本積分，限制於 0–1、雙線性內插；
每 renderer 只上傳一次 4 KiB uniform buffer，不多佔 texture slot。
可用 `node scripts/generate-sheen-lut.mjs` 重產，再 format `src/data/sheen.ts`。
每幀不做數值積分或 table 上傳。

Sheen IBL 使用 directional albedo 與既有 roughness-filtered environment，
該 filter 並非專用 Charlie convolution。這些近似與有限 lookup 解析度不保證嚴格
energy conservation 或 reference-renderer 精度。方程與 layering 見
[sheen 規格](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_sheen)。

### Transmission 與 Volume（P39d）

`transmission` 為 0–1（預設 0），`transmissionTexture` 取 linear R 相乘；
取代 diffuse response，不移除 specular reflection，也不改 alpha coverage；
fully metallic base 不受影響。`thickness` 是 mesh-local units 的有限非負值
（預設 0），`thicknessTexture` 取 linear G 相乘。`transmissionSampler`／
`thicknessSampler` 沿用借用 slot 契約。`attenuationColor` 是 0–1 linear RGB
（預設白色）；`attenuationDistance` 是 world units 的正值（預設 `Infinity`，
停用吸收）。Beer–Lambert 衰減為 `color ** (worldLength / distance)`。

厚度為零是沒有宏觀折射的 thin wall；正厚度代表 closed volume，即使
`doubleSided` 為 true 仍丟棄 back faces。Snell ray 使用 base IOR；透過 object
與 instance 的 inverse transform，將 local thickness 換算成 world length，
包含非均勻縮放，再將 ray endpoint 投影到 opaque scene。Rough transmission
使用 nine-tap screen-space filter，IOR 1 時 blur 為零，不是 reference GGX
BTDF convolution。

可見 transmission 即使在 `postProcessing.enabled = false` 時，也 lazy 建立
linear HDR capture。先畫 sky 與不透光、不傳光物件，再畫 transmitting 與
alpha-blended 物件；後者取樣前者的 snapshot。兩階段保留 depth；WebGPU 以
store／load 延續 MSAA attachment，WebGL2 沿用既有單取樣 HDR target。
停用 postprocessing 時只做 neutral sRGB resolve，不套用設定中的 exposure、
tone mapping 或 effects。Capture 隨 canvas resize，不再需要時釋放。
WebGL2 需要 `EXT_color_buffer_float`，缺少 HDR 支援時明確拒絕，不假裝以不透明
材質替代。
兩個不同尺寸的光學 maps 共用 packed two-layer array；native texels 只複製一次、
不重取樣，metadata 保留 nearest／linear min／mag 與 clamp／repeat／mirror。
材質加上 scene 仍符合兩 backend 最低 16 sampled textures 限制。

GLTFLoader 支援 required transmission／volume extensions、factors、maps 與
samplers，各 map 獨立 UV0／UV1 transform；volume 必須搭配 transmission，
unlit 共存會拒絕。Alpha mode 保持獨立。規格見
[transmission](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_transmission)
與 [volume](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_volume)。

此 raster 近似只看到 opaque 物件，不遞迴合成 transmitting／alpha-blended 層；
offscreen samples clamp 到 capture 邊界。不做 exit-surface ray tracing、
nested IOR／camera-inside total internal reflection、scattering 或彩色／傳光
陰影；仍沿用既有不透明 shadow silhouettes。

## Weighted 3D 透明

以 `scene.transparency = 'weighted'` 啟用 weighted blended OIT；預設仍為
`'sorted'`。WebGPU 以 MRT 累積加權線性顏色與 revealage；WebGL2 分成
accumulation 與 revealage 兩個 pass。透明片元測試 opaque depth，但不寫 depth；
結果合成到 HDR，再經 tone mapping、effects3D 與原本的 2D overlay。
WebGL2 需要 `EXT_color_buffer_float`，缺少時明確報錯。

這不是精確逐像素排序或 depth peeling。顏色可能不同於 sorted blending；
half-float 累積範圍有限，大量重疊層可能損失精度。WebGPU 保留啟用時的
4× MSAA，WebGL2 使用單取樣離屏 attachments。SSAO／DOF 只看到 opaque
depth，無透明表面深度；transmission 仍只取既有 opaque snapshot，不遞迴取樣
透明層。尺寸相關 OIT targets 在 resize、停用／無 Scene、destroy 時釋放。
Canvas2D 仍僅支援 2D。

opacity 為一的 alpha 貼圖／頂點色使用
`new TextureMaterial({texture, transparent: true})`；Sprite3D／Text3D 自動設定。
PBR 依 alphaMode，不使用此 legacy flag。objects3d 範例提供 weighted 開關與
插入順序反轉；限定驗證見 ACCEPTANCE。

## 39. P40 2D Batching 與 Render Metrics（限定驗收）

GPU／GL 只合併相鄰相容的普通 Sprite commands：source-local UV、affine／reflection、atlas trim／rotation、tint／opacity、anchor／roundPixels 保留為逐 instance attributes。不按 texture 重排，不改 ordinary global stable z／equal-z insertion order／world→HUD。Material／tiling sprites、meshes、ParticleLayer／isolation 為普通 sprite runs 的 barriers，source／effective nearest-linear sampling／world-HUD boundaries 改變切 run。ParticleLayer 使用自有 ordered active-slot runs與versioned uploads。Native shader ABI、isolation／masks／filters／blends、P19 immutable whole-frame captures、3D HDR／MSAA／OIT stages 不變；Canvas2D 是 native paint，非 GPU instancing。

| 欄位                    | 意義／reset 邊界                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `drawCalls2D`           | 每幀 submitted native 2D draws／Canvas paint commands，含 effect／composition quads或paint，不是 Scene object 數。 |
| `instances2D`           | 每幀上述 draws 的 submitted instances（含 effect quads）；Canvas paints 不代表 GPU batch parity。                  |
| `renderPasses2D`        | 每幀 2D target passes，含 clear-only passes／local effects／composition。                                          |
| `uploadBytes`           | 每幀真傳到 buffers／textures 的 bytes；numeric capacity-only allocation 不算 upload data。                         |
| `renderTargetBytes`     | 目前 resident attachments bytes 估計，跨 frame begin 保留、owned target 釋放下降。                                 |
| `peakRenderTargetBytes` | renderer 建立至今最高 resident attachments 估計，frame begin／target release 不清除。                              |

`FrameStats.begin()` 清每幀 counters，但保留 resident／peak。CPU estimate依attachment format／sample count：RGBA8 4 bytes/pixel、RGBA16F 8、R8 1、depth24plus／depth32float估4。含owned 2D targets／captures／effects與tracked 3D depth／MSAA color／shadow／HDR／refraction／FXAA／weighted-OIT attachments；Canvas記RGBA offscreen caches／scratch／captures／targets。排除default framebuffer、driver allocation／alignment、source texture residency／buffers／CPU decoder allocations，不是resource總memory。這些是counters／estimates，**不是GPU timers**、GPU completion／memory／GC telemetry或效能改善證明。無Scene frame清per-frame work、resident targets／captures保留至釋放；destroy清owned targets、替換renderer有自己的lifetime peak。

P41 budget／warmup 估算與上述 counters 分開，見第 41 節；P42 textures／skinning／physics／animation／navigation 已限定驗收，證據見 [ACCEPTANCE](../ACCEPTANCE.md)，bounded contracts 見 [PLAN](../PLAN.md)／[DESIGN](../DESIGN.md)。不聲稱 cross-browser 認證。

## 41. P41 Authoring/Device Contracts

限定 Chromium 三 backend 驗收見 [ACCEPTANCE](../ACCEPTANCE.md)，不改寫上方歷史證據。正式 [authoring-lab](../examples/authoring-lab/) 使用 root API；typed 範例見 [USAGE](USAGE-zh.md#21-p41-authoringdevice-flow)。

- **UI：** `UIRoot(game?, layout)` 持有 `focus: UIFocusManager`，`UIElement` 接受 `UILayout`。只有 UIElement children 參與 screen-space row／column／overlay layout；width／height 為有限 bounded number、`'auto'`／`'fill'`，另支援 min／max、gap、padding（數字或上右下左 tuple）、align／justify，非完整 CSS flexbox。非同步 UILabel／UIButton／UICheckbox／UISlider.create(text, options) 與 setText 重用引擎 visuals／unit raster；checkbox.checked／slider.value 為狀態，slider 要有限遞增 min／max 與正 step。Controls 發 click／change。DOM 只 semantics／focus，不作 visuals；focus.focus／move／pushModal／popModal trap／restore eligible focus。Bound context 只在 live semantic focus／modal 啟用，actual widget pointer source 同幀消耗 lower actions，不是全域攔截所有 pointer。
  Live canvas pointer-down 明示進入 canvas focus 並取消瀏覽器後續 compatibility mouse focus，讓 routed widget 的 touch focus 保留到後續 keyboard traversal。
- **Input：** input.contexts.create(name, { bindings, priority, consume, gamepadIndex }) 初始 inactive；activate／deactivate／destroy／value／isDown／wasPressed／wasReleased／rebind／exportBindings／importBindings 控制它。高 priority 優先，同級以最新 activation 決勝；按 physical source 保留來源給高層，消耗 lower contexts／legacy actions，raw polling 不變。Held activation／unblock 不製造新 press；gamepadIndex 為真 browser index。ActionBinding 增 pointerButton、wheel（x／y／z 加 direction: 1／-1）、gesture、virtual（可選 signed direction）；input.virtual.set／value／reset 提供 signed controls。
- **Residency：** Game.resourceBudgets 分 decodedTextureBytes／nativeTextureBytes／nativeGeometryBytes。assets.acquireTexture(url, { signal? }) 回 lease，移除全部 borrowers 後 release；legacy loadTexture pin 到 unload／destroy。assets.residency 為 decoded CPU 估算，graphics.residency 為 native 估算；configureResidency／prepareGeometry／unloadGeometry／prepareResource／retainFrameResources 管理 preparation／protection。Native LRU 只淘汰 idle、非 active／retained allocations，borrowed CPU resources 保留並可 reprepare。Canvas native GPU residency 為零；caller bitmaps／derivedCanvas／attachments／scratch／driver allocations／pipelines 排除，非 total VRAM／GC／process memory 上限。
  `prepareResource(source, { signal? })` 接受 `ResourcePreparationOptions`；取消會釋放 in-flight native preparation lease，不 destroy borrowed CPU source。Recovery 只 replay 仍註冊資源，不復活 preparation 期間已 unload 的來源。Offscreen capture pins 只涵蓋 submission，不跨非同步 bitmap readback，也不取代最後提交的 main-frame resource set。
  Explicit `prepareGeometry` 會 pin allocation 到 `unloadGeometry`；若需 idle LRU eviction，使用 `prepareResource(geometry)` 並 release 回傳 lease。
- **Warmup：** game.warmup(scene, { maxItems, maxMilliseconds, signal, onProgress }) 回可 release 的 residency protection lease，不接管 borrowed CPU resources。預設每 RAF chunk 八資源／四毫秒；時間只在資源間判斷，單項可超時。Progress completed／total／ratio／chunks 對 dependency snapshot，不追蹤後續 mutations；舊 scene protection prelude 另按 chunks 且不計 candidate progress。setScene(next, { warmup }) 在 atomic publication 前 initialize／prepare，保護舊 scene，combined budget 不足拒 candidate 而不破壞舊 frame，candidate protection 維持 published scene lifetime。Manual lease 要明示 release。
  Current scene 發布／替換或 dispose 會 abort pending warmup；已完成的 `setScene` warmup 不會取消自己的 publication。Candidate admission 前，分幀 prelude 先恢復並保護 visible current scene；同一 scene 曾因 offscreen 工作被淘汰 idle allocations 時亦適用。
- **Content：** defineFactory／FactoryRegistry 需 explicit unknown-input parser／注入 services，建立 fresh detached owned prefab subtree；fallible await 前 context.own，abort／failure 只 destroy 新 owned leaves，不動 borrowed service assets。無 reflection／eval／自動 resource ownership。parseContentScene(registry, unknown)／buildContentScene(registry, definition, services, { signal? }) 在建構前 preflight version-1 finite JSON、unique IDs、known kinds／options、parents、explicit reference aliases／dependencies。上限 4096 nodes／depth 32／65536 values／4096 字元 strings／128 字元 keys／IDs。回 unpublished new Scene、typed content.get(id)／kind-checked require(id, kind)，Game.setScene 才發布；serializer 只註冊 explicit 2D content IDs，不含 unnamed descendants／3D。

## 42. P42 Native Rendering、物理、Navigation 與動畫 Profiles

上述 profiles 使用 root API／既有 Scene clock／lifecycle，P42 已通過限定整合驗收。Native rendering 與完整可玩流程證據記於 [ACCEPTANCE](../ACCEPTANCE.md)，不從 exports 推論通過。

### GPU skinning 與 exact queries

SkinnedMesh 擁有分離 render bind-pose／exact-query geometries，借用 joints。renderGeometry 是 WebGPU／WebGL2 color／shadow passes 的 bind stream；geometry 是 lazy exact CPU mirror。四個非負 normalized influences、最多 256 joints 做 linear-blend skinning。updateRenderDeformation() 計算 `inverse(meshWorld) × jointWorld × inverseBind`，變更時更新 jointPalette／paletteVersion／bounds；joint motion 不逐頂點 CPU skin。CPU morph 先更新 bind stream 再 skin。

Raycaster／exact queries 呼叫 updateDeformation()／updateSkin()，只在 deformation 變更後更新 CPU mirror。Normal 使用 blended matrix 的 determinant-sign-corrected cofactors 後 normalize，涵蓋 mirrored／nonuniform transforms，不是獨立 blend joint normals。Conservative local bounds union transformed per-joint influence boxes 再產生 padded sphere；morph 改變重建 boxes（含負 weights），視錐外 joint motion 仍更新 bounds、可 re-enter。Geometry／palette 分開 version，一般 render 不每幀 upload CPU-skinned vertices。

### Native texture payload、formats 與 samplers

NativeTexture2D({ format, width, height, levels }) 繼承 Texture、kind:native、沒有 decoded image；snapshot 每個 supplied Uint8Array。Material 借用 source、不 destroy。Levels 是從零開始 nonempty contiguous prefix，最多 `floor(log2(max(width,height))) + 1`，dimensions 為 `max(1,floor(base / 2**level))`，不生成缺 mip。nativeTextureLayout 要求 exact row bytes `ceil(width/blockWidth) × blockBytes`、rows `ceil(height/blockHeight)`、total 為乘積。Dimensions 為正 safe integers、最多 8192；單 chain 最多 32 MiB。

Registry：RGBA8 unorm／sRGB（1×1、4 bytes）；BC1／BC4（4×4、8 bytes）、BC2／BC3／BC5／BC6H／BC7（4×4、16 bytes）；ETC2 RGB／RGB-A1、EAC R（4×4、8 bytes），ETC2 RGBA／EAC RG（4×4、16 bytes）。BC4／5、EAC 有 signed variants，BC6H 有 float／ufloat，color formats 有 sRGB。ASTC unorm／sRGB 均 16 bytes，blocks 為 4×4、5×4、5×5、6×5、6×6、8×5、8×6、8×8、10×5、10×6、10×8、10×10、12×10、12×12；registry 不代表每個 device 支援。

讀實際 graphics.capabilities.supportedTextureFormats／maxTextureSize。WebGPU 依 enabled BC／ETC2／ASTC device features 列格式，compressed base dimensions 需整除 block；小 mips 使用 block-rounded upload extents。WebGL2 需 matching S3TC／S3TC-sRGB、RGTC、BPTC、ETC／ASTC extension 與 advertised compressed-format enum。Canvas2D 拒 native source、不解碼或切 backend。Encoded sRGB 以 unorm twin upload，由既有 material shaders 轉換 RGB。

Native sampling 只用 supplied levels、LOD clamp 至 chain；min／mag／nearest-linear mip interpolation 獨立。TextureMaterial 使用 native chain；PBR slots 可指定 mip／LOD。glTF native opt-in：9984／9985 為 nearest mip，9986／9987 為 linear mip，9728／9729 將 max LOD 設零。預設 decoded loading 仍映射成 base filter、只 level zero。

decodeKTX2Native(bytes, transcoder?, signal?) 保留 registry VkFormats 所有 levels，支援無 supercompression／bounded ZLIB inflation。其他 formats／Basis／Zstandard 需真正 KTX2NativeTranscoder 回傳 exact native options、保持 dimensions／level count；不內建 codec，不靜默改 RGBA 解壓。僅 plain 2D、不含 arrays／cubes／3D。GLTFLoadOptions.nativeTextures:true 選此路徑，ktx2NativeTranscoder 提供 callback；asset.dispose 擁有 loader-created textures。預設 decodeKTX2／ktx2Transcoder 仍 base RGBA8。

Native residency 按 supplied payload bytes 計算、與 decoded estimates 分開，admission／idle LRU 見第 41 節。Preparation leases／unload-reprepare／同 backend loss recovery 借用 live CPU payload；destroy source 不 revive。GPU allocations／targets／palettes 屬 renderer、recovery 重建，不恢復舊 target／snapshot handles。Accounting 不涵蓋所有 driver allocations，支援不認證 codec 效能／FPS／其他 browsers。

### 3D dynamics／角色移動

`Scene.physics3D` 持有 PhysicsWorld3D；在 scene.add 前設定 Object3D.collider 與可選 body。SphereCollider3D／BoxCollider3D／CapsuleCollider3D／雙面 PlaneCollider3D 支援 reciprocal category／mask 與 sensor。RigidBody3D 提供 static／dynamic／kinematic、mass／restitution／friction、linear／angular velocity、force／impulse、sleep／wake／rotation lock。有限 primitive pairs 使用幾何 narrowphase、box face／edge manifold 與 iterative linear／angular impulses，非 world-AABB response。Plane body 僅 static；dynamic／kinematic owner 必須 root、collider offset 為零。World transform 必須正值 orthogonal TRS，rounded shape 要 uniform scale；拒絕 shear／reflection／singular。

預設 fixed step 為 1/120 秒，bounded substeps 並回報 droppedTime。Game 在 user／systems／objects 更新後依序推進 2D／3D physics，再更新 particles 與 camera-dependent transforms。`world.enabled = false` 凍結 accumulator／contacts，不累積 paused catch-up；caller-driven character／follower 也要停止更新。這是 gameplay pause，與停止整個 simulation／UI 的 Game.pause 不同。

raycast／overlap／sweepSphere／sweepCapsule 依 transformed primitive geometry 查詢，可 ignore owner、filter category mask、opt-in sensors。穩定 collisionstart／collisionend detail 含對方 owner、world point、朝接收者的 normal。Remove／destroy 失效 registration／contacts；attachment／hierarchy 驗證失敗會保留原狀。

CharacterController3D(object, world, options?) 借用已註冊、upright、unit scale、zero-offset root capsule 與 kinematic body；只有沒有 body 時才自建。move(displacement) 執行 bounded overlap recovery、conservative capsule sweep／slide、slope／ground probe、step 與可選 dynamic-body push；caller 提供 gravity／jump displacement／delta，允許 yaw。Result／contacts 重用至下一次 move，需跨呼叫保留的值應複製。Destroy 只移除 controller 自建 body，不 destroy borrowed object／world。

原 P42 primitive-only exclusions 是歷史：第53–55／58節加入 static mesh／primitive compound／bounded rigid-motion CCD／joints／moving-support-crouch。未開 continuous 的 discrete bodies 仍可 tunneling；arbitrary-scale character／deformation CCD／moving mesh 仍不支援。

### Deterministic pathfinding

NavigationGrid2D({ columns, rows }) 提供 weighted A*、atomic setCell／setCells、revision 與 immutable result。Cost 取 destination cell；diagonal／corner cutting 是明示 query options，isPathCurrent 檢查 revision；上限 65,536 cells。

NavigationGraph3D({ nodes, connections }) 自有 immutable finite waypoint／edge snapshots、明示 IDs 與非負 total edge costs（含零），預設雙向，directed 可單向。按最低 edge cost／distance 比例縮放 heuristic 保持 admissible；空間 zero-cost edge 退為 Dijkstra。上限 8,192 nodes／65,536 connections；findPath 回 immutable found／unreachable。

PathFollower3D(controller, { speed?, arrivalTolerance? }) snapshot found graph route，由 scene gameplay update 明示推進。Waypoints 是 capsule owner root／center，不是腳底。透過 borrowed character.move，遵守每次 update speed budget；碰撞阻止前進時進入 blocked，必須 explicit resume 才重試。Pause／stop／destroy 不 destroy character。Graph 不 bake navmesh、不從 colliders 推 clearance、不自動綁 tilemaps／gravity。

### Mask／additive／blend tree／IK

AnimationMask([{ target, paths?, weight? }]) 是 explicit channel allowlist，不隱含展開 descendants；可設於 action.mask／state.mask。AnimationReferencePose snapshot 明示 TRS／morph 值但借用 targets；action.setAdditive(reference)／state.additiveReference 需要完整 nonsingular reference channels。Translation／morph 用差值、scale 用比例、rotation 將 weighted shortest quaternion delta 接在目前 local base 後。Mixer overlay 在下一次 sample 前恢復先前 base，避免 held pose 累積，同時尊重 external overwrite。

AnimationBlendTree(mixer, options) 支援 1D ordered points、2D points 加 explicit nondegenerate triangles、normalized weights、parameter smoothing／nearest-boundary projection。Distinct positive-duration clips 必須有相同 ordered target／property channels；不同長度 leaf 同步 normalized phase，支援 seek／reverse／repeat／pingpong／once／pause。Tree 接管 leaf playback controls，不接管 target objects。

TwoBoneIKConstraint(mixer, { root, middle, tip, target, pole?, weight?, minBend?, maxBend? }) 在 sample 後解 direct two-segment chain，含 pole side、reach／bend clamp、weighted rotation。Ancestors 要正 uniform scale；singular pose 不變，invalid hierarchy／removed 或 destroyed borrowed object goal 會 disable／unbind。Target／pole 也可為 borrowed vectors；無 full-body／任意 chain solver／implicit retargeting。

Mixer 順序為 controllers → ordered action sampling → constraints；其後 Scene.update 仍可覆寫最後 pose，render／picking 才讀 final transforms。scene.animations.paused 凍結動畫 stages；clear／destroy 釋放 controllers／constraints／overlays，不 destroy borrowed targets。

## 43. Fixed Gameplay、Frame Forces 與呈現插值

`new Scene({ fixedDelta?, maxFixedSteps?, interpolatePhysics? })` 預設每 tick 1/120 秒、最多 catch-up 12 ticks、關閉插值。`Scene.fixedUpdate(deltaSeconds)` 在普通 frame update／ECS 之後、兩個 physics worlds 之前執行，每 frame 零次或多次。`fixedFrame`／`fixedElapsed`／`fixedInterpolationAlpha`／`droppedSimulationTime` 描述 Scene 模擬，不是 wall-clock FPS。每個 world 保持自己的 step size；pause／hidden 不累積時間，中斷的 gameplay 不重播略過的 ticks。

兩種 body 在 frame 提交的 `applyForce`／torque 以 **力 × frame delta** 累積 impulse。沒有 substep 的 frame 保留時間加權 impulse，不把多次高更新率提交的力直接相加；多個 substeps 依模擬時間消費 queue。共享未完成 tick 的 frame samples 採時間平均。Fixed callback 的力則依該 callback 的確切 delta 累積 impulse，不受 world 不同 step size 影響。Catch-up cap 略過時間也略過對應力 impulse；`applyImpulse` 仍立即作用，`clearForces()` 也取消未消費的 frame／fixed impulse。Game 自動更新 Scene physics，不要額外手動更新一次。

`interpolatePhysics:true` 只在 Game 呈現時插值 moving-body 的 previous／current 平移與最短路徑旋轉；authoritative transforms、碰撞 queries 與 gameplay 保持最新 fixed pose。外部改 transform 會略過 stale interpolation pair；最多增加一個 physics step 的呈現延遲，不自動插值 actions／animation／camera，也不平滑 mutable scale。

Input edges 保持 frame-based：在 `update` 排入一次性命令，再於 `fixedUpdate` 消費一次；同 frame 多次讀 `wasPressed` 不代表多次實體按壓。Held movement／force 可以每個 fixed tick 評估。

## 44. Submitted-frame 證據與 release gate（P44）

CI 的 reusable verification job 是 tag release 的必要前置，通過前不能 pack／publish：frozen install、format、typecheck、lint、tests、build、必要 Canvas2D／WebGL examples smoke 與深度 browser regression。失敗保留 `.vite/browser-regression/` 與分 invocation 的 `.vite/example-smoke/`。WebGPU 只有沒有 adapter 時可 skip；明確指定 WebGPU 或已有 adapter 的失敗仍是錯誤。

Fixture 讀真正 submitted frame：presentation 前複製 GPUTexture、aligned MAP_READ／BGRA 轉換，Canvas2D／WebGL 則同步取樣，原像素 assertions 不變。報告保存 GPU destroy call stack、loss／error timeline 與巢狀 recovery cause；診斷改善不等於歷史 Ubuntu GPU 失敗已實跑修復。

共用 Linux Chromium launcher 為 ANGLE／Dawn 選 SwiftShader，並以 `--enable-features=Vulkan`／`--use-vulkan=swiftshader` 啟用 compositor 的 Vulkan backing。Chromium 153 在 SwiftShader 下停用 GL／WebGPU interop，單選 WebGPU adapter 不足以提供 canvas swap-buffer backing。隔離 Ubuntu 24.04 arm64 已先重現缺少 `SharedImageBackingFactory`，修正後 required 三 backend regression 通過；hosted Ubuntu x64 修正仍待驗，renderer recovery／錯誤處理／assertions 不變。

## 45. 共用 3D spatial index（P45）

Solver pairs、overlap／ray／sweep／controller 共用 deterministic registration-order balanced conservative AABB hierarchy。Topology 改變重建；public mutable pose 每 fixed tick／public query 仍需 O(N) pose checks，但 geometry refresh／refit 僅處理變更，unchanged queries 不 refresh／refit。Candidate traversal 不代表整個 query sublinear；infinite planes 仍是必要 candidates。

World.stats 重用 readonly PhysicsStats3D：candidatePairs／narrowphaseTests 是最後 fixed tick，queryCandidates 是最後 query；destroy 清 counters／membership。Reciprocal filters／sensors／stable lifecycle／即時 mutation／remove reconciliation 不變；counts 不是 GPU time／FPS 提升證明。

## 46. 有預算的導航搜尋（P46）

`grid.createSearch(start, goal, options?)`／`graph.createSearch(startID, goalID, options?)` 回傳 `NavigationSearchJob<Path>`；`step(maxExpansions)` 每次至多處理指定 integer budget（0–65,536），expansion 計 popped nodes，含 goal；零不推進。Status 是 pending／found／unreachable／cancelled／invalidated，只有 found／unreachable 有 result。Cancel 是 terminal／idempotent，edits invalidates pending jobs；同步 findPath drains 同一 deterministic indexed A*。

每 owner 至多八個獨立 concurrent jobs，以有界 workspace pool 重用；terminal 狀態釋放 owner／workspace，destroy 取消 jobs 並清 pool。第九個 job 報錯，不無限制配置 scratch。

## 47. 動態導航與重新規劃（P47）

Graph connection 預設 enabled／clearance Infinity。`setConnection(index, {enabled?, clearance?})`／atomic `setConnections([{index,...}])` 修改 undirected connection 的兩向，只有有效 edits 增加 revision。`getConnectionIndex(from,to)` 找 authored connection，path 具有必要 revision，isPathCurrent 同時查 owner identity／revision。AgentRadius 是半徑，graph 用 world units、grid 用 cell units；clearance 是 authored data，不自動 bake geometry。

`new NavigationFollower3D(controller, {speed?, arrivalTolerance?, expansionBudget?, maxReplans?, scheduler?})` 借用 controller／graph。Scene-attached controller 預設共用 scene.navigation：admission／expansions 消耗單一 Scene aggregate quota，不是每 NPC 各有 quota；movement 仍由 caller update。Stale graph 先停止舊路徑，由最後已到 authored anchor replan。Physical blockage 僅在本 route 排除該 connection，返回 anchor 再走 detour；revision 清 exclusions，retry 有界。

狀態區分 searching／following／paused／finished／blocked／unreachable／stopped／destroyed。Pause 凍結搜尋與移動，stop／setPath／destroy 清 pending job，borrowed owners 被 destroy 時安全停止。PathFollower3D 保留簡單 explicit waypoint 契約；不宣稱 nearest-node projection／自動 navmesh。

## 48. 混合負載與資源 soak（P48）

`pnpm soak:mixed --duration 60 --renderer all --output /tmp/mixed.json` 執行真正 Game RAF／start／pause／resume／setScene／destroy、body 負載、動態 grid routes、retained widgets、decoded／native residency、warmup、capture／lease cleanup。互動頁是 `/benchmarks/mixed/`；Canvas2D variant 明示省略不支援的 3D。`--consumer /absolute/extracted/package` 選打包 root；`--duration 3600` 才要求一小時，不能用預設 60 秒宣稱長時間 plateau。

Bounded histogram 4,096 個 0.25ms bins；p50／p95 為 bucket 上界，>1,024ms overflow 回 null。保持分頁可見；overall RAF 含 boundary hitches，phase RAF 排除跨 phase interval。Scene／ECS、physics、CPU submit 與 asset／capture／cleanup wall time 分開。Opt-in native GPU timestamps、實測 heap／GC／process RSS／VSZ 各自記錄，不等於 presentation FPS／whole-driver memory／VRAM。Trend 有界，每 boundary assert owned cleanup；要求 duration 不等於實測一小時／低階硬體，證據見 ACCEPTANCE。

## 49. 明確 3D 與 content round-trip（P49）

Serializer.register 接受 SceneObject。`sceneObjectState(member, custom?)` 選 built-in 2D／3D adapter，其他 SceneObjects 需 explicit Serializable。Object3DState 保存 local pose／visibility、既有 body coefficients／線角速度／forces／sleep，immutable body policies 必須相符。Geometry／collider／assets 由 factory 重建，不反射、不存 GPU handles。

Factory 可定義 children(root) aliases 與 state(root,member) adapters；content definitions 將 children aliases 對應 globally unique stable IDs，保留 removed-child tombstones。Capture 回 version1 ContentSnapshot，含 authored JSON kind／options／IDs／references／children、SceneSnapshot 與 exact parents[id]=parentID|null。每個 live object 都需 authored ID，unnamed/manual additions 拒絕 capture。Spawn／remove／getById／destroy 管 owned registrations；surviving references 阻止 remove，foreign descendants detach 而非 destroy。

`await rebuildContentScene(registry, unknownJSON, services, options?)` 預驗 topology，沿同 factories 建新 unpublished candidate，還原 exact parenting／state／ownership，再由 Game.setScene 發布。失敗只清 candidate-owned 資源。上限4,096 stable IDs、JSON depth32／65,536 values／4,096-character strings／128-character IDs／keys；parent／reference dependencies 維持無環。

## 50. 版本固定的 asset recipe 與打包部署（P50）

[Asset Recipe](ASSET-RECIPE.md) 說明 local glTF／GLB packing、topology／UV／material／codec preflight、v2 explicit semantic mips、native compressed／universal Basis／RGBA8 KTX2、PNG fallback、typed Draco／expanded glTF／manifest／SHA256SUMS。CLI 固定 Node26.7.0／playwright-core1.63.0／Chromium153.0.8010.12 revision1243，無 hidden download／manifest shell commands／runtime dependencies。

Assets:build 沿真 packaged GLTFLoader 驗 generated variants。Check:asset-deployment 在 plain HTTP import extracted pnpm pack root，畫 native／fallback／runtime-selected variants，trusted click 初始化 official AudioWorklets，確認 vendor 完整與實際 fetch。未發佈 v2 支援 pinned external Basis／Draco 與 explicit semantic filtering；reproducibility／hardware limits 另記 ACCEPTANCE。

## 51. 原生 editing、canvas 文字輸入（P51）

`await UITextInput.create({value?,maxLength?,label?,disabled?,layout?,textStyle?})` 使用真正透明 native input 提供 single-line editing／clipboard／undo／IME；text／background／selection／caret 仍由 canvas 畫。Readonly value／selectionStart／selectionEnd／selectionDirection／isComposing、async setValue 與 setSelectionRange 採 UTF-16 offsets。Programmatic values 去 CR／LF 並套 maxLength；既有 Text2D raster／input budgets 不變。

Compositionstart／update／end 帶 data／originalEvent，input 帶 value／isComposing／originalEvent，change／focus／blur relay 原生狀態。Focus 清 held state 並排除 gameplay keyboard actions，不攔截正常 editing keys。Native semantic geometry／clipping 沿 logical canvas placement／lifecycle；無 password profile，synthetic composition 只能證明 relay／visual state，不能冒稱實體 OS IME。

## 52. 捲動、focus reveal 與虛擬列表（P52）

`new UIScrollView({layout?,contentLayout?,horizontal=false,vertical=true})` 經 view.content.add(child) 加 owned content。ScrollTo clamp offsets，reveal 轉換 descendant 四角；renderer mask／pointer／native semantic coverage 同 viewport。Wheel line／page deltas normalize，nested viewport clamped 時向外 yield。Mouse 可拖空白 viewport，controls 保留 editing；touch／pen 可跨 controls pan。Focus 先 reveal 內再外 scroll，最後 native focus。

`new UIVirtualList<T>({items,rowHeight,key,createRow,bindRow,unbindRow?,overscan=1,layout?})` snapshot items、preflight unique string／finite-number keys。Factory 同步回 fresh detached owned UIElement；bind 必須 reset reused row state。Mounted 限 viewport＋overscan＋最多一個 focused row，detached pool 有界重用、surplus destroy。Active keyed identity 保留 reorder。Row／keyOf／setItems／materializedCount／pooledCount／focusKey(key,direction=1) 提供真正 bounded virtualization，不是把所有 rows 都 mount。

## 53. 靜態三角網格 collider（P53）

`new TriangleMeshCollider3D(positions, indices, options?: TriangleMeshOptions3D)` 擁有 bounded immutable xyz／index snapshots 與 baked triangle BVH。更新需換新 descriptor 原子 rebake，borrowed render geometry 修改不改 collision。含 mesh children 的 compound 也 static-only；支援 positive orthogonal transform／nonuniform positive scale，shear／reflection／degenerate／overflow 拒絕且保留原 attachment。

Sidedness double（default）是雙面零厚度 surface，不是 closed-solid containment；front 採 counterclockwise normal，排除 back-side approaches／contacts。Primitive-triangle distance／SAT、真 edge／face contacts、ray／translation sweep、rigid solver／capsule controller 共用 transformed triangles／BVH。

## 54. Compound collider 與 inertia（P54）

`new CompoundCollider3D(children, options?)` 擁有1–64 flat immutable children：sphere／box／capsule／static mesh，無 nested／infinite plane。CompoundChild3D 包含 collider、explicit position／unit Quaternion rotation／positive scale，預設 origin／identity／unit；child offset 在該 transform 內套用。Root filters／sensor 適用所有 children。Sphere／capsule 及最終 world transform 需 uniform scale，拒 shear／reflection；mesh child 令 compound static-only。

Dynamic primitive compound 的 uniform-density COM 必須在 root origin。Scaled volume 分配 mass，rotated analytic inertia＋完整 parallel-axis tensor 保留 off-diagonal terms；重疊 child solids 的 mass 分別計算，collision 是保留 gaps 的 union。至多八個 deepest deterministic contacts、各自 normal 沿標準 impulse solver。

## 55. 有界 3D continuous rigid motion（P55，未發佈擴充）

`new RigidBody3D({continuous:true})` 開啟 dynamic nonsensor 的 bounded conservative-advancement CCD。Relative translation／angular motion 涵蓋 dynamic pairs／moving kinematic targets，使用真 sphere／OBB／capsule／primitive compound 與 static mesh／compound surface；reciprocal filters、普通 contact impulses／events 不變。

Iteration／impact budget exhaustion 只保留 proven-free prefix、丟棄未證明時間，不捏造 hit／event／impulse。觀察 ccdTests／ccdIterations／ccdImpacts／ccdExhaustions／ccdLimitedTime。無 sensor TOI／moving mesh-plane／deformation CCD。World.sweep 仍為固定 orientation translation query，distance 是 world units、可重用 out；query exhaustion 回 no hit。Immutable snapshot policy 包含 continuous。

## 56. Animation root motion（P56）

`new AnimationRootMotion(root, {target | sink})`；`mixer.clipAction(clip).setRootMotion(binding).play()`，locomotion layers 共用同 binding。Mixer 抽 translation／rotation，不再同時移 skeleton root；repeat rigid accumulation 含 turning／reverse／pingpong／once，尊重 masks／fades／ordered blending／additive。Seek／stop reset 不 teleport；callbacks／constraints 後才 flush，seek／stop／clear／destroy／error 取消 pending output。

Root finite／rigid／unit scale，animated root scale／duplicate TR channels 原子拒絕；target／sink 互斥，direct target 不可是 skeleton root。Reused readonly delta translation 是 body-local，rotation 是 post-composed local increment；保留需 copy，character／physics sink 需轉 world coordinates。Direct target 依 local orientation 旋轉 translation，再移 parent-space position。Fixed gameplay 用獨立 owned AnimationMixer 由 fixedUpdate 推，不 double-advance 自動更新的 Scene mixer。Clear 只放 binding registrations，不 destroy borrowed targets；KeyframeTrack.sampleValues(time,Float64Array) 不改 target。

## 57. 明確 bind-pose retargeting（P57）

`new AnimationRetargeter(mappings, {sourceRoot,targetRoot,rootTranslationScale?}).retarget(sourceClip,name?)` 回獨立 AnimationClip，沿既有 mixer／skin／root-motion。Mapping 包含 source／target／explicit bind translation／rotation／scale，optional translationScale；每 animated node 與 non-root direct parent 需一對一 mapping。Bind space 排除 skeleton 外 scene placement，不猜名稱。

World／local rest-rotation 與 parent-frame translation correction 保留 STEP／LINEAR／CUBICSPLINE，analytic 轉換 cubic tangents，不改 source tracks／arrays／live poses。Root factor default1，non-root 用 target/source local bind-offset length；source零／target非零需 explicit factor。Factor finite nonnegative，零鎖 translation。Bind／animated scale 必須 positive uniform，cubic extrema 在 Float32 轉換前後都驗；morph／shear／reflection／duplicate channels／incomplete mapping／hierarchy change／destroyed nodes 在回 clip 前拒絕。

## 58. Production 契約（v1.10）

以下 P58–P70 能力納入 **v1.10／1.10.0**，不是修改既有 release assets。歷史日期／counts／exclusions 保留；[ACCEPTANCE](../ACCEPTANCE.md) 分開實測、unsupported 與未驗項。

### 資源 ownership 與 fresh publication

`ResourcePool(loader).createScope({signal?})` 產 candidate／Scene-local ResourceScope；fork／acquire(request)／acquireTexture／own／borrow／attach／cancelPending／release 沿既有 loader/cache。同一 ResourceRequest **物件 identity** 跨 scopes 共用 acquisition，不只比較 URL/options。Owned request 必須 dispose，borrowed 不 destroy；load context.own(value) 必須在 fallible await 前登記，才能清 partial／late non-cooperative results。單 subscriber abort 不中止其他存活 subscriber。

Lease／scope.attach(detach) 登記 synchronous consumer teardown，先 detach 才 last-resource dispose。Detach 失敗保留資源與 failing callback 供 retry，以 AggregateError 回報，不能釋放 live borrower。CancelPending 僅取消 acquisition；owner 先移除 consumers 再 release。Texture acquisition 持既有 decoded-cache lease；pool destruction 不 destroy unrelated caller services。

`AssetManifest.acquire(pool,selections,{signal?,scope?})` 回 scoped ManifestLease，aliases／groups 共用 acquisition 而不重複 ownership。Content build／rebuild options 接受 resourcePool／resources，新建或 fork candidate scope，經 factory context 傳入，僅由 owned Scene／subtree adopt；failure／cancel rollback。RebuildContentScene 先建 fresh unpublished candidate，再 Game.setScene prepare／原子 publish；**不**把 legacy in-place Serializer.restore 宣稱為 atomic transaction。失敗保留 old active Scene，borrowed services 仍 caller-owned。

### 預算、timing 與 startup

Scene subsystems lazy initialize；讀 diagnostics 不初始化 navigation。Scene.navigation 以 round-robin／owner-fair admission 管 searches／bakes，所有 NPC 共用單一 hard cooperative work-unit cap；pending jobs 不各配置 A* workspace，既有 owner workspace limit 仍在。Pause／lifecycle 按契約 freeze／retire。CPU milliseconds threshold 僅 cooperative／observational，不是 preemptive deadline，單 unit／decoder 可超時。Per-asset／decoded-cache／native-residency／attachment estimates 分開，非 process／driver memory 全域保證。

GPU timing opt-in（GpuTimingOptions），maxInFlight default4／max32、warmup default120frames、sampleInterval 控頻。GpuTimingStats 是 reused latest async result，不一定本幀；unavailable／invalid values nullable，null 非零。WebGPU 是真正 render／compute pass duration 精確總和 native-pass-sum，不含 pass 間空檔／queue wait／presentation；WebGL disjoint query 是 native-command-interval；Canvas unsupported。Collection counters 解釋缺樣；RSS／VSZ 非 VRAM，heap／GC／CPU submit／RAF cadence／GPU duration 分開。Startup bundle reachability 變小，不是 microengine／FPS 保證。Workload／platform 邊界見第59節。

### 資產與 typed Draco

V2 `xyz-gltf2-semantic-platform-v2` descriptor 與 authoring AssetManifest 不同。ParseAssetBundle／selectAssetBundleVariant／loadAssetBundle(uri,{renderer,loader,options?,manifestSHA256?}) 按 ordered variants 選第一個符合 3D／dimensions／native formats／Draco availability 者，WebGPU compressed block restrictions 亦納入。必須有 raster／uncompressed fallback；Canvas 拒 3D。Fallback 只因 **decode 前 availability** 選擇；hash／fetch／parse／decode 失敗是 fatal，不靜默降級重試。

Selected model/resources 先 size／SHA-256 驗證，改用 protected temporary Blob URLs，沿現 loader parse 後 revoke。Caller 先移 consumers 再 asset.dispose；parse 後 abort 會 dispose owned result。Optional trusted manifest pin 提供 integrity，自報 hashes 非 signature。Draco request accessors 含 componentType／normalized；adapter 要區分 raw integer 與 logical normalized streams（joints／weights／colors／UV）。已測 adapter 可保留高於 Float32 exact range 的 UINT32，但官方 encoder upper-UInt32 rejection 與既有 custom UINT32→Float32 consumer limit，不能宣稱完整 32-bit end-to-end precision。

### Physics 與 navigation

CharacterController3D 以 support-local foot anchor／swept carry-slide／yaw 跟 moving support；epoch 內僅 consume 一次 support motion。Jump／removed／teleport／lost／blocked detach 有明確原因，carryBlocked／unresolvedPenetration 揭露 ceiling／crush 無安全位置，不假裝成功。Caller 仍供 gravity／jump。Crouch 改 capsule straight-segment height、保留 radius／feet，blocked stand 保持 crouch；move／stance result vectors 重用。

DistanceJoint3D（rigid 或 frequency／damping spring）、BallSocketJoint3D（cone／twist）、HingeJoint3D（angular stops／torque-limited motor）共用 world sequential 線角 impulse／inverse inertia；world owns registration lifecycle，body removal／destroy 退休 constraints。這是 bounded iterative constraints，非精確工業 articulation solver。

Spatial counters 將 cumulative poseChecks 與 changed refreshedLeaves／refits／indexGeneration 分開。NavigationGridBakeJob2D 合 lattice occupancy／authored blocked cells／physics；NavigationSurfaceBakeJob3D 在 explicit Y bounds 取 topmost walkable surface、檢 slope／step／capsule clearance／swept connections。Mapping snapshot origin／rotation／cellSize；revision invalidate pending work，completed output 原子 publish。這是 sampled **single-layer** lattice，不是 polygon／multilayer navmesh 或 arbitrary nearest-node projection。

### Native text 與 audio

Text layout 支援 ltr／rtl／auto、browser bidi shaping／fallback fonts 與 grapheme-aware caret／selection／hit geometry；native editing offsets 仍 UTF-16，不把 code-unit length 當 grapheme count。DOM/browser 負責 shaping/layout，native editing transparent、visual canvas。Text3D native fillText profile 不變，無 physical OS IME／font availability 認證。

Audio.master／music／sfx／ui.setEffects snapshot validated biquad／compressor／reverb chains，部署到真 native contexts。PrepareImpulse(AudioBuffer) owns immutable PCM copies；dispose 阻止新使用，不 destroy caller buffer 或已 retained graph。SetDucking 用 playback activity／release tails；overlap 不提早 release，paused source 不 duck。Automate／cancelAutomation 使用 absolute manager AudioContext seconds／cancel-and-hold，非 Game elapsed；Game pause 獨立，explicit native-context pause 才凍 clock。

取消 automation 使用已追蹤的 per-context target-exponential 與有限 crossfade 精確 envelope，不依賴可選的原生 `cancelAndHoldAtTime`，也不以 `AudioParam.value` 近似。Listener transform 有原生 AudioParams 時用之，否則走原生 position／orientation setters；這仍是同一條正式 audio graph，不是 Firefox 專用實作。

BindListener(object)／bindEmitter(object,spatialPlayback) 借 world objects，simulation／world transforms 後跟隨。AudioTransformBinding.unbind(stop=true) 預設 stop emitter，絕不 destroy object；ended／stopped playback／owner destroy retire bindings。Sample／stream／official OPM effects／spatial analyser 證據非 physical speaker certification。Desktop／emulation smoke 不推論一小時、simulated low-tier、mobile devices、Safari 或 OS IME 已驗。

## 59. Production 擴充契約（P71–P87）

以下為 **1.11.0** 目前 source 契約，不是新 native 驗收；歷史 counts／日期保留，最終實測僅由 [ACCEPTANCE](../ACCEPTANCE.md) 記錄。舊排除只由下列具名 profile 取代。

### Audio 與發行消費端（P71–P73）

Autoplay stream 先連接 native source／bus，並在第一個 await 前呼叫 media play；Web Audio unlock 不是全域 media autoplay 授權。也可 autoplay:false 預載後在可信手勢直接 play。Pending acquisition 同步預留 ownership／budget，取消涵蓋首次 play。Play 依 generation single-flight；pause／stop 使舊意圖失效，晚到 completion 不得 pause／activate successor。Native rejection 保留 AudioError.cause；manager resume error 送 error hook 與 stream error event。OPMAdapter.setPaused() 回 Promise<void>，manager pause／resume 仍是同步 owner-policy 操作。

每個 native context 保留自己已渲染的 gain envelope；control 一次取樣 local clocks、映射剩餘 manager-time delay，支援時 native cancel-and-hold，否則使用精確 modeled envelope。Clock drift／control arrival 不是 hard-real-time 保證；官方 OPM contexts／DSP 不改。

獨立 2D／3D starters 僅從完整 local tarball／built package 安裝後 import xyz.js root，不需 npm publish。Generator 拒絕 nonempty／symlink destination。完整 engine dist 必須保留為 engine/，包含相對 modules／workers／worklets／vendor；部署整個 starter output，3D 拒 Canvas2D。Package／tool 最低版本以 package.json 為準，不由新階段推論升版。

### Durable checkpoint（P74）

SaveRecord.revision 受 checksum 保護；legacy 為0。成功 load／save／remove 的觀測自動 guard 後續 write，expectedRevision 提供明示 CAS。Blind first write 不保證未觀測 application snapshot 的新鮮度。同 storage 操作按 invocation order 排序；coordination 為 process／web-locks／indexeddb。無 atomic mutate 的 custom backend 僅 process-local；LocalStorage SaveManager 要求 native Web Locks，IndexedDB 在 transaction complete 才 acknowledge。Stale／unsupported 拒絕。

成功 save 保留有效 last-known-good envelope；load(slot,{recovery:true}) 唯讀 backup，不改損壞 primary。restore() 明示安裝新 revision 並 archive 被替換 raw；damagedPayload()／damagedPayloads() 在 manager remove／clear 後仍保留 forensic 原文。Backup revision 不是目前 CAS token。Memory／IndexedDB mutation atomic；localStorage 多 key 即使排序，也**不是 crash-atomic／fsync durability**。

AutosaveController 提供 dirty／saving／saved／error／cancelled／destroyed lifecycle、request／flush／明示 retry／cancel／destroy。Failure 維持可見，timer／edit 不 silent retry；stale 先 load／resolve。Abort 阻止 queued／precommit，不回滾已發出的 custom write。Owner teardown 清 timer／listener；application 顯示 state／recovery／conflict controls。

### Motion 與有限 navigation（P76–P78）

2D CCD 是 bounded relative rigid 平移／旋轉 conservative advancement；exhaustion 只保留 proven-free motion，ccdStats 報省略 suffix，保留 velocity、不偽造 impact。Sensor discrete，無 dynamic concave／compound／deforming sweep。CharacterController2D 借用已註冊 upright root convex owner／kinematic body，缺 body 才自建。在 Scene.fixedUpdate 呼叫 move(displacement,{epoch:scene.fixedFrame})，caller 提供 +Y-down gravity／jump。Slope／stair／slide／recovery 與旋轉／平移 local-anchor carry 有界；每 epoch 只消費一次 carry。Jump／teleport／scale change／blocked carry／support remove-re-register 會 detach。Destroy 只移除自建 body；保留 reused result vectors 必須 copy。

Scene.createLocomotion3D(controller,options) 擁有 CharacterLocomotion3D，在 caller fixedUpdate 後、physics 前一次推進。不得另 manual advance 或把獨立 mixer 加入一般 Scene animations。它借用 upright unit-scale capsule controller／visual root，自有 mixer／state／root binding，body-local root stride 經 swept move。Gravity／jump／air control 是 velocity-driven，不消費 root vertical／pitch／roll。Explicit phase names／authored motion speed 決定 state／rate；measured locomotion velocity 不含 carry。Pause／seek／stop／callback cancellation 丟棄 stale root work，destroy 保留 borrowed objects。

NavigationSurfaceBakeJob3D 每 XZ cell 保留 descending support slots（default4／max8，總 slots≤8192），有限 interior samples＋swept capsule clearance。Overflow 拒絕、不發布半成品；同 XZ floors 無 implicit edge，合法 stairs／authored special link 才換層。NavigationGraph3D.project() 強制水平／垂直距離上限，回 nearest certified sampled node，不是 polygon snapping；超過 baked agent radius 拒絕。traverseLink 必須真移動並回 pending／complete／blocked；無 handler 則 block／replan，complete 要求抵達 destination。Scene bake／search 共用 cooperative quota；revision／cancel 使 stale route 失效。有限 sampling 不是 continuum support certification／polygon navmesh。

### Visibility、native descriptor 與 lights（P79／P80／P84）

RenderVisibilityCache 分開 color visibility／shadow casters；offscreen／occluded active-LOD casters 及完整 shadow instance streams 不受 packed color instances 取代。Mutable pose 仍 O(meshes × ancestor refresh＋active skin joints)，一般 BVH refit O(meshes)，membership rebuild O(meshes log meshes)，instance tests O(instances)，HLOD aggregate O(detail descendants)。Reuse 不代表零 pose work。Screen-size LOD 用 logical pixels；LOD／HLOD transition 真畫 coverage，不是 RGB darkening。Replacement destroy owned nodes，不 destroy borrowed geometry／material／textures。

Opt-in native depth occlusion 必須 completed zero-sample exact-state proof；camera／geometry／pose／skin／texture／fade／depth 改動立即 invalidates。Pending／stale／unsupported／exhausted 一律 visible。Queries bounded／async、不同步等待；frustum 不冒稱 occlusion。Custom depth-changing material 保守使 proof 失效；unbounded deformation 維持 visible。

NativeMaterial3D 繼承 TextureMaterial，immutable WGSL／GLSL hooks（xyzDeform／xyzSurface）、64 finite Float32 mutable uniforms、最多四 borrowed textures；無 transpiler／arbitrary bindgroups。setUniforms 驗更新，public view 在 prepare／submit 前驗。Optional finite nonnegative deformationBounds 限 final mesh-local displacement；未提供則 disable bounds culling。Destroy descriptor 釋 renderer entries、不 destroy borrowed textures。Prepare／warmup async／fallible，caller 處理 reject／cancel；loss 僅保留 live ownership 並在同 backend rebuild。Canvas2D 明確拒，不 silent ignore。ABI／lifetime 契約不是 final native acceptance。

LightSelectionOptions.exceedPolicy 為 select／error；每種 pool≤1024，native shading slots 仍 bounded。按 priority／contribution／draw bounds（camera-selected visible draws）選取，不是 clustered／unlimited lighting。Culled 與 relevant overflow 分開計；error 拒超額 relevant lights，select 明示省略低順位 contribution；shadow atlas capacity 獨立。

### Streaming、trusted workers 與 authored maps（P81–P83）

Scene.createWorldStreaming() 擁有 controller／Game-local ResourcePool leases；loader 在 fallible await 前 own root。每 cell 原子發布完整 subtree，僅 active 才提供 authoritative physics／navigation，detached ready／prefetch 不提供。Pause 可完成 acquisition 但不改 membership，resume 先 reselect。Disable／destroy 同步 retire。Active／pending／resident／admission hard caps 計 cells／reservations，不是 VRAM／CPU deadline；cancelled non-cooperative load 到 settle 才釋 reservation。Late result destroy，共享 borrowers 不因其他 cell retire 失效。Error 明示、retry caller initiated。Nav seam 需恰兩個 live coincident authored owners，否則 closed／error；topology replace cancel 舊 graph routes。

NativeWorkerPool 真執行 trusted native module Worker，不 eval／Blob asset code／main-thread fallback。FIFO slots／queue／bytes／timeout bounded；僅 dispatch 才 transfer detach input，queued abort 不 detach。Running abort／supersede terminate worker；failure 不 silent retry。Worker context.own()／definition release(raw) 回收 failed／unpublished／late envelopes；成功 result 交 caller。Destroy terminate／reject pending。requestBytes 是 declared array storage，不是 JS heap；transfer／copy counters 排除 envelope／browser overhead。publishHeightfieldGeometry() 仍在 main thread 做真 Geometry validate／interleave／copy；publication bytes／time 與 queue／dispatch／compute／awaited time 分开，部署保留 emitted worker modules。

原 P83 finite orthogonal right-down atlas profile 由 P91 擴充：finite／infinite JSON maps、負座標 sparse chunks、可編輯 nested groups、repeat／parallax image layers、atlas animation 與相對 object templates。`parseTiledMap()` 接受陣列與嚴格 uncompressed base64；`TiledLoader` 另做 bounded native gzip／zlib 解壓及 template resolution。Opacity／visibility／offset 沿 group 繼承；animation 由 Scene 管理並隨 lifecycle 暫停。Template cycle／overlapping chunks 明確拒絕。

保留 embedded／external atlas tilesets、八種 GID transform、bounded primitive properties、真 solid-tile／rectangle／circle／convex-polygon collision。`TiledContent.setGid()` 一起更新 display／collision；infinite map 編輯限已匯入 chunk bounding grid。預算包含262144 cells、4096 chunks、128 layers、65536 atlas frames、aggregate8 MiB JSON／32 MiB images。Nonorthogonal／非 right-down、image-collection tilesets、tile／text／polyline／point objects、transparent-color image layers 仍 unsupported，不 silent drop。

URL origins／redirects／decoded bytes／atlas dimensions 保持有界。Content scopes own nodes／colliders／leases；failure／abort／late decode cleanup，external texture borrowed；destroy 先移 collision registration 再 release lease。各 backend 的 native 證據見 [ACCEPTANCE](../ACCEPTANCE.md)，不能從匯入 profile 推論。

### Analytic particles、timing 與 platform gates（P75／P85／P86）

GPUParticleEmitter3D 使用 WGSL／GLSL vertex analytic simulation；CPU 只存 bounded birth／sequence／affine metadata，不模擬粒子 motion。Capacity≤65536、rate≤1000000/s、lifetime≤3600s；chronological drop-new 推進 sequence，不 backlog。Local 用 current affine，world 保留 birth affine；rate birth 採 current tick pose，不插值 historical nozzle。Stop 讓 survivors aging，pause 凍 command time／credit，explicit burst 仍允許；clear／detach／destroy 釋 native buffers。Premultiplied depth-tested billboards 無 depth write／shadow／per-particle sort／weighted OIT。Loss 由 retained metadata rebuild；Canvas2D 拒 prepare／visible particles，不 CPU fallback。

GpuTimingStats.scope 在 WebGPU 為 native-pass-sum：真正 render／compute passes 的精確 duration 總和，**不是 frame total／JS time／queue wait／pass 間空檔／display presentation time**。WebGL 是 native-command-interval，Canvas unsupported。Empty／quantized-zero／incomplete／invalid samples nullable；pass budget overflow 使整 sample 失效，不回 partial duration。Latest result async。Production workload 報 authored counts、loading／steady stages、RAF intervals、CPU work／submit、GPU duration／hitches、分開 heap／RSS／residency estimates；只有明示 device-specific threshold 可 pass／fail。

Physical mobile／gamepad／OS IME／audio／background／thermal／driver／assistive gates 需真 device／browser／version／source／session 與 independent capture。Emulation／inventory／AX tree／managed browser probe 不能認證；缺證據具名 BLOCKED。不授權操作 Safari／user browsers／OS 或 driver reset。User 禁止發聲使 audible／real spoken-output certification blocked；silent probe 用 separately owned browser＋zero-gain output safety，不靠 headless 假設。

### Presentation preferences 與 keyboard semantics（P87）

Game-owned AccessibilityPreferences 合併 OS defaults／player overrides（textScale／highContrast／reducedMotion），set／reset／export／bindMotion／destroy 有明確 owner lifetime。UIRoot.applyPreferences() 真 rerasterize／reflow canvas text／control／input／caret／focus-hit geometry；新 mounted subtree 可明示 await。Semantic DOM 只 mirror interaction／announcement，不畫視覺替代；UILabel semantics opt-in。

Reduced motion gate requested／publication-time Game transitions，安全完成 active decorative transition。Preference tween／duration／delta helpers 與 bound decorative animation owner 不凍 essential simulation／locomotion。AccessibilityManager.announce() 擁有 bounded polite／assertive region；modal scopes hide inactive semantics、trap Tab／ShiftTab，Escape dispatch modalclose。Application 明示 close／restore focus；disabled control 不 focus／activate。Remap 用既有 ActionMap 並保留 navigation keys。Keyboard／semantic proof 不是 screenreader certification。

## 60. 版本相容性政策與升級指南（P73）

唯一支援的引擎 import 是 `xyz.js`；`packages/` 內部路徑不是 consumer API。
能力／ownership 目錄見第 59 節，可執行目錄見
[Examples](../examples/index.html)，打包／部署見 [Usage](./USAGE-zh.md)。
不支援的 backend／格式會明確拒絕。

正式發行遵循 semantic versioning：新增相容 API 使用 minor，不相容公開契約
必須使用 major 並附遷移步驟；平台驗證不由版本號推導。P71–P87 是既有
套件的擴充，依使用者授權納入 **v1.11／1.11.0**。
先前 1.10.0 working-tree snapshots 與記錄的 hashes 保留為歷史證據，
不代表新 release archive 的 identity，也不構成歷史附件或實機認證。

從原 P70 source／release 升級時：

1. 將 deep imports 改為公開 root，重建完整套件並部署整個 `dist/`，保留未改動的
   `vendor/opm/`。Standalone starter 必須來自該份 built directory／tarball，
   重新 typecheck／build，並保留 emitted worker modules。
2. `OPMAdapter.setPaused()` 改為 await 並處理 rejection；
   `AudioManager.pause/resume` 仍是同步 owner policy。Unlock／play 要在可信手勢中
   呼叫；也可先 `autoplay:false` 預載，再於手勢中直接 `play()`。
3. 舊 save envelope 以 revision 0 讀取，不在 load 時改寫。編輯前先 load，處理
   `stale`／`unsupported`，備份先 explicit recovery 再 restore。
   LocalStorage manager 寫入需要原生 Web Locks，不可用時選 IndexedDB；
   沒有 atomic `mutate` 的 custom storage 只有 process-local 保證。
   不要 raw-clear reserved revision／archive keys，也不要把備份的舊 revision
   當作目前的 CAS token。
4. Application exhaustive switches 要處理新增 `kinematic` 2D body。
   Nonstatic body 保持 unparented，character／locomotion 每 fixed epoch 只推進一次，
   不要再用另一個 mixer 重複消費 Scene-owned root motion。
5. Navigation bake 預設改為有限的四層 support；明示 layer budget、
   horizontal／vertical projection limits 與實際 special-link traversal，
   streamed graph revision 改變時重建／replan。
6. Native mesh material／analytic particles 是 native-only 資源；publication 前
   prepare，自行提供 WGSL／GLSL，全部 consumers retire 前保留 borrowed textures。
   GLSL stage-only intrinsic 以 `XYZ_VERTEX`／`XYZ_FRAGMENT`／`XYZ_SHADOW` guards
   隔離。Scene light pool、bounded per-draw selection 與 shadow allocation 分別處理。
   自訂 `Renderer` 的 `prepareGpuParticles(emitter)` 為 optional，維持 1.x
   舊實作者的 source compatibility；呼叫前須檢查方法是否存在。正式包裝器
   對缺少該方法的 renderer 拋出 `UnsupportedGraphicsError`；已提供方法但
   不支援粒子的 backend 也必須拒絕 preparation，不得靜默略過。
7. Timing consumer 改用 `scope:'native-pass-sum'`：WebGPU duration 不含 queue、
   presentation／pass gaps，保留 nullable sample，分開 RAF／CPU、memory domains
   及裝置門檻。套用玩家 presentation preferences 但不停止必要 gameplay；
   reduced motion 也在 asynchronous capture 後 gate transition。

遷移時保留舊 save fixtures 與代表性可玩流程。只有實際執行的 final scenario
可寫入 [Acceptance](../ACCEPTANCE.md)；實體硬體、Safari、spoken output／輔具
認證不得由 desktop automation 繼承。

## 61. 1.x 相容擴充契約（P88–P96）

此節保留 P88–P96 基線；原 nested-signature checker 限制屬歷史。目前 safeguards／工具與精確 root-export 文件見 [CURRENT](CURRENT.md)。

既有 root export names 全部保留；`check:api-compatibility` 檢查 value／type
namespaces 與維護中的 legacy custom Renderer consumer，不是完整歷史 nested
signature checker。Native capabilities 仍需明示，Canvas2D 維持2D-only。

### UV coordinates 與 skin 資料

`Geometry` 可提供 `uvs1`；未提供時不改原 UV0／interleaved layout。
`PBRMaterialOptions.textureCoordinates` 將 `MaterialTextureSlot` 對應至
`{texCoord:0|1,offset:[u,v],rotation,scale:[u,v]}`。材質暴露 frozen coordinates，
affine `[a,b,c,d,tx,ty]` 表示 `u'=a*u+c*v+tx; v'=b*u+d*v+ty`。
Slots 為 `texture`、`metallicRoughness`、`normal`、`occlusion`、`emissive`、
`specular`、`specularColor`、`clearcoat`、`clearcoatRoughness`、`clearcoatNormal`、
`sheenColor`、`sheenRoughness`、`transmission`、`thickness`。Normal 與 clearcoat-normal
使用自己選擇／轉換後的 UV derivatives；shadow alpha 使用 base map coordinates。

glTF 保留 UV0／UV1 與獨立 KHR transforms，不烘改共用 vertex UV。
`SkinnedMesh.influencesPerVertex` 預設4、可明示8；成對 `JOINTS_1`／`WEIGHTS_1`
提供另外四個，CPU bounds／picking 與 native renderer 都保留全部八個 normalize
influences。UV2+、更多 skin sets、缺少指定 UV 或 malformed pairs 拒絕。
既有 decoded-resource／morph／hierarchy／palette budgets 保留；native fixtures
不等於任意第三方 asset corpus 認證。

### Authored polygon 與 partitioned navigation

`NavigationMesh3D({polygons,links?,tileSize?})` snapshot ordered vertices、
convex／coplanar surfaces 與作者認證的 `clearanceHeight`。完全相同的3D shared
edges 建立 portals；XZ 重疊的不同樓層不會自動相接。Projection 計算真 surface
height、horizontal／vertical limits、agent radius／headroom。Path 帶 polygon
corridor 與 clearance-certified surface waypoints；noncoplanar seams／special links
不以穿越空氣的直線代替。`NavigationMeshFollower3D` 需正確 center-to-feet offset、
實際 special-link handler／completion，並以 capsule collision 移動。

`NavigationTiledGraph3D({tiles,seams,tileSize?})` snapshot 既有 authored 或
collision-baked sampled graphs，加明示 certified seams；端點使用
`NavigationTiledGraph3D.nodeId(tileId,localId)`。既有 `NavigationGraph3D` 保留8,192
nodes上限；新 aggregate profile 允許262,144 nodes、2,097,152 connections、
1,024 tiles，copy前先檢查總預算。Polygon profile允許262,144 polygons、每片最多16
vertices；其他 spatial／adjacency limits 見 `src/data/navigation.ts`。
這些是 bounded admission limits，不是 process-memory 或 frame-time 保證。

新 queries 使用 spatial projection／sparse search；cooperative work 包含
reconstruction／smoothing，不只 A* expansion。遵守 revision／cancel／shared
scheduler budgets，geometry 改變時 rebuild／replan。Unsafe spatial indices 會拒絕，
不進入無界迴圈；原 sampled／grid APIs 仍可用。

### Settings 與 portable files

`SettingsManager(storage,preferences,namedContexts,{slot?,signal?})` 接完整
game-local action contexts，constructor捕捉 defaults。Stored v2 含 accessibility
overrides／bindings；accessibility-only v1 migration 補上這些 default bindings。
`load`／`save`／`reset`／`importFile`／`exportFile`／`destroy` 沿用 save envelope、
完整 validation、revision／CAS 與 cancellation。Missing／unknown contexts 或
actions 在 apply 前拒絕。Reset／import 先完成 durable write 再替換 runtime policy；
省略的 accessibility overrides 回到跟隨OS，`replace` 只發布一次 policy change。
Settings owner 不擁有傳入的 preferences／contexts／storage。

`PortableSaveFiles(saves,{slot,validateCandidate})` export JSON Blob 或 import 至
既有 durable checkpoint slot；讀取 text 前檢查2 MiB上限。Import在async preflight
前固定 observed expected revision；先 migration／完整 envelope validation，
再由 caller 建立、restore、dispose **fresh candidate**。Callback必須遵守signal，
清完全部 candidate resources；成功才到CAS storage，回傳record而非改live Scene。
Fresh Scene publication 是 application 另一個 guarded transaction。
Superseded／aborted／invalid／conflicting import不覆寫slot或patch目前Scene；
destroy只取消helper工作，不destroy傳入SaveManager。

`downloadSaveFile(blob,filename)` 需在 trusted click 呼叫，回傳object-URL cleanup
ownership；先async準備，再提供獨立download click。Rejected檔案保留原Blob bytes
供救援，不靜默reserialize。兩個starter checkpoint皆為dimension-tagged v2；
跨dimension restore明確拒絕。

### Native extension、visibility 與 deployment 界線

Native hooks 使用engine-owned `XYZVertex`／fixed uniform-map ABI；不重宣告engine
struct、不加entry points、private resources或第二套shader語言。GLSL stage-only
操作以 `XYZ_VERTEX`／`XYZ_FRAGMENT`／`XYZ_SHADOW` guard。Preparation檢查真native
device limits；active GL private uniforms／blocks拒絕，不靜默讀零。四張maps仍為
borrowed，必須存活至所有consumer退場；tracked native shadow cache是明示
deterministic-input承諾，不假設任意shader hook可安全快取。

Visibility保留O(mesh) raw mutable-pose checks，跳過未變的BVH refits／instance
filtering。`RenderVisibilitySet.boundsRefits`是CPU bookkeeping；20,000-instance、
1,000／4,000-mesh gather證據不是GPU completion或FPS。Production
`baseline|low|high`品質dimensions／counts在 `src/data/observability.ts`。
`native|simulated-low-tier|simulated-low-tier-heavy`分別回報真host或明示CDP
CPU／network pressure，不能當physical low-tier provenance。RAF、CPU submit、
nullable native-pass GPU time與memory domains分開記；無operator limits時為
measured／BLOCKED而非performance PASS，CI的5,000ms teardown只有host-scoped
hang guard意義。

Starter production build以 `GAME_OFFLINE=1` opt-in，加base-relative `GAME_BASE`；
部署完整產物樹，包括OPM／vendor、module worker／worklet、
`deployment-policy.json`／header artifacts。Host需真的套CSP，或使用套件內
`scripts/deployment-server.mjs`；僅放JSON不會強制policy。預設不允許inline
script／style，也不允許eval。

Worker嵌入完整versioned manifest，驗hash／MIME後才發布cache generation；
credentials、private／no-store responses、任意runtime URLs不快取。Failed update
保留前一整套generation；activation等待舊tabs離開，不強制混版，保留上一代rollback。
Uninstall只刪自有registrations／caches，不刪player saves或其他origin data；
opt-out build移除舊generated worker artifacts。Offline proof必須fresh production
navigation、真native module／node loads與manifest response verification，
不是漏掉AudioWorklet fetches的page-network request counts。不承諾offline
streaming media或任意origin快取。

### Release verification 與安全政策

Deployed-site CLI支援1-based `--shard index/count`，count≤32。先以sorted source-example ordinal modulo分配，再套filters；每個example保留全部advertised backend profiles與unsupported 3D明示拒絕。每shard自有server／managed muted Chromium process／output，完整驗兩catalogues及links；report保留available／planned／completed／exercised IDs，empty、blocked-only或incomplete均FAIL。四個必要CI shard jobs全部通過才可發佈。

目前site與production／starter jobs使用macOS／Metal；native audio保留原Linux／PulseAudio環境、reference tolerance及獨立必要job。Linux／SwiftShader browser regression matrix另保留。原production baseline frame counts、measurement deadline與teardown threshold不變，不能宣稱Linux效能修復或universal FPS認證。Starter harness以可信鍵盤到公開HUD collection狀態，不再以wall-clock delay推測移動；其後自然玩法、saves及offline gates仍必要。操作見 [USAGE](USAGE-zh.md)，詳盡英文 [SECURITY](../SECURITY.md) 說明安全政策；實際hosted結果與原FAIL見 [ACCEPTANCE](../ACCEPTANCE.md)。

v1.12.1 reliability patch保留已生效且target／tau未變的single-target duck envelope，不因ownership重疊重啟。新future transitions仍追加在原curve，target／tau或既有future plan改變則按captured native clock重建，不以sampled `AudioParam.value`猜hold。Portable-settings harness以可信remapped input到一個HUD gameplay second後驗downloaded checkpoint，原位移門檻不變。Native reference精度、concurrency、八context workload與owned teardown均保留。
v1.12.4 duck scheduler 將立即 native control 錨定在各 context captured clock 之後 `audioDefaults.controlLead`（20 ms），不再使用已過去的時間。否則在負載下連續兩次 native 呼叫（hold、target）可能被不同 render quantum 處理而差一個 quantum；未來錨點讓兩者從同一條精確曲線求值。因此 ducking 起點較請求晚 20 ms；測試與獨立 native reference 使用同一排程時間。

## 62. 目前工程保障（P97–P103）

[CURRENT](CURRENT.md) 將目前 support／API／ownership 規範與上方歷史驗收／升級基線分開。TypeDoc 轉換 `src/index.ts`、將目前契約納入搜尋，經 staged site builder 發佈 relative-link-safe 版本目錄；generated HTML 不追蹤、不放進引擎 archive。

Project preflight 經實際 model／map／atlas／font loaders 驗證 bounded immutable snapshots，提供 file／location 診斷並只發佈新目錄。Archive hygiene 比對 clean／disposable polluted workspace 的 approved paths／bytes。效能校準與獨立 reviewed-profile gate 分開，綁定 host／GPU／backend／workloads，測 loading／steady frame、CPU／hitch，不只有 teardown。實機 evidence 驗證綁 source／session identity 與 exact artifact bytes、要求 independent named human review；不以密碼學宣稱物理真實性，亦不用 managed engine／合成輸入代替實機。

效能 provenance 綁 `expected.presentation`（`headless`／`native-foreground`）；缺少或改變 mode 時 BLOCKED。Native-foreground 為每個 workload 建立獨立 macOS headed Chromium／profile，以 native spawn／CDP PID 及前後 AppKit／window 證據核對。正式 `connectOverCDP({noDefaults:true})` 只操作 default context，讓 Playwright 不安裝 focus override；新 incognito context 不適用此選項，因此不使用。另一 CDP handler 的 `enabled:false` 無法釋放原 handler 的 capture handle。Loopback ephemeral transport argv 明示 pin，不改 scheduling flags／clock／counts／budgets。每個 unchanged production callback 與 lifecycle events 觀察真 document focus／visibility，缺證據或中斷 FAIL，保留已完成量測；不是連續 OS focus sampling 或 GPU presentation completion 證明。WebGL fixtures 拒絕 skipped submission 舊 framebuffer，exact pixel oracles 不變。

# XYZ.js 技術參考

[English](TECHNICAL.md) · 繁體中文

**目前支援規範：**[v1.22.1 契約](CURRENT.md)與 `pnpm docs:api` 生成的 root-export API。`pnpm build:site` 納入可搜尋版本目錄 `api/1.22.1/`。本頁保留詳細子系統 recipes、歷史階段／升級描述，與目前契約及歷史驗收分開。

本參考描述 **1.22.1／Apache-2.0**；npm 未發佈。[PLAN](../PLAN.md)／[DESIGN](../DESIGN.md) 定義已批准至 P118 與程序材質預設的契約，[ACCEPTANCE](../ACCEPTANCE.md) 記實跑與未驗限制。P104–P118 納入 v1.16，不在歷史 GitHub v1.14 archive。歷史日期、counts 與 release metadata 保留為當時證據。API 參考 three.js／PixiJS／Excalibur，非 drop-in parity，未新增 runtime dependency。Windows CI 設定不認證實體 Windows 硬體或驅動；browser qualification 只依實際記錄的證據擴充。

五個原 hosted workload與真失焦guard已於[CI37105917252](https://github.com/YueyuHoshizora/XYZ.js/actions/runs/37105917252)通過；Windows原生圖形failures仍阻擋發佈。使用者批准只有 pinned native WindowsWebKit在secure origin實測AudioContext／AudioWorkletNode均不存在、符合上游ENABLE_WEB_AUDIO OFF時音訊記UNSUPPORTED。WebKit其他gates及WindowsChromium／Firefox原生音訊assertions仍必須通過，不能宣稱WindowsWebKit音訊認證。

第58節 production 契約納入 **v1.10／1.10.0**；發佈封裝不擴大文件記載的平台、硬體或效能證據。

## 歷史階段 profile 導覽

| 項目                       | 歷史階段 profile／限制                                                                                                                                                                                                                                                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| WebGPU／WebGL2             | 2D sprites／isolation／masks／blends／native materials-filters-meshes；3D lighting／PBR／instancing／shadows／post／weighted transparency。WebGPU 需安全來源，WebGL2 HDR／weighted 需 float color attachments。                                                                                                                                                    |
| Canvas2D                   | Native 2D paint／isolation／masks／basic blends／offscreen；無可見 3D／Mesh2D、Material2D、native Filter2D、effects2D／effects3D。明確拒絕，不靜默切 backend。                                                                                                                                                                                                     |
| Physics2D（P76）           | Sleep、kinematic、bounded relative 平移／旋轉 CCD、凸形 character sweep／平台 carry；五種 joints、static concave 分割／thick chains、共用單一 body 的 dynamic convex-hull／compound 凹形片段。Sensor 仍 discrete，無 deformation CCD。                                                                                                                             |
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
       └─ vendor/opm           官方 OPM.js v1.13.1（tag v1.13.1）

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
- WebGPU 共用一個 Sprite pipeline，重用可成長的 instance buffer，依排序後相鄰 texture 合併 draw。quad slot 數達 `stagedUploadQuads`（`src/data/rendering2d.ts`）的 draw 會把 instance 填入與 instance buffer 同大小的已 map staging buffer，以一個排在該幀之前送出的 command buffer 複製，因為 `queue.writeBuffer` 會在呼叫端執行緒複製大量 instance；同時最多 `uploadStagingBuffers` 個在途，沒有已 map 的就直接寫入。GPU texture cache 與 AssetLoader 分離，未使用或已銷毀的資產會釋放 GPU resource。
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
  WebGPU 與 WebGL2 的 sorted 模式即使對 double-sided、alpha 為一的 BLEND 材質也保留 depth write，避免較遠背面覆蓋較近正面。
- resize 保留 shader／geometry／texture，替換尺寸相關 depth／HDR attachments；destroy 釋放 GPU caches。

## 14. Compatibility（P06）

- 瀏覽器 Canvas context 綁定不可逆。auto 不在使用者 canvas 上嘗試 GPU context，而是以獨立 canvas 完成 backend 初始化，再由原 canvas 的 2D context 呈現；不替換 DOM，也不破壞 input listeners。每幀增加一次 drawImage copy，效能應獨立量測。強制 backend 無此 copy。
- WebGL2 使用 instanced Sprite batching、共用 GLSL pipelines 與 geometry／texture cache。Mesh 將 WebGPU 0..1 clip depth 轉成 GL −1..1，使用同樣的 normal／light／premultiplied blending。
- ImageBitmap 為 straight alpha，上傳 WebGL 不依賴會被忽略的 pixelStore flags；shader 乘 alpha。UV=0 對應圖片第一列，不額外翻轉。
- Canvas2D 使用 native affine／drawImage／alpha；triangle 為漸層示意而非 GPU 的逐頂點插值。Primitive2D rectangle／circle 在建立時 rasterize 一次，之後重用 Sprite 路徑，destroy 只釋放自己的生成 Texture。
- capabilities：WebGPU 全部 boolean=true；WebGL2 threeD／customShaders／instancing=true，其餘 false；Canvas2D 全 false。maxTextureSize 為 backend 上限（Canvas2D 採保守 8192）。這是能力查詢，不是 custom shader 或 compute 的公開執行 API。

## 15. Audio

- `game.audio.load(url)` 共享 canonical URL（忽略 fragment）的 pending/cache；失敗會逐出，destroy 立即取消等待。JSON 必須含官方可解析 `voice` 及非空 `notes`，每音符 MIDI 0–127、time ≥ 0、duration (0,60] 秒。可選 channel（music/sfx/ui）、loop、duration（loop period，不能短於最後音符結束）。載入後 voice/notes immutable；格式示例見 [sfx.json](../examples/sprite/sfx.json) 與 [music.json](../examples/sprite/music.json)。
- Voice 驗證在內部透過官方 v8 格式正規化，仍接受 legacy v1 輸入。引擎公開的 `OPMVoice` 保留已發佈的 `version: 1` 契約，不暴露 native v8 representation；歷史驗收與升級驗證紀錄不改寫。
- 在使用者 click 等手勢內 `await game.audio.unlock()`；之前 play 拋 AudioError，不偷偷建立 AudioContext 或排隊。OPMAdapter 在 load 驗證 voice 時可先 import 官方模組，但只有 unlock 建立音訊。P137 起由 AudioManager 擁有單一 AudioContext，在呼叫者同一 turn 內建立並 resume；OPM、sample、stream、effects、ducking 與 3D listener 全部共用，unlock 後 `audioContextCount` 為 1。八個 OPM slot 透過官方 `context` 選項借用它（同一 context 上八個 AudioWorkletNode）；OPM 不會 suspend／close 借用的 context，因此 pause／resume／destroy 由 manager 負責。每 slot 保留一個聲部，含 ADSR release 與 guard；master/channel volume 0–1 經 GainNode 相乘。
- OPM 可能單獨失敗：非安全來源（沒有 AudioWorklet）、vendor 檔案缺漏或 worklet 被擋。此時只要共用 context 能運作，`unlock()` 仍會 resolve，並經 Game `error` event 回報 `AudioError('OPM synthesizer is unavailable.')`（官方錯誤為 `cause`），公開 `game.audio.opmState`（`'locked' | 'starting' | 'ready' | 'failed'`）與 `game.audio.opmError`。Sample 與 stream 仍可播放；播放 OPM asset 拋出帶相同 cause 的 AudioError。再次明確呼叫 `unlock()` 會在同一 context 重試 OPM。無法建立或 resume AudioContext 時 `unlock()` 仍會 reject，並關閉不完整的 context。
- 官方 OPM.js v1.13.1（tag `v1.13.1`）可選聲部數，但 XYZ.js 仍維持八個隔離 instance，每 slot 保留一個聲部。soft stop 仍有 release，隔離可在不 fork 的情況保證 SFX overflow 不斷 BGM。只有 oldest SFX 可以透過官方 `opm.panic()` 清除音符，保留 managed node／routing；teardown 使用官方 `opm.dispose()`。沒有 SFX 可搶時略過新音符，不取消 music track。預算包含 UI 與 release。此 vendor 升級不新增引擎功能或擴大認證範圍。
- 25ms timer、100ms lookahead；timer throttling 後跳過漏掉的 loop，不追補整首歌。時間／slot 常數集中 `src/data/audio.ts`。Game pause 不代表 audio pause；需要時明確 stop。
- `asset.play(options)`／`game.audio.play(asset, options)` 回傳 AudioPlayback；stop 保留自然 release。預設關聯當前 Scene，也可指定 `scene`；沒有 Scene 時由 stop／結束／Game destroy 管理。Scene destroy hard-cancel 非 persistent 排程與 release；`persistent:true` 可跨 Scene，Game destroy 仍全部關閉。`game.audio.opm` 是由第一個官方 instance 支援的進階 legacy compatibility facade，並非 native instance 本身；`opmState` 不是 `'ready'` 時為 `undefined`。它保留可寫 context／node handles 與可變的 voice `Map`，聲部仍使用已發佈的 v1 契約；其 `context` 是 manager 的共用 context，所以它的 `close()` 只釋放該 slot 的 worklet，不影響 sample／stream。直接操作會繞過預算／lifecycle。Managed playback／teardown 在內部使用官方 native `panic()`／`dispose()`。獨立 `new OPMAdapter()` 會自行建立並擁有一個 context 給八個 slot，`destroy()` 時關閉。
- [來源與 SHA256 manifest](../vendor/opm/manifest.json)、[官方 Apache-2.0 LICENSE](../vendor/opm/LICENSE) 位於 vendor，沒有私人 patch；根套件另以 Apache-2.0 授權。build 複製完整 vendor 到 dist，保留 modules／worklet 的相對 URL；部署必須保留整個 dist，AudioWorklet 亦需安全來源。
- 選用的 `Game.create({ opmModuleUrl })`（P138）改從另一個 `dist/api/index.js` 載入官方 OPM.js，例如以 commit 釘住的 jsDelivr：`https://cdn.jsdelivr.net/gh/JS-PACKAGE/OPM.js@4fdbff0f2d6a509763e3bef0066c059ba88ad154/dist/api/index.js`（tag `v1.13.1`；tag 可被移動，請釘 commit）。只接受 HTTPS，或與頁面同源的 HTTP(S)，且不可含帳密或 fragment；否則 `Game.create` 在建立 renderer 前以 AudioError 拒絕。Worklet 會從該模組旁邊解析，主機必須以 CORS 提供兩者。Voice 驗證與 unlock 都使用它，而且模組匯出的 `VERSION` 必須等於 vendor 版本（`src/data/opm.ts`），否則載入以 AudioError 失敗（unlock 時即 `opmState: 'failed'`）。這只是版本檢查，不是完整性驗證：`import()` 與 AudioWorklet 模組無法做 hash 釘選，CDN 副本是 vendor SHA256 保證之外的受信任程式碼。頁面 CSP 必須允許該來源（`script-src`，也管 worklet），離線快取也不包含它。Vendor 副本仍是預設，也仍隨套件發佈。

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
- Text2D 擁有一張 `CanvasTexture2D`：`setText`、`setStyle` 與 `refreshFonts` 原地重繪（同一物件、`version` 遞增，不再每次解碼點陣圖），並隨 Scene 銷毀。外部另指定的 `texture` 與 Primitive2D 一樣是借用，不由 Text2D 銷毀；下次更新會改回顯示自有貼圖。若把 Text2D 的貼圖共享給其他仍存活的 Sprite，它會跟著顯示後續更新，並在標籤銷毀時一起銷毀。
- `scene.timers.after(seconds, callback)`／`.every(seconds, callback)` 回傳具有 `active` 與冪等 `cancel()` 的 `TimerHandle`。單次 delay 必須有限且非負；重複 interval 必須有限且大於零。零秒是在下一個 timer tick 執行，不是同步立即呼叫。
- Game 在 Scene.update 前以 clamp 後的模擬 delta 推進計時器，不依賴 subclass 呼叫 super.update。Pause／hidden 時間不累積；同 tick 到期 callback 依註冊順序執行，每個重複 timer 每 tick 至多一次，漏掉的週期跳過、不爆發補跑。Callback 內新註冊的工作留至下個 tick。
- Callback 是同步的，不要用 async callback 期待 scheduler 等待它；拋錯走 Game 的 fatal frame error。禁止遞迴推進 timer。Scene destroy 取消所有剩餘 callback 並清除參照，也拒絕再新增；候選 Scene 準備期間不推進。Callback 中 pause 在目前同步 timer batch 結束後生效。
- Pong 示範畫布文字計分、延遲一秒發球、pause／resume 與 Scene 替換。新增功能驗證共 96 測試；Chromium 實測 WebGPU／WebGL2／Canvas2D 的文字畫面，不代表新增跨瀏覽器認證。

## 21. 進階 3D（P09–P12）

### 階層、相機、控制與拾取

- Object3D 繼承 SceneObject，提供可變 position／Quaternion rotation／scale、transform、visible、parent、唯讀 children 及 worldMatrix。Group 是不繪製的 Object3D，Mesh 也繼承它。updateWorldMatrix() 重算本地與祖先變換（parent-world × local）；worldVisible 包含所有祖先可見性。
- 與 GameObject 相同，Object3D 的 world matrix（及所有祖先）每次 Scene presentation 只組合一次，供該次 culling、排序與繪製重用；presentation 之外的移動在下次呼叫即反映，覆寫 `updateWorldMatrix` 的子類別一律重算。相機不是 Object3D，因此逐 view 的相機變更（XR、probe capture）不受影響。
- parent.add(child) 將附屬子樹註冊到 Scene；同 Scene reparent 保留 ownership，cycle／destroyed member／跨 Scene 則在改動階層前拒絕。parent.remove(child) 或 scene.remove(root) 解除子樹註冊與父關係，但不銷毀。Scene.objects 包含已註冊 descendants；destroy parent 會銷毀子孫，共用 geometry／material／textures 仍為借用。
- scene.camera3D 可換成 PerspectiveCamera 或 OrthographicCamera。兩者提供可變 position／rotation／near／far、lookAt(Vector3) 與 updateMatrix(aspect)。透視 fov 為弧度；正交 height=10、zoom=1，垂直範圍為 height/zoom，寬度由 aspect 決定；本地 −Z 為前方。
- new OrbitControls(camera,canvas) 在指定 Canvas 處理左拖旋轉、右鍵／修飾鍵左拖平移、中鍵／wheel dolly。可設 target、enable flags、speeds、min/maxDistance、min/maxZoom（正交）、min/maxPolarAngle 與 min/maxAzimuthAngle（弧度）。update() 協調外部修改；destroy() 移除 capture／listeners 並還原引擎接管的 touch-action。Scene 不自動管理它。
- new FirstPersonControls(camera,canvas) 提供滑鼠視角與 WASD 移動。`await controls.lock()` 要求 Pointer Lock（必須在使用者手勢內呼叫，瀏覽器拒絕時 reject）；`unlock()`、`isLocked` 與 `lock`／`unlock` 事件（為 `EventTarget`）反映 canvas 的鎖定狀態。鎖定期間（`requireLock`），pointer 的 `movementX/Y` 以每像素 `lookSpeed` 弧度改變 `yaw`／`pitch`，pitch 限制在 `[minPitch,maxPitch]`；`update(deltaTime)` 依 `keys`（`KeyboardEvent.code`，可重新綁定：forward／back／left／right／up／down／sprint；`sprintMultiplier`）以 `moveSpeed` 單位／秒移動相機。除非 `fly` 為 true，否則水平移動。鎖定結束或 canvas blur 會清除按住的鍵。初始 yaw／pitch 取自相機旋轉（捨棄 roll），也可用 `setRotation(yaw,pitch)` 設定。請自行每幀呼叫一次 `update`；`destroy()` 解除鎖定並移除所有 listeners。僅以假的 document 與 canvas 做 unit tests；真實瀏覽器 Pointer Lock（含非手勢呼叫被拒、觸控裝置）未實測。
- Raycaster.setFromCamera(x,y,camera,aspect) 接受 NDC；intersectObjects(iterable,recursive=true,out=[]) 替換 out，按世界距離排序精確 indexed-triangle 交點，含 object／point／distance／faceIndex，instance 另含 instanceId。隱藏祖先排除子孫，重複 roots 不重複 Mesh。拾取固定雙面、不依材質 culling；Raycaster near=0／far=Infinity 與 camera clipping 獨立，skin 在拾取前更新。

### glTF、動畫與幾何更新

- GLTFLoader.load(url,{signal,allowedOrigins}) 與 parse(ArrayBuffer|string,baseURL?,{signal,allowedOrigins}?) 回傳 GLTFAsset：scene:Group、animations:AnimationClip[]、冪等 dispose()。支援外部／內嵌 buffers 和 images、relative URI、GLB2、triangle primitives、normalized／strided／sparse accessors、node TRS與可分解 affine TRS matrices、metallic-roughness 材質、UV0／UV1 textures、四／八 influences skins。引用的 buffers／images 只從模型自身 origin（baseURL）或 allowedOrigins 列出的 origin（例如 ['https://cdn.example']）取得；data:／blob: 一律允許，其他 origin 在請求前以 AssetError 拒絕。缺 normals 時產生；缺 referenced UV stream 明示拒絕，untextured geometry 可保留 zero UV0。
- 非 triangle topology、`COLOR_1`、UV2+、超過兩組成對 skin influences、shear matrix、animated matrix node、POSITION／NORMAL／TANGENT 以外的 morph attributes 明確拒絕；supported set 外 required extension 拒絕。`COLOR_0` 支援 float 與 normalized unsigned-byte／unsigned-short VEC3／VEC4、含 alpha（第34節）。Morph 支援 POSITION／NORMAL／TANGENT xyz deltas（float／normalized integer／sparse、缺項零）、mesh／node weights 與 STEP／LINEAR／CUBICSPLINE channels；tangent 保留 base handedness。同一 mesh primitives 的 target 數須一致、node weights 需匹配。影像解碼限制仍見第18節。
- 已實作 extensions：`KHR_mesh_quantization`（整數／normalized accessors 已還原為 float）；`KHR_materials_emissive_strength`（乘上 `emissiveFactor`，負值拒絕）；`KHR_materials_unlit`，以既有 PBR 近似：黑色 base color、roughness1、base color 導向 emission（alpha 仍取 base color，dielectric F0 的 image-based specular 仍微弱可見）；`KHR_texture_transform` 每個 map 獨立保留 `uv' = offset + R·S·uv`，支援 UV0／UV1 與 extension 的 `texCoord` override，不要求 shared transform，UV2+拒絕。`KHR_lights_punctual` 以 `asset.lights`（`point: PointLight[]`／`spot: SpotLight[]`／`directional: {direction,color,intensity}[]`）提供，載入時依各 node world transform 計算一次，保留 glTF 原始光度值，缺 `range` 視為0（無限）。Lights 不自動加入 Scene／跟隨 node 動畫，directional 是否對應 `scene.directionalLight` 由 caller 決定。Mipmapped minification filters9984–9987接受並降為對應 nearest／linear，不產生 mipmaps。其他 optional extensions 使用 core fallback。原 unit 證據使用合成模型；P90另有 native GPU／GL 各map reference與八influences fixture，不宣稱第三方模型集認證。
- P39 另支援 required `KHR_materials_ior`、`KHR_materials_specular`、`KHR_materials_clearcoat`、`KHR_materials_sheen`、`KHR_materials_transmission`、`KHR_materials_volume`；材質契約與 raster 近似見第 37 節。
- P32 加入內建 `EXT_meshopt_compression`，透過 `dracoDecoder` 有條件支援 `KHR_draco_mesh_compression`、透過 `ktx2Transcoder` 有條件支援 `KHR_texture_basisu`，fallback 詳見第 30 節。提供 callback 不等於引擎內建 codec，也不保證外部 decoder 的品質／速度／記憶體。
- src/data/models.ts 固定 input 32 MiB、aggregate fetched 與 tracked decoded allocations 各 128 MiB；各 top-level list entries 10,000、accessor scalar elements 4,194,304、total vertices 1,000,000、indices 3,000,000、每 skin joints 256、每 mesh morph targets 64、hierarchy depth 256。超限拒絕、不截斷；此 accounting 不是整個瀏覽器記憶體保證。
- 應用在移除／停止所有 consumers 後必須 asset.dispose()，釋放 loader-owned nodes／textures。僅 Scene destroy 不釋放 asset-owned textures；仍有 live borrower 時不可 dispose。Abort／parse failure 清理自有資源。
- KeyframeTrack(target,path,times,values,interpolation='LINEAR') 支援 `Object3D` 的 translation／rotation／scale，或 `MorphWeights` 的 `'weights'`（values 為 keys × targetCount 個 scalar，cubic triplet 對每個 weight 套用），以及 STEP／LINEAR／CUBICSPLINE。Times 為嚴格遞增非負秒數；cubic values 是 incoming tangent／value／outgoing tangent triplets。Linear Quaternion 取最短路徑，cubic 結果 normalize。
- Morph 在 CPU 執行：`MorphTargets({positions,normals?,tangents?,weights})` 以 weights 更新 cached bind vertices、normalized normals 與正交化 tangents；SkinnedMesh 先 morph render bind pose 再 GPU skinning，exact CPU query geometry lazy 更新（第42節）。同一 glTF node primitives 共用 morph weights。
- `AnimationClip(name,tracks)` 由最後 keys 算 duration；`scene.animations.clipAction(clip)` cache action。`play()` 繼續而不重設時間、`stop()` 歸零而不還原 pose。Repeat／once／pingpong、reverse、weights／fades／crossfades／ordered layer blending 見第 32 節（P34），已取代 P10 無 blending 基線。`stopAll()` 停止、`destroy()` 釋放。
- Game 在 timers 後、Scene.update 前以 clamp simulation delta 更新 animations，pause／hidden 不累積。勿手動更新同 mixer。SkinnedMesh.updateRenderDeformation() 更新 palette／bounds；updateSkin() 為 exact queries 更新 CPU mirror，不是一般 rendering 路徑。同一次 Scene presentation 內 palette／bounds 只計算一次，供 culling、light selection、排序與繪製重用；presentation 之外的 joint／morph 變更在下次呼叫即反映。Index topology 不變。

### PBR、光源、陰影、HDR 與 Instancing

- PBRMaterial 繼承 TextureMaterial，全部 slots 借用。Base texture／emissiveTexture RGB 從 sRGB decode；factors／lighting 為 linear。metallicRoughnessTexture 為 linear（G roughness／B metallic）、normalTexture 為 linear tangent-space（normalScale）、occlusionTexture 為 linear R（occlusionStrength，只作用於 indirect illumination）。與 `geometry.tangentTexCoord` 一致的 identity normal map 使用 Geometry tangent；其他 UV basis、transformed 或 native-deformed surface 使用該 map 的 derivatives。Metallic／roughness 預設0／0.5，emissive 為零。
- alphaMode 為 OPAQUE、MASK（alphaCutoff）或 BLEND；doubleSided 控制 culling／背面 normals。直接建構預設 BLEND（有正 cutoff 則 MASK）、doubleSided=true；glTF 預設 OPAQUE／false。PBR 以 alphaMode 為準，即使 opacity 小於一也不改分類。一般 TextureMaterial 在 opacity 小於一或明確 `transparent: true`（貼圖／頂點 alpha）時進透明 pass。預設 sorted 在 opaque／MASK 後按 bounding sphere 中心距離由遠到近，等距穩定、重用排序儲存；穿插表面仍可能錯誤，可選 weighted 近似。
- Scene.pointLights／spotLights 接受可變 PointLight／SpotLight pools；range=0 無限，spot angles 為弧度。P84 以 bounded selection 取代原八燈 Scene 上限，見第59節；shadow atlas 限制獨立。
- `scene.shadows` 預設 disabled；mapSize=1024、extent=10、near=0.1、far=50、bias=0.002／target 保留原固定 directional camera。Mesh.castShadow／receiveShadow 預設 true。P37 已加入 point／spot shadows 與 2–4 directional cascades，共用 bounded depth atlas／3×3 PCF；光源 flags／device dimensions 見第 35 節。
- scene.postProcessing 預設 disabled。啟用時 3D 先進 HDR floating-point attachment，再 fullscreen exposure（1）、toneMapping（預設 'aces' 或 'none'）、實際 9-tap threshold bloom（strength=0、threshold=1、radius=2 output pixels）。2D overlay 在後且不受影響；resize／disable／destroy 釋放尺寸相關 targets。WebGL2 需 EXT_color_buffer_float，缺少時明確拒絕啟用 HDR processing。
- InstancedMesh({...meshOptions,count}) count 固定且正，matrices 初始 identity。以 setMatrixAt(index,Matrix4) 設有限、可逆 affine matrix，增加 version 通知 upload cache；getMatrixAt(index,out) 重用 out，不要直接改 matrices 而不通知。Indexed hardware instancing 共用 geometry／material，world 為 mesh.worldMatrix × instance matrix，normal 使用 inverse-transpose。
- Environment（`EnvironmentMap`，僅 WebGPU／WebGL2）：`scene.environment` 以 image-based light 照亮 PBRMaterial，`scene.background` 繪製 skybox；兩者可用同一或不同 map，`environmentIntensity`／`backgroundIntensity`（非負，預設1）縮放，destroyed map視為不存在。Map為不可變2:1 equirect linear radiance（height4..1024、width=2×height）：`fromPixels(w,h,float RGB|RGBA)`、`fromImageData(8-bit sRGB)`、`fromRGBE(hdrBytes)`（Radiance .hdr、flat／RLE、僅-Y +X方向、含邊界檢查）及 `gradient({zenith,horizon,ground,sun?})`。方向u=.5朝−Z，v=0朝+Y。CPU建構一次產生order2 SH irradiance/pi及最多7層half-float mip；level0 sharp，所有rough levels為有界GGX prefilter。Shader採roughness×(mips−1)與數值split-sum積分，目前成本／能量邊界見P122，不沿用歷史cosine-power／解析fit的計時。有environment時PBR不加flat ambientLight，punctual／directional仍加入，TextureMaterial不變。Skybox先畫無depth fullscreen triangle，每pixel反投影兩點，支援perspective／orthographic；取level0，隨3D pass tone-map。GPU copies為renderer-owned cache，unused／destroyed時釋放。Environment rotation、由map產生sun shadow與background blur仍排除；probe projection／capture另有後續契約。Actual browser證據與限制見ACCEPTANCE，不宣稱通用實機pixel parity。
- 原environment基線排除probe projection；P38加入bounded baked `ReflectionProbe` box projection／cubemap-to-equirect（第36節）。後續明示capture APIs另有ownership契約，不是native cube textures／automatic dynamic probes。
- Frustum culling（WebGPU／WebGL2）測試 world-transformed bounding sphere；一般 Geometry 按 version cache，改 vertices 後需 markUpdated。SkinnedMesh 使用含 morph 的 conservative animated bounds（第 42 節）；InstancedMesh／一般 morph mesh 仍不剔除。視錐外 mesh 保持 cache、shadow caster 仍可繪製；frustumCulled=false 關閉剔除。
- Fog（`scene.fog`、`FogSettings`，WebGPU／WebGL2）：預設停用；`enabled`、`mode` 為 `'linear'`（`near`<`far`，覆蓋率 `(d−near)/(far−near)` 並 clamp）或 `'exp2'`（`density`，覆蓋率 `1−exp(−(density·d)²)`），`color` 為顯示用 sRGB 0..1。`d` 是相機位置到片元的世界距離，因此 orthographic 相機也是以徑向距離計算。`TextureMaterial` 與 `PBRMaterial` 皆向 fog color 漸變；漸變作用於 premultiplied 顏色，半透明表面仍保持半透明。只有 post-processing 以 linear HDR 繪製 3D pass 時才把顏色轉為 linear。Skybox、2D overlay 與 Canvas2D 不受 fog 影響。設定可變，每幀驗證。Uniform 區塊見 `src/data/rendering.ts` 的 `FOG_FLOAT_COUNT`。已用 unit tests，以及在 Chromium WebGL2／WebGPU 的 advanced3d 範例切換驗證（無 console errors、遠處幾何明顯變淡）；兩個 backend 的逐像素一致性與其他瀏覽器未驗證。
- 抗鋸齒（`GameOptions.antialias`，預設 `true`）：WebGPU 以 4× multisample 的 color 與 depth texture 繪製 3D pass（color 為 canvas 格式，post-processing 開啟時為 `rgba16float`），結束時 resolve 到 canvas 或 HDR target；shadow pass 與 2D overlay 不做 multisample。WebGL2 把此旗標傳給 `getContext` 的 `antialias`，預設 framebuffer 是否 multisample 由瀏覽器決定；WebGL2 的 post-processing framebuffer 與 Canvas2D 永不 multisample。`false` 則不建立 multisample texture。切換需重建 Game。在 Chromium WebGPU 上，advanced3d 畫面的獨特顏色數由 6194（關）升到 7449（開），與邊緣混色一致；未做逐像素比較，也未量測其他瀏覽器或 GPU 成本。
- Context 遺失復原（`GameOptions.recoverGraphics`，預設 `true`；WebGL2 與 WebGPU）：`ResilientRenderer` 包住 backend。WebGL2 `webglcontextlost`（或 WebGPU `device.lost`）時，Game 送出 `graphicslost`、取消進行中的 transition、略過 frame；WebGL2 等待 `webglcontextrestored`（WebGPU 直接重新要求 device），建立並初始化替換 renderer，重新 prepare 所有仍存活的 Material2D／PostProcessor2D，還原最後尺寸，最後送出 `graphicsrecovered`。Scene、Texture、geometry 都由 CPU 持有，會延遲重新上傳。Renderer 擁有的 handle 不會保留：遺失前的 `RenderTexture2D` target 與 `RenderSnapshot` 必須重建，復原期間需要 GPU 的呼叫（`createRenderTexture`、`prepareTextures`、`captureScene` 等）會拋 `GraphicsError`。替換 renderer 初始化失敗時，Game 收到 `cause` 為該失敗的 `GraphicsError` 並像以前一樣停止；`recoverGraphics: false` 維持舊的 fatal 行為。已用 mock renderer unit tests（兩個 backend）與 Chromium 以 `WEBGL_lose_context` 驗證 WebGL2（連續兩次、含 HDR 路徑）；未在瀏覽器實測真實 WebGPU device loss，Canvas2D 沒有遺失處理。
- WebGL2 還原逾時：若 `webglcontextrestored` 在 `graphicsRecoveryLimits.restoreTimeoutMs`（10 秒，`src/data/rendering.ts`）內沒有到達，復原以 `GraphicsError`（`cause` 說明逾時）失敗，Game 的行為與替換 renderer 無法初始化時相同。還原或 `Game.destroy()` 時計時器會被清除。WebGPU 直接要求新 device，沒有這段等待。
- 場景效果鏈（`scene.effects3D`，WebGPU 與 WebGL2）：由 `PostProcessor2D` descriptor 組成的有序清單，WGSL／GLSL `effect(color, uv, screen)` ABI、uniforms、需先 `await graphics.preparePostProcessor(effect)` 及生命週期規則都與 `effects2D` 相同。效果鏈看到的是完成後、顯示空間、premultiplied 的 RGBA8 3D 影像（網格、skybox，啟用時含 HDR／bloom／tone mapping），其結果在繪製 2D layer 之前取代原影像，所以 sprite 與 HUD 不受處理。有效果鏈的每幀多用兩個全尺寸 RGBA8 target（WebGPU：canvas 格式的來源加上共用的 ping-pong 對；WebGL2：一個 RGBA8 color／depth target 加上 effect target），清空效果鏈或 canvas 改變大小時釋放。WebGPU 的 3D pass 仍做 multisample 並 resolve 到來源；WebGL2 的效果鏈路徑渲染到離屏 target，不做 multisample。Canvas2D 遇非空效果鏈拋 `UnsupportedGraphicsError`。對 Scene 的 `renderToTexture`／`generateTexture` 不套用。已在 Chromium 兩個 backend 以對打光立方體交換紅藍（含與不含 HDR post-processing）並與未處理畫面比較驗證；其他瀏覽器與 2D overlay 互動未測。
- 渲染統計 `game.graphics.stats` 重用一個 `RenderStats`，需保存時請複製欄位。`meshes`／`culled`／`drawCalls`／`triangles`（含 instances）／`shadowDrawCalls` 保持 3D 定義。`frame` 記各 backend 開始的 frames，包含 2D-only。P40 加入每幀 `drawCalls2D`／`instances2D`／`renderPasses2D`／`uploadBytes` 與 resident／lifetime-peak `renderTargetBytes`／`peakRenderTargetBytes`，見第 39 節。Canvas2D 的 3D counters 為零，不是全部 2D paint／target estimate 都零。原 Chromium 3D-only check（4 meshes／1 culled／3 draws／84 triangles）是歷史證據，不作 P40 metrics 驗收。

見 [advanced3d](../examples/advanced3d/) 與 [使用說明](USAGE-zh.md#11-進階-3d)。上述為 WebGPU／WebGL2 的 3D 功能，Canvas2D 仍 2D-only；Chromium 觀察不等於其他瀏覽器認證或 throughput 保證。

### 每 Slot 的 Texture Sampling

TextureMaterial（含 NativeMaterial3D）base sampler 與 PBRMaterial per-slot TextureSamplerOptions 支援 nearest／linear 的 minFilter、magFilter、mipmapFilter；address modes 為 clamp-to-edge／repeat／mirror-repeat；finite LOD clamps 必須 `0 <= lodMinClamp <= lodMaxClamp <= 32`。預設 linear／clamp、anisotropy 1，glTF 使用 repeat；同 image 可有不同 sampler、不重複 ownership。Native mip semantics 見第 42 節。

一般 decoded-image texture 仍只 level zero，沒有自動 general mip generation；EnvironmentMap roughness mips 是專用路徑。

### 程序式材質預設

目前目錄共934種，完整union見[CURRENT.md](CURRENT.md)。下段459種列舉是歷史基底清單，後續種類逐項增補於下文，不代表目前完整union。

Root 匯出 `ProceduralMaterial`、共四百五十九種的 `ProceduralMaterialKind`（`'wood' | 'brick' | 'stone' | 'metal' | 'fabric' | 'marble' | 'concrete' | 'tiles' | 'leather' | 'sand' | 'rust' | 'snow' | 'asphalt' | 'gravel' | 'cobblestone' | 'bark' | 'moss' | 'mud' | 'granite' | 'slate' | 'terrazzo' | 'denim' | 'burlap' | 'carpet' | 'plaster' | 'terracotta' | 'cork' | 'rubber' | 'carbonfiber' | 'diamondplate' | 'paper' | 'wicker' | 'bamboo' | 'hammeredmetal' | 'galvanized' | 'corrugatedmetal' | 'perforatedmetal' | 'expandedmetal' | 'wiremesh' | 'velvet' | 'terrycloth' | 'boucle' | 'geode' | 'quartz' | 'pyrite' | 'shiplap' | 'glassblock' | 'thatch' | 'charredwood' | 'driftwood' | 'peelingpaint' | 'tiretread' | 'honeycomb' | 'frost' | 'stainedglass' | 'soapstone' | 'butcherblock' | 'wallpaper' | 'embroidery' | 'macrame' | 'brickpaving' | 'steppingstone' | 'woodendeck' | 'cheese' | 'sugarfrosting' | 'candleswax' | 'vinylrecord' | 'graphpaper' | 'notebookpaper' | 'lace' | 'crochet' | 'basketweave' | 'zipper' | 'velcro' | 'button' | 'traintracks' | 'manholecover' | 'speedbump' | 'circuitboard' | 'solarpanel' | 'heattile' | 'pianokeys' | 'drumskin' | 'gongsurface' | 'lensarray' | 'prismtape' | 'fresnel' | 'bandage' | 'pillblister' | 'sutures' | 'trellis' | 'terracottapot' | 'hedgerow' | 'collar' | 'petbed' | 'scratchpost' | 'runningtrack' | 'bouldermat' | 'pooltile' | 'envelope' | 'chalkboard' | 'corkboard' | 'snowdrift' | 'icicle' | 'dewdrops' | 'mooncrater' | 'starfield' | 'nebula' | 'pleats' | 'shoelace' | 'tassel' | 'woksurface' | 'cutlery' | 'choppingboard' | 'faucet' | 'showerhead' | 'bathmat' | 'blinds' | 'curtain' | 'shadecloth' | 'sandstone' | 'travertine' | 'pumice' | 'parquet' | 'mosaic' | 'hexagontiles' | 'knit' | 'corduroy' | 'felt' | 'roofshingles' | 'rooftiles' | 'stucco' | 'lichen' | 'leaflitter' | 'endgrain' | 'acousticfoam' | 'closedcellfoam' | 'linoleum' | 'suede' | 'snakeskin' | 'crocodile' | 'herringbone' | 'tweed' | 'seersucker' | 'knurledmetal' | 'engineturned' | 'goldleaf' | 'orangepeel' | 'coconut' | 'watermelon' | 'limestone' | 'breccia' | 'gneiss' | 'plywood' | 'osb' | 'chipboard' | 'wafflecloth' | 'cableknit' | 'quilting' | 'crackleglaze' | 'flutedceramic' | 'encaustictiles' | 'fishscales' | 'tortoiseshell' | 'feathers' | 'reedmat' | 'rope' | 'straw' | 'studdedrubber' | 'groovedrubber' | 'recycledrubber' | 'breadcrust' | 'wafer' | 'chocolate' | 'pretzel' | 'bagel' | 'croissant' | 'butterflywing' | 'beetlewing' | 'spiderweb' | 'cirrus' | 'cumulus' | 'lightning' | 'kelp' | 'seaweed' | 'anemone' | 'candy' | 'marshmallow' | 'nougat' | 'frostedglass' | 'rippledglass' | 'bubbleglass' | 'saddlestitch' | 'tooledleather' | 'patentleather' | 'appleskin' | 'peachskin' | 'grapeskin' | 'broccoli' | 'cabbage' | 'onion' | 'bedsheet' | 'pillow' | 'mattress' | 'tealeaf' | 'matcha' | 'teabag' | 'sanddune' | 'pebblebeach' | 'foamedge' | 'lavaflow' | 'cooledlava' | 'ashfield' | 'stalactite' | 'flowstone' | 'cavefloor' | 'jam' | 'peanutbutter' | 'sprinkles' | 'icecream' | 'popsicle' | 'sorbet' | 'spaghetti' | 'macaroni' | 'lasagna' | 'origami' | 'paperlace' | 'papercut' | 'sunflower' | 'daisy' | 'clover' | 'puzzletile' | 'legobrick' | 'rubberband' | 'haybale' | 'corncrib' | 'fencepost' | 'poolfelt' | 'icesurface' | 'climbingwall' | 'oledpanel' | 'crtscanline' | 'keyboardkey' | 'filmstrip' | 'postagestamp' | 'halftoneprint' | 'radiator' | 'screwhead' | 'chainlink' | 'friedegg' | 'sushirice' | 'chocolatechip' | 'cargomat' | 'dashboardgrain' | 'licenseplate' | 'flowerbed' | 'grassstripe' | 'topiary' | 'confetti' | 'ribbonstreamer' | 'pinatafringe' | 'xylophone' | 'tambourine' | 'castanet' | 'pillcapsule' | 'pilltablet' | 'bathbomb' | 'basketball' | 'tennisball' | 'golfball' | 'boardformedconcrete' | 'ribbedconcrete' | 'splitfaceblock' | 'chainmail' | 'rivetedmetal' | 'weldedmetal' | 'cactus' | 'pinecone' | 'corncob' | 'corrugatedcardboard' | 'creasedpaper' | 'layeredpaper' | 'basalt' | 'scoria' | 'obsidian' | 'malachite' | 'agate' | 'lapislazuli' | 'rice' | 'sesame' | 'coffeebeans' | 'lotusleaf' | 'bananaleaf' | 'fernleaf' | 'braincoral' | 'starcoral' | 'seasponge' | 'houndstooth' | 'tartan' | 'damask' | 'zebrafur' | 'leopardfur' | 'giraffefur' | 'scallopshell' | 'oystershell' | 'nautilusshell' | 'cantaloupe' | 'dragonfruit' | 'kiwiskin' | 'rosepetal' | 'lilypetal' | 'fritillarypetal' | 'birchbark' | 'palmtrunk' | 'sycamorebark' | 'elephanthide' | 'ostrichleather' | 'sharkskin' | 'tactilepaving' | 'roadmarking' | 'draincover' | 'mushroomgills' | 'morel' | 'bracketfungus' | 'pineapple' | 'strawberry' | 'lychee' | 'walnutshell' | 'peanutshell' | 'almondshell' | 'sandpaper' | 'steelwool' | 'wirebrush' | 'cheesegrater' | 'ovenrack' | 'muffintin' | 'gauze' | 'elasticbandage' | 'icepack' | 'bubblewrap' | 'sequin' | 'pennyround' | 'volleyball' | 'bowlingball' | 'rugbyball' | 'wafflecone' | 'donutglaze' | 'brownie' | 'soapbar' | 'loofah' | 'scrubbypad' | 'orangeflesh' | 'kiwiflesh' | 'avocadoflesh' | 'turquoise' | 'rhodonite' | 'tigereye' | 'tatami' | 'flutedwood' | 'subwaytiles' | 'canewebbing' | 'rammedearth' | 'copperpatina' | 'birdseyemaple' | 'breezeblock' | 'basketweavepavers' | 'ripstop' | 'octagondot' | 'truchettiles' | 'standingseam' | 'damascus' | 'windmillpavers' | 'castiron' | 'porphyry' | 'linen' | 'chippedenamel' | 'perforatedleather' | 'argyle' | 'chevronparquet' | 'ginkgoleaf' | 'pressedtin' | 'sashiko' | 'ashlar' | 'gabion' | 'gingham' | 'mossypavers' | 'bamboocrosscut' | 'moire' | 'oakleaf' | 'rhombille' | 'fossillimestone' | 'seigaihatiles' | 'tuftedleather' | 'louveredmetal' | 'herringbonebrick' | 'shibori' | 'scallopedslate' | 'saltpan' | 'dogbonepavers' | 'palmendgrain' | 'asanoha' | 'lotusseedpod' | 'crowncaps' | 'cofferedconcrete' | 'woodworm' | 'calcadawaves' | 'ikat' | 'slottedwood' | 'hollyleaf' | 'englishbond' | 'rebar' | 'starfruit' | 'diamondrustication' | 'bargello' | 'saffiano' | 'cocoamat' | 'suminagashi' | 'vermiculite' | 'cairotiles' | 'guilloche' | 'seaurchintest' | 'crystallineglaze' | 'shirring' | 'sunburstveneer' | 'rakedgravel' | 'flintwall' | 'frenchknots' | 'artichoke' | 'splitlockwashers' | 'flemishbond' | 'satinweave' | 'lotusroot' | 'cardboardedge' | 'hexnuts' | 'orbicularjasper' | 'acornbarnacles' | 'circularpavers' | 'snowflaketiles' | 'sawblades' | 'pistachios' | 'polkadotfabric' | 'cucumberslices' | 'monsteraleaf' | 'crossstitch' | 'staranise' | 'logcabinparquet' | 'countersunkmetal' | 'trilobitefossil' | 'eyeletcotton' | 'dendriticagate' | 'ravioli' | 'rollerchain' | 'mapleleaf' | 'smocking' | 'quatrefoiltile' | 'okraslice' | 'eggcarton' | 'greekkey' | 'seedbeads'`，木材／磚牆／石材／金屬／布料／大理石／混凝土／磁磚／皮革／沙／鏽蝕／雪／瀝青／礫石／鵝卵石鋪面／樹皮／苔蘚／泥土／花崗岩／板岩／磨石子／丹寧布／粗麻布／地毯／石膏／陶土／軟木／橡膠／碳纖維／止滑花紋鋼板／紙張／藤編／竹材／錘紋金屬／鍍鋅板／波紋金屬板／沖孔金屬板／擴張金屬網／金屬絲網／天鵝絨／毛巾布／圈圈紗布／砂岩／洞石／浮石／拼花木地板／馬賽克／六角磚／針織／燈芯絨／毛氈／瀝青屋瓦／陶製屋瓦／粗灰泥／地衣／落葉層／木頭端面／吸音泡棉／閉孔泡棉／油氈地材／麂皮／蛇鱗紋皮革／鱷魚壓紋皮革／人字紋織物／粗花呢／泡泡紗／滾花金屬／魚鱗旋紋金屬／金箔／橘皮／椰殼／西瓜皮／石灰岩／角礫岩／片麻岩／膠合板／定向粒片板／粒片板／華夫格布／麻花針織／菱格絎縫／冰裂釉／直槽陶瓷／嵌彩水泥花磚／魚鱗／龜甲／羽毛／蘆葦蓆／繩索／稻草／圓釘橡膠／溝槽橡膠／再生橡膠／麵包脆皮／威化餅／巧克力／籃球／網球／高爾夫球／木模板清水混凝土／肋紋混凝土／劈面砌塊／鎖子甲／鉚接金屬板／焊接金屬板／仙人掌／松果／玉米穗／瓦楞紙板／摺痕紙／層疊紙／玄武岩／火山渣／黑曜石／孔雀石／瑪瑙／青金石／米粒／芝麻／咖啡豆／荷葉／香蕉葉／蕨葉／腦珊瑚／星珊瑚／海綿／千鳥格／蘇格蘭格紋／花卉提花／斑馬短毛皮紋／豹短毛皮紋／長頸鹿短毛皮紋／扇貝殼／牡蠣殼／鸚鵡螺殼）及 `ProceduralMaterialOptions`（`size?: number; seed?: number; contrast?: number; roughnessBias?: number; repeats?: number; tint?: readonly [number, number, number]`）。`tint` 逐通道乘上原設計的 sRGB 顏料色（各為有限值 0–4）；灰縫色調與 normal、metallic-roughness、occlusion 三張 maps 不變，省略時輸出逐位元組不變。傳入 `workerPool`（`createProceduralWorkerPool()` 建立、執行已發佈 `workers/procedural-material.worker.js` 的借用 `NativeWorkerPool`，或自行以 `procedural.maps` 安裝 `trustedProceduralMapsJob` 的模組）時，生成移出呼叫端執行緒且輸出逐位元組相同；未傳入時維持同步生成。pool 由呼叫者擁有並負責 destroy，貼圖建立仍在主執行緒。呼叫者擁有的 `ProceduralMapCache({ maxBytes?, maxEntries? })`（預設 64 MiB／32 筆，LRU）以 `cache` 傳入時，相同 kind／size／seed／contrast／roughnessBias／tint 會重用已生成的 CPU maps，同時發出的相同請求只生成一次，失敗不快取；每個 preset 仍建立並擁有自己的貼圖，`clear()` 釋放保留的 maps。設定 `heightMap: true` 會額外生成線性 height map（R，0 最低、1 最高）；`createMaterial()` 將其綁為 `opticalMaps.heightTexture`，PBR parallax（`finish.heightScale`）改讀它而非 normal Z。本身不啟用 parallax，納入快取 key 與 worker 傳輸，隨 preset destroy。`await ProceduralMaterial.create(kind, options?)` 在 CPU 一次建立呼叫者擁有、具確定性、可無縫週期重複的不可變影像 maps；size 為整數 32–1024、預設 256，seed 為無號 32-bit 整數 0–4294967295、預設 1。無效 kind／options 拒絕，不需外部素材或 runtime dependency。

種類另支援 `flutedwood`（直槽木飾板）：圓潤縱向木條高於深色凹槽，seeded 木紋與細纖維限制在凸條上；圓冠與底板的一階導數連續。四份週期貼圖為 opaque dielectric（metallic 0），UV tile 為 0.32 m。僅為 normal map、不位移 geometry；options、physical repeats 與貼圖 ownership 不變。

`subwaytiles`（倒角長方磚）提供青綠釉面、錯縫排列、平整磚面與圓滑倒角及粗糙填縫。每張 0.6 m tile 排列兩欄四列，四份 seeded periodic maps 維持 opaque dielectric、metallic 0；僅為 normal map，不新增 geometry、位移或新的 ownership 規則。

`canewebbing`（八角孔藤編）呈現縱橫藤條、雙向斜藤與八角暗凹槽；0.24 m tile 含八乘八單元。使用 `await ProceduralMaterial.create('canewebbing', { seed: 7 })`；四圖為 seeded periodic、opaque dielectric、metallic 0。孔隙只是深色底板與 normal／AO 效果，沒有透明孔洞或 geometry 位移；沿用既有 options、repeats 與資源生命週期。

`rammedearth`（夯土牆）提供八層土色壓實帶、微彎接縫、細砂與凹孔；每張 UV tile 對應 2 m。使用 `await ProceduralMaterial.create('rammedearth', { seed: 7 })`；色層不直接轉成高度階梯，四圖為 seeded periodic、opaque dielectric、metallic 0，僅表面 normal／roughness／AO，不新增 geometry。既有 options、repeats 與 texture ownership 不變。

`copperpatina`（銅綠氧化銅）在 0.5 m tile 內呈現裸銅與青綠氧化斑塊；使用 `await ProceduralMaterial.create('copperpatina', { seed: 7 })`。同一覆蓋場同步控制顏色、metallic、roughness 與淺 relief：裸銅 metallic 1，粗糙氧化層為 0。預設 `material` 與 `createMaterial()` metallic factor 為 1，保留 map 混合金屬度；四張 seeded periodic maps 為 OPAQUE，不新增 geometry 或 shader，既有 options 與 caller ownership 不變。

`birdseyemaple`（鳥眼楓木）提供分散深色眼狀紋、橢圓細環與繞行縱紋；每張 0.24 m tile 含六乘六個 seeded 單元。使用 `await ProceduralMaterial.create('birdseyemaple', { seed: 7 })`。眼狀色彩不形成凸起木節，僅有淺 normal 起伏；四份 periodic maps 為 opaque dielectric、metallic 0，不新增 geometry／shader，options、repeats 與 texture ownership 不變。

`breezeblock`（四葉花孔水泥花磚）提供四葉圓孔輪廓、粗糙水泥框與細填縫；0.8 m tile 含四乘四單元。使用 `await ProceduralMaterial.create('breezeblock', { seed: 7 })`。孔內只是暗色凹槽與 normal／AO 效果，沒有透明孔洞、穿透或 geometry。四份 seeded periodic maps 維持 opaque dielectric、metallic 0；options、repeats 與 texture ownership 不變。

`basketweavepavers`（籃編排列鋪路磚）以兩塊長方黏土磚組成方形單元，相鄰單元交替轉向，含倒角、凹填縫與逐磚色差；0.8 m tile 含四乘四單元、32 塊磚。使用 `await ProceduralMaterial.create('basketweavepavers', { seed: 7 })`。四份 seeded periodic maps 維持 opaque dielectric、metallic 0；僅為 shading／normal map，options、repeats 與 texture ownership 不變。

`ripstop`（防撕裂尼龍布）將細經緯織紋與成對補強線分開建模，0.04 m tile 含四乘四補強格。使用 `await ProceduralMaterial.create('ripstop', { seed: 7 })`。四份 seeded periodic maps 維持 opaque dielectric、metallic 0；僅為外觀與 normal map，不新增織物 geometry 或抗撕裂物理，options、repeats 與 texture ownership 不變。

`octagondot`（八角菱形拼磚）以白色八角主磚搭配等高的深色菱形嵌磚，包含平滑倒角與粗糙凹填縫；0.8 m tile 含四乘四主磚。使用 `await ProceduralMaterial.create('octagondot', { seed: 7 })`。四份 seeded periodic maps 維持 opaque dielectric、metallic 0；僅為 shading／normal map，options、repeats 與 texture ownership 不變。

`truchettiles`（Truchet 雙弧線花磚）以 seeded 旋轉的相對角雙弧組成曲線拼圖，弧線在各邊中點對接；0.8 m tile 含四乘四釉面方磚，色釉不隆起。使用 `await ProceduralMaterial.create('truchettiles', { seed: 7 })`。四份 seeded periodic maps 維持 opaque dielectric、metallic 0；僅為 shading／normal map，options、repeats 與 texture ownership 不變。

`standingseam`（立縫金屬屋面）提供寬平板、窄立縫平頂與兩側凹腳，區別於連續波浪形浪板；2 m tile 含四片板。使用 `await ProceduralMaterial.create('standingseam', { seed: 7 })`。四份 seeded periodic maps 維持 opaque，metallic B 通道與預設 factor 均為 1，代表無塗漆金屬。僅為 shading／normal map，不新增 geometry；options、repeats 與 texture ownership 不變。

`damascus`（大馬士革鋼）以細密層疊紋與 seeded 局部眼狀折紋呈現蝕刻鋼面，暗層較粗糙、略低；0.12 m tile，起伏很淺而非厚浮雕。使用 `await ProceduralMaterial.create('damascus', { seed: 7 })`。四份 seeded periodic maps 維持 opaque，metallic B 通道與預設 factor 均為 1；不新增 geometry 或 BRDF，options、repeats 與 texture ownership 不變。

`windmillpavers`（風車拼鋪路磚）由四片二比一長磚圍繞等高深色方磚，具有平滑倒角、凹填縫與 seeded 細粒色差；0.9 m tile 包含四組風車、20 塊磚。使用 `await ProceduralMaterial.create('windmillpavers', { seed: 7 })`。四圖 opaque dielectric、metallic 0，不新增 geometry 或 shader；options、repeats 與 texture ownership 不變。

`castiron`（粗鑄鐵）以細顆粒鑄造肌理與少量 seeded 凹孔呈現粗鑄表面，孔洞較暗、粗糙且低於基面，而非大片重疊槌印。0.1 m tile，使用 `await ProceduralMaterial.create('castiron', { seed: 7 })`。四圖 opaque、metallic B 通道與預設 factor 均為 1，代表未上漆未氧化的金屬；未新增 geometry、shader 或氧化膜模擬，options、repeats 與 texture ownership 不變。

`porphyry`（拋光斑岩）在紫紅細粒基質中嵌入 seeded 淺色長石斑晶；長矩形晶粒具不同朝向，較平滑且與基面齊平，不是凸起碎石。0.3 m tile，使用 `await ProceduralMaterial.create('porphyry', { seed: 7 })`。四圖 opaque dielectric、metallic 0，不新增 geometry 或 shader；options、repeats 與 texture ownership 不變。

`linen`（竹節亞麻布）以沿長度自然變粗變細的 seeded 經緯紗線、平滑交替纖維覆蓋與隆起交點形成平織結構。0.04 m tile 含 16×16 交點，使用 `await ProceduralMaterial.create('linen', { seed: 7 })`。紗隙是粗糙不透明凹隙，不是 alpha 孔洞；四圖 opaque dielectric、metallic 0，不新增 geometry、shader 或透光模型，options、repeats 與 texture ownership 不變。

`chippedenamel`（缺角琺瑯）以光滑象牙白非金屬釉層覆蓋較粗糙金屬基材，seeded 不規則缺角露出較暗、較低的金屬，沒有油漆捲邊。0.25 m tile，使用 `await ProceduralMaterial.create('chippedenamel', { seed: 7 })`。完整釉層 metallic B=0、裸露金屬 B=255，預設 factor 1 保留混合 map；四圖 opaque，不新增 geometry 或 shader，options、repeats 與 texture ownership 不變。

`perforatedleather`（透氣孔座椅皮革）結合 seeded 棕褐細粒皮面與 8×8 錯列圓孔，每張 tile 為 0.04 m。圓潤孔壁下降至深色粗糙不透明內襯，不帶羽管毛囊隆環。使用 `await ProceduralMaterial.create('perforatedleather', { seed: 7 })`；四圖 periodic opaque dielectric、metallic 0，僅 normal／AO shading，並非透明孔洞或 geometry。options、repeats 與 texture ownership 不變。

`argyle`（Argyle 菱格布）在交替酒紅／玫瑰菱形上疊加穿越中心的細斜線，seeded 細粒與平織經緯紗線獨立提供起伏，印花邊界不隆起也不是填縫。使用 `await ProceduralMaterial.create('argyle', { seed: 7 })`，每張 tile 為 0.16 m。四圖 periodic opaque dielectric、metallic 0；不新增 geometry 或 shader，options、repeats 與 texture ownership 不變。

`chevronparquet`（Chevron 斜接木地板）以相反 45° 木板斜接形成 V 字，包含 seeded 逐板色差、沿板長木紋、平滑倒角與凹接縫，區別於籃編拼花。使用 `await ProceduralMaterial.create('chevronparquet', { seed: 7 })`，每張 tile 為 0.6 m。四圖 periodic opaque dielectric、metallic 0；起伏僅 normal mapping，geometry、options、repeats 與 texture ownership 不變。

`ginkgoleaf`（金黃銀杏葉）呈現 seeded 朝向與色差的金黃扇形葉片、中央缺口、細葉柄與放射葉脈，葉間為深色不透明底層。使用 `await ProceduralMaterial.create('ginkgoleaf', { seed: 7 })`，每張 tile 為 0.24 m。四圖 periodic opaque dielectric、metallic 0；不新增葉片 geometry、alpha cutout 或透光模型，options、repeats 與 texture ownership 不變。

`pressedtin` 是 0.6 m tile 的壓花錫板：四個方框包住四瓣花飾與中央凸鈕，平滑凸紋接回 seeded 細粒金屬板面。它不是隨機錘痕；四圖皆 opaque，metallic map 與預設 factor 為 1，不增加 geometry 或 renderer 能力。

`sashiko` 是 0.064 m tile 的靛藍刺子繡布：米白凸起針腳沿兩個軸交替出現，每行／列由 seed 決定相位，格線交點與針腳之間露出深靛藍平織底布。不是印花或連續補強線；四圖 opaque dielectric、metallic 0，不增加 geometry 或 renderer 能力。

`ashlar` 是 1.2 m tile 的模組拼砌石材：十一塊不同長寬的矩形石塊具有逐塊 seeded 色差、礦物顆粒、平滑倒角及 T 字凹縫。石塊內部模組格線不會變成接縫，區別於等尺寸錯縫磚。四圖 opaque dielectric、metallic 0，不增加 geometry 或 renderer 能力。

`gabion` 是 0.4 m tile 的鋼網石籠表面：方格鋼線位於 seeded 大小、朝向及色差的圓石前方，線網較平滑，石間是深色不透明底層。四圖 opaque，metallic B 在線網為 1、石材為 0，預設 metallic factor 為 1；不是可穿透的石籠 geometry，不增加 renderer 能力。

`gingham` 是 0.08 m tile 的藍白平織格布：等寬經緯色帶形成亮格、深格與混色格，混色格內逐紗交替露出藍紗與白紗，不是平塗中間色。凹凸僅來自織紋與 seeded 纖維細粒，色塊不抬升。四圖 opaque dielectric、metallic 0，不增加 geometry 或 renderer 能力。

`mossypavers` 是倒角灰色鋪路石與接縫內局部生長的綠色苔蘚；苔蘚比裸縫高、比石冠低且更粗糙，石面保留中性色差，不將整面染綠。0.8 m tile、四圖 opaque dielectric，沿用既有 options 與生命週期。

`bamboocrosscut` 呈現竹筒橫切的淡色環狀竹壁、深色中空底層與較平滑的外皮；每筒直徑與壁厚有 seeded 差異，切面有細孔而沒有木材年輪。0.24 m tile、四圖 opaque dielectric；中空只是深色不透明底層，不是可穿透 geometry，沿用既有 options 與生命週期。

`moire` 是紫色水波紋絲緞，平滑低頻水波改變色澤及 roughness，只有細紗改變 height／AO，不把大波紋做成浮雕。0.08 m tile、四圖 opaque dielectric；這是烘入貼圖的外觀近似，不新增繞射、視角相關變色或 anisotropic BRDF，沿用既有 options 與生命週期。

`oakleaf` 呈現 seeded 旋轉及色差的綠色橡樹葉，長葉片有成對圓裂與深缺刻、中肋、分枝葉脈及短葉柄，區別於扇形銀杏葉。0.3 m tile、四圖 opaque dielectric；葉間是深色不透明底層，不新增 cutout geometry，沿用既有 options 與生命週期。

`rhombille` 以三種明暗的四邊菱形磚組成方塊錯視，每組三片共享接點，倒角與中性灰縫將磚片分開。磚面維持同高，不將錯視方塊做成立體高低面。0.9 m tile、四圖 opaque dielectric，沿用既有 options 與生命週期。

`fossillimestone` 是拋光螺旋化石石灰岩：米褐色基質內嵌 seeded 尺寸、壓扁方向及旋轉相位的螺旋化石切面，淺色螺旋壁與細隔板分開暗色礦物填充腔室。化石與基質共面，只有細石粒微起伏，不沿螺旋或外緣隆起，也不使用完整鸚鵡螺殼的立體表面；0.6 m tile、四圖 opaque、metallic 0，沿用既有借用及銷毀契約。

`seigaihatiles` 是藍白青海波花磚：交錯排列的多重象牙白波弧印在藍色釉面，波組帶 seeded 色差，前列遮住後列下方弧線，獨立方磚倒角及中性灰縫分隔表面。波弧是共面色料，不是隆起的管線；0.6 m tile、四圖 opaque、metallic 0，沿用既有借用及銷毀契約。

`tuftedleather` 是深棕色菱形拉扣皮革：鼓起的菱形墊面、交叉壓褶、凹下的拉扣口袋與包皮圓扣。圓扣高於周圍口袋、低於墊面最高點；seeded 細皮紋及磨耗色差覆蓋表面，不套用 quilting 的織線，也不將皮扣設為金屬。0.8 m tile、四圖 opaque、metallic 0，沿用既有借用及銷毀契約。

`louveredmetal` 是沖壓百葉金屬板：每個葉片兩端接回板面，上端平滑抬升至較高的下緣，下緣之後是暗色凹槽及不透明背板；不是無限延伸的波紋或對稱圓管。seeded 細金屬粒紋、0.6 m tile、四圖 opaque，metallic B 通道與預設 factor 都為 1；沒有真實穿孔、透明或新增 geometry，沿用既有借用及銷毀契約。

`herringbonebrick` 是人字拼紅磚鋪面：2:1 長磚沿對角帶交替橫放與直放，彼此咬合成 T 形接點；每塊磚有 seeded 燒製色差與細粒表面、倒角及中性灰縫。長磚跨越內部格線而不產生假磚縫，不是 running-bond 或織物 herringbone；1.2 m tile、四圖 opaque、metallic 0，沿用既有借用及銷毀契約。

`shibori` 是靛藍絞染棉布：深藍底上的雙層淡色防染環帶具有 seeded 不規則暈邊與放射狀綁染痕跡，中心及環帶間保留靛藍。染色只改 pigment，不把環帶做成浮雕；下方為獨立平織 relief 與細粒。0.24 m tile、四圖 opaque、metallic 0，沿用既有借用及銷毀契約。

`scallopedslate` 是錯列搭接的圓尾板岩屋瓦：上列圓尾覆蓋下列，弧形下緣抬高並在下方形成凹入陰影；seeded 板岩色差、細粒與層理延續至瓦面。三列由下而上合成保留 row wrap 的相同搭接關係，不是圓弧色塊或普通直尾屋瓦。1.2 m tile、四圖 opaque、metallic 0，只以貼圖表現搭接、不增加 geometry，沿用既有借用及銷毀契約。

`saltpan` 是蒸發鹽灘結晶殼：seeded 不規則多邊形內部較低，連通的淡白鹽脊高於內部並較粗糙；細粒及細小結晶覆蓋表面。共用半平面分界與平滑肩部保留角落及 wrap 連續性，與向下凹陷的乾泥裂縫／釉面開片不同。3 m tile、四圖 opaque、metallic 0，不增加 geometry，沿用既有借用及銷毀契約。

`dogbonepavers` 是狗骨形互鎖混凝土鋪路磚：寬端透過窄腰連成完整磚體，相鄰欄錯半塊磚後，寬端填入對方腰部凹口；平滑肩部、倒角、中性灰縫與 seeded 色差／骨材／細粒。這是真正互補拼合的輪廓，不是矩形磚上的圖案或孤立狗骨色塊。0.8 m tile、四圖 opaque、metallic 0，沿用既有借用及銷毀契約。

`palmendgrain` 是棕櫚木橫切面：淡金棕色基質中分布 seeded 位移／旋轉／長短軸的深色維管束，纖維束與基質切面平齊，成對導管孔才局部下凹。沒有年輪、凸起木節或竹筒空心；細粒與基質色差為獨立週期場。0.024 m tile、四圖 opaque、metallic 0，沿用既有借用及銷毀契約。

`asanoha` 是酒紅底象牙色麻葉紋布料：三向三角格線與每個三角形內的三支線連成幾何葉紋，格線的平滑實色區覆蓋三角形 ownership 邊界。印花只改顏色，不增加浮雕；獨立平織紋與 seeded 細粒控制高度、粗糙度與 AO。0.12 m tile、四圖 opaque、metallic 0，沿用既有借用及銷毀契約。

`lotusseedpod` 是乾燥蓮蓬表面：棕色蓬面內分布中央與環列的七個 seeded 凹室，帶隆起孔緣，較光滑的蓮子從室底凸出但仍低於蓬面。各蓬大小、凹室位置／孔徑及細粒有可重現變化；蓬間暗部與凹室皆有不透明底，不是實際切孔。0.3 m tile、四圖 opaque、metallic 0，沿用既有借用及銷毀契約。

`crowncaps` 是金屬皇冠瓶蓋：平頂外側有隆起捲邊與下降裙邊，每蓋二十一道 seeded 旋轉壓褶同時改變外輪廓及裙邊高度，細粒不破壞平頂。角向起伏限制在裙邊，中心沒有角度奇點；蓋間暗部仍為 opaque 金屬底。0.112 m tile、四圖 opaque、metallic B 255 且材質 factor 1，沿用既有借用及銷毀契約。

`cofferedconcrete` 是井字混凝土樓板：連續平頂交叉肋梁包圍九個平底方形凹室，斜壁平滑接回肋梁，牆角使用平滑乘積而非有尖脊的 max。seeded 骨材、細粒與淺氣孔不改變主要層次；凹室底有較低 AO。2.4 m tile、四圖 opaque dielectric、metallic 0，僅 normal mapping、不新增 geometry，沿用既有借用及銷毀契約。

`woodworm` 是蟲蝕木材：縱向木紋上有 seeded 旋轉與彎曲幅度的有限長蟲道，兩端圓形出孔比蟲道更深；暗部有底，不使用 alpha 切孔。平滑聯集處理蟲道與出孔交會，compact support 限制在各 cell 內，細粒與木纖維用 cached noise。0.16 m tile、四圖 opaque dielectric、metallic 0，僅 normal mapping、不新增 geometry，沿用既有借用及銷毀契約。

`calcadawaves` 是葡式黑白波浪石鋪面：二百五十六顆倒角小石塊各自保持黑色或白色，由整顆石材排列形成起伏波帶，而不是在石面上跨縫印花。色帶不影響高度、粗糙度或 AO；seeded 細粒與骨材保留微表面差異，灰色低接縫隔開石塊。1.28 m tile、四圖 opaque dielectric、metallic 0，僅 normal mapping、不新增 geometry，沿用既有借用及銷毀契約。

`ikat` 是經紗絣織布：深靛藍底的淺色菱形染紋，沿經紗方向的 seeded 對位偏移形成毛邊，且同一束經紗的偏移在各列重複。染紋只有色彩變化，獨立六十四線平織紋決定高度／粗糙度／AO，不把染色菱形凸起成浮雕；柔化尖角避免染紋導數尖點。0.16 m tile、四圖 opaque dielectric、metallic 0，沿用既有借用及銷毀契約。

`slottedwood` 是圓端開槽木飾板：三十二條有限長膠囊形槽逐列錯開半格，槽側及圓端平滑接回完整木面，槽間保留木橋。距離先校正長方形格距比例，使方形 UV tile 上的槽端保持圓形；縱向 seeded 木紋只在木面，槽底是較粗糙的暗色 opaque backing。0.8 m tile、四圖 opaque dielectric、metallic 0；僅表面 normal mapping，不新增切孔 geometry 或聲學模擬，沿用既有借用及銷毀契約。

`hollyleaf` 是 seeded 旋轉的深綠亮面冬青葉：橢圓葉身接三對尖刺與尖葉端，凹缺口保留暗底，較低葉柄和凸起主／側脈構成高度差。平滑 compact 支撐保持葉緣與尖端導數連續，與圓裂橡葉區分。0.24 m tile、四圖 opaque dielectric、metallic 0；不是植物 geometry 或透明裁切，借用／銷毀契約不變。

`englishbond` 是短端磚列與兩倍寬長面磚列交替的英式砌磚。長面磚接縫對齊相鄰短端磚中央；四十八塊 seeded 紅棕磚的灰縫與倒角以同一實際尺度計算，平滑角落與較低灰縫分離各磚，細粒僅在磚面。0.8 m tile、四圖 opaque dielectric、metallic 0；不是砌體 geometry 或結構模擬，借用／銷毀契約不變。

`rebar` 是四支圓弧鋼筋，每支十二道隆起斜向軋肋，相鄰肋紋方向相反。圓截面在側邊平滑接回較低暗色金屬底，seeded 細粒不掩蓋肋頂／肋間高度差。0.12 m tile、四圖 opaque、metallic B 255／材質 factor 1；不是鋼筋 geometry 或結構模擬，借用／銷毀契約不變。

`starfruit` 是九片 seeded 旋轉的五角楊桃切片：金黃外緣、平整淺黃果肉、五個放射狀橢圓籽腔，籽腔較暗／低／粗糙。五角外緣與籽腔平滑接合，中央區域不受 polar 角度影響。0.18 m tile、四圖 opaque dielectric、metallic 0；不是果肉 geometry、透明度或次表面散射，借用／銷毀契約不變。

`diamondrustication` 是十六塊鑽尖式石砌凸飾：四面近似平面斜坡匯向中央尖頂與對角稜線，凸飾底部平滑接到獨立平整石框，再經外倒角下降至灰縫。seeded 石色／細粒保留尖頂、平框與灰縫三層。1.6 m tile、四圖 opaque dielectric、metallic 0；不是石砌 geometry，借用／銷毀契約不變。

`bargello` 是紫色深淺火焰針繡：三十二欄長直針腳逐欄錯開四分之一針長，階梯上升／下降形成四階色帶。每針有圓冠、縱向細纖維與平滑降至暗底的側邊／端部；色階不另外改變針腳高度。0.064 m tile、四圖 opaque dielectric、metallic 0；不是線材 geometry，借用／銷毀契約不變。

`saffiano` 是棕色十字壓紋皮革：兩組細斜槽低於、暗於且粗糙於紋間皮面。平滑聯集讓交點與單槽共用同一壓紋深度，不產生雙倍深坑；seeded 微粒保留細緻皮面。0.032 m tile、四圖 opaque dielectric、metallic 0；不新增皮革 geometry 或 BRDF，借用／銷毀契約不變。

`cocoamat` 是椰纖門墊：八乘八區域各四根 seeded 旋轉短彎纖維，在 wrapped 鄰域交疊並以平滑聯集合成圓冠；側邊與端部平滑降至暗底，纖維間保留粗糙陰影。0.08 m tile、四圖 opaque dielectric、metallic 0；不是直稻草或規則地毯絨簇，不新增纖維 geometry，借用／銷毀契約不變。

`suminagashi` 是墨流し紋紙：seeded 雙軸 domain warp 與平滑等值色帶形成套疊炭黑墨紋及暖白留紙。墨色僅改變顏色／粗糙度；高度來自獨立紙面細粒／纖維，AO 保持平紙面，不把墨線刻成溝槽。0.24 m tile、四圖 opaque dielectric、metallic 0；不新增流體模擬或紙張 geometry，借用／銷毀契約不變。

`vermiculite` 是膨脹蛭石：交錯排列的三十六顆 seeded 旋轉細長金棕色顆粒具有手風琴狀層片。層脊較高／亮／平滑，層隙較低／暗／粗糙；層脊同時擴張側緣，而非印上條紋，顆粒間保留低暗底。0.06 m tile、四圖 opaque dielectric、metallic 0；不新增礦物 geometry 或膨脹模擬，借用／銷毀契約不變。

`cairotiles` 是真正的 Cairo 五邊形鋪磚：三十二塊等形磚以交替鏡射／旋轉鋪滿平面，每塊兩個直角、三個 120 度角，形成四向及三向接縫。五邊使用相同實體寬度的灰縫與平滑倒角，seeded 暖褐色差不影響磚面高度；不是方磚上的印花。0.8 m tile、四圖 opaque dielectric、metallic 0；不新增鋪磚 geometry，借用／銷毀契約不變。

`guilloche` 是銀色金屬的 Guilloché 花紋雕刻：四組 seeded 旋轉、三圈套疊的閉合八瓣刻線，刻槽低於／暗於／粗糙於完整金屬平面。所有刻槽避開 polar 中心及 cell 邊界，不產生極點或接縫。0.1 m tile、四圖 opaque、metallic B 全 255／factory factor 1；不是圓形磨紋或凸起壓花，不新增刻線 geometry，借用／銷毀契約不變。

`seaurchintest` 是九枚 seeded 旋轉的象牙色海膽殼：微凸殼面具有五放射雙孔列、頂端凹孔與間輻凸瘤。五十個成對小孔低於／暗於／粗糙於殼面；殼緣平滑降至暗底。0.24 m tile、四圖 opaque dielectric、metallic 0；孔洞不透明，不新增殼體 geometry，借用／銷毀契約不變。

`crystallineglaze` 是藍綠色結晶釉陶瓷：十六組 seeded 晶花具有放射針晶、生長色帶與不規則邊緣。晶花只改變顏色／粗糙度，獨立釉面細粒決定高度，AO 保持平面；不是霜晶浮雕。0.16 m tile、四圖 opaque dielectric、metallic 0，不新增晶體 geometry 或窯燒模擬，借用／銷毀契約不變。

`shirring` 是粉紫色抽褶布料：四排橫向彈性縫線壓低二十四道細褶，行間褶冠隆起且略微彎移，每排保留四十八段短針腳與細織紋。0.12 m tile、四圖 opaque dielectric、metallic 0；不是直褶、泡泡紗色條或菱格絎縫，不新增布料 geometry／彈性模擬，借用／銷毀契約不變。

`sunburstveneer` 是日芒拼花木皮：四組圓形拼花各有十二片扇形木皮，細長木紋隨各片放射方向旋轉。中央木塞、扇片與外側深色木板嵌平，窄拼縫才凹陷／變暗／提高粗糙度。0.8 m tile、四圖 opaque dielectric、metallic 0；不是端面年輪或抬高圓盤，不新增木片 geometry，借用／銷毀契約不變。

`rakedgravel` 是枯山水耙紋礫石：八道平行耙溝具有平底、圓滑溝肩與隆起溝岸；溝底及岸面皆保留 seeded 細礫石的獨立凸面及暗隙，不以細砂正弦波紋代替石粒。0.8 m tile、四圖 opaque dielectric、metallic 0，不新增石粒 geometry 或耙動模擬，借用／銷毀契約不變。

`flintwall`（燧石砌牆）以六乘六交錯角狀石塊呈現深色敲裂石心、偏心弧形斷口紋、較粗糙的淺色白堊外皮及下凹灰漿縫。seed 固定各石塊旋轉、輪廓與色調；石面不做鵝卵石圓頂，白堊皮不是金屬鍍層。1.2 m tile、四圖 opaque、metallic 0，沿用借用／destroy 契約，不新增砌石 geometry。

`frenchknots`（法式結粒刺繡）在米色織布上配置六乘六粉紅色小結，雙圈微擾動繞線凸紋環繞閉合中央凹點；seed 固定位置、橢圓旋轉與相位，獨立細織紋保留底布質感。不是長緞繡針腳或圈圈紗的連續紗線，凹點不穿透底布。0.06 m tile、四圖 opaque、metallic 0，沿用借用／destroy 契約，不新增刺繡 geometry／針線模擬。

`artichoke`（朝鮮薊苞片）以六乘六交錯覆疊的綠色苞片，呈現寬根部、漸縮抬起的尖端、中央主脈與三對斜向細葉脈。seed 固定葉片色調與微粒，覆疊邊緣保留細 AO 陰影；不是木質平截松果鱗片或果皮上稀疏的火龍果突片。0.18 m tile、四圖 opaque、metallic 0，沿用借用／destroy 契約，不新增葉片 geometry。

`splitlockwashers`（開口彈簧墊圈）配置四乘四 seeded 旋轉開口環，環面沿圈漸升，切口兩端高低分離，內外圓緣有窄倒角。中心孔、缺口與外側露出同一低鋼板底面，不是透明孔洞；不是閉合鎖子甲環或實心瓶蓋。0.08 m tile、四圖 opaque，底板與墊圈的 metallic 通道及 factory factor 都是 1，沿用借用／destroy 契約，不新增墊圈 geometry／彈簧模擬。

`flemishbond`（佛蘭德式磚砌）在十六層磚列中，每層交替四組深色短磚頭與雙寬長磚面，相鄰列錯位讓短磚頭對齊長磚面中心，共一百二十八塊磚。水平／垂直灰縫與倒角保持相同實體寬度；seed 固定各磚色調與表面微粒／骨材，兩種朝向不額外改變嵌平高度。不同於每層只有單一磚向的英式磚砌。1.2 m tile、四圖 opaque、metallic 0，沿用借用／destroy 契約，不新增砌磚 geometry。

`satinweave`（五枚經面緞紋）以二十五乘二十五經緯交叉點呈現四跨一壓的長經浮線，孤立緯線露點逐列錯開兩根線，交織處交換上下層高度與粗糙度，seed 固定細纖維相位與微粒。不同於平紋的一上一下或連續斜紋；光澤仍由既有 roughness／normal maps 表現，不新增各向異性 BRDF。0.02 m tile、四圖 opaque、metallic 0，沿用借用／destroy 契約，不新增布料 geometry。

`lotusroot`（蓮藕切面）以三乘三淡色肉質圓片、薄褐皮、八條放射狀長橢圓氣孔及中央小孔組成，seed 決定切面旋轉與氣孔長短軸。孔間肉質與皮緣嵌平，氣孔低於肉質且沒有蓮蓬式種子或隆起孔環。0.24 m tile、四圖 opaque、metallic 0；孔底與片外空隙使用低暗底面，不是 alpha holes，不新增切面 geometry，沿用借用／destroy 契約。

`cardboardedge`（瓦楞紙板切邊）呈現六層切面，各四週期波浪芯紙連接上下平面紙層，seed 決定逐層波相與紙漿細紋。芯紙與 liner 共用嵌平切面，接點不疊高，中空腔為低暗底面；不同於 `corrugatedcardboard` 的正面起伏。0.024 m tile、四圖 opaque、metallic 0，不新增紙板 geometry／透明孔洞，沿用借用／destroy 契約。

`hexnuts`（六角螺帽）以四乘四 seeded 旋轉六角面、六條直外緣倒角、獨立圓形凹孔及細密同心加工紋組成。六角角部伸出直邊半徑之外，孔底與外側露出同一低鋼板底面；不是圓形墊圈或十字螺絲頭，加工紋不代表螺旋牙。0.08 m tile、四圖 opaque、全 metallic 通道與 factory factor 1，不新增螺帽 geometry／alpha holes，沿用借用／destroy 契約。

`orbicularjasper`（球紋碧玉）在綠色基質中呈現二十五個獨立球紋，seed 決定中心位置、半徑及三／四層淺色礦物環。球紋不是連通色帶或晶洞：色環只改變 color／roughness，拋光 height 僅含獨立微粒、AO 固定 1。0.12 m tile、四圖 opaque、metallic 0，不新增礦石 geometry，沿用借用／destroy 契約。

`acornbarnacles`（橡實藤壺殼）呈現四乘四 seeded 旋轉殼體、六片放射板縫、四十八條細肋及中央菱形凹口。殼壁由寬底向內收高，深孔低於殼緣；不同於海膽的五列雙孔或珊瑚圓形隔板孔。0.12 m tile、四圖 opaque、metallic 0，孔底與殼外維持低暗底面，不新增藤壺 geometry／alpha holes／生物動畫，沿用借用／destroy 契約。

`circularpavers`（同心環狀鋪石）由二乘二圓形拼花構成，各有中心圓石與四圈 8／16／24／32 塊楔形石，共三百二十四塊。交替環圈偏移半個扇區；seed 控制各拼花旋轉與石色。圓弧與徑向直縫使用相同實體灰縫／倒角寬度，石面嵌平。1.6 m tile、四圖 opaque、metallic 0，不新增鋪石 geometry，沿用借用／destroy 契約。

`snowflaketiles`（雪花陶磚）由四乘四藍釉方磚構成，各有 seeded 旋轉的六向雪花，每臂兩對斜分枝。白色釉彩只影響 color／roughness，磚面保持嵌平，normal／AO 只反映方形灰縫與微粒。0.8 m tile、四圖 opaque、metallic 0，不新增雪晶 geometry／透明效果，沿用借用／destroy 契約。

`sawblades`（圓鋸片）由四乘四 seeded 旋轉薄金屬片構成，各有二十四枚長背／短前緣的非對稱齒、凹入齒谷與中央圓形軸孔。片面保持平整並有細密同心加工紋；孔底與片外為同一低金屬底板。0.8 m tile、四圖 opaque、全 metallic 通道及 factory factor 1，不新增鋸片 geometry／透明孔洞／旋轉動畫，沿用借用／destroy 契約。

`pistachios`（開口開心果）由五乘五 seeded 旋轉長橢圓果殼構成，淡色雙瓣殼緣高於綠色果仁，果仁兩側另有更低的暗隙；殼面具有細長纖維，片外為低暗底面。0.15 m tile、四圖 opaque、metallic 0，不新增果殼 geometry／透明開口，沿用借用／destroy 契約。

`polkadotfabric`（圓點印花布）在藍色平織底布上配置六乘六米白圓點，相鄰列錯開半格，seed 控制印花平移與微粒。圓點只影響 color／roughness，底下九十六經緯線的高度與 AO 不受圖案邊緣影響。0.12 m tile、四圖 opaque、metallic 0，不新增珠點 geometry／透明網孔，沿用借用／destroy 契約。

`cucumberslices`（小黃瓜切片）由三乘三 seeded 旋轉圓切片構成，深綠外皮包圍淡色果肉，三組放射狀種子腔各含三顆淡色長籽。果肉、膠質、籽與皮緣保持同一平齊切面，只有顏色／粗糙度不同，不產生空氣孔洞或凸籽。0.18 m tile、四圖 opaque、metallic 0，不新增切片 geometry／透明果肉，沿用借用／destroy 契約。

`monsteraleaf`（龜背芋葉）由三乘三 seeded 旋轉闊葉構成，各有六個閉合長孔、六條通向葉緣的裂口、基部凹口、中肋及斜向側脈。葉內孔與葉緣裂口之間保留葉肉橋，孔底及葉外皆為同一低暗底面。0.9 m tile、四圖 opaque、metallic 0，不新增透明孔洞／葉片 geometry／生長動畫，沿用借用／destroy 契約。

`crossstitch` 在織布上排列八乘八凸起 X 繡針，每個 X 由兩條有限長斜向繡線組成，具有圓滑橫截面與平滑收尾；上層線固定遮住下層線，交點不疊加兩條線的高度。Seeded 線色與細纖維搭配底布組織。0.08 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變，不新增繡線 geometry 或穿布孔洞。

`staranise` 排列九個 seeded 旋轉八角，每個有八個尖端木質果莢、凹下的莢腔與較光滑的種子。莢壁高於種子，種子高於腔底，放射莢之間露出低暗底面。0.12 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變，不新增果莢 geometry 或透明間隙。

`logcabinparquet` 由四個方形拼木區塊組成，每區有中央方板與八條逐漸加長、以平接端頭繞行的螺旋木條。木紋沿各板長軸延伸，內部 lookup cell 邊界不形成多餘接縫；平坦板面以窄凹縫及平滑倒角分隔。1.2 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變，不新增板材 geometry。

`countersunkmetal` 在平坦金屬板上排列六乘六深圓孔，每孔有陡峭內壁與較寬錐形沉孔；錐面中段維持直線斜率，兩端平滑接合，細拉絲紋不掩蓋輪廓。0.3 m tile、四圖 opaque、整張 metallic B 通道及材質 factor 皆為 1，包含孔內低底面。既有借用／destroy 契約不變，不新增透明孔洞或切削 geometry。

`trilobitefossil` 在較淺石質底面排列九個 seeded 旋轉三葉蟲低浮雕。寬頭甲帶成對眼部，凸起軸葉連接頭與較窄尾甲，十對彎曲胸肋以凹槽分隔。盾甲重疊與胸節端部採 compact supports，維持平滑週期表面。0.45 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變，不新增化石 geometry 或特定物種科學復原。

`eyeletcotton` 在象牙白織布上排列六乘六暗圓孔，每孔周圍有連續凸起繡邊與十六個 seeded 放射狀針腳；針腳之間的繡邊谷部仍高於底布。0.06 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變。孔洞保留低 opaque 底面而非透明裁切，不新增線材或孔洞 geometry。

`dendriticagate` 在暖色淺瑪瑙拋光面內嵌九組 seeded 樹枝狀礦物包裹體。五代二叉分枝逐漸變細，不帶葉片或凸起剪影。0.15 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變；色彩包裹體不添加枝狀 normal、roughness 或 AO 溝脊。這是風格化礦紋，不是地質生長模擬。

`ravioli` 形成十六個金黃色方餃麵皮包，中央餡料輪廓帶 seeded 微偏移，周圍是扁平封邊、每片二十道叉壓凹槽與微波浪切邊。中央鼓包高於封邊，叉痕只壓低外圍。0.16 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變；不新增麵皮 geometry、內餡或烹調模擬。

`rollerchain` 呈現四列錯位滾子鏈側片，每列六節。束腰鏈片交替呈現低內片與高外片，共用圓銷軸，帶凹入環槽與微凸鉚釘頭。0.24 m tile、四圖 opaque，整張 metallic B 通道及材質 factor 皆為 1，包含鏈條之間的低暗金屬底面。既有借用／destroy 契約不變；這是側視貼圖，不新增鏈條 geometry、動畫或傳動物理。

`mapleleaf` 排列九個 seeded 旋轉秋橙色楓葉圖案，每片具有五裂掌狀輪廓、微齒邊、五條凸起放射葉脈與狹長葉柄。深葉裂露出暗底，葉柄延伸至葉片下方。0.3 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變；此為風格化葉面，不新增葉片 geometry 或植物物種模擬。

`smocking` 以成對布褶在相鄰列交替收束，形成藍紫色蜂巢抽褶。三十六道短橫針腳固定壓低的收束點，張開褶冠高於固定點；細織紋與 seeded 纖維不掩蓋抽褶輪廓。0.12 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變。此為抽褶表面，不是絎縫、布料模擬、線材 geometry 或穿孔。

`quatrefoiltile` 排列二十五塊青綠色四葉弧形釉面磚，搭配深色菱形嵌片。圓弧瓣交會形成凹角，粗糙填縫低於磚面，菱形嵌片略低於主磚。0.5 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變，不新增磚塊 geometry 或 displacement。

`okraslice` 排列九片 seeded 旋轉綠色秋葵切片。五稜外皮包圍五個凹入種子腔，每腔兩顆淺色圓籽，高於腔底但低於實心中央組織與分隔壁。0.09 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變；不新增蔬菜 geometry、真實孔洞或食品模擬。

`eggcarton` 形成四乘四的灰米色模壓紙漿蛋盒表面：十六個圓形蛋杯凹於平坦鞍部之下，每個杯壁帶一圈凸起肋環，四杯交會處升起錐頭。細紙漿纖維不掩蓋蛋盒輪廓。0.16 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變；不新增包裝 geometry、真實孔洞、雞蛋或纖維模擬。

`greekkey` 在深藍黑色陶瓷上刻出鎏金希臘回紋：九個方形螺旋鉤向內捲至開放尖端，底線延伸到兩側 cell 邊緣，使回紋鉤跨 tile wrap 連成一線，每條凸線中央另有較亮的細芯。0.45 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變；不新增浮雕 geometry，也不模擬真實黃金或陶瓷。

`seedbeads` 以錯開半顆的 peyote 針法編織光澤小米珠：四十八顆圓柱珠各有拱起的桶狀剖面，兩端各有一個凹入穿線孔，珠間線隙低且粗糙，每顆珠子的色調依 seed 分布在藍到金的色階上。0.06 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變；不新增珠子 geometry、透光或線材模擬。

種類另支援 `chainstitch`（鏈式針繡）：深藍布底上五條直列金色鏈繡，每列六個上窄下寬的中空線圈相扣，線圈內外保留低幅織紋。使用 `await ProceduralMaterial.create('chainstitch', { seed: 7 })`。0.12 m tile、四圖 opaque dielectric（metallic 0）、選用 height 與借用／destroy 契約不變；僅為表面 shading，不新增紗線 geometry、透明孔洞或布料模擬。

種類另支援 `wingnuts`（蝶形螺帽）：十六個銀色螺帽以 90° 交錯排列，圓形 hub 與中央凹孔兩側伸出斜向扁翼，翼冠隆起、孔與間隙保留低暗鋼底。`await ProceduralMaterial.create('wingnuts', { seed: 7 })`；0.12 m tile、metallic map／預設 factor 1，沿既有 maps／選用 height／借用／destroy 契約，不新增螺帽 geometry、透明孔洞、實際螺紋或機械模擬。

種類另支援 `pomegranateslice`（石榴切片）：九個紅皮圓形斷面，乳白中心與隔膜隔出六個凹入果室，每室七顆較光滑、分開隆起的紅色橢圓果粒。`await ProceduralMaterial.create('pomegranateslice', { seed: 7 })`；0.15 m tile、opaque dielectric、metallic 0，沿既有 maps／選用 height／借用／destroy 契約，不新增果粒 geometry、透明、transmission、果汁或植物模擬。

種類另支援 `pawprinttiles`（爪印釉面磚）：十六片象牙白釉面方磚，各有四個分離橢圓趾墊與三葉掌墊的鈷藍凹印；印底低於釉面、高於粗糙中性灰縫。`await ProceduralMaterial.create('pawprinttiles', { seed: 7 })`；0.6 m tile、opaque dielectric、metallic 0，沿既有 maps／選用 height／借用／destroy 契約，不新增磁磚 geometry、實際壓印或動物模擬。

種類另支援 `dovetailjoint`（燕尾榫木拼板）：兩列各四個外寬內窄的梯形榫舌，直肩／斜邊／榫端皆有深凹縫，木板縱橫木紋交替，跨列保持同一片板的 seeded 色調與紋理。`await ProceduralMaterial.create('dovetailjoint', { seed: 7 })`；0.48 m tile、opaque dielectric、metallic 0，沿既有 maps／選用 height／借用／destroy 契約，不新增榫接 geometry 或結構力學模擬。

種類另支援 `starsocketbolts`（六瓣星槽螺栓頭）：十六顆銀色圓拱 cap，中央為封底六瓣圓滑星槽，槽底低於 cap、高於暗鋼底板，相鄰槽向交替 30°。`await ProceduralMaterial.create('starsocketbolts', { seed: 7 })`；0.12 m tile、opaque metal、metallic map／預設 factor 1，沿既有 maps／選用 height／借用／destroy 契約，不新增螺栓 geometry、透明孔、真實螺紋或機械模擬。

種類另支援 `sanddollar`（沙錢殼）：九片淺奶油色扁橢圓殼，五條花瓣狀閉合凹線之間有五個徑向狹長 lunule 凹孔，不含海膽殼的疣粒或孔列。`await ProceduralMaterial.create('sanddollar', { seed: 7 })`；0.3 m tile、opaque dielectric、metallic 0，沿既有 maps／選用 height／借用／destroy 契約。凹孔露出不透明暗底，不新增殼 geometry、透明穿孔或生物模擬；細花瓣線較適合較大的貼圖與預覽解析度。

種類另支援 `brogueleather`（雕花皮革）：暖棕皮面帶九朵六瓣橢圓沖孔花飾、中央圓孔與雙排細邊孔；完整皮面保留 grain，孔內露出低而粗糙的不透明暗底。`await ProceduralMaterial.create('brogueleather', { seed: 7 })`；0.18 m tile、opaque dielectric、metallic 0，沿既有 maps／選用 height／借用／destroy 契約，不新增皮革 geometry、透明孔或皮料模擬。

種類另支援 `clovebuds`（丁香乾香料）：十六枚暖褐色花蕾，圓蕾頭高於細莖與暗底，四裂萼托連接頭莖，相鄰方向轉 90°。`await ProceduralMaterial.create('clovebuds', { seed: 7 })`；0.08 m tile、opaque dielectric、metallic 0，沿既有 maps／選用 height／借用／destroy 契約，不新增香料 geometry、生物或食品模擬。

種類另支援 `starcrosstiles`（八角星十字磚）：深青色八角星與象牙白十字交錯，正方及斜向邊皆有低而粗糙的中性灰縫；外擴星尖納入鄰 cell，讓十字補集在接點保持平滑。`await ProceduralMaterial.create('starcrosstiles', { seed: 7 })`；0.8 m tile 含十六顆星、opaque dielectric、metallic 0，沿既有 maps／選用 height／借用／destroy 契約，不新增磚 geometry 或鋪設模擬。

種類另支援 `maplesamara`（成對楓翅果）：十六對金褐色 V 形翅，外展薄翅帶細脈，根部深色種仁高於翅面，短柄連接兩果，相鄰方向翻轉 180°。`await ProceduralMaterial.create('maplesamara', { seed: 7 })`；0.2 m tile、opaque dielectric、metallic 0，沿既有 maps／選用 height／借用／destroy 契約。薄翅是不透明表面 shading，不新增翅果 geometry、透明薄膜、飛行或生物模擬。

種類另支援 `lenoweave`（紗羅織）：六組奶油／赭色成對經線在六條緯線間扭交，經經／經緯交點的上下次序交替；可見權重遮住下層線，偶數列維持跨 tile 相位。`await ProceduralMaterial.create('lenoweave', { seed: 7 })`；0.06 m tile、opaque dielectric、metallic 0，沿既有 maps／選用 height／借用／destroy 契約。網眼是不透明暗底，不新增紗線 geometry、透明孔或布料模擬。

種類另支援 `circlips`（開口止動環）：十六枚銀色 C 形平環，兩個圓耳各有鉗孔凹點，相鄰開口方向翻轉 180°。`await ProceduralMaterial.create('circlips', { seed: 7 })`；0.08 m tile、opaque metal、metallic map／預設 factor 1，沿既有 maps／選用 height／借用／destroy 契約。中央、缺口與耳孔皆是不透明暗鋼底，不新增止動環 geometry、透明孔、彈性或機械模擬。

種類另支援 `tuliptiles`（鬱金香花磚）：十六片象牙白釉面方磚，鈷藍三瓣尖端花冠、細莖與兩片尖葉；顏料與低幅浮紋共用平滑遮罩，和深凹粗糙中性灰縫分離。`await ProceduralMaterial.create('tuliptiles', { seed: 7 })`；0.6 m tile、opaque dielectric、metallic 0，沿既有 maps／選用 height／借用／destroy 契約，不新增花卉／磚 geometry、透明縫或植物模擬。

種類另支援 `gingerslice`（多瓣薑切片）：十六片四瓣不規則根莖切面，淡黃纖維肉面高於薄褐色粗糙皮緣，相鄰方向轉 90°，接合頸部是連續肉面而非內部皮縫。`await ProceduralMaterial.create('gingerslice', { seed: 7 })`；0.2 m tile、opaque dielectric、metallic 0，沿既有 maps／選用 height／借用／destroy 契約，不新增根莖 geometry、透明度或食品／植物模擬。

種類另支援 `fivebarplate`（五條筋花紋板）：十六組各五條銀色平行圓端凸筋，沿 ±45° 交錯，底板較粗糙且帶低幅軋製紋，與單菱紋 `diamondplate` 不同。`await ProceduralMaterial.create('fivebarplate', { seed: 7 })`；0.6 m tile、opaque metal、metallic map／預設 factor 1，沿既有 maps／選用 height／借用／destroy 契約，不新增板材 geometry、實際止滑或承載物理。細筋較適合較大貼圖與預覽解析度。

種類另支援 `cinnamonswirl`（肉桂捲切面）：十六個金黃圓麵團切面，連續深褐螺旋內餡凹於麵團並接入中心餡核，外緣帶較深烤色。Cartesian angle components 避免角度分支縫，平坦餡核消除中心奇點。`await ProceduralMaterial.create('cinnamonswirl', { seed: 7 })`；0.32 m tile、opaque dielectric、metallic 0，沿既有 maps／選用 height／借用／destroy 契約，不新增食品 geometry、透明度或烘焙模擬。

種類另支援 `wheatears`（金黃麥穗）：十六支風格化麥穗，每支五對隆起穀粒、凹陷縱溝、十根細穗芒與中央穗軸，相鄰轉 180°。compact smooth 橢圓場在 cell 內結束。`await ProceduralMaterial.create('wheatears', { seed: 7 })`；0.24 m tile、opaque dielectric、metallic 0，沿既有 maps／選用 height／借用／destroy 契約，不新增植物 geometry、透明度、生長或風場模擬；細芒與縱溝較適合較大貼圖／預覽解析度。

種類另支援 `scalemail`（鋼製鱗甲）：6×8 交錯金屬鱗片，中央凸脊、頂端圓鉚釘與捲邊，從下排往上排合成，讓上排遮住下排捲邊且不產生 ownership 縫。暗縫仍是 opaque 鋼底層。`await ProceduralMaterial.create('scalemail', { seed: 7 })`；0.24 m tile、metallic map／預設 factor 1，沿既有 maps／選用 height／借用／destroy 契約，不新增甲片 geometry、透明孔洞、碰撞或防護物理。

種類另支援 `trihexagonaltiles`（六邊三角釉面磚）：56 塊藍色六邊磚與 112 塊象牙白三角磚，共用凹陷中性灰縫，六邊面略高且較平滑。平行半平面 smooth 乘積構成六邊面，擴張所有鄰近遮罩後的補集形成兩方向三角面，避免 nearest-owner 或 polygon max 折線導數。`await ProceduralMaterial.create('trihexagonaltiles', { seed: 7 })`；0.84 m tile、opaque dielectric、metallic 0，沿既有 maps／選用 height／借用／destroy 契約，不新增磚塊 geometry、碰撞或施工模擬。

種類另支援 `burlwood`（瘤木紋）：棕金色風格化扭曲閉合 latewood 等高木紋，九個固定偏置橢圓瘤眼與較暗、微凹、較粗糙的髓心。三個 seeded periodic lattice 改變木紋，局部環相位變形在中心與 compact 支撐邊界消失。`await ProceduralMaterial.create('burlwood', { seed: 7 })`；0.24 m tile、opaque dielectric、metallic 0，沿既有 maps／選用 height／借用／destroy 契約，不新增木材 geometry、樹種鑑定、年輪測年或生長模擬。

種類另支援 `slottedmetal`（圓端長槽金屬板）：8×4 交錯縱向長槽、加工斜壁與拉絲底板。capsule 平方距離將兩軸統一為 column-cell 單位，避免矩形 pitch 把圓端拉成橢圓；暗槽底仍是 opaque 鋼面。`await ProceduralMaterial.create('slottedmetal', { seed: 7 })`；0.4 m tile、metallic map／預設 factor 1，沿既有 maps／選用 height／借用／destroy 契約，不新增通孔 geometry、透明度、通風或承載物理。

種類另支援 `peppercorns`（黑胡椒粒）：二十五顆風格化暗褐乾果，隆起果身、淺皺皮與中央較暗、凹陷、較粗糙果梗疤。compact smooth 圓場與 squared-radius dome 將兩個 seeded periodic 表皮場限制於果形內。`await ProceduralMaterial.create('peppercorns', { seed: 7 })`；0.08 m tile、opaque dielectric、metallic 0，沿既有 maps／選用 height／借用／destroy 契約，不新增果粒 geometry、透明度或食品／植物模擬；低對比表皮細節較含蓄，非寫實掃描。

種類另支援 `castellatednuts`（六槽城堡螺帽）：4×4 鋼製六角螺帽，交替旋轉 30°，中央圓孔、六道徑向冠槽與連續內環。smooth half-plane 乘積與 compact elliptical slot 場保留 C1 bevel，凹槽下方仍為不透明鋼面。使用 `await ProceduralMaterial.create('castellatednuts', { seed: 7 })`；0.08 m tile、metallic maps／預設 factor 1，既有 maps／選用 height／ownership 不變，不新增螺帽 geometry、透明度、螺旋螺紋或緊固物理。

種類另支援 `farfalle`（蝴蝶義大利麵）：4×4 交替旋轉 90° 金黃麵片，連續聚攏窄腰、展翼、匯聚褶痕與波齒端切邊。smooth squared-coordinate 半寬與 compact 腰場不使用角度分支，褶痕依局部半寬正規化。使用 `await ProceduralMaterial.create('farfalle', { seed: 7 })`；0.16 m tile、opaque dielectric、metallic 0，沿既有 maps／選用 height／ownership，不新增麵片 geometry、透明度、烹飪或柔體物理。

種類另支援 `cardamompods`（綠豆蔻莢）：4×4 交替 ±45° 風格化橄欖綠閉合果莢，尖端收束、隆起果皮、縱向稜脊／凹道與相連短梗。compact squared-cap lens 與橢圓梗 product union 保持平滑輪廓，正值 width floor 防止稜脊匯聚於尖端時除零。使用 `await ProceduralMaterial.create('cardamompods', { seed: 7 })`；0.08 m tile、opaque dielectric、metallic 0，沿既有 maps／選用 height／ownership，不新增果莢 geometry、透明度、開莢動畫或植物／食品模擬。

種類另支援 `brickarches`（紅磚半圓拱）：4×4 裝飾半圓拱，每拱九塊楔磚、兩側拱腳各三層。預計算 half-plane wedge 與圓形 bevel，和矩形拱腳床縫共用下凹灰縫，product-union outline 銜接拱起點、不使用角度分支。使用 `await ProceduralMaterial.create('brickarches', { seed: 7 })`；2.4 m tile、opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變；開口為不透明暗色底層，不新增建築 geometry、透明門洞、承載或碰撞物理。

種類另支援 `knottednet`（打結繩網）：6×6 棕黃色繩網，squared-sine 鬆垂繩段連接隆起交疊繩結，結部有 compact 收緊凹痕與細繩紋。wrapped smooth squared-cap 繩場在兩個對角橢圓結帶下淡出，網孔仍為暗色不透明底層。使用 `await ProceduralMaterial.create('knottednet', { seed: 7 })`；0.3 m tile、opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變，不新增繩網 geometry、透明孔洞、受力或布料模擬。

種類另支援 `fiddleheads`（蕨類捲芽）：4×4 鏡向綠色捲芽圖案，逐漸收細的一圈半螺旋芽頭與相連 cubic Bézier 彎莖。sampler 建立時預算 72 段 coil＋24 段 stem 的端點、倒長度／寬度平方與 AABB，取樣用 compact smooth capsule product union，不建立逐取樣陣列或角度 owner。使用 `await ProceduralMaterial.create('fiddleheads', { seed: 7 })`；0.24 m tile、opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變，不新增植物 geometry、透明度或生長模擬；為風格化而非植物辨識或寫實認證。

種類另支援 `cowrieshells`（寶螺腹面）：4×4 交替直橫象牙色橢圓殼面，隆起殼體、狹長凹口與兩側各九條較光滑隆起齒脊。compact 殼面／開口場與十八齒脊 product union 保留 C1 shoulder，齒列不跨接中央凹口。使用 `await ProceduralMaterial.create('cowrieshells', { seed: 7 })`；0.2 m tile、opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變，不新增貝殼 geometry、透明殼口或海洋生物模擬。

種類另支援 `cotterpins`（開口銷）：4×4 交替正反鋼銷，橢圓環眼、分離雙腳與長短不同的外彎尾端。四段預計算 capsule 與 compact smooth 環眼 product union 相連，孔隙保留暗色不透明鋼底。使用 `await ProceduralMaterial.create('cotterpins', { seed: 7 })`；0.12 m tile、metallic maps／預設 factor 1，既有 maps／選用 height／ownership 不變，不新增五金 geometry、透明度、緊固或彎折物理。

種類另支援 `seedstitch`（米粒針織）：12×12 灰綠色針目，V 形正針與橫向反針凸結沿行列交錯。有限 capsule union 與 compact smooth 肩部保持 periodic C1，取樣不配置陣列。使用 `await ProceduralMaterial.create('seedstitch', { seed: 7 })`；0.12 m tile、opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增毛線 geometry、透明度或布料模擬。

種類另支援 `mangosteenslice`（山竹切面）：4×4 厚紫紅果皮與六瓣乳白果肉，中央相連、瓣間徑向凹縫，相鄰旋轉 30°。Squared-radius 場與六組預算橢圓方向維持 compact smooth 果肉／果皮銜接，取樣無 trig 或陣列配置。使用 `await ProceduralMaterial.create('mangosteenslice', { seed: 7 })`；0.32 m tile、opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增果實 geometry、透明度或植物學模擬。

種類另支援 `pickettiles`（細長六角釉面磚）：0.9 m UV 方形內有 36 塊交錯青綠尖頂長磚，扣灰縫／bevel 前標稱 0.1×0.3 m。最近 owner 僅搜尋相鄰兩列，六個 half-plane 的 smooth product 保留直邊、尖頂與跨 owner 的平底凹縫；逐磚色差與 lattice 常數預先計算。使用 `await ProceduralMaterial.create('pickettiles', { seed: 7 })`；opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增磚 geometry、透明度或建築模擬。

種類另支援 `squarewashers`（鋼製方墊圈）：4×4 交替旋轉 45° 的完整鋼製方框、直線倒角外緣、四角與圓形凹陷孔眼。對向平面 compact smooth product 與 squared-radius 孔眼 bevel 保持連續框面，取樣無 trig 或陣列配置。使用 `await ProceduralMaterial.create('squarewashers', { seed: 7 })`；0.16 m tile、opaque metallic maps／預設 factor 1，既有 maps／選用 height／ownership 不變，孔眼保留暗色不透明鋼底，不新增墊圈 geometry、透明度、緊固或荷重模擬。

種類另支援 `eucalyptusleaf`（尤加利葉）：4×4 灰藍綠狹長葉片交替傾斜 ±45°，帶彎曲漸尖葉身、中肋、五對斜側脈與相連短葉柄。Compact polynomial support 與中軸 fade 的脈紋保持 C1，脈根位置與倒數常數預先計算。使用 `await ProceduralMaterial.create('eucalyptusleaf', { seed: 7 })`；0.48 m tile、opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增葉片 geometry、透明度、風動或植物學模擬。

種類另支援 `twillweave`（二上二下斜紋織物）：16×16 平衡斜紋，淺褐緯線與深棕經線各跨兩針，每列偏一針形成連續斜紋。Rounded warp／weft profiles 沿用既有 satin exposure 慣例，但四針週期同時切換顏料與隆起肩部方向；compact exposure 在 cell owner 切換前歸零。紗線半寬 0.32 cell，最低 32×32 尺寸仍可辨識深淺交織，不會只取樣到間隙。使用 `await ProceduralMaterial.create('twillweave', { seed: 7 })`；0.16 m tile、opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增毛線 geometry、透明孔隙或布料模擬。

種類另支援 `pumpkinseeds`（帶殼南瓜籽）：4×4 乳白籽殼交替 ±45°，雙端漸尖、連續隆起外緣與完整較低的中央殼面。巢狀 compact smooth polynomial masks 區分殼形、殼緣與凹入中央，取樣無 trig 或陣列配置。使用 `await ProceduralMaterial.create('pumpkinseeds', { seed: 7 })`；0.12 m tile、opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增種籽 geometry、透明殼、開裂或植物學模擬。

種類另支援 `spurgears`（風格化鋼齒輪）：4×4 交替旋轉 15° 的鋼輪，十二個倒角塊狀外齒、圓形凹軸孔與隆起環形輪轂。十二組預算 radial／tangent 軸建立 compact smooth 齒形 products，與 squared-radius 輪身 union 後扣孔；取樣無 trig 或陣列配置。使用 `await ProceduralMaterial.create('spurgears', { seed: 7 })`；0.2 m tile、opaque metallic maps／預設 factor 1，既有 maps／選用 height／ownership 不變，孔／齒隙保留暗色不透明鋼底，不新增齒輪 geometry、透明度、漸開線齒形認證或傳動模擬。

種類另支援 `diamondcheckertiles`（斜鋪棋盤磚）：32 塊旋轉 45° 的黑／米白正方釉面磚，兩個對角方向皆交替深淺色，帶柔化倒角與低陷中性灰縫。預算 quotient-lattice owner tones 對兩方向 UV 平移維持一致，edge masks 乘積保持角落倒角平滑。使用 `await ProceduralMaterial.create('diamondcheckertiles', { seed: 7 })`；1.2 m tile、opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增鋪磚 geometry、透明度或物理。

種類另支援 `appleslice`（蘋果橫切面）：4×4 切面交替轉 36°，薄紅褐果皮、淡色果肉與五個含深色籽的獨立凹種室。同心 squared-radius masks 定義果皮／果肉／核心，五組預算 radial／tangent 軸的橢圓 smooth unions 畫凹底與籽，籽高於室底但低於完整果肉。使用 `await ProceduralMaterial.create('appleslice', { seed: 7 })`；0.4 m tile、opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增果實 geometry、透明種室、切割、汁液或植物學模擬。

種類另支援 `paperclips`（鋼製迴紋針）：4×4 線夾交替 ±45°，三段連通線身、兩道嵌套回彎與保留開口的線端包圍凹槽。Capsule 投影與 implicit squared-radius ring profile 以 compact half-plane 重疊避開硬切半圓接縫，取樣無 trig、sqrt 或陣列配置。使用 `await ProceduralMaterial.create('paperclips', { seed: 7 })`；0.24 m tile、opaque metallic maps／預設 factor 1，既有 maps／選用 height／ownership 不變，內槽保留暗色不透明鋼底，不新增線材 geometry、透明度或夾持模擬。

種類另支援 `ivyleaf`（三裂常春藤葉）：4×4 綠葉交替 ±45°，三個尖裂片、兩道深缺刻、隆起掌狀葉脈與連通短葉柄。Compact pointed polynomial lobes 的 smooth union 定義葉面，預算葉脈投影由葉面 coverage 限定，capsule 葉柄接於共同根部。使用 `await ProceduralMaterial.create('ivyleaf', { seed: 7 })`；0.32 m tile、opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增葉片 geometry、透明度、風動或植物學模擬。

種類另支援 `ribknit`（一上一下羅紋針織）：12×12 玫瑰褐針目，較高 V 形正針與較低橫向反針直列交替。Smooth capsule unions 與 column-only owner 保持每一列的正／反針欄位不換位，區別 seedstitch 的棋盤交替；seeded grain 由 yarn coverage 限定。使用 `await ProceduralMaterial.create('ribknit', { seed: 7 })`；0.12 m tile、opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增紗線 geometry、透明孔隙、彈性或布料模擬。

種類另支援 `pillowtiles`（枕形釉面磚）：6×6 象牙白圓角方磚，凸起枕面、柔化倒角與低陷中性灰縫。四次 superellipse coverage 與 smooth quadratic dome 分開，磚面持續向中央升高而非平頂；預算 seeded 磚面色差在 owner 邊界前歸零。使用 `await ProceduralMaterial.create('pillowtiles', { seed: 7 })`；0.6 m tile、opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增磚體 geometry、位移或透明度。

種類另支援 `coffeerings`（紙面咖啡杯圈）：3×3 seeded 橢圓杯底乾燥環，褐圈濃淡不均、內部浸染較淡，紙纖維近乎平坦。預算中心、旋轉與橢圓半徑倒數畫 smooth implicit rings，periodic warp／fade 改變外圈，獨立內部 mask 畫淡色浸染；色漬不當深凹槽、不降低 AO。使用 `await ProceduralMaterial.create('coffeerings', { seed: 7 })`；0.36 m tile、opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增紙／杯 geometry、透明液體、流體、吸收或乾燥模擬。

種類另支援 `cashews`（腰果仁）：4×4 奶油色厚實 C 形果仁，兩個圓鈍端部大小不對稱。偏心 smooth 橢圓內口從外橢圓扣除，再以兩個圓端 mask 與獨立 dome profiles 做 smooth product unions，保留連通弧身與開口；seeded 色差與 grain 由 kernel coverage 限定，交替 ±45° 旋轉。使用 `await ProceduralMaterial.create('cashews', { seed: 7 })`；0.16 m tile、opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增果仁 geometry、透明孔洞、次表面散射或食物物理。

種類另支援 `hinges`（鋼製鉸鏈）：4×4 雙側圓角固定葉片、六個沉孔、五節凸起軸筒及節縫中可見的較低連續銷軸。四次 leaf masks、最近三列 smooth bore／seat profiles 與 compact periodic joint shoulders 做 coverage blends，不把葉片高度額外加在軸筒下方。使用 `await ProceduralMaterial.create('hinges', { seed: 7 })`；0.4 m tile、opaque steel／metallic 1，既有 maps／選用 height／ownership 不變，不新增鉸鏈 geometry、透明孔洞、活動關節或剛體物理。

種類另支援 `coins`（五角星壓印金色硬幣）：4×4 金色圓幣、凸起圓環邊框、較低平面及五角星浮雕。各三角 spike 用三條 smooth 半平面相乘，底部向五半平面 pentagonal hub 內重疊，再做 product union，避免內部 bevel gaps；seeded 色差／grain 由 disk coverage 限定，相鄰星形朝向差 36°。使用 `await ProceduralMaterial.create('coins', { seed: 7 })`；0.12 m tile、opaque metal／metallic 1，既有 maps／選用 height／ownership 不變，不新增硬幣 geometry、文字、透明度、貨幣系統或剛體物理。

種類另支援 `righttriangletiles`（直角三角釉面磚）：4×4 方格分成 32 塊藍灰／乳白直角等腰三角磚，斜縫方向逐格交替。外框 coverage 乘兩側 smooth diagonal half-plane masks，獨立 seeded pigment 在 owner 邊界前回到共用灰縫底色；斜縫用法向距離，與直縫維持相同 grout／bevel 寬度。使用 `await ProceduralMaterial.create('righttriangletiles', { seed: 7 })`；1 m tile、opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增磚體 geometry、位移或透明度。

種類另支援 `cherryblossom`（五瓣櫻花）：4×4 stylized 粉色五瓣花、端部缺刻、較低花心與十二個淺色凸起花粉點。各 smooth 橢圓花瓣扣除 compact 橢圓末端缺刻，coverage／convex domes 分別 union 避免重疊尖峰；預算 pollen sites 的支撐在徑向 gate 前平順歸零，相鄰花朝向差 36°。使用 `await ProceduralMaterial.create('cherryblossom', { seed: 7 })`；0.24 m tile、opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增花朵 geometry、透明孔洞、植物生長、風動或次表面散射模擬。

種類另支援 `punchcard`（打孔資料卡）：2×4 米色薄紙卡、單側上角切角與 20×8 矩形孔位，每欄兩個不同 seeded 打孔。預算 slot bitmaps、最近格 owner 省去逐點搜尋，smooth 矩形 bevel 支撐在 owner 中線前歸零；paper coverage 扣除打孔，使 pigment／height／roughness／AO 同步回到不透明背襯。使用 `await ProceduralMaterial.create('punchcard', { seed: 7 })`；0.44 m tile、約 0.3 mm 紙面高度差、opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增紙卡 geometry、透明鏤空、歷史資料編碼／讀卡或紙張物理。

種類另支援 `braidedcord`（三股扁辮繩）：四條直向扁辮帶、每條四週期。C2 quartic 橫向路徑與雙倍相位深度形成交替上下穿越的 figure-eight 交叉；切線斜率修正近似法向繩寬，smooth depth ownership 避免硬排序接縫。Seeded 繩股深淺色保留跨交叉身分，區別 rope 的捻線與 cableknit 的雙股針織纜花。使用 `await ProceduralMaterial.create('braidedcord', { seed: 7 })`；0.08 m tile、opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增繩股 geometry、透明孔洞、編繩製程或布料物理。

種類另支援 `crossbeddedsandstone`（交錯層理砂岩）：四層砂岩內的彎曲細層理交替傾向，層界為共用水平接觸帶。預算 seeded dip／quadratic curvature／phase／染色深度，compact periodic lamina profiles 在 bed owner 切換前漸消，避免硬截斷造成 normal 接縫，contacts 與 UV wrap 保持 C1。使用 `await ProceduralMaterial.create('crossbeddedsandstone', { seed: 7 })`；1.2 m tile、opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增岩體 geometry、位移、地層生成、沉積或侵蝕模擬。

種類另支援 `grommetcanvas`（黃銅雞眼扣帆布）：棕色粗織布上 4×4 凸起黃銅環，區別 eyeletcotton 的非金屬繡線孔圈。Squared-radius inner／outer compact masks 與獨立 radial dome 混合切除帆布後的各表面欄位，孔內保留暗色不透明 backing。Metallic map 為 ring coverage：黃銅 1、織布／孔底 0、bevel 介於兩者。使用 `await ProceduralMaterial.create('grommetcanvas', { seed: 7 })`；0.16 m tile、預設 metallic factor 1 保留混合 map，不把整張帆布變金屬。既有 maps／選用 height／ownership 不變，不新增 geometry、透明鏤空或布料物理。

種類另支援 `fishscaletiles`（魚鱗形釉面馬賽克）：青綠色互鎖扇形磚，上沿為凸半圓、下沿為兩條凹弧。Compact 內縮 disk 排除後續錯列的外擴 disk，形成中性弧形填縫而非屋瓦覆疊；相鄰兩個 exclusion masks 與額外入列 course 保持 nearest-disk ties／row transitions C1。32 組 seeded tones 區分共平面釉面磚。使用 `await ProceduralMaterial.create('fishscaletiles', { seed: 7 })`；0.4 m tile、4 columns／8 rows、metallic 0，填縫沿既有 mortar 欄位不受 tint 染色。既有 maps／選用 height／ownership 不變，不新增 geometry、透明度或鋪磚模擬。

種類另支援 `hexkeys`（黑氧化六角扳手）：4×4 L 形棒材以 seeded exact quarter-turn 轉向，不等長直臂由相切 quarter-circle 彎肘連接，兩端保留平切 bevel。橫截面有平頂、兩側線性斜面與窄帶 C1 圓角，區別圓線材的連續圓冠。使用 `await ProceduralMaterial.create('hexkeys', { seed: 7 })`；0.4 m opaque tile，metallic map／預設 factor 皆為 1。既有 maps／選用 height／ownership 不變；僅為 stylized 表面浮雕，不新增工具 geometry、機械裝配或物理。

種類另支援 `driedfigslice`（無花果乾切片）：4×4 交替轉向的收窄切片，淺褐色放射皺摺外皮包住深棕果肉及細小淡色橢圓籽。縱向 width modulation 決定果形，compact 環帶限制 angular wrinkles、避開中心 singularity；籽的 jitter／軸向／tone 預算，籽粒 support 留在各自 owner cell，並由 flesh coverage 在果皮前裁切。使用 `await ProceduralMaterial.create('driedfigslice', { seed: 7 })`；0.24 m opaque dielectric tile、metallic 0，既有 maps／選用 height／ownership 不變，不新增果實 geometry、透明度、食物生成或生物模擬。

種類另支援 `creamcrackers`（波邊奶油蘇打餅）：4×4 金黃烘烤方餅保留波邊、九孔壓痕、褐色外緣及起泡焦斑。Compact eighth-power body／interior profiles 配合週期橢圓邊緣切口維持 C1；nearest-hole compact pits 僅存在中央 3×3 格，不延伸到外緣。Seeded tones、細粒 grain 與較粗 blister field 區分每片烘烤表面。使用 `await ProceduralMaterial.create('creamcrackers', { seed: 7 })`；0.24 m opaque dielectric tile、metallic 0，既有 maps／選用 height／ownership 不變，不新增食物 geometry、透明孔、烘焙或食物物理。

種類另支援 `doorkeys`（黃銅門鑰匙）：4×4 seeded exact quarter-turn 的平面鑰匙，三處圓底齒槽各有獨立 seeded depth。圓環 bow／窄 neck／非對稱 blade 先做 smooth union，再扣除 bore 與 compact bittings，接合處維持共平面；縱向導槽及倒角匙尖補足細節。使用 `await ProceduralMaterial.create('doorkeys', { seed: 7 })`；0.32 m opaque tile，metallic map／預設 factor 皆為 1，既有 maps／選用 height／ownership 不變，不新增鑰匙 geometry、透明孔、鎖芯或機械模擬。

種類另支援 `dodecagontiles`（十二邊三角釉面馬賽克）：canonical 3.12.12 lattice 有 56 塊藍綠十二邊形磚及 112 塊淡色三角嵌片。六對 compact 半平面裁出大磚，兩族獨立 owner 的三半平面 triangle 填入 hexagonal center lattice 間隙，避免跨 Voronoi corners 改變 tone；各面共平面、保留中性填縫及 seeded 釉色。使用 `await ProceduralMaterial.create('dodecagontiles', { seed: 7 })`；0.7 m opaque dielectric tile、metallic 0，既有 maps／選用 height／ownership 不變。7 columns／8 staggered rows 將矩形 canonical period 正規化方形 UV，兩軸約 1% 尺度差，不宣稱實體正多邊形量測精度；不新增 geometry、透明度或鋪磚模擬。

種類另支援 `ballchain`（銀色金屬珠鏈）：四條各八顆實心球珠，由細直頸接成兩週期緩彎路徑。Seeded 珠心／tone、segment vectors 與 reciprocal squared lengths 預算；compact 球珠 coverage 遮住珠心處的 connector owner 轉換，細頸高度先在底層混合，不加疊穿過球冠。使用 `await ProceduralMaterial.create('ballchain', { seed: 7 })`；0.064 m opaque tile，metallic map／預設 factor 皆為 1，既有 maps／選用 height／ownership 不變，不新增珠鏈 geometry、透明度或鏈條物理。

種類另支援 `succulentrosettes`（多肉蓮座葉叢）：4×4 灰綠色 rosettes，每株三圈各六片肥厚葉。預算 axes／dimensions／offsets／lifts／tones 的 compact tapered ellipse 形成匙形輪廓；由外向內混合、抬高且錯位的內圈覆蓋外圈狹窄葉基，不加疊多片葉高度。凸冠、抬起的圓葉尖及細粒 grain 沿相同 coverage 更新 color／height／roughness／AO。使用 `await ProceduralMaterial.create('succulentrosettes', { seed: 7 })`；0.64 m opaque dielectric tile、metallic 0，既有 maps／選用 height／ownership 不變，不新增植物 geometry、透明度、次表面散射或生物模擬。

種類另支援 `foldingfans`（紙摺扇）：4×4 交替轉向的 140° 紙扇，十二道放射摺痕、十三根露出木扇骨、兩側護骨及圓扇釘。預算 ray axes 驅動 compact nearest-ray capsules；annular squared-radius／sector masks 在上半扇骨上混合紙面，angular cosine folds 控制高度與明暗。完整 pivot coverage 遮住 angular singularity 及近根 owner ties；外部扇骨 support 在 owner 更換前已分離。使用 `await ProceduralMaterial.create('foldingfans', { seed: 7 })`；1 m opaque dielectric tile、metallic 0，既有 maps／選用 height／ownership 不變，不新增扇子 geometry、透明孔、開合動畫或摺紙物理。

種類另支援 `togglebuttons`（雙孔木製牛角扣）：4×4 橫直交替的長桶形木扣，圓滑收束兩端、凸冠、雙穿繩孔及順向木紋。Compact 長向四次方／橫向平方 mask 塑造桶形，預算 tone／phase 變化木色，互不相交的 squared-circle bore shoulders 將較低 opaque pits 混合入凸冠；bore owner 與 cell 更換均在 compact support 外隱藏。使用 `await ProceduralMaterial.create('togglebuttons', { seed: 7 })`；0.32 m tile、opaque dielectric、metallic 0，沿用既有 maps／選用 height／ownership，不新增鈕扣 geometry、透明孔、繩索或衣物物理。

種類另支援 `greenpeapods`（封閉青豌豆莢）：4×4 交替斜向的彎曲尖端莢殼，雙側縫脊、短柄與殼下五顆豌豆隆起。Compact lens mask 沿 curved centerline，compact elliptical bulges 僅在 support 間隙換 owner；莢殼覆蓋短柄接合，不累加兩者高度。使用 `await ProceduralMaterial.create('greenpeapods', { seed: 7 })`；0.48 m tile、opaque dielectric、metallic 0，沿用既有 maps／選用 height／ownership，不新增豆莢 geometry、透明外殼、剝莢動畫或植物模擬。

種類另支援 `beltbuckles`（黃銅皮帶框扣）：4×4 橫直交替圓角框、較低中柱、較高收尖扣舌及圓樞軸。Rounded-rectangle signed distance 的 compact 管截面保留相切圓角；框覆蓋柱端、扣舌覆蓋兩者、樞軸覆蓋舌根，交接不累加高度。使用 `await ProceduralMaterial.create('beltbuckles', { seed: 7 })`；0.32 m opaque metallic tile、既有 maps／選用 height／ownership 不變，metallic factor／map 含暗低 backing 皆為 1。開口非透明孔，不新增框扣 geometry、皮帶材質、扣合動畫或機械模擬。

種類另支援 `hextruchettiles`（六角三弧 Truchet 釉面磚）：56 片深藍六角磚，每片三段象牙弧，兩種 seeded 交替頂點方向。兩個 bracketing lattice rows 決定最近 owner；相乘 compact half-plane masks 保留六邊 bevel 的 C1，owner 更換藏於中性灰縫。預算交替 hex vertices 作為三個互不相交的 squared-radius arc bands 圓心，接續六邊中點；motif 改變釉色／finish，不改平面高度。使用 `await ProceduralMaterial.create('hextruchettiles', { seed: 7 })`；0.7 m opaque dielectric tile、metallic 0、既有 maps／選用 height／ownership 不變。Canonical 7×4√3 lattice 放入 square UV 有約 1% 軸伸縮，不新增拼磚 geometry、量測級正六角或路徑／拼圖遊戲。

種類另支援 `scoredmango`（十字劃切芒果果頰）：4×4 橫直交替橢圓果頰，完整薄皮邊、凹十字劃線與圓潤金黃果肉方塊。巢狀 compact ellipses 分隔皮／肉；相乘周期 cut masks 將凸冠裁進內橢圓，grid owner 更換前退回同一連續 cut floor。預算 tones／細 grain，不在採樣配置、hash 或 trig。使用 `await ProceduralMaterial.create('scoredmango', { seed: 7 })`；0.48 m opaque dielectric tile、metallic 0，沿用既有 maps／選用 height／ownership。僅為表面浮雕，不新增翻開／分離果塊 geometry、透明度或切割物理。

種類另支援 `waxseals`（五瓣徽記封蠟印章）：4×4 深紅封蠟，seeded 七／十一波熔邊、圓形壓印凹面、凸環與五瓣浮雕徽記。Compact squared-radius masks 限定圓形 stamp／ring；外蠟／徽記 angular radius masks 只在全覆蓋 guards 外運作，固定 smooth radial dome 避免中心 angular 洩漏。預算 phases／tones，採樣無配置／hash，輪廓仍用 atan2／cos。使用 `await ProceduralMaterial.create('waxseals', { seed: 7 })`；0.16 m opaque dielectric tile、metallic 0，沿用既有 maps／選用 height／ownership。不新增印章 geometry、文字／自訂徽記輸入、熔融動畫或蠟流體模擬。

種類另支援 `cottonbolls`（四團棉絮開裂棉鈴）：4×4 交替轉 45° 棉鈴，四團象牙凸冠、較低共享中心及露出尖褐苞片。Compact circular tuft masks union 覆蓋 pointed-lens bracts；正規化 dome weights 避免交接厚度相加或 hard-max owner。預算 axes／tones，256×256 fine grain 與 96×96 nap，採樣無配置、hash、trig 或 sqrt。使用 `await ProceduralMaterial.create('cottonbolls', { seed: 7 })`；0.24 m opaque dielectric tile、metallic 0，沿用既有 maps／選用 height／ownership。纖維斑理是不透明 shading，不新增纖維 geometry、透明毛邊、次表面散射或植物生長。

種類另支援 `carabiners`（鋁色 D 型登山扣）：4×4 橫直交替鋁色框、斜門閂、兩端凹接縫及鉸釘。預算 convex polygon segments／normals，compact exterior squared-distance offset band 保留相切圓角；inside exclusion 藏於零 support strip，gate masks 在 nearest-segment owner ties 前歸零，鉸釘覆蓋底框而不疊加厚度。採樣無配置、hash、trig 或 sqrt。使用 `await ProceduralMaterial.create('carabiners', { seed: 7 })`；0.32 m opaque metallic tile，既有 maps／選用 height／ownership 不變，metallic factor／map 含暗低 backing 皆為 1。不新增扣環 geometry、透明孔、開合機構、碰撞或承重認證。

種類另支援 `pencilends`（木鉛筆橫切面）：4×4 交替轉 30° 六角末端，深色薄漆邊、淺木切面與略低 opaque 圓形石墨芯。相乘 compact 半平面畫內外六角，避免 bevel 角平分線 cusp；squared-radius core shoulder 混合進近乎平整木面。預算 axes／phases／tones 與 96×96 fine，採樣無配置／hash／sqrt，彎曲木紋仍用 sin，不代表以筆芯為樹心的年輪。使用 `await ProceduralMaterial.create('pencilends', { seed: 7 })`；0.04 m opaque dielectric tile、metallic 0，沿用既有 maps／選用 height／ownership。不新增鉛筆 geometry、削尖／書寫功能或導電模擬。

種類另支援 `corrugatedplasticedge`（中空塑膠板切邊）：8 排藍色切邊交替位移半格，每排 8 格矩形槽由兩層平面皮與直肋板圍住。Compact squared-distance bands 與 C1 web shoulder 在外皮外緣收尾，coverage union 讓 T-junction 與面皮保持同一 cut-face 高度，不把重疊厚度相加。預算 row tones 與 64×64 grain，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('corrugatedplasticedge', { seed: 7 })`；0.064 m opaque dielectric tile、metallic 0，沿既有 maps／選用 height／ownership。槽為較低暗 opaque backing、不是透明孔；不新增板 geometry、結構力學或塑膠性能認證。

種類另支援 `haircombs`（塑膠髮梳）：4×4 交替水平／垂直琥珀色梳子，平整梳背連接 14 根漸細梳齒。相乘 compact 半平面畫梳背，只評估最近梳齒的 squared-distance 橫截面、smooth 寬度 taper 與圓鈍端部 shoulder；support 在 tooth owner 邊界前退為零，coverage union 不讓齒根疊高。預算 cell tones 與 96×96 grain，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('haircombs', { seed: 7 })`；0.48 m opaque dielectric tile、metallic 0，沿既有 maps／選用 height／ownership。齒間槽是連通低暗 opaque backing、不是透明孔；不新增梳子 geometry、透明塑膠、頭髮交互或變形模擬。

種類另支援 `blackberries`（黑莓聚合果）：4×4 交替水平／垂直橢圓果實，每顆以 3／4／5／4／3 交錯列排 19 顆光澤凸圓小核果。預算 centers 與 per-cell／per-drupe tones，compact squared-radius masks 以 coverage union 與 normalized dome／tone weights 混合，凸頂高於填實的雙顆／三顆接縫，不疊加厚度或引入 hard nearest-lobe seam。先剔除 fruit bounds／零 support lobe，僅在有效果面採 96×96 grain，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('blackberries', { seed: 7 })`；0.16 m opaque dielectric tile、metallic 0，沿既有 maps／選用 height／ownership。不新增果實 geometry、透明果肉、植物生長或食物物理。

種類另支援 `musselshells`（淡菜貝殼）：4×4 交替水平／垂直藍黑淚滴殼，窄鉸端、圓寬尾、實心凸冠。Normalized cubic 長軸 profile 與 squared 橫距配 compact C1 shoulder；鉸端 squared Cartesian distance 驅動細 chirped cosine 生長槽，間距可變而無 radial-origin singularity。預算 phases／tones 與 96×96 grain，採樣無配置／hash／sqrt，只有有效殼面用 cos 與 grain。使用 `await ProceduralMaterial.create('musselshells', { seed: 7 })`；0.32 m opaque dielectric tile、metallic 0，沿既有 maps／選用 height／ownership。非扇貝放射肋、牡蠣層階或寶螺齒口變體；不新增貝殼 geometry、雙殼開合、透明殼或生物模擬。

種類另支援 `safetypins`（閉合金屬別針）：4×4 交替水平／垂直鋼色別針，圓形彈簧線圈、兩條凸圓針腳與蓋住針尖的較高實心護扣。Squared-annulus／point-to-segment masks 配 bounded coverage／crown unions，線圈與針腳接點不加倍頂高；compact ellipse 護扣覆蓋針尖，再混合淺凹縫而不切穿。預算 segment data／tones 與 96×96 grain，零 support 不採 grain，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('safetypins', { seed: 7 })`；0.16 m opaque metallic tile、factor／map 1 含低暗 backing，沿既有 maps／選用 height／ownership。孔非透明，不新增別針 geometry、開合、彈簧物理或穿刺功能。

種類另支援 `poppyseedpods`（乾燥罌粟蒴果）：4×4 交替水平／垂直封閉凸果身、縱向細肋、較低細梗及較高扁平八瓣柱頭盤。正橫向寬度 floor 讓 cosine 縱肋在果端保持有限；扁橢圓 crown 座標合併中央圓面與預算 radial ellipse masks，畫八瓣缺刻及凸起柱頭放射紋，無 atan2-origin seam。Bounded coverage unions 不把 rays 疊高，梗／果身／柱頭盤逐層替換而不相加；crown bounds 與零 support 先剔除，預算 axes／tones、96×96 grain，採樣無配置／hash／sqrt，僅有效果身用 cos。使用 `await ProceduralMaterial.create('poppyseedpods', { seed: 7 })`；0.24 m opaque dielectric tile、metallic 0，沿既有 maps／選用 height／ownership。不新增蒴果 geometry、透明果皮、開裂、種子散播或植物模擬。

種類另支援 `leatherbookspines`（壓紋皮革書脊）：8 本平行棕色凸弧書背，各有四道彎曲 raised bands 與圓角 blind-stamped frame／淺凹 panel floor。Compact face shoulder 在書縫與上下空隙隱藏 column owners，smooth squared 橫向 cap 畫凸冠，quadratic 長軸 warp 讓 compact bands 彎曲，nested superellipse masks 畫凸 rim／壓低面。預算 spine tones、128×256 grain 與 256×256 pores，零 face 不採細節，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('leatherbookspines', { seed: 7 })`；0.32 m opaque dielectric tile、metallic 0，沿既有 maps／選用 height／ownership。無金屬 foil／文字，不新增書本 geometry、文字排版、翻頁或裝訂物理。

種類另支援 `matchsticks`（木火柴）：4×4 交替水平／垂直淺木方棒、square ends、直向木紋與較寬較高暗紅凸圓塗頭。相乘 compact 半平面保持平木面及方端 bevel，弱彎曲 sine 細紋沿木身延伸；compact ellipse shoulder／smooth cap 畫凸塗頭，覆蓋木身時替換而不疊加高度。既有 pigment ramp 的低 scalar 映暗紅塗層、高 scalar 映淺木色；獨立 coating roughness 與 128×128 fine 區分兩面。預算 phases／tones，零 support 不採細節，採樣無配置／hash／sqrt，木紋仍用 sin。使用 `await ProceduralMaterial.create('matchsticks', { seed: 7 })`；0.2 m opaque dielectric tile、metallic 0，沿既有 maps／選用 height／ownership。不新增火柴 geometry、點火、燃燒、發光或化學模擬。

種類另支援 `porcelaininsulators`（瓷質絕緣子）：4×4 交替水平／垂直乳白釉面側面，五層圓弧傘裙覆蓋較低連續細芯，保留圓帽與短柄。Compact squared-width mask 畫 core、扁 ellipse masks 畫 skirts，bounded coverage／crown unions 不疊加裙面厚度；裙面依 coverage 替換低 neck，再覆 convex ellipse cap，零 support 不採 glaze grain。預算 tones 與 96×96 grain，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('porcelaininsulators', { seed: 7 })`；0.8 m opaque dielectric tile、metallic 0，沿既有 maps／選用 height／ownership。不新增絕緣子 geometry、金屬接頭、電場／漏電模擬或絕緣性能認證。

種類另支援 `dominoes`（骨牌）：4×4 交替水平／垂直象牙白圓角牌面，兩半獨立 seeded 標準 0–6 黑色凹點排列與中央淺分隔槽。預算七種排列 bitmask、16 tones／32 半面 masks／96×96 grain；八次 superellipse 畫圓角牌面、compact squared ellipse 畫 filled recesses、兩軸 squared bands 畫中央淺槽。半面 ownership 切換處無 pip support，凹點／槽皆高於 opaque backing；非 face 跳過 grain／pips，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('dominoes', { seed: 7 })`；0.24 m dielectric tile、metallic 0，沿 maps／選用 height／ownership；不新增骨牌 geometry、遊戲規則或物理。

種類另支援 `woodenspoons`（木匙）：4×4 交替水平／垂直木匙，填實橢圓凹碗、高緣、連續細頸、漸寬扁柄與縱向纖維。Compact ellipse coverage 內含較小 smooth cavity，正寬度 tapered squared dome 配合兩端 compact bands 畫柄；bowl 依 coverage 替換低柄而不疊高，凹面高於 opaque backing。預算 16 tones、128×16 fibers／96×96 grain，零 support 跳過採樣，無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('woodenspoons', { seed: 7 })`；0.4 m dielectric tile、metallic 0，沿 maps／選用 height／ownership；不新增匙 geometry、容積／流體或食品安全認證。

種類另支援 `chessrooks`（城堡棋子）：4×4 交替水平／垂直象牙色側面，三齒冠／兩道向外開口、連續收腰柱身、上下 collars 與寬圓底座。Compact rectangular crown 扣兩道 notch、正寬度 tapered squared dome 畫 shaft、三個 compact ellipses 畫 collars／base；bounded coverage union 搭配 normalized component relief 防止接點疊高。預算 16 tones 與 96×96 grain，零 weight 跳過 grain，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('chessrooks', { seed: 7 })`；0.24 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership；不新增棋子 geometry、棋盤／棋規／棋力或物理。

種類另支援 `threadspools`（木軸紅線捲）：4×4 交替水平／垂直暗紅捲線筒、低連續木 core、較寬較高木端盤與粗糙線面。Compact squared-width masks 配合端 bands 畫 core／barrel、對稱 ellipse flanges 替換低線筒；十二週期 squared parabolic windings 跨 windingLength，弱斜向 offset，週期接縫斜率歸零。各層依 coverage 替換不疊高，預算 16 tones／phases 與 96×96 grain，零 support 跳過 grain、零 thread 跳過 winding，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('threadspools', { seed: 7 })`；0.24 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership；不新增線軸／紗線 geometry、解捲／張力或布料物理。

種類另支援 `bellpepperslices`（青甜椒橫切面）：4×4 交替方向三瓣綠色果肉環、低淡色胎座／三條膜、三空腔與六顆凸起附著籽粒。外／內 compact circle coverage unions 的差畫三瓣環，compact core 與三條 squared-width bands 支撐 ellipse seeds，胎座／籽裁進 outer support。低胎座替換環面、normalized seed relief 覆蓋胎座不疊高，空腔為低 opaque backing 而非 alpha。預算三軸、16 tones／96 seed tones／96×96 grain，零 support 跳過 grain，採樣無配置／hash／sqrt／atan2／trig。使用 `await ProceduralMaterial.create('bellpepperslices', { seed: 7 })`；0.32 m dielectric tile、metallic 0，沿 maps／選用 height／ownership；不新增 geometry、透明空腔或食物／生物／流體模擬。

種類另支援 `sharkteeth`（鯊齒）：4×4 交替水平／垂直象牙色尖三角琺瑯冠、兩側細鋸齒、較低粗糙雙葉根、連續 neck 與根部向外開口。Compact halfplanes 畫 crown，squared parabolic periodic width bumps 在 tip／base fade，positive dome floor 避免冠面內近尖端除以零。低 neck 連接兩個 compact ellipse roots，normalized root dome 配合 coverage 替換防止疊高。預算 16 tones／phases 與 96×96 grain，零 support 跳過 grain，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('sharkteeth', { seed: 7 })`；0.24 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership；不新增 geometry、物種／年代鑑定、牙科／生物模擬或物理。

種類另支援 `grinderburrs`（鋼研磨刃環）：4×4 seeded 轉向圓環、六道較高較平滑彎刃、較低較粗 filled grooves、中央孔與三安裝孔。Squared-radius annulus／compact hole masks 露出低 opaque 金屬 backing；整數六 flutes 閉合 angle branch，bore 零 support 避開 atan2 原點，squared-radius phase 使 squared parabolic periodic lands 彎曲而非直射線。預算 16 tones／phases、孔中心與 96×96 grain，採樣無配置／hash／sqrt／sin／cos，零 face 跳過 atan2／grain。使用 `await ProceduralMaterial.create('grinderburrs', { seed: 7 })`；0.4 m opaque metal tile、metallic 1 含 backing，createMaterial factor／maps／選用 height／ownership 同步；不新增研磨 geometry、切削／咖啡研磨模擬或物理。

種類另支援 `cowhide`（黑白斑短毛牛皮）：不規則圓潤黑白色塊覆在連續短毛面上，重用 shortFur 的 40×32 seeded hair centers／axes、3×3 compact ellipse lookup、5×7 warp／96×64 grain。僅 cowhide 配置 4×4 pigment field，0.18 warp mix 配合 smooth threshold 畫色斑；pigment 不參與 height／roughness／AO，白黑邊界不刻假凹槽，舊 fur kinds 不配置新 patch field。使用 `await ProceduralMaterial.create('cowhide', { seed: 7 })`；0.8 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership；不新增毛髮 geometry、梳理／布料／生物或動物模擬。

種類另支援 `spaltedwood`（分區線淺木）：淺色縱向木紋與細而彎曲的深色真菌分區線。沿既有 cached anisotropic wood pattern 預算 96×4 grain／192×8 fiber、4×5 zone／8×8 variation；弱 variation 混合 coarse zone，正值變動寬度 compact isoband 畫色素線。Line 不參與 height／roughness／AO，保留連續微木紋而非挖裂縫／缺木；採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('spaltedwood', { seed: 7 })`；0.6 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership；不新增 geometry、腐朽／真菌生長／生物模擬或結構安全判定。

種類另支援 `canlids`（金屬易拉罐蓋）：圓形沖壓蓋面、補強凸環、細凹刻線、雙孔拉環與更高鉚釘。預算 16 seeded cell tones／96×96 grain，4×4 交替直橫排列；compact squared-radius disk／annular bands 與橢圓 tab／holes／rivet supports 採樣無配置／hash／sqrt／trig。Replace layers 避免交點 height 疊加，兩孔露下方完整蓋面，非通透洞。使用 `await ProceduralMaterial.create('canlids', { seed: 7 })`；0.28 m opaque metallic tile、metallic 1，沿 maps／選用 height／ownership；不新增 geometry、開罐／撕裂／變形或力學模擬。

種類另支援 `crinoidossicles`（海百合莖節化石）：石灰質基質內淺圓盤、五瓣星狀沉積填充管腔與 20 道淺放射關節細脊。預算 16 份 tone／phase／radius²／inverse bevel、96×96 grain／16×16 sediment；飽和中心遮 angular pole，單一五次角 cosine 畫 lumen，以其 T4 harmonic 共用計算 20 道細脊，compact squared-radius annular fade 避免中心奇點。採樣無配置／hash／sqrt，僅盤內非飽和中心區需 atan2／一次 cosine。使用 `await ProceduralMaterial.create('crinoidossicles', { seed: 7 })`；0.08 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership；不新增 geometry、透明孔洞、物種鑑定或古生物／生物模擬。

種類另支援 `pythagoreantiles`（畢氏雙尺寸方磚）：邊長 2:1 的深大／淺小方磚與共用凹灰縫。(2,1)／(-1,2) 晶格形成正方重複週期 5，各五大／小方磚；owner id (i+2j) mod 5 在 UV 整數移動後不變，預算十份 tones／64×64 grain。每點四個可能大方磚與一小方磚用 compact square bevel，各完整磚面跨晶格不被假縫切斷、面不重疊；height／roughness／AO 與凹 mortar 一致。採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('pythagoreantiles', { seed: 7 })`；0.4 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership；不新增 geometry、施工／結構或物理模擬。

種類另支援 `dinnerforks`（金屬餐叉）：四根圓端漸細叉齒、三道 opaque-backed 開口、接合寬頭／細頸／漸寬柄尾。沿 haircombs 只取最近一齒，其 compact tapered support 在 owner 交界前歸零；tip/end ramps 與正值 smooth body width 保持 C1。Bounded body/tine union 配合 normalized component relief，避免齒根交點疊高；預算 16 tones／96×96 grain、4×4 交替直橫，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('dinnerforks', { seed: 7 })`；0.96 m opaque metallic tile、metallic 1，沿 maps／選用 height／ownership；不新增餐具 geometry、通透孔洞、食物接觸／變形或物理模擬。

種類另支援 `goldbrocade`（金線花葉織錦）：重用 damask 預算 12 compact Cartesian lobes、phase／detail，凸金線花葉覆深色 dielectric cloth，舊 damask 輸出不變。64 週期 warp／weft bounded union 乘 motif coverage 形成 gold mask，同步混合 color／height／roughness／AO／metallic；花內織隙仍為非金屬，不是實心金牌。無金線處略過 satin cosine／gold layer，不增採樣配置／hash。使用 `await ProceduralMaterial.create('goldbrocade', { seed: 7 })`；0.24 m opaque mixed-metallic tile、material metallic factor 1 保留 authored map 分區而非將底布變金屬，maps／選用 height／ownership 不變；不新增紗線 geometry、透洞、紡織／布料／光譜或物理模擬。

種類另支援 `mudtiretracks`（泥地雙輪胎痕）：兩道凹輪轍、各 36 道弧形胎塊壓痕與微凸泥緣。預算兩份 seeded phases／8×8 soil／128×128 grain；最近 track 的 compact squared transverse support 刻低輪轍，transverse² warp 讓 periodic compact lug bands 彎曲且頂點無 abs 尖角。外側 squared-distance band 略抬泥緣、輪轍內外都是連續 opaque ground；裸泥提早略過 lug phase。採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('mudtiretracks', { seed: 7 })`；3 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership；不新增 terrain geometry、車輪／碰撞／動態變形／車輛或物理模擬。

種類另支援 `peacockfeathers`（金綠眼斑孔雀羽毛）：亮金外圈、綠內帶與偏心深 pupil。重用 feathers 8×4 seeded variation／lean、periodic back-to-front vane coverage 與 rounded 羽軸羽枝起伏；compact outer／inner／pupil 只改 pigment，不改 height／roughness／AO／metallic，pupil 保留高羽軸而非凹洞。僅此 kind 預算眼斑 ellipse inverses，不增採樣配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('peacockfeathers', { seed: 7 })`；0.64 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership；不新增羽毛 geometry、透洞、梳理／鳥類／生物或虹彩光學模擬。

種類另支援 `tangramtiles`（七巧板釉面瓷磚）：兩大／一中／兩小直角等腰三角形、一正方形、一平行四邊形拼正方格，inset 前面積 1/4×2、1/8×3、1/16×2。沿 cairotiles 預算 23 個 normalized half-planes，smooth inset shoulder 保留等垂直寬灰縫；2×2 佈局共 28 seeded tones／64×64 grain。包括 roughness 在內的 grain 貢獻乘 coverage，避免零支撐 early-out 跳變；採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('tangramtiles', { seed: 7 })`；0.6 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增磚塊 geometry、互動拼圖或物理模擬。

種類另支援 `batterypositivecaps`（圓柱電池正極端蓋）：金屬外蓋／捲邊、淡色非金屬絕緣環與凸金屬接點。沿 grommetcanvas replacement blending 與 canlids squared-radius shoulder，以三層 compact covers 一起混合 color／height／roughness／AO／metallic；material metallic factor 1 保留 authored map，而非將絕緣環變金屬。4×4 佈局預算 16 seeded tones／96×96 grain；外蓋支撐外略過內層工作，取樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('batterypositivecaps', { seed: 7 })`；0.12 m opaque mixed-metallic tile，沿 maps／選用 height／ownership，不新增電池 geometry、導電／電化學／電路或物理模擬。

種類另支援 `passionfruitslice`（黃百香果切面）：橢圓果皮／淡色厚內皮、中央填實果漿與散佈深籽凸金果囊。沿 driedfigslice compact owner 慣例，4×4 果實各預算 8×8 jitter／rotation seed poses／96×96 grain；jitter + 最大 support 0.488 <0.5 owner 單位，僅查最近 cached cell，不掃鄰格。Normalized ellipse shoulders 逐層混合 fruit／pith／pulp，果漿裁切邊緣果囊；果囊 coverage 混合 color／height／roughness／AO，較小深籽只改 pigment 而非凹孔。Body／pulp 支撐外略過內層，取樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('passionfruitslice', { seed: 7 })`；0.32 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增果實 geometry、透明／SSS／透射、生物或物理模擬。

種類另支援 `screwterminalblocks`（塑殼螺絲端子台）：綠色 dielectric 塑殼／沉孔、金屬十字槽螺絲與 backed 接線口內較低金屬接片。沿 compact slab／radial masks 與 bounded 兩有限長槽 union，四臂十字槽降低色／height／AO 而仍為金屬；housing support 裁切子層，接線口低底為 opaque 非金屬。4×4 佈局預算 16 tones／96×96 grain；inactive head／port／contact 略過後續工作，取樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('screwterminalblocks', { seed: 7 })`；0.08 m opaque mixed-metallic tile、material metallic factor 1 保留導體／塑殼 map 分區，沿 maps／選用 height／ownership，不新增元件 geometry、通透孔洞、導電／電路／機構或物理模擬。

種類另支援 `dragonfruitflesh`（白肉火龍果果肉）：連續淡白果肉中散佈細長黑籽，不是 dragonfruit 果皮苞片或整顆果實圖樣。沿 compact cached seed lookup，預算 20×20 seeded jitter／rotation poses／96×96 grain；jitter + 最大 support 0.44 <0.5 owner 單位，ellipse 在查表 owner 切換前歸零，不掃鄰格。Kernel 僅混合 pigment／roughness，height／AO 跨籽保持連續而非孔洞，取樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('dragonfruitflesh', { seed: 7 })`；0.06 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增果實 geometry、透明／SSS／透射、生物或物理模擬。

種類另支援 `speakercones`（黑色揚聲器紙盆）：凹紙盆／細放射紋、中央凸防塵蓋與較高 rounded rubber surround。4×4 佈局預算 16 seeded phases／96×96 grain；沿 squared-radius covers／compact annular bands replacement blend 外框／懸邊、parabolic 紙盆與防塵蓋，不疊層抬高。48 ribs 僅在雙 radial fade annulus 內算 atan／cos，完全排除極點與紙盆／懸邊接縫；支撐外略過後續工作，採樣無配置／hash／sqrt。使用 `await ProceduralMaterial.create('speakercones', { seed: 7 })`；0.64 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增喇叭 geometry、通透孔洞、聲學／電機／振膜或物理模擬，不改 Audio。

種類另支援 `septarianstone`（龜甲石）：閉合棕石之間由連續乳金方解石填滿。重用 cached jittered Voronoi 半平面建表，新材質 8×8、crackleglaze 保留原 16×16 geometry；bounded 3×3 candidates 的 compact C1 products 讓 cell tone 隨 face 淡出，零覆蓋提早停邊。預算 grain／脈寬／雙 warp fields，取樣無配置／hash／sqrt／trig。Calcite 微凸且 roughness 較低，填脈而非挖黑凹裂縫。使用 `await ProceduralMaterial.create('septarianstone', { seed: 7 })`；0.48 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增岩石 geometry、透明晶體、礦物層或地質／物理模擬。

種類另支援 `axialresistors`（軸向電阻）：圓頭絕緣 capsule、三道深色塗裝環及分開的一道淡環、兩端金屬引腳。Compact shaft 先繪較低引腳，再以較高 rounded capsule replacement 混合所有 PBR 欄位，metallic 隨 body coverage 歸零。預算 16 tones／96×96 grain、4×4 交替斜向；三深環 bounded nearest-band 查單環，support 在 ownership 切換前歸零。塗裝僅改 pigment／roughness、不改 relief／metallic；雙支撐零時略過 grain，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('axialresistors', { seed: 7 })`；0.12 m opaque mixed-metallic tile、預設 factor 1，沿 maps／選用 height／ownership，不新增阻值編碼、元件 geometry、導電／電路／電熱或物理模擬。

種類另支援 `tomatoslices`（番茄切面）：紅果皮／實心紅肉隔膜與中央胎座、五個填實膠質種室各兩淡籽。沿 cached rotated chamber axes／squared-radius covers，預算 4×4×5 axes、16 tones／96×96 grain；compact chamber 分隔於 flesh radius 內，gel 正值才算種子 ellipse。膠質較低但仍填實、籽微凸，內切面 AO 不刻成孔；body 零時略過 grain／chambers，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('tomatoslices', { seed: 7 })`；0.32 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增果實 geometry、透明／SSS／透射、生物或物理模擬。

種類另支援 `pinstripewool`（細直條羊毛布）：深藍 2-over-2 twill 中每八根經紗一根淡色，深緯紗交織遮住染色。與 twillweave 共用 compact warp／weft、exposure／relief，舊 preset 與運算不變；compact support 在 cell ownership 前淡出 pigment，染色不新增 height／roughness／AO 凸條。48×48 紗線／128×128 cached grain 避免 size 32 僅採到 64 線 gap 的退化，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('pinstripewool', { seed: 7 })`；0.08 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增紗線 geometry、透孔、毛髮／sheen BRDF、布料或物理模擬。

種類另支援 `chrysanthemumstone`（菊花石）：黑拋光石內嵌淡色放射晶瓣與共用 pale hub，不是植物凸花／凹花心。沿 cached rotated compact ellipse，預算 16 rosette poses／每組 12 axes 及 reciprocal squared extents／96×96 grain；jitter + conservative support 0.454 <0.5 owner，查單 cell、無角度極點／鄰格掃描。支撐外略過 blades，完全覆蓋提早停瓣；晶紋只改 pigment／roughness，height 僅 grain、AO 連續，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('chrysanthemumstone', { seed: 7 })`；0.48 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增岩石／晶體 geometry、透明／晶體折射、礦物鑑定／地質或物理模擬。

種類另支援 `sewingsnaps`（公母金屬暗釦）：公釦 domed post／母釦 metal socket 交替、rounded rim 與四個 cardinal 縫孔。沿 squared-radius covers／coherent mixed-metallic replacement，預算 16 tones／96×96 grain。縫孔只查最近 cardinal center，compact support 在 axis／sign owner 邊界前歸零；縫孔／母孔覆 opaque 非金屬 backing，凹座 collar／公柱仍 metallic。Body 零時略過後續，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('sewingsnaps', { seed: 7 })`；0.12 m opaque mixed-metallic tile、factor 1，沿 maps／選用 height／ownership，不新增 geometry、通透孔、縫線、扣合／彈簧或物理模擬。

種類另支援 `lathplaster`（木條灰泥牆）：高淡灰泥脫落露出較低水平木條與更深 opaque gap floor。沿 compact patch masks／coherent replacement，四 seeded rotated／warped loss 區 conservative support <0.437 owner、查單 cell；16 laths 的 row tone／fiber 在 owner 切換前隨 compact cover 歸零。預算 96×96 灰泥粒、4×128 水平木纖維、雙 8×8 warp；完整灰泥略過 wood sample，採樣無配置／hash／sqrt／trig，脫落向下露底而非捲高邊。使用 `await ProceduralMaterial.create('lathplaster', { seed: 7 })`；0.8 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增牆體 geometry、通透孔、釘／縫線、破壞／結構或物理模擬。

種類另支援 `ceramiccapacitors`（徑向陶瓷電容）：凸絕緣陶瓷圓片、同側雙金屬引腳與覆層 roots。沿 compact paired shafts／ellipse cover／coherent replacement，預算 16 tones／96×96 grain／reciprocal squared extents、4×4 交替斜向；nearest-sign 引腳 support 在 sign owner 切換前歸零。較低 metal leads 先覆背底，再以高 convex dielectric disc 包根，metallic 隨 coating coverage 歸零；雙 support 零時略過 grain，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('ceramiccapacitors', { seed: 7 })`；0.12 m opaque mixed-metallic tile、factor 1，沿 maps／選用 height／ownership，不新增電容量編碼、元件 geometry、導電／電路／電熱或物理模擬。

種類另支援 `fennelseeds`（茴香籽）：彎曲尖梭輪廓與五條凸縱肋。沿 cached poses／compact spindles／coherent fields，64 rotated／jittered poses 預算軸向／tone、96×96 grain。Quadratic bow／squared tapered cap 造尖梭體；五 finite compact ribs 以 outside-product union 收斂，不除消失尖端寬度、不 nearest-rib selection。Conservative support <0.418 owner、查單 cell，body 零略過 ribs／grain，預算 reciprocals，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('fennelseeds', { seed: 7 })`；0.096 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增種子 geometry、重疊散佈、植物生長／營養／味道或物理模擬。

種類另支援 `ballbearingfaces`（開放式滾珠軸承端面）：同心內外圈、低連續滾道、八凸鋼球與 opaque 非金屬中心孔／背底。沿 compact squared annular covers／squared-band channel／coherent sphere replacement，預算 16 tones／96×96 grain／reciprocal extents；cardinal／diagonal octant 單次查球，radius 0.073 小於 owner 分界距離 0.29 sin(π/8)、support 先歸零，不逐球 scan。Face 零略過 channel／sphere／grain，採樣無配置／hash／sqrt／atan2／trig。使用 `await ProceduralMaterial.create('ballbearingfaces', { seed: 7 })`；0.16 m opaque mixed-metallic tile、factor 1，沿 maps／選用 height／ownership，不新增軸承 geometry、透明孔、保持架、滾動／旋轉／潤滑／機械或物理模擬。

種類另支援 `baseballleather`（棒球白皮革）：白細紋皮革上雙鏡向彎曲低接縫、每列兩紅凸線，非橄欖球綁帶。沿 cached grain／compact seam／capsule thread replacement，預算 40 row tones／96×96 grain／reciprocals；periodic polynomial bow 於 V wrap 導數歸零，單 mirrored side lookup、thread support 在 side／row owner 前歸零。White leather→低接縫→高紅線 coherent PBR replacement，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('baseballleather', { seed: 7 })`；0.24 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增球體／線材 geometry、完整球面裁片 UV、規格認證、縫製／布料／碰撞或物理模擬。

種類另支援 `toothbrushheads`（牙刷頭）：藍膠囊塑膠底上十八束較高粗白刷毛冠面。沿 squared capsule cover／compact crown／nearest-grid coherent replacement，預算 16 base tones／288 tuft tones／96×96 grain／256×256 bristle grain／reciprocals；4×4 交替斜向、每頭 3×6，冠 radius 0.038 <半 pitch 0.05，在 nearest owner 前歸零，皆在 capsule full cover 內。Face 零略過 tufts／grain、tuft 零略過 bristle grain，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('toothbrushheads', { seed: 7 })`；0.12 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增刷頭／個別刷毛 geometry、刷柄、透明孔、彎曲／刷牙／清潔或物理模擬。

種類另支援 `bowtieinlay`（蝴蝶木榫補片）：齊平深木榫橫跨彎木裂縫，非邊端燕尾接合。沿 cached orthogonal grain／compact hourglass／coherent replacement，預算 6 tones／128×8 板縱紋／8×128 榫橫紋／96×96 micro／4×12 warp／reciprocals；squared ends×smooth squared flare sides 形成 2×3 keys，support 在 owner 前歸零。木榫恢復裂線降低的高度／AO，與板面同微紋高度包絡、不加凸片；key 零略過橫紋，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('bowtieinlay', { seed: 7 })`；0.6 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增木作 geometry、透明孔、實際結構補強／強度認證、斷裂／破壞或物理模擬。

種類另支援 `redcabbagecut`（紫甘藍切面）：填實紫層上蜿蜒淡脈、淡實芯與深外葉緣。沿 squared cut masks／cached warped phase／coherent filled tissue，預算 4 tones／96×96 grain／16×16 warp／32×32 fold／reciprocals；squared-radius phase 用 Cartesian fields 折出細脈、phase-floor 兩側 plateau，中心無 polar angle／radius 除法。Compact ellipse pith 與淡脈只改 pigment／roughness、共享填實 height／AO；face 零略過 grain、flesh 零略過 warp／fold／pith，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('redcabbagecut', { seed: 7 })`；0.48 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增 geometry、透明葉片、透射／subsurface 求解、植物生長／解剖認證或物理模擬。

種類另支援 `slottedturners`（金屬煎鏟頭）：圓角鏟面、三封閉長槽與同高短頸。沿 rounded-rectangle／capsule union／compact closed slots／coherent coverage，預算 16 tones／8×128 brushed grain／reciprocals、4×4 交替斜向。三 slot supports 在 full blade cover 內、radius 0.035 <半 pitch 0.07，在 nearest owner 前歸零；visible=body union×(1−slot) 一次覆 opaque 非金屬背底各 fields 與 metallic，blade／neck 共用一金屬高度、不疊高。Body／visible 零略過後續 fields／grain，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('slottedturners', { seed: 7 })`；0.32 m opaque mixed-metallic tile、factor 1，沿 maps／選用 height／ownership，不新增 geometry、完整長柄、透明槽、彎曲／翻炒／熱傳導或物理模擬。

種類另支援 `triglidesliders`（塑膠日字調節扣）：無扣針雙封閉窗框與同高中桿。沿 squared rounded covers／compact mirrored cutouts／coherent replacement，預算 16 tones／96×96 grain／reciprocals、4×4 交替斜向；window support 在 sign owner 前歸零、角 support 限於 cell。Visible=outer×(1−window) 一次覆 opaque 背底各 fields，中桿與框齊平、不凸扣舌；face／visible 零略過後續 fields／grain，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('triglidesliders', { seed: 7 })`；0.16 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增扣具／背帶 geometry、透明孔、穿帶／滑動／摩擦／承重認證或物理模擬。

種類另支援 `popcorn`（爆米花）：不規則淡白連接膨瓣、低焦金尖殼芯，不含 cottonbolls 苞片。沿 cached poses／compact squared lobe unions／coherent replacement，預算 16 poses／112 lobe centers-radii／128×128 grain／reciprocals。4×4 seeded 旋向，lobes 距離／半徑／角度不同；product union 不疊高、平方 dome envelope 保持肩 C1，彎曲 tapered hull 在 central puff 內覆低殼芯。Support 限 cell，puff 零略過 hull／grain、採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('popcorn', { seed: 7 })`；0.24 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增 geometry、透明孔、爆裂／烹煮／熱傳導、營養或物理模擬。

種類另支援 `dualinlinechips`（雙列直插 IC）：黑圓角封裝、每側七低金屬腳／第一腳定位凹點。預算 16 tones／96×96 grain／reciprocals，4×4 交替斜向；squared rounded package 覆 compact mirrored capsule leads，radius 0.019 <半 pitch 0.045，nearest／sign owner 前歸零、角 support 限 cell。低金屬腳先覆背底，dielectric 封裝再覆根並消 metallic；凹點在 full package 內降低實芯、不成孔。Body／pin 零略過 fields／grain，body 零略過 marker；採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('dualinlinechips', { seed: 7 })`；0.16 m opaque mixed-metallic tile、factor 1，沿 maps／選用 height／ownership，不新增 geometry、透明孔、連線、電氣／邏輯／熱傳導／焊接或物理模擬。

種類另支援 `tortoiseshellacetate`（玳瑁紋醋酸纖維塑膠）：平滑琥珀拋光面／不規則深褐斑，非 `tortoiseshell` 天然隆起甲片。預算 12² macro／32² detail／兩份 4² warp／192² grain／reciprocal；periodic domain warp＋two-scale pigment smooth threshold 只影響顏料。獨立 grain 的 height range <0.0000021 m、roughness 0.2–0.218／AO 1，深斑不成洞／甲片／縫。所有 fields periodic C1，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('tortoiseshellacetate', { seed: 7 })`；0.2 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增 geometry、透明／透射／折射、化學製程、天然殼材或物理模擬。

種類另支援 `cathedralquilt`（教堂窗拼布）：奶油色弧形高折邊包低藍布窗，非直線 quilting。預算 36 tones／192² grain／128×8 warp／8×128 weft／reciprocal、6×6 windows。完整四 corner-circle covers 相乘，不 nearest corner 以免窗尖 cusp；fold=outer−inset 不疊高，inset／seeded tone 在 cell edges 前 C1 歸零。Frame／高 fold／低 inset 共用 opaque 布面 fields，inset 零略過 tone；採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('cathedralquilt', { seed: 7 })`；0.6 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增布料 geometry、透明窗、折疊／縫製／布料力學或物理模擬。

種類另支援 `buckwheathulls`（蕎麥帶殼籽粒）：三角褐籽、三圓滑面／細高稜，非長條茴香籽。預算 64 seeded rotation-jitter-tone poses／3 axes／128² grain／reciprocals，8×8 cells；三 smooth plane covers 的 product 決定 compact 三角／convex crown，三 finite ridges 在中心／尖端前 taper 歸零、product union 不疊高。Support 限 cell、body 零略過 ridges／grain，pigment／較低稜粗糙度與 height 共用 ridge support；採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('buckwheathulls', { seed: 7 })`；0.064 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增種子 geometry、透明孔、剝殼／生長／烹煮、營養或物理模擬。

種類另支援 `rutilatedquartz`（針狀金紅石石英）：opaque 乳白拋光平面、每 cell 兩組各三交叉金褐 dielectric 尖針。4×4 預算 32 bundle rotations／96 inverse squared lengths／8² cloud／128² grain／reciprocals，角差 0.9–1.3 rad，radius 0.008 <半 pitch 0.0225，compact tapered cover 在 nearest owner／cell edge 前歸零。空 width 略過 cap，product union 只改 pigment、不轉金屬線／高脊／AO 孔洞，獨立 grain 維持同一平石面；採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('rutilatedquartz', { seed: 7 })`；0.2 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增 geometry、透明／透射／折射、晶內深度、多層體積散射、礦物生長或物理模擬。

種類另支援 `peppermintcanes`（薄荷拐杖糖）：中性 opaque 底紅白鉤管／長軸短尾。預算 16 tones／96² grain／reciprocals，4×4 交替斜向；true squared centerline distance 將等寬 upper semicircle 接直線 tangents／rounded caps，只在 arc branch 用一次必要 radial sqrt，採樣無配置／hash／trig。Owner／cell edge 皆在 compact support 外；smooth periodic stripes 只換 pigment，不改 tube dome／roughness。沿既有 `mortar=1−body` 混中性底以保紅條辨識，body 零略過 grain／stripe。使用 `await ProceduralMaterial.create('peppermintcanes', { seed: 7 })`；0.32 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增 geometry、透明孔、糖晶／溶化／烹煮、營養或物理模擬。

種類另支援 `rubbergrommets`（橡膠護線環）：高內唇／低外法蘭／閉環凹槽，全非金屬，不是 `grommetcanvas` 帆布金屬雞眼。預算 16 tones／96² grain／squared radii／reciprocals、4×4 cells；compact smooth outer/bore products 定 body，同層 stepped collar 與 squared radial groove 皆在 full body 內。孔底／外背是低 opaque dielectric、不成 metal，support 限 cell，body 零略過 collar／groove／grain；採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('rubbergrommets', { seed: 7 })`；0.16 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增扣件／線材 geometry、透明孔、彈性／密封／穿線／電氣絕緣認證或物理模擬。

種類另支援 `chioggiabeetcuts`（Chioggia 甜菜切片）：六圈平齊紅色顏料環／白間隙／白實芯、較低薄紅皮。預算 16 jitter／scale／tone poses、六圈 squared shoulders／reciprocals 與 128² grain；內外 smooth products／product union 支撐完整落在 full flesh 內，紅白共用 height、不作凸階或中空。Support 限 seeded cell，body 零略過 grain／flesh、flesh 零略過環；採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('chioggiabeetcuts', { seed: 7 })`；0.24 m opaque dielectric tile、metallic 0，沿 neutral backing／maps／選用 height／ownership，不新增 geometry、透明孔、汁液、切割／生長／營養或物理模擬。

種類另支援 `flatflexcables`（扁平軟排線）：琥珀絕緣薄片／六條埋藏導線淺脊、單端六枚較低銀色露出接點。預算 16 tones／128² grain／squared radii／reciprocals，4×4 alternating ±45° compact rounded strips，half-integer nearest-contact owner 定六組分離 trace／rounded capsules。Trace／contact 支撐皆在 full body；埋藏線只改 dielectric 顏色／起伏，contact coherent replacement 定 metallic coverage，film／縫／對端／背底皆零。Body 零略過 owner／grain／contact，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('flatflexcables', { seed: 7 })`；0.24 m opaque mixed-metal tile、預設 factor 1，沿 neutral backing／maps／選用 height／ownership，不新增 cable／connector geometry、透明膜、彎折／導電／耐熱認證或物理模擬。

種類另支援 `celerycuts`（芹菜橫切片）：旋轉開口彎月形淺綠果肉／較低薄綠皮／五個暗色 solid 維管束凹點。預算 16 rotations／tones、五個 centers、128² grain 與 squared ellipse／circle reciprocals；outer ellipse 減 offset notch 的 smooth products 定 body，小 outer／大 notch 定 flesh，其支撐皆在 full body；五圈 product union 支撐皆在 full flesh。Coherent replacement、support 限 cell，body 零略過 grain／flesh、flesh 零略過 vascular，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('celerycuts', { seed: 7 })`；0.24 m opaque dielectric tile、metallic 0，沿 neutral backing／maps／選用 height／ownership，不新增 geometry、透明孔、汁液、切割／生長／營養或物理模擬。

種類另支援 `tactileswitches`（四腳輕觸開關）：低銀色接腳／黑色絕緣外殼／較高金屬蓋／最高黑色實芯按柱。預算 16 tones／128² grain／squared radii／reciprocals、4×4 alternating ±45° cells；pins→housing→cover→plunger 四層 coherent replacement，外殼遮根清 metal、按柱遮蓋清 metal。Cover 支撐全在 full housing、plunger 全在 full cover，metal map 僅露出腳／蓋。空 body/pin 略過 grain、空 body 略過 cover/plunger、空 cover 略過 plunger，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('tactileswitches', { seed: 7 })`；0.24 m opaque mixed-metal tile、預設 factor 1，沿 neutral backing／maps／選用 height／ownership，不新增 geometry、按壓／導電／開關邏輯／耐久認證或物理模擬。

種類另支援 `paisleybrocade`（paisley 織錦）：深藍織布／旋轉彎尖金色非金屬紗線輪廓／三內點。預算 16 rotations／tones、三個 dot centers、192² grain／128×8 warp／8×128 weft 與 reciprocals；quadratic bend／變寬／squared tapered cap 定 field，兩 smooth shoulders 差定 outline，三圈 product union 支撐全在 full inset。Coherent yarn replacement、compact support 限 cell、尖端零斜率消失；空 outer 跳過 inset/dots、空 inset 跳過 dots，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('paisleybrocade', { seed: 7 })`；0.4 m opaque dielectric tile、metallic 0，內部仍低實心藍織布，maps／選用 height／ownership 不變，不新增 yarn geometry、透明孔或布料物理。

種類另支援 `siliconepastrybrushes`（矽膠烘焙刷）：橘色一體長柄／寬頭／七分離低刷齒。預算 16 tones／128² grain／squared radii／reciprocals、4×4 alternating ±45° cells；capsule 柄／rounded 頭／nearest-owner capsule 齒三層 coherent replacement，head 蓋頸與齒根，各交接中心有 full coverage overlap，齒間仍 neutral opaque 底。柄端 pit support 全在 full handle、保持 solid；全部支撐限 cell／prong owner，全 dielectric。空 silhouette 略過 grain、空 handle 略過 pit、空 head 略過最終 replacement，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('siliconepastrybrushes', { seed: 7 })`；0.32 m opaque dielectric tile、metallic 0，maps／選用 height／ownership 不變，不新增 geometry、毛刷／液體／彎折物理、食品接觸／耐熱認證。

種類另支援 `graphicgranite`（文象花崗岩）：粉色長石拋光面上 stylized 尖細石英交生紋。預算 16 tones、96 stroke centers／axes／inverse lengths and widths、8² clouds／192² grain／shoulder reciprocal；4×4 cells 各三 jittered roots／兩 seeded tapered strokes，cap²−across² 的 smooth cover 以 product union 定 quartz pigment，尖端零斜率歸零、支撐限 cell。深淺礦物共用 microheight／roughness、AO 1；空 along 跳過 across、union 滿即停、full quartz 跳過 feldspar cloud，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('graphicgranite', { seed: 7 })`；0.2 m opaque dielectric tile、metallic 0，maps／選用 height／ownership 不變，不作凹刻文字、geometry、透明石英、晶體生長或物理模擬。

種類另支援 `brasspadlocks`（黃銅掛鎖）：封閉 U 梁／高黃銅鎖身／低非金屬實芯孔紋。預算 16 tones／128² grain／squared radii／reciprocals、4×4 alternating ±45° cells；上弧一個必要 radial sqrt 定真等寬 squared distance、與 straight tangents C1 相接，rounded body 蓋根。Full body 跳過 shackle work、空 silhouette 跳過 grain、空 body 跳過 keyhole。Circle／capsule stem 的 smooth product union 支撐全在 full body，coherent recess replacement 清 body metal，支撐限 cell；採樣無配置／hash／trig、僅 upper arc 一個 sqrt。使用 `await ProceduralMaterial.create('brasspadlocks', { seed: 7 })`；0.24 m opaque mixed-metal tile、預設 factor 1，沿 neutral backing／maps／選用 height／ownership，不新增 geometry、透明孔、開鎖／鎖定狀態／安全認證或物理模擬。

種類另支援 `carrotcuts`（胡蘿蔔切片）：橙色平切面／淡實心髓心／12 尖細放射維管束色紋／薄深皮。預算 16 rotation／jitter／inverse scale／tone poses、12 axes／128² grain／squared circle radii／reciprocals；cap²−across² smooth cover 以 product union 定 rays，pith 只蓋色，兩者共用 full flesh 的 flat height／roughness／AO 0.99。空 body／flesh 跳過後續、full pith 跳過 rays、空 along 跳過 across；尖端零斜率歸零、支撐全在 full flesh 與 cell，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('carrotcuts', { seed: 7 })`；0.24 m opaque dielectric tile、metallic 0，沿 neutral backing／maps／選用 height／ownership；非 Chioggia 紅環或 citrus 分隔凹槽，不新增 geometry、透明髓心、汁液／切割／生長／營養或物理模擬。

種類另支援 `bluepushpins`（藍色塑膠圖釘）：雙寬凸緣／細腰身／更低露出銀色金屬尖針。預算 16 tones／128² grain／squared flange and neck radii／reciprocals、4×4 alternating ±45° cells；rounded-rectangle flanges／capsule waist product union 定 plastic，needle 的 cap²−across² smooth cover 尖端零斜率。Needle→neck→base→top coherent replacement，plastic 蓋 roots 並清 metal；full plastic 跳過 needle、空 along 跳過 across、空 silhouette 跳過 grain、空 plastic 跳過 replacements，silhouette union 定 neutral backing、支撐限 cell、採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('bluepushpins', { seed: 7 })`；0.16 m opaque mixed-metal tile、預設 factor 1，沿 maps／選用 height／ownership，不新增 geometry、穿刺／固定承重／透明度或物理模擬。

種類另支援 `oatflakes`（壓片燕麥）：寬扁淡色橢圓片／微不規則邊／低實心中央壓痕／六細縱向纖維。預算 16 rotation／jitter／inverse scale／tone poses、三 paired fiber rows／inverse lengths、64² rim／192² grain／reciprocals，compact ellipse coverage 僅 rim transition 採 noise、coarse 空支撐與 full coverage 跳過 rim work。Pointed crease／fiber cap²−across² smooth covers 支撐全在 full body、端尖零斜率，nearest-row owner 交界在零支撐。Coherent body replacement 保持 low dome 與 opaque 壓痕底／neutral backing，空 body/detail 跳過後續、採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('oatflakes', { seed: 7 })`；0.06 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership；非細長 rice、彎曲 fennel seeds 或三稜 buckwheat hull，不新增 geometry、透明裂縫、烹煮／營養或物理模擬。

種類另支援 `tigerfur`（虎斑毛皮）：橙底／六深色波紋主帶／每行兩連根尖細分枝。擴充既有 shortFur sampler，重用 5×7 warp／96×64 grain／40×32 compact C1 directional hair records 及 pigment-independent pile height／roughness／AO，只新增六行 phase／side 和四 reciprocals。Squared-distance parent band 與 cap²−across² pointed branches product union 定 pigment，分枝先連根再尖端分離，非僅 zebra 改色；row owner 邊界前支撐歸零。Full band 跳過 fork、空 along 跳過 across，新增 pigment 採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('tigerfur', { seed: 7 })`；0.4 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增毛髮 geometry、透明度、動物／毛髮／物理模擬。

種類另支援 `grosgrainribbons`（羅紋織帶）：四條藍織帶／64 compact 密橫肋／雙側各三較高連續布邊縱紋／中性 opaque 帶隙背底。預算四 ribbon tones／96×256 grain／squared radii／reciprocals；squared-distance body／weft／selvedge covers，布邊支撐全在 full body、nearest-wale owner 交界零支撐。Coherent body replacement 同步 color／height／roughness／AO，帶 owner 與兩 UV wraps C1；空 body 跳過 ribs／wales／grain、採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('grosgrainribbons', { seed: 7 })`；0.06 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership；非 corduroy 全面縱絨肋或扭曲 ribbonstreamer，不新增 geometry、透明帶隙、打結／布料／物理模擬。

種類另支援 `azuritemalachite`（藍銅礦／孔雀石）：綠基質上 stylized 三藍球簇、每球兩細礦物色帶。預算 16 rotation／jitter／inverse scale／tone poses、三 centers／八 annular coefficients、8² clouds／192² grain／squared radii／reciprocals；circle covers 與 annular covers 各 product union，ring 支撐全在 full globule、球簇支撐限 cell。兩礦物共用 polished microheight／roughness／AO 1，不作凸球／凹環；full blue/ring unions 跳過後續 coverage、空 ring extent 跳過 annuli、full green 跳過 blue pigment、full blue 跳過 matrix cloud，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('azuritemalachite', { seed: 7 })`；0.2 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership；非單球 jasper 或單礦物 malachite 起伏帶，不新增 geometry、透明晶體、礦物生長或物理模擬。

種類另支援 `openendspanners`（雙頭開口扳手）：兩大小不同較高開口鉗口，以細較低金屬柄連接。預算 16 tones／128² grain／五 squared radii／reciprocals、4×4 alternating ±45° compact tools；circle heads 各扣朝外 half-infinite rounded channel，封閉背面接 capsule shaft，heads 支撐互斥直接相加並共用 finish。Shaft→heads coherent replacement／product union 同步 metallic 與 neutral opaque backing，空 head 跳過 cut、空 silhouette 跳過 grain、空 shaft/head 跳過 replacement；caps／straight tangents C1、支撐限 cell，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('openendspanners', { seed: 7 })`；0.4 m opaque mixed-metal tile、預設 factor 1，沿 maps／選用 height／ownership；凹口仍 opaque dielectric 背底，不新增 geometry、透明鉗口、鎖固／扭矩／工具認證或物理模擬。

種類另支援 `lentilseeds`（小扁豆種子）：近圓整粒凸面與靠邊短低實心種臍。預算 16 rotation／jitter／inverse scale／tone poses、128² grain／ellipse squared-axis reciprocals／hilum squared-radius reciprocal；compact ellipse cover 的 smooth field 定 nonsingular convex dome，短 side capsule 支撐全在 full body、種臍仍 opaque 實芯凹痕而非裂口。Coherent body replacement 同步 color／height／roughness／AO 與 neutral backing，空 body 跳過 hilum／grain；seed owners／caps and straight tangents／UV wraps C1、採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('lentilseeds', { seed: 7 })`；0.04 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership；非 oatflakes 長中央壓痕、咖啡豆深中央溝或尖南瓜籽高殼邊，不新增 geometry、透明裂口、發芽／烹煮／營養或物理模擬。

種類另支援 `blueprintpaper`（工程藍圖紙）：深藍平紙／兩級格線／白色圓角板框、圓孔圖樣、十字中心線與尺寸短端刻線，非 graphpaper 純格紙。預算 8² cloud／192² grain、七組 squared radii／shoulder reciprocals 與 axis-fade reciprocal；periodic squared-distance grid 以 product union 交會，nested rounded-box／circle cover 差值定白色描框，有限 axes／dimension capsules 定中心和尺寸線；glyph bounds 外跳筆畫、full ink 跳後續 union。印墨僅 pigment，紙面 height／roughness／AO 不依墨跡、不刻格溝；grid owners／shoulders／caps and straight tangents／UV wraps C1、採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('blueprintpaper', { seed: 7 })`；0.4 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增 geometry、CAD 解析／輸出、文字排版或文件認證。

種類另支援 `horsechestnutleaf`（風格化七葉樹複葉）：七片尖端微鋸齒小葉，以細小葉柄接共同葉柄，中肋較高較亮，非楓葉連續掌狀裂片或銀杏連續扇面。預算 16 rotation／jitter／inverse scale／tone poses、七組 axes／centers／inverse lengths／tooth frequencies、128² grain／squared radii 與 reciprocals。Compact squared-cap 葉片各自從 blade base 起，以 capsule 小葉柄／root junction 接 common petiole；periodic smooth squared-phase wave 定 C1 微鋸齒、product union 合 support／midribs，stem→blade coherent replacement 同步 color／height／roughness／AO／neutral backing。Extent bounds 跳空白、coarse/full blade 跳 tooth、空 cover 跳 grain，seed owners／pointed tips／tooth wraps／caps/straight tangents／UV wraps C1、採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('horsechestnutleaf', { seed: 7 })`；0.8 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增 geometry、透明葉隙、植物生長／生理或物理模擬。

種類另支援 `binderclips`（長尾夾）：兩等寬銀色 U 線柄接黑塗層梯形夾身，下緣 lip 較高；露出 wire metallic 1，黑塗層／柄孔隙／外背 opaque dielectric、metallic 0，預設 factor 1。預算 16 tones／128² grain／squared radii／radial bounds 與 reciprocals、4×4 alternating ±45° tools；反射 y 合兩 U handles，true radial distance 定 constant width 並 C1 接 straight legs，必要 arc 在 inner/outer radius cull 後計一 sqrt。Full coat 跳 wire、空 silhouette 跳 grain、空 body 跳 lip；兩 squared-axis smooth covers product 定 tapered body，lip 全在 full coat，wire→coat coherent replacement 同步 color／height／roughness／AO 並清 metallic。Owners／arc-straight tangents／coated corners／caps／UV wraps C1、採樣無配置／hash／trig。使用 `await ProceduralMaterial.create('binderclips', { seed: 7 })`；0.32 m opaque mixed-metal tile，沿 maps／選用 height／ownership，不新增 geometry、透明孔、夾持／彈簧／承重或物理模擬。

種類另支援 `charoite`（風格化紫龍晶）：紫底扭曲密纖維束／淡色寬帶／稀疏深色實心包裹體，共同拋光面而非刻溝。預算 4²／7×5 warp、9² cloud／192² grain、8² compact inclusion pose slots／squared axes、兩級 band/fiber squared radii 與 reciprocals；共用 domain-warp phase 扭曲 periodic compact stripes，integer frequencies／phase wrap zero support 保 torus C1。Sparse rotated ellipse inclusions 只換 pigment、full dark 跳全部 flow，height／roughness 只用共同 tiny grain、AO 1，不讓纖維或深色包裹體凹陷。Inclusion owners／ellipse shoulders／noise knots／phase wraps／UV wraps C1、採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('charoite', { seed: 7 })`；0.2 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增 geometry、透明礦洞、礦物生成、動態貓眼光學或物理模擬。

種類另支援 `chenilleyarn`（雪尼爾絨線）：八條粉紅蓬鬆圓芯／各 128 列較高較亮短橫尖絨束／雙側伸出鬆絨邊，不作 corduroy 連續布面或 grosgrain 平帶高布邊。預算八 tones／1024 center/jitter／inverse length／slope／tone records、128×256 grain／core squared radii 與 fiber reciprocals；continuous core cover 與 compact cap² tufts product union，core→pile coherent replacement 同步 color／height／roughness／AO／neutral backing。Max horizontal/vertical support 0.46／0.476 皆在 owner ±0.5 前為零，單 owner lookup、不掃 neighbors；空 cover 跳 grain、full pile 跳 core finish、空 core 跳 dome。Core shoulders／tuft tips／slanted shoulders／owners／UV wraps C1、採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('chenilleyarn', { seed: 7 })`；0.08 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增 geometry、透明絨隙、線材拓樸、布料／毛髮或物理模擬。

種類另支援 `ceramicfuses`（陶瓷管式保險絲）：霧白凸圓陶瓷筒夾兩同寬金屬端帽／較高凸環，非電阻細引腳或透明玻璃；陶瓷／neutral opaque 外背 metallic 0、端帽 metallic 1、預設 factor 1。預算 16 tones／128² grain／rounded body／dome／end-band／collar squared reciprocals、4×4 alternating ±45° parts；共用 rounded-rectangle coverage 定外形、x² smooth dome 定橫向凸圓，y² smooth end bands 換 full-width metal finish，collar squared-distance cover 全在 full cap 區。Coherent finish replacement／共同 body→backing 同步 color／height／roughness／AO／metallic，空 body 跳 grain/finish、無 cap 跳 collar；owners／corner tangents／end-band and collar shoulders／UV wraps C1、採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('ceramicfuses', { seed: 7 })`；0.16 m opaque mixed-metal tile，沿 maps／選用 height／ownership，不新增 geometry、透明玻璃、電熱／熔斷模擬、額定值或安規認證。

種類另支援 `hazelnutshells`（整粒榛果殼）：略尖上端／圓鈍下半部／隨殼縱木紋／較低淺色粗糙實心基疤，非 walnut 連續縱溝或 almond 孔紋片面。預算 16 rotation／jitter／inverse scale／tone poses、96×12 shell-local wood grain／128² fine grain／body and scar squared-axis reciprocals；upper cap²／lower elliptical cap 在 equator 同值同一階導數，compact cover 帶 nonsingular convex crown，pale ellipse scar 全在 full body、仍實心不開孔。Wood grain 以 shell-local x/y 採樣、隨每粒旋轉，wood→scar coherent finish／body→backing 同步 color／height／roughness／AO；空 body 跳 detail、full scar 跳 wood、無 scar 跳 fine，equator／body and scar shoulders／owners／UV wraps C1、採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('hazelnutshells', { seed: 7 })`；0.1 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增 geometry、透明開殼、果仁／烹煮／植物生長或物理模擬。

種類另支援 `yagasuricloth`（矢絣風箭羽紋織布）：紫底奶油色三對尖羽與連續軸，相鄰直欄反向，非 ikat 菱形或 asanoha 麻葉網。預算 16 motif tones／128² grain／shaft and feather squared-axis reciprocals／weave frequency；compact ellipsoid shafts／sheared cap² plumes product-union，full shaft 遮住 abs-x join、full motif 跳後續羽、outer-x cull、無 motif 跳 tone lookup／row floor。兩 cosine 平方／crossing 權重共用，96 threads 修正 default 256px 的 128-thread constant-phase alias，保留實際 default normal maps regression failing-before／passing-after。Pigment 只改 color，height／roughness／AO 一律連續 woven finish；shaft／plume shoulders／tips／masked axis／alternating owners／UV wraps C1，採樣無配置／hash／sqrt。使用 `await ProceduralMaterial.create('yagasuricloth', { seed: 7 })`；0.24 m opaque dielectric tile、metallic 0，沿 maps／選用 height／ownership，不新增 geometry、真實紡織／染色製程／文化工藝認證或 cloth physics。

種類另支援 `balloonwhisks`（氣球式打蛋器）：三層 projected oval wire loops／連續頸／四道較高 polished grip rings，線圈及柄 metallic 1、線間與 neutral opaque 外背 metallic 0、預設 factor 1。預算 16 rotation／jitter／inverse scale／tone poses、3 inverse head axes／128² grain／capsule and ring reciprocals；guarded gradient-normalized implicit squared distance 定 compact wire coverage／nonsingular round product-union，非精確 constant-width offset，q∈[0.5,1.5] 外跳除且避開中心除零。Wire→neck→handle coherent replacement 同步 color／height／roughness／AO，metallic 同共同 silhouette cover；full handle 跳 neck/wires、full neck 跳 wires、wire cover/round 雙 full 跳後續 loop、空 silhouette 跳 grain，four grip rings 取一 nearest owner、owner 前 C1 歸零。Wire/capsule shoulders／guard bounds／tangents／rings／owners／UV wraps C1、採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('balloonwhisks', { seed: 7 })`；0.8 m opaque mixed-metal tile，沿 maps／選用 height／ownership，不新增 geometry、透明開孔、攪拌／食物接觸認證或物理模擬。

種類另支援 `orthocerasstone`（直角石化石石材）：尖長窄上／較寬圓下化石切面／八道弧隔壁，與深色拋光基質平齊，非既有 coil fossil limestone 或 trilobite 三軸殼體。預算 16 rotation／jitter／inverse scale／tone poses、128² grain／8² matrix cloud／cone-cap-septum reciprocals；positive-z² variable-width cone 用 soft-tip denominator、不除零寬 apex，rounded basal cap 接點同值同一階導數，八道 parabolic septa 一 nearest owner、owner 前 C1 歸零。Coherent pigment 由 pale mineral chambers／dark septa 換 matrix；height／roughness／AO 與 fossil footprint／septa 無關、全程同一 polished plane，不是 raised shell 或 engraved chamber。空 fossil 跳 tone/septa、full fossil 跳 matrix cloud；apex／side and full shoulders／cap join／curved septa／owners／UV wraps C1、採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('orthocerasstone', { seed: 7 })`；0.4 m opaque dielectric tile、metallic 0／AO1／mortar0，沿 maps／選用 height／ownership，不新增 geometry、浮雕／挖孔、古生物或石材來源認證／生長或物理模擬。

種類另支援 `rickracktrim`（波浪花邊織帶）：六條八週期玫瑰色蛇行帶／雙側較高 woven selvedges／斜向 fine fibers，非 diagonal ribbonstreamer 或 three-strand braidedcord。預算六 column phases／tones、128² grain／wave and fiber frequencies／slope scale／squared-width and selvedge reciprocals；共用 sinusoid sin/cos，q=dx²/(1+slope²) 作 local tangent-corrected width、非 exact global distance，compact support 在 owner 前歸零。Nonsingular lateral dome／雙側 squared-profile raised selvedges／diagonal cosine fibers coherent strip→backing 同步 color／height／roughness／AO，空 body 跳 grain/fibers/selvedges。Wave extrema／slope-adjusted shoulders／selvedges／column owners／UV wraps C1，採樣無配置／hash／sqrt。使用 `await ProceduralMaterial.create('rickracktrim', { seed: 7 })`；0.12 m opaque dielectric tile、metallic 0，沿 neutral opaque backing／maps／選用 height／ownership，不新增 geometry、透明帶間空隙、真實編織或 cloth physics。

種類另支援 `toroidalinductors`（環形電感頂面）：十二道較高 smoother bare-copper projected turns／深色 dielectric ferrite 磁芯環；銅 metallic 1，磁芯／中央孔／外側 neutral opaque backing metallic 0，預設 factor 1。預算 16 rotation／jitter／inverse scale／tone poses、12 winding axes／128² grain／squared annulus and capsule reciprocals／angular owner scale；共同 product-complement union 使 full core 精確 full coverage，coherent copper finish 蓋 ferrite/backing、metallic 只同 wire cover。Radial guards 在孔／外側跳 atan2、nearest angular owner 配 cached axes 不掃12線，每 capsule 在 owner 前 C1 歸零、atan2 branch cut 同owner；空 silhouette 跳 grain、full wire 跳 core finish。Annulus/capsule shoulders／tangents／guards／angular and seed owners／UV wraps C1，採樣無配置／hash／sqrt、有效線區才 atan2。使用 `await ProceduralMaterial.create('toroidalinductors', { seed: 7 })`；0.16 m opaque mixed-metal tile，沿 maps／選用 height／ownership，不新增 geometry、透明孔、漆包線絕緣、引腳、電磁／電熱模擬、額定值或安全認證。

種類另支援 `pennerigate`（斜切筆管麵）：直管斜切端／五道較高縱肋／兩端低暗粗實心管口陰影，非既有 bent macaroni。預算 16 rotation／jitter／inverse scale／tone poses、128² grain／squared body-end-ridge-mouth reciprocals；compact lateral-cylinder／sheared-end coverage 帶 nonsingular crown，五個 nearest-owner longitudinal ridges 在 owner 前 C1 歸零。Reflected elliptical mouths 全在 full body，coherent wall→mouth finish 同步 color／height／roughness／AO、沒有透明通孔；空 body 跳 detail、full mouth 跳 ribs/wall。Body corners／slanted shoulders／rib owners／mouth ellipses／seed owners／UV wraps C1，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('pennerigate', { seed: 7 })`；0.16 m opaque dielectric tile、metallic 0，沿 neutral opaque backing／maps／選用 height／ownership，不新增 geometry、透明孔、真實管腔、烹煮／食物或物理模擬。

種類另支援 `lepidolitemica`（鋰雲母風格石材）：連續較粗淡紫礦物基質上三階較高／亮／平滑近平六角解理 terrace，非膨脹蛭石波浪 lamellae。預算 144 rotation／jitter／inverse scale／tone poses、128² grain／8² cloud／bevel reciprocal／sqrt(3)/2；三個 absolute dot 給六 half-planes，三組 nested radii 的 compact C1 half-plane products 共用 coherent color／height／roughness／AO，full platelet 精確蓋 cloud finish、空 plate 跳 layers、full plate 跳 cloud。Platelet 在 seed owner 前 C1 歸零，continuous matrix／grain 自行跨 owner；六 flat-face／延長 vertex／三階 shoulders and corners／absolute axes／seed owners／UV wraps C1，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('lepidolitemica', { seed: 7 })`；0.2 m opaque dielectric tile、metallic 0／mortar0，沿 maps／選用 height／ownership。僅風格化 seeded pattern、不認證實礦組成／晶體物理／iridescence，不新增 geometry、透明／transmission、粒子或物理模擬。

種類另支援 `brassjinglebells`（黃銅鈴鐺頂面）：凸黃銅殼／較高平滑環形壓邊／中央圓凹與四圓端十字低暗粗 opaque 槽；黃銅 metallic1、槽／neutral opaque 外背 metallic0、預設 factor1。預算16 rotation／jitter／inverse scale／tone poses、128² grain／squared body-capsule-end/center-disc-seam reciprocals。Compact disc／nonsingular squared-radius dome／annular seam；兩 axial capsules、nearest cardinal end-disc、central disc product-complement cut union，四圓端在 diagonal owner 前 C1 歸零。Coherent shell→slot finish 同步 color／height／roughness／AO、metallic=body*(1−cut)，full body mortar精確0；空 body 跳detail、full cut跳shell/seam。Shell／seam shoulders、capsule tangents、center／end shoulders and joins、absolute／nearest-end／seed owners／UV wraps C1，採樣無配置／hash／sqrt／trig。使用 `await ProceduralMaterial.create('brassjinglebells', { seed: 7 })`；0.16 m opaque mixed-metal tile，沿 maps／選用 height／ownership。僅 top-face shading、不新增 geometry、透明孔、內珠、吊耳、敲擊／音效、聲學或物理模擬。

種類另支援 `nutmeghalves`（肉豆蔻切面）：低粗深外皮圍近平淺棕果仁、扭曲深紋僅pigment，與cardamom外殼凸ribs不同。預算16 rotation／jitter／inverse scale／tone／雙phase poses、128² grain／兩8² local warp／ellipse-flesh-wave-vein reciprocals；compact nested ellipse共用coherent rind→flesh finish，兩獨立local warp＋seed phase的smooth-threshold cosine veins採product-complement union。果仁height只tiny grain、不做dome；dark vein不改height／roughness／AO。空body跳detail、無flesh跳warp/trig、fullflesh跳rind；ellipse/flesh shoulders／cached warp fields／seed owners／UV wraps C1，採樣無配置／hash／sqrt、只果仁兩cos。使用 `await ProceduralMaterial.create('nutmeghalves', { seed: 7 })`；0.12 m opaque dielectric tile、metallic0，沿 neutral backing／maps／選用height／ownership。不新增geometry、透明／transmission、食物／植物／烹煮或物理模擬。

種類另支援 `coaxialcablecuts`（同軸電纜切面）：同平面銀色中央導體／淡色介電層／四十isolated銀屏蔽線截面／黑外皮；導體／屏蔽線metallic1、介電層／外皮／neutral opaque外背metallic0、預設factor1。預算16 poses／40strand centers／128²grain／squared radii reciprocals／radialguards／angular owner scale；compact disc共用coherent jacket→dielectric→metal finish，conductor/strands採product-complement metal union。Height僅全cut plane tiny grain、fullbody AO1/mortar0；shield annulus才atan2、single nearest owner配cachedcenter不掃40線，每strand在owner前C1歸零／branchcut同owner，正remainder沿既有算式。空body跳detail、fullmetal跳jacket/dielectric；四種disc shoulders／guards／angular/seedowners／UVwraps C1，採樣無配置／hash／sqrt、只guarded atan2。使用 `await ProceduralMaterial.create('coaxialcablecuts', { seed: 7 })`；0.12 m opaque mixed-metal tile，沿maps／選用height／ownership。不新增geometry、透明／transmission、真線束、接頭、電／EM／RF模擬、額定值或安全認證。

種類另支援 `shippocloth`（七寶紋風布）：深藍連續織面上的奶油交疊完整圓環pigment，非seigaiha半圓tile或凸繡線。預算128²grain／兩seed lattice origins／一tone／squared ring shoulder reciprocals／96-thread weavefrequency；每cell四corner compact squared-radius annuli用product-complement ink union，四圓join精確full ink、圓環連續跨owner。重用yagasuri雙cos／alternating-overunder織紋；ink只改color，不改height／roughness／AO、fulltile mortar0。Ring shoulders／四圓joins／cellownership／weave／UVwraps C1，採樣無配置／hash／sqrt、只兩weave cos。實際default256 normal驗證選relief0.0036，奶油與深藍都保有可見雙軸slope、非僅數學非平面。使用 `await ProceduralMaterial.create('shippocloth', { seed: 7 })`；0.24 m opaque dielectric tile、metallic0，沿maps／選用height／ownership，不新增geometry、透明孔、線纖維／布料／物理模擬。

種類另支援 `driedtamarindpods`（乾羅望子莢）：四個粉粗棕殼鼓包／三個真正縮窄且較低收腰／短果梗，與連續尖莢內藏 bulges 的 greenpeapods 不同。預算 16 poses／四個略彎 chain centers／128² grain／24² pore field／ellipse-stalk-pore reciprocals；四 compact ellipse coverage 與 nonsingular dome 各以 product-complement union，外輪廓自身在每腰縮窄，同方式連 capsule stalk。Coherent stalk→shell finish 使 full body 精確 mortar0，細微 pores 同步 dark／lower／rougher／AO；空 body 跳 detail、無 pod 跳 pores、full pod 跳 stalk finish。固定四 lobe samples，採樣無配置／hash／sqrt／trig；ellipse/dome shoulders／union joins／stalk tangents and shoulders／seed owners／UV wraps C1。使用 `await ProceduralMaterial.create('driedtamarindpods', { seed: 7 })`；0.32 m opaque dielectric tile、metallic 0，沿 neutral backing／maps／選用 height／ownership。僅風格化乾殼 shading，不新增 geometry、透明孔、剝殼／內果肉／種子、植物／食物／烹煮或物理模擬。

種類另支援 `conicalsampletubes`（封蓋錐底樣品管表面）：不透明藍管身漸縮錐底／高平滑閉蓋／低單側連蓋帶／略高亮粗糙霧面橢圓標籤。預算 16 poses／128² grain／cylinder-taper-top、squared cap-hinge-label reciprocals；smooth cap²−x² field 搭 top shoulder 和 nonsingular dome，cap／hinge 採 compact squared-rectangle products，product-complement union 給共同 silhouette、full body 精確 mortar0。Coherent hinge→tube→label→cap finish，label 全在 full cylinder，不混 backing；空 body 跳 detail、full cap 跳 tube/hinge、full tube 跳 hinge finish。採樣無配置／hash／sqrt／trig；cylinder-to-cone/tip／top／cap-hinge corners and shoulders／label ellipse／joins／seed owners／UV wraps C1。使用 `await ProceduralMaterial.create('conicalsampletubes', { seed: 7 })`；0.24 m opaque dielectric tile、metallic 0，沿 neutral backing／maps／選用 height／ownership。僅 closed-tube shading，不新增 geometry、透明／transmission、真管腔／液體／容積／開蓋／離心模擬或醫療／無菌／額定／安全認證。

種類另支援 `botryoidalcopper`（葡萄狀天然銅風表面）：高亮平滑正圓丘／低暗粗金屬谷，非下凹錘痕；整面含valleys metallic1／mortar0、預設factor1，沒有dielectric backing。預算256 jittered site x/y/tone／128² grain／squared support reciprocal；重用periodic3×3 neighbor convention但預算所有sites，compact positive cubic weights先加總再smooth-clamp saturation，weights同時混site tone、density共用color／height／roughness／AO。Radius0.58／jitter0.12時漏在3×3外的最近site至少1.38cell-distance，完整support不因owner改變漏sample。Cubic shoulders／saturated crowns／overlap sums／owners／UVwraps C1；最多9候選、採樣無配置／hash／sqrt／trig／exp／動態鄰點查找。使用 `await ProceduralMaterial.create('botryoidalcopper', { seed: 7 })`；0.16 m opaque full-metal tile，沿maps／選用height／ownership；僅風格化seeded nodule pattern、不認證真礦樣，不新增geometry、粒子／晶體成長／冶金／化學或物理模擬。

種類另支援 `pencilshavings`（鉛筆削花），16 個 seeded rotated 半環木扇、各 12 道放射皺褶與深色較平滑外緣漆層，非 pencilends 六角木截面／石墨芯。預算 16 poses／128² grain／squared annulus-cut-paint reciprocals；兩 compact squared-radius ramps 與 positive-y half-plane product 定半環 silhouette，empty body 跳 grain／atan／cos，positive inner radius 排除 origin、支援域 y>0 排除 atan branch cut。一次 cos(24 atan2) 定 12 道 radial ridge，height／color／AO 共用 flute，paint 僅混 color／roughness、不造額外漆邊高度／AO，common final body finish/mortar 保留完整半環。Inner/outer/cut/paint shoulders／flutes／seed owners／UV wraps C1；採樣無配置／hash／sqrt／鄰點掃描，僅 nonempty body 一次 atan2／cos。使用 `await ProceduralMaterial.create('pencilshavings', { seed: 7 })`；0.16 m opaque dielectric tile、metallic 0，沿 neutral backing／maps／選用 height／ownership，內部／半開口皆 opaque backing、非透明。僅風格化表面，不新增 geometry、粒子／真木屑或彎曲／削鉛筆／損壞／物理模擬。

種類另支援 `papayacuts`（木瓜切面），seeded rotated 窄外皮／高亮厚橙果肉／低長橢圓種腔／28 顆獨立凸黑種子，高度 flesh>seed>pit；kernel 改 height／roughness／AO，非 passionfruitslice 個別 convex jelly sacs 中的 kernel pigment。沿 bounded cached seed-owner convention，預算 16 poses、每 face 4×8 bounded slots（2/4/4/4/4/4/4/2、28 active x/y centers）、128² grain／squared ellipse-seed-owner reciprocals。Radius 0.016＋jitter 0.0025=0.0185 小於 half-pitch X 0.021／half-pitch Y 0.0325，完整 support 在單一 owner，row guards 排除不存在的 outer-corner seeds。Squared ellipse shoulders／seed rim＋smooth nonsingular dome，coherent rind→flesh→pit→seed 先成 surface、最後 common body finish/mortar；空 body 跳 detail，空 flesh/pit 跳 seeds，採樣無配置／hash／sqrt／atan／trig／鄰點或 seed scan。Nested ellipses／seed cores-supports-domes／bounded owners／pose owners／UV wraps C1。使用 `await ProceduralMaterial.create('papayacuts', { seed: 7 })`；0.16 m opaque dielectric tile、metallic 0，沿 neutral backing／maps／選用 height／ownership；種腔 opaque、非透明孔。僅風格化 bounded seed layout，不新增 geometry、透明／transmission、液體／成長／切割／腐敗／物理模擬。

種類另支援 `sewingthimbles`（銀色頂針表面），封圓頂／上窄下寬 body、24 低暗粗盲凹點、較高平滑更寬下捲邊；非齒緣圓蓋或交叉菱紋 sheet。Body／rim／blind dimples 共用 metallic 1、非 metallic 0 打孔。預算 16 poses、每 face 4×6 dimple x/y centers、128² grain／cap-rim-dimple-owner reciprocals；positive smooth width taper＋squared-positive cap＋compact bottom shoulder 定封圓頂 body，squared-rectangle products 定 rolled lip，product-complement union 共用完整 silhouette。Compact smooth squared-radius pits 共用 color／height／roughness／AO；radius 0.022＋jitter 0.0025=0.0245 <half-pitch X 0.0325／half-pitch Y 0.035，完整 support 在單一 bounded owner。Coherent body→lip finish 最後共用 silhouette metallic/mortar；空 shape 跳 detail、full rim 跳 body／dimples，採樣無配置／hash／sqrt／trig／鄰點或 dimple scan。Taper／cap max-square join／body shoulders／rim corners-shoulders／pit supports-centers／owners／union／UV wraps C1。使用 `await ProceduralMaterial.create('sewingthimbles', { seed: 7 })`；0.16 m opaque tile、預設 factor 1／完整 body mortar 0，沿 neutral dielectric backing／maps／選用 height／ownership。僅銀色 front-face shading，不新增 geometry、透明孔／真內腔、縫紉／穿刺／碰撞／變形／物理模擬或防護額定。

種類另支援 `boullebrassinlay`（布爾風黃銅捲草鑲嵌），仿玳瑁 synthetic resin 雲斑 M0 上的共面黃銅 S 捲紋與兩橢圓端飾 M1，交錯鏡像重複、預設 factor 1／整面 mortar 0。兩相切 q-offset annuli／相反 soft half-plane clips／ellipse finials 以 product-complement union 接完整 S，full cores 精確 M1、curl voids／matrix M0。預算 16 微旋轉/jitter/inverse-scale/tone poses、annulus/clip/finial reciprocals，重用 tortoiseshellacetate 12² macro／32² detail／兩 4² warps／192² grain、warp/pigment shoulder 及 height 0.38＋0.001 grain／AO1 convention。Color／roughness／metal 改變但共用 height／AO，無 raised badge／鑲嵌台階／AO凹刻；黃銅較亮且略粗、非金漆。Full metal 跳 resin warp/pigment，採樣無配置／hash／sqrt／trig／鄰點掃描。Q-offset cores-supports／clip endpoints／finial shoulders／tangent union／pigment shoulders／mirror owners／UV wraps C1。使用 `await ProceduralMaterial.create('boullebrassinlay', { seed: 7 })`；0.24 m opaque tile，沿 maps／選用 height／ownership；近乎平坦 normal、白 AO 是共面拋光面預期。僅風格化 brass/synthetic-resin surface，不認證歷史／材質來源，不新增 geometry、真玳瑁、透明／transmission、體積／製作／修復／物理模擬。

種類另支援 `diamondpanelparquet`（四斜接框菱形拼木），四 mitered frame boards／45° clipped square-grid diamonds／交替 board-local diagonal grain／低暗粗連續木縫，非logcabin螺旋或chevron V板、不認證歷史Versailles layout。沿既有 board-owned cached 8×96 anisotropic grain與compact dark joint finish，單一53-tone array（4 frame＋7² direct diamond owners）、96² micro／pitch-bevel reciprocals；max-abs選frame方向，absx=absy換owner前miter profile完全回共同joint。Inner frame/field兩側clip肩皆回joint；固定45° s/t nearest-square owners交替along/across，|s|,|t|<0.4√2故nearest indices [-3,3]，7² lookup完整無board scan。Product masks把owner grain/finishes淡回共同低暗粗縫；空face跳grain、採樣無配置／hash／sqrt／trig／board scan，frame miters／inner-outer shoulders／rotated owners／corners／UV wraps C1。使用 `await ProceduralMaterial.create('diamondpanelparquet', { seed: 7 })`；0.8 m opaque dielectric panel，M0／含joints全mortar 0，沿既有木縫而非neutral grout；maps／選用height／ownership不變。不新增geometry、真板／位移、地板碰撞／鋪設／變形／物理模擬。

種類另支援 `dendriticfrost`（樹枝狀霜晶），16 seeded rotated 高亮粗 opaque ice、各六相連主枝／24明確60°側枝，smooth dark-blue continuous face，非共面snowflake印花或broad angular noise fans。預算16poses／3axis vectors／128²grain／squared capsule core-support-branch-owner-projection reciprocals；三雙向capsules定六主枝，abs-along每側兩branch slots及正負60°branches。Run 0.03＋radius 0.009定along半support0.024 <half-pitch 0.05，一owner完整支援、最多9capsuleprofiles代替24segments scan。Product-complement union共用color／height／roughness／AO，fullcore跳後續axes/branches；主枝end用squared-positive、投影在endpoint切線C1、abs-axis在activebranch域外、centralhubfullcore，無atan／pole singularity。採樣無配置／hash／sqrt／trig／鄰點掃描，core/support shoulders／projection tangencies／branch owners／hub／joins／pose owners／UVwraps C1。使用 `await ProceduralMaterial.create('dendriticfrost', { seed: 7 })`；0.12 m opaque dielectric tile、M0／全mortar 0，maps／選用height／ownership不變。不新增geometry、透明／transmission、晶體成長／天氣／積雪／融化／物理模擬。

種類另支援 `bullionknots`（長形纏線繡結），16 seeded rotated 長形金黃yarn bodies、closed rounded ends，各十二橫向凸纏線／低連續yarn valley，在dark-blue woven cloth上。非 frenchknots 兩圓環凹心小結或 crossstitch 交叉線，height／roughness／AO／color同起伏。預算16poses／128²grain／squared capsule core-support與endfade reciprocals／12-turn frequency／64-thread periodic UV weave；單capsule的squared-positive absalongend定rounded body，body0跳ribcosine，十二transversecosine在endShoulder0.025淡回平滑caps。Core/support肩／roundedends／projection tangencies／abs-axis／ribfade／poseowners／UVwraps C1；採樣無配置／hash／sqrt／atan／neighbor scan，僅rib＋兩cloth cosines。使用 `await ProceduralMaterial.create('bullionknots', { seed: 7 })`；0.12 m opaque dielectric tile、金黃yarn是顏料非metal，M0／含cloth全mortar 0，maps／選用height／ownership不變。不新增geometry、真helical yarn topology、布料透明洞或針／線／布料／縫製／物理模擬。

種類另支援 `orecchiette`（耳形麵），16 seeded rotated cupped golden semolina faces、連續高捲rim／低暗粗偏心opaque bowl，非ravioli凸餡枕或macaroni彎管／透明洞。預算16poses／128²grain／outer及bowl axis reciprocals／edge/rimwidth reciprocals；squared outer ellipse定compact dough face，q-centered compact squared band定完整rolledrim，localx−0.03偏心小bowl ellipse降低height／color／AO、提高roughness但不減face。Face0跳bowl／rim，所有bodyfinish乘face淡回common backing；outer/full-face ellipses／rim shoulders/crest／bowl support/center／poseowners／UVwraps C1，無角度／sqrt／origin singularity，採樣無配置／hash／sqrt／trig／neighbor scan。使用 `await ProceduralMaterial.create('orecchiette', { seed: 7 })`；0.16 m opaque dielectric tile、M0／dough mortar 0／backing mortar 1，maps／選用height／ownership不變。僅stylized surface，不新增geometry、真麵形／位移／厚度／洞、烹煮／吸水／變形／食品／物理模擬。

種類另支援 `solderlessbreadboard`（免焊麵包板表面），opaque白plastic、16rows×兩組各5方形盲凹孔（160）／完整四向白橋／獨立低連續centraltrough，非無中斷均勻perforatedgrid。0.04064 m tile對應2.54 mm孔pitch／7.62 mm內列中心距。預算128²grain／pitch-radius-edge-channel-row reciprocals，無perholecache或隨機孔位；鏡射absx nearest5columns／16periodicrows，單quarticsuperellipse定roundcorner square floor。Support 0.014 <halfpitch0.03125，最內support0.07975 >channelWidth0.035，activechannel可跳holes；空hole跳finish。Floor/support肩／channel肩absaxis／completecolumnrowowners／UVwraps C1，採樣無配置／hash／sqrt／trig／neighbor scan。使用 `await ProceduralMaterial.create('solderlessbreadboard', { seed: 7 })`；M0／全mortar 0，暗粗孔底仍正height opaqueplastic，非alpha或metalcontact。Maps／選用height／ownership不變，僅signalface surface，不新增geometry、真洞／hiddenmetalcontacts／電源軌／標號／接線、電路／電氣／插拔／物理模擬。

種類另支援 `kyaniteblades`（藍晶石風解理板束），16 seeded rotated bundles各三平行長短階差斜端blade／每板三凸縱striae，較高亮smooth藍blade／低暗粗continuous matrix，非mica多層六角plates或pigment條紋。預算16poses／128²grain／pitch-width-side-end reciprocals／three-stria frequency，三top-bottom常數及endSlope0.35定stepped obliqueends。HalfWidth0.045 <halfpitch0.06，單nearestblade完整支援；side×two obliqueend C1profiles乘積避免min-distance cornercreases。Face0跳cosine/finish，crossblade slopedheight及3cyclecosine沿軸一致，height／color／roughness／AO乘face淡回matrix。Side/end肩／corners／striae／blade及poseowners／UVwraps C1，採樣無配置／hash／sqrt／atan／neighbor scan，activeblade一cosine。使用 `await ProceduralMaterial.create('kyaniteblades', { seed: 7 })`；0.16 m opaque dielectric tile，M0／含matrix全mortar 0，maps／選用height／ownership不變。僅stylized mineral-inspired surface，不認證礦物鑑定／結晶學或真anisotropic optics，不新增geometry、透明／transmission、晶體成長／解理斷裂／物理模擬。

種類另支援 `internaltoothwashers`（內齒止動墊圈），16 seeded rotated closed銀色outerrims、12內向金屬齒／6高6低交替bend、opaque starrecess，非單裂口splitwasher或外sawteeth。預算16poses／128²grain／outer-tip-bend squaredradii及reciprocals／half-teeth frequency；q先剔中心r≤0.14及外r≥0.32再atan2，12cosine內cutradius0.14–0.22，outerring全closedflat。6cosine定交替bend同乘toothprofile及r0.19–0.24 radialfade，故非helicalramp或交替pigment/roughness。Metalfinish及bendheight/AO共face，Mface／mortar1−face淡回commonopaque backing；inner support/core曲線／outer圈／bend肩／atan2 seam／center／poseowner／UVwraps C1，activeband外跳angle、空face跳bend，採樣無配置／hash／sqrt／neighbor scan，最多1atan2＋2cosines。使用 `await ProceduralMaterial.create('internaltoothwashers', { seed: 7 })`；0.16 m tile、factor 1／M1涵ring/teeth／backingM0，maps／選用height／ownership不變。不新增geometry、真透明洞或彈簧／預緊／防鬆／變形／機械／物理模擬。

種類另支援 `driedchillies`（乾辣椒），16 seeded rotated curved stronglytapered redfruits／實際低暗粗wrinkle valleys／高olivegreen calyx及相連細stem，非bellpepperslice切面或straightcapsule repaint。預算16poses／128²grain／length-side-end／stemprojection-squaredcore／calyxaxis-edge reciprocals；y定t、中心x0.16t²、width0.09(1−t)²＋0.006，squaredside×two end肩C1 product，body外跳division/cosine。12-cycle longitudinal field同步height／color／roughness／AO，pose tone作phase；capsule stem接高ellipse calyx，body→stem→calyx overlay、product-complement coverage保持fullcore mortar 0，calyx最下support之外可跳stem/calyx。Curve side/core／end肩／stemprojection-capsule肩／calyxellipse／joins／poseowners／UVwraps C1，採樣無配置／hash／sqrt／neighbor scan，activebody一cosine。使用 `await ProceduralMaterial.create('driedchillies', { seed: 7 })`；0.16 m opaque dielectric tile、M0／body-stem-calyx mortar 0／backing mortar 1，maps／選用height／ownership不變。不新增geometry、植物成長／乾燥／食品／烹調／物理模擬。

種類另支援 `utilityknifeblades`（梯形美工刀片），16 seeded rotated銀色trapezoid、兩spine indexingnotches露opaquebacking、下方連續低平滑亮honededge仍M1，非圓sawblade或cutlery beadborder。預算16poses／128²grain／height-side-end／squarednotch core-support／hone reciprocals，width隨y線性加寬；side×top×bottom C1product避免min-distance cornercreases，兩spinecircle product complements作true negativecut，所有metalfinish共face、Mface／mortar1−face淡回commonbacking。Y超top/bottom跳width/notches/hone、空face跳finish；hone y0.09–0.14同變height／roughness／color／AO、lowerband全M1。Slopedside/core／end肩／corners／notch兩圓／hone shoulders／absaxis／poseowners／UVwraps C1，採樣無配置／hash／sqrt／trig／neighbor scan。使用 `await ProceduralMaterial.create('utilityknifeblades', { seed: 7 })`；0.24 m tile、factor 1／blade及honededge M1／notches與exterior backing M0，maps／選用height／ownership不變。不新增geometry、真洞／利刃或切割／磨刀／磨耗／工具／物理模擬。

種類另支援 `windmillparquet`（五板風車拼木）：中央木方板外四根長板，各板木紋隨長軸旋轉，低暗粗接縫仍是木質。重用 windmillpavers 五矩形 owner 與 logcabinparquet 的 board-local 8×96 各向異性木紋 convention，不另創拼法；預算 80 個 tone、8×96 grain、96² periodic micro 及 shoulder reciprocal。2×1／1×2 長板跨內部單位格線仍完整；兩軸 C1 邊距 profile 相乘，color、height、roughness、AO 共 face 淡回同一木縫。全 M0／mortar0，避免固定中性灰 grout。Owner／T junction／gap 與 fullface shoulders／中線 plateau／panel 與 UV wraps 皆 C1；空 face 跳木紋，採樣無配置、hash、sqrt、trig 或鄰居掃描。0.8 m tile，沿用四圖、選用 height 與 ownership；不新增 geometry、施工、歷史真實性宣稱或物理模擬。

種類另支援 `bismuthhoppers`（六層方階鉍風晶面）：16 seeded rotated 金紫方形晶面，六層封閉金屬階向中央降低、變暗、變粗並加深 AO，中央露同一低平 opaque backing。重用 pyrite 的 C1 rectangle profile 乘積與 cached pose convention，不是平 cube／圓環或僅色帶。預算 16 poses、128² grain 與 shoulder reciprocal；outer square 乘 inner complement 定 face，五個 nested profiles 累積 level，六層共 face／Mface／mortar1−face。Bounding box 外與空中心跳過五 threshold loop，採樣無配置、hash、sqrt、trig 或鄰居掃描。七組方形 support/core shoulders、product corners、absaxis、完整 pose owner 與 UV wrap 皆 C1；最大旋轉 support 加 jitter 不跨 owner。0.16 m tile、factor1／階面 M1／中央及外部 M0，沿用四圖、選用 height 與 ownership；不新增 geometry、真洞、實際 iridescence／薄膜光學、晶體生長或物理模擬。

種類另支援 `splitvanillapods`（剖開香草莢），九個 seeded rotated 棕色曲莢，兩條連續高皮緣與封閉兩端圍住低暗粗不透明槽，每莢十六籽團較槽底高、暗、粗，仍低於皮緣，不是色帶或真裂口。沿用 cached pose／C1 ellipse／common backing，預算九 poses、144 籽團的288座標、128² grain 及 squared-radius／shoulder／pitch reciprocals。Local across=x−0.3y² 定彎曲 body；squared transverse flat-core profile × closed-end window 定低槽。每點最多一個 nominal seed row，其 support+jitter0.0115<半 pitch0.02，全部籽團位於 full-core channel/window 內，無鄰居掃描；空 body 跳槽／籽，空槽跳籽。所有 finish 共 body face／M0／mortar1−face 淡回 backing；無採樣配置、hash、sqrt 或 trig。Body／seed ellipse support-core、槽肩／端肩、nominal row owners、完整 pose owners 與 UV wraps C1；0.6 m tile，沿用四圖、選用 height 與 ownership。籽團為 stylized aggregates，不宣稱單顆籽比例；不新增 geometry、真裂口、種子物件、乾燥／食物或物理模擬。

種類另支援 `seamrippers`（藍護球拆線器），九個 seeded rotated 不對稱鋼叉，長彎漸細刃、較短藍護球刃、深藍非金屬握柄，兩叉間露 opaque backing U 槽，不是對稱餐叉或全銀塗色。沿用 squared-capsule projection／product-complement union、C1 taper 與 cached poses，預算九 poses、128² grain、capsule/circle squared support-core、projection/hook/shoulder reciprocals。Shaft／short／hook 共享 metal finish，以1−(1−shaft)(1−short)(1−hook)保持 full-core exact M1；handle capsule 與較高 circle cap 用 C1 coverage 疊覆並移除底層 M，remaining mortar 乘各 complement 保留 exact0。超 hook y 範圍跳變寬計算、空 component 跳 finish；採樣無配置、hash、sqrt、trig 或鄰居掃描。Capsule support-core／end circles／projection joins、hook side-end shoulders、cap layers、完整 pose owners／UV wraps 皆 C1。0.6 m tile、factor1／鋼 M1／塑膠 M0，沿用四圖、選用 height 與 ownership；不新增 geometry、真利刃／切口、拆線／縫紉／工具或物理模擬。

種類另支援 `flakedarrowheads`（剝痕有莖石鏃）：16 seeded rotated 燧石風三角點接窄莖，雙側缺口露 opaque backing，中央高稜兩側前方 facets 各五個低暗粗斜剝痕，不是雙根鯊齒或燧石砌牆。沿用 signed half-plane C1 products／cached poses／ellipse profiles，預算16含 scar-center/first-z 的 poses、128² grain 及 shape/shoulder/pitch reciprocals。Triangle/stem product-complement union 後乘兩 cut ellipse complements，空 body 跳 notch、空 face 跳 ridge/scars/finish；中央 squared smooth cap 起高稜，across=abs(x)、z=y−0.65across 定斜列，每點只取五 nominal rows 中一列，radiusZ0.018<半 pitch0.03 且 absaxis 近旁無 scar。剝痕同步降 height/color/AO、升 roughness，各 finish 共 face／M0／mortar1−face 回 backing。Triangle side/end、stem corners、cut ellipse、warped scar support/core、oblique owners、pose owners／UV wraps 皆 C1；採樣無配置、hash、sqrt、trig 或鄰居掃描。0.4 m tile，沿用四圖、選用 height 與 ownership；不新增 geometry、真利刃／洞、打製／飛行／命中／武器或物理模擬，也不宣稱考古真實性。

種類另支援 `dandelionseeds`（冠毛蒲公英種子）：九個 seeded rotated stylized 種子，十六細乳白冠毛經 full hub 接低淡褐梗與較高棕籽，輻間露 opaque backing，非十二寬瓣 daisy disk 或透明洞。沿用 cached pose/axes／squared-capsule／ellipse／product-complement union，預算九 poses、十六 unit axes、128² grain、support-core/ellipse reciprocals 與完整 bounds。Eligible fan 每點至多一次 atan2 選最近 ray 及一次 bounded capsule projection，無逐輻掃描；full hub 或 fan/reach 外跳角度。HubCore0.033×sin(π/16)>rayRadius0.006，故 hub full core 外的 angular owner 邊界上 fibers 歸零，hub 內 union exact1，含 atan2 ±π 都 C1。Stalk／seed／pappus 依 C1 coverage 疊覆、remaining mortar 乘各 complement 保留 full-body exact0，全 M0。Capsule sides/end circles/projection joins、hub support-core、seed ellipse、angular owners、pose owners／UV wraps C1；採樣無配置、hash、sqrt、sin/cos 或鄰居掃描，atan2 僅限 eligible fan。0.09 m tile，沿用四圖、選用 height 與 ownership；僅 stylized 表面，不新增 geometry、透明纖維／洞、植物生長、風／飄飛或物理模擬，也不認證微觀纖維／植物真實性。

種類另支援 `shojipaperlattice`（不透明障子風紙木格）：六乘六連續高棕木桟圍低白纖維紙。紙底使用 cached formation／tooth／兩個正交 fine-fiber fields，較亮粗糙；木桟較高暗平滑，8×96 cached grain 隨桟旋轉，水平木紋覆交點但不堆雙倍高度。兩軸 full-core／support 週期 profile 在 owner／UV wraps 保持 C1；full wood 跳紙底、full horizontal 跳垂直 grain、empty wood 跳 grain。採樣無配置／hash／sqrt／trig／鄰格掃描，全 M0／mortar0，非灰 grout 或開洞。0.9 m tile、0.004 m relief，沿用四圖／height／Worker／cache／tint／ownership；不含透光、散射、透明紙、榫接 geometry 或建築認證。

種類另支援 `nyloncableties`（尼龍束帶）：九 seeded rotated cream 束帶各有較寬圓角開口鎖頭、連續窄帶、十七高暗平滑橫向棘齒與漸細尾。沿用 cached poses／128² grain／squared rounded rectangle-window／product-complement convention，strap support／end 與 smoothstep width taper 保持 C1；只評估最近 tooth row，support 止於 owner 前，且齒完全在 taper 前的 full strap 內。採樣無配置／hash／sqrt／trig／鄰格或逐齒掃描，empty body 跳 finish、full component 保留 exact mortar0，全 M0。0.6 m tile／0.004 m relief，沿用四圖／height／Worker／cache／tint／ownership；開口露 opaque backing，不含透明、geometry、棘輪／鎖緊／張力／承載模擬或產品認證。

種類另支援 `weavingshuttles`（舟形織梭）：九 seeded 尖舟中空木框、縱向8×96 wood grain、十二個高亮較平滑的乳白繞紗、低金屬軸兩端與兩側 opaque backing 空隙。Squared parabolic-width profile 保持尖端及中央軸 C1，capsule slot／spindle 與 rounded yarn body 沿用 compact support convention；每點只選最近 winding row，support 在 owner 前歸零。預算 poses／micro／wood fields／reciprocals，採樣無配置／hash／sqrt／trig／鄰格或逐繞紗掃描；empty frame 跳 wood grain、full yarn 跳被遮 spindle finish，product complements 保留 full-body exact mortar0。僅露軸 M1，wood／yarn／backing M0，公開 factor1 保留 mixed map；0.6 m tile／0.004 m relief，沿用四圖／height／Worker／cache／tint／ownership，不新增透明、geometry、織造／送紗／張力物理或工藝認證。

種類另支援 `tailorstapes`（無數字裁縫尺帶）：四條連續乳白織布帶，雙側各100刻度位置，每十格八短、一中、一長，中央無印。沿用 squared warp/weft／compact exposure，黑墨保留底層織紋細起伏；十項 cached length table 只查最近 tick，compact support 在 owner 前歸零，所有墨在 full cloth 內，strip／tick／mark end／weave parity／UV joins C1。Empty strip 跳 weave/ink、empty tick 跳 mark、empty ink 跳 finish，採樣無配置／hash／sqrt／trig／鄰格或逐刻度掃描。墨名義微凸2μm、較暗平滑，全 M0、full cloth mortar0；0.1 m tile／0.001 m relief，沿用四圖／height／Worker／cache／tint／ownership。不含數字、字型資產、量測 API、實際校準、布料物理或 geometry。

種類另支援 `woodenclothespins`（木衣夾）：九 seeded stylized 開口衣夾，兩片連續縱紋木夾片、前後展寬中縫與三道較高亮平滑的金屬 spring wraps。Positive gap 讓 abs 軸處於 empty wood，squared-y outer flare 與分離 smoothstep nose/tail C1；只取最近 squared-capsule spring row，support 在 owner 前歸零。預算 poses／128² micro／8×96 local grain／profile reciprocals，採樣無配置／hash／sqrt／trig／鄰格或逐圈掃描；full wire 跳 hidden wood grain、empty wire 跳 metal finish、empty body 跳兩者。Product complements 保留 full-body exact mortar0，僅 wire coverage M1，wood/backing M0，公開 factor1 保留 mixed map。0.6 m tile／0.004 m relief，沿用四圖／height／Worker／cache／tint／ownership；空隙露 opaque backing，不含透明、geometry、鉗合／彈簧／受力模擬或產品安全認證。

種類另支援 `cinnamonbarkcoils`（開放肉桂樹皮捲）：九 seeded rotated 端面含三圈半連續高暖棕 spiral、較低暗粗外皮與中央／圈間 opaque backing 真隙，非實心肉桂捲 pastry 或同心環。有限 Archimedean radial profile 只取最近 unwrapped turn，support 在 owner 前歸零；規一化 atan2 branch 換側時 turn index 補償，unwrapped angle 連續。Compact endfade／annular cull 保持 C1 並避開原點奇點；預算 poses／grain／squared bounds-core／reciprocals，eligible point 至多1 sqrt+1 atan2，無配置／hash／sin/cos／鄰格或逐圈掃描，empty face 跳 finish。正 radial flank 的 smooth bark stripe 真正降低 height／color／AO、提高 roughness，full wall mortar0，全 M0。0.09 m tile／0.003 m relief，沿用四圖／height／Worker／cache／tint／ownership；不新增透明洞、geometry、捲曲／食品物理或植物真實性認證。

種類另支援 `compactcassettefaces`（卡式錄音帶端面）：九 seeded 黑圓角殼、雙低中空六輻塑膠捲盤、高乳白空白紙標籤、中央下磁頭孔及兩導孔，孔內可見較低磁帶，開口露 opaque backing。沿用 cached poses／six unit axes／128² grain／squared rounded-circle-annulus-capsule profiles；nearest wheel 在兩孔 support 外換 owner，nearest axis 在 spoke support 外換 owner，full ring 跳 spokes、empty radial reach 跳 angle、full label 跳 hidden shell finish、empty body 跳 finish。Eligible spoke 每點至多1 atan2，無配置／hash／sqrt／sin/cos／鄰格或逐輪／逐輻掃描，product complements 保留 full-body exact mortar0，全 M0。0.45 m tile／0.004 m relief，沿用四圖／height／Worker／cache／tint／ownership；刻意未印字標籤並非文字 API，不新增字型、透明洞、geometry、錄放音／磁性／走帶物理或 audio 模組功能。

種類另支援 `kintsugiceramic` 為十六 seeded-jitter 深青釉陶片與連續共面金色填縫網：陶片 M0、完整金縫 core M1、肩部平滑混合，material factor1 啟用金屬圖。兩相共用 micro-height 與 AO0.99，金繼為已填平修補，不是假空裂縫或凸金線。沿用 cached periodic nine-site patches、對稱 pair-plane normalization、片色與128² grain；每點九 squared distances 找最近 site，再乘所有 competing C1 half-planes，不能只選次近 seam 以免 partial triple junction 折痕，完整 gold core 遮蔽 nearest-owner 換界。Jitter0.1／support0.03 使被丟棄 competitor 在 patch-owner 換界處皆 inactive，每點無配置／hash／sqrt／trig，gold core 跳 hidden ceramic finish。0.32 m tile／0.0003 m relief，四圖／optional height／Worker／cache／tint／ownership 契約不變；只作金繼外觀，不新增破裂／修補模擬、位移 geometry、真金化學認證、分層塗層或 BRDF anisotropy。

種類另支援 `pleatedfilterpapers` 為九 seeded 奶油紙濾杯端面：連續平坦微紋底、向外升高三十二徑向褶皺環壁、同相扇貝紙緣，crest／valley 同步改 height／color／roughness／AO，全紙 M0、full-body exact mortar0，緣外缺口露低 opaque backing 非透明洞。沿用 cached poses／128² grain／squared radial bounds／C1 rise profile；以有理 cos(2θ) 四次 angle doubling 得32-fold，flat center 遮蔽角度 pole，內部 full paper 跳 rim coverage、empty support 跳 grain/finish，每點無配置／hash／sqrt／atan2／trig，亦無逐褶掃描。0.36 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership 不變；僅濾紙外觀，不新增實際杯體 geometry、紙纖維微孔／滲透率認證或過濾／流體模擬。

種類另支援 `splitcedarshakes` 為四層半錯位、每層六片，共二十四暖棕 cedar shake 端面：seeded 變寬、96×8 縱向木紋、與木紋相關不齊下緣、較厚 taper butt，以及每片兩道圓頭並貫通下緣的 seeded split，非礦物 grit roofshingles 或直條 shiplap 換色。沿用 cached piece widths／tones／split anchors、compact C1 half-planes／squared capsules，固定 course-center grain slice 產生 frayed butt；empty support 跳 hidden finish，每點無配置／hash／sqrt／trig／鄰格或逐片掃描。全木 M0、full-body exact mortar0，裂隙與 course gutter 露低 opaque backing 非透明洞。2 m tile／0.008 m relief，四圖／height／Worker／cache／tint／ownership 不變；只作靜態 split／taper 木瓦外觀，不新增 damage／weathering 模擬、屋頂工法認證、分層系統或 geometry。

種類另支援 `swavepavers` 為四層半錯位各八塊、共三十二 S 形混凝土連鎖磚：normalized cubic warp 真正彎曲側縫的 height／roughness／AO／mortar coverage，不是 calcadawaves 只改石色的波紋或 dogbonepavers 對稱窄腰。沿用 cached block tones／128² grain／48² aggregate／compact C1 joint profiles／inverse-coordinate 單格定位；row 與 warped-column owner 在 full grout 內換界，負 warped column 正確 wrap，empty support 跳 grain/finish，每點無配置／hash／sqrt／trig／鄰格或逐磚掃描。全石 M0、full-body exact mortar0，縫為低 opaque neutral grout。0.96 m tile／0.006 m relief，四圖／height／Worker／cache／tint／ownership 不變；不新增 geometry、剛體互鎖／碰撞／車流模擬或施工認證。

種類另支援 `mushroomslices` 為九 seeded 蘑菇切片：連續乳白 dome／縱纖維 stalk、較低暗粗棕外皮與十二附著低暗 gill fingers，其間為真低 opaque backing，非 mushroomgills 整面菌褶扇形。沿用 cached poses／128² grain／local64×8 stem fibers／squared ellipse-roundedrect-capsule profiles／mirrored nearest-gill lookup，halfPitch0.016>radius0.011 使 owner 在 support 外換界；full cap 跳 hidden stem/gills，empty support 跳 finish，product-complement union 維持 full-body exact mortar0，全相 M0。每點無配置／hash／sqrt／trig／鄰格或逐 gill 掃描。0.18 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership 不變；只作切片外觀，不新增 geometry、透明洞、真菌生長或物種／可食性認證。

種類另支援 `insulatedringlugs` 為九 seeded 銀色環端子：連續中空 eyelet／neck 平金屬片與較高紅絕緣 collar，兩道對稱低 crimp bands 真降低 polymer height／color／roughness／AO 但維持 M0，銀片 M1／紅套 M0／factor1 啟用混合金屬圖。孔與外隙露低 opaque backing。沿用 cached poses／128² grain／squared annular-roundedrect-capsule profiles／product-complement union；ring-neck union 後才切 bore，頸不填入孔下緣；full collar 跳 hidden metal、empty support 跳 finish，兩 crimp supports disjoint 且在 full polymer 內，full-body exact mortar0。每點無配置／hash／sqrt／trig／鄰格或逐帶掃描，0.18 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership 不變；不新增 geometry、電路連通／導電模擬、壓接力學、絕緣安全／電壓認證。

種類另支援 `bananaslices` 為九 seeded 奶油香蕉橢圓切片：低而較粗淡外緣、三道連續低 Y partition 與六枚成對暗 seed rudiments，不是 kiwiflesh 環種子或 starfruit 五角外皮換色。Y arms／hub／seeds／rim 分別改 height／color／roughness／AO，cached poses／three unit axes／128² grain／squared ellipse-capsule profiles／三 dot comparison 單arm定位，每點無配置／hash／sqrt／atan2／trig／逐arm或逐seed掃描。Full hub 遮 ray owner 換界，其餘 ties在ray／seed support外，外橢圓support遮pose換界，全相M0、full-body exact mortar0，外部低opaque backing。0.12 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變；不新增geometry、熟成／生長模擬、植物／食品認證。

種類另支援 `rosemarysprigs` 為九 seeded 淡莖迷迭香枝葉、十六片斜生狹針葉與凸起淡中肋，非寬羽狀 fernleaf 換色。Cached poses／八 seeded leaf lengths／128² grain，squared stem capsule／sheared elliptical paired leaves／compact rib profiles，nearest-pair owner 位於 leaf transverse support 外、full stem overlay 遮 mirrored-side cusp。Product-complement coverage 保持根莖連續且 full-body exact mortar0；empty support 跳 finish、full stem 跳 hidden leaves，每點無配置／hash／sqrt／trig／逐葉或鄰格掃描。暗粗針葉高於淡低莖，亮高滑中肋與葉面分相、全 M0、外部低 opaque backing；針葉與中肋寬度保留512像素的可見分離。0.18 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership 不變，不新增 geometry、生長、植物學或草藥／食品認證。

種類另支援 `pencilsharpeners` 為九 seeded 全金屬削鉛筆器表面：真圓孔低殼、八道低側握槽、較高磨刃與更高一字槽螺釘，非 utilityknifeblades 散刃或 pencilends 換色。Cached poses／128² grain／squared rounded housing-circle-strip-capsule profiles，nearest grip-row ties及mirror-side cusp在grip support外；housing／blade／screw product-complement metal union 保持 full-body exact M1／mortar0，孔與外隙才是低 opaque M0 backing。Full screw 跳hidden blade/body、full blade跳hidden housing、empty support跳grain，每點無配置／hash／sqrt／trig／逐握槽或鄰格掃描。低握槽、磨刃面與低螺釘槽分別改height／color／roughness／AO且皆M1。0.15 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership 不變，不新增 geometry、削切力學、精密五金尺寸或安全認證。

種類另支援 `scissors` 為九 seeded 張開剪刀：雙真橢圓孔紅柄、連續銀頸、雙斜尖刃與更高圓銀樞。Cached two arm axes／nine poses／128² grain，squared ellipse annuli／neck-pivot profiles，尖刃以smooth signed linear halfplanes乘積收尖，不用有中心尖折的abs-width clipping。Full neck cores 同時重疊blade與ring core，neck support在inner holes前終止；product-complement unions維持連續full-body exact mortar0、紅柄M0、銀刃頸樞M1，孔與外部低opaque M0 backing。Full handles/pivots跳hidden plate，empty support跳grain，每點固定兩arm解析、無配置／hash／sqrt／trig；紅柄高粗於磨刃、低於銀樞。0.25 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增geometry、活動鉸鏈、剪切力學或安全認證。

種類另支援 `serpentinesprings` 為九 seeded 單連續銀蛇形彈簧線：六直段、五交替真半圓 U 彎與雙圓自由端，非六分離直條或螺旋線圈。Cached poses／128² grain／exact piecewise squared-distance field，straight rows／三右二左turns／end owners都在空support換主；line/arc join離開中心線仍value與一階導數相同。只在eligible U-turn annulus通過中心與外部cull後取一次sqrt，不能用implicit-ring近似取代而破壞接合；每點無配置／hash／trig／鄰格或逐run掃描。Compact core-support及smooth圓冠改height／roughness，full wire core維持M1／exact mortar0，隙為低opaque M0 backing。0.2 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增geometry、螺旋彈簧構造、彈性／力學或安全認證。

種類另支援 `impellerfaces` 為九 seeded 六後掠尖銀葉輪、六開扇隙、高圓環hub與真中心孔，非連續rim的spurgears換色。Cached poses／128² grain／squared radial profiles／sixfold angular phase隨q後掠；width隨q線性縮尖，兩smooth signed angular halfplanes乘積形成真尖端，不用abs-phase cusp或vanishing-width division。Phase ties在support外、full hub跳hidden angles/finish、origin不查angle；每eligible annulus一次atan2，每點無配置／hash／sqrt／sin/cos／逐葉或鄰格掃描。Product-complement hub/blade union保持連續core M1／exact mortar0，孔及扇隙低opaque M0；radial blade height向外升、低暗粗磨刃仍低於hub。0.3 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增geometry、旋轉、流體／空力或安全認證。

種類另支援 `chipresistors` 為九 seeded 高黑矩形chip resistor、雙低銀wrap端與連續白103標記，非圓柱色環axialresistors換色。Cached poses／128² grain／rounded body-terminal profiles／capsule strokes／rounded annular0字，counter露出高opaque黑body，不是元件穿孔或低backing。3由連續vertical/horizontal strokes exact union；nearest glyph/row ties及mirrored terminal owners在support外，字寬配合旋轉512像素足跡。Full body跳hidden metal，每點無配置／hash／sqrt／trig／逐glyph或鄰格掃描；黑body與亮白ink皆M0、銀端M1，body/terminal cores重疊仍exact mortar0。Ink薄高粗、body高於terminals；0.12 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變。103僅外觀標記，不認證實測阻值、電路模擬、精密元件規格或電氣／安全。

種類另支援 `memorycardbacks` 為九 seeded 通用黑記憶卡背面、八低金接點、七高黑絕緣隙、真右上削角與開放右側key notch。Cached poses／128² grain／rounded body-pad profiles／smooth diagonal halfplane／rounded notch subtraction，nearest-pad ties在contact gap，所有pad位於full shell且避開key cuts。Empty shell跳pad/finish，每點無配置／hash／sqrt／trig／逐pad或鄰格掃描；金pad M1且低滑於高黑M0殼，接點隙保持高opaque黑body，只有削角／notch才露低opaque M0 backing。Mortar只由body coverage決定，接點／隙皆full-body exact0。0.15 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變；通用無品牌logo靜態表面，不新增儲存存取、電路、精密尺寸、SD規範或資安／電氣／安全認證。

種類另支援 `gnocchi` 為九 seeded 撒粉奶油橢枕、圓冠與七低彎叉槽，非ravioli／orecchiette換色。Cached poses／128² grain／48² flour／squared ellipse-dome與x−bend*y²曲線warp的七compact capsules；nearest-groove ties在完整dough空support，所有叉槽位於full face。叉槽末端偏移大於groove radius，舊直線控制點仍高而無凹痕；每點無配置／hash／sqrt／trig／逐槽或鄰格掃描，outside support跳兩noise finishes。叉槽低暗粗且AO較低但不挖孔，full dough M0／exact mortar0，外部低opaque backing；flour只改pigment／roughness，非粒子。0.12 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增geometry、烹煮／生長模擬或食品／安全認證。

種類另支援 `rectangularsocketfaces` 為九 seeded 閉合銀框／真正低開口／高opaque黑舌／四更高銀接點矩形插座，非記憶卡換色。Cached poses／128² grain／squared rounded rectangles-capsules，outer-minus-mouth形成連續conducting ring；只在tongue內選nearest-contact，pins全support位於full tongue、tongue全在full mouth。Contact ties維持高opaque M0絕緣隙而非孔；product-complement coverage使full ring／tongue／contacts exact mortar0，只有銀框與pins M1，低cavity/backing M0。Empty outer跳mouth／contacts／finish，mouth外rim跳tongue-pins，empty cavity跳grain；每點無配置／hash／sqrt／trig／逐pin或鄰格掃描。0.09 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增port geometry、電氣I/O、精密尺寸、USB相容或電氣／安全認證。

種類另支援 `saffronthreads` 為九 seeded 同一完整根部的三彎紅絲、三擴圓尖與兩真低叉隙，非rosemary直針換色。Cached poses／128² grain／三固定unrolled squared capsules，x−sign*bend*(baseY−y)²曲線warp，半徑只在tip區C1擴張；warp跨軸向cap projection不clamp，避免off-axis derivative jump。Coverage及rounded crowns皆product-complement unions，非max／nearest-branch cusp，同根full cores exact mortar0／M0。Empty bounds跳所有capsules、empty body跳grain；每點固定三capsule、無配置／hash／sqrt／trig／鄰格掃描。Core ratio0.71以較寬肩保留既有differential guard；0.06 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增flower geometry、生長／烹煮模擬或食品／安全認證。

種類另支援 `fishhooks` 為九 seeded 連續銀J鉤，真眼環／直柄／下半圓彎／上尖／內向倒鉤尖，非carabiner／safety pin換色。Cached poses／128² grain／squared shank capsule／circular inner-outer arc bands／eye disc與兩尖的signed linear halfplane products。Product-complement unions連full cores而不疊加height；最後一次bore subtraction切所有components含shank，眼孔保持真低開口。雙尖無abs-width cusp或zero-width division，J中腔一路向上開放，內倒鉤與空outward mirror分離。Full metal M1／exact mortar0，bore／open cup／backing低M0。Empty bounds跳profiles，full eye bore跳其餘profiles，empty body跳grain；每點無配置／hash／sqrt／trig／逐segment或鄰格掃描。0.15 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變；此為opaque backing上的靜態外觀，不新增鉤體geometry、釣魚physics、強度或安全認證。

種類另支援 `violinfholes` 為九 seeded 鏡對三次曲線真低f孔與連續暖木紋，每孔端圓眼／兩側缺刻，非直線painted f。Pose只快取五值，無unused或會跨cell跳變的wood tone；abs(x)−pairOffset選一mirrored profile，cusp位於寬zero-cut中央木帶。Cubic warp bend*(t³−t)跨squared axial caps不clamp；兩round端disc與四signed-plane diamond nick constraints以product complements連接。高wood及低opaque深棕腔皆M0／exact mortar0，保留authored pigment非neutral grout。World-periodic96×12 grain與128² fine跨pose-cell無seam；bounds外跳cut profiles、full cut跳雙finish，每點無配置／hash／sqrt／trig／逐segment或鄰格掃描。0.45 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變；僅opaque backing上靜態外觀，不新增violin／穿孔geometry、音源合成、聲學模擬或樂器認證。

種類另支援 `palmiers` 為九 seeded 金心蝴蝶酥，雙真鏡像低焦糖螺旋／中央摺痕／凹口雙冠／下尖，非同心環或cinnamon bun換色。Cached poses／128² grain／兩squared lobe ellipses與signed-halfplane下三角以bounded products聯合，非nearest-lobe silhouette cusp。Compact elliptical spiral windows排除angular origins與mirror-owner seam；squared-radius phase−atan2/TAU以整數週期wrap，nearest phase ties在groove empty support。每eligible occupied point一atan2，無其他逐點trig／sqrt／配置／hash／鄰格或segment掃描；empty bounds跳profiles、empty body跳angular-grain finishes。焦糖槽低暗滑且AO低、仍為高opaque crumb，中央摺痕低暗粗；所有full pastry M0／exact mortar0非孔，外部低opaque backing。0.18 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增pastry geometry、烘焙／生長模擬或食品／安全認證。

種類另支援 `barbedwire` 為四無縫雙圓銀線row，真交替over-under高度、高collars及十六knots各四連尖倒刺。沿用既有C2 quartic-wave／tangent-corrected widths，但quarter-phase depth為雙線twist非doubled-depth figure-eight plait；front/back alpha composition只在wire supports分離處切depth order，無crease或交點雙高。每row只快取phase／jitter／tone三值、128² grain只finish occupied metal；nearest-knot ties在compact knot空support，wire獨立periodic phase。Full高collar先return，遮reflected barb quadrant cusp；雙signed tip halfplanes無abs-width tip crease或zero-width division。Derived bounds跳empty rows/profiles、empty body跳grain；初始化一次sqrt界定tangent width，逐點無sqrt／trig／配置／hash／segment或鄰格掃描。Full metal M1／exact mortar0，interwire／interbarb gaps低opaque M0 backing。0.4 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增fence geometry、mechanics或負載／強度／電氣／安全認證。

種類另支援 `oxfordweave`（牛津紡）：每方向八組雙紗，藍經／淺緯以二上二下籃式交織。Squared compact profiles與rounded crowns使用前後權重，不疊加交點高度；pair-owner在兩紗空隙切換，group-owner切換前lift window與交叉紗support皆歸零，長紗維持C1連續。128² cached grain與週期多項式纖維不在逐點配置、hash、trig或sqrt。深色布底保留opaque pigment，所有pixels的metallic／mortar為0；0.08 m tile／0.001 m relief。既有maps、height、tint、Worker／cache、repeats與ownership不變，不新增紗線geometry、透孔、displacement或布料模擬。

種類另支援 `lacewood`（蕾絲木紋）：直向暖木紋上的淺色長木射線斑，尺寸、位置、斜度與微彎由seed決定。8×12格各快取六值，compact parabolic-warped ellipse的support在cell-owner切換前歸零；world-periodic48×4 grain及192×8 fiber跨格連續。射線為淺色低roughness的近乎平整pigment，不是節眼或墊高鱗片；僅細微木紋／導管孔改height及AO。全opaque M0／mortar0，0.35 m tile／0.001 m relief，逐點無配置／hash／trig／sqrt或鄰格掃描。既有maps、height、tint、repeats、Worker／cache與ownership不變，不新增geometry、displacement、anisotropic shader或木材模擬。

種類另支援 `papyrus`（莎草紙）：八條直向寬草條壓覆較低的橫向草條，帶seeded tone、週期微彎邊、192×6長纖維及轉置橫紋、4×4成紙雲紋。`halfWidth + edgeJitter < 0.5`使owner切換前coverage歸零，飽和core令abs-center及full-top early return維持C1；full top略過隱藏下層edge，empty top略過上層纖維。權重維持上／下／紙底三種高度，不疊加交點或交替織紋；三層全為暖色opaque M0／mortar0。0.3 m tile／0.0015 m relief，既有maps、height、tint、repeats、Worker／cache與ownership不變，逐點無配置／hash／trig／sqrt，不新增geometry、透明孔洞或造紙模擬。

種類另支援 `larimar`（拉利瑪石）：相融藍色礦物雲塊、乳白間隙與淺色彎曲纖維脈，共用同一拋光平面。6×6 pool各快取七值，固定3×3週期候選混合rotated compact ellipses，進出查詢範圍的support已歸零，非nearest-owner切換。Blue coverage與肩部纖維皆bounded product-complement unions，full core略過fiber；多項式週期fiber、128² grain／5×5 cloud逐點無配置／hash／trig／sqrt。Pigment不改height／AO，height維持0.0005–0.0005008 m、AO1，全opaque M0／mortar0。0.25 m tile／0.001 m relief，既有maps、height、tint、repeats、Worker／cache及ownership不變，不新增晶體geometry、透光、SSS、anisotropy或礦物生長模擬。

種類另支援 `paperbark`（紙皮樹皮）：3×8淡色薄片、seeded錯位列、扭曲撕邊、真正抬高的下捲唇與纖維底皮。每片六值pose加八個row phases快取，24² field正反座標扭曲兩軸；`0.45 + 0.018 + 0.02 < 0.5`及`0.33 + 0.04 + 0.3×0.45² + 0.04 < 0.5`保證coverage在column／row owner變更前歸零。Compact squared shoulders及多項式lip／shadow維持C1；僅下緣捲起，下方有暗縫，不做對稱tile rim。6×192橫纖維／12×8 cloud全域連續，128² grain只取樣可見薄片，pigment正向係數上界1而非靠clamp藏溢出。全opaque M0／mortar0、0.4 m tile／0.002 m relief，逐點無配置／hash／trig／sqrt或鄰格掃描；既有maps、height、tint、repeats、Worker／cache及ownership不變，不新增geometry、displacement或剝皮模擬。

種類另支援 `horseshoes`（金屬馬蹄鐵）：九枚交替朝向、微轉鐵件，各六釘孔、開口跟部與連續低fuller槽。每枚五值快取cos／sin／雙offset／tone；`x²/rx² + min(0, y−toeY)²/ry²`讓半橢圓toe接直枝C1，compact squared shoulders／heel cap包住U形面，同q槽降低height而非交點疊高。每側三孔只做一次nearest-row索引，0.038 support小於0.07半pitch，孔owner與abs-center cusp均在空support。0.16 rad微轉及0.012 jitter後不越cell，保持owner空底連續。鐵件M1／低釘孔及開口M0，全opaque／mortar0；128² grain只取樣可見鐵件，逐點無配置／hash／trig／sqrt或鄰格／孔列掃描。公開factor1、0.6 m tile／0.01 m relief，既有maps、height、tint、repeats、Worker／cache及ownership不變，不新增geometry、透明孔洞、碰撞或馬匹模擬。

種類另支援 `durianpeel`（榴槤果皮）：64枚seeded旋轉、half-cell錯列的六面尖刺坡與連續olive rind。每刺七值cache為cos／sin、雙offset、兩個affine profile係數與tone；三對absolute planes以兩次有界polynomial rounded max合成六個linear坡面，不逐點sqrt。Radius0.31–0.4／jitter0.018符合`0.4×2/√3 + 0.018 < 0.5`，rounding只縮support，owner變更仍在底皮。Quadratic foot／tip shoulders接linear中坡C1，0.055飽和尖頂大於三倍0.018 rounding，讓absolute-plane cusps全部位於柔化平頂內。128² grain／6×6 cloud為全域skin，profile0仍opaque，AO0.76–0.99／M0／mortar0。0.24 m tile／0.012 m relief，逐點無配置／hash／trig／sqrt或鄰格掃描，既有maps、height、tint、repeats、Worker／cache及ownership不變，不新增geometry、displacement或果實模擬。

種類另支援 `flystitch`（飛針繡）：36組交替朝向的淺色Y形線跡，V雙臂接短固定莖，抬高於深色細織布。每組五值cos／sin／雙offset／tone快取，兩clamped arm projections及一closed-form stem構成rounded capsules；product-complement union令接點相連但不疊三線height。平方端點距離／compact smooth supports保持C1，`hypot(0.27, 0.28) + 0.036 + 0.015 < 0.5`令owner切換在無針腳底布，tight rectangle略過空glyph projections。共享128² grain及192條雙向quartic週期pulse保留細織紋，full yarn不計隱藏底布，body0不finish線。Convex weights保留布／線height及roughness，AO0.94–0.99，全opaque M0／mortar0。0.12 m tile／0.0012 m relief，逐點無配置／hash／trig／sqrt；既有maps、height、tint、repeats、Worker／cache與ownership不變，不新增線geometry、透明孔洞或布料模擬。

種類另支援 `abaloneshells`（鮑魚殼內面）：九枚彎耳形凹面、較高殼緣、靜態淺生長帶與單側五低呼吸孔。每枚六值cos／sin／雙offset／tone／growth phase快取；Cartesian skew與parabolic bend扭曲橢圓，`0.37 + 0.07×0.37 + 0.14×0.37² + 0.012 < 0.5`令旋轉後support不越cell。一次nearest-row索引選孔，0.02 support小於0.05半pitch，孔owner切換在空support；另一側與孔間橋完整。Height隨q向外增高並有compact高rim，中心更低；九道quartic growth pulses只呈靜態nacre-inspired pigment／微紋，不是view-dependent虹彩。128² grain僅finish可見殼，空shell與full孔略過finish；全opaque M0／mortar0、0.45 m tile／0.006 m relief。逐點無配置／hash／trig／sqrt或鄰格／孔列掃描；既有maps、height、tint、repeats、Worker／cache與ownership不變，不新增geometry、透明孔洞、thin-film shader、透光或貝類模擬。

種類另支援 `gyroidinfill`（gyroid截面填充紋）：精確`z=π/4`截面的橘色圓頂曲帶。兩個seeded phase offsets快取平移`F=sinX cosY + (sinY+cosX)/√2`，逐點四次trig保留解析field，無nearest-owner、curve tracing、hash／配置／sqrt。F² shoulder於0.26 support／0.045 core之間smooth接底C1，中心crown不使用abs而無cusp，兩支解析輪廓與saddle接點保持抬高連接。空support直接回傳0.00009 m opaque底面並跳128² grain，曲帶圓頂、AO0.65–0.99／M0／mortar0。0.16 m tile／0.0015 m relief，既有maps、height、tint、repeats、Worker／cache與ownership不變。此為implicit-field band而非固定world-space寬度的distance field，不新增lattice geometry、mesh輸出、displacement、透明孔洞或列印模擬。

種類另支援 `cloisonne`（六瓣掐絲琺瑯）：九朵seeded旋轉花，各六閉合黃銅瓣框與中心環包圍較低青藍琺瑯。每朵九值快取三對軸、雙offset與框內tone，三次對稱橢圓加中心圓選q；q=1輪廓用0.23 support／0.09 core的squared肩與圓頂高絲。相鄰瓣bisector最低q≈1.26453高於外support1.23，反向abs軸q≥1.890625，中心support半徑≈0.04215小於瓣內support≈0.04255，owner切換在空wire／pigment support；旋轉support加jitter<0.423<0.5。框內tone與全域128² grain不造成cell色縫。高絲M1、低琺瑯M0，全opaque／mortar0、factor1。空wire跳圓頂finish；逐點無配置／hash／trig／sqrt或鄰格掃描。0.18 m tile／0.001 m relief，沿用maps、height、tint、repeats、Worker／cache與ownership，不新增geometry、透明玻璃、transmission、thin-film shader或燒製模擬。

種類另支援 `rambutanskin`（紅毛丹果皮）：144根seeded旋轉彎曲漸尖金黃果毛連接較高根瘤，底下紅皮連續。每根五值快取cos／sin、雙offset與tone；quadratic centerline `bend×(0.65+0.35tone)×t²`彎曲毛身，寬度0.065→0.018，squared橫斷面與smooth端cap接果皮C1。根／毛為正向relief，低皮不挖縫；tone只作用毛身，128²全域grain維持底皮無cell色縫。`hypot(0.32,0.28+0.018)+0.05<0.488<0.5`使旋轉毛support不越cell，根瘤亦在cell。空bounding support跳毛寬／cap／曲線，逐點無配置／hash／trig／sqrt或鄰格掃描／nearest-curve迭代。全opaque M0／mortar0、0.12 m tile／0.0035 m relief，沿用maps、height、tint、repeats、Worker／cache與ownership，不新增hair geometry、displacement、透明縫、SSS或生長／果實模擬。

種類另支援 `rackgears`（七齒直齒條）：九枚seeded旋轉銀色直齒條，各七梯形齒、完整齒根、雙低安裝孔與低縱加工槽。五值快取cos／sin、雙offset與tone；compact矩形齒根與漸窄齒採product-union，root重疊0.025、0.008 smooth bevel。一次nearest-tooth lookup，最大half-width0.037小於半pitch0.045，owner切換在空齒support，齒間谷不切斷齒根。`hypot(0.36,0.13)+0.025<0.408<0.5`使旋轉support不越cell；一次abs鏡像孔計算產生雙低孔，縱槽僅影響可見face。Bounding／空face跳finish，128² grain只取樣可見齒條；逐點無配置／hash／trig／sqrt、鄰格或齒列掃描。鋼面M1、低底孔M0，全opaque／mortar0、factor1、0.6 m tile／0.007 m relief。maps、height、tint、repeats、Worker／cache與ownership不變，不新增geometry、透明孔、齒輪嚙合、精密involute工程模型或機械模擬。

種類另支援 `poplin`（細經粗緯府綢）：48細經／24粗緯玫瑰色棉紗一上一下，非牛津紡成對2×2；沿用既有compact yarn ownership／lift方式。經radius／core0.22／0.16、緯0.4／0.32均在owner前C1歸零，parity選單一上層。Lift在經0.30／緯0.46半寬與0.06肩內消退，連續紗跨row／col不跳height。細經base／crown0.30／0.04、粗緯0.44／0.07，±0.12 lift呈真較寬橫緯肋，非只pigment checker。192／96 smooth compact纖維脈與128² seeded grain僅finish可見紗，空coverage提前回傳；逐點無配置／hash／trig／sqrt或鄰紗掃描。48／24偶數使signed UV torus與parity一致。全opaque M0／mortar0、0.016 m tile／0.0003 m relief；maps、height、tint、repeats、Worker／cache與ownership不變，不新增紗線geometry、透明織孔、cloth physics或anisotropy shader。

種類另支援 `ooliticlimestone`（磨面鮞粒石灰岩）：淡暖基質內144枚seeded大小／offset鮞粒、3／4同心皮殼與較暗核。每粒五值快取center／inverse radius²／tone／cortex count，radius0.32–0.42加jitter0.03令support≤0.45<0.5。雙periodic sine warp，cell-units正模運算避免`fract(-epsilon)`捨入1越table；squared q以0.15 shoulder接基質，quartic phase pulse成皮殼、q0.04–0.07 smooth暗核。128² grain調共同磨面finish、16² noise調基質pigment，height始終`0.35+0.002grain`／AO1／全微高差≤0.24 μm，核與皮殼不做凸珠或凹洞。逐點兩次trig，無配置／hash／sqrt／atan2或鄰粒掃描。全opaque M0／mortar0、0.024 m tile／0.00012 m relief；maps、height、tint、repeats、Worker／cache與ownership不變，不新增geometry、displacement、透光或地質生長模擬。

種類另支援 `ogeetiles`（對稱S曲燈籠磚）：36枚交錯青綠釉面磚，閉合雙cubic S側邊、寬中段及上下尖端。偶數6rows／6columns保留torus parity，半寬`w(t)=0.5(1-smooth(t))`與`w(1-t)`恰加0.5，固定兩row候選填滿平面且不重疊。平方margin `w²-dx²`避免窄尖端bevel與axis相遇的abs cusp；q0.0049起、寬0.004的smooth肩將低灰縫接到真高釉面，owner切換都在fullgrout。這是field-based縫，不宣稱固定Euclidean縫寬。36個快取seeded tones與128² grain僅finish可見face，空face提前回傳；逐點無配置／hash／trig／sqrt或鄰格掃描。全opaque M0、0.72 m tile／0.004 m relief；maps、height、tint、repeats、Worker／cache與ownership不變，不新增geometry、displacement、透明縫、施工或釉面光學模擬。

種類另支援 `bittermelonskin`（縱肋圓疣苦瓜表皮）：十二條平緩warp的完整綠縱肋、96枚seeded大小／offset圓疣及相連低溝。每疣五值快取offset／inverse radius²／tone，另快取十二rib tones、12×8 periodic warp noise與128² grain。正值`(coordinate+0.5)%period`選nearest owner；rib radius0.44，疣X support≤0.34+0.04=0.38、Y≤0.41+0.035=0.445，均<0.5，owner切換前C1歸零。Squared compact smooth pulse呈圓鈍疣，非尖刺；底層rib不隨row分段。Raw height `0.12+0.32ridge+0.24bump+0.006grain`保留疣／肋／溝三級真高低；逐點無配置／hash／trig／sqrt或鄰格掃描。全opaque M0／mortar0、0.18 m tile／0.0045 m relief；maps、height、tint、repeats、Worker／cache與ownership不變，不新增果實geometry、displacement、透明孔、SSS或生長模擬。

種類另支援 `cocobolo`（橙紅深紋心材）：磨面橙紅底、寬深流紋、細暗紋與縱向纖維。4×2 cached noise以0.08幅度warp共同x，正值`(u+warp+1)%1`維持period；u導數絕對值≤0.48，映射斜率≥0.52不摺返。12×2／48×3 cached fields以0.16／0.45、0.12／0.28 smooth thresholds成寬／細pigment，192×8纖維調細色變。Color界限0.08–0.86；深紋不改height，始終`0.35+0.002fiber`／全微高差≤0.32 μm／AO1，非凸肋或凹裂。逐點無配置／hash／trig／sqrt或鄰格掃描；全opaque M0／mortar0、0.24 m tile／0.00016 m relief。maps、height、tint、repeats、Worker／cache與ownership不變，不新增geometry、displacement、SSS、anisotropy shader或木材生長模擬。

種類另支援 `doubleedgerazorblades`（雙刃三圓連槽刀片）：九枚seeded旋轉銀片、四角低缺口、三圓瓣連成完整中央低槽、兩條更低更亮更平滑的長研磨面。每片五值快取cos／sin、雙offset與tone；compact矩形減四smooth corner masks，nearest圓瓣與capsule槽採inverse product-union。半hole pitch0.08>radius0.043，circle owner切換在空support；capsule clamp接點squared distance為C1，core／outer shoulders皆smooth。沿用utility blade的0.105–0.165 hone方式，雙長面raw height降低0.24且更亮更平滑，不只換色；`hypot(0.36,0.19)+0.025<0.433<0.5`使旋轉support不越cell。空plate／cutout跳finish，128² grain只取樣可見鋼；逐點無配置／hash／trig／sqrt或鄰格掃描。鋼M1／低底槽M0，全opaque／mortar0、factor1、0.18 m tile／0.0003 m relief；maps、height、tint、repeats、Worker／cache與ownership不變，不新增geometry、透明孔、切割、碰撞或機械模擬。

種類另支援 `chiastolite`（深十字空晶石）：九枚seeded旋轉褐色晶體切面，深色石墨質四臂由中心連接、向外漸寬，環繞四個暖象限。五值快取cos／sin、雙offset與tone；quartic squircle `qx²+qy²`在q0.7–1 smooth接host，`0.35*2^(1/4)+0.025<0.442<0.5`限制旋轉support。兩個squared transverse distance的compact bars以product-union成十字，半寬0.018加0.04×smooth軸向squared q，不產生abs cusp。128² grain供共同finish、16² noise調host pigment，空face跳cross；height始終`0.35+0.002grain`／全微高差≤0.24 μm／AO1。晶體與包裹體只是pigment，非凸塊或刻溝，roughness區分磨面；逐點無配置／hash／trig／sqrt或鄰格掃描。全opaque M0／mortar0、0.12 m tile／0.00012 m relief；maps、height、tint、repeats、Worker／cache與ownership不變，不新增geometry、displacement、透光或礦物生長模擬。

種類另支援 `dimity`（成對高經肋細平紋棉布）：六對象牙棉經肋，每八經紗兩粗高cord加六細紗。沿用poplin compact ownership／lift，48×48單紗parity一上一下；cord radius／core0.36／0.30、細經0.22／0.16、緯0.28／0.22皆在owner前C1歸零。Cord warp加0.16 raw height，半寬0.46／肩0.1的carrier lift亦抬起同處連續weft，避免只升warp造成斷階。Crossing±0.1 lift在經／緯半寬0.44／0.36與0.06肩內消退，共同base／crown0.29／0.05。192-frequency compact纖維與128² cached grain只finish可見coverage，空coverage提前回傳；逐點無配置／hash／trig／sqrt或鄰紗掃描。48為偶數且被八整除，signed UV保留cord groups與parity。全opaque M0／mortar0、0.02 m tile／0.0003 m relief；maps、height、tint、repeats、Worker／cache與ownership不變，不新增紗線geometry、透明織孔、cloth physics或anisotropy shader。

種類另支援 `juniperberries`（藍灰果霜杜松果）：16枚圓果頂、三條真低放射鱗縫與較低中央scar。每seeded owner快取cos／sin、雙offset與inverse-radius-squared五值；最大radius0.42加jitter0.025<0.5。Squared radial cap以0.2 smooth肩接底並形成圓頂；三條局部120°有限capsule長0.29、radius／core0.018／0.009，以product-union合縫，scar radius／core0.06／0.035。Squared距離與smooth compact肩在原點、端點、support及owner維持C1，無atan2 branch或sqrt奇點。32² cached bloom調霜色／roughness、128² grain供微finish，空support提前回傳；逐點無配置／hash／trig／sqrt或鄰格掃描。安靜果面高於三縫／scar，果體高於深底，皆真height。全opaque M0／mortar0、0.064 m tile／0.006 m relief；maps、height、tint、repeats、Worker／cache及ownership不變，不新增果實geometry、透明果肉、SSS或生長模擬。

種類另支援 `gabbro`（粗晶輝長岩）：深色輝石質粗晶與淡斜長石晶粒鑲嵌，淡晶帶細平行光學雙晶pigment。沿用granite compact normalized weights，12×12 site快取雙offset、tone、cos／sin與phase，僅淡晶算12-frequency compact雙晶帶。Site在0.3–0.7、support radius1.2，省略site距離≥1.3，owner切換前weight歸零；own site squared distance≤0.98<1.44，denominator嚴格正而不需epsilon fallback。Cap四次平方成16次權重，固定3×3 lookup平滑接角狀礦粒，逐點無配置／hash／trig／sqrt。128² grain供共同磨面`0.35+0.002grain`、物理微高差≤0.24 μm／AO1，晶界與雙晶非凹槽或凸塊。全opaque M0／mortar0、0.18 m tile／0.00012 m relief；maps、正規化height、tint、repeats、Worker／cache及ownership不變，不新增晶體geometry、displacement、透光或地質模擬。

`turnbuckles`（雙眼螺紋花籃螺栓）新增九枚seeded旋轉鋼件：閉合中央長框、真低框心、兩側連接螺桿與閉合眼環，孔洞維持opaque非金屬暗底而非透明。雙側鏡像細螺紋具有較低高度、較暗色與較高粗糙度；金屬mask乘factor1。0.24 m tile／0.003 m relief、mortar0；沿用height、tint、repeats、Worker／cache與ownership，不新增幾何、穿孔、displacement或機械模擬。

`rhodochrosite`（菱錳礦）加入粉紅基質、六組寬白波狀層帶與細伴生帶，非瑪瑙閉合環。3×3與9×3 cached noise扭曲連續六週期相位，compact squared寬／細肩部保持C1；12² pigment與128² grain分離色澤及磨面。層帶只改pigment／roughness，共同磨面微高差≤0.24 μm、AO1，全opaque M0／mortar0、0.18 m tile／0.00012 m relief。沿用height、tint、repeats、Worker／cache及ownership，不新增晶體geometry、displacement、透光或地質模擬。

`bayleaf`（月桂葉）加入九枚seeded旋轉的橄欖綠尖橢圓平滑葉片、短葉柄、高中脈、七對向葉尖彎曲的側脈與細邊緣脈。沿用compact葉片／葉柄coverage；軸線fade消除abs側脈座標的尖點，平方輪廓與smooth肩部維持C1。四值pose、七個root與128² grain在setup快取，grain物理微高差≤6.4 μm，低於側脈40 μm，避免微粒遮蔽葉脈。全opaque M0／mortar0、0.24 m tile／0.0016 m relief，沿用height、tint、repeats、Worker／cache與ownership；不新增葉片geometry、透明cutout、SSS或植物模擬。

`gabardine`（軋別丁）新增卡其色密經二上一下經面陡斜紋。沿用poplin compact yarn coverage／crossing lift／fiber路徑，但48經×24緯的三格draft逐緯移一經，斜向pitch約63.4°，非1×1平紋或2×2等距斜紋。經radius／core0.495／0.44、緯0.25／0.18，密經遮住大部分底；經緯共同base0.34／crown0.04、±0.1 lift在owner切換前平滑歸零。192／96-frequency fibers與128² grain沿用快取，無逐點配置或trig。全opaque M0／mortar0、0.018 m tile／0.0003 m relief；height、tint、repeats、Worker／cache與ownership不變，不新增紗線geometry、透明孔洞或布料模擬。

`oilspotglaze`（油滴黑釉）加入黑褐亮釉上的64枚seeded橢圓鐵氧化物晶斑、褐色內部、較亮環緣與細晶pigment。七值pose快取cos／sin、雙offset、雙逆半徑平方與tone；最大radius0.34加jitter0.1<0.5，compact斑面與rim smooth肩部在owner前C1歸零，無逐點配置／hash／trig／sqrt。128² grain供共同釉面微高差≤0.24 μm，64² crystal只供色澤，AO1；亮褐斑仍是介電釉下色而非金屬環。全opaque M0／mortar0、0.16 m tile／0.00012 m relief，沿用height、tint、repeats、Worker／cache與ownership；不新增晶體geometry、displacement、透光或窯燒模擬。

`persimmonslice`（柿子切面）新增九枚seeded旋轉橙色圓切面、八向分離深籽、淡色中心與細深色外皮。沿用水果flush cut契約：籽／果肉／皮共平面、grain微高差≤8 μm，籽僅改色與粗糙度，不假冒凹孔。四值pose、八組axis、128² grain及inverse squared常數在setup快取；radius0.38加jitter0.025<0.5，圓面／皮／pith／ellipse種籽compact smooth肩部C1，逐點無配置／hash／trig／sqrt。全opaque M0／mortar0、0.24 m tile／0.002 m relief；height、tint、repeats、Worker／cache與ownership不變，不新增水果geometry、透明果肉、SSS或生長模擬。

`kitkattiles`（細長凹面釉磚）新增24欄×4列直疊玉綠finger tiles，6:1 pitch、沿長向真正低凹槽與等UV寬灰縫，非凸木條或一般平地鐵磚。沿用subwaytiles四邊compact smooth face／mortar，橫向平方smooth凹槽在兩端fade，中心比肩部低0.48 mm；grain微高差≤6 μm。96個owner tone與128² grain快取，逐點無配置／hash／trig／sqrt。全opaque M0、mortar=1-face，0.6 m tile／0.003 m relief；沿用height、tint、repeats、Worker／cache與ownership，不新增geometry、displacement、透明或鋪磚模擬。

`brakediscs`（雙圈鑽孔煞車碟）新增九枚seeded旋轉銀色碟面、中央低孔、五個安裝孔、兩圈各12個錯半步通風孔、較高中轂與細同心磨耗紋。孔與碟外維持opaque M0暗底，鋼面mask乘factor1。沿用bearing squared annular face與compact hole肩部；兩值pose、29孔三值座標與128² grain在setup快取，逐點無配置／hash／trig／sqrt。磨耗用r²週期compact帶，無中心奇點，僅4 μm低紋，不以粗槽冒充研磨。mortar0、0.72 m tile／0.004 m relief，height、tint、repeats、Worker／cache及ownership不變；不新增幾何、透明穿孔、displacement或煞車物理。

`mulberrypaper`（手工桑皮紙）新增暖米色雲狀紙漿、192條任意旋轉長彎韌皮纖維與少量棕色內含物，非編織條帶或折紙。沿用紙材compact additive neighborhood概念，以明／暗兩個complement union避免交叉纖維無界堆高；8×8格每格三纖維各八值快取，3×3固定lookup、無逐點配置／hash／trig／sqrt。最長half-length0.9、曲偏≤0.04、寬≤0.03，support<0.942；省略格最近1.15，owner切換前C1消失。兩端envelope²與側cap²平滑漸尖，fiber lift≤7 μm、總微高差≤13.6 μm／AO1。全opaque M0／mortar0、0.16 m tile／0.0002 m relief；height、tint、repeats、Worker／cache與ownership不變，不新增纖維geometry、透明紙、SSS或造紙模擬。

`howlite`（白松石）新增象牙白礦塊與細灰色不規則網狀基質脈。12×12抖動site各兩值快取，雙4²週期warp扭曲礦塊；3×3 compact radial八次權重的normalized overlap產生網脈，不使用最近site切換或把色脈挖成溝槽。support1.2小於省略格最近1.3，權重C1消失且全域覆蓋避免除零；無逐點配置／hash／trig／sqrt。共磨平面高度僅有≤0.2 μm微粒、AO1，灰脈只調色與roughness。0.24 m tile／0.0001 m relief、全opaque M0／mortar0；不新增geometry、透明裂縫、displacement或礦物模擬，沿用options／Worker／cache／ownership。

`ottoman`（成對粗緯橫肋織物）新增細經紗束縛成對粗緯pick的紫色橫向凸肋與低肋間隙。沿用poplin／gabardine的compact yarn coverage、漸消lift與纖維路徑；48經／24緯，連續兩緯共用draft、下一對反轉，相鄰經交替。每對緯中心向內偏0.1 pitch，對內距0.8／對間1.2；weft support0.38與lift half0.36均小於owner邊界最近0.4，保持C1。0.18 lift使交叉處上紗確實高於下紗；較高粗緯base／crown形成橫肋。0.024 m tile／0.0004 m relief、全opaque M0／mortar0；不新增geometry、透明紗隙、各向異性或布料模擬，沿用options／Worker／cache／ownership。

`shackles`（U形弓橫銷卸扣）新增九枚seeded旋轉銀色卸扣：圓管U形弓、兩個加大端boss、單一較高橫銷與帶小孔扁銷頭。沿用隔離hardware pose快取與compact union／normalized height，避免連接處重疊厚度加倍；上半圓與兩直腿以連續最近曲線距離銜接，每點一個必要hypot，無逐點配置／hash／trig。所有支撐連同jitter位於tile owner內；圓弓、boss、橫銷、銷頭與孔皆C1。中央與銷頭小孔為opaque M0暗底、metal面mask乘factor1、mortar0；0.6 m tile／0.004 m relief。未新增geometry、透明孔、displacement、螺紋操作或承載物理，沿用options／Worker／cache／ownership。

`watercaltrops`（雙彎角菱角果殼）新增九枚seeded旋轉黑褐色圓殼、兩條對稱上彎漸尖角、細縱皺與低果柄疤。沿用rambutanskin compact曲線漸尖support與isolated pose快取，改為連接果殼的成對粗角；smooth彎曲中心線、有限tip width及根／尖端C1 fade，bounded union／normalized relief避免根部堆高。保守support半徑<0.465，連同jitter仍小於0.5；無逐點配置／hash／trig／sqrt。0.24 m tile／0.003 m relief、全opaque M0／mortar0，沿用height／tint／repeats／Worker／cache／ownership；不新增geometry、透明背景、displacement或植物生長模擬。

`fluorite`（紫色方形色帶螢石）新增九枚seeded旋轉紫色晶面、嵌套近方形生長色帶與淡色礦物基質；不是圓環瑪瑙或raised方磚。沿用隔離晶體pose與共磨礦面路徑，每晶六值快取；八次多項式等高線避免max-axis尖角導數跳躍，4週期polynomial色帶在phase wrap C1。最大half-extent0.335、支撐半徑<0.435連同jitter仍小於0.5；無逐點配置／hash／trig／sqrt。色帶只調色／roughness，共磨平面微粒高差≤0.2 μm、AO1、opaque M0／mortar0；0.06 m tile／0.0001 m relief，沿用options／Worker／cache／ownership。不新增geometry、透明／折射、螢光、displacement或晶體生長模擬。

`wenge`（細長開放導管孔Wenge木）新增深褐直紋、淡色縱向薄壁組織帶與192個細長低導管孔；不是換色木紋或凸起布肋。沿用compact木材孔／cached縱向noise路徑，24×8孔各四值快取，孔半寬0.035–0.055、半長0.15–0.35皆於owner內C1漸消；三份noise快取、無逐點配置／hash／trig／sqrt。導管孔實際低32 μm、較粗糙與較低AO，淡色條帶只改顏色而不堆高；微粒高差≤1.2 μm。0.12 m tile／0.0004 m relief、全opaque M0／mortar0，沿用options／height／tint／repeats／Worker／cache／ownership；不新增geometry、透明孔、displacement、各向異性或木材生長模擬。

`parchment`（乳白書寫用皮紙）新增雲狀乳白底色、細縱向刮製色紋與256個任意旋轉的淺殘留毛孔，不是粗顆粒皮革或紙漿纖維。沿用compact elliptical pore／cached noise路徑，16×16毛孔各六值快取，最大support0.08小於最近owner邊界0.2；無逐點配置／hash／trig／sqrt。刮痕只調色、不刻深槽；毛孔低2.4 μm，平滑皮面雲狀高差≤3 μm加微粒≤0.4 μm，AO≥0.96。0.04 m tile／0.0002 m relief、全opaque M0／mortar0；沿用options／height／tint／repeats／Worker／cache／ownership，不新增geometry、透明／透光、displacement、文字或皮紙製程模擬。

`cavalrytwill`（雙道陡斜肋騎兵斜紋）新增橄欖綠粗／細成對陡斜肋。沿用poplin／gabardine／ottoman的compact yarn coverage、lift與纖維路徑，72經／36緯形成約63.4°斜向；六步draft以經面110100呈現二道不等寬wale，逐row前進一經，不把它當成歷史織法認證。經／緯radius0.495／0.25、core0.44／0.18，lift在owner邊界前C1消失；無逐點配置／hash／trig／sqrt。0.024 m tile／0.0003 m relief、全opaque M0／mortar0；沿用options／height／tint／repeats／Worker／cache／ownership，不新增geometry、透明紗隙、各向異性或布料模擬。

`screwhooks`（開口螺絲鉤）新增九枚銀色開口環鉤與相連漸尖螺紋桿。沿用環帶及螺紋相位的compact C1 masks，開口、環心與背景均為不透明非金屬凹面，鋼面metallic factor1；約0.00016 UV高度螺紋槽同步降低亮度／AO並提高roughness。尖端以正距離因式分解寬度，避免端點浮點消去造成除零；normalized overlap不雙加高度。0.36 m參考tile／0.004 UV relief；無逐點配置／hash／trig／sqrt，不新增geometry、透明孔洞、螺紋接合或物理模擬，沿用options／Worker／cache／ownership。

`nigellaseeds`（黑種草籽）新增25枚任意旋轉、細長帶三側稜角的炭黑種籽，非蕎麥殼高肋或圓形種籽。沿用三C1半平面乘積，aspect0.9／1.15、外接support≤0.368加jitter0.015小於owner0.5；每籽五值快取，128²grain與256²pore fields。細凹表皮低0.0009375 UV高度（按0.024 m參考tile換算22.5μm，非實際位移量測），同步變暗／降低AO／提高roughness；不在邊界堆高粒子。全opaque M0／mortar0、0.024 m參考tile／0.0375 UV relief，沿用options／Worker／cache／ownership，無逐點配置／hash／trig／sqrt；不新增geometry、透明孔或生物模擬。

`phyllite`（灰綠千枚岩）新增48道細密波狀片理與緞面雲母色斑，不是板岩階梯或片麻岩寬色帶。4²warp／128²grain及mica fields快取，C1 compact週期脊無逐點配置／hash／trig／sqrt；雲母只調色及降低roughness，不額外堆高或改metallic。0.18 m參考tile／0.018 UV relief，片理脊高差0.00117 UV（只按參考尺度換算約210.6μm，非位移量測）。全opaque M0／mortar0，沿用options／Worker／cache／ownership，不新增geometry、displacement、各向異性、干涉色或地質模擬。

`shantung`（粗節平紋山東綢）新增暖象牙色64經／32緯1/1平紋與96段不規則緯向粗節。沿用poplin／gabardine／ottoman／cavalrytwill的compact yarn及lift路徑；每緯三段各快取中心、平方逆半長、強度。粗節C1漸厚變寬，緯radius由0.22最多至0.37、core0.15至0.28，低於owner0.5；經線覆蓋時不讓粗節穿透，lift在owner前漸消。0.024 m參考tile／0.018 UV relief；全opaque M0／mortar0，無逐點配置／hash／trig／sqrt，沿用options／Worker／cache／ownership，不新增geometry、透明紗隙、各向異性或織物模擬。

`hempcrete`（多孔礦物膠結麻屑）新增淺色多孔膠結底與144枚嵌入棕色纖維麻屑，非OSB覆片。每屑七值快取，x⁸+y⁴ compact圓角長片與128²grain／96²pore fields；最大support約0.391加jitter0.03小於owner0.5，無逐點配置／hash／trig／sqrt。麻屑面維持近乎平切，不堆高且不讓底材孔洞鑽穿；底孔深度最多0.0036 UV。0.24 m參考tile／0.015 UV relief（底孔只按參考尺度換算最多0.864 mm，非位移量測），全opaque M0／mortar0，沿用options／Worker／cache／ownership；不新增geometry、透明孔、物理或材料強度／隔熱認證。

`utilityblades`（雙背槽梯形單刃刀片）新增九枚銀色梯形刀片，上背兩個開放安裝槽、僅較長下緣磨薄變亮且降低roughness，非雙刃刮鬍刀。四個C1線性半平面與雙compact槽mask，每片五值快取；support約0.404加jitter0.008小於owner0.5，無逐點配置／hash／trig／sqrt。鋼面metallic factor1，背槽與背景為opaque M0凹面、mortar0。0.24 m參考tile／0.004 UV relief；磨刃高度差0.00052 UV（只按參考尺度換算124.8μm，非位移量測）。沿用options／Worker／cache／ownership，不新增geometry、透明切口、切割或機械模擬。

`chrysocolla`（藍綠結核簇矽孔雀石）新增36簇、共108個相接圓結核，立於深綠礦物底，不是金屬葡萄狀銅或研磨色帶。每簇八值快取與128²grain／64²pigment fields；三個compact C1圓面以normalized dome平均保留鞍部，交疊不疊加高度。support最多0.38加jitter0.025小於owner0.5；無逐點配置／hash／trig／sqrt。0.12 m參考tile／0.012 UV relief，全opaque M0／mortar0；沿用options／Worker／cache／ownership，不新增geometry、displacement、透光、金屬光學或化學／地質模擬。

`sichuanpepperhusks`（裂口空腔花椒果皮）新增49枚紅褐粗糙空果皮，以C1平方距離環壁、連續不規則皺摺輪廓與向外開口保留凹腔，對側附著痕更低、更暗且更粗糙；不是整粒胡椒或透明洞。六值姿態快取／128² grain／40² wrinkle fields，support最多0.385加jitter0.03小於owner0.5，無逐點配置／hash／trig／sqrt。0.05 m參考tile／0.015 UV relief，pore depth0.000825 UV與scar depth0.0024 UV（按參考尺度換算41.25μm與120μm，非實際位移量測）；全opaque M0／mortar0。沿用options／Worker／cache／ownership，不新增geometry、透明切口、植物生長或化學模擬。

`huckaback`（五挑浮經平紋毛巾布）新增40×40經緯、10×10 draft與32組斜向交替的成對五挑浮經（共64條長浮經），不以waffle凹格或逐挑珠狀凸點代替。重用正式cloth sampler；此preset仍建立600個Float64值／4800 bytes的完整同draft-run offset／平方half／inverse shoulder快取，長浮線跨內部owner維持連續、在run ends以C1退回平紋，目前Lyocell與Hopsack各以96值共用相同whole-run profile builder，其餘既有cloth family成員仍不建立whole-run profile buffer。128² grain與160×160纖維週期，無逐點配置／hash／trig／sqrt。0.032 m參考tile／0.022 UV relief，單側lift0.00308 UV（按參考尺度換算98.56μm，非位移或實機量測）；全opaque M0／mortar0。沿用options／Worker／cache／ownership，不新增紗線geometry、pile loops、透光、吸水或各向異性光學模擬。 結構參考：[Huckaback浮線與平紋綁定資料](https://www.slideshare.net/slideshow/huckaback-weave-60106128/60106128)。

`anorthosite`（淺色雙晶斜長岩）新增以白灰斜長石晶粒為主、稀疏深色副晶粒與晶粒內平行雙晶albedo條紋的拋光切面；重用正式gabbro晶粒sampler，非深色基質輝長岩或凸起礦物拼片。100個site各六值快取／128² grain；3×3鄰域的radius1.2 compact-support權重以16次方正規化，own-site平方距離最多0.98維持正權重，省略site最近1.3不會截斷支撐。無逐點配置／hash／trig／sqrt。0.2 m參考tile／0.004 UV relief，micrograin高度跨度最多0.000008 UV（按參考尺度換算1.6μm，非位移或實機量測），雙晶與晶界共用平切面。全opaque M0／AO1／mortar0，沿用options／Worker／cache／ownership，不新增geometry、透光、Schiller／雙折射光學、地質或礦物比例認證。

`cubebberries`（Cubeb有梗胡椒果）新增64枚深褐皺紋果身與相連細木質果梗，非無梗胡椒或分離浮梗；C1橢圓果身覆蓋capsule果梗根部，以有界coverage保留單層neck高度；果身完全覆蓋時由果身決定，不相加或平均兩個完整高度。每果六值姿態快取／128² grain／64² wrinkle fields，各軸support最多0.468×0.98加jitter0.025＝0.48364小於owner0.5，無逐點配置／hash／trig／sqrt。0.08 m參考tile／0.04 UV relief，wrinkle height0.0022 UV／pore depth0.0012 UV（按參考尺度換算176μm／96μm，非位移或實機量測）；果皮較果梗粗糙，全opaque M0／mortar0。沿用options／Worker／cache／ownership，不新增geometry、透光、植物或化學模擬。

`seraphinite` 提供深綠基質與銀白彎曲羽狀礦紋的程序化拋光切面：16組不同方向、長寬與頻率的羽狀束，以3×3週期鄰域重疊合成，不在owner邊界裁斷成葉片貼紙；每組九值快取共144個Float64／1152 bytes，8² matrix／12² warp／128² grain fields，無逐點配置／hash／trig／sqrt。借用既有羽脈axis fade與礦物鄰域模式，C1軸向淡出移除abs距離的尖點；平方距離細脈在phase wrap前歸零，最長support1.1小於省略site最近距離1.3。0.16 m參考tile／0.006 UV relief，切面micrograin高度跨度最多0.000012 UV（按參考尺度換算1.92μm，非位移或實機量測）；礦紋只改albedo，不將羽狀束做成凸起葉片。全opaque M0／AO1／mortar0；沿用options／Worker／cache／ownership，不新增geometry、透光、chatoyancy／Schiller或各向異性光學模擬。

羽狀外觀參考：[Seraphinite](https://en.wikipedia.org/wiki/Seraphinite)。礦紋為程序化近似，不打包標本照片。

`hexsocketheads` 提供25個種子旋轉的鋼質圓形螺栓頭與六角平底盲凹穴；重用既有圓頭支撐與六角半平面模式，三對half-plane C1 profiles相乘保留六個平面、伸出的六個角與平滑倒角，不以max距離引入角部摺痕。每頭五值姿態快取共125個Float64／1000 bytes，128² grain field與初始化時計算的固定六角常數；無逐點配置／hash／trig／sqrt。圓頭support0.38加jitter0.025為0.405，小於owner半寬0.5；凹穴最大角半徑約0.207846，小於完整頂面半徑0.33。0.18 m參考tile／0.03 UV relief，名義凹深0.0126 UV、平底micrograin高度跨度最多0.00006 UV（按參考尺度換算2.268mm及10.8μm，非位移或實機量測）。凹底維持M1且高於M0中性底板，頂面與凹底之間以coverage混合，不挖穿底板；全opaque，mortar=1−圓頭coverage，`createMaterial()`預設metallic factor為1以保留區域金屬map。沿用options／Worker／cache／ownership，不新增geometry、螺桿／螺紋、實際穿孔或負載認證。

`datepits` 提供25枚黃褐色橢長椰棗核、兩側隆起核面與有限長彎曲縱向凹槽。重用既有種籽姿態快取及閉合平方距離支撐模式，橢圓以有限polynomial bow偏移、凹槽在兩端前C1淡出，無逐點配置／hash／trig／sqrt，亦不除以尖端漸零寬度；核槽不是咖啡豆裂口或穿洞。每核五值共125個Float64／1000 bytes，128² grain；保守旋轉支撐上界約0.431937加單軸jitter0.025小於owner半寬0.5。0.08 m參考tile／0.025 UV relief，凹槽名義深度0.00475 UV與micrograin高度跨度0.0003 UV（按參考尺度換算380μm及24μm，非位移或實機量測）；槽底高於背景且更暗、更粗糙、AO較低，兩個尖端保持閉合。全opaque M0／mortar0；沿用options／Worker／cache／ownership，不新增geometry、植物生長、食品或化學模擬。

`sapele` 提供紅褐色徑切外觀的寬明暗帶狀木紋與細長淺導管孔，直接重用wenge正式sampler而不另建近似分支。320個孔各四值快取共1280個Float64／10240 bytes，3×4 warp／64×4 fiber／128² grain；七道寬色帶的C1平方距離profile與細長橢圓孔支撐皆維持UV週期，孔x支撐最多0.044加site最多0.75小於owner1、y支撐最多0.26加site最多0.6亦小於1，無逐點配置／hash／trig／sqrt。0.3 m參考tile／0.002 UV relief，孔深0.00016 UV與平面micrograin高度跨度0.000006 UV（按參考尺度換算48μm及1.8μm，非位移或實機量測）。寬木紋只改albedo，不做凸起肋條；細孔為真實淺凹且roughness較高／AO較低。全opaque M0／mortar0，沿用options／Worker／cache／ownership，不新增geometry、木材生長或各向異性／chatoyancy光學模擬；本preset為固定色帶外觀而非動態反光認證。

外觀參考：[Sapele — The Wood Database](https://www.wood-database.com/sapele/)。固定色帶及導管紋為程序化近似，未打包參考照片。

新增 `chambray` 藍經白緯青年布：32×32等寬1/1平紋逐格交替露出染藍經紗與白緯紗，不是denim斜紋或浮線。直接共用poplin正式sampler，兩向相同0.42支撐／0.3 core與等高0.34 base／0.04 crown，逐交點C1起落；僅chambray設定warp色階0.18與weft色階0.92，既有布種計算不變，無新增逐點配置或布料模擬。128² grain／128雙向fiber，不新增姿態或draft快取。0.016 m參考tile、0.012 UV relief，逐交點lift 0.00168 UV（按參考尺度換算26.88μm，非位移／實機量測）。全opaque M0／mortar0，維持options、Worker、cache與ownership；兩向等高，非poplin粗緯肋，無各向異性或布料動態。

織物結構參考：[Cotton Chambray — Cotton Incorporated](https://thefabricofourlives.com/cotton-fabrics-chambray/)。只程序化近似染色經紗／白緯1/1平紋，未打包參考圖片。

新增 `nephrite` 深淺綠斑與細交錯礦紋的不透明拋光軟玉近似：6² cloud、兩個4² warp、96×8／8×96軸向與64×8整數對角fiber lattice，經0.07 UV warp及C1 threshold混合，128² grain維持平面微紋。兩向與對角細礦色只改albedo，不是凸起布線、分離晶粒或凹裂縫；AO1、全opaque M0／mortar0，不模擬半透明、次表面散射、玉石韌性或各向異性。所有lattice按seed建立快取，無逐點配置／hash／trig／sqrt，整數對角座標及週期warp保持signed UV tile重複。0.16 m參考tile／0.003 UV relief，平面micrograin跨度0.000006 UV（按參考尺度換算0.96μm，非geometry／displacement／實機量測）；保留options、Worker、cache與ownership。

礦物參考：[Jade Description — GIA](https://www.gia.edu/jade-description)。此預設近似不透明淡深綠軟玉表面，不是硬玉，也不使用該頁的硬玉照片作軟玉圖源；未打包參考圖片。

新增 `diorite` 鹽胡椒狀黑白粗晶閃長岩：256個jittered礦晶site，明亮斜長石與大量深色鐵鎂礦色交錯，paleThreshold 0.35僅為seeded程序色相分派而非地質體積含量。直接共用gabbro／anorthosite正式sampler，3×3鄰域compact cap¹⁶正規化、每site六值共1536個Float64／12288 bytes與128² grain；radius1.2在略過site最短距離1.3前消失，自己site平方距離至多0.98確保分母正值。晶內十週期細雙晶只改albedo，不凸起或切裂拋光面。0.16 m參考tile／0.004 UV relief，micrograin跨度0.000008 UV（按參考尺度換算1.28μm，非geometry／位移／實機量測）；全opaque M0／AO1／mortar0，無逐點配置／hash／trig／sqrt，保留options、Worker、cache與ownership，不模擬礦物成分或各向異性。

外觀參考：[Diorite — Geology.com](https://geology.com/rocks/diorite.shtml)，說明淺斜長石與深角閃石／黑雲母的鹽胡椒外觀及拋光建材用途，未打包參考圖片。

新增 `carawayseeds` 月牙形葛縷子果：64枚深褐細長彎果與五條較淺縱肋，果身bend0.16大於halfWidth0.065，尖端以有限polynomial taper閉合、五肋收攏而不除以漸零尖端寬度。直接共用fennelseeds正式sampler，各果五值快取共320個Float64／2560 bytes與96² grain，無逐點配置／hash／trig／sqrt。保守旋轉support sqrt((0.16+0.065)²+0.38²)+0.025約0.4666小於owner半寬0.5，seeded signed UV週期。0.04 m參考tile／0.02 UV relief，名義長度0.0038 m與肋高0.0011 UV（按參考尺度換算44μm，非geometry／displacement／實機量測）；全opaque M0／mortar0，維持options、Worker、cache與ownership。果實俗稱種籽，不新增植物生長或透明間隙。

形態參考：[Caraway — Wikipedia](https://en.wikipedia.org/wiki/Caraway)，描述月牙形果實與五條淺色縱肋。此為表面近似而非植物geometry，未打包參考圖片。

新增 `springpinends` 開槽中空彈簧銷端面：36個隨機朝向C形平切鋼管壁，中央通孔以低背景表示，單一窄槽由孔腔連續開至外緣；不是circlips雙耳卡簧或盲凹穴螺栓。重用既有快取姿態與compact平方annulus／C1槽profile，內外bevel與slot以乘積混合，無角度接縫／nearest-edge crease。每端面五值共180個Float64／1440 bytes與128² grain，無逐點配置／hash／trig／sqrt，outerRadius0.36加jitter0.025小於owner半寬0.5。六乘六配置令支援的32²最小map仍可取樣到管壁，而非八乘八配置使窄環完全落在像素之間。0.064 m參考tile／0.03 UV relief，平切面micrograin高度跨度0.00006 UV（按參考尺度換算3.84μm，非位移／實機量測）。管壁M1、低背景M0，facade metallic factor1，邊緣連續混合，mortar為1-face；全opaque，孔槽不是真透明geometry，不模擬壓入變形或彈性，維持options、Worker、cache與ownership。

形狀參考：[Slotted Spring Pins — DRIV-LOK](https://driv-lok.com/products/pin-fasteners/roll-pins/slotted-coiled-spring-roll-pins/)，包含中空開槽截面圖。此預設僅近似端面，不是ASME尺寸或強度認證，未打包參考圖片。

新增 `rhyolite` 粉褐細基質流紋岩：14道週期彎曲明暗流紋與稀疏淡色斑晶，直接共用porphyry正式sampler的256個潛在旋轉晶體site及平切面契約。每site六值共1536個Float64／12288 bytes，96² grain；僅rhyolite配置3² flow warp，0.6 phase warp及平方距離C1肩部，radius平方與inverse shoulder只在sampler建立時計算。最大晶體support sqrt(0.14²+0.06²)約0.1524小於site離owner邊界最短0.35；未出現斑晶的site不留幽靈mask。crystalChance0.25是seeded程序分派而非地質含量，細基質色帶與晶體皆不改拋光面height，晶體較淡且較平滑。0.12 m參考tile／0.0005 UV relief，micrograin跨度0.0000075 UV（按參考尺度換算0.9μm，非geometry／位移／實機量測）。全opaque M0／mortar0，無逐點配置／hash／trig／sqrt；既有porphyry不配置flow lattice且原算式保留，沿用options、Worker、cache及ownership，不新增熔岩流動、礦物成分或光學認證。

礦物外觀參考：[Rhyolite — Geology.com](https://geology.com/rocks/rhyolite.shtml)，描述粉紅或灰色細基質、可能較大的斑晶與流動構造。此預設選擇拋光流紋外觀，不模擬每種天然晶洞，未打包參考圖片。

新增 `tonkabeans` 深褐近黑零陵香豆：64個隨機旋轉、微彎閉合橢長種籽，沿長軸彎曲的不規則凹皺紋與細粒表皮；不是datepits單一縱槽或cubebberries帶梗圓果。沿用既有isolated owner-cell姿態／平方elliptic body／C1 shoulder模式，五值姿態共320個Float64／2560 bytes，40×6 wrinkle lattice及3×6 warp為快取，128² grain；最大保守support sqrt(0.36²+(0.16+0.02)²)+0.015約0.4175小於owner半寬0.5。皺褶同時較暗、低、粗糙且AO較深，沒有用顏色假冒凹陷；兩端閉合而非切開果仁。0.20 m參考tile／0.0275 UV relief，參考長18mm、寬8mm，wrinkleDepth0.12相當0.0033 UV（按參考尺度換算0.66mm，非geometry／位移／實機量測），micrograin跨度參考27.5μm。全opaque M0／mortar0，無逐點配置／hash／trig／sqrt，沿用options、Worker、cache及ownership；不新增乾燥動力學、內部果仁或化學／食用用途。

表面參考：[Dipteryx odorata](https://en.wikipedia.org/wiki/Dipteryx_odorata)描述黑色皺紋種籽；[Alyssa Ashley零陵香豆文章](https://www.alyssaashley.com/blogs/blog/origin-and-meaning-tonka-beans)及已讀種籽照片僅作橢長皺皮外觀參考。未打包圖片、不模擬淡晶霜，也不背書食用或醫療宣稱。

新增 `pentalobescrewheads` 五圓瓣盲凹穴螺絲頭：36個隨機朝向平切鋼頭，五個圓瓣與中央平底凹穴相連，無中央防拆柱，不是既有六瓣starsocketbolts。沿用isolated owner-cell快取姿態／compact平方profile／C1乘積union模式，180個Float64姿態共1440 bytes，加十個Float64瓣心offset共80 bytes與128² grain；所有sin／cos只在sampler建立時計算，命中鋼頭後才轉local軸，無逐點配置／hash／trig／sqrt。head support0.37+jitter0.025=0.395小於owner半寬0.5；凹穴support0.19低於平切head core0.35，平底中央與五瓣連通，重疊弧線無nearest-edge crease。0.048 m參考tile／0.03 UV relief，名義頭徑5.92mm、凹穴深0.012 UV（按參考尺度換算0.576mm）、平面micrograin跨度參考2.88μm；非geometry／位移／實機量測，也不認證P2／P5／P6尺寸或工具適配。鋼頭及盲穴底M1、低背景M0、mortar1-face，facade metallic factor1。全opaque，不是透明穿孔；沿用options、Worker、cache及ownership，不新增鎖付力學、工具或產品專用功能。

孔型參考：[iFixit — Apple’s Diabolical Plan to Screw Your iPhone](https://www.ifixit.com/News/14279/apples-diabolical-plan-to-screw-your-iphone)及已讀Torx／security Torx／pentalobe比較圖，區分五個較圓瓣與無中央柱。此為圓瓣表面近似，不是專有起子精密孔型，未打包參考圖片。

新增 `padauk` 橙紅開孔木紋：選取African padauk的暖紅橙直紋面與較粗、稀疏的縱向開放導管，18道低對比細色紋，不是sapele七道寬紅褐帶或深褐wenge。直接fallthrough共用兩者正式sampler，128個潛在孔site以poreChance0.65做seeded選取，未占用site用zero inverseLength且整個owner保持無孔；仍每site四值共512個Float64／4096 bytes，3×4 warp／64×4 fiber／128² grain快取；縱向center擴至0.3–0.7，避免固定整列打孔感；孔寬最大0.055小於site至x邊界最短0.25、孔長最大0.27小於y邊界最短0.3。新增preset bandContrast0.09僅在sampler建立時選用；既有兩木材維持0.3與原運算、無新增noise field或逐點配置／hash／trig／sqrt。色紋僅顏料、不做凸肋，導管則真的較低、較暗、較粗糙且AO較深。0.16 m參考tile／0.002 UV relief，poreDepth0.12為0.00024 UV（按參考尺度換算38.4μm，非geometry／位移／實機量測），micrograin跨度參考0.96μm；全opaque M0／mortar0，沿用options、Worker、cache及ownership。不新增自然老化、UV螢光或木材力學，也不把程序孔數當成真實植物學量測。

木材參考：[The Wood Database — African Padauk](https://www.wood-database.com/african-padauk/)及已讀面紋照片，描述新切紅橙心材、通常直紋、粗開放質地與大導管。未把endgrain辨識數據當成面紋尺寸，也未打包參考圖片。

`cottonflannel` 是素色、平紋基底的棉法蘭絨近似，不是把所有flannel都定義成棉或平紋。直接重用既有平衡32×32、一上一下的雙紗support／lift核心；連續短拉絨遮住94%底紋顏色並只保留4%底織紋高度，原本的織孔也被nap覆蓋，不是開放網布、皮革毛孔或直立天鵝絨pile。僅新kind配置5×5 brush與96×32 nap快取場（3,097個Float64／24,776 B），微warp形成有方向、無硬邊的短細絨變化，重用既有128×128 grain；無逐點配置／hash／trig／sqrt。0.024 m參考tile／0.01 UV relief，主nap場理論高度跨度0.001 UV（按參考尺度換算24μm），cloud跨度參考4.8μm；不是實測纖維長度、幾何位移或微距掃描。全opaque M0／mortar0，高roughness且孔位保持連續淺AO；使用既有options、Worker、cache與ownership，不新增髮絲幾何、視角依賴fuzz BRDF或布料模擬。

織物參考：[Britannica — flannel](https://www.britannica.com/topic/flannel)、[Encyclopedia of Clothing and Fashion — Napping](https://www.encyclopedia.com/fashion/encyclopedias-almanacs-transcripts-and-maps/napping)及已讀[供應商素色／格紋swatches](https://img.waimaoniu.net/3667/3667-202608191613262383.jpg)。只近似素色起毛面，未複製格紋或打包外部圖片，不認證保暖／耐磨等物理性能。

`pinolith` 近似拋光深色基質中帶灰色包裹體的淡色尖透鏡菱鎂晶，不是浮雕米粒或礦物生長模擬。雙偏置ellipse的C1交集、變動長寬與偏置及週期cloud微warp形成不等晶形；500晶各九值共4,500個Float64／36,000 B。每個wrapped 3×3鄰域的canonical晶序預先寫入4,500個Uint16／9,000 B，opaque合成讓上層晶體遮住後方輪廓，不把所有黑邊透畫成葉片線稿；無逐點排序／配置／hash／trig／sqrt。每晶快取的保守半徑小於0.903，省略owner最短距離1.1，32² cloud／128² grain皆快取。0.1 m參考tile／0.001 UV relief，晶體及暗邊共用平切面，只有grain理論跨度0.000003 UV（按參考尺度換算0.3μm）；不是幾何位移、顯微掃描或實測晶體尺寸。全opaque M0／mortar0／AO1，維持既有options、Worker、cache與ownership，不新增折射、真實解理或岩石物理。

石材參考：[Geology.com — Pinolith](https://geology.com/gemstones/pinolith/)及已讀cabochon照片，說明石墨染深的白雲質岩石中淡色松子狀菱鎂晶；另已讀[供應商標本照片](https://www.pinolite.com/Pictures/pinolith1.png)，只取表面外觀，不採療效或排他產地敘述，未打包參考圖片。

`tripointscrewheads` 近似36個各自seeded旋轉的圓形鋼製螺絲頭，每個有三條相隔120°、在中心連通的直線圓端盲槽；不是偏置Tri-Wing或帶中心柱的防拆孔。直接共用pentalobe的head／backing核心，三條squared-segment距離的C1肩以有界product union連成同一平底；180個Float64 head pose／1,440 B及六個Float64單位軸／48 B只建一次，128² grain快取，surface sampler無逐點配置／hash／trig／sqrt。槽支撐最大半徑0.3小於完整head半徑0.35，head外半徑加jitter為0.395小於owner半寬0.5。head及盲穴底M1、低backing M0，facade metallic factor1，mortar為1−face而非穴底遮罩，maps全opaque並沿用options／Worker／cache／ownership。0.048 m參考tile、0.03 UV relief，穴深0.012 UV按參考尺度換算0.576 mm；grain理論高度跨度0.00006 UV換算2.88μm。只改表面shading／normal，不新增螺紋或工具幾何，不承諾Y00等刀頭尺寸配合、標準認證、扭矩或防拆性能。

槽形參考：[iFixit — Nintendo Switch screwdriver](https://www.ifixit.com/Wiki/Nintendo_Switch_Screwdriver)及已實讀的中心Y形示意圖，另以[Tiger Fasteners — Two different Y drives](https://tigerfasteners.com/resources/two-different-y-drives/)對照中心連通Tri-Point與偏置Tri-Wing；只採外觀拓撲，不假定通用尺寸標準，也未打包參考圖片。

`septarian` 近似灰褐宿岩、褐色襯邊與淡奶油方解石填裂的拋光內部切片，不是開放凹縫或完整圓結核。36個週期site各三值共108個Float64／864 B；初始化以7×7鄰域的48條候選半平面及可重用52頂點scratch裁出真正Voronoi facets，僅保留active normalized planes。三個已測seed各216 facets／648個Float64，並非所有seed的新增固定契約。點階段取5×5候選並做半徑cull，covering radius小於1.344、漏除owner最短2.05、漏除鄰site最短3.1大於兩倍半徑。3² cloud及12²細fracture warp／128² grain皆快取，warp擾動Jacobian的保守∞範數界0.63小於1；變寬填裂與brown lining以真正facet肩的C1 product連接，不用nearest-plane切換，surface sampler無逐點配置／hash／trig／sqrt。0.12 m參考tile／0.001 UV relief，所有礦物相共用平切面，僅grain理論跨度0.000003 UV，按參考尺度換算0.36μm；M0／mortar0／AO1且全opaque，所有礦物顏料沿用tint及既有options／Worker／cache／ownership。不新增幾何、透明洞、礦物生長或通用化學組成認證。

礦物參考：[Mineralogical Society of America — Concretions](http://minsocam.org/msa/collectors_corner/id/display/concretion.htm)及已實讀的[Utah標本照片](http://minsocam.org/msa/collectors_corner/gallery/septaria1.jpg)，說明不純石灰質polygon blocks及褐／黃兩代方解石填裂；此preset只近似該標本外觀，不把所有褐色septarian襯邊一概稱為霰石，也未打包參考圖。

`squaresocketheads` 是25個各自seeded旋轉的圓鋼head與四平邊方形盲穴，直接fallthrough共用hexsocketheads的正式head／backing核心。兩個paired absolute-half-plane肩相乘，讓四角C1且不是max-distance稜線、六角或圓孔；舊hex保留原本左結合三mask乘法次序。125個Float64 pose／1,000 B與128² grain只初始化一次，不另配方形axis表，surface sampler無逐點配置／hash／trig／sqrt。方孔支撐半徑約0.25456小於完整head半徑0.33，head外半徑加jitter為0.405小於owner半寬0.5。head與近乎平坦的盲穴底M1、低backing M0，facade metallic factor1，mortar為1−face而非洞遮罩且全opaque。0.06 m參考tile／0.03 UV relief，名義head-to-floor深度0.0126 UV按參考尺度換算0.756 mm；floor grain理論跨度0.00006 UV換算3.6μm。沿用options／Worker／cache／ownership，只是shading／normal，不承諾Robertson品牌或特定driver尺寸配合、實體taper、螺紋幾何或防cam-out性能。

槽形參考：[Aspen Fasteners — Square Drive Recess／Robertson Drive規格](https://www.aspenfasteners.com/content/pdf/square_drive_specification.pdf)說明四個插入方向的方形凹穴及多種真實尺寸；此視覺preset不照搬特定尺寸，也不繼承供應商的扭矩、保持力或通用配合主張，未打包參考圖。

`bronzite` 近似選定的深褐磨光Bronzite石面：不同方向的細密青銅色短紋只在局部亮起，暗褐石粒與亮flecks共用平齊切面，不是整片同向機刻條紋、藍灰Pietersite、金屬礦或凸金箔。沿用既有不規則五半平面fragment leaf與舊Pietersite算術順序，新kind才加96² C1 fleck gate，且每點在鄰格loop外只取一次；它是固定顏料快照，不是變角schiller／chatoyancy或光學模型。20²個23欄fragment owners、5×7 cloud／128² grain／96² fleck共34,835 Float64／278,680B tables，非總RAM；constructor預算seed pose、trig與support，每點無配置／hash／trig／sqrt。3×3鄰格與circle cull的保守support上界約1.224216，小於漏除owner最短1.25；五個C1肩乘積與periodic cached fields保留signed連續性。0.12m nominal tile、0.0008 UV relief僅作者參考，顏色不雕height，AO1／metallic0／mortar0、opaque與近乎平面normal保持一致；選用height、tint／Worker／cache／repeats及ownership不變。不是照片掃描，不新增真geometry／動態閃光／透射，也不認證礦種、產地、天然處理、硬度、價值或療效。

外觀參考：實讀[UFRGS的Enstatite教學文件（2022年3月版）](https://www.ufrgs.br/minmicro/Enstatite.pdf)，其保留Bronzite作傳統含鐵enstatite變體用語，並說明反射下可見青銅至暗色的內部反射；不將傳統名稱認證成獨立礦種，也不把薄片PPL／CPL干涉色當石材base color。實讀[Ra’ike的Commons照片attribution頁](https://commons.wikimedia.org/wiki/File:Bronzite_-_Variety_of_Enstatite.jpg)並實看可用960px thumbnail，取深褐／青銅細紋外觀，不打包影像或聲稱重現其變角閃光。Gemopedia只回challenge、CAMEO403，未記為成功閱讀。

`pietersite` 是藍灰與金褐纖維角礫膠結的風格化拋光切面，不是平行整片tigereye條帶，也不把顏色當金屬或挖成凹溝。36個不規則五半平面clast各自含纖維方向、彎曲band／細fiber與blue/gold相，23值pose共828個Float64／6,624 B；5×7 cloud與128² grain共16,419值皆快取。3×3 owner加圓界cull，半徑保守上界1.045164小於漏除owner最短1.15；五個C1 shoulder乘積沒有nearest-plane角稜，surface sampler無逐點配置／hash／trig／sqrt，needsDetail bypass保留。單一藍灰→金褐authored ramp讓全部礦物顏料沿用tint，M0／mortar0／AO1及opaque。全相同一平切面，只含grain理論高度跨度0.000003 UV；0.06 m參考tile／0.001 UV relief按參考尺度換算0.18μm，不是幾何位移或實測纖維尺度。沿用options／Worker／cache／ownership，不宣稱視角相關chatoyancy、anisotropy、半透明、產地鑑定或地質生成模擬。

礦物參考：已實讀[Hu與Heaney — A Microstructural Study of Pietersite from Namibia and China（GIA，2010）](https://www.gia.edu/dam/migrated-assets/docs/doc1/A-Microstructural-Study-of-Pietersite-from-Namibia-and-China.pdf)七頁文字，並將原PDF第七頁Figure 8標本照片實際rasterize檢視。採局部不同方向纖維束及藍灰／金褐角礫外觀，不將所有產地視為相同地質成因，不宣稱此固定PBR貼圖重現研究中的動態chatoyancy，也未打包參考圖片。

`castorbeans` 為16個各自seeded旋轉／微偏移的亮面斑駁橢圓種皮，每顆只在同一端接上一個較淡、較粗糙的種阜（caruncle）；不是乾皺tonka、縱槽date pit、雙種阜或透明種子。80個Float64 pose／640 B及16×9 spots、5×7 warp、128² grain共16,563值皆初始化快取。沿用既有oval seed squared-cap／C1肩及順序compositing，種阜與種皮重疊連通；保守旋轉支撐界0.29+0.09加jitter0.025為0.405，小於owner半寬0.5。深色testa斑紋只改顏料、不雕凹高度；種皮凸面與種阜各自smooth dome，M0／mortar0／全opaque。surface sampler無逐點配置／hash／trig／sqrt，needsDetail bypass保留。0.064 m參考tile／0.03 UV relief下主體長軸換算9.6 mm、種阜寬2.88 mm；grain理論高度跨度0.000045 UV換算2.88μm，只是參考尺度，不是植物測量或geometry displacement。沿用options／tint／Worker／cache／ownership，不新增生長、果莢、藥用或食用功能。

`zebrawood` 是淺金黃褐木面、深褐變寬微彎縱紋與分布於深淺部位的稀疏開放導管，不是斑馬毛皮、端面年輪、雕凹條紋或只替wenge換色。沿用既有hardwood的seeded橢圓導管／C1肩與cache-noise，額外讓深色縱紋寬度連續變化；暗紋只改顏料，真正淺凹只有導管，全部opaque M0／mortar0。導管pose 512個Float64／4,096 bytes與3×5 warp、18×4 width、64×4 fiber、128² grain共16,727值皆初始化快取；無逐點配置／hash／trig／sqrt，needsDetail bypass保留。0.16 m參考tile／0.002 UV relief下導管名義深度0.0002 UV換算32μm，grain理論高度跨度0.000006 UV換算0.96μm，只是參考尺度、不是真實解剖測量或geometry displacement。沿用既有options／tint／Worker／cache／ownership，不新增生長、樹種辨識、anisotropy或動態chatoyancy。

`twopinscrewheads` 為25個各自seeded旋轉／微偏移的圓鋼head，每顆有兩個相對、彼此分離的圓形盲凹穴，保留平坦金屬底與完整中央鋼橋；不是連通槽、三孔、中心柱或打穿backing。直接fallthrough共用既有hex／square的head／backing／blind-floor核心，以兩個不重疊squared-circle C1肩相加；原四／六平邊乘法次序不變。125個Float64 pose／1,000 bytes及128² grain皆只初始化一次，surface sampler無逐點配置／hash／trig／sqrt，needsDetail bypass保留。單孔最外支撐0.222小於完整head半徑0.32；孔心距0.31大於兩倍孔半徑0.134，中央鋼橋寬0.176；head外半徑加jitter為0.395小於owner半寬0.5。head及盲穴底M1、低backing M0，mortar為1−face、全opaque，public facade的metallic factor為1。0.06 m參考tile／0.03 UV relief下名義穴深0.0129 UV換算0.774 mm，floor grain理論跨度0.00006 UV換算3.6μm；只是參考尺度，不是實測機械尺寸、真正geometry displacement、螺紋或driver配合認證。沿用既有options／tint／Worker／cache／ownership。

`redberyl` 近似淡色顆粒流紋岩上的覆盆子紅綠柱石，選沿晶軸看向平坦六角底面的表面視角，不是假裝重建照片中的側向高柱；不是Quartz尖錐、圓斑、六瓣花、方片、印刷或凹洞。緊湊leaf沿用既有cached noise、seeded pose與C1平方半平面肩慣例，三組相隔60°的平方strip相乘，保留六直邊及平坦凸頂；種子決定旋轉、偏移、半徑、頂高與疏密。4×4 owners的8欄pose加8² cloud及128² grain共16,576 Float64／132,608B tables，非總RAM；support平方及肩倒數在建構預算，保守owner margin約0.0556 cell、不搜尋鄰格，逐點無配置／seed hash／trig／sqrt。晶面較光滑、顆粒母岩較粗糙，M0／opaque／淺AO差異，無假黑洞；保留signed C1及既有height圖每圖正規化。Nominal tile0.18m，從root `await ProceduralMaterial.create('redberyl', { size: 512, seed: 7, heightMap: true })`使用既有Worker／cache／ownership與destroy。這是五maps外觀，不增晶柱mesh、透光／折射／多色性／散射，不認證礦種、產地／天然染色／硬度／稀有價值或療效，不打包照片。

參考：實讀[GIA 2003 Red Beryl from Utah: A Review and Update](https://www.gia.edu/dam/migrated-assets/docs/doc1/Winter-2003-Gems-Gemology-Red-Beryl-Utah-Review-Update.pdf)關於六角柱與平坦basal pinacoid的描述，實看[Didier Descouens的紅綠柱石標本](https://commons.wikimedia.org/wiki/File:B%C3%A9ryl_Rouge.jpg)與[Rob Lavinsky標本](https://commons.wikimedia.org/wiki/File:Beryl-235618.jpg)近照；只取紅色晶面與淡色母岩對比，不將歷史開採／產地或寶石宣稱當成引擎認證。Mindat原頁403、原圖429，改用可讀的GIA全文與Commons thumbnail，未冒稱被擋頁面／圖片已看。

`cottondrill` 近似暖卡其色3/1經面棉斜紋：同色經緯、連續三緯經浮長及單向逐緯推進的斜紋，不是1/1平織、2/2籃織、來回人字、藍白Ticking或畫上斜線。直接共用既有profiledWeave whole-float核心，只在建構選新preset與同色yarn tone；144經／96緯及4×4 draft保留整數週期，平方C1 cover／圓冠與完整浮長肩保留穿越owner邊界的凸起，不逐緯夾成珠。4×4×6 float profiles加128² grain共16,480 Float64／131,840B tables，非總RAM；逐點無配置／seed hash／trig／sqrt，無新增nap／slub cache。Nominal tile0.08m、default metallic0、五maps opaque，細縫是低介電底而非透明孔；淺normal、霧面roughness及密實AO，height圖仍依既有每圖min/max正規化，不能推論實際布厚。從root `await ProceduralMaterial.create('cottondrill', { size: 512, seed: 7, heightMap: true })`使用，沿用Worker／cache／ownership與destroy契約。不模擬布料、透光或纖維幾何，不認證棉含量、GSM／支數／實體密度、耐用／安全或洗護。

參考：[Cotton Incorporated的Drill介紹](https://thefabricofourlives.com/cotton-fabrics-drill/)與已實看的[卡其棉斜紋近照](https://thefabricofourlives.com/wp-content/uploads/2025/09/drill-fabric-square.jpg)；另實讀[RK Cotweaving的200 GSM Cotton Drill](https://rkcotweaving.com/200-gsm-cotton-drill-fabric/)中3/1 twill描述，只選此視覺變體，不把供應商重量／紗支／性能宣稱移植成引擎認證，不打包照片。

`bluelaceagate` 近似淡藍Blue Lace Agate磨光面：平齊藍底上有粗細不等、交替成對的白色細蕾絲波紋；不是鈷藍Lapis、灰石、同寬印刷條紋、凸白脊或凹槽。直接共用既有Rhodochrosite平齊色帶核心，不增第二個sampler；只在建構時替新種類選48×3細warp grid，原種類仍9×3、原算術次序及preset值不變，局部calcite名稱改中性的paleBand。9整數色帶週期搭配大／細平滑warp、兩種不重疊平方肩，既有C1 cache／週期wrap維持signed連續；新色帶不加入height或AO陰溝。3²／48×3／12²／128²四表共16,681 Float64／133,448B，非總RAM；逐點無配置／seed hash／trig／sqrt。名目tile0.12m、default metallic0，五maps opaque、normal接近平面；可選height仍沿既有每圖min/max正規化，不能由0–255色階推論宏觀凹凸尺度。Tint／repeats／native Worker／cache所有權不變。只近似靜態外觀，不認證礦種／天然或染色／產地／尺寸／硬度／寶石價值，不模擬半透明邊、散射、晶體光學或療效。

參考：[The Gem Shop BLL334c手切Blue Lace Agate](https://thegemshop.com/products/bll334c-blue-lace-agate-cabochon)的淡藍白細蕾絲色帶描述，以及[The Curious Gem蛋面頁](https://www.thecuriousgem.co.uk/agate-gemstones/CGX20001.html)的獨立照片；兩張實際照片皆已看，不把供應商產地／處理／尺寸／光學宣稱移植成材質認證，不打包照片。

`linchpins` 近似銀色圓環扣Linch Pins：閉合圓線保險環、較粗實心銷柄及凸起冷鐓頭，兩側環內留暗色介電間隙；不是開口R型髮夾銷、雙腳開尾銷、平墊圈或禁止符號印刷。新小leaf沿用periodic cached noise、平方環帶／capsule及smooth cover慣例，八次superellipse收圓方頭；依序疊環、柄、頭的真height冠，不把三種表面壓成同高平片。偶數4×4交替斜向排列保留signed週期；建構時計算inverse尺寸與保守support，預設最少留0.117 cell margin，不搜鄰格，空支撐跳過geometry、零cover跳過冠計算。96² grain共9216 Float64／73,728B tables，非總RAM；逐點無配置／seed hash／trig／sqrt。名目tile0.2m、default metallic1，但metallic map只覆蓋實物、間隙為M0；五maps皆opaque，不是alpha挖空或真穿孔mesh。可選height／tint／repeats及native Worker／cache所有權不變。只近似靜態閉合外觀，不認證DIN尺寸、鍍層化學／耐蝕、承載／防脫／安全，不模擬扣合、彈簧、碰撞或轉動。

參考：[Pivot Point Lynch Pins及原廠圖](https://www.pivotpins.com/products/bg-lynch-pins.html)、[Pinstructure圓環扣Linch Pins](https://www.pinstructure.com/ProductGrp/Linch_Pins_Round_Keep)；已實看原廠近照、CAD輪廓及另一供應商近照。只選銀色外觀，不移植化學／尺寸／安全宣稱，也不打包照片。

`silknoil` 近似天然奶油白、霧面的Silk Noil絹紡短纖布：細平織交替紗冠與雙向稀疏細小真凸纖維結，不是亮面繅絲Shantung、satin、暗凹孔、棕色印點或大顆粒。「Raw silk」有時是Noil商業稱呼，不表示未清洗去膠的sericin原絲。新小leaf重用periodic cached noise與平方compact support；交替紗項及斜率在owner歸零，128偶數紗列維持signed週期。48² nep owner只在建構快取admission、位置、方向、inverse尺寸及奶油至淡褐色調；平方橢圓冠真增height，smooth cover改色素／roughness／AO。最大預設支撐留0.08 cell margin、不搜鄰格。48²×6 nep表加128² grain，共30,208 Float64／241,664B tables，非總RAM；逐點無配置／seed hash／trig／sqrt。名目tile0.12m、default metallic0，五maps／可選height／tint／repeats及native Worker／cache所有權契約不變。只近似靜態外觀，不認證混紡／sericin／產地／洗護／密度／momme／垂墜／強度或安全，不模擬布料動態或真實短纖。

參考：[Lyrical未染Noil](https://lyricalfabrics.com/product/undyed-raw-silk-noil/)、[Confident Stitch短纖及Noil說明](https://www.theconfidentstitch.com/2022/09/14/why-we-love-silk-noil-aka-raw-silk/)、[Silk Wholesalers暖白Noil](https://silkwholesalers.com.au/products/noil-silk)；Lyrical與wholesaler實際近照皆已看，不把供應商成分宣稱移植成視覺材質認證，也不打包照片。

`bloodwood` 新增所選鮮紅Bloodwood（Brosimum rubescens／Satine）縱切面，細緻、略游移的直紋與稀疏細短真凹導管；不是橘色Padauk、紫心木、灰木、螢光紅漆、密集焦痕孔、端木或凸起燈芯絨色帶。既有疏孔木材kernel只加三處新kind admission，不改共享運算：compact squared孔支撐、constructor-only seed、共平面色帶、256×10細纖維與128² grain。48×16×4孔表加3×4 warp及fiber／grain共22,028 Float64／176,224B tables，非總RAM；最大支撐至少保留X0.185／Y0.155 owner margin。逐點無配置／seed hash／trig／sqrt／鄰格搜尋。名目tile0.12m，孔內降低height、增加roughness與輕微AO；具光澤感的紅色表面仍是介電，default metallic0。只近似選定紅料，不涵蓋所有figure，不認證樹種／產地／色彩、view-dependent chatoyancy、解剖尺寸、日照老化、木塵安全或力學性質。

參考：[Wood Database Bloodwood](https://www.wood-database.com/bloodwood/)與[砂磨](https://www.wood-database.com/wp-content/uploads/bloodwood.jpg)／[封閉](https://www.wood-database.com/wp-content/uploads/bloodwood-sealed.jpg)縱切掃圖，皆已實讀／實看；端木解剖「少量大孔」不等於此表面的校準尺寸，不打包掃圖。

`cavansite` 近似稀疏、亮藍、真凸起的短針狀放射晶簇，落在占多數的暖白粗粒礦物基底；不是磨光藍圓珠、平印花、Fluorite方晶色帶或Pentagonite長刺星形。只參考館藏標本的藍晶簇／淺底組合，opaque五maps不模擬真實晶體光學、化學、透明／螢光、礦種鑑定、產地或校準尺寸。新小leaf重用periodic cached noise與smooth compact support，以平方徑向冠及36根constructor快取、略不規則短放射針的complement product合成；徑向body邊界的色素／高度／AO皆C1。每owner的admission、旋轉、縮放與jitter只在建構時計算，預設最大支撐至少留0.155 cell margin、不搜相鄰owner。4²×6 site表、36×4 needle表、128² grain及32² host共17,648 Float64／141,184B tables，非總RAM；逐點無配置／seed hash／trig／sqrt。名目tile0.16m，藍晶簇真凸起且比基底光滑，實物含釩不代表金屬表面，default metallic0。

參考：UNB Earth Science Collections [UNB-2017-0143藍晶／Stilbite標本](https://unbgeology.lib.unb.ca/specimens/unb-2017-0143)、[UNB-2017-0139標本](https://unbgeology.lib.unb.ca/specimens/unb-2017-0139)，兩張實際照片皆已看；另讀[Cavansite鑑別說明](https://en.wikipedia.org/wiki/Cavansite)，區分球狀晶簇與更長刺的Pentagonite。照片不打包。

`matelasse` 近似暖象牙白的織成絎縫布：連續凸起菱形接結網、略蓬鬆內片及細緻交替紗冠；不是 `quilting` 的下凹虛線車縫、cathedral-window 折片、充氣軟墊格或印花菱線。參考真實菱形 Matelasse 床罩，只選 cotton-like 外觀，不認證纖維、織機結構、產地、尺寸、洗護或耐磨。獨立小 leaf 重用既有 periodic lattice 與 smooth support：雙斜向緊支撐凸肋以 bounded smooth union 合成，不用 nearest-rib 切換或交點加倍；平方內片支撐在 owner 平坦接合，交替紗冠項及其斜率在紗線 owner 歸零。128 偶數紗列與六次斜向重複維持 signed UV；唯一不可變 128² grain 表共16,384個 Float64／131,072B tables，非總RAM，逐點不配置、不 seed hash、不三角／sqrt、不掃鄰格。名目tile0.24m，default metallic multiplier0；五張一般 PBR maps 僅表達靜態視覺凹凸，不模擬布料動態、填棉或真實纖維結構。七項 consumer cases涵蓋凸接結／淺內片、相鄰經緯交替、C1肩線／owner、actual512 opaque象牙白介電maps及signed週期；整合前已跑十六個各自獨立負向與合法加寬凸肋控制。

參考：[Fabric Mill Matelassé結構](https://www.fabricmill.com/fabrics/textural-speciality-fabrics/matelasse.html)、[Bates Mill菱形棉織Matelasse床罩](https://www.batesmillstore.com/products/diamond-matelasse-cotton-coverlet)及[實際凸菱紋照片](https://www.batesmillstore.com/cdn/shop/files/naturaldiamondmatelasse_1200x1200.png?v=1785530941)；已實讀／實看，僅參考外形，不打包照片。

`yellowheart` 新增選定直紋金黃色Yellowheart（Euxylophora paraensis／Pau Amarello）縱切面：細而低對比的縱向紋理配稀疏短開口導管，不是橙色Padauk、紫木、螢光黃漆、密集環孔條、凸帶、端木紋或真正satinwood鑑定。重用Padauk／Iroko／Purpleheart／Sapele／Wenge kernel，只將新preset納入fine-grain路徑：constructor稀疏admission、compact平方橢圓、週期warp色帶、224×6細fiber、128² grain及真正淺凹導管。40×12×4 pore cache加3×4 warp與fiber／grain lattice共19,660個Float64／157,280 B tables，非總RAM。導管support至少留0.17／0.11 owner margin，維持C1；色素細紋留在緞光平面，稀疏管腔才降低height、增roughness及輕AO。逐點不新增配置／hash／trig／sqrt／鄰格掃描，nominal tile0.12m。五maps、可選height／tint／repeats、native Worker／cache、dielectric預設與顯式metallic override、獨立textures及destroy契約不變。此為所選金黃木料靜態外觀，不是樹種／產地認證、色彩校準、解剖尺寸、日照老化、木塵安全或力學性質模擬。

參考：[Eric Meier／The Wood Database Yellowheart](https://www.wood-database.com/yellowheart/) 說明淡至金黃、通常直紋、fine uniform texture與高光澤，diffuse-porous且少數較大導管；已實看[磨砂](https://www.wood-database.com/wp-content/uploads/yellowheart.jpg)及[封面處理](https://www.wood-database.com/wp-content/uploads/yellowheart-sealed.jpg)縱切圖。[Pete Stephano／Woodcraft Woodsense](https://www.woodcraft.com/blogs/wood/woodsense-spotlight-on-yellowheart) 說明幾乎不顯的直紋、少數figure與色彩變異。兩者均區分Brazilian satinwood商名與真正satinwood。不打包照片、不重現或認證特定木板。

`rclips` 新增亮色彈簧線R型髮夾銷近似：單圓拉環、一根長直插腳、帶內收頸的彎曲彈簧腳與外張短端。拉環內部、彈簧間隙及自由端間隙皆連到暗色凹底，不是封閉墊圈、扁平開口銷或兩根平行U腳。重用paperclip的capsule／half-ring kernel與complement union，快取13段各5值、1彎各5值及既有96² grain，共9,286個Float64／74,288 B tables，非總RAM。第二組smooth cover只為R-clip建立圓線冠，metal沿線材mask，空底保持dielectric；既有paperclip分支不變。Face與crown重用平方距離，逐點不新增配置／hash／trig／sqrt。最大local support0.42605小於半格，capsule projection、重疊arc肩、seed grain及signed UV repeat維持C1。Tile0.12m、交替±45°擺放固定，seed只改微grain、不改製品輪廓。五maps、可選height／tint／repeats、native Worker／cache、顯式metallic override、獨立textures及destroy契約不變。此為height-field外觀近似，不是DIN認證零件、尺寸圖、材質等級或彈力／疲勞／保持力模擬。

參考：[Pivot Point Hair Pin Cotters](https://www.pivotpins.com/products/bs-hair-pin-cotters.html) 說明可重用彈簧式R clips與spring-wire／不鏽鋼選項，已實看其[單環產品照](https://www.pivotpins.com/products/images/landing-hair-pin-cotter-lg.jpg)。[BLOHM類DIN 11024 R clips](https://www.blohm-gmbh.de/de/en/Products/Product-overview/Joints/Joints/R-clips-similar-to-DIN-11024.html) 區分單環Form E與雙環Form D；已實看[Form E圖](https://www.blohm-gmbh.de/xs_db/BILD_DB/Z/Z0/Z07/layers/www/750/Z07337-nn--en_E.jpg)的直腳、彎曲彈簧腳與外張導入端。不打包參考圖，不重現或認證特定型錄零件。

`ticking` 新增海軍藍／奶白床墊條紋布近似：寬中央染色條兩側各有細線，採緊密2/1經面斜紋。染色沿經紗，奶白緯紗仍在交織點露出，不是印刷實心條、格紋、刷毛、開孔紗網或凸條。重用既有woven-yarn kernel及整段float profiles，雙緯跨度經紗在中間owner邊界仍保持抬起，不縮成逐格珠子。3×3 draft快取54個Float64 profile值，加原有128² grain lattice，共16,438值／131,504 B tables，非總RAM；immutable條紋draft是一般authoring data。窄紗support與squared smooth float profiles維持owner／shoulder／fiber及signed UV seam的C1。條紋色素不驅動height、roughness或occlusion。Seed工作留在constructor，逐點不新增配置／hash／trig／sqrt。五maps、height／tint／repeats、Worker／cache、獨立texture所有權及destroy契約不變，nominal tile0.048m。不作防羽絨、紗密、耐磨、阻燃或製造商認證，既有織物preset不變。

參考：[James Thompson Textiles條紋斜紋布](https://jthompsontextiles.com/ticking-stripe-twill-fabric-collection) 說明棉質ticking、twill及織入縱條；[Honry Fabric〈What is Ticking Stripe Fabric?〉](https://www.honryfabric.com/news/what-is-ticking-stripe-fabric) 說明寬中央條兩側細線、密斜紋或人字紋，及織入而非印花。Preset只選一種2/1 draft，不宣稱所有ticking皆2/1。已實讀[Megan Wilson／Remodelista床墊條紋布](https://www.remodelista.com/posts/object-lessons-classic-twill-mattress-ticking/)、實看其[海軍藍條紋圖](https://media.remodelista.com/wp-content/uploads/2017/02/ian-mankin-ticking-fabric-dark-navy-733x440.jpg) 作外觀參考，不打包照片、不認證品牌或特定樣品。

`sodalite` 新增不透明磨光的藍至藍紫色近似：底色含細顆粒變化，穿插不規則細白calcite-like脈與少量淺斑。不是金屬pyrite、凸白緞帶、開裂洞、透明橙黃色標本、螢光或photochromic hackmanite。新leaf重用既有週期cached noise與squared smooth cover primitives：兩個domain-warped carrier尺度11²／43²，加6² cloud／128² grain與兩組4² warp，共 18,422 Float64／147,376 B table，非總RAM。Carrier level的平方距離形成smooth feathered填實脈線，以complement product合併淺斑，無nearest-site或角度接縫。Hash只在constructor計算；採樣無配置／hash／trig／sqrt／鄰格掃描。白脈只改色素與稍粗糙roughness，height仍是同一平面微grain，AO1／M0／mortar0。Nominal tile0.12 m與UV relief0.0002為作者值，不是礦物尺寸或光性校準；CPU maps、可選height、facade controls／cache／native Worker與cleanup契約不變。

參考：[GIA 2023冬季〈A Remarkable 16.71 ct Transparent Orange-Yellow Sodalite〉](https://www.gia.edu/gems-gemology/winter-2023-lab-notes-remarkable-sodalite) 內文明述一般sodalite為半透明至不透明藍石、帶calcite脈；preset不重現該文罕見透明黃石。[Hobart M. King／Geology.com Sodalite](https://geology.com/minerals/sodalite.shtml) 說明藍至藍紫、白色脈紋，並已實看[Adam Ognisty攝的磨光藍石照片](https://geology.com/minerals/photos/polished-sodalite-lg.jpg)。只作外觀參考、不打包照片、不作成分／產地或標本校準鑑定。

`dalmatianstone` 新增奶白長石／石英近似底、大小不一的深綠黑色礦物聚斑，為磨光平整面，不是凸卵石、凹孔、帶環orb或白雪花。命名採 GIA 論文建議的 Dalmatian stone，不沿用不準確的商業稱呼 Dalmatian jasper；這是作者外觀，不是成分／產地鑑定。10×10 cell各一seeded候選，依seed決定admission／旋轉／寬長／彎曲，128² cached grain也平滑擾動squared contour；斑可跨owner相連，固定週期3×3鄰域防止截斷。Contour乘數最低0.6，最大support＜0.393 cell，遠小於最近被省略site距離1.15。800個pose值＋128² grain及12² matrix共 17,328 Float64／138,624 B table，非總RAM。Hash／trig／inverse radii皆只在constructor計算，取樣無配置／hash／trig／sqrt。Smooth cover只改色素與稍粗糙的暗斑；height僅有同一磨光面微grain，AO固定1、M0、mortar0。Nominal tile0.06 m及UV relief0.002為作者值，不是標本尺寸校準；CPU maps、可選height、facade controls／cache／native Worker與cleanup契約不變。

參考 [Powolny與Dumańska-Słowik，GIA Gems & Gemology 2017秋季 True Colors of “Dalmatian Jasper”](https://www.gia.edu/gems-gemology/fall-2017-dalmatian-jasper)：研究樣本為含黑色arfvedsonite斑的長石／石英岩石，原文明確保留產地不確定性。已實看[圖1粗料與磨光珠／墜](https://www.gia.edu/dam/migrated-assets/images/F17-Dumanska-Figure-1AB_223068-636x.jpg)，不打包參考照片；preset不宣稱墨西哥產地、純石英jasper、tourmaline成分或校準標本重現。

`purpleheart` 新增靜態曝光後的茄紫色紫心木表面，採大致筆直的中等木紋與稀疏閉合端縱向導管。只表示作者選定的曝光色態，不是新切灰褐木、UV／氧化變色動畫、螢光、木種鑑定或物性校準。共用既有 Padauk／Iroko／Sapele／Wenge 導管核心，只在 constructor 選 fine sparse profile；導管底較暗且凹入、略粗糙並有局部 AO，縱長木紋帶仍是平面色素，不是凸起緞帶。30×10 候選 site 用 1,200 個 inverse-ellipse／position 值，加 3×4 warp、192×6 fiber 與 128² micrograin，共 18,748 Float64／149,984 B table，非總 RAM。橫向中心 0.25～0.75、radius 至多 0.09，縱向中心 0.35～0.65、radius 至多 0.28，support 完整落在各 owner 內；週期單 owner 評估與 squared smooth cover 維持 C1。採樣不新增配置、hash、trig 或 sqrt；四個舊 sibling 的 point kernel 與算術次序不變。M 與 mortar 固定 0；nominal tile 0.12 m、UV relief 0.003 為作者選定。CPU maps、可選 height、controls／cache／native Worker 與 cleanup 沿用既有契約。

參考 [The Wood Database — Purpleheart](https://www.wood-database.com/purpleheart/) 的曝光茄紫色態、大致直紋中等texture與少量中大導管描述，並實看[縱切面](https://www.wood-database.com/wp-content/uploads/peltogyne-sp.jpg)、[finished面](https://www.wood-database.com/wp-content/uploads/peltogyne-sp2.jpg)及[短期曝光色態比較圖](https://www.wood-database.com/wp-content/uploads/peltogyne-sp6-fresh2.jpg)。本preset不重現所有解剖鑑定特徵、不模擬老化，也不打包參考照片。

`blackpalm` 新增緞面細磨的黑棕櫚木縱切近似：細密深色纖維維管束主要沿 V 延伸，嵌於棕褐色地組織；不同於 `palmendgrain` 點狀端切纖維束與凹入導管，不含年輪、木節、板縫、深色孔洞或按色紋雕出的凹凸。重用既有 Tigerwood／Snakewood compact curved-spindle pigment kernel，不改兩種舊材質的 point kernel；位置、平方寬長倒數、輕微斜率與彎曲只在 constructor 依 seed 快取。80×12 owner、各兩候選束用 11,520 pose 值，加 96×6 wood、128×8 fiber 與 128² micrograin，共 29,504 個 Float64／236,032 B table，非總 RAM。含 jitter 的單軸支撐最多橫向 0.758、縱向 1.38 owner unit，均小於既有週期 3×3 鄰域所需的 1.5 界。Squared smooth cover 只疊加平面色素，採樣不新增配置、hash、trig 或 sqrt；M 固定 0、AO 固定 1、mortar 固定 0，roughness 為緞面，height 僅有共用細木紋的淺起伏。0.096 m nominal tile 與 0.004 UV relief 是作者選定，不是纖維尺寸、木材等級、力學性質校準或新 shading model；CPU maps、可選 height、facade／cache／Worker controls 與既有 cleanup 契約不變。

參考 [The Wood Database — Black Palm](https://www.wood-database.com/black-palm/) 的深色纖維／淺地組織、無年輪與木節的直紋及樹幹密度變化描述，並實看[細磨縱切掃描](https://www.wood-database.com/wp-content/uploads/black-palm.jpg)與[封閉處理後縱切掃描](https://www.wood-database.com/wp-content/uploads/black-palm-sealed.jpg)。此 preset 選較淺、較疏的作者外觀，不複製照片、不作標本校準，也不打包參考圖片。

`eclips`（不鏽鋼E型擋圈）新增三個朝內接觸部、兩個連到軸孔的寬翼口袋及外通漸張開口，不是既有帶雙鉗孔的C型卡簧。16組小幅旋轉／jitter／縮放pose共80個cache值，加96² grain為9,296 Float64／74,368 B，僅為table預算、非總RAM。Squared-radius covers與smooth half-planes讓單軸支撐含jitter最多0.35 cell，小於0.5 owner邊界；中央接觸部或空軸孔保護鏡像口袋的abs-x接縫。取樣無配置／hash／trig／sqrt／鄰格掃描，空背板略過grain。金屬面、height、roughness與AO同cover混合，metallic圖為鋼面1／不透明背板0，default material factor 1。0.064 m nominal tile與0.004 UV relief為作者選定，非尺寸認證。沿用四maps、optional height、tint／repeats／Worker／cache及ownership，不新增mesh通孔、透明、軸件裝配、彈簧力學或負載額定模擬。

外觀參考：[Huyett DE-040-SS](https://www.huyett.com/de-040-ss)列為passivated stainless、stamped、DIN 6799-style external E clip；已實看[產品照片](https://www.huyett.com/media/cache/attachment/filter/product_gallery_main/dc8e2292b789b88fc4fad4a609bb0e74/5050855/ff8ae7abc042bb8dd95e54c253d09e849a64e779_PHL_DE_SS.jpg)及[輪廓剖圖](https://www.huyett.com/media/cache/attachment/filter/product_gallery_main/dc8e2292b789b88fc4fad4a609bb0e74/5058967/6ba3aae39bb60c084550174ac2fa538520d6fe20_TDL_DE.jpg)。本preset只作作者近似的平面輪廓／陰影，不是量測復刻、DIN符合性、合金認證或照片複製。

`snowflakeobsidian`（雪花黑曜石）新增作者近似的黑色磨光平面與平齊灰白放射晶簇，不是既有Obsidian貝殼狀斷口、凸花或平滑印色圓斑。36組seeded晶簇各用24個compact放射晶瓣與0.4–1.1倍不等尺度；scaled support加jitter上界0.4657 cell，小於0.5 owner邊界。重用Chrysanthemum Stone核心，constructor選色調／roughness與縮放cache basis；3,564個geometry值加96² grain，共12,780 Float64／102,240 B，僅為table預算、非總RAM。取樣無配置／hash／trig／sqrt，只有micrograin改height，灰晶簇比黑底稍粗糙。0.12 m nominal tile與0.001 UV relief為作者選定，非標本量測。沿用opaque dielectric四maps、metallic 0、optional height、tint／repeats／Worker／cache及呼叫者ownership，不新增斷口／晶體geometry、透明、礦物鑑定或校準光學模擬。

外觀參考：[Smithsonian NMNH標本45995](https://qrius.si.edu/browse/object/10025324)記載亮黑火山玻璃、灰色花／雪花狀斑與放射狀cristobalite包體；已實看其[標本原圖](https://ids.si.edu/ids/deliveryService?max_w=1200&max_h=1200&id=ark:/65665/m37e19cafc4bb04afdab04a3abbf447ee0)。本preset只把黑灰放射紋近似到作者選定的磨光平面，不重現原標本斷口geometry、不複製光照、不校準色彩／尺寸或打包照片。

`f05opticalfaces`（JIS-F05光接收座正面示意）使當時目錄879→880種：2×2四個不帶帽的霧黑矩形模塑樹脂面，各有兩條長側凹槽、僅一端兩角倒角的隆起六邊導框、兩個圓側凸耳、暗色鍵形口與低圓形對位井。全為opaque dielectric，沒有快門、LED／發光、金屬接點或透明／折射鏡片。這是相關接頭家族外觀變體，不是新渲染技術，也不是光電二極體／光學／資料／音訊／電氣／插合／EMC／安全模擬或認證。

外觀依據已實讀／渲染的六頁原廠[Toshiba TORX1350A(F)資料表（2020-03-12）](<https://toshiba.semicon-storage.com/info/TORX1350A(F)_datasheet_en_20200312.pdf?did=35629&prodName=TORX1350A(F)>)第5頁水平型JIS-F05接收模組圖：正面13×8.5 mm，不是13.5 mm深度或3.5 mm外伸腳長。[原廠產品頁](<https://toshiba.semicon-storage.com/ap-en/semiconductor/product/isolators-solid-state-relays/detail.TORX1350A(F).html>)僅支持molded resin，不推定精確樹脂化學；料號為NRND（不建議新設計）。已實看的[2014經銷商家族照片](https://rutronik-tec.com/wp-content/uploads/2014/10/Toshiba21.jpg)及其[公告](https://rutronik-tec.com/toshiba-extends-toslink-family-with-new-energy-conserving-fibre-optic-transmission-modules/)只支持pre-A TOxX1350家族近似黑色外觀，並非A型正面光學校準。形狀、色彩、粗糙度、層高、0.04 m nominal tile與0.0038 UV relief皆作者近似，不是CAD／公差／插合／厚度或光學量測；不打包來源照片／PDF。

獨立56-field preset／kernel採兩組圓角矩形與兩組圓形平方距離C1 profiles、兩組各三因子的C1六平面遮罩、導框／凸耳乘積聯集及19組快取channel差值。四組四欄pose128 B加96² Float64 grain73,728 B，共73,856 B typed payload，非總RAM或FPS；owner-coordinate支撐上界0.4023056142 < 0.5。逐點無配置／hash／trig／sqrt／逐邊或slot迴圈。Default metallic0、stored metallic-roughness B=0遍及所有像素；explicit metallic1只改factor、不改stored map。沿用opaque四maps、optional height、tint／repeats、同步／native module Worker pool／cache及preset-owned texture／呼叫者清理，既有879種不變；不增依賴、別名或API入口。建議512，32僅粗預覽。不建模保護帽、焊接／支撐腳、背部／PCB細節、mesh／透明通孔、碰撞或光傳播。

`minidin4femalefaces`（四接點mini-DIN母座正面示意）使當時目錄880→881種：2×2四個近方形黑PBT承座／圓邊框，各有連續薄鍍錫黃銅接地環、暗環腔及黑色圓內芯。內芯上方為開放缺口、下方兩側為階梯切口；四個塑膠導入口上排直長、下排橫長，另有獨立封閉的下方矩形鍵孔。只有接地環為金屬；不畫可見銀色內接點環、外屏蔽罩、背腳或開關，也不模擬視訊／訊號／電氣。

外觀依據原廠[Same Sky MD-40S產品頁](https://www.sameskydevices.com/product/interconnect/connectors/din-connectors/md-40s)、已實讀／實看的五頁[MD-S資料表（印刷日期2024-09-12）](https://www.sameskydevices.com/product/resource/md-s.pdf)第2頁及[原廠照片](https://cdn.sameskydevices.com/products/image/getproductimage/976?typecode=m&width=300)。採用獨立MD-40S四接點正面及共用外殼圖，不把通用大圖的九孔或PCB焊孔配置當四孔正面；上缺口屬PBT內芯，不切斷金屬接地環。黑PBT／鍍錫黃銅角色有來源依據，但形狀比例、色彩、roughness、AO、層高、0.04 m nominal tile與0.0042 UV relief皆作者近似，非CAD／公差／插合／厚度／鍍層光學量測或電氣／視訊／EMC／安全認證；不打包來源PDF／照片。

獨立87-field preset／kernel採六組圓角矩形（共用slot半徑倒數）、四組平方圓距離C1 profiles、兩組smooth半平面階梯gates及32組快取C／H／R／AO差值。四組四欄Float64 pose128 B加96² grain73,728 B，共73,856 B typed-array payload，非總RAM或FPS；單一owner支撐上界0.4189705149024927 < 0.5。逐點無配置／hash／trig／sqrt／slot迴圈。Default metallic1只保留薄接地環，所有黑塑膠／孔底／腔為M0；`createMaterial({ metallic: 0 })`只改factor，不抹除stored metallic mask。沿用opaque四maps、optional height、tint／repeats及既有Worker／cache API；preset擁有textures，呼叫者管理借用材質與自有pool／cache，先移除借用材質再銷毀preset。不新增依賴、別名或API入口，保留先前880種演算法／順序。建議512，32僅粗預覽；不建模mesh、透明通孔或實體接點。

`dcbarreljackfaces`（DC圓孔電源座正面示意）使當時目錄881→882種：2×2四個9:11比例的高身黑PBT圓角矩形，各有偏上的暗圓口、實心凹入鍍鎳銅中心針及獨立的下方鍍銀銅合金terminal 2橫條。橫條上下邊平直，只有兩端被圓口裁切；只有這兩個接點為M1，所有PBT、背底與孔底為M0。深度為背底 < 孔底 < 下橫條 < 實心針 < 承座面，兩接點都低於承座面。不畫中空中心、外金屬環或額外凸圓框。

外觀依據原廠[Same Sky PJ-102A產品頁](https://www.sameskydevices.com/product/interconnect/connectors/dc-power-connectors/jacks/pj-102a)、已實讀／實看的三頁[PJ-102A資料表（印刷03/11/2025，rev 1.07）](https://www.sameskydevices.com/product/resource/pj-102a.pdf)第2頁及[原廠正面照片](https://cdn.sameskydevices.com/products/image/getproductimage/690?typecode=m&width=300)。圖面正面9 × 11 mm、開口Ø6.40 mm、針Ø2 mm、口中心距底6.5 mm；目錄2.0 × 6.5 mm名稱與5.5 mm mating plug直徑均不可當成圖面Ø6.40 mm開口。形狀、色彩、roughness、AO、層高、0.04 m nominal tile與0.0042 UV relief皆作者近似，不是CAD／插合／公差／電氣／極性／開關／安全或接頭模擬與認證。省略背部焊腳、PCB與實體通孔，孔底為opaque stand-in；不打包來源PDF／圖片。

獨立47-field preset（45數值欄位及2色盤）採五個C1 profile因子：圓角承座、孔／實心針的兩組平方圓距離，以及相乘的兩組smooth spring軸向gates並由孔裁切；16組C／H／R／AO差值constructor快取。四組四欄Float64 pose128 B加96² Float64 grain73,728 B，共73,856 B typed-array payload，不含JS物件／closure開銷，非總RAM／FPS或效能認證；單一owner支撐上界0.4383801121065569 < 0.5。逐點無配置／迴圈／hash／trig／sqrt，完整孔core略過cached grain；保留owner索引前第二次fract以處理極小負UV。Default metallic1只保留實心針與獨立下橫條；`createMaterial({ metallic: 0 })`只改factor，不抹除stored metallic mask。沿用opaque四maps、optional height、tint／repeats與既有Worker／cache API；preset擁有textures，呼叫者先移除借用材質再銷毀preset，並管理自有pool／cache。不新增依賴、別名或API入口，保留先前881種演算法／順序。建議512，32僅粗預覽。

`stfiberadapterfaces`（ST simplex光纖轉接座正面示意）使目前目錄882→883種：2×2四個六平面鍍金屬六角底座、同心圓形凸肩與凸起圓筒唇；筒唇只有一個上方開放軸向鍵槽，左右有兩個相對的卡口凸柱，中央是深暗不透明圓腔。鍵槽只把高筒唇降到連續金屬凸肩，不切穿凸肩／六角底座到背景；高唇為開口C形。全部可見硬體與鍵槽底為M1，圓腔／背底M0；深度為背底 < 圓腔底 < 六角底座 < 凸肩／鍵槽底 < 卡口柱 < 筒唇。不畫白色陶瓷環、中心接點環或針。

外觀依據[SENKO ST產品頁](https://www.senko.com/product/st-adapter-2/)、已實讀五頁[DS-ST-000006-RevA-EN資料表](https://www.senko.com/wp-content/uploads/2025/01/DS-ST-000006-RevA-EN.pdf)（實看第1頁照片及第3頁圖面）與[原廠ST-Adapter.png](https://www.senko.com/wp-content/uploads/2021/09/ST-Adapter.png)，採216-101 simplex，不混用316 duplex。來源僅支持鍍金屬，不宣稱鎳或其他合金；內部zirconia split sleeve有規格依據，但原廠視角未清楚露出白環，因此不畫。PDF metadata的2024-11-15建立日期不是印刷日期；29.3 mm是軸向深度，double-D 9.6 × 7.8 mm是面板開孔參考，兩者皆非正面形狀。比例、色彩、roughness、AO、層高、0.04 m nominal tile及0.0042 UV relief是作者設定的簡化正面插圖，非CAD。省略螺紋、獨立滾花齒、墊圈、防塵帽、背部、線纜／ferrule與PCB，不作光學／電氣／插合／安全模擬或認證，也不宣稱browser／FPS認證；不打包來源素材。

獨立54-field preset（52數值欄位及2色盤）採13個C1 profile因子：六個六角支撐平面、三個平方圓距離、兩個鍵槽軸向與兩個卡口柱軸向gates；20組C／H／R／AO差值constructor快取。相乘的smooth profiles／角色替換避免非零hard min／max接縫。四組四欄Float64 pose128 B加96² Float64 grain73,728 B，共73,856 B typed-array payload，不含JS物件／closure開銷，非總RAM或FPS；旋轉不變owner半徑加jitter為0.35841016151377547 < 0.5。constructor快取pose／grain，逐點無配置／迴圈／hash／trig／sqrt，零支撐與非金屬圓腔／背景略過不需要的grain；保留owner索引前第二次fract以處理極小負UV。Default metallic1；`createMaterial({ metallic: 0 })`僅改factor，不抹除stored metallic mask。沿用opaque四maps、optional height、tint／repeats及既有Worker／cache API：preset擁有textures，呼叫者管理借用材質與自有pool／cache，先移除借用材質再銷毀preset。不新增依賴、helper、export、API或色盤擴充；上述是來源／實作描述，不是完整正式測試、browser或built distribution驗證。

`to220packagefaces`（外露金屬片TO-220封裝正面示意）使目錄884→885種，含plain的gallery為886項。2×2四個朝前封裝各有上方兩角均倒角的中性金屬片、一個中央暗色不透明凹安裝孔、遮住下方金屬片與腳根的霧黑矩形本體，以及三支等間距平行直金屬腳；腳根肩較寬、直尾較窄。完整金屬片／腳面M1，本體／孔底／背底M0，邊界採C1混合；這是表面角色，不代表電氣隔離。作者正規化高度為背底.02 < 孔底.06 < 金屬片.30 < 腳.44 < 本體.68，孔是真正height凹陷，不是黑色塗點或透明通孔。

外觀依據STMicroelectronics [STP55NF06外露金屬片TO-220 type A，May 2012，Doc ID7544 Rev11](https://www.st.com/resource/en/datasheet/stb55nf06.pdf#page=13)：實看原PDF第1頁封面圖、第13頁Figure 23／0015988_typeA_Rev_S，並實讀第12頁尺寸表。不是TO-220FP或D²PAK型。圖面尺寸僅參考，非本作者插圖的量測值或精確尺寸CAD；不推定化學成分、鍍層或精確光學。省略印字、小圓形模痕／側凹與背部，不打包來源圖；不模擬熱、電路、電氣／RF、安全或FPS，來源的tab連pin2也未建模。

預設0.08 m nominal tile、0.0042 UV-relative relief（不是公尺位移）及metallic factor1。Explicit `createMaterial({ metallic: 0 })`僅改scalar factor，不改stored M mask。作者欄位留在既有`src/data` immutable preset；constructor快取四組四欄Float64 pose128 B及96² Float64 grain73,728 B，共73,856 B typed-array payload，不含JS物件／closure開銷，非總RAM或效能認證。sampler沿用C1 profiles與凸層替換，逐點無配置／迴圈／hash／trig／sqrt／鄰居搜尋；保留既有週期不透明maps與texture ownership。建議512辨識安裝孔及三支窄腳尾，32僅粗預覽，不保證每支腳可辨。

`mudcloth`（手繪泥染布條帶紋示意）使目前目錄886→887種，含plain的gallery為888項。八條橫向條帶依序重複四種作者設計的母題：折線、點列（相間大小）、菱形套小圓點、雙軌梯形橫檔；每條帶界有連續淺色分隔線，並以週期雜訊對座標做手繪式微擺動，每條帶另有獨立的相位與筆畫寬度。深褐黑染底與奶油色未染棉紋以單一色階圖呈現（染底約0.10、筆畫約0.84，另含微幅染料沉積與紗線色調變化）；底層是每tile 64×64緯經紗的平紋織物，每格以上下交替的拋物線紗面生成height／AO。Metallic與mortar皆為0。

靈感來自西非泥染布（bògòlanfini）「深色染底＋淺色母題」的外觀，但母題幾何、比例、色彩與紋理皆作者自訂，不是任何特定族群、工坊或傳統紋樣的精確複製，也不代表其文化意涵；未引用或打包外部圖樣。

預設0.5 m nominal tile、0.0008 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512辨識緯經紗與細筆畫，32僅粗預覽；不宣稱本段已完成browser或三backend驗證。

`turingpattern`（Turing式迷宮／斑點皮毛紋示意）使目前目錄887→888種，含plain的gallery為889項。以三組整數波向量（每tile 13、12.5、13.0週期）的餘弦疊加產生近六角斑點格，再用週期雜訊扭曲座標並以緩變門檻在「小圓斑（高門檻）」與「迷宮網狀（低門檻）」之間過渡；柔邊色斑為深褐，底為淡駝色，色斑中心略深、高度略高於底。Metallic與mortar皆為0。

這是解析式的三波疊加近似，不是反應擴散（reaction–diffusion）模擬，也不求再現任何特定動物的斑紋；全部參數與色彩皆作者自訂，未引用或打包外部圖樣。每個sampler點只算三個cos與四個週期雜訊，沒有迴圈或配置。

預設0.4 m nominal tile、0.0007 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議256以上辨識斑點細節，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`bayerdither`（Bayer有序抖動像素方磚示意）使目前目錄888→889種，含plain的gallery為890項。每tile 64×64個方塊，每塊依同一個緩變亮度場在方塊中心取值，與8×8 Bayer門檻矩陣比較後決定「亮」或「暗」：亮塊為奶油白、較高且光澤較強，暗塊為深藍黑、較低且較粗糙，方塊間有一條深色凹縫，邊緣有倒角；每塊另有微幅色調抖動。亮度場在平緩區形成典型的有序抖動紋，約50%亮度時退化成棋盤。Bayer矩陣在constructor以遞迴 B(2n)=[[4B,4B+2],[4B+3,4B+1]] 建立。Metallic與mortar皆為0。

這是作者設計的像素風表面示意：沒有取自任何圖片或遊戲素材，也不是影像抖動演算法的工具實作。預設0.32 m nominal tile、0.0036 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓每塊至少8 px，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`patchworkquilt`（拼布被面示意）使目前目錄889→890種，含plain的gallery為891項。每tile 4×4塊方形布片，依hash各自選用四種設計之一：素色（加印小圓點）、對角半方三角、同心方環、三條布帶，各片取五級色階中的兩級；片與片、片內拼縫為深色凹縫，每片像填充棉被般中央隆起，並沿片界內縮0.07處有一圈虛線縫線（每邊6段、佔空比約0.62，縫線略凹、色較亮、較粗糙），底層為每tile 96×96緯經紗平紋織物。Metallic與mortar皆為0。

這是作者設計的簡化被面示意：色階、設計、比例皆作者自訂，不是任何特定傳統被面圖案（如log cabin或nine patch）的精確複製；未引用或打包外部圖樣。預設0.8 m nominal tile、0.0042 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識虛線縫與圓點，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`amberresin`（拋光琥珀樹脂示意）使目前目錄890→891種，含plain的gallery為892項。以沿v方向28列、沿u方向僅4欄的週期雜訊做拉長的流動色帶（蜂蜜金～深琥珀），再疊上兩種以格點為單位的特徵：6×6格內每格約55%機率出現一個圓形氣泡（半徑0.022–0.05 UV，內部較亮、外緣為暗色細環，只在環上降低AO），以及4×4格內約40%機率的「太陽斑」圓盤（半徑0.07–0.10 UV，略亮並有9組由核心向外淡入的放射狀裂紋，裂紋使高度下凹且較粗糙）。整體roughness約0.14（拋光），Metallic與mortar皆為0。

這是不透明貼圖的作者式近似：琥珀的半透明、折射與昆蟲內含物都沒有模擬，也不依據任何特定產地或標本；未引用或打包外部圖樣。每個特徵的中心保持在所屬格內，完整半徑不會跨格。預設0.2 m nominal tile、0.0006 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識氣泡細環，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`ammonitestone`（菊石化石灰岩示意）使目前目錄891→892種，含plain的gallery為893項。2×2格各有一枚圓盤狀菊石化石，位置、大小與起始相位各自微調；殼面是對數螺線：以 whorl = ln(ρ/r₀)/ln(g) − θ/2π 取小數部分作為螺管截面座標，整數處為縫合線（凹、AO暗），中段為圓管狀隆起並帶中央龍骨；肋紋每圈18條、帶弧度（falcoid）扭轉，內圈淡出以避免取樣混疊。基質為灰褐石灰岩（緩變斑駁加細顆粒），殼為奶油色且較光滑（roughness 0.55 對基質0.88）。生長比g＝2.3、殼外半徑0.4格、約3.1圈。Metallic與mortar皆為0。

這是作者設計的示意化石，不是特定種屬或標本的重建：不模擬隔壁縫合線的複雜葉狀、殼口或化石化的礦物差異；未引用或打包外部圖樣。每枚化石的半徑加位置抖動保持小於半格，點只屬於自己的格。預設0.5 m nominal tile、0.0026 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識肋紋，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`octopussuckers`（章魚腕吸盤示意）使目前目錄892→893種，含plain的gallery為894項。4×4個吸盤，奇數列偏移半個欄距，每個吸盤的位置與半徑（0.11 UV的92–100%）各自微調。每個吸盤由三層組成：高出皮膚的環形邊緣（torus，峰值在半徑約79%）、內縮到皮膚高度的杯狀凹陷（12條放射狀隆線，窗函數使隆線在邊緣與中心孔處歸零，因此各通道在邊緣腳處C1連續），以及中央深暗的小孔（AO明顯降低）。皮膚為濕潤的粉灰色，帶緩變皺紋與小塊深色斑點。Metallic與mortar皆為0。

這是作者設計的示意：吸盤數量、列距、斑點與顏色都不是任何特定種類的量測；未引用或打包外部圖樣。每個吸盤半徑小於半個欄距與半個列距，因此點只屬於自己的列與最近的吸盤。預設0.4 m nominal tile、0.0034 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識杯內隆線，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`expandedpolystyrene`（發泡聚苯乙烯珠粒示意）使目前目錄893→894種，含plain的gallery為895項。每tile 16×16顆珠粒，位置以週期Voronoi的方式（每格一個、距格邊至少0.2格）隨機排列；以最近三個site的距離分出：F1擁有的圓頂珠面（高度隨距珠心而隆起，每顆珠獨立色調微變）、F2−F1小於接縫寬的深灰融合縫，以及F3−F1很小的三顆珠交會處暗色空隙。珠面白色、較粗糙度0.78，接縫0.9，空隙最暗且AO最低。Metallic與mortar皆為0。

這是作者設計的示意：珠的排列、大小、融合縫寬與色彩皆不是任何產品或密度等級的量測；未引用或打包外部圖樣。因為每個site都留在自己格內，3×3鄰格足以包含最近三個site，貼圖在兩軸週期。預設0.12 m nominal tile、0.0022 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識空隙，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`asphaltshingle`（瀝青三片式屋頂瓦示意）使目前目錄894→895種，含plain的gallery為896項。每tile 12道瓦列、每列6片瓦舌；每列的瓦舌圖樣向右偏移整數個半片寬（不影響每tile恰好一次的週期），瓦舌間為從列下緣向上延伸的狹縫（只在下58%，露出深色底層；上42%被上一列覆蓋，不開縫）。每片瓦舌向下緣逐漸增厚，在列下緣一個陡降到下一列，下一列上緣因被覆蓋而AO變暗；顆粒雜訊（256×256）提供粗糙礦物顆粒感，並疊加每片的色調微變與緩變磨損。Metallic與mortar皆為0。

這是作者設計的示意：瓦片的尺寸比例、顏色、顆粒與磨損不是任何製造商或型號的量測，也不模擬釘線、密封膠條、苔蘚或自然老化；未引用或打包外部圖樣。預設1.0 m nominal tile、0.0045 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識狹縫與顆粒，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`lawnstripes`（修剪草坪條紋示意）使目前目錄895→896種，含plain的gallery為897項。每tile 8條橫向割草條紋交替明暗（±0.14），條紋邊界以週期雜訊微擺；每條紋內的草葉細絲以沿v拉長的value noise（192×48與384×96兩層）組成，並用整數剪切 x = u + lean·v（lean＝1，偶數條紋＋1、奇數條紋−1）讓草葉在相鄰條紋向相反方向傾斜，兩軸仍保持週期。另有緩變草叢明暗、細絲谷底的AO與微幅粗糙度變化。Metallic與mortar皆為0。

這是作者設計的示意：不模擬單片草葉幾何、枯草、土斑或雜草；傾斜角固定為45°（整數剪切的限制），不是真實草葉的量測；未引用或打包外部圖樣。預設2.0 m nominal tile、0.0028 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識草葉細絲，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`atomicboomerang`（原子時代飛鏢紋層壓板示意）使目前目錄896→897種，含plain的gallery為898項。5×5格各有一個印花：約62%為V形飛鏢（兩臂 y = k|x|，k＝0.4，寬度向臂尖以 1−t³ 收尖），其餘格約70%為四尖星（astroid，|x|^0.55＋|y|^0.55 ≤ r^0.55）；每個印花的位置、尺寸（80–100%）與角度隨機，淺奶油或深青二選一。底色是淡青灰色並帶細小深色斑點（160×160雜訊門檻），印花略微抬高、更光滑。Metallic與mortar皆為0。

這是作者設計的復古圖樣示意，不是任何層壓板品牌或型號的圖樣複製；未引用或打包外部圖樣。印花中心偏移與半長加起來小於半格，因此每個印花完全位於自己的格內且點只需查自己的格。預設0.6 m nominal tile、0.0008 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識星形與飛鏢尖，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`celticplait`（凱爾特雙帶編織浮雕示意）使目前目錄897→898種，含plain的gallery為899項。4條橫向雕刻帶，每條由兩根互相交織的緞帶（y＝±A·sin(2π·4u)，A＝0.052，緞帶半寬0.029）組成，每tile共8個交叉點；兩帶上升方向的那條在每個交叉點都在上方，使每根緞帶沿途交替「過／下」。緞帶有圓截面高度、中央細溝、對下方物件的接觸陰影（只降AO），條帶之間有兩條細軌線；底為凹下的石面，帶細顆粒。Metallic與mortar皆為0。

這是作者設計的簡化雙帶編織：不模擬凱爾特結常見的三帶以上結構、轉角或動物形；未引用或打包外部圖樣。每根緞帶以垂直偏移除以 √(1+斜率²) 近似垂直距離，是近似而非精確offset curve。預設0.5 m nominal tile、0.0042 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識中央細溝，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`garnetschist`（石榴石雲母片岩示意）使目前目錄898→899種，含plain的gallery為900項。底層是沿u拉長的波狀葉理：以週期雜訊對v做微擺，再疊粗細兩層（3×28與6×112格）value noise，另有稀疏的雲母亮點（224²雜訊門檻）。5×5格中約60%各有一顆石榴石斑晶：六邊形外形（以三個面法向投影的最大值為距離，內切半徑0.1–0.19格）、六個錐面各有獨立色調、中心較亮的冠部、凸起且較光滑、AO較低；兩側各有一個沿葉理方向拉長的淺色石英壓力影（長軸2倍半徑、短軸0.7倍）。深端色為暗紅褐，因此石榴石呈暗紅褐、片岩呈偏粉褐。Metallic與mortar皆為0。

這是作者設計的示意：石榴石為二維六邊形外形加六個錐面，不是真實十二面體／偏方三八面體晶形，葉理不會真的繞著斑晶彎曲，也不模擬雲母的方向性反光；單一色階只能近似紅色，不是光譜或礦物學測量。未引用或打包外部圖樣。每顆石榴石的外接圓與壓力影加上位置偏移都小於半格，因此點只查自己的格。預設0.4 m nominal tile、0.0035 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識六角外形，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`topographiccontours`（地形等高線圖示意）使目前目錄899→900種，含plain的gallery為901項。以三層週期value noise（3²、6²、12²格，權重0.5／0.3／0.2）合成平滑高程場f，每tile分16個等高距，圖面以淺米色紙為底、依高程做分層設色（每個等高距的底色變化為0.42/16），等高線取 |f − 最近等級| ÷ |∇f|（梯度以前向差分求得）作為空間距離，因此線寬不隨坡度變化；每第5條為較粗、較深的計曲線。另有細微紙張纖維雜訊。Metallic與mortar皆為0。

這是作者設計的示意：不是任何真實地形資料，也不含高程註記、河流、座標格網或圖例；梯度有下限避免平坦處線寬暴增，極近的等高線（陡坡）會因線寬而相連。預設1.0 m nominal tile、0.0012 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。每個像素需要三次高程場取樣（各三層噪聲），建議512以上辨識細線，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`digitalcamo`（數位像素迷彩示意）使目前目錄900→901種，含plain的gallery為902項。每tile 64×64個方形像素，每個像素有四個色階之一（暗橄欖、橄欖褐、卡其、沙色）；色階由兩層週期value noise（4²、12²）與每塊的雜湊抖動合成，約一半的像素改取其2×2父塊（32²）的值，使像素聚成較大的方塊。以該場所有像素值的四分位數作為門檻，因此四個色階各佔恰好四分之一的像素。上層是每tile 128×128緯經紗的平紋帆布織紋（色調±0.03、高度與AO變化）。Metallic與mortar皆為0。

這是作者設計的示意，不是任何軍用或商業迷彩圖樣的複製，也不代表可見光或近紅外偽裝效果；未引用或打包外部圖樣。預設1.0 m nominal tile、0.0007 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。每個sampler構造需排序4096個像素值（約毫秒級）；建議512以上讓每個像素至少8 px並看見織紋，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`radarscope`（雷達掃描顯示示意）使目前目錄901→902種，含plain的gallery為903項。每tile一個圓形雷達顯示（半徑0.46 UV），深綠黑底；5條等距距離環（外環較粗）、24條每15°的方位輻條（每第6條為較粗十字線）、一條由seed決定角度的亮掃描臂，其後1.3 rad以平方衰減的磷光餘暉，以及6個極座標隨機的亮點（餘暉越近越亮，最低保留40%亮度）。整體有192條水平掃描線的明暗調變與細微雜訊。Metallic與mortar皆為0。

這是作者設計的UI風格示意：不是任何雷達型號的畫面，不含文字、刻度數字或真實距離／方位意義；掃描臂在tile中固定，不隨時間移動。預設0.3 m nominal tile、0.0004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。每個像素最多迴圈6個亮點；建議512以上辨識細線與亮點，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`hazardstripes`（警示斜紋漆面剝落示意）使目前目錄902→903種，含plain的gallery為904項。45°斜向的黃黑警示條紋（a = u + v 的整數剪切，每tile 8道，即4黃4黑）塗在鋼板上；漆面被三項磨損得分剝落：96²雜訊碎屑、沿條紋方向拉長的刮痕（以 a = u + v、b = u − v 兩個整數剪切座標取192×10格雜訊），以及偏向條紋邊界的邊緣權重（邊緣0.3條寬內加0.35）。剝落處露出裸鋼：以既有mortar權重混入中性灰（153,153,139），同時metallic M mask與mortar為同一個磨損值（M1＝裸鋼、M0＝漆面）；漆面保持純黃／純黑基色，粗糙度黃0.45、黑0.62、鋼0.36，漆面比鋼高0.14，磨損邊緣的AO略暗。

這是作者設計的示意：不是任何標準（如OSHA、ISO 3864）規定的色彩或條紋比例，不含鏽蝕、焊縫、鉚釘或凹痕；裸鋼只用既有中性灰近似，不是合金或光學量測。未引用或打包外部圖樣。預設0.5 m nominal tile、0.0032 UV-relative relief（非公尺位移）與metallic factor 1；explicit `createMaterial({ metallic: 0 })`僅改scalar factor，不改stored M mask。沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識碎屑與刮痕，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`kiwislices`（奇異果切片示意）使目前目錄903→904種，含plain的gallery為905項。2×2格各有一片圓形奇異果切片（半徑0.42格，位置、尺寸92–100%與起始角各自微調）：綠色果肉帶64條放射狀淡色纖維（隨距果心漸暗），中央淡黃綠色果心圓（半徑0.115格），果心外兩圈暗色橢圓種子（內圈20顆於0.175格、外圈28顆於0.24格，內外圈錯開半個間距），外緣為帶細絨雜訊的暗褐果皮環（寬0.045格），切片之間是暗色空隙。種子凹陷、AO較暗，果心略低；果肉較平滑（roughness 0.24），果皮粗糙（0.9）。Metallic與mortar皆為0。

這是作者設計的示意，不是任何品種或切法的量測：種子數量與位置、纖維數與顏色皆簡化；未引用或打包外部圖樣。每片的半徑加位置偏移小於半格，因此點只查自己的格。預設0.25 m nominal tile、0.0018 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識種子與纖維，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`mandalaflower`（曼荼羅花形示意）使目前目錄904→905種，含plain的gallery為906項。每tile一朵以tile中心為圓心的花形（seed決定整體旋轉角），由外到內依序為：12瓣大蓮瓣（極座標玫瑰邊界 ρ＝0.30＋0.15·|cos(6θ)|^0.8）、36顆點環（半徑0.27）、24瓣外層花瓣（ρ＝0.12＋0.11·|cos(12θ)|^1.5）、12瓣內層花瓣（相位偏移半個瓣距）與中央圓心（半徑0.035）。每層都是填色區並有深色輪廓線（寬0.008），由外向內以畫家演算法覆蓋；底面凹下，後層較高。Metallic與mortar皆為0。

這是作者設計的簡化示意，不是任何宗教、傳統或文化的曼荼羅圖樣；未引用或打包外部圖樣。輪廓線寬是以「填色邊界ρ與邊界−寬度」之差取得的徑向寬度，不是垂直於邊界的距離。預設0.6 m nominal tile、0.0014 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。每個像素需要兩次三角函數（atan2與玫瑰邊界的cos）；建議512以上辨識內層花瓣與點環，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`needlepoint`（十字繡／針繡織錦示意）使目前目錄905→906種，含plain的gallery為907項。每tile 48×48針、沿(1,1)方向傾斜的半十字針腳（半寬0.27格、半長0.66格，兩端以4次方收尖，另有兩股絞線的明暗起伏），針腳之間露出深色畫布孔隙。色彩來自每tile 4×4個重複的12×12針母題：同心菱形環（環寬2針、三階色調循環）加上穿過母題中心的十字亮色重點，每針另有±0.03色調抖動。母題在x、y兩軸皆左右鏡像對稱。Metallic與mortar皆為0。

這是作者設計的簡化示意：不是特定針法（如Continental、Basketweave）或特定圖樣的量測，不模擬羊毛毛絨、畫布織紋細節或針腳背面。預設0.3 m nominal tile、0.0026 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓每針至少10 px，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`dicefaces`（骰子面示意）使目前目錄906→907種，含plain的gallery為908項。4×4個圓角方形象牙白面（半邊0.43格、圓角半徑0.11格，面緣有圓頂斜角，面間是暗色縫隙），每面依hash擁有1–6個凹陷圓點。圓點落在3×3格點上（間距0.255格、半徑0.078格），採標準中心對稱排列：1＝中心；2＝對角；3＝對角加中心；4＝四角；5＝四角加中心；6＝兩排各三顆；每面另隨機旋轉90°與鏡射，使2、3、6的方向不同。圓點是半球形凹陷（深度0.35，AO較暗）；面較光滑（roughness 0.3）而縫隙粗糙（0.9）。Metallic與mortar皆為0。

這是作者設計的示意，不是任何骰子製造商的規格；不模擬相對面點數和為7，也不區分左／右手骰子，因為這些屬於整顆骰子而不是單面貼圖。未引用或打包外部圖樣。預設0.4 m nominal tile、0.0034 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識圓點邊緣，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`cinderblockwall`（混凝土空心磚牆）使目前目錄907→908種，含plain的gallery為909項。每tile 8皮×4塊，奇數皮向右錯開半塊的錯縫（running bond），比例為2:1的磚塊；灰縫寬0.0095 tile、凹陷，並以既有`mortar`通道填入中性灰漿色。磚面有每塊±0.08色調差、低頻雲狀色斑、160×160的骨料顆粒起伏、倒角斜邊，以及每tile約940個小氣孔（每個56×56格以0.3機率各放一個，半徑0.0025–0.0059 tile）。氣孔凹陷、色與AO較暗；Metallic為0。

這是作者設計的示意，不是特定CMU規格（如ASTM C90的尺寸、孔洞與面殼）的量測；不模擬空心磚孔洞、砂漿擠出、泛白（efflorescence）或油漆。預設1.6 m nominal tile、0.0038 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上才能看清氣孔，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`moirefringes`（疊紋條紋）使目前目錄908→909種，含plain的gallery為910項。兩張透明細線格柵疊在一起：波向量為整數(24, 3)與(24, −3)（每tile 24條近垂直線、兩組傾角相反），線占比0.26，只有兩者都沒有墨線處才透光。兩組格柵的頻差(0, 6)形成每tile 6條水平疊紋帶（線重合處寬亮、交錯處密暗），頻和(48, 0)是另一組倍頻條紋；紙面另有256×256的低振幅纖維顏色／高度起伏。墨線微凸、略平滑；Metallic與mortar為0。

這是作者設計的光學示意，不是疊紋的物理模擬：沒有觀察者視角、相機取樣或螢幕子像素；疊紋是格柵乘積的數學結果。因為波向量是整數，兩格柵與其頻差、頻和在tile邊界皆連續。預設0.3 m nominal tile、0.0014 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓每條線至少約5 px，過低解析度或強縮小時貼圖自身會產生額外混疊疊紋；不宣稱本段已完成三backend或跨瀏覽器驗證。

`azulejotiles`（葡萄牙式彩繪瓷磚）使目前目錄909→910種，含plain的gallery為911項。每tile 4×4片相同的上釉方磚，磚間為0.012 tile寬的凹陷灰縫（使用既有`mortar`通道填入中性灰漿色）；每片是鈷藍對白釉的方形對稱圖樣：中央四瓣花（半徑0.15格、瓣幅0.055格）、半徑0.3格的細環、以及磚角四分之一圓盤（四片磚相接成完整圓，內含白色細環）。藍色有逐筆刷的明暗起伏，釉面另有每tile 28×28格的細微龜裂（craquelure）暗線；磚緣有倒角，釉面光滑（roughness 0.2）、灰縫粗糙。Metallic為0。

這是作者設計的示意，不是特定歷史圖樣或產地（如Delft或Talavera）的量測，沒有手繪筆觸的個別差異，每片磚都相同；磚面圖樣具完整正方形對稱，因此旋轉磚片在這個材質中看不出差別。預設0.8 m nominal tile、0.0022 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`tumblingblocks`（翻滾方塊／等角立方體拼布）使目前目錄910→911種，含plain的gallery為912項。每tile 7欄×8列的六角晶格，每個六邊形（尖頂、外接圓半徑1）被三條由中心射向上右、上左、下方頂點的射線切成頂面（亮，tone 0.92）、右面（中，0.62）與左面（暗，0.3）三個菱形，形成等角立方體錯視；每個面另有±0.06的逐塊色調抖動、帶細織紋的布面顆粒，以及面與面之間的細縫（深色、略凹、AO較暗）。六角晶格以一個六邊形中心對齊u=v=0；因為UV tile是正方形，晶格寬7√3與高12的比例約1.01，六邊形會有約1%的非等比拉伸。Metallic與mortar為0。

這是作者設計的拼布示意，不是特定被面圖樣的量測，沒有縫線、棉被填充或布料皺褶，也不模擬光照下立方體的真實立體感（亮暗面是貼圖色，不隨光向改變）。預設0.6 m nominal tile、0.0018 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`kilimflatweave`（基里姆平織地毯）使目前目錄911→912種，含plain的gallery為913項。每tile 48×48個織格，由上到下分為四條各12列的紋帶：階梯菱形（12格週期、左右上下鏡像、同心環階梯變色）、階梯鋸齒（週期6格、每列各半兩色）、橫條紋（十二列迴文：深、深、紅、紅、赭、白、白、赭、紅、紅、深、深）與十字（每個12×12母題中44格為十字色）。顏色為四階色調（靛、茜紅、藏紅花黃、未染羊毛白），每格有±0.025的染色抖動；weft-faced橫向緯紗肋（每格3道）與低振幅纖維色斑；相鄰格顏色改變處在格的左緣有0.14格寬的細縫（深色、凹陷、AO較暗），模擬平織地毯在色塊交界的垂直縫隙。Metallic與mortar為0。

這是作者設計的簡化示意，不是特定部族或產地基里姆的量測，也不宣稱圖樣出自傳統；沒有經緯紗交織細節、流蘇與磨損。四階色調是亮度而非色相（顏色由dark／light兩端線性插值）。預設1.2 m nominal tile、0.0022 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓每格至少約10 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`ean13barcodes`（EAN-13條碼標籤）使目前目錄912→913種，含plain的gallery為914項。每tile 4張橫向排列的條碼標籤，每張占滿tile寬（左右各9個模組的空白區加95個模組的條碼，共113模組），並依EAN-13規格編碼：左護線101、左側六個數字（依第一位數字的奇偶樣式選L或G碼）、中央護線01010、右側六個數字（R碼）、右護線101，第十三位為正確的檢查碼。條碼的12個數字由seed與列號決定（因此各列不同），不是註冊的商品編號，也沒有可讀數字文字。護線比數字條略長，條緣有柔邊，墨色有低振幅濃淡、紙面有細微纖維。Metallic與mortar為0。

這是作者設計的示意：圖樣依公開的EAN-13編碼表產生，使「掃描」判讀在結構上成立，但沒有量測列印品質（如ISO 15416等級）、條寬增益補償、可讀文字或前導數字；測試只驗證結構與檢查碼，沒有用實體掃描器或解碼函式庫掃描。預設0.35 m nominal tile、0.0012 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上讓每個模組至少約9 px；512時約4.5 px，邊緣柔化會占模組寬的一大部分；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`morsetape`（摩斯電碼紙帶）使目前目錄913→914種，含plain的gallery為915項。每tile 10行紙帶，每行64個時間單位寬，依各行hash自十個單字（SOS、XYZ、CAT、PLAY、HELLO、WORLD、LIGHT、ENGINE、SIGNAL、TEXTURE）選一個，以國際摩斯電碼拼出：點＝1單位、劃＝3單位、字內間隔1單位、字母間隔3單位，左側空白3單位，其餘留白使圖樣在tile邊界不被切斷。標記是圓端膠囊形、厚度1單位；每行中心有淡淡的導線，墨色有低振幅濃淡，紙面有細微纖維。Metallic與mortar為0。

這是作者設計的示意，不是某特定電報機紙帶規格的量測：沒有紙帶邊的鏈輪孔、墨線抖動或褪色；每行只有單一單字（不含字間隔7單位），單字表是固定的十個。預設0.4 m nominal tile、0.0016 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓每個單位約8 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`sandripples`（風成沙紋）使目前目錄914→915種，含plain的gallery為916項。整數波向量(18, 7)的一列沙紋，每tile約18道穿越u方向的波峰；波峰受兩組週期低頻噪聲（6×6與24×24格）彎曲，剖面不對稱：迎風坡占72%的相位、緩升，背風坡占28%、陡降，峰谷以平滑函數圓化。迎風坡色較亮、背風坡較暗並帶AO，另有384×384的砂粒起伏、約5%格子的亮色雲母／礦物斑點。Metallic與mortar為0。

這是作者設計的簡化示意，不是對特定沙丘的量測；沒有波峰分岔（bifurcation／defect）、沙丘尺度的大型形態、風向變化或濕沙。預設1 m nominal tile、0.006 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`frostpolygons`（凍土多邊形）使目前目錄915→916種，含plain的gallery為917項。每tile 8×8個抖動Voronoi多邊形（抖動0.7）的極地圖案地面：粉質土多邊形中心（略低、色調中等且有低頻雲狀變化），邊緣有一圈隆起的石環（rim，色調較暗，內有圓形卵石，半徑隨機、色調0.3–0.7），多邊形之間是窄而深的暗色冰楔裂溝（troughs，AO較暗）。多邊形邊界由兩個最近種子點的距離差近似，不是真正的邊緣距離，所以裂溝寬度在尖角處略有變化。Metallic與mortar為0。

這是作者設計的簡化示意，不是對特定凍土區（如北極多邊形土或石環）的量測，不模擬冰楔剖面、融凍循環、苔蘚或季節積雪；石環色調以隨機亮度表示，不含岩性。預設1.5 m nominal tile、0.012 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`datamatrixcodes`（Data Matrix二維碼標籤）使目前目錄916→917種，含plain的gallery為918項。每tile 3×3個18×18模組的ECC 200風格符號（每個符號四周有1模組空白區，共60×60模組）：左欄與底列為實心的L形尋邊圖樣（finder）、上列與右欄為交替的時序軌（clock track，上列在偶數欄為深色、右欄由底往上在偶數步為深色，因此右上角為淺色），內部16×16資料區的每個模組依seed以約50%機率塗墨。模組為方形、邊緣略柔化（只在與不同狀態的相鄰模組之間），相鄰深色模組連成實心；墨色有低振幅濃淡、紙面有細微纖維。Metallic與mortar為0。

這是作者設計的示意：finder與clock track依Data Matrix的結構繪製，但資料區是隨機位元，不是依ECC 200編碼出的碼字（沒有資料、Reed-Solomon糾錯或碼字擺放），因此不可被掃描解碼，也沒有用任何掃描器或解碼函式庫驗證；測試只驗證finder／clock／空白區與資料區大致密度。預設0.4 m nominal tile、0.0012 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上讓每個模組約17 px；512時約8.5 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`ecgpaper`（心電圖記錄紙）使目前目錄917→918種，含plain的gallery為919項。每tile 80 mm見方的粉紅記錄紙：1 mm細格線與每5 mm的粗格線（紙面色調0.96、細線0.84、粗線0.68），以及4行心電圖描線，每行高20 mm、含4個心搏（每搏20 mm，以25 mm/s計約0.8 s、75 bpm）。每搏由P波、Q波、R波、S波與T波的高斯和構成（P＋0.9 mm、Q −0.8 mm、R ＋7 mm、S −1.8 mm、T ＋1.7 mm），每搏振幅有±6%抖動，另有0.25 mm、整個tile一個週期的基線漂移。描線為深色墨線，半寬0.2 mm，線寬以「垂直偏移除以√(1＋斜率²)」的一階近似計算，所以在R波這種極陡的尖峰處，墨線在垂直方向會比0.2 mm粗得多（實測R波墨跡頂端約高出基線8.3 mm，高於7 mm的設定振幅）。Metallic與mortar為0。

這是作者設計的示意，不是任何真實心電圖的記錄或診斷資料；沒有導程標籤、校準方波、心率變異、雜訊或病理波形，十二導程排版也未模擬。預設0.08 m nominal tile（80 mm見方，剛好對應記錄紙的實際毫米）、0.0012 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上讓1 mm格約12.8 px；512時約6.4 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`sheetmusic`（樂譜）使目前目錄918→919種，含plain的gallery為920項。每tile 8行五線譜（行距0.125 tile、線間距1/64 tile），每行16拍、每4拍一條小節線；每拍一個音符，音高由hash落在五線譜內的9個半線距位置（下加一間到上加一間，不含加線），音符頭為傾斜橢圓，其中約30%是空心（二分音符樣式），其餘實心（四分音符樣式）。符桿依記譜規則：低於第三線者（位置＜4）符桿向上、畫在符頭右側；第三線及以上者向下、畫在左側，長度3.5線距。墨色有低振幅濃淡，紙面有細微纖維。Metallic與mortar為0。

這是作者設計的示意，不是任何樂曲：沒有譜號、拍號、調號、符尾、連桁、休止符、時值對應的間距或歌詞，空心音符也不改變拍數（每個音符仍佔一拍的位置），因此不可演奏。預設0.3 m nominal tile、0.0014 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上讓線距約16 px；512時約8 px、符桿只有約0.8 px寬，會變得很淡；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`sudokugrid`（數獨格）使目前目錄919→920種，含plain的gallery為921項。每tile一個9×9的數獨盤面，細線分隔每格（半寬0.018格）、粗線分隔3×3宮（半寬0.04格）。每格依seed以約42%機率顯示一個提示數字，數字以3×5點陣字型（每個點0.135格）畫成像素風格。提示來自一個隱藏的完整解：以標準樣式經過數字重排、宮帶與宮內列／行的置換產生，這些置換都保留數獨規則，所以任何一列、一行、一宮內的提示都不會重複。墨色有低振幅濃淡，紙面有細微纖維。Metallic與mortar為0。

這是作者設計的示意：提示是完整解的隨機子集，不保證只有唯一解，也不是難度分級的謎題；字型是3×5點陣而非真實印刷字體。預設0.25 m nominal tile、0.0014 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓每格約57 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`measuringtape`（卷尺）使目前目錄920→921種，含plain的gallery為922項。每tile 160 mm見方（16 cm寬）、8條黃色卷尺條帶（每條高20 mm）：每1 mm一條短刻度（長4 mm）、每5 mm一條中刻度（6.4 mm）、每10 mm一條長刻度（9.2 mm、略粗），條帶上下緣有深色邊線；每公分的刻度右側以3×5點陣字型（每點1.1 mm）標示該公分序號0–15（兩位數時並排）。墨色有低振幅濃淡，卷尺面有細微顆粒。Metallic與mortar為0。

這是作者設計的示意：只是一段重複的0–15 cm刻度，不是任何卷尺標準（如公制公差等級）的量測；沒有英寸刻度、金屬捲尺的彎曲、字型粗細或磨損。標示值固定為本段的公分序號，tile邊界處15與0銜接。預設0.16 m nominal tile（對應實際的160 mm）、0.0018 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上讓1 mm約6.4 px；512時1 mm只有約3.2 px，刻度會相當細；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`calendarpage`（月曆頁）使目前目錄921→922種，含plain的gallery為923項。每tile一頁7欄×6列的月曆格，每格左上角以3×5點陣字型標示日期，細線分格、tile外框較粗，第一欄與最後一欄（週末）紙面略深。每個seed決定一個月：從哪一欄開始（0–6）與天數（28–31），日期依閱讀順序從1連續增加到月底，其餘格留白。Metallic與mortar為0。

這是作者設計的示意：沒有星期標題列、月份名稱、年份、節日或手寫備註，也不對應任何真實的月份，只是任選的起始欄與天數；格內只有日期數字。預設0.3 m nominal tile、0.0014 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓每格約73 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`fretboard`（吉他指板）使目前目錄922→923種，含plain的gallery為924項。每tile涵蓋一個八度（從琴枕到第12格）的深色玫瑰木指板：品絲位置依十二平均律，第n品在音階長度的 1−2^(−n/12) 處，以第12品（音階一半）正規化到u=1，因此與下一個tile的琴枕（u=0）銜接；每品的間距是前一品的 2^(−1/12)≈0.944 倍。6條琴弦沿u方向、均勻分布在寬度上，半寬由0.0022（高音側）漸增至0.0075（低音側），琴弦旁有淡淡的陰影；第3、5、7、9品的中點各有一顆珍珠色圓點，第12品中點是上下對稱的雙點。木紋沿u方向拉長。Metallic為0（品絲與琴弦只用亮度與粗糙度表現，不是金屬遮罩）。

這是作者設計的示意：不是特定琴款的量測；音階長度被正規化，因此只有「品絲間距比例」而沒有真實的毫米尺寸；沒有指板弧度（radius）、琴頸斜度、琴弦凹陷或磨損，也不模擬品絲與琴弦的金屬反射（它們只是較亮、較光滑的非金屬）。預設0.32 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上讓品絲約3.6 px寬；512時約1.8 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`crosswordgrid`（填字遊戲格）使目前目錄923→924種，含plain的gallery為925項。每tile一個15×15的填字格：由seed決定、約17%為黑格，生成時每次成對加入180°旋轉對稱的黑格，並檢查規則，只接受「每個橫向與縱向的白格連續段至少3格」且「所有白格相連」的結果。白格中起始橫向或縱向單字的格子依閱讀順序標示標準編號（1、2、…；以3×5點陣字型畫在格子左上角），其餘白格留白，黑格為墨黑；細線分格。Metallic與mortar為0。

這是作者設計的示意：格子只是空白填字格，沒有答案字母、提示文字或粗外框，也不保證有可填入的詞表；規則與編號只在單一tile內成立，tile重複時相鄰tile邊緣的白格連續段會跨過tile邊界，所以重複後並不是一個合規的大型填字格。預設0.3 m nominal tile、0.0014 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上讓每格約68 px（編號像素約3.4 px）；512時每格約34 px，編號會相當小；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`flipdotdisplay`（翻轉點陣顯示器）使目前目錄924→925種，含plain的gallery為926項。每tile 48×48個圓盤，黑色面板上每個圓盤半徑0.42格：亮起的為黃色（tone 0.92，較光滑、略凸並帶左上高光與中心軸點），熄滅的為深灰黑（0.14）。整個盤面是12欄×8列的數字，每個數字佔4×6個點，以3×5點陣字型亮起並在右側與下側各留一點空白，數字內容由seed決定（0–9）。面板有細微顆粒、圓盤之間有較暗的AO。Metallic與mortar為0。

這是作者設計的示意：沒有翻盤動畫、磁性翻轉的雙穩態、盤面反面（黑／黃）的厚度或機械間隙的細節；數字只是隨機序列，沒有時鐘、站名或其他語意。預設0.5 m nominal tile、0.003 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上讓每個圓盤約21 px；512時約11 px，高光與軸點會很小；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`minesweeperboard`（踩地雷盤面）使目前目錄925→926種，含plain的gallery為927項。每tile一個24×24的踩地雷盤面：每格依seed以16%機率藏一顆地雷（地雷本身不顯示），盤面以環面（torus）計算相鄰地雷數，所以tile邊緣相接時沒有接縫。從7個安全的「0」格開始洪水式揭開（0格會揭開全部8個鄰格），已揭開的格子是平坦、較暗、帶細格線，有相鄰地雷時以3×5點陣字型畫出1–8；未揭開的格子是凸起的按鈕，左上有亮斜角、右下有暗斜角。Metallic與mortar為0。

這是作者設計的示意：盤面沒有旗標、問號、爆炸的地雷或數字顏色（顏色是亮度而非色相）；未揭開區域底下的地雷位置固定但看不見，所以畫面只保證「必要條件」的一致性（見ACCEPTANCE），不保證唯一可解。因為相鄰關係在tile邊界環繞，這不是標準的有邊界踩地雷盤面。預設0.4 m nominal tile、0.003 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上讓每格約43 px；512時約21 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`tetrisstack`（俄羅斯方塊堆疊）使目前目錄926→927種，含plain的gallery為928項。每tile一個16×16的方塊井：依seed隨機嘗試放置七種四格方塊（I、O、T、S、Z、J、L）的隨機旋轉，只接受完全在井內且不重疊的放置，所以每個方塊恰好4格；七種方塊各用一個色調（0.9–0.2的七階亮度）、每格有斜角與高光，不同方塊之間有深色輪廓線（相同種類相鄰的兩個方塊也被輪廓分開），未被佔用的格子是近黑色的深洞。Metallic與mortar為0。

這是作者設計的示意：不是實際遊戲盤面——沒有重力、消行、下落、遊戲規則，也沒有保證「可由遊戲自然堆疊出來」，只是隨機的非重疊放置；色調是亮度而非遊戲的標準色相。tile邊緣的方塊不會跨越邊界，所以重複時相鄰tile的方塊只是並排。預設0.4 m nominal tile、0.0035 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓每格約32 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`battleshipgrid`（海戰棋盤）使目前目錄927→928種，含plain的gallery為929項。每tile一個10×10的海戰棋盤：藍灰色水面與細格線，以及一支由5、4、3、3、2格組成的艦隊，每艘船是一條直線的深色船體（相鄰格合併成一塊圓角板、與水面交界內縮），船與船之間即使在角落也不相接；每個格子依seed以約32%機率被射擊：射中船的格子有深色圓釘（命中），射中水面的格子有近白圓釘（落空）。Metallic與mortar為0。

這是作者設計的示意：沒有座標標示、沒有沉船或艦種造型，也不保證這個射擊紀錄在實際對局中可能出現（隨機射擊，不是依序輪流）；船隻位置在每個seed固定。tile重複時每塊棋盤是獨立的一局，船隻不會跨越邊界。預設0.4 m nominal tile、0.003 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓每格約51 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`hilbertcurve`（希爾伯特曲線）使目前目錄928→929種，含plain的gallery為930項。每tile一條4階的希爾伯特空間填充曲線，穿過16×16=256個格子的中心：以標準的索引轉座標演算法產生，從左上角格開始、在右上角格結束，相鄰索引的格子以線段相連，其餘相鄰格子之間沒有線。線寬0.28格，色調沿曲線索引由深靛（0.08）漸變到灰（0.55），紙面有細微纖維、墨色低振幅濃淡。起點與終點的格子各向tile邊緣外伸出半格線段，因此水平重複時上一個tile的終點與下一個tile的起點接成一條連續曲線；垂直方向的tile不相連。Metallic與mortar為0。

這是作者設計的示意：色調在tile接縫處由最淺跳回最深（索引0與255之間有色調不連續），這是刻意保留的；沒有標示起點終點的記號，也不是其他階數或其他空間填充曲線。預設0.3 m nominal tile、0.0014 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓每格約32 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`mondriancomposition`（蒙德里安式構圖）使目前目錄929→930種，含plain的gallery為931項。每tile一幅由遞迴二分割產生的矩形構圖：前兩層一定分割，之後每個矩形以80%機率繼續分割（最深5層、最小邊長0.14 tile），分割線每次只橫跨被分割的那個矩形（與畫作相同），分割比例在35%–65%之間；tile邊緣也有一圈黑框，使構圖封閉且重複時連續。黑線半寬0.0075 tile，矩形各以六個色階中的一個填色（0.97三份、0.62、0.4、0.78，因此白色矩形占約一半），畫布有細微顆粒、有色矩形另有筆觸濃淡。Metallic與mortar為0。

這是作者設計的示意：不是蒙德里安作品的複製，也沒有紅、藍、黃三原色——填色只是亮度（顏色由dark／light兩端線性插值，所以呈灰階）；分割規則與比例是作者設定的。預設0.6 m nominal tile、0.0016 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓黑線約3.8 px寬；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`lissajousgrid`（李沙育圖形表）使目前目錄930→931種，含plain的gallery為932項。每tile一張4×4的示波器風格李沙育（Lissajous）圖形表：第(欄, 列)格畫出參數曲線 x = A·sin(a·t + π/2)、y = A·sin(b·t)，頻率 a = 欄 + 1、b = 列 + 1（A = 0.4格，t為0到2π、以160段折線近似），所以由1:1的圓到4:4共16種比例，a與b有公因數時曲線會重複描繪、a = 2b 等情況會退化成拋物線弧。線條為亮綠（線半寬0.014格）並帶柔和光暈，面板有深綠色底、淡淡的格框與中心十字刻度，另有細微顆粒。Metallic與mortar為0。

這是作者設計的示意：沒有示波器的螢幕曲率、光暈拖尾、掃描線或讀數文字，相位固定為π/2（不隨格子變化），顏色只是由dark／light兩端線性插值的綠色調。預設0.4 m nominal tile、0.002 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；每個取樣點要檢查160段折線，成本較其他材質高：單次本機Bun量測512²取樣約155 ms（同一次量測中tumblingblocks約56 ms、brick約17 ms；不是基準測試，也沒有量測瀏覽器或Worker）；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`zoneplates`（菲涅耳波帶片）使目前目錄931→932種，含plain的gallery為933項。每tile 2×2片波帶片，每片14個環帶，第k個環帶的外緣半徑為 R·√(k/N)（R = 0.42格、N = 14），這是菲涅耳波帶片的半徑律（各環帶面積相等）；偶數環帶（含中央圓）透明（淺色），奇數環帶不透明（近黑色），最外的第14環不透明並接中灰色底板；波帶片外緣另有一圈淺灰色固定環。環帶邊緣略有柔化，底板與環有細微顆粒。Metallic與mortar為0。

這是作者設計的示意：只依半徑律繪製波帶片的幾何，不模擬繞射、焦點、波長或強度分布；環數、尺寸是正規化的（R與N固定），不對應真實的設計波長與焦距。預設0.2 m nominal tile、0.0022 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上讓最外圈的環帶（約0.015格寬）約8 px；512時約4 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`backgammonboard`（西洋雙陸棋盤）使目前目錄932→933種，含plain的gallery為934項。每tile一張棋盤：外框內分成左右兩半、每半6個「點」（三角形），中間是較暗的中央隔條（bar）；上排12個三角形尖端向下、下排12個尖端向上，各側色調交替（0.52與0.34），上下兩排相差一格；三角形長度為棋盤高的40%。每方15顆棋子（淺色與深色），隨機放在24個點上，每點最多疊5顆且只放同一種顏色，從棋盤邊緣往中間疊，棋子有邊緣高光與略微凸起。Metallic與mortar為0。

這是作者設計的示意：棋子是「合法的隨機擺放」，不是標準開局或任何實際對局的局面，也沒有骰子、倍率骰、被吃掉棋子放在隔條上或已移出棋盤的棋子；總數固定為每方15顆，因此每個seed中棋子都全部在點上。tile重複時每張棋盤是獨立的一盤。預設0.6 m nominal tile、0.003 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓棋子約34 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`jigsawpuzzle`（拼圖）使目前目錄933→934種，含plain的gallery為935項。每tile一幅6×6片的環面拼圖：每片以格為基礎，格與格之間的每條邊各有一個圓形凸塊（bulb，半徑0.115格、頸部半寬0.05格、凸出0.15格），凸塊屬於哪一邊由seed隨機決定、嵌入另一邊，因此相鄰的兩片必然一凸一凹地咬合；邊緣在tile邊界環繞，所以重複的拼圖是連續的。每片以細線與微小斜角分隔，畫面是低頻雲狀「圖像」明暗（6×6格）加48×48格的細節與逐片±0.06的色調差、顆粒。Metallic與mortar為0。

這是作者設計的示意：凸塊形狀是圓形加直頸，不是真實拼圖刀模的曲線；沒有卡紙厚度、印刷圖案內容或背面。每片的面積因凸塊與凹槽而略有不同（凸塊、凹槽成對抵消時與一格相同）。預設0.5 m nominal tile、0.0026 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上讓每片約170 px、切線約5 px；512時切線約2 px；每個取樣點要做約40次擁有者判定，成本較高：單次本機Bun量測512²取樣約226 ms（同次量測lissajousgrid約122 ms、tumblingblocks約45 ms、brick約16 ms；非基準測試，未量測瀏覽器或Worker）；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`to92packagefaces`（TO-92封裝正面示意）使目前目錄885→886種，含plain的gallery為887項。2×2四個旋轉／微移的霧黑D形本體：直側、平底、上半橢圓穹頂；三支等間距平行直中性金屬腳有寬根肩與窄尾，本體遮住腳根。無金屬片、安裝孔或印字。完整腳面M1，本體／背底M0，邊界C1混合；作者正規化高度為背底.02 < 腳.44 < 本體.68。

尺寸參考是實際下載並raster實看的[onsemi P2N2222A/D，January 2013 Rev.7，PDF第6頁](https://www.onsemi.com/pdf/datasheet/p2n2222a-d.pdf#page=6)：內附98ASB42022B，TO-92（TO-226）CASE29-11，Issue AM，09 MAR 2007，圖面第1／2頁，STRAIGHT LEAD BULK PACK視圖。A4.45–5.20 mm、B4.32–5.33 mm、G1.15–1.39 mm及K≥12.70 mm僅是原廠尺寸參考，非插圖量測值。D形上半橢圓、比例、肩寬、色彩、roughness、AO及高度皆作者簡化，不是精確CAD；不推定化學成分、鍍層、光學或電氣特性，不打包來源圖。

預設0.08 m nominal tile、0.0042 UV-relative relief（非公尺位移）與metallic factor1；explicit `createMaterial({ metallic: 0 })`僅改scalar factor，不改stored M mask。沿用TO-220的constructor快取pose／grain及C1角色替換結構、既有週期不透明maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。先移除借用材質再銷毀擁有textures的preset，並另行管理自有pool／cache。建議512辨識三支窄尾，32僅粗預覽；不宣稱本段已完成runtime或browser驗證。

`ftypefemalefaces`（F型母頭穿板接座正面示意）使目錄883→884種：2×2四個裸正面，依序為六平面鍍鎳金屬六角底座、同心凸圓肩、封閉無鍵槽的凸圓唇、淡色P.P.介電圓盤，以及更深的微小暗色不透明中央母入口。外部硬體M1；背底／P.P.／入口M0。作者正規化高度為背底.02 < 入口.06 < 六角底座.26 < 凸肩.36 < P.P..48 < 唇.66；入口是真正height凹陷，不是塗黑點，周圍P.P.保持連續。不同於ST，沒有開放鍵槽或卡口柱，也無公針或虛構的可見中央金屬接點環。

主要依據實際下載並raster實看的歷史[Amphenol Connex CAT-103 ©2001目錄，PDF第159頁／印刷第158頁](https://docs.rs-online.com/1ab7/A700000006717073.pdf#page=159)：222121 BULKHEAD ADAPTER JACK-TO-JACK照片、圖面及該型號Nickel／P.P.／75Ω表格。其他頁通用Delrin／Teflon說明不覆蓋此型號P.P.；不推定基底合金或精確接點材質。11 HEX與21.3 mm軸向總長僅是圖面參考，非量測正面幾何；墊圈／螺帽側面尺寸也非正面高度。原照片解析度不足以確定微小入口實際截面，這裡刻意簡化成圓形，是作者示意，非精確CAD。比例、色彩、roughness、AO、層高、預設0.04 m tile與0.0042 UV-relief factor皆作者設定；.0042不是公尺或校準深度。不畫螺紋螺旋／裝飾螺紋圈、墊圈齒、背部／線纜／PCB、真通孔、透明或新mesh；不作RF／75Ω、電氣、光學、插合或安全模擬／認證，歷史75Ω僅識別料號。不打包來源素材，擴充既有`pbr3d` gallery，不新增examples入口。

獨立46-field preset（44數值欄位及2色盤）使用10個C1 profiles：六個smooth六角半平面與四組平方半徑圓形profiles。巢狀凸組合角色替換及20組constructor快取C／H／R／AO差值避免非零hard min／max接縫。四組四欄Float64 pose128 B加96² Float64 grain73,728 B，共73,856 B typed-array payload，不含JS物件／closure開銷，非總RAM、FPS或效能改善宣稱。旋轉不變owner上界maxScale × nutInradius / (sqrt(3)/2) + jitter約.369958 < .5。constructor快取pose／grain，逐點無配置／迴圈／hash／trig／sqrt，略過零支撐與完整P.P.／入口／背底不需要的grain；保留owner索引前第二次fract以處理極小負UV。Default metallic1；explicit `createMaterial({ metallic: 0 })`僅改factor、不抹除硬體／非金屬stored mask。沿用opaque四maps、optional height、tint／repeats、同步／Worker／cache API與ownership：先移除借用材質再銷毀擁有textures的preset，並另行管理自有pool／cache。不增依賴或API；上述是來源／實作描述，不宣稱full-suite、runtime、browser或built-distribution驗證。

`rcafemalefaces`（RCA／Cinch母座正面示意）使當時目錄增至879種：2×2四個寬圓形黑絕緣墊圈，各有較小圓金屬肩、再小一層的六平面前端筒鼻、暗色環形絕緣體與深圓腔；腔內為簡化的凹入導電母座環與暗色不透明底，不是公中心針。無BNC卡口凸耳，不把大型後側安裝螺帽放到正面。這是接頭家族變體，不是新的渲染或接頭模擬技術。

外觀依據已實讀／實看的原廠[REAN NYS367-0圖面](https://www.rean-connectors.com/media/14879/download/NYS367-0.pdf?v=1)（3.652.052，2020-11-13）與通用[NYS367產品PDF](https://www.rean-connectors.com/en/product/nys367-1.pdf)。圖面列墊圈Ø15.5、筒Ø8.3、前段7.5、M8×0.75及全長(29)；AF12是大型後螺帽，不是正面尺寸。圖內不一致的NYS373-x註記不構成新變體證據，產品PDF網址也不代表存在NYS367-1變體。產品照片顯示小型前端平面、較寬墊圈與後螺帽／焊片；PDF列外殼、螺帽、焊片、接點為黃銅／金、墊圈為PA+30%GF，不推定內絕緣樹脂。中性灰刻意省略真實金光學；形狀、位置、深度、顏色、粗糙度、0.04 m nominal tile與0.0042 UV relief皆作者近似，不是量測CAD、公差或隱藏剖面。

獨立56-field preset／kernel組合六組徑向平方距離C1 profiles、三個smooth folded hex slabs與27組快取channel差值。四組四欄pose128B及96² Float64 grain73,728B，共73,856 typed-array payload bytes，非總RAM或FPS。逐點無配置／hash／trig／sqrt／逐邊迴圈；`Math.sqrt(3) / 2`只在construction時計算。Default metallic1保留金屬肩／筒／母座接點與非金屬墊圈／絕緣體／底；explicit0只改material factor、不改stored map。沿用opaque四maps、optional height、tint／repeats、同步／module Worker pool／cache與preset-owned texture清理，既有878種不變；不增依賴或API入口。建議512，32僅粗預覽，不保證小母座可辨。不含後螺帽／焊片／焊尾、實際螺紋或接點彈簧細縫、面板／PCB geometry、mesh、透明穿孔或碰撞，不提供電氣／音訊／RF／插合／EMC／安全模擬或認證。

`rj45femalefaces`（RJ45型8P8C母座正面示意）新增四個薄矩形金屬屏蔽框、霧黑絕緣內襯與低主腔；一側較窄的階梯卡扣延伸連通主腔，對側單排八個獨立長金屬接點，不是九組四接點`rectangularsocketfaces`或USB-C雙排24接點舌片，無中央舌片或LED。實讀[TE 1734795-6產品頁](https://www.te.com/en/product-1734795-6.html)列8位置／8接點、無指示燈、黑PA9T GF30、鍍金／鎳磷青銅接點與鍍鎳黃銅殼；中性灰省略鍍金光譜，來源樹脂資料不決定作者PBR粗糙度。階梯、接點佈局、尺寸、深度、顏色及0.054 m nominal tile／0.0044 UV relief皆作者近似，不是精確CAD或原廠機械圖面重現。

獨立kernel以55個preset fields、15組快取channel差值與outer／liner／main／key／pin五組平方距離C1 profiles組合；main + key − main × key乘積聯集避免主腔／卡扣腔的max接縫，逐點只取一個nearest接點候選，不逐pad迴圈。四組四欄pose128B加96² Float64 grain73,728B，共73,856B typed payload，非總RAM或FPS。取樣無陣列配置／hash／trig／sqrt。Default metallic1保留屏蔽框／接點M1、絕緣內襯／低底M0；explicit0只改factor、不改stored map。Opaque四maps與optional height沿用tint／repeats／Worker pool／cache及texture ownership，舊877種不變；不增依賴、插頭／線材、磁性元件、PCB／焊尾或面板EMI片，height／normal不是實體空腔mesh、Ethernet／PoE／Cat／速度／電氣／EMC／安全模擬或插合認證。

`usbcfemalefaces`（USB-C母座正面示意）新增四個圓角扁平金屬口、低霧黑腔與中央薄絕緣舌，每面兩排各12個小金屬接點（共24），不同於九組四接點`rectangularsocketfaces`，不新增技術類別。已實看的[GCT USB4050圖面](https://gct.co/files/drawings/usb4050.pdf)日期2016-04-21、revision C（2023-06-29），帶OBSOLETE戳記，不作現行／認證料號宣稱；黑色耐高溫塑膠不推定樹脂，中性灰金屬不模擬實際鍍金光譜。扁口採圓角矩形近似而非精確膠囊；省略側接地／卡扣、疊層殼與PCB尾端。

獨立kernel以50個preset fields、15組快取channel差值及四組平方距離profiles沿用compact C1；四組pose128B與96² grain73,728B合計73,856B typed-array storage，非總RAM或FPS量測。逐點只選一個nearest接點候選，無陣列配置／hash／trig／sqrt，不增加舊kernel成本。Default metallic1保留金屬口／接點M1與絕緣舌／低底M0；explicit0只改factor、不改stored map。0.032 m nominal tile與0.0045 UV relief皆作者近似，height／normal不是實體空腔mesh、CAD、電氣／USB速度／PD／安全模擬或認證。沿用opaque四maps、optional height、tint／repeats／Worker／cache及texture ownership，不增backend認證或runtime依賴。

`iecc6inlets`（IEC C6公入口正面示意）新增四片平坦黑PA6圓角矩形法蘭，各有一個上單瓣／下雙瓣的三葉形共腔、三個上單／下雙實心圓金屬腳端與左右兩個寬沉頭安裝孔；腳端高於腔底、低於法蘭，不套用C8凸護罩。原廠PDF本次403，實際下載、渲染並放大[RS代存的SCHURTER 2561原廠三頁PDF](https://docs.rs-online.com/a592/0900766b814421a9.pdf)第1頁照片／第2頁正面圖，讀取C6、black PA6及solid turned contacts；檔案日期為2015-04-22。正面是37×19 mm／R4法蘭、28 mm孔距、Ø3.2孔／Ø6.4沉頭，18 mm是側視深度，不誤作正面高度。法蘭、共腔、沉頭及孔內opaque低底共用PA6 albedo，凹凸由height／AO表達；僅三個簡化腳端M1，不推定合金或鍍層。省略同心接點基部、字樣、後端端子、腳長與接地先接順序；不是C5母孔、C14扁腳、實體通孔、市電模擬或IEC／安規認證。

獨立kernel沿用cached pose／periodic grain／compact C1：47個preset fields、17組constructor快取channel差值及五組平方profile係數；四組中心／scaled rotation basis128B，加96² grain73,728B，共73,856B retained typed storage，非總RAM或FPS。Owner bound hypot(.37,.19)＋.016＜.431933＜.5，每軸floor一次，只算一格。六個profile候選為rounded flange、沉頭、安裝孔、上瓣、abs-x下瓣與nearest圓pin；上下瓣以C1 union相連，下雙瓣在fold旁支援為零，三pin支援在nearest bisector前已歸零。沉頭annulus及well bbox／pin外部提早return，query無配置／hash／trig／sqrt／逐pin或鄰格loop；優化前後24,576 signed取樣／147,456 channel值與六組五圖皆完全一致。Default metallic1保留M1腳端／M0聚合物，explicit0只改factor。0.1 m nominal tile、0.0045 UV normal relief與平滑三瓣／沉頭為作者近似，不是CAD、腳深或材料量測校準；五圖不透明，沿用optional height、tint／repeats／Worker／cache與texture ownership，不增公開入口或runtime依賴。

`iecc8inlets`（IEC C8公入口正面示意）新增四片黑色PA6圓角矩形法蘭：外層凸起護罩為膠囊形，內腔兩端為半圓，中間以上下對稱圓角V形縮口形成八字形；各有兩個實心圓金屬插針端面，高於共同低底、低於護罩。實讀[SCHURTER2572產品頁](https://www.schurter.com/en/datasheet/2572)的C8、PA6及solid-contact說明；原站PDF／JPEG本次403，實際下載、渲染並放大[TME代存的2023原廠五頁PDF](https://www.tme.eu/Document/3aea005c480575d6ca262e097188b992/6160.0008.pdf)第1／3頁照片與正面圖。不是兩個相交圓孔，也不是C7母座、C14三片腳或有極性外形。法蘭、護罩、縮口及低底共用黑PA6 albedo，以height／AO表達凹凸；只有兩個簡化可見腳端M1，其餘M0，不推定金屬合金或鍍層。省略接點同心／齒狀基部細節、照片的小型成形凹部、標記及後端端子；不是實體通孔、市電模擬或IEC／安規認證。

獨立kernel沿用cached pose／periodic grain／compact C1：44個preset fields、14組固定channel差值及平方profile係數於constructor快取；四組scaled rotation basis／中心128B，加96² grain73,728B，共73,856B retained typed storage，非總RAM或FPS。Owner bound hypot(.29,.1814)＋.016＜.358062＜.5，每軸floor一次，只算一格。Rounded rectangle、外護罩capsule、內腔capsule、鏡像rounded-V implicit hyperbola與圓pin共五個C1 profiles；hyperbolic waist是作者的平滑形狀近似，不是原廠曲線校準。Pin只選abs-x的一側，兩支援在fold旁皆零；與capsule共用pin-x差及y²，query無配置／hash／trig／sqrt／逐pin或鄰格loop。既有metallic1 default保留M1腳端／M0聚合物，explicit0只改factor、不重寫metal圖。0.08 m nominal tile與0.0045 UV normal relief為作者近似，不是22.7×14.2 mm圖面比例、深度或材料量測；沿用opaque四maps、optional height、tint／repeats／Worker／cache與texture ownership，不增公開入口或runtime依賴。

`din5femalefaces`（標準DIN五孔母座正面示意）新增四片黑色PBT圓角矩形法蘭，各有上中／下左／下右三個安裝孔、封閉凸圓口、上方鍵形缺口與下方連接肋的絕緣芯。五個中央膨大的長形凹入母孔，按上二／下二／底中配置在近似下半圓上；不是mini-DIN。實讀[Same Sky SDS-50J產品頁](https://www.sameskydevices.com/product/interconnect/connectors/din-connectors/sds-50j)的standard DIN、five contacts、180° family與Shielding No，並實看[對應照片](https://cdn.sameskydevices.com/products/image/getproductimage/1184?typecode=m&width=300)及六頁[原廠圖面](https://www.sameskydevices.com/product/resource/sds-j.pdf)第3頁下半SDS-50J圖／材料表，不混用上半SDS-40J。表列black PBT housing、copper/tin phosphor-bronze ground／terminals及PE cover；PE的plating/color欄為空，不把端子的鍍層套給塑膠。可見PBT共用albedo，凹凸陰影交給height／AO；未解析孔底是M0 opaque stand-in，不宣稱實際金屬接點是塑膠或整個接頭無金屬。省略下緣金屬件／細小外殼缺口、PCB／後端端子、內部接觸彈片、字樣與pin編號；不是透明真孔、MIDI／音訊／電氣模擬或標準認證。

獨立kernel沿用cached pose／periodic grain／compact C1：四組中心與scaled rotation basis128B，加96² grain73,728B，共73,856B retained typed storage，非總RAM或FPS；72preset fields、17組channel差值constructor快取。Owner bound hypot(.25,.264)＋.016＝.379588＜.5；五孔支援保守外界.131170＜絕緣芯full-core.145。三mount按y半面／abs-fold選一候選；五長孔的軸向投影會重疊，不能只按行中心或abs-x截斷。Constructor以rounded slot與central bulge完整支援的投影，將兩條分隔線放進.022493／.024068的零支援空隙，query仍只算一個孔；slot＋bulge採C1 union，鍵形缺口及cavity-weighted下肋亦保留C1。九primitive、每軸floor一次，無query配置／hash／trig／sqrt／逐孔或鄰格loop。所有可見表面及未解析低底M0，default metallic0；explicit factor不會把blue0改成金屬。0.08 m nominal tile與0.0045 UV normal relief皆作者選定，不是圖面比例、孔深或材料量測校準；五圖不透明，沿用既有Worker、cache與texture ownership，無runtime依賴。

`xlrfemalefaces`（XLR三孔母座正面示意）新增四片D尺寸圓角矩形金屬法蘭，各有真正的左上／右下兩個安裝孔、封閉凸圓口、黑色高絕緣芯、頂部釋放卡扣與內側金屬小片。內側薄金屬環在上方開口，三個凹入母孔為上二／下一配置。實讀[Neutrik NC3FD-LX原廠材料表](https://www.neutrik.com/en/product/nc3fd-lx)，並實看[對應原廠照片](https://www.neutrik.com/uploads/media/400x/00/540-nc3fd-lx.jpg?v=1-0)及[原廠圖面](https://www.neutrik.com/media/8412/download/nc3fd-lx-3.pdf?v=1)第1頁；區分front與rear view，不把另兩個圓形壓印當成通孔。D-size是安裝規格，不是D形正面輪廓。表列鍍鎳ZnAl4Cu1壓鑄殼、PA66 insert、鍍2μm Ag的CuSn6 contacts及鍍鎳Ck67 locking element；未據此推定PA66玻纖比例或小金屬片的接地功能。可見金屬共用中性灰albedo，凹凸陰影交給height／AO；省略文字、pin編號、後端焊杯、內部接觸籠與銀鍍層色譜。母孔M0低底是未解析內部的opaque stand-in，不宣稱真實接點是塑膠，也不是公針、透明真孔或音訊／電氣模擬。

獨立kernel沿用cached pose／periodic grain／compact C1：四組中心與scaled rotation basis128B，加96² grain73,728B，共73,856B retained typed storage，非總RAM或FPS。法蘭保守owner上界hypot(0.29,0.345)×1＋0.018＝0.468694＜0.5；key外界hypot(0.043,0.159)＝0.164712＜黑芯full-core0.175與collar內孔full-core0.176。30組固定channel差值constructor快取；query每軸floor一次，安裝孔按y半面取一候選，三母孔按row join／abs-fold取一候選，不逐孔或鄰格掃描。Squared radial、rounded-rectangle與窄gap支援保持C1；gap的midline分支只有內孔中的零權重支援，略過collar full-void內的多餘primitive。移除原型中被內孔完全遮蔽的兩個gap控制，三seed24,576samples／147,456channels與32／512的30buffers皆精確零差；不是FPS證明。Query無配置、hash、trig或sqrt。Default metallic1保留可見金屬M1、黑芯／opaque孔底／背底M0，explicit0只改factor。0.09 m nominal tile與0.0045 UV normal relief為作者近似，不是製造尺寸、孔深或鍍層校準；五圖不透明，沿用既有Worker、cache與texture ownership，不增runtime依賴。

`bncfemalefaces`（BNC母座配接正面示意）新增四個低圓形金屬法蘭，各有較高圓筒口、兩個對向且低於筒緣的卡榫、內側金屬壁與白色絕緣環。中央母接點簡化為金屬環與opaque低底，不是凸公針。實讀[TTI對應031-221-RFX資料](https://www.tti.com/content/ttiinc/en/apps/part-detail.html?partsNumber=031-221-RFX&mfgShortname=ACO)，並實看其連結的[Amphenol原圖](https://s3-us-west-2.amazonaws.com/catsy.582/C31-221-RFX.pdf)及[對應照片](https://s3.us-west-2.amazonaws.com/catsy.582/031-221-RFX_1.jpg)。取得的原圖檔只有一頁、圖框標sheet2/3，不冒稱完整三頁；註記確立鍍鎳壓鑄鋅body、鍍金磷青銅contact及natural Delrin絕緣體，不混用無RFX版或PTFE。整個鍍鎳body共用中性灰albedo，凹腔陰影交給height／AO；不重現鍍金色譜、接點開槽／彈片、背端螺紋、獨立螺帽／墊圈／焊片、字樣、實體穿孔或射頻／阻抗模擬。孔內M0低底是未解析內部的opaque stand-in，不宣稱原件孔底材質。

獨立kernel沿用cached pose／periodic grain／compact C1：四組中心與scaled rotation basis為128B，加96² grain 73,728B，共73,856B retained typed storage，非總RAM或FPS。最外法蘭owner保守上界0.36×1＋0.018＝0.378＜0.5；卡榫外界hypot(0.332,0.028)＝0.333179＜法蘭full-core半徑0.35，其餘同心層亦落在前層full core。Squared radial／rounded-rectangle support與abs-fold只取一個候選卡榫，body優先的平滑權重不做hard max；25組固定channel差值constructor快取。Owner每軸floor一次，無body／stud支援時early return，內層逐層略過零支援；query無配置、hash、trig或sqrt。Default metallic1保留法蘭／外筒／卡榫／內壁／接點M1與絕緣環／opaque低底／背底M0，explicit0只改factor。0.04 m nominal tile與0.0045 UV normal relief為作者選定，不是原件尺寸或深度校準；五圖不透明，沿用既有Worker、cache與texture ownership，不增runtime依賴。

`iecc14inlets`（IEC C14公入口正面示意）新增四個黑色非金屬長方形護罩：封閉凸緣內的低腔有兩個對稱上削角，以及上方居中一片、下方等高兩片的直立矩形金屬插腳端面；腳端高於腔底、仍低於保護凸緣。實讀[SCHURTER6100-4原廠頁](https://www.schurter.com/en/datasheet/6100-4)，並渲染實看[第三方代存的2017原廠PDF](https://eu.components-store.com/datasheets/86/6100.4225.pdf)第1／2頁：檔名雖為4225，內文是6100-4全系列，含6100.4215的1.5 mm snap-in／4.8×0.8 mm背端選項；正面三個實心腳端與背面帶孔quick-connect分開。另實看[對應料號代存照片](https://eu.components-store.com/thumb/product/59/6100.4215.jpg)。原廠只確立黑色thermoplastic外殼，未取得腳端合金／鍍層證據，不推定PA6、鍍錫或鍍鎳。護罩、腔底及背底M0，腳端M1；冷灰RGB ramp與高度皆作者近似，不複製照片陰影，不建C13母孔、背端孔、真幾何穿孔、螺絲耳片或市電／安規模擬。

獨立kernel沿用cached pose／periodic grain／compact C1慣例：四組中心與scaled rotation basis共128B，加96² grain 73,728B，合計73,856B retained typed storage，非總RAM或FPS。Owner保守上界hypot(0.37,0.285)×1＋0.016＝0.483039＜0.5，每軸owner floor一次、只算一格；平方rounded rectangles與上角C1平面不用query sqrt。三層12組固定tone／height／roughness／AO差值constructor快取，nested support在前層full core內，共同grain抵消；背底、低腔外、腳端bounding box外與零cap依序early return。Row join margin0.018、paired-column join margin0.132，只選一個候選腳端，不掃三腳或鄰格；query無配置、hash或trig。0.08 m nominal tile與0.0045 UV normal relief皆作者選定，不是製造尺寸或插接深度。五圖不透明，沿用既有Worker、cache、texture ownership與public factory，不增runtime依賴。

`dsubsocketfaces`（DE-9母座正面示意）新增四片金屬長方形法蘭，各有封閉凸起D形金屬框、黑色非金屬絕緣芯、上下5／4排共九個錯位圓形凹入插孔，以及兩端安裝開口與短圓領。實讀[NorComp171系列頁](https://www.norcomp.net/series/171)與[原廠female drawing／specification](https://content.norcomp.net/rohspdfs/Connectors/17Y/171/171-YYY-20YLYY1.pdf)，並渲染實看原PDF兩頁：第1頁列黑色PBT＋30%GF、鍍鎳／錫鋼殼、鍍金銅合金接點及009尺寸表；通用正面線圖本身為25位，不當成九孔實照。第2頁01為0.098in solder-side 4-40 clinch nut；選用同硬體版本171-009-203L011的[DigiKey代存雙視圖照片](https://mm.digikey.com/Volume0/opasdata/d220001/medias/images/938/171-009-203L011.jpg)確認下方對接正面五／四黑孔，未混用L001無硬體版本或上方背面金色焊杯。法蘭與D框M1，絕緣芯M0；安裝開口及未能辨識的插孔內部以不透明深色M0底示意，不推定藏內接點材質或捏造可見金色口沿。單一冷灰RGB ramp、尺寸與剖面均作者近似，不複製照片光照，不認證鍍層、thread、pinout、RS-232／電學或製造尺寸。

獨立kernel沿用cached pose／periodic grain／compact C1慣例：四組中心及scaled rotation basis共128B，加96² grain 73,728B，合計73,856B retained typed storage，非總RAM或FPS。Owner上界hypot(0.4,0.164)×1.04＋0.018＝0.467608＜0.5，每軸owner floor一次、只取一格。平方rounded-rectangle、斜邊C1平面及平方圓孔不算query sqrt；層support位於前層full core，共同finish grain抵消，24組固定tone／height／roughness／AO差值constructor快取。背底、D框外及絕緣芯外依序early return，耳片範圍才算安裝孔；兩排只選一個最近socket，不掃九孔。Row support margin0.04−0.024＝0.016、half-pitch margin0.036−0.024＝0.012，保護owner joins。每query無配置、hash、trig或鄰格掃描；metallic為plate−face−mount，黑孔仍M0。0.08 m nominal tile與0.0045 UV normal relief為作者選定，非原件尺寸／物理厚度；不增runtime依賴，保留既有Worker／cache／texture ownership。

`topadjusttrimmers`（上調式微調電位器頂面示意）新增四個非金屬矩形外殼，各有偏近一角的圓形金屬調整螺絲、單一全寬直線盲槽與兩片較高金屬唇。整個螺絲含槽底皆M1，外殼及背底M0，不畫通孔。實讀[TT Electronics 64W產品頁](https://www.ttelectronics.com/products/passive-components/trimmers/64w/)及其連結的[Model64原廠圖](https://www.ttelectronics.com/TTElectronics/media/ProductFiles/Datasheet/64.pdf)，並實際渲染檢視原PDF第2–5頁；第3頁明載64W／64Y的Metal Adjustment Screw，頂面6.35×4.19 mm為矩形，不因catalog的square分類改畫方形。連結的[Model64材質聲明](https://www.ttelectronics.com/TTElectronics/media/ProductFiles/Compliance/Model-64-Material-Declaration.pdf)列Housing PBT blend、Shaft Brass及exposed nickel；可見金屬調整螺絲的判定另由原廠機械圖直接確認，不把PTFE rotor畫成外露塑膠螺絲。原廠灰階側照不顯示頂面，單一中性灰RGB ramp為作者示意，不認證顏色、頭部合金、鍍層、尺寸、電阻、pinout或法規。省略接腳及字樣，不模擬調整動作或電路。

獨立kernel沿用cached pose／periodic grain／compact C1慣例；四組中心、scaled body rotation與獨立slot rotation共192B，加96² grain 73,728B，合計73,920B retained typed storage，非總RAM或FPS。Owner上界hypot(0.33,0.22)×1.05＋0.018＝0.434442＜0.5，每軸owner floor一次、只取一格。矩形兩軸abs fold位於全覆蓋平頂，圓頭與直槽使用平方距離C1肩，不算query sqrt；完整head support嚴格位於body core：0.285＜0.318、0.190＜0.208。共同height／roughness grain於層差抵消，九個tone／grain／height／roughness／AO差值constructor快取；空背底及head外early return，不重算共同層。每query無配置、hash、trig或鄰格掃描。0.02 m nominal tile與0.0045 UV normal relief為作者選定，非原件尺寸；不增加runtime依賴，保留既有Worker／cache／texture ownership。

`crownprobetips`（四點皇冠探針金屬端面示意）新增九個圓形金屬探針端面，各有圍住較低中央throat的四個圓化凸接觸峰與四道低谷；整個端面含中央及低谷皆M1、外部背底M0，不畫通孔。實讀TME代存的[INGUN GKS-100-0038原廠規格](https://www.tme.eu/Document/e4740a4985139d06fa07bdd3136f6db8/INGUN_GKS-100-0038_EN.pdf)所列Style04四點皇冠／steel／gold finish，並實讀及渲染檢視鏡像站代存[原廠tip-style指南](https://globaltc.in/Catalogues/ingun_gks_overview_tip_styles.pdf)第1頁04圖；兩者是原廠 authored、非原廠host。金色單一RGB ramp、九片配置、圓化峰、杯面曲線與尺寸皆作者近似，不校準鍍層／合金／光學或加工剖面。不是十字驅動凹槽、外齒齒輪、城堡螺帽、03倒錐、06多齒、14自清潔或三／八點頭，也不模擬彈簧行程、電流／接觸電阻或測試治具；未收錄參考圖片。

獨立kernel沿用cached pose／periodic grain／compact C1慣例；九組中心與scaled rotation basis共288B，加96² grain 73,728B，合計74,016B retained typed storage，非總RAM或FPS。Owner上界0.36×1.05＋0.025＝0.403＜0.5，owner座標每軸floor一次、只取一格。平方半徑C1 cover保留完整金屬圓面與平滑低杯；四峰以max／min平方座標fold取單一候選，peak＝[4t(1−t)s]²。Peak start0.265大於side support0.115，所以對角fold上至少一因子為零，端點及fold均C1。六組固定channel差值先cache；逐點無配置、hash、sqrt、trig或鄰格掃描，空背底不取grain，跳過generic detail noise。0.008 m nominal tile與0.0035 UV normal relief為作者設定，不是原件尺寸或物理厚度。Seed改中心、scale、方向及微紋；五圖沿用opaque periodic、height、Worker／cache及ownership契約，default metallic1保留M1面及M0背底，explicit0只改factor。

`piezodiaphragms`（金屬外板與陶瓷邊中央電極示意）新增四個圓形表面：平坦金屬外板托住稍高的象牙白陶瓷片，中央為接近陶瓷同高的單一平坦金屬電極。外露金屬邊與中央盤各M1，陶瓷露邊與背底M0，共8個M1區；白環表示電極未覆蓋的陶瓷邊，不是陶瓷通孔。實讀[Murata P15E-8手冊](https://www.murata.com/~/media/webrenewal/support/library/catalog/products/sound/p15e.ashx)，實看[原廠結構圖](https://pim.murata.com/asset/pim4/piezoelectricDiaphragm/E84G0210_GIF_PIEZOELECTRICDIAPHRAGM)標示的Metal(Brass)／Ceramic／Silver Electrode；中性灰至象牙白的單一RGB ramp、四片配置、尺寸及表面finish皆作者化，不認證實際合金／鍍層／化學或製造尺寸。不做分割回授電極、背面、喇叭錐、鏡片、真幾何孔、壓電振動或音訊／電路／聲學模擬；未收錄參考圖片。

獨立kernel沿用cached pose／periodic grain／compact C1慣例；四組中心及inverse-scale-squared共96B，加96² grain 73,728B，合計73,824B retained typed storage，非總RAM或FPS。圓形不需旋轉／trig；owner上界0.36×1.06＋0.045＝0.4266＜0.5。Owner座標每軸floor一次，只取一格，以平方半徑的三個compact C1肩依序合成金屬板、陶瓷與電極；電極support完全落在陶瓷core內，metallic直接為plate×(1−ceramic)＋electrode，省去中間metal stores。逐點無配置、hash、sqrt、trig或鄰格掃描，空背底不取grain，跳過generic detail noise。0.06 m nominal tile與0.006 UV normal relief均為作者設定、不是實測振膜尺寸或物理厚度；seed改位置、scale及微紋。五張圖維持既有opaque periodic、height、Worker／cache及ownership契約；default metallic1保留混合phase，explicit0只改factor、不重寫圖。

`castellatedboards`（PCB板邊開放半孔與金屬面焊盤示意）新增四塊作者化深綠方形板面，各有四排、每排七個通向板外的半圓凹口與分離淡銀色面焊盤，共112個M1區；mask板面、開口背底與板外皆M0。焊盤呈環抱開口的平坦半環，不是填滿的圓via、QFN平指接點或castle nut。Seed改整板位置／方向與微紋，不打亂排距。實讀[OSH Park Castellated Edges](https://docs.oshpark.com/tips+tricks/castellation/)，實看其[板界穿過圓via的設計圖](https://docs.oshpark.com/images/castellation/callout-in-design-tool.png)、[未修整成品照片](https://docs.oshpark.com/images/castellation/fabricated-pcb.jpg)，以及Adafruit的[俯視](https://cdn-shop.adafruit.com/970x728/2491-05.jpg)與[斜視](https://cdn-shop.adafruit.com/970x728/2491-03.jpg)照片；面焊盤／開口和厚度方向的plated barrel不可混成實心頂面圓片。配色、四邊七孔及尺寸是作者設定，不複製ESP模組／走線／marking、照片資產或製造缺陷，也不認證金屬鍍層、FR4組成、pinout、IPC、電熱性能或加工品質。

獨立kernel沿用cached pose／periodic grain／compact C1慣例；四組姿態128B加96² grain 73,728B，合計73,856B retained typed storage，非總RAM或FPS。Owner上界0.315√2＋0.016＝0.461478＜0.5；nearest-side支撐間距0.024、row tie間距0.0045 cell。每軸floor一次，只評估一邊的一個有限row候選，不掃28孔；平方半徑smooth cut乘入板面，再乘入外圈land support，內端／邊界／row tie均C1。逐點無配置、hash、sqrt、trig或鄰格掃描，空背底略過grain並繞過通用detail noise。獨立fixture以raised footprint與M1八連通區辨識板和land，以凸包支撐線排除跨邊對角巧合、由觀察中心恢復四排及pitch，再從孔間板界追蹤五條raw height contour並擬合圓孔，不讀pose／最近row公式。半環centroid可能在空洞內，故由擬合輪廓射線尋找真正M1 core，驗平坦／共面、對比及M0開口；所有低背底須同一連通區。49合法變體各15cases通過，含每排3／5／6／8／9接點、1／9板、矩形外land、輕微內外偏心、flush face與無預烘AO；32故障均以AssertionError拒絕，另用金屬數仍112但背景變113區的closed-via對照直接證明開放性。0.06 m nominal tile及0.006 UV relief是作者參數，relief不是公尺。Default metallic1保留混合M0／M1，explicit0只改factor；opaque四maps／optional min–max height、tint／repeats、sync／native Worker／cache及caller ownership不變，不建立真通孔、透明、板厚側壁mesh或自動parallax。

`qfnlandpads`（QFN四邊平接點與中央裸焊盤示意）新增四塊深色霧面方形封裝底面，各有四排、每排七個等距銀色平接點及一個分開的中央裸焊盤，共116個M1區；塑膠與背底為M0。各接點及中央盤保持平坦、近乎共面，接點內端圓潤、外端平直，並非BGA圓頂、DIP外引腳或PCB散熱via。Seed只改整塊封裝的位置／方向與微紋，不打亂排距。實讀[TI SLUA271C](https://www.ti.com/lit/an/slua271c/slua271c.pdf)相關頁並實看第5頁Fig3-1封裝輪廓，另實讀[TI SLOA122](https://www.ti.com/lit/an/sloa122/sloa122.pdf)並實看第1頁封裝剖面與第2頁PCB圖；PCB熱via及stencil開窗不能移植到封裝底面。四邊七接點、配色與高度是作者設定，不是指定型號、pinout／pin1標記、中央盤必定接地、JEDEC／IPC、鍍層／合金或熱電／reflow認證，不複製圖像。

獨立kernel重用cached pose／periodic grain／compact C1 shoulder慣例；四組姿態128B與96² grain 73,728B，合計73,856B retained typed storage，非總RAM或FPS。Owner上界0.315√2＋0.018＝0.463478＜0.5；最近side的支撐間距0.0195、最近row tie間距0.019、中央盤至接點間距0.097 cell。每軸floor一次，只評估一邊的一個有限row候選，不掃28接點；平方內端帽及平滑外端保持flat core，body／metal分層均為C1，逐點無配置、hash、sqrt、trig或鄰格掃描，並略過通用detail noise。獨立fixture先以完整raised footprint找封裝，再以M1八連通區找接點；純M0另供塑膠bounds／probe，避免合法窄塑膠邊被誤算成多個封裝。觀察中心的共線共識恢復四排接點、pitch及正交軸，另驗中央矩形／細長端子、平坦／共面、containment與材質對比，不讀pose或最近row公式。53組合法變體各15cases通過，包括小封裝、每排偶數接點、角落鄰點更近、flush face、無預烘AO及不同端帽；27種故障均被AssertionError拒絕。0.02 m nominal tile與0.006 UV relief是作者參數，relief不是公尺。Default metallic1保留混合M0／M1，explicit0只改factor；沿用opaque四maps／optional min–max height、tint／repeats、sync／native Worker／cache及caller ownership，不新增geometry或自動parallax。

`radiolariandiscs`（放射蟲骨盤赤道剖面示意）新增四個象牙白礦質骨架：四道同心環包圍中央腔，三層環帶由內向外分成6／12／18格，每盤37個封閉暗腔，外緣另有六根平滑漸細短棘。骨架較高、亮且平滑，深色粗背底較低而遮蔽；seed改位置、方向、尺度及微紋。這是作者化的equatorial cutaway，不是外殼面上的porous sieve plates；也不是spiderweb貫穿中心的固定數放射絲、orbicularjasper／thomsonite平齊色帶或diatomvalves舟形細孔列。實讀[Haeckel Discoidea概述與Stylodictya條目](https://en.wikisource.org/wiki/Report_on_the_Radiolaria/Discoidea)及[Plate41圖說](https://en.wikisource.org/wiki/Report_on_the_Radiolaria/Plates5)，並實看Plate41；圖2／3／6／7明標rings alone／equatorial section，不能把完整篩板外觀誤當裸環肋。4環、6／12／18格及6短棘是作者簡化配置，不是特定物種、現代分類、完整細胞、量測顯微或矽質光學認證；不複製或打包圖像。

獨立kernel沿用cached pose／compact C1 support／periodic grain慣例，constructor保留128B姿態、96B環、96B環帶、288B軸及73,728B grain，合計74,336B retained typed storage，不是總RAM或FPS。單owner上界sqrt(0.4²＋0.009²)×1.06＋0.025＝0.449108＜0.5；環帶切換處共用滿覆蓋、零斜率圓環，兩側有限隔肋gate皆歸零，最近軸tie也在compact肋支撐外。平方半徑環、平滑有限隔肋與短棘以乘積聯集接合，不用max／clamp加法造折痕。逐點最多比較9個cached軸，只評估當前環帶的一條隔肋或外棘；無配置／hash／sqrt／trig或鄰格掃描，空底略過grain並繞過通用detail noise。0.00024 m nominal tile與0.0022 UV relief為作者參數，relief不是公尺。沿用opaque M0四maps／optional min–max height、tint／repeat、sync／native Worker／cache及caller ownership；不建立真孔、透明、3D殼或自動parallax。

`bgasolderballs`（完整BGA焊球矩陣）新增四塊隆起的深色方形非金屬載板，每塊完整排列13×13個等徑、等距銀色金屬圓頂，共676球；球心較高、亮、平滑，接觸帶較遮蔽。Seed改整塊載板的位置／方向及微紋，不擾亂製造格點。這是未裝配封裝底面的作者示意，不是dualinlinechips兩排外引腳、ballbearingfaces環形滾珠、ballchain連鏈或lensarray非金屬透鏡。實讀[TI SSZA002B PBGA文件](https://www.ti.com/lit/pdf/ssza002)第2頁的laminate／solder-ball構造及第5頁可完整覆蓋底面的array說明；實看[Pentium MMX BGA底面照片](https://commons.wikimedia.org/wiki/File:Kl_Intel_Pentium_MMX_embedded_BGA_Bottom.jpg)有綠載板、規則銀球及中央黑色無球區，不能當本完整矩陣的直接樣本。此處選深灰載板與完整方格，不複製照片資產，也不聲稱特定TI／Intel型號、pinout、JEDEC、錫合金、焊接／reflow／可靠度或電氣功能。沿用cachedNoise與單owner compact C1支撐：四組cached姿態共128B，加128² grain為131,200B retained typed storage，非總RAM或FPS。Default owner單軸上界0.34√2＋0.012＝0.492833＜0.5；球半徑0.0125小於pitch0.04的一半，最近row／column只查一球，不逐顆掃描。每軸owner floor只算一次，取樣無配置、hash、sqrt、trig或鄰居搜尋。成對signed half-plane乘積保留方板角的C1，球圓頂與接觸支撐在格點owner邊界前歸零；連續grain不跟格點owner跳色。Metallic圖為球1／基板與背底0，default factor1保留金屬區，explicit0只改factor。0.05 m nominal tile與0.012 UV relief為作者參數，不是公尺深度或尺寸校準。目錄862→863；four opaque maps／optional min–max height、tint／repeats、Worker／cache及caller所有權沿用，不新增真球mesh、underfill／routing／焊料流動、透明或其他browser／Canvas2D認證。

獨立fixture以768² raw取樣、非金屬height分層及metallic＞0.5八連通區找載板和球，不讀pose、相位或最近格點公式。從觀察球心的最近距離／四重角諧波恢復pitch與正交軸，再獨立cluster投影層、檢查每列／行人口和唯一格位；各球由觀察peak局部細化，12方向比較頂部、半徑中段、contact及載板，外圈取min(1.5×觀察球半徑, 觀察最近pitch／2)，避免密集合法17×17陣列的探針誤碰鄰球。三seed各四載板／676球／無orphans，每板13×13、169唯一格位且每行列13球。面積CV≤0.023033、pitch CV≤0.002442、兩軸pitch比0.999833–1.000218、四重軸strength≥0.999379，格位殘差≤0.014079 pitch，格心偏移≤0.000217載板等效半徑。Raw normalized球高／色差／finish差／載板高度分別≥0.549037／0.691606／0.543080／0.220260，圓頂中心比中段高≥0.207058、中段高於載板≥0.318149，contact AO差≥0.219584；球心M1／外圈M0。Seed實際metal足跡變化0.116089／0.112793。C1殘差≤0.002491、signed UV差≤1.49e-14；32／512皆opaque／Z正，XYZ平方長誤差≤0.012888，tilt²門檻0.001高於flat encoded底值。512有M0／M1／transition 240518／17067／4559 pixels；32僅粗預覽，不認證逐球輪廓。45合法變體各15cases通過，含偶數12、11／15／17矩陣、1／9載板、獨立AO、無grain height、C2 compact cubic dome、hemisphere配C1 contact blend與quintic shoulders；22可執行fault全拒／0接受，只把AssertionError算拒絕，涵蓋缺中央球／僅外圈、錯列／不等距／不正交／大小不一、平面pad／凹孔、缺carrier／高度／色差／finish／contact、金屬區錯置、hard／linear肩、只換grain及owner截斷。

`pigskinleather`（三孔群豬皮示意）新增暖褐、霧面皮革底上的64組三孔群：每組三個分開、稍不規則的圓潤毛孔排成小三角，孔心較低、暗、粗糙且遮蔽；位置、方向、群半徑、各孔尺寸與橢圓方向隨seed改變。三角的是孔群排列，不是單一三角形孔；也不是既有leather的Voronoi顆粒、ostrichleather單孔隆圈、cowhide毛皮色塊或perforatedleather等大單孔的人工錯列。實讀[Etherington／Roberts書籍保護字典的pigskin條目](https://cool.culturalheritage.org/don/dt/dt2578.html)、[Kawanishi Kaban的∴辨識段](https://shop.kawanishikaban.com/en/blogs/%E7%B4%A0%E6%9D%90%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6/material-pigskin)及[Leather Repair Company pigskin頁](https://prorestorers.co.uk/knowledgebase/pig-leather-skin/)；後者兩張300px近照已實看，但不拿低解析照片逐組認證三孔。孔群依字典的roughly triangular groups of three作者化，不聲稱天然皮料真偽、品種、鞣法、Nappa等級或毛孔密度校準。重用cachedNoise、compact C1 cavity與單owner tables慣例，以三個有界橢圓凹坑配連續雙尺度皮紋；不是新增通用皮革API。192孔×5個中心／quadratic係數與64²＋128² grain合計171,520B retained typed storage，不含JS物件／輸出圖或總RAM；取樣固定查三孔，無配置、hash、sqrt、trig或鄰居掃描。Default每軸support上界0.426782＜0.5，組內孔心距上界0.250337小於組間下界0.272686，避免owner截斷及孔群誤併。0.028 m nominal tile與relief0.0038 UV units皆為作者參數，不是物理孔深；全不透明非金屬，不重建穿透真皮的毛囊管、背面、皺摺網絡或透氣／透光性。

獨立fixture在max(768,96×cells)格點，以AO＜0.8的八連通區找孔，再用互為兩個最近鄰的三點群辨識triplets；不讀pose／橢圓係數，也不複製seed相位或孔形公式。各孔由觀察centroid以3×3局部搜尋細化AO最低點，再比較12方向外圈median的raw height／color／roughness／AO，避免固定color／height比例。實際built ESM三seed各192孔／64群、無ungrouped；群最短／最長邊比≥0.940672，2×area／最長邊²≥0.808043。孔area CV0.27443–0.29612、群半徑CV0.08203–0.09529、cell內位置SD≥0.12408、三重方向concentration≤0.097585。槽深／色差／roughness差／AO差分別≥0.327798／0.469495／0.207435／0.629999，metallic與mortar皆0；seed足跡分類變化0.017761／0.018494。C1殘差≤0.00004552、signed UV差≤5.56e-16；32／512全opaque／M0／Z正，XYZ平方長誤差≤0.009935。32是粗預覽，不認證每個小孔；normal tilt²門檻0.0001高於flat encoded [128,128,255]的量化XY底值，不用＜3當unit-normal證明。44合法變體各15cases通過，包括獨立孔色／深度／AO、不同密度、無grain height、C2 cubic／C1 smoothstep肩及獨立height／pigment profile；21可執行fault全拒／0接受，只把AssertionError算拒絕。

`trianglesocketheads`（TA 三角盲槽圓頭）新增25個銀灰色鋼製圓頭，每個有三條直邊的三角盲凹槽、稍圓滑的槽角與封閉平坦鋼底，周圍保留完整頭盤；粗灰底為非金屬。Seed改位置、方向、細紋與色調，不改頭盤尺寸；不是既有三條放射Y槽的tripointscrewheads、方孔、六角孔或曲邊TP3。外觀參考實讀的[Mingxing TA pan-head triangle-recess產品頁](http://www.mx-fastener.com/pan-head-triangle-shaped-recess-ta-screw.html)及實看兩張產品照片；該頁明確區分TA直邊與TP3，並列碳鋼／galvanized，這裡只作者化銀灰表面，不認證鋼種、鍍層化學、DIN／ISO尺寸、扭矩或防拆等級，也不複製照片資產。重用twopin／square／hex的既有shared sampler，只增加三個signed half-plane的平滑乘積而非paired abs或min交集；保留既有金屬槽底、圓肩及運算順序。Constructor的25×5 pose與128² grain共132,072B retained typed storage，非總RAM或FPS報告；新增取樣分支沒有配置、hash、sqrt、trig或鄰居搜尋。Owner bound為0.38＋√2×0.025＜0.5，槽外接半徑2×0.135＜fullRadius0.33。0.06 m nominal tile與relief0.03為作者參數，relief是UV單位，不是公尺或量測深度；不產生螺紋、真正通孔或pan-head mesh。

獨立fixture以512²的metallic mask與八連通區找圓頭及凹槽，不讀pose、不複製三角形half-plane式。從觀察頭盤centroid發出720條first-exit rays，三seed各25頭／25槽，皆三個徑向角峰、無遺失出口；角間隔誤差≤0.5°，最大／最小半徑1.95953–1.97365，三重對稱／直邊擬合殘差≤0.014202／0.000375（以觀察槽平均半徑正規化），槽centroid偏移≤0.006978頭盤半徑。觀察cell內位置SD≥0.013273，三重方向concentration≤0.241191。不同角度與半徑的floor probes皆metallic1／mortar0，raw normalized槽深≥0.418507、槽底高於實測底材≥0.230026，全部槽底高度範圍＜0.001968；槽／面色差≥0.398937、AO差0.44、floor較粗糙≥0.042397。Actual built ESM的C1殘差≤0.000074385、signed UV週期差≤2.301e-14；32／512 encoded normals皆Z正、XYZ平方長誤差≤0.012826、全圖opaque，512混合M0／M1／transition像素144014／90428／27702。32只作粗預覽，不逐槽認證輪廓。最終32合法變體各15cases通過，20可執行fault全拒／0接受，只有AssertionError算拒絕；涵蓋四／六邊或曲邊槽、印刷／凸柱／低到基底的槽底、缺色／AO／finish、固定stamp、非金屬／grout槽底、hard／linear／min角折與owner截斷。

`diatomvalves`（舟形矽藻外殼面示意）以四個大小、位置及方向不同的象牙白披針形殼面，呈現兩側橫向striae中的縱向狹長lineolae、較寬且平齊的中央留白，以及中央中斷、末端向同側微彎的兩段raphe。長軸sternum略高，孔與細縫則低、暗、較粗糙而遮蔽；不是八片石鱉板、整圈守衛細胞或深槽狀內殼。形貌參考已實讀的[Diatoms of North America Navicula guide](https://diatoms.org/genera/navicula/guide)、[N. tripunctata描述及外／內SEM標註](https://diatoms.org/species/navicula_tripunctata/images)，並實看其external SEM2、internal SEM1作區分；另實讀[Yılmaz等人（2024）形貌段及Fig.3圖說](https://pmc.ncbi.nlm.nih.gov/articles/PMC11019260/)，實看A–D外殼與E–H內殼，不把內側深溝／helictoglossae搬到外面。這是Navicula式外殼的作者圖樣，不是特定物種、SEM金鍍層、活細胞或一整對frustule重建。0.00012 m tile、2²配置、象牙色與誇張的normal用relief0.0022均為作者參數，不作微米孔密度、殼厚或真實反射率校準。沿既有cached pose／C1 compact support／grain模式，以有界最近row／column查單一狹孔；constructor預算四pose、24筆row bounds與96² grain，保留typed storage為160＋768＋73,728＝74,656B，不含JS／輸出maps，亦不等於fps改善。Whole lineolae依各row的完整支撐排除中央區，避免逐pixel裁出破碎半孔；default半徑加jitter0.47070<0.5，row／column換界在孔外，採樣無配置、hash、sqrt、trig、鄰格或逐孔掃描。全opaque M0，孔下仍有實心襯底；不新增幾何、透明／透射、完整girdle／內殼、光子效應、運動或生物模型。

診斷使用max(768,384×cells)格點與八連通區：default三seed各768²皆有四個外形，每組兩條raphe與84個lineolae，形成22組橫向列；這是取樣結果，不是物種孔數宣稱或固定測試常數。Fixture由外形centroid／covariance求軸，四條first-exit contour量長寬，以兩側局部色差辨識凹孔，不讀pose／row表、不複製形狀式，也不假定color與height降幅成固定比例。狹孔median主軸比≥2.3239、同側row間距CV≤0.03686；中央無狹孔，兩段raphe間隔為觀察長度0.08164–0.08379、同側端彎≥觀察寬度0.01498。孔median raw color／normalized height／roughness／AO差分別≥0.61967／0.29991／0.27971／0.52。外形radius CV≥0.05494、位置SD≥0.01670、方向concentration≤0.3541；seed足跡變化0.10254／0.10767。C1殘差≤0.014712、signed UV差≤1.95e-14。52合法變體各15cases通過，包括獨立改孔色／深度、較短身、不同孔列數、quintic shoulders及elliptic outline；24可執行fault拒絕、0接受，涵蓋圓孔／橫孔、無中央區、連通raphe、反側端彎、無深度／finish／AO、單側孔列、亂列距、固定stamp、真正owner裁斷、hard／linear肩及金屬殼。32／512 RGBA皆M0／opaque／Z正，XYZ unit error≤0.010058；32只作粗預覽，不認證細孔、raphe或物種。

`chitonshells`（石鱉八殼板覆瓦示意）新增九個長橢圓背面圖樣，每組八片隆起殼板（兩端帽片與六片中板）、七道帶方向性的非對稱接合肩，以及環繞殼底的深色粗糙外套膜帶。殼面沿覆瓦方向爬升，中線有圓滑低脊；接縫下面仍有較低、較暗且遮蔽的連續殼底，不是單一橢圓上刻七條對稱線。[UCMP Polyplacophora](https://ucmp.berkeley.edu/taxa/inverts/mollusca/polyplacophora.php)及已實看的Lined Chiton照片／anatomy圖提供八片背殼與girdle的參考；[Connors等人（2019）Fig.1a–b](https://pmc.ncbi.nlm.nih.gov/articles/PMC6904579/)的實際dorsal／side SEM分清八塊primary plates與周圍小鱗片。此處girdle只用fine grain，不重建該論文的數百片鱗片或μ-CT幾何。暖褐色盤、0.12 m tile與3²配置為作者選擇，不是灰階SEM色彩復原、特定物種或生物尺度校準。沿用compact squared ellipse肩與既有C1 corner-ramp概念，以rounded absolute彎接合線；一個owner、單一active course即可求值，沒有每pixel八片掃描。Constructor預算hash、旋轉／scale basis、各片tone及96² grain，retained typed storage為pose／tone864B＋grain73,728B＝74,592B，不含JS／輸出maps，也不當作fps提升。Default最大旋轉半徑加jitter0.47335<0.5；彎曲座標在尾帽可能超過最後interval，必須保留最後valve，不能讀下一owner的tone或undefined。Field hot path無配置、hash、sqrt或trig，肩與ramp維持C1。這是全不透明非金屬的二維浮雕示意，不建立隱藏重疊體積、八個可動mesh、捲曲動作、殼眼光學、透光／SSS、殼層／肌肉或生物力學模型。

診斷用max(512,256×cells)格點，default三seed各768²，皆觀察到九個四連通外形與72個高起殼面，每組主軸profile恰八段；沒有把它們當獨立mesh。從外形centroid／covariance求軸，再由實測谷點與半高crossings量七道接合：同組方向一致，長／短肩比≥3.3881，中間六片的順向高度增量≥0.06946，谷底比兩側峰低≥0.3910、仍比girdle上限高≥0.1542，AO差約0.21。橫向兩側獨立追谷得rounded-chevron偏移≥0.3020個pitch、左右差≤0.00280。32條radial probes／組皆有girdle，最薄相對帶寬≥0.1796、殼／帶roughness差≥0.3752。外形radius CV≥0.03553、位置SD≥0.02148、方向concentration≤0.4280；seed外形分類變化0.11401／0.11646。C1殘差≤0.000383、signed UV差≤2.45e-15。RGBA驗證在真正32／512 grid執行，phase分類僅於512以實際sampler原高度取樣，不把較密診斷grid或min–max height圖當raw高度；512殼／girdle luma差77.423、girdle／背景20.145、finish差0.37619。43合法變體各15cases通過，29可執行故障全拒，包含七／九片、對稱刻線、無覆瓦ramp、缺殼底／girdle、sharp chevron與尾帽越界tone。32／512皆M0、opaque、Z正、XYZ unit error≤0.012027，32只是粗預覽，不認證逐片。正式forced WebGPU／WebGL2、strict-CSP dist原生Worker／cache／borrowed-pool再利用與清理已實測，沒有新增Canvas2D、跨瀏覽器或生物材料認證。

`leafstomata`（葉片氣孔守衛細胞示意）以25組大小、位置、方向與孔寬不同的腎形守衛細胞，圍住深色、低而遮蔽的不透明孔底。兩個較亮、較平滑的細胞隆起在長軸兩端以稍低、但仍高於葉面背景的接合區相連；不是無分界的整圈殼唇、帶齒的寶貝殼口或單顆咖啡豆刻痕。已實讀[Nadeau與Sack（2002）Stomatal Development in Arabidopsis](https://pmc.ncbi.nlm.nih.gov/articles/PMC3243354/)章節並實看Fig.1的TEM／cryo-SEM，以及[Jaafar與Anderson（2024）stomatal cell-wall review](https://pmc.ncbi.nlm.nih.gov/articles/PMC11232514/)和Fig.1示意圖：雙子葉腎形守衛細胞在兩極接合，與禾本科啞鈴形不同。這些是綜述／章節與其引述的顯微圖，不冒稱本引擎重做原始實驗。0.00025 m tile、5²排列與綠色盤是作者示意選擇，不是從灰階SEM量得的顏色、氣孔密度或特定物種重建。沿用既有compact squared shoulders與cached grain；內外橢圓肩、徑向隆起與兩端接合皆C1，孔內跳過不定的徑向座標。Constructor預算hash、旋轉／scale basis、inverse pore width及96² grain／12² skin noise；field hot path無配置、hash、sqrt或trig。Pose1,200B＋grain73,728B＋skin1,152B＝76,080B retained typed storage，不含JS容器與輸出maps，也不是fps提升證據。Default旋轉支撐加jitter保守半幅0.448<0.5，只需本owner。粗綠底僅抽象葉面，不重建pavement細胞拓樸、one-cell spacing發育規則、細胞器、真三維通氣孔、透光／SSS、動態開閉或蒸散／生物力學。

三seed的實際512² height field各有25個填孔後的外輪廓、25個四連通低孔與50個八連通高起細胞葉瓣；八連通處理斜向crest像素，不把兩端仍接合的細胞說成50個獨立mesh。由觀測孔的centroid／covariance獨立找長短軸，aspect≥2.873、兩葉瓣midpoint偏差≤0.01213 cell、沿長軸的pair alignment誤差≤0.11297；每seed800條徑向profile皆有完整圍孔接合，極向profile峰值比背景上限高≥0.32014、側向峰值比極向峰值高≥0.07780。外形radius CV≥0.04282、孔寬比例CV≥0.10597、位置SD≥0.04067、方向concentration≤0.25534；seed外形分類變化0.15845／0.16064，孔分類0.04663／0.04932。C1殘差≤0.000881、signed UV差≤9.92e-16。512 RGBA以實際sampler高度分類後，guard／背景luma差59.917、背景／孔差24.298，guard較平滑0.31196、guard／孔AO差0.64115；optional height沿用既有min–max正規化，不能當成height/relief原值分類。40合法變體各15case通過，25可執行故障全拒。32／512皆M0、opaque、Z正、XYZ unit error≤0.011043；32僅粗預覽，不認證逐孔／逐細胞。正式forced WebGPU／WebGL2及strict-CSP dist原生Worker、cache、borrowed-pool再利用與清理皆實測；沒有新增Canvas2D、跨瀏覽器或生物／醫療認證。

`watermelontourmaline`（西瓜碧璽三角切片鑲板）新增16個分離的近似圓角三角拋光切片：粉紅核心、淺灰過渡帶與綠色外圈共用同一平面，放在較粗糙的暖灰背板上，不是果皮條紋、綠粉換色的立方fluorite或刻溝嵌線。[GIA Tourmaline Quality Factors](https://www.gia.edu/tourmaline-quality-factor)說明pink core／thin green skin與薄切片，已實看的典型標本照片提供分色參考；[GIA Micro-Features of Tourmaline（2024）](https://www.gia.edu/gems-gemology/summer-2024-micro-features-tourmaline)說明trigonal結構、triangular cross section與color zoning。0.08 m tile、4²配置與理想化三重對稱是作者選擇，不是標本／化學成分／尺寸重建。沿用fluorite／chiastolite的平面色帶原則與既有固定灰色neutral-pigment路徑；外形、核心與灰帶邊界都用三個compact circle的C1 products，沒有nearest-arc接縫或新公開幾何／色彩API。Constructor預算帶radius normalization的旋轉basis、core／pale inverse與平方值、hash、96² grain及8² cloud；field hot path無配置、hash、sqrt或trig，離開切片便不讀內層／grain。Pose1,152B＋grain73,728B＋cloud512B＝75,392B retained typed storage，不含JS容器／輸出maps、不冒稱fps提升。預設最大support0.34＋jitter0.07＝0.41<0.5 cell，只需本owner。這是正面不透明PBR色盤近似，不提供寶石透射／折射、多色性、貓眼／iris effect、內部包裹體光學、真切片mesh或寶石產地／品質認證；照片未複製為資源。

三seed實際512² sampler皆16個分離的週期4連通切片。從height-weighted centroid與首次離面的96條ray獨立量輪廓，normalized第三Fourier係數≥0.06576、第二／四係數≤0.00002564、120°差≤0.000514；不是直接複製circle或private poses。每seed全部1,536條ray依序遇到粉紅、灰帶、綠圈，採樣面height/relief span≤0.001929、roughness span≤0.01350、與背板roughness差≥0.59602。Radius CV≥0.04427、位置SD≥0.03291，orientation concentration≤0.23489；seed輪廓分類改變率0.08276／0.07959。C1殘差≤0.0001588、signed UV差≤1.12e-16。512 RGBA紅／綠／灰區比例約0.08293／0.07513／0.01218，灰帶比兩色亮46.305 luma，三區mean-height差0.618 byte內、roughness差0.00158內；16個實際輪廓中心皆紅、1,536個外圈probe皆綠。36合法變體各15case通過、24可執行故障全拒；調換色盤即使紅綠像素總量仍存在，也由16個錯色核心拒絕。32／512皆M0、opaque、Z正、XYZ unit error≤0.010735，32只作粗預覽，不認證所有細灰帶或逐片輪廓。實際forced WebGPU／WebGL2及strict-CSP dist原生Worker／cache／borrowed-pool再利用／清理通過，沒有新增Canvas2D／跨瀏覽器或寶石光學認證。

`cuttlebone`（烏賊骨層板波壁示意切面）以暖白、粗糙的非金屬薄壁／層板包圍深色、低而遮蔽的不透明底面。視覺依據是已實讀的[Yang等人2020年wall–septa研究與Fig.1](https://pmc.ncbi.nlm.nih.gov/articles/PMC7519314/)及其實際SEM／重建圖：烏賊骨是內殼，不是脊椎動物骨。作者0.0024 m nominal tile含六個不等高層區，每層24條錯位、彎向與幅度不同的五次波壁，以C1 product union併入層板；不是把`cardboardedge`的橫向連續中紙換成白色。這是二維示意切面，真正三維壁為含分叉的開放迷宮，144個二維視窗不代表144個封閉氣室或文獻93 vol%孔隙率。未重建micro-CT、三維波度梯度／成長方向、真幾何孔洞、透射／SSS、流體浮力、強度或生物尺度；標稱尺寸及曲線是作者選擇，不是量測複製。Constructor預算hash、layer bounds／inverse scales與96² grain；field hot path沒有陣列／物件配置、hash、sqrt或trig。壁／層界共2,456B加grain73,728B，retained typed storage76,184B，不包含JS容器與輸出maps，也不當作fps提升。預設column-support保守半幅0.45675<0.5、界面偏移0.12<0.5，故只需本column與最多一個相鄰row修正；平方局部tangent距離避免斜壁變細，row切換藏在平頂層板內。

三seed實際512² sampler皆觀察144個週期4連通低區、6層，層高CV0.07198–0.08107；低區像素比例0.88644–0.89196只是此二維mask，不是體積孔隙率。各壁都有相反側半波與較大的上半波，兩種彎向皆存在；placement SD≥0.09744、bend amplitude CV≥0.19434。由實際height profile的centroid微分投影估算local-normal FWHM，壁內max/min≤1.0084（界限1.03），不冒稱精確全域Euclidean距離。白壁比底面color高≥0.8570、height/relief高≥0.6525、AO高≥0.7670，而底面roughness高≥0.1143。C1殘差≤0.001774、signed UV差≤5.30e-14；32／512 RGBA皆M0、opaque、Z正，XYZ unit error≤0.01252。30合法變體各15case通過、21有效故障全拒，包含max-union接點、linear肩、遺失tangent補正、遺失row修正與只改粉粒不移幾何。32只驗證粗預覽，不認證144視窗。正式gallery forced WebGPU／WebGL2與strict-CSP dist原生Worker／cache／borrowed-pool再利用／清理皆實測；未擴大Canvas2D、跨瀏覽器、幾何或生物材料認證。

`pallasite`（拋光橄欖隕鐵）新增不透明切片近似：橄欖綠至蜜黃色非金屬晶粒包在連通銀灰金屬基質中，兩相近乎平齊，晶粒內有細暗、微凹而略粗的裂紋，不是凸石卵或灰色水泥填縫。[NASA Mittlefehldt／Rumble摘要](https://ntrs.nasa.gov/api/citations/20060020744/downloads/20060020744.pdf)實際說明magnesian olivine＋iron-nickel，[ASU Buseck Center](https://meteorites.asu.edu/stony-iron-meteorites/pallasites)說明greenish olivine；並實看[Esquel切片照片](https://commons.wikimedia.org/wiki/Special:FilePath/Esquel.jpg)的晶粒／反光金屬網，沒有複製影像。這是正面不透明PBR作者模型，不提供照片中的背光透射、折射、寶石品質、精確鐵鎳光學常數、蝕刻Widmanstätten結構或成因／成分認證。0.16 m tile以8² jittered periodic Voronoi晶粒、可變內縮與C1 half-plane products構成；私有`buildPeriodicVoronoiPlanes`直接抽用原`septarian`裁剪，原inline副本刪除，沒有新公開幾何API。Constructor才做clip／hash／sqrt／trig，pixel僅查3²局部owner候選與存活facet，不配置陣列／物件或重建polygon；晶粒support互斥，找到正support即可停。三seed實量每圖384個unit-plane triplets、每晶粒4–8 facets／平均6；含96²grain的retained typed storage88,064B，constructor共用scratch1,608B，不含JS容器／輸出maps，不是FPS。Seed改晶粒位置、大小、色調與裂紋；晶粒M0、連通基質M1，使用既有neutral-matrix pigment路徑；預設factor1，明確override0可全部非金屬化。保留四opaque maps、optional height、tint／repeats、sync／Worker／cache及ownership；不新增依賴、入口或mesh，也不擴大Canvas2D／跨瀏覽器認證。

三seed實際sampler的512²週期4連通mask皆64個分離晶粒，面積CV0.20349–0.22898、最大bbox aspect≤1.582；full-metal比例約0.34326–0.35850、full-mineral0.53615–0.54996。晶粒比金屬roughness高≥0.09164，height／relief全幅≤0.013985（polished界限0.04），AO0.96–0.99。以每晶粒full-mineral區的最暗／最亮像素讀回，全部64粒的暗線皆同時更凹、更粗，超過80%容差，不讀private site／planes。Seed分類改變率約0.33936／0.33960、color差≥0.6649；C1殘差≤0.0005113（界限0.04）、signed UV差≤3.55e-14。512實際RGBA的晶粒／金屬分別64／1個週期4連通元件，M>250比例0.35268、M<5比例0.55801，礦物／基質G−B差68.524、roughness差0.09162、AO245–252。32／512的XY²與XYZ unit error均約0.00003076、Z正、opaque；這個拋光preset的已測8bit法線近似平面，不把微小float裂紋高度說成可見bump；32不認證64晶粒。22合法變體各15case通過，20真故障全拒；包括seed仍改色但幾何凍結、反轉M相、把拋光面做成凸石／深溝、暗裂紋不再微凹／略粗、遺失鄰owner、nearest-edge／linear shoulder creases、去掉中性金屬顏色。

`gosperinlay`（三階Gosper黃銅嵌線）在粗糙海軍藍非金屬底面上新增一條略凸、較光滑的黃銅色金屬線。依已實讀的[Gosper curve](https://en.wikipedia.org/wiki/Gosper_curve)及其原始wikitext的60°、axiom A、兩個A／B production，離線三次展開為343個等長連結、344個不同三角晶格頂點，只有兩個端點，不閉合、不分岔；這是有限三階圖樣，不是極限空間填充集合或Gosper island的平面鑲嵌。不同於`moorecurve`的64格正交封閉凹槽、`boullebrassinlay`的S形植物卷紋與`kintsugiceramic`的裂縫網。0.5 m tile的preset保存343字元方向word；constructor只建4值線段與16²局部bbox索引，pixel不解L-system、不配置物件／陣列、不作全343線段掃描或sqrt／trig／hash。重用`vogelspiral`的prefix-end原地填表，以及`fiddleheads`的product-union rounded joins；801 references、257 offsets、max11／全tile各bin mean3.12890625候選，含96² Float64 grain共86,820B typed storage，不含JS string／物件／輸出maps，不是FPS量測。Squared capsule距離與C1 cubic shoulder相乘聯集保留圓帽與平core。Seed只改grain finish，不移動路徑或metal mask；線M1、底M0，default material metallic1才保留mask，explicit0可整體非金屬化。四張不透明PBR maps、optional height與既有tint／repeats／sync／Worker／cache及ownership維持；不新增入口、依賴、mesh或alloy／導電／製造模擬，也不以Canvas2D或未測瀏覽器認證。

獨立fixture從公開A／B production遞迴生成參考晶格，而production僅讀離線direction word；沒有匯入private pose表。三seed直接讀實際sampler的949個候選鄰接邊，觀察343連結／344可達頂點、兩個degree1與342個degree2，606條shortcut皆無、每連結五個內部樣點無斷線；343連結兩側共686個背板樣點均M0。兩端各13條外半平面首次離面ray的半高半徑約0.00567186、spread0，界限1.5%；core差≤0.005958（grain容差0.0061）。線M1／底M0、roughness差≥0.54555、color差≥0.82231、AO差0.33。Seed color差≥0.02365、normalized-height差≤0.005742、metal mask完全相同。C1殘差≤0.0009104（h=1e-10，界限0.04），signed UV差≤3.06e-16。512實際maps的M>250比例0.13271、背板0.82576、過渡0.044922、roughness差0.55991／luma差126，height／metal最大差3byte（界限4）；抬升嵌線外側normal dot≥0.39413（界限0.08），XYZ unit error≤0.01240、Z皆正，線／背板各1個4連通元件。32只驗證PBR對比、registration與量化正常，不認證343段／端點拓撲。16合法變體各15case全過，17真故障全拒：max-union或線性肩的C1殘差1286.53／1155.58；保留端點中心但切去外半平面仍由cap roundness拒絕（spread約1）；bbox已擴大的橢圓帽spread0.0246952；cache漏shoulder殘差9.968e9；另拒絕錯direction／少末段、過寬填底、無rough contrast／relief、全金屬／全非金屬、無seed grain與seed略改半徑。 另外兩個獨立RGBA源故障皆由同一fixture拒絕：XY互換仍保有unit length，但外側normal dot變−0.54105；Z強設255仍朝前，XYZ unit error變0.313756。

`vogelspiral`（97圓片黃金角葉序鑲板）將97個等大、平頂圓肩釉面圓片按黃金角放在粗灰底上，深青／鼠尾草／象牙三色族各33／32／32片。已實讀[Fermat’s spiral的Vogel葉序段](https://en.wikipedia.org/wiki/Fermat%27s_spiral#The_golden_ratio_and_the_golden_angle)：原式r=c√n、θ=n×137.508°；本作者明確改為r=0.044√(n+0.5)、θ=nπ(3−√5)，n=0–96，以半步徑向偏移避開中央擁擠，不宣稱是原式n=0的中心點。這是離散等大圓片，不是連續螺旋線、半徑遞增相切的Doyle圖樣、植物模擬或Fibonacci條數認證。0.5 m名義tile，UV圓半徑0.033（名義16.5 mm）；最小圓心距0.06802551、大於直徑0.066，外包圓半徑0.46523142，均留灰縫與外框，不作施工認證。平方半徑斜肩保持C1，seed只變tone／grain。沿用預算化鄰片查詢方式，8×8空間CSR表224個references、每bucket最多8／平均3.5個候選，不逐點掃97圓。固定Float64資料291＋96²個、Uint16 offsets65＋references224，共76,634 B typed儲存（不含JS物件／輸出maps）；constructor才算trig／sqrt／hash，逐點無配置。略過通用detail；不透明M0、四maps＋可選height、periodic signed-UV與既有所有權不變。

實際sampler三seed的1024²連通面均97圓，不讀private pose表；按實測r²排序讀回黃金發散角，最大誤差0.00151271 rad（界限0.006），等差r²殘差最大0.023898個annulus（界限0.06），等半徑spread≤0.32044%、eccentricity≤0.004744。13條首次離面ray的半徑range≤0.50264%（界限1.5%）；滿心97片、core高度差≤0.005125（grain界限0.0061），最近圓片間中點全為平灰縫，拒絕環片與鼓面。512實際height亦97個面；32不認證97片／完整圓形。C1殘差≤0.00014433（h=1e-10，界限0.04），signed-UV誤差≤6.11e-16。19合法變體各15case全過（包括旋轉、鏡射、徑向offset及4／12 bins），17故障全拒：非等差r²殘差2.32301、擴大cache bounds的橢圓roundness5.0948%、環片滿心0、鼓面core差0.06735、漏斜肩cache的C1跳躍約8.96e9、線性肩343.17。Seed只改釉色／grain，不旋轉整盤；不以候選數宣稱fps提升。

`langtonsant`（蘭頓蟻1024步快照棋磚）把122個深色亮面邏輯黑格置於32×32淺暖色粗釉格板，奶油色凸三角標出終點與朝向。採實讀[MathWorld Langton’s Ant](https://mathworld.wolfram.com/LangtonsAnt.html)的白格左轉90°／黑格右轉90°、翻色再前進一格約定；它與常見鏡射慣例不可混用。本作者從(16,16)朝上、全白無限平面離線前進1024步，終點(8,8)朝下，122黑格、226曾訪格；全軌跡x=5–24／y=6–22，未碰32格邊界。只存32個row位元數及終點方向向量，不在runtime跑模擬、不複製來源圖像。0.32 m名義tile、0.01 m格距；圓肩方格與三條半平面相乘的三角指標保持C1，邏輯白格呈淡暖色而非純白。不是QR碼、可互動自動機或104步highway／無限演化證明。每sampler只新增96² Float64 grain（73,728 B typed-array儲存，不含JS資料與輸出maps），bitmap查詢O(1)、逐點無配置／重算hash，略過通用detail。維持不透明非金屬M0、四maps＋可選height、periodic signed-UV與既有所有權。

測試不抄bitmap、不用同一forward演算法對答案：從實際sampler／512 RGBA讀回格狀態，在三角外露角(.34,.34)恢復其底下原格，從前窄後寬讀朝向，再逆走1024步，唯一還原全白、原點朝上。512有123個半高連通面（122黑方＋一個白格上的三角）；32保有格心binary snapshot，但一像素指標不足辨方向／底格，僅以兩種底格及四方向的唯一逆解驗證，不宣稱其肩部／三角輪廓完整。三seed方格兩軸span不等率≤0.01977%（界限1%），normalized C1殘差≤0.0002472（h=1e-10，界限0.04），signed-UV誤差≤6.67e-16。15合法變體各15case通過，17故障全拒，包括一個錯bit、指標位置／方向錯、鏡射轉向約定、錯位元順序／轉置、圓格／長方格、線性肩、忽略seed、seed移動輪廓及金屬化；單獨三角線性肩殘差659.38，長方格span不等率14.8268%。Seed只變finish，非換一盤棋。

`pentominotiles`（十二種自由五連方拼磚）將每塊由五個等大邊連通方格構成、旋轉／鏡射視為同形的12種自由五連方，各放一次於作者6×10格矩形，再5×3重複成30×30格、180塊釉面拼磚。已讀[Pentomino](https://en.wikipedia.org/wiki/Pentomino)的定義、12種自由形／63種固定取向與6×10拼合說明；佈局由離線exact-cover求得並逐格確認，不複製圖片、不是正五邊形鋪磚。A–L只是私有作者ID，不是慣用字母名稱。海軍藍／灰藍／象牙三色族各60塊，粗灰縫；0.6 m名義tile，900個等大格的名義邊長0.02 m。相鄰格的平滑權重按整塊ID合併，消除同塊內部格線；不同ID的平手落在平灰縫內，凹角與四格交會保持C1圓肩。這是加權圓角作者圖樣，不是等距幾何offset、施工規格或互動拼圖／通用求解器。初始化只有900個Uint16 owner、180個Float64 tone與96² Float64 grain，共76,968 B固定typed-array儲存（不含JS物件／暫存與輸出maps），逐點無配置、不重建hash／解題；略過通用detail。維持不透明M0、四maps＋可選height、periodic signed-UV及既有所有權。

三seed（0／7／0xffffffff）從實際高度的格心／共邊中點解碼，皆180塊、每塊五格邊連通、每6×10區塊12種不同D4形且各一次；全圖735條同塊共邊不出假縫、1065條異塊共邊為粗糙凹灰縫。測試不抄ID矩陣或限定朝向，水平／垂直鏡射均接受。512的實際RGBA height亦180個半高連通面；32只認證maps與大色塊，不認證全12形拓樸。h=1e-10的C1斜率殘差最大0.00037748（界限0.04），signed-UV誤差≤4.45e-16；seed改變finish，不移動輪廓場（normalized-height差≤0.00573476，grain界限0.006）。15種合法變體各15測項全過，14種消費者可見故障全拒，包括單格磚、內部假縫、缺形／錯格、近乎消失的relief、粗糙釉面、線性非C1斜坡、seed移動圖形與金屬化。既有850種preset／tile不變，23,800取樣的142,800通道及10種相關材質60組300個RGBA buffers逐值／byte相同；不以此宣稱fps提升。

`pythagorastree`（有限畢氏樹釉面方磚）新增每棵31個分枝方形的四代圖樣（根＋四代，1／2／4／8／16片）：深赤褐樹幹逐代變淡至象牙色小方片，置於粗糙灰縫上。不同於既有`pythagoreantiles`的2:1雙尺寸、每tile五大五小的平面鋪滿。[Wikipedia Pythagoras tree](<https://en.wikipedia.org/wiki/Pythagoras_tree_(fractal)>)與[MathWorld](https://mathworld.wolfram.com/PythagorasTree.html)描述在朝外邊的等腰直角三角形兩腿上立子方形，子邊長為母邊長的√2/2、兩子名義面積合為母面積；一般無限樹可能重疊，不能把帶重數面積當union面積。本作者有限31方形以精確dyadic座標SAT確認沒有內部重疊、46對名義角／邊接觸，各代總名義面積皆等於根；有限bounds為4.5L×3.25L，不引用無限樹的6L×4L來冒稱本圖樣尺寸。4個週期motif、scale0.2／centerY1.625、grout0.002／shoulder0.003、roughness0.3／UV relief0.012、色盤100,32,30／240,221,180及tile0.4 m皆為作者設定。31×7幾何值＋124 tone＋96² grain共76,456 B Float64 tables，另有JS scalar與初始化遞迴，非總RAM。逐點只查單owner的31片，平方包圍半徑早拒絕，再乘兩軸平方C1 profile，無逐點配置／hash／trig／sqrt或鄰owner掃描；空灰縫略過grain、generic detail略過。四張opaque dielectric map、M0、optional height與既有factory／Worker／cache／ownership不變；不是無限碎形、真樹、完整mesh、分形維數或磁磚／結構／施工認證。

三seed（0／7／0xffffffff）的1024²實際sampler半高raster皆124片方形，每motif31片；由連通面四次矩讀回角度與fourfold0.42466–0.43112（圓形故障0.0162被拒），沿觀測軸找首次離開面的位置，再反解平方肩部恢復名義邊長，不偷讀私有pose表。兩軸輪廓長度不等率≤0.02661%（界限3%），五個尺寸家族與各代面積誤差≤0.03374%（界限3%）、根邊長誤差≤0.00606%；方向為0／45° modulo90，量測浮點誤差約1.3e-16 rad。每個實測母面找到兩個子面，位置誤差≤0.001305（界限0.003）、兩子面積和誤差≤0.03098%，走訪31片無遺漏。恢復名義灰縫前的SAT接觸每棵46對，最負讀回gap−0.00040172在0.0025 raster容差內，非實際片面重疊的主張。五代平均tone相距≥0.15871、灰縫roughness差≥0.59487、AO差≥0.47207、M違規0；seed的形心／邊長讀回漂移≤8.63e-6，最大tone變化0.07460／0.07123。六channel relief-normalized observed-curvature C1 worst0.00056843<0.04，signed-UV誤差≤2.221e-16，涵蓋grid、owner邊界、四向肩／角／offset probe與curvature refine。512灰縫比例0.82901、roughness差0.59629、luma範圍134.76、AO128–250、max tilt²0.88043、四方向signed fraction≥0.02368；32為0.82031、0.60667、133.04、128–250及0.029558，不解析全部細代方片。15合法變體各17case全過、15故障全拒；849舊kind的142,632個channel取樣值與十相關kind的60組／300 buffer完全不變。完整gate與renderer／CSP證據見ACCEPTANCE。

`ichinghexagrams`（六十四卦浮雕爻紋）新增8×8個六行符號：深炭綠平頂圓肩爻線立於奶油色粗底，陽爻連通、陰爻左右等分且中央留空；全圖192陽爻＋192陰爻，共576個分離長條。已讀[Hexagram (I Ching)](<https://en.wikipedia.org/wiki/Hexagram_(I_Ching)>)的六條堆疊線、陽實陰斷、自下而上數爻及多種卦序說明。本preset用作者自定0–63 row-major二進位排列，最低bit在最下爻；不是文王卦序、Unicode碼位順序或伏羲圖式認證。不同於sevensegment的數字、EAN-13碼條、點字圓頂或Rule30演化格。line pitch0.1、halfWidth0.36／halfGap0.08／halfHeight0.032、shoulder0.012、roughness0.3、UV relief0.003、色盤28,34,30／226,216,178及tile0.32 m（8×8個名義0.04 m glyph cell）都是作者設定。64 tone與96² grain共74,240 B Float64 tables，另有JS scalar／初始化暫存，非總RAM。每點僅選單glyph最近一行，快取平方半徑與inverse bands的分離C1 profile相乘，沒有逐點配置／hash／trig／sqrt或鄰字掃描；generic detail略過。四張opaque dielectric map、M0／mortar0、optional height與既有factory／Worker／cache／ownership不變；不是書法字型、可操作文字、透明孔、mesh、占卜或歷史／文化認證。

三seed（0／7／0xffffffff）的實際sampler自下往上解碼各64種符號，讀回0–63且皆不重複，陽／陰各192；陽爻與陰爻兩端高度≥0.7600 relief單位，陰爻中央0.12。1024²半高raster皆576個長條、每字六排，陽爻每排一片、陰爻每排兩片；半高輪廓的平方profile閉式預測與觀測寬／高差≤0.006492（界限0.01640625 glyph cell），列／對稱位置誤差≤0.002344、陰爻中央gap0.171875，raster box填滿率1（不代表連續曲面沒有圓肩）。爻線比背景深且高，色調差與relief高差各≥0.6400；背景roughness差≥0.5701，爻頂／背景比觀測半高肩的AO分別亮≥0.29994／0.37994，M0／mortar0違規0。Seed不動字形／位置／寬高，讀回漂移0，逐字最大tone差0.06151–0.07181。六channel relief-normalized observed-curvature C1 worst0.00058398<0.04，signed-UV量測誤差0（4096點）；涵蓋grid、實際長條肩部二分讀回與curvature refine。512像素低高度背景比例0.78223、roughness差0.53459、luma範圍143.6、AO158–255、max tilt²0.28718、四方向signed fraction≥0.02514；32為0.75、0.41363、100.9、168–255及0.00076894，只能保留部分爻線，不可解讀完整64卦或窄肩。15合法變體各15case全過、15真故障全拒；848舊kind共142,464個channel取樣值完全相同，十個相關kind的60組／300 buffer逐byte不變。完整gate與renderer／CSP證據見ACCEPTANCE。

`apollonianmosaic`（Apollonian相切圓馬賽克）新增有限兩輪Descartes反射的圓形釉面鑲嵌：深青綠、鼠尾草與象牙圓盤逐層填入三個等大圓的相切空隙，四個週期圖樣各19圓。不同於`pennyround`的等大交錯圓磚、`circularpavers`的同心扇形鋪面或方孔`Sierpinski`圖樣。[Apollonian gasket](https://en.wikipedia.org/wiki/Apollonian_gasket)提供相切圓遞迴；[Descartes's theorem](https://en.wikipedia.org/wiki/Descartes%27s_theorem)提供帶號曲率與複數圓心方程。作者由二次式兩根導出b′＝2Σ其他b−b、(bz)′＝2Σ其他bz−bz，使用負曲率包圍圓與三個等大初始圓；相鄰反射禁止立即回頭，遞迴後還原quad，不配置每分支quad副本。R0.47、初始半徑R(2√3−3)、2×2圖樣、depth2、grout0.0015／shoulder0.003、roughness0.3／relief0.012、色盤28,68,62／236,218,170與tile0.24 m是作者設定；負曲率外圓不畫成磚。19圓×4個幾何值＋76 tone＋96² grain共74,944 B Float64 tables，另有3個JS tone數字及初始化暫存，非總RAM。取樣只讀單owner的19個圓，以預算平方半徑及肩寬倒數作C1斜邊，無逐點配置、hash、trig或sqrt；空灰縫略過grain，generic detail略過。不透明非金屬四maps、optional height與既有Worker／cache／ownership不變；這是有限圖樣與平坦倒角圓片，不是無限碎形、圓頂mesh、透明、數學分形維數或實際馬賽克施工認證。

三seed（0／7／0xffffffff）的1024²實際sampler半高raster皆為76個連通圓盤，各owner19個。由面積半徑反解平方斜邊的半高輪廓（不是直接把grout加回）後，圓盤慣性偏心率≤0.02647；最大包圍半徑超出量0.000103、三大圓半徑比例誤差≤0.0048%。每圖樣觀測42組圓間相切與12次外圓相切，每圓至少三個接觸；最負名義gap為−0.0001392，在0.0015的raster容差內。六個半徑家族符合兩輪Descartes閉式曲率，誤差≤1.695%（界限4%），中央小圓位在中心。三大圓的平均色調差≥0.2741；灰縫粗糙度差≥0.5987、AO差≥0.4751、M固定0。Seed只改色調與grain，名義幾何不變，raster讀回形心／半徑漂移≤0.00005，最大色調變化0.08843／0.08418。六channel relief-normalized observed-curvature C1 worst0.00032641<0.04，signed-UV誤差≤3.886e-16；涵蓋grid、owner邊界、觀測圓周及肩部probe與curvature refine。512像素灰縫比例0.41203、roughness差0.60009、luma範圍131.68、AO128–250、max tilt²0.88892、四方向signed fraction≥0.03075；32保留大圓色塊但小圓與肩部未解析（灰縫比例0.42969、tilt²0.029558）。15合法變體各17case通過、15故障全拒。847舊kind共142,296個channel取樣值相同；十個不重複相關kind共60組／300 buffer逐byte不變，完整gate與renderer／CSP證據見ACCEPTANCE。

`prismaticpentagonaltiles`（稜柱房形五角磁磚）新增V3.3.3.4.4對偶鑲嵌：藍灰、灰綠與象牙三色的上下交錯房形磚，有相鄰的兩個90°底角與三個120°屋頂角，不同於`cairotiles`的分隔直角、`floretpentagonaltiles`的六瓣60°尖角或`elongatedtriangulartiles`的正方／三角面。[Wikipedia Elongated triangular tiling的Prismatic pentagonal tiling段落](https://en.wikipedia.org/wiki/Elongated_triangular_tiling#Prismatic_pentagonal_tiling)提供對偶關係、三120°加二90°、cmm對稱與平行線平分拉長六角形的描述；沒有座標。作者取單位正多邊形中心連成(−1/2,−1/2)、(1/2,−1/2)、(1/2,√3/6)、(0,√3/3)、(−1/2,√3/6)房形，內切圓0.5，底邊1、側邊(3+√3)/6、屋頂邊1/√3，四個上下交錯房形組成1×(2+√3)單元，15×4單元共240面。8個位置、10個法線、240個色調與96² grain共75,792 B Float64 tables，另有三個JS tone數字，非總RAM；取樣以3×3週期owner與平方半徑0.5早拒絕，無逐點配置、hash、trig或sqrt，略過generic detail。30,58,76／224,236,222色盤、roughness0.3、relief0.012、grout0.025、shoulder0.018及tile0.6 m都是作者設定，不含真實磁磚尺寸、釉料或施工認證；不透明非金屬maps、optional height與既有Worker／cache／ownership維持不變。

三seed（0／7／0xffffffff）的768²半高raster皆得240個五角面，內縮面積誤差≤1.559%、灰縫比例誤差0.002877；沿用實際連通面boundary凸包、肩寬相關簡化與直邊擬合，不要求輸出五角。內角／邊方向誤差≤1.437°（界限6°），兩個90°角在周界上相鄰；底邊／屋頂邊比√3與側邊／屋頂邊比(1+√3)/2的誤差≤3.161%（界限6%）。週期聚類1200個角點成360個頂點：120處各四個底角、240處各三個屋頂角。三色各80面、平均色調間差≥0.3350；灰縫粗糙度差≥0.5730、AO差0.45482、無金屬，seed位置不變且最大色調變化0.09451／0.09890。六channel relief-normalized observed-curvature C1 worst0.0029721<0.04，signed-UV誤差≤4.997e-16；涵蓋grid、四列接縫、水平／垂直／屋頂線族、offset與curvature refine。512像素灰縫比例0.12879、roughness差0.57556、luma範圍148.81、AO128–250、max tilt²0.88892；32的比例0.0625與tilt²0.029558是未解析窄縫的低解析取樣，不能當真實灰縫面積。15合法變體各17case全過、15故障全拒；846舊kind的142,128個channel取樣完全相同，十相關kind的60組／300 buffer逐byte不變；完整gate與renderer／CSP證據見ACCEPTANCE。

`floretpentagonaltiles`（花形五角磁磚）新增V3.3.3.3.6手性對偶鑲嵌：森林綠、橄欖與象牙釉面五角磚，每六瓣繞一點形成花形，五個內角為60°與四個120°，兩長邊為三短邊的兩倍。不同於`cairotiles`的直角五邊形、`deltoidaltrihexagonaltiles`的四角鳶形或`snubtrihexagonaltiles`的三角／六角面。[Wikipedia Snub trihexagonal tiling的6-fold pentille段落](https://en.wikipedia.org/wiki/Snub_trihexagonal_tiling#Floret_pentagonal_tiling)提供六瓣、內角、手性、p6與對偶關係；座標與邊比為作者從相鄰正多邊形中心推導。基礎五邊形為(0,0)、(3/7,−√3/21)、(4/7,√3/21)、(1/2,√3/6)、(2/7,4√3/21)，旋轉六次、置於7×8三角點陣；內切圓半徑1/(2√7)。90個edge-plane、336個seeded tone與96² grain共77,136 B Float64 tables，另有三個JS tone數字及初始化頂點，不是總RAM。逐點3×3 owner搜尋以半徑√(1/3)剔除，無配置、hash、trig或平方根；略過通用detail。36,66,42／236,218,150色盤、roughness 0.3、relief 0.012、灰縫0.012、肩寬0.008及tile 0.84 m為作者設定；不透明非金屬四maps、可選height與既有Worker／cache／ownership不變，不含真實磁磚尺寸、釉料或施工認證。

三seed（0／7／0xffffffff）的768²半高raster皆得336個五角面（56朵各6瓣），內縮面積誤差≤0.288%、灰縫比例誤差0.000675。觀測連通面邊界的凸包，以2 px＋肩寬移除像素階梯／圓肩，再對每邊中段擬合直線、以交點讀角點；未指定角點數為五以免自證。內角與邊方向誤差≤2.970°（界限6°），2:1長短邊比誤差≤1.553%（界限6%）；每朵六瓣形心徑向誤差≤1.753%、60°間隔與手性方向誤差≤1.118°。三色各112面，色調均值間差≥0.3366，灰縫較釉面粗糙≥0.5737、AO差0.45529，M固定0；seed只變色調與grain、形心不移，最大色調變化0.09879／0.09777。六channel relief-normalized observed-curvature C1含grid／點陣線／偏移線族掃描，worst 0.0020894<0.04，signed-UV誤差≤1.469e-13。512像素灰縫比例0.16446、roughness差0.57110、luma範圍132.83、AO128–250、max tilt²0.88892；32保留色塊但不能解析窄灰縫（比例0.20313、tilt²0.029558）。15合法變體各17case全過、15故障全拒；845舊kind的141,960個channel取樣值完全相同，十個相關kind的60組／300 buffer逐byte不變。完整gate及實際renderer／CSP證據見ACCEPTANCE。

`snubtrihexagonaltiles`（扭稜三六角磁磚）新增3.3.3.3.6手性鑲嵌：靛藍正六角形、象牙側三角形與棕黃中央三角形置於粗糙灰縫，四個正三角形與一個正六角形在每個頂點相遇。不同於`trihexagonaltiles`的3.6.3.6及`snubsquaretiles`的三角形與正方形。[Wikipedia Snub trihexagonal tiling](https://en.wikipedia.org/wiki/Snub_trihexagonal_tiling)提供頂點配置、snub operation、缺少鏡射對稱與floret pentagonal對偶；讀取的文字沒有座標，因此單位三角點陣上的邊長1/√7、轉角atan(√3/5)、7×8個點與選定手性皆為作者建構。初始化列舉相鄰六角頂點的等邊三角形，每格一六角與八三角；198個面幾何、504個色調與96² grain合計79,344 B Float64 tables，另有9個JS色調數字及初始化暫存，非總RAM。取樣查詢週期3×3點陣與預算edge normals，無逐點配置、hash、trig或平方根，通用detail略過。色盤24,60,86／244,226,170、roughness 0.3、relief 0.012、灰縫0.012與肩寬0.008均為作者近似；四張不透明非金屬map、metallic 0、可選height與既有Worker／cache／ownership不變，沒有實際磁磚、釉料或施工規格認證。

三seed（0／7／0xffffffff）768²半高輪廓raster皆得504面：56六角與448三角；336頂點皆各連一六角、四三角，沒有游離角點。內縮面積誤差六角≤0.134%、三角≤0.887%，灰縫比例誤差≤0.001601。六角轉角量測誤差≤3.312°（raster角點容許4°），側三角形中心角誤差≤0.099°，點陣鄰距誤差≤0.000349；象牙336面、棕黃112面，seed只改逐面色調與grain。六channel relief-normalized observed-curvature C1含grid、點陣線與12方向偏移掃描，worst 0.0030842<0.04，signed-UV period誤差≤7.11e-15。512 map灰縫比例0.19855、粗糙度差0.57049、luma範圍156.93、AO 128–250、max tilt² 0.88892；32為0.21875、0.54052、155.07、128–250與0.029558。14合法變體各17case通過，15故障皆被拒（含鏡像手性；鏡像仍是合法鑲嵌，但違反本preset選定的手性）。灰縫0.016與9×5點陣的raster角點分類未通過，因此不列入已認證合法變體。844舊kind四seed七點共141,792個channel值完全相同；九個相關kind共54組／270個map buffer逐byte不變。完整測試與實際renderer／CSP證據見ACCEPTANCE紀錄。

`deltoidaltrihexagonaltiles`（鳶形三六角磁磚）新增作者鳶形三六角（V3.4.6.4）鑲嵌：三角點陣上每個點最近的六角胞被六條通向邊中點的輻條切成六塊鳶形，繞每個點的鳶形依序採用勃艮第紅、玫瑰與象牙釉色，所以每個點陣三角形的三塊鳶形也彼此不同；鳶形磚為斜面釉面，嵌在較粗糙的灰縫中，所有直邊落在相隔30°的六組平行線上。它不是`kisrhombilletiles`（30-60-90三角形，V4.6.12）、`trihexagonaltiles`（六邊形與三角形，3.6.3.6）、`rhombille`（每個六角三塊菱形）、其對偶`rhombitrihexagonaltiles`（3.4.6.4）或其他既有磁磚preset，且以3.4.6.4對偶、deltoidal、tetrakis／triakis／floret與prismatic pentagonal搜尋README／PLAN／DESIGN／CURRENT及preset目錄，只有`kisrhombilletiles`條目把此鑲嵌列為相關鑲嵌，沒有preset實作它。實際讀取的Wikipedia Rhombitrihexagonal tiling頁面的鳶形三六角段落（Deltoidal trihexagonal tiling重新導向到此）提供：面為鳶形、類型為對偶半正（面傳遞）鑲嵌、面配置V3.4.6.4、對稱群p6m [6,3]（*632）與旋轉群p6、對偶為菱形三六角鑲嵌、Conway稱tetrille、與三六角鑲嵌的關係是把三角形與六邊形分成中央三角形並把相鄰三角形合併成鳶形，以及面傳遞的變形（p31m）。取得的文字沒有座標、角度或邊長，所以邊長1的三角點陣建構（邊心距0.5的六角胞由通過邊中點的輻條切開，使點陣點度數為6、邊中點度數為4、點陣三角形中心度數為3）、由這些頂點度數得出的鳶形角度60°、90°、120°、90°（360°除以度數）與長短邊比√3，以及其他所有數值都是作者設定：色調0.1、0.48、0.82再加每塊至多0.12、102,34,44 / 238,228,204色盤、釉面粗糙度0.3對灰縫0.92、relief 0.012、以點陣單位的灰縫半寬0.014與斜面肩寬0.01，以及每個0.84 m UV tile含7×8點陣（7欄與4個列對，與正方形差1%，採作者設定的0.12 m點陣間距）；不主張真實磁磚尺寸、釉料或施工規格，也不複製或打包圖片。獨立kernel存336個逐鳶形色調、14個輻條分量與96² grain，共76,528 B tables，非總RAM；每點檢視九個點陣候選與最近者的六塊鳶形，所以每點無平方根、trig、hash或配置，通用detail略過，mortar即灰縫。Seed只改變逐鳶形色調與顆粒，幾何保持固定；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明或位移。

五組行為以實際sampler在三seed量測，不複製private參數：768×768 raster在半高輪廓處標記成連通的鳶形面，並由每個面的徑向延伸峰值讀出角點。每個seed有336個面（7×8＝56個點陣點各6塊），各有4個角點、面積與預測的內縮鳶形差在1.07%內（容許5%；內縮量為灰縫加半個肩寬，鳶形為切圓形所以縮成相似鳶形），灰縫比例與預測差0.00079（容許0.012）。336塊鳶形的內角皆在60°、90°、90°、120°的3.57°內（容許6°）、邊方向在30°倍數的3.58°內（容許6°）、長短邊比與√3差在4.16%內（容許10%）。56個點陣點周圍各恰有六個鳶形形心在0.5棒距內，距離一致在2.15%內（容許4%）、間隔60°誤差1.29°內（容許4°）、位在與輻條差30°的軸上誤差1.25°內（容許4°），相鄰鳶形色調類別不同、相對的鳶形類別相同。三個色調類別各112塊，類別平均相距0.343與0.375（高於0.25），灰縫比釉面粗糙0.5753（高於0.4），釉面的occlusion較亮0.4564（高於0.3），無金屬像素；seed 7與0xffffffff使每塊鳶形位置不變（形心差低於0.5 px）並使鳶形色調最多移動0.1147／0.1159（高於0.01）。三seed六channel relief-normalized observed-curvature C1含128×128 grid、點陣欄列線、沿六組相隔30°的線族通過每個點陣點（偏移0、0.25與0.5點距）的掃描及曲率refine：worst 0.0016687（上限0.04），signed-UV period誤差最大3.6e-14（上限5e-10）。512像素map的灰縫比例0.18589、灰縫減釉面粗糙度0.57038、luma範圍152.28、AO 128–250、最大tilt² 0.87957（0.1–3）、四個signed法線方向0.1108–0.1214（高於0.02）；32 px map灰縫比例0.21875、粗糙度差0.59999、luma範圍150.7、tilt² 0.029558（低於0.5）。迴歸對照接受15個合法變體（12個preset變體：鈷藍與森林綠釉色盤、釉面粗糙度0.2與0.4、relief 0.008與0.016、灰縫0.01與0.02、斜面肩寬0.006與0.014、5×3與9×5點陣，加上三個來源變體：五次方斜面ramp、較輕的逐鳶形色調變化與平移的色調階），並拒絕13個真故障（4個preset：沒有灰縫、灰縫0.12、釉面與灰縫一樣粗糙、起伏過小；9個來源：只有兩個色調、過大的六邊形邊心距0.56、輻條旋轉30度、輻條處沒有灰縫、線性折角斜面、金屬釉面、seed不影響色調、seed移動點陣、沒有列偏移的方形點陣）。兩個故障只是勉強被拒並如實記錄：過大邊心距0.56的面積偏差5.33%對界限5%，輻條處沒有灰縫的5.97%對5%；其他故障都遠超界限（例如沒有灰縫時只有8個面而非336個，折角斜面為596.9對0.04）。相容性：843個舊kind×四seed×七點（23,604個取樣、141,624次channel比較）與十個相關kind（`kisrhombilletiles`、`rhombitrihexagonaltiles`、`trihexagonaltiles`、`truncatedtrihexagonaltiles`、`snubsquaretiles`、`elongatedtriangulartiles`、`rhombille`、`hexagontiles`、`cairotiles`、`soroban`）×尺寸32／512×三seed（60組map、300個buffer）與前一版相同；舊kind的preset與tile尺寸不變。據實記錄的事件：第一版只在每個點陣點周圍交替兩種色調，使每個點陣三角形的三塊鳶形同色而看不出鳶形（在任何測試前於原型中看出），所以改為依序三種色調；第一版fixture使用了巢狀對照harness不支援的not.toBe（第一次對照在第一個合法變體就中止），所以改寫比較並重跑整個對照。

實際讀取的參考：[Wikipedia - Rhombitrihexagonal tiling](https://en.wikipedia.org/wiki/Rhombitrihexagonal_tiling)（其中的鳶形三六角鑲嵌段落，即Deltoidal trihexagonal tiling的重新導向目標：鳶形面、對偶半正面傳遞鑲嵌與面配置V3.4.6.4、p6m [6,3]（*632）對稱與旋轉群p6、菱形三六角鑲嵌的對偶、Conway的名稱tetrille、與三六角鑲嵌以中央三角形合併成鳶形的關係，以及面傳遞的變形）。取得的文字沒有座標、角度或邊長，所以點陣建構、由頂點度數得出的面角度、色盤、色調、relief、灰縫與tile尺寸是作者設定並依上文數值驗證；未讀取、複製或打包任何圖片或產品。

`soroban`（算盤）新增作者算盤磁磚：日本算盤的七棒區段，雙錐木珠位在七根類竹棒上，上下各一條框條、中間一條隔條，木珠顯示4567890，隔條上每第三根棒有一個點。它不是`seedbeads`（散落的種子珠）或其他既有preset，且以abacus、soroban、suanpan／reckoning與bicone／biconical搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何算盤preset。實際讀取的Wikipedia Soroban頁面提供結構：棒數為奇數且不少於七根（標準型十三根）、每根棒在隔條上方有一個五珠（go-dama）、下方有四個一珠（ichi-dama）、雙五進制編碼十進位（往隔條移動的木珠為有效，五珠向下、一珠向上）、每第三根的單位棒點、木珠通常為雙錐（biconal）木質、棒為木、金屬、藤或竹，以及其現代算盤圖說右側顯示1234567890、下方為一、上方為五。頁面沒有尺寸、木珠比例、顏色或框架配置，所以取自圖說末七位的4567890七棒區段、自右數第一、第四與第七根棒的點、以棒距為單位的框條0.52與隔條0.5厚、木珠槽0.78且木珠寬0.9高0.78（帶圓角赤道稜脊的雙錐輪廓，高度由邊緣0.7升至中心1.0 relief單位）、棒寬0.1、點半徑0.11、48,28,18 / 228,198,142色盤、色調（底板0.6 + 0.08×顆粒、木珠0.3–0.4、框條0.1、隔條0.16、棒0.88、點0.95）、粗糙度底板0.8與木珠0.45、relief 0.03與木珠邊緣柔度0.08皆為作者近似；不主張真實算盤尺寸、材料或教學正確性，不繪製框架側邊所以tile可重複成更長的算盤區段，也不複製或打包圖片。一個UV tile代表0.056 m（七根棒、作者設定的8 mm棒距）。獨立kernel存七個數字與128²木紋grain，共約131,128 B tables（7個Float64與16,384個Float64 grain），非總RAM；每點只處理所在的那根棒與那個木珠槽，最多七個平滑ramp，所以每點無hypot、平方根、trig、hash或配置，通用detail略過，mortar保持0。Seed只改變木紋顆粒，木珠保持固定；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明或位移。

五組行為以實際sampler在三seed量測，不複製private參數：測試依頁面重建雙五進制棒規則（每個數字0–9的上方兩槽恰一個、下方五槽恰四個有珠，且讀回後得到該數字；顯示的數字等於1234567890的末七位；七根棒共35顆木珠），在每根棒7個槽的中央讀sampler並像使用者一樣解碼（靠隔條的五珠為5、下方空槽的索引為靠隔條的一珠數），並在每根棒讀隔條上的點。每個seed都解碼出4567890與點字串1001001（自右數第1、4、7根棒）。1008×1008像素中心raster在0.6 relief單位高度標記連通的凸起木珠元件，得35顆、離預期槽中央超過0.02棒距的0顆、外框偏離名義0.9×0.78超過0.09的0顆（遮罩輪廓約在輪廓的94%），朝尖端一半處寬度為赤道寬的0.5差0.041（容許0.12，雙錐寬度減半），平均面積與菱形面積差0.08%（容許15%），赤道稜脊比肩部高0.1397 relief單位（高於0.1）且不對稱為0，兩根棒之間的一欄恰好四次穿過條門檻，位在0.52、2.08、2.58與6.48的0.033內（容許0.05）。探點堆疊：木珠減框條高度0.55、框條減棒0.25、棒減底板0.2 relief單位，點減隔條色調0.79，棒減底板色調0.235–0.244，底板減木珠色調0.236–0.245，底板減木珠粗糙度0.35，金屬違規0。Seed 7與0xffffffff在1,016,064個木珠遮罩像素翻轉0個、解碼相同數字，木紋色調最多移動0.0794／0.0781（高於0.01）。三seed六channel relief-normalized observed-curvature C1含128×128 grid、橫向、縱向與兩條對角線穿過49個木珠槽（輪廓邊緣、赤道稜脊與木珠相接的尖端）及橫越條、棒與點邊緣的掃描與曲率refine：worst三seed皆0.0000534（上限0.04），signed-UV period誤差最大8.1e-16（上限5e-10）。512像素map的拋光像素比例0.283825、底板減木珠粗糙度0.3085、luma範圍143.9、AO 217–247、最大tilt² 0.98747（0.1–3）、四個signed法線方向0.1497–0.1604（高於0.005）；32 px map維持同樣結構，比例0.277344、粗糙度差0.3131、tilt² 0.26282、方向0.21–0.29。迴歸對照接受13個合法變體（10個preset變體：較淺與較深的木色盤、底板粗糙度0.7與0.9、木珠粗糙度0.35與0.55、relief 0.02與0.04、木珠邊緣柔度0.05與0.12，加上三個來源變體：五次方ramp、較細的木紋顆粒與較大的棒點），並拒絕18個真故障（4個preset：木珠與底板一樣粗糙、底板比木珠平滑、起伏過小、木珠邊緣柔化0.6；14個來源：末位1取代0、五珠狀態反相、一珠空位鏡射、每第二根棒有點、沒有單位棒點、沒有赤道稜脊的平珠、木珠比棒距寬、方形折角木珠、框條比木珠高、沒有隔條、缺少棒、金屬木珠、seed不影響木紋、seed移動數字）。相容性：842個舊kind×四seed×七點（23,576個取樣、141,456次channel比較）與十個相關kind（`ean13label`、`embossedbraille`、`papertape`、`sevensegment`、`tactilepaving`、`dominoes`、`punchcard`、`seedbeads`、`wiremesh`、`bamboo`）×尺寸32／512×三seed（60組map、300個buffer）與前一版相同；舊kind的preset與tile尺寸不變。據實記錄的事件：第一版kernel畫出的木珠比名義尺寸小（0.842×0.737而非0.9×0.78），因為雙錐的圓角稜脊把輪廓內縮0.025，木珠尺寸檢查對35顆全部拒絕，所以kernel現在扣除該偏移並把輪廓重新縮放到名義半尺寸；第一版512／32 px檢查要求底板減木珠粗糙度差高於0.25，等於合法的底板粗糙度0.7變體的差（實測0.2418），所以放寬為0.15；另在lint指出後移除了一個未使用的helper。

實際讀取的參考：[Wikipedia - Soroban](https://en.wikipedia.org/wiki/Soroban)（源自算盤suanpan的日本算盤；棒數為奇數且不少於七根、標準型十三根；每根棒由隔條分成一個五珠與四個一珠；珠通常為雙錐木質、棒為木、金屬、藤或竹；每第三根（單位）棒的點；往隔條移動的木珠為有效的雙五進制十進位，五珠向下、一珠向上；範例8036與顯示1234567890的圖說）。頁面14,268個字元中讀取了前7,500個（到運算方法為止）；之後的現代使用段落未讀取、也未引用。頁面文字沒有尺寸、比例、顏色或框架配置，所以版面、尺寸、色盤、relief與tile尺寸是作者設定並依上文數值驗證；未讀取、複製或打包任何圖片或產品。

`ean13label`（EAN-13條碼標籤）新增作者EAN-13條碼標籤磁磚：淺色紙面上印著Wikipedia頁面範例號碼4 003994 155486的30條黑色條，起始、中央與結尾護線比其餘條長，墨比紙面略粗糙且略微凸起。它不是`papertape`（打孔ASCII孔洞）、`sevensegment`或其他既有條紋preset，且以barcode、EAN-13／EAN13、UPC、QR code與label搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何條碼preset（barcode命中是相鄰`papertape`條目裡的搜尋用字列表；label命中是無關條目）。實際讀取的Wikipedia International Article Number頁面提供結構：95個等寬區間（3個起始區間101、第一碼之後六碼的42個區間、5個中央區間01010、後六碼的42個區間、3個結尾區間101）、數字0–9的L、G、R碼（R碼是L碼的逐位元補數、G碼是R碼的位元反序，每個數字兩條黑條與兩段空白）、由第一碼決定左側六碼使用L或G的表（4為LGLLGG）、範例4 003994 155486與其OEOOEE EEEEEE奇偶，以及校驗碼規則（權重3與1交替，最後一個資料碼權重3；範例400638133393x得89而x = 1）。取得的頁面文字沒有X尺寸、空白區、條高、印刷或文字排版，所以兩側各9個區間的空白區（整張113個區間寬、方形tile）、條自上方14個區間起向下70個區間而護線再長5個區間、下方留白（原本印數字處，不繪製文字）、紙面色調0.86 + 0.08×顆粒對墨色調0.04、22,22,26 / 246,244,236色盤、粗糙度紙面0.55與墨0.8、墨比紙面高0.3 relief單位（relief 0.012）、occlusion 0.98而墨上減0.03，以及每個模組邊界兩側各0.1個區間的柔邊皆為作者近似；不主張GS1合規、掃描器可讀性、印刷品質或商品識別，也不複製或打包圖片。一個UV tile代表0.0373 m（113個區間，採作者設定的0.33 mm X尺寸）。獨立kernel存113區間bit表、113個條底值與128² grain，共132,089 B tables（113 B、113個Float64與16,384個Float64 grain），非總RAM；每點選一個模組，在邊界上最多以平滑步階混合兩個模組欄，條端再乘兩個平滑步階，所以每點無hypot、平方根、trig、hash或配置，通用detail略過，mortar保持0。Seed只改變紙面顆粒，條保持固定；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明或位移。

五組行為以實際sampler在三seed量測，不複製private參數：測試自己從頁面鍵入L、G、R碼表與第一碼結構表（檢查R碼是L碼的補數、G碼是R碼的反序、每個碼兩條黑條兩段空白、頁面範例編碼與解碼為4 003994 155486且奇偶為OEOOEE EEEEEE、400638133393的校驗碼為1、400399415548為6），再在條內三列（自上方20、50、80個區間處）讀每個區間中央的sampler，並像掃描器一樣解碼（標記、六個左碼選L或G、由L／G樣式得第一碼、六個右碼、校驗碼）。每個seed三列都讀出4003994155486、校驗碼有效、奇偶OEOOEEEEEEEE，不一致的區間0個，且在一般條下方86.5個區間的護線列上不一致0個。1130×1130像素中心raster（每區間10 px）標記成連通墨元件，得30條（參照有30個連續段：寬1區間19個、2區間4個、3區間6個、4區間1個），每條的左、右、上、下與參照差不超過0.06個區間（頂在14、一般條止於84、護線止於89），空白區與條帶外的墨像素0個，墨比例與參照0.27097相差在1%內；第一條的邊緣在模組邊界0.02個區間內穿過50%墨量，其10–90%寬度為0.1217個區間（容許0.03–0.3）。墨與紙的色調差0.8367（高於0.5）、墨粗糙度比紙面高0.2433（高於0.12）、墨高度比紙面高0.2919 relief單位（高於0.15）、金屬違規0。Seed 7與0xffffffff在1,276,900個墨遮罩像素翻轉0個、讀出相同的位元字串，紙面色調最多移動0.07846／0.07882（高於0.01）。三seed六channel relief-normalized observed-curvature C1含128×128 grid、橫越每個模組邊界、三條條端列與護線和一般條交會角的掃描及曲率refine：worst 0.00094（上限0.04），signed-UV period誤差最大1.1e-16（上限5e-10）。512像素map的墨比例0.272617（與參照差0.61%）、墨減紙粗糙度0.24202、AO 242–250、luma 31.2–230.6、最大tilt² 0.58725（0.1–3）、側向法線比例至少0.0997、上下比例至少0.002727（條端很細）；32 px map只剩稀疏混疊的墨（比例0.117188、tilt² 0.0034756，因條窄於一個像素而不斷言解碼）。迴歸對照接受11個合法變體（9個preset變體：偏藍白與牛皮紙色盤、紙面粗糙度0.4、紙面0.7搭配墨0.9、墨粗糙度0.7、relief 0.008與0.02、條邊半寬0.06與0.15，加上兩個來源變體：五次方邊緣剖面與較細的紙面顆粒），並拒絕19個真故障（4個preset：條邊半寬0.5使條碼模糊、墨與紙面一樣粗糙、墨比紙面平滑、起伏過小；15個來源：校驗碼錯誤、左組L與G對調、右組使用L碼、符號左右鏡射、缺少中央護線、護線與一般條一樣短、條過短、線性折角條邊、白條黑底反相、seed不影響顆粒、seed移動數字、金屬墨、墨壓凹、墨幾乎不比紙深、空白區只有3個區間）。相容性：841個舊kind×四seed×七點（23,548個取樣、141,288次channel比較）與十一個相關kind（`rule30`、`perfectmaze`、`sevensegment`、`ulamspiral`、`papertape`、`moorecurve`、`punchcard`、`dominoes`、`tactilepaving`、`sandpaper`、`embossedbraille`）×尺寸32／512×三seed（66組map、330個buffer）與前一版相同；舊kind的preset與tile尺寸不變。據實記錄的事件：第一版512 px檢查要求四個法線方向比例都高於0.005，但細條端只在0.2727%的像素上使法線上下傾斜，所以現在側向一對要求0.05、上下一對要求0.001；第一版32 px檢查要求墨比例高於0.1而實測0.117188過於接近，所以放寬為0.05；在模組中央解碼看不出邊緣模糊（半寬0.5仍能完全解碼），所以在設計該故障後新增無顆粒的邊緣寬度檢查；fixture初稿用了巢狀對照harness不支援的toEqual，改為比較串接字串。

實際讀取的參考：[Wikipedia - International Article Number](https://en.wikipedia.org/wiki/International_Article_Number)（含校驗碼共13碼的EAN-13組成；權重3與1交替的模10校驗碼與範例400638133393x得1、7351353x得7；95區間結構、L／G／R碼表與第一碼結構表；範例4 003994 155486）。取得的頁面文字沒有X尺寸、空白區、條高、文字位置或印刷方式，所以版面、尺寸、色盤、relief與tile尺寸是作者設定並依上文數值驗證；未讀取、複製或打包任何GS1規格或商品圖片。

`embossedbraille`（浮凸點字紙）新增作者浮凸點字紙磁磚：奶油色紙面上有7×4個點字格，光滑隆起的圓點依序拼出a到z的字母（跳過w，結尾留三個空白格），圓點比平坦紙面略光滑、略深。它不是`tactilepaving`（規則排列的截錐警示凸點）、`dominoes`（標準點數）或其他既有點狀preset，且以braille、tactile、emboss與raised dot搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何點字preset（braille命中是相鄰條目裡的搜尋用字列表；tactile與emboss命中的是無關preset）。實際讀取的Wikipedia Braille頁面（點字格由兩欄各三個的六個凸點組成，共64種圖樣含無點，位置由上到下左欄編號1到3、右欄4到6，點圖樣1-3-4是字母m；前十個字母a–j使用上方四個位置，即⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚，k–t是同樣圖樣再加第3點，即⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞，之後的u v x y z加第3與第6點，w被略過）提供點字格；頁面沒有點距、tile或渲染方式，所以7×4版面、格距2.4與行距4.2個點距（16.8×16.8點距的方形）、空白格、半徑0.3點距的圓頂與其他數值都是作者設定：每個凸點是高度剖面為(1 − s²)²（s為正規化半徑平方，邊緣斜率為零、不需平方根）的圓頂，置於格內欄位±0.5與列−1、0、1，紙面高度0.4、點頂1.0，色調0.82±0.1顆粒、點上減0.12，色盤168,152,128 / 244,236,216，粗糙度紙面0.85、點頂0.7，occlusion 0.97、點上減0.1，relief 0.03皆為作者近似；不主張任何紙張材料、點距標準、壓印工法或可讀性，也不複製或打包圖片。一個UV tile代表0.042 m（16.8個2.5 mm點距，2.5 mm為作者採用的常見點距）。獨立kernel存28格代碼表與128² grain，共131,100 B tables（grain 16,384 Float64），非總RAM；每點讀一個格代碼、選最近的點位並最多計算一個圓頂，無hypot、平方根、trig、hash或配置，通用detail略過，mortar保持0。Seed只改變紙面顆粒，凸點保持固定；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明或位移。

五組行為以實際sampler在三seed量測，不複製private參數：測試自己依頁面建出參照點字格（a–j為頁面的字面字元、k–t為其加第3點、u v x y z為a–e加第3與第6點、再加三個空白格），在28格各自的六個點位讀sampler，並把1000×1000像素中心raster（每點距59.5 px）在半粗糙度輪廓處標記成連通的圓頂元件；也檢查頁面自己的1-3-4確實是m、a–j不使用第3與第6點。每個seed解碼出abcdefghijklmnopqrstuvxyz加三個空白格，不一致的格0個、凸點80個，raster有80個圓頂元件，沒有任何一個離格網位置（欄±0.5、列−1、0、1）超過0.03點距，平均面積0.082922點距²，預測π(0.3)²(1 − √½) = 0.082814（差0.13%，測試容許5%）。圓點／紙面色調0.78089／0.86877（seed 7與0xffffffff為0.7818／0.86865與0.78288／0.86871）、粗糙度0.73969／0.84855、高度0.84125／0.40579（relief單位）、金屬違規0；seed 7與0xffffffff在1,000,000個圓點遮罩像素翻轉0個、解碼文字相同，紙面色調最多移動0.098682／0.099058（高於0.01）。三seed六channel relief-normalized observed-curvature C1含128×128 grid、兩軸每個格邊、格中心與點欄或點列偏移線與曲率refine：worst三seed皆0.00004279（上限0.04），signed-UV period誤差最大2.83e-15（上限5e-10）。512像素map的圓點比例0.022972、圓點／紙面粗糙度0.73883／0.84944、AO 222–247、luma 211.82–229.47（範圍高於12）、最大tilt² 0.70622（0.1–3）、signed方向比例0.0392–0.039742（高於0.01）；32 px map完全沒有圓點像素（圓點比例0、粗糙度處處0.84995、AO 241–247、tilt² 0.0055671低於0.5）。迴歸對照接受12個合法變體（10個preset變體：白色與牛皮紙色盤、紙面粗糙度0.75搭配圓點粗糙度0.6、紙面粗糙度0.92、圓點粗糙度0.55、紙面0.9搭配圓點0.72、relief 0.02／0.045與圓頂半徑0.25／0.34，加上兩個來源變體：較淺的圓頂occlusion與較細的紙面顆粒），並拒絕17個真故障（4個preset：圓頂半徑0.55使相鄰圓點連在一起、圓頂半徑0.08、圓點與紙面一樣粗糙、起伏過小；13個來源：m換成n、點位依列編號、列順序顛倒、欄鏡射、每行六格、格距過窄、五行、線性圓頂剖面、金屬圓點、seed不影響顆粒、seed移動字母、圓點壓凹而非凸起、圓點比紙面淺）。相容性：840個舊kind×四seed×七點（23,520個取樣、141,120次channel比較）與十個相關kind（`rule30`、`perfectmaze`、`sevensegment`、`ulamspiral`、`papertape`、`moorecurve`、`punchcard`、`dominoes`、`tactilepaving`、`sandpaper`）×尺寸32／512×三seed（60組map）與前一版逐byte相同；舊kind的preset、tile與limits不變。據實記錄的事件：32 px時每個圓點都小於一個像素而落在像素中心之間，所以32 px檢查只驗證紙面map、不斷言圓點數；圓頂遮罩取半粗糙度輪廓，所以新增凸起高度檢查以拒絕壓凹的圓點；像素圓點門檻起初是常數0.78，會把合法的紙面粗糙度0.75變體整張判成圓點，所以改由preset粗糙度配對推導；合法的紙面粗糙度0.75變體起初與預設圓點粗糙度0.7違反0.08粗糙度差契約，所以該變體同時帶圓點粗糙度0.6；最小AO界限由235改為240，因為合法的較淺occlusion變體量到235；此kernel沒有smoothstep，所以合法來源變體是較淺occlusion與較細顆粒，而非其他kind使用的五次方替換。

實際讀取的參考：[Wikipedia - Braille](https://en.wikipedia.org/wiki/Braille)（兩欄各三個的六個凸點、共64種圖樣含空白、位置左欄由上到下1–3與右欄4–6且1-3-4為m；字母a–j用上方四個位置、k–t加第3點、u v x y z加第3與第6點；頁面列出的a–t字面點字格；點字在浮凸紙上閱讀）。取得的頁面文字沒有點距、格距、tile或渲染方式，所以版面、尺度、空白格、色盤、relief與tile尺寸是作者設定並依上文數值驗證，未複製或打包任何圖片或產品。測試用的Unicode Braille Patterns編碼配置（第n點是自U+2800起偏移值的第n − 1位元）是測試的參照，並非讀自頁面。

`rule30`（Rule 30元胞自動機）新增作者Rule 30元胞自動機磁磚：33×33格的tile顯示Wolfram初等元胞自動機Rule 30從頂列中央單一黑格長出的33代（時間向下），黑格是凸起、光滑的深色方塊，白格是較低、較粗糙的淡色方塊，格間有凹陷細溝。它不是`sierpinskicarpet`、`moorecurve`、`ulamspiral`、`perfectmaze`或其他既有幾何或由數字決定的preset，且以cellular automaton、Wolfram、rule 30、cone snail與pseudorandom搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何preset（命中的只有相鄰條目裡的搜尋用字列表）。實際讀取的Wikipedia Rule 30頁面（Stephen Wolfram於1983年提出的初等元胞自動機，屬Class III、行為非週期且混沌；規則表111→0、110→0、101→0、100→1、011→1、010→1、001→1、000→0，即左 xor (中 or 右)，因二進位00011110為30而得名；從一群0中的單一狀態1出發、時間向下，常出現白色三角形，左側有明確的條紋圖樣；各代的黑格數為1、3、3、6、4、9、5、12、7、12、11、14、12、19、13、22、15、19……；芋螺Conus textile的殼上有類似圖樣）提供規則與計數；頁面沒有tile、格網大小、邊界或外觀，所以33×33格網（陣列外的格為0，因此第十六代之後會被左右邊界截斷）與所有尺度都是作者設定：每格是半尺寸0.42格、肩部0.05格的方塊（兩個平滑區間的乘積，半覆蓋輪廓寬0.79格），黑格凸起到0.9、色調0.1、粗糙度0.3，白格在0.4、色調0.7±0.08顆粒、粗糙度0.8，溝在0.3、色調0.35，色盤20,22,30 / 226,222,208，occlusion 0.97、溝內減0.3，relief 0.03皆為作者近似；不主張任何材料、尺寸規格或隨機性質，也不複製或打包圖片。一個UV tile代表0.66 m（33格、每格2 cm）。獨立kernel存1,089 byte的格表與128² grain，共132,161 B tables（grain 16,384 Float64），非總RAM；自動機只在建立sampler時執行，每點讀一個格byte並計算兩個區間，無hypot、平方根、trig、hash或配置，通用detail略過，mortar保持0。Seed只改變白格顆粒，圖樣保持固定；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明或位移。

五組行為以實際sampler在三seed量測，不複製private參數：測試依頁面印出的規則表自己長出Rule 30（頂列中央一個1、陣列外為0），在1,089格的每個格中心讀sampler，並把1000×1000像素中心raster（每格30.3 px，所以各格的像素對齊不同）標記成連通的黑格元件。每個seed的1,089格全部與獨立自動機相同（0個不一致），共445個黑格，前17代的黑格數為1、3、3、6、4、9、5、12、7、12、11、14、12、19、13、22、15，與頁面印出的完全相同（之後的世代被33欄截斷），且有402格和其鏡像不同，所以三角形不對稱（鏡像會是Rule 86）。raster有445個黑格元件落在445個不同格、沒有任何一個離格中心超過0.03格，平均面積0.62356格²，預測半覆蓋方塊為0.6241（差0.09%，測試容許3%）。黑格／非黑格色調0.10569／0.54131（seed 7與0xffffffff為0.10569／0.54113與0.10569／0.54109；非黑格平均含溝）、粗糙度0.31137／0.79596、高度0.88635／0.35437（relief單位）、金屬違規0；seed 7與0xffffffff在1,000,000個遮罩像素翻轉0個、不一致仍為0，白格色調最多移動0.078553／0.078962（高於0.01）。三seed六channel relief-normalized observed-curvature C1含128×128 grid、兩軸每個格邊、格中心與方塊邊緣偏移線、通過每格方塊角的對角線與曲率refine：worst三seed皆0.00064474（上限0.04），signed-UV period誤差最大4.44e-16（上限5e-10）。512像素map的黑格比例0.25616、黑／白格粗糙度0.31457／0.79631、AO 171–247、luma 42.221–177.78（範圍高於80、最暗低於70）、最大tilt² 0.98562（0.1–3）、signed方向比例0.13696–0.13888（高於0.01）；32 px map黑格比例0.22168、粗糙度0.33606／0.79925、AO範圍相同、luma 42.221–177.99、tilt² 0.10719（低於0.5）、signed比例0.13184–0.14063。迴歸對照接受13個合法變體（12個preset變體：藍灰與深褐色盤、白格粗糙度0.65／0.9、黑格粗糙度0.15／0.45、relief 0.02／0.045、半尺寸0.38／0.45與肩部0.03／0.08，加上一個五次smoothstep來源變體），並拒絕21個真故障（5個preset：半尺寸0.58被格邊切掉、半尺寸0.1、無色差、黑格與白格一樣粗糙、起伏過小；16個來源：Rule 90、鏡像Rule 86、補色Rule 135、鄰格位元順序顛倒、起始格偏離中央、環繞邊界、時間向上、線性邊緣、金屬黑格、seed不影響顆粒、seed移動起始格、灰色填縫混入黑格、黑格未凸起、黑白互換、31欄、方塊角有折痕）。相容性：839個舊kind×四seed×七點（23,492個取樣、140,952次channel比較）與十個相關kind（`perfectmaze`、`sevensegment`、`ulamspiral`、`papertape`、`moorecurve`、`sierpinskicarpet`、`chladnifigure`、`punchcard`、`dominoes`、`crackleglaze`）×尺寸32／512×三seed（60組map）與前一版逐byte相同；舊kind的preset、tile與limits不變。據實記錄的事件：第一版raster用每格32 px，使每個方塊都以相同的像素對齊計數（25.28 px的方塊數到26個像素中心），平均面積偏高5.15%，所以raster改為1000×1000（比值現為0.99914）並維持3%容許；質心容許由0.02放寬到0.03格（約一個像素），因為合法的肩部0.08變體量到0.0209、預設值0.0196貼著舊界限；灰色填縫故障起初被接受（luma範圍沒變），加上最暗luma檢查後也只勉強被拒絕（最暗92對90），所以最暗luma界限改為70（預設為42.221，所有合法色盤變體皆通過）；巢狀測試harness沒有toEqual，所以各代計數以串接字串比較。

實際讀取的參考：[Wikipedia - Rule 30](https://en.wikipedia.org/wiki/Rule_30)（Stephen Wolfram於1983年提出的初等元胞自動機，Class III、行為非週期且混沌；規則表與公式左 xor (中 or 右)，Wolfram代碼30＝二進位00011110；從單一黑格出發、時間沿垂直軸向下的圖樣，常見白色三角形與條紋狀的左側；鏡像、補色與鏡像補色分別是Rule 86、135與149；各代黑格數1、3、3、6、4、9、5、12、7、12、11、14、12、19、13、22、15、19）。取得的頁面文字沒有tile、格網大小、邊界或渲染方式，所以33×33格網、零邊界、方塊幾何、色盤、relief與tile尺寸是作者設定並依上文數值驗證，未複製或打包任何圖片或產品。

`perfectmaze`（種子完美迷宮）新增作者種子完美迷宮磁磚：8×8格的迷宮，通道是凹陷、深色、較光滑的溝，夾在淡色、較粗糙的凸牆之間，64格以63條連結相連，所以每格都到得了且沒有迴圈，每個seed是不同的迷宮。它不是`moorecurve`（單一確定性的封閉溝槽迴路、沒有分岔）、`braincoral`（自然迷宮狀脊線）、`guilloche`、`greekkey`、`truchettiles`、`hextruchettiles`、`circuitboard`或其他既有溝槽與磁磚類preset，且以maze、labyrinth、spanning tree與backtrack搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何迷宮preset（labyrinth命中是`braincoral`的自然脊線與`moorecurve`自己的用字）。實際讀取的Wikipedia Maze generation algorithm頁面（迷宮可視為節點是格、邊是牆位的連通圖，生成常以隨機生成樹處理，使沒有到不了的區域也沒有迴圈；隨機深度優先搜尋即遞迴回溯法，從一格出發、移到隨機的未訪問鄰格並移除兩者之間的牆、在死路回溯，得到低分岔係數與許多長通道）提供構造；8×8尺寸、由seed播種的xorshift產生器、鄰格順序（東、南、西、北）、通道幾何與所有尺度都是作者設定：每一格以一條水平帶與一條垂直帶連到有連結的鄰格，各是兩個平滑區間的乘積，半寬0.25格、肩部0.05格（所以半覆蓋的通道寬0.45格，8 cm格下為3.6 cm），帶狀區直接穿過格邊朝有連結的鄰格延伸所以格與格C1相接，地面為聯集1 − (1 − 水平)(1 − 垂直)，且沒有連結穿過tile邊界，所以每個重複的tile各有一座迷宮。地面凹進0.8牆面之下0.45；牆面色調0.8±0.1顆粒、地面0.2，色盤48,42,36 / 214,204,184，粗糙度牆面0.55、通道0.85，occlusion 0.97、通道降到0.6，relief 0.03皆為作者近似；不主張任何材料、尺寸規格或難度，也不複製或打包圖片。一個UV tile代表0.64 m（8×8格、每格8 cm）。獨立kernel存64個連結byte與128² grain，加上產生器的128個暫存byte共131,264 B tables（grain 16,384 Float64），非總RAM；深度優先搜尋只在建立sampler時執行，每點讀一個連結byte並計算四個區間，無hypot、平方根、trig、hash或配置，通用detail略過，mortar保持0。Seed改變迷宮與牆面顆粒；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明或位移。

五組行為以實際sampler在三seed量測，不複製private參數：測試像行走者一樣讀迷宮，在64個格中心與112個相鄰格共享的邊中點各讀一次sampler（讀到凹陷地面即為通），建出圖後以union-find與兩次廣度優先搜尋檢查，並把1024×1024像素中心raster（每格128 px）標記成連通的地面與牆元件。每個seed得到64個通的格中心、63條連結、0個迴圈、從(0,0)格可到達64格，且16個tile邊界中點的讀取0個為通；seed 7與0xffffffff和seed 0在112條可能連結中分別有60與54條不同，同一個seed重新建立sampler得到相同連結，深度優先特徵在seed 0／7／0xffffffff為6／8／7個分岔格、8／10／9個死路與50／47／41步的最長路徑。每個seed的raster有1個地面元件與1個牆元件，地面比例0.45614／0.45615／0.45615，預測值0.44613（由半覆蓋通道寬0.45格計算：64個中心方塊加63條臂；高出2.2%是因為聯集把內角弄圓，測試容許5%）。地面／牆色調0.21505／0.84209（seed 7與0xffffffff為0.21508／0.84253與0.21509／0.84274）、粗糙度0.84305／0.55353、occlusion 0.60858／0.96565、金屬違規0；永遠是牆的u = 0.01條帶在seed間色調最多移動0.066155／0.067177（高於0.01）。三seed六channel relief-normalized observed-curvature C1含128×128 grid、兩軸每個格邊、格中心與通道邊緣偏移線、通過每格內角的對角線與曲率refine：worst為0.00002956／0.00002861／0.00002956（上限0.04），signed-UV period誤差最大1.1e-14（上限5e-10）。512像素map的地面比例0.44834、地面／牆粗糙度0.84634／0.55474、AO 153–247、luma 74.911–188.54（範圍高於80）、最大tilt² 0.90036（0.1–3）、signed方向比例0.037117–0.045292（高於0.01）；32 px map地面比例0.49609、粗糙度0.85098／0.54902、AO與luma範圍相同、tilt² 0.086398（低於0.5）、signed比例0.22266–0.27734。迴歸對照接受13個合法變體（12個preset變體：冷灰石與暖砂岩色盤、牆面粗糙度0.4／0.6、地面粗糙度0.8／0.95、relief 0.02／0.045、半寬0.2／0.3與肩部0.03／0.07，加上一個五次smoothstep來源變體），並拒絕20個真故障（5個preset：半寬0.5使牆消失、半寬0.02使通道消失、無色差、地面與牆面一樣粗糙、起伏過小；15個來源：樹上加了迴圈、少了一條連結、通道穿過tile邊界、迷宮不受seed影響、用Prim式生長取代深度優先、線性邊緣、金屬地面、seed不影響顆粒、灰色填縫混入地面、地面未凹陷、地面比牆淺、7×7格、接點內角有折痕、通道在格邊前停住、單向連結）。相容性：838個舊kind×四seed×七點（23,464個取樣、140,784次channel比較）與十個相關kind（`sevensegment`、`ulamspiral`、`papertape`、`moorecurve`、`sierpinskicarpet`、`chladnifigure`、`punchcard`、`dominoes`、`truchettiles`、`hextruchettiles`）×尺寸32／512×三seed（60組map）與前一版逐byte相同；舊kind的preset、tile與limits不變。據實記錄的事件：第一版fixture接受了Prim式生長故障，因為深度優先的界限（分岔少於20、直徑大於20）太寬鬆，所以實測（Prim式生長在八個seed得13–21個分岔、16–24個死路、直徑16–26；深度優先在十二個seed得4–9、6–11與41–53）後收緊為分岔少於12、死路少於14、直徑大於33，這是三個seed上的統計特徵，不是演算法的證明；seed不影響顆粒的故障被接受，因為seed也會移動迷宮，所以新增永遠是牆的條帶探測；接點內角折痕故障（取兩條帶的最大值）被接受，因為沒有檢查線穿過折痕，所以新增通過每格的對角線，現已被拒絕（163.10對0.04）；地面比例容許由3%放寬到5%，因為聯集把內角弄圓使實測高2.2%；AO界限由150改為170，因為通道occlusion為0.6（153）。

實際讀取的參考：[Wikipedia - Maze generation algorithm](https://en.wikipedia.org/wiki/Maze_generation_algorithm)（迷宮是格與牆位組成的連通圖；生成是隨機生成樹，所以沒有到不了的區域也沒有迴圈；隨機深度優先搜尋即遞迴回溯法，使用堆疊並在死路回溯，分岔係數低且有許多長通道）。取得的頁面文字沒有格網大小、亂數產生器、通道幾何或渲染方式，所以8×8格網、產生器、幾何、色盤、relief與tile尺寸是作者設定並依上文數值驗證，未複製或打包任何圖片或產品。

`sevensegment`（七段顯示器）新增作者七段顯示器面板：深色、表面光滑的非金屬面板上以5×2格的數字格顯示0123456789，亮起的段是明亮的琥珀色斜角長條，未亮的段是暗淡殘影，全部凹進面層之下。它不是`chipresistors`（元件本體上以連續筆劃畫出的白色103標記）或其他既有會畫字元的preset，且以seven-segment、segment display、digit與calculator搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何preset把數字畫成線段。實際讀取的Wikipedia Segment display頁面（七段顯示器顯示數字與部分字母；各段以字母a到g稱呼，另有可選的小數點；一個byte可以表示整個狀態，常用gfedcba編碼中0x06點亮c與b段而顯示1；最常見的十進位圖樣為0 abcdef、1 bc、2 abdeg、3 abcdg、4 bcfg、5 acdfg、6 acdefg、7 abc、8 abcdefg、9 abcdfg，另有如帶尾巴的7等替代圖樣）提供數字圖樣；取得的頁面文字沒有段位置、比例或外觀，所以版面（a上、b右上、c右下、d下、e左下、f左上、g中，UV中y向下）、依閱讀順序的5×2格與所有尺度都是作者設定：每條長條的半長0.3、半寬0.06（以數字格寬為單位）、兩端45°斜角，中心在(0, ±0.8)、(±0.34, ±0.4)與(0, 0)，數字格寬1、高2.5，每條長條是四個平滑半平面遮罩（兩側與兩個斜角，沿長條方向的符號摺疊）的乘積，所以尖端保持C1。長條凹進0.6的面層之下0.1；面板色調0.05±0.02顆粒，未亮殘影加0.15、亮條加0.75，色盤14,10,10 / 255,150,40，粗糙度面板0.45、亮條0.2，occlusion 0.97、殘影減0.25，relief 0.03皆為作者近似；沒有建模或主張任何LED、LCD、發光或標準，也不複製或打包圖片。一個UV tile代表0.2 m（5×2格、每格寬4 cm高10 cm）。獨立kernel存128² grain，共131,072 B table（16,384 Float64），非總RAM；每點摺疊一個圖樣碼、略過範圍外的長條並最多計算幾個平滑遮罩，無hypot、平方根、trig、hash或配置，通用detail略過，mortar保持0。Seed只改變面板顆粒，數字保持固定；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明、發光或位移。

五組行為以實際sampler在三seed量測，不複製private參數：測試像人一樣讀顯示器，在十個數字格各自的七個段位置各讀一次sampler，把亮起的集合與頁面的數字圖樣比對，再把1000×1000像素中心raster（每格寬200 px）標記成連通的長條元件。每個seed都解碼出文字0123456789（49個亮位與21個未亮殘影位，1與8的gfedcba byte為0x06與0x7f），raster有70個長條元件落在70個不同位置，其中49個亮起並落在49個不同位置，各離位置中心不到2e-16個數字格寬，平均長條面積0.0523數字格寬²，預測的半覆蓋輪廓面積為0.052172（名義4Lw − 2w² = 0.07735扣掉半個肩部的內縮；差0.25%，測試容許3%），亮條比例0.10251，預測0.10226。亮條／面板色調0.92057／0.06464（seed 7與0xffffffff為0.9205／0.064597與0.92046／0.064662）、seed 0的殘影色調0.20083–0.21909、粗糙度0.21098／0.4488、金屬違規0；seed 7與0xffffffff在1,000,000個亮條遮罩像素翻轉0個、解碼文字相同，面板色調最多移動0.01973／0.019802（高於0.005）。三seed六channel relief-normalized observed-curvature C1含128×128 grid、兩軸每個格邊、格中心與段位置偏移的線與曲率refine：worst為0.00006008／0.00006008／0.00006104（上限0.04），signed-UV period誤差最大1.25e-16（上限5e-10）。512像素map的亮條比例0.10221、亮條／面板粗糙度0.21044／0.44977、亮條彩度0.77819（高於0.3）、AO 184–247、luma 18.552–159.96（範圍高於80）、最大tilt² 0.47296（0.1–3）、signed方向比例0.033173–0.036057（高於0.01）；32 px map亮條比例0.046875、粗糙度0.2049／0.44958、彩度0.79379、AO與luma範圍相同、tilt² 0.0026144（低於0.5）、signed比例0.023438–0.03125。迴歸對照接受15個合法變體（14個preset變體：綠色與紅色LED色盤、面板粗糙度0.35／0.55、亮條粗糙度0.1／0.3、relief 0.02／0.04、長條半長0.27／0.31、半寬0.05／0.07與肩部0.01／0.03，加上一個五次smoothstep來源變體），並拒絕23個真故障（6個preset：半寬0.3使長條連在一起、半寬0.01、半長0.45使長條相撞、無色差、亮條與面板一樣粗糙、起伏過小；17個來源：帶尾巴的替代7、沒有中間條的8、左側段互換、數字0與1互換、四欄、沒有未亮殘影、每條都亮、線性邊緣、尖端有折痕、金屬亮條、seed不影響顆粒、seed移動數字、灰色填縫混入長條、亮條不更亮、長條未凹陷、數字上下顛倒、數字長寬比錯誤）。相容性：837個舊kind×四seed×七點（23,436個取樣、140,616次channel比較）與十一個相關kind（`ulamspiral`、`papertape`、`moorecurve`、`sierpinskicarpet`、`chladnifigure`、`punchcard`、`dominoes`、`tactilepaving`、`cardboardedge`、`orbicularjasper`、`staurolite`）×尺寸32／512×三seed（66組map）與前一版逐byte相同；舊kind的preset、tile與limits不變。據實記錄的事件：第一版的尖端在兩個斜角平面都對跨過長條的偏移取絕對值，使每個尖端附近的長條軸線產生折痕，新fixture的C1 grid抓到（color在格點的worst為476.12，上限0.04），因此每條長條改成四個半平面遮罩的乘積，折痕版本保留為被拒絕的對照；第一版的面積預測用名義長條而差20.7%，因為半覆蓋輪廓在名義長條內側半個肩部，所以修正預測而非放寬容許；relief 0.01使512 px最大tilt²只有0.093（低於0.1下限），所以改為relief 0.03（0.473）；32 px時長條厚不到一個像素，亮條比例0.0469低於其他地方用的0.05下限，所以兩種尺寸的下限都改成0.02；合法的肩部0.03變體在不同seed間翻轉了1,000,000個亮條遮罩像素中的36個，因為遮罩是對帶顆粒的色調取門檻，所以遮罩現在用無顆粒的粗糙度中點，數字仍由色調解碼；另有三個對照結果需要修正：第一個半寬0.16故障被接受，因為斜角使很粗的長條仍彼此分離（合法極值，改用會讓長條連成50個元件的0.3），第一個灰色填縫故障被接受，因為luma範圍沒有改變，因此新增亮條彩度檢查（故障為0.0696、下限0.3），而relief 0.5的過大起伏故障被接受，因為法線飽和（relief 0.1時最大tilt² 0.914、0.5時1.004），所以這個kind不主張拒絕過大起伏。

實際讀取的參考：[Wikipedia - Segment display](https://en.wikipedia.org/wiki/Segment_display)（七段顯示器一節：顯示數字與部分字母；各段以字母a到g稱呼並可有小數點；一個byte可編碼完整狀態，常用編碼gfedcba與abcdefg，在gfedcba中0x06點亮c與b段顯示1；常見十進位圖樣0 abcdef、1 bc、2 abdeg、3 abcdg、4 bcfg、5 acdfg、6 acdefg、7 abc、8 abcdefg、9 abcdfg，以及如帶尾巴的7等替代圖樣）。取得的頁面文字沒有段位置、比例、tile尺寸或渲染方式，所以段版面、格子、數字順序、長條幾何、色盤、relief與tile尺寸是作者設定並依上文數值驗證，未複製或打包任何圖片或產品。

`ulamspiral`（Ulam質數螺旋）新增作者Ulam質數螺旋磁磚：15×15格的tile以正方形螺旋寫入整數1–225，1在正中央，質數所在的格以光滑深色凸圓頂標記，位於較粗糙的淡色非金屬石板上，板面在每個格邊有凹陷的格線溝。它不是`tactilepaving`（規則排列的截錐警示凸點）、`dominoes`（標準0–6凹點排列）或其他既有凸點與孔洞preset，且以ulam、prime、spiral與number theory搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何preset的圖樣來自數字（既有的spiral命中是蕨類卷芽、肉桂皮捲與蝴蝶酥等捲曲形狀）。實際讀取的Wikipedia Ulam spiral頁面（Stanisław Ulam於1963年設計、由Martin Gardner推廣；把正整數寫成正方形螺旋，最常見是1在中央，再標記質數；螺旋中的線對應二次多項式4n² + bn + c，且同一條斜線上的數全為奇數或全為偶數，所以2以外的質數都落在交替的斜線上）提供構造；取得的頁面文字沒有描述圖的方向，所以方向（2在1的右側，之後逆時針，UV中列向下延伸）、15×15尺寸與所有尺度都是作者設定：距中心偏移(x, y)的格依環r = max(|x|, |y|)從(2r + 1)²與所在邊編號，再以226項篩法標出質數（225個數中有48個）。每個被標記的格有一個半徑0.38格的圓頂，高度剖面為(1 − s²)²（s為正規化半徑，邊緣斜率為零、不需平方根），石板高度0.3、每個格邊有深0.12、半寬0.05格的溝（兩個平滑一維方盒的乘積聯集，所以格角C1相接），圓頂最高0.9，板面色調0.74±0.12顆粒、溝內減0.3、圓頂0.09，色盤30,38,58 / 234,226,206，粗糙度板面0.8、圓頂0.3，occlusion由0.97降到溝內0.65，relief 0.02皆為作者近似；不主張任何材料、標準、產品或數學認證，也不複製或打包圖片。一個UV tile代表0.375 m（15格、每格2.5 cm）。獨立kernel存226 byte篩表、225個質數旗標與128² grain，共131,523 B tables（grain 16,384 Float64），非總RAM；螺旋編號與篩法只在建立sampler時執行，每點讀一個旗標並計算兩個方盒與最多一個圓頂，無hypot、平方根、trig、hash或配置，通用detail略過，mortar保持0。Seed只改變石板顆粒，被標記的質數保持固定；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明或位移。

五組行為以實際sampler在三seed量測，不複製private參數：測試自己以逆時針正方形螺旋走訪整數1–225、逐一用試除法判斷質數，再在每個格中心讀sampler，並把1050×1050像素中心raster（每格70 px）標記成連通的圓頂元件。每個seed都恰好標記48個質數格（225格中0個不一致，2標記一次、1不標記，47個奇質數全落在x + y為偶數的交替斜線格），raster有48個圓頂元件分屬48個不同格、沒有任何一個離格中心超過0.02格，平均面積0.22776格²，預測值0.5π(0.38)² = 0.22682（差0.4%，測試容許3%；面積取剖面超過四分之一處，s < 0.7071）。圓頂／板面色調0.09／0.74523（seed 7與0xffffffff為0.09／0.74537與0.09／0.74549）、粗糙度0.3／0.78315、溝／板面高度0.18／0.3（relief單位）、occlusion 0.65／0.97，金屬違規0；seed 7與0xffffffff在1,102,500個圓頂遮罩像素中翻轉0個、標記的質數相同，板面色調最多移動0.11787／0.11904（高於0.01）。三seed六channel relief-normalized observed-curvature C1含128×128 grid、兩軸每個格邊與格中心線與曲率refine：worst為0.00003052／0.00003147／0.00003147（上限0.04），signed-UV period誤差最大7.77e-16（上限5e-10）。512像素map的圓頂比例0.080654、圓頂／板面粗糙度0.32033／0.79836、AO 166–247、luma 54.667–199.26（範圍高於80）、最大tilt² 0.34931（0.1–3）、signed方向比例0.11023–0.11036（高於0.01）；32 px map圓頂比例0.082031、粗糙度0.32997／0.79904、AO 170–247、luma 54.667–199.98、tilt² 0.034725（低於0.5）、signed比例0.044922–0.047852。迴歸對照接受13個合法變體（12個preset變體：藍灰與暖色板面色盤、板面粗糙度0.65／0.9、圓頂粗糙度0.2／0.45、relief 0.012／0.03、圓頂半徑0.33／0.42與溝半寬0.03／0.07，加上一個五次smoothstep來源變體），並拒絕23個真故障（6個preset：圓頂半徑0.9被格邊切掉、圓頂半徑0.15、無色差、圓頂與板面一樣粗糙、起伏過小與過大；17個來源：順時針螺旋、1不在中央、1被當成質數、標記合數、漏掉2、篩法不完整、13×13格、seed移動質數、線性圓頂剖面、金屬圓頂、無格線溝、格角有折痕的溝、seed不影響顆粒、灰色填縫混入圓頂、圓頂未凸起、淺色圓頂、格軸互換）。相容性：836個舊kind×四seed×七點（23,408個取樣、140,448次channel比較）與十一個相關kind（`papertape`、`moorecurve`、`sierpinskicarpet`、`chladnifigure`、`punchcard`、`dominoes`、`tactilepaving`、`cardboardedge`、`orbicularjasper`、`staurolite`、`kisrhombilletiles`）×尺寸32／512×三seed（66組map）與前一版逐byte相同；舊kind的preset、tile與limits不變。據實記錄的事件：第一版的溝取四個格邊距離的最小值，會在格角對角線產生折痕，新fixture的C1 grid抓到了它（occlusion在像素格點(0.3984, 0.3984)的worst為143.44，上限0.04），因此溝改成兩個平滑方盒的乘積聯集，折痕版本保留為被拒絕的對照；第一版relief 0.012使512 px最大tilt²只有0.162、僅略高於0.1下限，所以relief改為0.02（0.349）；通用程式對每個kind都讀取名為`roughness`的preset欄位，第一版的`slabRoughness`欄位使typecheck失敗而改名，ESLint的prefer-const對Set的指控也已修正，之後重跑了定向測試；圓頂比例下限由0.04降到0.02，因為合法的圓頂半徑0.33變體量到0.0366，而尺寸仍由獨立的面積測試固定；第一個半徑0.7故障只勉強被拒絕（面積誤差3.85%對3%），改用0.9（得44個元件而非48個）。

實際讀取的參考：[Wikipedia - Ulam spiral](https://en.wikipedia.org/wiki/Ulam_spiral)（質數的圖形化呈現，Stanisław Ulam於1963年設計、Martin Gardner在Scientific American推廣；把正整數寫成正方形螺旋並標記質數，最常見是1在中央；含大量質數的明顯斜線、水平線與垂直線對應二次多項式4n² + bn + c，且2以外的質數都落在交替的斜線上）。取得的頁面文字沒有圖的方向、tile尺寸或渲染方式，所以螺旋方向、15×15格tile、圓頂與溝的幾何、色盤、relief與tile尺寸是作者設定並依上文數值驗證，未複製或打包任何圖片或產品。

`papertape`（打孔紙帶）新增作者打孔紙帶：一吋寬、十個0.1吋字元列×九條孔軌的八軌紙帶tile，淡色非金屬紙面上以孔洞編碼ASCII文字「PAPER TAPE」，並有一列較小的導孔偏向一側邊緣，每個孔中都露出深色底襯，孔較粗糙、較深色且遮蔽較強。它不是`punchcard`（2×4張奶油色卡片與20×8矩形打孔）或其他既有穿孔、點狀preset，且以punched tape、braille、morse、barcode、QR、seven-segment、dot-matrix、ulam、cellular automaton、piano roll與music box搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何preset以圖樣編碼資料。實際讀取的Wikipedia Punched tape頁面（資料是紙帶橫列上有孔或無孔；一列較小的導孔永遠打出，略偏向一側邊緣，把紙帶分成不等寬，較窄一側放最低有效位元；常見1吋寬紙帶供六位元以上使用，孔距兩方向皆0.1吋，資料孔直徑0.072吋（1.8 mm）、導孔直徑0.046吋（1.2 mm）；其範例二進位01011010為ASCII Z）提供幾何；取得的頁面文字沒有訊息內容、孔軌分配或同位慣例，這些是自行決定：有孔為1位元，導孔列是九軌中的第4軌（距窄邊0.4個紙帶寬、距另一邊0.6），第1–3軌放位元0–2、第5–9軌放位元3–7，位元7是偶同位，所以每個字元列的資料孔數都是偶數。Kernel由「PAPER TAPE」的ASCII碼加同位位元建立每列byte，孔為半徑0.36（資料）與0.23（導孔）列距、0.05平滑肩部的圓盤（頁面的0.072與0.046吋直徑除以0.1吋孔距），紙面高度0.7、底襯0.1（落差0.6），紙帶邊緣縫線寬0.012個tile（深0.15），紙面色調0.72±0.14顆粒，色盤58,48,38 / 236,224,196，紙面粗糙度0.75、孔內0.92，occlusion由0.97降到孔內0.30，relief 0.008皆為作者近似；0.1 mm紙厚、半透明、上油或chadless紙、紙帶捲與沖孔公差沒有建模，也不主張任何標準、設備或產品，不複製或打包圖片。一個UV tile代表0.0254 m（一吋紙帶、十個字元列）。獨立kernel存10個列byte與128² grain，共131,082 B tables（grain 16,384 Float64），非總RAM；每點讀一個列byte、選最近孔軌並最多計算一個圓盤（一次平方根），無hypot、trig、hash或配置，通用detail略過，mortar保持0。Seed只改變紙纖維，打孔文字保持固定；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明或位移。

五組行為以實際sampler在三seed量測，不複製private參數：像讀帶機一樣，在十個字元列中每列的九條孔軌中心各讀一次sampler，再把1000×1000像素中心raster（每0.1吋孔距100 px）標記成連通的孔元件。每個seed都把位元列解碼成文字PAPER TAPE（位元0–6為ASCII），奇同位列數0、導孔10個（每列一個）、資料孔28個，所以raster有38個孔元件，沒有任何一個離孔軌中心超過0.02孔距，10個在第4軌、28個在其他軌。導孔平均面積0.1304孔距²、資料孔0.3512，預測值為π(R − 0.025)² = 0.13203與0.35257（差1.2%與0.4%，測試容許3%），兩者比值2.69（高於1.8），且每個導孔質心都在第4.0000軌（距窄邊0.4個紙帶寬，不在中心）。孔／紙面色調0.0993／0.7834（seed 7與0xffffffff為0.0993／0.7836與0.0993／0.784）、粗糙度0.9154／0.7507、occlusion 0.3182／0.9645，金屬違規0；第一列像素（紙帶邊緣縫線）比紙帶內的紙面列暗0.2423／0.2519／0.2543（高於0.05），孔比例0.11138，預測值0.11192（每100孔距²中28×0.35257＋10×0.13203）。Seed 7與0xffffffff在1,000,000個孔遮罩像素中翻轉0個，解碼出相同文字，紙面色調最多移動0.1393／0.138（高於0.01）。三seed六channel relief-normalized observed-curvature C1含128×128 grid、兩軸每個字元列與孔軌的邊界及中心線與曲率refine：worst為0.000041078／0.000041633／0.000042744（上限0.04），signed-UV period誤差最大1.58e-14（上限5e-10）。512像素map的孔比例0.10985、孔／紙粗糙度0.91772／0.74991、AO 76–247、luma 63.3318–199.746（範圍高於80）、最大tilt² 0.62945（0.1–3）、signed方向比例0.02205–0.03191（高於0.01）；32 px map孔比例0.10352、粗糙度0.92053／0.74965、AO與luma範圍相同、tilt² 0.011103（低於0.5）、signed比例0.09473–0.09668。迴歸對照接受15個合法變體（14個preset變體：藍色與黃色紙帶色盤、紙面粗糙度0.6／0.8、relief 0.005／0.012、資料孔半徑0.33／0.39、導孔半徑0.2／0.26、肩部0.03／0.08與邊緣縫線寬0.008／0.02，加上一個五次smoothstep來源變體），並拒絕21個真故障（7個preset：資料孔半徑0.6使相鄰孔連在一起、資料孔半徑0.15、導孔與資料孔一樣大、無色差、紙面與孔一樣光滑、起伏過小與過大；14個來源：位元順序顛倒、奇同位、不同文字、無導孔、導孔在錯誤孔軌、字元列間距錯誤、seed移動打孔內容、線性孔邊緣、金屬底襯、孔未凹陷、無紙帶邊緣縫線、seed不影響紙纖維、灰色填縫混入孔內、孔內底襯為淺色）。相容性：835個舊kind×四seed×七點（23,380個取樣、140,280次channel比較）與十一個相關kind（`moorecurve`、`sierpinskicarpet`、`chladnifigure`、`punchcard`、`cardboardedge`、`orbicularjasper`、`staurolite`、`starfish`、`halite`、`kisrhombilletiles`、`waffleweave`）×尺寸32／512×三seed（66組map）與前一版逐byte相同；舊kind的preset、tile與limits不變。據實記錄的事件：第一個合法的紙面粗糙度0.85變體使孔／紙粗糙度差只有0.0678（低於0.1下限），而且與像素檢查用來區分孔與紙的0.85門檻重合，所以改成0.8（契約是孔至少比紙粗糙0.1）；第一個資料孔半徑0.5的「故障」被接受，因為有效半徑0.475仍使孔彼此分離且可解碼，所以它是合法極值，改用0.6（相鄰孔連在一起，得25個元件而非38個）；ESLint指出新fixture中有未使用的text常數，現在它用於解碼斷言，之後重跑了定向測試。

實際讀取的參考：[Wikipedia - Punched tape](https://en.wikipedia.org/wiki/Punched_tape)（資料是紙帶橫列上有孔或無孔，一列較小的導孔永遠打出，略偏向一側邊緣並把紙帶分成不等寬，較窄一側放最低有效位元；六位元以上用1吋寬紙帶，兩方向孔距皆0.1吋，資料孔0.072吋、導孔0.046吋、厚度0.00394吋（0.100 mm）；二進位01011010為ASCII Z）。取得的頁面文字沒有訊息內容、孔軌分配、同位慣例或渲染方式，所以文字PAPER TAPE、有孔為1、圍繞導孔列的孔軌分配、位元7偶同位、色盤、relief與tile尺寸是作者設定並依上文數值驗證，未複製或打包任何圖片或產品。

`moorecurve`（Moore曲線磁磚）新增作者Moore曲線溝槽磁磚：在淡色非金屬面層的8×8格tile上，一條封閉且連續的深色溝槽穿過每一格，溝槽凹陷、較粗糙且較深色。它不是`braincoral`（自然迷宮狀脊線）、`guilloche`、`greekkey`、`truchettiles`、`hextruchettiles`、`circuitboard`或其他既有溝槽、迷宮與磁磚類preset，且以hilbert、peano、moore與space-filling搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何preset具有這種曲線（既有的meander與labyrinth命中是自然脊線與鏈條）。實際讀取的Wikipedia Moore curve頁面（連續的碎形填滿空間曲線，是Hilbert曲線的封閉版本，可視為四條Hilbert曲線讓端點重合而成）提供概念；取得的頁面文字沒有L-system規則，所以離散構造是在此自行建立並以數值檢查：4×4區塊上的二階Hilbert曲線（以迭代位元轉換由曲線索引求格子，起點為角落(0,0)、終點為(3,0)，相鄰步進）旋轉進四個象限（左下與左上逆時針、右上與右下順時針，皆在垂直中線進出），使64格形成一個漢米頓迴路，且閉合步也是相鄰步。溝槽是中央方塊與每個連結鄰格方向的臂的聯集，每一項都是平滑一維方盒的乘積（半寬0.17格、肩部0.04格，所以寬0.3格，在0.64 m名義tile、每格8 cm時為2.4 cm），聯集用1−∏(1−項)，臂直達格邊界，所以相鄰格以C1相接；沒有臂越過tile邊界，每個重複的tile各自有一條迴路。溝槽比0.7的面層凹0.45，面層色調0.70–0.80、溝槽約0.14–0.24（色盤46,42,40／228,220,202），粗糙度面層0.45、溝槽0.9，occlusion 0.96降到0.46，relief 0.015皆標示為作者近似，不宣稱材料、雕刻工法、標準或產品，也不複製或打包任何圖片。獨立kernel儲存64個連結byte、128個路徑byte與128² grain，共131,264B tables（grain為16,384個Float64），非總RAM；Hilbert轉換只在建立sampler時執行，每點讀一個連結byte並計算兩個方盒與最多四條臂，因此每點不執行hypot、平方根、三角函數、hash或配置；通用detail略過，mortar保持0。Seed只改變面層顆粒，迴路保持固定；不透明非金屬四張map、預設metallic 0、選用height、tint／repeats、Worker／cache與個別texture所有權皆不變，沒有新增網格、透明或位移。

五組行為以實際sampler在三seed量測，不複製private參數：64個格中心與相鄰格之間共享邊中點的溝槽，都直接由sampler讀取。每個seed得到64個溝槽格中心、0個越過tile邊界的溝槽連結、64個內部連結（每格恰2個連結，最小與最大度數皆2）、1024×1024週期raster中1個溝槽元件與2個面層元件（封閉迴路的內外）。由(0,0)格沿量測連結走訪，得到64個不同格並回到起點（單一漢米頓迴路），且每個對齊的2×2與4×4格區塊在環狀走訪中佔連續步（區分Hilbert系迴路與其他迴路的局部性；4×4區塊即四個象限）。量測到的連結集合對垂直中線鏡射對稱（120個連結比較全部相同），溝槽遮罩與其鏡像在0.99993／0.999931／0.999918的像素一致，溝槽面積比例0.30012／0.30012／0.30011，預測為2×0.17−0.04＝0.3（測試容許5%）。溝槽／面層色調0.1524／0.7434（seed 7與0xffffffff為0.1524／0.7431與0.1524／0.7433），粗糙度0.8908／0.4551，occlusion 0.4702／0.9543，metallic違規0；seed 7與0xffffffff只翻轉1,048,576個遮罩像素中的73與70個（grain移動0.01的高度項；測試容許0.1%），色調最多變動0.09812／0.09728（高於0.01）。三seed六channel relief-normalized observed-curvature C1含128×128 grid、兩軸每個格邊界與格中心線，並沿每軸八條線做曲率refine：worst三seed皆0.000041008（上限0.04），signed-UV period誤差最大7.77e-16（上限5e-10）。512像素map的溝槽比例0.3119、溝槽／面層粗糙度0.88389／0.45261、AO 117–245、luma 67.5616–184.405（範圍高於80）、最大tilt² 0.73464（0.1–3）、signed方向比例0.03096–0.03469（高於0.01）；32 px map溝槽比例0.5（每格四個像素中溝槽佔兩個）、粗糙度0.90196／0.45098、AO與luma範圍相同、tilt² 0.022422（低於0.5）、signed比例0.2344–0.2656。迴歸對照接受11個合法變體（10個preset變體：石灰與暖沙色盤、面層粗糙度0.3／0.6、relief 0.01／0.025、半寬0.15／0.27、肩部0.02／0.07，加上一個五次smoothstep來源變體），並拒絕20個真故障（7個preset：填滿每格的半寬0.5、抹掉溝槽的半寬0.02、肩部0.4、無色差、面層與溝槽同粗糙、起伏過小與過大；13個來源：象限方向錯誤、Hilbert開放路徑缺少閉合連結、格中心沒有臂、單向臂、線性溝槽邊緣、金屬溝槽、seed不影響grain、seed移動路徑、淺色溝槽、溝槽無occlusion、溝槽與面層同樣光滑、灰色填縫混入溝槽、溝槽未凹陷）。相容性：全部834個舊kind×四seed×七點（23,352次比較）與十一個相關kind（`sierpinskicarpet`、`chladnifigure`、`kisrhombilletiles`、`greekkey`、`truchettiles`、`hextruchettiles`、`circuitboard`、`pythagoreantiles`、`puzzletile`、`tactilepaving`、`guilloche`）×尺寸32／512×三seed（66組map）與前一版逐byte相同；舊kind的preset、tile與limits不變。據實記錄的事件：第一版是16×16格的四階迴路，但32 px時像素中心距溝槽中心線0.25格，溝槽完全消失於32 px map（比例0，低於0.1下限），因此重做成8×8格的三階迴路，每格4 px仍能擊中溝槽；粗糙度差上限由0.3降到0.25（合法的面層粗糙度0.6變體量到0.29），寬度容許由2%放寬到5%（合法半寬0.15變體差2.16%），seed遮罩比較由恰好0翻轉改為低於0.1%（grain移動70–73個邊緣像素）；第一個半寬0.05故障只勉強被拒（5.06%對5%），因此改為0.02。

實際讀取的參考：[Wikipedia - Moore curve](https://en.wikipedia.org/wiki/Moore_curve)（Moore曲線是連續的碎形填滿空間曲線，是Hilbert曲線的封閉版本，為四條端點重合的Hilbert曲線之聯集；Hausdorff維度2）。取得的頁面文字沒有L-system規則或任何格網構造，所以8×8離散迴路、象限方向、溝槽幾何、色盤與tile尺寸是作者設定並依上文數值驗證，未複製或打包任何圖片或產品。

`sierpinskicarpet`（Sierpinski地毯）新增作者Sierpinski地毯石磚：在81×81格的tile上做四層地毯遞迴，每個保留區塊的中央三分之一向下凹，得到1個27×27格、8個9×9格、64個3×3格與512個1×1格（共585個）凹方，位於淡色非金屬石面上，越大的凹方越深越暗。它不是`perforatedmetal`、`cofferedconcrete`、`splitfaceblock`、`breezeblock`、`tactilepaving`或其他既有點蝕、嵌板或磁磚類preset，且以sierpinski、fractal、menger、cantor與space-filling搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何preset具有這種遞迴圖樣。實際讀取的Wikipedia頁面（Sierpiński carpet：正方形分成3×3共9個全等子方形、移除中央一格，並對剩下8格遞迴套用；等價於單位正方形中以三進位表示的座標在同一位置沒有同時出現數字1的點，極限面積為零、Hausdorff維度log 8／log 3≈1.8928）提供構造規則。這個材質是有限四層近似，不是極限集合：4,096＝8⁴個保留格與2,465＝81²−8⁴個凹陷格，名義凹陷比例1−(8/9)⁴≈0.3757。每個凹方是兩個平滑一維方盒的乘積，每側內縮0.04格並有0.14格肩部，因此邊緣為C1且不需smooth minimum，tile邊界格從不凹陷，所以tile可無縫重複。凹方底部的相對高度為0.1、0.17、0.24與0.31（對面層0.7，越大越深），底部色調0.14–0.32（面層0.58–0.70），粗糙度面層0.55、凹方0.88，occlusion由0.96降到0.46，色盤62,52,44／218,200,168、相對UV起伏0.02與0.81 m名義tile（1 cm格）皆標示為作者近似，不宣稱石種、雕刻工法、尺寸標準或產品，也不複製或打包任何圖片。獨立kernel儲存128² grain，共16,384個Float64／131,072B table，非總RAM，另有四項常數；每點最多測試四層並以三進位數字迴圈判斷，只對保留區塊計算兩個smooth方盒，每點不執行hypot、平方根、三角函數、hash或配置；通用detail略過，mortar保持0所以不混入灰色填縫。Seed只改變石面顆粒與色調，凹方配置保持固定；不透明非金屬四張map、預設metallic 0、選用height、tint／repeats、Worker／cache與個別texture所有權皆不變，沒有新增網格、透明或位移。

五組行為以實際sampler在三seed量測，不複製private參數：729×729 raster（每格9 px）以相對高度0.45二值化，做含週期環繞的4連通flood fill。每個seed都恰得到585個凹方元件，四個層級各為1、8、64與512個（以獨立的三進位數字規則在每個元件質心分類，0個錯置），平均面積717.05、77.049、7.716與0.60494格²，預測為717.168、77.088、7.728與0.608（差在0.5%內；測試對三個大層級容許5%，對只有7–8 px寬的一格凹方容許20%）。以同一數字規則比對全部81×81＝6,561個格中心，得2,465個凹陷格與0個錯誤格，凹陷面積比例0.32571（距預測總和0.1%；測試容許6%），表面為1個連通塊，從最大到最小的凹方平均底部高度0.1<0.17<0.24<0.31<0.45遞增。凹方／面層色調seed 0為0.2273／0.6387（seed 7與0xffffffff為0.2275／0.6396與0.2271／0.6389），粗糙度0.8788／0.5508，occlusion 0.4618／0.9588，metallic違規0；seed 7與0xffffffff翻轉0個遮罩像素，像素色調最多變動0.117／0.119（高於0.01）。三seed六channel relief-normalized observed-curvature C1含128×128 grid、兩軸九等分線（tile接縫與凹方邊緣）並沿每軸八條線做曲率refine：worst三seed皆0.00020539（上限0.04），signed-UV period誤差4.69e-14（上限5e-10）。512像素map的凹方比例0.32199、凹方／面層粗糙度0.87508／0.55272、AO 117–245、luma 74.4722–157.384（範圍高於60）、最大tilt² 0.94195（0.1–3）、signed方向比例0.04663–0.04666（高於0.01）；32 px map凹方比例0.29297、粗糙度0.87843／0.55036、AO與luma範圍相同、tilt² 0.067943（低於0.5）、signed比例0.1563，所以32只保留較粗的層級。迴歸對照接受11個合法變體（10個preset變體：藍石板與赤陶色盤、面層粗糙度0.45／0.65、relief 0.012／0.03、肩部0.08／0.2、內縮0.02／0.07，加上一個五次smoothstep來源變體），並拒絕19個真故障（6個preset：內縮0.45抹掉一格凹方、肩部0.9、無色差、面層與凹方同粗糙、起伏過小與過大；13個來源：任一位置數字為1即凹陷、缺少最細層級、凹方出現在已移除區塊內、凹方中心偏移、各層同深度、線性凹方邊緣、金屬凹方、淺色凹方底、seed移動配置、seed不影響grain、凹方無occlusion、凹方與面層同樣光滑、灰色填縫混入凹方）。相容性：全部833個舊kind×四seed×七點（23,324次比較）與十一個相關kind（`chladnifigure`、`kisrhombilletiles`、`perforatedmetal`、`sandstone`、`limestone`、`cofferedconcrete`、`splitfaceblock`、`breezeblock`、`tactilepaving`、`diamondplate`、`honeycomb`）×尺寸32／512×三seed（66組map）與前一版逐byte相同；舊kind的preset、tile與limits不變。據實記錄的事件：第一次控制執行中，合法的肩部0.08變體未通過5%面積上限，因為每格9 px時一格凹方只有7–8 px寬（約14%量化誤差），所以fixture對該層級改容許20%、總面積改容許6%（放寬fixture並保留該變體）；第一個內縮0.3故障只勉強被拒（5.6%對5%），所以改成直接抹掉一格凹方的內縮0.45。

實際讀取的參考：[Wikipedia - Sierpiński carpet](https://en.wikipedia.org/wiki/Sierpi%C5%84ski_carpet)（3×3分割並遞迴移除中央子方形、三進位數字特徵、極限面積為零與Hausdorff維度log 8／log 3）。該頁沒有tile尺寸、凹深、色盤或表面響應；這些是作者設定並依上文數值驗證，未複製或打包任何圖片或產品磁磚。

`chladnifigure`（Chladni圖形）新增作者Chladni圖形表面：在深色、較光滑的非金屬板上，淡色細沙沿著駐波圖樣的節線聚集，沙略高於板面且比板面粗糙。它不是`sanddune`、`pebblebeach`、`sandstone`、`perforatedmetal`或其他既有沙、石與板類preset，且以chladni與cymatic搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何preset具有這種圖樣（Fibonacci／phyllotaxis、sierpinski、hilbert等數學圖樣搜尋同樣為空）。實際讀取的Wikipedia頁面（要求的Chladni figure網址回傳標題為Ernst Chladni的頁面，其Chladni figures章節說明共振的板或膜被分成振動方向相反的區域，以沒有振動的節線為界，且Chladni用弓拉薄薄覆沙的金屬片，沙會集中在表面靜止的節線上）只提供物理概念。該頁沒有公式，所以節函數是作者的理想化，並非任何實體板的模型：f(u,v)＝cos(aπu)cos(bπv)−cos(bπu)cos(aπv)，a＝5、b＝9；同奇偶的模態使f(u+1,v)＝±f且f(u,v+1)＝±f，因此零集與UV tile精確重複（奇偶不同會破壞接縫），u與v對調使f變號，u→1−u或v→1−v只翻轉符號，所以圖樣對兩軸與對角線鏡射。沙寬使用到零集的一階距離|f|／√(|∇f|²＋3²)，而非對f設門檻，因此線寬均勻，只有交叉點會稍微堆高；沙覆蓋率為smooth(1−distance／(0.012×(0.75＋0.5×grain)))，grain為seed決定的週期128²雜訊，使沙緣粗糙度在寬度±25%內變動（一條線約為tile的0.012，在0.6 m名義tile約7 mm），沙高出板面約0.5個relief，粗糙度由板面0.34升到沙0.93，occlusion由0.97降到0.72，色盤26,29,34／232,220,194使板面很深（約0.12–0.15）、沙很淡（0.82–0.95）。模態數、寬度、梯度下限3、relief 0.01與粗糙度皆為作者設定；不宣稱邊界條件、材料、激振、沙粒物理或任何產品，也不複製或打包任何圖片。獨立kernel儲存128² grain，共16,384個Float64／131,072B table，非總RAM，每點計算四個cos、四個sin與一個平方根，沒有hash或配置；通用detail略過。它寫入mortar 0，因為非零值會把灰色填縫色混進板面。Seed只改變沙粒（沙緣粗糙度與色調），節線保持固定；不透明非金屬四張map、預設metallic 0、選用height、tint／repeats、Worker／cache與個別texture所有權皆不變，沒有新增網格、透明或位移。

五組行為以實際sampler在三seed量測，不複製private參數，並在測試中由preset的模態數、寬度與梯度下限獨立計算解析節線距離：1024×1024像素中心上，距離節線小於0.3寬度的像素全部是沙（height／relief高於0.37），大於0.7寬度的像素全部是板面，三seed違規皆為0。沙面積比例為0.15424／0.15398／0.15377，介於解析比例0.10216（距離小於0.34寬度）與0.1983（小於0.68寬度）之間；沙形成5個連通塊（週期4連通，兩個門檻的解析計數皆為5），板面分成20個區域（節域，兩個門檻皆為20）。沙像素跨u→1−u、v→1−v與u／v對角線的鏡射一致率，seed 0為0.9372／0.9378／0.937、seed 7為0.9369／0.9353／0.9345、seed 0xffffffff為0.9342／0.9348／0.9341（高於0.88；因grain會移動沙緣而不是精確相等）。沙平均色調0.7429對板面0.1558（差高於0.5）、粗糙度0.8165對0.3565（差高於0.3）、occlusion 0.7681對0.963（差高於0.15）、metallic違規0；seed 7與0xffffffff分別翻轉1.96%與2.00%的遮罩像素（低於3%，僅沙緣像素），個別像素色調最多變動0.3655／0.3576（高於0.01）。三seed六channel relief-normalized observed-curvature C1含128×128 grid、u與v＝0、0.25、0.5、0.75、1的線（tile接縫與u＝0.5節線）並沿每軸八條線做曲率refine：worst為0.00064948／0.00064282／0.00053402（低於0.04），signed-UV period誤差最大1.39e-16（低於5e-10）。512像素map的沙比例0.15984、沙／板面粗糙度0.80913／0.35554、AO 184–247、luma 51.8596–210.606（範圍高於100）、最大tilt² 0.52795（0.1–3）、signed方向比例0.1222–0.1233（高於0.01）；32 px map的沙比例0.15625、粗糙度0.82782／0.35263、AO 184–247、luma範圍相同、tilt² 0.016271（低於0.5），所以32仍保留粗略圖形。迴歸對照接受13個合法變體（12個preset變體：冷鋼與暖銅板色盤、板面粗糙度0.25／0.45、relief 0.007／0.014、寬度0.009／0.016、梯度下限2／4、模態組3／7與4／8，加上一個五次smoothstep來源變體），並拒絕21個真故障（9個preset：0.06寬線、0.0004次像素線、梯度下限40、無色差、板面與沙同粗糙、起伏過小與過大、奇偶不同的模態4／9、相同模態5／5；12個來源：對f而非距離設門檻、錯誤梯度符號、seed移動節線、沙未抬高、金屬沙、板面太亮、沙與板面同樣光滑、seed不影響grain、灰色填縫混入板面、線性沙剖面、沒有沙occlusion、非等向距離）。相容性：全部832個舊kind×四seed×七點（23,296次比較）與十二個相關kind（`kisrhombilletiles`、`truncatedtrihexagonaltiles`、`trihexagonaltiles`、`rhombille`、`sandstone`、`pebblebeach`、`cobblestone`、`gongsurface`、`drumskin`、`sanddune`、`perforatedmetal`、`diamondplate`）×尺寸32／512×三seed（72組map）與前一版逐byte相同；舊kind的preset、tile與limits不變。據實記錄的事件：第一版原型寫入mortar＝1−sand，把灰色填縫色（153,153,139）混進板面，我在預覽圖看到後於整合前修正；第一版fixture門檻是以原型量測再放寬到觀察值加餘裕（色差0.6→0.5、沙色調0.75→0.6、粗糙度差0.5→0.3，因為合法的板面粗糙度0.45變體未通過0.4上限）；第一個0.0015寬度的髮絲故障被接受（1.5 px線在1024仍可解析），所以改為0.0004次像素故障。

實際讀取的參考：[Wikipedia - Ernst Chladni](https://en.wikipedia.org/wiki/Ernst_Chladni)（要求的Chladni figure網址回傳此頁；其Chladni figures章節說明節線與沙集中於節線）。該頁沒有公式、模態數、板尺寸或沙模型；這些是作者設定並依上文數值驗證，未複製或打包任何圖片或產品。

`kisrhombilletiles`（Kisrhombille磁磚）新增作者V4.6.12 kisrhombille釉面鑲嵌近似：三角晶格上的每個六邊形被六條通往角點與六條通往邊中點的輻線切成十二個全等的30-60-90直角三角形，深青色與奶油色三角形繞每個六邊形中心交替，因此每條直邊都落在相隔30°的六組平行線之一；每個面都有窄斜邊並被較粗糙的灰色填縫圍出。它不是`rhombille`（每個六邊形三個菱形）、`trihexagonaltiles`（六邊形與三角形，3.6.3.6）、`righttriangletiles`（分割正方形中的等腰直角三角形）、其對偶`truncatedtrihexagonaltiles`（4.6.12）或其他既有磁磚preset，且以kisrhombille、30-60-90、deltoidal、tetrakis、triakis、floret與prismatic pentagon搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何preset具有這種鑲嵌（唯一的floret命中是無關的花椰菜小花）。實際讀取的Wikipedia頁面（要求的Kisrhombille tiling網址回傳標題為Truncated trihexagonal tiling的頁面，其Kisrhombille tiling章節說明該鑲嵌由全等30-60-90三角形構成、每個頂點交會4、6或12個三角形，可視為正六邊形鑲嵌且每個六邊形由中心分成12個三角形，或視為二等分的三角鑲嵌，或六組平行線的無限排列，標記為V4.6.12，三角形是p6m [6,3]對稱的基本域）提供拓樸。幾何是推導並以數值檢查，不是抄自來源：六邊形邊長為1時，六邊形內切半徑為√3/2，六邊形中心位於間距√3≈1.73205的三角晶格，每個三角形斜邊為1（通往角點的輻線）、長股√3/2、短股1/2（面積√3/8≈0.21651），六邊形面積3√3/2≈2.59808，並以30萬點sampler檢查12個扇形：磁磚占比0.72137，與由內縮30-60-90幾何推得的0.72205相符。每個UV tile為7欄×4雙列（56個六邊形＝672個三角形，超晶格比高度寬1.04%並被拉到正方形UV tile，沿用既有7×8六角磁磚preset的近正方形慣例）、填縫每側0.02、肩部0.015、青綠／奶油色盤（28,70,84／236,226,200）、釉面粗糙度0.3、填縫粗糙度0.92、相對UV起伏0.012與1.2 m名義tile（六邊形邊長約0.1 m）皆標示為作者近似，不宣稱磁磚厚度、釉料化學、填縫材料、尺寸規格或產品。獨立kernel儲存26個輻線cos／sin值、672個三角形色調與96² grain，共9,914個Float64／79,312B tables，非總RAM；每點在九個晶格節點中選最近者，再以兩條輻線半平面檢查12個扇形，只對通過者計算六邊形邊半平面與三個smooth邊，因此每點不執行hypot、平方根、三角函數、hash或配置；通用detail略過。每個面是以填縫內縮的三個smooth半平面乘積，相鄰支撐不重疊，轉角不需smooth minimum。Seed只改變三角形色調（深青0.11–0.24、奶油0.80–0.92）與細顆粒，晶格保持固定；色調索引含傾斜週期的晶格位移，但所有接縫都落在填縫上，因此該索引無法觀察。不透明非金屬四張map、預設metallic 0、選用height、tint／repeats、Worker／cache與個別texture所有權皆不變，沒有新增網格、透明或位移。

五組行為以實際sampler在三seed量測，不複製private參數：768×768 raster（每單位邊長約63.67 px）以相對起伏高度0.41二值化，做含週期環繞與8連通的flood fill，並以720條射線的徑向角點數分類每塊磁磚。每個seed都得到672塊磁磚（12×56個晶格節點），每一塊恰有三個角點；面積為0.1512–0.1626邊長²（由preset推得的內縮預測0.15632，皆在5%內），填縫比例0.27946，預測0.27800（差在0.012內）。三個偵測角點間的內角為26.23–31.10°、58.07–63.90°與87.71–92.62°（30°、60°、90°各在5°內），所以每塊都是30-60-90直角三角形。56個晶格節點（取自公開preset晶格）每個周圍恰有12個三角形質心落在0.85邊長內，半徑0.6036–0.6342（與節點平均相差至多2.53%，低於4%），相鄰角間距27.43–32.78°（因鏡射對稱約28°與32°交替，介於24–36°，相鄰兩間距和為60°並在3°內），質心方向與推得的15.9°／44.1°（模60°）相差至多1.265°（低於4°），且顏色繞節點深淺交替。每個seed深色三角形336塊，色調0.1127–0.2413（平均0.1742–0.1762，低於0.3），淺色三角形336塊，色調0.7987–0.9246（平均0.8625–0.8643，高於0.7）；填縫粗糙度0.89307對磁磚0.32552–0.32567（差高於0.4），AO 0.5214對0.9715（差高於0.3），metallic違規0；seed 7／0xffffffff以最近質心配對不移動任何三角形質心（0 px，低於0.5），色調最多變動0.1127／0.1156（高於0.01）。三seed六channel relief-normalized observed-curvature C1含128×128 grid、欄與節點列邊界線，並沿每軸八條線做曲率refine：worst三seed皆0.0017941（上限0.04），signed-UV週期誤差最大1.84e-13（上限5e-10）。512像素map的填縫比例0.2695（0.02–0.4）、填縫／磁磚粗糙度0.89975／0.326、AO 128–250、luma 78.8558–215.5428（範圍高於80）、最大tilt² 0.87957（0.1–3）、signed方向比例0.1642–0.1787（高於0.02）；32 px map填縫比例0.375（0.02–0.6，因為三角形只有幾個像素寬）、粗糙度0.80159／0.31516、AO 128–250、luma 79.7836–214.8276、tilt² 0.02956（低於0.5），所以32只保留巨觀星形圖樣。迴歸對照接受11個合法變體（10個preset變體：色盤、釉面粗糙度0.22／0.42、relief 0.009／0.016、填縫0.015／0.025、肩部0.01／0.02，加上一個五次smoothstep來源變體），並拒絕20個真故障（9個preset：0.1填縫吞掉三角形、0.002填縫、0.09肩部、無色差、釉面與填縫同粗糙、起伏過小與過大、5欄與3列拉伸晶格；11個來源：六邊形旋轉偏離晶格、錯誤晶格間距、線性邊緣肩部、金屬磁磚、所有三角形同色調、色調依六邊形而非三角形交替、填縫與釉面同樣平滑、seed移動晶格、seed不影響色調、缺少六邊形邊半平面、所有六邊形邊朝同一方向）。相容性：全部831個舊kind×四seed×七點（23,268次比較）與十一個相關磁磚kind（`truncatedtrihexagonaltiles`、`snubsquaretiles`、`rhombitrihexagonaltiles`、`elongatedtriangulartiles`、`trihexagonaltiles`、`dodecagontiles`、`cairotiles`、`righttriangletiles`、`rhombille`、`octagondot`、`windmillpavers`）×尺寸32／512×三seed（66組map）與前一版逐byte相同；舊kind的preset、tile與limits不變。據實記錄的事件：第一次fixture執行未通過自己的size 32填縫比例上限（0.375對0.3），因此上限改為32用0.6、512用0.4，並把超過舊512上限（0.3776）的合法填縫0.03變體換成0.025（0.03變體本身未以最終上限重跑）；4連通標記在星形中心切出128個單像素尖端碎片（0.0002邊長²），所以改用8連通；等半徑平台讓填縫0.03時112個三角形被讀成四角，所以角點峰值改為同值取第一條射線；以索引配對seed在填縫0.015時錯位（光柵順序標記互換造成18.95 px），所以改以最近質心配對三角形；「列環繞缺少晶格位移」故障被fixture接受，因為色調表環繞落在輻線與六邊形邊的填縫上、無法觀察，所以不計為對照。

實際讀取的參考：[Wikipedia - Truncated trihexagonal tiling](https://en.wikipedia.org/wiki/Truncated_trihexagonal_tiling)（要求的Kisrhombille tiling網址回傳此頁；其Kisrhombille tiling章節提供全等30-60-90三角形、每個頂點4／6／12個三角形、每個六邊形十二個三角形、六組平行線、V4.6.12標記與p6m基本域）。該頁沒有晶格間距、朝向、色盤或磁磚尺寸；這些是自行推導並依上文數值驗證，未複製或打包任何圖片、產品磁磚或標準。

`truncatedtrihexagonaltiles`（截角三六角磁磚）新增作者4.6.12截角三六角（truncated trihexagonal）釉面鑲嵌近似：大型奶油色正十二邊形位於三角晶格，每條晶格邊上有一個旋轉到三個相差60°方向之一的靛藍小正方形，每個晶格三角形中心有一個薰衣草色正六邊形，因此每個頂點交會一個正方形、一個六邊形與一個十二邊形；每個面都有窄斜邊並被較粗糙的灰色填縫圍出。它不是`dodecagontiles`（標準3.12.12）、`trihexagonaltiles`（3.6.3.6）、`rhombitrihexagonaltiles`（3.4.6.4）或其他既有磁磚preset，且以truncated trihexagonal與4.6.12搜尋README／PLAN／DESIGN／CURRENT／TECHNICAL與preset目錄，沒有任何preset具有這種頂點類型。實際讀取Wikipedia Truncated trihexagonal tiling頁面（八種半正則鑲嵌之一，每個頂點一個正方形、一個六邊形與一個十二邊形，Schläfli符號tr{3,6}；該名稱容易誤導，因為三六角鑲嵌的真正截角會得到矩形，且六邊形與十二邊形無法同時是正多邊形；只有一種均勻著色，對偶為kisrhombille鑲嵌V4.6.12）取得拓樸；取得的頁面其別名清單是空的，所以「great rhombitrihexagonal」只是常見別名，並非取自該頁。幾何則是推導並以數值檢查，不是抄自來源：單位邊長時十二邊形的內切半徑是(2 + √3)/2，十二邊形中心位於間距3 + √3 ≈ 4.73205的三角晶格（兩個內切半徑加一個正方形邊長），每條晶格邊的中點有一個正方形，其沿晶格邊的兩側面向十二邊形、橫跨晶格邊的兩側面向六邊形，每個晶格三角形的形心有一個六邊形，其邊交替面向正方形與十二邊形，一格為1個十二邊形＋3個正方形＋2個六邊形、面積(3 + √3)²√3/2 ≈ 19.3923，7×4超晶格內30萬個隨機點在±1與±2兩種節點鄰域下都恰好落在一個多邊形內（無空隙、無重疊）。每個UV tile 7欄×4雙列（56個十二邊形＋168個正方形＋112個六邊形；此超晶格比高度寬1.04%並被拉到正方形UV tile上，與既有7×8的六角磁磚preset相同的近正方形慣例）、每側0.03的填縫（總寬0.06邊長）、0.02肩部、靛藍／奶油色盤（40,40,86／242,230,206）、釉面粗糙度0.3、填縫粗糙度0.92、UV相對起伏0.012與1.6 m名目tile（邊長約0.0483 m）皆為作者近似，不宣稱磁磚厚度、釉料化學、填縫材料、尺寸規格或產品。獨立kernel只有12個多邊形中心值、144個邊法線值、336個磁磚色調與96²顆粒，共9,708個Float64／77,664 B表格（不是總RAM），另有三個六項常數；每點測試3×3個晶格節點鄰域×6個多邊形（54次圓外接半徑平方檢查），只對可能包含該點的多邊形逐邊計算一個smooth半平面，因此每點沒有hypot、平方根、三角函數、hash或配置，並略過通用detail。每個面是以填縫內縮的smooth半平面乘積，所以相鄰磁磚的支撐不會重疊，角落也不需要smooth minimum；色調索引以傾斜週期的晶格位移在超晶格上環繞。Seed只改變磁磚色調（十二邊形0.82–0.94、六邊形0.3–0.4、正方形0.08–0.18）與細顆粒，晶格固定；不透明非金屬四張map、預設metallic 0、可選height、tint／repeats、Worker／cache與逐張texture所有權不變，不新增mesh、透明或位移。

五組行為以實際sampler在三seed量測，不複製private參數：1344×1344 raster（每單位邊長約40.78 px）以相對起伏高度0.41二值化，做含週期環繞的flood fill，並以720條射線的徑向角點數分類每塊磁磚。每個seed都得到336塊磁磚，恰有56個十二角十二邊形、168個四角正方形與112個六角六邊形（每晶格1：3：2），沒有其他形狀；面積為十二邊形10.72邊長²（由preset推得的內縮預測10.721）、六邊形2.371（2.3637）、正方形0.8465–0.8681（0.8464），全部在5%內，填縫比例0.07044對預測0.07244（差距小於0.012）。正方形有三種朝向各56個，角點角度16°、45°與74.5°（距15°／45°／75°小於5°）；十二邊形角點在16°（距15°小於5°），六邊形角點在0.5°（距60°的倍數小於5°），每個十二邊形最近的六個十二邊形在4.732邊長處（間距4.7321，誤差小於3%）。以穿過每條磁磚邊中點的射線探測鄰接，56個十二邊形的12個鄰居都交替為正方形與六邊形，112個六邊形的邊都交替接觸正方形與十二邊形，168個正方形的邊都交替接觸十二邊形與六邊形——這是4.6.12的接觸關係，而不是單純數頂點。十二邊形色調0.8279–0.9463、六邊形0.3079–0.4088、正方形0.09059–0.193（平均差0.5269–0.5346與0.2147–0.2223，分別大於0.4與0.1），填縫粗糙度0.9014對磁磚0.3168–0.317（差大於0.4），AO 0.5147對0.9785（差大於0.3），metallic違規0；seed 7與0xffffffff的磁磚質心位移0 px（小於0.5），磁磚色調最多變動0.1024／0.1061（大於0.01）。三seed六通道以起伏正規化的observed-curvature C1含128×128格點、欄與節點列邊界線，以及每軸八條線上的曲率細化；三個seed最壞值皆為0.0054501（小於0.04），帶號UV週期誤差最大7.2e-16（小於5e-10）。512像素map的填縫比例0.07071（0.02–0.3）、填縫／磁磚粗糙度0.89191／0.31898、AO 128–250、亮度58.1728–222.1072（範圍大於80）、最大tilt² 0.88043（0.1–3），帶號方向比例0.062–0.0732（大於0.02）；32 px map的填縫比例0.15625、粗糙度0.92157／0.31544、AO 128–250、亮度59.1006–221.8224、tilt² 0.02956（小於0.5），因此32只保留巨觀鑲嵌。迴歸對照接受11個合法變體（10個preset變體涵蓋色盤、釉面粗糙度0.22／0.42、起伏、填縫0.02／0.045與肩部0.012／0.03，另有一個五次smoothstep來源變體），並拒絕19個真實錯誤（7個preset錯誤：會抹掉正方形的0.5填縫、0.3肩部、無色差、釉面與填縫同樣粗糙、起伏過小或過大、5欄拉伸晶格；12個來源錯誤：沒有六邊形、沒有向下六邊形、沒有正方形、所有正方形同向、錯誤晶格間距、列環繞缺少晶格位移、線性邊緣肩部、金屬磁磚、正方形與十二邊形同樣淺、填縫與釉面同樣平滑、seed移動晶格、seed不影響色調）。相容性：全部830個舊kind×四個seed×七個取樣點（23,240次比較）及十個相關磁磚kind（`snubsquaretiles`、`rhombitrihexagonaltiles`、`elongatedtriangulartiles`、`trihexagonaltiles`、`dodecagontiles`、`cairotiles`、`righttriangletiles`、`rhombille`、`octagondot`、`windmillpavers`）×尺寸32／512×三個seed（60組map）與前一版逐byte相同；舊kind的preset、tile與limits不變，五份程式清單保持唯一且舊順序不變。誠實記錄事件：這個kind一開始以`greatrhombitrihexagonaltiles`整合，但實際讀取的頁面標題是Truncated trihexagonal tiling且其別名清單為空，所以提交前我還原了自己尚未提交的功能修改並以可驗證的名稱重做，fixture與11／19迴歸對照重跑後結果相同。

實際讀取的參考：[Wikipedia - Truncated trihexagonal tiling](https://en.wikipedia.org/wiki/Truncated_trihexagonal_tiling)（八種半正則鑲嵌之一，每個頂點一個正方形、一個六邊形與一個十二邊形，Schläfli符號tr{3,6}，只有一種均勻著色，對偶為kisrhombille鑲嵌V4.6.12）。該頁沒有提供晶格間距、朝向或磁磚尺寸；這些如上所述由推導並以數值驗證，且不複製或打包任何圖片、產品磁磚或標準。

`elongatedtriangulartiles`（長三角磁磚）新增作者3.3.3.4.4長三角（elongated triangular）釉面鑲嵌近似：赤陶色的單位邊長正方形排成直立列，與奶油色朝上／朝下正三角形列交替，相鄰的正方形列錯開半個邊長，每個頂點交會三個三角形與兩個並排的正方形；每個面都有窄斜邊並被較粗糙的灰色填縫圍出。它與`snubsquaretiles`的頂點含三個三角形與兩個正方形相同但順序不同（那裡的正方形旋轉±15°且不共邊，這裡的正方形直立並在列內共用垂直邊），也不是既有六邊形加三角形（`trihexagonaltiles`）、`rhombitrihexagonaltiles`（3.4.6.4）、Cairo五邊形或直角三角形磁磚；以elongated triangular與3.3.3.4.4搜尋README／PLAN／DESIGN／CURRENT／TECHNICAL與preset目錄，沒有任何preset具有這種鑲嵌。實際讀取Wikipedia Elongated triangular tiling頁面（每個頂點三個三角形與兩個正方形的半正則鑲嵌，是以正方形列拉長的三角鑲嵌，Schläfli符號{3,6}:e，與扭稜正方形鑲嵌相似但頂點順序不同，Conway稱isosnub quadrille）取得拓樸；幾何則是推導並以數值檢查，不是抄自來源：單位邊長時一個週期寬1、高2 + √3 ≈ 3.73205，含2個正方形與4個三角形（一列正方形、一列朝上／朝下三角形、錯開0.5的一列正方形、第二列三角形），15×4個週期內30萬個隨機點都恰好落在一個多邊形內（無空隙、無重疊）。每個UV tile 15欄×4週期（120個正方形＋240個三角形；此tile比高度寬0.5%並被拉到正方形UV tile上）、每側0.035的填縫（總寬0.07邊長）、0.02肩部、赤陶／奶油色盤（112,48,36／232,214,170）、釉面粗糙度0.34、填縫粗糙度0.92、UV相對起伏0.012與1.2 m名目tile（邊長0.08 m）皆為作者近似，不宣稱磁磚厚度、釉料化學、填縫材料、尺寸規格或產品。獨立kernel只有12個多邊形中心值、48個邊法線值、360個磁磚色調與96²顆粒，共9,636個Float64／77,088 B表格（不是總RAM），另有三個六項常數；每點測試3×3個週期格鄰域×6個多邊形（54次圓外接半徑平方檢查），只對可能包含該點的多邊形逐邊計算一個smooth半平面，因此每點沒有hypot、平方根、三角函數、hash或配置，並略過通用detail。每個面是以填縫內縮的smooth半平面乘積，所以相鄰磁磚的支撐不會重疊，角落也不需要smooth minimum。Seed只改變磁磚色調（正方形0.1–0.22、三角形0.78–0.92）與細顆粒，晶格固定；不透明非金屬四張map、預設metallic 0、可選height、tint／repeats、Worker／cache與逐張texture所有權不變，不新增mesh、透明或位移。

五組行為以實際sampler在三seed量測，不複製private參數：768×768 raster（每單位邊長約51.32 px）以相對起伏高度0.41二值化，做含週期環繞的flood fill，並以720條射線的徑向角點數分類每塊磁磚。每個seed都得到360塊磁磚，恰有120個四角正方形與240個三角形（每週期1：2），沒有其他形狀；面積為正方形0.8208–0.8386邊長²（由preset推得的內縮預測0.8281）、三角形0.3041–0.314（0.3086），全部在5%內，填縫比例0.22502對預測0.22554（差距小於0.012）。正方形保持直立（角點角度45–45.5°，距45°小於5°），分成兩種列各60個，兩種列的x相位相差半個邊長；每個正方形最近的兩個正方形在0.9961–1.006邊長處（同列鄰居，距1小於0.03），接下來四個在1.931–1.934邊長處（距1.9319小於0.03），水平位移0.498–0.5078（距0.5小於0.03）；三角形分成120＋120兩種，角度30–31°與87–88.5°（距30°／90°小於5°）。以穿過每條磁磚邊中點的射線探測鄰接，120個正方形的邊都交替接觸正方形與三角形，240個三角形都接觸一個正方形與兩個三角形——這是3.3.3.4.4的接觸關係，而不是單純數頂點。正方形色調0.1102–0.2295、三角形0.7802–0.9241（平均差0.6775–0.6841，大於0.5），填縫粗糙度0.8997對磁磚0.3612–0.3615（差大於0.4），AO 0.5173對0.9746（差大於0.3），metallic違規0；seed 7與0xffffffff的磁磚質心位移0 px（小於0.5），磁磚色調最多變動0.1305／0.1244（大於0.01）。三seed六通道以起伏正規化的observed-curvature C1含128×128格點、欄與列邊界線，以及每軸八條線上的曲率細化；三個seed最壞值皆為0.0013534（小於0.04），帶號UV週期誤差最大5.0e-16（小於5e-10）。512像素map的填縫比例0.23863（0.04–0.4）、填縫／磁磚粗糙度0.88006／0.35871、AO 128–250、亮度76.4604–204.4322（範圍大於80）、最大tilt² 0.88892（0.1–3），每個帶號方向比例0.0965–0.1192（大於0.02）；32 px map的填縫比例0.1406、粗糙度0.89572／0.36492、AO 128–250、亮度77.3882–203.4322、tilt² 0.02956（小於0.5），因此32只保留巨觀鑲嵌。迴歸對照接受12個合法變體（11個preset變體涵蓋色盤、釉面粗糙度0.22／0.44、起伏、11欄×3週期晶格、填縫0.02／0.05與肩部0.012／0.03，另有一個五次smoothstep來源變體），並拒絕17個真實錯誤（7個preset錯誤：會抹掉三角形的0.25填縫、0.3肩部、無色差、釉面與填縫同樣粗糙、起伏過小或過大、9欄拉伸晶格；10個來源錯誤：沒有三角形、沒有向下三角形、正方形列沒有錯開、錯誤列週期、線性邊緣肩部、金屬磁磚、三角形與正方形同樣深、填縫與釉面同樣平滑、seed移動晶格、seed不影響色調）。相容性：全部829個舊kind×四個seed×七個取樣點（23,212次比較）及十個相關磁磚kind（`snubsquaretiles`、`rhombitrihexagonaltiles`、`trihexagonaltiles`、`dodecagontiles`、`cairotiles`、`righttriangletiles`、`rhombille`、`octagondot`、`windmillpavers`、`subwaytiles`）×尺寸32／512×三個seed（60組map）與前一版逐byte相同；舊kind的preset、tile與limits不變，五份程式清單保持唯一且舊順序不變。誠實記錄事件：第一版32 px粗糙度差下限0.4拒絕了合法的0.44釉面變體（實測差0.3927，因為32 px斜邊像素會混合粗糙度）；下限改為0.3，17個錯誤仍全數被拒。

實際讀取的參考：[Wikipedia - Elongated triangular tiling](https://en.wikipedia.org/wiki/Elongated_triangular_tiling)（每個頂點三個三角形與兩個正方形的半正則鑲嵌，是以正方形列拉長的三角鑲嵌，Schläfli符號{3,6}:e，與扭稜正方形鑲嵌相似但頂點順序不同）。該頁沒有提供週期、列錯開量或磁磚尺寸；這些如上所述由推導並以數值驗證，且不複製或打包任何圖片、產品磁磚或標準。

`rhombitrihexagonaltiles`（菱形三六角磁磚）新增作者3.4.6.4菱形三六角（rhombitrihexagonal）釉面鑲嵌近似：正六邊形位於三角晶格，每條晶格邊上有一個旋轉到三個相差60°方向之一的正方形，每個晶格三角形中心有一個正三角形，因此每個頂點交會一個三角形、一個正方形、一個六邊形與另一個正方形；六邊形為奶油色釉、正方形為石板藍、三角形為海軍藍，每個面都有窄斜邊並被較粗糙的灰色填縫圍出。它不是`snubsquaretiles`（3.3.4.3.4）、`trihexagonaltiles`（六邊形加三角形）、`dodecagontiles`（標準3.12.12）或其他既有磁磚preset，且以rhombitri與3.4.6.4搜尋README／PLAN／DESIGN／CURRENT／TECHNICAL與preset目錄，沒有任何preset具有這種頂點類型。實際讀取Wikipedia Rhombitrihexagonal tiling頁面（每個頂點一個三角形、兩個正方形與一個六邊形的半正則鑲嵌，Schläfli符號rr{3,6}，即expanded hexagonal tiling，與truncated trihexagonal tiling相關）取得拓樸；幾何則是推導並以數值檢查，不是抄自來源：單位邊長時六邊形中心位於間距1 + √3 ≈ 2.73205的三角晶格（內切半徑√3/2＋正方形邊長1＋內切半徑√3/2），六邊形的邊面向晶格方向，每條晶格邊的中點有一個正方形，每個晶格三角形的形心有一個三角形，一格為1個六邊形＋3個正方形＋2個三角形、面積(1 + √3)²√3/2 ≈ 6.4641，7×4超晶格內30萬個隨機點都恰好落在一個多邊形內（無空隙、無重疊）。每個UV tile 7欄×4雙列（56個六邊形＋168個正方形＋112個三角形；此超晶格比高度寬1.04%並被拉到正方形UV tile上，與既有7×8的六角磁磚preset相同的近正方形慣例）、每側0.03的填縫（總寬0.06邊長）、0.02肩部、海軍藍／奶油色盤（20,52,88／244,232,200）、釉面粗糙度0.3、填縫粗糙度0.92、UV相對起伏0.012與1.2 m名目tile（邊長約0.0628 m）皆為作者近似，不宣稱磁磚厚度、釉料化學、填縫材料、尺寸規格或產品。獨立kernel只有12個多邊形中心值、72個邊法線值、336個磁磚色調與96²顆粒，共9,636個Float64／77,088 B表格（不是總RAM），另有三個六項常數；每點測試3×3個晶格節點鄰域×6個多邊形（54次圓外接半徑平方檢查），只對可能包含該點的多邊形逐邊計算一個smooth半平面，因此每點沒有hypot、平方根、三角函數、hash或配置，並略過通用detail。每個面是以填縫內縮的smooth半平面乘積，所以相鄰磁磚的支撐不會重疊，角落也不需要smooth minimum；色調索引以傾斜週期的晶格位移在超晶格上環繞。Seed只改變磁磚色調（六邊形0.82–0.94、正方形0.3–0.4、三角形0.08–0.18）與細顆粒，晶格固定；不透明非金屬四張map、預設metallic 0、可選height、tint／repeats、Worker／cache與逐張texture所有權不變，不新增mesh、透明或位移。

五組行為以實際sampler在三seed量測，不複製private參數：768×768 raster（每單位邊長約40.37 px）以相對起伏高度0.41二值化，做含週期環繞的flood fill，並以720條射線的徑向角點數分類每塊磁磚。每個seed都得到336塊磁磚，恰有56個六角六邊形、168個四角正方形與112個三角形（每晶格1：3：2），沒有其他形狀；面積為六邊形2.352–2.376邊長²（由preset推得的內縮預測2.3637）、正方形0.8396–0.8629（0.8464）、三角形0.3204–0.321（0.3213），全部在5%內（實測在2%內），填縫比例0.14111對預測0.14212（差距小於0.012）。正方形有三種朝向各56個，角點角度14.5–17.5°、45.5–46.5°與72–74°（距15°／45°／75°小於5°）；三角形分成56＋56兩種，角度30–31.5°與86–88.5°（距30°／90°小於5°）；六邊形角點在29.5–31.5°（距30°小於5°），每個六邊形最近的六個六邊形在2.714–2.74邊長處（間距2.7321，誤差小於3%）。以穿過每條磁磚邊中點的射線探測鄰接，56個六邊形都接觸六個正方形，168個正方形的邊都交替接觸六邊形與三角形，112個三角形都接觸三個正方形——這是3.4.6.4的接觸關係，而不是單純數頂點。六邊形色調0.8264–0.9468、正方形0.3097–0.4127、三角形0.09205–0.1939（平均差0.5189–0.5276與0.2152–0.2233，分別大於0.4與0.1），填縫粗糙度0.8956對磁磚0.3195（差大於0.4），AO 0.5193對0.9764（差大於0.3），metallic違規0；seed 7與0xffffffff的磁磚質心位移0 px（小於0.5），磁磚色調最多變動0.1038／0.1082（大於0.01）。三seed六通道以起伏正規化的observed-curvature C1含128×128格點、欄與節點列邊界線，以及每軸八條線上的曲率細化；三個seed最壞值皆為0.0026823（小於0.04），帶號UV週期誤差最大5.0e-16（小於5e-10）。512像素map的填縫比例0.15347（0.04–0.35）、填縫／磁磚粗糙度0.87118／0.31775、AO 128–250、亮度63.0006–224.0322（範圍大於120）、最大tilt² 0.88043（0.1–3），每個帶號方向比例0.098（大於0.02）；32 px map的填縫比例0.125、粗糙度0.90689／0.31509、AO 128–250、亮度65.141–223.1044、tilt² 0.01479（小於0.5），因此32只保留巨觀鑲嵌。迴歸對照接受11個合法變體（10個preset變體涵蓋色盤、釉面粗糙度0.22／0.42、起伏、填縫0.02／0.04與肩部0.012／0.03，另有一個五次smoothstep來源變體），並拒絕18個真實錯誤（7個preset錯誤：會抹掉三角形的0.25填縫、0.3肩部、無色差、釉面與填縫同樣粗糙、起伏過小或過大、5欄拉伸晶格；11個來源錯誤：沒有三角形、沒有向下三角形、所有正方形同向、錯誤晶格間距、列環繞缺少晶格位移、線性邊緣肩部、金屬磁磚、正方形與六邊形同樣淺、填縫與釉面同樣平滑、seed移動晶格、seed不影響色調）。相容性：全部828個舊kind×四個seed×七個取樣點（23,184次比較）及十個相關磁磚kind（`snubsquaretiles`、`trihexagonaltiles`、`dodecagontiles`、`cairotiles`、`righttriangletiles`、`rhombille`、`hextruchettiles`、`octagondot`、`windmillpavers`、`starcrosstiles`）×尺寸32／512×三個seed（60組map）與前一版逐byte相同；舊kind的preset、tile與limits不變，五份程式清單保持唯一且舊順序不變。誠實記錄事件：第一版fixture用3%的面積容差與32 px 0.07的填縫下限，拒絕了合法的0.02窄填縫變體（面積誤差3.09%、32 px填縫比例0.0654）；容差改為5%與0.04，18個錯誤仍全數被拒。

實際讀取的參考：[Wikipedia - Rhombitrihexagonal tiling](https://en.wikipedia.org/wiki/Rhombitrihexagonal_tiling)（每個頂點一個三角形、兩個正方形與一個六邊形的半正則鑲嵌，Schläfli符號rr{3,6}，均勻著色1232，即expanded hexagonal tiling）。該頁沒有提供晶格間距、朝向或磁磚尺寸；這些如上所述由推導並以數值驗證，且不複製或打包任何圖片、產品磁磚或標準。

`snubsquaretiles`（扭稜正方形磁磚）新增作者3.3.4.3.4扭稜正方形釉面鑲嵌近似：單位邊長的正方形在半格子棋盤上交替旋轉約+15°與−15°，正三角形填滿所有空隙，因此每個頂點交會三個三角形與兩個正方形；正方形為深藍釉、三角形為奶油色釉，每個面都有窄斜邊並被較粗糙的灰色填縫圍出。它不是既有六角形加三角形（`trihexagonaltiles`）、Cairo五邊形（`cairotiles`）或直角等腰三角形（`righttriangletiles`）磁磚，且以snub、3.3.4.3.4與Archimedean搜尋README／PLAN／DESIGN／CURRENT／TECHNICAL與preset目錄，沒有任何preset具有這種頂點類型（唯一命中是`cinnamonbarkcoils`的阿基米德螺線）。實際讀取Wikipedia Snub square tiling頁面（每個頂點三個三角形與兩個正方形的半正則鑲嵌，Schläfli符號s{4,4}，與頂點類型3.3.3.4.4的elongated triangular tiling相關）取得拓樸；幾何則是推導並以數值檢查，不是抄自來源：單位邊長時方格晶格常數為(1 + √3)/√2 ≈ 1.93185，正方形位於晶格節點（旋轉+15°）與格心（旋轉−15°），節點正方形四邊向外的四個正三角形補滿一格，20萬個隨機點都恰好落在每格2個正方形＋4個三角形之一（無空隙、無重疊，面積總和等於格面積）。每個UV tile 3×3個晶格格（18個正方形＋36個三角形）、每側0.035的填縫（總寬0.07邊長）、0.02肩部、藍／奶油色盤（34,64,98／238,226,192）、釉面粗糙度0.3、填縫粗糙度0.92、UV相對起伏0.012與0.6 m名目tile（邊長約0.1035 m）皆為作者近似，不宣稱磁磚厚度、釉料化學、填縫材料、尺寸規格或產品。獨立kernel只有12個多邊形中心值、48個邊法線值、54個磁磚色調與96²顆粒，共9,330個Float64／74,640 B表格（不是總RAM），另有三個六項常數；每點測試3×3個晶格節點鄰域×6個多邊形（54次圓外接半徑平方檢查），只對可能包含該點的多邊形逐邊計算一個smooth半平面，因此每點沒有hypot、平方根、三角函數、hash或配置，並略過通用detail。每個面是以填縫內縮的smooth半平面乘積，所以相鄰磁磚的支撐不會重疊，角落也不需要smooth minimum。Seed只改變磁磚色調（正方形0.1–0.22、三角形0.78–0.92）與細顆粒，晶格固定；不透明非金屬四張map、預設metallic 0、可選height、tint／repeats、Worker／cache與逐張texture所有權不變，不新增mesh、透明或位移。

五組行為以實際sampler在三seed量測，不複製private參數：576×576 raster（每晶格192 px、每單位邊長99.4 px）以相對起伏高度0.41二值化，做含週期環繞的flood fill，並以720條射線的徑向角點數分類每塊磁磚。每個seed都得到54塊磁磚，恰有18個四角正方形與36個三角形（每晶格2：4），沒有其他形狀；每個正方形面積為0.8281邊長²（由preset推得的內縮正方形預測也是0.8281）、每個三角形0.3075（預測0.3085），兩者都在3%內，填縫比例0.22667對預測0.2255（差距小於0.012）。正方形有9＋9兩種朝向，角點角度為30°與59.5°（距30°／60°小於3°）；每個正方形最近的四個正方形都在1.366邊長處（(1 + √3)/2 = 1.3660，誤差小於0.03），且朝向全都相反。以穿過每條磁磚邊中點的射線探測鄰接，18個正方形都只接觸四個三角形、不接觸正方形，36個三角形都各接觸兩種朝向的正方形各一個與一個三角形——這是3.3.4.3.4的接觸關係，而不是單純數頂點。正方形色調0.1124–0.2273、三角形0.7872–0.9212（平均差0.6731–0.6937，大於0.5），填縫粗糙度0.8955對磁磚0.3212（差大於0.4），AO 0.5194對0.975（差大於0.3），metallic違規0；seed 7與0xffffffff的磁磚質心位移0 px（小於0.5），磁磚色調最多變動0.1266／0.1051（大於0.01）。三seed六通道以起伏正規化的observed-curvature C1含128×128格點、晶格邊界線，以及每軸八條線上的曲率細化；三個seed最壞值皆為0.00066724（小於0.04），帶號UV週期誤差8.1e-14（小於5e-10）。512像素map的填縫比例0.2271（0.12–0.4）、填縫／磁磚粗糙度0.89575／0.32115、AO 128–250、亮度77.4218–215.0322（範圍大於80）、最大tilt² 0.86837（0.1–3），每個帶號方向比例0.0699（大於0.02）；32 px map的填縫比例0.2344、粗糙度0.87721／0.32145、AO 128–250、亮度77.6344–213.8196、tilt² 0.02956（小於0.5），因此32只保留巨觀鑲嵌。迴歸對照接受13個合法變體（12個preset變體涵蓋色盤、釉面粗糙度0.22／0.42、起伏、2／4晶格格、填縫0.025／0.05與肩部0.012／0.03，另有一個五次smoothstep來源變體），並拒絕15個真實錯誤（6個preset錯誤：會抹掉三角形的0.25填縫、0.3肩部、無色差、釉面與填縫同樣粗糙、起伏過小或過大；9個來源錯誤：只有正方形、兩種正方形同向、錯誤晶格常數、線性邊緣肩部、金屬磁磚、正方形與三角形同色、填縫與釉面同樣平滑、seed移動晶格、seed不影響色調）。相容性：全部827個舊kind×四個seed×七個取樣點（23,156次比較）及十個相關磁磚kind（`cairotiles`、`trihexagonaltiles`、`righttriangletiles`、`rhombille`、`diamondcheckertiles`、`pythagoreantiles`、`dodecagontiles`、`tuliptiles`、`starcrosstiles`、`windmillpavers`）×尺寸32／512×三個seed（60組map）與前一版逐byte相同；舊kind的preset、tile與limits不變，五份程式清單保持唯一且舊順序不變。誠實記錄事件：第一版kernel把填縫粗糙度寫成`p.roughness + 0.6 * mortar`，使合法的0.42釉面變體在填縫達到1.02，pipeline的clamp造成斜率折點（最壞值97.48對0.04）；現在填縫粗糙度固定為0.92並以填縫遮罩混合，釉面幾乎與填縫同樣粗糙的設定會被粗糙度差檢查拒絕。

實際讀取的參考：[Wikipedia - Snub square tiling](https://en.wikipedia.org/wiki/Snub_square_tiling)（每個頂點三個三角形與兩個正方形的半正則鑲嵌，Schläfli符號s{4,4}，與elongated triangular tiling 3.3.3.4.4相關）。該頁沒有提供晶格常數、旋轉角或磁磚尺寸；這些如上所述由推導並以數值驗證，且不複製或打包任何圖片、產品磁磚或標準。

`starfish`（海星）新增作者五臂海星近似：多數owner各有一隻隨機旋轉的海星，由圓潤的中央圓盤與五條由根到尖逐漸變窄的圓臂組成，臂的夾角與長度略不規則，每條臂有圓頂與沿臂的脊線，脊線上與兩側有三列小瘤點，星與星之間是較粗糙、較暗的灰色砂底。它不是Starcoral（珊瑚杯與放射隔片）、Staranise（八個木質果莢圍繞凹陷種子腔）、Seaurchintest（象牙色殼與成對孔列）或扇貝疊壓家族（`scalemail`、`fishscales`）。實際讀取Wikipedia Starfish條目（中央圓盤、通常五臂、背面平滑、顆粒或多刺並由重疊骨板構成、常為紅或橘色、篩狀篩板），並實際檢視Wikimedia Commons的Starfish montage圖；以PIL量測圖中橘色標本輪廓，得到五個臂尖距中心171–183 px、谷深約為臂尖半徑的0.17–0.26、臂寬在0.5倍與0.85倍半徑處約為0.195與0.148倍半徑、相鄰臂尖夾角63.5–88.5°；同圖其他標本更窄或更寬（有角的沙色標本約0.25–0.3倍半徑），因此這些數字只描述一個標本，不代表物種。3×3格、固定五臂、軸向±0.1 rad抖動、臂長±6%、0.4格半徑、0.25R圓盤、根／尖半寬0.1R／0.07R、瘤點列（間距0.05格、半徑0.017）、灰砂底、灰到橘色盤、粗糙度0.66、UV相對起伏0.02與0.3 m名目tile皆為作者近似，不宣稱物種、篩板、管足、棘刺、色彩校正、真實尺寸或海洋生物學數據。獨立kernel只有180個pose Float64（9個owner×20）加128²顆粒與16²底面場，共16,820個Float64／134,560 B表格，不是總RAM；每點以最大投影選臂（不做角度三角函數），用2次hypot與12次SmoothStep，無逐點配置、hash或三角函數（`cos`／`sin`只在建立pose時使用），並略過通用detail。臂寬以smoothstep漸縮，使尖端與根部斜率為零；臂專屬起伏僅在離中心0.2R–0.25R之外淡入，因此相鄰兩臂交接的折線沒有起伏斜率折點；圓盤與臂以`1 − (1 − 臂)(1 − 圓盤)`合併。Seed改變哪些owner有海星，以及旋轉、臂抖動、色調與細顆粒；不透明非金屬四張map、預設metallic 0、可選height、tint／repeats、Worker／cache與逐張texture所有權不變，不新增mesh、透明或真實臂幾何。

五組行為以實際sampler在三seed量測，不複製private參數：192 px格的576×576 raster，以0.15高度門檻取星形遮罩，並從每隻星的質心發出720條射線，找出各星的臂尖、夾角、谷、臂寬與瘤點。三個seed各偵測到9／9／8隻星（大於0.75×9−1且不超過9），每隻恰有5個臂尖；臂尖夾角62–82°（55–92°）、臂尖半徑0.388–0.4766格（0.3–0.5）、臂尖最大／最小1.025–1.124（小於1.25）、谷／臂尖半徑0.1881–0.2216（0.12–0.3）、星面積占該格0.113–0.1389（0.08–0.2）、朝向集中度0.247–0.406（小於0.75），所以旋轉是隨機而非固定。臂全寬相對臂尖半徑在半徑一半處為0.1349–0.1693（每星平均0.1–0.22），在0.85倍半徑處為0.1112–0.1408（大於0.09且小於半徑一半處的平均）；實際檢視的橘色標本約為0.195與0.148，所以此preset較纖細。脊上瘤點每臂4–8個（每臂大於0、每星合計大於12）。星覆蓋率0.1111–0.1289（0.07–0.2）、星／底面色差0.378–0.422（大於0.3）、粗糙度差0.277–0.279（大於0.2）、AO差0.166–0.168（大於0.12），metallic／mortar違規0。三seed六通道以起伏正規化的observed-curvature C1含128×128格點、格邊界線，以及每軸八條線上的曲率細化；最壞值0.00010103／0.00008106／0.00011772（小於0.04），帶號UV週期誤差最大7.2e-15（小於5e-10）。512像素map的星面比例0.12016（0.07–0.2）、星／底面粗糙度0.65736／0.93924、AO 156–255、亮度98.0166–147.3082、最大tilt² 0.86087（0.1–3），每個帶號方向比例0.0688–0.0697（大於0.02）；32 px map的面比例0.12207、AO 156–254、亮度98.7318–147.3082、tilt² 0.06807（小於0.4），因此32只保留巨觀臂形與遮蔽。迴歸對照接受29個合法變體（28個preset變體涵蓋色盤、粗糙度、起伏、格數、星與圓盤半徑、臂寬、臂角／臂長／中心抖動、肩部、脊、瘤點與出現機率，另有一個五次smoothstep來源變體），並拒絕22個真實錯誤（14個preset錯誤：過粗、極細或向外變寬的臂、過大圓盤、被owner裁切、過小或過稀疏的星、纏繞的臂、臂長極不一致、無瘤點、無色差、鏡面粗糙度、起伏過小或過大；8個來源錯誤：只有圓盤、固定朝向、金屬星、線性肩部、臂起伏不淡入、星與底面同粗糙度、瘤點不起伏、圓頂反向）。相容性：全部826個舊kind×四個seed×七個取樣點（23,128次比較）及十個相關kind（`starcoral`、`staranise`、`seaurchintest`、`scalemail`、`fishscales`、`cowrieshells`、`musselshells`、`scallopshell`、`oystershell`、`nautilusshell`）×尺寸32／512×三個seed（60組map）與前一版逐byte相同；舊kind的preset、tile與limits不變，七份清單保持唯一且舊順序不變。誠實記錄事件：第一版使用線性漸縮，合法的0.56粗糙度變體在臂尖暴露0.155斜率折點（預設粗糙度仍低於0.04，所以只用預設fixture抓不到），改用smoothstep漸縮後消除；第一個合法的0.74粗糙度變體太接近底面（差0.19967，低於0.2），改為0.72；各合法變體的每臂瘤點數落在2到11之間，因此只斷言寬鬆的合計下限，且0.2振幅顆粒斑點來源錯誤與重新引入的線性漸縮折點仍未被此fixture偵測。

實際讀取的參考：[Wikipedia - Starfish](https://en.wikipedia.org/wiki/Starfish)（中央圓盤、通常五臂、背面平滑、顆粒或多刺並由重疊骨板構成、常為紅或橘色、篩狀篩板），以及實際檢視的[Wikimedia Commons Starfish montage](https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c7/Starfish_montage.png/960px-Starfish_montage.png)，比較其中橘色、藍色與沙色標本，並如上量測橘色輪廓。未檢視該圖的授權條款，因此不複製或打包任何圖片、標本資料或貼圖；不同物種的臂數差異、管足、棘刺與篩板均未建模，色彩也未校正。

`fishscaleshingles`（魚鱗瓦片）新增作者魚鱗狀金屬瓦片近似：8層各12個半圓形下緣瓣的橫列，每片瓦寬兩瓣，逐層交錯半瓣，上層下緣疊壓下層並在下層留下底部陰影；瓦片之間有窄深縫與略不同的塗裝色。它不是Hopsack／Waffleweave的織物格、Slate／Tiles的矩形瓦，也不是Snowflaketiles或Circularpavers的幾何鋪面。已讀Berridge Fish Scale Shingles頁（24 gauge鋼、輕微紋理的圓形扇貝輪廓、每片覆蓋8 1/2英寸高×11 1/2英寸寬、每square 148片；8.5×11.5×148＝14,467 in²，與100 ft²＝14,400 in²約略一致（差約0.5%）），並實看兩張白色／米色產品圖（每片下緣有兩個半圓瓣、相鄰層錯位疊壓、表面有淡波紋壓花）；另讀Yusheng Fish-Scale石粒金屬瓦頁（小型重疊扇貝單元，約2.8片／m²），但沒有取用其數字。由Berridge覆蓋比取課高對瓣寬比：每片兩瓣，故課高／瓣寬＝2×8.5／11.5≈1.478，本材質12瓣×8層為1.5（差約1.5%），並以12×5.75 in≈1.75 m作為nominal tile。來源與圖沒有可讀的瓣偏移量，所以相鄰層錯半瓣、唇厚、陰影寬度、縫寬、塗裝色與每片色差都是作者近似；不模擬壓花紋理、金屬反射、鋼板彎折、固定件或規格認證，也不是木瓦。獨立kernel：只有8×6片的色調表與128² grain，共16,432 Float64／131,456B tables，非總RAM；逐點四次hypot與12次SmoothStep，兩個最近瓣距離以多項式smooth-min合併（避免距離場中軸的斜率折點），無每點配置、hash或trig，通用detail略過。每層先各自算好顏色、高度與AO再依覆蓋率混合，使縫中心的色階被縫色蓋住而不留下階跳。0.012 UV-relative relief與配色為作者近似；seed只改每片色調與grain，瓣與縫位置固定；維持opaque dielectric四maps、預設metallic 0、optional height、tint／repeats、Worker／cache與各自texture ownership；不新增mesh、透明、折射或真實疊壓幾何。與既有`scallopedslate`（4欄×6列、1.2 m tile、每片單一圓尾的藍灰板岩、片間無縫）、`fishscaletiles`（4欄×8列共平面釉面馬賽克）及`scalemail`同屬扇貝疊壓家族，本材質只是由Berridge覆蓋比取得的變體：12瓣×8層、每片兩瓣、片間有窄縫與塗裝色差、1.75 m tile與下層陰影，不應被視為全新的屋瓦類別。

五組行為以實際sampler在三seed量測，不複製private參數：576×576 raster每瓣48 px，並平移半層使邊界避開raster邊緣；由高度階躍找每層下緣曲線，再量瓣數、半圓度、層距、交錯與縫。preset須為8–16瓣、6–10層；每seed 8層、每層恰12瓣（等於preset），瓣間距散布0 px（須小於3）、深度／瓣寬0.5（須0.42–0.58）、半圓殘差RMS 0.018803–0.018926半徑（須小於0.06）；階躍偵測失敗欄在標準preset為0（須小於15%，軟化的瓣隙欄會以環狀內插）。層距71.992–72.007 px（須在72±2內），相鄰層瓣位偏移24 px（須在半瓣24±3內）。每層6條縫（須等於瓣數／2）、縫距散布0 px（須小於3）、縫與瓦面的顏色差0.26329–0.32178（須大於0.15）、相鄰層縫位偏移24 px（須24±3）、各瓦片平均色標準差0.02679–0.02943（須0.01–0.08）。上層下緣下方的陰影最小AO 0.55392（須小於0.7）、無陰影處AO 1（須大於0.9）、粗糙度0.5–0.53（須0.45–0.58）、metallic／mortar違規0。seed 0與7的瓣與縫位置差0 px（須小於2）、各瓦片色差最大0.09055（須大於0.01），代表只改色調與grain。三seed六channel relief-normalized observed-curvature C1含128×128 grid、縱向瓣界／縫線、橫向層線／瓣縫線與4096 signed UV：worst皆0.000027756小於0.04，signed週期最大3.0087e-14。Actual512 baseline／backing roughness 0.51501／0.51507、AO71–255、luma 144.33–185.83、max tilt² 0.41415、四signed normal比例0.053974／0.054024／0.063618／0.0072136；32 px AO144–255、luma 169.83–185.76、tilt² 0.0037216，只保留宏觀色階與粗normal。31個合法變體（冷／暖palette、兩粗糙度、兩relief、10×6／14×8瓣層、尖／軟肩、短／長ramp、低／高base、低／高唇厚、輕／重陰影、窄／寬陰影、窄／寬縫、淺／深縫、弱／強色調差、淺／深縫色、弱／強縫AO與quintic shoulder）各通過18個case；22個真故障皆為ERR_ASSERTION：無／過淺唇厚、過粗／過細瓣層、無縫、無／過大色調差、無陰影、近黑palette、無色差、鏡面、無解析／極端relief、無交錯、縫無溝、linear shoulder、金屬瓦、階躍向上、無高度ramp、菱形瓣、seed移動瓣與粗糙度噪點；其中無色差因像素觀測器得到NaN而被拒絕（不是獨立診斷），極端relief由32 px粗normal上界、鏡面與粗糙度噪點由粗糙度範圍、近黑palette由luma差拒絕。限制見ACCEPTANCE。

實際讀取的參考：[Berridge - Fish Scale Shingles](https://www.berridge.com/products/shingle-systems/fish-scale-shingles)（24 gauge鋼、圓形扇貝輪廓、每片覆蓋8 1/2英寸高×11 1/2英寸寬、每square 148片）及其已實看的[白色產品圖](https://www.berridge.com/wp-content/uploads/2017/09/shingle-fish-final-1020x0-c-default.png)與[米色產品圖](https://www.berridge.com/wp-content/uploads/2017/10/shingle_fish_left_final-1020x0-c-default.jpg)；另讀[Yusheng - Fish-Scale Stone-Coated Metal Roof Tile](https://www.yushengjiancai.com/stone-coated-tile-fish-scale.html)（小型重疊扇貝單元），未實看其圖也未取用其數字。來源沒有可讀的相鄰層瓣偏移、唇厚、縫寬或陰影數字；不複製／打包圖片、規格表或壓花紋理。

`waffleweave`（華夫格織）新增作者華夫格織布近似：14×16個固定格的圓脊圍出內凹小方格，格底呈淺碗狀，橫向脊比縱向脊高，兩向脊交點隆起成小結；不是Matelasse的凸菱接結、Basketweave／Hopsack的連續籃紋，也不是Honeycomb的黃色六角蜂巢。已讀Wikipedia Waffle fabric（又稱honeycomb fabric；平紋格心周圍以長經緯浮線形成方形脊與凹陷）、Ashford〈The Squish is real〉（長浮線在方格上互鎖，脊是格的外框、凹格是交織較緊處，整理後浮線鼓起）與LinenMe waffle towel指南（凹格與凸脊；新布較平、洗後更明顯），並實看Wikimedia Commons〈An example of waffle fabric〉特寫（橫向脊較明顯、交點有圓結、格內凹陷）；Ashford與LinenMe頁面的圖片實看後只見織機與掛著的毛巾，沒有可讀的織構，不當作外觀依據。這些來源沒有格尺寸、脊高或經緯脊比例數字，所以14×16格（0.12m tile上約8.6×7.5 mm）、凹格寬度、橫／縱脊高0.9／0.7、碗深與交點結量都是作者近似；「橫脊較強」只是單張特寫的觀察，不是織物規格。不聲稱真實經緯交織、織紋圖、織物物理、吸水性或棉／亞麻／微纖維規格。獨立kernel：沒有逐格表，只有128² grain與8² cloud共16,448 Float64／131,584B tables，非總RAM；逐點兩次fract／abs與最多四個SmoothStep，無配置、hash、trig或sqrt，通用detail略過。0.12m nominal tile、0.012 UV-relative relief與冷灰白配色皆為作者近似；seed只移動細grain與雲狀明暗，格線與脊位不隨seed改變；維持opaque dielectric四maps、預設metallic 0、optional height、tint／repeats、Worker／cache與各自texture ownership；不新增mesh、透明孔洞、布料模擬、真實針織／梭織結構或規格認證。與既有`wafflecloth`（8×8對稱隆起邊框；實測縱／橫脊高只差約0.6%、交點不比脊高）屬同一織物家族，本材質只是較細的14×16近似變體：橫脊比縱脊高約0.08個relief單位、凹格為碗形、每個交點另有高出橫脊約0.10單位的結，且取材於不同參考，不應被視為新的織物類別。

五組行為以實際sampler在三seed量測，不複製private參數：每格64 px的896×1024 raster取各格凹格遮罩，另在格心、縱脊、橫脊與交點精確取樣。每seed須有224格（14×16；preset須10–20欄、12–20列），凹格面積占格0.25–0.45（實測0.34619–0.35059，跨格差最大0.00415且須小於0.02）、質心偏差小於0.02格（最大0.0021735）、外框寬0.5–0.8（0.65625）／高0.5–0.75（0.59375）、寬高比0.9–1.3（1.1053）、面積／外框填充率大於0.75（0.88847–0.89975；圓形故障實測0.711–0.715）、上下／左右邊位置散布小於0.1格（0.015625，即一個raster步）。高度分類各自跨格散布小於0.02（0.003885–0.003966）：格底0.1–0.25（0.18005–0.18395）、縱脊比格底高大於0.25（0.31608–0.31612）、橫脊比縱脊高大於0.05（0.076033–0.076119）、交點結比橫脊高大於0.07（0.094304–0.094401）且小於0.8（最大0.68218）。交點／橫脊相對格底的顏色差分別大於0.25／0.2（0.30834–0.36058／0.2663–0.31154）、AO差大於0.3（0.49824）、粗糙度0.78–0.97（0.88–0.90996）、metallic／mortar違規0。seed 0與7的凹格遮罩只有0.002582不同（須小於0.005），平均高度差0.00097172（須介於1e-5與0.02，代表只移動grain不移動格線）。三seed六channel relief-normalized observed-curvature C1含128×128 grid、縱橫格界與凹格邊掃描線及4096 signed UV：worst皆0.000007228小於0.04，signed週期最大2.2407e-15。Actual512 脊亮度比例0.46283、face／backing roughness 0.89516／0.89486（差須小於0.05）、AO128–254、luma 185.787–231.711、max tilt² 0.098577、四signed normal比例0.26265／0.26175／0.36829／0.36762；32 px 比例0.30469、AO150–222、luma 190.50–219.57（spread 29.07，須大於20）、tilt² 0.00076894，只保留宏觀明暗與粗normal。23個合法變體（冷／暖palette、兩粗糙度、兩relief、12×14／16×18格、窄／寬凹格、低／高縱脊、低／高橫脊、低／高格底、淺／深織紋、淺／深碗、弱／強交點結與quintic shoulder）各通過15個case；27個真故障皆為ERR_ASSERTION：無／過淺脊、過小／過大凹格、縱脊與橫脊同高、縱脊高於橫脊、交點結低於脊、過粗／過細格線、黑palette、無色差、鏡面、無解析／極端relief、格底過高、圓形凹格、剪切格線、linear shoulder、金屬脊、只剩橫肋、逐格高度階、反相華夫格、強grain高度噪點、seed移動格線、粗糙度噪點、無凹格AO與暗脊；其中圓形凹格因面積0.2256而非填充率被拒絕、逐格高度階與反相華夫格因面積被拒絕、seed移動格線由格框檢查拒絕（獨立的跨seed案例未單獨證明）、極端relief由32 px粗normal上界拒絕，不宣稱各自有獨立診斷。限制見ACCEPTANCE。

實際讀取的參考：[Wikipedia - Waffle fabric](https://en.wikipedia.org/wiki/Waffle_fabric)（又稱honeycomb fabric、長浮線形成方形脊與凹陷）、[Ashford - The Squish is real](https://www.ashford.co.nz/the-squish-is-real)（長經緯浮線互鎖成格、脊為格外框、整理後浮線鼓起）、[LinenMe - How to Choose the Best Waffle Towels](https://www.linenme.com/news/choose-best-waffle-towels)（凹格與凸脊、洗後結構更明顯），並已實看[Wikimedia Commons 華夫織物特寫](https://commons.wikimedia.org/wiki/File:An_example_of_waffle_fabric.jpeg)。這些來源沒有格尺寸、脊高、經緯脊比例或織物規格數字；不複製／打包照片、表或織圖，也不把毛巾吸水敘述寫成材質物理。

`halite`（岩鹽）新增作者乳白立方hopper晶面近似：多數owner各有一片隨機旋轉的平齊正方形立方面，面內依序往內下陷兩層同心的正方階面，像hopper晶體的逐級凹面；晶面為乳白色低粗糙度，貼在淡灰粉色的粗糙鹽底上。它不是Calcite的75°斜方板、Celestine／Barite的長方形板、Wulfenite的近方板，也不是沒有階面的平整方塊。已讀Handbook of Mineralogy（等軸晶系、{001}完全解理、skeletal／hopper-shaped faces、純淨時無色或白色）與Minerals.net（立方體有時帶hopper生長），並實看其粉色hopper群與Death Valley白色立方群照片；這些來源沒有可讀的階面比例或深度數字，因此晶面半徑、兩層階面約0.74／0.44倍半徑（各±0.06）及每層0.08個height單位的下降都是作者近似，不聲稱量測或認證鹽晶尺寸、透明度、溶蝕物理或礦物種類。獨立kernel：16個seeded owner各存9個pose／階面值，加128² grain與16² host共16,784 Float64／134,272B tables，非總RAM；方形晶面最大支撐含jitter約0.4455小於0.5 owner；逐點一次旋轉與最多六個SmoothStep，無配置、hash、trig或sqrt，通用detail略過。0.08m nominal tile、0.004 UV-relative relief與配色皆為作者近似；維持opaque dielectric四maps、預設metallic 0、optional height、tint／repeats、Worker／cache與各自texture ownership；不新增mesh、透明、折射、晶格、溶解模擬或化學認證。與既有`bismuthhoppers`（4×4個旋轉方形晶面、六層金屬階面、金紫色、0.16 m tile）屬同一旋轉巢狀方形hopper家族；本材質只是白色非金屬鹽晶變體：兩層階面、較小的晶面半寬0.21–0.27（對0.34）、0.08 m tile與粗糙鹽底，不應被視為全新的晶體類別。

五組行為以實際512²sampler在三seed量測，不複製private pose：各owner先取外晶面遮罩，再取高度低於0.52的第一階面與低於0.44的第二階面遮罩，以質心射線找角瓣、四邊直線擬合並檢查同心度。每seed要求10–16片（實測16／15／15）；外晶面與第一階面各4個角瓣，最長／最短角半徑比小於1.08（外面1–1.0205、第一階面1.0072–1.0397）、四條邊線夾角84–96°（86.691–90）、直線RMS小於0.006 cell（最大0.0024625）、對邊平行差小於5°（最大3.3059°）、中心對稱誤差小於0.06（最大0.039139），晶面面積占owner 0.13–0.32（0.16852–0.27765）。第一階面為晶面面積0.4–0.75（0.48494–0.66324）、第二階面0.12–0.32（0.15423–0.25484），兩者差大於0.15（0.23393–0.49724）；兩層質心偏差分別小於0.02／0.04 cell（最大0.0039029／0.018096）、第一階面轉角與外面差小於5°（最大2°）；晶面緣／第一階／最低階高度約0.56／0.48／0.40（0.56087–0.56162／0.48163–0.48246／0.39625–0.39961），逐級下降大於0.06（0.078712–0.079776、0.082398–0.085779）。最低階面太小，實測曾出現5個角瓣、角半徑比最高1.209、轉角最多7°，因此只檢查它的面積、同心與高度，不斷言邊直線度或轉角（詳見ACCEPTANCE）。整張覆蓋率0.12–0.32（0.18969–0.23801）、晶面／礦底顏色差大於0.3（0.40094–0.40647）、粗糙度差大於0.4（0.48861–0.48981）、AO差大於0.2（0.27271–0.27608）、晶面粗糙度0.3–0.55（0.43649–0.43709）、metallic／mortar違規0、隨機轉向集中度小於0.75（0.16348–0.38433）。17個合法變體（冷／暖palette、兩種粗糙度、兩種relief、小／大板、淺／深階面0.07／0.095、窄／寬第一階0.71／0.78、小／大第二階0.42／0.47、低／高覆蓋與quintic shoulder）各通過14個case；26個真故障皆為ERR_ASSERTION：無／過淺／過深階面、過小／被owner裁切／過稀疏板、過大第一階、過小階面、第二階與第一階同大、黑palette、無色差、同粗糙度、鏡面、無解析／極端relief、圓形板、斜方板、固定轉向、金屬板、C0 host step、linear shoulder、光滑礦底、非同心最低階、旋轉45°第一階、晶面高度噪點與倒置階面；其中圓形板因角瓣數14≠4、極端relief因32 px粗normal上界、非同心最低階因邊RMS 0.006625而被拒絕，不宣稱各自有獨立診斷。三seed六channel relief-normalized C1 worst 0.0000711／0.0000455／0.0000467小於0.04，signed週期最大2.6645e-15。Actual512 face fraction 0.1885、face／backing roughness 0.43539／0.92481、AO153–252、max tilt² 0.28349、四signed normal比例0.022064／0.022057／0.021996／0.022015；32 px只保留宏觀顏色與粗normal（tilt² 0.0015071）。限制見ACCEPTANCE。

實際讀取的參考：[Handbook of Mineralogy - Halite](http://www.handbookofmineralogy.org/pdfs/halite.pdf)（等軸晶系、{001}完全解理、skeletal／hopper-shaped faces、純淨時無色或白色）與[Minerals.net - Halite](https://www.minerals.net/mineral/halite)（立方體有時帶hopper生長），並已實看其[粉色hopper群照片](https://img.minerals.net/minerals/halite1/medium.webp)與[Death Valley白色立方群照片](https://img.minerals.net/minerals/halite-death-valley-california-smithsonian/medium.webp)。這些來源沒有可讀的階面比例、深度或晶面尺寸數字；不複製／打包照片或表，也不把頁面中的透明標本重現成透明度。

`calcite`（方解石）新增作者乳白斜方解理板近似：多數owner各有一片平齊的斜方形板，兩組平行邊夾約75°，內有一片與外形平行、位置略偏的巢狀階面；板面為乳白色低粗糙度，貼在深褐粗糙礦底上。它不是Celestine／Barite的長方形板、Wulfenite的近方板，也不是Pyromorphite／Vanadinite的六角端面。75°是作者近似值：已讀Handbook of Mineralogy（解理{1011}完全）、Wikipedia與LibreTexts（rhombohedral解理、常見白色解理片）及Minerals.net透明冰洲石照片，這些來源沒有提供可讀取的面角數值，因此不聲稱量測或認證解理角、晶體光學、透明度或雙折射。獨立kernel：16個seeded owner各存10個pose／階面值，加128² grain與16² host共16,800 Float64／134,400B tables，非總RAM；板最大支撐含jitter約0.4692小於0.5 owner；逐點一次旋轉、一次斜交換算與最多四個SmoothStep，無配置、hash、trig或sqrt，通用detail略過。0.1m nominal tile、0.0035 UV-relative relief與配色皆為作者近似；維持opaque dielectric四maps、預設metallic 0、optional height、tint／repeats、Worker／cache與各自texture ownership；不新增mesh、透明、折射、晶格或化學認證。

五組行為以實際512²sampler在三seed量測，不複製private pose：各owner遮罩以質心射線找角瓣，並對四邊做直線擬合，再檢查外板與巢狀階面。每seed要求10–16片、各片4個角瓣、長／短角半徑比1.22–1.38（實測1.2808–1.3266；75°理論約1.303）、四條邊線夾角72–78°（73.824–75.717）、直線RMS小於0.006 cell（最大0.002428）、對邊平行差小於3°（最大1.2788°）、中心對稱誤差小於0.03（最大0.016793）、板面積占owner 0.12–0.3（0.16431–0.24902）；巢狀階面為板面積0.12–0.55（0.20323–0.45133）、形狀比0.9–1.1（0.95963–1.0311）、主軸差小於4°（最大2.2677°）、完全在板內且高於板面0.05–0.09個relief單位（0.067794–0.069066）；整張覆蓋率0.12–0.3（0.15759–0.19664）、板／礦底顏色差大於0.5（0.66433–0.67151）、粗糙度差大於0.4（0.5385–0.53955）、AO差大於0.3（0.41917–0.41946）、板粗糙度0.25–0.5（0.37055–0.37081）、metallic／mortar違規0、隨機轉向集中度小於0.75（0.28922–0.36418）。17個合法變體（冷／暖palette、兩種粗糙度、兩種relief、74°／76°、小／大板、低／高階面rise、低／高覆蓋、小／大階面與quintic shoulder）各通過14個case；26個真故障皆為ERR_ASSERTION：90°／70°／80°斜角、過小／被owner裁切板、過稀疏、無／過高階面、過小／填滿／逃出板的階面、黑palette、無色差、同粗糙度、鏡面、無／極端relief、矩形板、圓形板、固定轉向、金屬板、C0 host step、linear shoulder、光滑礦底、軸對齊方形階面與板面高度噪點；其中圓形板因角瓣數≠4、極端relief因32 px粗normal上界而被拒絕，不宣稱各自有獨立診斷。三seed六channel relief-normalized C1 worst 0.000110／0.0000905／0.000106小於0.04，signed週期最大1.6653e-16。Actual512 face fraction 0.16197、face／backing roughness 0.37486／0.90829、AO140–250、max tilt² 0.2018、四signed normal比例0.01513／0.01529／0.01382／0.01378；32 px只保留宏觀顏色與粗normal（tilt² 0.0015）。限制見ACCEPTANCE。

實際讀取的參考：[Handbook of Mineralogy - Calcite](http://www.handbookofmineralogy.org/pdfs/calcite.pdf)（rhombohedral {1011}晶形、{1011}完全解理）、[Wikipedia - Calcite](https://en.wikipedia.org/wiki/Calcite)、[LibreTexts - Calcite Group Minerals](<https://geo.libretexts.org/Bookshelves/Geology/Mineralogy_(Perkins_et_al.)/14%3A_Mineral_Descriptions/14.07%3A_Carbonates_and_Nitrates/14.7.01%3A_Calcite_Group_Minerals>)（rhombohedral解理片、常見白色）及已實看的[Minerals.net - Calcite](https://www.minerals.net/mineral/calcite)與其[冰洲石照片](https://img.minerals.net/minerals/calcite-iceland-spar/medium.webp)。這些來源沒有可讀取的面角數字；不複製／打包照片或表，也不把頁面中的透明標本重現成透明度。

`flangenuts`（六角法蘭螺帽）新增作者鋼製六角法蘭螺帽頂視近似：六個直平側的削角六角本體座在較低的圓形錐面法蘭上，中央為開放圓孔並露出較粗糙的深色鋼底；不是Hex Nuts的無法蘭外形，也不是Cap Nuts的封閉球冠。比例只取DIN 6923 M5–M20尺寸表與圖面趨勢：法蘭直徑dc約為對邊s的1.38–1.48倍，最小對角e約為1.10–1.115×s，最小孔徑da約0.60–0.67×s，法蘭面圖示為15°–30°；本材質法蘭／平邊約1.40、孔／平邊約0.68。16個seeded owner預存六條平面法線；16×12 plane值加96² grain共9,408 Float64／75,264B tables，非總RAM。法蘭半徑0.413小於0.5 owner；逐點為六個smooth平面乘積、一次hypot與少量SmoothStep，無配置、hash、trig或鄰格掃描，通用detail略過。0.08m nominal tile沿用Hex Nuts，0.03 UV-relative relief與配色是作者近似。整個tile含深色鋼底均為metallic1，root factory預設1，explicit factor0不改寫maps；不含底面鋸齒、完整3D螺帽、內螺紋、透明、鋼材硬度、防鏽或DIN／ISO認證。

八行為對每個seed的16個owner以實際sampler量測，不複製private planes：先以720向二分搜尋遮罩的法蘭外緣與孔緣，再用高度等值線找六角本體輪廓，要求六個角瓣、約60度間隔、角／平比1.05–1.15、平邊投影偏差小於0.006，法蘭與孔都近圓（max／min小於1.03），法蘭最小半徑為平邊1.25–1.6倍且至少為角半徑1.1倍，孔／平邊0.45–0.85、孔底與背板高度差小於0.02，六角頂面高於法蘭緣0.2–0.5、法蘭緣高於背板0.15–0.4，頸部錐面抬升0.03–0.15，六角牆邊AO、背板roughness／顏色差與隨機轉向集中度亦在界內。21個合法變體含冷／暖鋼palette、兩roughness、兩relief、較大／較小螺帽、兩法蘭比例、兩孔徑、兩錐高、兩六角／法蘭高度、兩牆邊AO與quintic法蘭肩部，各八case通過；28個真故障含法蘭貼住六角角隅、法蘭小於六角、owner裁切法蘭、無孔／過大孔、無高度階、法蘭與六角同高、無／過陡錐面、無牆邊AO、背板無roughness或顏色分離、黑palette、無／極端relief、過小螺帽、高度噪點、過削八角、五／八邊形、方形／橢圓法蘭、橢圓孔、非金屬、C0 grain、linear bevel、固定轉向與缺六角本體，皆ERR_ASSERTION被拒；其中過大孔、法蘭與六角同高、過陡錐面與缺本體是因六角等值線瓣數退化而拒絕，不宣稱各自有獨立診斷。三seed observed-curvature C1含六角bevel、削角、孔緣、牆邊與法蘭rim環及signed UV通過；512五圖含高斜率bevel normal，32只保留宏觀顏色與粗normal。真forced WebGPU／WebGL2及shipped root factory、native Worker／cache／ownership已執行；限制見ACCEPTANCE，不擴大跨browser、Canvas2D或螺帽認證。

實際讀取的參考：[Fuller Fasteners DIN 6923表](https://fullerfasteners.com/tech/din-6923-specifications-hex-flange-nuts/)（M5–M20的c、da、dc、dw、e、m、mw、s與r）及其已實看圖面：圓形法蘭圍繞六角與孔，並有15–30度法蘭錐面。沒有照片、第三方搜尋結果或其他標準頁被當尺寸證據，也不複製或打包圖面與表格。

`capnuts`（六角蓋形螺帽）新增作者鋼製六角蓋形螺帽頂視近似：六個直平側與稍削角的六角本體、封閉圓形球冠與深色粗糙鋼底；不是Hex Nuts的貫穿圓孔。比例只取DIN 1587尺寸表的趨勢：圓冠直徑dk約為對邊s的0.93–0.96，最小對角e約為s的1.106–1.113，並以較低高度的30度削角環近似角隅。16個seeded owner預存六條平面法線，constructor算一次；16×12 plane值加96² grain共9,408 Float64／75,264B tables，非總RAM。削角半徑0.421小於0.5 owner；逐點只有六個smooth平面乘積、一次hypot、少量平方／SmoothStep，無配置、hash、trig或鄰格掃描，通用detail略過。0.08m nominal tile沿用Hex Nuts，0.03 UV-relative relief、dome crown與配色皆是作者近似，非實際螺帽尺寸、螺紋、防鏽或材質認證。整個tile含深色鋼底均為metallic1，root factory預設1，explicit factor0不改寫maps；不含完整3D螺帽、內螺紋、透明、鋼材硬度、DIN／ISO認證或真實鋼材數據。

八行為對每個seed的16個owner以實際sampler取暗背板遮罩中心，沿720個方向二分搜尋真輪廓，不複製private planes：必須有六個角瓣、約60度間隔、角／平比落在1.05–1.15、平邊投影偏差小於0.006；球冠必須封閉且由中心沿所有方向單調下降，中半高等值線近圓、半徑落在平邊半徑0.6–0.85倍，rim約為平邊0.88–1.0倍，並高於六角頂面0.35–0.55，六角頂面高於背板0.35–0.55；角隅削角、頸部AO、背板roughness／顏色差與隨機轉向集中度也要在界內。19個合法變體含冷／暖鋼palette、兩roughness、兩relief、較大／較小螺帽、兩種球冠比例、兩種crown高度、緊／寬削角、未削角角隅、真球面cap與quintic肩部，各八case通過；27個真故障含無／過小／超界球冠、過削八角、無／過深削角、頂面塌到背板、過高球冠、無頸部AO、無roughness或顏色分離、黑palette、無／極端relief、過小／owner裁切巨大螺帽、高度噪點、五／八邊形、貫穿孔、六角形／橢圓球冠、非金屬、C0 grain、linear bevel、固定轉向及尖頭球冠，皆ERR_ASSERTION被拒。未削角角隅被判為合法，因它與寬削角在觀測比例上不可分，不宣稱可偵測。三seed observed-curvature C1含六角bevel、角隅削角、球冠rim、neck與signed UV通過；512五圖含高斜率bevel normal，32只保留宏觀顏色與明顯normal。真forced WebGPU／WebGL2及shipped root factory、native Worker／cache／ownership已執行；限制見ACCEPTANCE，不擴大跨browser、Canvas2D或螺帽認證。

實際讀取的參考：[Fuller Fasteners DIN 1587表](https://fullerfasteners.com/tech/din-1587-specifications-hex-domed-cap-nuts/)（M4–M24的s、e、dk、dw、h與SR）及其已實看圖面：圓形球冠內切於六角、角隅較低且削角。其他搜尋結果頁、只有文字而未看3D圖的fasteners.eu頁與Wikipedia螺帽文章不當尺寸證據；不複製或打包圖面、表格或照片。

`bedfordcord`（貝德福德燈芯布）新增作者卡其色經向織入凸棱表面近似：20條垂直棱各由24行扁平緯向短棱組成，相鄰棱交錯半個行距，棱間以連續細溝隔開，棱身低於短棱、溝更低；不是Corduroy的割絨絨條，也不是Ribknit針織圈、Faille／Grosgrain橫向緯肋或逐紗draft浮點。新增獨立case而非塞入既有經緯逐紗kernel：每點只做floor／fract、平方與SmoothStep組合，無配置、hash、trig、sqrt或鄰格掃描，通用detail略過。20×24個短棱tone table與96² grain共9,696 Float64／77,568B，非總RAM；短棱支撐半寬0.45／0.46小於0.5 owner。seed只改短棱色調與細grain，棱距、列距與交錯固定。0.07m nominal tile、0.0018 UV-relative relief、20棱／24列與khaki palette均是作者近似，非布重量、紗支或照片比例校準；金屬maps與root factory預設均0，explicit factor1不改寫maps。不含真實經緯／襯紗交織、布料物理、透光、毛羽、纖維mesh或棉布規格／來源認證。

八行為從整tile 480²實際sampler raster量測，不複製private table：column mean找連續深溝與棱數，沿各棱中心找24個短棱、均勻間距、長度占列距0.8及寬度占棱距0.833，並比相鄰棱（含最後棱回到第一棱）相位差必為半個列距；溝、棱身與短棱高度順序、顏色與roughness順序，以及短棱高度／顏色散布都要留在界內。20個合法變體包含暖卡其／橄欖／中性灰／綠palette、兩relief、16×20與24×28棱列、20／28列、兩roughness、stagger 0.45／0.55、兩種短棱寬長、較強色調變化、較淺crown、quintic肩部與四次方圓角矩形，各八case通過；29個真故障包含零／四分之一錯位、奇數棱接縫、過粗／過細、過少／過多列、無溝／寬溝、平／過高短棱、棱身與溝同深、色／roughness錯誤、對比塌縮、無／過強relief、短棱、溢出溝、色／高度噪點、軸轉置、漂移錯位、金屬布、C0 grain、linear肩部、隨機pile spikes與非週期列，皆ERR_ASSERTION被拒。三seed relief-normalized observed-curvature C1、棱／列／半列交錯join與signed UV通過；512五圖解析低幅四向normal，32只保留宏觀顏色與極小normal，不宣稱解析細棱。真forced WebGPU／WebGL2及shipped root factory、native Worker／cache／ownership已執行；限制見ACCEPTANCE，不擴大跨browser、Canvas2D或布料認證。

實際讀取的參考：[Yorkshire Fabric Bedford Cord文章](https://www.yorkshirefabric.com/zh/blogs/ranges/new-range-bedford-cord)與[Fawn商品紀錄](https://www.yorkshirefabric.com/products/fawn-100-cotton-bedford-cord)（縱向織入棱、無割絨、常用襯紗、12 oz／360 g棉）、[HFW Bedford cord文章](https://www.hfwltd.com/journal/15)（經面、垂直排列的織入棱，比燈芯絨不明顯）。已實看其色布拼圖、1200 px fawn特寫與長褲照片；特寫僅暫存下載來量測2D自相關（約32 px棱距、27 px短棱列距、大約半距交錯，實體尺度未知）後刪除。未讀的搜尋摘要宣稱與一個只回棉布總覽的頁面都不當證據；不複製、不打包、不拿圖片校準。

`staurolite`（十字石）新增作者深褐色60°交叉雙柱側面近似：兩組直平側、鈍平端的柱形輪廓連成四臂，交叉處共用平坦頂面而非堆疊兩倍高度；淺色粗顆粒礦底與較低roughness晶面均為不透明非金屬。16個seeded owner預存雙軸cos／sin、中心、inverse scale與tint，constructor計算相對角；16×8 poses加128²grain共16,512 Float64／132,096B tables，非總RAM。每軸support上界hypot(0.32,0.07)×0.98＋0.07＝0.391016＜0.5，逐點無配置、hash、trig、sqrt或鄰格掃描，略過通用detail。0.12m nominal tile、0.0035 UV-relative relief與60°UV交角是作者表面近似，非晶體尺寸校準；不含完整晶柱mesh、片岩片理、透光折射、礦物鑑定或化學／收藏品認證。

八行為由整tile128²／各owner32²實際深色mask取中心，4-connected晶體配8-connected背景避免把對角開口誤算封孔；720方向的真輪廓ray識別四長臂、60°／120°間角、平行直側與鈍端，橫向只量第一個外部交界，避免穿出一臂後誤追另一臂。中心與臂頂高度一致，不複製private hash／poses或釘死smooth公式。14個合法palette、finish、relief、長寬、58°／62°、等價120°補角、quintic肩部及微不等長雙柱各八case通過；26個真缺臂、錯角、堆疊／開心／封閉孔、固定方向、錯finish／色／金屬、裁切與C0／linear肩部故障被拒。三seed relief-normalized observed-curvature C1、owner／grain與signed UV通過；512五圖解析四向rim normal，32只有低幅宏觀normal，不宣稱最低解析度能分辨細邊。真forced WebGPU／WebGL2及shipped root factory、native Worker／cache／ownership已執行；瀏覽器與診斷probe限制見ACCEPTANCE，不擴大跨browser、Canvas2D或實體礦物認證。

參考：[Handbook of Mineralogy：Staurolite](https://www.handbookofmineralogy.org/pdfs/staurolite.pdf)、[Lavinsky交叉晶體紀錄](https://commons.wikimedia.org/wiki/File:Staurolite-65715.jpg)與[Lavinsky淺色礦底紀錄](https://commons.wikimedia.org/wiki/File:Staurolite-121725.jpg)。Handbook載常見60°與較少見90°雙晶，本表面只選作者60°輪廓。可讀照片僅作形態參考，不複製／打包、不烘焙照片光照，也不拿來校準尺寸或鑑定礦物。

`dowelpins`（無頭圓柱定位銷）新增作者銀色實心無螺紋銷的側影：平行直軸、一端圓弧端、對端小導入倒角與淺橫向圓柱冠面；沒有Clevis Pins凸頭／尾孔、Linchpin閉環或平鍵平坦面。重用Clevis Pins的seeded pose／smooth cover／crown核心，constructor選擇無頭無孔分支並預算端曲率，不計算被略過的head／hole profile；不另造pin kernel。16×6 poses加96²grain仍為9,312 Float64／74,496B tables，非總RAM，不新增table。最大旋轉支撐hypot(0.36,0.095)×0.95＋0.016＝0.369708＜0.5 owner；逐點無配置、hash、trig、sqrt或鄰格掃描，空底略grain、通用detail略過。鋼面metallic1／不透明灰色非金屬背板0，default material factor1／explicit0；0.12m nominal tile、0.0032 UV-relative relief與比例為作者近似，非DIN尺寸或硬度校準。保留四maps／optional height、tint／repeats、Worker／cache與獨立texture ownership，不生成完整圓柱mesh、透明、拔出螺孔、壓入／配合物理、負載、防鏽或DIN／ISO認證。

八行為從每owner實際metal mask與PCA取得軸，再以實測平行側中線refine方向，binary-search實際輪廓量兩端形狀、均勻軸寬、無頭／無封閉孔及淺橫向冠面，不複製private seeded poses。圓端以漸增曲率而非固定二次公式識別；11個合法palette、finish、relief、軸長／寬、圓端／倒角與非二次平滑圓端變體各八項通過。25個實際凸頭、尾孔、單方向、金屬底／非金屬軸、螺紋狀凸肋、平／過高冠面、缺／錯圓端或倒角、細／粗／短／owner裁切、錯色／finish／relief、linear rim與tiny可見grain C0真assertion拒絕；僅新增未被使用的head計算是無效mutant，不列為故障。三seed六channel relief-normalized C1含observed-curvature refinement、128²grid、owner joins與4096signed UV；32／512實際五圖驗鋼／灰色非金屬底分離、finish、AO與opaque，512驗四方向rim normal、32只要求可解析的宏觀normal。817舊kind3268條四seed七點signed-UV sampler完全相同，八相關金屬材質48組32／512五圖逐byte不變，舊Clevis行為不變。

外觀參考：實讀[Elesa DIN6325資料表](https://www.elesa.com/siteassets/PDF/PDF_EN/DIN%206325.pdf)的鋼材、ground plain fit及centering step，原文也明說尺寸不符合ISO8734；實讀[Fastener Mart Dowel Pins](https://www.fastenermart.com/din-6325-dowel-pins.html)之headless solid parallel cylinder與一端圓弧／另一端導入倒角，並實看其[輪廓圖](https://www.fastenermart.com/mm5/graphics/00000001/DIN6325.gif)，不是照片。作者只近似側影／表面，不重製原圖或尺寸表、不打包圖、不把來源的硬度／配合／標準宣稱套到shader。

`europeanbeech`（歐洲山毛櫸）新增作者淡粉褐細直紋徑切面、密而均勻的淺凹縱導管與短小平齊射線斑，不是White Ash早材集中粗孔、White Oak寬長射線或凸木瘤。重用既有White Ash／White Oak的cached-noise／compact vessel／curved-ray核心，令早晚材孔寬與機率相同、降低帶狀色差，constructor-only pore jitter減輕規則列格；射線只改顏色／finish並遮去導管，不額外抬高height。48×24×4孔、6×18×6射線與4×3、96×4、128² noise共22,036 Float64／176,288B tables，非總RAM；孔支撐含jitter為X≤0.445、Y≤0.485 cell，射線X≤0.42、Y≤0.25844，皆小於0.5 owner。逐點無配置、hash、trig、sqrt或鄰格掃描，略過通用detail。0.24m nominal tile、0.0012 UV-relative relief、色彩與密度為作者近似，非木材尺寸或孔徑校準。保留opaque dielectric M0／explicit override、四maps／optional height、tint／repeats、Worker／cache與個別texture ownership；不新增木孔mesh、透光、木種鑑定、蒸煮／化學、防水、結構或來源認證。

八行為以512²實際roughness／AO masks與四連通PCA量射線短度／方向、平齊height與色差、淺凹縱孔及1–64頻率的實測孔分布，避免把環孔帶或固定列格當散孔；不複製private hash／placement tables。三seed六channel relief-normalized C1涵蓋observed-curvature refinement、128²grid、孔／射線owner及4096signed UV。32與512實際五圖驗暖粉褐、finish與opaque M0；只有512要求四方向可解析微normal，32不假稱細孔已解析。九合法palette／finish／relief／孔密度／細度／射線／jitter變體各八項通過；25個缺／寬射線、缺／環孔／粗／稀／過深／不凹孔、固定列格、缺射線色／finish／grain、錯色／finish／relief、metal、凸／凹射線、兩種linear shoulder、tiny C0及未著暗孔真assertion拒絕。816舊kind共3264組四seed七點signed-UV sampler不變，八相關木材48組32／512五圖逐byte不變。

外觀參考：實讀[The Wood Database European Beech](https://www.wood-database.com/european-beech/)的淡稻草／粉褐色、細直紋、散孔／有時近半環孔及徑切細射線斑；實看其未處理／finished與全板照片，但不把它們宣稱全是徑切。實讀[GL Veneer European Beech](https://glveneer.com/species/european_beech/)的細密均勻木理與微銀色射線，並實看有標識的[quarter-cut](https://glveneer.com/wp-content/uploads/2021/10/Beech-Euro-Steamed-Quarter-Cut.jpg)及[figured quarter-cut](https://glveneer.com/wp-content/uploads/2021/10/Beech-Euro-Steamed-Quarter-Cut-Figured-1.jpg)。另實讀Woodworking Network與Woodveneerz species sheet；本preset選作者淡粉褐均勻散孔徑切近似，不烘焙照片光照、複製整板／捲曲圖案或宣稱蒸煮校準，不打包照片。

`habotai`（羽二重平織絲綢）新增作者珍珠白細密1/1平織面、相同染色的經緯紗、低交織起伏與柔和光澤；不是霧面Batiste棉布、Surah斜紋、Sateen長浮紗或Shantung不規則粗節。重用既有balanced-plain核心與平滑紗肩，只新增preset／constructor分派；僅128²grain共16,384 Float64／131,072B tables，非總RAM，不新增float table。逐點無配置、hash、trig或sqrt，略過通用detail；84／84紗與336／336 filament shading、0.04m nominal tile及0.0002 UV-relative relief為作者選樣，非實際織物密度或厚度校準。珍珠白與低roughness形成柔和反光，並非新增各向異性絲綢BRDF；保留opaque dielectric M0／explicit override、四maps／optional height、tint／repeats、Worker／cache與個別texture ownership。真Habotai可有薄透型態，本preset只選不透明表面近似，不新增透光、皺褶／毛絲mesh、布料物理、momme／纖維成分或保存性能認證。

八項行為由實際取樣推斷兩軸高低交換與相鄰1/1轉換、同色／等高、低crossing及binding落差、凹隙／AO與低roughness；8192點輸出剖面計數測得雙軸84主頻，接受80-thread合法變體而非釘死preset數字。不複製private hash。三seed六channel relief-normalized C1涵蓋observed-curvature refinement、128²grid、紗owner／filament接縫及4096signed UV；512五圖驗珍珠白、淺四方向normal、finish與opaque M0。32px只驗可支持的色彩／finish／opaque，不強求不能解析的微孔／normal。九合法變體各八項通過，包括較粗80／80與雙組weft filament；20個缺／高／倒lift、錯finish／色、粗／失衡紗、窄緯／疏mesh、normal量化消失／過強、低tone、異色經緯、全經上／籃織、linear肩、metal及tiny C0真assertion拒絕。815舊kind3260組seed的七點signed-UV sampler不變，八相關布料48組32／512五圖逐byte不變。

外觀參考：實讀[Tissura Habotai](https://tissura.com/articles/silk-habotai-fabrics)之細平織、平滑柔和光澤與可能薄透，實看其[粉紅Habotai照片](https://tissura.com/media/15286_2.jpg)；實讀[IN SITU保存材料目錄](https://www.insituconservation.com/en/product/silk-fabrics/)列出的ecru／medium white／heavy white Habotai，不把跨產品共用照片當唯一樣品。CAMEO回403，未冒稱實讀。本preset選作者珍珠白平坦不透明面，不拷貝粉紅染色／皺褶、不認證重量／保存用途、不打包圖。

`azurite`（藍銅礦）新增作者深藍色、寬板柱狀的斜端平坦晶面，局部三片平行、群組各自轉向，晶面帶淺縱紋並高於深色粗礦底；不是Cavansite放射短針、Kyanite細長高起刀片或Wulfenite近方橙板。重用既有Celestine／Barite／Kyanite的seeded plate kernel，只新增profile，不另造晶體核心；25×6 poses加128²grain共16,534 Float64／132,272B tables，非總RAM。旋轉支撐hypot(0.23,0.3446)×0.975＋0.025＝0.428948＜0.5 owner；逐點無配置、hash或鄰格搜尋，沿用一個既有縱紋cosine，略過通用detail。板面是低roughness的opaque dielectric M0，不把照片白色鏡面反射烘焙成金屬或白色染料。0.1m nominal tile、0.0034 UV-relative relief、色彩與晶群密度為作者近似。保留四maps／optional height、tint／repeats、Worker／cache與獨立texture ownership；不新增完整晶柱／晶群mesh、透明折射、pleochroism、晶體生長、礦物／化學或含銅安全認證。

七項行為以512²實際color mask與四連通分群、PCA後局部minimum-area fit取得晶面長邊，再以11條實測剖面的雙端輪廓回歸量斜率／平行與直線誤差；不複製private hash／poses。同時驗三片平行群、群間方向、寬長比例、淺縱紋core span、高差／finish及dominant粗礦底。沿用既有observed-curvature refinement並補128²grid、owner joins與4096signed UV的三seed六channel relief-normalized C1；實際512五圖驗深藍、host、roughness、四signed肩部normal與opaque M0。八合法變體各七項通過，20個直／弱／過斜端、細／寬／單片／稀疏群、無／過深striae、斜面、錯色／finish／relief、linear end、metal、tiny C0與平齊晶面故障真assertion拒絕。814舊kind共3256組seed的七點signed-UV sampler完全相同，八相關礦物48組32／512五圖逐byte不變。

外觀參考：實讀[Handbook of Mineralogy藍銅礦](http://www.handbookofmineralogy.org/pdfs/azurite.pdf)的板狀／短至長柱狀、楔形終端、深藍及玻璃光澤；實讀Harvard [MGMH93556](http://tmn.fas.harvard.edu/objects/TSNB707)與[MGMH2020.7.1943](http://tmn.fas.harvard.edu/objects/TSNB645)，並實看[前者closeup](https://tmn.fas.harvard.edu/_astro/Exhibit2_MGMH93556_Azurite_55mmFOV_Southwood.D1oJyTlG_Z2tDNMa.webp)與[後者標本](https://tmn.fas.harvard.edu/_astro/Exhibit2_MGMH2020.7.1943_Azurite_81mm_Southwood.Bu2-5Tkb_Nszgp.webp)。只選作者深藍斜端板面，不重現完整標本、孔雀石共生、照片白色高光或校準礦物光學，不打包照片。

`whiteoak`（徑切白橡木）新增作者暖橄欖褐木面、橫過直木紋的寬長平齊射線斑，以及較淺的縱向凹導管；不同於White Ash無寬射線斑、Lacewood細密鱗斑及凸起木瘤。重用White Ash的環孔材／cached noise核心，只為White Oak加入18組六值曲線射線table，共18,680 Float64／149,440B tables，非總RAM。射線支撐含jitter為X≤0.46、Y≤0.47124 cell，均小於0.5 owner；取樣無配置、hash、trig、sqrt或鄰格掃描，通用detail略過。射線只改顏色與finish，完整射線遮去導管、不額外抬高height；微grain與凹導管才形塑法線。0.24m nominal tile、0.0016 UV-relative relief、色彩與密度是作者近似，並非木材標本校準。保留opaque dielectric M0／explicit override、四maps／optional height、tint／repeats、Worker／cache與個別texture ownership；不新增木孔mesh、透光、木種鑑定、樹脂化學、防水、結構或來源認證。

七項行為以512²實際roughness mask與四連通PCA量測長橫斑、近水平主軸、覆蓋率與不等長度；平齊高度取未混入導管的ray core，避免把合法邊緣半遮孔錯判為凸射線。AO辨識凹導管並驗縱向主軸；不複製private hash／ray table。三seed六channel relief-normalized C1涵蓋128²grid、實測孔輪廓、反推實際ray cover輪廓、owner joins、noise與signed UV；實際512五圖驗暖色、finish、淺四方向normal及opaque M0。八合法變體各七項通過，20個缺／等長／短／直立／過寬密射線、缺／平／深／橫導管、錯色／finish／relief、凸ray、linear ray、metal ray及tiny C0故障真assertion拒絕；linear ray的C1實測37.8918而非小於0.04。813舊kind共3252組seed的七點signed-UV sampler數值完全相同，八相關木材48組32／512五圖逐byte不變。

外觀參考：實讀[Wood Database白橡木](https://www.wood-database.com/white-oak/)的環孔、徑切寬射線、長射線與常見tyloses敘述，並實看[finished](https://www.wood-database.com/wp-content/uploads/quercus-alba-qs2.jpg)及[raw徑切木面](https://www.wood-database.com/wp-content/uploads/quercus-alba-qs.jpg)；實讀[紅／白橡木比較](https://www.wood-database.com/wood-articles/distinguishing-red-oak-from-white-oak/)之不可單靠顏色鑑種。本材質選寬橫射線與淺導管作者近似，不聲稱顯微tylosis鑑定、不拷照光照、打包照片或認證木材物性。

`clevispins`（有頭連接銷）新增作者銀色無螺紋圓柱銷的側影：短頭在軸兩側凸出，對端保留單一封閉圓形橫孔；軸面有淺圓冠，沒有Linchpin閉環、R-clip彎線、Gib-head單側凸頭或平鍵實心端。獨立kernel沿既有seeded pose／smooth cover慣例，以短矩形頭及帶小端倒角的直軸聯集，再扣圓孔；16×6 poses加96²grain共9,312 Float64／74,496B tables，非總RAM。最大旋轉支撐sqrt(0.38²＋0.18²)×0.95＋0.016＝0.415452＜0.5 owner；逐點無配置、hash、trig、sqrt或鄰格搜尋，空底與全孔略grain、通用detail亦略。鋼面metallic1／opaque孔底與背板0，default material factor1／explicit0；0.12m nominal tile、0.0032 UV-relative relief與比例是作者近似，不是DIN量測。保留四maps／optional height、tint／repeats、Worker／cache及獨立texture ownership；不生成完整圓柱／通孔mesh、透明、插入split pin／R-clip裝配、轉軸物理、負載或規格認證。

六行為fixture以128²實際metal mask、PCA主軸與四連通背景分群找封閉孔，依孔方向區分短雙肩頭與長直軸，再量aspect、頭寬／短頭比例、雙肩對稱、軸寬穩定、尾孔位置／圓度／相對直徑、opaque低孔底及軸圓冠。不複製private hash／poses；三seed六channel relief-normalized C1覆蓋192²grid、實測內外輪廓三threshold／120方向、grain及signed UV。實際512五圖驗銀色鋼面／非金屬底、finish與四signed normal方向，32px保留鋼／背板但不宣稱每孔可解析。八合法變體各六項通過，23個無／錯位／開口／過小大／橢圓孔、缺／單側／長頭、寬軸、無／過圓冠、錯finish／dye／relief／scale、越owner、linear shoulder、tiny C0及nonmetal pin故障真assertion拒絕。812舊kind3248條32px RGBA streams與八相關五金48組五圖逐byte不變。

外觀參考：實讀[mbo Oßwald DIN 1444 Form B](https://www.mbo-osswald.de/en/configurators/bolts-din-1444-form-b)，實看其[銷照片](https://www.mbo-osswald.de/media/0c/7f/e8/1598602952/bolzen-mit-loch-und-kopf-din.png?ts=1598602969)與[側影尺寸圖](https://www.mbo-osswald.de/media/14/d8/7b/1677505203/bolzen-mit-loch-und-kopf-din_massbild.jpg)；另實讀[Boneham Clevis Pins](https://www.bonehamusa.com/wp-content/uploads/2017/10/Clevis-Pins-Metric-ISO-DIN.pdf)之head／shank／cross-drilled hole及孔在頭對端。ITA頁首文字自稱partially threaded，但其表格寫Thread: -且圖為plain shaft，未以該矛盾文字引入螺紋。本材質只作者近似無螺紋單孔側影，不拷照光照／尺寸、打包照片或認證DIN／ISO。

`whipcord`（鞭繩斜紋布）新增作者深灰色單條粗斜脊與同色經緯紗：選用3/1經面連續三pick長浮紗、較低的單點緯紗接結、稠密經紗與較疏緯紗，約72°斜紋；不是現有Gabardine的細短斜紋、Cavalry Twill雙脊、平紋、橫向Grosgrain或剪絨Corduroy。重用既有profiled-weave／whole-float tables與平滑紗肩，不建立第二套織布kernel；4×4×6 profiles及128² grain共16,480 Float64／131,840B tables，非總RAM。取樣無配置、hash、trig或sqrt，略過未使用的通用detail noise；0.06m nominal tile、0.0016 UV-relative relief、紗數／染色為作者近似，3/1不是所有Whipcord的規格。保留opaque dielectric M0／override1、四maps／optional height、tint／repeats、Worker／cache及個別texture ownership，不新增透光、毛羽／布料mesh、異向性反射或服裝物理。

七項行為先以實測高度分群驗凸經脊高於接結緯紗，再反推三浮一沉、單binder斜向週期、長浮紗中段不下凹、相鄰獨立紗間谷與同染色；獨立1024×97輸出剖面頻譜量測主頻84／28及71.565°，只排除整數倍諧波而不把較粗60／20的合法第二諧波當競爭斜脊。三seed六channel relief-normalized C1檢查裸露紗肩、整段浮紗兩端、fiber／grain與signed UV。實際512五圖驗深灰色、霧面finish、四signed normal方向及M0／opaque；32px仍有色彩／AO對比，不宣稱能解析細紗normal。十合法變體各七項通過，20個平／2/2／籃織、無／淺lift、錯relief／finish／dye、32px alias、疏mesh、45°、無脊／倒置脊高、逐pick斷珠、linear shoulder、tiny C0、metal與異色weft故障真assertion拒絕；811舊kind3244條32px RGBA streams與八相關織物48組五圖逐byte不變。

外觀參考：實讀[Scavini的Whipcord／Cavalry Twill文章](https://www.scavini.fr/en/2025/10/whipcord-cavalry-twill-les-classiques-intemporels-du-vestiaire-masculin/)所述pronounced oblique ribs／約70°，並實看其[Whipcord近照](https://www.scavini.fr/wp-content/uploads/2025/10/WHI-600x600.jpg)。另實讀[ApparelX Whipcord](https://www.apparel-x.com/wiki/whipcord)之continuous diagonal ribs與紗／finish差異；該文亦提醒Gabardine名稱範圍可重疊。因此只作者選定粗斜脊，不宣稱所有實物同一draft、拷貝照片光照、實測尺寸、纖維成分／強度、保暖／防水或洗滌規格。

`vanadinite`（釩鉛礦）新增作者橙褐色凸六角晶緣、單一內縮六角凹面與較暗平坦不透明底，散布在淡色粗礦底；不是 Pyromorphite／Red Beryl 的實心平頂、四角 Bismuth hopper、尖晶或透明管。獨立 kernel 沿既有平滑六角 half-plane／seeded pose 慣例，分別平滑外緣與較小同向內凹 cover，不以 max／abs 徑向距離製造內接縫。5×5×6 poses、8² cloud、128² grain 共16,598 Float64／132,784B tables，非總 RAM；支撐(0.24＋0.05)/sqrt(0.75)＋0.06＝0.394863＜0.5 owner。取樣無配置、hash、trig、sqrt 或鄰格搜尋，並略過通用 detail noise；0.1m nominal tile、0.0038 UV-relative relief、色彩與密度是作者近似。維持 opaque dielectric M0／明確 override、四maps／optional height、tint／repeats、Worker／cache 與各自 texture ownership；只選凹晶端，不新增完整晶柱／群晶 mesh、透明折射、晶體生長／成因、化學／XRD、來源或含鉛安全認證。

七項行為由獨立局部格點定位低roughness晶面，反向射線校正中心，再二分120方向的內外輪廓，驗六向週期、直六邊擬合、較小同向凹面、平坦晶緣／凹底、凹深及凹底高於粗底。三 seed 六 channel relief-normalized C1 覆蓋實測外肩／內肩／core接合、grain／owner格點與 signed UV，不複製private hash／pose。實際512五圖驗橙褐／淡礦底、四signed normal方向、opaque／M0；八合法變體各七項通過，18個無凹深、尖／過小大凹底、過深、過小／越界晶面、錯finish／palette／relief、圓晶、無AO、metal、凸中心、linear shoulder與tiny C0故障真 assertion 拒絕。810舊 kind 的3240條32px RGBA streams 與八相鄰礦物48組五圖逐 byte 不變。

外觀參考：實讀 [Minerals.net Vanadinite](https://www.minerals.net/mineral/vanadinite) 的橙紅／六角／partially hollow或hopper habit，與 [Handbook of Mineralogy](https://handbookofmineralogy.org/wp-content/uploads/2022/07/vanadinite.pdf) 的commonly cavernous／紅橙至褐色。另實讀 [John Betts標本9565](http://www.johnbetts-fineminerals.com/jhbnyc/mineralmuseum/picshow.php?id=9565) 的orange-brown與頂部cavernous hoppered termination，實看[照片](http://www.johnbetts-fineminerals.com/jhbnyc/mineralmuseum/9565.jpg)。照片是長柱標本，本preset僅作者近似其凹晶端，不重建長柱、複製影像光照／尺寸、打包照片或將選定habit代表所有標本。

`tabwashers`（單外舌止動墊圈）新增銀色平坦圓環、封閉圓孔與唯一向外延伸的直邊平舌；圓環／舌片共面，不是 split lock、內齒、球面或杯形墊圈。獨立 kernel 沿用 seeded pose／compact cover 慣例，以平滑圓面與矩形 cover 聯集再扣除圓孔；4×4×6 poses 加96² grain，共9,312 Float64／74,496B tables，非總 RAM。最遠支撐 sqrt(0.43²＋0.09²)×0.95＋0.02＝0.437352＜0.5 owner。逐點無配置、hash、trig、sqrt 或鄰格搜尋，空背板略過 grain，也略過通用 detail noise。鋼面 metallic 1／opaque 孔與背板0，預設材質 factor 1／明確 override 0；height／roughness／AO 共用 cover。0.1m nominal tile、0.0028 UV-relative relief、比例與色彩是作者近似，非 DIN 尺寸。保留四 maps／optional height、tint／repeats、Worker／cache 與各自 texture ownership；不新增 mesh 通孔、透明、彎舌／螺母裝配、防鬆力學、負載或規格符合認證。

七項行為以獨立512格點分割金屬連通面與封閉孔，要求每面一孔；由孔的相向射線反覆校正中心，再二分量測720角度的孔圓度、外圓基準、唯一凸舌、舌寬與直端面，並比較環／舌高度共面，不複製私有 hash／pose。三 seed 六 channel relief-normalized C1 掃描實測內外輪廓、0／0.5／1 cover、grain／owner 格點與 signed UV；實際512五圖驗銀色、metal／host 分離與四個 signed bevel-normal 方向。九鄰近合法變體各七項通過，24個缺舌／短長窄寬舌、孔徑、分離舌、過圓 bevel、越界、finish／palette／relief、填孔、雙舌、linear、metal 缺失／外洩、凸舌、橢圓孔、tiny C0 與圓端故障皆由真 assertion 拒絕。809舊 kind 的3236條32px RGBA streams 與八相鄰墊圈／鍵夾材質48組五圖逐 byte 不變。

外觀參考：實讀 [Woodstock Industrial — DIN 93](https://www.woodstockindustrial.com/specs/din-93) 的 single long lug 與彎舌用途，實看其[單外舌照片](https://www.woodstockindustrial.com/static/img/specs/DIN93.jpg)；另實讀 [Fasteners.eu — DIN 93](https://www.fasteners.eu/standards/din/93/) 並實看[渲染圖](https://www.fasteners.eu/img/products/3d/din93.jpg)。本材質只選未彎折平面輪廓，不採用搜尋摘要中的未核對尺寸、重建安裝／鎖固動作、複製拍攝光照或打包圖片。

`whiteash`（白蠟木）新增淺暖褐直紋縱切面：平齊生長帶中的早材導管較粗且集中，晚材導管細疏；只有長向開口凹入、變暗且較粗糙，不是深色條紋木換色、端面圓孔、凸木肋或橡木寬射線。獨立 kernel 沿用 compact vessel／cached periodic noise 慣例，32×14×4 pore cache 加 4×3 warp、96×4 fiber、128² grain，共18,572 Float64／148,576B tables，非總 RAM；pore 的局部 x 支撐在0.2–0.8、y 在0.02–0.98內，平滑 warp 不切斷 owner。逐點無配置、hash、trig、sqrt 或鄰格搜尋，並略過未使用的通用 detail noise。0.24m nominal tile、0.0018 UV-relative relief、色彩與密度是作者近似，不是照片量測。維持 opaque dielectric／metallic 0、optional height、tint／repeats／明確因子 override、Worker／cache 與獨立 texture ownership；不提供木板／樹 geometry、透明孔洞、木材物性、樹種／來源或合法採購認證。

七項行為觀察以獨立512格點的未開孔底色分組與開口 connected components，驗較暗早材帶中的導管數量／寬度、縱向細長比例、平齊底面、凹深／粗糙度、實際五圖配色與雙向法線。三 seed 的六 channel relief-normalized C1 掃描格點、實測二分開口輪廓與 signed UV 週期，不複製私有 hash／pose 方程。八組鄰近合法變體各七項通過；19組錯誤密度／寬度、無孔、近等向孔、無色帶、relief／finish／palette、過寬孔／owner 截斷、linear shoulder、凸木帶、metal 與缺 AO 皆由真 assertion 拒絕。808舊 kind 的3232條32px RGBA streams 與八個相鄰木材的48組五圖逐 byte 不變。

外觀參考：實讀 [The Wood Database — White Ash](https://www.wood-database.com/white-ash/) 的淺至中褐、近直規則木理、環孔材與早材大孔／晚材小孔，實看其 [sealed 縱切面](https://www.wood-database.com/wp-content/uploads/ash-sealed.jpg) 與 [放大端面](https://www.wood-database.com/wp-content/uploads/white-ash-endgrain-zoom.jpg)。端面僅協助理解導管分布，不複製成縱切面的圓孔、不重建所有解剖構造、不打包照片或烘入拍攝光照。

`gibheadkeys`（鉤頭錐鍵）選作者銀色實心鉤頭錐鍵的平坦側視輪廓：同一平面上一端有凸起、外端斜削的鉤頭，單側垂直階差連到略呈1:100斜度的直條鍵身；不是雙圓端 parallelkeys 或半月 Woodruff 鍵。4×4 組小幅旋轉／jitter／縮放 pose 共 96 值，加 96² grain，共 9,312 Float64／74,496B tables，僅為 table 預算、非總 RAM；最遠支撐 sqrt(0.42²＋0.2²)×0.97＋0.025＝0.476232＜0.5，不越 owner。取樣無配置／hash／trig／sqrt／鄰格掃描，空背板略過 grain；金屬面、height、roughness 與 AO 同 cover 混合，metallic 圖為鋼面1／opaque 背板0，預設材質 factor 1。0.2m nominal tile、0.0022 UV-relative relief 及銀色 palette 為作者近似，非尺寸、配合或標準量測。維持四 maps、optional height、tint／repeats／Worker／cache 與獨立 texture ownership；不新增完整3D鍵身／頂面、鍵槽／輪轂配合或拔出動作、公差、材料／負載額定或標準符合認證。

沿用 Woodruff／Parallel key fixture 為三鍵33項行為，保留原兩鍵 bounds 與 ray C1，並刪除原僅釘 rays 數量的容量型 `checked` pin。新增 gibheadkeys 的 no-hole flood fill、最小面積 shank frame（避免單端鉤頭使 PCA 軸傾斜）、頭端實測斜削與平頂、兩格內單側階差、頭／鍵身高度比、bisected 上下直邊的斜度與直線度；flat-core 侵蝕改為依可見面積相對縮放以免密度偏差；每個 owner 邊界另掃 metal-free。六 channel C1 另覆蓋全 contour、flat-core 接合與 owner／grain 格點，height 按 relief 正規化，不複製 private poses／hash／half-plane 方程。11組鄰近合法變體各33項通過，24組錯色、finish／relief、無／過大頭階、缺斜削、尖頭、無／過大錐度、過長頭／過短鍵身、owner 越界、過圓 bevel、過小、metal 缺失／外洩、linear shoulder、缺 body／head、反向 taper 與 tiny height C0 由真 assertion 拒絕。807舊 kind 的3228條32px RGBA streams 與八個相鄰鍵／夾／鉸鏈材質的48組五圖逐 byte 不變。

外觀參考：實讀 [Woodstock Industrial — DIN 6887 Taper Gib-Head Keys](https://www.woodstockindustrial.com/specs/din-6887) 的頂面1:100 taper、大端凸起鉤頭、鉤頭供 wedge／drift 拉出、8×7至50×28mm斷面與32至200mm長度，並實看其[鉤頭鍵照片](https://www.woodstockindustrial.com/static/img/specs/din6887.jpg)；另實讀 [Fasteners.eu — DIN 6887](https://www.fasteners.eu/standards/din/6887/)（只確認標題與等效編號，頁面無採用的尺寸表），並實看其[3D 渲染圖](https://www.fasteners.eu/img/products/3d/din6887.jpg)。只選作者平坦側視的單端鉤頭、外端斜削與近1:100直條鍵身；頭／鍵身高度比與長度比是作者近似，不是 DIN 尺寸，也不複製／打包照片、不烘入光影或重建頂面透視。

`grosgrain` 選作者灰藍羅緞表面：細密縱向經線逐根交錯較寬的單條圓凸橫肋，肋面往兩側平滑下降，保留交叉抬升、細纖維與低凹不透明紗隙；不是 Faille 的寬平緯棱、Poplin 的較淺肋冠、Ottoman 成對粗棱、平衡平織、開網或緞面長浮紗。只擴充既有連續紗線 constructor 的 crown 選擇，整個逐點 evaluator 逐字不變，無新增逐點配置、hash、三角函數、搜尋或 runtime 依賴。參數集中 `src/data/materials.ts`；重用 128² grain 的 16,384 Float64／131,072B tables，非總 RAM；經／緯支撐 0.21／0.46＜0.5 owner，lift 在 owner 邊界前平滑歸零。0.025m nominal tile、0.00045 UV-relative relief、密度與配色均為作者近似，非照片／紡織量測。維持 opaque dielectric、預設 metallic=0、明確因子 override、height／tint／repeats、Worker／cache 及各自 texture ownership；不新增布邊／緞帶 mesh、Petersham 波浪邊、透明、垂墜／挺度／強度物理、各向異性或聚酯／纖維成分／厚度／洗滌認證。

沿用 Poplin／Faille fixture 擴為三布共30項行為，保留原兩種色族、flat-crown／形狀／normal bounds；新增灰藍 palette／finish、每條圓凸肋往兩側的實測下降，並補兩軸相鄰交叉點曝光與抬升交替、含最後／第一 owner 閉合，不釘預設紗線數。獨立4096點 UV 掃描觀察窄密經線／寬疏橫肋；512五張 opaque M0 圖、三seed signed UV、六通道 height-normalized C1 沿 supports／cores／lift／fiber／owner／wrap 實測。八組附近合法變體各30項通過，23組錯色、finish／relief、密度倒置／平衡、紗線過寬／橫肋過窄、flat／shallow／過圓冠、無lift、奇數密度跨邊不交替、單向／成對曝光、缺AO、metal、linear shoulder 與 tiny normalized-height C0 真 assertion 拒絕；不複製 sampler 權重方程。806舊材質3224條32px RGBA streams 與七相關布料32／512三seed的42組五圖逐byte不變，舊preset／tile／limits 不變。

外觀參考：實讀 [WAWAK — What Is Grosgrain Ribbon?](https://blog.wawak.com/post/what-is-grosgrain-ribbon) 的 ribbed appearance／texture、較 satin matte 及 weave 名稱不限定纖維成分，並實看其 [灰色羅緞捲帶近照](https://static.wixstatic.com/media/3e8c68_aca3ae1546ce4c1f917af48fa293e8f5~mv2.jpg/v1/fill/w_1000,h_750,al_c,q_85,usm_0.66_1.00_0.01/3e8c68_aca3ae1546ce4c1f917af48fa293e8f5~mv2.jpg)；另實讀 [Standard Grosgrain 商品說明](https://www.wawak.com/garment-construction/ribbon/100-polyester-grosgrain-ribbon/) 的 straight-edge／ribbed／slightly matte，實看其 [黑色單帶商品圖](https://www.wawak.com/49b4e6/globalassets/catalogs/gr/hs108bk-1-main-gr.jpg)。只選照片可見的細縱線與較粗單橫肋外觀，不由文中 yarn 重量敘述推斷纖維直徑，也不重現帶邊、捲曲、拍攝光照、產品厚度／聚酯物性或打包照片。

`pyromorphite` 選作者黃綠色磷氯鉛礦的平坦六角晶體端面，散布於淡色粗顆粒礦底：端面凸起、較滑，保留六邊直線、不同方向／大小與近乎平坦頂面；不是綠色 Smithsonite 葡萄狀圓頂、紅色 Red Beryl、圓斑或方晶片。本 preset 只近似六角柱的端面，不生成完整稜柱／桶狀晶體、針晶、晶簇 mesh 或透明折射。完整重用既有 Red Beryl constructor／逐點 evaluator，只以 kind 選 preset，不新增逐點配置、hash、三角函數或搜尋。6×6×8 poses 加 8² cloud 與 128² grain，共 16,736 Float64／133,888B tables，非總 RAM；最遠支撐 (0.18＋0.13)/sqrt(0.75)＋0.10=0.457958＜0.5，不越 owner。0.1m nominal tile、0.0048 UV-relative relief 與黃綠配色為作者近似，不是標本色彩／尺寸量測。維持 opaque dielectric、預設 metallic=0、height／tint／repeats／明確因子 override、Worker／cache 與獨立 texture ownership；不提供化學／XRD 鑑定、礦物成因／來源或含鉛安全認證。

沿用並擴充 Red Beryl fixture 為兩礦 16 項行為，保留原 Red Beryl 色族／形狀／normal bounds，刪除最多17個 owner 的容量型 pin。觀察實際六角邊直線 fit／六重與對邊對稱／方向多樣性、平坦凸端面與 host finish、實際512五張 opaque M0 圖、8192點×三 seed signed UV；六通道 C1 的 height 按 relief 正規化，另沿實測 AO 最大／最小平台二分定位外 support／flat-core 輪廓，不複製 private pose／hash／hex sampler 方程。舊96點 centroid 在五cell合法變體誤判直邊 fit0.013277，改192點後各 seed 最大0.008278–0.009123，仍保留0.013 bound；8組鄰近合法變體各16項通過，22組錯色、finish／relief、大小／密度／owner越界、非六角／同向／圓頂、缺lift／host細節、metal、linear shoulder與tiny height C0由真 assertion 拒絕。805舊材質3220條RGBA streams與七鄰近礦材32／512三seed的42組五圖逐byte不變，舊preset／tile／limits不變。

外觀參考為實讀 [Museum Wales — Pyromorphite](https://museum.wales/mineralogy-of-wales/database/?mineral=402) 的 hexagonal、綠色六角稜柱／lime-green／greasy luster 與 olive-green barrel-shaped 形態，並實看其 [Bwlch-glas 綠色稜柱標本原圖](https://museum.wales/media/26753/version-full/pyromorphite3.webp)。頁面 OpenGraph 圖是無關 linarite，未當成 pyromorphite；圖片網址由實際 gallery HTML 取得。只選作者黃綠六角端面，不把單一 specimen 代表全部形態，不拷貝照片或烘入其光影，不重現長柱／桶狀身體或真正透明性。

`kingwood` 選作者深紅褐心材的磨光近直縱切面：不等寬紫黑細縱紋與木底平齊，只有稀疏短導管較凹、暗、粗；不是奶油粉紅 Brazilian Tulipwood、琥珀褐 Macassar、純紫 Purpleheart、等寬 pinstripes、凸木肋或照片中的山形／節眼／黃色邊材。只擴充既有 Macassar／Tulipwood／Zebrawood／Bocote constructor 的 fineStreaks／streakPreset 選擇，完整逐點 evaluator 逐字不變，不新增逐點配置、hash、三角函數或搜尋。參數集中 `src/data/materials.ts`；32×20×4 pore cache 加 32×4 warp、36×4 width、64×4 fiber 與 128² grain，共 19,472 Float64／155,776B tables，非總 RAM。最寬 band support 0.3×(0.18＋1.25)=0.429＜0.5，pore 的 x support 在 0.17–0.83、y 在 0.08–0.92 cell 內，owner 不截斷。0.24m nominal tile、0.0016 UV-relative relief 與染色為作者近似，非木紋量測。維持 opaque dielectric、預設 metallic=0、height／tint／repeats、Worker／cache 與獨立紋理銷毀；不提供木板／樹 mesh、老化／油脂／物性／毒性、現行法規／合法採購、來源或木種認證。

沿用並擴充既有四木種 fixture 共 32 項行為，觀察實際色紋方向／不等寬、共面底、稀疏凹導管與 roughness 差、實測 AO contour／pigment curvature 的六通道 relief-normalized C1、signed UV，以及實際 512 opaque M0 五圖配色／normal／height／導管連通分量。不複製 private pose／hash／木紋方程，也不新增預設 counts pin。8 組附近合法 dye／roughness／relief／band 密度與寬度各 32 項通過；19 組錯色、finish／relief、缺失／越 owner／短圓導管、缺 depth／contrast、凸起 grain／pigment、橫紋／等寬條紋、metal、linear shoulder 與微小 height C0 對照皆真 assertion 拒絕。804 舊材質的 3216 條 RGBA streams 與七鄰近木材 32／512、三 seed 共 42 組五圖逐 byte 不變，舊 preset／tile／limits 不變。

形貌依據為實讀 [The Wood Database — Kingwood](https://www.wood-database.com/kingwood/) 的 dark purplish or reddish brown／darker black streaks、usually straight／fine uniform texture／high natural luster／high polish，以及實看原色與 finished flat-sawn、finished quarter-sawn 三張各 450×900 縱切圖。只選近直心材與作者深紅褐／紫黑近似，不拷貝照片或烘入光照、不量測色彩或尺度、不重現山形／節眼／黃邊材；未把縱切面冒稱為 endgrain 鑑種，也不與外觀近似的 Camatillo／Mexican kingwood 作認證區分。引用的是該頁外觀文字與圖片，不使用搜尋摘要的舊密度數據，亦不作木材法規或毒性認證。

`faille` 是象牙白平紋橫棱織物：細密經紗與較寬、較平的單根緯棱逐根一上一下交錯，保留低凹不透明紗隙、真實交叉抬升及細纖維；不是 Ottoman 的成對粗棱，也不是平衡經緯的 batiste。新材質只在既有連續紗線 sampler 的建構期選擇較平緯冠；整個逐點 evaluator 原樣重用，沒有新增逐點配置、hash、三角函數或搜尋。顏色、粗糙度、relief、紗線密度／支撐與緯冠均在 `src/data/materials.ts`，名義 tile 為 0.03 m，不是實測密度或纖維尺寸。維持 opaque、預設 metallic=0、可覆寫因子、height／tint／repeat、Worker／cache 與各自紋理銷毀契約；不提供透布、布料厚度／垂墜模擬、各向異性或纖維成分認證。

既有 Poplin fixture 擴為兩材質共 18 項可見行為檢查，刪除舊的精確 gap 高度／色值／AO 與固定像素預設 pin，改驗交叉顯紗、相對抬升／遮蔽、較平緯棱、獨立 UV 掃描的經緯密度與寬度關係、實際 512 五張 opaque/M0 圖、象牙白／粉紅配色、粗糙度／normal relief、三 seed signed UV 週期及六通道 C1（height 按 relief 正規化）。8 組鄰近合法參數全部通過，20 組錯色、錯 finish／relief、平衡／倒置密度、錯紗寬、圓緯冠、漏選緯冠、錯交錯／lift／AO、金屬與微小高度 C0 對照均由真正 assertion 擋下。803 種舊材質的 3212 條 RGBA byte stream，以及 7 種鄰近織物在 32／512、三 seed 下的 42 組五圖輸出完全不變；未改舊 preset、tile、limits 或公開選項。

參考 [Mood Fabrics 的 White Asparagus Faille 商品說明與實際近照](https://www.moodfabrics.com/products/white-asparagus-cotton-and-polyester-faille-fc25771)（已閱讀、檢視 1001×1001 近照；米白橫棱、matte 混紡選項，商品亦指出略透）與 [Faille 的平紋／粗緯、扁棱二手整理](https://en.wikipedia.org/wiki/Faille)。此為自行調色、尺度與起伏的 opaque 即時近似，未拷貝商品照片或烘入其光影；不主張照片色彩／實物密度校準、特定品牌、棉／絲／聚酯含量或略透能力。

`celestine` 選作者淡藍色平坦寬板狀天青石與中性粗礦底：5×5組各三片局部平行、錯開端部的凸晶面，比礦底亮滑；不是奶油Barite、橙色近方Wulfenite、深藍細長三條raised striae的Kyanite或圓帽。只加kind／preset選擇，完整既有Barite／Kyanite evaluator逐字不變，保既有stria cosine，不新增逐點配置／hash／鄰格搜尋或runtime依賴；802舊kind32px四maps與七相鄰礦材32／512三seed五maps逐byte不變。25×6 cached poses＋128² grain共16,534 Float64／132,272B tables，非總RAM；最遠角點sqrt((0.18＋0.083)²＋(0.27＋0.12×0.083)²)×0.96＋jitter0.04＝0.408754＜0.5，owner切換不截斷板面。0.1m nominal tile、0.0025 UV-relative relief及淡藍palette為作者近似，不是標本量測、m晶片厚度或校準礦物光學。Opaque M0、optional height／tint／repeats／Worker／cache及獨立texture ownership不變；不新增transmission／refraction、真晶洞／晶簇mesh、纖維狀／prismatic形、元素／鑑礦／來源／價值或安全認證。 既有四礦觀測fixture共24項，以nested describe.each共用Barite／Celestine寬板形狀與512五RGBA packing、分別驗奶油／淡藍色族。真color連通分量／PCA框、局部平行組、fill、aspect、同component eroded flat core、lift／finish及normal／AO皆量輸出，不複製private pose／hash／plate方程；新5cells解析度以3px erosion對應舊Barite4px，橙色Wulfenite仍2px，舊kind不放寬。Shared六channel relief-normalized C1沿觀測AO輪廓、owner／grain／signed邊界與實際曲率自適應細分，signed UV全channel亦驗。八合法變體各24項通過，19個真assertion負對照拒cream／orange／dark-blue／neutral-white palette、matte／mirror、近無／過大relief、窄blade、tilted／raised-stria top、越owner、同向／圓形、linear肩、無lift／rough host、metal及tiny height C0。

形貌參考：[Museum Wales — Celestine](https://museum.wales/mineralogy-of-wales/database/?mineral=175&name=Celestine)記載pale-blue bladed及tabular blue，實看其[NMW 61.152.GR.5，1024×666標本圖](https://museum.wales/media/26699/version-full/celestine1.webp)；[A. E. Seaman Mineral Museum — Celestine](https://museum.mtu.edu/pdfs/CELESTINE.pdf)主文另記pale-blue、milky、tabular及parallel growths（只實讀文字，不宣稱已看PDF圖）。只選作者淡藍寬板面，不複製／打包照片／照明或量測色彩／尺寸，不重建標本晶洞、透明玻璃光學、沉積成因或XRD／化學鑑定。

`braziliantulipwood` 選作者磨光巴西鬱金香木縱切面：奶油黃底與不等寬粉紅紅色近直縱紋維持平齊，只有稀疏短導管較凹、暗、粗；不是美洲Tulip Poplar、Macassar黑紋、橫紋、等寬pinstripes或凸木肋。完整沿用Macassar／Zebrawood／Bocote核心，只在constructor選fineStreaks與streakPreset／warp cache尺寸，逐點evaluator逐字不變；801舊kind32px四maps及七相鄰木材32／512三seed五maps逐byte不變，不增逐點配置／hash／trig／sqrt或runtime依賴。32×20×4 pore poses、24×4 warp、28×4 width、64×4 fiber及128² grain共19,408 Float64／155,264B tables，非總RAM；pore半寬至0.08＜0.25 owner margin、半長至0.27＜0.35，compact C1 shoulders與整數periodic caches保signed UV。0.12m nominal tile、0.0016 UV-relative relief與pink／cream palette為作者近似，非標本量測、m厚度或材種鑑定。Opaque M0、optional height／tint／repeats／Worker／cache及獨立texture ownership不變；不新增整塊板材／樹木mesh、老化／油脂／硬度／毒性、法規／來源／價值或合法採購認證。 現有Zebrawood／Macassar describe.each擴為三kind24項，保舊兩種色彩／形狀bounds。以真sampler低AO定位導管、真color掃描不等寬紋、方向差分及實際512連通分量量長短，不抄private hash／pore／band方程。C1 checker按relief正規化height，pigment helper改觀測六channel curvature自適應細分，刪原incidental contour／candidate數assertions及死計數，不重新pin。八合法變體各24項通過，18真assertion負對照含缺色／缺紋、等寬、無孔／深度／microheight、錯finish／橫孔／越owner、凸紋／橫紋／metal、linear pore／hard band肩及tiny height C0。等寬control原逃過舊0.002 bound；先觀測各seed與合法變體，實際等寬noise寬差0.002197對照作者0.009521–0.016113／合法最小0.008057，再為新kind驗大於0.005的可見寬差，舊兩種bound不變。

外觀參考：[The Wood Database — Brazilian Tulipwood](https://www.wood-database.com/brazilian-tulipwood/)描述yellow／red／orange／pink變化、通常直紋、fine texture與可磨光；已實看其兩張600×600[sanded縱切](https://www.wood-database.com/wp-content/uploads/tulipwood.jpg)及[sealed縱切](https://www.wood-database.com/wp-content/uploads/tulipwood-sealed.jpg)。本preset只取作者粉紅紅縱紋與奶油色底，不複製／打包圖片或照明、量測色彩／尺度，不重現照片節眼或從縱切面套用endgrain分類；不是同名American Tulipwood，也不認證Dalbergia木種、CITES現行法規、合法來源或油脂／安全物性。

`batiste` 選作者象牙白細棉平織面：60×60條均衡經緯以一上一下交織、240×240微纖維帶細緻normal，兩軸同色同高度、交點上浮、紗間不透明凹底；不是Poplin橫肋、Ramie較深粗凹凸、長浮緞、印色方格、紗網真洞或起毛絨。沿用完整連續紗核心，只把constructor ramie旗標正名balancedPlain並選preset；逐點evaluator逐字不變，800舊材質32px四maps及七相鄰織物32／512三seed五maps逐byte不變。僅128² noise共16,384 Float64／131,072B tables（非總RAM），不配置float-profile／pose表或增加逐點配置／hash／trig／sqrt。偶數60條、整數240fibers／128grain維持signed UV period；radius0.42＜0.5、lift shoulder在owner邊界前歸零。0.04m nominal tile、0.0002 UV-relative relief與roughness0.72為作者近似，不是量測紗支／克重、物理厚度或絲光處理。Opaque M0、optional height／tint／repeats／Worker／cache與獨立texture ownership不變，不新增半透明透光、布片／皺褶／蕾絲mesh、異方性BRDF、洗滌／透氣／纖維或安全認證。 現有Ramie fixture以describe.each配對新kind，共13項而非另一套方程測試。驗雙向交織上下切換與旋轉對稱、實際32／512白紗／陰影／roughness／四向細normal及五RGBA opaque；height按relief正規化C1，加實測curvature細分，不複製private weave方程或限制偶發probe數。八合法附近preset各13項通過，15個真assertion負對照拒錯色、深刻／無height、鏡面／chalk、暗紗／單軸染色、無lift／無交替、open mesh、hard／linear肩、metal及tiny height C0。

外觀及組織參考：[Cotton Incorporated — Cotton Batiste Fabric](https://thefabricofourlives.com/cotton-fabrics-batiste/)記載lightweight plain weave、mercerized cotton與表面光澤，已實看其[800×800白色衣料近照](https://thefabricofourlives.com/wp-content/uploads/2025/09/batiste-fabric-square.jpg)；[Cimmino — Cotton Batista Fabric](https://www.cimmino.com/en/cotton-batista-fabric-features-uses-and-choice-guide-for-tailoring-and-shirtmaking/)亦記載fine yarns與1:1組織。只選細白平織面，不複製／打包照片、蕾絲／衣褶或量測色彩、密度、克重，不把參考文的semi-transparent、衣料用途或認證冒稱引擎能力。

`wulfenite` 選作者橙色近方形板狀鉬鉛礦：不等大小、分散方向的平坦凸晶面比深褐粗礦底較亮、較滑，不是圓頂、窄藍blade、規則三片Barite或印色方塊。獨立leaf沿用cached seeded poses／periodic noise／smooth compact shoulders，7×7 sites各七個Float64，加128² grain與16² host共16,983 Float64／135,864B tables（非總RAM）；chance0.68不保證每seed相同晶數。最大旋轉角點支撐sqrt(0.22²＋(0.22×1.08)²)＋jitter0.16＝0.483812＜0.5，owner切換不截斷晶面；肩部以平方距離smooth乘積形成，中心無abs cusp，逐點不配置、不hash、不trig／sqrt或掃鄰格，constructor預存倒平方、方向與tone。0.06m nominal tile、0.003 UV-relative relief及橙palette為作者參考，不是標本尺寸、m單位晶片厚度或校準光學。Opaque M0、optional height、tint／repeats／cache／native Worker及獨立texture ownership沿用原契約，不新增透明／折射、真晶體／礦簇mesh、雙錐形、鉛化學／毒性或礦物／產地／價值／安全認證。 既有Barite／Kyanite觀測fixture擴為18項，舊兩種sampler／preset／tile不變。由真color／height連通分量及最小面積旋轉包圍矩形推量近方形輪廓，避免正方形PCA特徵值相等時方向失真；實測填滿率、aspect、不同size／方向、同component erosion flat-core、lift／finish及32／512五maps，不複製private hash／pose／方形方程。六channel C1按relief正規化height，沿實測AO輪廓與實測曲率細分，移除原incidental boundary-count assertion；另驗signed UV periods。八合法附近preset各18項通過，23個真assertion負對照擋住錯色、finish／relief、缺晶／等大小／長條／圓形／同向、跨owner、linear／hard肩、圓頂／無lift、遺失host粗糙／AO或face AO、metal與小height C0。

形貌參考：[Australian Museum — Wulfenite，D.50729](https://australian.museum/learn/minerals/mineral-factsheets/wulfenite-mexico/)及[Western Australian Museum — Wulfenite，M178.1985](https://museum.wa.gov.au/research/collections/earth-and-planetary-sciences/mineral-collection/wulfenite/)。實讀blocky／tabular外形與橙色、深色礦底說明，實看AM 1200×779與WA 700×400標本圖；只選近方形板面，不複製／打包照片／光照或量測色彩／尺寸，不重現完整標本、雙錐晶形或透明光學。

`lignumvitae` 選作者深橄欖褐磨光癒創木縱切面：細密長木理與柔和交錯明暗維持平齊，只有稀疏短導管較凹、較暗、較粗糙；不是金褐Iroko、鮮紅Bloodwood、紫色Purpleheart或誇張斑馬條紋。沿用完整Iroko／細木理核心，只增constructor kind／preset選擇及未用generic detail排除，逐點evaluator逐字不變；798舊kind四maps與七個相鄰木材的32／512三seed五maps逐byte不變，不新增逐點配置／hash／trig／sqrt或runtime依賴。32×20×4 pore poses、3×4 warp、256×10 fiber與128² grain共21,516 Float64／172,128B tables，非總RAM。最大pore半寬0.06小於0.25 owner margin，半長0.21小於0.35；band支撐0.46＜0.5、整數5 bands與periodic caches維持C1及signed UV週期。0.12m nominal tile、0.002 UV-relative relief、roughness0.32及olive-brown palette為作者參考，非木纖維尺寸、m單位厚度或量測光澤。Opaque M0、optional height、tint／repeats／cache／native Worker及獨立texture ownership不變；不新增木材／導管mesh、透明孔洞、油層／清漆層或方向性BRDF，不認證木種、端面解剖、Guaiacum／替代材鑑定、油脂／密度／自潤滑物性、產地或合法採購。 與Iroko共用十項consumer cases，原Iroko邊界保留；從實際AO搜尋導管輪廓／core並量測長寬比、深度、較暗粗糙孔壁、平齊木理與方向性，不複製private hash或site座標。六channel C1按relief正規化height並重用實測曲率自適應細分；另驗五maps opaque／M0、指定色調／polish、shallow normal及signed periods。八個合法附近preset各十項通過，24個真assertion負對照擋住錯色／finish、缺孔／密孔、圓孔／跨owner、浮凸木理／導管、linear／hard肩、metal、遺失AO／roughness、非閉合bands、小height C0及未解析／過強normal。

外觀參考：[The Wood Database — Lignum Vitae](https://www.wood-database.com/lignum-vitae/)記載olive至dark green/brown、細緻交錯木理與可磨光天然光澤；已實看其[Guaiacum officinale縱切scan](https://www.wood-database.com/wp-content/uploads/guaiacum-officinale.jpg)及[Guaiacum sanctum flatsawn scan](https://www.wood-database.com/wp-content/uploads/guaiacum-sanctum.jpg)。只選作者細木理橄欖褐縱切外觀，不複製／打包圖片、校準色彩／尺寸、模擬老化或由端面solitary pores宣稱鑑種；不是木材採購或物性認證。

`sateen` 選作者象牙白、五枚緯面棉緞：5×5組織內每列／每欄一個孤立經組織點，以2步飛數分散接結，其餘四格為跨四根經紗的連續緯浮長；不是鄰接斜紋、平織、逐交點凸珠或既有紫色經面Satin。只在constructor選preset，將原fineTwill旗標正名為fineCloth以涵蓋緞組織，完整逐點evaluator不變；797舊材質32px四maps與七個相鄰織物32／512三seed五maps逐byte不變。55×55紗、220×220微纖維與5×5×6 float profiles加128² grain共16,534 Float64／132,272B tables，非總RAM；55為5的倍數使draft在UV接縫閉合，且避免最低32px的all-gap alias，沒有依解析度特判。支撐半徑0.495＜0.5、連續浮長與C1紗肩沿用既有核心，不新增逐點配置／hash／trig／sqrt或runtime依賴。0.04m nominal tile、0.0008 UV-relative relief、象牙白與roughness0.45為作者參考，不是量測紗密、厚度、校準染色或光澤。保持opaque M0、optional height、tint／repeats／cache／native Worker及獨立texture ownership；不新增紗線／布片mesh、透射、垂墜物理或方向性BRDF，不認證棉含量、纖維、織物等級、整理工藝或耐久。 測試由實際height曲率推量前景紗向，不複製private draft、hash或lift方程；允許2／3合法飛數、不同接結phase及50紗等附近合法preset。從實測接結定位四紗浮長的中間owner，驗凸起不中斷，並檢查六channel C1（height按relief正規化）、signed periods及32／512 opaque五maps、象牙白覆蓋、finish與已解析normal。正式12項行為fixture接受八個合法變體、拒絕21個真assertion負對照，涵蓋錯組織／面向、逐點珠狀lift、C0／linear shoulders、色調、金屬、finish、relief及不閉合draft。

組織參考：[CottonWorks — Basic Woven Fabric Designs](https://cottonworks.com/learning-hub/weaving/basic-woven-fabric-designs/)、[Sateen](https://cottonworks.com/encyclopedia-item/sateen/)與[Counter (Satin)](https://cottonworks.com/encyclopedia-item/counter-satin/)。已實讀定義與五枚／2或3飛數說明，並實看其FABRICAST 7258 Sateen照片及緯面組織圖；本文只選五枚緯面棉緞，不把Sateen所有命名都限定為本組織。不複製／打包圖片、照搬光照或量測色彩／紗密。

`parallelkeys` 近似雙圓端Form A平鍵的俯視外觀：銀灰實心長條具有平坦寬面、平行側邊與兩端圓弧，平滑邊肩連到暗色較粗糙的非金屬底，不是圓柱、橢圓、方端棒、空心環或Woodruff半月鍵。沿用既有硬體的seeded pose與cached grain模式，以到直線段的平方距離形成有界capsule支撐；逐點不配置、不hash、不trig或sqrt，沒有新增runtime依賴。4×4 poses各六個Float64加96² grain，共9,312 Float64／74,496B tables（非總RAM）；最長旋轉支撐乘最大scale再加jitter上界0.399525＜0.5，owner切換不截斷平鍵。0.12m nominal tile與0.003 UV-relative relief為作者參考，不是CAD尺寸或m單位displacement。金屬頂面與M0底保持分離，factory的metallic factor預設1以保留map，明確override0仍有效；保持opaque四maps、optional height、tint／repeats／cache／native Worker及獨立texture ownership。不新增平鍵mesh、keyway裝配或力學，不認證DIN尺寸／公差、C45鋼種、熱處理、扭矩或安全。 相關Woodruff sampler完全不變；共用consumer fixture從真metal mask的連通分量與PCA推量輪廓、凸起及flatness，兩端實測寬度收窄而中段維持平行寬度，容許兩個橫向raster pixel誤差，不複製private pose／hash或capsule方程。另沿實測輪廓與flat-core肩界驗六channel C1，height依relief正規化。

外觀參考：[Gardette「Parallel key with 2 rounded ends / DIN 6885 Form A」](https://gardette.com/en/catalog/parallel-key-with-2-round-ends)。已實讀主文並實看整件與圓端近照；只參照平坦雙圓端長條外觀，不複製／打包照片、光照或表面刻紋，也不把廠商規格當作本程序面材的尺寸／強度認證。

`smithsonite` 選取作者蘋果綠葡萄狀菱鋅礦外觀：不等距圓頂連生成一層有界凸礦殼，圓頂較亮、較滑，凹隙則是較暗、較粗糙的綠底；不是平面綠斑或天藍／淺色凹隙的Hemimorphite。沿用完整平滑連生圓頂核心，只在constructor選preset並排除未用generic detail，不增加逐點配置、hash、trig、sqrt或runtime依賴。0.12m nominal tile與0.006 UV-relative relief均為作者參考，不是實測晶粒尺度或m單位displacement。維持opaque M0及既有height／tint／repeats／cache／native Worker與獨立texture ownership；未增加透射、折射、色散、clearcoat或晶體mesh，也不認證礦物鑑定、化學、產地或物性。 100個cached sites各五個Float64，加128² grain、5×7及17×19 tone fields，共17,242 Float64／137,936B tables，非總RAM或100顆可見獨立晶體的保證。最大radius0.74加jitter0.26為1.0＜1.5，保留3×3鄰域halo margin；normalized layer ceiling0.643，不把重疊圓頂高度相加。相關Hemimorphite的point evaluator、舊preset及tile保持不變；兩kind共用實測圓頂／連通性、凹隙明暗及finish、六channel曲率與signed-period觀測，不複製private seed或footprint方程。

外觀參考：[Australian Museum「Smithsonite on Cerussite」，D.50652](https://australian.museum/learn/minerals/mineral-factsheets/smithsonite-on-cerussite/)及[NMNH／Smithsonian「The Ultimate Honor」](https://www.smithsonianmag.com/blogs/national-museum-of-natural-history/2024/06/18/the-ultimate-honor-why-a-colorful-mineral-honors-the-smithsonians-namesake/)。實讀文字並看過兩張綠色標本圖；只參照圓潤連生外觀，不複製／打包照片或校準其色彩、光照、透明度，也不把作者綠色凹隙當作露出的白鉛礦解剖。

`macassarebony` 近似作者深褐底、近黑不等寬縱紋的磨光馬卡薩烏木縱切面，細密稀疏導管略凹、較粗糙且遮蔽較強；色紋維持平齊，非刻槽、拼板縫、Zebrawood淺金底或Bocote閉眼紋。沿用完整Bocote／Zebrawood核心，constructor依kind選preset與32×4 warp cache，舊兩kind保留3×5；逐點evaluator逐字不變。32×24×4 pores、32×4 warp、32×4 width、64×4 fiber及128² grain共19,968 Float64／159,744B tables（非總RAM）；最大band支撐0.39＜0.5，各帶符號shoulder方程的u導數下界1.76＞0，導管最大半寬0.06／半長0.31均留在owner內。取樣不新增配置／hash／trig／sqrt或runtime依賴。0.18m nominal tile、0.0016 UV relief與深褐palette為作者參考，非量測年輪、木纖維尺寸或m單位displacement。Opaque dielectric／M0、optional height、tint／repeats、Worker／cache及caller ownership沿用原契約；不新增木板／導管mesh、透明孔洞、清漆層或方向性BRDF，不認證木種、端面解剖／礦物填充、力學／耐久、產地／合法採購或安全。相關Zebrawood測試改依實際表面觀測，不複製私有hash／noise。

外觀參考：[The Wood Database — Macassar Ebony](https://www.wood-database.com/macassar-ebony/)記載黃至紅褐心材、深褐／黑條紋、通常直而偶交錯的木紋、細緻均勻材面與天然光澤；其發布的[sanded scan](https://www.wood-database.com/wp-content/uploads/macassar-ebony1.jpg)及[sealed scan](https://www.wood-database.com/wp-content/uploads/macassar-ebony-sealed1.jpg)皆已實看。本preset選深色、近直的縱切條紋，不複製／打包圖片或量測其色彩、尺度、塗裝，也不重現文中端面導管分組或作解剖鑑定。

`serge` 近似作者藏青霧面嗶嘰2/2斜紋：同色經緯逐列移一紗，兩軸皆兩上兩下的連續短浮長，較寬柔和紗肩帶微grain；不是印色斜線、逐點凸珠、1/1平織或3/1經面。只在constructor選preset／fineCloth，重用完整Surah／Lyocell核心，逐點evaluator逐字不變。52×52紗／208×208細纖維頻率與四步draft，4×4×6 profiles加128² grain共16,480 Float64／131,840B tables（非總RAM）；半徑0.495仍在thread owner內，保留C1肩與signed週期，不新增逐點配置／hash／trig／sqrt或runtime依賴。52紗避開最低32px全部取到紗縫的alias，不加解析度特判。0.04m nominal tile、0.004 UV relief及藏青palette為作者參考，非實測紗密、纖維尺寸、m單位厚度或校準染色。Opaque dielectric／M0、optional height、tint／repeats、Worker／cache及caller ownership不變；不新增羊毛毛羽mesh、雙面衣片／垂墜／透射物理或方向性織物BSDF，不認證成分、制服等級、保暖、耐久、阻燃或聲學性能。

形貌參考：[TRC Leiden — Serge](https://trc-leiden.nl/trc-needles/textile/materials/woven-and-interlocking-materials/serge)說明雙面斜紋；[Paisley Museum／OneRen — 2/2 Twill Weave](https://www.oneren.org/culture/paisley-museum/heritage-on-your-doorstep/we-are-weavers/2-2-twill-weave/)說明兩上兩下、逐列移一紗。已實看[Hainsworth True Heritage](https://shop.hainsworth.co.uk/products/true-heritage)的606 Navy Serge發布照片1414×2000，取深藏青織物外觀，不複製或打包原圖。選定2/2不代表所有嗶嘰皆如此，也不以照片證明精確交織、量測色彩／roughness／尺寸或認證性能。

`garterstitch` 近似作者暖奶油色搓板針表面：橫向柔和凸脊帶交錯圓弧purl crowns及較低return arcs，同色微grain與輕微seeded course wander；不是直線V／bar針法圖、印色條紋、垂直rib、點狀seed stitch或金屬。獨立leaf使用既有cachedNoise／smooth／compact ellipse-ring與半平面肩部，保留三個前弧及兩個半cell鄰接return支撐，product union／exposed underpass避免max crease。24欄／20脊、96² grain加24×20 course field共9696 Float64／77,568B tables（非總RAM）；整橢圓保守row支撐0.465660＜0.5、course半寬0.49＜0.5、水平outer support0.576906小於被丟棄鄰弧的最近距離1，取樣無新增配置／hash／trig／sqrt。作者名義tile為0.12m，實際height／normal提供凸紋，非靠色印；opaque dielectric／metallic 0、optional height、tint／repeats、Worker／cache及ownership沿用原契約。不建立完整互套紗線或fuzz mesh、不模擬彈性／垂墜／雙面衣片，不做纖維成分、針數實物量測或BRDF認證；不更動原Seed Stitch或Rib Knit。

形貌參考：[Emily Wessel／Tin Can Knits — Garter Stitch, Stockinette Stitch, and Ribbing](https://blog.tincanknits.com/2013/06/14/basicstitches/)說明平面往返編織每列knit、圈織交替knit／purl，並區分直向ribbing；其Marshmallow mitts及Malt blanket邊緣兩張發布照片已實看，取橫脊與圓弧針圈，不複製照片、光照、款式、色彩或實體針距。來源的柔軟、彈性與雙面外觀不是本2D材質具布料物理的證明。

`woodruffkeys` 近似散置的銀灰色實心半月鍵平面：一條直弦與一段圓弧圍出較淺圓缺，種子改變各件方向、位置、尺寸與微小明暗；不是圓幣、三角片、長圓孔或有孔墊圈。以既有periodic cachedNoise／hash／smooth組合圓與半平面compact C1肩部，平坦凸金屬面帶微弱grain，深色霧面底維持dielectric，並非透明空隙。constructor預存4×4×6 poses及96² grain，共9312 Float64／74,496B tables（非總RAM）；最大旋轉整圓加jitter支撐0.434＜0.5，owner切換不切件，逐點不新增配置／hash／trig／sqrt。作者名義tile為0.08m，opaque RGBA、optional height、tint／repeats、Worker／cache與texture ownership沿用原契約。預設material metallic factor為1，實際metal map分開金屬件與非金屬底，顯式override仍優先；不提供零件厚度mesh、軸槽裝配、負載／材質等級／DIN或安全認證，也不從照片校準尺寸、色彩或BRDF。

形貌參考：[mbo Oßwald — Woodruff keys DIN 6888](https://www.mbo-osswald.de/en/shop/woodruff-keys-din-6888)的實心零件照片及dimensioned drawing已實看，取直弦／圓弧平面形狀，不複製產品光照、倒角加工痕或組裝圖。[Woodstock Industrial — DIN 6888](https://www.woodstockindustrial.com/specs/din-6888)說明disc segment與flat top，表列例如h2.6／d7，顯示圓缺不必恰為半圓；此preset是作者輪廓與名義tile，並未取得標準全文、驗證公差或認證任何廠商零件。

`barite` 近似選定不透明淡奶油色板狀重晶石表面：每組三片局部平行、錯落端部的較寬四邊晶板，晶面幾乎平坦且較磨砂棕礦底光滑；不是細長藍色Kyanite三凸脊、圓凸cap、規則瓷磚或平面印色。共用既有Kyanite完整blade sampler，僅將原0.05斜面與0.08紋脊高度係數移入其preset並在constructor捕捉一次，Barite選0／0.002；舊Kyanite數值、乘法順序與輸出保留，沒有新合成器或新增逐點配置／hash／trig／sqrt（沿用原有stria cosine）。4²×6 poses加128² grain共16,480 Float64／131,840B tables，非總RAM。最寬板半寬0.09小於nearest-blade owner半距0.095，旋轉bundle最大support加jitter約0.419992小於cell owner半寬0.5，smooth乘積肩及signed週期保留。0.08m nominal tile與0.003 UV relief為作者參考，非實測晶體尺寸、厚度或m單位displacement。Opaque dielectric／M0、optional height、tint／repeats、Worker／cache及caller ownership不變；不模擬透明／折射、真晶片mesh／礦簇標本、解理光學或玫瑰放射簇，不認證成分、產地、價值、密度、用途或安全。相關Kyanite舊private hash／pose重述測試以blind connected-face／PCA transverse profile檢查取代，辨別真三條凸起且較光滑紋脊，不保留實作oracle。

形貌參考：[A.E. Seaman Mineral Museum — BARITE](https://museum.mtu.edu/pdfs/BARITE.pdf)記錄不透明白色sprays、white tabular／bladed／comb plates及其他habit，不把它們視為單一標本。[Carlesmillan — 6158M-barite2](https://commons.wikimedia.org/wiki/File:6158M-barite2.jpg)與[Ivar Leidus — Cerro Warihuyn](https://commons.wikimedia.org/wiki/File:Barite_-_Cerro_Warihuyn,_Miraflores,_Huamalies,_Huanuco,_Peru.jpg)為透明／近無色板晶形貌；已實看前者960×909與後者500×750發布預覽，前者原圖429不算實看，後者為focus stack。不從透明照片冒稱本preset具透射，不複製光照／裂紋、不校準色彩或打包圖片。

`surah` 近似作者暖銅色、平衡2/2細絲斜紋表面：每列兩上兩下、逐列移一紗，兩軸皆兩pick連續短浮長，不是1/1平織、3/1經面、2×2成組籃織、逐交點凸珠或銅金屬。重用Lyocell所在完整織布取樣核心；constructor以fineCloth及kind對應preset選既有整run float profiles與同色經緯，逐點evaluator逐字不變。60×60紗／240×240細纖維、四步draft，4×4×6 profiles加128² grain共16,480 Float64／131,840B tables，非總RAM；不另增逐點配置／hash／trig／sqrt或runtime依賴。半徑0.495留在各thread owner內，保留C1肩與signed週期。0.015m nominal tile、0.0007 UV relief及暖銅palette都是作者參考，不是實測紗密、纖維尺寸、幾何厚度、m單位displacement或校準染色；預覽為opaque dielectric／M0，optional height、tint／repeats、Worker／cache及caller ownership不變。SILKNOW僅定義Surah為soft twilled silk，Première Vision的Silk Twill提供two-over/two-under參考且其實看照片為藍色；不據此宣稱所有Surah都2/2或暖銅色。沒有絲纖維成分／產地／手感／耐久／安全認證、真布料背面／垂墜／透射、方向性絲光或新sheen BSDF。 60紗保留四步repeat並避開64紗在最低32px時全部取到紗縫的alias；調整tile後作者nominal紗密不變，不對最低解析度加特判。

參考：[SILKNOW — Surah](https://skosmos.silknow.org/thesaurus/en/page/13)（soft twilled silk定義）、[Première Vision — Textile Glossary: Silkies／Silk Twill](https://www.premierevision.com/en/articles/76034207-ea4d-f011-8f7c-000d3a2e1c0a/textile-glossary-silkies)（2/2 silk twill文字與實看藍色細斜紋照片）。只參考交織結構，不打包圖片、照搬商品或把參考照片說成暖銅色Surah樣本。

`bocote` 近似選定黃金褐底、深褐近黑強對比紋與局部閉合眼狀figure的Bocote縱切磨光面；不是把所有Bocote都說成眼紋、木口解剖、規則貼上的同心靶心或凸環。重用Zebrawood完整取樣核心，僅constructor選kind對應preset；提高作者phase warp讓原本縱紋自然fold回閉合，深淺紋仍同一平面，只有稀疏短縱向導管凹下。16×8×4 pore表加3×5 warp、24×4 width、64×4 fiber及128² grain共17,263 Float64／138,104B tables，非總RAM；逐點無新增配置／hash／trig／sqrt或新合成器。最寬band support0.392小於phase owner半寬0.5；導管最大半寬0.06／半長0.31小於最近owner邊界0.25／0.35。沿用C1肩及signed週期，導管為surface appearance，不把endgrain的medium-to-large、few pores誤當縱切面圓孔圖。0.24m nominal tile及0.0016 UV relief為作者參考，不是實測紋距、孔徑、m單位位移或木材厚度。Opaque dielectric／M0、optional height、tint／repeats／Worker／cache及caller ownership不變；不模擬真導管geometry、方向性光澤或老化，不提供木種、木紋成因、含油／塗裝／耐久／力學／毒性／永續認證。使用 `await ProceduralMaterial.create('bocote', { seed: 7 })`。

外觀參考：實讀[Wood Database — Bocote](https://www.wood-database.com/bocote/)，其記錄yellowish brown body、dramatic dark brown to almost black stripes，常見eyes及figured／interlocked grain，但也存在plain straight grain；endgrain為diffuse-porous、medium-to-large且few，不表示縱面有同樣的圓孔／放射排列。實看其[sanded](https://www.wood-database.com/wp-content/uploads/bocote.jpg)、[sealed](https://www.wood-database.com/wp-content/uploads/bocote-sealed.jpg)與[flatsawn bookmatched](https://www.wood-database.com/wp-content/uploads/bocote-flat.jpg)照片，只選其中金褐深紋眼狀外觀，不重現bookmatch接縫或複製圖片、光照、尺寸／校色與商品性能。

`hemimorphite` 近似選定天藍色Hemimorphite連生葡萄狀礦殼：大小與位置不規則的圓凸caps跨cell接合，保留淡色凹隙與細粒表面，不是平面水玉、規則等大珠格、金屬銅粒或完整鐘乳石mesh。沿用既有cached C1 noise、compact圓形支持與加權globule慣例，但以3×3週期鄰格連接不同半徑的caps，normalized weighted height限制在單層，不能把重疊高度相加；既有Chrysocolla／Botryoidal Copper leaf不變。8²×5 poses加128² grain、5×7與17×19 frost共17,062 Float64／136,496B tables，非總RAM；constructor預算seed／半徑／權重，逐點無配置／hash／trig／sqrt，只共用一次normalization reciprocal。最大support0.72小於最短漏除鄰格距離1.26；C1肩、連生面與signed UV週期保留。兩頻率C1 pigment場避免單一格狀frost，實際AO map另防硬halo。0.12m nominal tile與0.008 UV relief為作者參考，不是標本尺寸校準、m單位geometry displacement或礦物厚度。沿用opaque dielectric四maps／M0、optional height、tint／repeats／Worker／cache及caller ownership；不模擬透明、折射、微晶閃爍、完整3D標本或認證礦種、產地、填充處理、成分、硬度、價值／安全。使用 `await ProceduralMaterial.create('hemimorphite', { seed: 7 })`。

外觀依據：實讀[GIA Fall 2002，pp.263–264的Hemimorphite from Congo](https://www.gia.edu/dam/migrated-assets/gems-and-gemology/pdf/FA02.pdf)，其實際記錄mottled blue／banded blue and white及botryoidal結構，並指出其中一件有填充物；不把這些cabochon的透射或處理情況套到本opaque礦殼。實讀Rob Lavinsky的[173448 attribution](https://commons.wikimedia.org/wiki/File:Hemimorphite-173448.jpg)與[199442 attribution](https://commons.wikimedia.org/wiki/File:Hemimorphite-199442.jpg)，實看前者600×458原圖及後者已刊250px thumbnail；後者原圖429不算看過。只參考藍色連生圓凸外觀，不複製照片、光照、校色／尺寸、完整標本或商業保證，也不把所有Hemimorphite都說成此形態。

`monkscloth` 近似選定奶油原色、四經四緯的粗Monk’s Cloth：32×32經緯紗以4×4籃織交替，每組四條紗仍有三道可分辨凹縫，單根紗連續跨四個交織點，不是Hopsack的2×2、單紗平織、斜紋、棋盤印色或合併寬帶。沿用既有whole-run float builder與取樣算術，只將constructor的Hopsack旗標延伸為basket並選對preset；8²×6 profiles與128² grain共16,768 Float64／134,144B tables，非總RAM，每點無新配置／hash／trig／sqrt或額外cache。32整數紗數可整除8步draft，半徑0.46小於owner半寬0.5，保留C1肩與signed週期。經緯同色；base color不烘焙假棋盤陰影，四紗方向與連續浮長由真height／normal顯示。0.03m nominal tile及0.0018 UV relief為作者參考，不是實際紗徑、7.5 count量測或m單位幾何位移。霧面opaque dielectric／M0與凹隙AO、選用height、tint／Worker／cache／repeats及ownership不變；不是透明孔、真紗線geometry、刺繡／punch-needle操作或cloth simulation。不宣稱所有Monk’s Cloth皆4×4，不複製Oxford雙紗與白guidelines，也不認證棉含量、品牌、密度、耐用、洗護／縮率或安全。

組織參考：實讀[Needlery／Nordic Needle的Monk’s Cloth介紹](https://needlery.org/guides/stitching-materials-guides/fabrics/monks-cloth/)，其明列四經、四緯形成float blocks；實讀[Zweigart 3528官方頁](https://shop.zweigart.de/produkt/3528-monks-cloth/)的商業布種metadata，並實讀及實看[Lakeside的raw粗織布面](https://www.lakesideneedlecraft.co.uk/zweigart-75-count-monks-cloth---raw-298687-p.asp)。Zweigart註明部分圖可能AI生成，本項不取其圖片作真纖維證據；Nordic Needle舊圖片TLS失敗也不記為看過。另實讀及實看[Oxford yardage](https://amyoxford.com/products/monks-cloth-yardage)明列約13 double threads／inch及每兩英吋白guide，藉此區分商品變體，不能從Monk’s Cloth名稱就斷言全是4×4。本preset僅選前述四紗奶油原色外觀，不打包照片或繼承商品操作／性能保證。

`hopsack`（藏青雙經雙緯籃織布）新增32×32經緯、兩軸各兩根一組的2×2籃織：每根紗線連續跨過兩個交織點，組內仍有凹縫區分兩根紗，不以棋盤印色、2/2斜紋或單紗平紋代替。經緯同色，重用既有whole-run cloth profile builder，不改取樣核心；128² grain加96個profile值共16,480 Float64／131,840 B，僅為table預算、非總RAM。0.016 m nominal tile與0.0025 UV relief為作者選定，不是實測紗徑或厚度。沿用opaque dielectric四maps、metallic 0、optional height、tint／repeats／Worker／cache及呼叫者ownership；凹隙不是透明孔洞，不新增布料geometry、模擬或纖維成分／透氣認證。

外觀參考：[De Oost — Hopsack Cloth Suiting](https://www.deoost.com/blog/hopsack-cloth-suiting)明列經緯各兩根一起編織；已實看其[藏青布樣原圖](https://images.squarespace-cdn.com/content/v1/59df58c946c3c4aa7173a4cc/1512208797229-DM72A90S64R6Q9NJ8VBX/Blue%2BHopsack%2BCLASSIC%2BWORSTEDS%2BCOLLECTION%2BHOLLAND%2BAND%2BSHERRY%2BHS%2B1165.jpg)。色盤、密度及relief是作者近似，不由照片校正光學或商品尺寸，不打包照片。

`basswood`（淺米色細密直木理椴木）近似選定Tilia americana未塗裝細砂磨縱向木面：均勻淺米白／淡褐色、低對比長直木理與淺micrograin，不是所有Tilia、端木解剖、粗黑導管、橫向curl、節疤、塗層或物種鑑定。已實讀Wood Database並實看raw／finished兩圖，只選raw外觀；來源實際稱diffuse-porous與endgrain medium／very numerous vessels，平滑縱面近似不等於樹種無孔。直接fallthrough重用正式NickelSilver兩cached affine field，只在constructor選p：96×4縱向長grain＋128² micrograin共16,768 Float64／134,144B為lattice算術預算，非總RAM／texture cache。較低pigment與relief係數、不同長grain方向與奶米色palette不是把金屬factor改0而保留原橫刷紋；既有NickelSilver全部鍵／值與point算術順序不變。每點兩cached lookups、無新逐點配置／hash／trig／sqrt／kind branch／neighbor scan，不引入zero-curl的Anigre無用欄位／第三cache或第二合成器。細grain的color／roughness與極淺height為砂磨木面shading，不是coarse grooves／凸條、true grain fiber或displacement。0.10m nominal tile與0.0012 UV relief作者選定，不是照片量測厚度；金屬map與default／createMaterial factor0、AO1／mortar0、四張opaque default maps與optional height沿用options／tint／Worker／cache／repeats／ownership。無runtime依賴／mesh／coatshader／木材物理、聲學、硬度、健康或解剖認證。 實際512 normal的極淺signed slope主要量化至127／128相鄰byte，不誇稱可解析較大凹凸；以raw height斜率方向交叉檢查normal、非放大relief換取視覺。

外觀參考：實讀[Wood Database Basswood](https://www.wood-database.com/basswood/)，實看其[raw縱向淺色木面](https://www.wood-database.com/wp-content/uploads/tilia-americana.jpg)與[finished較暖深色木面](https://www.wood-database.com/wp-content/uploads/tilia-americana2.jpg)，只選前者。來源明列pale white至light brown、面色大致均勻、growth rings subtle、straight grain及fine even texture；endgrain則為diffuse-porous、medium very numerous vessels，不採用搜尋合成的「無open pores」或「very small vessels」假設。原圖有局部平切弱弧紋，此preset選長直細理而非逐張重建cathedral／ray／vessel anatomy；不由照片光照反推真色／roughness或nominal tile／relief尺寸，不打包照片，不宣稱物種鑑定／硬度／力學／聲學／營養健康或塗裝認證。

`sphericalwashers`（凸球面朝上的不鏽鋼球面墊圈）近似選定form-C-style銀色完整圓環，刻意翻面展示向外遞降的凸球形座面；正常裝配朝上的平bearing面、配對D／G凹錐座、cupwasher向外升高的直錐壁與wavewasher三波起伏均不是此surface。Halder實際不鏽鋼產品圖及剖面已查看：剖面明示球面在正常裝配下方，故此kind必須明記翻面而非把flat top錯稱convex。25個固定中心owners只cache單環tone及128² grain，共16,409 Float64／131,272B field-table算術預算，非總RAM／texture cache。沿用正式annular squared-radius C1內外肩、低opaque dielectric背底及cachedNoise模式，真正球面採sqrt(R²-q)而非拋物面／反向cup cone／torus；幾何不同而保留短獨立case，不替舊cup熱路徑加profile dispatch或新closure。只在非空金屬面計一次必要sqrt及一次grain lookup，沒有逐點配置／hash／trig或鄰格掃描；R0.54大於outer0.36，整個支撐內根號項≥0.162，外支撐到owner半寬0.5留0.14。grain只改pigment／roughness，不把球面刻成同心槽；內高外低的完整金屬面M1、圓孔及背底M0、C1部分覆蓋與AO0.3／0.95相干，default與createMaterial factor1保留authored B。0.10m nominal tile及0.025 UV relief為作者選定、不是DIN尺寸或量測厚度。四張opaque default maps與optional height沿用options／tint／Worker／cache／repeats／ownership，不新增mesh真孔／knurled側壁／透光／配對零件／傾角補償／夾緊或接觸力學；沒有牌號／耐蝕／硬度／負載／DIN認證或照片打包。

外觀參考：實讀[Halder不鏽鋼Spherical Washers／Conical Seats](https://www.halder.com/gb/PM/Standard-Parts/Clamping-Elements/Spherical-Plain-Washers/Spherical-Washers-Conical-Seats-similar-to-DIN-6319-stainless-steel)，實看其[銀色三件產品照片](https://www.halder.com/ix_pim_assets/image/Foto_ArtGrp_png/all/IM0007762_Foto_ArtGrp.webp)、[form-C單件照片](https://www.halder.com/ix_pim_assets/image/Foto_png/all/small/IM0004067_Foto_small.webp)及[原始剖面圖](https://www.halder.com/ix_pim_assets/image/Zeichnung_png/en/IM0002187_Zeichnung_en.webp)。第一款是flat bearing面與下方球形座面，另兩款是凹錐座；本preset只選第一款翻面後的球面形狀，不將D／G座誤作凸球墊圈。另實讀[Elesa＋Ganter DIN6319 PDF](https://www.elesa-ganter.com/siteassets/PDF/EN/DIN%206319.pdf)的type／material區分，但不複製表格尺寸／硬度／力值作API保證。先前實讀Halder一般鋼版的Material section明說manganese phosphated，深色照片因此排除、不冒充bare conductor外觀；Kipp實讀406也不作已取得來源。銀色無覆層conductor為所選PBR interpretation，未由產品照校正roughness／光譜／microfinish；車紋／knurled perimeter、完整零件厚度與真實配合面不重建，不打包照片／技術圖或宣稱DIN／牌號／負載認證。

`mungbeans`（綠種皮、深綠圈白種臍乾綠豆）近似選定完整乾燥綠豆的種臍朝上表面：綠色種皮、窄深綠環及較長乳白種臍，不是奶白黑眼豇豆、紅豆、黑吉豆Vigna mungo、黃分瓣豆／熟豆／綠莢／芽。已實看USDA／APHIS SeedImages三豆原圖，來源稱cylindrical至rhombic、常有壓平端面；此preset採平滑圓橢圓凸帽的stylized approximation，不冒稱精準重建截平端面／wrinkle／dust-layer微結構或完整volume。直接fallthrough共享正式eye-pigmented bean sampler、constructor只選p，36格各cos／sin／底色三值與5×7 coat／128² grain共16,527 Float64／132,216B的field-table算術預算，非總RAM／texture cache。最大半長0.32小於owner半寬0.5、餘0.18；foreground兩cached lookups、低opaque背底早return，無新逐點配置／hash／trig／sqrt／kind branch／neighbor scan。halo與種臍只變pigment、不刻槽／穿孔／裂豆／凸種阜，height只為完整凸種皮，AO前景0.98、背底0.3；眼紋與種臍不改height／AO。0.045m nominal tile及0.018 UV relief是作者選定、不是量測豆粒厚度或實體位移。M0／mortar0、四張opaque default maps與optional height沿用options／tint／Worker／cache／repeats／ownership；無新mesh／runtime依賴，不提供植物解剖／品種鑑定／營養健康／光學／物理認證。

外觀參考：已實讀[USDA／APHIS SeedImages Vigna radiata](https://idtools.org/seedimages/index.cfm?packageID=2289&entityID=62947)，並實看其[三顆綠種皮、深綠種臍圈與白種臍原圖](https://idtools.org/seedimages/images/BAT002864_IMG0036.jpg)；原caption credit為Colorado State University, Department of Soil and Crop Sciences。來源明列green with white hilum、dark-green surrounding band、cylindrical至rhombic／常壓平端面及smooth至wrinkled／dusty白表層。只選綠色完整乾種子與可見色帶，非全部Vigna radiata品種；不由照片光照／scale推算真色、粗糙度或nominal tile／UV relief。Kew來源實讀為403，未當作已取得外觀證據；搜尋合成的flat／raised hilum對照、尺寸與植物生理敘述不採信。照片不打包／下載作texture，不新增split／sprout／blackgram alias或植物營養／健康契約。

`thomsonite`（粉紅／乳白同心眼紋拋光石）近似選定opaque粉紅與乳白眼紋切面，不涵蓋稀有綠黑變體、玄武岩宿岩或所有Thomsonite。直接fallthrough共用正式Orbicularjasper sampler，只在constructor選preset：36個中心／倒平方半徑／三或四色環數各四值pose，加96² grain與8² matrix，共9,424 Float64／75,392B的table／record算術預算，非總RAM／texture cache。最大半徑0.43加偏移0.04＝0.47小於owner半寬0.5（餘0.03），compact squared-radial裙緣讓色環在owner前退回完整基質；保留既有support內一次cosine，不冒稱零trig，但沒有新逐點配置／hash／sqrt／kind branch／neighbor scan。環只改color／roughness，height0.4＋0.004grain及AO1維持平齊，原Orbicularjasper所有參數／point算術不變。0.048m nominal tile與0.004 UV relief作者自選、非量測厚度；微height跨度最多0.000016 UV，actual512 normal可落在8-bit近flat量化底，不能聲稱看見凸環／凹槽。四張default opaque M0／mortar0 maps及optional height沿用options／tint／Worker／cache／repeats／ownership，無新增晶體／纖維geometry、透明、礦物生長、光譜／物理／地質認證或runtime依賴。

外觀來源：已實讀[Thomsonite Inn原始介紹](https://www.thomsonite.com/thomsonite)與[Rock & Gem Mark Leatherman文章](https://www.rockngem.com/radiant-minnesota-thomsonite/)，並實看其[粉紅乳白兩顆拋光標本圖](https://www.rockngem.com/wp-content/uploads/2019/02/TH2-300x225.jpg)及[綠黑眼紋標本圖](https://www.rockngem.com/wp-content/uploads/2019/02/TH1-300x225.jpg)，兩圖caption均為Bob and Nancy Lynch specimen。本preset只選前者的pink/cream外觀；照片有不規則融合與部分眼紋，本引擎獨立三／四色環是stylized interpretation，不是原標本重建或實測尺度。Inn的原圖已實看但展示宿岩內放射礦物、不是拋光finish證據；兩頁地質年代敘述不一致，不作地質／來源／稀有度／價值／化學／療效／光學／力學認證。圖像不打包，沒有Lintonite綠色alias。

`nickelsilver`（暖銀色細緞紋鎳銀合金片）新增略暖銀白色、長而不規則的細刷紋與淺微粒起伏，不是純銀／鍍銀、鍍膜、腐蝕氧化、錘凹或粗48道刻槽。重用正式C1 periodic cachedNoise builder及既有每preset一closure模式：4×192 brush和128² grain共17,152個Float64／137,216B lattice算術預算（非總RAM／texture cache），無逐點配置／hash／trig／sqrt／新kind branch／neighbor scan，原metal算術與data不變。0.025m nominal tile與0.0012 UV relief為作者選定、不是量測厚度；全opaque conductor的metallic map及`material`／`createMaterial()`預設factor均1、AO1／mortar0，四張default maps與optional height沿用options／tint／Worker／cache／repeats／ownership。方向微normal不等於新增anisotropic BRDF；不新增片材geometry、鍍層／光譜／組成／牌號／力學／物理認證或runtime依賴。

外觀來源：[Wieland Nickel-Silver Sheets and Plates](https://www.wieland.com/cn/products/sheets-and-plates/nickel-silver-sheets-and-plates)明列brushed等交付表面；已實看其[暖銀灰片材原圖](https://www.wieland.com/var/media/cache/image_3x2_col_6_lg/var/dam/celum/24742.jpg)，但圖片未標明精確finish／coating／微紋尺寸。本preset細刷紋尺度與方向是選定的藝術interpretation、非商品metrology。[實讀N17 datasheet](https://www.wieland.com/cn/content/download/43496/file/N17_global.pdf)列CuNi18Zn27／C77000／CW410J並說明Ni帶來white appearance，僅用來區別銅鎳鋅合金與元素銀，不把牌號／成分／機械性能／光學常數當引擎契約。已讀JPPlus的satin商品明說lacquered，Smiths頁同時列nickel與nickel silver，兩者均不作裸鎳銀finish照片證據。不打包照片、無商標alias。

`lyocell`近似選定細密、均一米色染色的Lyocell斜紋布表面：參考Core Fabrics原始商品頁與已實看的兩張布面圖，照片的大摺痕不烘焙為材質幾何。商品只標示twill而未列精確repeat；3/1四相斜紋是引擎明選的interpretation，不冒稱由照片／商品資料驗出。0.012m nominal tile、48×48經緯及經／緯各192的軸向fiber頻率，四行bitmask draft用既有Huckaback whole-run profiles保留三pick warp float跨owner連續抬升，而不是三顆逐交叉beads；經緯採同一染色tone，非丹寧雙色、Ramie1/1平紋或Huckaback稀疏浮紋。重用Poplin家族，不另建紡織合成器，只在constructor選preset／tone／profile mode；相關private local名稱泛化，全部舊data鍵／值及point算術順序保留。128² cached grain加4²×6個float-profile值合16,480 Float64／131,840B，僅為tables／records算術預算，不是總RAM或texture cache；不新增point variant branch／配置／hash／sqrt／trig／neighbor scan。選定smooth opaque dielectric織面，M0／無grout，保留四張opaque maps與optional height、tint／Worker／cache／repeats／ownership；UV relief0.0005不是m厚度，tile尺寸不是圖像實測。不新增cloth physics／drape mesh、shader anisotropy、Tencel品牌alias、纖維組成／物理／光學／強度／永續／OEKO-TEX／Pantone認證，也不打包參考照片。

外觀參考：[Core Fabrics Lyocell Twill - Beige](https://corefabricstore.com/collections/tencel/products/lyocell-twill-beige)，已實看其[聚摺布面原圖](https://corefabricstore.com/cdn/shop/files/Lyocell_Twill_-_Beige_Core_Fabrics.jpg?v=1734554991&width=2048)及[折疊布面原圖](https://corefabricstore.com/cdn/shop/files/Lyocell_Twill_-_Beige_Core_Fabrics_4195a237-47ea-4381-b90f-2879b3bad1bb.jpg?v=1734554998&width=2048)。僅取原商品材質名、細斜紋外觀與opaque選定風格；精確3/1 repeat、tile尺度與micro-relief是引擎選擇，不冒稱商品已提供該規格或通過環境／材料認證。不打包圖片，不把大布摺烘焙為貼圖幾何。

`tigerwood`選定Gonçaloalves／Astronium商品木中帶深色長紋的一張暖紅褐細木紋磨光面，不概括所有stock（原始來源也有無縞樣本）；不把商品別名另建公開kind。重用Snakewood的bounded bent-ellipse pigment union而非再建木材合成器，以7列×2行、兩slot、chance0.62及更長的0.48＋0.31長軸生成疏密不規則、略彎而非鱗片／短斑的深褐近黑長紋。三cached wood／fiber／micrograin fields為96×6、128×8、128²，合17,984 Float64；28個六scalar shape records再加168 Float64，兩者算術預算共145,216B，不是總RAM／texture-cache量。既有每point3×3 owner cells×兩slot候選迴圈保留，不宣稱沒有鄰格工作；不新增point variant branch／hash／sqrt／trig／配置。深紋僅染色，完整木面height／roughness／AO不被紋樣雕刻，M0／AO1／無grout，UV relief0.002不代表m厚度；0.18m nominal tile為引擎選定而非照片量測。保留四張opaque maps與optional height及既有tint／Worker／cache／ownership，沒有透明樹脂、clearcoat新API、endgrain、成板拼縫、木材力學／解剖／樹種／finish／物理認證或新runtime依賴。

外觀參考：[The Wood Database Goncalo Alves](https://www.wood-database.com/goncalo-alves/)，已實看其[raw長紋樣本](https://www.wood-database.com/wp-content/uploads/astronium-spp.jpg)、[finished長紋樣本](https://www.wood-database.com/wp-content/uploads/astronium-spp2.jpg)及[長板掃描](https://www.wood-database.com/wp-content/uploads/astronium-graveolens-full.jpg)。raw／finished只依成對樣本標示，不假設長板掃描的finish；僅取外觀，不打包照片、不以圖像尺寸或材料資料建立量測、木材辨識／樹種／物理認證。

`thulite` 近似選定細粒粉紅／淡色礦物斑駁的Thulite磨光面：粉紅主體混有密集細淡粒，而非把所有粉紅zoisite、粗黑副礦物、宿主條帶或原石破裂面重建為同一圖樣。與既有Unakite共用三層cached-noise有界多項式field；只在constructor選一次variant並正規化底色／inclusion contrast，保留Unakite全部既有greenBase／pinkContrast參數鍵與point算術順序，不建立第二份合成器。0.12 m nominal tile採7² coarse／37² medium／191² fine及0.12／0.18／0.70權重，改為fine主導分布，不是只換palette；共37,899個Float64／303,192 bytes field tables，不是總RAM或texture cache量。每point維持三次cached lookup，無新增point分支、配置、hash、sqrt、trig或鄰格搜尋；C1 polynomial色斑不形成hard白粒、grout格線、假晶肋或深度／AO切口。色斑共用近乎平整的fine微grain拋光面，AO1／M0／mortar0／正式factor0；UV relief 0.00012不是m厚度。保留四張opaque maps與optional height及tint／Worker／cache／repeats／ownership，不新增mesh、透明石英、真實位移、礦物／比例／產地鑑定或物理／光學／療效認證API。

外觀參考：已實讀Zbyněk Buřival的[Søre Lia親自採集紀錄](https://mineralexpert.org/article/thulite-zoisite-lia-norway-collecting-trip)，並實看[細粒粉紅／淡色原石](https://mineralexpert.org/article-photos/thulite-lia-norway/pink-thulite-mineral-norway.jpg)及[含少量暗粒的粉紅原石](https://mineralexpert.org/article-photos/thulite-lia-norway/pink-thulite-piemontite-minerals-lia-norway.jpg)；另實讀[FossilEra Trondheim拋光球頁](https://www.fossilera.com/minerals/3-25-polished-thulite-sphere-trondheim-norway)且實看其[磨光表面照片](https://assets1.fossilera.com/sp/818649/thulite/zoisite-var-thulite.jpg)。原石圖只參考色粒、不重建裂面；球圖參考連續光澤，不照搬其較粗宿主斑或商品尺寸。不打包照片，來源礦物標籤不構成程序近似的鑑定認證。

`blackeyedpeas` 近似選定乾燥、象牙奶白長橢圓黑眼豇豆的種臍朝上表面：完整凸起種皮上，一圈局部深色橢圓眼圈包圍短白色種臍；眼圈與種臍都只改pigment，不形成穿孔、裂豆、刻槽或蓖麻種阜，也不描繪綠莢／熟豆或所有豇豆品種。0.06 m nominal tile內5×5固定中心的owners採seeded方向／種皮明度；constructor預算cos／sin／單豆底色及肩部倒數，75 pose值加5×7 coat與128² grain共16,494個Float64／131,952 bytes field tables，不是整體RAM或texture cache量。與`mungbeans`直接共用正式凸豆體／capsule／C1橢圓色圈sampler，只在constructor選preset，此kind原data／point算術不變；前景兩次cached lookup，空背底先return，無逐點配置、hash、trig、sqrt或鄰格掃描。height僅為平滑凸體，細grain只影響色／roughness；UV relief 0.025不是m厚度，metallic map／正式預設factor0，保留不透明低位背底。不是新增mesh、真實位移、植物解剖／品種鑑定或物理／光學認證API。

外觀參考：已實讀[Wisconsin／Minnesota Cowpea](https://corn.aae.wisc.edu/Crops/Cowpea.aspx)，其中明確區分長橢圓／腎形變異及白種臍外的色圈；[Iowa State Cowpea](https://www.extension.iastate.edu/alternativeag/cowpea)區分黑眼類與其他豇豆。另實讀[Baker Creek California Blackeye](https://www.rareseeds.com/products/cowpea-california-blackeye-pea)並實看其[乾豆／鮮莢照片](https://www.rareseeds.com/cdn/shop/files/cowpea_california_blackeye_pea.jpg?v=1782394152&width=1200)，以及[Urban Farmer Blackeye46](https://www.ufseeds.com/products/california-blackeye-46-cowpea-seeds)與[種子照片](https://www.ufseeds.com/cdn/shop/files/California_20Blackeye_2046_20Cowpea_20Seeds.jpg?v=1785392927)，僅參考選定的奶白種皮／深色眼圈／短白種臍，不打包照片，也不把商品育種、農藝或品種認證聲明當引擎契約。

`wavewashers` 近似選定銀色圓形閉環三波彈簧墊圈：完整窄金屬環、同一角度跨完整環寬一致的三波height起伏及中央開孔下的低opaque dielectric背底。0.1 m nominal tile內5×5 owners固定中心、seeded相位；constructor預算每格兩個振幅／相位係數與半徑肩倒數，加128² grain共16,434個Float64／131,472 bytes field tables。三次諧波以r³正規化，避免把等角度波高誤成徑向外張；只有非空金屬面需一次必要radial sqrt及一次grain lookup，無逐點angle／trig、hash、配置或鄰格搜尋，空孔不進分母。內外C1環肩在owner前歸零；預設PBR metallic=1，maps保留環面M1、孔／背底M0及平滑部分覆蓋，全部opaque，不新增真mesh孔洞、位移、彈簧壓縮或受力模型。0.02 relief為UV height、不是公尺厚度；既有normal／roughness／AO、選用height、tint的neutral backing規則、repeats、NativeWorker／cache及獨立ownership契約不變。不將所有wave washer視為三波，也不宣稱特定SKU、合金、DIN／ISO或負載／撓度認證。

外觀參考：已實讀[WCL Three Wave Washers](https://www.wclco.com/spring-washers/wave-washers/three-wave-washers/)並實看其[工程圖](https://www.wclco.com/wp-content/uploads/sw46-65.gif)，選定三波圓環型；表列尺寸／load不是引擎量測。另實讀[Was Sheng WA-01](https://www.wassheng.com.tw/en/product/Wave-Washers-WA-01.html)並實看[混合款式產品照片](https://cdn.ready-market.com.tw/cda49b50/Templates/pic/Wave-Washers-WA-01.jpg?v=b4811b1c)，只補充閉合曲帶／finish外觀，不把混合照片當已逐波計數的三波樣片或合金證書；WCL是工程圖而非照片，不打包參考圖片。

`iroko` 近似選定Iroko天然金褐側紋面：細縱向色紋、輕微彎曲明暗帶及稀疏狹長開放導管凹孔，不把所有Iroko當同色或同切向。延伸既有Padauk／Sapele／Wenge family，在constructor選sparse與fine-fiber參數並預算pore肩倒數，不建立第二套木紋演算法；每point維持三次既有cached lookup，無新逐點分支、配置、hash、sqrt、trig或鄰格搜尋。0.18 m nominal tile、36×12 vessel owners；每owner四值加3×4 warp、256×8 fine-fiber及128² grain共20,172個Float64／161,376 bytes快取。色紋與帶紋留在平面，只有導管真凹下；compact C1孔肩在owner邊界前歸零，低AO孔底仍opaque dielectric／M0。既有periodic UV、normal／roughness／AO、選用height、tint、repeats、NativeWorker／cache及獨立ownership契約不變。0.003 relief是UV height而非公尺位移；不新增木材老化、方向性光澤、樹種鑑定、耐候或滲透性模型，African teak是商品名、不是正柚木Tectona。

外觀參考：已實讀[Wood Database Iroko條目](https://www.wood-database.com/iroko/)並實看所列[raw](https://www.wood-database.com/wp-content/uploads/milicia-excelsa.jpg)／[finished](https://www.wood-database.com/wp-content/uploads/milicia-excelsa2.jpg)側紋樣片照片；頁面描述黃金至中褐心材、交錯或不規則木理、中粗質地與少數大導管，列Milicia excelsa／M. regia。此preset是選定天然側紋外觀近似，不是端紋重建、木材鑑定或材料／光學量測認證，不打包參考照片。

`ramie` 近似選定自然米白苧麻平紋樣片：等密度細經／緯紗、1/1交替浮沉、細縱向纖維與暗色低背底，不把苧麻纖維一律視為同一織法或色彩。沿既有balanced plain-weave family新增constructor固定tone與equal-yarn分支，不建立第二套織造演算法、不配置新pose表；每point只用既有128² grain lookup，總16,384個Float64／131,072 bytes快取，無逐點配置／hash／sqrt／trig或鄰格搜尋。0.04 m nominal tile、48×48紗、192×192方向fiber節律，不是來源布樣密度／尺度量測；warp／weft支撐半寬0.42與lift半長0.46都在owner半寬0.5前歸零，C1 yarn肩、crossing-lift肩、fiber joins與cache沿既有慣例。相同米白tone與相等紗冠／base保留平衡1/1高低，不做Chambray藍白染紗、Poplin粗緯肋、緞面長浮線或刷毛pile。孔隙是opaque低背底，不新增alpha-cut holes、真透光、drape／cloth physics或shader anisotropy；M0／factor0、opaque maps、optional height與tint／Worker／cache／repeats／ownership不變。0.004 UV relief不是m單位geometry displacement，不認證供應商100%成分、80 gsm、幅寬、纖維強度、透氣性或其他力學／環境性質。

外觀參考：已實讀[Yardblox Solid Ramie Plain Woven B023405](https://www.yardblox.com/products/solid-ramie-plain-woven-b023405)的Plain／Natural > Ramie 100.0%資料並實看頁面所列OW4米白樣片照片；頁面預設Mustard Yellow不是本preset選色，80 gsm／140 cm是供應商規格而非runtime量測認證。另實讀[Science History Institute The Story of Ramie](https://www.sciencehistory.org/visit/exhibitions/the-story-of-ramie/)（策展Elisabeth Berry Drago），只作天然nettle-family textile背景，不把其歷史水彩當織紋顯微照片，不打包照片或認證纖維純度、強度、透氣／透光與布料力學。

`eudialyte` 近似選定cabochon上深莓紅晶粒、黑色matrix與細暗晶界交錯的角狀碎晶面；是含eudialyte多礦物岩的主色外觀，不把整個host rock當純單晶，也不追蹤所有淺色副礦物。0.12 m tile、8×8 owners各兩個獨立seeded sites；中心x／y與預算pigment共384值，加192² grain共37,248個Float64／297,984 bytes一次快取。沿既有compact weighted-crystal、Howlite squared-weight overlap與cachedNoise慣例，0.2–0.8 site、半徑1.18的cap¹⁶以3×3 owners共18 sites平滑正規化；最壞own-site距離平方1.28小於support²1.3924，總weight及其平方嚴格正，pigment與overlap正規化共用倒數、不加epsilon或假fallback；被省略site最近距離1.2前已歸零，owner不截晶粒。sum(weight²)/sum(weight)²經0.50–0.56的smooth肩形成細暗晶界，不用nearest-owner／max/min造接點折痕；fine只乘調pigment與提供微grain。每point一次grain lookup與固定局部site搜尋，無逐點配置／hash／sqrt／trig；色類在constructor選定，不是UV hard threshold，略過共用detail。不新增偽平行晶面肋，紅晶／黑matrix共用fine微grain拋光面、AO1／M0／mortar0／factor0，晶界不雕成凹縫。Opaque maps、optional height、tint／Worker／cache／repeats／ownership不變；0.00012 UV relief不是m單位geometry displacement，不新增透明折射、全礦物比例、化學／產地／鑑定、療效或輻射安全認證。

外觀參考：已實看[GemSelect的Natural Eudialyte照片](https://www.gemselect.com/media/article-images/natural_eudialyte.jpg)，選上方深莓紅／黑色cabochon，而非左側灰白細粒石、右側條帶石或下方透明刻面石；照片來源文章由Joseph Viele撰、Andreas Zabczyk審閱，只作照片參考，不採納其療效／財富／chakra或輻射安全主張。另實讀[Stone Mania的Eudialyte資料](https://www.stonemania.co.uk/crystals/e-f/eudialyte)，並實看James St.John署名的紅晶／深淺host rock樣本照片；其中只有紅色晶粒是eudialyte，不把整塊多礦物岩當純單晶。未打包照片，不作精密成分／比例／產地或鑑定。

`unakite` 近似所選拋光Unakite的綠色／鮭粉色斑駁主色與細粒交界，維持整體平整切面；不把岩石冒稱單一礦物，也不單獨追蹤所有石英與副礦物。沿既有cached periodic noise與polished-plane慣例，0.12 m tile採8² coarse、24² medium及96² fine三層共9,856個Float64／78,848 bytes。正權重0.70／0.22／0.08總和1，連續混合後以smooth(smooth(mixture))再smooth(tone²)的有界多項式拉出綠／粉色域，不加hard threshold、nearest-owner色塊或偽晶粒縱肋；fine同時提供細粒pigment與微grain，不另配置重複cache。每point三次cached field lookup，無逐點配置／hash／sqrt／trig／鄰格搜尋，略過共用detail。綠／粉色域不直接改height或AO，各自僅有fine微grain的同一拋光面、AO1／M0／mortar0／factor0，保留opaque maps、optional height與既有tint／Worker／cache／repeats／ownership。0.00012 UV relief不是m單位geometry displacement；不新增透明石英、精密礦物比例／成分／產地／硬度鑑定、真晶面幾何、光學干涉或療效認證。

外觀與地質參考：已實讀[Virginia Energy的Rocks of Virginia官方Unakite說明](https://www.energy.virginia.gov/geology/rocks.shtml)並實看其粗晶樣本圖，確認綠／粉色及epidote／orthoclase feldspar／quartz的岩石描述；不把該州頁的區域敘述外推為全球唯一產地。另實讀Hobart M. King（PhD、GIA Graduate Gemologist）的[Geology.com Unakite頁](https://geology.com/gemstones/unakite/)，並實看其左側較粗晶綠／粉cabochon作拋光外觀參考，不把右側較細晶epidote主導樣本說成同一grain scale；不打包照片。

`safflowerseeds` 近似選定Carthamus tinctorius紅花的白色完整瘦果：寬上端、收窄下端的obovate輪廓、光滑象牙白殼、淡黃前側縱稜及沿一側稜的小凹scar，不是去殼果仁、黑縱條向日葵殼、扁平南瓜籽、深色蓖麻斑種或中心大豆臍。0.06 m tile、6×6 seeded旋轉／微偏移個體；五欄pose與128² grain共16,564個Float64／132,512 bytes。沿既有非對稱cap／cap²輪廓、C1 smooth body／squared rib肩與elliptic scar；兩條前側可見淡稜近似來源的四縱稜瘦果，而非宣稱完整四角3D截面。稜及scar隨各果實局部軸旋轉，body dome／raised ribs與輕凹lateral scar分別改height，未以單純色條假裝立體稜。旋轉包圍各軸支撐加jitter小於0.475、完整落在owner內，無逐點配置／hash／sqrt／trig／鄰格搜尋，略過共用detail。Opaque maps、optional height、M0／factor0、tint／Worker／cache／repeats／ownership不變；UV relief不是m單位geometry displacement，不新增冠毛薄片、完整果殼幾何、透明切口、精密四角截面、種子鑑定／發芽／品種／營養／尺度認證，不宣稱所有樣本都無深條或冠毛。

外觀參考：已實讀[IDTools SeedImages的Carthamus tinctorius資料](https://idtools.org/seedimages/index.cfm?packageID=2289&entityID=62245)，並實看Julia Scher（USDA-APHIS-PPQ）署名的第一張白色／黃稜瘦果照片。資料明列obovate、white with light yellow ridges、smooth／glossy、四縱稜與沿稜略凹的lateral scar；選其中白色少深條的外觀，不把第一圖有深條的個體或另圖帶scaly pappus個體宣稱為未曾存在。7×3×2 mm是來源標示，不是runtime精密尺度驗收；不打包照片。

`snakewood` 近似選定Snakewood（Brosimum guianense）直木紋切面：紅褐基底上深褐至近黑的不規則彎曲實心斑塊及平滑相連的重疊figure，細長縱向纖維仍跨過暗斑，不是蛇皮鱗片、鳥眼凹穴、白色髓射線、端木孔圖、腐朽裂紋網或斑馬木連續深條。0.16 m tile、8×12 owner各兩個獨立稀疏seeded slots；六欄中心／尺寸倒平方／slope／bend共1,152值，96×6 wood、128×8 fiber與128² grain共19,136個Float64／153,088 bytes。固定3×3鄰域最多18個候選，以既有compact bent ellipse、C1 smooth肩及補集乘積平滑union形成自由偏移、尺寸變化的斑塊；無逐點配置／hash／sqrt／trig，不以max在重疊處造尖折。最壞x／y支撐0.896／0.4，皆在被省略site最近距離1.2前歸零，跨owner不截斷；各向異性cached scalar grain形成直纖維，不代表新增shader anisotropy。暗斑只改pigment，全部共用微grain拋光平面與roughness、AO1／M0／mortar0，保留opaque maps、optional height、tint／Worker／cache／repeats／ownership及factor0。0.003 UV relief不是m單位geometry displacement，不新增鱗片幾何、凸斑／孔洞、木材辨識、產地／合法貿易／密度／硬度／耐久檢定或老化模擬。

外觀參考：已實讀[The Wood Database的Snakewood資料](https://www.wood-database.com/snakewood/)並實看其solid single-piece切面第二張照片。資料描述紅褐色、對比深褐／黑色斑塊、straight grain、fine even texture與high natural luster；選定的是有明顯figure的切面，不宣稱所有樹木或所有切面都同樣斑駁，也未把膠合樣片接縫或10×端木圖當作要生成的表面，不打包照片。

`squareholewashers` 近似圓形外緣、方形中央開孔的平面銀色金屬墊圈：25個各自微偏移及旋轉的完整圓形外緣，四條直邊與完整內角的方孔露出和外隙相同的低opaque非金屬背底。不是squarewashers的方外緣／圓孔、cupwashers斜杯、盲穴螺絲頭或帶齒防鬆圈。0.10 m tile，五欄cos／sin／中心／tone pose與128² grain共16,509個Float64／132,072 bytes；沿既有squared-radius smooth外肩及兩軸smooth半平面乘積方孔，金屬面為outer×(1−hole)，不用max形成尖折或用圓孔偷換方角。角度及倒數僅預算，無逐點配置／hash／sqrt／trig／鄰格搜尋；最大外支撐加jitter0.39小於0.5，完整落在單一owner，略過共用detail。平坦金屬land M1、孔與外隙M0、partial edges連續，AO與height跟實際覆蓋走；保留opaque maps、optional height、tint／Worker／cache／repeats／ownership及factor1。UV relief不是m單位geometry displacement，不新增透明幾何孔、金屬孔底、背面／螺栓／裝配、防轉或載荷模擬，也不宣稱DIN規格、鍍層／材質檢定或所有square-hole washer都為金屬。

外觀參考：已實讀製造商[Willie Washer的square-hole washers說明](https://www.williewasher.com/products/special-washers/square-hole-washers)並實看其圓外緣／方開孔照片。頁面描述供square-neck carriage bolts與square shafts使用，亦明列金屬與非金屬、不同finish；本preset只選平面銀色金屬外觀，不把用途敘述當作已實作防轉／緊固或材料認證，不打包照片。

`larvikite` 近似拋光深灰Larvikite岩面中的零散靜態藍灰長石反光與晶粒內平行色紋，重用既有diorite／anorthosite／gabbro的coarse-feldspar sampler，不複製另一套岩石演算法。0.12 m tile、10×10 seeded sites，每site六個位置／色調／方向／phase值與128² grain共16,984個Float64／135,872 bytes；固定3×3鄰域的compact高階權重正規化形成連續粗晶mosaic，grain-local band沿既有C1 smooth肩，不逐點配置、hash、sqrt或trig。支撐半徑1.2在被省略site最短距離1.3前歸零；own site最遠距離平方0.98小於支撐平方1.44，分母保持正值而非缺洞fallback。各晶粒共用拋光微grain平面，AO1／M0／mortar0，保留opaque maps、選用height與既有tint／worker／cache／repeats／ownership、factor0。真Larvikite的藍色Schiller涉及長石cryptoperthitic intergrowth的光干涉；此preset只固定近似照片外觀，不新增角度依賴藍光、光學薄層、發光、透明晶簇、凸晶粒、成分／產地鑑定或療效認證。0.00012 UV relief不是m單位geometry displacement，晶粒內色紋也不是實測原子尺度的解溶條紋。

外觀與地質參考：已實讀[IUGS的Oslo Rift Larvikite頁](https://iugs-geoheritage.org/geoheritage_sites/the-larvikite-plutonic-rocks-of-the-oslo-rift/)，作者為NGU科學家Tom Heldal與Gea Norvegica UNESCO Global Geopark地質學家Kristin Rangnes；並實看其polished dark-blue close-up。頁面明述ternary feldspar的cryptoperthitic intergrowth及波干涉藍光，這不是本preset實作的物理能力。另讀Alex Strekeisen的岩石描述及看其macro specimen作補充，未將PPL／XPL薄片或單一Labradorite寶石偷換成已驗Larvikite光學；不打包照片。

`cupwashers` 近似countersunk-finishing款杯形金屬墊圈：25個各自微偏移的銀色完整圓環，中央開孔露出低不透明非金屬背底，低內緣沿直線錐壁升到高外圈，不是整片countersunkmetal、平墊圈、裂口彈簧圈、盲凹螺絲頭或90度基本杯。0.10 m tile、三欄pose與128² grain共16,459個Float64／131,672 bytes；squared-radius smooth肩定內外支撐，C1二次端肩接真正線性徑向錐壁。每個有金屬覆蓋的點只計一次必要sqrt，空孔與背底提前退出；不用逐點hash／trig／配置或鄰格掃描，並略過共用detail。最大外支撐加jitter為0.385<0.5，保持獨立owner；rim／內壁M1，孔與外隙M0，邊緣平滑混合，default及createMaterial() metallic factor皆1。保留opaque maps、選用height與既有tint／worker／cache／repeats／ownership；UV relief不是m單位geometry displacement。不新增真透明孔、geometry／背面、螺絲、裝配、規格角度、載荷／扭矩／防拉穿或電氣絕緣安全認證。

外觀參考：已實讀製造商[Willie Washer的countersunk finishing washers說明](https://www.williewasher.com/products/cup-washers/countersunk-finishing-washers)並實看其開孔杯圈照片。頁面明列多種帶／不帶flange與不同角度款式，本preset只取其中中央開孔與斜內壁／高外圈外觀，不是所有cup washer的通用形狀或零件規格；不打包照片、不模擬緊固承載，也不將金屬面稱作電氣絕緣。

`makore` 近似選定的紅褐斑駁捲曲Makore木皮：細縱向木理間有強弱不一、局部淡出的橫向curl與稀疏較寬短的縱向凹導管，不是連續等強波浪板、直條斑馬木、奶金Anigre或端木孔圖。沿用Anigre合成器與其舊算術順序，新kind才加5×9 C1 figure gate；22組整數週期curl只改顏料，不雕高低、roughness或AO，只有導管實際淺凹。0.18 m nominal tile、28×18四欄pores及3×5 warp／96×4 fiber／128² grain／5² cloud／5×9 figure共18,869個Float64／150,952B tables，非總RAM；constructor快取seed資料，每點不配置、不hash、不做trig／sqrt或鄰格搜尋，略過共用detail。Pore最大半寬0.04／半長0.16均在owner內，curl主軸保守導數下界10.75大於0。維持opaque dielectric／metallic0、選用height、tint／Worker／cache／repeats與ownership；UV relief不是m單位geometry displacement。不把所有Makore都說成捲曲，不打包照片，不模擬方向性光澤／光學、纖維geometry或實際木材解剖，不認證木種、實體孔密度、塗裝／老化、力學或安全。

外觀參考：實讀[Wood Database — Makore](https://www.wood-database.com/makore/)，實看其[finished curly面](https://www.wood-database.com/wp-content/uploads/tieghemella-heckelii-curly2.jpg)、[finished直木理面](https://www.wood-database.com/wp-content/uploads/tieghemella-heckelii2.jpg)與[raw curly面](https://www.wood-database.com/wp-content/uploads/tieghemella-heckelii-curly.jpg)。來源列粉紅至紅褐、偶見mottled／curly、通常直至交錯或波狀且細均勻木理；endgrain另明列large、few vessels，不能從「fine texture」誤推為細密孔，也不把端面radial multiples 2–5硬套縱切面。此preset僅選紅褐捲曲變體，作者比例不是照片量測。

`anigre` 近似選定的淺金粉褐捲曲Anigre木皮：橫向不規則curl色帶跨過細長縱向纖維與稀疏開放導管，不是斑馬木深色縱條、鳥眼節疤、端木孔圖或凸起波浪板。0.16 m tile採24組整數週期curl phase，seeded warp與既有smooth週期輪廓讓色帶保持C1；色帶不改height、roughness或AO，只有導管淺凹。32×16槽位的四欄cached pore、3×5 warp、96×4 fiber、5² cloud與128² grain共18,856個Float64／150,848 bytes；每點不配置、不hash、不做sqrt／trig或鄰格掃描，並略過共用detail。Pore支撐在owner內歸零，phase主軸導數保守下界15大於0；opaque dielectric／metallic0／mortar0，保留既有tint／worker／cache／height／repeats與ownership。這是外觀圖案近似，不是每塊Anigre都有curl的保證、品種鑑定、木材切片掃描、方向性光學shader、幾何波紋、耐久／力學或安全認證；UV relief不是m單位幾何位移。

外觀參考：已實讀[The Wood Database — Anigre](https://www.wood-database.com/anigre/)的淺黃褐／可帶粉色、直至交錯木理與偶見curly／mottled figure說明，並實看其sealed面與標作Curly Anigre的長板照片。此preset選用後者的捲曲figure，不以端木radial multiples的數量強套縱切面或聲稱所有個體都有同樣色帶；不打包照片，也不把商業名或文中分類當引擎提供的木種鑑定。

`adzukibeans` 以暗紅至棕紅種皮、細長中央乳白種臍與完整凸面近似紅豆（Vigna angularis），不是扁圓扁豆、奶油色蓖麻肉阜或挖穿豆身的裂口。0.05 m tile 內有25顆 seeded 旋轉的橢圓籽，種臍採兩端圓合的細長 capsule 色紋；它不額外降低或抬高 height，也不挖 AO 洞。五欄pose／5×7 coat／128² grain共16,544個Float64、132,352 bytes，squared-ellipse 與 squared-capsule smooth肩沿用既有C1慣例；每點不配置、不hash、不做sqrt／trig，並略過共用detail。最大旋轉支撐0.28+jitter0.035<0.5，種臍保守q上界約0.291<full-body界0.88，不跨owner或穿出種皮。深淺種皮、乳白種臍、細grain與背景共用opaque dielectric maps／選用height，預設metallic0，保留tint／worker／cache／repeats／ownership。5.6×4.4 mm輪廓只是tile參考比例；UV height不是m單位的幾何位移。這是每格一顆朝外籽面的stylized貼圖，不是掃描品種、真堆疊豆粒、內部子葉、SEM微裂紋或食品／光學模擬。

形態參考：[Flora of China 的 Vigna angularis](http://www.efloras.org/florataxon.aspx?flora_id=2&taxon_id=242354363) 描述暗紅長圓籽與不凹入種臍；[PNAS 2025 的識別段落](https://pmc.ncbi.nlm.nih.gov/articles/PMC12501132/) 另記載炭化參考籽的細長中央不凹入種臍。另已實看 [Azuki_Beans.jpg](https://upload.wikimedia.org/wikipedia/commons/2/2b/Azuki_Beans.jpg) 的紅棕種皮與乳白長種臍作外觀參考，不下載入套件、不把炭化或SEM結果冒作鮮籽光學認證。

`amazonite` 是藍綠底、斷續淺色交叉長石紋與細cloud的拋光平面近似，不是larimar圓形藍池、完整方格、雕凹裂溝、凸線或透明晶簇。兩組整數UV phase以(32,8)／(−8,32)方向形成交叉紋，沿用既有band／cached-field與C1 smooth肩，較細seeded warp／變寬／gate打斷規則長線；bounded product union在交叉處平滑合成。5² cloud、7×9／9×7 warp、32×16／16×32 width、8×32／32×8 gate及128² grain共18,071個Float64／144,568 bytes一次快取，無逐點配置／hash／trig／sqrt，needsDetail bypass保留。最大phase支撐0.1485小於wrap半寬0.5，signed肩方程主軸導數保守下界19.898大於0。全opaque M0／mortar0／AO1，深淺相只改顏料，共同平面grain高度理論跨度0.000002 UV，在0.06 m參考tile／0.001 UV relief下換算0.12μm，不是實測晶格或geometry displacement；不模擬光學雙晶、解理破裂、成因或療效。沿用options／tint／Worker／cache／ownership。

外觀參考：實讀Hobart M. King（PhD／GIA Graduate Gemologist）的[Geology.com Amazonite](https://geology.com/gemstones/amazonite/)文章，並實看其中polished cabochons及rough照片。條紋可含白色quartz或feldspar，不把所有交叉紋一概認證為perthite或所有個體都有紋；本材質只是外觀近似，非礦物鑑定、化學／光學認證或療效宣稱，未打包參考照片。

外觀參考：實讀[Tamperproof的兩孔Spanner產品說明](https://www.tamperproof.com/products-scs/snake_eyes_spanner)及[製造商首頁的drilled two-hole說明](https://www.tamperproof.com/)，另實看其兩圓孔head示意圖。此preset僅近似表面外觀，不使用Snake Eyes®作材質名稱，也不認證品牌、通用鑽孔製程、規格尺寸、防拆能力、扭矩或刀頭保持力；未打包參考圖。

外觀參考：實讀[Chudnoff／USDA Forest Products Laboratory《Tropical Timbers of the World》1980 limited-distribution原稿](https://www.tropicaltimber.info/wp-content/uploads/2015/06/USDA.TropicalTimbersoftheWorld-Chudnoff.Total1980version.pdf)第458頁的淺黃褐底、較深窄縱紋與中粗紋理描述；另實看[The Wood Database](https://www.wood-database.com/zebrawood/)的徑切樣本照片。本材質只近似木材外觀，不認證樹種、年輪季節、實測導管尺寸或採購／保育狀態，未打包參考照片。

形態參考：[Flora of China — Ricinus communis](http://www.efloras.org/florataxon.aspx?flora_id=2&taxon_id=200012604)記載灰／銀／米色深斑種皮及2–3 mm種阜；另實讀[Flora of Pakistan（M. Rafiq）圖版](http://www.efloras.org/object_page.aspx?object_id=96669&flora_id=5)的seed D輪廓與頂端種阜。只近似外觀，不將不同來源尺寸當所有個體的保證；真實蓖麻種子有毒，此遊戲貼圖不提供食用、醫療或處理建議，也未打包參考圖片。

榻榻米（`tatami`）呈現黃綠色藺草細長凸脊、凹陷草莖間隙、交替上下穿越草莖的橫向綁線與縱向纖維。四份貼圖皆為 seeded periodic；opaque dielectric、metallic 為 0，每張 UV tile 對應 0.16 m。僅為表面 shading／normal map，不新增草莖 geometry、透明孔洞或物理功能；沿用既有 options、repeats 與 ownership。

果皮表面包含鳳梨皮（pineapple，金黃／橄欖色菱形多邊形果目，沿斜向交錯排列，帶狹窄棕綠色凹縫及圓潤冠部內的小凹陷中央果眼）、草莓皮（strawberry，紅色表皮、不規則交錯的細長凹陷種子窩，內有小型赭黃色種子）及荔枝皮（lychee，粉紅／紅色密集不規則多邊形凸疣、柔化尖冠與狹窄暗色凹裂縫），分別區別於松果搭接鱗片、橘皮圓形油腺及鳳梨規整大果目。三者皆為 opaque dielectric，metallic B 通道與預設 factor 為 0，沿用既有 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps。起伏僅為 shading／normal map 效果，不新增 geometry、displacement、透明度、次表面散射（SSS）、transmission 或 BRDF；既有 options、physical repeat、呼叫者 ownership 與借用 maps 的生命週期不變。

真菌表面包含菌褶（mushroomgills，奶油／棕褐色密集放射狀長菌褶與起於外側的短菌褶，環繞平靜附著區）、羊肚菌表面（morel，暖赭／棕色不規則細長凹陷腔室與狹窄圓潤相連隆脊，不是規則六角格或正向珊瑚迷宮）及層孔菌表面（bracketfungus，奶油／鏽紅／棕色重疊薄扇面、寬幅多色同心帶、淡色平滑外緣與細絲絨感顆粒）。三者皆為 opaque dielectric，metallic B 通道與預設 factor 為 0，沿用相同四份 seeded deterministic periodic maps 與 physical repeat。起伏僅為表面 shading／normal map 效果，不新增 geometry、displacement、alpha、次表面散射（SSS）、transmission、生物生長模擬或 BRDF；既有 options、呼叫者 ownership 與借用 maps 的生命週期不變。

市政表面包含警示導盲磚（tactilepaving，柔和安全黃色水泥／陶瓷磚、凹陷磚縫與規整平頂截錐警示凸點，帶圓潤肩部及次要細顆粒）、道路標線（roadmarking，深色顆粒瀝青上的寬幅磨損米白漆帶，連貫局部掉漆露出底層，漆面比瀝青平滑並略微隆起，邊緣圓潤）及排水蓋（draincover，矩形鑄鐵框、平行長條圓端槽、隆起柵條與橫向支撐，帶鑄造顆粒及磨圓肩部）。警示導盲磚與道路標線皆為 opaque dielectric，metallic B 通道與預設 factor 為 0；排水蓋預設 metallic factor 為 1，完整外框／柵條／橫向支撐的 metallic B 為 1，不透明暗色凹槽底面與外部為 0，僅於圓潤肩部平滑過渡。沿用 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps 與 physical repeat；既有 options、呼叫者 ownership、借用 maps 的生命週期與 backend 邊界不變。起伏僅為 shading／normal map 效果，不新增實際開孔、geometry、displacement、alpha 或 BRDF；純視覺素材，不提供逆反射、無障礙認證或道路安全合規保證。

動物皮膚表面包含象皮（elephanthide，霧面灰色皮膚、粗大蜿蜒交錯的凹陷皺褶、圓潤肩部與次要細摺紋）、鴕鳥皮革（ostrichleather，暖棕褐色皮革、稀疏不規則的凹陷羽管毛囊，外圍為低矮隆起圓環，細卵石底紋為次要紋理）及鯊魚皮（sharkskin，灰藍色細密定向微小盾鱗，沿流向逐漸收尖，每片有兩至三條細縱脊與淺搭接陰影），區別於一般皮革凸粒、杏仁凹孔、大型圓潤魚鱗或單脊蛇皮菱形。三者皆為 opaque dielectric，metallic B 通道與預設 metallic factor 為 0，沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps 與 physical repeat。既有 size／seed／contrast／roughnessBias／repeats options、呼叫者 ownership、借用 maps 的生命週期與 backend 邊界不變。僅為表面 shading／normal map 效果，不新增 geometry、displacement、透明度、transmission、次表面散射（SSS）或 anisotropic BRDF。

樹皮表面包含白樺樹皮（birchbark，淺色紙質表面、短而不規則的深色橫向皮孔，帶淺凹與 occlusion，以及淺紙層接縫）、棕櫚樹幹（palmtrunk，乾燥棕褐纖維、不等距橫向葉痕環、凹陷葉痕與隆起肩部，細縱纖維為次要紋理）及懸鈴木樹皮（sycamorebark，奶油／橄欖灰色多層次寬大不規則剝落斑塊與淺剝落邊緣），區別於縱向木紋、竹節或剝漆換色。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用相同四份 seeded deterministic periodic maps 與 physical repeat。僅為 shading／normal map 效果，不新增 geometry、displacement、alpha、transmission、SSS 或 BRDF；既有 options、呼叫者 ownership、借用 maps 的生命週期與 backend 邊界不變。

堅果殼表面包含核桃殼（walnutshell，不規則蜿蜒分岔的粗隆脊與深棕色凹谷）、花生殼（peanutshell，淡稻草／棕褐色網紋，較強縱肋與次要橫向連結圍成不規則細長網格，不是織物交錯）及杏仁殼（almondshell，淺黃褐色殼面、零散細長凹孔與細微定向紋理，以負向起伏與 occlusion 表現孔洞，不是純顏料斑點或隆起珠粒）。三者皆為 opaque dielectric，metallic B 通道與預設 metallic factor 為 0，沿用相同四份 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps 與 physical repeat；僅為表面 shading／normal map 效果，不建立完整堅果 geometry、displacement、cutout、半透明、transmission、次表面散射（SSS）或新 BRDF。

花瓣表面包含玫瑰花瓣（rosepetal，酒紅至玫瑰紅色的柔和流動摺紋、密集細小隆起乳突與高粗糙度的絲絨感微紋，不是布料織紋、毛髮或凹孔）、百合花瓣（lilypetal，奶油／象牙白至暖黃色的細縱肋、淺摺紋與零散不規則細長紅褐色顏料斑點，較玫瑰平滑的緞面粗糙度，斑點不是凹洞）及棋盤貝母花瓣（fritillarypetal，紫／奶油色沿兩軸交替的棋盤顏料、柔和游移格界與細縱紋，淺肋起伏獨立於色格，不是磁磚填縫或織物）。三者皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 metallic factor 均為 0，僅沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps 與 physical repeat defaults。前一百六十二種四份 maps 輸出須逐位元組保持不變；公開 size／seed／contrast／roughnessBias／repeats options、呼叫者 ownership 與借用 maps 的生命週期均不變。各 scalar fields 在週期接縫與內部支撐交界須保持 C1。這些僅為表面 shading／normal map 效果，不建立花朵 geometry、alpha、displacement、transmission、次表面散射（SSS）、模擬或新 BRDF 能力。

新增水果表皮包含網紋瓜皮（cantaloupe，柔和綠／赭色瓜皮上的棕褐色隆起、不規則相連曲線網紋，不是六角蜂巢壁或長頸鹿顏料網絡換色）、火龍果皮（dragonfruit，飽和玫瑰紅／洋紅蠟質表皮、錯列漸尖苞片朝尖端過渡至黃綠色，帶淺層翹起尖端與搭接陰影，不是規則三角形或松果換色）及奇異果皮（kiwiskin，棕色果皮上方向多變的密集細短毛痕與小毛囊凹點，不是粗長縱向椰纖維或垂直斑馬毛紋換色）。三者皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，僅沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps 與 physical repeat defaults。呼叫者 ownership、借用 maps 的生命週期及公開 size／seed／contrast／roughnessBias／repeats options 均不變。這些僅為表面 shading／normal map 效果，不建立 alpha、geometry、displacement、真實毛髮 geometry、transmission、次表面散射（SSS）、模擬或新 BRDF 能力。

貝殼表面包含扇貝殼（scallopshell，暖奶油／粉紅色扇形殼面、向外發散的放射肋與交錯的細微生長環，不是星珊瑚換色）、牡蠣殼（oystershell，粗糙灰／奶油色鈣化表面、不規則重疊生長薄層、翹起層唇與下切陰影，不是規則波紋或層疊紙換色）及鸚鵡螺殼（nautilusshell，奶油／赤褐色盤捲殼面、彎曲螺旋生長紋與腔室／條帶分區，不是同心木材年輪或普通圓點）。三者形態各異，皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，僅沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps、physical repeat sampling、呼叫者 ownership 與不變的 size／seed options。這些僅為風格化殼面 shading／normal map 效果，不建立 geometry、displacement、透明、transmission、次表面散射（SSS）、虹彩或動物模擬。

短毛皮紋包含斑馬短毛皮紋（zebrafur，蜿蜒、寬窄變化且分岔／匯合的黑／象牙白條紋，不是均勻正弦條帶）、豹短毛皮紋（leopardfur，環繞暖色中心的不規則斷續深色玫瑰斑，不是實心圓點或石材換色）及長頸鹿短毛皮紋（giraffefur，由相連淡色網絡分隔的不規則角狀棕色斑塊，不是矩形磚塊／磁磚格）。各自的顏料圖案結合細密短纖維的定向淺起伏與粗糙度；顏料邊界不形成隆起甲片或深裂縫。三者皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，僅沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps、physical repeat sampling、呼叫者 ownership 與不變的 size／seed options。這些僅為淺層表面 shading／normal map 效果，不建立真實毛髮 geometry、alpha、displacement、各向異性 BRDF 或動物模擬。

圖案織物包含千鳥格（houndstooth，黑／象牙白斷格與源於斜紋交織的階梯狀齒形，不是普通棋盤格）、蘇格蘭格紋（tartan，暖色柔和的寬細交叉條帶與可見的紗線交織，不是平鋪磁磚）及花卉提花（damask，成對對稱的花葉與花瓣圖案，在織紋底布上呈現隆起的提花浮雕）。三者圖案形態各異，不是 fabric、herringbone、tweed 或 seersucker 的換色或縮放。皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps、physical repeat sampling、呼叫者 ownership 與不變的 size／seed options。這些僅為表面 shading／normal map 效果，不建立真實纖維、geometry、alpha、displacement、各向異性、新 BRDF 能力或布料模擬。

海洋骨骼表面包含腦珊瑚（braincoral，蜿蜒迷宮狀圓潤隆脊與脊間暗色谷地）、星珊瑚（starcoral，各自分明的珊瑚杯與環繞下陷口部的放射狀隔片）及海綿（seasponge，多尺度通道與不規則相連的多孔骨架）。三者結構各異，不是火山渣、浮石、泡棉或彼此的換色或縮放。皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps、physical repeat sampling、呼叫者 ownership 與 size／seed options。凹凸僅為表面 shading／normal map 效果，不建立真實珊瑚或海綿 geometry、孔洞、活體珊瑚蟲 geometry、alpha、displacement、次表面散射（SSS）或水下光學／模擬／行為。

荷葉（lotusleaf）呈現寬闊圓潤葉片、放射狀葉脈與中央附著點起伏；香蕉葉（bananaleaf）呈現細長寬葉面、強烈中肋與密集平行／斜向側脈；蕨葉（fernleaf）呈現沿葉軸交替排列的漸尖羽片，各有細緻葉脈。三者形態各異，不是換色或縮放的落葉層；皆為不透明綠色 dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，沿用相同四份 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps、repeat sampling、呼叫者 ownership 與 size／seed options。葉片與葉脈僅為表面 shading／normal map 效果，不提供 alpha cutout、真實植被 geometry、displacement、次表面散射（SSS）、濕潤模擬或風動行為。

散粒表面包含米粒（rice，象牙白細長米粒、不同朝向與柔和縱向起伏）、芝麻（sesame，暖棕褐色小型不對稱淚滴種子、圓潤隆起中脊與漸尖端部）與咖啡豆（coffeebeans，較寬的深烘焙棕色橢圓豆粒、彎曲中央裂縫與細密不均烘焙紋理）。三者各自使用不同形狀場，不是同一圖樣換色或縮放；皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，沿用既有四份 seeded deterministic periodic maps、repeat sampling、呼叫者 ownership 與 size／seed options。凹凸僅為表面 shading／normal map 效果，不提供逐粒模擬、物理堆疊、geometry、displacement、透明或次表面散射。

唯讀 `textures` 包含四份 `Texture`：`baseColor`（sRGB RGB）、`normal`（linear tangent-space）、`metallicRoughness`（linear G roughness／B metallic）、`occlusion`（linear R）。唯讀 `kind` 表示種類，唯讀 `material` 為預設 `PBRMaterial`。預設 OPAQUE、每個 sampler 使用 repeat wrapping、roughness factor 為 1，具有 authored 金屬區域的預設（如全金屬 nickelsilver 與 mixed 的 rust／copperpatina）使用 metallic factor 1 保留 B 通道，純 dielectric 使用 0，完整規則見各 kind 說明；rust 的 B 通道在殘留金屬與鏽蝕之間變化，chainmail 隨金屬環在 dielectric 襯底上的覆蓋率變化，draincover 隨金屬在不透明凹槽底面上的覆蓋率變化。貼圖粗糙度不會再乘上一般材質的預設 0.5。

瀝青呈現暗色顆粒黏結料與嵌入骨材；礫石為不規則石粒與暗色凹隙；鵝卵石鋪面為錯列圓角鋪石。三者沿用相同四份 maps，皆為 opaque dielectric，metallic 通道為 0。

樹皮呈現隆起紋理與深裂隙；苔蘚為密集柔軟的綠色覆層；泥土為土塊與淺裂紋。三者同樣使用四份 maps，皆為 opaque dielectric，metallic 通道為 0。

花崗岩呈現斑點礦物顆粒；板岩為帶細微脊紋的深色層理；磨石子為平滑黏結料中的對比色石片。三者同樣使用四份 maps，皆為 opaque dielectric，metallic 通道為 0。

紡織表面包含丹寧布（denim，斜向斜紋）、粗麻布（burlap，粗經緯交織）與地毯（carpet，割絨表面）。三者沿用相同四份 repeat maps，皆為 opaque dielectric、metallic 通道為 0；不是 geometry 或毛髮模擬，也不產生透明織孔。

柔軟紡織表面包含針織（knit，柔和色調的平針式重複 V 形針目、圓潤隆起紗線與凹陷線圈間隙）、燈芯絨（corduroy，暖棕色平行圓潤隆起絨條、細密絨毛斑點與深窄溝槽）與毛氈（felt，柔和灰綠色霧面不織表面、隨機方向細纖維與低起伏）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用相同四份 deterministic periodic maps；凹凸僅由 normal map 表現，不新增紗線／毛髮 geometry 或透明線圈。

建材飾面加入石膏（plaster，淺色石膏的淺抹刀弧痕與細孔）、陶土（terracotta，未上釉紅褐燒製陶土的不規則窯色與凹孔，無磁磚填縫）與軟木（cork，棕褐壓製碎片與細胞邊界）。三者沿用相同四份 repeat maps，皆為 opaque dielectric、metallic 通道為 0，不新增 geometry 或物理模擬。

工業表面加入橡膠（rubber，炭黑色模製彈性體與細密卵石狀顆粒）、碳纖維（carbonfiber，樹脂覆層下深色纖維束與交替斜向斜紋編織）與止滑花紋鋼板（diamondplate，銀色軋製金屬與交替斜向隆起菱形紋）。橡膠與碳纖維皆為 opaque dielectric、metallic 通道為 0；鋼板 metallic 通道及預設 factor 均為 1。三者沿用相同四份 periodic RGBA maps，凹凸僅由 normal map 表現，不新增 geometry；碳纖維不是特殊 anisotropic shader、clearcoat 或物理模擬。

工藝素材加入紙張（paper，象牙白未塗佈紙的細密不規則紙漿纖維與輕微雲狀成紙紋）、藤編（wicker，棕褐寬圓角藤條交織、細縱向條紋與深色不透明凹隙）與竹材（bamboo，金黃縱向纖維與週期錯列的深色竹節帶）。紙張不是石膏換色，藤編區別於粗麻布。三者皆為 opaque dielectric、metallic 通道與預設 factor 為 0，沿用相同四份 periodic maps；凹凸僅由 normal map 表現，不新增 geometry、透明孔洞、分節物件或物理模擬。

成形金屬加入錘紋金屬（hammeredmetal，暖銅色金屬、重疊的淺圓錘凹與平滑連續起伏，不是粗岩）、鍍鋅板（galvanized，冷銀色鋅花晶粒的色調與粗糙度對比、極淺起伏，不是礫石）與波紋金屬板（corrugatedmetal，銀色軋製板的平行平滑波槽與細微縱向磨痕）。三者沿用相同四份 deterministic periodic maps，metallic B 全為 255（1）、預設 factor 為 1，區別於混合金屬度的 rust。凹凸僅由 normal map 表現，不位移 geometry 或改變輪廓。

砂岩（sandstone）呈現暖色波狀沉積層理與砂粒，區別於深色板岩和鬆散沙；洞石（travertine）為奶油色石灰岩、不規則細長淺孔與細微水平礦物帶；浮石（pumice）為淺灰火山岩、密集隨機分布的小圓氣孔，不是礫石或石材換色。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用相同四份 deterministic periodic maps；凹孔僅由 normal map 表現，不是透明或 geometry 孔洞。

拼花木地板（parquet）為籃編式木塊拼排，每塊含多根窄木條，縱向木紋方向交替並帶深色凹縫，不是木材換色；馬賽克（mosaic）為細小方形釉面磚粒，具有 seed 決定的逐磚色調差異與窄凹填縫，區別於較大的 tiles；六角磚（hexagontiles）為六邊形陶瓷單元與窄凹填縫，可無接邊斷裂地週期重複。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 maps；凹凸僅由 normal map 表現，接縫不分割 geometry。

瀝青屋瓦（roofshingles）呈現暗色礦物顆粒瀝青瓦層、錯列矩形瓦片與搭接陰影帶；陶製屋瓦（rooftiles）為重複排列的赤陶筒瓦層、彎曲瓦冠、凹陷水槽與層間搭接帶；粗灰泥（stucco）為暖米白噴塗／抹製灰泥、不規則隆起骨材與凹孔，起伏比 plaster 更粗。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用相同四份 deterministic periodic maps；屋瓦搭接與表面凹凸僅由 shading／normal map 表現，不位移 geometry、不改變輪廓或新增物理模擬。

地衣（lichen）呈現不規則淺殼狀群落；落葉層（leaflitter）為具方向性的乾葉、中央葉脈與凹陷間隙；木頭端面（endgrain）為彎曲木材年輪、導管孔與放射狀乾裂。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用相同四份 deterministic periodic maps；凹凸僅由 shading／normal map 表現，不新增植被或木材 geometry。

吸音泡棉（acousticfoam）呈現炭黑色柔化金字塔狀起伏；閉孔泡棉（closedcellfoam）為藍灰色細密閉孔膜面與淺凹；油氈地材（linoleum）為柔和綠／青綠色平滑大理石紋片材地板與細長顏料斑點。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用相同四份 seeded deterministic periodic maps；凹凸僅由 shading／normal map 表現，不新增泡棉 geometry、吸音或物理模擬。

麂皮（suede）呈現棕褐色短刷絨與細孔；蛇鱗紋皮革（snakeskin）為橄欖綠／棕色錯列的小型尖端／圓角菱形鱗紋、中央脊線與凹陷邊界；鱷魚壓紋皮革（crocodile）為深棕色大型圓角矩形鱗板與皺褶凹紋。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用相同四份 seeded deterministic periodic maps；只是合成表面紋樣，凹凸僅由 shading／normal map 表現，不新增動物 geometry 或 displacement。

人字紋織物（herringbone）呈現交替斜向的斷續斜紋人字形；粗花呢（tweed）為粗糙雜色紗線、細斑點與交叉纖維；泡泡紗（seersucker）為淺藍／奶油色交替平整與皺褶條帶及細密織紋。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用相同四份 seeded deterministic periodic maps；僅為表面 shading／normal map 效果，不新增布料 geometry、anisotropy 或模擬。

滾花金屬（knurledmetal）呈現細密交叉斜向脊線與隆起菱形止滑紋；魚鱗旋紋金屬（engineturned）為重疊的銀色圓形加工旋紋；金箔（goldleaf）為暖金色揉皺紋與搭接縫。三者皆為 opaque，僅沿用相同四份 seeded deterministic periodic maps，metallic B 全為 255（1），`material` 與 `createMaterial()` 的預設 metallic factor 均為 1，明確的呼叫者覆寫仍最後套用。rust 保持變化的 metallic map 與預設 factor 1，dielectric 預設仍為 0。僅為表面 shading／normal map 效果，不新增實際 anisotropy、金箔厚度、加工 geometry 或透光效果。

橘皮（orangepeel）呈現細密油腺凹點與蠟質橙色表皮；椰殼（coconut）為粗糙棕色外殼、細縱向椰纖維與裂隙；西瓜皮（watermelon）為綠色不規則波狀縱向瓜皮條帶與雜色斑點。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；只是表面 shading／normal map 效果，不新增水果 geometry、transmission 或 subsurface scattering。

石灰岩（limestone）呈現暖淺色圓潤碳酸鹽顆粒與多孔基質；角礫岩（breccia）為膠結物中的稜角破碎岩屑；片麻岩（gneiss）為褶曲的明暗交替礦物帶與結晶斑點。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增實際岩石 geometry、displacement 或透光效果。

膠合板（plywood）呈現暖色旋切面單板的山形木紋與節眼，而非板邊疊層；定向粒片板（osb）為大型重疊且具方向性的細長木片；粒片板（chipboard）為黏結料中密集較細且隨機定向的木屑。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增板材 geometry 或 displacement。

華夫格布（wafflecloth）呈現隆起的華夫格編織邊框與凹陷方格口袋；麻花針織（cableknit）為相互纏繞的羊毛麻花辮、交叉處起伏及兩側較細的針織凸條；菱格絎縫（quilting）為蓬鬆填充的菱形布面單元與凹陷斜向縫線。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增布料 geometry、displacement、transmission 或 SSS。

裝飾陶瓷與花磚包含冰裂釉（crackleglaze，淺青瓷色平滑釉面與細密不規則深色凹陷裂紋網）、直槽陶瓷（flutedceramic，象牙白拋光陶瓷與垂直圓潤槽紋）與嵌彩水泥花磚（encaustictiles，奶油色／柔和藍色裝飾水泥磚、花卉／幾何顏料嵌紋及凹陷填縫）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；只是表面 shading／normal map 效果，不新增實際裂縫、geometry、displacement、transmission 或塗層系統。

生物覆層包含魚鱗（fishscales，藍灰／青綠色錯列重疊的圓潤扇貝狀鱗片、同心生長紋與露出邊唇）、龜甲（tortoiseshell，棕／琥珀色不規則多邊形盾片、深色接縫、圓頂與生長環）與羽毛（feathers，灰褐色層疊尖端羽片、羽軸與斜向羽枝）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；只是表面顏料與 normal map 效果，不新增 geometry、cutout、transmission、iridescence、SSS 或 shader feature。

植物纖維表面包含蘆葦蓆（reedmat，纖細平行蘆葦與橫向綁線）、繩索（rope，相鄰三股扭繩帶、螺旋凹槽與細纖維）與稻草（straw，金黃乾燥纖細散落直莖、偶見節點與層疊鋪墊）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；只是表面 shading／normal map 效果，不新增圓柱、geometry、cutout 或 displacement。

橡膠地材包含圓釘橡膠（studdedrubber，圓形平頂炭黑凸釘與斜面肩部）、溝槽橡膠（groovedrubber，寬平深灰肋條與窄排水槽）與再生橡膠（recycledrubber，暗色黏結料中的密集細小藍灰不規則橡膠顆粒）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；只是表面 shading／normal map 效果，不提供實際摩擦／止滑或排水物理，不新增 geometry 或 displacement。

穿孔金屬板（perforatedmetal）呈現亮面金屬板上錯列的圓形凹孔與孔間平整網面；擴張網（expandedmetal）為兩組對角條帶在隆起節點相接並圍出凹陷的菱形開口；編織金屬網（wiremesh）為圓形金屬線平紋交織、上下交錯於深色開放網孔之上。三者皆為 opaque metal，metallic 通道與預設 factor 為 1，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增板材 geometry、真實孔洞、彎折條帶或 displacement。

天鵝絨（velvet）呈現細密平整的直立絨面，柔和的壓褶雲塊改變色素與光澤；毛圈布（terrycloth）為錯列隆起的圓潤毛圈冠；圈圈紗（boucle）為紗節上隆起的環狀線圈、環心凹陷且紗節之間留有開放凹槽。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增布料 geometry、剪開線圈、displacement 或 SSS。

晶洞（geode）呈現環繞細密晶簇核心的同心礦物縞帶；石英（quartz）為高低錯落的六方柱體與錐狀頂端；黃鐵礦（pyrite）為相互咬合的階梯狀立方晶面與細密平行條紋。晶洞與石英為 opaque dielectric，metallic 通道與預設 factor 為 0；黃鐵礦為 opaque metal，metallic 通道與預設 factor 為 1。三者僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增晶體 geometry、切割晶面或 displacement。

搭接木板（shiplap）呈現搭接處的陰影凹槽、板材色調在接縫淡出且木紋沿板面延伸；玻璃磚（glassblock）為圓角磚面與凹陷接縫、內部氣泡隆起；茅草（thatch）為層層下垂的草束與陰影搭接、細長草莖沿坡面延伸。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增板材、磚體或草束 geometry，也不做 displacement。

炭化木（charredwood）呈現隆起於深邃鱷魚裂紋之上的圓潤炭塊；漂流木（driftwood）為銀灰木紋脊與沿木紋開裂的風化裂隙；剝落漆面（peelingpaint）為翹起捲邊的完整漆面與外露的底材。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增樹皮、木板或漆片 geometry，也不做 displacement。

胎紋（tiretread）呈現錯列墊高的胎塊與其間溝槽、胎面細割紋；蜂巢（honeycomb）為環繞凹陷巢房的隆起蠟質六角壁；霜花（frost）為自淡出中心放射的羽狀冰晶。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增胎塊、巢房或冰晶 geometry，也不做 displacement。

彩繪玻璃（stainedglass）呈現墊高鉛條與其間不同色調的不規則玻璃片；皂石（soapstone）為深色滑石底上的柔和淺色紋帶；端面砧板（butcherblock）為錯色棋盤格端面木塊與凹陷接縫。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增鉛條、石材或木塊 geometry，也不做 displacement。

壁紙（wallpaper）呈現以精確鏡像對稱重複的大馬士革團花；刺繡（embroidery）為在自身支撐處淡出的墊高緞面繡線；流蘇編繩（macrame）為墊高於交錯扭繩之上的錯列圓潤繩結。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增線材、繡線或繩結 geometry，也不做 displacement。

磚鋪面（brickpaving）呈現錯縫墊高於砂質接縫之上的磚面；踏石（steppingstone）為墊高於礫石地面的圓潤石板；木平台（woodendeck）為窄縫上方的板面、隆起螺絲釘頭與凹陷十字槽。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增磚、石板、木板或螺絲 geometry，也不做 displacement。

起司（cheese）呈現沉入麵體、大小不一的圓潤孔洞；糖霜（sugarfrosting）為隆起於平滑糖面的擠花玫瑰峰；蠟淚（candleswax）為圓潤下垂的蠟流與其下端鼓起的淚頭。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增食品或蠟體 geometry，也不做 displacement。

黑膠唱片（vinylrecord）呈現環繞平整標籤圓面的細密同心溝紋；方格紙（graphpaper）為深於細格線的粗格線；筆記本紙（notebookpaper）為依序沉入紙面的橫線、邊界線與打孔。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增唱片、紙張或孔洞 geometry，也不做 displacement。

蕾絲（lace）呈現菱形網眼上方交叉的對角線網紋與其交叉鼓起；鉤織（crochet）為交錯半格位移的線圈列隆起於凹陷之間；籃織（basketweave）為依區塊交替方向、帶有凸脊的條帶與條帶間凹陷。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增線材、毛線或藤編 geometry，也不做 displacement。

拉鍊（zipper）為交錯半格位移的鏈齒列嚙合於凹陷接縫上方、兩側配細織紋布帶；魔鬼氈（velcro）為錯列鉤針圓環墊在凹陷針芯與底布之上；鈕扣（button）為隆起扣緣高於縫線扣面與凹陷孔洞凹點。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增鏈齒、針扣或鈕扣 geometry，也不做 displacement。

鐵軌（traintracks）為鋼軌隆起於橫向枕木與道碴顆粒之上；人孔蓋（manholecover）為外框環高於放射與同心圓肋紋蓋面；減速丘（speedbump）為圓拱隆起於坡腳與凹陷接縫之上、帶警示條紋。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增鋼軌、蓋體或丘體 geometry，也不做 displacement。

電路板（circuitboard）為銲盤隆起於基板上方的走線交點、導孔凹陷；太陽能板（solarpanel）為匯流條與細柵線墊在凸起電池片面之上、片間留隙；隔熱瓦（heattile）為圓角瓦面高於凹陷接縫。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增線路、電池片或瓦片 geometry，也不做 displacement。

琴鍵（pianokeys）為黑鍵隆起於白鍵面與凹陷縫線之上；鼓皮（drumskin）為鼓耳高於鼓框、其下為帶放射褶的繃緊鼓膜；鑼面（gongsurface）為錘打同心環紋繞著中央凸起。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增琴鍵、鼓皮或鑼體 geometry，也不做 displacement。

微透鏡陣列（lensarray）為圓頂微透鏡隆起於細支撐網之上；稜鏡膠帶（prismtape）為斜向稜脊高於脊腳與膠帶底面；菲涅耳面（fresnel）為同心鋸齒環帶由中央凸起向外漸低。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增透鏡、稜鏡或階梯透鏡 geometry，也不做 displacement。

繃帶（bandage）為圓角軟墊墊在織紋紗布之上；藥丸泡殼（pillblister）為半球泡殼鼓起於壓痕鋁箔之上；縫合線（sutures）為縫線跨過凹陷切口、旁有針孔凹點與素面皮膚。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增軟墊、泡殼、縫線或縫針 geometry，也不做 displacement。

格柵（trellis）為交叉木條與其交點繩結高於鏤空格；陶盆（terracottapot）為凸緣高於盆壁旋紋；樹籬（hedgerow）為葉團鼓起於枝條縫隙之上。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增木條、盆體或枝葉 geometry，也不做 displacement。

項圈（collar）為扣環高於縫線織帶與素面底布；寵物床（petbed）為環形床緣圍著內凹軟墊與織紋底；貓抓柱（scratchpost）為麻繩脊高於繩圈溝縫。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增扣環、床緣或繩索 geometry，也不做 displacement。

跑道（runningtrack）為分道線墊在膠粒表面之上、排水縫凹陷；攀岩墊（bouldermat）為菱形壓紋鼓起於邊緣縫合帶內側；泳池磚（pooltile）為磚面高於填縫、其上疊水光條紋。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增劃線、壓紋或瓷磚 geometry，也不做 displacement。

信封（envelope）為交叉壓紋框著凹陷封口縫；黑板（chalkboard）為木框圍著帶粉筆擦痕的板面；軟木板（corkboard）為軟木顆粒墊高板面、圖釘孔深陷。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增封口、框體或圖釘 geometry，也不做 displacement。

雪堆（snowdrift）為風紋波浪脊墊在細雪粒之上；冰柱（icicle）為圓潤冰柱垂在陰影隙縫之上；露珠（dewdrops）為大小兩種水珠串在淡葉脈之上。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增雪堆、冰柱或水珠 geometry，也不做 displacement。

月坑（mooncrater）為坑緣隆起於地表、坑底凹陷；星空（starfield）為亮星與塵點閃在星雲底色之上；星雲（nebula）為明亮渦卷條紋繞著暗塵帶流動。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增隕坑、星體或雲氣 geometry，也不做 displacement。

褶襉（pleats）為風琴褶脊高於布面谷線；鞋帶（shoelace）為交織圓繩高於底面、鞋眼孔深陷；流蘇（tassel）為穗帶垂在束結環之下。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增褶片、繩體或穗帶 geometry，也不做 displacement。

炒鍋（woksurface）為錘打凹點高於刮痕鋼面、疊油光；餐具（cutlery）為串珠邊框圍著拉絲柄面；砧板（choppingboard）為端面木塊留著刀痕、邊框凹陷。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增凹點、串珠或木塊 geometry，也不做 displacement。

水龍頭（faucet）為拋光弧面高於底盤、帶水垢斑；蓮蓬頭（showerhead）為出水孔沉入帶溝紋的面板；浴墊（bathmat）為吸盤圓頂墊在織紋底面之上。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增弧面、噴孔或吸盤 geometry，也不做 displacement。

百葉窗（blinds）為傾斜葉片面高於遮蔭縫隙；窗簾（curtain）為布褶波峰高於布面谷地；遮陽網（shadecloth）為交織網線墊在開口網眼之上。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增葉片、布褶或網線 geometry，也不做 displacement。

食品表面包含麵包脆皮（breadcrust，裂開的烤焦麵包脆皮）、威化餅（wafer，細密正交凹格與烘烤凸肋）與巧克力（chocolate，寬大平滑的巧克力方塊與分割刻槽）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps 與 physical repeats；只是平坦表面的 shading／normal map 效果，不新增 geometry、displacement、SSS、transmission、半透明或食品／物理模擬。

蝴蝶脆餅（pretzel）為交錯麵繩打結高於繩間凹處、灑鹽粒；貝果（bagel）為Q彈環面高於凹陷中孔、點芝麻；可頌（croissant）為奶油層片斜脊高於烘烤接縫。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增結點、環面或層片 geometry，也不做 displacement。

蝶翅（butterflywing）為鱗片格面高於凹陷翅脈；甲蟲翅（beetlewing）為弧形鞘翅板高於分節接縫；蛛網（spiderweb）為放射蛛絲與同心絲環高於開口網格、點著露珠。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增鱗片、鞘翅、蛛絲或絲環 geometry，也不做 displacement。

卷雲（cirrus）為風梳細絲條紋橫過高空留白；積雲（cumulus）為花椰菜狀雲團高於陰影縫隙；閃電（lightning）為鋸齒電光核心亮過暗沉雷天空。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增絲條、雲團或電光 geometry，也不做 displacement。

海帶（kelp）為寬亮葉帶波皺高於陰影波谷；海藻（seaweed）為細分枝絲交錯墊面與陰影空隙；海葵（anemone）為環狀觸手高於凹陷中央口盤。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增葉帶、分枝或觸手 geometry，也不做 displacement。

硬糖（candy）為光亮扭轉條紋高於淺接縫；棉花糖（marshmallow）為柔軟擠花圓稜高於圓弧凹槽、灑粉；牛軋糖（nougat）為堅果塊與氣泡孔穿插耐嚼糖體。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增條紋、圓稜或堅果塊 geometry，也不做 displacement。

磨砂玻璃（frostedglass）為細酸蝕顆粒散布玻璃面；波紋玻璃（rippledglass）為垂直壓延波肋橫過拉製玻璃；氣泡玻璃（bubbleglass）為圓氣泡鼓起於透明玻璃體之上。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增顆粒、波肋或氣泡 geometry，也不做 displacement。

馬鞍縫線（saddlestitch）為斜向虛線縫線高於粗面皮革；壓花皮革（tooledleather）為浮雕圓章與渦紋高於壓縮底面；漆皮（patentleather）為細橘皮波紋橫過鏡面漆層。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增縫線、圓章或漆層 geometry，也不做 displacement。

蘋果皮（appleskin）為紅暈條紋帶過緊繃果皮、點果點；桃皮（peachskin）為細絨覆於紅暈、旁有凹陷縫線溝；葡萄皮（grapeskin）為白霜粉斑散布緊繃光滑果皮。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增條紋、絨毛或粉斑 geometry，也不做 displacement。

青花菜（broccoli）為密集花球粒高於花球陰影空隙；高麗菜（cabbage）為葉片波皺高於凹陷葉脈；洋蔥（onion）為同心層弧條紋高於乾皮纖維。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增花球粒、葉皺或層弧 geometry，也不做 displacement。

床單（bedsheet）為柔壓皺褶漂過織面；枕頭（pillow）為蓬鬆衍縫墊高於凹陷滾邊縫線；床墊（mattress）為鈕扣拉扣凹點沉入粗織面。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增皺褶、衍縫墊或拉扣 geometry，也不做 displacement。

茶葉（tealeaf）為捲曲葉片堆過茶堆陰影空隙；抹茶（matcha）為刷痕條紋梳過細粉面；茶包（teabag）為濾紙網線交錯開口網眼與茶影。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增葉片、刷痕或網線 geometry，也不做 displacement。

沙丘（sanddune）為風紋波脊梳過細沙面；卵石灘（pebblebeach）為圓卵石鼓起於粗砂之上；浪花泡沫（foamedge）為泡沫團與氣泡洗過薄水膜。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增波脊、卵石或泡沫 geometry，也不做 displacement。

熔岩流（lavaflow）為繩狀熔岩紋高於暗色裂縫；冷卻熔岩（cooledlava）為結殼岩塊高於裂縫與孔洞；火山灰（ashfield）為細灰堆高於灰面。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增繩紋、岩塊或灰堆 geometry，也不做 displacement。

鐘乳石（stalactite）為滴水錐尖垂過陰影凹處；流石（flowstone）為梯田流紋台階過細滴水波紋；洞底（cavefloor）為碎石泥面環繞平淺水窪。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增錐尖、台階或碎石 geometry，也不做 displacement。

果醬（jam）為光亮果肉塊浸於透明果膠；花生醬（peanutbutter）為花生碎穿插綿滑漩渦醬面；糖針（sprinkles）為糖針條散布糖霜底面。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增果肉塊、花生碎或糖針 geometry，也不做 displacement。

冰淇淋（icecream）為擠花奶油稜高於融化滴點之間；冰棒（popsicle）為冷凍滴掛稜垂過霜面冰體；雪酪（sorbet）為刮匙刮脊高於果粒面。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增擠花、滴掛或刮匙 geometry，也不做 displacement。

義大利麵（spaghetti）為蜿蜒麵條盤過醬底；通心粉（macaroni）為短彎管殼堆於空隙之間；千層麵（lasagna）為層層麵片疊過醬料縫。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增麵條、管殼或麵片 geometry，也不做 displacement。

折紙（origami）為折面高於壓折痕線；紙蕾絲（paperlace）為鏤空孔洞穿過紙橋面；剪紙（papercut）為層疊剪影高於平底紙面。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增折面、孔洞或剪影 geometry，也不做 displacement。

向日葵（sunflower）為花盤種籽圓頂密排；雛菊（daisy）為放射花瓣圍繞凹陷花心；三葉草（clover）為三心葉瓣自葉柄展開。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增種籽、花瓣或葉瓣 geometry，也不做 displacement。

拼圖磚（puzzletile）為拼片與圓弧接點高於接縫；積木（legobrick）為圓柱凸點高於平滑磚面；橡皮筋（rubberband）為交叉彈條拉過底層包覆。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增拼片、凸點或彈條 geometry，也不做 displacement。

乾草捆（haybale）為梳整稻稈條紋旁壓縮捆帶；穀倉（corncrib）為木條柵欄交錯過開口空隙；柵欄柱（fencepost）為風化直木紋稜被深裂紋分割。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增稈條、木條或木紋 geometry，也不做 displacement。

撞球桌絨布（poolfelt）為白色標記圓點高於濃密絨毛；冰面（icesurface）為掃冰弧紋高於溝谷並帶霜斑；攀岩牆（climbingwall）為圓形岩點高於顆粒牆面。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增圓點、弧紋或岩點 geometry，也不做 displacement。

OLED 面板（oledpanel）為子像素發光條紋高於深色矩陣遮罩；CRT 掃描線（crtscanline）為磷光掃描波峰高於線間暗隙；鍵盤鍵帽（keyboardkey）為圓角方形鍵帽高於凹陷縫隙。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增條紋、掃描線或鍵帽 geometry，也不做 displacement。

底片（filmstrip）為打孔圓洞穿過分格凹槽間的片基；郵票（postagestamp）為邊緣齒孔圍繞高於紙面的中央圖案；網點印刷（halftoneprint）為隨色調大小的墨點高於留白紙面。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增圓孔、齒孔、圖案或墨點 geometry，也不做 displacement。

暖氣與五金包含散熱管（radiator，圓管高於凹陷接縫）、螺絲頭（screwhead，十字凹槽低於頭環與面板）與菱形鐵絲網（chainlink，交叉節點高於鐵絲與鏤空）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增圓管、螺絲或鐵絲 geometry，也不做 displacement。

餐桌食物包含煎蛋（friedegg，蛋黃高於蛋白與鍋面）、壽司飯（sushirice，米粒高於縫隙）與巧克力碎片餅乾（chocolatechip，巧克力片高於餅乾底）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增蛋黃、米粒或碎片 geometry，也不做 displacement。

車輛內裝包含貨車踏墊（cargomat，橡膠長肋高於橫向凹槽）、儀表皮革紋（dashboardgrain，顆粒高於谷底與縫線凹痕）與車牌（licenseplate，凸框高於字條與底板）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增肋條、顆粒或邊框 geometry，也不做 displacement。

花園植栽包含花圃（flowerbed，四瓣花簇高於土壤）、草坪條紋（grassstripe，剪草亮帶高於溝底）與修剪灌木（topiary，葉團高於修邊空隙）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增花朵、草葉或葉團 geometry，也不做 displacement。

節慶裝飾包含紙屑（confetti，碎片高於紙面）、緞帶波紋（ribbonstreamer，扭轉寬帶高於溝底）與彩帶流蘇（pinatafringe，密集垂條高於層帶與空隙）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增碎片、緞帶或垂條 geometry，也不做 displacement。

樂器與演奏包含木琴（xylophone，琴條高於穿繩孔與空隙）、鈴鼓（tambourine，斜置鈴片高於鼓皮）與響板（castanet，殼緣高於中央凹與氈底）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增琴條、鈴片或殼體 geometry，也不做 displacement。

保健與美容包含膠囊（pillcapsule，兩半高於接縫與底板）、藥錠（pilltablet，圓頂高於刻痕）與入浴球（bathbomb，顆粒高於斜向裂隙）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增膠囊、錠劑或裂隙 geometry，也不做 displacement。

運動球表面包含籃球（basketball，橙色顆粒皮革與深色凹陷拼片縫）、網球（tennisball，黃綠色毛氈與淡色彎曲接縫）與高爾夫球（golfball，白色光澤表面與規則圓形凹點）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps 與 physical repeats；只是週期表面 shading／normal map 近似，不提供真實球面拼片拓撲、geometry、displacement、纖維或殼體體積、SSS、transmission 或球體物理。

建築混凝土飾面包含木模板清水混凝土（boardformedconcrete，灰色澆置混凝土的水平木板壓印、細長木紋與凹陷板縫，不是木材換色）、肋紋混凝土（ribbedconcrete，垂直等距寬肋、圓潤肩部、凹槽與細孔）與劈面砌塊（splitfaceblock，錯列矩形砌塊的粗糙破裂面與平滑凹陷砂漿縫，不是磚牆換色）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps 與 physical repeats；只是 shading／normal map 效果，不新增實際澆置 geometry、displacement 或砌體物理。

鎖子甲（chainmail）為深色不透明 dielectric 襯底上重疊交錯的金屬環浮雕，不是真實開孔或透明網；鉚接金屬板（rivetedmetal）為板片凹縫與離散圓潤隆起鉚釘；焊接金屬板（weldedmetal）為較平坦金屬板上的隆起週期扇貝狀焊道。三者皆為 opaque，僅沿用相同四份 seeded deterministic periodic maps 與 physical repeats；`material` 與 `createMaterial()` 預設 metallic factor 均為 1，明確的呼叫者覆寫仍最後套用。chainmail 的 metallic B 通道隨金屬環覆蓋率變化，襯底為 0；rivetedmetal／weldedmetal 則全為 255（1）。僅為 shading／normal map 效果，不新增 geometry、displacement 或物理模擬；公開 options、呼叫者 ownership 與借用 maps 的生命週期不變。前九十六種輸出須逐位元組保持不變。

植物表面包含仙人掌（cactus，縱向綠色肋紋、重複刺座與細放射狀刺痕）、松果（pinecone，錯列重疊的木質角狀鱗片、隆起露出尖端與凹陷搭接縫，區別於圓潤魚鱗）與玉米穗（corncob，緊密排列的飽滿長橢圓籽粒、圓潤冠部與狹窄粒間凹隙，不是磚牆換色）。三者皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，僅沿用相同四份 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps 與 physical repeats；只是表面 shading／normal map 效果，不提供完整植株／果實拓撲、geometry、真實刺、displacement 或刺與植株物理。前九十九種輸出須逐位元組保持不變；公開 options、呼叫者 ownership 與借用 maps 的生命週期不變。

紙材包裝包含瓦楞紙板（corrugatedcardboard，外露的圓潤紙質楞脊與谷槽、帶纖維的牛皮紙表面，不是金屬換色）、摺痕紙（creasedpaper，細微紙漿底紋上的交叉隆起摺脊與凹陷摺肩，不只是雜訊）與層疊紙（layeredpaper，不規則毛邊紙條交疊、明確階緣與下切陰影，不是紙張換色）。三者皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，僅沿用相同四份 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps 與 physical repeats；楞紋、摺痕與層緣僅為表面 shading／normal map 效果，不建立 geometry、切面、displacement、透明撕邊輪廓或撕裂物理。前一百零二種輸出（含原 paper）須逐位元組保持不變；公開 options、呼叫者 ownership 與借用 maps 的生命週期不變。

火山石表面包含玄武岩（basalt，深色細粒底紋、圓角多邊形柱頂與凹陷節理）、火山渣（scoria，暖暗紅色岩面、大小不一的緊湊凹氣孔與隆起孔緣）及黑曜石（obsidian，極深色、有光澤的不透明火山玻璃與彎曲貝殼狀剝片痕）。三者皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，僅沿用相同四份 seeded deterministic periodic maps 與 physical repeat；凹凸僅為表面 shading／normal map 效果，不建立真實岩柱、孔洞、geometry、displacement、透明玻璃、折射或發光。

打磨與清潔包含砂紙（sandpaper，錯列磨料凸粒高於背板，間隙帶脫落凹坑）、鋼絲棉（steelwool，三向斜向纏繞絲脊交錯，交點略抬高）與鋼絲刷（wirebrush，密排平行刷毛高於溝槽）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增磨料、絲線或刷毛 geometry，也不做 displacement。

廚房器具包含起司刨刀（cheesegrater，沖孔低於凸起孔環）、烤架（ovenrack，圓桿高於細橫桿、交點略抬高）與馬芬烤盤（muffintin，圓槽低於凸起模環）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增孔洞、圓桿或圓槽 geometry，也不做 displacement。

醫療敷料包含紗布（gauze，起伏交織的經緯紗交替上下、留有孔隙）、彈性繃帶（elasticbandage，斜向伸展羅紋交錯凹陷布邊溝）與冰袋（icepack，方圓絎縫格鼓起於接縫網）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增紗線、羅紋或絎縫格 geometry，也不做 displacement。

圓形單元包含氣泡布（bubblewrap，方格封氣圓凸鼓起於薄膜網）、亮片布（sequin，交錯圓片鋪於裸布、中央縫窩下陷並帶個別傾斜光澤）與小圓馬賽克（pennyround，圓瓷磚密排鼓起於凹陷填縫）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增圓凸、圓片或瓷磚 geometry，也不做 displacement。

球類表面包含排球（volleyball，三塊弧形面板以凹陷接縫分隔、表面細點凹紋）、保齡球（bowlingball，珍珠光環繞紋包覆三個凹陷指孔）與橄欖球（rugbyball，顆粒皮革面板穿過縫線繫帶）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增球體、指孔或繫帶 geometry，也不做 displacement。

烘焙甜點包含甜筒（wafflecone，斜向格紋凸脊環抱烘烤菱形凹格）、甜甜圈糖霜（donutglaze，平滑糖霜垂滴覆於多孔蛋糕體）與布朗尼（brownie，粗裂巧克力頂面間嵌核桃塊）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增格紋、糖霜、裂紋或核桃 geometry，也不做 displacement。

浴室清潔包含香皂（soapbar，圓角斜邊皂塊帶橢圓壓印與細緻氣孔）、絲瓜絡（loofah，交錯波浪纖維織成開放網絡）與菜瓜布（scrubbypad，粗礪磨砂圍繞凹陷六角切孔）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增皂塊、纖維或切孔 geometry，也不做 displacement。

水果剖面包含柳橙果肉（orangeflesh，凸起汁囊瓣片在凸起果皮環內匯聚於凹陷果白）、奇異果果肉（kiwiflesh，凸起種子凸點與淺色果心凸起於輻射纖維之上）及酪梨果肉（avocadoflesh，奶油般平滑果肉圍繞凹陷中央果核）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增果瓣、種子或果核 geometry，也不做 displacement。

裝飾礦石二包含綠松石（turquoise，深色蜘蛛網基質脈網絡漫布於拋光知更鳥蛋藍石面，凹陷且提高粗糙度）、薔薇輝石（rhodonite，暗色分枝狀氧化錳樹突凹陷於粉紅玫瑰石基底）及虎眼石（tigereye，絲狀絹絲光澤的金黃與深琥珀色纖維波狀帶）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增礦脈、樹突或纖維帶 geometry，也不做 displacement。

裝飾礦石表面包含孔雀石（malachite，濃綠色圓潤葡萄狀巢套生長帶與細微拋光起伏）、瑪瑙（agate，暖奶油、紅與橙色的拉長波浪巢套生長帶，輪廓尺度與拓撲區別於孔雀石）及青金石（lapislazuli，深群青色顆粒石面與淺色不規則方解石脈及內含物，不含金色黃鐵礦或金屬碎斑）。三者皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，僅沿用相同四份 seeded deterministic periodic maps、physical repeat 與公開 options；拋光與凹凸僅為表面 shading／normal map 效果，不提供透明、折射、虹彩或寶石 geometry。

`createMaterial(options?: Partial<PBRMaterialOptions>): PBRMaterial` 回傳新的材質、借用同一組 maps，最後套用呼叫者覆寫，不重新產生 maps。`destroyed` 是 getter；同步且冪等的 `destroy()` 只釋放生成貼圖，不銷毀材質、mesh 或覆寫的外部 maps。先移除所有使用者；Mesh／Scene 不自動擁有預設，銷毀後呼叫 `createMaterial()` 會拒絕。CPU 生成位於 core，透過 assets 既有 `Texture.fromImage` 邊界建立貼圖；共用 geometry、PBR shaders、backend upload／render 路徑不變，沒有逐幀生成。仍只有 WebGPU／WebGL2 支援 3D，Canvas2D 不新增 3D。[實際 consumer 範例](USAGE-zh.md#可重用的程序式-pbr-預設) 見使用說明。

### 材質 Finish、Material Asset 與 glTF Variants

`PBRMaterialOptions.finish` 接受 `anisotropy`、`anisotropyRotation`（弧度）、`iridescence`、`iridescenceIor`（≥1、預設 1.3）、`iridescenceThickness`、`subsurface`、`subsurfaceColor`、`subsurfaceRadius`（預設 0.5）、`dispersion`（≥0）、`heightScale`、`wetness`、`snow`、`dirt`、`damage`、`detailStrength`、`triplanar`、`layerBlend` 與 `lightmapStrength`；其餘皆為 0..1。未知 key 與超出範圍的值會拒絕。`material.finish` 為凍結的 `PBRFinish`，全預設值共用同一個實例。`fillPBRFinish` 把 20 個 float（`PBR_FINISH_FLOATS`）寫在 WebGPU mesh uniform 的材質 UV 區塊之後；WebGL2 設定 `finish0..finish4` 五個 vec4 uniform。取樣貼圖的 slot 配置不變。

Finish 強度為零時保留原 isotropic 路徑與 20-float layout。Anisotropy 用 tangent／handedness-aware 旋轉軸，對所有 analytic lights 計算 anisotropic GGX distribution 與 height-correlated visibility；IBL 用 bent reflection normal，仍不是 anisotropic environment convolution。Iridescence 以 Snell／Fresnel 介面及多次反射 Airy thin film，在 650／510／475 nm 近似 RGB，涵蓋 analytic 與 environment specular。公開 thickness 仍為 0..1，native packing 轉為 100..800 nm；三波長 RGB 與金屬 effective real IOR 都是近似，非完整 spectral／complex-IOR rendering。Reflectance 限制於 1。

Subsurface 不再額外增加能量，而以三個 normalized angular profile taps、每通道 scatter color／radius 替換 diffuse budget，支援方向／point／spot 光。此近似不需要 thickness 或螢幕資訊，但不是 spatial diffusion／多 pass SSS。Dispersion 以 Abbe-like IOR spread（強度上限 10）、獨立紅／藍折射 ray exit、local thickness 及 projection 計算偏移，保留 rough-transmission filtering 與每通道 path attenuation；零厚度不產生分色。仍是 screen-space 背景近似，不是 ray tracing 或任意多層幾何。

P132 的 angular radii 為 `r/4`、`r`、`min(2*r,1)`，權重為 0.25／0.5／0.25，其中每通道 `r = subsurfaceColor * subsurfaceRadius`。每個 tap 為 `max(N·L + radius, 0)/(1 + radius)^2`；在 `N·L ∈ [-1,1]` 的積分為 0.5，與 Lambert diffuse 相同，scatter color 不會增加此能量預算。Radius 為零時精確還原 scatter-tinted Lambert diffuse。P133 的紅／綠／藍 IOR 分別為 `max(1, ior-spread)`、`ior`、`ior+spread`，其中 `spread = (ior-1)*min(dispersion,10)/40`。每通道使用自身的折射出口投影與 Beer–Lambert path；IOR 為 1 或 dispersion 為零時不產生分色。既有 finish 分支在停用時跳過額外計算。

Height 保留既有四步 normal-map relief；wetness／snow／dirt／damage、detail 與 triplanar 保留原行為。沒有新增 texture slots 或 uniforms。

`lightmap`／`lightmapSampler` 使用 emissive sampler。`pbrEmissiveSlot(material)` 回報 mode 0（無）、1（emissive）或 2（lightmap）；mode 2 時不取樣 emissive map，在加上 emission 前做 `color *= mix(1, bakedRGB, lightmapStrength)`。WebGPU 的 mesh cache 以材質實例為鍵，因此 `setMeshMaterial` 會正確重新綁定。

`MaterialAsset.fromImages(maps, overrides?)`／`create(options)`：`maps` 的 `base` 必填，另有 `metallicRoughness`、`normal`、`occlusion`、`emissive`、`lightmap`，每項可為 `ImageBitmapSource`（由 asset 解碼並擁有）或 `Texture`（借用）。`destroy()` 冪等並彙整清理錯誤，`destroyed` 是 getter。`setMeshMaterial(mesh, material)` 替換 Mesh 借用的材質（`Mesh.material` 仍是已發佈的 readonly 宣告）；非 `TextureMaterial` 會丟錯並保留目前材質。

glTF：`gltfVariants(asset)` 提供 mappings 與 `.selectVariant(name|undefined)`，不改 `GLTFAsset` shape；選擇先還原 defaults，未知名稱、非法 references 與缺少 UV stream 拒絕。Anisotropy／iridescence factors 填入 finish，maps 使用下述 packed optical 契約。Dispersion 需 transmission，physical extensions 不可與 unlit 併用。Variant materials 由 asset 擁有，dispose 後選擇拒絕。

資產製作保留這些 extensions 與貼圖，preflight 驗證 texture index、UV0／UV1 與 variant-only maps。`PBRMaterialOptions.opticalMaps` 借用 `anisotropyTexture`（RG 有號方向／B 強度）、`iridescenceTexture`（R factor）、`iridescenceThicknessTexture`（G 在 `iridescenceThicknessMinimum`／`Maximum` nm 範圍內插，預設100／400），各有對應 sampler 與 `textureCoordinates`。Frozen side table 不改公開 class shape；五個 optical layers 共用既有 sampler slot，各自保留 addressing／filtering。Loader／exporter／recipe 皆支援；上段歷史 scalar-only 貼圖拒絕已被取代。

以 `materialTextureCoordinates(material)` 讀取完整 UV slots；既有
`MaterialTextureSlot` union 與公開 class member 宣告不變，新 optional options
與 side-table exports 保持 additive。

已驗證：單元測試，以及 Chromium 在強制 WebGPU 與強制 WebGL2 下繪製十二顆 finish 球體且沒有 console、game 或 shader 錯誤（見 ACCEPTANCE）。未驗證：各效果相對任何參考的像素正確性、跨 backend 像素等價、其他瀏覽器或 GPU。

## 22. 2D 階層與 Atlas 圖形（P13）

- GameObject 仍為公開 2D facade；mutable local position／rotation／scale 以 parent × local 重算可重用 worldMatrix，保留 shear／reflection。Group2D 不绘製，add／remove、parent／children、updateWorldMatrix／getLocalBounds／containsPoint 沿既有 Scene ownership。Cycle／cross-Scene 拒絕，same-Scene reparent 保留 local pose；remove 解除註冊不 destroy，destroy parent 遞迴清理 children。
- Game presenting Scene 期間（模擬後的 render bracket），每個 GameObject 的 world matrix（及其所有祖先）只組合一次並在該次 presentation 內重用；presentation 之外的移動在下次呼叫即反映。覆寫 `updateWorldMatrix` 的子類別一律重算，`super` 之後的調整不會被套用兩次。移動 2D 物件的程式碼不得在 rendering 期間執行。
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

- Root exports RigidBody2D／RigidBodyOptions、Collider2D／Colliders／ColliderKind／ColliderOptions、convexHull、Compound2D／CompoundOptions2D／DynamicConcave2D、PhysicsWorld2D／PhysicsWorldOptions／CollisionDetail／ContactQuery／PhysicsRayHit、Trigger2D／TriggerOptions。Scene.physics 自動註冊 GameObject.body／collider；collider-only 為 static。不可變 body type 是 static／dynamic／kinematic；velocity 為 Vector2，angularVelocity 為弧度／秒。Kinematic 使用規定速度、零反質量／慣性；dynamic 保留 force／damping／gravity／sleep。
- Collider snapshot 為 centered circle／box／strictly convex polygon＋optional offset；polygon 3–32 vertices，invalid／degenerate／concave 拒絕。Extent 上限1,000,000；transform nonsingular，circle uniform scale。所有 non-static body 必須 world root，nested static 可 affine；無 screen physics。Scale 更新 geometry／inertia。
- Discrete fixed-step broadphase／exact convex contacts 使用 iterative linear／angular impulse 與 positional correction。Default gravityY980／fixedDelta1/120／maxSubSteps12／velocityIterations8／positionIterations3；step 正 finite、substeps1–120／iterations1–64，≤16,384 colliders；droppedTime 報 discarded catch-up。P43 time-weighted force／torque 保留 unfinished-tick contribution，fixed force 排下個 step，clearForces 取消 queue。此 solver 無 zero-width edges／3D；無 CCD 可穿隧。
- Reciprocaluint32category／mask default1／all，sensor只detect。collisionstart／precollision／postcollision／collisionend detail {self,other,normal,points,penetration,sensor,cancelResponse} stable snapshots／receiverreversednormal／currentstep-onlycancel；callbackfilter／remove／destroy保safeend。overlap(collider,owner) exactContactQuery[]排self／reciprocalfilter，raycast(origin,direction,maxDistance,mask?) normalize非零direction、sortedPhysicsRayHit[]。
- v1.12.3 對不可觀察的 receiver 不建立 collision snapshot／event，sensor 不計算不使用的 restitution；contact membership 與 response 語意不變。每個 receiver 前檢查 observation，callback 中新增 listener 仍收到當次事件，custom dispatch interception 也保留。實測 frame time 與未放寬的 host-scoped gates 分別記 ACCEPTANCE。
- Trigger2D(collider,{filter?,repeat?,onEnter?}) clone static sensor，default1acceptedenter／repeat0inactive／Infinityexplicit，triggerenter／triggerexit {self,other}／readonlyremainingRepeats，filterreject不耗count、不autodestroy。
- Sleeping（P31）：dynamic body 的線速度低於 `physicsDefaults.sleepLinearVelocity`（0.1）且角速度低於 `sleepAngularVelocity`（0.05）持續 `sleepTime`（0.5 秒）才會休眠，而且必須是其非 sensor 接觸群組內所有 dynamic body 都閒置，所以一疊物體會一起休眠。休眠 body 不做積分與接觸求解，速度歸零。以下情況會喚醒：`applyForce`／`applyImpulse`／`velocity`／`angularVelocity`／`wake()`、transform 被修改（`isSleeping` 比較入睡時記下的姿態）、sensor 接觸、運動中的 body 碰到該群組、接觸結束或接觸中的 static collider 移動。`RigidBodyOptions.allowSleep`（預設 true，亦有 setter）與 `body.isSleeping` 為對外介面；`isSleeping` 是 getter，偵測到姿態或速度變化時可能順便喚醒 body。
- Continuous collision：RigidBodyOptions.ccd／body.ccd 預設 false；P76 以 bounded relative rigid-motion CCD、真 contact response／explicit exhaustion 取代 P31 translation-only static-target algorithm（第59節）。
- Joints（P31）：`scene.physics.addJoint(joint)` 可附加 `DistanceJoint`（剛性，或以 `frequencyHz`／`dampingRatio` 變成軟彈簧）、`RevoluteJoint`（銷接，可選角度限制與馬達）、`PrismaticJoint`（沿軸滑動，含位移限制與馬達，旋轉鎖定）、`WeldJoint`，以及 `MouseJoint`（朝 `setTarget(x, y)` 軟拖曳，受 `maxForce` 限制）；以 `removeJoint`／`joints` 管理（上限 4,096）。Body 必須已註冊、至少一個為 dynamic，任一 body 被 unregister 時 joint 會自動分離。`anchor` 是 `bodyA` 上的世界座標點，`anchorB`（預設同 `anchor`）是 `bodyB` 上的世界座標點；兩者於附加時依當下姿態轉成 body-local anchor，不含 scale。未給 `bodyB` 時固定世界成為 A 側，所以角度、位移、軸與馬達速度都是該 body 相對世界的值。拘束使用不含 warm starting 的 sequential impulses，沿用既有 velocity／position iterations，很硬的鏈需要更多 `velocityIterations`。jointed body 預設不互相碰撞（`collideConnected` 可開），會成群休眠，joint 會喚醒休眠的夥伴。`breakForce` 在該 step 的 anchor 反作用力（每秒衝量）超過時移除 joint 並呼叫一次 `onBreak`。限制：無 rope／gear／pulley／wheel／friction joint，無 warm starting。
- 凹形與 chain（P31）：`decomposeConvex(vertices)` 將簡單多邊形（任一繞向、最多 256 個頂點、容許共線點）以 ear clipping 加 Hertel–Mehlhorn 合併，切成最多 32 頂點、嚴格凸且逆時針的片段；自交或零面積輸入拋 `RangeError`，片段數不保證最少。`StaticConcave2D(vertices, options?)` 是子物件為 static 凸片段的 GameObject（`friction`、`restitution`、`category`、`mask` 套用到每片），可移動或仿射縮放；dynamic 凹形 body 見下方 `DynamicConcave2D`。`StaticChain2D(points, {closed?, thickness?})` 每段建立一個細長凸四邊形（預設厚度 2，兩端各延伸半個厚度）。Chain 是有厚度的實心帶，不是零寬 edge：比厚度更薄的 body，或每 step 移動超過厚度者，除非使用 `ccd` 仍可能穿隧。以 `scene.add(shape)` 加入，各子物件如同 collider-only 物件註冊。
- Convex hull 與 dynamic compound：`convexHull(points, options?)` 自 3–256 個 finite 輸入點推導 polygon `Collider2D`（Andrew monotone chain，重複點先合併；`world2dLimits.hullPoints` 256）；化簡後 hull 超出 polygon 3–32 頂點範圍者由 polygon 驗證拒絕，座標維持在 1,000,000 幾何範圍內。`Compound2D(pieces, options?)` 是持有 1–256 個 convex polygon collider（`world2dLimits.compoundPieces`）、共用單一 dynamic body 的 GameObject：pieces 依計算出的 `centerOfMass` 重新置中、暴露 `area`，質量／慣性由整組 pieces 經 body 管線推導。第一片維持 root `collider`（setter 只接受該片或 `undefined`）；`colliderPieces` 暴露持有的 convex pieces，hit-testing、contacts 與 queries 都走 piece 清單。`options.ccd` 拒絕；`DynamicConcave2D(vertices, options?)` 將單一簡單凹形多邊形以 `decomposeConvex` 分片後建立此類 compound。Compound CCD 與 deforming sweep 仍不支援。
- Restitution 門檻（P31）：接觸的接近速度超過 `max(restitutionThreshold 1, |gravity| × fixedDelta × restitutionGravitySteps 2)` 才會反彈，所以像素尺度下靜止在重力中的彈性 body 能穩定並休眠，不會永遠抖動；強烈撞擊仍會反彈。
- Debug draw（P31）：`world.debugSnapshot()` 以純資料複製目前的 collider（種類、世界座標點或圓心／半徑、bounds、`dynamic`、`sensor`、`sleeping`）、活躍接觸（點、法線）與 joint（`type`、世界座標 `anchors`）。`PhysicsDebugDraw2D.create(world, {colliders, contacts, joints, bounds, region, zIndex})` 透過 `Graphics2D` 在所有 backend 繪出：static 藍、清醒的 dynamic 綠、休眠灰、sensor 黃、接觸紅、joint 青。把 `debug.display` 加入 Scene 並呼叫 `refresh()`（上一次 refresh 完成前的呼叫會被略過）；`visible` 切換顯示、`destroy()` 釋放 raster。這是除錯輔助，不是每幀正式繪製：每次 refresh 都同步重新 rasterize 所有繪製內容的外框，並原地重繪 display 唯一的 canvas 貼圖；沒給 `region` 時，超出 Graphics2D 座標／紋理預算的 body 會讓 refresh 被拒絕（記錄 log，保留上一張 overlay）。傳入 `region`（例如可視範圍）可略過範圍外的 shape、接觸，以及任一 anchor 在範圍外的 joint；只部分重疊的 shape 仍會整個繪出。

### Maps

- TileMapOptions {columns,rows,tileWidth,tileHeight,sheet}正integergrid≤65,536cells／positivefinite dimensions；IsometricMapOptions加elevationStep≥0（defaulttileHeight/2）。Group2D借sheet／Texture、重用Sprite／colliderchildren。
- ImmutableTile {frame:number|undefined,solid,elevation,collider?,metadata?}，setTile(column,row,Partial<Tile>) preflightgraphics／shape／registration，getTile驗grid、clearTile reset。Solid預設top-leftbox／isodiamond或customconvex；可無visibleframe，screensolid拒絕。
- tileToLocal／tileToWorld(column,row,out?)含cellelevation，orthotopleft／isotopvertex。worldToTile(point,out?) hierarchyinverse到zero-plane、可回grid外integer；無known-elevation overload。pickTile(point,out?) elevatedtopmostgraphicrectangle／diagonal-elevation-insertionorder，非alpha／exactdiamond；singularpickundefined、inverse拒絕。只檢查點附近 culling 格內的 tile；Scene 外編輯後到下一次 culling 前則檢查全部已設定 tile。
- Camera transformedconservativecull含elevation／overhang／renderOffset，只改renderEnabled、不移solids；hidden／clearedpool保留重用且不擴bounds。Edits／transform／Scene removal／destroy更新colliders，destroyownedchildren不destroyborrowedatlas。無hex／staggered／multilayer／editorimporter／navigation。
- Scene 內的 `setTile`（含 `TiledTileMap`）在 map-local viewport bounds 與上次完整 culling 相同時只重算被編輯的 cell；camera、viewport 或 map transform 移動 bounds 時，只重算上次或新 bounds 觸及的 8×8 tile culling 格內的 tile，完全位於兩者內部的格則維持啟用而不重算（其餘 tile 原本就在上次 bounds 外、也在新 bounds 外）；visibility 改變、transform 奇異、Scene 外的編輯，或 bounds 跨越的格數多於 map tile 所占格數時，才重算全部已設定 cell。大量填入因此為線性；`updateCulling`（每次 update 與 render collection）在 bounds 不變時整個略過 cell pass，Scene 外的編輯會強制下一次完整重算。Tile `renderEnabled` 反映 viewport 覆蓋、map visibility 與是否有 frame；tile Sprite 自身 `visible` 由 rendering／picking 處理，不併入 `renderEnabled`。Tile Sprite position／anchor 屬 map 擁有的 layout。
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
- 目前 Canvas2D 的完整未 tint image frame 借既有 versioned source snapshot，不為每 sprite 重畫 shared scratch。Cropped／packed-rotated／flipped／tinted frame 仍走同一 pixel conversion path，但每組不同輸入（source 與 version、distance-field scale、frame basis、繪製尺寸、tint RGB）只畫一次，之後從該 snapshot 重畫；最多保留 `rendering2dLimits.canvasFrameSnapshots`（256）張、合計 `canvasFrameSnapshotPixels`（4 Mi px），最久未畫者先淘汰；render-target source 或超過上限的 frame 仍每次重畫 shared scratch。整數位移 1:1 複製、且像素全為完全不透明或完全透明的 tinted frame，改由每個 source 版本讀回一次的像素（同樣受該像素上限約束）直接 tint，不再讀回自身繪製結果；半透明或需重新取樣的 frame 仍每次讀回，輸出維持一致。Unload、source destroy 與 renderer destroy 會釋放 snapshot；borrowed ownership 不變。原本每次 draw 共用的 scratch，其 Chrome canvas backing 取決於讀回／resize 歷史，所以帶 tint 的 trimmed 或尺寸不一 frame 可能與舊輸出有少數邊緣像素不同。Native 效能觀察只涵蓋已記錄的 workload／host，不承諾通用 FPS。
- Canvas2D `cacheAsTexture` layer 帶非白 group RGB 時，每個 layer 保留一份 tinted copy，直到 `updateCache` 或 RGB 改變才重算；layer 改以未 tint 合成或失去 isolation 時釋放。未 cache 的 isolated layer 仍每幀經 shared scratch tint。
- WebGPU 與 WebGL2 的 isolated layer（無論是否 cache）只要 2D draw 持續合成就保留三個同尺寸 native targets；某次 draw 不再使用、尺寸改變或 group 銷毀時釋放。未 cache layer 因此每幀重畫，但不重新配置。
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
最多八個 point、八個 spot 加四個 directional cascades，共 60 格。每格只畫 world
bounding sphere 觸及該格光源視錐的 caster（`frustumCulled = false` 或 bounds 非有限的
mesh 一律繪製），`shadowDrawCalls` 計的是逐格實際 draw；point 光源仍可能把 caster
畫進最多六個面，請節制使用投影光源。

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
各 material map 可獨立選 UV0／UV1及 affine `KHR_texture_transform`，不要求 shared transform。
有界 environment prefilter／數值 split-sum BRDF 見
[P122](#p122-有界-ggxcharlie-ibl)，不宣稱 reference path tracer 精度。規格見
[IOR](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_ior)
與 [specular](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_specular)。

### Clearcoat（P39b）

`clearcoat`／`clearcoatRoughness` 都是 0–1、預設 0。`clearcoatTexture` 以
linear R 乘強度，`clearcoatRoughnessTexture` 以 linear G 乘粗糙度。
`clearcoatNormalTexture` 是獨立 tangent-space normal；沒有此貼圖時 layer 使用
幾何法線，不沿用 base normal map。`clearcoatNormalScale` 預設 1，允許 signed 值。
三個 slots 各有對應的 `*Sampler`，所有貼圖都借用。

固定 IOR 1.5 的 microfacet layer 在 base 上反射 directional／point／spot／environment
lighting，包含 metallic 表面；補償後積分反射率同時衰減底層 lighting **與 emission**。
強度 0 跳過 layer；roughness 的數值下限與 base BRDF 相同為 0.04。
這是無限薄 coating，不做 refraction 或層間 scattering。與 `geometry.tangentTexCoord`
一致的 identity map 使用 Geometry tangent；其他 basis、coordinates／native
deformation 保留各 map 的獨立 derivative frame。

GLTFLoader 接受 required `KHR_materials_clearcoat`、factors、三個 maps、normal scale
與 samplers，各 map 獨立 UV0／UV1 transform；與 unlit 共存會拒絕。
Layer描述見 [clearcoat 規格](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_clearcoat)；
目前有界數值積分／能量分配見P122。

### Sheen（P39c）

`sheenColor` 是 0–1 的 linear RGB（預設黑色，停用 sheen），`sheenRoughness`
為 0–1（預設 0，BRDF 數值下限 0.04）。`sheenColorTexture` 以 sRGB decode 後的
RGB 乘顏色，`sheenRoughnessTexture` 以 linear alpha 乘粗糙度。
`sheenColorSampler`／`sheenRoughnessSampler` 沿用借用 slot 契約。
GLTFLoader 接受 required `KHR_materials_sheen`、factors 與兩個 maps，
拒絕 unlit 共存與不相容的 slot transforms。

兩 backend 的直接光 sheen 採 Charlie distribution／visibility；base albedo scaling
直接光用light／view，間接光用view，衰減底層lighting但不衰減emission；
clearcoat 再疊在 sheen 與 emission 上。預先產生的 32×32 directional-albedo table
每格以 128 elevation × 256 azimuth 樣本積分，限制於 0–1、雙線性內插；
每 renderer 只上傳一次 4 KiB uniform buffer，不多佔 texture slot。
可用 `node scripts/generate-sheen-lut.mjs` 重產，再 format `src/data/sheen.ts`。
兩個產生的表（sheen 與下方 GGX 表）都以 base64 little-endian float32 bytes 發佈，
模組載入時由 `src/data/float32-lut.ts` 逐 bit 精確解碼。
每幀不做CPU table積分或table上傳。

Sheen IBL 使用 directional albedo與sharp environment／probe atlas的有界Charlie積分，
不使用GGX roughness mips。取樣數／lookup解析度限制見P122，不是reference-renderer
convergence。方程與 layering 見
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

World.stats 重用 readonly PhysicsStats3D：candidatePairs／narrowphaseTests 是最後 fixed tick，queryCandidates 是最後 query。只有 body 與 sensor 查詢 broadphase，candidatePairs 因此只計至少一方是 body 或 sensor 的 bounds 重疊配對；兩個無 body、非 sensor collider 的重疊永不成為 contact，不列舉也不計數。Destroy 清 counters／membership。Reciprocal filters／sensors／stable lifecycle／即時 mutation／remove reconciliation 不變；counts 不是 GPU time／FPS 提升證明。

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

`new AssetManifest(options)` 先驗 shape 再讀取，由載入的 JSON 建立時以 `TypeError`（options／entry 非物件、`entries` 非陣列、alias 非字串、`owned` 非 boolean、font 缺 `options`、`bundles` 非 record 或成員非陣列）或既有 `RangeError`（預算／alias／acquisition）拒絕，不再出現一般屬性存取錯誤。Truthy 但非 boolean 的 `owned` 會被拒絕，因為先前載入與釋放對它的判斷不一致。

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

2D CCD 是 bounded relative rigid 平移／旋轉 conservative advancement；exhaustion 只保留 proven-free motion，ccdStats 報省略 suffix，保留 velocity、不偽造 impact。Sensor discrete，compound CCD 與 deforming sweep 不支援。CharacterController2D 借用已註冊 upright root convex owner／kinematic body，缺 body 才自建。在 Scene.fixedUpdate 呼叫 move(displacement,{epoch:scene.fixedFrame})，caller 提供 +Y-down gravity／jump。Slope／stair／slide／recovery 與旋轉／平移 local-anchor carry 有界；每 epoch 只消費一次 carry。Jump／teleport／scale change／blocked carry／support remove-re-register 會 detach。Destroy 只移除自建 body；保留 reused result vectors 必須 copy。

Scene.createLocomotion3D(controller,options) 擁有 CharacterLocomotion3D，在 caller fixedUpdate 後、physics 前一次推進。不得另 manual advance 或把獨立 mixer 加入一般 Scene animations。它借用 upright unit-scale capsule controller／visual root，自有 mixer／state／root binding，body-local root stride 經 swept move。Gravity／jump／air control 是 velocity-driven，不消費 root vertical／pitch／roll。Explicit phase names／authored motion speed 決定 state／rate；measured locomotion velocity 不含 carry。Pause／seek／stop／callback cancellation 丟棄 stale root work，destroy 保留 borrowed objects。

NavigationSurfaceBakeJob3D 每 XZ cell 保留 descending support slots（default4／max8，總 slots≤8192），有限 interior samples＋swept capsule clearance。Overflow 拒絕、不發布半成品；同 XZ floors 無 implicit edge，合法 stairs／authored special link 才換層。NavigationGraph3D.project() 強制水平／垂直距離上限，回 nearest certified sampled node，不是 polygon snapping；超過 baked agent radius 拒絕。traverseLink 必須真移動並回 pending／complete／blocked；無 handler 則 block／replan，complete 要求抵達 destination。Scene bake／search 共用 cooperative quota；revision／cancel 使 stale route 失效。有限 sampling 不是 continuum support certification／polygon navmesh。

### Visibility、native descriptor 與 lights（P79／P80／P84）

RenderVisibilityCache 分開 color visibility／shadow casters；offscreen／occluded active-LOD casters 及完整 shadow instance streams 不受 packed color instances 取代。Mutable pose 仍 O(meshes × ancestor refresh＋active skin joints)，一般 BVH refit O(meshes)，membership rebuild O(meshes log meshes)，instance tests O(instances)，HLOD aggregate O(detail descendants)。Reuse 不代表零 pose work。Screen-size LOD 用 logical pixels；LOD／HLOD transition 真畫 coverage，不是 RGB darkening。Replacement destroy owned nodes，不 destroy borrowed geometry／material／textures。

Opt-in native depth occlusion 必須 completed zero-sample exact-state proof；camera／geometry／pose／skin／texture／fade／depth 改動立即 invalidates。Pending／stale／unsupported／exhausted 一律 visible。Queries bounded／async、不同步等待；frustum 不冒稱 occlusion。Custom depth-changing material 保守使 proof 失效；unbounded deformation 維持 visible。

NativeMaterial3D 繼承 TextureMaterial，immutable WGSL／GLSL hooks（xyzDeform／xyzSurface）、64 finite Float32 mutable uniforms、最多四 borrowed textures；無 transpiler／arbitrary bindgroups。setUniforms 驗更新，public view 在 prepare／submit 前驗。Optional finite nonnegative deformationBounds 限 final mesh-local displacement；未提供則 disable bounds culling。Destroy descriptor 釋 renderer entries、不 destroy borrowed textures。Prepare／warmup async／fallible，caller 處理 reject／cancel；loss 僅保留 live ownership 並在同 backend rebuild。Canvas2D 明確拒，不 silent ignore。ABI／lifetime 契約不是 final native acceptance。

`NativePBRMaterial` 繼承 `PBRMaterial`，共用 uniforms、lifetime 與 `deformationBounds` 契約，但 hook 是 `xyzPhysical` 而不是 `xyzSurface`。引擎仍取樣 PBR maps 並擁有 lighting；hook 只在 filtering 前替換已解碼的 base color、metallic、roughness、occlusion 與 emission，不得新增資源。`isNativeMaterial3D` 同時辨識兩種 native class。`prepareMaterial`、resource preparation 與 warmup 包含物理材質及其借用的 PBR maps；tracked shadow cache 會讀取物理 uniforms。Canvas2D 明確拒絕。

Native vertex 可選 `xyzDeformInstance(position, normal, uv, instance)`，回傳
`XYZVertex`；instance 在 WGSL 為 `mat4x4f`、GLSL 為 `mat4`。Color／shadow
同傳 local instance matrix（非 instanced 為 identity）；缺省仍執行 `xyzDeform`。
一般 mesh 以物理 lobe／deformation／shadow／IBL bits lazy 編譯，variant cache
上限64；destroy／loss 清除。Cold sync draw 仍同步編譯，不跳過 draw；async
prepare 使用可用的 parallel／async driver API。Native hooks 保留完整 shading。
Build 後 `node scripts/check-mesh-shader-budget.mjs` 驗 plain PBR fragment
低於 `src/data/rendering.ts` 的40,000 bytes，不代表 Windows WARP timing 保證。

LightSelectionOptions.exceedPolicy 為 select／error；每種 pool≤1024，native shading slots 仍 bounded。按 priority／contribution／draw bounds（camera-selected visible draws）選取，不是 clustered／unlimited lighting。Culled 與 relevant overflow 分開計；error 拒超額 relevant lights，select 明示省略低順位 contribution；shadow atlas capacity 獨立。`update()` 在 Scene presentation 內執行且某類光源達 32 個時，該次 presentation 的選取改由有限 range 光源 bounds 的 grid 收集候選（無限或過大 range 永遠是候選），並依 pool 順序評估，結果與 counts 等同完整掃描；presentation 外或 draw bounds 很大時仍逐一掃描。

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
在與 `geometry.tangentTexCoord` 一致的 identity map 使用 Geometry tangents，其他 coordinates 使用自己選擇／轉換後的
UV derivatives；shadow alpha 使用 base map coordinates。

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

## 63. 未發布擴充的資源契約（P104–P118）

目前 profiles 與 backend 界線見 [CURRENT](CURRENT.md)，取得／清理範例見
[USAGE](USAGE-zh.md#commonjs-與逐幀-3d-貼圖)。CommonJS 與 ESM 使用獨立
constructor graphs，不能互換物件 identity。部署選定的完整 output tree，
並保留官方 ESM vendor／worker；不加入同步 Node ESM bridge 或 vendor patch。

3D material 保留既有 immutable Texture properties。`texture` 為實際、借用的
base fallback，`textureSource` 選擇 canvas／video override；PBR `sources`
snapshot 各 slot 的 PBRTextureSources，native `textureSources` snapshot 最多
四個 indexed hook maps。版本、residency、visibility 與 shadow invalidation
讀取 effective sources，不只讀 fallback。材質不接管 fallback／override 所有權。

Distance-field glyph pages 帶 validated SDF／MSDF metadata；native sprite
pipeline 從單通道 distance／RGB median 重建 coverage，Canvas 使用有界、
scale-quantized raster coverage。MSDF 產製需要自行提供 polygon contours 與
獨立 edge coloring；所有 glyph borrowers 移除後才由 BitmapFontAsset 釋放 pages。

API compatibility gate 先正規化 consumer 看不到的 private declarations，以及
真正 additive exports／optional options，再 intern 相同且 dependency-closed 的
遞迴圖。新增 required members、既有 signature／writability 與 public literal
types 仍需通過原契約；runtime ownership／presentation 另靠實跑 consumer 證據。

## P119. Tangent 與 handedness

`GeometryData.tangents?: ArrayLike<number>` 每頂點提供四個 finite／Float32 可表示數值：
非零 xyz direction 與嚴格 ±1 的 w。Geometry 複製、normalize 至 `geometry.tangents`，
既有八浮點 vertices 不變。`GeometryData.tangentTexCoord?: 0 | 1` 指定 basis（預設
UV0，UV1 需要 `uvs1`）。缺省 tangent 採此 basis 的角度加權 indexed triangles，退化時
保留 finite perpendicular fallback；這個預設生成不是 reference MikkTSpace。
`GeometryData.tangentConvention?: 'uv' | 'gltf'` 指定 derivative normal-map Y handedness
（預設 `'uv'`）；reference generator 記錄所選 convention，glTF 包含 authored tangent
皆設 `'gltf'`。UV transform fallback 與 clearcoat 保留此 sign，不靜默反轉 bitangent。

`generateMikkTangents(source, {texCoord?: 0 | 1, convention?: 'uv' | 'gltf'})`
執行完整 MIT vendor 的 mikktspace 1.1.1 reference WASM；預設 `'uv'` 保留 reference
sign，`'gltf'` 套用上游 glTF sign conversion。回傳 `{geometry, sourceVertices}`，不改
原始 source；結果在 tangent discontinuity 拆 vertex，複製所有 Geometry channels。
`sourceVertices[newVertex]` 是原 vertex index；建立 skin／morph consumers 前須以此
remap influences／delta arrays。GLTFLoader 在 normal／clearcoat-normal primitive
缺 tangent 時自動處理，包含 UV1、四／八 influences；工作量受既有 model limits 限制。
完整上游檔案、MIT [LICENSE](../vendor/mikktspace/LICENSE) 與
[來源／已驗證 WASM SHA256](../vendor/mikktspace/manifest.json) 保留；不新增 npm runtime
dependency，build 複製完整 vendor tree。

glTF 支援 float／normalized signed BYTE／SHORT VEC4 與 TANGENT
xyz morph deltas。CPU／native skin 與 model 使用 forward tangent、inverse-transpose
normal、正交化及 determinant-sign handedness。直接修改 tangent 後呼叫 `markUpdated()`。
僅 normal morph 也重投影 tangent。GPU caches 擁有 tangent buffers，計入 residency
並在 eviction／失敗／destroy 清理。

## P120. Anisotropic texture filtering

`TextureSamplerOptions.maxAnisotropy?: number`／`SpriteSampler2D.maxAnisotropy?`
是 immutable 的 integer quality request 1–16，缺省 1。大於 1 時 min／mag／
mipmap 必須 linear，明示 nearest 組合拒絕。一般／native 3D base、所有 PBR
slots、Sprite albedo 與 matching CPU-backed normal map 都套用 request；
既有 normal source／dimensions 限制與 borrowing ownership 不變。

`GraphicsCapabilities.textureAnisotropy?: Readonly<TextureAnisotropyCapabilities>`
包含 `maxRequest: number`（engine ceiling 16）、`maxEffective: number | null`。
GL 回報可用 integer driver ceiling（最多16），缺 `EXT_texture_filter_anisotropic`
為1。Canvas2D 為1，仍不支援3D／native payload。WebGPU 實際 platform clamp 不可
查詢，因此回報 null；接受 request 16 不代表實際以16執行。既有外部1.x renderer
可省略此新增 capability。

Native sampler／texture group cache key 含適當的 effective／requested value；
相鄰 Sprite 按 sampler 分 batch，GL clamp 相同的 request 可合批。Sprite opt-in
使用 gradients／supplied mips，1仍保留舊 level-zero 路徑；normal／albedo 一致，
含 local custom material draw。Atlas 應提供 extrusion 與適當 mips，sampler
不會自行產生 mip 或增大 padding。

Flattened transmission／thickness array 不能用 hardware sampler 跨無關的 native
rows，因此保留 independent wrap／filter，request 時沿 principal footprint
axis 做最多16 taps 的 linear integration，含 sheared UV。這是有界 base-level
integration，不是完整 optical mip pyramid，不保證等於 native filtering。
Opaque／MASK／BLEND／shadow 共用 base sampler。

Native 契約依據 [WebGPU sampler descriptor](https://gpuweb.github.io/types/interfaces/GPUSamplerDescriptor)
與 [Khronos extension](https://registry.khronos.org/webgl/extensions/EXT_texture_filter_anisotropic)。
`pnpm smoke:filtering` 實跑斜視 Game／Scene、2D normal、batch transition、
無 extension 與 Canvas2D 限定 fallback。

## P121. Specular filtering／MASK coverage

`specularAntiAliasing` 是 [0,1] 的 finite strength，預設0。Opt-in 同時計算
surface-normal derivatives 與四點 normal-map footprint moments，base／clearcoat
獨立處理。Mean normal 按 strength 混合；surface derivatives／sample variance 過濾 GGX
alpha squared，perceptual roughness 的公式為
`r' = fourthRoot(min(1, r^4 + min(2 * variance, 0.18) * strength))`。
四個 Gauss points 使用各 map 的 transformed UV、sampler、gradients 與既有 mips；
strength1 每張啟用的 normal map 四次讀取，中間 strength 另讀 center，0保留原路徑。
這是有界近似，不是 TAA／精確 BRDF integration，也不能重建缺少的 normal mips。
Roughness 定義參見 [Filament](https://google.github.io/filament/notes/material_properties.html#roughnessgrayscale)。
Smoke 分開記錄 absolute RGB motion 與 normalized RGB temporal contrast；擴展高光
可能增加前者、降低後者，不能據此宣稱 radiometric energy 或所有場景減少閃動。

`alphaToCoverage` 預設false，只接受 MASK、明示 `0 < alphaCutoff < 1` 與
transmission0，要求 renderer antialiasing。Optional capability 的
`rgba8Samples`／`hdrSamples` 為實際可用數，1代表不可用；GPU使用four-sample
pipeline，GL查color／depth共同支援數並限4，Canvas仍只支援2D、回報1。
Coverage 用 alpha derivatives 與真正 sample mask；含LOD fade時仍走opaque／
depth-write，僅寫RGB、保留引擎3D clear的alpha1，避免HDR／composition再次乘coverage。
GL只在需要時建立MSAA color／depth target，opaque後resolve兩者，再走既有
transparency／post／2D overlay；reflection capture走自身HDR resolve。
缺float-color extension時，AA-only可用較低暗色精度的linear RGBA8；明示HDR仍報錯。
停用antialias／不支援sample count也報錯；single-sample shadow保留binary cutoff。

Version2 asset profile 可為明示linear／sRGB、straight／premultiplied-input color
semantics指定 `alphaCoverageCutoff` (0,1)；normal／opaque禁止。既有input正規化與
RGB filtering不變，完整mip chain完成後用alpha histogram／global scaling找每層
最接近base texel coverage的結果，不改base pixels或source ownership。
Tied alpha、zero alpha、小尺寸與byte quantization可能無法精確保留；
lossy codec／trilinear sampling也不保證相同比例。Material應使用相同cutoff；
沒有slot inference／runtime mip生成。`pnpm smoke:material-aa` 實跑native motion、
flat normal、HDR／MSAA／weighted／overlay／probe／停用AA／無float／Canvas邊界。

## P122. 有界 GGX／Charlie IBL

品質自動改善，既有 API 與16 texture slots不變。Sharp level0／background 與
order2 SH irradiance/pi 不改；所有rough mip採128個deterministic GGX NDF samples，
N=V、NdotL正規化。暫存linear source pyramid，依GGX PDF／equirect solid angle
決定trilinear footprint LOD；filtered work限256x128，再resample至既有level尺寸。
SH仍使用獨立64x32 proxy。Subtexel bright source、低解析度mip、取樣方位／極點
保留空間近似，不是path-traced convergence。

`scripts/generate-brdf-lut.mjs` 每endpoint grid point採65,536個NDF samples，
以height-correlated Smith GGX積分Schlick A/B，alpha=perceptual roughness squared。
64x32 RG Float32恰為16 KiB owned uniform buffer；shader bilinear lookup不占sampler。
NdotV零正規化至1e-4，數值A+B超1則正規化。Direct light同用Smith visibility與
穩定、未clamp峰值的GGX distribution，sharp highlight與舊denominator clamp不同。
獨立hemisphere quadrature在rough／grazing regression grid驗證A/B絕對誤差<0.012；
directional radiance moments誤差<0.035。

有界補償為 `1 + F0 * (1/(A+B) - 1)`；metal reflectance F0限1，HDR emission另計。
補償後積分反射率分配base diffuse／transmission與clearcoat外層衰減，保留IOR1／
specular-weight契約。物理有效輸入可維持unit white furnace，但不是精確光譜／
多次反射layer transport；HDR tint超1不作能量守恆宣稱。
參考 [Filament推導](https://google.github.io/filament/Filament.html)。

Charlie direct base衰減用view／light directional albedo最大值；indirect用32個
Charlie half-vectors取樣sharp atlas，正規化後乘既有integrated albedo，不用GGX lobe
冒充sheen。中心sample使front-facing normalization必為正；back-facing sheen為零。
含4 probes最多160次atlas sample calls／participating fragment。這是opt-in sheen
的有界成本／空間近似，不是anisotropic filtering、MIS或unbiased temporal convergence。
`pnpm smoke:ibl-quality` 實跑native HDR白／彩色furnace、layer邊界與owned API loss；
`pnpm smoke:ibl-quality --built` 走built public root，並非實體driver reset資格。

## Range-request asset bundle

新增 `loadAssetBundleRange`，不改目錄式 bundle 的 API 或 ResourcePool。manifest archive
table 驗證未壓縮 member offset／bytes、不重疊與 files 完整對應；各 files SHA-256 與
既有 manifest pin 保持完整性檢查。可在 ResourcePool load callback 轉交 signal，
不新增長期 cache 或 ZIP 解壓器。直接使用 `AssetBundleRangeReader` 時先以
`parseAssetBundleArchive` 驗證，caller 必須呼叫 `destroy()` 取消未完成讀取。

206 必須符合精確 Content-Range／length；200 在本次 load 保留一次完整 snapshot，
405／416／501 重試不帶 Range。其他失敗拋錯。完整 snapshot 以原 asset-recipe
128 MiB／宣告 size 限制 decoded HTTP bytes，不以壓縮傳輸大小替代。
load finally 在 parse／hash／abort 失敗時也釋放 reader 與暫存 URL。

## WebCodecs GIF／APNG 動態影像

`AnimatedImageTexture.decode(bytes, 'image/gif' | 'image/png', { plays?, signal? })`
只使用 WebCodecs `ImageDecoder`；API 不存在或格式不支援時明確拒絕，無軟體／image
element fallback 或 runtime dependency。複製輸入 bytes，ImageDecoder 負責完整 frame
的 blend／disposal；成功、失敗、取消均關閉 decoder 與每個 VideoFrame。
預解碼 snapshots 沿用 8 MiB encoded、4 Mi 總 frame pixels、8192 dimension 與 frame
數限制；atlas padding 亦計入 texture budget。

`durations`／`duration` 以秒計；`plays` 是含首次的總播放次數，缺省 repetitionCount + 1，
可指定正 safe integer 或 Infinity。自行在 simulation update 呼叫
`updateAnimation(deltaSeconds)`；不自動註冊 Scene、RAF 或 fetch。pause 凍結，reset 回到
frame zero 且保留 pause 狀態，play 恢復但不重啟 ended；有限播放停在末 frame。
只有可見 frame 改變才增加穩定 canvas source version。動態 frame 的缺失／零 duration
拒絕；單張靜態 frame 的 null duration 使用一秒。

`createAtlas()` 回傳獨立 owned texture、frozen frames／durations，可傳入 SpriteSheet。
SpriteSheet／Sprite 均借用 source；先移除 consumers，再分別 destroy 動態 source 與 atlas。
銷毀動態 source 不影響 atlas，destroy 為冪等。實測範圍另列 ACCEPTANCE。

## 有界 MP4 影片快照 demux

`demuxMP4(bytes, options?)` 將單一 MP4（ISO BMFF）檔案解析成
`VideoDecoderConfig` 加上有序的 `EncodedVideoChunk`；
`VideoTextureDecoder.fromMP4(texture, bytes, options?)` 透過既有 WebCodecs 路徑
做有界快照解碼，不是計時播放。輸入 bytes 仍由 caller 擁有；config 與 chunks
各自持有獨立複本。demuxer 只接受單一 video track、單一 sample description：
avc1（avcC）、vp09（vpcC，codec-string 設定）或 av01（av1C）。Sample tables 必須
自足（stsz/stts/stsc 與 stco|co64，可選 ctts/stss；沒有 stss 表示每個 sample 都是
sync），chunk 順序、時間戳與 key 旗標依表產生，不做 edit-list 重新計時。

Fragmented 容器、加密 samples 或 entries（sinf/encv）、edit lists、外部 data
reference、多個 tracks 或 descriptions 與不支援的 codec 明確拒絕（不支援的內容拋
`AssetError`，格式錯誤或越界拋 `RangeError`）。解析受 `videoTextureLimits` 限制：
maxBytes 128 MiB、maxSamples 100,000、maxTracks 32、box 嵌套深度 16、單一 sample
≤8 MiB；`options` 只能再收緊。解碼後畫面維持既有貼圖預算（維度 8192、4 Mi
pixels）與 decoder queue／queued-bytes 預算（flush 分批）。`fromMP4` 不持有 texture、
回傳一般 decoder，close／destroy 契約不變。

## Opt-in Profiler

root `Profiler` 附掛於 optional `Renderer.profiler`，Game 以實際 RAF timestamp
量測完整 CPU frame，另保留 renderer CPU submit 與非同步 GPU timestamp。
預配置 ring 預設 240 frames，上限 65536；report 時才配置 quantile 資料。
預設 hitch threshold 50 ms，hitch 是累計值。停用不讀 clock、不配置每幀 samples；
pause／hidden 清除 cadence，`destroy()` 解除附掛。GPU timing 必須在 Game.create 啟用。
RAF Hz 是 callback cadence，不是確定呈現；JS allocation、GPU／presentation FPS
明確為 null。GPU bytes 是 texture／geometry residency 加 target 估計，不是完整 VRAM。

Chromium regression 以強制 GPU／GL scene 比較 top-left RGB byte-domain，
每 channel mean 與 nearest-rank p99，不做影像對齊；同 backend repeat 記錄 noise，
垂直翻轉／錯色負面測試必須失敗。threshold 與量測證據另列 ACCEPTANCE。

## glTF 匯出快照

`await exportGLTF(sceneOrRoots, options?)` 回傳 `{json,buffers}`；將 JSON 與
binary buffer 寫到 `bufferURI`（預設 `scene.bin`）。`exportGLB(...)` 回傳
GLB 2.0 ArrayBuffer；兩者不寫檔、不 fetch、不接管資源，也不改動 pose。
輸入接受 Scene、無 parent 的 Object3D／Group／Mesh／SkinnedMesh 或 roots array。
保留 hierarchy／local TRS、positions／normals／UV0／UV1／tangents／colors／indices、
四或八個 skin influences、inverse binds、morph POSITION／NORMAL／TANGENT。
morph 以 captured undeformed base 匯出，避免已套用權重後重複變形。

PBR 所有普通 maps／UV transforms 及 loader 支援的 scalar KHR materials
extensions 會輸出；`variants:gltfVariants(asset).variants` 提供映射，當前材質作為
default，因此要保存原 default 時先 restore variant。`animations` 明確接受
AnimationClip 的 STEP／LINEAR／CUBICSPLINE TRS／weights tracks；missing targets、
duplicate target/path、empty clips 拒絕，不會 bake mixer／IK／additive 狀態。
Scene 匯出 camera，其餘輸入可傳 `camera`；`cameraAspect` 預設 1。
loader 目前不回傳 camera，camera 驗證須檢查輸出 JSON。

預設由 browser canvas encode embedded PNG；`textures:'external'` 必須提供
`textureURI(texture)`，不讀取 URL，也不需要 canvas。Texture 不保留原取得 URL。
native/compressed texture 不可 encode PNG。hidden／physics／non-3D／custom
nodes、native materials、live maps、lightmap、engine-only finish、coverage／AA、
anisotropy／custom LOD sampler、explicit point／spot lights／environment 拒絕；
ambient／directional renderer lighting、shadow／postprocess／gameplay 不屬 glTF
scene serialization。既有 loader budgets 仍適用。輸出與 source 資源均由 caller 管理。
完整契約見 [English](TECHNICAL.md#gltf-export)；CPU round-trip tests 與
`tests/browser/gltf-exporter.html` 的實際 PNG encode/decode 測試待主 agent 執行驗證。

## 自然世界：地形、水面與植被

以下 additive root API 沿用 Scene→WebGPU／WebGL2 原生 mesh、PBR、LOD／HLOD
與陰影路徑；Canvas2D 不畫 3D。此處說明 source 契約，不宣稱 runtime、
跨 browser parity 或效能驗收；實測另見 [ACCEPTANCE](../ACCEPTANCE.md) 與
[CURRENT](CURRENT.md)。

### 地形與靜態 splat

`new Terrain3D({heightmap,material,...})` 建立以原點為中心的 local XZ heightfield。
heightmap 接受 `{width,height,heights}`、RGBA `TerrainImageData` 或 live decoded-image
Texture。影像 heightChannel 為 0–3（預設 0），先除以 255，再套用 heightScale
（預設 1）／heightOffset（預設 0）。輸入複製成可編輯的 `heights:Float32Array`；
native／compressed textures 拒絕，Texture CPU readback 需要 browser 2D canvas。
每軸至少兩個 sample、總計最多 1,048,576；RGBA source 最多 4,194,304 pixels。
width／depth 預設 100，chunkSize 32、skirtDepth 2、lodDistances `[0,80,160]`。
chunkSize 1–256 source cells，最多 4,096 chunks／九個 LOD，distance 由零遞增。
各級加倍 stride、保留邊界並加 skirts；hysteresis／crossFadeDuration／可選
hlodScreenSize／shadow flags 沿用現有機制。Skirts 遮裂縫，非 geomorph／tessellation。

`heightAt(x,z)` 是 full-resolution triangle height，範圍外回 undefined；
`normalAt(x,z,out?)` 是 smooth finite-difference normal，兩者皆為 **terrain-local**。
`raycast(origin,direction,far?)` 則拾取目前可見 LOD／HLOD 的 world-space triangles，
含 skirts。編輯 heights 後呼叫 `markUpdated()` 更新所有級別高度、normal／tangent
及 GPU cache；不自動建立 physics collider／navigation surface。`chunks` 為 owned nodes。
`createStreamingCells(prefix?)` 提供既有 WorldStreamingController 使用的 fresh detached
roots，借用 source geometry／material；source 必須 live、無 parent、僅平移。
catalog bounds／translation 是快照，相關 source 編輯後需重建 catalog；consumer 退役前
保持 source 與材質存活。Terrain owns children，但借用 supplied material／maps。

`bakeTerrainSplat({layers,weights,size?})` 同步產生四張 CPU RGBA maps，不建立 GPU
resources。一至四個 opaque layers 對應 weight RGBA，各像素正規化、全零選 layer 0。
layer 可設 normal／metallicRoughness／occlusion／emissive sources、color／metallic／
roughness／normalScale／emissiveFactor 與 repeat UV scale。Color／emission 在 linear
light 混合、normal 重新正規化；physical map 為 R occlusion／G roughness／B metallic。
size 2–2048（預設 256），帶 alpha 的 base layer 拒絕。
`await TerrainSplatMaterial.create(options)` 包裝四張生成 Texture 與 native PBR
`material`；preset owns material／generated textures，不接管輸入。先移除 consumers
再冪等 destroy。這是 **靜態 CPU bake**，非逐片元即時 layer sampling／painting。

### 解析水面

`Water3D` 接受 borrowed texture、width／depth、segments（1–512，預設 64）、
waves／normalWaves（合計最多八個）、foam、materialOptions 與一般 mesh options。
Wave direction 是正規化 local XZ，amplitude 非負、wavelength 正、speed 為 angular
radians/second，phase 為 radians。geometry waves 改頂點，normalWaves 僅加 ripples。
materialOptions 沿用 PBR maps／transmission／volume attenuation。
foam threshold／fade／strength 是 wave crest height 效果，**非 depth shoreline foam**。

自行於 Scene update 呼叫 `update(deltaSeconds)`（非負模擬 delta）或
`setTime(elapsedSeconds)`；`time` 回報 elapsed。Native color／shadow 共用變形與
保守 bounds。`sampleSurface(x,z,out)` 填入 reusable local height／normal／foam。
CPU vertices 仍是平面，因此一般 Raycaster／physics／navigation 看不到動畫水面。
反射／折射沿用 PBR environment Fresnel 與 opaque-scene transmission；不新增 planar
reflection／流體模擬／underwater／公開 scene-depth shoreline sampling。
Water owns native material，destroy 一併清理它，不釋放借用 maps。

### Seeded 植被

`createGrassGeometry(width=0.1,height=1,segments=4)` 建立直立 tapered blade，
segments 1–1024。`scatterVegetation(options)` 接受 geometry／material、XZ bounds、
candidate count（0–1,000,000）、uint32 seed（預設 1）、density／bilinear densityMap、
sampleSurface、height／slope filters、scale interval、tileSize／batchSize、
alternate lod、fadeStart／fadeEnd。Count 是候選，不保證輸出量；acceptedCount 是 survivors。
surface normal 只篩 slope，不使 blade 傾斜；placement 使用 height、seeded yaw／uniform
scale。Sampler coordinates／height 為 scatter root local，caller 負責 transform conversion。
result 的 root owns tiled VegetationBatch／InstancedMesh children，借用 geometry／material／
maps；加入 Scene 的是 root。LOD coverage fade 共用 color／shadow，distance fade 依 batch
origin 而非單 blade。預設 tileSize 16、batchSize 1024、fade 80–100 world units。

`VegetationMaterial` extends NativePBRMaterial，可設 windAmplitude／frequency／direction、
bladeHeight／rootHeight／phaseScale；`update(timeSeconds)` 接受 **absolute 模擬時間**，
與 Water3D delta update 不同。Roots 固定、instance translation 改 phase；GPU sway
不改 CPU picking／collision geometry。移除所有 users 後由 caller destroy material，
再另行釋放借用 textures。

### Ribbon3D／Trail3D 動態軌跡

`new Ribbon3D({material,maxPoints?,lifetime?,mode?,curve?})` 預配置固定容量
triangle strip，maxPoints 2–65,536，lifetime 為正有限秒。`addPoint(x,y,z,time)`
接受 mesh-local finite coordinates 與非遞減秒數，滿容量覆寫最舊點；
`pointCount` 回報目前點數。`update(time,viewDirection?)` 到期移除點，
重用 vertex／index／linear RGBA color buffers，呼叫 Geometry.markUpdated 走既有
native GPU upload。Curve 以 normalized age 0–1 線性插值 width／color，需 2–64 keys
涵蓋首尾；alpha fade 需借用 transparent material。Flat 模式用 local Y-up，
camera-facing 需 caller 提供 mesh-local 非零 camera view direction。

`new Trail3D({...ribbonOptions,target,minimumDistance?})` 的 `sample(time,viewDirection?)`
讀 target world position，位移達 minimumDistance 才新增點，每次皆 update 到期資料。
因此 Trail 必須無 parent 且 identity transform，不能把 world positions 再轉換一次。
`clear()` 重設 points、monotonic timestamp 與 target sampling history。
Scene owns ribbon／trail object，material／maps 與 target 均借用、不因軌跡 destroy
而銷毀；材質／貼圖由 caller 在最後 consumer 移除後釋放。Canvas2D 不畫 3D 軌跡。

[world-nature](../examples/world-nature/) 展示 terrain／splat、水面、moving-object trail、
seeded wind grass；`?renderer=webgl2|webgpu` 強制 backend，`&stress=1` 請求
1,048,576 source height samples／10,000 grass instances。Workload 大小非 FPS 保證。

## 螢幕空間方向光接觸陰影

`ContactShadows.set(scene,new ContactShadowSettings(options))` 啟用；
`get(scene)` 取得可變設定；`set(scene,undefined)` 關閉。預設世界單位
distance 0.2、thickness 0.03、bias 0.005，steps 16（整數 1–64），
strength 1（0–1）；每幀驗證。Canvas2D 明確拒絕此設定。

WebGPU／WebGL2 每幀用獨立相機深度 prepass 捕捉可見 opaque／masked
mesh（保留 skinning／morph／instances／native deformation／alpha tests），
不以陰影 atlas 代理場景深度、不要求 HDR／postprocessing 或開啟 shadow maps。
沿方向光 bounded raymarch，投影到深度貼圖並反投影作世界距離 thickness
判斷，只乘上方向光 direct lighting，其他光照／emission 不變。

主 render 使用 MSAA 時 prepass 仍為單樣本，alpha coverage 採 binary tests，
不嘗試不支援的多樣本深度 resolve；TAA 時使用相同 jitter camera。
不提高 baseline fragment sampled texture 限制：WebGL2 的 combined depth texture
將實際相機深度放在獨立區域，陰影 atlas 複製到原 texel 座標區域，共用既有
shadowMap sampler；只共用資源，不以 light-space 深度替代相機深度。
WebGPU 用 compute 把實際相機 prepass 深度複製成 scene binding 8 的唯讀
storage buffer snapshot。兩者維持 viewport 解析度，配置 contact 資源前檢查
device framebuffer／texture／storage 限制，超過時明確 GraphicsError。
畫面外／transparent／transmissive
occluder 不在深度快照內，越出 viewport 的 ray 終止。Resize 重建、
停用／destroy 釋放；預設未啟用時沒有接觸陰影 shader source／targets。

## P135 數值材質參考閘門

Material-reference fixture 固定 camera／lights／environment／geometry／seed，
沒有 AA 或 animation；四組 grids 包含 roughness／metallic、finishes、
實際匯入的 glTF sample-like 材質與 procedural presets。Shipped entry
WebGL2／WebGPU 使用既有 top-left RGB mean／p99 比較，不對齊／重取樣。
Committed JSON 儲存 spatial numeric summaries 而非 binary PNG；量測分別
記錄各 backend 對 golden 與互相比較的差異。另實際渲染被改動的 material，
必須被 golden gate 拒絕。這是本機 renderer regression oracle，不是
path tracer／物理光譜參考／任意資產 corpus／跨裝置色彩校準。

僅新 procedural-normal-map corpus 允許每 RGB channel 最大8 bytes、
每 channel 最多0.2% pixels 差異，p99 必須0；其他 peer／golden 仍為 mean≤0.001／p99≤1。
本機 Metal 最大差1，hosted Linux SwiftShader 六個 pixels 最大差5；
delta9／超量 pixels／垂直翻轉 controls 必須拒絕這個有限的 sparse derivative-edge allowance。

## P136 lifecycle 計數範圍

Material-lifecycle gate 以 persistent native renderer 真正消費 MaterialAsset、
finish、planar capture／native material、baked volume、terrain、water、
decoded animation 與 opt-in post effects。每 cycle 先 destroy consumers，再釋放
owned sources，texture／geometry entries／bytes 及 render-target bytes 必須
回到 warmed empty baseline。Geometry 是無 `destroy()` 的 CPU data，owner 在
consumer teardown 後呼叫 `unloadGeometry`，不宣稱 Scene owns borrowed geometry。
合計只代表 tracked native cache／buffer／attachment estimates，不含 pipeline
cache／driver VRAM。WebGL 必須實際 lose／restore context、retain live frame
並比較 recovered steady pixels；本機 regression 不等於 physical qualification。

LUT texture storage 納入 texture residency（RGBA8：`4×size³` bytes），
inactive post targets 同時釋放 LUT；gate 實測16³ LUT→1 pixel neutral
binding 的16380 bytes 差異。Empty native scene 同時釋放 packed probe atlas
並清除借用的 environment references，避免內部 pin 留下 dead-scene atlas。

八輪都必須恢復 exact baseline。Runner 改為每輪最多60秒，terminal teardown
另最多60秒，不再八輪共用180秒 deadline。這些是 hang watchdog，不是 performance
acceptance budgets：native software readback 較慢不能免除任何一輪或放寬斷言。

# XYZ.js

Browser-native TypeScript game engine for 2D and 3D.

[繁體中文](#繁體中文) · [English](#english) · [日本語](#日本語)

**1.22.1 · [Apache-2.0](LICENSE) · npm 尚未發佈 / not published / 未公開**

## 繁體中文

XYZ.js 是以瀏覽器原生 API 打造的 TypeScript 遊戲引擎，不是遊戲本體，也不包含視覺化編輯器。透過統一的 `xyz.js` 入口使用 `Game`、`Scene` 與遊戲物件，不必直接操作內部 ECS。

- **2D**：Sprite、圖集與動畫、文字、Tilemap、粒子、UI、遮罩與混合。
- **3D**：glTF／GLB、PBR 與可重用程序式材質（自然、建築、工業與生活素材，含淺米色細砂磨長直木理椴木、凸球座面朝上圓孔不鏽鋼球面墊圈、綠種皮深綠圈長白種臍完整乾綠豆、平齊粉紅乳白同心眼紋Thomsonite拋光石、暖銀色不規則細刷紋鎳銀合金片、細密米色3/1連續浮紗Lyocell斜紋布、暖紅褐細木理與不規則深色長紋Tigerwood磨光面、細粒粉紅淡色礦物斑駁Thulite磨光面、奶白凸種皮黑眼圈短白種臍黑眼豇豆、閉環三波起伏銀色彈簧墊圈、金褐細縱紋與稀疏導管Iroko木材、米白1/1平紋苧麻布、深莓紅碎晶與黑色基底Eudialyte、綠色與鮭粉細粒斑駁Unakite、白色淡黃縱稜偏側小凹痕紅花瘦果、紅褐直木紋深色不規則斑塊Snakewood、圓外緣方開孔平面銀色墊圈、深灰基底零散靜態藍灰長石反光Larvikite、中央開孔斜坡高外圈杯形金屬墊圈、淺金粉褐橫向捲曲Anigre木紋、長形淡色種臍完整凸面的紅豆、藍綠底斷續淺色交叉紋天河石、雙圓孔盲凹穴圓鋼螺絲頭、淺金底變寬深條紋斑馬木、亮面斑駁單種阜蓖麻種子、藍灰金褐角礫纖維Pietersite拋光切面、四平邊方形盲穴圓鋼螺絲頭、灰褐宿岩褐邊淡色方解石填裂切面、中心連通三臂Y形盲凹穴螺絲頭、Pinolith深基質尖透鏡白晶石材、短拉絨遮織棉法蘭絨、Padauk橙紅粗開孔木紋、五圓瓣盲凹穴螺絲頭、縱皺深褐零陵香豆、流紋細基質淡斑晶流紋岩、開槽中空彈簧銷端面、五淺肋月牙葛縷子果、鹽胡椒粗晶閃長岩、綠斑細交錯礦紋軟玉、chambray藍經白緯平紋布、Sapele紅褐帶狀木紋、縱槽橢長椰棗核、六角平底凹穴螺栓頭、深綠銀白羽狀礦紋、Cubeb有梗皺紋胡椒果、淺色雙晶斜長岩、五挑浮經Huckaback毛巾布、裂口空腔花椒果皮、藍綠結核簇矽孔雀石、雙背槽梯形單刃刀片、多孔礦物膠結麻屑、不規則粗節緯紗平紋山東綢、灰綠細皺片理與雲母色斑千枚岩、稜角細凹炭黑黑種草籽、開口環與漸尖螺紋桿螺絲鉤、雙道陡斜肋Cavalry twill、乳白雲底與淺毛孔書寫皮紙、細長開放導管孔深褐Wenge木、紫色近方形生長色帶螢石、雙上彎漸尖角黑褐菱角果殼、U形弓橫銷與帶孔銷頭卸扣、成對粗緯橫肋Ottoman織物、白色礦塊灰網脈白松石、長彎韌皮纖維手工桑皮紙、五安裝孔與雙圈錯位鑽孔煞車碟、直疊玉綠細長凹面釉磚、八向深籽共切面橙色柿子、黑釉褐色鐵晶斑與亮環緣油滴釉、密經二上一下陡斜紋軋別丁、尖橢圓葉片與七對彎曲側脈月桂葉、粉白波狀雙層帶菱錳礦、雙眼螺紋花籃螺栓、深色粗晶與淡雙晶斜長石的磨面輝長岩、藍灰果霜與三條低放射縫的杜松果、成對高經肋與細平紋的dimity棉布、暖象限與內含深十字的空晶石、雙研磨長面與三圓連槽的銀色雙刃刀片、寬細深流紋的橙紅cocobolo心材、連續縱肋與圓疣苦瓜表皮、對稱S曲閉合青綠燈籠磚、同心皮殼與暗核的磨面鮞粒石灰岩、細經粗緯單紗平紋府綢、七梯形齒與雙低孔的銀色直齒條、彎曲漸尖果毛與連續紅皮的紅毛丹果皮、閉合黃銅六瓣框與青藍琺瑯的掐絲琺瑯、連續圓頂曲帶的gyroid截面填充紋、單側五孔與高殼緣凹內面的鮑魚殼、深布淺線Y形飛針繡、六面刺坡與連續底皮的榴槤果皮、六釘孔與連續低槽的金屬馬蹄鐵、薄片下緣真捲唇與纖維底皮的紙皮樹皮、藍白雲塊與彎曲纖維脈的拉利瑪石、兩層交叉寬草條與長纖維的莎草紙、不規則淺色木射線蕾絲木紋、成對藍經／淺緯交替高低的牛津紡、四無縫雙圓銀線真交替高低高箍四連尖倒刺鐵絲、九金心蝴蝶酥雙真低焦糖螺旋中央摺痕凹雙冠下尖、九對鏡像三次曲線低f孔端圓眼雙側缺刻連續暖木紋、九真眼環連直柄下半圓彎上尖內倒尖連續銀J魚鉤、九同根三彎紅絲三擴圓尖雙開叉藏紅花、九閉銀框低開口高黑舌四更高銀接點矩形插座，可用 `tint` 配合色盤調色，並可經 `workerPool` 在 Worker 生成、以 `cache` 重用，`heightMap` 可接上 parallax）、光照與陰影、骨骼動畫、instancing、後處理。
- **Hopsack**：藏青雙經雙緯2×2籃織材質，保留連續浮紗與組內紗線凹縫。
- **雪花黑曜石**：黑色磨光底上大小不一、平齊嵌入的灰白放射晶簇。
- `celestine`：淡藍平坦寬板天青石，局部平行晶片、錯開端部與中性粗礦底；維持opaque非金屬，不新增透明折射或礦物認證。
- `braziliantulipwood`：奶油底粉紅紅不等寬平齊縱紋的磨光巴西鬱金香木，稀疏導管略凹；不是美洲鵝掌楸、凸木肋或木種／合法來源認證。
- `batiste`：象牙白細棉一上一下平織，均衡同色經緯與細緻normal／height、凹紗隙；維持不透明，不含透光、布片物理或纖維認證。
- `wulfenite`：橙色近方形板狀鉬鉛礦，不等大小與方向的平坦凸晶面配深色粗礦底；opaque非金屬，不含透明晶體mesh或礦物／安全認證。
- `lignumvitae`：作者深橄欖褐磨光癒創木，細長木理維持平齊、稀疏短導管略凹；不是粗斑馬條紋，不含木種鑑定、自潤滑物性或合法採購認證。
- `sateen`：作者象牙白五枚緯面棉緞，孤立接結點與連續四紗緯浮長帶細緻normal／height；不是印色斜紋，不新增布片物理、方向性BRDF或纖維認證。
- `parallelkeys`：銀灰雙圓端平鍵，平坦實心頂面、平行側邊與圓弧端部，金屬面與暗色非金屬底分離；不是圓柱、空心環或具DIN／力學認證的零件mesh。
- `smithsonite`：作者蘋果綠葡萄狀菱鋅礦，較亮滑的連生圓頂配較暗粗糙凹隙；opaque非金屬凹凸面，不含透明、折射、晶體mesh或礦物認證。
- `macassarebony`：作者深褐磨光馬卡薩烏木，近黑不等寬縱紋維持平齊、細密稀疏導管略凹；非刻槽或拼板，不含木種、木材物性或合法採購認證。
- `serge`：作者藏青霧面嗶嘰2/2斜紋，同色經緯帶連續短浮長與normal／height凸紋，非印色斜線；不含羊毛毛羽mesh、衣片物理或纖維／制服等級認證。
- `garterstitch`：暖奶油色搓板針，橫向凸脊帶交錯圓弧purl針圈與較低return arcs，實際normal／height而非針法圖印色；不含完整紗線mesh、彈性／垂墜或纖維認證。
- `woodruffkeys`：銀灰色實心半月鍵，直弦與圓弧圍成近乎平坦凸金屬面，深色底保持非金屬；不是圓幣、三角片、有孔墊圈或裝配mesh，不含DIN／材質等級／安全認證。
- `barite`：淡奶油色、局部平行三板的平坦重晶石晶面，凸於棕色磨砂礦底；不是細長藍色Kyanite凸脊、圓帽或印色，不提供透明、完整礦簇geometry或礦物／安全認證。
- `surah`：作者暖銅色細絲2/2平衡斜紋，兩軸連續短浮長而非逐點凸珠；非銅金屬，不含布料垂墜、透射、方向性絲光或纖維認證。
- `bocote`：黃金褐底深褐近黑木紋，連續縱紋自然回折成局部閉合眼；深淺平齊、稀疏縱導管凹下，不是凸環、木口圖或木種／性能認證。
- `hemimorphite`：天藍色大小不規則連生圓凸礦殼與淡色凹隙，重疊仍限制在單層；不是水玉印色、規則珠格或金屬，不提供透明／完整標本geometry或礦物認證。
- `monkscloth`：奶油原色4×4粗籃織，四條分離紗線與連續四交織點浮長；不是2×2 Hopsack、印色或Oxford雙紗白guide布，不作成分／密度／洗護認證。
- `bronzite`：深褐磨光石面上的局部多方向青銅細紋，明暗石粒平齊且非金屬；僅靜態外觀近似，不提供變角閃光／礦種／價值認證。
- `makore`：紅褐Makore木皮，局部淡出的平齊橫向捲曲木紋與稀疏縱向凹導管；不是等強波浪板或端木孔圖，不提供光學／木種／力學認證。
- `redberyl`：淡色顆粒流紋岩上的覆盆子紅凸起平坦六角晶面，採端面視角；不是尖石英、六瓣花或印刷，不提供晶柱mesh／折射或礦種價值認證。
- `cottondrill`：暖卡其霧面棉斜紋，同色經緯與連續三緯經浮長；不是平織、籃織、藍白條紋或印線，不認證成分／GSM／耐用／洗護。
- `bluelaceagate`：淡藍磨光Blue Lace Agate，平齊粗細白色細蕾絲成對色帶；不是鈷藍石、同寬條紋或凸白脊，不認證礦種／天然染色／光學或療效。
- `linchpins`：銀色閉環扣插銷，圓線保險環、較粗實心柄與凸頭，金屬實物／介電間隙分區；不是R型銷、平墊圈或印刷，不認證機械尺寸／承載／安全。
- `silknoil`：奶油白霧面絹紡短纖布，交替平織與雙向細小真凸纖維結；不是亮面Shantung、印點或未去膠原絲，不作纖維／洗護認證。
- `bloodwood`：鮮紅細直紋血木與稀疏細短凹導管，色帶不凸起、預設介電；不是橘色Padauk或紅漆，不認證樹種／色彩／老化。
- `cavansite`：暖白粒狀礦物底上的亮藍短針放射晶簇，真凸起、較光滑、介電；不是磨光藍珠或長刺星形，不認證礦種或晶體光學。
- `matelasse`：暖象牙白織成絎縫布，連續凸菱接結、淺蓬內片與交替紗冠；不是車縫虛線或印花，不宣稱纖維／洗護認證。
- **黃心木**：均勻金黃縱切面、低對比細直紋與稀疏淺凹短導管；不是螢光黃漆、凸色帶或端木紋。
- **R型髮夾銷**：單圓拉環、長直腳與彎曲外張短腳；圓線金屬面與dielectric空隙，不是封閉墊圈或平行U腳。
- **床墊條紋布**：海軍藍寬中央條搭兩側細線，奶白緯紗交織的緊密2/1斜紋，不是實心印刷條或凸紋。
- **方鈉石**：顆粒藍紫底與填實白色礦脈；維持平整磨光面，不是金斑、凸線或裂洞。
- **Dalmatian stone**：奶白磨光底上的不規則深綠黑礦物斑；色斑平齊，不是凹洞或凸卵石。
- **紫心木**：曝光後茄紫色直紋，中等texture與稀疏凹入導管；不是螢光或動態變色。
- **黑棕櫚木縱切紋**：棕褐地組織裡細密的深色長纖維束；緞面平整，不是端木圓點、年輪或木節。
- **不鏽鋼 E 型擋圈**：三個內側接觸部、連到外開口的寬翼口袋，以及不透明非金屬背板。
- **遊戲系統**：輸入、物理、導航、場景切換、資源載入、存檔，以及 OPM／取樣音訊。
- **渲染**：WebGPU、WebGL2、Canvas2D；各 backend 的功能不同，詳見[目前支援契約](docs/CURRENT.md)。

API 受到 three.js／PixiJS／Excalibur 啟發，但不是相容替代品。引擎無 npm runtime dependencies；第三方 vendor 隨套件附帶並保留各自授權。

### 先跑範例

需要 **Node.js ≥22.13.0** 與 **pnpm 12.6.0**。在此倉庫根目錄執行：

```sh
npx pnpm@12.6.0 install
npx pnpm@12.6.0 examples
```

瀏覽器會開啟 `http://127.0.0.1:5173/examples/`，可依功能篩選並選擇 backend。若只想啟動開發伺服器，改用 `npx pnpm@12.6.0 dev`。請透過 HTTP／HTTPS 存取，不要直接開啟 `file://`。

### 在自己的專案使用

npm 尚未發佈，請使用 [GitHub Releases](https://github.com/JS-PACKAGE/XYZ.js/releases) 的套件附件，或在本機建置封裝：

```sh
npx pnpm@12.6.0 build
npx pnpm@12.6.0 pack
```

將產生的 `xyz.js-1.22.1.tgz` 複製到你的專案，再於該專案安裝：

```sh
npx pnpm@12.6.0 add ./xyz.js-1.22.1.tgz
```

在可解析 `xyz.js` 的 TypeScript／bundler 專案中，先加入畫布：

```html
<canvas id="game"></canvas>
```

再從入口模組啟動：

```ts
import { Game } from 'xyz.js';

const game = await Game.create({ canvas: '#game', renderer: 'webgpu' });
game.addEventListener('error', (event) =>
  console.error((event as CustomEvent<Error>).detail),
);
game.start();
```

這是既有的 WebGPU triangle 入門範例；不支援 WebGPU 時會報錯。一般遊戲可省略 `renderer`，採預設 `auto`，並使用自己的 `Scene`。暫停、恢復與清理分別使用 `game.pause()`、`game.resume()`、`game.destroy()`。

需要完整專案流程，請看[使用說明](docs/USAGE-zh.md)中的獨立 2D／3D starter、Scene、Sprite 與部署範例。

### 開始前要知道

- **Fallback 只發生在初始化**：`auto` 依 WebGPU → WebGL2 → Canvas2D 嘗試；強制指定 backend 不會偷偷切換。執行中 GPU／GL 遺失預設嘗試同 backend 復原，舊 render targets／snapshots 需重建。
- **Canvas2D 不是完整替代**：僅支援 2D，不支援 3D 或 native shader effects。使用 `game.graphics.capabilities` 判斷功能，不要只看 backend 名稱。
- **音訊需要使用者操作**：在點擊等手勢中呼叫 `await game.audio.unlock()`。`game.pause()` 不會自動暫停音訊。WebGPU／AudioWorklet 需要安全來源，localhost 可用，正式部署使用 HTTPS；OPM 無法啟動時取樣／串流音訊仍可用，播放 OPM 前請確認 `game.audio.opmState === 'ready'`。
- **部署要保留完整產物**：無 bundler 時複製整個 `dist/`，包含 `dist/vendor/opm/`、其他 vendor、workers／worklets 與授權檔；不要只拿入口 JS。不要混用 CommonJS 與 ESM 建立的引擎物件。可選的 `opmModuleUrl` 能改從以 commit 釘住的 CDN 載入 OPM，但無法驗證內容完整性（見技術參考）。
- **支援不等於實機認證**：managed WebKit 不是 Safari；模擬輸入、CI 與音訊訊號量測不代表實體手把、手機、可聽輸出或所有 GPU 已驗證。實測範圍與剩餘限制以 [ACCEPTANCE](ACCEPTANCE.md) 為準。

## Examples／範例／サンプル

先從以下範例挑一個；連結指向原始碼目錄，執行時使用開發伺服器的 `/examples/<name>/`。完整清單見[範例目錄](examples/index.html)或[使用說明](docs/USAGE-zh.md)。

| 範例 / Example                           | 看什麼 / Purpose                                   |
| ---------------------------------------- | -------------------------------------------------- |
| [showcase](examples/showcase/)           | 2D＋3D＋音訊與 Scene 切換 / integrated engine demo |
| [pong](examples/pong/)                   | 小型 2D 遊戲、輸入與計分 / input and scoring       |
| [gameplay2d](examples/gameplay2d/)       | 動畫、物理、地圖與粒子 / 2D gameplay systems       |
| [rendering2d](examples/rendering2d/)     | 遮罩、混合與渲染功能 / 2D rendering                |
| [pbr3d](examples/pbr3d/)                 | 程序式材質、光照與貼圖預覽 / PBR materials         |
| [gltf3d](examples/gltf3d/)               | 模型、骨骼動畫與 morph / model animation           |
| [beacon-run](examples/beacon-run/)       | 載入到存檔、重玩的完整流程 / playable 3D reference |
| [fallback-demo](examples/fallback-demo/) | 切換 backend 與檢查能力 / backend capabilities     |

## 文件與開發 / Documentation

| 想做什麼 / Goal                                | 入口 / Reference                                                |
| ---------------------------------------------- | --------------------------------------------------------------- |
| 寫第一個遊戲 / Get started                     | [繁體中文](docs/USAGE-zh.md) · [English](docs/USAGE.md)         |
| 查功能與 backend 限制 / Check support          | [Current contracts](docs/CURRENT.md)                            |
| 查 API、生命週期與資源管理 / API and ownership | [繁體中文](docs/TECHNICAL-zh.md) · [English](docs/TECHNICAL.md) |
| 製作與部署資產 / Asset pipeline                | [Asset recipe](docs/ASSET-RECIPE.md)                            |
| 理解架構與範圍 / Architecture and scope        | [DESIGN](DESIGN.md) · [PLAN](PLAN.md)                           |
| 查歷史驗收與未驗事項 / Verification history    | [ACCEPTANCE](ACCEPTANCE.md)                                     |
| 回報安全問題 / Security                        | [Security policy](SECURITY.md)                                  |

常用命令（已安裝 pnpm 12.6.0 時可省略 `npx pnpm@12.6.0`，直接使用 `pnpm`）：

```sh
npx pnpm@12.6.0 build
npx pnpm@12.6.0 typecheck
npx pnpm@12.6.0 test
npx pnpm@12.6.0 lint
npx pnpm@12.6.0 format:check
```

`npx pnpm@12.6.0 docs:api` 產生可搜尋的 API 文件；`npx pnpm@12.6.0 build:site` 建置範例與文件網站至 `.vite/site/`，文件入口為 `docs/`，API 位於 `api/1.22.1/`。部署時保留整個網站目錄，並以支援 directory index 的 HTTP／HTTPS 伺服器提供。

README 只提供入門與導覽；各版本的階段紀錄、測試數與效能量測留在驗收文件，不視為目前版本的通用保證。

## English

XYZ.js is a browser-native TypeScript game engine with 2D/3D rendering, scenes, animation, physics, navigation, UI, input, assets and audio. Use the public `xyz.js` entry; ECS stays internal. It is not a visual editor or a drop-in replacement for three.js, PixiJS or Excalibur. There are no npm runtime dependencies; bundled vendors retain their licenses.

**Start here:** with Node.js ≥22.13.0, run `npx pnpm@12.6.0 install`, then `npx pnpm@12.6.0 examples`. Open `http://127.0.0.1:5173/examples/`. For your own project, install a GitHub release tarball or build and pack locally; npm is unpublished. The [English guide](docs/USAGE.md) covers installation, standalone 2D/3D starters and deployment.

- Procedural PBR presets cover natural, architectural, industrial and everyday surfaces, including pale finely sanded Basswood with understated long straight grain, round-bored stainless spherical washers flipped convex seating-face up, intact green mung seeds with narrow dark-green hilar bands and long pale hila, pink and cream concentric Thomsonite eyes in a polished planar cut, warm silvery nickel-silver satin with irregular fine directional brush grain, fine uniformly beige-dyed 3/1 Lyocell twill with continuous warp floats, warm finely grained Tigerwood with irregular elongated dark pigment streaks, fine pink and pale granular polished Thulite, dry cream black-eyed cowpeas with dark oval eyes around short pale hila, closed silver three-wave spring washers with radially consistent lift and open bores, golden-brown Iroko with fine color grain and sparse coarse vessels, natural off-white Ramie plain weave, polished raspberry-and-black Eudialyte-bearing rock, polished granular green and salmon-pink Unakite, ivory Safflower achenes with pale raised ribs and lateral scars, reddish-brown Snakewood with irregular dark flat patches and fine straight grain, flat silver round washers with rotated square through-openings, polished dark Larvikite with sparse static blue-grey feldspar flashes, silver finishing cup washers with open bores, conical walls and raised rims, light golden-pink figured Anigre with transverse curl and fine axial vessels, burgundy red adzuki seeds with long central pale hila, polished aqua amazonite with broken pale cross-hatching, round steel heads with two opposed blind pin-drive holes, pale golden zebrawood with varying dark streaks and sparse open vessels, glossy mottled castor seeds with one pale apical caruncle, blue-grey and golden fibrous angular pietersite, four-flat blind square socket steel heads, polished septarian interiors with pale calcite-filled cracks and brown linings, centered three-arm blind tri-point screw heads, polished pinolith with pale pointed magnesite kernels in dark matrix, solid brushed cotton flannel with a concealed plain-woven ground, warm orange padauk with coarse open vessels, five rounded blind-lobe pentalobe screw heads, dark elongated tonka seeds with recessed drying folds, fine flow-banded rhyolite with pale phenocrysts, slotted hollow spring-pin ends, narrow five-ridged crescent caraway fruits, polished salt-and-pepper diorite, opaque mottled-green polished nephrite, balanced blue-warp / white-weft chambray, reddish sapele ribbon wood, elongated closed date stones with finite longitudinal furrows, steel round heads with blind hex drives, deep green stone with pale feathered mineral bands, wrinkled Cubeb berries with connected woody tails, pale twinned anorthosite, cotton huckaback with paired five-pick warp floats, split red Sichuan pepper husks with empty cavities, joined turquoise chrysocolla nodules on dark green matrix, single-edge silver trapezoid utility blades with two back notches, porous mineral hempcrete with embedded fibrous shivs, warm ivory shantung with irregular raised weft slubs, gray-green phyllite with fine folded foliation and satin mica flecks, angular pitted charcoal nigella seeds, silver open ring screw hooks with tapered threaded shanks, olive cavalry twill with paired steep diagonal wales, cream parchment with shallow residual follicles and scraped undertones, dark wenge wood with long open vessel pores, polished purple fluorite with nested square growth zones, black-brown water caltrop shells with paired curved tapered horns, silver U-bow shackles with raised cross-pins and drilled pin tabs, Ottoman cloth with paired coarse transverse weft ribs, polished ivory howlite with fine gray cellular veins, handmade mulberry paper with long curved bast fibers, twin-ring drilled silver brake discs, stacked concave jade finger tiles, orange persimmon cuts with eight flush radial seeds, glossy black oil-spot glaze with brown iron-oxide rims, dense warp-faced steep gabardine twill, pointed olive bay leaves with recurved paired veins, polished rose rhodochrosite with paired wavy white laminae, connected eye-eye threaded turnbuckles, polished coarse gabbro with dark grains and pale twinned plagioclase, blue gray bloomed juniper berries with three recessed radial seams, ivory dimity cotton with paired raised warp ribs and fine plain weave, polished chiastolite sections with internal dark crosses and warm quadrants, silver double-edge blades with twin honed facets and a connected three-lobe slot, polished orange-red cocobolo with broad and fine dark flowing grain, rounded warty bitter melon skin on continuous ribs, interlocking teal ogee lantern tiles with mirrored S sides, honed oolitic limestone with concentric cortex grains and dark nuclei, fine-warp/coarse-weft cotton poplin with single-yarn plain weave, seven-tooth silver gear racks with twin low mounting bores, curved tapering rambutan fruit hairs over unbroken red rind, closed brass six-petal cloisonne over cyan enamel, rounded gyroid slice infill bands, concave abalone interiors with five one-sided holes, pale Y-shaped flystitch on dark cloth, six-faceted durian peel with unbroken rind, six-hole iron horseshoes with recessed fullers, papery bark flakes with raised lower rolls and fibrous underbark, polished larimar with merging blue pools and pale curved fibers, pressed two-layer papyrus plant strips with longitudinal fibers, nearly flush pale medullary ray flecks in warm lacewood, paired blue-warp/pale-weft Oxford cotton with real alternating crossing heights, seamless rounded silver wire pairs with genuinely alternating over-under height, raised collars and four connected pointed barbs per knot, golden heart-shaped palmiers with two genuine recessed caramel spirals, central folds, notched double crowns and tapered points, mirrored cubic violin f holes cut into continuous warm wood with round terminal eyes and side nicks, continuous silver barbed J hooks with closed true-eye rings, straight shanks, lower semicircular bends and two tapered points, curved red saffron threads with shared intact roots, widened rounded tips and two open fork gaps, and four-contact rectangular sockets with closed silver bezels, open low cavities, high opaque black tongues and higher silver pads. Presets support palette `tint`, Worker generation with `workerPool`, reusable `cache`, and optional `heightMap` for parallax.
- **Hopsack**: navy 2×2 basket-weave material with paired yarns, continuous floats and recessed grooves separating individual yarns.
- **Snowflake obsidian**: a polished black face with differently sized, flush gray radial inclusions.
- `celestine`: pale-blue broad flat tabular crystals in locally parallel groups with staggered ends on neutral rough host; opaque dielectric, without transmission/refraction or mineral certification.
- `braziliantulipwood`: polished warm-cream wood with unequal flush pink-red longitudinal streaks and sparse recessed vessels—not American Tulip Poplar, raised grain ribs or species/legal-sourcing certification.
- `batiste`: ivory fine-cotton one-over-one plain weave with balanced matching yarns, subtle normal/height and recessed interstices; opaque, without transmission, cloth physics or fiber certification.
- `wulfenite`: varied scattered orange near-square flat raised crystal faces on dark rough mineral backing; opaque dielectric, not transparent crystal mesh or mineral/safety certification.
- `lignumvitae`: authored polished dark olive-brown fine coplanar wood grain with sparse short recessed vessels—not broad zebra stripes, species identification, self-lubrication physics or legal-sourcing certification.
- `sateen`: authored ivory five-harness filling-faced cotton sateen with isolated binders and continuous four-end filling floats in normal/height; not printed twill, cloth physics, directional BRDF or fiber certification.
- `parallelkeys`: solid silver-gray double-rounded parallel keys with flat tops, parallel sides and curved ends on dark dielectric backing—not cylinders, hollow rings or mechanically certified part meshes.
- `smithsonite`: authored apple-green botryoidal relief with joined smoother, brighter crowns and dark rough interstices; opaque dielectric, not transparent crystal geometry or mineral certification.
- `macassarebony`: authored polished dark-brown Macassar ebony with coplanar unequal near-black longitudinal streaks and fine sparse recessed vessels—not grooves or joined boards; no species, wood-physics or legal-sourcing certification.
- `serge`: authored matte navy balanced 2/2 Serge with equally dyed yarns and continuous short floats, using normal/height relief rather than printed diagonals; no fuzzy wool mesh, garment physics or fiber/uniform-grade certification.
- `garterstitch`: warm-cream garter ridges with staggered curved purl crowns and lower return arcs, using actual normal/height relief rather than printed stitch symbols; no complete yarn mesh, elasticity/drape or fiber certification.
- `woodruffkeys`: silver-grey solid Woodruff keys with a straight chord, circular arc and nearly flat raised metallic faces on dark dielectric backing—not coins, triangles, bored washers or an assembly mesh; no DIN/material-grade/safety certification.
- `barite`: pale cream flat tabular-crystal faces in locally parallel triples over a matte brown mineral host—not narrow blue ridged Kyanite, round caps or printing; no transmission, full specimen geometry or mineral/safety certification.
- `surah`: authored warm copper-colored balanced 2/2 fine silk twill with continuous short floats on both axes—not crossing-by-crossing beads or copper metal; no cloth drape, transmission, directional silk sheen or fiber certification.
- `bocote`: golden-brown wood with near-black flowing grain folding into local closed eyes; coplanar pigment and sparse recessed longitudinal vessels—not raised rings, endgrain or species/performance certification.
- `hemimorphite`: sky-blue irregular joined rounded mineral caps with pale recesses and bounded single-layer relief—not printed dots, regular beads or metal; no transmission, complete specimen geometry or mineral certification.
- `monkscloth`: natural-cream coarse 4×4 basket weave with four distinct yarns and continuous four-crossing floats—not 2×2 Hopsack, printing or Oxford double-thread guideline cloth; no composition/count/care certification.
- `bronzite`: polished dark-brown stone with localized differently oriented bronze striations on one dielectric plane—a static appearance approximation, not dynamic schiller or mineral/value certification.
- `makore`: reddish-brown veneer with locally fading coplanar transverse curls and sparse recessed longitudinal vessels—not uniform washboard stripes or an endgrain diagram; no optical/species/mechanical certification.
- `redberyl`: raspberry-red raised flat hexagonal crystal faces on pale granular rhyolite, viewed end-on—not pointed quartz, six-lobed flowers or printing; no crystal-column mesh/refraction or mineral/value certification.
- `cottondrill`: warm-khaki matte cotton drill with matching yarn dye and continuous three-pick warp floats—not plain/basket weave, navy stripes or printed lines; no composition/GSM/durability/care certification.
- `bluelaceagate`: polished pale-blue agate with unequal lacy white companion laminae on one plane—not cobalt stone, equal stripes or raised ridges; no mineral/treatment/optics/healing certification.
- `linchpins`: silver closed round-keep Linch Pins with a thicker solid shank and raised head, metallic hardware and dielectric clearances—not R-clips, flat washers or printing; no dimensional/load/safety certification.
- `silknoil`: natural-cream matte Silk Noil with alternating plain yarns and tiny raised neps in both directions—not shiny Shantung, printed flecks or unwashed raw fibers; no fiber/care certification.
- `bloodwood`: vivid-red fine longitudinal Bloodwood grain with sparse tiny recessed vessels, coplanar pigment and dielectric finish—not orange Padauk or red paint; no species/color/aging certification.
- `cavansite`: raised brilliant-blue short-acicular rosettes on a warm pale granular host, smoother but dielectric—not polished blue beads or long-spiked stars; no mineral or crystal-optics certification.
- `matelasse`: warm-ivory woven-quilt cloth with continuous raised diamond binding, softly lofted panels and alternating yarn crowns—not dashed sewing or printed diamonds; no fiber/care certification.
- **Yellowheart**: uniform golden longitudinal wood with subtle fine grain and sparse shallow vessel traces, not neon paint, raised bands or endgrain.
- **R-clips**: single-loop rounded spring wire, a long straight leg and a bowed flared short leg with open dielectric clearances, not closed washers or parallel U-pins.
- **Ticking**: navy broad-center and fine flank stripes woven into dense 2/1 twill with cream weft, not solid printed or embossed bars.
- **Sodalite**: granular blue-violet matrix with filled white mineral veinlets on one polished plane, not gold flecks, ridges or open cracks.
- **Dalmatian stone**: irregular dark green-black inclusions in a creamy polished matrix, flush rather than pits or raised pebbles.
- **Purpleheart**: exposed eggplant-purple long grain with sparse recessed vessels; a static wood appearance, not fluorescence or animated aging.
- **Longitudinal Black Palm**: dense dark fiber bundles in tan ground tissue on one satin face, without endgrain dots, growth rings or knots.
- **Stainless E clips**: three inward contacts and broad wing windows joined to an open mouth, above opaque nonmetal backing.
- `auto` tries WebGPU → WebGL2 → Canvas2D at initialization only. Forced backends do not switch. Runtime GPU/GL recovery uses the same backend; recreate renderer-owned targets and snapshots.
- Canvas2D is 2D-only and rejects native shader effects. Check `game.graphics.capabilities`; see [current contracts](docs/CURRENT.md) for feature-specific limits.
- Unlock audio with `await game.audio.unlock()` inside a user gesture. Game pause does not pause audio. WebGPU/AudioWorklet need HTTPS or localhost; if OPM cannot start, samples and streams still play, so check `game.audio.opmState === 'ready'` before playing OPM assets.
- Deploy the complete `dist/` tree, including vendors, licenses, workers and worklets. Do not mix CommonJS and ESM engine instances. `build:site` produces the complete static site in `.vite/site/`. The opt-in `opmModuleUrl` can load OPM from a commit-pinned CDN instead, without integrity verification (see the technical reference).
- Managed-browser checks are not Safari, physical-device, audible-output or universal performance certification. See [ACCEPTANCE](ACCEPTANCE.md) for evidence and remaining limitations, and the [technical reference](docs/TECHNICAL.md) for API and resource ownership.

## 日本語

XYZ.js はブラウザーのネイティブ API を使う TypeScript ゲームエンジンです。2D／3D 描画、Scene、アニメーション、物理、ナビゲーション、UI、入力、アセット、音声を提供します。公開入口は `xyz.js` で、ECS は内部実装です。ビジュアルエディターや three.js／PixiJS／Excalibur の互換置換ではありません。npm runtime dependencies はなく、同梱 vendor のライセンスを保持します。

**まず動かす：** Node.js ≥22.13.0 で `npx pnpm@12.6.0 install`、続いて `npx pnpm@12.6.0 examples` を実行し、`http://127.0.0.1:5173/examples/` を開きます。npm は未公開のため、自分のプロジェクトには GitHub Release の tarball、またはローカルで build／pack したものをインストールしてください。導入・2D／3D starter・配信手順は [English guide](docs/USAGE.md) を参照してください。

- プロシージャル PBR 材質は自然・建築・工業・生活用品の表面（淡いクリーム色の細かく研磨した長い直木目のバスウッド、凸球面の座面を上に向けた丸穴ステンレス球面座金、緑色の種皮に細い深緑の輪と長い白いへそを持つ丸ごとの乾燥緑豆、平らな研磨面のピンクと乳白色の同心眼紋を持つThomsonite、暖かい銀白色で不規則な細いヘアラインを持つ洋白合金板、均一なベージュに染めた連続浮き糸のLyocell 3/1綾織、暖かい赤褐色の細い木目に不規則な暗色長縞を持つTigerwood研磨面、微細なピンク色と淡色の鉱物斑が混ざるThulite研磨面、短い淡色のへそを黒い楕円の目が囲む乳白色の乾燥ササゲ、半径方向に一貫した三つの波と中央開口を持つ銀色の閉環ウェーブワッシャー、細い縦の色模様と疎な導管を持つ黄金褐色のイロコ、オフホワイトのラミー平織、深い赤紫の結晶片と黒い石基のEudialyte、緑とサーモンピンクが細粒状に混ざる研磨ユナカイト、淡い黄の縦稜と側面の小さな傷跡を持つ白いベニバナの痩果、赤褐色の細い直線木目に不規則な暗い平面斑紋を持つスネークウッド、円形の外周と回転した四角い開口を持つ平らな銀色ワッシャー、暗い地に静的な青灰色の長石光斑が散らばる研磨ラルビカイト、中央の開口・円すい内壁・高い外周リムを持つ金属製カップワッシャー、横方向の縮み杢と細長い導管を持つ淡い金褐色のアニグレ、長い淡色のへそを中央に持つ凸面の小豆、淡い途切れた交差模様を持つ青緑色の研磨アマゾナイト、2つの丸い止まり穴と中央の鋼製ブリッジを持つねじ頭、淡い金色の地に幅の異なる暗い縦縞と疎らな開いた導管を持つゼブラウッド、淡い種枕を一つ持つ光沢のある斑入りヒマ種子、青灰色と金褐色の繊維質角礫を持つ研磨ピーターサイト、4辺が平らな四角い止まり穴を持つ鋼ねじ頭、淡色の方解石で満たされた亀裂と褐色の縁を持つ研磨Septarian断面、中央で3本の溝が交わるY字形の止まり穴を持つねじ頭、暗色地に淡い尖ったマグネサイト結晶が入る研磨Pinolith、短い起毛で平織り地を覆う綿フランネル、粗い開放導管を持つ赤橙色のパドゥーク木目、平らな鋼製底を持つ5つの丸いペンタローブ穴のねじ頭、不規則な縦しわを持つ黒褐色のトンカ豆、細かな流理と淡い斑晶を持つ流紋岩、スリット付き中空スプリングピンの端面、5本の淡い縦稜を持つ三日月形キャラウェイ果実、白黒の粗い結晶を持つ閃緑岩、濃淡の緑と微細な交錯鉱物模様を持つ不透明ネフライト、青い経糸と白い緯糸のシャンブレー平織り、赤褐色のサペリのリボン杢、閉じた両端と縦溝を持つ細長いデーツの種、六角の止まり穴を持つ丸いボルト頭、深緑に銀白の羽状鉱物模様、細い果柄を持つCubebの乾燥果、淡色の双晶斜長岩、5ピックの浮き経糸を持つHuckabackタオル地、空洞と裂け目のある赤い花椒の果皮、青緑色の結節群を持つクリソコラ、二つの背溝と片側研磨刃を持つ銀色台形カッター替刃、多孔質ミネラル結合材と麻芯片のヘンプクリート、不規則な太節緯糸を持つ暖色アイボリーのシャンタン、細かな波状片理と雲母斑を持つ灰緑色の千枚岩、角張った細凹表皮の炭黒色ニゲラ種子、開口リングと先細りねじ軸を備えた銀色スクリューフック、二本の急斜畝を持つオリーブ色キャバリーツイル、乳白色の雲状下地と浅い毛孔を持つ羊皮紙、細長い開放導管孔を持つ濃褐色ウェンジ材、紫色の角形成長色帯を持つ研磨蛍石、二本の湾曲した先細り角を持つ黒褐色の菱の実殻、U字弓・横ピン・穴付きピンタブを備えた銀色シャックル、太い緯糸を対に束ねた横畝オットマン織物、白い鉱物塊と細い灰色網脈のハウライト、長い曲線状の靭皮繊維を持つ手漉き桑紙、五つの取付穴と二重通風穴を持つブレーキディスク、縦積みの細長い凹面翡翠色タイル、八方向の暗い種を持つ平らな柿の切断面、褐色の鉄結晶斑と明るい縁を持つ油滴黒釉、高密度の経二上一下急斜文ギャバジン、尖った葉身と湾曲した側脈を持つ月桂樹の葉、ピンクと白の波状層帯を持つ菱マンガン鉱、両眼ねじ付きターンバックル、暗い粗粒と淡い双晶斜長石を持つ研磨された斑れい岩、青灰色のブルームと三本の低い放射状の継ぎ目を持つジュニパーベリー、対になった高い経畝と細かい平織を持つ象牙色のディミティ綿布、暖かな四象限と内部の深色十字を持つキアストライト研磨面、二つの研磨長面と三つの丸い部分がつながる中央溝を持つ銀色両刃カミソリ、幅広い深色の流紋と細い木目を持つ橙赤色のココボロ心材、連続した縦の隆起と丸い疣を持つゴーヤーの皮、対称S曲線で閉じる青緑色のオジーランタンタイル、同心皮殻と暗い核を持つ研磨された魚卵状石灰岩、細い経糸と太い緯糸が一対一で交差する綿ポプリン、七つの台形歯と二つの低い取付孔を持つ銀色ラック、連続した赤い皮と先細りの曲がった果毛を持つランブータン、閉じた真鍮の六弁枠と青緑エナメルの有線七宝、連続した丸い帯のgyroid断面インフィル、片側の五つの孔と高い縁を持つ凹型のアワビ殻内面、濃色の布に淡いY字の糸を配したフライステッチ、六面の棘と連続した下地を持つドリアンの皮、六つの釘穴と連続した低い溝を持つ金属の蹄鉄、下縁が巻き上がる薄片と繊維状の下地を持つペーパーバーク、青い鉱物の雲と淡い曲線状の繊維脈が同じ研磨面に広がるラリマー、縦の幅広い植物片を横の下層に圧着した細長い繊維のパピルス紙、暖かな木目に不規則な淡い放射組織斑を持つレースウッド、二本ずつの青い経糸と淡い緯糸が交互に上下するオックスフォード織、実際に上下が交互になる二本の丸い銀線・高い巻き輪・各結び目からつながる四本の尖った返しを持つ継ぎ目のない有刺鉄線、二つの本当に渦巻く低いカラメル層・中央の折り目・切れ込んだ二つの山・先細りの下端を持つ黄金色のハート形パルミエ、暖かな連続木目に彫り込んだ鏡像一対の三次曲線f字孔・丸い両端・左右の切欠き、本当に開いた閉環アイ・連続した軸・下半円の曲がり・先細りの針先とかえしを持つ銀色J字釣り針、同じ根元につながる三本の曲がった赤い糸・幅広の丸い先端・二つの開いた分岐隙間を持つサフラン、閉じた銀色の縁・本当に低く開いた空洞・高い不透明な黒い舌片・さらに高い四つの銀色接点を持つ矩形ソケットなど）を扱います。色調整 `tint`、`workerPool` での Worker 生成、`cache` による再利用、parallax 用の任意の `heightMap` に対応します。
- **Hopsack**：濃紺の2×2バスケット織材質。経緯とも二本組で、連続した浮き糸と各糸の間の溝を表現します。
- **スノーフレーク・オブシディアン**：黒い研磨面に、大小の灰白色の放射状結晶模様を平らに表現します。
- `celestine`：淡青色の平らで幅広い天青石の板状結晶。平行な結晶片とずれた端を粗い中性色の地に表現します。不透明な非金属で、透過・屈折や鉱物認証は追加しません。
- `braziliantulipwood`：クリーム色の磨いたブラジリアン・チューリップウッド。幅の異なる桃赤色の縦縞は平らで、疎らな導管だけをくぼませます。アメリカン・チューリップポプラや隆起した木目、樹種・合法調達の認証ではありません。
- `batiste`：象牙色の細い綿バティスト平織。一上一下で交差する同色の経緯糸と細かなnormal／height、くぼんだ糸間を表現します。不透明で、透過光・布の物理や繊維認証は含みません。
- `wulfenite`：橙色のほぼ正方形の板状モリブデン鉛鉱。大きさと向きが異なる平らな結晶面を暗く粗い地に隆起として表現します。不透明な非金属で、透明結晶メッシュや鉱物・安全認証は含みません。
- `lignumvitae`：作者設定の濃いオリーブ褐色の磨いたリグナムバイタ。細い長木目は平らで、疎らな短い導管だけをくぼませます。太い縞模様・樹種鑑定・自己潤滑物性や合法調達の認証ではありません。
- `sateen`：作者設定の象牙色の五枚緯朱子。分散した接結点と経糸四本を越す連続した緯浮き糸をnormal／heightで表現します。印刷した綾模様や布の物理・異方性BRDF・繊維認証ではありません。
- `parallelkeys`：銀灰色の両丸平行キー。平らな金属面、平行な側辺と二つの丸い端を暗い非金属の地に表現します。円柱・中空リングやDIN規格／強度を認証する部品メッシュではありません。
- `smithsonite`：作者設定の林檎緑色の葡萄状スミソナイト（菱亜鉛鉱）。つながった滑らかな丸い隆起と暗く粗い隙間を持つ、不透明な非金属の凹凸面です。透過・屈折や結晶メッシュは追加しません。
- `macassarebony`：作者設定の濃褐色の研磨したマカッサル・エボニー（縞黒檀）。不均一な黒い縦筋は平らな色模様で、細かい導管だけをくぼませます。板の溝・樹種鑑定・木材物性や合法調達の認証は含みません。
- `serge`：作者設定の濃紺でマットな2/2サージ。同色の経緯と連続した短い浮き糸を、斜線の印刷ではなくnormal／heightで表現します。毛羽mesh・衣服の物理・羊毛や制服等級の認証は含みません。
- `garterstitch`：暖かいクリーム色のガーター編み。横畝に曲線状の裏目の山と低い戻り弧を重ね、編み図の印刷ではなくnormal／heightで凹凸を表現します。完全な糸mesh・伸縮／ドレープ・繊維認証は含みません。
- `woodruffkeys`：直線の弦と円弧を持つ銀灰色の穴のない半月キー。ほぼ平坦な金属面が暗い非金属地から盛り上がり、硬貨・三角片・穴付きワッシャー・組立meshではありません。DIN・材質等級・安全の認証は含みません。
- `barite`：淡いクリーム色の平坦な板状結晶を、局所的に平行な三枚組として茶色のマットな鉱物地に表現。細長い青色Kyaniteの凸筋・丸い隆起・印刷とは異なり、透過・完全な鉱物標本geometry・成分や安全の認証は含みません。
- `surah`：作者設定の暖銅色、細い絹の2/2均衡綾織り。両軸の短い浮き糸が連続し、交点ごとの粒や銅金属ではありません。布のドレープ・透過・方向性の絹光沢や繊維認証は含みません。
- `bocote`：黄金褐色の地に黒褐色の連続木目が折り返し、局所的な閉じた眼状杢を表現。色柄は平坦で疎らな縦導管だけが凹み、凸環・木口図・樹種や性能の認証とは区別します。
- `hemimorphite`：空色の不規則な丸い鉱物隆起が一層で連結し、淡色の隙間を残します。水玉印刷・規則的な玉・金属とは区別し、透明性・完全な標本geometry・鉱物鑑定を保証しません。
- `monkscloth`：生成りクリーム色の4×4粗籠織り。四本を区別する溝と四交点をまたぐ連続した浮き糸を表現。2×2 Hopsack・印刷・Oxfordの二本組白ガイド布とは区別し、組成・密度・洗濯特性を認証しません。
- `bronzite`：濃褐色の研磨石面に、方向の異なる局所的な青銅色の細紋を表現。明暗の粒は同じ平面上の非金属で、動的シラー効果や鉱種・価値の認証ではありません。
- `makore`：赤褐色のマコレ単板。強弱のある平坦な横方向の縮み杢と、疎らな縦方向の浅い導管を表現。等間隔の波板や木口図ではなく、光学・樹種・力学の認証は含みません。
- `redberyl`：淡い粒状流紋岩上に、ラズベリー色の隆起した平坦な六角結晶端面を表現。尖った石英・六弁模様・印刷とは区別し、結晶柱mesh・屈折や鉱種・価値の認証は含みません。
- `cottondrill`：暖かいカーキのマットな3/1綿綾織り。同色の縦横糸と連続する経浮きを表現し、平織り・籠織り・青白縞や印刷線とは区別。組成・GSM・耐久性・手入れの認証ではありません。
- `bluelaceagate`：淡青の研磨ブルーレースアゲート。平らな面に太細の白いレース状縞を交互に表現し、濃青の石や等幅プリント、隆起した白い稜線とは区別。鉱種・処理・光学・効能の認証ではありません。
- `linchpins`：銀色の閉じた丸リング付きリンチピン。太い中実軸と盛り上がる頭を持ち、金属部と誘電体の隙間を分離。Rピンや平ワッシャー、印刷ではなく、寸法・荷重・安全の認証ではありません。
- `silknoil`：生成りのマットなシルクノイル。交互の平織り糸と縦横の小さな盛り上がりを表現し、光沢のShantungや印刷斑点、未精練の原糸とは区別。繊維・手入れの認証ではありません。
- `bloodwood`：鮮赤の細い縦木目と疎らで短い凹導管を持つBloodwood。色帯は平面の誘電体で、橙のPadaukや赤い塗料とは区別。樹種・色・経年変化の認証ではありません。
- `cavansite`：暖白の粒状母岩に浮く鮮青色の短針状放射結晶。母岩より滑らかな誘電体で、磨いた青玉や長い棘の星形とは区別。鉱物鑑定や結晶光学の認証ではありません。
- `matelasse`：暖かいアイボリーの織りキルト風生地。連続する浮き菱形の接結、浅い膨らみ、交互の糸冠を表現し、点線の縫い目やプリントとは区別。繊維・手入れの認証ではありません。
- **イエローハート**：均一な黄金色の縦断面、控えめな細い木目と疎らな浅い導管。蛍光塗装や隆起した縞、木口ではありません。
- **Rクリップ**：単一の丸い引き輪、長い直脚と曲がって開く短脚。丸線の金属面と開いた隙間を表現し、閉じた座金や平行なU字脚ではありません。
- **ティッキング**：紺の太い中央線と両側の細線、生成りの緯糸を持つ密な2/1綾織り。印刷や隆起した縞ではありません。
- **ソーダライト**：粒状の青紫色の地に白い鉱物脈。金属斑・隆起・割れ目ではなく、平らな研磨面を表現します。
- **ダルメシアンストーン**：クリーム色の研磨面に不規則な暗緑黒色の斑点。凹穴や盛り上がった小石ではありません。
- **パープルハート**：露光後の茄子色の縦木目と、まばらな導管の浅い凹み。蛍光や経年変色のシミュレーションではありません。
- **ブラックパームの縦木目**：褐色の地に細い暗色繊維束。木口の点模様・年輪・節ではなく、平らなサテン仕上げを表現します。
- **ステンレス製 E リング**：三つの内向き接触部と開口につながる二つの広い切り欠き。不透明な非金属の下地を表現します。
- `auto` は初期化時だけ WebGPU → WebGL2 → Canvas2D を試します。指定 backend は切り替わりません。実行中の GPU／GL 復旧は同じ backend を使い、render targets／snapshots は再作成が必要です。
- Canvas2D は 2D 専用で native shader effects は非対応です。`game.graphics.capabilities` と[現在の契約](docs/CURRENT.md)で機能を確認してください。
- 音声はユーザー操作内で `await game.audio.unlock()` が必要です。Game の pause は音声を停止しません。WebGPU／AudioWorklet には HTTPS または localhost が必要です。OPM を起動できない場合もサンプル／ストリーム音声は再生できるため、OPM の再生前に `game.audio.opmState === 'ready'` を確認してください。
- 配信時は vendor、ライセンス、workers／worklets を含む `dist/` 全体を保持し、CommonJS と ESM のインスタンスを混在させないでください。`build:site` は完全な静的サイトを `.vite/site/` に生成します。任意の `opmModuleUrl` で commit を固定した CDN から OPM を読み込めますが、内容の完全性は検証できません（技術参照を参照）。
- managed browser の検証は Safari、実機、可聴出力、全環境の性能を保証しません。検証範囲は [ACCEPTANCE](ACCEPTANCE.md)、API と資源管理は[技術参照](docs/TECHNICAL.md)を確認してください。

# XYZ.js 執行計畫

## 強制執行範圍（硬規則）

- 依《XYZ.js — Web 遊戲引擎開發企劃書》實作瀏覽器遊戲引擎；P42 另批准完整可玩參考流程，不改成只交付遊戲本體。**目前 metadata 1.22.1／Apache-2.0，npm 未發佈**。P01–P08 的 v0.0.1–v0.0.8 對應與後續各輪 counts／日期／release facts 均保留為歷史，不作新階段驗收。完成狀態以 [驗收紀錄](ACCEPTANCE.md) 為準，版本號不代表跨瀏覽器認證。
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
- 使用者另授權本輪擴充按功能提交、升版 1.18.0、推送 main／新 `v1.18` tag，沿既有 CI／Release workflow 發佈 GitHub archive 與 checksum；不做 npm publish、不移動既有 tags。實際發佈結果另記 ACCEPTANCE。
- 2026-10-07 使用者指定擴充已依授權分功能建立 `[Physics2D]`／`[PostFx]`／`[Assets]`／`[docs]` commits；使用者另授權升版 1.19.0、推送 main／新 `v1.19` tag，沿既有 CI／Release workflow 發佈 GitHub archive 與 checksum；不做 npm publish、不移動既有 tags。該輪「未建立階段 commit／未授權 commit／push」敘述保留為當時狀態。實際發佈結果另記 ACCEPTANCE。
- 使用者本輪確認改用 `v1.20.0`，授權整合已提交功能及遠端 main、安全推送與 GitHub Release；沿既有 CI／Release gate 封裝完整 archive 與 checksum，不做 npm publish、不移動歷史 tags、不降低驗證門檻。共享工作目錄未提交修改保留，不混入發佈。
- 使用者本輪要求推送並發佈 `v1.21.0`：整合已提交的效能優化與官方 OPM.js v1.13.0 vendor 更新及遠端 main，沿既有 CI／Release gate 封裝完整 archive 與 checksum；不做 npm publish、不移動歷史 tags。
- 使用者本輪要求提交程序材質 `tatami` 並推送、發佈 patch `v1.21.1`；沿既有 CI／Release gate，不做 npm publish、不移動歷史 tags。
- 開發者對外使用統一 `xyz.js` API；ECS 保持內部資料模型。`auto` 已提供 WebGPU→WebGL2→Canvas2D 初始化降級，強制指定 backend 不得靜默切換；執行中 loss 不自動切換 backend。
- 原 v1.0–v1.1 非目標中的場景階層、模型載入、Animation、PBR、法線貼圖與陰影依決策納入 P09–P12；Physics／Tilemap／Particle 納入 P15–P17，P30–P39 再擴充 bounded profiles。原排除的 UI layout／widgets、GPU skinning／animated bounds、native compressed／mip textures、3D physics／character／dynamic bodies、Navigation／pathfinding、animation masks／additive／blend tree／IK 已依使用者批准納入 P41／P42，下方契約不得以舊 non-goal 刪減。仍不做 Visual Editor、Visual Scripting、Shader Graph、Networking、Inspector／Scene GUI Editor、JS Software Rasterizer、自製 Shader IR／transpiler、Native Desktop Runtime；不承諾對齊 three.js addons 或 Excalibur 全部 API／plugins／main-only 功能。
- TypeScript strict、Web 原生 API、零 runtime dependencies（P07 的 OPM.js 官方 vendor 發佈包除外）。禁止為了過關而另寫獨立 triangle demo 繞開正式 Game→Renderer→WebGPU 路徑。

## 本輪批准追加：可重用程序式 PBR 與 gallery

使用者批准 additive `ProceduralMaterial`／`ProceduralMaterialKind`／`ProceduralMaterialOptions`，支援 wood／brick／stone／metal／fabric／marble 六種。`create()` 一次生成 deterministic／seamless immutable baseColor／normal／metallicRoughness／occlusion maps；size 為整數 32–1024（預設 256），seed 為無號 32-bit 整數（預設 1）。預設 opaque／repeat、roughness factor 1，metal 的 metallic factor 1、其餘 0。呼叫者擁有預設，可借 `material` 或以 `createMaterial(overrides)` 重用 maps；所有使用者移除後才同步、冪等 `destroy()`，只釋放生成貼圖；`destroyed` 可查，銷毀後不再建立借用材質。

整合既有 pbr3d gallery 的六種預設切換與貼圖預覽，不新增外部素材／依賴、不改共用 geometry／renderer／core-assets 邊界、不改 Scene／mesh ownership。初次實作未授權 commit／push／升版／release；使用者後續明確授權 v1.14 發佈，依頁首規則執行。實際品質與 browser 證據見 ACCEPTANCE，不由批准或文件推論驗收。

後續追加 concrete／tiles／leather／sand／rust／snow，不改既有六種取樣、geometry／renderer 或 ownership。rust 使用 metallic factor 1 與變化的 metallic map；其餘新種類維持 dielectric。當時限制為不升版、不提交、不推送，保留為歷史。

使用者目前批准持續增量追加材質，直到另行要求停止；每個完成功能獨立 commit，不 push。本組追加 asphalt／gravel／cobblestone（瀝青／礫石／鵝卵石鋪面）：暗色顆粒黏結料與嵌入骨材／不規則石粒與暗色凹隙／錯列圓角鋪石。皆為 opaque dielectric，沿用 deterministic periodic 四份 maps、既有 options／repeat／ownership，不改前十二種取樣、不新增依賴或 renderer 路徑。實際驗收與物理鋪面尺寸由後續驗證紀錄，不由文件推論。

下一組自然表面追加 bark／moss／mud（樹皮／苔蘚／泥土）：隆起紋理與深裂隙／密集柔軟的綠色覆層／土塊與淺裂紋。沿用上述持續追加與獨立 commit、不 push 授權，支援總數增為十八種；三者皆為 opaque dielectric，使用相同四份 maps，不改前十五種輸出、公開 options、ownership、renderer 或依賴。實際品質與驗證結果另記 ACCEPTANCE，不宣稱物理尺寸。

再追加石材飾面 granite／slate／terrazzo（花崗岩／板岩／磨石子）：斑點礦物顆粒／帶細微脊紋的深色層理／平滑黏結料中的對比色石片。沿用既有持續追加、完成功能獨立 commit、不 push 授權，總數增為二十一種；皆為 opaque dielectric、metallic 通道為 0，沿用 deterministic periodic 四份 maps。前十八種輸出須逐位元組保持不變，公開 options、ownership、renderer 與零新增依賴契約不變。實際品質與驗證結果另記 ACCEPTANCE，不宣稱物理尺寸。

紡織增量再追加 denim／burlap／carpet（丹寧布／粗麻布／地毯）：斜向斜紋／粗經緯交織／割絨表面，目前共二十四種；前述 counts 保留各增量的歷史範圍。三者皆為 opaque dielectric、metallic 通道為 0，沿用 deterministic periodic baseColor／normal／metallicRoughness／occlusion maps，不是 geometry 或毛髮模擬，也不產生透明織孔。前二十一種輸出須逐位元組保持不變，公開 options、repeat、ownership、renderer 與零新增依賴契約不變；沿既有授權逐功能獨立 commit、不 push。品質與驗證結果另記 ACCEPTANCE，不推定物理尺寸。

建材飾面增量追加 plaster／terracotta／cork（石膏／陶土／軟木）：淺色石膏的淺抹刀弧痕與細孔／未上釉紅褐燒製陶土的不規則窯色與凹孔（無磁磚填縫）／棕褐壓製軟木碎片與細胞邊界，目前共二十七種；前述 counts 保留為歷史。皆為 opaque dielectric、metallic 通道為 0，沿用 deterministic periodic 四份 maps，不新增 geometry 或物理模擬。前二十四種輸出須逐位元組保持不變，公開 options、repeat、ownership、renderer 與零新增依賴契約不變；沿既有授權逐功能獨立 commit、不 push。品質與驗證結果另記 ACCEPTANCE。

工業表面增量追加 rubber／carbonfiber／diamondplate（橡膠／碳纖維／止滑花紋鋼板），目前共三十種；前述 counts 保留為歷史。橡膠為炭黑色模製彈性體與細密卵石狀顆粒；碳纖維為樹脂覆層下深色纖維束、交替斜向斜紋編織，兩者 metallic 通道為 0。鋼板為銀色軋製金屬與交替斜向隆起菱形紋，metallic 通道及預設 factor 均為 1。目前具有 authored 金屬區域的預設（如全金屬 nickelsilver 與 mixed 的 rust）使用 metallic factor 1 保留 B 通道，純 dielectric 使用 0；完整規則見各 kind 說明。三者沿用 deterministic periodic 四份 RGBA maps；凹凸僅由 normal map 表現，不新增 geometry、特殊 anisotropic shader、clearcoat 或物理模擬。前二十七種輸出須逐位元組保持不變，公開 options、repeat、ownership、renderer 與零新增依賴契約不變；沿既有授權逐功能獨立 commit、不 push。

工藝素材增量追加 paper／wicker／bamboo（紙張／藤編／竹材），目前共三十三種；前述 counts 保留為歷史。紙張為象牙白未塗佈紙的細密不規則紙漿纖維與輕微雲狀成紙紋；藤編為棕褐寬圓角藤條交織、細縱向條紋與深色不透明凹隙，區別於粗麻布；竹材為金黃縱向纖維與週期錯列的深色竹節帶。皆為 opaque dielectric、metallic 通道與預設 factor 為 0，沿用 deterministic periodic 四份 maps，不新增 geometry、透明孔洞或物理模擬。前三十種輸出須逐位元組保持不變，公開 options、repeat、ownership、renderer 與零新增依賴契約不變；沿既有授權逐功能獨立 commit、不 push。

成形金屬增量追加 hammeredmetal／galvanized／corrugatedmetal（錘紋金屬／鍍鋅板／波紋金屬板），目前共三十六種；前述 counts 保留為歷史。分別為暖銅色金屬上重疊的淺圓錘凹與平滑連續起伏（非粗岩）、冷銀色鋅花晶粒的色調／粗糙度對比與極淺起伏（非礫石）、銀色軋製板的平行平滑波槽與細微縱向磨痕。三者 metallic B 全為 255（1）、預設 factor 為 1，區別於混合金屬度的 rust；沿用 deterministic periodic 四份 maps，凹凸僅由 normal map 表現，不位移 geometry 或改變輪廓。前三十三種輸出須逐位元組保持不變，公開 options、repeat、ownership、renderer 與零新增依賴契約不變；沿既有授權逐功能獨立 commit、不 push，品質與驗證結果另記 ACCEPTANCE。

多孔與沉積石材增量追加 sandstone／travertine／pumice（砂岩／洞石／浮石），目前共三十九種；前述 counts 保留為歷史。分別為暖色波狀沉積層理與砂粒（非深色板岩或鬆散沙）、奶油色石灰岩的不規則細長淺孔與細微水平礦物帶、淺灰火山岩上密集隨機分布的小圓氣孔（非礫石或石材換色）。三者皆為 opaque dielectric、metallic 通道與預設 factor 為 0，沿用 deterministic periodic 四份 maps；凹孔僅由 normal map 表現，不新增透明或 geometry 孔洞。前三十六種輸出須逐位元組保持不變，公開 options、repeat、ownership、renderer 與零新增依賴契約不變；沿既有授權逐功能獨立 commit、不 push。

地板飾面增量追加 parquet／mosaic／hexagontiles（拼花木地板／馬賽克／六角磚），目前共四十二種；前述 counts 保留為歷史。分別為多根窄木條組成木塊、交替縱向木紋與深色凹縫的籃編式拼排（非木材換色）、帶 seed 決定之逐磚色調差異與窄凹填縫的細小方形釉面磚粒（區別於較大的 tiles）、無接邊斷裂地週期重複的六邊形陶瓷單元與窄凹填縫。三者皆為 opaque dielectric、metallic 通道與預設 factor 為 0，僅沿用 deterministic periodic 四份 maps；凹凸由 normal map 表現，接縫不分割 geometry。前三十九種輸出須逐位元組保持不變，公開 options、repeat、ownership、renderer 與零新增依賴契約不變；沿既有授權逐功能獨立 commit、不 push。

柔軟紡織增量追加 knit／corduroy／felt（針織／燈芯絨／毛氈），目前共四十五種；前述 counts 保留為歷史。分別為柔和色調的平針式重複 V 形針目、圓潤隆起紗線與凹陷線圈間隙；暖棕色平行圓潤隆起絨條、細密絨毛斑點與深窄溝槽；柔和灰綠色霧面不織表面、隨機方向細纖維與低起伏。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用 deterministic periodic 四份 maps；凹凸僅由 normal map 表現，不新增紗線／毛髮 geometry 或透明線圈。前四十二種輸出須逐位元組保持不變，公開 options、repeat、ownership、renderer 與零新增依賴契約不變；沿既有授權逐功能獨立 commit、不 push。

外牆與屋面增量追加 roofshingles／rooftiles／stucco（瀝青屋瓦／陶製屋瓦／粗灰泥），目前共四十八種；前述 counts 保留為歷史。分別呈現暗色礦物顆粒瀝青瓦層、錯列矩形瓦片與搭接陰影帶；赤陶筒瓦層、彎曲瓦冠、凹陷水槽與層間搭接帶；暖米白噴塗／抹製灰泥、不規則隆起骨材與凹孔，起伏比 plaster 更粗。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用 deterministic periodic 四份 maps；屋瓦搭接與凹凸僅為 shading／normal map 效果，不新增 geometry、輪廓變化或物理模擬。前四十五種輸出與既有金屬設定、公開 options、repeat、ownership、renderer、依賴契約不變。

自然細節增量追加 lichen／leaflitter／endgrain（地衣／落葉層／木頭端面），目前共五十一種；前述 counts 保留為歷史。分別呈現不規則淺殼狀地衣群落、具方向性的乾葉與中央葉脈及凹陷間隙、彎曲木材年輪與導管孔及放射狀乾裂。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用 deterministic periodic 四份 maps；凹凸僅由 shading／normal map 表現，不新增植被或木材 geometry。前四十八種輸出、既有金屬設定、公開 options、repeat、ownership、renderer 與依賴契約不變；沿既有授權逐功能獨立 commit、不 push。

室內機能表面增量追加 acousticfoam／closedcellfoam／linoleum（吸音泡棉／閉孔泡棉／油氈地材），目前共五十四種；前述 counts 保留為歷史。分別呈現炭黑色柔化金字塔狀泡棉起伏、藍灰色細密閉孔膜面與淺凹、柔和綠／青綠色平滑大理石紋片材地板與細長顏料斑點。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用 seeded deterministic periodic 四份 maps；凹凸僅由 shading／normal map 表現，不新增泡棉 geometry、吸音或物理模擬。前五十一種輸出須逐位元組保持不變，既有金屬設定、公開 options、repeat、ownership、renderer 與零新增依賴契約不變；沿既有授權逐功能獨立 commit、不 push。

皮革飾面增量追加 suede／snakeskin／crocodile（麂皮／蛇鱗紋皮革／鱷魚壓紋皮革），目前共五十七種；前述 counts 保留為歷史。分別為棕褐色短刷絨與細孔、橄欖綠／棕色錯列的小型尖端／圓角菱形鱗紋與中央脊線及凹陷邊界、深棕色大型圓角矩形鱗板與皺褶凹紋。皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用 seeded deterministic periodic 四份 maps；只是合成表面紋樣，凹凸僅由 shading／normal map 表現，不新增動物 geometry 或 displacement。前五十四種輸出須逐位元組保持不變，既有金屬設定、公開 options、repeat、ownership、renderer 與零新增依賴契約不變；沿既有授權逐功能獨立 commit、不 push，品質與驗證結果另記 ACCEPTANCE。

織物飾面增量追加 herringbone／tweed／seersucker（人字紋織物／粗花呢／泡泡紗），目前共六十種；前述 counts 保留為歷史。分別呈現交替斜向的斷續斜紋人字形、粗糙雜色紗線與細斑點及交叉纖維、淺藍／奶油色交替平整與皺褶條帶及細密織紋。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用 seeded deterministic periodic 四份 maps；僅為表面 shading／normal map 效果，不新增布料 geometry、anisotropy 或模擬。前五十七種輸出須逐位元組保持不變，既有金屬設定、公開 options、repeat、ownership、backend 與零新增依賴契約不變；沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

加工金屬增量追加 knurledmetal／engineturned／goldleaf（滾花金屬／魚鱗旋紋金屬／金箔），目前共六十三種；前述 counts 保留為歷史。分別呈現細密交叉斜向脊線與隆起菱形止滑紋、重疊的銀色圓形加工旋紋、暖金色揉皺紋與搭接縫。三者皆為 opaque，僅沿用 seeded deterministic periodic 四份 maps，metallic B 全為 255（1），`material` 與 `createMaterial()` 的預設 metallic factor 均為 1，明確覆寫仍最後套用。rust 保持變化的 metallic map 與預設 factor 1，dielectric 預設仍為 0。僅為表面 shading／normal map 效果，不新增實際 anisotropy、金箔厚度、加工 geometry 或透光效果。前六十種輸出須逐位元組保持不變，公開 options、repeat、ownership、backend 與零新增依賴契約不變；沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

水果表面增量追加 orangepeel／coconut／watermelon（橘皮／椰殼／西瓜皮），目前共六十六種；前述 counts 保留為歷史。分別呈現細密油腺凹點與蠟質橙色表皮、粗糙棕色外殼的細縱向椰纖維與裂隙、綠色不規則波狀縱向瓜皮條帶與雜色斑點。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；只是表面 shading／normal map 效果，不新增水果 geometry、transmission 或 SSS。前六十三種輸出須逐位元組保持不變，包含既有全金屬 maps／預設 factor 1 與 rust 變化的 metallic map／預設 factor 1；公開 options、repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

地質表面增量追加 limestone／breccia／gneiss（石灰岩／角礫岩／片麻岩），目前共六十九種；前述 counts 保留為歷史。分別呈現暖淺色圓潤碳酸鹽顆粒與多孔基質、膠結物中的稜角破碎岩屑、褶曲的明暗交替礦物帶與結晶斑點。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是 shading／normal map 效果，不新增實際岩石 geometry、displacement 或透光效果。前六十六種輸出、既有全金屬與 rust 的 maps／預設 factor、公開 options、repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

木質複合板增量追加 plywood／osb／chipboard（膠合板／定向粒片板／粒片板），目前共七十二種；前述 counts 保留為歷史。分別呈現暖色旋切面單板的山形木紋與節眼（非板邊疊層）、大型重疊且具方向性的細長木片、黏結料中密集較細且隨機定向的木屑。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是 shading／normal map 效果，不新增板材 geometry 或 displacement。前六十九種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

立體紋理織物增量追加 wafflecloth／cableknit／quilting（華夫格布／麻花針織／菱格絎縫），目前共七十五種；前述 counts 保留為歷史。分別呈現隆起的華夫格編織邊框與凹陷方格口袋、相互纏繞的羊毛麻花辮與交叉處起伏及兩側較細的針織凸條、蓬鬆填充的菱形布面單元與凹陷斜向縫線。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增布料 geometry、displacement、transmission 或 SSS。前七十二種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

裝飾陶瓷與花磚增量追加 crackleglaze／flutedceramic／encaustictiles（冰裂釉／直槽陶瓷／嵌彩水泥花磚），目前共七十八種；前述 counts 保留為歷史。分別呈現淺青瓷色平滑釉面與細密不規則深色凹陷裂紋網、象牙白拋光陶瓷與垂直圓潤槽紋、奶油色／柔和藍色裝飾水泥磚與花卉／幾何顏料嵌紋及凹陷填縫。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；只是表面 shading／normal map 效果，不新增實際裂縫、geometry、displacement、transmission 或塗層系統。前七十五種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

生物覆層增量追加 fishscales／tortoiseshell／feathers（魚鱗／龜甲／羽毛），目前共八十一種；前述 counts 保留為歷史。分別呈現藍灰／青綠色錯列重疊的圓潤扇貝狀鱗片、同心生長紋與露出邊唇；棕／琥珀色不規則多邊形盾片、深色接縫、圓頂與生長環；灰褐色層疊尖端羽片、羽軸與斜向羽枝。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；只是表面顏料與 normal map 效果，不新增 geometry、cutout、transmission、iridescence、SSS 或 shader feature。前七十八種輸出須逐位元組保持不變，既有 metal／rust、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

植物纖維增量追加 reedmat／rope／straw（蘆葦蓆／繩索／稻草），目前共八十四種；前述 counts 保留為歷史。分別呈現纖細平行蘆葦與橫向綁線、相鄰三股扭繩帶與螺旋凹槽及細纖維、金黃乾燥纖細散落直莖與偶見節點及層疊鋪墊。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；只是表面 shading／normal map 效果，不新增圓柱、geometry、cutout 或 displacement。前八十一種輸出須逐位元組保持不變，既有 metal／rust、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

橡膠地材增量追加 studdedrubber／groovedrubber／recycledrubber（圓釘橡膠／溝槽橡膠／再生橡膠），目前共八十七種；前述 counts 保留為歷史。分別呈現圓形平頂炭黑凸釘與斜面肩部、寬平深灰肋條與窄排水槽、暗色黏結料中的密集細小藍灰不規則橡膠顆粒。皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；只是表面 shading／normal map 效果，不提供實際摩擦／止滑或排水物理，不新增 geometry 或 displacement。前八十四種輸出須逐位元組保持不變，既有 metal／rust、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

金屬網孔增量追加 perforatedmetal／expandedmetal／wiremesh（穿孔金屬板／擴張網／編織金屬網），目前共九十種；前述 counts 保留為歷史。分別呈現亮面金屬板上錯列的圓形凹孔與孔間平整網面、兩組對角條帶在隆起節點相接並圍出凹陷的菱形開口、圓形金屬線平紋交織且上下交錯於深色開放網孔之上。三者皆為 opaque metal，metallic 通道與預設 factor 為 1，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增板材 geometry、真實孔洞、彎折條帶或 displacement。前八十七種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另列 ACCEPTANCE。

絨面織物增量追加 velvet／terrycloth／boucle（天鵝絨／毛圈布／圈圈紗），目前共一百一十一種；前述 counts 保留為歷史。分別呈現細密平整直立絨面與柔和壓褶雲塊的色素／光澤變化、錯列隆起的圓潤毛圈冠、紗節上隆起的環狀線圈與環心凹陷及紗節間開放凹槽。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增布料 geometry、剪開線圈、displacement 或 SSS。前一百零八種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

礦石晶體增量追加 geode／quartz／pyrite（晶洞／石英／黃鐵礦），目前共一百一十七種；前述 counts 保留為歷史。分別呈現環繞細密晶簇核心的同心礦物縞帶、高低錯落的六方柱體與錐狀頂端、相互咬合的階梯狀立方晶面與細密平行條紋。晶洞與石英為 opaque dielectric，metallic 通道與預設 factor 為 0；黃鐵礦為 opaque metal，metallic 通道與預設 factor 為 1。三者僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增晶體 geometry、切割晶面或 displacement。前一百一十四種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

建築外殼增量追加 shiplap／glassblock／thatch（搭接木板／玻璃磚／茅草），目前共一百二十九種；前述 counts 保留為歷史。分別呈現搭接處陰影凹槽與接縫淡出的板材色調及沿面木紋、圓角磚面與凹陷接縫及內部隆起氣泡、層層下垂草束的陰影搭接與沿坡細長草莖。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增板材、磚體或草束 geometry，也不做 displacement。前一百二十六種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

風化表面增量追加 charredwood／driftwood／peelingpaint（炭化木／漂流木／剝落漆面），目前共一百三十二種；前述 counts 保留為歷史。分別呈現隆起於深邃鱷魚裂紋之上的圓潤炭塊、銀灰木紋脊與沿木紋開裂的風化裂隙、翹起捲邊的完整漆面與外露的底材。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增樹皮、木板或漆片 geometry，也不做 displacement。前一百二十九種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

功能紋面增量追加 tiretread／honeycomb／frost（胎紋／蜂巢／霜花），目前共一百三十八種；前述 counts 保留為歷史。分別呈現錯列墊高的胎塊與其間溝槽及胎面細割紋、環繞凹陷巢房的隆起蠟質六角壁、自淡出中心放射的羽狀冰晶。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增胎塊、巢房或冰晶 geometry，也不做 displacement。前一百三十五種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

裝飾面板增量追加 stainedglass／soapstone／butcherblock（彩繪玻璃／皂石／端面砧板），目前共一百四十四種；前述 counts 保留為歷史。分別呈現墊高鉛條與其間不同色調的不規則玻璃片、深色滑石底上的柔和淺色紋帶、錯色棋盤格端面木塊與凹陷接縫。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增鉛條、石材或木塊 geometry，也不做 displacement。前一百四十一種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

居家織品增量追加 wallpaper／embroidery／macrame（壁紙／刺繡／流蘇編繩），目前共一百五十種；前述 counts 保留為歷史。分別呈現以精確鏡像對稱重複的大馬士革團花、在自身支撐處淡出的墊高緞面繡線、墊高於交錯扭繩之上的錯列圓潤繩結。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增線材、繡線或繩結 geometry，也不做 displacement。前一百四十七種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

戶外硬景增量追加 brickpaving／steppingstone／woodendeck（磚鋪面／踏石／木平台），目前共一百五十六種；前述 counts 保留為歷史。分別呈現錯縫墊高於砂質接縫之上的磚面、墊高於礫石地面的圓潤石板、窄縫上方的板面與隆起螺絲釘頭及凹陷十字槽。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增磚、石板、木板或螺絲 geometry，也不做 displacement。前一百五十三種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

廚房與燭光增量追加 cheese／sugarfrosting／candleswax（起司／糖霜／蠟淚），目前共一百五十九種；前述 counts 保留為歷史。分別呈現沉入麵體、大小不一的圓潤孔洞、隆起於平滑糖面的擠花玫瑰峰、圓潤下垂的蠟流與其下端鼓起的淚頭。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增食品或蠟體 geometry，也不做 displacement。前一百五十六種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

聲音與紙面增量追加 vinylrecord／graphpaper／notebookpaper（黑膠唱片／方格紙／筆記本紙），目前共一百六十八種；前述 counts 保留為歷史。分別呈現環繞平整標籤圓面的細密同心溝紋、深於細格線的粗格線、依序沉入紙面的橫線與邊界線及打孔。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增唱片、紙張或孔洞 geometry，也不做 displacement。前一百六十五種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

編織工藝增量追加 lace／crochet／basketweave（蕾絲／鉤織／籃織），目前共一百七十四種；前述 counts 保留為歷史。分別呈現菱形網眼上方交叉的對角線網紋與交叉鼓起、交錯半格位移的隆起線圈列、依區塊交替方向且帶凸脊的條帶。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增線材、毛線或藤編 geometry，也不做 displacement。前一百七十一種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

扣合配件增量追加 zipper／velcro／button（拉鍊／魔鬼氈／鈕扣），目前共一百八十種；前述 counts 保留為歷史。分別呈現嚙合於凹陷接縫上方的鏈齒列與織紋布帶、錯列鉤針圓環與凹陷針芯、隆起扣緣與縫線扣面及孔洞凹點。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增鏈齒、針扣或鈕扣 geometry，也不做 displacement。前一百七十四種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

道路與軌道增量追加 traintracks／manholecover／speedbump（鐵軌／人孔蓋／減速丘），目前共一百八十三種；前述 counts 保留為歷史。分別呈現鋼軌隆起於橫向枕木與道碴顆粒、外框環高於放射與同心圓肋紋蓋面、圓拱隆起於坡腳與凹陷接縫並帶警示條紋。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增鋼軌、蓋體或丘體 geometry，也不做 displacement。前一百八十種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

科技表面增量追加 circuitboard／solarpanel／heattile（電路板／太陽能板／隔熱瓦），目前共一百九十二種；前述 counts 保留為歷史。分別呈現銲盤隆起於走線交點與導孔凹陷、匯流條與細柵線墊在凸起電池片面上、圓角瓦面高於凹陷接縫。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增線路、電池片或瓦片 geometry，也不做 displacement。前一百八十九種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

樂器與聲學增量追加 pianokeys／drumskin／gongsurface（琴鍵／鼓皮／鑼面），目前共一百九十八種；前述 counts 保留為歷史。分別呈現黑鍵隆起於白鍵面與凹陷縫線、鼓耳高於鼓框與放射褶鼓膜、錘打環紋繞著中央凸起。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增琴鍵、鼓皮或鑼體 geometry，也不做 displacement。前一百九十五種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

光學表面增量追加 lensarray／prismtape／fresnel（微透鏡陣列／稜鏡膠帶／菲涅耳面），目前共二百零一種；前述 counts 保留為歷史。分別呈現圓頂微透鏡隆起於細支撐網、斜向稜脊高於脊腳與膠帶底面、同心鋸齒環帶由中央凸起向外漸低。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增透鏡、稜鏡或階梯透鏡 geometry，也不做 displacement。前一百九十八種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

醫療與衛生增量追加 bandage／pillblister／sutures（繃帶／藥丸泡殼／縫合線），目前共二百零七種；前述 counts 保留為歷史。分別呈現圓角軟墊墊在織紋紗布、半球泡殼鼓起於壓痕鋁箔、縫線跨過凹陷切口並旁有針孔凹點。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增軟墊、泡殼、縫線或縫針 geometry，也不做 displacement。前二百零四種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

園藝與戶外增量追加 trellis／terracottapot／hedgerow（格柵／陶盆／樹籬），目前共二百一十種；前述 counts 保留為歷史。分別呈現交叉木條與交點繩結高於鏤空格、凸緣高於盆壁旋紋、葉團鼓起於枝條縫隙。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增木條、盆體或枝葉 geometry，也不做 displacement。前二百零七種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

寵物與動物照護增量追加 collar／petbed／scratchpost（項圈／寵物床／貓抓柱），目前共二百一十三種；前述 counts 保留為歷史。分別呈現扣環高於縫線織帶與素面底布、環形床緣圍著內凹軟墊與織紋底、麻繩脊高於繩圈溝縫。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增扣環、床緣或繩索 geometry，也不做 displacement。前二百一十種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

運動場地增量追加 runningtrack／bouldermat／pooltile（跑道／攀岩墊／泳池磚），目前共二百一十六種；前述 counts 保留為歷史。分別呈現分道線墊在膠粒表面與排水縫、菱形壓紋鼓起於邊緣縫合帶內側、磚面高於填縫並疊水光條紋。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增劃線、壓紋或瓷磚 geometry，也不做 displacement。前二百一十三種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

辦公與文具增量追加 envelope／chalkboard／corkboard（信封／黑板／軟木板），目前共二百一十九種；前述 counts 保留為歷史。分別呈現交叉壓紋框著凹陷封口縫、木框圍著粉筆擦痕板面、軟木顆粒墊高板面與圖釘孔深陷。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增封口、框體或圖釘 geometry，也不做 displacement。前二百一十六種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

自然現象增量追加 snowdrift／icicle／dewdrops（雪堆／冰柱／露珠），目前共二百二十二種；前述 counts 保留為歷史。分別呈現風紋波浪脊墊在細雪粒、圓潤冰柱垂在陰影隙縫、大小水珠串在淡葉脈之上。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增雪堆、冰柱或水珠 geometry，也不做 displacement。前二百一十九種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

天文與太空增量追加 mooncrater／starfield／nebula（月坑／星空／星雲），目前共二百二十五種；前述 counts 保留為歷史。分別呈現坑緣隆起於地表與坑底凹陷、亮星與塵點閃在星雲底色、明亮渦卷條紋繞著暗塵帶。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增隕坑、星體或雲氣 geometry，也不做 displacement。前二百二十二種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

服裝細節增量追加 pleats／shoelace／tassel（褶襉／鞋帶／流蘇），目前共二百二十八種；前述 counts 保留為歷史。分別呈現風琴褶脊高於布面谷線、交織圓繩高於底面與鞋眼孔深陷、穗帶垂在束結環之下。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增褶片、繩體或穗帶 geometry，也不做 displacement。前二百二十五種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

烹飪器具增量追加 woksurface／cutlery／choppingboard（炒鍋／餐具／砧板），目前共二百三十一種；前述 counts 保留為歷史。分別呈現錘打凹點高於刮痕鋼面與油光、串珠邊框圍著拉絲柄面、端面木塊留著刀痕且邊框凹陷。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增凹點、串珠或木塊 geometry，也不做 displacement。前二百二十八種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

浴室與水電增量追加 faucet／showerhead／bathmat（水龍頭／蓮蓬頭／浴墊），目前共二百三十四種；前述 counts 保留為歷史。分別呈現拋光弧面高於底盤與水垢斑、出水孔沉入溝紋面板、吸盤圓頂墊在織紋底面。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增弧面、噴孔或吸盤 geometry，也不做 displacement。前二百三十一種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

窗簾與遮光增量追加 blinds／curtain／shadecloth（百葉窗／窗簾／遮陽網），目前共二百三十七種；前述 counts 保留為歷史。分別呈現傾斜葉片面高於遮蔭縫隙、布褶波峰高於布面谷地、交織網線墊在開口網眼。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增葉片、布褶或網線 geometry，也不做 displacement。前二百三十四種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

烘焙點心增量追加 pretzel／bagel／croissant（蝴蝶脆餅／貝果／可頌），目前共二百四十種；前述 counts 保留為歷史。分別呈現交錯麵繩打結高於繩間凹處與鹽粒、Q彈環面高於凹陷中孔與芝麻、奶油層片斜脊高於烘烤接縫。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增結點、環面或層片 geometry，也不做 displacement。前二百三十七種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

昆蟲與蛛網增量追加 butterflywing／beetlewing／spiderweb（蝶翅／甲蟲翅／蛛網），目前共二百四十三種；前述 counts 保留為歷史。分別呈現鱗片格面高於凹陷翅脈、弧形鞘翅板高於分節接縫、放射蛛絲與同心絲環高於開口網格與露珠。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增鱗片、鞘翅、蛛絲或絲環 geometry，也不做 displacement。前二百四十種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

天空與天氣增量追加 cirrus／cumulus／lightning（卷雲／積雲／閃電），目前共二百四十六種；前述 counts 保留為歷史。分別呈現風梳細絲條紋橫過高空留白、花椰菜狀雲團高於陰影縫隙、鋸齒電光核心亮過暗沉雷天空。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增絲條、雲團或電光 geometry，也不做 displacement。前二百四十三種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

海洋植物與生物增量追加 kelp／seaweed／anemone（海帶／海藻／海葵），目前共二百四十九種；前述 counts 保留為歷史。分別呈現寬亮葉帶波皺高於陰影波谷、細分枝絲交錯墊面與陰影空隙、環狀觸手高於凹陷中央口盤。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增葉帶、分枝或觸手 geometry，也不做 displacement。前二百四十六種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

糖果與甜點增量追加 candy／marshmallow／nougat（硬糖／棉花糖／牛軋糖），目前共二百五十二種；前述 counts 保留為歷史。分別呈現光亮扭轉條紋高於淺接縫、柔軟擠花圓稜高於圓弧凹槽與灑粉、堅果塊與氣泡孔穿插耐嚼糖體。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增條紋、圓稜或堅果塊 geometry，也不做 displacement。前二百四十九種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

玻璃表面增量追加 frostedglass／rippledglass／bubbleglass（磨砂玻璃／波紋玻璃／氣泡玻璃），目前共二百五十五種；前述 counts 保留為歷史。分別呈現細酸蝕顆粒散布玻璃面、垂直壓延波肋橫過拉製玻璃、圓氣泡鼓起於透明玻璃體。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增顆粒、波肋或氣泡 geometry，也不做 displacement。前二百五十二種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

皮革加工增量追加 saddlestitch／tooledleather／patentleather（馬鞍縫線／壓花皮革／漆皮），目前共二百五十八種；前述 counts 保留為歷史。分別呈現斜向虛線縫線高於粗面皮革、浮雕圓章與渦紋高於壓縮底面、細橘皮波紋橫過鏡面漆層。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增縫線、圓章或漆層 geometry，也不做 displacement。前二百五十五種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

果皮果肉增量追加 appleskin／peachskin／grapeskin（蘋果皮／桃皮／葡萄皮），目前共二百六十一種；前述 counts 保留為歷史。分別呈現紅暈條紋帶過緊繃果皮與果點、細絨覆於紅暈旁凹陷縫線溝、白霜粉斑散布緊繃光滑果皮。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增條紋、絨毛或粉斑 geometry，也不做 displacement。前二百五十八種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

蔬菜表面增量追加 broccoli／cabbage／onion（青花菜／高麗菜／洋蔥），目前共二百六十四種；前述 counts 保留為歷史。分別呈現密集花球粒高於花球陰影空隙、葉片波皺高於凹陷葉脈、同心層弧條紋高於乾皮纖維。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增花球粒、葉皺或層弧 geometry，也不做 displacement。前二百六十一種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

寢具床品增量追加 bedsheet／pillow／mattress（床單／枕頭／床墊），目前共二百六十七種；前述 counts 保留為歷史。分別呈現柔壓皺褶漂過織面、蓬鬆衍縫墊高於凹陷滾邊縫線、鈕扣拉扣凹點沉入粗織面。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增皺褶、衍縫墊或拉扣 geometry，也不做 displacement。前二百六十四種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

茶與飲品增量追加 tealeaf／matcha／teabag（茶葉／抹茶／茶包），目前共二百七十種；前述 counts 保留為歷史。分別呈現捲曲葉片堆過茶堆陰影空隙、刷痕條紋梳過細粉面、濾紙網線交錯開口網眼與茶影。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增葉片、刷痕或網線 geometry，也不做 displacement。前二百六十七種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

沙灘與海岸增量追加 sanddune／pebblebeach／foamedge（沙丘／卵石灘／浪花泡沫），目前共二百七十三種；前述 counts 保留為歷史。分別呈現風紋波脊梳過細沙面、圓卵石鼓起於粗砂之上、泡沫團與氣泡洗過薄水膜。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增波脊、卵石或泡沫 geometry，也不做 displacement。前二百七十種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

火山與熔岩增量追加 lavaflow／cooledlava／ashfield（熔岩流／冷卻熔岩／火山灰），目前共二百七十六種；前述 counts 保留為歷史。分別呈現繩狀熔岩紋高於暗色裂縫、結殼岩塊高於裂縫與孔洞、細灰堆高於灰面。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增繩紋、岩塊或灰堆 geometry，也不做 displacement。前二百七十三種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

洞穴與地下增量追加 stalactite／flowstone／cavefloor（鐘乳石／流石／洞底），目前共二百七十九種；前述 counts 保留為歷史。分別呈現滴水錐尖垂過陰影凹處、梯田流紋台階過細滴水波紋、碎石泥面環繞平淺水窪。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增錐尖、台階或碎石 geometry，也不做 displacement。前二百七十六種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

甜點配料增量追加 jam／peanutbutter／sprinkles（果醬／花生醬／糖針），目前共二百八十二種；前述 counts 保留為歷史。分別呈現光亮果肉塊浸於透明果膠、花生碎穿插綿滑漩渦醬面、糖針條散布糖霜底面。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增果肉塊、花生碎或糖針 geometry，也不做 displacement。前二百七十九種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

冰品與冷飲增量追加 icecream／popsicle／sorbet（冰淇淋／冰棒／雪酪），目前共二百八十五種；前述 counts 保留為歷史。分別呈現擠花奶油稜高於融化滴點之間、冷凍滴掛稜垂過霜面冰體、刮匙刮脊高於果粒面。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增擠花、滴掛或刮匙 geometry，也不做 displacement。前二百八十二種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

義式麵食增量追加 spaghetti／macaroni／lasagna（義大利麵／通心粉／千層麵），目前共二百八十八種；前述 counts 保留為歷史。分別呈現蜿蜒麵條盤過醬底、短彎管殼堆於空隙之間、層層麵片疊過醬料縫。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增麵條、管殼或麵片 geometry，也不做 displacement。前二百八十五種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

紙藝增量追加 origami／paperlace／papercut（折紙／紙蕾絲／剪紙），目前共二百九十一種；前述 counts 保留為歷史。分別呈現折面高於壓折痕線、鏤空孔洞穿過紙橋面、層疊剪影高於平底紙面。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增折面、孔洞或剪影 geometry，也不做 displacement。前二百八十八種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

花卉增量追加 sunflower／daisy／clover（向日葵／雛菊／三葉草），目前共二百九十四種；前述 counts 保留為歷史。分別呈現花盤種籽圓頂密排、放射花瓣圍繞凹陷花心、三心葉瓣自葉柄展開。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增種籽、花瓣或葉瓣 geometry，也不做 displacement。前二百九十一種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

玩具與休閒增量追加 puzzletile／legobrick／rubberband（拼圖磚／積木／橡皮筋），目前共二百九十七種；前述 counts 保留為歷史。分別呈現拼片與圓弧接點高於接縫、圓柱凸點高於平滑磚面、交叉彈條拉過底層包覆。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增拼片、凸點或彈條 geometry，也不做 displacement。前二百九十四種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

農場與穀倉增量追加 haybale／corncrib／fencepost（乾草捆／穀倉／柵欄柱），目前共三百種；前述 counts 保留為歷史。分別呈現梳整稻稈條紋旁壓縮捆帶、木條柵欄交錯過開口空隙、風化直木紋稜被深裂紋分割。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增稈條、木條或木紋 geometry，也不做 displacement。前二百九十七種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

運動與遊樂增量追加 poolfelt／icesurface／climbingwall（撞球桌絨布／冰面／攀岩牆），目前共三百零三種；前述 counts 保留為歷史。分別呈現白色標記圓點高於濃密絨毛、掃冰弧紋高於溝谷並帶霜斑、圓形岩點高於顆粒牆面。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增圓點、弧紋或岩點 geometry，也不做 displacement。前三百種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

顯示與周邊增量追加 oledpanel／crtscanline／keyboardkey（OLED 面板／CRT 掃描線／鍵盤鍵帽），目前共三百零六種；前述 counts 保留為歷史。分別呈現子像素發光條紋高於深色矩陣遮罩、磷光掃描波峰高於線間暗隙、圓角方形鍵帽高於凹陷縫隙。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增條紋、掃描線或鍵帽 geometry，也不做 displacement。前三百零三種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

影像與印刷增量追加 filmstrip／postagestamp／halftoneprint（底片／郵票／網點印刷），目前共三百零九種；前述 counts 保留為歷史。分別呈現打孔圓洞高於分格凹槽間的片基、邊緣齒孔圍繞高於紙面的中央圖案、隨色調大小的墨點高於留白紙面。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增圓孔、齒孔、圖案或墨點 geometry，也不做 displacement。前三百零六種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

暖氣與五金增量追加 radiator／screwhead／chainlink（散熱管／螺絲頭／菱形鐵絲網），目前共三百一十二種；前述 counts 保留為歷史。分別呈現圓管高於凹陷接縫、十字凹槽低於頭環與面板、交叉節點高於鐵絲與鏤空。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增圓管、螺絲或鐵絲 geometry，也不做 displacement。前三百零九種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

餐桌食物增量追加 friedegg／sushirice／chocolatechip（煎蛋／壽司飯／巧克力碎片餅乾），目前共三百一十五種；前述 counts 保留為歷史。分別呈現蛋黃高於扭曲蛋白與鍋面、米粒高於縫隙、巧克力片高於餅乾底。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增蛋黃、米粒或碎片 geometry，也不做 displacement。前三百一十二種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

車輛內裝增量追加 cargomat／dashboardgrain／licenseplate（貨車踏墊／儀表皮革紋／車牌），目前共三百一十八種；前述 counts 保留為歷史。分別呈現橡膠長肋高於橫向凹槽、顆粒高於谷底與縫線凹痕、凸框高於字條與底板。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增肋條、顆粒或邊框 geometry，也不做 displacement。前三百一十五種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

花園植栽增量追加 flowerbed／grassstripe／topiary（花圃／草坪條紋／修剪灌木），目前共三百二十一種；前述 counts 保留為歷史。分別呈現四瓣花簇高於土壤、剪草亮帶高於溝底、葉團高於修邊空隙。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增花朵、草葉或葉團 geometry，也不做 displacement。前三百一十八種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

節慶裝飾增量追加 confetti／ribbonstreamer／pinatafringe（紙屑／緞帶波紋／彩帶流蘇），目前共三百二十四種；前述 counts 保留為歷史。分別呈現碎片高於紙面、扭轉寬帶高於溝底、密集垂條高於層帶與空隙。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增碎片、緞帶或垂條 geometry，也不做 displacement。前三百二十一種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

樂器與演奏增量追加 xylophone／tambourine／castanet（木琴／鈴鼓／響板），目前共三百二十七種；前述 counts 保留為歷史。分別呈現琴條高於穿繩孔與空隙、斜置鈴片高於鼓皮、殼緣高於中央凹與氈底。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增琴條、鈴片或殼體 geometry，也不做 displacement。前三百二十四種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

保健與美容增量追加 pillcapsule／pilltablet／bathbomb（膠囊／藥錠／入浴球），目前共三百三十種；前述 counts 保留為歷史。分別呈現兩半高於接縫與底板、圓頂高於刻痕、顆粒高於斜向裂隙。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增膠囊、錠劑或裂隙 geometry，也不做 displacement。前三百二十七種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

打磨與清潔增量追加 sandpaper／steelwool／wirebrush（砂紙／鋼絲棉／鋼絲刷），目前共三百三十三種；前述 counts 保留為歷史。分別呈現錯列磨料凸粒高於背板與脫落凹坑、三向斜向纏繞絲脊交錯抬高、密排平行刷毛高於溝槽。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增磨料、絲線或刷毛 geometry，也不做 displacement。前三百三十種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

廚房器具增量追加 cheesegrater／ovenrack／muffintin（起司刨刀／烤架／馬芬烤盤），目前共三百三十六種；前述 counts 保留為歷史。分別呈現沖孔低於凸起孔環、圓桿高於細橫桿與交點抬高、圓槽低於凸起模環。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增孔洞、圓桿或圓槽 geometry，也不做 displacement。前三百三十三種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

醫療敷料增量追加 gauze／elasticbandage／icepack（紗布／彈性繃帶／冰袋），目前共三百三十九種；前述 counts 保留為歷史。分別呈現起伏交織經緯紗與孔隙、斜向羅紋交錯布邊溝、方圓絎縫格鼓起於接縫網。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增紗線、羅紋或絎縫格 geometry，也不做 displacement。前三百三十六種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。
圓形單元增量追加 bubblewrap／sequin／pennyround（氣泡布／亮片布／小圓馬賽克），目前共三百四十二種；前述 counts 保留為歷史。分別呈現方格封氣圓凸高於薄膜網、交錯圓片與中央縫窩高於裸布、圓瓷磚密排高於凹陷填縫。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增圓凸、圓片或瓷磚 geometry，也不做 displacement。前三百三十九種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。
球類表面增量追加 volleyball／bowlingball／rugbyball（排球／保齡球／橄欖球），目前共三百四十五種；前述 counts 保留為歷史。分別呈現弧形面板高於凹陷接縫與細點凹紋、珍珠環繞紋包覆三個凹陷指孔、顆粒皮革與縫線繫帶高於繫帶與接縫溝。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增球體、指孔或繫帶 geometry，也不做 displacement。前三百四十二種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。
烘焙甜點增量追加 wafflecone／donutglaze／brownie（甜筒／甜甜圈糖霜／布朗尼），目前共三百四十八種；前述 counts 保留為歷史。分別呈現斜向格紋凸脊高於烘烤菱形凹格、糖霜垂滴高於多孔蛋糕體、核桃塊高於粗裂巧克力頂面。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增格紋、糖霜、裂紋或核桃 geometry，也不做 displacement。前三百四十五種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。
浴室清潔增量追加 soapbar／loofah／scrubbypad（香皂／絲瓜絡／菜瓜布），目前共三百五十一種；前述 counts 保留為歷史。分別呈現圓角皂塊與橢圓壓印高於氣孔、交錯波浪纖維高於網絡空隙、粗礪磨砂高於凹陷六角切孔。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增皂塊、纖維或切孔 geometry，也不做 displacement。前三百四十八種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。
水果剖面增量追加 orangeflesh／kiwiflesh／avocadoflesh（柳橙果肉／奇異果果肉／酪梨果肉），目前共三百五十四種；前述 counts 保留為歷史。分別呈現凸起汁囊瓣片在果皮環內匯聚於凹陷果白、凸起種子凸點與果心高於輻射纖維、平滑果肉圍繞凹陷中央果核。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增果瓣、種子或果核 geometry，也不做 displacement。前三百五十一種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。
裝飾礦石二增量追加 turquoise／rhodonite／tigereye（綠松石／薔薇輝石／虎眼石），目前共三百五十七種；前述 counts 保留為歷史。分別呈現青綠石面上凹陷的深色蛛網狀基岩細脈、玫瑰粉紅石面上凹陷的分岔黑色錳質細脈、金棕色波浪平行纖維條帶與絲光色調。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic 四份 maps；凹凸只是表面 shading／normal map 效果，不新增細脈、纖維或寶石 geometry，也不做 displacement、透明、折射或真實貓眼光學。前三百五十四種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

烘焙食品表面增量追加 breadcrust／wafer／chocolate（麵包脆皮／威化餅／巧克力），目前共九十種；前述 counts 保留為歷史。分別呈現裂開的烤焦麵包脆皮、細密正交凹格與烘烤凸肋、寬大平滑的巧克力方塊與分割刻槽。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion 四份 maps；只是平坦表面的 shading／normal map 效果，不新增 geometry、displacement、SSS、transmission、半透明或食品／物理模擬。前八十七種輸出須逐位元組保持不變，既有 metal／rust、公開 options、physical repeat、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push，實際驗證另記 ACCEPTANCE。

運動球表面增量追加 basketball／tennisball／golfball（籃球／網球／高爾夫球），目前共九十三種；前述 counts 保留為歷史。分別呈現橙色顆粒皮革與深色凹陷拼片縫、黃綠色毛氈與淡色彎曲接縫、白色光澤表面與規則圓形凹點。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion 四份 maps 與 physical repeat；僅為週期表面 shading／normal map 近似，不提供真實球面拼片拓撲、geometry、displacement、纖維或殼體體積、SSS、transmission 或球體物理。前九十種輸出須逐位元組保持不變，既有 metal／rust、公開 options、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push。

建築混凝土增量追加 boardformedconcrete／ribbedconcrete／splitfaceblock（木模板清水混凝土／肋紋混凝土／劈面砌塊），目前共九十六種；前述 counts 保留為歷史。分別呈現灰色澆置混凝土的水平木板壓印、細長木紋與凹陷板縫，而非木材換色；垂直等距寬肋、圓潤肩部、凹槽與細孔；錯列矩形砌塊的粗糙破裂面與平滑凹陷砂漿縫，而非磚牆換色。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion 四份 maps 與 physical repeat；僅為 shading／normal map 效果，不新增實際澆置 geometry、displacement 或砌體物理。前九十三種輸出須逐位元組保持不變，既有 metal／rust、公開 options、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push。

組裝金屬增量追加 chainmail／rivetedmetal／weldedmetal（鎖子甲／鉚接金屬板／焊接金屬板），目前共九十九種；前述 counts 保留為歷史。鎖子甲為深色不透明 dielectric 襯底上重疊交錯的金屬環浮雕，不是真實開孔或透明網；鉚接板為板片凹縫與離散圓潤隆起鉚釘；焊接板為較平坦金屬板上的隆起週期扇貝狀焊道。三者皆為 opaque，`material` 與 `createMaterial()` 預設 metallic factor 均為 1，覆寫仍最後套用；chainmail 的 metallic map 隨金屬環覆蓋率變化，襯底為 0，而 rivetedmetal／weldedmetal 通道全為 1。沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion 四份 maps、physical repeat 與呼叫者 ownership；僅為 shading／normal map 效果，不新增 geometry、displacement、物理模擬、options 或依賴。前九十六種輸出須逐位元組保持不變，沿既有授權逐功能獨立 commit、不 push。

植物表面增量追加 cactus／pinecone／corncob（仙人掌／松果／玉米穗），目前共一百零二種；前述 counts 保留為歷史。仙人掌為縱向綠色肋紋、重複刺座與細放射狀刺痕；松果為錯列重疊的木質角狀鱗片、隆起露出尖端與凹陷搭接縫，區別於圓潤魚鱗；玉米穗為緊密排列的飽滿長橢圓籽粒、圓潤冠部與狹窄粒間凹隙，不是磚牆換色。三者皆為 opaque dielectric，metallic 通道及 `material`／`createMaterial()` 預設 factor 均為 0，沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion 四份 maps、physical repeat 與呼叫者 ownership；僅為表面 shading／normal map 效果，不提供完整植株／果實拓撲、geometry、真實刺、displacement 或刺與植株物理。前九十九種輸出須逐位元組保持不變，公開 options、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push。

紙材包裝增量追加 corrugatedcardboard／creasedpaper／layeredpaper（瓦楞紙板／摺痕紙／層疊紙），目前共一百零五種；前述 counts 保留為歷史。瓦楞紙板為外露的圓潤紙質楞脊與谷槽、帶纖維的牛皮紙表面，不是金屬換色；摺痕紙為細微紙漿底紋上的交叉隆起摺脊與凹陷摺肩，不只是雜訊；層疊紙為不規則毛邊紙條交疊、明確階緣與下切陰影，不是紙張換色。三者皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion 四份 maps、physical repeat 與呼叫者 ownership；楞紋、摺痕與層緣僅為表面 shading／normal map 效果，不建立 geometry、切面、displacement、透明撕邊輪廓或撕裂物理。前一百零二種輸出（含原 paper）須逐位元組保持不變，公開 options、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push。

火山石表面增量追加 basalt／scoria／obsidian（玄武岩／火山渣／黑曜石），接續已提交金屬網孔後共一百一十一種；前述 counts 保留為歷史。玄武岩為深色細粒底紋上的圓角多邊形柱頂與凹陷節理；火山渣為暖暗紅色岩面、大小不一的緊湊凹氣孔與隆起孔緣；黑曜石為極深色、有光澤的不透明火山玻璃與彎曲貝殼狀剝片痕。三者皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，沿用相同四份 seeded deterministic periodic maps 與 physical repeat；僅為表面 shading／normal map 效果，不建立真實岩柱、孔洞、geometry、displacement、透明玻璃、折射或發光。前一百零八種輸出須逐位元組保持不變，公開 options、ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push。

裝飾礦石表面增量追加 malachite／agate／lapislazuli（孔雀石／瑪瑙／青金石），目前共一百一十七種；前述 counts 保留為歷史。孔雀石為濃綠色圓潤葡萄狀巢套生長帶與細微拋光起伏；瑪瑙為暖奶油、紅與橙色的拉長波浪巢套生長帶，輪廓尺度與拓撲區別於孔雀石；青金石為深群青色顆粒石面與淺色不規則方解石脈及內含物，不含金色黃鐵礦或金屬碎斑。三者皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，沿用相同四份 seeded deterministic periodic maps、physical repeat 與公開 options；僅為表面拋光 shading／normal map 效果，不提供透明、折射、虹彩或寶石 geometry。前一百一十四種輸出須逐位元組保持不變，ownership、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push。

散粒表面增量追加 rice／sesame／coffeebeans（米粒／芝麻／咖啡豆），目前共一百二十種；前述 counts 保留為歷史。分別呈現象牙白細長米粒、不同朝向與柔和縱向起伏；暖棕褐色小型不對稱淚滴芝麻、圓潤隆起中脊與漸尖端部；較寬的深烘焙棕色橢圓咖啡豆、彎曲中央裂縫與細密不均烘焙紋理。三者各自擁有不同形狀場，不是同一圖樣換色或縮放，皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0。沿用既有 CPU 一次生成的四份 seeded deterministic periodic maps、repeat sampling、呼叫者 ownership 與 size／seed options；僅為風格化散粒表面 shading／normal map 效果，不提供逐粒模擬、物理堆疊、geometry、displacement、透明或次表面散射。前一百一十七種四份 maps 輸出須逐位元組保持不變，backend 與零新增依賴契約不變；實際驗證另記 ACCEPTANCE。沿既有授權逐功能獨立 commit、不 push。

綠葉表面增量追加 lotusleaf／bananaleaf／fernleaf（荷葉／香蕉葉／蕨葉），目前共一百二十六種；前述 counts 保留為歷史。荷葉呈現寬闊圓潤葉片、放射狀葉脈與中央附著點起伏；香蕉葉呈現細長寬葉面、強烈中肋與密集平行／斜向側脈；蕨葉呈現沿葉軸交替排列的漸尖羽片，各有細緻葉脈。三者各有不同形態，不是換色或縮放的落葉層，皆為不透明綠色 dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0。沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps、repeat sampling、呼叫者 ownership 與 size／seed options；僅為表面 shading／normal map 效果，不提供 alpha cutout、真實植被 geometry、displacement、SSS、濕潤模擬或風動行為。前一百二十三種四份 maps 輸出須逐位元組保持不變，backend 與零新增依賴契約不變；實際驗證另記 ACCEPTANCE。沿既有授權逐功能獨立 commit、不 push。

海洋骨骼表面增量追加 braincoral／starcoral／seasponge（腦珊瑚／星珊瑚／海綿），目前共一百三十二種；前述 counts 保留為歷史。海洋骨骼表面包含腦珊瑚（braincoral，蜿蜒迷宮狀圓潤隆脊與脊間暗色谷地）、星珊瑚（starcoral，各自分明的珊瑚杯與環繞下陷口部的放射狀隔片）及海綿（seasponge，多尺度通道與不規則相連的多孔骨架）。三者結構各異，不是火山渣、浮石、泡棉或彼此的換色或縮放。皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps、physical repeat sampling、呼叫者 ownership 與 size／seed options。凹凸僅為表面 shading／normal map 效果，不建立真實珊瑚或海綿 geometry、孔洞、活體珊瑚蟲 geometry、alpha、displacement、次表面散射（SSS）或水下光學／模擬／行為。前一百二十九種四份 maps 輸出須逐位元組保持不變，公開 options、借用 maps 的生命週期、backend 與零新增依賴契約不變；實際驗證另記 ACCEPTANCE。沿既有授權逐功能獨立 commit、不 push。

圖案織物增量追加 houndstooth／tartan／damask（千鳥格／蘇格蘭格紋／花卉提花），目前共一百三十八種；前述 counts 保留為歷史。千鳥格為黑／象牙白斷格與源於斜紋交織的階梯狀齒形，不是普通棋盤格；蘇格蘭格紋為暖色柔和的寬細交叉條帶與可見的紗線交織，不是平鋪磁磚；花卉提花為織紋底布上的成對對稱花葉與花瓣圖案，呈現隆起的提花浮雕。三者圖案形態各異，不是 fabric、herringbone、tweed 或 seersucker 的換色或縮放，皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0。沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps、physical repeat sampling、呼叫者 ownership 與不變的 size／seed options；僅為表面 shading／normal map 效果，不建立真實纖維、geometry、alpha、displacement、各向異性、新 BRDF 能力或布料模擬。前一百三十五種四份 maps 輸出須逐位元組保持不變，公開 options、借用 maps 的生命週期、backend 與零新增依賴契約不變；實際驗證另記 ACCEPTANCE。沿既有授權逐功能獨立 commit、不 push。

短毛皮紋增量追加 zebrafur／leopardfur／giraffefur（斑馬短毛皮紋／豹短毛皮紋／長頸鹿短毛皮紋），目前共一百四十四種；前述 counts 保留為歷史。斑馬為蜿蜒、寬窄變化且分岔／匯合的黑／象牙白條紋，不是均勻正弦條帶；豹為環繞暖色中心的不規則斷續深色玫瑰斑，不是實心圓點或石材換色；長頸鹿為由相連淡色網絡分隔的不規則角狀棕色斑塊，不是矩形磚塊／磁磚格。各自的顏料圖案結合細密短纖維的定向淺起伏與粗糙度，顏料邊界不形成隆起甲片或深裂縫。三者皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，僅沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps、physical repeat sampling、呼叫者 ownership 與不變的 size／seed options。這些僅為淺層表面 shading／normal map 效果，不建立真實毛髮 geometry、alpha、displacement、各向異性 BRDF 或動物模擬。前一百四十一種四份 maps 輸出須逐位元組保持不變，公開 options、借用 maps 的生命週期、backend 與零新增依賴契約不變；實際驗證另記 ACCEPTANCE。沿既有授權逐功能獨立 commit、不 push。

貝殼表面增量追加 scallopshell／oystershell／nautilusshell（扇貝殼／牡蠣殼／鸚鵡螺殼），目前共一百五十三種；前述 counts 保留為歷史。扇貝殼呈現暖奶油／粉紅色扇形殼面、向外發散的放射肋與交錯的細微生長環，不是星珊瑚換色；牡蠣殼呈現粗糙灰／奶油色鈣化表面、不規則重疊生長薄層、翹起層唇與下切陰影，不是規則波紋或層疊紙換色；鸚鵡螺殼呈現奶油／赤褐色盤捲殼面、彎曲螺旋生長紋與腔室／條帶分區，不是同心木材年輪或普通圓點。三者形態各異，皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，僅沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps、physical repeat sampling、呼叫者 ownership 與不變的 size／seed options。這些僅為風格化殼面 shading／normal map 效果，不建立 geometry、displacement、透明、transmission、次表面散射（SSS）、虹彩或動物模擬。前一百五十種四份 maps 輸出須逐位元組保持不變，公開 options、借用 maps 的生命週期、backend 與零新增依賴契約不變；實際驗證另記 ACCEPTANCE。沿既有授權逐功能獨立 commit、不 push。

水果表皮增量追加 cantaloupe／dragonfruit／kiwiskin（網紋瓜皮／火龍果皮／奇異果皮），目前共一百六十二種；前述 counts 保留為歷史。網紋瓜皮為柔和綠／赭色瓜皮上的棕褐色隆起、不規則相連曲線網紋，不是六角蜂巢壁或長頸鹿顏料網絡換色；火龍果皮為飽和玫瑰紅／洋紅蠟質表皮、錯列漸尖苞片朝尖端過渡至黃綠色，帶淺層翹起尖端與搭接陰影，不是規則三角形或松果換色；奇異果皮為棕色果皮上方向多變的密集細短毛痕與小毛囊凹點，不是粗長縱向椰纖維或垂直斑馬毛紋換色。三者皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，僅沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps 與 physical repeat defaults。僅為表面 shading／normal map 效果，不建立 alpha、geometry、displacement、真實毛髮 geometry、transmission、次表面散射（SSS）、模擬或新 BRDF 能力。前一百五十九種四份 maps 輸出須逐位元組保持不變；公開 size／seed／contrast／roughnessBias／repeats options、呼叫者 ownership、借用 maps 的生命週期、backend 與零新增依賴契約不變。實際驗證另記 ACCEPTANCE，不在本段宣稱驗收。

花瓣表面增量追加 rosepetal／lilypetal／fritillarypetal（玫瑰花瓣／百合花瓣／棋盤貝母花瓣），目前共一百六十八種；前述 counts 保留為歷史。玫瑰為酒紅至玫瑰紅色的柔和流動摺紋，疊加密集細小隆起乳突與高粗糙度的絲絨感微紋，不是布料織紋、毛髮或凹孔；百合為奶油／象牙白至暖黃色的細縱肋、淺摺紋與不規則細長紅褐色顏料斑點，較玫瑰平滑的緞面粗糙度，斑點不是凹洞；棋盤貝母為紫／奶油色沿兩軸交替的棋盤顏料、柔和游移格界與細縱紋，淺肋起伏獨立於色格，不是磁磚填縫或織物。三者皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 metallic factor 均為 0，僅沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps 與 physical repeat defaults；各 scalar fields 在週期接縫與內部支撐交界須保持 C1。僅為表面 shading／normal map 效果，不建立花朵 geometry、alpha、displacement、transmission、次表面散射（SSS）、模擬或新 BRDF 能力。前一百六十五種四份 maps 輸出須逐位元組保持不變；公開 size／seed／contrast／roughnessBias／repeats options、呼叫者 ownership、借用 maps 的生命週期、backend 與零新增依賴契約不變。沿既有授權逐功能獨立 commit、不 push；實際驗證另記 ACCEPTANCE，不在本段宣稱驗收。

堅果殼表面增量追加 walnutshell／peanutshell／almondshell（核桃殼／花生殼／杏仁殼），目前共一百七十四種；前述 counts 保留為歷史。核桃殼為不規則蜿蜒分岔的粗隆脊與深棕色凹谷，不是規則網格或珊瑚／石材換色；花生殼為淡稻草／棕褐色網紋，較強縱肋與次要橫向連結圍成不規則細長網格，不做織物上下穿插；杏仁殼為淺黃褐色殼面、零散細長凹孔與細微定向紋理，凹孔須具有負向起伏與 occlusion，不是純顏料斑點或隆起珠粒。三者皆為 opaque dielectric，metallic B 通道與預設 factor 為 0，沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps 與 physical repeat；建議 tileSize 分別為 0.06／0.04／0.035 m。僅為表面 shading／normal map 效果，不建立完整堅果 geometry、displacement、cutout、半透明、transmission、次表面散射（SSS）或新 BRDF。前一百七十一種 presets 與四份 maps 輸出須保持不變；公開 options、ownership、生命週期、backend 與零新增依賴契約不變。實際驗證另記 ACCEPTANCE，不在本段宣稱驗收。

樹皮表面增量追加 birchbark／palmtrunk／sycamorebark（白樺樹皮／棕櫚樹幹／懸鈴木樹皮），目前共一百八十種；前述 counts 保留為歷史。白樺為淺色紙質樹皮、短而不規則的深色橫向皮孔與淺紙層接縫，皮孔具有淺凹與 occlusion，不是縱向木紋；棕櫚為乾燥棕褐色纖維表面、不等距橫向葉痕環、凹陷葉痕與隆起肩部，細縱纖維為次要紋理，不是竹節換色；懸鈴木為奶油／橄欖灰色多層次寬大不規則剝落斑塊與淺剝落邊緣，不是深填縫石塊或剝漆換色。三者皆為 opaque dielectric，metallic B 通道與預設 factor 為 0，沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps 與 physical repeat；各 scalar fields 在週期接縫、局部支撐與內部 cell 交界須保持 C1。僅為表面 shading／normal map 效果，不新增 geometry、displacement、alpha、transmission、次表面散射（SSS）、renderer／BRDF 或依賴。前一百七十七種 presets 與四份 maps 輸出須逐位元組保持不變；公開 size／seed／contrast／roughnessBias／repeats options、呼叫者 ownership、借用 maps 的生命週期與 backend 契約不變。實際驗證另記 ACCEPTANCE，不在本段宣稱驗收。

動物皮膚表面增量追加 elephanthide／ostrichleather／sharkskin（象皮／鴕鳥皮革／鯊魚皮），目前共一百八十六種；前述 counts 與段落保留為歷史。象皮為霧面灰色皮膚、粗大蜿蜒交錯的凹陷皺褶、圓潤肩部與次要細摺紋，不是一般皮革凸粒或鱷魚方形鱗板；鴕鳥皮革為暖棕褐色皮革、稀疏不規則的凹陷羽管毛囊與外圍低矮隆起圓環，細卵石底紋為次要紋理，不是杏仁凹孔或顏料圓點；鯊魚皮為灰藍色細密定向微小盾鱗，沿流向逐漸收尖，每片有兩至三條細縱脊與淺搭接陰影，不是大型圓潤魚鱗或單脊蛇皮菱形。三者皆為 opaque dielectric，metallic B 通道與預設 factor 為 0，沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps 與 physical repeat。僅為表面 shading／normal map 效果，不新增 geometry、displacement、透明度、transmission、次表面散射（SSS）、anisotropic BRDF、renderer 路徑或依賴。前一百八十三種 presets 與 maps 輸出須逐位元組保持不變；公開 size／seed／contrast／roughnessBias／repeats options、呼叫者 ownership、借用 maps 的生命週期與 backend 契約不變。實際驗證另記 ACCEPTANCE，不在本段宣稱驗收。

市政表面增量追加 tactilepaving／roadmarking／draincover（警示導盲磚／道路標線／排水蓋），目前共一百九十二種；前述 counts 與段落保留為歷史。警示導盲磚為柔和安全黃色水泥／陶瓷磚、凹陷磚縫、規整平頂截錐警示凸點與圓潤肩部，細顆粒為次要紋理，區別於圓釘橡膠換色；道路標線為深色顆粒瀝青上的寬幅磨損米白漆帶，連貫局部掉漆露出底層，漆面略微隆起且較平滑、邊緣圓潤；排水蓋為矩形鑄鐵框、平行長條圓端槽、隆起柵條與橫向支撐，帶鑄造顆粒及磨圓肩部，槽底是不透明暗色凹陷而非實際開孔。前兩者皆為 opaque dielectric，metallic B 通道與預設 factor 為 0；排水蓋預設 factor 為 1，完整金屬框／柵條／支撐 B 為 1，不透明凹槽底面與外部 B 為 0，圓潤肩部平滑過渡。沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps 與 physical repeat，scalar fields 在週期接縫、內部交界、中心與局部支撐邊界須保持有限且 C1。僅為 shading／normal map 效果，不新增實際開孔、geometry、displacement、alpha、renderer／BRDF 或依賴，不提供逆反射、無障礙認證或道路安全合規保證。前一百八十九種 presets 與 maps 須逐位元組保持不變；既有公開 options、repeat、呼叫者 ownership、借用 maps 的生命週期與 backend 契約不變。實際驗證另記 ACCEPTANCE，不在本段宣稱驗收。

真菌表面增量追加 mushroomgills／morel／bracketfungus（菌褶／羊肚菌表面／層孔菌表面），目前共一百九十八種；前述 counts 與段落保留為歷史。菌褶為奶油／棕褐色密集放射狀窄長褶片，搭配起於外側的短菌褶與平靜附著區，不是等長寬扇貝肋；羊肚菌為暖赭／棕色不規則細長凹陷腔室、暗色碗底與狹窄圓潤相連隆脊，不是規則六角蜂巢或正向珊瑚迷宮；層孔菌為奶油／鏽紅／棕色重疊薄扇面、沿波狀分葉前緣的寬幅多色同心帶、淡色平滑外緣與細絲絨感顆粒，不是厚重牡蠣層唇或完整巢套瑪瑙環。三者皆為 opaque dielectric，metallic B 通道與預設 factor 為 0，沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps 與 physical repeat；scalar fields 在週期接縫、中心、角度切線、ownership 與實際局部支撐邊界須保持有限且 C1，前方不透明層須遮住下層邊緣與 AO。僅為平坦表面的 shading／normal map 近似，不新增 geometry、displacement、alpha、次表面散射（SSS）、transmission、生物生長模擬或 BRDF。前一百九十五種 presets 與四份 maps 輸出須逐位元組保持不變；公開 options、repeat、呼叫者 ownership、借用 maps 的生命週期、backend 與零新增依賴契約不變。本段僅定義範圍，不宣稱 runtime 驗收。

果皮表面增量追加 pineapple／strawberry／lychee（鳳梨皮／草莓皮／荔枝皮），目前共二百零四種；前述 counts 與段落保留為歷史。鳳梨皮為金黃／橄欖色菱形多邊形果目、斜向交錯排列、狹窄棕綠色凹縫與圓潤冠部內的小凹陷中央果眼，不是松果搭接木質鱗片；草莓皮為紅色表皮、不規則交錯的細長凹陷種子窩與窩內小型赭黃色種子，不是橘皮圓形油腺或芝麻正向凸粒；荔枝皮為粉紅／紅色密集不規則多邊形凸疣、柔化尖冠與狹窄暗色凹裂縫，不是圓形毛囊或鳳梨規整大果目。三者皆為 opaque dielectric，metallic B 通道與預設 factor 為 0，沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps 與 physical repeat。僅為 shading／normal map 效果，不新增 geometry、displacement、透明度、次表面散射（SSS）、transmission、BRDF 或依賴。前二百零一種 presets 與四份 maps 須逐位元組保持不變；既有 options、repeat、呼叫者 ownership 與借用 maps 的生命週期不變。本段僅定義範圍，不宣稱 runtime 驗收。

榻榻米增量追加 `tatami`，由目前實際目錄 303 種增為 304 種；既有段落 counts 保留為歷史。呈現黃綠色藺草凸脊、凹陷間隙、交替上下穿越草莖的橫向綁線與縱向纖維。沿用 seeded periodic 四圖、opaque dielectric、physical repeats 與 ownership；一張 UV tile 對應 0.16 m，不新增 geometry、透明孔洞或物理模擬。既有 303 種輸出保持不變，依本輪授權逐功能 commit、不 push；實際驗證見 ACCEPTANCE。

2026-10-23 持續材質擴充追加 `flutedwood`（直槽木飾板）：圓潤縱向木條、深色凹槽與沿木紋纖維。以實際 data 目錄 358 種為基準增為 359 種；前述 counts 保留歷史。沿用 seeded periodic 四圖、opaque dielectric、0.32 m tile、既有 options／ownership，不新增 geometry 或 shader。依使用者要求逐功能驗證、獨立 commit，直到使用者停止；不 push。

同輪再追加 `subwaytiles`（倒角長方磚），實際目錄 359→360 種：青綠色平整釉面、錯縫排列、圓滑倒角與粗糙凹陷填縫。0.6 m tile 為兩欄四列；沿用 opaque dielectric 四圖與 caller ownership，不新增 geometry、位移或 renderer 功能。依使用者要求獨立驗證並提交，不 push。

同輪追加 `canewebbing`（八角孔藤編），實際目錄 360→361 種：縱橫寬藤條與雙向斜細藤交織、八角深色凹槽及細纖維。0.24 m tile 為八乘八單元；仍為 opaque dielectric 四圖、非透明網孔或 geometry。沿用 public options／ownership；逐功能驗證、提交、不 push。

同輪追加 `rammedearth`（夯土牆），實際目錄 361→362 種：寬幅土色壓實層、輕微起伏接縫、細砂粒與凹孔，非砂岩換色。每張 2 m tile 八層；四圖維持 opaque dielectric、metallic 0，不新增位移／geometry 或資源生命週期。依使用者授權逐功能驗證、提交、不 push。

同輪追加 `copperpatina`（銅綠氧化銅），實際目錄 362→363 種：裸銅與青綠氧化斑塊共享覆蓋場，metallic／roughness 隨氧化程度連續變化。tile 0.5 m，預設 material metallic factor 1 以保留 map 的混合金屬度；不新增 geometry、shader、options 或資源所有權契約，逐功能驗證並提交、不 push。

同輪追加 `birdseyemaple`（鳥眼楓木），實際目錄 363→364 種：分散眼狀紋理、橢圓細環與繞行縱紋，保持平整飾面的淺起伏而非凸起木節。0.24 m tile、四圖 opaque dielectric、metallic 0，沿用 options／ownership；逐功能驗證並提交、不 push。

同輪追加 `breezeblock`（四葉花孔水泥花磚），實際目錄 364→365 種：四葉圓孔外觀、厚水泥框與細填縫，孔內為不透明暗凹槽而非穿透孔。每張 0.8 m tile 四乘四單元，四圖 opaque dielectric／metallic 0；沿用既有 options、資源生命週期與 renderer 路徑，逐功能驗證並提交、不 push。

同輪追加 `basketweavepavers`（籃編排列鋪路磚），實際目錄 365→366 種：兩塊長方黏土磚組成方形單元，相鄰單元交替轉向，含平滑倒角、凹填縫與逐磚色差。0.8 m tile 含四乘四單元、32 塊磚；四圖 opaque dielectric／metallic 0，沿用 options、生命週期及 renderer，逐功能驗證提交、不 push。

同輪追加 `ripstop`（雙線補強防撕裂尼龍布），實際目錄 366→367 種：細織紋與成對補強線構成不同尺度的格紋，0.04 m tile 有四乘四補強格。四圖 opaque dielectric／metallic 0，只描述表面外觀、不新增抗撕裂物理；沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `octagondot`（八角菱形拼磚），實際目錄 367→368 種：白色八角主磚與深色菱形嵌磚等高，配有倒角及連續粗糙填縫。0.8 m tile 含四乘四主磚；四圖 opaque dielectric／metallic 0，沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `truchettiles`（Truchet 雙弧線花磚），實際目錄 368→369 種：每塊釉面方磚依 seed 旋轉兩條四分之一圓弧，邊中點對接形成曲線拼圖；色釉不額外隆起。0.8 m tile 含四乘四方磚，四圖 opaque dielectric／metallic 0；沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `standingseam`（立縫金屬屋面），實際目錄 369→370 種：寬平金屬板、窄立縫頂蓋、平滑肩部與兩側凹腳，區別於連續波浪形浪板。2 m tile 含四片板，四圖 opaque、metallic map 與 factor 均為 1，代表無塗漆金屬；沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `damascus`（大馬士革鋼），實際目錄 370→371 種：細密層疊蝕刻紋與局部眼狀折紋，較暗蝕刻層較粗糙、略低，並非厚浮雕或岩石晶粒。0.12 m tile、四圖 opaque、metallic map 與 factor 均為 1；沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `windmillpavers`（風車拼鋪路磚），實際目錄 371→372 種：四片二比一長磚圍繞等高深色方磚，以平滑倒角與凹填縫構成風車排列。0.9 m tile 含四組風車、20 塊磚，四圖 opaque dielectric；沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `castiron`（粗鑄鐵），實際目錄 372→373 種：細顆粒鑄造肌理與少量 seeded 凹孔，凹孔較暗、粗糙且低於基面，區別於大面積重疊槌印。0.1 m tile、四圖 opaque、metallic map 與 factor 均為 1，代表未上漆未氧化的粗鑄金屬；沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `porphyry`（拋光斑岩），實際目錄 373→374 種：紫紅細粒基質與 seeded 淺色長石斑晶，斑晶具旋轉長矩形外形、較低粗糙度並與基面齊平，並非凸起碎石。0.3 m tile、四圖 opaque dielectric；沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `linen`（竹節亞麻布），實際目錄 374→375 種：經緯紗線沿長度自然變粗變細，平滑交替覆蓋形成平織，交織點高於不透明紗隙。0.04 m tile 含 16×16 經緯交點，四圖 opaque dielectric；沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `chippedenamel`（缺角琺瑯），實際目錄 375→376 種：光滑象牙白非金屬釉層與缺角下較暗、粗糙的金屬基材，metallic map 同步分離覆蓋與裸露區域，脆性缺口不產生油漆捲邊。0.25 m tile、四圖 opaque、預設 metallic factor 1；沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `perforatedleather`（透氣孔座椅皮革），實際目錄 376→377 種：棕褐細粒皮面與 8×8 錯列圓孔，圓潤孔壁降至深色粗糙不透明內襯，沒有鴕鳥皮毛囊的隆起環。0.04 m tile、四圖 opaque dielectric；沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `argyle`（Argyle 菱格布），實際目錄 377→378 種：交替酒紅／玫瑰菱形色塊與穿越菱形中心的細斜線，獨立平織紗線肌理不隨印花隆起。0.16 m tile、四圖 opaque dielectric；沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `chevronparquet`（Chevron 斜接木地板），實際目錄 378→379 種：兩列相反 45° 木板斜接形成 V 字，沿板長木紋與逐板 seeded 色差、平滑倒角和凹接縫，區別於原有籃編拼花。0.6 m tile、四圖 opaque dielectric；沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `ginkgoleaf`（金黃銀杏葉），實際目錄 379→380 種：seeded 朝向與色差的金黃扇形葉片、中央缺口、細葉柄和放射葉脈，葉間為深色不透明底層。0.24 m tile、四圖 opaque dielectric；沿用 options、生命週期與 renderer，逐功能驗證提交、不 push，不新增植被 geometry 或透光模型。

同輪追加 `pressedtin`（壓花錫板），實際目錄 380→381 種：規則方框、四瓣花飾與中央凸鈕高於平坦金屬板面，seeded 細粒飾面，區別於錘痕或旋磨紋。0.6 m tile、四圖 opaque、metallic map 與預設 factor 均為 1；沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `sashiko`（靛藍刺子繡布），實際目錄 381→382 種：深靛藍織布上以 seeded 行列相位交替排列凸起的米白針腳，針腳間保留底布，不是印花或連續補強線。0.064 m tile、四圖 opaque dielectric；沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `ashlar`（模組拼砌石材），實際目錄 382→383 種：十一塊不同長寬的矩形石塊形成 T 字接縫，逐塊 seeded 色差與細礦物顆粒、平滑倒角及凹縫，區別於等尺寸錯縫磚。1.2 m tile、四圖 opaque dielectric；沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `gabion`（鋼網石籠），實際目錄 383→384 種：方格鋼線網覆蓋 seeded 朝向、大小及色差的圓石，鋼線位於石冠前方，網內為非金屬石材及不透明深色底層。0.4 m tile、四圖 opaque、metallic map 分區且預設 factor 1；沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `gingham`（藍白織紋格布），實際目錄 384→385 種：等寬藍白經緯色帶以平織交替露出上層紗，形成亮、深及混色三類方格；色塊不另抬升為方磚。0.08 m tile、四圖 opaque dielectric；沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `mossypavers`（苔蘚鋪路石），實際目錄 385→386 種：灰色倒角方石與接縫內局部生長的綠色苔蘚，苔蘚冠高於裸露接縫、低於石面且更粗糙，並非把整面石材染綠。0.8 m tile、四圖 opaque dielectric；沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `bamboocrosscut`（竹筒橫切面），實際目錄 386→387 種：seeded 直徑與壁厚的環狀淡色竹壁、深色中空底層、細孔及較平滑外皮；不使用木材年輪。0.24 m tile、四圖 opaque dielectric；中空不是可穿透 geometry，沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `moire`（水波紋絲緞），實際目錄 387→388 種：紫色布面的低頻水波調制色澤與 roughness，細紗決定 height／AO，不把大波紋做成浮雕。0.08 m tile、四圖 opaque dielectric；不新增繞射、視角相關變色或 anisotropic BRDF，沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `oakleaf`（圓裂橡樹葉），實際目錄 388→389 種：seeded 旋轉及色差的綠色長葉片，具成對圓裂、深缺刻、中肋、分枝葉脈及短葉柄，區別於扇形銀杏葉。0.3 m tile、四圖 opaque dielectric；葉間維持深色不透明底層，沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `rhombille`（三向菱形拼磚），實際目錄 389→390 種：三種明暗的四邊菱形磚組成方塊錯視，磚片同高，只有倒角及中性灰縫凹陷；不將明暗當成立體方塊面。0.9 m tile、四圖 opaque dielectric；沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `fossillimestone`（螺旋化石石灰岩），實際目錄 390→391 種：米褐色拋光石材內的 seeded 橢圓化石切面、淺色螺旋壁與隔板、深色礦物填充腔室；化石與基質共面，不是隆起的完整貝殼。0.6 m tile、四圖 opaque dielectric，沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `seigaihatiles`（藍白青海波花磚），實際目錄 391→392 種：交錯多重象牙白波弧、藍色釉面與 seeded 色差，前列遮蔽後列下方弧線；獨立方磚倒角及中性灰縫，印花不隆起。0.6 m tile、四圖 opaque dielectric，沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `tuftedleather`（菱形拉扣皮革），實際目錄 392→393 種：深棕色菱形鼓包、交叉壓褶、凹下拉扣口袋與包皮圓扣，圓扣介於口袋與墊面最高點之間；seeded 細皮紋與磨耗，不套用 quilting 織線或金屬釘。0.8 m tile、四圖 opaque dielectric，沿用 options、生命週期與 renderer，逐功能驗證提交、不 push。

同輪追加 `louveredmetal`（沖壓百葉金屬板），實際目錄 393→394 種：兩端連接板面的傾斜葉片、較高下緣及下方暗槽，區別於普通波紋或對稱圓管；seeded 細金屬粒紋。0.6 m tile、四圖 opaque、metallic map 與 factor 均為 1，暗槽保留不透明背板，不增加 geometry 或穿孔，逐功能驗證提交、不 push。

同輪追加 `herringbonebrick`（人字拼紅磚），實際目錄 394→395 種：2:1 長磚沿對角帶橫直交錯咬合，T 形接點、倒角、中性灰縫與 seeded 燒製色差；每塊長磚跨越內部格線而沒有假接縫。1.2 m tile、四圖 opaque dielectric，區別於 running-bond 鋪面及織物 herringbone，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `shibori`（靛藍絞染布），實際目錄 395→396 種：深藍底、雙層淡色防染環帶、seeded 不規則暈邊與放射綁染痕跡；染色不改高度，平織 relief 獨立。0.24 m tile、四圖 opaque dielectric，沿用既有借用及銷毀契約，逐功能驗證提交、不 push。

同輪追加 `scallopedslate`（圓尾板岩屋瓦），實際目錄 396→397 種：錯列瓦片的上列圓尾搭接下列、抬高弧形下緣與凹入陰影，seeded 板岩色差、細粒及層理。1.2 m tile、四圖 opaque dielectric，搭接由貼圖表現、不增加 geometry，沿用既有借用及銷毀契約，逐功能驗證提交、不 push。

同輪追加 `saltpan`（多邊形鹽灘結晶殼），實際目錄 397→398 種：seeded 不規則多邊形的低平內部由淡白、較粗糙且隆起的鹽脊包圍，表面細粒與小結晶；不是下凹泥裂或釉面開片。3 m tile、四圖 opaque dielectric，沿用既有借用及銷毀契約，逐功能驗證提交、不 push。

同輪追加 `dogbonepavers`（狗骨形互鎖鋪路磚），實際目錄 398→399 種：混凝土磚的寬端透過窄腰相連，相鄰欄錯半塊磚後寬端填入對方腰部凹口；互補輪廓、平滑肩部、倒角、中性灰縫與 seeded 色差／骨材／細粒。0.8 m tile、四圖 opaque dielectric，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `palmendgrain`（棕櫚木橫切面），實際目錄 399→400 種：淡金棕色基質內的深色維管束平齊切面，成對導管孔局部下凹；seeded 位移、旋轉、長短軸及細粒，不套用年輪或凸起木節。0.024 m tile、四圖 opaque dielectric，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `asanoha`（麻葉紋布料），實際目錄 400→401 種：酒紅底象牙色三角格線及內部三支線連成麻葉幾何圖案；印花與底層平織紋分離，不把染色輪廓變成浮雕。0.12 m tile、四圖 opaque dielectric、seeded 細粒，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `lotusseedpod`（乾燥蓮蓬表面），實際目錄 401→402 種：棕色蓬面內的中央與環列凹室、隆起孔緣、從室底凸出但低於蓬面的較光滑蓮子，seeded 蓬徑／孔位／孔徑與細粒。0.3 m tile、四圖 opaque dielectric，暗部有底、不新增切孔 geometry；沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `crowncaps`（金屬皇冠瓶蓋），實際目錄 402→403 種：平頂、隆起捲邊與下降的二十一道壓褶裙邊，seeded 旋轉壓褶同時改變輪廓與裙邊高度。0.112 m tile、四圖 opaque 金屬，metallic B 255／factor 1、暗部有金屬底、不新增 geometry；沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `cofferedconcrete`（井字混凝土樓板），實際目錄 403→404 種：連續平頂肋梁、平底方形凹室、平滑斜壁與牆角，seeded 骨材、細粒與淺氣孔。2.4 m tile、四圖 opaque dielectric、metallic 0，不新增 geometry；沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `woodworm`（蟲蝕木材），實際目錄 404→405 種：縱向木紋上的有限長彎曲蟲道、兩端更深的圓形出孔、seeded 旋轉與彎曲幅度。0.16 m tile、四圖 opaque dielectric、metallic 0，暗部有底、不新增切孔 geometry；沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `calcadawaves`（葡式黑白波浪石鋪面），實際目錄 405→406 種：二百五十六顆黑／白小石塊排列成波浪帶，整石同色、灰色低接縫與倒角，色帶不改變石面高度或粗糙度。1.28 m tile、四圖 opaque dielectric、metallic 0；沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `ikat`（經紗絣織布），實際目錄 406→407 種：深靛藍底淺色菱形，seeded 經紗對位偏移形成沿紗向重複的毛邊；染紋只改色彩，不改平織表面的高度／粗糙度／AO。0.16 m tile、四圖 opaque dielectric、metallic 0；沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `slottedwood`（圓端開槽木飾板），實際目錄 407→408 種：三十二條有限長膠囊形槽逐列錯開半格，保留槽間完整木橋，槽底較暗／粗糙，縱向木紋只在木面。0.8 m tile、四圖 opaque dielectric、metallic 0，不新增切孔 geometry 或聲學模擬；沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `hollyleaf`（尖刺冬青葉），實際目錄 408→409 種：seeded 旋轉深綠亮葉、三對尖刺葉緣、尖葉端、較低葉柄與凸起主／側脈，凹缺口保留暗色底層。0.24 m tile、四圖 opaque dielectric、metallic 0；與圓裂橡葉區分，不新增植物 geometry 或透明裁切。沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `englishbond`（英式砌磚），實際目錄 409→410 種：四列短端磚與四列兩倍寬長面磚交替，長面磚接縫落在相鄰短端磚中央，四十八塊 seeded 紅棕磚共用一致實際灰縫／倒角寬度。0.8 m tile、四圖 opaque dielectric、metallic 0，不新增砌體 geometry 或結構模擬；沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `rebar`（斜肋鋼筋），實際目錄 410→411 種：四支圓弧鋼筋，每支十二道隆起斜向軋肋，相鄰鋼筋肋紋方向相反，兩側平滑接回較低暗色金屬底。0.12 m tile、四圖 opaque、metallic B 255／材質 factor 1，不新增鋼筋 geometry 或結構模擬；沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `starfruit`（楊桃切片），實際目錄 411→412 種：九片 seeded 旋轉五角切面，金黃外緣包住淺黃果肉，五個放射狀橢圓籽腔較暗／低／粗糙，中央果肉保持平整。0.18 m tile、四圖 opaque dielectric、metallic 0，不新增果肉 geometry、透明度或次表面散射；沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `diamondrustication`（鑽尖石砌飾面），實際目錄 412→413 種：十六塊石材各有四面斜坡、中央尖頂與對角稜線，斜坡底部平滑落到平整石框，再經倒角下降到灰縫。seeded 色差與細粒不掩蓋三層高度。1.6 m tile、四圖 opaque dielectric、metallic 0，不新增石砌 geometry；沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `bargello`（Bargello 火焰針繡），實際目錄 413→414 種：三十二欄長直針腳逐欄錯開四分之一針長，階梯上升／下降形成紫色深淺火焰色帶。每針有圓冠、縱向纖維及低於針面的兩端／側隙；色帶不另外改變針腳高度。0.064 m tile、四圖 opaque dielectric、metallic 0，不新增線材 geometry；沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `saffiano`（Saffiano 十字紋皮革），實際目錄 414→415 種：兩組細斜壓紋在棕色皮面上交叉，壓槽低於／暗於／粗糙於紋間平台，交點與單槽共用相同深度，不疊成雙倍深坑。seeded 微粒保留細壓紋尺度。0.032 m tile、四圖 opaque dielectric、metallic 0，不新增皮革 geometry 或 BRDF；沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `cocoamat`（椰纖門墊），實際目錄 415→416 種：八乘八區域各有四根 seeded 旋轉短彎纖維，跨區域交疊並平滑收束兩端；棕色粗纖維高於／亮於暗底，間隙保留粗糙陰影而非整片實心。0.08 m tile、四圖 opaque dielectric、metallic 0，不新增纖維 geometry；沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `suminagashi`（墨流し紋紙），實際目錄 416→417 種：seeded domain warp 產生蜿蜒套疊的炭黑墨色輪廓，墨區與暖白紙面交替。墨色僅影響顏色與粗糙度；紙面高度來自獨立細粒／纖維，不把墨線刻成石材溝槽。0.24 m tile、四圖 opaque dielectric、metallic 0，不新增流體模擬或紙張 geometry；沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `vermiculite`（膨脹蛭石），實際目錄 417→418 種：交錯排列的三十六顆 seeded 旋轉細長金棕色顆粒有手風琴狀層片，層脊較高／亮／平滑，層隙較低／暗／粗糙；凸層同時擴張顆粒側緣，不只印上條紋。0.06 m tile、四圖 opaque dielectric、metallic 0，不新增礦物 geometry 或膨脹模擬；沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `cairotiles`（Cairo 五邊形鋪磚），實際目錄 418→419 種：三十二塊等形五邊磚以交替鏡射／旋轉鋪滿平面，每塊兩個直角、三個 120 度角，形成四向及三向接縫；五邊皆有等寬灰縫與平滑倒角，不以方磚印上假五邊紋。0.8 m tile、四圖 opaque dielectric、metallic 0，不新增鋪磚 geometry；沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `guilloche`（Guilloché 花紋雕刻金屬），實際目錄 419→420 種：四組 seeded 旋轉、三圈套疊的閉合八瓣刻線，刻槽低於／暗於／粗糙於銀色金屬平面，中心與外圍保持完整金屬。0.1 m tile、四圖 opaque，整張 metallic B=255、factory factor 1；不是圓盤磨紋或凸起壓花，不新增刻線 geometry；沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `seaurchintest`（海膽殼），實際目錄 420→421 種：九枚 seeded 旋轉的象牙色微凸殼面，各有五放射雙孔列、頂端開口及孔列間凸瘤；孔洞比殼面低／暗／粗糙，外緣降至不透明暗底。0.24 m tile、四圖 opaque dielectric、metallic 0，不新增殼體 geometry 或透明孔洞；沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `crystallineglaze`（結晶釉陶瓷），實際目錄 421→422 種：藍綠釉面內的十六組 seeded 晶花具有不規則輪廓、放射針晶與生長色帶；晶花只改變顏色／粗糙度，高度由獨立釉面細粒決定，AO 保持平面。0.16 m tile、四圖 opaque dielectric、metallic 0；不是霜晶浮雕或晶體 geometry，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `shirring`（抽褶布料），實際目錄 422→423 種：四排橫向彈性縫線收束二十四道細褶，行間褶冠隆起並略微彎移，縫線處壓低且保留四十八段短針腳。0.12 m tile、四圖 opaque dielectric、metallic 0；不是直褶、泡泡紗色條或菱格絎縫，不新增布料 geometry／彈性模擬，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `sunburstveneer`（日芒拼花木皮），實際目錄 423→424 種：四組圓形拼花各有十二片扇形木皮，木紋沿各片放射方向延伸，中央木塞與外側深色木板嵌平，只有窄拼接縫下凹。0.8 m tile、四圖 opaque dielectric、metallic 0；不是端面年輪或抬高圓盤，不新增木片 geometry，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `rakedgravel`（枯山水耙紋礫石），實際目錄 424→425 種：八道平行耙溝具有平底、圓滑溝肩與隆起溝岸，溝底及岸面都保留 seeded 細礫石的獨立凸面與暗隙。0.8 m tile、四圖 opaque dielectric、metallic 0；不是細砂正弦波紋，不新增石粒 geometry 或耙動模擬，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `flintwall`（燧石砌牆），實際目錄 425→426 種：六乘六交錯排列的 seeded 角狀燧石，深灰敲裂石心帶有淺弧形斷口紋，外圈保留較粗糙的淺色白堊皮，灰漿縫低於石面。1.2 m tile、四圖 opaque dielectric、metallic 0；不是圓頂鵝卵石或均勻礦物角礫，不新增砌石 geometry，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `frenchknots`（法式結粒刺繡），實際目錄 426→427 種：米色織布上六乘六粉紅色結粒，每個 seeded 小結以雙圈略不規則的繞線凸紋包住閉合中央凹點，細織紋保留在結粒之間。0.06 m tile、四圖 opaque dielectric、metallic 0；不是長緞繡針腳或沿紗線連續的圈圈紗，不新增刺繡 geometry／針線模擬，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `artichoke`（朝鮮薊苞片），實際目錄 427→428 種：六乘六交錯覆疊的綠色苞片從寬根部漸縮成抬起的尖端，帶中央主脈、三對斜向細葉脈及 seeded 葉片色調／微粒，覆疊邊緣保留陰影。0.18 m tile、四圖 opaque dielectric、metallic 0；不是木質松果的平截鱗片或果皮上稀疏的火龍果突片，不新增葉片 geometry，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `splitlockwashers`（開口彈簧墊圈），實際目錄 428→429 種：四乘四 seeded 旋轉金屬環具有完整缺口、沿圈漸升的螺旋表面及高低分離的切口兩端，內外圓緣帶窄倒角；中心孔、缺口與外側露出同一不透明鋼板底面。0.08 m tile、四圖 opaque、metallic 1；不是閉合鎖子甲環或帶齒實心瓶蓋，不新增墊圈 geometry／透明孔洞／彈簧模擬，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `flemishbond`（佛蘭德式磚砌），實際目錄 429→430 種：十六層磚列，每層四組深色短磚頭與雙寬長磚面交替，上下層短磚頭對齊長磚面中心，共一百二十八塊磚；灰縫與倒角不隨磚寬改變實體尺寸。1.2 m tile、四圖 opaque dielectric、metallic 0；不是英式每層只用單一朝向的磚列，短磚頭／長磚面色差不改變嵌平高度，不新增砌磚 geometry，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `satinweave`（五枚經面緞紋），實際目錄 430→431 種：二十五乘二十五經緯交叉點採四跨一壓的經面組織，孤立緯線交織點逐列錯開兩根線；長經浮線與緯線露點交換上下層高度／粗糙度，seed 提供細纖維相位與微粒。0.02 m tile、四圖 opaque dielectric、metallic 0；不是一上一下平紋或連續斜紋，不新增布料 geometry／各向異性 BRDF，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `lotusroot`（蓮藕切面），實際目錄 431→432 種：三乘三淡色圓切面、薄褐色外皮，八個放射狀長橢圓氣孔與中央小孔低於嵌平肉質，seed 控制各切面的旋轉與氣孔長短軸。0.24 m tile、四圖 opaque dielectric、metallic 0；氣孔內為低暗底面，無蓮蓬種子／隆起孔環，不新增透明孔洞或切面 geometry，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `cardboardedge`（瓦楞紙板切邊），實際目錄 432→433 種：六層紙板切面，各四個波浪芯紙週期連接上下平面紙層，seed 決定逐層相位與紙漿細紋；紙邊嵌平，中空腔低暗。0.024 m tile、四圖 opaque dielectric、metallic 0；與既有瓦楞正面不同，不新增紙板 geometry／透明中空模型，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `hexnuts`（六角螺帽），實際目錄 433→434 種：四乘四 seeded 旋轉六角金屬面，六條直外緣與伸出的角部保留倒角，圓形凹孔具有獨立圓弧倒角，頂面附細密同心加工紋。0.08 m tile、四圖 opaque、metallic 通道與 factory factor 均為 1；孔底與外側使用同一低鋼板底面，不新增螺帽 geometry／alpha holes／實際螺旋牙，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `orbicularjasper`（球紋碧玉），實際目錄 434→435 種：綠色基質中二十五個獨立球紋，seed 決定中心偏移、半徑及三／四層淺色礦物環。各球紋嵌於拋光平面，只改變色調與細微粗糙度，不產生環狀凸起或晶洞陰影。0.12 m tile、四圖 opaque dielectric、metallic 0；與連通礦物色帶／晶簇不同，不新增礦石 geometry，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `acornbarnacles`（橡實藤壺殼），實際目錄 435→436 種：四乘四 seeded 旋轉殼體、六片放射殼板與細密縱肋，殼壁向中央收高，菱形開口低於殼緣；不是海膽的五列雙孔或珊瑚圓形隔板孔。0.12 m tile、四圖 opaque dielectric、metallic 0；孔底與殼外為低暗底面，不新增藤壺 geometry／alpha holes／生物動畫，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `circularpavers`（同心環狀鋪石），實際目錄 436→437 種：二乘二圓形拼花，各含中心圓石與四圈 8／16／24／32 塊楔形鋪石，共三百二十四塊；交替環圈偏移半個角扇區，seed 決定旋轉及各石色調。徑向／環向灰縫與倒角使用一致實體寬度。1.6 m tile、四圖 opaque dielectric、metallic 0；不是單一圓形小磁磚，不新增鋪石 geometry，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `snowflaketiles`（雪花陶磚），實際目錄 437→438 種：四乘四藍釉方磚，各有 seeded 旋轉的六向雪花，每臂兩對斜分枝。白色釉面圖案只影響色調與粗糙度，磚面嵌平、方形灰縫凹陷。0.8 m tile、四圖 opaque dielectric、metallic 0；不新增雪晶 geometry／透明效果，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `sawblades`（圓鋸片），實際目錄 438→439 種：四乘四 seeded 旋轉薄金屬片，各有二十四枚長背／短前緣的非對稱齒、凹入齒谷與中央圓形軸孔，平整片面附細密同心加工紋。0.8 m tile、四圖 opaque、全 metallic 通道及 factory factor 1；孔底與片外為同一低金屬底板，不新增鋸片 geometry／透明孔洞／旋轉動畫，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `pistachios`（開口開心果），實際目錄 439→440 種：五乘五 seeded 旋轉長橢圓果殼，淡色雙瓣殼緣高於綠色果仁，果仁兩側有更低的暗隙，殼面具細長纖維；不同於既有核桃／花生／杏仁的連續殼面紋理。0.15 m tile、四圖 opaque dielectric、metallic 0；不新增果殼 geometry／透明開口，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `polkadotfabric`（圓點印花布），實際目錄 440→441 種：藍色平織底布上六乘六米白圓點，相鄰列錯開半格，seed 控制印花平移與微粒。圓點只改變色調與粗糙度，不改變底布九十六經緯線的高度及 AO。0.12 m tile、四圖 opaque dielectric、metallic 0；不新增珠點 geometry／透明網孔，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `cucumberslices`（小黃瓜切片），實際目錄 441→442 種：三乘三 seeded 旋轉圓切片，深綠外皮包圍淡色果肉，三組放射狀膠質種子腔各含三顆長籽。皮緣、果肉、膠質與籽維持同一平齊切面，色調與粗糙度差不形成空氣孔洞或凸籽。0.18 m tile、四圖 opaque dielectric、metallic 0；不新增切片 geometry／透明果肉，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `monsteraleaf`（龜背芋葉），實際目錄 442→443 種：三乘三 seeded 旋轉闊葉，各有六個閉合長孔、六條通向葉緣的裂口、基部凹口、中肋與斜向側脈。內孔與外裂口之間保留葉肉橋，孔底及葉外為同一低暗底面。0.9 m tile、四圖 opaque dielectric、metallic 0；不新增透明孔洞／葉片 geometry／生長動畫，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `crossstitch`（十字繡），實際目錄 443→444 種：八乘八 X 繡針由兩條有限長斜向繡線交疊，上層固定遮住下層，交點不累加高度；保留底布織紋、細線纖維與 seeded 線色。0.08 m tile、四圖 opaque dielectric、metallic 0，不新增繡線 geometry／穿布孔洞，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `staranise`（八角香料），實際目錄 444→445 種：九個 seeded 旋轉八角，各有八個尖端木質果莢、凹腔與較光滑種子。莢壁高於種子、種子高於腔底，放射莢間保留低暗間隙。0.12 m tile、四圖 opaque dielectric、metallic 0，不新增果莢 geometry／透明間隙，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `logcabinparquet`（螺旋拼木地板），實際目錄 445→446 種：四個方形區塊各以八條漸長木條環繞中央方板，合計 36 塊板材；木紋沿長軸、平接端頭與窄凹縫分隔板面，不在內部 lookup cell 邊界產生假接縫。1.2 m tile、四圖 opaque dielectric、metallic 0，不新增板材 geometry，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `countersunkmetal`（沉頭孔金屬板），實際目錄 446→447 種：六乘六深圓孔，具有陡峭內壁、較寬的錐形沉孔及平坦板面；錐面中段保留直線斜率、兩端平滑接合。0.3 m tile、四圖 opaque、metallic B／材質 factor 皆為 1，孔內保留低金屬底面；不新增透明孔洞／切削 geometry，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `trilobitefossil`（三葉蟲化石石板），實際目錄 447→448 種：九個 seeded 旋轉低浮雕，具有寬頭甲、成對眼部、中央軸葉、十對彎曲胸肋及窄尾甲，嵌於較淺石質底面。0.45 m tile、四圖 opaque dielectric、metallic 0，不新增化石 geometry／特定物種科學復原，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `eyeletcotton`（鏤空刺繡棉布），實際目錄 448→449 種：六乘六暗圓孔、連續凸起繡邊與每孔十六個 seeded 放射狀針腳，繡邊谷部仍高於象牙白底布。0.06 m tile、四圖 opaque dielectric、metallic 0，孔內保留低 opaque 底面；不新增透明裁切／線材 geometry，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `dendriticagate`（樹枝狀瑪瑙），實際目錄 449→450 種：九組 seeded 五代二叉分枝礦物包裹體，深色枝條逐漸變細，位於暖淺色拋光石面之下而非凸起葉片。0.15 m tile、四圖 opaque dielectric、metallic 0，不新增礦物 geometry／地質生長模擬，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `ravioli`（義式方餃麵皮），實際目錄 450→451 種：十六個金黃色麵皮包，中央 seeded 微偏移鼓包、扁平封邊、每片二十道叉壓凹槽與微波浪切邊。0.16 m tile、四圖 opaque dielectric、metallic 0，不新增麵皮 geometry／內餡／烹調模擬，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `rollerchain`（滾子鏈側片），實際目錄 451→452 種：四列錯位鏈條，每列六節，束腰鏈片交替高外片／低內片，共用圓銷軸、凹入環槽與微凸鉚釘頭。0.24 m tile、四圖 opaque、全金屬 B／factor 1，保留低暗金屬底面，不新增鏈條 geometry／動畫／傳動物理，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `mapleleaf`（秋色楓葉），實際目錄 452→453 種：九個 seeded 旋轉秋橙色葉片，五裂掌狀輪廓、微齒邊、五條放射葉脈與狹長葉柄；深葉裂露出暗底。0.3 m tile、四圖 opaque dielectric、metallic 0，不新增葉片 geometry／植物物種模擬，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `smocking`（蜂巢抽褶布），實際目錄 453→454 種：藍紫色成對布褶在相鄰列交替收束，三十六道短橫針腳壓住收束點，張開褶冠較高。0.12 m tile、四圖 opaque dielectric、metallic 0，不新增布料模擬／線材 geometry／穿孔，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `quatrefoiltile`（四葉弧形釉面磚），實際目錄 454→455 種：二十五塊青綠四葉弧形磚、深色菱形嵌片、凹角肩及粗糙下凹填縫。0.5 m tile、四圖 opaque dielectric、metallic 0，不新增磚塊 geometry／displacement，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `okraslice`（秋葵切片），實際目錄 455→456 種：九片 seeded 旋轉五稜綠色切片，每片五個凹入種子腔，每腔兩顆淺色圓籽，保留實心中央組織與分隔壁。0.09 m tile、四圖 opaque dielectric、metallic 0，不新增蔬菜 geometry／真實孔洞／食品模擬，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `eggcarton`（模壓紙漿蛋盒），實際目錄 456→457 種：四乘四灰米色紙漿蛋盒，十六個圓形蛋杯低於平坦鞍部，杯壁帶凸起肋環，四杯交會處升起錐頭。0.16 m tile、四圖 opaque dielectric、metallic 0，不新增包裝 geometry／真實孔洞／雞蛋或纖維模擬，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `greekkey`（鎏金希臘回紋），實際目錄 457→458 種：深藍黑陶瓷上九個方形螺旋回紋鉤，鉤向內捲至開放尖端，底線貫穿 cell 邊緣使回紋跨 tile 連續，凸線帶較亮細芯。0.45 m tile、四圖 opaque dielectric、metallic 0，不新增浮雕 geometry／真實黃金或陶瓷模擬，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `seedbeads`（peyote 小米珠），實際目錄 458→459 種：錯開半顆的四十八顆光澤圓柱珠，桶狀拱起剖面、兩端凹入穿線孔、低而粗糙的珠間線隙與依 seed 分布的逐珠色調。0.06 m tile、四圖 opaque dielectric、metallic 0，不新增珠子 geometry／透光／線材模擬，沿用既有契約，逐功能驗證提交、不 push。

同輪追加 `chainstitch`（鏈式針繡），目錄 459→460 種：五條直列金色鏈繡，每列六個上窄下寬的中空線圈相扣，深藍布底與低幅細織紋留在線圈內外。0.12 m tile、opaque dielectric、metallic 0，沿用四圖與選用 height map、options／ownership，不新增紗線 geometry／透明孔洞／布料模擬；逐功能驗證提交、不 push。

同輪追加 `wingnuts`（蝶形螺帽），目錄 460→461 種：十六個交替旋轉 90° 的銀色螺帽，圓形 hub、中央凹孔與向兩側斜伸的隆起扁翼，孔底及外側保留暗色鋼底。0.12 m tile、opaque metal、metallic map／預設 factor 1，沿用四圖與選用 height、options／ownership；不新增螺帽 geometry、透明孔洞、實際螺紋或機械模擬，逐功能驗證提交、不 push。

同輪追加 `pomegranateslice`（石榴切片），目錄 461→462 種：九個帶深紅果皮與乳白中心／隔膜的圓形斷面，各有六個果室，每室七顆分開隆起的紅色橢圓果粒；果室較低、果粒較光滑。0.15 m tile、opaque dielectric、metallic 0，沿用四圖與選用 height／options／ownership，不新增果粒 geometry、透明／transmission／果汁或植物模擬；逐功能驗證提交、不 push。

同輪追加 `pawprinttiles`（爪印釉面磚），目錄 462→463 種：十六片象牙白釉面方磚，各有四個分離橢圓趾墊與下緣三葉掌墊的鈷藍凹印；磚間為粗糙灰縫，印紋比釉面低、比灰縫高。0.6 m tile、opaque dielectric、metallic 0，沿既有四圖／選用 height／options／ownership，不新增磁磚 geometry、實際壓印或動物模擬；逐功能驗證提交、不 push。

同輪追加 `dovetailjoint`（燕尾榫木拼板），目錄 463→464 種：兩條接合線各帶四個外寬內窄的梯形榫舌，直肩、斜邊及平榫端皆為深凹縫；相鄰木板縱橫木紋交替，跨列延續同一片木板色調。0.48 m tile、opaque dielectric、metallic 0，沿既有四圖／選用 height／options／ownership，不新增榫接 geometry 或結構力學模擬；逐功能驗證提交、不 push。

同輪追加 `starsocketbolts`（六瓣星槽螺栓頭），目錄 464→465 種：十六顆圓拱銀色螺栓頭，中央六瓣圓滑星形凹槽，槽底封閉且高於暗鋼底板，相鄰星槽交替轉 30°。0.12 m tile、opaque metal、metallic map／預設 factor 1，沿既有四圖／選用 height／options／ownership，不新增螺栓 geometry、透明孔、真實螺紋或機械模擬；逐功能驗證提交、不 push。

同輪追加 `sanddollar`（沙錢殼），目錄 465→466 種：九片淺奶油色扁橢圓殼，殼面帶五條花瓣狀閉合凹線，花瓣間另有五個徑向狹長 lunule 凹孔；無海膽殼的疣粒與成列小孔。0.3 m tile、opaque dielectric、metallic 0，沿既有四圖／選用 height／options／ownership，lunule 為暗底 shading，不新增殼 geometry、透明穿孔或生物模擬；逐功能驗證提交、不 push。

同輪追加 `brogueleather`（雕花皮革），目錄 466→467 種：暖棕皮面上九朵六瓣橢圓沖孔花飾、中央圓孔與兩側雙排細邊孔，孔內為低而粗糙的不透明暗底，花瓣與邊孔間保留完整皮面。0.18 m tile、opaque dielectric、metallic 0，沿既有四圖／選用 height／options／ownership，不新增皮革 geometry、透明孔洞或皮料模擬；逐功能驗證提交、不 push。

同輪追加 `clovebuds`（丁香乾香料），目錄 467→468 種：十六枚暖褐色乾花蕾，圓蕾頭、四裂細長萼托與窄莖明確分層，相鄰方向轉 90°，間隙為低暗底。0.08 m tile、opaque dielectric、metallic 0，沿既有四圖／選用 height／options／ownership，不新增香料 geometry、生物或食品模擬；逐功能驗證提交、不 push。

同輪追加 `starcrosstiles`（八角星十字磚），目錄 468→469 種：十六片深青色八角星與象牙白十字磚交錯，正方與斜向邊皆有低而粗糙的中性灰縫，凹角與相鄰星尖接點平滑。0.8 m tile、opaque dielectric、metallic 0，沿既有四圖／選用 height／options／ownership，不新增磚 geometry、透明縫或鋪設模擬；逐功能驗證提交、不 push。

同輪追加 `maplesamara`（成對楓翅果），目錄 469→470 種：十六對金褐色 V 形薄翅，外端較寬、根部收窄且各帶隆起的深色種仁，短柄連接兩果，翅間留低暗底；相鄰方向翻轉 180°。0.2 m tile、opaque dielectric、metallic 0，沿既有四圖／選用 height／options／ownership，不新增翅果 geometry、透明薄膜、飛行或生物模擬；逐功能驗證提交、不 push。

同輪追加 `lenoweave`（紗羅織），目錄 470→471 種：六組成對奶油／赭色經線在六條水平緯線之間扭交，經線彼此及穿越緯線的上下次序交替，網眼露出低暗底而非透明。0.06 m tile、opaque dielectric、metallic 0，沿既有四圖／選用 height／options／ownership，不新增紗線 geometry、透明孔或布料模擬；逐功能驗證提交、不 push。

同輪追加 `circlips`（開口止動環），目錄 471→472 種：十六枚銀色 C 形平環，端部兩個圓耳各帶小凹孔，相鄰開口方向翻轉 180°；中央、開口與耳孔皆露低暗鋼底。0.08 m tile、opaque metal、metallic map／預設 factor 1，沿既有四圖／選用 height／options／ownership，不新增止動環 geometry、透明孔、彈性或機械模擬；逐功能驗證提交、不 push。

同輪追加 `tuliptiles`（鬱金香花磚），目錄 472→473 種：十六片象牙白釉面方磚，各帶鈷藍三瓣尖端花冠、細莖與兩片尖葉，圖案略高於釉面，磚間為低粗糙灰縫。0.6 m tile、opaque dielectric、metallic 0，沿既有四圖／選用 height／options／ownership，不新增花卉或磚 geometry、透明縫或植物模擬；逐功能驗證提交、不 push。

同輪追加 `gingerslice`（多瓣薑切片），目錄 473→474 種：十六片四個大小不等連接瓣構成的薑根莖切面，淡黃纖維肉高於較粗糙的薄褐皮，輪廓留凹頸、相鄰方向轉 90°，不是圓形切片或有孔蓮藕。0.2 m tile、opaque dielectric、metallic 0，沿既有四圖／選用 height／options／ownership，不新增根莖 geometry、透明度或食品／植物模擬；逐功能驗證提交、不 push。

同輪追加 `fivebarplate`（五條筋花紋板），目錄 474→475 種：十六組各五條銀色平行圓端凸筋，沿 ±45° 交錯方向排列，筋間與組間保留較粗糙平板；區別既有單菱紋板。0.6 m tile、opaque metal、metallic map／預設 factor 1，沿既有四圖／選用 height／options／ownership，不新增板材 geometry、實際止滑或承載物理；逐功能驗證提交、不 push。

同輪追加 `cinnamonswirl`（肉桂捲切面），目錄 475→476 種：十六個金黃圓麵團切面，連續深褐肉桂螺旋內餡凹於麵團、中心餡核及較深烤色外緣，相鄰轉 180°。0.32 m tile、opaque dielectric、metallic 0，沿既有四圖／選用 height／options／ownership，不新增食品 geometry、透明度或烘焙模擬；逐功能驗證提交、不 push。

同輪追加 `wheatears`（金黃麥穗），目錄 476→477 種：十六支各五對斜向穀粒、粒面縱溝、十根細穗芒與中央穗軸，相鄰轉 180°；不是玉米粒平鋪或葉片。0.24 m tile、opaque dielectric、metallic 0，沿既有四圖／選用 height／options／ownership，不新增植物 geometry、透明度、生長或風場模擬；逐功能驗證提交、不 push。

同輪追加 `scalemail`（鋼製鱗甲），目錄 477→478 種：六列八行交錯金屬鱗片，上排覆下排，中央凸脊、頂端圓鉚釘與捲邊；暗縫是 opaque 鋼底層，區別有機魚鱗與環狀鎖子甲。0.24 m tile、metallic map／預設 factor 1，沿既有四圖／選用 height／options／ownership，不新增甲片 geometry、透明孔洞、碰撞或防護模擬；逐功能驗證提交、不 push。

同輪追加 `trihexagonaltiles`（六邊三角釉面磚），目錄 478→479 種：56 塊藍色六邊磚與 112 塊象牙白三角磚交錯，共用凹陷中性灰縫，六邊磚略高且較平滑。0.84 m tile、opaque dielectric、metallic 0，沿既有四圖／選用 height／options／ownership，不新增磚塊 geometry、碰撞或施工模擬；逐功能驗證提交、不 push。

同輪追加 `burlwood`（瘤木紋），目錄 479→480 種：棕金色扭曲閉合等高木紋，九個偏置橢圓瘤眼帶深色微凹髓心與環紋，區別直木纖維與細密鳥眼楓木。0.24 m tile、opaque dielectric、metallic 0，沿既有四圖／選用 height／options／ownership，不新增木材 geometry、樹種鑑定、年輪測年或生長模擬；逐功能驗證提交、不 push。

同輪追加 `slottedmetal`（圓端長槽金屬板），目錄 480→481 種：八列四行交錯縱向長槽、圓弧端與加工斜壁，底板低幅拉絲，區別圓孔金屬與橫向木質長槽。0.4 m tile、opaque metal、metallic map／預設 factor 1，凹槽保留不透明鋼底；沿既有四圖／選用 height／options／ownership，不新增通孔 geometry、透明度、通風或承載物理；逐功能驗證提交、不 push。

同輪追加 `peppercorns`（黑胡椒粒），目錄 481→482 種：二十五顆暗褐乾果粒，隆起果身、淺皺皮與中央較粗糙凹陷果梗疤；區別丁香的細梗萼片與咖啡豆縱裂。0.08 m tile、opaque dielectric、metallic 0，沿既有四圖／選用 height／options／ownership，不新增果粒 geometry、透明度、食品或植物模擬；逐功能驗證提交、不 push。

同輪追加 `castellatednuts`（六槽城堡螺帽），目錄 482→483 種：4×4 交替旋轉六角螺帽，中央圓孔、六道徑向凹槽與六段隆起冠齒，槽底仍為鋼面、內環連續。0.08 m tile、opaque metallic maps／預設 factor 1，沿四圖／選用 height／ownership；不新增實體螺帽、透明通孔、螺紋或緊固物理，逐功能驗證提交、不 push。

同輪追加 `farfalle`（蝴蝶義大利麵），目錄 483→484 種：4×4 交替直橫金黃麵片，連續收腰、展翼、放射褶痕與波齒端切邊，區別填餡 ravioli 與中空 macaroni。0.16 m tile、opaque dielectric、metallic 0，沿四圖／選用 height／ownership，不新增麵片 geometry、透明度、烹飪或柔體物理；逐功能驗證提交、不 push。

同輪追加 `cardamompods`（綠豆蔻莢），目錄 484→485 種：4×4 交替斜向橄欖綠果莢，雙端收束、隆起果身、縱向稜脊與通向尖端的凹道，短果梗與果身相連；區別丁香梗萼與開口開心果。0.08 m tile、opaque dielectric、metallic 0，沿四圖／選用 height／ownership，不新增果莢 geometry、透明度、開莢或植物／食品模擬；逐功能驗證提交、不 push。

同輪追加 `brickarches`（紅磚半圓拱），目錄 485→486 種：4×4 裝飾拱形，每拱九塊楔磚、放射灰縫、兩側各三層砌磚拱腳與不透明暗色開口底層，區別同心 circularpavers 與平砌磚牆。2.4 m tile、opaque dielectric、metallic 0，沿四圖／選用 height／ownership，不新增建築 geometry、透明門洞、承載或碰撞物理；逐功能驗證提交、不 push。

同輪追加 `knottednet`（打結繩網），目錄 486→487 種：6×6 隆起繩結與弧形鬆垂繩段，結部交疊帶收緊凹痕，暗色網孔底層；區別直線金屬 wiremesh、對角 lace 與錯列 macrame。0.3 m tile、opaque dielectric、metallic 0，沿四圖／選用 height／ownership，不新增繩網 geometry、透明孔洞、受力或布料物理；逐功能驗證提交、不 push。

同輪追加 `fiddleheads`（蕨類捲芽），目錄 487→488 種：4×4 鏡向交替綠色捲芽，逐漸收細的一圈半螺旋芽頭、開放圈間隙與相連彎莖，區別 fernleaf 展開羽葉。0.24 m tile、opaque dielectric、metallic 0，沿四圖／選用 height／ownership，不新增植物 geometry、透明度、生長或枝葉物理；風格化而非植物辨識或寫實掃描，逐功能驗證提交、不 push。

同輪追加 `cowrieshells`（寶螺腹面），目錄 488→489 種：4×4 交替直橫象牙色橢圓殼面、中央狹長凹口與兩側各九條較光滑隆起齒脊；區別扇貝放射肋與鸚鵡螺螺旋外殼。0.2 m tile、opaque dielectric、metallic 0，沿四圖／選用 height／ownership，不新增貝殼 geometry、透明殼口或海洋生物模擬；逐功能驗證提交、不 push。

同輪追加 `cotterpins`（開口銷），目錄 489→490 種：4×4 正反交替鋼製銷，橢圓環眼、分離雙腳與長短不同的外彎尾端；區別圓形 circlips 與六角螺帽。0.12 m tile、opaque metallic maps／預設 factor 1，沿四圖／選用 height／ownership，不新增五金 geometry、透明孔洞、緊固或彎折物理；逐功能驗證提交、不 push。

同輪追加 `seedstitch`（米粒針織），目錄 490→491 種：12×12 灰綠毛線針目，V 形正針與橫向反針凸結沿列與行交錯；區別全 V 形 knit 與扭絞 cableknit。0.12 m tile、opaque dielectric／metallic 0，沿四圖／選用 height／ownership，不新增毛線 geometry、透明度或布料模擬；逐功能驗證提交、不 push。

同輪追加 `mangosteenslice`（山竹切面），目錄 491→492 種：4×4 厚紫紅果皮包覆六瓣乳白果肉，中央相連、瓣間徑向凹縫，相鄰切面交替旋轉 30°；區別 orangeflesh 的橘色汁囊與 pomegranateslice 的紅色籽室。0.32 m tile、opaque dielectric／metallic 0，沿四圖／選用 height／ownership，不新增果實 geometry、透明孔洞或植物學模擬；逐功能驗證提交、不 push。

同輪追加 `pickettiles`（細長六角釉面磚），目錄 492→493 種：青綠尖頂長磚交錯鋪排，六條直邊與平底灰縫，seeded 逐磚色差；區別既有 hexagontiles 的短六角形。0.9 m tile 有 36 磚，扣灰縫／bevel 前標稱 0.1×0.3 m；opaque dielectric／metallic 0，沿四圖／選用 height／ownership，不新增磚 geometry、透明度或建築模擬；逐功能驗證提交、不 push。

同輪追加 `squarewashers`（鋼製方墊圈），目錄 493→494 種：4×4 交替旋轉 45° 的完整方框，四個角、直線倒角外緣與圓形凹陷孔眼；區別 splitlockwashers 的開口螺旋環與 circlips 的開口止動環。0.16 m tile、opaque metallic maps／預設 factor 1，沿四圖／選用 height／ownership，孔眼保留暗色不透明鋼底，不新增墊圈 geometry、透明孔洞、緊固或荷重模擬；逐功能驗證提交、不 push。

同輪追加 `eucalyptusleaf`（尤加利葉），目錄 494→495 種：4×4 灰藍綠狹長葉片，交替傾斜 ±45°，彎曲中肋、尖端、五對斜側脈與相連短葉柄；區別 hollyleaf 的帶刺寬葉與 oakleaf 的分瓣葉緣。0.48 m tile、opaque dielectric／metallic 0，沿四圖／選用 height／ownership，不新增葉片 geometry、透明度、風動或植物學模擬；逐功能驗證提交、不 push。

同輪追加 `twillweave`（二上二下斜紋織物），目錄 495→496 種：16×16 平衡斜紋，淺褐緯線與深棕經線各連續跨兩針，逐列偏移一針形成連續斜向交織；區別 satinweave 的四上一下與 herringbone 的反向人字紋。0.16 m tile、opaque dielectric／metallic 0，沿四圖／選用 height／ownership，不新增毛線 geometry、透明孔隙或布料模擬；逐功能驗證提交、不 push。

同輪追加 `pumpkinseeds`（帶殼南瓜籽），目錄 496→497 種：4×4 乳白尖橢圓籽殼交替 ±45°，隆起外殼邊緣包覆完整且較低的中央殼面；區別 pistachios 的開裂殼與綠色果仁、almondshell 的密集凹孔表面。0.12 m tile、opaque dielectric／metallic 0，沿四圖／選用 height／ownership，不新增種籽 geometry、透明殼、開裂或植物學模擬；逐功能驗證提交、不 push。

同輪追加 `spurgears`（風格化鋼齒輪），目錄 497→498 種：4×4 交替旋轉 15° 的鋼輪，十二個倒角外齒、圓形凹軸孔與隆起輪轂；區別 sawblades 的不對稱鋸齒。0.2 m tile、opaque metallic maps／預設 factor 1，沿四圖／選用 height／ownership，孔／齒隙為暗色不透明鋼底，不新增齒輪 geometry、透明孔洞、漸開線齒形認證或傳動模擬；逐功能驗證提交、不 push。

同輪追加 `diamondcheckertiles`（斜鋪棋盤磚），目錄 498→499 種：32 塊旋轉 45° 的黑／米白正方釉面磚，兩個對角方向都交替深淺色，帶柔化倒角、低陷中性灰縫與 seeded 磚面色差。1.2 m tile、opaque dielectric／metallic 0，沿四圖／選用 height／ownership，不新增鋪磚 geometry、透明度或物理；逐功能驗證提交、不 push。

同輪追加 `appleslice`（蘋果橫切面），目錄 499→500 種：4×4 圓切面交替轉 36°，薄紅褐果皮、淡色果肉與五個含深色籽的獨立凹種室，區別 appleskin 的完整外皮。0.4 m tile、opaque dielectric／metallic 0，沿四圖／選用 height／ownership，不新增果實 geometry、透明種室、切割、汁液或植物學模擬；逐功能驗證提交、不 push。

同輪追加 `paperclips`（鋼製迴紋針），目錄 500→501 種：4×4 交替 ±45° 的銀色線夾，三段線身與兩道嵌套回彎保持連通、兩個線端與內槽保留開口；區別 cotterpins 的單眼與外彎分腳。0.24 m tile、opaque metallic maps／預設 factor 1，沿四圖／選用 height／ownership，槽隙為暗色不透明鋼底，不新增線材 geometry、透明度或夾持模擬；逐功能驗證提交、不 push。

同輪追加 `ivyleaf`（三裂常春藤葉），目錄 501→502 種：4×4 交替 ±45° 的綠葉，三個尖裂片與兩道深缺刻、三條隆起掌狀葉脈及連通短葉柄，區別 mapleleaf 的五裂輪廓。0.32 m tile、opaque dielectric／metallic 0，沿四圖／選用 height／ownership，不新增葉片 geometry、透明度、風動或植物學模擬；逐功能驗證提交、不 push。

同輪追加 `ribknit`（一上一下羅紋針織），目錄 502→503 種：12×12 玫瑰褐針目，較高 V 形正針直列與較低橫向反針直列交替，整列不隨列次換位，區別 seedstitch 的棋盤針目與 corduroy 的連續絨肋。0.12 m tile、opaque dielectric／metallic 0，沿四圖／選用 height／ownership，不新增紗線 geometry、透明孔隙、彈性或布料模擬；逐功能驗證提交、不 push。

同輪追加 `pillowtiles`（枕形釉面磚），目錄 503→504 種：6×6 象牙白圓角方磚，連續凸起的枕面由中央向四邊降低，外角退入中性灰縫，帶 seeded 磚面色差；區別 heattile 的平頂隔熱磚與 glassblock 的泡狀玻璃表面。0.6 m tile、opaque dielectric／metallic 0，沿四圖／選用 height／ownership，不新增磚體 geometry、位移或透明度；逐功能驗證提交、不 push。

同輪追加 `coffeerings`（紙面咖啡杯圈），目錄 504→505 種：3×3 seeded 輕微偏心橢圓乾燥褐圈，濃淡不均的杯底環包圍較淡內部浸染，紙纖維微起伏而非深凹槽。0.36 m tile、opaque dielectric／metallic 0，沿四圖／選用 height／ownership，不新增紙／杯 geometry、透明液體、流體、吸收或乾燥模擬；逐功能驗證提交、不 push。

同輪追加 `cashews`（腰果仁），目錄 505→506 種：4×4 奶油色 C 形厚實果仁，中央與側邊開口連通，兩個圓鈍端部大小不對稱、交替 ±45° 排列並帶 seeded 色差。0.16 m tile、opaque dielectric／metallic 0，沿四圖／選用 height／ownership，不新增果仁 geometry、透明孔洞、散射或食物物理；逐功能驗證提交、不 push。

同輪追加 `hinges`（鋼製鉸鏈），目錄 506→507 種：4×4 雙側圓角固定葉片、六個沉孔、五節凸起軸筒與節縫中較低且連續的銷軸，帶 seeded 拉絲微紋。0.4 m tile、opaque steel／metallic 1，沿四圖／選用 height／ownership，不新增鉸鏈 geometry、透明孔洞、活動關節或剛體物理；逐功能驗證提交、不 push。

同輪追加 `coins`（五角星壓印金色硬幣），目錄 507→508 種：4×4 金色圓幣，凸起圓形邊框包圍較低平面，中央連通五角星浮雕，交替 36° 朝向並帶 seeded 色差。0.12 m tile、opaque metal／metallic 1，沿四圖／選用 height／ownership，不新增硬幣 geometry、文字、透明度、貨幣系統或剛體物理；逐功能驗證提交、不 push。

同輪追加 `righttriangletiles`（直角三角釉面磚），目錄 508→509 種：4×4 方格各分成兩塊直角等腰三角磚，共 32 塊藍灰／乳白 seeded 磚面，斜縫方向逐格交替；外框與斜縫有等法向寬度的灰縫／倒角。1 m tile、opaque dielectric／metallic 0，沿四圖／選用 height／ownership，不新增磚體 geometry、位移或透明度；逐功能驗證提交、不 push。

同輪追加 `cherryblossom`（五瓣櫻花），目錄 509→510 種：4×4 粉色五瓣花，每瓣末端淺缺刻分成兩圓瓣尖，花心較低、十二個淺色凸起花粉點，交替 36° 朝向並帶 seeded 花色／微紋。0.24 m tile、opaque dielectric／metallic 0，沿四圖／選用 height／ownership，不新增花朵 geometry、透明孔洞、植物生長、風動或散射模擬；逐功能驗證提交、不 push。

同輪追加 `punchcard`（打孔資料卡），目錄 510→511 種：2×4 米色薄紙卡、單側上角切角，20×8 矩形孔位每欄兩個不同 seeded 打孔，孔間保留紙橋並帶紙纖維細紋。0.44 m tile、opaque dielectric／metallic 0，沿四圖／選用 height／ownership，孔位回到不透明背襯而非透明鏤空；不新增紙卡 geometry、真實資料編碼／讀卡或紙張物理；逐功能驗證提交、不 push。

同輪追加 `braidedcord`（三股扁辮繩），目錄 511→512 種：四條直向棉色扁辮帶、每條四個週期，三股深淺不同的繩股沿 figure-eight 路徑交替上下穿越，區別 rope 的三股螺旋捻線與 cableknit 的雙股針織纜花。0.08 m tile、opaque dielectric／metallic 0，沿四圖／選用 height／ownership，不新增繩股 geometry、透明孔洞、編繩製程或布料物理；逐功能驗證提交、不 push。

同輪追加 `crossbeddedsandstone`（交錯層理砂岩），目錄 512→513 種：四層砂岩中的彎曲細層理交替傾向，在水平層界前截斷並接回共用接觸帶；區別 sandstone 的近水平平行層理與 rammedearth 的夯築帶。1.2 m tile、opaque dielectric／metallic 0，沿四圖／選用 height／ownership，不新增岩體 geometry、位移、地層生成、沉積或侵蝕模擬；逐功能驗證提交、不 push。

同輪追加 `grommetcanvas`（黃銅雞眼扣帆布），目錄 513→514 種：棕色織布上 4×4 凸起黃銅環、暗色孔底及連續內外 bevel；區別 eyeletcotton 的純繡線孔圈。0.16 m tile、opaque mixed brass／canvas，metallic map 僅扣環為 1、帆布與不透明孔底為 0，預設 material factor 1 保留該分區；沿四圖／選用 height／ownership，不新增 geometry、透明鏤空或布料物理；逐功能驗證提交、不 push。

同輪追加 `fishscaletiles`（魚鱗形釉面馬賽克），目錄 514→515 種：四列八錯列青綠色扇形磚，凸半圓上沿與兩條凹弧下沿互鎖，以中性填縫分隔，共平面釉面保留逐磚 seeded 深淺。區別 scallopedslate 的覆疊屋瓦、fishscales 的動物鱗片及 seigaihatiles 的方磚波紋印花。0.4 m tile、opaque dielectric、metallic 0；沿四圖／選用 height／ownership，不新增 geometry、透明度或鋪磚模擬；逐功能驗證提交、不 push。

同輪追加 `hexkeys`（黑氧化六角扳手），目錄 515→516 種：四乘四不同 quarter-turn 的 L 形工具，長短直臂以圓彎肘相切銜接，六角棒材保留平頂與兩側斜面、小圓角及平切端。區別 paperclips／cotterpins 的圓線材；0.4 m tile、opaque metallic 1，沿四圖／選用 height／ownership，不新增工具 geometry、機械裝配或物理；逐功能驗證提交、不 push。

同輪追加 `driedfigslice`（無花果乾切片），目錄 516→517 種：四乘四交替轉向的收窄梨形切片，褐色皺摺外皮包住深棕果肉與密集細小淡色籽，不沿用石榴分房或奇異果環狀籽。0.24 m tile、opaque dielectric、metallic 0；沿四圖／選用 height／ownership，不新增果實 geometry、透明度、食物生成或生物模擬；逐功能驗證提交、不 push。

同輪追加 `creamcrackers`（波邊奶油蘇打餅），目錄 517→518 種：四乘四獨立烘烤方餅，四側波邊切口、九孔壓痕、褐色外緣與不規則烘烤起泡；區別 wafer 的連續網格凹槽與 brownie 的軟質裂紋。0.24 m tile、opaque dielectric、metallic 0；沿四圖／選用 height／ownership，不新增食物 geometry、透明孔、烘焙或食物物理；逐功能驗證提交、不 push。

同輪追加 `doorkeys`（黃銅門鑰匙），目錄 518→519 種：四乘四 seeded quarter-turn 的平面鑰匙，圓環匙頭、連續窄頸、非對稱匙身、三處圓底齒槽、縱向導槽與倒角匙尖。與 hexkeys 的 L 形六角棒材區分；0.32 m tile、opaque metallic、map／預設 factor 皆為 1，沿四圖／選用 height／ownership，不新增鑰匙 geometry、透明孔、鎖芯或機械模擬；逐功能驗證提交、不 push。

同輪追加 `dodecagontiles`（十二邊三角釉面馬賽克），目錄 519→520 種：7 columns／8 staggered rows 的 56 塊藍綠十二邊形磚與 112 塊淡色三角嵌片，沿 canonical 3.12.12 lattice 分隔中性填縫，區別 trihexagonaltiles 的 3.6.3.6 及 octagondot 的 4.8.8。0.7 m opaque dielectric tile、metallic 0；canonical 矩形週期正規化至方形 UV，非幾何尺寸量測保證。沿四圖／選用 height／ownership，不新增 geometry、透明度或鋪磚模擬；逐功能驗證提交、不 push。

同輪追加 `ballchain`（銀色金屬珠鏈），目錄 520→521 種：四條各八珠的實心球珠鏈沿兩週期緩彎路徑排列，相鄰球珠由細直頸連接，球冠覆蓋下層 connector，不沿用 seedbeads 的穿孔橢圓珠或 chainlink 的環鏈。0.064 m tile、opaque metallic、map／預設 factor 皆為 1；沿四圖／選用 height／ownership，不新增珠鏈 geometry、透明度或鏈條物理；逐功能驗證提交、不 push。

同輪追加 `succulentrosettes`（多肉蓮座葉叢），目錄 521→522 種：四乘四不同轉向的灰綠 rosettes，每株三圈各六片肥厚匙形葉，內圈錯位覆蓋外圈葉基並由外向內抬高。區別 artichoke 的平行尖苞片與 daisy 的平面放射花瓣；0.64 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership，不新增植物 geometry、透明度、次表面散射或生物模擬；逐功能驗證提交、不 push。

同輪追加 `foldingfans`（紙摺扇），目錄 522→523 種：四乘四交替轉向的 140° 扇面，十二道放射紙摺痕、十三根露出木扇骨、兩側護骨及圓扇釘，區別 pleats 的直向布摺與 origami 的平面摺紙網格。1 m opaque dielectric tile、metallic 0；沿四圖／選用 height／ownership，不新增扇子 geometry、透明孔、開合動畫或摺紙物理；逐功能驗證提交、不 push。

同輪追加 `togglebuttons`（雙孔木製牛角扣），目錄 523→524 種：4×4 交替橫直的長桶形木扣，圓滑收束的兩端、凸起桶腹、兩個凹陷穿繩孔與彎曲順向木紋，區別 button 的四孔圓形有框鈕扣。0.32 m opaque dielectric tile、metallic 0；沿四圖／選用 height／ownership，不新增鈕扣 geometry、透明孔、繩索或衣物物理；逐功能驗證提交、不 push。

同輪追加 `greenpeapods`（封閉青豌豆莢），目錄 524→525 種：4×4 交替斜向的彎曲尖端豆莢，雙側縫脊、短柄及殼下五顆豌豆隆起，區別 cardamompods 的縱向多肋香料莢與 lotusseedpod 的圓形凹穴蓮蓬。0.48 m opaque dielectric tile、metallic 0；沿四圖／選用 height／ownership，不新增豆莢 geometry、透明外殼、剝莢動畫或植物模擬；逐功能驗證提交、不 push。

同輪追加 `beltbuckles`（黃銅皮帶框扣），目錄 525→526 種：4×4 橫直交替圓角金屬框，較低中柱、較高收尖扣舌與圓樞軸，形成兩個開口外觀。0.32 m opaque metallic tile、metallic 1；沿四圖／選用 height／ownership，不新增框扣 geometry、透明開口、皮帶、扣合動畫或機械模擬；逐功能驗證提交、不 push。

同輪追加 `hextruchettiles`（六角三弧 Truchet 釉面磚），目錄 526→527 種：56 片深藍六角釉面磚，各三段象牙弧以兩種 seeded 方向排列，六邊中點對接、凹灰縫，區別 truchettiles 的方磚雙弧。0.7 m opaque dielectric tile、metallic 0；沿四圖／選用 height／ownership，弧為平面釉色而非凸管，不新增拼磚 geometry 或路徑／拼圖遊戲；逐功能驗證提交、不 push。

同輪追加 `scoredmango`（十字劃切芒果果頰），目錄 527→528 種：4×4 橫直交替的橢圓果頰，完整薄皮邊、十字凹切線及圓潤金黃果肉方塊；不是 chocolate 的全平面模製塊，也不是 avocadoflesh 的中央種核凹穴。0.48 m opaque dielectric tile、metallic 0；沿四圖／選用 height／ownership，不新增水果 geometry、真正翻開／分離果塊、透明度或切割物理；逐功能驗證提交、不 push。

同輪追加 `waxseals`（五瓣徽記封蠟印章），目錄 528→529 種：4×4 深紅封蠟，seeded 七／十一波不規則熔邊、圓形壓印凹面、圓環凸緣與五瓣浮雕徽記，區別 candleswax 的垂流蠟滴及 crowncaps 的金屬壓紋。0.16 m opaque dielectric tile、metallic 0；沿四圖／選用 height／ownership，不新增印章 geometry、文字／自訂圖案輸入、熔融動畫或蠟流體；逐功能驗證提交、不 push。

同輪追加 `cottonbolls`（四團棉絮開裂棉鈴），目錄 529→530 種：4×4 交替轉 45° 的開裂棉鈴，四團凸起象牙棉絮、較低中央接縫、露出尖褐苞片與 seeded 細纖維斑理；區別 clover 的三片心形葉與 velvet 的平面絨面。0.24 m opaque dielectric tile、metallic 0；沿四圖／選用 height／ownership，不新增棉纖維 geometry、透明毛邊、次表面散射或植物生長；逐功能驗證提交、不 push。

同輪追加 `carabiners`（鋁色 D 型登山扣），目錄 530→531 種：4×4 橫直交替不對稱圓角框，直背、斜門閂、兩端凹接縫與凸鉸釘，區別 beltbuckles 的中柱／扣舌及 paperclips 的開放金屬線圈。0.32 m opaque metallic tile、metallic factor／map 1；沿四圖／選用 height／ownership，開口是暗低 backing，不新增扣環 geometry、透明孔、開合機構、碰撞或承重認證；逐功能驗證提交、不 push。

同輪追加 `pencilends`（木鉛筆橫切面），目錄 531→532 種：4×4 交替轉 30° 六角鉛筆末端，深色薄漆邊、淺色近乎平整切木面及略低圓形實心石墨芯；區別 hexnuts 的金屬孔與 endgrain 的整塊樹幹年輪。0.04 m opaque dielectric tile、metallic 0；沿四圖／選用 height／ownership，不新增鉛筆 geometry、削尖／書寫功能或導電模擬；逐功能驗證提交、不 push。

同輪追加 `corrugatedplasticedge`（中空塑膠板切邊），目錄 532→533 種：8 排交錯半格的藍色板切邊，每排 8 格矩形中空槽，上下平面皮與筆直肋板同高相接，區別 cardboardedge 的正弦紙波與 closedcellfoam 的閉孔凹點。0.064 m opaque dielectric tile、metallic 0，中空部位是低暗 backing 而非透明孔；沿既有四圖／選用 height／ownership，不新增板 geometry、結構力學或塑膠性能認證；依功能驗證提交、不 push。

同輪追加 `haircombs`（塑膠髮梳），目錄 533→534 種：4×4 交替水平／垂直琥珀色髮梳，平整梳背連接 14 根漸細、圓鈍收尾的梳齒，齒間凹槽連通至外部低暗 backing；區別 doorkeys 的金屬孔／單邊 bitting 與 sawblades 的圓形齒刃。0.48 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership，不新增梳子 geometry、透明塑膠、頭髮交互或變形模擬；依功能驗證提交、不 push。

同輪追加 `blackberries`（黑莓聚合果），目錄 534→535 種：4×4 交替水平／垂直深紫光澤果實，3／4／5／4／3 交錯列共 19 顆凸圓小核果組成橢圓輪廓，雙顆／三顆接縫較低但仍填實；區別 grapeskin 的平鋪果粉與 lychee 的多邊形果殼。0.16 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership，不新增果實 geometry、透明果肉、植物生長或食物物理；依功能驗證提交、不 push。

同輪追加 `musselshells`（淡菜貝殼），目錄 535→536 種：4×4 交替水平／垂直藍黑淚滴殼，窄鉸端、較寬圓弧尾端、實心凸冠與曲線細生長槽；區別 scallopshell 放射肋、oystershell 不規則階層片與 cowrieshells 齒狀開口。0.32 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership，不新增貝殼 geometry、雙殼開合、透明殼或生物模擬；依功能驗證提交、不 push。

同輪追加 `safetypins`（閉合金屬別針），目錄 536→537 種：4×4 交替水平／垂直鋼色別針，圓形彈簧線圈、兩條凸圓針腳、蓋住針尖的較高實心護扣與淺凹縫，區別 paperclips 內外折線與 cotterpins 開叉尾。0.16 m opaque metallic tile、factor／map 1（含低暗 backing），孔非透明；沿四圖／選用 height／ownership，不新增別針 geometry、開合、彈簧物理或穿刺功能；依功能驗證提交、不 push。

同輪追加 `poppyseedpods`（乾燥罌粟蒴果），目錄 537→538 種：4×4 交替水平／垂直乾燥封閉果身、縱向細肋與較低細梗，頂端較高的扁平八瓣柱頭盤有凸起放射紋與瓣間缺刻；區別 lotusseedpod 的多孔種室與 cardamompods 的尖細橢圓。0.24 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership，不新增蒴果 geometry、透明果皮、開裂、種子散播或植物模擬；依功能驗證提交、不 push。

同輪追加 `leatherbookspines`（壓紋皮革書脊），目錄 538→539 種：8 本平行棕色凸弧書背、四道隨弧面彎曲的 raised bands、中央圓角 blind-stamped frame 與較低 panel floor，保留細孔與深書縫；區別 tooledleather 圓章與 shiplap 木板。0.32 m opaque dielectric tile、metallic 0，無文字／燙金；沿四圖／選用 height／ownership，不新增書本 geometry、文字排版、翻頁或裝訂物理；依功能驗證提交、不 push。

同輪追加 `matchsticks`（木火柴），目錄 539→540 種：4×4 交替水平／垂直淺木方截面棒身、直向木紋與較高暗紅粗圓塗層頭，塗頭比棒身寬且 roughness 不同；區別 pencilends 六角橫切面與 candleswax 滴蠟。0.2 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership，不新增火柴 geometry、點火、燃燒、發光或化學模擬；依功能驗證提交、不 push。

同輪追加 `porcelaininsulators`（瓷質絕緣子），目錄 540→541 種：4×4 交替水平／垂直乳白釉面絕緣子側面，五層圓弧傘裙包住較低連續細芯、裙間外側空隙、圓帽與短柄；區別 flutedceramic 連續細槽／radiator 金屬管。0.8 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership，不新增實際 geometry、金屬接頭、電場／漏電模擬或絕緣性能認證；依功能驗證提交、不 push。

同輪追加 `dominoes`（骨牌），目錄 541→542 種：4×4 交替水平／垂直象牙白圓角牌面，兩半獨立 seeded 標準 0–6 黑色凹點排列，中央較淺分隔槽，保留 raised face／filled recesses／opaque backing。0.24 m dielectric tile、metallic 0，沿四圖／選用 height／ownership；不新增骨牌 geometry、遊戲規則或物理。依功能驗證提交、不 push。

同輪追加 `woodenspoons`（木匙），目錄 542→543 種：4×4 交替水平／垂直木匙，橢圓填實凹碗、高起匙緣、連續細頸與漸寬扁柄、縱向木纖維，區別 cutlery 珠邊拉絲柄面。0.4 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership，不新增匙 geometry、容積／流體或食品安全認證；依功能驗證提交、不 push。

同輪追加 `chessrooks`（城堡棋子），目錄 543→544 種：4×4 交替水平／垂直象牙色側面，三齒冠／兩道向外開口、收腰連續柱身、上下 collar 與寬圓底座，區別 castellatednuts 六角環面。0.24 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership，不新增棋子 geometry、棋盤／棋規／棋力或物理；依功能驗證提交、不 push。

同輪追加 `threadspools`（木軸紅線捲），目錄 544→545 種：4×4 交替水平／垂直暗紅捲線筒、較低連續木 core、兩端較寬較高木盤、細密橫向 winding relief 與較粗糙線面；區別 braidedcord 的編織交錯與 porcelaininsulators 的五裙釉面。0.24 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership，不新增線軸／紗線 geometry、解捲／張力或布料物理；依功能驗證提交、不 push。

同輪追加 `bellpepperslices`（青甜椒橫切面），目錄 545→546 種：4×4 交替方向三瓣綠色果肉環、較低淡色胎座／三條連續內膜、三空腔與六顆凸起附著籽粒，區別 okraslice 五瓣多室／lotusroot 無籽孔道。0.32 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership，不新增甜椒 geometry、透明空腔、食物／生物／流體模擬；依功能驗證提交、不 push。

同輪追加 `sharkteeth`（鯊齒），目錄 546→547 種：4×4 交替水平／垂直象牙色尖三角琺瑯冠、兩側細鋸齒、較低粗糙雙葉齒根、連續 neck 與根部中央向外開口，區別 sawblades 的金屬圓鋸環。0.24 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership，不新增牙齒 geometry、物種／年代鑑定、牙科／生物模擬或物理；依功能驗證提交、不 push。

同輪追加 `grinderburrs`（鋼研磨刃環），目錄 547→548 種：4×4 seeded 轉向鋼圓環、六道彎曲較高較平滑刃面／較低較粗槽底、中央孔與三個安裝孔；區別 spurgears 外周齒／sawblades 圓鋸輪廓。0.4 m opaque metal tile、metallic 1（含低金屬 backing），同步 maps／createMaterial factor／ownership／正式圖鑑。沿四圖／選用 height，不新增研磨 geometry、切削／咖啡研磨模擬或物理；依功能驗證提交、不 push。

同輪追加 `cowhide`（黑白斑短毛牛皮），目錄 548→549 種：不規則圓潤黑白色塊、連續細短毛面；區別 zebrafur 分岔條紋／leopardfur 環斑／giraffefur 多邊形斑塊。0.8 m opaque dielectric tile、metallic 0，重用既有 compact short-fur pile，pigment 不參與 height，邊界不刻成凹槽。沿四圖／選用 height／ownership，不新增毛髮 geometry、梳理／布料／生物或動物模擬；依功能驗證提交、不 push。

同輪追加 `spaltedwood`（分區線淺木），目錄 549→550 種：淺色縱向木紋與細而彎曲的深色真菌分區線，色素線不刻成裂縫，區別 woodworm 蟲道／burlwood 渦旋瘤紋。0.6 m opaque dielectric tile、metallic 0，沿既有 cached anisotropic wood grain、四圖／選用 height／ownership，不新增木 geometry、腐朽／真菌生長／生物模擬或結構安全判定；依功能驗證提交、不 push。

同輪追加 `canlids`（金屬易拉罐蓋），目錄 550→551 種：圓蓋沖壓補強環、細凹刻線、上層雙孔拉環與更高鉚釘；拉環孔露出完整蓋面，不是假通透洞，區別 crowncaps 齒裙瓶蓋。0.28 m opaque metallic tile、metallic 1，沿四圖／選用 height／ownership，不新增罐蓋 geometry、開罐／撕裂／變形或力學模擬；依功能驗證提交、不 push。

同輪追加 `crinoidossicles`（海百合莖節化石），目錄 551→552 種：連續石灰質基質、淺色圓盤、中央五瓣星狀沉積物填充管腔與 20 道淺放射關節細脊，區別 fossillimestone 平切螺旋腔室／sanddollar 外圈花瓣孔。0.08 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership，不新增化石 geometry、透明孔洞、物種鑑定或古生物／生物模擬；依功能驗證提交、不 push。

同輪追加 `pythagoreantiles`（畢氏雙尺寸方磚），目錄 552→553 種：邊長 2:1 的深淺方磚由斜晶格交錯鋪滿平面，單 UV tile 各五大／小方磚、灰縫深度一致，區別 windmillpavers 四長磚包小方磚。0.4 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership，不新增鋪磚 geometry、施工／結構或物理模擬；依功能驗證提交、不 push。

同輪追加 `dinnerforks`（金屬餐叉），目錄 553→554 種：四根圓端漸細叉齒、三道有背底的開口、接合寬叉頭／細頸／下端漸寬柄；區別 haircombs 多齒橫背髮梳／woodenspoons 凹碗木匙。0.96 m opaque metallic tile、metallic 1，沿四圖／選用 height／ownership，不新增餐具 geometry、通透孔洞、食物接觸／變形或物理模擬；依功能驗證提交、不 push。

同輪追加 `goldbrocade`（金線花葉織錦），目錄 554→555 種：重用 damask compact 花葉形態，將凸金線／織縫與暗底布分開 PBR，metallic map 僅暴露金線為金屬、花內織隙仍為非金屬布，不是整塊金屬花牌或整張金屬布。0.24 m opaque mixed-metallic tile、公開 material metallic factor 1 保留 map 分區，沿四圖／選用 height／ownership，不新增紗線 geometry、透洞、紡織／布料／光譜或物理模擬；依功能驗證提交、不 push。

同輪追加 `mudtiretracks`（泥地雙輪胎痕），目錄 555→556 種：連續泥面兩道凹輪轍、每轍 36 道弧形胎塊壓痕、兩側微凸泥緣；不是 tiretread 橡膠凸塊或 mud 多邊形泥塊。3 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership，不新增 terrain geometry、車輪／碰撞／動態變形／車輛或物理模擬；依功能驗證提交、不 push。

同輪追加 `peacockfeathers`（金綠眼斑孔雀羽毛），目錄 556→557 種：重用 feathers 8×4 seeded lean／交錯覆疊／羽軸羽枝，金色外圈、綠色內帶與深 pupil 都是 pigment，不刻成環槽或洞。0.64 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership，不新增羽毛 geometry、透洞、梳理／鳥類／生物或虹彩光學模擬；依功能驗證提交、不 push。

同輪追加 `tangramtiles`（七巧板釉面瓷磚），目錄 557→558 種：兩大／一中／兩小直角等腰三角形、一正方形、一平行四邊形拼正方格，七片標準面積比例與灰縫，不是 righttriangletiles 的單一對角二分。0.6 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership，不新增磚塊 geometry、互動拼圖或物理模擬；依功能驗證提交、不 push。

同輪追加 `batterypositivecaps`（圓柱電池正極端蓋），目錄 558→559 種：金屬外蓋與凸接點、中間淡色非金屬絕緣環、外側微凸捲邊，並非全金屬墊圈或通透環孔。0.12 m opaque mixed-metallic tile、material metallic factor 1 保留金屬／絕緣環／背底分區，沿四圖／選用 height／ownership，不新增電池 geometry、導電／電化學／電路或物理模擬；依功能驗證提交、不 push。

同輪追加 `passionfruitslice`（黃百香果切面），目錄 559→560 種：橢圓果皮／淡色厚內皮、中央連續填實果漿與散佈深籽凸金果囊，區別 kiwi 環狀種子或 pomegranate 分室紅石榴籽。0.32 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；深籽只改果囊 pigment 而不鑽孔，不新增果實 geometry、透明／SSS／透射、生物或物理模擬；依功能驗證提交、不 push。

同輪追加 `screwterminalblocks`（塑殼螺絲端子台），目錄 560→561 種：非金屬綠塑殼／沉孔、金屬十字槽螺絲與 backed 接線口內較低金屬接片，區別 screwhead 全金屬底板或 circuitboard 線路紋。0.08 m opaque mixed-metallic tile、material metallic factor 1 保留螺絲／接片與塑殼／背底分區，沿四圖／選用 height／ownership，不新增元件 geometry、通透孔洞、導電／電路／機構或物理模擬；依功能驗證提交、不 push。

同輪追加 `dragonfruitflesh`（白肉火龍果果肉），目錄 561→562 種：連續淡色微顆粒果肉、散佈隨機方向細長黑籽，不重複 dragonfruit 果皮苞片或整顆果實切片。0.06 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；種子僅改 pigment／roughness，不刻凹孔，不新增果實 geometry、透明／SSS／透射、生物或物理模擬；依功能驗證提交、不 push。

同輪追加 `speakercones`（黑色揚聲器紙盆），目錄 562→563 種：凹紙盆／細放射紋、中央凸防塵蓋、較高橡膠懸邊與外框，並非金屬敲鑼環或空烤模杯。0.64 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership，不新增喇叭 geometry、通透孔洞、聲學／電機／振膜或物理模擬，不改 Audio；依功能驗證提交、不 push。

同輪追加 `septarianstone`（龜甲石），目錄 563→564 種：棕色不規則閉合石質之間由乳金色方解石填滿脈帶，並非 breccia 凸碎屑或 crackleglaze 凹暗裂網。0.48 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；拋光面僅微起伏，不挖開放裂縫，不新增岩石 geometry、透明晶體、礦物層或地質／物理模擬；依功能驗證提交、不 push。

同輪追加 `axialresistors`（軸向電阻），目錄 564→565 種：圓頭凸絕緣本體、三道深色與一道淡色塗裝環帶、兩端較低金屬引腳，不是電路板線路或端子台。0.12 m opaque mixed-metallic tile、material factor 1，沿四圖／選用 height／ownership；塗裝環帶仍非金屬且不刻凸環，不宣稱電阻值編碼，不新增元件 geometry、導電／電路／電熱或物理模擬；依功能驗證提交、不 push。

同輪追加 `tomatoslices`（番茄切面），目錄 565→566 種：紅果皮／實心紅肉隔膜與中央胎座、五個填實膠質種室各含兩淡籽，並非 bellpepperslices 空腔或 pomegranate 凸紅籽囊。0.32 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；種室仍正值填實、不挖孔，不新增果實 geometry、透明／SSS／透射、生物或物理模擬；依功能驗證提交、不 push。

同輪追加 `pinstripewool`（細直條羊毛布），目錄 566→567 種：深藍 2-over-2 twill 上每八根經紗一根淡色，深緯紗在 crossing 蓋住淡紗，非 tartan 雙向格紋或 corduroy 凸肋。0.08 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；染色不增凸直條，不新增紗線 geometry、透孔、毛髮／sheen BRDF、布料或物理模擬；依功能驗證提交、不 push。

同輪追加 `chrysanthemumstone`（菊花石），目錄 567→568 種：黑色拋光石內嵌淡色放射晶瓣、共用淡色中心，非 daisy 凹花心／凸花瓣或 crystallineglaze 圓形釉斑。0.48 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；晶紋僅改 pigment／roughness，height 只留微 grain、不雕凸花或凹坑，不新增岩石／晶體 geometry、透明／晶體折射、礦物鑑定／地質或物理模擬；依功能驗證提交、不 push。

同輪追加 `sewingsnaps`（公母金屬暗釦），目錄 568→569 種：公釦凸柱／母釦凹座交替、rounded rim 與四個 cardinal 縫孔，非普通四孔鈕釦或單一 grommet 環。0.12 m opaque mixed-metallic tile、material factor 1，金屬 face／post／socket 與非金屬 opaque 孔底分區，沿四圖／選用 height／ownership；不新增 geometry、通透孔、縫線、扣合／彈簧或物理模擬；依功能驗證提交、不 push。

同輪追加 `lathplaster`（木條灰泥牆），目錄 569→570 種：淡色灰泥脫落後露出較低水平木條與更深 opaque 背底，非單層 peelingpaint 捲邊或 slottedwood 整面穿槽。0.8 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；三層表面高度／AO 清楚分離，不新增牆體 geometry、通透孔、釘／縫線、破壞／結構或物理模擬；依功能驗證提交、不 push。

同輪追加 `ceramiccapacitors`（徑向陶瓷電容），目錄 570→571 種：凸絕緣陶瓷圓片、同側兩支較低金屬引腳與被塗層包覆的 roots，非 axialresistors 兩端出腳或圓筒電池端蓋。0.12 m opaque mixed-metallic tile、material factor 1，沿四圖／選用 height／ownership；不新增電容量編碼、元件 geometry、導電／電路／電熱或物理模擬；依功能驗證提交、不 push。

同輪追加 `fennelseeds`（茴香籽），目錄 571→572 種：seeded 旋轉／jitter 的彎曲尖梭籽粒與五條收斂縱肋，非帶梗豆蔻莢或光滑芝麻粒。0.096 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；不新增種子 geometry、重疊散佈、植物生長／營養／味道或物理模擬；依功能驗證提交、不 push。

同輪追加 `ballbearingfaces`（開放式滾珠軸承端面），目錄 572→573 種：同心內外圈、低連續滾道與八顆高凸鋼球，中心孔仍 opaque 非金屬背底，非球鏈或單圈墊片。0.16 m opaque mixed-metallic tile、factor 1，沿四圖／選用 height／ownership；不新增軸承 geometry、透明貫穿孔、保持架、滾動／旋轉／潤滑／機械或物理模擬；依功能驗證提交、不 push。

同輪追加 `baseballleather`（棒球白皮革），目錄 573→574 種：白細紋皮革上兩道鏡向彎曲低接縫與每列成對紅凸線，非 rugbyball 橫向綁帶。0.24 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；不新增球體／線材 geometry、完整球面裁片 UV、賽事規格認證、縫製／布料／碰撞或物理模擬；依功能驗證提交、不 push。

同輪追加 `toothbrushheads`（牙刷頭），目錄 574→575 種：較低膠囊塑膠底座與 3×6 十八束高白刷毛冠面、束間仍是較低光滑藍塑膠，不同於 wirebrush 平行長鋼刷。0.12 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；不新增刷頭／個別刷毛 geometry、刷柄、透明束間孔、刷毛彎曲／刷牙／清潔或物理模擬；依功能驗證提交、不 push。

同輪追加 `bowtieinlay`（蝴蝶木榫補片），目錄 575→576 種：深色 hourglass keys 橫跨暗木裂縫、齊平恢復表面高度／AO，板縱紋與榫橫紋不同，非邊端 dovetailjoint 或凸起徽章。0.6 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；不新增木作 geometry、透明裂孔、實際結構補強／接合強度認證、斷裂／破壞或物理模擬；依功能驗證提交、不 push。

同輪追加 `redcabbagecut`（紫甘藍切面），目錄 576→577 種：填實紫葉層上蜿蜒淡脈／淡實芯與深色外葉緣，非 cabbage 外葉起伏或 onion 乾表皮。0.48 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；淡脈與芯僅顏料／roughness 差異、不挖孔／浮起；不新增葉層 geometry、透明葉片、透射／subsurface 求解、植物生長／解剖認證或物理模擬；依功能驗證提交、不 push。

同輪追加 `slottedturners`（金屬煎鏟頭），目錄 577→578 種：圓角金屬鏟面／同高短頸與三道封閉長槽，槽內為低 opaque 非金屬背底，不是 dinnerforks 開口齒。0.32 m opaque mixed-metallic tile、factor 1，沿四圖／選用 height／ownership；不新增廚具 geometry、完整長柄、透明貫穿槽、彎曲／翻炒／熱傳導或物理模擬；依功能驗證提交、不 push。

同輪追加 `triglidesliders`（塑膠日字調節扣），目錄 578→579 種：無扣針圓角塑膠框、雙封閉穿帶窗與齊平中橫桿，非 beltbuckles 金屬框／扣舌。0.16 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；窗內 opaque 低背底，不新增扣具／背帶 geometry、透明孔、穿帶／滑動／摩擦／承重認證或物理模擬；依功能驗證提交、不 push。

同輪追加 `popcorn`（爆米花），目錄 579→580 種：seeded 不規則淡白膨瓣連成單粒、低焦金尖殼芯，不是 cottonbolls 四白絨球／綠褐苞片。0.24 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；不新增食物 geometry、透明孔、爆裂／烹煮／熱傳導、營養或物理模擬；依功能驗證提交、不 push。

同輪追加 `dualinlinechips`（雙列直插 IC），目錄 580→581 種：黑色 dielectric 圓角封裝、雙列各七低金屬腳與第一腳定位凹點。0.16 m opaque mixed-metallic tile、factor 1，沿四圖／選用 height／ownership；不新增元件 geometry、透明孔、電路連線／電氣／邏輯／熱傳導／焊接或物理模擬；依功能驗證提交、不 push。

同輪追加 `tortoiseshellacetate`（玳瑁紋醋酸纖維塑膠），目錄 581→582 種：連續琥珀底／不規則深褐斑塊、平滑拋光面，非 tortoiseshell 隆起天然甲片。0.2 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；不新增 geometry、透明／透射／折射、化學製程、天然殼材或物理模擬；依功能驗證提交、不 push。

同輪追加 `cathedralquilt`（教堂窗拼布），目錄 582→583 種：奶油色弧形高折邊包低藍布窗，非 quilting 直線菱格棉襯／縫。0.6 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；不新增布料 geometry、透明窗、折疊／縫製／布料力學或物理模擬；依功能驗證提交、不 push。

同輪追加 `buckwheathulls`（蕎麥帶殼籽粒），目錄 583→584 種：seeded 旋轉／微偏移三角外形、三個圓滑面與細高稜，非 fennelseeds 長條彎籽。0.064 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；不新增種子 geometry、透明孔、剝殼／生長／烹煮、營養或物理模擬；依功能驗證提交、不 push。

同輪追加 `rutilatedquartz`（針狀金紅石石英），目錄 584→585 種：乳白連續拋光面、兩組各三交叉金褐尖針 inclusion，非 quartz 六角晶柱／pyrite 金屬方晶。0.2 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；不新增 geometry、透明／折射／透射、晶內深度、多層體積散射、礦物生長或物理模擬；依功能驗證提交、不 push。

同輪追加 `peppermintcanes`（薄荷拐杖糖），目錄 585→586 種：紅白連續圓弧／長短兩端圓管，條紋只改 pigment、非 candy 連續平面高低條；沿既有 neutral backing mix。0.32 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；不新增糖果 geometry、透明孔、糖晶／溶化／烹煮、營養或物理模擬；依功能驗證提交、不 push。

同輪追加 `rubbergrommets`（橡膠護線環），目錄 586→587 種：高內唇／低外法蘭／閉環凹槽，全非金屬，非 grommetcanvas 帆布金屬雞眼。0.16 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；孔內低 opaque 背底，不新增扣件／線材 geometry、透明孔、彈性／密封／穿線／電氣絕緣認證或物理模擬；依功能驗證提交、不 push。

同輪追加 `chioggiabeetcuts`（Chioggia 甜菜切片），目錄 587→588 種：六圈紅白交替 pigment、白色實芯與低薄紅皮；切面平齊、環紋不改 height，不是 onion 起伏紙皮。0.24 m opaque dielectric tile、metallic 0，沿既有 neutral backing、四圖／選用 height／ownership；不新增 geometry、透明孔、汁液、切割／生長／營養或物理模擬；依功能驗證提交、不 push。

同輪追加 `flatflexcables`（扁平軟排線），目錄 588→589 種：琥珀絕緣薄片／六條埋藏導線淺脊、單端六枚較低銀色露出接點，metallic map 僅接點為金屬、預設 factor 1。0.24 m opaque mixed-metal tile，沿 neutral backing／四圖／選用 height／ownership；不新增 cable／connector geometry、透明膜、彎折／導電／耐熱認證或物理模擬；依功能驗證提交、不 push。

同輪追加 `celerycuts`（芹菜橫切片），目錄 589→590 種：開口彎月形淺綠果肉／薄綠皮，五個 solid 維管束凹點；開口接 opaque backing、非閉環或透明孔。0.24 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；不新增 geometry、透明度、汁液、切割／生長／營養或物理模擬；依功能驗證提交、不 push。

同輪追加 `tactileswitches`（四腳輕觸開關），目錄 590→591 種：四枚低銀色接腳／黑色絕緣外殼／較高金屬蓋／最高黑色實芯按柱；metallic map 僅露出腳與蓋、外殼蓋住腳根、按柱蓋住蓋面 metal，預設 factor 1。0.24 m opaque mixed-metal tile，沿 neutral backing／四圖／選用 height／ownership；不新增 geometry、機械按壓、導電／開關邏輯／耐久認證或物理模擬；依功能驗證提交、不 push。

同輪追加 `paisleybrocade`（paisley 織錦），目錄 591→592 種：深藍連續織布、彎尖水滴金色紗線輪廓與三內點；全 dielectric／metallic 0，非 goldbrocade 金屬花瓣織線。0.4 m opaque tile，沿四圖／選用 height／ownership；不新增 yarn geometry、透明開口或布料物理；依功能驗證提交、不 push。

同輪追加 `siliconepastrybrushes`（矽膠烘焙刷），目錄 592→593 種：一體式橘色長柄／寬頭／七條分離刷齒，柄端 solid recess、不成透明孔；區別 haircombs 長脊密齒。0.32 m opaque dielectric tile、metallic 0，沿 neutral backing／四圖／選用 height／ownership；不新增 brush geometry、毛刷／液體／彎折模擬、食品接觸／耐熱認證或物理；依功能驗證提交、不 push。

同輪追加 `graphicgranite`（文象花崗岩），目錄 593→594 種：粉色長石上每 cell 三組尖細成對石英交生紋，深淺礦物共用拋光平面；非 dendriticagate 蕨枝或 gneiss 摺曲條帶、不作凹刻文字。0.2 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；不新增 geometry、透明石英、晶體生長或物理模擬；依功能驗證提交、不 push。

同輪追加 `brasspadlocks`（黃銅掛鎖），目錄 594→595 種：封閉 U 梁／較高黃銅鎖身／低實心非金屬鑰匙孔圖案，鎖梁與鎖身 metal、孔底與 opaque 背底 dielectric，預設 factor 1。0.24 m opaque mixed-metal tile，沿四圖／選用 height／ownership；不新增 geometry、透明孔、開鎖／鎖定狀態／安全認證或物理模擬；依功能驗證提交、不 push。

同輪追加 `carrotcuts`（胡蘿蔔切片），目錄 595→596 種：橙色平切面／淡實心髓心／12 道尖細放射色素紋／薄深色外皮，髓心與紋路不改變切面高度；非 Chioggia 同心紅環或 citrus 分隔凹槽。0.24 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；不新增 geometry、透明髓心、汁液／切割／生長／營養或物理模擬；依功能驗證提交、不 push。

同輪追加 `bluepushpins`（藍色塑膠圖釘），目錄 596→597 種：高上凸緣／較低下凸緣／細塑膠腰身／更低露出金屬尖針；藍塑膠蓋住針根並清 metal，預設 factor 1。0.16 m opaque mixed-metal tile、neutral backing，沿四圖／選用 height／ownership；不新增 geometry、穿刺／固定承重／透明度或物理模擬；依功能驗證提交、不 push。

同輪追加 `oatflakes`（壓片燕麥），目錄 597→598 種：寬扁淡色橢圓薄片／微起伏不規則邊／低實心中央壓痕／六細纖維，非細長 rice 或彎曲 fennel seeds／三稜 buckwheat hull。0.06 m opaque dielectric tile、metallic 0，沿 neutral backing／四圖／選用 height／ownership；不新增 geometry、透明裂縫、烹煮／營養或物理模擬；依功能驗證提交、不 push。

同輪追加 `tigerfur`（虎斑毛皮），目錄 598→599 種：橙底／六行深色波紋主帶／每行兩條真正連根分叉尖枝，非只把 zebra 改色；沿既有 shortFur 的 directional pile、顏料不刻入毛高。0.4 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；不新增 fur geometry、透明度、動物／毛髮／物理模擬；依功能驗證提交、不 push。

同輪追加 `grosgrainribbons`（羅紋織帶），目錄 599→600 種：四條藍織帶／64 密橫肋／雙側各三道較高連續布邊縱紋／帶間中性 opaque 背底，非 corduroy 全面縱絨肋或 ribbonstreamer 扭曲紙帶。0.06 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；不新增 geometry、透明帶隙、打結／布料／物理模擬；依功能驗證提交、不 push。

同輪追加 `azuritemalachite`（藍銅礦／孔雀石），目錄 600→601 種：綠基質上 stylized 三藍球簇／每球兩細礦物色帶，全部共用平齊拋光面，非 orbicularjasper 單球或 malachite 單礦物起伏帶。0.2 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；不新增 geometry、透明晶體、礦物生長或物理模擬；依功能驗證提交、不 push。

同輪追加 `openendspanners`（雙頭開口扳手），目錄 601→602 種：細金屬柄連接兩個大小不同的較高開口鉗口，兩凹口和外側皆 opaque 非金屬背底，露出工具 metal、預設 factor 1。0.4 m opaque mixed-metal tile，沿四圖／選用 height／ownership；不新增 geometry、透明鉗口、鎖固／扭矩／工具認證或物理模擬；依功能驗證提交、不 push。

同輪追加 `lentilseeds`（小扁豆種子），目錄 602→603 種：近圓整粒凸面／靠邊短低實心種臍，非 oatflakes 長中央壓痕、coffeebeans 深中央溝或 pumpkinseeds 高邊尖殼。0.04 m opaque dielectric tile、metallic 0，沿 neutral backing／四圖／選用 height／ownership；不新增 geometry、透明裂口、發芽／烹煮／營養或物理模擬；依功能驗證提交、不 push。

同輪追加 `blueprintpaper`（工程藍圖紙），目錄 603→604 種：深藍紙底／大小分級格線／白色圓角板框、圓孔圖樣、十字中心線與有限尺寸線端刻線；印墨僅 pigment、紙面不刻溝，非 graphpaper 純格紙。0.4 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；不新增 geometry、CAD 解析／輸出、文字排版或文件認證；依功能驗證提交、不 push。

同輪追加 `horsechestnutleaf`（風格化七葉樹複葉），目錄 604→605 種：七片尖端微鋸齒小葉，細小葉柄接共同葉柄、葉片中肋較高較亮，非 mapleleaf 連續裂片或 ginkgoleaf 連續扇面。0.8 m opaque dielectric tile、metallic 0，沿 neutral backing／四圖／選用 height／ownership；不新增 geometry、透明葉隙、植物生長／生理或物理模擬；依功能驗證提交、不 push。

同輪追加 `binderclips`（長尾夾），目錄 605→606 種：兩等寬銀色 U 線柄／非金屬黑塗層梯形夾身／較高下緣 lip，露出 wire metallic 1、塗層／opaque 孔隙／外背 metallic 0，預設 factor 1。0.32 m opaque mixed-metal tile，沿四圖／選用 height／ownership；不新增 geometry、透明孔、夾持／彈簧／承重或物理模擬；依功能驗證提交、不 push。

同輪追加 `charoite`（風格化紫龍晶），目錄 606→607 種：紫底扭曲密纖維束／淡色寬帶／稀疏深色實心包裹體，共同拋光面，色紋不刻槽。0.2 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；不新增 geometry、透明礦洞、礦物生成、動態貓眼光學或物理模擬；依功能驗證提交、不 push。

同輪追加 `chenilleyarn`（雪尼爾絨線），目錄 607→608 種：八條粉紅蓬鬆圓芯／各 128 列短橫尖絨束／兩側伸出鬆絨邊，非 corduroy 連續布面或 grosgrainribbons 平織帶高布邊。0.08 m opaque dielectric tile、metallic 0，沿 neutral backing／四圖／選用 height／ownership；不新增 geometry、透明絨隙、線材拓樸、布料／毛髮或物理模擬；依功能驗證提交、不 push。

同輪追加 `ceramicfuses`（陶瓷管式保險絲），目錄 608→609 種：霧白凸圓陶瓷筒／兩同寬金屬端帽／較高端帽凸環，非 axialresistors 細引腳色環元件；陶瓷／opaque 外背 metallic 0、端帽 metallic 1，預設 factor 1。0.16 m opaque mixed-metal tile，沿四圖／選用 height／ownership；不新增 geometry、透明玻璃、電熱／熔斷模擬、額定值或安規認證；依功能驗證提交、不 push。

同輪追加 `hazelnutshells`（整粒榛果殼），目錄 609→610 種：略尖上端／圓鈍下部／隨殼旋轉的縱木紋／較低淺色粗糙實心基疤，非 walnutshell 連續縱溝或 almondshell 孔紋面。0.1 m opaque dielectric tile、metallic 0，沿 neutral backing／四圖／選用 height／ownership；不新增 geometry、透明開殼、果仁／烹煮／植物生長或物理模擬；依功能驗證提交、不 push。

同輪追加 `yagasuricloth`（矢絣風箭羽紋織布），目錄 610→611 種：紫底奶油色三對尖羽／連續軸／相鄰直欄反向，顏料不刻入連續布面，非 ikat 菱形或 asanoha 麻葉網。0.24 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；96-thread weave 避開預設 256px 的 128-thread constant-phase alias，不新增 geometry、真實紡織／染色製程／文化工藝認證或 cloth physics；依功能驗證提交、不 push。

同輪追加 `balloonwhisks`（氣球式打蛋器），目錄 611→612 種：三層 projected oval metal loops／連續頸柄／四道較高握柄凸環，線圈與柄 metallic 1、線間和外側 opaque neutral backing metallic 0、預設 factor 1。0.8 m opaque mixed-metal tile，沿四圖／選用 height／ownership；不新增 geometry、透明開孔、攪拌／食物接觸認證或物理模擬；依功能驗證提交、不 push。

同輪追加 `orthocerasstone`（直角石化石石材），目錄 612→613 種：尖長窄上／較寬圓下殼切面／八道彎曲隔壁，填礦化石與深色拋光基質同一平面，非既有 coil fossil limestone 或 trilobite 三軸殼體。0.4 m opaque dielectric tile、metallic 0／AO1／mortar0，沿四圖／選用 height／ownership；不新增 geometry、浮雕／挖孔、古生物或石材來源認證／生長或物理模擬；依功能驗證提交、不 push。

同輪追加 `rickracktrim`（波浪花邊織帶），目錄 613→614 種：六條八週期連續蛇行玫瑰色帶／雙側較高織邊／斜向細織紋，非既有 diagonal ribbonstreamer 或三股 braidedcord。0.12 m opaque dielectric tile、metallic 0，沿 neutral opaque backing／四圖／選用 height／ownership；不新增 geometry、透明帶間空隙、真實編織或 cloth physics；依功能驗證提交、不 push。

同輪追加 `toroidalinductors`（環形電感頂面），目錄 614→615 種：十二道較高 smoother 銅繞線／深色 dielectric ferrite 磁芯環／中央孔 opaque neutral backing；銅 metallic 1、磁芯與 backing metallic 0、預設 factor 1。0.16 m opaque mixed-metal tile，沿四圖／選用 height／ownership；不新增 geometry、透明孔、漆包線絕緣、引腳、電磁／電熱模擬、額定值或安全認證；依功能驗證提交、不 push。

同輪追加 `pennerigate`（斜切筆管麵），目錄 615→616 種：直管斜切端／五道較高縱肋／兩端低暗粗實心管口陰影，非既有 bent macaroni。0.16 m opaque dielectric tile、metallic 0，沿 neutral opaque backing／四圖／選用 height／ownership；不新增 geometry、透明通孔、真實管腔、烹煮／食物或物理模擬；依功能驗證提交、不 push。

同輪追加 `lepidolitemica`（鋰雲母風格石材），目錄 616→617 種：連續淡紫礦物基質上三階較高／較亮／較平滑六角解理薄片，非既有膨脹蛭石波浪 lamellae。0.2 m opaque dielectric tile、metallic 0／mortar0，沿四圖／選用 height／ownership；風格化 seeded platelet pattern、不認證真實礦物組成、晶體物理或 iridescence，不新增 geometry、透明／transmission、粒子或物理模擬；依功能驗證提交、不 push。

同輪追加 `brassjinglebells`（黃銅鈴鐺頂面），目錄 617→618 種：高凸黃銅殼／較高平滑環形壓邊／中央圓凹與四圓端十字低暗粗槽。黃銅 metallic1、槽／外背 metallic0、預設 factor1。0.16 m opaque mixed-metal tile，沿 neutral backing／四圖／選用 height／ownership；僅 stylized top-face shading，不新增 geometry、透明通孔、內部珠、吊耳、敲擊／音效、聲學或物理模擬；依功能驗證提交、不 push。

同輪追加 `nutmeghalves`（肉豆蔻切面），目錄618→619種：低粗深外皮圍住近平淺棕果仁切面、扭曲深紋僅改pigment、不變成凸凹脈溝。0.12 m opaque dielectric tile、metallic0，沿 neutral opaque backing／四圖／選用height／ownership；風格化種子切面，不新增geometry、透明／transmission、食物／植物／烹煮或物理模擬；依功能驗證提交、不push。

同輪追加 `coaxialcablecuts`（同軸電纜切面），目錄619→620種：同平面銀色中央導體／淡色介電層／四十個isolated屏蔽線截面／黑外皮；導體與屏蔽線metallic1、介電層／外皮／neutral opaque外背metallic0、預設factor1。0.12 m opaque mixed-metal tile，沿四圖／選用height／ownership；不新增geometry、透明／transmission、真實線束、接頭、電／電磁／RF模擬、規格／安全認證；依功能驗證提交、不push。

同輪追加 `shippocloth`（七寶紋風布），目錄620→621種：深藍連續96-thread織面上奶油交疊完整圓環印花／四圓交點，印花只改pigment、不改height／roughness／AO。0.24 m opaque dielectric tile、metallic0／mortar0，沿四圖／選用height／ownership；預設256實際normal需可見雙軸細節。非seigaiha半圓tile或凸繡線，不新增geometry、透明孔、線纖維／布料／物理模擬；依功能驗證提交、不push。

同輪追加 `driedtamarindpods`（乾羅望子莢），目錄 621→622 種：四個粉粗棕殼鼓包／三個實際縮窄且較低收腰／短果梗，非既有 greenpeapods 連續尖莢內藏 seed bulges。0.32 m opaque dielectric tile、metallic 0，沿 neutral opaque backing／四圖／選用 height／ownership；不新增 geometry、透明孔、可剝殼／果肉／種子、植物／食物／烹煮或物理模擬；依功能驗證提交、不 push。

同輪追加 `conicalsampletubes`（封蓋錐底樣品管表面），目錄 622→623 種：不透明藍色管身漸縮錐底／高平滑閉蓋／較低單側連蓋帶／略高較亮粗糙霧面橢圓標籤。0.24 m opaque dielectric tile、metallic 0，沿 neutral opaque backing／四圖／選用 height／ownership；僅 stylized closed-tube shading，不新增 geometry、透明／transmission、管腔／液體／容積／開蓋／離心模擬、醫療／無菌／額定或安全認證；依功能驗證提交、不 push。

同輪追加 `botryoidalcopper`（葡萄狀天然銅風表面），目錄 623→624 種：高亮平滑正圓丘／低暗粗金屬谷，非 hammeredmetal 下凹錘痕；整面連續金屬包括谷隙 metallic1、預設 factor1／mortar0。0.16 m opaque full-metal tile，沿四圖／選用 height／ownership；風格化 seeded nodules、不認證真礦樣，不新增 geometry、粒子／晶體成長／冶金／化學或物理模擬；依功能驗證提交、不 push。

同輪追加 `pencilshavings`（鉛筆削花），目錄 624→625 種：16 個 seeded rotated 半環木扇、12 道放射皺褶／深色較平滑外緣漆層；不是 pencilends 六角木截面／中央石墨。漆邊僅 color／roughness，沿同一 corrugated height／AO；半環內／外及開口均為 opaque neutral backing、非透明孔。0.16 m opaque dielectric tile、metallic 0，沿四圖／選用 height／ownership；不新增 geometry、粒子／真木屑、彎曲／削鉛筆／損壞或物理模擬；依功能驗證提交、不 push。

同輪追加 `papayacuts`（木瓜切面），目錄 625→626 種：seeded rotated 窄外皮／高亮厚橙果肉／低長橢圓種腔／28 顆獨立凸起深色種子；非 passionfruitslice 各自 jelly sacs 中的 kernel pigment。高度順序 flesh>seed>pit，kernel 改 height／roughness／AO、非黑點假種子或穿孔。0.16 m opaque dielectric tile、metallic 0，沿完整 body mortar／neutral backing／四圖／選用 height／ownership；風格化 bounded seed layout，不新增 geometry、透明／transmission、液體／成長／切割／腐敗或物理模擬；依功能驗證提交、不 push。

同輪追加 `sewingthimbles`（銀色頂針表面），目錄 626→627 種：封圓頂／上窄下寬 silver-colored body／24 盲凹點／較高平滑更寬下捲邊，非 crowncaps 齒緣圓蓋或 knurledmetal 交叉菱紋。盲凹點低暗粗、仍同 body/rim metallic 1、不是 metallic 0 打孔；完整 silhouette mortar 0、預設 factor 1、backing M0。0.16 m opaque metal/dielectric tile，沿四圖／選用 height／ownership；僅 front-face shading，不新增 geometry、透明孔、真內腔、縫紉／穿刺／碰撞／變形／物理模擬或防護額定；依功能驗證提交、不 push。

同輪追加 `boullebrassinlay`（布爾風黃銅捲草鑲嵌），目錄 627→628 種：鏡像連續 S 捲紋／兩橢圓端飾 M1、雲斑仿玳瑁 synthetic resin matrix M0，非全木 bowtie repair key 或全金屬 damascus strata。Metal/resin 共用拋光 height／AO1／整面 mortar 0、無鑲嵌台階或 AO 溝，金屬較亮且略粗、非金漆；預設 factor 1。0.24 m opaque tile，沿四圖／選用 height／ownership，重用現有 acetate pigment 預算；僅風格化 brass/synthetic-resin surface，不新增 geometry、真玳瑁／真材質來源、透明／transmission、體積／製作／修復或物理模擬；依功能驗證提交、不 push。

同輪追加 `diamondpanelparquet`（四斜接框菱形拼木），目錄 628→629 種：四 mitered frame boards、45° square-grid clipped diamond field、交替 board-local diagonal grain、低暗粗連續木縫；非 logcabin 螺旋板或 chevron V板，不冒稱歷史 Versailles layout。0.8 m opaque dielectric panel，M0／整面含 joints mortar 0，沿現有木拼板的暗色自帶 joint 而非 neutral grout，四圖／選用 height／ownership 不變；不新增 geometry、真板／位移、地板碰撞／鋪設／變形或物理模擬；依功能驗證提交、不 push。

同輪追加 `dendriticfrost`（樹枝狀霜晶），目錄 629→630 種：16 個 seeded rotated 六主枝／24 個 60° sidebranches、相連的高亮粗 opaque ice，smooth dark-blue continuous face，非 snowflaketiles 共面印花或 frost broad angular noise fans。0.12 m opaque dielectric tile、M0／全 mortar 0，沿四圖／選用 height／ownership；重用 squared capsule projection convention，固定 axes與完整 compact branch-owner budget，不新增 geometry、透明／transmission、晶體成長／天氣／積雪／融化或物理模擬；依功能驗證提交、不 push。

同輪追加 `bullionknots`（長形纏線繡結），目錄 630→631 種：16 seeded rotated elongated rounded golden yarn bodies、各十二 transverse raised wraps，連續低槽不切開 yarn／cloth。非 frenchknots 兩圓環凹心小結或 crossstitch 交叉線；實際 height／roughness／AO／color 皆隨 coil 起伏。0.12 m opaque dielectric tile、gold-colored yarn 非 metal，M0／含 dark-blue woven cloth 全 mortar 0，沿四圖／選用 height／ownership。不新增 geometry、真螺旋線／yarn拓撲、布料透明洞、針／線／布料／縫製／物理模擬；依功能驗證提交、不 push。

同輪追加 `orecchiette`（耳形麵），目錄 631→632 種：16 seeded rotated cupped golden semolina faces、連續高 rolled rim、偏心較低暗粗 opaque bowl，非 ravioli 凸餡枕、macaroni 短彎管或透明洞。0.16 m opaque dielectric tile、M0／dough face mortar 0、外 backing mortar 1，沿四圖／選用 height／ownership；不新增 geometry、真麵形／位移／厚度／洞、烹煮／吸水／變形／食品／物理模擬。依功能驗證提交、不 push。

同輪追加 `solderlessbreadboard`（免焊麵包板表面），目錄 632→633 種：白 opaque plastic face、16 rows×左右各5方形blind recesses（160）、獨立較低連續central trough，四方向白橋完整，非無間斷均勻perforated grid。0.04064 m tile，孔pitch0.0625 UV對應2.54 mm，兩內列中心距7.62 mm；M0／含floors及trough全mortar 0，沿四圖／選用height／ownership。不新增geometry、真洞／hidden metal contacts／電源軌／標號／接線、電路／電氣／插拔／物理模擬；依功能驗證提交、不push。

同輪追加 `kyaniteblades`（藍晶石風解理板束），目錄 633→634 種：16 seeded rotated bundles、各三 parallel blades、長短階差 oblique ends、每板三條實際凸 longitudinal striae、高亮較smooth藍blade／低暗粗continuous matrix。非 lepidolitemica 多層hexagonal plates或pigment條紋；0.16 m opaque dielectric tile，M0／含matrix全mortar 0，沿四圖／選用height／ownership。僅kyanite-inspired stylized surface，不認證礦物鑑定／結晶學或真anisotropic optics，不新增geometry、透明／transmission、晶體成長／解理斷裂／物理模擬；依功能驗證提交、不push。

同輪追加 `internaltoothwashers`（內齒止動墊圈），目錄 634→635 種：16 seeded rotated closed silver-colored outer rims、12 inward metal teeth／6高6低交替實際bend、opaque star-shaped recess。非splitlockwashers單裂口或sawblades外鋸齒；0.16 m opaque tile、factor 1／M1涵ring與teeth，孔與外backing M0，沿四圖／選用height／ownership。不新增geometry、真透明洞、彈簧／預緊／防鬆／變形／機械／物理模擬；依功能驗證提交、不push。

同輪追加 `driedchillies`（乾辣椒），目錄 635→636 種：16 seeded rotated quadratic-curved／strongly tapering red fruits、實際低暗粗shrivel wrinkles、較高olive-green calyx／connected thin stem，非bellpepperslice切面或straightcapsule repaint。0.16 m opaque dielectric tile、M0／body-stem-calyx完整coverage／exterior backing mortar 1，沿四圖／選用height／ownership。不新增geometry、植物成長／乾燥／食品／烹調／物理模擬；依功能驗證提交、不push。

同輪追加 `utilityknifeblades`（梯形美工刀片），目錄 636→637 種：16 seeded rotated銀色trapezoidblades、兩spine indexing notches露opaque backing、下方連續較低平滑亮honededge仍M1。非圓sawblade或cutlery beadborder，真height／roughness／color／AO變化而非silverpaint；0.24 m tile、factor 1／metalface M1／notches與exterior backing M0，沿四圖／選用height／ownership。不新增geometry、真洞／利刃、切割／磨刀／磨耗／工具／物理模擬；依功能驗證提交、不push。

同輪追加 `windmillparquet`（五板風車拼木），目錄 637→638 種：中央木方板周圍四根長板，木紋隨各板長軸旋轉，接縫較低、暗、粗糙且仍為木質。重用既有 windmillpavers 五矩形 owner 佈局與 logcabinparquet 的 board-local 8×96 各向異性木紋方式，不另宣稱新拼法；長板跨過內部單位格線仍完整，不冒出假縫。0.8 m tile、全 M0／mortar0，沿用四圖、選用 height 與 ownership；不新增 geometry、安裝施工、歷史真實性或物理模擬。依功能驗證提交，不 push。

同輪追加 `bismuthhoppers`（六層方階鉍風晶面），目錄 638→639 種：16 seeded rotated 金紫色方形晶面，六層封閉金屬階面向中央逐層降低、變暗、較粗且 AO 加深，中央露同一低平 opaque backing；非實心 pyrite cube 或圓形環，非僅色帶。0.16 m tile、factor1／階面 M1／中央及外部 M0，沿用四圖、選用 height 與 ownership；不新增 geometry、真洞、實際 iridescence／薄膜光學、晶體生長或物理模擬。依功能驗證提交，不 push。

同輪追加 `splitvanillapods`（剖開香草莢），目錄 639→640 種：九個 seeded rotated 棕色彎曲長莢，兩條連續高皮緣與封閉兩端圍住低暗粗的不透明中槽，每莢十六個較槽底高、但仍低於皮緣的深色粗籽團。曲線形狀、槽深與籽凸不是僅色帶；籽團是 stylized 群聚，不宣稱單顆真籽比例。0.6 m tile、全 M0，沿四圖、選用 height 與 ownership；不新增 geometry、真裂口、種子物件、乾燥／食物或物理模擬。依功能驗證提交，不 push。

同輪追加 `seamrippers`（藍護球拆線器），目錄640→641種：九個 seeded rotated 不對稱鋼叉，長彎漸細刃與較短藍護球刃之間露真正 backing U 槽，接連鋼頸與深藍非金屬握柄。鋼 M1、護球與握柄 M0，護球較高且較光滑於握柄，不是全銀塗色或對稱餐叉。0.6 m tile、factor1，沿用四圖、選用 height 與 ownership；不新增 geometry、真利刃／切口、拆線／縫紉／工具或物理模擬。依功能驗證提交，不 push。

同輪追加 `flakedarrowheads`（剝痕有莖石鏃），目錄641→642種：16 seeded rotated 燧石風三角點與窄莖，雙側開缺口露 opaque backing、中央高稜兩側前方 facets 各五個較低、暗、粗的斜剝痕。不是雙根鯊齒、燧石砌牆或僅色斑；0.4 m tile、全 M0，沿用四圖、選用 height 與 ownership。不新增 geometry、真利刃／洞、打製／飛行／命中／武器或物理模擬，也不宣稱考古真實性。依功能驗證提交，不 push。

同輪追加 `dandelionseeds`（冠毛蒲公英種子），目錄642→643種：九個 seeded rotated stylized 種子，十六條細乳白冠毛透過完整中央 hub 接低淡褐梗與較高棕籽，細輻之間露 opaque backing，不是十二寬花瓣的 daisy disk。0.09 m tile、全 M0，height／roughness／color／AO 區分冠毛、梗、籽，沿用四圖、選用 height 與 ownership；不新增 geometry、透明纖維／洞、植物／種子生長、風／飄飛或物理模擬，不認證微觀纖維或植物真實性。依功能驗證提交，不 push。

同輪追加 `shojipaperlattice`（不透明障子風紙木格），目錄643→644種：六乘六連續高棕木桟圍低白纖維紙面，非 trellis 的開格 backing 或變色磁磚。0.9 m tile、全 M0／mortar0，紙面有 formation／tooth／雙向纖維細起伏與高粗糙度；木桟較高、暗、平滑，木紋隨水平／垂直桟旋轉，交點延續水平木紋且不疊加雙倍高度。沿用四圖、height、Worker／cache／tint 與 ownership；僅不透明程序表面，不新增 geometry、透光／透明、紙張散射、實體榫接或安裝／建築認證。

同輪追加 `nyloncableties`（尼龍束帶），目錄644→645種：九 seeded rotated cream 束帶，一個較寬有開口的圓角鎖頭接長窄帶、十七個真正高起且暗平滑的橫向棘齒與漸細尾端，非金屬電氣接點或雙窗 pinless buckle。0.6 m tile／0.004 m relief、全 M0，head／strap／tooth／opaque opening backing 由四圖與選用 height 區分，沿用 Worker／cache／tint／ownership；僅 stylized 表面，不新增透明洞、束線／棘輪／鎖緊／承載物理、geometry 或產品安全認證。

同輪追加 `weavingshuttles`（舟形織梭），目錄645→646種：九 seeded rotated 尖舟木框與縱向木紋，中央低乳白線筒含十二個真正高亮平滑橫向繞紗，繞紗遮住金屬軸中央、兩端露 M1，兩側保留真低 opaque backing 空隙，非獨立 threadspools、木匙或雙窗扣。0.6 m tile／0.004 m relief，木框最高、線筒次之、軸較低；沿用四圖／height／Worker／cache／tint／ownership，不新增透明洞、geometry、織造／送紗／張力物理或工藝認證。

同輪追加 `tailorstapes`（無數字裁縫尺帶），目錄646→647種：四條連續乳白織布帶，雙側各100個黑刻度位置，每十格含八短、一中、一長，中央保留完整無印布面，非 graphpaper 的交叉格線或純色 pinstripe。沿用 warp/weft compact exposure 與印墨分層；0.1 m tile／0.001 m relief，全 M0，織布細起伏、較平滑黑墨與低 opaque backing 分離。沿用四圖／height／Worker／cache／tint／ownership，不新增字型／數字、量測 API、真實校準、布料物理或 geometry。

同輪追加 `woodenclothespins`（木衣夾），目錄647→648種：九 seeded rotated stylized 開口木衣夾，兩片連續縱紋木夾片、前後展寬中縫及三道較高亮平滑金屬 spring wraps。縫與繞圈之間露真低 opaque backing；非單木火柴或線筒／織梭，M0 wood/backing、僅 spring M1，公開 factor1 保留混合圖。0.6 m tile／0.004 m relief，沿用四圖／height／Worker／cache／tint／ownership，不新增透明洞、geometry、鉗合／彈簧／力學／夾持模擬或產品安全認證。

同輪追加 `cinnamonbarkcoils`（開放肉桂樹皮捲），目錄648→649種：九 seeded rotated 捲端面，三圈半連續高暖棕螺旋、較低暗粗外皮、中央及圈間真低 opaque backing 空隙，非實心 cinnamonswirl pastry 或同心環。0.09 m tile／0.003 m relief、全 M0，四圖與 height 區分切面／外皮／空隙，沿用 Worker／cache／tint／ownership；不新增透明洞、geometry、捲曲／食品物理或植物真實性認證。

同輪追加 `compactcassettefaces`（卡式錄音帶端面），目錄649→650種：九 seeded rotated 黑圓角殼、雙低中空六輻塑膠捲盤、高乳白空白紙標籤、下方中央磁頭孔及兩導孔，磁頭孔內可見較低磁帶，開口露 opaque backing，非 filmstrip perforation 圖或可播放音訊。0.45 m tile／0.004 m relief、全 M0，沿用四圖／height／Worker／cache／tint／ownership；空白標籤是刻意未印字的表面，不新增字型、透明洞、geometry、錄放音／磁性／走帶物理或音訊功能。

同輪追加 `kintsugiceramic`（金繼陶瓷），目錄650→651種：十六 seeded-jitter 深青釉陶片與連續共面金屬金填縫、平滑三叉修補接點。非空裂縫或凸金線；陶片 M0／金縫 core M1／material factor1，完整填平且 AO0.99。0.32 m tile／0.0003 m relief，沿用四圖／height／Worker／cache／tint／ownership；無破裂／修補模擬、位移 geometry 或新增分層材質。實際 Chromium 雙 backend、targeted 形態及 C1 證據見 ACCEPTANCE。

同輪追加 `pleatedfilterpapers`（三十二褶濾紙），目錄651→652種：九 seeded 奶油紙濾杯端面，連續平底升高至三十二徑褶環壁，紙緣凹凸與 crest／valley 同相。微高／色／粗糙度／AO 同步變化，全 M0，非 speakercones 音盆或半圓 foldingfans。沿用四圖／height／Worker／cache／tint／ownership，0.36 m tile／0.004 m relief；不新增杯體 geometry、微孔滲透率或過濾／流體功能。實際雙 backend 與形態／C1 證據見 ACCEPTANCE。

同輪追加 `splitcedarshakes`（錯位開裂木瓦），目錄652→653種：四層半錯位各六片變寬暖棕木瓦、縱向木紋、較厚不齊下緣與兩道貫通 butt 的 seeded splits。非礦物 grit roofshingles 或 shiplap 換色；全 M0，2 m tile／0.008 m relief，沿用四圖／height／Worker／cache／tint／ownership。只作靜態木瓦表面，不新增 damage／weathering、屋頂工法認證或 geometry；雙 backend、形態及 C1 證據見 ACCEPTANCE。

同輪追加 `swavepavers`（S 形混凝土磚），目錄653→654種：四層半錯位各八塊、共三十二 cubic S 側邊混凝土磚。彎曲的是真凹縫及 height／roughness／AO／coverage，非 calcadawaves 色帶或 dogbonepavers 對稱腰形。全 M0，0.96 m tile／0.006 m relief，沿用四圖／height／Worker／cache／tint／ownership；不新增 geometry、剛體互鎖／車流模擬或施工認證，雙 backend、形態及 C1 證據見 ACCEPTANCE。

同輪追加 `mushroomslices`（蘑菇切片），目錄654→655種：九 seeded 乳白 dome／連續纖維 stalk、較低暗粗棕外皮、十二附著低暗菌褶及其間真低 opaque backing。非 mushroomgills 整面菌褶扇形；全 M0，0.18 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership 不變。不新增 geometry、透明洞、真菌生長或物種／可食性認證；雙 backend、形態及 C1 證據見 ACCEPTANCE。

同輪追加 `insulatedringlugs`（絕緣環端子），目錄655→656種：九 seeded 中空連續銀環頸平片、較高紅絕緣套及兩道低非金屬壓痕。銀片 M1／紅套與壓痕 M0／factor1，不假鍍金屬塑膠；0.18 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership 不變。不新增 geometry、電連通／導電或壓接模擬、絕緣安全／電壓認證；雙 backend、孔與壓痕形態及 C1 證據見 ACCEPTANCE。

同輪追加 `bananaslices`（香蕉切片），目錄656→657種：九 seeded 奶油橢圓切片、低而粗淡外緣、三道連續低 Y 隔膜與六成對暗種胚，非 kiwiflesh 環種子或 starfruit 五角果換色。全 M0，0.12 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership 不變；不新增 geometry、熟成／生長模擬或植物／食品認證。雙 backend、形態及 C1 證據見 ACCEPTANCE。

同輪追加 `rosemarysprigs`（迷迭香枝葉），目錄657→658種：九 seeded 連續淡莖、十六狹斜針葉與凸淡中肋，非既有寬羽狀 fernleaf 換色。全 M0，0.18 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership 不變，不新增 geometry、生長、植物或草藥／食品認證。形態、512解像度及雙backend實測見 ACCEPTANCE。

同輪追加 `pencilsharpeners`（金屬削鉛筆器），目錄658→659種：九 seeded 真圓孔金屬殼、八低握槽、高磨刃與更高一字槽螺釘，非既有 utilityknifeblades 散刃換色。全金屬M1／孔與外隙M0，0.15 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership 不變，不新增 geometry、削切力學、精密五金或安全認證。形態、512圖與雙backend實測見 ACCEPTANCE。

同輪追加 `scissors`（張開紅柄剪刀），目錄659→660種：九 seeded 雙真橢圓孔紅柄、連續銀頸、雙斜尖磨刃與高圓樞；非 utilityknifeblades 散刃或 dinnerforks 換色。紅柄M0／銀刃頸樞M1，0.25 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增geometry、活動鉸鏈、剪切力學或安全認證。形態、C1及雙backend實測見 ACCEPTANCE。

同輪追加 `serpentinesprings`（蛇形彈簧線），目錄660→661種：九 seeded 六直段、五交替真半圓 U 彎、雙圓自由端單連續銀線，非六分離條或螺旋圈。M1 wire／M0 gaps，0.2 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增geometry、螺旋彈簧構造、彈性／力學或安全認證。True line/arc join C1與雙backend實測見 ACCEPTANCE。

同輪追加 `impellerfaces`（六後掠尖葉輪），目錄661→662種：九 seeded 六後掠尖銀葉、六開扇隙、高圓環hub與真中心孔，非spurgears閉rim換色。Core M1／孔扇隙M0，0.3 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增geometry、旋轉、流體／空力或安全認證。尖端halfplane C1及雙backend實測見 ACCEPTANCE。

同輪追加 `chipresistors`（白103黑chip resistor），目錄662→663種：九 seeded 高黑矩體、雙低銀wrap端與白非金屬103，0字腔為高opaque黑body而非穿孔，非axialresistors色環換色。Black/ink M0、銀端M1，0.12 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變。103僅外觀，不新增實測阻值、電路模擬、精密元件／電氣／安全認證；512字形及雙backend見 ACCEPTANCE。

同輪追加 `memorycardbacks`（八金接點記憶卡背面），目錄663→664種：九 seeded 八低金接點、七高黑絕緣隙、真右上削角與右側key notch，非flatflexcables色換板。金pad M1／高黑殼M0／cut低backing，0.15 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變；無品牌logo，不新增儲存存取、電路、精密尺寸、SD規範或資安／電氣／安全認證。C1及雙backend見 ACCEPTANCE。

同輪追加 `gnocchi`（七彎叉槽撒粉奶油橢枕），目錄664→665種：九 seeded 圓冠奶油橢枕、七真正彎曲低叉槽與flour色粗變化，非ravioli／orecchiette換色。全M0／full dough mortar0，0.12 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增geometry、烹煮／生長模擬或食品／安全認證。Curved-vs-old-straight控制及雙backend見 ACCEPTANCE。

同輪追加 `rectangularsocketfaces`（四銀接點矩形插座），目錄665→666種：九 seeded 閉銀框／真正低開口／高opaque黑舌／四更高銀pins，非記憶卡換色。銀框與contacts M1、黑舌M0且皆full-core mortar0；低口腔backing M0／mortar1，0.09 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增port geometry、電氣I/O、精密尺寸、USB或電氣／安全認證；closed ring／four contacts／open cavity／雙backend見 ACCEPTANCE。

同輪追加 `saffronthreads`（同根三彎紅絲擴圓尖藏紅花），目錄666→667種：九 seeded 同一完整root三曲線red threads、三擴圓尖／兩真低叉隙，非rosemary直針換色。Fixed-three warped capsules與product-complement crown/coverage unions保留同根M0／full cores mortar0。0.06 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增flower geometry、生長／烹煮模擬或食品／安全認證；core0.75→0.71保留原finite-differential guard，形態與雙backend見 ACCEPTANCE。

同輪追加 `fishhooks`（真眼環連續銀J倒鉤），目錄667→668種：九 seeded closed true-eye ring／straight shank／lower semicircular bend／tapered upper point及inward barb，非carabiner／safety pin換色。Bounded unions與全組件bore subtraction保持一連續M1／full cores mortar0鉤及真低眼孔／向上開放中腔；0.15 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增鉤體geometry、釣魚physics、強度或安全認證；三seed path／512／C1／雙backend見 ACCEPTANCE。

同輪追加 `violinfholes`（鏡對三次曲線f孔暖木紋），目錄668→669種：九 seeded pairs共十八低S孔，各端圓眼／兩側缺刻，非直線painted f。Five-value poses／world-periodic96×12 grain與128² fine避免cell背景seams，高木及低深棕腔皆M0／mortar0。0.45 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增violin／穿孔geometry、音源合成、聲學模擬或樂器認證；cubic-vs-straight／nick／端眼／512／C1／雙backend見 ACCEPTANCE。

同輪追加 `palmiers`（心形雙焦糖螺旋蝴蝶酥），目錄669→670種：九 seeded 金心pastries、雙真mirrored recessed caramel coils／central fold／notched double crown／tapered lower point，非同心環或cinnamon bun換色。Compact origin-owner windows／整數phase wraps／一eligible atan2，兩完整兩turn traces與same-radius opposite-angle crumb controls驗真螺旋；full body M0／mortar0非孔。0.18 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增pastry geometry、烘焙／生長模擬或食品／安全認證；512／C1／雙backend見 ACCEPTANCE。

同輪追加 `barbedwire`（雙線真交替高低四尖倒刺鐵絲），目錄670→671種：四seamless rows／每兩線真交替over-under heights／高collars／十六knots各四連尖barbs。Reuse C2 quartic與tangent widths，quarter-depth非figure-eight；正確前後alpha composition不疊交點height，full collar遮quad-owner cusp，full metal M1／mortar0而gaps低M0。0.4 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增fence geometry、mechanics或負載／強度／電氣／安全認證；連續paths／512高度序／C1／雙backend見 ACCEPTANCE。

同輪追加 `oxfordweave`（牛津紡），目錄671→672種：成對藍色經紗／淺色緯紗以二上二下的籃式結構交錯，圓潤紗冠與低露出紗線具實際height差，區別於單紗linen與實心basketweave條帶。0.08 m tile／0.001 m relief，opaque dielectric、metallic 0，沿用四圖／height／Worker／cache／tint／ownership。前671種輸出保持不變，不新增紗線geometry、透孔或布料模擬；依功能驗證後commit、不push，證據見 ACCEPTANCE。

同輪追加 `lacewood`（蕾絲木紋），目錄672→673種：直向暖木紋上散佈大小、斜度及輕微彎曲各異的淺色長木射線斑，並非鳥眼節眼或隆起鱗片。0.35 m tile／0.001 m relief，opaque dielectric、metallic 0；木射線以pigment／roughness呈現，保持近乎平整。前672種maps、公開options、Worker／cache與ownership不變，不新增木材geometry或anisotropic shader；依功能驗證後commit、不push，證據見 ACCEPTANCE。

同輪追加 `papyrus`（莎草紙），目錄673→674種：八條直向上層寬草條壓覆於橫向下層，窄接邊露出較低草條與更低但不透明的紙底，搭配長纖維及成紙雲紋。上層始終在上而非交替編織，full top跳過隱藏下層取樣。0.3 m tile／0.0015 m relief、opaque dielectric／metallic 0，前673種maps、公開options、Worker／cache及ownership不變，不新增geometry、透孔或造紙模擬；依功能驗證後commit、不push，證據見 ACCEPTANCE。

同輪追加 `larimar`（拉利瑪石），目錄674→675種：相互融合的藍色礦物雲塊、乳白間隙與淺色彎曲纖維脈，區別於綠松石暗網脈與瑪瑙同心帶。6×6 seeded rotated pools以bounded product unions混合，保留同一拋光平面；0.25 m tile／0.001 m relief、opaque dielectric／metallic 0。前674種maps、公開options、Worker／cache及ownership不變，不新增晶體geometry、透光、SSS或anisotropy；依功能驗證後commit、不push，證據見 ACCEPTANCE。

同輪追加 `paperbark`（紙皮樹皮），目錄675→676種：seeded錯位的淡色薄片、波狀撕邊、真正抬高的單側下捲唇與下方暗縫，露出仍opaque的纖維底皮。區別於白樺黑色皮孔、懸鈴木平坦斑片與厚樹皮縱裂；0.4 m tile／0.002 m relief、M0／mortar0，既有675種maps與公開options／Worker／cache／ownership不變。不新增geometry、displacement或剝落模擬；驗證後依功能commit、不push，證據見 ACCEPTANCE。

同輪追加 `horseshoes`（金屬馬蹄鐵），目錄676→677種：九枚交替朝向、seeded微轉的連續U形鐵件，各有六個低釘孔、開口跟部及低於兩側邊緣的連續fuller槽。Toe arch與直分支C1連接，孔／中央開口為低opaque M0底面、鐵件M1、mortar0；0.6 m tile／0.01 m relief，公開factor1。前676種maps與options／Worker／cache／ownership不變，不新增geometry、透明孔洞、碰撞或馬匹物理；依功能驗證commit、不push，證據見 ACCEPTANCE。

同輪追加 `durianpeel`（榴槤果皮），目錄677→678種：64枚錯列、seeded旋轉與半徑變化的六面漸尖刺坡，圓化脊線、柔化尖端與連續olive rind。沿六平面的linear slopes而非圓形bumps或四面泡棉，尖頂比底皮高>7 mm；opaque M0／mortar0、0.24 m tile／0.012 m relief。前677種maps及options／Worker／cache／ownership不變，不新增刺狀geometry、displacement、透明孔洞或果實模擬；驗證後依功能commit、不push，證據見 ACCEPTANCE。

同輪追加 `flystitch`（飛針繡），目錄678→679種：36組交替朝向的淺色Y形V雙臂及短固定莖，抬高於深色細織底布，交會處不疊高度。三個rounded yarn profiles以product union連續相接，192條quartic細織紋不逐點trig；全opaque M0／mortar0、0.12 m tile／0.0012 m relief。前678種maps與options／Worker／cache／ownership不變，不新增線geometry、透孔、針線或布料模擬；驗證後依功能commit、不push，證據見 ACCEPTANCE。

同輪追加 `abaloneshells`（鮑魚殼內面），目錄679→680種：九枚seeded旋轉的彎耳形凹面、較高殼緣、靜態淺色生長帶與單側五個低呼吸孔。相對另一側完整殼面與孔間橋保留連通，非凸殼dome或中央長裂縫；opaque M0／mortar0、0.45 m tile／0.006 m relief。前679種maps及options／Worker／cache／ownership不變，不新增geometry、透明孔洞、虹彩／thin-film shader或貝類模擬；驗證後依功能commit、不push，證據見 ACCEPTANCE。

同輪追加 `gyroidinfill`（gyroid截面填充紋），目錄680→681種：seeded雙軸平移的橘色連續圓頂曲帶與低opaque底面。採精確`z=π/4` implicit field等值帶，保留兩支解析輪廓與saddle接點，非網格生成器；M0／mortar0、0.16 m tile／0.0015 m relief。前680種maps及options／Worker／cache／ownership不變，不新增3D lattice geometry、mesh輸出、displacement、透孔或列印模擬；驗證後依功能commit、不push，證據見 ACCEPTANCE。

同輪追加 `cloisonne`（六瓣掐絲琺瑯），目錄681→682種：九朵seeded旋轉花、各六閉合黃銅瓣框與中心環，高金屬絲包圍較低青藍非金屬琺瑯。opaque／mortar0、factor1、0.18 m tile／0.001 m relief；前681種maps與既有options／Worker／cache／ownership不變，不新增geometry、透明玻璃、transmission、薄膜shader或燒製模擬。驗證後獨立commit、不push，證據見 ACCEPTANCE。

同輪追加 `rambutanskin`（紅毛丹果皮），目錄682→683種：144根seeded旋轉與jitter的彎曲漸尖果毛、自抬高根瘤長出，紅色低底皮連續不挖空；不同於榴槤六面尖刺或藏紅花三叉散絲。全opaque M0／mortar0、0.12 m tile／0.0035 m relief。前682種maps與既有options／Worker／cache／ownership不變，不新增hair geometry、displacement、透明縫、SSS或生長／果實模擬。驗證後獨立commit、不push，證據見 ACCEPTANCE。

同輪追加 `rackgears`（七齒直齒條），目錄683→684種：九枚seeded旋轉銀色直齒條，各七梯形齒尖連在完整齒根、雙低安裝孔及連續低縱加工槽；非圓形spur gear或交錯zipper。實體M1／低底與孔M0、全opaque／mortar0、factor1、0.6 m tile／0.007 m relief；前683種maps與options／Worker／cache／ownership不變，不新增geometry、透明孔、齒輪嚙合、involute精密工程模型或機械模擬。驗證後獨立commit、不push。

同輪追加 `poplin`（細經粗緯府綢），目錄684→685種：48細經／24粗緯、單紗一上一下交錯，玫瑰色棉紗呈較寬橫向緯肋與較細密經紗，非牛津紡成對2×2。高低lift是真height差，不只換色；全opaque M0／mortar0、0.016 m tile／0.0003 m relief。前684種maps及options／Worker／cache／ownership不變，不新增紗線geometry、透明織孔、cloth physics或anisotropy shader。驗證後獨立commit、不push。

同輪追加 `ooliticlimestone`（磨面鮞粒石灰岩），目錄685→686種：淡暖石灰基質內144枚seeded大小／偏移鮞粒、3或4道同心皮殼與較暗核；雙軸periodic warp打散直列。皮殼／核僅pigment，不做凸珠或凹洞；全opaque M0／mortar0、AO1、0.024 m tile／0.00012 m relief，整面微高差上限0.24 μm。前685種maps與options／Worker／cache／ownership不變，不新增geometry、displacement、透光或地質生長模擬。驗證後獨立commit、不push。

同輪追加 `ogeetiles`（對稱S曲燈籠磚），目錄686→687種：6×6交錯青綠釉面磚，以互補cubic半寬形成上下尖端、寬中段與兩側閉合S曲邊；連續灰縫真低、釉面真高，不是波浪矩形磚。全opaque M0、0.72 m tile／0.004 m relief；前686種maps及options／Worker／cache／ownership不變，不新增geometry、displacement、透明縫、施工或釉面光學模擬。驗證後獨立commit、不push。

同輪追加 `bittermelonskin`（縱肋圓疣苦瓜表皮），目錄687→688種：十二條平緩warp的完整縱肋、96枚seeded大小／偏移圓鈍疣粒及相連低綠溝；疣高於肋、肋高於溝，非榴槤尖刺或哈密瓜網紋。全opaque M0／mortar0、0.18 m tile／0.0045 m relief；前687種maps與options／Worker／cache／ownership不變，不新增果實geometry、displacement、透明孔、SSS或生長模擬。驗證後獨立commit、不push。

同輪追加 `cocobolo`（橙紅深紋心材），目錄688→689種：橙紅底色內寬深流紋、細暗紋與縱向纖維，四份cached periodic noise共用平緩warp。深紋只是pigment，不做凸肋或凹裂，磨面微高差≤0.32 μm／AO1；全opaque M0／mortar0、0.24 m tile／0.00016 m relief。前688種maps及options／Worker／cache／ownership不變，不新增geometry、displacement、SSS、anisotropy shader或木材生長模擬。驗證後獨立commit、不push。

同輪追加 `doubleedgerazorblades`（雙刃三圓連槽刀片），目錄689→690種：九枚seeded旋轉銀色雙刃刀片、四角低缺口、三圓瓣連成完整中央低槽、兩側更低更亮更平滑的長研磨面。鋼面M1／低底槽M0，全opaque／mortar0、factor1、0.18 m tile／0.0003 m relief；前689種maps及options／Worker／cache／ownership不變。不新增geometry、透明孔、切割、碰撞或機械模擬，驗證後獨立commit、不push。

同輪追加 `chiastolite`（深十字空晶石），目錄690→691種：九枚seeded旋轉褐色晶體切面、四個暖色象限、由中心連接且向外漸寬的四條深色石墨質十字臂。晶體與包裹體只是pigment，共同磨面微高差≤0.24 μm／AO1，不做凸塊或刻溝；全opaque M0／mortar0、0.12 m tile／0.00012 m relief。前690種maps及options／Worker／cache／ownership不變，不新增geometry、displacement、透光或礦物生長模擬，驗證後獨立commit、不push。

同輪追加 `dimity`（成對高經肋細平紋棉布），目錄691→692種：48×48單紗一上一下，每八經紗含兩粗高cord與六細經紗，共六對縱肋；象牙棉紗與連續緯紗真高低，非Oxford雙向成對或只直條pigment。全opaque M0／mortar0、0.02 m tile／0.0003 m relief；前691種maps與options／Worker／cache／ownership不變，不新增紗線geometry、透明織孔、cloth physics或anisotropy shader，驗證後獨立commit、不push。

同輪追加 `juniperberries`（藍灰果霜杜松果），目錄692→693種：16枚seeded旋轉圓果頂、三條真低放射鱗縫與較低中央scar，藍灰霜色非胡椒皺紋。全opaque M0／mortar0、0.064 m tile／0.006 m relief；前692種maps與options／Worker／cache／ownership不變，不新增果實geometry、透明果肉、SSS或生長模擬，驗證後獨立commit、不push。

同輪追加 `gabbro`（粗晶輝長岩），目錄693→694種：深色輝石質粗晶間鑲嵌淡斜長石晶粒與細平行光學雙晶帶，非細粒花崗岩或凹縫碎石。共同磨面微高差≤0.24 μm／AO1；全opaque M0／mortar0、0.18 m tile／0.00012 m relief。前693種maps與options／Worker／cache／ownership不變，不新增晶體geometry、displacement、透光或地質模擬，驗證後獨立commit、不push。

同輪追加 `turnbuckles`（雙眼螺紋花籃螺栓）新增九枚seeded旋轉鋼件：閉合中央長框、真低框心、兩側連接螺桿與閉合眼環，孔洞維持opaque非金屬暗底而非透明。雙側鏡像細螺紋具有較低高度、較暗色與較高粗糙度；金屬mask乘factor1。0.24 m tile／0.003 m relief、mortar0；沿用height、tint、repeats、Worker／cache與ownership，不新增幾何、穿孔、displacement或機械模擬。 目錄694→695種，驗證後獨立commit、不push。

同輪追加 `rhodochrosite`（菱錳礦）加入粉紅基質、六組寬白波狀層帶與細伴生帶，非瑪瑙閉合環。3×3與9×3 cached noise扭曲連續六週期相位，compact squared寬／細肩部保持C1；12² pigment與128² grain分離色澤及磨面。層帶只改pigment／roughness，共同磨面微高差≤0.24 μm、AO1，全opaque M0／mortar0、0.18 m tile／0.00012 m relief。沿用height、tint、repeats、Worker／cache及ownership，不新增晶體geometry、displacement、透光或地質模擬。 目錄695→696種，驗證後獨立commit、不push。

同輪追加 `bayleaf`（月桂葉）加入九枚seeded旋轉的橄欖綠尖橢圓平滑葉片、短葉柄、高中脈、七對向葉尖彎曲的側脈與細邊緣脈。沿用compact葉片／葉柄coverage；軸線fade消除abs側脈座標的尖點，平方輪廓與smooth肩部維持C1。四值pose、七個root與128² grain在setup快取，grain物理微高差≤6.4 μm，低於側脈40 μm，避免微粒遮蔽葉脈。全opaque M0／mortar0、0.24 m tile／0.0016 m relief，沿用height、tint、repeats、Worker／cache與ownership；不新增葉片geometry、透明cutout、SSS或植物模擬。 目錄696→697種，驗證後獨立commit、不push。

同輪追加 `gabardine`（軋別丁）新增卡其色密經二上一下經面陡斜紋。沿用poplin compact yarn coverage／crossing lift／fiber路徑，但48經×24緯的三格draft逐緯移一經，斜向pitch約63.4°，非1×1平紋或2×2等距斜紋。經radius／core0.495／0.44、緯0.25／0.18，密經遮住大部分底；經緯共同base0.34／crown0.04、±0.1 lift在owner切換前平滑歸零。192／96-frequency fibers與128² grain沿用快取，無逐點配置或trig。全opaque M0／mortar0、0.018 m tile／0.0003 m relief；height、tint、repeats、Worker／cache與ownership不變，不新增紗線geometry、透明孔洞或布料模擬。 目錄697→698種，驗證後獨立commit、不push。

同輪追加 `oilspotglaze`（油滴黑釉）加入黑褐亮釉上的64枚seeded橢圓鐵氧化物晶斑、褐色內部、較亮環緣與細晶pigment。七值pose快取cos／sin、雙offset、雙逆半徑平方與tone；最大radius0.34加jitter0.1<0.5，compact斑面與rim smooth肩部在owner前C1歸零，無逐點配置／hash／trig／sqrt。128² grain供共同釉面微高差≤0.24 μm，64² crystal只供色澤，AO1；亮褐斑仍是介電釉下色而非金屬環。全opaque M0／mortar0、0.16 m tile／0.00012 m relief，沿用height、tint、repeats、Worker／cache與ownership；不新增晶體geometry、displacement、透光或窯燒模擬。 目錄698→699種，驗證後獨立commit、不push。

同輪追加 `persimmonslice`（柿子切面）新增九枚seeded旋轉橙色圓切面、八向分離深籽、淡色中心與細深色外皮。沿用水果flush cut契約：籽／果肉／皮共平面、grain微高差≤8 μm，籽僅改色與粗糙度，不假冒凹孔。四值pose、八組axis、128² grain及inverse squared常數在setup快取；radius0.38加jitter0.025<0.5，圓面／皮／pith／ellipse種籽compact smooth肩部C1，逐點無配置／hash／trig／sqrt。全opaque M0／mortar0、0.24 m tile／0.002 m relief；height、tint、repeats、Worker／cache與ownership不變，不新增水果geometry、透明果肉、SSS或生長模擬。 目錄699→700種，驗證後獨立commit、不push。

同輪追加 `kitkattiles`（細長凹面釉磚）新增24欄×4列直疊玉綠finger tiles，6:1 pitch、沿長向真正低凹槽與等UV寬灰縫，非凸木條或一般平地鐵磚。沿用subwaytiles四邊compact smooth face／mortar，橫向平方smooth凹槽在兩端fade，中心比肩部低0.48 mm；grain微高差≤6 μm。96個owner tone與128² grain快取，逐點無配置／hash／trig／sqrt。全opaque M0、mortar=1-face，0.6 m tile／0.003 m relief；沿用height、tint、repeats、Worker／cache與ownership，不新增geometry、displacement、透明或鋪磚模擬。 目錄700→701種，驗證後獨立commit、不push。

同輪追加 `brakediscs`（雙圈鑽孔煞車碟）新增九枚seeded旋轉銀色碟面、中央低孔、五個安裝孔、兩圈各12個錯半步通風孔、較高中轂與細同心磨耗紋。孔與碟外維持opaque M0暗底，鋼面mask乘factor1。沿用bearing squared annular face與compact hole肩部；兩值pose、29孔三值座標與128² grain在setup快取，逐點無配置／hash／trig／sqrt。磨耗用r²週期compact帶，無中心奇點，僅4 μm低紋，不以粗槽冒充研磨。mortar0、0.72 m tile／0.004 m relief，height、tint、repeats、Worker／cache及ownership不變；不新增幾何、透明穿孔、displacement或煞車物理。 目錄701→702種，驗證後獨立commit、不push。

同輪追加 `mulberrypaper`（手工桑皮紙）新增暖米色雲狀紙漿、192條任意旋轉長彎韌皮纖維與少量棕色內含物，非編織條帶或折紙。沿用紙材compact additive neighborhood概念，以明／暗兩個complement union避免交叉纖維無界堆高；8×8格每格三纖維各八值快取，3×3固定lookup、無逐點配置／hash／trig／sqrt。最長half-length0.9、曲偏≤0.04、寬≤0.03，support<0.942；省略格最近1.15，owner切換前C1消失。兩端envelope²與側cap²平滑漸尖，fiber lift≤7 μm、總微高差≤13.6 μm／AO1。全opaque M0／mortar0、0.16 m tile／0.0002 m relief；height、tint、repeats、Worker／cache與ownership不變，不新增纖維geometry、透明紙、SSS或造紙模擬。 目錄702→703種，驗證後獨立commit、不push。

同輪追加 `howlite`（白松石）新增象牙白礦塊與細灰色不規則網狀基質脈。12×12抖動site各兩值快取，雙4²週期warp扭曲礦塊；3×3 compact radial八次權重的normalized overlap產生網脈，不使用最近site切換或把色脈挖成溝槽。support1.2小於省略格最近1.3，權重C1消失且全域覆蓋避免除零；無逐點配置／hash／trig／sqrt。共磨平面高度僅有≤0.2 μm微粒、AO1，灰脈只調色與roughness。0.24 m tile／0.0001 m relief、全opaque M0／mortar0；不新增geometry、透明裂縫、displacement或礦物模擬，沿用options／Worker／cache／ownership。

同輪追加 `ottoman`（成對粗緯橫肋織物）新增細經紗束縛成對粗緯pick的紫色橫向凸肋與低肋間隙。沿用poplin／gabardine的compact yarn coverage、漸消lift與纖維路徑；48經／24緯，連續兩緯共用draft、下一對反轉，相鄰經交替。每對緯中心向內偏0.1 pitch，對內距0.8／對間1.2；weft support0.38與lift half0.36均小於owner邊界最近0.4，保持C1。0.18 lift使交叉處上紗確實高於下紗；較高粗緯base／crown形成橫肋。0.024 m tile／0.0004 m relief、全opaque M0／mortar0；不新增geometry、透明紗隙、各向異性或布料模擬，沿用options／Worker／cache／ownership。

同輪追加 `shackles`（U形弓橫銷卸扣）新增九枚seeded旋轉銀色卸扣：圓管U形弓、兩個加大端boss、單一較高橫銷與帶小孔扁銷頭。沿用隔離hardware pose快取與compact union／normalized height，避免連接處重疊厚度加倍；上半圓與兩直腿以連續最近曲線距離銜接，每點一個必要hypot，無逐點配置／hash／trig。所有支撐連同jitter位於tile owner內；圓弓、boss、橫銷、銷頭與孔皆C1。中央與銷頭小孔為opaque M0暗底、metal面mask乘factor1、mortar0；0.6 m tile／0.004 m relief。未新增geometry、透明孔、displacement、螺紋操作或承載物理，沿用options／Worker／cache／ownership。

同輪追加 `watercaltrops`（雙彎角菱角果殼）新增九枚seeded旋轉黑褐色圓殼、兩條對稱上彎漸尖角、細縱皺與低果柄疤。沿用rambutanskin compact曲線漸尖support與isolated pose快取，改為連接果殼的成對粗角；smooth彎曲中心線、有限tip width及根／尖端C1 fade，bounded union／normalized relief避免根部堆高。保守support半徑<0.465，連同jitter仍小於0.5；無逐點配置／hash／trig／sqrt。0.24 m tile／0.003 m relief、全opaque M0／mortar0，沿用height／tint／repeats／Worker／cache／ownership；不新增geometry、透明背景、displacement或植物生長模擬。

同輪追加 `fluorite`（紫色方形色帶螢石）新增九枚seeded旋轉紫色晶面、嵌套近方形生長色帶與淡色礦物基質；不是圓環瑪瑙或raised方磚。沿用隔離晶體pose與共磨礦面路徑，每晶六值快取；八次多項式等高線避免max-axis尖角導數跳躍，4週期polynomial色帶在phase wrap C1。最大half-extent0.335、支撐半徑<0.435連同jitter仍小於0.5；無逐點配置／hash／trig／sqrt。色帶只調色／roughness，共磨平面微粒高差≤0.2 μm、AO1、opaque M0／mortar0；0.06 m tile／0.0001 m relief，沿用options／Worker／cache／ownership。不新增geometry、透明／折射、螢光、displacement或晶體生長模擬。

同輪追加 `wenge`（細長開放導管孔Wenge木）新增深褐直紋、淡色縱向薄壁組織帶與192個細長低導管孔；不是換色木紋或凸起布肋。沿用compact木材孔／cached縱向noise路徑，24×8孔各四值快取，孔半寬0.035–0.055、半長0.15–0.35皆於owner內C1漸消；三份noise快取、無逐點配置／hash／trig／sqrt。導管孔實際低32 μm、較粗糙與較低AO，淡色條帶只改顏色而不堆高；微粒高差≤1.2 μm。0.12 m tile／0.0004 m relief、全opaque M0／mortar0，沿用options／height／tint／repeats／Worker／cache／ownership；不新增geometry、透明孔、displacement、各向異性或木材生長模擬。

同輪追加 `parchment`（乳白書寫用皮紙）新增雲狀乳白底色、細縱向刮製色紋與256個任意旋轉的淺殘留毛孔，不是粗顆粒皮革或紙漿纖維。沿用compact elliptical pore／cached noise路徑，16×16毛孔各六值快取，最大support0.08小於最近owner邊界0.2；無逐點配置／hash／trig／sqrt。刮痕只調色、不刻深槽；毛孔低2.4 μm，平滑皮面雲狀高差≤3 μm加微粒≤0.4 μm，AO≥0.96。0.04 m tile／0.0002 m relief、全opaque M0／mortar0；沿用options／height／tint／repeats／Worker／cache／ownership，不新增geometry、透明／透光、displacement、文字或皮紙製程模擬。

同輪追加 `cavalrytwill`（雙道陡斜肋騎兵斜紋）新增橄欖綠粗／細成對陡斜肋。沿用poplin／gabardine／ottoman的compact yarn coverage、lift與纖維路徑，72經／36緯形成約63.4°斜向；六步draft以經面110100呈現二道不等寬wale，逐row前進一經，不把它當成歷史織法認證。經／緯radius0.495／0.25、core0.44／0.18，lift在owner邊界前C1消失；無逐點配置／hash／trig／sqrt。0.024 m tile／0.0003 m relief、全opaque M0／mortar0；沿用options／height／tint／repeats／Worker／cache／ownership，不新增geometry、透明紗隙、各向異性或布料模擬。

同輪追加 `screwhooks`（開口螺絲鉤）新增九枚銀色開口環鉤與相連漸尖螺紋桿。沿用環帶及螺紋相位的compact C1 masks，開口、環心與背景均為不透明非金屬凹面，鋼面metallic factor1；約0.00016 UV高度螺紋槽同步降低亮度／AO並提高roughness。尖端以正距離因式分解寬度，避免端點浮點消去造成除零；normalized overlap不雙加高度。0.36 m參考tile／0.004 UV relief；無逐點配置／hash／trig／sqrt，不新增geometry、透明孔洞、螺紋接合或物理模擬，沿用options／Worker／cache／ownership。

同輪追加 `nigellaseeds`（黑種草籽）新增25枚任意旋轉、細長帶三側稜角的炭黑種籽，非蕎麥殼高肋或圓形種籽。沿用三C1半平面乘積，aspect0.9／1.15、外接support≤0.368加jitter0.015小於owner0.5；每籽五值快取，128²grain與256²pore fields。細凹表皮低0.0009375 UV高度（按0.024 m參考tile換算22.5μm，非實際位移量測），同步變暗／降低AO／提高roughness；不在邊界堆高粒子。全opaque M0／mortar0、0.024 m參考tile／0.0375 UV relief，沿用options／Worker／cache／ownership，無逐點配置／hash／trig／sqrt；不新增geometry、透明孔或生物模擬。

同輪追加 `phyllite`（灰綠千枚岩）新增48道細密波狀片理與緞面雲母色斑，不是板岩階梯或片麻岩寬色帶。4²warp／128²grain及mica fields快取，C1 compact週期脊無逐點配置／hash／trig／sqrt；雲母只調色及降低roughness，不額外堆高或改metallic。0.18 m參考tile／0.018 UV relief，片理脊高差0.00117 UV（只按參考尺度換算約210.6μm，非位移量測）。全opaque M0／mortar0，沿用options／Worker／cache／ownership，不新增geometry、displacement、各向異性、干涉色或地質模擬。

同輪追加 `shantung`（粗節平紋山東綢）新增暖象牙色64經／32緯1/1平紋與96段不規則緯向粗節。沿用poplin／gabardine／ottoman／cavalrytwill的compact yarn及lift路徑；每緯三段各快取中心、平方逆半長、強度。粗節C1漸厚變寬，緯radius由0.22最多至0.37、core0.15至0.28，低於owner0.5；經線覆蓋時不讓粗節穿透，lift在owner前漸消。0.024 m參考tile／0.018 UV relief；全opaque M0／mortar0，無逐點配置／hash／trig／sqrt，沿用options／Worker／cache／ownership，不新增geometry、透明紗隙、各向異性或織物模擬。

同輪追加 `hempcrete`（多孔礦物膠結麻屑）新增淺色多孔膠結底與144枚嵌入棕色纖維麻屑，非OSB覆片。每屑七值快取，x⁸+y⁴ compact圓角長片與128²grain／96²pore fields；最大support約0.391加jitter0.03小於owner0.5，無逐點配置／hash／trig／sqrt。麻屑面維持近乎平切，不堆高且不讓底材孔洞鑽穿；底孔深度最多0.0036 UV。0.24 m參考tile／0.015 UV relief（底孔只按參考尺度換算最多0.864 mm，非位移量測），全opaque M0／mortar0，沿用options／Worker／cache／ownership；不新增geometry、透明孔、物理或材料強度／隔熱認證。

同輪追加 `utilityblades`（雙背槽梯形單刃刀片）新增九枚銀色梯形刀片，上背兩個開放安裝槽、僅較長下緣磨薄變亮且降低roughness，非雙刃刮鬍刀。四個C1線性半平面與雙compact槽mask，每片五值快取；support約0.404加jitter0.008小於owner0.5，無逐點配置／hash／trig／sqrt。鋼面metallic factor1，背槽與背景為opaque M0凹面、mortar0。0.24 m參考tile／0.004 UV relief；磨刃高度差0.00052 UV（只按參考尺度換算124.8μm，非位移量測）。沿用options／Worker／cache／ownership，不新增geometry、透明切口、切割或機械模擬。

同輪追加 `chrysocolla`（藍綠結核簇矽孔雀石）新增36簇、共108個相接圓結核，立於深綠礦物底，不是金屬葡萄狀銅或研磨色帶。每簇八值快取與128²grain／64²pigment fields；三個compact C1圓面以normalized dome平均保留鞍部，交疊不疊加高度。support最多0.38加jitter0.025小於owner0.5；無逐點配置／hash／trig／sqrt。0.12 m參考tile／0.012 UV relief，全opaque M0／mortar0；沿用options／Worker／cache／ownership，不新增geometry、displacement、透光、金屬光學或化學／地質模擬。

同輪追加 `sichuanpepperhusks`（裂口空腔花椒果皮）新增49枚紅褐粗糙空果皮，以C1平方距離環壁、連續不規則皺摺輪廓與向外開口保留凹腔，對側附著痕更低、更暗且更粗糙；不是整粒胡椒或透明洞。六值姿態快取／128² grain／40² wrinkle fields，support最多0.385加jitter0.03小於owner0.5，無逐點配置／hash／trig／sqrt。0.05 m參考tile／0.015 UV relief，pore depth0.000825 UV與scar depth0.0024 UV（按參考尺度換算41.25μm與120μm，非實際位移量測）；全opaque M0／mortar0。沿用options／Worker／cache／ownership，不新增geometry、透明切口、植物生長或化學模擬。

同輪追加 `huckaback`（五挑浮經平紋毛巾布）新增40×40經緯、10×10 draft與32組斜向交替的成對五挑浮經（共64條長浮經），不以waffle凹格或逐挑珠狀凸點代替。重用正式cloth sampler；此preset仍建立600個Float64值／4800 bytes的完整同draft-run offset／平方half／inverse shoulder快取，長浮線跨內部owner維持連續、在run ends以C1退回平紋，目前Lyocell與Hopsack各以96值共用相同whole-run profile builder，其餘既有cloth family成員仍不建立whole-run profile buffer。128² grain與160×160纖維週期，無逐點配置／hash／trig／sqrt。0.032 m參考tile／0.022 UV relief，單側lift0.00308 UV（按參考尺度換算98.56μm，非位移或實機量測）；全opaque M0／mortar0。沿用options／Worker／cache／ownership，不新增紗線geometry、pile loops、透光、吸水或各向異性光學模擬。

同輪追加 `anorthosite`（淺色雙晶斜長岩）新增以白灰斜長石晶粒為主、稀疏深色副晶粒與晶粒內平行雙晶albedo條紋的拋光切面；重用正式gabbro晶粒sampler，非深色基質輝長岩或凸起礦物拼片。100個site各六值快取／128² grain；3×3鄰域的radius1.2 compact-support權重以16次方正規化，own-site平方距離最多0.98維持正權重，省略site最近1.3不會截斷支撐。無逐點配置／hash／trig／sqrt。0.2 m參考tile／0.004 UV relief，micrograin高度跨度最多0.000008 UV（按參考尺度換算1.6μm，非位移或實機量測），雙晶與晶界共用平切面。全opaque M0／AO1／mortar0，沿用options／Worker／cache／ownership，不新增geometry、透光、Schiller／雙折射光學、地質或礦物比例認證。

同輪追加 `cubebberries`（Cubeb有梗胡椒果）新增64枚深褐皺紋果身與相連細木質果梗，非無梗胡椒或分離浮梗；C1橢圓果身覆蓋capsule果梗根部，以有界coverage保留單層neck高度；果身完全覆蓋時由果身決定，不相加或平均兩個完整高度。每果六值姿態快取／128² grain／64² wrinkle fields，各軸support最多0.468×0.98加jitter0.025＝0.48364小於owner0.5，無逐點配置／hash／trig／sqrt。0.08 m參考tile／0.04 UV relief，wrinkle height0.0022 UV／pore depth0.0012 UV（按參考尺度換算176μm／96μm，非位移或實機量測）；果皮較果梗粗糙，全opaque M0／mortar0。沿用options／Worker／cache／ownership，不新增geometry、透光、植物或化學模擬。

同輪追加 `seraphinite` 提供深綠基質與銀白彎曲羽狀礦紋的程序化拋光切面：16組不同方向、長寬與頻率的羽狀束，以3×3週期鄰域重疊合成，不在owner邊界裁斷成葉片貼紙；每組九值快取共144個Float64／1152 bytes，8² matrix／12² warp／128² grain fields，無逐點配置／hash／trig／sqrt。借用既有羽脈axis fade與礦物鄰域模式，C1軸向淡出移除abs距離的尖點；平方距離細脈在phase wrap前歸零，最長support1.1小於省略site最近距離1.3。0.16 m參考tile／0.006 UV relief，切面micrograin高度跨度最多0.000012 UV（按參考尺度換算1.92μm，非位移或實機量測）；礦紋只改albedo，不將羽狀束做成凸起葉片。全opaque M0／AO1／mortar0；沿用options／Worker／cache／ownership，不新增geometry、透光、chatoyancy／Schiller或各向異性光學模擬。

同輪追加 `hexsocketheads` 提供25個種子旋轉的鋼質圓形螺栓頭與六角平底盲凹穴；重用既有圓頭支撐與六角半平面模式，三對half-plane C1 profiles相乘保留六個平面、伸出的六個角與平滑倒角，不以max距離引入角部摺痕。每頭五值姿態快取共125個Float64／1000 bytes，128² grain field與初始化時計算的固定六角常數；無逐點配置／hash／trig／sqrt。圓頭support0.38加jitter0.025為0.405，小於owner半寬0.5；凹穴最大角半徑約0.207846，小於完整頂面半徑0.33。0.18 m參考tile／0.03 UV relief，名義凹深0.0126 UV、平底micrograin高度跨度最多0.00006 UV（按參考尺度換算2.268mm及10.8μm，非位移或實機量測）。凹底維持M1且高於M0中性底板，頂面與凹底之間以coverage混合，不挖穿底板；全opaque，mortar=1−圓頭coverage，`createMaterial()`預設metallic factor為1以保留區域金屬map。沿用options／Worker／cache／ownership，不新增geometry、螺桿／螺紋、實際穿孔或負載認證。

同輪追加 `datepits` 提供25枚黃褐色橢長椰棗核、兩側隆起核面與有限長彎曲縱向凹槽。重用既有種籽姿態快取及閉合平方距離支撐模式，橢圓以有限polynomial bow偏移、凹槽在兩端前C1淡出，無逐點配置／hash／trig／sqrt，亦不除以尖端漸零寬度；核槽不是咖啡豆裂口或穿洞。每核五值共125個Float64／1000 bytes，128² grain；保守旋轉支撐上界約0.431937加單軸jitter0.025小於owner半寬0.5。0.08 m參考tile／0.025 UV relief，凹槽名義深度0.00475 UV與micrograin高度跨度0.0003 UV（按參考尺度換算380μm及24μm，非位移或實機量測）；槽底高於背景且更暗、更粗糙、AO較低，兩個尖端保持閉合。全opaque M0／mortar0；沿用options／Worker／cache／ownership，不新增geometry、植物生長、食品或化學模擬。

同輪追加 `sapele` 提供紅褐色徑切外觀的寬明暗帶狀木紋與細長淺導管孔，直接重用wenge正式sampler而不另建近似分支。320個孔各四值快取共1280個Float64／10240 bytes，3×4 warp／64×4 fiber／128² grain；七道寬色帶的C1平方距離profile與細長橢圓孔支撐皆維持UV週期，孔x支撐最多0.044加site最多0.75小於owner1、y支撐最多0.26加site最多0.6亦小於1，無逐點配置／hash／trig／sqrt。0.3 m參考tile／0.002 UV relief，孔深0.00016 UV與平面micrograin高度跨度0.000006 UV（按參考尺度換算48μm及1.8μm，非位移或實機量測）。寬木紋只改albedo，不做凸起肋條；細孔為真實淺凹且roughness較高／AO較低。全opaque M0／mortar0，沿用options／Worker／cache／ownership，不新增geometry、木材生長或各向異性／chatoyancy光學模擬；本preset為固定色帶外觀而非動態反光認證。

同輪新增 `chambray` 藍經白緯青年布：32×32等寬1/1平紋逐格交替露出染藍經紗與白緯紗，不是denim斜紋或浮線。直接共用poplin正式sampler，兩向相同0.42支撐／0.3 core與等高0.34 base／0.04 crown，逐交點C1起落；僅chambray設定warp色階0.18與weft色階0.92，既有布種計算不變，無新增逐點配置或布料模擬。128² grain／128雙向fiber，不新增姿態或draft快取。0.016 m參考tile、0.012 UV relief，逐交點lift 0.00168 UV（按參考尺度換算26.88μm，非位移／實機量測）。全opaque M0／mortar0，維持options、Worker、cache與ownership；兩向等高，非poplin粗緯肋，無各向異性或布料動態。

同輪新增 `nephrite` 深淺綠斑與細交錯礦紋的不透明拋光軟玉近似：6² cloud、兩個4² warp、96×8／8×96軸向與64×8整數對角fiber lattice，經0.07 UV warp及C1 threshold混合，128² grain維持平面微紋。兩向與對角細礦色只改albedo，不是凸起布線、分離晶粒或凹裂縫；AO1、全opaque M0／mortar0，不模擬半透明、次表面散射、玉石韌性或各向異性。所有lattice按seed建立快取，無逐點配置／hash／trig／sqrt，整數對角座標及週期warp保持signed UV tile重複。0.16 m參考tile／0.003 UV relief，平面micrograin跨度0.000006 UV（按參考尺度換算0.96μm，非geometry／displacement／實機量測）；保留options、Worker、cache與ownership。

同輪新增 `diorite` 鹽胡椒狀黑白粗晶閃長岩：256個jittered礦晶site，明亮斜長石與大量深色鐵鎂礦色交錯，paleThreshold 0.35僅為seeded程序色相分派而非地質體積含量。直接共用gabbro／anorthosite正式sampler，3×3鄰域compact cap¹⁶正規化、每site六值共1536個Float64／12288 bytes與128² grain；radius1.2在略過site最短距離1.3前消失，自己site平方距離至多0.98確保分母正值。晶內十週期細雙晶只改albedo，不凸起或切裂拋光面。0.16 m參考tile／0.004 UV relief，micrograin跨度0.000008 UV（按參考尺度換算1.28μm，非geometry／位移／實機量測）；全opaque M0／AO1／mortar0，無逐點配置／hash／trig／sqrt，保留options、Worker、cache與ownership，不模擬礦物成分或各向異性。

同輪新增 `carawayseeds` 月牙形葛縷子果：64枚深褐細長彎果與五條較淺縱肋，果身bend0.16大於halfWidth0.065，尖端以有限polynomial taper閉合、五肋收攏而不除以漸零尖端寬度。直接共用fennelseeds正式sampler，各果五值快取共320個Float64／2560 bytes與96² grain，無逐點配置／hash／trig／sqrt。保守旋轉support sqrt((0.16+0.065)²+0.38²)+0.025約0.4666小於owner半寬0.5，seeded signed UV週期。0.04 m參考tile／0.02 UV relief，名義長度0.0038 m與肋高0.0011 UV（按參考尺度換算44μm，非geometry／displacement／實機量測）；全opaque M0／mortar0，維持options、Worker、cache與ownership。果實俗稱種籽，不新增植物生長或透明間隙。

同輪新增 `springpinends` 開槽中空彈簧銷端面：36個隨機朝向C形平切鋼管壁，中央通孔以低背景表示，單一窄槽由孔腔連續開至外緣；不是circlips雙耳卡簧或盲凹穴螺栓。重用既有快取姿態與compact平方annulus／C1槽profile，內外bevel與slot以乘積混合，無角度接縫／nearest-edge crease。每端面五值共180個Float64／1440 bytes與128² grain，無逐點配置／hash／trig／sqrt，outerRadius0.36加jitter0.025小於owner半寬0.5。六乘六配置令支援的32²最小map仍可取樣到管壁，而非八乘八配置使窄環完全落在像素之間。0.064 m參考tile／0.03 UV relief，平切面micrograin高度跨度0.00006 UV（按參考尺度換算3.84μm，非位移／實機量測）。管壁M1、低背景M0，facade metallic factor1，邊緣連續混合，mortar為1-face；全opaque，孔槽不是真透明geometry，不模擬壓入變形或彈性，維持options、Worker、cache與ownership。

同輪新增 `rhyolite` 粉褐細基質流紋岩：14道週期彎曲明暗流紋與稀疏淡色斑晶，直接共用porphyry正式sampler的256個潛在旋轉晶體site及平切面契約。每site六值共1536個Float64／12288 bytes，96² grain；僅rhyolite配置3² flow warp，0.6 phase warp及平方距離C1肩部，radius平方與inverse shoulder只在sampler建立時計算。最大晶體support sqrt(0.14²+0.06²)約0.1524小於site離owner邊界最短0.35；未出現斑晶的site不留幽靈mask。crystalChance0.25是seeded程序分派而非地質含量，細基質色帶與晶體皆不改拋光面height，晶體較淡且較平滑。0.12 m參考tile／0.0005 UV relief，micrograin跨度0.0000075 UV（按參考尺度換算0.9μm，非geometry／位移／實機量測）。全opaque M0／mortar0，無逐點配置／hash／trig／sqrt；既有porphyry不配置flow lattice且原算式保留，沿用options、Worker、cache及ownership，不新增熔岩流動、礦物成分或光學認證。

同輪新增 `tonkabeans` 深褐近黑零陵香豆：64個隨機旋轉、微彎閉合橢長種籽，沿長軸彎曲的不規則凹皺紋與細粒表皮；不是datepits單一縱槽或cubebberries帶梗圓果。沿用既有isolated owner-cell姿態／平方elliptic body／C1 shoulder模式，五值姿態共320個Float64／2560 bytes，40×6 wrinkle lattice及3×6 warp為快取，128² grain；最大保守support sqrt(0.36²+(0.16+0.02)²)+0.015約0.4175小於owner半寬0.5。皺褶同時較暗、低、粗糙且AO較深，沒有用顏色假冒凹陷；兩端閉合而非切開果仁。0.20 m參考tile／0.0275 UV relief，參考長18mm、寬8mm，wrinkleDepth0.12相當0.0033 UV（按參考尺度換算0.66mm，非geometry／位移／實機量測），micrograin跨度參考27.5μm。全opaque M0／mortar0，無逐點配置／hash／trig／sqrt，沿用options、Worker、cache及ownership；不新增乾燥動力學、內部果仁或化學／食用用途。

同輪新增 `pentalobescrewheads` 五圓瓣盲凹穴螺絲頭：36個隨機朝向平切鋼頭，五個圓瓣與中央平底凹穴相連，無中央防拆柱，不是既有六瓣starsocketbolts。沿用isolated owner-cell快取姿態／compact平方profile／C1乘積union模式，180個Float64姿態共1440 bytes，加十個Float64瓣心offset共80 bytes與128² grain；所有sin／cos只在sampler建立時計算，命中鋼頭後才轉local軸，無逐點配置／hash／trig／sqrt。head support0.37+jitter0.025=0.395小於owner半寬0.5；凹穴support0.19低於平切head core0.35，平底中央與五瓣連通，重疊弧線無nearest-edge crease。0.048 m參考tile／0.03 UV relief，名義頭徑5.92mm、凹穴深0.012 UV（按參考尺度換算0.576mm）、平面micrograin跨度參考2.88μm；非geometry／位移／實機量測，也不認證P2／P5／P6尺寸或工具適配。鋼頭及盲穴底M1、低背景M0、mortar1-face，facade metallic factor1。全opaque，不是透明穿孔；沿用options、Worker、cache及ownership，不新增鎖付力學、工具或產品專用功能。

同輪新增 `padauk` 橙紅開孔木紋：選取African padauk的暖紅橙直紋面與較粗、稀疏的縱向開放導管，18道低對比細色紋，不是sapele七道寬紅褐帶或深褐wenge。直接fallthrough共用兩者正式sampler，128個潛在孔site以poreChance0.65做seeded選取，未占用site用zero inverseLength且整個owner保持無孔；仍每site四值共512個Float64／4096 bytes，3×4 warp／64×4 fiber／128² grain快取；縱向center擴至0.3–0.7，避免固定整列打孔感；孔寬最大0.055小於site至x邊界最短0.25、孔長最大0.27小於y邊界最短0.3。新增preset bandContrast0.09僅在sampler建立時選用；既有兩木材維持0.3與原運算、無新增noise field或逐點配置／hash／trig／sqrt。色紋僅顏料、不做凸肋，導管則真的較低、較暗、較粗糙且AO較深。0.16 m參考tile／0.002 UV relief，poreDepth0.12為0.00024 UV（按參考尺度換算38.4μm，非geometry／位移／實機量測），micrograin跨度參考0.96μm；全opaque M0／mortar0，沿用options、Worker、cache及ownership。不新增自然老化、UV螢光或木材力學，也不把程序孔數當成真實植物學量測。

`cottonflannel` 是素色、平紋基底的棉法蘭絨近似，不是把所有flannel都定義成棉或平紋。直接重用既有平衡32×32、一上一下的雙紗support／lift核心；連續短拉絨遮住94%底紋顏色並只保留4%底織紋高度，原本的織孔也被nap覆蓋，不是開放網布、皮革毛孔或直立天鵝絨pile。僅新kind配置5×5 brush與96×32 nap快取場（3,097個Float64／24,776 B），微warp形成有方向、無硬邊的短細絨變化，重用既有128×128 grain；無逐點配置／hash／trig／sqrt。0.024 m參考tile／0.01 UV relief，主nap場理論高度跨度0.001 UV（按參考尺度換算24μm），cloud跨度參考4.8μm；不是實測纖維長度、幾何位移或微距掃描。全opaque M0／mortar0，高roughness且孔位保持連續淺AO；使用既有options、Worker、cache與ownership，不新增髮絲幾何、視角依賴fuzz BRDF或布料模擬。

`pinolith` 近似拋光深色基質中帶灰色包裹體的淡色尖透鏡菱鎂晶，不是浮雕米粒或礦物生長模擬。雙偏置ellipse的C1交集、變動長寬與偏置及週期cloud微warp形成不等晶形；500晶各九值共4,500個Float64／36,000 B。每個wrapped 3×3鄰域的canonical晶序預先寫入4,500個Uint16／9,000 B，opaque合成讓上層晶體遮住後方輪廓，不把所有黑邊透畫成葉片線稿；無逐點排序／配置／hash／trig／sqrt。每晶快取的保守半徑小於0.903，省略owner最短距離1.1，32² cloud／128² grain皆快取。0.1 m參考tile／0.001 UV relief，晶體及暗邊共用平切面，只有grain理論跨度0.000003 UV（按參考尺度換算0.3μm）；不是幾何位移、顯微掃描或實測晶體尺寸。全opaque M0／mortar0／AO1，維持既有options、Worker、cache與ownership，不新增折射、真實解理或岩石物理。

`tripointscrewheads` 近似36個各自seeded旋轉的圓形鋼製螺絲頭，每個有三條相隔120°、在中心連通的直線圓端盲槽；不是偏置Tri-Wing或帶中心柱的防拆孔。直接共用pentalobe的head／backing核心，三條squared-segment距離的C1肩以有界product union連成同一平底；180個Float64 head pose／1,440 B及六個Float64單位軸／48 B只建一次，128² grain快取，surface sampler無逐點配置／hash／trig／sqrt。槽支撐最大半徑0.3小於完整head半徑0.35，head外半徑加jitter為0.395小於owner半寬0.5。head及盲穴底M1、低backing M0，facade metallic factor1，mortar為1−face而非穴底遮罩，maps全opaque並沿用options／Worker／cache／ownership。0.048 m參考tile、0.03 UV relief，穴深0.012 UV按參考尺度換算0.576 mm；grain理論高度跨度0.00006 UV換算2.88μm。只改表面shading／normal，不新增螺紋或工具幾何，不承諾Y00等刀頭尺寸配合、標準認證、扭矩或防拆性能。

`septarian` 近似灰褐宿岩、褐色襯邊與淡奶油方解石填裂的拋光內部切片，不是開放凹縫或完整圓結核。36個週期site各三值共108個Float64／864 B；初始化以7×7鄰域的48條候選半平面及可重用52頂點scratch裁出真正Voronoi facets，僅保留active normalized planes。三個已測seed各216 facets／648個Float64，並非所有seed的新增固定契約。點階段取5×5候選並做半徑cull，covering radius小於1.344、漏除owner最短2.05、漏除鄰site最短3.1大於兩倍半徑。3² cloud及12²細fracture warp／128² grain皆快取，warp擾動Jacobian的保守∞範數界0.63小於1；變寬填裂與brown lining以真正facet肩的C1 product連接，不用nearest-plane切換，surface sampler無逐點配置／hash／trig／sqrt。0.12 m參考tile／0.001 UV relief，所有礦物相共用平切面，僅grain理論跨度0.000003 UV，按參考尺度換算0.36μm；M0／mortar0／AO1且全opaque，所有礦物顏料沿用tint及既有options／Worker／cache／ownership。不新增幾何、透明洞、礦物生長或通用化學組成認證。

`squaresocketheads` 是25個各自seeded旋轉的圓鋼head與四平邊方形盲穴，直接fallthrough共用hexsocketheads的正式head／backing核心。兩個paired absolute-half-plane肩相乘，讓四角C1且不是max-distance稜線、六角或圓孔；舊hex保留原本左結合三mask乘法次序。125個Float64 pose／1,000 B與128² grain只初始化一次，不另配方形axis表，surface sampler無逐點配置／hash／trig／sqrt。方孔支撐半徑約0.25456小於完整head半徑0.33，head外半徑加jitter為0.405小於owner半寬0.5。head與近乎平坦的盲穴底M1、低backing M0，facade metallic factor1，mortar為1−face而非洞遮罩且全opaque。0.06 m參考tile／0.03 UV relief，名義head-to-floor深度0.0126 UV按參考尺度換算0.756 mm；floor grain理論跨度0.00006 UV換算3.6μm。沿用options／Worker／cache／ownership，只是shading／normal，不承諾Robertson品牌或特定driver尺寸配合、實體taper、螺紋幾何或防cam-out性能。

`bronzite` 近似選定的深褐磨光Bronzite石面：不同方向的細密青銅色短紋只在局部亮起，暗褐石粒與亮flecks共用平齊切面，不是整片同向機刻條紋、藍灰Pietersite、金屬礦或凸金箔。沿用既有不規則五半平面fragment leaf與舊Pietersite算術順序，新kind才加96² C1 fleck gate，且每點在鄰格loop外只取一次；它是固定顏料快照，不是變角schiller／chatoyancy或光學模型。20²個23欄fragment owners、5×7 cloud／128² grain／96² fleck共34,835 Float64／278,680B tables，非總RAM；constructor預算seed pose、trig與support，每點無配置／hash／trig／sqrt。3×3鄰格與circle cull的保守support上界約1.224216，小於漏除owner最短1.25；五個C1肩乘積與periodic cached fields保留signed連續性。0.12m nominal tile、0.0008 UV relief僅作者參考，顏色不雕height，AO1／metallic0／mortar0、opaque與近乎平面normal保持一致；選用height、tint／Worker／cache／repeats及ownership不變。不是照片掃描，不新增真geometry／動態閃光／透射，也不認證礦種、產地、天然處理、硬度、價值或療效。

`pietersite` 是藍灰與金褐纖維角礫膠結的風格化拋光切面，不是平行整片tigereye條帶，也不把顏色當金屬或挖成凹溝。36個不規則五半平面clast各自含纖維方向、彎曲band／細fiber與blue/gold相，23值pose共828個Float64／6,624 B；5×7 cloud與128² grain共16,419值皆快取。3×3 owner加圓界cull，半徑保守上界1.045164小於漏除owner最短1.15；五個C1 shoulder乘積沒有nearest-plane角稜，surface sampler無逐點配置／hash／trig／sqrt，needsDetail bypass保留。單一藍灰→金褐authored ramp讓全部礦物顏料沿用tint，M0／mortar0／AO1及opaque。全相同一平切面，只含grain理論高度跨度0.000003 UV；0.06 m參考tile／0.001 UV relief按參考尺度換算0.18μm，不是幾何位移或實測纖維尺度。沿用options／Worker／cache／ownership，不宣稱視角相關chatoyancy、anisotropy、半透明、產地鑑定或地質生成模擬。

`castorbeans` 為16個各自seeded旋轉／微偏移的亮面斑駁橢圓種皮，每顆只在同一端接上一個較淡、較粗糙的種阜（caruncle）；不是乾皺tonka、縱槽date pit、雙種阜或透明種子。80個Float64 pose／640 B及16×9 spots、5×7 warp、128² grain共16,563值皆初始化快取。沿用既有oval seed squared-cap／C1肩及順序compositing，種阜與種皮重疊連通；保守旋轉支撐界0.29+0.09加jitter0.025為0.405，小於owner半寬0.5。深色testa斑紋只改顏料、不雕凹高度；種皮凸面與種阜各自smooth dome，M0／mortar0／全opaque。surface sampler無逐點配置／hash／trig／sqrt，needsDetail bypass保留。0.064 m參考tile／0.03 UV relief下主體長軸換算9.6 mm、種阜寬2.88 mm；grain理論高度跨度0.000045 UV換算2.88μm，只是參考尺度，不是植物測量或geometry displacement。沿用options／tint／Worker／cache／ownership，不新增生長、果莢、藥用或食用功能。

`zebrawood` 是淺金黃褐木面、深褐變寬微彎縱紋與分布於深淺部位的稀疏開放導管，不是斑馬毛皮、端面年輪、雕凹條紋或只替wenge換色。沿用既有hardwood的seeded橢圓導管／C1肩與cache-noise，額外讓深色縱紋寬度連續變化；暗紋只改顏料，真正淺凹只有導管，全部opaque M0／mortar0。導管pose 512個Float64／4,096 bytes與3×5 warp、18×4 width、64×4 fiber、128² grain共16,727值皆初始化快取；無逐點配置／hash／trig／sqrt，needsDetail bypass保留。0.16 m參考tile／0.002 UV relief下導管名義深度0.0002 UV換算32μm，grain理論高度跨度0.000006 UV換算0.96μm，只是參考尺度、不是真實解剖測量或geometry displacement。沿用既有options／tint／Worker／cache／ownership，不新增生長、樹種辨識、anisotropy或動態chatoyancy。

`twopinscrewheads` 為25個各自seeded旋轉／微偏移的圓鋼head，每顆有兩個相對、彼此分離的圓形盲凹穴，保留平坦金屬底與完整中央鋼橋；不是連通槽、三孔、中心柱或打穿backing。直接fallthrough共用既有hex／square的head／backing／blind-floor核心，以兩個不重疊squared-circle C1肩相加；原四／六平邊乘法次序不變。125個Float64 pose／1,000 bytes及128² grain皆只初始化一次，surface sampler無逐點配置／hash／trig／sqrt，needsDetail bypass保留。單孔最外支撐0.222小於完整head半徑0.32；孔心距0.31大於兩倍孔半徑0.134，中央鋼橋寬0.176；head外半徑加jitter為0.395小於owner半寬0.5。head及盲穴底M1、低backing M0，mortar為1−face、全opaque，public facade的metallic factor為1。0.06 m參考tile／0.03 UV relief下名義穴深0.0129 UV換算0.774 mm，floor grain理論跨度0.00006 UV換算3.6μm；只是參考尺度，不是實測機械尺寸、真正geometry displacement、螺紋或driver配合認證。沿用既有options／tint／Worker／cache／ownership。

`redberyl` 近似淡色顆粒流紋岩上的覆盆子紅綠柱石，選沿晶軸看向平坦六角底面的表面視角，不是假裝重建照片中的側向高柱；不是Quartz尖錐、圓斑、六瓣花、方片、印刷或凹洞。緊湊leaf沿用既有cached noise、seeded pose與C1平方半平面肩慣例，三組相隔60°的平方strip相乘，保留六直邊及平坦凸頂；種子決定旋轉、偏移、半徑、頂高與疏密。4×4 owners的8欄pose加8² cloud及128² grain共16,576 Float64／132,608B tables，非總RAM；support平方及肩倒數在建構預算，保守owner margin約0.0556 cell、不搜尋鄰格，逐點無配置／seed hash／trig／sqrt。晶面較光滑、顆粒母岩較粗糙，M0／opaque／淺AO差異，無假黑洞；保留signed C1及既有height圖每圖正規化。Nominal tile0.18m，從root `await ProceduralMaterial.create('redberyl', { size: 512, seed: 7, heightMap: true })`使用既有Worker／cache／ownership與destroy。這是五maps外觀，不增晶柱mesh、透光／折射／多色性／散射，不認證礦種、產地／天然染色／硬度／稀有價值或療效，不打包照片。

`cottondrill` 近似暖卡其色3/1經面棉斜紋：同色經緯、連續三緯經浮長及單向逐緯推進的斜紋，不是1/1平織、2/2籃織、來回人字、藍白Ticking或畫上斜線。直接共用既有profiledWeave whole-float核心，只在建構選新preset與同色yarn tone；144經／96緯及4×4 draft保留整數週期，平方C1 cover／圓冠與完整浮長肩保留穿越owner邊界的凸起，不逐緯夾成珠。4×4×6 float profiles加128² grain共16,480 Float64／131,840B tables，非總RAM；逐點無配置／seed hash／trig／sqrt，無新增nap／slub cache。Nominal tile0.08m、default metallic0、五maps opaque，細縫是低介電底而非透明孔；淺normal、霧面roughness及密實AO，height圖仍依既有每圖min/max正規化，不能推論實際布厚。從root `await ProceduralMaterial.create('cottondrill', { size: 512, seed: 7, heightMap: true })`使用，沿用Worker／cache／ownership與destroy契約。不模擬布料、透光或纖維幾何，不認證棉含量、GSM／支數／實體密度、耐用／安全或洗護。

`bluelaceagate` 近似淡藍Blue Lace Agate磨光面：平齊藍底上有粗細不等、交替成對的白色細蕾絲波紋；不是鈷藍Lapis、灰石、同寬印刷條紋、凸白脊或凹槽。直接共用既有Rhodochrosite平齊色帶核心，不增第二個sampler；只在建構時替新種類選48×3細warp grid，原種類仍9×3、原算術次序及preset值不變，局部calcite名稱改中性的paleBand。9整數色帶週期搭配大／細平滑warp、兩種不重疊平方肩，既有C1 cache／週期wrap維持signed連續；新色帶不加入height或AO陰溝。3²／48×3／12²／128²四表共16,681 Float64／133,448B，非總RAM；逐點無配置／seed hash／trig／sqrt。名目tile0.12m、default metallic0，五maps opaque、normal接近平面；可選height仍沿既有每圖min/max正規化，不能由0–255色階推論宏觀凹凸尺度。Tint／repeats／native Worker／cache所有權不變。只近似靜態外觀，不認證礦種／天然或染色／產地／尺寸／硬度／寶石價值，不模擬半透明邊、散射、晶體光學或療效。

`linchpins` 近似銀色圓環扣Linch Pins：閉合圓線保險環、較粗實心銷柄及凸起冷鐓頭，兩側環內留暗色介電間隙；不是開口R型髮夾銷、雙腳開尾銷、平墊圈或禁止符號印刷。新小leaf沿用periodic cached noise、平方環帶／capsule及smooth cover慣例，八次superellipse收圓方頭；依序疊環、柄、頭的真height冠，不把三種表面壓成同高平片。偶數4×4交替斜向排列保留signed週期；建構時計算inverse尺寸與保守support，預設最少留0.117 cell margin，不搜鄰格，空支撐跳過geometry、零cover跳過冠計算。96² grain共9216 Float64／73,728B tables，非總RAM；逐點無配置／seed hash／trig／sqrt。名目tile0.2m、default metallic1，但metallic map只覆蓋實物、間隙為M0；五maps皆opaque，不是alpha挖空或真穿孔mesh。可選height／tint／repeats及native Worker／cache所有權不變。只近似靜態閉合外觀，不認證DIN尺寸、鍍層化學／耐蝕、承載／防脫／安全，不模擬扣合、彈簧、碰撞或轉動。

`silknoil` 近似天然奶油白、霧面的Silk Noil絹紡短纖布：細平織交替紗冠與雙向稀疏細小真凸纖維結，不是亮面繅絲Shantung、satin、暗凹孔、棕色印點或大顆粒。「Raw silk」有時是Noil商業稱呼，不表示未清洗去膠的sericin原絲。新小leaf重用periodic cached noise與平方compact support；交替紗項及斜率在owner歸零，128偶數紗列維持signed週期。48² nep owner只在建構快取admission、位置、方向、inverse尺寸及奶油至淡褐色調；平方橢圓冠真增height，smooth cover改色素／roughness／AO。最大預設支撐留0.08 cell margin、不搜鄰格。48²×6 nep表加128² grain，共30,208 Float64／241,664B tables，非總RAM；逐點無配置／seed hash／trig／sqrt。名目tile0.12m、default metallic0，五maps／可選height／tint／repeats及native Worker／cache所有權契約不變。只近似靜態外觀，不認證混紡／sericin／產地／洗護／密度／momme／垂墜／強度或安全，不模擬布料動態或真實短纖。

`bloodwood` 新增所選鮮紅Bloodwood（Brosimum rubescens／Satine）縱切面，細緻、略游移的直紋與稀疏細短真凹導管；不是橘色Padauk、紫心木、灰木、螢光紅漆、密集焦痕孔、端木或凸起燈芯絨色帶。既有疏孔木材kernel只加三處新kind admission，不改共享運算：compact squared孔支撐、constructor-only seed、共平面色帶、256×10細纖維與128² grain。48×16×4孔表加3×4 warp及fiber／grain共22,028 Float64／176,224B tables，非總RAM；最大支撐至少保留X0.185／Y0.155 owner margin。逐點無配置／seed hash／trig／sqrt／鄰格搜尋。名目tile0.12m，孔內降低height、增加roughness與輕微AO；具光澤感的紅色表面仍是介電，default metallic0。只近似選定紅料，不涵蓋所有figure，不認證樹種／產地／色彩、view-dependent chatoyancy、解剖尺寸、日照老化、木塵安全或力學性質。

`cavansite` 近似稀疏、亮藍、真凸起的短針狀放射晶簇，落在占多數的暖白粗粒礦物基底；不是磨光藍圓珠、平印花、Fluorite方晶色帶或Pentagonite長刺星形。只參考館藏標本的藍晶簇／淺底組合，opaque五maps不模擬真實晶體光學、化學、透明／螢光、礦種鑑定、產地或校準尺寸。新小leaf重用periodic cached noise與smooth compact support，以平方徑向冠及36根constructor快取、略不規則短放射針的complement product合成；徑向body邊界的色素／高度／AO皆C1。每owner的admission、旋轉、縮放與jitter只在建構時計算，預設最大支撐至少留0.155 cell margin、不搜相鄰owner。4²×6 site表、36×4 needle表、128² grain及32² host共17,648 Float64／141,184B tables，非總RAM；逐點無配置／seed hash／trig／sqrt。名目tile0.16m，藍晶簇真凸起且比基底光滑，實物含釩不代表金屬表面，default metallic0。

`matelasse` 近似暖象牙白的織成絎縫布：連續凸起菱形接結網、略蓬鬆內片及細緻交替紗冠；不是 `quilting` 的下凹虛線車縫、cathedral-window 折片、充氣軟墊格或印花菱線。參考真實菱形 Matelasse 床罩，只選 cotton-like 外觀，不認證纖維、織機結構、產地、尺寸、洗護或耐磨。獨立小 leaf 重用既有 periodic lattice 與 smooth support：雙斜向緊支撐凸肋以 bounded smooth union 合成，不用 nearest-rib 切換或交點加倍；平方內片支撐在 owner 平坦接合，交替紗冠項及其斜率在紗線 owner 歸零。128 偶數紗列與六次斜向重複維持 signed UV；唯一不可變 128² grain 表共16,384個 Float64／131,072B tables，非總RAM，逐點不配置、不 seed hash、不三角／sqrt、不掃鄰格。名目tile0.24m，default metallic multiplier0；五張一般 PBR maps 僅表達靜態視覺凹凸，不模擬布料動態、填棉或真實纖維結構。七項 consumer cases涵蓋凸接結／淺內片、相鄰經緯交替、C1肩線／owner、actual512 opaque象牙白介電maps及signed週期；整合前已跑十六個各自獨立負向與合法加寬凸肋控制。

`yellowheart` 新增選定直紋金黃色Yellowheart（Euxylophora paraensis／Pau Amarello）縱切面：細而低對比的縱向紋理配稀疏短開口導管，不是橙色Padauk、紫木、螢光黃漆、密集環孔條、凸帶、端木紋或真正satinwood鑑定。重用Padauk／Iroko／Purpleheart／Sapele／Wenge kernel，只將新preset納入fine-grain路徑：constructor稀疏admission、compact平方橢圓、週期warp色帶、224×6細fiber、128² grain及真正淺凹導管。40×12×4 pore cache加3×4 warp與fiber／grain lattice共19,660個Float64／157,280 B tables，非總RAM。導管support至少留0.17／0.11 owner margin，維持C1；色素細紋留在緞光平面，稀疏管腔才降低height、增roughness及輕AO。逐點不新增配置／hash／trig／sqrt／鄰格掃描，nominal tile0.12m。五maps、可選height／tint／repeats、native Worker／cache、dielectric預設與顯式metallic override、獨立textures及destroy契約不變。此為所選金黃木料靜態外觀，不是樹種／產地認證、色彩校準、解剖尺寸、日照老化、木塵安全或力學性質模擬。

`rclips` 新增亮色彈簧線R型髮夾銷近似：單圓拉環、一根長直插腳、帶內收頸的彎曲彈簧腳與外張短端。拉環內部、彈簧間隙及自由端間隙皆連到暗色凹底，不是封閉墊圈、扁平開口銷或兩根平行U腳。重用paperclip的capsule／half-ring kernel與complement union，快取13段各5值、1彎各5值及既有96² grain，共9,286個Float64／74,288 B tables，非總RAM。第二組smooth cover只為R-clip建立圓線冠，metal沿線材mask，空底保持dielectric；既有paperclip分支不變。Face與crown重用平方距離，逐點不新增配置／hash／trig／sqrt。最大local support0.42605小於半格，capsule projection、重疊arc肩、seed grain及signed UV repeat維持C1。Tile0.12m、交替±45°擺放固定，seed只改微grain、不改製品輪廓。五maps、可選height／tint／repeats、native Worker／cache、顯式metallic override、獨立textures及destroy契約不變。此為height-field外觀近似，不是DIN認證零件、尺寸圖、材質等級或彈力／疲勞／保持力模擬。

`ticking` 新增海軍藍／奶白床墊條紋布近似：寬中央染色條兩側各有細線，採緊密2/1經面斜紋。染色沿經紗，奶白緯紗仍在交織點露出，不是印刷實心條、格紋、刷毛、開孔紗網或凸條。重用既有woven-yarn kernel及整段float profiles，雙緯跨度經紗在中間owner邊界仍保持抬起，不縮成逐格珠子。3×3 draft快取54個Float64 profile值，加原有128² grain lattice，共16,438值／131,504 B tables，非總RAM；immutable條紋draft是一般authoring data。窄紗support與squared smooth float profiles維持owner／shoulder／fiber及signed UV seam的C1。條紋色素不驅動height、roughness或occlusion。Seed工作留在constructor，逐點不新增配置／hash／trig／sqrt。五maps、height／tint／repeats、Worker／cache、獨立texture所有權及destroy契約不變，nominal tile0.048m。不作防羽絨、紗密、耐磨、阻燃或製造商認證，既有織物preset不變。

`sodalite` 新增不透明磨光的藍至藍紫色近似：底色含細顆粒變化，穿插不規則細白calcite-like脈與少量淺斑。不是金屬pyrite、凸白緞帶、開裂洞、透明橙黃色標本、螢光或photochromic hackmanite。新leaf重用既有週期cached noise與squared smooth cover primitives：兩個domain-warped carrier尺度11²／43²，加6² cloud／128² grain與兩組4² warp，共 18,422 Float64／147,376 B table，非總RAM。Carrier level的平方距離形成smooth feathered填實脈線，以complement product合併淺斑，無nearest-site或角度接縫。Hash只在constructor計算；採樣無配置／hash／trig／sqrt／鄰格掃描。白脈只改色素與稍粗糙roughness，height仍是同一平面微grain，AO1／M0／mortar0。Nominal tile0.12 m與UV relief0.0002為作者值，不是礦物尺寸或光性校準；CPU maps、可選height、facade controls／cache／native Worker與cleanup契約不變。

`dalmatianstone` 新增奶白長石／石英近似底、大小不一的深綠黑色礦物聚斑，為磨光平整面，不是凸卵石、凹孔、帶環orb或白雪花。命名採 GIA 論文建議的 Dalmatian stone，不沿用不準確的商業稱呼 Dalmatian jasper；這是作者外觀，不是成分／產地鑑定。10×10 cell各一seeded候選，依seed決定admission／旋轉／寬長／彎曲，128² cached grain也平滑擾動squared contour；斑可跨owner相連，固定週期3×3鄰域防止截斷。Contour乘數最低0.6，最大support＜0.393 cell，遠小於最近被省略site距離1.15。800個pose值＋128² grain及12² matrix共 17,328 Float64／138,624 B table，非總RAM。Hash／trig／inverse radii皆只在constructor計算，取樣無配置／hash／trig／sqrt。Smooth cover只改色素與稍粗糙的暗斑；height僅有同一磨光面微grain，AO固定1、M0、mortar0。Nominal tile0.06 m及UV relief0.002為作者值，不是標本尺寸校準；CPU maps、可選height、facade controls／cache／native Worker與cleanup契約不變。

`purpleheart` 新增靜態曝光後的茄紫色紫心木表面，採大致筆直的中等木紋與稀疏閉合端縱向導管。只表示作者選定的曝光色態，不是新切灰褐木、UV／氧化變色動畫、螢光、木種鑑定或物性校準。共用既有 Padauk／Iroko／Sapele／Wenge 導管核心，只在 constructor 選 fine sparse profile；導管底較暗且凹入、略粗糙並有局部 AO，縱長木紋帶仍是平面色素，不是凸起緞帶。30×10 候選 site 用 1,200 個 inverse-ellipse／position 值，加 3×4 warp、192×6 fiber 與 128² micrograin，共 18,748 Float64／149,984 B table，非總 RAM。橫向中心 0.25～0.75、radius 至多 0.09，縱向中心 0.35～0.65、radius 至多 0.28，support 完整落在各 owner 內；週期單 owner 評估與 squared smooth cover 維持 C1。採樣不新增配置、hash、trig 或 sqrt；四個舊 sibling 的 point kernel 與算術次序不變。M 與 mortar 固定 0；nominal tile 0.12 m、UV relief 0.003 為作者選定。CPU maps、可選 height、controls／cache／native Worker 與 cleanup 沿用既有契約。

`blackpalm` 新增緞面細磨的黑棕櫚木縱切近似：細密深色纖維維管束主要沿 V 延伸，嵌於棕褐色地組織；不同於 `palmendgrain` 點狀端切纖維束與凹入導管，不含年輪、木節、板縫、深色孔洞或按色紋雕出的凹凸。重用既有 Tigerwood／Snakewood compact curved-spindle pigment kernel，不改兩種舊材質的 point kernel；位置、平方寬長倒數、輕微斜率與彎曲只在 constructor 依 seed 快取。80×12 owner、各兩候選束用 11,520 pose 值，加 96×6 wood、128×8 fiber 與 128² micrograin，共 29,504 個 Float64／236,032 B table，非總 RAM。含 jitter 的單軸支撐最多橫向 0.758、縱向 1.38 owner unit，均小於既有週期 3×3 鄰域所需的 1.5 界。Squared smooth cover 只疊加平面色素，採樣不新增配置、hash、trig 或 sqrt；M 固定 0、AO 固定 1、mortar 固定 0，roughness 為緞面，height 僅有共用細木紋的淺起伏。0.096 m nominal tile 與 0.004 UV relief 是作者選定，不是纖維尺寸、木材等級、力學性質校準或新 shading model；CPU maps、可選 height、facade／cache／Worker controls 與既有 cleanup 契約不變。

`eclips`（不鏽鋼E型擋圈）新增三個朝內接觸部、兩個連到軸孔的寬翼口袋及外通漸張開口，不是既有帶雙鉗孔的C型卡簧。16組小幅旋轉／jitter／縮放pose共80個cache值，加96² grain為9,296 Float64／74,368 B，僅為table預算、非總RAM。Squared-radius covers與smooth half-planes讓單軸支撐含jitter最多0.35 cell，小於0.5 owner邊界；中央接觸部或空軸孔保護鏡像口袋的abs-x接縫。取樣無配置／hash／trig／sqrt／鄰格掃描，空背板略過grain。金屬面、height、roughness與AO同cover混合，metallic圖為鋼面1／不透明背板0，default material factor 1。0.064 m nominal tile與0.004 UV relief為作者選定，非尺寸認證。沿用四maps、optional height、tint／repeats／Worker／cache及ownership，不新增mesh通孔、透明、軸件裝配、彈簧力學或負載額定模擬。

`snowflakeobsidian`（雪花黑曜石）新增作者近似的黑色磨光平面與平齊灰白放射晶簇，不是既有Obsidian貝殼狀斷口、凸花或平滑印色圓斑。36組seeded晶簇各用24個compact放射晶瓣與0.4–1.1倍不等尺度；scaled support加jitter上界0.4657 cell，小於0.5 owner邊界。重用Chrysanthemum Stone核心，constructor選色調／roughness與縮放cache basis；3,564個geometry值加96² grain，共12,780 Float64／102,240 B，僅為table預算、非總RAM。取樣無配置／hash／trig／sqrt，只有micrograin改height，灰晶簇比黑底稍粗糙。0.12 m nominal tile與0.001 UV relief為作者選定，非標本量測。沿用opaque dielectric四maps、metallic 0、optional height、tint／repeats／Worker／cache及呼叫者ownership，不新增斷口／晶體geometry、透明、礦物鑑定或校準光學模擬。

`whiteash`（白蠟木）新增淺暖褐直紋縱切面：平齊生長帶中的早材導管較粗且集中，晚材導管細疏；只有長向開口凹入、變暗且較粗糙，不是深色條紋木換色、端面圓孔、凸木肋或橡木寬射線。獨立 kernel 沿用 compact vessel／cached periodic noise 慣例，32×14×4 pore cache 加 4×3 warp、96×4 fiber、128² grain，共18,572 Float64／148,576B tables，非總 RAM；pore 的局部 x 支撐在0.2–0.8、y 在0.02–0.98內，平滑 warp 不切斷 owner。逐點無配置、hash、trig、sqrt 或鄰格搜尋，並略過未使用的通用 detail noise。0.24m nominal tile、0.0018 UV-relative relief、色彩與密度是作者近似，不是照片量測。維持 opaque dielectric／metallic 0、optional height、tint／repeats／明確因子 override、Worker／cache 與獨立 texture ownership；不提供木板／樹 geometry、透明孔洞、木材物性、樹種／來源或合法採購認證。

`gibheadkeys`（鉤頭錐鍵）選作者銀色實心鉤頭錐鍵的平坦側視輪廓：同一平面上一端有凸起、外端斜削的鉤頭，單側垂直階差連到略呈1:100斜度的直條鍵身；不是雙圓端 parallelkeys 或半月 Woodruff 鍵。4×4 組小幅旋轉／jitter／縮放 pose 共 96 值，加 96² grain，共 9,312 Float64／74,496B tables，僅為 table 預算、非總 RAM；最遠支撐 sqrt(0.42²＋0.2²)×0.97＋0.025＝0.476232＜0.5，不越 owner。取樣無配置／hash／trig／sqrt／鄰格掃描，空背板略過 grain；金屬面、height、roughness 與 AO 同 cover 混合，metallic 圖為鋼面1／opaque 背板0，預設材質 factor 1。0.2m nominal tile、0.0022 UV-relative relief 及銀色 palette 為作者近似，非尺寸、配合或標準量測。維持四 maps、optional height、tint／repeats／Worker／cache 與獨立 texture ownership；不新增完整3D鍵身／頂面、鍵槽／輪轂配合或拔出動作、公差、材料／負載額定或標準符合認證。

`grosgrain` 選作者灰藍羅緞表面：細密縱向經線逐根交錯較寬的單條圓凸橫肋，肋面往兩側平滑下降，保留交叉抬升、細纖維與低凹不透明紗隙；不是 Faille 的寬平緯棱、Poplin 的較淺肋冠、Ottoman 成對粗棱、平衡平織、開網或緞面長浮紗。只擴充既有連續紗線 constructor 的 crown 選擇，整個逐點 evaluator 逐字不變，無新增逐點配置、hash、三角函數、搜尋或 runtime 依賴。參數集中 `src/data/materials.ts`；重用 128² grain 的 16,384 Float64／131,072B tables，非總 RAM；經／緯支撐 0.21／0.46＜0.5 owner，lift 在 owner 邊界前平滑歸零。0.025m nominal tile、0.00045 UV-relative relief、密度與配色均為作者近似，非照片／紡織量測。維持 opaque dielectric、預設 metallic=0、明確因子 override、height／tint／repeats、Worker／cache 及各自 texture ownership；不新增布邊／緞帶 mesh、Petersham 波浪邊、透明、垂墜／挺度／強度物理、各向異性或聚酯／纖維成分／厚度／洗滌認證。

`pyromorphite` 選作者黃綠色磷氯鉛礦的平坦六角晶體端面，散布於淡色粗顆粒礦底：端面凸起、較滑，保留六邊直線、不同方向／大小與近乎平坦頂面；不是綠色 Smithsonite 葡萄狀圓頂、紅色 Red Beryl、圓斑或方晶片。本 preset 只近似六角柱的端面，不生成完整稜柱／桶狀晶體、針晶、晶簇 mesh 或透明折射。完整重用既有 Red Beryl constructor／逐點 evaluator，只以 kind 選 preset，不新增逐點配置、hash、三角函數或搜尋。6×6×8 poses 加 8² cloud 與 128² grain，共 16,736 Float64／133,888B tables，非總 RAM；最遠支撐 (0.18＋0.13)/sqrt(0.75)＋0.10=0.457958＜0.5，不越 owner。0.1m nominal tile、0.0048 UV-relative relief 與黃綠配色為作者近似，不是標本色彩／尺寸量測。維持 opaque dielectric、預設 metallic=0、height／tint／repeats／明確因子 override、Worker／cache 與獨立 texture ownership；不提供化學／XRD 鑑定、礦物成因／來源或含鉛安全認證。

`kingwood` 選作者深紅褐心材的磨光近直縱切面：不等寬紫黑細縱紋與木底平齊，只有稀疏短導管較凹、暗、粗；不是奶油粉紅 Brazilian Tulipwood、琥珀褐 Macassar、純紫 Purpleheart、等寬 pinstripes、凸木肋或照片中的山形／節眼／黃色邊材。只擴充既有 Macassar／Tulipwood／Zebrawood／Bocote constructor 的 fineStreaks／streakPreset 選擇，完整逐點 evaluator 逐字不變，不新增逐點配置、hash、三角函數或搜尋。參數集中 `src/data/materials.ts`；32×20×4 pore cache 加 32×4 warp、36×4 width、64×4 fiber 與 128² grain，共 19,472 Float64／155,776B tables，非總 RAM。最寬 band support 0.3×(0.18＋1.25)=0.429＜0.5，pore 的 x support 在 0.17–0.83、y 在 0.08–0.92 cell 內，owner 不截斷。0.24m nominal tile、0.0016 UV-relative relief 與染色為作者近似，非木紋量測。維持 opaque dielectric、預設 metallic=0、height／tint／repeats、Worker／cache 與獨立紋理銷毀；不提供木板／樹 mesh、老化／油脂／物性／毒性、現行法規／合法採購、來源或木種認證。

`faille` 是象牙白平紋橫棱織物：細密經紗與較寬、較平的單根緯棱逐根一上一下交錯，保留低凹不透明紗隙、真實交叉抬升及細纖維；不是 Ottoman 的成對粗棱，也不是平衡經緯的 batiste。新材質只在既有連續紗線 sampler 的建構期選擇較平緯冠；整個逐點 evaluator 原樣重用，沒有新增逐點配置、hash、三角函數或搜尋。顏色、粗糙度、relief、紗線密度／支撐與緯冠均在 `src/data/materials.ts`，名義 tile 為 0.03 m，不是實測密度或纖維尺寸。維持 opaque、預設 metallic=0、可覆寫因子、height／tint／repeat、Worker／cache 與各自紋理銷毀契約；不提供透布、布料厚度／垂墜模擬、各向異性或纖維成分認證。

`celestine` 選作者淡藍色平坦寬板狀天青石與中性粗礦底：5×5組各三片局部平行、錯開端部的凸晶面，比礦底亮滑；不是奶油Barite、橙色近方Wulfenite、深藍細長三條raised striae的Kyanite或圓帽。只加kind／preset選擇，完整既有Barite／Kyanite evaluator逐字不變，保既有stria cosine，不新增逐點配置／hash／鄰格搜尋或runtime依賴；802舊kind32px四maps與七相鄰礦材32／512三seed五maps逐byte不變。25×6 cached poses＋128² grain共16,534 Float64／132,272B tables，非總RAM；最遠角點sqrt((0.18＋0.083)²＋(0.27＋0.12×0.083)²)×0.96＋jitter0.04＝0.408754＜0.5，owner切換不截斷板面。0.1m nominal tile、0.0025 UV-relative relief及淡藍palette為作者近似，不是標本量測、m晶片厚度或校準礦物光學。Opaque M0、optional height／tint／repeats／Worker／cache及獨立texture ownership不變；不新增transmission／refraction、真晶洞／晶簇mesh、纖維狀／prismatic形、元素／鑑礦／來源／價值或安全認證。

`braziliantulipwood` 選作者磨光巴西鬱金香木縱切面：奶油黃底與不等寬粉紅紅色近直縱紋維持平齊，只有稀疏短導管較凹、暗、粗；不是美洲Tulip Poplar、Macassar黑紋、橫紋、等寬pinstripes或凸木肋。完整沿用Macassar／Zebrawood／Bocote核心，只在constructor選fineStreaks與streakPreset／warp cache尺寸，逐點evaluator逐字不變；801舊kind32px四maps及七相鄰木材32／512三seed五maps逐byte不變，不增逐點配置／hash／trig／sqrt或runtime依賴。32×20×4 pore poses、24×4 warp、28×4 width、64×4 fiber及128² grain共19,408 Float64／155,264B tables，非總RAM；pore半寬至0.08＜0.25 owner margin、半長至0.27＜0.35，compact C1 shoulders與整數periodic caches保signed UV。0.12m nominal tile、0.0016 UV-relative relief與pink／cream palette為作者近似，非標本量測、m厚度或材種鑑定。Opaque M0、optional height／tint／repeats／Worker／cache及獨立texture ownership不變；不新增整塊板材／樹木mesh、老化／油脂／硬度／毒性、法規／來源／價值或合法採購認證。

`batiste` 選作者象牙白細棉平織面：60×60條均衡經緯以一上一下交織、240×240微纖維帶細緻normal，兩軸同色同高度、交點上浮、紗間不透明凹底；不是Poplin橫肋、Ramie較深粗凹凸、長浮緞、印色方格、紗網真洞或起毛絨。沿用完整連續紗核心，只把constructor ramie旗標正名balancedPlain並選preset；逐點evaluator逐字不變，800舊材質32px四maps及七相鄰織物32／512三seed五maps逐byte不變。僅128² noise共16,384 Float64／131,072B tables（非總RAM），不配置float-profile／pose表或增加逐點配置／hash／trig／sqrt。偶數60條、整數240fibers／128grain維持signed UV period；radius0.42＜0.5、lift shoulder在owner邊界前歸零。0.04m nominal tile、0.0002 UV-relative relief與roughness0.72為作者近似，不是量測紗支／克重、物理厚度或絲光處理。Opaque M0、optional height／tint／repeats／Worker／cache與獨立texture ownership不變，不新增半透明透光、布片／皺褶／蕾絲mesh、異方性BRDF、洗滌／透氣／纖維或安全認證。

`wulfenite` 選作者橙色近方形板狀鉬鉛礦：不等大小、分散方向的平坦凸晶面比深褐粗礦底較亮、較滑，不是圓頂、窄藍blade、規則三片Barite或印色方塊。獨立leaf沿用cached seeded poses／periodic noise／smooth compact shoulders，7×7 sites各七個Float64，加128² grain與16² host共16,983 Float64／135,864B tables（非總RAM）；chance0.68不保證每seed相同晶數。最大旋轉角點支撐sqrt(0.22²＋(0.22×1.08)²)＋jitter0.16＝0.483812＜0.5，owner切換不截斷晶面；肩部以平方距離smooth乘積形成，中心無abs cusp，逐點不配置、不hash、不trig／sqrt或掃鄰格，constructor預存倒平方、方向與tone。0.06m nominal tile、0.003 UV-relative relief及橙palette為作者參考，不是標本尺寸、m單位晶片厚度或校準光學。Opaque M0、optional height、tint／repeats／cache／native Worker及獨立texture ownership沿用原契約，不新增透明／折射、真晶體／礦簇mesh、雙錐形、鉛化學／毒性或礦物／產地／價值／安全認證。

`lignumvitae` 選作者深橄欖褐磨光癒創木縱切面：細密長木理與柔和交錯明暗維持平齊，只有稀疏短導管較凹、較暗、較粗糙；不是金褐Iroko、鮮紅Bloodwood、紫色Purpleheart或誇張斑馬條紋。沿用完整Iroko／細木理核心，只增constructor kind／preset選擇及未用generic detail排除，逐點evaluator逐字不變；798舊kind四maps與七個相鄰木材的32／512三seed五maps逐byte不變，不新增逐點配置／hash／trig／sqrt或runtime依賴。32×20×4 pore poses、3×4 warp、256×10 fiber與128² grain共21,516 Float64／172,128B tables，非總RAM。最大pore半寬0.06小於0.25 owner margin，半長0.21小於0.35；band支撐0.46＜0.5、整數5 bands與periodic caches維持C1及signed UV週期。0.12m nominal tile、0.002 UV-relative relief、roughness0.32及olive-brown palette為作者參考，非木纖維尺寸、m單位厚度或量測光澤。Opaque M0、optional height、tint／repeats／cache／native Worker及獨立texture ownership不變；不新增木材／導管mesh、透明孔洞、油層／清漆層或方向性BRDF，不認證木種、端面解剖、Guaiacum／替代材鑑定、油脂／密度／自潤滑物性、產地或合法採購。

`sateen` 選作者象牙白、五枚緯面棉緞：5×5組織內每列／每欄一個孤立經組織點，以2步飛數分散接結，其餘四格為跨四根經紗的連續緯浮長；不是鄰接斜紋、平織、逐交點凸珠或既有紫色經面Satin。只在constructor選preset，將原fineTwill旗標正名為fineCloth以涵蓋緞組織，完整逐點evaluator不變；797舊材質32px四maps與七個相鄰織物32／512三seed五maps逐byte不變。55×55紗、220×220微纖維與5×5×6 float profiles加128² grain共16,534 Float64／132,272B tables，非總RAM；55為5的倍數使draft在UV接縫閉合，且避免最低32px的all-gap alias，沒有依解析度特判。支撐半徑0.495＜0.5、連續浮長與C1紗肩沿用既有核心，不新增逐點配置／hash／trig／sqrt或runtime依賴。0.04m nominal tile、0.0008 UV-relative relief、象牙白與roughness0.45為作者參考，不是量測紗密、厚度、校準染色或光澤。保持opaque M0、optional height、tint／repeats／cache／native Worker及獨立texture ownership；不新增紗線／布片mesh、透射、垂墜物理或方向性BRDF，不認證棉含量、纖維、織物等級、整理工藝或耐久。

`parallelkeys` 近似雙圓端Form A平鍵的俯視外觀：銀灰實心長條具有平坦寬面、平行側邊與兩端圓弧，平滑邊肩連到暗色較粗糙的非金屬底，不是圓柱、橢圓、方端棒、空心環或Woodruff半月鍵。沿用既有硬體的seeded pose與cached grain模式，以到直線段的平方距離形成有界capsule支撐；逐點不配置、不hash、不trig或sqrt，沒有新增runtime依賴。4×4 poses各六個Float64加96² grain，共9,312 Float64／74,496B tables（非總RAM）；最長旋轉支撐乘最大scale再加jitter上界0.399525＜0.5，owner切換不截斷平鍵。0.12m nominal tile與0.003 UV-relative relief為作者參考，不是CAD尺寸或m單位displacement。金屬頂面與M0底保持分離，factory的metallic factor預設1以保留map，明確override0仍有效；保持opaque四maps、optional height、tint／repeats／cache／native Worker及獨立texture ownership。不新增平鍵mesh、keyway裝配或力學，不認證DIN尺寸／公差、C45鋼種、熱處理、扭矩或安全。

`smithsonite` 選取作者蘋果綠葡萄狀菱鋅礦外觀：不等距圓頂連生成一層有界凸礦殼，圓頂較亮、較滑，凹隙則是較暗、較粗糙的綠底；不是平面綠斑或天藍／淺色凹隙的Hemimorphite。沿用完整平滑連生圓頂核心，只在constructor選preset並排除未用generic detail，不增加逐點配置、hash、trig、sqrt或runtime依賴。0.12m nominal tile與0.006 UV-relative relief均為作者參考，不是實測晶粒尺度或m單位displacement。維持opaque M0及既有height／tint／repeats／cache／native Worker與獨立texture ownership；未增加透射、折射、色散、clearcoat或晶體mesh，也不認證礦物鑑定、化學、產地或物性。

`macassarebony` 近似作者深褐底、近黑不等寬縱紋的磨光馬卡薩烏木縱切面，細密稀疏導管略凹、較粗糙且遮蔽較強；色紋維持平齊，非刻槽、拼板縫、Zebrawood淺金底或Bocote閉眼紋。沿用完整Bocote／Zebrawood核心，constructor依kind選preset與32×4 warp cache，舊兩kind保留3×5；逐點evaluator逐字不變。32×24×4 pores、32×4 warp、32×4 width、64×4 fiber及128² grain共19,968 Float64／159,744B tables（非總RAM）；最大band支撐0.39＜0.5，各帶符號shoulder方程的u導數下界1.76＞0，導管最大半寬0.06／半長0.31均留在owner內。取樣不新增配置／hash／trig／sqrt或runtime依賴。0.18m nominal tile、0.0016 UV relief與深褐palette為作者參考，非量測年輪、木纖維尺寸或m單位displacement。Opaque dielectric／M0、optional height、tint／repeats、Worker／cache及caller ownership沿用原契約；不新增木板／導管mesh、透明孔洞、清漆層或方向性BRDF，不認證木種、端面解剖／礦物填充、力學／耐久、產地／合法採購或安全。相關Zebrawood測試改依實際表面觀測，不複製私有hash／noise。

`serge` 近似作者藏青霧面嗶嘰2/2斜紋：同色經緯逐列移一紗，兩軸皆兩上兩下的連續短浮長，較寬柔和紗肩帶微grain；不是印色斜線、逐點凸珠、1/1平織或3/1經面。只在constructor選preset／fineCloth，重用完整Surah／Lyocell核心，逐點evaluator逐字不變。52×52紗／208×208細纖維頻率與四步draft，4×4×6 profiles加128² grain共16,480 Float64／131,840B tables（非總RAM）；半徑0.495仍在thread owner內，保留C1肩與signed週期，不新增逐點配置／hash／trig／sqrt或runtime依賴。52紗避開最低32px全部取到紗縫的alias，不加解析度特判。0.04m nominal tile、0.004 UV relief及藏青palette為作者參考，非實測紗密、纖維尺寸、m單位厚度或校準染色。Opaque dielectric／M0、optional height、tint／repeats、Worker／cache及caller ownership不變；不新增羊毛毛羽mesh、雙面衣片／垂墜／透射物理或方向性織物BSDF，不認證成分、制服等級、保暖、耐久、阻燃或聲學性能。

`garterstitch` 近似作者暖奶油色搓板針表面：橫向柔和凸脊帶交錯圓弧purl crowns及較低return arcs，同色微grain與輕微seeded course wander；不是直線V／bar針法圖、印色條紋、垂直rib、點狀seed stitch或金屬。獨立leaf使用既有cachedNoise／smooth／compact ellipse-ring與半平面肩部，保留三個前弧及兩個半cell鄰接return支撐，product union／exposed underpass避免max crease。24欄／20脊、96² grain加24×20 course field共9696 Float64／77,568B tables（非總RAM）；整橢圓保守row支撐0.465660＜0.5、course半寬0.49＜0.5、水平outer support0.576906小於被丟棄鄰弧的最近距離1，取樣無新增配置／hash／trig／sqrt。作者名義tile為0.12m，實際height／normal提供凸紋，非靠色印；opaque dielectric／metallic 0、optional height、tint／repeats、Worker／cache及ownership沿用原契約。不建立完整互套紗線或fuzz mesh、不模擬彈性／垂墜／雙面衣片，不做纖維成分、針數實物量測或BRDF認證；不更動原Seed Stitch或Rib Knit。

`woodruffkeys` 近似散置的銀灰色實心半月鍵平面：一條直弦與一段圓弧圍出較淺圓缺，種子改變各件方向、位置、尺寸與微小明暗；不是圓幣、三角片、長圓孔或有孔墊圈。以既有periodic cachedNoise／hash／smooth組合圓與半平面compact C1肩部，平坦凸金屬面帶微弱grain，深色霧面底維持dielectric，並非透明空隙。constructor預存4×4×6 poses及96² grain，共9312 Float64／74,496B tables（非總RAM）；最大旋轉整圓加jitter支撐0.434＜0.5，owner切換不切件，逐點不新增配置／hash／trig／sqrt。作者名義tile為0.08m，opaque RGBA、optional height、tint／repeats、Worker／cache與texture ownership沿用原契約。預設material metallic factor為1，實際metal map分開金屬件與非金屬底，顯式override仍優先；不提供零件厚度mesh、軸槽裝配、負載／材質等級／DIN或安全認證，也不從照片校準尺寸、色彩或BRDF。

`barite` 近似選定不透明淡奶油色板狀重晶石表面：每組三片局部平行、錯落端部的較寬四邊晶板，晶面幾乎平坦且較磨砂棕礦底光滑；不是細長藍色Kyanite三凸脊、圓凸cap、規則瓷磚或平面印色。共用既有Kyanite完整blade sampler，僅將原0.05斜面與0.08紋脊高度係數移入其preset並在constructor捕捉一次，Barite選0／0.002；舊Kyanite數值、乘法順序與輸出保留，沒有新合成器或新增逐點配置／hash／trig／sqrt（沿用原有stria cosine）。4²×6 poses加128² grain共16,480 Float64／131,840B tables，非總RAM。最寬板半寬0.09小於nearest-blade owner半距0.095，旋轉bundle最大support加jitter約0.419992小於cell owner半寬0.5，smooth乘積肩及signed週期保留。0.08m nominal tile與0.003 UV relief為作者參考，非實測晶體尺寸、厚度或m單位displacement。Opaque dielectric／M0、optional height、tint／repeats、Worker／cache及caller ownership不變；不模擬透明／折射、真晶片mesh／礦簇標本、解理光學或玫瑰放射簇，不認證成分、產地、價值、密度、用途或安全。相關Kyanite舊private hash／pose重述測試以blind connected-face／PCA transverse profile檢查取代，辨別真三條凸起且較光滑紋脊，不保留實作oracle。

`surah` 近似作者暖銅色、平衡2/2細絲斜紋表面：每列兩上兩下、逐列移一紗，兩軸皆兩pick連續短浮長，不是1/1平織、3/1經面、2×2成組籃織、逐交點凸珠或銅金屬。重用Lyocell所在完整織布取樣核心；constructor以fineCloth及kind對應preset選既有整run float profiles與同色經緯，逐點evaluator逐字不變。60×60紗／240×240細纖維、四步draft，4×4×6 profiles加128² grain共16,480 Float64／131,840B tables，非總RAM；不另增逐點配置／hash／trig／sqrt或runtime依賴。半徑0.495留在各thread owner內，保留C1肩與signed週期。0.015m nominal tile、0.0007 UV relief及暖銅palette都是作者參考，不是實測紗密、纖維尺寸、幾何厚度、m單位displacement或校準染色；預覽為opaque dielectric／M0，optional height、tint／repeats、Worker／cache及caller ownership不變。SILKNOW僅定義Surah為soft twilled silk，Première Vision的Silk Twill提供two-over/two-under參考且其實看照片為藍色；不據此宣稱所有Surah都2/2或暖銅色。沒有絲纖維成分／產地／手感／耐久／安全認證、真布料背面／垂墜／透射、方向性絲光或新sheen BSDF。 60紗保留四步repeat並避開64紗在最低32px時全部取到紗縫的alias；調整tile後作者nominal紗密不變，不對最低解析度加特判。

`bocote` 近似選定黃金褐底、深褐近黑強對比紋與局部閉合眼狀figure的Bocote縱切磨光面；不是把所有Bocote都說成眼紋、木口解剖、規則貼上的同心靶心或凸環。重用Zebrawood完整取樣核心，僅constructor選kind對應preset；提高作者phase warp讓原本縱紋自然fold回閉合，深淺紋仍同一平面，只有稀疏短縱向導管凹下。16×8×4 pore表加3×5 warp、24×4 width、64×4 fiber及128² grain共17,263 Float64／138,104B tables，非總RAM；逐點無新增配置／hash／trig／sqrt或新合成器。最寬band support0.392小於phase owner半寬0.5；導管最大半寬0.06／半長0.31小於最近owner邊界0.25／0.35。沿用C1肩及signed週期，導管為surface appearance，不把endgrain的medium-to-large、few pores誤當縱切面圓孔圖。0.24m nominal tile及0.0016 UV relief為作者參考，不是實測紋距、孔徑、m單位位移或木材厚度。Opaque dielectric／M0、optional height、tint／repeats／Worker／cache及caller ownership不變；不模擬真導管geometry、方向性光澤或老化，不提供木種、木紋成因、含油／塗裝／耐久／力學／毒性／永續認證。使用 `await ProceduralMaterial.create('bocote', { seed: 7 })`。

`hemimorphite` 近似選定天藍色Hemimorphite連生葡萄狀礦殼：大小與位置不規則的圓凸caps跨cell接合，保留淡色凹隙與細粒表面，不是平面水玉、規則等大珠格、金屬銅粒或完整鐘乳石mesh。沿用既有cached C1 noise、compact圓形支持與加權globule慣例，但以3×3週期鄰格連接不同半徑的caps，normalized weighted height限制在單層，不能把重疊高度相加；既有Chrysocolla／Botryoidal Copper leaf不變。8²×5 poses加128² grain、5×7與17×19 frost共17,062 Float64／136,496B tables，非總RAM；constructor預算seed／半徑／權重，逐點無配置／hash／trig／sqrt，只共用一次normalization reciprocal。最大support0.72小於最短漏除鄰格距離1.26；C1肩、連生面與signed UV週期保留。兩頻率C1 pigment場避免單一格狀frost，實際AO map另防硬halo。0.12m nominal tile與0.008 UV relief為作者參考，不是標本尺寸校準、m單位geometry displacement或礦物厚度。沿用opaque dielectric四maps／M0、optional height、tint／repeats／Worker／cache及caller ownership；不模擬透明、折射、微晶閃爍、完整3D標本或認證礦種、產地、填充處理、成分、硬度、價值／安全。使用 `await ProceduralMaterial.create('hemimorphite', { seed: 7 })`。

`monkscloth` 近似選定奶油原色、四經四緯的粗Monk’s Cloth：32×32經緯紗以4×4籃織交替，每組四條紗仍有三道可分辨凹縫，單根紗連續跨四個交織點，不是Hopsack的2×2、單紗平織、斜紋、棋盤印色或合併寬帶。沿用既有whole-run float builder與取樣算術，只將constructor的Hopsack旗標延伸為basket並選對preset；8²×6 profiles與128² grain共16,768 Float64／134,144B tables，非總RAM，每點無新配置／hash／trig／sqrt或額外cache。32整數紗數可整除8步draft，半徑0.46小於owner半寬0.5，保留C1肩與signed週期。經緯同色；base color不烘焙假棋盤陰影，四紗方向與連續浮長由真height／normal顯示。0.03m nominal tile及0.0018 UV relief為作者參考，不是實際紗徑、7.5 count量測或m單位幾何位移。霧面opaque dielectric／M0與凹隙AO、選用height、tint／Worker／cache／repeats及ownership不變；不是透明孔、真紗線geometry、刺繡／punch-needle操作或cloth simulation。不宣稱所有Monk’s Cloth皆4×4，不複製Oxford雙紗與白guidelines，也不認證棉含量、品牌、密度、耐用、洗護／縮率或安全。

`hopsack`（藏青雙經雙緯籃織布）新增32×32經緯、兩軸各兩根一組的2×2籃織：每根紗線連續跨過兩個交織點，組內仍有凹縫區分兩根紗，不以棋盤印色、2/2斜紋或單紗平紋代替。經緯同色，重用既有whole-run cloth profile builder，不改取樣核心；128² grain加96個profile值共16,480 Float64／131,840 B，僅為table預算、非總RAM。0.016 m nominal tile與0.0025 UV relief為作者選定，不是實測紗徑或厚度。沿用opaque dielectric四maps、metallic 0、optional height、tint／repeats／Worker／cache及呼叫者ownership；凹隙不是透明孔洞，不新增布料geometry、模擬或纖維成分／透氣認證。

同輪追加 `basswood`（淺米色細密直木理椴木）近似選定Tilia americana未塗裝細砂磨縱向木面：均勻淺米白／淡褐色、低對比長直木理與淺micrograin，不是所有Tilia、端木解剖、粗黑導管、橫向curl、節疤、塗層或物種鑑定。已實讀Wood Database並實看raw／finished兩圖，只選raw外觀；來源實際稱diffuse-porous與endgrain medium／very numerous vessels，平滑縱面近似不等於樹種無孔。直接fallthrough重用正式NickelSilver兩cached affine field，只在constructor選p：96×4縱向長grain＋128² micrograin共16,768 Float64／134,144B為lattice算術預算，非總RAM／texture cache。較低pigment與relief係數、不同長grain方向與奶米色palette不是把金屬factor改0而保留原橫刷紋；既有NickelSilver全部鍵／值與point算術順序不變。每點兩cached lookups、無新逐點配置／hash／trig／sqrt／kind branch／neighbor scan，不引入zero-curl的Anigre無用欄位／第三cache或第二合成器。細grain的color／roughness與極淺height為砂磨木面shading，不是coarse grooves／凸條、true grain fiber或displacement。0.10m nominal tile與0.0012 UV relief作者選定，不是照片量測厚度；金屬map與default／createMaterial factor0、AO1／mortar0、四張opaque default maps與optional height沿用options／tint／Worker／cache／repeats／ownership。無runtime依賴／mesh／coatshader／木材物理、聲學、硬度、健康或解剖認證。 實際512 normal的極淺signed slope主要量化至127／128相鄰byte，不誇稱可解析較大凹凸；以raw height斜率方向交叉檢查normal、非放大relief換取視覺。

同輪追加 `sphericalwashers`（凸球面朝上的不鏽鋼球面墊圈）近似選定form-C-style銀色完整圓環，刻意翻面展示向外遞降的凸球形座面；正常裝配朝上的平bearing面、配對D／G凹錐座、cupwasher向外升高的直錐壁與wavewasher三波起伏均不是此surface。Halder實際不鏽鋼產品圖及剖面已查看：剖面明示球面在正常裝配下方，故此kind必須明記翻面而非把flat top錯稱convex。25個固定中心owners只cache單環tone及128² grain，共16,409 Float64／131,272B field-table算術預算，非總RAM／texture cache。沿用正式annular squared-radius C1內外肩、低opaque dielectric背底及cachedNoise模式，真正球面採sqrt(R²-q)而非拋物面／反向cup cone／torus；幾何不同而保留短獨立case，不替舊cup熱路徑加profile dispatch或新closure。只在非空金屬面計一次必要sqrt及一次grain lookup，沒有逐點配置／hash／trig或鄰格掃描；R0.54大於outer0.36，整個支撐內根號項≥0.162，外支撐到owner半寬0.5留0.14。grain只改pigment／roughness，不把球面刻成同心槽；內高外低的完整金屬面M1、圓孔及背底M0、C1部分覆蓋與AO0.3／0.95相干，default與createMaterial factor1保留authored B。0.10m nominal tile及0.025 UV relief為作者選定、不是DIN尺寸或量測厚度。四張opaque default maps與optional height沿用options／tint／Worker／cache／repeats／ownership，不新增mesh真孔／knurled側壁／透光／配對零件／傾角補償／夾緊或接觸力學；沒有牌號／耐蝕／硬度／負載／DIN認證或照片打包。

同輪追加 `mungbeans`（綠種皮、深綠圈白種臍乾綠豆）近似選定完整乾燥綠豆的種臍朝上表面：綠色種皮、窄深綠環及較長乳白種臍，不是奶白黑眼豇豆、紅豆、黑吉豆Vigna mungo、黃分瓣豆／熟豆／綠莢／芽。已實看USDA／APHIS SeedImages三豆原圖，來源稱cylindrical至rhombic、常有壓平端面；此preset採平滑圓橢圓凸帽的stylized approximation，不冒稱精準重建截平端面／wrinkle／dust-layer微結構或完整volume。直接fallthrough共享正式eye-pigmented bean sampler、constructor只選p，36格各cos／sin／底色三值與5×7 coat／128² grain共16,527 Float64／132,216B的field-table算術預算，非總RAM／texture cache。最大半長0.32小於owner半寬0.5、餘0.18；foreground兩cached lookups、低opaque背底早return，無新逐點配置／hash／trig／sqrt／kind branch／neighbor scan。halo與種臍只變pigment、不刻槽／穿孔／裂豆／凸種阜，height只為完整凸種皮，AO前景0.98、背底0.3；眼紋與種臍不改height／AO。0.045m nominal tile及0.018 UV relief是作者選定、不是量測豆粒厚度或實體位移。M0／mortar0、四張opaque default maps與optional height沿用options／tint／Worker／cache／repeats／ownership；無新mesh／runtime依賴，不提供植物解剖／品種鑑定／營養健康／光學／物理認證。

同輪追加 `thomsonite`（粉紅／乳白同心眼紋拋光石）近似選定opaque粉紅與乳白眼紋切面，不涵蓋稀有綠黑變體、玄武岩宿岩或所有Thomsonite。直接fallthrough共用正式Orbicularjasper sampler，只在constructor選preset：36個中心／倒平方半徑／三或四色環數各四值pose，加96² grain與8² matrix，共9,424 Float64／75,392B的table／record算術預算，非總RAM／texture cache。最大半徑0.43加偏移0.04＝0.47小於owner半寬0.5（餘0.03），compact squared-radial裙緣讓色環在owner前退回完整基質；保留既有support內一次cosine，不冒稱零trig，但沒有新逐點配置／hash／sqrt／kind branch／neighbor scan。環只改color／roughness，height0.4＋0.004grain及AO1維持平齊，原Orbicularjasper所有參數／point算術不變。0.048m nominal tile與0.004 UV relief作者自選、非量測厚度；微height跨度最多0.000016 UV，actual512 normal可落在8-bit近flat量化底，不能聲稱看見凸環／凹槽。四張default opaque M0／mortar0 maps及optional height沿用options／tint／Worker／cache／repeats／ownership，無新增晶體／纖維geometry、透明、礦物生長、光譜／物理／地質認證或runtime依賴。

同輪追加 `nickelsilver`（暖銀色細緞紋鎳銀合金片）新增略暖銀白色、長而不規則的細刷紋與淺微粒起伏，不是純銀／鍍銀、鍍膜、腐蝕氧化、錘凹或粗48道刻槽。重用正式C1 periodic cachedNoise builder及既有每preset一closure模式：4×192 brush和128² grain共17,152個Float64／137,216B lattice算術預算（非總RAM／texture cache），無逐點配置／hash／trig／sqrt／新kind branch／neighbor scan，原metal算術與data不變。0.025m nominal tile與0.0012 UV relief為作者選定、不是量測厚度；全opaque conductor的metallic map及`material`／`createMaterial()`預設factor均1、AO1／mortar0，四張default maps與optional height沿用options／tint／Worker／cache／repeats／ownership。方向微normal不等於新增anisotropic BRDF；不新增片材geometry、鍍層／光譜／組成／牌號／力學／物理認證或runtime依賴。

`lyocell`近似選定細密、均一米色染色的Lyocell斜紋布表面：參考Core Fabrics原始商品頁與已實看的兩張布面圖，照片的大摺痕不烘焙為材質幾何。商品只標示twill而未列精確repeat；3/1四相斜紋是引擎明選的interpretation，不冒稱由照片／商品資料驗出。0.012m nominal tile、48×48經緯及經／緯各192的軸向fiber頻率，四行bitmask draft用既有Huckaback whole-run profiles保留三pick warp float跨owner連續抬升，而不是三顆逐交叉beads；經緯採同一染色tone，非丹寧雙色、Ramie1/1平紋或Huckaback稀疏浮紋。重用Poplin家族，不另建紡織合成器，只在constructor選preset／tone／profile mode；相關private local名稱泛化，全部舊data鍵／值及point算術順序保留。128² cached grain加4²×6個float-profile值合16,480 Float64／131,840B，僅為tables／records算術預算，不是總RAM或texture cache；不新增point variant branch／配置／hash／sqrt／trig／neighbor scan。選定smooth opaque dielectric織面，M0／無grout，保留四張opaque maps與optional height、tint／Worker／cache／repeats／ownership；UV relief0.0005不是m厚度，tile尺寸不是圖像實測。不新增cloth physics／drape mesh、shader anisotropy、Tencel品牌alias、纖維組成／物理／光學／強度／永續／OEKO-TEX／Pantone認證，也不打包參考照片。

`tigerwood`選定Gonçaloalves／Astronium商品木中帶深色長紋的一張暖紅褐細木紋磨光面，不概括所有stock（原始來源也有無縞樣本）；不把商品別名另建公開kind。重用Snakewood的bounded bent-ellipse pigment union而非再建木材合成器，以7列×2行、兩slot、chance0.62及更長的0.48＋0.31長軸生成疏密不規則、略彎而非鱗片／短斑的深褐近黑長紋。三cached wood／fiber／micrograin fields為96×6、128×8、128²，合17,984 Float64；28個六scalar shape records再加168 Float64，兩者算術預算共145,216B，不是總RAM／texture-cache量。既有每point3×3 owner cells×兩slot候選迴圈保留，不宣稱沒有鄰格工作；不新增point variant branch／hash／sqrt／trig／配置。深紋僅染色，完整木面height／roughness／AO不被紋樣雕刻，M0／AO1／無grout，UV relief0.002不代表m厚度；0.18m nominal tile為引擎選定而非照片量測。保留四張opaque maps與optional height及既有tint／Worker／cache／ownership，沒有透明樹脂、clearcoat新API、endgrain、成板拼縫、木材力學／解剖／樹種／finish／物理認證或新runtime依賴。

`thulite` 近似選定細粒粉紅／淡色礦物斑駁的Thulite磨光面：粉紅主體混有密集細淡粒，而非把所有粉紅zoisite、粗黑副礦物、宿主條帶或原石破裂面重建為同一圖樣。與既有Unakite共用三層cached-noise有界多項式field；只在constructor選一次variant並正規化底色／inclusion contrast，保留Unakite全部既有greenBase／pinkContrast參數鍵與point算術順序，不建立第二份合成器。0.12 m nominal tile採7² coarse／37² medium／191² fine及0.12／0.18／0.70權重，改為fine主導分布，不是只換palette；共37,899個Float64／303,192 bytes field tables，不是總RAM或texture cache量。每point維持三次cached lookup，無新增point分支、配置、hash、sqrt、trig或鄰格搜尋；C1 polynomial色斑不形成hard白粒、grout格線、假晶肋或深度／AO切口。色斑共用近乎平整的fine微grain拋光面，AO1／M0／mortar0／正式factor0；UV relief 0.00012不是m厚度。保留四張opaque maps與optional height及tint／Worker／cache／repeats／ownership，不新增mesh、透明石英、真實位移、礦物／比例／產地鑑定或物理／光學／療效認證API。

`blackeyedpeas` 近似選定乾燥、象牙奶白長橢圓黑眼豇豆的種臍朝上表面：完整凸起種皮上，一圈局部深色橢圓眼圈包圍短白色種臍；眼圈與種臍都只改pigment，不形成穿孔、裂豆、刻槽或蓖麻種阜，也不描繪綠莢／熟豆或所有豇豆品種。0.06 m nominal tile內5×5固定中心的owners採seeded方向／種皮明度；constructor預算cos／sin／單豆底色及肩部倒數，75 pose值加5×7 coat與128² grain共16,494個Float64／131,952 bytes field tables，不是整體RAM或texture cache量。與`mungbeans`直接共用正式凸豆體／capsule／C1橢圓色圈sampler，只在constructor選preset，此kind原data／point算術不變；前景兩次cached lookup，空背底先return，無逐點配置、hash、trig、sqrt或鄰格掃描。height僅為平滑凸體，細grain只影響色／roughness；UV relief 0.025不是m厚度，metallic map／正式預設factor0，保留不透明低位背底。不是新增mesh、真實位移、植物解剖／品種鑑定或物理／光學認證API。

`wavewashers` 近似選定銀色圓形閉環三波彈簧墊圈：完整窄金屬環、同一角度跨完整環寬一致的三波height起伏及中央開孔下的低opaque dielectric背底。0.1 m nominal tile內5×5 owners固定中心、seeded相位；constructor預算每格兩個振幅／相位係數與半徑肩倒數，加128² grain共16,434個Float64／131,472 bytes field tables。三次諧波以r³正規化，避免把等角度波高誤成徑向外張；只有非空金屬面需一次必要radial sqrt及一次grain lookup，無逐點angle／trig、hash、配置或鄰格搜尋，空孔不進分母。內外C1環肩在owner前歸零；預設PBR metallic=1，maps保留環面M1、孔／背底M0及平滑部分覆蓋，全部opaque，不新增真mesh孔洞、位移、彈簧壓縮或受力模型。0.02 relief為UV height、不是公尺厚度；既有normal／roughness／AO、選用height、tint的neutral backing規則、repeats、NativeWorker／cache及獨立ownership契約不變。不將所有wave washer視為三波，也不宣稱特定SKU、合金、DIN／ISO或負載／撓度認證。

`iroko` 近似選定Iroko天然金褐側紋面：細縱向色紋、輕微彎曲明暗帶及稀疏狹長開放導管凹孔，不把所有Iroko當同色或同切向。延伸既有Padauk／Sapele／Wenge family，在constructor選sparse與fine-fiber參數並預算pore肩倒數，不建立第二套木紋演算法；每point維持三次既有cached lookup，無新逐點分支、配置、hash、sqrt、trig或鄰格搜尋。0.18 m nominal tile、36×12 vessel owners；每owner四值加3×4 warp、256×8 fine-fiber及128² grain共20,172個Float64／161,376 bytes快取。色紋與帶紋留在平面，只有導管真凹下；compact C1孔肩在owner邊界前歸零，低AO孔底仍opaque dielectric／M0。既有periodic UV、normal／roughness／AO、選用height、tint、repeats、NativeWorker／cache及獨立ownership契約不變。0.003 relief是UV height而非公尺位移；不新增木材老化、方向性光澤、樹種鑑定、耐候或滲透性模型，African teak是商品名、不是正柚木Tectona。

`ramie` 近似選定自然米白苧麻平紋樣片：等密度細經／緯紗、1/1交替浮沉、細縱向纖維與暗色低背底，不把苧麻纖維一律視為同一織法或色彩。沿既有balanced plain-weave family新增constructor固定tone與equal-yarn分支，不建立第二套織造演算法、不配置新pose表；每point只用既有128² grain lookup，總16,384個Float64／131,072 bytes快取，無逐點配置／hash／sqrt／trig或鄰格搜尋。0.04 m nominal tile、48×48紗、192×192方向fiber節律，不是來源布樣密度／尺度量測；warp／weft支撐半寬0.42與lift半長0.46都在owner半寬0.5前歸零，C1 yarn肩、crossing-lift肩、fiber joins與cache沿既有慣例。相同米白tone與相等紗冠／base保留平衡1/1高低，不做Chambray藍白染紗、Poplin粗緯肋、緞面長浮線或刷毛pile。孔隙是opaque低背底，不新增alpha-cut holes、真透光、drape／cloth physics或shader anisotropy；M0／factor0、opaque maps、optional height與tint／Worker／cache／repeats／ownership不變。0.004 UV relief不是m單位geometry displacement，不認證供應商100%成分、80 gsm、幅寬、纖維強度、透氣性或其他力學／環境性質。

`eudialyte` 近似選定cabochon上深莓紅晶粒、黑色matrix與細暗晶界交錯的角狀碎晶面；是含eudialyte多礦物岩的主色外觀，不把整個host rock當純單晶，也不追蹤所有淺色副礦物。0.12 m tile、8×8 owners各兩個獨立seeded sites；中心x／y與預算pigment共384值，加192² grain共37,248個Float64／297,984 bytes一次快取。沿既有compact weighted-crystal、Howlite squared-weight overlap與cachedNoise慣例，0.2–0.8 site、半徑1.18的cap¹⁶以3×3 owners共18 sites平滑正規化；最壞own-site距離平方1.28小於support²1.3924，總weight及其平方嚴格正，pigment與overlap正規化共用倒數、不加epsilon或假fallback；被省略site最近距離1.2前已歸零，owner不截晶粒。sum(weight²)/sum(weight)²經0.50–0.56的smooth肩形成細暗晶界，不用nearest-owner／max/min造接點折痕；fine只乘調pigment與提供微grain。每point一次grain lookup與固定局部site搜尋，無逐點配置／hash／sqrt／trig；色類在constructor選定，不是UV hard threshold，略過共用detail。不新增偽平行晶面肋，紅晶／黑matrix共用fine微grain拋光面、AO1／M0／mortar0／factor0，晶界不雕成凹縫。Opaque maps、optional height、tint／Worker／cache／repeats／ownership不變；0.00012 UV relief不是m單位geometry displacement，不新增透明折射、全礦物比例、化學／產地／鑑定、療效或輻射安全認證。

`unakite` 近似所選拋光Unakite的綠色／鮭粉色斑駁主色與細粒交界，維持整體平整切面；不把岩石冒稱單一礦物，也不單獨追蹤所有石英與副礦物。沿既有cached periodic noise與polished-plane慣例，0.12 m tile採8² coarse、24² medium及96² fine三層共9,856個Float64／78,848 bytes。正權重0.70／0.22／0.08總和1，連續混合後以smooth(smooth(mixture))再smooth(tone²)的有界多項式拉出綠／粉色域，不加hard threshold、nearest-owner色塊或偽晶粒縱肋；fine同時提供細粒pigment與微grain，不另配置重複cache。每point三次cached field lookup，無逐點配置／hash／sqrt／trig／鄰格搜尋，略過共用detail。綠／粉色域不直接改height或AO，各自僅有fine微grain的同一拋光面、AO1／M0／mortar0／factor0，保留opaque maps、optional height與既有tint／Worker／cache／repeats／ownership。0.00012 UV relief不是m單位geometry displacement；不新增透明石英、精密礦物比例／成分／產地／硬度鑑定、真晶面幾何、光學干涉或療效認證。

`safflowerseeds` 近似選定Carthamus tinctorius紅花的白色完整瘦果：寬上端、收窄下端的obovate輪廓、光滑象牙白殼、淡黃前側縱稜及沿一側稜的小凹scar，不是去殼果仁、黑縱條向日葵殼、扁平南瓜籽、深色蓖麻斑種或中心大豆臍。0.06 m tile、6×6 seeded旋轉／微偏移個體；五欄pose與128² grain共16,564個Float64／132,512 bytes。沿既有非對稱cap／cap²輪廓、C1 smooth body／squared rib肩與elliptic scar；兩條前側可見淡稜近似來源的四縱稜瘦果，而非宣稱完整四角3D截面。稜及scar隨各果實局部軸旋轉，body dome／raised ribs與輕凹lateral scar分別改height，未以單純色條假裝立體稜。旋轉包圍各軸支撐加jitter小於0.475、完整落在owner內，無逐點配置／hash／sqrt／trig／鄰格搜尋，略過共用detail。Opaque maps、optional height、M0／factor0、tint／Worker／cache／repeats／ownership不變；UV relief不是m單位geometry displacement，不新增冠毛薄片、完整果殼幾何、透明切口、精密四角截面、種子鑑定／發芽／品種／營養／尺度認證，不宣稱所有樣本都無深條或冠毛。

`snakewood` 近似選定Snakewood（Brosimum guianense）直木紋切面：紅褐基底上深褐至近黑的不規則彎曲實心斑塊及平滑相連的重疊figure，細長縱向纖維仍跨過暗斑，不是蛇皮鱗片、鳥眼凹穴、白色髓射線、端木孔圖、腐朽裂紋網或斑馬木連續深條。0.16 m tile、8×12 owner各兩個獨立稀疏seeded slots；六欄中心／尺寸倒平方／slope／bend共1,152值，96×6 wood、128×8 fiber與128² grain共19,136個Float64／153,088 bytes。固定3×3鄰域最多18個候選，以既有compact bent ellipse、C1 smooth肩及補集乘積平滑union形成自由偏移、尺寸變化的斑塊；無逐點配置／hash／sqrt／trig，不以max在重疊處造尖折。最壞x／y支撐0.896／0.4，皆在被省略site最近距離1.2前歸零，跨owner不截斷；各向異性cached scalar grain形成直纖維，不代表新增shader anisotropy。暗斑只改pigment，全部共用微grain拋光平面與roughness、AO1／M0／mortar0，保留opaque maps、optional height、tint／Worker／cache／repeats／ownership及factor0。0.003 UV relief不是m單位geometry displacement，不新增鱗片幾何、凸斑／孔洞、木材辨識、產地／合法貿易／密度／硬度／耐久檢定或老化模擬。

`squareholewashers` 近似圓形外緣、方形中央開孔的平面銀色金屬墊圈：25個各自微偏移及旋轉的完整圓形外緣，四條直邊與完整內角的方孔露出和外隙相同的低opaque非金屬背底。不是squarewashers的方外緣／圓孔、cupwashers斜杯、盲穴螺絲頭或帶齒防鬆圈。0.10 m tile，五欄cos／sin／中心／tone pose與128² grain共16,509個Float64／132,072 bytes；沿既有squared-radius smooth外肩及兩軸smooth半平面乘積方孔，金屬面為outer×(1−hole)，不用max形成尖折或用圓孔偷換方角。角度及倒數僅預算，無逐點配置／hash／sqrt／trig／鄰格搜尋；最大外支撐加jitter0.39小於0.5，完整落在單一owner，略過共用detail。平坦金屬land M1、孔與外隙M0、partial edges連續，AO與height跟實際覆蓋走；保留opaque maps、optional height、tint／Worker／cache／repeats／ownership及factor1。UV relief不是m單位geometry displacement，不新增透明幾何孔、金屬孔底、背面／螺栓／裝配、防轉或載荷模擬，也不宣稱DIN規格、鍍層／材質檢定或所有square-hole washer都為金屬。

`larvikite` 近似拋光深灰Larvikite岩面中的零散靜態藍灰長石反光與晶粒內平行色紋，重用既有diorite／anorthosite／gabbro的coarse-feldspar sampler，不複製另一套岩石演算法。0.12 m tile、10×10 seeded sites，每site六個位置／色調／方向／phase值與128² grain共16,984個Float64／135,872 bytes；固定3×3鄰域的compact高階權重正規化形成連續粗晶mosaic，grain-local band沿既有C1 smooth肩，不逐點配置、hash、sqrt或trig。支撐半徑1.2在被省略site最短距離1.3前歸零；own site最遠距離平方0.98小於支撐平方1.44，分母保持正值而非缺洞fallback。各晶粒共用拋光微grain平面，AO1／M0／mortar0，保留opaque maps、選用height與既有tint／worker／cache／repeats／ownership、factor0。真Larvikite的藍色Schiller涉及長石cryptoperthitic intergrowth的光干涉；此preset只固定近似照片外觀，不新增角度依賴藍光、光學薄層、發光、透明晶簇、凸晶粒、成分／產地鑑定或療效認證。0.00012 UV relief不是m單位geometry displacement，晶粒內色紋也不是實測原子尺度的解溶條紋。

`cupwashers` 近似countersunk-finishing款杯形金屬墊圈：25個各自微偏移的銀色完整圓環，中央開孔露出低不透明非金屬背底，低內緣沿直線錐壁升到高外圈，不是整片countersunkmetal、平墊圈、裂口彈簧圈、盲凹螺絲頭或90度基本杯。0.10 m tile、三欄pose與128² grain共16,459個Float64／131,672 bytes；squared-radius smooth肩定內外支撐，C1二次端肩接真正線性徑向錐壁。每個有金屬覆蓋的點只計一次必要sqrt，空孔與背底提前退出；不用逐點hash／trig／配置或鄰格掃描，並略過共用detail。最大外支撐加jitter為0.385<0.5，保持獨立owner；rim／內壁M1，孔與外隙M0，邊緣平滑混合，default及createMaterial() metallic factor皆1。保留opaque maps、選用height與既有tint／worker／cache／repeats／ownership；UV relief不是m單位geometry displacement。不新增真透明孔、geometry／背面、螺絲、裝配、規格角度、載荷／扭矩／防拉穿或電氣絕緣安全認證。

`makore` 近似選定的紅褐斑駁捲曲Makore木皮：細縱向木理間有強弱不一、局部淡出的橫向curl與稀疏較寬短的縱向凹導管，不是連續等強波浪板、直條斑馬木、奶金Anigre或端木孔圖。沿用Anigre合成器與其舊算術順序，新kind才加5×9 C1 figure gate；22組整數週期curl只改顏料，不雕高低、roughness或AO，只有導管實際淺凹。0.18 m nominal tile、28×18四欄pores及3×5 warp／96×4 fiber／128² grain／5² cloud／5×9 figure共18,869個Float64／150,952B tables，非總RAM；constructor快取seed資料，每點不配置、不hash、不做trig／sqrt或鄰格搜尋，略過共用detail。Pore最大半寬0.04／半長0.16均在owner內，curl主軸保守導數下界10.75大於0。維持opaque dielectric／metallic0、選用height、tint／Worker／cache／repeats與ownership；UV relief不是m單位geometry displacement。不把所有Makore都說成捲曲，不打包照片，不模擬方向性光澤／光學、纖維geometry或實際木材解剖，不認證木種、實體孔密度、塗裝／老化、力學或安全。

`anigre` 近似選定的淺金粉褐捲曲Anigre木皮：橫向不規則curl色帶跨過細長縱向纖維與稀疏開放導管，不是斑馬木深色縱條、鳥眼節疤、端木孔圖或凸起波浪板。0.16 m tile採24組整數週期curl phase，seeded warp與既有smooth週期輪廓讓色帶保持C1；色帶不改height、roughness或AO，只有導管淺凹。32×16槽位的四欄cached pore、3×5 warp、96×4 fiber、5² cloud與128² grain共18,856個Float64／150,848 bytes；每點不配置、不hash、不做sqrt／trig或鄰格掃描，並略過共用detail。Pore支撐在owner內歸零，phase主軸導數保守下界15大於0；opaque dielectric／metallic0／mortar0，保留既有tint／worker／cache／height／repeats與ownership。這是外觀圖案近似，不是每塊Anigre都有curl的保證、品種鑑定、木材切片掃描、方向性光學shader、幾何波紋、耐久／力學或安全認證；UV relief不是m單位幾何位移。

`adzukibeans` 以暗紅至棕紅種皮、細長中央乳白種臍與完整凸面近似紅豆（Vigna angularis），不是扁圓扁豆、奶油色蓖麻肉阜或挖穿豆身的裂口。0.05 m tile 內有25顆 seeded 旋轉的橢圓籽，種臍採兩端圓合的細長 capsule 色紋；它不額外降低或抬高 height，也不挖 AO 洞。五欄pose／5×7 coat／128² grain共16,544個Float64、132,352 bytes，squared-ellipse 與 squared-capsule smooth肩沿用既有C1慣例；每點不配置、不hash、不做sqrt／trig，並略過共用detail。最大旋轉支撐0.28+jitter0.035<0.5，種臍保守q上界約0.291<full-body界0.88，不跨owner或穿出種皮。深淺種皮、乳白種臍、細grain與背景共用opaque dielectric maps／選用height，預設metallic0，保留tint／worker／cache／repeats／ownership。5.6×4.4 mm輪廓只是tile參考比例；UV height不是m單位的幾何位移。這是每格一顆朝外籽面的stylized貼圖，不是掃描品種、真堆疊豆粒、內部子葉、SEM微裂紋或食品／光學模擬。

`amazonite` 是藍綠底、斷續淺色交叉長石紋與細cloud的拋光平面近似，不是larimar圓形藍池、完整方格、雕凹裂溝、凸線或透明晶簇。兩組整數UV phase以(32,8)／(−8,32)方向形成交叉紋，沿用既有band／cached-field與C1 smooth肩，較細seeded warp／變寬／gate打斷規則長線；bounded product union在交叉處平滑合成。5² cloud、7×9／9×7 warp、32×16／16×32 width、8×32／32×8 gate及128² grain共18,071個Float64／144,568 bytes一次快取，無逐點配置／hash／trig／sqrt，needsDetail bypass保留。最大phase支撐0.1485小於wrap半寬0.5，signed肩方程主軸導數保守下界19.898大於0。全opaque M0／mortar0／AO1，深淺相只改顏料，共同平面grain高度理論跨度0.000002 UV，在0.06 m參考tile／0.001 UV relief下換算0.12μm，不是實測晶格或geometry displacement；不模擬光學雙晶、解理破裂、成因或療效。沿用options／tint／Worker／cache／ownership。

追加 `ProceduralMaterialOptions.tint`（三個 0–4 的逐通道倍率），讓顏料色可配合專案色盤而不改原始碼；灰縫與 normal／metallic-roughness／occlusion maps 不變，省略時 459 種輸出逐位元組不變。不新增 kind、map 或依賴，逐功能驗證提交、不 push。

追加 `ProceduralMaterialOptions.workerPool` 與 `createProceduralWorkerPool()`／`proceduralMapsJob`／`trustedProceduralMapsJob`／`proceduralWorkerURL()`：沿用既有 NativeWorkerPool 與 trusted worker 協定，把 maps 生成移出主執行緒，輸出逐位元組相同；未傳入時維持同步。pool 由呼叫者擁有，不新增依賴，逐功能驗證提交、不 push。

追加呼叫者擁有的 `ProceduralMapCache`（`ProceduralMaterialOptions.cache`）：以完整生成參數為 key 的有界 LRU（預設 64 MiB／32 筆，上限 1 GiB／4096 筆，常數在 `src/data/materials.ts`），合併同時發出的相同請求、失敗不快取；只快取 CPU maps，貼圖 ownership 不變。逐功能驗證提交、不 push。

追加 `OpticalMaterialMaps.heightTexture`／`heightSampler` 與 `ProceduralMaterialOptions.heightMap`：height 佔既有 optical array 第 6 層（layer 5、UV slot 17），不新增 binding；有 height map 時 parallax 改讀它（無 normal map 時以視線投影到 height UV 切線空間），沒有時維持原本讀 normal.z 的 shader 文字。glTF 匯出不含 height（無對應 Khronos 擴充）。逐功能驗證提交、不 push。

## 倉庫結構

- `src/`：公開統一入口及集中可調常數 `src/data/`。
- `packages/core/`：Game、Clock、Scene、2D／3D 物件與相機、logger；`packages/graphics/`：Renderer 契約、WebGPU／WebGL2／Canvas2D 與 auto presentation。
- `packages/ecs/`：內部 World；`packages/math/`：2D／3D 數學；`packages/assets/`：Texture／cache；`packages/input/`：Keyboard／Pointer／Gamepad；`packages/audio/`：OPM orchestration。
- `examples/`：`index.html` 範例目錄（`pnpm examples` 開啟）；原 P08 六個範例 `triangle/`、`sprite/`、`cube3d/`、`pong/`、`fallback-demo/`、`showcase/`，另增 `advanced3d/`、`gameplay2d/`、`rendering2d/`、`authoring-lab/`、`beacon-run/` 與功能聚焦範例 `physics2d/`、`particles2d/`、`tilemap2d/`、`transitions2d/`、`ui2d/`、`input-lab/`、`audio-lab/`、`pbr3d/`、`instancing3d/`、`picking3d/`、`gltf3d/`；`benchmarks/sprites/`：1,000 Sprite 可重現負載量測。
- `vendor/opm/`：官方 OPM.js v1.13.1（tag `v1.13.1`）完整 dist、LICENSE、來源／checksum manifest；`scripts/copy-vendor.mjs` 在 build 後原樣複製到 `dist/vendor/opm/`。
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
- Audio 使用未修改的官方 OPM.js v1.13.1（tag `v1.13.1`）DSP／worklet；voice 內部正規化為 v8，公開 `OPMVoice` 保留 `version: 1` 契約。上游可選聲部數，但 XYZ.js 仍以八個隔離 OPM instances 管理八個 slot（含 release），只搶最舊 SFX，不切斷 BGM；每個 worklet 的 256-event queue 以 bounded lookahead 控制。手勢 unlock 前不建立 AudioContext；P137 起 AudioManager 擁有單一 AudioContext，八個 OPM instances 以官方 `context` 選項借用（同一 context 上八個 worklets），取樣／串流共用同一 clock；OPM 單獨啟動失敗不阻擋 unlock，以 `opmState`／`opmError` 與 error event 回報。此 vendor 升級不新增引擎功能或擴大認證範圍。
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

## 本輪材質品質與製作流程擴充：P119–P136

使用者授權全部實作、分功能驗收後提交；不授權 push、升版或 release。
P119 tangent／handedness／deformation；P120 anisotropic texture filtering；
P121 specular AA／alpha coverage／alpha-to-coverage；P122 GGX IBL／BRDF／sheen；
P123 PBR native surface；P124 2D surface＋lighting；P125 2D occluders；
P126 material assets／instances／variants；P127 detail／triplanar／layers；
P128 height／parallax／weathering；P129 procedural art controls；
P130 anisotropic BRDF；P131 iridescence；P132 bounded subsurface；
P133 layered transmission／dispersion；P134 baked lighting；
P135 material reference scenes；P136 lifecycle／memory／available physical qualification。
每項沿正式 renderer、root API 與既有 content／asset 工具鏈整合，保持兩個 native
backend 的契約及 Canvas2D 明確拒絕邊界。未驗證的硬體、瀏覽器或物理近似不能標為完成。
各項硬指標與實際證據逐階段記錄於 ACCEPTANCE；本節是批准範圍，不是完成聲明。

### P119 — tangent-space 一致性

- `Geometry` 可選 `tangents`：每頂點 xyz＋handedness，複製並驗證 finite／Float32；
  缺省時由 indexed triangles 與指定 UV0／UV1 角度加權生成；預設 UV0。
  既有八浮點 vertex stream 與 public stride 不變；tangent 是獨立 stream，
  不新增 runtime dependency 或 shader transpiler。
- Morph `TANGENT` 與 POSITION／NORMAL 同步；skin 與 model 用 forward linear
  matrix 變換 tangent、inverse transpose 變換 normal，再正交化；
  handedness 乘上各 transform 的 determinant sign。CPU mirror 與 native palette 一致。
- `generateMikkTangents` 使用完整 vendor 的官方 mikktspace 1.1.1 reference WASM，
  不新增 npm runtime dependency；回傳新 geometry 與 seam `sourceVertices` remap，
  支援 UV0／UV1、glTF handedness convention。normal-mapped glTF 缺 tangent 時自動使用，
  seam 同步複製所有 vertex channels、morph 及四／八個 skin influences。
- 兩個 native shader 在與 `tangentTexCoord` 一致的 identity normal／clearcoat-normal
  上優先使用 tangent；退化、不同 UV basis、非 identity transform 或 native
  deformation 改寫時回退各 map 導數。鏡像與非均勻縮放保留 handedness。
  `tangentConvention` 隨 glTF authored／generated frame 保留，UV transform derivative
  fallback 不反轉 normal-map Y，base／coat 一致。
- glTF `TANGENT` 為 VEC4 float／normalized signed；型別不符明確拒絕，不再忽略。
- 驗收包含鏡像 UV、負縮放、morph、skin 與兩 backend 的真像素差異；
  不以存在 tangent buffer 代替畫面結果。

### P120 — anisotropic texture filtering

- 共用 sampler 接受 integer `maxAnisotropy` 1–16，缺省 1；大於 1 時 min／mag／
  mipmap 必須 linear，明確拒絕 nearest 組合。覆蓋 PBR 各 map、一般／native
  3D base texture、Sprite／2D normal texture，不影響既有預設或借用 ownership。
- WebGPU 正式 GPUSampler 與 WebGL2 extension sampler 真正套用；cache／batch
  包含有效 anisotropy，shadow／transparent 分支一致。無 extension 降為 1。
- 公開 capability 區分 request ceiling 與 driver maximum；WebGPU 的不可查詢上限
  明示 null，Canvas2D 明示 1，不把 request 16 假冒實際硬體品質。
- Packed transmission／thickness 保留獨立 sampler，使用有界 major-axis filtering，
  不增加 texture slot。兩個 native backend 以斜視高頻圖像與真像素驗證。

### P121 — specular AA／alpha coverage／alpha-to-coverage

- Opt-in PBR normal-footprint moments and derivative variance broaden base／
  clearcoat GGX roughness with bounded strength; zero keeps current shading.
  Native pixels cover noisy highlights/motion, with absolute RGB motion and
  normalized temporal contrast reported separately; neither is a path-tracer proof.
- Explicit asset texture semantics can preserve base alpha-test coverage in
  generated mips without changing RGB filtering, base pixels or source ownership.
  Quantization/tied-alpha limits are documented and validated through real KTX2.
- MASK alpha-to-coverage uses real multisample GPU pipelines／GL state, including
  offscreen/HDR resolve and ordinary overlay. Public availability reports actual
  usable sample counts; antialias disabled／unsupported requests fail explicitly.
  Shadow maps retain the same binary cutoff. Default rendering is unchanged.

### P122 — GGX IBL／BRDF integration／layer energy

- Every nonzero environment roughness mip uses a GGX split-sum prefilter, with
  deterministic sampling/source-footprint LOD and documented resolution bounds;
  sharp background level zero stays unchanged.
- Numerically integrated, reproducible GGX DFG lookup replaces the analytic fit;
  shared Smith visibility, bounded multiscattering compensation and diffuse／
  clearcoat energy accounting cover actual native white-furnace HDR radiance.
  Existing texture-slot limits remain; lookup buffers have explicit ownership.
- Reuse Charlie sheen directional-albedo data; direct layer attenuation accounts
  for light and view, and indirect sampling uses a bounded Charlie kernel rather
  than calling a GGX lobe sheen. Document spatial/integration approximations.
- Validate numerical references plus real GPU／GL, authored normals／roughness
  boundaries, colored metal／dielectric／clearcoat／sheen, lifecycle and earlier
  native regressions; preserve historical records without path-tracer claims.

### P123 — native PBR surface hooks／pass parity

- Add `NativePBRMaterial` through the root API, retaining the ordinary PBR maps,
  UV contracts and bounded native uniform/deformation lifetime. Share native
  descriptor validation and disposal; do not add texture slots or GPU handles.
- Native hooks modify the decoded physical surface before the engine BRDF, not
  replace the final lit color. Base/coat normals, roughness, metal, emission,
  occlusion, specular, sheen and transmission remain composable with PBR lighting.
- The same vertex deformation and base opacity hooks feed color, HDR, sorted／
  weighted transparency, MASK shadows and reflection capture; native coverage
  pipelines must retain the custom shader rather than use a standard PBR shader.
- Exercise both actual native backends, compilation rejection, mutable uniforms,
  borrowed resource ownership, preparation/invalidation and owned API recovery.
  Canvas2D remains explicitly unsupported for native 3D materials.

### 自然世界追加 source 契約與待驗界線

- Terrain3D：bounded image／array heightfield、native chunk LOD／HLOD／skirts、
  full-resolution local height／normal query、visible world raycast、explicit height
  markUpdated 與既有 WorldStreamingController cell catalog。無自動 physics／navigation。
- TerrainSplatMaterial／bakeTerrainSplat：一至四個 opaque layers 靜態 CPU bake、
  linear-light color／emission、normal 與 packed occlusion／roughness／metallic，
  preset owns 四張生成 maps／native material，借用輸入，非 live paint。
- Water3D：最多八個 geometry／normal waves、native PBR／shadow／bounds、
  explicit simulation delta／absolute time、reusable analytic surface query、crest foam；
  borrowed textures／owned material。無 depth shoreline／planar reflection／fluid solver，
  CPU vertices 不變形。
- 植被：seeded candidate scatter、density／surface／height／slope filters、
  tiled InstancedMesh／LOD／coverage fades、instance-aware wind 與 absolute simulation time；
  root owns child objects，geometry／material／maps 由 caller 管理。CPU query 不跟 GPU sway。
- Trail3D 使用現有 dynamic Geometry；world-nature 整合 terrain／splat、水面、moving trail、
  wind grass，renderer query 支援 webgl2／webgpu、Canvas2D 明確 unsupported。
  stress=1 請求 1,048,576 source height samples／10,000 grass instances，不是效能承諾。
- API／ownership／limitations 同步 TECHNICAL／USAGE 雙語與 README zh／en／ja；
  所有 runtime、browser、loss／cleanup、stress CPU／RAF／GPU 證據仍由整合主代理實際
  驗證後記 ACCEPTANCE／CURRENT。本文不新增通過宣告、版本或發佈授權。

## 使用者直接指定功能擴充（2026-10-07）：凸包／複合 2D 碰撞、逐物件運動模糊、MP4 素材擷取

使用者以「全部實作」直接指定四項缺口實作，契約與邊界見 DESIGN 對應章節：

- 2D convex hull 與 dynamic compound：`convexHull(points, options?)`（3–256 點推導
  polygon Collider2D）、`Compound2D`（1–256 convex pieces 共用單一 dynamic body、推導
  mass／inertia／area／centerOfMass）、`DynamicConcave2D`（`decomposeConvex` 分片共用
  一個 body）與 `GameObject.colliderPieces`。`Colliders` 既有型別字面值不擴充（維持
  1.x structurally additive），hull 以 top-level 匯出提供；compound CCD 拒絕。
- 逐物件運動模糊：`MotionBlurSettings.perObject`（預設 false）以 renderer-owned rigid
  per-instance velocity pass（WGSL＋GLSL）做 gather；skinned／deformation 與 missing
  history 落回既有 camera reprojection。既有 quality／sample limits 不變。
- MP4 素材擷取：`demuxMP4(bytes, options?)` 與 `VideoTextureDecoder.fromMP4` 提供有界
  單一 video track MP4 快照（avc1／vp09／av01；fragmented／encrypted／edit-list 拒絕），
  不做計時播放；既有 VideoTexture／decoder 擁有權契約不變。
- 實作不代表驗收；實際驗證證據記 ACCEPTANCE／CURRENT。本文不新增通過宣告、版本或
  發佈授權，commit／push 需另經使用者授權。

## 使用者直接指定：P137 音訊架構解耦（2026-10-24）

使用者要求讓音訊架構更解耦，並選定以下兩項設計：

- **單一 context**：`AudioManager` 擁有唯一 AudioContext；八個 OPM instance 以官方
  `context` 選項借用，sample／stream／effects／listener 共用。八個 slot、只搶最舊 SFX
  與 vendor bytes 不變；`audioContextCount` 由 8 變 1。
- **部分成功 unlock**：OPM 無法啟動（非安全來源、vendor 缺漏、worklet 被擋）時
  `unlock()` 仍 resolve，以 Game `error`、`opmState`／`opmError` 回報；sample／stream
  照常可用，再次 unlock 重試 OPM。無法建立或 resume context 時仍 reject。
- 1.x additive：既有公開宣告保持 API 相容 gate 的 identity，不移除 export。
- 從外部 CDN 載入 OPM 的選項另行討論，不在本階段範圍。驗證證據記於 ACCEPTANCE；
  依 AGENTS 規範建立 `[P137]` commit，不 push。

## 使用者直接指定：P138 選用的 OPM 外部模組來源（2026-10-24）

使用者同意 P137 後另開階段，做成部署端自行開啟的 CDN 選項：

- `GameOptions.opmModuleUrl` 指向官方 `dist/api/index.js`（建議以 commit 釘住）；只接受 HTTPS
  或同源 HTTP(S)，不可含帳密或 fragment，不合格時在建立 renderer 前拒絕。
- 模組匯出的 `VERSION` 必須等於 vendor 版本（`src/data/opm.ts`），voice 驗證與 unlock 共用同一來源；
  不做也無法做 CDN 內容完整性驗證，於 TECHNICAL／SECURITY 明示。
- Vendor 仍完整收錄、仍是預設並隨套件發佈；AGENTS 的 vendor 規範不變。
- 依 AGENTS 規範建立 `[P138]` commit，不 push。

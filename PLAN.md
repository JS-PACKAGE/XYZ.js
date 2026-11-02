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

`aggregationfrost`（聚集霜）使目前目錄1015→1016種，含plain的gallery為1017項。在96×96的環面上做擴散限制聚集（diffusion-limited aggregation, DLA）：中央的格子是第一個成員，之後的每個粒子從一個隨機的空格出發，每步隨機走向上下左右四個鄰格之一（環繞），一旦與團簇的某個成員共用一邊就黏住；共900個粒子（中央加899個隨機行走者），形成像霜花或樹枝的碎形枝狀團簇。每個粒子依黏上的先後順序有一個「年齡」，色調從中央（最老）向枝端漸暗；呈冰藍色細枝在深藍黑底上，團簇獨立一塊（不與相鄰拼貼相連，因為最遠的枝離中央只有約37–44格，而環面半寬為48格）。seed決定每個粒子的出發點與每步方向，所以每個seed的枝狀圖案完全不同。這是示意的模擬結果，不是對真實結霜或電擊紋的模擬。目錄中另有名稱相近的`dendriticfrost`與`frost`，那些是不同的材質，與這個模擬式聚集無關。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；900個粒子、96×96大小、60,000步的單次行走上限、tanh銳利度8、色調（線0.72、年齡下限0.3）、冰藍與深藍黑色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。我先用一個獨立的小原型（64×64、520個粒子，只用來確認方法與速度）確認DLA可行，再調整為96×96與900個粒子。我沒有檢查是否有任何行走達到60,000步的上限（若發生會放棄並重新出發），也沒有檢查團簇的碎形維數是否符合DLA的文獻值，所以不聲稱它是「標準DLA」，只是這個演算法的一個實作結果。測試無法獨立重現隨機行走（雜湊亂數是sampler內部的），所以我**沒有獨立重寫聚集演算法**：測試從節點顏色反推被佔據的格，以獨立的廣度優先搜尋檢查團簇連通且恰好有900個格、顏色隨與中央的圖距離增加而下降（相關係數低於−0.6），**這證明團簇確實是連通的樹狀結構、年齡色調的方向正確，但不證明隨機行走本身是均勻的**。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0377）。第一次嘗試產生測試的腳本因為一個期望字串不符（滲流測試的height下限是0.98而非0.99）中途失敗，沒有寫入任何檔案，修正後重跑。

啟動時（每個sampler）把中央格`(48, 48)`設為團簇的第一個成員（色調1），然後對每個粒子`particle = 1 … 899`重複：以`hash(particle, attempt, seed ^ 鹽值)`決定出發的格（若該格已被佔據就換下一個attempt），最多走60,000步，每步若與團簇共邊（四個鄰格中有被佔據者）就黏住（標記為佔據、色調`1 − particle / 900`），否則以`hash(particle × 65537 + attempt, step, seed ^ (鹽值 + 3))`決定四個方向之一前進（環繞）；取樣時以`latticeField`（C1 smoothstep）混合佔據圖並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化，另一個`latticeField`混合年齡色調圖：顏色＝`0.05 + 0.72·line·(0.3 + 0.7·年齡) + 0.03·(128²細grain − 0.5)`、height ＝ `0.8·line·(0.7 + 0.3·年齡) + 0.2·grain`、線處roughness降低0.2（底0.4）、AO恆為1、金屬factor為0；保留的cache為兩個`Float64Array(9216)`（佔據與年齡）加`Float64Array(128²)`，共278,528 B，另有建構時的`Uint8Array(9216)`佔據表，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個sampler的建構在bun中量到約150 ms（第一次）、135 ms、126 ms、130 ms（四個seed各一次），是單次量測、不是benchmark；取樣本身只做常數次運算，我沒有量測。實測（工具實跑）於seed 0／1／0xffffffff／7：900個格被佔據，且四個seed都能從中央經四鄰邊走到全部900個格（團簇連通）；團簇中的最大圖距離59／62／51／59；離中央最遠的格（環面最短距離）41.1／40.5／36.9／44.0格；被佔據節點的顏色0.2564–0.7794、空節點最亮0.0651、中央節點0.7561–0.7733；圖距離與顏色的相關係數−0.7945／−0.7536／−0.8800／−0.8088；256²取樣下亮處（color>0.5）占3.95%–4.06%、color 0.0356–0.0358至0.7725–0.7758、平均0.0922–0.0925、roughness 0.2001–0.3999、AO恆為1、height至多0.9697–0.9848 relief；512²取樣亮處占3.97%–4.05%、color 0.0352–0.0353至0.7734–0.7779、平均0.0922–0.0925、height至多0.9795–0.9870 relief；seed 0與1的佔據格有14.8%位置不同；seed 7的512²maps平均r／g／b約(23.0, 31.2, 45.3)、法線tilt²最大約0.0377、z分量最小253。我實看了預覽（seed 7）：深藍黑底上冰藍色的霜花狀樹枝，每塊拼貼一朵，近中央較亮、枝端較暗。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`cyclicwaves`（循環波）使目前目錄1014→1015種，含plain的gallery為1016項。在96×96環面上執行八狀態的循環細胞自動機（cyclic cellular automaton）：每格有0到7的狀態，隨機起始；每個同步步驟中，狀態為k的格子若上下左右（馮紐曼鄰域，環繞）四個鄰居中至少有一個已經是狀態`k + 1`（7之後回到0），就前進到`k + 1`，否則維持原狀；執行150步。結果是一圈圈循序相接的波（每個狀態緊接著前一個），在隨機起始中局部有序的地方形成螺旋與迷宮狀的波紋；狀態0到7對應由暗靛藍到琥珀黃的八階色調，波前呈現短短的由亮到暗的陡坡。八個狀態的格數各約占一個等份（四個seed每個狀態占11.96%–13.19%），相鄰格相差不超過一個狀態的比例約97%（隨機起始只有37.5%）。seed決定起始狀態，所以每個seed的波紋完全不同。這是示意的自動機快照，不是對化學波或任何實物的模擬。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；8個狀態、馮紐曼鄰域、閾值1、150步、96×96大小、色調（span 0.72）、靛藍與琥珀黃色調及0.5 m nominal tile皆作者設定。調整紀錄：我先用一個獨立的小原型試了幾組規則（摩爾鄰域閾值2或3等）：摩爾鄰域搭配閾值2或3、100步後相鄰相差≤1個狀態的比例只有0.18–0.68（8狀態閾值2為0.684、閾值3為0.371；12狀態閾值3為0.242；16狀態閾值3為0.182；10狀態閾值2為0.344），摩爾鄰域閾值1（6、8、10、12個狀態、150到250步）為0.74–0.88，馮紐曼鄰域閾值1則為0.95–0.98（5個狀態0.952、8個狀態0.976），所以選了8個狀態的馮紐曼鄰域；每組都只用同一個種子跑一次，是粗略的比較；這個原型的隨機數與sampler的雜湊不同，只用來挑規則。預覽只看了一版。測試無法獨立重現動力學（雜湊亂數是sampler內部的），所以我**沒有獨立重寫細胞自動機的更新規則**：測試從sampler輸出的節點顏色反推每格的狀態（取最近的八階色調之一），檢查顏色落在八階色調上，並檢查統計量（約97%的相鄰格相差不超過一個狀態、每個格子都有一個鄰居的狀態比自己多1或少1、八個狀態的占比各在11.5%–14%之間），**這證明結果不是隨機雜訊、各狀態都有出現、且上色邏輯正確，但不證明更新規則本身正確**。我在測試註解初稿中把隨機起始時相鄰格相差不超過一個狀態的比例寫成「約四分之一」，這是錯的（8個狀態時應為3/8 = 37.5%），commit前已更正。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0120）。

啟動時（每個sampler）以`floor(hash(x, y, seed ^ 鹽值) · 8)`決定每格的初始狀態，然後做150個同步步驟：每格若四個（環繞的）鄰居中任何一個的狀態等於`(自己 + 1) mod 8`，就進到該後繼狀態，否則維持，並交換新舊兩個`Uint8Array(9216)`；之後把每格的色調設為`狀態 / 7`；取樣時以`latticeField`（C1 smoothstep）混合色調圖：顏色＝`0.05 + 0.72·色調 + 0.03·(128²細grain − 0.5)`、height ＝ `0.8·色調 + 0.2·grain`、roughness固定0.4、AO恆為1、金屬factor為0；保留的cache為`Float64Array(9216)` 73,728 B加`Float64Array(128²)` 131,072 B，共204,800 B，另有建構時的兩個`Uint8Array(9216)`暫存，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個sampler的建構（150步）在bun中量到約78 ms（第一次）、39 ms、44 ms、40 ms（四個seed各一次），是單次量測、不是benchmark；取樣本身只做常數次運算，我沒有量測。實測（工具實跑）於seed 0／1／0xffffffff／7：96×96個node（取樣在node上）中每個狀態的格數為1,102–1,216（占11.96%–13.19%）；相鄰格相差不超過一個狀態的比例0.9779／0.9746／0.9782／0.9715；每個格子都至少有一個鄰居的狀態比自己多1或少1（四個seed皆為全部9,216格）；9,216個節點的顏色與八階色調一致，最大誤差0.0150以內（誤差來自grain；測試判定門檻為0.03）；256²取樣下亮處（color>0.5）占35.93%–37.11%、color 0.0378–0.0398至0.7800–0.7816、平均0.4049–0.4120、roughness恆為0.4、AO恆為1、height至多0.9792–0.9899 relief；512²取樣亮處占36.22%–37.50%、color 0.0366–0.0389至0.7818–0.7831、平均0.4049–0.4120、height至多0.9862–0.9884 relief；seed 0與1相比，狀態≥4的格子有49.3%位置不同、color>0.5的節點有46.5%不同；seed 7的512²maps平均r／g／b約(109.8, 93.9, 67.8)、法線tilt²最大約0.0120、z分量最小254。我實看了預覽（seed 7）：靛藍與琥珀黃的螺旋與迷宮狀波紋，波前呈短短的漸層。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`isingdomains`（伊辛域）使目前目錄1013→1014種，含plain的gallery為1015項。對64×64環面上的二維伊辛模型（Ising model）做Metropolis動力學的快照：每格是向上或向下的自旋，隨機起始，在溫度2.35（耦合常數與波茲曼常數取1；二維伊辛模型的臨界溫度約2.269，這是標準值、我沒有在此驗證）下以棋盤順序進行150個掃描，每次翻轉若使能量變化dE，當`dE ≤ 0`或雜湊產生的均勻亂數小於`exp(−dE/溫度)`時接受；結果是同向自旋聚成的磁區（domain）：向上為亮色、向下為暗色，並以「四個鄰居中與自己同向的比例」輕微染色，讓磁區邊界較暗，呈萊姆綠的迷彩狀圖案。四個seed的向上自旋比例在24.3%到55.3%之間，與鄰格相同的比例約79%–83%（隨機起始時為50%）。seed決定起始組態與每步的亂數，所以每個seed的圖案完全不同。這是示意的模型快照，不是對磁性材料的模擬或量測，也不保證已達平衡。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；溫度2.35、150個掃描、tanh銳利度8、色調（自旋0.6、同向0.12）、萊姆綠與暗綠色調及0.5 m nominal tile皆作者設定（預覽只看了一版，預覽中的圖案因偏向多數自旋而以暗色為主）。測試無法獨立重現動力學（雜湊亂數序列是sampler內部的），所以我**沒有獨立重寫Metropolis更新**：測試從sampler輸出的節點顏色反推自旋，檢查顏色與（自旋、同向鄰居數）一致，並檢查統計量（相鄰同向比例約0.78–0.84，而不是隨機起始的0.5；同向區域數100–150；最大區域大於1,800格；向上比例在0.2到0.6之間），**這證明結果不是隨機雜訊、且上色邏輯正確，但不證明它是正確的Metropolis取樣，也沒有驗證平衡狀態**。測試中途有一次失敗：我從滲流團簇的測試複製了roughness檢查（期望線處降到約0.2），但此材質的roughness固定為0.4，失敗的是複製過來的期望值；我之前在沙堆單位元已遇過同樣的問題，這次還是漏改，改為檢查roughness等於preset值後通過。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0244）。

啟動時（每個sampler）以`hash(x, y, seed ^ 鹽值) < 0.5`決定初始自旋（±1），然後做150個掃描，每個掃描分兩個半掃描（棋盤的兩種奇偶，同一奇偶的格子彼此不相鄰、可獨立更新），對每個格子算鄰居（環繞）自旋和`around`、能量變化`dE = 2·自旋·around`，當`dE ≤ 0`或`hash(格子, 掃描 × 2 + 奇偶, seed ^ 鹽值 + 2) < exp(−dE / 2.35)`時翻轉；之後記下每格是否向上（`marks`）與四個鄰居中與自己同向的比例（`agree`）；取樣時以`latticeField`（C1 smoothstep）混合向上圖並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化，另一個`latticeField`混合同向比例圖：顏色＝`0.05 + 0.6·line + 0.12·agree + 0.03·(128²細grain − 0.5)`、height ＝ `0.7·line + 0.1·agree + 0.2·grain`、roughness固定0.4、AO恆為1、金屬factor為0；保留的cache為兩個`Float64Array(4096)`（向上圖與同向比例）加`Float64Array(128²)`，共196,608 B，另有4,096 B的`Int8Array`自旋。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個sampler的建構（150個掃描）在bun中量到約102 ms（第一次）、64 ms、65 ms、65 ms（四個seed各一次），是單次量測、不是benchmark；取樣本身只做常數次運算，我沒有量測。實測（工具實跑）於seed 0／1／0xffffffff／7：向上自旋比例55.3%／24.3%／52.4%／32.5%；相鄰同向比例0.8164／0.8296／0.8115／0.7908；四連通同向區域109／144／133／127個、最大區域2,153／3,058／1,863／2,683格、第二大1,590／573／1,834／619格；4,096個節點的顏色與測試中獨立的模型（自旋與同向鄰居數）一致，最大誤差0.0150以內（誤差來自grain；測試判定門檻為0.03）；256²取樣下亮處（color>0.4）占55.39%／23.71%／52.35%／32.05%、color 0.0415–0.0441至0.7830–0.7843、平均0.2931–0.4803（隨seed而異）、roughness恆為0.4、AO恆為1、height至多0.9895–0.9962 relief；512²取樣亮處占55.37%／23.85%／52.35%／32.17%、color 0.0370–0.0388至0.7839–0.7846、平均0.2929–0.4803、height至多0.9956–0.9983 relief；seed 0與1的向上自旋有54.0%位置不同；seed 7的512²maps平均r／g／b約(77.6, 100.8, 36.4)、法線tilt²最大約0.0244、z分量最小253。我實看了預覽（seed 7）：暗綠底上萊姆綠的磁區，邊緣呈像素化的圓角，有許多孤立的小點。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`percolationclusters`（滲流團簇）使目前目錄1012→1013種，含plain的gallery為1014項。在64×64的環面上做臨界點位滲流（site percolation）：每個格子以雜湊決定是否被佔據，佔據機率取0.5927（這是我所知的正方格點位滲流臨界機率的標準值，我沒有在此驗證）；上下左右相鄰（環繞）的佔據格連成一個團簇，用union-find找出；每個被佔據的格依「所屬團簇大小的對數 / 最大團簇大小的對數」上色（最大團簇最亮、單獨一格的最暗但仍亮於空格），空格是暗色底，呈硫磺黃色的迷彩狀圖案。實際佔據格比例因隨機波動略低於目標（四個seed共2,358–2,414格，占57.6%–58.9%）。seed決定哪些格被佔據，所以每個seed的圖案完全不同。這是示意的隨機圖案，不是對真實滲流現象的模擬或量測。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；佔據機率0.5927、tanh銳利度8、色調（線0.72、色調下限0.3）、硫磺黃與暗橄欖色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。測試先量錯了一個門檻：我第一版測試的亮區占比範圍是用「color > 0.3」的探針數字寫的，而測試用「color > 0.5」，所以第一次測試失敗（0.4475 < 0.55）；改用`color > 0.5`量得的範圍（256²取樣44.75%–48.62%）後通過；之後平均值範圍又因為我只算了三個seed而漏掉seed 7（0.3844）失敗一次，放寬為0.38後通過。這兩次都是我測試期望值的錯誤，不是sampler的問題。這個材質的團簇標記由測試從sampler輸出的節點顏色反推佔據格，再以獨立的洪水填充演算法重新標記團簇並計算預期顏色，所以驗證的是團簇邏輯（含環面環繞），**並不驗證雜湊決定的佔據格本身**。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0260）。

啟動時對`64 × 64`的每格以`hash(x, y, seed ^ 鹽值) < 0.5927`決定是否佔據，對每個佔據格把它與右邊與下面（環繞）的佔據格以union-find（路徑壓縮）合併，統計每個團簇的大小，`largest`為最大團簇大小（至少2），佔據格的標記設為1、色調為`ln(團簇大小) / ln(largest)`；取樣時以`latticeField`（C1 smoothstep）混合佔據圖並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化，另一個`latticeField`混合色調圖：顏色＝`0.05 + 0.72·line·(0.3 + 0.7·tone) + 0.03·(128²細grain − 0.5)`、height ＝ `0.8·line·(0.7 + 0.3·tone) + 0.2·grain`、線處roughness降低0.2（底0.4）、AO恆為1、金屬factor為0；保留的cache為兩個`Float64Array(4096)`（佔據與色調）加`Float64Array(128²)`，共196,608 B，另有建構時的暫存陣列（佔據4,096 B、父節點16,384 B、團簇大小16,384 B），皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個取樣點只做常數次運算，我沒有量測耗時。實測（工具實跑）於seed 0／1／0xffffffff／7：獨立洪水填充演算法得到的結果——佔據格2,358／2,414／2,391／2,408個、團簇105–138個、最大團簇1,212–1,846格、第二大72–639格、單獨一格的團簇66–78個、最大團簇涵蓋全部64列（四個seed）與全部64欄（三個seed，seed 1為50欄）；4,096個節點的顏色與獨立模型一致，最大誤差0.0150以內（誤差來自grain；測試判定門檻為0.03）；256²取樣下亮處（color>0.5）占44.75%–48.62%、color 0.0357–0.0360至0.7837–0.7842、平均0.3844–0.3984、roughness 0.2001–0.3999、AO恆為1、height至多0.9929–0.9962 relief；512²取樣亮處占40.83%–44.44%、color 0.0352–0.0354至0.7844–0.7846、平均0.3840–0.3979、height至多0.9974–0.9988 relief；seed 0與1的佔據格有49.5%的位置不同；seed 7的512²maps平均r／g／b約(112.7, 107.6, 48.5)、法線tilt²最大約0.0260、z分量最小253。我實看了預覽（seed 7）：暗橄欖色底上硫磺黃色的迷彩狀圖案，大團簇呈亮黃、小團簇較暗。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`voronoifacets`（Voronoi切面）使目前目錄1011→1012種，含plain的gallery為1013項。與`voronoicells`相同的Voronoi板塊（8×8格各一個抖動位置點、軟權重分區、64塊板塊與深色細縫），但每塊板塊不是單一色調，而是沿一個隨機方向的線性漸層（切面狀）：每個位置點有各自的色調與漸層方向／大小（每格寬至多±0.35的色調變化），板塊內的色調從一側較暗漸變到另一側較亮，像是翡翠或寶石的切面；呈翡翠綠，縫仍是深色、粗糙（roughness升高0.4）、被AO加深。seed決定位置點、色調與漸層。這是示意的切面寶石外觀，不是真實的礦物，沒有對照任何實物。與`voronoicells`、`voronoipillows`共用同一個sampler分支，新增漸層欄位；已知缺點同voronoicells：銳角交會處有模糊污點。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；漸層強度0.35、色調（板塊0.7、色調下限0.3）、roughness底0.3、縫的roughness增量0.4、relief 0.0012、翡翠綠色調與0.4 m nominal tile皆作者設定（預覽只看了一版）。為了共用分支，我在`voronoicells`與`voronoipillows`的preset新增了欄位`facet: 0`；漸層項在facet為0時加上0（數值不變），且只有facet不為0時才對色調做`smoothstep(clamp())`，所以它們的行為不變，兩者的測試（各8個測試案例）仍通過；我沒有另外逐位比對修改前後的輸出，只靠這些測試。已知缺點與voronoicells相同（模糊污點、沒有獨立重寫位置點的模型、測試只檢查可觀測行為）。錯誤紀錄：我寫的第一版測試斷言「每塊板塊的色彩差距都大於0.2」，4個seed全部失敗（實測最小的板塊差距只有0.083）；我當時只量過全體的最大差距（0.31–0.36）而沒有量分布，之後量得各板塊差距的最小值約0.029–0.036、中位數0.135–0.175、平均0.141–0.168，改為斷言平均差距在0.13到0.18之間、最大差距大於0.28、每塊小於0.4後通過；這是我測試期望的錯誤，不是sampler的問題。

沿用voronoicells的sampler（現在同時服務`voronoicells`、`voronoipillows`與`voronoifacets`）：啟動時每格額外以內部雜湊算出漸層`gradientX = 0.35·2·(hash − 0.5)`與`gradientY`（以兩個不同的seed鹽值）；取樣時在5×5鄰近格的25個位置點上，除了權重`w_i = exp(−(d_i − d_min)/0.02)`之外，記下取樣點到位置點的位移`(fromX, fromY)`，色調為`Σ w_i·(tone_i + gradientX_i·fromX_i + gradientY_i·fromY_i) / Σ w_i`，再以`smoothstep(clamp(色調))`限制在[0, 1]；邊界量（吉尼不純度）、顏色、height等其餘與voronoicells相同：顏色＝`0.05 + 0.7·(0.3 + 0.7·色調)·(1 − edge) + 0.02·edge + 0.02·(128²細grain − 0.5)`、height ＝ `0.8·(1 − edge)·(0.8 + 0.2·色調) + 0.06·grain`、`roughness = 0.3 + 0.4·edge`、`occlusion = 1 − 0.45·edge`、金屬factor為0；cache合計五個`Float64Array(64)`、四個`Float64Array(25)`、一個`Int32Array(25)`加`Float64Array(128²)`，共134,432 B加100 B，皆為lattice算術預算（非總RAM）。預設0.4 m nominal tile與0.0012 UV-relative relief（非公尺位移）。每個取樣點約25次距離與指數運算，我沒有量測此材質的耗時。實測（工具實跑）：四個seed（0／1／0xffffffff／7）在512²取樣下，把occlusion大於0.97的像素以4連通（環繞）分區，每個seed恰好64個區域；區域大小最小1,325–1,739像素、最大4,681–5,242像素；各板塊內色彩差距（最大減最小）的平均為0.141–0.168、中位數0.135–0.175、最小0.029–0.036、最大0.307–0.356（平板的voronoicells最大只有0.0654，來自grain）；各區域平均色彩最暗0.2595–0.2609、最亮0.7445–0.7469；內部像素占74.54%–75.93%；256²取樣（seed 0／1／0xffffffff／7）color 0.0619–0.0626至0.7589–0.7592、平均0.4211–0.4377（隨seed而異）、roughness 0.3至約0.6997、AO最低0.5503–0.5504、height至多0.8569–0.8583 relief；512²取樣（四個seed）color 0.0610–0.0617至0.7595–0.7597、平均0.4211–0.4377、height至多0.8588–0.8592 relief；seed 0與1的內部遮罩（512²）有36.3%像素不同；二階差分C1掃描（seed 0，含格線與16,384個黃金比例點）沒有任何點超過0.03；seed 7的512²maps平均r／g／b約(67.9, 125.1, 105.3)、法線tilt²最大約0.0468、z分量最小252。我實看了預覽（seed 7）：翡翠綠的多邊形板塊，每塊有由一側向另一側的明暗漸層，被深色細縫隔開，只在少數銳角交會處有模糊污點。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`multiplicativeorder`（乘法階表）使目前目錄1010→1011種，含plain的gallery為1012項。48×48個方格，格(col, row)代表模`n = row + 2`（2到49）下的剩餘`a = col + 1`（1到48）：若a與n有公因數，a沒有乘法階，該格塗成最暗的色調（共887格）；否則以乘法階`ord_n(a)`（使`a^k ≡ 1 (mod n)`的最小正整數k）除以`φ(n)`（與n互質的剩餘個數）上色，再取1.5次方：比值1代表a是模n的原根（共406格，只有n為2、4、質數的冪或2倍質數的冪時才存在，這是標準的數論事實，我沒有在測試中驗證），階為1的格子（a ≡ 1）共189格，最大的階是46（模質數47的原根）。呈現冰藍色在深藏青底上，亮格像是不規則散布的點與短線。方格是帶圓角的拉升方塊，隨高度與AO顯示間隙，seed把整張表在環面上平移。與`totienttable`、`divisorcount`等數論表共用相同的方格形狀（沿用Mandelbrot方塊的「內部」色調處理沒有乘法階的格子）。這只是前48×48個剩餘的乘法階比值表示，不是證明或圖解任何數論定理。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；toneExponent 1.5、toneFloor 0.14、toneSpan 0.7、insideTone 0.02、冰藍與深藏青色調及0.3 m nominal tile皆作者設定（預覽只看了一版）。我沒有檢查a ≥ n時的剩餘（a mod n）是否會讓表有明顯的週期性重複（例如n = 2、3等小模數的列是週期性的），這是這個取值方式的特性。方格形狀與色調組合沿用totienttable的參數。測試一次通過，無需調整區間；沒有乘法階的格子數（887）、原根格數（406）、階為1的格數（189）與最大階46是測試中用獨立的重複乘法與互質計數算出的值，並非與原理論值比對。

啟動時對每格（`n = row + 2`、`a = col + 1`）檢查`gcd(a, n)`：不為1則記為`−1`（沒有乘法階），否則以重複乘法求乘法階（`power = a % n`起，反覆乘以`a % n`取模直到回到1，次數即階），再以互質計數得`φ(n)`，色調為`(階 / φ(n))^1.5`；取樣時每個方格用一個緊緻支撐的圓角方塊核（四次超橢圓經smoothstep，在方格邊界之前就恰好為零，所以方格查找不會跳動，場為C1）：色調`tone ≥ 0`時顏色＝`0.04 + (0.14 + 0.7·tone − 0.04)·遮罩 + 0.03·(128²細grain − 0.5)`，`tone < 0`時用`0.02`取代`0.14 + 0.7·tone`；height ＝ `0.8·dome·(0.88 + 0.12·tone)`（沒有階的格用0.5取代括號內的值）`+ 0.08·grain`、`occlusion = 1 − 0.4·(1 − 遮罩)`、roughness固定0.4、金屬factor為0；cache合計`Float64Array(2304)` 18,432 B加`Float64Array(128²)` 131,072 B，共149,504 B，皆為lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個取樣點只做常數次運算，我沒有量測耗時。實測（工具實跑）：2304格中沒有乘法階的有887格、原根格406個、階為1的189個、最大階46；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）占12.50%–12.64%、color 0.0055–0.0058至0.8541–0.8544、平均0.2146–0.2153、AO最低0.6、height至多0.8753–0.8768 relief；512²取樣（seed 0／1／0xffffffff／7）亮處占12.47%–12.74%、color 0.0052–0.0054至0.8545–0.8547、平均0.2142–0.2163、height至多0.8772–0.8784 relief；每個seed恰好有一種環面平移（seed 0為(28, 20)、1為(38, 22)、0xffffffff為(20, 37)、7為(37, 9)）能使2304格中心的顏色與測試中獨立重寫的色調一致，最大誤差0.0150以內（誤差來自grain；測試判定門檻為0.03）；seed 0與1相比，有59.9%的格子中心色差大於0.05，亮區遮罩（512²）有20.4%像素不同；seed 7的512²maps平均r／g／b約(45.4, 59.2, 78.2)、法線tilt²最大約0.0300、z分量最小253。我實看了預覽（seed 7）：深藏青底上冰藍色的圓角方格散布成不規則的點與短線圖案，有幾列呈現規則的重複。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`sandpileidentity`（沙堆單位元）使目前目錄1009→1010種，含plain的gallery為1011項。畫出64×64格的阿貝爾沙堆群（abelian sandpile group）的單位元：每格放一堆沙，滿4粒就倒塌、給上下左右四個鄰居各1粒，邊界格掉出去的沙進入「沙漏」消失；單位元由Dhar的方法得到：把每格都放3粒的最大穩定組態的兩倍（每格6粒）穩定化、用6減去結果得到餘量、再穩定化一次。結果是一個高度（0到3粒）的圖案：396格為0、152格為1、1,476格為2、2,072格為3，左右、上下與對角（轉置）都對稱，呈現華麗的曼陀羅般花紋；用4個高度等級對應金色的深淺（0最暗、3最亮），邊緣與平坦的方塊區域是單位元的特徵。seed只把整個64×64圖案沿環面平移；因為單位元本身不是週期的（邊界是沙漏），拼貼時會看到圖案邊界形成的方框接縫。這只是這個數學物件的視覺化，不是真正的沙堆。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；64×64的大小、tanh銳利度8、色調（span 0.72）、金色與暗褐色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。我沒有查證Dhar的單位元公式的原始文獻，公式（兩倍最大組態穩定化後相減再穩定化）是依我的了解寫成，並在測試中用「`e + e`穩定化後仍等於`e`」這個單位元的必要性質以及獨立的掃描式倒塌演算法（與sampler用的堆疊式演算法不同）驗證，而不是只靠公式本身；**這只證明結果是這個群中滿足`e + e = e`的元素，我沒有另外驗證它對所有可復現組態都是單位元**。拼貼接縫是設計上的結果，我沒有嘗試把它隱藏。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0297）。測試中途有一次失敗：我從T方塊碎形的測試複製了roughness的檢查（期望線處roughness降到約0.2），但這個材質的roughness固定為0.4，所以失敗的是複製過來的期望值，不是sampler；我改為檢查roughness恆等於preset值後通過。

啟動時（每個process只算一次、以大小為鍵快取，所有seed與sampler共用）在`64 × 64`的格上對全為6的組態做穩定化（用堆疊逐一處理高度≥4的格：`toppled = floor(高度/4)`，該格減`4·toppled`、四個存在的鄰居各加`toppled`，邊界外的沙消失），用6減去結果，再穩定化一次，得到`Uint8Array(4096)`的單位元（我的計時腳本中第一次穩定化共2,323,784次倒塌、第二次881,488次，整段在bun中約69 ms，是單次量測、不是benchmark）；每個sampler依高度門檻1、2、3各建一個`Float64Array(4096)`（高度 ≥ 門檻則為1，依seed的環面平移），取樣時各以`latticeField`（C1 smoothstep）混合並以`0.5 + 0.5·tanh(8·(field − 0.5))`重新銳化，三者相加除以3為色調：顏色＝`0.05 + 0.72·色調 + 0.03·(128²細grain − 0.5)`、height ＝ `0.8·色調 + 0.2·grain`、roughness固定0.4、AO恆為1、金屬factor為0；每個sampler的cache為3×4,096 + 128² = 28,672個Float64／229,376 B，另有共用的4,096 B單位元，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個取樣點只做常數次運算，我沒有量測取樣的耗時。實測（工具實跑）：測試中以獨立掃描式演算法算出的單位元高度分布為0／1／2／3各396／152／1,476／2,072格，左右、上下、轉置皆對稱，且`e + e`穩定化後等於`e`；於seed 0／1／0xffffffff／7：256²取樣下亮處（color>0.5）占86.28%–86.31%（seed 0／1／0xffffffff）、color 0.0364–0.0374至0.7840–0.7844、平均0.6030–0.6031、roughness恆為0.4、AO恆為1、height至多0.9950–0.9973 relief；512²取樣亮處占85.87%–85.88%、color 0.0356–0.0358至0.7846–0.7847、平均0.6034–0.6036、height至多0.9984–0.9991 relief；每個seed的64×64個node（取樣在node上）恰好有一種環面平移（seed 0為(52, 10)、1為(14, 48)、0xffffffff為(9, 46)、7為(6, 37)）使4,096個node的顏色與獨立模型一致，最大誤差0.0150以內（等於grain的最大振幅0.03×0.5，測試判定門檻為0.03）、亮node（高度2或3）數皆為3,548（= 1,476 + 2,072）；seed 0與1的亮node有23.3%不同；seed 7的512²maps平均r／g／b約(165.0, 143.7, 93.7)、法線tilt²最大約0.0297、z分量最小253。我實看了預覽（seed 7）：金黃色底上深色的點陣與曼陀羅般的花紋，與較大的平坦方塊區域。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`voronoipillows`（Voronoi枕塊）使目前目錄1008→1009種，含plain的gallery為1010項。與`voronoicells`相同的Voronoi板塊（8×8格各一個抖動位置點、軟權重分區、64塊板塊與深色細縫），但每塊板塊的高度是隆起的圓頂（枕頭狀）：高度隨「到加權平均位置點的距離」平滑下降，板塊中央最高、靠近縫處降到底；顏色是赤陶土色（每塊板塊有各自的亂數深淺），縫仍是深色、粗糙、被AO加深。seed決定位置點與色調。這是示意的陶磚／枕塊外觀，不是真實的陶土，沒有對照任何實物。與`voronoicells`共用同一個sampler分支，只有preset不同，並新增圓頂欄位。已知缺點同voronoicells：銳角交會處有模糊污點。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；圓頂半徑0.55格、圓頂高度0.5、板塊基礎高度0.4、roughness 0.45、relief 0.0016、赤陶土色調與0.4 m nominal tile皆作者設定（預覽只看了一版，而預覽只顯示底色，看不出圓頂，所以圓頂以探針與測試的高度統計驗證，**我沒有看到實際打光的3D外觀**）。為了共用分支，我在`voronoicells`的preset新增了欄位`domeRadius: 0.55`與`domeHeight: 0`（圓頂高度0使其行為與數值不變，它的8個測試案例仍通過）。已知缺點與voronoicells相同（模糊污點、沒有獨立重寫位置點的模型、測試只檢查可觀測行為）。測試一次通過，無需調整區間。

沿用voronoicells的sampler（現在同時服務`voronoicells`與`voronoipillows`）：在5×5鄰近格的25個位置點上算出權重`w_i = exp(−(d_i − d_min)/0.02)`後，除了色調加權平均與吉尼不純度（邊界量）之外，再算加權平均距離`Σw_i·d_i / Σw_i`（平滑，因為是歸一化權重的平滑函數），圓頂項為`domeHeight·(1 − edge)·smoothstep(clamp(1 − 平均距離/0.55))`；height ＝ `0.4·(1 − edge)·(0.8 + 0.2·色調) + 0.5·(1 − edge)·圓頂 + 0.08·grain`（最大約0.98，不超過1）；其餘與voronoicells相同：顏色＝`0.06 + 0.62·(0.35 + 0.65·色調)·(1 − edge) + 0.02·edge + 0.03·(128²細grain − 0.5)`、`roughness = 0.45 + 0.3·edge`、`occlusion = 1 − 0.45·edge`、金屬factor為0，cache同voronoicells（133,008 B加100 B）。預設0.4 m nominal tile與0.0016 UV-relative relief（非公尺位移）。每個取樣點約25次距離與指數運算，我沒有量測此材質的耗時。實測（工具實跑）：四個seed（0／1／0xffffffff／7）在512²取樣下，把occlusion大於0.97的像素以4連通（環繞）分區，每個seed恰好64個區域；區域大小最小1,326–1,850像素、最大4,559–4,956像素；區域內色彩最大差距不超過0.0687；各區域平均色彩最暗0.2770–0.2825、最亮0.6731–0.6768；內部像素占74.27%–75.37%；每塊板塊內部的高度差（最大減最小，以relief為單位）為0.5297–0.5966（約半個relief，平板只有grain的差異），每塊板塊的峰值高度0.8482–0.9677 relief；256²取樣（seed 0／1／0xffffffff）color 0.0674–0.0689至0.6880–0.6915、平均0.4115–0.4312、roughness 0.45至0.7497–0.7498、AO最低0.5503–0.5504、height至多0.9585–0.9625 relief；512²取樣（四個seed）color 0.0667–0.0676至0.6894–0.6941、平均0.4115–0.4312、height至多0.9646–0.9677 relief；seed 0與1的內部遮罩（512²）有35.8%像素不同；seed 7的512²maps平均r／g／b約(116.4, 78.6, 59.4)、法線tilt²最大約0.0820、z分量最小250。我實看了預覽（seed 7，只有底色）：赤陶土色的多邊形板塊與深色細縫，只在少數銳角交會處有模糊污點。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`voronoicells`（Voronoi細胞）使目前目錄1007→1008種，含plain的gallery為1009項。這是引擎第一個Voronoi（最近點）家族的材質：在8×8格的週期網格上每格放一個抖動的位置點（site，離格中心至多±0.4格），共64個位置點，每個點有一個亂數色調；整張貼圖依「最近的位置點」分成64塊多邊形板塊，每塊板塊一個色調（藍灰色，由暗到亮），板塊之間是深色的細縫（較粗糙、被AO加深、高度較低）。邊界用軟權重（見技術細節）而非硬性的最近點查找，因此場是平滑（C1）的，縫的寬度是固定的小量。seed只決定位置點與色調（每個seed的板塊排列都不同）。這是示意的石板／馬賽克外觀，不是真實的石材，板塊的亮暗是亂數、沒有對照任何真實石頭。已知的缺點：在邊緣以非常尖的角度交會的地方，縫會變成一小片模糊的三角形污點（預覽中可見幾處）。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；8×8格、抖動0.8、軟度0.02、edgeGain 10、色調（板塊0.62、色調下限0.35、縫0.02）、藍灰色調、relief 0.0012及0.4 m nominal tile皆作者設定。調整與錯誤紀錄：(1)第一版軟度0.04、edgeGain 6，預覽看到多處模糊的污點，改為軟度0.02、edgeGain 10後污點變小但沒有消失（共看了3張預覽，其中後兩張在整理程式碼後逐位元組相同）。(2)第一版使用3×3的鄰近格視窗，C1測試失敗（二階差分比332.8）：我用探針逐點掃描（seed 0），有213個（點、軸、通道）組合超過0.03；原因是點穿過格邊界時視窗換邊，掉出視窗的位置點與最近距離之差有時只有約0.1格寬，權重不可忽略，造成斜率跳動；改成5×5視窗後同一個掃描為0個超標，統計數字與修正前逐位相同（到1e-15）。測試通過是在改成5×5之後。(3)這個材質我沒有獨立重寫位置點的模型：位置點由內部雜湊決定，測試只檢查可觀測的行為（64個板塊、每塊一個色調、縫的特性、C1、週期），**沒有比對位置點座標**。

啟動時在8×8的週期網格上對每格以內部雜湊（三個不同的seed鹽值）算出位置點的x、y偏移（`0.8·(hash − 0.5)`格寬）與色調（`hash`）；取樣時對取樣點所在格周圍的5×5格（共25個位置點，位置用展開座標，格索引取模）算出距離`d_i`與最近距離`d_min`，權重`w_i = exp(−(d_i − d_min) / 0.02)`（用最近距離平移只是避免數值下溢，歸一化後不影響結果），色調取加權平均、邊界量取吉尼不純度`1 − Σ(w_i / Σw)²`（格內為0、兩板塊交界為1/2）、`edge = 1 − exp(−10·不純度)`：顏色＝`0.06 + 0.62·(0.35 + 0.65·色調)·(1 − edge) + 0.02·edge + 0.03·(128²細grain − 0.5)`、height ＝ `0.8·(1 − edge)·(0.8 + 0.2·色調) + 0.08·grain`、`roughness = 0.4 + 0.3·edge`、`occlusion = 1 − 0.45·edge`、金屬factor為0；cache合計三個`Float64Array(64)`、兩個`Float64Array(25)`、一個`Int32Array(25)`加`Float64Array(128²)`，共133,008 B加100 B，皆為lattice算術預算（非總RAM）。預設0.4 m nominal tile與0.0012 UV-relative relief（非公尺位移）。每個取樣點約25次距離與指數運算；我只量過三次512² maps生成（seed 0、1、2各一次）約143–182 ms，是單次量測、不是benchmark，也沒有與其他材質比較。實測（工具實跑）：四個seed（0／1／0xffffffff／7）在512²取樣下，把occlusion大於0.97的像素（遠離縫）以4連通（環繞）分區，每個seed恰好得到64個區域；區域大小最小974–1,851像素、最大4,536–5,019像素；每個區域內色彩最大差距不超過0.0654；各區域平均色彩最暗0.2764–0.2892、最亮0.6676–0.6765；這些內部像素占74.47%–75.25%；256²取樣（seed 0／1／0xffffffff）color 0.0668–0.0694至0.6842–0.6902、平均0.3962–0.4315（隨seed而異）、roughness 0.4至約0.6998、AO最低0.5503–0.5505、height至多0.8734–0.8754 relief；512²取樣（四個seed）color 0.0664–0.0671至0.6850–0.6938、平均0.3959–0.4315、height至多0.8755–0.8790 relief；seed 0與1的內部遮罩（512²）有35.9%像素不同；seed 7的512²maps平均r／g／b約(87.3, 99.6, 111.6)、法線tilt²最大約0.0468、z分量最小252。我實看了最終預覽（seed 7）：藍灰色的多邊形板塊與深色細縫，板塊色調深淺不一，只在少數銳角交會處有模糊污點。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`cantordust`（康托爾塵）使目前目錄1006→1007種，含plain的gallery為1008項。在81×81的lattice上畫出第4階的二維康托爾集（Cantor dust）：把方格切成3×3，只保留四個角、挖掉十字形的五塊（四條邊與中心），重複四次；也就是一個格子（x, y）存活的條件是從最粗到最細的每一對三進位數字中，x與y的數字都不是1。存活格共4⁴ = 256個，以金黃色的小圓點呈現，其餘格依「在哪一層被挖掉」用深淺不同的暗色上色：最粗層（十字形的五塊27×27，共3,645格）最亮，往細層（1,620、720、320格）依序變暗，整體像是星座般的點陣，點與點的間隔至少兩格。seed只把整個lattice沿環面平移。與`vicsekfractal`共用同一個sampler分支，只有存活規則不同（Vicsek保留十字、Cantor塵保留四個角）。這只是示意的碎形圖案，不是精確的數學圖解。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；階數4、tanh銳利度8、色調（線0.72、深度0.14）、金黃與暗靛色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。這個材質亮的部分很少（約3%），畫面主體是暗褐色的深度色調，我沒有嘗試放大點的半徑。為了共用分支，我在`vicsekfractal`的preset新增了欄位`rule: 0`（0＝十字、2＝康托爾塵），其行為與數值不變，其測試仍通過；規則1（X形）我沒有實作，所以preset也沒有使用它。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0426）。測試一次通過，無需調整區間；測試中的層級格數與存活格數是由以細分法獨立重寫的模型算出，並與我的封閉形式推算（5·27²、4·5·9²、16·5·9、64·5）一致。

沿用vicsekfractal的sampler分支（現在同時服務`vicsekfractal`與`cantordust`）：啟動時在`81 × 81`的lattice上對每個格子逐層檢查（`unit = 3^(3 − 層)`，取x與y在該層的三進位數字是否為1），規則0（Vicsek）在兩個數字都不是1時、規則2（Cantor塵）在任一個數字是1時記下此層為「被挖掉的層」，存活者設`marks = 1`、被挖掉的設`marks = 0`並記`depth = (4 − 層) / 4`，並依seed的環面平移把格子寫入兩個`Float64Array`；取樣時與vicsekfractal完全相同：`latticeField`（C1 smoothstep）混合存活圖並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化，另一個`latticeField`混合depth圖，顏色＝`0.05 + 0.72·line + 0.14·depth·(1 − line) + 0.03·(128²細grain − 0.5)`、height ＝ `0.8·line + 0.2·grain`、線處roughness降低0.2（底0.4）、AO恆為1、金屬factor為0；cache合計81² × 2 + 128² = 29,506個Float64／236,048 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個取樣點只做常數次運算，我沒有量測耗時。實測（工具實跑）於seed 0／1／0xffffffff／7：存活格256個、被挖掉的格依層為3,645／1,620／720／320；256²取樣下亮處（color>0.5）占2.96%–2.98%、color 0.0688–0.0705至0.7819–0.7838、平均0.1861–0.1864、roughness 0.2001–0.3999、AO恆為1、height至多0.9818–0.9934 relief；512²取樣亮處占2.97%–2.98%、color 0.0678–0.0682至0.7834–0.7844、平均0.1862–0.1864、height至多0.9917–0.9974 relief；每個seed的81×81個node（取樣在node上）恰好有一種環面平移（seed 0為(74, 64)、1為(62, 2)、0xffffffff為(47, 31)、7為(64, 29)）使6,561個node的顏色（含各層深度色調）與獨立重寫的模型一致，最大誤差0.0149以內（誤差來自grain；測試判定門檻為0.03）、亮node數皆為256；seed 0與1的亮node有7.6%不同；seed 7的512²maps平均r／g／b約(54.0, 43.8, 41.9)、法線tilt²最大約0.0426、z分量最小252。我實看了預覽（seed 7）：暗褐色的底上一組組金黃色小圓點，像星座，點群的排列依層級分塊，點群之間有較亮與較暗的塊狀色調。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`tsquarefractal`（T方塊碎形）使目前目錄1005→1006種，含plain的gallery為1007項。在64×64的lattice上畫出第5階的T方塊碎形（T-square fractal）：先在正中央畫邊長32的方塊，再在每個方塊的四個角上畫邊長減半、以該角為中心的方塊，共5層（邊長32、16、8、4、2，方塊數1、4、16、64、256，共341個）；方塊會互相重疊，每個被覆蓋的格子記住覆蓋它的最深層（最小的方塊畫在最上面）。被覆蓋的格子共3,124個（占4,096格的76.3%），依最深層分別為324、432、576、768、1,024格，沒被覆蓋的972格形成深褐色的十字與T形骨架；被覆蓋處是奶油色，層越深越亮。seed只把整個lattice沿環面平移。這只是示意的碎形圖案，不是精確的數學圖解，覆蓋區（不是方塊的邊界線）才是亮的部分。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；階數5、tanh銳利度8、色調（線0.5、層0.22）、奶油與深褐色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。我沒有嘗試調整為「只畫方塊邊界線」的樣式，所以畫面以大片奶油色覆蓋區為主、骨架是暗色。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0260）。測試一次通過，無需調整區間；測試的層級格數（324／432／576／768／1,024與972未覆蓋）由獨立以遞迴重寫的模型算出。

啟動時在`64 × 64`的lattice上，先令正中央一個邊長32的方塊為第0層，之後每層對上一層每個方塊的四個角各放一個邊長減半、以該角為中心的方塊（共5層），把方塊覆蓋的格子（依seed的環面平移、環繞）寫入兩個`Float64Array`：`marks = 1`與`levels = (層 + 1) / 5`（較深的層後寫，所以覆蓋同一格的方塊取最深層）；取樣時以`latticeField`（C1 smoothstep）混合覆蓋圖，再以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化，另一個`latticeField`混合層級圖：顏色＝`0.05 + 0.5·line + 0.22·level + 0.03·(128²細grain − 0.5)`、height ＝ `0.8·line·(0.7 + 0.3·level) + 0.2·grain`、線處roughness降低0.2（底0.4）、AO恆為1、金屬factor為0；cache合計64² × 2 + 128² = 24,576個Float64／196,608 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個取樣點只做常數次運算，我沒有量測耗時。實測（工具實跑）於seed 0／1／0xffffffff／7：被覆蓋的格3,124個、各層最深覆蓋格數324／432／576／768／1,024、未覆蓋972格；256²取樣下亮處（color>0.5）占75.78%（四個seed相同）、color 0.0362–0.0366至0.7833–0.7843、平均0.5505–0.5506、roughness 0.2001–0.3999、AO恆為1、height至多0.9905–0.9960 relief；512²取樣亮處占75.64%–75.65%、color 0.0355–0.0356至0.7842–0.7846、平均0.5505–0.5506、height至多0.9963–0.9984 relief；每個seed的64×64個node（取樣在node上）恰好有一種環面平移（seed 0為(26, 49)、1為(24, 40)、0xffffffff為(56, 59)、7為(39, 48)）使4,096個node的顏色（含各層色調）與獨立重寫的模型一致，最大誤差0.0150以內（這個數字等於grain的最大振幅0.03×0.5，測試判定門檻為0.03）、亮node數皆為3,124；seed 0與1的亮node有35.1%不同；seed 7的512²maps平均r／g／b約(152.1, 132.9, 96.3)、法線tilt²最大約0.0260、z分量最小253。我實看了預覽（seed 7）：奶油色大片覆蓋區上有深褐色的十字與T形骨架碎形，覆蓋區內有淡淡的層級色調。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`vicsekfractal`（維澤克碎形）使目前目錄1004→1005種，含plain的gallery為1006項。在81×81的lattice上畫出第4階維澤克碎形（Vicsek fractal，十字形碎形）：把方格切成3×3，保留十字形的五個區塊、挖掉四個角，重複四次；也就是一個格子（x, y）存活的條件是從最粗到最細的每一對三進位數字（x的數字, y的數字）中，至少有一個等於1。存活格共5⁴ = 625個，以金色的細線呈現（最細的一層為一格寬的十字臂），其餘格依「在哪一層被挖掉」用深淺不同的暗青綠色上色：最粗層（四個27×27的角，共2,916格）最亮，往細層（1,620、900、500格）依序變暗。seed只把整個lattice沿環面平移。與`sierpinskicarpet`同屬方塊碎形，但這個是十字形而非挖中心，存活格以略微凸起的細線（height高於周圍）呈現，不像`sierpinskicarpet`把方塊挖成凹陷。這只是示意的碎形圖案，不是精確的數學圖解。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；階數4、tanh銳利度8、色調（線0.72、深度0.14）、金色與暗青綠色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。我把存活格設成「亮」、被挖掉的格以深度著色，沒有嘗試反過來。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0426）。測試一次通過，無需調整區間；測試中每個層級的格數（2,916／1,620／900／500）與存活格數625是由以細分法獨立重寫的模型算出，並與我的封閉形式推算（4·27²、5·4·9²、25·4·3²、125·4）一致。

啟動時在`81 × 81`的lattice上對每個格子逐層檢查（`unit = 3^(3 − 層)`，取x與y在該層的三進位數字），若某層兩個數字都不是1就記下此層為「被挖掉的層」，存活者設`marks = 1`、被挖掉的設`marks = 0`並記`depth = (4 − 層) / 4`，並依seed的環面平移把格子寫入兩個`Float64Array`；取樣時以`latticeField`（C1 smoothstep）混合存活圖，再以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化，另一個`latticeField`混合depth圖：顏色＝`0.05 + 0.72·line + 0.14·depth·(1 − line) + 0.03·(128²細grain − 0.5)`、height ＝ `0.8·line + 0.2·grain`、線處roughness降低0.2（底0.4）、AO恆為1、金屬factor為0；cache合計81² × 2 + 128² = 29,506個Float64／236,048 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個取樣點只做常數次運算，我沒有量測耗時。實測（工具實跑）於seed 0／1／0xffffffff／7：存活格625個、被挖掉的格依層為2,916／1,620／900／500；256²取樣下亮處（color>0.5）占9.18%–9.24%、color 0.0687–0.0698至0.7830–0.7838、平均0.2184–0.2185、roughness 0.2001–0.3999、AO恆為1、height至多0.9902–0.9947 relief；512²取樣亮處占9.18%–9.22%、color 0.0678–0.0688至0.7841–0.7844、平均0.2184–0.2185、height至多0.9964–0.9976 relief；每個seed的81×81個node（取樣在node上）恰好有一種環面平移（seed 0為(43, 9)、1為(13, 9)、0xffffffff為(73, 77)、7為(60, 0)）使6,561個node的顏色（含各層深度色調）與獨立重寫的模型一致，最大誤差0.0149以內（誤差來自grain；測試判定門檻為0.03）、亮node數皆為625；seed 0與1的亮node有13.1%不同；seed 7的512²maps平均r／g／b約(58.8, 68.6, 51.2)、法線tilt²最大約0.0426、z分量最小252。我實看了預覽（seed 7）：暗青綠底上金色的細十字碎形，四個角的大塊顏色深淺依層級不同。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`squarekoch`（方形科赫島）使目前目錄1003→1004種，含plain的gallery為1005項。暗赤褐底上一條鮭魚粉色細線，描出第3階的第一型二次科赫島（type 1 quadratic Koch island）：從`F+F+F+F`（正方形）出發，把每個`F`取代為`F+F−F−F+F`三次，得到500個單位步、376個相異格點的封閉迴圈（終點回到起點）；與閔考斯基香腸（`minkowskisausage`，用`F+F−F−FF+F+F−F`）不同，這個島的邊在角落彼此接觸（500條邊沒有重複走過，但376個頂點中有重複造訪的），外框為27×27格，放在32×32格的環面上，與相鄰拼貼的島之間約有4格空白、不會相連；線寬為三分之一格，線外有淡淡的光暈。seed只把整條曲線沿環面平移。這是示意的碎形走線，不是真實的島嶼或地圖。與`dragoncurve`、`peanocurve`、`levycurve`、`minkowskisausage`共用同一個走線sampler分支，只有頂點串與取代規則不同。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；階數3、32×32格的環面、偏移(2, 2)、三分之一格的線寬、tanh銳利度8、鮭魚粉與暗赤褐色調與0.25 m nominal tile皆作者設定（預覽只看了一版）。先計算過：階數3的外框為27×27格，放在32×32格的環面上且偏移2，所以與相鄰拼貼的島之間約有4格空白，不會相連；我沒有嘗試階數4（會是500×5 = 2,500步、外框約135格，超過此走線分支使用的環面大小）。我沒有查證「type 1」這個名稱的標準文獻，名稱沿用我對該L系統的了解，這裡不聲稱來源。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0468）。測試一次通過，無需調整區間。

沿用走線sampler分支（現在同時服務`dragoncurve`、`peanocurve`、`levycurve`、`minkowskisausage`與`squarekoch`）：方形科赫模式下以turtle字串`F+F+F+F`、把每個`F`取代為`F+F-F-F+F`三次，`F`前進一格、`+`左轉90°、`−`右轉90°，得到501個頂點（最後一個回到起點）；在96×96的lattice上，格點放在每3個座標的位置（501個頂點中376個相異），相鄰兩格之間以2個連接node填滿（500條邊各2個，共1,000個），亮node合計1,376個（376 + 1,000）；曲線座標加上固定偏移(2, 2)與seed決定的環面平移；之後與dragoncurve相同：`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化，顏色＝`0.06 + 0.76·line + 0.1·glow·(1 − line) + 0.03·(128²細grain − 0.5)`，height ＝ `0.8·line + 0.2·grain`，線處roughness降低0.2（底0.4），金屬factor為0；cache合計96² + 8² + 128² = 25,664個Float64／205,312 B，皆為lattice算術預算（非總RAM）。預設0.25 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑）於seed 0／1／0xffffffff／7：256²取樣下亮處（color>0.5）占12.59%（四個seed相同）、color 0.0459–0.0461至0.8330–0.8336、平均0.1694–0.1695、roughness 0.2001–0.3999、AO恆為1、height至多0.9915–0.9944 relief；512²取樣亮處占16.32%（256²與512²不同是因為取樣格點密度不同，不是不一致）、color 0.0455–0.0456至0.8342–0.8345、平均0.1785–0.1787、height至多0.9965–0.9981 relief；每個seed的96×96個node（取樣在node上）恰好有一種環面平移（seed 0為(18, 3)、1為(23, 13)、0xffffffff為(2, 0)、7為(2, 30)）與測試中獨立以遞迴重寫的島嶼一致，亮node數皆為1,376；seed 0與1的node有24.3%不同；seed 7的512²maps平均r／g／b約(68.6, 36.9, 34.9)、法線tilt²最大約0.0468、z分量最小252。我實看了預覽（seed 7）：暗赤褐底上鮭魚粉色的細線構成一個菱形的碎形島，邊緣有許多小方框，各處的線寬一致。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證，也沒有量測耗時。

`radicaltable`（根基表）使目前目錄1002→1003種，含plain的gallery為1004項。48×48個方格，格(col, row)代表整數`n = row·48 + col + 1`（1到2304），以`ln(rad(n)) / ln(n)`上色，其中`rad(n)`是n所有相異質因數的乘積（根基，radical）：無平方因數的數（共1400個，n = 1定義為比值1）比值為1最亮；質數的冪`p^k`比值是`1/k`（例如4是1/2、8是1/3、2048是最小的1/11）；比值再取2次方以拉開差距；4、8、9的倍數留下暗色條紋與斜線，呈淡鼠尾草綠在暗綠底上。方格是帶圓角的拉升方塊，隨高度與AO顯示間隙，seed把整張表在環面上平移。與`divisorcount`、`totienttable`等數論表共用相同的方格形狀，只有取值與色調不同。這只是前2304個正整數的根基比值表示，不是證明或圖解abc猜想。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；toneExponent 2、toneFloor 0.14、toneSpan 0.7、鼠尾草綠與暗綠色調及0.3 m nominal tile皆作者設定（預覽只看了一版）。方格形狀與色調組合沿用divisorcount的參數，沒有為radical重新調整。測試一次通過，無需調整區間。表中亮格占多數（無平方因數的數約占61%），所以整體偏亮，這是取值方式造成的，不是缺陷。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0296）。

啟動時以篩法算出`n ≤ 2304`的根基（先令`rad(n) = 1`，對每個尚未被乘過的質數`q`——此時`rad(q) = 1`——把它的每個倍數`m`做`rad(m) *= q`），預先算出每格色調`0.7·(ln(rad(n)) / ln(n))^2`（n = 1以比值1處理）；取樣時每個方格用一個緊緻支撐的圓角方塊核（四次超橢圓經smoothstep，在方格邊界之前就恰好為零，所以方格查找不會跳動，場為C1）：顏色＝`0.04 + (0.14 + 色調 − 0.04)·遮罩 + 0.03·(128²細grain − 0.5)`、height ＝ `0.8·dome·(0.88 + 0.12·色調) + 0.08·grain`、`occlusion = 1 − 0.4·(1 − 遮罩)`、roughness固定0.4、金屬factor為0；cache合計`Float64Array(2305)`（根基）18,440 B加`Float64Array(2304)`（色調）18,432 B加`Float64Array(128²)` 131,072 B，共167,944 B，皆為lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個取樣點只做常數次運算，我沒有量測耗時，所以不宣稱效能數字。實測（工具實跑）：2304以內無平方因數的數共1400個、`rad(4) = 2`使比值為1/2、`rad(2048) = 2`使比值為最小的1/11、`rad(2304) = 6`；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）占60.65%–60.87%、color 0.0255–0.0257至0.8542–0.8545、平均0.5278–0.5308、AO最低0.6（等於`1 − 0.4`）、height至多0.8472–0.8483 relief；512²取樣（seed 0／1／0xffffffff／7）亮處占60.26%–60.57%、color 0.0251–0.0254至0.8547–0.8549、平均0.5278–0.5290、height至多0.8493–0.8505 relief；每個seed恰好有一種環面平移（seed 0為(46, 4)、1為(4, 7)、0xffffffff為(17, 42)、7為(30, 23)）能使2304格中心的顏色與測試中獨立以試除法重寫的色調一致，最大誤差0.0150以內（誤差來自grain；測試判定門檻為0.03）；seed 0與1相比，有64.3%的格子中心色差大於0.05，亮區遮罩（512²）有19.8%像素不同；seed 7的512²maps平均r／g／b約(123.0, 137.3, 101.8)、法線tilt²最大約0.0296、z分量最小253。我實看了預覽（seed 7）：暗綠底上淺鼠尾草綠的圓角方格，間雜暗色的直條與斜向暗點。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`goldbachtable`（哥德巴赫分拆表）使目前目錄1001→1002種，含plain的gallery為1003項。48×48個方格，格(col, row)代表偶數`n = 2·(row·48 + col + 2)`（4、6、8、…、4610），以n的哥德巴赫分拆數`g(n)`（質數`p ≤ n/2`且`n − p`也是質數的個數）上色：直接用g(n)的話會隨n變大而一路變亮、在表的接縫處出現生硬的色差，所以我先乘上`ln(n)²/n`消掉整體成長，再除以表內最大值並取0.75次方；剩下的是所謂「哥德巴赫彗星」的條帶結構，6與30的倍數比鄰近數亮（最亮在n = 2310 = 2·3·5·7·11），呈紫羅蘭色在暗紫底上。方格是帶圓角的拉升方塊，隨高度與AO顯示間隙，seed把整張表在環面上平移。與`divisorcount`、`totienttable`等數論表共用相同的方格形狀，只有取值與色調不同。這只是前2304個偶數的分拆數表示，不是證明或圖解哥德巴赫猜想。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；toneExponent 0.75、toneFloor 0.14、toneSpan 0.7、紫羅蘭與暗紫色調及0.3 m nominal tile皆作者設定。調整紀錄：第一版直接以g(n)除以最大值上色，預覽看到上半部很暗、下半部很亮，並在表的接縫出現橫向色帶（因為g(n)隨n成長），所以改成先乘`ln(n)²/n`；第二版預覽的接縫只剩少數較暗的方格（n = 4附近），整體不再有大幅色差。第一版的測試與探針數字沒有保存，文件與測試只使用第二版。我沒有寫「n剛好高於2的冪的數分拆數少」這類說法，因為沒有驗證。測試一次通過，無需調整區間。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0280）。

啟動時以篩法標出`4611`以內的合成數，對每個偶數`n`逐一檢查`q = 2 … n/2`是否`q`與`n − q`都是質數來計數（約270萬次檢查，我只量過sampler建構3次：約76 ms（第一次）、17 ms、16 ms，不是benchmark），算出`g(n)·ln(n)²/n`，取最大值正規化，預先算出每格色調`0.7·(比值/最大值)^0.75`；取樣時每個方格用一個緊緻支撐的圓角方塊核（四次超橢圓經smoothstep，在方格邊界之前就恰好為零，所以方格查找不會跳動，場為C1）：顏色＝`0.04 + (0.14 + 色調 − 0.04)·遮罩 + 0.03·(128²細grain − 0.5)`、height ＝ `0.8·dome·(0.88 + 0.12·色調) + 0.08·grain`、`occlusion = 1 − 0.4·(1 − 遮罩)`、roughness固定0.4、金屬factor為0；cache合計`Uint8Array(4611)` 4,611 B加兩個`Float64Array(2304)`（比值與色調）加`Float64Array(128²)`，共172,547 B，皆為lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個取樣點只做常數次運算，我沒有量測其耗時。實測（工具實跑）：g(4) = 1（2 + 2）、g(10) = 2（3 + 7與5 + 5），表內每個偶數至少有1個分拆，g的最大值為171，g(4610) = 72，`g(n)·ln(n)²/n`的最大值在n = 2310；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）占26.77%–29.34%、color 0.0257–0.0261至0.8451–0.8511、平均0.3765–0.3830、AO最低0.6（等於`1 − 0.4`）、height至多0.8347–0.8425 relief；512²取樣（seed 0／1／0xffffffff／7）亮處占27.77%–29.11%、color 0.0252–0.0255至0.8463–0.8527、平均0.3803–0.3826、height至多0.8418–0.8461 relief；每個seed恰好有一種環面平移（seed 0為(33, 9)、1為(21, 40)、0xffffffff為(8, 0)、7為(11, 34)）能使2304格中心的顏色與測試中獨立以試除法重寫的色調一致，最大誤差0.0150以內（誤差來自grain；測試判定門檻為0.03）；seed 0與1相比，有39.7%的格子中心色差大於0.05，亮區遮罩（512²）有9.1%像素不同；seed 7的512²maps平均r／g／b約(98.0, 63.3, 111.8)、法線tilt²最大約0.0280、z分量最小253。我實看了第二版預覽（seed 7）：暗紫底上紫羅蘭色圓角方格，亮暗呈不規則的細直條，沒有明顯的橫向色帶。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`totienttable`（歐拉函數表）使目前目錄1000→1001種，含plain的gallery為1002項。48×48個方格，格(col, row)代表整數`n = row·48 + col + 1`（1到2304），以歐拉函數比值`φ(n)/n`上色：把表中最小比值（在n = 210，為48/210）對應到0、比值1（n = 1，質數也只比1小一點點）對應到頂端，再取1.5次方，所以質數與只含大質因數的數最亮；偶數的比值至多1/2，3的倍數、5的倍數等也被壓低，整張表呈現明顯的直條紋（寬度48是偶數，所以每一欄的奇偶固定，奇數欄較亮），呈琥珀金色在暗褐底上。方格是帶圓角的拉升方塊，隨高度與AO顯示間隙，seed把整張表在環面上平移。與`divisorcount`、`abundantnumbers`等數論表共用相同的方格形狀，只有取值與色調不同。這只是前2304個正整數的函數值表示，不是證明或圖解任何數論定理。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；toneExponent 1.5、toneFloor 0.14、toneSpan 0.7、琥珀金與暗褐色調及0.3 m nominal tile皆作者設定（預覽只看了一版）。方格形狀與色調組合沿用divisorcount的參數，沒有為totient重新調整。我沒有去檢查直條紋是否過於單調：預覽看得出明顯的垂直條紋（因表寬48為偶數），這是此取值方式的特性，不是缺陷，也沒有以改變表寬來打散。測試通過一次，無需調整區間。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0296）。

啟動時以篩法算出`n ≤ 2304`的`φ(n)`（先令`φ(n) = n`，再對每個質數`q`的每個倍數`m`做`φ(m) −= φ(m)/q`），取得`least = min φ(n)/n`，並預先算出每格的色調`0.7·((φ(n)/n − least)/(1 − least))^1.5`；取樣時每個方格用一個緊緻支撐的圓角方塊核（四次超橢圓經smoothstep，在方格邊界之前就恰好為零，所以方格查找不會跳動，場為C1）：顏色＝`0.04 + (0.14 + 色調 − 0.04)·遮罩 + 0.03·(128²細grain − 0.5)`、height ＝ `0.8·dome·(0.88 + 0.12·色調) + 0.08·grain`、`occlusion = 1 − 0.4·(1 − 遮罩)`、roughness固定0.4、金屬factor為0；cache合計`Int32Array(2305)` 9,220 B加`Float64Array(2304 + 128²)` 149,504 B，共158,724 B，皆為lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個取樣點只做常數次運算，我沒有量測耗時，所以不宣稱效能數字。實測（工具實跑）：n = 210為第一個達到最小比值48/210的整數，2304以內共有342個質數，所有偶數的比值最大為0.5；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）占22.23%–23.72%、color 0.0255–0.0259至0.8527–0.8529、平均0.3109–0.3183、AO最低0.6（等於`1 − 0.4`）、height至多0.8459–0.8471 relief；512²取樣（seed 0／1／0xffffffff／7）亮處占22.13%–22.78%、color 0.0252–0.0254至0.8536–0.8542、平均0.3114–0.3142、height至多0.8486–0.8500 relief；每個seed恰好有一種環面平移（seed 0為(39, 33)、1為(23, 23)、0xffffffff為(19, 33)、7為(42, 4)）能使2304格中心的顏色與測試中獨立以互質計數重寫的`φ(n)/n`色調一致，最大誤差0.0150以內（誤差來自grain；測試判定門檻為0.03）；seed 0與1相比，有78.5%的格子中心色差大於0.05，亮區遮罩（512²）有23.6%像素不同；seed 7的512²maps平均r／g／b約(96.6, 80.1, 37.3)、法線tilt²最大約0.0296、z分量最小253。我實看了預覽（seed 7）：暗褐底上琥珀色的圓角方格排成明顯的直條紋，最亮的欄是奇數欄。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`spirographtable`（螺旋規曲線表）使目前目錄999→1000種，含plain的gallery為1001項。6×6個格子，格(col, row)畫出半徑`a = col + 1`的小輪在半徑`b = row + 7`的大環內滾動所產生的內擺線（hypotrochoid），畫筆位於小輪圓心外`0.8·a`處；a從1到6、b從7到12，所以a恆小於b；曲線縮放到離格中心最遠`0.4`個格寬後，以seed決定的角度（0到0.5弧度）整體旋轉，每格各畫一個封閉曲線，呈現銅色曲線、微光暈在暗紅褐底上的模樣。曲線經過自己時用高斯和（而非距離最小值）所以不產生折痕。36格中有13格的a與b有公因數，曲線在不到`a`圈時就封閉，我只畫一個完整封閉週期，不重複描繪。這只是`a`、`b`的整數比值表，不是各種筆距的比較表（筆距比固定為0.8），也不是真正的實體螺旋規玩具。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；筆距比0.8、amplitude 0.4、線寬0.016、光暈半徑0.1、銅色與暗紅褐色調皆作者設定（預覽看了兩版：第一版沿用`t ∈ [0, 2π·a)`，對a與b有公因數的格子會重複描繪同一條曲線使線條加倍，所以我改為`t ∈ [0, 2π·a / gcd(a, b))`，第二版的預覽肉眼看不出明顯差異，我沒有做量化比較，只是依數學上正確的封閉週期修改）。第一次預覽只是外觀判斷，並非定量檢查。測試通過是在修改之後；我沒有保存修改前的測試結果，所以不聲稱修改前後的比較。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0495）。

使用與玫瑰線表（rhodoneatable）相同的軟聯集：36個格各自預先算出360個點的封閉折線（儲存在以格寬為單位、相對格中心的`Float64Array`），取樣時只走訪取樣點所在格自己的360個線段，計算`Σ exp(−d²/0.016²)`（d為取樣點到線段的距離）後以`1 − exp(−4·sum)`壓縮為線強度，加上緊緻的smoothstep光暈（半徑0.1，因為曲線離格中心至多0.4，所以光暈在格邊界剛好為零，相鄰格不會互相跳動）；顏色＝`0.04 + 0.74·線 + 0.12·光暈·(1 − 線) + 0.02·(128²細grain − 0.5)`、height ＝ `0.8·線 + 0.2·grain`、線處roughness降低0.2、AO恆為1、金屬factor為0；cache合計2×36×360 + 128² = 42,304個Float64／338,432 B，皆為lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個取樣點走訪360個線段；我只量過一次512² maps生成（seed 7）約444 ms，那是單次量測，不是benchmark，也沒有和其他材質比較。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占19.06%–19.20%、color 0.0303–0.0304至0.7892–0.7898、平均0.2033–0.2035、roughness 0.2–0.4、AO恆為1、height至多0.9919–0.9984 relief；512²取樣亮處占19.07%–19.10%、color 0.0301–0.0302至0.7898–0.7899、平均0.2034–0.2035、height至多0.9975–0.9992 relief；四格角落（距離格角0.02格寬）的最大color為0.0487–0.0495；四個seed在101種旋轉角（0到0.5弧度）中，有25–29種使「36格×96個獨立計算的曲線點」全都落在亮處（color>0.5），最佳最小亮度0.7702–0.7704（所以曲線確實是這張表的內擺線，不是一般亮紋）；seed 0與1的亮區遮罩（512²）18.5%像素不同；seed 7的512²maps平均r／g／b約(72.6, 43.4, 29.2)、法線tilt²最大約0.0495，AO與alpha檢查無異常。我實看了預覽（seed 7）：暗紅褐底上，銅色的星形、多角形與細橢圓曲線排成規則的格子，邊緣有微弱的光暈。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`dodecagridfilled`（上色十二重網格拼貼）使目前目錄998→999種，含plain的gallery為1000項。與`dodecagridtiling`相同的十二重補丁（相同的六組網格與偏移；151塊瓷磚、330條邊、180個頂點、歐拉示性數1，頂點邊數2到10），但每塊瓷磚內部有色調：30°菱形最暗（0.10）、60°菱形中等（0.18）、正方形最亮（0.26），邊緣為淺萊姆綠細線，呈現深森林綠底上的萊姆綠線條。色調的權重與`penrosefilled`相同（四條邊各自平滑步階的連乘，C1）。seed只把整塊補丁旋轉30°的整數倍（12種）。這只是一小塊補丁，不是無限延伸的拼貼；色調只依瓷磚形狀而定，不是真正的配色規則。與`penrosefilled`、`ammannfilled`、`heptagridfilled`共用同一個多重網格sampler分支的填色功能，只有preset不同。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；三種瓷磚的色調0.10／0.18／0.26、邊緣寬度0.15、內部高度加成0.05、線色調0.7、萊姆綠與森林綠色調與0.5 m nominal tile皆作者設定（預覽只看了一版）。填色類別`k − j − 1`對應的瓷磚形狀，我吸取`heptagridfilled`的教訓，先用方向夾角`(k − j)·30°`算過（類別0與4是30°、1與3是60°、2是90°正方形），再寫`fills`，沒有再弄反。填色功能的折痕問題已在`penrosefilled`修正，C1測試一次通過。結構檢查同dodecagridtiling，是構造自洽性的檢查，不是形式證明。relief沿用0.0007、未另外調整（512²maps法線tilt²最大0.0335）。

沿用多重網格sampler分支的填色功能（見`penrosefilled`）：`roots`為12、六組網格、偏移`(0.13, −0.31, 0.22, 0.07, −0.19, 0.08)`，建構出與dodecagridtiling相同的151塊瓷磚與330條邊，並保留每塊瓷磚的旋轉後四個角、中心、面積正負號與類別`k − j − 1`；取樣時對中心附近每塊瓷磚以`Π_{四條邊} smooth(clamp(有號距離 / 0.15))`作權重，色調加上`fills[類別]·權重`（類別0與4為30°菱形0.10、類別1與3為60°菱形0.18、類別2為正方形0.26），高度加上`0.05·權重`；其餘與dodecagridtiling相同（線權重`(1 − d²/r²)²`，r = 0.09，加總後以`1 − exp(−1.6·sum)`壓縮；顏色＝`0.06 + 0.7·thread + 填色 + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·thread + 填色高度 + 0.15·grain`；線處roughness降低0.1；AO恆為1；金屬factor為0）；cache合計330×4 + 151×8 + 151×3 + 128² = 19,365個Float64／154,920 B（再加151 B的類別陣列），皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0007 UV-relative relief（非公尺位移）。每個取樣點走訪330條邊與151塊瓷磚，沒有量測耗時，所以不宣稱效能數字。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占11.54%–11.72%、color 0.0455–0.0456至0.7705–0.7736、平均0.2002–0.2004、roughness 0.3–0.4、AO恆為1、height至多0.9341–0.9421 relief；512²取樣亮處占11.51%–11.53%、color 0.0452至0.7734–0.7746、平均0.2002–0.2004、height至多0.9419–0.9487 relief；四個seed各自在恰好一個旋轉步（依序為第0、7、1、7步，共12步）下，補丁上每三個頂點以及每三塊瓷磚中心的顏色（含內部色調）與測試中獨立重寫的模型一致（最大誤差小於0.03，這是測試的判定門檻）；seed 0與1的亮區遮罩（512²）14.1%像素不同；seed 7的512²maps平均r／g／b約(51.3, 75.1, 41.3)、法線tilt²最大約0.0335、z分量最小253。結構（151塊、330條邊、180個頂點、歐拉示性數1、邊長1、頂點邊數2到10、30°菱形／60°菱形／正方形各41／70／40塊）同dodecagridtiling。我實看了預覽（seed 7）：深森林綠底上萊姆綠細線框出綠色的瓷磚，正方形最亮。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`heptagridfilled`（上色七重網格拼貼）使目前目錄997→998種，含plain的gallery為999項。與`heptagridtiling`相同的七重網格補丁（相同的七組網格與偏移；154塊菱形、335條邊、182個頂點、歐拉示性數1，頂點邊數2到9），但每塊菱形內部有色調：銳角25.7°的細菱形最暗（0.10）、51.4°的中等（0.18）、77.1°的寬菱形最亮（0.26），邊緣為淺藍色細線，呈現藏青底上的藍圖風格。色調的權重與`penrosefilled`相同（四條邊各自平滑步階的連乘，C1）。seed只把整塊補丁旋轉360°／14的整數倍（14種）。這只是一小塊補丁，不是無限延伸的拼貼；色調只依菱形形狀而定，不是真正的配色規則。與`penrosefilled`、`ammannfilled`共用同一個多重網格sampler分支的填色功能，只有preset不同。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；三種菱形的色調0.10／0.18／0.26、邊緣寬度0.15、內部高度加成0.05、線色調0.7、淺藍與藏青色調與0.5 m nominal tile皆作者設定。調整與錯誤紀錄：(1)第一版預覽的配色是琥珀色配深綠，與`ammannfilled`太像，我改成淺藍配藏青，之後的預覽都是新配色（過程中發現讀圖工具對同一路徑可能顯示舊圖，我改寫到新檔名後才看到新配色）。(2)我第一版把填色類別`k − j − 1`對應到菱形形狀時弄錯了：我預期類別0到5依序是寬到窄再對稱，但實際上菱形的銳角由兩組網格方向的夾角`(k − j)·360°/7`決定，類別0與5是51.4°、類別1與4是77.1°、類別2與3是25.7°；所以第一版`fills`為`[0.10, 0.18, 0.26, 0.26, 0.18, 0.10]`時，是最細的25.7°菱形最亮，與我想要的相反。發現後改為`[0.18, 0.26, 0.10, 0.10, 0.26, 0.18]`，重新跑探針，並更新測試的亮區占比、平均、maps區間（測試通過是在修正之後），文件只使用修正後的數字，也只看過修正後的最終預覽。(3)填色功能已在`penrosefilled`修正過折痕問題，C1測試一次通過。結構檢查同heptagridtiling，是構造自洽性的檢查，不是形式證明。relief沿用0.0007、未另外調整（512²maps法線tilt²最大0.0336）。

沿用多重網格sampler分支的填色功能（見`penrosefilled`）：`roots`為7、七組網格、偏移`(0.11, −0.23, 0.19, −0.07, 0.05, −0.17, 0.12)`，建構出與heptagridtiling相同的154塊菱形與335條邊，並保留每塊菱形的旋轉後四個角、中心、面積正負號與類別`k − j − 1`；取樣時對中心附近每塊菱形以`Π_{四條邊} smooth(clamp(有號距離 / 0.15))`作權重，色調加上`fills[類別]·權重`（類別0與5為51.4°菱形0.18、類別1與4為77.1°寬菱形0.26、類別2與3為25.7°細菱形0.10），高度加上`0.05·權重`；其餘與heptagridtiling相同（線權重`(1 − d²/r²)²`，r = 0.09，加總後以`1 − exp(−1.6·sum)`壓縮；顏色＝`0.06 + 0.7·thread + 填色 + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·thread + 填色高度 + 0.15·grain`；線處roughness降低0.1；AO恆為1；金屬factor為0）；cache合計335×4 + 154×8 + 154×3 + 128² = 19,418個Float64／155,344 B（再加154 B的類別陣列），皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0007 UV-relative relief（非公尺位移）。每個取樣點走訪335條邊與154塊菱形，沒有量測耗時，所以不宣稱效能數字。實測（工具實跑，seed 0／1／0xffffffff／7，修正後的fills）：256²取樣下亮處（color>0.5）占11.85%–11.89%、color 0.0455–0.0459至0.7712–0.7721、平均0.2107–0.2108、roughness 0.3–0.4、AO恆為1、height至多0.9367–0.9399 relief；512²取樣亮處占11.90%–11.92%、color 0.0452–0.0453至0.7719–0.7745、平均0.2108、height至多0.9403–0.9430 relief；四個seed各自在恰好一個旋轉步（依序為第9、6、10、9步，共14步）下，補丁上每三個頂點以及每三塊菱形中心的顏色（含內部色調）與測試中獨立重寫的模型一致（最大誤差小於0.03，這是測試的判定門檻）；seed 0與1的亮區遮罩（512²）14.5%像素不同；seed 7的512²maps平均r／g／b約(40.0, 56.9, 85.3)、法線tilt²最大約0.0336、z分量最小253。結構（154塊、335條邊、182個頂點、歐拉示性數1、邊長1、頂點邊數2到9、銳角25.7°／51.4°／77.1°的菱形各27／58／69塊）同heptagridtiling。我實看了修正後的最終預覽（seed 7）：藏青底上淺藍細線框出藍灰色的菱形，寬菱形比細菱形亮。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`ammannfilled`（上色阿曼—本克爾拼貼）使目前目錄996→997種，含plain的gallery為998項。與`ammannbeenker`相同的阿曼—本克爾補丁（相同的四組網格與偏移，148塊：62個正方形、86個45°／135°菱形、322條邊、175個頂點、歐拉示性數1），但每塊瓷磚內部有色調：正方形較亮（0.24）、菱形較暗（0.12），邊緣是琥珀色細線，呈現深青綠底上琥珀色線條、橄欖色瓷磚的模樣；色調的權重與`penrosefilled`相同（四條邊各自平滑步階的連乘，C1）。seed只把整塊補丁旋轉45°的整數倍（8種）。這只是一小塊補丁，不是無限延伸的拼貼；色調只依瓷磚形狀而定，不是真正的配色規則。與`penrosefilled`共用同一個多重網格sampler分支的填色功能，只有preset不同。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；正方形色調0.24、菱形0.12、邊緣寬度0.15、內部高度加成0.05、線色調0.7、琥珀與深青綠色調與0.5 m nominal tile皆作者設定（預覽只看了一版）。relief沿用0.0007、未另外調整（512²maps法線tilt²最大0.0335）。填色功能已在`penrosefilled`修正過一次折痕問題（最小值改為連乘），這個材質直接使用修正後的版本，C1測試一次通過。我在測試中訂的亮區占比上限0.1107第一次寫錯（seed 0xffffffff實測0.11090，測試失敗），改為0.1111；這是測試期望的錯誤，不是sampler問題。結構檢查（個數、歐拉示性數、邊長、頂點邊數、正方形與菱形數）與ammannbeenker相同，是構造自洽性的檢查，不是形式證明。

沿用多重網格sampler分支的填色功能（見`penrosefilled`）：`roots`為8、四組網格、偏移`(0.13, −0.31, 0.22, −0.04)`，建構出與ammannbeenker相同的148塊瓷磚與322條邊，並保留每塊瓷磚的旋轉後四個角、中心、面積正負號與類別`k − j − 1`；取樣時對中心附近每塊瓷磚以`Π_{四條邊} smooth(clamp(有號距離 / 0.15))`作權重，色調加上`fills[類別]·權重`（類別0與2為45°／135°菱形0.12、類別1為正方形0.24），高度加上`0.05·權重`；其餘與ammannbeenker相同（線權重`(1 − d²/r²)²`，r = 0.09，加總後以`1 − exp(−1.6·sum)`壓縮；顏色＝`0.06 + 0.7·thread + 填色 + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·thread + 填色高度 + 0.15·grain`；線處roughness降低0.1；AO恆為1；金屬factor為0）；cache合計322×4 + 148×8 + 148×3 + 128² = 19,300個Float64／154,400 B（再加148 B的類別陣列），皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0007 UV-relative relief（非公尺位移）。每個取樣點走訪322條邊與148塊瓷磚，沒有量測耗時，所以不宣稱效能數字。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占11.02%–11.09%、color 0.0455–0.0458至0.7704–0.7726、平均0.1960–0.1962、roughness 0.3–0.4、AO恆為1、height至多0.9275–0.9386 relief；512²取樣亮處占11.22%–11.26%、color 0.0451–0.0454至0.7724–0.7742、平均0.1960–0.1963、height至多0.9374–0.9449 relief；四個seed各自在恰好一個旋轉步（依序為第7、6、7、0步）下，補丁上每三個頂點以及每三塊瓷磚中心的顏色（含內部色調）與測試中獨立重寫的模型一致（最大誤差小於0.03，這是測試的判定門檻）；seed 0與1的亮區遮罩（512²）16.4%像素不同；seed 7的512²maps平均r／g／b約(58.1, 65.3, 50.9)、法線tilt²最大約0.0335、z分量最小253。我實看了預覽（seed 7）：深青綠底上琥珀色線條框出橄欖色的正方形與菱形，正方形較亮，八角星形清楚。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`penrosefilled`（上色潘洛斯拼貼）使目前目錄995→996種，含plain的gallery為997項。與`penrosetiling`相同的潘洛斯菱形補丁（相同的五重網格偏移，149個菱形、323條邊、175個頂點），但每個菱形內部有色調：胖菱形（72°）較亮、瘦菱形（36°）較暗，邊緣仍是淺色細線，所以呈現深紫底上奶油色線條、棕紫色菱形的模樣。每個菱形的色調以其四條邊的距離權重連乘決定：靠近邊時趨近0（斜率為零）、離每條邊超過0.15個邊長後為1，所以相鄰菱形的色調不會跳動，線條蓋住接縫。seed只把整塊補丁旋轉36°的整數倍（10種）。這只是一小塊補丁，不是無限延伸的拼貼；色調只依菱形的兩種形狀而定，不是真正的配色方案（例如沒有遵守任何配對規則）。與`penrosetiling`等共用同一個多重網格sampler分支，新增了`fills`（各格網配對類別的內部色調）、`fillRim`與`fillHeight`欄位，其他材質的`fills`全為0，行為不變。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；胖菱形色調0.2、瘦菱形0.1、邊緣寬度0.15、內部高度加成0.05、線色調0.7、奶油與深紫色調與0.5 m nominal tile皆作者設定（預覽看了兩版：第一版後的測試發現問題，修正後我再看了一次）。relief沿用0.0007、未另外調整（512²maps法線tilt²最大0.0335）。錯誤紀錄：第一版內部色調的權重用「四條邊距離的最小值」的平滑步階，C1測試失敗（最大二階差分比值51.8）——最小值在銳角的角平分線上有折痕，而該處離邊仍小於0.15，所以色調有斜率不連續；改成「四條邊各自平滑步階的連乘」後C1測試通過，此時統計值也跟著改變（最亮從0.79降到0.77），我已用修正後的探針輸出更新測試的數值區間。我只在這個修正版本上寫文件與驗證。

沿用多重網格sampler分支（現在同時服務`penrosetiling`、`penrosestar`、`ammannbeenker`、`heptagridtiling`、`dodecagridtiling`與`penrosefilled`），新增瓷磚填色：建構時除了邊之外也保留每個菱形（旋轉後的四個角、中心、面積正負號、以及類別`k − j − 1`）；取樣時對中心附近（距離1.2以內）的每個菱形，以`Π_{四條邊} smooth(clamp(到該邊的有號距離 / 0.15))`作為權重（在菱形外必有一條邊的有號距離為負而權重為0；這個連乘在每條邊上為0且斜率為零，所以是C1，而「最小值」在銳角處有折痕），色調加上`fills[類別]·權重`（胖菱形類別0與3為0.2，瘦菱形類別1與2為0.1），高度加上`0.05·權重`；`fills`全為0的材質略過這個迴圈。其餘與penrosetiling相同：邊的線條權重`(1 − d²/r²)²`（r = 0.09，C1）加總後以`1 − exp(−1.6·sum)`壓縮，顏色＝`0.06 + 0.7·thread + 填色 + 0.03·(128²細grain − 0.5)`，height ＝ `0.8·thread + 填色高度 + 0.15·grain`，線處roughness降低0.1，AO恆為1，金屬factor為0；cache合計323×4 + 149×8 + 149×3 + 128² = 19,315個Float64／154,520 B（再加149 B的類別陣列），皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0007 UV-relative relief（非公尺位移）。每個取樣點走訪323條邊與149個菱形（中心1.2以外直接略過），沒有量測耗時，所以不宣稱效能數字。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占11.16%–11.28%、color 0.0455–0.0461至0.7718–0.7734、平均0.1933–0.1934、roughness 0.3–0.4、AO恆為1、height至多0.9329–0.9424 relief；512²取樣亮處占11.24%–11.25%、color 0.0452–0.0453至0.7732–0.7742、平均0.1933–0.1934、height至多0.9390–0.9451 relief；四個seed各自在恰好一個旋轉步（依序為第3、0、0、4步）下，補丁上每三個頂點以及每三個菱形中心的顏色（含內部色調）與測試中獨立重寫的模型一致（最大誤差小於0.03，這是測試的判定門檻）；seed 0與1的亮區遮罩（512²）5.9%像素不同；seed 7的512²maps平均r／g／b約(68.7, 51.1, 60.0)、法線tilt²最大約0.0335、z分量最小253。結構（149個菱形、323條邊、175個頂點、歐拉示性數1、95個胖與54個瘦）與penrosetiling相同。我實看了最終版預覽（seed 7）：深紫底上奶油色細線框出棕紫色的菱形，胖菱形與瘦菱形的色調差別不大。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`dodecagridtiling`（十二重網格拼貼）使目前目錄994→995種，含plain的gallery為996項。深藍紫黑底上淡紫色的細線畫出一塊近似十二重旋轉對稱的非週期拼貼補丁：德布魯因多重網格構造，六組網格、單位向量取十二次單位根的前六個（0°、30°、…、150°）、偏移`(0.13, −0.31, 0.22, 0.07, −0.19, 0.08)`（和為0），每個網格交點是一塊菱形或正方形，共151塊，依銳角分成三種（30°菱形41塊、60°菱形70塊、90°正方形40塊）、330條單位長度的邊、180個頂點，頂點的邊數從2到10，補丁是單連通的圓盤（歐拉示性數1）；補丁半徑6.2個邊長，放在週期16個邊長的磚中央，四周留有空白、不會與相鄰拼貼相連。seed只把整塊補丁旋轉30°的整數倍（12種）。這只是一小塊補丁，不是無限延伸的拼貼，也不是週期的拼貼；十二重對稱是近似的。與`penrosetiling`、`penrosestar`、`ammannbeenker`、`heptagridtiling`共用同一個多重網格sampler分支，只有preset不同。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；六個偏移是我手選的一組（和為0，沒有掃描其他偏移）、補丁半徑6.2、線半徑0.09、gain 1.6、淡紫與深藍紫色調與0.5 m nominal tile皆作者設定（預覽只看了一版）。relief沿用penrosetiling的0.0007、未另外調整（512²maps法線tilt²最大0.0401）。我沒有查證這個拼貼與文獻中的十二重準晶拼貼（例如Stampfli或Socolar拼貼）的關係，所以只稱它為「十二重網格拼貼」，不宣稱是其中任何一種。結構檢查（個數、歐拉示性數、邊長、頂點邊數、三種瓷磚的數目）是構造自洽性的檢查，不是形式證明。

沿用多重網格sampler分支（現在同時服務`penrosetiling`、`penrosestar`、`ammannbeenker`、`heptagridtiling`與`dodecagridtiling`）：`roots`為12、網格數為偏移個數6，單位向量`e_j`取`exp(2πi·j/12)`（`j`為0到5）；對每一對網格`(j, k)`與整數`(r, s)`（−6到6）解出兩條線的交點`x`，其他四個索引取`ceil(x·e_l − offsets[l])`，`j`與`k`取`r`、`r+1`與`s`、`s+1`，得到一塊瓷磚的四個角`Σ K_l e_l`；只保留中心距原點不超過6.2的瓷磚，共用的邊以座標鍵去重（330條），整塊補丁依seed旋轉（0到11個30°）；取樣時對每條邊取點線距離，權重`(1 − d²/r²)²`（r = 0.09，C1）加總後以`1 − exp(−1.6·sum)`壓縮；顏色＝`0.06 + 0.78·thread + 0.03·(128²細grain − 0.5)`；height ＝ `0.85·thread + 0.15·grain`；線處roughness降低0.1；AO恆為1；金屬factor為0；cache合計330×4 + 128² = 17,704個Float64／141,632 B lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0007 UV-relative relief（非公尺位移）。每個取樣點走訪330條邊，沒有量測耗時，所以不宣稱效能數字。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占11.71%–11.75%、color 0.0454–0.0456至0.8492–0.8506、平均0.1468–0.1469、roughness 0.3–0.4、AO恆為1、height至多0.9734–0.9881 relief；512²取樣亮處占11.83%–11.89%、color 0.0451–0.0452至0.8521–0.8528、平均0.1468–0.1469、height至多0.9898–0.9935 relief；四個seed各自在恰好一個旋轉步（依序為第8、0、10、2步）下，補丁上每三個頂點的顏色與測試中獨立重寫的模型一致（最大誤差小於0.03，這是測試的判定門檻）；seed 0與1的亮區遮罩（512²）8.1%像素不同；seed 7的512²maps平均r／g／b約(46.2, 39.8, 66.5)、法線tilt²最大約0.0401、z分量最小253。我實看了預覽（seed 7）：深藍紫底上淡紫色的圓盤狀補丁，由正方形與菱形組成，邊界鋸齒，在環面上重複排列。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`heptagridtiling`（七重網格拼貼）使目前目錄993→994種，含plain的gallery為995項。深紫紅黑底上玫瑰色的細線畫出一塊七重旋轉近似對稱的非週期菱形拼貼補丁：德布魯因多重網格構造，七組網格、單位向量取七次單位根、偏移`(0.11, −0.23, 0.19, −0.07, 0.05, −0.17, 0.12)`（和為0），每個網格交點是一塊菱形，共154塊，依銳角分成三種（25.7°共27塊、51.4°共58塊、77.1°共69塊，由七個方向之間的夾角決定）、335條單位長度的邊、182個頂點，頂點的邊數從2到9，補丁是單連通的圓盤（歐拉示性數1）；補丁半徑6.2個邊長，放在週期16個邊長的磚中央，四周留有空白、不會與相鄰拼貼相連。seed只把整塊補丁旋轉360°/14的整數倍（14種）。這只是一小塊補丁，不是無限延伸的拼貼，也不是週期的拼貼；它的七重對稱是近似的（拼貼本身不是嚴格七重對稱）。與`penrosetiling`、`penrosestar`、`ammannbeenker`共用同一個多重網格sampler分支，只有preset不同。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；七個偏移是我手選的一組（和為0，沒有掃描其他偏移）、補丁半徑6.2、線半徑0.09、gain 1.6、玫瑰與深紫紅色調與0.5 m nominal tile皆作者設定（預覽只看了一版）。relief沿用penrosetiling的0.0007、未另外調整（512²maps法線tilt²最大0.0382）。我沒有查證這個拼貼是否有既有的名稱，所以只稱它為「七重網格拼貼」。結構檢查（個數、歐拉示性數、邊長、頂點邊數、三種菱形的數目）是構造自洽性的檢查，不是形式證明。

沿用多重網格sampler分支（現在同時服務`penrosetiling`、`penrosestar`、`ammannbeenker`與`heptagridtiling`）：`roots`為7、網格數為偏移個數7，單位向量`e_j`取`exp(2πi·j/7)`（`j`為0到6）；對每一對網格`(j, k)`與整數`(r, s)`（−6到6）解出兩條線的交點`x`，其他五個索引取`ceil(x·e_l − offsets[l])`，`j`與`k`取`r`、`r+1`與`s`、`s+1`，得到一塊菱形的四個角`Σ K_l e_l`；只保留中心距原點不超過6.2的菱形，共用的邊以座標鍵去重（335條），整塊補丁依seed旋轉（0到13個360°/14）；取樣時對每條邊取點線距離，權重`(1 − d²/r²)²`（r = 0.09，C1）加總後以`1 − exp(−1.6·sum)`壓縮；顏色＝`0.06 + 0.78·thread + 0.03·(128²細grain − 0.5)`；height ＝ `0.85·thread + 0.15·grain`；線處roughness降低0.1；AO恆為1；金屬factor為0；cache合計335×4 + 128² = 17,724個Float64／141,792 B lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0007 UV-relative relief（非公尺位移）。每個取樣點走訪335條邊，沒有量測耗時，所以不宣稱效能數字。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占11.99%–12.03%、color 0.0454–0.0457至0.8507–0.8518、平均0.1480–0.1482、roughness 0.3–0.4、AO恆為1、height至多0.9804–0.9852 relief；512²取樣亮處占11.93%–11.96%、color 0.0452至0.8521–0.8524、平均0.1480–0.1482、height至多0.9878–0.9932 relief；四個seed各自在恰好一個旋轉步（依序為第7、2、13、9步）下，補丁上每三個頂點的顏色與測試中獨立重寫的模型一致（最大誤差小於0.03，這是測試的判定門檻）；seed 0與1的亮區遮罩（512²）7.5%像素不同；seed 7的512²maps平均r／g／b約(63.3, 22.9, 31.0)、法線tilt²最大約0.0382、z分量最小253。我實看了預覽（seed 7）：深紫紅底上玫瑰色的圓盤狀七重星形補丁，中心附近有明顯的七重旋轉感，在環面上重複排列。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`ammannbeenker`（阿曼—本克爾拼貼）使目前目錄992→993種，含plain的gallery為994項。深綠黑底上薄荷色的細線畫出一塊阿曼—本克爾（Ammann–Beenker）八重非週期拼貼的補丁：以德布魯因多重網格構造——四組網格、單位向量取八次單位根的前四個（0°、45°、90°、135°）、偏移`(0.13, −0.31, 0.22, −0.04)`，每個網格交點是一塊正方形（90°）或菱形（45°／135°）——共148塊（62個正方形、86個菱形，約1.39個菱形對1個正方形；無限拼貼的比例是√2 ≈ 1.41）、322條單位長度的邊、175個頂點，頂點的邊數從2到8（八邊星形處為8），補丁是單連通的圓盤（歐拉示性數1）；補丁半徑6.2個邊長，放在週期16個邊長的磚中央，四周留有空白、不會與相鄰拼貼相連。seed只把整塊補丁旋轉45°的整數倍（8種）。這只是一小塊補丁，不是無限延伸的拼貼，也不是週期的拼貼。與`penrosetiling`、`penrosestar`共用同一個多重網格sampler分支，只有preset不同（新增`roots`欄位，網格數由偏移個數決定）。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；四個偏移`(0.13, −0.31, 0.22, −0.04)`（和為0，是我手選的一組，沒有掃描其他偏移）、補丁半徑6.2、線半徑0.09、gain 1.6、薄荷與深綠色調與0.5 m nominal tile皆作者設定（預覽只看了一版；預覽左下角補丁邊界有一塊孤立的細菱形，這是「中心在半徑內就保留」的規則造成的鋸齒邊界，結構檢查（歐拉示性數1）仍成立）。relief沿用penrosetiling的0.0007、未另外調整（512²maps法線tilt²最大0.0378）。共用分支的修改（`roots`欄位與網格數由偏移個數決定）讓`penrosetiling`與`penrosestar`的preset多了`roots: 5`，其建構結果不變，這兩個材質的測試在這次修改後仍通過。結構檢查（個數、歐拉示性數、邊長、頂點邊數、正方形與菱形數）是構造自洽性的檢查，不是形式證明；我也沒有驗證補丁的菱形／正方形比例必然收斂到√2。測試中我自己訂的亮區占比下限（0.113）第一次寫錯（seed 1實測0.11298），改為0.1125。

沿用多重網格sampler分支（現在同時服務`penrosetiling`、`penrosestar`與`ammannbeenker`）：`roots`為8、網格數為偏移個數4，單位向量`e_j`取`exp(2πi·j/8)`（`j`為0到3）；對每一對網格`(j, k)`與整數`(r, s)`（−6到6）解出兩條線的交點`x`，其他兩個索引取`ceil(x·e_l − offsets[l])`，`j`與`k`取`r`、`r+1`與`s`、`s+1`，得到一塊瓷磚的四個角`Σ K_l e_l`；只保留中心距原點不超過6.2的瓷磚，共用的邊以座標鍵去重（322條），整塊補丁依seed旋轉（0到7個45°）；取樣時對每條邊取點線距離，權重`(1 − d²/r²)²`（r = 0.09，C1）加總後以`1 − exp(−1.6·sum)`壓縮；顏色＝`0.06 + 0.78·thread + 0.03·(128²細grain − 0.5)`；height ＝ `0.85·thread + 0.15·grain`；線處roughness降低0.1；AO恆為1；金屬factor為0；cache合計322×4 + 128² = 17,672個Float64／141,376 B lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0007 UV-relative relief（非公尺位移）。每個取樣點走訪322條邊，沒有量測耗時，所以不宣稱效能數字。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占11.30%–11.40%、color 0.0453–0.0457至0.8492–0.8534、平均0.1450–0.1452、roughness 0.3–0.4、AO恆為1、height至多0.9792–0.9961 relief；512²取樣亮處占11.47%–11.49%、color 0.0452至0.8517–0.8542、平均0.1450–0.1452、height至多0.9884–0.9975 relief；四個seed各自在恰好一個旋轉步（依序為第5、4、1、5步）下，補丁上每三個頂點的顏色與測試中獨立重寫的模型一致（最大誤差小於0.03，這是測試的判定門檻）；seed 0與1的亮區遮罩（512²）16.6%像素不同；seed 7的512²maps平均r／g／b約(36.1, 57.6, 46.1)、法線tilt²最大約0.0378、z分量最小253。我實看了預覽（seed 7）：深綠底上薄荷色的八重星形補丁（正方形與菱形組成的八角星），圓盤狀、邊界鋸齒，在環面上重複排列。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`penrosestar`（潘洛斯星）使目前目錄991→992種，含plain的gallery為993項。深紫黑底上桃色的細線畫出一塊接近五重旋轉對稱的潘洛斯菱形拼貼補丁：與`penrosetiling`相同的德布魯因五重網格構造，但五個網格偏移取接近零的值`(0.011, −0.006, 0.004, −0.013, 0.004)`（和為0），拼貼會接近奇異（五重對稱）的情形——160個菱形（95個胖菱形、65個瘦菱形，約1.46 : 1）、345條邊、186個頂點，頂點的邊數從2到7，補丁是單連通的圓盤（歐拉示性數1）；345條邊中有258條（75%）在旋轉72°後仍與另一條邊重合，而`penrosetiling`的一般偏移補丁只有72/323（22%）。seed只把整塊補丁旋轉36°的整數倍（10種）；因為補丁接近對稱，旋轉後的差異很小。這只是一小塊補丁，不是無限的拼貼，也不是嚴格的五重對稱（75%而非100%）。與`penrosetiling`共用同一個sampler分支，只有preset不同。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；偏移`(0.011, −0.006, 0.004, −0.013, 0.004)`是我手選的接近零的值（我只試了這一組，沒有掃描其他偏移）、其餘數值沿用penrosetiling（補丁半徑6.2、線半徑0.09、gain 1.6、0.5 m nominal tile、relief 0.0007，未另外調整；512²maps法線tilt²最大0.0401）、桃色與深紫色調為作者設定（預覽只看了一版）。我第一次用探針量到72°旋轉重合率63%（探針把座標先四捨五入再解析，損失了精度），測試改用精確座標得到258/345（75%），並確認一般偏移的penrosetiling為72/323（22%）；文件採用精確座標的數字。測試中的結構檢查（菱形、邊、頂點個數、歐拉示性數、邊長、頂點邊數、胖瘦菱形數）同樣是構造自洽性的檢查，不是形式證明。

沿用`penrosetiling`的五重網格sampler分支（現在同時服務`penrosetiling`與`penrosestar`）：偏移取`(0.011, −0.006, 0.004, −0.013, 0.004)`，其餘建構與取樣流程相同——五個單位向量取五次單位根，對每一對網格與整數`(r, s)`（−6到6）解出交點、取`ceil(x·e_l − offsets[l])`得到菱形四角，保留中心距原點不超過6.2的菱形並以座標鍵去重共用邊（345條），整塊補丁依seed旋轉（0到9個36°）；取樣時對每條邊取點線距離，權重`(1 − d²/r²)²`（r = 0.09，C1）加總後以`1 − exp(−1.6·sum)`壓縮；顏色＝`0.06 + 0.78·thread + 0.03·(128²細grain − 0.5)`；height ＝ `0.85·thread + 0.15·grain`；線處roughness降低0.1；AO恆為1；金屬factor為0；cache合計345×4 + 128² = 17,764個Float64／142,112 B lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0007 UV-relative relief（非公尺位移）。每個取樣點走訪345條邊，沒有量測耗時，所以不宣稱效能數字。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占12.35%–12.36%、color 0.0453–0.0457至0.8515–0.8528、平均0.1507–0.1509、roughness 0.3–0.4、AO恆為1、height至多0.9857–0.9919 relief；512²取樣亮處占12.30%–12.32%、color 0.0451–0.0453至0.8525–0.8540、平均0.1507–0.1509、height至多0.9916–0.9968 relief；四個seed各自在恰好一個旋轉步（依序為第4、8、9、5步）下，補丁上每三個頂點的顏色與測試中獨立重寫的模型一致（最大誤差小於0.03，這是測試的判定門檻）；seed 0與1的亮區遮罩（512²）只有2.9%像素不同（旋轉144°的近對稱補丁）；seed 7的512²maps平均r／g／b約(63.9, 38.1, 43.0)、法線tilt²最大約0.0401、z分量最小252。我實看了預覽（seed 7）：深紫底上桃色的圓盤狀潘洛斯補丁，中心附近的星形比penrosetiling更對稱。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`penrosetiling`（潘洛斯拼貼）使目前目錄990→991種，含plain的gallery為992項。深藍黑底上淺藍色的細線畫出一塊潘洛斯（Penrose）菱形非週期拼貼：由德布魯因（de Bruijn）的五重網格（pentagrid）構造，每個網格交點對應一個菱形，共149個菱形（95個胖菱形72°／108°、54個瘦菱形36°／144°，比例約1.76 : 1）、323條單位長度的邊、175個頂點，頂點的邊數從2到7，補丁是單連通的圓盤（歐拉示性數V − E + F = 1）；補丁半徑為6.2個邊長，放在週期16個邊長的磚中央，四周留有空白、不會與相鄰拼貼相連；邊交會的頂點因權重相加而較亮。seed只把整塊補丁旋轉36°的整數倍（10種）。這只是潘洛斯拼貼的一小塊補丁，不是無限延伸的拼貼，也不是週期的拼貼；它在環面上是一塊獨立的圓盤。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；五個網格偏移`(0.13, −0.31, 0.22, 0.07, −0.11)`（和為0）、補丁半徑6.2、線的半徑0.09、gain 1.6、淡藍與深藍色調與0.5 m nominal tile皆作者設定（預覽只看了一版）。偏移是固定的，所以不同seed只改變旋轉，沒有改變拼貼本身。relief 0.0012時512²maps的法線tilt²最大為0.1000（z分量最小248），降到0.0007後為0.0378（253）。測試以另一份獨立重寫的五重網格程式確認結構（149個菱形、323條邊、175個頂點、歐拉示性數1、所有邊長為1、頂點邊數2到7、95個胖菱形與54個瘦菱形），這些性質本身也是對拼貼構造是否正確的獨立檢查，但不是對「這就是真正的潘洛斯拼貼」的形式證明。

新增專用sampler：建構時以五重網格構造產生補丁——五個單位向量`e_j`取五次單位根，網格`j`是`x·e_j = 整數 + offsets[j]`的直線，對每一對`(j, k)`與每一對整數`(r, s)`（−6到6），解出兩條線的交點`x`，其他三個索引取`ceil(x·e_l − offsets[l])`，`j`與`k`兩個索引取`r`、`r+1`與`s`、`s+1`，得到菱形的四個角`Σ K_l e_l`；只保留中心距原點不超過6.2的菱形，共用的邊以座標鍵去重（323條），再把整塊補丁依seed旋轉；每條邊以中點與半長向量儲存（4個Float64陣列）。每個取樣點把座標換到拼貼單位（週期16），對每條邊取點線距離，權重`(1 − d²/r²)²`（r = 0.09，在邊界上值與斜率為零，C1）加總，再以`1 − exp(−1.6·sum)`壓縮；顏色＝`0.06 + 0.78·thread + 0.03·(128²細grain − 0.5)`；height ＝ `0.85·thread + 0.15·grain`；線處roughness降低0.1；AO恆為1；金屬factor為0；cache合計323×4 + 128² = 17,676個Float64／141,408 B lattice算術預算（非總RAM；建構時的交點與去重表只在建構時存在）。預設0.5 m nominal tile與0.0007 UV-relative relief（非公尺位移）。每個取樣點走訪323條邊（半長之外直接略過），建構時走訪1,690個網格交點，兩者都沒有量測耗時，所以不宣稱效能數字。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占11.54%–11.60%、color 0.0454–0.0458至0.8512–0.8520、平均0.1450–0.1453、roughness 0.3–0.4、AO恆為1、height至多0.9811–0.9872 relief；512²取樣亮處占11.54%–11.55%、color 0.0451–0.0452至0.8526–0.8538、平均0.1451–0.1453、height至多0.9887–0.9967 relief；四個seed各自在恰好一個旋轉步（依序為第4、3、2、1步）下，補丁上每三個頂點的顏色與測試中獨立重寫的模型一致（最大誤差小於0.03，這是測試的判定門檻，我沒有逐seed記錄實際最大誤差）；seed 0與1的亮區遮罩（512²）12.7%像素不同；seed 7的512²maps平均r／g／b約(31.5, 44.6, 62.7)、法線tilt²最大約0.0378、z分量最小253。我實看了預覽（seed 7）：深藍底上淺藍色的潘洛斯菱形補丁，圓盤狀、邊界略有鋸齒，在環面上重複排列。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`kagome`（籠目）使目前目錄989→990種，含plain的gallery為991項。深橄欖綠底上淺稻草色的細線畫出籠目（kagome）格子：把蜂巢每個六邊形的六條邊的中點依序連起來，得到三組互相交錯的直線，形成六邊形與正三角形交替的格子（竹籠的編法）；7欄×8列（56個蜂巢單元，共336條線段），水平與垂直週期比`7√3 : 12`（約1.04%的拉伸，所以不是正六邊形與正三角形）。兩條線段相交的頂點因權重相加而較亮。seed只把整張紋樣沿環面平移（1/64磚為單位）。這是示意的格子圖樣，不是真實竹籠的照片，也沒有表現上下交織。與`tulle`、`kikko`共用同一個蜂巢線段sampler分支，只有preset不同（新增`outer`與`innerDegrees`欄位）。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；內接六邊形半徑`√3/2`（正好連到邊的中點）、旋轉30°、線的半徑0.12、gain 1.8、稻草與橄欖綠色調與0.3 m nominal tile皆作者設定（預覽只看了一版）。relief沿用kikko的0.0009，未另外調整（512²maps法線tilt²最大0.0323）。共用分支新增`outer`（1或0，是否畫外框邊）與`innerDegrees`（內框旋轉角）欄位：`tulle`為`outer 1`、`innerDegrees 0`、`inner 0`，`kikko`為`outer 1`、`innerDegrees 0`，兩者的線段與行為不變，`Tulle as`與`Kikko as`的測試在這次修改後仍通過。

沿用蜂巢線段sampler分支（現在同時服務`tulle`、`kikko`與`kagome`）：建構時在尖頂蜂巢（寬`√3`、列距1.5）上，每個六邊形在`outer`為1時存下朝東、東北、西北三條外框邊；在`inner > 0`時再存下半徑`inner`、旋轉`innerDegrees`的同心六邊形的6條邊；籠目為`outer 0`、`inner √3/2`、`innerDegrees 30`，所以只有336條連接邊中點的線段（每條以中點與半長向量儲存，4個Float64陣列）；每個取樣點把座標換到蜂巢單位（水平週期`7√3`、垂直週期12），對每條線段取環面上最近鏡像的點線距離，權重`(1 − d²/r²)²`（r = 0.12，在邊界上值與斜率為零，C1）加總，再以`1 − exp(−1.8·sum)`壓縮；顏色＝`0.08 + 0.78·thread + 0.03·(128²細grain − 0.5)`；height ＝ `0.85·thread + 0.15·grain`；線處roughness降低0.1（基準0.6）；AO恆為1；金屬factor為0；cache合計336×4 + 128² = 17,728個Float64／141,824 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0009 UV-relative relief（非公尺位移）。每個取樣點走訪336條線段，沒有量測耗時，所以不宣稱效能數字。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占26.21%–26.29%、color 0.0653–0.0658至0.8712–0.8724、平均0.2644–0.2645、roughness 0.5001–0.6、AO恆為1、height至多0.9880–0.9905 relief；512²取樣亮處占25.94%–25.95%、color 0.0652至0.8728–0.8736、平均0.2652–0.2653、height至多0.9929–0.9958 relief；四個seed各自在恰好8個（64×64個候選中）環面平移下，48個取樣點的顏色與測試中獨立重寫的模型一致（最大誤差0.0120–0.0138，約等於細grain幅度），這8個平移正是蜂巢本身的平移對稱；seed 0與1的亮區遮罩（512²）29.4%像素不同；seed 7的512²maps平均r／g／b約(69.2, 78.9, 39.2)、法線tilt²最大約0.0323、z分量最小253。我實看了預覽（seed 7）：深橄欖綠底上淺色的三向直線格，形成六邊形與三角形。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`kikko`（龜甲紋）使目前目錄988→989種，含plain的gallery為990項。深棕色底上琥珀色的細線畫出龜甲形的六角蜂巢：尖頂六邊形的外框，每個六邊形中央再有一個半徑為外框一半的同心小六邊形；7欄×8列（56個六邊形，共504條線段：每格3條外框邊加6條內框邊），水平與垂直週期比`7√3 : 12`（六邊形約拉伸1.04%）。外框線在三線交會處因權重相加而較亮。seed只把整張紋樣沿環面平移（1/64磚為單位）。這是仿日本傳統龜甲紋的示意圖樣，不是真實龜甲或織品的照片。與`tulle`共用同一個蜂巢線段sampler分支，只有preset不同（新增`inner`欄位）。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；內框半徑為外框的0.5、線的半徑0.1、gain 1.8、琥珀與深棕色調與0.3 m nominal tile皆作者設定（預覽只看了一版）。relief 0.0012時512²maps的法線tilt²最大為0.0710（z分量最小250），降到0.0009後為0.0414（252）。共用分支新增`inner`欄位：`tulle`的`inner`為0、線段數仍是168，行為不變，`Tulle as`的測試在這次修改後仍通過。傳統龜甲紋常有花紋或更複雜的內部，這裡只有同心六邊形線。

沿用`tulle`的蜂巢線段sampler分支（現在同時服務`tulle`與`kikko`）：建構時在尖頂蜂巢（寬`√3`、列距1.5）上為每個六邊形存下朝東、東北、西北三條外框邊，並在`inner > 0`時再存下半徑`inner`（0.5）的同心六邊形的6條邊（每條邊以中點與半長向量儲存，共504條，4個Float64陣列）；每個取樣點把座標換到蜂巢單位（水平週期`7√3`、垂直週期12），對每條線段取環面上最近鏡像的點線距離，權重`(1 − d²/r²)²`（r = 0.1，在邊界上值與斜率為零，C1）加總，再以`1 − exp(−1.8·sum)`壓縮；顏色＝`0.08 + 0.78·thread + 0.03·(128²細grain − 0.5)`；height ＝ `0.85·thread + 0.15·grain`；線處roughness降低0.1（基準0.35）；AO恆為1；金屬factor為0；cache合計504×4 + 128² = 18,400個Float64／147,200 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0009 UV-relative relief（非公尺位移）。每個取樣點走訪504條線段（半長之外直接略過），沒有量測耗時，所以不宣稱效能數字。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占27.66%–27.72%、color 0.0654–0.0659至0.8663–0.8697、平均0.2772–0.2774、roughness 0.2505–0.35、AO恆為1、height至多0.9751–0.9895 relief（seed 0／1／0xffffffff）；512²取樣亮處占27.27%–27.29%、color 0.0651–0.0653至0.8684–0.8700、平均0.2773–0.2775、height至多0.9849–0.9917 relief；四個seed各自在恰好8個（64×64個候選中）環面平移下，48個取樣點的顏色與測試中獨立重寫的模型（含內框六邊形）一致（最大誤差0.0127–0.0144，約等於細grain幅度），這8個平移正是蜂巢本身的平移對稱；seed 0與1的亮區遮罩（512²）41.3%像素不同；seed 7的512²maps平均r／g／b約(92.4, 62.8, 23.8)、法線tilt²最大約0.0414、z分量最小252。我實看了預覽（seed 7）：深棕底上琥珀色的雙層六邊形（大六邊形套小六邊形）規則排列。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`vermiculation`（蟲跡雕紋）使目前目錄987→988種，含plain的gallery為989項。淺棕褐色的石面上刻有彎曲、分叉、互不相連的深色蠕蟲狀溝槽，仿建築石材的「蟲跡雕紋」（vermiculated rustication）：圖案來自週期性的Gray-Scott反應擴散在`feed 0.078`、`kill 0.061`的「蠕蟲」區間，溝槽占約35%的面積、約20到30條彼此分離，石面是單一連通的整體；溝槽處顏色較深、粗糙度較高（0.85 → 約0.93）、高度較低，石面帶細顆粒。seed改變反應擴散的初始擾動，所以每個seed的蟲跡排列都不同。與`turingmaze`共用同一個sampler分支，只有preset不同（以及新增的`baseHeight`欄位）。這是示意的石面紋理，不是真實石材的照片或掃描。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；`feed 0.078`、`kill 0.061`取自常見的Gray-Scott「蠕蟲」區間，我先用調查腳本在96×96、`seedCells 8`、6000與9000步下掃描12個seed（0到9、0xffffffff與12345），結果亮區占比35%–37%、24到31個連通元件、6000與9000步幾乎相同；其他數值（石色、溝槽深度、顆粒、0.4 m nominal tile、relief 0.0015）皆作者設定。為了讓溝槽比石面低，我在共用的sampler中新增`baseHeight`欄位：`height = baseHeight + ridgeHeight·ridge + grainHeight·grain`，`turingmaze`的`baseHeight`設為0，所以行為不變，`Turing maze as`的測試在這次修改後仍通過。512²maps的法線tilt²最大為0.0512（我沒有調整relief）。我也只掃描了這一組參數，沒有比較其他區間（例如coral：`feed 0.0545`、`kill 0.062`，在64×64的掃描中呈現單一連通網路）。

沿用`turingmaze`的sampler分支（現在同時服務`turingmaze`與`vermiculation`）：建構時以`grayScott(96, 8, 0.078, 0.061, 6000, seed)`在96×96的環面網格上做6000步反應擴散（只用加減乘，跨引擎位元相同；結果正規化到[0, 1]），再以`latticeField`建成C1的插值場；取樣時把座標以5×5的雜訊輕微扭曲（幅度0.05）後查表，以`0.5 + 0.5·tanh(9·(pattern − level))`（`level = 0.5 + 0.24·(7×7雜訊 − 0.5)`）切出溝槽，`ink = ridge·(0.85 + 0.15·7×7雜訊)`；顏色＝`0.9 − 0.75·ink + 0.06·(160²細grain − 0.5)`；height ＝ `0.7 − 0.55·ridge + 0.3·grain`；溝槽處roughness增加0.08（基準0.85）；AO恆為1；金屬factor為0；cache合計96² + 5² + 7² + 7² + 160² = 34,939個Float64／279,512 B lattice算術預算（非總RAM；反應擴散的暫存陣列只在建構時存在）。預設0.4 m nominal tile與0.0015 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，256²取樣）：溝槽（color<0.5）占34.76%–36.02%、石面（color>0.8）占58.33%–59.48%、溝槽的4連通元件22–28個、石面的連通元件恰為1個、溝槽邊緣的相鄰格對4,418–4,610對、color 0.1270–0.1331至0.9293–0.9297、平均0.6455–0.6528、roughness 0.85–0.9297、height至多0.9978–0.9990 relief；seed 0與1的溝槽遮罩（256²）46.8%像素不同；seed 7的512²maps平均r／g／b約(161.0, 146.5, 121.9)、r<128的像素占36.3%、法線tilt²最大約0.0512、z分量最小252。單次量測（bun於本機）：sampler建構（含反應擴散）每個seed約110–132 ms、512² maps約157 ms，只是4個seed與一次maps的單次量測，不是基準測試。我實看了預覽（seed 7）：淺棕褐色石面上深色的彎曲蟲狀溝槽，邊緣柔和。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`minkowskisausage`（閔考斯基香腸）使目前目錄986→987種，含plain的gallery為988項。深藍黑底上一條淡藍色細線，描出第2階二次科赫島（quadratic Koch island，又稱閔考斯基香腸）：從`F+F+F+F`（正方形）出發，把每個`F`取代為`F+F−F−FF+F+F−F`兩次，得到256個單位步、256個相異格點的簡單封閉迴圈（終點回到起點），外框約27×27格，放在36×36格的環面上，四周留有空白、不會與相鄰拼貼相連；線寬為三分之一格，線外有淡淡的光暈。seed只把整條曲線沿環面平移。這是示意的碎形走線，不是真實的香腸或地圖。與`dragoncurve`、`peanocurve`、`levycurve`共用同一個走線sampler分支，只有頂點串不同。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；階數2、36×36格環面、三分之一格線寬、tanh銳度8、淡藍與深藍色調與0.25 m nominal tile皆作者設定。階數3會有2,048步、外框約107×107格，超出這個走線分支使用的環面大小，所以只做到階數2。relief沿用dragoncurve的0.0008，未另外調整（512²maps法線tilt²最大為0.0492）。頂點串的取代規則我先以獨立小程式確認階數2的步數、相異格點數與外框，再決定環面大小。

沿用走線sampler分支（現在同時服務`dragoncurve`、`peanocurve`、`levycurve`與`minkowskisausage`）：閔考斯基模式下以turtle字串`F+F+F+F`、把每個`F`取代為`F+F-F-FF+F+F-F`兩次，`F`前進一格、`+`左轉90°、`−`右轉90°，得到257個頂點（最後一個回到起點）；在108×108的lattice上，格點放在每3個座標的位置（256個），相鄰兩格之間以2個連接node填滿（512個），亮node合計768個；曲線座標加上固定偏移(7, 7)與seed決定的環面平移；之後與dragoncurve相同：`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化，顏色＝`0.06 + 0.76·line + 0.1·glow·(1 − line) + 0.03·(128²細grain − 0.5)`，height ＝ `0.8·line + 0.2·grain`，線處roughness降低0.2（基準0.4），金屬factor為0；cache合計108² + 9² + 128² = 28,129個Float64／225,032 B lattice算術預算（非總RAM）。預設0.25 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，256²取樣）：亮處（color>0.5）占6.38%–6.43%、color 0.0458–0.0460至0.8331–0.8335、平均0.1113–0.1114、roughness 0.2001–0.3999、AO恆為1、height至多0.9887–0.9918 relief；四個seed的108×108 node盤面各自與測試中以區塊遞迴獨立寫出的曲線在唯一一個環面平移下完全一致（(28, 24)、(31, 33)、(30, 32)、(30, 29)；亮node皆為768）；seed 0與1的node盤面有9.8%不同；seed 7的512²maps平均r／g／b約(26.2, 31.2, 55.1)、法線tilt²最大約0.0492、z分量最小252。測試另外確認獨立曲線為257個頂點、終點等於起點、256個相異格點（簡單封閉迴圈）。我實看了預覽（seed 7）：深藍底上淡藍色的鋸齒狀十字形島嶼輪廓，在環面上重複排列。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`pisanotable`（皮薩諾週期表）使目前目錄985→986種，含plain的gallery為987項。48×48個圓角方塊磚，第(col, row)格代表整數`n = row × 48 + col + 1`（1到2304），色調依費波那契數列模`n`的皮薩諾週期（Pisano period）`π(n)`相對於上界`6n`的比值：`0.7·(π(n)/6n)^0.5`——`π(n)`只有在`n = 2·5^k`時達到上界`6n`（2304以內為10、50、250、1250四個，最亮），週期很短的`n`偏暗；開頭的週期是1、3、8、6、20、24、16、12、24、60、10、24。整體是看似雜訊、但由數論決定的方塊馬賽克。seed只把整張表沿環面平移。這是示意的數論圖案，不是真實材質。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；48×48格、色調`0.14 + 0.7·(π(n)/6n)^0.5`（指數0.5是我預先挑的，沒有比較其他指數）、珊瑚紅色調與0.3 m nominal tile皆作者設定。relief沿用既有表格類的0.0008，未另外調整（512²maps法線tilt²最大0.0280）。預覽上整體偏中間色調、對比不高，看起來像雜訊。seed差異測試只斷言「兩個seed的表有超過20%的格子色調差超過0.05」，沒有量測實際比例。建構時對每個`n`逐步產生模`n`的費波那契數對直到回到(0, 1)（最多`6n`步），我沒有量測這段建構時間，所以不宣稱效能數字。

沿用表格類磚的sampler寫法（與`mobiustable`同型）：建構時對每個`n ≤ 2304`逐步產生費波那契數列模`n`的數對`(F_k, F_{k+1})`直到回到`(0, 1)`得到週期`π(n)`，色調表（Float64）取`0.7·(π(n)/(6n))^0.5`；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.46格，在格界前恰好歸零，C1），顏色＝`0.04 + (0.14 + tone − 0.04)·mask + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`；磚縫AO為0.6；roughness恆為0.4；金屬factor為0；cache合計48² + 128² = 18,688個Float64／149,504 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占11.48%–11.56%、color 0.0257–0.0258至0.8505–0.8537、平均0.2850–0.2854、AO最低0.6、height至多0.8312–0.8380 relief（seed 0／1／0xffffffff）；512²取樣下亮處占11.38%–11.55%、color 0.0252–0.0255至0.8526–0.8540、平均0.2853–0.2859、roughness恆為0.4、AO最低0.6、height至多0.8349–0.8448 relief；2,304個磚中心的顏色與測試中獨立以數對產生法寫出的週期表在唯一一個環面平移下一致（(41, 2)、(9, 30)、(12, 32)、(22, 22)；最大誤差約0.0149–0.0150，約等於細grain幅度）；seed 0與1的亮區遮罩（512²）19.3%像素不同；seed 7的512²maps平均r／g／b約(91.3, 48.5, 41.4)、法線tilt²最大約0.0280、z分量最小253。測試另外確認開頭12個週期與達到上界`6n`的`n`（10、50、250、1250）。我實看了預覽（seed 7）：深紅褐底上深淺不一的珊瑚色方塊，近似雜訊。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`mobiustable`（莫比烏斯表）使目前目錄984→985種，含plain的gallery為986項。48×48個圓角方塊磚，第(col, row)格代表整數`n = row × 48 + col + 1`（1到2304），色調依莫比烏斯函數`μ(n)`分三類：`n`被某個平方數整除時`μ = 0`（暗，904個）、`n`是偶數個相異質數的乘積時`μ = +1`（亮紫，699個，含`n = 1`）、奇數個時`μ = −1`（中間的灰紫，701個）；因為每列48格是4的倍數，4的倍數所在的欄全是暗格，形成暗直條。seed只把整張表沿環面平移。這是示意的數論圖案，不是真實材質。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；48×48格、三類色調`0.14 + 0.08`／`0.14 + 0.7`／`0.14 + 0.38`、紫色調與0.3 m nominal tile皆作者設定。relief沿用既有表格類的0.0008，未另外調整（512²maps法線tilt²最大0.0296）。這個材質的seed差異測試只斷言「兩個seed的表有超過20%的格子色調差超過0.05」，我沒有量測實際比例。

沿用表格類磚的sampler寫法（與`abundantnumbers`同型）：建構時對每個`n ≤ 2304`以試除法找出相異質因數個數與是否有平方因子，填入色調表（`μ = 0`→0.08、`μ = +1`→0.7、`μ = −1`→0.38，Float64）；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.46格，在格界前恰好歸零，C1），顏色＝`0.04 + (0.14 + tone − 0.04)·mask + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`；磚縫AO為0.6；roughness恆為0.4；金屬factor為0；cache合計48² + 128² = 18,688個Float64／149,504 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占42.45%–42.47%、color 0.0256–0.0259至0.8536–0.8541、平均0.3702–0.3706、AO最低0.6、height至多0.8460–0.8486 relief（seed 0／1／0xffffffff）；512²取樣下亮處占42.65%–42.69%、color 0.0252–0.0253至0.8545–0.8547、平均0.3719–0.3720、roughness恆為0.4、AO最低0.6、height至多0.8485–0.8498 relief；2,304個磚中心的顏色與測試中以完整質因數分解獨立算出的`μ(n)`表在唯一一個環面平移下一致（(6, 7)、(8, 21)、(39, 45)、(8, 28)；最大誤差約0.0149–0.0150，約等於細grain幅度）；seed 0與1的亮區遮罩（512²）40.7%像素不同；seed 7的512²maps平均r／g／b約(86.9, 72.0, 113.7)、法線tilt²最大約0.0296、z分量最小253。我實看了預覽（seed 7）：深紫底上亮紫與灰紫的方塊，有暗直條。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`abundantnumbers`（盈數表）使目前目錄983→984種，含plain的gallery為985項。48×48個圓角方塊磚，第(col, row)格代表整數`n = row × 48 + col + 1`（1到2304），色調依`σ(n)`（`n`的所有正因數之和）與`2n`的比較分三類：虧數（`σ(n) < 2n`，1,732個）偏暗、盈數（`σ(n) > 2n`，569個）較亮、完全數（`σ(n) = 2n`，6、28、496共3個）最亮；因為每列48格是12與6的倍數，盈數（如12、18、20、24、…）排成明顯的亮直條，其餘零星亮點多為其他盈數。seed只把整張表沿環面平移。這是示意的數論圖案，不是真實材質。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；48×48格、三類色調`0.14 + 0.1`／`0.14 + 0.55`／`0.14 + 0.7`、青銅色調與0.3 m nominal tile皆作者設定。relief沿用既有表格類的0.0008，未另外調整（512²maps法線tilt²最大0.0296）。我預先寫的「兩個seed表的差異格數>20%」斷言失敗（實測8.9%）：seed 0與1的平移差(12, 6)，而盈數的結構以12與6為週期，所以大多數格子換了位置仍是同一類；我改為依實測訂定的區間（6%–12%）並在測試中註明原因。完全數只有3格，預覽上不容易和一般盈數區分。

沿用表格類磚的sampler寫法（與`xortable`同型）：建構時以篩法累加每個`n ≤ 2304`的因數和`σ(n)`（暫存於Float64陣列，建構後不保留），依`σ(n)`與`2n`分類填入色調表（虧數0.1、盈數0.55、完全數0.7，Float64）；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.46格，在格界前恰好歸零，C1），顏色＝`0.04 + (0.14 + tone − 0.04)·mask + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`；磚縫AO為0.6；roughness恆為0.4；金屬factor為0；cache合計48² + 128² = 18,688個Float64／149,504 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占17.04%–18.24%（seed 0／1／0xffffffff）、color 0.0255–0.0261至0.8503–0.8506、平均0.2612–0.2672、AO最低0.6、height至多0.8325–0.8388 relief；512²取樣下亮處占17.48%–18.01%、color 0.0252–0.0254至0.8520–0.8536、平均0.2644–0.2665、roughness恆為0.4、AO最低0.6、height至多0.8346–0.8473 relief；2,304個磚中心的顏色與測試中以試除法獨立算出的分類表在唯一一個環面平移下一致（(46, 30)、(34, 24)、(27, 38)、(10, 15)；最大誤差約0.0149–0.0150，約等於細grain幅度）；seed 0與1的亮區遮罩（512²）6.1%像素不同；seed 7的512²maps平均r／g／b約(84.1, 62.1, 36.4)、法線tilt²最大約0.0296、z分量最小253。我實看了預覽（seed 7）：深褐底上青銅色的亮直條與零星亮點。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`xortable`（互斥或表）使目前目錄982→983種，含plain的gallery為984項。64×64個圓角方塊磚，第(row, col)格的色調正比於`row XOR col`（按位元互斥或）除以63：主對角線（`row = col`，結果為0）最暗，`row XOR col`越大越亮、最亮是黃綠色（萊姆綠）；圖案由二進位位元形成巢狀、類似謝爾賓斯基的方塊（經典的「XOR texture」，亦即尼姆和表）。seed只把整張表沿環面平移。這是示意的數學圖案，不是真實材質。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；64×64格、色調`0.14 + 0.7·(row XOR col)/63`、萊姆綠與深綠色調與0.3 m nominal tile皆作者設定。relief沿用既有表格類的0.0008，未另外調整（512²maps法線tilt²最大0.0378）。我預先猜測每個seed只會有一個符合的環面平移，探針顯示是2個：`(row + 32) XOR (col + 32)`與`row XOR col`相同（兩軸同時加32只會翻轉第5位元兩次），所以測試斷言恰有兩個符合的平移且彼此差`(32, 32)`。另外256²取樣下每格只有4個取樣點、不會落在磚縫中心，最暗color（0.0602–0.0607）與AO最低（0.7344）和512²取樣（0.0251–0.0254與0.6）不同。

沿用表格類磚的sampler寫法（與`hadamardmatrix`同型）：建構時以`0.7·(row ^ col)/63`填入色調表（Float64）；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.46格，在格界前恰好歸零，C1），顏色＝`0.04 + (0.14 + tone − 0.04)·mask + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`；磚縫AO為0.6；roughness恆為0.4；金屬factor為0；cache合計64² + 128² = 20,480個Float64／163,840 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占36.40%–36.46%、color 0.0602–0.0607至0.8538–0.8541、平均0.4153–0.4154、AO最低0.7344、height至多0.8453–0.8484 relief（seed 0／1／0xffffffff）；512²取樣下亮處占29.12%–29.20%、color 0.0251–0.0254至0.8538–0.8548、平均0.3593–0.3594、roughness恆為0.4、AO最低0.6、height至多0.8478–0.8506 relief；4,096個磚中心的顏色與測試中獨立寫出的表在恰好2個環面平移下一致（彼此差(32, 32)；第一個平移依序為(52, 2)、(14, 2)、(6, 24)、(46, 2)；最大誤差約0.0150，約等於細grain幅度）；seed 0與1的亮區遮罩（512²）48.4%像素不同；seed 7的512²maps平均r／g／b約(73.4, 101.9, 49.5)、法線tilt²最大約0.0378、z分量最小253。我實看了預覽（seed 7）：萊姆綠由深到亮的巢狀方塊，呈經典的XOR texture外觀。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`paleytable`（佩利表）使目前目錄981→982種，含plain的gallery為983項。61×61個圓角方塊磚，第(row, col)格是`col − row`對質數61的勒壤得符號（Legendre symbol，Paley構造）：差為0（對角線）取中間色調、差是61的非零平方剩餘（共30個）取亮玫瑰粉、不是平方剩餘取暗紫紅；因為61 ≡ 1 (mod 4)，符號是對稱的，且表只依賴`col − row`，所以整張表沿對角線方向呈現平行的帶狀圖案，並在環面上無縫重複。seed只把整張表沿環面平移，而平移只有`(sx − sy) mod 61`有差別。這是示意的數論圖案，不是真實材質。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；61×61格、殘餘／非殘餘／零的色調`0.14 + 0.7`／`0.14 + 0.1`／`0.14 + 0.4`、玫瑰粉與深紫色調與0.3 m nominal tile皆作者設定。relief沿用既有表格類的0.0008，未另外調整（512²maps法線tilt²最大0.0378）。我預先猜測每個seed只會有一個符合的環面平移，探針顯示實際是61個（表只依賴`col − row`），測試改為斷言這個結構：61個平移的`sx − sy`皆相同，且四個seed的`(sx − sy) mod 61`各不相同。預覽（512²）每格約8像素，圖案呈斜向帶狀，我沒有逐格目視核對。

沿用表格類磚的sampler寫法（與`hadamardmatrix`同型）：建構時以暴力平方法算出61的非零平方剩餘集合（共30個），每格依`(col − row) mod 61`決定色調（0→0.4、剩餘→0.7、非剩餘→0.1，Float64表）；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.46格，在格界前恰好歸零，C1），顏色＝`0.04 + (0.14 + tone − 0.04)·mask + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`；磚縫AO為0.6；roughness恆為0.4；金屬factor為0；cache合計61² + 128² = 20,105個Float64／160,840 B lattice算術預算（非總RAM；平方剩餘集合只在建構時存在）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占36.34%–36.42%、color 0.0252–0.0259至0.8541–0.8545、平均0.4012–0.4014、AO最低0.6、height至多0.8478–0.8486 relief；512²取樣下亮處占36.35%–36.36%、color 0.0251–0.0254至0.8547–0.8549、平均0.4011–0.4014、roughness恆為0.4、AO最低0.6、height至多0.8494–0.8504 relief；3,721個磚中心的顏色與測試中獨立寫出的表在恰好61個環面平移下一致（它們的`sx − sy`皆相同，四個seed的`(sx − sy) mod 61`依序為51、59、10、23；最大誤差約0.0148–0.0149，約等於細grain幅度）；seed 0與1的亮區遮罩（512²）37.5%像素不同；seed 7的512²maps平均r／g／b約(116.7, 83.5, 99.1)、法線tilt²最大約0.0378、z分量最小253。測試另外確認三種色調的格數（零61個、殘餘與非殘餘各1,830個）。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`hadamardmatrix`（阿達馬矩陣）使目前目錄980→981種，含plain的gallery為982項。64×64個圓角方塊磚，第(row, col)格是Sylvester型阿達馬矩陣的第(row, col)項：`row`與`col`的二進位按位元相與後，1的個數為偶數時是+1（亮冷白）、奇數時是−1（暗藍灰）；第0列與第0欄全為+1，其餘每列的+1與−1各占一半（4,096項中有2,016項是−1），整體由巢狀的2×2區塊組成。seed只把整張表沿環面平移。這是示意的數學矩陣圖案，不是真實材質。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；64×64格、+1／−1的色調`0.14 + 0.7`／`0.14 + 0.1`、冷白與深藍色調與0.3 m nominal tile皆作者設定。relief沿用既有表格類的0.0008，未另外調整（512²maps法線tilt²最大0.0378）。測試的256²取樣每格只有4個取樣點，且全部落在磚面上、不會落在磚縫中心，所以256²的最暗color 0.0927–0.0936、AO最低0.7344，與512²取樣的0.0251–0.0253與0.6不同；我最初沿用其他表格類測試的「AO最低等於1 − gapOcclusion」斷言，改為256²取樣的區間，並另外在四格交會角落（1/64, 1/64）取樣確認AO恰為0.6。

沿用表格類磚的sampler寫法（與`divisorcount`同型）：建構時以`popcount(row & col)`的奇偶決定每格色調（偶數→0.7、奇數→0.1，Float64表）；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.46格，在格界前恰好歸零，C1），顏色＝`0.04 + (0.14 + tone − 0.04)·mask + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`；磚縫AO為0.6（`1 − 0.4·(1 − mask)`）；roughness恆為0.4；金屬factor為0；cache合計64² + 128² = 20,480個Float64／163,840 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占38.09%（四個seed完全相同：seed平移是整格，在256²取樣上等於整數個取樣點的平移）、color 0.0927–0.0936至0.8542–0.8545、平均0.4608–0.4610、AO最低0.7344、height至多0.8487–0.8497 relief；512²取樣下亮處占34.91%（四個seed相同）、color 0.0251–0.0253至0.8547–0.8549、平均0.3980–0.3981、roughness恆為0.4、AO最低0.6、height至多0.8504–0.8509 relief；4,096個磚中心的顏色與測試中獨立寫出的阿達馬矩陣在唯一一個環面平移下一致（(41, 29)、(0, 18)、(34, 7)、(41, 51)，最大誤差約0.0150，約等於細grain的幅度）；seed 0與1的亮區遮罩（512²）34.1%像素不同；seed 7的512²maps平均r／g／b約(97.6, 99.5, 115.9)、法線tilt²最大約0.0378、z分量最小253。我實看了預覽（seed 7）：冷白與暗藍灰的圓角方塊組成細密、帶斜向條紋感的圖案，我沒有從預覽辨認出巢狀的2×2區塊結構（逐磚的正確性由上述測試比對確認，不是靠目視）。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`levycurve`（列維曲線）使目前目錄979→980種，含plain的gallery為981項。深青黑底上一條薄荷綠細線，描出第9階列維C曲線（Lévy C curve）：512個單位步，第`k`步的方向是`i^popcount(k)`（`popcount`為`k`二進位中1的個數，方向依序為東、北、西、南），共416個相異格點與462條相異邊——有50步會沿著已走過的邊折返，所以有些線段是被重複描繪的；外框約39×39格，放在48×48格的環面上，四周留有空白、不會與相鄰拼貼相連；線寬為三分之一格，線外有淡淡的光暈。seed只把整條曲線沿環面平移。這是示意的碎形走線，曲線不封閉。與`dragoncurve`、`peanocurve`共用同一個走線sampler分支，只有頂點串不同。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；階數9、48×48格環面、三分之一格線寬、tanh銳度8、薄荷綠與深青色調與0.25 m nominal tile皆作者設定。relief沿用dragoncurve的0.0008，未另外調整（512²maps的法線tilt²最大為0.0543）。頂點串的方向規則我先以獨立的小程式確認格點與邊的個數（階數9：416個相異格點、462條相異邊、外框x −7至31、y −15至23），再決定環面大小與偏移。

沿用`dragoncurve`的sampler分支（現在同時服務`dragoncurve`、`peanocurve`與`levycurve`）：列維模式下從(0, 0)出發，第`k`步（`k = 0 … 511`）依`popcount(k) mod 4`選擇東、北、西、南前進一格；在144×144的lattice上，格點放在每3個座標的位置（416個），相鄰兩格之間以2個連接node填滿（重複走過的邊只是重複標記，共924個），亮node合計1,340個；曲線座標加上固定偏移(8, 16)與seed決定的環面平移；之後與dragoncurve相同：`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化，顏色＝`0.06 + 0.76·line + 0.1·glow·(1 − line) + 0.03·(128²細grain − 0.5)`，height ＝ `0.8·line + 0.2·grain`，線處roughness降低0.2（基準0.4），金屬factor為0；cache合計144² + 9² + 128² = 37,201個Float64／297,608 B lattice算術預算（非總RAM）。預設0.25 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，256²取樣）：亮處（color>0.5）占7.08%–7.12%、color 0.0457–0.0459至0.8328–0.8339、平均0.1109–0.1112、roughness 0.2001–0.3999、AO恆為1、height至多0.9872–0.9944 relief；四個seed的144×144 node盤面各自與測試中獨立以位元計數寫出的列維曲線在唯一一個環面平移下完全一致（(26, 39)、(12, 40)、(40, 7)、(29, 40)；亮node皆為1,340）；seed 0與1的node盤面有11.3%不同；seed 7的512²maps平均r／g／b約(16.8, 46.0, 43.5)、法線tilt²最大約0.0543、z分量最小252。測試另外確認獨立曲線的416個相異格點與462條相異邊。我實看了預覽（seed 7）：深青底上薄荷綠的列維C曲線輪廓（有小方框與缺口的C形），在環面上重複排列、被seed的平移切在圖的邊緣。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`tulle`（薄紗網）使目前目錄978→979種，含plain的gallery為980項。深紫黑底上一張由細小的象牙白線編成的六角蜂巢網：尖頂六邊形，每個格子外接圓半徑為1，7欄×8列（共56個六邊形、168條線段，每條邊只存一次）鋪滿整張磚；線是緊湊支撐的二次曲線輪廓，三條線交會的節點加總後較亮，像網結。為了讓蜂巢能整齊鋪滿方形的環面，水平與垂直的週期比為`7√3 : 12`，六邊形約有1.04%的拉伸（非正六邊形）。seed只把整張網沿環面平移（1/64磚為單位）。這是示意的網眼紡織品，不是真實薄紗的照片，也沒有半透明（深色底只是網眼的底色）。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；7欄×4組列、線的半徑0.15、gain 1.8、象牙白與深紫色調與0.3 m nominal tile皆作者設定。調整紀錄：第一版線半徑0.2、gain 1.5，預覽上線偏粗，改成0.15與1.8後採用（只看了這兩版預覽）；relief 0.0015時512²maps的法線tilt²最大為0.0643，降到0.0012後為0.0424（z分量最小251→252）。探針第一次的獨立模型有bug（邊去重的鍵寫錯，得到176條而不是168條線段），那次seed 0xffffffff找不到符合的平移；修正去重後四個seed都有符合的平移。

新增專用sampler：建構時在尖頂蜂巢（寬`√3`、列距1.5）上為每個六邊形存下朝東、東北、西北三條邊（每條邊以中點與半長向量儲存，共168條，4個Float64陣列）；每個取樣點把座標換到蜂巢單位（水平週期`7√3`、垂直週期12），對每條線段取環面上最近鏡像的點線距離，權重`(1 − d²/r²)²`（r = 0.15，在邊界上值與斜率為零，C1）加總，再以`1 − exp(−1.8·sum)`壓縮；顏色＝`0.08 + 0.78·thread + 0.03·(128²細grain − 0.5)`；height ＝ `0.85·thread + 0.15·grain`；線處roughness降低0.1（基準0.65）；AO恆為1；金屬factor為0；cache合計168×4 + 128² = 17,056個Float64／136,448 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0012 UV-relative relief（非公尺位移）。每個取樣點走訪168條線段（半長之外直接略過），沒有量測耗時，所以不宣稱效能數字。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占19.57%–19.59%、color 0.0651–0.0657至0.8686–0.8695、平均0.2215–0.2217、roughness 0.5505–0.65、AO恆為1、height至多0.9827–0.9866 relief（512²取樣亮處占19.65%–19.66%）；四個seed各自在恰好8個（64×64個候選中）環面平移下，48個取樣點的顏色與測試中獨立重寫的蜂巢模型一致（最大誤差0.0113–0.0138，約等於細grain幅度），這8個平移正是蜂巢本身的平移對稱（x模32與y模8固定）；seed 0與1的亮區遮罩（512²）33.8%像素不同；seed 7的512²maps平均r／g／b約(74.7, 69.8, 74.3)、法線tilt²最大約0.0424、z分量最小252。我實看了預覽（seed 7）：深色底上整齊的象牙白蜂巢細線，線結略亮。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`sacksspiral`（薩克斯螺旋）使目前目錄977→978種，含plain的gallery為979項。深藍黑底上，整數1到500依薩克斯螺旋（Sacks spiral）排成點陣：整數`n`放在阿基米德螺線上半徑`0.45·√(n/500)`（以磚為單位1）、角度`2π√n`處，所以完全平方數排成同一條射線；質數（共95個）是亮金色圓點，合成數是暗淡的金棕色圓點，質數沿著幾條彎曲的臂特別密集。螺旋在整張磚中央，外緣不超出磚邊，所以磚間沒有交疊；在環面上每張磚各有一個圓盤狀的螺旋。seed只把整個螺旋旋轉整數度（0到359度）。這是示意的數論圖案，不是星圖或照片。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；500個整數、半徑0.45、圓點半徑0.014、金色與深藍色調與0.4 m nominal tile皆作者設定。調整紀錄：第一版（圓點半徑0.012、質數色調0.7、合成數色調0.2、gain 2、relief 0.0008）在預覽上圓點偏小偏暗，探針量到最亮0.667、平均0.077、512²maps法線tilt²最大只有0.0048；改成圓點半徑0.014、質數色調0.85、合成數色調0.3、gain 3、relief 0.002後最亮0.871、平均0.111、tilt²最大0.0441，兩版的旋轉比對結果（每個seed唯一的整數度）不變。

新增專用sampler：建構時以試除法判斷`n = 1 … 500`是否為質數，並把每個整數的位置存成兩個Float64陣列（再加一個Uint8質數旗標）；每個整數擁有一個緊湊支撐的四次方圓點（權重`(1 − d²/r²)²`，半徑0.014，在邊界上值與斜率皆為零，C1），質數與合成數各自加總，再以`1 − exp(−3·sum)`壓縮到[0, 1)；顏色＝`0.05 + 0.85·質數圓點 + 0.3·合成數圓點·(1 − 質數圓點) + 0.03·(128²細grain − 0.5)`；height ＝ `0.6·質數圓點 + 0.25·合成數圓點·(1 − 質數圓點) + 0.1·grain`；質數處roughness降低0.15（基準0.4）；AO恆為1；金屬factor為0；cache合計500×2 + 128² = 17,384個Float64（139,072 B）＋500 B質數旗標，皆為lattice算術預算（非總RAM）。每個取樣點要走訪500個整數（半徑外直接略過），我沒有量測它在512²下的耗時，所以不宣稱效能數字。預設0.4 m nominal tile與0.002 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占2.93%–2.96%、color 0.0355–0.0358至0.8670–0.8696、平均0.1114–0.1115、roughness 0.2575–0.4、AO恆為1、height至多0.6547–0.6647 relief（512²取樣的亮處占2.94%–2.95%）；四個seed各自在唯一一個整數度旋轉（298°、161°、4°、107°）下，500個圓點中心的顏色都與測試中獨立重寫的模型一致（最大誤差0.0143–0.0148，約等於細grain幅度）；seed 7的512²maps平均r／g／b約(33.7, 32.8, 37.1)、法線tilt²最大約0.0441、z分量最小252。我實看了預覽（seed 7）：深藍底上金色的螺旋圓盤，彎曲的亮臂清晰，每張磚一個圓盤。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`peanocurve`（皮亞諾曲線）使目前目錄976→977種，含plain的gallery為978項。深藍黑底上一條粉紅色細線，走的是第3階皮亞諾空間填充曲線：27×27個格子每格恰好經過一次（728步，共2,185個亮node），由一個角落（0, 0）蛇形走到對角（26, 26），放在32×32格的環面上，四周留有5格寬的空白、不會與相鄰拼貼相連；線寬為三分之一格，線外有淡淡的光暈。seed只把整條曲線沿環面平移。這是示意的碎形走線，不是真實電路板，曲線不封閉。與`dragoncurve`共用同一個走線sampler分支，只有頂點串不同。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；階數3、32×32格環面、三分之一格線寬、tanh銳度8、粉紅與深藍色調與0.25 m nominal tile皆作者設定。調整紀錄：第一版以三進位數字翻轉公式產生頂點，我把第二軸的翻轉判斷少算了當前這組的第一個數字，預覽上線段不連續（只有直線段）；修正為「y數字在x數字（含同組）之和為奇數時翻轉」後預覽出現連續的皮亞諾曲線。relief沿用dragoncurve的0.0008，未另外調整（512²maps的法線tilt²最大為0.0468）。

沿用`dragoncurve`的sampler分支（現在同時服務`peanocurve`）：皮亞諾模式下以0到728的三進位索引產生頂點，x數字取偶數位、y數字取奇數位，x數字在其前面y數字之和為奇數時取`2 − 數字`、y數字在含同組的x數字之和為奇數時取`2 − 數字`；在96×96的lattice上，格點放在每3個座標的位置（729個），相鄰兩格之間以2個連接node填滿（1,456個），亮node合計2,185個；曲線座標加上固定偏移(2, 2)與seed決定的環面平移；之後與dragoncurve相同：`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化，顏色＝`0.06 + 0.76·line + 0.1·glow·(1 − line) + 0.03·(128²細grain − 0.5)`，height ＝ `0.8·line + 0.2·grain`，線處roughness降低0.2（基準0.4），金屬factor為0；cache合計96² + 9² + 128² = 25,681個Float64／205,448 B lattice算術預算（非總RAM）。預設0.25 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，256²取樣）：亮處（color>0.5）占18.33%（四個seed完全相同：seed平移是整格，在256²取樣上等於整數個取樣點的平移）、color 0.0457–0.0461至0.8331–0.8336、平均0.2272–0.2273、roughness 0.2001–0.3999、AO恆為1、height至多0.9913–0.9952 relief；四個seed的96×96 node盤面各自與測試中以區塊遞迴獨立建構的皮亞諾曲線在唯一一個環面平移下完全一致（(0, 4)、(23, 28)、(21, 27)、(24, 29)；亮node皆為2,185）；seed 0與1的node盤面有23.8%不同；seed 7的512²maps平均r／g／b約(70.3, 45.6, 72.0)、法線tilt²最大約0.0468、z分量最小252。測試另外確認遞迴所得的729個頂點相異且相鄰頂點的曼哈頓距離恆為1。我實看了預覽（seed 7）：深藍底上粉紅色的連續蛇形走線，在環面上重複排列。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`divisorcount`（因數個數表）使目前目錄975→976種，含plain的gallery為977項。48×48個圓角方塊磚，第(col, row)格代表整數`n = row × 48 + col + 1`（1到2304），色調依`n`的因數個數`d(n)`而定：質數（`d = 2`，共342個）偏暗，因數多的合成數（高合成數）發亮，表中最大的`d`是40（`n = 1680`）；因為每列48格是12的倍數，12的倍數所在的欄會連成明顯的亮直條，6、4等的倍數則形成較淡的直條。seed只把整張表沿環面平移，所以統計不變、位置改變。這是示意的數論表，不是礦物或材質照片。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；48×48格、色調`0.14 + 0.7·(d(n)/40)^0.75`、青綠色調與0.3 m nominal tile皆作者設定。調整紀錄：第一版色調用開平方（指數0.5），預覽上大部分格子色調太接近、整體偏單調，改為指數0.75（新增`toneExponent`欄位）後採用；我只看了這兩版預覽，沒有掃描其他指數。

新增專用sampler：建構時以篩法累加每個`n ≤ 2304`的因數個數（對每個`k`把`k`的倍數加1，暫存於Int32Array，建構後不保留），色調表（Float64）取`0.7·(d(n)/最大d)^0.75`；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.46格，在格界前恰好歸零，C1），顏色＝`0.04 + (0.14 + tone − 0.04)·mask + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`；磚縫AO為0.6（`1 − 0.4·(1 − mask)`）；roughness恆為0.4；金屬factor為0；cache合計48² + 128² = 18,688個Float64／149,504 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，256²取樣）：亮處（color>0.5）占5.58%–6.13%、color 0.0252–0.0258至0.8466–0.8502、平均0.2529–0.2565、roughness恆為0.4、AO最低0.6、height至多0.8372–0.8389 relief；512²取樣下seed 0／1／0xffffffff／7的亮處占5.70%–5.98%；2,304個磚中心的顏色與測試中獨立以試除法算出的因數個數表在唯一一個環面平移下一致（(6, 14)、(45, 46)、(4, 3)、(43, 5)，最大誤差約0.0149–0.0150，約等於細grain的幅度）；seed 0與1的亮區遮罩（512²）11.3%像素不同；seed 7的512²maps平均r／g／b約(41.4, 75.7, 78.2)、法線tilt²最大約0.0280、z分量最小253。我實看了預覽（seed 7）：深青綠色的像素格，以亮直條為主。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`dragoncurve`（龍形曲線）使目前目錄974→975種，含plain的gallery為976項。深紫黑底上一條金黃色的細線，描出第9階海威（Heighway）龍形曲線：512個單位步，轉向依規則的摺紙序列（第`k = 2^m(2j+1)`步在j為偶數時左轉、奇數時右轉），曲線與自己在格點上相碰但不共用邊（共361個相異格點、512條邊），外框約27×32格，放在40×40格的環面上，所以四周有空白、不會與相鄰拼貼相連；線寬為三分之一格，線外有淡淡的光暈。seed只把整條曲線沿環面平移。這是示意的碎形走線，不是摺紙實物，也不封閉。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；階數9、40×40格環面、三分之一格線寬、tanh銳度8、金黃與深紫色調與0.25 m nominal tile皆作者設定。調整紀錄：第一版線寬為半格（lattice每格2個node），預覽上相鄰線幾乎連成一片，改成每格3個node（線寬三分之一格）；改寬度時我只改了連接點的座標，漏改格點座標，預覽出現大片只有點的區域，探針量到亮node 1,376個、預期1,385個，修正格點座標後為1,385個。relief 0.0015時512²maps的法線tilt²最大為0.1602、法線z分量最小244，降到0.0008後為0.0517與252（同一批探針的前後值）。

新增專用sampler：建構時以摺紙序列逐步走出512步，在120×120的lattice上，格點放在每3個座標的位置（共361個），相鄰兩格之間以2個連接node填滿（共1,024個），亮node合計1,385個；曲線座標加上固定偏移(9, 10)與seed決定的環面平移；用`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化；顏色＝`0.06 + 0.76·line + 0.1·glow·(1 − line) + 0.03·(128²細grain − 0.5)`，其中`glow`是未銳化的混合值乘上`(1 − 0.14·9×9雜訊)`；height ＝ `0.8·line + 0.2·grain`；線處roughness降低0.2（基準0.4）；金屬factor為0；cache合計120² + 9² + 128² = 30,865個Float64／246,920 B lattice算術預算（非總RAM）。預設0.25 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，256²取樣）：亮處（color>0.5）占9.38%–9.44%、color 0.0457–0.0460至0.8329–0.8337、平均0.1359–0.1361、roughness 0.2001–0.3999、AO恆為1、height至多0.9871–0.9940 relief；四個seed的120×120 node盤面各自與測試中獨立重寫的龍形曲線在唯一一個環面平移下完全一致（(11, 27)、(38, 16)、(6, 16)、(13, 25)；亮node皆為1,385）；seed 0與1的node盤面有16.0%不同；seed 7的512²maps平均r／g／b約(48.5, 34.3, 37.8)、法線tilt²最大約0.0517。我實看了預覽（seed 7）：深紫底上金黃色的格網狀龍形線，環面上重複排列。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`juliatiles`（朱利亞集合磚）使目前目錄973→974種，含plain的gallery為975項。64×64個圓角方塊磚組成的朱利亞集合（Julia set，`c = −0.8 + 0.156i`）鑲嵌：第(col, row)格以複平面（實部與虛部皆−1.6到1.6）中該格中心點作為`z₀`，迭代`z → z² + c`，色調是逃逸迭代次數（`|z| > 2`，最多64次）除以64後開平方，由暗紅褐（快逃逸）到亮橙（逃逸前迭代次數多，位於集合邊界附近）；永不逃逸的格子（共404個，約9.9%）是最暗的深褐黑。磚面凸起、磚縫較暗並帶遮蔽（AO），seed只把整張表沿環面平移。解析度只有64×64，所以是像素風的朱利亞集合；與`mandelbrottiles`共用同一個sampler分支，只是起點與常數不同。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；64×64格、視窗範圍−1.6到1.6、常數c = −0.8 + 0.156i、64次迭代上限、開平方的色調映射、紅褐與橙色調與0.3 m nominal tile皆作者設定。預覽第一次就採用，relief 0.0008沿用mandelbrottiles的調整結果，沒有再調整。

沿用`mandelbrottiles`的sampler分支（現在同時服務`juliatiles`）：朱利亞模式下`z₀`是格中心的複數、`c`是固定常數（−0.8 + 0.156i），迭代`z → z² + c`直到`|z|² > 4`或64次，色調表（Float64）取`√(迭代次數/64)`，永不逃逸者記為−1（顏色取0.02）；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.47格，在格界前恰好歸零，C1）；顏色＝`0.04 + (level − 0.04)·mask + 0.02·(128²細grain − 0.5)`，`level = 0.1 + 0.82·tone`（集合內為0.02）；height ＝ `0.8·dome·(0.88 + 0.12·tone)`（集合內取0.5倍）加`0.08·grain`；磚縫AO為0.7；roughness恆為0.4；金屬factor為0；cache合計64²個Float64（色調表）＋128²細grain = 20,480個Float64／163,840 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：亮處（color>0.5）占6.48%–6.51%、color 0.0102–0.0104至0.9212–0.9227、平均0.2152、roughness恆為0.4、AO最低0.7、height至多0.8724–0.8746 relief；4,096個磚中心的顏色與測試中獨立重寫的朱利亞逃逸時間一致（永不逃逸404格），四個seed各自唯一對應的平移為(1, 5)、(2, 59)、(55, 24)、(22, 21)，最大誤差0.0100（即細grain的幅度）；seed 0與1的亮區遮罩11.7%像素不同；seed 7的512²maps平均r／g／b約(73.7, 39.7, 35.2)、法線tilt²最大約0.0421。我實看了預覽（seed 7）：紅褐色底上的朱利亞集合，集合邊界有亮橙色點與碎形的樹枝狀結構，被seed的環面平移切在圖的邊緣。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`mandelbrottiles`（曼德博集合磚）使目前目錄972→973種，含plain的gallery為974項。64×64個圓角方塊磚組成的曼德博集合（Mandelbrot set）鑲嵌：第(col, row)格對複平面上實部−2.2到0.8、虛部−1.5到1.5中對應小塊的中心點`c`迭代`z → z² + c`，色調是逃逸迭代次數（`|z| > 2`，最多48次）除以48後開平方，由暗藍（快逃逸）到亮青藍（逃逸前迭代次數多，位於集合邊界附近）；永不逃逸的格子（共726個，約17.7%）是最暗的深藍黑。磚面凸起、磚縫較暗並帶遮蔽（AO），seed只把整張表沿環面平移。解析度只有64×64，所以是像素風的曼德博集合；環面接縫處集合並不連續，不是無縫的碎形。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；64×64格、視窗範圍、48次迭代上限、開平方的色調映射、藍色調與0.3 m nominal tile皆作者設定。第一版色調是線性的迭代次數比，預覽上多數區域太暗，我改成開平方後採用。relief 0.0012時512²maps的法線tilt²最大為0.0865，降到0.0008後為0.0399（同一批探針的前後值）。

新增專用sampler：建構時對每格以`z₀ = 0`、`c`＝格中心對應的複數迭代`z → z² + c`直到`|z|² > 4`或達48次，色調表（Float64）取`√(迭代次數/48)`，永不逃逸者記為−1（顏色取0.02）；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.47格，在格界前恰好歸零，與modulartable系列相同，C1）；顏色＝`0.04 + (level − 0.04)·mask + 0.02·(128²細grain − 0.5)`，`level = 0.1 + 0.82·tone`（集合內為0.02）；height ＝ `0.8·dome·(0.88 + 0.12·tone)`（集合內取0.5倍）加`0.08·grain`；磚縫AO為0.7；roughness恆為0.4；金屬factor為0；cache合計64²個Float64（色調表）＋128²細grain = 20,480個Float64／163,840 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：亮處（color>0.5）占3.42%–3.43%、color 0.0102–0.0103至0.9004–0.9029、平均0.2257–0.2259、roughness恆為0.4、AO最低0.7、height至多0.8548–0.8637 relief；4,096個磚中心的顏色與測試中獨立重寫的逃逸時間一致（永不逃逸726格），四個seed各自唯一對應的平移為(21, 1)、(13, 20)、(2, 37)、(48, 47)，最大誤差0.0100（即細grain的幅度）；seed 0與1的亮區遮罩6.6%像素不同；seed 7的512²maps平均r／g／b約(30.2, 52.8, 77.7)、法線tilt²最大約0.0399。我實看了預覽：深藍色的像素風曼德博集合，邊緣有亮青色的點、外圍有逃逸帶的色階，環面接縫處有輕微的色階不連續。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`rhodoneatable`（玫瑰線表）使目前目錄971→972種，含plain的gallery為973項。粉紅霓虹風格的玫瑰線（rhodonea curve）表：6×6格，第(col, row)格畫出`r = cos(k·θ)`，`k = (col + 1)/(row + 1)`（θ從0到2π·(row + 1)，所以每個有理數k都封閉），從單圓、三葉、四葉、多瓣花到纏繞的環狀都有，深紫黑底上帶淡淡光暈；seed只把所有玫瑰線旋轉同一個角度（0到0.5弧度）。是數學圖案，不是真實霓虹燈管（沒有管徑變化、端點電極或反光）。k = 1的對角格是一個通過格心的小圓。

此材質是作者示意，沒有引用特定來源或霓虹燈照片，也沒有對照照片；6×6格、振幅0.4格、192段多邊形、線寬0.018格、粉紅與紫黑色調與0.3 m nominal tile皆作者設定。線的處理沿用`lissajoustable`剛調好的版本（`lineGain = 4`、緊湊的光暈核），所以沒有再經歷珠狀與格界跳變的問題；預覽第一次就採用。relief 0.0008，沒有調整。

新增專用sampler：建構時對每格以`θ = 2π·(row + 1)·k/192`取玫瑰線`r = 0.4·cos((col + 1)/(row + 1)·θ)`為192點封閉多邊形（單位為格，相對格中心，並整體旋轉seed決定的角度）；每個取樣點對該格的192條線段各算平方距離，線以`1 − exp(−4·Σ exp(−d²/0.018²))`（高斯和，自交處無折痕），光暈以`1 − exp(−0.1·Σ smoothstep(clamp(1 − d²/0.1²)))`（半徑0.1格不超過玫瑰線到格界的最短距離0.1格，格界處恰好為零）；顏色＝`0.04 + 0.74·line + 0.12·glow·(1 − line) + 0.02·(128²細grain − 0.5)`；height ＝ `0.8·line + 0.2·grain`；線處roughness降低0.2；cache合計2×6×6×192 = 13,824個Float64（多邊形點座標）＋128²細grain = 30,208個Float64／241,664 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。成本：每次取樣要量該格192條線段，本機bun量測512²取樣約232–243 ms、512² maps約257 ms（單次量測，非benchmark）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：亮處（color>0.5）占25.48%–25.53%、color 0.0301至0.7896–0.7899、平均0.2483–0.2484、roughness 0.2–0.4、height至多0.9961–0.9988 relief；各格四個角落的最大color為0.0489–0.0493；在0到0.5弧度之間掃描101個旋轉角，恰有29–30個角度使6×6×64 = 2,304個玫瑰線點全部落在亮度大於0.5的像素上（最小值0.7598–0.7617），其餘角度則否；seed 0與1的亮區遮罩15.0%像素不同；seed 7的512²maps平均r／g／b約(72.3, 40.3, 66.2)、法線tilt²最大約0.0469。我實看了預覽：深紫底上粉紅色的玫瑰線，一眼就是玫瑰線（rhodonea）表，k較大的格子密密麻麻、像編織的圓盤。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`lissajoustable`（李薩如曲線表）使目前目錄970→971種，含plain的gallery為972項。示波器風格的綠色磷光曲線表：6×6格，第(col, row)格畫出李薩如曲線`x = sin((col + 1)·t + φ)`、`y = sin((row + 1)·t)`（頻率比(col + 1):(row + 1)，從橢圓到緊密的編織狀），暗綠黑底上帶淡淡光暈；seed只改變共同的相位φ（0.25π到0.75π）。是數學圖案，不是真實示波器畫面（沒有網格刻度、掃描線或雜訊）。

此材質是作者示意，沒有引用特定來源或示波器照片，也沒有對照照片；6×6格、振幅0.36格、128段多邊形、線寬0.018格、青綠色調與0.3 m nominal tile皆作者設定。調整紀錄：第一版以96段、線寬0.022的高斯和疊加，預覽上線條有明顯的珠狀起伏（相鄰線段重疊處的高斯和較大），我加入`lineGain = 4`並提高到128段後才變平滑；另外第一版的光暈是寬0.07的高斯，在格界不為零，C1測試因此失敗（最大二階差分比值2.2×10⁷，等於相鄰格之間約2×10⁻³的函數跳變），我改為半徑0.12格的緊湊smoothstep核（小於曲線到格界的距離0.14格，所以在格界恰好為零）後通過。

新增專用sampler：建構時對每格以`t = 2π·k/128`把曲線取為128點的封閉多邊形（單位為格，相對格中心）；每個取樣點對該格的128條線段各算平方距離`d²`，線以`Σ exp(−d²/0.018²)`、再以`1 − exp(−4·Σ)`壓進[0, 1]（高斯和而非距離最小值，所以曲線自交處沒有折痕），光暈以`Σ smoothstep(clamp(1 − d²/0.12²))`、再以`1 − exp(−0.1·Σ)`壓縮；顏色＝`0.04 + 0.72·line + 0.12·glow·(1 − line) + 0.02·(128²細grain − 0.5)`；height ＝ `0.8·line + 0.2·grain`；線處roughness降低0.2；cache合計2×6×6×128 = 9,216個Float64（多邊形點座標）＋128²細grain = 25,600個Float64／204,800 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移；0.0012時512²maps的法線tilt²最大為0.0965，0.0008時為0.0444，同一批探針的前後值）。成本：每次取樣要對該格的128條線段求距離，本機bun量測512²取樣約182–201 ms、512² maps約216 ms（單次量測，非benchmark）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：亮處（color>0.5）占25.07%–25.24%、color 0.0302至0.7696–0.7698、平均0.2473–0.2487、roughness 0.2–0.4、height至多0.9970–0.9986 relief；各格四個角落（離曲線最遠處）的最大color為0.0482–0.0494；在0.25π到0.75π之間掃描501個相位，恰有46–47個相位使6×6×64 = 2,304個曲線點全部落在亮度大於0.5的像素上（最小值0.7500–0.7503），其餘相位則否（相位不對時曲線點會落在暗處）；seed 0與1的亮區遮罩25.6%像素不同；seed 7的512²maps平均r／g／b約(31.2, 72.1, 43.1)、法線tilt²最大約0.0444。我實看了預覽：暗綠底上的綠色李薩如曲線，從橢圓到編織狀，一眼就是經典的李薩如曲線表，線條略有珠狀感。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`primesieve`（埃拉托斯特尼篩）使目前目錄969→970種，含plain的gallery為971項。32×32個圓角方塊磚代表整數1到1024：質數（共172個）是明亮的金黃色，1是暗色，合數的色調依最小質因數`p`為`0.4·(1 − 1/p)`（2的倍數最暗、較大質因數的合數稍亮），因此2、3、5、7的倍數在橄欖色的底上留下規則的直條與斜紋，質數則散布其間。磚面凸起、磚縫較暗並帶遮蔽（AO），seed只把整張表沿環面平移。是數論圖案，不是任何真實材質；合數之間的對比偏低，看起來像橄欖色底上的金色點。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；32×32格、1到1024、質數色調0.8、合數色調跨度0.4、金黃與橄欖色調與0.3 m nominal tile皆作者設定。第一版質數色調為0.92，色調加上底色會超出[0, 1]（約1.06），我在載入前就改成0.8；沒有再調整其他參數。

新增專用sampler：建構時以埃拉托斯特尼篩算出1到1024每個整數的最小質因數，色調表（Float64）為：1取0.1、質數取0.8、合數取`0.4·(1 − 1/最小質因數)`；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.46格，在格界前恰好歸零，與modulartable系列相同，C1）；顏色＝`0.05 + (0.14 + tone − 0.05)·mask + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`；磚縫AO為0.6；roughness恆為0.45；金屬factor為0；cache合計32²個Float64（色調表）＋128²細grain = 17,408個Float64／139,264 B lattice算術預算（非總RAM；建構時另有一個1,025項的Int32篩表為暫存）。預設0.3 m nominal tile與0.0012 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：亮處（color>0.5）占15.9%–16.0%、color 0.0351–0.0352至0.9545–0.9547、平均0.3573–0.3576、roughness恆為0.45、AO最低0.6、height至多0.8579–0.8595 relief；1,024個磚中心的顏色與測試中以試除法獨立重寫的最小質因數一致（其中質數172個），四個seed各自唯一對應的平移為(18, 21)、(0, 10)、(10, 29)、(18, 23)，最大誤差0.0150（即細grain的幅度）；seed 0與1的亮區遮罩19.1%像素不同；seed 7的512²maps平均r／g／b約(106.5, 89.3, 55.2)、法線tilt²最大約0.0399。我實看了預覽：橄欖色磚面上的金黃色質數點，可看出直條規律，但合數之間的對比偏低。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`gcdtable`（最大公因數表）使目前目錄968→969種，含plain的gallery為970項。32×32個圓角方塊磚：第(col, row)格代表`gcd(col + 1 + a, row + 1 + b)`（歐幾里得演算法，偏移a、b在0到63之間由seed決定），色調為`1 − 1/gcd`——互質的格子（約六成）保持暗色，公因數愈大的格子愈亮，沿著通過格網的直線與斜線亮起。磚面凸起、磚縫較暗並帶遮蔽（AO）。是一個數論圖案，不是任何真實材質。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；32×32格、偏移範圍64、色調`1 − 1/gcd`的映射、青綠色調與0.3 m nominal tile皆作者設定。預覽第一次就採用，沒有調整參數。

新增專用sampler：建構時對每格以歐幾里得演算法算出最大公因數並寫入色調表（Float64，`tone = 1 − 1/gcd`）；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.46格，在格界前恰好歸零，與modulartable／pascalmod3／collatzsteps相同，C1）；顏色＝`0.05 + (0.14 + 0.78·tone − 0.05)·mask + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`；磚縫AO為0.6；roughness恆為0.45；金屬factor為0；cache合計32²個Float64（色調表）＋128²細grain = 17,408個Float64／139,264 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0012 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：亮處（color>0.5）占26.4%–27.9%、color 0.0351–0.0353至0.9088–0.9166、平均0.2555–0.2671、roughness恆為0.45、AO最低0.6、height至多0.8697–0.8733 relief；1,024個磚中心的顏色與測試中獨立重寫的gcd一致，四個seed各自唯一對應的偏移為(21, 59)、(36, 0)、(47, 11)、(12, 36)，最大誤差0.0149–0.0150（即細grain的幅度）；seed 0與1的亮區遮罩40.6%像素不同；seed 7的512²maps平均r／g／b約(44.0, 75.5, 78.9)、法線tilt²最大約0.0400。我實看了預覽：暗藍底上青綠色方塊磚，有斜線與整行整列的規則亮線，像數論的網格圖。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`collatzsteps`（考拉茲步數）使目前目錄967→968種，含plain的gallery為969項。32×32個圓角方塊磚：第(col, row)格代表整數`n = row·32 + col + 1`（1到1024），色調是n依考拉茲規則（偶數除以2、奇數乘3加1）走到1所需的步數除以178（1到1024中最長的是n = 871的178步），從暗紫到暖橙共連續變化。磚面凸起、磚縫較暗並帶遮蔽（AO），seed只把整張表沿環面平移。看起來是帶有結構的雜訊（相鄰整數的步數有微妙的關聯，但整體近似隨機），不是任何真實材質，只是數學圖案。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；32×32格、涵蓋1到1024、以178為步數上限、暖橙色調與0.3 m nominal tile皆作者設定。預覽第一次就採用，沒有調整參數。

新增專用sampler：建構時對1到1024的每個整數以考拉茲規則（`n → n/2`或`3n + 1`）計算走到1的步數，色調`tone = 步數/178`（Float64表）；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.46格，在格界前恰好歸零，與modulartable／pascalmod3相同，C1）；顏色＝`0.05 + (0.14 + 0.78·tone − 0.05)·mask + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`；磚縫AO為0.6；roughness恆為0.5；金屬factor為0；cache合計32²個Float64（步數表）＋128²細grain = 17,408個Float64／139,264 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0012 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：亮處（color>0.5）占22.6%、color 0.0352至0.9302–0.9334、平均0.3043–0.3046、roughness恆為0.5、AO最低0.6、height至多0.8642–0.8717 relief；1,024個磚中心的顏色與測試中獨立重寫的考拉茲步數一致，四個seed各自唯一對應的平移為(7, 13)、(9, 1)、(7, 24)、(23, 5)，最大誤差0.0149–0.0150（即細grain的幅度）；seed 0與1的亮區遮罩32.5%像素不同；seed 7的512²maps平均r／g／b約(87.3, 63.4, 54.3)、法線tilt²最大約0.0380。我實看了預覽：暗紫色底上散布著橙色的方塊磚，近似雜訊但帶有垂直與水平的條狀結構，不像是會讓人看出數學意義的圖案。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`pascalmod3`（帕斯卡三角形模3）使目前目錄966→967種，含plain的gallery為968項。青綠色圓角方塊磚排成的48×48格：左下三角形部分是帕斯卡三角形（楊輝三角）每個數字除以3的餘數（0、1、2分別是暗、中、亮三階），形成分形般的嵌套三角形；對角線以外的格子是更暗的空格，磚縫帶遮蔽（AO）。seed只把整張表沿環面平移。不是任何真實材質，只是數學圖案。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；48×48格、模數3、三階色調與0.3 m nominal tile皆作者設定。表格只畫了三角形的一半，其餘是空格，所以約有一半面積是暗色空白。

新增專用sampler：建構時以加法規則`C(n, k) = C(n − 1, k − 1) + C(n − 1, k)`逐列算出模3的餘數（Int8表，對角線以外為−1）；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.46格，在格界前恰好歸零，與modulartable相同，C1）；色調＝`0.28 + 0.62·(residue/2)`（空格為0.1）；顏色＝`0.04 + (level − 0.04)·mask + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·dome·(0.88 + 0.12·tone)`（空格取0.5倍）加`0.08·grain`；磚縫AO為0.6；roughness恆為0.45；金屬factor為0；cache合計2,304個Int8（餘數表）＋128²細grain = 16,384個Float64／131,072 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0012 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：亮處（color>0.5）占14.4%–14.6%、color 0.0252–0.0254至0.9144–0.9146、平均0.2094–0.2107、roughness恆為0.45、AO最低0.6、height至多0.8763–0.8779 relief；表中餘數0／1／2各有708／318／150個格子、空格1,128個；2,304個磚中心的顏色與獨立重寫的帕斯卡三角形一致，四個seed各自唯一對應的平移為(14, 28)、(8, 11)、(21, 12)、(44, 17)，最大誤差0.0149–0.0150（即細grain的幅度）；seed 0與1的亮區遮罩23.8%像素不同；seed 7的512²maps平均r／g／b約(29.9, 67.6, 68.5)、法線tilt²最大約0.0679。我實看了預覽：暗色底上青綠色的方塊磚，一個個嵌套的三角形（Sierpinski風格的三階版本），像數學海報。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`modulartable`（模運算乘法表）使目前目錄965→966種，含plain的gallery為967項。31×31個圓角方塊磚排成的鑲嵌：第(col, row)格的色調由模11乘法表的餘數`((a + col)·(b + row)) mod 11`決定（從暗紫到金黃共11階，seed決定偏移a與b），磚面凸起、磚縫較暗並帶遮蔽（AO）。因為0的餘數出現在`a + col`或`b + row`是11的倍數時，整行或整列會變成暗磚的帶狀，其餘部分呈現乘法表的對稱圖案。不是任何真實鑲嵌或磁磚，只是數學圖案。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；31×31格、模數11、11階色調、磚大小與0.3 m nominal tile皆作者設定。第一版relief 0.003時512²maps的法線tilt²最大為0.2140，降到0.0012後為0.0412（同一批探針的前後值）。

新增專用sampler（沒有per-cell陣列，色調即時算出）：每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經過smoothstep：`mask = smooth(clamp((1 − (ax⁴ + ay⁴))/0.3))`，半寬0.46格，在格界前恰好歸零，所以逐格查詢不會有跳變，C1）；色調`tone = (((a + col)·(b + row)) mod 11)/10`；顏色＝`0.05 + (0.12 + 0.8·tone − 0.05)·mask + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`；磚縫AO為0.6（`gapOcclusion` 0.4）；roughness恆為0.5；金屬factor為0；cache只有128²細grain = 16,384個Float64／131,072 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0012 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：亮處（color>0.5）占35.6%–36.9%、color 0.0351–0.0354至0.9345–0.9347、平均0.369–0.379、roughness恆為0.5、AO最低0.6、height至多0.8755–0.8791 relief；961個磚中心的色調與乘法表一致（四個seed分別唯一對應偏移(a, b) = (10, 1)、(2, 9)、(1, 3)、(1, 1)，最大誤差0.0178–0.0185，即細grain的幅度）；seed 0與1的亮區遮罩36.7%像素不同；seed 7的512²maps平均r／g／b約(109.0, 86.0, 67.8)、法線tilt²最大約0.0412。我實看了預覽：金黃與暗紫的方塊鑲嵌，有明顯的對稱圖案與暗色帶，像模運算的視覺化。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`elementaryautomata`（基本元胞自動機）使目前目錄964→965種，含plain的gallery為966項。琥珀色LED點陣上並排四段Wolfram基本元胞自動機（每段32列、128欄，欄在環面上相接）：規則30（單一活細胞開局的混沌三角形）、規則90（Sierpinski三角形）、規則110（複雜的不對稱結構）與規則184（以重複的「110」圖樣開局的斜條紋交通流）；seed只把整張圖的欄做環狀旋轉，圖案本身固定。每個細胞是圓角方塊LED，熄滅的LED保留暗褐色。因為是環面，規則30等的三角形在128欄的寬度內不會碰到邊界，所以看起來與無限寬的結果相同。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；欄數128、每段32列、四條規則與開局圖樣、琥珀色調與0.3 m nominal tile皆作者設定。第一版（尚未調整）預覽就採用；512²maps的法線tilt²最大只有0.0038（relief 0.001），沒有調整。

新增專用sampler：建構時對每個規則段先寫入開局列（單一活細胞位於第64欄；規則184是重複的`x % 3 ≠ 2`圖樣），之後每一列依規則編號的位元表（`(rule >> (left·4 + center·2 + right)) & 1`）在環狀欄上演化；整張圖的欄再依seed旋轉；128×128的0／1格用`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化，每個細胞為`cos²`在兩軸切出的圓角方塊LED（C∞）；顏色＝`0.04 + cell·(0.08 + 0.78·lit) + 0.02·(128²細grain − 0.5)`；height ＝ `0.8·cell + 0.2·grain`；亮處roughness降低0.2；cache合計128² + 128² = 32,768個Float64／262,144 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.001 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：亮處（color>0.5）占23.39%（四個seed完全相同）、color 0.0940–0.0942至0.9094–0.9095、平均0.2803–0.2804、roughness 0.25–0.45、height至多0.9983–0.9995 relief；16,384個細胞node中亮的為3,893個、沒有node顏色落在0.3到0.6之間；四個seed取到的盤面都與測試中獨立重寫的四條規則自動機完全一致，只差一個欄旋轉（seed 0、1、0xffffffff、7的旋轉分別為74、4、49、31欄）；seed 0與1的亮區遮罩29.6%像素不同；seed 7的512²maps平均r／g／b約(84.4, 53.7, 20.8)、法線tilt²最大約0.0038。我實看了預覽：琥珀色的規則30混沌三角形、規則90的Sierpinski三角形、規則110的結構與規則184的斜條紋，一眼就是Wolfram的元胞自動機海報，但規則30與90、110的三角形只佔每段的中央區，其餘是暗色空白。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`gameoflife`（生命遊戲）使目前目錄963→964種，含plain的gallery為965項。暗藍綠LED點陣上的康威生命遊戲（Conway's Game of Life）湯：64×64的環面，以seed決定的38%密度隨機開局，演化250代，亮綠色的活細胞形成方塊、蜂巢、閃爍器與滑翔機等結構。**演化後的盤面並未完全靜止**（仍有滑翔機與閃爍器在動；後續12代每代仍有約4%–9%的細胞改變），只是一張靜態快照。每個細胞是圓角方塊的LED，熄滅的LED保留暗色。

此材質是作者示意，沒有引用特定來源或真實螢幕照片，也沒有對照照片；盤面64×64、密度0.38、250代、色調與0.2 m nominal tile皆作者設定。第一版relief 0.0015時512²maps的法線tilt²最大為0.0900，降到0.001後為0.0422（同一批探針的前後值）。生命遊戲只在sampler建構時跑一次，建構約30 ms。

新增專用sampler：建構時以hash < 0.38初始化64×64環面，依康威規則（3個鄰居誕生、2或3個鄰居存活）執行250代；最終盤面用`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化；每個細胞是`cos²`在兩軸切出的圓角方塊LED（`0.5 + 0.5·tanh(12·(cos²(π·64·u) − 0.06))`乘以v向對應項，C∞）；顏色＝`0.04 + cell·(0.08 + 0.78·lit) + 0.02·(128²細grain − 0.5)`；height ＝ `0.8·cell + 0.2·grain`；亮處roughness降低0.2；cache合計64² + 128² = 20,480個Float64／163,840 B lattice算術預算（非總RAM；建構時另有兩個64²的Uint8盤面與一個Float64轉換陣列為暫存）。預設0.2 m nominal tile與0.001 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：亮處（color>0.5）占3.7%–5.5%、color 0.0411–0.0413至0.9090–0.9096、平均0.133–0.150、roughness 0.25–0.45、height至多0.9976–0.9988 relief；4,096個細胞node中活細胞272–401個、沒有node顏色落在0.3到0.6之間；以我在測試中獨立重寫的康威規則從取到的盤面再演化12代，每代改變的細胞為157–383個（占3.8%–9.4%）；seed 0與1的亮區遮罩8.1%像素不同；seed 7的512²maps平均r／g／b約(20.7, 45.2, 42.1)、法線tilt²最大約0.0422。我實看了預覽：暗色LED點陣上散布著亮綠色的方塊、蜂巢、閃爍器與滑翔機，一眼就是生命遊戲。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`hilbertcurve`（希爾伯特曲線）使目前目錄962→963種，含plain的gallery為964項。深藍黑底上一條青藍色的電路走線，走的是第4階希爾伯特空間填充曲線：16×16個格子每格恰好經過一次，並在拼貼邊界處把終點接回起點形成封閉迴圈（希爾伯特曲線的起點與終點是環面上相鄰的格子）；線寬約半格，線外有淡淡的光暈。seed選擇八種方形對稱（鏡射與轉置）之一並把曲線沿環面平移，所以統計不變、只有走向與位置改變。不是真實電路板（沒有焊盤、通孔或多層走線）。

此材質是作者示意，沒有引用特定來源或電路板照片，也沒有對照照片；階數4、線寬為半格、tanh銳度8、青藍色調與0.2 m nominal tile皆作者設定。第一版relief 0.002時512²maps的法線tilt²最大為0.0901，我降到0.0015後為0.0512（同一批探針的前後值）。

新增專用sampler：建構時以標準的希爾伯特距離到座標轉換（`d2xy`）逐一產生256個格子，套用seed選出的方形對稱與環面平移；在32×32的lattice上，格子中心放在偶數座標、相鄰兩格之間的連接點放在中間的奇數座標（含終點到起點跨越接縫的那一個連接），共512個亮node；用`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化；顏色＝`0.06 + 0.74·line + 0.1·glow·(1 − line) + 0.03·(128²細grain − 0.5)`，其中`glow`是未銳化的混合值乘上`(1 − 0.14·9×9雜訊)`；height ＝ `0.8·line + 0.2·grain`；線處roughness降低0.2；cache合計32² + 9² + 128² = 17,489個Float64／139,912 B lattice算術預算（非總RAM）。預設0.2 m nominal tile與0.0015 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7等八個seed，512²取樣）：亮處（color>0.5）占49.7%（八個seed皆為49.71%–49.73%）、color 0.0456–0.0460至0.8143–0.8146、平均0.4384–0.4387、roughness 0.2001–0.3999、height至多0.9969–0.9987 relief；512個node中256個為格子中心（每個恰有兩個亮鄰居）、256個為連接點，沒有node顏色落在0.3到0.6之間；在12個seed（0至9、0xffffffff、12345）上從任一格子中心沿線走，都恰好走256步回到起點並訪問256個不同的格子（單一封閉迴圈）；seed 7的512²maps平均r／g／b約(56.0, 108.7, 125.3)、法線tilt²最大約0.0512。我實看了預覽：青藍色的希爾伯特曲線布滿深色底，轉折整齊，像電路走線或迷宮，但因為只有一階的單線寬，比真實電路板單調。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`quasicrystal`（準晶干涉）使目前目錄961→962種，含plain的gallery為963項。五個平面波以接近72°間隔的整數波向量干涉，形成看似五重對稱的藍白圖案：深藍色的圓點、五邊形環與五角星狀結構疊在淺藍底上。因為每個波向量都是整數，圖案**在tile上精確週期**，所以它是五波干涉的近似、不是真正的準晶或Penrose鋪磚（波向量長度為14與約13.6，角度為0°、72.9°、144.0°、216.0°、287.1°，只近似72°等分）；seed只改變各波的相位，統計不變。

此材質是作者示意，沒有引用準晶文獻或實測繞射圖，也沒有對照照片；五個整數波向量(14, 0)、(4, 13)、(−11, 8)、(−11, −8)、(4, −13)、tanh對比1.5、色調與0.3 m nominal tile皆作者設定。relief 0.004時512²maps的法線tilt²最大為0.358，降到0.0015後為0.0716（同一批探針的前後值）。

新增專用sampler：`sum = Σᵢ cos(2π·(kxᵢ·u + kyᵢ·v) + φᵢ)`（五個整數波向量，相位φᵢ由hash決定），`level = 0.5 + 0.5·tanh(1.5·sum)`（C∞；sum範圍−5到5），顏色＝`0.06 + 0.88·level`，height ＝ `level`，roughness ＝ `0.3 + 0.35·(1 − level)`；金屬factor為0，無mortar，AO 1；沒有lattice cache（只有5個相位）。預設0.3 m nominal tile與0.0015 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：亮處（color>0.5）占47.3%–52.8%、color 0.0600至0.9400、平均0.484–0.517、roughness 0.30–0.65；seed 0與1的亮區遮罩51.5%像素不同；在128×128網格上做離散傅立葉分量，五個波向量處的振幅為0.1051–0.1060（五者彼此相差不到1%），而(3, 5)、(6, 1)、(9, 9)、(1, 10)、(7, 3)、(12, 12)等非波向量處皆不超過0.0007；seed 7的512²maps平均r／g／b約(103.4, 119.6, 149.1)、法線tilt²最大約0.0716。我實看了預覽：深藍的五邊形環與圓點在淺藍底上，一看就是五重對稱的干涉圖案，但是tile是週期的，不是準晶。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`sudoku`（數獨）使目前目錄960→961種，含plain的gallery為962項。報紙上的數獨題目格：9×9格的深藍灰細線，每個3×3宮格以較粗的兩像素線框起，約四成的格子（每個seed約32–36格）放一個由seed決定的3×5像素數字（1至9），其餘為空。**數字是隨機放置的，不是合法或有解的數獨**，也不是任何真實題目。數字是3×5像素字形，因平滑混合而略帶圓角、筆畫偏粗。

此材質是作者示意，沒有引用特定題目、報紙版面或字體，也沒有對照照片；9×9格、每格7像素、3×5像素數字字形（十個字形由我手寫的位元圖）、數字機率0.4、色調與0.2 m nominal tile皆作者設定。第一版宮格線為三像素粗，預覽上深色線占面積過大，我改成兩像素後採用；數字筆畫在預覽中偏粗而略顯糊，這是3×5像素字形的限制，我沒有為此加大格數。

新增專用sampler：建構時對63×63的像素格寫入0／1（`x % 7 = 0`或`y % 7 = 0`為細線；`x % 21 = 20`或`y % 21 = 20`與其相鄰的細線形成兩像素粗的宮格線；每個格子以hash < 0.4放置一個在格內偏移(2, 1)的3×5數字字形，字形取自十個手寫位元圖的第1至9個）；用`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化；墨＝標記×(0.88 + 0.12·7×7雜訊)；顏色＝`0.92 − 0.8·ink + 0.04·(160²紙grain − 0.5)`；height ＝ `0.7·ink + 0.3·grain`；墨處roughness降低0.2；cache合計63² + 7² + 160² = 29,618個Float64／236,944 B lattice算術預算（非總RAM）。預設0.2 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：墨（color<0.5）占42.3%–44.0%、color 0.102–0.110至0.9396–0.9397、平均0.584–0.598、roughness 0.6004–0.8、height至多0.983–0.990 relief；每個seed的81個格子中32–36格放了數字、其餘45–49格為空，沒有任何一格出現不屬於十個字形的圖樣；3,969個像素節點中沒有節點顏色落在0.3到0.7之間；seed 0與1的墨遮罩11.6%像素不同；seed 7的512²maps平均r／g／b約(147.0, 147.5, 150.0)、法線tilt²最大約0.0297。我實看了預覽：淺色格子被深藍灰的線與粗宮格線分開，格內有粗體的像素數字，看得出是數獨，但深色線偏多、數字偏糊。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`datamatrix`（Data Matrix二維碼）使目前目錄959→960種，含plain的gallery為961項。奶油白標籤上的黑色方形二維碼：每個符號是18×18模組，左邊與下邊是實心的L形定位圖案，上邊與右邊是黑白交替的時序軌，內部16×16是由seed決定的隨機資料模組（約一半為黑），符號之間留4模組的靜區，一個tile是2×2個符號。**資料是隨機的，不是有效的Data Matrix編碼**（沒有Reed-Solomon糾錯、也不能被掃描器解碼），只模仿外觀。模組因平滑混合而略帶圓角。

此材質是作者示意，沒有引用Data Matrix規格（ISO/IEC 16022）以外的來源、也沒有對照照片或掃描驗證；符號為18×18模組、靜區4模組、資料機率0.5、色調與0.12 m nominal tile皆作者設定，不宣稱符合任何規格版本的符號大小或資料編排。

新增專用sampler：建構時對44×44的模組格寫入0／1（每個符號：`x = 0`或`y = 17`為黑；上緣`y = 0`在偶數`x`為黑；右緣`x = 17`在奇數`y`為黑；其餘模組以hash < 0.5為黑，每個符號用不同的位置鹽值；靜區全白）；用`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化；墨＝標記×(0.9 + 0.1·7×7雜訊)；顏色＝`0.94 − 0.84·ink + 0.03·(160²紙grain − 0.5)`；height ＝ `0.7·ink + 0.3·grain`；墨處roughness降低0.15；cache合計44² + 7² + 160² = 27,585個Float64／220,680 B lattice算術預算（非總RAM）。預設0.12 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：墨（color<0.5）占36.2%–38.4%、color 0.0866–0.0899至0.9546–0.9547、平均0.633–0.646、roughness 0.40–0.55、height至多0.9857–0.9936 relief；1,936個模組節點中，所有定位L、時序軌與靜區節點都與規則一致（靜區640個節點全白、內部1,024個資料節點的黑色比例為49.8%–53.7%）、沒有節點顏色落在0.3到0.7之間；seed 0與1的墨遮罩27.2%像素不同；seed 7的512²maps平均r／g／b約(163.0, 163.0, 160.6)、法線tilt²最大約0.0235。我實看了預覽：奶油白底上整齊的黑色方形碼，L形定位與時序軌清楚，像Data Matrix，但模組是圓角的、資料沒有任何意義。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`couscous`（庫斯庫斯）使目前目錄958→959種，含plain的gallery為960項。淡米黃色的微小球狀穀粒（semolina）緊密堆疊的表面：26×26格、每格一粒略帶旋轉與大小變化的圓粒，彼此重疊，粒縫露出較暗的底色並帶遮蔽（AO）。不是真實庫斯庫斯的粒徑分布、表面細粉、蒸煮後的結塊或光澤，預覽也只有單一暗褐到淺米黃的漸層，粒子形狀比較圓而均勻。

此材質是作者示意，沒有引用特定來源、食物照片或量測，也沒有對照照片；它直接沿用granola／tilledsoil／sherpafleece共用的重疊旋轉橢圓粒子sampler（關閉了第二層chunk層：`chunkChance`為0），格數26、粒徑0.58 ± 0.15格、色調與0.1 m nominal tile皆作者設定。第一版粒子較小（0.5）且底色偏暗（0.1），預覽上粒縫太黑；我把粒徑加到0.58、底色提高到0.26後採用。relief 0.008時512²maps的法線tilt²最大為0.731，0.002時為0.1425，最後取0.0012得0.0570（同一批探針的三個值）。

沿用既有的piece sampler（`granola`、`tilledsoil`、`sherpafleece`的共用分支，現在加入`couscous`）：兩層旋轉橢圓粒子以固定5×5鄰域順序合成（`value = value·(1 − m) + piece·m`，`m`是`smooth(1 − q)`的平滑遮罩，因此重疊處維持C1），其中第二層因`chunkChance = 0`沒有任何粒子；顏色＝`0.26·rest + shade·(1 − rest) + 0.04·(128²細grain − 0.5)`；height ＝ `0.8·lift + 0.2·grain`；AO在底色處為0.4（`groundOcclusion` 0.6）；roughness恆為0.88；金屬factor為0；cache合計兩層各7個每格陣列（26²＋8²格）＋64²邊緣雜訊＋128²細grain = 25,660個Float64／205,280 B lattice算術預算（非總RAM）。預設0.1 m nominal tile與0.0012 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：底色處（occlusion<0.46）占13.8%–14.6%、其平均color 0.2583–0.2588、粒子（color>0.5）占74.3%–75.2%、沒有任何像素color<0.2、color 0.2058–0.2071至0.9529–0.9571、平均0.614–0.622、height至多0.9929–0.9954 relief；seed 0與1的底色遮罩23.4%像素不同（256²）；seed 7的512²maps平均r／g／b約(173.4, 146.4, 98.6)、occlusion<200的像素占21.4%、法線tilt²最大約0.0570。我實看了預覽：淺米黃色的圓粒緊密堆疊，粒縫為暗褐色，一眼是庫斯庫斯或小米類的穀粒表面，但形狀偏圓、粒徑偏均勻。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`morse`（摩斯電碼）使目前目錄957→958種，含plain的gallery為959項。奶油色紙帶上的14行摩斯電碼：每行是一串由seed決定的隨機訊息，點為1格、劃為3格，符號之間空1格、字母之間空3格、單字之間空7格，墨跡是深灰色的圓角短條。不是真實電報的內容（訊息是隨機符號而不是可譯的文字）、也沒有穿孔紙帶的孔或墨水暈染；每行在右緣截斷並與左緣相接（週期），所以接縫處的標記可能連在一起。

此材質是作者示意，沒有引用特定來源、電報紙帶照片或量測，也沒有對照照片；欄列數72×14、劃長3格、劃機率0.45、字母最多4個符號、換字機率0.2、色調與0.3 m nominal tile皆作者設定。第一版行遮罩門檻0.22時標記是又高又粗的方塊，看起來不像電碼，我把門檻改為0.8讓每行變細後採用。

新增專用sampler：建構時對每一行以hash產生訊息（每個符號先決定點或劃，後面空1格；以`symbols / 4`的機率結束一個字母並多空2格、其中20%機率改多空6格形成單字間隔），把標記寫入72×14的0／1圖；用`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化；列間距以`0.5 + 0.5·tanh(12·(cos²(π·14·v) − 0.8))`遮罩（C∞）；墨＝標記×列遮罩×(0.85 + 0.15·9×9雜訊)；顏色＝`0.9 − 0.78·ink + 0.04·(160²紙grain − 0.5)`；height ＝ `0.7·ink + 0.3·grain`；墨處roughness降低0.25；cache合計72×14 + 9² + 160² = 26,689個Float64／213,512 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0012 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：墨（color<0.5）占12.4%–13.4%、color 0.114–0.119至0.9199–0.9200、平均0.801–0.807、roughness 0.503–0.75、height至多0.966–0.979 relief；各行節點的內部（未觸及行首行尾）亮段長度只有1與3、空段只有1、3、7（每seed約118–139個點與90–108個劃，沒有任何其他長度）；seed 0與1的墨遮罩11.0%像素不同；seed 7的512²maps平均r／g／b約(197.8, 187.8, 163.2)、法線tilt²最大約0.065。我實看了預覽：奶油色紙上排列整齊的深灰色點與劃，一眼就是電碼。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`pizza`（披薩）使目前目錄956→957種，含plain的gallery為958項。融化起司上散布紅棕色香腸片（pepperoni）的披薩表面示意：5×5格、每格以72%機率放一片稍有抖動與大小變化的圓片（所以每個seed約14–20片，沿格子排列、不是真實的隨機散布），起司底色淺黃，帶較深的烤焦色塊（blister）與淡淡露出的番茄醬色，香腸片中央略高、帶少量油亮斑點且roughness較低。不是真實披薩的香腸片捲邊、起司拉絲與油光、餅皮邊緣或其他配料，香腸片也是棕紅而不是鮮紅（單一暗→亮漸層），預覽比較像圓點花紋。

此材質是作者示意，沒有引用特定來源、食物照片或量測，也沒有對照照片；格數、出現機率0.72、圓片半徑0.3 ± 16%、抖動0.12、色調與0.25 m nominal tile皆作者設定與調整。第一版（全格皆有、半徑變化10%、油斑96格）看起來像整齊的棕色圓點格子，我加入隨機缺席、加大半徑變化、把油斑改成44格的柔和斑點後採用，仍然看得出格子排列。

新增專用sampler：每格一片圓片，中心有抖動，最大半徑0.348格加抖動0.12格小於半格，所以圓片在自己的格界前就歸零、逐格查詢不會產生跳變；圓片輪廓是`smoothstep(clamp((1 − r²)/0.12))`（C1），並以`present`（hash < 0.72）決定是否出現；起司＝`0.86 − 0.3·blister − 0.12·sauce + 0.04·(128²細grain − 0.5)`，其中blister與sauce是9×9與6×6慢雜訊通過tanh門檻（0.62、0.7）的平滑遮罩；香腸片＝`0.12 + 0.1·dome + 0.1·speck`，speck是44×44雜訊的tanh斑點；顏色是兩者以圓片遮罩混合；height ＝ `0.6·dome·mask + 0.25·blister雜訊 + 0.15·grain`；香腸片處roughness降低0.2；cache合計25×4個每格陣列（offsetX、offsetY、halves、present）＋9² ＋6² ＋44² ＋128² = 18,537個Float64／148,296 B lattice算術預算（非總RAM）。預設0.25 m nominal tile與0.004 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，256²取樣）：香腸片（color<0.3）占14.5%–22.1%、連通區14–20、起司（color>0.6）占59.3%–70.6%、color 0.1240至0.8776–0.8791、平均0.609–0.646、roughness 0.35–0.55、height至多0.918–0.963 relief；seed 0與1的香腸片遮罩18.3%像素不同；seed 7的512²maps平均r／g／b約(189.7, 139.6, 83.4)、法線tilt²最大約0.0329。我實看了預覽：淺黃色起司底上有棕紅色圓片，圓片沿5×5格子排列，像圓點花紋，不太像真實披薩。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`invaders`（街機外星人）使目前目錄955→956種，含plain的gallery為957項。綠色LED點陣面板上的街機風格像素外星人：三列各一種造型（8×8、11×8、12×8像素），每列在一個42×33的LED格上重複3次；每顆LED是圓角方塊，未亮的LED保留暗綠色。seed只改變細grain，**圖樣固定**。造型是作者依一般街機外星人風格手寫的像素圖，**不保證與任何既有遊戲的圖案相同**，也沒有發光（emission）——亮度只是底色。

此材質是作者示意，沒有引用特定來源、遊戲截圖或美術資產，也沒有對照照片；三個像素圖、LED格數42×33、間距與0.3 m nominal tile皆作者設定。第一版relief 0.002時，512²maps的法線tilt²最大為0.197，我降到0.001後為0.0588。

新增專用sampler：建構時把三個sprite（字串陣列，放在`src/data/materials.ts`的preset）各置於14格寬的欄位中央並重複3次，排成42×33的0／1像素圖（每列間距11格、上方留1格）；用`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(7·(pattern − 0.5))`重新銳化；每顆LED以`cos²`在兩軸上切成圓角方塊（`0.5 + 0.5·tanh(14·(cos²(π·42·u) − 0.12))`乘以v向對應項，C∞，兩顆LED之間留縫）；顏色＝`0.04 + cell·(0.1 + 0.72·lit) + 0.06·glow·(1 − cell) + 0.02·(128²細grain − 0.5)`；height ＝ `0.8·cell + 0.2·grain`；亮處roughness降低0.2；cache合計42×33 + 128² = 17,770個Float64／142,160 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.001 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：color 0.0305–0.0307至0.8688–0.8691、亮處（color>0.5）占18.0%、平均0.2445、roughness 0.150–0.350、height至多0.9976–0.9987 relief；1,386個LED節點中426顆亮、其餘最亮0.1507、最暗亮顆0.8496，沒有節點落在0.3到0.5之間；seed 7的512²maps平均r／g／b約(41.2, 71.4, 35.4)、法線tilt²最大約0.0588。我實看了預覽：暗綠底上排列整齊的綠色像素外星人，LED格縫清楚，一眼就是復古街機。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`fairisle`（費爾島針織）使目前目錄954→955種，含plain的gallery為956項。北歐費爾島（Fair Isle）針織毛衣圖樣的示意：40×30針的針目，每針是一個斜向的V形針腳；圖樣由15列為一組的橫帶構成（實心帶、交替的小點帶、以及每8針重複、帶開孔中心的菱形圖案），單一深藍與淺灰兩色，細絨毛以160²雜訊表示。seed只改變細絨毛，**圖樣本身與seed無關**。不是真實針織的毛圈與紗線粗細變化、色線的浮線（floats）或不規則的針目張力，也只有深藍與淺灰兩色（單一暗→亮漸層）。

此材質是作者示意，沒有引用特定來源、費爾島圖樣圖譜或照片，也沒有對照照片；針目數40×30、圖樣的帶與菱形規則、色調、roughness 0.92與0.3 m nominal tile皆作者設定，不宣稱符合任何真實的費爾島圖樣。第一版relief 0.004時，512²maps的法線tilt²最大為0.335，我降到0.0015後為0.0668。

新增專用sampler：建構時以規則算出40×30的0／1針目圖（每個lattice node一針；`y % 15`為0、3、11、14是實心列，1與12是偶數針、2與13是奇數針，4至10是以`|x%8 − 3.5| + |y%15 − 7|`在(1.5, 3.5]內的菱形環），再用`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(7·(pattern − 0.5))`重新銳化，所以色彩邊緣在每一針內部維持C∞；針腳形狀＝`cos²`柱凸起`((0.5 + 0.5·cos(2π·40·u))^1.6)`乘以腿脊`0.5 + 0.5·cos(2π·(30·v + 0.22·sin(2π·40·u)))`，相位隨欄位位置傾斜而成V形；顏色＝`(0.22 + 0.6·yarn)·(0.78 + 0.22·ridge) + 0.05·(fuzz − 0.5)`；height ＝ `0.8·ridge + 0.2·fuzz`；roughness恆為0.92；金屬factor為0；cache合計40×30 + 160² = 26,800個Float64／214,400 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0015 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：color 0.1472–0.1477至0.8426–0.8430、深色（color<0.4）占37.5%、全圖平均0.4862–0.4863、height至多0.9938–0.9975 relief；每個針目節點的顏色與規則一致（1,200針中720針淺色、480針深色、沒有節點落在0.4到0.6之間）；seed 7的512²maps平均r／g／b約(129.1, 132.3, 144.0)、法線tilt²最大約0.0668。我實看了預覽：深藍菱形與小點橫帶，淺灰底上有細小的針腳，一眼就像北歐針織圖樣，但是針腳是均勻的重複，沒有真實紗線的不規則。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`mackerel`（鯖魚）使目前目錄953→954種，含plain的gallery為955項。藍綠色魚背上被切斷、彎曲的深藍色波浪帶，沿v方向堆疊（v方向的明暗轉換次數約為u方向的2.5倍），帶的形狀被慢雜訊扭曲而不規則，雜訊閘門讓部分帶斷開或淡出；帶處roughness略高，魚鱗以細grain表示。不是真實鯖魚的銀白腹部、背腹漸層、魚鱗、虹彩光澤或帶的錐形收尾，預覽比較像波浪或虎斑條紋而不是魚皮。

此材質是作者示意，沒有引用特定來源、魚類照片或量測，也沒有對照照片；12條帶、3個整數週期的正弦、雜訊扭曲量0.9、斷帶門檻、藍綠色調與0.3 m nominal tile皆作者設定與調整，不宣稱符合任何魚種。預覽第一版（14條帶、6個週期、扭曲0.55）太規則、像水波；我加大扭曲到1.3，結果過度扭曲而出現模糊的深色塊，再退到0.9，仍然偏波浪／虎斑而不像魚皮。

新增專用sampler：相位＝`12·v + 0.3·sin(2π·3·u) + 0.9·(7×7雜訊 − 0.5)`（整數條帶與整數週期的正弦加週期雜訊，因此維持週期）；帶＝`0.5 + 0.5·tanh(4·(cos(2π·phase) − 0.25)/0.75)`（C∞）乘以斷帶閘門`0.5 + 0.5·tanh(12·(11×11雜訊 − 0.4))`；顏色＝`0.66 + 0.1·(7×7雜訊 − 0.5) + 0.06·(110²鱗grain − 0.5) − 0.52·band`；height ＝ `0.4·band + 0.6·scale`；帶處roughness增加0.12；cache合計7²＋11²＋7²＋110² = 12,319個Float64／98,552 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7）：帶（color<0.35）占23.8%–27.1%（512²取樣）、color 0.0776–0.0825至0.7334–0.7354、全圖平均0.510–0.524、roughness 0.30–0.42、height至多0.9964–0.9986 relief；seed 0與1的帶遮罩34.9%像素不同；seed 7的512²maps平均r／g／b約(96.0, 120.1, 134.6)、法線tilt²最大約0.0155。我實看了預覽：藍灰色底上的深藍波浪斷帶，像水波紋或虎斑，不像魚皮。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`hestain`（H&E染色組織）使目前目錄952→953種，含plain的gallery為954項。顯微鏡下H&E（蘇木精與伊紅）染色組織切片的示意：淺粉紫色、帶斑駁與沿v方向纖維紋的細胞質底色，上面分布著深紫色、橢圓的細胞核，核的位置與形狀來自週期Gray-Scott反應擴散的斑點區（高門檻只留核心），核外有一圈極淡的亮緣。不是真實的組織學結構：沒有細胞膜、細胞核內的染色質結構、細胞類型差異、血管或組織層次，細胞核分布也比真實組織均勻，且由於單一暗→亮漸層，細胞質偏薰衣草紫而不是伊紅的粉紅色。

此材質是作者示意，沒有引用特定來源、組織學圖譜或量測，也沒有對照照片；反應擴散參數與`cheetahfur`相同（feed 0.04、kill 0.065、6000步、96×96格），核門檻0.6（比cheetahfur的0.5高，所以核較小）、銳度、亮緣、紫粉色調、0.05 m nominal tile皆作者設定與調整，不宣稱符合任何實際組織。預覽第一版細胞質偏暗的薰衣草色（0.72），我把基調提高到0.8並降低亮緣到0.04（也為了讓色調總和不超出[0, 1]），仍然是薰衣草紫而不是粉紅，這是單一漸層的限制。

沿用`latticeField`與`grayScott`，專用sampler用`nucleus = 0.5 + 0.5·tanh(12·(pattern − level))`取平滑核遮罩（level = 0.6 ± 0.1隨5×5慢雜訊移動），亮緣是較低iso-level附近的薄帶`exp(−((pattern − level + 0.14)/0.1)²)·(1 − nucleus)`（C∞）；顏色＝`0.8 + 0.14·(14×14雜訊 − 0.5) + 0.1·(110×26纖維雜訊 − 0.5) − 0.62·nucleus + 0.04·halo + 0.03·(128²細grain − 0.5)`；height ＝ `0.6·nucleus + 0.4·grain`；核處roughness增加0.1；cache合計96²＋7²＋5²＋14²＋110×26＋128² = 28,730個Float64／229,840 B lattice算術預算（非總RAM；建構時另有約294,912 B暫存，結束後只保留v）。預設0.05 m nominal tile與0.0008 UV-relative relief（非公尺位移）。模擬成本：本機bun量測每個sampler建構約190–296 ms、512² maps約281 ms（單次量測，非benchmark）。

`petricolonies`（培養皿菌落）使目前目錄951→952種，含plain的gallery為953項。琥珀色瓊脂（agar）平面上散布奶油色的圓形菌落，菌落位置與形狀來自週期Gray-Scott反應擴散的斑點區，大小有變化；菌落邊緣有一圈略深的細緣，菌落中央略高（height與roughness都隨菌落變化），瓊脂表面有細grain。不是真實培養皿的圓形邊框、菌落的黏液光澤、菌落內的同心結構、氣泡或透明度，預覽只有單一琥珀到奶油色的漸層。

此材質是作者示意，沒有引用特定來源、微生物照片或量測，也沒有對照照片；反應擴散參數與`cheetahfur`相同（feed 0.04、kill 0.065、6000步、96×96格），門檻、銳度、緣寬、琥珀與奶油色調、roughness、0.12 m nominal tile皆作者設定與調整，不宣稱符合任何實際菌種。預覽第一版的緣幾乎看不見，我把緣寬由0.07加到0.12、緣色深度由0.2加到0.4，並把菌落大小變化由0.3加到0.5後採用；調整以我對預覽的主觀判斷為準。

沿用`latticeField`與`grayScott`，專用sampler用`fill = 0.5 + 0.5·tanh(9·(pattern − level))`取平滑菌落遮罩（level = 0.5 ± 0.25隨5×5慢雜訊移動，所以菌落大小不同），緣是同一iso-level附近的薄帶`exp(−((pattern − level)/0.12)²)·(1 − fill)`（C∞，只在菌落外側）；顏色＝`0.42 + 0.42·fill − 0.4·rim + 0.04·(128²細grain − 0.5)`；height ＝ `0.8·fill·pattern + 0.2·grain`，菌落中央（pattern大）較高；菌落處roughness增加0.4；cache合計96²＋7²＋5²＋128² = 25,674個Float64／205,392 B lattice算術預算（非總RAM；建構時另有約294,912 B暫存，結束後只保留v）。預設0.12 m nominal tile與0.0015 UV-relative relief（非公尺位移；第一版0.003時512²maps的法線tilt²最大達0.117，降到0.0015後約0.0314）。模擬成本：本機bun量測每個sampler建構約190–309 ms、512² maps約270–304 ms（單次量測，非benchmark）。

`turingmaze`（圖靈迷宮）使目前目錄950→951種，含plain的gallery為952項。白色紙面上的深色墨跡迷宮：彎曲、分岔、部分封閉的粗條紋，由週期Gray-Scott反應擴散在「迷宮（labyrinth）」參數下產生，墨跡的粗細與濃淡隨慢雜訊略為變化，紙面有細grain。墨跡在測試的seed上形成單一連通網路。這是反應擴散的條紋圖案，**不是指紋**（指紋的脊線間距細得多，且有螺旋與分叉結構），也不是真實印刷或墨水；預覽只有單一墨色到紙色的漸層。

此材質是作者示意，沒有引用特定來源或對照照片；反應擴散參數（feed 0.03、kill 0.057、6000步、96×96格）、門檻與銳度、warp量、墨與紙的色調、0.3 m nominal tile皆作者設定與調整，不宣稱符合任何實際物件。我先嘗試命名為指紋（fingerprint），預覽後發現條紋間距約為其五到十倍、也沒有螺旋，所以改名為`turingmaze`。

沿用`cheetahfur`新增的共用helper `latticeField`與`grayScott`，專用sampler把同一個週期pattern在輕微noise扭曲（±0.025 UV）後的位置，用`0.5 + 0.5·tanh(9·(pattern − level))`取平滑條紋遮罩（level = 0.5 ± 0.12隨7×7慢雜訊移動），墨濃度＝條紋×(0.82 + 0.18·7×7雜訊)，顏色＝`0.94 − 0.86·ink + 0.05·(160²細grain − 0.5)`；cache合計96²＋5²＋7²＋7²＋160² = 34,939個Float64／279,512 B lattice算術預算（非總RAM；建構時另有約294,912 B暫存，結束後只保留v）。height ≈ 0.7×條紋＋0.3×grain；墨處roughness降低最多0.15。預設0.3 m nominal tile與0.0012 UV-relative relief（非公尺位移）。迷宮參數在我掃描的12個seed上穩定（未正規化v最大值0.32–0.35、邊界密度一致），但不保證任意seed穩定。模擬成本：本機bun量測每個sampler建構約192–252 ms、512² maps約293 ms（單次量測，非benchmark）。

`cheetahfur`（獵豹毛皮）使目前目錄949→950種，含plain的gallery為951項。黃褐色短毛皮上分布著黑色的橢圓斑點，斑點的位置、大小與形狀來自週期Gray-Scott反應擴散（reaction-diffusion）模擬，因此是不規則但間距相近的自然斑點，而非隨機圓點或固定格點；毛皮沿v方向有細纖維紋，斑處roughness略高。不是真實獵豹的毛色漸層、斑點外圍的淺色暈、腹部白毛或毛的方向性，預覽只有單一黃褐色與黑色兩段漸層。

此材質是作者依一般獵豹斑紋外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；反應擴散參數（feed 0.04、kill 0.065、6000步、96×96格）、斑的門檻與銳度、warp量、毛色與斑色、0.25 m nominal tile皆作者設定與調整，不宣稱符合任何實際獵豹。反應擴散是這個引擎第一次在建立sampler時執行模擬，其他材質仍是純函數式雜訊。

新增專用sampler與兩個共用helper：`latticeField(values, nx, ny)`是週期lattice取樣器（與既有`cachedNoise`相同的smoothstep混合，C1，`cachedNoise`改為呼叫它）；`grayScott(size, seedCells, feed, kill, steps, seed)`在週期size×size格上執行Gray-Scott（Du 0.2097、Dv 0.105、dt 1，只用加減乘，沒有超越函數，所以位元結果與引擎無關），初始擾動是每個`seedCells×seedCells`抖動格一個3×3區塊（讓任一seed都不會一開始就形成長條），輸出把抑制劑濃度正規化到[0, 1]。取樣時以`warpField`稍微扭曲（±0.015 UV）後查詢pattern，用`0.5 + 0.5·tanh(7·(pattern − level))`取平滑斑點遮罩（level = 0.5 ± 0.1隨5×5慢雜訊移動，所以斑點大小略有差異），毛色＝`0.86·(1 − spot) + 0.05·spot`加沿v方向拉長的200×28纖維雜訊與128²細grain；cache合計96²＋6²＋5²＋200×28＋128² = 31,261個Float64／250,088 B lattice算術預算（非總RAM；建構時另有u、v、nextU、nextV四個96²暫存陣列，約294,912 B，結束後只保留v）。模擬成本：本機bun量測每個sampler建構約169–176 ms、512² maps約271 ms（單次量測，非benchmark）。預設0.25 m nominal tile與0.0015 UV-relative relief（非公尺位移）。

`jade`（軟玉）使目前目錄948→949種，含plain的gallery為950項。拋光的綠色軟玉（nephrite）表面：中綠色的雲霧狀濃淡底色（寬雲加細雲），上面是淡綠色的脈紋（沿雜訊場的等值線，形成封閉或蜿蜒的曲線）與更細的髮絲狀淡脈；表面光滑（roughness低），脈處略粗。不是真實玉石的半透明、內部光散射、棉絮狀雜質、橙色皮殼或真實的脈絡分布，預覽比較像沿等值線繪成的大理石紋。

此材質是作者依一般拋光軟玉外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；各雜訊場的格數、雲霧濃淡的權重、脈紋的等值線位置與寬度、深綠與淺綠的色調、roughness與0.15 m nominal tile皆作者設定，不宣稱符合任何實際玉料。

新增專用sampler：雲霧 = `0.7·cloud(5×5) + 0.3·fine(18×18)`的週期雜訊；脈紋是雜訊場等值線附近的薄帶`exp(−((n − c)/w)²)`（C∞；若用`|n − c|`的脊狀則不是C1），`n`為7×7雜訊、`c = 0.5`、`w = 0.045`，另有13×13雜訊、`c = 0.45`、`w = 0.03`的髮絲脈，兩者以聯集`1 − Π(1 − x)`合併；底色另有128²細grain；cache合計25＋324＋49＋169＋16,384 = 16,951個Float64／135,608 B lattice算術預算（非總RAM）。顏色是顏料，height約0.5 relief×雲霧＋0.2×脈＋0.3×grain；脈處roughness升高0.06；金屬factor為0、無mortar、AO 1。預設0.15 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color>0.6的淡脈占2.3–4.9%（隨seed差異大），color 0.201–0.768，全圖平均0.376–0.399，roughness 0.20–0.26，height至多0.859–0.902 relief；seed 0與1的脈遮罩有8.5%像素不同；seed 7的512²maps平均r／g／b約(77, 115, 87)、法線tilt²最大約0.0057。我實看了預覽：中綠色的雲霧底上有淡綠色的等值線脈，像大理石紋的綠色石材；脈線的走向（封閉曲線與直角轉折）比真實玉石的脈絡規則、不自然，而且完全沒有半透明感。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`spectrogram`（頻譜圖）使目前目錄947→948種，含plain的gallery為949項。深藍底的聲音頻譜圖風格：12條被顫音（vibrato）彎成波浪的黃色諧波水平線、5條垂直的寬頻爆發亮帶、散布的雜訊斑點，並由一個時間—頻率能量場決定哪裡顯示（局部暗淡）。不是真實音訊的頻譜、真實的諧波比例、時間／頻率刻度、色階圖例或文字；所有諧波使用相同的顫音幅度（真實聲音的高次諧波波動較大），顏色是單一暗藍到亮黃的線性漸層而非真實頻譜圖常見的多色色階。

此材質是作者依一般頻譜圖（spectrogram）外觀所作示意，沒有引用特定來源文件、照片、音訊資料或量測，也沒有對照任何實際頻譜圖；諧波數（12）、顫音幅度與次數、漂移量、能量場解析度與門檻、爆發數與權重、暗藍與亮黃的色調、roughness與0.3 m nominal tile皆作者設定。

新增專用sampler：諧波線是整數條（12條）的`exp(−sin²(π·12·(v − 偏移))/w²)`（C∞，隨tile wrap），偏移 = `(0.2·sin(2π·6·u) + 0.18·(drift(u) − 0.5))/12`（顫音加一個8×2週期雜訊的緩慢漂移）；爆發是整數條（5條）垂直的`exp(−sin²(π·5·u)/w²)`；散斑是96×96的週期雜訊；三者都乘上20×14能量場經`0.5 + 0.5·tanh(5·(雜訊 − 0.35))`得到的平滑閘門，並以聯集`1 − Π(1 − x)`合併，使強度保持在[0, 1]；cache合計16＋280＋9,216＋16,384 = 25,896個Float64／207,168 B lattice算術預算（非總RAM）。顏色是強度對應的顏料（0.04＋0.9×強度），height約0.6 relief×強度＋0.4 relief×紙grain；roughness恆為0.4；金屬factor為0、無mortar、AO 1。預設0.3 m nominal tile與0.002 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color>0.5的亮線占6.31–6.76%，color 0.0400–0.939，全圖平均0.155–0.161，height至多0.971–0.982 relief；諧波線位置依顫音變化（在顫音正峰處偏移約+0.2個間距、負峰處約−0.2個間距，測試以每個seed驗證，容差含漂移的上限0.09）；seed 0與1的亮區遮罩（color>0.2）有超過5%像素不同；seed 7的512²maps平均r／g／b約(50, 41, 67)、r>128占7.0%、法線tilt²最大約0.092。我實看了預覽：深藍底上整齊的黃色波浪線與垂直亮帶，像風格化的頻譜圖，但太規則（所有諧波同相彎曲、等距）。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`barchart`（長條圖紙）使目前目錄946→947種，含plain的gallery為948項。淡藍灰色圖表紙：每tile 2張圖表（上下排列），每張有12根深海軍藍的長條（高度各自隨機，為繪圖區高度的15–95%，頂端略淡的漸層）、4條橫向的淡灰格線與一條較深的基線。不是真實圖表的座標軸刻度、數字標籤、圖例、標題或多系列資料。

此材質是作者依一般長條圖外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；圖表數與長條數（2張×12根）、長條寬度、高度範圍、格線數與寬度、繪圖區邊界、海軍藍與紙色的色調、roughness與0.25 m nominal tile皆作者設定，不宣稱符合任何實際圖表。

新增專用sampler：每根長條是平滑方盒——寬度項`smooth(clamp((0.34 − |dx|)/0.03))`、頂端項與基線項各一個`smooth(clamp(…/0.03))`，完全留在自己的欄內（半寬0.34 < 0.5）；格線是繪圖區內`exp(−sin²(π·步數)/w²)`（C∞，並以繪圖區遮罩限制在繪圖區內），基線是`exp(−d²/w²)`；長條頂端高度由逐欄雜湊決定；全部以凸組合混合；cache合計24＋16,384 = 16,408個Float64／131,264 B lattice算術預算（非總RAM）。顏色是顏料，長條與基線height約0.6 relief＋紙grain 0.4 relief、長條處roughness降低0.08；金屬factor為0、無mortar、AO 1。預設0.25 m nominal tile與0.0012 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color<0.3的長條占25.1–29.4%，color>0.85的紙面占65.0–69.4%，color 0.025–0.970，全圖平均0.695–0.730，roughness 0.54–0.62，height至多0.994–0.999 relief；從欄中心向下掃描找到的24根長條高度占繪圖區的13–91%，且彼此高低差大於0.5；seed 0與1的長條高度平均差約0.22；seed 7的512²maps平均r／g／b約(182, 189, 206)、r<110占26.6%、法線tilt²最大約0.061。我實看了預覽：整齊的深藍長條與淡灰格線，像圖表紙，但沒有刻度與文字。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`ecgpaper`（心電圖紙）使目前目錄945→946種，含plain的gallery為947項。淡粉紅色醫療記錄紙：每tile 40×40格的細格線（每5格一條較粗的粗格線，共8×8大格），3條橫向的記錄帶，每帶重複6個心跳波形（P、Q、R、S、T波，各心跳振幅有±18%的差異），以深褐紅色細線描繪在各帶的基線上。不是真實心電圖的導程標示、校準方波、時間刻度、病理波形或列印文字；波形是示意的簡化曲線（T波的頂部偏平）。

此材質是作者依一般心電圖記錄紙外觀所作示意，沒有引用特定來源文件、照片、醫學標準或量測，也沒有對照照片；格數（每tile 40×40、粗格每5格）、記錄帶數與心跳數（3帶×6拍）、各波形的位置與幅度、線寬、粉紅紙色與暗紅墨色、roughness與0.3 m nominal tile皆作者設定，不宣稱符合任何實際心電圖紙或可作醫療用途。

新增專用sampler：細格與粗格各是每個方向一組整數線數的`exp(−sin²(π·n·s)/w²)`（C∞，隨tile wrap），兩個方向以聯集`1 − Π(1 − x)`合併；每一帶的心跳由P、Q、R、S、T五個緊支撐凸起組成——`a·smooth(1 − ((x − c)/s)²)`在`|x − c| ≥ s`時恰好為零且為C1，因此每一拍在自己的兩端精確歸零，各拍不同的振幅不會在拍與拍之間留下階梯（我最初用高斯，其尾端不是精確的零，使取樣在拍界產生約10⁻¹²的跳變，被C1測試放大成約0.038而失敗）；描線是寬0.0035的`exp(−d²/w²)`，`d = dy / √(1 + 斜率²)`為到曲線的一階距離，使陡峭的筆畫仍有相近的粗細，並以兩個C1視窗限制在曲線可到達的垂直範圍與自己的記錄帶內；格線與紙grain合成後以凸組合混入墨色；cache合計18＋16,384 = 16,402個Float64／131,216 B lattice算術預算（非總RAM）。顏色是顏料，墨線height約0.6 relief＋紙grain 0.4 relief、墨處roughness降低0.1；金屬factor為0、無mortar、AO 1。預設0.3 m nominal tile與0.0012 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color<0.3的墨線占3.23–3.27%（seed 7為3.13%），color>0.85的紙面占73.8–73.9%，color 0.05–0.955，全圖平均0.859–0.860，roughness 0.60–0.70，height至多0.983–0.992 relief；每一條記錄帶的基線處與每一拍R波頂端皆為墨色（測試逐拍驗證，3帶×6拍）；seed 0與1的墨色遮罩只有0.75%像素不同（只有逐拍振幅與紙grain隨seed變）；seed 7的512²maps平均r／g／b約(228, 206, 206)、r<110占2.9%、法線tilt²最大約0.061。我實看了預覽：粉紅格紙上三條重複的心跳描線，整體像心電圖紙；但R波偏矮、T波頂部偏平，不像真實波形。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`redalder`（紅赤楊／北美西部赤楊）使目前目錄944→945種，含plain的gallery為946項。近似Alnus rubra未塗裝縱向木面：淡黃褐到略帶紅的均勻底色、細而均勻的質地、2條很淡的暗帶、縱向纖維與極少量（約0.15%）的細暗短痕（對應偶爾出現的聚合木射線）。不是邊材與心材的區別、聚合木射線的寬大條紋、節疤、波浪紋或塗層。

外觀依據實際閱讀的[Wood Database Red Alder](https://www.wood-database.com/red-alder/)（Color／Appearance：淡黃褐到略帶紅的褐色，隨時間變深變紅，邊材與心材無明顯差別，偶爾有聚合木射線形成的小條紋；Grain／Texture：紋理通常平直、質地中等偏細而均勻；Endgrain：散孔材，導管小到中等且很多）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/alnus-rubra.jpg)（淡黃褐的均勻面、極淡的縱向色變、零星細小的暗色短痕）；僅作配色與紋理形態參考，**不**重現聚合木射線的寬大條紋、節疤或波浪紋，不打包來源圖，也不由照片反推真色、roughness或實際尺寸；導管（散孔、很多）在本材質中因為過小而不可見，只以少量暗痕代表偶爾可見的木射線。

直接fallthrough重用既有Padauk／Bloodwood系細長橢圓導管sampler（與`blackwalnut`、`teak`、`honduranmahogany`、`shagbarkhickory`、`eastindianrosewood`、`bubinga`、`jarrah`、`merbau`同路徑），constructor只選preset：36×12個導管site（pose表13,824 B）、2條起伏（bandWarp 0.8）且對比很低（bandContrast 0.1）的暗帶、220×9縱向fiber、128²細grain與固定3×4 warp，共20,104個Float64／160,832 B lattice算術預算（非總RAM）。金屬factor為0；暗痕是真的height凹陷，色紋只是顏料。預設0.18 m nominal tile與0.002 UV-relative relief（非公尺位移）皆作者設定。因為共用sampler的本體色被限制在palette的約0.25–0.46處，我把palette選成較亮的暖褐（dark (178, 124, 80)／light (246, 204, 150)）才讓本體色接近照片的淡黃褐。實測（工具實跑，三seed 0／1／0xffffffff、256²取樣）：暗痕（AO<0.9）占0.12–0.15%，無凹陷的本體占99.8%，本體色0.254–0.459，橫／縱色差比9.98–10.64，roughness 0.50–0.602、height 0.45–0.503 relief、最低AO 0.75；seed 7的512²maps平均r／g／b約(204, 155, 107)、AO<230占0.147%、法線tilt²最大約0.0008。我實看了預覽：淡黃褐的均勻面、極淡的暗帶與零星細暗痕，與照片的整體色調與均勻感相近；照片更細緻、更偏橙黃（照片肉眼估計約(215, 170, 120)，這只是目視估計，不是量測）。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`sherpafleece`（雪帕／泰迪絨刷毛布）使目前目錄943→944種，含plain的gallery為945項。奶油白的捲曲絨毛布面：大量任意旋轉、邊緣不規則的奶油色團塊彼此疊成蓬鬆的捲簇，簇間偶有受遮蔽的淺褐色縫（約1%），每個團塊帶有各自的明暗與穹頂高光。不是真實刷毛布的纖維、捲曲的立體感、織底或毛向，預覽比較像凹凸的奶油色碎屑或爆米花，只是勉強近似。

此材質是作者依一般雪帕刷毛布外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；兩層團塊的格數、機率、大小、長寬比、邊緣雜訊、色調、roughness與0.15 m nominal tile皆作者設定，不宣稱符合任何實際織物。

直接fallthrough重用既有`granola`的兩層旋轉橢圓塊sampler（constructor只選preset，不新增sampler）：大團塊（12×12格，機率1，半軸0.7–1.1格×0.55–1.45長寬比）與小團塊（24×24格，機率0.7，半軸0.45–0.85格）各自在格內抖動±0.5並帶任意旋轉角，每個像素依固定順序合成5×5鄰格（這個preset的團塊最遠可延伸約1.8格，3×3視窗會把它們切斷，這正是我後來把共用sampler擴大為5×5的原因）——`value = value·(1 − m) + 塊值·m`，遮罩`m = smooth(clamp((1 − q)/0.6))`，`q`乘上64×64週期雜訊的邊緣擾動——先合成大團塊、再合成小團塊，所有項皆為C1；沒被蓋住的部分顏色為底色0.3、AO降到0.4；cache合計1,008＋4,032＋4,096＋16,384 = 25,520個Float64／204,160 B lattice算術預算（非總RAM）。顏色是顏料，穹頂height約0.85 relief＋grain 0.15 relief；金屬factor為0、無mortar。預設0.15 m nominal tile與0.012 UV-relative relief（非公尺位移）。這個preset我調整過兩次：第一版（22×22格、較小的團塊）像粗砂或碎屑；第二版放大團塊後較像蓬鬆的絨團才採用；另外第一版色調使color最高達1.01（超出[0,1]），把大小團塊色調降為0.52／0.58、穹頂0.2後最高才回到0.93。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color>0.7的亮簇占38.8–41.3%，縫隙地（AO<0.45）占0.92–1.72%，color 0.234–0.931，全圖平均0.659–0.670，縫隙地平均0.296，roughness恆為0.92，最低AO 0.4，height至多0.996–0.998 relief；seed 0與1的亮簇遮罩有48.2%像素不同；seed 7的512²maps平均r／g／b約(203, 191, 174)、AO<200占5.2%、法線tilt²最大約0.788。我實看了預覽：奶油色的蓬鬆團塊堆疊而成，但不像真實刷毛布的纖維。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`tilledsoil`（翻耕土壤）使目前目錄942→943種，含plain的gallery為944項。深褐色土壤表面：任意旋轉、邊緣不規則的土塊（中褐色，彼此可重疊，約占六成），間隙處是更深而受遮蔽的細土，並散布少量（約7–9%）較小的淺色卵石或砂礫。不是真實土壤的根系、蟲孔、濕度光澤、植物殘體或粒徑分布，預覽也容易被看成迷彩圖樣。

此材質是作者依一般翻耕後土壤外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；土塊與卵石兩層的格數、機率、大小、長寬比、邊緣雜訊、各層色調、roughness與0.4 m nominal tile皆作者設定，不宣稱符合任何實際土質。

直接fallthrough重用既有`granola`的兩層旋轉橢圓塊sampler（constructor只選preset，不新增sampler）：土塊（8×8格，機率1，半軸0.34–0.62格×0.7–1.3長寬比）與淺色卵石（16×16格，機率0.3，半軸0.1–0.22格）各自在格內抖動±0.45並帶任意旋轉角，每個像素依固定順序合成5×5鄰格（最大的塊在最大長寬比與最大邊緣擾動下可能越過自己的格超過一格，3×3視窗會把它切斷）——`value = value·(1 − m) + 塊值·m`，遮罩`m = smooth(clamp((1 − q)/0.4))`，`q`乘上48×48週期雜訊的邊緣擾動——先合成土塊、再合成卵石，所有項皆為C1；沒被任何塊蓋住的部分顏色為底色0.14、AO降到0.45；cache合計448＋1,792＋2,304＋16,384 = 20,928個Float64／167,424 B lattice算術預算（非總RAM）。顏色是顏料，穹頂height約0.8 relief＋grain 0.2 relief；金屬factor為0、無mortar。預設0.4 m nominal tile與0.012 UV-relative relief（非公尺位移）。我在寫這個preset時，第一版把卵石色調設為0.78，探測發現color最高到1.03（超出[0,1]），把卵石色調降為0.66±0.08後才符合範圍。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：土塊間的縫隙地（AO<0.46）占35.9–41.8%（seed 7為42.0%），color>0.5的淺色卵石占6.8–9.4%，color 0.094–0.899，全圖平均0.270–0.288，縫隙地平均0.140，roughness恆為0.92，最低AO 0.45，height至多0.994–0.997 relief；seed 0與1的覆蓋遮罩有43.7%像素不同；seed 7的512²maps平均r／g／b約(62, 47, 35)、AO<200占50.9%、法線tilt²最大約0.894。我實看了預覽：深褐的縫隙上疊著較亮的褐色土塊與小卵石，像鬆散的土壤，但相當像迷彩，且遠比真實土壤平坦。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`heatsinkfins`（散熱鰭片）使目前目錄941→942種，含plain的gallery為943項。陽極處理的擠型鋁散熱片：每tile 20片沿u方向排列的鰭片，鰭頂平坦而明亮、鰭間是深而受遮蔽的窄縫（寬度與鰭頂約相同），鰭頂沿v方向有細微的擠型線、極淡的陽極處理斑駁與細grain；整面金屬（metallic為1）。不是真實散熱片的鰭片高度與厚度、基板、導熱管、扣具或切削毛邊。

此材質是作者依一般擠型鋁散熱片外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；鰭片數（每tile 20）、鰭頂與縫的比例與銳度、金屬色調、擠型線與斑駁強度、roughness與0.1 m nominal tile皆作者設定，不宣稱符合任何實際散熱片的規格。

新增專用sampler：鰭片 = `0.5 + 0.5·tanh(3.5·sin(2π·20·u))`（`tanh`的正弦是平滑方波，C∞；整數鰭數隨tile wrap），鰭頂mask使顏色在縫色0.14與鰭色0.7之間混合；鰭頂另有4×160沿v方向拉長的擠型線雜訊（只作用於鰭頂）、4×4的陽極處理斑駁與128²細grain；縫處roughness升高0.2、AO降到0.5；cache合計640＋16＋16,384 = 17,040個Float64／136,320 B lattice算術預算（非總RAM）。`metallic`在整個取樣範圍為1，並已加入`ProceduralMaterial`的金屬factor清單與測試的非金屬例外清單。顏色是金屬的反射色，鰭頂height約0.8 relief、擠型線0.1、grain 0.1；無mortar。預設0.1 m nominal tile與0.01 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color>0.5的鰭頂占47.1–47.3%、color<0.25的縫占43.4–43.7%，AO<0.9的區域固定為56.25%（與seed無關），color 0.099–0.777，全圖平均0.416–0.421，roughness 0.38–0.58，最低AO 0.50，metallic恆為1，height至多0.988–0.992 relief；在鰭頂上沿u方向（跨鰭）的逐像素色差約為沿v方向（擠型線）的4.9–5.3倍；seed 7的512²maps平均r／g／b約(76, 79, 86)、metallic通道平均255、法線tilt²最大約0.716。我實看了四格預覽：整齊的直條鰭片與深縫，像擠型鋁散熱片，但太簡化（沒有鰭片的高度、倒角與基板）。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`jerky`（牛肉乾）使目前目錄940→941種，含plain的gallery為942項。風乾牛肉條表面：深紅褐色底上沿u方向延伸的細密肌纖維、沿同方向的寬低頻色調變化、逐處變化的光澤（roughness）與零星的近黑胡椒碎粒。不是真實肉乾的皺縮輪廓、脂肪粒、鹽結晶或油亮度，預覽也容易被看成髮絲拋光的深色木紋。

此材質是作者依一般牛肉乾外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；纖維與色調雜訊的格數、胡椒密度與大小、紅褐色調、roughness與0.12 m nominal tile皆作者設定，不宣稱符合任何實際肉乾。

新增專用sampler：14×240的纖維雜訊（沿u方向拉長）、4×8的寬低頻色調雜訊、6×36的光澤雜訊（roughness ± 0.1）與128²細grain；胡椒碎粒是36×36格、約14%機率、半徑0.22格、中心抖動0.26的`smooth(1 − q)`圓點（半徑加抖動小於半格，完全留在自己的格內），並以**乘法**壓暗肉色（`color = 肉色 × (1 − 0.85·胡椒)`）；cache合計2,592＋3,360＋216＋32＋16,384 = 22,584個Float64（180,672 B）＋1,296 B Uint8的胡椒存在表 = 181,968 B lattice算術預算（非總RAM）。顏色是顏料，height以纖維0.45 relief、胡椒0.15、grain 0.4組成；金屬factor為0、無mortar、AO 1。預設0.12 m nominal tile與0.004 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color<0.14的近黑胡椒占0.84–0.95%，color 0.020–0.562，全圖平均0.336–0.343，roughness 0.40–0.60，height至多0.970–0.979 relief；沿v方向的逐像素色差約為沿u方向的7.3–7.5倍（纖維沿u拉長）；seed 0與1沿一條水平線取樣的色差平均約0.127；seed 7的512²maps平均r／g／b約(73, 39, 24)、法線tilt²最大約0.297。我實看了預覽：深紅褐色的水平纖維與細小黑點，像牛肉乾也像髮絲拋光的暗色木紋，缺乏真實肉乾的形狀與起伏。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`garlicskin`（蒜皮）使目前目錄939→940種，含plain的gallery為941項。大蒜外皮：奶油白的紙質底上，約11條沿v方向延伸、被低頻雜訊扭曲且寬窄隨位置變化的淡紫色縱向條紋（實測占36–40%），帶縱向纖維、柔和皺褶與細grain；條紋處略凹且較光滑。不是真實蒜皮的剝離邊緣、破損、泥土、蒜瓣輪廓或半透明感，預覽看起來比較像波浪紫條紋紙，而不太像蒜皮。

此材質是作者依一般大蒜外皮外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；條紋數（每tile 11）、扭曲與寬度變化量、紫色門檻與濃度、纖維與皺褶強度、紙白與紫色的色調、roughness與0.1 m nominal tile皆作者設定，不宣稱符合任何真實蒜種。

新增專用sampler：相位 = `11·u + 0.9·(warp(u, v) − 0.5)`（`warp`為4×6週期雜訊），紫色權重 = `0.5 + 0.5·tanh(2.5·(sin(2π·相位) − 0.35 − 1.1·(width(u, v) − 0.5)))`（`tanh`的正弦是平滑方波，C∞；`width`為5×12週期雜訊使條紋寬窄與出現位置平滑變化；整數條紋數隨tile wrap）；紙質另有220×10沿v方向的纖維雜訊、24×40的柔和皺褶雜訊與128²細grain；cache合計24＋60＋2,200＋960＋16,384 = 19,628個Float64／157,024 B lattice算術預算（非總RAM）。顏色是顏料，紫色使color降低0.4，條紋脊的height約0.35 relief、皺褶0.35、纖維0.15、grain 0.15，紫色處roughness降低0.1；金屬factor為0、無mortar、AO 1。預設0.1 m nominal tile與0.003 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color<0.7的紫色條紋區占36.0–40.3%，color>0.82的紙面占51.0–54.9%，color 0.467–0.978，全圖平均0.756–0.774，roughness 0.45–0.55，height至多0.917–0.939 relief；在紙面上沿u方向的逐像素色差約為沿v方向的3.9–4.5倍；seed 0與1的條紋遮罩有39.4%像素不同；seed 7的512²maps平均r／g／b約(213, 196, 201)、法線tilt²最大約0.038。我實看了預覽：淡紫色波浪縱條紋疊在奶油白紙面上，但太規則而像條紋紙，不太像真實蒜皮；我曾兩次調淡條紋濃度與覆蓋（第一版太像斑馬紋）仍只是勉強接近。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`pancake`（鬆餅／煎餅）使目前目錄938→939種，含plain的gallery為940項。煎餅表面：金黃色底上有低頻、邊緣帶蕾絲狀不規則的焦褐色斑塊（面積隨seed差異很大，約25–63%），散布著微小的氣孔凹洞；表面略粗糙。不是真實煎餅的邊緣、厚度、焦糖光澤、奶油或糖漿，也不是特定的鬆餅、可麗餅或薄餅。

此材質是作者依一般煎餅表面外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；兩層雜訊的格數與權重、焦褐色的門檻與銳度、氣孔密度與大小、金黃與焦褐的色調、roughness與0.25 m nominal tile皆作者設定，不宣稱符合任何實際煎餅。

新增專用sampler：焦褐程度 = `0.5 + 0.5·tanh(6·(0.5 − (0.65·broad + 0.35·fine)))`，`broad`為5×5、`fine`為22×22的週期低頻雜訊，`tanh`使斑塊邊緣平滑（C∞）而因細雜訊呈蕾絲狀；氣孔是30×30格、約55%機率、半徑0.14–0.28格、中心抖動±0.2的`smooth(1 − q)`凹洞（半徑加抖動小於半格，完全留在自己的格內）；另有128²細grain；cache合計25＋484＋16,384＋3×900 = 19,593個Float64／156,744 B lattice算術預算（非總RAM）。顏色是顏料，height以氣孔凹陷0.4 relief＋焦褐0.15＋grain 0.45組成，氣孔處roughness升高0.08、AO降到0.7；金屬factor為0、無mortar。預設0.25 m nominal tile與0.004 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color<0.45的焦褐區占24.7–63.4%、color>0.6的金黃區占18.3–44.3%（取決於低頻雜訊，seed差異很大），氣孔（AO<0.9）占4.84–5.15%，color 0.073–0.716，全圖平均0.428–0.544，roughness 0.62–0.70，最低AO 0.7，height至多0.983–0.990 relief；seed 0與1的焦褐遮罩有41.2%像素不同；seed 7的512²maps平均r／g／b約(161, 122, 73)、AO<230占4.87%、法線tilt²最大約0.325。我實看了預覽：金黃底上帶蕾絲邊的焦褐斑塊與小氣孔，像煎餅或可麗餅，但斑塊邊緣有明顯的方塊雜訊感（來自22×22格的細雜訊），且沒有真實煎餅的光澤與厚度。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`kawung`（卡翁紋巴迪克）使目前目錄937→938種，含plain的gallery為939項。深靛藍棉布上以蠟防染出的乳白色幾何紋：4×4個單元格，每格一個橢圓，偶數格長軸沿u、奇數格長軸沿v（棋盤式交錯），橢圓長到伸入鄰格而與鄰格的橢圓交疊，形成印尼卡翁（kawung）紋的四瓣交疊感；每個橢圓中心有一個小圓點。不是真實卡翁紋的精確幾何與比例（本材質是簡化示意）、手繪蠟線的粗細起伏、蠟裂紋或染色滲開。

此材質是作者依一般卡翁紋巴迪克外觀所作的簡化示意，沒有引用特定來源文件、照片或量測，也沒有對照照片或圖譜；格數（每tile 4×4）、橢圓長短半軸（0.72／0.30格）、線寬、圓點大小、靛藍與蠟的色調、roughness與0.3 m nominal tile皆作者設定，不宣稱符合任何真實卡翁紋的規格。

新增專用sampler：每個像素合成3×3鄰格的橢圓——每格一個橢圓，`(col + row)`為偶數時長軸沿u、奇數時沿v（格數為偶數，所以棋盤隨tile wrap），環線 = `smooth(clamp(1 − ((q − 1)/0.14)²))`（`q`為橢圓式，緊支撐且為C1），中心圓點為`smooth(1 − q)`，全部以聯集`1 − Π(1 − x)`合併；靛藍底另有5×5週期染色雜訊與192²逐紗線雜訊；cache合計25＋36,864 = 36,889個Float64／295,112 B lattice算術預算（非總RAM）。顏色是顏料，蠟線略凸起（height 0.5 relief、紗線0.5）、蠟處roughness降低0.06；金屬factor為0、無mortar、AO 1。預設0.3 m nominal tile與0.004 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color>0.5的蠟占12.75–12.78%，color 0.072–0.907，全圖平均0.2125–0.2146，靛藍底（color<0.25）平均0.121–0.123，roughness 0.76–0.82，height至多0.994–0.999 relief；四個橢圓之間的格角（無蠟處）最亮約0.140–0.164；seed 0與1的格角色差平均約0.024；seed 7的512²maps平均r／g／b約(60, 64, 84)、r>110占13.5%、法線tilt²最大約0.450。我實看了預覽：交錯的橢圓與圓點排成與卡翁紋相似的圖樣，但幾何比真實巴迪克簡化、線條也過於均勻機械；第一版把四個花瓣橢圓沿格線排列，看起來像鏈條格而非卡翁，改成棋盤式交錯的橢圓後才採用。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`granola`（燕麥穀物脆片）使目前目錄936→937種，含plain的gallery為938項。蜂蜜褐色底面上疊著兩層任意角度的橢圓塊：較大的淡奶油色燕麥片（約0.4的面積）與較小的深色堅果、果乾塊，邊緣被雜訊弄得不規則、相鄰的塊會互相重疊，每塊有各自的色調與穹頂明暗；底面露出處受遮蔽變暗。不是真實燕麥片的片狀纖維、蜂蜜光澤的黏結塊、種子或糖粉，預覽也讓人聯想到迷彩圖樣。

此材質是作者依一般穀物脆片（granola）外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；兩層塊的格數、機率、大小、長寬比、邊緣雜訊、各層色調、roughness與0.2 m nominal tile皆作者設定，不宣稱符合任何真實產品。

新增專用sampler：兩層塊（燕麥片9×9格、堅果與果乾14×14格）各自在格內抖動±0.45、帶任意旋轉角與0.65–1.35的長寬比；塊可能溢出到鄰格，每個像素依固定順序合成5×5鄰格（最大的塊在最大長寬比與最大邊緣擾動下可能越過自己的格超過一格，3×3視窗會把它切斷）——`value = value·(1 − m) + 塊值·m`，遮罩`m = smooth(clamp((1 − q)/0.4))`，`q`為旋轉橢圓的距離平方乘上`1 + 0.45·(雜訊 − 0.5)·2`的邊緣擾動（40×40週期雜訊），且先合成燕麥片、再合成深色塊，所有項皆為C1；底面露出處（沒被任何塊蓋住的部分）顏色為底色0.3，AO降到0.6；cache合計567＋1,372＋1,600＋16,384 = 19,923個Float64／159,384 B lattice算術預算（非總RAM）。顏色是顏料，穹頂height約0.7 relief＋grain 0.3 relief；金屬factor為0、無mortar。預設0.2 m nominal tile與0.008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：底面外露（AO<0.61）占37.0–39.7%（seed 7為41.1%），color>0.5的淡色塊占39.2–40.7%，color<0.2的深色塊占0.49–0.58%，color 0.142–0.957，全圖平均0.461–0.477，外露底面平均0.300，roughness恆為0.78，最低AO 0.6，height至多0.993–0.996 relief；seed 0與1的覆蓋遮罩有48.0%像素不同；seed 7的512²maps平均r／g／b約(141, 116, 78)、AO<200占47.9%、法線tilt²最大約0.722。我實看了預覽：不規則的奶油色塊與暗色小塊散在褐色底上，像燕麥脆片，但也像迷彩，且遠比真實的乾燥脆片平坦；第一版（正橢圓、邊緣光滑）像豆子或藥丸，加入邊緣雜訊後才採用。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`raspberry`（覆盆子）使目前目錄935→936種，含plain的gallery為937項。覆盆子果面：16×18排成交錯格（奇數行偏移半欄）的圓形小核果（drupelet），彼此略為重疊，每顆有各自的紅色色調、穹頂明暗與偏左上的高光，顆粒之間是較暗、受遮蔽的細縫。不是真實覆盆子的整顆形狀、細絨毛、花萼、中空凹陷或大小與形狀的變化。

此材質是作者依一般覆盆子果面外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；欄列數（16×18）、顆粒半徑、縫的色調與遮蔽、顆粒色調變化、高光位置與大小、roughness與0.08 m nominal tile皆作者設定，不宣稱符合任何真實品種或尺寸。

新增專用sampler：顆粒中心在交錯格上（奇數行右移半欄，偶數行數使位移隨tile wrap），因顆粒會互相重疊，每個像素依固定順序合成3×3鄰格的顆粒——`value = value·(1 − m) + 顆粒值·m`，其中遮罩`m = smooth(clamp((1 − q)/0.35))`（`q`為半徑0.56格的圓盤距離平方，列距以欄寬換算成相同的實際長度）——所有項皆為C1；顆粒色調 = 基底0.38 + 逐顆變化（±0.1）+ 穹頂`smooth(1 − q)`×0.3 + 偏左上的高光×0.18；縫處roughness升高0.2、AO降到0.55；逐顆色調表18×16 = 288個Float64＋128²紙grain（16,384個Float64）= 16,672個／133,376 B lattice算術預算（非總RAM）。顏色是顏料，穹頂height約0.7 relief＋grain 0.3 relief；金屬factor為0、無mortar。預設0.08 m nominal tile與0.006 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color 0.035–0.956，全圖平均0.517–0.529，顆粒中心color 0.567–0.792（平均0.672–0.685），相鄰顆粒間縫的中點平均0.352–0.364，roughness 0.42–0.62，最低AO 0.55，AO<0.9的縫占15.04%（與seed無關，因為排列是固定的格點），height至多0.993–0.998 relief；seed 0與1的顆粒中心色差平均約0.068；seed 7的512²maps平均r／g／b約(154, 40, 54)、AO<230占15.0%、法線tilt²最大約0.256。我實看了預覽：整齊交錯的圓形紅色小核果與暗縫，像覆盆子的果面，但比真實的規則許多（每顆大小形狀都相同，沒有絨毛）；第一版因顆粒過度重疊而像平坦的六角形鋪磚，調整半徑、縫與高光後才採用。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`salami`（薩拉米）使目前目錄934→935種，含plain的gallery為936項。薩拉米香腸切面：帶低頻斑駁的深紅色醃肉底，上面散布乳白色的橢圓脂肪斑塊（大小與長寬比各異、相鄰者會相連）與更細小的近黑色胡椒粒；脂肪處較亮、略光滑。不是真實香腸的外皮、白色黴層、肉的纖維或切面紋理，也不是任何特定品種。

此材質是作者依一般薩拉米切面外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；脂肪斑塊的格數、機率、大小與長寬比、胡椒粒密度、肉與脂肪的色調、roughness與0.12 m nominal tile皆作者設定，不宣稱符合任何實際香腸的規格。

新增專用sampler：脂肪斑是11×11格、每格約55%機率有一個橢圓（半軸0.2–0.45格再乘0.7–1.3的長寬比）、中心在格內抖動±0.45，因為可能溢出到鄰格，每個像素以3×3鄰格的聯集`1 − Π(1 − smooth(1 − q))`合併；胡椒粒是40×40格、約14%機率、半徑0.22格的`smooth(1 − q)`圓點，中心抖動0.26，半徑加抖動小於半格而完全留在自己的格內；脂肪先把肉色混向乳白，再把胡椒粒以凸組合混向近黑，皆為C1；底色另有6×6低頻斑駁與128²細grain；cache合計20,104個Float64（160,832 B）＋1,600 B Uint8的胡椒存在表 = 162,432 B lattice算術預算（非總RAM）。顏色是顏料，脂肪height約0.4 relief、胡椒處凹下（0.2）、grain 0.4，脂肪處roughness降低0.12；金屬factor為0、無mortar、AO 1。預設0.12 m nominal tile與0.002 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color>0.6的脂肪占7.6–9.6%、color<0.12的胡椒占0.83–0.91%、color在0.12–0.45的肉占86.4–89.0%（平均0.281–0.285），color 0.0066–0.914，全圖平均0.326–0.339，roughness 0.48–0.60，height至多0.98–0.99 relief；seed 0與1的脂肪遮罩有16.3%像素不同；seed 7的512²maps平均r／g／b約(143, 69, 62)、法線tilt²最大約0.063。我實看了預覽：深紅底上有大小不一的乳白橢圓脂肪斑與細黑胡椒點，像薩拉米切面但比真實的規則許多，且前幾版調整過（第一版格狀太明顯、第二版斑塊太小太疏）。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`baconstrips`（培根片）使目前目錄933→934種，含plain的gallery為935項。條紋培根片表面：約5條帶狀的紅色瘦肉與乳白色肥肉交錯，帶的相位被低頻雜訊扭成波浪，肥瘦比例隨位置平滑變化；瘦肉帶有沿u方向的肌纖維，肥肉較亮、略凸起且較光滑，兩者交界略暗（煎烤邊）。不是真實培根的皺縮、油脂氣泡、焦邊、片狀厚度或肉皮。

此材質是作者依一般條紋培根外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；帶數（每tile 5）、波浪幅度、肥肉比例、瘦肉與肥肉色調、纖維強度、roughness與0.2 m nominal tile皆作者設定，不宣稱符合任何實際培根的規格或烹調狀態。

新增專用sampler：相位 = `5·v + 1.4·(warp(u, v) − 0.5)`，`warp`為6×3的週期低頻雜訊，肥肉權重 = `0.5 + 0.5·tanh(3·(sin(2π·相位) − 0.2 − 0.6·(width(u, v) − 0.5)))`（`tanh`的正弦是平滑方波，C∞；`width`為5×5週期雜訊，使肥瘦寬度平滑變化；整數帶數隨tile wrap）；煎烤邊 `4·fat·(1 − fat)` 使交界略暗；瘦肉另有12×160的沿u方向纖維雜訊與128²細grain；cache合計18＋25＋1,920＋16,384 = 18,347個Float64／146,776 B lattice算術預算（非總RAM）。顏色是顏料，肥肉height約0.5 relief、纖維0.3、grain 0.2，肥肉處roughness降低0.14；金屬factor為0、無mortar、AO 1。預設0.2 m nominal tile與0.003 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color>0.6的肥肉占38.4–39.7%、color<0.4的瘦肉占54.0–55.4%，color 0.138–0.912，全圖平均0.471–0.485，肥肉平均0.829–0.839、瘦肉平均0.221–0.224，roughness 0.410–0.550，height至多0.693–0.697 relief；瘦肉處沿v方向的逐像素色差約為沿u方向的2.5–2.7倍（seed 7為3.6倍）；seed 0與1的肥肉遮罩有48.3%像素不同；seed 7的512²maps平均r／g／b約(188, 124, 109)、法線tilt²最大約0.058。我實看了預覽：紅白相間的波浪條紋像培根，但條帶比真實培根平滑規則（沒有皺縮與氣泡）。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`sweetcorn`（甜玉米）使目前目錄932→933種，含plain的gallery為934項。玉米穗表面：14×14排成整齊行列的圓角方形黃色玉米粒，每粒有各自的色調（淡金黃到飽和黃）、微小的位置抖動與穹頂高光，粒與粒之間是較暗、受遮蔽的細縫。不是真實玉米穗的弧形包覆、粒的凹陷、花絲、苞葉、粒的大小變化或蒸煮後的外觀。

此材質是作者依一般新鮮甜玉米外觀所作示意，沒有引用特定來源文件、照片或量測；每tile 14×14粒、粒的大小（0.47格半寬）、抖動量、縫的色調與遮蔽、粒色變化量、roughness與0.13 m nominal tile皆作者設定，不宣稱符合任何真實玉米品種或尺寸，也沒有對照照片。

新增專用sampler：每粒是以抖動後位置為中心的四次超橢圓（圓角方形，`s = x⁴ + y⁴`為多項式），半寬0.47加抖動0.02小於半格，因此每粒在自己的格邊界前就歸零，逐粒查表不產生跳變；粒遮罩`smooth(clamp((1 − s)/0.25))`、穹頂`smooth(clamp(1 − s))`皆為C1；顏色在縫色與粒色（含逐粒色調與穹頂）之間依遮罩混合；縫處roughness升高0.3、AO降到0.5；cache合計3×196個Float64（4,704 B）＋128²紙grain（16,384個Float64／131,072 B）= 135,776 B lattice算術預算（非總RAM）。顏色是顏料，穹頂height約0.7 relief＋grain 0.3 relief；金屬factor為0、無mortar。預設0.13 m nominal tile與0.006 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：粒面（AO為1處）占70.9–71.0%，color 0.285–0.924，全圖平均0.685–0.693，粒心color 0.760–0.917（平均0.835–0.845），縫處（格角）平均0.300，roughness 0.38–0.68，最低AO 0.5，height至多0.994–0.997 relief；seed 0與1的粒心色差平均約0.049；seed 7的512²maps平均r／g／b約(222, 186, 66)、AO<230占25.8%、法線tilt²最大約0.351。我實看了預覽：整齊排列的圓角黃色玉米粒，比真實玉米規則許多（粒皆為同一大小的方格排列）。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`crosswordgrid`（填字格）使目前目錄931→932種，含plain的gallery為933項。白紙上15×15格的填字遊戲方格：約兩成的黑格依180°旋轉對稱（與印刷填字格相同）分布，白格之間有淡灰細格線，字詞起始的白格（左／上為黑格或tile邊界而右／下為白格）左上角有小圓點作為題號標記。不是真實的填字謎題、可解的字詞、數字題號、題目文字或答案；黑格也不保證符合填字謎的全部排版規則（如連通性或最小字長）。

此材質是作者依一般報紙填字格外觀所作示意，沒有引用特定來源文件、照片或量測；格數（每tile 15×15）、黑格比例（0.2）、格線濃度與寬度、題號圓點的位置與大小、墨與紙的色調、roughness與0.3 m nominal tile皆作者設定，不宣稱符合任何實際填字格的規格。

新增專用sampler：黑格表為225項Uint8，只對一半格抽雜湊並以格序`i`與`224 − i`共用同一雜湊鏡射到tile中心（180°旋轉對稱），鄰格隨tile wrap；題號表為225項Uint8（白格且左／上為黑格而右／下為白格即為1）。格填色以smoothstep權重在格邊界混合（格中心斜率為零），格線是`exp(−sin²(π·n·s)/w²)`（C∞，隨tile在整數格數wrap），題號點是只在自己格內的`smooth(1 − q)`圓點，三者以聯集`1 − Π(1 − x)`合併，使每一項皆為C1且保持在[0, 1]；cache合計450 B＋128²紙grain（16,384個Float64／131,072 B）= 131,522 B lattice算術預算（非總RAM）。顏色是顏料，墨處height約0.7 relief＋紙grain 0.3 relief、roughness略降0.06；金屬factor為0、無mortar、AO 1。預設0.3 m nominal tile與0.0012 UV-relative relief（非公尺位移）。實測（工具實跑）：seed 0／1／0xffffffff的黑格數為32／52／56（共225格），題號點為47／66／55個，每個seed黑格皆對tile中心鏡射對稱（測試逐格驗證，題號點與左右／上下規則逐格一致）；512²取樣墨色（color<0.5）占15.3%／24.6%／26.4%，color 0.045–0.955，roughness 0.74–0.80、height至多0.9975–0.9982 relief；黑格中心color至多0.074、白格中心至少0.925；兩個白格之間的格線處比格中心暗約0.43（峰值設定0.45）；seed 0與1的225格中有64格黑白不同；seed 7的512²maps平均r／g／b約(177, 175, 172)、r<110占23.9%、法線tilt²最大約0.058。我實看了預覽：整齊的黑白格、細格線與題號點。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`windowpane`（窗格紋）使目前目錄930→931種，含plain的gallery為932項。暗炭灰藍的斜紋法蘭絨布面，上面是每tile 3×3格、橫直各一組的淡色細線（窗格），線在交叉處平滑相接；布面帶斜向2/2斜紋脊（80條）與逐紗線的雜訊。不是真實的毛織結構、每條紗線的幾何、雙線或不等距格線、縫線、毛邊或褪色。

此材質是作者依一般窗格紋（windowpane check）法蘭絨外觀所作示意，沒有引用特定來源文件、照片或量測；格數（每tile 3）、線寬、底色與線色的色調、斜紋線數、roughness與0.3 m nominal tile皆作者設定，不宣稱符合任何實際織物規格。

新增專用sampler：每個方向一組線，單條線是`exp(−sin²(π·n·s)/w²)`（C∞，隨tile在整數格數wrap），兩個方向以聯集`1 − (1 − a)(1 − b)`合併，使線在交叉處仍平滑；另加斜向2/2斜紋脊（`cos`，整數線數）與192²逐紗線雜訊（36,864個Float64／294,912 B lattice算術預算，非總RAM）。顏色是顏料，淡線略凸起（height 0.35 relief，斜紋0.4、紗線雜訊0.25）、roughness略降0.04；金屬factor為0、無mortar、AO 1。預設0.3 m nominal tile與0.004 UV-relative relief（非公尺位移）。實測（工具實跑，三seed 0／1／0xffffffff，512²取樣）：color>0.45的線占6.69–6.71%，color 0.150–0.798，全圖平均0.2365–0.2366，格內本體（遠離線處）平均0.1999–0.2001、本體色至多約0.250，roughness 0.84–0.88、height至多0.994–0.996 relief；沿斜紋脊方向與橫越脊方向的色差比約2.25–2.28；線中心平均約0.75、格中心平均約0.22；seed 0與1的逐點色差平均約0.0146；seed 7的512²maps平均r／g／b約(69, 70, 74)、r>110占6.6%、法線tilt²最大約0.362。我實看了四格預覽：整齊的炭灰藍法蘭絨與淡色窗格。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`merbau`（印茄木）使目前目錄929→930種，含plain的gallery為931項。近似Intsia spp.未塗裝縱向木面：帶灰調的橙棕底色、粗質地、1條很淡的暗帶、縱向纖維與密集散布的細暗導管短痕（約1.4%）。不是新切時偏橙的鮮明色、黃色礦物沉積（yellow mineral deposits）、交錯紋或塗層。

外觀依據實際閱讀的[Wood Database Merbau](https://www.wood-database.com/merbau/)（Color／Appearance：新切為橙棕色，日久轉為較深的紅棕，板與板之間色差大，並有零星黃色礦物沉積；Grain／Texture：直紋到交錯紋、粗質地，中等光澤；Endgrain：散孔材，導管大到極大但很少）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/merbau.jpg)（帶灰調的暗棕面、許多縱向的細暗短導管痕、極少數黃色細線）；僅作配色與紋理形態參考，**不**重現黃色礦物沉積、交錯紋、板間色差或塗層，不打包來源圖，也不由照片反推真色、roughness或實際尺寸；導管密度為依照片外觀作者設定，不代表Wood Database「導管很少」的端面描述。

直接fallthrough重用既有Padauk／Bloodwood系細長橢圓導管sampler（與`blackwalnut`、`teak`、`honduranmahogany`、`shagbarkhickory`、`eastindianrosewood`、`bubinga`、`jarrah`同路徑），constructor只選preset：40×16個導管site（pose表20,480 B）、1條起伏（bandWarp 0.6）且對比低（bandContrast 0.1）的暗帶、200×8縱向fiber、128²細grain與固定3×4 warp，共20,556個Float64／164,448 B lattice算術預算（非總RAM）。金屬factor為0；導管凹點是真的height凹陷，色紋只是顏料。預設0.18 m nominal tile與0.0025 UV-relative relief（非公尺位移）皆作者設定。實測（工具實跑，三seed 0／1／0xffffffff、256²取樣）：導管（AO<0.9）占1.27–1.53%，無凹陷的本體占98.1–98.3%，本體色0.254–0.499，橫／縱色差比8.42–8.82，roughness 0.50–0.604、height 0.41–0.503 relief、最低AO 0.75；seed 7的512²maps平均r／g／b約(95, 69, 51)、AO<230占1.40%、法線tilt²最大約0.0069。我實看了預覽：暗棕底上有密集的細短導管痕，與照片的形態相近但規則得多（導管落在格狀site上）。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`crosshatchengraving`（交叉排線版畫）使目前目錄928→929種，含plain的gallery為930項。奶油色紙面上的黑色細排線，依低頻明暗場逐步加線：暗部出現第一組對角線，更暗處加上反向對角線形成交叉，最暗處再加水平線；線寬也隨明暗增加，亮部保持留白。不是真實版畫的刻線軌跡、可變線距、輪廓線、透視或圖像內容。

此材質是作者依一般銅版／鋼筆交叉排線（crosshatching）外觀所作示意，沒有引用特定來源文件、照片或量測；線數（每方向48條）、三組線的出現門檻（0.25／0.55／0.8）、線寬範圍、明暗場的6×6格解析度、墨與紙的色調、roughness與0.25 m nominal tile皆作者設定，不宣稱符合任何實際版畫或印刷規格。

新增專用sampler：6×6低頻雜訊決定明暗，三組整數線數的線族（`u+v`對角、`u−v`反向對角、水平`v`）各以平滑ramp在自己的門檻淡入，單條線是`exp(−sin²(π·n·s)/w²)`（C∞，隨tile整數wrap），線寬隨明暗由0.06增至0.3；三族以聯集`1 − Π(1 − x)`合併（不用`max`，因為`max`在兩族相等處有折角、不是C1——我實作時測試曾因此失敗，詳見ACCEPTANCE），整體為C1；cache合計6²（36個）＋128²紙grain（16,384個）= 16,420個Float64／131,360 B lattice算術預算（非總RAM）。顏色是顏料，墨線height約0.7 relief＋紙grain 0.3 relief；墨處roughness略降0.08；金屬factor為0、無mortar、AO 1。預設0.25 m nominal tile與0.0015 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：墨色（color<0.5）占5.33–14.64%（隨明暗場而異）、color>0.85的紙面占70.3–87.3%、color 0.040–0.960、平均0.796–0.883、roughness 0.72–0.80、height至多0.997 relief；seed 0與1的墨色遮罩有8.01%像素不同；seed 7的512²maps平均r／g／b約(201, 192, 172)、r<110占9.6%、法線tilt²最大約0.168。我實看了四格預覽：交叉排線的明暗層次清楚。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`sheetmusic`（樂譜）使目前目錄927→928種，含plain的gallery為929項。奶油色紙面上6組五線譜（每組5條連續的細黑譜線，間以小節線：每tile 4條），每組16個音符位置，約八成有一個四分音符（隨機音高0–7個半階、符頭＋符桿，低音符桿朝上、高音符桿朝下），其餘為休止；譜組之間留白。不是真實樂曲或可演奏的音符、譜號、拍號、升降記號、符尾、連結線或歌詞。

此材質是作者依一般樂譜外觀所作示意，沒有引用特定來源文件、照片或量測；譜線間距、符頭大小、音符分布規則、墨與紙的色調、roughness與0.25 m nominal tile皆作者設定，不宣稱符合任何實際樂譜印刷規格，音符也不構成有意義的旋律。

新增專用sampler：每個譜組擁有自己的垂直間距、每個音符位置擁有自己的水平間距，所有標記都嚴格限制在自己的範圍內——五條譜線與小節線用`smooth(1 − d²/w²)`，符頭是`smooth(1 − q)`橢圓，符桿是帶平滑端點的線輪廓，標記間以聯集`ink += x·(1 − ink)`合併，因此墨色在任何擁有權邊界前就歸零，整體為C1；音符表為96項Uint8（0為休止，否則1 + 音高階）；cache合計96 B＋128²紙grain（16,384 Float64／131,072 B）= 131,168 B lattice算術預算（非總RAM）。顏色是顏料，墨線height約0.7 relief＋紙grain 0.3 relief；金屬factor為0、無mortar、AO 1。預設0.25 m nominal tile與0.0012 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）量測：512²取樣color<0.5的墨色占7.12–7.17%、color 0.031–0.960、平均約0.881、roughness 0.72到0.82、高度最高0.99 relief；每組5條譜線沿40個u取樣的最大color 0.069；譜組間留白位置的最小color 0.921；每個音符位置在「間」的高度上至多1個符頭，三seed共288個位置中有0.396在「間」上有符頭；seed 0與1的墨色遮罩有2.98%像素不同；seed7的512² r／g／b平均約(218,210,191)、r<100占5.5%、法線max tilt²約0.104。我實看了四圖：整齊的五線譜、小節線與帶符桿的音符。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`buffaloplaid`（水牛格紋）使目前目錄926→927種，含plain的gallery為928項。紅布上橫向與縱向各4條寬條紋（相位為整數，隨tile wrap），單一方向的條紋使布面變成暗紅，兩方向重疊處最暗近黑，形成經典的紅黑大格；布面帶斜向2/2斜紋脊（96條）與逐紗線的雜訊。不是真實織紋結構、每條紗線的幾何、縫線、毛邊或褪色。

此材質是作者依一般水牛格紋（buffalo plaid）襯衫布外觀所作示意，沒有引用特定來源文件、照片或量測；格數、條紋柔邊、斜紋線數、紅與近黑的色調、roughness與0.25 m nominal tile皆作者設定，不宣稱符合任何實際織物規格或配色。

新增專用sampler：條紋 = `0.5 + 0.5·tanh(5·sin(2π·4u))`（平滑方波，C∞，整數格數隨tile wrap），縱向同理；顏色 = `0.92 − 0.42·(橫條紋 + 縱條紋)`，加上斜紋`cos(2π·96·(u+v))`（整數線數）與192²逐紗線值雜訊（36,864 Float64／294,912 B lattice算術預算，非總RAM）；斜紋與紗線決定height，重疊處roughness略升（0.86→0.90）並帶AO 0.12。顏色是顏料，金屬factor為0、無mortar。預設0.25 m nominal tile與0.004 UV-relative relief（非公尺位移）皆作者設定。實作中修正兩處：首版baseTone 0.96，依推算（0.96＋斜紋0.025＋紗線0.03）無條紋處的color最高可能超過1（此為推算、未實測），故改為0.92；首版height含`− 0.1·重疊`，使重疊處height為負（−0.022 relief，超出[0,1]），改為`+ 0.1·(1 − 重疊)`。三seed（0／1／0xffffffff）量測：各格中心的16點平均——雙向重疊0.081、單向0.502、無條紋0.921；整體color 0.026–0.973、平均約0.500；roughness 0.86／重疊0.90；重疊處AO 0.88；seed只改變紗線雜訊，seed 0與1的取樣色差平均僅0.0114；seed7的512² r／g／b平均約(117,18,17)、r<70占23.6%、r>170占22.6%、法線max tilt²約0.460。我實看了四圖：整齊的紅黑大格與斜紋法線。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`jarrah`（賈拉木／澳洲桉）使目前目錄925→926種，含plain的gallery為927項。近似Eucalyptus marginata未塗裝縱向木面：磚紅偏棕的底色、中到粗的質地、2條很淡的暗紅褐起伏帶、縱向纖維與散布的細暗導管短痕（約0.65%）。不是淡黃至粉紅的窄邊材、膠囊／膠線（gum pockets）、捲曲紋、交錯／波浪紋或塗層。

外觀依據實際閱讀的[Wood Database Jarrah](https://www.wood-database.com/jarrah/)（Color／Appearance：心材由淡紅或棕到較深的磚紅、見光變深；窄邊材為淡黃到粉紅；Grain／Texture：交錯或波浪紋、中到粗質地，可能有膠囊或膠線瑕疵）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/jarrah-s-400x400.jpg)（磚紅偏紫灰的均勻面、極淡的縱向色變與零星暗點）；僅作配色與紋理形態參考，**不**重現邊材、膠線、捲曲或交錯紋，不打包來源圖，也不由照片反推真色、roughness或實際尺寸。

直接fallthrough重用既有Padauk／Bloodwood系細長橢圓導管sampler（與`blackwalnut`、`teak`、`honduranmahogany`、`shagbarkhickory`、`eastindianrosewood`、`bubinga`同路徑），constructor只選preset：36×12個導管site（pose表13,824 B）、2條起伏（bandWarp 0.7）且對比低（bandContrast 0.14）的暗帶、180×8縱向fiber、128²細grain與固定3×4 warp，共19,564 Float64／156,512 B lattice算術預算（非總RAM）。金屬factor為0；導管凹點是真的height凹陷，色紋只是顏料。預設0.18 m nominal tile與0.0025 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：導管占0.64–0.66%，本體色0.259–0.559，橫／縱色差比10.5–11.3，roughness 0.500–0.603，高度0.41–0.503 relief；seed7的512²平均base color約(105,58,52)、導管占0.63%、法線max tilt²約0.0069。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`amberbubbles`（含氣泡的琥珀樹脂）使目前目錄924→925種，含plain的gallery為926項。橘黃色的光滑樹脂，由4個整數波數正弦彎曲的3條流動帶形成緩慢捲動的明暗紋；14×14格中約45%有一顆被困住的氣泡（隨機大小與位置），氣泡略凸、更光滑、帶一圈明亮的透鏡邊緣與淡淡的光暈；另有10×10的低頻混濁。不是半透明（次表面）、內含物（昆蟲、植物）、裂紋或打磨痕。

此材質是作者依一般琥珀樹脂（流紋與氣泡）外觀所作示意，沒有引用特定來源文件、照片或量測；流動帶數、氣泡密度與大小、色調、roughness與0.12 m nominal tile皆作者設定，不宣稱符合任何實際琥珀或樹脂，也不模擬半透明與折射。

新增專用sampler：流動 = `0.5 + 0.5·sin(2π·3u + 0.8·Σ sin(2π(m·u + n·v) + φ))`（四個整數波數正弦，含seed相位）；每格存3個Float64（抖動位置x、y與大小）的14²格氣泡，每顆氣泡是`smooth(1 − q/(size·r)²)`圓頂（r = 0.36格）加上位於0.55倍半徑、寬0.25的以半徑平方表示的高斯亮環（乘圓頂包絡，避免圓心處的尖點），取3×3鄰格，並以`S/(1+S)`飽和；混濁為10²值雜訊；全部C1。cache合計100＋588＋4 = 692 Float64／5,536 B lattice算術預算（非總RAM）。顏色是顏料，height只用於法線與AO；金屬factor為0、無mortar。預設0.12 m nominal tile與0.004 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、512²取樣：高度超過0.13 relief的氣泡占6.95–7.49%、color>0.8占1.35–1.84%、color 0.432–0.896、平均0.584–0.597、roughness 0.08到0.13、最低AO 0.905、高度0到0.38 relief；seed 0與1的氣泡遮罩有13.1%像素不同；seed7的512² r／g／b平均約(189,119,25)、AO<250占7.8%、法線max tilt²約0.080。我實看了四圖：流動明暗紋與帶亮緣的氣泡、法線圖氣泡為淺凸。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`cauliflowercurd`（花椰菜凝乳）使目前目錄923→924種，含plain的gallery為925項。奶白色花球表面，由三個尺度（10²、26²、64²格）的圓頂花蕾堆疊：大花球上長較小的花蕾、再長更小的凸粒；花蕾頂較亮，間隙帶灰米色並有AO遮蔽（AO<0.7約占15%）；整體粗糙（roughness恆為0.78）、帶細grain。不是莖、葉、花球的整體曲面、斑點或褐變。

此材質是作者依一般花椰菜（白花椰）花球表面外觀所作示意，沒有引用特定來源文件、照片或量測；三個尺度的格數、半徑、振幅、色調、roughness與0.12 m nominal tile皆作者設定，不宣稱符合任何花椰菜品種，也不是真正的碎形（只有三層疊加）。

新增專用sampler：三個尺度各存每格3個Float64（抖動位置x、y與大小），共(10²＋26²＋64²)×3 = 14,616 Float64，加128²細grain（16,384 Float64），合計31,000 Float64／248,000 B lattice算術預算（非總RAM）。每個尺度把`smooth(1 − q/r²)`花蕾圓頂（r = 0.62格）加總於3×3鄰格，三層高度以振幅1、0.45、0.2相加，`H/(1+0.12H)`飽和為高度；顏色用`H/(1+H)`映射以免超出[0,1]，AO為`1 − 0.55/(1+8H²)`，全部C∞／C1。顏色是顏料，height只用於法線與AO；金屬factor為0、無mortar。預設0.12 m nominal tile與0.016 UV-relative relief（非公尺位移）皆作者設定。調整過程：首版（8／20／48格、r = 0.95、saturation 0.55）渲染成模糊的雲狀起伏、看不出花蕾，改為10／26／64格、r = 0.62、saturation 0.12後實看確認有成簇的圓蕾；此外調整後color最高達1.277（超出[0,1]），改成`H/(1+H)`映射並把heightTone設為1，探測確認最高為0.925–0.951。三seed（0／1／0xffffffff）、512²取樣：AO<0.7占13.8–16.2%、AO<0.6占7.2–9.0%、color>0.75占35.2–38.5%、color 0.281–0.951、平均0.678–0.689、AO 0.45–0.978、高度0到1.66–1.78 relief；seed 0與1的AO<0.7遮罩有22.5%像素不同；seed7的512² r／g／b平均約(216,210,187)、AO<178占15.1%、法線max tilt²約0.715。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`bubinga`（非洲紫檀／布賓加）使目前目錄922→923種，含plain的gallery為924項。近似Guibourtia屬未塗裝縱向木面：粉紅紅褐底色、均勻細質地、3條較暗的紅褐起伏淡條紋、縱向纖維與散布的細暗導管凹點（約1.2%）。不是紫或黑色條紋、稻草色邊材、波紋（pommele）、火焰、瀑布或絞絲等花紋、交錯紋或塗層。

外觀依據實際閱讀的[Wood Database Bubinga](https://www.wood-database.com/bubinga/)（Color／Appearance：心材由粉紅紅色到較深的紅褐，帶更暗的紫或黑色條紋；邊材為淡稻草色且與心材分明；常見多種花紋；Grain／Texture：直到交錯紋、均勻的細到中等質地與適度天然光澤）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/guibourtia-spp-300x600.jpg)（均勻紅褐面、細暗導管線與淡淡的縱向起伏）；僅作配色與紋理形態參考，**不**重現頁面所述的紫／黑色條紋、淡色邊材與各種花紋，不打包來源圖，也不由照片反推真色、roughness或實際尺寸。

直接fallthrough重用既有Padauk／Bloodwood系細長橢圓導管sampler（與`blackwalnut`、`teak`、`honduranmahogany`、`shagbarkhickory`、`eastindianrosewood`同路徑），constructor只選preset：44×14個導管site（pose表19,712 B）、3條起伏（bandWarp 0.6）且對比低（bandContrast 0.25）的暗帶、220×9縱向fiber、128²細grain與固定3×4 warp，共20,840 Float64／166,720 B lattice算術預算（非總RAM）。金屬factor為0；導管凹點是真的height凹陷，色紋只是顏料。預設0.18 m nominal tile與0.0025 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：導管占1.13–1.23%，本體色0.257–0.729，橫／縱色差比11.9–12.9，roughness 0.460–0.564，高度0.41–0.503 relief；seed7的512²平均base color約(141,71,42)、導管占1.29%、法線max tilt²約0.0061。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`pomegranatearils`（石榴籽囊）使目前目錄921→922種，含plain的gallery為923項。20×20格、每格一個抖動位置、大小與色調各異的圓形紅寶石色籽囊緊密堆疊並互相重疊，每顆上有偏左上的小高光，籽囊光滑、略高、無遮蔽；籽囊之間的縫隙很暗、較粗糙並帶AO（AO<0.5約占面積8.7%）。不是半透明（次表面）、果肉汁液、白色隔膜、果皮或籽的內部結構。

此材質是作者依一般石榴籽囊（紅色圓粒緊密堆疊）外觀所作示意，沒有引用特定來源文件、照片或量測；籽囊大小、色調、高光、縫隙色、roughness與0.12 m nominal tile皆作者設定，不宣稱符合任何石榴品種，也不模擬半透明。

新增專用sampler：每格存4個Float64（抖動位置x、y，相對大小與色調），20²格共1,600 Float64／12,800 B lattice算術預算（非總RAM）。每顆籽囊是`smooth(1 − q/(size·r)²)`圓頂（r = 0.78格）加總於3×3鄰格；覆蓋度為`g·W/(1+g·W)`（W為圓頂權重和、g = 1.3），顏色取圓頂加權的色調平均，再加上各顆偏左上的小圓頂高光；縫隙處覆蓋度小，退回很暗的縫隙色並提高roughness與AO遮蔽。全部為C1。顏色是顏料，height只用於法線與AO；金屬factor為0、無mortar。預設0.12 m nominal tile與0.01 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、512²取樣：AO<0.5占8.67–8.84%、AO<0.7占20.3–20.5%、color 0.06（縫隙色）到0.815–0.880、平均0.373–0.382、roughness 0.230–0.238到0.58、最低AO 0.30、高度0到0.510–0.519 relief；seed 0與1的AO<0.5遮罩有14.0%像素不同；seed7的512² r／g／b平均約(129,26,41)、AO<230占95.4%、法線max tilt²約0.102。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`pumpkinskin`（南瓜皮）使目前目錄920→921種，含plain的gallery為922項。橙色果皮上有8條沿v方向縱貫的隆起稜（稜相位被低頻場輕微彎曲），稜間溝槽較暗、較粗糙並帶AO（約四成面積在溝槽中），稜上有細縱向皮紋與約三分之一格有的小疣點。不是果蒂、果瓣曲面、白斑、傷痕或塗層。

此材質是作者依一般南瓜皮縱稜外觀所作示意，沒有引用特定來源文件、照片或量測；稜數、彎曲量、疣點密度、色調、roughness與0.4 m nominal tile皆作者設定，不宣稱符合任何南瓜品種。

新增專用sampler：稜 = `0.5 + 0.5cos(2π·(8u + 0.07·8·(噪聲−0.5)))`（8個整數稜，噪聲為6×6低頻雜訊使溝槽略為彎曲），皮紋為150×6的縱向拉長值雜訊，疣點為24×24格每格3個Float64的抖動位置與大小（約35%的格有疣）、以`smooth(1 − q/r²)`圓頂加總並以`W/(1+W)`飽和，故皆為C1。cache合計36＋900＋1,728 = 2,664 Float64／21,312 B lattice算術預算（非總RAM）。顏色是顏料，height只用於法線與AO；金屬factor為0、無mortar。預設0.4 m nominal tile與0.012 UV-relative relief（非公尺位移）皆作者設定。調整過程：首版ribWarp 0.12、疣點偏淡，實看後稜過度蜿蜒，改為0.07並加強疣點；另外首版baseTone 0.78使color最高達1.0036（超出[0,1]），改為0.72。三seed（0／1／0xffffffff）、512²取樣：color 0.572–0.942、平均約0.728、AO<0.95的溝槽占43.5–44.2%、最低AO 0.60、roughness 0.55–0.67、高度0.0015–0.958 relief、橫／縱色差比5.2–6.2；沿三條水平線（v = 0.13、0.5、0.81）各數到恰好8個溝槽；seed 0與1的取樣色差平均0.059；seed7的512²中r／g／b平均約(224,126,23)、AO<242占43.3%、法線max tilt²約0.243。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`citruspeel`（柑橘果皮）使目前目錄919→920種，含plain的gallery為921項。明亮橙色果皮，48×48格、約九成格有一個抖動位置的油胞凹點（隨機深度），相鄰凹點可重疊，約四成面積落在凹點中（凹點較暗、較低、較粗糙並帶AO），另有柔和的6×6低頻色斑與細grain。不是橘瓣紋、果蒂、果皮厚度、白色內皮、油珠或傷痕。

此材質是作者依一般橙子果皮（油胞凹點）外觀所作示意，沒有引用特定來源文件、照片或量測；凹點密度與半徑、色調、roughness與0.12 m nominal tile皆作者設定，不宣稱符合任何柑橘品種。

新增專用sampler：每格存3個Float64（抖動位置x、y與深度；缺凹點時深度0），48²格共6,912 Float64，加6×6色斑雜訊（36 Float64）與128²細grain（16,384 Float64），合計23,332 Float64／186,656 B lattice算術預算（非總RAM）。凹點以加總處理：每個是`smooth(1 − q/r²)`碗（r = 0.55格、邊緣值與斜率歸零），取3×3鄰格，以`D/(1+D)`飽和後降低color、height並提高roughness與AO遮蔽，因此重疊處仍為C1。顏色是顏料，height只用於法線與AO；金屬factor為0、無mortar。預設0.12 m nominal tile與0.006 UV-relative relief（非公尺位移）皆作者設定。首版baseTone 0.72，渲染後偏暗褐、不像橙色，改為0.86（pitTone 0.26、mottleTone 0.14）並重看。三seed（0／1／0xffffffff）、512²取樣：AO<0.9的凹點占40.9–41.4%、color 0.624–0.941、平均0.799–0.808、roughness 0.420–0.496、高度0.377–0.799 relief、最低AO 0.778–0.783、平地比凹點高約0.172 relief；seed 0與1的凹點遮罩有41.9%像素不同；seed7的512²中r／g／b平均約(234,148,27)、AO<230占40.7%、法線max tilt²約0.170。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`coirdoormat`（椰殼纖維門墊）使目前目錄918→919種，含plain的gallery為920項。深褐到淡褐的粗硬纖維，在5×5低頻分塊中分成四種方向（水平、垂直、兩個斜向），各塊內是細長條狀的纖維紋，塊間以平滑權重交接；整體粗糙、帶些許縫隙陰影（AO最低約0.55）與細小絨毛起伏。不是單根纖維的幾何、編織底布、橡膠框邊、字樣或磨損。

此材質是作者依一般椰殼纖維（coir）門墊外觀所作示意，沒有引用特定來源文件、照片或量測；方向分塊、纖維粗細、色調、roughness與0.3 m nominal tile皆作者設定，不宣稱符合任何實際產品或材質規格。

新增專用sampler：4個以不同方向拉長的細條值雜訊——水平（12×170格）、垂直（170×12格）與兩個以整數剪切`(u+v, v)`、`(u−v, v)`取樣的斜向（各170×12格，因係整數剪切，仍隨tile wrap）——加上128²細絨毛雜訊與5×5低頻分塊雜訊；分塊雜訊×4決定方向，四個方向權重為`cos²(π/2·距離)`（距離為環形，≤1才非零），它們在交接處斜率為0且總和恆為1，因此混合為C1。cache合計24,569 Float64／196,552 B lattice算術預算（非總RAM）。顏色是顏料，height只用於法線與AO；金屬factor為0、無mortar。預設0.3 m nominal tile與0.006 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：color 0.007–0.053到0.654–0.678、平均0.348–0.358、標準差約0.101、roughness 0.935–0.965、高度0.024–0.953 relief、最低AO 0.553–0.558、橫／縱色差比1.03–1.23（無全域纖維方向）；seed 0與1的取樣色差平均0.113；seed7的512²中r／g／b平均約(91,65,40)、r<90占45.2%、AO<200占15.7%、法線max tilt²約0.618。我實看了四圖：呈粗硬的方向性分塊纖維、法線圖紋理強烈。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`europeanyew`（歐洲紫杉）使目前目錄917→918種，含plain的gallery為919項。近似Taxus baccata未塗裝弦切面心材：橙褐色底、細而均勻的質地、16條密集起伏帶拱形的較深褐生長紋（約占面積七分之一）與細縱向纖維。不是淡黃褐的窄邊材帶、偏紫的暗褐色變、節、瘤或塗層。

外觀依據實際閱讀的[Wood Database European Yew](https://www.wood-database.com/european-yew/)（Color／Appearance：邊材通常為淡黃或棕褐的窄帶，心材為橙褐色、有時帶更暗的棕或紫調；Grain／Texture：直紋、細而均勻的質地、天然光澤佳）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/taxus-baccata-300x600.jpg)（橙褐色面、細密生長紋與拱形、一個暗色節）；僅作配色與紋理形態參考，**不**重現照片中的節、邊材帶或紫調，不打包來源圖，也不由照片反推真色、roughness或實際尺寸。

直接fallthrough重用`douglasfir`年輪sampler（與`longleafpine`、`westernredcedar`、`sitkaspruce`、`europeanlarch`、`europeanolive`同路徑），constructor只選新preset（rings 16、arch 1.9、warp 0.6、latewood 0.55–0.9、lateTone 0.32、earlyTone 0.82）；warp 36＋fiber 200×6＋128²細grain共17,620 Float64／140,960 B lattice算術預算（非總RAM）。金屬factor為0，晚材略高，年輪紋色是顏料。預設0.18 m nominal tile與0.0025 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：color<0.6占14.9–15.2%、color>0.75占70.2–70.5%、色域0.469–0.881、roughness 0.421–0.490、高度0.498–0.642 relief、橫／縱色差比3.64–3.66、最低AO 0.96；seed7的512²中r／g／b平均約(216,143,68)、g≥140占72.4%（g<140占27.6%）、法線max tilt²約0.0149。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`raindropripples`（雨滴漣漪）使目前目錄916→917種，含plain的gallery為918項。深灰藍的光滑水面上，8×8個位置抖動的雨滴各自擴散出同心漣漪環（隨機振幅與相位），相鄰漣漪疊加成干涉圖樣；環的亮／暗波峰各占約6–9%面積，水面反光顏色圍繞中灰藍，波處roughness略升、法線顯示清楚的環狀起伏。不是隨時間擴散、水面下的折射、水花、泡沫或岸邊反射。

此材質是作者依「雨滴落在水面形成的同心漣漪」一般印象所作示意，沒有引用特定來源文件、照片或量測；格數、環波長、包絡半徑、振幅範圍、色調、roughness與0.4 m nominal tile皆作者設定，不宣稱符合任何實際水體或流體力學模型（沒有色散、衰減律或波速關係）。

新增專用sampler：每格存4個Float64（抖動位置x、y，振幅與環相位），8×8格共256 Float64，另有96²細grain（9,216 Float64），合計9,472 Float64／75,776 B lattice算術預算（非總RAM）。漣漪以加總處理：每個雨滴貢獻`振幅·smooth(1 − q/R²)·cos(2π√q/λ − 相位)`（包絡R = 0.78格、於外緣值與斜率歸零；`cos(k√q)`對半徑為偶函數，故在圓心亦光滑），取3×3鄰格；以`tanh(1.1·Σ)`把無界的加總映射為反光亮／暗，所以重疊處仍為C1。顏色是顏料（水面反光），height只用於法線；金屬factor為0、無mortar、AO 1。預設0.4 m nominal tile與0.0022 UV-relative relief（非公尺位移）皆作者設定。我修正過一次：首版把環頻率錯誤地再除以格數，渲染出過寬的環，改正後並實看四圖確認呈細密的同心圈（波長0.2格×每格64像素≈12.8像素，為計算值）。三seed（0／1／0xffffffff）、512²取樣：color>0.75占6.1–8.6%、color<0.25占6.1–8.6%（兩者相差不到0.3個百分點）、color 0.111–0.887、平均0.4999–0.5004、roughness 0.080–0.122、高度0.044–0.954 relief、AO 1；沿三條水平線的色相穿越中灰次數為32–66；seed 0與1的影像取樣平均色差0.189；seed7的512² r／g／b平均約(115,132,143)、r<80占12.8%、r>150占12.9%、法線max tilt²約0.107。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`gamedice`（遊戲骰子）使目前目錄915→916種，含plain的gallery為917項。6×6顆象牙白圓角方骰排成一盤，骰面壓入黑色圓形點數（標準1–6點配置，每顆隨seed擲出），骰子間是較暗、較粗糙且帶AO的托盤；骰面光滑、點數凹陷且較粗糙。不是立體骰子的三個面、斜放或堆疊、骰邊倒角之外的幾何、點數塗漆厚度或磨損。

此材質是作者依一般六面骰子的標準點數配置（1–6點）所作示意，沒有引用特定來源文件、照片或量測；骰子大小、圓角、點數半徑與深度、色調、roughness與0.3 m nominal tile皆作者設定，不宣稱符合任何實際骰子規格（如尺寸或對面和為7的排列），也不模擬真實骰子的點數凹陷方式。

新增專用sampler：36顆骰各以`hash`依seed擲出1–6，點數位置取自七個候選位置（四角、左右中央與中心）的標準配置；骰身為兩個平滑邊緣斜坡的乘積（頂面平坦、邊緣斜率為0），點數 = `smooth(1 − q/r²)`壓入面內，托盤色與骰色以骰身權重混合，因此皆C1。cache為36項Uint8點數表與64²細grain（4,096 Float64），共32,804 B lattice算術預算（非總RAM）。顏色是顏料，height只用於法線與AO；金屬factor為0、無mortar。預設0.3 m nominal tile與0.012 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）量測：每顆骰的七個位置中暗點構成的集合都恰為六種標準配置之一；三seed共108顆骰的點數分布為1點21、2點17、3點19、4點18、5點21、6點12顆；骰面color 0.921–0.939、點數0.04、托盤0.16；骰面高度1.0 relief、點數0.78、托盤0；roughness骰面0.30／點數0.55／托盤0.40；托盤AO 0.5、骰面1；seed7的512²中r平均143.7、r<60占33.0%、r>180占46.3%、AO<200占39.2%、法線max tilt²約0.532。我實看了四圖，確認2、3、5、6點的配置與標準骰面一致。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`europeanolive`（歐洲橄欖木）使目前目錄914→915種，含plain的gallery為916項。近似Olea europaea未塗裝弦切面：淡黃褐底色、細而均勻的質地、6條細長起伏帶拱形的深黃褐生長紋（約占面積一成以下）與細縱向纖維。不是深褐至近黑的縱向條紋與紋理、彎曲／野生紋、瘤紋、邊心材界線或塗層。

外觀依據實際閱讀的[Wood Database Olive](https://www.wood-database.com/olive/)（Color／Appearance：心材由黃到淺紅褐，帶更暗的棕到黑色條紋與脈；邊材淡黃且與心材分明；Grain／Texture：紋理可為直、交錯或野生；細而均勻的質地、帶適度天然光澤）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/olea-europaea-300x600.jpg)（淡黃褐面、細暗生長紋與拱形）；僅作配色與紋理形態參考，**不**重現頁面所述的深褐至近黑條紋與脈、野生紋或瘤紋，不打包來源圖，也不由照片反推真色、roughness或實際尺寸。

直接fallthrough重用`douglasfir`年輪sampler（與`longleafpine`、`westernredcedar`、`sitkaspruce`、`europeanlarch`同路徑），constructor只選新preset（rings 6、arch 3.4、warp 0.9、latewood 0.8–0.96的窄線、lateTone 0.14、earlyTone 0.78）；warp 49＋fiber 220×5＋128²細grain共17,533 Float64／140,264 B lattice算術預算（非總RAM）。金屬factor為0，晚材略高，年輪紋色是顏料。預設0.18 m nominal tile與0.002 UV-relative relief（非公尺位移）皆作者設定。我先把lateTone設為0.3，渲染後年輪線太淡，改為0.14。三seed（0／1／0xffffffff）、256²取樣：color<0.72占9.1–9.9%、color>0.8占33.1–34.1%、色域0.605–0.847、roughness 0.381–0.450、高度0.498–0.602 relief、橫／縱色差比2.44–2.49、最低AO 0.97；seed7的512²中r／g／b平均約(223,194,141)、g≥185占95.9%（g<185占4.1%）、法線max tilt²約0.0052。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`poolcaustics`（泳池焦散）使目前目錄913→914種，含plain的gallery為915項。藍色池底上有一張明亮、分岔的細光網，網眼間是較暗的深藍色塊；約三分之一面積偏亮，光網處roughness略低，池底有細微顆粒起伏。不是隨時間流動的焦散、真實折射光線追蹤、池磚縫、水面反射或深度漸層。

此材質是作者依「泳池底焦散光網」一般印象所作示意，沒有引用特定來源文件、照片或量測；光網由我自行設計的三組彎曲線族疊成，只在視覺上近似光網，並非物理上的焦散模型。線族方向、寬度、增益、色調、roughness與0.5 m nominal tile皆作者設定，不宣稱符合任何真實水池或光學規格。

新增專用sampler：三組整數波數線族`(6,0)`、`(3,5)`、`(−3,5)`，各自的相位再被三個整數波數正弦（含seed相位）彎曲，每族貢獻`exp(−sin²(π·相位)/w²)`（C∞），加總後以`S/(1+S)`飽和映射到color與roughness；線被彎曲擠在一起處光暈疊加，形成較亮較細的分岔網。cache為96²池底grain（9,216 Float64）加3相位與3偏移共9,222 Float64／73,776 B lattice算術預算（非總RAM）。顏色是顏料，height只用於法線；金屬factor為0、無mortar、AO 1。預設0.5 m nominal tile與0.002 UV-relative relief（非公尺位移）皆作者設定。調整過程：首版（warpAmplitude 0.9、lineWidth 0.2、gain 0.9）渲染成纏繞的細線圈，不像焦散；第二版放寬線寬（0.55）、降低彎曲與增益後成為軟光網但對比偏低；最後把lineWidth設0.42、gain 0.9、baseTone 0.16以提高對比，並實看確認呈現有深色網眼的亮色分岔網。三seed（0／1／0xffffffff）、512²取樣：color>0.55占33.3–36.9%、color<0.3占22.3–24.3%、color 0.144–0.793、平均0.449–0.461、roughness 0.554–0.698、AO 1；seed 0與1的亮區遮罩有43.9%像素不同；seed7的512² r／g／b平均約(99,138,165)、法線max tilt²約0.066。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`metalflakepaint`（金屬片漆）使目前目錄912→913種，含plain的gallery為914項。深藍清漆底色上散布隨機位置、隨機傾斜與亮度的圓形金屬片（64×64格、約半數格有片），約21–22%的面積被片覆蓋；片本身淡薰衣草銀色，在metallic通道中形成部分金屬遮罩（最高約0.68，不是全金屬），片的小傾斜使法線閃爍，清漆底則為非金屬。不是珠光／變色（多色）、片的多邊形形狀、各片獨立反射方向或清漆層厚度。

此材質是作者依一般金屬片車漆外觀所作示意，沒有引用特定來源文件、照片或量測；片大小、密度、色調、metallic覆蓋、roughness與0.1 m nominal tile皆作者設定，不宣稱符合任何實際塗料或色號。

新增專用sampler：每格存5個Float64（抖動位置x、y，傾斜x、y與色調；缺片時色調0），64²格共20,480 Float64，另有128²清漆grain 16,384 Float64，合計36,864 Float64／294,912 B lattice算術預算（非總RAM）。金屬片以加總而非擁有權處理：每片是`smooth(1 − q/r²)`圓頂（半徑0.55格、值與斜率於邊緣歸零），取3×3鄰格（片最遠達半徑加抖動共0.9格，足夠涵蓋）；高度為各片圓頂乘以`1 + 2·tilt·(tiltX·dx + tiltY·dy)`的加總，因此重疊處仍為C1。覆蓋度`S/(1+S)`（S為加權和乘flakeGain 1.2）飽和映射到color、metallic、roughness與AO，不做硬剪裁。這是此kind之所以加入`procedural-material.ts`的metallic清單（金屬factor 1，由逐樣本metallic通道控制）與測試的通用「非金屬」例外清單。預設0.1 m nominal tile與0.003 UV-relative relief（非公尺位移）皆作者設定。首版以48格、半徑0.78、存在率0.85渲染，實看後幾乎整面是銀色而看不到藍色底，所以改成64格、半徑0.55、存在率0.5、flakeGain 1.2。三seed（0／1／0xffffffff）、512²取樣：metallic>0.3占21.5–22.3%、metallic最高0.671–0.683、最低0、平均0.117–0.121、color 0.165–0.748、高度0.25到1.31–1.38 relief、roughness 0.052–0.12、AO最低0.932、color與metallic的相關係數約0.999；seed 0與1的片遮罩有33.3%像素不同；seed7的512²中r／b平均約(73,113)、metallic通道平均30.3／255、其中>76占21.9%、法線max tilt²約0.351。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`tapemeasure`（捲尺）使目前目錄911→912種，含plain的gallery為913項。一個tile是黃色捲尺的100 mm段：100條毫米刻度（長0.2 tile高）、每5 mm一條較長（0.3）、每10 mm一條最長而較粗（0.42）的近黑刻線，從帶邊下方0.08起向下垂；橫截面是兩緣升起、中央下凹的餘弦弧，光滑塗層因此在縱向有法線梯度。沒有數字、英制刻度、端鉤、捲尺外殼或磨損。

此材質是作者依一般公制捲尺外觀所作示意，沒有引用特定來源文件、照片或量測；刻線長度與寬度、黃色、凹弧深度、roughness與0.1 m nominal tile（正好對應100 mm段）皆作者設定，不宣稱符合任何實際捲尺標準或精度等級。

新增專用sampler：以`k = round(u·100)`找最近刻線，長度依k的1／5／10 mm階層決定，墨 = `smooth(1 − d²/w²)`乘以上下0.004斜坡，超出刻線寬度即為0，因此最近刻線擁有權在半毫米處切換時不會跳變；凹弧高度 = `0.1 + 0.55·(0.5+0.5cos 2πv)`，兩緣斜率為0，故跨tile C1，緣部並帶AO（至多0.25）。cache只有64²紙／塗層grain（4,096 Float64／32,768 B lattice算術預算，非總RAM）。顏色是顏料，墨線height 0.04 relief；金屬factor為0（塗裝捲尺）、無mortar。預設0.1 m nominal tile與0.03 UV-relative relief（非公尺位移）皆作者設定；我先用0.01，實看後發現法線過平，改為0.03。三seed（0／1／0xffffffff）量測：v = tickTop + 0.1處100條刻線全暗（color 0.016–0.043）、刻線之間color≥0.886；在長度0.25／0.35處分別有20／10條暗刻線、超過最長刻線則為0；整體color 0.016–0.915、height 0.100–0.653 relief、AO 0.75–1、roughness 0.375–0.544；seed7的512²中r／g／b平均約(217,185,35)、黃色像素（r>180、g>150、b<70）占94.3%、r<100占4.3%、法線max tilt²約0.111。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`ledmatrix`（LED點陣面板）使目前目錄910→911種，含plain的gallery為912項。48×48顆圓形LED，分成8×6個字元格（每格5×7顆LED加一欄一列空白）；每格隨seed點亮2–4條隨機的水平、垂直或斜向短筆畫（偽字形，不是字型），亮的LED為紅橘色高亮、暗的為暗紅，LED透鏡光滑而略凸，黑色底板較粗糙、帶AO。不是真實字型或可讀文字、捲動動畫、發光（emission）、混色或RGB子像素。

此材質是作者依一般LED點陣顯示面板結構所作示意，沒有引用特定來源文件、照片或量測；LED數、字元格大小、筆畫產生規則、色調、roughness、AO與0.16 m nominal tile皆作者設定，不宣稱符合任何實際產品。

新增專用sampler：建構時依seed以`hash`為每個字元格抽出筆畫並寫入2,304項Uint8亮燈表，另有2,304項Float64亮度抖動（共2,304 B＋18,432 B = 20,736 B lattice算術預算，非總RAM）。採樣時每顆LED擁有自己的方格，透鏡 = `smooth(1 − q/r²)`且r = 0.46 < 0.5，於格界歸零（值與斜率），因此亮暗色調不會在格界跳變；底板在透鏡之間露出。顏色是顏料（沒有emission），亮LED再加0.1的透鏡高光色調；height只用於法線與AO；金屬factor為0、無mortar。預設0.16 m nominal tile與0.004 UV-relative relief（非公尺位移）皆作者設定。我先把litTone設為0.88，探測發現亮LED的color最高達1.0199（超出[0,1]），改為0.84後亮LED color為0.900–0.980。三seed（0／1／0xffffffff）量測：亮燈比例12.9–14.1%、亮LED color 0.900–0.980、暗LED 0.150–0.170、透鏡高度1.0 relief／底板0、透鏡roughness 0.17／底板0.62、底板AO 0.55／透鏡1、底板color 0.02；seed 0與1的亮燈遮罩有21.5%的LED不同；seed7的512²中r平均48.0、r>160占3.07%、AO<200占67.6%、法線max tilt²約0.413。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`barcodelabel`（條碼標籤）使目前目錄909→910種，含plain的gallery為911項。一個tile是一張完整標籤寬度：左右各10模組靜區、Code 128 Start B 起始樣式（11模組）、9個資料符號（每個為6段交替的條／空寬度，各1–4模組、合計11模組）與13模組停止樣式，共143模組；條只佔v 0.1–0.9的標籤帶，上下是留白。黑色近黑碳粉（略高、略平滑）印在偏白粗糙紙面上，並有細紙纖維grain。不是可解碼的Code 128：資料符號是隨seed抽出的隨機寬度，沒有檢查碼、沒有奇偶（條寬和為偶、空寬和為奇）限制，也沒有人眼可讀文字、其他標籤元素或曲面。

結構依據實際閱讀的[Wikipedia「Code 128」](https://en.wikipedia.org/wiki/Code_128)：每個符號為三條黑條與三條空白、各1–4模組、合計11模組，且以條起、以空結束；停止樣式為13模組（含結尾2模組條）；左右靜區至少10模組。我使用的Start B位元樣式`11010010000`與停止樣式`1100011101011`來自我對標準樣式表的記憶，該頁擷取到的文字沒有包含這些表格，所以這兩串位元**未由該頁驗證**。外觀（黑條白紙、0.14 m tile、碳粉高度、roughness、紙色）皆作者設定，沒有引用特定標籤照片或量測。

新增專用sampler：建構時依seed以`hash`抽出9個符號（五段寬度各1–4、第六段由「合計11」推出並要求落在1–4，最多重試4,096次，失敗則回退為Start B寬度），組成143模組位元陣列；採樣時以x = fract(u)·143找模組，條邊在模組界線兩側各`edgeRamp/2 = 0.11`模組內以`smooth`混合（兩端斜率為0，故C1），標籤帶上下緣亦以0.012的`smooth`斜坡。cache為96²紙纖維grain（9,216 Float64／73,728 B）加143項模組位元陣列。顏色是顏料，碳粉height 0.35 relief、紙grain至多0.1；金屬factor為0、無mortar、AO 1。預設0.14 m nominal tile與0.0006 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、512²取樣：color<0.5占30.1–34.8%、最低color 0.0276、最高0.982、碳粉平均高度約0.39 relief對紙面約0.055、roughness 0.445–0.575；seed7的512²中r平均173.3、r<128占31.1%、法線max tilt²約0.0036。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`topographicmap`（等高線地形圖紙）使目前目錄908→909種，含plain的gallery為910項。暖米白紙面上以定值寬度的棕色等高線印出一塊由7個整數波數正弦疊成的地形（16個等高階、每5條一條較粗較深的計曲線），紙面隨高度有極淡的色調變化與細紙纖維grain；墨線略高於紙面。不是真實地形資料、標高註記、水系、道路、網格或圖例文字。

此材質是作者依「等高線地形圖」一般樣式所作示意，沒有引用特定來源文件、照片或量測；等高階數、計曲線間隔、線寬、墨色、紙色與0.3 m nominal tile皆作者設定，不宣稱符合任何實際地圖規格或比例尺。

新增專用sampler：以7個整數波數、含seed決定相位與±20%振幅抖動的正弦疊成週期解析地形（C∞），等高線距離以`sin²(πd)/π² ÷ (levels·|∇|)²`換算成UV空間距離平方（|∇|加下限0.4使山頂與鞍部平滑），因此線寬不隨坡度變寬；線 = `smooth(1 − 距離²/寬²)`，計曲線權重 = `((1+cos(2πd/5))/2)^6`，故線寬與墨色皆C∞。cache為128²紙纖維grain加7相位與7振幅，共16,398 Float64／131,184 B lattice算術預算（非總RAM）。顏色是顏料，墨線height 0.6 relief、紙面grain至多0.15；金屬factor為0、無mortar、AO 1。預設0.3 m nominal tile與0.0015 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、512²取樣：color<0.7（含邊緣漸層）占9.3–10.5%、color<0.45占6.7–7.6%、最低color 0.14（計曲線墨色）、最高0.925–0.930、平均0.839–0.846、墨線平均高度約0.575 relief對紙面約0.077；seed 0與1的墨線遮罩有17.6%像素不同；seed7的512² base color平均約(222,206,180)、b<170占10.9%、法線max tilt²約0.111。我先實看了首版渲染，確認線寬在平坦與陡峭區都大致一致後才定稿。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`eastindianrosewood`（東印度黃檀）使目前目錄907→908種，含plain的gallery為909項。近似Dalbergia latifolia未塗裝縱向木面：深紫褐底色、5條較暗近黑的起伏條紋、細縱向纖維紋與散布短小開放導管凹點（約1.2%）。不是金褐色淺色面、白色邊材、拋光面、交錯／波浪紋或油脂光澤。

外觀依據實際閱讀的[Wood Database East Indian Rosewood](https://www.wood-database.com/east-indian-rosewood/)（Color／Appearance：心材由金褐到深紫褐，帶更暗近黑的條紋，隨時間變深、通常成深褐）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/dalbergia-latifolia-1-300x600.jpg)（深褐帶紫調的縱向木面、較暗條紋與細孔）；僅作配色與紋理形態參考，不重現金褐淺色變化、淺色邊材或真實導管分布，不打包來源圖，也不由照片反推真色、roughness或實際尺寸。

直接fallthrough重用既有Padauk／Bloodwood系細長橢圓導管sampler（與`blackwalnut`、`teak`、`honduranmahogany`、`shagbarkhickory`同路徑），constructor只選preset：40×14個導管site（pose表17,920 B）、5條起伏明顯（bandWarp 0.8）且對比高（bandContrast 0.45）的暗帶、220×9縱向fiber、128²細grain與固定3×4 warp，共20,616 Float64／164,928 B lattice算術預算（非總RAM）。金屬factor為0；導管凹點是真的height凹陷，色紋只是顏料。預設0.18 m nominal tile與0.0025 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：導管占1.18–1.22%，本體色0.255–0.908，橫／縱色差比8.6–10.2，roughness 0.460–0.564，高度0.42–0.503 relief；seed7的512²平均base color約(97,61,49)、導管占1.18%、法線max tilt²約0.0052。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`lenticularsheet`（柱狀透鏡印刷片）使目前目錄906→907種，含plain的gallery為908項。每tile 32條平行的圓柱透鏡（沿v方向的長條），透鏡頂高亮光滑、透鏡間接縫低且較粗糙並帶AO（0.65）；底色為藍銀漸層，由斜向「翻轉」條紋（每透鏡2個週期、沿v 3個週期）與8×8低頻印刷影像疊成。不是真實的多幀交錯影像、隨視角變化的動畫、透鏡折射或可讀的圖案。

此材質是作者依「柱狀透鏡印刷片」一般結構所作的示意，沒有引用特定來源文件、照片或量測；透鏡數、色調、翻轉條紋、roughness、AO與0.1 m nominal tile皆作者設定，不宣稱符合任何實際產品或光學規格。

新增專用sampler：每透鏡f = fract(u·32)，透鏡高度 = 0.5 − 0.5·cos(2πf)（頂與縫的斜率皆0，故跨透鏡C1），翻轉條紋 = sin(2π(2f + 3v))（整數週期故隨tile wrap），再加8×8 cachedNoise低頻影像（64 Float64／512 B lattice算術預算，非總RAM）。顏色是顏料，height只用於法線與AO；金屬factor為0、無mortar。預設0.1 m nominal tile與0.008 UV-relative relief（非公尺位移）。三seed（0／1／0xffffffff）、256²取樣：頂高度1.0 relief、縫0.1、頂roughness 0.1、縫0.4、頂AO 1、縫0.65；color域約0.094–0.902；橫／縱色差比約21.0–21.1；沿透鏡頂沿v的翻轉色幅0.25–0.30到0.87–0.90；seed 0與1的影像色差平均0.070；seed7的512²中藍通道平均179.1、AO<230占37.5%、法線max tilt²約0.323。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`europeanlarch`（歐洲落葉松）使目前目錄905→906種，含plain的gallery為907項。近似Larix decidua未塗裝弦切面：淡粉紅褐／淡黃褐的早材底，12條流動的紅褐晚材年輪線（中等偏寬、約占面積四分之一、彎曲起伏並有拱形），帶細縱向纖維紋。不是樹脂囊、節、窄而近白的邊材與心材界線、螺旋紋或塗層。

外觀依據實際閱讀的[Wood Database European Larch](https://www.wood-database.com/european-larch/)（Color／Appearance：心材由黃到中等紅褐、窄邊材近白且與心材分明、弦切面生長輪呈現許多特色紋樣；Grain／Texture：多直紋或螺旋紋、中到細質地、帶油脂感）與實際下載並實看的[弦切面照片](https://www.wood-database.com/wp-content/uploads/european-larch-s-400x400.jpg)（淡粉褐面、流動的紅褐年輪線與拱形）；僅作配色與紋理形態參考，不重現邊／心材界線、節或油脂光澤，不打包來源圖，也不由照片反推真色、roughness或實際尺寸。開發中我先把warp設為1.4，渲染成封閉的漩渦環，與照片不符；實看後降到0.55、年輪數12、arch 2.2，波動仍偏規律但接近照片的流動拱形。

直接fallthrough重用`douglasfir`年輪sampler（與`longleafpine`、`westernredcedar`、`sitkaspruce`同路徑），constructor只選新preset（rings 12、arch 2.2、warp 0.55、latewood 0.45–0.9、lateTone 0.52、earlyTone 0.86）；warp 36＋fiber 180×6＋128²細grain共17,500 Float64／140,000 B lattice算術預算（非總RAM）。金屬factor為0，晚材略高，年輪紋色是顏料。預設0.2 m nominal tile與0.003 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：晚材色（color<0.6）占25.7–26.5%、早材色（>0.75）占62.6–63.6%、色域0.316–0.907、roughness 0.531–0.610、高度0.498–0.662 relief、橫／縱色差比2.84–2.88；seed7的512²中g≥165占69.9%、g<165占30.1%、法線max tilt²約0.028、平均base color約(220,176,142)。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`shagbarkhickory`（粗皮山胡桃木）使目前目錄904→905種，含plain的gallery為906項。近似Carya ovata未塗裝縱向木面：偏淺的黃褐／淡棕底色、中等質地、3條寬而起伏的較暖淺褐條紋（近似心／邊材交錯的calico感）、細長的縱向纖維紋，以及散布的短小開放導管凹點。不是紅褐心材主導的深色面、環孔材大型早材導管列、交錯／波浪紋、塗層或實際心邊材邊界。

外觀依據實際閱讀的[Wood Database Shagbark Hickory](https://www.wood-database.com/shagbark-hickory/)（Color／Appearance：心材淺到中等棕且帶紅調、邊材較淡的黃褐，心邊材對比的板材被稱為Calico Hickory；Grain／Texture：多直紋、偶有波浪、中等質地；Endgrain：ring-porous，早材導管大到極大且呈單列）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/shagbark-hickory-400x400.jpg)（淡黃褐面、縱向條紋與細孔）；僅作配色與紋理形態參考，不重現環孔材早材導管列或真正的心／邊材邊界，不打包來源圖，也不由照片反推真色、roughness或實際尺寸。

直接fallthrough重用既有Padauk／Bloodwood系細長橢圓導管sampler（與`blackwalnut`、`blackcherry`、`teak`、`honduranmahogany`同一路徑），constructor只選preset：40×14個導管site（Float64×4共17,920 B pose表）、3條起伏明顯（bandWarp 0.7）且對比中等（bandContrast 0.25）的帶、240×10縱向fiber與128²細grain（含warp共21,036 Float64／168,288 B lattice算術預算，非總RAM）。金屬factor為0；導管凹點是真的height凹陷，縱向色紋只是顏料。預設0.18 m nominal tile與0.002 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：導管占0.77–0.82%，本體色0.254–0.728，橫／縱色差比11.89–12.2，roughness 0.520–0.624；seed7的512²平均base color約(195,158,111)、導管占0.78%、法線max tilt²約0.0015。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`monitorlizardskin`（巨蜥風格顆粒狀鱗皮）使目前目錄903→904種，含plain的gallery為905項。14欄×16列的六角緊密排列圓形隆起鱗片（奇數列錯半欄），每片有自己的色調（標準差約0.09–0.10）、略亮、較光滑，鱗間是窄而深的暗溝（AO 0.4、color 0.04、roughness 0.7）；4條橫向的深淺色帶沿v方向起伏，整體為橄欖褐色。不是特定物種的鱗片形狀／大小分區、斑點或環紋，沒有腹鱗、背脊或皮褶。

此材質是作者依「巨蜥類粗顆粒鱗皮」的一般印象所作示意，沒有引用特定來源文件、照片或量測；我閱讀的[Wikipedia「Monitor lizard」](https://en.wikipedia.org/wiki/Monitor_lizard)導言只描述屬別、分布與體型，未描述皮膚，所以鱗片尺寸、色調、色帶、roughness、AO與0.14 m nominal tile皆作者設定，不宣稱符合任何實際物種或個體。

新增專用sampler：以六角緊密排列（奇數列偏移半欄、取上下相鄰三列）找最近鱗片中心，鱗片 = `smooth(1 − q/r²)`，半徑 r = 0.5 為六角Voronoi內切半徑，使鱗片在擁有權切換前歸零（因此各鱗各自的色調查表不產生跳變），中心與邊緣斜率皆0；14×16格表（224個每鱗色調Float64）與160²細grain共25,824 Float64／206,592 B lattice算術預算（非總RAM）。列數為偶數，錯位奇偶與4條橫向色帶才隨tile週期。金屬factor為0、無mortar；預設0.14 m nominal tile、0.01 UV-relative relief（非公尺位移）。我先試了半徑0.48與0.9的橫向壓扁，但壓扁會使擁有權邊界出現未歸零的跳變，已改回等向與半徑0.5。三seed（0／1／0xffffffff）量測：鱗頂高度0.780–0.795 relief、AO 1、color 0.336–0.701、roughness 0.550–0.609；同列相鄰鱗間的溝高度0.08、AO 0.4、color 0.04、roughness 0.7；每鱗色調標準差0.090–0.099。seed7的512²中r平均67.9、AO<180占55.3%、r<50占39.9%、法線max tilt²約0.17。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`sitkaspruce`（北美雲杉／Sitka spruce）使目前目錄902→903種，含plain的gallery為904項。近似Picea sitchensis未塗裝縱向木面：奶白偏淡黃的底色、極細而幾乎筆直的縱向年輪線（對比極低、年輪輕微起伏）與細纖維grain。不是bearclaw紋、粉紅紅色調、樹脂道、節疤、邊材／心材界線或塗層。

外觀依據實際閱讀的[Wood Database Sitka Spruce](https://www.wood-database.com/sitka-spruce/)（Color／Appearance：奶白到黃色，心材偶帶淡粉紅，邊材不明顯分界，部分有bearclaw紋；Grain／Texture：細而均勻的質地、一致的直紋；Endgrain：中型樹脂道）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/sitka-spruce-400x400.jpg)（奶白色面與極細淡色縱線）；僅作配色與年輪線形態參考，不重現bearclaw或粉紅色調，不打包來源圖，也不由照片反推真色、roughness或實際尺寸。

直接fallthrough重用`douglasfir`的年輪指標sampler（與`longleafpine`、`westernredcedar`同一路徑），constructor只選preset：22個ring係數（鏡像後橫跨tile 44條）、很小的縱向拱與skew、窄晚材（start 0.7／peak 0.93）與極低晚材色差（lateTone 0.24）。3個constructor cache為5×5 warp、200×5縱向fiber與128² grain（共17,409 Float64／139,272 B lattice算術預算，非總RAM）；金屬factor為0、無mortar，晚材略抬高、較光滑，早材AO略低。預設0.12 m nominal tile與0.002 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：color<0.6的暗線僅占0.47–0.62%、color>0.75占84.1–84.8%，color 0.580–0.882，橫／縱色差比15.0–15.15，roughness 0.462–0.530；seed7的512²平均base color約(244,226,187)、法線max tilt²約0.0027。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`honduranmahogany`（宏都拉斯桃花心木）使目前目錄901→902種，含plain的gallery為903項。近似Swietenia macrophylla未塗裝縱向木面：偏深的紅褐色、中等均勻質地、7條寬而幾乎筆直的低對比緞帶狀條紋（近似徑切的ribbon figure）與極稀疏、短小的開放導管凹點。不是淺粉褐色新切材、經年變深色、交錯／不規則／波浪紋、cathedral紋、閃光（chatoyancy）光學效果或塗層。

外觀依據實際閱讀的[Wood Database Honduran Mahogany](https://www.wood-database.com/honduran-mahogany/)（Color／Appearance：心材由淺粉褐到較深紅褐，隨年份變深，具chatoyancy；Grain／Texture：可直、交錯、不規則或波浪，中等均勻質地、中等光澤；Porosity：diffuse porous，生長輪常因邊緣薄壁組織帶而明顯）、前述實際閱讀的[Wood Database Black Walnut](https://www.wood-database.com/black-walnut/)中「徑切面的mahogany通常有ribbon紋」一句，以及實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/swietenia-macrophylla-alt.jpg)（均勻深紅褐面、細導管線，底部有一處巢狀年輪紋）；僅作配色與紋理形態參考，不重現巢狀年輪或chatoyancy，不打包來源圖，也不由照片反推真色、roughness或實際尺寸。

直接fallthrough重用既有Padauk／Bloodwood系細長橢圓導管sampler（與`blackwalnut`、`blackcherry`、`teak`同一路徑），constructor只選preset：56×18個導管site（Float64×4共32,256 B pose表）、7條幾乎筆直（bandWarp 0.18）低對比（bandContrast 0.1）緞帶、220×9縱向fiber與128²細grain（含warp共22,408 Float64／179,264 B lattice算術預算，非總RAM）。金屬factor為0；導管凹點是真的height凹陷，縱向色紋只是顏料。預設0.18 m nominal tile與0.0015 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：導管占0.145–0.197%，本體色0.255–0.459，橫／縱色差比9.28–10.34，roughness 0.420–0.523；seed7的512²平均base color約(128,68,38)、導管占0.156%、法線max tilt²約0.0008。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`woodenpalletdeck`（木棧板面板）使目前目錄900→901種，含plain的gallery為902項。一個tile內4塊沿u方向的木板，板間是約9%寬度的低窄深縫（AO 0.2、color≈0.02、高度0.04 relief），每塊板各有自己的整體色調、起伏的年輪線、長縱向纖維與細grain，板中線上每個tile有2顆深色略凸的圓形釘頭（每板位置有微小偏移）。不是完整棧板（沒有橫梁／縱梁、板端、裂縫、節疤或金屬釘的金屬性）。

概念依據實際閱讀的[Wikipedia「Pallet」](https://en.wikipedia.org/wiki/Pallet)導言：pallet（skid）是供堆高機等抬升、穩定承載貨物的平面運輸結構，多數為木製。該條目不提供板寬、釘距或顏色，因此板數、縫寬、釘頭尺寸／位置、色彩、roughness與0.4 m nominal tile皆為作者設定，不宣稱符合任何棧板標準或實物。

新增專用sampler：以`fract(v)·4`分出板號與板內位置，縫與釘頭皆為到各自邊的smoothstep（在板交界前已歸零，所以逐板查表不產生跳變），年輪線為`sin(2π(rings·fy + warp·noise + 每板相位))`、另有6×96縱向fiber與160²細grain；每板色調與釘位偏移只在constructor以hash抽取（共12個Float64）。cache共25 + 576 + 25,600 + 12 = 26,213 Float64（含每板表12個），約209,704 B lattice算術預算（非總RAM）。釘頭是dielectric（metallic 0），僅降低roughness；金屬factor為0、無mortar。預設0.4 m nominal tile、0.006 UV-relative relief（非公尺位移）。三seed（0／1／0xffffffff）量測：縫color 0.02、AO 0.2、高度0.04 relief；板面color 0.388–0.765、高度0.575–0.648 relief、roughness 0.78–0.86；板中線每板恰有2個寬約0.042–0.045的釘頭（color 0.2、高度約0.78 relief）；各板平均色差於seed間可見（seed0板均值0.502–0.655、seed1 0.552–0.683）。seed7的512²中r平均129、AO<100的縫占10.9%、法線max tilt²約0.21。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`forgedcarbon`（鍛造碳纖維風格複合材）使目前目錄899→900種，含plain的gallery為901項。10×10格、每格5個隨機位置／方向／長寬／灰階與疊放權重的圓角長條碎片，覆蓋在近黑樹脂背景上；碎片內有細密的平行編織漣漪（沿碎片長軸）與輕微高度／粗糙度起伏，整體為亮面（roughness約0.18–0.30）。不是規則斜紋或平紋編織（那是既有`carbonfiber`），沒有環氧樹脂厚度、反射清漆或金屬光澤。

此材質是作者依一般鍛造（forged）／短切碳纖維複合材外觀所作示意，沒有引用特定來源文件、產品照片或量測，因此不宣稱符合任何實際製程、纖維長度、碎片尺寸、纖維方向統計或色彩；色調、roughness、高度與0.2 m nominal tile皆作者設定。

新增專用sampler：constructor填10×10×5個碎片表（每片9個Float64：中心、cos／sin、1/半長²、1/半寬²、灰階、疊放權重、漣漪相位；共4,500 Float64／36,000 B）。取樣時搜尋周圍3×3格，每片碎片為四次方超橢圓smoothstep涵蓋度，顏色取「涵蓋度×疊放權重」加權平均並加入權重0.25的背景（光滑函數之商、分母恆正），所以碎片邊緣與重疊C1；碎片中心跨滿所屬格、半長≤0.64，使每片都落在被搜尋的3×3格內。另160² grain（25,600 Float64，合計30,100 Float64／240,800 B lattice算術預算，非總RAM）。初版背景權重0.02使邊緣過窄（局部坡度約7,700／UV、C1掃描最大值0.035超過我設的0.03），調為0.25後掃描最大值≤0.007。金屬factor為0、無mortar；預設0.2 m nominal tile、0.0012 UV-relative relief（非公尺位移）。三seed（0／1／0xffffffff）、256²取樣：color 0.039–0.592、color<0.1的背景占18.8–20.4%、0.2–0.4的中灰碎片占49.6–52.2%、>0.45的亮碎片占6.6–10.2%、roughness 0.178–0.303，橫／縱色差比0.993–1.027；seed 0與1的平均色差0.158。seed7的512²中r平均49.2、最大98，r<25占20.3%、r>70占15.4%，法線max tilt²約0.0089。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`popcornceiling`（爆米花／吸音天花板噴塗）使目前目錄898→899種，含plain的gallery為900項。20×20格、每格一個隨機偏移、半徑與高度各異的圓形顆粒（半徑0.55–0.85格）以`1 − Π(1 − 顆粒)`軟合併，形成起伏不規則的顆粒團，顆粒間為較低且被遮蔽的谷（AO約0.55）；偏白微暖，帶細斑點grain，粗糙度高。沒有水漬、剝落、刮平區、纖維（石棉）或接縫。

概念依據實際閱讀的[Wikipedia「Popcorn ceiling」](https://en.wikipedia.org/wiki/Popcorn_ceiling)導言：噴塗或刷塗的凹凸天花板處理，凹凸由微小蛭石或聚苯乙烯顆粒形成，有細、中、粗等級。該條目未提供顆粒尺寸或色彩，故顆粒半徑、高度、色調、roughness與0.25 m tile皆作者設定；材質只描述外觀，不含也不暗示任何材料成分（包含早期配方可能含石棉的歷史說明）。

新增專用sampler：constructor填20×20格的顆粒表（中心x／y、1/半徑²、高度，共1,600 Float64／12,800 B），取樣時計算周圍3×3格顆粒的smoothstep圓帽並以`1 − Π(1 − b)`合併，故C1且有界；半徑與偏移使每顆粒不會超出被搜尋的3×3格，tile則以格索引取模週期。另有160² grain（共25,600 + 1,600 = 27,200 Float64／217,600 B lattice算術預算，非總RAM）。金屬factor為0、無mortar；預設0.25 m nominal tile、0.006 UV-relative relief（非公尺位移）。三seed（0／1／0xffffffff）、256²取樣：高度0.100–0.918 relief、高度>0.6占53.0–54.0%、<0.3占17.5–18.2%、AO 0.55–1、color 0.516–0.962、roughness 0.895–0.945，橫／縱高度變化比0.978–1.005（各向同性）；seed 0與1的平均高度差0.243 relief。seed7的512²中r平均231、範圍210–247，AO<180占22.9%，法線max tilt²約0.148。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`kilimdiamonds`（kilim風格階梯菱形平織）使目前目錄897→898種，含plain的gallery為899項。64×64個緯線格組成的平織場：每個16格的方塊中心與四角各有一個同心階梯菱形，菱形由四個寬2格的環（深褐／奶白／中間灰褐／奶白，角上菱形的色調順序對調）構成；每列有微小的色調差異，每格有一道橫向緯線凸脊與細纖維grain。不是特定地區或部族的圖案，沒有流蘇、邊飾、起絨或斷緯（slit）幾何。

概念依據實際閱讀的[Wikipedia「Kilim」](https://en.wikipedia.org/wiki/Kilim)：kilim是傳統上產於波斯帝國舊地、土耳其與巴爾幹等地的平織（tapestry-woven）地毯。該條目導言未提供具體紋樣或尺寸，因此階梯菱形的圖案、環寬、色調、roughness與0.32 m tile皆為作者設定，**沒有**引用特定來源的紋樣照片或實物，不宣稱忠實再現任何傳統紋樣。

新增專用sampler：constructor先填一個64×64的`Float64Array`格色調表（32,768 B），每格依到最近菱形中心的曼哈頓距離決定環序號（centerTones／cornerTones各4個色調）並加列變異；取樣時以零斜率smoothstep權重在格邊界雙線性混合，邊緣柔和但C1，格索引依64取模，故tile週期。每格一道週期的橫向緯線脊`0.5 − 0.5·cos(2π·64v)`，另有128² grain（共16,384 + 4,096 = 20,480 Float64／163,840 B lattice算術預算，非總RAM）。金屬factor為0、無mortar；預設0.32 m nominal tile（每格5 mm為作者設定）、0.003 UV-relative relief（非公尺位移）。三seed（0／1／0xffffffff）：每格中心色與預期環色調最大差0.058–0.059，總色域0.042–0.978，緯線脊使格中心比列界高約0.14 relief；seed7的512²中r<80占15.2%、r>180占54.6%、法線max tilt²約0.0056。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`teak`（柚木縱向面）使目前目錄896→897種，含plain的gallery為898項。近似Tectona grandis心材未塗裝縱向木面：金黃到中等棕色底、直而不均勻的粗質地、長而起伏的深棕縱向條紋與散布的短小開放導管凹點。不是已老化的深色柚木、邊材、波浪／交錯紋figure、油亮塗層，也不是導管內淺色矽質沉積。

外觀依據實際閱讀的[Wood Database Teak](https://www.wood-database.com/teak/)（Color／Appearance：心材金黃或中棕、隨年份變深；Grain／Texture：多直紋，偶有波浪或交錯、粗而不均的質地、中到低光澤、未處理表面略帶油脂感；Porosity：ring-porous或semi-ring-porous）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/tectona-grandis.jpg)（棕色面、長深色縱條紋與淺色導管斑點）；僅作配色與紋理形態參考。本preset的導管是深色高度凹陷，不重現照片中的淺色導管斑；不打包來源圖，也不由照片反推真色、roughness或實際尺寸。

直接fallthrough重用既有Padauk／Bloodwood系細長橢圓導管sampler（與`blackwalnut`、`blackcherry`同一路徑），constructor只選preset：36×12個導管site（Float64×4共13,824 B pose表）、5個強起伏帶（bandWarp 0.9、bandContrast 0.28）、240×10縱向fiber與128²細grain（含warp共20,524 Float64／164,192 B lattice算術預算，非總RAM）。金屬factor為0；導管凹點是真的height凹陷，縱向色紋只是顏料。預設0.2 m nominal tile與0.003 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：導管占0.96–1.02%，本體色0.254–0.758，橫／縱色差比11.25–12.98，roughness 0.600–0.703，導管比本體低約0.092–0.093 relief；seed7的512²平均base color約(139,90,38)、導管占1.03%、法線max tilt²約0.010。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`blackcherry`（美洲黑櫻桃木）使目前目錄895→896種，含plain的gallery為897項。近似Prunus serotina心材的未塗裝縱向木面：均勻的中等紅褐色、細而平直的縱向纖維紋、極低對比的寬弱帶，以及極稀疏、短而小的深色導管凹點。不是淺色邊材條帶、捲紋figure、樹膠袋／深色礦物斑、塗層或加深後的老化色。

外觀依據實際閱讀的[Wood Database Black Cherry](https://www.wood-database.com/black-cherry/)（Color／Appearance：心材新切為淺粉褐，隨時間與光照轉為中等紅褐，邊材寬而淡黃；Grain／Texture：多直紋、細而均勻的質地、中等自然光澤；Porosity：semi-ring-porous到diffuse-porous）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/prunus-serotina.jpg)（均勻紅褐面、左緣淺色邊材、少數小深色斑）；僅作配色與紋理形態參考，不重現邊材條帶或深色斑，不打包來源圖，也不由照片反推真色、roughness或實際尺寸。

直接fallthrough重用既有Padauk／Bloodwood系細長橢圓導管sampler（與`blackwalnut`同一路徑），constructor只選preset：48×16個導管site（Float64×4共24,576 B pose表）、3個弱帶、200×8縱向fiber與128²細grain（含warp共21,068 Float64／168,544 B lattice算術預算，非總RAM）。金屬factor為0；導管凹點是真的height凹陷，縱向色紋只是顏料。預設0.18 m nominal tile與0.0015 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：導管占0.11–0.14%，本體色0.253–0.399，橫／縱色差比7.95–8.29，roughness 0.450–0.553；seed7的512²平均base color約(155,93,54)、法線max tilt²約0.0008。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`golfballdimples`（高爾夫球風格凹坑）使目前目錄894→895種，含plain的gallery為896項。7欄×8列的六角緊密排列圓形淺凹坑（奇數列錯半欄），凹坑為半徑0.46欄的球碗狀，碗中央較低、較暗（AO 0.55）且較粗糙，凹坑之間是較高、光滑、略亮的窄平台；整體為偏白的亮面塑膠。不是完整球體曲率、接縫線、印字或實際球上的凹坑數／分布。

此材質是作者依一般高爾夫球凹坑外觀所作的平面示意，沒有引用特定來源文件、產品照片或量測，因此不宣稱符合任何實際球種、凹坑直徑／深度／數量或規範；色彩、roughness、AO、層高與0.028 m nominal tile（7欄、每欄4 mm）皆作者設定。7×8是為了讓六角列距（7/8≈0.875）近似理想的0.866且列數為偶數、錯位奇偶才能隨tile週期對齊。

新增專用sampler：以各列的最近凹坑中心（奇數列偏移半欄、取上下相鄰三列）計算等向距離平方`q`，凹坑 = `smooth(1 − q/r²)`，在中心與邊緣的斜率皆為0，所以碗形與平台為C1；列數為偶數使錯位奇偶隨v週期對齊。只快取128² grain（16,384 Float64／131,072 B lattice算術預算，非總RAM）。金屬factor為0、無mortar；預設0.012 UV-relative relief（非公尺位移；提高到此值是因0.0012時法線幾乎全平）。三seed（0／1／0xffffffff）量測：碗心高度0.220–0.226 relief、碗心AO 0.55、碗心roughness 0.441–0.479；同列相鄰凹坑中點的平台高度0.620–0.626、AO 1、roughness 0.321–0.360；256²取樣AO<0.9占52.9%。seed7的512²平均base color r約231.8、AO<230占52.8%、法線max tilt²約0.030。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`laptopkeycaps`（chiclet筆電鍵帽）使目前目錄893→894種，含plain的gallery為895項。8×8格方陣，每格一顆圓角方形深色霧面鍵帽（以四次方超橢圓為輪廓，半寬0.43格，約占面積68%），鍵頂中央微凹（越近鍵緣越高），鍵與鍵之間是深色低窄縫（AO 0.25、roughness≥0.9）；每顆有細微不同的色調、霧面細grain與邊緣高光。沒有字符、背光、鍵軸或機身。

此材質是作者依一般chiclet（島狀）鍵盤外觀所作示意，沒有引用特定來源文件、產品照片或量測，因此不宣稱符合任何實際鍵盤、鍵距、鍵帽輪廓或材料；色彩、roughness、AO、層高與0.152 m nominal tile（8格、每格19 mm）皆作者設定。

新增專用sampler：`s = ((dx/hw)²)² + ((dy/hw)²)²`是四次方超橢圓多項式，`smooth(clamp((1−s)/bevel))`得到C1的圓角方形，鍵在到達格界前已歸零，所以`fract()`換格及每鍵tone查表不影響連續性；頂面高度 = topHeight − dishDepth·(1 − r²)。constructor快取64個每鍵tone（512 B）與160²霧面stipple（共25,664 Float64／205,312 B lattice算術預算，非總RAM）。金屬factor為0、無mortar；預設0.004 UV-relative relief（非公尺位移）。三seed（0／1／0xffffffff）量測：鍵心高度0.620–0.632 relief、距鍵心0.75半寬處0.649–0.660（凹面向外升高）、縫高度0.06、縫AO 0.25；256²取樣AO>0.9占68.4%；每鍵tone標準差0.022–0.024。seed7的512²中r<20的縫占32.9%、r≥30的鍵面占66.9%、法線max tilt²約0.465（鍵緣陡）。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`qrcodelabel`（QR風格印刷標籤）使目前目錄892→893種，含plain的gallery為894項。一張紙質標籤佔滿一個tile：29×29個模組外加四模組寬的白色安靜區（共37×37）；左上、右上、左下各有7×7的finder pattern（深外框、淺環、3×3深核心）及白色separator，第6列／行有深淺交替的timing pattern，右下有5×5 alignment pattern，其餘為依seed決定的偽隨機資料模組。深色油墨在淺色帶細纖維grain的紙上。**這不是可解碼的QR**：沒有編碼訊息、格式資訊、遮罩或錯誤更正，僅是QR風格的外觀。

結構概念依據實際閱讀的[Wikipedia「QR code」](https://en.wikipedia.org/wiki/QR_code)：三個位於左上、右上與左下的finder pattern（三層同心方形）以及第四角附近的較小方形。29×29模組、四模組安靜區、7×7／5×5尺寸、timing位置、油墨與紙色、roughness、0.05 m tile皆作者設定，沒有逐條對照ISO／IEC 18004，不宣稱符合任何QR版本或可被掃描。

新增專用sampler：constructor依seed與hash填一個37×37的`Uint8Array`（1,369 B）模組表，取樣時以smoothstep權重在模組邊界附近雙線性混合相鄰四模組，權重在模組中心保持零斜率，因此邊緣窄但C1，且模組索引以tile大小取模，整張標籤週期重複。另有128²紙grain與48²纖維兩個cache（共18,688 Float64／149,504 B）。金屬factor為0、無mortar；預設0.05 m nominal tile、0.0006 UV-relative relief（非公尺位移）。三seed（0／1／0xffffffff）以模組中心實測：油墨color恆為0.04、紙color 0.876–0.925；資料區（排除finder／timing／alignment）深色占46.9%／49.1%／50.4%，seed0與seed1資料位置有49.1%不同；seed7的512²中r<60占28.3%、r>200占66.8%，法線max tilt²約0.0004。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`perforatedhardboard`（棕色鑽孔硬纖維板）使目前目錄891→892種，含plain的gallery為893項。16×16格的方格陣列，每格中心有一個圓形暗色不透明孔（孔半徑0.13格、孔徑約占5.1%面積），孔緣有略暗的圓角環；孔間為連續的棕色回火硬纖維板面，含細纖維grain、較大的碎屑斑與低頻光澤起伏。孔不是透明通孔（不含背景穿透），也不含掛鉤、螺絲或金屬板。

概念依據實際閱讀的[Wikipedia「Perforated hardboard」](https://en.wikipedia.org/wiki/Pegboard)：回火硬纖維板（以亞麻仁油薄層塗佈並高溫烘烤）預鑽等距孔，Peg-Board為Masonite舊商標、常泛稱穿孔收納板。**未**查看或引用任何實物照片／規格圖，故孔距、孔徑、色彩、roughness與0.4 m tile皆為作者設定，不宣稱符合任何標準孔徑／孔距或商品。

新增專用sampler：以到每格中心的距離`r`做smoothstep孔洞與圓角環，兩者在格內自行歸零，所以`fract()`換格不影響連續性與C1；孔外為`(base + sheen + grain + fleck − rim)`，孔內為近黑色、低高度、AO約0.15、roughness≥0.92。3個constructor cache為192²細grain、64²碎屑斑與6²光澤（共40,996 Float64／327,968 B lattice算術預算，非總RAM）；金屬factor為0、無mortar。預設0.4 m nominal tile、0.004 UV-relative relief（非公尺位移）。三seed（0／1／0xffffffff）量測：孔心color≤0.04、高度≤0.02 relief；板面color 0.486–0.671、AO 1、高度0.60–0.67 relief；圓角環AO 0.875；256²取樣AO<0.5占4.69%。seed7的512²平均base color約(98,66,41)、r<60的暗孔占5.08%、法線max tilt²約0.415（孔緣陡）。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`westernredcedar`（北美香柏紅褐直紋）使目前目錄890→891種，含plain的gallery為892項。近似Thuja plicata未塗裝縱向木面：偏紅的金褐色底、細而平行的暗色年輪線，年輪輕微起伏。不是邊材、較暗的紅褐隨機條帶、節疤、塗層或Douglas-fir式大型尖拱，也沒有樹脂道（此樹種原本即無樹脂道）。

外觀依據實際閱讀的[Wood Database Western Red Cedar](https://www.wood-database.com/western-red-cedar/)（Color／Appearance：心材紅到粉褐色且常有更暗的隨機條帶、邊材黃白；Grain／Texture：直紋、粗質地、中等光澤；Resin canals：無）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/thuja-plicata.jpg)（金褐色底配細密平行暗線）；僅作配色與年輪線形態參考，不重現來源的隨機暗帶或邊材，不打包來源圖，也不由照片反推真色、roughness或實際尺寸。

直接fallthrough重用`douglasfir`的年輪指標sampler，constructor只選preset：20個ring係數（鏡像後橫跨tile 40條）、很小的縱向拱與skew、窄晚材（start0.7／peak0.92）與低晚材色差，得到細而低對比的線。3個constructor cache為5×5 warp、192×5縱向fiber與128² grain（共17,369 Float64／138,952 B lattice算術預算，非總RAM）；金屬factor為0、無mortar，晚材略抬高、較光滑，早材AO略低。預設0.12 m nominal tile、0.003 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：color<0.5的暗線占12.2–12.5%、color>0.6占81.0–81.7%，橫／縱色差比11.9–12.1，晚材比早材高約0.12 relief；seed7的512²平均base color約(148,100,54)、法線max tilt²約0.012。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`chesterfieldleather`（Chesterfield菱格縫釦棕色皮革）使目前目錄889→890種，含plain的gallery為891項。6×6格的每隔一格中心有一顆小釦（每tile 18顆），釦與釦之間以斜向折線連接，其間為鼓起的菱形軟墊；折線處深暗且AO低，軟墊頂較亮、較光滑。棕色皮革細grain與低頻皺紋。不是真實家具尺寸或特定產品的幾何，沒有釦面金屬、縫線、皮革破裂或透明孔洞。

此材質是作者依一般菱格縫釦（diamond-tufted）皮革外觀所作的示意，沒有引用特定來源文件、產品照片或量測，因此不宣稱符合任何實際家具、釦距、皮革種類或顏色；色彩、roughness、AO、層高與0.5 m nominal tile皆作者設定。

新增專用sampler：兩個對角座標`a=u·N+v·N−1`、`b=u·N−v·N`各取到最近偶數的有號距離`da`／`db`；`smooth(clamp(|d|/pillowSpan))`在折線上的斜率為0，兩者相乘即菱形軟墊並維持C1；釦以到最近偶數格點的距離做smoothstep圓頂。N必須為偶數，tile才會週期對齊。constructor快取128² grain與24²皺紋共16,960 Float64／135,680 B lattice算術預算（非總RAM）。金屬factor為0、無mortar；預設0.5 m nominal tile、0.012 UV-relative relief（非公尺位移）。三seed（0／1／0xffffffff）量測：軟墊頂高度為0.688–0.717 relief、折線高度約0.08、釦高度約0.30；折線AO為0.5、軟墊頂AO為1；seed7的512²平均base color約(108,55,33)、AO<160占35.3%、法線max tilt²約0.040。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`longleafpine`（長葉松縱向年輪紋）使目前目錄888→889種，含plain的gallery為890項。近似Pinus palustris未塗裝木面：淡黃白早材與窄而高對比的橙褐色晚材條紋，年輪近乎平行、輕微起伏。不是樹脂道、節疤、紅褐心材整面、塗層或Douglas-fir式的大型尖拱。

外觀依據實際閱讀的[Wood Database Longleaf Pine](https://www.wood-database.com/longleaf-pine/)（Color／Appearance：心材紅褐、邊材黃白；Grain／Texture：直紋、細到中等質地；Endgrain：大型樹脂道多而均勻，早晚材過渡abrupt、色差高）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/longleaf-pine.jpg)（淡黃白底與平行橙褐晚材條紋）；僅作配色與條紋形態參考，不打包來源圖，也不由照片反推真色、roughness或實際尺寸。

直接fallthrough重用`douglasfir`的年輪指標sampler，constructor只選preset；本preset以較多年輪、很小的縱向拱與skew、較寬的晚材漸暗區和較強晚材色差取得近乎平行的條紋。3個constructor cache為5×5 warp、192×5縱向fiber與128² grain（共17,369 Float64／138,952 B lattice算術預算，非總RAM）；金屬factor為0、無mortar，晚材略抬高、較光滑，早材AO略低。預設0.12 m nominal tile、0.003 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：color<0.4晚材占21.1–24.0%、color>0.75早材占52.7–55.9%，橫／縱色差比12.0–12.9，晚材比早材高約0.19 relief；seed7的512²平均base color約(232,186,125)、法線max tilt²約0.030。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`douglasfir`（Douglas-fir弦切面）使目前目錄887→888種，含plain的gallery為889項。近似Pseudotsuga menziesii未塗裝弦切縱向木面：淺橙褐色早材、較暗橙褐色晚材年輪，年輪沿弦切面形成多重尖拱（cathedral）並圍繞較大的同心橢圓。不是節疤、樹脂囊／樹脂道、邊材／心材分界、塗層，也不是徑切（quartersawn）的平行直線年輪。

外觀依據實際閱讀的[Wood Database Douglas-Fir](https://www.wood-database.com/douglas-fir/)（Color／Appearance：淺褐帶紅或黃、年輪較暗，弦切可見強烈花紋；Grain／Texture：多直紋或略起伏、中到粗質地；Identification：樹脂道小到中型且稀疏，早晚材過渡abrupt）與實際下載並實看的[弦切樣板照片](https://www.wood-database.com/wp-content/uploads/pseudotsuga-menziesii.jpg)（巢狀弧形年輪與一處小節）；僅作配色與年輪形態參考，不打包來源圖、不重現節疤，也不由照片反推真色、roughness或實際尺寸。

新增專用sampler（非既有導管sampler的fallthrough）：以平滑週期cosine構成年輪指標場——橫向項、縱向拱項、斜向skew與seeded低頻warp——再取fract()通過兩端值與斜率皆為0的smoothstep年輪剖面（較寬的早材到晚材漸暗，之後abrupt回到早材），因此tile仍是C1週期。晚材略抬高並較光滑，早材AO略低；金屬factor為0、無mortar。3個constructor cache為5×5 warp、160×5縱向fiber與128² grain（共17,209 Float64／137,672 B lattice算術預算，非總RAM）。預設0.2 m nominal tile、0.0035 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：color<0.4晚材占15.2%、color>0.75早材占70.5–70.9%，橫向／縱向色差比2.95–3.09；seed7的512²平均base color約(214,165,107)、法線max tilt²約0.049。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`blackwalnut`（深巧克力褐色黑胡桃木弦切面）使目前目錄886→887種，含plain的gallery為888項。近似選定Juglans nigra心材的未塗裝弦切縱向木面：中深巧克力褐色、較暗的長縱向條紋、直紋到略起伏的紋理與稀疏短小的開放導管凹點。不是紫／灰偏色、邊材、捲紋／瘤／鳥眼／分叉figure、塗層，也沒有半環孔材由早材到晚材逐漸變小的導管梯度——導管凹點大小一致，僅為示意。

外觀依據實際閱讀的[Wood Database Black Walnut](https://www.wood-database.com/black-walnut/)（Color/Appearance：淺褐到深巧克力褐色並帶更暗的條紋；Grain/Texture：通常直紋、可不規則、中等質地、中等自然光澤；Porosity：semi-ring-porous），以及實際下載並實看的[弦切整板掃描](https://www.wood-database.com/wp-content/uploads/juglans-nigra-full.jpg)；僅作配色與紋理方向參考，不打包來源圖、不由照片反推真色、roughness或尺寸。

直接fallthrough重用既有Padauk／Bloodwood系細長橢圓導管sampler，constructor只選preset：40×14個導管site（Float64×4共17,920 B pose表）、4個帶狀起伏、192×9縱向fiber與128²細grain。M0、AO在導管處降低；導管凹陷為真height凹陷，縱向色紋只是顏料不抬高。預設0.16 m nominal tile與0.0025 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：導管占0.54–0.59%，本體色0.254–0.579，橫向與縱向色差比8.8–10.0；seed7的512²平均base color約(86,59,40)。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

`to92packagefaces`（TO-92封裝正面示意）使目前目錄885→886種，含plain的gallery為887項。2×2四個旋轉／微移的霧黑D形本體：直側、平底、上半橢圓穹頂；三支等間距平行直金屬腳有寬根肩與窄尾，本體遮住腳根。無TO-220金屬片、安裝孔或印字。完整腳面M1，本體／背底M0，邊界C1混合；作者正規化高度為背底.02 < 腳.44 < 本體.68。

尺寸參考是實際下載並raster實看的[onsemi P2N2222A/D，January 2013 Rev.7，PDF第6頁](https://www.onsemi.com/pdf/datasheet/p2n2222a-d.pdf#page=6)：內附98ASB42022B，TO-92（TO-226）CASE29-11，Issue AM，09 MAR 2007，圖面第1／2頁，STRAIGHT LEAD BULK PACK視圖。A4.45–5.20 mm、B4.32–5.33 mm、G1.15–1.39 mm及K≥12.70 mm僅是原廠尺寸參考，非插圖量測值。D形上半橢圓、比例、肩寬、色彩、roughness、AO及高度皆作者簡化，不是精確CAD；不推定化學成分、鍍層、光學或電氣特性，不打包來源圖。

預設0.08 m nominal tile、0.0042 UV-relative relief（非公尺位移）與metallic factor1；explicit `createMaterial({ metallic: 0 })`僅改scalar factor，不改stored M mask。沿用TO-220的constructor快取pose／grain及C1角色替換結構、既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512辨識三支窄尾，32僅粗預覽；不宣稱本段已完成runtime或browser驗證。

`ftypefemalefaces`（F型母頭穿板接座正面示意）使目錄883→884種：2×2四個裸正面，依序為六平面鍍鎳金屬六角底座、同心凸圓肩、封閉無鍵槽的凸圓唇、淡色P.P.介電圓盤，以及更深的微小暗色不透明中央母入口。外部硬體M1；背底／P.P.／入口M0。作者正規化高度為背底.02 < 入口.06 < 六角底座.26 < 凸肩.36 < P.P..48 < 唇.66；入口是真正height凹陷，不是塗黑點，周圍P.P.保持連續。不同於ST，沒有開放鍵槽或卡口柱，也無公針或虛構的可見中央金屬接點環。

主要依據實際下載並raster實看的歷史[Amphenol Connex CAT-103 ©2001目錄，PDF第159頁／印刷第158頁](https://docs.rs-online.com/1ab7/A700000006717073.pdf#page=159)：222121 BULKHEAD ADAPTER JACK-TO-JACK照片、圖面及該型號Nickel／P.P.／75Ω表格。其他頁通用Delrin／Teflon說明不覆蓋此型號P.P.；不推定基底合金或精確接點材質。11 HEX與21.3 mm軸向總長僅是圖面參考，非量測正面幾何；墊圈／螺帽側面尺寸也非正面高度。原照片解析度不足以確定微小入口實際截面，這裡刻意簡化成圓形，是作者示意，非精確CAD。比例、色彩、roughness、AO、層高、預設0.04 m tile與0.0042 UV-relief factor皆作者設定；.0042不是公尺或校準深度。不畫螺紋螺旋／裝飾螺紋圈、墊圈齒、背部／線纜／PCB、真通孔、透明或新mesh；不作RF／75Ω、電氣、光學、插合或安全模擬／認證，歷史75Ω僅識別料號。不打包來源素材，擴充既有`pbr3d` gallery，不新增examples入口。

獨立46-field preset（44數值欄位及2色盤）使用10個C1 profiles：六個smooth六角半平面與四組平方半徑圓形profiles。巢狀凸組合角色替換及20組constructor快取C／H／R／AO差值避免非零hard min／max接縫。四組四欄Float64 pose128 B加96² Float64 grain73,728 B，共73,856 B typed-array payload，不含JS物件／closure開銷，非總RAM、FPS或效能改善宣稱。旋轉不變owner上界maxScale × nutInradius / (sqrt(3)/2) + jitter約.369958 < .5。constructor快取pose／grain，逐點無配置／迴圈／hash／trig／sqrt，略過零支撐與完整P.P.／入口／背底不需要的grain；保留owner索引前第二次fract以處理極小負UV。Default metallic1；explicit `createMaterial({ metallic: 0 })`僅改factor、不抹除硬體／非金屬stored mask。沿用opaque四maps、optional height、tint／repeats、同步／Worker／cache API與ownership：先移除借用材質再銷毀擁有textures的preset，並另行管理自有pool／cache。不增依賴或API；上述是來源／實作描述，不宣稱full-suite、runtime、browser或built-distribution驗證。

`rcafemalefaces`（RCA／Cinch母座正面示意）使當時目錄增至879種：2×2四個寬圓形黑絕緣墊圈，各有較小圓金屬肩、再小一層的六平面前端筒鼻、暗色環形絕緣體與深圓腔；腔內為簡化的凹入導電母座環與暗色不透明底，不是公中心針。無BNC卡口凸耳，不把大型後側安裝螺帽放到正面。這是接頭家族變體，不是新的渲染或接頭模擬技術。

外觀依據已實讀／實看的原廠[REAN NYS367-0圖面](https://www.rean-connectors.com/media/14879/download/NYS367-0.pdf?v=1)（3.652.052，2020-11-13）與通用[NYS367產品PDF](https://www.rean-connectors.com/en/product/nys367-1.pdf)。圖面列墊圈Ø15.5、筒Ø8.3、前段7.5、M8×0.75及全長(29)；AF12是大型後螺帽，不是正面尺寸。圖內不一致的NYS373-x註記不構成新變體證據，產品PDF網址也不代表存在NYS367-1變體。產品照片顯示小型前端平面、較寬墊圈與後螺帽／焊片；PDF列外殼、螺帽、焊片、接點為黃銅／金、墊圈為PA+30%GF，不推定內絕緣樹脂。中性灰刻意省略真實金光學；形狀、位置、深度、顏色、粗糙度、0.04 m nominal tile與0.0042 UV relief皆作者近似，不是量測CAD、公差或隱藏剖面。

獨立56-field preset／kernel組合六組徑向平方距離C1 profiles、三個smooth folded hex slabs與27組快取channel差值。四組四欄pose128B及96² Float64 grain73,728B，共73,856 typed-array payload bytes，非總RAM或FPS。逐點無配置／hash／trig／sqrt／逐邊迴圈；`Math.sqrt(3) / 2`只在construction時計算。Default metallic1保留金屬肩／筒／母座接點與非金屬墊圈／絕緣體／底；explicit0只改material factor、不改stored map。沿用opaque四maps、optional height、tint／repeats、同步／module Worker pool／cache與preset-owned texture清理，既有878種不變；不增依賴或API入口。建議512，32僅粗預覽，不保證小母座可辨。不含後螺帽／焊片／焊尾、實際螺紋或接點彈簧細縫、面板／PCB geometry、mesh、透明穿孔或碰撞，不提供電氣／音訊／RF／插合／EMC／安全模擬或認證。

`rj45femalefaces`（RJ45型8P8C母座正面示意）使當時目錄增至878種：四個薄矩形金屬屏蔽框圍住霧黑絕緣內襯，低主腔一側接較窄的階梯卡扣延伸，對側單排八個獨立長金屬接點；不同於九組四接點`rectangularsocketfaces`或USB-C雙排24接點舌片，不是換色或新技術類別。實讀[TE 1734795-6產品頁](https://www.te.com/en/product-1734795-6.html)列8位置／8接點、無指示燈、黑PA9T GF30、鍍金／鎳磷青銅接點與鍍鎳黃銅殼。中性灰省略鍍金光學，階梯、接點佈局、尺寸、深度、顏色、PBR粗糙度與0.054 m nominal tile皆作者近似，不是精確CAD或原廠機械圖面重現。沿用opaque四maps、optional height、tint／repeats／Worker pool／cache與ownership，舊877種不變；不增依賴、LED、插頭／線材、磁性元件、PCB／焊尾或面板EMI片，不模擬實體空腔mesh、Ethernet／PoE／Cat／速度／電氣／EMC／安全或插合認證。

`usbcfemalefaces`（USB-C母座正面示意）使當時目錄增至877種：四個圓角扁平金屬口各圍住低霧黑腔、中央薄絕緣舌與兩排各12個小金屬接點（每面共24），是既有九組四接點`rectangularsocketfaces`的不同家族變體，不是新技術類別。外觀依據已實看的[GCT USB4050原廠圖面](https://gct.co/files/drawings/usb4050.pdf)，日期2016-04-21、revision C（2023-06-29），有OBSOLETE戳記；不宣稱該料號仍現行或已認證。圖面列黑色耐高溫塑膠，不推定樹脂；金屬採中性灰，不重建實際鍍金光譜。圓角扁口不是精確膠囊，省略側接地／卡扣、疊層殼與PCB尾端。0.032 m nominal tile與0.0045 UV relief皆作者近似；height／normal不是真空腔mesh、CAD、電氣／USB速度／PD／安全模擬或認證。沿用opaque四maps、optional height、tint／repeats／Worker／cache與texture ownership，不增backend認證或runtime依賴；歷史counts／日期不改寫。

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

`pigskinleather`（三孔群豬皮示意）新增暖褐、霧面皮革底上的64組三孔群：每組三個分開、稍不規則的圓潤毛孔排成小三角，孔心較低、暗、粗糙且遮蔽；位置、方向、群半徑、各孔尺寸與橢圓方向隨seed改變。三角的是孔群排列，不是單一三角形孔；也不是既有leather的Voronoi顆粒、ostrichleather單孔隆圈、cowhide毛皮色塊或perforatedleather等大單孔的人工錯列。實讀[Etherington／Roberts書籍保護字典的pigskin條目](https://cool.culturalheritage.org/don/dt/dt2578.html)、[Kawanishi Kaban的∴辨識段](https://shop.kawanishikaban.com/en/blogs/%E7%B4%A0%E6%9D%90%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6/material-pigskin)及[Leather Repair Company pigskin頁](https://prorestorers.co.uk/knowledgebase/pig-leather-skin/)；後者兩張300px近照已實看，但不拿低解析照片逐組認證三孔。孔群依字典的roughly triangular groups of three作者化，不聲稱天然皮料真偽、品種、鞣法、Nappa等級或毛孔密度校準。重用cachedNoise、compact C1 cavity與單owner tables慣例，以三個有界橢圓凹坑配連續雙尺度皮紋；不是新增通用皮革API。192孔×5個中心／quadratic係數與64²＋128² grain合計171,520B retained typed storage，不含JS物件／輸出圖或總RAM；取樣固定查三孔，無配置、hash、sqrt、trig或鄰居掃描。Default每軸support上界0.426782＜0.5，組內孔心距上界0.250337小於組間下界0.272686，避免owner截斷及孔群誤併。0.028 m nominal tile與relief0.0038 UV units皆為作者參數，不是物理孔深；全不透明非金屬，不重建穿透真皮的毛囊管、背面、皺摺網絡或透氣／透光性。

`trianglesocketheads`（TA 三角盲槽圓頭）新增25個銀灰色鋼製圓頭，每個有三條直邊的三角盲凹槽、稍圓滑的槽角與封閉平坦鋼底，周圍保留完整頭盤；粗灰底為非金屬。Seed改位置、方向、細紋與色調，不改頭盤尺寸；不是既有三條放射Y槽的tripointscrewheads、方孔、六角孔或曲邊TP3。外觀參考實讀的[Mingxing TA pan-head triangle-recess產品頁](http://www.mx-fastener.com/pan-head-triangle-shaped-recess-ta-screw.html)及實看兩張產品照片；該頁明確區分TA直邊與TP3，並列碳鋼／galvanized，這裡只作者化銀灰表面，不認證鋼種、鍍層化學、DIN／ISO尺寸、扭矩或防拆等級，也不複製照片資產。重用twopin／square／hex的既有shared sampler，只增加三個signed half-plane的平滑乘積而非paired abs或min交集；保留既有金屬槽底、圓肩及運算順序。Constructor的25×5 pose與128² grain共132,072B retained typed storage，非總RAM或FPS報告；新增取樣分支沒有配置、hash、sqrt、trig或鄰居搜尋。Owner bound為0.38＋√2×0.025＜0.5，槽外接半徑2×0.135＜fullRadius0.33。0.06 m nominal tile與relief0.03為作者參數，relief是UV單位，不是公尺或量測深度；不產生螺紋、真正通孔或pan-head mesh。

`diatomvalves`（舟形矽藻外殼面示意）以四個大小、位置及方向不同的象牙白披針形殼面，呈現兩側橫向striae中的縱向狹長lineolae、較寬且平齊的中央留白，以及中央中斷、末端向同側微彎的兩段raphe。長軸sternum略高，孔與細縫則低、暗、較粗糙而遮蔽；不是八片石鱉板、整圈守衛細胞或深槽狀內殼。形貌參考已實讀的[Diatoms of North America Navicula guide](https://diatoms.org/genera/navicula/guide)、[N. tripunctata描述及外／內SEM標註](https://diatoms.org/species/navicula_tripunctata/images)，並實看其external SEM2、internal SEM1作區分；另實讀[Yılmaz等人（2024）形貌段及Fig.3圖說](https://pmc.ncbi.nlm.nih.gov/articles/PMC11019260/)，實看A–D外殼與E–H內殼，不把內側深溝／helictoglossae搬到外面。這是Navicula式外殼的作者圖樣，不是特定物種、SEM金鍍層、活細胞或一整對frustule重建。0.00012 m tile、2²配置、象牙色與誇張的normal用relief0.0022均為作者參數，不作微米孔密度、殼厚或真實反射率校準。沿既有cached pose／C1 compact support／grain模式，以有界最近row／column查單一狹孔；constructor預算四pose、24筆row bounds與96² grain，保留typed storage為160＋768＋73,728＝74,656B，不含JS／輸出maps，亦不等於fps改善。Whole lineolae依各row的完整支撐排除中央區，避免逐pixel裁出破碎半孔；default半徑加jitter0.47070<0.5，row／column換界在孔外，採樣無配置、hash、sqrt、trig、鄰格或逐孔掃描。全opaque M0，孔下仍有實心襯底；不新增幾何、透明／透射、完整girdle／內殼、光子效應、運動或生物模型。

`chitonshells`（石鱉八殼板覆瓦示意）新增九個長橢圓背面圖樣，每組八片隆起殼板（兩端帽片與六片中板）、七道帶方向性的非對稱接合肩，以及環繞殼底的深色粗糙外套膜帶。殼面沿覆瓦方向爬升，中線有圓滑低脊；接縫下面仍有較低、較暗且遮蔽的連續殼底，不是單一橢圓上刻七條對稱線。[UCMP Polyplacophora](https://ucmp.berkeley.edu/taxa/inverts/mollusca/polyplacophora.php)及已實看的Lined Chiton照片／anatomy圖提供八片背殼與girdle的參考；[Connors等人（2019）Fig.1a–b](https://pmc.ncbi.nlm.nih.gov/articles/PMC6904579/)的實際dorsal／side SEM分清八塊primary plates與周圍小鱗片。此處girdle只用fine grain，不重建該論文的數百片鱗片或μ-CT幾何。暖褐色盤、0.12 m tile與3²配置為作者選擇，不是灰階SEM色彩復原、特定物種或生物尺度校準。沿用compact squared ellipse肩與既有C1 corner-ramp概念，以rounded absolute彎接合線；一個owner、單一active course即可求值，沒有每pixel八片掃描。Constructor預算hash、旋轉／scale basis、各片tone及96² grain，retained typed storage為pose／tone864B＋grain73,728B＝74,592B，不含JS／輸出maps，也不當作fps提升。Default最大旋轉半徑加jitter0.47335<0.5；彎曲座標在尾帽可能超過最後interval，必須保留最後valve，不能讀下一owner的tone或undefined。Field hot path無配置、hash、sqrt或trig，肩與ramp維持C1。這是全不透明非金屬的二維浮雕示意，不建立隱藏重疊體積、八個可動mesh、捲曲動作、殼眼光學、透光／SSS、殼層／肌肉或生物力學模型。

`leafstomata`（葉片氣孔守衛細胞示意）以25組大小、位置、方向與孔寬不同的腎形守衛細胞，圍住深色、低而遮蔽的不透明孔底。兩個較亮、較平滑的細胞隆起在長軸兩端以稍低、但仍高於葉面背景的接合區相連；不是無分界的整圈殼唇、帶齒的寶貝殼口或單顆咖啡豆刻痕。已實讀[Nadeau與Sack（2002）Stomatal Development in Arabidopsis](https://pmc.ncbi.nlm.nih.gov/articles/PMC3243354/)章節並實看Fig.1的TEM／cryo-SEM，以及[Jaafar與Anderson（2024）stomatal cell-wall review](https://pmc.ncbi.nlm.nih.gov/articles/PMC11232514/)和Fig.1示意圖：雙子葉腎形守衛細胞在兩極接合，與禾本科啞鈴形不同。這些是綜述／章節與其引述的顯微圖，不冒稱本引擎重做原始實驗。0.00025 m tile、5²排列與綠色盤是作者示意選擇，不是從灰階SEM量得的顏色、氣孔密度或特定物種重建。沿用既有compact squared shoulders與cached grain；內外橢圓肩、徑向隆起與兩端接合皆C1，孔內跳過不定的徑向座標。Constructor預算hash、旋轉／scale basis、inverse pore width及96² grain／12² skin noise；field hot path無配置、hash、sqrt或trig。Pose1,200B＋grain73,728B＋skin1,152B＝76,080B retained typed storage，不含JS容器與輸出maps，也不是fps提升證據。Default旋轉支撐加jitter保守半幅0.448<0.5，只需本owner。粗綠底僅抽象葉面，不重建pavement細胞拓樸、one-cell spacing發育規則、細胞器、真三維通氣孔、透光／SSS、動態開閉或蒸散／生物力學。

`watermelontourmaline`（西瓜碧璽三角切片鑲板）新增16個分離的近似圓角三角拋光切片：粉紅核心、淺灰過渡帶與綠色外圈共用同一平面，放在較粗糙的暖灰背板上，不是果皮條紋、綠粉換色的立方fluorite或刻溝嵌線。[GIA Tourmaline Quality Factors](https://www.gia.edu/tourmaline-quality-factor)說明pink core／thin green skin與薄切片，已實看的典型標本照片提供分色參考；[GIA Micro-Features of Tourmaline（2024）](https://www.gia.edu/gems-gemology/summer-2024-micro-features-tourmaline)說明trigonal結構、triangular cross section與color zoning。0.08 m tile、4²配置與理想化三重對稱是作者選擇，不是標本／化學成分／尺寸重建。沿用fluorite／chiastolite的平面色帶原則與既有固定灰色neutral-pigment路徑；外形、核心與灰帶邊界都用三個compact circle的C1 products，沒有nearest-arc接縫或新公開幾何／色彩API。Constructor預算帶radius normalization的旋轉basis、core／pale inverse與平方值、hash、96² grain及8² cloud；field hot path無配置、hash、sqrt或trig，離開切片便不讀內層／grain。Pose1,152B＋grain73,728B＋cloud512B＝75,392B retained typed storage，不含JS容器／輸出maps、不冒稱fps提升。預設最大support0.34＋jitter0.07＝0.41<0.5 cell，只需本owner。這是正面不透明PBR色盤近似，不提供寶石透射／折射、多色性、貓眼／iris effect、內部包裹體光學、真切片mesh或寶石產地／品質認證；照片未複製為資源。

`cuttlebone`（烏賊骨層板波壁示意切面）以暖白、粗糙的非金屬薄壁／層板包圍深色、低而遮蔽的不透明底面。視覺依據是已實讀的[Yang等人2020年wall–septa研究與Fig.1](https://pmc.ncbi.nlm.nih.gov/articles/PMC7519314/)及其實際SEM／重建圖：烏賊骨是內殼，不是脊椎動物骨。作者0.0024 m nominal tile含六個不等高層區，每層24條錯位、彎向與幅度不同的五次波壁，以C1 product union併入層板；不是把`cardboardedge`的橫向連續中紙換成白色。這是二維示意切面，真正三維壁為含分叉的開放迷宮，144個二維視窗不代表144個封閉氣室或文獻93 vol%孔隙率。未重建micro-CT、三維波度梯度／成長方向、真幾何孔洞、透射／SSS、流體浮力、強度或生物尺度；標稱尺寸及曲線是作者選擇，不是量測複製。Constructor預算hash、layer bounds／inverse scales與96² grain；field hot path沒有陣列／物件配置、hash、sqrt或trig。壁／層界共2,456B加grain73,728B，retained typed storage76,184B，不包含JS容器與輸出maps，也不當作fps提升。預設column-support保守半幅0.45675<0.5、界面偏移0.12<0.5，故只需本column與最多一個相鄰row修正；平方局部tangent距離避免斜壁變細，row切換藏在平頂層板內。

`pallasite`（拋光橄欖隕鐵）新增不透明切片近似：橄欖綠至蜜黃色非金屬晶粒包在連通銀灰金屬基質中，兩相近乎平齊，晶粒內有細暗、微凹而略粗的裂紋，不是凸石卵或灰色水泥填縫。[NASA Mittlefehldt／Rumble摘要](https://ntrs.nasa.gov/api/citations/20060020744/downloads/20060020744.pdf)實際說明magnesian olivine＋iron-nickel，[ASU Buseck Center](https://meteorites.asu.edu/stony-iron-meteorites/pallasites)說明greenish olivine；並實看[Esquel切片照片](https://commons.wikimedia.org/wiki/Special:FilePath/Esquel.jpg)的晶粒／反光金屬網，沒有複製影像。這是正面不透明PBR作者模型，不提供照片中的背光透射、折射、寶石品質、精確鐵鎳光學常數、蝕刻Widmanstätten結構或成因／成分認證。0.16 m tile以8² jittered periodic Voronoi晶粒、可變內縮與C1 half-plane products構成；私有`buildPeriodicVoronoiPlanes`直接抽用原`septarian`裁剪，原inline副本刪除，沒有新公開幾何API。Constructor才做clip／hash／sqrt／trig，pixel僅查3²局部owner候選與存活facet，不配置陣列／物件或重建polygon；晶粒support互斥，找到正support即可停。三seed實量每圖384個unit-plane triplets、每晶粒4–8 facets／平均6；含96²grain的retained typed storage88,064B，constructor共用scratch1,608B，不含JS容器／輸出maps，不是FPS。Seed改晶粒位置、大小、色調與裂紋；晶粒M0、連通基質M1，使用既有neutral-matrix pigment路徑；預設factor1，明確override0可全部非金屬化。保留四opaque maps、optional height、tint／repeats、sync／Worker／cache及ownership；不新增依賴、入口或mesh，也不擴大Canvas2D／跨瀏覽器認證。

`gosperinlay`（三階Gosper黃銅嵌線）在粗糙海軍藍非金屬底面上新增一條略凸、較光滑的黃銅色金屬線。依已實讀的[Gosper curve](https://en.wikipedia.org/wiki/Gosper_curve)及其原始wikitext的60°、axiom A、兩個A／B production，離線三次展開為343個等長連結、344個不同三角晶格頂點，只有兩個端點，不閉合、不分岔；這是有限三階圖樣，不是極限空間填充集合或Gosper island的平面鑲嵌。不同於`moorecurve`的64格正交封閉凹槽、`boullebrassinlay`的S形植物卷紋與`kintsugiceramic`的裂縫網。0.5 m tile的preset保存343字元方向word；constructor只建4值線段與16²局部bbox索引，pixel不解L-system、不配置物件／陣列、不作全343線段掃描或sqrt／trig／hash。重用`vogelspiral`的prefix-end原地填表，以及`fiddleheads`的product-union rounded joins；801 references、257 offsets、max11／全tile各bin mean3.12890625候選，含96² Float64 grain共86,820B typed storage，不含JS string／物件／輸出maps，不是FPS量測。Squared capsule距離與C1 cubic shoulder相乘聯集保留圓帽與平core。Seed只改grain finish，不移動路徑或metal mask；線M1、底M0，default material metallic1才保留mask，explicit0可整體非金屬化。四張不透明PBR maps、optional height與既有tint／repeats／sync／Worker／cache及ownership維持；不新增入口、依賴、mesh或alloy／導電／製造模擬，也不以Canvas2D或未測瀏覽器認證。

`vogelspiral`（97圓片黃金角葉序鑲板）將97個等大、平頂圓肩釉面圓片按黃金角放在粗灰底上，深青／鼠尾草／象牙三色族各33／32／32片。已實讀[Fermat’s spiral的Vogel葉序段](https://en.wikipedia.org/wiki/Fermat%27s_spiral#The_golden_ratio_and_the_golden_angle)：原式r=c√n、θ=n×137.508°；本作者明確改為r=0.044√(n+0.5)、θ=nπ(3−√5)，n=0–96，以半步徑向偏移避開中央擁擠，不宣稱是原式n=0的中心點。這是離散等大圓片，不是連續螺旋線、半徑遞增相切的Doyle圖樣、植物模擬或Fibonacci條數認證。0.5 m名義tile，UV圓半徑0.033（名義16.5 mm）；最小圓心距0.06802551、大於直徑0.066，外包圓半徑0.46523142，均留灰縫與外框，不作施工認證。平方半徑斜肩保持C1，seed只變tone／grain。沿用預算化鄰片查詢方式，8×8空間CSR表224個references、每bucket最多8／平均3.5個候選，不逐點掃97圓。固定Float64資料291＋96²個、Uint16 offsets65＋references224，共76,634 B typed儲存（不含JS物件／輸出maps）；constructor才算trig／sqrt／hash，逐點無配置。略過通用detail；不透明M0、四maps＋可選height、periodic signed-UV與既有所有權不變。

`langtonsant`（蘭頓蟻1024步快照棋磚）把122個深色亮面邏輯黑格置於32×32淺暖色粗釉格板，奶油色凸三角標出終點與朝向。採實讀[MathWorld Langton’s Ant](https://mathworld.wolfram.com/LangtonsAnt.html)的白格左轉90°／黑格右轉90°、翻色再前進一格約定；它與常見鏡射慣例不可混用。本作者從(16,16)朝上、全白無限平面離線前進1024步，終點(8,8)朝下，122黑格、226曾訪格；全軌跡x=5–24／y=6–22，未碰32格邊界。只存32個row位元數及終點方向向量，不在runtime跑模擬、不複製來源圖像。0.32 m名義tile、0.01 m格距；圓肩方格與三條半平面相乘的三角指標保持C1，邏輯白格呈淡暖色而非純白。不是QR碼、可互動自動機或104步highway／無限演化證明。每sampler只新增96² Float64 grain（73,728 B typed-array儲存，不含JS資料與輸出maps），bitmap查詢O(1)、逐點無配置／重算hash，略過通用detail。維持不透明非金屬M0、四maps＋可選height、periodic signed-UV與既有所有權。

`pentominotiles`（十二種自由五連方拼磚）將每塊由五個等大邊連通方格構成、旋轉／鏡射視為同形的12種自由五連方，各放一次於作者6×10格矩形，再5×3重複成30×30格、180塊釉面拼磚。已讀[Pentomino](https://en.wikipedia.org/wiki/Pentomino)的定義、12種自由形／63種固定取向與6×10拼合說明；佈局由離線exact-cover求得並逐格確認，不複製圖片、不是正五邊形鋪磚。A–L只是私有作者ID，不是慣用字母名稱。海軍藍／灰藍／象牙三色族各60塊，粗灰縫；0.6 m名義tile，900個等大格的名義邊長0.02 m。相鄰格的平滑權重按整塊ID合併，消除同塊內部格線；不同ID的平手落在平灰縫內，凹角與四格交會保持C1圓肩。這是加權圓角作者圖樣，不是等距幾何offset、施工規格或互動拼圖／通用求解器。初始化只有900個Uint16 owner、180個Float64 tone與96² Float64 grain，共76,968 B固定typed-array儲存（不含JS物件／暫存與輸出maps），逐點無配置、不重建hash／解題；略過通用detail。維持不透明M0、四maps＋可選height、periodic signed-UV及既有所有權。

`pythagorastree`（有限畢氏樹釉面方磚）新增每棵31個分枝方形的四代圖樣（根＋四代，1／2／4／8／16片）：深赤褐樹幹逐代變淡至象牙色小方片，置於粗糙灰縫上。不同於既有`pythagoreantiles`的2:1雙尺寸、每tile五大五小的平面鋪滿。[Wikipedia Pythagoras tree](<https://en.wikipedia.org/wiki/Pythagoras_tree_(fractal)>)與[MathWorld](https://mathworld.wolfram.com/PythagorasTree.html)描述在朝外邊的等腰直角三角形兩腿上立子方形，子邊長為母邊長的√2/2、兩子名義面積合為母面積；一般無限樹可能重疊，不能把帶重數面積當union面積。本作者有限31方形以精確dyadic座標SAT確認沒有內部重疊、46對名義角／邊接觸，各代總名義面積皆等於根；有限bounds為4.5L×3.25L，不引用無限樹的6L×4L來冒稱本圖樣尺寸。4個週期motif、scale0.2／centerY1.625、grout0.002／shoulder0.003、roughness0.3／UV relief0.012、色盤100,32,30／240,221,180及tile0.4 m皆為作者設定。31×7幾何值＋124 tone＋96² grain共76,456 B Float64 tables，另有JS scalar與初始化遞迴，非總RAM。逐點只查單owner的31片，平方包圍半徑早拒絕，再乘兩軸平方C1 profile，無逐點配置／hash／trig／sqrt或鄰owner掃描；空灰縫略過grain、generic detail略過。四張opaque dielectric map、M0、optional height與既有factory／Worker／cache／ownership不變；不是無限碎形、真樹、完整mesh、分形維數或磁磚／結構／施工認證。

`ichinghexagrams`（六十四卦浮雕爻紋）新增8×8個六行符號：深炭綠平頂圓肩爻線立於奶油色粗底，陽爻連通、陰爻左右等分且中央留空；全圖192陽爻＋192陰爻，共576個分離長條。已讀[Hexagram (I Ching)](<https://en.wikipedia.org/wiki/Hexagram_(I_Ching)>)的六條堆疊線、陽實陰斷、自下而上數爻及多種卦序說明。本preset用作者自定0–63 row-major二進位排列，最低bit在最下爻；不是文王卦序、Unicode碼位順序或伏羲圖式認證。不同於sevensegment的數字、EAN-13碼條、點字圓頂或Rule30演化格。line pitch0.1、halfWidth0.36／halfGap0.08／halfHeight0.032、shoulder0.012、roughness0.3、UV relief0.003、色盤28,34,30／226,216,178及tile0.32 m（8×8個名義0.04 m glyph cell）都是作者設定。64 tone與96² grain共74,240 B Float64 tables，另有JS scalar／初始化暫存，非總RAM。每點僅選單glyph最近一行，快取平方半徑與inverse bands的分離C1 profile相乘，沒有逐點配置／hash／trig／sqrt或鄰字掃描；generic detail略過。四張opaque dielectric map、M0／mortar0、optional height與既有factory／Worker／cache／ownership不變；不是書法字型、可操作文字、透明孔、mesh、占卜或歷史／文化認證。

`apollonianmosaic`（Apollonian相切圓馬賽克）新增有限兩輪Descartes反射的圓形釉面鑲嵌：深青綠、鼠尾草與象牙圓盤逐層填入三個等大圓的相切空隙，四個週期圖樣各19圓。不同於`pennyround`的等大交錯圓磚、`circularpavers`的同心扇形鋪面或方孔`Sierpinski`圖樣。[Apollonian gasket](https://en.wikipedia.org/wiki/Apollonian_gasket)提供相切圓遞迴；[Descartes's theorem](https://en.wikipedia.org/wiki/Descartes%27s_theorem)提供帶號曲率與複數圓心方程。作者由二次式兩根導出b′＝2Σ其他b−b、(bz)′＝2Σ其他bz−bz，使用負曲率包圍圓與三個等大初始圓；相鄰反射禁止立即回頭，遞迴後還原quad，不配置每分支quad副本。R0.47、初始半徑R(2√3−3)、2×2圖樣、depth2、grout0.0015／shoulder0.003、roughness0.3／relief0.012、色盤28,68,62／236,218,170與tile0.24 m是作者設定；負曲率外圓不畫成磚。19圓×4個幾何值＋76 tone＋96² grain共74,944 B Float64 tables，另有3個JS tone數字及初始化暫存，非總RAM。取樣只讀單owner的19個圓，以預算平方半徑及肩寬倒數作C1斜邊，無逐點配置、hash、trig或sqrt；空灰縫略過grain，generic detail略過。不透明非金屬四maps、optional height與既有Worker／cache／ownership不變；這是有限圖樣與平坦倒角圓片，不是無限碎形、圓頂mesh、透明、數學分形維數或實際馬賽克施工認證。

`prismaticpentagonaltiles`（稜柱房形五角磁磚）新增V3.3.3.4.4對偶鑲嵌：藍灰、灰綠與象牙三色的上下交錯房形磚，有相鄰的兩個90°底角與三個120°屋頂角，不同於`cairotiles`的分隔直角、`floretpentagonaltiles`的六瓣60°尖角或`elongatedtriangulartiles`的正方／三角面。[Wikipedia Elongated triangular tiling的Prismatic pentagonal tiling段落](https://en.wikipedia.org/wiki/Elongated_triangular_tiling#Prismatic_pentagonal_tiling)提供對偶關係、三120°加二90°、cmm對稱與平行線平分拉長六角形的描述；沒有座標。作者取單位正多邊形中心連成(−1/2,−1/2)、(1/2,−1/2)、(1/2,√3/6)、(0,√3/3)、(−1/2,√3/6)房形，內切圓0.5，底邊1、側邊(3+√3)/6、屋頂邊1/√3，四個上下交錯房形組成1×(2+√3)單元，15×4單元共240面。8個位置、10個法線、240個色調與96² grain共75,792 B Float64 tables，另有三個JS tone數字，非總RAM；取樣以3×3週期owner與平方半徑0.5早拒絕，無逐點配置、hash、trig或sqrt，略過generic detail。30,58,76／224,236,222色盤、roughness0.3、relief0.012、grout0.025、shoulder0.018及tile0.6 m都是作者設定，不含真實磁磚尺寸、釉料或施工認證；不透明非金屬maps、optional height與既有Worker／cache／ownership維持不變。

`floretpentagonaltiles`（花形五角磁磚）新增V3.3.3.3.6手性對偶鑲嵌：森林綠、橄欖與象牙釉面五角磚，每六瓣繞一點形成花形，五個內角為60°與四個120°，兩長邊為三短邊的兩倍。不同於`cairotiles`的直角五邊形、`deltoidaltrihexagonaltiles`的四角鳶形或`snubtrihexagonaltiles`的三角／六角面。[Wikipedia Snub trihexagonal tiling的6-fold pentille段落](https://en.wikipedia.org/wiki/Snub_trihexagonal_tiling#Floret_pentagonal_tiling)提供六瓣、內角、手性、p6與對偶關係；座標與邊比為作者從相鄰正多邊形中心推導。基礎五邊形為(0,0)、(3/7,−√3/21)、(4/7,√3/21)、(1/2,√3/6)、(2/7,4√3/21)，旋轉六次、置於7×8三角點陣；內切圓半徑1/(2√7)。90個edge-plane、336個seeded tone與96² grain共77,136 B Float64 tables，另有三個JS tone數字及初始化頂點，不是總RAM。逐點3×3 owner搜尋以半徑√(1/3)剔除，無配置、hash、trig或平方根；略過通用detail。36,66,42／236,218,150色盤、roughness 0.3、relief 0.012、灰縫0.012、肩寬0.008及tile 0.84 m為作者設定；不透明非金屬四maps、可選height與既有Worker／cache／ownership不變，不含真實磁磚尺寸、釉料或施工認證。

`snubtrihexagonaltiles`（扭稜三六角磁磚）新增3.3.3.3.6手性鑲嵌：靛藍正六角形、象牙側三角形與棕黃中央三角形置於粗糙灰縫，四個正三角形與一個正六角形在每個頂點相遇。不同於`trihexagonaltiles`的3.6.3.6及`snubsquaretiles`的三角形與正方形。[Wikipedia Snub trihexagonal tiling](https://en.wikipedia.org/wiki/Snub_trihexagonal_tiling)提供頂點配置、snub operation、缺少鏡射對稱與floret pentagonal對偶；讀取的文字沒有座標，因此單位三角點陣上的邊長1/√7、轉角atan(√3/5)、7×8個點與選定手性皆為作者建構。初始化列舉相鄰六角頂點的等邊三角形，每格一六角與八三角；198個面幾何、504個色調與96² grain合計79,344 B Float64 tables，另有9個JS色調數字及初始化暫存，非總RAM。取樣查詢週期3×3點陣與預算edge normals，無逐點配置、hash、trig或平方根，通用detail略過。色盤24,60,86／244,226,170、roughness 0.3、relief 0.012、灰縫0.012與肩寬0.008均為作者近似；四張不透明非金屬map、metallic 0、可選height與既有Worker／cache／ownership不變，沒有實際磁磚、釉料或施工規格認證。

`deltoidaltrihexagonaltiles`（鳶形三六角磁磚）新增作者鳶形三六角（V3.4.6.4）鑲嵌：三角點陣上每個點最近的六角胞被六條通向邊中點的輻條切成六塊鳶形，繞每個點的鳶形依序採用勃艮第紅、玫瑰與象牙釉色，所以每個點陣三角形的三塊鳶形也彼此不同；鳶形磚為斜面釉面，嵌在較粗糙的灰縫中，所有直邊落在相隔30°的六組平行線上。它不是`kisrhombilletiles`（30-60-90三角形，V4.6.12）、`trihexagonaltiles`（六邊形與三角形，3.6.3.6）、`rhombille`（每個六角三塊菱形）、其對偶`rhombitrihexagonaltiles`（3.4.6.4）或其他既有磁磚preset，且以3.4.6.4對偶、deltoidal、tetrakis／triakis／floret與prismatic pentagonal搜尋README／PLAN／DESIGN／CURRENT及preset目錄，只有`kisrhombilletiles`條目把此鑲嵌列為相關鑲嵌，沒有preset實作它。實際讀取的Wikipedia Rhombitrihexagonal tiling頁面的鳶形三六角段落（Deltoidal trihexagonal tiling重新導向到此）提供：面為鳶形、類型為對偶半正（面傳遞）鑲嵌、面配置V3.4.6.4、對稱群p6m [6,3]（*632）與旋轉群p6、對偶為菱形三六角鑲嵌、Conway稱tetrille、與三六角鑲嵌的關係是把三角形與六邊形分成中央三角形並把相鄰三角形合併成鳶形，以及面傳遞的變形（p31m）。取得的文字沒有座標、角度或邊長，所以邊長1的三角點陣建構（邊心距0.5的六角胞由通過邊中點的輻條切開，使點陣點度數為6、邊中點度數為4、點陣三角形中心度數為3）、由這些頂點度數得出的鳶形角度60°、90°、120°、90°（360°除以度數）與長短邊比√3，以及其他所有數值都是作者設定：色調0.1、0.48、0.82再加每塊至多0.12、102,34,44 / 238,228,204色盤、釉面粗糙度0.3對灰縫0.92、relief 0.012、以點陣單位的灰縫半寬0.014與斜面肩寬0.01，以及每個0.84 m UV tile含7×8點陣（7欄與4個列對，與正方形差1%，採作者設定的0.12 m點陣間距）；不主張真實磁磚尺寸、釉料或施工規格，也不複製或打包圖片。獨立kernel存336個逐鳶形色調、14個輻條分量與96² grain，共76,528 B tables，非總RAM；每點檢視九個點陣候選與最近者的六塊鳶形，所以每點無平方根、trig、hash或配置，通用detail略過，mortar即灰縫。Seed只改變逐鳶形色調與顆粒，幾何保持固定；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明或位移。

`soroban`（算盤）新增作者算盤磁磚：日本算盤的七棒區段，雙錐木珠位在七根類竹棒上，上下各一條框條、中間一條隔條，木珠顯示4567890，隔條上每第三根棒有一個點。它不是`seedbeads`（散落的種子珠）或其他既有preset，且以abacus、soroban、suanpan／reckoning與bicone／biconical搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何算盤preset。實際讀取的Wikipedia Soroban頁面提供結構：棒數為奇數且不少於七根（標準型十三根）、每根棒在隔條上方有一個五珠（go-dama）、下方有四個一珠（ichi-dama）、雙五進制編碼十進位（往隔條移動的木珠為有效，五珠向下、一珠向上）、每第三根的單位棒點、木珠通常為雙錐（biconal）木質、棒為木、金屬、藤或竹，以及其現代算盤圖說右側顯示1234567890、下方為一、上方為五。頁面沒有尺寸、木珠比例、顏色或框架配置，所以取自圖說末七位的4567890七棒區段、自右數第一、第四與第七根棒的點、以棒距為單位的框條0.52與隔條0.5厚、木珠槽0.78且木珠寬0.9高0.78（帶圓角赤道稜脊的雙錐輪廓，高度由邊緣0.7升至中心1.0 relief單位）、棒寬0.1、點半徑0.11、48,28,18 / 228,198,142色盤、色調（底板0.6 + 0.08×顆粒、木珠0.3–0.4、框條0.1、隔條0.16、棒0.88、點0.95）、粗糙度底板0.8與木珠0.45、relief 0.03與木珠邊緣柔度0.08皆為作者近似；不主張真實算盤尺寸、材料或教學正確性，不繪製框架側邊所以tile可重複成更長的算盤區段，也不複製或打包圖片。一個UV tile代表0.056 m（七根棒、作者設定的8 mm棒距）。獨立kernel存七個數字與128²木紋grain，共約131,128 B tables（7個Float64與16,384個Float64 grain），非總RAM；每點只處理所在的那根棒與那個木珠槽，最多七個平滑ramp，所以每點無hypot、平方根、trig、hash或配置，通用detail略過，mortar保持0。Seed只改變木紋顆粒，木珠保持固定；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明或位移。

`ean13label`（EAN-13條碼標籤）新增作者EAN-13條碼標籤磁磚：淺色紙面上印著Wikipedia頁面範例號碼4 003994 155486的30條黑色條，起始、中央與結尾護線比其餘條長，墨比紙面略粗糙且略微凸起。它不是`papertape`（打孔ASCII孔洞）、`sevensegment`或其他既有條紋preset，且以barcode、EAN-13／EAN13、UPC、QR code與label搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何條碼preset（barcode命中是相鄰`papertape`條目裡的搜尋用字列表；label命中是無關條目）。實際讀取的Wikipedia International Article Number頁面提供結構：95個等寬區間（3個起始區間101、第一碼之後六碼的42個區間、5個中央區間01010、後六碼的42個區間、3個結尾區間101）、數字0–9的L、G、R碼（R碼是L碼的逐位元補數、G碼是R碼的位元反序，每個數字兩條黑條與兩段空白）、由第一碼決定左側六碼使用L或G的表（4為LGLLGG）、範例4 003994 155486與其OEOOEE EEEEEE奇偶，以及校驗碼規則（權重3與1交替，最後一個資料碼權重3；範例400638133393x得89而x = 1）。取得的頁面文字沒有X尺寸、空白區、條高、印刷或文字排版，所以兩側各9個區間的空白區（整張113個區間寬、方形tile）、條自上方14個區間起向下70個區間而護線再長5個區間、下方留白（原本印數字處，不繪製文字）、紙面色調0.86 + 0.08×顆粒對墨色調0.04、22,22,26 / 246,244,236色盤、粗糙度紙面0.55與墨0.8、墨比紙面高0.3 relief單位（relief 0.012）、occlusion 0.98而墨上減0.03，以及每個模組邊界兩側各0.1個區間的柔邊皆為作者近似；不主張GS1合規、掃描器可讀性、印刷品質或商品識別，也不複製或打包圖片。一個UV tile代表0.0373 m（113個區間，採作者設定的0.33 mm X尺寸）。獨立kernel存113區間bit表、113個條底值與128² grain，共132,089 B tables（113 B、113個Float64與16,384個Float64 grain），非總RAM；每點選一個模組，在邊界上最多以平滑步階混合兩個模組欄，條端再乘兩個平滑步階，所以每點無hypot、平方根、trig、hash或配置，通用detail略過，mortar保持0。Seed只改變紙面顆粒，條保持固定；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明或位移。

`embossedbraille`（浮凸點字紙）新增作者浮凸點字紙磁磚：奶油色紙面上有7×4個點字格，光滑隆起的圓點依序拼出a到z的字母（跳過w，結尾留三個空白格），圓點比平坦紙面略光滑、略深。它不是`tactilepaving`（規則排列的截錐警示凸點）、`dominoes`（標準點數）或其他既有點狀preset，且以braille、tactile、emboss與raised dot搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何點字preset（braille命中是相鄰條目裡的搜尋用字列表；tactile與emboss命中的是無關preset）。實際讀取的Wikipedia Braille頁面（點字格由兩欄各三個的六個凸點組成，共64種圖樣含無點，位置由上到下左欄編號1到3、右欄4到6，點圖樣1-3-4是字母m；前十個字母a–j使用上方四個位置，即⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚，k–t是同樣圖樣再加第3點，即⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞，之後的u v x y z加第3與第6點，w被略過）提供點字格；頁面沒有點距、tile或渲染方式，所以7×4版面、格距2.4與行距4.2個點距（16.8×16.8點距的方形）、空白格、半徑0.3點距的圓頂與其他數值都是作者設定：每個凸點是高度剖面為(1 − s²)²（s為正規化半徑平方，邊緣斜率為零、不需平方根）的圓頂，置於格內欄位±0.5與列−1、0、1，紙面高度0.4、點頂1.0，色調0.82±0.1顆粒、點上減0.12，色盤168,152,128 / 244,236,216，粗糙度紙面0.85、點頂0.7，occlusion 0.97、點上減0.1，relief 0.03皆為作者近似；不主張任何紙張材料、點距標準、壓印工法或可讀性，也不複製或打包圖片。一個UV tile代表0.042 m（16.8個2.5 mm點距，2.5 mm為作者採用的常見點距）。獨立kernel存28格代碼表與128² grain，共131,100 B tables（grain 16,384 Float64），非總RAM；每點讀一個格代碼、選最近的點位並最多計算一個圓頂，無hypot、平方根、trig、hash或配置，通用detail略過，mortar保持0。Seed只改變紙面顆粒，凸點保持固定；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明或位移。

`rule30`（Rule 30元胞自動機）新增作者Rule 30元胞自動機磁磚：33×33格的tile顯示Wolfram初等元胞自動機Rule 30從頂列中央單一黑格長出的33代（時間向下），黑格是凸起、光滑的深色方塊，白格是較低、較粗糙的淡色方塊，格間有凹陷細溝。它不是`sierpinskicarpet`、`moorecurve`、`ulamspiral`、`perfectmaze`或其他既有幾何或由數字決定的preset，且以cellular automaton、Wolfram、rule 30、cone snail與pseudorandom搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何preset（命中的只有相鄰條目裡的搜尋用字列表）。實際讀取的Wikipedia Rule 30頁面（Stephen Wolfram於1983年提出的初等元胞自動機，屬Class III、行為非週期且混沌；規則表111→0、110→0、101→0、100→1、011→1、010→1、001→1、000→0，即左 xor (中 or 右)，因二進位00011110為30而得名；從一群0中的單一狀態1出發、時間向下，常出現白色三角形，左側有明確的條紋圖樣；各代的黑格數為1、3、3、6、4、9、5、12、7、12、11、14、12、19、13、22、15、19……；芋螺Conus textile的殼上有類似圖樣）提供規則與計數；頁面沒有tile、格網大小、邊界或外觀，所以33×33格網（陣列外的格為0，因此第十六代之後會被左右邊界截斷）與所有尺度都是作者設定：每格是半尺寸0.42格、肩部0.05格的方塊（兩個平滑區間的乘積，半覆蓋輪廓寬0.79格），黑格凸起到0.9、色調0.1、粗糙度0.3，白格在0.4、色調0.7±0.08顆粒、粗糙度0.8，溝在0.3、色調0.35，色盤20,22,30 / 226,222,208，occlusion 0.97、溝內減0.3，relief 0.03皆為作者近似；不主張任何材料、尺寸規格或隨機性質，也不複製或打包圖片。一個UV tile代表0.66 m（33格、每格2 cm）。獨立kernel存1,089 byte的格表與128² grain，共132,161 B tables（grain 16,384 Float64），非總RAM；自動機只在建立sampler時執行，每點讀一個格byte並計算兩個區間，無hypot、平方根、trig、hash或配置，通用detail略過，mortar保持0。Seed只改變白格顆粒，圖樣保持固定；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明或位移。

`perfectmaze`（種子完美迷宮）新增作者種子完美迷宮磁磚：8×8格的迷宮，通道是凹陷、深色、較光滑的溝，夾在淡色、較粗糙的凸牆之間，64格以63條連結相連，所以每格都到得了且沒有迴圈，每個seed是不同的迷宮。它不是`moorecurve`（單一確定性的封閉溝槽迴路、沒有分岔）、`braincoral`（自然迷宮狀脊線）、`guilloche`、`greekkey`、`truchettiles`、`hextruchettiles`、`circuitboard`或其他既有溝槽與磁磚類preset，且以maze、labyrinth、spanning tree與backtrack搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何迷宮preset（labyrinth命中是`braincoral`的自然脊線與`moorecurve`自己的用字）。實際讀取的Wikipedia Maze generation algorithm頁面（迷宮可視為節點是格、邊是牆位的連通圖，生成常以隨機生成樹處理，使沒有到不了的區域也沒有迴圈；隨機深度優先搜尋即遞迴回溯法，從一格出發、移到隨機的未訪問鄰格並移除兩者之間的牆、在死路回溯，得到低分岔係數與許多長通道）提供構造；8×8尺寸、由seed播種的xorshift產生器、鄰格順序（東、南、西、北）、通道幾何與所有尺度都是作者設定：每一格以一條水平帶與一條垂直帶連到有連結的鄰格，各是兩個平滑區間的乘積，半寬0.25格、肩部0.05格（所以半覆蓋的通道寬0.45格，8 cm格下為3.6 cm），帶狀區直接穿過格邊朝有連結的鄰格延伸所以格與格C1相接，地面為聯集1 − (1 − 水平)(1 − 垂直)，且沒有連結穿過tile邊界，所以每個重複的tile各有一座迷宮。地面凹進0.8牆面之下0.45；牆面色調0.8±0.1顆粒、地面0.2，色盤48,42,36 / 214,204,184，粗糙度牆面0.55、通道0.85，occlusion 0.97、通道降到0.6，relief 0.03皆為作者近似；不主張任何材料、尺寸規格或難度，也不複製或打包圖片。一個UV tile代表0.64 m（8×8格、每格8 cm）。獨立kernel存64個連結byte與128² grain，加上產生器的128個暫存byte共131,264 B tables（grain 16,384 Float64），非總RAM；深度優先搜尋只在建立sampler時執行，每點讀一個連結byte並計算四個區間，無hypot、平方根、trig、hash或配置，通用detail略過，mortar保持0。Seed改變迷宮與牆面顆粒；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明或位移。

`sevensegment`（七段顯示器）新增作者七段顯示器面板：深色、表面光滑的非金屬面板上以5×2格的數字格顯示0123456789，亮起的段是明亮的琥珀色斜角長條，未亮的段是暗淡殘影，全部凹進面層之下。它不是`chipresistors`（元件本體上以連續筆劃畫出的白色103標記）或其他既有會畫字元的preset，且以seven-segment、segment display、digit與calculator搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何preset把數字畫成線段。實際讀取的Wikipedia Segment display頁面（七段顯示器顯示數字與部分字母；各段以字母a到g稱呼，另有可選的小數點；一個byte可以表示整個狀態，常用gfedcba編碼中0x06點亮c與b段而顯示1；最常見的十進位圖樣為0 abcdef、1 bc、2 abdeg、3 abcdg、4 bcfg、5 acdfg、6 acdefg、7 abc、8 abcdefg、9 abcdfg，另有如帶尾巴的7等替代圖樣）提供數字圖樣；取得的頁面文字沒有段位置、比例或外觀，所以版面（a上、b右上、c右下、d下、e左下、f左上、g中，UV中y向下）、依閱讀順序的5×2格與所有尺度都是作者設定：每條長條的半長0.3、半寬0.06（以數字格寬為單位）、兩端45°斜角，中心在(0, ±0.8)、(±0.34, ±0.4)與(0, 0)，數字格寬1、高2.5，每條長條是四個平滑半平面遮罩（兩側與兩個斜角，沿長條方向的符號摺疊）的乘積，所以尖端保持C1。長條凹進0.6的面層之下0.1；面板色調0.05±0.02顆粒，未亮殘影加0.15、亮條加0.75，色盤14,10,10 / 255,150,40，粗糙度面板0.45、亮條0.2，occlusion 0.97、殘影減0.25，relief 0.03皆為作者近似；沒有建模或主張任何LED、LCD、發光或標準，也不複製或打包圖片。一個UV tile代表0.2 m（5×2格、每格寬4 cm高10 cm）。獨立kernel存128² grain，共131,072 B table（16,384 Float64），非總RAM；每點摺疊一個圖樣碼、略過範圍外的長條並最多計算幾個平滑遮罩，無hypot、平方根、trig、hash或配置，通用detail略過，mortar保持0。Seed只改變面板顆粒，數字保持固定；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明、發光或位移。

`ulamspiral`（Ulam質數螺旋）新增作者Ulam質數螺旋磁磚：15×15格的tile以正方形螺旋寫入整數1–225，1在正中央，質數所在的格以光滑深色凸圓頂標記，位於較粗糙的淡色非金屬石板上，板面在每個格邊有凹陷的格線溝。它不是`tactilepaving`（規則排列的截錐警示凸點）、`dominoes`（標準0–6凹點排列）或其他既有凸點與孔洞preset，且以ulam、prime、spiral與number theory搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何preset的圖樣來自數字（既有的spiral命中是蕨類卷芽、肉桂皮捲與蝴蝶酥等捲曲形狀）。實際讀取的Wikipedia Ulam spiral頁面（Stanisław Ulam於1963年設計、由Martin Gardner推廣；把正整數寫成正方形螺旋，最常見是1在中央，再標記質數；螺旋中的線對應二次多項式4n² + bn + c，且同一條斜線上的數全為奇數或全為偶數，所以2以外的質數都落在交替的斜線上）提供構造；取得的頁面文字沒有描述圖的方向，所以方向（2在1的右側，之後逆時針，UV中列向下延伸）、15×15尺寸與所有尺度都是作者設定：距中心偏移(x, y)的格依環r = max(|x|, |y|)從(2r + 1)²與所在邊編號，再以226項篩法標出質數（225個數中有48個）。每個被標記的格有一個半徑0.38格的圓頂，高度剖面為(1 − s²)²（s為正規化半徑，邊緣斜率為零、不需平方根），石板高度0.3、每個格邊有深0.12、半寬0.05格的溝（兩個平滑一維方盒的乘積聯集，所以格角C1相接），圓頂最高0.9，板面色調0.74±0.12顆粒、溝內減0.3、圓頂0.09，色盤30,38,58 / 234,226,206，粗糙度板面0.8、圓頂0.3，occlusion由0.97降到溝內0.65，relief 0.02皆為作者近似；不主張任何材料、標準、產品或數學認證，也不複製或打包圖片。一個UV tile代表0.375 m（15格、每格2.5 cm）。獨立kernel存226 byte篩表、225個質數旗標與128² grain，共131,523 B tables（grain 16,384 Float64），非總RAM；螺旋編號與篩法只在建立sampler時執行，每點讀一個旗標並計算兩個方盒與最多一個圓頂，無hypot、平方根、trig、hash或配置，通用detail略過，mortar保持0。Seed只改變石板顆粒，被標記的質數保持固定；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明或位移。

`papertape`（打孔紙帶）新增作者打孔紙帶：一吋寬、十個0.1吋字元列×九條孔軌的八軌紙帶tile，淡色非金屬紙面上以孔洞編碼ASCII文字「PAPER TAPE」，並有一列較小的導孔偏向一側邊緣，每個孔中都露出深色底襯，孔較粗糙、較深色且遮蔽較強。它不是`punchcard`（2×4張奶油色卡片與20×8矩形打孔）或其他既有穿孔、點狀preset，且以punched tape、braille、morse、barcode、QR、seven-segment、dot-matrix、ulam、cellular automaton、piano roll與music box搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何preset以圖樣編碼資料。實際讀取的Wikipedia Punched tape頁面（資料是紙帶橫列上有孔或無孔；一列較小的導孔永遠打出，略偏向一側邊緣，把紙帶分成不等寬，較窄一側放最低有效位元；常見1吋寬紙帶供六位元以上使用，孔距兩方向皆0.1吋，資料孔直徑0.072吋（1.8 mm）、導孔直徑0.046吋（1.2 mm）；其範例二進位01011010為ASCII Z）提供幾何；取得的頁面文字沒有訊息內容、孔軌分配或同位慣例，這些是自行決定：有孔為1位元，導孔列是九軌中的第4軌（距窄邊0.4個紙帶寬、距另一邊0.6），第1–3軌放位元0–2、第5–9軌放位元3–7，位元7是偶同位，所以每個字元列的資料孔數都是偶數。Kernel由「PAPER TAPE」的ASCII碼加同位位元建立每列byte，孔為半徑0.36（資料）與0.23（導孔）列距、0.05平滑肩部的圓盤（頁面的0.072與0.046吋直徑除以0.1吋孔距），紙面高度0.7、底襯0.1（落差0.6），紙帶邊緣縫線寬0.012個tile（深0.15），紙面色調0.72±0.14顆粒，色盤58,48,38 / 236,224,196，紙面粗糙度0.75、孔內0.92，occlusion由0.97降到孔內0.30，relief 0.008皆為作者近似；0.1 mm紙厚、半透明、上油或chadless紙、紙帶捲與沖孔公差沒有建模，也不主張任何標準、設備或產品，不複製或打包圖片。一個UV tile代表0.0254 m（一吋紙帶、十個字元列）。獨立kernel存10個列byte與128² grain，共131,082 B tables（grain 16,384 Float64），非總RAM；每點讀一個列byte、選最近孔軌並最多計算一個圓盤（一次平方根），無hypot、trig、hash或配置，通用detail略過，mortar保持0。Seed只改變紙纖維，打孔文字保持固定；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明或位移。

`moorecurve`（Moore曲線磁磚）新增作者Moore曲線溝槽磁磚：在淡色非金屬面層的8×8格tile上，一條封閉且連續的深色溝槽穿過每一格，溝槽凹陷、較粗糙且較深色。它不是`braincoral`（自然迷宮狀脊線）、`guilloche`、`greekkey`、`truchettiles`、`hextruchettiles`、`circuitboard`或其他既有溝槽、迷宮與磁磚類preset，且以hilbert、peano、moore與space-filling搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何preset具有這種曲線（既有的meander與labyrinth命中是自然脊線與鏈條）。實際讀取的Wikipedia Moore curve頁面（連續的碎形填滿空間曲線，是Hilbert曲線的封閉版本，可視為四條Hilbert曲線讓端點重合而成）提供概念；取得的頁面文字沒有L-system規則，所以離散構造是在此自行建立並以數值檢查：4×4區塊上的二階Hilbert曲線（以迭代位元轉換由曲線索引求格子，起點為角落(0,0)、終點為(3,0)，相鄰步進）旋轉進四個象限（左下與左上逆時針、右上與右下順時針，皆在垂直中線進出），使64格形成一個漢米頓迴路，且閉合步也是相鄰步。溝槽是中央方塊與每個連結鄰格方向的臂的聯集，每一項都是平滑一維方盒的乘積（半寬0.17格、肩部0.04格，所以寬0.3格，在0.64 m名義tile、每格8 cm時為2.4 cm），聯集用1−∏(1−項)，臂直達格邊界，所以相鄰格以C1相接；沒有臂越過tile邊界，每個重複的tile各自有一條迴路。溝槽比0.7的面層凹0.45，面層色調0.70–0.80、溝槽約0.14–0.24（色盤46,42,40／228,220,202），粗糙度面層0.45、溝槽0.9，occlusion 0.96降到0.46，relief 0.015皆標示為作者近似，不宣稱材料、雕刻工法、標準或產品，也不複製或打包任何圖片。獨立kernel儲存64個連結byte、128個路徑byte與128² grain，共131,264B tables（grain為16,384個Float64），非總RAM；Hilbert轉換只在建立sampler時執行，每點讀一個連結byte並計算兩個方盒與最多四條臂，因此每點不執行hypot、平方根、三角函數、hash或配置；通用detail略過，mortar保持0。Seed只改變面層顆粒，迴路保持固定；不透明非金屬四張map、預設metallic 0、選用height、tint／repeats、Worker／cache與個別texture所有權皆不變，沒有新增網格、透明或位移。

`sierpinskicarpet`（Sierpinski地毯）新增作者Sierpinski地毯石磚：在81×81格的tile上做四層地毯遞迴，每個保留區塊的中央三分之一向下凹，得到1個27×27格、8個9×9格、64個3×3格與512個1×1格（共585個）凹方，位於淡色非金屬石面上，越大的凹方越深越暗。它不是`perforatedmetal`、`cofferedconcrete`、`splitfaceblock`、`breezeblock`、`tactilepaving`或其他既有點蝕、嵌板或磁磚類preset，且以sierpinski、fractal、menger、cantor與space-filling搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何preset具有這種遞迴圖樣。實際讀取的Wikipedia頁面（Sierpiński carpet：正方形分成3×3共9個全等子方形、移除中央一格，並對剩下8格遞迴套用；等價於單位正方形中以三進位表示的座標在同一位置沒有同時出現數字1的點，極限面積為零、Hausdorff維度log 8／log 3≈1.8928）提供構造規則。這個材質是有限四層近似，不是極限集合：4,096＝8⁴個保留格與2,465＝81²−8⁴個凹陷格，名義凹陷比例1−(8/9)⁴≈0.3757。每個凹方是兩個平滑一維方盒的乘積，每側內縮0.04格並有0.14格肩部，因此邊緣為C1且不需smooth minimum，tile邊界格從不凹陷，所以tile可無縫重複。凹方底部的相對高度為0.1、0.17、0.24與0.31（對面層0.7，越大越深），底部色調0.14–0.32（面層0.58–0.70），粗糙度面層0.55、凹方0.88，occlusion由0.96降到0.46，色盤62,52,44／218,200,168、相對UV起伏0.02與0.81 m名義tile（1 cm格）皆標示為作者近似，不宣稱石種、雕刻工法、尺寸標準或產品，也不複製或打包任何圖片。獨立kernel儲存128² grain，共16,384個Float64／131,072B table，非總RAM，另有四項常數；每點最多測試四層並以三進位數字迴圈判斷，只對保留區塊計算兩個smooth方盒，每點不執行hypot、平方根、三角函數、hash或配置；通用detail略過，mortar保持0所以不混入灰色填縫。Seed只改變石面顆粒與色調，凹方配置保持固定；不透明非金屬四張map、預設metallic 0、選用height、tint／repeats、Worker／cache與個別texture所有權皆不變，沒有新增網格、透明或位移。

`chladnifigure`（Chladni圖形）新增作者Chladni圖形表面：在深色、較光滑的非金屬板上，淡色細沙沿著駐波圖樣的節線聚集，沙略高於板面且比板面粗糙。它不是`sanddune`、`pebblebeach`、`sandstone`、`perforatedmetal`或其他既有沙、石與板類preset，且以chladni與cymatic搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何preset具有這種圖樣（Fibonacci／phyllotaxis、sierpinski、hilbert等數學圖樣搜尋同樣為空）。實際讀取的Wikipedia頁面（要求的Chladni figure網址回傳標題為Ernst Chladni的頁面，其Chladni figures章節說明共振的板或膜被分成振動方向相反的區域，以沒有振動的節線為界，且Chladni用弓拉薄薄覆沙的金屬片，沙會集中在表面靜止的節線上）只提供物理概念。該頁沒有公式，所以節函數是作者的理想化，並非任何實體板的模型：f(u,v)＝cos(aπu)cos(bπv)−cos(bπu)cos(aπv)，a＝5、b＝9；同奇偶的模態使f(u+1,v)＝±f且f(u,v+1)＝±f，因此零集與UV tile精確重複（奇偶不同會破壞接縫），u與v對調使f變號，u→1−u或v→1−v只翻轉符號，所以圖樣對兩軸與對角線鏡射。沙寬使用到零集的一階距離|f|／√(|∇f|²＋3²)，而非對f設門檻，因此線寬均勻，只有交叉點會稍微堆高；沙覆蓋率為smooth(1−distance／(0.012×(0.75＋0.5×grain)))，grain為seed決定的週期128²雜訊，使沙緣粗糙度在寬度±25%內變動（一條線約為tile的0.012，在0.6 m名義tile約7 mm），沙高出板面約0.5個relief，粗糙度由板面0.34升到沙0.93，occlusion由0.97降到0.72，色盤26,29,34／232,220,194使板面很深（約0.12–0.15）、沙很淡（0.82–0.95）。模態數、寬度、梯度下限3、relief 0.01與粗糙度皆為作者設定；不宣稱邊界條件、材料、激振、沙粒物理或任何產品，也不複製或打包任何圖片。獨立kernel儲存128² grain，共16,384個Float64／131,072B table，非總RAM，每點計算四個cos、四個sin與一個平方根，沒有hash或配置；通用detail略過。它寫入mortar 0，因為非零值會把灰色填縫色混進板面。Seed只改變沙粒（沙緣粗糙度與色調），節線保持固定；不透明非金屬四張map、預設metallic 0、選用height、tint／repeats、Worker／cache與個別texture所有權皆不變，沒有新增網格、透明或位移。

`kisrhombilletiles`（Kisrhombille磁磚）新增作者V4.6.12 kisrhombille釉面鑲嵌近似：三角晶格上的每個六邊形被六條通往角點與六條通往邊中點的輻線切成十二個全等的30-60-90直角三角形，深青色與奶油色三角形繞每個六邊形中心交替，因此每條直邊都落在相隔30°的六組平行線之一；每個面都有窄斜邊並被較粗糙的灰色填縫圍出。它不是`rhombille`（每個六邊形三個菱形）、`trihexagonaltiles`（六邊形與三角形，3.6.3.6）、`righttriangletiles`（分割正方形中的等腰直角三角形）、其對偶`truncatedtrihexagonaltiles`（4.6.12）或其他既有磁磚preset，且以kisrhombille、30-60-90、deltoidal、tetrakis、triakis、floret與prismatic pentagon搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何preset具有這種鑲嵌（唯一的floret命中是無關的花椰菜小花）。實際讀取的Wikipedia頁面（要求的Kisrhombille tiling網址回傳標題為Truncated trihexagonal tiling的頁面，其Kisrhombille tiling章節說明該鑲嵌由全等30-60-90三角形構成、每個頂點交會4、6或12個三角形，可視為正六邊形鑲嵌且每個六邊形由中心分成12個三角形，或視為二等分的三角鑲嵌，或六組平行線的無限排列，標記為V4.6.12，三角形是p6m [6,3]對稱的基本域）提供拓樸。幾何是推導並以數值檢查，不是抄自來源：六邊形邊長為1時，六邊形內切半徑為√3/2，六邊形中心位於間距√3≈1.73205的三角晶格，每個三角形斜邊為1（通往角點的輻線）、長股√3/2、短股1/2（面積√3/8≈0.21651），六邊形面積3√3/2≈2.59808，並以30萬點sampler檢查12個扇形：磁磚占比0.72137，與由內縮30-60-90幾何推得的0.72205相符。每個UV tile為7欄×4雙列（56個六邊形＝672個三角形，超晶格比高度寬1.04%並被拉到正方形UV tile，沿用既有7×8六角磁磚preset的近正方形慣例）、填縫每側0.02、肩部0.015、青綠／奶油色盤（28,70,84／236,226,200）、釉面粗糙度0.3、填縫粗糙度0.92、相對UV起伏0.012與1.2 m名義tile（六邊形邊長約0.1 m）皆標示為作者近似，不宣稱磁磚厚度、釉料化學、填縫材料、尺寸規格或產品。獨立kernel儲存26個輻線cos／sin值、672個三角形色調與96² grain，共9,914個Float64／79,312B tables，非總RAM；每點在九個晶格節點中選最近者，再以兩條輻線半平面檢查12個扇形，只對通過者計算六邊形邊半平面與三個smooth邊，因此每點不執行hypot、平方根、三角函數、hash或配置；通用detail略過。每個面是以填縫內縮的三個smooth半平面乘積，相鄰支撐不重疊，轉角不需smooth minimum。Seed只改變三角形色調（深青0.11–0.24、奶油0.80–0.92）與細顆粒，晶格保持固定；色調索引含傾斜週期的晶格位移，但所有接縫都落在填縫上，因此該索引無法觀察。不透明非金屬四張map、預設metallic 0、選用height、tint／repeats、Worker／cache與個別texture所有權皆不變，沒有新增網格、透明或位移。

`truncatedtrihexagonaltiles`（截角三六角磁磚）新增作者4.6.12截角三六角（truncated trihexagonal）釉面鑲嵌近似：大型奶油色正十二邊形位於三角晶格，每條晶格邊上有一個旋轉到三個相差60°方向之一的靛藍小正方形，每個晶格三角形中心有一個薰衣草色正六邊形，因此每個頂點交會一個正方形、一個六邊形與一個十二邊形；每個面都有窄斜邊並被較粗糙的灰色填縫圍出。它不是`dodecagontiles`（標準3.12.12）、`trihexagonaltiles`（3.6.3.6）、`rhombitrihexagonaltiles`（3.4.6.4）或其他既有磁磚preset，且以truncated trihexagonal與4.6.12搜尋README／PLAN／DESIGN／CURRENT／TECHNICAL與preset目錄，沒有任何preset具有這種頂點類型。實際讀取Wikipedia Truncated trihexagonal tiling頁面（八種半正則鑲嵌之一，每個頂點一個正方形、一個六邊形與一個十二邊形，Schläfli符號tr{3,6}；該名稱容易誤導，因為三六角鑲嵌的真正截角會得到矩形，且六邊形與十二邊形無法同時是正多邊形；只有一種均勻著色，對偶為kisrhombille鑲嵌V4.6.12）取得拓樸；取得的頁面其別名清單是空的，所以「great rhombitrihexagonal」只是常見別名，並非取自該頁。幾何則是推導並以數值檢查，不是抄自來源：單位邊長時十二邊形的內切半徑是(2 + √3)/2，十二邊形中心位於間距3 + √3 ≈ 4.73205的三角晶格（兩個內切半徑加一個正方形邊長），每條晶格邊的中點有一個正方形，其沿晶格邊的兩側面向十二邊形、橫跨晶格邊的兩側面向六邊形，每個晶格三角形的形心有一個六邊形，其邊交替面向正方形與十二邊形，一格為1個十二邊形＋3個正方形＋2個六邊形、面積(3 + √3)²√3/2 ≈ 19.3923，7×4超晶格內30萬個隨機點在±1與±2兩種節點鄰域下都恰好落在一個多邊形內（無空隙、無重疊）。每個UV tile 7欄×4雙列（56個十二邊形＋168個正方形＋112個六邊形；此超晶格比高度寬1.04%並被拉到正方形UV tile上，與既有7×8的六角磁磚preset相同的近正方形慣例）、每側0.03的填縫（總寬0.06邊長）、0.02肩部、靛藍／奶油色盤（40,40,86／242,230,206）、釉面粗糙度0.3、填縫粗糙度0.92、UV相對起伏0.012與1.6 m名目tile（邊長約0.0483 m）皆為作者近似，不宣稱磁磚厚度、釉料化學、填縫材料、尺寸規格或產品。獨立kernel只有12個多邊形中心值、144個邊法線值、336個磁磚色調與96²顆粒，共9,708個Float64／77,664 B表格（不是總RAM），另有三個六項常數；每點測試3×3個晶格節點鄰域×6個多邊形（54次圓外接半徑平方檢查），只對可能包含該點的多邊形逐邊計算一個smooth半平面，因此每點沒有hypot、平方根、三角函數、hash或配置，並略過通用detail。每個面是以填縫內縮的smooth半平面乘積，所以相鄰磁磚的支撐不會重疊，角落也不需要smooth minimum；色調索引以傾斜週期的晶格位移在超晶格上環繞。Seed只改變磁磚色調（十二邊形0.82–0.94、六邊形0.3–0.4、正方形0.08–0.18）與細顆粒，晶格固定；不透明非金屬四張map、預設metallic 0、可選height、tint／repeats、Worker／cache與逐張texture所有權不變，不新增mesh、透明或位移。

`elongatedtriangulartiles`（長三角磁磚）新增作者3.3.3.4.4長三角（elongated triangular）釉面鑲嵌近似：赤陶色的單位邊長正方形排成直立列，與奶油色朝上／朝下正三角形列交替，相鄰的正方形列錯開半個邊長，每個頂點交會三個三角形與兩個並排的正方形；每個面都有窄斜邊並被較粗糙的灰色填縫圍出。它與`snubsquaretiles`的頂點含三個三角形與兩個正方形相同但順序不同（那裡的正方形旋轉±15°且不共邊，這裡的正方形直立並在列內共用垂直邊），也不是既有六邊形加三角形（`trihexagonaltiles`）、`rhombitrihexagonaltiles`（3.4.6.4）、Cairo五邊形或直角三角形磁磚；以elongated triangular與3.3.3.4.4搜尋README／PLAN／DESIGN／CURRENT／TECHNICAL與preset目錄，沒有任何preset具有這種鑲嵌。實際讀取Wikipedia Elongated triangular tiling頁面（每個頂點三個三角形與兩個正方形的半正則鑲嵌，是以正方形列拉長的三角鑲嵌，Schläfli符號{3,6}:e，與扭稜正方形鑲嵌相似但頂點順序不同，Conway稱isosnub quadrille）取得拓樸；幾何則是推導並以數值檢查，不是抄自來源：單位邊長時一個週期寬1、高2 + √3 ≈ 3.73205，含2個正方形與4個三角形（一列正方形、一列朝上／朝下三角形、錯開0.5的一列正方形、第二列三角形），15×4個週期內30萬個隨機點都恰好落在一個多邊形內（無空隙、無重疊）。每個UV tile 15欄×4週期（120個正方形＋240個三角形；此tile比高度寬0.5%並被拉到正方形UV tile上）、每側0.035的填縫（總寬0.07邊長）、0.02肩部、赤陶／奶油色盤（112,48,36／232,214,170）、釉面粗糙度0.34、填縫粗糙度0.92、UV相對起伏0.012與1.2 m名目tile（邊長0.08 m）皆為作者近似，不宣稱磁磚厚度、釉料化學、填縫材料、尺寸規格或產品。獨立kernel只有12個多邊形中心值、48個邊法線值、360個磁磚色調與96²顆粒，共9,636個Float64／77,088 B表格（不是總RAM），另有三個六項常數；每點測試3×3個週期格鄰域×6個多邊形（54次圓外接半徑平方檢查），只對可能包含該點的多邊形逐邊計算一個smooth半平面，因此每點沒有hypot、平方根、三角函數、hash或配置，並略過通用detail。每個面是以填縫內縮的smooth半平面乘積，所以相鄰磁磚的支撐不會重疊，角落也不需要smooth minimum。Seed只改變磁磚色調（正方形0.1–0.22、三角形0.78–0.92）與細顆粒，晶格固定；不透明非金屬四張map、預設metallic 0、可選height、tint／repeats、Worker／cache與逐張texture所有權不變，不新增mesh、透明或位移。

`rhombitrihexagonaltiles`（菱形三六角磁磚）新增作者3.4.6.4菱形三六角（rhombitrihexagonal）釉面鑲嵌近似：正六邊形位於三角晶格，每條晶格邊上有一個旋轉到三個相差60°方向之一的正方形，每個晶格三角形中心有一個正三角形，因此每個頂點交會一個三角形、一個正方形、一個六邊形與另一個正方形；六邊形為奶油色釉、正方形為石板藍、三角形為海軍藍，每個面都有窄斜邊並被較粗糙的灰色填縫圍出。它不是`snubsquaretiles`（3.3.4.3.4）、`trihexagonaltiles`（六邊形加三角形）、`dodecagontiles`（標準3.12.12）或其他既有磁磚preset，且以rhombitri與3.4.6.4搜尋README／PLAN／DESIGN／CURRENT／TECHNICAL與preset目錄，沒有任何preset具有這種頂點類型。實際讀取Wikipedia Rhombitrihexagonal tiling頁面（每個頂點一個三角形、兩個正方形與一個六邊形的半正則鑲嵌，Schläfli符號rr{3,6}，即expanded hexagonal tiling，與truncated trihexagonal tiling相關）取得拓樸；幾何則是推導並以數值檢查，不是抄自來源：單位邊長時六邊形中心位於間距1 + √3 ≈ 2.73205的三角晶格（內切半徑√3/2＋正方形邊長1＋內切半徑√3/2），六邊形的邊面向晶格方向，每條晶格邊的中點有一個正方形，每個晶格三角形的形心有一個三角形，一格為1個六邊形＋3個正方形＋2個三角形、面積(1 + √3)²√3/2 ≈ 6.4641，7×4超晶格內30萬個隨機點都恰好落在一個多邊形內（無空隙、無重疊）。每個UV tile 7欄×4雙列（56個六邊形＋168個正方形＋112個三角形；此超晶格比高度寬1.04%並被拉到正方形UV tile上，與既有7×8的六角磁磚preset相同的近正方形慣例）、每側0.03的填縫（總寬0.06邊長）、0.02肩部、海軍藍／奶油色盤（20,52,88／244,232,200）、釉面粗糙度0.3、填縫粗糙度0.92、UV相對起伏0.012與1.2 m名目tile（邊長約0.0628 m）皆為作者近似，不宣稱磁磚厚度、釉料化學、填縫材料、尺寸規格或產品。獨立kernel只有12個多邊形中心值、72個邊法線值、336個磁磚色調與96²顆粒，共9,636個Float64／77,088 B表格（不是總RAM），另有三個六項常數；每點測試3×3個晶格節點鄰域×6個多邊形（54次圓外接半徑平方檢查），只對可能包含該點的多邊形逐邊計算一個smooth半平面，因此每點沒有hypot、平方根、三角函數、hash或配置，並略過通用detail。每個面是以填縫內縮的smooth半平面乘積，所以相鄰磁磚的支撐不會重疊，角落也不需要smooth minimum；色調索引以傾斜週期的晶格位移在超晶格上環繞。Seed只改變磁磚色調（六邊形0.82–0.94、正方形0.3–0.4、三角形0.08–0.18）與細顆粒，晶格固定；不透明非金屬四張map、預設metallic 0、可選height、tint／repeats、Worker／cache與逐張texture所有權不變，不新增mesh、透明或位移。

`snubsquaretiles`（扭稜正方形磁磚）新增作者3.3.4.3.4扭稜正方形釉面鑲嵌近似：單位邊長的正方形在半格子棋盤上交替旋轉約+15°與−15°，正三角形填滿所有空隙，因此每個頂點交會三個三角形與兩個正方形；正方形為深藍釉、三角形為奶油色釉，每個面都有窄斜邊並被較粗糙的灰色填縫圍出。它不是既有六角形加三角形（`trihexagonaltiles`）、Cairo五邊形（`cairotiles`）或直角等腰三角形（`righttriangletiles`）磁磚，且以snub、3.3.4.3.4與Archimedean搜尋README／PLAN／DESIGN／CURRENT／TECHNICAL與preset目錄，沒有任何preset具有這種頂點類型（唯一命中是`cinnamonbarkcoils`的阿基米德螺線）。實際讀取Wikipedia Snub square tiling頁面（每個頂點三個三角形與兩個正方形的半正則鑲嵌，Schläfli符號s{4,4}，與頂點類型3.3.3.4.4的elongated triangular tiling相關）取得拓樸；幾何則是推導並以數值檢查，不是抄自來源：單位邊長時方格晶格常數為(1 + √3)/√2 ≈ 1.93185，正方形位於晶格節點（旋轉+15°）與格心（旋轉−15°），節點正方形四邊向外的四個正三角形補滿一格，20萬個隨機點都恰好落在每格2個正方形＋4個三角形之一（無空隙、無重疊，面積總和等於格面積）。每個UV tile 3×3個晶格格（18個正方形＋36個三角形）、每側0.035的填縫（總寬0.07邊長）、0.02肩部、藍／奶油色盤（34,64,98／238,226,192）、釉面粗糙度0.3、填縫粗糙度0.92、UV相對起伏0.012與0.6 m名目tile（邊長約0.1035 m）皆為作者近似，不宣稱磁磚厚度、釉料化學、填縫材料、尺寸規格或產品。獨立kernel只有12個多邊形中心值、48個邊法線值、54個磁磚色調與96²顆粒，共9,330個Float64／74,640 B表格（不是總RAM），另有三個六項常數；每點測試3×3個晶格節點鄰域×6個多邊形（54次圓外接半徑平方檢查），只對可能包含該點的多邊形逐邊計算一個smooth半平面，因此每點沒有hypot、平方根、三角函數、hash或配置，並略過通用detail。每個面是以填縫內縮的smooth半平面乘積，所以相鄰磁磚的支撐不會重疊，角落也不需要smooth minimum。Seed只改變磁磚色調（正方形0.1–0.22、三角形0.78–0.92）與細顆粒，晶格固定；不透明非金屬四張map、預設metallic 0、可選height、tint／repeats、Worker／cache與逐張texture所有權不變，不新增mesh、透明或位移。

`starfish`（海星）新增作者五臂海星近似：多數owner各有一隻隨機旋轉的海星，由圓潤的中央圓盤與五條由根到尖逐漸變窄的圓臂組成，臂的夾角與長度略不規則，每條臂有圓頂與沿臂的脊線，脊線上與兩側有三列小瘤點，星與星之間是較粗糙、較暗的灰色砂底。它不是Starcoral（珊瑚杯與放射隔片）、Staranise（八個木質果莢圍繞凹陷種子腔）、Seaurchintest（象牙色殼與成對孔列）或扇貝疊壓家族（`scalemail`、`fishscales`）。實際讀取Wikipedia Starfish條目（中央圓盤、通常五臂、背面平滑、顆粒或多刺並由重疊骨板構成、常為紅或橘色、篩狀篩板），並實際檢視Wikimedia Commons的Starfish montage圖；以PIL量測圖中橘色標本輪廓，得到五個臂尖距中心171–183 px、谷深約為臂尖半徑的0.17–0.26、臂寬在0.5倍與0.85倍半徑處約為0.195與0.148倍半徑、相鄰臂尖夾角63.5–88.5°；同圖其他標本更窄或更寬（有角的沙色標本約0.25–0.3倍半徑），因此這些數字只描述一個標本，不代表物種。3×3格、固定五臂、軸向±0.1 rad抖動、臂長±6%、0.4格半徑、0.25R圓盤、根／尖半寬0.1R／0.07R、瘤點列（間距0.05格、半徑0.017）、灰砂底、灰到橘色盤、粗糙度0.66、UV相對起伏0.02與0.3 m名目tile皆為作者近似，不宣稱物種、篩板、管足、棘刺、色彩校正、真實尺寸或海洋生物學數據。獨立kernel只有180個pose Float64（9個owner×20）加128²顆粒與16²底面場，共16,820個Float64／134,560 B表格，不是總RAM；每點以最大投影選臂（不做角度三角函數），用2次hypot與12次SmoothStep，無逐點配置、hash或三角函數（`cos`／`sin`只在建立pose時使用），並略過通用detail。臂寬以smoothstep漸縮，使尖端與根部斜率為零；臂專屬起伏僅在離中心0.2R–0.25R之外淡入，因此相鄰兩臂交接的折線沒有起伏斜率折點；圓盤與臂以`1 − (1 − 臂)(1 − 圓盤)`合併。Seed改變哪些owner有海星，以及旋轉、臂抖動、色調與細顆粒；不透明非金屬四張map、預設metallic 0、可選height、tint／repeats、Worker／cache與逐張texture所有權不變，不新增mesh、透明或真實臂幾何。

`fishscaleshingles`（魚鱗瓦片）新增作者魚鱗狀金屬瓦片近似：8層各12個半圓形下緣瓣的橫列，每片瓦寬兩瓣，逐層交錯半瓣，上層下緣疊壓下層並在下層留下底部陰影；瓦片之間有窄深縫與略不同的塗裝色。它不是Hopsack／Waffleweave的織物格、Slate／Tiles的矩形瓦，也不是Snowflaketiles或Circularpavers的幾何鋪面。已讀Berridge Fish Scale Shingles頁（24 gauge鋼、輕微紋理的圓形扇貝輪廓、每片覆蓋8 1/2英寸高×11 1/2英寸寬、每square 148片；8.5×11.5×148＝14,467 in²，與100 ft²＝14,400 in²約略一致（差約0.5%）），並實看兩張白色／米色產品圖（每片下緣有兩個半圓瓣、相鄰層錯位疊壓、表面有淡波紋壓花）；另讀Yusheng Fish-Scale石粒金屬瓦頁（小型重疊扇貝單元，約2.8片／m²），但沒有取用其數字。由Berridge覆蓋比取課高對瓣寬比：每片兩瓣，故課高／瓣寬＝2×8.5／11.5≈1.478，本材質12瓣×8層為1.5（差約1.5%），並以12×5.75 in≈1.75 m作為nominal tile。來源與圖沒有可讀的瓣偏移量，所以相鄰層錯半瓣、唇厚、陰影寬度、縫寬、塗裝色與每片色差都是作者近似；不模擬壓花紋理、金屬反射、鋼板彎折、固定件或規格認證，也不是木瓦。獨立kernel：只有8×6片的色調表與128² grain，共16,432 Float64／131,456B tables，非總RAM；逐點四次hypot與12次SmoothStep，兩個最近瓣距離以多項式smooth-min合併（避免距離場中軸的斜率折點），無每點配置、hash或trig，通用detail略過。每層先各自算好顏色、高度與AO再依覆蓋率混合，使縫中心的色階被縫色蓋住而不留下階跳。0.012 UV-relative relief與配色為作者近似；seed只改每片色調與grain，瓣與縫位置固定；維持opaque dielectric四maps、預設metallic 0、optional height、tint／repeats、Worker／cache與各自texture ownership；不新增mesh、透明、折射或真實疊壓幾何。與既有`scallopedslate`（4欄×6列、1.2 m tile、每片單一圓尾的藍灰板岩、片間無縫）、`fishscaletiles`（4欄×8列共平面釉面馬賽克）及`scalemail`同屬扇貝疊壓家族，本材質只是由Berridge覆蓋比取得的變體：12瓣×8層、每片兩瓣、片間有窄縫與塗裝色差、1.75 m tile與下層陰影，不應被視為全新的屋瓦類別。

`waffleweave`（華夫格織）新增作者華夫格織布近似：14×16個固定格的圓脊圍出內凹小方格，格底呈淺碗狀，橫向脊比縱向脊高，兩向脊交點隆起成小結；不是Matelasse的凸菱接結、Basketweave／Hopsack的連續籃紋，也不是Honeycomb的黃色六角蜂巢。已讀Wikipedia Waffle fabric（又稱honeycomb fabric；平紋格心周圍以長經緯浮線形成方形脊與凹陷）、Ashford〈The Squish is real〉（長浮線在方格上互鎖，脊是格的外框、凹格是交織較緊處，整理後浮線鼓起）與LinenMe waffle towel指南（凹格與凸脊；新布較平、洗後更明顯），並實看Wikimedia Commons〈An example of waffle fabric〉特寫（橫向脊較明顯、交點有圓結、格內凹陷）；Ashford與LinenMe頁面的圖片實看後只見織機與掛著的毛巾，沒有可讀的織構，不當作外觀依據。這些來源沒有格尺寸、脊高或經緯脊比例數字，所以14×16格（0.12m tile上約8.6×7.5 mm）、凹格寬度、橫／縱脊高0.9／0.7、碗深與交點結量都是作者近似；「橫脊較強」只是單張特寫的觀察，不是織物規格。不聲稱真實經緯交織、織紋圖、織物物理、吸水性或棉／亞麻／微纖維規格。獨立kernel：沒有逐格表，只有128² grain與8² cloud共16,448 Float64／131,584B tables，非總RAM；逐點兩次fract／abs與最多四個SmoothStep，無配置、hash、trig或sqrt，通用detail略過。0.12m nominal tile、0.012 UV-relative relief與冷灰白配色皆為作者近似；seed只移動細grain與雲狀明暗，格線與脊位不隨seed改變；維持opaque dielectric四maps、預設metallic 0、optional height、tint／repeats、Worker／cache與各自texture ownership；不新增mesh、透明孔洞、布料模擬、真實針織／梭織結構或規格認證。與既有`wafflecloth`（8×8對稱隆起邊框；實測縱／橫脊高只差約0.6%、交點不比脊高）屬同一織物家族，本材質只是較細的14×16近似變體：橫脊比縱脊高約0.08個relief單位、凹格為碗形、每個交點另有高出橫脊約0.10單位的結，且取材於不同參考，不應被視為新的織物類別。

`halite`（岩鹽）新增作者乳白立方hopper晶面近似：多數owner各有一片隨機旋轉的平齊正方形立方面，面內依序往內下陷兩層同心的正方階面，像hopper晶體的逐級凹面；晶面為乳白色低粗糙度，貼在淡灰粉色的粗糙鹽底上。它不是Calcite的75°斜方板、Celestine／Barite的長方形板、Wulfenite的近方板，也不是沒有階面的平整方塊。已讀Handbook of Mineralogy（等軸晶系、{001}完全解理、skeletal／hopper-shaped faces、純淨時無色或白色）與Minerals.net（立方體有時帶hopper生長），並實看其粉色hopper群與Death Valley白色立方群照片；這些來源沒有可讀的階面比例或深度數字，因此晶面半徑、兩層階面約0.74／0.44倍半徑（各±0.06）及每層0.08個height單位的下降都是作者近似，不聲稱量測或認證鹽晶尺寸、透明度、溶蝕物理或礦物種類。獨立kernel：16個seeded owner各存9個pose／階面值，加128² grain與16² host共16,784 Float64／134,272B tables，非總RAM；方形晶面最大支撐含jitter約0.4455小於0.5 owner；逐點一次旋轉與最多六個SmoothStep，無配置、hash、trig或sqrt，通用detail略過。0.08m nominal tile、0.004 UV-relative relief與配色皆為作者近似；維持opaque dielectric四maps、預設metallic 0、optional height、tint／repeats、Worker／cache與各自texture ownership；不新增mesh、透明、折射、晶格、溶解模擬或化學認證。與既有`bismuthhoppers`（4×4個旋轉方形晶面、六層金屬階面、金紫色、0.16 m tile）屬同一旋轉巢狀方形hopper家族；本材質只是白色非金屬鹽晶變體：兩層階面、較小的晶面半寬0.21–0.27（對0.34）、0.08 m tile與粗糙鹽底，不應被視為全新的晶體類別。

`calcite`（方解石）新增作者乳白斜方解理板近似：多數owner各有一片平齊的斜方形板，兩組平行邊夾約75°，內有一片與外形平行、位置略偏的巢狀階面；板面為乳白色低粗糙度，貼在深褐粗糙礦底上。它不是Celestine／Barite的長方形板、Wulfenite的近方板，也不是Pyromorphite／Vanadinite的六角端面。75°是作者近似值：已讀Handbook of Mineralogy（解理{1011}完全）、Wikipedia與LibreTexts（rhombohedral解理、常見白色解理片）及Minerals.net透明冰洲石照片，這些來源沒有提供可讀取的面角數值，因此不聲稱量測或認證解理角、晶體光學、透明度或雙折射。獨立kernel：16個seeded owner各存10個pose／階面值，加128² grain與16² host共16,800 Float64／134,400B tables，非總RAM；板最大支撐含jitter約0.4692小於0.5 owner；逐點一次旋轉、一次斜交換算與最多四個SmoothStep，無配置、hash、trig或sqrt，通用detail略過。0.1m nominal tile、0.0035 UV-relative relief與配色皆為作者近似；維持opaque dielectric四maps、預設metallic 0、optional height、tint／repeats、Worker／cache與各自texture ownership；不新增mesh、透明、折射、晶格或化學認證。

`flangenuts`（六角法蘭螺帽）新增作者鋼製六角法蘭螺帽頂視近似：六個直平側的削角六角本體座在較低的圓形錐面法蘭上，中央為開放圓孔並露出較粗糙的深色鋼底；不是Hex Nuts的無法蘭外形，也不是Cap Nuts的封閉球冠。比例只取DIN 6923 M5–M20尺寸表與圖面趨勢：法蘭直徑dc約為對邊s的1.38–1.48倍，最小對角e約為1.10–1.115×s，最小孔徑da約0.60–0.67×s，法蘭面圖示為15°–30°；本材質法蘭／平邊約1.40、孔／平邊約0.68。16個seeded owner預存六條平面法線；16×12 plane值加96² grain共9,408 Float64／75,264B tables，非總RAM。法蘭半徑0.413小於0.5 owner；逐點為六個smooth平面乘積、一次hypot與少量SmoothStep，無配置、hash、trig或鄰格掃描，通用detail略過。0.08m nominal tile沿用Hex Nuts，0.03 UV-relative relief與配色是作者近似。整個tile含深色鋼底均為metallic1，root factory預設1，explicit factor0不改寫maps；不含底面鋸齒、完整3D螺帽、內螺紋、透明、鋼材硬度、防鏽或DIN／ISO認證。

`capnuts`（六角蓋形螺帽）新增作者鋼製六角蓋形螺帽頂視近似：六個直平側與稍削角的六角本體、封閉圓形球冠與深色粗糙鋼底；不是Hex Nuts的貫穿圓孔。比例只取DIN 1587尺寸表的趨勢：圓冠直徑dk約為對邊s的0.93–0.96，最小對角e約為s的1.106–1.113，並以較低高度的30度削角環近似角隅。16個seeded owner預存六條平面法線，constructor算一次；16×12 plane值加96² grain共9,408 Float64／75,264B tables，非總RAM。削角半徑0.421小於0.5 owner；逐點只有六個smooth平面乘積、一次hypot、少量平方／SmoothStep，無配置、hash、trig或鄰格掃描，通用detail略過。0.08m nominal tile沿用Hex Nuts，0.03 UV-relative relief、dome crown與配色皆是作者近似，非實際螺帽尺寸、螺紋、防鏽或材質認證。整個tile含深色鋼底均為metallic1，root factory預設1，explicit factor0不改寫maps；不含完整3D螺帽、內螺紋、透明、鋼材硬度、DIN／ISO認證或真實鋼材數據。

`bedfordcord`（貝德福德燈芯布）新增作者卡其色經向織入凸棱表面近似：20條垂直棱各由24行扁平緯向短棱組成，相鄰棱交錯半個行距，棱間以連續細溝隔開，棱身低於短棱、溝更低；不是Corduroy的割絨絨條，也不是Ribknit針織圈、Faille／Grosgrain橫向緯肋或逐紗draft浮點。新增獨立case而非塞入既有經緯逐紗kernel：每點只做floor／fract、平方與SmoothStep組合，無配置、hash、trig、sqrt或鄰格掃描，通用detail略過。20×24個短棱tone table與96² grain共9,696 Float64／77,568B，非總RAM；短棱支撐半寬0.45／0.46小於0.5 owner。seed只改短棱色調與細grain，棱距、列距與交錯固定。0.07m nominal tile、0.0018 UV-relative relief、20棱／24列與khaki palette均是作者近似，非布重量、紗支或照片比例校準；金屬maps與root factory預設均0，explicit factor1不改寫maps。不含真實經緯／襯紗交織、布料物理、透光、毛羽、纖維mesh或棉布規格／來源認證。

`staurolite`（十字石）新增作者深褐色60°交叉雙柱側面近似：兩組直平側、鈍平端的柱形輪廓連成四臂，交叉處共用平坦頂面而非堆疊兩倍高度；淺色粗顆粒礦底與較低roughness晶面均為不透明非金屬。16個seeded owner預存雙軸cos／sin、中心、inverse scale與tint，constructor計算相對角；16×8 poses加128²grain共16,512 Float64／132,096B tables，非總RAM。每軸support上界hypot(0.32,0.07)×0.98＋0.07＝0.391016＜0.5，逐點無配置、hash、trig、sqrt或鄰格掃描，略過通用detail。0.12m nominal tile、0.0035 UV-relative relief與60°UV交角是作者表面近似，非晶體尺寸校準；不含完整晶柱mesh、片岩片理、透光折射、礦物鑑定或化學／收藏品認證。

`dowelpins`（無頭圓柱定位銷）新增作者銀色實心無螺紋銷的側影：平行直軸、一端圓弧端、對端小導入倒角與淺橫向圓柱冠面；沒有Clevis Pins凸頭／尾孔、Linchpin閉環或平鍵平坦面。重用Clevis Pins的seeded pose／smooth cover／crown核心，constructor選擇無頭無孔分支並預算端曲率，不計算被略過的head／hole profile；不另造pin kernel。16×6 poses加96²grain仍為9,312 Float64／74,496B tables，非總RAM，不新增table。最大旋轉支撐hypot(0.36,0.095)×0.95＋0.016＝0.369708＜0.5 owner；逐點無配置、hash、trig、sqrt或鄰格掃描，空底略grain、通用detail略過。鋼面metallic1／不透明灰色非金屬背板0，default material factor1／explicit0；0.12m nominal tile、0.0032 UV-relative relief與比例為作者近似，非DIN尺寸或硬度校準。保留四maps／optional height、tint／repeats、Worker／cache與獨立texture ownership，不生成完整圓柱mesh、透明、拔出螺孔、壓入／配合物理、負載、防鏽或DIN／ISO認證。

`europeanbeech`（歐洲山毛櫸）新增作者淡粉褐細直紋徑切面、密而均勻的淺凹縱導管與短小平齊射線斑，不是White Ash早材集中粗孔、White Oak寬長射線或凸木瘤。重用既有White Ash／White Oak的cached-noise／compact vessel／curved-ray核心，令早晚材孔寬與機率相同、降低帶狀色差，constructor-only pore jitter減輕規則列格；射線只改顏色／finish並遮去導管，不額外抬高height。48×24×4孔、6×18×6射線與4×3、96×4、128² noise共22,036 Float64／176,288B tables，非總RAM；孔支撐含jitter為X≤0.445、Y≤0.485 cell，射線X≤0.42、Y≤0.25844，皆小於0.5 owner。逐點無配置、hash、trig、sqrt或鄰格掃描，略過通用detail。0.24m nominal tile、0.0012 UV-relative relief、色彩與密度為作者近似，非木材尺寸或孔徑校準。保留opaque dielectric M0／explicit override、四maps／optional height、tint／repeats、Worker／cache與個別texture ownership；不新增木孔mesh、透光、木種鑑定、蒸煮／化學、防水、結構或來源認證。

`habotai`（羽二重平織絲綢）新增作者珍珠白細密1/1平織面、相同染色的經緯紗、低交織起伏與柔和光澤；不是霧面Batiste棉布、Surah斜紋、Sateen長浮紗或Shantung不規則粗節。重用既有balanced-plain核心與平滑紗肩，只新增preset／constructor分派；僅128²grain共16,384 Float64／131,072B tables，非總RAM，不新增float table。逐點無配置、hash、trig或sqrt，略過通用detail；84／84紗與336／336 filament shading、0.04m nominal tile及0.0002 UV-relative relief為作者選樣，非實際織物密度或厚度校準。珍珠白與低roughness形成柔和反光，並非新增各向異性絲綢BRDF；保留opaque dielectric M0／explicit override、四maps／optional height、tint／repeats、Worker／cache與個別texture ownership。真Habotai可有薄透型態，本preset只選不透明表面近似，不新增透光、皺褶／毛絲mesh、布料物理、momme／纖維成分或保存性能認證。

`azurite`（藍銅礦）新增作者深藍色、寬板柱狀的斜端平坦晶面，局部三片平行、群組各自轉向，晶面帶淺縱紋並高於深色粗礦底；不是Cavansite放射短針、Kyanite細長高起刀片或Wulfenite近方橙板。重用既有Celestine／Barite／Kyanite的seeded plate kernel，只新增profile，不另造晶體核心；25×6 poses加128²grain共16,534 Float64／132,272B tables，非總RAM。旋轉支撐hypot(0.23,0.3446)×0.975＋0.025＝0.428948＜0.5 owner；逐點無配置、hash或鄰格搜尋，沿用一個既有縱紋cosine，略過通用detail。板面是低roughness的opaque dielectric M0，不把照片白色鏡面反射烘焙成金屬或白色染料。0.1m nominal tile、0.0034 UV-relative relief、色彩與晶群密度為作者近似。保留四maps／optional height、tint／repeats、Worker／cache與獨立texture ownership；不新增完整晶柱／晶群mesh、透明折射、pleochroism、晶體生長、礦物／化學或含銅安全認證。

`whiteoak`（徑切白橡木）新增作者暖橄欖褐木面、橫過直木紋的寬長平齊射線斑，以及較淺的縱向凹導管；不同於White Ash無寬射線斑、Lacewood細密鱗斑及凸起木瘤。重用White Ash的環孔材／cached noise核心，只為White Oak加入18組六值曲線射線table，共18,680 Float64／149,440B tables，非總RAM。射線支撐含jitter為X≤0.46、Y≤0.47124 cell，均小於0.5 owner；取樣無配置、hash、trig、sqrt或鄰格掃描，通用detail略過。射線只改顏色與finish，完整射線遮去導管、不額外抬高height；微grain與凹導管才形塑法線。0.24m nominal tile、0.0016 UV-relative relief、色彩與密度是作者近似，並非木材標本校準。保留opaque dielectric M0／explicit override、四maps／optional height、tint／repeats、Worker／cache與個別texture ownership；不新增木孔mesh、透光、木種鑑定、樹脂化學、防水、結構或來源認證。

`clevispins`（有頭連接銷）新增作者銀色無螺紋圓柱銷的側影：短頭在軸兩側凸出，對端保留單一封閉圓形橫孔；軸面有淺圓冠，沒有Linchpin閉環、R-clip彎線、Gib-head單側凸頭或平鍵實心端。獨立kernel沿既有seeded pose／smooth cover慣例，以短矩形頭及帶小端倒角的直軸聯集，再扣圓孔；16×6 poses加96²grain共9,312 Float64／74,496B tables，非總RAM。最大旋轉支撐sqrt(0.38²＋0.18²)×0.95＋0.016＝0.415452＜0.5 owner；逐點無配置、hash、trig、sqrt或鄰格搜尋，空底與全孔略grain、通用detail亦略。鋼面metallic1／opaque孔底與背板0，default material factor1／explicit0；0.12m nominal tile、0.0032 UV-relative relief與比例是作者近似，不是DIN量測。保留四maps／optional height、tint／repeats、Worker／cache及獨立texture ownership；不生成完整圓柱／通孔mesh、透明、插入split pin／R-clip裝配、轉軸物理、負載或規格認證。

`whipcord`（鞭繩斜紋布）新增作者深灰色單條粗斜脊與同色經緯紗：選用3/1經面連續三pick長浮紗、較低的單點緯紗接結、稠密經紗與較疏緯紗，約72°斜紋；不是現有Gabardine的細短斜紋、Cavalry Twill雙脊、平紋、橫向Grosgrain或剪絨Corduroy。重用既有profiled-weave／whole-float tables與平滑紗肩，不建立第二套織布kernel；4×4×6 profiles及128² grain共16,480 Float64／131,840B tables，非總RAM。取樣無配置、hash、trig或sqrt，略過未使用的通用detail noise；0.06m nominal tile、0.0016 UV-relative relief、紗數／染色為作者近似，3/1不是所有Whipcord的規格。保留opaque dielectric M0／override1、四maps／optional height、tint／repeats、Worker／cache及個別texture ownership，不新增透光、毛羽／布料mesh、異向性反射或服裝物理。

`vanadinite`（釩鉛礦）新增作者橙褐色凸六角晶緣、單一內縮六角凹面與較暗平坦不透明底，散布在淡色粗礦底；不是 Pyromorphite／Red Beryl 的實心平頂、四角 Bismuth hopper、尖晶或透明管。獨立 kernel 沿既有平滑六角 half-plane／seeded pose 慣例，分別平滑外緣與較小同向內凹 cover，不以 max／abs 徑向距離製造內接縫。5×5×6 poses、8² cloud、128² grain 共16,598 Float64／132,784B tables，非總 RAM；支撐(0.24＋0.05)/sqrt(0.75)＋0.06＝0.394863＜0.5 owner。取樣無配置、hash、trig、sqrt 或鄰格搜尋，並略過通用 detail noise；0.1m nominal tile、0.0038 UV-relative relief、色彩與密度是作者近似。維持 opaque dielectric M0／明確 override、四maps／optional height、tint／repeats、Worker／cache 與各自 texture ownership；只選凹晶端，不新增完整晶柱／群晶 mesh、透明折射、晶體生長／成因、化學／XRD、來源或含鉛安全認證。

`tabwashers`（單外舌止動墊圈）新增銀色平坦圓環、封閉圓孔與唯一向外延伸的直邊平舌；圓環／舌片共面，不是 split lock、內齒、球面或杯形墊圈。獨立 kernel 沿用 seeded pose／compact cover 慣例，以平滑圓面與矩形 cover 聯集再扣除圓孔；4×4×6 poses 加96² grain，共9,312 Float64／74,496B tables，非總 RAM。最遠支撐 sqrt(0.43²＋0.09²)×0.95＋0.02＝0.437352＜0.5 owner。逐點無配置、hash、trig、sqrt 或鄰格搜尋，空背板略過 grain，也略過通用 detail noise。鋼面 metallic 1／opaque 孔與背板0，預設材質 factor 1／明確 override 0；height／roughness／AO 共用 cover。0.1m nominal tile、0.0028 UV-relative relief、比例與色彩是作者近似，非 DIN 尺寸。保留四 maps／optional height、tint／repeats、Worker／cache 與各自 texture ownership；不新增 mesh 通孔、透明、彎舌／螺母裝配、防鬆力學、負載或規格符合認證。

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

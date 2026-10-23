# XYZ.js 設計與階段邊界

## 本輪追加：凸包／複合 2D 碰撞、逐物件運動模糊、MP4 素材擷取

使用者直接指定的 additive scope，維持 Game→Scene→Renderer 與 core／graphics／assets 邊界：

- physics2d 在既有 convex narrowphase 上新增 `convexHull(points, options?)`（Andrew
  monotone chain；輸入 3–256 點、`world2dLimits.hullPoints` 256，輸出走 polygon 3–32
  頂點驗證，座標 ±1,000,000 bounds）與 `Compound2D(pieces, options?)`／
  `DynamicConcave2D(vertices, options?)`：1–256 個 convex polygon pieces（
  `compoundPieces`）共用單一 dynamic body，pieces 依計算的 centerOfMass 重新置中，
  mass／inertia 由既有 body 管線推導；第一片維持 root `collider`，`colliderPieces`
  供 hit-testing／contacts／queries。`options.ccd` 拒絕。`Colliders` 的公開型別不加
  成員，hull 以 top-level `convexHull` 提供，維持 1.x structurally additive 契約。
- 逐物件運動模糊是 motion blur 的 additive `perObject` 選項（預設 false、boolean
  驗證）：graphics 以 renderer-owned rigid per-instance pose history 與 rgba16float
  velocity pass（WebGPU raster／WebGL2 framebuffer，depth matching＋validity channel）
  產生逐像素 velocity，gather 有效 object velocity；skinned／deformation、missing
  history 與 invalid pixels 落回既有 camera depth reprojection。resize／disable／destroy
  清 velocity target 與 pose history，prepared pipelines 保留；quality／sample limits
  不變，Canvas2D 維持拒絕 3D postprocessing。
- MP4 素材擷取在 assets 新增 `mp4-demux.ts`：`demuxMP4(bytes, options?)` 解析單一
  video track MP4（avc1／vp09／av01、單一 sample description、自足 sample tables），
  回 `VideoDecoderConfig` 加有序 `EncodedVideoChunk`；`VideoTextureDecoder.fromMP4`
  是有界快照解碼（非計時播放），沿用既有 WebCodecs／VideoTexture 擁有權與
  close／destroy 契約。fragmented／encrypted／edit-list／多 track 拒絕；解析預算
  `videoTextureLimits`（128 MiB／100,000 samples／32 tracks／depth 16／單一 sample
  8 MiB）只可收緊。
- 邊界：無新 runtime 依賴、不做計時影片播放、不做 deforming velocity、不改既有公開
  型別。實作與文件不代表 runtime／browser 驗收，證據另記 ACCEPTANCE。

## 本輪批准追加：程序式 PBR 預設

此 additive scope 保持既有 Game→Scene→Renderer 與 core／assets 邊界：core 在 `await ProceduralMaterial.create(kind, options?)` 一次產生 CPU maps，以 assets 的 `Texture.fromImage` 建立 immutable sources，不新增 backend／shader／geometry 路徑或逐幀生成。無外部素材或新依賴。初始六種 `ProceduralMaterialKind` 為 wood／brick／stone／metal／fabric／marble，後續種類見下方增量；`ProceduralMaterialOptions` 的 size 為整數 32–1024（預設 256），seed 為無號 32-bit 整數（預設 1），相同輸入生成 deterministic、seamlessly periodic maps。

唯讀 `kind`／`material`／`textures` 提供預設 PBRMaterial 及 baseColor（sRGB RGB）、normal（linear tangent-space）、metallicRoughness（linear G roughness／B metallic）、occlusion（linear R）Texture。預設 opaque、所有 samplers repeat、roughness factor 1、metal／rust／diamondplate／hammeredmetal／galvanized／corrugatedmetal／knurledmetal／engineturned／goldleaf／chainmail／rivetedmetal／weldedmetal／pyrite 的 metallic factor 1／其他種類 0。`createMaterial(options?: Partial<PBRMaterialOptions>)` 建立新的 borrowing 材質，最後套用覆寫；不複製／重生 maps。

呼叫者 owns preset，Mesh／Scene 不接管；同步、冪等 `destroy()` 只釋放生成貼圖，不動外部覆寫 maps 或材質。先移除所有 consumers；`destroyed` getter 表示狀態，銷毀後 `createMaterial()` 拒絕。既有 pbr3d gallery 提供預設切換與貼圖預覽，Canvas2D 保持 2D-only。使用者後續授權 v1.14 提交／推送／發佈，依 PLAN 的既有 CI gate 執行；批准及文件不代表 runtime／browser 驗收，實際證據另記 ACCEPTANCE。

後續追加 concrete／tiles／leather／sand／rust／snow，既有六種欄位與取樣不變。rust 的 metallic factor 為 1，貼圖 B 通道在殘留金屬與鏽蝕之間變化；其餘新種類維持 dielectric。pbr3d 選單包含全部預設。

鋪面增量為 asphalt／gravel／cobblestone（瀝青／礫石／鵝卵石鋪面）：分別呈現暗色顆粒黏結料與嵌入骨材、不規則石粒與暗色凹隙、錯列圓角鋪石。三者皆為 opaque dielectric，metallic 通道為 0；deterministic periodic baseColor／normal／metallicRoughness／occlusion maps 沿既有 CPU 生成與 PBR 路徑，不新增公開 option、runtime 抽象或 renderer 變更，前十二種輸出保持不變。物理鋪面尺寸與 runtime 品質由實際驗證後記錄，不在此推定。

持續 additive scope 再追加 bark／moss／mud（樹皮／苔蘚／泥土），總計十八種：分別呈現隆起紋理與深裂隙、密集柔軟的綠色覆層、土塊與淺裂紋。三者皆為 opaque dielectric、metallic 通道為 0，沿用 deterministic periodic 四份 maps；前十五種輸出、公開 options、ownership、renderer 與零新增依賴契約不變。依持續追加授權逐功能獨立 commit、不 push；品質與 browser 證據另記 ACCEPTANCE，不推定物理尺寸。

石材飾面增量為 granite／slate／terrazzo（花崗岩／板岩／磨石子），總計二十一種：分別呈現斑點礦物顆粒、帶細微脊紋的深色層理、平滑黏結料中的對比色石片。三者皆為 opaque dielectric、metallic 通道為 0，沿用 deterministic periodic baseColor／normal／metallicRoughness／occlusion maps 與既有 CPU／PBR 路徑；前十八種輸出須逐位元組保持不變，不改公開 options、ownership、renderer 或依賴。依既有持續追加授權逐功能獨立 commit、不 push；品質與 browser 證據另記 ACCEPTANCE，不推定物理尺寸。

紡織增量為 denim／burlap／carpet（丹寧布／粗麻布／地毯），目前共二十四種；前述 counts 為各增量的歷史範圍。分別呈現斜向斜紋、粗經緯交織、割絨表面；三者皆為 opaque dielectric、metallic 通道為 0，沿用 deterministic periodic baseColor／normal／metallicRoughness／occlusion maps，不是 geometry 或毛髮模擬，也不產生透明織孔。前二十一種輸出須逐位元組保持不變，不改公開 options、repeat、ownership、renderer 或依賴；依持續追加授權逐功能獨立 commit、不 push。品質與 browser 證據另記 ACCEPTANCE，不推定物理尺寸。

建材飾面增量為 plaster／terracotta／cork（石膏／陶土／軟木），目前共二十七種；前述 counts 保留為歷史。分別呈現淺色石膏的淺抹刀弧痕與細孔、未上釉紅褐燒製陶土的不規則窯色與凹孔（無磁磚填縫）、棕褐壓製軟木碎片與細胞邊界。皆為 opaque dielectric、metallic 通道為 0，沿用 deterministic periodic baseColor／normal／metallicRoughness／occlusion maps，不新增 geometry 或物理模擬。前二十四種輸出須逐位元組保持不變，不改公開 options、repeat、ownership、renderer 或依賴；沿既有授權逐功能獨立 commit、不 push。品質與 browser 證據另記 ACCEPTANCE。

工業表面增量為 rubber／carbonfiber／diamondplate（橡膠／碳纖維／止滑花紋鋼板），目前共三十種；前述 counts 保留為歷史。橡膠呈現炭黑色模製彈性體與細密卵石狀顆粒；碳纖維呈現樹脂覆層下深色纖維束與交替斜向斜紋編織，兩者皆為 opaque dielectric、metallic 通道為 0。鋼板呈現銀色軋製金屬與交替斜向隆起菱形紋，metallic 通道及預設 factor 均為 1。沿用 deterministic periodic 四份 RGBA maps，凹凸僅由 normal map 表現，不新增 geometry；碳纖維不是特殊 anisotropic shader、clearcoat 或物理模擬。前二十七種輸出須逐位元組保持不變，公開 options、repeat、ownership、renderer 與依賴契約不變；依既有授權逐功能獨立 commit、不 push。

工藝素材增量為 paper／wicker／bamboo（紙張／藤編／竹材），目前共三十三種；前述 counts 保留為歷史。紙張呈現象牙白未塗佈紙的細密不規則紙漿纖維與輕微雲狀成紙紋，不是石膏換色；藤編呈現棕褐寬圓角藤條交織、細縱向條紋與深色不透明凹隙，區別於粗麻布；竹材呈現金黃縱向纖維與週期錯列的深色竹節帶，不建立分節物件。皆為 opaque dielectric、metallic 通道與預設 factor 為 0，沿用 deterministic periodic 四份 maps，凹凸僅由 normal map 表現，不新增 geometry、透明孔洞或物理模擬。前三十種輸出須逐位元組保持不變，公開 options、repeat、ownership、renderer 與依賴契約不變；依既有授權逐功能獨立 commit、不 push。

成形金屬增量為 hammeredmetal／galvanized／corrugatedmetal（錘紋金屬／鍍鋅板／波紋金屬板），目前共三十六種；前述 counts 保留為歷史。分別呈現暖銅色金屬上重疊的淺圓錘凹與平滑連續起伏（非粗岩）、冷銀色鋅花晶粒的色調／粗糙度對比與極淺起伏（非礫石）、銀色軋製板的平行平滑波槽與細微縱向磨痕。三者 metallic B 全為 255（1）、預設 factor 為 1，區別於混合金屬度的 rust；沿用 deterministic periodic 四份 maps，凹凸僅由 normal map 表現，不位移 geometry 或改變輪廓。前三十三種輸出須逐位元組保持不變，公開 options、repeat、ownership、renderer 與依賴契約不變；依既有授權逐功能獨立 commit、不 push，品質與驗證結果另記 ACCEPTANCE。

多孔與沉積石材增量為 sandstone／travertine／pumice（砂岩／洞石／浮石），目前共三十九種；前述 counts 保留為歷史。砂岩呈現暖色波狀沉積層理與砂粒，區別於深色板岩和鬆散沙；洞石呈現奶油色石灰岩、不規則細長淺孔與細微水平礦物帶；浮石呈現淺灰火山岩與密集隨機分布的小圓氣孔，不是礫石或石材換色。三者皆為 opaque dielectric、metallic 通道與預設 factor 為 0，沿用 deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹孔僅由 normal map 表現，不新增透明或 geometry 孔洞。前三十六種輸出須逐位元組保持不變，公開 options、repeat、ownership、renderer 與依賴契約不變；依既有授權逐功能獨立 commit、不 push。

地板飾面增量為 parquet／mosaic／hexagontiles（拼花木地板／馬賽克／六角磚），目前共四十二種；前述 counts 保留為歷史。拼花木地板採籃編式木塊拼排，每塊含多根窄木條，縱向木紋方向交替並帶深色凹縫，不是木材換色；馬賽克為細小方形釉面磚粒，帶 seed 決定的逐磚色調差異與窄凹填縫，區別於較大的 tiles；六角磚為六邊形陶瓷單元與窄凹填縫，可無接邊斷裂地週期重複。三者皆為 opaque dielectric、metallic 通道與預設 factor 為 0，僅沿用 deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸僅由 normal map 表現，接縫不分割 geometry。前三十九種輸出須逐位元組保持不變，公開 options、repeat、ownership、renderer 與依賴契約不變；依既有授權逐功能獨立 commit、不 push。

柔軟紡織增量為 knit／corduroy／felt（針織／燈芯絨／毛氈），目前共四十五種；前述 counts 保留為歷史。針織呈現柔和色調的平針式重複 V 形針目、圓潤隆起紗線與凹陷線圈間隙；燈芯絨呈現暖棕色平行圓潤隆起絨條、細密絨毛斑點與深窄溝槽；毛氈呈現柔和灰綠色霧面不織表面、隨機方向細纖維與低起伏。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用 deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸僅由 normal map 表現，不新增紗線／毛髮 geometry 或透明線圈。前四十二種輸出須逐位元組保持不變，公開 options、repeat、ownership、renderer 與依賴契約不變；依既有授權逐功能獨立 commit、不 push。

外牆與屋面增量為 roofshingles／rooftiles／stucco（瀝青屋瓦／陶製屋瓦／粗灰泥），目前共四十八種；前述 counts 保留為歷史。瀝青屋瓦呈現暗色礦物顆粒瀝青瓦層、錯列矩形瓦片與搭接陰影帶；陶製屋瓦為赤陶筒瓦層、彎曲瓦冠、凹陷水槽與層間搭接帶；粗灰泥為暖米白噴塗／抹製灰泥、不規則隆起骨材與凹孔，起伏比 plaster 更粗。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用 deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；屋瓦搭接與凹凸僅為 shading／normal map 效果，不新增 geometry、輪廓變化或物理模擬。前四十五種輸出與既有金屬設定、公開 options、repeat、ownership、renderer、依賴契約不變。

自然細節增量為 lichen／leaflitter／endgrain（地衣／落葉層／木頭端面），目前共五十一種；前述 counts 保留為歷史。地衣呈現不規則淺殼狀群落；落葉層呈現具方向性的乾葉、中央葉脈與凹陷間隙；木頭端面呈現彎曲木材年輪、導管孔與放射狀乾裂。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用 deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸僅由 shading／normal map 表現，不新增植被或木材 geometry。前四十八種輸出、既有金屬設定、公開 options、repeat、ownership、renderer 與依賴契約不變；依既有授權逐功能獨立 commit、不 push。

室內機能表面增量為 acousticfoam／closedcellfoam／linoleum（吸音泡棉／閉孔泡棉／油氈地材），目前共五十四種；前述 counts 保留為歷史。吸音泡棉呈現炭黑色柔化金字塔狀起伏；閉孔泡棉為藍灰色細密閉孔膜面與淺凹；油氈地材為柔和綠／青綠色平滑大理石紋片材地板與細長顏料斑點。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸僅由 shading／normal map 表現，不新增泡棉 geometry、吸音或物理模擬。前五十一種輸出須逐位元組保持不變，既有金屬設定、公開 options、repeat、ownership、renderer 與依賴契約不變；依既有授權逐功能獨立 commit、不 push。

皮革飾面增量為 suede／snakeskin／crocodile（麂皮／蛇鱗紋皮革／鱷魚壓紋皮革），目前共五十七種；前述 counts 保留為歷史。麂皮為棕褐色短刷絨與細孔；蛇鱗紋皮革為橄欖綠／棕色錯列的小型尖端／圓角菱形鱗紋、中央脊線與凹陷邊界；鱷魚壓紋皮革為深棕色大型圓角矩形鱗板與皺褶凹紋。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；只是合成表面紋樣，凹凸僅由 shading／normal map 表現，不新增動物 geometry 或 displacement。前五十四種輸出須逐位元組保持不變，既有金屬設定、公開 options、repeat、ownership、renderer 與依賴契約不變；依既有授權逐功能獨立 commit、不 push，實際品質與 browser 證據另記 ACCEPTANCE。

織物飾面增量為 herringbone／tweed／seersucker（人字紋織物／粗花呢／泡泡紗），目前共六十種；前述 counts 保留為歷史。人字紋織物呈現交替斜向的斷續斜紋人字形；粗花呢為粗糙雜色紗線、細斑點與交叉纖維；泡泡紗為淺藍／奶油色交替平整與皺褶條帶及細密織紋。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；僅為表面 shading／normal map 效果，不新增布料 geometry、anisotropy 或模擬。前五十七種輸出須逐位元組保持不變，既有金屬設定、公開 options、repeat、ownership、backend 與依賴契約不變；維持 WebGPU／WebGL2 3D、Canvas2D 2D-only，實際品質與 browser 證據另記 ACCEPTANCE。

加工金屬增量為 knurledmetal／engineturned／goldleaf（滾花金屬／魚鱗旋紋金屬／金箔），目前共六十三種；前述 counts 保留為歷史。分別呈現細密交叉斜向脊線與隆起菱形止滑紋、重疊的銀色圓形加工旋紋、暖金色揉皺紋與搭接縫。三者皆為 opaque，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps，metallic B 全為 255（1），`material` 與 `createMaterial()` 的預設 metallic factor 均為 1，明確覆寫仍最後套用。rust 保持變化的 metallic map 與預設 factor 1，dielectric 預設仍為 0。僅為表面 shading／normal map 效果，不新增實際 anisotropy、金箔厚度、加工 geometry 或透光效果。前六十種輸出須逐位元組保持不變，公開 options、repeat、ownership、backend 與依賴契約不變；維持 WebGPU／WebGL2 3D、Canvas2D 2D-only，實際品質與 browser 證據另記 ACCEPTANCE。

水果表面增量為 orangepeel／coconut／watermelon（橘皮／椰殼／西瓜皮），目前共六十六種；前述 counts 保留為歷史。分別呈現細密油腺凹點與蠟質橙色表皮、粗糙棕色外殼的細縱向椰纖維與裂隙、綠色不規則波狀縱向瓜皮條帶與雜色斑點。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；只是表面 shading／normal map 效果，不新增水果 geometry、transmission 或 SSS。前六十三種輸出須逐位元組保持不變，既有全金屬 maps／預設 factor 1 與 rust 變化的 metallic map／預設 factor 1 不變；公開 options、repeat、ownership、backend 與依賴契約不變，維持 WebGPU／WebGL2 3D、Canvas2D 2D-only。實際品質與 browser 證據另記 ACCEPTANCE。

地質表面增量為 limestone／breccia／gneiss（石灰岩／角礫岩／片麻岩），目前共六十九種；前述 counts 保留為歷史。分別呈現暖淺色圓潤碳酸鹽顆粒與多孔基質、膠結物中的稜角破碎岩屑、褶曲的明暗交替礦物帶與結晶斑點。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是 shading／normal map 效果，不新增實際岩石 geometry、displacement 或透光效果。前六十六種輸出、既有全金屬與 rust 的 maps／預設 factor、公開 options、repeat、ownership、backend 與依賴契約不變，維持 WebGPU／WebGL2 3D、Canvas2D 2D-only。實際品質與 browser 證據另記 ACCEPTANCE。

木質複合板增量為 plywood／osb／chipboard（膠合板／定向粒片板／粒片板），目前共七十二種；前述 counts 保留為歷史。分別呈現暖色旋切面單板的山形木紋與節眼（非板邊疊層）、大型重疊且具方向性的細長木片、黏結料中密集較細且隨機定向的木屑。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是 shading／normal map 效果，不新增板材 geometry 或 displacement。前六十九種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與依賴契約不變，維持 WebGPU／WebGL2 3D、Canvas2D 2D-only。實際品質與 browser 證據另記 ACCEPTANCE。

立體紋理織物增量為 wafflecloth／cableknit／quilting（華夫格布／麻花針織／菱格絎縫），目前共七十五種；前述 counts 保留為歷史。分別呈現隆起的華夫格編織邊框與凹陷方格口袋、相互纏繞的羊毛麻花辮與交叉處起伏及兩側較細的針織凸條、蓬鬆填充的菱形布面單元與凹陷斜向縫線。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增布料 geometry、displacement、transmission 或 SSS。前七十二種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與依賴契約不變，維持 WebGPU／WebGL2 3D、Canvas2D 2D-only。實際品質與 browser 證據另記 ACCEPTANCE。

裝飾陶瓷與花磚增量為 crackleglaze／flutedceramic／encaustictiles（冰裂釉／直槽陶瓷／嵌彩水泥花磚），目前共七十八種；前述 counts 保留為歷史。分別呈現淺青瓷色平滑釉面與細密不規則深色凹陷裂紋網、象牙白拋光陶瓷與垂直圓潤槽紋、奶油色／柔和藍色裝飾水泥磚與花卉／幾何顏料嵌紋及凹陷填縫。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；只是表面 shading／normal map 效果，不新增實際裂縫、geometry、displacement、transmission 或塗層系統。前七十五種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與依賴契約不變，維持 WebGPU／WebGL2 3D、Canvas2D 2D-only。實際品質與 browser 證據另記 ACCEPTANCE。

生物覆層增量為 fishscales／tortoiseshell／feathers（魚鱗／龜甲／羽毛），目前共八十一種；前述 counts 保留為歷史。分別呈現藍灰／青綠色錯列重疊的圓潤扇貝狀鱗片、同心生長紋與露出邊唇；棕／琥珀色不規則多邊形盾片、深色接縫、圓頂與生長環；灰褐色層疊尖端羽片、羽軸與斜向羽枝。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；只是表面顏料與 normal map 效果，不新增 geometry、cutout、transmission、iridescence、SSS 或 shader feature。前七十八種輸出須逐位元組保持不變，既有 metal／rust、公開 options、physical repeat、借用 maps 的 ownership、backend 與依賴契約不變，維持 WebGPU／WebGL2 3D、Canvas2D 2D-only。實際品質與 browser 證據另記 ACCEPTANCE。

植物纖維增量為 reedmat／rope／straw（蘆葦蓆／繩索／稻草），目前共八十四種；前述 counts 保留為歷史。分別呈現纖細平行蘆葦與橫向綁線、相鄰三股扭繩帶與螺旋凹槽及細纖維、金黃乾燥纖細散落直莖與偶見節點及層疊鋪墊。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；只是表面 shading／normal map 效果，不新增圓柱、geometry、cutout 或 displacement。前八十一種輸出須逐位元組保持不變，既有 metal／rust、公開 options、physical repeat、借用 maps 的 ownership、backend 與依賴契約不變，維持 WebGPU／WebGL2 3D、Canvas2D 2D-only。實際品質與 browser 證據另記 ACCEPTANCE。

橡膠地材增量為 studdedrubber／groovedrubber／recycledrubber（圓釘橡膠／溝槽橡膠／再生橡膠），目前共八十七種；前述 counts 保留為歷史。分別呈現圓形平頂炭黑凸釘與斜面肩部、寬平深灰肋條與窄排水槽、暗色黏結料中的密集細小藍灰不規則橡膠顆粒。皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；只是表面 shading／normal map 效果，不提供實際摩擦／止滑或排水物理，不新增 geometry 或 displacement。前八十四種輸出須逐位元組保持不變，既有 metal／rust、公開 options、physical repeat、借用 maps 的 ownership、backend 與依賴契約不變，維持 WebGPU／WebGL2 3D、Canvas2D 2D-only。實際品質與 browser 證據另記 ACCEPTANCE。

金屬網孔增量為 perforatedmetal／expandedmetal／wiremesh（穿孔金屬板／擴張網／編織金屬網），目前共九十種；前述 counts 保留為歷史。分別呈現亮面金屬板上錯列的圓形凹孔與孔間平整網面、兩組對角條帶在隆起節點相接並圍出凹陷的菱形開口、圓形金屬線平紋交織且上下交錯於深色開放網孔之上。三者皆為 opaque metal，metallic 通道與預設 factor 為 1，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增板材 geometry、真實孔洞、彎折條帶或 displacement。前八十七種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

絨面織物增量為 velvet／terrycloth／boucle（天鵝絨／毛圈布／圈圈紗），目前共一百一十一種；前述 counts 保留為歷史。分別呈現細密平整直立絨面與柔和壓褶雲塊的色素／光澤變化、錯列隆起的圓潤毛圈冠、紗節上隆起的環狀線圈與環心凹陷及紗節間開放凹槽。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增布料 geometry、剪開線圈、displacement 或 SSS。前一百零八種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

礦石晶體增量為 geode／quartz／pyrite（晶洞／石英／黃鐵礦），目前共一百一十七種；前述 counts 保留為歷史。分別呈現環繞細密晶簇核心的同心礦物縞帶、高低錯落的六方柱體與錐狀頂端、相互咬合的階梯狀立方晶面與細密平行條紋。晶洞與石英為 opaque dielectric，metallic 通道與預設 factor 為 0；黃鐵礦為 opaque metal，metallic 通道與預設 factor 為 1。三者僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增晶體 geometry、切割晶面或 displacement。前一百一十四種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

建築外殼增量為 shiplap／glassblock／thatch（搭接木板／玻璃磚／茅草），目前共一百二十九種；前述 counts 保留為歷史。分別呈現搭接處陰影凹槽與接縫淡出的板材色調及沿面木紋、圓角磚面與凹陷接縫及內部隆起氣泡、層層下垂草束的陰影搭接與沿坡細長草莖。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增板材、磚體或草束 geometry，也不做 displacement。前一百二十六種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

風化表面增量為 charredwood／driftwood／peelingpaint（炭化木／漂流木／剝落漆面），目前共一百三十二種；前述 counts 保留為歷史。分別呈現隆起於深邃鱷魚裂紋之上的圓潤炭塊、銀灰木紋脊與沿木紋開裂的風化裂隙、翹起捲邊的完整漆面與外露的底材。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增樹皮、木板或漆片 geometry，也不做 displacement。前一百二十九種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

功能紋面增量為 tiretread／honeycomb／frost（胎紋／蜂巢／霜花），目前共一百三十八種；前述 counts 保留為歷史。分別呈現錯列墊高的胎塊與其間溝槽及胎面細割紋、環繞凹陷巢房的隆起蠟質六角壁、自淡出中心放射的羽狀冰晶。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增胎塊、巢房或冰晶 geometry，也不做 displacement。前一百三十五種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

裝飾面板增量為 stainedglass／soapstone／butcherblock（彩繪玻璃／皂石／端面砧板），目前共一百四十四種；前述 counts 保留為歷史。分別呈現墊高鉛條與其間不同色調的不規則玻璃片、深色滑石底上的柔和淺色紋帶、錯色棋盤格端面木塊與凹陷接縫。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增鉛條、石材或木塊 geometry，也不做 displacement。前一百四十一種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

居家織品增量為 wallpaper／embroidery／macrame（壁紙／刺繡／流蘇編繩），目前共一百五十種；前述 counts 保留為歷史。分別呈現以精確鏡像對稱重複的大馬士革團花、在自身支撐處淡出的墊高緞面繡線、墊高於交錯扭繩之上的錯列圓潤繩結。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增線材、繡線或繩結 geometry，也不做 displacement。前一百四十七種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

戶外硬景增量為 brickpaving／steppingstone／woodendeck（磚鋪面／踏石／木平台），目前共一百五十六種；前述 counts 保留為歷史。分別呈現錯縫墊高於砂質接縫之上的磚面、墊高於礫石地面的圓潤石板、窄縫上方的板面與隆起螺絲釘頭及凹陷十字槽。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增磚、石板、木板或螺絲 geometry，也不做 displacement。前一百五十三種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

廚房與燭光增量為 cheese／sugarfrosting／candleswax（起司／糖霜／蠟淚），目前共一百五十九種；前述 counts 保留為歷史。分別呈現沉入麵體、大小不一的圓潤孔洞、隆起於平滑糖面的擠花玫瑰峰、圓潤下垂的蠟流與其下端鼓起的淚頭。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增食品或蠟體 geometry，也不做 displacement。前一百五十六種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

聲音與紙面增量為 vinylrecord／graphpaper／notebookpaper（黑膠唱片／方格紙／筆記本紙），目前共一百六十八種；前述 counts 保留為歷史。分別呈現環繞平整標籤圓面的細密同心溝紋、深於細格線的粗格線、依序沉入紙面的橫線與邊界線及打孔。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增唱片、紙張或孔洞 geometry，也不做 displacement。前一百六十五種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

編織工藝增量為 lace／crochet／basketweave（蕾絲／鉤織／籃織），目前共一百七十四種；前述 counts 保留為歷史。分別呈現菱形網眼上方交叉的對角線網紋與交叉鼓起、交錯半格位移的隆起線圈列、依區塊交替方向且帶凸脊的條帶。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增線材、毛線或藤編 geometry，也不做 displacement。前一百七十一種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

扣合配件增量為 zipper／velcro／button（拉鍊／魔鬼氈／鈕扣），目前共一百八十種；前述 counts 保留為歷史。分別呈現嚙合於凹陷接縫上方的鏈齒列與織紋布帶、錯列鉤針圓環與凹陷針芯、隆起扣緣與縫線扣面及孔洞凹點。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增鏈齒、針扣或鈕扣 geometry，也不做 displacement。前一百七十四種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

道路與軌道增量為 traintracks／manholecover／speedbump（鐵軌／人孔蓋／減速丘），目前共一百八十三種；前述 counts 保留為歷史。分別呈現鋼軌隆起於橫向枕木與道碴顆粒、外框環高於放射與同心圓肋紋蓋面、圓拱隆起於坡腳與凹陷接縫並帶警示條紋。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增鋼軌、蓋體或丘體 geometry，也不做 displacement。前一百八十種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

科技表面增量為 circuitboard／solarpanel／heattile（電路板／太陽能板／隔熱瓦），目前共一百九十二種；前述 counts 保留為歷史。分別呈現銲盤隆起於走線交點與導孔凹陷、匯流條與細柵線墊在凸起電池片面上、圓角瓦面高於凹陷接縫。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增線路、電池片或瓦片 geometry，也不做 displacement。前一百八十九種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

樂器與聲學增量為 pianokeys／drumskin／gongsurface（琴鍵／鼓皮／鑼面），目前共一百九十八種；前述 counts 保留為歷史。分別呈現黑鍵隆起於白鍵面與凹陷縫線、鼓耳高於鼓框與放射褶鼓膜、錘打環紋繞著中央凸起。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增琴鍵、鼓皮或鑼體 geometry，也不做 displacement。前一百九十五種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

光學表面增量為 lensarray／prismtape／fresnel（微透鏡陣列／稜鏡膠帶／菲涅耳面），目前共二百零一種；前述 counts 保留為歷史。分別呈現圓頂微透鏡隆起於細支撐網、斜向稜脊高於脊腳與膠帶底面、同心鋸齒環帶由中央凸起向外漸低。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增透鏡、稜鏡或階梯透鏡 geometry，也不做 displacement。前一百九十八種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

醫療與衛生增量為 bandage／pillblister／sutures（繃帶／藥丸泡殼／縫合線），目前共二百零七種；前述 counts 保留為歷史。分別呈現圓角軟墊墊在織紋紗布、半球泡殼鼓起於壓痕鋁箔、縫線跨過凹陷切口並旁有針孔凹點。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增軟墊、泡殼、縫線或縫針 geometry，也不做 displacement。前二百零四種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

園藝與戶外增量為 trellis／terracottapot／hedgerow（格柵／陶盆／樹籬），目前共二百一十種；前述 counts 保留為歷史。分別呈現交叉木條與交點繩結高於鏤空格、凸緣高於盆壁旋紋、葉團鼓起於枝條縫隙。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增木條、盆體或枝葉 geometry，也不做 displacement。前二百零七種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

寵物與動物照護增量為 collar／petbed／scratchpost（項圈／寵物床／貓抓柱），目前共二百一十三種；前述 counts 保留為歷史。分別呈現扣環高於縫線織帶與素面底布、環形床緣圍著內凹軟墊與織紋底、麻繩脊高於繩圈溝縫。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增扣環、床緣或繩索 geometry，也不做 displacement。前二百一十種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

運動場地增量為 runningtrack／bouldermat／pooltile（跑道／攀岩墊／泳池磚），目前共二百一十六種；前述 counts 保留為歷史。分別呈現分道線墊在膠粒表面與排水縫、菱形壓紋鼓起於邊緣縫合帶內側、磚面高於填縫並疊水光條紋。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增劃線、壓紋或瓷磚 geometry，也不做 displacement。前二百一十三種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

辦公與文具增量為 envelope／chalkboard／corkboard（信封／黑板／軟木板），目前共二百一十九種；前述 counts 保留為歷史。分別呈現交叉壓紋框著凹陷封口縫、木框圍著粉筆擦痕板面、軟木顆粒墊高板面與圖釘孔深陷。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增封口、框體或圖釘 geometry，也不做 displacement。前二百一十六種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

自然現象增量為 snowdrift／icicle／dewdrops（雪堆／冰柱／露珠），目前共二百二十二種；前述 counts 保留為歷史。分別呈現風紋波浪脊墊在細雪粒、圓潤冰柱垂在陰影隙縫、大小水珠串在淡葉脈之上。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增雪堆、冰柱或水珠 geometry，也不做 displacement。前二百一十九種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

天文與太空增量為 mooncrater／starfield／nebula（月坑／星空／星雲），目前共二百二十五種；前述 counts 保留為歷史。分別呈現坑緣隆起於地表與坑底凹陷、亮星與塵點閃在星雲底色、明亮渦卷條紋繞著暗塵帶。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增隕坑、星體或雲氣 geometry，也不做 displacement。前二百二十二種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

服裝細節增量為 pleats／shoelace／tassel（褶襉／鞋帶／流蘇），目前共二百二十八種；前述 counts 保留為歷史。分別呈現風琴褶脊高於布面谷線、交織圓繩高於底面與鞋眼孔深陷、穗帶垂在束結環之下。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增褶片、繩體或穗帶 geometry，也不做 displacement。前二百二十五種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

烹飪器具增量為 woksurface／cutlery／choppingboard（炒鍋／餐具／砧板），目前共二百三十一種；前述 counts 保留為歷史。分別呈現錘打凹點高於刮痕鋼面與油光、串珠邊框圍著拉絲柄面、端面木塊留著刀痕且邊框凹陷。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增凹點、串珠或木塊 geometry，也不做 displacement。前二百二十八種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

浴室與水電增量為 faucet／showerhead／bathmat（水龍頭／蓮蓬頭／浴墊），目前共二百三十四種；前述 counts 保留為歷史。分別呈現拋光弧面高於底盤與水垢斑、出水孔沉入溝紋面板、吸盤圓頂墊在織紋底面。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增弧面、噴孔或吸盤 geometry，也不做 displacement。前二百三十一種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

窗簾與遮光增量為 blinds／curtain／shadecloth（百葉窗／窗簾／遮陽網），目前共二百三十七種；前述 counts 保留為歷史。分別呈現傾斜葉片面高於遮蔭縫隙、布褶波峰高於布面谷地、交織網線墊在開口網眼。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增葉片、布褶或網線 geometry，也不做 displacement。前二百三十四種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

烘焙點心增量為 pretzel／bagel／croissant（蝴蝶脆餅／貝果／可頌），目前共二百四十種；前述 counts 保留為歷史。分別呈現交錯麵繩打結高於繩間凹處與鹽粒、Q彈環面高於凹陷中孔與芝麻、奶油層片斜脊高於烘烤接縫。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增結點、環面或層片 geometry，也不做 displacement。前二百三十七種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

昆蟲與蛛網增量為 butterflywing／beetlewing／spiderweb（蝶翅／甲蟲翅／蛛網），目前共二百四十三種；前述 counts 保留為歷史。分別呈現鱗片格面高於凹陷翅脈、弧形鞘翅板高於分節接縫、放射蛛絲與同心絲環高於開口網格與露珠。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增鱗片、鞘翅、蛛絲或絲環 geometry，也不做 displacement。前二百四十種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

天空與天氣增量為 cirrus／cumulus／lightning（卷雲／積雲／閃電），目前共二百四十六種；前述 counts 保留為歷史。分別呈現風梳細絲條紋橫過高空留白、花椰菜狀雲團高於陰影縫隙、鋸齒電光核心亮過暗沉雷天空。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增絲條、雲團或電光 geometry，也不做 displacement。前二百四十三種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

海洋植物與生物增量為 kelp／seaweed／anemone（海帶／海藻／海葵），目前共二百四十九種；前述 counts 保留為歷史。分別呈現寬亮葉帶波皺高於陰影波谷、細分枝絲交錯墊面與陰影空隙、環狀觸手高於凹陷中央口盤。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增葉帶、分枝或觸手 geometry，也不做 displacement。前二百四十六種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

糖果與甜點增量為 candy／marshmallow／nougat（硬糖／棉花糖／牛軋糖），目前共二百五十二種；前述 counts 保留為歷史。分別呈現光亮扭轉條紋高於淺接縫、柔軟擠花圓稜高於圓弧凹槽與灑粉、堅果塊與氣泡孔穿插耐嚼糖體。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增條紋、圓稜或堅果塊 geometry，也不做 displacement。前二百四十九種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

玻璃表面增量為 frostedglass／rippledglass／bubbleglass（磨砂玻璃／波紋玻璃／氣泡玻璃），目前共二百五十五種；前述 counts 保留為歷史。分別呈現細酸蝕顆粒散布玻璃面、垂直壓延波肋橫過拉製玻璃、圓氣泡鼓起於透明玻璃體。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增顆粒、波肋或氣泡 geometry，也不做 displacement。前二百五十二種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

皮革加工增量為 saddlestitch／tooledleather／patentleather（馬鞍縫線／壓花皮革／漆皮），目前共二百五十八種；前述 counts 保留為歷史。分別呈現斜向虛線縫線高於粗面皮革、浮雕圓章與渦紋高於壓縮底面、細橘皮波紋橫過鏡面漆層。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增縫線、圓章或漆層 geometry，也不做 displacement。前二百五十五種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

果皮果肉增量為 appleskin／peachskin／grapeskin（蘋果皮／桃皮／葡萄皮），目前共二百六十一種；前述 counts 保留為歷史。分別呈現紅暈條紋帶過緊繃果皮與果點、細絨覆於紅暈旁凹陷縫線溝、白霜粉斑散布緊繃光滑果皮。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增條紋、絨毛或粉斑 geometry，也不做 displacement。前二百五十八種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

蔬菜表面增量為 broccoli／cabbage／onion（青花菜／高麗菜／洋蔥），目前共二百六十四種；前述 counts 保留為歷史。分別呈現密集花球粒高於花球陰影空隙、葉片波皺高於凹陷葉脈、同心層弧條紋高於乾皮纖維。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增花球粒、葉皺或層弧 geometry，也不做 displacement。前二百六十一種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

寢具床品增量為 bedsheet／pillow／mattress（床單／枕頭／床墊），目前共二百六十七種；前述 counts 保留為歷史。分別呈現柔壓皺褶漂過織面、蓬鬆衍縫墊高於凹陷滾邊縫線、鈕扣拉扣凹點沉入粗織面。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增皺褶、衍縫墊或拉扣 geometry，也不做 displacement。前二百六十四種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

茶與飲品增量為 tealeaf／matcha／teabag（茶葉／抹茶／茶包），目前共二百七十種；前述 counts 保留為歷史。分別呈現捲曲葉片堆過茶堆陰影空隙、刷痕條紋梳過細粉面、濾紙網線交錯開口網眼與茶影。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增葉片、刷痕或網線 geometry，也不做 displacement。前二百六十七種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

沙灘與海岸增量為 sanddune／pebblebeach／foamedge（沙丘／卵石灘／浪花泡沫），目前共二百七十三種；前述 counts 保留為歷史。分別呈現風紋波脊梳過細沙面、圓卵石鼓起於粗砂之上、泡沫團與氣泡洗過薄水膜。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增波脊、卵石或泡沫 geometry，也不做 displacement。前二百七十種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

火山與熔岩增量為 lavaflow／cooledlava／ashfield（熔岩流／冷卻熔岩／火山灰），目前共二百七十六種；前述 counts 保留為歷史。分別呈現繩狀熔岩紋高於暗色裂縫、結殼岩塊高於裂縫與孔洞、細灰堆高於灰面。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增繩紋、岩塊或灰堆 geometry，也不做 displacement。前二百七十三種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

洞穴與地下增量為 stalactite／flowstone／cavefloor（鐘乳石／流石／洞底），目前共二百七十九種；前述 counts 保留為歷史。分別呈現滴水錐尖垂過陰影凹處、梯田流紋台階過細滴水波紋、碎石泥面環繞平淺水窪。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增錐尖、台階或碎石 geometry，也不做 displacement。前二百七十六種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

甜點配料增量為 jam／peanutbutter／sprinkles（果醬／花生醬／糖針），目前共二百八十二種；前述 counts 保留為歷史。分別呈現光亮果肉塊浸於透明果膠、花生碎穿插綿滑漩渦醬面、糖針條散布糖霜底面。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增果肉塊、花生碎或糖針 geometry，也不做 displacement。前二百七十九種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

冰品與冷飲增量為 icecream／popsicle／sorbet（冰淇淋／冰棒／雪酪），目前共二百八十五種；前述 counts 保留為歷史。分別呈現擠花奶油稜高於融化滴點之間、冷凍滴掛稜垂過霜面冰體、刮匙刮脊高於果粒面。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增擠花、滴掛或刮匙 geometry，也不做 displacement。前二百八十二種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

義式麵食增量為 spaghetti／macaroni／lasagna（義大利麵／通心粉／千層麵），目前共二百八十八種；前述 counts 保留為歷史。分別呈現蜿蜒麵條盤過醬底、短彎管殼堆於空隙之間、層層麵片疊過醬料縫。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增麵條、管殼或麵片 geometry，也不做 displacement。前二百八十五種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

紙藝增量為 origami／paperlace／papercut（折紙／紙蕾絲／剪紙），目前共二百九十一種；前述 counts 保留為歷史。分別呈現折面高於壓折痕線、鏤空孔洞穿過紙橋面、層疊剪影高於平底紙面。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增折面、孔洞或剪影 geometry，也不做 displacement。前二百八十八種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

花卉增量為 sunflower／daisy／clover（向日葵／雛菊／三葉草），目前共二百九十四種；前述 counts 保留為歷史。分別呈現花盤種籽圓頂密排、放射花瓣圍繞凹陷花心、三心葉瓣自葉柄展開。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增種籽、花瓣或葉瓣 geometry，也不做 displacement。前二百九十一種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

玩具與休閒增量為 puzzletile／legobrick／rubberband（拼圖磚／積木／橡皮筋），目前共二百九十七種；前述 counts 保留為歷史。分別呈現拼片與圓弧接點高於接縫、圓柱凸點高於平滑磚面、交叉彈條拉過底層包覆。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增拼片、凸點或彈條 geometry，也不做 displacement。前二百九十四種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

農場與穀倉增量為 haybale／corncrib／fencepost（乾草捆／穀倉／柵欄柱），目前共三百種；前述 counts 保留為歷史。分別呈現梳整稻稈條紋旁壓縮捆帶、木條柵欄交錯過開口空隙、風化直木紋稜被深裂紋分割。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增稈條、木條或木紋 geometry，也不做 displacement。前二百九十七種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

運動與遊樂增量為 poolfelt／icesurface／climbingwall（撞球桌絨布／冰面／攀岩牆），目前共三百零三種；前述 counts 保留為歷史。分別呈現白色標記圓點高於濃密絨毛、掃冰弧紋高於溝谷並帶霜斑、圓形岩點高於顆粒牆面。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增圓點、弧紋或岩點 geometry，也不做 displacement。前三百種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

顯示與周邊增量為 oledpanel／crtscanline／keyboardkey（OLED 面板／CRT 掃描線／鍵盤鍵帽），目前共三百零六種；前述 counts 保留為歷史。分別呈現子像素發光條紋高於深色矩陣遮罩、磷光掃描波峰高於線間暗隙、圓角方形鍵帽高於凹陷縫隙。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增條紋、掃描線或鍵帽 geometry，也不做 displacement。前三百零三種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

影像與印刷增量為 filmstrip／postagestamp／halftoneprint（底片／郵票／網點印刷），目前共三百零九種；前述 counts 保留為歷史。分別呈現打孔圓洞高於分格凹槽間的片基、邊緣齒孔圍繞高於紙面的中央圖案、隨色調大小的墨點高於留白紙面。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增圓孔、齒孔、圖案或墨點 geometry，也不做 displacement。前三百零六種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

暖氣與五金增量為 radiator／screwhead／chainlink（散熱管／螺絲頭／菱形鐵絲網），目前共三百一十二種；前述 counts 保留為歷史。分別呈現圓管高於凹陷接縫、十字凹槽低於頭環與面板、交叉節點高於鐵絲與鏤空。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增圓管、螺絲或鐵絲 geometry，也不做 displacement。前三百零九種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

餐桌食物增量為 friedegg／sushirice／chocolatechip（煎蛋／壽司飯／巧克力碎片餅乾），目前共三百一十五種；前述 counts 保留為歷史。分別呈現蛋黃高於扭曲蛋白與鍋面、米粒高於縫隙、巧克力片高於餅乾底。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增蛋黃、米粒或碎片 geometry，也不做 displacement。前三百一十二種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

車輛內裝增量為 cargomat／dashboardgrain／licenseplate（貨車踏墊／儀表皮革紋／車牌），目前共三百一十八種；前述 counts 保留為歷史。分別呈現橡膠長肋高於橫向凹槽、顆粒高於谷底與縫線凹痕、凸框高於字條與底板。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增肋條、顆粒或邊框 geometry，也不做 displacement。前三百一十五種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

花園植栽增量為 flowerbed／grassstripe／topiary（花圃／草坪條紋／修剪灌木），目前共三百二十一種；前述 counts 保留為歷史。分別呈現四瓣花簇高於土壤、剪草亮帶高於溝底、葉團高於修邊空隙。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增花朵、草葉或葉團 geometry，也不做 displacement。前三百一十八種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

節慶裝飾增量為 confetti／ribbonstreamer／pinatafringe（紙屑／緞帶波紋／彩帶流蘇），目前共三百二十四種；前述 counts 保留為歷史。分別呈現碎片高於紙面、扭轉寬帶高於溝底、密集垂條高於層帶與空隙。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增碎片、緞帶或垂條 geometry，也不做 displacement。前三百二十一種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

樂器與演奏增量為 xylophone／tambourine／castanet（木琴／鈴鼓／響板），目前共三百二十七種；前述 counts 保留為歷史。分別呈現琴條高於穿繩孔與空隙、斜置鈴片高於鼓皮、殼緣高於中央凹與氈底。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增琴條、鈴片或殼體 geometry，也不做 displacement。前三百二十四種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

保健與美容增量為 pillcapsule／pilltablet／bathbomb（膠囊／藥錠／入浴球），目前共三百三十種；前述 counts 保留為歷史。分別呈現兩半高於接縫與底板、圓頂高於刻痕、顆粒高於斜向裂隙。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增膠囊、錠劑或裂隙 geometry，也不做 displacement。前三百二十七種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

打磨與清潔增量為 sandpaper／steelwool／wirebrush（砂紙／鋼絲棉／鋼絲刷），目前共三百三十三種；前述 counts 保留為歷史。分別呈現錯列磨料凸粒高於背板與脫落凹坑、三向斜向纏繞絲脊交錯抬高、密排平行刷毛高於溝槽。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增磨料、絲線或刷毛 geometry，也不做 displacement。前三百三十種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

廚房器具增量為 cheesegrater／ovenrack／muffintin（起司刨刀／烤架／馬芬烤盤），目前共三百三十六種；前述 counts 保留為歷史。分別呈現沖孔低於凸起孔環、圓桿高於細橫桿與交點抬高、圓槽低於凸起模環。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增孔洞、圓桿或圓槽 geometry，也不做 displacement。前三百三十三種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

醫療敷料增量為 gauze／elasticbandage／icepack（紗布／彈性繃帶／冰袋），目前共三百三十九種；前述 counts 保留為歷史。分別呈現起伏交織經緯紗與孔隙、斜向羅紋交錯布邊溝、方圓絎縫格鼓起於接縫網。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增紗線、羅紋或絎縫格 geometry，也不做 displacement。前三百三十六種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。
圓形單元增量為 bubblewrap／sequin／pennyround（氣泡布／亮片布／小圓馬賽克），目前共三百四十二種；前述 counts 保留為歷史。分別呈現方格封氣圓凸高於薄膜網、交錯圓片與中央縫窩高於裸布、圓瓷磚密排高於凹陷填縫。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增圓凸、圓片或瓷磚 geometry，也不做 displacement。前三百三十九種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。
球類表面增量為 volleyball／bowlingball／rugbyball（排球／保齡球／橄欖球），目前共三百四十五種；前述 counts 保留為歷史。分別呈現弧形面板高於凹陷接縫與細點凹紋、珍珠環繞紋包覆三個凹陷指孔、顆粒皮革與縫線繫帶高於繫帶與接縫溝。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增球體、指孔或繫帶 geometry，也不做 displacement。前三百四十二種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。
烘焙甜點增量為 wafflecone／donutglaze／brownie（甜筒／甜甜圈糖霜／布朗尼），目前共三百四十八種；前述 counts 保留為歷史。分別呈現斜向格紋凸脊高於烘烤菱形凹格、糖霜垂滴高於多孔蛋糕體、核桃塊高於粗裂巧克力頂面。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增格紋、糖霜、裂紋或核桃 geometry，也不做 displacement。前三百四十五種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。
浴室清潔增量為 soapbar／loofah／scrubbypad（香皂／絲瓜絡／菜瓜布），目前共三百五十一種；前述 counts 保留為歷史。分別呈現圓角皂塊與橢圓壓印高於氣孔、交錯波浪纖維高於網絡空隙、粗礪磨砂高於凹陷六角切孔。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增皂塊、纖維或切孔 geometry，也不做 displacement。前三百四十八種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。
水果剖面增量為 orangeflesh／kiwiflesh／avocadoflesh（柳橙果肉／奇異果果肉／酪梨果肉），目前共三百五十四種；前述 counts 保留為歷史。分別呈現凸起汁囊瓣片在果皮環內匯聚於凹陷果白、凸起種子凸點與果心高於輻射纖維、平滑果肉圍繞凹陷中央果核。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增果瓣、種子或果核 geometry，也不做 displacement。前三百五十一種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。
裝飾礦石二增量為 turquoise／rhodonite／tigereye（綠松石／薔薇輝石／虎眼石），目前共三百五十七種；前述 counts 保留為歷史。分別呈現青綠石面上凹陷的深色蛛網狀基岩細脈、玫瑰粉紅石面上凹陷的分岔黑色錳質細脈、金棕色波浪平行纖維條帶與絲光色調。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；凹凸只是表面 shading／normal map 效果，不新增細脈、纖維或寶石 geometry，也不做 displacement、透明、折射或真實貓眼光學。前三百五十四種輸出須逐位元組保持不變，既有全金屬與 rust 的 maps／預設 factor、公開 options、physical repeat、借用 maps 的 ownership、backend 與零新增依賴契約不變。

烘焙食品表面增量為 breadcrust／wafer／chocolate（麵包脆皮／威化餅／巧克力），目前共九十種；前述 counts 保留為歷史。分別呈現裂開的烤焦麵包脆皮、細密正交凹格與烘烤凸肋、寬大平滑的巧克力方塊與分割刻槽。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps；只是平坦表面的 shading／normal map 效果，不新增 geometry、displacement、SSS、transmission、半透明或食品／物理模擬。前八十七種輸出須逐位元組保持不變，既有 metal／rust、公開 options、physical repeat、借用 maps 的 ownership、backend 與依賴契約不變，維持 WebGPU／WebGL2 3D、Canvas2D 2D-only。實際品質與 browser 證據另記 ACCEPTANCE。

運動球表面增量為 basketball／tennisball／golfball（籃球／網球／高爾夫球），目前共九十三種；前述 counts 保留為歷史。分別呈現橙色顆粒皮革與深色凹陷拼片縫、黃綠色毛氈與淡色彎曲接縫、白色光澤表面與規則圓形凹點。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion 四份 maps 與 physical repeat；僅為週期表面 shading／normal map 近似，不提供真實球面拼片拓撲、geometry、displacement、纖維或殼體體積、SSS、transmission 或球體物理。前九十種輸出須逐位元組保持不變，既有 metal／rust、公開 options、借用 maps 的 ownership、backend 與零新增依賴契約不變，維持 WebGPU／WebGL2 3D、Canvas2D 2D-only。

建築混凝土增量為 boardformedconcrete／ribbedconcrete／splitfaceblock（木模板清水混凝土／肋紋混凝土／劈面砌塊），目前共九十六種；前述 counts 保留為歷史。木模板清水混凝土為灰色澆置混凝土的水平木板壓印、細長木紋與凹陷板縫，不是木材換色；肋紋混凝土為垂直等距寬肋、圓潤肩部、凹槽與細孔；劈面砌塊為錯列矩形砌塊的粗糙破裂面與平滑凹陷砂漿縫，不是磚牆換色。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion 四份 maps 與 physical repeat；僅為 shading／normal map 效果，不新增實際澆置 geometry、displacement 或砌體物理。前九十三種輸出須逐位元組保持不變，既有 metal／rust、公開 options、借用 maps 的 ownership、backend 與零新增依賴契約不變，維持 WebGPU／WebGL2 3D、Canvas2D 2D-only。

組裝金屬增量為 chainmail／rivetedmetal／weldedmetal（鎖子甲／鉚接金屬板／焊接金屬板），目前共九十九種；前述 counts 保留為歷史。鎖子甲為深色不透明 dielectric 襯底上重疊交錯的金屬環浮雕，不是真實開孔或透明網；鉚接板為板片凹縫與離散圓潤隆起鉚釘；焊接板為較平坦金屬板上的隆起週期扇貝狀焊道。三者皆為 opaque，`material` 與 `createMaterial()` 預設 metallic factor 均為 1，覆寫仍最後套用；chainmail 的 metallic map 隨金屬環覆蓋率變化，襯底為 0，而 rivetedmetal／weldedmetal 通道全為 1。沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion 四份 maps 與 physical repeat；僅為 shading／normal map 效果，不新增 geometry、displacement 或物理模擬。前九十六種輸出須逐位元組保持不變，公開 options、借用 maps 的 ownership、backend 與零新增依賴契約不變。

植物表面增量為 cactus／pinecone／corncob（仙人掌／松果／玉米穗），目前共一百零二種；前述 counts 保留為歷史。仙人掌呈現縱向綠色肋紋、重複刺座與細放射狀刺痕；松果呈現錯列重疊的木質角狀鱗片、隆起露出尖端與凹陷搭接縫，而非圓潤魚鱗；玉米穗呈現緊密排列的飽滿長橢圓籽粒、圓潤冠部與狹窄粒間凹隙，而非磚牆換色。三者皆為 opaque dielectric，metallic 通道及 `material`／`createMaterial()` 預設 factor 均為 0，沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion 四份 maps 與 physical repeat；僅為表面 shading／normal map 效果，不提供完整植株／果實拓撲、geometry、真實刺、displacement 或刺與植株物理。前九十九種輸出須逐位元組保持不變，公開 options、借用 maps 的 ownership、backend 與零新增依賴契約不變，維持 WebGPU／WebGL2 3D、Canvas2D 2D-only。

紙材包裝增量為 corrugatedcardboard／creasedpaper／layeredpaper（瓦楞紙板／摺痕紙／層疊紙），目前共一百零五種；前述 counts 保留為歷史。瓦楞紙板呈現外露的圓潤紙質楞脊與谷槽、帶纖維的牛皮紙表面，而非金屬換色；摺痕紙呈現細微紙漿底紋上的交叉隆起摺脊與凹陷摺肩，而非僅有雜訊；層疊紙呈現不規則毛邊紙條交疊、明確階緣與下切陰影，而非紙張換色。三者皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，沿用 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion 四份 maps 與 physical repeat；楞紋、摺痕與層緣僅為表面 shading／normal map 效果，不建立 geometry、切面、displacement、透明撕邊輪廓或撕裂物理。前一百零二種輸出（含原 paper）須逐位元組保持不變，公開 options、呼叫者 ownership、借用 maps 的生命週期、backend 與零新增依賴契約不變，維持 WebGPU／WebGL2 3D、Canvas2D 2D-only。

火山石表面增量為 basalt／scoria／obsidian（玄武岩／火山渣／黑曜石），接續已提交金屬網孔後共一百一十一種；前述 counts 保留為歷史。玄武岩呈現深色細粒底紋、圓角多邊形柱頂與凹陷節理；火山渣呈現暖暗紅色岩面、大小不一的緊湊凹氣孔與隆起孔緣；黑曜石呈現極深色、有光澤的不透明火山玻璃與彎曲貝殼狀剝片痕。三者皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，沿用相同四份 seeded deterministic periodic maps 與 physical repeat；僅為表面 shading／normal map 效果，不建立真實岩柱、孔洞、geometry、displacement、透明玻璃、折射或發光。前一百零八種輸出須逐位元組保持不變，公開 options、呼叫者 ownership、借用 maps 的生命週期、backend 與零新增依賴契約不變，維持 WebGPU／WebGL2 3D、Canvas2D 2D-only。

裝飾礦石表面增量為 malachite／agate／lapislazuli（孔雀石／瑪瑙／青金石），目前共一百一十七種；前述 counts 保留為歷史。孔雀石呈現濃綠色圓潤葡萄狀巢套生長帶與細微拋光起伏；瑪瑙呈現暖奶油、紅與橙色的拉長波浪巢套生長帶，輪廓尺度與拓撲區別於孔雀石；青金石呈現深群青色顆粒石面與淺色不規則方解石脈及內含物，不含金色黃鐵礦或金屬碎斑。三者皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，沿用相同四份 seeded deterministic periodic maps、physical repeat 與公開 options；僅為表面拋光 shading／normal map 效果，不提供透明、折射、虹彩或寶石 geometry。前一百一十四種輸出須逐位元組保持不變，呼叫者 ownership、借用 maps 的生命週期、backend 與零新增依賴契約不變，維持 WebGPU／WebGL2 3D、Canvas2D 2D-only。

散粒表面增量為 rice／sesame／coffeebeans（米粒／芝麻／咖啡豆），目前共一百二十種；前述 counts 保留為歷史。米粒呈現象牙白細長輪廓、不同朝向與柔和縱向起伏；芝麻呈現暖棕褐色小型不對稱淚滴輪廓、圓潤隆起中脊與漸尖端部；咖啡豆呈現較寬的深烘焙棕色橢圓輪廓、彎曲中央裂縫與細密不均烘焙紋理。三者各自擁有不同形狀場，不是同一圖樣換色或縮放，皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，沿用 CPU 一次生成的四份 seeded deterministic periodic maps、repeat sampling 與 size／seed options。這些是風格化散粒表面 shading／normal map 效果，不是逐粒模擬或物理堆疊，不建立 geometry、displacement、透明或次表面散射。前一百一十七種四份 maps 輸出須逐位元組保持不變，呼叫者 ownership、借用 maps 的生命週期、backend 與零新增依賴契約不變。

綠葉表面增量為 lotusleaf／bananaleaf／fernleaf（荷葉／香蕉葉／蕨葉），目前共一百二十六種；前述 counts 保留為歷史。荷葉為寬闊圓潤葉片、放射狀葉脈與中央附著點起伏；香蕉葉為細長寬葉面、強烈中肋與密集平行／斜向側脈；蕨葉為沿葉軸交替排列的漸尖羽片，各有細緻葉脈。三者形態各異，不是換色或縮放的落葉層；皆為不透明綠色 dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps、repeat sampling 與 size／seed options。葉片與葉脈僅為表面 shading／normal map 效果，不提供 alpha cutout、真實植被 geometry、displacement、SSS、濕潤模擬或風動行為。前一百二十三種四份 maps 輸出須逐位元組保持不變，呼叫者 ownership、借用 maps 的生命週期、backend 與零新增依賴契約不變。

海洋骨骼表面增量為 braincoral／starcoral／seasponge（腦珊瑚／星珊瑚／海綿），目前共一百三十二種；前述 counts 保留為歷史。海洋骨骼表面包含腦珊瑚（braincoral，蜿蜒迷宮狀圓潤隆脊與脊間暗色谷地）、星珊瑚（starcoral，各自分明的珊瑚杯與環繞下陷口部的放射狀隔片）及海綿（seasponge，多尺度通道與不規則相連的多孔骨架）。三者結構各異，不是火山渣、浮石、泡棉或彼此的換色或縮放。皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps、physical repeat sampling、呼叫者 ownership 與 size／seed options。凹凸僅為表面 shading／normal map 效果，不建立真實珊瑚或海綿 geometry、孔洞、活體珊瑚蟲 geometry、alpha、displacement、次表面散射（SSS）或水下光學／模擬／行為。前一百二十九種四份 maps 輸出須逐位元組保持不變，公開 options、借用 maps 的生命週期、backend 與零新增依賴契約不變。

圖案織物增量為 houndstooth／tartan／damask（千鳥格／蘇格蘭格紋／花卉提花），目前共一百三十八種；前述 counts 保留為歷史。千鳥格為黑／象牙白斷格與源於斜紋交織的階梯狀齒形，不是普通棋盤格；蘇格蘭格紋為暖色柔和的寬細交叉條帶與可見的紗線交織，不是平鋪磁磚；花卉提花為織紋底布上的成對對稱花葉與花瓣圖案，呈現隆起的提花浮雕。三者圖案形態各異，不是 fabric、herringbone、tweed 或 seersucker 的換色或縮放，皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0。沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps、physical repeat sampling、呼叫者 ownership 與不變的 size／seed options；僅為表面 shading／normal map 效果，不建立真實纖維、geometry、alpha、displacement、各向異性、新 BRDF 能力或布料模擬。前一百三十五種四份 maps 輸出須逐位元組保持不變，公開 options、借用 maps 的生命週期、backend 與零新增依賴契約不變。

短毛皮紋增量為 zebrafur／leopardfur／giraffefur（斑馬短毛皮紋／豹短毛皮紋／長頸鹿短毛皮紋），目前共一百四十四種；前述 counts 保留為歷史。斑馬為蜿蜒、寬窄變化且分岔／匯合的黑／象牙白條紋，不是均勻正弦條帶；豹為環繞暖色中心的不規則斷續深色玫瑰斑，不是實心圓點或石材換色；長頸鹿為由相連淡色網絡分隔的不規則角狀棕色斑塊，不是矩形磚塊／磁磚格。各自的顏料圖案結合細密短纖維的定向淺起伏與粗糙度，顏料邊界不形成隆起甲片或深裂縫。三者皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，僅沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps、physical repeat sampling、呼叫者 ownership 與不變的 size／seed options。這些僅為淺層表面 shading／normal map 效果，不建立真實毛髮 geometry、alpha、displacement、各向異性 BRDF 或動物模擬。前一百四十一種四份 maps 輸出須逐位元組保持不變，公開 options、借用 maps 的生命週期、backend 與零新增依賴契約不變；實際品質與 browser 證據另記 ACCEPTANCE。

貝殼表面增量為 scallopshell／oystershell／nautilusshell（扇貝殼／牡蠣殼／鸚鵡螺殼），目前共一百五十三種；前述 counts 保留為歷史。扇貝殼為暖奶油／粉紅色扇形殼面、向外發散的放射肋與交錯的細微生長環，不是星珊瑚換色；牡蠣殼為粗糙灰／奶油色鈣化表面、不規則重疊生長薄層、翹起層唇與下切陰影，不是規則波紋或層疊紙換色；鸚鵡螺殼為奶油／赤褐色盤捲殼面、彎曲螺旋生長紋與腔室／條帶分區，不是同心木材年輪或普通圓點。三者形態各異，皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，僅沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps、physical repeat sampling、呼叫者 ownership 與不變的 size／seed options。這些僅為風格化殼面 shading／normal map 效果，不建立 geometry、displacement、透明、transmission、次表面散射（SSS）、虹彩或動物模擬。前一百五十種四份 maps 輸出須逐位元組保持不變，公開 options、借用 maps 的生命週期、backend 與零新增依賴契約不變；實際品質與 browser 證據另記 ACCEPTANCE。

水果表皮增量為 cantaloupe／dragonfruit／kiwiskin（網紋瓜皮／火龍果皮／奇異果皮），目前共一百六十二種；前述 counts 保留為歷史。網紋瓜皮為柔和綠／赭色瓜皮上的棕褐色隆起、不規則相連曲線網紋，不是六角蜂巢壁或長頸鹿顏料網絡換色；火龍果皮為飽和玫瑰紅／洋紅蠟質表皮、錯列漸尖苞片朝尖端過渡至黃綠色，帶淺層翹起尖端與搭接陰影，不是規則三角形或松果換色；奇異果皮為棕色果皮上方向多變的密集細短毛痕與小毛囊凹點，不是粗長縱向椰纖維或垂直斑馬毛紋換色。三者沿既有 scalar dark／light palette interpolation 安排表皮與尖端色調，不新增 color API；種子相關 transforms／inverses／tones 預先計算，取樣不配置物件，局部支撐、中心、區域 ownership 與週期邊界保持 C1。三者皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，僅沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps 與 physical repeat defaults。僅為表面 shading／normal map 效果，不建立 alpha、geometry、displacement、真實毛髮 geometry、transmission、次表面散射（SSS）、模擬或新 BRDF 能力。前一百五十九種四份 maps 輸出須逐位元組保持不變；公開 size／seed／contrast／roughnessBias／repeats options、呼叫者 ownership、借用 maps 的生命週期、backend 與零新增依賴契約不變。實際品質與 browser 證據另記 ACCEPTANCE，不在本段宣稱驗收。

花瓣表面增量為 rosepetal／lilypetal／fritillarypetal（玫瑰花瓣／百合花瓣／棋盤貝母花瓣），目前共一百六十八種；前述 counts 保留為歷史。玫瑰為酒紅至玫瑰紅色的柔和流動摺紋，疊加密集細小隆起乳突與高粗糙度的絲絨感微紋，不是布料織紋、毛髮或凹孔；百合為奶油／象牙白至暖黃色的細縱肋、淺摺紋與不規則細長紅褐色顏料斑點，較玫瑰平滑的緞面粗糙度，斑點不是凹洞；棋盤貝母為紫／奶油色沿兩軸交替的棋盤顏料、柔和游移格界與細縱紋，淺肋起伏獨立於色格，不是磁磚填縫或織物。種子相關資料與 transforms 預先計算，取樣不配置物件；四個 scalar fields 在週期接縫、局部支撐、中心與 ownership 交界須保持 C1。三者皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 metallic factor 均為 0，僅沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps 與 physical repeat defaults。僅為表面 shading／normal map 效果，不建立花朵 geometry、alpha、displacement、transmission、次表面散射（SSS）、模擬或新 BRDF 能力。前一百六十五種四份 maps 輸出須逐位元組保持不變；公開 size／seed／contrast／roughnessBias／repeats options、呼叫者 ownership、借用 maps 的生命週期、backend 與零新增依賴契約不變。實際品質與 browser 證據另記 ACCEPTANCE，不在本段宣稱驗收。

堅果殼表面增量為 walnutshell／peanutshell／almondshell（核桃殼／花生殼／杏仁殼），目前共一百七十四種；前述 counts 保留為歷史。核桃殼為不規則蜿蜒分岔的粗隆脊與深棕色凹谷；花生殼為淡稻草／棕褐色網紋，較強縱肋與次要橫向連結圍成不規則細長網格，不是織物上下穿插；杏仁殼為淺黃褐色殼面、零散細長凹孔與細微定向紋理，透過負向起伏與 occlusion 表現凹孔，不是純顏料斑點或隆起珠粒。種子相關 transforms、lattices 與 feature data 預先計算，取樣不配置物件、不計算未使用的通用 detail noise；四個 scalar fields 在兩軸週期接縫與實際局部支撐交界須保持 C1，避免硬性最近特徵 ownership、非零斜率截斷與絕對值尖點。三者皆為 opaque dielectric，metallic B 通道與預設 factor 為 0，沿用 baseColor／normal／metallicRoughness／occlusion 四份 CPU 一次生成的 seeded deterministic periodic maps 與 physical repeat，建議 tileSize 分別為 0.06／0.04／0.035 m；所有 tunable presets 保留於 src/data/materials.ts。僅為表面 shading／normal map 效果，不建立完整堅果 geometry、displacement、cutout、半透明、transmission、次表面散射（SSS）或新 BRDF。前一百七十一種 presets 與 maps 輸出須保持不變；公開 options、ownership、生命週期、backend 與零新增依賴契約不變。實際品質與 browser 證據另記 ACCEPTANCE，不在本段宣稱驗收。

樹皮表面增量為 birchbark／palmtrunk／sycamorebark（白樺樹皮／棕櫚樹幹／懸鈴木樹皮），目前共一百八十種；前述 counts 保留為歷史。白樺呈現淺色紙質樹皮、短而不規則的深色橫向皮孔與淺紙層接縫，皮孔透過淺凹與 occlusion 表現，不是縱向木紋；棕櫚呈現乾燥棕褐色纖維表面、不等距橫向葉痕環、凹陷葉痕與隆起肩部，細縱纖維為次要紋理，區別於竹材的寬大平滑節點；懸鈴木呈現奶油／橄欖灰色多層次寬大不規則剝落斑塊與淺剝落邊緣，不是深填縫石塊或剝漆換色。種子相關結構於 sampler 預先快取，取樣不配置物件或重算未使用的通用 detail；可調 palette／roughness／relief／tileSize 常數保留於 src/data/materials.ts，scalar fields 在週期接縫、局部支撐與內部 cell 交界須保持 C1。三者皆為 opaque dielectric，metallic B 通道與預設 factor 為 0，沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps 與 physical repeat。僅為表面 shading／normal map 效果，不新增 geometry、displacement、alpha、transmission、次表面散射（SSS）、renderer／BRDF 或依賴。前一百七十七種 presets 與四份 maps 輸出須逐位元組保持不變；公開 size／seed／contrast／roughnessBias／repeats options、呼叫者 ownership、借用 maps 的生命週期與 backend 契約不變，維持 WebGPU／WebGL2 3D、Canvas2D 2D-only。實際品質與 browser 證據另記 ACCEPTANCE，不在本段宣稱驗收。

動物皮膚表面增量為 elephanthide／ostrichleather／sharkskin（象皮／鴕鳥皮革／鯊魚皮），目前共一百八十六種；前述 counts 與段落保留為歷史。象皮呈現霧面灰色皮膚、粗大蜿蜒交錯的凹陷皺褶、圓潤肩部與次要細摺紋，不是一般皮革凸粒或鱷魚方形鱗板；鴕鳥皮革呈現暖棕褐色皮革、稀疏不規則的凹陷羽管毛囊與外圍低矮隆起圓環，細卵石底紋為次要紋理，不是杏仁凹孔或顏料圓點；鯊魚皮呈現灰藍色細密定向微小盾鱗，沿流向逐漸收尖，每片有兩至三條細縱脊與淺搭接陰影，區別於大型圓潤魚鱗或單脊蛇皮菱形。種子相關資料於 sampler 預先快取，取樣不配置物件；scalar fields 在週期接縫、內部交界與局部支撐邊界須保持 C1。三者皆為 opaque dielectric，metallic B 通道與預設 factor 為 0，沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps 與 physical repeat。僅為表面 shading／normal map 效果，不新增 geometry、displacement、透明度、transmission、次表面散射（SSS）、anisotropic BRDF、renderer 路徑或依賴。前一百八十三種 presets 與 maps 輸出須逐位元組保持不變；公開 size／seed／contrast／roughnessBias／repeats options、呼叫者 ownership、借用 maps 的生命週期與 backend 契約不變。實際驗證另記 ACCEPTANCE，不在本段宣稱驗收。

市政表面增量為 tactilepaving／roadmarking／draincover（警示導盲磚／道路標線／排水蓋），目前共一百九十二種；前述 counts 與段落保留為歷史。警示導盲磚呈現柔和安全黃色水泥／陶瓷磚、凹陷磚縫、規整平頂截錐警示凸點與圓潤肩部，次要細顆粒區別於圓釘橡膠換色；道路標線呈現深色顆粒瀝青上的寬幅磨損米白漆帶，連貫局部掉漆露出較粗糙底層，漆面略微隆起且較平滑、邊緣圓潤；排水蓋呈現矩形鑄鐵框、平行長條圓端槽、隆起柵條與橫向支撐，帶鑄造顆粒及磨圓肩部，槽底是不透明暗色凹陷而非實際開孔，區別於圓孔板或編織金屬網。前兩者皆為 opaque dielectric，metallic B 通道與預設 factor 為 0；排水蓋預設 factor 為 1，完整金屬框／柵條／支撐 B 為 1，不透明凹槽底面與外部 B 為 0，圓潤肩部平滑過渡。種子相關資料於 sampler 預先快取，取樣不配置物件或計算未使用的通用 detail；scalar fields 在週期接縫、內部交界、中心與局部支撐邊界須保持有限且 C1。沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps 與 physical repeat。僅為 shading／normal map 效果，不新增實際開孔、geometry、displacement、alpha、renderer／BRDF 或依賴，不提供逆反射、無障礙認證或道路安全合規保證。前一百八十九種 presets 與 maps 須逐位元組保持不變；既有公開 options、repeat、呼叫者 ownership、借用 maps 的生命週期與 backend 契約不變，維持 WebGPU／WebGL2 3D、Canvas2D 2D-only。實際品質與 browser 證據另記 ACCEPTANCE，不在本段宣稱驗收。

真菌表面增量為 mushroomgills／morel／bracketfungus（菌褶／羊肚菌表面／層孔菌表面），目前共一百九十八種；前述 counts 與段落保留為歷史。菌褶呈現奶油／棕褐色密集放射狀窄長褶片與起於外側的短菌褶，附著區保持平靜，不複製等長寬扇貝肋；羊肚菌呈現暖赭／棕色不規則細長凹陷腔室、暗色碗底及狹窄圓潤相連隆脊，區別於規則六角蜂巢、正向珊瑚迷宮或皮革凸粒；層孔菌呈現奶油／鏽紅／棕色重疊薄扇面、沿波狀分葉前緣的寬幅多色同心帶、淡色平滑外緣與細絲絨感顆粒，區別於牡蠣厚層唇與瑪瑙完整巢套環。只預先快取消費到的種子資料，使用完整解析支撐範圍的有界查找，取樣不配置物件；scalar fields 在週期接縫、中心、角度切線、ownership 及實際局部支撐交界須保持有限且 C1，不以硬性最近特徵切換或 clipping 掩蓋無效場，前方不透明扇面須遮住下層邊緣與 AO。三者皆為 opaque dielectric，metallic B 通道與預設 factor 為 0，沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps 與 physical repeat。僅為平坦表面的 shading／normal map 近似，不新增 geometry、displacement、alpha、次表面散射（SSS）、transmission、生物生長模擬或 BRDF。前一百九十五種 presets 與四份 maps 輸出須逐位元組保持不變；公開 options、repeat、呼叫者 ownership、借用 maps 的生命週期、backend 與零新增依賴契約不變。本段僅定義設計範圍，不宣稱 runtime 驗收。

果皮表面增量為 pineapple／strawberry／lychee（鳳梨皮／草莓皮／荔枝皮），目前共二百零四種；前述 counts 與段落保留為歷史。鳳梨皮呈現金黃／橄欖色菱形多邊形果目、斜向交錯排列、狹窄棕綠色凹縫與圓潤冠部內的小凹陷中央果眼，區別於松果搭接木質鱗片；草莓皮呈現紅色表皮、不規則交錯的細長凹陷種子窩與窩內小型赭黃色種子，區別於橘皮圓形油腺或芝麻正向凸粒；荔枝皮呈現粉紅／紅色密集不規則多邊形凸疣、柔化尖冠與狹窄暗色凹裂縫，區別於圓形毛囊或鳳梨規整大果目。沿用既有 scalar 雙端點調色設計，不新增逐材質 RGB 輸出路徑；種子資料只快取消費到的內容，取樣不配置物件，週期／cell 接縫、特徵肩部、中心、角度切線、ownership 與局部支撐邊界的 scalar fields 須保持有限且 C1，AO 對應凹陷而非任意顏料帶。三者皆為 opaque dielectric，metallic B 通道與預設 factor 為 0，沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps 與 physical repeat。僅為 shading／normal map 效果，不新增 geometry、displacement、透明度、次表面散射（SSS）、transmission、BRDF 或依賴。前二百零一種 presets 與四份 maps 須逐位元組保持不變；既有 options、repeat、呼叫者 ownership 與借用 maps 的生命週期不變。本段僅定義設計範圍，不宣稱 runtime 驗收。

榻榻米 `tatami` 以週期餘弦塑造藺草凸脊，以平滑緊支撐函數生成橫向綁線，交替草莖交點分別抬高／壓低；低振幅縱向纖維與 seeded noise 補充表面變化。目前實際目錄 303→304 種，既有歷史 counts 不改。沿用 CPU 一次生成的四份 maps、opaque dielectric（metallic 0）、0.16 m tile 與 caller-owned textures；不新增 shader、geometry、透明或物理模擬。

`flutedwood` 直槽木飾板使用緊支撐平滑圓冠，與平坦深色底板在零斜率處相接；週期縱向木紋與細纖維只作用於凸條，seeded noise lattice 每個 sampler 建立一次。實際 data 目錄增為 359 種，四圖維持 opaque dielectric、metallic 0；一張 tile 對應 0.32 m。凹凸僅為 normal map，不位移 geometry、不更動 renderer 或 caller-owned textures 契約。

`subwaytiles` 以兩欄四列錯縫矩形單元形成倒角長方磚。分離軸向平滑遮罩產生等寬填縫肩部與內縮平臺；逐磚 seed 色差在單元邊界前淡出，避免錯列換行時的色彩／法線接縫。平整釉面低 roughness、填縫高 roughness；四圖維持 opaque dielectric、0.6 m tile 與既有 ownership，目錄增為 360 種。

`canewebbing` 以縱橫圓肩藤條與半格偏移的雙向斜藤形成八角孔外觀，連續交織遮罩區分經緯上下關係。藤條覆蓋率同時控制高度、AO 與 roughness；seeded 紋理僅作用在藤條上，暗凹槽維持不透明底板而非 alpha 孔洞。四張週期圖、tile 0.24 m、既有資源生命週期不變，目錄增為 361 種。

`rammedearth` 將八層 seeded 土色透過平滑過渡連接，沿水平週期波微幅彎曲；窄壓實接縫、細砂與凹孔另外控制 normal／roughness／AO，避免把色帶直接變成幾何階梯。預先快取色層與 noise lattices，sample 不配置；2 m tile、opaque dielectric 四圖與既有 ownership 不變，目錄增為 362 種。

`copperpatina` 將大塊腐蝕分布與細碎氧化斑融合為連續 patina coverage，同時驅動紅銅→青綠 baseColor、metallic 1→0、roughness 與淺氧化層 relief，避免綠色氧化層仍保有裸金屬反射。沿用既有混合金屬圖路徑與 default factor 1；四份週期 maps、0.5 m tile、caller ownership 不變，目錄增為 363 種。gallery 說明改為金屬類使用 authored metallic maps，不再僅列 metal／rust。

`birdseyemaple` 以預先快取的 seeded 眼狀中心，在六乘六單元內形成緊支撐橢圓紋理；深色眼心、細環與縱紋偏折在換單元前平滑歸零，避免 owner 接縫。色彩對比不轉成凸起木節，高度僅有微小纖維與眼心凹痕；0.24 m tile、四圖 opaque dielectric／metallic 0、既有 ownership 不變，目錄增為 364 種。

`breezeblock` 以四個平滑圓瓣場的乘積聯集建立四葉孔輪廓，避免瓣與瓣交疊處形成硬法線折線；方形水泥框以軸向平滑肩部銜接填縫。水泥覆蓋同步驅動高度、AO 與顆粒，孔內保留暗底且 alpha 不變；0.8 m tile、四圖 opaque dielectric／metallic 0、既有 ownership 不變，目錄增為 365 種。

`basketweavepavers` 以棋盤交替軸向將每個方形單元分為兩塊長磚，沿長短軸的平滑肩部乘積構成磚面與凹填縫；逐磚 seeded 色差預先儲存並在填縫前淡出，避免換向或更換磚身時造成 normal 不連續。四乘四單元／32 磚／0.8 m tile，四圖 opaque dielectric／metallic 0，既有 ownership 不變，目錄增為 366 種。

`ripstop` 以連續餘弦場交織細經緯紋，四乘四補強格的每條格線各有兩道 compact smooth ridge，交叉處採平滑聯集而非硬切 max。補強高度、色彩及粗糙度與細織紋分開驅動，seeded 顆粒場預先儲存；0.04 m tile、四圖 opaque dielectric／metallic 0、既有 ownership 不變，目錄增為 367 種。

`octagondot` 以軸向與斜向平滑帶的乘積裁出八角主磚，交點另以兩條平方斜向帶生成菱形嵌磚，避免菱形軸線上的法線尖折。兩者共享等高平面但色彩分離，填縫保留較高粗糙度與較低 AO；0.8 m tile、四乘四主磚、四圖 opaque dielectric／metallic 0、既有 ownership 不變，目錄增為 368 種。

`truchettiles` 預先儲存四乘四磚面的 seeded 轉向，以平方半徑差的平滑 compact band 生成相對角雙弧，旋轉後仍在每條邊的中點對接。圖案只改釉色、不抬升高度；磚面肩部將轉向差異淡出至共同凹填縫，避免邊界法線跳變。0.8 m tile、四圖 opaque dielectric／metallic 0、既有 ownership 不變，目錄增為 369 種。

`standingseam` 以窄平頂和平滑肩部構成立縫、兩側 compact 凹槽構成接腳，大部分板面只保留淺軋製紋理，不使用連續正弦起伏。64×4 seeded 軋紋場預先儲存；metallic B 通道與預設 factor 均為 1，代表無塗漆金屬而非非金屬烤漆層。2 m tile／四片板、四圖 opaque、既有 ownership 不變，目錄增為 370 種。

`damascus` 將週期金屬層紋通過 seeded compact 徑向折紋場局部回折，折紋在單元換主前平滑歸零，中心預先儲存。共用層覆蓋同步控制亮暗、蝕刻深淺與粗糙度，relief 保持微淺，metallic B 與預設 factor 均為 1。0.12 m tile、四圖 opaque、既有 ownership 不變，目錄增為 371 種。

`windmillpavers` 每組以五個互不重疊矩形分割三乘三單元，四片長磚繞中央深色方磚。兩軸獨立 smooth 邊緣相乘，讓倒角角落與換主填縫均保持一階連續；預先儲存每磚 seeded 色差與細粒場，所有 owner 特徵在填縫內歸零。中央方磚與外圈等高，0.9 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 372 種。

`castiron` 預先儲存 96×96／48×48 細粒場與稀疏孔洞的 seeded 中心、半徑倒數；compact 凹孔在換主前平滑歸零，不產生槌紋表面的大片重疊凹印。孔洞同步降低 height／color／AO 並提高 roughness，細粒基面仍保持粗糙。0.1 m tile、四圖 opaque、metallic B 與預設 factor 均為 1，未模擬塗層或氧化膜；既有 ownership 不變，目錄增為 373 種。

`porphyry` 預先儲存斑晶中心、旋轉基底、長短軸與細粒場，兩軸 smooth 覆蓋相乘形成長石形狀，整個晶體位於所屬單元內，換主時只剩共用基質。斑晶控制 color 與 roughness，但不額外改變 height，以維持拋光後的齊平表面。0.3 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 374 種。

`linen` 以獨立 seeded 經緯竹節場控制各紗線沿長度的局部寬度，compact 紗冠在換主前消失於紗隙；連續週期交織權重決定可見纖維方向，保留交點隆起與粗糙不透明凹隙，不以平織換色代替竹節結構。0.04 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 375 種。

`chippedenamel` 預先儲存 seeded 缺口中心與五條半平面邊界，平滑覆蓋乘積形成不同朝向的角狀碎片缺口。共用缺口覆蓋同步驅動 color、height、roughness 與 metallic：完整釉層 metallic 0，裸露基材 metallic 1；缺口平滑降至下層而不捲起邊緣，預設 factor 1 保留 map 的金屬資訊。0.25 m tile、四圖 opaque、既有 ownership 不變，目錄增為 376 種。

`perforatedleather` 以偶數列週期的半格偏移排列圓孔，平方徑向距離經 smooth 過渡形成平底孔與圓潤孔壁，孔域在換主前消失。預先快取的雙尺度 seeded 細粒場只影響完整皮面；深色粗糙內襯固定在皮面下，並非透明穿孔或 raised 毛囊。0.04 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 377 種。

`argyle` 在兩個斜向週期座標中，以平滑符號乘積形成連續交錯菱形，半格偏移的細線以 smooth union 覆蓋色塊。印花只驅動 color；height、roughness 與 AO 由獨立經緯紗線和 seeded 細粒場決定，避免做成菱形磁磚或浮雕。0.16 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 378 種。

`chevronparquet` 在兩個相反斜向座標中排列木板，獨立板端與板側平滑覆蓋相乘，使斜接尖角、倒角與換板位置均回到共用凹縫。木紋相位沿板寬變化，兩側長紋方向隨木板翻轉；預存逐板 seeded 色差與細粒場。0.6 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 379 種。

`ginkgoleaf` 預存逐葉旋轉基底與色差，compact 扇形在所屬單元內完整消失；平滑半徑缺口區分左右葉瓣，葉柄以笛卡兒橢圓平滑併入。扇形與角度葉脈在極座標原點及 angle branch cut 前歸零，避免中心奇異與法線裂痕。0.24 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 380 種。

`pressedtin` 以雙層平滑矩形覆蓋之差形成方框，四個 compact 橢圓冠與圓形凸鈕形成壓製花飾，支撐邊界以零斜率接回共用板面。細粒場預先快取，raised 紋樣同時調整 normal、color、roughness 與 AO。0.6 m tile、四圖 opaque、metallic map 與預設 factor 1、既有 ownership 不變，目錄增為 381 種。

`sashiko` 預存每列與每行的二元針腳相位，以 compact 橢圓冠形成交替斷續的經緯針腳，端點在格線交點前歸零、不重疊；底布使用連續平織場與快取細粒。針腳同步抬升 height、提高亮度並降低 roughness，區別於純色印花。0.064 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 382 種。

`ashlar` 以固定矩形分割完整覆蓋 6×6 模組，預存 owner lookup 與逐石色差；取樣時以整塊石材四側的平滑覆蓋相乘計算倒角，內部 lookup 格線不產生假接縫。石材色差在共用凹縫前消失，T 字交點與週期邊界保持連續，礦物及細粒場預先快取。1.2 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 383 種。

`gabion` 預存每顆 compact 橢圓圓石的旋轉、半徑、偏移與色差；方格鋼線以週期平滑冠與 smooth union 接合。線網混合到固定較高位置及較低 roughness，B metallic 與灰色混合覆蓋一致，石間深色底層維持 opaque，不是可穿透 geometry。線寬須在 32×32 輸出仍可取樣到金屬區域，避免整個網格落在 texel 中心之間而消失。0.4 m tile、四圖 opaque、metallic 分區且預設 factor 1、既有 ownership 不變，目錄增為 384 種。

`gingham` 以平滑等寬色帶決定經紗及緯紗是否染藍，再由連續 plain-weave over-under 權重選取可見紗色，混色格內仍保留逐紗交替而非單一中間色。height／roughness／AO 只由細織紋與 seeded 纖維細粒決定，不把藍白色帶轉成宏觀方塊凹凸。0.08 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 385 種。

`mossypavers` 用四乘四方石的雙軸平滑倒角遮罩區分石面與接縫；週期 seeded 生長場只在接縫內形成苔蘚墊，細粒場產生苔蘚尖端。石面用既有中性灰混合通道與逐石色差，苔蘚維持綠色，裸縫較暗；height、roughness、AO 隨生長量聯動，苔蘚永遠低於石冠。0.8 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 386 種。

`bamboocrosscut` 預存四乘四竹筒的外徑、內徑與色差，用內外徑的平滑遮罩乘積形成環狀切面，再以外緣遮罩分出較平滑的深綠外皮。細孔只壓暗及微凹切面；壓暗幅度受限，避免窄竹壁被整片孔隙噪音壓暗而失去淡色切面。中空及筒間是較深的 opaque 底層，不是透明孔洞，也沒有木材年輪。0.24 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 387 種。

`moire` 直接計算週期 seeded 相位差的低頻 beat envelope，形成彎曲的明暗水波與對應較平滑的亮帶；不先生成兩組高頻光柵再依賴取樣混疊形成波紋。height／AO 獨立於波紋，只由細經緯紗及纖維細粒決定。這是 baked 水波紋絲緞外觀，不是繞射、視角相關變色或 anisotropic BRDF。0.08 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 388 種。

`oakleaf` 預存三乘三葉片的旋轉與色差，以沿長軸變寬的橢圓隱式場構成圓裂及深缺刻，獨立 compact 橢圓葉柄與葉片平滑聯集。中肋與成對分枝葉脈共用葉片遮罩，跨軸距離正規化避免枝脈交會導數折角；葉面冠與葉脈提供微小浮起，不使用銀杏的扇形輪廓或放射葉脈。0.3 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 389 種。

`rhombille` 沿用偶數交錯列的週期三角格點定位 hex owner，再以三組平行半平面帶構成三片四邊菱形磚；各邊平滑遮罩相乘，避免 min-distance 倒角在角平分線形成法線折痕。三種明暗與逐磚 seeded 色差建立方塊錯視，三片高度相同，owner 邊界及內部交點先退到同一平坦灰縫。0.9 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 390 種。

`fossillimestone` 以每格預存的旋轉、橢圓尺度及相位構成 compact 化石切面，整數角諧波與徑向相位形成螺旋壁、細隔板及暗色腔室，中心常數鄰域移除 atan2 奇點，外緣平滑回到石灰岩基質。色彩及局部粗糙度描述拋光礦物截面，高度只由獨立細石粒噪聲決定，AO 不沿化石輪廓或螺旋凹下，避免誤製成立體完整鸚鵡螺殼。0.6 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 391 種。

`seigaihatiles` 預存四欄八交錯列的藍釉色差，以 compact 圓盤依列由後向前覆印多重同心弧，形成交錯青海波；圓心以常數鄰域消除徑向導數奇點，圓盤外緣平滑淡出，因此 row／column 候選更換不產生接縫。波弧只改色彩，獨立二乘二方磚遮罩控制倒角、灰縫、AO 及釉面粗糙度。0.6 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 392 種。

`tuftedleather` 以兩組週期對角相位形成平滑鼓包與交叉壓褶，在相位交點用 compact 平方距離遮罩壓下拉扣口袋，再疊入小圓形包皮扣。扣面高於口袋但低於菱形鼓包，皮紋與磨耗使用獨立 cached noise，粗糙度在鼓包與圓扣降低；沒有 quilting 的織線及虛構金屬聲明。0.8 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 393 種。

`louveredmetal` 以獨立橫向端部遮罩及非對稱縱向葉片輪廓形成沖壓百葉，上端接回板面、下緣抬高，再平滑落到較深暗槽。端部遮罩同時限制葉片與暗槽，保留兩側連續板面；細粒 cached noise 不改機械形狀。暗槽以高度及 AO 表現不透明背板，不宣稱 alpha 穿孔或 geometry。0.6 m tile、四圖 opaque、metallic B 與預設 factor 1、既有 ownership 不變，目錄增為 394 種。

`herringbonebrick` 依整數格的對角相位分配唯一 2:1 domino owner：兩個相鄰格合併成同一橫磚或直磚，相鄰對角帶旋轉 90 度，週期 wrap 後仍使用同一磚的 seeded 色差。四邊平滑倒角遮罩相乘，外緣退到中性灰縫，內部格線不產生高度或色差斷裂；細粒 cached noise 提供燒製紅磚表面。1.2 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 395 種。

`shibori` 使用 compact 雙環帶、週期角度諧波及 seeded 相位模擬絞染防染區與放射狀綁染痕跡，環帶在中心與格邊之前已歸零，避免 atan2 奇點或格線接縫。不規則淡色暈邊只影響 pigment，64-thread 平織高度與 AO 獨立於染色，細粒提供微小棉布表面起伏。0.24 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 396 種。

`scallopedslate` 將三列錯半格的瓦片由下至上合成：側邊、隱藏上緣與橢圓下尾採平滑 compact 遮罩，圓尾跨列覆蓋下瓦、抬高弧形下緣並於外側衰減陰影。三列候選的進出點皆在零遮罩區，保留列切換與 wrap 的搭接連續性；cached 細粒與橫向層理、每瓦 seeded 色差獨立於輪廓。陰影不改表面 roughness。1.2 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 397 種。

`saltpan` 沿用既有共用半平面與平滑肩部相乘的連續多邊形慣例，預先計算錯列 jittered site 的八條鄰居平分面；偶數列維持週期錯位，3×3 lookup 中各多邊形面積遮罩的補集形成近六邊形的隆起鹽脊網絡，pigment 只在各自內部插值，不以最近點切換色差。細粒與小結晶為獨立 cached noise，鹽脊比低平內部更白、更高且較粗糙，區別於泥裂與釉面開片。3 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 398 種。

`dogbonepavers` 以互補的平滑肩部寬度構成窄腰與寬端，相鄰欄沿長軸錯半塊磚，使寬端確實填入鄰磚凹口而非留空。三欄候選使用側邊與端部倒角遮罩，色差只在各磚內部加權，所有邊緣回到同一灰縫；cached 骨材與細粒不改互鎖輪廓。0.8 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 399 種。

`palmendgrain` 預先計算八乘八個 seeded 橢圓維管束的位置、旋轉與長短軸倒數；束與兩個導管孔皆為 cell 內 compact support，無須逐像素搜尋鄰居。纖維僅降低顏色與少量粗糙度、切面維持平齊，成對導管孔才降低高度及 AO；獨立 cached 細粒與基質色場不生成木材年輪。0.024 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 400 種。

`asanoha` 使用週期斜座標的三向格線及兩種三角形內的三段 centroid→vertex 線段，平滑遮罩乘積聯集避免最近線切換；實色格線覆蓋三角形 ownership 邊界，偶數列在 tile wrap 閉合。印花只改顏色，獨立六十四線平織紋與 cached 細粒控制高度／粗糙度／AO，不生成染色浮雕。0.12 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 401 種。

`lotusseedpod` 預先計算各蓬半徑及七個 chamber 的位置／半徑平方倒數，中央一室加六室環列；所有圓形 compact support 皆留在 cell 內。孔緣以平滑環帶隆起，室內凹陷與較小種子冠分開相加，使種子仍低於蓬面；蓬間與室內是 opaque backing，細粒用 cached noise。0.3 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 402 種。

`crowncaps` 預先計算十六個瓶蓋的壓褶相位；二十一週角向餘弦只作用於外側裙邊與外輪廓，中心高度及顏色不受角向項影響，避免極點奇異。平頂向外平滑下降，捲邊另加 compact 環帶，裙邊壓褶同時控制高度與凹槽 AO；支撐在 cell 內歸零，背景仍為 opaque 金屬，細粒用 cached noise。0.112 m tile、metallic B 255、factory factor 1、既有 ownership 不變，目錄增為 403 種。

`cofferedconcrete` 在九個方格內，以兩軸平滑肩部乘積形成 flat-bottomed 凹室；斜壁在四周歸零，使跨 cell 的平頂肋梁與交會處連續，避免 max 造成對角尖脊。cached 96×96 細粒及 24×24 骨材只提供微表面起伏，氣孔輕微下凹，凹室底降低 AO；不是布料圓鼓交織。2.4 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 404 種。

`woodworm` 預先計算十六個蟲道的旋轉基底與彎曲幅度，局部正弦中心線用平方距離平滑降入木面，兩端逐步收束。圓形出孔與蟲道採平滑聯集，另加孔深，使出孔低於蟲道；所有旋轉支撐留在 cell 內，底面 opaque。縱向 cached 96×4 木紋與 192×8 細纖維獨立於蟲道方向。0.16 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 405 種。

`calcadawaves` 依各 tessera 中心所在波帶預先決定黑／白，整顆石材同色，不將曲線畫穿石面或接縫；色調在倒角支撐外歸零，使 owner 改變時保持 C1。兩軸平滑倒角相乘，灰色低接縫隔開石塊；cached 細粒／骨材控制微起伏，色帶不控制高度、粗糙度或 AO。1.28 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 406 種。

`ikat` 用 cached 64×1 經紗對位場平移局部染紋的縱向座標，維持同一束經紗在各列的偏移；圓化絕對距離的菱形支撐在 cell 邊界前歸零，避免尖角與 wrap 導數不連續。染紋只進入 color，六十四線平織紋及 cached 96×96 細粒獨立控制高度／粗糙度／AO。0.16 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 407 種。

`slottedwood` 以線段平方距離形成膠囊槽，先用 columns／rows 比例校正 y 軸，確保方形 UV tile 上的端部為圓形而非橢圓。八個偶數列逐列偏移半格，支撐在 row 邊界前歸零；槽壁平滑接回木面，槽底為暗色 opaque backing，cached 縱向木紋／纖維僅作用於木面。0.8 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 408 種。

`hollyleaf` 以橢圓葉身、三對漸尖側刺及尖葉端做 smooth union；平方橫距配合 compact smooth 支撐，在尖端／葉緣／葉柄交界保留連續導數。側脈在主軸前平滑歸零，避免 absolute cross-axis 導數尖點；預先計算 seeded 旋轉讓每葉完整留在自己的格內。較低葉柄、凸起主／側脈與細粒控制高度，綠色亮葉比 opaque 暗底平滑。0.24 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 409 種。

## 已驗收基礎：P01–P08（歷史範圍；後续擴充另列）

目前 root metadata 是 `1.21.2`／Apache-2.0（`package.json`／`LICENSE`），npm 未發佈；以下各階段的日期／counts／版本／release 與當時批准範圍均為歷史記錄，不作新階段驗收。正式路徑是 `src/index.ts`（統一公開入口）→ `packages/core` 的 Game／Scene／Clock → `packages/graphics` 的 Renderer；範例不建立第二套渲染器。實際驗收見 `ACCEPTANCE.md`。

- Game 為 `EventTarget`，以 `Game.create(options)` 非同步取得 renderer；requestAnimationFrame 依序同步 DPR→Clock→Camera2D viewport→Input→Scene timers→Scene animations→Scene.update→World Systems→Renderer，最後清除 input edges。`game.start(scene?)` 可非同步準備 Scene；需等待切換結果時使用 `await game.setScene(scene)`。SceneObject 提供 ownership，GameObject 加入 Transform2D；ECS 保持內核，使用者透過 scene.add 操作物件。
- `game.state` 為 `idle | running | paused | destroyed`。支援 pause／resume／resize／destroy；同一 Canvas 在非同步初始化開始前即被保留，初始化失敗或 destroy 釋放 ownership。第一個 fatal frame／graphics failure 會被保留並送出 error；失敗後 resume 明確拒絕。Scene 準備失敗與 Audio 排程錯誤也可送出 error，但不把 graphics 鎖成 fatal。
- `game.clock` 提供模擬 delta／elapsed（秒）、tick frame 數與未 clamp 幀間隔計算的瞬時 fps。隱藏分頁及 pause 不累積時間；預設最大 delta 0.1s 不應掩飾真正低幀率。
- 畫布以 size containment／contain-intrinsic-size 隔離 CSS intrinsic 尺寸與 backing pixels；預設 1280×720 CSS 像素，預設 pixel ratio 上限 2。作者 width／height CSS（含 cascade layer）仍主導 layout；autoResize 以 content box 同步 GPU，手動 resize 更新 intrinsic fallback。越界 resize 必須保留舊 CSS／logical／backing 狀態；清理還原引擎接管且尚未被使用者改動的 inline containment。
- Renderer 隔離三種 backend。WebGPU 的 JS render-pass descriptor／attachment／submit 容器跨幀重用，但每幀仍建立必要的 GPU view／encoder／command buffer，消費後清除暫時參照。viewport 在 resize 時計算，GPU 上限驗證在 canvas 寫入之前。初始化各 await 邊界檢查 teardown，晚到的 GPUDevice 必須銷毀。
- `auto` 依 WebGPU→WebGL2→Canvas2D 降級，強制 backend 失敗不切換。auto 使用獨立 backend canvas 加原 canvas 的 2D presentation，避免不可逆 context binding 阻止 fallback；強制 backend 直接渲染。device lost／context lost 在 `recoverGraphics:false` 時使 Game 暫停並送出 error；預設（v1.5 起 `recoverGraphics:true`）由 `ResilientRenderer` 重建 renderer 並送出 `graphicslost`／`graphicsrecovered`，詳見下方 v1.4 之後補強與 TECHNICAL。
- 產物為 TypeScript strict ESM 與宣告檔；build 依序執行 `tsc`、逐檔最小化自有 JavaScript 並串接 source maps、原樣複製官方已最小化 vendor。入口 `dist/src/index.js`，內部相對引用含 `.js`，保留公開名稱與類別名稱。npm `exports` 使用相同入口；無 bundler 部署須**完整複製** `dist/`（含 `dist/vendor/opm/`），不可只抽出入口。WebGPU／AudioWorklet 要求安全來源，localhost 可用。根套件授權為 Apache-2.0（見 `LICENSE`）、未 npm publish；OPM 另附其官方 Apache-2.0 LICENSE 於 `dist/vendor/opm/`，須一併保留。
- API 細節、Clock 算式、尺寸 ownership、錯誤策略與效能量測方法見 [繁體中文技術參考](docs/TECHNICAL-zh.md)／[English](docs/TECHNICAL.md)；前後驗收證據見 `ACCEPTANCE.md`。範例的 BFCache `pagehide.persisted` 不銷毀 Game，避免瀏覽器恢復已經 teardown 的頁面。

## 已交付子系統與限制

- P02 Scene 已完成：候選初始化成功才發佈，準備失敗保留舊 Scene，取消使用 AbortSignal，清理同步且只執行一次。Scene／物件均不可跨 owner 共用；移除物件可重新加入，destroy 則終結生命週期。P03 已將 Asset cache 與 renderer-specific GPU resources 分離，Sprite 支援貼圖、opacity、z-order，共用 instanced pipeline。
- P04 已完成 Camera2D 與輸入。原 P05 範圍為 Vector3／Quaternion／Matrix4／Transform3D、Mesh（自訂頂點與 cube／sphere／plane／quad）、貼圖材質、PerspectiveCamera、depth、ambient＋directional lighting；同 Scene 先渲染 3D 再按 z-order 疊加 2D。原階段不含進階 3D／模型載入；下列 P09–P12 已擴充此範圍，自製 Shader IR 仍非目標。
- P06 已完成三級初始化 fallback、capabilities、WebGL2 GLSL 2D／3D、Canvas2D Sprite 與跨 backend Primitive2D。Canvas2D threeD=false，遇可見 Mesh 明確拒絕；不做 software rasterizer。Capabilities 描述 backend 硬體能力，不表示已公開 custom shader／compute facade。
- P07 當時整合 OPM.js v1.1.0 官方完整 dist／LICENSE／release checksum；目前 vendor 為官方 v1.13.0（tag `v1.13.0`），build 原樣複製。Voice 內部正規化為 v7，公開 `OPMVoice` 保留 `version: 1` 契約。上游可選聲部數，但引擎仍以八個獨立 OPM instance 各保留一個聲部，總預算含 release，overflow 只以官方 `opm.panic()` 清除最舊 SFX instance 的音符，保留 managed node／routing；不影響 BGM，也不修改官方 DSP。代價是八個 AudioContexts/worklets，teardown 使用官方 `opm.dispose()`。首次手勢 unlock 前不建 AudioContext；bounded lookahead 避免填滿官方 256-event queue；Scene 清理取消非 persistent 音訊。此 vendor 升級不新增引擎功能或擴大認證範圍。
- P08 當時完成 Error hierarchy／logger／loss cleanup／六範例與 1,000 Sprite benchmark，loss 使 Game paused／拒絕 resume且沒有 recovery；這是歷史行為，現在預設 `recoverGraphics:true` 可重建同 backend（見上方 Renderer 契約與 TECHNICAL），失敗或關閉復原才 fatal。當時獨立 `[Pxx]` commit／不 push 記錄保留。Safari／Edge／Firefox、實體 gamepad、真背景分頁／BFCache、跨螢幕 DPR／driver reset 不因現有 Chromium 證據取得認證。
- 後續優化保持公開 API：World 按需穩定壓縮 Systems、WebGPU 只在 logical viewport 改變時重傳對應 uniform；Keyboard 在 focus 轉入 editable 後仍處理既有按鍵釋放。時間量測未證明 CPU／FPS 改善，見 ACCEPTANCE，不以 API call 減少冒充 throughput 提升。
- 安全維護：圖片與音訊共用內部 bounded response reader，依實際 response stream bytes 計數，不信任 Content-Length。JSON 在 byte cap 後解析並檢查 notes 上限；Texture 在解碼後檢查尺寸／像素且超限釋放。依使用者選擇保留所有瀏覽器支援圖片格式，因此不宣稱防止解碼瞬間放大或提供全域 cache 預算。

## v1.1 新增能力

- Text2D 繼承 Sprite，Canvas2D 只負責 rasterization，輸出 Texture 仍走正式 renderer；不用 DOM overlay 假冒文字繪製。Style 固定、內容非同步更新，latest-request-wins 並釋放過期結果；自有貼圖與外部借用貼圖分開管理，字型需使用者預先載入。尺寸／像素在完整 canvas 配置前檢查。
- 上述固定 Text2D style／手動 font readiness 是 v1.1 當時基線；P27 現有 transactional styled text layout與typed FontFace／BMFont assets，P41再批准UI layout／widgets／focus，未驗部分依PLAN記pending。
- SceneTimers 使用同一 Game Clock 的模擬 delta，在 subclass update 前推進；候選 Scene／paused／hidden 時不推進。動態 Set 維持註冊順序，tick 不複製整份 timer 列表；新工作延至下一 tick，repeat 每 tick 至多一次、跳過漏掉的週期。Handle 取消清除 callback 參照，Scene teardown 先銷毀 timers。同步 callback exception 走既有 fatal frame error。
- Pong 的 Text2D／timers 整合不新增 renderer、不加 runtime dependency，不實作物理、文字動畫或編輯器；3D 動畫另屬 P10。既有 v1.0 tag／release 不改動。

## three.js 參考擴充：P09–P12（歷史基線；目前增量見 TECHNICAL）

- Object3D／Group／Mesh 共用 local Transform3D，worldMatrix 依祖先變換組合，worldVisible 包含祖先可見性。Scene 註冊整個子樹，禁止 cycle／跨 Scene ownership；移除解除註冊，destroy 清理子樹。
- Scene 可替換 PerspectiveCamera／OrthographicCamera，提供 lookAt；OrbitControls 只接管指定 Canvas 並需 destroy。Raycaster 使用世界距離精確雙面三角形交點，涵蓋階層、instance 與變形後的 skin。
- GLTFLoader 支援受預算限制的 glTF 2.0／GLB triangles、TRS、材質／textures／skins、morph targets（POSITION／NORMAL、weights animation）與 transform clips；必要 extension、其他 topology 明確拒絕。Morph 為 CPU 端，於 renderer／Raycaster 讀 vertices 前由 `Mesh.updateDeformation()` 重算。GLTFAsset.dispose 由應用負責，Scene 清理不代替 loader-owned textures 的釋放。
- Game 在 timers 後、使用者 update 前推進 scene.animations，使用同一模擬 delta；mixer 依 action 插入順序寫入，不提供 blending。CPU skinning 更新自有 geometry，vertex-only markUpdated 通知 GPU cache，index topology 不可變。
- 此節的「無 blending」是 P10 歷史基線：P34 已支援 order-dependent weighted layers／fade／crossfade／flat state machine；P42 再加入 mask／reference-relative additive／blend tree／two-bone IK、native GPU skinning 與 conservative animated bounds。原 CPU profile 不再是這些批准項的能力上限，限定驗收見 ACCEPTANCE。
- P11 原先僅方向光 shadows／P12 HDR instancing，WebGL2 HDR 需 EXT_color_buffer_float；這是當時基線，P37 現有 point／spot／directional cascades（depth atlas／PCF）、P38 cubemap-input EnvironmentMap／baked reflection probes／FXAA／SSAO／DOF，P39 bounded glTF PBR extensions。EnvironmentMap 仍是 CPU preprocessing 的 equirect radiance／SH／roughness mip，不是 native cube texture／automatic probe capture。
- v1.4 之後的 3D／執行期補強（皆為 additive，細節與驗證範圍見 TECHNICAL）：視錐剔除（保守 bounding sphere，skinned／instanced／morph 不剔除，shadow caster 仍進 shadow pass）、glTF 常用 extension（emissive strength、unlit 近似、texture transform 烘進 UV0、lights_punctual 以 `asset.lights` 回傳）、`scene.fog`、WebGPU 4× MSAA（`Game.create({antialias})`）、半透明由遠到近排序、`scene.effects3D`（重用 PostProcessor2D ABI，只處理 3D 影像）、`FirstPersonControls`（Pointer Lock）、`graphics.stats`，以及由 `ResilientRenderer` 提供的 WebGL2 context／WebGPU device 遺失復原（Game 送出 `graphicslost`／`graphicsrecovered`）。皆無新增 runtime dependency；WebGPU 真實 device loss、實體手把、聽感與其他瀏覽器仍未驗證。
- 上段的「skinned 不剔除／GPU device loss 未驗」是當時基線；目前 P42 以 conservative animated bounds 做 skin culling，並實跑 fixture-only GPUDevice.destroy→正式 recovery，與 uncontrolled driver reset／跨瀏覽器認證仍分開。
- API 是 three.js-inspired，非 drop-in 相容或全部 addons；Canvas2D 仍 2D-only、沒有新增 runtime dependency。當時 package 1.1.0／不自動提交或發佈的紀錄不改寫；目前 metadata 與本輪 P40–P42 提交授權依 PLAN，實測／未驗以 ACCEPTANCE 為準。

## Excalibur 參考擴充：P13–P20 profiles／共用整合已驗收

- P13 擴充既有 GameObject（不是新增 Actor）：mutable local Transform2D 重算 parent-world × local affine matrix，保留 shear／reflection；Group2D 不繪製。visibility 取祖先 AND、opacity／tint 相乘、z 相加；equal-z insertion order，world layer 先於 screen layer。Scene 註冊整個子樹，reparent 保留 local transform；remove 可重用、destroy 遞迴清理 owned children。
- Sprite source 為 bounded positive finite rectangle，可用 fractional pixels；setter snapshot／validation 與換 texture 保持原子。width／height 是自然 source 尺寸，scale 為顯示縮放，不設 displayWidth／displayHeight。SpriteSheet 另限制 immutable integer source frames／grid，不產生 cropped bitmap。GPU／GL instance payload 攜帶 affine axes／source UV／inherited tint；Canvas2D 走相同 source／world matrix。
- FrameAnimation 綁定一 Sprite，Scene 用模擬秒數推進 loop／pingpong／freeze／hide；控制 play／pause／reset／reverse／goToFrame／stop，events 送 animation 與 Sprite，large dt 以 aggregate loop count 避免逐圈 callback。移除停止 Scene 推進，destroy 清除 animation reference。
- SpriteText owns/reuses glyph children、NineSlice owns/reuses panel patches，借 atlas Texture；invalid text／resize先 preflight，小 panel同比壓縮 margins，tile remainder 裁 source。ScreenElement 提供 HUD，不含 P13 當時尚未批准的 layout widgets；P41 現已批准 UI layout／widgets／focus，不再是永久 non-goal。
- P13–P20 當時 profiles／formalrootconsumer／最後工具鏈限定驗收：37files252tests／build-typecheck-lint-format／packedES2022consumer，實際證據見ACCEPTANCE。當時Physics限discrete angular circle／box／convex dynamic-root、particles限CPU pooled local／world；P31增量與P42批准範圍见下節。不推論fullframeparity／性能／crossbrowser；當時不自動commit／push／publish是歷史限制，本輪授權見PLAN。

## P18 preload／native sample audio（限定 Chromium 驗收）

- PreloadBatch 為 EventTarget，unique-key tasks／最多4 concurrent／4096 tasks；progress 依完成 task 數、empty ratio=1，不捏造 byte readiness。Batch 僅 owns cooperative cancellation、不 destroy returned resources。Texture／OPM／sample shared cache 的 subscriber abort 只拒該 caller，loader destroy 才中止 shared fetch；generic text／JSON／binary 非 cache，各 request 可 abort。
- AudioManager.loadSample encoded cache 不提前 decode，SampleAudioAsset.decode／play 需 unlock。Source→perplay gain→sample channel/master buses 使用第一個 OPM context，獨立32-playback budget、不搶八個 OPM slots；vendor 不改，worklet reset 不斷 sample buses。
- SamplePlayback clock 是 AudioContext，不跟 Game pause；pause／resume／seek 換 one-shot source、不重新 decode，舊 ended 不污染新 source。Scene stop nonpersistent／detach persistent；manager destroy 清 sources／cache／buses／late results。Encoded8 MiB；decoded budgets 在 decodeAudioData **完成後**檢查，不防 decoder transient amplification、非 global memory budget。
- Scene 的 protected preload(game,signal) 回 PreloadBatch／void 或相應Promise；準備先等待batch成功才initialize，再原子publish。Game.loading只讀當前candidate barrier，clear以Scene owner檢查，舊candidate晚到finally不能清新loading。Old Scene在準備期間繼續更新，paused不更新；可在pause期間prepare／publish、新Scene等resume才tick。Failure／cancel／destroy中止並清candidate但保留shared loader resources。
- GLTFLoader.task為unique acquisition，batch未完成即failure／cancel會dispose該task owned model／textures，不碰unrelated direct models或shared textures；成功則ownership轉交caller，應在移除consumers後dispose。Custom tasks仍須own failures與配合signal，不宣稱batch通用destroy shared results。
- 修正後worker4檔／35 scoped tests、12 owned files格式及ES2022 Promise.withResolvers禁用的runtime通過；實際Game failure／cancel／supersession／pause／destroy／model ownership與PCM proof見ACCEPTANCE，analyser不是聽見喇叭聲，無新full-suite或其他browser認證。

## P14 interaction 與 camera（限定 Chromium 驗收）

- GameObject 的 lazy ActionQueue 按模擬秒推進 local actions，先於 physics；queue FIFO／sequence overshoot／parallel max duration／repeat fresh state，handle finished 回 completed／cancelled。Callback 以 Scene membership generation／Game continuation 守住remove／readd／destroy／replacement，已失效tick跳postupdate、新generation下frame才續跑；pre／post不是無條件配對。
- Native target-only CustomEvent lifecycle initialize（首次active tick一次）／preupdate／postupdate／add／remove／destroy；沒有bubbling。Passive glyph／tile／pool不因Scene iteration建立queue／未訂閱lifecycle Event。
- Pointer bounded256 samples／32 active views、move coalescing；topmost HUD／world排序、inverse-affine graphics bounds或collider hit、per-pointer capture／parent-inverse drag。Detail screen／world為穩定vectors。Pause／hidden／remove／destroy取消capture／drag，resume不重播stale samples；不是pixel-alpha picking。
- Camera2D lazy controller：move／zoom獨立FIFO、ordered follow／axis／smooth／deadZone／viewport-aware bounds，seeded finite shake只改logical-screen renderOffset。Camera在systems／physics／particles後、render／culling前更新；input先用最近呈現camera。實際Canvasdrag／pause／resume／camera pixels、scoped tests見ACCEPTANCE，不擴為其他browser／FPS聲明。

## P19 renderer capture／P20 native 2D effects

- P20 GPU／GL native管線與P19三backend實際Game原子handoff／pause／resize／Promise completion已限定驗收。Renderer.captureScene重畫整個frame（3D／P12／world 2D／HUD／effects2D，排除transition overlay）到owned target，不advance simulation、不讀延後default WebGL canvas。RenderSnapshot為opaque renderer-owned handle，拒foreign／destroyed／nested active-frame capture；追加actual三backend真native captures已驗presented-effect cancel／async version supersession／listener reentry／held-capture destroy，12captures全釋放。Destroy立即清Scene／captures與停frames，但公共Promise仍等受控native capture回傳才reject，不聲明提前abort該await。
- Material2D／PostProcessor2D caller-owned descriptor有immutable native WGSL／GLSL sources、65536 chars／language、16 Float32 uniform slots；await graphics.prepareMaterial／preparePostProcessor後才render。固定effect(color,uv,screen)回premultiplied RGBA，uniformValue讀four vec4，post sampleInput用top-left normalized UV。沒有transpiler／IR／任意shader resources；Canvas2D明確UnsupportedGraphicsError。
- Stage：transparent 2D world＋HUD→ordered ping-pong post→composite over unchanged 3D／P12 HDR→whole-frame transition。Source UV／inherited tint／opacity／stable z保留，material只改attached Sprite。
- 核准lifetime：viewport-independent prepared native pipelines／programs＋uniform resources跨resize／disable保留至descriptor destroy，無surprise async reprepare；mutable 2D／transition attachments在resize／disable釋放。Immutable snapshots跨Scene／Texture destruction及resize存活並scale，完成／cancel／explicit destroy／loss／renderer destroy才釋放。Descriptor destroy同步清該prepared entry；loss／renderer destroy清全部。Scene／Sprite借descriptor，caller移除consumers後destroy。
- 真實GPU／GLuniform pixels、post order／top-left sampling、GPUHDR不變／capturecrossfade、20cycles stable counts與teardown zero見ACCEPTANCE；不宣稱整張framebuffer parity／全suite或cross-browser。

## P15–P17 world profile（歷史限定 Chromium 三 backend 驗收）

- Scene owns PhysicsWorld2D，GameObject body／collider setters與階層registration共用existing ownership。Fixed-step sweep broadphase／circle-convex narrowphase／iterative restitution＋friction＋angular impulse，不是AABB signflip；dynamic worldroot、nested static、circle uniform absolute worldscale。Shape snapshots、stable contact payload／precollision cancelResponse只當step；callback teardown守住surviving contact end。Catch-up cap記droppedTime，高速tunneling明示，無CCD／joints／sleep／concave／3D。
- 上述無 CCD／joints／sleep／concave 是 P15 當時範圍。P31 已有 dynamic translation→static CCD（不 sweep rotation／dynamic pairs）、sleep／五種 joints、static concave凸分割／thick chains；仍無 dynamic concave／compound／kinematic／3D solver。P42 另批准 3D colliders／queries／character／dynamic rigid bodies、navigation／pathfinding，不能依舊排除項省略。
- TileMap／IsometricMap extends Group2D，immutable tile snapshots／preflight atomic edits，Sprite pool借atlas、不複製texture；orthbox／isodiamond／customconvex solid owners共用physics。Transformed conservative viewportcull只改renderEnabled、不移除solids。TileToWorld用cell elevation、worldToTile只zero-plane inverse、pickTile挑elevated topmost graphicrectangle。無editor format importer／navigation。
- TileMap navigation 是當時排除項；P42 已批准 navigation／pathfinding，editor importer／hex／staggered 等其餘既有排除項不變。
- ParticleEmitter固定CPU pool，seeded nozzle／fractional rate／burst、analytic acceleration／size／color；capacity dropnew無backlog。Local承emittertransform，world保持birthaffine axes／velocity／acceleration，新birth採新parent。Stop不清survivors、clear重用、pause凍age、destroy owned children不destroy borrowedTexture；simulation space與HUD render space分開。無GPU simulation。
- 實際3backend48pixel assertions／21screenshots／0errors、3files40tests與ownedformat見ACCEPTANCE；source-Vite／proceduralatlas／test-onlyGPU COPY_SRC，不claimdist／其他browser／FPS。
- 正式gameplay2d三backend以rootexports實際exercisegraphics／drag-actions-camera／physics-maps-particles／OPM-PCM-PNG preload／native八contexts／pause-cancel-transitions／GPU-GL effects與Canvasexplicitreject／teardown。Packed325entries的rootruntime actions／camera／preload在Promise.withResolvers不可用時通過，strictisolatedES2022declarationconsumer通過，14vendorfilesbyteidentical。另有真正extracted-pack plain-static-HTTP三backendGame actions／GPU-GL native materials-or-Canvasreject／trusted8-context PCM browser proof；只該consumer路徑、不擴成全部gameplay2d的dist-browser／driver-memory認證。

## P21–P29 PixiJS-inspired 2D expansion（已批准，已整合，限定環境已測）

比較基準為 [PixiJS stable v8.21.0](https://github.com/pixijs/pixijs/releases/tag/v8.21.0)、commit `ecd3797cf9b57766b045f3eea8388db9677744f8`；不承諾 full Pixi parity。實作已整合，逐項觀察結果與未驗項見 ACCEPTANCE；不把 P13–P20 的 252 tests 當本輪驗收。

### P21 source foundation（限定三 backend 實跑 gate）

- Transform2D 增 pixel pivot／radian skew，Matrix3 axes採 rotation+skew.y 與 rotation-skew.x，translation扣axes×pivot；zero pivot／skew保留原compose。Position／scale／pivot／skew仍mutable vectors，每次world update重compose，不能用忽略直接vector mutation的dirty cache。Sprite normalized anchor獨立於pivot；自然width／height契約不改。
- GameObject.toWorld／toLocal操作logical Scene world，不包含Camera2D；HUD同樣不把screen→camera轉換混入。Output參數可重用且point alias-safe；singular matrix明確RangeError。getWorldBounds以local-bounds四角轉換回conservative world AABB，不宣稱pixel／triangle bounds。
- `packages/graphics/src/render2d-contract.ts` 的 sole `collectRenderCommands2D`／`RenderCommandBuffer2D` 已取代 sprite-only collector，GPU／GL／Canvas 採同一 stream；可重用 records 在 clear 時釋 old object references。普通物件仍 flat Scene registration、world 前 screen、inherited global z＋equal-z insertion order，不是 Pixi depth-first ordering。Integration owner 已回報三 backend Game ordering／mutable pivot pixels、native capture teardown、round-trip／singular rejection與 trusted Canvas skew-parent drag；見 ACCEPTANCE，非整合工具鏈／全部新 commands 驗收。
- WebGPU 的 2D 已由 `webgpu-render2d.ts` 的 native command engine 取代舊 sprite-only pipeline：sprites／tiling／meshes／particles 用共用 quad／mesh pipeline，isolated groups 用 renderer-owned rgba8unorm targets，mask、五種 filter 與 blend 在 local pass 完成，最後才 premultiplied composite 到 3D 之上。Command 錄製期間釋放的 GPU 資源延到 submit 後才 destroy，避免作廢已錄製 command buffer。

### 後續已批准 integration 契約

- Texture2DSource明確區分 immutable ImageBitmap Texture、required owned CanvasTexture2D versioned snapshot與renderer-bound RenderTexture2D；TextureView2D只借source，immutable frame／orig／trim／0-90 clockwise／resolution／anchor／borders。Source cache與views分離，source version改才refresh uploads；不得fake render target.image或destroy borrowed source。Typed atlas／font acquisition failure只清unique-owned pages。
- Graphics2D沿Text2D raster→Texture正式三backend路徑；immutable shared CPU instructions不是shared native GraphicsContext。Centered stroke／curves／hole／gradient／local pattern及bounded resolution，transactional latest-wins；不做GPU tessellation／fullSVG／world pattern／pixelLine。
- Opt-in IsolatedGroup2D才有one outer z slot、sorted inner commands、mask／filter／blend／cache boundaries，普通Group維持global flat z。Offscreen target範圍／depth／pixels先preflight；cache顯式invalidated，cached child仍simulate。RenderToTexture不advance Clock/input/timers，拒foreign／feedback／recursion；extract/generate output independently owned，不改P19 immutable snapshot。
- Stage固定：unchanged 3D/P12→transparent world＋HUD with isolation/masks/native filters/basic blends→existing Scene.effects2D→composite→P19 final transition。Erase是2D-only destination-out；不擦3D／P12／P19。GPU／GL五native filters與Mesh2D／true projective quad；Canvas native filters／visibleMesh明確UnsupportedGraphicsError、不switch、不software shader/rasterizer。
- Mask rectangle/path picking含declared holes；image-mask input僅transformed source bounds，不讀alpha／red。Alpha預設與Pixi red預設不同，是明確本引擎API。P28 eventPropagation target default保P14，hierarchy capture-target-bubble才opt-in；path snapshot＋membership guards，不把native bubbles當scene tree propagation。Accessibility只有semantic DOM ownership/focus，不假冒視覺render。
- Required FontFace／proportional multipage text-JSON BMFont／RGBA atlasgeneration／styledText與manifest重用現有SpriteFont／Text2D／PreloadBatch，不另建renderer／cache singleton。Required ParticleLayer fixed capacity/dropnew、versioned static setters／dynamic mask重用P17 simulation；prepareTextures／native unload不destroy CPU source。Central rendering2d limits集中於src/data，不把fixtures尺寸當implementationbudgets。

### 歷史發佈與驗收界線

GitHub v1.2維持exact source commit `299afe29713b71dca2d120d3a4452812208c3c27`（historical source package1.1.0）；external release asset `xyz.js-1.2.0.tgz`內metadata1.2.0，323codefiles byte-identical，Pixi working changes不在release。實際asset SHA與修正事實見ACCEPTANCE；不改上述歷史localpack／252證據。當時未授權version／license／deps／git／release變更是歷史紀錄，本輪staged commits依PLAN、不授權push／publish／version change。

## Weighted 3D transparency

Scene 的 `transparency` 預設 sorted；weighted 路徑把透明 mesh 與 opaque／MASK
分開。PBR alphaMode 為準，TextureMaterial 的 opacity 或 transparent flag 決定分類。
WebGPU 使用 MRT 加權累積／revealage，WebGL2 分兩次 draw，均測 opaque depth
且不寫透明 depth。先合成 HDR，再做 post／effects3D／2D／transition；
transmission 仍只看 opaque snapshot。WebGPU 保留 MSAA，WebGL2 離屏單取樣並
要求 float color attachment。這是 bounded-weight 近似，不是 depth peeling。
尺寸相關 targets 隨 resize、停用／無 Scene、destroy 清理，prepared pipeline 保留。

## P40–P42 已限定驗收

使用者批准三輪及 P42 全部 advanced options；由主代理在各輪行為證據與整合驗收後分階段提交，不 push／publish／version change。上述歷史提交限制不覆蓋此授權，歷史 release／counts／dates 不改寫。

- **P40 batching**：維持 sole `collectRenderCommands2D`、ordinary global stable z／equal-z insertion order／world→HUD；只合併相鄰相容 commands，不以 texture sorting 偷換 ordering。Native material／sampler／blend／target 與 isolation／mask／filter／mesh boundaries 維持語意，native ABI、P19 immutable capture、3D HDR／MSAA／OIT stage 不變。Canvas2D 仍走 native paint，不假裝 GPU instancing。
- **P40 metrics**：`RenderStats` 由每 backend 的 `FrameStats` 持有、重用；`drawCalls`／`triangles`／`shadowDrawCalls` 保持 3D 定義。每幀 `drawCalls2D`／`instances2D`／`renderPasses2D`／`uploadBytes` 記實際 native commands／effect composition／uploads；`renderTargetBytes`／`peakRenderTargetBytes` 是 live／renderer lifetime peak attachments bytes 估計，begin 不清除。Canvas2D 記 paint commands／passes 與 RGBA offscreen estimates，不是 GPU draw-call parity。Loss／destroy 釋 owned targets；CPU estimates 不是 GPU timer、driver／總 resident memory／GC，不能據此聲稱 FPS 改善。
- **P40 browser gate**：深度 pixels／interaction／lifecycle／target teardown regression 走真 Game→Scene→Renderer；CI 定義與 CI 實跑區分，未實跑 browser 明確記 pending，不以舊 Chromium scope 宣稱跨 browser 認證。
  P40 已有三 backend Chromium 153 pixels／lifecycle／target accounting 證據，詳見 ACCEPTANCE；hosted CI 尚未執行，WebGPU device-loss injection 與其他 browser 未驗。
  v1.9 的 Linux launcher 同時選 ANGLE／Dawn／compositor 的 SwiftShader；compositor 以 Vulkan backing 支援 WebGPU canvas swap buffers。隔離 Ubuntu 24.04 arm64 已重現並修正缺 backing 的失敗，required 三 backend pixels／lifecycle 通過；hosted Ubuntu x64 修正仍待驗，不改正式 renderer／recovery 契約。
- **P41 authoring／device contracts（限定 Chromium 三 backend 驗收）**：`UIRoot(game?, UILayout)`／`UIElement` 提供 row／column／overlay、auto／fill／固定尺寸與 bounded min／max／padding／gap／align／justify；async UILabel／UIButton／UICheckbox／UISlider visuals 走既有 HUD renderer，unit raster 重用。DOM 只 semantics／focus，context 只 live semantic focus／modal 啟用；focus／move／pushModal／popModal trap／restore，widget pointer source 同幀 reconcile。Contexts 初始 inactive，priority／最新 activation 消耗 physical sources 與 legacy actions，不改 raw polling；held activation／unblock 不形成新 press，gamepadIndex 是 actual browser index。實際 touch injection 與模擬 Gamepad snapshots 不是實體裝置認證，詳見 ACCEPTANCE。
- **P41 residency／warmup**：decoded CPU texture 與 native texture／geometry bytes 獨立預算估算；acquireTexture lease 與 legacy loadTexture pin 管 CPU ownership，native LRU 只淘汰 idle／未 active／未 retained allocations。Canvas native residency 為零，caller bitmaps／derivedCanvas／attachments／scratch／driver／pipelines 不在預算內。Warmup dependency snapshot 按 RAF chunks 限 items／資源間 milliseconds，單項可超時；舊 scene prelude 保護舊 frame 且不計 candidate progress，combined budget 不足拒 candidate，setScene candidate retain 到 scene lifetime，manual lease 需 release。
- **P41 typed authoring**：FactoryRegistry／defineFactory 使用 explicit options parser／注入 services，fresh detached owned prefab subtree；context.own 在 fallible await 前，borrowed resources 保持 caller-owned。parseContentScene／buildContentScene 對 version-1 finite JSON IDs／parents／reference aliases 全 preflight，產 new unpublished Scene，再由 Game.setScene 發布；content.get／require typed lookup，serializer 只 explicit 2D IDs，不含 reflection／eval／automatic resource ownership／3D serialization。正式 [authoring-lab](examples/authoring-lab/) 沿 root facade，詳見雙語 USAGE／TECHNICAL。
- **P42 full playable reference**：真正可完成與重玩的載入／選單／遊玩／pause／settings／結果／restart／save-load／teardown flow，包含 native input／audio unlock／failure handling。不是只把 API demos 串成 gallery。
- **P42 全部 advanced profiles**：GPU skinning＋animated bounds 需保持 rendering／shadows／picking 一致；native compressed／mip texture 格式需明示 device feature／GL extension、level/block validation、ownership／loss reupload，外部 Basis／Draco codec 不冒稱內建。3D colliders／queries／character＋dynamic rigid bodies 必須有真正接觸／query／motion 行為；navigation／pathfinding 必須計算並執行路徑；animation masks／additive／blend tree／IK 必須接既有 mixer 的 simulation lifecycle。具體新 API 由實作後記入 TECHNICAL，backend restrictions 不能隱性縮減已批准範圍。
- **P42 CPU profiles（已限定驗收）**：Scene owns PhysicsWorld3D，Object3D attachment／hierarchy validation transaction；Game after-update 依序 2D／3D fixed-step physics→particles→camera。Primitive sphere／OBB／capsule／two-sided plane manifold＋linear／angular impulse／sleep；upright unit root character 借 world，caller gravity／jump，結果重用。World.enabled／animations.paused 讓 gameplay freeze 而 Game HUD 仍推進；不等於 Game.pause。Weighted finite grid／immutable authored graph A*，follower 透過真 character.move、blocked explicit resume，非自動 navmesh。Mixer explicit mask／reference-relative additive overlays 在下次 sample 前 restore base；synchronized 1D／triangulated 2D tree、post-sampling direct two-bone IK；borrow targets，clear／destroy 不接管它們。限制與實跑數據見 TECHNICAL／ACCEPTANCE。

Current loader 支援 `COLOR_0`（float／normalized unsigned VEC3／VEC4，含 alpha）、拒 `COLOR_1`，meshopt 內建、Draco 外部注入。P42 的 `nativeTextures:true`／`decodeKTX2Native` 保留全部 supplied mips；RGBA8／BC／ETC2-EAC／ASTC native payload 以 exact block layout／byte budget 驗證，Basis／其他編碼需 `ktx2NativeTranscoder`。GPU feature／GL extension 決定可用格式，Canvas2D 明確拒 native payload；原 ordinary RGBA8 decode 仍預設，不捏造 decoded image。

- **P42 native render**：SkinnedMesh 的 immutable influence streams／morphed bind pose 走 GPU／GL color 與 shadow pipelines；joint palette changed-only upload、transformed influence boxes union 產 conservative animated sphere，Raycaster／updateSkin 另按需更新 exact CPU mirror。Joint-only motion 不重算所有 vertices，CPU morph、picker 的成本分開；renderer cache allocations 各自納入 residency、loss 從活著的 CPU sources 重建，不聲稱全 driver memory／FPS 改善。
- **P42 reference**：[Beacon Run](examples/beacon-run/) 是 root Game consumer，retained canvas UI、capsule controller／動態 crates／authored patrol graph、mask-additive-tree-IK skin animation、native mips、official OPM 與 validated local save；Canvas2D 顯示 3D unsupported，不做假 3D fallback。實際 flow／backend 證據記於 ACCEPTANCE。

## 本輪 P43–P57 production closure

完整批准範圍與逐功能 commit gates 見 PLAN；package／vendor／歷史 tags 不变，不 push／publish。新能力須走現有 Game／Scene／公開 root facade，不建立第二套 physics／renderer／content convention。

- **P43 時間：** Scene 可配置 fixed gameplay timing；frame／fixed force impulse 分開計時，兩 physics worlds 保持各自 step size，catch-up cap 不憑空保留 discarded force。Game presentation 才啟用 moving-body matrix interpolation，authoritative transform／query 不被暫時改寫，默認關閉以保持既有呈現契約。
- **導航：** 同步與 incremental jobs 共用同一 `A*`；owner 限 workspace 數，revision edits invalidate pending jobs。動態 follower 使用 authored anchors／agent radius，不宣稱自動 navmesh／nearest-node projection；物理阻擋只在該 route 排除 connection，replan 有有限 expansion／retry budget。
- **UI：** 原生透明 input 只負責 editing／IME／selection／focus，視覺仍 canvas。UIElement 可承載 borrowed masks，未啟用 isolation 時維持普通 ordering；scroll 的 clipping 必須同時約束 renderer／pointer／semantic coverage。虛擬列表維持 keyed identity、有限 mounted／pooled rows，focus reveal 不能用 mounted-all 假虛擬化。

此節描述新設計契約，通過與限制仍只由 ACCEPTANCE 的實跑紀錄決定。

## v1.10 production engine 擴充（1.10.0）

P58–P70 依使用者授權分功能提交後納入 **v1.10／1.10.0**；GitHub 發佈由既有 CI gate 控制，不做 npm publish，不改寫歷史 release／dates／counts。精確 APIs 見 [TECHNICAL](docs/TECHNICAL.md#58-production-contracts-v110)／[中文](docs/TECHNICAL-zh.md#58-production-契約v110)，實測與未驗限制只以 ACCEPTANCE 為準。

- **Ownership／publication：** Game-local ResourcePool 沿既有 loader/cache；ResourceScope／Lease 以 request identity 共用 acquisition、owned／borrowed 明確區分。Context.own 在 fallible await 前登記，abort／late results 可 rollback；consumer detach 必須先成功才 release resource，失敗保留供 retry，不 dispose live borrower。Content candidate scope fresh／forked，由 owned Scene／subtree 接管；fresh rebuild→Game.setScene 才 atomic publish，legacy in-place Serializer.restore 不宣稱 transaction。
- **Startup／quota／observability：** Lazy Scene subsystems 不因讀 stats 初始化。NavigationScheduler 為全 Scene owner-fair admission／round-robin work quota，非 per-NPC budget；CPU milliseconds 僅 cooperative observation，非 preemption。Spatial 保留 O(N) mutable-pose checks，僅 geometry refresh/refit changed-only。Bounded opt-in GPU queries 的 unsupported／pending／invalid 結果 nullable，不偽裝零；heap／GC／RSS／VSZ／native GPU timestamps 分開，RSS 非 VRAM、RAF 非 presentation completion，不宣稱 FPS 提升或 microengine。
- **Assets：** Pinned external Basis2.50／Draco1.5.7，explicit sRGB／normal／alpha mip semantics，BC7／ETC2RGBA8／ASTC4×4／universal Basis＋RGBA／PNG、compressed＋expanded glTF。Typed Draco accessors 含 componentType／normalized，保留 raw/logical 差異；adapter UINT32 proof 非全 consumer 32-bit precision。V2 runtime descriptor 與 authoring AssetManifest 不同，按 availability 選 ordered variant；decode／hash／fetch failure fatal，不靜默 fallback。Trusted manifest pin 為 integrity，非 signatures。
- **Physics：** 3D controller 借 support-local anchor、swept carry／yaw／epoch，blocked/crush／detach 原因明示；crouch 保 feet／radius，blocked stand 不穿 ceiling。Distance spring／ball-socket cone-twist／hinge motor-limits 共用 world iterative 線角 impulse lifecycle。Dynamic/angular CCD 包含 relative dynamic pairs／kinematic targets，exhaustion 只保 proven-free prefix、不捏造 contact；moving mesh／sensor TOI／deformation 仍排除。既有 2D translation-only profile 不被錯誤擴充。
- **Navigation／text：** Collision bake 是 explicit bounds／mapping 的 sampled topmost single-layer lattice，非 polygon／multilayer navmesh。Revision invalidate／completed output atomic publish。Browser bidi／grapheme／fallback-font geometry 與 transparent native editor 協作，offsets 仍 UTF-16；Text3D native fillText 限制維持，不以 synthetic composition 證明 OS IME。
- **Audio：** Native per-context biquad／compressor／convolution effects、activity/release-tail ducking／overlap、absolute AudioContext automation／cancel-hold。Prepared impulse owns immutable PCM copy、borrowed world object 不 destroy；binding teardown 預設 stop emitter。Game pause 不等 native audio pause，native clock pause 才凍 automation。Analyser／trusted unlock 不等 physical speaker certification。

Desktop Chromium／Firefox／managed WebKit 與 mobile emulation 證據不得擴寫成 native Safari／physical mobile／gamepad／OS IME 認證；不干預使用者 Safari 或 foreign drivers。要求一小時／simulated low-tier 不等已量測，最新完成窗口與硬體限制由 ACCEPTANCE 記錄。

根 index 與 examples index 共用 `examples/index.ts` metadata／module-relative URL resolution 與 CSS，不複製兩份 catalog；v1.10 當時為 35 個 demos，本輪增至 45 個，directory URL 直接執行。3D 僅 GPU／GL，forced unsupported 必須明示。多語樣本是資料，不是 authored UI／comments 的語言。Package 最低 Node22 與 repository tools 的要求分開；目前工作工具採 Node >=26／pnpm12.6.0，asset recipe26.7.0是獨立 reproducibility pin。CI 的三 Node×三 engines 與既有 macOS gate 不等 hosted runtime 證據。

v1.10 的 GitHub Release run 36966119517 已通過全部 14 jobs，含 Ubuntu x64 三 Node×三 engines 與 macOS WebKit gate；下載附件 checksum／本機 consumer 封裝 identity 已確認。上文舊階段的 hosted 待驗敘述是當時限制，新 hosted 證據詳見 ACCEPTANCE；這不改變 Safari／實機／driver、無效 GPU timestamp 或 WebKit 並行 audio stress 的能力邊界。

## P71–P87 integration 邊界（已實作、限定 native 證據）

完整範圍與可觀察 gates 見 PLAN。維持單一 Game／Scene、公開 root facade、內部 ECS、正式三 backend 及官方 OPM；不建立第二套 physics／animation／assets cache／renderer。

- **可靠性：** Audio 仍使用原生 per-context clock；真播放錯誤不可被 retry／suppression 掩蓋。存檔的 durable write ordering／跨頁 coordination 與 fresh Scene publication 是不同交易邊界；原 payload、schema migration 與 consumer error 必須保持可觀察。
- **玩法：** 2D kinematic／controller／CCD 沿既有 world ownership 與 iterative solver；fixed locomotion 借用獨立 mixer／controller，不重複推進 Scene mixer。多層 bake 仍使用共用 scheduler 與 revision guards，不把 sampled lattice 改名 polygon navmesh。
- **規模化：** Visibility／LOD／HLOD／occlusion 不可刪除仍需 shadow 的物件或以舊遮擋結果漏畫。公開 mutable pose 的正確性優先於 dirty-cache 宣稱。Streaming 沿 ResourcePool／scope 與既有內容／物理／導航清理；workers 必須真正執行於 native worker。
- **原生圖形：** 自訂 3D material、有效選光與 GPU particles 接既有 GPU／GL 管線及 loss／residency／cleanup；Canvas2D 對不可支援能力明確拒絕。Vertex／surface shader 不等於 fullscreen post，也不建立 Shader IR／transpiler。
- **交付：** Starters 是独立套件 consumer，不引用引擎内部 source。Tiled 匯入選明確有限 profile，unsupported 必須定位報錯。Accessibility visuals 仍由引擎繪製，DOM 只語意／editing／focus。
- **證據：** Platform／driver／輔具認證、browser emulation、native GPU timing 與 consumer workload 各自有 provenance；不可用其中一項替代另一項。無設備／無安全授權具名 blocked，不能編造 certification。

### 本輪具體生命週期與有限 profile

- **Audio／save：** Stream loading 可先 `autoplay:false`，可信 gesture 直接啟動；pause／stop／cancel 能 supersede startup。驗收等待原本發出的 native resume promises，cleanup 後再次檢查錯誤，不隱藏晚到失敗。SaveManager revision／CAS 以 native IndexedDB transaction 或 LocalStorage Web Locks 協調，後者不宣稱 crash atomic；recovery 只讀，explicit restore 才封存 corrupt 原 bytes／恢復 backup。Autosave owner 必須 destroy，stale／failed write 不靜默週期重試。
- **Motion／navigation：** 2D controller 在 fixed epoch 消耗一次 support carry，借 world/body 不取代 solver；relative dynamic/angular CCD 以有限 work budget 保留 proven-free prefix。Locomotion 使用 Scene-owned 獨立 fixed mixer，fade revival 清除已過期 successor，root motion 不重複累積。Navigation 以有限 support slots 保留同 XZ 多樓面；explicit lift links 必須真正執行 traversal handler。地面微小負高度容差只適用已證明 support 的 route，不讓角色穿牆。
- **Visibility：** Indexed visible draws、screen-size complementary LOD／HLOD 與 conservative instance/morph bounds 保留完整 shadow casters／picking。Occlusion 只用 matching camera／occluder／target 狀態的原生深度 query；pending 或 stale proof 不隱藏物件。Borrowed textures 不隨 proxy replacement dispose，mutable pose checks 不冒稱 changed-only O(1)。
- **Graphics：** NativeMaterial3D 提供 WGSL／GLSL vertex/surface ABI，compile 失敗不能 publication；native loss 後同 backend 重建。Point／spot Scene pools 各1024，每 draw 各32，shadow 預算各8與有限 reach 分開。GPU particles 的 CPU 只管理 bounded births／time／ownership，native vertex shader 計算運動，不宣稱 compute simulation／CPU particle colliders。
- **Streaming／workers：** World cells 共用 bounded admission、detached candidate scope 與 atomic Scene membership；取消後 late reservations 至 settlement 才釋放。Native worker default module URL 隨完整 dist 部署；轉移輸入即 detached，未發布 native payload 必須 reclamation，geometry publication 的 validate/interleave/copy 另外計價。
- **Canvas／import：** P83當時的Tiled profile僅 finite orthogonal JSON／atlas／GID transforms／tile及object colliders；P91擴充範圍見下節，其他未知profile仍精確拒絕，範例尊重forced backend。Canvas full untinted texture frames直接借既有versioned snapshot，避免每sprite重畫shared scratch；tinted／cropped／rotated／flipped view保留原像素路徑，不新增texture cache或改ownership。
- **Measurement／accessibility：** WebGPU 實測 actual native pass-sum，不含 queue／gaps／presentation，也不以 RAF 當 GPU completion。固定品質 workload 量測 steady 與 overlapping asset load；live screenshot 在 warmup、Game.destroy 前取得，避免以已清空 GPU canvas 當視覺證據。Accessibility preferences 同步真 canvas text／contrast／motion；DOM 僅 semantic focus/modal/live announcement，真 OS 輔具證據另列 blocked。

套件／site 只交付 canonical 14 件 immutable OPM vendor；source/dist/site 中既有額外編號副本屬使用者資料，不刪除。獨立 consumer 必須保留完整 engine/dist/vendor/workers，不能只複製入口 bundle。完整實作不等 release 或全平台驗收；歷史與最新限定證據及外部 blockers 由 ACCEPTANCE 分開記錄。

## P88–P96 1.x 相容擴充邊界

依使用者選擇保留1.x公開入口與既有implementors；新Renderer capability為optional，
呼叫端明確拒絕缺少能力，不用假的no-op／Canvas 3D替代。舊value／type exports與
consumer編譯由獨立gate守護，不宣稱這等於完整nested-signature相容性認證。

- **Assets／graphics：** Geometry只加optional UV1，舊UV0 layout保留；材質借用maps，
  各map持有immutable UV selection／affine transform。glTF不改共用UV，不截八個skin
  influences；CPU oracle、native color／alpha shadows使用同一正式資料。Shader hooks
  沿既有固定WGSL／GLSL ABI，prepare檢查真device limits與active resources，不建Shader IR。
- **Tiled：** Native bounded gzip／zlib與raw base64沿AssetLoader cancellation／budgets；
  infinite sparse chunks、nested groups、repeat/parallax images、Scene-owned animation與
  object templates接原TiledContent／ResourcePool。Display／collider edits同一交易，
  pause與scope cleanup不另建clock/cache/physics。
- **Navigation：** 新authored convex polygon surface是獨立真mesh profile，不把舊sampled
  lattice改名。Partitioned graphs仍snapshot既有bakes，加explicit certified seams；
  sparse projection/search與reconstruction/smoothing皆守共用scheduler work。Follower沿
  capsule collision與真正special-link traversal，geometry revisions不可沿用舊route。
- **Visibility／shadows：** 保留raw mutable-pose correctness與完整casters；只消除未變的
  BVH refits／instance filtering／重複CPU工作。整atlas cache用完整tracked snapshots，
  不用碰撞hash；native hooks預設dynamic，tracked為明示promise。Overlap／slope／point
  seams接現有GPU／GL shadow pipeline，resize／loss/recovery退場舊cache。
- **Settings／save：** SettingsManager組合既有preferences／InputContexts／SaveManager，
  不建立第二套bindings格式或storage。Portable file先bounded read、migration、fresh
  disposable candidate validation，再CAS；durablewrite與fresh Scene publication仍是
  兩個transaction，invalid/import-conflict不污染live world。
- **Deployment：** Starter是fresh archive獨立consumer；opt-in offline generator保存
  complete versioned public tree、hash／MIME驗證、原CSP header、atomic install及上一代rollback。
  不cache credentials/private responses，不force mixed-generation activation，
  uninstall只清owned worker/cache，不清player saves／其他origin data，不修改official vendor。
- **Evidence：** CI配置接actual site／muted native audio／production／fresh-pack gameplay；
  hosted執行結果另記，不以YAML當PASS。Quality／CDP pressure與physical hardware分開；
  RAF／CPU／nullable native-pass GPU time／memory分開，hang guard不是FPS承諾。
  Offline worklet證據依真module/node lifecycle與manifest responses，不依漏訊號的page-network counts。

實際驗收、failed-before／passed-after與日期見ACCEPTANCE；所有physical／audible／OS／
Safari／driver限制保持具名，不由desktop automation或模擬profile解除。

### v1.12.0 release verification scheduling

Site smoke以sorted source index modulo的1-based `--shard index/count`（count≤32）分配example；每個example保留全部既有backend cases，filters在assignment之後套用。每shard獨立server／owned muted Chromium／output，完整驗catalogue及links，report保留available／planned／completed／exercised stable IDs；empty、blocked-only或incomplete不能PASS。CI四個必要macOS／Metal jobs並行，production baseline／installed starter在另一macOS job，不與site browser爭同一runner；native audio保留原Linux／PulseAudio環境與精度assertion，獨立必要job。既有Linux三engine regression仍保留；此排程不是multi-thread renderer或跨平台FPS保證。Starter collection driver用真實held keys到公開HUD collection狀態，保留authored-clock bound／wall watchdog及其後自然90秒玩法。

v1.12.1 mixer保留已生效且target／tau未變的single-target native duck curve，ownership重疊不重複cancel／retarget；新future target仍追加在原curve，已有future plan／tau或target改變則重建captured-clock排程。Portable-settings remap以可信KeyL到一個HUD gameplay second，再pause並驗正式download checkpoint位移，不以固定350ms wall hold假定幀數。Native reference tolerance、contexts與workload不縮減。

## P97–P103 工程保障與消費端工具邊界

當時 v1.12.2 納入已提交 P97–P103 與官方 OPM.js1.8.0（tag `v1.8`），維持1.x公開契約。既有 v1.12.2／v1.12.3 tags 不變；[Release37067932861](https://github.com/YueyuHoshizora/XYZ.js/actions/runs/37067932861) dense2d 功能 PASS／效能 FAIL，v1.12.3 真修正後 CPU frame p9532.5ms，但 [Release37071402430](https://github.com/YueyuHoshizora/XYZ.js/actions/runs/37071402430) 2D／3D／navigation RAF FAIL，兩次未建立 Release。使用者授權調查確認根因、修正、v1.12.4與 main／新 tag 推送，由 CI／Release封裝 GitHub 套件／checksum。[CI37092521565](https://github.com/YueyuHoshizora/XYZ.js/actions/runs/37092521565) Windows三 Node品質／API／negative-smoke／installed CLI、signed endpoint、Firefox全流程 PASS；Chromium WebGL pixels／WebKit pixels與audio仍 FAIL。Hosted五 workload PASS但真失焦 guard FAIL，揭露跨 CDP handler `false` 無法撤銷原 capture；driver 已改 public `noDefaults`／逐 workload 新 default context，本機真失焦 guard PASS，完整 revised hosted qualification仍待執行。原 ceilings／counts不變，額外 loopback transport argv明示 pin；必要 gates通過前不發 v1.12.4 tag／Release。不 npm publish；v1.12.1 baseline、歷史 tags／日期／counts與實體 blockers保留，不新增完整 Windows／實機認證。

- **API 相容（P97）：** Baseline 是已發佈 v1.12.1 archive（SHA256 `a0c2b6ba…`，commit `ee0c1a18…`）的宣告檔 hash；對 root exports 生成雙向 strict callable shadow、constructor／overload／setter write type、generic 約束、implementor／options 與 protected／abstract 義務。原宣告保留 polymorphic `this` 與方法 bivariance，不以全面改寫成 call signature 冒充 strict。完全相同且 relative-import 依賴閉包也相同的宣告才共用 TypeScript identity，任何依賴變更都移出共用集合。這只證明 TypeScript source 相容，timing／ownership／event 行為仍靠實 consumer 與 runtime 證據。
- **效能門檻（P98）：** Calibration 與 certification 是兩個命令；profile 綁 host／GPU／backend／quality／device／launch args 與 workload revision。Loading／steady 的 RAF p95／max／hitch fraction 與 CPU frame／submit 分開，不重試失敗 gate。歷史 revision 3 的 dense sensor workload 沿用既有 O(N²) sweep（當時不宣稱優化），曾將 colliders 由 96 降至 48，因 96 個在當時本 host 約 200ms／frame，無法在 180s bounded deadline 內完成 900 個量測 frames；此為歷史紀錄，不是目前 workload。當前 `productionRegressionWorkload` 為 revision 4／96 colliders，本輪真正效能修正不得縮減此 workload 或放寬既有 gates。
- **Presentation 資格（v1.12.4）：** Profile 明示 pin `headless`／`native-foreground`，缺少或改變 mode 不互換、不自動重校準。Native-foreground 為每個 workload 建立独立 macOS headed browser／profile，透過正式 `connectOverCDP({noDefaults:true})` 只使用 default context，不安裝 focus override；new context 不適用此選項，另一 handler 的 `false` 也無法釋放原 capture。Native spawn／CDP PID、前後 AppKit／normal window、每個 production callback 的真 DOM focus／visibility與 lifecycle都需符合。Ephemeral loopback transport argv明示 pin，timestamps／scheduling flags／counts／budgets不變；缺證據或中斷 FAIL，保留已完成量測。不是連續 OS foreground sampling／GPU presentation completion／實機認證。
- **Windows WebKit 音訊範圍：** 使用者依真native capability與pinned WebKit `ENABLE_WEB_AUDIO OFF` 原碼批准音訊明示UNSUPPORTED；只有 native Windows／WebKit／secure origin且AudioContext與AudioWorkletNode實測均不存在才適用。API存在則保留原trustedunlock hardassert，其他graphics／input／lifecycle／save／cleanup不減免；WindowsChromium／Firefox及macOSWebKit音訊不改。此限制不採vendorpatch／DSP／LinuxWSL冒充Windows。
- **Dense sensor CPU 修正（v1.12.3）：** 保留 revision 4／96 colliders 與既有 sweep。Collision payload 只在 receiver 曾訂閱該事件或 dispatch 被覆寫時建立；每個 receiver 前重新檢查，保留 callback 中新增 listener、取消 response 與移除／destroy 語意。Observation 沿用保守 sticky Set，once／remove／abort 後不誤判為不可觀察；sensor 不計算不使用的 restitution。CPU／RAF 改善與 hosted gate 結果分別記 ACCEPTANCE，不以配置減少直接宣稱 fps 提升。
- **整合長跑（P99）：** 單一 Scene 同時含 streaming collision、scheduler routes、character、3D rigid bodies、pause、IndexedDB SceneSnapshot、crossfade 與同 backend recovery。Bake 在 candidate 初始化的最後（所有 registration／restore 之後）以 Scene 自己的 scheduler 完成後才發佈，避免被 actor 移動造成的 geometry revision 作廢。Candidate init／warmup 期間暫停 live Game，transition 開始後才 resume。Native 3D recovery 的重 prepare 與 frame 節奏相關，已實測記錄，不當作已優化。
- **資產工具（P100）：** `xyz-assets`／`xyz-build-assets` 為安裝後 CLI；lazy 解析 consumer 自行安裝的 pinned `playwright-core` dev tool（CJS namespace 以 `default` 取得），不新增 runtime dependency。實體 corpus 固定來源與授權於 `tests/fixtures/asset-project/provenance.json`。三個 CLI entry 的 `argv[1]` 與 module URL 同用 native `realpath`，避免 macOS `/var`→`/private/var` 或 Windows 8.3 aliases使 bin 靜默不執行；既有 archive／consumer assertions 不放寬。
- **文件（P101）：** `docs/CURRENT.md` 是目前規範；TypeDoc 版本化 API 由 `docs:api`／`build:site` 生成而不入 archive。歷史文件保留原日期與 counts。
- **套件內容（P102）：** `scripts/package-inventory.json` 明列 approved files；archive 逐檔比對來源 bytes 與 executable flag。唯一語意比對例外是 `package.json`：pnpm 12 發佈時移除 `packageManager` 並重排 key，故與移除該欄位的來源做深度相等，archive 對 archive 仍逐位元組比對。
- **實體資格（P103）：** 工具只做 read-only inventory、blocked evidence form 與 schema／artifact／review 驗證；hash 與 `isTrusted` 不證明實體。缺 owned hardware 或授權的 gate 保持 BLOCKED，不由 emulation 取代。

## P104–P118 source expansion (v1.16)

The approved P104–P118 work extends the single root API in package 1.16.0 without
changing runtime dependency policy, backend ownership, or prior release artifacts.
The fifteen functional commits and separate shared integration are authorized for
GitHub v1.16 publication through the existing CI gate; npm remains unpublished.
Runtime acceptance and publication outcomes are recorded separately in ACCEPTANCE.
Source or examples alone are not evidence of execution or platform certification.

- Distribution and production assets: explicit CJS alongside ESM, reviewed exact
  archive inventory, browser-built atlas/bitmap/SDF/MSDF assets, and bounded
  generation-based asset watching. MSDF requires authored polygons; it is not a
  general-purpose font-outline parser.
  CJS and ESM constructor identities are separate; engine objects never cross formats.
- Scene/gameplay systems: latest-wins hot Scene replacement, simulation-clock
  narrative and validated progression, deterministic RNG/pool lifecycle, and bounded
  reciprocal crowd steering that uses the existing character sweep.
- Rendering and media: native GPU/GL 2D normal lighting, versioned video textures,
  WebGPU-only typed compute buffers, explicit DAG render passes, TAA/SSR and
  six-view reflection probes. Canvas2D does not emulate native shading, compute, or
  3D.
  Live maps use additive textureSource/PBR sources/native textureSources overrides,
  preserving legacy Texture getters and borrowed ownership.
- Compatibility graphs: intern only identical normalized declaration dependency
  closures. Optional/concrete additions and unreachable internals do not manufacture
  nominal differences in recursive generic graphs; existing public obligations,
  inherited required members and full public literal values remain checked.
- Physics and text: bounded vehicle forces, ragdoll ownership/blending, spring
  soft-body deformation/contacts, reusable debug lines, and transactional
  canvas-rasterized Text3D updates. Existing instance/morph culling is reused rather
  than duplicated; Text3D is not SDF mesh text.

Each descriptor/resource follows the existing caller/renderer ownership boundaries;
explicit preparation, native-loss recovery, and capability rejection remain visible
API conditions rather than hidden fallback paths. See [CURRENT](docs/CURRENT.md)
for the normative profile bounds and [ACCEPTANCE](ACCEPTANCE.md) for observed
evidence and blockers.

## P119 tangent-space contract

Geometry keeps its eight-float public vertex stride and owns a separate xyz/w
tangent stream. Authored directions normalize without changing the supplied sign;
missing frames use angle-weighted indexed triangles on their selected UV basis.
The separate `generateMikkTangents` uses the unmodified MIT-vendored reference WASM
and splits discontinuous corners into a new Geometry plus a new-to-original vertex
map. Normal-mapped glTF uses it automatically when tangents are missing, preserving
all vertex, morph and four/eight-influence skin channels. Normal vectors use inverse transpose,
tangents use the forward linear transform and orthogonalization, and handedness
includes model/skin determinant signs. CPU skin queries mirror native skinning.
Morph tangents preserve w and reproject when normals change. Identity normal maps
on the Geometry's UV0/UV1 basis use those tangents; different bases, transformed UVs
and native-deformed surfaces retain per-map derivative frames. Base and coat never
borrow one another's UV frames. Native resource caches account for and release
the new stream. Canvas2D remains 2D-only.

The source normal-map Y convention is retained through derivative fallback,
including glTF authored frames and UV transforms, rather than inferred from winding.
Derivative tangent/bitangent products scale with pixel footprint; their normalization
guards only numerical degeneracy (`1e-30` squared length), not `1e-6`, which would
attenuate normal-map XY at ordinary render resolutions. This applies to both base
and clearcoat frames on WebGL2 and WebGPU.

## P120 texture sampler contract

Core owns one lightweight sampler validation module; TextureMaterial handles
base sampling and PBR reuses it for independent map slots without double copies.
Immutable integer anisotropy requests are bounded to 1–16 and reject nearest
combinations above one. Native cache keys and Sprite batches include filtering
identity; GL clamps once against the queried extension ceiling, while WebGPU
cannot expose its effective platform clamp. Public capabilities preserve that
unknown as null and describe Canvas2D's one, not an invented GPU guarantee.

Existing level-zero 2D defaults remain; opt-in gradient sampling uses authored
mips. Normal source/atlas ownership restrictions remain. Packed optical maps
retain their slot budget via bounded principal-axis integration rather than
sampling across flattened native rows. No general mip generation, texture slot
increase, backend cutover or physical qualification is implied.

Mapped anisotropy and iridescence extend that array to five independently
addressed layers: transmission, thickness, anisotropy, iridescence and film
thickness. Core stores borrowed sources/samplers and nanometer bounds in a
WeakMap rather than changing published PBRMaterial shapes. Per-map lazy variant
bits omit unused sampling; loader/exporter/recipe share channel and UV contracts.

## P121 material quality and target ownership

Core owns immutable, bounded PBR specular filtering and MASK-only coverage
requests. Native shaders combine four-point normal-map footprint moments with
surface-normal derivatives in GGX alpha-squared space; strength zero retains old
sampling. Filtering is a bounded spatial approximation, not temporal or
path-traced convergence. Absolute RGB motion and relative contrast are distinct
qualification measures.

Coverage is a genuine native sample mask, not blended alpha masquerading as
MSAA. Opaque/depth-writing coverage draws preserve the engine's clear alpha1 so
HDR/OIT/post do not attenuate them twice. GPU caches bounded coverage variants;
GL owns resize/release-accounted multisample renderbuffers, resolves color/depth
after opaque draws, and retains existing deferred/post/overlay phases.
Probe captures use the same machinery with their own target dimensions.
Actual format/depth sample availability is public; unsupported requests fail.
Shadow cutoffs remain binary. Offline recipe alpha histograms rescale only
completed mip alpha, preserve RGB/base ownership, and disclose quantization and
tied-value limits without introducing slot inference or missing-mip fabrication.

## P122 bounded IBL integration

Environment construction preserves sharp level zero and SH irradiance/pi while
replacing every rough mip with deterministic GGX NDF integration. Raw source
pyramids are temporary; only existing immutable half-float levels are retained.
Source-footprint LOD and a 256-pixel filtered-work width bound CPU cost; output
dimensions and public ownership do not change.

GGX A/B data occupies one renderer-owned 16 KiB uniform buffer, no texture slot.
GPU scene layouts and GL built-in/custom program bindings share it; teardown and
API-loss recovery recreate owned resources. Height-correlated Smith visibility,
stable GGX distribution and bounded multiscattering compensation replace the old
denominator clipping/analytic fit. View-integrated reflectance budgets diffuse,
transmission and the outer clearcoat layer.

Charlie sheen retains its integrated albedo table, attenuates direct base light
using both directions, and samples sharp global/probe atlases through its own
bounded 32-ray kernel. This is normalized spatial quadrature, not converged
multiple-bounce transport, MIS or a reference path tracer.

## Additive asset archive streaming

Byte-offset archives share the existing bounded response reader and SHA-256
bundle verification. Range loading is opt-in through a separate public function,
not a change to directory manifests or ResourcePool ownership. A plain archive
table supplies reviewed member offsets; unsupported HTTP Range falls back to one
bounded load-local snapshot, never an unbounded fetch or silent integrity bypass.

## Animated image asset boundary

GIF/APNG uses WebCodecs ImageDecoder only: unsupported platforms explicitly reject.
The browser codec owns compositing/disposal; assets copy complete frames into bounded
owned snapshots and immediately close codec frames/decoder. A simulation-time clock
drives one stable CanvasTexture2D source without another render loop or Scene registry.
Optional independent atlas snapshots feed the existing borrowed SpriteSheet contract,
not a second sheet/animation architecture. Byte/frame-pixel/dimension limits bound eager
decoding; no container parser, software codec, hidden fallback or dependency is added.

## Profiler and cross-native pixel gate

Profiling is an opt-in renderer-adjacent attachment, not another Game loop or
DOM owner. Disabled collection adds no timing reads or per-frame allocations.
Bounded raw RAF/CPU/GPU windows preserve distinct meanings; unsupported JS
allocation and presentation/throughput measurements stay null. Resource totals
are residency estimates, not physical driver VRAM claims.

Deterministic native parity compares actual forced backend captures without
image alignment. Per-channel mean/p99 and same-backend repeat noise are recorded;
deliberate axis inversion and wrong colour must fail. Disagreements are failures,
not permission to inflate thresholds or imply physical rendering equivalence.

## Bounded world ribbons

Ribbon3D/Trail3D reuse Mesh and Geometry versioned native uploads rather than a
parallel renderer or buffer-lifetime system. Capacity is immutable; a circular
point store bounds history, inactive geometry degenerates, and vertex colors
carry width-independent alpha. Trail samples world positions and therefore uses
an identity root transform. CPU tests establish sampling/geometry behavior;
native rendered acceptance must be recorded separately.

## glTF export snapshot boundary

The additive async root API exports engine scene roots into glTF JSON/binary or
GLB without a second scene model, resource ownership transfer or pose mutation.
Geometry, skin, captured-base morph data, ordinary PBR maps/extensions, explicit
variants/source clips and cameras use their existing engine contracts. Internal
MorphTargets exposes borrowed read-only bind data specifically to avoid reversing
lossy normalized CPU deformation. Default PNG encoding uses real browser canvases;
external URI mapping is explicit because Texture does not retain acquisition URLs.
Unrepresentable native/live/custom state rejects, rather than silently baking or
dropping it. Runtime animation layers, gameplay and renderer settings remain
outside glTF; loader budgets and loader approximation boundaries remain unchanged.

## Mesh feature variant compilation

Keep authored full GLSL/WGSL shader templates as the native/reference path; ordinary
draws compose out disabled physical branches and feature helpers, with stable
material/geometry/scene bit keys and bounded renderer-owned LRU caches. No Shader
IR or runtime dependency is introduced. Async preparation may exploit native
parallel compilation; cold synchronous draws keep the existing completion contract.
The optional instance-aware deformation hook shares color/shadow dispatch and
falls back to legacy deformation when absent.

## 自然世界 source 邊界

Terrain3D 是既有 Group／Mesh／LOD／HLOD 的 bounded local XZ heightfield，
非第二套 terrain renderer；每級 stride／skirts 共用 PBR、shadow、visibility。
heightAt／normalAt 使用 full-resolution local source，raycast 使用 visible world
triangles，不能把兩者當成同一 LOD query。Height edits 明確 markUpdated，physics／
navigation 仍由應用建立。Streaming catalog 沿用 WorldStreamingController、fresh owned
cell roots 與 borrowed geometry／material，限 unparented translation-only source。

TerrainSplatMaterial 在 CPU 靜態 bake linear-light color／normal／packed physical maps，
四個 texture slots 維持既有 budget；不做 live layer painting。Preset owns 生成 maps
與 native material，Terrain／Scene 不接管它。Water3D owns native PBR material、借用 maps，
解析 wave shader 共用 color／shadow 及 conservative bounds；sampleSurface 為 local analytic
query，CPU triangles 保持平面。Crest foam 不宣稱 depth-aware shoreline／planar reflection。

Seeded scatter 建立 tiled native InstancedMesh／VegetationBatch，candidate filters、
distance LOD／coverage fade 沿用正式路徑，不建立 per-blade objects 或外部依賴。
Wind material 使用 instance-aware native hook 的 translation phase；application 明確
提供 absolute simulation time，water update 則用 delta。GPU sway 不改 CPU queries。
Foliage root owns children、借用 geometry／material／maps；shared resources 最後由 caller
釋放。Trail3D 沿用 dynamic Geometry upload，要求 unparented identity world-coordinate root。
Canvas2D 保持 2D-only；world-nature／stress workload 不是 browser／FPS 驗收，
詳細 API 見 TECHNICAL 雙語版，實測只在 ACCEPTANCE／CURRENT 記錄。

## P135 deterministic rendering oracle

Reference scenes retain real engine/resource paths instead of emulating a BRDF.
Pixel parity and numeric golden summaries are separate checks: backend agreement
alone cannot detect a shared regression, while summaries alone cannot certify
per-pixel alignment. A rendered material perturbation validates golden rejection.
Golden regeneration is explicit and measured; no binary image baseline or
physical-material qualification is inferred from deterministic local results.

## P136 ownership and qualification

Lifecycle assertions run combined real resource consumers on one persistent
renderer, rather than resetting the renderer to hide stale allocations.
CPU geometry ownership uses explicit native unload; owned texture/volume/capture
destruction and empty-frame retirement are separate from consumer destruction.
Actual WebGL loss/replay is tested while resources are live. Counter scope is
tracked native resource estimates, not process RSS or driver VRAM; unavailable
physical-device qualification remains BLOCKED.

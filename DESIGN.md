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

`englishbond` 依列交替八個短端磚／四個雙寬長面磚，短端列偏移半格形成英式砌法；預先快取各磚 seeded 色差。水平與垂直接縫距離均換算為列間距單位，避免長面磚灰縫加倍，兩軸 smooth shoulder 相乘保留角落 C1。磚面細粒／骨料噪聲在灰縫歸零，跨列 ownership 切換不留下 seed 色差斷點。0.8 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 410 種。

`rebar` 以圓截面平方根形成四支鋼筋冠部，在垂直切線前乘 compact smooth shoulder，讓鋼筋與軋肋在邊界平滑歸零。十二週期斜向 cosine power 形成軋肋，相鄰鋼筋交替斜向；seeded 細粒不改變冠部／肋頂／暗底層次。全表面含暗底都是金屬，B 通道 255、材質 factor 1。0.12 m tile、四圖 opaque、既有 ownership 不變，目錄增為 411 種。

`starfruit` 以五週期 polar radius 與 compact smooth 邊界形成五角切片，外緣有較深金黃色窄帶，五個預先計算方向的橢圓籽腔沿半徑排列。angular 輪廓及外緣在整個中央區域為常數，不將 atan2 極點帶入高度／色彩；seeded 旋轉完整留在各格內，細粒保留平整果肉及凹籽腔。0.18 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 412 種。

`diamondrustication` 沿用 rounded maximum 保留四面斜坡並平滑中央／對角稜線，僅在凸飾底部使用二次 shoulder，讓凸飾外有獨立平整石框。石框再以兩軸 smooth shoulder 相乘接回灰縫，區分尖頂／平框／灰縫三層。每塊 seeded 色差預先快取，細粒高度不破壞斜坡近似平面及石框平整度。1.6 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 413 種。

`bargello` 將長直針腳的 y phase 依欄位三角階梯偏移四分之一針長，使用四階 yarn tone 形成火焰色帶。針腳兩側及兩端以 compact smooth 支撐接回暗底，隱藏欄位／列 ownership 的離散切換；rounded 橫冠、縱向細纖維與 seeded 細粒保留長直針形。色階不參與高度，避免把色帶另做浮雕。0.064 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 414 種。

`saffiano` 以兩組正反斜向 cosine shoulder 形成細壓槽，smooth union 合併交點而非相加深度。皮面微粒使用 cached 128×128 periodic noise；高度、色彩、粗糙度及 AO 分別保留低暗壓槽與完整平台，不產生金屬菱形滾花凸冠。0.032 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 415 種。

`cocoamat` 快取每根有限彎纖維的位置、方向及曲率，以 3×3 wrapped 鄰域取樣並使用 smooth union 合成圓冠與交點。纖維的 compact 側邊／端部在鄰域切換前歸零，不以 hard max 製造 normal 折痕；cached 96×96 微粒保持高粗糙纖維與低暗底的差異。0.08 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 416 種。

`suminagashi` 對 cached 3×3／7×7 periodic scalar fields 作雙軸 domain warp，再以平滑 cosine 色帶取等值輪廓，形成套疊墨紋。墨色與粗糙度共享 ink 欄位，但高度只由獨立 96×96 細粒／192×8 纖維形成；AO 保持平紙面，不將墨線變成刻痕。0.24 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 417 種；不包含流體模擬。

`vermiculite` 快取交錯排列細長顆粒的方向與層片 phase，以有限橢圓包絡保留離散顆粒。縱向 cosine 平方層脊同時提高、提亮、降低粗糙度並擴張短軸側緣，層隙及顆粒間低暗底分別保留 AO。包絡在 cell 邊界前平滑歸零，cached 96×96 細粒不外溢到暗底。0.06 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 418 種。

`cairotiles` 以正方節點格的左／下邊各放一塊 Cairo 五邊形，奇偶節點鏡射輪廓，產生無洞／無重疊的真正五邊形分割。只快取四種方向的 normalized half-planes 與各磚 seeded 色調；五條 signed-distance shoulder 的乘積提供相同實體寬度的灰縫／倒角，wrapped 鄰域在裁切前歸零。四向直角與三向 120 度接點保持連續。0.8 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 419 種。

`guilloche` 以八次 angular harmonic 彎曲三條同心閉合刻線，compact smooth 槽寬彼此不重疊；所有刻槽離開 polar 中心與 cell 邊界，平面微粒不產生角度奇點。刻槽同時降低高度／色彩／AO 並提高粗糙度，與既有 engine-turned 磨紋及壓花凸飾不同。0.1 m tile、四圖 opaque、metallic B 全 255／factory factor 1、既有 ownership 不變，目錄增為 420 種。

`seaurchintest` 快取九枚殼體旋轉與五放射／間輻方向，nearest-ray 與 nearest-row 選擇只在 compact 孔洞／凸瘤的零支撐間隙切換。每條放射線兩側各五孔，中心另有 apical 孔；間輻方向各兩個圓凸瘤。徑向平方距離控制微凸殼面與平滑外緣，不在極點引入角度浮雕。0.24 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 421 種。

`crystallineglaze` 快取各晶花中心／半徑／相位／整數針晶數，compact 不規則圓邊在 cell 邊界前歸零。針晶 angular harmonic 以平方半徑的 smooth fade 在核心消失，生長色帶使用平方半徑保持極點連續。釉下晶花只影響顏色／粗糙度，不增加高度或 AO 浮雕；獨立微粒保留細微釉面 normal。0.16 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 422 種。

`shirring` 以週期縱向 swell 控制細褶高度，橫向 compact 縫線肩部壓低布面，獨立短針腳在縫線底部微凸；各行間的 sinusoidal phase 彎移保持整張 tile 連續。seeded 相位／微粒與細織紋提供布面細節，避免變成單純直條壓紋。0.12 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 423 種。

`sunburstveneer` 快取四組拼花的 seeded 相位及各扇片軸向／色調，以 normalized 側邊距離控制等寬拼縫，內外圓邊 compact shoulder 在 ownership 切換前歸零。各片低頻縱向／高頻橫向 noise 在局部木紋座標取樣；中央木塞覆蓋 polar 奇點。木片、木塞與外板保持嵌平，窄縫才降低高度／AO 並提高粗糙度。0.8 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 424 種。

`rakedgravel` 以 compact smooth shoulder 連接平底耙溝與平頂溝岸，獨立三十二乘三十二 seeded 石粒快取中心／半徑／色調；石粒在所屬 cell 邊界前完整歸零，並以相同細凸面疊在溝底和岸面。高度將粗尺度耙紋與細尺度石粒分離，AO 保留溝底陰影及顆粒間隙。0.8 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 425 種。

`flintwall` 快取每顆交錯燧石的六個 seeded half-plane、色調與旋轉；compact smooth half-plane products 分別定義外側石面及內縮敲裂石心，兩者差形成連續白堊皮，石面以外為低灰漿縫。深色石心的偏心二次弧紋僅帶來淺斷口起伏，白堊皮明亮且較粗糙；各輪廓在 cell 邊界前歸零，交錯列切換與 tile wrap 不露接縫。1.2 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 426 種。

`frenchknots` 快取每顆結粒的 seeded 位置、橢圓旋轉與繞線相位；compact cap 承托兩道輕微三葉擾動的 annular yarn ridges，中央 compact dimple 只降低結粒頂部、不穿透底布。繞線在中心與外圍均歸零，橢圓結粒及陰影 halo 在 cell 邊界前歸零；獨立六十四乘六十四細織紋與微粒覆蓋底布。0.06 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 427 種。

`artichoke` 以二次曲線寬度定義由寬根漸尖的苞片輪廓，compact smooth shoulders 將兩側／根部／葉端連接，按列由後向前疊合交錯苞片。葉端逐漸抬起，中央 compact midrib 與三對斜向葉脈提供獨立細起伏；seeded 色調預先快取，微粒場提供局部變化。葉片支撐範圍在鄰域丟棄前歸零，重疊邊緣的 AO 保留細陰影。0.18 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 428 種。

`splitlockwashers` 將兩個 compact radial shoulders 與兩個切口角向 shoulders 相乘，形成有窄倒角的開口平面環。角向高度沿完整環段線性漸升，angle branch cut 完全落在零支撐缺口內，不跨缺口插值；seeded 相位預先快取，獨立微粒覆蓋墊圈與低鋼板。中心孔不是 alpha hole，底面與墊圈皆為金屬，因此 MR B 通道／factory metallic factor 均為 1。0.08 m tile、四圖 opaque、既有 ownership 不變，目錄增為 429 種。

`flemishbond` 每三個寬度單位分為一單位磚頭與兩單位長磚面，相鄰列平移一個半單位，使磚頭對齊上下層長磚面中心。快取一百二十八個 seeded 色調，以 row-pitch units 同時計算水平／垂直灰縫與倒角，避免長磚面加倍灰縫寬度；compact face 消除磚 owner／列切換接縫。磚頭較暗、長磚面較亮，但共用相同高度場與微粒／骨材起伏。1.2 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 430 種。

`satinweave` 以五枚組織與兩步飛數安排孤立緯線露點，compact exposure 完全收於單一交叉點內，平滑交換經線／緯線主導的高度與纖維方向。二十五乘二十五週期的 yarn skirts 在線間暗隙歸零，四個交叉點保持經浮線、第五個由緯線覆蓋；微粒與纖維相位可重現。光澤差異仍只使用既有 roughness／normal maps，不新增方向性散射模型。0.02 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 431 種。

`lotusroot` 快取九個切面、各八條氣孔的方向與橢圓倒平方半徑，避免逐像素重算 seeded 三角函數。氣孔沿徑向拉長，compact shoulders 形成低平孔底與平滑壁面，中央孔同樣沒有種子或凸起領圈；孔間肉質與薄褐皮共用嵌平高度，外圓裙緣在 cell 邊界前歸零。色差與 AO 區分淺肉質／薄皮／深氣孔，低暗底面仍為 opaque。0.24 m tile、四圖、metallic 0、既有 ownership 不變，目錄增為 432 種。

`cardboardedge` 快取六層 seeded 相位，四週期正弦芯紙以切線斜率修正垂直距離，避免陡側紙壁過薄；上下 liner 以 compact shoulders 形成直紙邊，與芯紙用 product union 接合，交點不疊高。所有紙邊共用切面高度與細微紙漿／纖維起伏，空腔保持低暗 opaque 底面；各層紙邊在 row 邊界前歸零，不因相位切換產生接縫。0.024 m tile、四圖、metallic 0、既有 ownership 不變，目錄增為 433 種。

`hexnuts` 快取十六枚 seeded 六角螺帽各六條單位半平面法線，以 compact product 形成直外緣倒角及平滑角部交集，再乘圓形孔裙緣，避免把六角外輪廓誤作圓環。頂面使用低幅同心加工紋及細粒，所有孔底／外側露出同一低鋼板底面；加工紋不是螺旋牙 geometry。0.08 m tile、四圖 opaque、全 metallic 通道及 factory factor 1、既有 ownership 不變，目錄增為 434 種。

`orbicularjasper` 快取二十五個 seeded 中心、倒平方半徑及三／四環數，以平方徑向場產生同心色帶，避免中心的徑向尖點；compact orbicle skirts 在 cell 邊界前歸零，保留獨立球紋與可見綠色基質。礦物環只影響 color／roughness，height 僅有獨立微粒，AO 維持 1，不將拋光包裹體誤作凸環或孔洞。0.12 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 435 種。

`acornbarnacles` 快取十六個 seeded 旋轉，以平滑圓裙緣與向內升高殼壁構成橡實形殼體；六條板縫及四十八條細肋在中央前淡出，避免角度場奇點。正則化 L1 場形成菱形凹口與圓滑尖角，深孔低於殼緣；板縫同步降低高度／AO 並提高粗糙度，殼外仍為 opaque 底面。0.12 m tile、四圖、metallic 0、既有 ownership 不變，目錄增為 436 種。

`circularpavers` 快取四個拼花相位與三百二十四塊石材色調，以半徑選擇中心石／四個環圈，再按圈號增加楔形石數；交替圈偏移半個扇區。徑向邊使用圓半徑差、扇區邊使用到徑向直線的垂距，令灰縫／倒角不隨圈半徑改變寬度。所有 owner 切換收於 compact 灰縫內，中心石不依賴角度場，平齊石面只含細粒起伏。1.6 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 437 種。

`snowflaketiles` 快取十六個 seeded 旋轉及六向主幹／兩對分枝的三十條線段，以平方 capsule 距離與 compact smooth union 產生白色雪花釉彩；線端及分枝接點連續，圖案在 cell 邊界前歸零。釉彩只影響 color／roughness，height 僅由方磚倒角與獨立微粒決定，AO 只反映灰縫，避免假浮雕。0.8 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 438 種。

`sawblades` 快取十六個 seeded 相位，以每齒八成週期長升坡／兩成短降坡的 C1 徑向輪廓形成非對稱齒與齒谷；中央軸孔與外側倒角採獨立 compact supports，角度場不作用於軸孔中心。片面高度不跟隨齒相位，只保留微粒及細密同心加工紋，所有孔底／片外露出同一低金屬底板。0.8 m tile、四圖 opaque、全 metallic 通道及 factory factor 1、既有 ownership 不變，目錄增為 439 種。

`pistachios` 快取二十五個 seeded 旋轉，以三組同向橢圓 compact supports 分別形成長殼體、中央開縫及更窄的果仁。雙瓣殼緣高於果仁，果仁再高於兩側暗隙，閉合兩端仍保留殼面；細長纖維僅作用於未開口殼區，避免把果仁誤作同一凸脊。0.15 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 440 種。

`polkadotfabric` 以偶數列週期與半格錯列建立三十六個圓形印花，seeded 平移在 UV wrap 後選取 cell；平方徑向 compact shoulder 保持中心與圓邊連續。底下平織沿用交替經緯優先的解析場，圓點僅改變 color／roughness，height／AO 完全不依賴印花場，避免變成凸珠或壓紋。0.12 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 441 種。

`cucumberslices` 快取九片各三組 seeded 放射軸，以同向橢圓 compact supports 形成膠質種子腔及其中三顆更窄長籽，深綠皮緣由平滑環帶構成。三腔互不重疊，籽裙緣完全位於腔內，避免分支跳變；切面 height 僅含獨立微粒，AO 只反映切片外緣，保留嵌平果肉而非蓮藕式空氣孔。0.18 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 442 種。

`monsteraleaf` 快取九片 seeded 旋轉，以闊橢圓葉面減去基部凹口、三對斜向閉合長孔與三對向外延伸裂口。孔／裂口各用 compact supports，在內孔與外裂口之間保留連續葉肉；側脈在中軸前平滑淡出，中肋獨立抬高。所有孔底與葉外同為 opaque 低暗底面，不依賴 alpha 裁切。0.9 m tile、四圖、metallic 0、既有 ownership 不變，目錄增為 443 種。

`crossstitch` 將 cell 座標旋轉 45°，以 compact 圓滑橫截面乘有限長端部 shoulder 形成兩條對角繡線。可見下層權重為 lower × (1 − upper)，上層覆蓋交點，避免高度相加形成不合理鼓包；線纖維採各自橫向相位，底布僅在未覆蓋處顯露。0.08 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 444 種。

`staranise` 快取九個八角的八組旋轉軸，以沿莢長度的二次收窄輪廓形成尖端莢面；各莢嵌入橢圓凹腔與較小的橢圓種子，種子低於莢壁但高於腔底，roughness 也較低。八條放射莢的 compact supports 保留莢間空隙，中心小果軸與孔隙仍使用 opaque 底面。0.12 m tile、四圖、metallic 0、既有 ownership 不變，目錄增為 445 種。

`logcabinparquet` 沿用矩形 ownership lookup，六乘六單位格完整覆蓋一個九板螺旋區塊，四區塊各自快取 seeded 板色。只對完整板材邊界計算凹縫／倒角，長軸取低頻、橫軸取高頻的 cached noise 形成順紋；所有板色與纖維在接縫平滑消失，板面高度一致。1.2 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 446 種。

`countersunkmetal` 以圓孔距離分出低底面、陡內壁、錐形沉孔及外部平板。錐形坡度採中段線性、兩端二次 shoulder 的 C1 輪廓，微量拉絲高度不掩蓋直線錐面；孔內 opaque 底面與整板皆保留 metallic 1，factory factor、四圖契約與借用／destroy 路徑同步。0.3 m tile、無新增 geometry，目錄增為 447 種。

`trilobitefossil` 快取九個旋轉，以頭／胸／尾橢圓 compact supports 平滑聯集形成化石輪廓；中央軸葉連接盾甲，十對胸肋沿二次曲線偏移，胸節 envelope 在兩端歸零且由頭甲遮蔽，眼部另以小型橢圓抬高。頭甲穹面乘自己的 support，避免重疊胸甲處產生斜率斷點。0.45 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 448 種。

`eyeletcotton` 以圓孔 wall shoulder 降至暗底面，以 compact 環形 support 抬高連續繡邊；十六次角向整數諧波形成鎖邊針腳，僅在環帶內求角度，避免中心奇點。環帶谷部保留高度，不把針腳間隙切穿成齒輪；細織紋與 seeded 纖維留在底布。0.06 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 449 種。

`dendriticagate` 預先快取每 cell 的 31 個 capsule 線段、角度與長／寬衰減，子枝從父枝端點接出；統一依最大徑向 extent 縮入 cell support，避免旋轉後跨界截斷。compact squared-distance masks 以平滑聯集合成深色包裹體，只改 base color；拋光面 height／roughness 與 AO 不沿枝條起伏。0.15 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 450 種。

`ravioli` 以相乘的平滑 scalloped 軸向 supports 裁切外緣，四次方 rounded-square compact dome 抬高中間餡料包；四邊 compact 條帶乘週期叉痕，僅壓低扁平封邊。個別鼓包位置／色調預先 seeded 快取，麵皮 grain 受 face 遮罩避免跨 cell 色差。0.16 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 451 種。

`rollerchain` 聯集兩個圓端與細束腰 bridge，於相鄰三片支持內合成連續覆蓋；偶數外片另加高層，與低內片在共用鉸接點重疊。整數位置放置具圓冠的銷軸頭，compact 環帶壓低 collar；偶數節數與空背景支援錯列及 tile wrap。0.24 m tile、四圖 opaque、全金屬 B／factor 1、既有 ownership 不變，目錄增為 452 種。

`mapleleaf` 以五裂角向波的平滑絕對值輪廓收尖，搭配微齒邊調整外半徑，避免圓裂片看成五瓣花；平方半徑肩形成掌狀輪廓。角度奇點藏於飽和內部，圓冠用 Cartesian 半徑平方計算。五條預計算線段從葉柄端放射向葉尖，compact masks 抬高葉脈；葉柄與葉片平滑聯集。0.3 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 453 種。

`smocking` 以相反方向的餘弦位移讓成對褶線在相鄰列交替接近，以 compact 橫向輪廓合成布褶，收束 envelope 壓低固定點，短橫向橢圓針腳覆於其上；偶數列數維持週期。細織紋與 seeded 纖維補足布面，不用 quilt 的鼓包菱格替代抽褶。0.12 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 454 種。

`quatrefoiltile` 以中央圓盤連接四個偏移圓瓣，再用 compact supports 平滑聯集形成深凹角的四葉輪廓；避免原先圓瓣過度重疊而看成圓角八角磚，也不使用 hard max 引入稜線。凹角之間以兩條平方對角帶相乘裁出深色菱形嵌片，與主磚保留粗糙下凹填縫。主磚略高於菱形，seeded grain 僅作用於陶瓷支持內。0.5 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 455 種。

`okraslice` 以五倍角餘弦半徑生成五稜輪廓，外層 rind 遮罩壓暗窄皮邊；角度奇點藏於飽和 face 內部。每片 seeded 旋轉與五腔方向預計算，橢圓 compact masks 壓低腔底，每腔兩個圓形 supports 抬高淺色籽粒，保留較高中央組織與隔壁。0.09 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 456 種。

`eggcarton` 以週期 4×4 cell 的圓形 compact 蛋杯壓低杯底，杯壁以 r² 帶通合成單圈肋環；半格位移的第二組座標在四杯交會處放置平方 compact 圓頂，避免錐尖產生 kink。紙漿 grain 低幅疊加，不覆蓋盤形輪廓。0.16 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 457 種。

`greekkey` 以資料表中的八條軸向線段描述單一回紋鉤，逐線計算平方距離（對凸集合為 C1），以乘積聯集合成凸線與較窄亮芯，避免線段接點出現折痕；底線兩端落在 cell 邊界，兩側 cell 對稱省略鄰格同一線段的貢獻，因此 tile wrap 與跨格連線都保持連續。0.45 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 458 種。

`seedbeads` 以偶數列數維持週期的半珠錯位，逐列換算 cell 座標；珠身用四次方超橢圓遮罩與 `1 - (y/b)^2` 的桶狀剖面，兩端各以 compact 圓蓋壓低穿線孔，孔位落在 cell 內避免被相鄰 cell 截斷。逐珠色調由預先 seeded 的 hash 表取得（列與欄皆取模），珠間 face 遮罩為 0，色調不連續被隱藏在線隙內。0.06 m tile、四圖 opaque、metallic 0、既有 ownership 不變，目錄增為 459 種。

`chainstitch` 在 5×6 cell 中以隨縱向變寬的橢圓平方場描述鏈繡；環帶以 compact smooth profile 隆起，每點合成自身及前後兩個環，乘積聯集保持交會處與 cell wrap 的 C1。週期細織紋與 seeded grain 低幅疊加在深藍布底與金色鏈環上。0.12 m tile、opaque dielectric、metallic 0，沿既有 maps／選用 height／借用生命週期，目錄增為 460 種；不新增 geometry 或布料模擬。

`wingnuts` 以 compact 圓盤 hub 和兩個傾斜橢圓翼的乘積聯集構成蝶形輪廓，再以平方徑向場凹入 bore；翼冠高於 hub，孔內外共用低鋼底。4×4 cell 依棋盤格交替旋轉 90°，各支撐完全位於 cell 內以保持週期 C1；週期 seeded grain 只作低幅金屬細節。0.12 m tile、metallic map／預設 factor 1，既有輸出、maps／選用 height／ownership 不變，不新增 geometry、真實螺紋或機械模擬；目錄增為 461 種。

`pomegranateslice` 用平方圓場形成外皮與內層，預計算六組徑向／切向基底，每像素只取最近果室；橢圓果室與七顆 compact 橢圓果粒的支撐均在扇區界線前歸零，避免 atan2 分區接縫。果室下凹、果粒隆起，中心與隔膜留白、果皮形成紅色凸環，seeded grain 低幅疊加。3×3 圓形斷面、0.15 m tile、metallic 0、既有 maps／選用 height／ownership 不變；目錄增為 462 種，不新增 geometry、transmission 或植物模擬。

`pawprinttiles` 預計算四個傾斜橢圓趾墊的基底，與四個 compact 圓盤合成三葉掌墊；乘積聯集形成 C1 鈷藍凹印。磚面為兩軸平方邊界 smooth profile 的乘積，避免 min-distance 在灰縫交角產生一階折痕；mortar 沿既有中性灰色混合，stamp 支撐與灰縫分離。4×4 方磚、0.6 m tile、metallic 0、既有 maps／選用 height／ownership 不變；目錄增為 463 種，不新增 geometry 或模擬。

`dovetailjoint` 以 smooth 半平面與外張梯形榫舌的乘積聯集形成 owner，`4×owner×(1-owner)` 定義暗色凹縫，直肩／斜邊／榫端接點 C1。木紋由 96×4／4×96 的 seeded periodic lattice 依板向混合，每列 bottom owner 使用下一列 top 的 grain／tone，以保持跨列與 tile wrap 連續。4 欄×2 列榫舌、0.48 m tile、metallic 0、既有 maps／選用 height／ownership 不變；目錄增為 464 種，不新增榫接 geometry 或結構力學模擬。

`starsocketbolts` 用 compact 平方圓場與低幅 lens 形成圓拱 cap，凹槽半徑為 `radius + depth×cos(6θ)`，以 `t=y²/r²` 的三次多項式取代角度／三角函式；中心飽和區與最大支撐外直接給定 1／0，避開零半徑奇點與無用計算。棋盤 parity 改 wave 符號等價旋轉 30°，slot 為封底凹槽而非穿孔。4×4 cap、0.12 m tile、metallic map／預設 factor 1、既有 maps／選用 height／ownership 不變；目錄增為 465 種，不新增 geometry 或模擬。

`sanddollar` 以 compact 橢圓場和低幅平方 dome 形成扁殼，五個預計算基底各描述一條橢圓 petal 的 compact 帶通凹線，及半扇區位移的狹長 lunule；各組用乘積聯集保持相交與支撐邊界 C1。lunule 使 shell 遮罩歸零，露出同色、同高的不透明暗底，不開 alpha。3×3 殼、0.3 m tile、metallic 0、既有 maps／選用 height／ownership 不變；目錄增為 466 種，不新增 geometry 或生物模擬。

`brogueleather` 預計算六個徑向基底，形成橢圓花瓣孔與中央圓孔的 compact smooth 聯集；雙排邊孔使用獨立週期 x cell 及鏡像 y 座標，支撐不觸及鏡像／cell 分界。孔遮罩使 grain 歸零並露出等高暗底，孔壁 C1；3×3 花飾、0.18 m tile、metallic 0、既有 maps／選用 height／ownership 不變，目錄增為 467 種，不新增 geometry 或皮料模擬。

`clovebuds` 使用 compact smooth 橢圓莖、圓形蕾頭與四個正交橢圓萼片，乘積聯集使接合與支撐邊界 C1；蕾頭額外隆起、萼托次之，細莖低於花頭但高於暗底。棋盤 parity 轉換局部座標 90°，所有支撐皆在 cell 內結束，grain 使用 seeded periodic lattice。4×4 花蕾、0.08 m tile、metallic 0、既有 maps／選用 height／ownership 不變；目錄增為 468 種，不新增 geometry 或食品模擬。

`starcrosstiles` 將兩個互轉 45° 的 smooth 平方邊界方形作乘積聯集，形成八角星；內縮星面與外擴星的補集分別定義青色星磚與白色十字磚，中間留灰縫。外擴星尖跨 cell 時只在支撐範圍內納入鄰星，避免最近 cell 切換造成 C1 斷裂；無對角鄰星可達該支撐。4×4 星、0.8 m tile、metallic 0、既有 maps／選用 height／ownership 不變；目錄增為 469 種，不新增 geometry 或鋪設模擬。

`maplesamara` 在兩個鏡像 45° 基底上計算外展寬度的 compact smooth 橢圓翅與較高的根部橢圓種仁，再與短橢圓柄作乘積聯集；細脈餘弦乘上各自翅遮罩，離開翅緣即歸零。棋盤 parity 對局部座標翻轉 180°，所有支撐都在 cell 內結束，grain 取 seeded periodic lattice。4×4 對翅果、0.2 m tile、metallic 0、既有 maps／選用 height／ownership 不變；目錄增為 470 種，不新增 geometry、透明薄膜或飛行模擬。

`lenoweave` 以 `±offset×cos(πy)` 定義成對經線軌跡，compact 平方距離場形成圓線及水平緯線；`sin(πy)` 控制經線交點次序，`cos(πy)` 控制經緯次序。兩種交點支撐分離，以 smooth 權重遮蔽下層線而非相加，避免交點高度鼓包；偶數 rows 保持完整 tile 的相位週期。細纖維與 grain 僅乘可見線權重。6 組×6 緯、0.06 m tile、metallic 0、既有 maps／選用 height／ownership 不變；目錄增為 471 種，不新增 geometry、透明網眼或布料模擬。

`circlips` 以內外平方圓的 smooth 差構成平環，再以 compact x／smooth y 遮罩開一側缺口；端部圓耳乘積聯集後，扣掉兩個 compact 圓孔，接合與孔壁 C1。棋盤 parity 翻轉局部座標 180°，所有支撐在 cell 內結束；grain 來自 seeded periodic lattice。4×4 環、0.08 m tile、metallic map／預設 factor 1、既有 maps／選用 height／ownership 不變；目錄增為 472 種，不新增 geometry、透明孔或彈性模擬。

`tuliptiles` 預計算三瓣花冠與兩葉的旋轉基底，用縱向平方 bulge 再平方的 compact lens 場形成尖端，與細橢圓莖作乘積聯集；pigment 與低幅浮紋共用遮罩。釉面邊界為兩軸平方 smooth profile 乘積，灰縫沿既有中性色混合；花葉支撐與灰縫分離。4×4 方磚、0.6 m tile、metallic 0、既有 maps／選用 height／ownership 不變；目錄增為 473 種，不新增 geometry 或植物模擬。

`gingerslice` 預計算四個不等圓瓣的外緣與內縮肉面半徑倒平方，兩組 compact smooth 圓場各作乘積聯集，連接頸部保持肉面而非內部皮縫；兩遮罩差形成薄褐皮。128×12 seeded periodic lattice 描述細縱纖維，與細 grain 只作用於切面支撐。棋盤 parity 旋轉局部座標 90°；4×4 片、0.2 m tile、metallic 0、既有 maps／選用 height／ownership 不變，目錄增為 474 種，不新增 geometry 或食品／植物模擬。

`fivebarplate` 將局部座標轉 45° 並依棋盤 parity 轉 90°，五條 capsule 的平方距離 compact smooth 場作乘積聯集；capsule 側面與圓端間距離平方 C1，所有支撐在 cell 內結束。128×8 seeded periodic lattice 提供低幅軋製紋，凸筋比底板平滑。4×4 組、每組五筋、0.6 m tile、metallic map／預設 factor 1、既有 maps／選用 height／ownership 不變，目錄增為 475 種，不新增 geometry、止滑或承載模擬。

`cinnamonswirl` 以 Cartesian angle components 組合徑向 cos／sin 相位，建立無 atan2 分支縫的單連續螺旋；中心平坦餡核在角度項開始前取代奇點，內餡在外皮內提前淡出。圓形 compact support、烤色外緣與 96×96 seeded periodic crumb 場提供麵團差異，內餡較暗、低、平滑且 AO 較低。4×4 切面、0.32 m tile、metallic 0、既有 maps／選用 height／ownership 不變，目錄增為 476 種；不新增 geometry 或烘焙模擬。

`wheatears` 將每對穀粒旋轉 ±45°，compact smooth 橢圓場聯集形成粒面、隆起冠部、縱溝與延長細芒；中央窄穗軸連接兩側。所有支撐在 cell 內結束，以乘積聯集避免遮罩 max 接縫；96×96 seeded periodic grain 僅作用於穗形。4×4 支、每支五對穀粒、0.24 m tile、metallic 0、既有 maps／選用 height／ownership 不變，目錄增為 477 種；不新增 geometry、生長或風場模擬。

`scalemail` 用下端收窄的 compact smooth 橢圓場建立金屬鱗片，在局部三乘三鄰域由下排往上排合成，使上排遮住下排捲邊。八行 parity stagger 保持跨 tile 一致，鄰域進出支撐為零值零斜率；中央凸脊、頂部圓鉚釘、周緣捲邊與 128×8 seeded periodic 拉絲分別控制表面。6×8 片、0.24 m tile，含暗鋼底層皆 metallic 1、既有 maps／選用 height／ownership 不變，目錄增為 478 種；不新增 geometry、透明孔洞或防護物理。

`trihexagonaltiles` 以七列八行 staggered lattice 的三組平行半平面 smooth 乘積建立六邊面，擴張所有鄰近六邊遮罩後取補集形成兩方向三角面；縮入面與擴張面之間保留中性凹灰縫，避免 nearest-owner 或 polygon max 折線導數。鄰域 bounding 只在支撐已零值零斜率外跳過；96×96 seeded periodic grain 沿既有管線。56 六邊面／112 三角面、0.84 m tile、metallic 0、maps／選用 height／ownership 不變，目錄增為 479 種；不新增 geometry、碰撞或施工模擬。

`burlwood` 將 3×3／7×7／96×96 seeded periodic lattice 組成扭曲相位，以窄深色 latewood 等高線取代直木紋。九個靜態偏置橢圓瘤眼在各 cell 內 compact 支撐結束，局部環相位變形在髓心與邊緣消失；支撐外不計算環 cos。髓心較暗、微凹、較粗糙且 AO 稍低，整體保留平整鋸切面的微小高度變化。0.24 m tile、metallic 0、maps／選用 height／ownership 不變，目錄增為 480 種；不新增 geometry、樹種鑑定、年輪測年或生長模擬。

`slottedmetal` 沿用既有 capsule 平方距離與 staggered row 模式，但採縱向長槽；以 columns／rows 比將兩軸轉為相同 column-cell 單位，讓方形 UV tile 上兩端仍為真圓弧。兩半徑間 smooth 過渡形成凹壁，4h(1−h) 增亮加工斜壁；128×8 seeded periodic 拉絲沿既有管線。8×4 槽、0.4 m tile、含暗槽底皆 metallic 1、maps／選用 height／ownership 不變，目錄增為 481 種；不新增 geometry、透明孔洞、通風或承載模擬。

`peppercorns` 以 compact smooth 圓場與 squared-radius dome 建立乾果粒，中央小圓場下凹為果梗疤；40×40 seeded periodic lattice 的對稱平方 fold 形成淺皺皮凸脊，128×128 grain 增加細節，全部在果形支撐內作用。果疤 roughness 差須大於皺皮變化幅度，避免鄰近凸脊反轉粗糙度關係。5×5 顆、0.08 m tile、metallic 0、maps／選用 height／ownership 不變，目錄增為 482 種；不新增 geometry 或食品／植物模擬。

`castellatednuts` 用六個 smooth half-plane 乘積建構六角外形，中央圓孔 bevel 乘上外形形成環體；六個 compact elliptical radial slots 的 complement 乘積保留冠齒，凹槽下方仍有較低鋼面，內環不被切斷。交替 cell 將局部座標旋轉 30°，plane normals 僅在建立 sampler 時預計算，取樣不配置陣列。96×96 seeded periodic grain、0.08 m tile、4×4 螺帽，metallic 1，目錄增為 483 種；maps／height／ownership 不變，無 geometry、透明度或緊固物理。

`farfalle` 的半寬由 x² 的 smooth ramp 從窄腰展開，與側邊／cosine 波齒端切面 smooth masks 相乘成連續麵片；以 y／局部半寬參數化褶痕，收攏至腰部而不採 atan 角度分支，compact x² 場加深腰部色調與 AO 並隆起聚攏處。交替 cell 交換座標呈 90° 方向；128×128 seeded periodic grain、4×4 麵片、0.16 m tile、metallic 0，目錄增為 484 種。無 geometry、透明度或烹飪／柔體物理，maps／height／ownership 不變。

`cardamompods` 將正規化長軸二次 cap 的平方減去橫軸平方形成 compact lens，smooth mask 讓果莢雙端收束；短橢圓梗以 product union 接上果身。局部 cap 寬度加正值 floor 後參數化縱向 cosine 稜脊，避免尖端除零；稜脊只在 pod mask 內改變色／height／roughness／AO。4×4 交替 ±45°、96×96 seeded periodic grain、0.08 m tile、metallic 0，目錄增為 485 種；既有 maps／height／ownership 不變，不新增 geometry 或開莢／植物／食品模擬。

`brickarches` 以九組預計算 wedge half-planes 與內／外徑 smooth mask 建立半圓拱磚，六塊矩形建立兩側三層拱腳；每磚獨立 seeded tone 在灰縫前已淡出。拱圈與拱腳 outline 採 product union，放射縫與水平床縫共用 recessed mortar，灰縫不延伸至暗色不透明開口；不用 atan 或每取樣配置。4×4 拱形、96×96 seeded grain、2.4 m tile、metallic 0，目錄增為 486 種；既有 maps／height／ownership 不變，不新增 geometry、透明度或建築物理。

`knottednet` 以 squared-sine 位移使橫／縱繩段在節點間鬆垂，wrapped 距離的 smooth squared cap 形成圓繩；兩個 ±45° 橢圓帶 product union 成隆起繩結，compact 收緊凹痕覆在結部，繩段在結下方淡出。弧線、繩結與纖維週期一致且無每取樣配置；6×6 結、96×96 seeded grain、0.3 m tile、metallic 0，目錄增為 487 種。既有 maps／height／ownership 不變，不新增 geometry、透明度或受力／布料模擬。

`fiddleheads` 在 sampler 建立時將一圈半 tapering spiral 與 cubic Bézier 彎莖預計算為 72＋24 個 capsule segments，儲存端點、方向、倒長度平方、倒寬度平方與 AABB；取樣先剔除 box 外段，再以 squared-distance smooth cap 的 product union 合成，不切換角度 owner、不建立逐取樣陣列。交替 cell 鏡向，96×96 seeded grain、4×4 捲芽、0.24 m tile、metallic 0，目錄增為 488 種。既有 maps／height／ownership 不變，不新增 geometry、透明度或生長模擬；造型為風格化表面圖案。

`cowrieshells` 以 compact smooth 橢圓與 squared-radius dome 建立殼面，狹長橢圓開口下凹、變暗並加粗 roughness；十八個 compact 橫向橢圓齒脊以 complement product 合成，分列殼口兩側而不跨接中央凹口。交替 cell 交換座標呈直橫，96×96 seeded grain、4×4 殼面、0.2 m tile、metallic 0，目錄增為 489 種。既有 maps／height／ownership 不變，不新增 geometry、透明度或海洋生物模擬。

`cotterpins` 將 compact 橢圓環眼與四段 capsule 腳以 product union 相連，兩條銷腳保持中央空隙，尾端向外分別彎折。sampler 建立時預算端點、方向與倒長度平方，取樣不配置陣列；正反交替、96×96 seeded grain、4×4 銷、0.12 m tile、metallic 1，目錄增為 490 種。孔眼與腳間隙為暗色不透明鋼底，maps／height／ownership 不變，不新增 geometry、透明度或緊固／彎折物理。

`seedstitch` 以兩段有限 capsule 的 product union 畫開口 V 形正針，以水平 capsule 畫反針凸結，12×12 偶數格依 row+column 奇偶交錯，compact smooth 肩部將兩者與平底連續銜接。方向與倒長度平方只在 sampler 建立時計算，取樣不配置陣列；96×96 seeded grain、灰綠毛線、0.12 m tile、metallic 0，目錄增為 491 種。既有 maps／height／ownership 不變，不新增 geometry、透明度或布料模擬。

`mangosteenslice` 用兩個 squared-radius smooth 圓場定義厚果皮，六個預算方向的橢圓 cap 與中心 smooth hub 以 product union 接成圓潤乳白果瓣，較窄的 dome 場控制果肉隆起，瓣間保留暗紫凹縫。4×4 切面、相鄰旋轉 30°、96×96 seeded grain、0.32 m tile、metallic 0，目錄增為 492 種；取樣無 trig、sqrt 或配置陣列。既有 maps／height／ownership 不變，不新增 geometry、透明度或植物學模擬。

`pickettiles` 在正規化 triangular lattice 的相鄰兩列搜尋最近 owner，再以三組對向 half-plane 的 compact smooth product 畫六邊，避免 min/max bevel 在尖角相交處的導數折線。9 欄×4 交錯列映回方形 UV 後形成長寬比 3 的尖頂長磚；所有 owner 切換前都落入平底灰縫，36 個 seeded tones 與 pitch／bevel 倒數在 sampler 建立時預算。青綠釉面、96×96 grain、0.9 m tile、metallic 0，目錄增為 493 種；既有 maps／height／ownership 不變，不新增 geometry、透明度或建築模擬。

`squarewashers` 以兩組對向平面 compact smooth product 定義方框外緣，再乘上 squared-radius 孔眼 bevel，保留連續四角與完整環繞圓孔的平面。4×4 墊圈、交替旋轉 45°、96×96 seeded grain、0.16 m tile、metallic 1，目錄增為 494 種；旋轉與 bevel 倒數在 sampler 建立時預算，取樣無 trig、sqrt 或陣列配置。孔眼／背景保持暗色不透明鋼底，既有 maps／height／ownership 不變，不新增 geometry、透明度、緊固或荷重模擬。

`eucalyptusleaf` 以 clamp 後的縱向二次 envelope 平方與橫向 squared cap 形成兩端漸尖的狹長葉，二次彎曲中心線承接中肋；側脈使用五組預算根部與對稱斜線，靠中軸的 smooth fade 消除 absolute 座標折線，所有脈紋都由 blade coverage 遮罩。短葉柄與 blade 以 coverage union 接合，4×4 葉、交替 ±45°、96×96 grain、0.48 m tile、metallic 0，目錄增為 495 種；取樣不配置陣列。既有 maps／height／ownership 不變，不新增 geometry、透明度、風動或植物學模擬。

`twillweave` 沿用 satinweave 的連續 warp／weft rounded profile 與 compact crossing exposure 慣例，但使用四針週期的二上二下平衡斜紋；每列偏移一針，16×16 為四針週期的整數倍，可完整 wrap。紗線半寬 0.32 cell，讓最低 32×32 貼圖每針僅兩個 pixel 的中心取樣仍命中紗線，而非全落入間隙。深棕 warp／淺褐 weft 的色場與高度前後順序一同切換，exposure 在 cell 邊界前歸零以保持 C1，128×128 seeded grain、0.16 m tile、metallic 0，目錄增為 496 種；取樣不配置陣列。既有 maps／height／ownership 不變，不新增 geometry、透明度或布料模擬。

`pumpkinseeds` 以縱向 quadratic envelope 的平方與橫向 squared cap 畫雙端漸尖籽殼，巢狀 compact smooth masks 的差形成連續隆起殼緣，內層保持完整較低殼面而非穿孔。4×4 籽殼、交替 ±45°、96×96 seeded grain、0.12 m tile、metallic 0，目錄增為 497 種；旋轉與平方尺度倒數在 sampler 建立時預算，取樣無 trig、sqrt 或陣列配置。既有 maps／height／ownership 不變，不新增 geometry、透明度、開裂或植物學模擬。

`spurgears` 用十二組預算 radial／tangent 軸的三平面 compact smooth products 定義外齒，再與 squared-radius 輪身 product union，最後乘上圓軸孔 bevel；獨立 compact annulus 提高輪轂。外齒為 stylized block teeth，非精密漸開線。4×4 鋼輪、交替 15°、96×96 seeded grain、0.2 m tile、metallic 1，目錄增為 498 種；取樣無 trig、sqrt 或陣列配置。孔／齒隙保留暗色不透明鋼底，既有 maps／height／ownership 不變，不新增 geometry、透明度或傳動模擬。

`diamondcheckertiles` 在 `(a,b)=4(u+v,u-v)` 的等距斜座標格中，以兩個 compact smooth edge masks 的乘積畫正方磚及角落倒角。32 組預算 seeded owner tones 用 `a mod 4`／`(a-b) mod 8` 索引，對兩方向 UV 平移保持一致；深淺 pigment 在灰縫前先 fade 到共用值，消除 owner 與 wrap 跳變。96×96 grain、1.2 m tile、metallic 0，目錄增為 499 種；取樣無 trig、sqrt 或陣列配置。既有 maps／height／ownership 不變，不新增 geometry、透明度或物理。

`appleslice` 用 squared-radius compact smooth masks 畫同心果皮／果肉／核心，再以五組預算 radial／tangent 軸的橢圓 product unions 分別扣低種室與抬高室內深色籽；籽仍低於未切削果肉。4×4 切面、交替 36°、96×96 seeded grain、0.4 m tile、metallic 0，目錄增為 500 種；旋轉、尺度與 shoulder 倒數在建立時預算，取樣無 trig、sqrt 或陣列配置。既有 maps／height／ownership 不變，不新增 geometry、透明度、切割、汁液或植物學模擬。

`paperclips` 沿用線段投影 capsule 模式畫三段線身，兩道回彎用 squared-radius implicit ring profile 乘 compact half-plane shoulder，再作 product union；half-plane 在半圓背側漸隱且與 capsule 重疊，避免硬切半圓造成線徑剖面跳變。4×4 線夾、交替 ±45°、96×96 seeded grain、0.24 m tile、metallic 1，目錄增為 501 種；投影與 ring 尺度／shoulder 倒數在建立時預算，取樣無 trig、sqrt 或陣列配置。內槽保留不透明暗鋼底，既有 maps／height／ownership 不變，不新增 geometry、透明度或夾持模擬。

`ivyleaf` 以三個預算軸的 pointed quadratic-envelope squared caps 作 smooth product union，形成三尖裂葉與兩道凹缺；三條由共同葉柄根指向裂尖的投影 capsule 葉脈由 leaf mask 限定，獨立短 capsule 葉柄與葉面 union。4×4 葉、交替 ±45°、96×96 seeded grain、0.32 m tile、metallic 0，目錄增為 502 種；旋轉、投影與尺度／shoulder 倒數在建立時預算，取樣無 trig、sqrt 或陣列配置。既有 maps／height／ownership 不變，不新增 geometry、透明度、風動或植物學模擬。

`ribknit` 沿用 knit／seedstitch 的 capsule 針目模式；偶數欄兩段有限線段作 smooth product union 畫 V，奇數欄單一水平 capsule 畫反針，column-only owner 保持垂直羅紋，反針高度／明度低於正針。所有支撐在 cell 邊界前歸零，grain 僅乘在紗線 coverage 上。12×12 針目、96×96 seeded grain、0.12 m tile、metallic 0，目錄增為 503 種；投影與平方尺度倒數預算，取樣無 trig、sqrt 或陣列配置。保留最低 32×32 的反針像素對比回歸；既有 maps／height／ownership 不變，不新增 geometry、透明度、彈性或布料模擬。

`pillowtiles` 用四次 superellipse compact smooth mask 畫圓角正方磚，以獨立 squared-radius quadratic cap 的 smooth profile 畫連續中央凸面，而非只有外緣 bevel。36 組 seeded owner tones 預算，所有色差與 grain 由 face mask 限定，灰縫先回到共用 pigment 再由既有 mortar 路徑混色。6×6 磚、96×96 grain、0.6 m tile、metallic 0，目錄增為 504 種；取樣無 trig、sqrt 或陣列配置。既有 maps／height／ownership 不變，不新增 geometry、位移或透明度。

`coffeerings` 預算九組 seeded 中心偏移、旋轉、橢圓半徑倒數與濃度；squared-radius implicit ring 受連續 warp 微擾，compact smooth ring profile 乘局部 fade，另以獨立 smooth inside mask 畫淡浸染。各軸最外支撐小於 0.42 cell，owner 邊界前歸零；12×12 warp／24×24 fade／96×96 paper grain 皆 periodic。3×3 杯圈、0.36 m tile、metallic 0，目錄增為 505 種；色漬只改 pigment／roughness 及極輕微乾燥沉積，AO 不挖洞，取樣無 trig、sqrt 或陣列配置。既有 maps／height／ownership 不變，不新增 geometry、透明度、流體、吸收或乾燥模擬。

`cashews` 以外橢圓 compact smooth cap 減去偏心橢圓內口形成 crescent，兩個不同半徑的圓端用 smooth product union 接合，保留 C 形開口而不形成閉環。獨立 dome unions 畫厚實凸面；預算 16 組 seeded tones、平方尺度倒數與 ±45° 旋轉係數，grain 只乘 kernel coverage，各 owner 邊界前歸零。4×4 果仁、96×96 grain、0.16 m tile、metallic 0，目錄增為 506 種；取樣無 trig、sqrt 或陣列配置。回歸覆蓋弧身至端部的連通厚度及不對稱圓端，既有 maps／height／ownership 不變，不新增 geometry、透明孔洞、散射或食物物理。

`hinges` 沿 rounded-square／countersink 既有模式，以兩側四次 superellipse 畫圓角葉片，最近三列 screw owner 配合平方半徑 smooth seat／bore profiles 畫六個沉孔。中央五節 barrel 用 compact x cap 與 periodic joint shoulders，較窄且連續的 pin 在四道節縫中保持較低可見高度；以 coverage blends 覆蓋葉片而非直接相加，避免軸筒兩側多出葉片高度。各 owner 邊界前歸零，8×128 seeded grain、4×4 鉸鏈、0.4 m tile、metallic 1，目錄增為 507 種；取樣無 trig、sqrt 或陣列配置。既有 maps／height／ownership 不變，不新增 geometry、透明孔洞、活動關節或剛體物理。

`coins` 用 squared-radius smooth disk／annular profiles 畫圓幣與凸起邊框；中央五角星由五個三角 spike 的三條 smooth 半平面相乘，再與五半平面 pentagonal hub 做 product union。Spike bases 向 hub 內重疊，避免內部 bevel seams；軸向 trig、36° 交替旋轉係數及 16 組 seeded tones 預算，取樣無 trig、sqrt 或陣列配置。4×4 圓幣、96×96 grain、0.12 m tile、metallic 1，目錄增為 508 種；所有支撐在 cell 邊界前歸零，既有 maps／height／ownership 不變，不新增 geometry、文字、透明度、貨幣系統或剛體物理。

`righttriangletiles` 沿既有 checker／trihexagonal 的 smooth half-plane products；方格的 x／y 邊界 coverage 相乘，再乘兩側 diagonal half-plane masks，保留 32 個獨立 seeded triangle tones。奇數 owner 反射局部 y 交替斜縫，`(x-y)/√2` 以法向距離統一斜縫與直縫的 grout／bevel 寬度；不同 pigment 在灰縫前回到共用底色。4×4 分割方格、96×96 grain、1 m tile、metallic 0，目錄增為 509 種；取樣無 trig、sqrt 或陣列配置。既有 maps／height／ownership 不變，不新增 geometry、位移或透明度。

`cherryblossom` 沿既有 petal smooth product unions：五個橢圓花瓣扣除端部 compact smooth 橢圓缺刻，coverage 與獨立 dome 分別 union，避免重疊花瓣加出尖峰。圓形低陷花心與十二個小型淺色 pollen dots 獨立著色／起伏，pollen 支撐與導數皆在徑向 gate 前歸零；預算花瓣軸、pollen sites、16 組 seeded tones、尺度倒數與交替 36° 旋轉係數。4×4 花、96×96 grain、0.24 m tile、metallic 0，目錄增為 510 種；取樣無 trig、sqrt 或陣列配置，所有支撐在 owner 邊界前歸零。既有 maps／height／ownership 不變，不新增 geometry、透明孔洞、生長、風動或散射模擬。

`punchcard` 用兩軸 compact smooth rectangle mask 乘切角半平面畫八張薄紙卡；預算八組 seeded tones 與 20×8 slot bitmaps，每欄選兩個不同 row，僅為資料卡視覺、不宣稱歷史編碼。取樣以最近列／欄 owner 取一格矩形孔，兩軸 smooth punch bevels 的支撐在 owner 中線前歸零；paper coverage 為 face 乘 slot complement，孔位的 pigment／height／roughness／AO 回到共用不透明 backing。96×96 grain、0.44 m tile、metallic 0，目錄增為 511 種，紙／背襯高度差約 0.3 mm 而非深金屬孔；取樣無 trig、sqrt 或陣列配置。既有 maps／height／ownership 不變，不新增 geometry、透明鏤空、資料編碼／讀卡或紙張物理。

`braidedcord` 三股相位差 1/3 的 C2 quartic periodic waves 畫橫向路徑，雙倍相位深度形成 figure-eight flat plait，而非三條同向 helices。截面用切線斜率平方近似法向寬度；C2 路徑使該寬度在半週期接點仍 C1。三股 compact coverage／convex domes 暫存在 sampler 初始化配置的九個 Float64 值，以 smooth depth ownership 遮蔽交叉下股，避免硬排序／max 接縫；十二組 seeded strand tones 預算。四條辮帶×四週期、96×96 grain、0.08 m tile、metallic 0，目錄增為 512 種；取樣無 trig、sqrt 或陣列配置，所有支撐在 column owner 邊界前歸零。既有 maps／height／ownership 不變，不新增 geometry、透明孔洞、編繩製程或布料物理。

`crossbeddedsandstone` 預算四組 seeded 交替正／負 dip、quadratic curvature、phase 與染色深度；整數 UV 頻率沿 x 重複，compact smooth lamina profile 在 horizontal bed 邊界前漸消，獨立共用 contact profile 保持 owner 切換與 wrap C1。傾斜細層理微量低陷、表面 sandy grain 連續；黑箱回歸從 AO 尋找細紋並追蹤兩側位移／二階彎曲，不複製 seeded 參數計算。四層岩床、96×96 grain、1.2 m tile、metallic 0，目錄增為 513 種；取樣無 trig、sqrt 或陣列配置，既有 maps／height／ownership 不變，不新增 geometry、位移、地層生成、沉積或侵蝕模擬。

`grommetcanvas` 沿 gabion 的混合 metallic 慣例：squared-radius inner／outer compact smooth masks 畫黃銅環、獨立 radial ridge profile 畫凸面，先切除底下帆布再以 ring coverage 混合 pigment／height／roughness／AO，metallic 直接取 ring。預設 material factor 1 僅啟用 authored map，不把布面或 opaque bore backing 改為金屬；bevel 分數金屬值平順銜接兩材質。64×64 warp／weft compact profiles 與 96×96 grain 畫粗帆布，16 組 seeded ring tones 預算。4×4 扣環、0.16 m tile，目錄增為 514 種；取樣無 trig、sqrt 或陣列配置。既有 maps／height／ownership 不變，不新增 geometry、透明鏤空或布料物理。

`fishscaletiles` 以錯列單位圓的 compact 內縮 face 與下一錯列外擴 disk 相減，形成凸半圓／雙凹弧的平面互鎖扇形。兩個相鄰遮罩的乘積避免 nearest-disk ties 產生 derivative cusp；額外一個前景 course 先處理即將入列的 grout band，row owner 變換前後仍同值同斜率。面積權重不覆疊，統一低填縫、共平面釉面高度／roughness／AO 與逐磚 tone，沿既有 mortar 欄位保持填縫不受 tint 染色。32 組 seeded tones 與 96×96 grain 預算；4 columns／8 rows、0.4 m tile，目錄 515 種。取樣無 trig、sqrt 或配置；opaque dielectric，不新增 geometry、透明度或鋪磚模擬。

`hexkeys` 以兩條直線與一段 quarter-circle 的相切距離場形成不等長 L 形棒材，兩端另乘 compact 平切 bevel。橫截面為平頂加兩個線性側稜坡面，僅在 ramp 端點窄帶用 C1 quadratic rounding；沿連續 elbow frame 保留 faceted profile，不以圓線 capsule union 冒充六角棒。16 組 seeded exact quarter-turn／tone 預算，96×96 grain 只在棒面混合，cell 邊界為定值 opaque backing。4×4、0.4 m tile，目錄 516 種；metallic map 與預設 factor 都為 1，沿既有 maps／height／ownership。取樣只在彎肘分支取 radial sqrt，無 trig 或配置；不新增工具 geometry、機械裝配或物理。

`driedfigslice` 以隨縱向縮放的橢圓座標產生收窄輪廓，外皮與果肉皆為 compact squared profiles；整數 angular wrinkles 僅在 rind annulus 評估，避免中心 atan2 singularity。逐果 10×10 籽格預算 jitter／ellipse axis／tone，最大 seed radius 加 jitter 不越 owner cell；以果肉 coverage 裁切外圈籽，確保色、height、roughness、AO 一起退回果皮。96×96 grain 與籽粒微凸面混合，外部 backing 為定值。4×4 切片、0.24 m tile，目錄 517 種；opaque dielectric，不新增 geometry、透明度、食物生成或生物模擬。取樣無配置，籽軸 trig 預算、只有外皮 angular crease 使用 atan2／sin。

`creamcrackers` 以 eighth-power rounded square compact profile 建立外緣與內部，兩組週期 ellipse notches 裁出四側波邊；notch support 在 owner ties 前歸零，中心 abs cusp 被零 coverage 遮蔽。Nearest-hole 索引只接受中央 3×3 格，以 compact squared pit profile 同步降低 pigment／height／AO、提高 roughness，避免壓痕延伸至外緣。32×32 blister field 讓氣泡略凸且烤褐，96×96 grain 與 16 組 seeded tones 微調餅色，所有細節隨 face／interior coverage 消失。4×4、0.24 m tile，目錄 518 種；opaque dielectric、metallic 0，取樣無 trig、sqrt 或配置，不新增 geometry、透明孔、烘焙或食物物理。

`doorkeys` 先以 compact smooth product union 合併圓 bow／窄 neck／單側加寬 blade，再統一扣除 bore 與三處 ellipse bittings，使接頸共平面、不因多片重疊抬高。每匙 exact quarter-turn／tone 與三組 inverse squared cut depths 預算，cut support 在 nearest-bitting ties 前歸零；縱向 compact groove 同時降低 color／height／AO 並增加 roughness，斜半平面裁出匙尖 bevel。96×96 grain 只在 key face 混合，孔與外部保留定值 opaque backing。4×4、0.32 m tile，目錄 519 種；metallic map／預設 factor 皆為 1，取樣無 trig、sqrt 或配置，不新增 geometry、透明孔、鎖芯或機械模擬。

`dodecagontiles` 使用 canonical 3.12.12 lattice：apothem 1 的十二邊形由六對相反半平面相乘，hexagonal center lattice 的兩個鄰列各取最近 column；兩族小三角面直接以三條半平面定義，inradius 為 2/√3−1，不從單一大磚 owner 推導 tone，避免 Voronoi corners 的色差裂縫。各面內縮 grout 並以 compact bevel 同步退回中性 mortar；56 組大磚及 112 組嵌片 seeded tones 預算，釉面保持共平面。7×8 rectangular period 正規化方形 UV，兩軸約 1% 尺度差，不宣稱實體正多邊形的量測精度。0.7 m tile，目錄 520 種；96×96 grain、取樣無 trig、sqrt 或配置，opaque dielectric，不新增 geometry、透明度或鋪磚模擬。

`ballchain` 預算四條兩週期 meander 的 32 個珠心／tone、逐珠 next-segment dx 與 inverse squared length。每像素取最近珠及跨其上下的單一線段，先混合細頸圓冠、再以 compact sphere coverage 覆蓋球珠，避免 connector 高度穿過珠心；segment owner 轉換位於完整球冠內而被遮蔽。Spherical sqrt 僅在 bead support 內計算，96×96 grain 只取樣可見珠面；珠緣 coverage 以平方階消失，保持 height C1 與連續法線，column 外為定值 backing。4×8 珠、0.064 m tile，目錄 521 種；metallic map／預設 factor 皆為 1，取樣無 trig 或配置，不新增 geometry、透明度或鏈條物理。

`succulentrosettes` 預算 16 株各 18 片葉的 axes／radial offset／inverse dimensions／lift／tone；三圈 leaf whorls 由外往內 painter-blend，各內圈遮住先前狹窄葉基，不把各葉高度相加。橢圓 transverse width 隨 along 增大形成匙形，先剔除 longitudinal support 外取樣以保持分母正值；compact face、convex dome 與抬起的 rounded tip 同步控制 color／height／roughness／AO。外輪六葉、中輪轉半葉距、內輪六葉更高，leaf support 全在 radiusLimit 與 cell seam 前消失。96×96 grain、取樣無 trig／sqrt／配置；4×4、0.64 m tile，目錄 522 種。Opaque dielectric，不新增 geometry、透明度、次表面散射或生物模擬。

`foldingfans` 預算十三條 ray axes 與 16 組 paper tones；nearest-ray compact capsule 畫木扇骨，annular squared-radius／sector 半平面覆蓋紙面，angular cos 畫十二道起伏摺痕。中心完整 pivot cap 遮住 atan2 singularity 與近根部 ray ties；扇釘外各木骨 support 分離，nearest-ray 更換前已退回 backing。紙面後混合遮住上段扇骨，保留較低露出骨架與兩側護骨，不加疊骨架厚度。圓釘最後覆蓋所有根部，孔間為 opaque backing。4×4、1 m tile，目錄 523 種；96×96 grain，取樣無配置、ray trig 預算，紙面 angular fold 使用 atan2／cos；opaque dielectric，不新增 geometry、透明孔、開合動畫或摺紙物理。

`togglebuttons` 預算 16 組木色與 grain phase，checker-quarter-turn cell 內用長向四次方／橫向平方的 compact barrel mask，保留拉長桶腹與圓滑收束端部。凸冠抬高中心、縱向彎曲 sine grain 加入細木孔；兩個 squared-circle bore shoulders 混合較暗較低的 opaque pit，不穿透到透明。nearest-bore 在兩孔 support 外換 owner，cell 與 wrap 邊界全部退回固定 backing；採樣不建物件、不跑 hash 或 trig axes，不改既有 kind 輸出。

`greenpeapods` 預算 16 組 shell tones，±45° cell 內用 curved centerline 與 compact pointed lens 畫封閉外殼。五組 compact elliptical pea crowns 在莢內抬高、nearest-pea 於 support 間隙換 owner；lens shoulder 內側增高雙縫脊。短柄先混合、莢殼後覆蓋接合處，不把柄高累加到殼上。96×96 grain，採樣不配置、hash 及 axes trig 不進熱路徑；opaque dielectric，不新增透明外殼、幾何或植物物理。

`beltbuckles` 用 rounded-rectangle signed distance 的 compact 管截面畫連續金屬框，圓角與直段相切；compact capsule 畫較低中柱，框後混合遮住柱端。正寬度 smooth taper 與 compact axial masks 畫較高扣舌，圓 pivot 最後覆蓋舌根；交接高度不相加。4×4 checker-quarter-turn、16 組預算 tones、8×128 brushed grain，取樣不配置、不跑 hash 或 trig axes；metallic factor／map 沿既有全金屬樣式為 1，開口是較暗較低 opaque backing，不是透明孔或獨立皮帶材質。

`hextruchettiles` 沿 staggered triangular lattice 比較兩個 bracketing rows 的最近 column，七列八行 wrap owner 預算兩種 arc turns／tones。六條邊以三組相反半平面的 compact masks 相乘，避免 max-edge 在 bevel 角平分線產生 cusp；owner 更換位於完整凹灰縫。兩組各三個交替 hex vertices 預算為 circle centers，squared-radius compact bands 形成三段不相交弧，於六邊中點成對接續；flat face height 不含 motif 起伏。64×64 grain，採樣無配置、hash／trig 預算；0.7 m square UV 對 canonical 7×4√3 lattice 約 1% 軸伸縮，不作量測級正六角幾何宣稱。

`scoredmango` 用兩層 compact elliptical masks 保留外皮邊與內果肉；橫直交替 cell 內的兩組周期 cut masks 相乘為果肉方塊，方塊以正向凸冠抬高，十字切線保留較低連續果肉 floor，不切穿外皮。方塊 support 先乘 flesh mask，橢圓外不漏出矩形；內部 grid wrap 更換前已退回相同 cut floor，C1 不受 fract owner 影響。預算 16 組 tones、96×96 grain，採樣無配置、不跑 hash 或 trig；只是 opaque 表面浮雕，不建立翻開果塊 geometry。

`waxseals` 預算 16 組 phase／tone，七／十一 angular waves 只改外部 compact melt mask，固定 smooth radial dome 不讀 angular radius。圓形 compact stamp 壓低中心、squared-radius ring 增高凸緣，五瓣 cosine-radius compact emblem 增高徽記。外邊與徽記的 angular guards 均落於所有 phase 已全覆蓋的區域，因此 atan2 分支與中心奇點不進入高度／顏色；所有 cell／wrap 邊界退回固定 backing。96×96 grain，取樣無配置／hash，但輪廓用 atan2／cos；opaque dielectric，非熔融模擬或可輸入印章 API。

`cottonbolls` 預算四組 tuft／45° bract axes 與 16 組 tones，compact 圓棉團 union 覆蓋 compact pointed-lens 苞片。棉團高度以 tuft 權重正規化 dome，不相加或硬 max；四個峰冠高於共享中心，重疊處無 owner 跳動。256×256 fine／96×96 nap 僅添加不透明纖維斑理，高 roughness，不代表真實毛線 geometry。Cell 交替轉 45°，所有 support 在邊界前退回固定 backing；採樣無配置、hash、trig 或 sqrt，非透明纖維或植物模擬。

`carabiners` 預算 clockwise 凸四邊形四段端點、向量、逆長平方及外法線；compact squared-distance offset band 畫出直段與頂點圓角相切的框。Inside exclusion 位於零 support strip 內，避免內部 polygon 距離也形成一圈；nearest-segment ties 在圓角共享同一頂點，gate 只在斜邊中段生效、owner 更換前已歸零。Gate window／兩個 compact 接縫調整金屬門閂，鉸釘最後混合、不累加底框厚度。16 組預算 tones、8×128 brush，取樣無配置、hash、trig 或 sqrt；metallic 1 含 opaque backing，非真實機構或承重模型。

`pencilends` 預算三組相反 hex plane axes、16 組 wood phase／tone 與 30° cell rotation；相乘 compact 半平面分別畫六角漆邊與內木面，避免 max-edge bevel cusp。圓形 squared-radius shoulder 將略低實心石墨芯混合進平木切面，非透明孔；木紋為帶輕彎的細紋與 pores，不假造以筆芯為樹心的年輪。漆／木／芯各有 roughness，96×96 fine，採樣無配置／hash／sqrt，木紋仍用 sin；opaque dielectric，不新增鉛筆 geometry 或操作 API。

`corrugatedplasticedge` 預算 8 組 row tone 與 64×64 grain，交替半格 row offset 隱藏在板外 backing。Compact squared-distance bands 畫兩層平直 liner 與直 web，後者在 liner 外緣前 C1 收尾；以 `1-(1-liner)*(1-web)` 合併同高 cut face，T-junction 不疊加高度。四欄位沿同一 face coverage 混合，矩形槽保留連通低暗 opaque backing；採樣無配置／hash／sqrt／trig。Opaque dielectric，不新增板 geometry、穿孔透明度或結構物理。

`haircombs` 預算 16 組 tone 與 96×96 grain，交替 quarter-turn cell 座標。相乘 compact half-planes 畫平整梳背，只評估最近一根梳齒：squared-distance 橫截面配 C1 smooth taper 與端部 shoulder，齒寬始終小於半 pitch，owner 邊界前已退為零。Spine／tines coverage union 保持根部同高，齒間是連通低暗 opaque backing；採樣無配置／hash／sqrt／trig。不新增梳子 geometry、透明塑膠或頭髮物理。

`blackberries` 預算 19 組交錯 triangular-lattice centers、16×19 seeded drupe tones 與 96×96 grain，quarter-turn cell 配 1.5 倍長軸。採樣先剔除 fruit bounds，再計 compact squared-radius coverage／convex dome；以 coverage union 合併輪廓、normalized dome／tone weights 混合小核果，避免重疊加高或 hard nearest-lobe cusp，保留低而填實的接縫。只有有效果面採 grain，採樣無配置／hash／sqrt／trig；opaque dielectric，不新增果實 geometry、透明果肉或植物／食物物理。

`musselshells` 預算 16 組 phase／tone 與 96×96 grain；normalized `(27/4)*t²*(1-t)-x²/width²` 畫窄鉸端與圓寬尾，compact shoulder／smooth cap 形成 C1 外緣與凸冠。以鉸端 squared Cartesian distance 驅動 18-cycle 參數的 chirped cosine 細槽，曲線間距可變且無 radial origin singularity，非放射肋；零 support 先剔除，採樣無配置／hash／sqrt，僅有效殼面用 cos 與 grain。Opaque dielectric，不新增貝殼 geometry、開合或生物物理。

`safetypins` 預算兩段 capsule 資料、16 組 tone 與 96×96 grain；squared annulus 畫完整彈簧圈，point-to-segment squared distance 畫兩針腳，bounded coverage／crown unions 讓線圈接點不超過同一線徑頂高。較高 compact ellipse 護扣覆蓋針尖，再在護扣上混合低淺橢圓凹縫，非切穿孔；零 wire／guard support 不採 grain，採樣無配置／hash／sqrt／trig。Opaque metallic，factor／map 1 含 backing；不新增別針 geometry、開合、彈簧或穿刺物理。

`poppyseedpods` 預算八組 radial axes、16 組 tone 與 96×96 grain；compact ellipse 畫封閉凸果身，正寬度 floor 的 cosine 縱肋避免果端頻率發散，細梗用 compact bands。柱頭盤在扁橢圓座標合併中央圓面與八組徑向橢圓 lobes／rays，全用 bounded coverage unions、無 atan2 origin seam；梗→果身→柱頭盤逐層替換高度，不疊加厚度。Crown bounds／全零 support 先剔除，採樣無配置／hash／sqrt，只有有效果面用 cos；opaque dielectric，不新增植物 geometry、開裂或散播物理。

`leatherbookspines` 預算 8 組 spine tones、128×256 grain 與 256×256 pores；compact half-plane face 在書縫／上下端隱藏 owners，smooth squared transverse cap 畫凸弧書背。四道 compact squared-distance bands 用 quadratic y warp 隨弧面彎曲，superellipse 外框／內 panel 形成淺凹面與凸 rim；bounded bands union 不交疊增厚。Grain／pore shoulder 同為 C1，零 face 不採細節，採樣無配置／hash／sqrt／trig。純 opaque dielectric，無金屬 foil／文字，不新增書本 geometry、排版或翻頁物理。

`matchsticks` 預算 16 組 wood phase／tone 與 128×128 coating fine；compact half-planes 畫近乎平整方棒與 square end bevel，弱彎曲 sin 細紋沿棒身延伸。Compact ellipse 配 smooth cap 畫凸圓塗頭，以較低 pigment scalar 映暗紅、較高 wood scalar 映淺木色，塗層覆蓋木身時替換高度而不相加；塗頭 roughness 與木面獨立，零 support 不採細節。採樣無配置／hash／sqrt，木紋仍用 sin；純 opaque dielectric，不新增 geometry、點火、燃燒或 emissive flame。

`porcelaininsulators` 預算 16 組 tone 與 96×96 glaze grain；compact squared-width core 連續穿過五個扁 ellipse skirts，bounded coverage／crown unions 合併裙面，較高傘裙依 coverage 替換低 neck，再覆蓋 convex ellipse cap，不在 core 接點疊高。零 support 不採 glaze grain；採樣無配置／hash／sqrt／trig。Opaque dielectric、無金屬接頭，不新增 geometry、電場或電氣安全認證。

`dominoes` 預算 16 組 tone、32 組七種標準 pip bitmask 與 96×96 grain；八次 superellipse 形成圓角牌面，compact squared ellipse pips 與中央兩軸 squared bands 挖出填實凹面，凹點／分隔槽不穿透 backing。相鄰半面 ownership 邊界不在任何 pip support 內；非 face 跳過 grain／pips。採樣無配置／hash／sqrt／trig，不新增 geometry／遊戲規則／物理。

`woodenspoons` 預算 16 tones、128×16 縱向纖維與 96×96 fine grain；compact elliptical bowl coverage 包含更小的 smooth filled cavity，固定高緣減去 cavity 深度；正寬度漸寬 handle 的 squared dome 與兩端 compact bands 維持低頸連續。Bowl 依 coverage 替換低柄而不疊高，凹碗底仍高於 backing；零 support 不採纖維／grain。採樣無配置／hash／sqrt／trig，不新增匙 geometry、容積／流體或食品安全認證。

`chessrooks` 預算 16 tones 與 96×96 grain；compact rectangular crown 扣除兩道向外 notch，正寬度 tapered squared dome 畫收腰 shaft，三個 compact ellipses 畫上下 collars 與寬 base。Bounded coverage union 配合 normalized component relief，接點不疊高且 shaft 連續；零 weight 不採 grain。採樣無配置／hash／sqrt／trig，不新增棋子 geometry、棋盤／棋規／棋力或物理。

`threadspools` 預算 16 tones／phases 與 96×96 grain；compact squared-width core／thread barrel 配合兩端 bands，兩個對稱 compact ellipse flanges 蓋住低線筒。Squared parabolic periodic bump 在 winding 接縫斜率歸零，十二週期跨 windingLength，保留弱斜向繞線；thread 與 flange 依 coverage 替換而不疊高。零 support 不採 grain，零 thread 不算 winding，採樣無配置／hash／sqrt／trig；不新增 geometry、解捲／張力或布料物理。

`bellpepperslices` 預算三軸、16 tones／96 seed tones 與 96×96 grain；外／內三圓 compact coverage unions 的差形成三瓣果肉環，core 與三條 squared-width 膜支撐六個 compact ellipse 籽粒，膜／籽裁進 outer support。較低胎座替換環面，籽粒以 normalized relief 覆蓋胎座，不疊高，空腔仍為低 opaque backing。零 support 不採 grain，採樣無配置／hash／sqrt／atan2／trig；不新增 geometry、透明開孔或食物／生物／流體模擬。

`sharkteeth` 預算 16 tones／serration phases 與 96×96 grain；三組 compact halfplanes 畫尖三角冠，兩側寬度加入 squared parabolic periodic serrations，tip／base fade 使齒尖與根部平順。Positive dome floor 避免近尖端除以零，只在 crown support 內取樣；低矩形 neck 連接兩個 compact ellipse roots，normalized root dome 不疊高，root 覆蓋低冠／頸。零 support 不採 grain，採樣無配置／hash／sqrt／trig；不新增 geometry、物種／年代鑑定、牙科／生物模擬或物理。

`grinderburrs` 預算 16 tones／phases、三孔中心座標與 96×96 grain；squared-radius annulus／compact hole masks 保留中央與三個低 opaque 金屬孔底。整數六 flutes 使 angle branch 週期閉合，bore 零 support 避開 atan2 原點，angle 加 squared-radius phase 畫彎刃，squared parabolic periodic bump 形成刃／槽高度與粗糙度差。零 face 不採 atan2／grain，採樣無配置／hash／sqrt／sin／cos；沿既有 all-metal 預設契約，不新增研磨 geometry、切削／咖啡研磨模擬或物理。

`cowhide` 重用 shortFur 的 40×32 seeded 短毛中心／軸與 3×3 compact ellipse lookup、5×7 warp、96×64 grain；僅此 kind 加預算 4×4 pigment noise，以 0.18 warp mix 與 smooth threshold 形成圓潤黑白不規則斑。Pigment 只改 color，既有 pile height／roughness／AO 保持獨立，白黑邊界沒有假凹槽；不為舊 fur kinds 配置新 patch field。沿既有短毛取樣與 ownership，不新增 geometry、梳理／布料／生物或動物模擬。

`spaltedwood` 沿 cached anisotropic wood pattern 預算 96×4 grain／192×8 fiber，加 4×5 zone／8×8 variation；smooth compact isoband 與正值變動寬度畫深色分區線，coarse field 混入弱 variation 避免規整邊界。Line 僅影響 color，不參與 height／roughness／AO；木紋微起伏連續，不挖真裂縫。採樣無配置／hash／sqrt／trig；不新增 geometry、腐朽／真菌生長／生物模擬或結構安全判定。

`canlids` 預算 16 cell tones 與 96×96 grain；4×4 交替直橫圓蓋以 squared-radius compact support、compact annular band 畫補強凸環／細凹 score。上層橢圓 tab 扣兩橢圓孔，獨立凸圓鉚釘最後 replace；孔露下方蓋面，層相交不疊加 height，roughness／AO 同步刻線與金屬拋光。所有空隙有 opaque metallic backing，採樣無配置／hash／sqrt／trig；不新增 geometry、開罐／撕裂／變形或力學模擬。

`crinoidossicles` 預算 16 份 tone／phase／radius²／inverse bevel、96×96 grain／16×16 sediment；4×4 變半徑圓盤，五次角 cosine 控制中央星狀 filled lumen，完全飽和的中心遮住角極點。以 T4(cos(5θ)) 共用同一 cosine 產生 20 道細脊，compact squared-radius annular fades 限在關節面，不在中心放射奇點；外圓 bevel／沉積填充層 replace，不疊高。採樣無配置／hash／sqrt，僅盤內非飽和中心區需 atan2／一次 cosine；不新增 geometry、透明孔洞、物種鑑定或古生物／生物模擬。

`pythagoreantiles` 由 (2,1)／(-1,2) 晶格定義大小方磚，正方重複週期 5；(i+2j) mod 5 的 owner id 在 UV 整數移動下不變，十份預算 tone 配合 64×64 grain。每點檢查四個可能大方磚與一小方磚，compact square bevel 在 owner 變更前歸零；各面不重疊、不沿晶格切碎完整方磚。所有面共用 height／recessed mortar 與 roughness／AO，採樣無配置／hash／sqrt／trig；不新增 geometry、施工／結構或物理模擬。

`dinnerforks` 沿 haircombs 最近一齒取樣，只讀四齒中最近的 compact tapered support，支撐在 owner 交界前歸零；圓端 ramp、正值變寬 body、寬頭轉細頸與柄尾 widening 保持 C1。預算 16 tones／96×96 grain，4×4 交替直橫；body/tines bounded union 與 normalized component relief 接合四齒根，不因重疊加厚。Opaque metallic backing 填補三道開口，採樣無配置／hash／sqrt／trig；不新增 geometry、通透孔洞、食物接觸／變形或物理模擬。

`goldbrocade` 與 damask 共用預算 12 compact Cartesian petals/leaves，保留舊 damask 輸出；64 週期 warp／weft 的 bounded union 乘花葉 coverage，形成 exposed supplementary gold thread mask。Mask 同時混合深底布與高金線 color／height／roughness／AO／metallic，花內 yarn interstices 保留 dielectric cloth，公開 metallic factor 1 不把 cloth 變金屬。無金線處略過 satin cosine／gold layer；只重用既有 phase／detail／三角場，不加採樣配置／hash 或第二套 motif 慣例。不新增 geometry、透洞、紡織／布料／光譜或物理模擬。

`mudtiretracks` 僅預算兩份 seeded phase、8×8 soil／128×128 grain；最近 track 中心的 compact squared transverse support 形成凹輪轍，36 週期 compact bands 以 transverse² warp 出平滑弧形胎塊，避免 abs 尖點。泥緣為外側 compact squared-distance band，裸泥／車轍同場連續；無輪轍／泥緣處提早返回，不算胎塊 phase。採樣無配置／hash／sqrt／trig，pressed height 向下而非橡膠凸塊；不新增 terrain geometry、車輪／碰撞／動態變形／車輛或物理模擬。

`peacockfeathers` 沿既有 armorCells 與 feathers shared branch：8×4 seeded variation／lean、同一 periodic back-to-front vane coverage、rounded barbs／shaft relief。僅此 kind 預算眼斑 ellipse inverses，以 compact outer／inner／offset pupil 三層 pigment 畫金綠眼斑；不改 height／roughness／AO／metallic，避免假環槽或瞳孔凹洞。不另建羽毛 sampler 或新增採樣配置／hash／sqrt／trig；不新增 geometry、透洞、梳理／鳥類／生物或虹彩光學模擬。

`tangramtiles` 沿 cairotiles convex half-plane 慣例，預算七片 CCW polygons 共 23 個 normalized planes／8 offsets、2×2×7 seeded tones 與 64×64 grain；形狀面積為 1/4×2、1/8×3、1/16×2，包含傾斜平行四邊形。各 plane 的實際垂直距離 smooth shoulder 相乘，正值 grout inset 保留七片獨立面，支撐在 cell owner 交界前歸零；顆粒項皆乘 face，避免 roughness 在 grain early-out 邊界跳變。取樣逐片 plane 支撐歸零即停止，無配置／hash／sqrt／trig，不新增 geometry、互動拼圖或物理模擬。

`batterypositivecaps` 沿 grommetcanvas mixed-metallic replacement blending 與 canlids squared-radius shoulder 慣例，預算 16 tones／96×96 grain、三層同心 compact covers。先覆金屬外蓋／捲邊，再覆非金屬淡絕緣環，最後覆高金屬接點；同一 coverage 混合 color／height／roughness／AO／metallic，絕緣環不因 material factor 1 變成金屬。外蓋支撐外直接返回固定 opaque 非金屬背底，內部 grain 隨 compact cover 淡出，cell owner 切換不跳變；採樣無配置／hash／sqrt／trig，不新增 geometry、導電／電化學／電路或物理模擬。

`passionfruitslice` 沿 driedfigslice 預算 jitter／rotation 的 compact cached owner 慣例，4×4 果實各 8×8 seed poses（位置／cos／sin）與 96×96 grain；jitter + 最大果囊半徑 0.488 <0.5 owner，單查表即可，不掃鄰格。Normalized ellipse 的 fruit／pith／filled pulp shoulders 逐層 replacement blend，果漿裁切外緣果囊；凸金果囊以同一 ellipse coverage 混合 color／height／roughness／AO，較小深籽只改 pigment，保留凸冠不刻凹孔。Body／pulp 支撐外略過內層工作，採樣無配置／hash／sqrt／trig，不新增 geometry、透明／SSS／透射、生物或物理模擬。

`screwterminalblocks` 沿既有 compact slab／radial covers、screwhead bounded cross union 及 mixed-metallic replacement blending，預算 16 seeded tones／96×96 grain。塑殼正值矩形 support 裁切所有子層；沉孔之上覆金屬螺絲，有限長十字槽降低色／高度／AO 而仍是金屬，接線口覆 opaque 非金屬低底，再覆低於塑殼的金屬接片。Head／port／contact 的零支撐分支略過後續工作，body grain 隨 coverage 淡出，採樣無配置／hash／sqrt／trig。不新增 geometry、通透孔洞、導電／電路／機構或物理模擬。

`dragonfruitflesh` 沿 cached compact seed owner 慣例，預算 20×20 jitter／rotation poses 與 96×96 grain，jitter + 最大半徑 0.44 <0.5 owner，查單 cell、不掃鄰格。細長 ellipse compact kernel 僅混合深色 pigment／較低 roughness，白果肉 height／AO 跨籽連續，避免把籽誤刻成孔；支撐在 owner 切換前歸零、grain 自身 periodic。取樣無配置／hash／sqrt／trig，不新增 geometry、透明／SSS／透射、生物或物理模擬。

`speakercones` 沿既有 squared-radius covers／compact annular bands，預算 16 seeded rib phases／96×96 grain。正值 opaque backing 上逐層覆外框／rounded rubber roll、parabolic paper dish 與凸中央 dust cap，replacement blend 避免疊層抬高；48 細放射紋僅在 compact paper annulus 計算 atan／cos，雙 radial fades 完全排除極點與 paper／surround 接縫。Body／cone／dust 支撐外略過後續工作，grain 隨 coverage 淡出，採樣無配置／hash／sqrt。不新增 geometry、透孔、聲學／電機／振膜或物理模擬，不改 Audio。

`septarianstone` 重用 crackleglaze 的 cached jittered Voronoi 半平面 constructor，以各 kind 的 cell count 建表，舊 glaze 仍用 16×16、新材質 8×8；bounded 3×3 candidates／compact C1 half-plane products 形成石質，零 face 提早停邊。預算 64 tones、96×96 grain、8×8 脈寬場與兩個 4×4 warp fields；石質 tone 隨 face 淡出，避免 nearest-owner 色跳。乳金 calcite 填滿其餘正值連續表面，較低 roughness 與微凸 height，不是黑色凹縫；取樣無配置／hash／sqrt／trig，不新增 geometry、透明晶體、礦物層或地質／物理模擬。

`axialresistors` 沿 compact shaft／elliptical capsule／replacement field 慣例，4×4 交替 ±45° 本體保留細引腳在 size 32 的可見取樣，預算 16 tones／96×96 grain。兩端 compact lead 先覆 opaque backing，再以圓頭 capsule replacement 覆蓋高絕緣本體與 metallic fade；有限三道深環查單 nearest band，另一道淡環獨立，support 在 owner 邊界前歸零。塗裝只改 pigment／roughness，不改 height／metallic；body／lead 都零時略過 grain，採樣無配置／hash／sqrt／trig。不新增 geometry、阻值編碼、導電／電路／電熱或物理模擬。

`tomatoslices` 沿 cached rotated chamber axes／compact radial covers 慣例，預算 4×4 ×5 種室 axes、16 tones／96×96 grain，rotation trig／hash 留在 constructor。Squared-radius outer／flesh covers 上，五個互不相接 compact ellipse gel 保留實心紅肉 septa／central core，各內兩 compact pale seed，gel 零時略過種子；所有支撐在 rind／owner 邊界前歸零。種室僅較低但填實、籽微凸，AO 不刻洞，body 外略過 grain／chambers；採樣無配置／hash／sqrt／trig。不新增 geometry、透明／SSS／透射、生物或物理模擬。

`pinstripewool` 與 twillweave 共用既有 compact warp／weft、2-over-2 exposure／top relief，保留舊 preset／運算順序，只分支換 narrow dyed warp pigment。48×48 紗線、每八根一根淡經紗、128×128 cached grain；compact warp 讓 col ownership 前染色歸零，深緯紗依既有 exposure 遮住淡紗，dye 不改 height／roughness／AO。48 密度避免 size 32 的半像素剛好全落在 64 紗線 gap，亦維持 4／8 的完整 repeat。採樣無配置／hash／sqrt／trig，不新增 geometry、透孔、毛髮／sheen BRDF、布料或物理模擬。

`chrysanthemumstone` 沿 cached rotated compact ellipse 慣例，預算 16 rosette poses／每組 12 blades 的 axes 與 reciprocal squared extents／96×96 grain。Jitter + conservative bound 0.454 <0.5 owner，查單 cell；支撐外略過 blades，compact union 的 outside=0 提早停瓣，無角度極點。白晶紋／共用 pale hub 只混 pigment／較低 roughness，height 與 AO 跨晶紋連續；不疊凸起、不雕花心。採樣無配置／hash／sqrt／trig，不新增 geometry、透明／晶體折射、礦物鑑定／地質或物理模擬。

`sewingsnaps` 沿 squared-radius covers／compact annular ridge／mixed-metallic replacement，預算 16 tones／96×96 grain。交替 male domed post 與 female metal socket／opaque bore，rounded rim 較高於盤面；四個 cardinal 縫孔只查最近一孔，compact support 在 axis／sign owner 邊界前歸零。孔底 coherent replacement 色／高度／roughness／AO／metallic，非金屬底不被 factor 1 金屬化；body 零時略過後續工作，採樣無配置／hash／sqrt／trig。不新增 geometry、通透孔、縫線、扣合／彈簧或物理模擬。

`lathplaster` 沿 cached rotated compact patches／periodic warp／replacement fields，預算四個 jittered rotated patches、16 row tones、96×96 灰泥粒、4×128 水平木纖維與雙 8×8 warp。Conservative support <0.437 owner、查單 cell；高灰泥覆蓋較低 compact horizontal laths 及 opaque gap floor，失去灰泥只向下露底、不捲高邊。Row tone／fiber 隨 lath cover 歸零，完整灰泥略過 wood sample；採樣無配置／hash／sqrt／trig。不新增 geometry、通透孔、釘／縫線、破壞／結構或物理模擬。

`ceramiccapacitors` 沿 compact paired leads／ellipse cover／coherent mixed-metallic replacement，4×4 交替斜向圓片預算 16 tones／96×96 grain。兩引腳同側，查 nearest sign 的 compact shaft，支撐於 sign owner 前歸零；先覆較低 metal leads，再以高 convex dielectric disc 覆 roots，metallic 隨覆蓋歸零。Body／lead 零時略過 grain，所有 squared reciprocal 預算，採樣無配置／hash／sqrt／trig。不新增 geometry、電容量編碼、導電／電路／電熱或物理模擬。

`fennelseeds` 沿 cached poses／compact spindle／coherent fields：8×8 的 64 poses 含軸向、jitter／tone，96×96 grain；quadratic bow 與 squared tapered cap 構成尖梭體，五條 finite compact ribs 以 outside-product union 收斂，不除消失尖端寬度、不採 nearest-rib seam。Conservative support <0.418 owner、只查單 cell；body 零略過 ribs／grain，預算 reciprocal，採樣無配置／hash／sqrt／trig。不新增 geometry、重疊散佈、植物生長／營養／味道或物理模擬。

`ballbearingfaces` 沿 compact annular covers／squared-band channel／coherent ball replacement，預算 16 tones／96×96 grain／reciprocal squared extents。Cardinal／diagonal octant 單次選 nearest ball，radius 0.073 <半區分界距離 0.29 sin(π/8)，owner 前 sphere support 已歸零，無 atan2／逐球 scan。高金屬圈覆較低連續滾道，再覆八高凸鋼球；bore／背底 metallic 0、支撐漸變，face 零略過 channel／balls／grain；採樣無配置／hash／sqrt／trig。不新增 geometry、透明孔、保持架、滾動／旋轉／潤滑／機械或物理模擬。

`baseballleather` 沿 cached grain／compact seam／capsule thread／coherent replacement，預算 40 row tones／96×96 grain。Periodic polynomial bow 導數於 v wrap 歸零、雙列鏡向；最近 side 的成對膠囊紅線先於 side／row owner 歸零，不逐線 scan。White grained leather→低接縫→高紅線按同一 cover 覆蓋 PBR fields，預算 reciprocal，採樣無配置／hash／sqrt／trig。不新增 geometry、完整球面裁片 UV、規格認證、縫製／布料／碰撞或物理模擬。

`toothbrushheads` 沿 squared capsule cover／compact crown／nearest-grid coherent replacement，預算 16 base tones／288 tuft tones／96×96 grain／256×256 bristle grain／reciprocals。4×4 交替斜向，每頭 3×6 crowns；radius 0.038 <半格距 0.05，nearest tuft owner 切換前 support 歸零，十八束皆在 capsule full cover 內。高粗白冠面覆較低光滑藍塑膠，face 零略過 tuft／grain、tuft 零略過 bristle grain；採樣無配置／hash／sqrt／trig。不新增 geometry、刷柄、透明孔、彎曲／清潔或物理模擬。

`bowtieinlay` 沿 cached orthogonal wood grain／compact hourglass／coherent replacement，預算 6 tones／128×8 板縱紋／8×128 榫橫紋／96×96 micro／4×12 warp／reciprocals。Seeded 彎裂線與 2×3 榫，squared end cover×smooth squared flare side cover 在 owner 前歸零；深色木榫恢復被裂線降低的高度／AO，與板面維持相同微紋高度包絡，不添加凸片。Key 零略過橫紋，採樣無配置／hash／sqrt／trig。不新增 geometry、透明孔、結構補強／強度認證、斷裂／破壞或物理模擬。

`redcabbagecut` 沿 compact squared cut／cached warped phase／filled tissue replacement，預算 4 tones／96×96 grain／16×16 warp／32×32 fold／reciprocals。2×2 紫切面以 squared radius phase 及雙 cached Cartesian fields 折出細淡脈，phase-floor 兩側皆有平 plateau、中心無 atan2／radius 除法；淡實芯為 compact ellipse。Dark rim→purple flesh→pale veins/core 僅改 pigment／roughness，內部 height／AO 同填實層；face 零略過 grain、flesh 零略過 warp／fold／pith，採樣無配置／hash／sqrt／trig。不新增 geometry、透明葉片、透射／subsurface 求解、植物生長／解剖認證或物理模擬。

`slottedturners` 沿 rounded-rectangle／capsule union／compact closed slots／coherent visible coverage，預算 16 tones／8×128 brushed grain／reciprocals。4×4 交替斜向，blade／neck 共用同一金屬高度而非疊高；三個 slot supports 皆在 full blade cover 內、radius 0.035 <半 pitch 0.07，nearest owner 前歸零。Visible=union×(1−slot) 一次覆背底與 metallic，空 body／visible 略過後續 fields／grain，採樣無配置／hash／sqrt／trig。不新增 geometry、長柄、透明槽、彎曲／翻炒／熱傳導或物理模擬。

`triglidesliders` 沿 rounded squared covers／compact mirrored windows／coherent visible replacement，預算 16 tones／96×96 grain／reciprocals。4×4 交替斜向，雙窗支撐在 sign owner 前歸零，所有角 support 限於 cell；visible=outer×(1−window) 使外框／中桿共用同高度，窗內低 opaque 背底。空 face／visible 略過後續 fields／grain，採樣無配置／hash／sqrt／trig。不新增 geometry、透明孔、穿帶／滑動／摩擦／承重認證或物理模擬。

`popcorn` 沿 cached cluster poses／compact squared lobe union／coherent replacement，預算 16 poses／112 lobe centers-radii／128×128 grain／reciprocals。4×4 seeded 旋向，不同距離／半徑／角偏讓白膨瓣連成不規則單粒；product union 與平方 dome union 保持肩 C1、重疊不疊加厚度，彎曲 tapered hull 覆較低焦金殼芯，所有 support 限 cell。空 puff 略過 hull／grain，採樣無配置／hash／sqrt／trig。不新增 geometry、透明孔、烹煮或物理模擬。

`dualinlinechips` 沿 squared rounded covers／compact mirrored nearest pin／dielectric-over-metal replacement，預算 16 tones／96×96 grain／reciprocals。4×4 交替斜向、各側七橫向 capsule pin，radius 0.019 <半 pitch 0.045，nearest／sign owner 前歸零且角 support 限 cell。低金屬腳先覆背底，黑封裝再覆腳根／消 metallic；全在 full package 內的第一腳圓凹點只減高度、不成孔。空 body／pin 略過 fields／grain，空 body 略過 marker；採樣無配置／hash／sqrt／trig。不新增 geometry、電氣或物理模擬。

`tortoiseshellacetate` 沿 cached periodic domain warp／two-scale pigment／flat coherent face，預算 12² macro／32² detail／兩份 4² warp／192² grain／reciprocal。Warped two-scale noise 經 smooth threshold 分琥珀與深褐斑；height 只保留獨立 grain 的 <0.0000021 m 微差、roughness 0.2–0.218、AO 1，不將 pigment 轉成甲片高低／縫／洞。所有 fields periodic C1，採樣無配置／hash／sqrt／trig。不新增 geometry、透射／折射、化學製程或物理模擬。

`cathedralquilt` 沿 compact four-arc products／coherent folded-band difference，預算 36 tones／192² grain／128×8 warp／8×128 weft／reciprocal。6×6 每窗完整評估四 corner circles（不 nearest corner，以免窗尖 cusp），outer／inset 各 product，fold=outer−inset 不疊加厚度；inset 在 cell edges 前 C1 歸零，seeded tone 僅用低藍布片，不在邊界跳變。奶油 frame／高折邊／低 inset 有相異高度、opaque 布面連續；inset 零略過 tone。採樣無配置／hash／sqrt／trig。不新增 geometry、透明窗、折疊／縫製／布料力學或物理模擬。

`buckwheathulls` 沿 cached seeded poses／three-plane compact products／finite tapered ridge union，預算 64 poses／3 axes／128² grain／reciprocals。8×8 隨機旋向與小 jitter，三 inset-plane smooth products 決定三角 body／convex face dome；三細稜在中心與尖端前 tapered 歸零，product union 不疊加厚度。最大 extent+jitter 限 cell，空 body 略過 ridge／grain，採樣無配置／hash／sqrt／trig。三稜 pigment／roughness 與高度同支撐；不新增 geometry、剝殼／生長／烹煮、營養或物理模擬。

`rutilatedquartz` 沿 cached crossed poses／compact tapered needle product union／flat polished face，預算 16×2 bundle rotations／96 needle inverse lengths／8² cloud／128² grain／reciprocals。4×4 每 cell 兩組各三平行針，角差 0.9–1.3 rad；nearest clamp owner 的 radius 0.008 <半 pitch 0.0225，完整 finite support 限 cell。兩針束 product union 只改 pigment，不疊高度／metallic；獨立 grain 維持 height／roughness、AO 1。空 width 略過 cap，採樣無配置／hash／sqrt／trig。不新增 geometry、透明／透射／折射、晶內深度或物理模擬。

`peppermintcanes` 沿 true squared distance to hooked centerline／compact tube cover／pigment-only stripes，預算 16 tones／96² grain／reciprocals。4×4 交替斜向，upper semicircle 用一次必要 radial sqrt 維持等管徑，接兩直線 tangent 與長短 rounded caps；owner 與 cell 邊界皆在 support 外。Tube dome／roughness 不隨紅白 stripe 起伏，stripe wrap 前 plateau 歸零；沿現有 mortar=1−body 混中性 opaque 底，避免紅背景吃掉紅條。空 body 略過 grain／stripe，採樣無配置／hash／trig。不新增 geometry、透明孔、溶化／烹煮或物理模擬。

`rubbergrommets` 沿 compact squared annulus／stepped collar／closed squared groove／coherent replacement，預算 16 tones／96² grain／squared radii／reciprocals。4×4 圓環 outer/bore smooth products 定 body，同橡膠層高內唇／低外法蘭與較低 closed groove；collar／groove 皆在 full body 支撐內，孔底／外背保持低 opaque 非金屬。Support 限 cell，空 body 略過 collar／groove／grain，採樣無配置／hash／sqrt／trig。不新增 geometry、透明孔、彈性／密封／穿線／絕緣認證或物理模擬。

`chioggiabeetcuts` 預算 16 jitter／scale／tone poses、六圈 squared shoulders／reciprocals 與 128² grain；compact 圓形外皮／果肉 coverage，六組內外 smooth products 以 product union 定紅色顏料。所有環支撐完整落在 full flesh 內；白實芯、紅環與白間隙共用同一 flat cut height，薄紅皮較低，非同心凸階。Support 限 cell，body 零略過 grain／flesh，flesh 零略過環；採樣無配置／hash／sqrt／trig。沿 neutral opaque backing mix，不新增 geometry、透明孔、汁液、切割／生長／營養或物理模擬。

`flatflexcables` 預算 16 tones／128² grain／squared radii／reciprocals，4×4 alternating ±45° compact rounded-rectangle 薄片。Half-integer nearest-contact owner 定六條線；trace shoulder／axial tapers 支撐皆在 full body，埋藏線只改 dielectric 顏色／淺脊。單端六枚 rounded capsule 接點 support 也全在 full body、以 coherent replacement 定較低銀色 contact，metallic 僅 contact coverage、film／線／縫／對端／背底皆零，預設 factor 1。Support 限 cell，body 零略過 owner／grain／contacts，採樣無配置／hash／sqrt／trig。沿 neutral opaque backing，不新增 geometry、透明膜、彎折／導電／耐熱認證或物理模擬。

`celerycuts` 預算 16 rotations／tones、五個 vascular centers、128² grain 與 squared ellipse／circle reciprocals。Outer ellipse 減 offset notch 的 smooth products 定開口 body，較小 outer／較大 notch 定 pale flesh，flesh 支撐全在 full body；五圈 smooth vascular product union 支撐全在 full flesh，形成較暗較低 solid dimple。Crescent 支撐限 cell，外皮／果肉 coherent replacement，body 零略過 grain／flesh、flesh 零略過 vascular。採樣無配置／hash／sqrt／trig；neutral opaque backing、非閉環、非透明孔。不新增 geometry、汁液、切割／生長／營養或物理模擬。

`tactileswitches` 預算 16 tones／128² grain／squared radii／reciprocals，4×4 alternating ±45° compact 四層：capsule pins→rounded dielectric housing→rounded metal cover→solid black dielectric plunger。Housing 蓋腳根並清 metal，plate support 全在 full body、plunger 全在 full plate，各層 coherent replacement。Metal map 僅露出腳／上蓋、預設 factor 1；neutral backing coverage 為 body／pin union，support 限 cell。空 body/pin 略過 grain、空 body 略過 plate/plunger、空 plate 略過 plunger；採樣無配置／hash／sqrt／trig。不新增 geometry、按壓／導電／開關邏輯／耐久認證或物理模擬。

`paisleybrocade` 預算 16 rotations／tones、三個 dot centers、192² grain／128×8 warp／8×128 weft 與 reciprocals。Normalized y 定 tapered cap²、變寬與 quadratic centerline bend；兩組 smooth shoulders 相減定 curved pointed outline，三圈 product union 支撐全在 full inset 內，coherent gold-colored dielectric yarn replacement 共用 height／roughness／AO。每 motif compact 限 cell、尖端支撐以零斜率消失；空 outer 跳過 inset/dots、空 inset 跳過 dots。連續 navy weave 不作透明孔或灰底，採樣無配置／hash／sqrt／trig。不新增 yarn geometry、金屬織線或 cloth physics。

`siliconepastrybrushes` 預算 16 tones／128² grain／squared radii／reciprocals，4×4 alternating ±45° compact 長 capsule 柄／rounded 寬頭／七 nearest-owner capsule 刷齒。Head 蓋柄頸與刷齒根、三層 coherent replacement，交接中心有 full coverage overlap、齒間保留 neutral opaque backing。柄端 pit 支撐全在 full handle、保持 solid，所有支撐限 cell、七齒支撐在 owner 邊界前歸零；全 dielectric。空 silhouette 略過 grain、空 handle 略過 pit、空 head 略過最終 replacement，採樣無配置／hash／sqrt／trig。不新增 geometry、毛刷／液體／彎折物理、食品接觸／耐熱認證。

`graphicgranite` 預算 16 tones、96 pointed strokes 的 centers／axes／inverse lengths and widths、8² clouds／192² grain 與 shoulder reciprocal。4×4 cells 各三組 jittered roots／seeded angles／兩條尖細交生 stroke；normalized along² 的 cap 再平方，扣 across² 的 smooth cover 以 product union 定 quartz pigment，端尖零斜率歸零、全支撐限 cell。深淺礦物共用 flat microheight／roughness／AO 1、不作刻字或凸脈。空 along 支撐略過 across、union 已滿即停，full quartz 略過 feldspar cloud；採樣無配置／hash／sqrt／trig。不新增 geometry、透明石英、晶體生長或物理模擬。

`brasspadlocks` 預算 16 tones／128² grain／squared radii／reciprocals，4×4 alternating ±45° compact U 梁／rounded body／solid keyhole 三層 coherent replacement。U 上弧以一個必要 radial sqrt 定真等寬 squared distance、與兩 straight tangents C1 相接，body 蓋根；full body 跳過 shackle work、空 silhouette 跳過 grain、空 body 跳過 keyhole。Circle／capsule stem product union 支撐全在 full body，孔紋仍低 opaque 實芯且清 metal；body/shackle union 定 neutral backing，所有支撐限 cell。採樣無配置／hash／trig，僅 upper arc 一個必要 sqrt；不新增 geometry、透明孔、開鎖／鎖定狀態／安全認證或物理模擬。

`carrotcuts` 預算 16 rotation／jitter／inverse scale／tone poses、12 cached axes／128² grain／squared circle radii／reciprocals。4×4 seeded compact cuts，以 squared cap²−across² smooth covers／product union 定 12 tapered vascular rays，淡髓心 circle cover 蓋色；rind→flesh coherent replacement、髓心與紋路只改 pigment，共用 flat height／roughness／AO 0.99。空 body 跳過 grain、空 flesh 跳過 pith/rays、full pith 跳過 rays、空 along 跳過 across；尖端零斜率歸零、支撐全在 full flesh 及 cell。採樣無配置／hash／sqrt／trig；不新增 geometry、透明髓心、汁液／切割／生長／營養或物理模擬。

`bluepushpins` 預算 16 tones／128² grain／squared flange and neck radii／reciprocals，4×4 alternating ±45° compact silhouettes。Top/base rounded-rectangle flanges 與 capsule waist product union 定 plastic support，尖針以 along cap²−across² smooth cover、端尖零斜率歸零；needle→neck→base→top coherent replacement，塑膠蓋 roots 並清 metal。Full plastic 跳過 needle work、空 needle along 跳過 across、空 silhouette 跳過 grain、空 plastic 跳過三層 replacement；silhouette product union 定 neutral backing、支撐限 cell，採樣無配置／hash／sqrt／trig。不新增 geometry、穿刺／固定承重／透明度或物理模擬。

`oatflakes` 預算 16 rotation／jitter／inverse scale／tone poses、三 cached fiber rows／inverse lengths、64² rim／192² grain／reciprocals。4×4 compact ellipse flakes，僅 rim transition 採樣 noise 變動邊界；coarse field 排空、full coverage 跳過 rim noise。Low pointed central crease 與三對 pointed fiber ridges 全支撐在 full body，cap²−across² smooth covers 端尖零斜率；nearest-row owners 交界在零支撐，較寬纖維顏料對比維持 >0.07。Body coherent replacement 定 low dome／opaque crease 與 neutral backing，空 body 跳過 detail/grain、空 along/cross 支撐跳過後續；採樣無配置／hash／sqrt／trig。不新增 geometry、透明裂縫、烹煮／營養或物理模擬。

`tigerfur` 擴充既有 shortFur 分支，重用 5×7 warp／96×64 grain／40×32 compact C1 directional hair records 與 pile height／roughness／AO，不另建毛髮架構；僅預算六行 fork phase／side 與四 reciprocals。六個 compact squared-distance 波紋帶、每行兩個 cap²−across² 尖枝由根連出再分離，product union 定深色 pigment，橙底與深條紋不改 pile。Row 邊界留零 pigment 支撐、UV wrap periodic；full band 跳過 fork、空 along 跳過 across，新增顏料採樣無配置／hash／sqrt／trig。不新增 geometry、透明度、動物／毛髮／物理模擬。

`grosgrainribbons` 預算四 ribbon tones／96×256 grain／squared radii／reciprocals。四 compact 直帶 body 以 squared-distance cover 定 neutral backing，64 compact transverse rib profiles 與雙側各三 compact selvedge wales 支撐全在 full body；nearest-wale owner 交界零支撐、帶 owner 與兩 UV wraps periodic C1。Coherent body replacement 同步 color／height／roughness／AO，布邊較橫肋高；空 body 跳過 rib／edge／grain、採樣無配置／hash／sqrt／trig。不新增 geometry、透明帶隙、打結／布料／物理模擬。

`azuritemalachite` 預算 16 rotation／jitter／inverse scale／tone poses、三 globule centers／八 ring coefficients、8² clouds／192² grain／squared radii／reciprocals。4×4 compact 三球簇以 smooth squared circles product union 定 azurite、每球兩 annular pigment covers product union 定淡藍細帶，所有 ring 支撐在 full globule、全部支撐限 cell。兩礦物共用 microheight／roughness／AO 1，不作凸球／凹環；full blue union 跳過後續 cover、full ring union 跳過後續 ring work、空 ring extent 跳過 annuli、full green 跳過 blue pigment、full blue 跳過 matrix cloud，採樣無配置／hash／sqrt／trig。不新增 geometry、透明晶體、礦物生長或物理模擬。

`openendspanners` 預算 16 tones／128² grain／五 squared radii／reciprocals，4×4 alternating ±45° compact 雙頭工具。兩大小不同 circle heads 分別扣除朝外的 half-infinite rounded channel，背面與 capsule shaft 完整相接；兩 heads 支撐互斥可直接相加，共用 metal finish，shaft→heads coherent replacement 與 product union 同步 metallic／neutral backing。空 head 跳過 cut、空 silhouette 跳過 grain、空 shaft/head 跳過 replacement；square-distance caps 與 straight tangents C1、支撐限 cell，採樣無配置／hash／sqrt／trig。不新增 geometry、透明鉗口、鎖固／扭矩／工具認證或物理模擬。

`lentilseeds` 預算 16 rotation／jitter／inverse scale／tone poses、128² grain／ellipse squared-axis reciprocals／hilum squared radius reciprocal。4×4 compact near-round ellipse bodies 以 smooth field 定 nonsingular convex dome，短 side-hilum capsule 支撐全在 full body、仍低 opaque 實芯；coherent body replacement 同步 color／height／roughness／AO 與 neutral backing。空 body 跳過 hilum/grain，seed owners／capsule caps and straight tangents／UV wraps C1；採樣無配置／hash／sqrt／trig。不新增 geometry、透明裂口、發芽／烹煮／營養或物理模擬。

`blueprintpaper` 預算 8² cloud／192² grain、七組 squared radii／reciprocals 與 axis-fade reciprocal。兩級 periodic square-distance grid lines 以 product union 交會；compact technical glyph 用 nested rounded-box／circle cover 差值描框、有限 axis masks／dimension capsules 定尺寸與短端刻線，glyph bounds 外跳過全部筆畫、full ink 跳後續 union。Pigment-only printed ink 由 gray-blue grid 下層覆上白線，height／roughness／AO 不依 ink，不造刻溝。Grid owners／stroke shoulders／caps and straight tangents／UV wraps C1、採樣無配置／hash／sqrt／trig；不新增 geometry、CAD 解析／輸出、文字排版或文件認證。

`horsechestnutleaf` 預算 16 rotation／jitter／inverse scale／tone poses、七組 leaflet axes／centers／inverse lengths／tooth frequencies、128² grain 與 squared radii／reciprocals。七 compact pointed cap² 葉片各自從 blade base 起，透過細 capsule petiolules／root junction 接共同 petiole；periodic smooth squared-phase wave 定 C1 微鋸齒、square-distance midribs 較高較亮，支持 product union；stem→blade coherent replacement 同步 color／height／roughness／AO／neutral backing。Extent cull 跳空白、coarse leaf bounds 跳 tooth、full blade 跳 tooth、空 cover 跳 grain，seed owners／pointed tips／tooth wraps／caps/straight tangents／UV wraps C1、採樣無配置／hash／sqrt／trig。不新增 geometry、透明葉隙、植物生長／生理或物理模擬。

`binderclips` 預算 16 tones／128² grain／squared radii and radial bounds／reciprocals、4×4 alternating ±45° compact tools；反射 local y 合兩 U handles，true radial distance 的 constant-width arc 接 straight legs／hidden root caps，必要 arc 計一 sqrt、inner/outer radius cull 跳無效 sqrt、full coat 跳 wire。兩 squared-axis smooth covers product 定 C1 tapered trapezoid，較高 lip capsule 全在 full coat；wire→coat coherent replacement 同步 color／height／roughness／AO／neutral backing、塗層清 metallic，不把黑色塗層算露出鋼。空 silhouette 跳 grain、空 body 跳 lip，owners／arc-straight tangents／coated corners／caps／UV wraps C1，採樣無配置／hash／trig。不新增 geometry、透明孔、夾持／彈簧／承重或物理模擬。

`charoite` 預算 4²／7×5 warp、9² cloud／192² grain，8² compact inclusion pose slots／squared axes、band/fiber squared radii 與 reciprocals；兩級 periodic compact stripes 由共用 domain-warp phase 扭曲成細纖維束／淡寬帶，integer frequencies 與 compact phase zero-support 保 UV seamless C1。Seeded sparse rotated ellipse inclusions 只換 pigment、full inclusion 跳全部 flow；所有色紋共享 grain-only 微 height／roughness 與 AO 1，非 carved veins。Inclusion owners／ellipse shoulders／noise knots／phase wraps／UV wraps C1、採樣無配置／hash／sqrt／trig；不新增 geometry、透明礦洞、礦物生成、動態貓眼光學或物理模擬。

`chenilleyarn` 預算八 tones／1024 tuft poses（center/jitter／inverse length／slope／tone）／128×256 grain、core squared radii／fiber reciprocals。Continuous rounded-core cover 與 compact pointed squared-cap transverse tufts 用 product union，core→pile coherent replacement 同步 color／height／roughness／AO／neutral backing；pile 更高更亮、超出兩側芯邊並有限尖收。Tuft horizontal support ≤0.46、vertical support ≤0.476，皆在 owner ±0.5 前為零，故單 row/column owner 即足、不掃 neighbors。空 cover 跳 grain、full pile 跳 core finish、空 core 跳 dome；core shoulders／tuft tips／slanted shoulders／owners／UV wraps C1、採樣無配置／hash／sqrt／trig。不新增 geometry、透明絨隙、線材拓樸、布料／毛髮或物理模擬。

`ceramicfuses` 預算 16 tones／128² grain、rounded-rectangle squared radius／lateral dome／end-band squared bounds／collar squared-radius reciprocals。4×4 alternating ±45° compact parts 共用 rounded-rectangle coverage 與 x² smooth cylinder dome，y² smooth end bands 換 full-width metal caps，兩 collar 一維 squared-distance cover 全在 full-cap 區較高。Coherent ceramic→cap finish 與共同 body→neutral backing 同步 color／height／roughness／AO／metallic；空 body 跳 grain/finish，無端帽區跳 collars，owners／corner tangents／end-band shoulders／collar shoulders／UV wraps C1、採樣無配置／hash／sqrt／trig。不新增 geometry、透明玻璃、電熱／熔斷模擬、額定值或安規認證。

`hazelnutshells` 預算 16 rotation／jitter／inverse scale／tone poses、96×12 shell-local wood grain／128² fine grain 與 body/scar squared-axis reciprocals。Upper cap²／lower cap 在 equator 值及一階導數相接，compact cover 定尖上圓下整殼／nonsingular convex crown；low pale rough ellipse attachment scar 全在 full shell、仍實心。Grain 評估於 shell-local x/y 使縱纖維隨種子旋轉，wood→scar coherent finish／body→backing 同步 color／height／roughness／AO。空 body 跳全部 detail、full scar 跳 wood、無 scar 跳 fine；equator／body shoulders／scar ellipse／owners／UV wraps C1，採樣無配置／hash／sqrt／trig。不新增 geometry、透明開殼、果仁／烹煮／植物生長或物理模擬。

`yagasuricloth` 預算 16 motif tones／128² grain／shaft and feather squared-axis reciprocals／weave frequency。4×4 compact ellipsoid shafts 與三對 mirrored pointed sheared cap² plumes product-union，alternate column flips y；full shaft 遮住 abs-x join、full motif 跳後續羽、outer-x cull、無 motif 跳 tone lookup／row floor。兩個 weave cosine 經平方及 crossing 權重共用、不重算 double angles，96 threads 在 default 256px 保留法線起伏；128 threads 原 constant-phase alias 已以實際貼圖 regression failing-before／passing-after 修正。顏料只改 color，height／roughness／AO 始終同一連續 woven finish，shaft／plume shoulders／tips／masked axis／owners／wraps C1，採樣無配置／hash／sqrt。不新增 geometry、真實紡織／染色製程／文化工藝認證或 cloth physics。

`balloonwhisks` 預算 16 rotation／jitter／inverse scale／tone poses、3 head inverse axes／128² grain／neck and handle capsule squared radii／ring pitch and shoulder reciprocals。三層 oval wires 用 guarded gradient-normalized implicit squared distance、compact cover／nonsingular round product-union；q∈[0.5,1.5] 外跳除、中心不除零，不稱精確 constant-width。Neck／handle capsules coherent 依序蓋覆 wire finish，four grip rings 只取一 nearest owner 且在 owner 邊界前 C1 歸零。Full handle 跳 neck/wires、full neck 跳 wires、wire cover/round 雙 full 跳後續 loop、空 silhouette 跳 grain；metallic 同共同 cover、間隙 opaque neutral dielectric。Owners／wire and capsule shoulders／guard bounds／tangents／rings／UV wraps C1，採樣無配置／hash／sqrt／trig。不新增 geometry、透明開孔、攪拌／食物接觸認證或物理模擬。

`orthocerasstone` 預算 16 rotation／jitter／inverse scale／tone poses、128² grain／8² dark-matrix cloud／cone length and squared-width／rounded-cap／septum pitch and squared-shoulder reciprocals。Positive z² variable-width cone 與 soft-tip denominator 避免 apex 除零，rounded basal cap 在接點同值同一階導數；八道 parabolic septa 取一 nearest owner、線形在 owner 前 C1 歸零。Color coherent blend pale mineral chambers／dark septa→matrix，height／roughness／AO 不受 fossil footprint 或 septa 影響、全程同一 polish plane，空 fossil 跳 tone/septa、full fossil 跳 cloud。Apex／side/full shoulders／basal cap join／curved septa／owners／UV wraps C1，採樣無配置／hash／sqrt／trig。不新增 geometry、浮雕／挖孔、古生物或石材來源認證／生長或物理模擬。

`rickracktrim` 預算六 column phases／tones、128² grain／wave and fiber frequencies／slope scale／squared-width and selvedge reciprocals。Sinusoid centerline 共用 sin/cos，q=dx²/(1+slope²) 作 local tangent-corrected width、非 exact global distance；各 strip support 在 owner 前歸零。Compact body 與 nonsingular lateral dome，q 上雙側 raised selvedge profiles／diagonal cosine fibers，同步 finish coherent body→backing。空 body 跳 fine grain／fiber／selvedges；wave extrema／slope-adjusted shoulders／selvedge shoulders／column owners／UV wraps C1、採樣無配置／hash／sqrt。不新增 geometry、透明帶間空隙、真實編織或 cloth physics。

`toroidalinductors` 預算 16 rotation／jitter／inverse scale／tone poses、12 winding axes／128² grain／annulus squared radii and dome／wire capsule reciprocals／angular owner scale。Compact dielectric ferrite annulus 與 radial capsule winding 用共同 product-complement union、full core 精確 coverage1；cuprous wire finish coherent 蓋 ferrite/backing，metallic 只同 wire coverage。Radial guard 在中央孔／外側跳 atan2，單 nearest angular owner 配 cached axes、不迴圈掃12線；每 capsule 在 owner 前 C1 歸零，atan2 branch cut兩側同owner。空 silhouette 跳 grain、full wire 跳 core finish。Annulus shoulders／capsule tangents／wire shoulders／radial guards／angular and seed owners／UV wraps C1，採樣無配置／hash／sqrt、只在有效線區 atan2。不新增 geometry、透明孔、漆包線絕緣、引腳、電磁／電熱模擬、額定值或安全認證。

`pennerigate` 預算 16 rotation／jitter／inverse scale／tone poses、128² grain／body squared-width／sheared-end／ridge pitch and squared-radius／mouth squared-axis reciprocals。Compact x-cylinder／y−slope*x 斜端 profiles product coverage，nonsingular lateral crown；五個 nearest-owner longitudinal ribs 在 owner 前 C1 歸零，兩端 reflected ellipse mouths 全在 full body、coherent body-wall→lower darker rough solid mouth finish。空 body 跳全部 detail、full mouth 跳 ribs/wall；body corners／slanted shoulders／ridge owners／mouth ellipses／seed owners／UV wraps C1，採樣無配置／hash／sqrt／trig。不新增 geometry、透明通孔、真實管腔、烹煮／食物或物理模擬。

`lepidolitemica` 預算 144 rotation／jitter／inverse scale／tone poses、128² grain／8² mineral cloud／bevel reciprocal／sqrt(3)/2。三個 cached-direction absolute dot 給六 half-planes，三組 nested hex radii 的 compact C1 half-plane product coverage 構成三個近平解理 terrace；full plate 精確遮 underlying cloud finish，inner/middle 比 outer 高亮 smoother、共同 coherent color／height／roughness／AO。Continuous ground＋grain 保持跨 seed owners，plate 在 owner 前 C1 歸零；空 plate 跳 layers、full plate 跳 cloud，採樣無配置／hash／sqrt／trig。六 flat-face／延長 vertex、三階 shoulders and corners／absolute axes／seed owners／UV wraps C1；非膨脹蛭石的波浪 lamellae，不新增 geometry、透明／transmission、實礦組成認證、晶體物理、iridescence 或物理模擬。

`brassjinglebells` 預算16 rotation／jitter／inverse scale／tone poses、128² grain／squared body-radius／capsule and end/center hole／squared-radius seam reciprocals。Compact disc 搭 nonsingular squared-radius dome，annular squared-radius ridge 為較高平滑壓邊；兩 axial capsules＋nearest cardinal end-disc＋central disc 用 product-complement cut union，四圓端在 diagonal owner 前 C1 歸零。Coherent shell→lower darker rough opaque slot finish 同步四 channels，metallic=body*(1−cut)、full body mortar精確0；外背與槽均非金屬。空 body 跳detail、full cut跳shell/seam，採樣無配置／hash／sqrt／trig。Shell／seam shoulders、capsule tangents、center and round-end shoulders／joins、absolute and nearest-end owners／seed owners／UV wraps C1；不新增 geometry、透明孔、珠、吊耳、敲擊／音效、聲學或物理模擬。

`nutmeghalves` 預算16 rotation／jitter／inverse scale／tone／雙phase poses、128² grain／兩8² local warp fields／ellipse及flesh、wave frequencies／vein shoulder reciprocals。Compact ellipse body／內nested ellipse flesh，共同coherent rind→flesh finish；近平果仁height只grain、dark marbling僅pigment。兩獨立local warp加雙seed phase的smooth-threshold cosine vein用product-complement union，不把紋路寫入normal／roughness／AO。空body跳detail、無flesh跳warp/trig、fullflesh跳rind；採樣無配置／hash／sqrt、只果仁用兩cos。Ellipse/flesh shoulders、cached warp fields／seed owners／UV wraps C1；與cardamom的外殼凸ribs不同，不新增geometry、透明／transmission、食物／植物／烹煮或物理模擬。

`coaxialcablecuts` 預算16 rotation／jitter／inverse scale／tone poses、40 strand centers／128²grain／squared disc-dielectric-conductor-strand reciprocals／angular owner scale及radial guards。Compact disc中三同心finish：黑jacket→淡dielectric→銀metal，中心conductor和四十isolated strands共用product-complement metal union；height僅全body近平grain、不隨component改變，full body AO1／mortar0。Guarded atan2只在shield annulus，single nearest angular owner／cached center不掃40線，每strand在owner前C1歸零、branch cut同owner；正remainder沿既有寫法。空body跳detail、fullmetal跳dielectric/jacket，採樣無配置／hash／sqrt、不用trig除guarded atan2。Disc／dielectric／conductor／strand shoulders、radialguards／angular andseedowners／UVwraps C1；不新增geometry、透明／transmission、真線束、接頭、電／EM／RF模擬或規格／安全認證。

`shippocloth` 預算128²grain／兩seeded lattice origins／一tone／squared-radius ring shoulder reciprocals／96-thread weave frequency。每latticecell四corner的squared-radius compact annuli以product-complement union合成完整交疊圓環，四圓交點精確full ink、跨owners同一圓環；採既有yagasuri的雙cos／alternating-overunder continuous weave，不建立第二織法。Ink只改color，height／roughness／AO獨立weave＋grain、fulltile mortar0；採樣無配置／hash／sqrt、只兩weave cos。Squared ring shoulders／四圓joins／cellownership／weave／UVwraps C1。實測預設256後relief由0.0012→0.0036，保留|normal−128|>2的可見門檻和>10%雙軸比例，不以降低斷言掩飾細節。不是凸繡線、半圓tile，不新增geometry、透明孔、線纖維／布料／物理模擬。

`driedtamarindpods` 預算 16 rotation／jitter／inverse scale／tone poses、四個略彎 chain centers／128² grain／24² pore field／ellipse-stalk-pore reciprocals。四 compact ellipse coverage 與 nonsingular dome 各用 product-complement union，鼓包外輪廓真縮成三窄腰、非 continuous lens 上貼內部凸點；同方式接短 capsule stalk，coherent stalk→powdery shell finish，full body 精確 mortar0。Pores 同步細微 dark／lower／rougher／AO；空 body 跳 detail、無 pod 跳 pores、full pod 跳 stalk finish。固定四 lobe samples、採樣無配置／hash／sqrt／trig；ellipse/dome shoulders／union joins／stalk tangents and shoulders／seed owners／UV wraps C1。不新增 geometry、透明孔、剝殼／內果肉／種子、植物／食物／烹煮或物理模擬。

`conicalsampletubes` 預算 16 rotation／jitter／inverse scale／tone poses、128² grain／cylinder-taper-top、squared cap-hinge-label reciprocals。Smooth cylinder→cone cap²−x² field 搭 compact top shoulder、nonsingular dome；兩 squared-rectangle product profiles 作 cap／單側 hinge，product-complement union 共用完整 silhouette，full body 精確 mortar0。Coherent hinge→tube→frosted label→higher smooth closed cap finish，label 全在 full cylindrical body、四 channels 不混入 backing。空 body 跳 detail、full cap 跳 tube/hinge finish、full tube 跳 hinge finish；採樣無配置／hash／sqrt／trig。Cylinder-to-cone/tip／top／cap/hinge corners and shoulders／label ellipse／union joins／seed owners／UV wraps C1。不新增 geometry、透明／transmission、管腔／液體／容積／開蓋／離心模擬或醫療／無菌／額定／安全認證。

`botryoidalcopper` 預算 256 jittered site x/y/tone／128² grain／squared support reciprocal。沿既有 hammeredmetal periodic 3×3 neighbor 架構但預算 seed sites、不在pixel hash；compact positive cubic kernels 相加後 smooth-clamp 形成上凸丘，非 negative impressions，weight 同時混 site tone，coherent high/bright/smooth/less-occluded crowns 對 low/dark/rough valleys。整面包括 valley metallic1、mortar0，無 dielectric backing。Radius0.58＋jitter0.12 的 3×3 是完整鄰域，外圈最短1.38 cell-distance大於support，換owner沒有漏sample；cubic support／saturation crown／overlap sum／owners／UV wraps C1。採樣最多9候選、無配置／hash／sqrt／trig／exp／動態鄰點掃描；風格化 seeded nodule pattern，不新增 geometry、粒子／晶體成長／冶金／化學或物理模擬。

`pencilshavings` 預算 16 rotation／jitter／inverse-scale／tone poses、128² grain、inner/outer squared annulus／cut／paint reciprocals。兩 compact squared-radius ramps 搭 positive-y half-plane product 定半環 silhouette；body 為零跳 grain／atan／cos，正 inner radius 排除 origin、支援域僅 y>0 排除 atan branch cut。單一 cos(24 atan2) 定 12 道放射 ridge，height／color／AO 共用 flute、較暗平滑 paint 僅混 color／roughness，不造假額外 paint 高度或 AO；最終 common body finish/mortar 保留完整半環。Inner/outer/cut shoulders／paint shoulders／radial flutes／seed owners／UV wraps C1。採樣無配置／hash／sqrt／鄰點掃描，僅 nonempty body 一次 atan2／cos；風格化表面，不新增 geometry、粒子／真木屑或彎曲／削鉛筆／損壞／物理模擬。

`papayacuts` 沿 passionfruitslice bounded cached seed-owner pattern，但使用 rotated 橢圓 rind→高厚 flesh→低 pit→凸黑 seed finishes，非 kernel pigment in convex jelly。預算 16 rotation／jitter／inverse-scale／tone poses、每 face 4×8 bounded slots（2/4/4/4/4/4/4/2，28 active x/y centers）、128² grain／squared ellipse-seed／owner-pitch reciprocals。每 seed radius 0.016＋jitter 0.0025=0.0185，小於 half-pitch X 0.021 與 half-pitch Y 0.0325，support 全在單一 owner、無漏鄰點或 seed scan；bounded row-length guards 排除不存在的 outer-corner seeds。Squared ellipse shoulders／squared seed rim＋nonsingular smooth dome，coherent cavity/kernel finish 先成完整 surface，最後 common body finish/mortar 不混 backing進 full seed。空 body 跳 detail、空 flesh/pit 跳 seeds；採樣無配置／hash／sqrt／atan／trig／鄰點掃描。Rind/flesh/pit nested shoulders／seed core/support/dome／bounded owners／pose owners／UV wraps C1；不新增 geometry、透明／transmission、液體／成長／切割／腐敗／物理模擬。

`sewingthimbles` 預算 16 rotation／jitter／inverse-scale／tone poses、每 face 4×6 dimple x/y centers、128² grain／cap-rim-dimple-owner reciprocals。Positive smooth width taper 搭 nonsingular squared-positive cap 與 compact bottom 肩定封圓頂／上窄下寬 body，squared-rectangle product 定更寬下 rolled lip，product-complement union 共用完整 silhouette。Compact smooth squared-radius blind dimples 共用 color/height/roughness/AO，在較低暗粗 pit 仍沿同 M1 body，非 dielectric punch-outs。Radius 0.022＋jitter 0.0025=0.0245 <half-pitch X 0.0325／half-pitch Y 0.035，完整 support 在單一 bounded owner；無漏鄰點或 dimple scan。Coherent body→high smooth rolledlip finish，最後 common silhouette metallic/mortar；空 shape 跳 detail，full rim 跳 body／dimples，採樣無配置／hash／sqrt／trig／鄰點掃描。Taper／cap max-square join／body shoulders／rim corners-shoulders／blindpit supports-centers／owners／union joins／UV wraps C1；front-face shading，不新增 geometry、透明孔／內腔或縫紉／穿刺／碰撞／變形／物理模擬、防護額定。

`boullebrassinlay` 重用 tortoiseshellacetate 的 12² macro／32² detail／4² warpX-Y／192² grain budgets、warp／pigment shoulder、共面 height 0.38＋0.001 grain／AO1。另預算 16 微旋轉／jitter／inverse-scale／tone poses、q-offset annulus／clip／finial reciprocals；兩相切圈各半平面 clip，product-complement union 接成完整 S，兩 ellipse finials 和交錯鏡像重複，所有 full cores 精確 M1、voids與 matrix M0、整面 mortar 0。只有 color／roughness／metal 改變，height／AO 不因 gold scroll/pigment 改變，非 raised badge、金漆或凹刻。Full metal 跳 resin warps/pigment；採樣無配置／hash／sqrt／trig／鄰點掃描。Q-offset core/support shoulders／soft clipped endpoints／two finial shoulders／tangent union／pigment shoulders／mirror owners／UV wraps C1。僅 Boulle-inspired synthetic resin＋brass surface，不新增 geometry、真玳瑁／材質來源、透明／transmission、體積／製作／修復／物理模擬。

`diamondpanelparquet` 沿 logcabinparquet 的 board-owned cached 8×96 anisotropic grain、compact dark joint finish；單一 53-tone array（4 frame＋7² diamond owners）、96² micro／pitch-bevel reciprocals。Max-abs 選水平/垂直 frame，miter profile在 absx=absy owner換邊前完全回共同joint；inner-square frame/field clip肩在分支邊皆為joint。固定45° s/t nearest-square owners 交替 along/across，|s|,|t|<0.4√2、nearest indices [-3,3]，direct7² cache完整無掃描；square-grid joints與frame clip各C1 product mask、所有 owner grain/finish 都淡回共同低暗粗縫。M0／mortar 0遍及全tile含joints，非neutral grout；空 face 跳grain，採樣無配置／hash／sqrt／trig／board scan。Frame miter／inner-outer shoulders／rotated grid ownership／corners／UV panel wraps C1。僅四斜接框菱形木面、不認證歷史layout，不新增geometry、真板／位移或地板碰撞／鋪設／變形／物理模擬。

`dendriticfrost` 預算 16 rotation/jitter/inverse-scale/tone poses、3 cached axis vectors、128² grain／squared capsule core-support／branch-owner/projection reciprocals。三雙向 capsules 定六主枝，abs-along每側兩 branch slots／正負60° capsule，單 owner profile 完整：run0.03、radius 0.009，along半support0.015＋0.009=0.024 <half pitch0.05，owner換邊已全無branch，不需掃24segments。最多3axes×3capsuleprofiles（9）；product-complement union，任一fullcore即跳後續axis/branch，完整ice union共用color／height／roughness／AO、M0／mortar 0全tile。Squared-positive主枝end、clamped capsule投影在切線C1、abs-axis在active branch域外、centralhubfullcore，無atan或pole singularity。Emptyice只採基底grain，採樣無配置／hash／sqrt／trig／鄰點掃描。Exactcore/support shoulders／projection tangencies／branch owners／centralhub／union joins／pose owners／UVwraps C1；僅opaque surface，不新增geometry、透明／transmission、晶體成長／天氣／積雪／融化／物理模擬。

`bullionknots` 沿既有 squared capsule 與 compact full-body interpolation，預算16 rotation/jitter/inverse-scale/tone poses、128² grain、squared core/support及endfade reciprocals／12-turn phase frequency、64-thread continuous UV weave；單capsule的 max-positive absalongend 定 closed rounded yarn body，body0即跳rib cosine。十二 transverse cosine ridges在 endShoulder0.025淡回平滑圓帽，所有 y跨線方向共phase、C1 squared capsule core/support/ends、projection tangencies、absaxis、ridge fade；body外共cloth、M0／mortar 0全tile。Yarn valley仍有連續正height，不切開；金黃是dielectric顏料而非metal。採樣無配置／hash／sqrt／atan／neighbor-scan，僅rib cosine與兩cloth cosines。僅表面，不聲稱真helical yarn topology／縫線物理或新增geometry。

`orecchiette` 重用 seeded ellipse pose／compact fullbody finish，預算16 rotation/jitter/inverse-scale/tone poses、128² grain、outer及bowl各兩axis reciprocals、edge/rimwidth reciprocals。Squared outer q 的compact face定封閉elliptic dough；q-centered compact squared band形成完整 rolled rim；偏心x−0.03的較小ellipse bowl profile降低height／color／AO、提高roughness而不減face。Outer/core ellipses、rim兩肩／crest、bowl support／center無atan／sqrt／origin singularity，face0跳bowl／rim。全部bodyfinish乘face淡回共同backing，M0／bodymortar 0／backingmortar 1；採樣無配置／hash／sqrt／trig／neighbor scan。僅opaque surface，不新增geometry、真麵形／位移／厚度／洞／烹煮／吸水／變形／食品／物理模擬。

`solderlessbreadboard` 預算128² cachedgrain與pitch/holeRadius/holeEdge/channelShoulder/rows reciprocals，無per-holecache或隨機錯位；左右鏡射absx nearest-column各5完整owners／16 periodic rows，單nearest-hole quartic superellipse定round-corner square floor。Hole support0.014 <half-pitch 0.03125，換owner前已回共plastic；最內孔support界0.07975 >channelWidth0.035，channel分支可跳全部holes且無漏support。Channel core0.028／support0.035，空hole跳finish；squarecore／support肩、channel肩／absaxis、column／rowowners／UVwraps C1。採樣無配置／hash／sqrt／trig／neighbor scan，只取cachedgrain。白face／孔floor／channel共opaque dielectric、M0／mortar 0全tile，孔是正height暗粗floor非alpha或metalcontacts；僅signal-face surface，不新增接線或物理。

`kyaniteblades` 重用cached16 rotation/jitter/inverse-scale/tone poses／128²grain，追加pitch/width/side/end reciprocals／three-stria frequency，三blade top-bottom常數決定長短階差與共同斜切endSlope0.35。Nearest col=round(x/pitch)+1、width0.045 <half-pitch 0.06，所有owner seams都在commonmatrix；單blade side profile與上下斜end profile C1 product，含corner無min距離折線。Face0跳cosine／finish；3period across cosine沿blade軸一致，跨向sloped cleavageheight及ridgeheight／color／roughness／AO全部乘face淡回低暗粗matrix，M0／全mortar 0。Side及endbevel肩／corners／striae／完整blade及poseowners／UVwraps C1，採樣無配置／hash／sqrt／atan／neighbor scan；僅one activeblade cosine。表面shading非真各向異性光學、透明晶體／成長／斷裂／geometry／物理。

`internaltoothwashers` 預算16 cached rotation/jitter/inverse-scale/tone poses／128²grain、outer/tip/bend squared radii與inner/outer/bend reciprocals、half-teeth frequency。Squared-radius先剔除中心r≤0.14與外r≥0.32再atan2，12cosine內cut radius介0.14–0.22、outer shoulder r0.30–0.32，完整閉環無cutgap。內齒用6cosine定6up6down，同乘12齒profile與r0.19–0.24 radialfade，故outerband全flat而非helical ramp或交替pigment／roughness；全metalfinish與bendheight/AO共face、Mface／mortar1−face淡回同opaque backing。Inner support/core曲線／outer圈／bend雙圈／atan2 seam／中心／poseowner／UVwraps C1；activeband外跳角度、空face跳bend，採樣無配置／hash／sqrt／neighbor scan，最多oneatan2＋twocosines。Shaderfactor 1沿現有Mmap三分類清單。不新增geometry或彈簧機械。

`driedchillies` 預算16 cached rotation/jitter/inverse-scale/tone poses／128²grain，length/side/end／stemprojection/squaredcore／calyxaxes/edge reciprocals。Body以y定t，中心x0.16t²、width0.09(1−t)²＋0.006，squared side-profile與上下end肩C1 product，root/body之外跳除法／wrinkle cosine；12-cycle longitudinal field同步lower/darker/rougher/more-occluded wrinkle valleys，phase沿pose tone。Thin capsule stem接較高olive ellipse calyx，body→stem→calyx依序finishoverlay，coverage用product complements防fullcore殘mortar；y>calyx最下support可同時跳stem/calyx。所有curve side/core／end肩／stem projection/capsule肩／calyxellipse／layer joins／poseowners／UVwraps C1；採樣無配置／hash／sqrt／neighbor scan，僅activebody一cosine。M0／opaque backing，全body完整coverage非透明；不新增growth/drying/food/cooking/physics或geometry。

`utilityknifeblades` 預算16cached rotation/jitter/inverse-scale/tone poses／128²grain、height/side/end／squared notch core-support／hone reciprocals。Y線性加寬trapezoid，side×top×bottom C1 product避免min-distance corner折線；兩spine circles用product complements作true negative cut，所有metalfinish共face，Mface／mortar1−face淡回同opaquebacking。Y超top/bottom跳width/notches/hone，空face跳metalfinish；hone y0.09–0.14 smoothfade，低height／低roughness／亮pigment／AO同步過渡、全M1不切斷lowerband。Slopedside/core／end肩／productcorners／notch兩圓／hone shoulders／absaxis／poseowners／UVwraps C1，採樣無配置／hash／sqrt／trig／neighbor scan。Materialfactor 1及三metalclassification lists沿既有；僅surface，不新增真刀geometry／利刃或切割／磨刀／磨耗／物理。

`windmillparquet` 重用既有風車鋪磚的五矩形 owner 選擇與拼木的 board-local 8×96 noise pattern；預算 80 個木板 tone、8×96 grain、96² periodic micro 及 shoulder reciprocal。四根 2×1／1×2 長板圍住 1×1 中央木方板；木紋沿每塊板長軸定向，沒有單位格 lookup 導致的中段接縫。兩軸 C1 邊距 profile 相乘，所有 finish 共 face 淡回同一低暗粗木縫，wood/joint 皆 M0／mortar0，不觸發固定中性灰 grout。Owner、T junction、bevel、fullface、min-distance 中線 plateau 與 panel/UV wrap 都 C1；空 face 跳過木紋，採樣無配置、hash、sqrt、trig 或鄰居掃描。0.8 m tile，沿用四圖、選用 height 與 ownership；僅表面，不新增 geometry、施工或物理模擬。

`bismuthhoppers` 沿用 pyrite 的 C1 矩形 profile 乘積與既有 cached pose convention，預算 16 rotation/jitter/inverse-scale/tone poses、128² grain 與 shoulder reciprocal。Outer square 乘 innermost square 的 complement 定金屬 footprint；五個內部 nested rectangle profiles 累積連續 level，形成六層封閉方階，height/color/roughness/AO 隨 level 同步下降／變暗／變粗／加深。全 finish 共 face，Mface／mortar1−face 淡回同一低平 backing；空 bounding box 與中心空 face 跳 step loop，active sample 最多五個 cached threshold 計算，無配置、hash、sqrt、trig 或鄰居掃描。七組方形 support/core shoulders、product corners、absaxis、完整 pose owners 與 UV wraps 皆 C1；最大旋轉 support 加 jitter <0.5 cell，單 owner 完整。Material factor1 與三個 metal classification callers 同步；0.16 m tile，僅表面，不新增 geometry、真洞、iridescence／薄膜光學、晶體生長或物理模擬。

`splitvanillapods` 沿用 cached pose／C1 ellipse profiles／common backing；預算九個 rotation/jitter/inverse-scale/tone poses、144 個籽團的288座標、128² grain 與 body/channel/seed 平方半徑及 shoulder/pitch reciprocals。Local across=x−0.3y² 定彎曲 ellipse；低槽由 squared transverse flat-core profile 與封閉兩端 window 相乘，兩側高皮緣沿曲線完整。每次僅取一個 nominal seed row，其 ellipse 支撐含 jitter 為0.0115<半 pitch0.02，跨 row 邊界完全歸零；籽團全部落在 channel full core／end window 內，不需鄰居掃描。籽團比槽底略高、較暗粗，仍低於皮緣；所有 finish 共 body face／M0／mortar1−face 淡回 common backing。空 body 跳槽與籽，空槽跳籽；採樣無配置、hash、sqrt、trig 或 scan。彎曲 body support/core、槽肩／封閉端肩、籽 ellipse、nominal owners、pose owners 與 UV wraps 皆 C1；完整旋轉 support 不跨 cell。0.6 m tile，僅表面，不新增 geometry、真裂口、種子物件、乾燥或物理模擬。

`seamrippers` 重用 cotterpins 的 squared-capsule projection／product-complement union、dinnerforks C1 taper 與 cached pose convention；預算九 rotation/jitter/inverse-scale/tone poses、128² grain、三 capsule 的 squared support/core／short segment projection reciprocal、circle support/core 與 hook length/shoulder reciprocals。Shaft、短斜叉與長彎漸細叉以1−(1−shaft)(1−short)(1−hook)合併，保持 full-core exact M1；深藍 handle 與較高藍 circle cap 依 C1 coverage 覆上並乘去 M，opaque coverage 則以 product remaining mortar 保留 exact0。長叉用 y 定 quadratic centerline 與變寬 squared profile、兩端 C1 window；超 hook y 範圍跳變寬計算，空 component 跳 finish。採樣無配置、hash、sqrt、trig 或鄰居掃描；capsule support/core、端圓／projection joins、hook side/end shoulders、cap layers、完整 pose owners 與 UV wraps 皆 C1。0.6 m tile、factor1／鋼 M1／塑膠 M0，三 metal classification callers 同步；僅表面，不新增 geometry、真利刃／切口、拆線／縫紉／工具或物理模擬。

`flakedarrowheads` 重用 sharkteeth 的 signed half-plane C1 乘積及既有 cached poses／ellipse profiles。預算16 rotation/jitter/inverse-scale/tone/scar-center/first-z poses、128² grain、blade/stem/notch/scar squared-radius 與 shoulder/pitch reciprocals。三角 blade 與窄 stem 用 product complement union 連接，兩側 ellipse complements 真正切去側缺口；空 body 跳 notch、空 face 跳 ridge/scars/finish。中央 ridge 為 squared smooth cap；兩前方 facets 以 across=abs(x)、z=y−0.65across 定斜剝痕，每點只取五 nominal rows 中一列，radiusZ0.018<半 pitch0.03，absaxis 近旁沒有 scar support，因此 row owners 與 absaxis 都 C1。剝痕同步降低 height/color/AO、提高 roughness，所有 finish 共 face／M0／mortar1−face 回 common backing。Triangle side/end products／stem corners／兩 cut ellipses／warped scar support/core／owners／UV wraps C1；最大旋轉 support 不跨 cell，採樣無配置、hash、sqrt、trig 或鄰居掃描。0.4 m tile，僅表面，不新增 geometry、真利刃／洞、打製／飛行／命中／武器或物理模擬。

`dandelionseeds` 沿用 cached pose／axes、squared-capsule profile／ellipse 及 product-complement union convention，預算九 poses、十六 unit axes、128² grain、fiber/hub/stalk support-core 與 seed ellipse reciprocals、完整 support bounds。每個 eligible fan sample 最多一次 atan2 取最近 ray、一次 bounded capsule projection，無逐輻掃描；full hub 內跳角度，bounding box／fan reach 外跳 fibers。HubCore0.033×sin(π/16)>rayRadius0.006，確保 angle-owner 邊界在 hub full core 外時纖維已歸零，full hub union 則保留 exact coverage1，含 atan2 ±π 分支皆 C1。Stalk／seed／pappus 依序 C1 疊覆，remaining mortar 乘 component complements 保留 full-body exact0，全 M0。Capsule sides/end circles/projection joins、hub core/support、seed ellipse、angular owners、完整 pose owners／UV wraps C1；採樣無配置、hash、sqrt、sin/cos 或鄰居掃描，eligible fan 外也無 atan2。0.09 m tile，僅 stylized 表面，不新增 geometry、透明纖維、植物生長、風／飄飛或物理模擬。

`shojipaperlattice` 重用 trellis 的週期正交 support convention、paper 的 formation／tooth／纖維 finish 分層與既有板向 8×96 cached grain；六格兩軸最近 grid line 距離各經 full-core／support smoothstep，垂直木後覆水平木，交點維持單層高度。紙底採 cached 3×5 formation、96² tooth、12×96 交換 UV 的雙向纖維；full wood 跳紙底，full horizontal 亦跳垂直 grain，空木 coverage 不取 grain。全 M0／mortar0，不走固定灰 grout；採樣無配置、hash、sqrt、trig 或鄰格掃描，abs／nearest-distance 在 flat core 或 empty support 內換支保持 C1。0.9 m tile／0.004 m relief，非透光或真實榫接幾何。

`nyloncableties` 沿用九 cached poses／128² grain、squared rounded rectangle 與 product-complement union；圓角 head 外輪廓減 compact window，連續長窄 strap 以兩端及橫向 full-core shoulder 收邊，尾寬以 smoothstep 轉窄，避免線性 taper kink。十七 transverse teeth 只選最近 nominal row，half-support0.007<pitch0.026/2，owner 邊界齒已歸零；齒的橫向 support0.027≤strap core，且末齒止於 taper 前，因此真正凸高不露出 strap。預算 pose、grain、squared support/core 與 profile reciprocals，採樣無配置／hash／sqrt／trig／鄰格或逐齒掃描，empty body 跳 finish，component complements 保留 full-body exact mortar0。全 M0，head 比 strap 高、tooth 比 strap 高但低於 head，開口露低 opaque backing。

`weavingshuttles` 重用 cached poses、板向 8×96 wood grain、squared capsule／rounded rectangle-window 與最近 winding row convention。尖舟半寬 w=halfWidth×max(0,1−y²/halfLength²)，outer=smooth(clamp((w²−x²)/edge²))，以 squared support 保持尖端與 x0 軸 C1，不使用帶 cusp 的 abs(x) 線性尖端距離。扣除 capsule slot，覆低金屬 spindle 再覆 dielectric cream yarn，十二 compact rows support0.006<pitch0.018/2，owner 前歸零；product complements 給 full-body exact mortar0。預算九 poses／128² micro／8×96 local wood／reciprocals；wood 只在 frame 非空取樣、full yarn 跳被遮 spindle finish、empty body 跳所有 finish，採樣無配置／hash／sqrt／trig／鄰格或逐繞紗掃描。Wood/yarn/backing M0，只有露軸 M1；公開 factor1 與三個 mixed-metal 測試分類同步。

`tailorstapes` 重用 twillweave/pinstripewool 的 squared warp/weft、compact exposure／dominant／coverage finish 及既有 printed-profile convention。四條週期 cloth strips 以 full-core/support 收邊；100個最近 tick owner 只查預算十項 length table（八短、一中、一長），橫向 support0.18<half-owner0.5，換 owner 時墨已歸零。雙側 markOuter0.25 在布 full core0.265內；最深長刻度止於 |y|0.07，中央 abs 軸在 empty ink，C1。預算128² grain 與 profile reciprocals；empty strip 跳 weave/ink、empty tick 跳 length/mark、empty ink 跳 finish，採樣無配置／hash／sqrt／trig／鄰格或逐刻度掃描。Ink 僅給2μm微凸與黑顏料／低粗糙度，不切斷織紋；full cloth mortar0，全 M0，並無數字或實際量測能力。

`woodenclothespins` 沿用九 cached poses／128² micro／8×96 local wood grain、compact half-plane profile／squared capsule／product-complement union。兩夾片用 abs(x) 與 positive central gap 定義雙側 support-core，outer flare 採 squared-y smoothstep、nose/tail slit 採分離 smoothstep，中央 abs 軸在 empty wood；三個 spring wraps 只取最近 row，其 support0.008<pitch0.025/2，owner 前歸零。預算 squared radius/core 與 reciprocals；empty body 跳 finish、full wire 跳被遮 wood grain、empty wire 跳 metal finish，採樣無配置／hash／sqrt／trig／鄰格或逐圈掃描，full-body exact mortar0。Metallic 僅為 wire coverage，wood/backing M0，factor1 與三個 mixed-metal 測試分類同步；只是 stylized 開口表面，不實作夾持／彈簧物理。

`cinnamonbarkcoils` 重用 cached poses／128² grain、squared radial support-core／smooth endfade 與最近 compact owner convention。以 r=a+(pitch/TAU)×unwrappedAngle 建有限3.5圈 spiral，round 選最近 turn；wallHalf0.022<pitch0.085/2，換 turn 時 coverage 已歸零。atan2 規一化 branch 換邊時 turn 補一，unwrappedAngle 連續；inner annular cull 避開原點奇點，finite endfade 零斜率封住起終點。預算 squared inner/outer bounds／wall core／growth／reciprocals，eligible point 至多1 sqrt+1 atan2，cull 外及 empty face 跳後續；無配置／hash／sin/cos／鄰格或逐圈掃描。正 radial flank 的 smooth bark stripe 改低高度、暗顏料、高粗糙度與低 AO，非平面填餡印花，full wall exact mortar0，全 M0。

`compactcassettefaces` 沿用 cached poses／six unit axes／128² grain、squared rounded rectangle／circle-annulus／capsule 與 product-complement convention。|x| 選最近 window/reel，中央 owner 線距兩輪中心0.14>windowRadius0.105，切換時輪孔皆零；六 spokes 最近 axis 的分界距 spokeStart×sin(π/6)=0.017>radius0.009，無 spoke 接縫，annular rim 與 spoke union 維持 full reel exact mortar0。預算 squared core/support／reciprocals，eligible spoke 每點至多1 atan2，full ring 跳 spokes、empty radial reach 跳 angle、full label 跳 hidden shell finish、empty body 跳 finish；無配置／hash／sqrt／sin/cos／鄰格或逐輪／逐輻掃描。三下孔以中央 rectangle 與 mirrored circle guideholes cut shell，窄磁帶落在中央孔 full core 內；紙標籤、輪、殼、磁帶各獨立 height／roughness／color／AO，全 M0，不涉及 audio 模組。

`kintsugiceramic` 為十六 seeded-jitter 深青釉陶片與連續共面金色填縫網：陶片 M0、完整金縫 core M1、肩部平滑混合，material factor1 啟用金屬圖。兩相共用 micro-height 與 AO0.99，金繼為已填平修補，不是假空裂縫或凸金線。沿用 cached periodic nine-site patches、對稱 pair-plane normalization、片色與128² grain；每點九 squared distances 找最近 site，再乘所有 competing C1 half-planes，不能只選次近 seam 以免 partial triple junction 折痕，完整 gold core 遮蔽 nearest-owner 換界。Jitter0.1／support0.03 使被丟棄 competitor 在 patch-owner 換界處皆 inactive，每點無配置／hash／sqrt／trig，gold core 跳 hidden ceramic finish。0.32 m tile／0.0003 m relief，四圖／optional height／Worker／cache／tint／ownership 契約不變；只作金繼外觀，不新增破裂／修補模擬、位移 geometry、真金化學認證、分層塗層或 BRDF anisotropy。

`pleatedfilterpapers` 為九 seeded 奶油紙濾杯端面：連續平坦微紋底、向外升高三十二徑向褶皺環壁、同相扇貝紙緣，crest／valley 同步改 height／color／roughness／AO，全紙 M0、full-body exact mortar0，緣外缺口露低 opaque backing 非透明洞。沿用 cached poses／128² grain／squared radial bounds／C1 rise profile；以有理 cos(2θ) 四次 angle doubling 得32-fold，flat center 遮蔽角度 pole，內部 full paper 跳 rim coverage、empty support 跳 grain/finish，每點無配置／hash／sqrt／atan2／trig，亦無逐褶掃描。0.36 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership 不變；僅濾紙外觀，不新增實際杯體 geometry、紙纖維微孔／滲透率認證或過濾／流體模擬。

`splitcedarshakes` 為四層半錯位、每層六片，共二十四暖棕 cedar shake 端面：seeded 變寬、96×8 縱向木紋、與木紋相關不齊下緣、較厚 taper butt，以及每片兩道圓頭並貫通下緣的 seeded split，非礦物 grit roofshingles 或直條 shiplap 換色。沿用 cached piece widths／tones／split anchors、compact C1 half-planes／squared capsules，固定 course-center grain slice 產生 frayed butt；empty support 跳 hidden finish，每點無配置／hash／sqrt／trig／鄰格或逐片掃描。全木 M0、full-body exact mortar0，裂隙與 course gutter 露低 opaque backing 非透明洞。2 m tile／0.008 m relief，四圖／height／Worker／cache／tint／ownership 不變；只作靜態 split／taper 木瓦外觀，不新增 damage／weathering 模擬、屋頂工法認證、分層系統或 geometry。

`swavepavers` 為四層半錯位各八塊、共三十二 S 形混凝土連鎖磚：normalized cubic warp 真正彎曲側縫的 height／roughness／AO／mortar coverage，不是 calcadawaves 只改石色的波紋或 dogbonepavers 對稱窄腰。沿用 cached block tones／128² grain／48² aggregate／compact C1 joint profiles／inverse-coordinate 單格定位；row 與 warped-column owner 在 full grout 內換界，負 warped column 正確 wrap，empty support 跳 grain/finish，每點無配置／hash／sqrt／trig／鄰格或逐磚掃描。全石 M0、full-body exact mortar0，縫為低 opaque neutral grout。0.96 m tile／0.006 m relief，四圖／height／Worker／cache／tint／ownership 不變；不新增 geometry、剛體互鎖／碰撞／車流模擬或施工認證。

`mushroomslices` 為九 seeded 蘑菇切片：連續乳白 dome／縱纖維 stalk、較低暗粗棕外皮與十二附著低暗 gill fingers，其間為真低 opaque backing，非 mushroomgills 整面菌褶扇形。沿用 cached poses／128² grain／local64×8 stem fibers／squared ellipse-roundedrect-capsule profiles／mirrored nearest-gill lookup，halfPitch0.016>radius0.011 使 owner 在 support 外換界；full cap 跳 hidden stem/gills，empty support 跳 finish，product-complement union 維持 full-body exact mortar0，全相 M0。每點無配置／hash／sqrt／trig／鄰格或逐 gill 掃描。0.18 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership 不變；只作切片外觀，不新增 geometry、透明洞、真菌生長或物種／可食性認證。

`insulatedringlugs` 為九 seeded 銀色環端子：連續中空 eyelet／neck 平金屬片與較高紅絕緣 collar，兩道對稱低 crimp bands 真降低 polymer height／color／roughness／AO 但維持 M0，銀片 M1／紅套 M0／factor1 啟用混合金屬圖。孔與外隙露低 opaque backing。沿用 cached poses／128² grain／squared annular-roundedrect-capsule profiles／product-complement union；ring-neck union 後才切 bore，頸不填入孔下緣；full collar 跳 hidden metal、empty support 跳 finish，兩 crimp supports disjoint 且在 full polymer 內，full-body exact mortar0。每點無配置／hash／sqrt／trig／鄰格或逐帶掃描，0.18 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership 不變；不新增 geometry、電路連通／導電模擬、壓接力學、絕緣安全／電壓認證。

`bananaslices` 為九 seeded 奶油香蕉橢圓切片：低而較粗淡外緣、三道連續低 Y partition 與六枚成對暗 seed rudiments，不是 kiwiflesh 環種子或 starfruit 五角外皮換色。Y arms／hub／seeds／rim 分別改 height／color／roughness／AO，cached poses／three unit axes／128² grain／squared ellipse-capsule profiles／三 dot comparison 單arm定位，每點無配置／hash／sqrt／atan2／trig／逐arm或逐seed掃描。Full hub 遮 ray owner 換界，其餘 ties在ray／seed support外，外橢圓support遮pose換界，全相M0、full-body exact mortar0，外部低opaque backing。0.12 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變；不新增geometry、熟成／生長模擬、植物／食品認證。

`rosemarysprigs` 為九 seeded 淡莖迷迭香枝葉、十六片斜生狹針葉與凸起淡中肋，非寬羽狀 fernleaf 換色。Cached poses／八 seeded leaf lengths／128² grain，squared stem capsule／sheared elliptical paired leaves／compact rib profiles，nearest-pair owner 位於 leaf transverse support 外、full stem overlay 遮 mirrored-side cusp。Product-complement coverage 保持根莖連續且 full-body exact mortar0；empty support 跳 finish、full stem 跳 hidden leaves，每點無配置／hash／sqrt／trig／逐葉或鄰格掃描。暗粗針葉高於淡低莖，亮高滑中肋與葉面分相、全 M0、外部低 opaque backing；針葉與中肋寬度保留512像素的可見分離。0.18 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership 不變，不新增 geometry、生長、植物學或草藥／食品認證。

`pencilsharpeners` 為九 seeded 全金屬削鉛筆器表面：真圓孔低殼、八道低側握槽、較高磨刃與更高一字槽螺釘，非 utilityknifeblades 散刃或 pencilends 換色。Cached poses／128² grain／squared rounded housing-circle-strip-capsule profiles，nearest grip-row ties及mirror-side cusp在grip support外；housing／blade／screw product-complement metal union 保持 full-body exact M1／mortar0，孔與外隙才是低 opaque M0 backing。Full screw 跳hidden blade/body、full blade跳hidden housing、empty support跳grain，每點無配置／hash／sqrt／trig／逐握槽或鄰格掃描。低握槽、磨刃面與低螺釘槽分別改height／color／roughness／AO且皆M1。0.15 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership 不變，不新增 geometry、削切力學、精密五金尺寸或安全認證。

`scissors` 為九 seeded 張開剪刀：雙真橢圓孔紅柄、連續銀頸、雙斜尖刃與更高圓銀樞。Cached two arm axes／nine poses／128² grain，squared ellipse annuli／neck-pivot profiles，尖刃以smooth signed linear halfplanes乘積收尖，不用有中心尖折的abs-width clipping。Full neck cores 同時重疊blade與ring core，neck support在inner holes前終止；product-complement unions維持連續full-body exact mortar0、紅柄M0、銀刃頸樞M1，孔與外部低opaque M0 backing。Full handles/pivots跳hidden plate，empty support跳grain，每點固定兩arm解析、無配置／hash／sqrt／trig；紅柄高粗於磨刃、低於銀樞。0.25 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增geometry、活動鉸鏈、剪切力學或安全認證。

`serpentinesprings` 為九 seeded 單連續銀蛇形彈簧線：六直段、五交替真半圓 U 彎與雙圓自由端，非六分離直條或螺旋線圈。Cached poses／128² grain／exact piecewise squared-distance field，straight rows／三右二左turns／end owners都在空support換主；line/arc join離開中心線仍value與一階導數相同。只在eligible U-turn annulus通過中心與外部cull後取一次sqrt，不能用implicit-ring近似取代而破壞接合；每點無配置／hash／trig／鄰格或逐run掃描。Compact core-support及smooth圓冠改height／roughness，full wire core維持M1／exact mortar0，隙為低opaque M0 backing。0.2 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增geometry、螺旋彈簧構造、彈性／力學或安全認證。

`impellerfaces` 為九 seeded 六後掠尖銀葉輪、六開扇隙、高圓環hub與真中心孔，非連續rim的spurgears換色。Cached poses／128² grain／squared radial profiles／sixfold angular phase隨q後掠；width隨q線性縮尖，兩smooth signed angular halfplanes乘積形成真尖端，不用abs-phase cusp或vanishing-width division。Phase ties在support外、full hub跳hidden angles/finish、origin不查angle；每eligible annulus一次atan2，每點無配置／hash／sqrt／sin/cos／逐葉或鄰格掃描。Product-complement hub/blade union保持連續core M1／exact mortar0，孔及扇隙低opaque M0；radial blade height向外升、低暗粗磨刃仍低於hub。0.3 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增geometry、旋轉、流體／空力或安全認證。

`chipresistors` 為九 seeded 高黑矩形chip resistor、雙低銀wrap端與連續白103標記，非圓柱色環axialresistors換色。Cached poses／128² grain／rounded body-terminal profiles／capsule strokes／rounded annular0字，counter露出高opaque黑body，不是元件穿孔或低backing。3由連續vertical/horizontal strokes exact union；nearest glyph/row ties及mirrored terminal owners在support外，字寬配合旋轉512像素足跡。Full body跳hidden metal，每點無配置／hash／sqrt／trig／逐glyph或鄰格掃描；黑body與亮白ink皆M0、銀端M1，body/terminal cores重疊仍exact mortar0。Ink薄高粗、body高於terminals；0.12 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變。103僅外觀標記，不認證實測阻值、電路模擬、精密元件規格或電氣／安全。

`memorycardbacks` 為九 seeded 通用黑記憶卡背面、八低金接點、七高黑絕緣隙、真右上削角與開放右側key notch。Cached poses／128² grain／rounded body-pad profiles／smooth diagonal halfplane／rounded notch subtraction，nearest-pad ties在contact gap，所有pad位於full shell且避開key cuts。Empty shell跳pad/finish，每點無配置／hash／sqrt／trig／逐pad或鄰格掃描；金pad M1且低滑於高黑M0殼，接點隙保持高opaque黑body，只有削角／notch才露低opaque M0 backing。Mortar只由body coverage決定，接點／隙皆full-body exact0。0.15 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變；通用無品牌logo靜態表面，不新增儲存存取、電路、精密尺寸、SD規範或資安／電氣／安全認證。

`gnocchi` 為九 seeded 撒粉奶油橢枕、圓冠與七低彎叉槽，非ravioli／orecchiette換色。Cached poses／128² grain／48² flour／squared ellipse-dome與x−bend*y²曲線warp的七compact capsules；nearest-groove ties在完整dough空support，所有叉槽位於full face。叉槽末端偏移大於groove radius，舊直線控制點仍高而無凹痕；每點無配置／hash／sqrt／trig／逐槽或鄰格掃描，outside support跳兩noise finishes。叉槽低暗粗且AO較低但不挖孔，full dough M0／exact mortar0，外部低opaque backing；flour只改pigment／roughness，非粒子。0.12 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增geometry、烹煮／生長模擬或食品／安全認證。

`rectangularsocketfaces` 為九 seeded 閉合銀框／真正低開口／高opaque黑舌／四更高銀接點矩形插座，非記憶卡換色。Cached poses／128² grain／squared rounded rectangles-capsules，outer-minus-mouth形成連續conducting ring；只在tongue內選nearest-contact，pins全support位於full tongue、tongue全在full mouth。Contact ties維持高opaque M0絕緣隙而非孔；product-complement coverage使full ring／tongue／contacts exact mortar0，只有銀框與pins M1，低cavity/backing M0。Empty outer跳mouth／contacts／finish，mouth外rim跳tongue-pins，empty cavity跳grain；每點無配置／hash／sqrt／trig／逐pin或鄰格掃描。0.09 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增port geometry、電氣I/O、精密尺寸、USB相容或電氣／安全認證。

`saffronthreads` 為九 seeded 同一完整根部的三彎紅絲、三擴圓尖與兩真低叉隙，非rosemary直針換色。Cached poses／128² grain／三固定unrolled squared capsules，x−sign*bend*(baseY−y)²曲線warp，半徑只在tip區C1擴張；warp跨軸向cap projection不clamp，避免off-axis derivative jump。Coverage及rounded crowns皆product-complement unions，非max／nearest-branch cusp，同根full cores exact mortar0／M0。Empty bounds跳所有capsules、empty body跳grain；每點固定三capsule、無配置／hash／sqrt／trig／鄰格掃描。Core ratio0.71以較寬肩保留既有differential guard；0.06 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增flower geometry、生長／烹煮模擬或食品／安全認證。

`fishhooks` 為九 seeded 連續銀J鉤，真眼環／直柄／下半圓彎／上尖／內向倒鉤尖，非carabiner／safety pin換色。Cached poses／128² grain／squared shank capsule／circular inner-outer arc bands／eye disc與兩尖的signed linear halfplane products。Product-complement unions連full cores而不疊加height；最後一次bore subtraction切所有components含shank，眼孔保持真低開口。雙尖無abs-width cusp或zero-width division，J中腔一路向上開放，內倒鉤與空outward mirror分離。Full metal M1／exact mortar0，bore／open cup／backing低M0。Empty bounds跳profiles，full eye bore跳其餘profiles，empty body跳grain；每點無配置／hash／sqrt／trig／逐segment或鄰格掃描。0.15 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變；此為opaque backing上的靜態外觀，不新增鉤體geometry、釣魚physics、強度或安全認證。

`violinfholes` 為九 seeded 鏡對三次曲線真低f孔與連續暖木紋，每孔端圓眼／兩側缺刻，非直線painted f。Pose只快取五值，無unused或會跨cell跳變的wood tone；abs(x)−pairOffset選一mirrored profile，cusp位於寬zero-cut中央木帶。Cubic warp bend*(t³−t)跨squared axial caps不clamp；兩round端disc與四signed-plane diamond nick constraints以product complements連接。高wood及低opaque深棕腔皆M0／exact mortar0，保留authored pigment非neutral grout。World-periodic96×12 grain與128² fine跨pose-cell無seam；bounds外跳cut profiles、full cut跳雙finish，每點無配置／hash／sqrt／trig／逐segment或鄰格掃描。0.45 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變；僅opaque backing上靜態外觀，不新增violin／穿孔geometry、音源合成、聲學模擬或樂器認證。

`palmiers` 為九 seeded 金心蝴蝶酥，雙真鏡像低焦糖螺旋／中央摺痕／凹口雙冠／下尖，非同心環或cinnamon bun換色。Cached poses／128² grain／兩squared lobe ellipses與signed-halfplane下三角以bounded products聯合，非nearest-lobe silhouette cusp。Compact elliptical spiral windows排除angular origins與mirror-owner seam；squared-radius phase−atan2/TAU以整數週期wrap，nearest phase ties在groove empty support。每eligible occupied point一atan2，無其他逐點trig／sqrt／配置／hash／鄰格或segment掃描；empty bounds跳profiles、empty body跳angular-grain finishes。焦糖槽低暗滑且AO低、仍為高opaque crumb，中央摺痕低暗粗；所有full pastry M0／exact mortar0非孔，外部低opaque backing。0.18 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增pastry geometry、烘焙／生長模擬或食品／安全認證。

`barbedwire` 為四無縫雙圓銀線row，真交替over-under高度、高collars及十六knots各四連尖倒刺。沿用既有C2 quartic-wave／tangent-corrected widths，但quarter-phase depth為雙線twist非doubled-depth figure-eight plait；front/back alpha composition只在wire supports分離處切depth order，無crease或交點雙高。每row只快取phase／jitter／tone三值、128² grain只finish occupied metal；nearest-knot ties在compact knot空support，wire獨立periodic phase。Full高collar先return，遮reflected barb quadrant cusp；雙signed tip halfplanes無abs-width tip crease或zero-width division。Derived bounds跳empty rows/profiles、empty body跳grain；初始化一次sqrt界定tangent width，逐點無sqrt／trig／配置／hash／segment或鄰格掃描。Full metal M1／exact mortar0，interwire／interbarb gaps低opaque M0 backing。0.4 m tile／0.004 m relief，四圖／height／Worker／cache／tint／ownership不變，不新增fence geometry、mechanics或負載／強度／電氣／安全認證。

`oxfordweave` 使用每方向八組雙紗、藍經／淺緯交替的籃式交織。Squared compact yarn profiles與rounded crowns分開，front/back權重不疊加交點高度；pair-owner切換處位於兩紗空隙，group-owner切換前lift window及交叉紗support皆歸零，維持長紗跨組連續。128² cached grain及週期多項式細纖維不在逐點配置、hash、trig或sqrt；空support跳finish。布底保留深藍opaque pigment而非neutral grout，metallic／mortar全0；0.08 m tile、0.001 m relief。沿用既有maps、options與ownership，不新增geometry、透明孔洞、displacement或布料模擬。

`lacewood` 使用8×12格、每格六值的seeded射線姿態cache，預算由compact warped ellipse保證不跨cell邊界。Parabolic剪切生成不同斜度／微彎射線，ray core／support皆smooth；world-periodic48×4 grain及192×8 fiber跨pose-owner連續。淺色射線降低roughness但不墊高表面，細孔僅有微小height／AO差；全opaque M0／mortar0，0.35 m tile／0.001 m relief。逐點無配置／hash／trig／sqrt或鄰格掃描，沿既有maps與ownership，不新增geometry、displacement、anisotropy或木材模擬。

`papyrus` 以八組seeded雙向tone與periodic edge field塑造兩層交叉寬草條，長纖維為192×6 cached noise及轉置取樣，formation為4×4。`halfWidth + edgeJitter < 0.5`保證owner切換前coverage歸零，飽和core使abs-center及full-top early return維持C1。直向層一律高於橫向層，不做棋盤上下織，權重不疊加交點height；full top不取樣下層edge，top為0不取樣隱藏上層纖維。三層皆為暖色opaque M0／mortar0，0.3 m tile／0.0015 m relief；沿既有maps與ownership，逐點無配置／hash／trig／sqrt，不新增geometry、透明孔洞或造紙模擬。

`larimar` 快取6×6礦物pool各七值（中心、旋轉、inverse radii及fiber phase），以固定3×3週期候選查詢混合rotated compact ellipses，非nearest-owner切換；最大support小於一格，進出候選集合的pool已歸零。藍色coverage及邊肩纖維皆bounded product-complement unions，纖維只在非飽和肩部以週期多項式profile呈現，full core跳過fiber。128² grain／5×5 cloud全域連續；pigment不影響height或AO，height僅0.0005–0.0005008 m的拋光微紋，AO1。全opaque M0／mortar0，0.25 m tile／0.001 m relief，逐點無配置／hash／trig／sqrt，沿既有maps與ownership，不新增geometry、透光、SSS、anisotropy或礦物生長模擬。

`paperbark` 為3×8薄片的六值pose cache加八個seeded row phases，24² edge field正反座標扭曲兩軸撕邊，parabolic彎曲單側下緣。`0.45 + 0.018 + 0.02 < 0.5`及`0.33 + 0.04 + 0.3×0.45² + 0.04 < 0.5`保證coverage先於column／row owner切換歸零；compact squared shoulders與lip／shadow profiles維持C1。下唇增加真height，下方陰影只改pigment／AO；上緣不做對稱隆起。6×192橫纖維、12×8 cloud常駐，128² grain只取樣可見薄片；pigment正向係數總上界1，不靠clamp藏溢出。全opaque M0／mortar0、0.4 m tile／0.002 m relief，逐點無配置／hash／trig／sqrt或鄰格掃描，maps與ownership沿用，不新增geometry、displacement或剝皮模擬。

`horseshoes` 每枚快取cos／sin／雙jitter／tone五值。以`x²/rx² + min(0, y−toeY)²/ry²`讓半橢圓toe與兩直枝C1相接，兩側compact squared shoulders及heel cap包住連續U形面；中間fuller為同一q的低槽，不疊高度。每側三釘孔以nearest row索引一次選取，0.038 support小於0.07半pitch，owner切換在空support；abs-center cusp同樣被空support遮蔽。微轉0.16 rad與0.012 jitter後整件仍位於cell內，owner空底連續。鐵件M1／低孔與開口M0、全opaque／mortar0，128² grain僅finish可見鐵件；逐點無配置／hash／trig／sqrt或鄰格／孔列掃描。0.6 m tile／0.01 m relief及公開factor1，maps與ownership沿用，不新增geometry、透明孔洞或馬匹模擬。

`durianpeel` 每刺七值cache（cos／sin、雙jitter、兩個affine profile係數與tone），八列half-cell stagger，radius0.31–0.4／jitter0.018。三對absolute planes以兩次有界polynomial rounded max交集成六面坡；`0.4×2/√3 + 0.018 < 0.5`保證support不跨owner。Quadratic foot／tip shoulders接linear中坡C1，0.055 tip plateau大於三倍0.018 rounding，使所有absolute-plane cusps位於飽和尖頂內；保留六面而不使用逐點sqrt。128² grain與6×6 cloud為global skin，profile歸零後仍是opaque底皮，不是孔；AO0.76–0.99、M0／mortar0。0.24 m tile／0.012 m relief，逐點無配置／hash／trig／sqrt或鄰格掃描；maps與ownership沿用，不新增geometry、displacement或果實模擬。

`flystitch` 每組快取cos／sin／雙jitter／tone五值，兩個clamped arm projections及一個closed-form stem組成三rounded capsules，product-complement union保證Y接點不疊高度；端點平方距離與compact smooth profiles維持C1。`hypot(0.27, 0.28) + 0.036 + 0.015 < 0.5`保證cell-owner為空針腳底布，tight local rectangle先跳過空glyph projections。128² grain共享底布／線，192條雙向quartic週期pulse呈細織紋；full yarn不計被遮底布，body0不finish線。Convex weights保留底布與線各自height／roughness，不是文字貼花或三線疊高；AO0.94–0.99、opaque M0／mortar0。0.12 m tile／0.0012 m relief，逐點無配置／hash／trig／sqrt，maps與ownership沿用，不新增線geometry、透孔或布料模擬。

`abaloneshells` 每枚快取cos／sin／雙jitter／tone／growth phase六值，Cartesian skew與parabolic bend扭曲橢圓；`0.37 + 0.07×0.37 + 0.14×0.37² + 0.012 < 0.5`保證旋轉後support仍在cell。單側五孔只做一次nearest-row索引，0.02 support小於0.05半pitch，孔owner切換在空support；另一側與孔間橋不挖空。Height隨q向邊緣升高，compact rim再抬高、中心更低；九道quartic growth pulses為靜態nacre-inspired pigment／微紋，非虹彩shader。128² grain僅finish可見殼，full孔及空shell跳過finish；全opaque M0／mortar0、0.45 m tile／0.006 m relief。逐點無配置／hash／trig／sqrt或鄰格／孔列掃描，maps與ownership沿用，不新增geometry、透明孔洞、thin-film或貝類模擬。

`gyroidinfill` 只快取兩個seeded phase offsets與128² grain；精確`F=sinX cosY + (sinY+cosX)/√2`為gyroid的`z=π/4`截面，四次trig取樣保留解析曲率，不使用逐點hash／配置／sqrt、nearest-owner或curve tracing。F²讓中心crown無abs cusp，0.26 support／0.045 core的squared smooth shoulders接底C1；full core與saddle接點不切斷。曲帶height採rounded crown，空support直接回傳0.00009 m低opaque底面並跳grain；M0／mortar0、AO0.65–0.99。0.16 m tile／0.0015 m relief及既有maps／ownership沿用，不新增3D lattice、mesh輸出、geometry、displacement、透孔或列印模擬；不是固定world-space線寬的distance field。

`cloisonne` 每朵快取三對軸cos／sin、雙jitter與tone共九值；三對稱橢圓計算六瓣，再加中心圓，閉合q=1輪廓以0.23 support／0.09 core的squared肩與圓頂高絲插值。相鄰瓣bisector最低q≈1.26453高於1.23外support，反向abs軸最低q=1.890625；中心support半徑≈0.04215小於花瓣內support≈0.04255，故owner切換全在空wire／pigment support。旋轉support加jitter<0.423<0.5，不跨cell。低非金屬青藍琺瑯／高M1黃銅絲，128²全域grain、tone僅作用在閉框內避免cell邊縫。空wire跳圓頂finish；逐點無配置／hash／trig／sqrt或鄰格掃描，固定三軸。0.18 m tile／0.001 m relief，factor1與maps／ownership沿用；非玻璃透光、geometry、thin-film或燒製模擬。

`rambutanskin` 每根快取cos／sin、雙jitter與tone五值，以quadratic centerline `bend×(0.65+0.35tone)×t²`形成彎毛，width隨t由0.065縮至0.018；squared橫斷面與smooth兩端cap使root／tip接底C1。0.085半徑根瘤與毛高度正向加成，continuous低果皮保留128²全域grain；seeded tone只作用毛身。`hypot(0.32,0.28+0.018)+0.05<0.488<0.5`保證旋轉毛support不越cell，根瘤亦在cell。bounding空support跳毛寬／cap與曲線；逐點無配置／hash／trig／sqrt或鄰格掃描，無nearest-curve迭代。全opaque M0／mortar0、0.12 m tile／0.0035 m relief，沿用maps／ownership，不新增hair geometry、displacement、透明縫、SSS或生長模擬。

`rackgears` 每枚cos／sin、雙jitter與tone五值快取，compact矩形齒根與七梯形齒採product-union，齒寬由0.037縮至0.019、0.008 smooth bevel。單次nearest-tooth lookup，最大half-width0.037<半pitch0.045，owner切換在空齒support；齒根與齒重疊0.025，完整齒根不被齒間谷切斷。`hypot(0.36,0.13)+0.025<0.408<0.5`，旋轉後不跨cell。abs鏡像一次計算雙孔，full低孔跳grain；低縱groove只作用face，M1鋼面／M0低底孔，全opaque／mortar0。Bounding與空face略過finish，128² grain僅可見齒條；逐點無配置／hash／trig／sqrt、鄰格或齒列掃描。0.6 m tile／0.007 m relief、factor1，maps／ownership沿用；不是involute嚙合模型、geometry、透孔或機械模擬。

`poplin` 沿用既有Oxford單層ownership／compact lift方式但改為單紗1×1與不等密度：48細經／24粗緯，radius／core分別0.22／0.16及0.4／0.32，皆在owner前C1歸零。各crossing parity決定單一上層；lift在經0.30／緯0.46半寬與0.06肩內消退，跨row／col時連續紗不跳height。細經base0.30／crown0.04、粗緯base0.44／crown0.07，交錯±0.12 lift呈橫肋，不是色彩checker。192經纖／96緯纖為quartic-like smooth compact脈，128² seeded grain只finish可見紗；空coverage提前回傳。逐點無配置／hash／trig／sqrt或鄰紗掃描，偶數48／24令signed UV torus與parity一致。全opaque M0／mortar0、0.016 m tile／0.0003 m relief，maps與ownership沿用；無紗線geometry、透明織孔、cloth physics或anisotropy shader。

`ooliticlimestone` 每鮞粒快取雙center、inverse radius²、tone與3／4 cortex count五值；radius0.32–0.42、jitter0.03令support≤0.45<0.5。雙periodic sine warp保留C1，cell-units正模運算防止`fract(-epsilon)`浮點捨入1而越table。Squared q以0.15 shoulder接基質，quartic phase pulse呈同心皮殼、q0.04–0.07 smooth暗核；無sqrt／atan2或鄰粒掃描。128² grain只影響共同磨面微高差／finish，16² noise調基質，height始終`0.35+0.002grain`、AO1，不把核／皮殼做成珠或洞；全高差≤0.24 μm。逐點兩次trig，無配置／hash／sqrt／nearest曲線迭代。全opaque M0／mortar0、0.024 m tile／0.00012 m relief，maps與ownership沿用，無geometry、displacement、透光或地質生長模擬。

`ogeetiles` 以偶數六rows／六columns維持staggered torus，半寬`w(t)=0.5(1-smooth(t))`與鄰row的`w(1-t)`恰加0.5，兩個固定row候選填滿平面。平方margin `w²-dx²`避免窄尖端bevel遇axis的abs cusp；q0.0049起、0.004 smooth bevel過渡至高釉面。Nearest-column與row候選owner切換全在低灰縫support，36個seeded tones及128² grain僅finish可見face，空face提前回傳。這是field-based縫，不宣稱固定Euclidean縫寬；上下尖端自然融入灰縫。逐點無配置／hash／trig／sqrt或鄰格掃描。全opaque M0、0.72 m tile／0.004 m relief，maps與ownership沿用；無geometry、displacement、透明縫、施工或釉面光學模擬。

`bittermelonskin` 快取96疣的雙offset／inverse radius²／tone五值與十二rib tones；12×8 periodic noise平緩warp，128² grain共用finish。Nearest-owner cell以正值`(coordinate+0.5)%period`歸一化；rib radius0.44、疣X radius≤0.34+jitter0.04=0.38、Y≤0.41+0.035=0.445，均小於0.5，在owner切換前C1歸零。Squared compact smooth pulse形成圓鈍疣，不用sqrt或尖冠；連續rib不隨row分段。Raw height為`0.12+0.32ridge+0.24bump+0.006grain`，保留疣／肋／溝三級真height。逐點無配置／hash／trig／sqrt或鄰格掃描；全opaque M0／mortar0、0.18 m tile／0.0045 m relief，maps與ownership沿用，無果實geometry、displacement、透明孔、SSS或生長模擬。

`cocobolo` 沿用既有磨面木紋pigment／微finish方式：4×2 cached noise以0.08幅度warp共同x，正值`(u+warp+1)%1`保留torus；warp的u導數絕對值≤0.48，映射斜率≥0.52，不摺返。12×2寬深紋與48×3細紋以0.16／0.45及0.12／0.28的smooth threshold漸變，192×8纖維加細色變。Color界限0.08–0.86，深紋不改height；height始終`0.35+0.002fiber`、全微高差≤0.32 μm／AO1。四份noise皆快取，逐點無配置／hash／trig／sqrt／鄰格掃描；全opaque M0／mortar0、0.24 m tile／0.00016 m relief，maps與ownership沿用。無geometry、displacement、SSS、anisotropy shader或生長模擬。

`doubleedgerazorblades` 沿用既有utility blade的研磨面finish與rack gear的低底／M1方式，每片快取cos／sin、雙offset與tone五值。Compact矩形減四corner masks，三圓瓣nearest lookup與capsule中央槽採inverse product-union；半hole pitch0.08>radius0.043，owner切換不在circle support。Capsule clamp接點的squared distance為C1，所有core／outer shoulder都smooth；abs只出現在plateau。兩長面以0.105–0.165 smooth hone降低height0.24、提高亮度並降低roughness，不是換色假刃。`hypot(0.36,0.19)+0.025<0.433<0.5`限制旋轉support；empty plate／cutout提前跳finish，128² grain只用於可見鋼面。逐點無配置／hash／trig／sqrt或鄰格掃描。全opaque／mortar0、鋼M1／低底槽M0、factor1、0.18 m tile／0.0003 m relief；maps與ownership沿用，無geometry、透明孔、切割、碰撞或機械模擬。

`chiastolite` 每晶體快取cos／sin、雙offset與tone五值；quartic squircle `qx²+qy²`以q0.7–1 smooth肩接褐色host。`0.35*2^(1/4)+0.025<0.442<0.5`使旋轉support不越owner。兩個以squared transverse distance形成的compact bars採product-union成十字，半寬0.018加0.04×smooth軸向squared q，四臂向外漸寬，無abs cusp。128² grain供共同微finish、16² noise調host；空face跳cross。Height始終`0.35+0.002grain`、全微高差≤0.24 μm／AO1；晶體與十字只是pigment，只有roughness作磨面區分。逐點無配置／hash／trig／sqrt或鄰格掃描；全opaque M0／mortar0、0.12 m tile／0.00012 m relief，maps與ownership沿用，無geometry、displacement、透光或礦物生長模擬。

`dimity` 沿用既有poplin compact yarn ownership／lift，48×48 parity選單一上層；每八經紗前兩條cord，radius／core0.36／0.30，六細紗0.22／0.16，緯0.28／0.22。Cord warp加0.16height，同列連續weft以0.46半寬／0.1肩的carrier lift越cord，在owner前C1歸零，避免只提高warp而緯紗斷階。單紗±0.1 lift於經0.44／緯0.36半寬、0.06肩內消退；共同base0.29／crown0.05。192² compact纖維與128² grain只finish可見coverage，空coverage提前回傳；逐點無配置／hash／trig／sqrt或鄰紗掃描。48與八整除且偶數，signed UV保留cord groups與parity。全opaque M0／mortar0、0.02 m tile／0.0003 m relief；maps與ownership沿用，無紗線geometry、透明織孔、cloth physics或anisotropy shader。

`juniperberries` 每果快取cos／sin、雙offset與inverse-radius-squared五值，4×4 seeded owner；最大radius0.42加jitter0.025≤0.445<0.5。Squared radial cap以0.2 shoulder接深底，smooth cap成圓果頂；局部旋轉三條120°有限capsule，長0.29、radius／core0.018／0.009，以product-union形成三淺縫，中心scar radius／core0.06／0.035。Squared capsule距離及smooth compact肩在原點、端點、support與owners維持C1，無atan2 branch或sqrt奇點。32² cached bloom調霜色／roughness，128² grain只微finish；空support提前回傳，逐點無配置／hash／trig／sqrt或鄰格掃描。真height分層為果頂、低三縫／scar、深底；全opaque M0／mortar0、0.064 m tile／0.006 m relief，maps與ownership不變，無geometry、透明果肉、SSS或生長模擬。

`gabbro` 沿用granite的compact normalized mineral weights，但12×12粗晶、六值快取site雙offset／tone／cos／sin／phase，色分dark pyroxene與pale plagioclase；僅淡晶有12-frequency compact平行雙晶pigment。Site在0.3–0.7、support radius1.2，省略site最短1.3，owner切換前weight為零；own site squared distance≤0.98<1.44，denominator嚴格正不需epsilon。Cap連續平方四次形成16次權重，normalized blend平滑接角狀晶粒，3×3固定lookup無逐點配置／hash／trig／sqrt。128² grain供共同磨面`0.35+0.002grain`、物理微高差≤0.24 μm／AO1；晶界與雙晶不是凹槽或凸塊。全opaque M0／mortar0、0.18 m tile／0.00012 m relief；maps、ownership與既有height map正規化不變，不新增geometry、displacement、透光或地質模擬。

`turnbuckles`（雙眼螺紋花籃螺栓）新增九枚seeded旋轉鋼件：閉合中央長框、真低框心、兩側連接螺桿與閉合眼環，孔洞維持opaque非金屬暗底而非透明。雙側鏡像細螺紋具有較低高度、較暗色與較高粗糙度；金屬mask乘factor1。0.24 m tile／0.003 m relief、mortar0；沿用height、tint、repeats、Worker／cache與ownership，不新增幾何、穿孔、displacement或機械模擬。 Compact quartic框、squared眼環與螺桿肩部C1連接；四值pose及128² grain快取，逐點無配置或trig。

`rhodochrosite`（菱錳礦）加入粉紅基質、六組寬白波狀層帶與細伴生帶，非瑪瑙閉合環。3×3與9×3 cached noise扭曲連續六週期相位，compact squared寬／細肩部保持C1；12² pigment與128² grain分離色澤及磨面。層帶只改pigment／roughness，共同磨面微高差≤0.24 μm、AO1，全opaque M0／mortar0、0.18 m tile／0.00012 m relief。沿用height、tint、repeats、Worker／cache及ownership，不新增晶體geometry、displacement、透光或地質模擬。

`bayleaf`（月桂葉）加入九枚seeded旋轉的橄欖綠尖橢圓平滑葉片、短葉柄、高中脈、七對向葉尖彎曲的側脈與細邊緣脈。沿用compact葉片／葉柄coverage；軸線fade消除abs側脈座標的尖點，平方輪廓與smooth肩部維持C1。四值pose、七個root與128² grain在setup快取，grain物理微高差≤6.4 μm，低於側脈40 μm，避免微粒遮蔽葉脈。全opaque M0／mortar0、0.24 m tile／0.0016 m relief，沿用height、tint、repeats、Worker／cache與ownership；不新增葉片geometry、透明cutout、SSS或植物模擬。

`gabardine`（軋別丁）新增卡其色密經二上一下經面陡斜紋。沿用poplin compact yarn coverage／crossing lift／fiber路徑，但48經×24緯的三格draft逐緯移一經，斜向pitch約63.4°，非1×1平紋或2×2等距斜紋。經radius／core0.495／0.44、緯0.25／0.18，密經遮住大部分底；經緯共同base0.34／crown0.04、±0.1 lift在owner切換前平滑歸零。192／96-frequency fibers與128² grain沿用快取，無逐點配置或trig。全opaque M0／mortar0、0.018 m tile／0.0003 m relief；height、tint、repeats、Worker／cache與ownership不變，不新增紗線geometry、透明孔洞或布料模擬。

`oilspotglaze`（油滴黑釉）加入黑褐亮釉上的64枚seeded橢圓鐵氧化物晶斑、褐色內部、較亮環緣與細晶pigment。七值pose快取cos／sin、雙offset、雙逆半徑平方與tone；最大radius0.34加jitter0.1<0.5，compact斑面與rim smooth肩部在owner前C1歸零，無逐點配置／hash／trig／sqrt。128² grain供共同釉面微高差≤0.24 μm，64² crystal只供色澤，AO1；亮褐斑仍是介電釉下色而非金屬環。全opaque M0／mortar0、0.16 m tile／0.00012 m relief，沿用height、tint、repeats、Worker／cache與ownership；不新增晶體geometry、displacement、透光或窯燒模擬。

`persimmonslice`（柿子切面）新增九枚seeded旋轉橙色圓切面、八向分離深籽、淡色中心與細深色外皮。沿用水果flush cut契約：籽／果肉／皮共平面、grain微高差≤8 μm，籽僅改色與粗糙度，不假冒凹孔。四值pose、八組axis、128² grain及inverse squared常數在setup快取；radius0.38加jitter0.025<0.5，圓面／皮／pith／ellipse種籽compact smooth肩部C1，逐點無配置／hash／trig／sqrt。全opaque M0／mortar0、0.24 m tile／0.002 m relief；height、tint、repeats、Worker／cache與ownership不變，不新增水果geometry、透明果肉、SSS或生長模擬。

`kitkattiles`（細長凹面釉磚）新增24欄×4列直疊玉綠finger tiles，6:1 pitch、沿長向真正低凹槽與等UV寬灰縫，非凸木條或一般平地鐵磚。沿用subwaytiles四邊compact smooth face／mortar，橫向平方smooth凹槽在兩端fade，中心比肩部低0.48 mm；grain微高差≤6 μm。96個owner tone與128² grain快取，逐點無配置／hash／trig／sqrt。全opaque M0、mortar=1-face，0.6 m tile／0.003 m relief；沿用height、tint、repeats、Worker／cache與ownership，不新增geometry、displacement、透明或鋪磚模擬。

`brakediscs`（雙圈鑽孔煞車碟）新增九枚seeded旋轉銀色碟面、中央低孔、五個安裝孔、兩圈各12個錯半步通風孔、較高中轂與細同心磨耗紋。孔與碟外維持opaque M0暗底，鋼面mask乘factor1。沿用bearing squared annular face與compact hole肩部；兩值pose、29孔三值座標與128² grain在setup快取，逐點無配置／hash／trig／sqrt。磨耗用r²週期compact帶，無中心奇點，僅4 μm低紋，不以粗槽冒充研磨。mortar0、0.72 m tile／0.004 m relief，height、tint、repeats、Worker／cache及ownership不變；不新增幾何、透明穿孔、displacement或煞車物理。

`tint` 在 `generateProceduralMaps` 內只乘上 dark→light 插值後的 sRGB 顏料色，之後才與固定灰縫色混合，因此灰縫保持中性；結果由 `Uint8ClampedArray` 夾限。`create()` 先驗證陣列長度 3、每項有限且在 0–4，再傳入同步生成；未給 `tint` 時走原本的運算路徑，不多一次乘法，輸出逐位元組不變。

Worker 生成沿用 geometry worker 的模式：`procedural.maps` job 由主執行緒驗證完整選項後送出純量 request（requestBytes 0），worker 端 `trustedProceduralMapsJob` 呼叫同一個 `generateProceduralMaps` 並 transfer 四個 buffer；主端 decode 檢查四個 `Uint8ClampedArray` 長度一致且為合法邊長，再比對請求的 size。worker module 在 dist 以 `new URL('./workers/procedural-material.worker.js', import.meta.url)` 靜態建構，bundler 可分析。貼圖建立仍在主執行緒，destroy 與 ownership 不變。

`ProceduralMapCache` 只保存 CPU 端的四個 `Uint8ClampedArray`，從不交給呼叫者；`create()` 每次仍以 `ImageData` 複製進新的貼圖，所以 destroy 一個 preset 不影響其他 preset 或快取。key 由 kind／size／seed／contrast／roughnessBias／tint 串成，Map 插入順序即 LRU 順序（命中時重新插入）；超過 bytes 或 entries 上限時從最舊的淘汰，單筆超過上限則不保留。進行中的生成以 pending promise 共用，失敗時移除且不寫入。

Height map 走 optical texture array 第 6 層（`opticalSample(..., 5).r`），WGSL 在 MeshUniforms 末尾、GLSL 以 `heightMapSettings` uniform 加一個 vec4，mapped UV 區塊增為 18 slot／144 floats、atlas residency 每 texel 24 bytes。shader variant `heightMap` 只在材質有 height map 時保留新的 parallax 分支並移除舊的 normal.z 分支；沒有時還原原本的條件字串，舊材質 shader 文字不變（但共用 uniform 版面變大）。程序 height 以 `(h-min)/(max-min)` 正規化，平面為 0.5。

## 已驗收基礎：P01–P08（歷史範圍；後续擴充另列）

目前 root metadata 是 `1.22.1`／Apache-2.0（`package.json`／`LICENSE`），npm 未發佈；以下各階段的日期／counts／版本／release 與當時批准範圍均為歷史記錄，不作新階段驗收。正式路徑是 `src/index.ts`（統一公開入口）→ `packages/core` 的 Game／Scene／Clock → `packages/graphics` 的 Renderer；範例不建立第二套渲染器。實際驗收見 `ACCEPTANCE.md`。

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
- P07 當時整合 OPM.js v1.1.0 官方完整 dist／LICENSE／release checksum；目前 vendor 為官方 v1.13.1（tag `v1.13.1`），build 原樣複製。Voice 內部正規化為 v8，公開 `OPMVoice` 保留 `version: 1` 契約。上游可選聲部數，但引擎仍以八個獨立 OPM instance 各保留一個聲部，總預算含 release，overflow 只以官方 `opm.panic()` 清除最舊 SFX instance 的音符，保留 managed node／routing；不影響 BGM，也不修改官方 DSP。P137 前代價是八個 AudioContexts/worklets；P137 起八個 instance 借用 AudioManager 擁有的單一 AudioContext（八個 worklet nodes），teardown 使用官方 `opm.dispose()` 且不關閉借用的 context。首次手勢 unlock 前不建 AudioContext；bounded lookahead 避免填滿官方 256-event queue；Scene 清理取消非 persistent 音訊。此 vendor 升級不新增引擎功能或擴大認證範圍。
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
- AudioManager.loadSample encoded cache 不提前 decode，SampleAudioAsset.decode／play 需 unlock。Source→perplay gain→sample channel/master buses 使用 AudioManager 擁有的共用 context（P137 前為第一個 OPM context），獨立32-playback budget、不搶八個 OPM slots；vendor 不改，worklet reset 或 OPM 啟動失敗不斷 sample buses。
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

## P137 audio context ownership

The manager, not OPM, owns the one AudioContext. OPM v1.13 accepts a borrowed
context and never suspends or closes it, so pause/resume/destroy belong to the
manager. This decouples sample/stream audio from OPM start-up: an insecure origin,
missing vendor file or blocked worklet fails only OPM, which is reported rather
than rejecting unlock. Eight isolated OPM instances remain because SFX-only stealing
needs per-slot ownership. They now share one clock instead of eight, so cross-context
gain mapping is no longer exercised by the manager; the mixer stays context-generic.
The borrowed context is injected through an internal method because changing a
published constructor would break the API compatibility gate's declaration identity.

## P138 optional OPM module origin

A deployer may load the official OPM API from another URL. The worklet must come from
the same tree, so the option names `dist/api/index.js` and OPM resolves its processor
beside it; no separate worklet URL is accepted. Because neither `import()` nor
`addModule()` can carry integrity metadata, the engine verifies only the exported
`VERSION` against the vendored pin, then treats the module as trusted code. URLs must
be HTTPS, or HTTP on the page origin, so an HTTPS page cannot be downgraded to a
mixed-content CDN and local same-origin hosting keeps working. Validation happens in
`Game.create` before any renderer is created. Failure at unlock reuses the P137 path
(`opmState: 'failed'`), so samples and streams survive an unreachable CDN.

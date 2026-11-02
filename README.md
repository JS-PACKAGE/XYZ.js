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
- `f05opticalfaces`：四個不帶帽的JIS-F05光接收座霧黑樹脂矩形正面，長側凹槽、一端兩角倒角的六邊凸導框、雙圓側凸耳、暗鍵形口與低圓井；全非金屬，無快門／LED／透明鏡片。依NRND TORX1350A(F)水平型原廠圖近似，非光學／資料／音訊／電氣／插合／EMC／安全模擬或認證。當時目錄為880種。
- `minidin4femalefaces`：2×2四個mini-DIN四接點母座正面，黑PBT承座／圓內芯、連續薄鍍錫黃銅接地環、上開口缺口／雙下側階梯、上直下橫四槽及獨立封閉下鍵孔。依[Same Sky MD-S第2頁](https://www.sameskydevices.com/product/resource/md-s.pdf)獨立MD-40S四接點圖與[原廠照片](https://cdn.sameskydevices.com/products/image/getproductimage/976?typecode=m&width=300)近似，不混用通用九孔大圖或PCB焊孔。僅接地環為金屬，default metallic1／explicit0不改stored mask；無外屏蔽罩、可見銀色內接點環或視訊／電氣模擬。形狀／PBR為作者近似，非CAD／插合／認證。建議512，32僅粗預覽；當時目錄為881種。
- `dcbarreljackfaces`：2×2四個DC圓孔電源座正面示意，高身黑PBT矩形、偏上暗圓口、實心凹入鍍鎳中心針與獨立下方鍍銀橫條（上下平直、僅兩端圓裁切）。僅針／橫條M1，其餘PBT／孔底M0；背底 < 孔底 < 橫條 < 針 < 承座，無外金屬環／額外凸圓框。依[Same Sky PJ-102A](https://www.sameskydevices.com/product/interconnect/connectors/dc-power-connectors/jacks/pj-102a)、[原廠圖第2頁](https://www.sameskydevices.com/product/resource/pj-102a.pdf)與[正面照片](https://cdn.sameskydevices.com/products/image/getproductimage/690?typecode=m&width=300)近似。Default metallic1／explicit0僅改factor、不改stored mask；省略背焊腳／PCB／真通孔，不打包來源素材。作者正面插圖，非CAD／電氣／極性／開關／安全／插合模擬或認證；建議512，32僅粗預覽。當時目錄為882種。
- `stfiberadapterfaces`：2×2四個ST simplex轉接座簡化正面：六平面鍍金屬六角底座、同心圓凸肩、凸起圓筒唇，只有一個上開放軸向鍵槽與左右兩個相對卡口柱，中央深暗不透明圓腔。鍵槽只降唇到連續金屬凸肩，不切到背景；硬體／鍵槽底M1，圓腔／背底M0，背底 < 腔底 < 六角底座 < 凸肩／鍵槽底 < 柱 < 唇。依[SENKO ST](https://www.senko.com/product/st-adapter-2/)、五頁[DS-ST-000006-RevA-EN第1／3頁](https://www.senko.com/wp-content/uploads/2025/01/DS-ST-000006-RevA-EN.pdf)與[原廠照片](https://www.senko.com/wp-content/uploads/2021/09/ST-Adapter.png)近似216-101；僅知鍍金屬，不推定鎳。內部zirconia有規格但照片未清楚露白環，不畫陶瓷環／中心接點／針。29.3 mm是軸深，double-D 9.6 × 7.8 mm為面板開孔參考，非正面；metadata建立2024-11-15非印刷日期。作者比例非CAD，省略螺紋／滾花齒／墊圈／帽／背部／線纜／ferrule／PCB，非光學／電氣／插合／安全模擬或browser／FPS認證。0.04 m／0.0042 UV relief、default metallic1；explicit0僅改factor不改mask，constructor快取、逐點無配置／迴圈／hash／trig／sqrt。當時目錄為883種。
- `ftypefemalefaces`：2×2四個F型母頭穿板接座裸正面：六平面鍍鎳金屬六角底座、同心凸圓肩、封閉無鍵槽凸圓唇、淡色P.P.介電圓盤與更深微小暗色不透明入口。外部硬體M1，背底／P.P.／入口M0；背底 < 入口 < 六角底座 < 凸肩 < P.P. < 唇，無ST鍵槽／卡口柱、公針或虛構中央金屬接點環。依歷史[Amphenol Connex CAT-103 ©2001，PDF159／印刷158頁](https://docs.rs-online.com/1ab7/A700000006717073.pdf#page=159)222121照片／圖面及Nickel／P.P.／75Ω表近似，非通用Delrin／Teflon。11 HEX、21.3 mm軸向總長與墊圈／螺帽側尺寸僅供參考，非量測正面高度；微入口真實截面未能辨明，圓形入口是作者簡化。0.04 m tile／0.0042 UV relief（非公尺深度），default metallic1／explicit0僅改factor、不改stored mask；無螺紋螺旋／裝飾螺紋圈、墊圈齒、背部／線纜、真通孔／透明／新mesh。作者材質與光學近似，非CAD／RF／75Ω／電氣／插合／安全模擬；75Ω僅識別歷史料號。constructor快取、逐點無配置／迴圈／hash／trig／sqrt；沿用pbr3d與texture ownership。建議512，32僅粗預覽。當時目錄為884種。
- `to220packagefaces`：2×2四個外露金屬片TO-220正面，兩個上角均倒角、一個暗色不透明凹安裝孔、霧黑矩形本體及三支等間距平行直腳（寬根肩／窄尾）。金屬片／腳M1，其餘M0、C1邊界混合，非電氣隔離；背底.02 < 孔.06 < 金屬片.30 < 腳.44 < 本體.68為作者高度。依[STP55NF06 May 2012 Doc ID7544 Rev11](https://www.st.com/resource/en/datasheet/stb55nf06.pdf#page=13)實看第1頁封面與第13頁Figure23、實讀第12頁表，非TO-220FP。尺寸僅參考，非CAD／熱／電氣／RF／安全／FPS模擬，不推定化學或鍍層。0.08 m tile／0.0042 UV relief非公尺深度，default metallic1／explicit0僅改factor不改mask；快取73,856 B typed payload不含JS開銷，query無配置／迴圈／hash／trig／sqrt／鄰居搜尋。建議512，32不保證窄腳可辨。目錄885種，gallery含plain886項。
- `fordcircles`：福特圓——對每個既約分數`n / d`（d ≤ 12，46個）立一個半徑`1 / (2 d²)`的圓盤並以中線鏡射（91個圓盤，相鄰法里分數的圓盤相切、內部互不重疊——此幾何以探針驗證，不在測試中），深海軍藍底上的琥珀金圓盤，色調隨分母變小而變亮；測試以獨立寫的福特圓幾何比對6,000個點並嘗試256個平移、檢查恰好一個符合，**不涵蓋柔化邊緣區的形狀**；示意的數論幾何圖案；作者示意，未引用特定來源也沒有對照照片。0.5 m tile／0.0008 UV relief（非公尺深度），metallic0；建構與取樣耗時未量測（取樣每次走過46個圓盤）。目前目錄1018種，含plain的gallery1019項。

- `hammingtable`：漢明距離表——32×32的圓角方磚，色調為兩個索引（5位元）的漢明距離`popcount(row xor col)`，對角線最暗、互補處最亮，在每個2的冪次重複相同的方塊結構；測試以獨立寫的位元計數重建色調表並比對每格中心顏色，每個seed有**兩個**符合的環面平移（互為加16的互斥或對稱），測試明確檢查這點；示意的位元運算表；作者示意，未引用特定來源也沒有對照照片。0.5 m tile／0.0008 UV relief（非公尺深度），metallic0；建構與取樣耗時未量測。目前目錄1017種，含plain的gallery1018項。

- `aggregationfrost`：聚集霜——96×96環面上的擴散限制聚集（900個粒子，隨機行走黏在團簇的邊上），冰藍色的霜花狀細枝，色調從中央（最老）向枝端漸暗，每塊拼貼一朵、不與相鄰拼貼相連；測試從節點顏色反推佔據格，以獨立的廣度優先搜尋檢查團簇連通、恰好900格、顏色隨圖距離下降，**沒有獨立重寫聚集演算法，也沒有檢查碎形維數**；示意的模擬結果；作者示意，未引用特定來源也沒有對照照片。0.5 m tile／0.0008 UV relief（非公尺深度），metallic0；sampler建構約126–150 ms（單次量測，非benchmark），取樣本身為常數次運算。目前目錄1016種，含plain的gallery1017項。

- `cyclicwaves`：循環波——96×96環面上的八狀態循環細胞自動機（馮紐曼鄰域、閾值1、150個同步步驟、隨機起始），狀態0到7對應由暗靛藍到琥珀黃的色調，形成螺旋與迷宮狀的波；測試從節點顏色反推狀態、檢查統計量（相鄰相差不超過一個狀態約97%、每格都有±1的鄰居、各狀態占比各約八分之一），**沒有獨立重寫更新規則**；示意的自動機快照；作者示意，未引用特定來源也沒有對照照片。0.5 m tile／0.0008 UV relief（非公尺深度），metallic0；sampler建構約39–78 ms（單次量測，非benchmark），取樣本身為常數次運算。目前目錄1015種，含plain的gallery1016項。

- `isingdomains`：伊辛域——64×64環面上二維伊辛模型的Metropolis動力學快照（溫度2.35、150個棋盤掃描、隨機起始），向上自旋亮、向下暗並以同向鄰居比例輕微染色，萊姆綠迷彩狀磁區；測試從節點顏色反推自旋、檢查上色邏輯與統計量（相鄰同向約0.78–0.84），**沒有獨立重寫Metropolis更新，也沒有驗證平衡**；示意的模型快照；作者示意，未引用特定來源也沒有對照照片。0.5 m tile／0.0008 UV relief（非公尺深度），metallic0；sampler建構約64–102 ms（單次量測，非benchmark），取樣本身為常數次運算。目前目錄1014種，含plain的gallery1015項。

- `percolationclusters`：滲流團簇——64×64環面上機率0.5927的點位滲流，佔據格以union-find連成團簇（環繞），依ln(團簇大小)/ln(最大團簇)上色，硫磺黃的迷彩狀圖案；測試從sampler節點顏色反推佔據格，再以獨立的洪水填充重新標記團簇並比對顏色，驗證團簇邏輯但不驗證雜湊決定的佔據本身；示意的隨機圖案，不是真實滲流的模擬；作者示意，未引用特定來源也沒有對照照片。0.5 m tile／0.0008 UV relief（非公尺深度），metallic0；每個取樣點為常數次運算，未量測耗時。目前目錄1013種，含plain的gallery1014項。

- `voronoifacets`：Voronoi切面——與voronoicells相同的Voronoi板塊，但每塊板塊的色調沿隨機方向線性漸層（至多每格寬±0.35），翡翠綠、深色粗糙的細縫；共用voronoicells的sampler（新增漸層欄位，voronoicells與voronoipillows的`facet`為0、行為不變）；測試檢查每個seed恰好64個板塊、板塊內色調有漸層（平均差距約0.15）、縫的特性、C1與週期，**沒有獨立重寫位置點模型**；已知缺點：銳角交會處有模糊污點；作者示意，未引用特定來源也沒有對照照片。0.4 m tile／0.0012 UV relief（非公尺深度），metallic0。目前目錄1012種，含plain的gallery1013項。

- `multiplicativeorder`：乘法階表——48×48方格，格代表模n = row + 2（2到49）下的剩餘a = col + 1（1到48）；與n有公因數者（887格）最暗，否則以ord_n(a)/φ(n)取1.5次方上色（比值1為原根，共406格；階為1共189格；最大階46），呈冰藍色在深藏青底上，seed把整張表在環面上平移；與totienttable等數論表共用方格形狀；測試以獨立的重複乘法與互質計數重寫，逐seed找出唯一的環面平移；只是比值表示，不是定理證明；作者示意，未引用特定來源也沒有對照照片。0.3 m tile／0.0008 UV relief（非公尺深度），metallic0；每個取樣點為常數次運算，未量測耗時。目前目錄1011種，含plain的gallery1012項。

- `sandpileidentity`：沙堆單位元——64×64格阿貝爾沙堆群的單位元（Dhar的方法：兩倍最大穩定組態穩定化後相減再穩定化；高度0到3，396／152／1,476／2,072格，鏡射與轉置皆對稱，呈曼陀羅般花紋），金色深淺對應高度，seed把圖案沿環面平移，拼貼時會有圖案邊界形成的方框接縫；測試以獨立的掃描式倒塌演算法重寫，檢查`e + e = e`與對稱性，並逐seed找出唯一的環面平移；只證明結果滿足`e + e = e`，沒有另外驗證對所有可復現組態為單位元；數學物件的視覺化，作者示意，未引用特定來源也沒有對照照片。0.5 m tile／0.0008 UV relief（非公尺深度），metallic0；每個取樣點為常數次運算，單位元約69 ms算一次後快取（單次量測）。目前目錄1010種，含plain的gallery1011項。

- `voronoipillows`：Voronoi枕塊——與voronoicells相同的Voronoi板塊，但每塊板塊的高度是隆起的圓頂（隨到加權平均位置點的距離平滑下降），赤陶土色、深色粗糙的細縫；共用voronoicells的sampler（新增圓頂欄位，voronoicells為0、行為不變）；測試檢查每個seed恰好64個板塊、每塊板塊內高度差約半個relief、縫的特性、C1與週期，**沒有獨立重寫位置點模型**，也沒有看過打光的3D外觀；已知缺點：銳角交會處有模糊污點；作者示意，未引用特定來源也沒有對照照片。0.4 m tile／0.0016 UV relief（非公尺深度），metallic0。目前目錄1009種，含plain的gallery1010項。

- `voronoicells`：Voronoi細胞——8×8格各一個抖動位置點（共64個），依最近點分成64塊藍灰色多邊形板塊（每塊一個亂數色調）與深色、粗糙、被AO加深的細縫；邊界用軟權重（5×5鄰近格、吉尼不純度）使場為C1；測試檢查每個seed恰好64個板塊、每塊一個色調、縫的特性、C1與週期，**沒有獨立重寫位置點模型**；已知缺點：銳角交會處有模糊污點；示意的石板外觀，作者示意，未引用特定來源也沒有對照照片。0.4 m tile／0.0012 UV relief（非公尺深度），metallic0；每個取樣點約25次距離與指數運算，只量過單次512² maps約143–182 ms（非benchmark）。目前目錄1008種，含plain的gallery1009項。

- `cantordust`：康托爾塵——81×81 lattice上的第4階二維康托爾集（存活格256個，金黃色小圓點，像星座），被挖掉的格依層級以深淺不同的暗色上色，seed把lattice沿環面平移；與vicsekfractal共用sampler分支（只有存活規則不同，新增`rule`欄位，原材質行為不變）；測試以細分法獨立重寫模型，逐seed找出唯一的環面平移（含各層深度色調）；示意的碎形圖案，作者示意，未引用特定來源也沒有對照照片。0.5 m tile／0.0008 UV relief（非公尺深度），metallic0；每個取樣點為常數次運算，未量測耗時。目前目錄1007種，含plain的gallery1008項。

- `tsquarefractal`：T方塊碎形——64×64 lattice上的第5階T方塊碎形（341個方塊重疊覆蓋3,124格，未覆蓋的972格形成深褐色十字與T形骨架，覆蓋區為奶油色並依最深層略有色調），seed把lattice沿環面平移；測試以遞迴獨立重寫模型，逐seed找出唯一的環面平移（含各層色調）；示意的碎形圖案，作者示意，未引用特定來源也沒有對照照片。0.5 m tile／0.0008 UV relief（非公尺深度），metallic0；每個取樣點為常數次運算，未量測耗時。目前目錄1006種，含plain的gallery1007項。

- `vicsekfractal`：維澤克碎形——81×81 lattice上的第4階十字形碎形（存活格625個，金色細線），被挖掉的格依層級以深淺不同的暗青綠上色，seed把lattice沿環面平移；測試以細分法獨立重寫模型，逐seed找出唯一的環面平移（含各層深度色調）；示意的碎形圖案，作者示意，未引用特定來源也沒有對照照片。0.5 m tile／0.0008 UV relief（非公尺深度），metallic0；每個取樣點為常數次運算，未量測耗時。目前目錄1005種，含plain的gallery1006項。

- `squarekoch`：方形科赫島——第3階第一型二次科赫島（`F+F−F−F+F`取代三次，500個單位步、376個相異格點的封閉迴圈，邊在角落接觸、沒有邊被重複走過），鮭魚粉色細線與微光暈在暗赤褐底上，放在32×32格環面上不與相鄰拼貼相連，seed把曲線沿環面平移；共用走線sampler分支；測試以遞迴獨立重寫島嶼，逐seed找出唯一的環面平移；示意的碎形走線，作者示意，未引用特定來源也沒有對照照片。0.25 m tile／0.0008 UV relief（非公尺深度），metallic0。目前目錄1004種，含plain的gallery1005項。

- `radicaltable`：根基表——48×48方格，格代表n = row·48 + col + 1（1到2304），以ln(rad(n)) / ln(n)（rad為相異質因數的乘積；無平方因數的1400個數最亮、質數的冪為1/k，最小為2048的1/11）取2次方上色，呈淡鼠尾草綠在暗綠底上，seed把整張表在環面上平移；與divisorcount等數論表共用方格形狀；測試以獨立的試除法重寫根基，逐seed找出唯一的環面平移；只是比值表示，不是abc猜想的證明；作者示意，未引用特定來源也沒有對照照片。0.3 m tile／0.0008 UV relief（非公尺深度），metallic0；每個取樣點為常數次運算，未量測耗時。目前目錄1003種，含plain的gallery1004項。

- `goldbachtable`：哥德巴赫分拆表——48×48方格，格代表偶數n = 2·(row·48 + col + 2)（4到4610），以g(n)·ln(n)²/n（g為哥德巴赫分拆數，乘上ln(n)²/n以消掉整體成長、避免接縫色差）上色，呈紫羅蘭色在暗紫底上，最亮在n = 2310，seed把整張表在環面上平移；與divisorcount等數論表共用方格形狀；測試以獨立的試除法重寫分拆數，逐seed找出唯一的環面平移；只是分拆數表示，不是猜想的證明；作者示意，未引用特定來源也沒有對照照片。0.3 m tile／0.0008 UV relief（非公尺深度），metallic0；每個取樣點為常數次運算，未量測耗時。目前目錄1002種，含plain的gallery1003項。

- `totienttable`：歐拉函數表——48×48方格，格代表n = row·48 + col + 1（1到2304），以φ(n)/n（最小比值48/210在n = 210，質數最亮、偶數至多1/2）上色，呈琥珀金色直條紋（表寬48為偶數）在暗褐底上，seed把整張表在環面上平移；與divisorcount等數論表共用方格形狀；測試以獨立的互質計數重寫φ(n)，逐seed找出唯一的環面平移；只是函數值表示，不是定理證明；作者示意，未引用特定來源也沒有對照照片。0.3 m tile／0.0008 UV relief（非公尺深度），metallic0；每個取樣點為常數次運算，未量測耗時。目前目錄1001種，含plain的gallery1002項。

- `spirographtable`：螺旋規曲線表——6×6格，格(col, row)畫半徑a = col + 1的小輪在半徑b = row + 7的大環內滾動的內擺線（筆距比0.8），seed決定整體旋轉角（0到0.5弧度），銅色曲線與微光暈、暗紅褐底；曲線自交處用高斯和故無折痕，a與b有公因數的13格只畫一個封閉週期；測試以獨立重寫的曲線公式取96個點，檢查有25–29種旋轉角使全部曲線點落在亮處；只是整數比表（筆距比固定），不是實體螺旋規；作者示意，未引用特定來源也沒有對照照片。0.3 m tile／0.0008 UV relief（非公尺深度），metallic0；每個取樣點走訪360個線段，只量過一次512² maps約444 ms（單次量測，非benchmark）。目前目錄1000種，含plain的gallery1001項。

- `dodecagridfilled`：上色十二重網格拼貼——與dodecagridtiling相同的十二重補丁（151塊瓷磚），瓷磚內部有色調（正方形最亮、30°菱形最暗，權重為四條邊平滑步階的連乘），邊緣為淺萊姆綠細線、森林綠底，seed把補丁旋轉30°的整數倍；共用多重網格sampler分支的填色功能；測試以獨立重寫的程式逐seed比對頂點與瓷磚中心的顏色；只是一小塊補丁、色調不是真正的配色規則；作者示意，未引用特定來源也沒有對照照片。0.5 m tile／0.0007 UV relief（非公尺深度），metallic0；每個取樣點走訪330條邊與151塊瓷磚，未量測耗時。目前目錄999種，含plain的gallery1000項。

- `heptagridfilled`：上色七重網格拼貼——與heptagridtiling相同的七重補丁（154塊菱形），菱形內部有色調（寬菱形較亮、細菱形較暗，權重為四條邊平滑步階的連乘），邊緣為淺藍色細線、藏青底，seed把補丁旋轉360°／14的整數倍；共用多重網格sampler分支的填色功能；測試以獨立重寫的程式逐seed比對頂點與菱形中心的顏色；只是一小塊補丁、色調不是真正的配色規則；作者示意，未引用特定來源也沒有對照照片。0.5 m tile／0.0007 UV relief（非公尺深度），metallic0；每個取樣點走訪335條邊與154塊菱形，未量測耗時。目前目錄998種，含plain的gallery999項。

- `ammannfilled`：上色阿曼—本克爾拼貼——與ammannbeenker相同的八重補丁（148塊：62個正方形、86個菱形），瓷磚內部有色調（正方形較亮、菱形較暗，權重為四條邊平滑步階的連乘），邊緣為琥珀色細線，seed把補丁旋轉45°的整數倍；共用多重網格sampler分支的填色功能；測試以獨立重寫的程式逐seed比對頂點與瓷磚中心的顏色；只是一小塊補丁、色調不是真正的配色規則；作者示意，未引用特定來源也沒有對照照片。0.5 m tile／0.0007 UV relief（非公尺深度），metallic0；每個取樣點走訪322條邊與148塊瓷磚，未量測耗時。目前目錄997種，含plain的gallery998項。

- `penrosefilled`：上色潘洛斯拼貼——與penrosetiling相同的潘洛斯菱形補丁，但菱形內部有色調（胖菱形較亮、瘦菱形較暗，色調以四條邊的平滑步階連乘決定，C1），邊緣為奶油色細線，seed把補丁旋轉36°的整數倍；共用多重網格sampler分支（新增`fills`、`fillRim`、`fillHeight`，其他材質為0、行為不變）；測試以獨立重寫的程式逐seed比對頂點與菱形中心的顏色；只是一小塊補丁、色調不是真正的配色規則；作者示意，未引用特定來源也沒有對照照片。0.5 m tile／0.0007 UV relief（非公尺深度），metallic0；每個取樣點走訪323條邊與149個菱形，未量測耗時。目前目錄996種，含plain的gallery997項。

- `dodecagridtiling`：十二重網格拼貼——深藍紫黑底上淡紫色細線畫出一塊近似十二重對稱的非週期補丁（德布魯因多重網格構造：六組網格、十二次單位根；151塊三種瓷磚：30°菱形41、60°菱形70、正方形40；330條邊、180個頂點、歐拉示性數1），seed把補丁旋轉30°的整數倍；與penrosetiling、penrosestar、ammannbeenker、heptagridtiling共用sampler分支；測試以獨立重寫的程式確認結構並逐seed比對；只是一小塊補丁；作者示意，未引用特定來源也沒有對照照片，也不宣稱是文獻中的某種十二重拼貼。0.5 m tile／0.0007 UV relief（非公尺深度），metallic0；每個取樣點走訪330條邊，未量測耗時。目前目錄995種，含plain的gallery996項。

- `heptagridtiling`：七重網格拼貼——深紫紅黑底上玫瑰色細線畫出一塊近似七重對稱的非週期菱形補丁（德布魯因多重網格構造：七組網格、七次單位根；154塊三種菱形：27／58／69；335條邊、182個頂點、歐拉示性數1），seed把補丁旋轉360°/14的整數倍；與penrosetiling、penrosestar、ammannbeenker共用sampler分支；測試以獨立重寫的程式確認結構並逐seed比對；只是一小塊補丁；作者示意，未引用特定來源也沒有對照照片。0.5 m tile／0.0007 UV relief（非公尺深度），metallic0；每個取樣點走訪335條邊，未量測耗時。目前目錄994種，含plain的gallery995項。

- `ammannbeenker`：阿曼—本克爾拼貼——深綠黑底上薄荷色細線畫出一塊八重非週期拼貼補丁（德布魯因多重網格構造：四組網格、八次單位根；148塊：62個正方形、86個菱形；322條邊、175個頂點、歐拉示性數1），seed把補丁旋轉45°的整數倍；與penrosetiling、penrosestar共用sampler分支（新增`roots`欄位，兩者行為不變）；測試以獨立重寫的程式確認結構並逐seed比對；只是一小塊補丁；作者示意，未引用特定來源也沒有對照照片。0.5 m tile／0.0007 UV relief（非公尺深度），metallic0；每個取樣點走訪322條邊，未量測耗時。目前目錄993種，含plain的gallery994項。

- `penrosestar`：潘洛斯星——深紫黑底上桃色細線的近五重對稱潘洛斯菱形補丁（五重網格偏移取接近零的`(0.011, −0.006, 0.004, −0.013, 0.004)`；160個菱形：95胖、65瘦；345條邊、186個頂點；75%的邊在旋轉72°後仍重合，一般偏移的penrosetiling為22%），seed把補丁旋轉36°的整數倍；與penrosetiling共用sampler分支；測試以獨立重寫的程式確認結構並逐seed比對；只是一小塊補丁、並非嚴格五重對稱；作者示意，未引用特定來源也沒有對照照片。0.5 m tile／0.0007 UV relief（非公尺深度），metallic0；每個取樣點走訪345條邊，未量測耗時。目前目錄992種，含plain的gallery993項。

- `penrosetiling`：潘洛斯拼貼——深藍黑底上淺藍色細線畫出一塊潘洛斯菱形非週期拼貼補丁（德布魯因五重網格構造；149個菱形：95胖、54瘦；323條邊、175個頂點、歐拉示性數1），seed把補丁旋轉36°的整數倍；測試以獨立重寫的五重網格程式確認結構並逐seed比對；只是一小塊補丁、不是無限拼貼；作者示意，未引用特定來源也沒有對照照片。0.5 m tile／0.0007 UV relief（非公尺深度），metallic0；每個取樣點走訪323條邊，未量測耗時。目前目錄991種，含plain的gallery992項。

- `kagome`：籠目——深橄欖綠底上淺稻草色細線的籠目格子（連接蜂巢每個六邊形六條邊的中點，形成三向直線的六邊形與三角形格；7欄×8列、336條線段），seed以1/64磚平移；與tulle、kikko共用蜂巢線段sampler分支（新增`outer`與`innerDegrees`欄位，兩者行為不變）；四個seed的取樣與測試中獨立重寫的模型一致；作者示意，未引用特定來源也沒有對照照片，不含上下交織。0.3 m tile／0.0009 UV relief（非公尺深度），metallic0；每個取樣點走訪336條線段，未量測耗時。目前目錄990種，含plain的gallery991項。

- `kikko`：龜甲紋——深棕底上琥珀色細線的龜甲形六角蜂巢（每個六邊形內有半徑一半的同心小六邊形；7欄×8列、56個六邊形、504條線段），seed以1/64磚平移；與tulle共用蜂巢線段sampler分支（新增`inner`欄位，tulle為0、行為不變）；四個seed的取樣與測試中獨立重寫的模型一致；作者示意，未引用特定來源也沒有對照照片，只有同心六邊形線。0.3 m tile／0.0009 UV relief（非公尺深度），metallic0；每個取樣點走訪504條線段，未量測耗時。目前目錄989種，含plain的gallery990項。

- `vermiculation`：蟲跡雕紋——淺棕褐色石面上刻有彎曲分叉、互不相連的深色蠕蟲狀溝槽（約20到30條、占約35%面積），圖案來自`feed 0.078`、`kill 0.061`的週期性Gray-Scott反應擴散，seed改變初始擾動；與turingmaze共用sampler分支（新增`baseHeight`欄位，turingmaze為0、行為不變）；作者示意，未引用特定來源也沒有對照照片。0.4 m tile／0.0015 UV relief（非公尺深度），metallic0。目前目錄988種，含plain的gallery989項。

- `minkowskisausage`：閔考斯基香腸——深藍黑底上淡藍色細線描出第2階二次科赫島（256步、256個相異格點的簡單封閉迴圈、768個亮node，線寬三分之一格），seed沿環面平移；與dragoncurve、peanocurve、levycurve共用走線sampler分支；與測試中以區塊遞迴獨立寫出的曲線逐node一致；作者示意，未引用特定來源也沒有對照照片。0.25 m tile／0.0008 UV relief（非公尺深度），metallic0。目前目錄987種，含plain的gallery988項。

- `pisanotable`：皮薩諾週期表——48×48個圓角方塊磚，第n格（1到2304）依費波那契數列模n的皮薩諾週期與上界6n的比值決定色調（只有n = 10、50、250、1250達到上界、最亮），seed沿環面平移整張表；磚面與測試中獨立以數對產生法寫出的週期表逐磚一致；作者示意，未引用特定來源也沒有對照照片，預覽上近似雜訊。0.3 m tile／0.0008 UV relief（非公尺深度），metallic0；建構時間未量測。目前目錄986種，含plain的gallery987項。

- `mobiustable`：莫比烏斯表——48×48個圓角方塊磚，第n格（1到2304）依μ(n)分三類：μ = 0（有平方因子，904個）暗、μ = +1（699個）亮紫、μ = −1（701個）灰紫，4的倍數形成暗直條，seed沿環面平移整張表；磚面與測試中以完整質因數分解獨立算出的表逐磚一致；作者示意，未引用特定來源也沒有對照照片。0.3 m tile／0.0008 UV relief（非公尺深度），metallic0。目前目錄985種，含plain的gallery986項。

- `abundantnumbers`：盈數表——48×48個圓角方塊磚，第n格（1到2304）依σ(n)與2n的比較分三類：虧數（1,732個）暗、盈數（569個）較亮、完全數（6、28、496）最亮，12與6的倍數形成亮直條，seed沿環面平移整張表；磚面與測試中以試除法獨立算出的分類表逐磚一致；作者示意，未引用特定來源也沒有對照照片。0.3 m tile／0.0008 UV relief（非公尺深度），metallic0。目前目錄984種，含plain的gallery985項。

- `xortable`：互斥或表——64×64個圓角方塊磚，第(row, col)格的色調正比於row XOR col（主對角線最暗、越大越亮的萊姆綠，呈巢狀謝爾賓斯基式方塊，即XOR texture），seed沿環面平移；磚面與測試中獨立寫出的表逐磚一致；作者示意，未引用特定來源也沒有對照照片。0.3 m tile／0.0008 UV relief（非公尺深度），metallic0。目前目錄983種，含plain的gallery984項。

- `paleytable`：佩利表——61×61個圓角方塊磚，第(row, col)格是col − row對質數61的勒壤得符號（對角線中間色調、平方剩餘亮玫瑰粉、非剩餘暗紫紅），表只依賴col − row所以呈斜向帶狀，seed沿環面平移；磚面與測試中獨立寫出的表逐磚一致；作者示意，未引用特定來源也沒有對照照片。0.3 m tile／0.0008 UV relief（非公尺深度），metallic0。目前目錄982種，含plain的gallery983項。

- `hadamardmatrix`：阿達馬矩陣——64×64個圓角方塊磚，第(row, col)格是Sylvester阿達馬矩陣的對應項（row與col按位元相與後1的個數偶數為+1亮冷白、奇數為−1暗藍灰），seed沿環面平移整張表；磚面與測試中獨立寫出的矩陣逐磚一致；作者示意，未引用特定來源也沒有對照照片，預覽上看不出巢狀區塊。0.3 m tile／0.0008 UV relief（非公尺深度），metallic0。目前目錄981種，含plain的gallery982項。

- `levycurve`：列維曲線——深青黑底上薄荷綠細線描出第9階列維C曲線（512步、416個相異格點、462條相異邊、1,340個亮node，線寬三分之一格），seed沿環面平移；與dragoncurve、peanocurve共用走線sampler分支；與測試中獨立以位元計數寫出的曲線逐node一致；作者示意，未引用特定來源也沒有對照照片，曲線不封閉。0.25 m tile／0.0008 UV relief（非公尺深度），metallic0。目前目錄980種，含plain的gallery981項。

- `tulle`：薄紗網——深紫黑底上由象牙白細線編成的六角蜂巢網（7欄×8列、56個六邊形、168條線段，節點較亮），水平垂直週期比7√3 : 12（六邊形約拉伸1.04%），seed以1/64磚平移；四個seed的取樣與測試中獨立重寫的蜂巢模型一致；作者示意，未引用特定來源也沒有對照照片，沒有半透明。0.3 m tile／0.0012 UV relief（非公尺深度），metallic0；每個取樣點走訪168條線段，未量測耗時。目前目錄979種，含plain的gallery980項。

- `sacksspiral`：薩克斯螺旋——深藍黑底上，整數1到500依薩克斯螺旋排成點陣（半徑與√n成正比、角度2π√n），質數（95個）為亮金色圓點、合成數為暗淡金棕色圓點，seed把整個螺旋旋轉整數度；每個seed下圓點中心的顏色與測試中獨立重寫的模型一致；作者示意，未引用特定來源也沒有對照照片。0.4 m tile／0.002 UV relief（非公尺深度），metallic0；每個取樣點走訪500個整數，未量測耗時。目前目錄978種，含plain的gallery979項。

- `peanocurve`：皮亞諾曲線——深藍黑底上粉紅色細線描出第3階皮亞諾空間填充曲線（27×27格各經過一次、728步、2,185個亮node、線寬三分之一格），由角落蛇形走到對角，seed沿環面平移；與dragoncurve共用走線sampler分支；與測試中以區塊遞迴獨立建構的曲線逐node一致；作者示意，未引用特定來源也沒有對照照片，曲線不封閉。0.25 m tile／0.0008 UV relief（非公尺深度），metallic0。目前目錄977種，含plain的gallery978項。

- `divisorcount`：因數個數表——48×48個圓角方塊磚，第n格（1到2304）的色調依n的因數個數而定：質數（342個）偏暗、高合成數發亮（最大為n = 1680的40個），12的倍數形成亮直條，seed沿環面平移整張表；磚面與測試中獨立以試除法算出的因數個數表逐磚一致；作者示意，未引用特定來源也沒有對照照片。0.3 m tile／0.0008 UV relief（非公尺深度），metallic0。目前目錄976種，含plain的gallery977項。

- `dragoncurve`：龍形曲線——深紫黑底上金黃色細線描出第9階海威龍形曲線（512步、361個相異格點、1,385個亮node，線寬三分之一格），seed沿環面平移；與測試中獨立重寫的摺紙序列逐node一致；作者示意，未引用特定來源也沒有對照照片，曲線不封閉。0.25 m tile／0.0008 UV relief（非公尺深度），metallic0。目前目錄975種，含plain的gallery976項。

- `juliatiles`：朱利亞集合磚——64×64個圓角方塊磚的朱利亞集合（c = −0.8 + 0.156i）鑲嵌，色調為各格中心的逃逸迭代次數（最多64次，開平方）、永不逃逸者（404格）最暗，seed沿環面平移整張表；與mandelbrottiles共用sampler分支；盤面與測試中獨立重寫的逃逸時間逐磚一致；作者示意，未引用特定來源也沒有對照照片，像素風。0.3 m tile／0.0008 UV relief（非公尺深度），metallic0。目前目錄974種，含plain的gallery975項。

- `mandelbrottiles`：曼德博集合磚——64×64個圓角方塊磚的曼德博集合鑲嵌，色調為各格中心的逃逸迭代次數（最多48次，開平方）、永不逃逸者（726格）最暗，seed沿環面平移整張表；盤面與測試中獨立重寫的逃逸時間逐磚一致；作者示意，未引用特定來源也沒有對照照片，像素風、環面接縫不連續。0.3 m tile／0.0008 UV relief（非公尺深度），metallic0。目前目錄973種，含plain的gallery974項。

- `rhodoneatable`：玫瑰線表——粉紅霓虹風格，6×6格各畫`r = cos(k·θ)`、`k = (col + 1)/(row + 1)`的玫瑰線，seed只改變整體旋轉角；測試以掃描旋轉角驗證所有玫瑰線點都落在亮處；作者示意，未引用特定來源也沒有對照照片，不是真實霓虹燈管。0.3 m tile／0.0008 UV relief（非公尺深度），metallic0；每次取樣要量該格192條線段，512²取樣約0.24秒。目前目錄972種，含plain的gallery973項。

- `lissajoustable`：李薩如曲線表——示波器風格的綠色磷光曲線，6×6格各畫頻率比(col + 1):(row + 1)的李薩如曲線，seed只改變共同相位；測試以掃描相位驗證所有曲線點都落在亮處；作者示意，未引用特定來源也沒有對照照片，不是真實示波器畫面。0.3 m tile／0.0008 UV relief（非公尺深度），metallic0；每次取樣要量該格128條線段，512²取樣約0.2秒。目前目錄971種，含plain的gallery972項。

- `primesieve`：埃拉托斯特尼篩——32×32個圓角方塊磚代表1到1024，質數（172個）為明亮金黃、合數依最小質因數的低對比橄欖色、1最暗，seed沿環面平移整張表；盤面與測試中以試除法獨立重寫的最小質因數逐磚一致；作者示意，未引用特定來源也沒有對照照片。0.3 m tile／0.0012 UV relief（非公尺深度），metallic0。目前目錄970種，含plain的gallery971項。

- `gcdtable`：最大公因數表——32×32個圓角方塊磚代表`gcd(col + 1 + a, row + 1 + b)`（偏移a、b由seed決定），色調`1 − 1/gcd`（互質為暗、公因數愈大愈亮，沿直線與斜線亮起）；盤面與測試中獨立重寫的gcd逐磚一致；作者示意，未引用特定來源也沒有對照照片。0.3 m tile／0.0012 UV relief（非公尺深度），metallic0。目前目錄969種，含plain的gallery970項。

- `collatzsteps`：考拉茲步數——32×32個圓角方塊磚代表1到1024，色調是各整數依考拉茲規則走到1的步數除以178（暗紫到暖橙），seed沿環面平移整張表；盤面與測試中獨立重寫的步數逐磚一致；作者示意，未引用特定來源也沒有對照照片，外觀近似帶條紋的雜訊。0.3 m tile／0.0012 UV relief（非公尺深度），metallic0。目前目錄968種，含plain的gallery969項。

- `pascalmod3`：帕斯卡三角形模3——48×48格青綠圓角方塊磚，下三角部分是帕斯卡三角形除以3的餘數（0／1／2為暗／中／亮三階，形成嵌套三角形），其餘為暗色空格，seed沿環面平移整張表；盤面與測試中獨立重寫的三角形逐磚一致；作者示意，未引用特定來源也沒有對照照片。0.3 m tile／0.0012 UV relief（非公尺深度），metallic0。目前目錄967種，含plain的gallery968項。

- `modulartable`：模運算乘法表——31×31個圓角方塊磚，色調由模11乘法表餘數`((a + col)·(b + row)) mod 11`決定（seed決定偏移），磚面凸起、磚縫較暗帶AO，餘數0的整行整列成為暗色帶；盤面與測試中獨立重寫的乘法表逐磚一致；作者示意，未引用特定來源也沒有對照照片。0.3 m tile／0.0012 UV relief（非公尺深度），metallic0。目前目錄966種，含plain的gallery967項。

- `elementaryautomata`：基本元胞自動機——琥珀色LED點陣上並排的Wolfram規則30、90、110（單一活細胞開局）與184（重複圖樣開局）四段，每段32列×128欄，seed只旋轉欄；盤面與測試中獨立重寫的自動機逐node一致；作者示意，未引用特定來源也沒有對照照片，三角形只佔每段中央。0.3 m tile／0.001 UV relief（非公尺深度），metallic0。目前目錄965種，含plain的gallery966項。

- `gameoflife`：生命遊戲——暗色LED點陣上、64×64環面以38%密度隨機開局演化250代的康威生命遊戲湯（方塊、蜂巢、閃爍器、滑翔機），是尚未完全靜止的靜態快照；作者示意，未引用特定來源也沒有對照照片。0.2 m tile／0.001 UV relief（非公尺深度），metallic0；sampler建構時跑一次模擬約30 ms。目前目錄964種，含plain的gallery965項。

- `hilbertcurve`：希爾伯特曲線——深藍黑底上一條青藍色的第4階希爾伯特空間填充曲線電路走線（16×16格每格經過一次，在拼貼接縫處封閉成迴圈），seed選方形對稱並平移曲線；作者示意，未引用特定來源也沒有對照照片，不是真實電路板。0.2 m tile／0.0015 UV relief（非公尺深度），metallic0。目前目錄963種，含plain的gallery964項。

- `quasicrystal`：準晶干涉——五個接近72°間隔的整數波向量干涉成藍白色、看似五重對稱的圖案（五邊形環、圓點）；tile精確週期，是近似、不是真正的準晶或Penrose鋪磚；seed只改變相位；作者示意，未引用準晶文獻也沒有對照照片。0.3 m tile／0.0015 UV relief（非公尺深度），metallic0。目前目錄962種，含plain的gallery963項。

- `sudoku`：數獨——報紙上的9×9題目格（細線、兩像素粗的宮格線），約四成格子放有seed決定的3×5像素數字；數字隨機放置，不是合法或有解的數獨；作者示意，未引用特定題目也沒有對照照片，數字偏粗偏糊。0.2 m tile／0.0008 UV relief（非公尺深度），metallic0。目前目錄961種，含plain的gallery962項。

- `datamatrix`：Data Matrix二維碼——奶油白標籤上2×2個18×18模組的黑色方碼（左與下為實心L定位、上與右為時序軌、內部為seed決定的隨機資料、符號間留靜區）；資料是隨機的，不是有效編碼也不能被掃描；作者示意，未對照照片或掃描驗證。0.12 m tile／0.0008 UV relief（非公尺深度），metallic0。目前目錄960種，含plain的gallery961項。

- `couscous`：庫斯庫斯——淡米黃色的微小圓形穀粒（26×26格、略有旋轉與大小變化）緊密堆疊、彼此重疊，粒縫為帶AO的暗褐底色；沿用granola／tilledsoil／sherpafleece的共用重疊粒子sampler；作者示意，未引用特定來源也沒有對照照片，粒形偏圓而均勻。0.1 m tile／0.0012 UV relief（非公尺深度），metallic0。目前目錄959種，含plain的gallery960項。

- `morse`：摩斯電碼——奶油色紙帶上14行由seed決定的隨機點劃訊息（點1格、劃3格、符號間空1格、字母間空3格、單字間空7格），深灰色墨；訊息不是可譯文字；作者示意，未引用特定來源也沒有對照照片。0.3 m tile／0.0012 UV relief（非公尺深度），metallic0。目前目錄958種，含plain的gallery959項。

- `pizza`：披薩——淺黃起司（帶烤焦色塊與淡淡番茄醬色）上，5×5格內以72%機率出現、稍有抖動與大小變化的棕紅香腸片，中央略高、油亮；作者示意，未引用特定來源也沒有對照照片，圓片沿格子排列、比較像圓點花紋。0.25 m tile／0.004 UV relief（非公尺深度），metallic0。目前目錄957種，含plain的gallery958項。

- `invaders`：街機外星人——綠色LED點陣上的像素外星人（三列、各重複3次、42×33 LED格），暗處LED保留暗綠；造型是作者手寫的一般街機風格，不保證與任何遊戲相同，沒有發光；seed只改變grain。作者示意，未引用特定來源也沒有對照照片。0.3 m tile／0.001 UV relief（非公尺深度），metallic0。目前目錄956種，含plain的gallery957項。

- `fairisle`：費爾島針織——北歐針織毛衣圖樣：40×30針、V形針腳，15列一組的實心帶、小點帶與每8針重複的開孔菱形，深藍與淺灰兩色；seed只改變細絨毛，圖樣固定；作者示意，未引用特定來源也沒有對照照片，紗線是均勻重複。0.3 m tile／0.0015 UV relief（非公尺深度），metallic0。目前目錄955種，含plain的gallery956項。

- `mackerel`：鯖魚——藍綠色魚背上斷開、彎曲的深藍色波浪帶，沿v方向堆疊並被慢雜訊扭曲；作者示意，未引用特定來源也沒有對照照片，預覽比較像水波或虎斑而不像魚皮，沒有銀白腹部與魚鱗。0.3 m tile／0.0008 UV relief（非公尺深度），metallic0。目前目錄954種，含plain的gallery955項。

- `hestain`：H&E染色組織——淺粉紫色斑駁纖維狀細胞質上，分布著位置與形狀來自週期Gray-Scott反應擴散的深紫色橢圓細胞核；作者示意，未引用特定來源也沒有對照照片，細胞質偏薰衣草紫而非伊紅粉紅，沒有細胞膜與組織層次。0.05 m tile／0.0008 UV relief（非公尺深度），metallic0；每個seed首次建構約多0.2秒模擬時間。目前目錄953種，含plain的gallery954項。

- `petricolonies`：培養皿菌落——琥珀色瓊脂上的奶油色圓形菌落，位置與形狀來自週期Gray-Scott反應擴散的斑點區，菌落有略深的細緣與略高的中央；作者示意，未引用特定來源也沒有對照照片，沒有皿緣、黏液光澤與同心結構。0.12 m tile／0.0015 UV relief（非公尺深度），metallic0；每個seed首次建構約多0.2秒模擬時間。目前目錄952種，含plain的gallery953項。

- `turingmaze`：圖靈迷宮——白紙上由週期Gray-Scott反應擴散（迷宮參數）產生的深色墨跡迷宮條紋；作者示意，不是指紋（條紋遠比指紋粗、沒有螺旋），未引用特定來源也沒有對照照片。0.3 m tile／0.0012 UV relief（非公尺深度），metallic0；每個seed首次建構約多0.2秒模擬時間。目前目錄951種，含plain的gallery952項。

- `cheetahfur`：獵豹毛皮——黃褐色短毛上的黑色橢圓斑點，位置與形狀來自週期Gray-Scott反應擴散（這是引擎第一個在建立sampler時跑模擬的材質，每個seed首次建構約多0.2秒）；作者示意，未引用特定來源也沒有對照照片，沒有斑外淺色暈與毛色漸層。0.25 m tile／0.0015 UV relief（非公尺深度），metallic0。目前目錄950種，含plain的gallery951項。

- `jade`：軟玉——拋光綠色表面，中綠色雲霧底上有沿雜訊等值線的淡綠脈與髮絲脈；作者示意，未引用特定來源也沒有對照照片，脈走向比真實玉石規則、無半透明感。0.15 m tile／0.0008 UV relief（非公尺深度），metallic0。目前目錄949種，含plain的gallery950項。

- `spectrogram`：頻譜圖——深藍底上12條被顫音彎成波浪的黃色諧波水平線、5條垂直爆發亮帶與雜訊斑點，由時間—頻率能量場決定哪裡顯示；作者示意，未引用特定來源、音訊資料或對照圖，太規則且色階為單一漸層。0.3 m tile／0.002 UV relief（非公尺深度），metallic0。目前目錄948種，含plain的gallery949項。

- `barchart`：長條圖紙——淡藍灰紙面上每tile 2張圖表、各12根高度隨機的深海軍藍長條，加4條淡灰橫格線與一條基線；作者示意，未引用特定來源也沒有對照照片，無刻度、數字或標題。0.25 m tile／0.0012 UV relief（非公尺深度），metallic0。目前目錄947種，含plain的gallery948項。

- `ecgpaper`：心電圖紙——淡粉紅色細格與每5格一條的粗格上，3條記錄帶各重複6個心跳描線（P、Q、R、S、T波的簡化曲線）；作者示意，未引用特定來源、標準或對照照片，不可作醫療用途，R波偏矮、T波偏平。0.3 m tile／0.0012 UV relief（非公尺深度），metallic0。目前目錄946種，含plain的gallery947項。

- `redalder`：紅赤楊（Alnus rubra）縱向木面，淡黃褐到略帶紅的均勻底、細而均勻的質地、2條很淡的暗帶、縱向纖維與極少量細暗短痕；無聚合木射線的寬條紋、節疤或塗層。依實際閱讀[Wood Database Red Alder](https://www.wood-database.com/red-alder/)與實看[木面照片](https://www.wood-database.com/wp-content/uploads/alnus-rubra.jpg)近似，僅作配色與紋理形態參考。重用既有導管sampler，0.18 m tile／0.002 UV relief（非公尺深度），metallic0。目前目錄945種，含plain的gallery946項。

- `sherpafleece`：雪帕刷毛布——大量任意旋轉、邊緣不規則的奶油色團塊疊成蓬鬆捲簇，偶有受遮蔽的淺褐縫；重用`granola`的兩層橢圓塊sampler；作者示意，未引用特定來源也沒有對照照片，預覽更像奶油色碎屑／爆米花而不像真實纖維。0.15 m tile／0.012 UV relief（非公尺深度），metallic0。目前目錄944種，含plain的gallery945項。

- `tilledsoil`：翻耕土壤——深褐縫隙地上疊著任意旋轉、邊緣不規則的中褐色土塊與少量淺色卵石；重用`granola`的兩層橢圓塊sampler；作者示意，未引用特定來源也沒有對照照片，預覽也像迷彩，比真實土壤平坦。0.4 m tile／0.012 UV relief（非公尺深度），metallic0。目前目錄943種，含plain的gallery944項。

- `heatsinkfins`：散熱鰭片——陽極處理擠型鋁散熱片，每tile 20片直條鰭片、平坦鰭頂與深而受遮蔽的窄縫、鰭頂的細擠型線與淡斑駁；整面金屬（metallic 1）；作者示意，未引用特定來源也沒有對照照片，無鰭片高度、基板或熱管。0.1 m tile／0.01 UV relief（非公尺深度）。目前目錄942種，含plain的gallery943項。

- `jerky`：牛肉乾——深紅褐色底上沿u方向的細密肌纖維、寬低頻色調變化、光澤變化與零星近黑胡椒碎粒；作者示意，未引用特定來源也沒有對照照片，預覽也像髮絲拋光的暗色木紋，缺乏真實肉乾的形狀。0.12 m tile／0.004 UV relief（非公尺深度），metallic0。目前目錄941種，含plain的gallery942項。

- `garlicskin`：蒜皮——奶油白紙質底上約11條沿v方向、被雜訊扭曲且寬窄變化的淡紫色縱向條紋，帶縱向纖維、柔和皺褶與細grain；作者示意，未引用特定來源也沒有對照照片，預覽較像條紋紙而不太像真實蒜皮。0.1 m tile／0.003 UV relief（非公尺深度），metallic0。目前目錄940種，含plain的gallery941項。

- `pancake`：煎餅——金黃底上帶蕾絲邊的低頻焦褐斑塊（面積隨seed差異大）與散布的微小氣孔凹洞；作者示意，未引用特定來源也沒有對照照片，斑塊邊緣有方塊雜訊感，無光澤與厚度。0.25 m tile／0.004 UV relief（非公尺深度），metallic0。目前目錄939種，含plain的gallery940項。

- `kawung`：卡翁紋巴迪克——深靛藍棉布上以蠟防染的乳白色橢圓棋盤式交錯排列（偶數格長軸沿u、奇數格沿v，各帶中心圓點）；簡化示意，未引用特定來源也沒有對照圖譜，幾何比真實卡翁紋簡化、線條過於均勻。0.3 m tile／0.004 UV relief（非公尺深度），metallic0。目前目錄938種，含plain的gallery939項。

- `granola`：燕麥穀物脆片——蜂蜜褐色底面上疊著兩層任意角度、邊緣不規則的橢圓塊（較大的淡奶油色燕麥片與較小的深色堅果／果乾塊），底面外露處受遮蔽變暗；作者示意，未引用特定來源也沒有對照照片，預覽也像迷彩，比真實脆片平坦。0.2 m tile／0.008 UV relief（非公尺深度），metallic0。目前目錄937種，含plain的gallery938項。

- `raspberry`：覆盆子——16×18排成交錯格、略為重疊的圓形紅色小核果（各有色調、穹頂明暗與高光），顆粒間為較暗、受遮蔽的細縫；作者示意，未引用特定來源也沒有對照照片，比真實覆盆子規則許多，無絨毛、花萼或整體形狀。0.08 m tile／0.006 UV relief（非公尺深度），metallic0。目前目錄936種，含plain的gallery937項。

- `salami`：薩拉米——帶低頻斑駁的深紅色醃肉切面，散布大小不一、相鄰者相連的乳白橢圓脂肪斑與細小近黑胡椒粒；作者示意，未引用特定來源也沒有對照照片，比真實香腸規則許多，無外皮、黴層或肌纖維。0.12 m tile／0.002 UV relief（非公尺深度），metallic0。目前目錄935種，含plain的gallery936項。

- `baconstrips`：培根片——約5條被低頻雜訊扭成波浪的紅色瘦肉帶與乳白色肥肉帶交錯（瘦肉有沿u方向的纖維，肥肉較亮、略凸起且較光滑，交界略暗）；作者示意，未引用特定來源也沒有對照照片，比真實培根平滑規則，無皺縮、油脂氣泡或肉皮。0.2 m tile／0.003 UV relief（非公尺深度），metallic0。目前目錄934種，含plain的gallery935項。

- `sweetcorn`：甜玉米——14×14排成整齊行列的圓角方形黃色玉米粒（各有色調、微小位置抖動與穹頂高光），粒間為較暗、受遮蔽的細縫；作者示意，未引用特定來源也沒有對照照片，比真實玉米規則許多，無弧形包覆、花絲或苞葉。0.13 m tile／0.006 UV relief（非公尺深度），metallic0。目前目錄933種，含plain的gallery934項。

- `crosswordgrid`：填字格——白紙上15×15格的方格，約兩成黑格依180°旋轉對稱分布，白格間有淡灰細格線，字詞起始的白格左上角有圓點題號標記；作者示意，未引用特定來源，非真實謎題或可解字詞，亦不保證符合填字排版規則。0.3 m tile／0.0012 UV relief（非公尺深度），metallic0。目前目錄932種，含plain的gallery933項。

- `windowpane`：窗格紋——暗炭灰藍的斜紋法蘭絨上每tile 3×3格的淡色細線，布面帶斜向2/2斜紋脊與逐紗線雜訊；作者示意，未引用特定來源，非真實織物結構。0.3 m tile／0.004 UV relief（非公尺深度），metallic0。目前目錄931種，含plain的gallery932項。

- `merbau`：印茄木（Intsia spp.）縱向木面，帶灰調的橙棕底、粗質地、1條很淡的暗帶、縱向纖維與密集散布的細暗導管短痕；無黃色礦物沉積、交錯紋、板間色差或塗層。依實際閱讀[Wood Database Merbau](https://www.wood-database.com/merbau/)與實看[木面照片](https://www.wood-database.com/wp-content/uploads/merbau.jpg)近似，僅作配色與紋理形態參考。重用既有導管sampler，0.18 m tile／0.0025 UV relief（非公尺深度），metallic0。目前目錄930種，含plain的gallery931項。

- `crosshatchengraving`：交叉排線版畫——奶油色紙面上依低頻明暗場逐步加線的黑色細排線（暗部一組對角線、更暗加反向對角線、最暗再加水平線，線寬隨明暗增加）；作者示意，未引用特定來源，非真實刻線軌跡或圖像內容。0.25 m tile／0.0015 UV relief（非公尺深度），metallic0。目前目錄929種，含plain的gallery930項。

- `sheetmusic`：樂譜——奶油色紙面上6組五線譜（連續細黑譜線、每tile 4條小節線），每組16個音符位置、約八成有隨機音高的四分音符（符頭＋符桿），譜組間留白；作者示意，未引用特定來源，音符不構成旋律，無譜號、拍號、升降記號或歌詞。0.25 m tile／0.0012 UV relief（非公尺深度），metallic0。目前目錄928種，含plain的gallery929項。

- `buffaloplaid`：水牛格紋——紅布上橫向與縱向各4條寬條紋（單向暗紅、重疊處近黑），帶斜向2/2斜紋脊與逐紗線雜訊；作者示意，未引用特定來源，無真實織紋結構、縫線或毛邊；seed只改變紗線雜訊。0.25 m tile／0.004 UV relief（非公尺深度），metallic0。目前目錄927種，含plain的gallery928項。

- `jarrah`：賈拉木（Eucalyptus marginata）縱向木面，磚紅偏棕底、中到粗質地、2條很淡的暗帶、縱向纖維與散布細暗導管短痕；無淡色邊材、膠線、捲曲／交錯紋或塗層。依實際閱讀[Wood Database Jarrah](https://www.wood-database.com/jarrah/)與實看[木面照片](https://www.wood-database.com/wp-content/uploads/jarrah-s-400x400.jpg)近似，僅作配色與紋理形態參考。重用既有導管sampler，0.18 m tile／0.0025 UV relief（非公尺深度），metallic0。目前目錄926種，含plain的gallery927項。

- `amberbubbles`：含氣泡的琥珀樹脂——橘黃色光滑樹脂，3條被整數波數正弦彎曲的流動明暗帶；14×14格中約45%有被困住的氣泡（隨機大小位置，略凸、更光滑、帶亮緣與光暈），另有低頻混濁；作者示意，未引用特定來源，無半透明、折射、內含物或裂紋。0.12 m tile／0.004 UV relief（非公尺深度），metallic0。目前目錄925種，含plain的gallery926項。

- `cauliflowercurd`：花椰菜凝乳——奶白色花球表面，三個尺度（10²／26²／64²格）的圓頂花蕾堆疊（大花球上長小花蕾、再長凸粒），蕾頂較亮、間隙灰米色帶AO，粗糙（roughness 0.78）；作者示意，未引用特定來源，非真正碎形，無莖、葉、斑點或褐變。0.12 m tile／0.016 UV relief（非公尺深度），metallic0。目前目錄924種，含plain的gallery925項。

- `bubinga`：非洲紫檀／布賓加（Guibourtia屬）縱向木面，粉紅紅褐底、均勻細質地、3條較暗的淡條紋、縱向纖維與散布細暗導管凹點；無紫／黑條紋、稻草色邊材、各種花紋或塗層。依實際閱讀[Wood Database Bubinga](https://www.wood-database.com/bubinga/)與實看[木面照片](https://www.wood-database.com/wp-content/uploads/guibourtia-spp-300x600.jpg)近似，僅作配色與紋理形態參考。重用既有導管sampler，0.18 m tile／0.0025 UV relief（非公尺深度），metallic0。目前目錄923種，含plain的gallery924項。

- `pomegranatearils`：石榴籽囊——20×20格抖動位置／大小／色調各異的紅寶石色圓形籽囊緊密堆疊重疊，每顆有偏左上的小高光，縫隙很暗、較粗糙並帶AO；作者示意，未引用特定來源，不含半透明、汁液、白色隔膜或果皮。0.12 m tile／0.01 UV relief（非公尺深度），metallic0。目前目錄922種，含plain的gallery923項。

- `pumpkinskin`：南瓜皮——橙色果皮上8條縱貫的隆起稜（輕微彎曲）、較暗較粗糙帶AO的溝槽（約四成面積）、細縱向皮紋與小疣點；作者示意，未引用特定來源，無果蒂、果瓣曲面、白斑或傷痕。0.4 m tile／0.012 UV relief（非公尺深度），metallic0。目前目錄921種，含plain的gallery922項。

- `citruspeel`：柑橘果皮——明亮橙色果皮，48×48格中約九成有抖動位置的油胞凹點（約四成面積在凹點中，較暗、較低、較粗糙並帶AO），柔和色斑與細grain；作者示意，未引用特定來源，無橘瓣紋、果蒂、白色內皮或傷痕。0.12 m tile／0.006 UV relief（非公尺深度），metallic0。目前目錄920種，含plain的gallery921項。

- `coirdoormat`：椰殼纖維門墊——深褐到淡褐的粗硬纖維，在5×5低頻分塊中分成水平／垂直／兩斜向四種方向（塊間平滑交接），粗糙、帶縫隙陰影與細絨毛；作者示意，未引用特定來源，無單根纖維幾何、編織底布、橡膠邊框或字樣。0.3 m tile／0.006 UV relief（非公尺深度），metallic0。目前目錄919種，含plain的gallery920項。

- `europeanyew`：歐洲紫杉（Taxus baccata）弦切面心材，橙褐色底、細而均勻的質地、16條密集起伏帶拱形的較深褐生長紋與細縱向纖維；不含淡黃褐邊材帶、紫調、節、瘤或塗層。依實際閱讀[Wood Database European Yew](https://www.wood-database.com/european-yew/)與實看[木面照片](https://www.wood-database.com/wp-content/uploads/taxus-baccata-300x600.jpg)近似，僅作配色與紋理形態參考。重用`douglasfir`年輪sampler，0.18 m tile／0.0025 UV relief（非公尺深度），metallic0。目前目錄918種，含plain的gallery919項。

- `raindropripples`：雨滴漣漪——深灰藍的光滑水面上8×8個位置抖動的雨滴各自擴散同心漣漪環（隨機振幅與相位），相鄰漣漪疊加成干涉圖樣；作者示意，未引用特定來源，不含色散／衰減律、時間擴散、水花或岸邊反射。0.4 m tile／0.0022 UV relief（非公尺深度），metallic0。目前目錄917種，含plain的gallery918項。

- `gamedice`：遊戲骰子——6×6顆象牙白圓角方骰排成一盤，骰面壓入黑色圓形點數（標準1–6點，隨seed擲出），骰間為較暗較粗糙帶AO的托盤；作者示意，未引用特定來源，無立體三面、斜放堆疊、塗漆厚度或磨損。0.3 m tile／0.012 UV relief（非公尺深度），metallic0。目前目錄916種，含plain的gallery917項。

- `europeanolive`：歐洲橄欖木（Olea europaea）弦切面，淡黃褐底、細而均勻的質地、6條細長起伏帶拱形的深黃褐生長紋與細縱向纖維；不含深褐至近黑的條紋與脈、野生紋、瘤紋、邊心材界線或塗層。依實際閱讀[Wood Database Olive](https://www.wood-database.com/olive/)與實看[木面照片](https://www.wood-database.com/wp-content/uploads/olea-europaea-300x600.jpg)近似，僅作配色與紋理形態參考。重用`douglasfir`年輪sampler，0.18 m tile／0.002 UV relief（非公尺深度），metallic0。目前目錄915種，含plain的gallery916項。

- `poolcaustics`：泳池焦散——藍色池底上由三組彎曲線族疊成的明亮分岔光網與深藍網眼（約三分之一面積偏亮），光網處roughness略低、池底有細微顆粒；作者設計的視覺近似，非物理焦散模型，未引用特定來源，無時間流動、折射追蹤、池磚縫或水面反射。0.5 m tile／0.002 UV relief（非公尺深度），metallic0。目前目錄914種，含plain的gallery915項。

- `metalflakepaint`：金屬片漆——深藍清漆底上散布隨機位置／傾斜／亮度的圓形金屬片（64×64格、約半數有片），約21–22%面積被覆蓋；片為淡薰衣草銀色，metallic通道形成部分金屬遮罩（最高約0.68），小傾斜使法線閃爍；作者示意，未引用特定來源，無珠光變色、多邊形片或清漆厚度。0.1 m tile／0.003 UV relief（非公尺深度），metallic factor 1由逐像素通道決定。目前目錄913種，含plain的gallery914項。

- `tapemeasure`：捲尺——一個tile為黃色捲尺的100 mm段：100條毫米刻線、每5 mm較長、每10 mm最長而較粗，近黑刻線印在黃色塗層上，橫截面為兩緣升起中央下凹的餘弦弧；作者示意，未引用特定來源，無數字、英制刻度、端鉤、外殼或磨損。0.1 m tile／0.03 UV relief（非公尺深度），metallic0。目前目錄912種，含plain的gallery913項。

- `ledmatrix`：LED點陣面板——48×48顆圓形LED、8×6個5×7字元格，每格隨seed點亮2–4條隨機偽筆畫（不是字型）；亮LED紅橘高亮、暗LED暗紅，透鏡光滑略凸，黑色底板較粗糙帶AO；作者示意，未引用特定來源，無emission、捲動、混色或RGB子像素。0.16 m tile／0.004 UV relief（非公尺深度），metallic0。目前目錄911種，含plain的gallery912項。

- `barcodelabel`：條碼標籤——一個tile是一張標籤寬度（左右各10模組靜區、Code 128 Start B 樣式、9個隨seed抽出的11模組資料符號、13模組停止樣式），近黑碳粉條在白色粗糙紙面上、上下留白；**不可解碼**（無檢查碼、無奇偶限制、無人眼可讀文字）。結構依[Wikipedia「Code 128」](https://en.wikipedia.org/wiki/Code_128)，Start／停止位元樣式未由該頁驗證。0.14 m tile／0.0006 UV relief（非公尺深度），metallic0。目前目錄910種，含plain的gallery911項。

- `topographicmap`：等高線地形圖紙——暖米白紙面上以定值寬度的棕色等高線印出由7個整數波數正弦疊成的地形（16階、每5條一條較粗較深的計曲線）、極淡高度色調與紙纖維grain；作者示意，未引用特定來源，無真實地形、標高註記、水系、道路或圖例。0.3 m tile／0.0015 UV relief（非公尺深度），metallic0。目前目錄909種，含plain的gallery910項。

- `eastindianrosewood`：東印度黃檀（Dalbergia latifolia）縱向木面，深紫褐底、5條較暗近黑的起伏條紋、縱向纖維與散布短小開放導管凹點；無金褐淺色面、淺色邊材、拋光或交錯紋。依實際閱讀[Wood Database East Indian Rosewood](https://www.wood-database.com/east-indian-rosewood/)與實看[木面照片](https://www.wood-database.com/wp-content/uploads/dalbergia-latifolia-1-300x600.jpg)近似，僅作配色與紋理形態參考。重用既有導管sampler，0.18 m tile／0.0025 UV relief（非公尺深度），metallic0。目前目錄908種，含plain的gallery909項。

- `lenticularsheet`：柱狀透鏡印刷片——每tile 32條平行圓柱透鏡，頂亮而光滑、縫低且較粗糙並帶AO，藍銀底色由斜向翻轉條紋與8×8低頻影像疊成；作者示意，未引用特定來源，無真實多幀交錯影像、視角動畫或折射。0.1 m tile／0.008 UV relief（非公尺深度），metallic0。目前目錄907種，含plain的gallery908項。

- `europeanlarch`：歐洲落葉松（Larix decidua）弦切面，淡粉紅褐／淡黃褐早材底、12條流動拱形的紅褐晚材年輪線（約占面積四分之一）與細縱向纖維；無樹脂囊、節、邊／心材界線、螺旋紋或塗層。依實際閱讀[Wood Database European Larch](https://www.wood-database.com/european-larch/)與實看[弦切面照片](https://www.wood-database.com/wp-content/uploads/european-larch-s-400x400.jpg)近似，僅作配色與紋理形態參考。重用`douglasfir`年輪sampler，0.2 m tile／0.003 UV relief（非公尺深度），metallic0。目前目錄906種，含plain的gallery907項。

- `shagbarkhickory`：粗皮山胡桃木（Carya ovata）縱向木面，淡黃褐／淡棕底、中等質地、3條較暖淺褐起伏條紋、縱向纖維與散布短小開放導管凹點；無紅褐深色心材主導、環孔早材導管列、交錯／波浪紋或塗層。依實際閱讀[Wood Database Shagbark Hickory](https://www.wood-database.com/shagbark-hickory/)與實看[木面照片](https://www.wood-database.com/wp-content/uploads/shagbark-hickory-400x400.jpg)近似，僅作配色與紋理形態參考。重用既有導管sampler，0.18 m tile／0.002 UV relief（非公尺深度），metallic0。目前目錄905種，含plain的gallery906項。

- `monitorlizardskin`：巨蜥風格顆粒狀鱗皮——14欄×16列六角緊密排列的圓形隆起鱗片（奇數列錯半欄），每片各有色調、較亮較光滑，鱗間為窄深暗溝（AO 0.4），4條橫向深淺色帶，橄欖褐色；作者示意，未引用特定物種或來源，無腹鱗、脊或皮褶。0.14 m tile／0.01 UV relief（非公尺深度），metallic0。目前目錄904種，含plain的gallery905項。

- `sitkaspruce`：Sitka spruce（Picea sitchensis）縱向木面，奶白偏淡黃底、極細而幾乎筆直的極低對比縱向年輪線與細纖維grain；無bearclaw、粉紅色調、樹脂道、節疤或塗層。依實際閱讀[Wood Database Sitka Spruce](https://www.wood-database.com/sitka-spruce/)與實看[木面照片](https://www.wood-database.com/wp-content/uploads/sitka-spruce-400x400.jpg)近似，僅作配色與年輪線形態參考。重用`douglasfir`年輪sampler，0.12 m tile／0.002 UV relief（非公尺深度），metallic0。目前目錄903種，含plain的gallery904項。

- `honduranmahogany`：宏都拉斯桃花心木（Swietenia macrophylla）縱向木面，偏深紅褐色、中等均勻質地、7條寬而幾乎筆直的低對比緞帶狀條紋與極稀疏短小開放導管凹點；無新切淺粉褐、經年變深、交錯／波浪紋、巢狀年輪、chatoyancy或塗層。依實際閱讀[Wood Database Honduran Mahogany](https://www.wood-database.com/honduran-mahogany/)與實看[木面照片](https://www.wood-database.com/wp-content/uploads/swietenia-macrophylla-alt.jpg)近似，僅作配色與紋理形態參考。重用既有導管sampler，0.18 m tile／0.0015 UV relief（非公尺深度），metallic0。目前目錄902種，含plain的gallery903項。

- `woodenpalletdeck`：木棧板面板——一個tile內4塊沿u方向的木板，板間為低窄深縫（約9%寬、AO 0.2），每板有各自色調、起伏年輪線、縱向纖維與細grain，板中線每tile 2顆深色略凸圓釘頭；非完整棧板（無橫梁／板端／裂縫／節疤），釘頭為dielectric。概念依實際閱讀[Wikipedia「Pallet」](https://en.wikipedia.org/wiki/Pallet)導言，尺寸與色彩為作者設定。0.4 m tile／0.006 UV relief（非公尺深度），metallic0。目前目錄901種，含plain的gallery902項。

- `forgedcarbon`：鍛造碳纖維風格複合材——10×10格、每格5個隨機位置／方向／長寬／灰階與疊放權重的圓角長條碎片覆蓋近黑樹脂背景，碎片內有沿長軸的細密編織漣漪，整體亮面（roughness約0.18–0.30）；非規則斜紋／平紋（既有`carbonfiber`），無環氧厚度或金屬光澤。作者示意，未引用特定製程或來源。0.2 m tile／0.0012 UV relief（非公尺深度），metallic0。目前目錄900種，含plain的gallery901項。

- `popcornceiling`：爆米花／吸音天花板噴塗——20×20格各一個隨機偏移、半徑與高度不同的圓形顆粒，以`1−Π(1−顆粒)`軟合併成起伏顆粒團，顆粒間是被遮蔽的低谷（AO約0.55），偏白帶細斑點grain；無水漬、剝落、刮平區、纖維或接縫。概念依實際閱讀[Wikipedia「Popcorn ceiling」](https://en.wikipedia.org/wiki/Popcorn_ceiling)導言，尺寸與色彩為作者設定，只描述外觀、不含也不暗示成分。0.25 m tile／0.006 UV relief（非公尺深度），metallic0。目前目錄899種，含plain的gallery900項。

- `kilimdiamonds`：kilim風格階梯菱形平織——64×64緯線格，每16格方塊的中心與四角各有四環同心階梯菱形（深褐／奶白／灰褐／奶白，角上菱形色序對調），每列微小色差、每格橫向緯線脊與細纖維grain。概念依實際閱讀[Wikipedia「Kilim」](https://en.wikipedia.org/wiki/Kilim)（平織tapestry地毯），圖案與色彩為作者設定、未引用特定紋樣；無流蘇、邊飾、起絨或斷緯。0.32 m tile／0.003 UV relief（非公尺深度），metallic0。目前目錄898種，含plain的gallery899項。

- `teak`：柚木（Tectona grandis）縱向木面，金黃到中棕底、直而不均勻的粗質地、長而起伏的深棕縱向條紋與散布的短小開放導管凹點；無老化深色、邊材、波浪／交錯figure、油亮塗層或導管內淺色沉積。依實際閱讀[Wood Database Teak](https://www.wood-database.com/teak/)與實看[木面照片](https://www.wood-database.com/wp-content/uploads/tectona-grandis.jpg)近似，僅作配色與紋理形態參考。重用既有導管sampler，0.2 m tile／0.003 UV relief（非公尺深度），metallic0。目前目錄897種，含plain的gallery898項。

- `blackcherry`：美洲黑櫻桃木（Prunus serotina）縱向木面，均勻中等紅褐色、細平直縱紋、極低對比寬弱帶與極稀疏短小深色導管凹點；無邊材條帶、捲紋、樹膠斑或塗層。依實際閱讀[Wood Database Black Cherry](https://www.wood-database.com/black-cherry/)與實看[木面照片](https://www.wood-database.com/wp-content/uploads/prunus-serotina.jpg)近似，僅作配色與紋理形態參考。重用既有導管sampler，0.18 m tile／0.0015 UV relief（非公尺深度），metallic0。目前目錄896種，含plain的gallery897項。

- `golfballdimples`：高爾夫球風格凹坑——7欄×8列六角緊密排列的圓形淺球碗（奇數列錯半欄），碗心較低、較暗（AO 0.55）、較粗糙，碗間為窄而光滑的平台，偏白亮面塑膠。作者平面示意，未引用特定球種或來源；非完整球體曲率、接縫或印字。0.028 m tile／0.012 UV relief（非公尺深度），metallic0。目前目錄895種，含plain的gallery896項。

- `laptopkeycaps`：chiclet筆電鍵帽——8×8格方陣，每格一顆圓角方形（四次方超橢圓）深色霧面鍵帽，鍵頂中央微凹、鍵緣有高光，鍵間為深色窄縫（AO 0.25）；每鍵色調略異，含霧面細grain。作者示意，未引用特定產品或來源，無字符、背光、鍵軸或機身。0.152 m tile／0.004 UV relief（非公尺深度），metallic0。目前目錄894種，含plain的gallery895項。

- `qrcodelabel`：QR風格印刷標籤——29×29模組加四模組白色安靜區填滿一個tile，三角7×7 finder pattern與separator、第6列／行timing、右下5×5 alignment、依seed的偽隨機資料模組，深色油墨印在帶纖維grain的淺紙上。**不是可解碼QR**（無訊息、格式資訊、遮罩或錯誤更正）。結構概念依實際閱讀[Wikipedia「QR code」](https://en.wikipedia.org/wiki/QR_code)，尺寸與色彩為作者設定。0.05 m tile／0.0006 UV relief（非公尺深度），metallic0。目前目錄893種，含plain的gallery894項。

- `perforatedhardboard`：棕色回火鑽孔硬纖維板，16×16格方陣，每格中心一個圓形暗色不透明孔（約占5.1%面積）與略暗圓角環，孔間為含細纖維grain與碎屑斑的連續棕色板面；非透明通孔，無掛鉤或金屬板。概念依實際閱讀[Wikipedia「Perforated hardboard」](https://en.wikipedia.org/wiki/Pegboard)，未引用實物照片或規格，孔距／孔徑／色彩皆作者設定。0.4 m tile／0.004 UV relief（非公尺深度），metallic0。目前目錄892種，含plain的gallery893項。

- `westernredcedar`：北美香柏（Thuja plicata）縱向木面，偏紅金褐色底與細而平行的低對比暗色年輪線，年輪輕微起伏；無邊材、隨機暗帶、節疤或塗層，也無樹脂道。依實際閱讀[Wood Database Western Red Cedar](https://www.wood-database.com/western-red-cedar/)與實看[木面照片](https://www.wood-database.com/wp-content/uploads/thuja-plicata.jpg)近似，僅作配色與年輪線形態參考。重用`douglasfir`年輪sampler，0.12 m tile／0.003 UV relief（非公尺深度），metallic0。目前目錄891種，含plain的gallery892項。

- `chesterfieldleather`：Chesterfield菱格縫釦棕色皮革，6×6格每隔一格中心一顆小釦（每tile 18顆），斜向折線包圍鼓起的菱形軟墊；折線暗且AO低、墊頂較亮較光滑，附細皮革grain與低頻皺紋。作者示意，未引用特定產品或來源；無釦面金屬、縫線或破裂。0.5 m tile／0.012 UV relief（非公尺深度），metallic0。目前目錄890種，含plain的gallery891項。

- `longleafpine`：長葉松縱向木面，淡黃白早材與窄而高對比的橙褐色晚材條紋，年輪近乎平行、輕微起伏；無樹脂道、節疤、整面紅褐心材或塗層。依實際閱讀[Wood Database Longleaf Pine](https://www.wood-database.com/longleaf-pine/)與實看[木面照片](https://www.wood-database.com/wp-content/uploads/longleaf-pine.jpg)近似，僅作配色與條紋形態參考。重用`douglasfir`年輪sampler，0.12 m tile／0.003 UV relief（非公尺深度），metallic0。目前目錄889種，含plain的gallery890項。

- `douglasfir`：Douglas-fir弦切縱向面，淺橙褐色早材與較暗橙褐色晚材年輪構成多重尖拱與同心橢圓；無節疤、樹脂囊、邊／心材分界、塗層，也不是徑切平行年輪。依實際閱讀[Wood Database Douglas-Fir](https://www.wood-database.com/douglas-fir/)與實看[弦切樣板照片](https://www.wood-database.com/wp-content/uploads/pseudotsuga-menziesii.jpg)近似，僅作配色與年輪形態參考。專用週期C1年輪sampler，0.2 m tile／0.0035 UV relief（非公尺深度），metallic0。目前目錄888種，含plain的gallery889項。

- `blackwalnut`：深巧克力褐色黑胡桃木弦切縱向面，較暗長縱紋、直到略起伏的紋理與稀疏短小開放導管凹點；非紫／灰偏色、邊材、捲紋／瘤／鳥眼figure或塗層，也無半環孔導管大小漸變。依實際閱讀[Wood Database Black Walnut](https://www.wood-database.com/black-walnut/)與實看[弦切整板掃描](https://www.wood-database.com/wp-content/uploads/juglans-nigra-full.jpg)近似，僅作配色與紋理方向參考。0.16 m tile／0.0025 UV relief（非公尺深度），metallic0。目前目錄887種，含plain的gallery888項。

- `to92packagefaces`：2×2四個旋轉／微移的TO-92示意：霧黑D形本體（直側、平底、上半橢圓穹頂）、三支等間距平行直腳（寬根肩／窄尾），無金屬片、孔或印字。腳M1，本體／背底M0，C1混合；高度背底.02 < 腳.44 < 本體.68。尺寸僅參考實際下載並實看[onsemi 98ASB42022B，CASE29-11 Issue AM，2007-03-09，PDF第6頁／圖面第1頁](https://www.onsemi.com/pdf/datasheet/p2n2222a-d.pdf#page=6)，非精確CAD，不推定成分或電氣特性。0.08 m tile／0.0042 UV relief（非公尺深度），default metallic1；explicit0只改factor不改mask。建議512，32僅粗預覽。目前目錄886種，含plain的gallery887項。

- `rcafemalefaces`：RCA／Cinch母座正面示意——四個寬圓黑墊圈、較小圓金屬肩、再小的六平面前端筒、暗色絕緣環與凹入母座環／不透明暗底；無BNC卡口凸耳，不把大型後螺帽當正面。中性灰省略真實金光學，形狀／深度／色彩為作者近似；是接頭家族變體，不是電氣／音訊／RF／插合／EMC／安全認證。當時目錄為879種。
- `rj45femalefaces`：RJ45型8P8C母座正面示意——四個薄矩形金屬屏蔽框、霧黑絕緣內襯與低主腔，一側有較窄的階梯卡扣延伸、對側單排八個獨立長金屬接點。無LED；中性灰省略鍍金光學，作者佈局不是精確CAD，不模擬Ethernet／PoE／Cat／速度／電氣／EMC或認證。
- `usbcfemalefaces`：USB-C母座正面示意——四個圓角扁平金屬口、低霧黑腔與中央薄絕緣舌，每面兩排各12個金屬接點（共24）；不同於既有四接點矩形插座。中性灰近似，不模擬鍍金光學、實體空腔、電氣、USB速度／PD或安規認證。
- `iecc6inlets`：IEC C6公入口正面示意——四片平坦黑PA6法蘭，各有三葉形共腔、上單／下雙三個圓金屬腳端與雙沉頭安裝孔；腳端低於法蘭，沒有C8凸護罩，不是C5母孔、C14扁腳或市電／安規模擬。
- `iecc8inlets`：IEC C8公入口正面示意——四片黑PA6法蘭、膠囊形護罩與上下圓角V形縮口的八字形低腔，各有兩個高於腔底、低於護罩的圓金屬腳端；不是C7母孔、三片C14腳或市電／安規模擬。
- `din5femalefaces`：標準DIN五孔母座正面示意——四片非金屬黑PBT法蘭，各有三安裝孔、凸圓口、上鍵形缺口／下連接肋與五個中央膨大長形母孔；孔內低底為opaque stand-in，不是mini-DIN、真孔或MIDI／電氣模擬。
- `xlrfemalefaces`：XLR三孔母座正面示意——四片D尺寸圓角矩形金屬法蘭、左上／右下雙安裝孔、凸圓口、黑芯、上方卡扣與開口內環；上二／下一凹孔的低底為opaque stand-in，不是公針、真孔或音訊／電氣模擬。
- `bncfemalefaces`：BNC母座正面示意——四個低金屬法蘭、高圓筒口、對向雙卡榫及白絕緣環，中心有簡化金屬母接點環與opaque低底；中性灰PBR，不是凸公針、實體孔或射頻模擬。
- `iecc14inlets`：IEC C14公入口正面示意——四個黑色鍵形護罩內，各有上方一片、下方兩片的實心金屬腳端；高於低腔底而低於保護凸緣，不是C13母孔、背端帶孔端子或市電模擬。
- `dsubsocketfaces`：DE-9母座正面示意——四片金屬法蘭、封閉凸D框、黑色絕緣芯與五／四排九個凹入插孔；不是前凸金針、背面焊杯、透明真孔或可連接電路。
- `topadjusttrimmers`：上調式微調電位器頂面示意——四個非金屬矩形外殼，各有偏角小圓形金屬螺絲與單一全寬直線盲槽；槽底仍金屬，不是通孔、中央大螺絲或可調電路模擬。
- `crownprobetips`：四點皇冠探針端面示意——九個圓形金屬面各有四個圓化凸峰、低谷與較低金屬杯；不是十字螺絲凹槽、齒輪、城堡螺帽、真通孔或彈簧／電學模擬。
- `piezodiaphragms`：壓電振膜表面示意——四塊平坦金屬外板各有象牙白陶瓷露邊與單一中央金屬電極；不是陶瓷通孔、喇叭錐、鏡片、分割回授電極或電路／振動／音訊模擬。
- `castellatedboards`：PCB板邊半孔示意——四塊深綠非金屬板各有四排七個向板外開放的凹口與淡銀金屬半環land；不是封閉圓via、QFN、城堡螺帽、真幾何孔或PCB製造／電熱認證。
- `qfnlandpads`：QFN四邊平接點與中央裸焊盤示意——四塊深色非金屬底面，各有四排七個銀色平接點與分離中央盤；不是BGA圓頂、PCB熱via、pinout／必定接地或尺寸／熱電認證。
- `radiolariandiscs`：放射蟲骨盤赤道剖面示意——四個象牙白同心環肋骨架，各有中央腔、6／12／18格環帶與六短棘；全不透明非金屬，不是篩板外殼、蜘蛛網、真通孔或物種／顯微校準。
- `bgasolderballs`：完整BGA焊球矩陣示意——四塊深色方形非金屬載板各有13×13個等距銀色金屬圓頂與接觸陰影；不是環形滾珠、球鏈、pinout／JEDEC尺寸／錫合金或reflow認證。
- `pigskinleather`：三孔群豬皮示意——暖褐霧面皮紋上64組不規則三孔群，每孔圓潤、暗凹且遮蔽；全不透明非金屬，不是單一三角孔、鴕鳥隆圈、人工等大穿孔或皮料真偽認證。
- `trianglesocketheads`：TA 三角盲槽圓頭——25個銀灰鋼頭各有三條直邊的三角凹槽與封閉平坦金屬槽底，置於粗灰非金屬底；不是Y槽、曲邊TP3、真通孔或尺寸／防拆認證。
- `diatomvalves`：舟形矽藻外殼面示意——四片象牙白披針形殼面，兩側細長孔列圍住平齊中央留白，雙raphe中央斷開、末端向同側微彎；全不透明非金屬，不是真通孔、完整雙殼細胞或顯微尺度校準。
- `chitonshells`：石鱉八殼板覆瓦示意——九組橢圓背甲各有八片隆起殼板、七道順向覆瓦接合與粗暗外套膜帶；暖褐、不透明非金屬，不是可動殼片mesh、捲曲或生物力學模型。
- `leafstomata`：葉片氣孔守衛細胞示意——25組腎形細胞隆起圍住深色凹孔，兩端保留稍低的接合；綠色不透明非金屬圖樣，不是真通氣孔、完整葉表皮重建或動態蒸散模型。
- `watermelontourmaline`：西瓜碧璽三角切片鑲板——16片圓角三角的粉紅核心／淺灰過渡帶／綠色外圈共用拋光平面，置於粗灰底；正面不透明色盤近似，沒有透射、折射、多色性或寶石認證。
- `cuttlebone`：烏賊骨層板波壁示意切面——不等高層板與錯位、雙向細波壁圍住深色凹底；暖白粗糙非金屬、全不透明，不是三維開放迷宮重建、真正孔洞或生物力學模型。
- `pallasite`：拋光橄欖隕鐵——橄欖綠／蜜黃非金屬晶粒與連通銀灰鐵鎳基質近乎平齊，晶粒內有細暗裂紋；不透明正面PBR近似，沒有背光透射、精確合金光學或隕石認證。
- `gosperinlay`：三階Gosper黃銅嵌線——粗糙海軍藍非金屬地上的343段等長金屬線，只有兩個圓端點、沒有分岔；有限開放曲線，不是Moore封閉凹槽、極限填充集合或實體嵌線mesh。
- `vogelspiral`：黃金角葉序圓片鑲板——97片等大深青／鼠尾草／象牙平頂圓磚，在粗灰底上形成半步徑向偏移的離散Vogel圖樣；不是連續螺旋線、相切Doyle圓或植物模擬。
- `langtonsant`：蘭頓蟻1024步快照棋磚——32×32淺暖格板上的122個深色亮面黑格，奶油凸三角標出終點朝向；白左黑右的固定作者快照，不是QR碼或即時演化模擬。
- `pentominotiles`：十二種自由五連方釉面拼磚——每塊五格、每個6×10區塊十二形各一；全圖180塊海軍藍／灰藍／象牙拼磚，粗灰縫且同塊內無格線。固定作者佈局，不是互動拼圖或正五邊形磁磚。
- `pythagorastree`：有限畢氏樹釉面方磚——四棵由深赤褐逐代變象牙色的分枝方形樹，各31片、五尺寸層級；灰縫上的非金屬圖樣，不是雙尺寸平面鋪磚、無限碎形或真樹。
- `ichinghexagrams`：六十四卦浮雕爻紋——奶油粗底上的深色實／斷六爻，64種各六行、共576個平頂圓肩長條；作者二進位排列，非文王卦序、占卜或字型。
- `apollonianmosaic`：Apollonian相切圓馬賽克——青綠／鼠尾草／象牙釉面圓盤，以兩輪Descartes反射在每個圖樣填入19個大小不等的相切圓；粗糙灰縫上的有限、不透明非金屬作者圖樣，不是無限碎形或施工規格。
- `prismaticpentagonaltiles`：稜柱房形五角（V3.3.3.4.4）鑲嵌——藍灰／灰綠／象牙上下交錯房形釉面磚，兩個相鄰90°底角與三個120°屋頂角；粗糙灰縫上的不透明非金屬作者近似，無尺寸或施工認證。
- `floretpentagonaltiles`：花形五角（V3.3.3.3.6）手性鑲嵌——森林綠／橄欖／象牙釉面五角磚，六瓣繞一點，每瓣一個60°與四個120°角；粗糙灰縫上的不透明非金屬作者近似，無尺寸或施工認證。
- `snubtrihexagonaltiles`：扭稜三六角（3.3.3.3.6）手性鑲嵌——靛藍正六角與象牙／棕黃三角釉面磁磚，四個三角形與一個六角形在每頂點相遇；粗糙灰縫上的不透明非金屬作者近似，無實際尺寸或施工認證。
- `deltoidaltrihexagonaltiles`：鳶形三六角（V3.4.6.4）鑲嵌磁磚——勃艮第紅、玫瑰與象牙三色釉面鳶形磚，嵌在粗糙灰縫上，每個六角胞被六條通向邊中點的輻條切成六塊鳶形；不透明非金屬作者近似，不含實際磁磚尺寸或鋪貼規格認證。（不同於既有`kisrhombilletiles`的30-60-90三角形與`trihexagonaltiles`的六邊形加三角形。）
- `soroban`：七棒算盤——木製框條與隔條之間，七根竹棒上的雙錐木珠依序顯示4567890（取自頁面圖說1234567890的末七位），隔條上每第三根棒有一個點；不透明非金屬作者近似，不含實際算盤尺寸、材料或教學正確性認證。（不同於既有`seedbeads`的種子珠。）
- `ean13label`：EAN-13條碼標籤——淺色紙面上印著Wikipedia頁面範例號碼4 003994 155486的30條黑色條碼，起始、中央與結尾護線較長；不透明非金屬作者近似，不含GS1規格、掃描器可讀性或印刷品質認證。（不同於既有`papertape`的打孔紙帶。）
- `embossedbraille`：浮凸點字紙——7×4個點字格的奶油色紙面，以光滑隆起的圓點依序拼出a到z的字母（跳過w，後面留三個空格）；不透明非金屬作者近似，不含紙張材料、點距標準或可讀性認證。（不同於既有`tactilepaving`的規則截錐警示凸點。）
- `rule30`：Rule 30元胞自動機——33×33格的tile顯示Wolfram初等元胞自動機Rule 30從頂列中央單一黑格長出的33代（時間向下），黑格是凸起、光滑的深色方塊，白格是較低、較粗糙的淡色方塊，格間有凹陷細溝；不透明非金屬作者近似，不含材料、尺寸規格或隨機性認證。（不同於既有`sierpinskicarpet`、`perfectmaze`等圖樣。）
- `perfectmaze`：種子完美迷宮——8×8格的迷宮，凹陷、深色、較光滑的通道夾在淡色、較粗糙的凸牆之間，64格以63條連結相連，每格都到得了且沒有迴圈，每個seed是不同的迷宮；不透明非金屬作者近似，不含材料、尺寸規格或難度保證。（不同於既有`moorecurve`的單一封閉溝槽迴路。）
- `sevensegment`：七段顯示器面板——5×2格的深色玻璃面板顯示0123456789，亮起的琥珀色斜角長條按常見七段圖樣排列，未亮的段保留暗淡殘影；不透明非金屬作者近似，不含LED／LCD元件、發光或標準規格。（不同於既有`chipresistors`的白色103標記。）
- `ulamspiral`：Ulam質數螺旋——15×15格tile以正方形螺旋寫入整數1–225（1在中央），質數所在格有光滑深色凸圓頂，位於較粗糙的淡色非金屬石板與凹陷格線溝上；不透明非金屬作者近似，不含材料、標準或數學認證。（不同於既有`tactilepaving`的規則截錐凸點與`dominoes`的0–6凹點。）
- `papertape`：打孔紙帶——一吋寬、十個0.1吋字元列×九條孔軌的八軌紙帶tile，淡色非金屬紙面上以孔洞編碼ASCII文字「PAPER TAPE」（第8位元為偶同位），另有一列較小的導孔偏向窄邊，孔中露出深色底襯，孔較粗糙；不透明非金屬作者近似，不含材料、紙厚、半透明或標準規格。（不同於既有`punchcard`的2×4卡片與矩形打孔。）
- `moorecurve`：Moore曲線溝槽磁磚——8×8格的淡色非金屬tile上，一條封閉連續的深色凹溝槽穿過每一格（四條旋轉的Hilbert曲線組成的漢米頓迴路），較粗糙；不透明非金屬作者近似，不含材料、雕刻工法或尺寸規格。（不同於既有溝槽、迷宮與磁磚類preset。）
- `sierpinskicarpet`：Sierpinski地毯石磚——81×81格tile上四層遞迴凹方（1個27格、8個9格、64個3格、512個1格），越大越深越暗，tile可無縫重複；不透明非金屬作者近似，是有限四層近似而非極限集合，不含石種、雕刻工法或尺寸規格。（不同於既有穿孔、嵌板與點蝕類preset。）
- `chladnifigure`：Chladni圖形——深色較光滑的非金屬板上，淡色細沙沿駐波節線聚集，沙略凸起且較粗糙，節線圖樣與UV tile精確重複；不透明非金屬作者近似，不模擬實體板模態、材料或沙粒物理。（不同於既有沙、石與穿孔板類preset。）
- `kisrhombilletiles`：V4.6.12 kisrhombille鑲嵌——每個六邊形被切成十二個全等30-60-90直角三角形，深青色與奶油色釉面三角形繞中心交替，所有直邊落在相隔30°的六組平行線上，邊緣有窄斜邊並被粗糙灰色填縫圍出；不透明非金屬作者近似，不含磁磚厚度、釉料化學或尺寸規格。（不同於既有`rhombille`、3.6.3.6六角三角與等腰直角`righttriangletiles`磁磚，並是`truncatedtrihexagonaltiles`的對偶。）
- `truncatedtrihexagonaltiles`：4.6.12截角三六角鑲嵌——奶油色釉面十二邊形、三個方向各差60°的靛藍小正方形與薰衣草色正六邊形，邊緣有窄斜邊並被粗糙灰色填縫圍出；不透明非金屬作者近似，不含磁磚厚度、釉料化學或尺寸規格。（與既有3.12.12十二邊形、六角三角及`rhombitrihexagonaltiles`磁磚的頂點類型不同。）
- `elongatedtriangulartiles`：3.3.3.4.4長三角鑲嵌——赤陶色直立正方形列與奶油色朝上／朝下正三角形列交替、正方形列錯開半邊，邊緣有窄斜邊並被粗糙灰色填縫圍出；不透明非金屬作者近似，不含磁磚厚度、釉料化學或尺寸規格。（頂點內容與`snubsquaretiles`同為三三角兩正方形但順序不同，且不同於既有六角三角磁磚。）
- `rhombitrihexagonaltiles`：3.4.6.4菱形三六角鑲嵌——奶油色釉面六邊形、三個方向各差60°的石板藍正方形與海軍藍正三角形，邊緣有窄斜邊並被粗糙灰色填縫圍出；不透明非金屬作者近似，不含磁磚厚度、釉料化學或尺寸規格。（與既有`snubsquaretiles`、六角三角及3.12.12十二邊形磁磚的頂點類型不同。）
- `snubsquaretiles`：3.3.4.3.4扭稜正方形鑲嵌——±15°交替旋轉的深藍釉面正方形與奶油色釉面正三角形，邊緣有窄斜邊並被粗糙灰色填縫圍出；不透明非金屬作者近似，不含磁磚厚度、釉料化學或尺寸規格。（與既有六角三角、Cairo五邊形及直角三角形磁磚的頂點類型不同。）
- `starfish`：粗糙灰砂底上的橘色五臂海星，圓潤中央圓盤接五條由根到尖逐漸變窄的臂，臂角與臂長略不規則，臂上有隆起脊線與三列小瘤點；不透明非金屬作者近似，不含物種辨識、管足、棘刺、篩板、真實尺寸或海洋生物學數據。
- `fishscaleshingles`：8層各12個半圓下緣瓣的米色魚鱗金屬瓦，每片兩瓣、逐層錯半瓣、上層疊壓並在下層留陰影，片間有窄縫；不透明非金屬作者近似，不含壓花紋理、金屬反射、真實疊壓幾何或規格認證。（與既有`scallopedslate`、`fishscaletiles`同屬扇貝疊壓家族的變體。）
- `waffleweave`：14×16個固定格的冷灰白圓脊圍出內凹小方格，橫向脊較高、脊交點隆起成小結；不透明非金屬作者近似，不含真實經緯交織、織物物理、吸水性或織物規格認證。（與既有`wafflecloth`同屬華夫格織物家族的較細變體。）
- `halite`：粗糙淡灰粉鹽底上的乳白立方hopper晶面，外緣為隨機旋轉的正方形，內含兩層同心逐級下陷的正方階面；不透明非金屬作者近似，不含鹽晶尺寸量測、透明／溶蝕物理、完整立方體mesh或礦物認證。（與既有`bismuthhoppers`同屬旋轉巢狀方形hopper家族的非金屬鹽晶變體。）
- `calcite`：深褐粗糙礦底上的乳白斜方形平板，兩組平行邊約75°並含巢狀平行階面；不透明非金屬作者近似，不含解理角量測、透明／雙折射、完整菱面體mesh或礦物認證。
- `flangenuts`：圓形錐面法蘭上的削角六角螺帽，含六個直平側與開放圓孔、露出深色粗糙鋼底；整張map為金屬，不含底面鋸齒、完整3D、內螺紋或DIN／ISO認證。
- `capnuts`：深色粗糙鋼底上的六角蓋形螺帽，含六個直平側、削角角隅與封閉圓形球冠；整張map為金屬，不是Hex Nuts的貫穿孔，也不含完整3D、內螺紋或DIN／ISO認證。
- `bedfordcord`：卡其色經向織入凸棱、連續細溝與相鄰半距交錯的扁平緯向短棱；不透明非金屬表面近似，不含真實經緯／襯紗交織、布料物理或棉布規格／來源認證。
- `staurolite`：淺色粗礦底上的深褐60°交叉柱狀雙晶、平行直側與鈍端；四臂共一頂面、不堆疊交心，為不透明非金屬近似，不含完整mesh、折射、片岩片理或礦物／化學認證。
- `dowelpins`：銀色無頭實心圓柱定位銷側影、一端圓弧與對端導入倒角、淺圓柱冠面；鋼／不透明非金屬底分離，不含完整mesh、壓入物理、負載或DIN／ISO認證。
- `europeanbeech`：淡粉褐細直紋歐洲山毛櫸、密集均勻淺凹縱孔與短小平齊射線斑；不含木孔mesh、木種鑑定、防水、結構或來源認證。
- `habotai`：珍珠白細密1/1平織絲綢、同色經緯、低起伏與柔和光澤；選不透明表面近似，不含透光、皺褶／毛絲mesh、布料物理或纖維／重量認證。
- `azurite`：深藍色寬斜端板柱晶面、淺縱紋與局部平行三片晶群，高於深色粗礦底；opaque dielectric不是金屬，不含完整晶柱、透明折射或礦物／含銅安全認證。
- `whiteoak`：暖橄欖褐徑切白橡木，寬長橫向射線斑與直木紋平齊、縱導管較淺；不是凸木瘤，不含木種鑑定、防水或結構性能認證。
- `clevispins`：銀色雙肩短凸頭連接銷側影、無螺紋直軸淺圓冠與對端單封閉圓孔，鋼面／不透明非金屬孔底分離；不含卡簧裝配、完整通孔mesh、負載或DIN／ISO認證。
- `whipcord`：深灰單條陡斜粗脊、同色經緯紗與連續三pick長浮紗；有別於細Gabardine、雙脊Cavalry Twill和橫向羅緞，不含毛羽mesh、衣料物理或紡織性能認證。
- `vanadinite`：橙褐凸六角晶緣與較小同向凹六角平底，散布於淡色粗礦底；不同於實心平頂晶面，不含完整晶柱、透明折射或礦物／含鉛安全認證。
- `tabwashers`：銀色平坦圓環、封閉圓孔與單一向外直端平舌，metal 鋼面／非金屬孔底分離；不是開口、球面或杯形墊圈，不含彎舌、裝配或防鬆性能認證。
- `whiteash`：淺暖褐白蠟木直紋與平齊生長帶，較粗且密集的早材長導管對比細疏晚材孔；只有導管凹入，不含端面圓孔、凸木肋或木種／物性認證。
- `gibheadkeys`：銀色實心鉤頭錐鍵的平坦側視輪廓，含外端斜削鉤頭、單側階差與近1:100直條鍵身；不是 parallelkeys 雙圓端或 Woodruff 半月鍵，不含完整3D鍵、配合、拔出或標準符合認證。
- `grosgrain`：灰藍羅緞細密經線與單條圓凸橫肋，逐根交錯並向兩側平滑下降；不是 Faille 平棱或 Ottoman 成對棱，不含帶邊 mesh／透明／布料物理。
- `pyromorphite`：黃綠磷氯鉛礦平坦六角凸端面與淡色粗礦底，含不同大小／方向；只近似晶柱端面，不含完整稜柱／桶狀晶體、透明光學或礦物／含鉛安全認證。
- `kingwood`：深紅褐磨光心材與不等寬平齊紫黑細縱紋，稀疏導管略凹；不是奶油粉紅 Tulipwood、凸木肋或木種／合法來源認證。
- `faille`：象牙白平紋橫棱織物，細密經紗逐根交錯寬平單緯棱，含交叉起伏與凹紗隙；不是 Ottoman 成對粗棱，不含透布或垂墜物理。
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
- `f05opticalfaces`: four uncapped JIS-F05 optical receiver faces: matte-black resin rectangles, long side recesses, raised six-sided guides with two chamfered corners at one end and rounded side bosses, dark keyed mouths and low round wells. All dielectric; no shutter, LED or transparent lens. An authored approximation of the NRND TORX1350A(F) horizontal drawing, not optical/data/audio/electrical/fit/EMC/safety simulation or certification. The catalog then had 880 kinds.
- `minidin4femalefaces`: four 2×2 mini-DIN four-contact female faces: black PBT carriers/notched circular inserts, continuous thin tin-plated brass earth rims, open top notches, two lower side steps, upper vertical/lower horizontal slots and separate closed lower key openings. Based on the separate MD-40S front in [Same Sky MD-S page 2](https://www.sameskydevices.com/product/resource/md-s.pdf) and the [manufacturer photo](https://cdn.sameskydevices.com/products/image/getproductimage/976?typecode=m&width=300), not the generic nine-contact drawing or PCB footprints. Only the earth rim is metal; default metallic 1/explicit 0 never changes the stored mask. No outer shielding can, visible silver internal contact annuli or video/electrical simulation. Authored shape/PBR approximations, not CAD/fit/certification. Prefer 512; 32 is coarse. The catalog then had 881 kinds.
- `dcbarreljackfaces`: four 2×2 DC barrel-jack front illustrations: tall black PBT rectangles, upward-offset dark round mouths, solid recessed nickel pins and separate lower silver strips (flat top/bottom, circle-clipped ends only). Only pin/strip have M1; all PBT/floors have M0. Depth is backing < bore < strip < pin < carrier; no outer metal rim or added raised bezel. Based on [Same Sky PJ-102A](https://www.sameskydevices.com/product/interconnect/connectors/dc-power-connectors/jacks/pj-102a), [primary drawing page 2](https://www.sameskydevices.com/product/resource/pj-102a.pdf) and [front photo](https://cdn.sameskydevices.com/products/image/getproductimage/690?typecode=m&width=300). Default metallic 1/explicit 0 changes only the factor, not the stored mask. Rear solder legs, PCB and real through-holes are omitted; no source assets are bundled. An authored front illustration, not CAD/electrical/polarity/switch/safety/fit simulation or certification. Prefer 512; 32 is coarse. The catalog then had 882 kinds.
- `stfiberadapterfaces`: four 2×2 simplified ST simplex fronts: six-flat plated-metal hex bases, concentric round collars, raised circular barrel lips with ONE open top axial keyway and TWO opposed side bayonet studs, and deep dark opaque circular cavities. The keyway lowers ONLY the lip to the continuous metal collar, never the background. Hardware/key floors have M1; cavities/backing M0. Depth: backing < bore < nut < collar/key < studs < lip. Based on [SENKO ST](https://www.senko.com/product/st-adapter-2/), five-page [DS-ST-000006-RevA-EN pages 1/3](https://www.senko.com/wp-content/uploads/2025/01/DS-ST-000006-RevA-EN.pdf) and the [primary photo](https://www.senko.com/wp-content/uploads/2021/09/ST-Adapter.png), using 216-101. Only plated metal is known, not nickel. Internal zirconia is specified but no white ring is clearly exposed; no ceramic ring, center contact or pin is drawn. 29.3 mm is axial depth, double-D 9.6 × 7.8 mm a panel-cutout reference, not the front; metadata creation 2024-11-15 is not a printed date. Authored proportions, not CAD; no threads/knurl teeth/washer/caps/rear/cable/ferrule/PCB or optical/electrical/mating/safety simulation or browser/FPS certification. 0.04 m tile, 0.0042 UV relief, default metallic 1; explicit 0 is factor-only. Constructor caches; no query allocation/loop/hash/trig/sqrt. The catalog then had 883 kinds.
- `ftypefemalefaces`: four 2×2 bare F-type female bulkhead fronts: six-flat nickel-plated metal hex bases, concentric raised round shoulders, CLOSED unkeyed raised circular lips, pale P.P. dielectric disks and tiny deeper dark opaque entries. Exterior hardware M1; backing/P.P./entry M0. Depth: backing < entry < nut < shoulder < P.P. < lip. No ST keyway/studs, male pin or invented visible central contact ring. Based on the historical [Amphenol Connex CAT-103 ©2001, PDF page 159 / printed 158](https://docs.rs-online.com/1ab7/A700000006717073.pdf#page=159), 222121 photo/drawing and Nickel/P.P./75Ω table, not generic Delrin/Teflon. 11 HEX, 21.3 mm axial length and washer/nut side dimensions are references, not measured front height. The actual tiny entry cross-section is unresolved; its circle is an artist simplification. Default 0.04 m tile/0.0042 UV relief (not metre depth), metallic 1; explicit 0 changes only the factor, not the stored mask. No thread helix/decorative thread turns, washer teeth, rear/cable, real holes/transparency/new mesh. Authored material/optical approximations, not CAD/RF/75Ω/electrical/mating/safety simulation; historical 75Ω only identifies the part. Constructor caches; no query allocation/loop/hash/trig/sqrt. Existing pbr3d and texture ownership apply; prefer 512, 32 is coarse preview. The catalog then had 884 kinds.
- `to220packagefaces`: four 2×2 exposed-tab TO-220 fronts with TWO clipped upper tab corners, ONE dark opaque recessed mounting hole, matte-black rectangular bodies and THREE uniformly spaced parallel straight leads (broad root shoulders/narrow tails). Tab/leads M1, other surfaces M0 with C1 blends—not electrical isolation. Authored heights: backing .02 < hole .06 < tab .30 < lead .44 < body .68. Based on [STP55NF06, May 2012, Doc ID7544 Rev11](https://www.st.com/resource/en/datasheet/stb55nf06.pdf#page=13), actually viewed cover page 1/Figure 23 page 13 and read table page 12, not TO-220FP. Dimensions are references, not CAD/heat/electrical/RF/safety/FPS simulation; no chemistry or plating is inferred. Defaults: 0.08 m tile, 0.0042 UV relief (not metres), metallic 1; explicit 0 changes only factor, not mask. Cached typed payload is 73,856 B excluding JS overhead; queries have no allocation/loop/hash/trig/sqrt/neighbor search. Prefer 512; 32 need not resolve narrow leads. Catalog: 885 kinds; gallery including plain: 886.
- `fordcircles`: Ford circles — for every reduced fraction `n / d` (d ≤ 12, 46 of them) a disc of radius `1 / (2 d²)` plus its mirror about the middle line (91 discs; the discs of consecutive Farey fractions touch and their interiors do not overlap — this geometry was verified with a probe, not in the tests), amber gold discs on dark navy with the tone brightening as the denominator shrinks; the tests compare the sampler with an independently written Ford-circle geometry at 6,000 points and try all 256 shifts, checking that exactly one fits, **without covering the shape of the soft edge zone**; a schematic number-theory pattern; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.5 m tile, 0.0008 UV relief (not metres), metallic 0; construction and sampling times were not measured (sampling loops over the 46 discs per call). Current catalog: 1018 kinds, 1019 gallery choices including plain.

- `hammingtable`: Hamming distance table — 32×32 rounded square tiles toned by the Hamming distance `popcount(row xor col)` of the two 5-bit indices, darkest on the diagonal and brightest at the complements, repeating the same block structure at every power of two; the tests rebuild the tone table with an independently written bit count and compare it with every cell centre, and every seed has **two** fitting torus shifts (related by the exclusive-or symmetry of adding 16), which the tests check explicitly; a schematic bit-operation table; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.5 m tile, 0.0008 UV relief (not metres), metallic 0; construction and sampling times were not measured. Current catalog: 1017 kinds, 1018 gallery choices including plain.

- `aggregationfrost`: Aggregation frost — diffusion-limited aggregation on a 96×96 torus (900 particles, random walks sticking to the edges of the cluster), as thin ice-blue frost-flower-like branches whose tone fades from the centre (the oldest) to the tips, one per tile and not joined to neighbouring tiles; the tests read the occupied cells back from the node colours and use an independent breadth-first search to check that the cluster is connected, has exactly 900 cells and that the colour falls with the graph distance, **without an independent rewrite of the aggregation algorithm and without checking the fractal dimension**; a schematic simulation result; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.5 m tile, 0.0008 UV relief (not metres), metallic 0; the sampler construction takes about 126–150 ms (single measurements, not a benchmark) and sampling itself is a constant number of operations. Current catalog: 1016 kinds, 1017 gallery choices including plain.

- `cyclicwaves`: Cyclic waves — an eight-state cyclic cellular automaton on a 96×96 torus (von Neumann neighbourhood, threshold 1, 150 synchronous steps, random start), with states 0 to 7 mapped to tones from dark indigo to amber yellow, forming spiral and labyrinth-like waves; the tests read the states back from the node colours and check statistics (about 97% of neighbour pairs differ by at most one state, every cell has a ±1 neighbour, each state takes about an eighth), **without an independent rewrite of the update rule**; a schematic automaton snapshot; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.5 m tile, 0.0008 UV relief (not metres), metallic 0; the sampler construction takes about 39–78 ms (single measurements, not a benchmark) and sampling itself is a constant number of operations. Current catalog: 1015 kinds, 1016 gallery choices including plain.

- `isingdomains`: Ising domains — a snapshot of Metropolis dynamics of the two-dimensional Ising model on a 64×64 torus (temperature 2.35, 150 checkerboard sweeps, random start), with up spins bright and down spins dark, lightly tinted by the share of equal neighbours, as lime-green camouflage-like domains; the tests read the spins back from the node colours and check the colouring logic and statistics (equal neighbour pairs about 0.78–0.84), **without an independent rewrite of the Metropolis update and without verifying equilibrium**; a schematic model snapshot; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.5 m tile, 0.0008 UV relief (not metres), metallic 0; the sampler construction takes about 64–102 ms (single measurements, not a benchmark) and sampling itself is a constant number of operations. Current catalog: 1014 kinds, 1015 gallery choices including plain.

- `percolationclusters`: Percolation clusters — site percolation with probability 0.5927 on a 64×64 torus, with the occupied cells joined into clusters by union-find (wrapping) and toned by ln(cluster size)/ln(largest cluster), as a camouflage-like sulfur-yellow pattern; the tests read the occupied cells back from the sampler's node colours, relabel the clusters with an independent flood fill and compare the colours, which verifies the cluster logic but not the hash-determined occupancy itself; a schematic random pattern, not a simulation of real percolation; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.5 m tile, 0.0008 UV relief (not metres), metallic 0; every sample is a constant number of operations and the time was not measured. Current catalog: 1013 kinds, 1014 gallery choices including plain.

- `voronoifacets`: Voronoi facets — the same Voronoi plates as voronoicells, but the tone of each plate ramps linearly in a random direction (up to ±0.35 per cell width), in emerald green with dark, rough thin seams; it shares the voronoicells sampler (new gradient fields; `facet` is 0 for voronoicells and voronoipillows so their behaviour is unchanged); the tests check exactly 64 plates per seed, a tone gradient inside the plates (mean spread about 0.15), the seam properties, C1 and periodicity, **without an independently rewritten site model**; known defect: blurry smudges at sharp junctions; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.4 m tile, 0.0012 UV relief (not metres), metallic 0. Current catalog: 1012 kinds, 1013 gallery choices including plain.

- `multiplicativeorder`: Multiplicative order — a 48×48 grid of squares in which cell a = col + 1 (1 to 48) modulo n = row + 2 (2 to 49) is darkest when a shares a factor with n (887 cells) and otherwise toned by ord_n(a)/φ(n) raised to 1.5 (a ratio of 1 is a primitive root, 406 cells; 189 cells have order 1; the largest order is 46), in ice blue on deep navy, with the seed shifting the whole table around the torus; it shares the cell shape with number-theory tables such as totienttable; the tests rewrite it independently with repeated multiplication and coprime counting and find exactly one torus shift per seed; only a display of ratios, not a proof of any theorem; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.3 m tile, 0.0008 UV relief (not metres), metallic 0; every sample is a constant number of operations and the time was not measured. Current catalog: 1011 kinds, 1012 gallery choices including plain.

- `sandpileidentity`: Sandpile identity — the identity element of the 64×64 abelian sandpile group (Dhar's method: stabilise twice the maximal stable configuration, subtract, stabilise again; heights 0 to 3 with 396/152/1,476/2,072 cells, symmetric under mirroring and transpose, forming mandala-like designs), with gold shades for the heights, the seed shifting the pattern around the torus, and a framed seam formed by the pattern's border when tiled; the tests rewrite it with an independent sweeping toppling algorithm, check `e + e = e` and the symmetries, and find exactly one torus shift per seed; it only shows that the result satisfies `e + e = e`, and I did not separately verify that it is the identity for all recurrent configurations; a visualisation of a mathematical object, an authored schematic with no specific source cited and no photograph compared. Defaults: 0.5 m tile, 0.0008 UV relief (not metres), metallic 0; every sample is a constant number of operations, and the identity is computed once (about 69 ms, a single measurement) and cached. Current catalog: 1010 kinds, 1011 gallery choices including plain.

- `voronoipillows`: Voronoi pillows — the same Voronoi plates as voronoicells, but every plate's height is a raised dome (falling smoothly with the distance to the weighted mean site), in terracotta with dark, rough thin seams; it shares the voronoicells sampler (new dome fields, 0 for voronoicells so its behaviour is unchanged); the tests check exactly 64 plates per seed, a height difference of about half the relief inside each plate, the seam properties, C1 and periodicity, **without an independently rewritten site model** and without ever seeing the lit 3D appearance; known defect: blurry smudges at sharp junctions; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.4 m tile, 0.0016 UV relief (not metres), metallic 0. Current catalog: 1009 kinds, 1010 gallery choices including plain.

- `voronoicells`: Voronoi cells — one jittered site per cell of an 8×8 grid (64 in all), split by the nearest site into 64 blue-grey polygonal plates (one random tone each) with thin dark, rough, AO-darkened seams; the borders use soft weights (5×5 neighbouring cells, Gini impurity) so the field is C1; the tests check exactly 64 plates per seed, one tone per plate, the seam properties, C1 and periodicity, **without an independently rewritten site model**; known defect: blurry smudges at sharp junctions; a schematic slab look, an authored schematic with no specific source cited and no photograph compared. Defaults: 0.4 m tile, 0.0012 UV relief (not metres), metallic 0; every sample needs about 25 distance and exponential evaluations, and I measured only a single 512² maps generation at about 143–182 ms (not a benchmark). Current catalog: 1008 kinds, 1009 gallery choices including plain.

- `cantordust`: Cantor dust — the order-4 two-dimensional Cantor set on an 81×81 lattice (256 surviving cells as small golden dots like constellations), with the removed cells shaded in different dark tones by level, and the seed shifting the lattice around the torus; it shares the sampler branch of vicsekfractal (only the survival rule differs, via a new `rule` field that leaves the existing material's behaviour unchanged); the tests rewrite the model independently by subdivision and find exactly one torus shift per seed (depth tones included); a schematic fractal pattern, an authored schematic with no specific source cited and no photograph compared. Defaults: 0.5 m tile, 0.0008 UV relief (not metres), metallic 0; every sample is a constant number of operations and the time was not measured. Current catalog: 1007 kinds, 1008 gallery choices including plain.

- `tsquarefractal`: T-square fractal — the order-5 T-square fractal on a 64×64 lattice (341 overlapping squares covering 3,124 cells; the 972 uncovered cells form a dark brown skeleton of crosses and T shapes, and the cream covered area has faint tones by deepest level), with the seed shifting the lattice around the torus; the tests rewrite the model independently by recursion and find exactly one torus shift per seed (level tones included); a schematic fractal pattern, an authored schematic with no specific source cited and no photograph compared. Defaults: 0.5 m tile, 0.0008 UV relief (not metres), metallic 0; every sample is a constant number of operations and the time was not measured. Current catalog: 1006 kinds, 1007 gallery choices including plain.

- `vicsekfractal`: Vicsek fractal — the order-4 plus-shaped fractal on an 81×81 lattice (625 surviving cells as thin gold lines), with the removed cells shaded in dark teal tones that depend on the level, and the seed shifting the lattice around the torus; the tests rewrite the model independently by subdivision and find exactly one torus shift per seed (depth tones included); a schematic fractal pattern, an authored schematic with no specific source cited and no photograph compared. Defaults: 0.5 m tile, 0.0008 UV relief (not metres), metallic 0; every sample is a constant number of operations and the time was not measured. Current catalog: 1005 kinds, 1006 gallery choices including plain.

- `squarekoch`: Square Koch — the order-3 type 1 quadratic Koch island (`F+F−F−F+F` applied three times: a closed loop of 500 unit steps and 376 distinct lattice points whose edges touch at corners without any edge being walked twice), as a thin salmon-pink line with a faint glow on dark oxblood, on a 32×32-cell torus where it does not join neighbouring tiles, with the seed shifting the curve around the torus; it shares the trace sampler branch; the tests rewrite the island independently by recursion and find exactly one torus shift per seed; a schematic fractal trace, an authored schematic with no specific source cited and no photograph compared. Defaults: 0.25 m tile, 0.0008 UV relief (not metres), metallic 0. Current catalog: 1004 kinds, 1005 gallery choices including plain.

- `radicaltable`: Radical table — a 48×48 grid of squares in which cell n = row·48 + col + 1 (1 to 2304) is toned by ln(rad(n)) / ln(n), squared (rad is the product of the distinct primes; the 1400 squarefree numbers are brightest, prime powers give 1/k, the smallest being 1/11 at 2048), in pale sage green on dark green, with the seed shifting the whole table around the torus; it shares the cell shape with number-theory tables such as divisorcount; the tests rewrite the radical independently by trial division and find exactly one torus shift per seed; only a display of ratios, not a proof of the abc conjecture; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.3 m tile, 0.0008 UV relief (not metres), metallic 0; every sample is a constant number of operations and the time was not measured. Current catalog: 1003 kinds, 1004 gallery choices including plain.

- `goldbachtable`: Goldbach table — a 48×48 grid of squares in which cell n = 2·(row·48 + col + 2) (4 to 4610) is toned by g(n)·ln(n)²/n (g is the Goldbach partition count, scaled by ln(n)²/n to remove the overall growth and avoid a colour step at the seam), in violet on dark purple, brightest at n = 2310, with the seed shifting the whole table around the torus; it shares the cell shape with number-theory tables such as divisorcount; the tests rewrite the partition counts independently by trial division and find exactly one torus shift per seed; only a display of partition counts, not a proof of the conjecture; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.3 m tile, 0.0008 UV relief (not metres), metallic 0; every sample is a constant number of operations and the time was not measured. Current catalog: 1002 kinds, 1003 gallery choices including plain.

- `totienttable`: Totient table — a 48×48 grid of squares in which cell n = row·48 + col + 1 (1 to 2304) is toned by φ(n)/n (the smallest ratio 48/210 is at n = 210, primes are brightest and even numbers are at most 1/2), giving amber-gold vertical stripes (the table width of 48 is even) on dark brown, with the seed shifting the whole table around the torus; it shares the cell shape with number-theory tables such as divisorcount; the tests rewrite φ(n) independently by counting coprime numbers and find exactly one torus shift per seed; only a display of function values, not a proof of any theorem; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.3 m tile, 0.0008 UV relief (not metres), metallic 0; every sample is a constant number of operations and the time was not measured. Current catalog: 1001 kinds, 1002 gallery choices including plain.

- `spirographtable`: Spirograph table — a 6×6 table in which cell (col, row) draws the hypotrochoid of a wheel of radius a = col + 1 rolling inside a ring of radius b = row + 7 (pen ratio 0.8), with the seed setting a common rotation (0 to 0.5 radians), as copper curves with a faint glow on dark oxblood; self-crossings use a Gaussian sum so there is no crease, and the 13 cells where a and b share a factor draw only one closed period; the tests take 96 points from a separately written curve formula and check that 25–29 rotation angles put every curve point on bright pixels; only a table of integer ratios (the pen ratio is fixed), not a real spirograph toy; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.3 m tile, 0.0008 UV relief (not metres), metallic 0; every sample walks 360 segments, and I measured a single 512² maps generation at about 444 ms (one measurement, not a benchmark). Current catalog: 1000 kinds, 1001 gallery choices including plain.

- `dodecagridfilled`: Dodecagrid filled — the same twelve-fold patch as dodecagridtiling (151 tiles) with a tone inside every tile (squares brightest, 30° rhombi darkest, weighted by the product of one smooth step per edge) and thin pale lime edge lines on forest green, with the seed turning the patch by a multiple of 30°; it uses the tile-filling feature of the multigrid sampler branch; the tests compare the colours at the vertices and tile centres of every seed with a separately written model; only a small patch and the tone is not a real colouring rule; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.5 m tile, 0.0007 UV relief (not metres), metallic 0; every sample walks the 330 edges and the 151 tiles and the time was not measured. Current catalog: 999 kinds, 1000 gallery choices including plain.

- `heptagridfilled`: Heptagrid filled — the same seven-fold patch as heptagridtiling (154 rhombi) with a tone inside every rhombus (wide ones brighter, narrow ones darker, weighted by the product of one smooth step per edge) and thin pale blue edge lines on navy, with the seed turning the patch by a multiple of 360°/14; it uses the tile-filling feature of the multigrid sampler branch; the tests compare the colours at the vertices and rhombus centres of every seed with a separately written model; only a small patch and the tone is not a real colouring rule; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.5 m tile, 0.0007 UV relief (not metres), metallic 0; every sample walks the 335 edges and the 154 rhombi and the time was not measured. Current catalog: 998 kinds, 999 gallery choices including plain.

- `ammannfilled`: Ammann filled — the same eight-fold patch as ammannbeenker (148 tiles: 62 squares and 86 rhombi) with a tone inside every tile (squares brighter, rhombi darker, weighted by the product of one smooth step per edge) and thin amber edge lines, with the seed turning the patch by a multiple of 45°; it uses the tile-filling feature of the multigrid sampler branch; the tests compare the colours at the vertices and tile centres of every seed with a separately written model; only a small patch and the tone is not a real colouring rule; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.5 m tile, 0.0007 UV relief (not metres), metallic 0; every sample walks the 322 edges and the 148 tiles and the time was not measured. Current catalog: 997 kinds, 998 gallery choices including plain.

- `penrosefilled`: Penrose filled — the same Penrose rhombus patch as penrosetiling but with a tone inside every rhombus (fat ones brighter, thin ones darker, weighted by the product of one smooth step per edge, C1) and pale cream edge lines, with the seed turning the patch by a multiple of 36°; it shares the multigrid sampler branch (new `fills`, `fillRim` and `fillHeight` fields, 0 for the other materials so their behaviour is unchanged); the tests compare the colours at the vertices and rhombus centres of every seed with a separately written model; only a small patch and the tone is not a real colouring rule; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.5 m tile, 0.0007 UV relief (not metres), metallic 0; every sample walks the 323 edges and the 149 rhombi and the time was not measured. Current catalog: 996 kinds, 997 gallery choices including plain.

- `dodecagridtiling`: Dodecagrid tiling — thin pale violet lines on dark blue-violet-black drawing a patch of an aperiodic tiling with approximate twelve-fold symmetry (de Bruijn's multigrid construction with six grids and twelfth roots of unity; 151 tiles of three kinds: 41 rhombi of 30°, 70 rhombi of 60° and 40 squares; 330 edges, 180 vertices, Euler characteristic 1), with the seed turning the patch by a multiple of 30°; it shares the sampler branch of penrosetiling, penrosestar, ammannbeenker and heptagridtiling; the tests confirm the structure with a separately written program and compare every seed; only a small patch; an authored schematic with no specific source cited and no photograph compared, and not claimed to be any particular twelve-fold tiling from the literature. Defaults: 0.5 m tile, 0.0007 UV relief (not metres), metallic 0; every sample walks the 330 edges and the time was not measured. Current catalog: 995 kinds, 996 gallery choices including plain.

- `heptagridtiling`: Heptagrid tiling — thin rose lines on dark purple-red-black drawing a patch of an aperiodic rhombus tiling with approximate seven-fold symmetry (de Bruijn's multigrid construction with seven grids and seventh roots of unity; 154 rhombi of three kinds: 27/58/69; 335 edges, 182 vertices, Euler characteristic 1), with the seed turning the patch by a multiple of 360°/14; it shares the sampler branch of penrosetiling, penrosestar and ammannbeenker; the tests confirm the structure with a separately written program and compare every seed; only a small patch; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.5 m tile, 0.0007 UV relief (not metres), metallic 0; every sample walks the 335 edges and the time was not measured. Current catalog: 994 kinds, 995 gallery choices including plain.

- `ammannbeenker`: Ammann–Beenker tiling — thin mint lines on dark green-black drawing a patch of the eight-fold aperiodic tiling (de Bruijn's multigrid construction with four grids and eighth roots of unity; 148 tiles: 62 squares and 86 rhombi; 322 edges, 175 vertices, Euler characteristic 1), with the seed turning the patch by a multiple of 45°; it shares the sampler branch of penrosetiling and penrosestar (a new `roots` field, their behaviour unchanged); the tests confirm the structure with a separately written program and compare every seed; only a small patch; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.5 m tile, 0.0007 UV relief (not metres), metallic 0; every sample walks the 322 edges and the time was not measured. Current catalog: 993 kinds, 994 gallery choices including plain.

- `penrosestar`: Penrose star — thin peach lines on dark purple-black drawing a nearly five-fold symmetric patch of the Penrose rhombus tiling (pentagrid offsets near zero, `(0.011, −0.006, 0.004, −0.013, 0.004)`; 160 rhombi: 95 fat and 65 thin; 345 edges, 186 vertices; 75% of the edges coincide with another edge after a 72° turn, against 22% for the generic-offset penrosetiling), with the seed turning the patch by a multiple of 36°; it shares the sampler branch of penrosetiling; the tests confirm the structure with a separately written program and compare every seed; only a small patch and not exactly five-fold symmetric; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.5 m tile, 0.0007 UV relief (not metres), metallic 0; every sample walks the 345 edges and the time was not measured. Current catalog: 992 kinds, 993 gallery choices including plain.

- `penrosetiling`: Penrose tiling — thin pale blue lines on dark navy-black drawing a patch of the Penrose aperiodic rhombus tiling (de Bruijn's pentagrid construction; 149 rhombi: 95 fat and 54 thin; 323 edges, 175 vertices, Euler characteristic 1), with the seed turning the patch by a multiple of 36°; the tests confirm the structure with a separately rewritten pentagrid program and compare every seed; only a small patch, not an infinite tiling; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.5 m tile, 0.0007 UV relief (not metres), metallic 0; every sample walks the 323 edges and the time was not measured. Current catalog: 991 kinds, 992 gallery choices including plain.

- `kagome`: Kagome — thin pale straw lines on dark olive green forming the kagome lattice (joining the midpoints of the six edges of every honeycomb hexagon gives three families of straight lines and a lattice of hexagons and triangles; 7 columns × 8 rows, 336 segments), with the seed shifting it in steps of 1/64 of the tile; it shares the honeycomb-segment sampler branch of tulle and kikko (new `outer` and `innerDegrees` fields, their behaviour unchanged); the samples of all four seeds match an independently rewritten model in the tests; an authored schematic with no specific source cited and no photograph compared, and without over-and-under weaving. Defaults: 0.3 m tile, 0.0009 UV relief (not metres), metallic 0; every sample walks the 336 segments and the time was not measured. Current catalog: 990 kinds, 991 gallery choices including plain.

- `kikko`: Kikko — a tortoiseshell hexagonal honeycomb of thin amber lines on dark brown (each hexagon holds a concentric smaller hexagon of half the radius; 7 columns × 8 rows, 56 hexagons, 504 segments), with the seed shifting it in steps of 1/64 of the tile; it shares the honeycomb-segment sampler branch of tulle (a new `inner` field, 0 for tulle so its behaviour is unchanged); the samples of all four seeds match an independently rewritten model in the tests; an authored schematic with no specific source cited and no photograph compared, with only concentric hexagon lines. Defaults: 0.3 m tile, 0.0009 UV relief (not metres), metallic 0; every sample walks the 504 segments and the time was not measured. Current catalog: 989 kinds, 990 gallery choices including plain.

- `vermiculation`: Vermiculation — pale tan stone cut by curving, branching, separate dark worm-like grooves (about 20 to 30 of them covering about 35% of the area), from periodic Gray-Scott reaction-diffusion at `feed 0.078` and `kill 0.061` with the seed changing the initial perturbation; it shares the turingmaze sampler branch (a new `baseHeight` field, 0 for turingmaze so its behaviour is unchanged); an authored schematic with no specific source cited and no photograph compared. Defaults: 0.4 m tile, 0.0015 UV relief (not metres), metallic 0. Current catalog: 988 kinds, 989 gallery choices including plain.

- `minkowskisausage`: Minkowski sausage — a thin pale blue line on dark navy-black tracing the order-2 quadratic Koch island (a simple closed loop of 256 steps and 256 distinct lattice points, 768 lit nodes, a third-cell line width), with the seed shifting it around the torus; it shares the trace sampler branch of dragoncurve, peanocurve and levycurve; it matches a curve written independently by block recursion node by node in the tests; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.25 m tile, 0.0008 UV relief (not metres), metallic 0. Current catalog: 987 kinds, 988 gallery choices including plain.

- `pisanotable`: Pisano table — 48×48 rounded-square tiles where the tile for n (1 to 2304) is toned by the Pisano period of the Fibonacci numbers modulo n relative to its bound 6n (only n = 10, 50, 250 and 1250 reach the bound and are brightest), with the seed moving the whole table around the torus; the tiles match a period table written independently in the tests by generating the pair sequence tile by tile; an authored schematic with no specific source cited and no photograph compared, and the preview looks like noise. Defaults: 0.3 m tile, 0.0008 UV relief (not metres), metallic 0; the build time was not measured. Current catalog: 986 kinds, 987 gallery choices including plain.

- `mobiustable`: Möbius table — 48×48 rounded-square tiles where the tile for n (1 to 2304) is toned in three classes by μ(n): μ = 0 (a square divides n, 904) dark, μ = +1 (699) bright violet and μ = −1 (701) grey-violet, with multiples of 4 forming dark vertical bars and the seed moving the whole table around the torus; the tiles match a table computed independently by full prime factorisation in the tests tile by tile; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.3 m tile, 0.0008 UV relief (not metres), metallic 0. Current catalog: 985 kinds, 986 gallery choices including plain.

- `abundantnumbers`: Abundant numbers — 48×48 rounded-square tiles where the tile for n (1 to 2304) is toned in three classes by comparing σ(n) with 2n: deficient numbers (1,732) dim, abundant numbers (569) brighter and perfect numbers (6, 28, 496) brightest, with multiples of 12 and 6 forming bright vertical bars and the seed moving the whole table around the torus; the tiles match a classification table computed independently by trial division in the tests tile by tile; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.3 m tile, 0.0008 UV relief (not metres), metallic 0. Current catalog: 984 kinds, 985 gallery choices including plain.

- `xortable`: XOR table — 64×64 rounded-square tiles whose tone is proportional to row XOR col (the main diagonal darkest, brighter lime as the value grows, forming nested Sierpinski-like blocks, the XOR texture), with the seed moving the table around the torus; the tiles match a table written independently in the tests tile by tile; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.3 m tile, 0.0008 UV relief (not metres), metallic 0. Current catalog: 983 kinds, 984 gallery choices including plain.

- `paleytable`: Paley table — 61×61 rounded-square tiles where tile (row, col) is the Legendre symbol of col − row modulo the prime 61 (diagonal middle tone, quadratic residues bright rose pink, non-residues dark plum); the table depends only on col − row so it shows diagonal bands, and the seed moves it around the torus; the tiles match a table written independently in the tests tile by tile; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.3 m tile, 0.0008 UV relief (not metres), metallic 0. Current catalog: 982 kinds, 983 gallery choices including plain.

- `hadamardmatrix`: Hadamard matrix — 64×64 rounded-square tiles where tile (row, col) is the matching entry of the Sylvester Hadamard matrix (+1 bright cool white when the number of 1 bits in row AND col is even, −1 dark blue-grey when odd), with the seed moving the whole table around the torus; the tiles match a matrix written independently in the tests tile by tile; an authored schematic with no specific source cited and no photograph compared, and the nested block structure is not recognisable by eye in the preview. Defaults: 0.3 m tile, 0.0008 UV relief (not metres), metallic 0. Current catalog: 981 kinds, 982 gallery choices including plain.

- `levycurve`: Lévy curve — a thin mint-green line on dark teal-black tracing the order-9 Lévy C curve (512 steps, 416 distinct lattice points, 462 distinct edges, 1,340 lit nodes, a third-cell line width), with the seed shifting it around the torus; it shares the trace sampler branch of dragoncurve and peanocurve; it matches a curve written independently with bit counting node by node in the tests; an authored schematic with no specific source cited and no photograph compared, and the curve is not closed. Defaults: 0.25 m tile, 0.0008 UV relief (not metres), metallic 0. Current catalog: 980 kinds, 981 gallery choices including plain.

- `tulle`: Tulle — a hexagonal honeycomb net of fine ivory threads on dark purple-black (7 columns × 8 rows, 56 hexagons, 168 segments, brighter knots), with horizontal and vertical periods in the ratio 7√3 : 12 (hexagons stretched by about 1.04%) and the seed shifting it in steps of 1/64 of the tile; the samples of all four seeds match an independently rewritten honeycomb model in the tests; an authored schematic with no specific source cited and no photograph compared, and it is not translucent. Defaults: 0.3 m tile, 0.0012 UV relief (not metres), metallic 0; every sample walks the 168 segments and the time was not measured. Current catalog: 979 kinds, 980 gallery choices including plain.

- `sacksspiral`: Sacks spiral — on dark navy-black the integers 1 to 500 laid out on a Sacks spiral (radius proportional to √n, angle 2π√n), primes (95) as bright gold dots and composites as dim gold-brown dots, with the seed turning the whole spiral by a whole number of degrees; the colours at the dot centres match an independently rewritten model in the tests for every seed; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.4 m tile, 0.002 UV relief (not metres), metallic 0; every sample walks the 500 integers and the time was not measured. Current catalog: 978 kinds, 979 gallery choices including plain.

- `peanocurve`: Peano curve — a thin pink line on dark navy-black tracing the order-3 Peano space-filling curve (each of 27×27 cells once, 728 steps, 2,185 lit nodes, a third-cell line width), winding from one corner to the opposite one with the seed shifting it around the torus; it shares the trace sampler branch of dragoncurve; it matches a curve built independently by block recursion node by node in the tests; an authored schematic with no specific source cited and no photograph compared, and the curve is not closed. Defaults: 0.25 m tile, 0.0008 UV relief (not metres), metallic 0. Current catalog: 977 kinds, 978 gallery choices including plain.

- `divisorcount`: Divisor count — 48×48 rounded-square tiles where the tile for n (1 to 2304) is toned by the number of divisors of n: primes (342) dim, highly composite numbers bright (the largest is 40 at n = 1680), multiples of 12 forming bright vertical bars, and the seed moving the whole table around the torus; the tiles match a divisor-count table computed independently by trial division in the tests tile by tile; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.3 m tile, 0.0008 UV relief (not metres), metallic 0. Current catalog: 976 kinds, 977 gallery choices including plain.

- `dragoncurve`: Dragon curve — a thin golden line on dark purple-black tracing the order-9 Heighway dragon (512 steps, 361 distinct lattice points, 1,385 lit nodes, a third-cell line width), with the seed shifting it around the torus; it matches an independently rewritten paper-folding sequence node by node in the tests; an authored schematic with no specific source cited and no photograph compared, and the curve is not closed. Defaults: 0.25 m tile, 0.0008 UV relief (not metres), metallic 0. Current catalog: 975 kinds, 976 gallery choices including plain.

- `juliatiles`: Julia tiles — a mosaic of the Julia set for c = −0.8 + 0.156i from 64×64 rounded-square tiles toned by the escape iteration count at each cell centre (at most 64, square-rooted), with the cells that never escape (404) the darkest and the seed moving the whole table around the torus; it shares the sampler branch of mandelbrottiles; the tiles match independently rewritten escape times in the tests; an authored schematic with no specific source cited and no photograph compared, in pixel-art style. Defaults: 0.3 m tile, 0.0008 UV relief (not metres), metallic 0. Current catalog: 974 kinds, 975 gallery choices including plain.

- `mandelbrottiles`: Mandelbrot tiles — a mosaic of the Mandelbrot set from 64×64 rounded-square tiles toned by the escape iteration count at each cell centre (at most 48, square-rooted), with the cells that never escape (726) the darkest and the seed moving the whole table around the torus; the tiles match independently rewritten escape times in the tests; an authored schematic with no specific source cited and no photograph compared, pixel-art and not continuous across the torus seam. Defaults: 0.3 m tile, 0.0008 UV relief (not metres), metallic 0. Current catalog: 973 kinds, 974 gallery choices including plain.

- `rhodoneatable`: rose-curve table — pink-neon style, 6×6 cells each drawing the rose `r = cos(k·θ)` with `k = (col + 1)/(row + 1)`, with the seed changing only the overall rotation angle; the tests scan the rotation to verify that every rose point lands on a bright pixel; an authored schematic with no specific source cited and no photograph compared, not a real neon tube. Defaults: 0.3 m tile, 0.0008 UV relief (not metres), metallic 0; each sample measures its cell's 192 segments, so a 512² sampling takes about 0.24 s. Current catalog: 972 kinds, 973 gallery choices including plain.

- `lissajoustable`: Lissajous table — oscilloscope-style green phosphor curves, 6×6 cells each drawing the Lissajous curve of frequency ratio (col + 1):(row + 1), with the seed changing only the common phase; the tests scan the phase to verify that every curve point lands on a bright pixel; an authored schematic with no specific source cited and no photograph compared, not a real oscilloscope screen. Defaults: 0.3 m tile, 0.0008 UV relief (not metres), metallic 0; each sample measures its cell's 128 segments, so a 512² sampling takes about 0.2 s. Current catalog: 971 kinds, 972 gallery choices including plain.

- `primesieve`: sieve of Eratosthenes — 32×32 rounded-square tiles standing for 1 to 1024, with the primes (172) bright gold, composites a low-contrast olive by smallest prime factor and 1 the dimmest, the seed moving the whole table around the torus; the tiles match smallest prime factors rewritten independently by trial division in the tests; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.3 m tile, 0.0012 UV relief (not metres), metallic 0. Current catalog: 970 kinds, 971 gallery choices including plain.

- `gcdtable`: greatest-common-divisor table — 32×32 rounded-square tiles standing for `gcd(col + 1 + a, row + 1 + b)` (the seed picks the offsets a and b), toned `1 − 1/gcd` (coprime cells dark, larger common divisors brighter, lighting up along lines and diagonals); the tiles match an independently rewritten gcd in the tests; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.3 m tile, 0.0012 UV relief (not metres), metallic 0. Current catalog: 969 kinds, 970 gallery choices including plain.

- `collatzsteps`: Collatz stopping times — 32×32 rounded-square tiles standing for 1 to 1024, each toned by the number of Collatz steps to reach 1 divided by 178 (dark purple to warm orange), with the seed moving the whole table around the torus; the tiles match independently rewritten step counts in the tests; an authored schematic with no specific source cited and no photograph compared, looking like noise with streaks. Defaults: 0.3 m tile, 0.0012 UV relief (not metres), metallic 0. Current catalog: 968 kinds, 969 gallery choices including plain.

- `pascalmod3`: Pascal's triangle mod 3 — a 48×48 grid of teal rounded-square tiles whose lower-left triangle holds the residues of Pascal's triangle mod 3 (0/1/2 as dark/mid/bright tiles forming nested triangles) with empty dark cells beyond the diagonal, the seed moving the whole table around the torus; the tiles match an independently rewritten triangle in the tests; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.3 m tile, 0.0012 UV relief (not metres), metallic 0. Current catalog: 967 kinds, 968 gallery choices including plain.

- `modulartable`: modular multiplication table — 31×31 rounded-square tiles whose tone is the mod-11 residue `((a + col)·(b + row)) mod 11` (the seed picks the offsets), the tiles raised with darker AO gaps, and whole rows and columns of residue 0 turning into dark bands; the tones match an independently rewritten multiplication table tile by tile in the tests; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.3 m tile, 0.0012 UV relief (not metres), metallic 0. Current catalog: 966 kinds, 967 gallery choices including plain.

- `elementaryautomata`: elementary cellular automata — four Wolfram bands side by side on an amber LED matrix: rules 30, 90 and 110 (single live-cell start) and 184 (repeating-pattern start), each 32 rows by 128 columns, where the seed only rotates the columns; the board matches an independently rewritten automaton node by node in the tests; an authored schematic with no specific source cited and no photograph compared, with the triangles filling only the centre of each band. Defaults: 0.3 m tile, 0.001 UV relief (not metres), metallic 0. Current catalog: 965 kinds, 966 gallery choices including plain.

- `gameoflife`: Game of Life — a Conway soup on a dark LED matrix, a 64×64 torus started at 38% random density and evolved for 250 generations (blocks, beehives, blinkers and gliders), a static snapshot that has not fully settled; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.2 m tile, 0.001 UV relief (not metres), metallic 0; the simulation runs once while the sampler is built, about 30 ms. Current catalog: 964 kinds, 965 gallery choices including plain.

- `hilbertcurve`: Hilbert curve — one cyan order-4 Hilbert space-filling curve traced like a circuit on a dark navy ground (each of the 16×16 cells visited once, closed into a loop across the tile seam), where the seed picks a square symmetry and shifts the curve; an authored schematic with no specific source cited and no photograph compared, and not a real circuit board. Defaults: 0.2 m tile, 0.0015 UV relief (not metres), metallic 0. Current catalog: 963 kinds, 964 gallery choices including plain.

- `quasicrystal`: quasicrystal-style interference — five plane waves with integer wave vectors at nearly 72° steps interfere into a blue-and-white, apparently five-fold symmetric pattern (pentagon rings and dots); the tile is exactly periodic, so it is an approximation and not a true quasicrystal or Penrose tiling; the seed changes only the phases; an authored schematic with no quasicrystal literature cited and no photograph compared. Defaults: 0.3 m tile, 0.0015 UV relief (not metres), metallic 0. Current catalog: 962 kinds, 963 gallery choices including plain.

- `sudoku`: Sudoku — a newspaper puzzle grid of 9×9 cells (thin rules, two-pixel box rules) with about two fifths of the cells holding a seeded 3×5-pixel digit; the digits are placed at random, so it is not a legal or solvable Sudoku; an authored schematic with no specific puzzle cited and no photograph compared, with bold, slightly blurry digits. Defaults: 0.2 m tile, 0.0008 UV relief (not metres), metallic 0. Current catalog: 961 kinds, 962 gallery choices including plain.

- `datamatrix`: Data Matrix 2D barcodes — 2×2 black square codes of 18×18 modules on a cream-white label (a solid L finder on the left and bottom, an alternating clock track on the top and right, a seeded random interior, and quiet zones between symbols); the data is random, not a valid encoding and not scannable; an authored schematic with no photograph comparison or scan check. Defaults: 0.12 m tile, 0.0008 UV relief (not metres), metallic 0. Current catalog: 960 kinds, 961 gallery choices including plain.

- `couscous`: couscous — tiny pale beige round granules (a 26×26 grid, slightly rotated and varying in size) packed densely and overlapping, with a dark brown base with AO showing between them; it reuses the overlapping-piece sampler shared by granola, tilledsoil and sherpafleece; an authored schematic with no specific source cited and no photograph compared, with rounder and more uniform granules than the real thing. Defaults: 0.1 m tile, 0.0012 UV relief (not metres), metallic 0. Current catalog: 959 kinds, 960 gallery choices including plain.

- `morse`: Morse code — fourteen rows of seeded random dot-and-dash messages on a cream paper tape (dot 1 cell, dash 3, symbol gap 1, letter gap 3, word gap 7) in dark grey ink; the message is not decodable text; an authored schematic with no specific source cited and no photograph compared. Defaults: 0.3 m tile, 0.0012 UV relief (not metres), metallic 0. Current catalog: 958 kinds, 959 gallery choices including plain.

- `pizza`: pizza — red-brown pepperoni discs, appearing with 72% probability in a 5×5 grid with slight jitter and size variation, slightly raised and greasy at the centre, on pale yellow cheese with browned blisters and a faint sauce tone; an authored schematic with no specific source cited and no photograph compared, whose discs follow the grid so it reads more like a polka-dot pattern. Defaults: 0.25 m tile, 0.004 UV relief (not metres), metallic 0. Current catalog: 957 kinds, 958 gallery choices including plain.

- `invaders`: arcade invaders — pixel aliens on a green LED matrix (three rows repeated 3 times on a 42×33 LED grid) with unlit LEDs kept dark green; the designs are hand-drawn in a generic arcade style, not guaranteed to match any game, and there is no emission; the seed changes only the grain. An authored schematic with no specific source cited and no photograph compared. Defaults: 0.3 m tile, 0.001 UV relief (not metres), metallic 0. Current catalog: 956 kinds, 957 gallery choices including plain.

- `fairisle`: Fair Isle knitting — a Nordic sweater pattern of 40×30 V-shaped stitches in 15-row groups of solid bands, peerie-dot bands and a diamond motif with an open centre repeated every 8 stitches, in dark blue and pale grey; the seed changes only the fuzz and the motif is fixed; an authored schematic with no specific source cited and no photograph compared, with perfectly uniform yarn. Defaults: 0.3 m tile, 0.0015 UV relief (not metres), metallic 0. Current catalog: 955 kinds, 956 gallery choices including plain.

- `mackerel`: mackerel — broken, curving dark blue wavy bands on a blue-green fish back, stacked along v and distorted by slow noise; an authored schematic with no specific source cited and no photograph compared, which reads more like water ripples or tabby stripes than fish skin and has no silver belly or scales. Defaults: 0.3 m tile, 0.0008 UV relief (not metres), metallic 0. Current catalog: 954 kinds, 955 gallery choices including plain.

- `hestain`: H&E-stained tissue — dark purple oval nuclei, whose positions and shapes come from periodic Gray-Scott reaction-diffusion, on a pale pink-violet mottled fibrous cytoplasm; an authored schematic with no specific source cited and no photograph compared, with a lavender rather than eosin-pink cytoplasm and no cell membranes or tissue layers. Defaults: 0.05 m tile, 0.0008 UV relief (not metres), metallic 0; the first build for each seed costs about 0.2 s of simulation. Current catalog: 953 kinds, 954 gallery choices including plain.

- `petricolonies`: petri dish colonies — cream round colonies on amber agar whose positions and shapes come from the spot regime of periodic Gray-Scott reaction-diffusion, with a slightly darker thin rim and a slightly raised centre; an authored schematic with no specific source cited and no photograph compared, and without a dish border, mucoid gloss or concentric structure. Defaults: 0.12 m tile, 0.0015 UV relief (not metres), metallic 0; the first build for each seed costs about 0.2 s of simulation. Current catalog: 952 kinds, 953 gallery choices including plain.

- `turingmaze`: Turing maze — a dark ink labyrinth of stripes on white paper produced by periodic Gray-Scott reaction-diffusion in its labyrinth regime; an authored schematic that is not a fingerprint (the stripes are far coarser and have no whorls), with no specific source cited and no photograph compared. Defaults: 0.3 m tile, 0.0012 UV relief (not metres), metallic 0; the first build for each seed costs about 0.2 s of simulation. Current catalog: 951 kinds, 952 gallery choices including plain.

- `cheetahfur`: cheetah fur — black oval spots on short tawny fur whose positions and shapes come from a periodic Gray-Scott reaction-diffusion simulation (the first material in the engine that runs a simulation while its sampler is built, costing about 0.2 s extra for the first build of each seed); an authored schematic with no specific source cited and no photograph compared, and without the pale halo around spots or a coat gradient. Defaults: 0.25 m tile, 0.0015 UV relief (not metres), metallic 0. Current catalog: 950 kinds, 951 gallery choices including plain.

- `jade`: jade — a polished green surface with a mid-green cloudy ground and pale veins and hairline veins that follow noise iso-contours; an authored schematic with no specific source cited and no photograph compared, with more regular vein paths than real jade and no translucency. Defaults: 0.15 m tile, 0.0008 UV relief (not metres), metallic 0. Current catalog: 949 kinds, 950 gallery choices including plain.

- `spectrogram`: spectrogram — 12 horizontal yellow harmonic lines bent into waves by vibrato, 5 vertical burst bands and speckle on a deep blue ground, with a time-frequency energy field deciding where it shows; an authored schematic with no specific source, audio data or reference image, too regular and with a single-gradient colour scale. Defaults: 0.3 m tile, 0.002 UV relief (not metres), metallic 0. Current catalog: 948 kinds, 949 gallery choices including plain.

- `barchart`: bar chart paper — two charts per tile on pale blue-grey paper, each with 12 dark navy bars of random height, four pale-grey horizontal grid lines and a baseline; an authored schematic with no specific source cited and no photograph compared, with no ticks, numbers or title. Defaults: 0.25 m tile, 0.0012 UV relief (not metres), metallic 0. Current catalog: 947 kinds, 948 gallery choices including plain.

- `ecgpaper`: ECG paper — a pale pink fine grid with a heavier major line every 5 cells, and three recording strips each repeating six heartbeat traces (a simplified P-Q-R-S-T curve); an authored schematic with no specific source, standard or photograph cited, not for medical use, with short R waves and flat-topped T waves. Defaults: 0.3 m tile, 0.0012 UV relief (not metres), metallic 0. Current catalog: 946 kinds, 947 gallery choices including plain.

- `redalder`: red alder (Alnus rubra) longitudinal face: an even light yellowish-tan to slightly reddish ground, a fine uniform texture, two very faint darker bands, longitudinal fibres and very few fine dark short marks; no wide aggregate-ray streaks, knots or finish. Approximated from the actually read [Wood Database Red Alder](https://www.wood-database.com/red-alder/) and the viewed [wood-face photograph](https://www.wood-database.com/wp-content/uploads/alnus-rubra.jpg) as color/grain-form reference only. Reuses the existing vessel sampler; defaults: 0.18 m tile, 0.002 UV relief (not metres), metallic 0. Current catalog: 945 kinds, 946 gallery choices including plain.

- `sherpafleece`: sherpa fleece — many randomly rotated, edge-roughened cream lumps piled into fluffy curled tufts with occasional occluded light-brown creases; reuses the two-layer rotated-ellipse sampler of `granola`; an authored schematic with no specific source cited and no photograph compared, reading more like cream crumbs or popcorn than real fibres. Defaults: 0.15 m tile, 0.012 UV relief (not metres), metallic 0. Current catalog: 944 kinds, 945 gallery choices including plain.

- `tilledsoil`: tilled soil — randomly rotated, edge-roughened mid-brown clods and a few pale pebbles over a dark brown gap ground; reuses the two-layer rotated-ellipse sampler of `granola`; an authored schematic with no specific source cited and no photograph compared, which can also read as camouflage and is flatter than real soil. Defaults: 0.4 m tile, 0.012 UV relief (not metres), metallic 0. Current catalog: 943 kinds, 944 gallery choices including plain.

- `heatsinkfins`: heat sink fins — anodised extruded aluminium with 20 straight fins per tile, flat tops, deep occluded narrow gaps, fine extrusion lines and a faint mottle on the tops; fully metallic (metallic 1); an authored schematic with no specific source cited and no photograph compared, with no fin height, base plate or heat pipes. Defaults: 0.1 m tile, 0.01 UV relief (not metres). Current catalog: 942 kinds, 943 gallery choices including plain.

- `jerky`: beef jerky — a dark red-brown ground with dense fibres elongated along u, broad tone variation, varying sheen and scattered near-black cracked-pepper flecks; an authored schematic with no specific source cited and no photograph compared, which can also read as brushed dark wood and lacks a real jerky's shape. Defaults: 0.12 m tile, 0.004 UV relief (not metres), metallic 0. Current catalog: 941 kinds, 942 gallery choices including plain.

- `garlicskin`: garlic skin — about 11 pale purple lengthwise streaks (warped by noise and varying in width) on a cream-white papery ground with lengthwise fibres, soft wrinkles and fine grain; an authored schematic with no specific source cited and no photograph compared, looking more like striped paper than real garlic skin. Defaults: 0.1 m tile, 0.003 UV relief (not metres), metallic 0. Current catalog: 940 kinds, 941 gallery choices including plain.

- `pancake`: pancake — a golden ground with lace-edged low-frequency browned patches (their area varies a lot by seed) and scattered tiny pore dimples; an authored schematic with no specific source cited and no photograph compared, with blocky-looking patch edges and no gloss or thickness. Defaults: 0.25 m tile, 0.004 UV relief (not metres), metallic 0. Current catalog: 939 kinds, 940 gallery choices including plain.

- `kawung`: kawung batik — cream wax-resist ellipses on dark indigo cotton in a checkerboard (long axis along u in even cells and along v in odd ones, each with a centre dot); a simplified schematic with no specific source cited and no pattern book compared, with simpler geometry than real kawung and overly even lines. Defaults: 0.3 m tile, 0.004 UV relief (not metres), metallic 0. Current catalog: 938 kinds, 939 gallery choices including plain.

- `granola`: granola — two layers of randomly rotated, edge-roughened elliptical pieces (larger pale-cream oat flakes and smaller dark nut/fruit chunks) over a honey-brown ground, with the bare ground darkened by occlusion; an authored schematic with no specific source cited and no photograph compared, which can also read as camouflage and is flatter than real granola. Defaults: 0.2 m tile, 0.008 UV relief (not metres), metallic 0. Current catalog: 937 kinds, 938 gallery choices including plain.

- `raspberry`: raspberry — 16×18 slightly overlapping round red drupelets on a staggered lattice (each with its own tone, domed shading and highlight) separated by darker, occluded thin creases; an authored schematic with no specific source cited and no photograph compared, far more regular than a real raspberry, with no hairs, calyx or overall shape. Defaults: 0.08 m tile, 0.006 UV relief (not metres), metallic 0. Current catalog: 936 kinds, 937 gallery choices including plain.

- `salami`: salami — a mottled dark red cured-meat cut face scattered with cream elliptical fat flecks (varying in size, neighbours merging) and fine near-black peppercorns; an authored schematic with no specific source cited and no photograph compared, far more regular than a real sausage, with no casing, mould or muscle fibres. Defaults: 0.12 m tile, 0.002 UV relief (not metres), metallic 0. Current catalog: 935 kinds, 936 gallery choices including plain.

- `baconstrips`: bacon strips — about five wavy red lean bands (warped by a low-frequency noise field, with fibres along u) alternating with cream fat bands that are paler, slightly raised and smoother, with a slightly darker boundary; an authored schematic with no specific source cited and no photograph compared, smoother and more regular than real bacon, with no shrinkage, grease bubbles or rind. Defaults: 0.2 m tile, 0.003 UV relief (not metres), metallic 0. Current catalog: 934 kinds, 935 gallery choices including plain.

- `sweetcorn`: sweet corn — 14×14 rounded-square yellow kernels in neat rows (each with its own tone, tiny positional jitter and a domed highlight) separated by darker, occluded thin gaps; an authored schematic with no specific source cited and no photograph compared, far more regular than real corn, with no curved wrap, silk or husks. Defaults: 0.13 m tile, 0.006 UV relief (not metres), metallic 0. Current catalog: 933 kinds, 934 gallery choices including plain.

- `crosswordgrid`: crossword grid — a 15×15 grid on white paper with about a fifth black cells placed with 180-degree rotational symmetry, thin pale-grey grid lines, and a dot clue-number mark at the top-left of each word-start cell; an authored schematic with no specific source cited, not a real puzzle or solvable words and not guaranteed to follow every crossword layout rule. Defaults: 0.3 m tile, 0.0012 UV relief (not metres), metallic 0. Current catalog: 932 kinds, 933 gallery choices including plain.

- `windowpane`: windowpane check — a 3×3-per-tile grid of thin pale lines on a dark charcoal-blue twill flannel with a diagonal 2/2 twill ridge and per-thread noise; an authored schematic with no specific source cited, not a real fabric structure. Defaults: 0.3 m tile, 0.004 UV relief (not metres), metallic 0. Current catalog: 931 kinds, 932 gallery choices including plain.

- `merbau`: merbau (Intsia spp.) longitudinal face: a grey-tinged orange-brown ground, coarse texture, one very faint darker band, longitudinal fibres and densely scattered short fine dark vessel flecks; no yellow mineral deposits, interlocked grain, board-to-board variation or finish. Approximated from the actually read [Wood Database Merbau](https://www.wood-database.com/merbau/) and the viewed [wood-face photograph](https://www.wood-database.com/wp-content/uploads/merbau.jpg) as color/grain-form reference only. Reuses the existing vessel sampler; defaults: 0.18 m tile, 0.0025 UV relief (not metres), metallic 0. Current catalog: 930 kinds, 931 gallery choices including plain.

- `crosshatchengraving`: crosshatch engraving — thin black hatch lines on cream paper added by a low-frequency tone field (a diagonal family in dark areas, the opposite diagonal in darker ones, horizontal lines in the darkest, widening with tone); an authored schematic with no specific source cited, not a real burin path or image content. Defaults: 0.25 m tile, 0.0015 UV relief (not metres), metallic 0. Current catalog: 929 kinds, 930 gallery choices including plain.

- `sheetmusic`: sheet music — six staves of five continuous thin black lines (four bar lines per tile) on cream paper, each with 16 note slots, about 80% holding a quarter note of random pitch (head plus stem), with blank margins between staves; an authored schematic with no specific source cited, notes forming no melody, and no clefs, time signatures, accidentals or lyrics. Defaults: 0.25 m tile, 0.0012 UV relief (not metres), metallic 0. Current catalog: 928 kinds, 929 gallery choices including plain.

- `buffaloplaid`: buffalo plaid — red cloth with four wide horizontal and four wide vertical stripes (dark red where one crosses, nearly black where they overlap), a diagonal 2/2 twill ridge and per-thread noise; an authored schematic with no specific source cited, no real weave structure, stitching or frayed edges; the seed changes only the thread noise. Defaults: 0.25 m tile, 0.004 UV relief (not metres), metallic 0. Current catalog: 927 kinds, 928 gallery choices including plain.

- `jarrah`: jarrah (Eucalyptus marginata) longitudinal face: a brick-red brownish ground, medium to coarse texture, two very faint darker bands, longitudinal fibres and scattered short fine dark vessel flecks; no pale sapwood, gum streaks, curly/interlocked figure or finish. Approximated from the actually read [Wood Database Jarrah](https://www.wood-database.com/jarrah/) and the viewed [wood-face photograph](https://www.wood-database.com/wp-content/uploads/jarrah-s-400x400.jpg) as color/grain-form reference only. Reuses the existing vessel sampler; defaults: 0.18 m tile, 0.0025 UV relief (not metres), metallic 0. Current catalog: 926 kinds, 927 gallery choices including plain.

- `amberbubbles`: amber resin with bubbles — a smooth orange-yellow resin with three flow bands bent by integer-wavenumber sinusoids and trapped bubbles in about 45% of the 14×14 cells (random size and position, slightly domed, smoother, with bright rims and halos) plus a low-frequency haze; an authored schematic with no specific source cited, no translucency, refraction, inclusions or cracks. Defaults: 0.12 m tile, 0.004 UV relief (not metres), metallic 0. Current catalog: 925 kinds, 926 gallery choices including plain.

- `cauliflowercurd`: cauliflower curd — a cream-white floret surface of domed buds at three scales (10²/26²/64² cells; large florets carrying smaller buds and bumps), brighter bud crowns, grey-beige AO-occluded gaps and a rough finish (roughness 0.78); an authored schematic with no specific source cited, not a true fractal, with no stem, leaves, spots or browning. Defaults: 0.12 m tile, 0.016 UV relief (not metres), metallic 0. Current catalog: 924 kinds, 925 gallery choices including plain.

- `bubinga`: bubinga (Guibourtia spp.) longitudinal face: a pinkish red-brown ground, uniform fine texture, three faint darker stripes, longitudinal fibres and scattered fine dark vessel pits; no purple/black streaks, straw-colored sapwood, figures or finish. Approximated from the actually read [Wood Database Bubinga](https://www.wood-database.com/bubinga/) and the viewed [wood-face photograph](https://www.wood-database.com/wp-content/uploads/guibourtia-spp-300x600.jpg) as color/grain-form reference only. Reuses the existing vessel sampler; defaults: 0.18 m tile, 0.0025 UV relief (not metres), metallic 0. Current catalog: 923 kinds, 924 gallery choices including plain.

- `pomegranatearils`: pomegranate arils — a 20×20 grid of ruby-red round seed sacs of jittered position, size and tone packed densely and overlapping, each with a small up-left highlight, with very dark, rougher seams carrying AO; an authored schematic with no specific source cited, no translucency, juice, white membranes or peel. Defaults: 0.12 m tile, 0.01 UV relief (not metres), metallic 0. Current catalog: 922 kinds, 923 gallery choices including plain.

- `pumpkinskin`: pumpkin skin — orange skin with eight raised lengthwise ribs (gently bent), darker, rougher grooves with AO (about two fifths of the area), fine lengthwise streaks and small warts; an authored schematic with no specific source cited, no stem, segment curvature, pale patches or blemishes. Defaults: 0.4 m tile, 0.012 UV relief (not metres), metallic 0. Current catalog: 921 kinds, 922 gallery choices including plain.

- `citruspeel`: citrus peel — bright orange skin on a 48×48 grid where about nine in ten cells hold a jittered oil-gland dimple (about two fifths of the area lies in dimples, darker, lower, rougher and with AO), soft mottling and fine grain; an authored schematic with no specific source cited, no segment lines, stem scar, white pith or blemishes. Defaults: 0.12 m tile, 0.006 UV relief (not metres), metallic 0. Current catalog: 920 kinds, 921 gallery choices including plain.

- `coirdoormat`: a coir doormat — coarse stiff fibres from dark brown to tan lying in 5×5 low-frequency patches of four directions (horizontal, vertical and two diagonals, handing over smoothly), rough with gap shadowing and fine fuzz; an authored schematic with no specific source cited, no single-fibre geometry, woven backing, rubber border or lettering. Defaults: 0.3 m tile, 0.006 UV relief (not metres), metallic 0. Current catalog: 919 kinds, 920 gallery choices including plain.

- `europeanyew`: European yew (Taxus baccata) flatsawn heartwood: an orange-brown ground, fine uniform texture, 16 dense undulating arched darker brown growth rings and fine longitudinal fibres; no pale yellow-tan sapwood band, purplish hue, knots, burls or finish. Approximated from the actually read [Wood Database European Yew](https://www.wood-database.com/european-yew/) and the viewed [wood-face photograph](https://www.wood-database.com/wp-content/uploads/taxus-baccata-300x600.jpg) as color/grain-form reference only. Reuses the `douglasfir` ring sampler; defaults: 0.18 m tile, 0.0025 UV relief (not metres), metallic 0. Current catalog: 918 kinds, 919 gallery choices including plain.

- `raindropripples`: raindrop ripples — on a smooth dark grey-blue water surface, 8×8 position-jittered raindrops each spread concentric ripple rings (random amplitude and phase) that superpose into interference patterns; an authored schematic with no specific source cited, no dispersion or decay law, time evolution, splashes or shore reflection. Defaults: 0.4 m tile, 0.0022 UV relief (not metres), metallic 0. Current catalog: 917 kinds, 918 gallery choices including plain.

- `gamedice`: game dice — a tray of 6×6 ivory rounded-square dice with round black pips pressed into the faces (standard 1–6 layouts, rolled by seed) separated by a darker, rougher tray with AO; an authored schematic with no specific source cited, no three-face 3D dice, tilted or stacked dice, paint thickness or wear. Defaults: 0.3 m tile, 0.012 UV relief (not metres), metallic 0. Current catalog: 916 kinds, 917 gallery choices including plain.

- `europeanolive`: European olive wood (Olea europaea) flatsawn face: a pale yellow-tan ground, fine uniform texture, six thin undulating arched darker yellow-brown growth streaks and fine longitudinal fibres; no deep brown to near-black streaks and veins, wild grain, burl, sapwood/heartwood boundary or finish. Approximated from the actually read [Wood Database Olive](https://www.wood-database.com/olive/) and the viewed [wood-face photograph](https://www.wood-database.com/wp-content/uploads/olea-europaea-300x600.jpg) as color/grain-form reference only. Reuses the `douglasfir` ring sampler; defaults: 0.18 m tile, 0.002 UV relief (not metres), metallic 0. Current catalog: 915 kinds, 916 gallery choices including plain.

- `poolcaustics`: pool caustics — a bright branching light network built from three bent line families over a blue pool floor with dark deep-blue meshes (about a third of the area bright), slightly lower roughness in the light and faint floor grain; an authored visual approximation, not a physical caustics model, with no specific source cited, no time evolution, refracted-ray tracing, tile joints or water-surface reflection. Defaults: 0.5 m tile, 0.002 UV relief (not metres), metallic 0. Current catalog: 914 kinds, 915 gallery choices including plain.

- `metalflakepaint`: metal-flake paint — random round metal flakes of random position, tilt and brightness (a 64×64 grid, about half the cells holding one) over a deep blue clear-coated base, covering about 21–22% of the area; the flakes are pale lavender-silver, form a partial metal mask in the metallic channel (at most about 0.68) and make the normals sparkle; an authored schematic with no specific source cited, no pearlescent color shift, polygonal flakes or clear-coat thickness. Defaults: 0.1 m tile, 0.003 UV relief (not metres), metallic factor 1 controlled by the per-pixel channel. Current catalog: 913 kinds, 914 gallery choices including plain.

- `tapemeasure`: a tape measure — one tile is a 100 mm segment of yellow tape: 100 millimetre ticks, a longer tick every 5 mm and the longest, thicker tick every 10 mm, near-black on a yellow coat, with a concave cosine-bow cross-section raised at the rims; an authored schematic with no specific source cited, no numerals, imperial scale, end hook, case or wear. Defaults: 0.1 m tile, 0.03 UV relief (not metres), metallic 0. Current catalog: 912 kinds, 913 gallery choices including plain.

- `ledmatrix`: an LED dot-matrix panel — a 48×48 grid of round LEDs in 8×6 character cells of 5×7, each cell lighting 2–4 random pseudo-strokes by seed (not a font); lit LEDs bright red-orange, unlit dark red, smooth slightly domed lenses and a rougher black plate with AO; an authored schematic with no specific source cited, no emission, scrolling, color mixing or RGB sub-pixels. Defaults: 0.16 m tile, 0.004 UV relief (not metres), metallic 0. Current catalog: 911 kinds, 912 gallery choices including plain.

- `barcodelabel`: a barcode label — one tile is a full label width (10-module quiet zones, a Code 128 Start B pattern, nine seed-drawn 11-module data symbols, a 13-module stop pattern) of near-black toner bars on bright rough paper with blank margins above and below; **not decodable** (no check symbol, no parity rule, no human-readable text). Structure follows [Wikipedia “Code 128”](https://en.wikipedia.org/wiki/Code_128); the start/stop bit patterns are not verified by that page. Defaults: 0.14 m tile, 0.0006 UV relief (not metres), metallic 0. Current catalog: 910 kinds, 911 gallery choices including plain.

- `topographicmap`: topographic contour paper — constant-width brown contour lines on warm off-white paper over a terrain of seven integer-wavenumber sinusoids (16 levels, every fifth an index contour that is heavier and darker), a very faint elevation tint and paper-fibre grain; an authored schematic with no specific source cited, no real terrain, elevation labels, rivers, roads or legend. Defaults: 0.3 m tile, 0.0015 UV relief (not metres), metallic 0. Current catalog: 909 kinds, 910 gallery choices including plain.

- `eastindianrosewood`: East Indian rosewood (Dalbergia latifolia) longitudinal face: a deep purplish-brown ground, five darker near-black undulating streaks, longitudinal fibres and scattered short open-vessel pits; no golden-brown pale face, pale sapwood, polish or interlocked figure. Approximated from the actually read [Wood Database East Indian Rosewood](https://www.wood-database.com/east-indian-rosewood/) and the viewed [wood-face photograph](https://www.wood-database.com/wp-content/uploads/dalbergia-latifolia-1-300x600.jpg) as color/grain-form reference only. Reuses the existing vessel sampler; defaults: 0.18 m tile, 0.0025 UV relief (not metres), metallic 0. Current catalog: 908 kinds, 909 gallery choices including plain.

- `lenticularsheet`: a lenticular print sheet — 32 parallel cylindrical lenses per tile, bright smooth crests and low rougher seams with AO, a blue-silver base made of a diagonal flip stripe plus an 8×8 low-frequency image; an authored schematic with no specific source cited, no real interlaced multi-frame image, view-dependent animation or refraction. Defaults: 0.1 m tile, 0.008 UV relief (not metres), metallic 0. Current catalog: 907 kinds, 908 gallery choices including plain.

- `europeanlarch`: European larch (Larix decidua) flatsawn face: a pale pink-brown / pale yellow-tan earlywood ground, 12 flowing arched reddish-brown latewood ring lines (about a quarter of the area) and fine longitudinal fibres; no resin pockets, knots, sapwood/heartwood boundary, spiral grain or finish. Approximated from the actually read [Wood Database European Larch](https://www.wood-database.com/european-larch/) and the viewed [flatsawn photograph](https://www.wood-database.com/wp-content/uploads/european-larch-s-400x400.jpg) as color/grain-form reference only. Reuses the `douglasfir` ring sampler; defaults: 0.2 m tile, 0.003 UV relief (not metres), metallic 0. Current catalog: 906 kinds, 907 gallery choices including plain.

- `shagbarkhickory`: shagbark hickory (Carya ovata) longitudinal face: a pale yellow-brown / light tan ground, medium texture, three warmer light-brown undulating stripes, longitudinal fibre streaks and scattered short open-vessel pits; no dark red-brown heartwood dominance, ring-porous earlywood vessel row, interlocked/wavy figure or finish. Approximated from the actually read [Wood Database Shagbark Hickory](https://www.wood-database.com/shagbark-hickory/) and the viewed [wood-face photograph](https://www.wood-database.com/wp-content/uploads/shagbark-hickory-400x400.jpg) as color/grain-form reference only. Reuses the existing vessel sampler; defaults: 0.18 m tile, 0.002 UV relief (not metres), metallic 0. Current catalog: 905 kinds, 906 gallery choices including plain.

- `monitorlizardskin`: monitor-lizard-style granular scaly skin — a 14-column × 16-row hex-packed grid of round raised scales (odd rows shifted by half a column), each with its own tone, brighter and smoother, separated by narrow deep dark grooves (AO 0.4), with four transverse light/dark bands, in olive brown; an authored schematic with no specific species or source cited, no ventral scutes, crest or folds. Defaults: 0.14 m tile, 0.01 UV relief (not metres), metallic 0. Current catalog: 904 kinds, 905 gallery choices including plain.

- `sitkaspruce`: Sitka spruce (Picea sitchensis) longitudinal face: a cream-white to pale-yellow ground with very fine nearly straight extremely low-contrast ring lines and fine fibre grain; no bearclaw figure, pink tint, resin canals, knots or finish. Approximated from the actually read [Wood Database Sitka Spruce](https://www.wood-database.com/sitka-spruce/) and the viewed [wood-face photograph](https://www.wood-database.com/wp-content/uploads/sitka-spruce-400x400.jpg) as color/ring-line reference only. Reuses the `douglasfir` ring sampler; defaults: 0.12 m tile, 0.002 UV relief (not metres), metallic 0. Current catalog: 903 kinds, 904 gallery choices including plain.

- `honduranmahogany`: Honduran mahogany (Swietenia macrophylla) longitudinal face: a fairly dark reddish brown, medium uniform texture, seven broad nearly straight low-contrast satin-like stripes and very sparse short open-vessel pits; no pale freshly cut tone, aged darkening, interlocked/wavy grain, nested ring figure, chatoyancy or finish. Approximated from the actually read [Wood Database Honduran Mahogany](https://www.wood-database.com/honduran-mahogany/) and the viewed [wood-face photograph](https://www.wood-database.com/wp-content/uploads/swietenia-macrophylla-alt.jpg) as color/grain-form reference only. Reuses the existing vessel sampler; defaults: 0.18 m tile, 0.0015 UV relief (not metres), metallic 0. Current catalog: 902 kinds, 903 gallery choices including plain.

- `woodenpalletdeck`: wooden pallet deck — four boards running along u in one tile, separated by narrow low dark gaps (about 9% wide, AO 0.2), each board with its own tone, undulating ring lines, longitudinal fibres and fine grain, and two dark slightly raised round nail heads per tile on its centre line; not a complete pallet (no stringers, board ends, cracks or knots), nail heads are dielectric. Concept from the actually read introduction of [Wikipedia “Pallet”](https://en.wikipedia.org/wiki/Pallet); sizes and colors are authored. Defaults: 0.4 m tile, 0.006 UV relief (not metres), metallic 0. Current catalog: 901 kinds, 902 gallery choices including plain.

- `forgedcarbon`: forged-carbon-style composite — a 10×10-cell field of five rounded elongated chips per cell with random position, orientation, size, gray tone and stacking weight over a near-black resin background, with fine woven ripples along each chip's long axis and a glossy finish (roughness about 0.18–0.30); not a regular twill/plain weave (the existing `carbonfiber`), with no epoxy thickness or metallic sheen. An authored schematic with no specific process or source cited. Defaults: 0.2 m tile, 0.0012 UV relief (not metres), metallic 0. Current catalog: 900 kinds, 901 gallery choices including plain.

- `popcornceiling`: popcorn / acoustic spray ceiling — a 20×20-cell field of randomly offset round lumps of varying radius and height, softly merged as `1−Π(1−lump)` into a bumpy mass with shadowed low valleys between them (AO about 0.55), off-white with fine speckle grain; no water stains, peeling, scraped areas, fibres or seams. Concept from the actually read introduction of [Wikipedia “Popcorn ceiling”](https://en.wikipedia.org/wiki/Popcorn_ceiling); sizes and colors are authored, and it describes appearance only, not composition. Defaults: 0.25 m tile, 0.006 UV relief (not metres), metallic 0. Current catalog: 899 kinds, 900 gallery choices including plain.

- `kilimdiamonds`: kilim-style stepped-lozenge flat weave — 64×64 weft cells with a four-ring concentric stepped lozenge at the centre and each corner of every 16-cell block (dark brown / cream / taupe / cream, tone order swapped for corner lozenges), slight per-row tone variation, a horizontal weft ridge per cell and fine fibre grain. Concept from the actually read [Wikipedia “Kilim”](https://en.wikipedia.org/wiki/Kilim) (a flat tapestry-woven carpet); the motif and colors are authored, no specific design is cited; no fringe, border, pile or slit geometry. Defaults: 0.32 m tile, 0.003 UV relief (not metres), metallic 0. Current catalog: 898 kinds, 899 gallery choices including plain.

- `teak`: teak (Tectona grandis) longitudinal face with a golden-to-medium brown ground, straight uneven coarse texture, long undulating dark-brown streaks and scattered short open-vessel pits; no aged darkening, sapwood, wavy or interlocked figure, oily finish or pale vessel deposits. Approximated from the actually read [Wood Database Teak](https://www.wood-database.com/teak/) and the viewed [wood-face photograph](https://www.wood-database.com/wp-content/uploads/tectona-grandis.jpg) as color/grain-form reference only. Reuses the existing vessel sampler; defaults: 0.2 m tile, 0.003 UV relief (not metres), metallic 0. Current catalog: 897 kinds, 898 gallery choices including plain.

- `blackcherry`: American black cherry (Prunus serotina) longitudinal face: an even medium reddish brown with fine straight streaks, very low-contrast broad weak bands and very sparse short tiny dark vessel pits; no sapwood bands, curly figure, gum flecks or finish. Approximated from the actually read [Wood Database Black Cherry](https://www.wood-database.com/black-cherry/) and the viewed [wood-face photograph](https://www.wood-database.com/wp-content/uploads/prunus-serotina.jpg) as color/grain-form reference only. Reuses the existing vessel sampler; defaults: 0.18 m tile, 0.0015 UV relief (not metres), metallic 0. Current catalog: 896 kinds, 897 gallery choices including plain.

- `golfballdimples`: golf-ball-style dimples — a 7-column × 8-row hex-packed grid of round shallow spherical bowls (odd rows shifted by half a column) with lower, darker (AO 0.55), rougher centres and narrow smooth lands on pale glossy plastic. An authored planar schematic with no specific ball or source cited; no full-sphere curvature, seams or printing. Defaults: 0.028 m tile, 0.012 UV relief (not metres), metallic 0. Current catalog: 895 kinds, 896 gallery choices including plain.

- `laptopkeycaps`: chiclet laptop keycaps — an 8×8-cell grid of rounded-square (quartic superellipse) dark matte keys with slightly dished tops, edge highlights and narrow dark gaps (AO 0.25); each key has a slightly different tone and fine matte grain. An authored schematic with no specific product or source cited; no legends, backlight, switches or chassis. Defaults: 0.152 m tile, 0.004 UV relief (not metres), metallic 0. Current catalog: 894 kinds, 895 gallery choices including plain.

- `qrcodelabel`: printed QR-style label — 29×29 modules plus a four-module white quiet zone fill one tile, with three 7×7 finder patterns and separators, timing patterns on row/column 6, a 5×5 alignment pattern at the bottom right and seed-dependent pseudo-random data modules, dark ink on light paper with fibre grain. **Not a decodable QR code** (no message, format information, masking or error correction). Structural concept from the actually read [Wikipedia “QR code”](https://en.wikipedia.org/wiki/QR_code); sizes and colors are authored. Defaults: 0.05 m tile, 0.0006 UV relief (not metres), metallic 0. Current catalog: 893 kinds, 894 gallery choices including plain.

- `perforatedhardboard`: brown perforated tempered hardboard: a 16×16-cell square grid with one round dark opaque hole at each cell centre (about 5.1% of the area) and a slightly darker rounded rim over a continuous brown face with fine fibre grain and fleck patches; not transparent through-holes, no hooks or metal sheet. Concept from the actually read [Wikipedia “Perforated hardboard”](https://en.wikipedia.org/wiki/Pegboard); no physical photograph or specification is cited, so pitch, hole diameter and colors are authored. Defaults: 0.4 m tile, 0.004 UV relief (not metres), metallic 0. Current catalog: 892 kinds, 893 gallery choices including plain.

- `westernredcedar`: western red cedar (Thuja plicata) longitudinal face with a reddish golden-brown ground and fine parallel low-contrast dark growth-ring lines in gently undulating rings; no sapwood, random dark bands, knots or finish, and no resin canals. Approximated from the actually read [Wood Database Western Red Cedar](https://www.wood-database.com/western-red-cedar/) and the viewed [wood-face photograph](https://www.wood-database.com/wp-content/uploads/thuja-plicata.jpg) as color/ring-line reference only. Reuses the `douglasfir` ring sampler; defaults: 0.12 m tile, 0.003 UV relief (not metres), metallic 0. Current catalog: 891 kinds, 892 gallery choices including plain.

- `chesterfieldleather`: Chesterfield diamond-tufted brown leather: a small button at every other cell centre of a 6×6 tile (18 per tile), diagonal pleats around puffed diamond cushions, dark low-AO folds, lighter smoother crowns, fine leather grain and low-frequency creases. An authored schematic with no specific product or source cited; no metal button faces, stitching or cracks. Defaults: 0.5 m tile, 0.012 UV relief (not metres), metallic 0. Current catalog: 890 kinds, 891 gallery choices including plain.

- `longleafpine`: longleaf-pine longitudinal face with pale yellow-white earlywood and narrow high-contrast orange-brown latewood stripes in nearly parallel, gently undulating rings; no resin canals, knots, all-reddish-brown heartwood or finish. Approximated from the actually read [Wood Database Longleaf Pine](https://www.wood-database.com/longleaf-pine/) and the viewed [wood-face photograph](https://www.wood-database.com/wp-content/uploads/longleaf-pine.jpg) as color/stripe-shape reference only. Reuses the `douglasfir` ring sampler; defaults: 0.12 m tile, 0.003 UV relief (not metres), metallic 0. Current catalog: 889 kinds, 890 gallery choices including plain.

- `douglasfir`: flatsawn Douglas-fir longitudinal face with light orange-tan earlywood and darker orange-brown latewood rings forming pointed cathedral arches around concentric ovals; no knot, resin pocket, sapwood/heartwood boundary, finish or quartersawn parallel rings. Approximated from the actually read [Wood Database Douglas-Fir](https://www.wood-database.com/douglas-fir/) and the viewed [flatsawn specimen photograph](https://www.wood-database.com/wp-content/uploads/pseudotsuga-menziesii.jpg) as color/ring-shape reference only. A dedicated periodic C1 ring sampler; defaults: 0.2 m tile, 0.0035 UV relief (not metres), metallic 0. Current catalog: 888 kinds, 889 gallery choices including plain.

- `blackwalnut`: dark chocolate-brown black walnut flatsawn longitudinal face with darker long streaks, straight to gently undulating grain and sparse short open-vessel pits; no purple/grey cast, sapwood, curl/burl/birdseye figure or finish, and no semi-ring-porous vessel-size gradient. Approximated from the actually read [Wood Database Black Walnut](https://www.wood-database.com/black-walnut/) and the viewed [flatsawn full-board scan](https://www.wood-database.com/wp-content/uploads/juglans-nigra-full.jpg) as color/grain-direction reference only. Defaults: 0.16 m tile, 0.0025 UV relief (not metres), metallic 0. Current catalog: 887 kinds, 888 gallery choices including plain.

- `to92packagefaces`: four rotated/jittered 2×2 TO-92 schematics: matte-black D-shaped bodies (straight sides, flat bottoms, upper elliptical domes) and three equally spaced parallel straight leads (broad shoulders/narrow tails), without tabs, holes or markings. Leads M1, body/backing M0, C1 blends; heights backing .02 < lead .44 < body .68. Dimension reference only: actually downloaded/viewed [onsemi 98ASB42022B, CASE29-11 Issue AM, 09 MAR 2007, PDF page 6 / drawing page 1](https://www.onsemi.com/pdf/datasheet/p2n2222a-d.pdf#page=6), not exact CAD or composition/electrical claims. Defaults: 0.08 m tile, 0.0042 UV relief (not metres), metallic1; explicit0 changes the factor, not the mask. Prefer 512; 32 is a coarse preview. Current catalog: 886 kinds, 887 gallery choices including plain.

- `rcafemalefaces`: RCA/Cinch female-face schematics — four broad round black washers, smaller round metal shoulders, still smaller six-flat front barrels, dark insulators and recessed socket annuli over opaque dark floors. No BNC bayonet lugs or large rear nuts on the front. Neutral gray omits real gold optics; shapes, relief and color are authored approximations, a connector-family variation, not electrical/audio/RF/fit/EMC/safety certification. The catalog then had 879 kinds.
- `rj45femalefaces`: RJ45-type 8P8C female-face schematics — four thin rectangular metal shields, matte-black insulating liners and low main wells, with narrower stepped latch extensions on one side and single rows of eight isolated long metal fingers opposite. No LEDs; neutral gray omits gold-plating optics, and the authored layout is not exact CAD or Ethernet/PoE/Cat/speed/electrical/EMC simulation or certification.
- `usbcfemalefaces`: USB-C female-face schematics — four rounded-flat metal mouths with recessed matte-dark wells, thin central insulating tongues and two rows of 12 metal pads per face (24 total), distinct from the existing four-contact rectangular sockets. Neutral-gray approximation, not gold-plating optics, cavity geometry, electrical/USB speed/PD simulation or safety certification.
- `iecc6inlets`: IEC C6 male inlet-face schematics — four flat black-PA6 flanges with shared cloverleaf wells, upper-single/lower-pair round metal tips and two countersunk mounts; tips stay below the flange without a C8 guard, not C5 female sockets, C14 blades or mains/safety simulation.
- `iecc8inlets`: IEC C8 male inlet-face schematics — four black-PA6 flanges with capsule guards and rounded-V waists around shared figure-eight wells; two round metal tips rise above each floor but remain below the guard, not C7 female holes, C14 blades or mains/safety simulation.
- `din5femalefaces`: standard five-pin DIN female-face schematics — four nonmetal black-PBT flanges with three mounts, raised circular mouths, keyed upper cutouts/lower webs and five centrally bulged elongated female mouths; opaque interior stand-ins, not mini-DIN, geometric holes or MIDI/electrical simulation.
- `xlrfemalefaces`: XLR female mating-face schematics — four rounded rectangular D-size metal flanges, two diagonal mounting holes, raised circular mouths, black inserts, top latches and open inner collars; upper-pair/lower-center recessed mouths have opaque stand-in floors, not male pins, geometric holes or audio/electrical simulation.
- `bncfemalefaces`: BNC female mating-face schematics — four low metal flanges, raised barrel rims, opposed paired studs and white dielectric annuli with simplified metal socket lips and opaque low floors; neutral-gray PBR, not male pins, geometric bores or RF simulation.
- `iecc14inlets`: IEC C14 male inlet-face schematics — four black keyed shrouds each enclose one upper and two lower solid metal blade tips, raised from low floors but below protective rims; not C13 female sockets, perforated rear tabs or mains simulation.
- `dsubsocketfaces`: DE-9 female mating-face schematics — four metal flanges, closed raised D-frames, black inserts and nine recessed sockets in five/four rows; not protruding gold pins, rear solder cups, transparent geometric holes or connectable circuitry.
- `topadjusttrimmers`: top-adjust trimmer-face schematics — four dielectric rectangular housings with small corner-offset round metal screws and single full-width straight blind slots; floors remain metal, not through-holes, large central fasteners or adjustable circuit simulation.
- `crownprobetips`: four-point crown probe-end schematics — nine round metal faces each have four rounded raised contacts, valleys and a lower metal cup; not cross-driver recesses, gears, castellated nuts, through-holes or spring/electrical simulation.
- `piezodiaphragms`: piezo diaphragm face schematics — four flat metal plates with ivory ceramic margins and single central metallic electrodes; not ceramic holes, speaker cones, lenses, split feedback electrodes or circuit/vibration/audio simulation.
- `castellatedboards`: PCB edge-half-hole faces — four dark-green dielectric boards each carry four banks of seven edge-open notches and pale metallic crescent lands; not closed round vias, QFN contacts, castellated nuts, geometric holes or PCB fabrication/electrical/thermal certification.
- `qfnlandpads`: QFN underside flat lands — four dark dielectric packages each carry four banks of seven silver flat contacts and a separate central exposed pad; not BGA domes, PCB thermal vias, pinouts/always-ground pads or dimensional/thermal/electrical certification.
- `radiolariandiscs`: radiolarian equatorial cutaways — four ivory concentric-ring skeletons each enclose a central chamber, 6/12/18-cell annular rows and six short marginal spines; opaque dielectric, not external sieve plates, spiderwebs, geometric holes or species/microscopy calibration.
- `bgasolderballs`: complete BGA underside matrices — four dark square dielectric carriers each hold a uniform 13 × 13 field of silver metallic rounded domes and contact shadows; not bearing races, ball chains, pinouts, JEDEC dimensions, solder-alloy or reflow certification.
- `pigskinleather`: schematic pigskin grain — 64 irregular triplets of separate rounded dark recesses in warm-brown matte leather; opaque dielectric, not individual triangular holes, raised ostrich collars, uniform punched perforations or material authentication.
- `trianglesocketheads`: TA triangular blind-socket round heads — 25 silver-gray steel heads retain three straight drive sides and closed flat metallic floors above rough dielectric gray backing; not Y drives, curved TP3, geometric holes or dimensional/security certification.
- `diatomvalves`: schematic naviculoid external valves — four ivory lanceolate faces with lineolate striae, a flush central clear area and two centrally separated raphes with same-sided terminal bends; opaque dielectric, not geometric pores, complete paired cells or calibrated microscopy.
- `chitonshells`: schematic chiton dorsal armor — nine oval groups each retain eight raised valves, seven directional lap joints and a rough dark mantle girdle; warm-brown opaque dielectric, not articulated shell meshes, rolling motion or biomechanics.
- `leafstomata`: schematic leaf stomata — 25 kidney-shaped guard-cell pairs enclose dark recessed pores, retaining lower raised polar contacts; an opaque green dielectric pattern, not geometric air passages, a complete epidermal reconstruction or live transpiration model.
- `watermelontourmaline`: watermelon tourmaline slice mosaic — 16 rounded-triangular pink cores/pale-gray bands/green rinds share a polished plane above rough gray backing; a front-lit opaque palette approximation, without transmission, refraction, pleochroism or gem certification.
- `cuttlebone`: schematic cuttlebone wall–septa section — uneven layers and staggered, oppositely bending thin supports over dark recessed backing; warm-white rough dielectric and fully opaque, not a 3D labyrinth reconstruction, geometric holes or biomechanics model.
- `pallasite`: polished pallasite — nearly coplanar olive/honey dielectric crystals and a connected silver-gray iron-nickel matrix with fine dark intramineral fissures; an opaque front-lit PBR approximation, without backlit transmission, calibrated alloy optics or meteorite certification.
- `gosperinlay`: order-three Gosper brass inlay — 343 equal metallic links with just two round endpoints and no branches over rough navy dielectric backing; a finite open curve, not a closed Moore groove, limiting space-filling set or physical inlay mesh.
- `vogelspiral`: golden-angle disk mosaic — 97 equal flat teal/sage/ivory disks on rough gray backing, a discrete Vogel pattern with an authored half-step radial offset; not a continuous spiral, tangent Doyle packing or plant simulation.
- `langtonsant`: 1,024-step Langton-ant snapshot tiles — 122 glossy dark cells on a pale-warm 32 × 32 board, with a raised cream compass triangle; a fixed white-left/black-right authored snapshot, not a QR code or live simulation.
- `pentominotiles`: twelve free pentomino glazed tiles — five cells per piece, all twelve shapes once per 6 × 10 block, 180 navy/slate/ivory pieces above rough grout with no internal grid seams. An authored fixed packing, not an interactive puzzle or regular-pentagon tiling.
- `pythagorastree`: finite glazed-square Pythagoras trees — four branching motifs, each 31 red-brown-to-ivory squares in five size generations; an opaque dielectric grout-backed design, not two-size plane tiling, an infinite fractal or an actual tree.
- `ichinghexagrams`: sixty-four raised hexagram figures — six solid/broken lines each, 576 flat rounded-shoulder dark bars on rough cream backing; authored binary order, not King Wen numbering, divination or a font.
- `apollonianmosaic`: Apollonian tangent-circle mosaic — teal, sage and ivory glazed disks, nineteen unequal tangent circles per motif after two Descartes-reflection rounds; a finite opaque dielectric authored design over rough grout, not an infinite fractal or installation specification.
- `prismaticpentagonaltiles`: prismatic pentagonal (V3.3.3.4.4) tiling — alternating up/down blue-gray, sage and ivory glazed houses, two adjacent 90° base corners and three 120° roof corners; authored opaque dielectric tiles in rough grout, without dimensional or installation certification.
- `floretpentagonaltiles`: chiral floret pentagonal (V3.3.3.3.6) tiling — forest/olive/ivory glazed pentagons, six petals per flower, each with one 60° and four 120° corners; authored opaque dielectric tiles in rough grout, without dimensional or installation certification.
- `snubtrihexagonaltiles`: chiral snub trihexagonal (3.3.3.3.6) tiling — indigo hexagons and ivory/tan triangles, four triangles and one hexagon at each vertex; an authored opaque dielectric glazed-tile approximation over rough grout, without real dimensions or installation certification.
- `deltoidaltrihexagonaltiles`: deltoidal trihexagonal (V3.4.6.4) tiling — kite-shaped burgundy, rose and ivory glazed tiles over rough gray grout, every hexagonal cell cut into six kites by six spokes to its side midpoints; an opaque dielectric authored approximation, without real tile dimensions or installation specification certification. (Different from the existing `kisrhombilletiles` 30-60-90 triangles and `trihexagonaltiles` hexagons and triangles.)
- `soroban`: seven-rod soroban — biconical wooden beads on seven bamboo-like rods between frame bars and a reckoning bar showing 4567890 (the last seven digits of the page caption's 1234567890), with a dot on every third rod; an opaque dielectric authored approximation, without real abacus dimensions, materials or teaching correctness certification. (Different from the existing `seedbeads` seed beads.)
- `ean13label`: EAN-13 barcode label — the 30 black bars of the page's example number 4 003994 155486 printed on pale paper, with longer start, centre and end guard bars; an opaque dielectric authored approximation, without GS1 specification, scanner readability or print quality certification. (Different from the existing `papertape` punched paper tape.)
- `embossedbraille`: embossed braille paper — a cream paper face of 7 × 4 braille cells whose smoothly raised round dots spell the letters a to z in order (w skipped, three blank cells at the end); an opaque dielectric authored approximation, without paper material, dot spacing standards or readability certification. (Different from the existing `tactilepaving` regular truncated warning studs.)
- `rule30`: Rule 30 cellular automaton — a 33 × 33 cell tile showing 33 generations of Wolfram's elementary cellular automaton Rule 30 grown from a single black cell in the middle of the top row (time running down), black cells as raised glossy dark squares and white cells as lower, rougher pale squares separated by recessed fine grooves; an opaque dielectric authored approximation, without material, size standards or randomness certification. (Different from the existing `sierpinskicarpet`, `perfectmaze` and similar patterns.)
- `perfectmaze`: seeded perfect maze — an 8 × 8 cell maze whose recessed, dark, smoother corridors run between pale, rougher raised walls, the 64 cells joined by 63 links so every cell is reachable and no loop exists, a different maze for every seed; an opaque dielectric authored approximation, without material, size standards or difficulty guarantees. (Different from `moorecurve`'s single closed groove loop.)
- `sevensegment`: seven-segment display panel — a dark glass face in a 5 × 2 digit grid showing 0123456789, lit amber chamfered bars following the common seven-segment patterns and dim ghosts for the unlit segments; an opaque dielectric authored approximation, without LED/LCD components, emission or standards. (Different from `chipresistors`' white 103 marking.)
- `ulamspiral`: Ulam prime spiral — a 15 × 15 cell tile holding the integers 1-225 in a square spiral (1 at the center), the prime cells marked by glossy dark raised domes on a rougher pale non-metallic slab with recessed cell grooves; an opaque dielectric authored approximation, without material, standards or mathematical certification. (Different from the existing `tactilepaving` regular truncated studs and `dominoes` 0-6 pips.)
- `papertape`: punched paper tape — one inch of eight-level tape (ten 0.1 inch character rows by nine hole tracks) in a pale non-metallic paper that encodes the ASCII text PAPER TAPE in holes (bit 7 as even parity), with a row of smaller sprocket holes nearer the narrow edge and dark backing showing through the rougher holes; an opaque dielectric authored approximation, without material, paper thickness, translucency or standards. (Different from the existing `punchcard` 2 × 4 cards with rectangular punches.)
- `moorecurve`: Moore-curve groove tile — one closed, continuous dark recessed groove looping through every cell of an 8 × 8 cell pale non-metallic tile (a Hamiltonian loop of four rotated Hilbert curves), rougher than the face; an opaque dielectric authored approximation, without material, engraving process or size standards. (Different from the existing groove, maze and tiled presets.)
- `sierpinskicarpet`: Sierpinski carpet stone tile — four recursive levels of recessed squares on an 81 × 81 cell tile (1 of 27 cells, 8 of 9, 64 of 3 and 512 of 1), larger ones deeper and darker, repeating seamlessly; an opaque dielectric authored approximation, a finite four-level carpet rather than the limit set, without stone species, carving process or size standards. (Different from the existing perforated, panelled and pitted presets.)
- `chladnifigure`: Chladni figure — pale sand collected along the nodal lines of a standing-wave pattern on a dark, glossier non-metallic plate, the sand slightly raised and rougher, the line pattern repeating exactly with the UV tile; an opaque dielectric authored approximation that does not model physical plate modes, material or sand-grain physics. (Different from the existing sand, stone and perforated-plate presets.)
- `kisrhombilletiles`: kisrhombille (V4.6.12) glazed tiles — every hexagon cut into twelve congruent 30-60-90 right triangles that alternate deep teal and cream around its center, all straight edges on six line families 30° apart, each face with narrow bevelled edges inside rougher gray grout; an opaque dielectric authored approximation, without tile thickness, glaze chemistry or size standards. (Different from the existing `rhombille`, 3.6.3.6 hexagon–triangle and right-isosceles `righttriangletiles` presets, and the dual of `truncatedtrihexagonaltiles`.)
- `truncatedtrihexagonaltiles`: truncated trihexagonal (4.6.12) glazed tiles — cream dodecagons, small indigo squares turned in three directions 60° apart and lavender hexagons, each with narrow bevelled edges inside rougher gray grout; an opaque dielectric authored approximation, without tile thickness, glaze chemistry or size standards. (A different vertex type from the existing 3.12.12 dodecagon, hexagon–triangle and `rhombitrihexagonaltiles` tile presets.)
- `elongatedtriangulartiles`: elongated triangular (3.3.3.4.4) glazed tiles — upright terracotta square rows alternating with cream rows of up and down triangles, square rows offset by half an edge, each face with narrow bevelled edges inside rougher gray grout; an opaque dielectric authored approximation, without tile thickness, glaze chemistry or size standards. (Same three-triangle, two-square vertex content as `snubsquaretiles` but in a different order, and unlike the existing hexagon–triangle tile presets.)
- `rhombitrihexagonaltiles`: rhombitrihexagonal (3.4.6.4) glazed tiles — cream hexagons, slate-blue squares turned in three directions 60° apart and navy equilateral triangles, each with narrow bevelled edges inside rougher gray grout; an opaque dielectric authored approximation, without tile thickness, glaze chemistry or size standards. (A different vertex type from the existing `snubsquaretiles`, hexagon–triangle and 3.12.12 dodecagon tile presets.)
- `snubsquaretiles`: snub square (3.3.4.3.4) glazed tiles — dark blue squares alternately turned ±15° and cream equilateral triangles, each with narrow bevelled edges inside rougher gray grout; an opaque dielectric authored approximation, without tile thickness, glaze chemistry or size standards. (A different vertex type from the existing hexagon–triangle, Cairo-pentagon and right-triangle tile presets.)
- `starfish`: orange five-armed sea stars on a rougher gray-sand host, a rounded central disc with five arms tapering from base to tip, slightly irregular arm angles and lengths, a raised spine ridge and three rows of small tubercles; an opaque dielectric authored approximation, without species identification, tube feet, spines, a madreporite, real size or marine-biology data.
- `fishscaleshingles`: beige fish-scale metal shingles in eight courses of twelve semicircular lower-edge lobes, two lobes per shingle, half-lobe staggered courses, under-lap shadows and narrow seams; an opaque dielectric authored approximation, without embossing, metallic reflection, real overlap geometry or specification certification. (A variant of the same scalloped-overlap family as the existing `scallopedslate` and `fishscaletiles`.)
- `waffleweave`: cool grey-white rounded float ridges on a fixed 14×16 lattice enclosing recessed square pockets, with higher weft ridges and small knots at crossings; an opaque dielectric authored approximation, without real warp/weft interlacement, cloth physics, absorbency or fabric specification certification. (A finer variant of the same waffle-cloth family as the existing `wafflecloth`.)
- `halite`: milky cube hopper faces on a rough pale grey-pink salt host, each with a randomly rotated square rim and two concentric stepped-down square terraces; an opaque dielectric authored approximation, without measured crystal dimensions, transparency/dissolution physics, full cube meshes or mineral certification. (A dielectric salt variant of the same rotated nested-square hopper family as the existing `bismuthhoppers`.)
- `calcite`: milky oblique rhomb plates on a rough dark mineral host with about 75-degree parallel edges and nested parallel steps; an opaque dielectric authored approximation, without measured cleavage angles, transparency/birefringence, full rhombohedron meshes or mineral certification.
- `flangenuts`: trimmed hexagonal nuts on circular conical flanges with six straight flats and an open bore over rougher dark steel; the whole map is metallic, without underside serrations, full 3D, internal threads or DIN/ISO certification.
- `capnuts`: hexagonal cap nuts on rougher dark steel backing with six straight flats, trimmed corners and a closed circular dome; the whole map is metallic, unlike the through-bored Hex Nuts, without full 3D, internal threads or DIN/ISO certification.
- `bedfordcord`: khaki warp-direction woven cords with continuous fine grooves and half-staggered flat weft dashes; an opaque dielectric surface approximation without real warp/stuffer interlacement, cloth physics or cotton specification/provenance certification.
- `staurolite`: dark-brown 60-degree crossed crystal prisms with parallel sides and blunt ends on light rough host; four arms share an unstacked top. Opaque dielectric approximation, without full meshes, refraction, schist foliation or mineral/chemical certification.
- `dowelpins`: silver solid headless dowel-pin side elevations with rounded/entry-beveled ends and a shallow cylindrical crown; steel stays separate from opaque nonmetal backing, without full meshes, press-fit physics, load or DIN/ISO certification.
- `europeanbeech`: pale pink-tan fine straight-grained European beech with numerous diffuse shallow longitudinal vessels and minute flush ray flecks; no vessel meshes, species identification, waterproofing, structural or provenance certification.
- `habotai`: pearl-white dense fine 1/1 plain silk with same-dye yarns, shallow relief and soft sheen; an opaque surface approximation without transmission, fold/fiber meshes, cloth physics or composition/weight certification.
- `azurite`: deep-blue broad oblique-ended tabular/prismatic faces with shallow striae and local parallel triples above dark rough host; opaque dielectric, not metal, without complete prisms, refraction or mineral/copper-safety certification.
- `whiteoak`: warm olive-brown quarter-sawn White Oak with broad flush transverse ray flecks and shallow longitudinal vessels—not raised burls; no species identification, waterproofing or structural-performance certification.
- `clevispins`: silver clevis-pin side elevations with a short bilateral head, unthreaded shallow-crowned shaft and one enclosed tail bore; steel and opaque nonmetal backing stay separate, without retainer assembly, through-hole meshes, load or DIN/ISO certification.
- `whipcord`: charcoal single steep coarse ribs, same-dye yarns and continuous three-pick floats, distinct from fine Gabardine, paired Cavalry Twill and transverse Grosgrain; no fiber meshes, garment physics or textile-performance certification.
- `vanadinite`: orange-brown raised hexagonal rims with a smaller aligned recessed opaque hexagonal floor on pale rough mineral backing—not solid flat-topped crystals; no complete prisms, transparency or mineral/lead-safety certification.
- `tabwashers`: flat silver annuli with one round bore and one coplanar straight-ended external lug, separating steel from opaque dielectric bore/backing; no split, spherical/cup profile, bending, assembly or locking-performance certification.
- `whiteash`: pale warm-brown straight ash with coplanar growth bands, concentrated coarse earlywood vessels and finer sparse latewood openings; only vessels recess, without endgrain circles, raised grain or species/physics certification.
- `gibheadkeys`: silver solid gib-head taper-key side elevation with a chamfered raised head, one step and a nearly 1:100 straight shank—not double-rounded parallel or half-moon Woodruff keys; no full 3D key, fit, extraction or standards certification.
- `grosgrain`: cool grey-blue grosgrain with fine dense warp crossing single rounded transverse ribs and smooth two-sided crown falloff—not flat Faille or paired Ottoman cords; no ribbon-edge mesh, transmission or cloth physics.
- `pyromorphite`: varied yellow-green raised flat hexagonal termination faces on pale rough mineral backing; end faces only, not whole prismatic/barrel crystals, transparent optics or mineral/lead-safety certification.
- `kingwood`: polished deep red-brown heartwood with unequal flush purple-black fine longitudinal streaks and sparse recessed vessels—not cream-pink Tulipwood, raised grain or species/legal-sourcing certification.
- `faille`: opaque ivory plain weave with fine dense warp, broad flattened single weft ribs, alternating lift and low interstices—not Ottoman paired cords; no transmission or drape simulation.
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
- `f05opticalfaces`：キャップなしJIS-F05光受信器の黒い樹脂製矩形正面４個。長い側溝、片端２角を面取りした六辺の凸ガイドと丸い側突起２個、暗いキー形開口と低い丸穴を表します。全て非金属で、シャッター・LED・透明レンズはありません。NRNDのTORX1350A(F)水平型図面の作者近似で、光学／データ／音声／電気／嵌合／EMC／安全のシミュレーションや認証ではありません。当時880種類。
- `minidin4femalefaces`：mini-DIN４接点メス正面を2×2配置。黒PBTの台座／円形内芯、連続した薄い錫めっき真鍮の接地環、上の開放切欠き、下側面２段差、上縦／下横の４スロットと独立した下の閉じた矩形キー穴。[Same Sky MD-Sの２ページ](https://www.sameskydevices.com/product/resource/md-s.pdf)の独立MD-40S正面図と[メーカー写真](https://cdn.sameskydevices.com/products/image/getproductimage/976?typecode=m&width=300)に基づき、汎用９接点図やPCB穴配置とは区別します。金属は接地環のみ。既定metallic1／明示0は保存maskを変更しません。外部シールド缶・可視の銀色内部接点環・映像／電気模擬はありません。形状／PBRは作者近似でCAD／嵌合／認証ではありません。512推奨、32は粗いプレビュー。当時881種類。
- `dcbarreljackfaces`：DCバレルジャック正面４個を2×2配置。縦長の黒PBT矩形、上寄りの暗い丸口、奥まった中実ニッケル中心ピンと独立した下側の銀色横帯（上下は平ら、両端のみ丸口で切り取り）。金属M1はピン／横帯のみ、他のPBT／穴底はM0。奥行きは背面 < 穴底 < 横帯 < ピン < 台座面で、外側金属環や追加の凸円枠はありません。[Same Sky PJ-102A](https://www.sameskydevices.com/product/interconnect/connectors/dc-power-connectors/jacks/pj-102a)・[メーカー図２ページ](https://www.sameskydevices.com/product/resource/pj-102a.pdf)・[正面写真](https://cdn.sameskydevices.com/products/image/getproductimage/690?typecode=m&width=300)に基づく作者近似。既定metallic1／明示0はfactorのみ変更し保存maskを変えません。背面はんだ脚・PCB・実体貫通穴を省略し、元資料は同梱しません。CAD／電気／極性／スイッチ／安全／嵌合の模擬・認証ではありません。512推奨、32は粗いプレビュー。当時882種類。
- `stfiberadapterfaces`：ST simplex正面４個を2×2配置した簡略図。六平面のめっき金属六角台座、同心の丸い肩、上に１個だけ開いた軸方向キー溝を持つ凸円筒リップ、左右対向２個のバヨネット突起、深く暗い不透明な円形空洞。キー溝はリップだけを連続した金属肩まで下げ、背景へ貫通しません。金具／溝底M1、空洞／背面M0。深さは背面 < 穴底 < 六角台座 < 肩／キー底 < 突起 < リップ。[SENKO ST](https://www.senko.com/product/st-adapter-2/)・５ページの[DS-ST-000006-RevA-ENの１／３ページ](https://www.senko.com/wp-content/uploads/2025/01/DS-ST-000006-RevA-EN.pdf)・[メーカー写真](https://www.senko.com/wp-content/uploads/2021/09/ST-Adapter.png)に基づく216-101の作者近似。めっき金属のみ既知でニッケルとは断定しません。内部zirconiaは仕様にありますが白環は明瞭でなく、陶磁環／中心接点／ピンは描きません。29.3 mmは軸方向長さ、double-D 9.6 × 7.8 mmはパネル穴参考で正面形状ではありません。metadata作成日2024-11-15は印刷日ではありません。CADではなく、ねじ／ローレット歯／座金／キャップ／背部／ケーブル／ferrule／PCBを省略。光学／電気／嵌合／安全模擬やbrowser／FPS認証ではありません。0.04 m／0.0042 UV relief、既定metallic1、明示0はfactorのみ。constructorでキャッシュし、queryに配置／ループ／hash／trig／sqrtなし。当時883種類。
- `ftypefemalefaces`：F型メスのバルクヘッド正面４個を2×2配置。六平面のニッケルめっき金属六角台座、同心の凸円肩、閉じたキー溝なしの凸円形リップ、淡色P.P.誘電体円盤とさらに奥の小さく暗い不透明な中央入口。外部金具M1、背面／P.P.／入口M0。深さは背面 < 入口 < 六角台座 < 肩 < P.P. < リップ。STのキー溝／突起、オスピン、架空の可視中央金属接点環はありません。歴史資料[Amphenol Connex CAT-103 ©2001、PDF159／印刷158ページ](https://docs.rs-online.com/1ab7/A700000006717073.pdf#page=159)の222121写真／図面とNickel／P.P.／75Ω表に基づき、汎用Delrin／Teflonではありません。11 HEX・軸方向全長21.3 mm・座金／ナット側面寸法は参考で、正面高さの実測値ではありません。微小入口の実際の断面は判別できず、円形は作者の簡略化。既定0.04 m tile／0.0042 UV relief（メートル深さではない）、metallic1／明示0はfactorのみで保存mask不変。ねじ螺旋／装飾ねじ環、座金歯、背部／ケーブル、実体穴／透明／新meshを省略。材質・光学は作者近似でCAD／RF／75Ω／電気／嵌合／安全模擬ではなく、75Ωは歴史的な部品識別のみ。constructorでキャッシュしqueryに割り当て／ループ／hash／trig／sqrtなし。既存pbr3dとtexture所有権を維持。512推奨、32は粗いプレビュー。当時884種類。
- `to220packagefaces`：外露金属タブのTO-220正面４個を2×2配置。タブ上部の両２角を面取りし、暗い不透明な凹取付穴１個、艶消し黒の矩形本体、等間隔で平行な直線リード３本（広い根元肩／細い尾）を描きます。タブ／脚M1、他M0、C1境界混合で電気的絶縁を意味しません。作者高さは背面.02 < 穴.06 < タブ.30 < 脚.44 < 本体.68。[STP55NF06 May 2012 Doc ID7544 Rev11](https://www.st.com/resource/en/datasheet/stb55nf06.pdf#page=13)の１ページ表紙と13ページFigure23を実見、12ページ寸法表を実読。TO-220FPではありません。寸法は参考のみでCAD／熱／電気／RF／安全／FPS模擬ではなく、化学成分やめっきを推定しません。既定0.08 m tile／0.0042 UV relief（メートル深さではない）／metallic1、明示0はfactorだけを変更しmask不変。typed cache73,856 BはJS開銷を除外、queryに割り当て／ループ／hash／trig／sqrt／近傍探索なし。512推奨、32は細い脚の解像を保証しません。目録885種類、plain込みgallery886項。
- `fordcircles`：フォード円。既約分数`n / d`（d ≤ 12、46個）ごとに半径`1 / (2 d²)`の円盤を置き、中央線で鏡映した円盤も置きます（91個。隣り合うファレイ分数の円盤は接し、内部は重ならない。この幾何はプローブで確認したもので、テストには含まれません）。濃紺の地に琥珀金の円盤で、分母が小さいほど明るくなります。テストでは、独立に書いたフォード円の幾何と6,000点で比較し、256通りのずらしをすべて試して合致するのが1つだけであることを確認しており、柔らかい縁の領域の形は**対象外**です。模式的な数論幾何パターンで、特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.5 m tile／0.0008 UV relief（メートル深さではない）／metallic0。構築とサンプリングの時間は測定していません（サンプリングは1回ごとに46個の円盤を走査します）。現在のカタログは1018種、plain込みのギャラリーは1019項目です。

- `hammingtable`：ハミング距離表。32×32の角丸タイルで、2つの添字（5ビット）のハミング距離`popcount(row xor col)`で色調を決め、対角線が最も暗く、補数の位置が最も明るく、2のべき乗ごとに同じブロック構造を繰り返します。テストでは、独立に書いたビット数えで色調表を再構築して各セルの中心色と比較しており、どのseedでも合致するトーラスのずらしが**2つ**ある（16を加えるという排他的論理和の対称性）ことを明示的に確認しています。模式的なビット演算表で、特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.5 m tile／0.0008 UV relief（メートル深さではない）／metallic0。構築とサンプリングの時間は測定していません。現在のカタログは1017種、plain込みのギャラリーは1018項目です。

- `aggregationfrost`：凝集霜。96×96のトーラス上の拡散律速凝集（900粒子、ランダムウォークがクラスターの辺にくっつく）で、氷青色の霜の花のような細い枝になり、色調は中心（最も古い）から枝先へ向かって暗くなり、タイル1枚につき1つで隣のタイルとはつながりません。テストでは、ノードの色から占有セルを読み戻し、独立の幅優先探索でクラスターが連結で、ちょうど900セルであり、色がグラフ距離とともに下がることを確認しており、凝集アルゴリズムの独立した書き直しやフラクタル次元の確認は**していません**。模式的なシミュレーション結果で、特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.5 m tile／0.0008 UV relief（メートル深さではない）／metallic0。サンプラーの構築は約126〜150 ms（単発の測定でありbenchmarkではありません）で、サンプリング自体は一定回数の演算です。現在のカタログは1016種、plain込みのギャラリーは1017項目です。

- `cyclicwaves`：循環波。96×96のトーラス上の8状態の循環セルオートマトン（フォン・ノイマン近傍、閾値1、同期150ステップ、ランダムな初期状態）で、状態0〜7を暗い藍色から琥珀色までの色調に対応させ、螺旋や迷路のような波を作ります。テストでは、ノードの色から状態を読み戻して統計量（隣接で1状態以内の差が約97%、すべてのセルに±1の状態の隣接セルがある、各状態が約8分の1ずつ）を確認しており、更新規則の独立した書き直しは**していません**。模式的なオートマトンのスナップショットで、特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.5 m tile／0.0008 UV relief（メートル深さではない）／metallic0。サンプラーの構築は約39〜78 ms（単発の測定でありbenchmarkではありません）で、サンプリング自体は一定回数の演算です。現在のカタログは1015種、plain込みのギャラリーは1016項目です。

- `isingdomains`：イジング磁区。64×64のトーラス上の2次元イジング模型のメトロポリス動力学のスナップショット（温度2.35、チェッカーボード順150スイープ、ランダムな初期状態）で、上向きスピンを明るく、下向きを暗くし、同じ向きの隣接セルの割合でわずかに色付けして、ライムグリーンの迷彩のような磁区にします。テストでは、ノードの色からスピンを読み戻して色付けの論理と統計量（隣接で同じ向きの割合が約0.78〜0.84）を確認しており、メトロポリス更新の独立した書き直しや平衡の検証は**していません**。模式的な模型のスナップショットで、特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.5 m tile／0.0008 UV relief（メートル深さではない）／metallic0。サンプラーの構築は約64〜102 ms（単発の測定でありbenchmarkではありません）で、サンプリング自体は一定回数の演算です。現在のカタログは1014種、plain込みのギャラリーは1015項目です。

- `percolationclusters`：パーコレーション・クラスター。64×64のトーラス上で確率0.5927のサイト・パーコレーションを行い、占有されたセルを（折り返しを含め）union-findでクラスターにまとめ、ln(クラスターの大きさ)/ln(最大クラスター)で色付けして、硫黄色の迷彩のような模様にします。テストでは、サンプラーのノードの色から占有セルを読み戻し、独立の洪水塗りつぶしでクラスターを付け直して色を照合しており、クラスターの論理は検証しますが、ハッシュで決まる占有そのものは検証していません。模式的なランダム模様で、実際のパーコレーションのシミュレーションではありません。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.5 m tile／0.0008 UV relief（メートル深さではない）／metallic0。各サンプルは一定回数の演算で、所要時間は測定していません。現在のカタログは1013種、plain込みのギャラリーは1014項目です。

- `voronoifacets`：ボロノイ・ファセット。voronoicellsと同じボロノイの板ですが、各板の色調がランダムな向きに直線的に変化し（セル幅あたり最大±0.35）、エメラルドグリーンに暗く粗い細い継ぎ目が付きます。voronoicellsのサンプラーを共有し（勾配用のフィールドを追加、voronoicellsとvoronoipillowsでは`facet`が0で動作は変わりません）、テストでは、seedごとにちょうど64枚の板、板の内部での色調の勾配（平均の幅は約0.15）、継ぎ目の性質、C1と周期性を確認しており、母点を独立に書き直したモデルとの照合は**していません**。既知の欠点として、鋭い角度で交わる箇所にぼやけた染みがあります。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.4 m tile／0.0012 UV relief（メートル深さではない）／metallic0。現在のカタログは1012種、plain込みのギャラリーは1013項目です。

- `multiplicativeorder`：乗法的位数表。48×48のマスで、マスは法n = row + 2（2〜49）での剰余a = col + 1（1〜48）を表し、aがnと公約数を持つマス（887個）が最も暗く、それ以外はord_n(a)/φ(n)の1.5乗で色付けします（比が1なら原始根で406個、位数1が189個、最大の位数は46）。深い紺の地に氷青色で、seedは表全体をトーラス上でずらします。totienttableなどの数論表とマスの形を共有しています。テストでは、繰り返しの乗算と互いに素な数の計数による独立の実装で書き直し、seedごとにちょうど1つのトーラス上のずれを確認しています。比の表示だけで、定理の証明ではありません。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.3 m tile／0.0008 UV relief（メートル深さではない）／metallic0。各サンプルは一定回数の演算で、所要時間は測定していません。現在のカタログは1011種、plain込みのギャラリーは1012項目です。

- `sandpileidentity`：砂山の単位元。64×64のアーベル砂山群の単位元（Dharの方法：最大安定配置の2倍を安定化し、引いて、もう一度安定化。高さは0〜3で396／152／1,476／2,072セル、鏡映と転置の両方に対称で曼荼羅のような模様）を、高さに応じた金色の濃淡で表します。seedは模様をトーラス上でずらし、タイル状に並べると模様の縁による枠状の継ぎ目が見えます。テストでは、独立に書いた掃引式の崩落アルゴリズムで書き直し、`e + e = e`と対称性を確認し、seedごとにちょうど1つのトーラス上のずれを確認しています。`e + e = e`を満たすことしか確認しておらず、すべての再帰的配置に対して単位元であることは別途検証していません。数学的対象の可視化で、特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.5 m tile／0.0008 UV relief（メートル深さではない）／metallic0。各サンプルは一定回数の演算で、単位元は1回だけ（約69 ms、単発の測定）計算してキャッシュします。現在のカタログは1010種、plain込みのギャラリーは1011項目です。

- `voronoipillows`：ボロノイ枕。voronoicellsと同じボロノイの板ですが、各板の高さは盛り上がったドーム形（加重平均の母点までの距離に応じて滑らかに下がる）で、赤土色に暗く粗い細い継ぎ目が付きます。voronoicellsのサンプラーを共有し（ドーム用のフィールドを追加、voronoicellsでは0で動作は変わりません）、テストでは、seedごとにちょうど64枚の板、各板の内部で約半分のreliefの高さ差、継ぎ目の性質、C1と周期性を確認しており、母点を独立に書き直したモデルとの照合は**していません**。ライティングした3D表示も確認していません。既知の欠点として、鋭い角度で交わる箇所にぼやけた染みがあります。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.4 m tile／0.0016 UV relief（メートル深さではない）／metallic0。現在のカタログは1009種、plain込みのギャラリーは1010項目です。

- `voronoicells`：ボロノイ・セル。8×8のセルごとに揺らぎのある母点を1つ置き（計64個）、最近の母点で64枚の青灰色の多角形の板に分け（板ごとに乱数の色調1つ）、暗く粗くAOで陰になった細い継ぎ目を付けます。境界は柔らかい重み（5×5の近傍セル、ジニ不純度）を使うため場はC1です。テストでは、seedごとにちょうど64枚の板、板ごとに1つの色調、継ぎ目の性質、C1と周期性を確認しており、母点を独立に書き直したモデルとの照合は**していません**。既知の欠点として、鋭い角度で交わる箇所にぼやけた染みがあります。模式的な石板風の表現で、特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.4 m tile／0.0012 UV relief（メートル深さではない）／metallic0。各サンプルで約25回の距離と指数の計算が必要で、512² mapsの生成を1回だけ約143〜182 msと測りましたが、単発でありbenchmarkではありません。現在のカタログは1008種、plain込みのギャラリーは1009項目です。

- `cantordust`：カントール塵。81×81の格子上に描いた4次の2次元カントール集合（残るセルは256個で、星座のような金色の小さな点）で、取り除かれたセルは階層に応じて濃淡の異なる暗い色で塗り、seedは格子をトーラス上でずらします。vicsekfractalとサンプラー分岐を共有し（残る規則だけが異なり、`rule`フィールドを追加しましたが既存素材の動作は変わりません）、テストでは細分による独立のモデルを書き直し、seedごとにちょうど1つのトーラス上のずれ（各階層の深さの色調を含む）を確認しています。模式的なフラクタル模様で、特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.5 m tile／0.0008 UV relief（メートル深さではない）／metallic0。各サンプルは一定回数の演算で、所要時間は測定していません。現在のカタログは1007種、plain込みのギャラリーは1008項目です。

- `tsquarefractal`：Tスクエア・フラクタル。64×64の格子上に描いた5次のTスクエア・フラクタル（重なり合う341個の正方形が3,124セルを覆い、覆われない972セルが暗い茶色の十字とT字の骨格を作り、覆われた部分はクリーム色で最も深い階層に応じてわずかに色調が変わります）で、seedは格子をトーラス上でずらします。テストでは、再帰による独立のモデルを書き直し、seedごとにちょうど1つのトーラス上のずれ（階層の色調を含む）を確認しています。模式的なフラクタル模様で、特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.5 m tile／0.0008 UV relief（メートル深さではない）／metallic0。各サンプルは一定回数の演算で、所要時間は測定していません。現在のカタログは1006種、plain込みのギャラリーは1007項目です。

- `vicsekfractal`：ヴィチェクフラクタル。81×81の格子上に描いた4次の十字形フラクタル（残るセルは625個で、金色の細線）で、取り除かれたセルは除かれた階層に応じて濃淡の異なる暗い青緑で塗り、seedは格子をトーラス上でずらします。テストでは、細分による独立のモデルを書き直し、seedごとにちょうど1つのトーラス上のずれ（各階層の深さの色調を含む）を確認しています。模式的なフラクタル模様で、特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.5 m tile／0.0008 UV relief（メートル深さではない）／metallic0。各サンプルは一定回数の演算で、所要時間は測定していません。現在のカタログは1005種、plain込みのギャラリーは1006項目です。

- `squarekoch`：方形コッホ島。3次の第1種2次コッホ島（`F+F−F−F+F`を3回適用した、500単位ステップ・格子点376個の閉じたループで、辺は角で接しますが同じ辺を2度通ることはありません）を、暗い赤茶の地に鮭色の細線と淡いグローで描きます。32×32セルのトーラス上で隣のタイルとはつながらず、seedは曲線をトーラス上でずらします。トレース用サンプラー分岐を共有しています。テストでは、再帰による独立の実装で島を書き直し、seedごとにちょうど1つのトーラス上のずれを確認しています。模式的なフラクタルの軌跡で、特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.25 m tile／0.0008 UV relief（メートル深さではない）／metallic0。現在のカタログは1004種、plain込みのギャラリーは1005項目です。

- `radicaltable`：根基（radical）表。48×48のマスで、マスはn = row·48 + col + 1（1〜2304）を表し、ln(rad(n)) / ln(n)（radは相異なる素因数の積）の2乗で色付けします。平方因子を持たない1400個の数が最も明るく、素数のべきは1/kで、最小は2048の1/11です。暗い緑の地に淡いセージグリーンで、seedは表全体をトーラス上でずらします。divisorcountなどの数論表とマスの形を共有しています。テストでは、試し割りによる独立の実装でradを書き直し、seedごとにちょうど1つのトーラス上のずれを確認しています。比の表示だけで、abc予想の証明ではありません。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.3 m tile／0.0008 UV relief（メートル深さではない）／metallic0。各サンプルは一定回数の演算で、所要時間は測定していません。現在のカタログは1003種、plain込みのギャラリーは1004項目です。

- `goldbachtable`：ゴールドバッハ分割表。48×48のマスで、マスは偶数n = 2·(row·48 + col + 2)（4〜4610）を表し、g(n)·ln(n)²/n（gはゴールドバッハ分割の個数で、全体的な増加を消して継ぎ目の色の段差を避けるためln(n)²/nを掛けています）で色付けします。暗い紫の地に菫色で、最も明るいのはn = 2310です。seedは表全体をトーラス上でずらします。divisorcountなどの数論表とマスの形を共有しています。テストでは、試し割りによる独立の実装で分割数を書き直し、seedごとにちょうど1つのトーラス上のずれを確認しています。分割数の表示だけで、予想の証明ではありません。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.3 m tile／0.0008 UV relief（メートル深さではない）／metallic0。各サンプルは一定回数の演算で、所要時間は測定していません。現在のカタログは1002種、plain込みのギャラリーは1003項目です。

- `totienttable`：オイラーのφ関数表。48×48のマスで、マスはn = row·48 + col + 1（1〜2304）を表し、φ(n)/n（最小比48/210はn = 210、素数が最も明るく、偶数は1/2以下）で色付けします。暗い茶色の地に琥珀金色の縦縞が現れ（表の幅48が偶数のため）、seedは表全体をトーラス上でずらします。divisorcountなどの数論表とマスの形を共有しています。テストでは、互いに素な数を数える独立の実装でφ(n)を書き直し、seedごとにちょうど1つのトーラス上のずれを確認しています。関数値の表示だけで、定理の証明ではありません。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.3 m tile／0.0008 UV relief（メートル深さではない）／metallic0。各サンプルは一定回数の演算で、所要時間は測定していません。現在のカタログは1001種、plain込みのギャラリーは1002項目です。

- `spirographtable`：スピログラフ曲線表。6×6のセルで、セル(col, row)は半径a = col + 1の小円が半径b = row + 7の大円の内側を転がってできる内サイクロイド（ペン比0.8）を描きます。seedが全体の回転角（0〜0.5ラジアン）を決め、暗い赤茶の地に銅色の曲線と淡いグローが載ります。自己交差部分はガウス和を使うため折れ目がなく、aとbが公約数を持つ13セルは閉じた1周期だけを描きます。テストでは、独立に書いた曲線式から96点を取り、25〜29種類の回転角で全曲線点が明るい画素に載ることを確認しています。整数比の表だけで（ペン比は固定）、実物のスピログラフ玩具ではありません。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.3 m tile／0.0008 UV relief（メートル深さではない）／metallic0。各サンプルで360本の線分を走査し、512² mapsの生成を1回だけ約444 msと測りましたが、単発の測定でありbenchmarkではありません。現在のカタログは1000種、plain込みのギャラリーは1001項目です。

- `dodecagridfilled`：塗り分け十二重グリッド・タイリング。dodecagridtilingと同じ12回対称のパッチ（タイル151枚）ですが、各タイルの内側に色調があり（正方形が最も明るく、30°の菱形が最も暗く、4辺ごとの滑らかなステップの積で重み付け）、縁は森の緑の地に淡いライム色の細線です。seedはパッチを30°の整数倍だけ回転させます。多重グリッドのサンプラー分岐のタイル塗り機能を使っています。テストでは、独立に書いたモデルとseedごとに頂点とタイル中心の色を照合しています。小さなパッチだけで、色調は本当の配色規則ではありません。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.5 m tile／0.0007 UV relief（メートル深さではない）／metallic0。各サンプルで330本の辺と151枚のタイルを走査しますが、所要時間は測定していません。現在のカタログは999種、plain込みのギャラリーは1000項目です。

- `heptagridfilled`：塗り分け七重グリッド・タイリング。heptagridtilingと同じ7回対称のパッチ（菱形154枚）ですが、各菱形の内側に色調があり（幅広の菱形は明るく、細い菱形は暗く、4辺ごとの滑らかなステップの積で重み付け）、縁は藍色の地に淡い青の細線です。seedはパッチを360°／14の整数倍だけ回転させます。多重グリッドのサンプラー分岐のタイル塗り機能を使っています。テストでは、独立に書いたモデルとseedごとに頂点と菱形の中心の色を照合しています。小さなパッチだけで、色調は本当の配色規則ではありません。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.5 m tile／0.0007 UV relief（メートル深さではない）／metallic0。各サンプルで335本の辺と154枚の菱形を走査しますが、所要時間は測定していません。現在のカタログは998種、plain込みのギャラリーは999項目です。

- `ammannfilled`：塗り分けアマン・ベンカー・タイリング。ammannbeenkerと同じ8回対称のパッチ（タイル148枚：正方形62・菱形86）ですが、各タイルの内側に色調があり（正方形は明るく、菱形は暗く、4辺ごとの滑らかなステップの積で重み付け）、縁は琥珀色の細線です。seedはパッチを45°の整数倍だけ回転させます。多重グリッドのサンプラー分岐のタイル塗り機能を使っています。テストでは、独立に書いたモデルとseedごとに頂点とタイル中心の色を照合しています。小さなパッチだけで、色調は本当の配色規則ではありません。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.5 m tile／0.0007 UV relief（メートル深さではない）／metallic0。各サンプルで322本の辺と148枚のタイルを走査しますが、所要時間は測定していません。現在のカタログは997種、plain込みのギャラリーは998項目です。

- `penrosefilled`：塗り分けペンローズ・タイリング。penrosetilingと同じペンローズ菱形パッチですが、各菱形の内側に色調があり（太い菱形は明るく、細い菱形は暗く、4辺ごとの滑らかなステップの積で決まりC1）、縁はクリーム色の細線です。seedはパッチを36°の整数倍だけ回転させます。多重グリッドのサンプラー分岐を共有しています（`fills`・`fillRim`・`fillHeight` フィールドを追加、他の素材では0で動作は変わりません）。テストでは、独立に書いたモデルとseedごとに頂点と菱形の中心の色を照合しています。小さなパッチだけで、色調は本当の配色規則ではありません。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.5 m tile／0.0007 UV relief（メートル深さではない）／metallic0。各サンプルで323本の辺と149個の菱形を走査しますが、所要時間は測定していません。現在のカタログは996種、plain込みのギャラリーは997項目です。

- `dodecagridtiling`：十二重グリッド・タイリング。暗い青紫黒の地に、淡い紫の細線でほぼ12回対称の非周期タイリングの一部（ド・ブラウンのマルチグリッド構成、6組のグリッドと12乗根、3種のタイル151枚：30°の菱形41・60°の菱形70・正方形40、辺330本、頂点180個、オイラー標数1）を描き、seedはパッチを30°の整数倍だけ回転させます。penrosetiling・penrosestar・ammannbeenker・heptagridtilingとサンプラーの分岐を共有しています。テストでは、独立に書いたプログラムで構造を確認し、seedごとに照合しています。小さなパッチだけです。特定の出典を引用せず写真との比較もしていない作者の模式表現で、文献中の特定の12回対称タイリングであるとは主張しません。既定0.5 m tile／0.0007 UV relief（メートル深さではない）／metallic0。各サンプルで330本の辺を走査しますが、所要時間は測定していません。現在のカタログは995種、plain込みのギャラリーは996項目です。

- `heptagridtiling`：七重グリッド・タイリング。暗い紫赤黒の地に、ローズ色の細線でほぼ7回対称の非周期菱形タイリングの一部（ド・ブラウンのマルチグリッド構成、7組のグリッドと7乗根、3種の菱形154枚：27／58／69、辺335本、頂点182個、オイラー標数1）を描き、seedはパッチを360°/14の整数倍だけ回転させます。penrosetiling・penrosestar・ammannbeenkerとサンプラーの分岐を共有しています。テストでは、独立に書いたプログラムで構造を確認し、seedごとに照合しています。小さなパッチだけです。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.5 m tile／0.0007 UV relief（メートル深さではない）／metallic0。各サンプルで335本の辺を走査しますが、所要時間は測定していません。現在のカタログは994種、plain込みのギャラリーは995項目です。

- `ammannbeenker`：アマン・ベンカー・タイリング。暗い緑黒の地に、ミント色の細線で8回対称の非周期タイリングの一部（ド・ブラウンのマルチグリッド構成、4組のグリッドと8乗根、タイル148枚：正方形62・菱形86、辺322本、頂点175個、オイラー標数1）を描き、seedはパッチを45°の整数倍だけ回転させます。penrosetiling・penrosestarとサンプラーの分岐を共有しています（`roots` フィールドを追加、両者の動作は変わりません）。テストでは、独立に書いたプログラムで構造を確認し、seedごとに照合しています。小さなパッチだけです。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.5 m tile／0.0007 UV relief（メートル深さではない）／metallic0。各サンプルで322本の辺を走査しますが、所要時間は測定していません。現在のカタログは993種、plain込みのギャラリーは994項目です。

- `penrosestar`：ペンローズの星。暗い紫黒の地に、ほぼ5回回転対称なペンローズ菱形タイリングの一部（五重グリッドのオフセットをゼロに近い `(0.011, −0.006, 0.004, −0.013, 0.004)` にしたもの、菱形160個：太い菱形95・細い菱形65、辺345本、頂点186個、72°回転後も別の辺と重なる辺は75%で、一般的なオフセットの penrosetiling では22%）を桃色の細線で描き、seedはパッチを36°の整数倍だけ回転させます。penrosetilingとサンプラーの分岐を共有しています。テストでは、独立に書いたプログラムで構造を確認し、seedごとに照合しています。小さなパッチだけで、厳密な5回対称ではありません。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.5 m tile／0.0007 UV relief（メートル深さではない）／metallic0。各サンプルで345本の辺を走査しますが、所要時間は測定していません。現在のカタログは992種、plain込みのギャラリーは993項目です。

- `penrosetiling`：ペンローズ・タイリング。暗い紺黒の地に、淡い青の細線でペンローズの非周期菱形タイリングの一部（ド・ブラウンの五重グリッド構成、菱形149個：太い菱形95・細い菱形54、辺323本、頂点175個、オイラー標数1）を描き、seedはパッチを36°の整数倍だけ回転させます。テストでは、独立に書き直した五重グリッドのプログラムで構造を確認し、seedごとに照合しています。小さなパッチだけで無限のタイリングではありません。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.5 m tile／0.0007 UV relief（メートル深さではない）／metallic0。各サンプルで323本の辺を走査しますが、所要時間は測定していません。現在のカタログは991種、plain込みのギャラリーは992項目です。

- `kagome`：籠目。暗いオリーブグリーンの地に、淡い藁色の細線で籠目格子（ハニカムの各六角形の6辺の中点を結ぶと、3方向の直線による六角形と三角形の格子になる、7列×8行、線分336本）を描き、seedはタイルの1/64刻みで平行移動します。tulle・kikkoとハニカム線分サンプラーの分岐を共有しています（`outer` と `innerDegrees` フィールドを追加、両者の動作は変わりません）。テストでは、4つのseedすべてで、独立に書き直したモデルとサンプルが一致することを確認しています。特定の出典を引用せず写真との比較もしていない作者の模式表現で、上下の編み込みは表現していません。既定0.3 m tile／0.0009 UV relief（メートル深さではない）／metallic0。各サンプルで336本の線分を走査しますが、所要時間は測定していません。現在のカタログは990種、plain込みのギャラリーは991項目です。

- `kikko`：亀甲紋。暗い茶色の地に、琥珀色の細線で亀甲形の六角形ハニカム（各六角形の中に半径が半分の同心の小さな六角形、7列×8行、六角形56個、線分504本）を描き、seedはタイルの1/64刻みで平行移動します。tulleとハニカム線分サンプラーの分岐を共有しています（`inner` フィールドを追加、tulleでは0で動作は変わりません）。テストでは、4つのseedすべてで、独立に書き直したモデルとサンプルが一致することを確認しています。特定の出典を引用せず写真との比較もしていない作者の模式表現で、同心六角形の線だけです。既定0.3 m tile／0.0009 UV relief（メートル深さではない）／metallic0。各サンプルで504本の線分を走査しますが、所要時間は測定していません。現在のカタログは989種、plain込みのギャラリーは990項目です。

- `vermiculation`：虫食い彫り（ヴァーミキュレーション）。淡い茶褐色の石面に、曲がって枝分かれする互いに繋がらない暗いミミズ状の溝（約20〜30本、面積の約35%）が刻まれています。模様は `feed 0.078`・`kill 0.061` の周期的Gray-Scott反応拡散から作り、seedは初期の摂動を変えます。turingmazeとサンプラーの分岐を共有しています（`baseHeight` フィールドを追加、turingmazeでは0で動作は変わりません）。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.4 m tile／0.0015 UV relief（メートル深さではない）／metallic0。現在のカタログは988種、plain込みのギャラリーは989項目です。

- `minkowskisausage`：ミンコフスキーのソーセージ。暗い紺黒の地に、第2次の2次コッホ島（256ステップ、相異なる格子点256個の単純閉ループ、点灯ノード768個、線幅はセルの3分の1）を淡い青の細線でなぞり、seedは曲線をトーラス上で平行移動します。dragoncurve・peanocurve・levycurveとトレース用サンプラーの分岐を共有しています。テストでは、ブロック再帰で独立に書いた曲線とノード単位で一致することを確認しています。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.25 m tile／0.0008 UV relief（メートル深さではない）／metallic0。現在のカタログは987種、plain込みのギャラリーは988項目です。

- `pisanotable`：ピサノ周期表。48×48個の角丸タイルで、n番目（1〜2304）のタイルはフィボナッチ数列の n を法とするピサノ周期と上限 6n の比で色調が決まります（上限に達するのは n = 10、50、250、1250 だけで最も明るい）。seedは表全体をトーラス上で平行移動します。テストでは、数列を生成して独立に書いた周期表とタイル単位で一致することを確認しています。特定の出典を引用せず写真との比較もしていない作者の模式表現で、プレビューではノイズのように見えます。既定0.3 m tile／0.0008 UV relief（メートル深さではない）／metallic0。構築時間は測定していません。現在のカタログは986種、plain込みのギャラリーは987項目です。

- `mobiustable`：メビウス表。48×48個の角丸タイルで、n番目（1〜2304）のタイルはメビウス関数 μ(n) で3つに分類されます。μ = 0（平方数で割り切れる、904個）は暗く、μ = +1（699個）は明るい紫、μ = −1（701個）は灰紫で、4の倍数が暗い縦縞になり、seedは表全体をトーラス上で平行移動します。テストでは完全な素因数分解で独立に求めた表とタイル単位で一致することを確認しています。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.3 m tile／0.0008 UV relief（メートル深さではない）／metallic0。現在のカタログは985種、plain込みのギャラリーは986項目です。

- `abundantnumbers`：過剰数の表。48×48個の角丸タイルで、n番目（1〜2304）のタイルは σ(n) と 2n の比較で3つに分類されます。不足数（1,732個）は暗く、過剰数（569個）はやや明るく、完全数（6、28、496）が最も明るく表示され、12や6の倍数が明るい縦縞になり、seedは表全体をトーラス上で平行移動します。テストでは試し割りで独立に求めた分類表とタイル単位で一致することを確認しています。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.3 m tile／0.0008 UV relief（メートル深さではない）／metallic0。現在のカタログは984種、plain込みのギャラリーは985項目です。

- `xortable`：XOR表。64×64個の角丸タイルで、(row, col) のタイルの色調は row XOR col に比例します（主対角線が最も暗く、値が大きいほど明るいライムグリーンで、入れ子のシェルピンスキー風ブロックになる、いわゆるXOR texture）。seedは表全体をトーラス上で平行移動します。テストでは独立に書いた表とタイル単位で一致することを確認しています。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.3 m tile／0.0008 UV relief（メートル深さではない）／metallic0。現在のカタログは983種、plain込みのギャラリーは984項目です。

- `paleytable`：ペイリー表。61×61個の角丸タイルで、(row, col) のタイルは col − row の素数61に関するルジャンドル記号です（対角線は中間色、平方剰余は明るいローズピンク、非剰余は暗い梅紫）。表は col − row だけに依存するため斜めの帯状になり、seedは表全体をトーラス上で平行移動します。テストでは独立に書いた表とタイル単位で一致することを確認しています。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.3 m tile／0.0008 UV relief（メートル深さではない）／metallic0。現在のカタログは982種、plain込みのギャラリーは983項目です。

- `hadamardmatrix`：アダマール行列。64×64個の角丸タイルで、(row, col) のタイルはシルベスター型アダマール行列の対応する成分です（row と col のビットごとの AND に含まれる 1 の個数が偶数なら +1 で明るい冷たい白、奇数なら −1 で暗い青灰色）。seedは表全体をトーラス上で平行移動します。テストでは独立に書いた行列とタイル単位で一致することを確認しています。特定の出典を引用せず写真との比較もしていない作者の模式表現で、入れ子のブロック構造はプレビューでは目視で判別できません。既定0.3 m tile／0.0008 UV relief（メートル深さではない）／metallic0。現在のカタログは981種、plain込みのギャラリーは982項目です。

- `levycurve`：レヴィ曲線。暗い青緑黒の地に、第9次のレヴィC曲線（512ステップ、相異なる格子点416個、相異なる辺462本、点灯ノード1,340個、線幅はセルの3分の1）をミント色の細線でなぞり、seedは曲線をトーラス上で平行移動します。dragoncurve・peanocurveとトレース用サンプラーの分岐を共有しています。テストでは、ビット数の計算で独立に書いた曲線とノード単位で一致することを確認しています。特定の出典を引用せず写真との比較もしていない作者の模式表現で、曲線は閉じていません。既定0.25 m tile／0.0008 UV relief（メートル深さではない）／metallic0。現在のカタログは980種、plain込みのギャラリーは981項目です。

- `tulle`：チュール。暗い紫黒の地に、アイボリーの細い糸で編んだ六角形のハニカムネット（7列×8行、六角形56個、線分168本、結び目はやや明るい）で、水平と垂直の周期比は7√3 : 12（六角形は約1.04%引き伸ばされる）、seedはタイルの1/64刻みで平行移動します。テストでは、4つのseedすべてで、独立に書き直したハニカムモデルとサンプルが一致することを確認しています。特定の出典を引用せず写真との比較もしていない作者の模式表現で、半透明ではありません。既定0.3 m tile／0.0012 UV relief（メートル深さではない）／metallic0。各サンプルで168本の線分を走査しますが、所要時間は測定していません。現在のカタログは979種、plain込みのギャラリーは980項目です。

- `sacksspiral`：サックス螺旋。暗い紺黒の地に、整数1〜500をサックス螺旋（半径は√nに比例、角度は2π√n）の上の点として並べ、素数（95個）は明るい金色、合成数は暗い金茶色の点で表し、seedは螺旋全体を整数度だけ回転させます。テストでは、どのseedでも点の中心の色が独立に書き直したモデルと一致することを確認しています。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.4 m tile／0.002 UV relief（メートル深さではない）／metallic0。各サンプルで500個の整数を走査しますが、所要時間は測定していません。現在のカタログは978種、plain込みのギャラリーは979項目です。

- `peanocurve`：ペアノ曲線。暗い紺黒の地に、第3次のペアノ空間充填曲線（27×27セルを各1回、728ステップ、点灯ノード2,185個、線幅はセルの3分の1）をピンクの細線でなぞり、角から対角へ蛇行し、seedは曲線をトーラス上で平行移動します。dragoncurveとトレース用サンプラーの分岐を共有しています。テストでは、ブロック再帰で独立に構築した曲線とノード単位で一致することを確認しています。特定の出典を引用せず写真との比較もしていない作者の模式表現で、曲線は閉じていません。既定0.25 m tile／0.0008 UV relief（メートル深さではない）／metallic0。現在のカタログは977種、plain込みのギャラリーは978項目です。

- `divisorcount`：約数の個数の表。48×48個の角丸タイルで、n番目（1〜2304）のタイルは n の約数の個数で色調が決まります。素数（342個）は暗く、高度合成数は明るく（最大は n = 1680 の40個）、12の倍数は明るい縦縞になり、seedは表全体をトーラス上で平行移動します。テストでは試し割りで独立に求めた約数の個数表とタイル単位で一致することを確認しています。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.3 m tile／0.0008 UV relief（メートル深さではない）／metallic0。現在のカタログは976種、plain込みのギャラリーは977項目です。

- `dragoncurve`：ドラゴン曲線。暗い紫黒の地に、第9次のハイウェイ・ドラゴン曲線（512ステップ、相異なる格子点361個、点灯ノード1,385個、線幅はセルの3分の1）を金色の細線でなぞり、seedは曲線をトーラス上で平行移動します。テストでは独立に書き直した紙折り列とノード単位で一致することを確認しています。特定の出典を引用せず写真との比較もしていない作者の模式表現で、曲線は閉じていません。既定0.25 m tile／0.0008 UV relief（メートル深さではない）／metallic0。現在のカタログは975種、plain込みのギャラリーは976項目です。

- `juliatiles`：ジュリア集合のタイル。c = −0.8 + 0.156iのジュリア集合を、64×64個の角丸タイルで表したモザイクで、色調は各セル中心での発散までの反復回数（最大64回、平方根）です。発散しないセル（404個）が最も暗く、seedは表全体をトーラス上で平行移動します。mandelbrottilesとサンプラーの分岐を共有しています。テストでは独立に書き直した発散時間とタイル単位で一致することを確認しています。特定の出典を引用せず写真との比較もしていない作者の模式表現で、ピクセルアート調です。既定0.3 m tile／0.0008 UV relief（メートル深さではない）／metallic0。現在のカタログは974種、plain込みのギャラリーは975項目です。

- `mandelbrottiles`：マンデルブロ集合のタイル。64×64個の角丸タイルによるマンデルブロ集合のモザイクで、色調は各セル中心での発散までの反復回数（最大48回、平方根）です。発散しないセル（726個）が最も暗く、seedは表全体をトーラス上で平行移動します。テストでは独立に書き直した発散時間とタイル単位で一致することを確認しています。特定の出典を引用せず写真との比較もしていない作者の模式表現で、ピクセルアート調でありトーラスの継ぎ目では連続しません。既定0.3 m tile／0.0008 UV relief（メートル深さではない）／metallic0。現在のカタログは973種、plain込みのギャラリーは974項目です。

- `rhodoneatable`：バラ曲線の表。ピンクのネオン風で、6×6の各マスが`r = cos(k·θ)`、`k = (col + 1)/(row + 1)`のバラ曲線を描きます。seedが変えるのは全体の回転角だけです。テストでは回転角を走査して、すべてのバラ曲線上の点が明るい画素に載ることを確認しています。特定の出典を引用せず写真との比較もしていない作者の模式表現で、実際のネオン管ではありません。既定0.3 m tile／0.0008 UV relief（メートル深さではない）／metallic0。1回のサンプリングごとにそのマスの192本の線分との距離を求めるため、512²のサンプリングは約0.24秒です。現在のカタログは972種、plain込みのギャラリーは973項目です。

- `lissajoustable`：リサージュ曲線の表。オシロスコープ風の緑色の蛍光曲線で、6×6の各マスが周波数比(col + 1):(row + 1)のリサージュ曲線を描きます。seedが変えるのは共通の位相だけです。テストでは位相を走査して、すべての曲線上の点が明るい画素に載ることを確認しています。特定の出典を引用せず写真との比較もしていない作者の模式表現で、実際のオシロスコープの画面ではありません。既定0.3 m tile／0.0008 UV relief（メートル深さではない）／metallic0。1回のサンプリングごとにそのマスの128本の線分との距離を求めるため、512²のサンプリングは約0.2秒です。現在のカタログは971種、plain込みのギャラリーは972項目です。

- `primesieve`：エラトステネスの篩。32×32個の角丸タイルが1〜1024を表し、素数（172個）は明るい金色、合成数は最小の素因数に応じたコントラストの低いオリーブ色、1は最も暗い色です。seedは表全体をトーラス上で平行移動します。テストでは試し割りで独立に書き直した最小素因数とタイル単位で一致することを確認しています。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.3 m tile／0.0012 UV relief（メートル深さではない）／metallic0。現在のカタログは970種、plain込みのギャラリーは971項目です。

- `gcdtable`：最大公約数の表。32×32個の角丸タイルが`gcd(col + 1 + a, row + 1 + b)`を表し（オフセットa、bはseedで決まる）、色調は`1 − 1/gcd`（互いに素は暗く、公約数が大きいほど明るく、直線や斜めの線に沿って光る）です。テストでは独立に書き直したgcdとタイル単位で一致することを確認しています。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.3 m tile／0.0012 UV relief（メートル深さではない）／metallic0。現在のカタログは969種、plain込みのギャラリーは970項目です。

- `collatzsteps`：コラッツ予想の停止時間。32×32個の角丸タイルが1〜1024を表し、色調は各整数が1に到達するまでのコラッツ操作の回数を178で割った値（暗い紫から暖かいオレンジ）です。seedは表全体をトーラス上で平行移動します。テストでは独立に書き直した停止時間とタイル単位で一致することを確認しています。特定の出典を引用せず写真との比較もしていない作者の模式表現で、見た目は筋の入ったノイズに近いです。既定0.3 m tile／0.0012 UV relief（メートル深さではない）／metallic0。現在のカタログは968種、plain込みのギャラリーは969項目です。

- `pascalmod3`：パスカルの三角形（mod 3）。青緑の角丸タイルの48×48の格子で、左下の三角形部分にパスカルの三角形を3で割った余りが入ります（0／1／2が暗／中／明の3段階で入れ子の三角形になる）。対角線の外側は暗い空きマスで、seedは表全体をトーラス上で平行移動します。テストでは独立に書き直した三角形とタイル単位で一致することを確認しています。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.3 m tile／0.0012 UV relief（メートル深さではない）／metallic0。現在のカタログは967種、plain込みのギャラリーは968項目です。

- `modulartable`：剰余の掛け算表。31×31個の角丸タイルで、色調は11を法とする掛け算表の剰余`((a + col)·(b + row)) mod 11`で決まります（seedがオフセットを選ぶ）。タイル面は盛り上がり、目地は暗くAO付きで、剰余0の行と列全体が暗い帯になります。テストでは独立に書き直した掛け算表とタイル単位で一致することを確認しています。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.3 m tile／0.0012 UV relief（メートル深さではない）／metallic0。現在のカタログは966種、plain込みのギャラリーは967項目です。

- `elementaryautomata`：基本セルオートマトン。琥珀色のLEDマトリクスに、Wolframのルール30・90・110（単一の生きたセルから開始）と184（繰り返しパターンから開始）の4つの帯（各32行×128列）を並べます。seedは列を回転させるだけです。テストでは独立に書き直したオートマトンとセル単位で一致することを確認しています。特定の出典を引用せず写真との比較もしていない作者の模式表現で、三角形は各帯の中央部分だけを占めます。既定0.3 m tile／0.001 UV relief（メートル深さではない）／metallic0。現在のカタログは965種、plain込みのギャラリーは966項目です。

- `gameoflife`：ライフゲーム。暗いLEDマトリクス上の、64×64のトーラスを38%のランダム密度で開始し250世代進めたコンウェイのライフゲームのスープ（ブロック、ビーハイブ、ブリンカー、グライダー）です。完全には落ち着いていない静止スナップショットです。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.2 m tile／0.001 UV relief（メートル深さではない）／metallic0。シミュレーションはサンプラー生成時に1回だけ実行し約30 msです。現在のカタログは964種、plain込みのギャラリーは965項目です。

- `hilbertcurve`：ヒルベルト曲線。暗い紺色の地に、4次のヒルベルト空間充填曲線をシアンの回路配線のようにたどります（16×16の各マスをちょうど1回通り、タイルの継ぎ目で閉じたループになる）。seedは正方形の対称操作を選び曲線を平行移動します。特定の出典を引用せず写真との比較もしていない作者の模式表現で、実際の回路基板ではありません。既定0.2 m tile／0.0015 UV relief（メートル深さではない）／metallic0。現在のカタログは963種、plain込みのギャラリーは964項目です。

- `quasicrystal`：準結晶風の干渉パターン。ほぼ72°間隔の整数波数ベクトルをもつ5つの平面波が干渉し、青と白の五回対称に見える模様（五角形の環や点）になります。タイルは厳密に周期的なので近似であり、本物の準結晶やペンローズ・タイリングではありません。seedが変えるのは位相だけです。準結晶の文献を引用せず写真との比較もしていない作者の模式表現です。既定0.3 m tile／0.0015 UV relief（メートル深さではない）／metallic0。現在のカタログは962種、plain込みのギャラリーは963項目です。

- `sudoku`：数独。新聞に載る9×9のパズル盤面（細い罫線と2ピクセルの太いブロック罫線）で、約4割のマスにseedで決まる3×5ピクセルの数字が入ります。数字はランダムに置かれており、正しい（解ける）数独ではありません。特定の問題を引用せず写真との比較もしていない作者の模式表現で、数字は太めで少しぼやけます。既定0.2 m tile／0.0008 UV relief（メートル深さではない）／metallic0。現在のカタログは961種、plain込みのギャラリーは962項目です。

- `datamatrix`：Data Matrix二次元コード。クリーム白のラベル上に、18×18モジュールの黒い正方形コードが2×2個（左と下は塗りつぶしのL字ファインダ、上と右は白黒交互のクロックトラック、内部はseedで決まるランダムなデータ、シンボル間は静止領域）並びます。データはランダムで、有効な符号化ではなくスキャンもできません。写真比較やスキャン検証はしていない作者の模式表現です。既定0.12 m tile／0.0008 UV relief（メートル深さではない）／metallic0。現在のカタログは960種、plain込みのギャラリーは961項目です。

- `couscous`：クスクス。淡いベージュの小さな丸い粒（26×26の格子、わずかな回転と大きさの違い）が密に重なり、粒の間にはAO付きの暗い茶色の下地が見えます。granola／tilledsoil／sherpafleeceと共用の重なり粒サンプラーを再利用しています。特定の出典を引用せず写真との比較もしていない作者の模式表現で、実物より粒が丸く均一です。既定0.1 m tile／0.0012 UV relief（メートル深さではない）／metallic0。現在のカタログは959種、plain込みのギャラリーは960項目です。

- `morse`：モールス符号。クリーム色の紙テープ上に、seedで決まるランダムな短点・長点のメッセージを14行（短点1マス、長点3マス、記号間1マス、文字間3マス、語間7マス）濃いグレーのインクで並べます。メッセージは解読できる文章ではありません。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.3 m tile／0.0012 UV relief（メートル深さではない）／metallic0。現在のカタログは958種、plain込みのギャラリーは959項目です。

- `pizza`：ピザ。淡い黄色のチーズ（焦げ目と薄いトマトソースの色あり）の上に、5×5の格子内で72%の確率で現れる、わずかに揺らぎと大きさの違いのある赤茶色のペパロニの円盤が載ります。中央がやや高く油っぽく光ります。特定の出典を引用せず写真との比較もしていない作者の模式表現で、円盤が格子に沿って並ぶため水玉模様に近く見えます。既定0.25 m tile／0.004 UV relief（メートル深さではない）／metallic0。現在のカタログは957種、plain込みのギャラリーは958項目です。

- `invaders`：アーケードのインベーダー。緑色のLEDドットマトリクス上のピクセルエイリアン（3行を各3回繰り返し、42×33のLED格子）で、消灯したLEDは暗い緑のままです。造型は一般的なアーケード風に手描きしたもので、特定のゲームと一致する保証はなく、発光もしません。seedが変えるのは粒状感だけです。特定の出典を引用せず写真との比較もしていない作者の模式表現です。既定0.3 m tile／0.001 UV relief（メートル深さではない）／metallic0。現在のカタログは956種、plain込みのギャラリーは957項目です。

- `fairisle`：フェアアイル編み。北欧セーターの柄で、40×30目のV字形の編み目に、15段1組のべた帯・小さなドットの帯・8目ごとに繰り返す中央が開いた菱形を、紺と薄いグレーの2色で表します。seedが変えるのは毛羽だけで、柄は固定です。特定の出典を引用せず写真との比較もしていない作者の模式表現で、糸は均一な繰り返しです。既定0.3 m tile／0.0015 UV relief（メートル深さではない）／metallic0。現在のカタログは955種、plain込みのギャラリーは956項目です。

- `mackerel`：サバ。青緑色の魚の背に、途切れて曲がる濃い青の波状の帯がv方向に積み重なり、ゆっくりしたノイズで歪みます。特定の出典を引用せず写真との比較もしていない作者の模式表現で、魚の皮というより水の波紋やトラ縞に見え、銀色の腹や鱗はありません。既定0.3 m tile／0.0008 UV relief（メートル深さではない）／metallic0。現在のカタログは954種、plain込みのギャラリーは955項目です。

- `hestain`：H&E染色組織。淡いピンク紫の斑で繊維状の細胞質の上に、周期的なGray-Scott反応拡散から位置と形を得た濃い紫の楕円形の細胞核が散らばります。特定の出典を引用せず写真との比較もしていない作者の模式表現で、細胞質はエオシンのピンクではなくラベンダー色寄りで、細胞膜や組織の層構造はありません。既定0.05 m tile／0.0008 UV relief（メートル深さではない）／metallic0。各seedの初回生成にシミュレーションで約0.2秒余計にかかります。現在のカタログは953種、plain込みのギャラリーは954項目です。

- `petricolonies`：シャーレのコロニー。琥珀色の寒天の上のクリーム色の丸いコロニーで、位置と形は周期的なGray-Scott反応拡散のスポット領域から得ます。やや濃い細い縁と少し盛り上がった中央を持ちます。特定の出典を引用せず写真との比較もしていない作者の模式表現で、シャーレの縁、粘液の光沢、同心円構造はありません。既定0.12 m tile／0.0015 UV relief（メートル深さではない）／metallic0。各seedの初回生成にシミュレーションで約0.2秒余計にかかります。現在のカタログは952種、plain込みのギャラリーは953項目です。

- `turingmaze`：チューリング迷路。白い紙の上に、周期的なGray-Scott反応拡散（迷路パラメータ）が作る濃いインクの迷路状の縞模様です。作者の模式表現で、指紋ではなく（縞は指紋よりずっと粗く渦もありません）、特定の出典を引用せず写真との比較もしていません。既定0.3 m tile／0.0012 UV relief（メートル深さではない）／metallic0。各seedの初回生成にシミュレーションで約0.2秒余計にかかります。現在のカタログは951種、plain込みのギャラリーは952項目です。

- `cheetahfur`：チーターの毛皮。黄褐色の短い毛の上の黒い楕円の斑点で、位置と形は周期的なGray-Scott反応拡散シミュレーションから得ます（サンプラー生成時にシミュレーションを実行する最初の素材で、各seedの初回生成に約0.2秒余計にかかります）。特定の出典を引用せず写真との比較もしていない作者の模式表現で、斑点周囲の淡いハローや毛色のグラデーションはありません。既定0.25 m tile／0.0015 UV relief（メートル深さではない）／metallic0。現在のカタログは950種、plain込みのギャラリーは951項目です。

- `jade`：翡翠（軟玉）。拋光した緑色の表面で、中間の緑の雲状の地に、ノイズの等値線に沿う淡い緑の脈と髪の毛のような細い脈を持ちます。特定の出典を引用せず写真との比較もしていない作者の模式表現で、脈の走り方は実物より規則的で、半透明感はありません。既定0.15 m tile／0.0008 UV relief（メートル深さではない）／metallic0。現在のカタログは949種、plain込みのギャラリーは950項目です。

- `spectrogram`：スペクトログラム。濃い青の地に、ビブラートで波打つ黄色い倍音の横線12本、縦の広帯域バースト5本、ざらつきの点を並べ、時間-周波数のエネルギー場でどこに現れるかを決めます。特定の出典・音声データ・参照画像を引用しない作者の模式表現で、規則的すぎ、色階も単一のグラデーションです。既定0.3 m tile／0.002 UV relief（メートル深さではない）／metallic0。現在のカタログは948種、plain込みのギャラリーは949項目です。

- `barchart`：棒グラフ用紙。淡い青灰色の紙面に、1 tileあたり2つのグラフ、それぞれ高さがランダムな濃紺の棒12本、淡い灰色の横罫線4本、基線1本を持ちます。特定の出典を引用せず写真との比較もしていない作者の模式表現で、目盛、数字、タイトルは含みません。既定0.25 m tile／0.0012 UV relief（メートル深さではない）／metallic0。現在のカタログは947種、plain込みのギャラリーは948項目です。

- `ecgpaper`：心電図用紙。淡いピンクの細かい格子と5マスごとの太い線の上に、3本の記録帯がそれぞれ6拍分の心拍波形（簡略化したP・Q・R・S・T波の曲線）を繰り返します。特定の出典・規格・写真を引用しない作者の模式表現で、医療用途には使えず、R波は低くT波の頂部は平らです。既定0.3 m tile／0.0012 UV relief（メートル深さではない）／metallic0。現在のカタログは946種、plain込みのギャラリーは947項目です。

- `redalder`：レッドアルダー（Alnus rubra）の縦木面。淡い黄褐色からやや赤みのある褐色の均一な地、細かく均一な質感、ごく淡い暗い縞2本、縦方向の繊維、ごく少量の細く暗い短い痕を持ちます。幅の広い集合放射組織の筋、節、塗装は含みません。実際に読んだ[Wood Database Red Alder](https://www.wood-database.com/red-alder/)と実見した[木面写真](https://www.wood-database.com/wp-content/uploads/alnus-rubra.jpg)から配色と木目形状だけを近似します。既存の導管samplerを再利用し、既定0.18 m tile／0.002 UV relief（メートル深さではない）／metallic0。現在のカタログは945種、plain込みのギャラリーは946項目です。

- `sherpafleece`：シェルパフリース。ランダムに回転した縁の不規則なクリーム色の塊が重なってふんわりした巻き毛の房を作り、ときどき遮蔽された明るい茶色の溝が現れます。`granola`の2層楕円ピースsamplerを再利用します。特定の出典を引用せず写真との比較もしていない作者の模式表現で、実際の繊維というよりクリーム色の粒やポップコーンに近く見えます。既定0.15 m tile／0.012 UV relief（メートル深さではない）／metallic0。現在のカタログは944種、plain込みのギャラリーは945項目です。

- `tilledsoil`：耕した土。暗い茶色の隙間地の上に、ランダムに回転した縁の不規則な中間の茶色の土塊と、少量の淡い小石が重なります。`granola`の2層楕円ピースsamplerを再利用します。特定の出典を引用せず写真との比較もしていない作者の模式表現で、迷彩模様にも見え、実際の土より平坦です。既定0.4 m tile／0.012 UV relief（メートル深さではない）／metallic0。現在のカタログは943種、plain込みのギャラリーは944項目です。

- `heatsinkfins`：ヒートシンクのフィン。アルマイト処理した押出アルミで、1 tileあたり20枚の直線フィン、平らな頂面、深く遮蔽された細い溝、頂面の細い押出し筋と淡いむらを持ちます（全面金属、metallic 1）。特定の出典を引用せず写真との比較もしていない作者の模式表現で、フィンの高さ、ベース板、ヒートパイプは含みません。既定0.1 m tile／0.01 UV relief（メートル深さではない）。現在のカタログは942種、plain込みのギャラリーは943項目です。

- `jerky`：ビーフジャーキー。暗い赤褐色の地に、u方向に細長い密な繊維、広い低周波の色調変化、位置による光沢の変化、点在するほぼ黒の粗挽き胡椒の粒を持ちます。特定の出典を引用せず写真との比較もしていない作者の模式表現で、ヘアライン仕上げの暗い木目にも見え、実物の形状は含みません。既定0.12 m tile／0.004 UV relief（メートル深さではない）／metallic0。現在のカタログは941種、plain込みのギャラリーは942項目です。

- `garlicskin`：ニンニクの外皮。クリーム白の紙質の地に、v方向に走る淡い紫の縦筋約11本（ノイズで曲がり幅も変化）、縦方向の繊維、やわらかなしわ、細かな粒を持ちます。特定の出典を引用せず写真との比較もしていない作者の模式表現で、実際のニンニクの皮より縞模様の紙に近く見えます。既定0.1 m tile／0.003 UV relief（メートル深さではない）／metallic0。現在のカタログは940種、plain込みのギャラリーは941項目です。

- `pancake`：パンケーキの表面。金色の地に、縁がレース状の低周波の焦げ茶の斑（面積はシードで大きく変わる）と、点在する小さな気孔のくぼみを持ちます。特定の出典を引用せず写真との比較もしていない作者の模式表現で、斑の縁にブロック状のノイズ感があり、光沢や厚みはありません。既定0.25 m tile／0.004 UV relief（メートル深さではない）／metallic0。現在のカタログは939種、plain込みのギャラリーは940項目です。

- `kawung`：カウン柄のバティック。濃い藍色の綿布に、ろうけつ染めのクリーム色の楕円が市松状に並びます（偶数マスは長軸がu方向、奇数マスはv方向で、それぞれ中心に点を持つ）。特定の出典を引用せず図譜との比較もしていない簡略化した模式表現で、実物のカウン柄より幾何が単純で線も均一すぎます。既定0.3 m tile／0.004 UV relief（メートル深さではない）／metallic0。現在のカタログは938種、plain込みのギャラリーは939項目です。

- `granola`：グラノーラ。蜂蜜色の茶色い地の上に、ランダムに回転した縁の不規則な楕円形のピースが2層（大きな淡いクリーム色のオーツ麦フレークと、小さな暗いナッツ／ドライフルーツ片）重なり、露出した地は遮蔽で暗くなります。特定の出典を引用せず写真との比較もしていない作者の模式表現で、迷彩模様にも見え、実物より平坦です。既定0.2 m tile／0.008 UV relief（メートル深さではない）／metallic0。現在のカタログは937種、plain込みのギャラリーは938項目です。

- `raspberry`：ラズベリー。16×18個の丸い赤い小果が千鳥格子状に少し重なって並び（粒ごとに色調、ドーム状の陰影、ハイライトを持つ）、粒の間は暗く遮蔽された細い溝です。特定の出典を引用せず写真との比較もしていない作者の模式表現で、実物より大幅に規則的であり、産毛、がく、全体の形は含みません。既定0.08 m tile／0.006 UV relief（メートル深さではない）／metallic0。現在のカタログは936種、plain込みのギャラリーは937項目です。

- `salami`：サラミの切り口。低周波のむらがある暗赤色の加工肉に、大きさの異なる（隣り合うものは連なる）クリーム色の楕円形の脂身と、細かい黒に近い胡椒粒が散らばります。特定の出典を引用せず写真との比較もしていない作者の模式表現で、実物より大幅に規則的であり、外皮、カビ、筋繊維は含みません。既定0.12 m tile／0.002 UV relief（メートル深さではない）／metallic0。現在のカタログは935種、plain込みのギャラリーは936項目です。

- `baconstrips`：ベーコンのスライス。低周波ノイズで波打つ赤身の帯約5本と、より明るく少し盛り上がって滑らかなクリーム色の脂身の帯が交互に並び（赤身にはu方向の繊維、境界はやや暗い）ます。特定の出典を引用せず写真との比較もしていない作者の模式表現で、実物より滑らかで規則的であり、縮み、油の泡、皮は含みません。既定0.2 m tile／0.003 UV relief（メートル深さではない）／metallic0。現在のカタログは934種、plain込みのギャラリーは935項目です。

- `sweetcorn`：スイートコーン。14×14個の丸みのある四角い黄色い粒が整然と並び（粒ごとに色調、わずかな位置のずれ、ドーム状のハイライトを持つ）、粒の間は暗く遮蔽された細い隙間です。特定の出典を引用せず写真との比較もしていない作者の模式表現で、実物より大幅に規則的で、弧状の巻き付き、絹糸、苞葉は含みません。既定0.13 m tile／0.006 UV relief（メートル深さではない）／metallic0。現在のカタログは933種、plain込みのギャラリーは934項目です。

- `crosswordgrid`：クロスワードの格子。白い紙に15×15のマスを並べ、約2割の黒マスを180度回転対称に配置し、白マスの間に淡い灰色の細い罫線、単語の開始マスの左上に丸い番号印を持ちます。特定の出典を引用しない作者の模式表現で、実際のパズルや解ける単語ではなく、クロスワードの配置規則を全て満たす保証もありません。既定0.3 m tile／0.0012 UV relief（メートル深さではない）／metallic0。現在のカタログは932種、plain込みのギャラリーは933項目です。

- `windowpane`：ウィンドウペーン（窓格子）。暗い炭灰青のツイル・フランネルに、1 tileあたり3×3の淡い細線を並べ、斜めの2/2綾畝と糸ごとのノイズを持ちます。特定の出典を引用しない作者の模式表現で、実際の織物構造ではありません。既定0.3 m tile／0.004 UV relief（メートル深さではない）／metallic0。現在のカタログは931種、plain込みのギャラリーは932項目です。

- `merbau`：メルバウ（Intsia spp.）の縦木面。灰色がかった橙褐色の地、粗い質感、ごく淡い暗い縞1本、縦方向の繊維、密に点在する細く暗い導管の短い痕を持ちます。黄色い鉱物沈着、交錯木理、板ごとの色差、塗装は含みません。実際に読んだ[Wood Database Merbau](https://www.wood-database.com/merbau/)と実見した[木面写真](https://www.wood-database.com/wp-content/uploads/merbau.jpg)から配色と木目形状だけを近似します。既存の導管samplerを再利用し、既定0.18 m tile／0.0025 UV relief（メートル深さではない）／metallic0。現在のカタログは930種、plain込みのギャラリーは931項目です。

- `crosshatchengraving`：交差ハッチング版画。クリーム色の紙に、低周波の明暗場に応じて段階的に増える黒の細い線（暗部は斜め1方向、さらに暗い部分は逆斜め、最も暗い部分は水平線を追加し、明暗に応じて線幅も増加）。特定の出典を引用しない作者の模式表現で、実際の彫り跡や画像内容ではありません。既定0.25 m tile／0.0015 UV relief（メートル深さではない）／metallic0。現在のカタログは929種、plain込みのギャラリーは930項目です。

- `sheetmusic`：楽譜。クリーム色の紙に、連続した細い黒の五線を持つ譜表6組（1 tileあたり4本の小節線）を並べ、各譜表は16個の音符位置のうち約8割にランダムな音高の四分音符（符頭と符幹）を持ち、譜表の間は余白です。特定の出典を引用しない作者の模式表現で、音符は旋律を成さず、音部記号、拍子記号、臨時記号、歌詞は含みません。既定0.25 m tile／0.0012 UV relief（メートル深さではない）／metallic0。現在のカタログは928種、plain込みのギャラリーは929項目です。

- `buffaloplaid`：バッファローチェック。赤い布に、横と縦それぞれ4本の幅広の縞（片方向では暗い赤、重なる部分はほぼ黒）を重ね、斜めの2/2綾織りの畝と糸ごとのノイズを持ちます。特定の出典を引用しない作者の模式表現で、実際の織り構造、ステッチ、ほつれは含まず、seedは糸のノイズだけを変えます。既定0.25 m tile／0.004 UV relief（メートル深さではない）／metallic0。現在のカタログは927種、plain込みのギャラリーは928項目です。

- `jarrah`：ジャラ（Eucalyptus marginata）の縦木面。レンガ色がかった赤褐色の地、中〜粗の質感、ごく淡い暗い縞2本、縦方向の繊維、点在する細く暗い導管の短い痕を持ちます。淡色の辺材、ガム線、縮み杢、交錯木理、塗装は含みません。実際に読んだ[Wood Database Jarrah](https://www.wood-database.com/jarrah/)と実見した[木面写真](https://www.wood-database.com/wp-content/uploads/jarrah-s-400x400.jpg)から配色と木目形状だけを近似します。既存の導管samplerを再利用し、既定0.18 m tile／0.0025 UV relief（メートル深さではない）／metallic0。現在のカタログは926種、plain込みのギャラリーは927項目です。

- `amberbubbles`：気泡入りのコハク樹脂。整数波数の正弦波で曲げた3本の流れの明暗帯を持つ滑らかなオレンジ黄色の樹脂で、14×14セルの約45%に閉じ込められた気泡（大きさと位置はランダムで、わずかに盛り上がり、より滑らかで、明るい縁とハローを持つ）と低周波のにごりがあります。特定の出典を引用しない作者の模式表現で、半透明、屈折、内包物、ひびは含みません。既定0.12 m tile／0.004 UV relief（メートル深さではない）／metallic0。現在のカタログは925種、plain込みのギャラリーは926項目です。

- `cauliflowercurd`：カリフラワーの花蕾。クリーム白の花蕾表面で、3つのスケール（10²／26²／64²セル）のドーム状の蕾が積み重なり（大きな花蕾に小さな蕾、さらに小さな凸）、蕾の頂は明るく、隙間は灰がかった米色でAO付き、表面は粗い（roughness 0.78）仕上がりです。特定の出典を引用しない作者の模式表現で、本物のフラクタルではなく、茎、葉、斑点、褐変は含みません。既定0.12 m tile／0.016 UV relief（メートル深さではない）／metallic0。現在のカタログは924種、plain込みのギャラリーは925項目です。

- `bubinga`：ブビンガ（Guibourtia属）の縦木面。ピンクがかった赤褐色の地、均一で細かい質感、わずかに暗い淡い縞3本、縦方向の繊維、点在する細く暗い導管の凹みを持ちます。紫／黒の縞、わら色の辺材、各種の杢、塗装は含みません。実際に読んだ[Wood Database Bubinga](https://www.wood-database.com/bubinga/)と実見した[木面写真](https://www.wood-database.com/wp-content/uploads/guibourtia-spp-300x600.jpg)から配色と木目形状だけを近似します。既存の導管samplerを再利用し、既定0.18 m tile／0.0025 UV relief（メートル深さではない）／metallic0。現在のカタログは923種、plain込みのギャラリーは924項目です。

- `pomegranatearils`：ザクロの種子の袋。20×20セルの、位置・大きさ・色調がずれたルビー色の丸い袋が密に重なり合い、それぞれ左上寄りに小さなハイライトを持ち、袋の間の継ぎ目は非常に暗く粗くAO付きです。特定の出典を引用しない作者の模式表現で、半透明、果汁、白い隔膜、果皮は含みません。既定0.12 m tile／0.01 UV relief（メートル深さではない）／metallic0。現在のカタログは922種、plain込みのギャラリーは923項目です。

- `pumpkinskin`：かぼちゃの皮。オレンジ色の皮に、縦に走る隆起した筋8本（わずかに曲がる）、より暗く粗くAO付きの溝（面積の約4割）、細かい縦方向の皮目、小さな疣があります。特定の出典を引用しない作者の模式表現で、へた、房の曲面、白い斑、傷は含みません。既定0.4 m tile／0.012 UV relief（メートル深さではない）／metallic0。現在のカタログは921種、plain込みのギャラリーは922項目です。

- `citruspeel`：柑橘の果皮。明るいオレンジ色の皮に、48×48セルの約9割で位置がずれた油胞のくぼみを持ち（面積の約4割がくぼみ内で、暗く、低く、粗く、AO付き）、柔らかい色むらと細かいgrainがあります。特定の出典を引用しない作者の模式表現で、房の筋、へた跡、白い綿、傷は含みません。既定0.12 m tile／0.006 UV relief（メートル深さではない）／metallic0。現在のカタログは920種、plain込みのギャラリーは921項目です。

- `coirdoormat`：ココヤシ繊維（コイア）のドアマット。濃い茶から淡い茶の硬く粗い繊維が、5×5の低周波パッチごとに4方向（水平、垂直、2つの斜め）に寝ており、パッチ間は滑らかに切り替わります。表面は粗く、隙間の陰影と細かい毛羽を持ちます。特定の出典を引用しない作者の模式表現で、1本ずつの繊維の形状、織り地、ゴムの縁、文字は含みません。既定0.3 m tile／0.006 UV relief（メートル深さではない）／metallic0。現在のカタログは919種、plain込みのギャラリーは920項目です。

- `europeanyew`：ヨーロッパイチイ（Taxus baccata）の板目面の心材。橙褐色の地、細かく均一な質感、密でうねるアーチ状の濃い褐色の成長線16本、細かい縦方向の繊維を持ちます。淡黄褐色の狭い辺材帯、紫色味、節、瘤、塗装は含みません。実際に読んだ[Wood Database European Yew](https://www.wood-database.com/european-yew/)と実見した[木面写真](https://www.wood-database.com/wp-content/uploads/taxus-baccata-300x600.jpg)から配色と木目形状だけを近似します。`douglasfir`の年輪samplerを再利用し、既定0.18 m tile／0.0025 UV relief（メートル深さではない）／metallic0。現在のカタログは918種、plain込みのギャラリーは919項目です。

- `raindropripples`：雨粒の波紋。滑らかな暗い灰青色の水面に、位置がずれた8×8個の雨粒がそれぞれ同心円状の波紋（ランダムな振幅と位相）を広げ、隣り合う波紋が重なって干渉模様になります。特定の出典を引用しない作者の模式表現で、分散・減衰則、時間変化、水しぶき、岸の反射は含みません。既定0.4 m tile／0.0022 UV relief（メートル深さではない）／metallic0。現在のカタログは917種、plain込みのギャラリーは918項目です。

- `gamedice`：ゲーム用サイコロ。6×6個の象牙色の角丸サイコロをトレイに並べ、面に黒い丸い目（標準の1〜6の配置、seedで出目が決まる）を押し込みます。サイコロの間は暗く粗くAO付きのトレイです。特定の出典を引用しない作者の模式表現で、3面が見える立体、傾きや積み重ね、塗装の厚み、摩耗は含みません。既定0.3 m tile／0.012 UV relief（メートル深さではない）／metallic0。現在のカタログは916種、plain込みのギャラリーは917項目です。

- `europeanolive`：ヨーロッパオリーブ材（Olea europaea）の板目面。淡い黄褐色の地、細かく均一な質感、細くうねるアーチ状の濃い黄褐色の成長線6本、細かい縦方向の繊維を持ちます。濃い茶〜黒に近い縞や脈、野性的な木理、瘤杢、辺材と心材の境界、塗装は含みません。実際に読んだ[Wood Database Olive](https://www.wood-database.com/olive/)と実見した[木面写真](https://www.wood-database.com/wp-content/uploads/olea-europaea-300x600.jpg)から配色と木目形状だけを近似します。`douglasfir`の年輪samplerを再利用し、既定0.18 m tile／0.002 UV relief（メートル深さではない）／metallic0。現在のカタログは915種、plain込みのギャラリーは916項目です。

- `poolcaustics`：プールのコースティクス。青いプール底に、3組の曲げた線族から作った明るく枝分かれする光の網と暗い青の網目を重ね（面積の約3分の1が明るい）、光の部分ではroughnessがわずかに低く、底には細かな粒状の起伏があります。作者が設計した見た目の近似で、物理的なコースティクスモデルではなく、特定の出典も引用せず、時間変化、屈折の光線追跡、タイル目地、水面反射は含みません。既定0.5 m tile／0.002 UV relief（メートル深さではない）／metallic0。現在のカタログは914種、plain込みのギャラリーは915項目です。

- `metalflakepaint`：メタリックフレーク塗装。深い青のクリアコート下地に、位置・傾き・明るさがランダムな丸い金属フレーク（64×64セル、約半数のセルに1枚）を散らし、面積の約21〜22%を覆います。フレークは淡いラベンダー銀色で、metallicチャンネルに部分的な金属マスク（最高で約0.68）を作り、小さな傾きで法線がきらめきます。特定の出典を引用しない作者の模式表現で、パール／カラーシフト、多角形のフレーク、クリア層の厚みは含みません。既定0.1 m tile／0.003 UV relief（メートル深さではない）／metallic factor 1（ピクセル単位のチャンネルで決定）。現在のカタログは913種、plain込みのギャラリーは914項目です。

- `tapemeasure`：巻尺。1 tileは黄色いテープの100 mm分で、100本のミリ目盛り、5 mmごとに長い目盛り、10 mmごとに最も長く太い目盛りを黄色いコートに黒に近い色で印刷し、断面は両縁が上がり中央がくぼむ余弦の弧です。特定の出典を引用しない作者の模式表現で、数字、インチ目盛り、先端フック、ケース、摩耗は含みません。既定0.1 m tile／0.03 UV relief（メートル深さではない）／metallic0。現在のカタログは912種、plain込みのギャラリーは913項目です。

- `ledmatrix`：LEDドットマトリクスパネル。48×48個の丸いLEDを5×7の文字セル8×6個に分け、各セルはseedで決まる2〜4本のランダムな擬似ストロークを点灯します（フォントではありません）。点灯LEDは明るい赤橙、消灯LEDは暗い赤、レンズは滑らかでわずかに盛り上がり、黒いプレートはより粗くAO付きです。特定の出典を引用しない作者の模式表現で、発光（emission）、スクロール、混色、RGBサブピクセルは含みません。既定0.16 m tile／0.004 UV relief（メートル深さではない）／metallic0。現在のカタログは911種、plain込みのギャラリーは912項目です。

- `barcodelabel`：バーコードラベル。1 tileがラベル1枚分の幅（左右各10モジュールの余白、Code 128 Start Bパターン、seedで決まる11モジュールのデータシンボル9個、13モジュールのストップパターン）で、白くざらついた紙に黒に近いトナーのバーを印刷し、上下は余白です。**デコードはできません**（チェックシンボル、パリティ規則、人間可読文字なし）。構造は[Wikipedia「Code 128」](https://en.wikipedia.org/wiki/Code_128)に基づきますが、スタート／ストップのビットパターンはそのページでは確認していません。既定0.14 m tile／0.0006 UV relief（メートル深さではない）／metallic0。現在のカタログは910種、plain込みのギャラリーは911項目です。

- `topographicmap`：等高線地形図の紙。暖かいオフホワイトの紙面に、7つの整数波数の正弦波で作った地形を一定幅の茶色の等高線（16段、5本ごとに太く濃い計曲線）で印刷し、ごく淡い標高の色調と紙繊維のgrainを持ちます。特定の出典を引用しない作者の模式表現で、実在の地形、標高注記、水系、道路、凡例は含みません。既定0.3 m tile／0.0015 UV relief（メートル深さではない）／metallic0。現在のカタログは909種、plain込みのギャラリーは910項目です。

- `eastindianrosewood`：イースト・インディアン・ローズウッド（Dalbergia latifolia）の縦木面。深い紫褐色の地に、より暗い黒に近いうねる縞5本、縦方向の繊維、点在する短い開放導管の凹みを持ちます。金褐色の淡い面、淡色の辺材、研磨面、交錯木理は含みません。実際に読んだ[Wood Database East Indian Rosewood](https://www.wood-database.com/east-indian-rosewood/)と実見した[木面写真](https://www.wood-database.com/wp-content/uploads/dalbergia-latifolia-1-300x600.jpg)から配色と木目形状だけを近似します。既存の導管samplerを再利用し、既定0.18 m tile／0.0025 UV relief（メートル深さではない）／metallic0。現在のカタログは908種、plain込みのギャラリーは909項目です。

- `lenticularsheet`：レンチキュラー印刷シート。tileあたり32本の平行な円柱レンズを持ち、頂は明るく滑らか、継ぎ目は低く粗くAO付きで、青銀の下地は斜めのフリップ縞と8×8の低周波画像から成ります。特定の出典を引用しない作者の模式表現で、実際の多フレームインターレース画像、視点依存アニメーション、屈折は含みません。既定0.1 m tile／0.008 UV relief（メートル深さではない）／metallic0。現在のカタログは907種、plain込みのギャラリーは908項目です。

- `europeanlarch`：ヨーロッパカラマツ（Larix decidua）の板目面。淡いピンク褐色／淡い黄褐色の早材の地に、流れるアーチ状の赤褐色の晩材年輪線12本（面積の約4分の1）と細かい縦方向の繊維を持ちます。樹脂ポケット、節、辺材と心材の境界、らせん木理、塗装は含みません。実際に読んだ[Wood Database European Larch](https://www.wood-database.com/european-larch/)と実見した[板目面写真](https://www.wood-database.com/wp-content/uploads/european-larch-s-400x400.jpg)から配色と木目形状だけを近似します。`douglasfir`の年輪samplerを再利用し、既定0.2 m tile／0.003 UV relief（メートル深さではない）／metallic0。現在のカタログは906種、plain込みのギャラリーは907項目です。

- `shagbarkhickory`：シャグバークヒッコリー（Carya ovata）の縦木面。淡い黄褐色／明るいタンの地、中程度の質感、やや暖かい薄茶のうねる縞3本、縦方向の繊維、点在する短い開放導管の凹みを持ちます。赤褐色の濃い心材が支配する面、環孔材の早材導管列、交錯／波状杢、塗装は含みません。実際に読んだ[Wood Database Shagbark Hickory](https://www.wood-database.com/shagbark-hickory/)と実見した[木面写真](https://www.wood-database.com/wp-content/uploads/shagbark-hickory-400x400.jpg)から配色と木目形状だけを近似します。既存の導管samplerを再利用し、既定0.18 m tile／0.002 UV relief（メートル深さではない）／metallic0。現在のカタログは905種、plain込みのギャラリーは906項目です。

- `monitorlizardskin`：オオトカゲ風の粒状のうろこ皮。14列×16行の六方最密配置（奇数行は半列ずらし）の丸く盛り上がったうろこで、各うろこは固有の色調を持ち明るく滑らか、うろこ間は狭く深い暗い溝（AO 0.4）、4本の横方向の濃淡帯を持つオリーブ褐色です。特定の種や出典を引用しない作者の模式表現で、腹板、背の隆起、皮のたるみは含みません。既定0.14 m tile／0.01 UV relief（メートル深さではない）／metallic0。現在のカタログは904種、plain込みのギャラリーは905項目です。

- `sitkaspruce`：シトカスプルース（Picea sitchensis）の縦木面。クリーム白から淡い黄色の地に、極めて細くほぼ真っ直ぐな超低コントラストの縦の年輪線と細かな繊維の粒を持ちます。ベアクロー杢、ピンクの色味、樹脂道、節、塗装は含みません。実際に読んだ[Wood Database Sitka Spruce](https://www.wood-database.com/sitka-spruce/)と実見した[木面写真](https://www.wood-database.com/wp-content/uploads/sitka-spruce-400x400.jpg)から配色と年輪線形状だけを近似します。`douglasfir`の年輪samplerを再利用し、既定0.12 m tile／0.002 UV relief（メートル深さではない）／metallic0。現在のカタログは903種、plain込みのギャラリーは904項目です。

- `honduranmahogany`：ホンジュラスマホガニー（Swietenia macrophylla）の縦木面。やや濃い赤褐色、中程度で均一な質感、幅広くほぼ真っ直ぐな低コントラストのサテン状の縞7本、極めてまばらで短い開放導管の凹みを持ちます。新鮮な淡いピンク褐色、経年の暗色化、交錯／波状杢、入れ子状の年輪、シャトヤンシー、塗装は含みません。実際に読んだ[Wood Database Honduran Mahogany](https://www.wood-database.com/honduran-mahogany/)と実見した[木面写真](https://www.wood-database.com/wp-content/uploads/swietenia-macrophylla-alt.jpg)から配色と木目形状だけを近似します。既存の導管samplerを再利用し、既定0.18 m tile／0.0015 UV relief（メートル深さではない）／metallic0。現在のカタログは902種、plain込みのギャラリーは903項目です。

- `woodenpalletdeck`：木製パレットの面板。1タイルにu方向に走る4枚の板があり、板間は狭く低い暗い隙間（幅約9%、AO 0.2）で、各板は固有の色調、うねる年輪線、縦方向の繊維、細かな粒を持ち、板の中心線上にタイルあたり2個の暗くわずかに盛り上がった丸い釘頭があります。完全なパレット（桁、板端、割れ、節）ではなく、釘頭はdielectricです。概念は実際に読んだ[Wikipedia「Pallet」](https://en.wikipedia.org/wiki/Pallet)の導入部に基づき、寸法と色は作者設定です。既定0.4 m tile／0.006 UV relief（メートル深さではない）／metallic0。現在のカタログは901種、plain込みのギャラリーは902項目です。

- `forgedcarbon`：鍛造カーボン風の複合材。10×10セルに、セルごと5個の位置・向き・大きさ・灰色の濃さ・重なり順がランダムな丸みのある細長いチップを、黒に近い樹脂の背景の上に敷き、各チップ内には長軸に沿った細かな織りのさざ波があり、全体は光沢（roughness約0.18–0.30）です。規則的な綾織／平織（既存の`carbonfiber`）ではなく、エポキシの厚み、金属光沢は含みません。特定の工程や出典を引用しない作者の模式表現です。既定0.2 m tile／0.0012 UV relief（メートル深さではない）／metallic0。現在のカタログは900種、plain込みのギャラリーは901項目です。

- `popcornceiling`：ポップコーン／吸音天井の吹き付け仕上げ。20×20セルそれぞれにランダムに偏った大きさ・高さの丸い粒があり、`1−Π(1−粒)`で柔らかく合成されたでこぼこの塊と、粒の間の陰になった低い谷（AO約0.55）を作り、細かな斑点の粒を持つ白っぽい色です。水染み、剥がれ、削った部分、繊維、継ぎ目は含みません。概念は実際に読んだ[Wikipedia「Popcorn ceiling」](https://en.wikipedia.org/wiki/Popcorn_ceiling)の導入部に基づき、寸法と色は作者設定で、外観のみを表し成分は含意しません。既定0.25 m tile／0.006 UV relief（メートル深さではない）／metallic0。現在のカタログは899種、plain込みのギャラリーは900項目です。

- `kilimdiamonds`：キリム風の階段状ひし形平織。64×64の緯糸セルで、16セルごとのブロックの中心と四隅に、4つの環からなる同心の階段状ひし形（濃い茶／クリーム／灰褐色／クリーム、隅のひし形は色順を入れ替え）を置き、行ごとの微小な色差、セルごとの横向きの緯糸の隆起、細かな繊維の粒を持ちます。概念は実際に読んだ[Wikipedia「Kilim」](https://en.wikipedia.org/wiki/Kilim)（平織のタペストリー織り敷物）に基づき、模様と色は作者設定で特定の意匠は引用しません。房、縁取り、パイル、スリット形状は含みません。既定0.32 m tile／0.003 UV relief（メートル深さではない）／metallic0。現在のカタログは898種、plain込みのギャラリーは899項目です。

- `teak`：チーク（Tectona grandis）の縦木面。金色から中程度の茶色の地に、真っ直ぐで不均一な粗い質感、長くうねる暗褐色の縦縞、点在する短い開放導管の凹みを持ちます。経年の暗色化、辺材、波状／交錯杢、油性の仕上げ、導管内の淡い沈着物は含みません。実際に読んだ[Wood Database Teak](https://www.wood-database.com/teak/)と実見した[木面写真](https://www.wood-database.com/wp-content/uploads/tectona-grandis.jpg)から配色と木目形状だけを近似します。既存の導管samplerを再利用し、既定0.2 m tile／0.003 UV relief（メートル深さではない）／metallic0。現在のカタログは897種、plain込みのギャラリーは898項目です。

- `blackcherry`：アメリカンブラックチェリー（Prunus serotina）の縦木面。均一な中程度の赤褐色、細く真っ直ぐな縦縞、極めて低コントラストの幅広い弱い帯、極めてまばらで短く小さな暗い導管の凹みを持ちます。辺材の帯、縮み杢、ガムの斑、塗装は含みません。実際に読んだ[Wood Database Black Cherry](https://www.wood-database.com/black-cherry/)と実見した[木面写真](https://www.wood-database.com/wp-content/uploads/prunus-serotina.jpg)から配色と木目形状だけを近似します。既存の導管samplerを再利用し、既定0.18 m tile／0.0015 UV relief（メートル深さではない）／metallic0。現在のカタログは896種、plain込みのギャラリーは897項目です。

- `golfballdimples`：ゴルフボール風のディンプル。7列×8行の六方最密配置（奇数行は半列ずらし）の丸く浅い球状くぼみで、中心はより低く暗く（AO 0.55）粗く、くぼみ間は狭く滑らかなランドで、白っぽい光沢プラスチックです。特定のボールや出典を引用しない作者の平面模式表現で、球面全体の曲率、シーム、印字は含みません。既定0.028 m tile／0.012 UV relief（メートル深さではない）／metallic0。現在のカタログは895種、plain込みのギャラリーは896項目です。

- `laptopkeycaps`：チクレット型ノートPCキーキャップ。8×8セルの方眼に、丸みのある四角（4次スーパー楕円）の暗いつや消しキーが並び、天面はわずかに凹み、縁にハイライトがあり、キー間は暗く狭い隙間（AO 0.25）です。キーごとに色調が少し異なり、細かなつや消しの粒を持ちます。特定の製品や出典を引用しない作者の模式表現で、刻印、バックライト、スイッチ機構、筐体は含みません。既定0.152 m tile／0.004 UV relief（メートル深さではない）／metallic0。現在のカタログは894種、plain込みのギャラリーは895項目です。

- `qrcodelabel`：QR風の印刷ラベル。29×29モジュールと4モジュール幅の白いクワイエットゾーンが1タイルを埋め、3隅の7×7ファインダーパターンとセパレーター、6行／列のタイミングパターン、右下の5×5アライメントパターン、seed依存の擬似ランダムデータモジュールを、繊維の粒を持つ明るい紙に濃いインクで表します。**デコード可能なQRではありません**（メッセージ・形式情報・マスク・誤り訂正なし）。構造概念は実際に読んだ[Wikipedia「QR code」](https://en.wikipedia.org/wiki/QR_code)に基づき、寸法と色は作者設定です。既定0.05 m tile／0.0006 UV relief（メートル深さではない）／metallic0。現在のカタログは893種、plain込みのギャラリーは894項目です。

- `perforatedhardboard`：茶色の焼入れ穴あきハードボード。16×16セルの方眼で各セル中心に丸く暗い不透明な穴（面積の約5.1%）とやや暗い丸い縁があり、穴の間は細かな繊維の粒と斑を持つ連続した茶色の板面です。透過する貫通穴、フック、金属板は含みません。概念は実際に読んだ[Wikipedia「Perforated hardboard」](https://en.wikipedia.org/wiki/Pegboard)に基づき、実物写真や規格は引用せず、穴ピッチ・穴径・色は作者設定です。既定0.4 m tile／0.004 UV relief（メートル深さではない）／metallic0。現在のカタログは892種、plain込みのギャラリーは893項目です。

- `westernredcedar`：ウエスタンレッドシダー（Thuja plicata）の縦木面。赤みのある金褐色の地に、細く平行で低コントラストの暗い年輪線が、ゆるやかにうねります。辺材、ランダムな暗い帯、節、塗装、樹脂道は含みません。実際に読んだ[Wood Database Western Red Cedar](https://www.wood-database.com/western-red-cedar/)と実見した[木面写真](https://www.wood-database.com/wp-content/uploads/thuja-plicata.jpg)から配色と年輪線形状だけを近似します。`douglasfir`の年輪samplerを再利用し、既定0.12 m tile／0.003 UV relief（メートル深さではない）／metallic0。現在のカタログは891種、plain込みのギャラリーは892項目です。

- `chesterfieldleather`：チェスターフィールド風のダイヤ型ボタン留め茶色レザー。6×6セルのタイルで1セルおきの中心に小さなボタン（1タイル18個）、斜めのひだが膨らんだ菱形クッションを囲みます。ひだは暗くAOが低く、頂部は明るく滑らかで、細かな革の粒と低周波のしわを持ちます。特定の製品や出典を引用しない作者の模式表現で、金属ボタン面、縫い目、ひび割れはありません。既定0.5 m tile／0.012 UV relief（メートル深さではない）／metallic0。現在のカタログは890種、plain込みのギャラリーは891項目です。

- `longleafpine`：ロングリーフパイン縦木面。淡い黄白色の早材と細く高コントラストな橙褐色の晩材縞が、ほぼ平行でわずかにうねる年輪を作ります。樹脂道、節、全面赤褐色の心材、塗装は含みません。実際に読んだ[Wood Database Longleaf Pine](https://www.wood-database.com/longleaf-pine/)と実見した[木面写真](https://www.wood-database.com/wp-content/uploads/longleaf-pine.jpg)から配色と縞形状だけを近似します。`douglasfir`の年輪samplerを再利用し、既定0.12 m tile／0.003 UV relief（メートル深さではない）／metallic0。現在のカタログは889種、plain込みのギャラリーは890項目です。

- `douglasfir`：ダグラスファー板目縦面。淡い橙褐色の早材と暗い橙褐色の晩材年輪が、同心楕円の周りに尖ったカテドラル状の弧を作ります。節、樹脂ポケット、辺材／心材境界、塗装、柾目の平行年輪は含みません。実際に読んだ[Wood Database Douglas-Fir](https://www.wood-database.com/douglas-fir/)と実見した[板目の見本写真](https://www.wood-database.com/wp-content/uploads/pseudotsuga-menziesii.jpg)から配色と年輪形状だけを近似します。専用の周期C1年輪sampler、既定0.2 m tile／0.0035 UV relief（メートル深さではない）／metallic0。現在のカタログは888種、plain込みのギャラリーは889項目です。

- `blackwalnut`：濃いチョコレート褐色のブラックウォルナット板目縦面。暗い長い縦縞、直から緩やかにうねる木目、まばらで短い開放導管の凹みを持ちます。紫／灰色味、辺材、縮み杢／瘤／バーズアイ、塗装、半環孔材の導管サイズ勾配は含みません。実際に読んだ[Wood Database Black Walnut](https://www.wood-database.com/black-walnut/)と実見した[板目の全板スキャン](https://www.wood-database.com/wp-content/uploads/juglans-nigra-full.jpg)から配色と木目方向だけを近似します。既定0.16 m tile／0.0025 UV relief（メートル深さではない）／metallic0。現在のカタログは887種、plain込みのギャラリーは888項目です。

- `to92packagefaces`：回転／微小移動したTO-92模式図４個を2×2配置。艶消し黒のD形本体（直線側面、平底、上半楕円ドーム）、等間隔で平行な直線リード３本（広い肩／細い尾）で、タブ・穴・印字なし。脚M1、本体／背面M0、C1混合、高さは背面.02 < 脚.44 < 本体.68。寸法参考のみとしてダウンロード・実見した[onsemi 98ASB42022B、CASE29-11 Issue AM、2007-03-09、PDF６ページ／図面１ページ](https://www.onsemi.com/pdf/datasheet/p2n2222a-d.pdf#page=6)を引用し、精密CADや組成・電気特性を主張しません。既定0.08 m tile／0.0042 UV relief（メートル深さではない）／metallic1、明示0はfactorのみ変更しmask不変。512推奨、32は粗いプレビュー。現在の目録886種類、plain込みgallery887項。

- `rcafemalefaces`：RCA／Cinchメス正面の模式表面。広い丸い黒座金４個に、小さい丸い金属肩、さらに小さい六面の前端筒、暗い絶縁環と奥まったメス接点環／不透明な暗い底を配置します。BNCバヨネット突起はなく、大きい後部ナットを前面には置きません。中性灰色では実際の金の光学を省き、形状・凹凸・色は作者の近似です。接頭ファミリーの変化であり、電気／音声／RF／嵌合／EMC／安全認証ではありません。当時879種類。
- `rj45femalefaces`：RJ45型8P8Cメス正面の模式表面。薄い矩形金属シールド４個、艶消し黒の絶縁内枠と低い主空洞に、片側の狭い段付きラッチ延長部と反対側の独立した長い金属接点８個を１列に配置します。LEDはありません。中性灰色では金めっきの光学を省き、作者の配置は精密CADやEthernet／PoE／Cat／速度／電気／EMCのシミュレーション・認証ではありません。
- `usbcfemalefaces`：USB-Cメス正面の模式表面。丸みのある扁平な金属開口４個に、低い艶消し暗色の底、中央の薄い絶縁舌と各12個の金属接点２列（各面24個）を配置します。既存の４接点矩形ソケットとは別の材質です。中性灰色の近似で、金めっきの光学・実体空洞・電気・USB速度／PDのシミュレーションや安全認証ではありません。
- `iecc6inlets`：IEC C6オス入口正面の模式表面。平らな黒いPA6フランジ４枚に三つ葉形の共通空洞、上１個・下２個の丸い金属ピン端面と皿形の取付穴２個を配置します。ピンはフランジより低く、C8の凸保護枠はありません。C5メス穴・C14の平刃・商用電源や安全規格のシミュレーションではありません。
- `iecc8inlets`：IEC C8オス入口正面の模式表面。黒いPA6フランジ４枚に、カプセル形の保護枠と上下の丸いV形くびれを持つ８字形の低い空洞を配置し、丸い金属ピン端面２個を底より高く枠より低く保ちます。C7メス穴・C14の３枚刃・商用電源や安全規格のシミュレーションではありません。
- `din5femalefaces`：標準DIN５極メス正面の模式表面。非金属の黒いPBTフランジ４枚に、３つの取付穴、凸円形縁、上部キー切欠き・下部の連結リブと中央が膨らんだ５つの長いメス穴を配置します。低い穴底は不透明な内部代用で、mini-DIN・実体穴・MIDI／電気シミュレーションではありません。
- `xlrfemalefaces`：XLR３極メス正面の模式表面。Dサイズの角丸矩形金属フランジ４枚に、左上・右下の取付穴、凸円形縁、黒い絶縁部、上部ラッチと上開き内環を配置します。上２個・下中央１個の凹んだ穴底は不透明な内部代用で、オスピン・実体穴・音声／電気シミュレーションではありません。
- `bncfemalefaces`：BNCメス正面の模式表面。低い金属フランジ４個に、高い円筒縁、対向する２つの突起、白い絶縁環と簡略化した金属接点環・不透明な低い穴底を配置します。中性灰色PBRで、オスピン・実体穴・高周波シミュレーションではありません。
- `iecc14inlets`：IEC C14オス入口正面の模式表面。黒いキー形保護枠４個の内部に、上１枚・下２枚の金属端面を配置し、低い底より高く、枠より低く保ちます。C13メス穴・背面の穴付き端子・商用電源シミュレーションではありません。
- `dsubsocketfaces`：D-sub９極メス正面の模式表面。金属フランジ４枚に、閉じた凸D形枠、黒い絶縁部、５／４列の凹んだ９ソケットを配置します。突き出た金色ピン・背面のはんだカップ・透明な実体穴・接続可能な回路ではありません。
- `topadjusttrimmers`：上面調整トリマの模式表面。非金属の長方形ケース４個に、隅寄りの小さな円形金属ねじと１本の全幅直線止まり溝を配置します。溝底も金属で、貫通穴・中央の大型ねじ・可変回路シミュレーションではありません。
- `crownprobetips`：４点クラウン接触プローブ端面の模式図。円形金属面９個に、それぞれ４つの丸めた接触突起、谷、低い中央金属カップを配置します。十字ねじ溝・歯車・キャッスルナット・貫通穴・ばねや電気特性のシミュレーションではありません。
- `piezodiaphragms`：圧電振動板の表面模式図。平らな金属板４枚に、象牙色のセラミック露出縁と単一の中央金属電極を配置します。セラミックの穴・スピーカーコーン・レンズ・分割帰還電極・回路や振動や音声のシミュレーションではありません。
- `castellatedboards`：PCB端面の半穴を模式化した表面。深緑の非金属基板４枚それぞれに、７個ずつ４列の外へ開いた凹みと淡い銀色の金属ランドを配置します。閉じた円形ビア・QFN端子・キャッスルナット・実体の穴・PCB製造や電熱特性の認証ではありません。
- `qfnlandpads`：QFN底面の平端子と中央露出パッドの模式表面。暗い非金属封止材４個それぞれに、７個ずつ４列の銀色平端子と独立した中央パッドを配置します。BGAドーム・PCB放熱ビア・pinout・常時接地・寸法や熱電特性の認証ではありません。
- `radiolariandiscs`：放散虫骨格の赤道断面模式図。象牙色の同心環骨格４枚に、中央室、6／12／18室の環状列と６本の短い周縁棘を表します。不透明な非金属表面で、外側の篩板・蜘蛛の巣・実体の穴・種同定や顕微鏡スケールの再現ではありません。
- `bgasolderballs`：BGAはんだボール配列の模式表面。暗い非金属の正方形基板４枚それぞれに、銀色の丸い金属ドームを13×13個、欠けなく等間隔で配置します。環状ベアリング・ボールチェーン・端子pinout・JEDEC寸法・合金・リフローの認証ではありません。
- `pigskinleather`：豚革の毛穴群を模式化した表面。暖褐色のつや消し地に、丸く暗い凹み３個を不規則な三角形にまとめた64群を配置します。不透明な非金属で、単独の三角穴・ダチョウ革の隆起・均一なパンチ穴・素材の真贋認証ではありません。
- `trianglesocketheads`：TA三角穴付き丸頭ねじの模式表面。銀灰色の鋼頭25個に、３本の直辺と閉じた平らな金属底を持つ三角穴を表し、粗い灰色の非金属地に配置します。Y字溝・曲辺TP3・実体の貫通穴・寸法／防犯認証ではありません。
- `diatomvalves`：舟形珪藻の外殻面の模式模様。象牙色の披針形４枚に、縦長の微孔列、平らな中央の空白と、中央で分かれ末端が同側へ曲がる２本の縫線を表します。不透明な非金属表面で、実体の穴・完全な二殻細胞・顕微鏡スケールの再現ではありません。
- `chitonshells`：ヒザラガイの背甲を模式化した模様。楕円の９組それぞれに８枚の殻板、向きのある７本の重なり継ぎ目と粗く暗い外套帯を表します。暖褐色の不透明な非金属表面で、可動殻板mesh・巻き込み動作・生体力学モデルは含みません。
- `leafstomata`：葉の気孔と孔辺細胞の模式表面。腎臓形の細胞25対が暗い凹部を囲み、両端の少し低い接合部も葉面より高く保ちます。緑色の不透明な非金属模様で、実体の通気孔・完全な表皮再構築・動的な蒸散モデルではありません。
- `watermelontourmaline`：ウォーターメロントルマリンの断面モザイク。角の丸い三角形16枚の桃色の芯・淡灰色の帯・緑の外周を同じ研磨面に表し、粗い灰色地に配置します。正面照明向けの不透明な色表現で、透過・屈折・多色性・宝石鑑別は含みません。
- `cuttlebone`：コウイカの甲の隔板・波状壁の模式断面。高さの異なる層と、位置・曲がる向きの異なる細い壁を、暗い凹面上に暖白色の粗い非金属で表します。完全に不透明で、三次元迷路の再構築・実体の穴・生体力学モデルではありません。
- `pallasite`：研磨したパラサイト隕石。オリーブ緑・蜂蜜色の非金属結晶と連続する銀灰色の鉄ニッケル地をほぼ平らに表し、結晶内に細い暗い亀裂を置きます。正面照明向けの不透明PBR近似で、逆光透過・厳密な合金光学・隕石認証は含みません。
- `gosperinlay`：三階ゴスパー曲線の真鍮色象嵌。粗い紺色の非金属地に、同じ長さの金属線343本を分岐せずにつなぎ、両端だけを丸く仕上げます。有限の開いた曲線で、閉じたMoore溝・極限の空間充填集合・実体の象嵌meshではありません。
- `vogelspiral`：黄金角の葉序円板モザイク。同じ大きさの青緑・セージ・象牙色の平らな円板97枚を粗い灰色地に配置します。半ステップの半径オフセットを持つ作者Vogel模様で、連続螺旋線・接するDoyle円・植物シミュレーションではありません。
- `langtonsant`：ラングトンのアリ1024ステップの固定タイル模様。淡い暖色の32×32盤に122個の濃い光沢マスと、終点・向きを示すクリーム色の凸三角を配置します。白で左・黒で右へ曲がる作者スナップショットで、QRコードやリアルタイムシミュレーションではありません。
- `pentominotiles`：12種類の自由ペントミノ釉薬タイル。1枚は辺でつながる5マス、6×10の各区画に12形を1枚ずつ、全体で紺・青灰・象牙色の180枚を配置します。粗い目地と内部格子線のない作者固定模様で、対話型パズルや正五角形敷石ではありません。
- `pythagorastree`：有限ピタゴラス樹の釉薬タイル模様。赤褐色から象牙色へ薄くなる31枚の正方形を5世代に分岐させ、4本の木を配置します。粗い目地上の非金属模様で、二サイズ平面敷き・無限フラクタル・実際の樹木ではありません。
- `ichinghexagrams`：六十四卦の浮彫り模様。粗いクリーム色の地に実線・破線を6本ずつ並べ、576本の平らな丸肩バーで64図形を表現します。作者独自の二進順で、文王卦序・占い・フォントではありません。
- `apollonianmosaic`：アポロニウス相接円モザイク。青緑・セージ・象牙色の釉薬円盤をデカルト反射で2段階に詰め、各模様に大きさの異なる19個の相接円を配置します。粗い目地上の有限・不透明・非金属の作者模様で、無限フラクタルや施工仕様ではありません。
- `prismaticpentagonaltiles`：柱状五角（V3.3.3.4.4）の敷石模様。青灰色・セージ色・象牙色の家形釉薬タイルが上下交互に並び、底に隣接する90°の角が2個、屋根側に120°の角が3個あります。不透明・非金属の作者近似で、寸法や施工仕様の認証は含みません。
- `floretpentagonaltiles`：花形五角（V3.3.3.3.6）のキラルな敷石模様。緑・オリーブ・象牙色の釉薬五角タイルが6枚の花弁を作り、各タイルに60°の角が1個、120°の角が4個あります。不透明・非金属の作者近似で、寸法や施工仕様の認証は含みません。
- `snubtrihexagonaltiles`：スナブ三六角（3.3.3.3.6）のキラルな敷石模様。藍色の正六角形と象牙色・黄褐色の正三角形が粗い目地に並び、各頂点で4個の三角形と1個の六角形が接します。不透明・非金属の作者近似で、実寸や施工仕様の認証は含みません。
- `deltoidaltrihexagonaltiles`：凧形三六角（V3.4.6.4）敷石タイルで、粗い灰色の目地の上にバーガンディ・ローズ・アイボリーの3色の釉薬凧形タイルを並べ、各六角セルを辺の中点へ向かう6本のスポークで6枚の凧形に分けます。不透明な非金属の作者近似で、実際のタイル寸法や施工仕様の認証は含みません。（既存の`kisrhombilletiles`の30-60-90三角形や`trihexagonaltiles`の六角形と三角形とは異なります。）
- `soroban`：7本棒のそろばんで、枠と梁の間にある竹のような棒の双円錐形の木珠が4567890（ページの図説1234567890の下7桁）を示し、梁には3本おきに点があります。不透明な非金属の作者近似で、実際のそろばんの寸法・材料・教育上の正確さの認証は含みません。（既存の`seedbeads`のシードビーズとは異なります。）
- `ean13label`：EAN-13バーコードラベルで、淡い紙面にWikipediaページの例の番号4 003994 155486の30本の黒いバーを印刷し、スタート・センター・エンドのガードバーを長くしています。不透明な非金属の作者近似で、GS1仕様・スキャナ可読性・印刷品質の認証は含みません。（既存の`papertape`の穿孔紙テープとは異なります。）
- `embossedbraille`：エンボス点字紙で、クリーム色の紙面に7×4個の点字セルを並べ、滑らかに盛り上がった丸い点でaからzの文字を順に綴ります（wは省き、末尾に空白セルが3つ）。不透明な非金属の作者近似で、紙の材料・点間隔の規格・可読性の認証は含みません。（既存の`tactilepaving`の規則的な截頭円錐の警告突起とは異なります。）
- `rule30`：Rule 30のセル・オートマトンで、33×33マスのタイルに、Wolframの基本セル・オートマトンRule 30が最上段中央の黒い1マスから成長する33世代（時間は下向き）を表示します。黒いマスは盛り上がった光沢のある暗い正方形、白いマスは低く粗い淡色の正方形で、間に凹んだ細い溝があります。不透明な非金属の作者近似で、材料・寸法規格・乱数性の認証は含みません。（既存の`sierpinskicarpet`や`perfectmaze`などの模様とは異なります。）
- `perfectmaze`：シード付きの完全迷路で、8×8マスの迷路です。凹んだ暗く滑らかな通路が淡く粗い盛り上がった壁の間を通り、64マスが63本の連結でつながるため、すべてのマスに到達でき、ループはなく、シードごとに別の迷路になります。不透明な非金属の作者近似で、材料・寸法規格・難易度の保証は含みません。（既存の`moorecurve`の単一の閉じた溝の輪とは異なります。）
- `sevensegment`：7セグメント表示パネルで、暗いガラス面に5×2の桁で0123456789を並べ、一般的な7セグメントの図形に沿って琥珀色の面取りした棒を点灯させ、消えた区画は暗い残像にします。不透明な非金属の作者近似で、LED/LCD部品・発光・標準規格は含みません。（既存の`chipresistors`の白い103の印字とは異なります。）
- `ulamspiral`：ウラムの螺旋で、15×15マスのタイルに整数1〜225を正方形の螺旋（中央が1）として並べ、素数のマスに光沢のある暗い盛り上がった円頂を置き、粗い淡色の非金属の石板と凹んだマス目の溝の上に載せます。不透明な非金属の作者近似で、材料・標準規格・数学的な認証は含みません。（既存の`tactilepaving`の規則的な截頭円錐の突起や`dominoes`の0〜6の凹みとは異なります。）
- `papertape`：穿孔紙テープで、1インチ幅・0.1インチ間隔の10文字行×9孔トラックの8レベル紙テープです。淡い非金属の紙にASCII文字列PAPER TAPEを孔で符号化し（ビット7は偶数パリティ）、狭い側に寄った小さな送り孔の列があり、孔の中には暗い裏地が見えて孔のほうが粗くなります。不透明な非金属の作者近似で、材料・紙厚・半透明・標準規格は含みません。（既存の`punchcard`の2×4カード・矩形穿孔とは異なります。）
- `moorecurve`：ムーア曲線の溝のタイルで、8×8マスの淡い非金属のタイルに、閉じた連続する暗い凹みの溝がすべてのマスを巡ります（回転した四つのヒルベルト曲線によるハミルトン閉路）。溝は面より粗くなります。不透明な非金属の作者近似で、材料・彫刻工程・寸法規格は含みません。（既存の溝、迷路、タイルのプリセットとは異なります。）
- `sierpinskicarpet`：シェルピンスキーのカーペットの石タイルで、81×81マスのタイルに四段階の再帰的な凹んだ正方形（27マスが1個、9マスが8個、3マスが64個、1マスが512個）が並び、大きいものほど深く暗く、タイルは継ぎ目なく繰り返します。不透明な非金属の作者近似で、極限集合ではなく有限の四段階近似であり、石の種類・彫刻工程・寸法規格は含みません。（既存の穿孔、パネル、点食のプリセットとは異なります。）
- `chladnifigure`：クラドニ図形で、暗く滑らかな非金属の板の上に、定在波の節線に沿って淡い砂が集まります。砂はわずかに盛り上がって粗く、線の模様はUVタイルと正確に繰り返します。不透明な非金属の作者近似で、実際の板の振動モード、材料、砂粒の物理は模擬しません。（既存の砂、石、穿孔板のプリセットとは異なります。）
- `kisrhombilletiles`：V4.6.12のkisrhombilleタイリングで、各六角形を12個の合同な30-60-90の直角三角形に分け、濃い青緑とクリーム色の釉薬三角形が中心の周りに交互に並びます。すべての直線は30°間隔の6方向の平行線に乗り、細い面取りの縁と粗い灰色の目地で囲まれます。不透明な非金属の作者近似で、タイルの厚み・釉薬の化学・寸法規格は含みません。（既存の`rhombille`、3.6.3.6の六角形と三角形、直角二等辺三角形の`righttriangletiles`とは異なり、`truncatedtrihexagonaltiles`の双対です。）
- `truncatedtrihexagonaltiles`：4.6.12の切頂三六角タイリングで、クリーム色の釉薬十二角形、60°ずつ向きの異なる3方向の藍色の小さな正方形、ラベンダー色の正六角形が、細い面取りの縁と粗い灰色の目地で囲まれます。不透明な非金属の作者近似で、タイルの厚み・釉薬の化学・寸法規格は含みません。（既存の3.12.12の十二角形、六角形と三角形、`rhombitrihexagonaltiles`のタイルとは頂点の型が異なります。）
- `elongatedtriangulartiles`：3.3.3.4.4の長三角タイリングで、テラコッタ色の直立した正方形の列とクリーム色の上向き・下向き正三角形の列が交互に並び、正方形の列は半辺ずれ、細い面取りの縁と粗い灰色の目地で囲まれます。不透明な非金属の作者近似で、タイルの厚み・釉薬の化学・寸法規格は含みません。（頂点の内容は`snubsquaretiles`と同じ三角形3つと正方形2つですが順序が異なり、既存の六角形と三角形のタイルとも異なります。）
- `rhombitrihexagonaltiles`：3.4.6.4の菱形三六角タイリングで、クリーム色の釉薬六角形、60°ずつ向きの異なる3方向のスレートブルーの正方形、紺色の正三角形が、細い面取りの縁と粗い灰色の目地で囲まれます。不透明な非金属の作者近似で、タイルの厚み・釉薬の化学・寸法規格は含みません。（既存の`snubsquaretiles`、六角形と三角形、3.12.12の十二角形タイルとは頂点の型が異なります。）
- `snubsquaretiles`：3.3.4.3.4の変形正方形タイリングで、±15°ずつ交互に回した濃い青の釉薬正方形とクリーム色の正三角形が、細い面取りの縁と粗い灰色の目地で囲まれます。不透明な非金属の作者近似で、タイルの厚み・釉薬の化学・寸法規格は含みません。（既存の六角形と三角形、カイロ五角形、直角三角形のタイルとは頂点の型が異なります。）
- `starfish`：粗い灰色の砂地に並ぶオレンジ色の五腕のヒトデで、丸い中央盤から根元から先端へ細くなる5本の腕が伸び、腕の角度と長さにわずかな不規則さがあり、腕には隆起した背筋と3列の小さな突起があります。不透明な非金属の作者近似で、種の同定・管足・棘・多孔板・実寸・海洋生物学のデータは含みません。
- `fishscaleshingles`：半円形の下端の丸みを12個ずつ持つ8段のベージュの魚鱗状金属瓦で、1枚が2つの丸みを持ち、段ごとに半分ずらして重ね、下の段に影が落ち、瓦の間に細い継ぎ目があります。不透明な非金属の作者近似で、エンボス・金属反射・実際の重なり形状・規格の認証は含みません。（既存の`scallopedslate`・`fishscaletiles`と同じ扇形重ね貼りの系統に属する変種です。）
- `waffleweave`：14×16の固定格子に並ぶ冷たい灰白色の丸い浮き糸の畝が、凹んだ小さな正方形のポケットを囲み、横方向の畝がやや高く、交点が小さな結び目のように盛り上がります。不透明な非金属の作者近似で、実際の経緯の交錯・布の物理・吸水性・織物規格の認証は含みません。（既存の`wafflecloth`と同じワッフル織物の系統に属する、より細かい変種です。）
- `halite`：粗い淡灰桃色の塩地に、ランダムに回転した正方形の縁と、段階的に沈む二つの同心正方形テラスを持つ乳白色のホッパー立方体面を表現します。不透明な非金属の作者近似で、結晶寸法の測定・透明性や溶解の物理・完全な立方体メッシュ・鉱物の認証は含みません。（既存の`bismuthhoppers`と同じ回転した入れ子正方形ホッパーの系統に属する、非金属の塩結晶の変種です。）
- `calcite`：粗い暗褐色の鉱物地に、約75度の平行な辺を持つ乳白色の斜方形の板と入れ子状の平行な段を表現します。不透明な非金属の作者近似で、劈開角の測定・透明性や複屈折・完全な菱面体メッシュ・鉱物の認証は含みません。
- `flangenuts`：円形の円すいフランジの上に、六つの平らな側面を持つ面取り六角ナットと開いた丸穴を表現し、粗い暗色の鋼地が見えます。マップ全体が金属で、座面の鋸歯・完全な3D・内ねじ・DIN／ISO認証は含みません。
- `capnuts`：粗い暗色の鋼地に、六つの平らな側面・削った角・閉じた円形ドームを持つ六角袋ナットを表現します。Hex Nutsの貫通穴とは異なりマップ全体が金属で、完全な3D・内ねじ・DIN／ISO認証は含みません。
- `bedfordcord`：カーキ色の経方向織り込み畝、連続した細い溝、隣の畝と半ピッチずらした平らな緯方向の短い面を表現します。不透明な非金属表面近似で、実際の経糸・詰め糸の交錯、布の物理、綿の規格や産地の認証は含みません。
- `staurolite`：淡く粗い石基に濃褐色の60度交差双晶。平行な側面と平らな鈍端を持つ四本の腕は、中央を二重に積まず一つの上面を共有します。不透明な非金属近似で、完全なメッシュ・屈折・片岩の片理・鉱物や化学の認証は含みません。
- `dowelpins`：銀色の頭なし中実円柱ダウエルピンの側面。丸い端と反対側の導入面取り、浅い円柱状の盛り上がりを表現し、鋼面と不透明な非金属地を分離します。完全なメッシュ・圧入物理・荷重やDIN／ISO認証は含みません。
- `europeanbeech`：淡い桃褐色の細かな直木目のヨーロッパブナ。均一に散在する浅い縦導管と小さく平らな放射組織模様を表し、導管メッシュ・樹種鑑定・防水性・構造や産地の認証は含みません。
- `habotai`：真珠白の細密な羽二重平織り。同色の経緯糸、浅い凹凸と柔らかな光沢を表現する不透明な表面近似で、透過・しわや繊維メッシュ・布の物理・繊維や重量の認証は含みません。
- `azurite`：深い青色の幅広い斜端板柱状結晶面。浅い縦筋と平行三枚の結晶群が暗く粗い石基から盛り上がります。不透明な非金属材質で、完全な結晶メッシュ・透過屈折・鉱物や銅の安全認証は含みません。
- `whiteoak`：暖かいオリーブ褐色の柾目ホワイトオーク。長い横方向の放射組織模様は木面と同じ高さで、縦の導管だけが浅くくぼみます。樹種鑑定・防水性・構造性能の認証は含みません。
- `clevispins`：銀色の短い両肩付き頭、ねじ無しの浅い丸みの軸、反対端の丸穴を持つ連結ピンの側面。鋼と不透明な非金属地を分離し、止め具の組立・完全な通孔メッシュ・荷重や規格認証は含みません。
- `whipcord`：濃いグレーの太い単斜畝と同色の経緯糸、連続する3ピックの浮き糸。細いギャバジン、二重畝のキャバリーツイル、横畝のグログランとは異なり、繊維メッシュ・衣服物理・性能認証は含みません。
- `vanadinite`：淡く粗い鉱物地に、橙褐色の六角形の結晶縁と、内側へくぼんだ小さな平らな六角底を表現。中実の平頂面とは異なり、柱全体・透過屈折・鉱物や鉛の安全認証は含みません。
- `tabwashers`：銀色の平らな円環に、一つの丸穴と外向きの直端タブを表現。鋼面と不透明な非金属の穴底・地を分離し、割り形・球面・皿形、曲げ・組立・緩み止め性能認証は含みません。
- `whiteash`：淡い暖褐色のホワイトアッシュ。平らな直線木目の早材帯に太い導管が集まり、晩材は細く疎らです。導管だけをくぼませ、木口の丸穴、隆起木目、樹種・物性認証は含みません。
- `gibheadkeys`：銀色で中実のこう配付き頭付きキーの平坦な側面輪郭。外端を斜めに削った頭、一段の階差、約1:100の直線状キー本体を表現します。両端が丸い平行キーや半月形ウッドラフキーとは異なり、完全な3Dキー、はめあい、抜き取り動作、規格適合認証は含みません。
- `grosgrain`：灰青色のグログラン。細かい経糸と丸く盛り上がる単独の横畝が一本ずつ交差し、畝の両側へ滑らかに低下します。平たい Faille や二本組の Ottoman とは異なり、帯端 mesh・透過・布物理は含みません。
- `pyromorphite`：黄緑色の緑鉛鉱の平らな六角形の結晶端面を、淡く粗い鉱物地に隆起として表現。大きさと向きが異なり、柱状・樽状結晶全体、透明光学、鉱物・鉛の安全認証は含みません。
- `kingwood`：磨いた深赤褐色の心材に、幅の異なる紫黒色の細い縦縞を平らに表現。疎らな導管だけをくぼませ、淡い Tulipwood や隆起した木目、樹種・合法調達の認証とは区別します。
- `faille`：アイボリーのファイユ平織。細かい経糸と幅広で平たい単独の緯畝が一本ずつ交差します。Ottoman の二本組の畝ではなく、透過・ドレープ物理は含みません。
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

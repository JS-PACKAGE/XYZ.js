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

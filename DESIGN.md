# XYZ.js 設計與階段邊界

## 已驗收基礎：P01–P08

`xyz.js` 套件版本設定為 `1.1.0`，P01–P08 驗收證據見 `ACCEPTANCE.md`，不代表已發佈 npm 或已驗證所有瀏覽器。正式路徑是 `src/index.ts`（統一公開入口）→ `packages/core` 的 Game／Clock → `packages/graphics` 的 Renderer；範例不建立第二套渲染器。

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
- P07 已整合 OPM.js v1.1.0 官方完整 dist／LICENSE／release checksum，build 原樣複製 vendor。八個獨立 OPM instance 各保留一個聲部，總預算含 release，overflow 只 hard-reset 最舊 SFX 的 worklet；不影響 BGM，也不修改官方 DSP。代價是八個 AudioContexts/worklets。首次手勢 unlock 前不建 AudioContext；bounded lookahead 避免填滿官方 256-event queue；Scene 清理取消非 persistent 音訊。
- P08 已完成完整 Error hierarchy、可調等級 logger、loss 後 resize 拒絕與 cleanup 邊界、六個驗收範例及 1,000 Sprite benchmark。實際 device/context loss 使 Game paused 並拒絕 resume；沒有自動 recovery。各階段獨立 `[Pxx]` commit，不 push。Safari／Edge／Firefox、實體 gamepad、真實背景分頁／BFCache 矩陣、跨螢幕 DPR 與 driver reset 仍未認證。
- 後續優化保持公開 API：World 按需穩定壓縮 Systems、WebGPU 只在 logical viewport 改變時重傳對應 uniform；Keyboard 在 focus 轉入 editable 後仍處理既有按鍵釋放。時間量測未證明 CPU／FPS 改善，見 ACCEPTANCE，不以 API call 減少冒充 throughput 提升。
- 安全維護：圖片與音訊共用內部 bounded response reader，依實際 response stream bytes 計數，不信任 Content-Length。JSON 在 byte cap 後解析並檢查 notes 上限；Texture 在解碼後檢查尺寸／像素且超限釋放。依使用者選擇保留所有瀏覽器支援圖片格式，因此不宣稱防止解碼瞬間放大或提供全域 cache 預算。

## v1.1 新增能力

- Text2D 繼承 Sprite，Canvas2D 只負責 rasterization，輸出 Texture 仍走正式 renderer；不用 DOM overlay 假冒文字繪製。Style 固定、內容非同步更新，latest-request-wins 並釋放過期結果；自有貼圖與外部借用貼圖分開管理，字型需使用者預先載入。尺寸／像素在完整 canvas 配置前檢查。
- SceneTimers 使用同一 Game Clock 的模擬 delta，在 subclass update 前推進；候選 Scene／paused／hidden 時不推進。動態 Set 維持註冊順序，tick 不複製整份 timer 列表；新工作延至下一 tick，repeat 每 tick 至多一次、跳過漏掉的週期。Handle 取消清除 callback 參照，Scene teardown 先銷毀 timers。同步 callback exception 走既有 fatal frame error。
- Pong 的 Text2D／timers 整合不新增 renderer、不加 runtime dependency，不實作物理、文字動畫或編輯器；3D 動畫另屬 P10。既有 v1.0 tag／release 不改動。

## three.js 參考擴充：P09–P12

- Object3D／Group／Mesh 共用 local Transform3D，worldMatrix 依祖先變換組合，worldVisible 包含祖先可見性。Scene 註冊整個子樹，禁止 cycle／跨 Scene ownership；移除解除註冊，destroy 清理子樹。
- Scene 可替換 PerspectiveCamera／OrthographicCamera，提供 lookAt；OrbitControls 只接管指定 Canvas 並需 destroy。Raycaster 使用世界距離精確雙面三角形交點，涵蓋階層、instance 與變形後的 skin。
- GLTFLoader 支援受預算限制的 glTF 2.0／GLB triangles、TRS、材質／textures／skins、morph targets（POSITION／NORMAL、weights animation）與 transform clips；必要 extension、其他 topology 明確拒絕。Morph 為 CPU 端，於 renderer／Raycaster 讀 vertices 前由 `Mesh.updateDeformation()` 重算。GLTFAsset.dispose 由應用負責，Scene 清理不代替 loader-owned textures 的釋放。
- Game 在 timers 後、使用者 update 前推進 scene.animations，使用同一模擬 delta；mixer 依 action 插入順序寫入，不提供 blending。CPU skinning 更新自有 geometry，vertex-only markUpdated 通知 GPU cache，index topology 不可變。
- WebGPU／WebGL2 共用 PBR slots、8 point＋8 spot 上限、方向光 3×3 PCF shadows、indexed instancing 與 HDR offscreen→exposure／ACES／9-tap bloom→2D。WebGL2 缺 EXT_color_buffer_float 時啟用 HDR 後處理明確失敗；不含 point／spot shadows。後續加入 EnvironmentMap：equirect 的 SH9 diffuse irradiance＋roughness 模糊 mip 的 split-sum specular（僅 PBRMaterial，取代 ambientLight）與 skybox，兩 backend 共用 CPU 預處理與 shader 公式。
- v1.4 之後的 3D／執行期補強（皆為 additive，細節與驗證範圍見 TECHNICAL）：視錐剔除（保守 bounding sphere，skinned／instanced／morph 不剔除，shadow caster 仍進 shadow pass）、glTF 常用 extension（emissive strength、unlit 近似、texture transform 烘進 UV0、lights_punctual 以 `asset.lights` 回傳）、`scene.fog`、WebGPU 4× MSAA（`Game.create({antialias})`）、半透明由遠到近排序、`scene.effects3D`（重用 PostProcessor2D ABI，只處理 3D 影像）、`FirstPersonControls`（Pointer Lock）、`graphics.stats`，以及由 `ResilientRenderer` 提供的 WebGL2 context／WebGPU device 遺失復原（Game 送出 `graphicslost`／`graphicsrecovered`）。皆無新增 runtime dependency；WebGPU 真實 device loss、實體手把、聽感與其他瀏覽器仍未驗證。
- API 是 three.js-inspired，非 drop-in 相容或全部 addons；Canvas2D 仍 2D-only、沒有新增 runtime dependency。版本仍 1.1.0，由所有者決定升版／發佈；本輪不自動 commit／push／publish。實測與未完成驗證以 ACCEPTANCE 為準。

## Excalibur 參考擴充：P13–P20 profiles／共用整合已驗收

- P13 擴充既有 GameObject（不是新增 Actor）：mutable local Transform2D 重算 parent-world × local affine matrix，保留 shear／reflection；Group2D 不繪製。visibility 取祖先 AND、opacity／tint 相乘、z 相加；equal-z insertion order，world layer 先於 screen layer。Scene 註冊整個子樹，reparent 保留 local transform；remove 可重用、destroy 遞迴清理 owned children。
- Sprite source 為 bounded positive finite rectangle，可用 fractional pixels；setter snapshot／validation 與換 texture 保持原子。width／height 是自然 source 尺寸，scale 為顯示縮放，不設 displayWidth／displayHeight。SpriteSheet 另限制 immutable integer source frames／grid，不產生 cropped bitmap。GPU／GL instance payload 攜帶 affine axes／source UV／inherited tint；Canvas2D 走相同 source／world matrix。
- FrameAnimation 綁定一 Sprite，Scene 用模擬秒數推進 loop／pingpong／freeze／hide；控制 play／pause／reset／reverse／goToFrame／stop，events 送 animation 與 Sprite，large dt 以 aggregate loop count 避免逐圈 callback。移除停止 Scene 推進，destroy 清除 animation reference。
- SpriteText owns/reuses glyph Sprite children、NineSlice owns/reuses panel patches，全部 borrowed atlas Texture；invalid text／resize 先 preflight，縮小面板同比壓縮相對 margins，tile 的 fractional remainder 正確裁 source。ScreenElement 讓子樹繞過 Camera2D，保持 HUD 在 world 上方，不提供 layout widgets。
- P13–P20 profiles／formalrootconsumer／最後工具鏈已限定驗收：37files252tests／build-typecheck-lint-format／packedES2022consumer，實際證據見ACCEPTANCE。Physics限discrete angular circle／box／convex dynamic-root，particles限CPU pooled local／world；不推論fullframeparity／性能／crossbrowser，非目標見PLAN、不自動commit／push／publish。

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

## P15–P17 world profile（限定 Chromium 三backend驗收）

- Scene owns PhysicsWorld2D，GameObject body／collider setters與階層registration共用existing ownership。Fixed-step sweep broadphase／circle-convex narrowphase／iterative restitution＋friction＋angular impulse，不是AABB signflip；dynamic worldroot、nested static、circle uniform absolute worldscale。Shape snapshots、stable contact payload／precollision cancelResponse只當step；callback teardown守住surviving contact end。Catch-up cap記droppedTime，高速tunneling明示，無CCD／joints／sleep／concave／3D。
- TileMap／IsometricMap extends Group2D，immutable tile snapshots／preflight atomic edits，Sprite pool借atlas、不複製texture；orthbox／isodiamond／customconvex solid owners共用physics。Transformed conservative viewportcull只改renderEnabled、不移除solids。TileToWorld用cell elevation、worldToTile只zero-plane inverse、pickTile挑elevated topmost graphicrectangle。無editor format importer／navigation。
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

### 發佈與驗收界線

GitHub v1.2維持exact source commit `299afe29713b71dca2d120d3a4452812208c3c27`（historical source package1.1.0）；external release asset `xyz.js-1.2.0.tgz`內metadata1.2.0，323codefiles byte-identical，Pixi working changes不在release。實際asset SHA與修正事實見ACCEPTANCE；不改上述歷史localpack／252證據。本輪不授權version／license／deps／git／release變更。

## Weighted 3D transparency

Scene 的 `transparency` 預設 sorted；weighted 路徑把透明 mesh 與 opaque／MASK
分開。PBR alphaMode 為準，TextureMaterial 的 opacity 或 transparent flag 決定分類。
WebGPU 使用 MRT 加權累積／revealage，WebGL2 分兩次 draw，均測 opaque depth
且不寫透明 depth。先合成 HDR，再做 post／effects3D／2D／transition；
transmission 仍只看 opaque snapshot。WebGPU 保留 MSAA，WebGL2 離屏單取樣並
要求 float color attachment。這是 bounded-weight 近似，不是 depth peeling。
尺寸相關 targets 隨 resize、停用／無 Scene、destroy 清理，prepared pipeline 保留。

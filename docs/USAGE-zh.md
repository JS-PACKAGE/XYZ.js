# XYZ.js 使用說明

[English](USAGE.md) · 繁體中文 · [技術參考](TECHNICAL-zh.md)

XYZ.js 是瀏覽器遊戲引擎，不是完整遊戲。本指南涵蓋套件 1.1.0、P01–P08、Text2D／SceneTimers 與 P09–P12 進階 3D。API 參考 three.js，非 drop-in 相容或全部 addons，未新增 runtime dependency。版本／發佈由所有者決定，npm 未公開，根授權仍 UNLICENSED；實測與限制見 [驗收紀錄](../ACCEPTANCE.md)。

## 1. 啟動開發環境

需要 Node >=26 與 pnpm 12.6.0。在倉庫根目錄執行：

```sh
npx pnpm@12.6.0 install
npx pnpm@12.6.0 dev
```

開啟 `http://127.0.0.1:5173/examples/showcase/` 看 2D、3D 與音訊整合；音訊必須點擊按鈕解鎖。開發伺服器只綁定 localhost。不要直接以 `file://` 開啟頁面；WebGPU／AudioWorklet 需要安全來源，正式部署使用 HTTPS。

| 範例                                        | 用途                                                          |
| ------------------------------------------- | ------------------------------------------------------------- |
| [triangle](../examples/triangle/)           | WebGPU triangle、暫停／繼續／銷毀                             |
| [sprite](../examples/sprite/)               | 共用貼圖、透明度、排序與音效                                  |
| [pong](../examples/pong/)                   | 鍵盤、pointer、gamepad、相機與計分                            |
| [cube3d](../examples/cube3d/)               | 透視、光照、depth 與貼圖                                      |
| [fallback-demo](../examples/fallback-demo/) | 切換 backend 與 capabilities                                  |
| [showcase](../examples/showcase/)           | Scene 切換、2D＋3D＋audio                                     |
| [advanced3d](../examples/advanced3d/)       | 階層、controls／picking、glTF skin、PBR／陰影、instances／HDR |

## 2. 在自己的網站使用

先在引擎倉庫執行：

```sh
npx pnpm@12.6.0 build
```

Build 將最小化的引擎 JavaScript、TypeScript 宣告及 source maps 輸出到 `dist/`，保留 ESM 目錄結構；已最小化的官方 OPM vendor 原樣複製。不需要另跑壓縮命令，也不會修改原始碼。

將**完整 `dist/`** 複製到網站的 `/vendor/xyz/dist/`，包含 `vendor/opm/`、chunks 與 worklet，不只複製入口。使用網站的 HTTP 開發伺服器提供下列檔案。

若使用 bundler，可在引擎倉庫執行 `npx pnpm@12.6.0 pack` 產生本機 tarball，再由消費端安裝該檔；安裝後把下面的 URL import 改成 `import { Game, Scene, Primitive2D } from 'xyz.js'`。不要假設 registry 上已有這個版本。

建立 `index.html`：

```html
<!doctype html>
<html lang="zh-Hant">
  <meta charset="utf-8" />
  <title>XYZ.js</title>
  <style>
    canvas {
      width: 800px;
      max-width: 100%;
      height: 450px;
      touch-action: none;
    }
  </style>
  <canvas id="game"></canvas>
  <p id="status">ArrowLeft / ArrowRight</p>
  <script type="module" src="./app.js"></script>
</html>
```

建立 `app.js`（完整可執行的純 JavaScript）：

```js
import { Game, Scene, Primitive2D } from '/vendor/xyz/dist/src/index.js';

const status = document.querySelector('#status');
let game;
try {
  game = await Game.create({
    canvas: '#game',
    renderer: 'auto',
    width: 800,
    height: 450,
  });
  game.addEventListener('error', (event) => {
    status.textContent = event.detail.message;
  });
  const player = await Primitive2D.rectangle(40, 40, '#40c8ff');
  player.position.set(100, 120);
  class PlayScene extends Scene {
    update(dt) {
      const keys = game.input.keyboard;
      const axis =
        Number(keys.isDown('ArrowRight')) - Number(keys.isDown('ArrowLeft'));
      player.position.x += axis * 180 * dt;
    }
  }
  const scene = new PlayScene();
  scene.add(player);
  await game.setScene(scene);
  game.start();
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) game.destroy();
  });
} catch (error) {
  game?.destroy();
  status.textContent = error instanceof Error ? error.message : String(error);
}
```

應看到藍色方塊；左右方向鍵以每秒 180 logical pixels 移動它。`dt` 是秒，角度使用弧度。GameObject 本身不可見；使用 Sprite、Primitive2D 或 Mesh 才有畫面。

## 3. Scene 與遊戲控制

以下片段接續已有的 `game`、`scene`，不是各自獨立的完整程式。

```js
game.pause();
game.resume();
await game.setScene(new Scene());
```

`setScene` 先初始化新 Scene，成功才切換；準備失敗保留舊 Scene，透過 Promise 回報。成功切換會銷毀舊 Scene，因此不要再次使用已銷毀的物件／Scene。`scene.remove(object)` 只解除 ownership，不銷毀物件；`scene.add(object)` 可將已移除物件加入另一個 Scene。

覆寫 `update(dt)` 放每幀邏輯；需非同步準備時覆寫 `initialize(game, signal)`，遵守取消訊號並在 `onDestroy()` 同步釋放自有資源。詳見 [Scene 契約](TECHNICAL-zh.md#10-core-worldp02)。Fatal graphics error 之後不可直接 resume，需 destroy／重新 create。

## 4. Sprite、貼圖與尺寸

在上方 import 加入 `Sprite`，使用網站實際存在的 `/image.png`：

```js
const texture = await game.assets.loadTexture('/image.png');
const sprite = scene.add(
  new Sprite({
    texture,
    position: [160, 120],
    opacity: 0.75,
  }),
);
sprite.zIndex = 2;
sprite.rotation = Math.PI / 4;
sprite.scale.set(1.5, 1.5);
```

相同 canonical URL 共用 Texture；anchor 預設圖片中心，右／下為正方向，zIndex 越大越晚畫，相同值保留加入順序。Sprite.destroy 不會銷毀共用 Texture。`game.assets` 的貼圖由 Game 清理；`Texture.fromImage(source)` 產生的獨立貼圖由你負責 destroy。Primitive2D 會管理自己的生成貼圖。

Canvas CSS 尺寸與 GPU backing pixels 分開；不要自行逐幀改 `canvas.width`。預設 autoResize 跟隨 CSS content box，pixelRatio 預設上限 2。可使用 `game.resize(800,450)` 更新引擎 fallback，但作者 CSS 仍有優先權。需自行管理渲染尺寸時，在建立 Game 時設定 `autoResize:false`。

## 5. 相機與輸入

`scene.camera2D.position` 是 viewport 左上角對應的 world 座標；`zoom` 必須大於零。以下應放在 Scene.update 中，並於模組 import 加入 `Vector2`、在 Scene 外建立一次輸出容器：

```js
const pointerWorld = new Vector2();
```

```js
scene.camera2D.zoom = 1.25;
if (game.input.keyboard.wasPressed('Space')) {
  sprite.visible = !sprite.visible;
}
if (game.input.pointer.isDown(0)) {
  scene.camera2D.screenToWorld(game.input.pointer.position, pointerWorld);
  sprite.position.set(pointerWorld.x, pointerWorld.y);
}
const verticalAxis = game.input.gamepads[0]?.axes[1] ?? 0;
```

`isDown` 是持續狀態，`wasPressed`／`wasReleased` 是當幀 edge，不會被查詢消耗；幀末清除。Keyboard 使用 `KeyboardEvent.code`，例如 KeyW，而不是輸入字元。文字欄位不開始追蹤遊戲按鍵，但仍釋放先前按住的鍵；blur／hidden／pause 清除 held state。Gamepad 槽位可能為空，實體硬體尚未認證。

## 6. 加入 3D

在 import 加入 `Mesh`、`Geometry`、`TextureMaterial`；使用已載入的 `texture` 與目前 `scene`：

```js
if (game.graphics.capabilities.threeD) {
  scene.add(
    new Mesh({
      geometry: Geometry.cube(),
      material: new TextureMaterial({ texture }),
      position: [0, 0, 0],
    }),
  );
  scene.camera3D.position.set(0, 0, 5);
}
```

相機朝本地 −Z，3D 先繪製、2D 疊在上面。原 P05 primitives／自訂 indexed geometry 與 ambient／directional lighting 保留，另有下列進階功能。Index topology 不可變；刻意修改 vertex data 後需 geometry.markUpdated() 通知 GPU uploads。

`auto` 只在初始化時依 WebGPU→WebGL2→Canvas2D 降級；明確指定 backend 失敗不切換。Canvas2D 沒有 3D，應檢查 capabilities，不要直接提交可見 Mesh。執行中 device/context loss 不會自動切換 backend。

## 7. 音訊

先把 [sfx.json](../examples/sprite/sfx.json) 複製為網站 `/sound.json`；格式不是 MP3/WAV，而是 OPM voice 與 notes。HTML 加入 `<button id="sound" disabled>Play sound</button>`，在 Game 建立後執行：

```js
const sound = await game.audio.load('/sound.json');
const button = document.querySelector('#sound');
button.disabled = false;
button.addEventListener('click', async () => {
  try {
    await game.audio.unlock();
    sound.play({ channel: 'sfx' });
    game.audio.master.volume = 0.8;
  } catch (error) {
    status.textContent = String(error);
  }
});
```

首次播放必須在使用者手勢中 unlock。master／music／sfx／ui volume 為 0–1。音訊預設跟隨目前 Scene，切換時停止非 persistent 音訊；`sound.play({ persistent:true })` 可跨 Scene。`sound.stop()` 停止此資產；play 回傳值的 `.stop()` 只停止該次播放。Game.pause 不會停止音訊。

八聲部預算包含 release；溢位只搶最舊 SFX，不切斷 BGM。沒有可搶的 SFX 時略過新音符。八個獨立 contexts/worklets 有資源成本，不要隨意繞過 `game.audio` 操作底層 OPM。

## 8. 資產安全與清理

| 資源                     | 固定上限  |
| ------------------------ | --------- |
| 圖片 response bytes      | 8 MiB     |
| 音訊 JSON response bytes | 1 MiB     |
| 每個音訊資產 notes       | 16,384    |
| Texture 每邊尺寸         | 8,192     |
| Texture 總像素           | 4,194,304 |

超限拒絕，不自動裁切或縮放；byte cap 按實際串流 bytes 計數，不信任 Content-Length。預設集中在 `src/data/assets.ts`，不是 Game.create 的 options。

**保留所有瀏覽器支援圖片格式，所以圖片像素在解碼後檢查。** 這不能避免解碼瞬間記憶體放大，也不是全域 cache／並行下載預算；請使用可信資產管線，管理資產數量與生命週期。不要用不安全 HTML 或 eval 處理資產。

離開遊戲時呼叫 `game.destroy()`，停止 loop、釋放 graphics、輸入、Scene、audio 與載入器。不得把同一 Canvas 同時交給兩個 Game。保留 BFCache 頁面時不要在 pagehide 無條件 destroy（完整範例已處理）。

## 9. 排錯與發佈前檢查

- 無畫面：確認 Canvas、HTTP／HTTPS 路徑與 import 正確；看 Game.create rejection 和 error 事件；空 Scene 不畫 triangle。
- 不支援 WebGPU：使用 auto 或檢查安全來源／瀏覽器／driver；navigator.gpu 存在不保證 device 可用。
- 無音訊：確認點擊 unlock、JSON 格式、worklet 相對路徑與完整 vendor tree。
- 貼圖／JSON 被拒絕：檢查 HTTP status、格式、notes／bytes／pixels 上限與錯誤 cause。
- 需要診斷：從入口 import `logger`，設定 `logger.level = 'debug'`；正式環境可用 error／silent，不輸出 secret。

```sh
npx pnpm@12.6.0 build
npx pnpm@12.6.0 typecheck
npx pnpm@12.6.0 test
npx pnpm@12.6.0 lint
npx pnpm@12.6.0 format:check
```

工具檢查不取代真實瀏覽器畫面與互動驗證。Safari／Edge／Firefox、實體 gamepad 及完整 BFCache 矩陣尚未認證。效能量測見 [benchmark](../benchmarks/sprites/)；其約 60fps 不是跨裝置承諾。發佈前保留 OPM LICENSE、完整 dist，並由所有者決定根套件授權。

## 10. 畫布文字與 Scene 計時器

此功能為 v1.0 後的原始碼新增，不在既有 v1.0 release 壓縮包。已有初始化完成的 `game` 時，可用下列內容替換 quickstart 的 Scene：

```js
import { Scene, Text2D } from '/vendor/xyz/dist/src/index.js';

const scene = new Scene();
const label = await Text2D.create('Seconds: 0', {
  fontSize: 28,
  color: '#40c8ff',
});
label.position.set(180, 60);
scene.add(label);
let seconds = 0;
const timer = scene.timers.every(1, () => {
  void label.setText(`Seconds: ${++seconds}`).catch((error) => {
    game.pause();
    console.error(error);
  });
});
scene.timers.after(5, () => timer.cancel());
await game.setScene(scene);
game.start();
```

Timer 使用模擬秒數：暫停時凍結，替換／銷毀 Scene 時自動取消，不必手動清理 `setTimeout`；它不是現實時鐘倒數。個別取消使用 `timer.cancel()`，`timer.active` 可確認是否仍排程中。

文字支援換行與一般 Sprite 的 transform、anchor、opacity、zIndex；需要自訂字型時，建立前先等待 `document.fonts.load(...)`。處理 `setText()` rejection；快速重疊更新只保留最後一次請求。Style 不可變，生成貼圖屬於 label，不要共享給其他 Sprite。

開啟 [Pong](../examples/pong/) 可操作文字分數、延遲發球、Pause／Resume、Restart scene。暫停期間 restart，新 Scene 仍保持暫停，直到 Resume。

## 11. 進階 3D

開啟 [advanced3d](../examples/advanced3d/)，使用 ?renderer=webgpu 或 ?renderer=webgl2，可見 floor、24-instance ring、metallic sphere、animated glTF ribbon、shadow 與 HDR bloom。Canvas2D 仍 2D-only。以下片段接續既有 game／scene／texture，需從統一入口 import 所用類別。

### 階層、相機、Controls 與 Picking

```js
const group = scene.add(new Group());
const mesh = group.add(
  new Mesh({
    geometry: Geometry.cube(),
    material: new TextureMaterial({ texture }),
  }),
);
group.position.x = 1;
scene.camera3D = new OrthographicCamera();
scene.camera3D.height = 8;
scene.camera3D.position.set(0, 3, 8);
scene.camera3D.lookAt(new Vector3());
const controls = new OrbitControls(scene.camera3D, game.canvas);
controls.minZoom = 0.5;
controls.maxZoom = 4;
const raycaster = new Raycaster();
raycaster.setFromCamera(0, 0, scene.camera3D, 800 / 450);
const hits = raycaster.intersectObjects(scene.objects);
console.log(hits[0]?.object, hits[0]?.instanceId);
```

使用實際 logical viewport aspect；pointer 轉 NDC：x=2*screenX/width−1，y=1−2*screenY/height。Raycaster 為精確雙面 triangles，自己的 near／far 獨立於 camera clipping，結果按世界距離排序。Group 隱藏會隱藏子孫，world transform 包含祖先；cycle／跨 Scene parenting 拒絕。Remove 子樹只 detach，不銷毀；destroy parent 銷毀子孫。外部修改 target／camera 後 controls.update()，Scene 清理時 controls.destroy()。Limits 包含 distance、正交 zoom、polar／azimuth 弧度。

### 模型與動畫

```js
const asset = await new GLTFLoader().load('/model.glb', { signal });
scene.add(asset.scene);
if (asset.animations[0]) {
  const action = scene.animations.clipAction(asset.animations[0]);
  action.loop = true;
  action.play();
}
```

Signal 為 initialize 的 AbortSignal，URL 需提供實際模型。parse(bytesOrJSON,baseURL,{signal}) 也支援 GLB／glTF。Game 在 timers 後、Scene.update 前推進 scene.animations，不要重複 update。TRS clips 支援 STEP／LINEAR／CUBICSPLINE；同 property 最後建立的 playing action 優先而非 blending。play 繼續時間，stop 歸零但不還原 pose，loop=false 在 endpoint sample 後停止，負 timeScale 倒播。

支援 triangle、normalized／strided／sparse accessors、textures 與四 influences skins；必要 extensions、morph／其他 topology 明確拒絕。CPU SkinnedMesh 更新 cloned geometry 供 renderer／picking 使用。預算：input 32 MiB、fetched／tracked decoded 各 128 MiB、list entries 10,000、accessor scalar elements 4,194,304、total vertices 1,000,000／indices 3,000,000、joints 256、hierarchy depth 256。這不是 process-memory 總上限；影像解碼後檢查的限制仍適用。

清理時先停止 actions／移除 consumers，再 asset.dispose()，初始化失敗也需清理。Scene destroy 不 dispose loader-owned textures；仍有 live borrower 不可 dispose。Mesh／materials 不擁有共享 textures。

### PBR、陰影、HDR 與 Instances

```js
scene.add(
  new Mesh({
    geometry: Geometry.sphere(),
    material: new PBRMaterial({ texture, metallic: 0.8, roughness: 0.3 }),
  }),
);
scene.pointLights.push(new PointLight({ position: new Vector3(2, 3, 2) }));
scene.shadows.enabled = true;
scene.shadows.mapSize = 1024;
scene.shadows.extent = 12;
scene.postProcessing.enabled = true;
scene.postProcessing.exposure = 1.2;
scene.postProcessing.toneMapping = 'aces';
scene.postProcessing.bloomStrength = 0.25;
const instances = scene.add(
  new InstancedMesh({
    geometry: Geometry.cube(),
    material: new TextureMaterial({ texture }),
    count: 24,
  }),
);
instances.setMatrixAt(0, new Matrix4());
```

PBR 借用 base／emissive sRGB textures 與 linear metallicRoughness（G／B）、normal、occlusion（R）maps，使用相應 slots／scales。alphaMode 選 OPAQUE／MASK／BLEND，alphaCutoff 控制 MASK，doubleSided 控制 culling；透明物件按遠到近加入。最多 8 point＋8 spot，超限拒絕。只有方向光 3×3 PCF shadows（每 Mesh castShadow／receiveShadow），無 point／spot shadows 或 IBL。

HDR exposure／ACES 與實際 9-tap threshold bloom 在不受影響的 2D overlay 前執行。WebGL2 需 EXT_color_buffer_float，缺少時啟用 HDR 明確失敗。InstancedMesh count 固定，setMatrixAt 增加 version，getMatrixAt(index,out) 讀取；不要直接改 raw matrices。World 為 mesh world × instance matrix。完整預設與限制見 [技術契約](TECHNICAL-zh.md#21-進階-3dp09p12)。

各 map 可設定 textureSampler／metallicRoughnessSampler／normalSampler／occlusionSampler／emissiveSampler，含 minFilter／magFilter（'nearest'|'linear'）與 addressModeU/V（'clamp-to-edge'|'repeat'|'mirror-repeat'）。一般 PBR 預設 linear／clamp，glTF 預設 repeat，同一 shared image 保留不同 samplers；明確 mipmapped min filters 拒絕。

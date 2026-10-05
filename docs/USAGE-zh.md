# XYZ.js 使用說明

[English](USAGE.md) · 繁體中文 · [技術參考](TECHNICAL-zh.md)

**目前規範入口：**[v1.16 契約、公開 API 與支援邊界](CURRENT.md)。`pnpm docs:api` 生成可搜尋的 root API；`pnpm build:site` 將它納入靜態產物 `api/1.16.0/`（入口 `docs/`）。本頁保留各版本 recipes 與歷史升級／驗收紀錄，這些紀錄不重定義目前支援。

XYZ.js 是瀏覽器遊戲引擎，包含 P42 可玩參考 Beacon Run。目前 metadata **1.16.0／Apache-2.0**（npm 未發佈），歷史證據保留。API 參考 three.js／PixiJS／Excalibur，非 drop-in parity，未新增 runtime dependency。Browser／emulation 觀察與 Windows CI 測試設定不是實機或 Windows 驅動認證；browser qualification 需要實際記錄的證據。見 [PLAN](../PLAN.md)、[技術參考](TECHNICAL-zh.md)、[驗收紀錄](../ACCEPTANCE.md)。

## 歷史階段 profile 導覽

| 需求             | 歷史階段 profile／邊界                                                                                                                                                                                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 跨 backend 2D    | 三 backend Sprite／HUD／atlas／raster／isolation／masks／basic blends。Native Material2D／Filter2D／Mesh2D 僅 GPU／GL，Canvas 明確拒絕。                                                                                                                                                                          |
| 3D               | 只有 WebGPU／WebGL2；PBR／instancing／shadows／post／weighted transparency 為明記的 bounded profiles。WebGL2 HDR／weighted 需 float color attachments。                                                                                                                                                           |
| Physics2D        | Kinematic／convex character sweep／slide／support、有界 relative dynamic／rotational CCD；sleep／五種 joints／static concave凸片。Sensor discrete，無 dynamic concave／compound／deforming sweeps。                                                                                                               |
| Models／textures | glTF `COLOR_0` 支援、`COLOR_1` 拒絕；meshopt 內建、Draco／Basis codecs 外部提供。普通 KTX2 為 base-level RGBA8；opt-in native KTX2 保留全部 mips。`NativeTexture2D` 支援 RGBA8 與 capability-gated BC／ETC2／ASTC，Canvas 拒絕 native sources。                                                                   |
| Recovery         | GPU／GL 預設 `recoverGraphics:true` 重建同 backend，舊 RenderTextures／snapshots需重建；失敗為 fatal，非真 driver／跨browser認證。                                                                                                                                                                                |
| P40–P42 限定驗收 | P41 UI／contexts／budgets／warmup／typed content 通過三 backend built-root regression。P42 native GPU skin／animated bounds／mips、3D physics／dynamics／queries／capsule movement、authored navigation、masks／additive／blend trees／two-bone IK 與完整 Beacon Run 已限定驗收。非實體裝置／跨瀏覽器／效能認證。 |

下方各階段 counts、browser observations 與原排除項保留為歷史。目前規範矩陣見 CURRENT，實跑證據見 ACCEPTANCE；metadata 不代表瀏覽器或實機認證。

## 1. 啟動開發環境

最低支援 Node.js 22；目前固定 lint／test 工具鏈需 Node >=22.13.0，搭配 pnpm 12.6.0。在倉庫根目錄執行：

```sh
npx pnpm@12.6.0 install
npx pnpm@12.6.0 dev
```

執行 `npx pnpm@12.6.0 examples` 會啟動伺服器並開啟範例目錄 `http://127.0.0.1:5173/examples/`（可依功能篩選並逐 backend 開啟），或直接開啟 `http://127.0.0.1:5173/examples/showcase/` 看 2D、3D 與音訊整合；音訊必須點擊按鈕解鎖。開發伺服器只綁定 localhost。不要直接以 `file://` 開啟頁面；WebGPU／AudioWorklet 需要安全來源，正式部署使用 HTTPS。

也可開啟根目錄[範例索引](../index.html)：`http://127.0.0.1:5173/`。根目錄與 `/examples/` 共用完整 directory catalog、分類與 backend 連結；每個範例 directory URL 開啟即執行，不需 console bootstrap。多數說明為英文；starter／accessibility-game 完整流程有英語／繁中。3D-only 明確拒絕 Canvas2D；音訊仍需可信手勢。

| 範例                                                    | 用途                                                                                                                        |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| [triangle](../examples/triangle/)                       | WebGPU triangle、暫停／繼續／銷毀                                                                                           |
| [sprite](../examples/sprite/)                           | 共用貼圖、透明度、排序與音效                                                                                                |
| [pong](../examples/pong/)                               | 鍵盤、pointer、gamepad、相機與計分                                                                                          |
| [cube3d](../examples/cube3d/)                           | 透視、光照、depth 與貼圖                                                                                                    |
| [fallback-demo](../examples/fallback-demo/)             | 切換 backend 與 capabilities                                                                                                |
| [showcase](../examples/showcase/)                       | Scene 切換、2D＋3D＋audio                                                                                                   |
| [beacon-run](../examples/beacon-run/)                   | 四信標撤離遊戲、3D physics／navigation／animation、menu／HUD／pause／settings／save-load／audio／cleanup；限定 GPU／GL 驗收 |
| [advanced3d](../examples/advanced3d/)                   | 階層、controls／picking、glTF skin、PBR／陰影、instances／HDR                                                               |
| [physics2d](../examples/physics2d/)                     | 剛體、材質、sensor trigger、重力                                                                                            |
| [particles2d](../examples/particles2d/)                 | Emitter 預設、burst、nozzle、加法混合圖層                                                                                   |
| [tilemap2d](../examples/tilemap2d/)                     | Tile 圖層、tile 碰撞、相機 follow／bounds／shake／zoom                                                                      |
| [transitions2d](../examples/transitions2d/)             | fade／crossfade／slide、easing、取消、Scene timers                                                                          |
| [ui2d](../examples/ui2d/)                               | Text2D、點陣字型、NineSlice、HUD、無障礙按鈕                                                                                |
| [input-lab](../examples/input-lab/)                     | 鍵盤／pointer／gamepad 狀態、可重新綁定的 ActionMap                                                                         |
| [audio-lab](../examples/audio-lab/)                     | 解鎖、OPM 音樂／SFX、PCM sample、音量、PreloadBatch                                                                         |
| [pbr3d](../examples/pbr3d/)                             | 六種程序式 PBR 預設選擇、metallic／roughness 網格、陰影、環境光、霧、exposure／bloom                                        |
| [instancing3d](../examples/instancing3d/)               | InstancedMesh 批次、culling 探針、RenderStats                                                                               |
| [picking3d](../examples/picking3d/)                     | 巢狀 Group、OrbitControls、Raycaster、相機投影切換                                                                          |
| [gltf3d](../examples/gltf3d/)                           | 蒙皮 glTF 動畫播放、morph targets                                                                                           |
| [lightweight2d](../examples/lightweight2d/)             | 螢火蟲場景、暫停／繼續／重設／銷毀、graphics stats 與未使用服務狀態                                                         |
| [resource-lifecycle](../examples/resource-lifecycle/)   | 共用 leases、release 失敗重試、記憶體存檔、拒絕載入隔離與 fresh publication                                                 |
| [character-platforms](../examples/character-platforms/) | 行走／跳躍／蹲下、移動升降台、旋轉承接與天花板阻擋站立                                                                      |
| [joints3d](../examples/joints3d/)                       | hinge motor、distance chain、angular-locked ball socket 與誤差讀值                                                          |
| [ccd3d](../examples/ccd3d/)                             | dynamic-pair／rotational CCD 開關對照、真實 fixed-step contacts                                                             |
| [navigation-bake](../examples/navigation-bake/)         | collision surface bake、切換目的地與 Scene aggregate navigation quota                                                       |
| [text-i18n](../examples/text-i18n/)                     | native canvas bidi／grapheme 編輯、selection geometry 與字型 fallback                                                       |
| [audio-effects](../examples/audio-effects/)             | trusted unlock、PCM／stream、effects、duck release、cancel-hold 與空間綁定                                                  |
| [gameplay2d](../examples/gameplay2d/)                   | 整合 2D gameplay 與 native effects                                                                                          |
| [rendering2d](../examples/rendering2d/)                 | 共用 2D rendering profiles                                                                                                  |
| [authoring-lab](../examples/authoring-lab/)             | Canvas UI、contexts、leases 與 typed content                                                                                |
| [objects3d](../examples/objects3d/)                     | 3D 物件與加權透明                                                                                                           |
| [shadows3d](../examples/shadows3d/)                     | 原生陰影                                                                                                                    |
| [physics2d-lab](../examples/physics2d-lab/)             | Joints、休眠與碰撞                                                                                                          |
| [animation-lab](../examples/animation-lab/)             | 動畫編排與播放                                                                                                              |
| [save-lab](../examples/save-lab/)                       | 內容存檔與 fresh rebuild                                                                                                    |
| [motion2d](../examples/motion2d/)                       | Kinematic 平台、角色坡度／台階、相對回轉 CCD                                                                                |
| [locomotion3d](../examples/locomotion3d/)               | 固定動畫／controller 行走、跑步、跳躍與支撐                                                                                 |
| [world-visibility](../examples/world-visibility/)       | 可見集合、LOD／HLOD、native occlusion queries                                                                               |
| [native-material3d](../examples/native-material3d/)     | Native material hooks 與有界多燈                                                                                            |
| [world-streaming](../examples/world-streaming/)         | Cell 發佈／退役、共用資源與 navigation seam                                                                                 |
| [cpu-workers](../examples/cpu-workers/)                 | Native geometry jobs、transfer／copy 成本與取消                                                                             |
| [tiled-import](../examples/tiled-import/)               | 正交 JSON、外部 atlas、GID 翻轉與真實 collider                                                                              |
| [gpu-particles3d](../examples/gpu-particles3d/)         | Native GPU 粒子模擬／渲染                                                                                                   |
| [accessibility-game](../examples/accessibility-game/)   | 雙語可玩鍵盤／偏好／錯誤／結果流程                                                                                          |
| [asset-recipe](../examples/asset-recipe/)               | 資產產製與部署入口                                                                                                          |
| [narrative](../examples/narrative/)                     | 模擬時間 cutscene、分支對話、任務進度與存檔／還原                                                                           |
| [lighting2d](../examples/lighting2d/)                   | Native normal-map 光照；Canvas2D 明確拒絕                                                                                   |
| [asset-hot-reload](../examples/asset-hot-reload/)       | Vite Scene 替換；候選失敗時保留舊 Scene                                                                                     |
| [gpu-compute](../examples/gpu-compute/)                 | WebGPU WGSL storage buffer、依賴 dispatch 與型別化 readback                                                                 |
| [render-graph](../examples/render-graph/)               | WebGPU／WebGL2 native render graph 多輸入 passes                                                                            |

## 2. 在自己的網站使用

先在引擎倉庫執行：

```sh
npx pnpm@12.6.0 build
```

Build 將最小化的引擎 JavaScript、TypeScript 宣告及 source maps 輸出到 `dist/`，保留 ESM 目錄結構；已最小化的官方 OPM vendor 原樣複製。不需要另跑壓縮命令，也不會修改原始碼。

將**完整 `dist/`** 複製到網站的 `/vendor/xyz/dist/`，包含 `vendor/opm/`、chunks 與 worklet，不只複製入口。使用網站的 HTTP 開發伺服器提供下列檔案。

若使用 bundler，可在引擎倉庫執行 `npx pnpm@12.6.0 pack` 產生本機 tarball，再由消費端安裝該檔；安裝後把下面的 URL import 改成 `import { Game, Scene, Primitive2D } from 'xyz.js'`。不要假設 registry 上已有這個版本。

### 獨立 starter 與完整靜態部署

在引擎倉庫 build／pack，使用空目的目錄：

```sh
npx pnpm@12.6.0 build
npx pnpm@12.6.0 pack
node scripts/create-game.mjs /absolute/my-game --template 2d --package /absolute/xyz.js-1.14.0.tgz --name my-game
npx pnpm@12.6.0 --dir /absolute/my-game install
npx pnpm@12.6.0 --dir /absolute/my-game dev
npx pnpm@12.6.0 --dir /absolute/my-game build
```

`--template 3d` 產生 capsule 課程；`--package` 也接受已 build 套件目錄。已安裝 CLI `xyz-create` 接受相同參數；倉庫 `create:game` 轉送參數。非空目錄會拒絕；產生器不 install／publish。兩個 starter 都只消費已安裝 `xyz.js` 公開 root，不引用工作區 source；具備 loading／menu／play／pause／settings／results／restart、手勢或靜音音訊、validated IndexedDB checkpoint、明示 retry／recovery／conflict 與 teardown。

Starter `assets:engine` 將已安裝套件完整 `dist/` 複製至 `public/engine/`；`dev`／`build` 自動執行。部署**全部 starter `dist/`**，保留 `engine/vendor/`、workers／worklets。固定子路徑以 `GAME_BASE=/games/my-game/` build，預設 `./` 可搬移。手動無 bundler 部署可在引擎倉庫執行 `mkdir -p /absolute/site/vendor/xyz/dist` 再 `cp -R dist/. /absolute/site/vendor/xyz/dist/`，保留完整公開模組樹。

```sh
npx pnpm@12.6.0 build:site
npx pnpm@12.6.0 smoke:site
```

網站 builder 將 root／gallery／全部 example 與 benchmark HTML 編譯到 `.vite/site/`，完整引擎 `dist/` 原樣複製到 `engine/`，保留 fixtures／public assets／module workers。部署全部 output 至 HTTP／HTTPS 靜態 root 或子路徑，server 需 directory index，不依賴 Vite middleware、不支援 `file://`。`smoke:site` 用獨立自有 managed muted Chromium 與 native zero-gain physical-output sinks 驗證 built 靜態網站；不代表可聽輸出、Safari、實機或 screen reader 認證，成功必須依實際 report。

平行驗證時，先在本機完整 build 一次 site，再執行全部四個 shards（POSIX shell）：

```sh
pids=""
for shard in 1 2 3 4; do
  node scripts/smoke-site.mjs --shard "$shard/4" --output ".vite/site-smoke/shard-$shard-of-4" &
  pids="$pids $!"
done
status=0
for pid in $pids; do
  wait "$pid" || status=1
done
test "$status" -eq 0
```

`--shard index/count` 從 1 起算，限制為 `1 <= index <= count <= 32`。Source example paths 排序後依 ordinal modulo count 分配，再套 filters；同一 example 原有全部 renderer routes（含明示 unsupported 的 Canvas2D／3D 檢查）留在同一 shard。每個 shard 仍完整檢查兩個 catalogues 及其 local links。`results.json` 記錄 shard identity、完整 available case manifest、依序 planned／completed／exercised case IDs 與 completeness；empty selection、backend unavailable、缺少 case 或失敗均不能 PASS。`--example`／`--renderer` 仍是診斷 filters，不代表 full-site coverage；單 example 驗證通常省略 `--shard`，除非已知它的分配。未指定 `--shard` 時維持原本完整 serial 執行。

此處是多個獨立 Node／browser processes 並行，**不是 page 內的 JavaScript threads**。每個 process 自有 static server、muted managed Chromium 及唯一 output directory；全部 shards 成功才可宣稱完整 coverage。CI 在四個必要的 macOS／Metal-host shard jobs 各自完整 build site，production workload／starters 留在另一 macOS job；native audio 保留原 Linux／PulseAudio 環境及獨立必要 job。Reusable CI workflow 要求所有 jobs 成功才允許 release，不新增 retry、不縮減 workload、不放寬 timeout。Reports 保留 available／planned／completed／exercised case identities，須保留全部 shard reports 核對 union；此為並行排程，不認證 speedup、Linux software GPU、physical low-tier 或 universal FPS。

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

Gamepad 建議使用映射 API，而不是原始 `game.input.gamepads`：`game.input.gamepad.stick('left')` 回傳已濾 deadzone 的 `{x,y}`，`game.input.actions` 可把具名 action 綁到手把按鈕、搖桿方向與鍵盤：

```js
const { actions } = game.input;
actions.bind('jump', { button: 'a' }, { key: 'Space' });
actions.bind('left', { axis: 'leftX', direction: -1 }, { key: 'KeyA' });
if (actions.wasPressed('jump')) player.jump();
// Rebinding UI：等待 game.input.gamepad.firstPressed()，然後
actions.rebind('jump', [{ button: game.input.gamepad.firstPressed() }]);
localStorage.setItem('bindings', JSON.stringify(actions.export())); // actions.import(...) 還原
```

只使用 `mapping === 'standard'` 的手把。Spatial sample audio：在 `sample.play(...)` 傳入 `spatial: { position: { x, y, z } }`，以 `playback.position3D = {...}` 移動音源；用 `game.audio.listener.setPosition(x,y,z)`／`setOrientation(forward, up)` 設定聽者。

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

工具檢查不取代真實瀏覽器畫面與互動驗證。Safari／Edge／Firefox、實體 gamepad 及完整 BFCache 矩陣尚未認證。效能量測見 [benchmark](../benchmarks/sprites/)；其約 60fps 不是跨裝置承諾。發佈時保留根目錄 `LICENSE`、OPM LICENSE 與完整 dist。

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

文字支援換行與一般 Sprite transform／anchor／opacity／zIndex。自訂字型需等待 readiness，處理 `setText()` rejection；重疊更新 latest-request-wins。原 v1.1 immutable-style／no-wrap 是歷史 profile，P27 已加入 styled layout與typed font assets（第 18 節）。生成貼圖屬於 label，不共享給其他 Sprite。

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

Signal 為 initialize 的 AbortSignal，URL 需真實模型；`parse(bytesOrJSON,baseURL,{signal})` 也支援 GLB／glTF。Game 在 timers 後、Scene.update 前推進 scene.animations，不重複 update。TRS clips 支援 STEP／LINEAR／CUBICSPLINE、reverse／repeat-once-pingpong 與 P34 ordered weighted layers／fades／crossfades；weight 1 後層取代前層、partial weights 做 blending而非全 action正規化平均。`play()` 繼續、`stop()` 歸零不還原 pose，完整契約見技術參考。

支援 triangle、normalized／strided／sparse accessors、textures、四或八 influences skins 與 morph targets（POSITION／NORMAL deltas、mesh／node weights、`weights` animation），並支援 `KHR_mesh_quantization`、`KHR_materials_emissive_strength`、`KHR_materials_unlit`（近似）、`KHR_texture_transform`（每個材質 map 獨立選 UV0／UV1 與 affine transform，不烘改共用 vertex UV）與 `KHR_lights_punctual`（以 `asset.lights` 回傳，為 glTF 原始單位，需自行加入 scene）。八 influences 需成對 `JOINTS_1`／`WEIGHTS_1`，全部八個 weights 一起 normalize，不截成四個；缺少指定 UV、UV2+ 或更多 influence sets 明確拒絕。其他必要 extensions、其他 topology 也明確拒絕。SkinnedMesh 原生 GPU palette 用於 renderer，CPU deformation oracle 用於 bounds／picking；morph 以 `mesh.morph.weights.set(index, weight)` 或載入的 clip 驅動（同一 node 的 primitives 共用 weights）。預算：input 32 MiB、fetched／tracked decoded 各 128 MiB、list entries 10,000、accessor scalar elements 4,194,304、total vertices 1,000,000／indices 3,000,000、joints 256、每 mesh 64 個 morph targets、hierarchy depth 256。這不是 process-memory 總上限；影像解碼後檢查的限制仍適用。

Current loader 增量含 `COLOR_0` float／normalized unsigned VEC3／VEC4（含 alpha）、內建 meshopt、外部 Draco／Basis decoder 接口與 P39 PBR extensions；不支援的 required extensions 拒絕。真實 `dracoDecoder` 需回傳符合 accessors 的 logical-space attributes／triangle indices；缺 decoder 時 required Draco 拒絕，optional 需真實 uncompressed fallback。預設 KTX2 回 base-level RGBA8，使用內建 plain 2D RGB(A)／no或ZLIB decode 或提供的 `ktx2Transcoder`；不內建 Draco／Basis WebAssembly。Opt-in `nativeTextures: true` 保留全部 KTX2 mips，需外部 codec 的 encoding 使用 `ktx2NativeTranscoder`。`KHR_texture_basisu` 使用 transcoder 或 native path，否則需 regular source fallback。Decoder 品質／速度／memory 與廣泛 asset corpus 未認證。見[第22節](#22-p42-3d-gameplay-與動畫)。

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

PBR 借base／emissive sRGB與linear metallicRoughness（G／B）、normal／occlusion（R）maps。alphaMode為OPAQUE／MASK／BLEND、alphaCutoff控MASK、doubleSided控culling；PBR以alphaMode為準，legacy TextureMaterial用opacity／transparent。預設sorted半透明按距離由遠到近、等距穩定；交叉表面仍可能錯誤、weighted為opt-in近似。Scene最多8 point／8 spot、超限拒絕；P37已提供point／spot shadows與2–4 directional cascades、保留fixed directional 3×3 PCF。光源需開`castShadow`並配mesh flags，限制見技術參考。

#### 可重用的程序式 PBR 預設

`ProceduralMaterial.create(kind, options?)` 在 CPU 一次產生可無縫重複、具確定性的貼圖，不用外部素材或新增依賴。`ProceduralMaterialKind` 為 `'wood' | 'brick' | 'stone' | 'metal' | 'fabric' | 'marble'`（木材／磚牆／石材／金屬／布料／大理石）；`ProceduralMaterialOptions` 接受整數 `size` 32–1024（預設 256）及無號 32-bit 整數 `seed` 0–4294967295（預設 1），無效值會拒絕建立。

已有 3D `scene` 時，一份預設可讓多個 mesh 借用：

```js
import { Geometry, Mesh, ProceduralMaterial } from 'xyz.js';

const preset = await ProceduralMaterial.create('wood', { size: 256, seed: 7 });
const first = scene.add(
  new Mesh({ geometry: Geometry.cube(), material: preset.material }),
);
const second = scene.add(
  new Mesh({
    geometry: Geometry.sphere(),
    material: preset.createMaterial({ normalScale: 0.5 }),
  }),
);
second.position.x = 2;

// 清理時先移除所有借用者，再釋放貼圖。
scene.remove(first);
scene.remove(second);
first.destroy();
second.destroy();
preset.destroy();
```

唯讀 `kind`、`material`、`textures` 提供預設內容：`textures.baseColor` 的 RGB 為 sRGB；`normal` 為 linear tangent-space；`metallicRoughness` 的 G 存 roughness、B 存 metallic；`occlusion` 的 R 存 linear occlusion。四份不可變 `Texture` source 沿既有 PBR／renderer 路徑使用。預設 opaque、全部 slots 使用 repeat sampling、roughness factor 為 1；metal 的 metallic factor 為 1，其餘種類為 0。

`createMaterial(options?: Partial<PBRMaterialOptions>)` 建立新的 `PBRMaterial`，借用同一組 maps，最後套用呼叫者覆寫，不重新產生貼圖。Scene／mesh 不自動擁有預設；同步且冪等的 `destroy()` 只釋放預設產生的貼圖，不釋放覆寫的外部貼圖。`destroyed` 回報狀態，銷毀後 `createMaterial()` 會拒絕；已釋放 maps 不可再使用。[pbr3d gallery](../examples/pbr3d/) 提供預設切換與貼圖預覽，Canvas2D 仍只支援 2D。

若要 image-based lighting 與 skybox，用 2:1 equirect 影像建立 `EnvironmentMap` 並指定給 scene。它只照亮 `PBRMaterial`，並取代其平面 `ambientLight`：

```js
import { EnvironmentMap } from 'xyz.js';

const sky = EnvironmentMap.fromRGBE(
  await (await fetch('/sky.hdr')).arrayBuffer(),
);
// 或：EnvironmentMap.gradient({ zenith: [0.15, 0.35, 0.8], horizon: [0.9, 0.75, 0.6], ground: [0.1, 0.1, 0.1] })
scene.environment = sky;
scene.background = sky; // 可選 skybox，可用不同 map
scene.environmentIntensity = 1;
// 之後從 scene 移除後：sky.destroy();
```

Map 最大 2048×1024。只有 WebGPU 與 WebGL2 會繪製；Canvas2D 僅 2D。

距離霧會讓 3D mesh 向某個顏色漸變（不影響 skybox 或 2D 層）：

```js
scene.fog.enabled = true;
scene.fog.mode = 'linear'; // 或 'exp2' 搭配 scene.fog.density
scene.fog.color = [0.6, 0.65, 0.75]; // 顯示用 sRGB，0..1
scene.fog.near = 6;
scene.fog.far = 30;
```

`Game.create({ antialias })`（預設 `true`）為 WebGPU 3D pass 啟用 4× MSAA；傳 `false` 可節省 GPU 成本。不涵蓋的範圍見[技術說明](TECHNICAL-zh.md#21-進階-3dp09p12)。

GPU／GL loss 預設觸發復原：監聽 `graphicslost`／`graphicsrecovered`，重建同 backend 期間略過frames；復原後重建舊 `RenderTexture2D`／snapshot handles。復原失敗／restore timeout為fatal，`recoverGraphics:false`則loss立即fatal。既有Chromium WebGL2 `WEBGL_lose_context`檢查不等於真手機／driver reset或browser WebGPU loss認證。

若只想後處理 3D 影像（不含 sprite 與 HUD），先 prepare 一個 `PostProcessor2D` 再加入 `scene.effects3D`；shader 簽章與 `effects2D` 相同（`effect(color, uv, screen)`）。`game.graphics.stats` 會回報最近一幀的 draw calls、三角形數與被剔除的 mesh。第一人稱滑鼠視角則建立 `new FirstPersonControls(camera, canvas)`，在 click handler 內 `await controls.lock()`，並每幀呼叫 `controls.update(dt)`。

HDR exposure／ACES 與實際 9-tap threshold bloom 在不受影響的 2D overlay 前執行。WebGL2 需 EXT_color_buffer_float，缺少時啟用 HDR 明確失敗。InstancedMesh count 固定，setMatrixAt 增加 version，getMatrixAt(index,out) 讀取；不要直接改 raw matrices。World 為 mesh world × instance matrix。完整預設與限制見 [技術契約](TECHNICAL-zh.md#21-進階-3dp09p12)。

各 map 可設定 textureSampler／metallicRoughnessSampler／normalSampler／occlusionSampler／emissiveSampler，含 minFilter／magFilter（'nearest'|'linear'）與 addressModeU/V（'clamp-to-edge'|'repeat'|'mirror-repeat'）。一般 PBR 預設 linear／clamp，glTF 預設 repeat，共用 image 保留不同 samplers。Native sources 可加 `mipmapFilter`／`lodMinClamp`／`lodMaxClamp`；opt-in native glTF 保留 mip sampling。普通 image textures 仍為 base-level sources。

斜視 surface 可設定 `textureSampler: { maxAnisotropy: 8 }`（及各 PBR map sampler），
Sprite 使用 `sampler: { maxAnisotropy: 8 }`。Request 為整數1–16，大於1需linear，
不會生成缺少的 mips。`game.graphics.capabilities.textureAnisotropy` 區分 request
ceiling 與 driver ceiling，WebGPU 後者為 null、不是品質保證；Canvas2D／無GL
extension 為1。見 [filtering 限制](TECHNICAL-zh.md#p120-anisotropic-texture-filtering)。

Native mip upload 已限定 P42 驗收。EnvironmentMap roughness mips 是另一條路徑；native source 建立與 device format 檢查見第22節。

## 12. Atlas 圖形與 HUD（P13）

由 xyz.js（或部署的 root ESM URL）import 下列名稱。texture 需為已載入且包含兩個 rectangles 的 atlas；Scene owns objects，貼圖仍借用。

```js
import { Group2D, ScreenElement, SpriteSheet, FrameAnimation } from 'xyz.js';

const sheet = new SpriteSheet(texture, [
  { x: 0, y: 0, width: 16, height: 16 },
  { x: 16, y: 0, width: 16, height: 16 },
]);
const group = scene.add(new Group2D());
group.position.set(120, 100);
group.rotation = 0.3;
const sprite = group.add(sheet.createSprite(0));
sprite.scale.set(3, 3);
new FrameAnimation(
  sprite,
  sheet.frames.map((source) => ({ source, duration: 0.2 })),
  { strategy: 'pingpong' },
).play();
const hud = scene.add(new ScreenElement());
hud.add(sheet.createSprite(1, { anchor: [0, 0], position: [16, 16] }));
```

規則 cells 使用 SpriteSheet.grid(texture,{frameWidth,frameHeight,columns,rows,origin:[x,y],spacing:[x,y]})。Sheet frames 必須 integer source pixels；直接 sprite.source={x,y,width,height} 可用 texture 內的有限 fractional pixels，undefined 回整張圖。Sprite width／height 是自然 source 尺寸，顯示縮放用 scale，沒有 displayWidth／displayHeight。Nested groups 繼承 visibility／opacity／tint／z；screen roots 不受 camera 影響並在 world 後繪製。Reparent 保留 local transform；remove 解除可重用子樹，destroy 遞迴清理 children、不 destroy borrowed textures。

new SpriteFont(sheet,{alphabet:'012AB',lineHeight:10,fallback:'0',advance:8}) 以 Unicode code points 一對一對應 sheet frames。new SpriteText(font,'A012B\n210BA',{align:'center',letterSpacing:1,lineSpacing:2}) 擁有 glyph children；同步 setText(text) 重用 glyphs，invalid input 保留舊文字。未提供 fallback 時 unmapped character 拒絕；不是 BMFont importer。

上述constructor只對應已有sheet；P27另外提供bounded text／JSON BMFont loading與multipage metrics／kerning。因此不能把整個引擎寫成無BMFont支援，見第18節與技術profile。

new NineSlice(texture,{left:3,right:3,top:3,bottom:3,width:60,height:28,mode:'tile'}) 借用 texture、擁有 patches；source／margins 為 integer pixels，可指定 atlas panel source。resize(width,height) 可用有界 fractional destination；stretch 預設，tile 裁最後 partial repeat（含 fractional source remainder），tile-fit 平均分配完整 repeats。小尺寸同比壓縮相對 margins，drawCenter:false 不畫中心。

FrameAnimation 另有 loop（預設）／freeze／hide、非負 speed、pause／play／reset／reverse／goToFrame(index)／stop（pause 加 reset）。Game 中央推進，不要重複 update。Animation 或 Sprite 上的 native animationframe／animationloop／animationend events，large dt 的 loop detail 含 aggregate count。

### 正式 P13–P20 Playground

開啟 [gameplay2d](../examples/gameplay2d/) 的 ?renderer=webgpu|webgl2|canvas2d|auto或Renderer selector。預設forced WebGPU，需initialization fallback請explicit選auto。此rootexports正式consumer三backend真browser proof完成，非fake tasks／另一套engine；P13–P20 profiles／formalexample／最後build-typecheck-lint-format／37files252tests／packed ES2022consumer於記錄scope驗收。

| Controls                                                                  | 實際行為                                                                                                                                                   |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drag colored sprite／bitmap text；Move camera／Toggle group               | Native parent-inverse nesteddrag、screenHUD固定，diagnostics顯viewportculltilecounts                                                                       |
| Move + fade sequence／Follow + bounds／Shake                              | Simulationactions／ordered strategies／seeded visual-onlyshake                                                                                             |
| Off-center impulse／Edit both maps                                        | Angularimpulse，ortho(2,0)循環frame／切solid、iso(2,1)切elevation                                                                                          |
| Toggle local/world emission／Burst both spaces                            | Stop留survivors到期、每spaceburst24                                                                                                                        |
| Unlock + PCM + OPM／Pause-resume PCM／Seek + rate PCM／Stop audio／Master | Gestureunlock原八contexts、PCM＋OPM；seek0.2s／rate1.5；Game pause不pauseaudio                                                                             |
| Transition kind／Preload + switch scene／Cancel pending-effect            | 真OPM／PCM／PNG batch3/3後initialize，1.5s fade-crossfade-leftslide／sineInOut；cancel重選publishedScene、不destroy                                        |
| Toggle Sprite material／Toggle world + HUD post                           | GPU／GL prepared WGSL／GLSL，Canvas顯explicit UnsupportedGraphicsError                                                                                     |
| Pause／Resume／Destroy                                                    | 凍simulation／actions／particles／transitionclock、cancelpointercapture；abortUIlisteners／monitor、destroyGame後清callerfixtures／descriptors／objectURLs |

Progress／transitionevents／audio／effects／tile／simulation labels是真state；三backendfinalsurfaces consoleerrors=[]，analyser非喇叭聽見聲音。無新crossbrowser／performance聲明。

## 13. Preload 與 Native Samples（已落地 P18 Modules）

P18已包含Scene.preload／Game.loading整合，於記錄的Chromium環境驗收。下列direct batch例接續已有game／scene；URL需實際檔案、HTML需#sound button。

```js
import { PreloadBatch } from 'xyz.js';

const controller = new AbortController();
const batch = new PreloadBatch([
  game.assets.textureTask('atlas', '/atlas.png'),
  game.audio.sampleTask('tone', '/tone.wav'),
  {
    key: 'settings',
    load: (signal) => game.assets.loadJSON('/settings.json', { signal }),
  },
]);
batch.addEventListener('progress', (event) => {
  console.log(event.detail.completed, event.detail.total, event.detail.ratio);
});
const resources = await batch.load({ signal: controller.signal });
const sample = resources.get('tone');
document.querySelector('#sound').addEventListener('click', async () => {
  try {
    await game.audio.unlock();
    const playback = await sample.play({ channel: 'sfx', scene, volume: 0.5 });
    console.log(playback.state, playback.position);
  } catch (error) {
    console.error(error);
  }
});
```

初始化 error path 處理 batch rejection。手勢 unlock 前 sampleTask／loadSample 只 fetch encoded bytes：decoded=false、duration／sampleRate／channels undefined。sample.decode／play 未 unlock 拒絕，play unlock 後 lazy decode；batch complete 不等於 decoded-ready。game.audio.opmTask(key,url) 載 OPM JSON，textureTask 由 loader owns texture。Batch state／progress、native progress／complete／error events、cancel(reason?)／load({signal?}) 使用 task-count progress，empty ratio=1；不 retries、不 destroy results。

game.assets.loadBinary(url,{signal,maxBytes}) 回 ArrayBuffer，loadText UTF-8 text，loadJSON parsed data（非 schema validation）。預設 binary8 MiB、text／JSON1 MiB，maxBytes 正整數≤8 MiB，generic readers 支援 HTTP／HTTPS／data／blob。Shared texture／OPM／sample abort 僅拒該 subscriber；loader destroy 中止 shared request／釋放 owned cache。Custom tasks 配合 signal，不為單 batch destroy shared loader。

game.audio.loadSample(url,{signal}) 回 cached SampleAudioAsset；僅 browser-native codecs，WAV／PCM 已實測。Asset loop／persistent 可被 play options 覆寫：channel（music／sfx／ui）、scene、persistent、loop、volume（0..1）、playbackRate（0,16]）、duration 內 offset、scheduledStartTime（絕對 AudioContext 秒，非 Game clock）。Playback state（playing／paused／stopped／ended）、position、可變 volume／playbackRate、pause／resume／seek(seconds)／stop；pause 固定 position、finished seek 拒絕，resume／seek 重建 one-shot source，natural end 與 stop 分開。Game pause 不暫停音訊，需要時明確 playback.pause()。

Sample 重用第一個已 unlock OPM context，不建第九個；獨立32-playback容量，超限拒絕不搶 OPM slots。既有 master／channel volume 套用，worklet reset 不斷 sample。Scene stop nonpersistent，persistent 保留至 stop／Game destroy；cached SampleAudioAsset 不由使用者 destroy。

Encoded8 MiB，**decode後**檢查2,097,152 frames／8 channels／192kHz／8,388,608 values；不能防 decoder transient allocation，非 global memory budget。Chromium analyser 證 PCM 與 OPM 非零輸出，不宣稱聽到喇叭聲或其他瀏覽器認證。

### Scene 準備與 Model Tasks

```js
import { Scene, Sprite, PreloadBatch } from 'xyz.js';

class ReadyScene extends Scene {
  preload(game) {
    const batch = new PreloadBatch([
      game.assets.textureTask('atlas', '/atlas.png'),
      game.audio.sampleTask('tone', '/tone.wav'),
    ]);
    batch.addEventListener('progress', (event) => {
      document.querySelector('#loading').textContent =
        `${event.detail.completed}/${event.detail.total}`;
    });
    return batch;
  }
  async initialize(game, signal) {
    const texture = await game.assets.loadTexture('/atlas.png', { signal });
    this.add(new Sprite({ texture, position: [100, 100] }));
  }
}
await game.setScene(new ReadyScene());
```

HTML加#loading label，處理setScene rejection。TypeScript protected preload(game,signal)回PreloadBatch|void|Promise<PreloadBatch|void>；Game先preload成功才initialize。Game.loading只讀當前candidate batch，外部UI可讀loading?.progress，不呼叫internal setLoading。成功原子publish／destroy old，failure／cancel保留old Scene，非pause仍更新；failed preload不initialize。Superseded batch不可清新loading；pause中可完成prepare／publish，新Scene等resume才tick。

Batch可加new GLTFLoader().task('model','/model.glb')取得unique owned model。未完成batch failure／cancel dispose該task model／owned textures，不碰unrelated models／shared loader assets；成功caller接ownership，移除／停止consumers後必須GLTFAsset.dispose。Custom LoadTask自行負責unique resources與cooperative signal cleanup；generic task與shared loader results不由batch自動destroy。

## 14. Actions、Pointer Targets 與 Camera（P14）

以下片段使用live Scene與已加入的Sprite。Duration是simulation秒、rotation是radians；actions修改local transform、先於physics，不在Scene.update手動推queue。

```js
import { Actions, Easings, CameraStrategies } from 'xyz.js';

sprite.pointerEnabled = true;
sprite.draggable = true;
sprite.addEventListener('dragmove', (event) => {
  console.log(event.detail.pointerId, event.detail.screen, event.detail.world);
});
const handle = sprite.actions.run(
  Actions.sequence(
    Actions.parallel(
      Actions.moveBy(40, 0, 0.5, Easings.quadInOut),
      Actions.fadeTo(0.5, 0.5),
    ),
    Actions.call((owner) => {
      owner.opacity = 1;
    }),
  ),
);
const result = await handle.finished;

const follow = scene.camera2D.addBehavior(
  CameraStrategies.follow(sprite, { axis: 'both', smoothTime: 0.15 }),
);
scene.camera2D.addBehavior(
  CameraStrategies.bounds({ x: 0, y: 0, width: 1000, height: 600 }),
);
scene.camera2D.shake({ duration: 0.25, amplitude: [4, 3], seed: 7 });
```

保留follow token，需要停止follow才呼叫scene.camera2D.removeBehavior(follow)；立即remove會讓下次camera update完全不套用follow。

ActionQueue.run回state queued／running／completed／cancelled與finished（resolve completed／cancelled）；handle.cancel取消單run、sprite.actions.clear清queue。其他factories：moveTo／rotateTo／scaleTo／tween(target,numericValues,duration,easing?)／delay／repeat(action,count)／repeatForever(action)。Sequence傳overshoot、parallel等所有branches、repeat重取起點；infinite repeat必須耗時、超限callback work拒絕。Easings：linear、quadIn／Out／InOut、cubicIn／Out／InOut、sineIn／Out／InOut、bounceOut；custom output必須finite [0,1]。不承諾back／elastic。

Native target-only lifecycle：initialize首次active tick一次；add／remove detail {scene}；preupdate／postupdate detail {dt}；destroy；actionstart／actioncomplete／actioncancel detail {action,handle}。Callback remove／readd使舊registration失效，下frame續跑；失效tick的preupdate不必配postupdate，events不bubble。

Pointer events pointerenter／leave／down／up／move／cancel、dragstart／move／end回PointerTargetEventDetail {pointerId,button,screen,world,target,originalEvent?}，Vector2 snapshots穩定。Topmost screen／HUD優先world、graphics bounds inverse affine、singular skip；hitTestMode='collider'改用attached collider，非pixel-alpha picking。Native capture讓canvas外仍drag，parent-inverse保留nested delta、第二pointer不可搶同drag。Pause／hidden／remove／destroy取消routing，resume不重播paused samples。

CameraStrategies.follow另可用viewport-relative deadZone rectangle。Bounds依viewport／zoom clamp，view大於bounds時center。Camera2D.moveTo(x,y,duration,easing?)／zoomTo(zoom,duration,easing?)回ActionHandle，motion／zoom各獨立FIFO。Behaviors依加入順序，在physics／particles後、render前；較後bounds可覆蓋motion／follow。clearBehaviors釋strategies；seeded shake只改renderOffset、不改logical position，picking用最近呈現camera。Game pause凍結queues／camera。

## 15. Physics、Maps 與 CPU Particles（P15–P17）

### Rigid Bodies 與 Triggers

```js
import { GameObject, RigidBody2D, Colliders, Trigger2D, Vector2 } from 'xyz.js';

scene.physics.gravity.set(0, 980);
const ball = scene.add(new GameObject());
ball.position.set(100, 40);
ball.collider = Colliders.circle(8);
ball.body = new RigidBody2D({ mass: 2, restitution: 0.3, friction: 0.5 });
const floor = scene.add(new GameObject());
floor.position.set(100, 180);
floor.collider = Colliders.box(200, 16);
floor.body = new RigidBody2D({ type: 'static' });
ball.body.applyImpulse(new Vector2(20, -30), new Vector2(104, 40));
const trigger = scene.add(
  new Trigger2D(Colliders.box(60, 30), {
    repeat: Infinity,
    filter: (other) => other === ball,
  }),
);
trigger.position.set(100, 100);
trigger.addEventListener('triggerenter', (event) =>
  console.log(event.detail.other),
);
```

GameObject本身不繪圖，要顯示改用atlas Sprite，collider source-local geometry需配Sprite scale。Colliders.box以owner origin為中心，factory接受{offset:[x,y]}；polygon為3–32 finite strictlyconvex vertices，concave／degenerate拒絕。Dynamic只world root、static可nested；circle要求uniform absolute world scale，非ellipse近似。Body／collider setters自動註冊Scene.physics。

RigidBody2D有velocity／angularVelocity／mass／restitution／friction／linearDamping／angularDamping／gravityScale／lockRotation；applyForce／applyImpulse optional world lever point、clearForces清累積。無body仍是static collider。Category／mask reciprocal uint32，sensor=true不response。collisionstart／precollision／postcollision／collisionend detail self／other／stable normal／points／penetration／sensor／cancelResponse()；cancel只關當前precollision step response。Trigger2D clone sensor、預設一次accepted enter，explicit repeat=Infinity，triggerenter／triggerexit回{self,other}，不auto-destroy。

Scene.physics.overlap(collider,owner)回shape-accurate contacts；raycast(origin,direction,maxDistance,mask?)回distance-sorted hits。Fixed-step capped、droppedTime記discard。P31有`body.ccd`掃dynamic平移對static非sensor（無rotation／dynamic-pair sweep）、sleep與`DistanceJoint`／`RevoluteJoint`／`PrismaticJoint`／`WeldJoint`／`MouseJoint`（addJoint／removeJoint）。`Colliders.polygon`仍strict convex，static凹形／chain用`StaticConcave2D`／`StaticChain2D`凸片composites；無dynamic concave／compound、kinematic／zero-width edge或目前3D physics。P42另批准3D colliders／queries／character／dynamic bodies與navigation／pathfinding，舊排除項不刪減新scope，詳見[TECHNICAL](TECHNICAL-zh.md)。

以上 P31 排除項屬歷史：P76 已加入 kinematic、convex character 與 bounded relative rotational／dynamic CCD（第39節）；P42 及後續已提供目前3D physics。

### Atlas Maps

```js
import { TileMap, IsometricMap, SpriteSheet } from 'xyz.js';

const sheet = SpriteSheet.grid(texture, { frameWidth: 32, frameHeight: 32 });
const map = scene.add(
  new TileMap({
    columns: 8,
    rows: 4,
    tileWidth: 32,
    tileHeight: 32,
    sheet,
  }),
);
map.setTile(2, 2, { frame: 0, solid: true, metadata: { name: 'floor' } });
const iso = scene.add(
  new IsometricMap({
    columns: 4,
    rows: 4,
    tileWidth: 32,
    tileHeight: 16,
    sheet,
    elevationStep: 8,
  }),
);
iso.position.set(320, 100);
iso.setTile(1, 1, { frame: 1, solid: true, elevation: 2 });
const origin = iso.tileToWorld(1, 1);
const picked = iso.pickTile(origin);
map.setTile(2, 2, { solid: false });
```

使用有足夠frames的live texture。GetTile回immutable cell {frame,solid,elevation,collider?,metadata?}；setTile preflight partial edit、clearTile reset。tileToLocal／tileToWorld含configured elevation，可傳out Vector2重用。worldToTile(point,out?)回可能越grid的integer座標，iso inverse基於elevation-zero plane；pickTile處理elevated topmost graphic rectangle，非pixelalpha／exact diamond。Singular inverse拒絕，pickTile回undefined。

Orthogonal origin top-left，isometric為diamond頂點、diagonal／elevation／insertion depth。Generated Sprite pool借sheet Texture，hidden／cleared不反覆建children。Transformed camera conservative culling不移除solids；預設box／diamond或custom convex collider。Edit／remove／destroy更新Scene collision registration；先destroy maps，再由owner destroy atlas。無editor format importer／hex／staggered／navigation。

上述 editor-format 排除是原 TileMap profile；P83 另提供有界 Tiled orthogonal JSON importer（第39節），不擴充 hex／staggered。

上述 navigation 排除屬原 map profile；目前提供有限 grid／graph pathfinding 與 character following。Hex／staggered editor imports 仍不支援。

### Particle Emitters

```js
import { ParticleEmitter } from 'xyz.js';

const emitter = scene.add(
  new ParticleEmitter({
    texture,
    capacity: 128,
    rate: 24,
    seed: 7,
    space: 'world',
    lifetime: [0.5, 1],
    speed: [20, 40],
    angle: [-Math.PI, 0],
    acceleration: [0, 40],
    nozzle: { kind: 'circle', radius: 5 },
    startSize: [6, 6],
    endSize: [1, 1],
    startColor: [1, 0.5, 0, 1],
    endColor: [1, 0.5, 0, 0],
  }),
);
emitter.position.set(120, 80);
emitter.emit(12);
emitter.start();
// Later: emitter.stop() retains survivors; emitter.clear() retires them.
```

ParticleEmitter extends Group2D、初始stopped；rate births／second、emit(count) stopped也可burst。Lifetime／speed／angle是ordered range（秒／logical units每秒／radians），startSize／endSize是width／height而非random range。Optional source atlas rectangle；nozzle point／rectangle {width,height}／circle {radius}。Capacity overflow drop-new無backlog；activeCount／emitting只讀。

CPU fixed borrowed-texture Sprite pool：fractional births按當tick內時間age、analytic acceleration、lifetime size／tint／alpha。Local跟emitter祖先；world凍結birth完整affine axes／position／velocity／acceleration，移動parents不改old births，新birth採新transform。Simulation space與inherited world／screen rendering分開。stop留survivors至expiry、clear重用pool／reset fraction、Game pause凍結age；destroy owned children、不destroy borrowed Texture。無GPU simulation。

## 16. Native Sprite Materials 與 2D Post（P20）

下例用live GPU／GL Game／Scene／Sprite；先prepare才attach visible consumers，需處理compiler rejection。

```js
import { Material2D, PostProcessor2D } from 'xyz.js';

const material = new Material2D({
  uniforms: [0, 1, 0, 1],
  wgsl: `fn effect(color: vec4f, uv: vec2f, screen: vec2f) -> vec4f {
    return vec4f(color.rgb * uniformValue(0u).rgb, color.a);
  }`,
  glsl: `vec4 effect(vec4 color, vec2 uv, vec2 screen) {
    return vec4(color.rgb * uniformValue(0).rgb, color.a);
  }`,
});
const mirror = new PostProcessor2D({
  uniforms: [0.75],
  wgsl: `fn effect(color: vec4f, uv: vec2f, screen: vec2f) -> vec4f {
    return sampleInput(vec2f(1.0 - uv.x, uv.y)) * uniformValue(0u).x;
  }`,
  glsl: `vec4 effect(vec4 color, vec2 uv, vec2 screen) {
    return sampleInput(vec2(1.0 - uv.x, uv.y)) * uniformValue(0).x;
  }`,
});
await game.graphics.prepareMaterial(material);
await game.graphics.preparePostProcessor(mirror);
sprite.material = material;
scene.effects2D.push(mirror);
material.setUniforms([1, 1, 0, 1]);
```

兩native source必填、immutable、nonempty，各≤65,536 chars。Uniforms是16-slot Float32Array；setUniforms≤16 finite float-representable values、其餘zero-fill，direct finite mutation下draw upload。WGSL uniforms.values是array&lt;vec4f,4&gt;、GLSL vec4 uniforms[4]；uniformValue(index)讀0–3 vec4 index、非float index。User定義effect，不寫完整vertex／fragment entrypoint。

Material color是premultiplied sampled Texture×inherited tint／opacity，uv source-frame normalized，screen logical pixels，return也需premultiplied RGBA。Post處理完整transparent world-2D＋HUD，sampleInput兩backend皆top-left normalized UV。Stage：3D／P12 HDR→transparent 2D＋HUD→ordered effects2D ping-pong→composite→whole-frame transition。Material只改attached Sprite、2D post不處理3D／HDR base。

Prepared pipeline／program＋uniform resources跨resize／disable保留至descriptor lifetime，reenable不async reprepare；mutable layer／transition attachments釋放，owned snapshots不釋。Descriptor caller-owned可借多consumers，移除references後material.destroy()／mirror.destroy()，同步釋prepared entry。Unprepared／destroyed draw拒GraphicsError，renderer loss／destroy清全部。Canvas2D prepare／visible material／nonempty effects2D明確UnsupportedGraphicsError，不silent ignore、不假設auto必選shader backend。無transpiler／Shader Graph／任意resources。

## 17. Whole-Frame Scene Transitions（P19）

Actual三backend Game handoff已限定驗收：crossfade／fade、old同步destroy、pause／pendingPromise、resize／immutablecapture、resume／complete／custom easingfinalendpoint。追加真nativecaptures已驗presented-slide cancel保publishedScene、async capture version supersession／late disposal、同步cancel-listener reentry／latest winner與held-capture destroy。12native snapshots全dispose，各backend errors=[]。Destroy立即釋Scenes／captures與停frames，但pending setScene Promise仍等受控native capture回傳才reject，不宣稱提前abort capture await。正式example另證paused-effect cancel；最後工具鏈37files252tests／packedconsumer通過，未指定transition仍instant switch。

```js
import { Easings } from 'xyz.js';

game.addEventListener('transitioncomplete', (event) => {
  console.log(event.detail.kind, event.detail.to);
});
await game.setScene(nextScene, {
  transition: {
    kind: 'slide',
    duration: 0.5,
    direction: 'left',
    easing: Easings.sineInOut,
    blockInput: true,
  },
});
```

SetSceneOptions.transition為TransitionOptions {kind:'fade'|'crossfade'|'slide',duration,easing?,color?,direction?,blockInput?}。Duration非負finite simulation秒；normalized ColorRGBA預設opaque black、direction left、easing linear、blockInput true。Fade outgoing→color→incoming、crossfade blend、slide四方向。Game.transitioning只指active visual、不指candidate loading。

Prepare時old active；成功prepare／owned capture後再驗cancel／version才publish／destroy old。Visual blend只有new Scene simulate；Promise等最後composited frame而非只publication。Pause／hidden凍結time／outstanding Promise，resize保留／scale immutable outgoing snapshot。Initial no-old／idle與duration0 skipvisual capture／events、原子完成。Prepare／capture failure保留current；replacement cancelcandidate／effect、reject pending Promise／釋snapshot。

Native Game transitionstart／transitioncomplete／transitioncancel detail SceneTransitionEventDetail {from,to,kind}只actual visual emit。BlockInput清capture／只block target pointer routing，非keyboard／global polling。Snapshot在completion／cancel／explicit destroy／renderer loss／destroy釋放，非old Texture destroy／resize。

Low-level Renderer.captureScene(scene,width,height):Promise&lt;RenderSnapshot&gt;不advance simulation，重畫owned storage全3D／P12／world／HUD／enabled effects，不含transition overlay。Width／height為logical pixels、snapshot尺寸backing pixels；公開僅backend／width／height／destroyed／destroy。Wrong-renderer／destroyed handle／active-frame nested capture拒絕。Renderer.render(scene?,width?,height?,{transition})接TransitionFrame {kind,progress,snapshot?,color,direction}，normalized progress0–1、missing snapshot用color。PresentedRenderer forwardcapture並present已composite結果，不延後讀preserveDrawingBuffer=false canvas。Game RAF的frames／capture交setScene管理，不另競爭。

## 18. PixiJS-inspired 擴充狀態（P21–P29）

[PLAN](../PLAN.md) 的有限 profiles 已整合到 source，並在單一環境（macOS arm64、managed headless Chromium，含 WebGPU adapter）實測；[ACCEPTANCE](../ACCEPTANCE.md) 記錄已觀察與未驗項。既有 252 tests／GitHub v1.2 不能當這些 API 的驗證。可執行參考為 [examples/rendering2d](../examples/rendering2d/index.html)（`?renderer=webgpu|webgl2|canvas2d`），在同一 Game 驅動 atlas views、retained paths、isolation／masks／blends／filters、native meshes、render targets、styled／bitmap text、manifests、interaction／accessibility 與 particles。

正式路徑仍 Game→Scene→Renderer。普通 Group 保持 global ordering；只有明確 IsolatedGroup boundary 阻止 outsiders 與 descendants interleave。Cached child edits 須手動 invalidation，不停 simulation。Offscreen RenderTexture／獨立 generated CPU Texture 不同於 immutable whole-frame transition RenderSnapshot。

Canvas 為批准 ordinary／raster 2D profile；visible native meshes／native filters 必須 throw，不能 silent skip／switch backend。Image-mask input 只 bounds，即使該 pixel transparent；rectangle／path masks 含 geometric holes。Hierarchy events／accessibility 為 opt-in，保留 default target-only routing／semantic-only DOM lifecycle。

Ownership 明確：views／meshes／fonts／particles 借 source，先 remove borrowers 再 destroy owning asset。Native texture unload 後 CPU source 仍可用。Atlas anchors／borders、CanvasTexture updates、generated RGBA fonts、ParticleLayer、prepare／unload 全必做，不是 optional。非 full Pixi／HTML-SDF-video-compressed-plugin-generalGC parity。

Compressed source 排除是 P21–P29 歷史 scope：P32 KTX2 decode／外部 codecs 與 P42 native compressed／mip profiles 擴充該邊界，其餘 Pixi non-goals 不變。實測 formats 與未驗限制見 ACCEPTANCE。

Authored [fixture factory](../examples/rendering2d/fixtures.ts) 產生可 dispose object URLs，涵蓋 atlas／pattern／masks／multipage text-JSON BMFont。真實 font 的 [provenance／license](../examples/rendering2d/assets/README.md) 與 engine license 分開。

### Affine helpers：已觀察的 P21 source foundation

Live Scene 的 Sprite 上，pixel pivot／radian skew 與 normalized anchor 獨立。Helpers 使用 logical Scene world（HUD 也相同），不是 Camera／CSS coordinates：

```js
import { Vector2 } from 'xyz.js';

sprite.pivot = new Vector2(8, 4);
sprite.skew = new Vector2(0.1, -0.05);
const point = new Vector2(4, 7);
sprite.toWorld(point, point);
sprite.toLocal(point, point); // 約 (4, 7)，output 可與 input 相同
const worldBounds = { x: 0, y: 0, width: 0, height: 0 };
sprite.getWorldBounds(worldBounds); // conservative transformed AABB
sprite.pivot.x += 10; // mutable-vector edits 會重 compose
```

Singular inverse 拋 RangeError。Isolation、masks、native filters、blends 與 offscreen targets 共用同一 API（Canvas2D 對 filters 與 visible meshes 拋 `UnsupportedGraphicsError`）：

```js
import { BlurFilter2D, IsolatedGroup2D, Mask2D, Sprite } from 'xyz.js';

const group = scene.add(new IsolatedGroup2D());
group.add(new Sprite({ texture }));
group.mask = Mask2D.rectangle({ x: 0, y: 0, width: 64, height: 64 });
group.filters = [new BlurFilter2D({ radius: 3 })]; // 僅 WebGPU／WebGL2
group.blendMode = 'add'; // normal | add | multiply | screen | erase

const target = game.graphics.createRenderTexture({
  width: 160,
  height: 100,
  resolution: 2,
});
await game.graphics.renderToTexture(target, group); // 不推進 simulation
const pixels = await game.graphics.extractPixels(target); // straight-alpha RGBA
target.destroy();
```

## Weighted 3D 透明

```ts
scene.transparency = 'weighted'; // 預設：'sorted'
const material = new TextureMaterial({ texture, transparent: true });
```

TextureMaterial 的貼圖／頂點 alpha 在 opacity 為一時使用 transparent；
opacity 小於一已自動加入。PBR 使用 `alphaMode: 'BLEND'`，
Sprite3D／Text3D 自動設定。Weighted OIT 近似交錯表面，不是精確逐層排序；
需要 WebGPU 或支援 float color attachment 的 WebGL2，也不提供多層折射或
SSAO／DOF 的透明 depth。可於 [objects3d](../examples/objects3d/index.html)
操作開關及反轉順序按鈕。

## P40 渲染診斷與 Browser Regression（限定驗收）

讀取 `game.graphics.stats` 時要自行複製欄位，不能把重用物件當歷史snapshot。既有3D draw／triangle／shadow counters保持定義；`drawCalls2D`／`instances2D`／`renderPasses2D`／`uploadBytes`為每幀CPU work、含native effects／composition。Canvas記paint／pass，不代表GPU batch parity。`renderTargetBytes`估live owned attachments（含offscreen caches／captures）、`peakRenderTargetBytes`為renderer lifetime peak，frame begin不清除；release／destroy降低resident、不清peak。這**不是GPU timers**、driver memory／全resource budget或FPS提升聲明；DebugOverlay顯示新欄位，[TECHNICAL](TECHNICAL-zh.md)記adjacent batching constraints與reset邊界。

Deep runner 為 `pnpm regression:browser`，先 `pnpm build` 與 `pnpm exec playwright-core install chromium`。預設 Canvas2D／WebGL2 必須執行；WebGPU probe 不可用時明記 SKIP。`--renderer canvas2d|webgl2|webgpu`（可逗號分隔）選 required backends，explicit WebGPU 或 `--require-webgpu` 在不可用時 fail。`--output DIR` 選 assertion JSON／canvas PNG 輸出（預設 `.vite/browser-regression`）。Installed Chromium software-rendering CI gate／既有 example smoke 不是跨 browser／真 GPU 認證；WebGL loss 用真 extension，private-device WebGPU loss injection 明記 SKIP。三 backend Chromium 153 實跑證據與歷史 hosted CI 失敗見 ACCEPTANCE。

Linux scripts 共用 SwiftShader launcher，除 WebGPU adapter 外也啟用 compositor Vulkan。Canvas swap-buffer 修正已在隔離 Ubuntu 24.04 arm64 通過 required 三 backend regression，尚未在 hosted Ubuntu x64 驗證。本機使用 `--require-webgpu` 可強制要求 adapter 可用；不增加 fallback、不略過 assertions。

P41／P42與全部第三輪選項的批准邊界見[PLAN](../PLAN.md)／[DESIGN](../DESIGN.md)，不得以歷史non-goal省略新scope。

## 21. P41 Authoring/Device Flow

限定 Chromium 三 backend 證據見 [ACCEPTANCE](../ACCEPTANCE.md)。使用引擎 renderer，不以 DOM visuals 冒充 UI。完整 [bounded profiles／ownership](TECHNICAL-zh.md#41-p41-authoringdevice-contracts) 與 [完整 typed 範例](USAGE.md#21-p41-authoringdevice-flow) 可搭配閱讀。

| 範例                                        | 用途                                                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [authoring-lab](../examples/authoring-lab/) | 正式 root consumer：UI/focus/modal、contexts/virtual controls、texture leases/warmup、typed content/save-load |

### Canvas UI／路由 actions

```ts
import {
  Game,
  Scene,
  UIRoot,
  UIElement,
  UIButton,
  UICheckbox,
  UISlider,
} from 'xyz.js';

const game = await Game.create({
  canvas: '#game',
  renderer: 'auto',
  resourceBudgets: {
    decodedTextureBytes: 32 * 1024 * 1024,
    nativeTextureBytes: 32 * 1024 * 1024,
    nativeGeometryBytes: 16 * 1024 * 1024,
  },
});
const scene = new Scene();
const root = scene.add(
  new UIRoot(game, { direction: 'column', padding: 16, gap: 8 }),
);
const open = root.add(await UIButton.create('設定'));
const modal = root.add(
  new UIElement({ direction: 'column', width: 280, gap: 8 }),
);
modal.add(await UICheckbox.create('音樂', { checked: true }));
modal.add(
  await UISlider.create('音量', { min: 0, max: 1, step: 0.1, value: 0.5 }),
);
const close = modal.add(await UIButton.create('關閉'));
modal.visible = false;
open.addEventListener('click', () => {
  modal.visible = true;
  root.focus.pushModal(modal);
});
close.addEventListener('click', () => {
  root.focus.popModal();
  modal.visible = false;
});
await open.setText('開啟設定');
await game.setScene(scene, { warmup: { maxItems: 2, maxMilliseconds: 4 } });
game.start();
root.focus.focus(open);
const world = game.input.contexts.create('world', {
  priority: 0,
  consume: true,
  bindings: {
    interact: [{ key: 'Space' }, { pointerButton: 0 }, { virtual: 'interact' }],
  },
});
world.activate(); // Scene.update 中讀 world.wasPressed('interact')。
game.input.virtual.set('interact', 1);
game.input.virtual.set('interact', 0); // cancel／up／blur 也要 release；reset() 清全部。
world.importBindings(world.exportBindings());
// teardown：world.destroy(); game.destroy();
```

UI context 只在 live semantic focus／modal 啟用，pointer consumption 同幀 reconcile；DOM 只 semantics。Modal pop 恢復 eligible previous focus。Contexts 初始 inactive，priority／最新 activation 消耗 physical sources 與 legacy actions，raw polling 不變；held activation／unblock 不製造新 press。gamepadIndex 是 actual browser index。另支援 wheel axis／direction、gesture、signed virtual bindings。非同步 setText；layout 為 bounded row／column／overlay，不是完整 CSS。

### Typed content／明示 ownership

```ts
import {
  GameObject,
  FactoryRegistry,
  defineFactory,
  buildContentScene,
} from 'xyz.js';

const registry = new FactoryRegistry({
  marker: defineFactory<{ x: number }, GameObject, { origin: number }>({
    parse(value: unknown) {
      if (
        typeof value !== 'object' ||
        value === null ||
        !('x' in value) ||
        typeof value.x !== 'number' ||
        !Number.isFinite(value.x)
      )
        throw new TypeError('marker.x 必須有限');
      return { x: value.x };
    },
    create(options, context) {
      const node = context.own(new GameObject());
      node.position.x = context.services.origin + options.x;
      return node;
    },
  }),
});
const content = await buildContentScene(
  registry,
  {
    version: 1,
    nodes: [{ id: 'player', kind: 'marker', options: { x: 24 } }],
  } as const,
  { origin: 10 },
);
const player = content.get('player'); // GameObject | undefined
content.require('player', 'marker').position.y = 20;
await game.setScene(content.scene, { warmup: { maxItems: 2 } });
```

未知 JSON 先 parseContentScene(registry, value)，每個 options 由 explicit parser 驗證；unique IDs／parents／references: { alias: 'id' }／dependencies 全 preflight。Factory 只透過 context.reference(alias) 讀明示 aliases。Async factory 在 fallible await 前 context.own，回 fresh detached owned subtree；services／assets 仍 borrowed。Build 回 unpublished Scene，setScene 才發布，serializer 只 explicit 2D IDs，不含 unnamed descendants／3D；無 reflection／eval／自動 resource ownership。

Loader textures：`const lease = await game.assets.acquireTexture(url)`，借 `lease.texture`，移除全部 borrowers 後 `lease.release()`；legacy loadTexture pin 到 unload／destroy。Manual `await game.warmup(scene, options)` 回 lease，需 release；setScene warmup 保護 candidate 到 scene lifetime，combined budget 不足不損舊 frame。Items／milliseconds 在資源間判斷，單項可超時，dependency snapshot 不追蹤 mutations，progress 不計舊 scene prelude。

Decoded CPU／native texture／native geometry 是獨立 cache estimates；native LRU 只淘汰 idle／未 active／未 retained allocations，可 reprepare，不動 borrowed CPU ownership。Canvas native residency 為零；caller bitmaps／derivedCanvas／attachments／scratch／driver／pipelines 排除，不是 total VRAM／process memory 上限。分別觀察 game.assets.residency／game.graphics.residency。

## 22. P42 3D Gameplay 與動畫

Root API 提供有限 3D primitive physics、capsule movement、authored waypoint navigation 與 bounded animation profiles，契約見 [TECHNICAL](TECHNICAL-zh.md#42-p42-native-rendering物理navigation-與動畫-profiles)。Active Scene 自動推進 physics；character／path 更新由 gameplay 明示控制。

```ts
import {
  Scene,
  Object3D,
  Vector3,
  PlaneCollider3D,
  CapsuleCollider3D,
  CharacterController3D,
  NavigationGraph3D,
  PathFollower3D,
} from 'xyz.js';

const scene = new Scene();
const floor = new Object3D();
floor.collider = new PlaneCollider3D();
scene.add(floor);
const player = new Object3D();
player.collider = new CapsuleCollider3D(0.25, 1.5);
player.position.set(0, 1, 0);
scene.add(player);
const character = new CharacterController3D(player, scene.physics3D);
const graph = new NavigationGraph3D({
  nodes: [
    { id: 'start', position: new Vector3(0, 1, 0) },
    { id: 'goal', position: new Vector3(2, 1, 2) },
  ],
  connections: [{ from: 'start', to: 'goal', cost: Math.sqrt(8) }],
});
const follower = new PathFollower3D(character, { speed: 2 });
follower.setPath(graph.findPath('start', 'goal'));
let playing = true;
scene.update = (deltaSeconds: number): void => {
  if (playing) follower.update(deltaSeconds);
};
function setGameplayPaused(paused: boolean): void {
  playing = !paused;
  scene.physics3D.enabled = !paused;
  scene.animations.paused = paused;
}
// await game.setScene(scene) 發布，再 game.start()。
// Gameplay teardown：follower.destroy(); character.destroy();
// Scene／Game teardown 負責自己的 objects／worlds。
```

Graph points 是 capsule center，需自行 author obstacle-safe routes。Controller 不提供 gravity／jump，要用自己的 displacement 呼叫 character.move；其 result／contacts 重用，跨下一次 move 保留時需 copy。Blocked follower 必須在障礙改變後 explicit resume。Gameplay pause 保持 Game running，HUD 才能繼續操作；Game.pause 則凍結整個 simulation，兩者音訊都需 explicit pause／resume。

動畫用 AnimationMask 明示 channel allowlist；AnimationReferencePose 配 action.setAdditive 建立 reference-relative overlay。AnimationBlendTree 接管同步 leaf actions，支援 1D points 或 explicit triangulated 2D parameters。Direct root／middle／tip chain 可將 TwoBoneIKConstraint 加到同一 mixer；sampling／IK 早於 Scene.update，gameplay 仍可調整 final pose。Mixer 借用 targets，clear／destroy 釋放 playback／constraints，不 destroy targets。

### Native skin 與 mip textures

WebGPU／WebGL2 原生繪製 skin palette；保守 animated bounds 使用 transformed influence boxes，exact CPU deformation 僅在 queries 按需更新。Morph 先於 skinning。這是有限 profile，不是 throughput 聲明。Native textures 也只支援 GPU／GL；請查實際裝置的 `game.graphics.capabilities.supportedTextureFormats`，不要只看 backend 名稱。

```ts
import { NativeTexture2D, decodeKTX2Native, GLTFLoader } from 'xyz.js';
import type { NativeTextureMip } from 'xyz.js';

const levels: NativeTextureMip[] = [
  { width: 2, height: 2, data: new Uint8Array(16).fill(255) },
  { width: 1, height: 1, data: new Uint8Array([255, 255, 255, 255]) },
];
const texture = new NativeTexture2D({
  format: 'rgba8unorm',
  width: 2,
  height: 2,
  levels,
});
// Material 使用 texture；textureSampler 明示啟用 mip sampling：
// { minFilter: 'linear', magFilter: 'linear', mipmapFilter: 'linear', lodMaxClamp: 1 }
const response = await fetch('/assets/model.ktx2');
if (!response.ok) throw new Error(`KTX2 HTTP ${response.status}`);
const native = await decodeKTX2Native(
  new Uint8Array(await response.arrayBuffer()),
);
const asset = await new GLTFLoader().load('/assets/model.glb', {
  nativeTextures: true,
});
// 先移除所有 borrowers，再 texture.destroy()、native.destroy()、asset.dispose()。
```

Mip 尺寸逐層減半（向下取整，最小一），payload 必須符合 exact RGBA／block layout。Native KTX2 對支援的 Vulkan formats／無或 ZLIB supercompression 保留每一 mip；Basis／其他 encoding 需真實 `KTX2NativeTranscoder`（glTF option `ktx2NativeTranscoder`），不能用普通回 RGBA 的 `ktx2Transcoder` 替代。不支援的 format 明確拒絕，不解壓替代也不切 backend；普通 image 與預設 base-level KTX2 路徑不變。Root profiles 見 [技術第 42 節](TECHNICAL-zh.md#42-p42-native-rendering物理navigation-與動畫-profiles)，native 證據／限制見 [ACCEPTANCE](../ACCEPTANCE.md)。

### 遊玩 Beacon Run

透過本機 examples server 開啟 [Beacon Run](../examples/beacon-run/)，可加 `?renderer=webgpu` 或 `?renderer=webgl2`。Canvas2D（含 `auto` 降到 Canvas）會明確顯示不支援 3D，不會替換成 2D 遊戲。完整 GPU／GL 遊玩流程已限定 P42 驗收。

- **Loading／menu：**顯示 pipeline warmup 與真實 OPM assets fetch progress；資產失敗可按 **Retry asset loading**。**Start with sound** 需可信 pointer click 或 semantic control 的 Enter／Space 操作；fetch 本身不 unlock／decode audio。**Play muted** 不需解鎖音訊；Settings 提供 **Enable sound / retry unlock**。
- **目標／HUD：**75 秒內收齊四個青色信標，再回綠色撤離平台。避開紅色巡邏 drone；遭攔截或時間歸零即失敗。可推動 dynamic crates 或跳過障礙。HUD 顯示信標數／剩餘時間／狀態，勝敗畫面可 **Restart run** 或 **Main menu**。
- **操作：**WASD／方向鍵或 standard gamepad 左搖桿移動；著地時 Space／gamepad A／canvas **Jump** 跳躍。方向 sliders 支援 pointer／touch／keyboard，release／cancel／blur 歸零。Tab 可到引擎 semantic controls；UI focus 優先於 world movement。按 **Return focus to arena** 或點 arena 恢復遊戲操作。
- **Pause／settings：**Escape／**Pause** 凍結 timer／physics／navigation／animation，renderer／UI 仍運作；blur／hidden-page 也暫停。**Resume run** 繼續。Settings 限制 modal focus，並保存 master volume／mute／reduced character motion。遊戲音訊用 explicit pause reason，不假設 `Game.pause()` 會停聲。
- **存讀檔：**經驗證的本瀏覽器 local storage 保存 preferences 與一份 continuation，含時間／信標／player／patrol／crates transforms 與 velocities。定期、收集信標與 pause 自動存檔；**Save run**、**Load saved run**（讀回仍 paused）、menu **Continue saved run** 支援 reload。已結束 run 不可繼續；missing／corrupt／storage unavailable 會顯示訊息，不捏造進度。
- **清理／復原：** **Destroy game** 或 non-persisted pagehide 儘可能保存未完成 run，釋放 input contexts／controllers／follower、Scene physics／UI borrowers、audio 與 shared native mip texture；reload 才能再玩。Graphics loss 暫停 run，復原後手動 resume；persisted pagehide 只暫停不 destroy。

## 23. Fixed Gameplay 與呈現

對模擬時間敏感的移動與持續力放在 `fixedUpdate`；frame UI 與一次性 input 命令收集留在 `update`。Game 在每個 fixed callback 後推進兩個 physics worlds。

```ts
import {
  Scene,
  Object3D,
  RigidBody3D,
  SphereCollider3D,
  Vector3,
} from 'xyz.js';

class FixedScene extends Scene {
  readonly actor = this.add(new Object3D());
  private readonly thrust = new Vector3(120, 0, 0);
  constructor() {
    super({ fixedDelta: 1 / 120, maxFixedSteps: 12, interpolatePhysics: true });
    this.actor.collider = new SphereCollider3D(0.5);
    this.actor.body = new RigidBody3D({ gravityScale: 0 });
  }
  override fixedUpdate(): void {
    this.actor.body!.applyForce(this.thrust);
  }
}
```

兩個 hooks 都不要額外呼叫 `physics.update`／`physics3D.update`。`fixedFrame`／`fixedElapsed` 表示已完成 Scene ticks，`droppedSimulationTime` 記 bounded catch-up 丟棄時間。插值只影響 Game render，不改 actor 模擬位置或 queries。Frame 提交的力依時間加權，沒有 physics tick 的 frames 也正確保留；`clearForces()` 取消待消費 impulse。詳見[時間契約](TECHNICAL-zh.md#43-fixed-gameplayframe-forces-與呈現插值)。

## 24. Release 驗證（P44）

執行 `pnpm regression:browser --renderer webgpu`，不能把無 adapter 的 skip 當 mandatory GPU pass。Release tag 在封裝／發佈前先執行共用 CI gate；失敗時保留 `.vite/browser-regression/`／`.vite/example-smoke/` 的 assertions、PNG 與 diagnostics。本機成功不代表 hosted Ubuntu 已恢復。

## 25. 3D 候選統計（P45）

在 fixed tick／query 後複製 `scene.physics3D.stats`，觀察 `candidatePairs`／`narrowphaseTests`／`queryCandidates`。共用 AABB hierarchy 縮小 narrowphase candidates，但公開 mutable transforms 仍需 O(n) refresh，不能宣稱整個 query 為 sublinear。詳見[空間索引契約](TECHNICAL-zh.md#45-共用-3d-spatial-indexp45)。

## 26. Incremental Navigation（P46）

以 `grid.createSearch(start, goal)` 建立 job，每個 gameplay tick 執行 `job.step(32)`；只在 found／unreachable 等 terminal state 消費 `job.result`。放棄 route 時 cancel，grid／graph revision edits 會 invalidate pending jobs；每 owner 最多八個並行 workspace。同步與 incremental 共用 A*，不是無上限 scheduler。

## 27. 動態 Authored Routes（P47）

`NavigationFollower3D` 借用 `CharacterController3D`，用 `navigate({ graph, start, goal, agentRadius })` 發動路線，從 fixed gameplay update。用 `graph.setConnection`／`setConnections` 更新 authored topology；clearance 是 world-unit radius。Revision／真實物理阻擋後，從最後抵達 anchor 做 bounded replan，不沿 stale route 繼續走；不是自動 navmesh。

## 28. 混合負載與 Soak（P48）

開啟 `/benchmarks/mixed/`，或執行 `pnpm soak:mixed --preset smoke --duration 60 --renderer all --parallel 1 --output /tmp/mixed.json --timeout 400`。`--preset hour --timeout 3900` 驗每個 backend 一小時實跑；`--parallel 1` 同時執行並共享 host 負載，`--parallel 0` 依序執行三個 backend 需超過三小時。`--consumer /absolute/extracted/package` 驗封裝 root。保持分頁 visible，分開看 RAF tails、CPU simulation／submit／load hitches 與每次 scene cycle 的 cleanup。短跑不能證明無限長 cache／driver-memory plateau。

## 29. 2D／3D 動態內容存檔（P49）

用 `JSON.stringify(content.capture())` 保存，透過 `await rebuildContentScene(registry, JSON.parse(json), services)` 重建，再將 `candidate.scene` 交給 `game.setScene`。保留候選 `ContentScene` 供後續 spawn／remove／save。Factories 重建 geometry／assets；prefab descendants 必須宣告 children aliases／stable IDs，custom objects 提供 state adapter。每個 live object 都需 authored ID，dangling references 會阻止 removal。

## 30. 可重現 Assets 與部署（P50）

執行 `pnpm assets:build --input examples/asset-recipe/source.gltf --out /tmp/xyz-assets`。`pnpm pack` 並解壓後，執行 `pnpm check:asset-deployment --package /absolute/extracted/package --bundle /tmp/xyz-assets --renderer webgl2`，再驗 webgpu。依[Asset Recipe](ASSET-RECIPE.md) 的 pinned toolchain／manifest／codec 限制；部署完整 dist tree，包含官方 vendor worklet，不能只複製 root JS。

## 31. 原生文字編輯（P51）

```ts
const root = scene.add(new UIRoot(game, { direction: 'column', gap: 8 }));
const field = root.add(
  await UITextInput.create({
    label: '名字',
    value: '語',
    maxLength: 32,
    layout: { width: 280, height: 40 },
  }),
);
root.focus.focus(field);
field.setSelectionRange(0, field.value.length);
```

Native transparent input 處理 keyboard／clipboard／undo／IME；canvas 畫文字、selection、caret。Offsets 與 maxLength 是 UTF-16；先 publish／layout 再 focus，正常 gameplay keyboard polling 排除 editing targets。合成 composition 測試不等於實體 OS IME 認證。

## 32. Scroll 與 Bounded Virtual Lists（P52）

`UIScrollView` 用 `view.content.add(widget)` 加內容，設定 finite viewport layout，再用 `scrollTo`／`reveal`。`UIVirtualList` 的 owned-row factory 必須同步回傳 fresh detached row，bind 必須同步重設 reused state；非同步 widgets 先 prepare 再交 factory。Stable keys 保持重排的 active row／native focus，`focusKey` 直接揭露未 mounted rows，mounted／pool 數受限。Unused prepared rows 由 caller destroy。

## 33. Triangle Floors 與 Walls（P53）

將 `new TriangleMeshCollider3D(xyz, triangleIndices, { sidedness: 'double' })` 附加到 static／collider-only Object3D。這是 surface，不是封閉 solid containment；front 採 authored counterclockwise one-sided collision。替換 descriptor 才重建 owned triangle BVH，修改 render Mesh vertices 不會自動更新 collider。

## 34. Compound Shapes（P54）

`CompoundCollider3D` 使用 flat child collider／position／rotation／scale descriptors。Dynamic primitive children 先按 uniform-density COM 置中，root filters 套到 union，真 gaps 保持空隙；包含 mesh child 的 compound 必須 static。Inertia 包括 rotated child tensor／parallel-axis terms，不是外框近似。

## 35. Continuous 3D Translation（歷史 P55）

P55 的 `new RigidBody3D({ continuous: true })` 原先只對 static targets 做 translation sweep。當時 rotation／dynamic-pair 排除已由第 38 節未發佈 bounded solver 擴充；public translation sweeps 仍只掃平移。仍應使用合理 fixed steps；iteration exhaustion 只保留 proven-free prefix，不虛構 collision／impulse。

## 36. 消費 Root Motion（P56）

建立 `AnimationRootMotion(skeletonRoot, { target: actor })`，並用 `setRootMotion` 將同一 binding 附加到 locomotion actions。也可提供 sink，把 reused body-local deltas 轉成 world coordinates，交给 `CharacterController3D.move`。從 fixedUpdate 推進專用 `AnimationMixer`，避免又由 `Scene.animations` 重複 advance。

## 37. 播放前 Retarget（P57）

`AnimationRetargeter` mappings 宣告一對一 source／target nodes、explicit bind transforms、每個 non-root 的 direct parent，並指定對應 skeleton roots。先 retarget source clip，再用現有 target mixer／skin／root-motion consumer 播放。不要修改 source tracks；scale／interpolation 限制以[技術契約](TECHNICAL-zh.md)為準。

## 38. Production 契約（v1.10）

以下功能納入 **v1.10／1.10.0／Apache-2.0**，不是修改已發佈 v1.9 assets；上述歷史日期／counts 不變。Bounds／ownership／errors 以[技術契約](TECHNICAL-zh.md)為準；真外部工具鏈見[asset recipe](ASSET-RECIPE.md)。

- **Startup：**Scene physics／animation／3D camera／navigation 在使用時才初始化。Canvas startup 不載入 GPU backend chunks；shared root facade reachability 仍存在，不是獨立 microengine。
- **Assets：**固定官方 Basis v2_50／Draco 1.5.7 產出 semantic gamma／normal／alpha mips、BC7／ETC2 RGBA8／ASTC 4×4、universal Basis／PNG／RGBA fallback，以及 compressed／expanded glTF。Runtime 按 capability 選擇，不偷偷切 backend。Codecs 仍外部提供，未加 runtime dependency。Typed Draco 保留 raw／normalized／logical accessor metadata；不能宣稱任意 UInt32 經整個 Float32 glTF consumer path 仍無損。
- **Ownership／save publication：**ResourcePool scopes 支援 shared acquisitions、candidate rollback 與 borrower-first teardown。Factory nodes 必須以 `ctx.own` 登記，取消後晚到結果也追蹤。Fresh save candidate 準備成功才 publish，失敗／取消保留原 live scene。Cleanup 失敗明確回報且保留供 retry，不吞錯。
- **Work：**Spatial queries 僅變更時 refresh／refit geometry，但 public mutable pose checks 仍 O(N)。Navigation searches／admissions／collision bakes 共用每 visible Game frame 一份 bounded cooperative Scene quota，不是每 NPC 各自 budget。整合 pause／lifecycle cancellation／debug counters；work units 不是 preemptive milliseconds 保證。
- **3D physics：**Upright capsule controller 跟隨 moving／rotating support，jump／removal／teleport 時 detach；stance 變更保留腳底，blocked stand 保持 crouched。Distance／ball-socket／hinge joints 提供 bounded spring／motor／limit／break profiles。Opt-in continuous bodies 擴充 dynamic-pair／angular motion；CCD 耗盡保留 conservative free motion 並回報 exhaustion。**Physics2D CCD 仍 translation-only**。
  上述 Physics2D 排除屬 P58–P70 歷史；P76 已加入 bounded relative dynamic／rotational CCD（第39節）。
- **Navigation：**`NavigationGridBakeJob2D` 採樣 collision occupancy；`NavigationSurfaceBakeJob3D` 現保留有界多個 support 與 swept capsule edge clearance。Bake／rebake 原子 publish、依 revision invalidation；P78 把歷史 topmost-only 擴充為有限多層 lattice，非 polygon navmesh。
- **Text：**Native 2D text／input 支援 bidi visual order、grapheme-safe caret／selection／fallback-font runs。Trusted browser editing 不等於 OS IME 認證。Text3D 仍 native fillText，不使用新的 2D run／caret renderer。
- **Audio：**Channel／master native biquad／compressor／prepared convolution effects 處理 sample／stream／OPM；activity ducking、absolute manager-clock automation／cancel-and-hold、listener／emitter world bindings 共用既有八 contexts。Pause 用 explicit audio reasons，不假設 `Game.pause()` 停聲。Bindings 借用 objects／playbacks，owner teardown 前 unbind。

### 共用 navigation quota 範例

在已有 initialized `game` 的頁面執行；Game 正常 frame 推進 scheduler，不要每 NPC 又 update 一次：

```ts
import { Scene, NavigationGrid2D } from 'xyz.js';

const scene = new Scene({ navigationWorkBudget: 32 });
await game.setScene(scene);
const grid = new NavigationGrid2D({ columns: 8, rows: 8 });
const search = grid.scheduleSearch(
  scene.navigation,
  { column: 0, row: 0 },
  { column: 7, row: 7 },
);
// 後續 frames 檢查 search.status/result 與複製的 scene.navigation.stats。
// Scene destruction 取消 scene-owned scheduled work。
```

### Native music processing 範例

從 trusted user gesture 呼叫，使用 initialized `game`；設定處理實際 manager music，不是 mock：

```ts
await game.audio.unlock();
game.audio.music.setEffects([
  { type: 'biquad', filter: 'lowpass', frequency: 1800, Q: 0.7 },
  { type: 'compressor', threshold: -24, ratio: 4 },
]);
game.audio.setDucking([
  { source: 'sfx', target: 'music', gain: 0.25, attack: 0.02, release: 0.2 },
]);
game.audio.music.automate(0.5, game.audio.currentTime, 0.3, 'linear');
// 真 active sfx playbacks 自動 duck music。
// game.audio.music.cancelAutomation() 保留目前 gain。
```

### 驗證與可執行 diagnostics

使用 `pnpm check:tree-shaking`、`pnpm platform:browser`、`pnpm smoke:text` 執行 focused diagnostics。Asset commands 需真實 paths：`pnpm assets:build --input /absolute/model.gltf --out /absolute/new-bundle --profile /absolute/trusted-profile.json`，再執行 `pnpm check:asset-deployment --package /absolute/extracted/package --bundle /absolute/new-bundle --renderer webgl2 --profile /absolute/trusted-profile.json`。Output 必須尚不存在；profile 設定見 [asset recipe](ASSET-RECIPE.md)。Mixed measurement 使用 `pnpm soak:mixed --duration 3600 --renderer all --output /tmp/mixed-hour.json`；指定一小時不代表已完成量測。保持頁面 visible，observability 操作見 [ACCEPTANCE](../ACCEPTANCE.md)。

目前 handoff 證據包括限定 Chromium 153／Firefox 155／managed WebKit 26.6 paths（Firefox WebGPU adapter unsupported）、真固定版 codec CLI、built-root physics／navigation／resources scenarios、native Chromium WebAudio signal measurements。10 秒 native Apple M5 shared-host observability smoke 量測 heap／GC／RSS 與 GL GPU timestamps；Canvas GPU timing unsupported（`null`），RSS 不是 VRAM。一小時／low-tier 必須另外完成並記錄；mobile emulation 不是實機認證。Safari formal verification／實機 mobile／gamepad／音訊硬體／OS IME 未驗證；不可對他人的 Safari session 執行 automation。最終 platform reruns／long-run 證據記於 ACCEPTANCE，不從這些範例推論。

## 39. P71–P87 Production 擴充

以下 v1.11 契約採 metadata **1.11.0**、npm 未發佈。Source 交付、歷史 browser 觀察與本輪 native 驗收不同；已執行 gates 只依 [ACCEPTANCE](../ACCEPTANCE.md)，不從能力表推論 parity／認證。

| 能力                      | 使用契約／邊界                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P71 audio                 | 非手勢載入先用 `autoplay:false`，再由可信操作直接呼叫 `play()`。Context unlock 不保證所有 media autoplay。Pause／stop／cancel supersede pending startup；原生錯誤可觀測。各 context 保留本地 rendered gain envelope，不承諾 hard-real-time／實機時序。                                                                                                                                                   |
| P72–P73 consumer          | 使用上述 starter 與已安裝公開 root，保留完整 dist／vendor／worker 樹。既有 counts／日期屬歷史版本，不是本輪證據。                                                                                                                                                                                                                                                                                        |
| P74 saves                 | SaveManager revision 拒絕已觀測的 stale owner；IndexedDB transaction／LocalStorage Web Locks 協調分頁。Custom backend 僅 process-local；LocalStorage 非 crash-atomic。`load(slot,{recovery:true})` 唯讀 backup、不改 corrupt 原文；明示 `restore(slot)` archive 損壞 payload。AutosaveController owns timers／pending writes、呈現 state、錯誤後明示 retry，owner 必須 destroy；stale 先載入／解決衝突。 |
| P75 platforms             | 真 hardware gate 要 identity／version／session 與 native scenario 證據。Emulation、managed WebKit、AX tree 不等於實機／Safari／輔具認證。禁止發聲使 audible-output proof 明列 blocked。                                                                                                                                                                                                                  |
| P76 2D motion             | CharacterController2D 借用已註冊 upright root convex owner／world；在 `Scene.fixedUpdate` 呼叫 `move` 並帶 `epoch:scene.fixedFrame`，caller 提供 gravity／jump、結束 destroy controller。平台 carry 每 epoch 一次。Bounded relative rotational CCD 耗盡只回報未證明省略時間，不偽造 contact／clamp velocity；sensor discrete，不支援 dynamic concave／compound／deforming sweeps。                       |
| P77 locomotion            | `scene.createLocomotion3D(controller,options)` owns 獨立 fixed mixer／driver、借用 capsule／visual skeleton。FixedUpdate 設 input，不再 manual advance 或把 mixer 加入 Scene 普通動畫。Scene destroy driver 不 destroy 借用物件。限 upright capsule／yaw，不是通用攀爬／游泳 controller。                                                                                                                |
| P78 navigation            | 有限多層 sampled lattice：default4／max8 support slots、總8192 slots、有限 support sampling／capsule clearance；非 polygon navmesh／連續支撐證明。Projection 必須水平／垂直距離上限與 certified radius。Bake／search 共用 Scene quota。特殊 link 要真 traversal handler，缺少即 blocked，不穿樓板 teleport。                                                                                             |
| P79 visibility            | Renderer-owned 集合保留 offscreen shadow caster／完整 shadow instances。Screen LOD／HLOD 使用 coverage 與 owned node replacement、借用資源不銷毀。Native occlusion 是 opt-in exact-state depth-query proof，pending／stale／exhausted 保持可見。Mutable pose refresh O(meshes)、instance tests O(instances)；未知 custom displacement 保守可見。                                                         |
| P80／P84 material／lights | NativeMaterial3D 提供明示 WGSL／GLSL mesh hooks、借用 textures／uniforms 與可用時的有限 deformation bound；無 transpiler／Canvas3D fallback。Publication 前處理 native preparation failure。有限 camera／shadow distance 與 per-draw point／spot selection 不等於 Scene pool；budget 明示 select／reject，不保證全部 authored lights／shadows 影響每 draw。Native backend 驗收另記。                     |
| P81 streaming             | `scene.createWorldStreaming` owns bounded cell admission／pause／publication／retirement。Loader 在 fallible await 前 own detached root，使用 pooled scopes，consumer teardown 後 release。只有 active cells 提供 collider／navigation；cancelled late reservation 保留至 settlement。Error sticky、retry 明示。Cell caps 不是 VRAM budget／CPU preemption。                                             |
| P82 workers               | NativeWorkerPool 以可信 module URL 執行真 Workers，bounded queue／bytes、明示 transfer／copy ownership、running cancel 真 terminate。Destroy 終止 owned workers。成功 output caller-owned；definition 回收未發布 native payload。Geometry publication 仍在 main-thread validate／interleave／copy 並回報成本，transfer 非 zero-copy publication／FPS 保證。                                              |
| P83 import                | Tiled finite orthogonal right-down JSON 支援 atlas tilesets／GID transforms／layers／properties／真 object與tile collider。Unsupported field／format 精確拒絕；無 editor GUI／外部 arbitrary code。ResourcePool／content scopes 保護 shared borrower 與 late decoded assets。                                                                                                                            |
| P85 particles             | Native GPU particles 在 GPU／GL 以 bounded seed／time／rate／burst／capacity／lifetime／space 契約執行；Canvas2D unsupported。Scene owns simulation time／lifetime；GPU visual particles 非 CPU physics collider、非 exact replay／readback 保證。                                                                                                                                                       |
| P86 measurement           | WebGPU timestamp 是真 render／compute pass duration 總和，不含 gaps／queue／presentation；WebGL 為 native command interval。Unsupported／empty／quantized／invalid 為 nullable，不捏造 CPU fallback。代表 loading／steady workload 分開 frame／CPU／GPU／hitch／heap／RSS／residency estimates，以裝置明示 limits 比較，不承諾通用 FPS。                                                                 |
| P87 accessibility         | Game-local preferences 真正調整 canvas text scale／contrast／decorative reduced motion，OS 預設、玩家 override；必要 simulation 繼續。Semantic DOM 只鏡射 focus／modal／live announcement；application owns modal 關閉、remap、localization。完整英語／繁中 route 可鍵盤遊玩；真 spoken AT 未驗／blocked，不以 AX snapshot 冒稱認證。                                                                    |

Manual owner 必須在真實 lifetime boundary cancel／destroy controllers／pools／UI／resource scopes；Scene／Game 只管理明示透過自身建立的 API。Browser signal 驗證只用獨立 owned muted process／native zero-gain sinks，不使用共享 session／Safari、不宣稱實體可聽輸出。

目前 authored 上限為 Scene 各1024 point／spot lights，每 draw 最多各32；shadow allocation 另計（最多4 directional cascades、8 point／8 spot shadows、明示有限 reach）。這是 storage／shading／atlas 契約，不是無限 clustered lighting／效能承諾。GPU particles 由 CPU 排程 bounded birth commands、native vertex 計算運動；local 跟隨目前 affine、world 保留 birth affine。Capacity 最多65536、drop-new admission；stop 仍 aging survivor、pause 凍結時間、clear 釋放 native ownership。

### 線上部署與限定 native 驗證

`npx pnpm@12.6.0 build:site` 建置54個 HTML entries，包含全部45個範例 directory 與兩個 catalogs。整棵 `.vite/site/` 以 HTTP／HTTPS 部署，保留 engine modules／emitted workers／14件 canonical 官方 OPM 檔案。不使用 `file://`，不刪 vendor／worker subtree，也不把 Canvas3D 的明示 unsupported 當作3D支援。Tiled 範例尊重三個正式2D backend的 renderer query。

212-route smoke 與獨立安裝 starters 是限定 browser／deployment 證據，不是 hardware 認證。三引擎 native audio 在播放前接 zero-gain physical sinks；證明 upstream PCM／reference／cleanup，不證明可聽輸出。原始失敗與後續明確 frozen reruns 在 ACCEPTANCE 分開保留。

Production runner 在 teardown 前捕捉 live 畫面，接受 operator 明示 limits，例如 `node scripts/production-workloads.mjs --renderer webgpu --limit stages.steady.cpuSubmitMs.p95=30 --limit stages.steady.frameIntervalMs.p95=60 --limit stages.asset-loading.frameIntervalMs.max=250`。缺 limits／metrics 為 BLOCKED，超過 supplied limit 為 FAIL，不靜默 retry／改標。另依目標裝置提供 texture／geometry／render-target estimate limits；這些 estimates 與 process RSS 不是 VRAM。本機明示門檻與五組完成結果見 ACCEPTANCE。Canvas2D full untinted snapshot fast path 修正實測66.75ms RAF p95失敗，沒有放寬60ms gate；不承諾通用幀率。

Hosted macOS policy 使用 `node scripts/production-workloads.mjs --renderer webgl2 --presentation native-foreground --profile benchmarks/production/hosted-macos-webgl2.policy.json --limit operations.teardownWallMs=5000`。Default 仍是 `headless`；calibration／verification 使用相同明示 pin 的 mode。Native-foreground 需要 macOS 與未鎖定、可真正取得前景的桌面；每個 workload 擁有獨立 headed browser／default context，透過正式 `connectOverCDP({noDefaults:true})` 不安裝 focus override，不是向另一 session 無效送 `false`。驗證實際 native PID／AppKit／window 及真 DOM focus／visibility，缺證據或中斷 FAIL。不改 signing／clock／workload／效能 ceilings 換 PASS。本機真失焦 guard 已通過，完整 revised hosted qualification 仍待完成，不是實機認證。

後續 [CI37105917252](https://github.com/YueyuHoshizora/XYZ.js/actions/runs/37105917252) 五個hosted前景workloads與真失焦guard已通過，Windows原生圖形failures仍阻擋發佈。使用者明示批准 pinned WindowsWebKit編譯關閉的WebAudio／AudioWorklet記UNSUPPORTED、不偽造unlock PASS；WebKit其他graphics／input／lifecycle／cleanup及WindowsChromium／Firefoxnativeaudio仍必須通過。

## 40. 1.x 相容擴充 profiles（P88–P96）

這些 profiles 保留公開1.x root 與套件 metadata。上述 P71–P87 限制屬當時階段；目前擴充與已執行證據另記於 [ACCEPTANCE](../ACCEPTANCE.md)，不等於實機認證。

- **相容性：** `check:api-compatibility` 保留已發佈 value／type export snapshot，編譯維護中的 v1.10 custom-renderer fixture；不是所有歷史 signature 的完整認證。自訂 renderer 可省略 `prepareGpuParticles`，caller 先檢查 method；引擎 wrappers 對缺失能力明示拒絕。
- **持續 gates：** CI 額外要求 production-site smoke、silent native audio loading、production benchmark 執行與真 pack／獨立 install 的2D／3D starters。Workflow 已接線不代表新的 hosted run 已通過。
- **glTF：** UV0／UV1 與十四個 material texture slots 各自的 `KHR_texture_transform` coordinates。八 influences 必須成對 `JOINTS_1`／`WEIGHTS_1`；四 influences 保留舊 layout。缺少 referenced UV stream／第三 UV或influence set 明示拒絕，不 silent select／truncate。
- **Tiled：** 正式 resource／content 路徑匯入 finite／infinite orthogonal atlas maps、負座標 sparse chunks、nested groups、repeat／parallax image layers、atlas animation、相對 object templates。Async loader 做 bounded native gzip／zlib；sync parser 接 arrays／uncompressed base64。`setGid` 在匯入 grid 內一起更新 collision／display。Unsupported orientation、image-collection tilesets、profile 外 object shapes 仍拒絕。
- **效能：** `--quality baseline|low|high` 與 `--device native|simulated-low-tier|simulated-low-tier-heavy` 分開選。Quality 真正改 viewport／content counts；simulated device profile 加具名 CPU／network pressure，明示不代表實體低階裝置。RAF、CPU submit、GPU interval、memory estimates 分別報告。
- **導航：** `NavigationMesh3D` 使用 authored convex coplanar polygons、精確 shared edges、certified headroom、radius-safe corridors 與 explicit links；重疊樓面保持分離。`NavigationTiledGraph3D` snapshot 既有 authored／collision-baked graphs 與 explicit seams，保留每 graph8192-node 舊限制。兩者透過共用 scheduler 做 budgeted sparse search。Mesh waypoints 為 feet positions；`NavigationMeshFollower3D.follow` 明示 center-to-feet offset。缺 traversal handler 就 blocked。
- **原生圖形：** `scene.shadows` 提供 `cascadeBlend`／`slopeBias`／`cache`／`invalidate()`。Mutable state invalidate shadow reuse；static cache counters 不是 FPS 保證。Native hooks 仍明示 WGSL／GLSL、受 device limits 限制；`shadowCache:'tracked'` 承諾只由 tracked vertex inputs／uniforms／maps 決定輸出，預設 dynamic。無 shader transpiler／Canvas3D fallback。
- **設定／檔案：** `SettingsManager` 使用 storage、preferences 與具名 input contexts，persist 完整 remaps／overrides、migrate accessibility-only v1 settings、durable reset。`PortableSaveFiles` 先驗證 fresh disposable candidate 再 revision／CAS persistence；後續 guarded Scene publication 是不同交易。Starters 提供真正 remap／reset／portable checkpoint及settings controls。先 prepare download，再由第二次 trusted click 下載；保留 rejected original file bytes。
- **部署：** Starter builds 產生 strict CSP header artifacts，host 必須真正套用。`GAME_OFFLINE=1` 加入 base-relative verified service worker／cache 與可見 update／removal controls。Failed install 保留前一個完整 generation；activation 等舊分頁關閉。移除 offline storage 不刪玩家 saves。部署保留整棵 build／emitted workers／immutable OPM assets，不部署 source／credential trees。

```sh
npx pnpm@12.6.0 check:api-compatibility
npx pnpm@12.6.0 smoke:starters
node scripts/production-workloads.mjs --renderer webgl2 --quality low --device simulated-low-tier --limit operations.teardownWallMs=5000
GAME_BASE=/games/2d/ GAME_OFFLINE=1 npx pnpm@12.6.0 build
node node_modules/xyz.js/scripts/deployment-server.mjs dist /games/2d/ 4173
```

最後兩行在 generated starter 內執行。只有 teardown bound 的 benchmark 是 runner／cleanup guard，不是幀率 gate；效能資格另提供目標裝置的 RAF／CPU／GPU／residency limits。Production headers、offline gameplay、native audio／worker 與實機認證仍是不同證據。

## 41. 目前文件與 consumer 工具（P97–P103）

[CURRENT](CURRENT.md) 是 v1.12.4 capability／API／support 規範入口；上方舊版 recipes 保留歷史 profiles。`pnpm docs:api` 在 `.vite/site/api/1.12.4/` 生成可搜尋的公開 root-export 文件；`pnpm build:site` 將相同 portal 納入部署網站，含 ownership／abort／cleanup 範例。

安裝後以 `pnpm exec xyz-assets preflight --manifest project.json` 經實際 loader 驗證 references；`build --manifest project.json --out NEW_DIRECTORY` 發佈 checksummed assets，不覆寫來源。[資產 recipe](ASSET-RECIPE.md) 說明 schema、固定版開發工具與 opt-in model conversion。Reviewed host／backend 效能 profile 及 physical qualification 的狀態／邊界見 CURRENT：校準不是認證，無法取得的實機證據仍 BLOCKED。

## 未發布 source 擴充（P104–P118）

這些新增內容不在既有 GitHub v1.14 archive；package metadata 仍為 1.14.0，
npm 未發佈。實作邊界見 [CURRENT](CURRENT.md)，實際證據見
[ACCEPTANCE](../ACCEPTANCE.md)；範例出現在 source 目錄不等於 runtime/browser
驗收通過。安裝後 `xyz-produce-assets PROFILE.json NEW_DIRECTORY` 與
`xyz-assets` project CLI 分開；需要 [ASSET-RECIPE](ASSET-RECIPE.md) 指定的
pinned 開發用 browser tooling。Repository 等效入口為
`node scripts/produce-assets.mjs PROFILE.json NEW_DIRECTORY`，同一實作產製有界
atlas、bitmap、SDF 或 MSDF。MSDF 必須提供 polygon contours，不解析任意字型輪廓；
WebCodecs 不做 container demux。

### CommonJS 與逐幀 3D 貼圖

`require('xyz.js')` 與 ESM import 使用不同 constructor graphs；應用中的引擎
物件統一使用一種格式，不混用兩側的 Texture／Scene／Mesh。Browser／CDN
使用完整 ESM `dist/`，包含官方 vendor 與 worker。

材質既有 `texture`、PBR maps 與 native `textures` 保留 immutable `Texture`
型別。提供實際、借用的 fallback，以 additive options 指定 canvas／video：

```ts
import { PBRMaterial, Texture, VideoTexture } from 'xyz.js';

async function videoMaterial(video: HTMLVideoElement, fallback: Texture) {
  const frames = await VideoTexture.fromVideo(video);
  const material = new PBRMaterial({
    texture: fallback,
    textureSource: frames,
    sources: { emissiveTexture: frames },
    emissive: [1, 1, 1],
  });
  return { material, frames };
}
```

先移除 material consumers，再 `frames.destroy()`；fallback 仍由呼叫者擁有。
`PBRMaterialOptions.sources` 使用公開 `PBRTextureKey`／`PBRTextureSources`；
NativeMaterial3D 的四個 indexed hook maps 用 `textureSources`，base map 用同一
`textureSource`。WebCodecs 接受已設定 codec 的 elementary chunks，不解析媒體容器；
Canvas2D 支援 video Sprite，不支援 3D material。

## Opt-in 材質 anti-aliasing（P121，未發佈 source）

已載入leaf／cutout texture的material設定
`alphaMode: 'MASK', alphaCutoff: 0.5, alphaToCoverage: true`；
Game維持 `antialias: true`。先看 `game.graphics.capabilities.alphaToCoverage`，
對應target的 `hdrSamples`／`rgba8Samples` 必須大於1，缺欄位不代表支援。
Canvas不能render這些3D material；停用AA／不支援MSAA會明確報錯。
Noisy base／clearcoat高光可設定 `specularAntiAliasing: 1`，或較低strength減少
normal／roughness過濾；預設關閉。仍需正確normal mips，不取代TAA／supersampling。

既有trusted profile工作流程可明示產生相同cutoff的coverage mips：

```json
{
  "version": 2,
  "formats": [],
  "textures": {
    "0": { "kind": "srgb", "alpha": "straight", "alphaCoverageCutoff": 0.5 }
  }
}
```

執行 `xyz-build-assets --input model.gltf --out new-bundle --profile profile.json`；
image index明示，MASK material用相同cutoff。RGB／base filtering不變；
tied alpha／小mip／lossy compression可能無法精確保留coverage，不可套用normal／opaque。
詳見 [有界品質契約](TECHNICAL-zh.md#p121-specular-filteringmask-coverage)。

## IBL材質品質（P122，未發佈 source）

既有 `scene.environment = EnvironmentMap.gradient(...)` 自動採GGX roughness mips與
數值BRDF integration，無新material flag／texture slot。反射色建議保持物理0–1範圍，
HDR發光使用 `emissive`；clearcoat保留独立roughness／normal，`sheenColor` 會啟用
有額外取樣成本的有界Charlie indirect kernel。既有intensity／exposure控制仍須明示。

執行 `pnpm smoke:ibl-quality`，或加 `--built` 驗證built root。
先看 [品質邊界](TECHNICAL-zh.md#p122-有界-ggxcharlie-ibl)，white-furnace守恆不是
reference renderer精度／實體driver資格。

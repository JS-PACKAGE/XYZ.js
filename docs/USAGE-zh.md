# XYZ.js 使用說明

[English](USAGE.md) · 繁體中文 · [技術參考](TECHNICAL-zh.md)

**目前規範入口：**[v1.22.1 契約、公開 API 與支援邊界](CURRENT.md)。`pnpm docs:api` 生成可搜尋的 root API；`pnpm build:site` 將它納入靜態產物 `api/1.22.1/`（入口 `docs/`）。本頁保留各版本 recipes 與歷史升級／驗收紀錄，這些紀錄不重定義目前支援。

XYZ.js 是瀏覽器遊戲引擎，包含 P42 可玩參考 Beacon Run。目前 metadata **1.22.1／Apache-2.0**（npm 未發佈），歷史證據保留。API 參考 three.js／PixiJS／Excalibur，非 drop-in parity，未新增 runtime dependency。Browser／emulation 觀察與 Windows CI 測試設定不是實機或 Windows 驅動認證；browser qualification 需要實際記錄的證據。見 [PLAN](../PLAN.md)、[技術參考](TECHNICAL-zh.md)、[驗收紀錄](../ACCEPTANCE.md)。

## 歷史階段 profile 導覽

| 需求             | 歷史階段 profile／邊界                                                                                                                                                                                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 跨 backend 2D    | 三 backend Sprite／HUD／atlas／raster／isolation／masks／basic blends。Native Material2D／Filter2D／Mesh2D 僅 GPU／GL，Canvas 明確拒絕。                                                                                                                                                                          |
| 3D               | 只有 WebGPU／WebGL2；PBR／instancing／shadows／post／weighted transparency 為明記的 bounded profiles。WebGL2 HDR／weighted 需 float color attachments。                                                                                                                                                           |
| Physics2D        | Kinematic／convex character sweep／slide／support、有界 relative dynamic／rotational CCD；sleep／五種 joints／static concave凸片與 dynamic convex-hull／compound collider。Sensor discrete，不支援 deforming sweeps。                                                                                             |
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
| [pbr3d](../examples/pbr3d/)                             | 程序式 PBR 預設（含鋪面／樹皮／苔蘚／泥土）、metallic／roughness 網格、陰影、環境光、霧、exposure／bloom                    |
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
| [world-nature](../examples/world-nature/)               | Terrain／splat、解析水面、moving-object trail 與 seeded wind grass；僅 native 3D                                            |
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

八聲部預算包含 release；溢位只搶最舊 SFX，不切斷 BGM。沒有可搶的 SFX 時略過新音符。八個 OPM slot 共用 manager 的單一 AudioContext；不要隨意繞過 `game.audio` 操作底層 OPM。

OPM 需要 AudioWorklet（HTTPS 或 localhost）。無法啟動時 `unlock()` 仍會 resolve，讓 sample 與 stream 可以播放；播放 OPM asset 前先確認 `game.audio.opmState === 'ready'`，原因見 `game.audio.opmError`。再次呼叫 `unlock()` 會重試 OPM。

若要改從 CDN 載入 OPM 而非 vendor 副本，傳入以 commit 釘住的模組 URL；vendor 檔案仍是預設：

```js
const game = await Game.create({
  canvas: '#game',
  opmModuleUrl:
    'https://cdn.jsdelivr.net/gh/JS-PACKAGE/OPM.js@4fdbff0f2d6a509763e3bef0066c059ba88ad154/dist/api/index.js',
});
```

CDN 必須以 CORS 提供 OPM.js 1.13.1，CSP 也必須允許它。其內容無法做完整性驗證；使用前請先看技術參考。

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

目前目錄共1194種，完整union見[CURRENT.md](CURRENT.md)。下段459種列舉保留歷史基底清單，後續種類另行逐項增補，不代表目前完整union。

`ProceduralMaterial.create(kind, options?)` 在 CPU 一次產生可無縫重複、具確定性的貼圖，不用外部素材或新增依賴。`ProceduralMaterialKind` 共四百五十九種：`'wood' | 'brick' | 'stone' | 'metal' | 'fabric' | 'marble' | 'concrete' | 'tiles' | 'leather' | 'sand' | 'rust' | 'snow' | 'asphalt' | 'gravel' | 'cobblestone' | 'bark' | 'moss' | 'mud' | 'granite' | 'slate' | 'terrazzo' | 'denim' | 'burlap' | 'carpet' | 'plaster' | 'terracotta' | 'cork' | 'rubber' | 'carbonfiber' | 'diamondplate' | 'paper' | 'wicker' | 'bamboo' | 'hammeredmetal' | 'galvanized' | 'corrugatedmetal' | 'perforatedmetal' | 'expandedmetal' | 'wiremesh' | 'velvet' | 'terrycloth' | 'boucle' | 'geode' | 'quartz' | 'pyrite' | 'shiplap' | 'glassblock' | 'thatch' | 'charredwood' | 'driftwood' | 'peelingpaint' | 'tiretread' | 'honeycomb' | 'frost' | 'stainedglass' | 'soapstone' | 'butcherblock' | 'wallpaper' | 'embroidery' | 'macrame' | 'brickpaving' | 'steppingstone' | 'woodendeck' | 'cheese' | 'sugarfrosting' | 'candleswax' | 'vinylrecord' | 'graphpaper' | 'notebookpaper' | 'lace' | 'crochet' | 'basketweave' | 'zipper' | 'velcro' | 'button' | 'traintracks' | 'manholecover' | 'speedbump' | 'circuitboard' | 'solarpanel' | 'heattile' | 'pianokeys' | 'drumskin' | 'gongsurface' | 'lensarray' | 'prismtape' | 'fresnel' | 'bandage' | 'pillblister' | 'sutures' | 'trellis' | 'terracottapot' | 'hedgerow' | 'collar' | 'petbed' | 'scratchpost' | 'runningtrack' | 'bouldermat' | 'pooltile' | 'envelope' | 'chalkboard' | 'corkboard' | 'snowdrift' | 'icicle' | 'dewdrops' | 'mooncrater' | 'starfield' | 'nebula' | 'pleats' | 'shoelace' | 'tassel' | 'woksurface' | 'cutlery' | 'choppingboard' | 'faucet' | 'showerhead' | 'bathmat' | 'blinds' | 'curtain' | 'shadecloth' | 'sandstone' | 'travertine' | 'pumice' | 'parquet' | 'mosaic' | 'hexagontiles' | 'knit' | 'corduroy' | 'felt' | 'roofshingles' | 'rooftiles' | 'stucco' | 'lichen' | 'leaflitter' | 'endgrain' | 'acousticfoam' | 'closedcellfoam' | 'linoleum' | 'suede' | 'snakeskin' | 'crocodile' | 'herringbone' | 'tweed' | 'seersucker' | 'knurledmetal' | 'engineturned' | 'goldleaf' | 'orangepeel' | 'coconut' | 'watermelon' | 'limestone' | 'breccia' | 'gneiss' | 'plywood' | 'osb' | 'chipboard' | 'wafflecloth' | 'cableknit' | 'quilting' | 'crackleglaze' | 'flutedceramic' | 'encaustictiles' | 'fishscales' | 'tortoiseshell' | 'feathers' | 'reedmat' | 'rope' | 'straw' | 'studdedrubber' | 'groovedrubber' | 'recycledrubber' | 'breadcrust' | 'wafer' | 'chocolate' | 'pretzel' | 'bagel' | 'croissant' | 'butterflywing' | 'beetlewing' | 'spiderweb' | 'cirrus' | 'cumulus' | 'lightning' | 'kelp' | 'seaweed' | 'anemone' | 'candy' | 'marshmallow' | 'nougat' | 'frostedglass' | 'rippledglass' | 'bubbleglass' | 'saddlestitch' | 'tooledleather' | 'patentleather' | 'appleskin' | 'peachskin' | 'grapeskin' | 'broccoli' | 'cabbage' | 'onion' | 'bedsheet' | 'pillow' | 'mattress' | 'tealeaf' | 'matcha' | 'teabag' | 'sanddune' | 'pebblebeach' | 'foamedge' | 'lavaflow' | 'cooledlava' | 'ashfield' | 'stalactite' | 'flowstone' | 'cavefloor' | 'jam' | 'peanutbutter' | 'sprinkles' | 'icecream' | 'popsicle' | 'sorbet' | 'spaghetti' | 'macaroni' | 'lasagna' | 'origami' | 'paperlace' | 'papercut' | 'sunflower' | 'daisy' | 'clover' | 'puzzletile' | 'legobrick' | 'rubberband' | 'haybale' | 'corncrib' | 'fencepost' | 'poolfelt' | 'icesurface' | 'climbingwall' | 'oledpanel' | 'crtscanline' | 'keyboardkey' | 'filmstrip' | 'postagestamp' | 'halftoneprint' | 'radiator' | 'screwhead' | 'chainlink' | 'friedegg' | 'sushirice' | 'chocolatechip' | 'cargomat' | 'dashboardgrain' | 'licenseplate' | 'flowerbed' | 'grassstripe' | 'topiary' | 'confetti' | 'ribbonstreamer' | 'pinatafringe' | 'xylophone' | 'tambourine' | 'castanet' | 'pillcapsule' | 'pilltablet' | 'bathbomb' | 'basketball' | 'tennisball' | 'golfball' | 'boardformedconcrete' | 'ribbedconcrete' | 'splitfaceblock' | 'chainmail' | 'rivetedmetal' | 'weldedmetal' | 'cactus' | 'pinecone' | 'corncob' | 'corrugatedcardboard' | 'creasedpaper' | 'layeredpaper' | 'basalt' | 'scoria' | 'obsidian' | 'malachite' | 'agate' | 'lapislazuli' | 'rice' | 'sesame' | 'coffeebeans' | 'lotusleaf' | 'bananaleaf' | 'fernleaf' | 'braincoral' | 'starcoral' | 'seasponge' | 'houndstooth' | 'tartan' | 'damask' | 'zebrafur' | 'leopardfur' | 'giraffefur' | 'scallopshell' | 'oystershell' | 'nautilusshell' | 'cantaloupe' | 'dragonfruit' | 'kiwiskin' | 'rosepetal' | 'lilypetal' | 'fritillarypetal' | 'birchbark' | 'palmtrunk' | 'sycamorebark' | 'elephanthide' | 'ostrichleather' | 'sharkskin' | 'tactilepaving' | 'roadmarking' | 'draincover' | 'mushroomgills' | 'morel' | 'bracketfungus' | 'pineapple' | 'strawberry' | 'lychee' | 'walnutshell' | 'peanutshell' | 'almondshell' | 'sandpaper' | 'steelwool' | 'wirebrush' | 'cheesegrater' | 'ovenrack' | 'muffintin' | 'gauze' | 'elasticbandage' | 'icepack' | 'bubblewrap' | 'sequin' | 'pennyround' | 'volleyball' | 'bowlingball' | 'rugbyball' | 'wafflecone' | 'donutglaze' | 'brownie' | 'soapbar' | 'loofah' | 'scrubbypad' | 'orangeflesh' | 'kiwiflesh' | 'avocadoflesh' | 'turquoise' | 'rhodonite' | 'tigereye' | 'tatami' | 'flutedwood' | 'subwaytiles' | 'canewebbing' | 'rammedearth' | 'copperpatina' | 'birdseyemaple' | 'breezeblock' | 'basketweavepavers' | 'ripstop' | 'octagondot' | 'truchettiles' | 'standingseam' | 'damascus' | 'windmillpavers' | 'castiron' | 'porphyry' | 'linen' | 'chippedenamel' | 'perforatedleather' | 'argyle' | 'chevronparquet' | 'ginkgoleaf' | 'pressedtin' | 'sashiko' | 'ashlar' | 'gabion' | 'gingham' | 'mossypavers' | 'bamboocrosscut' | 'moire' | 'oakleaf' | 'rhombille' | 'fossillimestone' | 'seigaihatiles' | 'tuftedleather' | 'louveredmetal' | 'herringbonebrick' | 'shibori' | 'scallopedslate' | 'saltpan' | 'dogbonepavers' | 'palmendgrain' | 'asanoha' | 'lotusseedpod' | 'crowncaps' | 'cofferedconcrete' | 'woodworm' | 'calcadawaves' | 'ikat' | 'slottedwood' | 'hollyleaf' | 'englishbond' | 'rebar' | 'starfruit' | 'diamondrustication' | 'bargello' | 'saffiano' | 'cocoamat' | 'suminagashi' | 'vermiculite' | 'cairotiles' | 'guilloche' | 'seaurchintest' | 'crystallineglaze' | 'shirring' | 'sunburstveneer' | 'rakedgravel' | 'flintwall' | 'frenchknots' | 'artichoke' | 'splitlockwashers' | 'flemishbond' | 'satinweave' | 'lotusroot' | 'cardboardedge' | 'hexnuts' | 'orbicularjasper' | 'acornbarnacles' | 'circularpavers' | 'snowflaketiles' | 'sawblades' | 'pistachios' | 'polkadotfabric' | 'cucumberslices' | 'monsteraleaf' | 'crossstitch' | 'staranise' | 'logcabinparquet' | 'countersunkmetal' | 'trilobitefossil' | 'eyeletcotton' | 'dendriticagate' | 'ravioli' | 'rollerchain' | 'mapleleaf' | 'smocking' | 'quatrefoiltile' | 'okraslice' | 'eggcarton' | 'greekkey' | 'seedbeads'`（木材／磚牆／石材／金屬／布料／大理石／混凝土／磁磚／皮革／沙／鏽蝕／雪／瀝青／礫石／鵝卵石鋪面／樹皮／苔蘚／泥土／花崗岩／板岩／磨石子／丹寧布／粗麻布／地毯／石膏／陶土／軟木／橡膠／碳纖維／止滑花紋鋼板／紙張／藤編／竹材／錘紋金屬／鍍鋅板／波紋金屬板／沖孔金屬板／擴張金屬網／金屬絲網／天鵝絨／毛巾布／圈圈紗布／砂岩／洞石／浮石／拼花木地板／馬賽克／六角磚／針織／燈芯絨／毛氈／瀝青屋瓦／陶製屋瓦／粗灰泥／地衣／落葉層／木頭端面／吸音泡棉／閉孔泡棉／油氈地材／麂皮／蛇鱗紋皮革／鱷魚壓紋皮革／人字紋織物／粗花呢／泡泡紗／滾花金屬／魚鱗旋紋金屬／金箔／橘皮／椰殼／西瓜皮／石灰岩／角礫岩／片麻岩／膠合板／定向粒片板／粒片板／華夫格布／麻花針織／菱格絎縫／冰裂釉／直槽陶瓷／嵌彩水泥花磚／魚鱗／龜甲／羽毛／蘆葦蓆／繩索／稻草／圓釘橡膠／溝槽橡膠／再生橡膠／麵包脆皮／威化餅／巧克力／籃球／網球／高爾夫球／木模板清水混凝土／肋紋混凝土／劈面砌塊／鎖子甲／鉚接金屬板／焊接金屬板／仙人掌／松果／玉米穗／瓦楞紙板／摺痕紙／層疊紙／玄武岩／火山渣／黑曜石／孔雀石／瑪瑙／青金石／米粒／芝麻／咖啡豆／荷葉／香蕉葉／蕨葉／腦珊瑚／星珊瑚／海綿／千鳥格／蘇格蘭格紋／花卉提花／斑馬短毛皮紋／豹短毛皮紋／長頸鹿短毛皮紋／扇貝殼／牡蠣殼／鸚鵡螺殼）；`ProceduralMaterialOptions` 接受整數 `size` 32–1024（預設 256）及無號 32-bit 整數 `seed` 0–4294967295（預設 1），並可用 `tint`（三個 0–4 的逐通道倍率）調整顏料色而不影響灰縫與其他 maps，並可傳入 `workerPool`（`createProceduralWorkerPool()`）在 Worker 上生成、輸出逐位元組相同；傳入 `cache`（`ProceduralMapCache`）可重用相同參數的生成結果，每個 preset 仍擁有自己的貼圖；設定 `heightMap: true` 會額外生成線性 height map（R，0 最低、1 最高）；`createMaterial()` 將其綁為 `opticalMaps.heightTexture`，PBR parallax（`finish.heightScale`）改讀它而非 normal Z。本身不啟用 parallax，納入快取 key 與 worker 傳輸，隨 preset destroy。無效值會拒絕建立。metal／rust／copperpatina／chippedenamel／gabion／diamondplate／hammeredmetal／galvanized／corrugatedmetal／standingseam／damascus／castiron／pressedtin／louveredmetal／crowncaps／rebar／guilloche／splitlockwashers／hexnuts／sawblades／countersunkmetal／rollerchain／perforatedmetal／expandedmetal／wiremesh／knurledmetal／engineturned／goldleaf／chainmail／rivetedmetal／weldedmetal／draincover／pyrite 的 metallic factor 為 1，其餘種類為 0、維持 dielectric。

另支援 `flutedwood`（直槽木飾板），呈現圓潤木條、深色凹槽與縱向木紋。使用 `await ProceduralMaterial.create('flutedwood', { seed: 7 })`；`proceduralRepeats('flutedwood', 1)` 為每米 3.125 repeats。四份貼圖維持 opaque dielectric（metallic 0）、不位移 geometry；銷毀 preset 前先移除所有借用者。

`subwaytiles`（倒角長方磚）提供青綠釉面、錯縫排列、平整磚面與圓滑倒角及粗糙填縫。每張 0.6 m tile 排列兩欄四列，四份 seeded periodic maps 維持 opaque dielectric、metallic 0；僅為 normal map，不新增 geometry、位移或新的 ownership 規則。

`canewebbing`（八角孔藤編）呈現縱橫藤條、雙向斜藤與八角暗凹槽；0.24 m tile 含八乘八單元。使用 `await ProceduralMaterial.create('canewebbing', { seed: 7 })`；四圖為 seeded periodic、opaque dielectric、metallic 0。孔隙只是深色底板與 normal／AO 效果，沒有透明孔洞或 geometry 位移；沿用既有 options、repeats 與資源生命週期。

`rammedearth`（夯土牆）提供八層土色壓實帶、微彎接縫、細砂與凹孔；每張 UV tile 對應 2 m。使用 `await ProceduralMaterial.create('rammedearth', { seed: 7 })`；色層不直接轉成高度階梯，四圖為 seeded periodic、opaque dielectric、metallic 0，僅表面 normal／roughness／AO，不新增 geometry。既有 options、repeats 與 texture ownership 不變。

`copperpatina`（銅綠氧化銅）在 0.5 m tile 內呈現裸銅與青綠氧化斑塊；使用 `await ProceduralMaterial.create('copperpatina', { seed: 7 })`。同一覆蓋場同步控制顏色、metallic、roughness 與淺 relief：裸銅 metallic 1，粗糙氧化層為 0。預設 `material` 與 `createMaterial()` metallic factor 為 1，保留 map 混合金屬度；四張 seeded periodic maps 為 OPAQUE，不新增 geometry 或 shader，既有 options 與 caller ownership 不變。

`birdseyemaple`（鳥眼楓木）提供分散深色眼狀紋、橢圓細環與繞行縱紋；每張 0.24 m tile 含六乘六個 seeded 單元。使用 `await ProceduralMaterial.create('birdseyemaple', { seed: 7 })`。眼狀色彩不形成凸起木節，僅有淺 normal 起伏；四份 periodic maps 為 opaque dielectric、metallic 0，不新增 geometry／shader，options、repeats 與 texture ownership 不變。

`breezeblock`（四葉花孔水泥花磚）提供四葉圓孔輪廓、粗糙水泥框與細填縫；0.8 m tile 含四乘四單元。使用 `await ProceduralMaterial.create('breezeblock', { seed: 7 })`。孔內只是暗色凹槽與 normal／AO 效果，沒有透明孔洞、穿透或 geometry。四份 seeded periodic maps 維持 opaque dielectric、metallic 0；options、repeats 與 texture ownership 不變。

`basketweavepavers`（籃編排列鋪路磚）以兩塊長方黏土磚組成方形單元，相鄰單元交替轉向，含倒角、凹填縫與逐磚色差；0.8 m tile 含四乘四單元、32 塊磚。使用 `await ProceduralMaterial.create('basketweavepavers', { seed: 7 })`。四份 seeded periodic maps 維持 opaque dielectric、metallic 0；僅為 shading／normal map，options、repeats 與 texture ownership 不變。

`ripstop`（防撕裂尼龍布）將細經緯織紋與成對補強線分開建模，0.04 m tile 含四乘四補強格。使用 `await ProceduralMaterial.create('ripstop', { seed: 7 })`。四份 seeded periodic maps 維持 opaque dielectric、metallic 0；僅為外觀與 normal map，不新增織物 geometry 或抗撕裂物理，options、repeats 與 texture ownership 不變。

`octagondot`（八角菱形拼磚）以白色八角主磚搭配等高的深色菱形嵌磚，包含平滑倒角與粗糙凹填縫；0.8 m tile 含四乘四主磚。使用 `await ProceduralMaterial.create('octagondot', { seed: 7 })`。四份 seeded periodic maps 維持 opaque dielectric、metallic 0；僅為 shading／normal map，options、repeats 與 texture ownership 不變。

`truchettiles`（Truchet 雙弧線花磚）以 seeded 旋轉的相對角雙弧組成曲線拼圖，弧線在各邊中點對接；0.8 m tile 含四乘四釉面方磚，色釉不隆起。使用 `await ProceduralMaterial.create('truchettiles', { seed: 7 })`。四份 seeded periodic maps 維持 opaque dielectric、metallic 0；僅為 shading／normal map，options、repeats 與 texture ownership 不變。

`standingseam`（立縫金屬屋面）提供寬平板、窄立縫平頂與兩側凹腳，區別於連續波浪形浪板；2 m tile 含四片板。使用 `await ProceduralMaterial.create('standingseam', { seed: 7 })`。四份 seeded periodic maps 維持 opaque，metallic B 通道與預設 factor 均為 1，代表無塗漆金屬。僅為 shading／normal map，不新增 geometry；options、repeats 與 texture ownership 不變。

`damascus`（大馬士革鋼）以細密層疊紋與 seeded 局部眼狀折紋呈現蝕刻鋼面，暗層較粗糙、略低；0.12 m tile，起伏很淺而非厚浮雕。使用 `await ProceduralMaterial.create('damascus', { seed: 7 })`。四份 seeded periodic maps 維持 opaque，metallic B 通道與預設 factor 均為 1；不新增 geometry 或 BRDF，options、repeats 與 texture ownership 不變。

`windmillpavers`（風車拼鋪路磚）由四片二比一長磚圍繞等高深色方磚，具有平滑倒角、凹填縫與 seeded 細粒色差；0.9 m tile 包含四組風車、20 塊磚。使用 `await ProceduralMaterial.create('windmillpavers', { seed: 7 })`。四圖 opaque dielectric、metallic 0，不新增 geometry 或 shader；options、repeats 與 texture ownership 不變。

`castiron`（粗鑄鐵）以細顆粒鑄造肌理與少量 seeded 凹孔呈現粗鑄表面，孔洞較暗、粗糙且低於基面，而非大片重疊槌印。0.1 m tile，使用 `await ProceduralMaterial.create('castiron', { seed: 7 })`。四圖 opaque、metallic B 通道與預設 factor 均為 1，代表未上漆未氧化的金屬；未新增 geometry、shader 或氧化膜模擬，options、repeats 與 texture ownership 不變。

`porphyry`（拋光斑岩）在紫紅細粒基質中嵌入 seeded 淺色長石斑晶；長矩形晶粒具不同朝向，較平滑且與基面齊平，不是凸起碎石。0.3 m tile，使用 `await ProceduralMaterial.create('porphyry', { seed: 7 })`。四圖 opaque dielectric、metallic 0，不新增 geometry 或 shader；options、repeats 與 texture ownership 不變。

`linen`（竹節亞麻布）以沿長度自然變粗變細的 seeded 經緯紗線、平滑交替纖維覆蓋與隆起交點形成平織結構。0.04 m tile 含 16×16 交點，使用 `await ProceduralMaterial.create('linen', { seed: 7 })`。紗隙是粗糙不透明凹隙，不是 alpha 孔洞；四圖 opaque dielectric、metallic 0，不新增 geometry、shader 或透光模型，options、repeats 與 texture ownership 不變。

`chippedenamel`（缺角琺瑯）以光滑象牙白非金屬釉層覆蓋較粗糙金屬基材，seeded 不規則缺角露出較暗、較低的金屬，沒有油漆捲邊。0.25 m tile，使用 `await ProceduralMaterial.create('chippedenamel', { seed: 7 })`。完整釉層 metallic B=0、裸露金屬 B=255，預設 factor 1 保留混合 map；四圖 opaque，不新增 geometry 或 shader，options、repeats 與 texture ownership 不變。

`perforatedleather`（透氣孔座椅皮革）結合 seeded 棕褐細粒皮面與 8×8 錯列圓孔，每張 tile 為 0.04 m。圓潤孔壁下降至深色粗糙不透明內襯，不帶羽管毛囊隆環。使用 `await ProceduralMaterial.create('perforatedleather', { seed: 7 })`；四圖 periodic opaque dielectric、metallic 0，僅 normal／AO shading，並非透明孔洞或 geometry。options、repeats 與 texture ownership 不變。

`argyle`（Argyle 菱格布）在交替酒紅／玫瑰菱形上疊加穿越中心的細斜線，seeded 細粒與平織經緯紗線獨立提供起伏，印花邊界不隆起也不是填縫。使用 `await ProceduralMaterial.create('argyle', { seed: 7 })`，每張 tile 為 0.16 m。四圖 periodic opaque dielectric、metallic 0；不新增 geometry 或 shader，options、repeats 與 texture ownership 不變。

`chevronparquet`（Chevron 斜接木地板）以相反 45° 木板斜接形成 V 字，包含 seeded 逐板色差、沿板長木紋、平滑倒角與凹接縫，區別於籃編拼花。使用 `await ProceduralMaterial.create('chevronparquet', { seed: 7 })`，每張 tile 為 0.6 m。四圖 periodic opaque dielectric、metallic 0；起伏僅 normal mapping，geometry、options、repeats 與 texture ownership 不變。

`ginkgoleaf`（金黃銀杏葉）呈現 seeded 朝向與色差的金黃扇形葉片、中央缺口、細葉柄與放射葉脈，葉間為深色不透明底層。使用 `await ProceduralMaterial.create('ginkgoleaf', { seed: 7 })`，每張 tile 為 0.24 m。四圖 periodic opaque dielectric、metallic 0；不新增葉片 geometry、alpha cutout 或透光模型，options、repeats 與 texture ownership 不變。

`pressedtin` 是 0.6 m tile 的壓花錫板：四個方框包住四瓣花飾與中央凸鈕，平滑凸紋接回 seeded 細粒金屬板面。它不是隨機錘痕；四圖皆 opaque，metallic map 與預設 factor 為 1，不增加 geometry 或 renderer 能力。

`sashiko` 是 0.064 m tile 的靛藍刺子繡布：米白凸起針腳沿兩個軸交替出現，每行／列由 seed 決定相位，格線交點與針腳之間露出深靛藍平織底布。不是印花或連續補強線；四圖 opaque dielectric、metallic 0，不增加 geometry 或 renderer 能力。

`ashlar` 是 1.2 m tile 的模組拼砌石材：十一塊不同長寬的矩形石塊具有逐塊 seeded 色差、礦物顆粒、平滑倒角及 T 字凹縫。石塊內部模組格線不會變成接縫，區別於等尺寸錯縫磚。四圖 opaque dielectric、metallic 0，不增加 geometry 或 renderer 能力。

`gabion` 是 0.4 m tile 的鋼網石籠表面：方格鋼線位於 seeded 大小、朝向及色差的圓石前方，線網較平滑，石間是深色不透明底層。四圖 opaque，metallic B 在線網為 1、石材為 0，預設 metallic factor 為 1；不是可穿透的石籠 geometry，不增加 renderer 能力。

`gingham` 是 0.08 m tile 的藍白平織格布：等寬經緯色帶形成亮格、深格與混色格，混色格內逐紗交替露出藍紗與白紗，不是平塗中間色。凹凸僅來自織紋與 seeded 纖維細粒，色塊不抬升。四圖 opaque dielectric、metallic 0，不增加 geometry 或 renderer 能力。

`mossypavers` 是倒角灰色鋪路石與接縫內局部生長的綠色苔蘚；苔蘚比裸縫高、比石冠低且更粗糙，石面保留中性色差，不將整面染綠。0.8 m tile、四圖 opaque dielectric，沿用既有 options 與生命週期。

`bamboocrosscut` 呈現竹筒橫切的淡色環狀竹壁、深色中空底層與較平滑的外皮；每筒直徑與壁厚有 seeded 差異，切面有細孔而沒有木材年輪。0.24 m tile、四圖 opaque dielectric；中空只是深色不透明底層，不是可穿透 geometry，沿用既有 options 與生命週期。

`moire` 是紫色水波紋絲緞，平滑低頻水波改變色澤及 roughness，只有細紗改變 height／AO，不把大波紋做成浮雕。0.08 m tile、四圖 opaque dielectric；這是烘入貼圖的外觀近似，不新增繞射、視角相關變色或 anisotropic BRDF，沿用既有 options 與生命週期。

`oakleaf` 呈現 seeded 旋轉及色差的綠色橡樹葉，長葉片有成對圓裂與深缺刻、中肋、分枝葉脈及短葉柄，區別於扇形銀杏葉。0.3 m tile、四圖 opaque dielectric；葉間是深色不透明底層，不新增 cutout geometry，沿用既有 options 與生命週期。

`rhombille` 以三種明暗的四邊菱形磚組成方塊錯視，每組三片共享接點，倒角與中性灰縫將磚片分開。磚面維持同高，不將錯視方塊做成立體高低面。0.9 m tile、四圖 opaque dielectric，沿用既有 options 與生命週期。

`fossillimestone` 是拋光螺旋化石石灰岩：米褐色基質內嵌 seeded 尺寸、壓扁方向及旋轉相位的螺旋化石切面，淺色螺旋壁與細隔板分開暗色礦物填充腔室。化石與基質共面，只有細石粒微起伏，不沿螺旋或外緣隆起，也不使用完整鸚鵡螺殼的立體表面；0.6 m tile、四圖 opaque、metallic 0，沿用既有借用及銷毀契約。

`seigaihatiles` 是藍白青海波花磚：交錯排列的多重象牙白波弧印在藍色釉面，波組帶 seeded 色差，前列遮住後列下方弧線，獨立方磚倒角及中性灰縫分隔表面。波弧是共面色料，不是隆起的管線；0.6 m tile、四圖 opaque、metallic 0，沿用既有借用及銷毀契約。

`tuftedleather` 是深棕色菱形拉扣皮革：鼓起的菱形墊面、交叉壓褶、凹下的拉扣口袋與包皮圓扣。圓扣高於周圍口袋、低於墊面最高點；seeded 細皮紋及磨耗色差覆蓋表面，不套用 quilting 的織線，也不將皮扣設為金屬。0.8 m tile、四圖 opaque、metallic 0，沿用既有借用及銷毀契約。

`louveredmetal` 是沖壓百葉金屬板：每個葉片兩端接回板面，上端平滑抬升至較高的下緣，下緣之後是暗色凹槽及不透明背板；不是無限延伸的波紋或對稱圓管。seeded 細金屬粒紋、0.6 m tile、四圖 opaque，metallic B 通道與預設 factor 都為 1；沒有真實穿孔、透明或新增 geometry，沿用既有借用及銷毀契約。

`herringbonebrick` 是人字拼紅磚鋪面：2:1 長磚沿對角帶交替橫放與直放，彼此咬合成 T 形接點；每塊磚有 seeded 燒製色差與細粒表面、倒角及中性灰縫。長磚跨越內部格線而不產生假磚縫，不是 running-bond 或織物 herringbone；1.2 m tile、四圖 opaque、metallic 0，沿用既有借用及銷毀契約。

`shibori` 是靛藍絞染棉布：深藍底上的雙層淡色防染環帶具有 seeded 不規則暈邊與放射狀綁染痕跡，中心及環帶間保留靛藍。染色只改 pigment，不把環帶做成浮雕；下方為獨立平織 relief 與細粒。0.24 m tile、四圖 opaque、metallic 0，沿用既有借用及銷毀契約。

`scallopedslate` 是錯列搭接的圓尾板岩屋瓦：上列圓尾覆蓋下列，弧形下緣抬高並在下方形成凹入陰影；seeded 板岩色差、細粒與層理延續至瓦面。三列由下而上合成保留 row wrap 的相同搭接關係，不是圓弧色塊或普通直尾屋瓦。1.2 m tile、四圖 opaque、metallic 0，只以貼圖表現搭接、不增加 geometry，沿用既有借用及銷毀契約。

`saltpan` 是蒸發鹽灘結晶殼：seeded 不規則多邊形內部較低，連通的淡白鹽脊高於內部並較粗糙；細粒及細小結晶覆蓋表面。共用半平面分界與平滑肩部保留角落及 wrap 連續性，與向下凹陷的乾泥裂縫／釉面開片不同。3 m tile、四圖 opaque、metallic 0，不增加 geometry，沿用既有借用及銷毀契約。

`dogbonepavers` 是狗骨形互鎖混凝土鋪路磚：寬端透過窄腰連成完整磚體，相鄰欄錯半塊磚後，寬端填入對方腰部凹口；平滑肩部、倒角、中性灰縫與 seeded 色差／骨材／細粒。這是真正互補拼合的輪廓，不是矩形磚上的圖案或孤立狗骨色塊。0.8 m tile、四圖 opaque、metallic 0，沿用既有借用及銷毀契約。

`palmendgrain` 是棕櫚木橫切面：淡金棕色基質中分布 seeded 位移／旋轉／長短軸的深色維管束，纖維束與基質切面平齊，成對導管孔才局部下凹。沒有年輪、凸起木節或竹筒空心；細粒與基質色差為獨立週期場。0.024 m tile、四圖 opaque、metallic 0，沿用既有借用及銷毀契約。

`asanoha` 是酒紅底象牙色麻葉紋布料：三向三角格線與每個三角形內的三支線連成幾何葉紋，格線的平滑實色區覆蓋三角形 ownership 邊界。印花只改顏色，不增加浮雕；獨立平織紋與 seeded 細粒控制高度、粗糙度與 AO。0.12 m tile、四圖 opaque、metallic 0，沿用既有借用及銷毀契約。

`lotusseedpod` 是乾燥蓮蓬表面：棕色蓬面內分布中央與環列的七個 seeded 凹室，帶隆起孔緣，較光滑的蓮子從室底凸出但仍低於蓬面。各蓬大小、凹室位置／孔徑及細粒有可重現變化；蓬間暗部與凹室皆有不透明底，不是實際切孔。0.3 m tile、四圖 opaque、metallic 0，沿用既有借用及銷毀契約。

`crowncaps` 是金屬皇冠瓶蓋：平頂外側有隆起捲邊與下降裙邊，每蓋二十一道 seeded 旋轉壓褶同時改變外輪廓及裙邊高度，細粒不破壞平頂。角向起伏限制在裙邊，中心沒有角度奇點；蓋間暗部仍為 opaque 金屬底。0.112 m tile、四圖 opaque、metallic B 255 且材質 factor 1，沿用既有借用及銷毀契約。

`cofferedconcrete` 是井字混凝土樓板：連續平頂交叉肋梁包圍九個平底方形凹室，斜壁平滑接回肋梁，牆角使用平滑乘積而非有尖脊的 max。seeded 骨材、細粒與淺氣孔不改變主要層次；凹室底有較低 AO。2.4 m tile、四圖 opaque dielectric、metallic 0，僅 normal mapping、不新增 geometry，沿用既有借用及銷毀契約。

`woodworm` 是蟲蝕木材：縱向木紋上有 seeded 旋轉與彎曲幅度的有限長蟲道，兩端圓形出孔比蟲道更深；暗部有底，不使用 alpha 切孔。平滑聯集處理蟲道與出孔交會，compact support 限制在各 cell 內，細粒與木纖維用 cached noise。0.16 m tile、四圖 opaque dielectric、metallic 0，僅 normal mapping、不新增 geometry，沿用既有借用及銷毀契約。

`calcadawaves` 是葡式黑白波浪石鋪面：二百五十六顆倒角小石塊各自保持黑色或白色，由整顆石材排列形成起伏波帶，而不是在石面上跨縫印花。色帶不影響高度、粗糙度或 AO；seeded 細粒與骨材保留微表面差異，灰色低接縫隔開石塊。1.28 m tile、四圖 opaque dielectric、metallic 0，僅 normal mapping、不新增 geometry，沿用既有借用及銷毀契約。

`ikat` 是經紗絣織布：深靛藍底的淺色菱形染紋，沿經紗方向的 seeded 對位偏移形成毛邊，且同一束經紗的偏移在各列重複。染紋只有色彩變化，獨立六十四線平織紋決定高度／粗糙度／AO，不把染色菱形凸起成浮雕；柔化尖角避免染紋導數尖點。0.16 m tile、四圖 opaque dielectric、metallic 0，沿用既有借用及銷毀契約。

`slottedwood` 是圓端開槽木飾板：三十二條有限長膠囊形槽逐列錯開半格，槽側及圓端平滑接回完整木面，槽間保留木橋。距離先校正長方形格距比例，使方形 UV tile 上的槽端保持圓形；縱向 seeded 木紋只在木面，槽底是較粗糙的暗色 opaque backing。0.8 m tile、四圖 opaque dielectric、metallic 0；僅表面 normal mapping，不新增切孔 geometry 或聲學模擬，沿用既有借用及銷毀契約。

`hollyleaf` 是 seeded 旋轉的深綠亮面冬青葉：橢圓葉身接三對尖刺與尖葉端，凹缺口保留暗底，較低葉柄和凸起主／側脈構成高度差。平滑 compact 支撐保持葉緣與尖端導數連續，與圓裂橡葉區分。0.24 m tile、四圖 opaque dielectric、metallic 0；不是植物 geometry 或透明裁切，借用／銷毀契約不變。

`englishbond` 是短端磚列與兩倍寬長面磚列交替的英式砌磚。長面磚接縫對齊相鄰短端磚中央；四十八塊 seeded 紅棕磚的灰縫與倒角以同一實際尺度計算，平滑角落與較低灰縫分離各磚，細粒僅在磚面。0.8 m tile、四圖 opaque dielectric、metallic 0；不是砌體 geometry 或結構模擬，借用／銷毀契約不變。

`rebar` 是四支圓弧鋼筋，每支十二道隆起斜向軋肋，相鄰肋紋方向相反。圓截面在側邊平滑接回較低暗色金屬底，seeded 細粒不掩蓋肋頂／肋間高度差。0.12 m tile、四圖 opaque、metallic B 255／材質 factor 1；不是鋼筋 geometry 或結構模擬，借用／銷毀契約不變。

`starfruit` 是九片 seeded 旋轉的五角楊桃切片：金黃外緣、平整淺黃果肉、五個放射狀橢圓籽腔，籽腔較暗／低／粗糙。五角外緣與籽腔平滑接合，中央區域不受 polar 角度影響。0.18 m tile、四圖 opaque dielectric、metallic 0；不是果肉 geometry、透明度或次表面散射，借用／銷毀契約不變。

`diamondrustication` 是十六塊鑽尖式石砌凸飾：四面近似平面斜坡匯向中央尖頂與對角稜線，凸飾底部平滑接到獨立平整石框，再經外倒角下降至灰縫。seeded 石色／細粒保留尖頂、平框與灰縫三層。1.6 m tile、四圖 opaque dielectric、metallic 0；不是石砌 geometry，借用／銷毀契約不變。

`bargello` 是紫色深淺火焰針繡：三十二欄長直針腳逐欄錯開四分之一針長，階梯上升／下降形成四階色帶。每針有圓冠、縱向細纖維與平滑降至暗底的側邊／端部；色階不另外改變針腳高度。0.064 m tile、四圖 opaque dielectric、metallic 0；不是線材 geometry，借用／銷毀契約不變。

`saffiano` 是棕色十字壓紋皮革：兩組細斜槽低於、暗於且粗糙於紋間皮面。平滑聯集讓交點與單槽共用同一壓紋深度，不產生雙倍深坑；seeded 微粒保留細緻皮面。0.032 m tile、四圖 opaque dielectric、metallic 0；不新增皮革 geometry 或 BRDF，借用／銷毀契約不變。

`cocoamat` 是椰纖門墊：八乘八區域各四根 seeded 旋轉短彎纖維，在 wrapped 鄰域交疊並以平滑聯集合成圓冠；側邊與端部平滑降至暗底，纖維間保留粗糙陰影。0.08 m tile、四圖 opaque dielectric、metallic 0；不是直稻草或規則地毯絨簇，不新增纖維 geometry，借用／銷毀契約不變。

`suminagashi` 是墨流し紋紙：seeded 雙軸 domain warp 與平滑等值色帶形成套疊炭黑墨紋及暖白留紙。墨色僅改變顏色／粗糙度；高度來自獨立紙面細粒／纖維，AO 保持平紙面，不把墨線刻成溝槽。0.24 m tile、四圖 opaque dielectric、metallic 0；不新增流體模擬或紙張 geometry，借用／銷毀契約不變。

`vermiculite` 是膨脹蛭石：交錯排列的三十六顆 seeded 旋轉細長金棕色顆粒具有手風琴狀層片。層脊較高／亮／平滑，層隙較低／暗／粗糙；層脊同時擴張側緣，而非印上條紋，顆粒間保留低暗底。0.06 m tile、四圖 opaque dielectric、metallic 0；不新增礦物 geometry 或膨脹模擬，借用／銷毀契約不變。

`cairotiles` 是真正的 Cairo 五邊形鋪磚：三十二塊等形磚以交替鏡射／旋轉鋪滿平面，每塊兩個直角、三個 120 度角，形成四向及三向接縫。五邊使用相同實體寬度的灰縫與平滑倒角，seeded 暖褐色差不影響磚面高度；不是方磚上的印花。0.8 m tile、四圖 opaque dielectric、metallic 0；不新增鋪磚 geometry，借用／銷毀契約不變。

`guilloche` 是銀色金屬的 Guilloché 花紋雕刻：四組 seeded 旋轉、三圈套疊的閉合八瓣刻線，刻槽低於／暗於／粗糙於完整金屬平面。所有刻槽避開 polar 中心及 cell 邊界，不產生極點或接縫。0.1 m tile、四圖 opaque、metallic B 全 255／factory factor 1；不是圓形磨紋或凸起壓花，不新增刻線 geometry，借用／銷毀契約不變。

`seaurchintest` 是九枚 seeded 旋轉的象牙色海膽殼：微凸殼面具有五放射雙孔列、頂端凹孔與間輻凸瘤。五十個成對小孔低於／暗於／粗糙於殼面；殼緣平滑降至暗底。0.24 m tile、四圖 opaque dielectric、metallic 0；孔洞不透明，不新增殼體 geometry，借用／銷毀契約不變。

`crystallineglaze` 是藍綠色結晶釉陶瓷：十六組 seeded 晶花具有放射針晶、生長色帶與不規則邊緣。晶花只改變顏色／粗糙度，獨立釉面細粒決定高度，AO 保持平面；不是霜晶浮雕。0.16 m tile、四圖 opaque dielectric、metallic 0，不新增晶體 geometry 或窯燒模擬，借用／銷毀契約不變。

`shirring` 是粉紫色抽褶布料：四排橫向彈性縫線壓低二十四道細褶，行間褶冠隆起且略微彎移，每排保留四十八段短針腳與細織紋。0.12 m tile、四圖 opaque dielectric、metallic 0；不是直褶、泡泡紗色條或菱格絎縫，不新增布料 geometry／彈性模擬，借用／銷毀契約不變。

`sunburstveneer` 是日芒拼花木皮：四組圓形拼花各有十二片扇形木皮，細長木紋隨各片放射方向旋轉。中央木塞、扇片與外側深色木板嵌平，窄拼縫才凹陷／變暗／提高粗糙度。0.8 m tile、四圖 opaque dielectric、metallic 0；不是端面年輪或抬高圓盤，不新增木片 geometry，借用／銷毀契約不變。

`rakedgravel` 是枯山水耙紋礫石：八道平行耙溝具有平底、圓滑溝肩與隆起溝岸；溝底及岸面皆保留 seeded 細礫石的獨立凸面及暗隙，不以細砂正弦波紋代替石粒。0.8 m tile、四圖 opaque dielectric、metallic 0，不新增石粒 geometry 或耙動模擬，借用／銷毀契約不變。

`flintwall`（燧石砌牆）以六乘六交錯角狀石塊呈現深色敲裂石心、偏心弧形斷口紋、較粗糙的淺色白堊外皮及下凹灰漿縫。seed 固定各石塊旋轉、輪廓與色調；石面不做鵝卵石圓頂，白堊皮不是金屬鍍層。1.2 m tile、四圖 opaque、metallic 0，沿用借用／destroy 契約，不新增砌石 geometry。

`frenchknots`（法式結粒刺繡）在米色織布上配置六乘六粉紅色小結，雙圈微擾動繞線凸紋環繞閉合中央凹點；seed 固定位置、橢圓旋轉與相位，獨立細織紋保留底布質感。不是長緞繡針腳或圈圈紗的連續紗線，凹點不穿透底布。0.06 m tile、四圖 opaque、metallic 0，沿用借用／destroy 契約，不新增刺繡 geometry／針線模擬。

`artichoke`（朝鮮薊苞片）以六乘六交錯覆疊的綠色苞片，呈現寬根部、漸縮抬起的尖端、中央主脈與三對斜向細葉脈。seed 固定葉片色調與微粒，覆疊邊緣保留細 AO 陰影；不是木質平截松果鱗片或果皮上稀疏的火龍果突片。0.18 m tile、四圖 opaque、metallic 0，沿用借用／destroy 契約，不新增葉片 geometry。

`splitlockwashers`（開口彈簧墊圈）配置四乘四 seeded 旋轉開口環，環面沿圈漸升，切口兩端高低分離，內外圓緣有窄倒角。中心孔、缺口與外側露出同一低鋼板底面，不是透明孔洞；不是閉合鎖子甲環或實心瓶蓋。0.08 m tile、四圖 opaque，底板與墊圈的 metallic 通道及 factory factor 都是 1，沿用借用／destroy 契約，不新增墊圈 geometry／彈簧模擬。

`flemishbond`（佛蘭德式磚砌）在十六層磚列中，每層交替四組深色短磚頭與雙寬長磚面，相鄰列錯位讓短磚頭對齊長磚面中心，共一百二十八塊磚。水平／垂直灰縫與倒角保持相同實體寬度；seed 固定各磚色調與表面微粒／骨材，兩種朝向不額外改變嵌平高度。不同於每層只有單一磚向的英式磚砌。1.2 m tile、四圖 opaque、metallic 0，沿用借用／destroy 契約，不新增砌磚 geometry。

`satinweave`（五枚經面緞紋）以二十五乘二十五經緯交叉點呈現四跨一壓的長經浮線，孤立緯線露點逐列錯開兩根線，交織處交換上下層高度與粗糙度，seed 固定細纖維相位與微粒。不同於平紋的一上一下或連續斜紋；光澤仍由既有 roughness／normal maps 表現，不新增各向異性 BRDF。0.02 m tile、四圖 opaque、metallic 0，沿用借用／destroy 契約，不新增布料 geometry。

`lotusroot`（蓮藕切面）以三乘三淡色肉質圓片、薄褐皮、八條放射狀長橢圓氣孔及中央小孔組成，seed 決定切面旋轉與氣孔長短軸。孔間肉質與皮緣嵌平，氣孔低於肉質且沒有蓮蓬式種子或隆起孔環。0.24 m tile、四圖 opaque、metallic 0；孔底與片外空隙使用低暗底面，不是 alpha holes，不新增切面 geometry，沿用借用／destroy 契約。

`cardboardedge`（瓦楞紙板切邊）呈現六層切面，各四週期波浪芯紙連接上下平面紙層，seed 決定逐層波相與紙漿細紋。芯紙與 liner 共用嵌平切面，接點不疊高，中空腔為低暗底面；不同於 `corrugatedcardboard` 的正面起伏。0.024 m tile、四圖 opaque、metallic 0，不新增紙板 geometry／透明孔洞，沿用借用／destroy 契約。

`hexnuts`（六角螺帽）以四乘四 seeded 旋轉六角面、六條直外緣倒角、獨立圓形凹孔及細密同心加工紋組成。六角角部伸出直邊半徑之外，孔底與外側露出同一低鋼板底面；不是圓形墊圈或十字螺絲頭，加工紋不代表螺旋牙。0.08 m tile、四圖 opaque、全 metallic 通道與 factory factor 1，不新增螺帽 geometry／alpha holes，沿用借用／destroy 契約。

`orbicularjasper`（球紋碧玉）在綠色基質中呈現二十五個獨立球紋，seed 決定中心位置、半徑及三／四層淺色礦物環。球紋不是連通色帶或晶洞：色環只改變 color／roughness，拋光 height 僅含獨立微粒、AO 固定 1。0.12 m tile、四圖 opaque、metallic 0，不新增礦石 geometry，沿用借用／destroy 契約。

`acornbarnacles`（橡實藤壺殼）呈現四乘四 seeded 旋轉殼體、六片放射板縫、四十八條細肋及中央菱形凹口。殼壁由寬底向內收高，深孔低於殼緣；不同於海膽的五列雙孔或珊瑚圓形隔板孔。0.12 m tile、四圖 opaque、metallic 0，孔底與殼外維持低暗底面，不新增藤壺 geometry／alpha holes／生物動畫，沿用借用／destroy 契約。

`circularpavers`（同心環狀鋪石）由二乘二圓形拼花構成，各有中心圓石與四圈 8／16／24／32 塊楔形石，共三百二十四塊。交替環圈偏移半個扇區；seed 控制各拼花旋轉與石色。圓弧與徑向直縫使用相同實體灰縫／倒角寬度，石面嵌平。1.6 m tile、四圖 opaque、metallic 0，不新增鋪石 geometry，沿用借用／destroy 契約。

`snowflaketiles`（雪花陶磚）由四乘四藍釉方磚構成，各有 seeded 旋轉的六向雪花，每臂兩對斜分枝。白色釉彩只影響 color／roughness，磚面保持嵌平，normal／AO 只反映方形灰縫與微粒。0.8 m tile、四圖 opaque、metallic 0，不新增雪晶 geometry／透明效果，沿用借用／destroy 契約。

`sawblades`（圓鋸片）由四乘四 seeded 旋轉薄金屬片構成，各有二十四枚長背／短前緣的非對稱齒、凹入齒谷與中央圓形軸孔。片面保持平整並有細密同心加工紋；孔底與片外為同一低金屬底板。0.8 m tile、四圖 opaque、全 metallic 通道及 factory factor 1，不新增鋸片 geometry／透明孔洞／旋轉動畫，沿用借用／destroy 契約。

`pistachios`（開口開心果）由五乘五 seeded 旋轉長橢圓果殼構成，淡色雙瓣殼緣高於綠色果仁，果仁兩側另有更低的暗隙；殼面具有細長纖維，片外為低暗底面。0.15 m tile、四圖 opaque、metallic 0，不新增果殼 geometry／透明開口，沿用借用／destroy 契約。

`polkadotfabric`（圓點印花布）在藍色平織底布上配置六乘六米白圓點，相鄰列錯開半格，seed 控制印花平移與微粒。圓點只影響 color／roughness，底下九十六經緯線的高度與 AO 不受圖案邊緣影響。0.12 m tile、四圖 opaque、metallic 0，不新增珠點 geometry／透明網孔，沿用借用／destroy 契約。

`cucumberslices`（小黃瓜切片）由三乘三 seeded 旋轉圓切片構成，深綠外皮包圍淡色果肉，三組放射狀種子腔各含三顆淡色長籽。果肉、膠質、籽與皮緣保持同一平齊切面，只有顏色／粗糙度不同，不產生空氣孔洞或凸籽。0.18 m tile、四圖 opaque、metallic 0，不新增切片 geometry／透明果肉，沿用借用／destroy 契約。

`monsteraleaf`（龜背芋葉）由三乘三 seeded 旋轉闊葉構成，各有六個閉合長孔、六條通向葉緣的裂口、基部凹口、中肋及斜向側脈。葉內孔與葉緣裂口之間保留葉肉橋，孔底及葉外皆為同一低暗底面。0.9 m tile、四圖 opaque、metallic 0，不新增透明孔洞／葉片 geometry／生長動畫，沿用借用／destroy 契約。

`crossstitch` 在織布上排列八乘八凸起 X 繡針，每個 X 由兩條有限長斜向繡線組成，具有圓滑橫截面與平滑收尾；上層線固定遮住下層線，交點不疊加兩條線的高度。Seeded 線色與細纖維搭配底布組織。0.08 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變，不新增繡線 geometry 或穿布孔洞。

`staranise` 排列九個 seeded 旋轉八角，每個有八個尖端木質果莢、凹下的莢腔與較光滑的種子。莢壁高於種子，種子高於腔底，放射莢之間露出低暗底面。0.12 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變，不新增果莢 geometry 或透明間隙。

`logcabinparquet` 由四個方形拼木區塊組成，每區有中央方板與八條逐漸加長、以平接端頭繞行的螺旋木條。木紋沿各板長軸延伸，內部 lookup cell 邊界不形成多餘接縫；平坦板面以窄凹縫及平滑倒角分隔。1.2 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變，不新增板材 geometry。

`countersunkmetal` 在平坦金屬板上排列六乘六深圓孔，每孔有陡峭內壁與較寬錐形沉孔；錐面中段維持直線斜率，兩端平滑接合，細拉絲紋不掩蓋輪廓。0.3 m tile、四圖 opaque、整張 metallic B 通道及材質 factor 皆為 1，包含孔內低底面。既有借用／destroy 契約不變，不新增透明孔洞或切削 geometry。

`trilobitefossil` 在較淺石質底面排列九個 seeded 旋轉三葉蟲低浮雕。寬頭甲帶成對眼部，凸起軸葉連接頭與較窄尾甲，十對彎曲胸肋以凹槽分隔。盾甲重疊與胸節端部採 compact supports，維持平滑週期表面。0.45 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變，不新增化石 geometry 或特定物種科學復原。

`eyeletcotton` 在象牙白織布上排列六乘六暗圓孔，每孔周圍有連續凸起繡邊與十六個 seeded 放射狀針腳；針腳之間的繡邊谷部仍高於底布。0.06 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變。孔洞保留低 opaque 底面而非透明裁切，不新增線材或孔洞 geometry。

`dendriticagate` 在暖色淺瑪瑙拋光面內嵌九組 seeded 樹枝狀礦物包裹體。五代二叉分枝逐漸變細，不帶葉片或凸起剪影。0.15 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變；色彩包裹體不添加枝狀 normal、roughness 或 AO 溝脊。這是風格化礦紋，不是地質生長模擬。

`ravioli` 形成十六個金黃色方餃麵皮包，中央餡料輪廓帶 seeded 微偏移，周圍是扁平封邊、每片二十道叉壓凹槽與微波浪切邊。中央鼓包高於封邊，叉痕只壓低外圍。0.16 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變；不新增麵皮 geometry、內餡或烹調模擬。

`rollerchain` 呈現四列錯位滾子鏈側片，每列六節。束腰鏈片交替呈現低內片與高外片，共用圓銷軸，帶凹入環槽與微凸鉚釘頭。0.24 m tile、四圖 opaque，整張 metallic B 通道及材質 factor 皆為 1，包含鏈條之間的低暗金屬底面。既有借用／destroy 契約不變；這是側視貼圖，不新增鏈條 geometry、動畫或傳動物理。

`mapleleaf` 排列九個 seeded 旋轉秋橙色楓葉圖案，每片具有五裂掌狀輪廓、微齒邊、五條凸起放射葉脈與狹長葉柄。深葉裂露出暗底，葉柄延伸至葉片下方。0.3 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變；此為風格化葉面，不新增葉片 geometry 或植物物種模擬。

`smocking` 以成對布褶在相鄰列交替收束，形成藍紫色蜂巢抽褶。三十六道短橫針腳固定壓低的收束點，張開褶冠高於固定點；細織紋與 seeded 纖維不掩蓋抽褶輪廓。0.12 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變。此為抽褶表面，不是絎縫、布料模擬、線材 geometry 或穿孔。

`quatrefoiltile` 排列二十五塊青綠色四葉弧形釉面磚，搭配深色菱形嵌片。圓弧瓣交會形成凹角，粗糙填縫低於磚面，菱形嵌片略低於主磚。0.5 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變，不新增磚塊 geometry 或 displacement。

`okraslice` 排列九片 seeded 旋轉綠色秋葵切片。五稜外皮包圍五個凹入種子腔，每腔兩顆淺色圓籽，高於腔底但低於實心中央組織與分隔壁。0.09 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變；不新增蔬菜 geometry、真實孔洞或食品模擬。

`eggcarton` 形成四乘四的灰米色模壓紙漿蛋盒表面：十六個圓形蛋杯凹於平坦鞍部之下，每個杯壁帶一圈凸起肋環，四杯交會處升起錐頭。細紙漿纖維不掩蓋蛋盒輪廓。0.16 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變；不新增包裝 geometry、真實孔洞、雞蛋或纖維模擬。

`greekkey` 在深藍黑色陶瓷上刻出鎏金希臘回紋：九個方形螺旋鉤向內捲至開放尖端，底線延伸到兩側 cell 邊緣，使回紋鉤跨 tile wrap 連成一線，每條凸線中央另有較亮的細芯。0.45 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變；不新增浮雕 geometry，也不模擬真實黃金或陶瓷。

`seedbeads` 以錯開半顆的 peyote 針法編織光澤小米珠：四十八顆圓柱珠各有拱起的桶狀剖面，兩端各有一個凹入穿線孔，珠間線隙低且粗糙，每顆珠子的色調依 seed 分布在藍到金的色階上。0.06 m tile、四圖 opaque dielectric、metallic 0 與既有借用／destroy 契約不變；不新增珠子 geometry、透光或線材模擬。

另支援 `chainstitch`（鏈式針繡），深藍布底上五列、每列六個上窄下寬的金色中空繡環相扣。使用 `await ProceduralMaterial.create('chainstitch', { seed: 7 })`；`proceduralRepeats('chainstitch', 1)` 為每米 8⅓ repeats（0.12 m tile）。四圖 opaque dielectric、metallic 0、選用 height 與借用／destroy 契約不變；不新增紗線 geometry、透明孔洞或布料模擬。

另支援 `wingnuts`（蝶形螺帽）：十六個交替轉向 90° 的銀色螺帽，雙翼隆起、中央凹孔及間隙為暗鋼底。使用 `await ProceduralMaterial.create('wingnuts', { seed: 7 })`；0.12 m tile、metallic 預設 1。沿既有四圖、選用 height 與借用／destroy 契約；不新增螺帽 geometry、透明孔洞、實際螺紋或機械模擬。

另支援 `pomegranateslice`（石榴切片），九個紅皮圓形斷面帶乳白中心與隔膜，六個凹入果室各有七顆隆起紅果粒。使用 `await ProceduralMaterial.create('pomegranateslice', { seed: 7 })`；0.15 m tile、opaque dielectric、metallic 0，既有 maps／選用 height／借用／destroy 契約不變，不新增果粒 geometry、透明或 transmission。

另支援 `pawprinttiles`（爪印釉面磚），十六片象牙白方磚上帶四趾與三葉掌墊的鈷藍凹印，磚間有粗糙灰縫。使用 `await ProceduralMaterial.create('pawprinttiles', { seed: 7 })`；0.6 m tile、opaque dielectric、metallic 0，既有 maps／選用 height／借用／destroy 契約不變，不新增磁磚 geometry 或實際壓印。

另支援 `dovetailjoint`（燕尾榫木拼板），八個外寬內窄的梯形榫舌帶深凹接縫，木板縱橫木紋交替。使用 `await ProceduralMaterial.create('dovetailjoint', { seed: 7 })`；0.48 m tile、opaque dielectric、metallic 0，既有 maps／選用 height／借用／destroy 契約不變，不新增榫接 geometry 或結構力學模擬。

另支援 `starsocketbolts`（六瓣星槽螺栓頭），十六顆銀色圓拱螺栓頭帶封底六瓣星槽，相鄰槽向交替 30°。使用 `await ProceduralMaterial.create('starsocketbolts', { seed: 7 })`；0.12 m tile、metallic 預設 1，既有 maps／選用 height／借用／destroy 契約不變，不新增螺栓 geometry、透明孔或真實螺紋。

另支援 `sanddollar`（沙錢殼），九片扁橢圓殼帶五瓣凹線與五個狹長 lunule。使用 `await ProceduralMaterial.create('sanddollar', { seed: 7, size: 512 })` 可較清楚查看細花瓣線；0.3 m tile、opaque dielectric、metallic 0，既有 maps／選用 height／借用／destroy 不變。凹孔是不透明暗底 shading，不是透明穿孔或殼 geometry。

另支援 `brogueleather`（雕花皮革），棕色皮面上的六瓣沖孔花飾與雙排細邊孔。使用 `await ProceduralMaterial.create('brogueleather', { seed: 7 })`；0.18 m tile 含九朵花，opaque dielectric、metallic 0，既有 maps／選用 height／借用／destroy 不變。孔為不透明暗底 shading，不是 geometry 或透明穿孔。

另支援 `clovebuds`（丁香乾香料），圓蕾頭、四裂萼托與細莖，相鄰方向交替 90°。使用 `await ProceduralMaterial.create('clovebuds', { seed: 7 })`；0.08 m tile 含十六枚丁香，opaque dielectric、metallic 0，既有 maps／選用 height／借用／destroy 不變，不新增香料 geometry 或食品模擬。

另支援 `starcrosstiles`（八角星十字磚），深青色八角星與象牙白十字之間為深凹灰縫。使用 `await ProceduralMaterial.create('starcrosstiles', { seed: 7 })`；0.8 m tile 含十六顆星，opaque dielectric、metallic 0，既有 maps／選用 height／借用／destroy 不變，不新增實際磚 geometry 或鋪設模擬。

另支援 `maplesamara`（成對楓翅果），V 形外展薄翅帶細脈與隆起深色種仁。使用 `await ProceduralMaterial.create('maplesamara', { seed: 7 })`；0.2 m tile 含十六對、方向交替翻轉 180°，opaque dielectric、metallic 0，既有 maps／選用 height／借用／destroy 不變，不新增翅果 geometry、透明薄膜或飛行模擬。

另支援 `lenoweave`（紗羅織），成對經線扭交並鎖住橫向緯線，交點上下次序交替。使用 `await ProceduralMaterial.create('lenoweave', { seed: 7 })`；0.06 m tile 含六組經線及六條緯線，opaque dielectric、metallic 0，既有 maps／選用 height／借用／destroy 不變，網眼為不透明暗底，不新增透明孔或布料 geometry。

另支援 `circlips`（開口止動環），銀色 C 形平環及兩個帶鉗孔的圓耳，開口方向交替翻轉 180°。使用 `await ProceduralMaterial.create('circlips', { seed: 7 })`；0.08 m tile 含十六枚環、metallic 預設 1，既有 maps／選用 height／借用／destroy 不變，孔與缺口為不透明暗底，不新增透明孔、geometry 或彈性模擬。

另支援 `tuliptiles`（鬱金香花磚），象牙白釉面上的鈷藍三瓣花冠、細莖與成對尖葉。使用 `await ProceduralMaterial.create('tuliptiles', { seed: 7 })`；0.6 m tile 含十六朵花，opaque dielectric、metallic 0，既有 maps／選用 height／借用／destroy 不變，不新增花卉或磚 geometry、透明縫或植物模擬。

另支援 `gingerslice`（多瓣薑切片），四個不等瓣連接的淡黃纖維切面，外圍帶薄褐皮。使用 `await ProceduralMaterial.create('gingerslice', { seed: 7 })`；0.2 m tile 含十六片、方向交替 90°，opaque dielectric、metallic 0，既有 maps／選用 height／借用／destroy 不變，不新增根莖 geometry 或食品／植物模擬。

另支援 `fivebarplate`（五條筋花紋板），每組五條圓端凸筋交錯轉向。使用 `await ProceduralMaterial.create('fivebarplate', { seed: 7, size: 512 })` 可較清楚查看細筋；0.6 m tile 含十六組、metallic 預設 1，既有 maps／選用 height／借用／destroy 不變，不新增板材 geometry、止滑或承載模擬。

另支援 `cinnamonswirl`（肉桂捲切面），金黃麵團上有凹陷深褐螺旋內餡與較深烤色邊緣。使用 `await ProceduralMaterial.create('cinnamonswirl', { seed: 7 })`；0.32 m tile 含十六個、相鄰轉 180°，opaque dielectric、metallic 0，既有 maps／選用 height／借用／destroy 不變，不新增食品 geometry 或烘焙模擬。

另支援 `wheatears`（金黃麥穗），風格化成對穀粒帶凹陷縱溝、細穗芒與中央穗軸。使用 `await ProceduralMaterial.create('wheatears', { seed: 7, size: 512 })` 可較清楚查看細節；0.24 m tile 含十六支、相鄰轉 180°，opaque dielectric、metallic 0，既有 maps／選用 height／借用／destroy 不變，不新增植物 geometry、生長或風場模擬。

另支援 `scalemail`（鋼製鱗甲），交錯甲片帶中央凸脊、圓鉚釘與覆疊捲邊。使用 `await ProceduralMaterial.create('scalemail', { seed: 7 })`；0.24 m tile 含 6×8 片、暗縫是 opaque 鋼底層，metallic 預設 1，既有 maps／選用 height／借用／destroy 不變，不新增甲片 geometry、透明孔洞或防護模擬。

另支援 `trihexagonaltiles`（六邊三角釉面磚），藍色六邊面與象牙白三角面交錯，共用凹陷中性灰縫。使用 `await ProceduralMaterial.create('trihexagonaltiles', { seed: 7 })`；0.84 m tile 含 56 塊六邊磚與 112 塊三角磚，opaque dielectric、metallic 0，既有 maps／選用 height／借用／destroy 不變，不新增磚塊 geometry、碰撞或施工模擬。

另支援 `burlwood`（瘤木紋），棕金色等高木紋與九個深色髓心瘤眼，並非直木纖維。使用 `await ProceduralMaterial.create('burlwood', { seed: 7 })`；0.24 m tile 的瘤眼位置固定、木紋隨 seed 變化，opaque dielectric、metallic 0，既有 maps／選用 height／借用／destroy 不變，不新增木材 geometry、樹種鑑定或生長模擬。

另支援 `slottedmetal`（圓端長槽金屬板），交錯縱向長槽帶真圓弧端與加工斜壁。使用 `await ProceduralMaterial.create('slottedmetal', { seed: 7 })`；0.4 m tile 含 8×4 槽、槽底是 opaque 鋼面、metallic 預設 1，既有 maps／選用 height／借用／destroy 不變，不新增通孔 geometry、透明度、通風或承載模擬。

另支援 `peppercorns`（黑胡椒粒），暗色乾果帶隆起淺皺皮與凹陷果梗疤。使用 `await ProceduralMaterial.create('peppercorns', { seed: 7 })`；0.08 m tile 含二十五顆風格化果粒，opaque dielectric、metallic 0，既有 maps／選用 height／借用／destroy 不變，不新增果粒 geometry 或食品／植物模擬。

另支援 `castellatednuts`（六槽城堡螺帽），六角鋼螺帽帶中央圓孔、六道凹槽與隆起冠齒。使用 `await ProceduralMaterial.create('castellatednuts', { seed: 7 })`；0.08 m tile 有 4×4 交替方向螺帽，opaque metallic maps／預設 factor 1、選用 height／ownership 不變，不新增螺帽 geometry、透明通孔、螺紋或緊固物理。

另支援 `farfalle`（蝴蝶義大利麵），金黃麵片帶聚攏窄腰、展翼褶痕與波齒切邊。使用 `await ProceduralMaterial.create('farfalle', { seed: 7 })`；0.16 m tile 有 4×4 交替方向麵片，opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變，不新增麵片 geometry、透明度、烹飪或柔體物理。

另支援 `cardamompods`（綠豆蔻莢），風格化綠色閉合香料果莢帶收束尖端、縱向稜脊與相連短梗。使用 `await ProceduralMaterial.create('cardamompods', { seed: 7 })`；0.08 m tile 有 4×4 交替斜向果莢，opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變，不新增果莢 geometry、透明度、開莢動畫或植物／食品模擬。

另支援 `brickarches`（紅磚半圓拱），九塊楔磚、放射灰縫與兩側三層砌磚拱腳。使用 `await ProceduralMaterial.create('brickarches', { seed: 7 })`；2.4 m tile 有 4×4 裝飾拱形，opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變；開口只是暗色不透明 shading，不新增透明門洞、建築 geometry、承載或碰撞物理。

另支援 `knottednet`（打結繩網），棕黃色弧形繩段由隆起交疊繩結相連，結部收緊凹痕與暗色網孔底層。使用 `await ProceduralMaterial.create('knottednet', { seed: 7 })`；0.3 m tile 有 6×6 繩結格，opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變，不新增繩網 geometry、透明孔洞、受力或布料物理。

另支援 `fiddleheads`（蕨類捲芽），風格化綠色捲芽帶漸細螺旋芽頭、開放圈間隙與相連彎莖。使用 `await ProceduralMaterial.create('fiddleheads', { seed: 7 })`；0.24 m tile 有 4×4 交替鏡向圖案，opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變，不新增植物 geometry、透明度或生長模擬，不作植物辨識或寫實認證。

另支援 `cowrieshells`（寶螺腹面），象牙色殼面帶狹長暗色凹口與兩側各九條隆起齒脊。使用 `await ProceduralMaterial.create('cowrieshells', { seed: 7 })`；0.2 m tile 有 4×4 交替方向殼面，opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變，不新增貝殼 geometry、透明殼口或海洋生物模擬。

另支援 `cotterpins`（開口銷），鋼製環眼、分離雙腳與不等長外彎尾端。使用 `await ProceduralMaterial.create('cotterpins', { seed: 7 })`；0.12 m tile 有 4×4 交替正反鋼銷，opaque metallic maps／預設 factor 1，既有 maps／選用 height／ownership 不變，不新增五金 geometry、透明孔洞、緊固或彎折物理。

另支援 `seedstitch`（米粒針織），灰綠毛線的 V 形正針與橫向反針凸結沿行列交錯。使用 `await ProceduralMaterial.create('seedstitch', { seed: 7 })`；0.12 m tile 有 12×12 針目，opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增毛線 geometry、透明度或布料模擬。

另支援 `mangosteenslice`（山竹切面），厚紫紅果皮包住中央相連的六瓣隆起乳白果肉，瓣間有徑向凹縫。使用 `await ProceduralMaterial.create('mangosteenslice', { seed: 7 })`；0.32 m tile 有 4×4 交替旋轉 30° 的切面，opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增果實 geometry、透明度或植物學模擬。

另支援 `pickettiles`（細長六角釉面磚），交錯排列青綠尖頂長磚與凹陷中性灰縫。使用 `await ProceduralMaterial.create('pickettiles', { seed: 7 })`；0.9 m tile 有 36 磚，扣灰縫／bevel 前標稱 0.1×0.3 m，opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增磚 geometry、透明度或建築模擬。

另支援 `squarewashers`（鋼製方墊圈），完整鋼方框、倒角直邊與圓形凹陷孔眼。使用 `await ProceduralMaterial.create('squarewashers', { seed: 7 })`；0.16 m tile 有 4×4 交替旋轉 45° 的墊圈，opaque metallic maps／預設 factor 1，既有 maps／選用 height／ownership 不變，孔眼保留暗色不透明鋼底，不新增墊圈 geometry、透明孔洞、緊固或荷重模擬。

另支援 `eucalyptusleaf`（尤加利葉），灰藍綠狹長葉片帶彎曲隆起中肋、五對斜側脈、漸尖葉端與相連短葉柄。使用 `await ProceduralMaterial.create('eucalyptusleaf', { seed: 7 })`；0.48 m tile 有 4×4 交替 ±45° 的葉片，opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增葉片 geometry、透明度、風動或植物學模擬。

另支援 `twillweave`（二上二下斜紋織物），淺褐緯線與深棕經線成對交替，每列偏移一針形成連續斜紋。使用 `await ProceduralMaterial.create('twillweave', { seed: 7 })`；0.16 m tile 有 16×16 交織點，opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增毛線 geometry、透明孔隙或布料模擬。

另支援 `pumpkinseeds`（帶殼南瓜籽），乳白漸尖籽殼帶隆起殼緣與完整較低中央殼面。使用 `await ProceduralMaterial.create('pumpkinseeds', { seed: 7 })`；0.12 m tile 有 4×4 交替 ±45° 的籽殼，opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增種籽 geometry、透明殼、開裂或植物學模擬。

另支援 `spurgears`（風格化鋼齒輪），十二個塊狀外齒、圓形凹軸孔與隆起輪轂。使用 `await ProceduralMaterial.create('spurgears', { seed: 7 })`；0.2 m tile 有 4×4 交替 15° 的鋼輪，opaque metallic maps／預設 factor 1，既有 maps／選用 height／ownership 不變，孔／齒隙保留暗色不透明鋼底，不新增齒輪 geometry、透明孔洞、漸開線齒形認證或傳動模擬。

另支援 `diamondcheckertiles`（斜鋪棋盤磚），黑／米白釉面正方磚帶柔化倒角、低陷中性灰縫與 seeded 磚面色差。使用 `await ProceduralMaterial.create('diamondcheckertiles', { seed: 7 })`；1.2 m tile 有 32 塊旋轉 45° 且沿兩個對角方向交替深淺的磚面，opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增鋪磚 geometry、透明度或物理。

另支援 `appleslice`（蘋果橫切面），薄紅褐果皮、淡色果肉與五個含深色籽的獨立凹種室，籽高於室底而低於完整果肉。使用 `await ProceduralMaterial.create('appleslice', { seed: 7 })`；0.4 m tile 有 4×4 交替 36° 的切面，區別 appleskin 的完整外皮。opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增果實 geometry、透明種室、切割、汁液或植物學模擬。

另支援 `paperclips`（鋼製迴紋針），三段銀色線身與兩道嵌套回彎保持連通，兩個線端及內槽保留開口。使用 `await ProceduralMaterial.create('paperclips', { seed: 7 })`；0.24 m tile 有 4×4 交替 ±45° 的線夾，opaque metallic maps／預設 factor 1，既有 maps／選用 height／ownership 不變，內槽保留暗色不透明鋼底，不新增線材 geometry、透明度或夾持模擬。

另支援 `ivyleaf`（三裂常春藤葉），綠葉具有三個尖裂片、兩道深缺刻、隆起掌狀葉脈及連通葉柄。使用 `await ProceduralMaterial.create('ivyleaf', { seed: 7 })`；0.32 m tile 有 4×4 交替 ±45° 的葉片，區別 mapleleaf 的五裂輪廓。opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增葉片 geometry、透明度、風動或植物學模擬。

另支援 `ribknit`（一上一下羅紋針織），玫瑰褐色較高 V 形正針直列與較低橫向反針直列交替。使用 `await ProceduralMaterial.create('ribknit', { seed: 7 })`；0.12 m tile 有 12×12 針目，每欄在各列保持同種針目，不像 seedstitch 逐列換位。opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增紗線 geometry、透明孔隙、彈性或布料模擬。

另支援 `pillowtiles`（枕形釉面磚），象牙白圓角方磚有連續凸起中央、柔化倒角、低陷中性灰縫與 seeded 磚面色差。使用 `await ProceduralMaterial.create('pillowtiles', { seed: 7 })`；0.6 m tile 有 6×6 枕面磚，區別平頂隔熱磚。opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增磚體 geometry、位移或透明度。

另支援 `coffeerings`（紙面咖啡杯圈），淡色紙面有不規則褐色乾燥環與較淡內部浸染。使用 `await ProceduralMaterial.create('coffeerings', { seed: 7 })`；0.36 m tile 有 3×3 seeded 橢圓杯圈、局部褪淡與近乎平坦紙纖維，不把色漬當凹槽。opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增紙／杯 geometry、透明液體、流體、吸收或乾燥模擬。

另支援 `cashews`（腰果仁），奶油色 C 形果仁有厚實弧身、大小不對稱的圓鈍端部與連通中央的側邊開口。使用 `await ProceduralMaterial.create('cashews', { seed: 7 })`；0.16 m tile 有 4×4 交替 ±45° 排列的果仁，帶 seeded 色差與細紋。opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增果仁 geometry、透明孔洞、次表面散射或食物物理。

另支援 `hinges`（鋼製鉸鏈），雙側圓角固定葉片有六個沉孔，中央為五節凸起軸筒，節縫中可見較低且連續的銷軸。使用 `await ProceduralMaterial.create('hinges', { seed: 7 })`；0.4 m tile 有 4×4 鉸鏈與 seeded 拉絲微紋。opaque steel／metallic 1，既有 maps／選用 height／ownership 不變，不新增鉸鏈 geometry、透明孔洞、活動關節或剛體物理。

另支援 `coins`（五角星壓印金色硬幣），凸起圓框包圍較低平面與連通五角星浮雕。使用 `await ProceduralMaterial.create('coins', { seed: 7 })`；0.12 m tile 有 4×4 金色圓幣，星形朝向交替差 36°，帶 seeded 色差及細紋。opaque metal／metallic 1，既有 maps／選用 height／ownership 不變，不新增硬幣 geometry、文字、透明度、貨幣系統或剛體物理。

另支援 `righttriangletiles`（直角三角釉面磚），藍灰／乳白直角等腰三角磚有交替方向的斜縫。使用 `await ProceduralMaterial.create('righttriangletiles', { seed: 7 })`；1 m tile 有 4×4 分割方格、共 32 塊獨立 seeded 磚面，低陷中性灰縫的直線／斜線倒角寬度一致。opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增磚體 geometry、位移或透明度。

另支援 `cherryblossom`（五瓣櫻花），stylized 粉色五瓣花有末端缺刻、較低花心與十二個淺色凸起花粉點。使用 `await ProceduralMaterial.create('cherryblossom', { seed: 7 })`；0.24 m tile 有 4×4 花朵，交替 36° 朝向、seeded 花色及細紋。opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增花朵 geometry、透明孔洞、植物生長、風動或次表面散射模擬。

另支援 `punchcard`（打孔資料卡），米色薄紙卡有單側上角切角及矩形打孔圖樣。使用 `await ProceduralMaterial.create('punchcard', { seed: 7 })`；0.44 m tile 有 2×4 紙卡，各有 20×8 孔位、每欄兩個不同 seeded 打孔，孔間保留紙橋、紙面高度差約 0.3 mm。opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，孔位回到不透明背襯，不新增紙卡 geometry、透明鏤空、真實資料編碼／讀卡或紙張物理。

另支援 `braidedcord`（三股扁辮繩），棉色三股繩以不同深淺保留身分，交替上下穿越而非螺旋捻線或雙股針織纜花。使用 `await ProceduralMaterial.create('braidedcord', { seed: 7 })`；0.08 m tile 有四條直向辮帶、每條四個週期。opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增繩股 geometry、透明孔洞、編繩製程或布料物理。

另支援 `crossbeddedsandstone`（交錯層理砂岩），彎曲傾斜細紋在水平岩層內截斷。使用 `await ProceduralMaterial.create('crossbeddedsandstone', { seed: 7 })`；1.2 m tile 有四個交替傾向的 dip sets、共用接觸帶、微量低陷細層理及砂粒微紋，區別近水平平行地層。opaque dielectric／metallic 0，既有 maps／選用 height／ownership 不變，不新增岩體 geometry、位移、地層生成、沉積或侵蝕模擬。

另支援 `grommetcanvas`（黃銅雞眼扣帆布），棕色粗織布上有凸起黃銅環及暗色不透明孔底。使用 `await ProceduralMaterial.create('grommetcanvas', { seed: 7 })`；0.16 m tile 有 4×4 凸面扣環及平順內外 bevel。Authored metallic map 僅黃銅為 1、帆布／孔底為 0，預設 material metallic factor 1 保留這個分區。既有 maps／選用 height／ownership 不變，不新增 geometry、透明鏤空或布料物理。

另支援 `fishscaletiles`（魚鱗形釉面馬賽克），互鎖青綠色扇形磚保留凸半圓上沿、雙凹弧下沿及中性弧形填縫。使用 `await ProceduralMaterial.create('fishscaletiles', { seed: 7 })`；0.4 m tile 有 4 columns／8 rows、共平面釉面與逐磚 seeded 深淺。Opaque dielectric、metallic 0，`tint` 只染釉面、不染填縫。既有 maps／選用 height／ownership 不變，不新增 geometry、透明度或鋪磚模擬。

另支援 `hexkeys`（黑氧化六角扳手），不等長 L 形直臂以圓彎肘連接，平切端與棒材平頂／雙側斜面區別圓線材。使用 `await ProceduralMaterial.create('hexkeys', { seed: 7 })`；0.4 m tile 有 4×4 seeded quarter-turn 轉向。Opaque metallic、map／預設 factor 皆為 1，既有 maps／選用 height／ownership 不變，不新增工具 geometry、機械裝配或物理。

另支援 `driedfigslice`（無花果乾切片），收窄的果形保留淺褐皺摺果皮、深棕果肉與細小淡色籽。使用 `await ProceduralMaterial.create('driedfigslice', { seed: 7 })`；0.24 m tile 有 4×4 交替轉向切片，seeded jittered 籽粒只在果肉內呈現。Opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變，不新增果實 geometry、透明度、食物生成或生物模擬。

另支援 `creamcrackers`（波邊奶油蘇打餅），金黃方餅保留四側波邊、九個深色壓痕、褐色外緣與不規則起泡焦斑。使用 `await ProceduralMaterial.create('creamcrackers', { seed: 7 })`；0.24 m tile 有 4×4 獨立 seeded 餅片，不是連續威化網格。Opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變，不新增食物 geometry、透明孔、烘焙或食物物理。

另支援 `doorkeys`（黃銅門鑰匙），圓環匙頭連接共平面窄頸與非對稱匙身，保留三處圓底齒槽、縱向導槽及倒角匙尖。使用 `await ProceduralMaterial.create('doorkeys', { seed: 7 })`；0.32 m tile 有 4×4 seeded quarter-turn 鑰匙。Opaque metallic、map／預設 factor 皆為 1，既有 maps／選用 height／ownership 不變，不新增鑰匙 geometry、透明孔、鎖芯或機械模擬。

另支援 `dodecagontiles`（十二邊三角釉面馬賽克），藍綠十二邊磚與淡色三角嵌片以中性填縫分隔。使用 `await ProceduralMaterial.create('dodecagontiles', { seed: 7 })`；0.7 m tile 有 56 塊大磚及 112 塊嵌片、seeded 色差與共平面釉面。Canonical 3.12.12 的矩形週期正規化至方形 UV，非實體正多邊形的尺寸量測基準。Opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變，不新增 geometry、透明度或鋪磚模擬。

另支援 `ballchain`（銀色金屬珠鏈），實心球珠由細直頸接成緩彎週期鏈條，區別穿孔珠與環鏈。使用 `await ProceduralMaterial.create('ballchain', { seed: 7 })`；0.064 m tile 有四條各八珠的鏈帶。Opaque metallic、map／預設 factor 皆為 1，既有 maps／選用 height／ownership 不變，不新增珠鏈 geometry、透明度或鏈條物理。

另支援 `succulentrosettes`（多肉蓮座葉叢），灰綠肥厚匙形葉分三圈錯位排列，由外向內抬高，保留凸冠及圓葉尖。使用 `await ProceduralMaterial.create('succulentrosettes', { seed: 7 })`；0.64 m tile 有 4×4 seeded 轉向，每圈六葉。Opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變，不新增植物 geometry、透明度、次表面散射或生物模擬。

另支援 `foldingfans`（紙摺扇），象牙色紙面保留放射摺痕、露出木骨、兩側護骨及圓扇釘。使用 `await ProceduralMaterial.create('foldingfans', { seed: 7 })`；1 m tile 有 4×4 交替轉向的 140° 扇面，每扇十二道紙摺、十三根木骨。Opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變，不新增扇子 geometry、透明孔、開合動畫或摺紙物理。

另支援 `togglebuttons`（雙孔木製牛角扣），長桶形木扣有圓滑收束端、凸冠、雙穿繩孔及順向木紋。使用 `await ProceduralMaterial.create('togglebuttons', { seed: 7 })`；0.32 m tile 排列 4×4 橫直交替的木扣，區別既有四孔圓形 `button`。Opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變，不新增鈕扣 geometry、透明孔、繩索或衣物物理。

另支援 `greenpeapods`（封閉青豌豆莢），彎曲尖端莢殼有雙側縫脊、短柄及殼下五顆豌豆隆起。使用 `await ProceduralMaterial.create('greenpeapods', { seed: 7 })`；0.48 m tile 排列 4×4 交替斜向豆莢，區別多肋小豆蔻與凹穴蓮蓬。Opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變，不新增豆莢 geometry、透明外殼、剝莢動畫或植物模擬。

另支援 `beltbuckles`（黃銅皮帶框扣），圓角框保留較低中柱、較高收尖扣舌與圓樞軸。使用 `await ProceduralMaterial.create('beltbuckles', { seed: 7 })`；0.32 m tile 排列 4×4 橫直交替框扣。Opaque metallic、metallic factor／map 含暗低 backing 皆為 1，雙腔只有開口外觀、非透明孔。既有 maps／選用 height／ownership 不變，不新增框扣 geometry、皮帶材質、扣合動畫或機械模擬。

另支援 `hextruchettiles`（六角三弧 Truchet 釉面磚），深藍六角磚每片三段象牙弧。使用 `await ProceduralMaterial.create('hextruchettiles', { seed: 7 })`；0.7 m tile 有 56 片、兩種 seeded 方向、六邊中點接續與凹中性灰縫。弧為平面釉色、不是凸管，square UV 約有 1% 軸伸縮。Opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變，不新增拼磚 geometry 或路徑／拼圖遊戲。

另支援 `scoredmango`（十字劃切芒果果頰），橢圓薄皮邊包住凹十字切線與圓潤金黃果肉方塊。使用 `await ProceduralMaterial.create('scoredmango', { seed: 7 })`；0.48 m tile 有 4×4 橫直交替果頰，切線仍保留連續果肉 floor、方塊不越出內橢圓。Opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變，不新增翻開／分離果塊 geometry、透明度或切割物理。

另支援 `waxseals`（五瓣徽記封蠟印章），深紅蠟面有不規則熔邊、圓形凹壓印、凸環與五瓣浮雕徽記。使用 `await ProceduralMaterial.create('waxseals', { seed: 7 })`；0.16 m tile 有 4×4 seeded 印章。Opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變，不新增印章 geometry、文字／自訂徽記輸入、熔融動畫或蠟流體模擬。

另支援 `cottonbolls`（四團棉絮開裂棉鈴），象牙棉絮有四個凸冠、較低中央交接與露出尖褐苞片。使用 `await ProceduralMaterial.create('cottonbolls', { seed: 7 })`；0.24 m tile 有 4×4 交替轉 45° 棉鈴，seeded fine／nap 表現纖維斑理。Opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變，不新增纖維 geometry、透明毛邊、次表面散射或植物生長。

另支援 `carabiners`（鋁色 D 型登山扣），不對稱圓角框有直背、斜門閂、兩端凹接縫與凸鉸釘。使用 `await ProceduralMaterial.create('carabiners', { seed: 7 })`；0.32 m tile 有 4×4 橫直交替框扣。Opaque metallic、metallic factor／map 含暗低 backing 皆為 1，開口非透明孔；既有 maps／選用 height／ownership 不變，不新增扣環 geometry、開合機構、碰撞或承重認證。

另支援 `pencilends`（木鉛筆橫切面），六角末端有薄深色漆邊、淺木切面與略低實心石墨芯。使用 `await ProceduralMaterial.create('pencilends', { seed: 7 })`；0.04 m tile 有 4×4 交替轉 30° 末端，漆／木／芯各有 roughness。Opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變，不新增鉛筆 geometry、削尖／書寫功能或導電模擬。

另支援 `corrugatedplasticedge`（中空塑膠板切邊），藍色平面皮與筆直肋板圍出矩形槽，接合保持同高。使用 `await ProceduralMaterial.create('corrugatedplasticedge', { seed: 7 })`；0.064 m tile 有 8 排交替半格的板切邊，每排 8 槽。Opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變；中空槽是低暗 opaque backing 而非透明孔。不新增板 geometry、結構力學或塑膠性能認證。

另支援 `haircombs`（塑膠髮梳），琥珀色平整梳背連接 14 根漸細、圓鈍收尾的齒，齒根同高、齒間槽連通外部低暗 backing。使用 `await ProceduralMaterial.create('haircombs', { seed: 7 })`；0.48 m tile 有 4×4 交替水平／垂直髮梳。Opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變；不新增梳子 geometry、透明塑膠、頭髮交互或變形模擬。

另支援 `blackberries`（黑莓聚合果），深紫光澤橢圓果實由 19 顆凸圓小核果組成，雙顆／三顆接縫較低但填實，區別葡萄皮果粉與荔枝果殼。使用 `await ProceduralMaterial.create('blackberries', { seed: 7 })`；0.16 m tile 有 4×4 交替水平／垂直黑莓。Opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變；不新增果實 geometry、透明果肉、植物生長或食物物理。

另支援 `musselshells`（淡菜貝殼），藍黑淚滴殼有窄鉸端、圓寬尾、實心凸冠與曲線細生長槽，區別扇貝放射肋、牡蠣層階與寶螺齒口。使用 `await ProceduralMaterial.create('musselshells', { seed: 7 })`；0.32 m tile 有 4×4 交替水平／垂直貝殼。Opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變；不新增貝殼 geometry、雙殼開合、透明殼或生物模擬。

另支援 `safetypins`（閉合金屬別針），鋼色圓線圈連接兩條凸圓針腳，較高實心護扣蓋住針尖並留淺凹縫。使用 `await ProceduralMaterial.create('safetypins', { seed: 7 })`；0.16 m tile 有 4×4 交替水平／垂直別針。Opaque metallic、factor／map 1 含低暗 backing，孔非透明；既有 maps／選用 height／ownership 不變，不新增別針 geometry、開合、彈簧物理或穿刺功能。

另支援 `poppyseedpods`（乾燥罌粟蒴果），封閉凸果身有縱肋、較低細梗，較高扁平八瓣柱頭盤留瓣間缺刻與凸起放射紋，區別蓮蓬多孔種室與豆蔻尖橢圓。使用 `await ProceduralMaterial.create('poppyseedpods', { seed: 7 })`；0.24 m tile 有 4×4 交替水平／垂直蒴果。Opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變；不新增蒴果 geometry、透明果皮、開裂、種子散播或植物模擬。

另支援 `leatherbookspines`（壓紋皮革書脊），棕色凸弧書背有四道彎曲凸帶、圓角空壓框飾與淺凹面。使用 `await ProceduralMaterial.create('leatherbookspines', { seed: 7 })`；0.32 m tile 有 8 本平行書脊、細孔與深書縫。Opaque dielectric、metallic 0，無文字／金屬 foil，既有 maps／選用 height／ownership 不變；不新增書本 geometry、文字排版、翻頁或裝訂物理。

另支援 `matchsticks`（木火柴），淺木方端棒身有直向木紋，暗紅粗塗頭較寬且凸高，木／頭 pigment、height、roughness 分開。使用 `await ProceduralMaterial.create('matchsticks', { seed: 7 })`；0.2 m tile 有 4×4 交替水平／垂直火柴。Opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變；不新增火柴 geometry、點火、燃燒、發光或化學模擬。

另支援 `porcelaininsulators`（瓷質絕緣子），乳白釉面側面有五層圓弧傘裙、較低連續細芯、圓帽與短柄。使用 `await ProceduralMaterial.create('porcelaininsulators', { seed: 7 })`；0.8 m tile 有 4×4 交替水平／垂直絕緣子。Opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變；不新增實際 geometry、金屬接頭、電場／漏電模擬或絕緣性能認證。

另支援 `dominoes`（骨牌），象牙白圓角牌面有標準黑色凹點與中央淺分隔槽。使用 `await ProceduralMaterial.create('dominoes', { seed: 7 })`；0.24 m tile 有 4×4 交替水平／垂直牌面，各半面獨立 seeded 0–6 點排列。Opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變；凹點保留實心底面而非 alpha 孔洞，不新增骨牌 geometry、遊戲規則或物理。

另支援 `woodenspoons`（木匙），橢圓凹碗有高起匙緣，連續細頸接上漸寬扁柄與縱向木纖維。使用 `await ProceduralMaterial.create('woodenspoons', { seed: 7 })`；0.4 m tile 有 4×4 交替水平／垂直木匙。Opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變；凹碗保留高於 backing 的實心底面，不新增匙 geometry、容積／流體或食品安全認證。

另支援 `chessrooks`（城堡棋子），象牙色側面有三齒冠、兩道向外開口、連續收腰柱身、上下 collars 與寬圓底座。使用 `await ProceduralMaterial.create('chessrooks', { seed: 7 })`；0.24 m tile 有 4×4 交替水平／垂直側面。Opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變；僅表面浮雕，不新增棋子 geometry、棋盤／棋規／棋力或物理。

另支援 `threadspools`（木軸紅線捲），暗紅捲線筒有較寬較高木端盤、連續木 core 與細密捲線起伏，線面比木面粗糙。使用 `await ProceduralMaterial.create('threadspools', { seed: 7 })`；0.24 m tile 有 4×4 交替水平／垂直線軸。Opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變；不新增線軸／紗線 geometry、解捲／張力或布料物理。

另支援 `bellpepperslices`（青甜椒橫切面），三瓣綠色果肉環包住低淡色胎座／三條膜、三空腔與六顆附著籽粒。使用 `await ProceduralMaterial.create('bellpepperslices', { seed: 7 })`；0.32 m tile 有 4×4 交替方向切面，空腔露出低 opaque backing 而非 alpha 孔洞。Dielectric、metallic 0，既有 maps／選用 height／ownership 不變；不新增 geometry、透明空腔或食物／生物／流體模擬。

另支援 `sharkteeth`（鯊齒），象牙色尖三角琺瑯冠有細鋸齒邊、較低粗糙雙葉齒根、連續 neck 與根部向外開口。使用 `await ProceduralMaterial.create('sharkteeth', { seed: 7 })`；0.24 m tile 有 4×4 交替水平／垂直牙齒。Opaque dielectric、metallic 0，既有 maps／選用 height／ownership 不變；不新增 geometry、物種／年代鑑定、牙科／生物模擬或物理。

另支援 `grinderburrs`（鋼研磨刃環），六道較高平滑彎刃包住較低粗槽、中央孔與三個安裝孔。使用 `await ProceduralMaterial.create('grinderburrs', { seed: 7 })`；0.4 m tile 有 4×4 seeded 轉向圓環，孔底為低 opaque 金屬 backing 而非 alpha。Metallic 1 含 backing，material factor／既有 maps／選用 height／ownership 同步；不新增研磨 geometry、切削／咖啡研磨模擬或物理。

另支援 `cowhide`（黑白斑短毛牛皮），不規則黑白色塊覆在連續短毛表面。使用 `await ProceduralMaterial.create('cowhide', { seed: 7 })`；一張 UV tile 對應 0.8 m。斑紋只代表 pigment，不是分離凸皮片或凹槽；opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增毛髮 geometry、梳理／布料／生物或動物模擬。

另支援 `spaltedwood`（分區線淺木），淺色縱向木紋有細而彎曲的深色分區線。使用 `await ProceduralMaterial.create('spaltedwood', { seed: 7 })`；一張 UV tile 對應 0.6 m。分區線只代表 pigment，不是凹裂縫／缺木；opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增 geometry、腐朽／真菌生長／生物模擬或結構安全判定。

另支援 `canlids`（金屬易拉罐蓋），圓蓋有沖壓補強凸環、細凹刻線、雙孔拉環與鉚釘。使用 `await ProceduralMaterial.create('canlids', { seed: 7 })`；一張 UV tile 對應 0.28 m。上層拉環兩孔露下方完整蓋面，不是透明洞；opaque metallic、metallic 1，maps／選用 height／ownership 不變，不新增 geometry、開罐／撕裂／變形或力學模擬。

另支援 `crinoidossicles`（海百合莖節化石），石灰質基質有淺圓盤、中央五瓣星狀沉積填充管腔與 20 道放射細脊。使用 `await ProceduralMaterial.create('crinoidossicles', { seed: 7 })`；一張 UV tile 對應 0.08 m。管腔是 opaque 填充凹處，不是通透孔；淺浮凸圓盤區別螺旋化石。Opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增 geometry、物種鑑定或古生物／生物模擬。

另支援 `pythagoreantiles`（畢氏雙尺寸方磚），邊長 2:1 的深大／淺小方磚交錯鋪滿平面，共用凹灰縫，不是四長磚包方塊的 windmillpavers。使用 `await ProceduralMaterial.create('pythagoreantiles', { seed: 7 })`；一張 UV tile 對應 0.4 m，各有五大／小方磚。Opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增 geometry、施工／結構或物理模擬。

另支援 `dinnerforks`（金屬餐叉），四根圓端漸細叉齒與三道背底開口接上寬叉頭、細頸及漸寬柄尾。使用 `await ProceduralMaterial.create('dinnerforks', { seed: 7 })`；一張 UV tile 對應 0.96 m。齒根接合不疊高、槽有 opaque backing；opaque metallic、metallic 1，maps／選用 height／ownership 不變，不新增餐具 geometry、通透孔洞、食物接觸／變形或物理模擬。

另支援 `goldbrocade`（金線花葉織錦），高金線花葉覆非金屬深底布，花內織隙仍露 dielectric cloth。使用 `await ProceduralMaterial.create('goldbrocade', { seed: 7 })`；一張 UV tile 對應 0.24 m。Material metallic factor 1 是保留 authored 金線／布 map 分區，不是整張布變金屬；opaque maps／選用 height／ownership 不變，不新增紗線 geometry、透洞、紡織／布料／光譜或物理模擬。

另支援 `mudtiretracks`（泥地雙輪胎痕），連續泥地兩道凹輪轍與弧形胎塊壓痕、兩側微凸泥緣。使用 `await ProceduralMaterial.create('mudtiretracks', { seed: 7 })`；一張 UV tile 對應 3 m，各轍 36 道壓痕。胎痕向下刻入泥面，不是橡膠凸塊；opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增 terrain geometry、車輪／碰撞／動態變形／車輛或物理模擬。

另支援 `peacockfeathers`（金綠眼斑孔雀羽毛），金外圈／綠內帶／偏心深 pupil 覆連續羽軸羽枝。使用 `await ProceduralMaterial.create('peacockfeathers', { seed: 7 })`；一張 UV tile 對應 0.64 m。眼斑只改 pigment，不是凹環槽或瞳孔洞；opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增羽毛 geometry、透洞、梳理／鳥類／生物或虹彩光學模擬。

另支援 `tangramtiles`（七巧板釉面瓷磚），三種大小的五片直角等腰三角形、一正方形、一平行四邊形及凹灰縫。使用 `await ProceduralMaterial.create('tangramtiles', { seed: 7 })`；一張 UV tile 對應 0.6 m、2×2 正方拼板，不是 righttriangletiles 的對角二分。Opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增磚塊 geometry、互動拼圖或物理模擬。

另支援 `batterypositivecaps`（圓柱電池正極端蓋），凸金屬接點、淡色非金屬絕緣環與金屬捲邊。使用 `await ProceduralMaterial.create('batterypositivecaps', { seed: 7 })`；一張 UV tile 對應 0.12 m、4×4 端蓋。Material metallic factor 1 保留 authored map 的金屬／絕緣分區，不是整片金屬；opaque 背底、maps／選用 height／ownership 不變，不新增電池 geometry、導電／電化學／電路或物理模擬。

另支援 `passionfruitslice`（黃百香果切面），淡色厚內皮圍填實果漿與深籽凸金果囊。使用 `await ProceduralMaterial.create('passionfruitslice', { seed: 7 })`；一張 UV tile 對應 0.32 m、4×4 果實。種子散佈中央而不是 kiwi 單環，深籽只改 pigment、不把果囊刻成洞；opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增果實 geometry、透明／SSS／透射、生物或物理模擬。

另支援 `screwterminalblocks`（塑殼螺絲端子台），非金屬塑殼、金屬十字槽螺絲、backed 接線口內較低金屬接片。使用 `await ProceduralMaterial.create('screwterminalblocks', { seed: 7 })`；一張 UV tile 對應 0.08 m、4×4 佈局。Material metallic factor 1 保留螺絲／接片 map，塑殼／孔底仍非金屬；十字槽為凹金屬而非漆十字或透洞。Opaque maps／選用 height／ownership 不變，不新增元件 geometry、通透孔洞、導電／電路／機構或物理模擬。

另支援 `dragonfruitflesh`（白肉火龍果果肉），連續淡白果肉中散佈細長黑籽。使用 `await ProceduralMaterial.create('dragonfruitflesh', { seed: 7 })`；一張 UV tile 對應 0.06 m 果肉，而非重複整顆果實；既有 dragonfruit 仍是果皮。嵌入黑籽只改 pigment／roughness、不改果肉 height 或鑿洞；opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增果實 geometry、透明／SSS／透射、生物或物理模擬。

另支援 `speakercones`（黑色揚聲器紙盆），凹紙盆／細放射紋、凸中央防塵蓋與較高橡膠懸邊。使用 `await ProceduralMaterial.create('speakercones', { seed: 7 })`；一張 UV tile 對應 0.64 m、4×4 紙盆。僅填實表面／normal map，不是空杯或金屬鑼環；opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增喇叭 geometry、通透孔洞、聲學／電機／振膜或物理模擬，也不改 Audio。

另支援 `septarianstone`（龜甲石），閉合角狀棕石間有填滿的乳金色方解石脈。使用 `await ProceduralMaterial.create('septarianstone', { seed: 7 })`；一張 UV tile 對應 0.48 m。較亮、較光滑的脈帶填滿連續石面，不是暗色開放裂縫；opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增岩石 geometry、透明晶體、礦物層或地質／物理模擬。

另支援 `axialresistors`（軸向電阻），圓頭凸絕緣本體、三道深色塗裝環及分開的一道淡環、兩端金屬引腳。使用 `await ProceduralMaterial.create('axialresistors', { seed: 7 })`；一張 UV tile 對應 0.12 m。本體與所有塗裝仍非金屬，metallic 僅限外露引腳；環帶不宣稱阻值編碼，也不增加凸起高度。Opaque mixed-metallic、預設 factor 1，maps／選用 height／ownership 不變，不新增元件 geometry、導電／電路／電熱或物理模擬。

另支援 `tomatoslices`（番茄切面），紅肉實心隔膜／中央胎座與五個填實膠質種室各含兩淡籽。使用 `await ProceduralMaterial.create('tomatoslices', { seed: 7 })`；一張 UV tile 對應 0.32 m、4×4 切面。膠室是填實表面而非甜椒空腔，微凸淡籽仍是 opaque dielectric；metallic 0，maps／選用 height／ownership 不變，不新增果實 geometry、透明／SSS／透射、生物或物理模擬。

另支援 `pinstripewool`（細直條羊毛布），深藍斜紋上的淡色直向經紗被深緯紗交織遮住，而非平塗跨過 crossing。使用 `await ProceduralMaterial.create('pinstripewool', { seed: 7 })`；一張 UV tile 對應 0.08 m。染色不壓凸直條；opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增紗線 geometry、透孔、毛髮／sheen BRDF、布料或物理模擬。

另支援 `chrysanthemumstone`（菊花石），黑拋光石內嵌淡色放射晶瓣與連通淡色中心。使用 `await ProceduralMaterial.create('chrysanthemumstone', { seed: 7 })`；一張 UV tile 對應 0.48 m。晶紋僅改 pigment／roughness，不雕凸花或凹坑；opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增岩石／晶體 geometry、透明／晶體折射、礦物鑑定／地質或物理模擬。

另支援 `sewingsnaps`（公母金屬暗釦），交替凸公柱／凹母座與四縫孔。使用 `await ProceduralMaterial.create('sewingsnaps', { seed: 7 })`；一張 UV tile 對應 0.12 m。縫孔／母孔有 opaque 非金屬孔底，不是通透孔；金屬盤／公柱／凹座 collar 仍 metallic 1。預設 factor 1，maps／選用 height／ownership 不變，不新增 geometry、縫線、扣合／彈簧或物理模擬。

另支援 `lathplaster`（木條灰泥牆），淡灰泥脫落露出較低水平木條與條間更深暗背底。使用 `await ProceduralMaterial.create('lathplaster', { seed: 7 })`；一張 UV tile 對應 0.8 m。三層仍為 opaque 表面／normal-map，不是通透牆洞或捲高漆邊；metallic 0，maps／選用 height／ownership 不變，不新增牆體 geometry、釘／縫線、破壞／結構或物理模擬。

另支援 `ceramiccapacitors`（徑向陶瓷電容），凸絕緣陶瓷圓片與同側雙金屬引腳，不同於軸向電阻兩端出腳。使用 `await ProceduralMaterial.create('ceramiccapacitors', { seed: 7 })`；一張 UV tile 對應 0.12 m。陶瓷覆根仍 dielectric，外露引腳保留 metal；opaque mixed-metallic、factor 1，maps／選用 height／ownership 不變，不新增電容量編碼、元件 geometry、導電／電路／電熱或物理模擬。

另支援 `fennelseeds`（茴香籽），彎曲尖梭籽皮有五條收斂凸縱肋，不是帶梗豆蔻莢。使用 `await ProceduralMaterial.create('fennelseeds', { seed: 7 })`；一張 UV tile 對應 0.096 m，seeded 旋轉／jitter／tone 有界於週期貼圖內。Opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增種子 geometry、重疊散佈、植物生長／營養／味道或物理模擬。

另支援 `ballbearingfaces`（開放式滾珠軸承端面），同心內外圈、凹連續滾道與八高凸鋼球。使用 `await ProceduralMaterial.create('ballbearingfaces', { seed: 7 })`；一張 UV tile 對應 0.16 m，中心孔仍 opaque 非金屬背底、非透明開口。Opaque mixed-metallic、factor 1，maps／選用 height／ownership 不變，不新增軸承 geometry、保持架、滾動／旋轉／潤滑／機械或物理模擬。

另支援 `baseballleather`（棒球白皮革），白細紋皮革、兩道彎曲低接縫與成對紅凸線，不同於橄欖球綁帶。使用 `await ProceduralMaterial.create('baseballleather', { seed: 7 })`；一張 UV tile 對應 0.24 m。Opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增球體／線材 geometry、完整球面裁片 UV、規格認證、縫製／布料／碰撞或物理模擬。

另支援 `toothbrushheads`（牙刷頭），低藍膠囊塑膠底上排列 3×6 十八束較高白刷毛冠面。使用 `await ProceduralMaterial.create('toothbrushheads', { seed: 7 })`；一張 UV tile 對應 0.12 m，粗冠束間仍是低光滑塑膠。Opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增刷頭／個別刷毛 geometry、刷柄、透明孔、彎曲／刷牙／清潔或物理模擬。

另支援 `bowtieinlay`（蝴蝶木榫補片），齊平深色 hourglass keys 橫跨暗彎裂縫，榫橫紋與板縱紋交錯。使用 `await ProceduralMaterial.create('bowtieinlay', { seed: 7 })`；一張 UV tile 對應 0.6 m。榫恢復裂線高度／AO、維持板微紋高度包絡，非凸片。Opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增 geometry、透明孔、實際結構補強／強度認證、斷裂／破壞或物理模擬。

另支援 `redcabbagecut`（紫甘藍切面），填實紫切面上有細蜿蜒淡脈、淡實芯與深外緣。使用 `await ProceduralMaterial.create('redcabbagecut', { seed: 7 })`；一張 UV tile 對應 0.48 m。淡脈／芯只改色與 roughness、不改填實高度／AO。Opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增葉 geometry、透明葉片、透射／subsurface 求解、植物生長／解剖認證或物理模擬。

另支援 `slottedturners`（金屬煎鏟頭），圓角鏟面三封閉長槽與同高短頸，非叉子開口齒。使用 `await ProceduralMaterial.create('slottedturners', { seed: 7 })`；一張 UV tile 對應 0.32 m。槽內仍是較低 opaque 非金屬背底，blade／neck 交會不疊高。Opaque mixed-metallic、factor 1，maps／選用 height／ownership 不變，不新增 geometry、完整長柄、透明槽、彎曲／翻炒／熱傳導或物理模擬。

另支援 `triglidesliders`（塑膠日字調節扣），無扣針雙封閉穿帶窗與齊平中桿。使用 `await ProceduralMaterial.create('triglidesliders', { seed: 7 })`；一張 UV tile 對應 0.16 m，窗內仍是低 opaque 背底、不透明孔，中桿與框同高。Opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增扣具／背帶 geometry、穿帶／滑動／摩擦／承重認證或物理模擬。

另支援 `popcorn`（爆米花），不規則淡白連接膨瓣、低焦金尖殼芯。使用 `await ProceduralMaterial.create('popcorn', { seed: 7 })`；一張 UV tile 對應 0.24 m，大小不同的重疊膨瓣共用厚度、不疊高，焦金殼芯低於白瓣。Opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增食物 geometry、透明孔、爆裂／烹煮／熱傳導、營養或物理模擬。

另支援 `dualinlinechips`（雙列直插 IC），黑封裝／十四低金屬腳與第一腳凹點。使用 `await ProceduralMaterial.create('dualinlinechips', { seed: 7 })`；一張 UV tile 對應 0.16 m，黑 dielectric 覆腳根、定位凹點仍是低實芯表面。Opaque mixed-metallic、factor 1，maps／選用 height／ownership 不變，不新增 geometry、透明孔、連線、電氣／邏輯／熱傳導／焊接或物理模擬。

另支援 `tortoiseshellacetate`（玳瑁紋醋酸纖維塑膠），琥珀拋光平面／不規則深褐斑。使用 `await ProceduralMaterial.create('tortoiseshellacetate', { seed: 7 })`；一張 UV tile 對應 0.2 m，顏料共用平滑表面、不凸甲片或挖深洞。Opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增 geometry、透明／透射／折射、化學製程、天然殼材或物理模擬。

另支援 `cathedralquilt`（教堂窗拼布），奶油色弧形高折邊包低藍布窗。使用 `await ProceduralMaterial.create('cathedralquilt', { seed: 7 })`；一張 UV tile 對應 0.6 m，藍窗仍是實布、不透明孔，折邊高於底布／布片。Opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增布料 geometry、折疊／縫製／布料力學或物理模擬。

另支援 `buckwheathulls`（蕎麥帶殼籽粒），旋轉三角褐籽、三圓滑面／細高稜。使用 `await ProceduralMaterial.create('buckwheathulls', { seed: 7 })`；一張 UV tile 對應 0.064 m，三 taper 稜共用一層籽殼、比鄰近面平滑。Opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增種子 geometry、透明孔、剝殼／生長／烹煮、營養或物理模擬。

另支援 `rutilatedquartz`（針狀金紅石石英），opaque 乳白拋光面與兩組交叉金褐針束。使用 `await ProceduralMaterial.create('rutilatedquartz', { seed: 7 })`；一張 UV tile 對應 0.2 m，礦物針仍是 dielectric pigment、不轉金屬線／高絲／AO 孔。Opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增 geometry、透明／透射／折射、晶內深度、多層體積散射、礦物生長或物理模擬。

另支援 `peppermintcanes`（薄荷拐杖糖），中性 opaque 底上紅白連續圓鉤／長軸短尾。使用 `await ProceduralMaterial.create('peppermintcanes', { seed: 7 })`；一張 UV tile 對應 0.32 m，紅白條紋只換 pigment、不刻分節凹槽，鉤內仍是 opaque 底。Opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增 geometry、透明孔、糖晶／溶化／烹煮、營養或物理模擬。

另支援 `rubbergrommets`（橡膠護線環），高內唇／低外法蘭／閉環凹槽。使用 `await ProceduralMaterial.create('rubbergrommets', { seed: 7 })`；一張 UV tile 對應 0.16 m，孔底是低 opaque 背底、不透明孔，整環非金屬橡膠。Opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增扣件／線材 geometry、彈性／密封／穿線／電氣絕緣認證或物理模擬。

另支援 `chioggiabeetcuts`（Chioggia 甜菜切片），六圈紅白交替平齊顏料環、白實芯、較低薄紅皮。使用 `await ProceduralMaterial.create('chioggiabeetcuts', { seed: 7 })`；一張 UV tile 對應 0.24 m。紅紋不成高低階梯或孔洞；opaque dielectric、metallic 0，neutral backing／maps／選用 height／ownership 不變，不新增 geometry、透明孔、汁液、切割／生長／營養或物理模擬。

另支援 `flatflexcables`（扁平軟排線），琥珀絕緣薄片／六條埋藏導線淺脊、單端六枚較低銀色露出接點。使用 `await ProceduralMaterial.create('flatflexcables', { seed: 7 })`；一張 UV tile 對應 0.24 m，只有露出接點是金屬，埋藏線／縫／對端皆非金屬。Opaque mixed-metal、預設 factor 1，neutral backing／maps／選用 height／ownership 不變，不新增 cable／connector geometry、透明膜、彎折／導電／耐熱認證或物理模擬。

另支援 `celerycuts`（芹菜橫切片），開口彎月形淺綠果肉、較低薄綠皮與五個暗色維管束凹點。使用 `await ProceduralMaterial.create('celerycuts', { seed: 7 })`；一張 UV tile 對應 0.24 m，開口接 opaque 背底、凹點仍實心。Opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增 geometry、透明孔、汁液、切割／生長／營養或物理模擬。

另支援 `tactileswitches`（四腳輕觸開關），銀色金屬蓋與較高黑色絕緣按柱。使用 `await ProceduralMaterial.create('tactileswitches', { seed: 7 })`；一張 UV tile 對應 0.24 m，只有露出腳／蓋是金屬、外殼／埋藏腳根／實芯按柱為 dielectric。Opaque mixed-metal、預設 factor 1，neutral backing／maps／選用 height／ownership 不變，不新增 geometry、按壓／導電／開關邏輯／耐久認證或物理模擬。

另支援 `paisleybrocade`（paisley 織錦），深藍布上彎尖金色紗線輪廓與三個凸起內點。使用 `await ProceduralMaterial.create('paisleybrocade', { seed: 7 })`；一張 UV tile 對應 0.4 m。金色紗仍非金屬、輪廓內仍實心低藍布；opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增 yarn geometry、透明孔或布料物理。

另支援 `siliconepastrybrushes`（矽膠烘焙刷），橘色一體長柄／寬頭／七分離刷齒。使用 `await ProceduralMaterial.create('siliconepastrybrushes', { seed: 7 })`；一張 UV tile 對應 0.32 m。齒間是 opaque 背底、柄端是 solid 凹點，不作透明孔；opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增 geometry、毛刷／液體／彎折物理、食品接觸／耐熱認證。

另支援 `graphicgranite`（文象花崗岩），粉色長石拋光面上尖細成對石英交生紋。使用 `await ProceduralMaterial.create('graphicgranite', { seed: 7 })`；一張 UV tile 對應 0.2 m，深紋只是平齊礦物顏料、不作凹刻文字或凸脈。Opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增 geometry、透明石英、晶體生長或物理模擬。

另支援 `brasspadlocks`（黃銅掛鎖），封閉 U 梁／高黃銅鎖身／低非金屬實芯孔紋。使用 `await ProceduralMaterial.create('brasspadlocks', { seed: 7 })`；一張 UV tile 對應 0.24 m，孔紋是暗 opaque recess、不作透明孔。Opaque mixed-metal、預設 factor 1，neutral backing／maps／選用 height／ownership 不變，不新增 geometry、開鎖／鎖定狀態／安全認證或物理模擬。

另支援 `carrotcuts`（胡蘿蔔切片），橙色平切面／淡實心髓心／12 尖細放射色紋／薄深皮。使用 `await ProceduralMaterial.create('carrotcuts', { seed: 7 })`；一張 UV tile 對應 0.24 m，淡芯與色紋只改平面顏料、不作透明孔或 citrus 分隔凹槽。Opaque dielectric、metallic 0，neutral backing／maps／選用 height／ownership 不變，不新增 geometry、透明髓心、汁液／切割／生長／營養或物理模擬。

另支援 `bluepushpins`（藍色塑膠圖釘），雙寬凸緣／細腰身／露出金屬尖針。使用 `await ProceduralMaterial.create('bluepushpins', { seed: 7 })`；一張 UV tile 對應 0.16 m，plastic 蓋針根且保持非金屬，只有露出的針 metal。Opaque mixed-metal、預設 factor 1，neutral backing／maps／選用 height／ownership 不變，不新增 geometry、穿刺／固定承重／透明度或物理模擬。

另支援 `oatflakes`（壓片燕麥），寬扁淡色薄片／低實心中央壓痕／六細縱向纖維。使用 `await ProceduralMaterial.create('oatflakes', { seed: 7 })`；一張 UV tile 對應 0.06 m，中央壓痕仍是低 opaque 實芯，不作裂口；不同於細長 rice 或稜紋 fennel seeds。Opaque dielectric、metallic 0，neutral backing／maps／選用 height／ownership 不變，不新增 geometry、透明裂縫、烹煮／營養或物理模擬。

另支援 `tigerfur`（虎斑毛皮），橙底／深色波紋帶／真正連根尖分枝。使用 `await ProceduralMaterial.create('tigerfur', { seed: 7 })`；一張 UV tile 對應 0.4 m，重用既有 directional pile、不將色紋刻入高度。Opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增毛髮 geometry、透明度、動物／毛髮／物理模擬。

另支援 `grosgrainribbons`（羅紋織帶），藍色密橫肋織帶、雙側各三道較高連續布邊縱紋。使用 `await ProceduralMaterial.create('grosgrainribbons', { seed: 7 })`；一張 UV tile 對應 0.06 m，帶間是 neutral opaque 背底、不作透明縫；非全面縱絨肋 corduroy 或扭曲紙帶。Opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增 geometry、打結／布料／物理模擬。

另支援 `azuritemalachite`（藍銅礦／孔雀石），綠基質上 stylized 深藍球簇與細礦物色帶。使用 `await ProceduralMaterial.create('azuritemalachite', { seed: 7 })`；一張 UV tile 對應 0.2 m，球簇／細環／基質共用同一拋光面、不作凸球或凹刻環。Opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增 geometry、透明晶體、礦物生長或物理模擬。

另支援 `openendspanners`（雙頭開口扳手），兩大小不同較高鉗口與細金屬連柄。使用 `await ProceduralMaterial.create('openendspanners', { seed: 7 })`；一張 UV tile 對應 0.4 m，開口仍顯露 neutral opaque dielectric 背底、不作透明孔。Opaque mixed-metal、預設 factor 1，maps／選用 height／ownership 不變，不新增 geometry、鎖固／扭矩／工具認證或物理模擬。

另支援 `lentilseeds`（小扁豆種子），近圓整粒凸面／靠邊短低 opaque 種臍。使用 `await ProceduralMaterial.create('lentilseeds', { seed: 7 })`；一張 UV tile 對應 0.04 m，種臍是有限短實心凹痕、不作長中央壓痕或種子裂口。Opaque dielectric、metallic 0，neutral backing／maps／選用 height／ownership 不變，不新增 geometry、透明裂口、發芽／烹煮／營養或物理模擬。

另支援 `blueprintpaper`（工程藍圖紙），深藍紙底／分級格線／白色圓角板框、圓孔、十字中心線與有限尺寸線短端刻線。使用 `await ProceduralMaterial.create('blueprintpaper', { seed: 7 })`；一張 UV tile 對應 0.4 m，印墨僅改 pigment、不改紙面 height／roughness／AO，非 graphpaper 純格紙。Opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增 geometry、CAD 解析／輸出、文字排版或文件認證。

另支援 `horsechestnutleaf`（風格化七葉樹複葉），七片尖端微鋸齒小葉，以細小葉柄接共同葉柄，凸中肋較亮。使用 `await ProceduralMaterial.create('horsechestnutleaf', { seed: 7 })`；一張 UV tile 對應 0.8 m，葉隙仍是 neutral opaque 背底，不作楓葉連續裂片或透明孔。Opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增 geometry、植物生長／生理或物理模擬。

另支援 `binderclips`（長尾夾），黑塗層梯形夾身／兩等寬銀色 U 線柄／較高下緣 lip。使用 `await ProceduralMaterial.create('binderclips', { seed: 7 })`；一張 UV tile 對應 0.32 m，露出線柄 metallic 1，黑塗層／柄孔隙／外背 neutral opaque metallic 0，預設 material factor 1。Maps／選用 height／ownership 不變，不新增 geometry、透明孔、夾持／彈簧／承重或物理模擬。

另支援 `charoite`（風格化紫龍晶），紫底扭曲細纖維束／淡寬帶／稀疏深色實心包裹體。使用 `await ProceduralMaterial.create('charoite', { seed: 7 })`；一張 UV tile 對應 0.2 m，色紋與包裹體共享僅 tiny grain 起伏的拋光面，不作深坑或刻槽。Opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增 geometry、透明礦洞、礦物生成、動態貓眼光學或物理模擬。

另支援 `chenilleyarn`（雪尼爾絨線），粉紅蓬鬆圓芯／密短橫凸亮絨束／雙側伸出鬆尖絨邊，非 corduroy 連續布面或 grosgrain 平帶。使用 `await ProceduralMaterial.create('chenilleyarn', { seed: 7 })`；一張 UV tile 對應 0.08 m，絨隙仍 neutral opaque 背底。Dielectric metallic 0，maps／選用 height／ownership 不變，不新增 geometry、透明絨隙、線材拓樸、布料／毛髮或物理模擬。

另支援 `ceramicfuses`（陶瓷管式保險絲），霧白凸圓陶瓷筒／雙同寬金屬端帽／較高凸環。使用 `await ProceduralMaterial.create('ceramicfuses', { seed: 7 })`；一張 UV tile 對應 0.16 m，端帽 metallic 1、陶瓷和外側 neutral opaque 背底 metallic 0、預設 material factor 1；無電阻細引腳或透明玻璃。Maps／選用 height／ownership 不變，不新增 geometry、電熱／熔斷模擬、額定值或安規認證。

另支援 `hazelnutshells`（整粒榛果殼），尖上圓下木殼／隨殼縱紋／低淺粗實心基疤，非核桃縱溝或杏仁孔紋片面。使用 `await ProceduralMaterial.create('hazelnutshells', { seed: 7 })`；一張 UV tile 對應 0.1 m，基疤仍是實心殼面、不開孔露果仁。Opaque dielectric、metallic 0，neutral backing／maps／選用 height／ownership 不變，不新增 geometry、透明開殼、果仁／烹煮／植物生長或物理模擬。

另支援 `yagasuricloth`（矢絣風箭羽紋織布），紫底奶油色三對尖羽／連續軸、相鄰直欄反向。使用 `await ProceduralMaterial.create('yagasuricloth', { seed: 7 })`；一張 UV tile 對應 0.24 m，pigment 不刻入或壓凸布面，height／roughness／AO 織紋穿過雙色，96 threads 在 default 256px 保留 normal 起伏。Opaque dielectric、metallic 0，maps／選用 height／ownership 不變，不新增 geometry、真實紡織／染色製程／文化工藝認證或 cloth physics。

另支援 `balloonwhisks`（氣球式打蛋器），三層橢圓金屬線圈／連續頸柄／四道較高 polished 握柄凸環。使用 `await ProceduralMaterial.create('balloonwhisks', { seed: 7 })`；一張 UV tile 對應 0.8 m，線圈與柄 metallic 1，線間與 neutral opaque 外背 metallic 0、預設 material factor 1；風格化投影 shading、非精確等寬線體 geometry 或透明開孔。沿 maps／選用 height／ownership，不新增攪拌／食物接觸認證或物理模擬。

另支援 `orthocerasstone`（直角石化石石材），尖長殼體切面／八道彎曲隔壁／深色拋光基質。使用 `await ProceduralMaterial.create('orthocerasstone', { seed: 7 })`；一張 UV tile 對應 0.4 m，pale mineral chambers／dark septa／matrix 保持同一 polished plane、不是浮起或刻入化石。Opaque dielectric、metallic 0／AO1／mortar0，沿 maps／選用 height／ownership，不新增 geometry、挖孔、古生物或石材來源認證／生長或物理模擬。

另支援 `rickracktrim`（波浪花邊織帶），六條八週期連續蛇行玫瑰色帶／雙側凸織邊／斜細織紋。使用 `await ProceduralMaterial.create('rickracktrim', { seed: 7 })`；一張 UV tile 對應 0.12 m，以 local tangent-corrected width 避免固定水平寬造成斜段縮窄，不稱 exact global curve distance。Opaque dielectric、metallic 0，neutral backing／maps／選用 height／ownership 不變，不新增 geometry、透明帶間空隙、真實編織或 cloth physics。

另支援 `toroidalinductors`（環形電感頂面），十二道較高 bare-copper projected turns／深色磁芯環。使用 `await ProceduralMaterial.create('toroidalinductors', { seed: 7 })`；一張 UV tile 對應 0.16 m，銅 metallic 1，磁芯／neutral opaque 中央孔和外背 metallic 0、預設 factor 1；風格化零件表面、非可運作電感或漆包線。沿 maps／選用 height／ownership，不新增 geometry、透明孔、引腳、電磁／電熱模擬、額定值或安全認證。

另支援 `pennerigate`（斜切筆管麵），直管斜端／五道凸縱肋／雙低暗粗實心管口陰影。使用 `await ProceduralMaterial.create('pennerigate', { seed: 7 })`；一張 UV tile 對應 0.16 m，管口仍是 opaque lower shading surface、非透明通孔或真實管腔，與 bent macaroni 不同。Opaque dielectric、metallic 0，neutral backing／maps／選用 height／ownership 不變，不新增 geometry、烹煮／食物或物理模擬。

另支援 `lepidolitemica`（鋰雲母風格石材），連續較粗淡紫基質上三階較高／亮／平滑六角解理薄片，非膨脹蛭石波浪 lamellae。使用 `await ProceduralMaterial.create('lepidolitemica', { seed: 7 })`；一張 UV tile 對應 0.2 m，僅風格化 seeded pattern、不認證真實礦物組成／晶體物理／iridescence。Opaque dielectric、metallic 0／mortar0，maps／選用 height／ownership 不變，不新增 geometry、透明／transmission、粒子或物理模擬。

另支援 `brassjinglebells`（黃銅鈴鐺頂面），凸黃銅殼／環形壓邊／四圓端低暗實心十字槽。使用 `await ProceduralMaterial.create('brassjinglebells', { seed: 7 })`；一張 UV tile 對應0.16 m，黃銅 metallic1、低槽與 neutral opaque 外背 metallic0、預設 factor1。僅 stylized top-face shading、非可發聲鈴鐺或透明孔，沿 maps／選用 height／ownership；不新增 geometry、內珠、吊耳、敲擊／音效、聲學或物理模擬。

另支援 `nutmeghalves`（肉豆蔻切面），低粗深外皮圍淺棕近平果仁、同平面扭曲深紋僅pigment，不改height／roughness／AO。使用 `await ProceduralMaterial.create('nutmeghalves', { seed: 7 })`；一張UV tile對應0.12 m。Opaque dielectric、metallic0，neutral backing／maps／選用height／ownership不變；僅風格化切面shading，不新增geometry、透明／transmission、食物／植物／烹煮或物理模擬。

另支援 `coaxialcablecuts`（同軸電纜切面），同平面銀色中央導體／淡色介電層／四十isolated屏蔽線截面／黑外皮。使用 `await ProceduralMaterial.create('coaxialcablecuts', { seed: 7 })`；一張UVtile對應0.12 m，導體／屏蔽metallic1，介電層／外皮／neutral opaque外背metallic0、預設factor1，切面不做component domes。沿maps／選用height／ownership，不新增geometry、透明／transmission、真線束／接頭、電／EM／RF模擬、額定值或安全認證。

另支援 `shippocloth`（七寶紋風布），深藍連續96-thread織面上奶油交疊完整圓環印花。使用 `await ProceduralMaterial.create('shippocloth', { seed: 7 })`；一張UVtile對應0.24 m。Ink只改pigment、height／roughness／AO仍由weave獨立控制，預設256兩色區都有雙軸normal細節。Opaque dielectric、metallic0／mortar0，沿maps／選用height／ownership；非凸繡線或半圓tile，不新增geometry、透明孔、線纖維／布料／物理模擬。

另支援 `driedtamarindpods`（乾羅望子莢），四個粉粗棕殼鼓包／三個真正縮窄較低收腰／短果梗，非連續尖莢內部凸點。使用 `await ProceduralMaterial.create('driedtamarindpods', { seed: 7 })`；一張 UV tile 對應 0.32 m。Opaque dielectric、metallic 0，neutral backing／maps／選用 height／ownership 不變；僅風格化乾殼 shading，不新增 geometry、透明孔、剝殼／內果肉／種子、植物／食物／烹煮或物理模擬。

另支援 `conicalsampletubes`（封蓋錐底樣品管表面），藍管身漸縮錐底／高平滑閉蓋／低單側連蓋帶／粗糙霧面橢圓標籤。使用 `await ProceduralMaterial.create('conicalsampletubes', { seed: 7 })`；一張 UV tile 對應 0.24 m，label 同步 color／height／roughness，非圖片 decal 或透明窗。Opaque dielectric、metallic 0，沿 neutral backing／maps／選用 height／ownership；不新增 geometry、透明／transmission、真管腔／液體／容積／開蓋／離心模擬或醫療／無菌／額定／安全認證。

另支援 `botryoidalcopper`（葡萄狀天然銅風表面），高亮平滑正圓丘在低暗粗金屬谷上，非下凹錘痕。使用 `await ProceduralMaterial.create('botryoidalcopper', { seed: 7 })`；一張UVtile對應0.16 m，整面含valleys metallic1／mortar0、預設factor1，無dielectric backing。沿maps／選用height／ownership；僅風格化seeded nodules、不認證真礦樣，不新增geometry、粒子／晶體成長／冶金／化學或物理模擬。

另支援 `pencilshavings`（鉛筆削花），半環木扇／12 道放射皺褶／深色較平滑外緣漆層，非六角鉛筆截面。使用 `await ProceduralMaterial.create('pencilshavings', { seed: 7 })`；一張 UV tile 對應 0.16 m，paint 僅 color／roughness、保留同一皺褶 height／AO。Opaque dielectric、metallic 0，沿 neutral backing／maps／選用 height／ownership；內部與半開口非透明。不新增 geometry、粒子／真木屑或彎曲／削鉛筆／損壞／物理模擬。

另支援 `papayacuts`（木瓜切面），厚高橙果肉／低長橢圓種腔／28 顆凸黑種子。使用 `await ProceduralMaterial.create('papayacuts', { seed: 7 })`；一張 UV tile 對應 0.16 m，高度 flesh>seed>pit，kernel 同步 height／roughness／AO、非黑點。Opaque dielectric、metallic 0，沿 neutral backing／maps／選用 height／ownership，種腔非透明孔。僅風格化 bounded seed layout，不新增 geometry、透明／transmission、液體／成長／切割／腐敗／物理模擬。

另支援 `sewingthimbles`（銀色頂針表面），封圓頂／上窄下寬／24 低暗粗盲凹點／較高平滑更寬下捲邊。使用 `await ProceduralMaterial.create('sewingthimbles', { seed: 7 })`；一張 UV tile 對應 0.16 m，body／rim／blind dimples metallic 1、預設 factor 1／完整 body mortar 0、neutral dielectric backing，盲凹點非透明打孔。沿 maps／選用 height／ownership；僅 front-face shading，不新增 geometry、真內腔、縫紉／穿刺／碰撞／變形／物理模擬或防護額定。

另支援 `boullebrassinlay`（布爾風黃銅捲草鑲嵌），共面黃銅 S 捲紋／橢圓端飾、拋光仿玳瑁 synthetic resin 雲斑。使用 `await ProceduralMaterial.create('boullebrassinlay', { seed: 7 })`；一張 UV tile 對應 0.24 m，brass M1、resin/curl voids M0、預設 factor 1／整面 mortar 0。共用 height／AO，近乎平坦 normal 與白 AO 是預期、非 raised gold badge／凹刻；沿 maps／選用 height／ownership。僅 Boulle-inspired synthetic material，不新增 geometry、真玳瑁、透明／transmission、體積／製作／修復／物理模擬。

另支援 `diamondpanelparquet`（四斜接框菱形拼木），四mitered框板／clipped斜向菱形板／交替隨板向木紋／低暗連續木縫。使用 `await ProceduralMaterial.create('diamondpanelparquet', { seed: 7 })`；一張UV tile對應0.8 m，M0／含木縫全mortar 0，非neutral grout或透明縫；maps／選用height／ownership不變。不認證歷史拼木layout，不新增geometry、真板／位移、地板碰撞／鋪設／變形／物理模擬。

另支援 `dendriticfrost`（樹枝狀霜晶），六相連主枝／24個60°側枝高亮粗霜、smooth dark-blue opaque face，非印刷雪花。使用 `await ProceduralMaterial.create('dendriticfrost', { seed: 7 })`；一張UV tile對應0.12 m，ice同步height／roughness／color，M0／全mortar 0，maps／選用height／ownership不變。不新增geometry、透明／transmission、晶體成長／天氣／積雪／融化／物理模擬。

另支援 `bullionknots`（長形纏線繡結），dark-blue woven cloth上16 seeded rotated長形金黃yarn、十二凸橫纏線／低連續yarn valley／closed rounded ends。使用 `await ProceduralMaterial.create('bullionknots', { seed: 7 })`；一張UV tile對應0.12 m，height／roughness／color／AO皆有起伏，非printed stripes／round French knots；金黃是dielectric顏料非metal，M0／含cloth全mortar 0，maps／選用height／ownership不變。不新增geometry、真helical yarn topology、布料透明洞或針／線／布料／縫製／物理模擬。

另支援 `orecchiette`（耳形麵），16 seeded rotated golden semolina cupped faces、完整高rolledrim／低暗粗偏心opaque bowl，非ravioli凸餡或透明洞。使用 `await ProceduralMaterial.create('orecchiette', { seed: 7 })`；一張UV tile對應0.16 m，height／color／roughness／AO同呈杯狀，M0／dough mortar 0／外backing mortar 1，maps／選用height／ownership不變。僅stylized surface，不新增geometry、真麵形／位移／厚度／洞、烹煮／吸水／變形／食品／物理模擬。

另支援 `solderlessbreadboard`（免焊麵包板表面），白opaqueplastic、16rows×左右各5方形盲凹孔／完整白橋／低連續centraltrough。使用 `await ProceduralMaterial.create('solderlessbreadboard', { seed: 7 })`；0.04064 m tile對應2.54 mm孔pitch／7.62 mm內列中心距，M0／含正height opaquefloors全mortar 0，非alpha洞／露出metalcontact。Maps／選用height／ownership不變。僅signalface surface，不新增geometry、真洞／hiddenmetalcontacts／電源軌／標號／接線、電路／電氣／插拔／物理模擬。

另支援 `kyaniteblades`（藍晶石風解理板束），16 seeded rotated三平行高藍blade／長短階差斜端／每板三凸縱striae，在低暗粗matrix上。使用 `await ProceduralMaterial.create('kyaniteblades', { seed: 7 })`；一UV tile對應0.16 m，striae同height／color／roughness／AO起伏，非pigment條紋；M0／含matrix全mortar 0，maps／選用height／ownership不變。僅stylized surface，不認證礦物鑑定／結晶學或真anisotropic optics，不新增geometry、透明／transmission、晶體成長／解理斷裂／物理模擬。

另支援 `internaltoothwashers`（內齒止動墊圈），closed銀色outerrim／十二內向M1齒、6高6低實際bend、opaque starrecess，非單裂口或外鋸齒。使用 `await ProceduralMaterial.create('internaltoothwashers', { seed: 7 })`；一UV tile對應0.16 m，outerband仍closedflat，交替齒height/AO不同但pigment/roughness同；factor 1／ring/teeth M1／opaque recess與exterior backing M0，maps／選用height／ownership不變。不新增geometry、真透明洞或彈簧／預緊／防鬆／變形／機械／物理模擬。

另支援 `driedchillies`（乾辣椒），16 seeded rotated彎曲漸細redfruits／實際低暗粗皺褶／高olivegreen calyx與相連細stem。使用 `await ProceduralMaterial.create('driedchillies', { seed: 7 })`；一UV tile對應0.16 m，wrinkle valleys同height／color／roughness／AO起伏，非paint條紋；M0／fruit-stem-calyx mortar 0／exterior backing mortar 1，maps／選用height／ownership不變。不新增geometry、植物成長／乾燥／食品／烹調／物理模擬。

另支援 `utilityknifeblades`（梯形美工刀片），16 seeded rotated銀色trapezoid／兩spine indexingnotches／下方連續較低平滑亮honededge，非silverpaint。使用 `await ProceduralMaterial.create('utilityknifeblades', { seed: 7 })`；一UV tile對應0.24 m，edge同height／roughness／color／AO變化，factor 1／blade及edge M1／notches與opaquebacking M0，maps／選用height／ownership不變。不新增geometry、真洞／利刃或切割／磨刀／磨耗／工具／物理模擬。

另支援 `windmillparquet`（五板風車拼木），中央木方板外四根長板，各板木紋隨長軸旋轉，接縫較低、暗、粗且仍為木質。使用 `await ProceduralMaterial.create('windmillparquet', { seed: 7 })`；一 UV tile 對應 0.8 m。重用 windmillpavers owner 佈局，但換成隨板木紋與全木縫，長板跨內部單位格線仍完整。全 M0／mortar0，沿用四圖、選用 height 與 ownership；僅表面，不新增 geometry、施工或物理模擬。

另支援 `bismuthhoppers`（六層方階鉍風晶面），16 金紫色 seeded rotated 方形晶面，六層封閉金屬階向中央降低、變暗、變粗並加深 AO，中央露低平不透明 backing，非僅色帶。使用 `await ProceduralMaterial.create('bismuthhoppers', { seed: 7 })`；一 UV tile 對應 0.16 m，factor1／六階面 M1／中央及外部 M0。沿用四圖、選用 height 與 ownership；僅表面，不新增 geometry、真洞、實際 iridescence／薄膜光學、晶體生長或物理模擬。

另支援 `splitvanillapods`（剖開香草莢），九個棕色彎曲長莢，兩條連續高皮緣與封閉兩端圍住低暗粗不透明中槽，每莢十六個較槽底高、暗、粗、但低於皮緣的籽團。使用 `await ProceduralMaterial.create('splitvanillapods', { seed: 7 })`；一 UV tile 對應0.6 m，全 M0，沿用四圖、選用 height 與 ownership。籽團是 stylized 群聚而非單顆真籽比例；僅表面，不新增 geometry、真裂口、種子物件、乾燥／食物或物理模擬。

另支援 `seamrippers`（藍護球拆線器），九個不對稱鋼叉，長彎漸細刃與較短藍護球刃之間露 backing U 槽，接深藍非金屬握柄。使用 `await ProceduralMaterial.create('seamrippers', { seed: 7 })`；一 UV tile 對應0.6 m，factor1／鋼 M1／塑膠護球與握柄 M0，height／roughness 同時區分，非僅塗色。沿用四圖、選用 height 與 ownership；僅表面，不新增 geometry、真利刃／切口、拆線／縫紉／工具或物理模擬。

另支援 `flakedarrowheads`（剝痕有莖石鏃），三角燧石風點接窄莖，雙側開缺口、中央高稜兩側前方 facets 各五個低暗粗斜剝痕。使用 `await ProceduralMaterial.create('flakedarrowheads', { seed: 7 })`；一 UV tile 對應0.4 m，全 M0，剝痕同變 height／roughness／color／AO，側缺口露不透明 backing。沿用四圖、選用 height 與 ownership；僅 stylized 表面，不新增 geometry、真利刃／洞、打製／飛行／命中／武器或物理模擬，也不宣稱考古真實性。

另支援 `dandelionseeds`（冠毛蒲公英種子），九個 stylized 種子各有十六細乳白冠毛、連續低淡褐梗與高棕籽。使用 `await ProceduralMaterial.create('dandelionseeds', { seed: 7 })`；一 UV tile 對應0.09 m，height／roughness／color／AO 區分冠毛、梗、籽，輻間露不透明 backing，全 M0，沿用四圖、選用 height 與 ownership。僅 stylized 表面，不新增 geometry、透明纖維／洞、植物生長、風／種子飄飛或物理模擬，也不認證微觀纖維／植物真實性。

另支援 `shojipaperlattice`（不透明障子風紙木格），六乘六連續高棕木桟圍低白纖維紙，木紋隨桟旋轉，交點沿水平紋理但不疊高。使用 `await ProceduralMaterial.create('shojipaperlattice', { seed: 7 })`；一 tile 對應0.9 m。木較高暗平滑、紙較低亮粗糙，全 M0／mortar0，非開洞或灰 grout。沿用四圖／height／Worker／cache／tint／cleanup，不新增透光、透明紙、散射或 geometry。

另支援 `nyloncableties`（尼龍束帶），一個較寬有開口的高圓角鎖頭接連續窄帶、十七高暗平滑橫向棘齒與漸細尾。使用 `await ProceduralMaterial.create('nyloncableties', { seed: 7 })`；一 tile 對應0.6 m，全 M0，鎖頭比帶與齒高、開口露低 opaque backing。沿用四圖／height／Worker／cache／tint／cleanup；不新增透明洞、geometry 或真實鎖緊／承載物理。

另支援 `weavingshuttles`（舟形織梭），縱紋尖舟木框內有十二高乳白繞紗與兩端露出的低金屬軸，兩側留 opaque backing 空隙。使用 `await ProceduralMaterial.create('weavingshuttles', { seed: 7 })`；一 tile 對應0.6 m，木框最高、線筒次之、軸較低。公開 factor1 保留僅露軸 M1、木／紗／底 M0；沿用四圖／height／Worker／cache／tint／cleanup，不新增透明洞、geometry 或真實織造／張力物理。

另支援 `tailorstapes`（無數字裁縫尺帶），四條連續乳白織布帶，雙側各100個黑刻度，十格一組八短、一中、一長，中央無印。使用 `await ProceduralMaterial.create('tailorstapes', { seed: 7 })`；一 tile 對應0.1 m，墨較暗平滑且保留織紋細起伏，全 M0、不透明，沿用四圖／height／Worker／cache／tint／cleanup。不新增數字、量測 API、實際校準、布料物理或 geometry。

另支援 `woodenclothespins`（木衣夾），兩片連續縱紋木夾片、前後展寬中縫及三高金屬繞圈，夾片較低粗糙、金屬較亮平滑，縫與圈間露 opaque backing。使用 `await ProceduralMaterial.create('woodenclothespins', { seed: 7 })`；一 tile 對應0.6 m，公開 factor1 保留僅 wire M1、wood/backing M0。沿用四圖／height／Worker／cache／tint／cleanup；不新增透明洞、geometry、實際鉗合／彈簧物理或產品認證。

另支援 `cinnamonbarkcoils`（開放肉桂樹皮捲），三圈半連續高螺旋、低暗粗外皮與中央／圈間真低空隙。使用 `await ProceduralMaterial.create('cinnamonbarkcoils', { seed: 7 })`；一 tile 對應0.09 m，全 M0，空隙露 opaque backing，非透明洞或 pastry 填餡。沿用四圖／height／Worker／cache／tint／cleanup，不新增 geometry、捲曲／食品物理或植物真實性認證。

另支援 `compactcassettefaces`（卡式錄音帶端面），黑圓角殼、雙低中空六輻捲盤、高空白乳白紙標籤、三下方開口與孔內低磁帶。使用 `await ProceduralMaterial.create('compactcassettefaces', { seed: 7 })`；一 tile 對應0.45 m，全 M0，開口露 opaque backing。沿用四圖／height／Worker／cache／tint／cleanup；標籤刻意不印字，不新增文字／字型 API、透明、geometry、錄放音或音訊功能。

另支援 `kintsugiceramic`（金繼陶瓷），十六深青釉陶片與共面連續金色填縫及平滑三叉修補接點。使用 `await ProceduralMaterial.create('kintsugiceramic', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 查看；陶片 M0、金縫 core M1、factor1。兩相共用填平 micro-height／AO0.99，不是假空裂縫或凸金線。0.32 m tile／0.0003 m relief，Worker／cache／tint／height／ownership 不變；不新增破裂／修補模擬或 geometry。

另支援 `pleatedfilterpapers`（三十二褶濾紙），奶油紙平底接向外升高三十二徑褶環壁及同相波形紙緣。使用 `await ProceduralMaterial.create('pleatedfilterpapers', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 查看；crest／valley 同步改 height／color／roughness／AO，全 M0，外緣缺口露低 opaque backing 非透明。0.36 m tile／0.004 m relief，Worker／cache／tint／height／ownership 不變；不新增杯體 geometry、微孔／滲透率認證或過濾模擬。

另支援 `splitcedarshakes`（錯位開裂木瓦），四層半錯位各六片暖棕變寬縱紋木瓦、較厚毛緣下端與每片兩道貫通下端的圓頭裂隙。使用 `await ProceduralMaterial.create('splitcedarshakes', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 查看；全木 M0，裂縫及 gutter 為低 opaque backing 非透明。2 m tile／0.008 m relief，Worker／cache／tint／height／ownership 不變，不新增 damage／weathering、geometry 或工法認證。

另支援 `swavepavers`（S 形混凝土磚），四層半錯位各八塊顆粒混凝土磚，S 側縫真改 height／roughness／AO／mortar coverage 而非只改石色。使用 `await ProceduralMaterial.create('swavepavers', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 查看；全石 M0、縫為低 opaque neutral grout。0.96 m tile／0.006 m relief，Worker／cache／tint／height／ownership 不變，不新增 geometry、剛體互鎖或施工／車流模擬。

另支援 `mushroomslices`（蘑菇切片），乳白菌蓋、較低暗粗棕外皮、十二附著低暗菌褶及連續纖維柄。使用 `await ProceduralMaterial.create('mushroomslices', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 查看；全 M0，褶間為低 opaque backing 非透明洞。0.18 m tile／0.004 m relief，Worker／cache／tint／height／ownership 不變，不新增 geometry、真菌生長或物種／可食性認證。

另支援 `insulatedringlugs`（絕緣環端子），連續中空銀環頸接較高紅絕緣套與兩道低非金屬壓痕。使用 `await ProceduralMaterial.create('insulatedringlugs', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 查看；銀片 M1／紅套及壓痕 M0／factor1。孔與外隙為低 opaque backing 非透明。0.18 m tile／0.004 m relief，Worker／cache／tint／height／ownership 不變，不新增 geometry、電路／壓接模擬或絕緣安全／電壓認證。

另支援 `bananaslices`（香蕉切片），奶油橢圓果肉、低而粗淡外緣、三道連續低 Y 隔膜與六成對暗種胚。使用 `await ProceduralMaterial.create('bananaslices', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 查看；rim／partition／seed 分別改 height／color／roughness／AO，全相 M0，外部低 opaque backing。0.12 m tile／0.004 m relief，Worker／cache／tint／height／ownership 不變，不新增 geometry、熟成／生長或食品認證。

另支援 `rosemarysprigs`（迷迭香枝葉），連續淡低莖、十六片高暗粗狹斜針葉與更高亮滑中肋，對葉間有開隙。使用 `await ProceduralMaterial.create('rosemarysprigs', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 查看，全相 M0、外部低 opaque backing。0.18 m tile／0.004 m relief，Worker／cache／tint／height／ownership 不變，不新增 geometry、生長、植物學或草藥／食品認證。

另支援 `pencilsharpeners`（金屬削鉛筆器），真圓孔低殼、八低握槽、高磨刃與更高一字槽螺釘；實心與凹槽全M1，孔及外隙才是低opaque M0 backing。使用 `await ProceduralMaterial.create('pencilsharpeners', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 查看。0.15 m tile／0.004 m relief，Worker／cache／tint／height／ownership 不變，不新增 geometry、削切力學、精密五金尺寸或安全認證。

另支援 `scissors`（張開紅柄剪刀），雙真橢圓孔紅柄、連續銀頸、雙斜尖磨刃與高圓銀樞；紅柄M0、銀刃頸樞M1、孔與外部低opaque M0 backing。使用 `await ProceduralMaterial.create('scissors', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 查看。0.25 m tile／0.004 m relief，Worker／cache／tint／height／ownership不變，不新增geometry、活動鉸鏈、剪切力學或安全認證。

另支援 `serpentinesprings`（蛇形彈簧線），六直段、五交替真半圓 U 彎與雙圓自由端連成一條銀線，圓冠wire core M1／full-body mortar0，隙低opaque M0。使用 `await ProceduralMaterial.create('serpentinesprings', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 查看。0.2 m tile／0.004 m relief，Worker／cache／tint／height／ownership不變，不新增geometry、螺旋圈構造、彈性／力學或安全認證。

另支援 `impellerfaces`（六後掠尖葉輪），六後掠尖銀葉、六開扇隙、高圓環hub與真中心孔；連續core M1／孔與扇隙低opaque M0，blade向外升且磨刃低暗粗、仍低於hub。使用 `await ProceduralMaterial.create('impellerfaces', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 查看。0.3 m tile／0.004 m relief，Worker／cache／tint／height／ownership不變，不新增geometry、旋轉、流體／空力或安全認證。

另支援 `chipresistors`（白103黑chip resistor），高黑矩體、雙低銀wrap端與白非金屬103；0字腔為高opaque黑body，不是穿孔／低backing。使用 `await ProceduralMaterial.create('chipresistors', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 查看。白ink／黑body皆M0、銀端M1，ink薄高粗。0.12 m tile／0.004 m relief，Worker／cache／tint／height／ownership不變；標記僅外觀，不認證實測阻值、電路模擬、精密元件或電氣／安全。

另支援 `memorycardbacks`（八金接點記憶卡背面），八低金接點／七高opaque黑絕緣隙／真削角／右側key notch。使用 `await ProceduralMaterial.create('memorycardbacks', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 查看。金pad M1，高黑body/gaps M0，cut才露低opaque M0 backing。0.15 m tile／0.004 m relief，Worker／cache／tint／height／ownership不變；無品牌logo，不新增儲存存取、電路、精密尺寸、SD規範或資安／電氣／安全認證。

另支援 `gnocchi`（七彎叉槽撒粉奶油橢枕），圓冠與七真正彎曲低叉槽，槽低暗粗且AO較低但不挖孔；全dough M0／mortar0，flour只改色粗非粒子。使用 `await ProceduralMaterial.create('gnocchi', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 查看。0.12 m tile／0.004 m relief，Worker／cache／tint／height／ownership不變，不新增geometry、烹煮／生長模擬或食品／安全認證。

另支援 `rectangularsocketfaces`（四銀接點矩形插座），閉銀框環繞真正低開口、高opaque黑舌及四更高銀pins；銀框／pins M1，黑舌與三絕緣隙高M0／mortar0而非孔，低cavity/backing M0。使用 `await ProceduralMaterial.create('rectangularsocketfaces', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 查看。0.09 m tile／0.004 m relief，Worker／cache／tint／height／ownership不變，不新增port geometry、電氣I/O、精密尺寸、USB或電氣／安全認證。

另支援 `saffronthreads`（同根三彎紅絲擴圓尖藏紅花），同一完整root三曲線red threads／三擴圓尖／兩真低叉隙；root與curved full cores維持高opaque M0／mortar0，叉隙與舊直線chord控制皆低backing，actual512保留擴尖及rounded crowns。使用 `await ProceduralMaterial.create('saffronthreads', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 查看。0.06 m tile／0.004 m relief，Worker／cache／tint／height／ownership不變，不新增flower geometry、生長／烹煮模擬或食品／安全認證。

另支援 `fishhooks`（真眼環連續銀J倒鉤），closed eye連直柄／下半圓J彎／上尖／內倒尖；full銀core M1／mortar0，眼孔／向上開放中腔／倒鉤outward mirror維持低M0 backing，最後bore subtraction包含shank避免填眼孔。使用 `await ProceduralMaterial.create('fishhooks', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 查看。0.15 m tile／0.004 m relief，Worker／cache／tint／height／ownership不變，僅opaque backing上靜態外觀，不新增鉤體geometry、釣魚physics、強度或安全認證。

另支援 `violinfholes`（鏡對三次曲線f孔暖木紋），每低S孔連端圓眼／兩側缺刻；curve、端眼與nick低深棕腔，舊straight-axis控制及中央木帶高而完整，兩者皆M0／mortar0，world-periodic木紋跨pose cells無seam。使用 `await ProceduralMaterial.create('violinfholes', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 查看。0.45 m tile／0.004 m relief，Worker／cache／tint／height／ownership不變，僅opaque backing上靜態外觀，不新增violin／穿孔geometry、音源合成、聲學模擬或樂器認證。

另支援 `palmiers`（心形雙焦糖螺旋蝴蝶酥），雙真低焦糖coils／中央摺痕／凹雙冠／下尖；coils低暗滑且AO低，same-radius opposite-angle crumb controls高完整，驗真spiral非環；摺痕低暗粗，full body M0／mortar0非孔。使用 `await ProceduralMaterial.create('palmiers', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 查看。0.18 m tile／0.004 m relief，Worker／cache／tint／height／ownership不變，不新增pastry geometry、烘焙／生長模擬或食品／安全認證。

另支援 `barbedwire`（雙線真交替高低四尖倒刺鐵絲），seamless rounded silver wires／真交替over-under高度／高collars／每knot四連尖barbs；交點僅top wire高度不雙加，collar高於barb、barb高於uncovered cross，full metal M1／mortar0而interwire／interbarb gaps低opaque M0。使用 `await ProceduralMaterial.create('barbedwire', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 查看。0.4 m tile／0.004 m relief，Worker／cache／tint／height／ownership不變，不新增fence geometry、mechanics或負載／強度／電氣／安全認證。

另支援 `oxfordweave`（牛津紡）：成對藍色經紗／淺色緯紗交替隆起，紗隙露出較低的另一方向紗線。使用 `await ProceduralMaterial.create('oxfordweave', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 選取查看。Opaque dielectric、metallic 0，0.08 m tile／0.001 m relief；tint、repeats、Worker／cache與呼叫者destroy契約不變。僅為表面shading，不新增紗線geometry、透明孔洞或布料模擬。

另支援 `lacewood`（蕾絲木紋）：暖色直木紋上的大小不規則、微彎淺色長木射線斑。使用 `await ProceduralMaterial.create('lacewood', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 選取查看。Opaque dielectric、metallic 0，0.35 m tile／0.001 m relief；射線是更平滑的pigment而非凸鱗，tint、repeats、Worker／cache與呼叫者destroy契約不變。不新增geometry、displacement或anisotropic shader。

另支援 `papyrus`（莎草紙）：淺色直向寬草條壓覆橫向下層、長纖維與暖色不透明紙底。使用 `await ProceduralMaterial.create('papyrus', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 選取查看。Opaque dielectric、metallic 0，0.3 m tile／0.0015 m relief；tint、repeats、Worker／cache與呼叫者destroy契約不變。僅為層壓表面shading，不新增交替織紋、geometry、透明孔洞或造紙模擬。

另支援 `larimar`（拉利瑪石）：相融合藍色礦物雲塊、乳白間隙與淺色微彎纖維，共用拋光不透明表面。使用 `await ProceduralMaterial.create('larimar', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 選取查看。Metallic 0，0.25 m tile／0.001 m relief；tint、repeats、Worker／cache與呼叫者destroy契約不變。不新增晶體geometry、透明度、SSS或anisotropic shader。

另支援 `paperbark`（紙皮樹皮）：帶不規則撕邊的淡色薄片、真正抬高的下捲唇、下方暗縫與露出的纖維底皮。使用 `await ProceduralMaterial.create('paperbark', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 選取查看。全opaque M0／mortar0、0.4 m tile／0.002 m relief；tint、repeats、Worker／cache與呼叫者destroy契約不變。不新增樹皮geometry、displacement或剝落模擬。

另支援 `horseshoes`（金屬馬蹄鐵）：連續U形鐵件、六個低釘孔、開口跟部與低於兩側邊緣的fuller槽。使用 `await ProceduralMaterial.create('horseshoes', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 選取查看。公開metallic factor1；maps保留鐵件M1與低孔／開口opaque M0底面，mortar0。0.6 m tile／0.01 m relief，tint、repeats、Worker／cache及呼叫者destroy契約不變，不新增geometry、透明孔洞、碰撞或馬匹模擬。

另支援 `durianpeel`（榴槤果皮）：olive連續底皮、錯列六面漸尖刺坡、圓化脊線與柔化尖端。使用 `await ProceduralMaterial.create('durianpeel', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 選取查看。全opaque M0／mortar0，0.24 m tile／0.012 m relief；tint、repeats、Worker／cache及呼叫者destroy契約不變。僅為normal／height表面細節，不新增突刺geometry、輪廓displacement、孔洞或果實模擬。

另支援 `flystitch`（飛針繡）：深色細織布上的淺色Y形V雙臂與短固定莖，接點不疊雙倍／三倍線高。使用 `await ProceduralMaterial.create('flystitch', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 選取查看。全opaque M0／mortar0，0.12 m tile／0.0012 m relief；tint、repeats、Worker／cache與呼叫者destroy契約不變。不新增線geometry、透明孔洞、針線或布料模擬。

另支援 `abaloneshells`（鮑魚殼內面）：低中心與高殼緣、靜態淺色生長帶、單側五個低呼吸孔，另一側與孔間橋維持完整。使用 `await ProceduralMaterial.create('abaloneshells', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 選取查看。全opaque M0／mortar0，0.45 m tile／0.006 m relief；tint、repeats、Worker／cache及呼叫者destroy契約不變。不新增geometry、透明孔洞、view-dependent虹彩／thin-film shader、透光或貝類模擬。

另支援 `gyroidinfill`（gyroid截面填充紋）：seeded平移的`z=π/4`截面橘色圓頂曲帶，保留較低opaque底面。使用 `await ProceduralMaterial.create('gyroidinfill', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 選取查看。全M0／mortar0，0.16 m tile／0.0015 m relief；tint、repeats、Worker／cache與呼叫者destroy契約不變。此為implicit-field貼圖，不是固定線寬toolpath、3D lattice／mesh生成器、geometry輸出、透明孔洞或列印模擬。

另支援 `cloisonne`（六瓣掐絲琺瑯）：較高閉合黃銅六瓣花框與中心環，包圍較低青藍琺瑯。使用 `await ProceduralMaterial.create('cloisonne', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 選取查看。factor1保留map區分金屬黃銅與非金屬琺瑯，全opaque／mortar0，0.18 m tile／0.001 m relief；tint、repeats、Worker／cache及呼叫者destroy契約不變。不新增geometry、透明玻璃、transmission、thin-film shader或燒製模擬。

另支援 `rambutanskin`（紅毛丹果皮）：紅色連續低果皮上，較高根瘤長出彎曲漸尖金黃果毛。使用 `await ProceduralMaterial.create('rambutanskin', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 選取查看。全opaque M0／mortar0，0.12 m tile／0.0035 m relief；tint、repeats、Worker／cache及呼叫者destroy契約不變。僅surface shading，不新增hair geometry、displacement、透明縫、SSS或生長／果實模擬。

另支援 `rackgears`（七齒直齒條）：銀色七梯形齒連完整齒根、雙低安裝孔及低縱加工槽。使用 `await ProceduralMaterial.create('rackgears', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 選取查看。factor1保留金屬齒條與非金屬低底孔的區分，全opaque／mortar0，0.6 m tile／0.007 m relief；tint、repeats、Worker／cache及呼叫者destroy契約不變。不新增geometry、透明孔、齒輪嚙合、精密involute模型或機械模擬。

另支援 `poplin`（細經粗緯府綢）：玫瑰色棉紗、較細密經紗與較寬橫向緯肋，單紗一上一下的真height lift。使用 `await ProceduralMaterial.create('poplin', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 選取查看。全opaque M0／mortar0，0.016 m tile／0.0003 m relief；tint、repeats、Worker／cache及呼叫者destroy契約不變。不新增紗線geometry、透明織孔、cloth physics或anisotropy shader。

另支援 `ooliticlimestone`（磨面鮞粒石灰岩）：淡暖石灰基質、同心皮殼鮞粒與較暗核。使用 `await ProceduralMaterial.create('ooliticlimestone', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 選取查看。皮殼／核只是pigment，不是凸珠或凹洞；AO1、整面微高差≤0.24 μm。全opaque M0／mortar0，0.024 m tile／0.00012 m relief；tint、repeats、Worker／cache及呼叫者destroy契約不變。不新增geometry、displacement、透光或地質生長模擬。

另支援 `ogeetiles`（對稱S曲燈籠磚）：交錯青綠釉面、兩側閉合S曲線、上下尖端與連續低灰縫。使用 `await ProceduralMaterial.create('ogeetiles', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 選取查看。釉面真高；field-based縫不宣稱固定Euclidean縫寬。全opaque M0，0.72 m tile／0.004 m relief；tint保留fullgrout中性，repeats、Worker／cache及呼叫者destroy契約不變。不新增geometry、displacement、透明縫、施工或釉面光學模擬。

另支援 `bittermelonskin`（縱肋圓疣苦瓜表皮）：平緩warp的完整綠縱肋、不規則圓疣與相連低溝。使用 `await ProceduralMaterial.create('bittermelonskin', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 選取查看。疣／肋／溝三級真height，非榴槤尖刺或哈密瓜網紋；全opaque M0／mortar0，0.18 m tile／0.0045 m relief。Tint、repeats、Worker／cache及呼叫者destroy契約不變，不新增果實geometry、displacement、透明孔、SSS或生長模擬。

另支援 `cocobolo`（橙紅深紋心材）：磨面橙紅底、寬深流紋與交錯細暗紋。使用 `await ProceduralMaterial.create('cocobolo', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 選取查看。木紋是pigment，不做凸肋或凹裂；微高差≤0.32 μm、AO1。全opaque M0／mortar0，0.24 m tile／0.00016 m relief；tint、repeats、Worker／cache及呼叫者destroy契約不變。不新增geometry、displacement、SSS、anisotropy shader或木材生長模擬。

另支援 `doubleedgerazorblades`（雙刃三圓連槽刀片）：銀色雙刃、四角低缺口、連成完整低槽的三圓瓣與兩條真低、更亮更平滑的長研磨面。使用 `await ProceduralMaterial.create('doubleedgerazorblades', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 選取查看。Factor1保留鋼面M1與低底槽M0，全opaque／mortar0、0.18 m tile／0.0003 m relief；tint、repeats、Worker／cache及呼叫者destroy契約不變。不新增geometry、透明孔、切割、碰撞或機械模擬。

另支援 `chiastolite`（深十字空晶石）：褐色晶體磨面、四個暖象限與由中心連接且向外漸寬的深色石墨質十字臂。使用 `await ProceduralMaterial.create('chiastolite', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 選取查看。晶體／包裹體是共同切面pigment，不做凸塊或刻溝；微高差≤0.24 μm、AO1。全opaque M0／mortar0，0.12 m tile／0.00012 m relief；tint、repeats、Worker／cache及呼叫者destroy契約不變。不新增geometry、displacement、透光或礦物生長模擬。

另支援 `dimity`（成對高經肋細平紋棉布）：象牙棉紗、六對高經肋，每八經紗兩粗cord加六細紗。使用 `await ProceduralMaterial.create('dimity', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 選取查看。單紗仍一上一下，連續緯紗越兩cord平滑抬高，是真height肋不是印直條；全opaque M0／mortar0、0.02 m tile／0.0003 m relief。Tint、repeats、Worker／cache及呼叫者destroy契約不變，不新增紗線geometry、透明織孔、cloth physics或anisotropy shader。

另支援 `juniperberries`（藍灰果霜杜松果）：圓果頂、三條低放射鱗縫與凹中央scar。使用 `await ProceduralMaterial.create('juniperberries', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 選取查看。安靜果面真高於三縫，非只畫深線；全opaque M0／mortar0、0.064 m tile／0.006 m relief。Tint、repeats、Worker／cache與呼叫者destroy契約不變，不新增果實geometry、透明果肉、SSS或生長模擬。

另支援 `gabbro`（粗晶輝長岩）：深色粗晶、淡斜長石晶粒與細平行光學雙晶帶。使用 `await ProceduralMaterial.create('gabbro', { size: 512, seed: 7, heightMap: true })`，於 `/examples/pbr3d/?renderer=webgpu`／`?renderer=webgl2` 選取查看。晶界與雙晶是共同磨面pigment，非深縫；物理微高差≤0.24 μm／AO1。Optional height沿用range正規化，byte不是物理高度。全opaque M0／mortar0、0.18 m tile／0.00012 m relief；tint、repeats、Worker／cache與呼叫者destroy契約不變，不新增晶體geometry、displacement、透光或地質模擬。

`turnbuckles`（雙眼螺紋花籃螺栓）新增九枚seeded旋轉鋼件：閉合中央長框、真低框心、兩側連接螺桿與閉合眼環，孔洞維持opaque非金屬暗底而非透明。雙側鏡像細螺紋具有較低高度、較暗色與較高粗糙度；金屬mask乘factor1。0.24 m tile／0.003 m relief、mortar0；沿用height、tint、repeats、Worker／cache與ownership，不新增幾何、穿孔、displacement或機械模擬。 使用 `await ProceduralMaterial.create('turnbuckles', { size: 512, seed: 7, heightMap: true })`，在PBR目錄選取。

`rhodochrosite`（菱錳礦）加入粉紅基質、六組寬白波狀層帶與細伴生帶，非瑪瑙閉合環。3×3與9×3 cached noise扭曲連續六週期相位，compact squared寬／細肩部保持C1；12² pigment與128² grain分離色澤及磨面。層帶只改pigment／roughness，共同磨面微高差≤0.24 μm、AO1，全opaque M0／mortar0、0.18 m tile／0.00012 m relief。沿用height、tint、repeats、Worker／cache及ownership，不新增晶體geometry、displacement、透光或地質模擬。 使用 `await ProceduralMaterial.create('rhodochrosite', { size: 512, seed: 7, heightMap: true })`，於PBR目錄選取。

`bayleaf`（月桂葉）加入九枚seeded旋轉的橄欖綠尖橢圓平滑葉片、短葉柄、高中脈、七對向葉尖彎曲的側脈與細邊緣脈。沿用compact葉片／葉柄coverage；軸線fade消除abs側脈座標的尖點，平方輪廓與smooth肩部維持C1。四值pose、七個root與128² grain在setup快取，grain物理微高差≤6.4 μm，低於側脈40 μm，避免微粒遮蔽葉脈。全opaque M0／mortar0、0.24 m tile／0.0016 m relief，沿用height、tint、repeats、Worker／cache與ownership；不新增葉片geometry、透明cutout、SSS或植物模擬。 使用 `await ProceduralMaterial.create('bayleaf', { size: 512, seed: 7, heightMap: true })`，於PBR目錄選取。

`gabardine`（軋別丁）新增卡其色密經二上一下經面陡斜紋。沿用poplin compact yarn coverage／crossing lift／fiber路徑，但48經×24緯的三格draft逐緯移一經，斜向pitch約63.4°，非1×1平紋或2×2等距斜紋。經radius／core0.495／0.44、緯0.25／0.18，密經遮住大部分底；經緯共同base0.34／crown0.04、±0.1 lift在owner切換前平滑歸零。192／96-frequency fibers與128² grain沿用快取，無逐點配置或trig。全opaque M0／mortar0、0.018 m tile／0.0003 m relief；height、tint、repeats、Worker／cache與ownership不變，不新增紗線geometry、透明孔洞或布料模擬。 使用 `await ProceduralMaterial.create('gabardine', { size: 512, seed: 7, heightMap: true })`，於PBR目錄選取。

`oilspotglaze`（油滴黑釉）加入黑褐亮釉上的64枚seeded橢圓鐵氧化物晶斑、褐色內部、較亮環緣與細晶pigment。七值pose快取cos／sin、雙offset、雙逆半徑平方與tone；最大radius0.34加jitter0.1<0.5，compact斑面與rim smooth肩部在owner前C1歸零，無逐點配置／hash／trig／sqrt。128² grain供共同釉面微高差≤0.24 μm，64² crystal只供色澤，AO1；亮褐斑仍是介電釉下色而非金屬環。全opaque M0／mortar0、0.16 m tile／0.00012 m relief，沿用height、tint、repeats、Worker／cache與ownership；不新增晶體geometry、displacement、透光或窯燒模擬。 使用 `await ProceduralMaterial.create('oilspotglaze', { size: 512, seed: 7, heightMap: true })`，於PBR目錄選取。

`persimmonslice`（柿子切面）新增九枚seeded旋轉橙色圓切面、八向分離深籽、淡色中心與細深色外皮。沿用水果flush cut契約：籽／果肉／皮共平面、grain微高差≤8 μm，籽僅改色與粗糙度，不假冒凹孔。四值pose、八組axis、128² grain及inverse squared常數在setup快取；radius0.38加jitter0.025<0.5，圓面／皮／pith／ellipse種籽compact smooth肩部C1，逐點無配置／hash／trig／sqrt。全opaque M0／mortar0、0.24 m tile／0.002 m relief；height、tint、repeats、Worker／cache與ownership不變，不新增水果geometry、透明果肉、SSS或生長模擬。 使用 `await ProceduralMaterial.create('persimmonslice', { size: 512, seed: 7, heightMap: true })`，於PBR目錄選取。

`kitkattiles`（細長凹面釉磚）新增24欄×4列直疊玉綠finger tiles，6:1 pitch、沿長向真正低凹槽與等UV寬灰縫，非凸木條或一般平地鐵磚。沿用subwaytiles四邊compact smooth face／mortar，橫向平方smooth凹槽在兩端fade，中心比肩部低0.48 mm；grain微高差≤6 μm。96個owner tone與128² grain快取，逐點無配置／hash／trig／sqrt。全opaque M0、mortar=1-face，0.6 m tile／0.003 m relief；沿用height、tint、repeats、Worker／cache與ownership，不新增geometry、displacement、透明或鋪磚模擬。 使用 `await ProceduralMaterial.create('kitkattiles', { size: 512, seed: 7, heightMap: true })`，於PBR目錄選取。

`brakediscs`（雙圈鑽孔煞車碟）新增九枚seeded旋轉銀色碟面、中央低孔、五個安裝孔、兩圈各12個錯半步通風孔、較高中轂與細同心磨耗紋。孔與碟外維持opaque M0暗底，鋼面mask乘factor1。沿用bearing squared annular face與compact hole肩部；兩值pose、29孔三值座標與128² grain在setup快取，逐點無配置／hash／trig／sqrt。磨耗用r²週期compact帶，無中心奇點，僅4 μm低紋，不以粗槽冒充研磨。mortar0、0.72 m tile／0.004 m relief，height、tint、repeats、Worker／cache及ownership不變；不新增幾何、透明穿孔、displacement或煞車物理。 使用 `await ProceduralMaterial.create('brakediscs', { size: 512, seed: 7, heightMap: true })`，於PBR目錄選取。

`mulberrypaper`（手工桑皮紙）新增暖米色雲狀紙漿、192條任意旋轉長彎韌皮纖維與少量棕色內含物，非編織條帶或折紙。沿用紙材compact additive neighborhood概念，以明／暗兩個complement union避免交叉纖維無界堆高；8×8格每格三纖維各八值快取，3×3固定lookup、無逐點配置／hash／trig／sqrt。最長half-length0.9、曲偏≤0.04、寬≤0.03，support<0.942；省略格最近1.15，owner切換前C1消失。兩端envelope²與側cap²平滑漸尖，fiber lift≤7 μm、總微高差≤13.6 μm／AO1。全opaque M0／mortar0、0.16 m tile／0.0002 m relief；height、tint、repeats、Worker／cache與ownership不變，不新增纖維geometry、透明紙、SSS或造紙模擬。 使用 `await ProceduralMaterial.create('mulberrypaper', { size: 512, seed: 7, heightMap: true })`，於PBR目錄選取。

`howlite`（白松石）新增象牙白礦塊與細灰色不規則網狀基質脈。12×12抖動site各兩值快取，雙4²週期warp扭曲礦塊；3×3 compact radial八次權重的normalized overlap產生網脈，不使用最近site切換或把色脈挖成溝槽。support1.2小於省略格最近1.3，權重C1消失且全域覆蓋避免除零；無逐點配置／hash／trig／sqrt。共磨平面高度僅有≤0.2 μm微粒、AO1，灰脈只調色與roughness。0.24 m tile／0.0001 m relief、全opaque M0／mortar0；不新增geometry、透明裂縫、displacement或礦物模擬，沿用options／Worker／cache／ownership。

`ottoman`（成對粗緯橫肋織物）新增細經紗束縛成對粗緯pick的紫色橫向凸肋與低肋間隙。沿用poplin／gabardine的compact yarn coverage、漸消lift與纖維路徑；48經／24緯，連續兩緯共用draft、下一對反轉，相鄰經交替。每對緯中心向內偏0.1 pitch，對內距0.8／對間1.2；weft support0.38與lift half0.36均小於owner邊界最近0.4，保持C1。0.18 lift使交叉處上紗確實高於下紗；較高粗緯base／crown形成橫肋。0.024 m tile／0.0004 m relief、全opaque M0／mortar0；不新增geometry、透明紗隙、各向異性或布料模擬，沿用options／Worker／cache／ownership。

`shackles`（U形弓橫銷卸扣）新增九枚seeded旋轉銀色卸扣：圓管U形弓、兩個加大端boss、單一較高橫銷與帶小孔扁銷頭。沿用隔離hardware pose快取與compact union／normalized height，避免連接處重疊厚度加倍；上半圓與兩直腿以連續最近曲線距離銜接，每點一個必要hypot，無逐點配置／hash／trig。所有支撐連同jitter位於tile owner內；圓弓、boss、橫銷、銷頭與孔皆C1。中央與銷頭小孔為opaque M0暗底、metal面mask乘factor1、mortar0；0.6 m tile／0.004 m relief。未新增geometry、透明孔、displacement、螺紋操作或承載物理，沿用options／Worker／cache／ownership。

`watercaltrops`（雙彎角菱角果殼）新增九枚seeded旋轉黑褐色圓殼、兩條對稱上彎漸尖角、細縱皺與低果柄疤。沿用rambutanskin compact曲線漸尖support與isolated pose快取，改為連接果殼的成對粗角；smooth彎曲中心線、有限tip width及根／尖端C1 fade，bounded union／normalized relief避免根部堆高。保守support半徑<0.465，連同jitter仍小於0.5；無逐點配置／hash／trig／sqrt。0.24 m tile／0.003 m relief、全opaque M0／mortar0，沿用height／tint／repeats／Worker／cache／ownership；不新增geometry、透明背景、displacement或植物生長模擬。

`fluorite`（紫色方形色帶螢石）新增九枚seeded旋轉紫色晶面、嵌套近方形生長色帶與淡色礦物基質；不是圓環瑪瑙或raised方磚。沿用隔離晶體pose與共磨礦面路徑，每晶六值快取；八次多項式等高線避免max-axis尖角導數跳躍，4週期polynomial色帶在phase wrap C1。最大half-extent0.335、支撐半徑<0.435連同jitter仍小於0.5；無逐點配置／hash／trig／sqrt。色帶只調色／roughness，共磨平面微粒高差≤0.2 μm、AO1、opaque M0／mortar0；0.06 m tile／0.0001 m relief，沿用options／Worker／cache／ownership。不新增geometry、透明／折射、螢光、displacement或晶體生長模擬。

`wenge`（細長開放導管孔Wenge木）新增深褐直紋、淡色縱向薄壁組織帶與192個細長低導管孔；不是換色木紋或凸起布肋。沿用compact木材孔／cached縱向noise路徑，24×8孔各四值快取，孔半寬0.035–0.055、半長0.15–0.35皆於owner內C1漸消；三份noise快取、無逐點配置／hash／trig／sqrt。導管孔實際低32 μm、較粗糙與較低AO，淡色條帶只改顏色而不堆高；微粒高差≤1.2 μm。0.12 m tile／0.0004 m relief、全opaque M0／mortar0，沿用options／height／tint／repeats／Worker／cache／ownership；不新增geometry、透明孔、displacement、各向異性或木材生長模擬。

`parchment`（乳白書寫用皮紙）新增雲狀乳白底色、細縱向刮製色紋與256個任意旋轉的淺殘留毛孔，不是粗顆粒皮革或紙漿纖維。沿用compact elliptical pore／cached noise路徑，16×16毛孔各六值快取，最大support0.08小於最近owner邊界0.2；無逐點配置／hash／trig／sqrt。刮痕只調色、不刻深槽；毛孔低2.4 μm，平滑皮面雲狀高差≤3 μm加微粒≤0.4 μm，AO≥0.96。0.04 m tile／0.0002 m relief、全opaque M0／mortar0；沿用options／height／tint／repeats／Worker／cache／ownership，不新增geometry、透明／透光、displacement、文字或皮紙製程模擬。

`cavalrytwill`（雙道陡斜肋騎兵斜紋）新增橄欖綠粗／細成對陡斜肋。沿用poplin／gabardine／ottoman的compact yarn coverage、lift與纖維路徑，72經／36緯形成約63.4°斜向；六步draft以經面110100呈現二道不等寬wale，逐row前進一經，不把它當成歷史織法認證。經／緯radius0.495／0.25、core0.44／0.18，lift在owner邊界前C1消失；無逐點配置／hash／trig／sqrt。0.024 m tile／0.0003 m relief、全opaque M0／mortar0；沿用options／height／tint／repeats／Worker／cache／ownership，不新增geometry、透明紗隙、各向異性或布料模擬。

`screwhooks`（開口螺絲鉤）新增九枚銀色開口環鉤與相連漸尖螺紋桿。沿用環帶及螺紋相位的compact C1 masks，開口、環心與背景均為不透明非金屬凹面，鋼面metallic factor1；約0.00016 UV高度螺紋槽同步降低亮度／AO並提高roughness。尖端以正距離因式分解寬度，避免端點浮點消去造成除零；normalized overlap不雙加高度。0.36 m參考tile／0.004 UV relief；無逐點配置／hash／trig／sqrt，不新增geometry、透明孔洞、螺紋接合或物理模擬，沿用options／Worker／cache／ownership。

`nigellaseeds`（黑種草籽）新增25枚任意旋轉、細長帶三側稜角的炭黑種籽，非蕎麥殼高肋或圓形種籽。沿用三C1半平面乘積，aspect0.9／1.15、外接support≤0.368加jitter0.015小於owner0.5；每籽五值快取，128²grain與256²pore fields。細凹表皮低0.0009375 UV高度（按0.024 m參考tile換算22.5μm，非實際位移量測），同步變暗／降低AO／提高roughness；不在邊界堆高粒子。全opaque M0／mortar0、0.024 m參考tile／0.0375 UV relief，沿用options／Worker／cache／ownership，無逐點配置／hash／trig／sqrt；不新增geometry、透明孔或生物模擬。

`phyllite`（灰綠千枚岩）新增48道細密波狀片理與緞面雲母色斑，不是板岩階梯或片麻岩寬色帶。4²warp／128²grain及mica fields快取，C1 compact週期脊無逐點配置／hash／trig／sqrt；雲母只調色及降低roughness，不額外堆高或改metallic。0.18 m參考tile／0.018 UV relief，片理脊高差0.00117 UV（只按參考尺度換算約210.6μm，非位移量測）。全opaque M0／mortar0，沿用options／Worker／cache／ownership，不新增geometry、displacement、各向異性、干涉色或地質模擬。

`shantung`（粗節平紋山東綢）新增暖象牙色64經／32緯1/1平紋與96段不規則緯向粗節。沿用poplin／gabardine／ottoman／cavalrytwill的compact yarn及lift路徑；每緯三段各快取中心、平方逆半長、強度。粗節C1漸厚變寬，緯radius由0.22最多至0.37、core0.15至0.28，低於owner0.5；經線覆蓋時不讓粗節穿透，lift在owner前漸消。0.024 m參考tile／0.018 UV relief；全opaque M0／mortar0，無逐點配置／hash／trig／sqrt，沿用options／Worker／cache／ownership，不新增geometry、透明紗隙、各向異性或織物模擬。

`hempcrete`（多孔礦物膠結麻屑）新增淺色多孔膠結底與144枚嵌入棕色纖維麻屑，非OSB覆片。每屑七值快取，x⁸+y⁴ compact圓角長片與128²grain／96²pore fields；最大support約0.391加jitter0.03小於owner0.5，無逐點配置／hash／trig／sqrt。麻屑面維持近乎平切，不堆高且不讓底材孔洞鑽穿；底孔深度最多0.0036 UV。0.24 m參考tile／0.015 UV relief（底孔只按參考尺度換算最多0.864 mm，非位移量測），全opaque M0／mortar0，沿用options／Worker／cache／ownership；不新增geometry、透明孔、物理或材料強度／隔熱認證。

`utilityblades`（雙背槽梯形單刃刀片）新增九枚銀色梯形刀片，上背兩個開放安裝槽、僅較長下緣磨薄變亮且降低roughness，非雙刃刮鬍刀。四個C1線性半平面與雙compact槽mask，每片五值快取；support約0.404加jitter0.008小於owner0.5，無逐點配置／hash／trig／sqrt。鋼面metallic factor1，背槽與背景為opaque M0凹面、mortar0。0.24 m參考tile／0.004 UV relief；磨刃高度差0.00052 UV（只按參考尺度換算124.8μm，非位移量測）。沿用options／Worker／cache／ownership，不新增geometry、透明切口、切割或機械模擬。

`chrysocolla`（藍綠結核簇矽孔雀石）新增36簇、共108個相接圓結核，立於深綠礦物底，不是金屬葡萄狀銅或研磨色帶。每簇八值快取與128²grain／64²pigment fields；三個compact C1圓面以normalized dome平均保留鞍部，交疊不疊加高度。support最多0.38加jitter0.025小於owner0.5；無逐點配置／hash／trig／sqrt。0.12 m參考tile／0.012 UV relief，全opaque M0／mortar0；沿用options／Worker／cache／ownership，不新增geometry、displacement、透光、金屬光學或化學／地質模擬。

`sichuanpepperhusks`（裂口空腔花椒果皮）新增49枚紅褐粗糙空果皮，以C1平方距離環壁、連續不規則皺摺輪廓與向外開口保留凹腔，對側附著痕更低、更暗且更粗糙；不是整粒胡椒或透明洞。六值姿態快取／128² grain／40² wrinkle fields，support最多0.385加jitter0.03小於owner0.5，無逐點配置／hash／trig／sqrt。0.05 m參考tile／0.015 UV relief，pore depth0.000825 UV與scar depth0.0024 UV（按參考尺度換算41.25μm與120μm，非實際位移量測）；全opaque M0／mortar0。沿用options／Worker／cache／ownership，不新增geometry、透明切口、植物生長或化學模擬。

`huckaback`（五挑浮經平紋毛巾布）新增40×40經緯、10×10 draft與32組斜向交替的成對五挑浮經（共64條長浮經），不以waffle凹格或逐挑珠狀凸點代替。重用正式cloth sampler；此preset仍建立600個Float64值／4800 bytes的完整同draft-run offset／平方half／inverse shoulder快取，長浮線跨內部owner維持連續、在run ends以C1退回平紋，目前Lyocell與Hopsack各以96值共用相同whole-run profile builder，其餘既有cloth family成員仍不建立whole-run profile buffer。128² grain與160×160纖維週期，無逐點配置／hash／trig／sqrt。0.032 m參考tile／0.022 UV relief，單側lift0.00308 UV（按參考尺度換算98.56μm，非位移或實機量測）；全opaque M0／mortar0。沿用options／Worker／cache／ownership，不新增紗線geometry、pile loops、透光、吸水或各向異性光學模擬。

`anorthosite`（淺色雙晶斜長岩）新增以白灰斜長石晶粒為主、稀疏深色副晶粒與晶粒內平行雙晶albedo條紋的拋光切面；重用正式gabbro晶粒sampler，非深色基質輝長岩或凸起礦物拼片。100個site各六值快取／128² grain；3×3鄰域的radius1.2 compact-support權重以16次方正規化，own-site平方距離最多0.98維持正權重，省略site最近1.3不會截斷支撐。無逐點配置／hash／trig／sqrt。0.2 m參考tile／0.004 UV relief，micrograin高度跨度最多0.000008 UV（按參考尺度換算1.6μm，非位移或實機量測），雙晶與晶界共用平切面。全opaque M0／AO1／mortar0，沿用options／Worker／cache／ownership，不新增geometry、透光、Schiller／雙折射光學、地質或礦物比例認證。

`cubebberries`（Cubeb有梗胡椒果）新增64枚深褐皺紋果身與相連細木質果梗，非無梗胡椒或分離浮梗；C1橢圓果身覆蓋capsule果梗根部，以有界coverage保留單層neck高度；果身完全覆蓋時由果身決定，不相加或平均兩個完整高度。每果六值姿態快取／128² grain／64² wrinkle fields，各軸support最多0.468×0.98加jitter0.025＝0.48364小於owner0.5，無逐點配置／hash／trig／sqrt。0.08 m參考tile／0.04 UV relief，wrinkle height0.0022 UV／pore depth0.0012 UV（按參考尺度換算176μm／96μm，非位移或實機量測）；果皮較果梗粗糙，全opaque M0／mortar0。沿用options／Worker／cache／ownership，不新增geometry、透光、植物或化學模擬。

`seraphinite` 提供深綠基質與銀白彎曲羽狀礦紋的程序化拋光切面：16組不同方向、長寬與頻率的羽狀束，以3×3週期鄰域重疊合成，不在owner邊界裁斷成葉片貼紙；每組九值快取共144個Float64／1152 bytes，8² matrix／12² warp／128² grain fields，無逐點配置／hash／trig／sqrt。借用既有羽脈axis fade與礦物鄰域模式，C1軸向淡出移除abs距離的尖點；平方距離細脈在phase wrap前歸零，最長support1.1小於省略site最近距離1.3。0.16 m參考tile／0.006 UV relief，切面micrograin高度跨度最多0.000012 UV（按參考尺度換算1.92μm，非位移或實機量測）；礦紋只改albedo，不將羽狀束做成凸起葉片。全opaque M0／AO1／mortar0；沿用options／Worker／cache／ownership，不新增geometry、透光、chatoyancy／Schiller或各向異性光學模擬。

`hexsocketheads` 提供25個種子旋轉的鋼質圓形螺栓頭與六角平底盲凹穴；重用既有圓頭支撐與六角半平面模式，三對half-plane C1 profiles相乘保留六個平面、伸出的六個角與平滑倒角，不以max距離引入角部摺痕。每頭五值姿態快取共125個Float64／1000 bytes，128² grain field與初始化時計算的固定六角常數；無逐點配置／hash／trig／sqrt。圓頭support0.38加jitter0.025為0.405，小於owner半寬0.5；凹穴最大角半徑約0.207846，小於完整頂面半徑0.33。0.18 m參考tile／0.03 UV relief，名義凹深0.0126 UV、平底micrograin高度跨度最多0.00006 UV（按參考尺度換算2.268mm及10.8μm，非位移或實機量測）。凹底維持M1且高於M0中性底板，頂面與凹底之間以coverage混合，不挖穿底板；全opaque，mortar=1−圓頭coverage，`createMaterial()`預設metallic factor為1以保留區域金屬map。沿用options／Worker／cache／ownership，不新增geometry、螺桿／螺紋、實際穿孔或負載認證。

`datepits` 提供25枚黃褐色橢長椰棗核、兩側隆起核面與有限長彎曲縱向凹槽。重用既有種籽姿態快取及閉合平方距離支撐模式，橢圓以有限polynomial bow偏移、凹槽在兩端前C1淡出，無逐點配置／hash／trig／sqrt，亦不除以尖端漸零寬度；核槽不是咖啡豆裂口或穿洞。每核五值共125個Float64／1000 bytes，128² grain；保守旋轉支撐上界約0.431937加單軸jitter0.025小於owner半寬0.5。0.08 m參考tile／0.025 UV relief，凹槽名義深度0.00475 UV與micrograin高度跨度0.0003 UV（按參考尺度換算380μm及24μm，非位移或實機量測）；槽底高於背景且更暗、更粗糙、AO較低，兩個尖端保持閉合。全opaque M0／mortar0；沿用options／Worker／cache／ownership，不新增geometry、植物生長、食品或化學模擬。

`sapele` 提供紅褐色徑切外觀的寬明暗帶狀木紋與細長淺導管孔，直接重用wenge正式sampler而不另建近似分支。320個孔各四值快取共1280個Float64／10240 bytes，3×4 warp／64×4 fiber／128² grain；七道寬色帶的C1平方距離profile與細長橢圓孔支撐皆維持UV週期，孔x支撐最多0.044加site最多0.75小於owner1、y支撐最多0.26加site最多0.6亦小於1，無逐點配置／hash／trig／sqrt。0.3 m參考tile／0.002 UV relief，孔深0.00016 UV與平面micrograin高度跨度0.000006 UV（按參考尺度換算48μm及1.8μm，非位移或實機量測）。寬木紋只改albedo，不做凸起肋條；細孔為真實淺凹且roughness較高／AO較低。全opaque M0／mortar0，沿用options／Worker／cache／ownership，不新增geometry、木材生長或各向異性／chatoyancy光學模擬；本preset為固定色帶外觀而非動態反光認證。

新增 `chambray` 藍經白緯青年布：32×32等寬1/1平紋逐格交替露出染藍經紗與白緯紗，不是denim斜紋或浮線。直接共用poplin正式sampler，兩向相同0.42支撐／0.3 core與等高0.34 base／0.04 crown，逐交點C1起落；僅chambray設定warp色階0.18與weft色階0.92，既有布種計算不變，無新增逐點配置或布料模擬。128² grain／128雙向fiber，不新增姿態或draft快取。0.016 m參考tile、0.012 UV relief，逐交點lift 0.00168 UV（按參考尺度換算26.88μm，非位移／實機量測）。全opaque M0／mortar0，維持options、Worker、cache與ownership；兩向等高，非poplin粗緯肋，無各向異性或布料動態。

新增 `nephrite` 深淺綠斑與細交錯礦紋的不透明拋光軟玉近似：6² cloud、兩個4² warp、96×8／8×96軸向與64×8整數對角fiber lattice，經0.07 UV warp及C1 threshold混合，128² grain維持平面微紋。兩向與對角細礦色只改albedo，不是凸起布線、分離晶粒或凹裂縫；AO1、全opaque M0／mortar0，不模擬半透明、次表面散射、玉石韌性或各向異性。所有lattice按seed建立快取，無逐點配置／hash／trig／sqrt，整數對角座標及週期warp保持signed UV tile重複。0.16 m參考tile／0.003 UV relief，平面micrograin跨度0.000006 UV（按參考尺度換算0.96μm，非geometry／displacement／實機量測）；保留options、Worker、cache與ownership。

新增 `diorite` 鹽胡椒狀黑白粗晶閃長岩：256個jittered礦晶site，明亮斜長石與大量深色鐵鎂礦色交錯，paleThreshold 0.35僅為seeded程序色相分派而非地質體積含量。直接共用gabbro／anorthosite正式sampler，3×3鄰域compact cap¹⁶正規化、每site六值共1536個Float64／12288 bytes與128² grain；radius1.2在略過site最短距離1.3前消失，自己site平方距離至多0.98確保分母正值。晶內十週期細雙晶只改albedo，不凸起或切裂拋光面。0.16 m參考tile／0.004 UV relief，micrograin跨度0.000008 UV（按參考尺度換算1.28μm，非geometry／位移／實機量測）；全opaque M0／AO1／mortar0，無逐點配置／hash／trig／sqrt，保留options、Worker、cache與ownership，不模擬礦物成分或各向異性。

新增 `carawayseeds` 月牙形葛縷子果：64枚深褐細長彎果與五條較淺縱肋，果身bend0.16大於halfWidth0.065，尖端以有限polynomial taper閉合、五肋收攏而不除以漸零尖端寬度。直接共用fennelseeds正式sampler，各果五值快取共320個Float64／2560 bytes與96² grain，無逐點配置／hash／trig／sqrt。保守旋轉support sqrt((0.16+0.065)²+0.38²)+0.025約0.4666小於owner半寬0.5，seeded signed UV週期。0.04 m參考tile／0.02 UV relief，名義長度0.0038 m與肋高0.0011 UV（按參考尺度換算44μm，非geometry／displacement／實機量測）；全opaque M0／mortar0，維持options、Worker、cache與ownership。果實俗稱種籽，不新增植物生長或透明間隙。

新增 `springpinends` 開槽中空彈簧銷端面：36個隨機朝向C形平切鋼管壁，中央通孔以低背景表示，單一窄槽由孔腔連續開至外緣；不是circlips雙耳卡簧或盲凹穴螺栓。重用既有快取姿態與compact平方annulus／C1槽profile，內外bevel與slot以乘積混合，無角度接縫／nearest-edge crease。每端面五值共180個Float64／1440 bytes與128² grain，無逐點配置／hash／trig／sqrt，outerRadius0.36加jitter0.025小於owner半寬0.5。六乘六配置令支援的32²最小map仍可取樣到管壁，而非八乘八配置使窄環完全落在像素之間。0.064 m參考tile／0.03 UV relief，平切面micrograin高度跨度0.00006 UV（按參考尺度換算3.84μm，非位移／實機量測）。管壁M1、低背景M0，facade metallic factor1，邊緣連續混合，mortar為1-face；全opaque，孔槽不是真透明geometry，不模擬壓入變形或彈性，維持options、Worker、cache與ownership。

新增 `rhyolite` 粉褐細基質流紋岩：14道週期彎曲明暗流紋與稀疏淡色斑晶，直接共用porphyry正式sampler的256個潛在旋轉晶體site及平切面契約。每site六值共1536個Float64／12288 bytes，96² grain；僅rhyolite配置3² flow warp，0.6 phase warp及平方距離C1肩部，radius平方與inverse shoulder只在sampler建立時計算。最大晶體support sqrt(0.14²+0.06²)約0.1524小於site離owner邊界最短0.35；未出現斑晶的site不留幽靈mask。crystalChance0.25是seeded程序分派而非地質含量，細基質色帶與晶體皆不改拋光面height，晶體較淡且較平滑。0.12 m參考tile／0.0005 UV relief，micrograin跨度0.0000075 UV（按參考尺度換算0.9μm，非geometry／位移／實機量測）。全opaque M0／mortar0，無逐點配置／hash／trig／sqrt；既有porphyry不配置flow lattice且原算式保留，沿用options、Worker、cache及ownership，不新增熔岩流動、礦物成分或光學認證。

新增 `tonkabeans` 深褐近黑零陵香豆：64個隨機旋轉、微彎閉合橢長種籽，沿長軸彎曲的不規則凹皺紋與細粒表皮；不是datepits單一縱槽或cubebberries帶梗圓果。沿用既有isolated owner-cell姿態／平方elliptic body／C1 shoulder模式，五值姿態共320個Float64／2560 bytes，40×6 wrinkle lattice及3×6 warp為快取，128² grain；最大保守support sqrt(0.36²+(0.16+0.02)²)+0.015約0.4175小於owner半寬0.5。皺褶同時較暗、低、粗糙且AO較深，沒有用顏色假冒凹陷；兩端閉合而非切開果仁。0.20 m參考tile／0.0275 UV relief，參考長18mm、寬8mm，wrinkleDepth0.12相當0.0033 UV（按參考尺度換算0.66mm，非geometry／位移／實機量測），micrograin跨度參考27.5μm。全opaque M0／mortar0，無逐點配置／hash／trig／sqrt，沿用options、Worker、cache及ownership；不新增乾燥動力學、內部果仁或化學／食用用途。

新增 `pentalobescrewheads` 五圓瓣盲凹穴螺絲頭：36個隨機朝向平切鋼頭，五個圓瓣與中央平底凹穴相連，無中央防拆柱，不是既有六瓣starsocketbolts。沿用isolated owner-cell快取姿態／compact平方profile／C1乘積union模式，180個Float64姿態共1440 bytes，加十個Float64瓣心offset共80 bytes與128² grain；所有sin／cos只在sampler建立時計算，命中鋼頭後才轉local軸，無逐點配置／hash／trig／sqrt。head support0.37+jitter0.025=0.395小於owner半寬0.5；凹穴support0.19低於平切head core0.35，平底中央與五瓣連通，重疊弧線無nearest-edge crease。0.048 m參考tile／0.03 UV relief，名義頭徑5.92mm、凹穴深0.012 UV（按參考尺度換算0.576mm）、平面micrograin跨度參考2.88μm；非geometry／位移／實機量測，也不認證P2／P5／P6尺寸或工具適配。鋼頭及盲穴底M1、低背景M0、mortar1-face，facade metallic factor1。全opaque，不是透明穿孔；沿用options、Worker、cache及ownership，不新增鎖付力學、工具或產品專用功能。

新增 `padauk` 橙紅開孔木紋：選取African padauk的暖紅橙直紋面與較粗、稀疏的縱向開放導管，18道低對比細色紋，不是sapele七道寬紅褐帶或深褐wenge。直接fallthrough共用兩者正式sampler，128個潛在孔site以poreChance0.65做seeded選取，未占用site用zero inverseLength且整個owner保持無孔；仍每site四值共512個Float64／4096 bytes，3×4 warp／64×4 fiber／128² grain快取；縱向center擴至0.3–0.7，避免固定整列打孔感；孔寬最大0.055小於site至x邊界最短0.25、孔長最大0.27小於y邊界最短0.3。新增preset bandContrast0.09僅在sampler建立時選用；既有兩木材維持0.3與原運算、無新增noise field或逐點配置／hash／trig／sqrt。色紋僅顏料、不做凸肋，導管則真的較低、較暗、較粗糙且AO較深。0.16 m參考tile／0.002 UV relief，poreDepth0.12為0.00024 UV（按參考尺度換算38.4μm，非geometry／位移／實機量測），micrograin跨度參考0.96μm；全opaque M0／mortar0，沿用options、Worker、cache及ownership。不新增自然老化、UV螢光或木材力學，也不把程序孔數當成真實植物學量測。

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

`bluelaceagate` 近似淡藍Blue Lace Agate磨光面：平齊藍底上有粗細不等、交替成對的白色細蕾絲波紋；不是鈷藍Lapis、灰石、同寬印刷條紋、凸白脊或凹槽。直接共用既有Rhodochrosite平齊色帶核心，不增第二個sampler；只在建構時替新種類選48×3細warp grid，原種類仍9×3、原算術次序及preset值不變，局部calcite名稱改中性的paleBand。9整數色帶週期搭配大／細平滑warp、兩種不重疊平方肩，既有C1 cache／週期wrap維持signed連續；新色帶不加入height或AO陰溝。3²／48×3／12²／128²四表共16,681 Float64／133,448B，非總RAM；逐點無配置／seed hash／trig／sqrt。名目tile0.12m、default metallic0，五maps opaque、normal接近平面；可選height仍沿既有每圖min/max正規化，不能由0–255色階推論宏觀凹凸尺度。Tint／repeats／native Worker／cache所有權不變。只近似靜態外觀，不認證礦種／天然或染色／產地／尺寸／硬度／寶石價值，不模擬半透明邊、散射、晶體光學或療效。 使用 `await ProceduralMaterial.create('bluelaceagate', { size: 512, seed: 7, heightMap: true, repeats: 3 })`；借用端不用後destroy owned preset。

`linchpins` 近似銀色圓環扣Linch Pins：閉合圓線保險環、較粗實心銷柄及凸起冷鐓頭，兩側環內留暗色介電間隙；不是開口R型髮夾銷、雙腳開尾銷、平墊圈或禁止符號印刷。新小leaf沿用periodic cached noise、平方環帶／capsule及smooth cover慣例，八次superellipse收圓方頭；依序疊環、柄、頭的真height冠，不把三種表面壓成同高平片。偶數4×4交替斜向排列保留signed週期；建構時計算inverse尺寸與保守support，預設最少留0.117 cell margin，不搜鄰格，空支撐跳過geometry、零cover跳過冠計算。96² grain共9216 Float64／73,728B tables，非總RAM；逐點無配置／seed hash／trig／sqrt。名目tile0.2m、default metallic1，但metallic map只覆蓋實物、間隙為M0；五maps皆opaque，不是alpha挖空或真穿孔mesh。可選height／tint／repeats及native Worker／cache所有權不變。只近似靜態閉合外觀，不認證DIN尺寸、鍍層化學／耐蝕、承載／防脫／安全，不模擬扣合、彈簧、碰撞或轉動。 使用 `await ProceduralMaterial.create('linchpins', { size: 512, seed: 7, heightMap: true, repeats: 3 })`；借用端不用後destroy owned preset。

`silknoil` 近似天然奶油白、霧面的Silk Noil絹紡短纖布：細平織交替紗冠與雙向稀疏細小真凸纖維結，不是亮面繅絲Shantung、satin、暗凹孔、棕色印點或大顆粒。「Raw silk」有時是Noil商業稱呼，不表示未清洗去膠的sericin原絲。新小leaf重用periodic cached noise與平方compact support；交替紗項及斜率在owner歸零，128偶數紗列維持signed週期。48² nep owner只在建構快取admission、位置、方向、inverse尺寸及奶油至淡褐色調；平方橢圓冠真增height，smooth cover改色素／roughness／AO。最大預設支撐留0.08 cell margin、不搜鄰格。48²×6 nep表加128² grain，共30,208 Float64／241,664B tables，非總RAM；逐點無配置／seed hash／trig／sqrt。名目tile0.12m、default metallic0，五maps／可選height／tint／repeats及native Worker／cache所有權契約不變。只近似靜態外觀，不認證混紡／sericin／產地／洗護／密度／momme／垂墜／強度或安全，不模擬布料動態或真實短纖。 使用 `await ProceduralMaterial.create('silknoil', { size: 512, seed: 7, heightMap: true, repeats: 3 })`；借用端不用後destroy owned preset。

`bloodwood` 新增所選鮮紅Bloodwood（Brosimum rubescens／Satine）縱切面，細緻、略游移的直紋與稀疏細短真凹導管；不是橘色Padauk、紫心木、灰木、螢光紅漆、密集焦痕孔、端木或凸起燈芯絨色帶。既有疏孔木材kernel只加三處新kind admission，不改共享運算：compact squared孔支撐、constructor-only seed、共平面色帶、256×10細纖維與128² grain。48×16×4孔表加3×4 warp及fiber／grain共22,028 Float64／176,224B tables，非總RAM；最大支撐至少保留X0.185／Y0.155 owner margin。逐點無配置／seed hash／trig／sqrt／鄰格搜尋。名目tile0.12m，孔內降低height、增加roughness與輕微AO；具光澤感的紅色表面仍是介電，default metallic0。只近似選定紅料，不涵蓋所有figure，不認證樹種／產地／色彩、view-dependent chatoyancy、解剖尺寸、日照老化、木塵安全或力學性質。 使用 `await ProceduralMaterial.create('bloodwood', { size: 512, seed: 7, heightMap: true, repeats: 3 })`；借用端不用後destroy owned preset。

`cavansite` 近似稀疏、亮藍、真凸起的短針狀放射晶簇，落在占多數的暖白粗粒礦物基底；不是磨光藍圓珠、平印花、Fluorite方晶色帶或Pentagonite長刺星形。只參考館藏標本的藍晶簇／淺底組合，opaque五maps不模擬真實晶體光學、化學、透明／螢光、礦種鑑定、產地或校準尺寸。新小leaf重用periodic cached noise與smooth compact support，以平方徑向冠及36根constructor快取、略不規則短放射針的complement product合成；徑向body邊界的色素／高度／AO皆C1。每owner的admission、旋轉、縮放與jitter只在建構時計算，預設最大支撐至少留0.155 cell margin、不搜相鄰owner。4²×6 site表、36×4 needle表、128² grain及32² host共17,648 Float64／141,184B tables，非總RAM；逐點無配置／seed hash／trig／sqrt。名目tile0.16m，藍晶簇真凸起且比基底光滑，實物含釩不代表金屬表面，default metallic0。 使用 `await ProceduralMaterial.create('cavansite', { size: 512, seed: 7, heightMap: true, repeats: 3 })`；借用端不用後destroy owned preset。

`matelasse` 近似暖象牙白的織成絎縫布：連續凸起菱形接結網、略蓬鬆內片及細緻交替紗冠；不是 `quilting` 的下凹虛線車縫、cathedral-window 折片、充氣軟墊格或印花菱線。參考真實菱形 Matelasse 床罩，只選 cotton-like 外觀，不認證纖維、織機結構、產地、尺寸、洗護或耐磨。獨立小 leaf 重用既有 periodic lattice 與 smooth support：雙斜向緊支撐凸肋以 bounded smooth union 合成，不用 nearest-rib 切換或交點加倍；平方內片支撐在 owner 平坦接合，交替紗冠項及其斜率在紗線 owner 歸零。128 偶數紗列與六次斜向重複維持 signed UV；唯一不可變 128² grain 表共16,384個 Float64／131,072B tables，非總RAM，逐點不配置、不 seed hash、不三角／sqrt、不掃鄰格。名目tile0.24m，default metallic multiplier0；五張一般 PBR maps 僅表達靜態視覺凹凸，不模擬布料動態、填棉或真實纖維結構。七項 consumer cases涵蓋凸接結／淺內片、相鄰經緯交替、C1肩線／owner、actual512 opaque象牙白介電maps及signed週期；整合前已跑十六個各自獨立負向與合法加寬凸肋控制。

```ts
const matelasse = await ProceduralMaterial.create('matelasse', {
  size: 512,
  seed: 7,
  heightMap: true,
});
// Destroy this owned preset after all borrowing meshes/materials stop using it.
matelasse.destroy();
```

`yellowheart` 新增選定直紋金黃色Yellowheart（Euxylophora paraensis／Pau Amarello）縱切面：細而低對比的縱向紋理配稀疏短開口導管，不是橙色Padauk、紫木、螢光黃漆、密集環孔條、凸帶、端木紋或真正satinwood鑑定。重用Padauk／Iroko／Purpleheart／Sapele／Wenge kernel，只將新preset納入fine-grain路徑：constructor稀疏admission、compact平方橢圓、週期warp色帶、224×6細fiber、128² grain及真正淺凹導管。40×12×4 pore cache加3×4 warp與fiber／grain lattice共19,660個Float64／157,280 B tables，非總RAM。導管support至少留0.17／0.11 owner margin，維持C1；色素細紋留在緞光平面，稀疏管腔才降低height、增roughness及輕AO。逐點不新增配置／hash／trig／sqrt／鄰格掃描，nominal tile0.12m。五maps、可選height／tint／repeats、native Worker／cache、dielectric預設與顯式metallic override、獨立textures及destroy契約不變。此為所選金黃木料靜態外觀，不是樹種／產地認證、色彩校準、解剖尺寸、日照老化、木塵安全或力學性質模擬。 使用 `await ProceduralMaterial.create('yellowheart', { size: 512, seed: 7, heightMap: true, repeats: 3 })`，不用時destroy回傳preset。

`rclips` 新增亮色彈簧線R型髮夾銷近似：單圓拉環、一根長直插腳、帶內收頸的彎曲彈簧腳與外張短端。拉環內部、彈簧間隙及自由端間隙皆連到暗色凹底，不是封閉墊圈、扁平開口銷或兩根平行U腳。重用paperclip的capsule／half-ring kernel與complement union，快取13段各5值、1彎各5值及既有96² grain，共9,286個Float64／74,288 B tables，非總RAM。第二組smooth cover只為R-clip建立圓線冠，metal沿線材mask，空底保持dielectric；既有paperclip分支不變。Face與crown重用平方距離，逐點不新增配置／hash／trig／sqrt。最大local support0.42605小於半格，capsule projection、重疊arc肩、seed grain及signed UV repeat維持C1。Tile0.12m、交替±45°擺放固定，seed只改微grain、不改製品輪廓。五maps、可選height／tint／repeats、native Worker／cache、顯式metallic override、獨立textures及destroy契約不變。此為height-field外觀近似，不是DIN認證零件、尺寸圖、材質等級或彈力／疲勞／保持力模擬。 使用 `await ProceduralMaterial.create('rclips', { size: 512, seed: 7, heightMap: true, repeats: 3 })`，不用時destroy回傳preset。

`ticking` 新增海軍藍／奶白床墊條紋布近似：寬中央染色條兩側各有細線，採緊密2/1經面斜紋。染色沿經紗，奶白緯紗仍在交織點露出，不是印刷實心條、格紋、刷毛、開孔紗網或凸條。重用既有woven-yarn kernel及整段float profiles，雙緯跨度經紗在中間owner邊界仍保持抬起，不縮成逐格珠子。3×3 draft快取54個Float64 profile值，加原有128² grain lattice，共16,438值／131,504 B tables，非總RAM；immutable條紋draft是一般authoring data。窄紗support與squared smooth float profiles維持owner／shoulder／fiber及signed UV seam的C1。條紋色素不驅動height、roughness或occlusion。Seed工作留在constructor，逐點不新增配置／hash／trig／sqrt。五maps、height／tint／repeats、Worker／cache、獨立texture所有權及destroy契約不變，nominal tile0.048m。不作防羽絨、紗密、耐磨、阻燃或製造商認證，既有織物preset不變。 使用 `await ProceduralMaterial.create('ticking', { size: 512, seed: 7, heightMap: true, repeats: 3 })`，不用時destroy回傳preset。

`sodalite` 新增不透明磨光的藍至藍紫色近似：底色含細顆粒變化，穿插不規則細白calcite-like脈與少量淺斑。不是金屬pyrite、凸白緞帶、開裂洞、透明橙黃色標本、螢光或photochromic hackmanite。新leaf重用既有週期cached noise與squared smooth cover primitives：兩個domain-warped carrier尺度11²／43²，加6² cloud／128² grain與兩組4² warp，共 18,422 Float64／147,376 B table，非總RAM。Carrier level的平方距離形成smooth feathered填實脈線，以complement product合併淺斑，無nearest-site或角度接縫。Hash只在constructor計算；採樣無配置／hash／trig／sqrt／鄰格掃描。白脈只改色素與稍粗糙roughness，height仍是同一平面微grain，AO1／M0／mortar0。Nominal tile0.12 m與UV relief0.0002為作者值，不是礦物尺寸或光性校準；CPU maps、可選height、facade controls／cache／native Worker與cleanup契約不變。 可用 `await ProceduralMaterial.create('sodalite', { seed: 7 })` 建立；consumer用畢後銷毀preset。

`dalmatianstone` 新增奶白長石／石英近似底、大小不一的深綠黑色礦物聚斑，為磨光平整面，不是凸卵石、凹孔、帶環orb或白雪花。命名採 GIA 論文建議的 Dalmatian stone，不沿用不準確的商業稱呼 Dalmatian jasper；這是作者外觀，不是成分／產地鑑定。10×10 cell各一seeded候選，依seed決定admission／旋轉／寬長／彎曲，128² cached grain也平滑擾動squared contour；斑可跨owner相連，固定週期3×3鄰域防止截斷。Contour乘數最低0.6，最大support＜0.393 cell，遠小於最近被省略site距離1.15。800個pose值＋128² grain及12² matrix共 17,328 Float64／138,624 B table，非總RAM。Hash／trig／inverse radii皆只在constructor計算，取樣無配置／hash／trig／sqrt。Smooth cover只改色素與稍粗糙的暗斑；height僅有同一磨光面微grain，AO固定1、M0、mortar0。Nominal tile0.06 m及UV relief0.002為作者值，不是標本尺寸校準；CPU maps、可選height、facade controls／cache／native Worker與cleanup契約不變。 可用 `await ProceduralMaterial.create('dalmatianstone', { seed: 7 })` 建立；consumer用畢後銷毀preset。

`purpleheart` 新增靜態曝光後的茄紫色紫心木表面，採大致筆直的中等木紋與稀疏閉合端縱向導管。只表示作者選定的曝光色態，不是新切灰褐木、UV／氧化變色動畫、螢光、木種鑑定或物性校準。共用既有 Padauk／Iroko／Sapele／Wenge 導管核心，只在 constructor 選 fine sparse profile；導管底較暗且凹入、略粗糙並有局部 AO，縱長木紋帶仍是平面色素，不是凸起緞帶。30×10 候選 site 用 1,200 個 inverse-ellipse／position 值，加 3×4 warp、192×6 fiber 與 128² micrograin，共 18,748 Float64／149,984 B table，非總 RAM。橫向中心 0.25～0.75、radius 至多 0.09，縱向中心 0.35～0.65、radius 至多 0.28，support 完整落在各 owner 內；週期單 owner 評估與 squared smooth cover 維持 C1。採樣不新增配置、hash、trig 或 sqrt；四個舊 sibling 的 point kernel 與算術次序不變。M 與 mortar 固定 0；nominal tile 0.12 m、UV relief 0.003 為作者選定。CPU maps、可選 height、controls／cache／native Worker 與 cleanup 沿用既有契約。 可用 `await ProceduralMaterial.create('purpleheart', { seed: 7 })` 建立；consumer 結束使用後銷毀 preset。

`blackpalm` 新增緞面細磨的黑棕櫚木縱切近似：細密深色纖維維管束主要沿 V 延伸，嵌於棕褐色地組織；不同於 `palmendgrain` 點狀端切纖維束與凹入導管，不含年輪、木節、板縫、深色孔洞或按色紋雕出的凹凸。重用既有 Tigerwood／Snakewood compact curved-spindle pigment kernel，不改兩種舊材質的 point kernel；位置、平方寬長倒數、輕微斜率與彎曲只在 constructor 依 seed 快取。80×12 owner、各兩候選束用 11,520 pose 值，加 96×6 wood、128×8 fiber 與 128² micrograin，共 29,504 個 Float64／236,032 B table，非總 RAM。含 jitter 的單軸支撐最多橫向 0.758、縱向 1.38 owner unit，均小於既有週期 3×3 鄰域所需的 1.5 界。Squared smooth cover 只疊加平面色素，採樣不新增配置、hash、trig 或 sqrt；M 固定 0、AO 固定 1、mortar 固定 0，roughness 為緞面，height 僅有共用細木紋的淺起伏。0.096 m nominal tile 與 0.004 UV relief 是作者選定，不是纖維尺寸、木材等級、力學性質校準或新 shading model；CPU maps、可選 height、facade／cache／Worker controls 與既有 cleanup 契約不變。 可用 `await ProceduralMaterial.create('blackpalm', { seed: 7 })` 建立；與其他程序材質相同，consumer 結束使用後銷毀回傳 preset。

`eclips`（不鏽鋼E型擋圈）新增三個朝內接觸部、兩個連到軸孔的寬翼口袋及外通漸張開口，不是既有帶雙鉗孔的C型卡簧。16組小幅旋轉／jitter／縮放pose共80個cache值，加96² grain為9,296 Float64／74,368 B，僅為table預算、非總RAM。Squared-radius covers與smooth half-planes讓單軸支撐含jitter最多0.35 cell，小於0.5 owner邊界；中央接觸部或空軸孔保護鏡像口袋的abs-x接縫。取樣無配置／hash／trig／sqrt／鄰格掃描，空背板略過grain。金屬面、height、roughness與AO同cover混合，metallic圖為鋼面1／不透明背板0，default material factor 1。0.064 m nominal tile與0.004 UV relief為作者選定，非尺寸認證。沿用四maps、optional height、tint／repeats／Worker／cache及ownership，不新增mesh通孔、透明、軸件裝配、彈簧力學或負載額定模擬。 使用 `await ProceduralMaterial.create('eclips', { seed: 7 })`。

`snowflakeobsidian`（雪花黑曜石）新增作者近似的黑色磨光平面與平齊灰白放射晶簇，不是既有Obsidian貝殼狀斷口、凸花或平滑印色圓斑。36組seeded晶簇各用24個compact放射晶瓣與0.4–1.1倍不等尺度；scaled support加jitter上界0.4657 cell，小於0.5 owner邊界。重用Chrysanthemum Stone核心，constructor選色調／roughness與縮放cache basis；3,564個geometry值加96² grain，共12,780 Float64／102,240 B，僅為table預算、非總RAM。取樣無配置／hash／trig／sqrt，只有micrograin改height，灰晶簇比黑底稍粗糙。0.12 m nominal tile與0.001 UV relief為作者選定，非標本量測。沿用opaque dielectric四maps、metallic 0、optional height、tint／repeats／Worker／cache及呼叫者ownership，不新增斷口／晶體geometry、透明、礦物鑑定或校準光學模擬。 使用 `await ProceduralMaterial.create('snowflakeobsidian', { seed: 7 })`。

`f05opticalfaces`（JIS-F05光接收座正面示意）使當時目錄879→880種：2×2四個不帶帽的霧黑矩形模塑樹脂面，各有兩條長側凹槽、僅一端兩角倒角的隆起六邊導框、兩個圓側凸耳、暗色鍵形口與低圓形對位井。全為opaque dielectric，沒有快門、LED／發光、金屬接點或透明／折射鏡片。這是相關接頭家族外觀變體，不是新渲染技術，也不是光電二極體／光學／資料／音訊／電氣／插合／EMC／安全模擬或認證。

外觀依據已實讀／渲染的六頁原廠[Toshiba TORX1350A(F)資料表（2020-03-12）](<https://toshiba.semicon-storage.com/info/TORX1350A(F)_datasheet_en_20200312.pdf?did=35629&prodName=TORX1350A(F)>)第5頁水平型JIS-F05接收模組圖：正面13×8.5 mm，不是13.5 mm深度或3.5 mm外伸腳長。[原廠產品頁](<https://toshiba.semicon-storage.com/ap-en/semiconductor/product/isolators-solid-state-relays/detail.TORX1350A(F).html>)僅支持molded resin，不推定精確樹脂化學；料號為NRND（不建議新設計）。已實看的[2014經銷商家族照片](https://rutronik-tec.com/wp-content/uploads/2014/10/Toshiba21.jpg)及其[公告](https://rutronik-tec.com/toshiba-extends-toslink-family-with-new-energy-conserving-fibre-optic-transmission-modules/)只支持pre-A TOxX1350家族近似黑色外觀，並非A型正面光學校準。形狀、色彩、粗糙度、層高、0.04 m nominal tile與0.0038 UV relief皆作者近似，不是CAD／公差／插合／厚度或光學量測；不打包來源照片／PDF。

獨立56-field preset／kernel採兩組圓角矩形與兩組圓形平方距離C1 profiles、兩組各三因子的C1六平面遮罩、導框／凸耳乘積聯集及19組快取channel差值。四組四欄pose128 B加96² Float64 grain73,728 B，共73,856 B typed payload，非總RAM或FPS；owner-coordinate支撐上界0.4023056142 < 0.5。逐點無配置／hash／trig／sqrt／逐邊或slot迴圈。Default metallic0、stored metallic-roughness B=0遍及所有像素；explicit metallic1只改factor、不改stored map。沿用opaque四maps、optional height、tint／repeats、同步／native module Worker pool／cache及preset-owned texture／呼叫者清理，既有879種不變；不增依賴、別名或API入口。建議512，32僅粗預覽。不建模保護帽、焊接／支撐腳、背部／PCB細節、mesh／透明通孔、碰撞或光傳播。

使用`await ProceduralMaterial.create('f05opticalfaces', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；`createMaterial({ metallic: 1 })`不能把stored全零金屬圖變成金屬。銷毀preset前先移除借用材質；caller-owned pool／cache仍由呼叫者管理。

`minidin4femalefaces`（四接點mini-DIN母座正面示意）使當時目錄880→881種：2×2四個近方形黑PBT承座／圓邊框，各有連續薄鍍錫黃銅接地環、暗環腔及黑色圓內芯。內芯上方為開放缺口、下方兩側為階梯切口；四個塑膠導入口上排直長、下排橫長，另有獨立封閉的下方矩形鍵孔。只有接地環為金屬；不畫可見銀色內接點環、外屏蔽罩、背腳或開關，也不模擬視訊／訊號／電氣。

外觀依據原廠[Same Sky MD-40S產品頁](https://www.sameskydevices.com/product/interconnect/connectors/din-connectors/md-40s)、已實讀／實看的五頁[MD-S資料表（印刷日期2024-09-12）](https://www.sameskydevices.com/product/resource/md-s.pdf)第2頁及[原廠照片](https://cdn.sameskydevices.com/products/image/getproductimage/976?typecode=m&width=300)。採用獨立MD-40S四接點正面及共用外殼圖，不把通用大圖的九孔或PCB焊孔配置當四孔正面；上缺口屬PBT內芯，不切斷金屬接地環。黑PBT／鍍錫黃銅角色有來源依據，但形狀比例、色彩、roughness、AO、層高、0.04 m nominal tile與0.0042 UV relief皆作者近似，非CAD／公差／插合／厚度／鍍層光學量測或電氣／視訊／EMC／安全認證；不打包來源PDF／照片。

獨立87-field preset／kernel採六組圓角矩形（共用slot半徑倒數）、四組平方圓距離C1 profiles、兩組smooth半平面階梯gates及32組快取C／H／R／AO差值。四組四欄Float64 pose128 B加96² grain73,728 B，共73,856 B typed-array payload，非總RAM或FPS；單一owner支撐上界0.4189705149024927 < 0.5。逐點無配置／hash／trig／sqrt／slot迴圈。Default metallic1只保留薄接地環，所有黑塑膠／孔底／腔為M0；`createMaterial({ metallic: 0 })`只改factor，不抹除stored metallic mask。沿用opaque四maps、optional height、tint／repeats及既有Worker／cache API；preset擁有textures，呼叫者管理借用材質與自有pool／cache，先移除借用材質再銷毀preset。不新增依賴、別名或API入口，保留先前880種演算法／順序。建議512，32僅粗預覽；不建模mesh、透明通孔或實體接點。

使用`await ProceduralMaterial.create('minidin4femalefaces', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`保留預設接地環金屬factor；explicit `createMaterial({ metallic: 0 })`不會抹除stored mask。

`dcbarreljackfaces`（DC圓孔電源座正面示意）使當時目錄881→882種：2×2四個9:11比例的高身黑PBT圓角矩形，各有偏上的暗圓口、實心凹入鍍鎳銅中心針及獨立的下方鍍銀銅合金terminal 2橫條。橫條上下邊平直，只有兩端被圓口裁切；只有這兩個接點為M1，所有PBT、背底與孔底為M0。深度為背底 < 孔底 < 下橫條 < 實心針 < 承座面，兩接點都低於承座面。不畫中空中心、外金屬環或額外凸圓框。

外觀依據原廠[Same Sky PJ-102A產品頁](https://www.sameskydevices.com/product/interconnect/connectors/dc-power-connectors/jacks/pj-102a)、已實讀／實看的三頁[PJ-102A資料表（印刷03/11/2025，rev 1.07）](https://www.sameskydevices.com/product/resource/pj-102a.pdf)第2頁及[原廠正面照片](https://cdn.sameskydevices.com/products/image/getproductimage/690?typecode=m&width=300)。圖面正面9 × 11 mm、開口Ø6.40 mm、針Ø2 mm、口中心距底6.5 mm；目錄2.0 × 6.5 mm名稱與5.5 mm mating plug直徑均不可當成圖面Ø6.40 mm開口。形狀、色彩、roughness、AO、層高、0.04 m nominal tile與0.0042 UV relief皆作者近似，不是CAD／插合／公差／電氣／極性／開關／安全或接頭模擬與認證。省略背部焊腳、PCB與實體通孔，孔底為opaque stand-in；不打包來源PDF／圖片。

獨立47-field preset（45數值欄位及2色盤）採五個C1 profile因子：圓角承座、孔／實心針的兩組平方圓距離，以及相乘的兩組smooth spring軸向gates並由孔裁切；16組C／H／R／AO差值constructor快取。四組四欄Float64 pose128 B加96² Float64 grain73,728 B，共73,856 B typed-array payload，不含JS物件／closure開銷，非總RAM／FPS或效能認證；單一owner支撐上界0.4383801121065569 < 0.5。逐點無配置／迴圈／hash／trig／sqrt，完整孔core略過cached grain；保留owner索引前第二次fract以處理極小負UV。Default metallic1只保留實心針與獨立下橫條；`createMaterial({ metallic: 0 })`只改factor，不抹除stored metallic mask。沿用opaque四maps、optional height、tint／repeats與既有Worker／cache API；preset擁有textures，呼叫者先移除借用材質再銷毀preset，並管理自有pool／cache。不新增依賴、別名或API入口，保留先前881種演算法／順序。建議512，32僅粗預覽。

使用`await ProceduralMaterial.create('dcbarreljackfaces', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`保留預設針／橫條金屬factor；explicit `createMaterial({ metallic: 0 })`不會抹除stored mask。

`stfiberadapterfaces`（ST simplex光纖轉接座正面示意）使目前目錄882→883種：2×2四個六平面鍍金屬六角底座、同心圓形凸肩與凸起圓筒唇；筒唇只有一個上方開放軸向鍵槽，左右有兩個相對的卡口凸柱，中央是深暗不透明圓腔。鍵槽只把高筒唇降到連續金屬凸肩，不切穿凸肩／六角底座到背景；高唇為開口C形。全部可見硬體與鍵槽底為M1，圓腔／背底M0；深度為背底 < 圓腔底 < 六角底座 < 凸肩／鍵槽底 < 卡口柱 < 筒唇。不畫白色陶瓷環、中心接點環或針。

外觀依據[SENKO ST產品頁](https://www.senko.com/product/st-adapter-2/)、已實讀五頁[DS-ST-000006-RevA-EN資料表](https://www.senko.com/wp-content/uploads/2025/01/DS-ST-000006-RevA-EN.pdf)（實看第1頁照片及第3頁圖面）與[原廠ST-Adapter.png](https://www.senko.com/wp-content/uploads/2021/09/ST-Adapter.png)，採216-101 simplex，不混用316 duplex。來源僅支持鍍金屬，不宣稱鎳或其他合金；內部zirconia split sleeve有規格依據，但原廠視角未清楚露出白環，因此不畫。PDF metadata的2024-11-15建立日期不是印刷日期；29.3 mm是軸向深度，double-D 9.6 × 7.8 mm是面板開孔參考，兩者皆非正面形狀。比例、色彩、roughness、AO、層高、0.04 m nominal tile及0.0042 UV relief是作者設定的簡化正面插圖，非CAD。省略螺紋、獨立滾花齒、墊圈、防塵帽、背部、線纜／ferrule與PCB，不作光學／電氣／插合／安全模擬或認證，也不宣稱browser／FPS認證；不打包來源素材。

獨立54-field preset（52數值欄位及2色盤）採13個C1 profile因子：六個六角支撐平面、三個平方圓距離、兩個鍵槽軸向與兩個卡口柱軸向gates；20組C／H／R／AO差值constructor快取。相乘的smooth profiles／角色替換避免非零hard min／max接縫。四組四欄Float64 pose128 B加96² Float64 grain73,728 B，共73,856 B typed-array payload，不含JS物件／closure開銷，非總RAM或FPS；旋轉不變owner半徑加jitter為0.35841016151377547 < 0.5。constructor快取pose／grain，逐點無配置／迴圈／hash／trig／sqrt，零支撐與非金屬圓腔／背景略過不需要的grain；保留owner索引前第二次fract以處理極小負UV。Default metallic1；`createMaterial({ metallic: 0 })`僅改factor，不抹除stored metallic mask。沿用opaque四maps、optional height、tint／repeats及既有Worker／cache API：preset擁有textures，呼叫者管理借用材質與自有pool／cache，先移除借用材質再銷毀preset。不新增依賴、helper、export、API或色盤擴充；上述是來源／實作描述，不是完整正式測試、browser或built distribution驗證。

使用`await ProceduralMaterial.create('stfiberadapterfaces', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`保留預設硬體金屬factor；explicit `createMaterial({ metallic: 0 })`不會抹除stored mask。

`to220packagefaces`（外露金屬片TO-220封裝正面示意）使目錄884→885種，含plain的gallery為886項。2×2四個朝前封裝各有上方兩角均倒角的中性金屬片、一個中央暗色不透明凹安裝孔、遮住下方金屬片與腳根的霧黑矩形本體，以及三支等間距平行直金屬腳；腳根肩較寬、直尾較窄。完整金屬片／腳面M1，本體／孔底／背底M0，邊界採C1混合；這是表面角色，不代表電氣隔離。作者正規化高度為背底.02 < 孔底.06 < 金屬片.30 < 腳.44 < 本體.68，孔是真正height凹陷，不是黑色塗點或透明通孔。

外觀依據STMicroelectronics [STP55NF06外露金屬片TO-220 type A，May 2012，Doc ID7544 Rev11](https://www.st.com/resource/en/datasheet/stb55nf06.pdf#page=13)：實看原PDF第1頁封面圖、第13頁Figure 23／0015988_typeA_Rev_S，並實讀第12頁尺寸表。不是TO-220FP或D²PAK型。圖面尺寸僅參考，非本作者插圖的量測值或精確尺寸CAD；不推定化學成分、鍍層或精確光學。省略印字、小圓形模痕／側凹與背部，不打包來源圖；不模擬熱、電路、電氣／RF、安全或FPS，來源的tab連pin2也未建模。

預設0.08 m nominal tile、0.0042 UV-relative relief（不是公尺位移）及metallic factor1。Explicit `createMaterial({ metallic: 0 })`僅改scalar factor，不改stored M mask。作者欄位留在既有`src/data` immutable preset；constructor快取四組四欄Float64 pose128 B及96² Float64 grain73,728 B，共73,856 B typed-array payload，不含JS物件／closure開銷，非總RAM或效能認證。sampler沿用C1 profiles與凸層替換，逐點無配置／迴圈／hash／trig／sqrt／鄰居搜尋；保留既有週期不透明maps與texture ownership。建議512辨識安裝孔及三支窄腳尾，32僅粗預覽，不保證每支腳可辨。

使用`await ProceduralMaterial.create('to220packagefaces', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得預設金屬factor；explicit0保留stored mask與既有texture清理方式。

`mudcloth`（手繪泥染布條帶紋示意）使目前目錄886→887種，含plain的gallery為888項。八條橫向條帶依序重複四種作者設計的母題：折線、點列（相間大小）、菱形套小圓點、雙軌梯形橫檔；每條帶界有連續淺色分隔線，並以週期雜訊對座標做手繪式微擺動，每條帶另有獨立的相位與筆畫寬度。深褐黑染底與奶油色未染棉紋以單一色階圖呈現（染底約0.10、筆畫約0.84，另含微幅染料沉積與紗線色調變化）；底層是每tile 64×64緯經紗的平紋織物，每格以上下交替的拋物線紗面生成height／AO。Metallic與mortar皆為0。

靈感來自西非泥染布（bògòlanfini）「深色染底＋淺色母題」的外觀，但母題幾何、比例、色彩與紋理皆作者自訂，不是任何特定族群、工坊或傳統紋樣的精確複製，也不代表其文化意涵；未引用或打包外部圖樣。

預設0.5 m nominal tile、0.0008 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512辨識緯經紗與細筆畫，32僅粗預覽；不宣稱本段已完成browser或三backend驗證。

`turingpattern`（Turing式迷宮／斑點皮毛紋示意）使目前目錄887→888種，含plain的gallery為889項。以三組整數波向量（每tile 13、12.5、13.0週期）的餘弦疊加產生近六角斑點格，再用週期雜訊扭曲座標並以緩變門檻在「小圓斑（高門檻）」與「迷宮網狀（低門檻）」之間過渡；柔邊色斑為深褐，底為淡駝色，色斑中心略深、高度略高於底。Metallic與mortar皆為0。

這是解析式的三波疊加近似，不是反應擴散（reaction–diffusion）模擬，也不求再現任何特定動物的斑紋；全部參數與色彩皆作者自訂，未引用或打包外部圖樣。每個sampler點只算三個cos與四個週期雜訊，沒有迴圈或配置。

預設0.4 m nominal tile、0.0007 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議256以上辨識斑點細節，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`bayerdither`（Bayer有序抖動像素方磚示意）使目前目錄888→889種，含plain的gallery為890項。每tile 64×64個方塊，每塊依同一個緩變亮度場在方塊中心取值，與8×8 Bayer門檻矩陣比較後決定「亮」或「暗」：亮塊為奶油白、較高且光澤較強，暗塊為深藍黑、較低且較粗糙，方塊間有一條深色凹縫，邊緣有倒角；每塊另有微幅色調抖動。亮度場在平緩區形成典型的有序抖動紋，約50%亮度時退化成棋盤。Bayer矩陣在constructor以遞迴 B(2n)=[[4B,4B+2],[4B+3,4B+1]] 建立。Metallic與mortar皆為0。

這是作者設計的像素風表面示意：沒有取自任何圖片或遊戲素材，也不是影像抖動演算法的工具實作。預設0.32 m nominal tile、0.0036 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓每塊至少8 px，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`patchworkquilt`（拼布被面示意）使目前目錄889→890種，含plain的gallery為891項。每tile 4×4塊方形布片，依hash各自選用四種設計之一：素色（加印小圓點）、對角半方三角、同心方環、三條布帶，各片取五級色階中的兩級；片與片、片內拼縫為深色凹縫，每片像填充棉被般中央隆起，並沿片界內縮0.07處有一圈虛線縫線（每邊6段、佔空比約0.62，縫線略凹、色較亮、較粗糙），底層為每tile 96×96緯經紗平紋織物。Metallic與mortar皆為0。

這是作者設計的簡化被面示意：色階、設計、比例皆作者自訂，不是任何特定傳統被面圖案（如log cabin或nine patch）的精確複製；未引用或打包外部圖樣。預設0.8 m nominal tile、0.0042 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識虛線縫與圓點，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`amberresin`（拋光琥珀樹脂示意）使目前目錄890→891種，含plain的gallery為892項。以沿v方向28列、沿u方向僅4欄的週期雜訊做拉長的流動色帶（蜂蜜金～深琥珀），再疊上兩種以格點為單位的特徵：6×6格內每格約55%機率出現一個圓形氣泡（半徑0.022–0.05 UV，內部較亮、外緣為暗色細環，只在環上降低AO），以及4×4格內約40%機率的「太陽斑」圓盤（半徑0.07–0.10 UV，略亮並有9組由核心向外淡入的放射狀裂紋，裂紋使高度下凹且較粗糙）。整體roughness約0.14（拋光），Metallic與mortar皆為0。

這是不透明貼圖的作者式近似：琥珀的半透明、折射與昆蟲內含物都沒有模擬，也不依據任何特定產地或標本；未引用或打包外部圖樣。每個特徵的中心保持在所屬格內，完整半徑不會跨格。預設0.2 m nominal tile、0.0006 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識氣泡細環，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`ammonitestone`（菊石化石灰岩示意）使目前目錄891→892種，含plain的gallery為893項。2×2格各有一枚圓盤狀菊石化石，位置、大小與起始相位各自微調；殼面是對數螺線：以 whorl = ln(ρ/r₀)/ln(g) − θ/2π 取小數部分作為螺管截面座標，整數處為縫合線（凹、AO暗），中段為圓管狀隆起並帶中央龍骨；肋紋每圈18條、帶弧度（falcoid）扭轉，內圈淡出以避免取樣混疊。基質為灰褐石灰岩（緩變斑駁加細顆粒），殼為奶油色且較光滑（roughness 0.55 對基質0.88）。生長比g＝2.3、殼外半徑0.4格、約3.1圈。Metallic與mortar皆為0。

這是作者設計的示意化石，不是特定種屬或標本的重建：不模擬隔壁縫合線的複雜葉狀、殼口或化石化的礦物差異；未引用或打包外部圖樣。每枚化石的半徑加位置抖動保持小於半格，點只屬於自己的格。預設0.5 m nominal tile、0.0026 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識肋紋，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`octopussuckers`（章魚腕吸盤示意）使目前目錄892→893種，含plain的gallery為894項。4×4個吸盤，奇數列偏移半個欄距，每個吸盤的位置與半徑（0.11 UV的92–100%）各自微調。每個吸盤由三層組成：高出皮膚的環形邊緣（torus，峰值在半徑約79%）、內縮到皮膚高度的杯狀凹陷（12條放射狀隆線，窗函數使隆線在邊緣與中心孔處歸零，因此各通道在邊緣腳處C1連續），以及中央深暗的小孔（AO明顯降低）。皮膚為濕潤的粉灰色，帶緩變皺紋與小塊深色斑點。Metallic與mortar皆為0。

這是作者設計的示意：吸盤數量、列距、斑點與顏色都不是任何特定種類的量測；未引用或打包外部圖樣。每個吸盤半徑小於半個欄距與半個列距，因此點只屬於自己的列與最近的吸盤。預設0.4 m nominal tile、0.0034 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識杯內隆線，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`expandedpolystyrene`（發泡聚苯乙烯珠粒示意）使目前目錄893→894種，含plain的gallery為895項。每tile 16×16顆珠粒，位置以週期Voronoi的方式（每格一個、距格邊至少0.2格）隨機排列；以最近三個site的距離分出：F1擁有的圓頂珠面（高度隨距珠心而隆起，每顆珠獨立色調微變）、F2−F1小於接縫寬的深灰融合縫，以及F3−F1很小的三顆珠交會處暗色空隙。珠面白色、較粗糙度0.78，接縫0.9，空隙最暗且AO最低。Metallic與mortar皆為0。

這是作者設計的示意：珠的排列、大小、融合縫寬與色彩皆不是任何產品或密度等級的量測；未引用或打包外部圖樣。因為每個site都留在自己格內，3×3鄰格足以包含最近三個site，貼圖在兩軸週期。預設0.12 m nominal tile、0.0022 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識空隙，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`asphaltshingle`（瀝青三片式屋頂瓦示意）使目前目錄894→895種，含plain的gallery為896項。每tile 12道瓦列、每列6片瓦舌；每列的瓦舌圖樣向右偏移整數個半片寬（不影響每tile恰好一次的週期），瓦舌間為從列下緣向上延伸的狹縫（只在下58%，露出深色底層；上42%被上一列覆蓋，不開縫）。每片瓦舌向下緣逐漸增厚，在列下緣一個陡降到下一列，下一列上緣因被覆蓋而AO變暗；顆粒雜訊（256×256）提供粗糙礦物顆粒感，並疊加每片的色調微變與緩變磨損。Metallic與mortar皆為0。

這是作者設計的示意：瓦片的尺寸比例、顏色、顆粒與磨損不是任何製造商或型號的量測，也不模擬釘線、密封膠條、苔蘚或自然老化；未引用或打包外部圖樣。預設1.0 m nominal tile、0.0045 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識狹縫與顆粒，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`lawnstripes`（修剪草坪條紋示意）使目前目錄895→896種，含plain的gallery為897項。每tile 8條橫向割草條紋交替明暗（±0.14），條紋邊界以週期雜訊微擺；每條紋內的草葉細絲以沿v拉長的value noise（192×48與384×96兩層）組成，並用整數剪切 x = u + lean·v（lean＝1，偶數條紋＋1、奇數條紋−1）讓草葉在相鄰條紋向相反方向傾斜，兩軸仍保持週期。另有緩變草叢明暗、細絲谷底的AO與微幅粗糙度變化。Metallic與mortar皆為0。

這是作者設計的示意：不模擬單片草葉幾何、枯草、土斑或雜草；傾斜角固定為45°（整數剪切的限制），不是真實草葉的量測；未引用或打包外部圖樣。預設2.0 m nominal tile、0.0028 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識草葉細絲，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`atomicboomerang`（原子時代飛鏢紋層壓板示意）使目前目錄896→897種，含plain的gallery為898項。5×5格各有一個印花：約62%為V形飛鏢（兩臂 y = k|x|，k＝0.4，寬度向臂尖以 1−t³ 收尖），其餘格約70%為四尖星（astroid，|x|^0.55＋|y|^0.55 ≤ r^0.55）；每個印花的位置、尺寸（80–100%）與角度隨機，淺奶油或深青二選一。底色是淡青灰色並帶細小深色斑點（160×160雜訊門檻），印花略微抬高、更光滑。Metallic與mortar皆為0。

這是作者設計的復古圖樣示意，不是任何層壓板品牌或型號的圖樣複製；未引用或打包外部圖樣。印花中心偏移與半長加起來小於半格，因此每個印花完全位於自己的格內且點只需查自己的格。預設0.6 m nominal tile、0.0008 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識星形與飛鏢尖，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`celticplait`（凱爾特雙帶編織浮雕示意）使目前目錄897→898種，含plain的gallery為899項。4條橫向雕刻帶，每條由兩根互相交織的緞帶（y＝±A·sin(2π·4u)，A＝0.052，緞帶半寬0.029）組成，每tile共8個交叉點；兩帶上升方向的那條在每個交叉點都在上方，使每根緞帶沿途交替「過／下」。緞帶有圓截面高度、中央細溝、對下方物件的接觸陰影（只降AO），條帶之間有兩條細軌線；底為凹下的石面，帶細顆粒。Metallic與mortar皆為0。

這是作者設計的簡化雙帶編織：不模擬凱爾特結常見的三帶以上結構、轉角或動物形；未引用或打包外部圖樣。每根緞帶以垂直偏移除以 √(1+斜率²) 近似垂直距離，是近似而非精確offset curve。預設0.5 m nominal tile、0.0042 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識中央細溝，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`garnetschist`（石榴石雲母片岩示意）使目前目錄898→899種，含plain的gallery為900項。底層是沿u拉長的波狀葉理：以週期雜訊對v做微擺，再疊粗細兩層（3×28與6×112格）value noise，另有稀疏的雲母亮點（224²雜訊門檻）。5×5格中約60%各有一顆石榴石斑晶：六邊形外形（以三個面法向投影的最大值為距離，內切半徑0.1–0.19格）、六個錐面各有獨立色調、中心較亮的冠部、凸起且較光滑、AO較低；兩側各有一個沿葉理方向拉長的淺色石英壓力影（長軸2倍半徑、短軸0.7倍）。深端色為暗紅褐，因此石榴石呈暗紅褐、片岩呈偏粉褐。Metallic與mortar皆為0。

這是作者設計的示意：石榴石為二維六邊形外形加六個錐面，不是真實十二面體／偏方三八面體晶形，葉理不會真的繞著斑晶彎曲，也不模擬雲母的方向性反光；單一色階只能近似紅色，不是光譜或礦物學測量。未引用或打包外部圖樣。每顆石榴石的外接圓與壓力影加上位置偏移都小於半格，因此點只查自己的格。預設0.4 m nominal tile、0.0035 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識六角外形，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`topographiccontours`（地形等高線圖示意）使目前目錄899→900種，含plain的gallery為901項。以三層週期value noise（3²、6²、12²格，權重0.5／0.3／0.2）合成平滑高程場f，每tile分16個等高距，圖面以淺米色紙為底、依高程做分層設色（每個等高距的底色變化為0.42/16），等高線取 |f − 最近等級| ÷ |∇f|（梯度以前向差分求得）作為空間距離，因此線寬不隨坡度變化；每第5條為較粗、較深的計曲線。另有細微紙張纖維雜訊。Metallic與mortar皆為0。

這是作者設計的示意：不是任何真實地形資料，也不含高程註記、河流、座標格網或圖例；梯度有下限避免平坦處線寬暴增，極近的等高線（陡坡）會因線寬而相連。預設1.0 m nominal tile、0.0012 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。每個像素需要三次高程場取樣（各三層噪聲），建議512以上辨識細線，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`digitalcamo`（數位像素迷彩示意）使目前目錄900→901種，含plain的gallery為902項。每tile 64×64個方形像素，每個像素有四個色階之一（暗橄欖、橄欖褐、卡其、沙色）；色階由兩層週期value noise（4²、12²）與每塊的雜湊抖動合成，約一半的像素改取其2×2父塊（32²）的值，使像素聚成較大的方塊。以該場所有像素值的四分位數作為門檻，因此四個色階各佔恰好四分之一的像素。上層是每tile 128×128緯經紗的平紋帆布織紋（色調±0.03、高度與AO變化）。Metallic與mortar皆為0。

這是作者設計的示意，不是任何軍用或商業迷彩圖樣的複製，也不代表可見光或近紅外偽裝效果；未引用或打包外部圖樣。預設1.0 m nominal tile、0.0007 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。每個sampler構造需排序4096個像素值（約毫秒級）；建議512以上讓每個像素至少8 px並看見織紋，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`radarscope`（雷達掃描顯示示意）使目前目錄901→902種，含plain的gallery為903項。每tile一個圓形雷達顯示（半徑0.46 UV），深綠黑底；5條等距距離環（外環較粗）、24條每15°的方位輻條（每第6條為較粗十字線）、一條由seed決定角度的亮掃描臂，其後1.3 rad以平方衰減的磷光餘暉，以及6個極座標隨機的亮點（餘暉越近越亮，最低保留40%亮度）。整體有192條水平掃描線的明暗調變與細微雜訊。Metallic與mortar皆為0。

這是作者設計的UI風格示意：不是任何雷達型號的畫面，不含文字、刻度數字或真實距離／方位意義；掃描臂在tile中固定，不隨時間移動。預設0.3 m nominal tile、0.0004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。每個像素最多迴圈6個亮點；建議512以上辨識細線與亮點，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`hazardstripes`（警示斜紋漆面剝落示意）使目前目錄902→903種，含plain的gallery為904項。45°斜向的黃黑警示條紋（a = u + v 的整數剪切，每tile 8道，即4黃4黑）塗在鋼板上；漆面被三項磨損得分剝落：96²雜訊碎屑、沿條紋方向拉長的刮痕（以 a = u + v、b = u − v 兩個整數剪切座標取192×10格雜訊），以及偏向條紋邊界的邊緣權重（邊緣0.3條寬內加0.35）。剝落處露出裸鋼：以既有mortar權重混入中性灰（153,153,139），同時metallic M mask與mortar為同一個磨損值（M1＝裸鋼、M0＝漆面）；漆面保持純黃／純黑基色，粗糙度黃0.45、黑0.62、鋼0.36，漆面比鋼高0.14，磨損邊緣的AO略暗。

這是作者設計的示意：不是任何標準（如OSHA、ISO 3864）規定的色彩或條紋比例，不含鏽蝕、焊縫、鉚釘或凹痕；裸鋼只用既有中性灰近似，不是合金或光學量測。未引用或打包外部圖樣。預設0.5 m nominal tile、0.0032 UV-relative relief（非公尺位移）與metallic factor 1；explicit `createMaterial({ metallic: 0 })`僅改scalar factor，不改stored M mask。沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識碎屑與刮痕，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`kiwislices`（奇異果切片示意）使目前目錄903→904種，含plain的gallery為905項。2×2格各有一片圓形奇異果切片（半徑0.42格，位置、尺寸92–100%與起始角各自微調）：綠色果肉帶64條放射狀淡色纖維（隨距果心漸暗），中央淡黃綠色果心圓（半徑0.115格），果心外兩圈暗色橢圓種子（內圈20顆於0.175格、外圈28顆於0.24格，內外圈錯開半個間距），外緣為帶細絨雜訊的暗褐果皮環（寬0.045格），切片之間是暗色空隙。種子凹陷、AO較暗，果心略低；果肉較平滑（roughness 0.24），果皮粗糙（0.9）。Metallic與mortar皆為0。

這是作者設計的示意，不是任何品種或切法的量測：種子數量與位置、纖維數與顏色皆簡化；未引用或打包外部圖樣。每片的半徑加位置偏移小於半格，因此點只查自己的格。預設0.25 m nominal tile、0.0018 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識種子與纖維，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`mandalaflower`（曼荼羅花形示意）使目前目錄904→905種，含plain的gallery為906項。每tile一朵以tile中心為圓心的花形（seed決定整體旋轉角），由外到內依序為：12瓣大蓮瓣（極座標玫瑰邊界 ρ＝0.30＋0.15·|cos(6θ)|^0.8）、36顆點環（半徑0.27）、24瓣外層花瓣（ρ＝0.12＋0.11·|cos(12θ)|^1.5）、12瓣內層花瓣（相位偏移半個瓣距）與中央圓心（半徑0.035）。每層都是填色區並有深色輪廓線（寬0.008），由外向內以畫家演算法覆蓋；底面凹下，後層較高。Metallic與mortar皆為0。

這是作者設計的簡化示意，不是任何宗教、傳統或文化的曼荼羅圖樣；未引用或打包外部圖樣。輪廓線寬是以「填色邊界ρ與邊界−寬度」之差取得的徑向寬度，不是垂直於邊界的距離。預設0.6 m nominal tile、0.0014 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。每個像素需要兩次三角函數（atan2與玫瑰邊界的cos）；建議512以上辨識內層花瓣與點環，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`needlepoint`（十字繡／針繡織錦示意）使目前目錄905→906種，含plain的gallery為907項。每tile 48×48針、沿(1,1)方向傾斜的半十字針腳（半寬0.27格、半長0.66格，兩端以4次方收尖，另有兩股絞線的明暗起伏），針腳之間露出深色畫布孔隙。色彩來自每tile 4×4個重複的12×12針母題：同心菱形環（環寬2針、三階色調循環）加上穿過母題中心的十字亮色重點，每針另有±0.03色調抖動。母題在x、y兩軸皆左右鏡像對稱。Metallic與mortar皆為0。

這是作者設計的簡化示意：不是特定針法（如Continental、Basketweave）或特定圖樣的量測，不模擬羊毛毛絨、畫布織紋細節或針腳背面。預設0.3 m nominal tile、0.0026 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓每針至少10 px，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`dicefaces`（骰子面示意）使目前目錄906→907種，含plain的gallery為908項。4×4個圓角方形象牙白面（半邊0.43格、圓角半徑0.11格，面緣有圓頂斜角，面間是暗色縫隙），每面依hash擁有1–6個凹陷圓點。圓點落在3×3格點上（間距0.255格、半徑0.078格），採標準中心對稱排列：1＝中心；2＝對角；3＝對角加中心；4＝四角；5＝四角加中心；6＝兩排各三顆；每面另隨機旋轉90°與鏡射，使2、3、6的方向不同。圓點是半球形凹陷（深度0.35，AO較暗）；面較光滑（roughness 0.3）而縫隙粗糙（0.9）。Metallic與mortar皆為0。

這是作者設計的示意，不是任何骰子製造商的規格；不模擬相對面點數和為7，也不區分左／右手骰子，因為這些屬於整顆骰子而不是單面貼圖。未引用或打包外部圖樣。預設0.4 m nominal tile、0.0034 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上辨識圓點邊緣，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`cinderblockwall`（混凝土空心磚牆）使目前目錄907→908種，含plain的gallery為909項。每tile 8皮×4塊，奇數皮向右錯開半塊的錯縫（running bond），比例為2:1的磚塊；灰縫寬0.0095 tile、凹陷，並以既有`mortar`通道填入中性灰漿色。磚面有每塊±0.08色調差、低頻雲狀色斑、160×160的骨料顆粒起伏、倒角斜邊，以及每tile約940個小氣孔（每個56×56格以0.3機率各放一個，半徑0.0025–0.0059 tile）。氣孔凹陷、色與AO較暗；Metallic為0。

這是作者設計的示意，不是特定CMU規格（如ASTM C90的尺寸、孔洞與面殼）的量測；不模擬空心磚孔洞、砂漿擠出、泛白（efflorescence）或油漆。預設1.6 m nominal tile、0.0038 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上才能看清氣孔，32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`moirefringes`（疊紋條紋）使目前目錄908→909種，含plain的gallery為910項。兩張透明細線格柵疊在一起：波向量為整數(24, 3)與(24, −3)（每tile 24條近垂直線、兩組傾角相反），線占比0.26，只有兩者都沒有墨線處才透光。兩組格柵的頻差(0, 6)形成每tile 6條水平疊紋帶（線重合處寬亮、交錯處密暗），頻和(48, 0)是另一組倍頻條紋；紙面另有256×256的低振幅纖維顏色／高度起伏。墨線微凸、略平滑；Metallic與mortar為0。

這是作者設計的光學示意，不是疊紋的物理模擬：沒有觀察者視角、相機取樣或螢幕子像素；疊紋是格柵乘積的數學結果。因為波向量是整數，兩格柵與其頻差、頻和在tile邊界皆連續。預設0.3 m nominal tile、0.0014 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓每條線至少約5 px，過低解析度或強縮小時貼圖自身會產生額外混疊疊紋；不宣稱本段已完成三backend或跨瀏覽器驗證。

`azulejotiles`（葡萄牙式彩繪瓷磚）使目前目錄909→910種，含plain的gallery為911項。每tile 4×4片相同的上釉方磚，磚間為0.012 tile寬的凹陷灰縫（使用既有`mortar`通道填入中性灰漿色）；每片是鈷藍對白釉的方形對稱圖樣：中央四瓣花（半徑0.15格、瓣幅0.055格）、半徑0.3格的細環、以及磚角四分之一圓盤（四片磚相接成完整圓，內含白色細環）。藍色有逐筆刷的明暗起伏，釉面另有每tile 28×28格的細微龜裂（craquelure）暗線；磚緣有倒角，釉面光滑（roughness 0.2）、灰縫粗糙。Metallic為0。

這是作者設計的示意，不是特定歷史圖樣或產地（如Delft或Talavera）的量測，沒有手繪筆觸的個別差異，每片磚都相同；磚面圖樣具完整正方形對稱，因此旋轉磚片在這個材質中看不出差別。預設0.8 m nominal tile、0.0022 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`tumblingblocks`（翻滾方塊／等角立方體拼布）使目前目錄910→911種，含plain的gallery為912項。每tile 7欄×8列的六角晶格，每個六邊形（尖頂、外接圓半徑1）被三條由中心射向上右、上左、下方頂點的射線切成頂面（亮，tone 0.92）、右面（中，0.62）與左面（暗，0.3）三個菱形，形成等角立方體錯視；每個面另有±0.06的逐塊色調抖動、帶細織紋的布面顆粒，以及面與面之間的細縫（深色、略凹、AO較暗）。六角晶格以一個六邊形中心對齊u=v=0；因為UV tile是正方形，晶格寬7√3與高12的比例約1.01，六邊形會有約1%的非等比拉伸。Metallic與mortar為0。

這是作者設計的拼布示意，不是特定被面圖樣的量測，沒有縫線、棉被填充或布料皺褶，也不模擬光照下立方體的真實立體感（亮暗面是貼圖色，不隨光向改變）。預設0.6 m nominal tile、0.0018 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`kilimflatweave`（基里姆平織地毯）使目前目錄911→912種，含plain的gallery為913項。每tile 48×48個織格，由上到下分為四條各12列的紋帶：階梯菱形（12格週期、左右上下鏡像、同心環階梯變色）、階梯鋸齒（週期6格、每列各半兩色）、橫條紋（十二列迴文：深、深、紅、紅、赭、白、白、赭、紅、紅、深、深）與十字（每個12×12母題中44格為十字色）。顏色為四階色調（靛、茜紅、藏紅花黃、未染羊毛白），每格有±0.025的染色抖動；weft-faced橫向緯紗肋（每格3道）與低振幅纖維色斑；相鄰格顏色改變處在格的左緣有0.14格寬的細縫（深色、凹陷、AO較暗），模擬平織地毯在色塊交界的垂直縫隙。Metallic與mortar為0。

這是作者設計的簡化示意，不是特定部族或產地基里姆的量測，也不宣稱圖樣出自傳統；沒有經緯紗交織細節、流蘇與磨損。四階色調是亮度而非色相（顏色由dark／light兩端線性插值）。預設1.2 m nominal tile、0.0022 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓每格至少約10 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`ean13barcodes`（EAN-13條碼標籤）使目前目錄912→913種，含plain的gallery為914項。每tile 4張橫向排列的條碼標籤，每張占滿tile寬（左右各9個模組的空白區加95個模組的條碼，共113模組），並依EAN-13規格編碼：左護線101、左側六個數字（依第一位數字的奇偶樣式選L或G碼）、中央護線01010、右側六個數字（R碼）、右護線101，第十三位為正確的檢查碼。條碼的12個數字由seed與列號決定（因此各列不同），不是註冊的商品編號，也沒有可讀數字文字。護線比數字條略長，條緣有柔邊，墨色有低振幅濃淡、紙面有細微纖維。Metallic與mortar為0。

這是作者設計的示意：圖樣依公開的EAN-13編碼表產生，使「掃描」判讀在結構上成立，但沒有量測列印品質（如ISO 15416等級）、條寬增益補償、可讀文字或前導數字；測試只驗證結構與檢查碼，沒有用實體掃描器或解碼函式庫掃描。預設0.35 m nominal tile、0.0012 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上讓每個模組至少約9 px；512時約4.5 px，邊緣柔化會占模組寬的一大部分；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`morsetape`（摩斯電碼紙帶）使目前目錄913→914種，含plain的gallery為915項。每tile 10行紙帶，每行64個時間單位寬，依各行hash自十個單字（SOS、XYZ、CAT、PLAY、HELLO、WORLD、LIGHT、ENGINE、SIGNAL、TEXTURE）選一個，以國際摩斯電碼拼出：點＝1單位、劃＝3單位、字內間隔1單位、字母間隔3單位，左側空白3單位，其餘留白使圖樣在tile邊界不被切斷。標記是圓端膠囊形、厚度1單位；每行中心有淡淡的導線，墨色有低振幅濃淡，紙面有細微纖維。Metallic與mortar為0。

這是作者設計的示意，不是某特定電報機紙帶規格的量測：沒有紙帶邊的鏈輪孔、墨線抖動或褪色；每行只有單一單字（不含字間隔7單位），單字表是固定的十個。預設0.4 m nominal tile、0.0016 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓每個單位約8 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`sandripples`（風成沙紋）使目前目錄914→915種，含plain的gallery為916項。整數波向量(18, 7)的一列沙紋，每tile約18道穿越u方向的波峰；波峰受兩組週期低頻噪聲（6×6與24×24格）彎曲，剖面不對稱：迎風坡占72%的相位、緩升，背風坡占28%、陡降，峰谷以平滑函數圓化。迎風坡色較亮、背風坡較暗並帶AO，另有384×384的砂粒起伏、約5%格子的亮色雲母／礦物斑點。Metallic與mortar為0。

這是作者設計的簡化示意，不是對特定沙丘的量測；沒有波峰分岔（bifurcation／defect）、沙丘尺度的大型形態、風向變化或濕沙。預設1 m nominal tile、0.006 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`frostpolygons`（凍土多邊形）使目前目錄915→916種，含plain的gallery為917項。每tile 8×8個抖動Voronoi多邊形（抖動0.7）的極地圖案地面：粉質土多邊形中心（略低、色調中等且有低頻雲狀變化），邊緣有一圈隆起的石環（rim，色調較暗，內有圓形卵石，半徑隨機、色調0.3–0.7），多邊形之間是窄而深的暗色冰楔裂溝（troughs，AO較暗）。多邊形邊界由兩個最近種子點的距離差近似，不是真正的邊緣距離，所以裂溝寬度在尖角處略有變化。Metallic與mortar為0。

這是作者設計的簡化示意，不是對特定凍土區（如北極多邊形土或石環）的量測，不模擬冰楔剖面、融凍循環、苔蘚或季節積雪；石環色調以隨機亮度表示，不含岩性。預設1.5 m nominal tile、0.012 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`datamatrixcodes`（Data Matrix二維碼標籤）使目前目錄916→917種，含plain的gallery為918項。每tile 3×3個18×18模組的ECC 200風格符號（每個符號四周有1模組空白區，共60×60模組）：左欄與底列為實心的L形尋邊圖樣（finder）、上列與右欄為交替的時序軌（clock track，上列在偶數欄為深色、右欄由底往上在偶數步為深色，因此右上角為淺色），內部16×16資料區的每個模組依seed以約50%機率塗墨。模組為方形、邊緣略柔化（只在與不同狀態的相鄰模組之間），相鄰深色模組連成實心；墨色有低振幅濃淡、紙面有細微纖維。Metallic與mortar為0。

這是作者設計的示意：finder與clock track依Data Matrix的結構繪製，但資料區是隨機位元，不是依ECC 200編碼出的碼字（沒有資料、Reed-Solomon糾錯或碼字擺放），因此不可被掃描解碼，也沒有用任何掃描器或解碼函式庫驗證；測試只驗證finder／clock／空白區與資料區大致密度。預設0.4 m nominal tile、0.0012 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上讓每個模組約17 px；512時約8.5 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`ecgpaper`（心電圖記錄紙）使目前目錄917→918種，含plain的gallery為919項。每tile 80 mm見方的粉紅記錄紙：1 mm細格線與每5 mm的粗格線（紙面色調0.96、細線0.84、粗線0.68），以及4行心電圖描線，每行高20 mm、含4個心搏（每搏20 mm，以25 mm/s計約0.8 s、75 bpm）。每搏由P波、Q波、R波、S波與T波的高斯和構成（P＋0.9 mm、Q −0.8 mm、R ＋7 mm、S −1.8 mm、T ＋1.7 mm），每搏振幅有±6%抖動，另有0.25 mm、整個tile一個週期的基線漂移。描線為深色墨線，半寬0.2 mm，線寬以「垂直偏移除以√(1＋斜率²)」的一階近似計算，所以在R波這種極陡的尖峰處，墨線在垂直方向會比0.2 mm粗得多（實測R波墨跡頂端約高出基線8.3 mm，高於7 mm的設定振幅）。Metallic與mortar為0。

這是作者設計的示意，不是任何真實心電圖的記錄或診斷資料；沒有導程標籤、校準方波、心率變異、雜訊或病理波形，十二導程排版也未模擬。預設0.08 m nominal tile（80 mm見方，剛好對應記錄紙的實際毫米）、0.0012 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上讓1 mm格約12.8 px；512時約6.4 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`sheetmusic`（樂譜）使目前目錄918→919種，含plain的gallery為920項。每tile 8行五線譜（行距0.125 tile、線間距1/64 tile），每行16拍、每4拍一條小節線；每拍一個音符，音高由hash落在五線譜內的9個半線距位置（下加一間到上加一間，不含加線），音符頭為傾斜橢圓，其中約30%是空心（二分音符樣式），其餘實心（四分音符樣式）。符桿依記譜規則：低於第三線者（位置＜4）符桿向上、畫在符頭右側；第三線及以上者向下、畫在左側，長度3.5線距。墨色有低振幅濃淡，紙面有細微纖維。Metallic與mortar為0。

這是作者設計的示意，不是任何樂曲：沒有譜號、拍號、調號、符尾、連桁、休止符、時值對應的間距或歌詞，空心音符也不改變拍數（每個音符仍佔一拍的位置），因此不可演奏。預設0.3 m nominal tile、0.0014 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上讓線距約16 px；512時約8 px、符桿只有約0.8 px寬，會變得很淡；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`sudokugrid`（數獨格）使目前目錄919→920種，含plain的gallery為921項。每tile一個9×9的數獨盤面，細線分隔每格（半寬0.018格）、粗線分隔3×3宮（半寬0.04格）。每格依seed以約42%機率顯示一個提示數字，數字以3×5點陣字型（每個點0.135格）畫成像素風格。提示來自一個隱藏的完整解：以標準樣式經過數字重排、宮帶與宮內列／行的置換產生，這些置換都保留數獨規則，所以任何一列、一行、一宮內的提示都不會重複。墨色有低振幅濃淡，紙面有細微纖維。Metallic與mortar為0。

這是作者設計的示意：提示是完整解的隨機子集，不保證只有唯一解，也不是難度分級的謎題；字型是3×5點陣而非真實印刷字體。預設0.25 m nominal tile、0.0014 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓每格約57 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`measuringtape`（卷尺）使目前目錄920→921種，含plain的gallery為922項。每tile 160 mm見方（16 cm寬）、8條黃色卷尺條帶（每條高20 mm）：每1 mm一條短刻度（長4 mm）、每5 mm一條中刻度（6.4 mm）、每10 mm一條長刻度（9.2 mm、略粗），條帶上下緣有深色邊線；每公分的刻度右側以3×5點陣字型（每點1.1 mm）標示該公分序號0–15（兩位數時並排）。墨色有低振幅濃淡，卷尺面有細微顆粒。Metallic與mortar為0。

這是作者設計的示意：只是一段重複的0–15 cm刻度，不是任何卷尺標準（如公制公差等級）的量測；沒有英寸刻度、金屬捲尺的彎曲、字型粗細或磨損。標示值固定為本段的公分序號，tile邊界處15與0銜接。預設0.16 m nominal tile（對應實際的160 mm）、0.0018 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上讓1 mm約6.4 px；512時1 mm只有約3.2 px，刻度會相當細；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`calendarpage`（月曆頁）使目前目錄921→922種，含plain的gallery為923項。每tile一頁7欄×6列的月曆格，每格左上角以3×5點陣字型標示日期，細線分格、tile外框較粗，第一欄與最後一欄（週末）紙面略深。每個seed決定一個月：從哪一欄開始（0–6）與天數（28–31），日期依閱讀順序從1連續增加到月底，其餘格留白。Metallic與mortar為0。

這是作者設計的示意：沒有星期標題列、月份名稱、年份、節日或手寫備註，也不對應任何真實的月份，只是任選的起始欄與天數；格內只有日期數字。預設0.3 m nominal tile、0.0014 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓每格約73 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`fretboard`（吉他指板）使目前目錄922→923種，含plain的gallery為924項。每tile涵蓋一個八度（從琴枕到第12格）的深色玫瑰木指板：品絲位置依十二平均律，第n品在音階長度的 1−2^(−n/12) 處，以第12品（音階一半）正規化到u=1，因此與下一個tile的琴枕（u=0）銜接；每品的間距是前一品的 2^(−1/12)≈0.944 倍。6條琴弦沿u方向、均勻分布在寬度上，半寬由0.0022（高音側）漸增至0.0075（低音側），琴弦旁有淡淡的陰影；第3、5、7、9品的中點各有一顆珍珠色圓點，第12品中點是上下對稱的雙點。木紋沿u方向拉長。Metallic為0（品絲與琴弦只用亮度與粗糙度表現，不是金屬遮罩）。

這是作者設計的示意：不是特定琴款的量測；音階長度被正規化，因此只有「品絲間距比例」而沒有真實的毫米尺寸；沒有指板弧度（radius）、琴頸斜度、琴弦凹陷或磨損，也不模擬品絲與琴弦的金屬反射（它們只是較亮、較光滑的非金屬）。預設0.32 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上讓品絲約3.6 px寬；512時約1.8 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`crosswordgrid`（填字遊戲格）使目前目錄923→924種，含plain的gallery為925項。每tile一個15×15的填字格：由seed決定、約17%為黑格，生成時每次成對加入180°旋轉對稱的黑格，並檢查規則，只接受「每個橫向與縱向的白格連續段至少3格」且「所有白格相連」的結果。白格中起始橫向或縱向單字的格子依閱讀順序標示標準編號（1、2、…；以3×5點陣字型畫在格子左上角），其餘白格留白，黑格為墨黑；細線分格。Metallic與mortar為0。

這是作者設計的示意：格子只是空白填字格，沒有答案字母、提示文字或粗外框，也不保證有可填入的詞表；規則與編號只在單一tile內成立，tile重複時相鄰tile邊緣的白格連續段會跨過tile邊界，所以重複後並不是一個合規的大型填字格。預設0.3 m nominal tile、0.0014 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上讓每格約68 px（編號像素約3.4 px）；512時每格約34 px，編號會相當小；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`flipdotdisplay`（翻轉點陣顯示器）使目前目錄924→925種，含plain的gallery為926項。每tile 48×48個圓盤，黑色面板上每個圓盤半徑0.42格：亮起的為黃色（tone 0.92，較光滑、略凸並帶左上高光與中心軸點），熄滅的為深灰黑（0.14）。整個盤面是12欄×8列的數字，每個數字佔4×6個點，以3×5點陣字型亮起並在右側與下側各留一點空白，數字內容由seed決定（0–9）。面板有細微顆粒、圓盤之間有較暗的AO。Metallic與mortar為0。

這是作者設計的示意：沒有翻盤動畫、磁性翻轉的雙穩態、盤面反面（黑／黃）的厚度或機械間隙的細節；數字只是隨機序列，沒有時鐘、站名或其他語意。預設0.5 m nominal tile、0.003 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上讓每個圓盤約21 px；512時約11 px，高光與軸點會很小；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`minesweeperboard`（踩地雷盤面）使目前目錄925→926種，含plain的gallery為927項。每tile一個24×24的踩地雷盤面：每格依seed以16%機率藏一顆地雷（地雷本身不顯示），盤面以環面（torus）計算相鄰地雷數，所以tile邊緣相接時沒有接縫。從7個安全的「0」格開始洪水式揭開（0格會揭開全部8個鄰格），已揭開的格子是平坦、較暗、帶細格線，有相鄰地雷時以3×5點陣字型畫出1–8；未揭開的格子是凸起的按鈕，左上有亮斜角、右下有暗斜角。Metallic與mortar為0。

這是作者設計的示意：盤面沒有旗標、問號、爆炸的地雷或數字顏色（顏色是亮度而非色相）；未揭開區域底下的地雷位置固定但看不見，所以畫面只保證「必要條件」的一致性（見ACCEPTANCE），不保證唯一可解。因為相鄰關係在tile邊界環繞，這不是標準的有邊界踩地雷盤面。預設0.4 m nominal tile、0.003 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上讓每格約43 px；512時約21 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`tetrisstack`（俄羅斯方塊堆疊）使目前目錄926→927種，含plain的gallery為928項。每tile一個16×16的方塊井：依seed隨機嘗試放置七種四格方塊（I、O、T、S、Z、J、L）的隨機旋轉，只接受完全在井內且不重疊的放置，所以每個方塊恰好4格；七種方塊各用一個色調（0.9–0.2的七階亮度）、每格有斜角與高光，不同方塊之間有深色輪廓線（相同種類相鄰的兩個方塊也被輪廓分開），未被佔用的格子是近黑色的深洞。Metallic與mortar為0。

這是作者設計的示意：不是實際遊戲盤面——沒有重力、消行、下落、遊戲規則，也沒有保證「可由遊戲自然堆疊出來」，只是隨機的非重疊放置；色調是亮度而非遊戲的標準色相。tile邊緣的方塊不會跨越邊界，所以重複時相鄰tile的方塊只是並排。預設0.4 m nominal tile、0.0035 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓每格約32 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`battleshipgrid`（海戰棋盤）使目前目錄927→928種，含plain的gallery為929項。每tile一個10×10的海戰棋盤：藍灰色水面與細格線，以及一支由5、4、3、3、2格組成的艦隊，每艘船是一條直線的深色船體（相鄰格合併成一塊圓角板、與水面交界內縮），船與船之間即使在角落也不相接；每個格子依seed以約32%機率被射擊：射中船的格子有深色圓釘（命中），射中水面的格子有近白圓釘（落空）。Metallic與mortar為0。

這是作者設計的示意：沒有座標標示、沒有沉船或艦種造型，也不保證這個射擊紀錄在實際對局中可能出現（隨機射擊，不是依序輪流）；船隻位置在每個seed固定。tile重複時每塊棋盤是獨立的一局，船隻不會跨越邊界。預設0.4 m nominal tile、0.003 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓每格約51 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`hilbertcurve`（希爾伯特曲線）使目前目錄928→929種，含plain的gallery為930項。每tile一條4階的希爾伯特空間填充曲線，穿過16×16=256個格子的中心：以標準的索引轉座標演算法產生，從左上角格開始、在右上角格結束，相鄰索引的格子以線段相連，其餘相鄰格子之間沒有線。線寬0.28格，色調沿曲線索引由深靛（0.08）漸變到灰（0.55），紙面有細微纖維、墨色低振幅濃淡。起點與終點的格子各向tile邊緣外伸出半格線段，因此水平重複時上一個tile的終點與下一個tile的起點接成一條連續曲線；垂直方向的tile不相連。Metallic與mortar為0。

這是作者設計的示意：色調在tile接縫處由最淺跳回最深（索引0與255之間有色調不連續），這是刻意保留的；沒有標示起點終點的記號，也不是其他階數或其他空間填充曲線。預設0.3 m nominal tile、0.0014 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓每格約32 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`mondriancomposition`（蒙德里安式構圖）使目前目錄929→930種，含plain的gallery為931項。每tile一幅由遞迴二分割產生的矩形構圖：前兩層一定分割，之後每個矩形以80%機率繼續分割（最深5層、最小邊長0.14 tile），分割線每次只橫跨被分割的那個矩形（與畫作相同），分割比例在35%–65%之間；tile邊緣也有一圈黑框，使構圖封閉且重複時連續。黑線半寬0.0075 tile，矩形各以六個色階中的一個填色（0.97三份、0.62、0.4、0.78，因此白色矩形占約一半），畫布有細微顆粒、有色矩形另有筆觸濃淡。Metallic與mortar為0。

這是作者設計的示意：不是蒙德里安作品的複製，也沒有紅、藍、黃三原色——填色只是亮度（顏色由dark／light兩端線性插值，所以呈灰階）；分割規則與比例是作者設定的。預設0.6 m nominal tile、0.0016 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓黑線約3.8 px寬；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`lissajousgrid`（李沙育圖形表）使目前目錄930→931種，含plain的gallery為932項。每tile一張4×4的示波器風格李沙育（Lissajous）圖形表：第(欄, 列)格畫出參數曲線 x = A·sin(a·t + π/2)、y = A·sin(b·t)，頻率 a = 欄 + 1、b = 列 + 1（A = 0.4格，t為0到2π、以160段折線近似），所以由1:1的圓到4:4共16種比例，a與b有公因數時曲線會重複描繪、a = 2b 等情況會退化成拋物線弧。線條為亮綠（線半寬0.014格）並帶柔和光暈，面板有深綠色底、淡淡的格框與中心十字刻度，另有細微顆粒。Metallic與mortar為0。

這是作者設計的示意：沒有示波器的螢幕曲率、光暈拖尾、掃描線或讀數文字，相位固定為π/2（不隨格子變化），顏色只是由dark／light兩端線性插值的綠色調。預設0.4 m nominal tile、0.002 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；每個取樣點要檢查160段折線，成本較其他材質高：單次本機Bun量測512²取樣約155 ms（同一次量測中tumblingblocks約56 ms、brick約17 ms；不是基準測試，也沒有量測瀏覽器或Worker）；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`zoneplates`（菲涅耳波帶片）使目前目錄931→932種，含plain的gallery為933項。每tile 2×2片波帶片，每片14個環帶，第k個環帶的外緣半徑為 R·√(k/N)（R = 0.42格、N = 14），這是菲涅耳波帶片的半徑律（各環帶面積相等）；偶數環帶（含中央圓）透明（淺色），奇數環帶不透明（近黑色），最外的第14環不透明並接中灰色底板；波帶片外緣另有一圈淺灰色固定環。環帶邊緣略有柔化，底板與環有細微顆粒。Metallic與mortar為0。

這是作者設計的示意：只依半徑律繪製波帶片的幾何，不模擬繞射、焦點、波長或強度分布；環數、尺寸是正規化的（R與N固定），不對應真實的設計波長與焦距。預設0.2 m nominal tile、0.0022 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上讓最外圈的環帶（約0.015格寬）約8 px；512時約4 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`backgammonboard`（西洋雙陸棋盤）使目前目錄932→933種，含plain的gallery為934項。每tile一張棋盤：外框內分成左右兩半、每半6個「點」（三角形），中間是較暗的中央隔條（bar）；上排12個三角形尖端向下、下排12個尖端向上，各側色調交替（0.52與0.34），上下兩排相差一格；三角形長度為棋盤高的40%。每方15顆棋子（淺色與深色），隨機放在24個點上，每點最多疊5顆且只放同一種顏色，從棋盤邊緣往中間疊，棋子有邊緣高光與略微凸起。Metallic與mortar為0。

這是作者設計的示意：棋子是「合法的隨機擺放」，不是標準開局或任何實際對局的局面，也沒有骰子、倍率骰、被吃掉棋子放在隔條上或已移出棋盤的棋子；總數固定為每方15顆，因此每個seed中棋子都全部在點上。tile重複時每張棋盤是獨立的一盤。預設0.6 m nominal tile、0.003 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓棋子約34 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`jigsawpuzzle`（拼圖）使目前目錄933→934種，含plain的gallery為935項。每tile一幅6×6片的環面拼圖：每片以格為基礎，格與格之間的每條邊各有一個圓形凸塊（bulb，半徑0.115格、頸部半寬0.05格、凸出0.15格），凸塊屬於哪一邊由seed隨機決定、嵌入另一邊，因此相鄰的兩片必然一凸一凹地咬合；邊緣在tile邊界環繞，所以重複的拼圖是連續的。每片以細線與微小斜角分隔，畫面是低頻雲狀「圖像」明暗（6×6格）加48×48格的細節與逐片±0.06的色調差、顆粒。Metallic與mortar為0。

這是作者設計的示意：凸塊形狀是圓形加直頸，不是真實拼圖刀模的曲線；沒有卡紙厚度、印刷圖案內容或背面。每片的面積因凸塊與凹槽而略有不同（凸塊、凹槽成對抵消時與一格相同）。預設0.5 m nominal tile、0.0026 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上讓每片約170 px、切線約5 px；512時切線約2 px；每個取樣點要做約40次擁有者判定，成本較高：單次本機Bun量測512²取樣約226 ms（同次量測lissajousgrid約122 ms、tumblingblocks約45 ms、brick約16 ms；非基準測試，未量測瀏覽器或Worker）；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`ramennoodles`（拉麵麵條）使目前目錄934→935種，含plain的gallery為936項。每tile 22條沿u方向的波浪形麵條，由上到下疊放，後面的麵條蓋在前面的上面：第i條的中心線是 y = (i + 0.5)/22 + 0.085·sin(2π(k·u + 相位))，k依序取3、4、5，相位以黃金比例（i×0.618…取小數）決定，所以每個seed的麵條形狀相同、只有色調與顆粒隨seed變化；麵條半寬0.026，剖面為圓管（中心線亮、邊緣暗並降低高度與環境遮蔽），逐條有±0.06的色調差，麵條之間約7%的面積露出深色湯面。Metallic與mortar為0。

這是作者設計的示意：沒有捲曲的麵條、斷裂、油花、配料或湯汁的反光；因為麵條都是波浪形且逐條固定層次，看起來較規則。波浪的距離採一階近似（垂直偏移除以√(1＋斜率²)），在波峰斜率大處條寬略有誤差。預設0.3 m nominal tile、0.01 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；每個取樣點要檢查22條麵條，成本中等（單次本機Bun量測512²取樣約200 ms，非基準測試）；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`connectfourboard`（四子棋盤）使目前目錄935→936種，含plain的gallery為937項。每tile一張7欄×6列的四子棋盤，下方再加一列底座：藍色面板上有圓孔，孔內是深色（空）、第一位玩家的圓盤（中間色調）或第二位玩家的圓盤（近白色），圓盤有內環與略凸的邊。盤面依seed模擬一局合法的遊戲：兩位玩家輪流在隨機欄位投入圓盤（第一位先手），圓盤因重力從底部往上堆，每次落子若會形成四連線就改選別欄；落子數在18–30之間。因此每欄圓盤由底部連續向上，第一位玩家的圓盤數比第二位多0或1，且沒有任何一方已連成四子。Metallic與mortar為0。

這是作者設計的示意：沒有真實的紅、黃色（顏色是以dark／light兩端線性插值的亮度，所以第一位玩家是中間藍灰色、第二位玩家是近白色）；這是隨機合法局面，不是策略對局，也沒有保證可由雙方「合理」下出來。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓每個孔約73 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`bingocard`（賓果卡）使目前目錄936→937種，含plain的gallery為938項。每tile 6×6格，左側5欄×6列是一張賓果卡：第一列是淡灰底的「B I N G O」標題（3×5點陣字型），其下5列各格依標準範圍填入數字——B欄1–15、I欄16–30、N欄31–45、G欄46–60、O欄61–75，同一欄內數字互異且由seed隨機選取；中央格（N欄第三列）是空格「free space」，以灰色圓點標示；約25%的數字格被畫上圓圈標記（daub）。卡片外框較粗；右側第六欄是空白邊距，使重複時卡片之間有間隔。Metallic與mortar為0。

這是作者設計的示意：卡上的數字不代表任何實際叫號的狀態（圓圈標記是隨機的，不保證與任何叫號序列一致，也不判斷是否已連線）；字型是3×5點陣，沒有印刷的圖案、卡號或廣告。標題的字母B、I、N、G、O在字型中以點陣近似。預設0.3 m nominal tile、0.0014 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓每格約85 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`pegsolitaire`（單人跳棋／孔明棋）使目前目錄937→938種，含plain的gallery為939項。每tile一張7×7格的英式十字棋盤：四個2×2角落是無孔的實木，其餘33格是孔，孔內為深色（空）或淺色的圓頭木釘（有高光與小圓頂）。盤面由seed從「中心只剩一顆木釘」的終局出發，隨機倒著玩8步（每次倒推的跳躍把「釘、空、空」的直線變成「空、釘、釘」）：因此畫面上的局面（9顆木釘，若嘗試次數用完則較少）必定可由正向跳躍解到只剩一顆。木板有沿u方向拉長的木紋。Metallic與mortar為0。

這是作者設計的示意：局面只保證「可解」（由倒推產生），不保證是最短解或具代表性的謎題；只畫英式33孔棋盤，不含法式37孔或其他變體；顏色是由dark／light兩端線性插值的亮度，所以木釘是淺黃褐色而不是特定顏色。預設0.35 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上讓每格約73 px；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`xylophonebars`（木琴音條）使目前目錄938→939種，含plain的gallery為940項。每tile 12根並排的木音條（一個八度的十二個半音），均以tile中線為中心；第一根最長（0.9 tile），之後每根為前一根的 2^(−1/24) ≈ 0.9715 倍——調音音條的頻率與長度平方成反比，一個十二平均律半音（頻率比 2^(1/12)）因此使音條縮短 2^(−1/24)，十二個半音（一個八度）縮短為 2^(−1/2)。每根音條在距兩端22.4%（自由—自由梁第一振動模態的節點位置）處各有一個懸掛孔，相鄰音條的孔以細線（繩）相連；木紋沿音條長度方向，音條色調由長到短略為變淺，背景是深色毛氈。Metallic與mortar為0。

這是作者設計的示意：只依「長度比與節點位置」繪製，沒有考慮音條的厚度、寬度或截面（真實木琴音條常有下凹以微調泛音），也不模擬共鳴管；繩子是孔洞之間的直線，在tile接縫（最後一根到下一個tile的第一根）處折回，是刻意保留的不連續。預設0.4 m nominal tile、0.0035 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`sliderulescale`（計算尺刻度）使目前目錄939→940種，含plain的gallery為941項。每tile疊8條象牙色底的對數C尺，一個「十進位」橫跨整個tile寬：刻度值x畫在u = log10(x)，因此10與下一個tile的1重合、tile可無縫重複。刻度依常見規則：[1,2)每0.02、[2,4)每0.05、[4,10)每0.1，共150條，長度分三級——整數（9條，最長）、十分位（[1,4)的整十分位，與[4,10)的整半）共33條中等、其餘108條最短；每個整數刻度右側有3×5點陣的數字1至9。每條尺上下各有一條細橫線，墨色略有濃淡，紙面有細紋。Metallic與mortar為0。

這是作者設計的示意：只畫C尺的單一十進位，不含其他尺（A／B／D／CI／K／S／T／L）、游標、運算標示或字樣；數字用3×5點陣而非印刷字型；刻度規則採常見分段，並非特定廠牌型號的重現；顏色是線性亮度插值（象牙底＋近黑墨），不代表真實材質的色相。預設0.25 m nominal tile、0.002 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上（細刻度的間距在u上最小約0.0044）；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`spirographrosettes`（繪圖尺花紋）使目前目錄940→941種，含plain的gallery為942項。每tile四個象限各畫一條內擺線（hypotrochoid，小齒輪在大環內滾動、筆離齒輪中心一段距離所畫出的曲線），環／齒輪半徑比依序為5/3、8/3、7/2、9/4，因此各有5、8、7、9個花瓣（R與r互質時，瓣數等於R），曲線在 t 走完 2π·r／gcd(R,r) 後閉合。筆距依seed與象限在齒輪半徑的0.37至0.73倍之間浮動、整條花紋再依seed旋轉；筆尖永遠剛好碰到外圈（半徑0.215 tile），因此瓣尖落在同一個圓上。四個象限的墨色亮度略有不同，紙面有細紋。Metallic與mortar為0。

實作上，曲線在建立取樣器時以約10.8萬個點蓋印進一張640×640的Float32墨跡遮罩（約1.6 MB，每個取樣器各一份），之後每個取樣只做雙線性查表；遮罩解析度固定為640，所以tile超過640 px時線條會被雙線性放大而稍微變軟，不會變得更銳利。

這是作者設計的示意：只畫四種固定的環／齒輪比（不是一般的任意R、r），曲線是均勻取t的折線點陣（9000點每圈，並非精確距離場）；顏色是亮度插值（近黑墨＋米白紙），不代表筆的色相。預設0.3 m nominal tile、0.0012 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512至1024；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`juliacells`（Julia集合方格）使目前目錄941→942種，含plain的gallery為943項。每tile四個象限各畫一個填充Julia集合 z → z² + c，c取實數（約−0.4、−0.75、−1.0、−1.25，各依seed在±0.04內抖動；實數c落在[−2, 1/4]時集合連通，且圖形對x、y軸都鏡像對稱）。每格視窗半徑2，等於逃逸半徑，所以格子邊界上的點一開始就逃逸，格與格之間及tile重複處沒有接縫。集合內部（96次疊代仍未逃逸）為近黑，外側依平滑逃逸次數 μ = n + 1 − log₂(ln|z| / ln 2) 以 1 − exp(−μ/9) 發出由暗到亮的光暈；height與roughness隨同一個光暈變化。Metallic與mortar為0。

這是作者設計的示意：只有四個實數參數的Julia集合，沒有Mandelbrot集合或複數c（複數c不鏡像對稱，會在tile邊界產生接縫）；疊代上限96，所以邊界附近緩慢逃逸的點會被畫成內部；顏色是亮度插值（深藍近黑到暖米色），不代表任何特定配色。預設0.4 m nominal tile、0.0035 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`nonogrampuzzle`（數織）使目前目錄942→943種，含plain的gallery為944項。每tile是一張12×12格的版面：右下8×8是已解開的圖形（約55%的格子填成深色方塊，由seed決定），左側4欄與上方4列是各行各列的連續填格長度提示（run-length clues），以3×5點陣數字（0至8）印在灰底的提示格內，列提示靠右對齊緊貼圖形、行提示靠下對齊；全空的行列印「0」；左上角4×4為空白紙面。圖形格線每5格一條較粗的分組線，外框也較粗。提示與圖形由同一份填格資料算出，因此一定互相一致。Metallic與mortar為0。

這是作者設計的示意：圖形是隨機填格，不保證有唯一解（真正的數織謎題需要唯一解，這裡只是畫出「已解開的版面」）；固定8×8、最多4個提示（8格最多4段連續區）；數字只有單一位數；顏色是亮度插值（近黑墨＋米白紙），不代表任何印刷色。預設0.36 m nominal tile、0.0016 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上（每格約43 px）；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`lightsoutboard`（Lights Out 熄燈遊戲）使目前目錄943→944種，含plain的gallery為945項。每tile一塊5×5的按鈕盤：圓角方形按鈕，亮燈的是帶高光與中心光暈的暖黃色、熄滅的是暗褐色，按鈕之間是深色塑膠框；亮燈的按鈕略為下陷、表面較光滑。亮燈圖樣是從「全暗」開始，按下seed隨機選出的約40%按鈕（每次按下會翻轉該鈕與上下左右鄰居）所得到的結果，所以這個局面必定可解——5×5的熄燈遊戲隨機亂擺的盤面只有四分之一可解。Metallic與mortar為0。

這是作者設計的示意：只有5×5的標準規則（不含其他尺寸或變體），畫的是靜態局面，沒有按鍵順序或解答提示；亮燈的顏色是亮度插值（近黑到暖黃），按鈕沒有對應真實硬體的材質。預設0.25 m nominal tile、0.003 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議256以上（每鈕約51 px）；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`weavingdraft`（織造圖解）使目前目錄944→945種，含plain的gallery為946項。每tile 16×16格，畫出四綜（4 shafts）織機的完整織造圖解：左上12×4是穿綜圖（threading，每條經線穿過哪一片綜，每欄一個記號，1號綜在最靠近織紋的那一列）、右上4×4是踏板連綜表（tie-up，每個踏板抬起哪些綜）、右下12×4是踩踏順序（treadling，每一梭踩哪個踏板，每列一個記號）、左下12×12是由三者推得的織紋圖（drawdown）：深色格表示該經線在這一梭浮在上面（它的綜被抬起），淺色格表示緯線在上。穿綜與踩踏由seed隨機決定，每個踏板抬起非空且非全部的綜（1至3片），因此織紋由規則完全決定。Metallic與mortar為0。

這是作者設計的示意：只畫四綜、四踏板、12×12的升梭（rising shed）慣例，穿綜與踩踏是隨機的，不是傳統的斜紋或緞紋規則，所以織紋看起來可能不整齊；沒有紗線顏色（深／淺只是「經浮／緯浮」）、也沒有織縮或實際組織的立體感；顏色是亮度插值（近黑墨＋米白紙），不代表任何紗線色相。預設0.4 m nominal tile、0.0018 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上（每格32 px）；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`scrambledcubenet`（打亂的魔術方塊展開圖）使目前目錄945→946種，含plain的gallery為947項。每tile是一張14×14格的紙面，中央是3×3×3魔術方塊的十字形展開圖（上、左、前、右、後、下六面，共54顆貼紙，12×9格），貼紙是圓角方塊、嵌在黑色塑膠本體上；六面的顏色以六個亮度（0.24至0.95）表示。方塊由seed隨機做22次外層四分之一轉（旋轉三維座標與法線，不是隨機填色），所以畫面一定是合法、可還原的方塊狀態：每個亮度恰有9顆貼紙、六個中心貼紙各是一個亮度、12個邊塊與8個角塊各出現一次且不會有相對面的顏色配在同一塊。Metallic與mortar為0。

這是作者設計的示意：展開圖的方向是常見的十字展開（U在F上方、D在F下方、L／R／B在F兩側與後方），不是任何特定轉法記號；顏色只是亮度，不是真實魔術方塊的色相，六個亮度間距約0.12至0.16，在小尺寸下較不易分辨；沒有立體魔術方塊的形狀；22次隨機四分之一轉並不保證達到均勻隨機狀態。預設0.4 m nominal tile、0.0028 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上（每格約37 px）；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`knightstour`（騎士巡邏）使目前目錄946→947種，含plain的gallery為948項。每tile一張8×8西洋棋盤，淺深兩色交錯，每個格子以3×5點陣數字（1至64）依序標出一條開放的騎士巡邏路線（騎士每步走「日」字，且不重複走過任何格子），並以淡色細線把相鄰編號的格子中心連起來。路線在建立取樣器時以深度優先搜尋產生：每一步優先選「下一步可走格數最少」的格子（Warnsdorff規則），同分時由seed決定，每次嘗試有節點預算（40000），失敗就換起點重試（最多60次）；起點與路線隨seed而異。Metallic與mortar為0。

這是作者設計的示意：只畫開放路線，不要求能回到起點（不是閉合的巡邏）；沒有棋子；細線在tile內與數字相交時會與數字重疊（數字畫在線上）；路線搜尋是以搜尋預算的啟發式，並非窮盡——本次在600個seed上實際都找到了完整的64步路線（單次建立最久約49 ms，一次性本機量測，非基準），但並未證明任何seed都必定成功；若全部60次嘗試都失敗，已走過的格子會有編號、未走過的格子則是空白（本次未遇到）。顏色是亮度插值（棋盤的淺深米色與近黑墨），不代表真實棋盤材質。預設0.4 m nominal tile、0.0022 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上（每格64 px）；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`graycodediscs`（格雷碼編碼盤）使目前目錄947→948種，含plain的gallery為949項。每tile四個象限各有一片光學編碼盤（optical rotary encoder disc），分別有3、4、5、6條同心軌道（8、16、32、64個扇區）：扇區從+u方向起、朝+v方向（螢幕上順時針）編號，第k條軌道（由外往內數，最外圈是變化最快的第0位元）在該扇區格雷碼 g = s XOR (s >> 1) 的第k位元為1時是亮色的透光槽、為0時是暗色的遮光塊，所以相鄰兩個扇區（包含最後一個接回第0個）恰好只有一條軌道不同。圓盤外緣有細的扇區刻線，中央有一個深色軸孔，盤外是中灰色墊面。Metallic與mortar為0。

這是作者設計的示意：軌道數固定為3、4、5、6（不隨seed改變，seed只影響墊面的細微顆粒），各軌等寬、沒有光電感測器、遮光罩或軸；亮色代表透光、暗色代表遮光只是亮度的約定，不是實際光學材質；顏色是亮度插值。預設0.35 m nominal tile、0.0028 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上（64扇區的盤在512 px下每個扇區在最外圈約3 px寬）；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`code39barcodes`（Code 39條碼）使目前目錄948→949種，含plain的gallery為950項。每tile 6列條碼，每列是 `*XXXXX*`：起訖字元 `*` 夾著由seed隨機選出的5個字元（0至9、A至Z、`-`、`.`）。每個字元由9個元素（5條黑條、4個空白，黑條開頭）組成，其中恰好3個為寬（寬度為窄的3倍），6個為窄；字元之間隔一個窄空白，前後各有10個窄單位以上的靜區（quiet zone）。紙面為米白、黑條帶些微墨色濃淡與顆粒。Metallic與mortar為0。

編碼表是照記憶輸入，並用Wikipedia〈Code 39〉描述的結構規則（兩條寬黑條以權重1、2、4、7、0相加編為1至10，四個空白中恰有一個寬者選擇「U–Z加符號／數字／A–J／K–T」四組之一）在測試端獨立解碼回來，確認38個資料字元與起訖符號 `*` 的圖樣全部符合該規則；但沒有拿真實的條碼掃描器或ISO/IEC 16388標準全文比對，也沒有實際掃描過這些條碼。

這是作者設計的示意：不含Code 39的檢查碼（該符號本來就沒有必要檢查碼）、不含`$`、`/`、`+`、`%`與空白這五個字元（空白可編碼，但這裡的字母表不使用）、也沒有印刷可讀文字；寬窄比固定為3:1、取樣在1/132 tile的單位上，所以太小的解析度（如32）無法分辨窄條。預設0.3 m nominal tile、0.0012 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上（窄單位約7.7 px）；512仍能分辨，約3.9 px；不宣稱本段已完成三backend或跨瀏覽器驗證。

`amidakuji`（阿彌陀籤／鬼腳圖）使目前目錄949→950種，含plain的gallery為951項。每tile一張8條縱線、10層橫槓的阿彌陀籤：每一層由seed在相鄰縱線之間隨機畫橫槓（機率約45%，同一層不會有兩根相接的橫槓）；上方一排標出起點號碼1至8，下方一排標出「從哪個起點出發會走到這條縱線」——每個起點沿縱線往下走、碰到橫槓就橫移到相鄰縱線，因此下排號碼是上排號碼的一個排列。標籤列為灰底，數字是3×5點陣，紙面為米白、墨線近黑。Metallic與mortar為0。

這是作者設計的示意：下方標籤是「起點號碼」而不是獎品名稱；橫槓高度固定在10個層級的中央（不像手繪那樣高低不一）；沒有標示哪一條是中獎線，也沒有突顯任何一條走過的路徑；顏色是亮度插值（近黑墨＋米白紙）。預設0.3 m nominal tile、0.0016 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上（縱線間約64 px）；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`featherbarbs`（羽毛羽枝）使目前目錄950→951種，含plain的gallery為952項。每tile並排兩片羽毛的羽片（羽軸在u = 1/4與3/4）：細亮的羽軸向兩側伸出一排排羽枝（barbs），羽枝朝羽尾方向斜掃——沿同一根羽枝 v + 1.3·|u − 羽軸| 為定值，所以羽枝是相位 (v + 斜率·|dx|) / 週期 的條紋，每個tile垂直方向有48根；每根羽枝有自己的長度（約0.21 ± 0.03 tile），形成參差的外緣，羽枝間是深色縫隙，由內向外色調由亮轉暗，每根的亮度略有不同。最長的羽枝（約0.24 tile）仍短於羽軸到邊界的0.25 tile，所以每片羽毛在邊界至少留約0.01 tile的空白，所以tile接縫與兩片羽毛之間沒有羽枝接觸。Metallic與mortar為0。

這是作者設計的示意：只畫了羽枝與羽軸，沒有羽小枝（barbules）的細節、沒有彎曲或扭轉的羽片、沒有羽毛輪廓與尖端；兩片羽毛完全鏡像排列；顏色是亮度插值（近黑底、米白羽枝），不代表真實羽毛色相；有高頻條紋（週期約20 px@1024、羽枝寬約0.55個週期），在小尺寸下會產生疊紋。預設0.25 m nominal tile、0.003 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`dartboardsectors`（飛鏢靶）使目前目錄951→952種，含plain的gallery為953項。每tile一面標準飛鏢靶：中心是紅心（bull，半徑6.35 mm）與外紅心（15.9 mm），其外是20個扇區，依常見順序從正上方順時針為 20、1、18、4、13、6、10、15、2、17、3、19、7、16、8、11、14、9、12、5，每個扇區有單倍區、三倍環（99至107 mm）與雙倍環（162至170 mm）；扇區黑白交替（20號為黑），黑扇區的雙倍／三倍環是「紅」色調、白（米色）扇區的是「綠」色調，每條分界有亮色鋼絲；雙倍環外側是深色數字環，數字以3×5點陣、直立（不旋轉）印在各扇區方向上；靶外是中灰色墊面。尺寸以毫米定義，再縮放到tile（225 mm對應0.47個tile）。Metallic與mortar為0。

數據來源要誠實說明：靶的總直徑451 mm與20個扇區，在本次實作中從Wikipedia〈Darts〉確認；各環的半徑（紅心6.35、外紅心15.9、三倍環99至107、雙倍環162至170 mm）與扇區數字順序是照記憶輸入的標準規格，沒有逐項對照WDF／DRA規格全文；順序有一項已知性質作為自我檢查——相鄰數字差的絕對值總和為198（測試中計算，吻合），且20個數字互不相同、總和210。這是作者設計的示意：顏色是亮度（紅／綠只是兩個不同的灰階），沒有靶面纖維、飛鏢孔、號碼環的圓弧擺放（數字不隨角度旋轉）或鋼絲的立體陰影，鋼絲的寬度（約0.0016 tile）為示意而非實際線徑。預設0.5 m nominal tile、0.0028 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`tictactoegames`（井字遊戲）使目前目錄952→953種，含plain的gallery為954項。每tile四塊3×3的井字棋盤（共6×6格），每塊畫的是一局隨機對弈的局面：X先手，兩方輪流把9個格子依seed決定的隨機順序下滿，遇到第一條連線就停止，否則在3至9手之間（每塊各自隨機）停下，因此每個局面都是實際對弈中可能出現的：X與O的數量相等或X多一，不會同時有兩方連線，連線時剛好是該方剛下完最後一手。格線只畫在同一塊棋盤的格子之間；X是兩條對角線，O是圓環，皆為近黑墨線。Metallic與mortar為0。

這是作者設計的示意：沒有標出勝利連線、下棋順序或對弈者；四塊棋盤之間沒有分隔線，在6×6的格線上會連成一片（每塊棋盤的邊緣格子沒有外框）；X與O的顏色只差0.08的亮度；「可能出現」是依照上述必要條件，不是對每個局面做過完整的博弈樹驗證。預設0.3 m nominal tile、0.002 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上（每格約85 px）；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`quasicrystalwaves`（準晶波紋）使目前目錄953→954種，含plain的gallery為955項。把五個平面波 cos(2π(m·x) + φ) 相加，波向量 m 取整數 (6, 0)、(2, 6)、(−5, 4)、(−5, −4)、(2, −6)，方向大致落在正五邊形的五個方向（相鄰夾角與72°相差不到10°、長度比小於1.15），相位 φ 由seed決定；和 S 再經 0.5 + 0.5·tanh(0.7·S) 這個單調映射變成亮度（height與roughness也由同一個和導出），畫面呈現近似五重對稱的光斑與五角星結構。因為波向量是整數，整個圖案在tile上精確週期、可無縫重複。Metallic與mortar為0。

這是作者設計的示意：它是「週期近似」而不是真正的準晶——真正的準晶（如Penrose鋪磚）沒有平移週期；這裡的五重對稱只是近似（波向量取整數所造成的角度與長度誤差），在遠處仍會重複；沒有繞射或物理意義上的準晶；顏色是亮度插值（深藍近黑到暖米色），不代表特定配色。預設0.4 m nominal tile、0.003 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議256以上（最高空間頻率約7.2週期／tile）；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`tallymarks`（正字記號／五劃計數）使目前目錄954→955種，含plain的gallery為956項。每tile 8條橫格線，每列一個計數：左側是歐美慣用的「五條一組」計數記號——每組四條直立筆劃再加一條斜線劃過，湊滿5；最後一組若不滿5就只有直立筆劃（1至4條），右側以3×5點陣數字印出該列的總數（3至49，由seed決定）。所以一列有幾條筆劃（滿組算5）就等於右側印的數字。墨色略有濃淡、紙面有細紋與橫格線。Metallic與mortar為0。

這是作者設計的示意：採用的是「四直一斜」的五劃計數法（不是東亞的「正」字記法）；每條筆劃都是完美的直線，沒有手寫的歪斜與粗細變化（墨色濃淡只是整體亮度擾動）；最多49條（10組），再多就放不進一列。預設0.3 m nominal tile、0.0016 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上（筆劃寬約3 px）；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`polargraphpaper`（極座標方格紙）使目前目錄955→956種，含plain的gallery為957項。每tile一張置中的極座標圖紙：12個等間距同心圓（半徑0.04 k tile，k = 1至12，第5、10與最外圈較粗）與每10°一條的36條放射線（每30°較粗、四條座標軸最粗），放射線從第1圈外側畫到最外圈，中心留一個空白小圓，圖紙之外是空白紙面。墨色為青綠近黑，紙面米白帶細紋。Metallic與mortar為0。

這是作者設計的示意：沒有角度或半徑的刻度數字、沒有座標軸箭頭；線寬是固定的相對寬度（細0.0011、粗0.0021、軸0.0032 tile），不隨解析度調整，所以在32這種極低解析度下細線會消失；圖紙正好是tile內的一個圓，tile接縫處沒有線。顏色是亮度插值（深青綠到近白）。預設0.3 m nominal tile、0.0012 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上（細線約2 px）；不宣稱本段已完成三backend或跨瀏覽器驗證。

`chesterfieldtufting`（Chesterfield菱格縫釦皮革）使目前目錄956→957種，含plain的gallery為958項。每tile是4×4個網格點中「索引和為偶數」的8個點各釘一顆圓釦，鄰近的釦子之間沿對角線拉出深色縫褶，縫褶圍成的菱形各自鼓起成軟墊；在旋轉座標 s = 4(u + v)、t = 4(u − v) 中，釦子落在偶數整數上、縫褶是 s = 2m 與 t = 2m 的直線，每個菱形內的高度是 (sin(πs/2)·sin(πt/2))^0.7，菱形中央最高、縫褶為0。亮度隨高度由縫褶的近黑逐漸變為皮革的暖褐色，皮面有細小的皺紋與顆粒，釦子是較亮的小圓（帶一圈邊緣）。Metallic與mortar為0。

這是作者設計的示意：只有菱形（鑽石形）縫釦，不含紐扣的孔洞與縫線、不含皺褶從釦子放射的更細致皺紋；縫褶線在釦子之間是完美的直線；皮革紋路是亮度雜訊而不是真實皮革的毛孔；顏色是亮度插值（近黑褐到磚紅褐），不代表特定皮革。預設0.5 m nominal tile、0.02 UV-relative relief（非公尺位移，起伏較大）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`louvershutter`（百葉窗板）使目前目錄957→958種，含plain的gallery為959項。每tile是一扇百葉窗：左右各一條實心的邊框直條（stile，各約7%寬），中間一根垂直的連動桿，10片斜置的橫向葉片（slat）。每片葉片是一個傾斜面——靠上緣較亮、往下緣逐漸變暗——底部14%是兩片之間的深色縫隙；連動桿穿過縫隙持續可見，並在每片葉片中央有一個小圓軸釘與葉片相連。葉片表面有沿水平方向拉長的細微漆面顆粒。Metallic與mortar為0。

這是作者設計的示意：這是正面平視的簡化圖，沒有透視、沒有葉片之間透出的背景或光線（縫隙只是深色）、也沒有真實的葉片傾斜角度——傾斜只用「上亮下暗」的亮度梯度與高度斜面表示；邊框直條沒有榫接或面板；顏色是亮度插值（近黑灰到淺灰白），不代表特定的漆色。預設0.4 m nominal tile、0.012 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`ledgersheet`（帳簿紙）使目前目錄958→959種，含plain的gallery為960項。每tile一張8列的簡易帳簿：每列左側是列號（1至8），中間欄是靠右對齊的三位數金額（100至999，由seed決定），右欄是靠右對齊的累計餘額（目前為止所有金額的總和，第一列為三位數、之後多為四位數）；欄位之間有兩條較深的直線，每列之間是淺色橫線，數字是3×5點陣，墨色略有濃淡，米黃紙面有細紋。所以每一列的餘額都等於前一列餘額加本列金額。Metallic與mortar為0。

這是作者設計的示意：沒有欄位標題、貨幣符號、小數點或借貸欄，只有金額與累計餘額兩個數字欄；金額範圍固定為100至999，最多8列（餘額最大7992，四位數）；顏色是亮度插值（近黑藍墨＋米黃紙），不代表真實帳簿的紅藍墨水。預設0.3 m nominal tile、0.0014 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上（每個點陣像素約5 px）；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`sundialplate`（日晷盤面）使目前目錄959→960種，含plain的gallery為961項。每tile一面水平日晷的盤面（青銅色圓盤，半徑0.475 tile，盤外為深褐墊面）：中心是晷針根部的小圓，從中心向上半面伸出13條時刻線，正午線垂直向上、較粗，第 h 小時的時刻線與正午線的夾角為 atan(sin φ · tan(15°·h))，h = −6 至 6（±6小時是水平線）；φ 是緯度，由seed決定在25°至55°之間。三個同心環（半徑0.2、0.3、0.385 tile）與時刻線末端外側的數字（6、7、…、11、12、1、…、6，3×5點陣）；相鄰時刻的數字交錯放在兩個不同半徑上，避免低緯度時靠近正午的數字互相重疊。Metallic與mortar為0。

這是作者設計的示意：只畫盤面，沒有晷針的立體或投影；不考慮所在地的經度修正、均時差或日光節約時間；每個seed是一個不同的緯度，不是特定城市；整點之間沒有半小時或刻度細線；顏色是亮度插值（深褐近黑到青銅色），不代表真實青銅的氧化色。預設0.4 m nominal tile、0.003 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`doubleslitfringes`（雙狹縫干涉條紋）使目前目錄960→961種，含plain的gallery為962項。每tile上下疊四個遠場雙狹縫干涉圖樣面板，沿水平方向的強度為 I(x) = cos²(πx/p) · sinc²(πx/(r·p))，x 是離中央的偏移、p = 1/16 tile 是條紋週期、r 是「狹縫間距÷狹縫寬度」，四個面板的 r 依序為2、3、4、5：條紋位置在 p 的整數倍，當條紋級次 m 恰是 r 的倍數時，剛好落在單縫繞射包絡 sinc² 的零點上而缺級（missing order）。亮度為 I^0.6，暗色背景、奶黃色條紋，面板之間有一條細暗縫。圖樣左右鏡像、以中央為軸，所以在tile接縫處連續，可無縫重複。Metallic與mortar為0。

這是作者設計的示意：這是遠場（Fraunhofer）理想化公式，不是實驗影像——沒有有限狹縫距離、有限光源寬度、非單色光造成的條紋模糊，也沒有真實光強度的物理單位；水平方向是一維圖樣，在垂直方向只是重複；seed只影響極細的顆粒；顏色是亮度（近黑藍到奶黃），不代表特定波長的色光。預設0.4 m nominal tile、0.002 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上（條紋週期約32 px）；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`fibonaccisquares`（斐波那契方塊與黃金螺線）使目前目錄961→962種，含plain的gallery為963項。每tile中央是由邊長為1、1、2、3、5、8、13（單位 = 1/24 tile）的七個正方形拼成的13×21單位的長方形（長寬比21/13 ≈ 1.615，接近黃金比例；七個方形的面積 1 + 1 + 4 + 9 + 25 + 64 + 169 = 273 = 13 × 21，正好鋪滿），每個方形依序以右、上、左、下的順序貼在目前長方形的一側，並有各自的亮度；每個方形內畫一段半徑等於邊長的四分之一圓弧，圓心在方形的一個角，相鄰的弧線在共用端點相切，串成一條連續的黃金螺線。長方形四周是米白紙面。Metallic與mortar為0。

這是作者設計的示意：這是用費氏數列方塊近似的螺線（由四分之一圓弧拼接，曲率在接點不連續），不是真正的對數螺線；長方形不填滿tile，四周留有空白，所以tile重複時圖形之間有間隔；只畫七個方塊（最大13），不能繼續擴大；seed只影響紙面顆粒。預設0.4 m nominal tile、0.0016 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上（最小的方形約21 px）；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`bluenoisemask`（藍噪聲遮罩）使目前目錄962→963種，含plain的gallery為964項。每tile是一張64×64的藍噪聲（blue noise）抖動遮罩，用 void-and-cluster 演算法（Ulichney）產生：在環面（上下左右相接）上以高斯能量（σ = 1.5）找「最密的群聚」與「最大的空洞」，先把約10%的隨機初始點鬆弛到穩定，再依序為全部4096個texel排出0至4095的名次，每個名次恰好使用一次；亮度 = 名次 ÷ 4095，所以亮度直方圖是完全平坦的，且低頻能量被壓得很低。遮罩在環面上計算，可無縫重複。height隨亮度升高，roughness隨亮度略升。Metallic與mortar為0。

一次性本機量測（seed 0，64×64遮罩的離散傅立葉功率，除以白雜訊的預期功率）：半徑1至5頻率的平均約0.000、半徑8至12約0.003、半徑24至31（接近Nyquist）約1.61；同樣變異數的隨機排列（白雜訊）三者約為1.21、1.14、0.96。單次建立約66 ms（一次性量測，非基準）。

這是作者設計的產物：遮罩大小固定為64×64 texel（再大則演算法時間過長），以最近鄰方式取樣，所以在512 px的圖上每個texel是8×8 px的方塊（想要像素級的藍噪聲請把size設為64，或在shader裡以repeat取樣）；seed只決定初始隨機點，不同seed是不同的遮罩，但品質（頻譜）相近；顏色是亮度，沒有色相意義。預設0.2 m nominal tile、0.002 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`elementaryautomata`（一維基本細胞自動機）使目前目錄963→964種，含plain的gallery為965項。每tile是2×2個面板，每個面板是31×31格，由上而下演化一種Wolfram規則——左上90（謝爾賓斯基三角）、右上110、左下150、右下184（交通流規則）：第0列是中央一格加上依seed隨機撒下的約12%稀疏點，之後每一列由上一列依規則計算（在31格的環上，左右相接）。活格是近黑的小方塊，死格是淺灰的小方塊，面板之間有一條細線，米白紙面。因為環上有31個格（奇數），規則90不會像32格那樣在幾步後全部歸零，圖樣會一直延續到底。Metallic與mortar為0。

這是作者設計的示意：只有四種規則、固定31格寬與31列；環狀邊界，所以圖樣會在左右邊緣繞接（與tile相鄰面板之間不相連）；起始列含隨機點，因此不是典型的「單一種子」三角形（想看單一種子可把seedDensity設為0）；「奇數環不會歸零」是在目前這些seed上觀察到的結果，沒有數學證明；顏色是亮度（近黑墨、淺灰格線、米白紙）。預設0.4 m nominal tile、0.0014 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上（每格約8 px）；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`mastermindboard`（珠璣妙算／Mastermind棋盤）使目前目錄964→965種，含plain的gallery為966項。每tile是一塊6欄×9列的棋盤：最上面一列是公開的密碼（4顆釘子，從6種顏色中隨機選出），其下8列各是一次隨機猜測的4顆釘子；每個猜測右側的兩欄是2×2的回饋釘孔，依規則計分——位置與顏色都對的「準確釘」（亮色，0.98）先填，只有顏色對但位置錯的「部分釘」（近黑，0.04）接著填，其餘是空孔——填入順序為左到右、上到下。6種釘子顏色以六個亮度（0.34至0.9，間隔0.12）表示，孔是暗褐色，棋盤是木質褐色並帶沿垂直方向拉長的木紋，密碼列與猜測列之間有一條橫線分隔。Metallic與mortar為0。

這是作者設計的示意：猜測是隨機的，不是玩家根據前面的回饋做出的推理（所以後面的猜測不一定與前面的回饋一致，也不保證有任何一列猜中全部）；沒有遮蓋密碼的蓋板；顏色只是亮度，六種釘子在小尺寸下不易分辨；回饋釘的「黑／白」依慣例是「準確／部分」，這裡以亮／暗表示。預設0.35 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`wordsearchgrid`（找字遊戲／Word Search）使目前目錄965→966種，含plain的gallery為967項。每tile是一張12×12的字母方格，字母以3×5點陣大寫字母印出，只用12個字母 A C D E G I L M N O R T：從一份15個單字的清單（CODE、TREE、GRID、MINT、TIDE、LION、DOOR、CLOT、RAIN、CELL、MOON、TIGER、ANGLE、CIRCLE、TRIANGLE）中依seed挑出5個，沿8個方向（橫、直、斜，正向或反向）隨機放進方格（與已放的字母相交時字母必須相同），其餘格子填入字母表中的隨機字母。淺灰格線，米白紙面，墨色略有濃淡。Metallic與mortar為0。

這是作者設計的示意：單字清單不會印在畫面上；填入的隨機字母可能意外拼出清單上的其他單字（測試只要求清單中至少有5個單字能在格內以直線找到）；只有12個字母，3×5點陣的字母在小尺寸下不易分辨（例如D與O、M與N）；字母以單字母方式放置，沒有空格或標點。預設0.35 m nominal tile、0.0014 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上（每格約85 px，點陣像素約14 px）；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`magicsquares`（幻方）使目前目錄966→967種，含plain的gallery為968項。每tile四個象限各放一個幻方：3階（洛書）、4階（杜勒的幻方）、5階與7階（奇數階用暹羅法：從首列中間出發，右上移動、遇到已填的格子就往下一格），每個幻方由seed隨機旋轉0至3次並可能鏡射（旋轉與鏡射不改變幻方性質）。因此每個幻方的數字恰好是1至n²各一次，且每一列、每一欄與兩條對角線的和都等於幻方常數 n(n²+1)/2（15、34、65、175）。數字是3×5點陣（1至2位數），有格線與較粗的外框，米白紙面。Metallic與mortar為0。

這是作者設計的示意：洛書與杜勒幻方的數字照記憶輸入，用「每列、每欄、對角線和相等且為1至n²」的條件驗證（杜勒幻方的其他性質，如四個角落、中央2×2之和也是34，沒有測試）；5階與7階由演算法生成，不是特定的傳統幻方；沒有6階或其他偶數階（需要不同的構造法）；7階的格子較小（約0.07 tile），在512 px約36 px、2位數字的點陣像素只有約4 px。預設0.4 m nominal tile、0.0014 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`slidingpuzzle`（滑塊拼圖／十五數字謎）使目前目錄967→968種，含plain的gallery為969項。每tile是一個4×4的盤面：15塊帶有1至15點陣數字的米黃色方塊與一個下陷的空格，外圍是深色框。盤面從已完成的狀態出發，依seed做240步隨機的合法滑動（空格與鄰格交換，不立即回頭）而得，因此一定可以解回；方塊有細縫與倒角（height），數字略凹。Metallic與mortar為0。

這是作者設計的示意：240步隨機滑動不保證與完成狀態相距最遠，也可能偶然把少數方塊留在原位（測試只要求不超過6塊在原位）；不是「隨機排列」，而是合法滑動的結果；數字只有3×5點陣，兩位數寬度約0.7格；沒有動畫或解法。預設0.3 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`kaleidoscope`（萬花筒）使目前目錄968→969種，含plain的gallery為970項。每tile是2×2個圓形玫瑰紋，分別具有6、8、5、12重的二面體對稱（n次旋轉對稱加n條鏡射軸）：每個圓盤的圖案是在一個角度為π/n的楔形內隨機放置的9個圓點（半徑、極座標位置與六種亮度由seed決定），再加上以半徑為函數的同心環底色；取樣時把角度折疊進楔形（旋轉2π/n後再以楔形邊緣鏡射），所以整個圓盤精確地呈鏡射與旋轉對稱。圓盤外圍有一圈深色邊緣，背景是深藍黑色。Metallic與mortar為0。

這是作者設計的示意：真實萬花筒是以鏡子反射真實物件，這裡是算式模擬的鏡像；n=12的圓盤因楔形很窄而顯得接近放射狀；圖案不是有意義的曼陀羅；所有圓盤的位置固定（2×2），不隨seed移動。預設0.4 m nominal tile、0.002 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`oghaminscription`（歐甘文刻石）使目前目錄969→970種，含plain的gallery為971項。每tile是一塊灰色粗石面（含細粒與粗尺度的亮度變化），上面刻有8行水平的歐甘（Ogham）文字：每行一條橫向的主幹線，一個單字由1至5道短刻痕為一組的字母從左往右排列。依字母所屬的四個aicme（組）區分刻法：第1組（B L F S N）的刻痕在主幹線下方，第2組（H D T C Q）在上方，第3組（M G NG Z R）斜穿主幹線，第4組（A O U E I，母音）是主幹線上的短槽；組內的刻痕數1至5決定字母。每行單字依seed從16個古愛爾蘭樹名（BETH、LUIS、FEARN、SAILLE、NION、UATH、DUIR、TINNE、COLL、CERT、GORT、RUIS、AILM、ONN、EADHA、IDHO）中挑出，刻痕比石面暗、凹陷（height較低）。Metallic與mortar為0。

這是作者設計的示意：歐甘字母的次序（BLFSN／HDTCQ／MGNGZR／AOUEI）與四組的刻法是憑記憶輸入的，未對照外部資料；真正的歐甘文沿石頭的稜線由下往上讀，這裡改成水平從左到右的簡化排列，每行主幹線是橫貫整個tile的細線；單字是以字母拼寫的樹名（不是考證過的銘文，且沒有使用NG字母——測試字母表中以X代表NG）；沒有風化或崩缺。預設0.5 m nominal tile、0.006 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`gameoflife`（生命遊戲）使目前目錄970→971種，含plain的gallery為972項。每tile分成2×2個20×20的細胞盤面，依閱讀順序（左上、右上、左下、右下）是康威生命遊戲（Conway's Game of Life）連續的四個世代：先以seed產生密度0.36的隨機初始狀態，在環面（上下左右相接）上先運行10代，再依規則——活細胞有2或3個活鄰居則存活、死細胞恰有3個活鄰居則誕生——取連續四個世代，因此每個盤面都是前一個盤面的下一代。活細胞是亮綠色方塊，死細胞是深綠色，格線與外框較淺，背景近黑。Metallic與mortar為0。

這是作者設計的示意：初始狀態是隨機湯而非特定圖案（沒有刻意放置滑翔機等結構）；盤面只有20×20（環面）；先運行10代而非更長，是因為burn-in 24代時14個seed中最少只剩21個活細胞（第一版以一維hash產生初始狀態時seed 0甚至只剩8個，另外初始狀態還出現大片空白，所以改用二維hash），而10代時各seed為59至121個活細胞（400格）；四個盤面的左右上下邊緣在環面上相連，但這個接縫在tile畫面上沒有表示。預設0.4 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`pascalmodulo`（巴斯卡三角形同餘）使目前目錄971→972種，含plain的gallery為973項。每tile分成2×2個32列的左對齊巴斯卡三角形：第r列第c個方塊是二項式係數的遞推值（每格等於上一列左上與正上兩格之和），分別對模2、3、4、5取餘數，四個象限各用一個模數，哪個模數放在哪個象限由seed決定。餘數越大方塊越亮（亮度在0.2與0.94之間等距分布），三角形右上方是空白的深色底；每個盤面有細外框。模2的盤面就是謝爾賓斯基三角形。Metallic與mortar為0。

這是作者設計的示意：只列出32列；餘數以亮度表示（不是色相，模5的5種亮度間距約0.185，小尺寸下不易分辨）；餘數0不是「空白」而是較暗的方塊（亮度0.2），空白只在對角線右上方；四個模數各出現一次。預設0.4 m nominal tile、0.003 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`dragoncurve`（龍形曲線）使目前目錄972→973種，含plain的gallery為974項。每tile是一條11階的龍形曲線（Heighway dragon，即紙條對折11次後展開得到的曲線）：2048條單位長度的格線線段，轉彎序列是正規的紙條對折序列（每一輪保留先前的轉彎，加入一個左轉，再加入先前轉彎反向且左右互換的結果）。曲線畫成沿格線的細線，轉角處補上方形接點，亮度沿路徑由暗橘漸變到亮橘（起點0.42、終點0.96），背景是近黑的深紫色。曲線的旋轉（0至3個四分之一圈）與是否鏡射由seed決定，整條曲線縮放並置中在tile內，四周留邊。Metallic與mortar為0。

這是作者設計的示意：龍形曲線只有一條，不隨seed變動形狀（只改變方向與鏡射）；曲線只佔tile中央，四周是平坦背景，並非鋪滿；線寬約為格距的0.34，11階時格距約0.02 tile，在512 px只有約3.5 px寬；11階曲線的線段從不重疊，但在頂點會相接（接點方塊所以看起來有時是交叉）。預設0.5 m nominal tile、0.003 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`cantordust`（康托爾塵）使目前目錄973→974種，含plain的gallery為975項。tile的上半是六列由上往下的康托爾集：第k列（k=0至5）有243格，保留的是三進位表示的前k位數字都不是1的格子（第0列整條，第1列去掉中間三分之一，依此類推），保留的段由暗到亮漸變（0.42至0.92）。下半是三步的康托爾塵：27×27格，只有行號與列號的三進位數字都不含1的格子（8×8=64個）亮起，周圍是較淺的底色方塊。背景為深藍黑色，帶淡淡的顆粒。Metallic與mortar為0。

這是作者設計的示意：康托爾集只做到第5步（243格，每格寬在1024 px約4 px）、康托爾塵只做3步（27×27）——真正的康托爾集是無窮步的極限；總是去掉中間三分之一（我曾讓seed決定去掉哪一個數字，但去掉2時康托爾塵整個縮到角落看不清，所以固定為1），seed只改變顆粒；它不是分形的視覺化證明。預設0.5 m nominal tile、0.003 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`eightqueens`（八皇后）使目前目錄974→975種，含plain的gallery為976項。每tile分成2×2塊8×8的西洋棋盤（淺色與深色格交替，深色木框），每塊棋盤上放著八個互不攻擊的皇后——每列、每欄各一個，也沒有任何兩個共用斜線。皇后畫成圓形身體加三尖王冠的亮色剪影；四塊棋盤各自用seed打亂欄的順序後做回溯搜尋，因此是互相獨立的解（共有92種解）。Metallic與mortar為0。

這是作者設計的示意：皇后只是簡化剪影，不是立體棋子；四塊棋盤的解由seed打亂順序決定，並不均勻取自92種解，也可能剛好有兩塊相同；沒有座標標示；棋盤格是淺色與深色的兩種亮度，不是色相。預設0.4 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`hanoitowers`（河內塔）使目前目錄975→976種，含plain的gallery為977項。每tile分成2×2個木框面板，每個面板是三根立柱與六個大小不同的圓盤，四個面板依閱讀順序顯示最佳解法（把全部圓盤從左柱搬到右柱，共63步）進行到第0、21、42、63步時的狀態：第0步是六個圓盤依大小疊在左柱，最後一步疊在右柱。圓盤越大越亮、也越寬（寬度0.08至0.30個面板寬），立柱與底板為較暗的木色。Metallic與mortar為0。

這是作者設計的示意：只有一種固定的最佳解法與固定的四個步數（0、21、42、63），seed只改變木紋顆粒；圓盤只靠寬度與亮度區分，沒有立體感；圓盤亮度是0.38到0.96之間的灰階（不是色相），小尺寸下最小的幾個圓盤不易分辨；解法中間步驟的圓盤沒有畫出「正在移動」的樣子。預設0.4 m nominal tile、0.006 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`latinsquares`（拉丁方陣）使目前目錄976→977種，含plain的gallery為978項。每tile分成2×2個n×n的方陣，階數依閱讀順序為5、6、7、8：每格是一個亮度等級（n個等級在0.16至0.96間等距分布），每個亮度等級在每一列與每一欄恰好出現一次。方陣是循環拉丁方（i+j mod n）再由seed打亂列順序、欄順序與符號對應而得，格間有細縫，外有細框，背景為深藍紫色。Metallic與mortar為0。

這是作者設計的示意：所有方陣都是由循環群的乘法表經過列、欄、符號置換得到（同構於循環拉丁方），並不涵蓋所有同階的拉丁方（例如6階還有許多非循環類型）；亮度等級不是色相，8階的相鄰等級只差約0.114，小尺寸下不易分辨；沒有數字或字母標示。預設0.4 m nominal tile、0.003 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`mayansums`（馬雅數字加法）使目前目錄977→978種，含plain的gallery為979項。tile的四個象限在灰色粗石面上各刻一道加法算式 a + b = c，數字用馬雅的二十進位記法：每個數字由上下兩格組成（上格是20位、下格是個位，各為0至19），一格內0是貝殼形的橢圓環，1至4是一排圓點，5是一道橫槓，6至19是在底部疊上若干條橫槓（每條代表5）再在其上放一排圓點（每點代表1）。a與b由seed在10至199間挑選，c＝a＋b（最大398，仍是兩位二十進位數）；算式的三欄之間刻有加號與等號。Metallic與mortar為0。

這是作者設計的示意：數字是馬雅二十進位數字的簡化畫法（橫槓與圓點、貝殼零），不是考證過的碑文字形，也沒有馬雅長紀曆的18進位位（長紀曆中第二位只到17）；算式只在10至199範圍內選取，且上格的20位可能是0（以貝殼表示）；刻痕只是比石面暗的凹陷，沒有風化或崩缺。預設0.5 m nominal tile、0.006 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`sortingnetworks`（排序網路）使目前目錄978→979種，含plain的gallery為980項。tile的四個象限各畫一張8條導線的排序網路圖：八條水平導線（由上到下為0至7號），每個比較器是一道垂直的亮色線段，兩端各有一個圓點連到被比較的兩條導線（較小的值放到上方的導線）。每個象限由seed在兩種網路間挑選：Batcher的奇偶合併排序（19個比較器）與雙調排序（24個比較器，取全部遞增的形式）；每個比較器各佔一欄，依執行順序從左排到右。深藍色的面板上帶淡淡的顆粒與細框。Metallic與mortar為0。

這是作者設計的示意：只有8條導線與兩種網路；為了避免巢狀的比較器互相重疊，每個比較器獨佔一欄（因此圖並未把同一層的比較器畫在同一欄，不是標準的分層畫法）；測試端用0-1原理驗證讀回的比較器網路確實把全部256個二進位輸入排序，但沒有證明它是比較器數目最少的網路。預設0.4 m nominal tile、0.003 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`primesieve`（質數篩）使目前目錄979→980種，含plain的gallery為981項。每tile是一個16×16的圓角方格盤面，按行由左到右、由上到下排列256個連續整數，起點由seed在1至745之間挑選。質數的方格是最亮的黃色並且凸起；合成數依「最小質因數」分成2、3、5、7與11以上五級灰黃色（由暗到亮）；數字1（若出現在視窗中）是最暗的方格。因此在畫面上質數的位置正是埃拉托斯特尼篩法留下的空位，2的倍數呈每隔一格的暗直條。Metallic與mortar為0。

這是作者設計的示意：畫面上沒有數字，只能由模式推知；11以上的最小質因數只用一級表示（不再細分11、13、17…）；起點最大745，所以視窗最大到1000（最小質因數最大為31）；亮度是灰階，不是色相；質數的判定用試除法，不是篩法的實作。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`knockoutbracket`（淘汰賽對戰表）使目前目錄980→981種，含plain的gallery為982項。每tile是一張16隊單敗淘汰賽的賽程樹：左側第一輪是依seed洗牌的1至16號（點陣數字，兩位數使用兩個字形），往右依序是8強、4強、準決賽與冠軍共五欄方框，每場對戰的兩個方框以連線匯入下一欄，下一欄的方框填入該場的勝者（由seed隨機決定是上方或下方的隊伍勝出），因此每個勝者號碼都等於餵入它的兩個方框之一，最右邊是冠軍（較亮的方框）。深藍色背景上的淺色方框、深色數字與灰色連線。Metallic與mortar為0。

這是作者設計的示意：勝負完全隨機，不代表任何實力或比分；沒有比分、隊名與日期；16隊固定、沒有輪空或季軍賽；數字是3×5點陣，兩位數寬約0.05 tile。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`skyscraperpuzzles`（摩天樓謎題）使目前目錄981→982種，含plain的gallery為983項。每tile分成2×2題已解開的摩天樓謎題，階數依閱讀順序為4、5、6、7：中央是n×n的格子，每格是一棟樓的高度（1至n的點陣數字，高樓所在格的底色略深、高度略高），每列與每欄的高度恰為1至n各一次；四周一圈是線索，標出從該側往內看時能看到幾棟樓（較高的樓擋住後面較矮的樓，所以只計算比前面所有樓都高的樓）。數字是3×5點陣，紙面為米白色，有細格線與外框。Metallic與mortar為0。

這是作者設計的示意：畫面上是已解開的答案加上全部四邊的線索（真正的謎題只給線索，並隱藏中央的數字）；解是循環拉丁方經列、欄與符號置換而得，所以不是所有可能的解；1至n的數字以點陣印出，7階的格子較小（約0.05 tile）。預設0.4 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`pianoroll`（鋼琴捲簾）使目前目錄982→983種，含plain的gallery為984項。每tile是一張鋼琴捲簾編輯器式的畫面：左側是24個半音（兩個八度）的琴鍵條，白鍵為亮列、黑鍵（每八度的升C、升D、升F、升G、升A）為暗列；右側是24列×32步的格子（每4步有一條較明顯的拍線），其中以亮藍色長條畫出一段旋律。旋律使用一個由seed挑選的大調音階（12個主音之一），從主音開始，每次移動一或兩個音階級（不重複同一音高），每個音符長1至4步，直到填滿32步；音符愈高愈亮。Metallic與mortar為0。

這是作者設計的示意：旋律是隨機走動，沒有節奏或和聲上的音樂性；音高範圍固定為24個半音（兩個八度），主音落在中間偏上的位置；只有大調音階，沒有轉調、和弦或休止；琴鍵條畫成亮暗的列，沒有真實的琴鍵造型。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`binaryclock`（二進位時鐘）使目前目錄983→984種，含plain的gallery為985項。每tile分成2×2個時鐘面板，依閱讀順序顯示連續的四秒：時鐘以二進位編碼十進位（BCD）顯示 時時：分分：秒秒 共六個十進位數字，每個數字是一欄四個圓點，由上到下依序是8、4、2、1位元，亮綠色為1、暗色為0。起始時間由seed在一天（00:00:00至23:59:59）中任選，因此四個面板的最後一欄（秒的個位）逐格加一，遇到進位時（如秒59）會一路進到分與時，過了23:59:59則回到00:00:00。深色面板上有細框。Metallic與mortar為0。

這是作者設計的示意：只有24小時制、沒有日期與毫秒；起始時間隨seed決定，測試的九個seed中不一定出現跨分鐘或跨日的進位（進位的取餘邏輯有寫但未被這些seed涵蓋，見ACCEPTANCE）；亮暗的圓點沒有標示位元權重（8、4、2、1）。預設0.4 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`othelloboard`（黑白棋盤）使目前目錄984→985種，含plain的gallery為986項。每tile分成2×2塊8×8的綠色棋盤，依閱讀順序是一局隨機黑白棋（Othello／Reversi）中連續的四個局面，每個局面都是前一個局面再下一步合法棋的結果：從標準開局（中央四子）開始，黑先，由seed決定的合法著手隨機進行14至32手，取該局面與其後三手；一手棋放下一枚新子，並依規則翻轉沿八個方向被夾住的對方連續棋子，沒有合法著手的一方跳過。黑子為深色圓盤，白子為亮色圓盤，棋盤為綠色氈面與細格線，外有深色木框。Metallic與mortar為0。

這是作者設計的示意：棋局是完全隨機的合法著手，不是有意義的對局，也不保證局面看起來「像真的比賽」（預覽中常出現成列或成十字形的棋子）；只顯示四個連續局面，沒有標示輪到誰；測試端以獨立的八方向射線掃描驗證每一步的翻轉，但不驗證整局是否能從開局合法走到第一個局面（只驗證相鄰局面間的一步）。預設0.4 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`goboards`（圍棋盤）使目前目錄985→986種，含plain的gallery為987項。每tile分成2×2塊9×9的木紋圍棋盤（細格線、五個星位、深色木框），四塊盤面分別是隨機合法對局進行了16、28、42、58手後的局面：黑先白後輪流，每手下在隨機的空點，若讓對方一個棋群失去所有氣就把它提走（提子），若下了之後自己的棋群沒有氣則該手無效並換下一個點（禁入點）。黑子為深色圓子，白子為亮色圓子。Metallic與mortar為0。

這是作者設計的示意：對局完全隨機，不是有意義的棋局，也不是死活題；規則只實作提子與自殺禁手，沒有「打劫」（ko）限制，也沒有虛手、終局或勝負；若40次嘗試都找不到合法點則該手略過，因此盤面棋子數可能少於手數；白子的亮度是同一色階中最亮的一端，在這套只有「暗到亮」兩色漸變的材質中偏米黃色而不是純白。預設0.4 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`dewbeads`（露珠串）使目前目錄986→987種，含plain的gallery為988項。深綠色的葉面上有斜向排列的細葉脈與柔和的斑駁，散佈著圓形的露珠：把tile分成12×12格，每格以約62%的機率放一顆露珠，半徑在0.014與0.028個tile寬之間，位置在格內稍作抖動，確保露珠不會互相接觸也不會跨越tile邊界。露珠的高度是球冠形（中心最高，往邊緣以√(1−d²)下降，d為到中心的距離與半徑之比），顏色是折射式的：中心偏亮、邊緣偏暗，左上方有一個小亮點；光滑度高於葉面。Metallic與mortar為0。

這是作者設計的示意：露珠只是簡單的球冠，沒有真實折射或倒影，也沒有水膜或流動；位置受格子限制，所以仍可看出一點格狀排列；葉面是人工的斜紋葉脈加噪聲斑駁，不是真實的葉片；顏色只是暗到亮的單色階（綠色色相來自預設的暗亮兩端）。預設0.3 m nominal tile、0.008 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`bowlingscoresheet`（保齡球計分表）使目前目錄987→988種，含plain的gallery為989項。每tile是四局保齡球的計分表（每局一列，十格）：每格右上角是投球格——第1至9格兩個小方格、第10格三個——依序記錄每一球的結果，全倒（strike）記為「X」、補中（spare）記為「/」、失誤（0瓶）記為「-」，其餘是倒下的瓶數1至9；格下方是累計得分的點陣數字。投球結果由seed隨機產生（每次約30%的機率全倒或補中，否則在剩餘的瓶數內隨機）；累計得分依標準計分法：全倒得10分加上之後兩球，補中得10分加上之後一球，否則為兩球瓶數；第10格在全倒或補中時可再投第三球，第1至9格全倒時只在右邊的方格寫X。米白紙面與灰色格線，深色墨跡。Metallic與mortar為0。

這是作者設計的示意：投球結果是隨機的，不代表真實球員的分布（全倒與補中的機率固定為各30%，所以分數偏高、也常出現連續全倒）；只有四局，沒有球員姓名、日期或標題；第10格的標記方式（例如全倒後的第二球若再清空，也畫作X）是依一般記法實作，沒有對照任何正式規則書；數字是3×5點陣。預設0.5 m nominal tile、0.003 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`hexresourceboard`（六邊形資源島）使目前目錄988→989種，含plain的gallery為990項。每tile中央是一座由19個六邊形（3、4、5、4、3排列）組成的島嶼，周圍是深藍色的海面。六邊形分成六級亮度表示六種地形，數量為4、3、4、4、3、1（最亮的一種只有一塊，相當於沙漠），哪一種放在哪一格由seed洗牌決定；除了沙漠以外的18個六邊形各放一枚圓形數字標記，使用2、3、3、4、4、5、5、6、6、8、8、9、9、10、10、11、11、12各一組，並採用卡坦島的規則——兩個「紅色」的6或8不會落在相鄰的六邊形（seed洗牌後重試直到符合）。標記為淺色圓盤配深色點陣數字，海面帶淡淡的起伏。Metallic與mortar為0。

這是作者設計的示意：地形只以亮度區分，沒有森林、牧場等具體圖案，標記上的6與8也沒有畫成紅色（這套材質只有一條暗到亮的色階）；數字標記分布與地形配置符合上述規則，但規則是照記憶實作，沒有對照官方規則書；若400次洗牌都無法滿足6與8不相鄰的限制會保留最後一次（我的取樣測試中沒有遇到）；每個tile只有一座島，不隨tile重複的接縫處理。預設0.5 m nominal tile、0.005 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`kakuropuzzle`（數和謎題／Kakuro）使目前目錄989→990種，含plain的gallery為991項。每tile是一個8×8的已解開Kakuro盤面：第一列與第一欄是黑色格，其餘格中由seed隨機放入6至9個黑格，只保留每條連續白格都至少有兩格的版面；白格填入1至9的數字，使每一條橫向與縱向的連續白格內都沒有重複的數字（以回溯搜尋隨機填入）；每條連續白格的起點之前（左邊或上方）的黑格以斜線分成兩半，橫向的和寫在右上、縱向的和寫在左下（1至2位數的小點陣數字）。米白紙面與深色黑格，白格內是深色大點陣數字。Metallic與mortar為0。

這是作者設計的示意：畫面是填好答案的盤面，真正的Kakuro只顯示線索並隱藏白格中的數字；盤面版面由隨機黑格挑選，通過條件只有「每段白格長度至少2」，不保證解答唯一，也不保證是好謎題；版面搜尋每個seed最多嘗試6000次，我只驗證了209個seed（9個測試seed加額外200個）都找到版面；點陣數字為3×5，兩位數的線索寬約0.045個tile。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`hashibridges`（橋樑謎題／Hashiwokakero）使目前目錄990→991種，含plain的gallery為992項。每tile是一個9×9格點上已解開的橋樑謎題：圓形的島嶼內寫著1至8的點陣數字，島嶼之間以橫向或縱向的單線或雙線橋樑相連，每座島嶼的數字等於連到它的橋樑總數（雙線算2），橋樑不交叉，所有島嶼互相連通。版面由seed生成：從一座島開始，沿隨機方向隔開至少一格放新島並連一道橋（約40%為雙橋），共約15座島（受嘗試次數限制，可能較少），再為兩座中間無障礙且在同一直線上的島隨機加橋（約30%的配對）。米白紙面、淡淡的格點，島嶼為淺色圓盤配深色細環與數字。Metallic與mortar為0。

這是作者設計的示意：畫面是填好橋樑的答案，真正的謎題只給島嶼數字並隱藏橋樑；生成方式保證連通與不交叉，但不保證橋樑配置是這組數字的唯一解（原本的謎題要求唯一解），島嶼數目有時少於15；單橋與雙橋的間距很小（雙線相距約0.016個tile）。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`slitherlinkloop`（四角迴路謎題／Slitherlink）使目前目錄991→992種，含plain的gallery為993項。每tile是一個7×7格的已解開Slitherlink盤面：格點以小圓點表示，一條粗的深色封閉迴路沿格線繞行，迴路內部的格子底色略深；每格中央寫著（點陣數字0至3）該格四邊中有幾邊是迴路的一部分。迴路是一塊隨機生長的連通區域（約佔55%的格子）的外輪廓：seed決定生長順序，只接受外輪廓每個格點都連著0或2條邊、且走一圈能經過全部迴路格點（只有一個迴圈，不含孔洞或只在角落接觸的區塊）的區域。Metallic與mortar為0。

這是作者設計的示意：畫面同時顯示答案（迴路）與所有格子的數字，真正的謎題只給部分數字並隱藏迴路；區域由隨機生長產生，形狀偏向從某個角落長出（預覽中常是從上方延伸的形狀），不保證解答唯一；7×7是固定的。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`masyupearls`（珍珠謎題／Masyu）使目前目錄992→993種，含plain的gallery為994項。每tile是一個8×8格點（7×7個方格的角點）上已解開的Masyu：一條沿格線的封閉迴路（同樣是隨機生長的連通區域的外輪廓），迴路上放著白珍珠與黑珍珠。白珍珠所在的格點迴路必須直行，且前後相鄰的兩個格點中至少有一個轉彎；黑珍珠所在的格點迴路必須轉彎，且兩條臂的下一個格點都要直行（也就是轉彎後至少各再直走一格）。珍珠依這些規則挑出所有合格的格點，再由seed取其中約40%（至少5顆，若合格格點更少則全數放上）。白珍珠為淺色圓盤配深色細環，黑珍珠為深色圓盤；其他格點是小圓點。Metallic與mortar為0。

這是作者設計的示意：畫面同時顯示答案（迴路）與珍珠，真正的謎題只給珍珠並隱藏迴路；珍珠規則是依一般Masyu規則憑記憶實作（白珍珠直行且至少一側轉彎、黑珍珠轉彎且兩臂直行），沒有對照規則書；珍珠只放在符合規則的格點，所以必然與迴路一致，但不保證整個謎題只有唯一解；迴路由隨機生長的區域產生，形狀偏向從某個角落長出。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`stringartcurves`（弦線藝術／模乘弦圖）使目前目錄993→994種，含plain的gallery為995項。每tile分成2×2個圓：每個圓上均勻分布96個點，依序編號0至95，把點i與點（k·i mod 96）以直線相連（k為該圓的乘數，四個圓分別取2、3、4、5，放在哪個象限由seed洗牌，並把各圓轉動不到一個點距的小角度）。這些直線的包絡線在k=2時是心臟線、k=3時是腎臟線，更大的k得到更多瓣的曲線。線條以加法疊加後再壓縮成亮度（1−e^{−1.6·疊加量}），單線約為0.8的亮度，重疊處趨近飽和，圓周有一圈暗色細環，背景深藍黑。Metallic與mortar為0。

這是作者設計的示意：包絡線是由弦線自然形成的視覺效果，並未另外畫出曲線；k相同點數下，更大的乘數使弦線很密（k=5的圓看起來像模糊的玫瑰）；固定點（k·i≡i）不畫線；點數固定為96。取樣器對每個像素逐一計算到所在圓的最多約95條弦線的距離，512×512單次建立約223 ms，較其他材質慢，未最佳化。預設0.4 m nominal tile、0.003 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議512以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`fillominoregions`（數塊謎題／Fillomino）使目前目錄994→995種，含plain的gallery為996項。每tile是一個9×9已解開的Fillomino盤面：每個格子寫著它所屬區塊的大小（1至9的點陣數字），同一個區塊內的格子數字相同、個數就等於那個數字，區塊之間以較粗的深色線分隔（區塊內部是細線），區塊越大底色越深一點。區塊由seed以隨機生長產生：依格子順序，對每個尚未分配的格子隨機選目標大小1至5並向相鄰的空格生長，若完成時與相鄰的某個區塊大小相同就繼續加格直到不同（因此相鄰的區塊大小必定不同，不會誤合併）；整盤無法完成時（約六成嘗試）重試。Metallic與mortar為0。

這是作者設計的示意：畫面是填好答案的盤面，真正的Fillomino只給部分數字；區塊大小受限於1至9（合併後可能超過5），且為了避免相鄰區塊同大小，區塊大小的分布偏向較大；不保證只有一種解；點陣數字為3×5。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`futoshikigrid`（不等式謎題／Futoshiki）使目前目錄995→996種，含plain的gallery為997項。每tile是一個5×5的已解開Futoshiki盤面：25個方格各寫一個1至5的點陣數字，每列每欄1至5恰好各出現一次（拉丁方陣，由循環拉丁方經列、欄、符號置換而得）；相鄰兩格之間以約55%的機率畫上不等號：橫向相鄰用「<」「>」，縱向相鄰用「∧」「∨」，尖端（頂點）指向較小的數那一側。方格是淺色底、細框，格間留有空隙供畫不等號。Metallic與mortar為0。

這是作者設計的示意：畫面是填好答案的盤面，真正的Futoshiki只給部分數字與不等號；不等號是由答案推得、全部成立，但不保證整題只有唯一解；不等號是小的細線符號（約0.022個tile寬），在小尺寸下難以辨識；5×5固定。預設0.4 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`nurikabeislands`（島嶼謎題／Nurikabe）使目前目錄996→997種，含plain的gallery為998項。每tile是一個8×8已解開的Nurikabe盤面：淺色格是「島」，深藍的格是連成一片的「海」；每座島只在一格寫著點陣數字，數字等於該島的格數；島與島不會上下左右相接，海是單一連通的區域，且海中沒有任何2×2的方塊（「池塘」）。盤面由seed產生：先放4至7座隨機島嶼，再把出現的2×2池塘用「擴張相鄰島嶼」或「新增一格島」補掉，最後要求海仍然連通與每島不超過9格，不合格就以不同的雜湊重試（我用腳本模擬，約3%的嘗試成功）。Metallic與mortar為0。

這是作者設計的示意：畫面是填好答案的盤面，真正的Nurikabe只給島的數字、需要自己推出海；不保證只有唯一解；數字在島的哪一格（固定為最初的起點格）由seed決定；8×8固定，點陣數字為3×5。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`tentsandtrees`（帳篷謎題／Tents）使目前目錄997→998種，含plain的gallery為999項。每tile是一個8×8已解開的Tents盤面：草地格上有圓形樹冠加樹幹的「樹」與三角形的「帳篷」；每頂帳篷各自緊鄰（上下左右）一棵專屬的樹，帳篷之間連斜角都不相接，樹的數量等於帳篷的數量；盤面右側一欄與下方一列以點陣數字標出每列、每欄的帳篷數。盤面由seed產生：依隨機順序放帳篷（不與已放的帳篷相鄰，含斜角），每頂帳篷在上下左右的空草地中選一格放樹，直到約17頂或沒有位置為止。Metallic與mortar為0。

這是作者設計的示意：畫面是填好答案的盤面，真正的Tents只給樹與行列數字、帳篷要自己推；不保證只有唯一解；帳篷數由seed決定、通常少於目標的17頂（我對12個seed實測為10至16頂）；樹與帳篷的對應在畫面上沒有連線，只能由相鄰關係看出；8×8固定。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`shikakurects`（矩形分割謎題／Shikaku）使目前目錄998→999種，含plain的gallery為1000項。每tile是一個10×10已解開的Shikaku盤面：整個盤面被切成若干長方形，每個長方形內恰有一格寫著點陣數字，數字等於該長方形的格數；長方形之間以較粗的深色線分隔，內部是細線，每個長方形的底色有些微的隨機深淺。切法由seed決定：從整個盤面開始，沿較長的一邊在隨機位置切成兩塊，面積不超過9的小塊以40%的機率提前停止（面積不超過2的一定停止），較大的一律繼續切；數字放在長方形內的隨機一格。Metallic與mortar為0。

這是作者設計的示意：畫面是填好答案的盤面，真正的Shikaku只給數字、要自己畫出長方形；不保證只有唯一解；長方形面積限制在9以內（單一點陣數字）；10×10固定、點陣數字為3×5。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`hitorishading`（數字塗黑謎題／Hitori）使目前目錄999→1000種，含plain的gallery為1001項。每tile是一個7×7已解開的Hitori盤面：每格寫著1至7的點陣數字，被塗黑的格子是深色底、數字反白；塗黑的格子上下左右都不相接，沒塗黑的格子連成一整片，且沒塗黑的格子在每一列、每一欄中都沒有重複的數字；每個塗黑格的數字都和同列或同欄某個沒塗黑格相同（因此塗黑它才有意義）。盤面由seed產生：先做一個經列、欄、符號置換的7×7拉丁方陣，依隨機順序塗黑格子（不與已塗黑者相鄰且塗黑後其餘仍連通）直到約13格，再把每個塗黑格的數字改成同列或同欄某個沒塗黑格的數字。Metallic與mortar為0。

這是作者設計的示意：畫面是填好答案的盤面（塗黑已畫出），真正的Hitori只給數字、要自己決定塗哪些格；不保證只有唯一解，也不保證只有這一種塗法合規；沒塗黑的格構成拉丁方陣的一部分，因此看起來比一般題目更「規則」；塗黑的數量約13格（可能因無法再塗而更少）；7×7固定、點陣數字為3×5。預設0.4 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`akarilights`（點燈謎題／Akari，又名Light Up）使目前目錄1000→1001種，含plain的gallery為1002項。每tile是一個8×8已解開的Akari盤面：白色格子上有圓形的燈泡，黑色的牆（約26%的格子）把視線擋住；每顆燈泡沿所在的列與欄照亮到碰到牆為止，所有白格都被照亮，且沒有兩顆燈泡互相看得到；約六成的牆在深色底上以反白的點陣數字（0至4）寫出它上下左右相鄰的燈泡數。盤面由seed產生：隨機放牆，再依隨機順序把尚未被照亮的白格放上燈泡（尚未照亮的格子看不到任何既有燈泡，所以必不衝突），直到全部照亮。Metallic與mortar為0。

這是作者設計的示意：畫面是填好答案的盤面，真正的Akari只給牆與部分數字、燈泡要自己推；不保證只有唯一解；沒有畫出光線；不保證牆全部連通或沒有被牆圍起的孤立白格（孤立的白格會自己放一顆燈泡）；8×8固定、點陣數字為3×5。預設0.4 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`takuzugrid`（二進位謎題／Takuzu，又名Binairo）使目前目錄1001→1002種，含plain的gallery為1003項。每tile是一個8×8已解開的Takuzu盤面：每格不是實心圓（1）就是空心圓環（0），並符合Takuzu的全部規則——每一列、每一欄都恰有4個實心與4個空心、任何一列或一欄中不會有連續三個相同的符號、任兩列不相同、任兩欄也不相同。盤面由seed以回溯搜尋產生：依格子順序逐格嘗試（先試哪個符號由雜湊決定），遇到違反規則就退回，直到填滿。Metallic與mortar為0。

這是作者設計的示意：畫面是填好答案的盤面，真正的Takuzu只給部分格子；不保證只有唯一解；回溯搜尋有節點上限（100000個節點）——我對300個seed量測的最大節點數約2400，遠低於上限，但若某個seed超過上限，盤面會留下未填格並被畫成空心圓環，這個情形我沒有遇到也未驗證其外觀；8×8固定。預設0.4 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`kenkencages`（算術方陣謎題／KenKen）使目前目錄1002→1003種，含plain的gallery為1004項。每tile是一個4×4已解開的KenKen盤面：16格各寫一個大的1至4點陣數字，每列每欄1至4恰好各出現一次（拉丁方陣，由循環拉丁方經列、欄、符號置換而得）；盤面被粗線切成「籠」（1至3格的相連區塊，各有些微不同的底色），每個籠在第一格（依列優先順序）的左上角以小號點陣字寫出目標數與運算符：單格籠只寫數字本身；兩格籠可為加（＋）、乘（×）、減（−，大減小）或除（÷，大除以小且需整除）；三格籠為加或乘。運算符是3×5點陣：「＋」「×」「−」「÷」。目標由答案算出，因此全部成立。Metallic與mortar為0。

這是作者設計的示意：畫面是填好答案的盤面，真正的KenKen只給籠與目標（不顯示答案）；不保證只有唯一解（我沒有寫求解器檢查）；籠最多3格；4×4固定；大數字與小標籤都是點陣、在小尺寸下難以辨識。預設0.4 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`numberlinkpaths`（數字連線謎題／Numberlink）使目前目錄1003→1004種，含plain的gallery為1005項。每tile是一個6×6已解開的Numberlink盤面：約6至9對端點，各是深色圓盤內反白的點陣數字（1至9），同一對數字以一條粗線連起來，所有路徑合起來恰好鋪滿全部36格、互不相交、不分叉也沒有環；不同路徑的線條有些微不同的深淺。盤面由seed產生：先用水平骨牌鋪滿棋盤並以大量隨機「2×2旋轉」得到隨機的骨牌鋪法，再把端點相鄰且屬於不同路徑的骨牌頭尾相接，直到剩下約6至9條路徑。Metallic與mortar為0。

這是作者設計的示意：畫面是填好答案的盤面，真正的Numberlink只給端點數字；不保證只有唯一解；路徑偏曲折短（因為由骨牌連接而成）；6×6固定、數字為3×5點陣；若合併過程停在超過9條路徑，數字會超出點陣表（我對300個seed加九個測試seed都沒遇到，但沒有證明不會發生）。預設0.4 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`rushhourjam`（交通阻塞／Rush Hour）使目前目錄1004→1005種，含plain的gallery為1006項。每tile是一個6×6的滑動車輛盤面：深色的目標車（2格、水平，位於出口那一列）、約10輛長度2（約七成）或3的車與卡車（水平或垂直，圓角矩形、各自有些微不同的灰階深淺），盤面外圍有深色牆，右側出口那一列的牆是開口。車輛互不重疊；水平的車不會放在出口列（否則目標車永遠出不去）。車輛由seed產生：目標車的起始欄隨機，其餘車輛隨機嘗試位置與方向，不重疊就放下，直到約11輛（含目標車）或嘗試次數用完。Metallic與mortar為0。

這是作者設計的示意：畫面只是一個盤面狀態，**不保證有解**（我沒有寫求解器；垂直的車仍可能把目標車永久卡死）、不是難題；顏色只有明度（深目標車與灰階車輛）、沒有色相；車身為簡單圓角矩形、沒有車窗或車燈；6×6固定、出口固定在右側第3列。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`mancalaboard`（播棋／Mancala）使目前目錄1005→1006種，含plain的gallery為1007項。每tile是一個木質的Mancala棋盤：淺色桌面上有一塊圓角的棋盤，棋盤兩側各一個長條形的「倉庫」、中間上下兩排各6個圓形的「坑」，坑與倉庫是深色的凹洞，其中放著淺色的小圓石子。石子共48顆，由seed隨機分配到12個坑與2個倉庫（每個坑最多12顆、倉庫最多24顆，超過上限的容器不再接受）；每個容器內的石子由中心向外依序排列。桌面與棋盤有些微的木紋明暗變化（沿水平方向拉長的雜訊）。Metallic與mortar為0。

這是作者設計的示意：不是遊戲規則驗證——分配是隨機的，不代表任何合法的Mancala對局狀態（真實對局的石子分佈取決於雙方走法）；也沒有畫出玩家標記或對戰方向；石子小（半徑約0.0125個tile寬），在小尺寸下難以辨識；顏色只有明度（木色由暗到亮的線性色帶）。預設0.6 m nominal tile、0.006 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`hidatochain`（數字連鎖謎題／Hidato）使目前目錄1006→1007種，含plain的gallery為1008項。每tile是一個7×7已解開的Hidato盤面：49格各寫一個1至49的點陣數字（單位數置中、兩位數以3×5字形並排），每個數字恰好出現一次，且相鄰的兩個數字k與k+1必定在上下左右或斜角相鄰（國王走法），所以1到49連成一條走遍全盤的路徑。起點「1」與終點「49」以深色底、反白數字標示，另有約22%的格子底色稍暗（模擬「給定的數字」）。路徑由seed以回溯搜尋產生：從隨機的起點出發，每一步優先走「之後可走的空格最少」的相鄰格（Warnsdorff規則，同分以雜湊決定）。Metallic與mortar為0。

這是作者設計的示意：畫面是填好全部數字的盤面，真正的Hidato只給部分數字；底色較暗的「給定」格只是隨機裝飾，與題目是否有唯一解無關；不保證只有唯一解；回溯搜尋有節點上限（100000個），我對300個seed加九個測試seed都找得到解（獨立腳本量測的最大節點數約2650），若超過上限盤面會停在未走完的路徑上，未驗證其外觀；7×7固定。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`euclideanrhythms`（歐幾里得節奏／Euclidean rhythms）使目前目錄1007→1008種，含plain的gallery為1009項。每tile是一個16步×16軌的步進音序器面板：深色面板上排列著16×16個圓角方形的按鍵（pad），亮起的按鍵代表該步有一個脈衝。每一軌是一個「歐幾里得節奏」——在16步中放入k個脈衝（k由seed在1至8之間隨機決定），並盡可能均勻地分佈（用Bresenham式的整除分佈：第i步亮起當且僅當 (i×k) mod 16 < k），再依seed隨機旋轉起點；因此任兩個相鄰脈衝（含繞回）的間隔只可能是⌊16/k⌋或⌈16/k⌉，且較大的間隔恰有 16 mod k 個。每4步（第1、5、9、13欄）的未亮按鍵底色稍亮，標示拍點。Metallic與mortar為0。

這是作者設計的示意：這是靜態圖案，沒有任何音訊；這種「Bresenham」分佈與Bjorklund演算法產生的節奏是旋轉等價的（同一個項鍊），但我沒有逐一證明所有k都等價，也沒有宣稱每條軌道都等同某個特定的傳統節奏名稱；16×16固定；顏色只有明度（深面板、灰按鍵、亮起的米色按鍵）。預設0.4 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`chinesecheckersboard`（中國跳棋／Chinese checkers）使目前目錄1008→1009種，含plain的gallery為1010項。每tile是一個木質的中國跳棋星形棋盤：淺色桌面上一個圓形的棋盤板，板上是121個圓孔組成的六角星——中央是半徑4的六角形（61孔），六個星角各有一個10孔的三角形。孔是深色凹洞，其中的彈珠有六種明度（由暗到亮：約0.30、0.42、0.55、0.69、0.83、0.96），每個星角起始時各放10顆同一明度的彈珠，之後由seed隨機把14顆彈珠各自搬到一個隨機的空孔，所以每種明度仍恰好10顆、共60顆。孔位用立方座標（q, r, s=−q−r）與蜂巢格點對應：六角星是「三個座標都≥−4」與「三個座標都≤4」兩個相反三角形的聯集。Metallic與mortar為0。

這是作者設計的示意：六種彈珠只靠明度區分、沒有色相（真實棋具是六種顏色），明度相近的相鄰兩種（差約0.12至0.14）在小尺寸或不同光照下不容易分辨；彈珠的搬動是隨機交換、不代表合法的跳棋走法（沒有檢查跳躍規則）；也沒有標示各玩家的目標角；木紋只是低振幅的雜訊。預設0.6 m nominal tile、0.006 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`colormapregions`（地圖著色／map colouring）使目前目錄1009→1010種，含plain的gallery為1011項。每tile是一個可無縫平鋪的「地圖」：6×6個隨機抖動的點為中心做週期性的Voronoi分區（共36個區域，邊界是較暗的細線），每個區域塗上一種明度，而且**任兩個相鄰的區域（包含跨越tile邊緣接上下一張tile的相鄰）明度都不同**。著色用回溯搜尋：先嘗試4種明度，找不到（節點上限30000）再用5種（0.30、0.44、0.58、0.72、0.86）；我對100個seed實測，其中66個只用4種、34個用到5種、沒有一個著色失敗。相鄰關係由取樣器在512×512的週期網格上掃描「擁有者改變處」（含斜向）得到。Metallic與mortar為0。

這是作者設計的示意：因為地圖是環面（左右、上下相接），它不受平面圖的四色定理保證——所以不一定能用4色，有三分之一左右的seed需要5色（上面的實測），名稱不代表只用4色；相鄰關係以掃描偵測，長度小於約0.002個tile寬的極短邊界理論上可能漏掉（我用1024網格對seed 2、3重新掃描時沒有發現遺漏，但沒有對所有seed證明）；顏色只有明度。取樣器建立時額外花約32 ms（100個seed平均、在Bun的量測，不是效能認證）。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`draughtsposition`（西洋跳棋盤面／draughts, checkers）使目前目錄1010→1011種，含plain的gallery為1012項。每tile是一個8×8的西洋跳棋盤：淺色桌面上一個黑白（實為淺棕與深棕）相間的棋盤，棋子只放在深色格（第(列+行)為奇數的格子）。兩方各有6至12顆棋子（由seed隨機決定），一方是淡色圓盤、另一方是炭黑色圓盤；約兩成的棋子是「王」，圓盤中央有一個與盤色相反的同心圓環。棋子位置由seed隨機選取：把32個深色格隨機排序，兩方依序取用，所以不會重疊也不會落在淺色格。Metallic與mortar為0。

這是作者設計的示意：不是合法的對局狀態——棋子位置是隨機的，不保證符合任何走子歷史（例如兵可能出現在對方的底線而沒有升王，兩方的棋子也可能混在同一個區域）；也沒有表示輪到誰走；顏色只有明度（淡色棋與淺色格的對比小，炭黑棋與深色格的對比也有限）；木紋只是低振幅雜訊。預設0.5 m nominal tile、0.006 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`multiplicationtable`（乘法表／times table）使目前目錄1011→1012種，含plain的gallery為1013項。每tile是一張9×9的乘法表：第一列與第一欄是深色底、反白點陣數字的因數1至9（左上角空白），其餘81格是對應的乘積（1至81，個位數置中、兩位數以3×5字形並排），對角線上的平方數（1、4、9、…、81）底色稍暗。表格以淺紙色為底，細格線。內容是確定的，不隨seed改變；seed只影響紙張的細微雜訊。Metallic與mortar為0。

這是作者設計的示意：因數只到9（不是12×12的常見大表）；因為內容固定、不同seed只有雜訊差異；點陣數字在小尺寸下難以辨識。預設0.4 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`moonphases`（月相／moon phases）使目前目錄1012→1013種，含plain的gallery為1014項。每tile是一張月相日曆：深藍色夜空上排成5欄×6列共30個月亮，依序代表朔望月（29.53天）中連續的30天，從新月經上弦、滿月、下弦再回到殘月。每個月亮是一個帶有隨機環形山（同一組24個，因為是同一個月球）的灰色圓盤，被照亮的部分是淡色、陰影部分是暗灰色；盈月時（前半個週期）由右側受光，虧月時（後半個週期）由左側受光，明暗界線是橢圓：照亮面積占全圓的比例是 (1−cos 2πφ)/2，其中 φ 是週期內的相位。日曆起點是seed決定的、不足一天的相位偏移，所以不同seed的月相略有差異。Metallic與mortar為0。

這是作者設計的示意：不是天文曆表——相位只用單純的餘弦公式（朔望月固定取29.53天），沒有月球的天平動、地球的反照（地球光）或真實的月面地貌；北半球視角（盈月時右側受光），南半球觀察者會看到左右相反；30天只涵蓋29.53天的一個週期，所以第一個與最後一個月亮的相位接近但不是完全相同；顏色只有明度。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`treemaprects`（樹狀圖／treemap）使目前目錄1013→1014種，含plain的gallery為1015項。每tile是一張樹狀圖：一個方形區域被切成12個長方形，每個長方形的**面積正比於它的數值**，數值（4至30的整數，由seed隨機決定）以3×5點陣數字寫在長方形左上角；數值越大底色越亮（線性對應到由暗到亮的色帶）。切法：把數值由大到小排列，分成總和盡可能相等的兩組（輪流把下一個數值放進目前總和較小的組），沿目前長方形較長的一邊按兩組總和的比例切開，再對兩邊遞迴，直到每組只剩一個數值；長方形之間以深色粗線分隔。Metallic與mortar為0。

這是作者設計的示意：不是常見的「squarified」樹狀圖演算法，只是平衡二分遞迴，長方形的長寬比不保證很接近正方形（我沒有量測最壞長寬比）；數值是隨機的，沒有任何實際資料意義；標籤為固定大小的點陣，長方形很窄時標籤可能超出邊界（測試只確認九個seed的標籤能被正確讀出，沒有檢查標籤是否完全落在長方形內，也沒有證明不會超出）；顏色只有明度。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`analogclocks`（類比時鐘）使目前目錄1014→1015種，含plain的gallery為1016項。每tile是一面4×4的時鐘牆：灰色牆面上16個圓形鐘面（淡色鐘面、深色邊框、十二個刻度），每個鐘各自顯示一個由seed隨機決定的時刻（1至12點、0至59整分）。指針的角度依真實時鐘的轉法計算：分針每分鐘轉6°；時針每小時轉30°再加上每分鐘0.5°，所以時針會隨分鐘慢慢移動，而不是停在整點的位置。時針較短較粗（長度為鐘面半徑的0.5倍），分針較長較細（0.8倍），中心有一個小圓座。Metallic與mortar為0。

這是作者設計的示意：沒有秒針、沒有數字、也沒有區分上午下午；刻度只有12個、沒有分刻度；指針是簡單的直線棒、沒有裝飾形狀；鐘面各自獨立隨機，同一面牆上時間不連貫；顏色只有明度。預設0.5 m nominal tile、0.005 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`piechartwedges`（圓餅圖）使目前目錄1015→1016種，含plain的gallery為1017項。每tile是一個圓餅圖：一個圓被切成8個扇形，每個扇形的**圓心角等於它的百分比×3.6°**，百分比（每個至少4%、8個加起來恰為100%）以3×5點陣數字寫在扇形中段。百分比由seed決定：每個先分到4%的底，剩下的68%依隨機權重分配，再用「最大餘數法」讓總和恰為100。第一個扇形從seed決定的角度起、順時針排列；每個扇形有各自的明度（依大小排名，由暗到亮線性對應，大小相同時依位置順序決定）；扇形之間與圓周以深色細線分隔，數字依底色明暗選用深或淺色。Metallic與mortar為0。

這是作者設計的示意：百分比是隨機的，沒有任何資料意義；扇形最小4%（約14.4°），標籤是固定大小的點陣，小扇形的標籤可能緊貼邊線；明度只有排名、沒有色相；沒有圖例、標題或軸。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`regressionscatter`（迴歸散佈圖）使目前目錄1016→1017種，含plain的gallery為1018項。每tile是一張散佈圖：淺色紙上一個方形的繪圖區（細框、4×4的淡色格線），區內有最多28個深色圓點，圍繞著一條由seed決定斜率與截距的直線散佈（各點的雜訊是三個均勻亂數相加得到的近似常態分佈），任兩點的距離不小於0.075（繪圖區單位），再從這些點用**最小平方法**求出迴歸直線（斜率＝Σ(x−x̄)(y−ȳ)／Σ(x−x̄)²，截距＝ȳ−斜率·x̄），以較細的中灰色線畫過整個繪圖區。因為擬合是由實際畫出的點算出來的，直線一定通過各點的重心。Metallic與mortar為0。

這是作者設計的示意：因為「最小間距」的拒絕取樣有次數上限，點數可能少於28（我沒有統計各seed的實際點數，測試只要求至少15個）；沒有座標軸刻度數字、標題或圖例；不計算相關係數或殘差；雜訊近似常態但不是嚴格的常態分佈；顏色只有明度（深色點、中灰色線、淡色格線）。預設0.4 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`barchartbars`（長條圖）使目前目錄1017→1018種，含plain的gallery為1019項。每tile是一張長條圖：淡色紙上一條深色基準線，上方並排10根長條，每根的高度是**整數個單位**（單位為0.075個tile高，值為1至9，由seed隨機決定），並在長條頂端上方以3×5點陣數字置中寫出該值；每個整數高度處有一條很淡的水平格線；長條的底色依數值線性對應到由暗到亮的色帶（值大者較亮）。Metallic與mortar為0。

這是作者設計的示意：沒有座標軸刻度數字、標題或圖例；所有長條共用同一個高度單位；數值是隨機的，沒有資料意義；長條只到9個單位（最高約0.675個tile高）；顏色只有明度。預設0.4 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`truthtablelogic`（真值表）使目前目錄1018→1019種，含plain的gallery為1020項。每tile是一張四輸入布林函數的真值表：深色表頭寫著輸入A、B、C、D與輸出X（3×5點陣字母，X欄的表頭色調稍亮），下面16列依序列出ABCD的二進位計數（0000到1111，A是最高位），每列最右邊是輸出X的值；X為1的格子底色較暗以便辨認。輸出由seed從八個函數中選一個：(A∧B)∨(C⊕D)、(A⊕B)∧(C∨D)、A?B:C（多工器，與D無關）、¬(A∨B)∨(C∧D)、(A∨C)∧(B∨D)、多數決(A,B,C)⊕D、(A∧¬B)∨(C∧¬D)、四位元奇偶（A⊕B⊕C⊕D）。Metallic與mortar為0。

這是作者設計的示意：只有這八個固定的函數（不是任意的真值表）；輸出以格子底色加深標示是裝飾；沒有化簡後的布林式或邏輯閘符號；點陣數字與字母在小尺寸下難以辨識。預設0.4 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`fouriersquarewaves`（傅立葉方波）使目前目錄1019→1020種，含plain的gallery為1021項。每tile是一張由6個橫向面板疊成的圖：第n個面板畫出方波的傅立葉級數前n個奇次諧波的部分和 (4/π)·Σ sin(kt)/k（k=1, 3, …, 2n−1）。第1個面板是一條純正弦波（振幅4/π），之後每加一個諧波，上下平台越來越平但邊緣出現更多漣波，轉折處越來越陡，而轉折前後約9%的過衝（Gibbs現象）不會消失，會趨近約1.179倍的方波高度。每個面板含淡色的軸線與兩條代表理想方波高低位準的參考線，波形以深色曲線畫出（線寬依斜率修正，陡處不會變細），每個tile橫向涵蓋2個週期。內容是確定的；seed只影響紙張的細微雜訊。Metallic與mortar為0。

這是作者設計的示意：只畫了1至6個諧波，沒有更高階；曲線是用解析公式逐像素計算的，不是描點連線；縱向比例固定，沒有座標軸刻度或標示；「約9%的過衝」是Gibbs現象的理論值（過衝約為整個跳躍幅度的9%，使峰值約為方波高度的1.179倍），測試只驗證量測得到的第6個面板最大值介於1.1與1.2之間，不是精確等於。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`pascaltrianglenumbers`（帕斯卡三角形數字）使目前目錄1020→1021種，含plain的gallery為1022項。每tile是帕斯卡三角形的前10列（第0到第9列，最大的數是126），以3×5點陣數字置中排列成三角形；每個數是上一列左上與右上兩數之和，奇數放在一個較暗的圓盤上、偶數直接落在紙面上，因此奇數圓盤自然呈現謝爾賓斯基三角形的圖樣。內容是確定的，seed只影響紙張的細微雜訊。Metallic與mortar為0。

這是作者設計的示意：只畫了前10列；奇偶圓盤與數字都是確定的；沒有二項式展開式或列和標示；點陣數字在小尺寸下難以辨識。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`convexhullpoints`（凸包）使目前目錄1021→1022種，含plain的gallery為1023項。每tile是一組散布的點（最多16個，彼此至少相隔0.12 UV，並與tile邊緣保持0.07 UV以上的距離，因此可無縫重複）以及它們的凸包：凸包頂點用較大的深色圓點標示，內部的點用較小的圓點，凸包多邊形以淡灰色填色並以細線描邊。凸包由seed決定的點集以Andrew單調鏈算法計算。為了讓凸包不產生歧義，取樣器會挑選「沒有頂點幾乎與相鄰兩頂點共線、也沒有內部點緊貼某條邊」的點集（最多嘗試48組，不符合時採用最後一組）。Metallic與mortar為0。

這是作者設計的示意：點數最多16（受最小間距限制，部分seed較少）；只顯示凸包，不顯示算法過程；「清楚」的判斷是我設定的門檻（頂點離鄰點連線至少0.012 UV、內部點離邊至少0.02 UV），不是數學上的必要條件；48組都不合格時仍會採用最後一組（在我測過的600個seed中此情況沒有造成測試失敗，但我沒有直接統計用完48組的比例）。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`delaunaytriangles`（德勞內三角剖分）使目前目錄1022→1023種，含plain的gallery為1024項。每tile是一組散布的點（最多18個，彼此至少相隔0.1 UV，並與tile邊緣保持0.06 UV以上距離，因此可無縫重複）以及它們的德勞內三角剖分：每個三角形以略有深淺差異的淡灰色填色，邊以細線描出，頂點為深色小圓點。三角剖分以暴力法計算：任意三點若其外接圓內（嚴格）沒有其他點，就是一個德勞內三角形（約816組三點乘以其餘點數，只在取樣器建立時算一次）。Metallic與mortar為0。

這是作者設計的示意：只畫出三角剖分的結果，沒有畫外接圓或演算過程；點數最多18（受最小間距限制，部分seed較少）；點的位置是seed決定的偽隨機，對「四點幾乎共圓」的近似平手情況沒有特別處理，這些情況是否判成德勞內三角形取決於浮點誤差，可能出現互相重疊的三角形，我沒有針對這種情況加入保護；每像素要掃過約30個三角形與約47條邊，每像素成本比多數材質高（512×512單次渲染約0.4秒，Bun環境）。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`collatzsequences`（考拉茲序列）使目前目錄1023→1024種，含plain的gallery為1025項。每tile有10列，每列是一個起始值的考拉茲（冰雹）序列：偶數折半、奇數乘3加1，一路算到1為止，每個數字佔一格（最多13格），用3×5點陣數字寫出；奇數的格子底色較暗，所以可以看到「乘3加1」的上升步驟；序列結束後該列剩下的格子留白。起始值由seed從2到60之間序列長度不超過13項的21個值裡洗牌後取10個（互不相同），例如3、13、21、53、40等；每個序列只含該起始值自己的軌跡。Metallic與mortar為0。

這是作者設計的示意：只列出序列長度不超過13項的起始值（不含如27這種很長的軌跡），所以並不代表考拉茲猜想本身；數字最多三位（例如53的序列含160）；點陣數字在小尺寸下難以辨識。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`hammingcodewords`（漢明碼字）使目前目錄1024→1025種，含plain的gallery為1026項。每tile是一張Hamming(7,4)碼字表：表頭是位置1到7與S（校正子），下面16列是資料半位元組0000到1111（列號r）對應的7位元碼字（位置1到7依序為p1 p2 d1 p3 d2 d3 d4，同位位元在位置1、2、4，底色略暗），每列由seed決定是否翻轉其中一個位元（約八分之一的列不翻轉），被翻轉的格子以最深的底色標示；最右欄S是校正子（收到的字中值為1的位置的XOR），它恰好等於被翻轉的位置，0表示沒有錯誤。因此可以讀到：把S指出的那一格翻回來，就得到原本的碼字，其資料位元就是列號。Metallic與mortar為0。

這是作者設計的示意：只有Hamming(7,4)這一種碼、16列固定是資料0到15，每列最多翻轉一個位元（Hamming碼無法修正兩位元錯誤，所以不畫）；翻轉位置由seed偽隨機決定；點陣數字小尺寸下難以辨識。預設0.4 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`cayleytables`（凱萊表）使目前目錄1025→1026種，含plain的gallery為1027項。每tile是一張8階群的凱萊（乘法）表：9×9格，最上列與最左欄為元素0到7的深色表頭，其餘8×8格的第a列第b欄是a與b的乘積；表中值為0的格子（單位元）底色較暗，因此可以看到每個單位元各自成一條由拉丁方陣決定的圖樣。seed從8階的五個群裡挑一個：循環群Z8、Z4×Z2、Z2×Z2×Z2、二面體群D4、四元數群Q8，並且把元素1到7的標籤打亂（0固定為單位元）。因此每張表都滿足群公理：有單位元、每列每欄是排列、可結合；表的樣子則可看出是否交換、各元素的階。Metallic與mortar為0。

這是作者設計的示意：只有這五個8階群，沒有其他階或群名標示；標籤打亂後表格看起來不再有「規律」；點陣數字在小尺寸下難以辨識。預設0.4 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`romannumerals`（羅馬數字）使目前目錄1026→1027種，含plain的gallery為1028項。每tile有14列，每列左邊是一個十進位數（1到199，靠右對齊的三格），後面是等號與它的羅馬數字（以I、V、X、L、C的3×5點陣字母寫出，標準減法寫法，例如4寫成IV、9寫成IX、40寫成XL、90寫成XC；靠左、最多九個字母，例如188寫成CLXXXVIII）；奇數列有略深的底色。14個數由seed從1到199中挑選、互不相同並依升序排列。Metallic與mortar為0。

這是作者設計的示意：只到199（不含D、M，所以沒有500以上的數字）；只使用標準的減法寫法，不畫古代的IIII等變體；點陣字母在小尺寸下難以辨識（I與數字1的圖形不同，但很小時仍可能混淆）。預設0.4 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`signedencodings`（帶號整數編碼）使目前目錄1027→1028種，含plain的gallery為1029項。每tile是一張4位元的對照表：16列依序列出0000到1111，每列有二進位位元（最高位元所在的欄底色最深，是符號位元）、無號數值（0到15，標頭為U），以及帶號數值（標頭為編碼代號）。seed從三種帶號編碼挑一種：二補數（2C，1000是−8到1111是−1）、一補數（1C，1000是−7，1111是「−0」）、符號大小（SM，1000是「−0」、1001是−1到1111是−7）；負值的列（包括「−0」）底色略深，並以「−」符號寫在帶號數值前面。Metallic與mortar為0。

這是作者設計的示意：只有4位元、只有這三種編碼，沒有溢位或運算示意；一補數與符號大小有「負零」，二補數沒有，這個差異就是這三者並列的目的；點陣數字在小尺寸下難以辨識。預設0.4 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`matrixproducts`（矩陣乘積）使目前目錄1028→1029種，含plain的gallery為1030項。每tile疊著4道算式，每道是A×B=C的3×3矩陣乘法：A與B的9個元素是seed抽出的0到9個位數，C是它們的矩陣乘積（元素最多三位數，例如141、153）；每個矩陣外有方括號，乘積C的格子底色略深，乘號與等號對齊在中間那一列。數字以3×5點陣寫出。Metallic與mortar為0。

這是作者設計的示意：只有3×3、元素為0到9；沒有顯示計算過程，也不排除含0的列或全零的矩陣；點陣數字在小尺寸下難以辨識（三位數的乘積格間隙很窄）。預設0.4 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`kochsnowflake`（科赫雪花）使目前目錄1029→1030種，含plain的gallery為1031項。每tile分成2×2四個面板，分別畫出科赫雪花經過0、1、2、3次迭代的樣子：0次是正三角形，之後每一次把每條邊的中間三分之一換成向外的正三角形凸起。四個面板的順序與各自的旋轉角度由seed決定，每個多邊形（最多192段）以偶奇規則填色並以深色細線描邊。因此邊界長度每次迭代乘以4/3，面積依A₀·(8/5 − (3/5)(4/9)ⁿ)增加（0次為A₀，無窮多次趨近1.6·A₀）。Metallic與mortar為0。

這是作者設計的示意：只畫0到3次迭代，沒有畫更高次，也不是真正的碎形極限；邊長0.36 UV（約三角形外接圓半徑0.208 UV）固定，各面板之間不重疊；每像素要掃描最多192條邊，512×512單次渲染約0.3秒（Bun，來自預覽腳本、只量一次）。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`newtonbasins`（牛頓吸引盆）使目前目錄1030→1031種，含plain的gallery為1032項。每tile是牛頓法求解z^n − 1（n次單位根）的吸引盆圖：複平面上實部與虛部各−1.6到1.6的正方形視窗，每個點依牛頓迭代z ← z − (z^n − 1)/(n z^(n−1))最後收斂到哪個n次單位根而被塗上對應的亮度（根越多、亮度層級越多），收斂越慢的點略微變暗（最多變暗10步）。n由seed從3、4、5挑選；座標經過三角波折疊，所以圖案在tile邊緣連續。Metallic與mortar為0。

這是作者設計的示意：只有z^n − 1這一類多項式、n為3到5；亮度只表示收斂到哪個根與速度，不是色相（程序材質只有深到淺的亮度漸層）；吸引盆邊界是碎形，邊界附近的像素對浮點誤差敏感，每個像素最多迭代40次，無法收斂的點（接近邊界或極點）依最後位置歸類；三角波折疊使圖樣左右、上下鏡射。預設0.6 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`mandelbrotbands`（曼德博等高帶）使目前目錄1031→1032種，含plain的gallery為1033項。每tile是曼德博集合的平滑逃逸時間等高圖：seed從四個固定視窗挑一個——整個集合（中心−0.6，半寬1.6，80次迭代）、海馬谷（−0.745 + 0.113i，半寬0.06）、一個近虛軸的分支（−0.16 + 1.0405i，半寬0.04），以及接近費根鮑姆點的區域（−1.401155，半寬0.02，這三個放大視窗各160次迭代）。集合內部（在迭代次數內沒有逃逸的點）為深色；外部每點以平滑逃逸時間ν = n + 1 − log₂(log|z| / log 256)決定亮度（ν越大越亮，並疊加週期為3的餘弦等高帶），所以集合周圍有一圈圈的帶。座標經三角波折疊，使圖樣在tile邊緣連續。Metallic與mortar為0。

這是作者設計的示意：只有這四個視窗，沒有互動縮放；內部是用迭代次數上限判斷的，集合邊緣的像素會因上限而略有差異（暫時性測試的120個額外seed中，最佳視窗的吻合率全為1.0000（第二名最高0.265），但那是0.02的容差與80×80格點的結果，不代表所有像素都一致）；亮度只表示逃逸速度、不是色相；三角波折疊使圖樣鏡射。每像素最多160次迭代，512×512單次渲染約0.15秒（Bun，預覽腳本，只量一次）。預設0.6 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`cantorsetrows`（康托集合列）使目前目錄1032→1033種，含plain的gallery為1034項。每tile由上到下疊著8條橫帶，第k條（k=0到7）是康托構造進行k步之後的集合：第0條是整條，每多一步就把每個區間的中間一段挖掉。seed從三種「挖掉的比例」挑一種：三分之一（經典的康托集合，第k條有2^k個長度為(1/3)^k的區間）、五分之一（每步保留五分之二，留下較多）、二分之一（每步保留四分之一，留下較少）；第k條共2^k個等長區間、總長度為(1−r)^k（r為挖掉的比例）。Metallic與mortar為0。

這是作者設計的示意：只有8步（第7步的區間窄於一個像素時只看得到淡淡的條紋）、只有這三種挖掉的比例；每條帶的邊緣以到區間邊界的距離軟化；帶與帶之間為紙面。預設0.8 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`conicsections`（圓錐曲線）使目前目錄1033→1034種，含plain的gallery為1035項。每tile分成2×2四個面板，分別畫出離心率e為0、0.6、1、1.6的圓、橢圓、拋物線與雙曲線，面板的排列由seed決定。曲線依「到焦點的距離r = e × 到準線的距離」這條定義畫出（半通徑l固定為0.09 UV；以r = |l − e·x'|表示，x'是沿軸線相對焦點的位移），焦點是一個小圓點，準線（e > 0時）是一條虛線；拋物線與雙曲線延伸到面板邊界為止，雙曲線的兩支都畫出。Metallic與mortar為0。

這是作者設計的示意：只有這四條曲線、軸線固定為水平（不旋轉），沒有座標軸或標示；線寬以隱函數的一階近似距離軟化，所以離頂點很遠的陡處線寬可能略有差異；各面板的焦點位置是為了讓曲線置中而手動設定的（hyperbola焦點往左偏、橢圓往右偏）。預設0.6 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`rosecurves`（玫瑰線）使目前目錄1034→1035種，含plain的gallery為1036項。每tile是3×3九個面板，每個面板畫出一條玫瑰線（rhodonea）r = R·cos(kθ)，k分別為1、2、3、4、5、3/2、5/2、5/3、7/3（整數k給出k或2k片花瓣，分數k給出重疊的多片花瓣，k=1是一個圓），九條曲線在面板中的排列由seed決定。曲線以到極座標隱函數的一階距離估計畫線，並標出原點。Metallic與mortar為0。

這是作者設計的示意：只有這九個k值、振幅固定、沒有旋轉相位；沒有顯示公式或標示；分數k的曲線要走過多圈才閉合（分母乘以2π），取樣器對每個像素在2×分母個半圈上求出到曲線的距離估計，所以在花瓣交會處線寬可能略有差異。預設0.6 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`cassiniovals`（卡西尼卵形線）使目前目錄1035→1036種，含plain的gallery為1037項。每tile以兩個焦點為中心，畫出一族卡西尼卵形線：曲線上每一點到兩焦點的距離之積 |PF₁|·|PF₂| = b² 是常數，b = 比例 × a（a為兩焦點間距的一半，由seed從0.13、0.18、0.23 UV挑一種），比例取0.4、0.7、0.9、1、1.15、1.35、1.6。比例小於1時曲線分成兩個各自包住一個焦點的卵形；比例等於1時是伯努利雙紐線（8字形，畫得較粗）；比例大於1時是包住兩個焦點的單一曲線。兩個焦點以小圓點標出。Metallic與mortar為0。

這是作者設計的示意：只有這7個比例、固定水平放置、沒有座標軸或標示；線寬以隱函數的一階距離估計軟化（在兩焦點的中點，梯度為零，我加了下限1e-6避免除以零，見下方紀錄）；只在三種焦距裡擇一。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`twosourceripples`（雙波源漣漪）使目前目錄1036→1037種，含plain的gallery為1038項。每tile是兩個相同的圓形波源干涉的圖樣：兩個波源在tile中央水平相隔0.22或0.32 UV，波長取0.04、0.052或0.07 UV（兩者都由seed決定），每點的亮度由兩列波的和 cos(k·r₁) + cos(k·r₂) = 2 cos(k(r₁+r₂)/2) cos(k(r₁−r₂)/2) 決定（r₁、r₂是到兩個波源的距離），所以在 r₁ − r₂ 等於半波長奇數倍的雙曲線上相消、亮度落在中間值（節線），而兩波同步的位置最亮或最暗。座標經三角波折疊，使圖樣在tile邊緣連續。Metallic與mortar為0。

這是作者設計的示意：只有兩個等振幅、同相位的點波源，沒有衰減也沒有反射邊界（三角波折疊只是為了接縫連續，不是物理上的鏡射）；亮度只是干涉強度、不是色相。預設0.5 m nominal tile、0.006 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽（波長0.04 UV在512×512只有約20個像素，更小尺寸會出現混疊）；不宣稱本段已完成三backend或跨瀏覽器驗證。

`luhnnumbers`（盧恩校驗碼數字）使目前目錄1037→1038種，含plain的gallery為1039項。每tile有10列16位數字（每4位一組，組間留空），每列最後一位是校驗碼（底色較深），列尾有一個符號：打勾表示整個數字通過Luhn校驗（從右邊起每隔一位乘2、大於9則減9，全部加總是10的倍數），打叉表示沒有通過。每列的前15位由seed抽出、校驗碼由它算出；約六成的列保持有效，其餘則把其中一位改成別的數字（改變任何一位都必然破壞Luhn總和），所以標記與實際校驗結果一致。Metallic與mortar為0。

這是作者設計的示意：數字是隨機的，不是真實的卡號（也不模擬任何發卡機構的開頭規則或長度），僅用於示意Luhn演算法；每個tile的有效比例由seed的偽隨機決定（約六成，而非固定數量）；第2、4、…列有略深的底色；點陣數字在小尺寸下難以辨識。預設0.4 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`bezierconstruction`（貝茲曲線作圖）使目前目錄1038→1039種，含plain的gallery為1040項。每tile分成2×2四個面板，每個面板畫出一條三次貝茲曲線（四個固定的控制點P₀到P₃，共四種不同形狀，排列由seed決定），並顯示德卡斯特里奧（de Casteljau）作圖法在某個參數t的過程：虛線連出控制多邊形，端點P₀與P₃是實心方塊、中間兩個控制點P₁與P₂是空心圓環，然後在t處把相鄰點內插得到的第一層與第二層線段以細線畫出，最後一個內插點就是曲線上的點，用實心圓點標出。t由seed從1/4、1/3、1/2、2/3挑一個，四個面板共用同一個t。Metallic與mortar為0。

這是作者設計的示意：只有四條固定的三次曲線與四個固定的t；曲線本身是64段折線近似（每像素對64條線段求距離）；虛線只是控制多邊形的示意，虛線的斷續是由螢幕座標的格點決定，不是沿線的等長虛線；單次512×512渲染約0.2秒（Bun、預覽腳本、只量一次）。預設0.6 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`vennregions`（文氏圖區域）使目前目錄1039→1040種，含plain的gallery為1041項。每tile畫一張三個集合A、B、C的文氏圖：三個等大的圓以等邊三角形排列，彼此部分重疊，形成七個區域（只在A、只在B、只在C、A與B、A與C、B與C、三者共有），每個區域中央寫著元素個數（0到40，由seed抽出，以3×5點陣數字寫出），圓重疊的地方底色越來越深（圈內圈數越多越深），圓周畫成深色細線；左上角列出三行總數「A=…」「B=…」「C=…」，各是該圓內所有區域的個數總和，所以可以用容斥原理驗證聯集的大小。Metallic與mortar為0。

這是作者設計的示意：只有三個集合、七個區域，圓的位置與大小固定；區域個數是隨機的，不是真實資料；總數至多三位數（例如A=105）；點陣數字在小尺寸下難以辨識。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`ieee754floats`（IEEE 754單精度浮點數）使目前目錄1040→1041種，含plain的gallery為1042項。每tile由上到下有6組單精度浮點數：每組上面一行是十進位值（取到小數4位，3×5點陣數字、含小數點與負號），下面一行是它的32個位元：1個符號位元（底色最深）、8個指數位元（偏移量127，底色次深）與23個尾數位元（底色最淺），欄位之間以細線分隔。數值依 (−1)^符號 × 2^(指數−127) × (1 + 尾數/2²³) 計算；seed抽出每組的符號、指數（124到133，所以數值的大小約在0.125到128之間）與尾數，所以印出的十進位值與位元是互相對應的。Metallic與mortar為0。

這是作者設計的示意：只有正規化的單精度數、指數固定在124到133、不含0、無限大、NaN與非正規數；十進位值只印4位小數，是把精確值四捨五入後的結果；位元以3×5點陣的0與1寫成，在小尺寸下難以辨識。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`bellcurvebands`（鐘形曲線標準差帶）使目前目錄1041→1042種，含plain的gallery為1043項。每tile畫一條常態分佈的鐘形曲線（高斯函數 e^(−z²/2)，z = (x − 平均)/σ），曲線下方的面積依離平均值的標準差個數分成四個色帶：距離平均不超過1個σ最深、1到2個σ次深、2到3個σ更淺、3個σ以外最淺；底部有一條軸線，並在−3σ到+3σ每個σ處畫一個刻度。σ（曲線的寬度）由seed從0.07、0.09、0.11 UV挑選一個，曲線的高度固定。因為面積與e^(−z²/2)的積分成正比，色帶之間的面積比就是常態分佈的68–95–99.7規則（約68.27%、95.45%、99.73%）。Metallic與mortar為0。

這是作者設計的示意：只有一條標準常態曲線、σ只在三個值中擇一，沒有座標軸標示或數值；曲線的線寬依斜率修正；色帶只用亮度表示（程序材質只有深到淺的亮度漸層）；曲線高度固定，所以不同σ的曲線面積不同（只是形狀相似），這個圖示是為了說明「比例」而非機率密度的絕對值。預設0.6 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`roundingmodes`（取整方式）使目前目錄1042→1043種，含plain的gallery為1044項。每tile是一張取整方式對照表：深色表頭是X與四捨五入的五種方式的代號——FL（無條件捨去，floor）、CE（無條件進位，ceiling）、TR（朝零截斷，truncation）、RN（四捨五入，遇到.5朝遠離零的方向）與RE（四捨五入，遇到.5取偶數，銀行家捨入）；下面12列各是一個數x（取到小數1位）以及它在這五種方式下的整數結果。x由seed從20個預設值（−3.5到6.5，含負數、0與各種恰為.5的數）中挑12個、依由小到大排列；恰為.5的那幾列，RN與RE兩欄的底色較深，因為只有在這種情況這兩種方式的結果可能不同（例如2.5：RN得3、RE得2；3.5：兩者皆4）。結果為0時一律印成「0」，不印負號。Metallic與mortar為0。

這是作者設計的示意：只有這五種方式、只有一位小數的x；挑選的數值池是固定的，沒有任意數；點陣文字在小尺寸下難以辨識（x欄的四個字元恰好填滿格子寬度）。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`binaryaddition`（二進位加法）使目前目錄1043→1044種，含plain的gallery為1045項。每tile由上而下排三道直式加法，各自把兩個隨機的8位元二進位數相加：每道題上方一列小字是進位（進到第1到第8位的進位），接著是加數A、帶「+」號的加數B、一條橫線，最下面是9位元的和（比加數多一位以容納最高位的進位）；和的那一列有較深的底色。進位列的小字放在「會收到這個進位的那一欄」的正上方，最低位（個位）不會收到進位所以沒有字。每一欄都滿足全加器的規則：A位 + B位 + 進來的進位 = 和的位 + 2 × 出去的進位。三道題的A、B由seed決定（雜湊亂數），沒有刻意挑進位鏈。Metallic與mortar為0。

這是作者設計的示意：只有8位元的無號數加法，沒有負數、溢位標記或十進位對照；進位只用較淺的小字，不單獨著色（程序材質只有深到淺的亮度漸層）。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`abeliansandpile`（阿貝爾沙堆）使目前目錄1044→1045種，含plain的gallery為1046項。每tile是在81×81格的網格正中央一格丟下數千顆沙粒後得到的穩定沙堆：只要某格有4顆以上就每4顆分給上下左右四個鄰格各1顆，直到所有格子都不超過3顆，離開網格的沙粒就消失。每格依沙粒數0到3用四個亮度（最暗到最亮）塗色。沙粒數由seed從4000、5200、6400三個值挑一個。這種沙堆的最終形狀與倒塌（toppling）的順序無關（阿貝爾性質），所以結果是確定的，並且具有正方形的八重對稱。Metallic與mortar為0。

這是作者設計的示意：只有中央一點來源、只有三種顆粒數，沒有其他初始配置；格子之間沒有線條，格線與像素對不齊時邊緣會有輕微的階梯（81格對應的像素數不是整數）。堆的範圍只占tile的一部分，其餘是0顆的底色。取樣器第一次呼叫時需要模擬整個沙堆，之後才是查表；預覽腳本在512²量到的單次時間約224毫秒（Bun，未做正式效能量測）。預設0.6 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`percolationclusters`（滲流群集）使目前目錄1045→1046種，含plain的gallery為1047項。每tile是48×48格的位點滲流（site percolation）示意：每一格各自以機率p「打開」，沿邊相鄰的打開格連成一個群集；最大的群集用最深的亮度，其餘大小至少8格的用中間亮度，更小的用較淺的亮度，沒打開的格子是紙面底色。p由seed從0.56、0.5927、0.63三個值挑一個（0.5927是正方晶格位點滲流的臨界值）。Metallic與mortar為0。

這是作者設計的示意：只有正方晶格的位點滲流，群集不跨越tile邊界相連（網格在邊緣被切斷，相鄰tile的群集不會接在一起，tile縫處會看到斷開）；格子之間沒有線，大小只分三級，亮度只表示群集大小，不是其他物理量。p的三個值是固定的，也沒有標示臨界值或「是否貫穿」。預設0.6 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`gcdtable`（最大公因數表）使目前目錄1046→1047種，含plain的gallery為1048項。每tile是一張12×12的最大公因數表：深色的表頭列與表頭欄各是連續12個整數，起點由seed從1、5、13、25中分別挑（列與欄各挑一個，可以不同），表身每格是該列數與該欄數的最大公因數（用數字印出）。互質（最大公因數為1）的格子最淺，其餘格子的亮度隨公因數變大而變深（亮度＝0.5＋0.44÷公因數）。Metallic與mortar為0。

這是作者設計的示意：只有12×12的範圍、只有四個起點，沒有質因數分解或公式；亮度只代表公因數的大小，不是分類。兩位數的數字（例如12、16）幾乎佔滿格寬。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`bitwiselogic`（位元邏輯運算）使目前目錄1047→1048種，含plain的gallery為1049項。每tile由上而下排四個區塊，每個區塊把兩個隨機的8位元數逐位元做一種邏輯運算：第一列是A、第二列是B（左邊標運算名稱），一條橫線，最下面是運算結果；各區塊的運算依序是AND、OR、XOR、NAND的seed決定的排列（每個區塊一種，四種各一次）。1的位元在A與B的列有淡色底，結果列的1位元有較深的底色。Metallic與mortar為0。

這是作者設計的示意：只有四種二元運算、固定8位元，沒有NOT或位移；運算名稱用點陣字母（A、N、D、O、R、X）印出，N的點陣字形是簡化的（像小寫n）。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`logisticbifurcation`（邏輯斯蒂分岔圖）使目前目錄1048→1049種，含plain的gallery為1050項。每tile是邏輯斯蒂映射 x → r·x·(1−x) 的分岔圖：橫軸是成長率r，縱軸是長期（丟掉前300步暫態後再記錄500步）x的值（0在下、1在上）；256×256個像素格，每格依落在其中的記錄值個數用深淺表示（1個就已可見，越多越深，約15個以上飽和）。r的範圍由seed從2.5到4、3.4到4、3.55到3.95三種挑一個。圖上可以看到固定點、週期倍增、混沌帶與週期3的窗口。起始值固定為0.4。Metallic與mortar為0。

這是作者設計的示意：只有邏輯斯蒂映射，沒有座標軸標示、數值或其他映射；每個欄位只用該欄中央的r，不是整段r的平均；混沌區的點分布受浮點運算細節影響，所以只有圖形輪廓與週期區是穩定的。預設0.6 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`burningship`（燃燒船碎形）使目前目錄1049→1050種，含plain的gallery為1051項。每tile是Burning Ship碎形的平滑逃逸時間等值帶：對每個點c，迭代 z → (|Re z| + i|Im z|)² + c（比Mandelbrot集多了對實部與虛部各取絕對值），超過界限（256）就停，用「逃逸步數加上超出界限的小數修正」的平滑逃逸時間決定亮度，並疊加一條隨逃逸時間變化的等值帶；沒有逃逸的點用最暗的底色。視窗由seed從四個預設區域（一個整體視窗與三個放大視窗，座標見preset；放大視窗的名稱與位置我沒有逐一對照過已知的碎形圖鑑）挑一個，以折疊方式取座標，所以圖在tile邊界連續，而且左右上下鏡射。Metallic與mortar為0。

這是作者設計的示意：只有Burning Ship一種碎形，沒有座標標示；因為取座標時做了鏡射，圖形不是標準的「船」方向，整體視窗看起來像鏡射排列的翅膀；視窗是固定的四個，細節區域（例如小船）依靠固定的迭代上限，更深的放大不在範圍內；逃逸邊緣附近的像素對浮點誤差敏感。預設0.6 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`modularpowers`（模冪表）使目前目錄1050→1051種，含plain的gallery為1052項。每tile是一張10×10的模冪表：深色表頭列是指數k＝1到10，表頭欄是底數a＝2到11，表身每格印出 a^k 除以模數m的餘數；模數m由seed從13、15、17、21、25中挑一個。餘數正好是1的格子用較深的底色，這樣可以看出每個底數的冪次循環（乘法階）；與模數有公因數的底數那一整列則是淺灰底，因為這些底數的冪永遠不會回到1。Metallic與mortar為0。

這是作者設計的示意：只有五個模數、底數2到11、指數1到10，不顯示階的數值或循環長度；兩位數的餘數（例如12、10）幾乎佔滿格寬；一個底數與模數有沒有公因數只以列的底色標出，沒有註明是哪個因數。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`primefactors`（質因數分解）使目前目錄1051→1052種，含plain的gallery為1053項。每tile是12列的質因數分解表：每列左邊是一個2到99之間的整數，右邊是把它寫成質數乘積（以「×」連接，由小到大，例如2×2×3×7）的分解；12個整數由seed從2到99中取12個不重複的數，依由小到大排列。本身是質數的列（分解只有它自己）用較深的底色。Metallic與mortar為0。

這是作者設計的示意：只有2到99的整數、每次12個，不顯示指數寫法或質因數個數；點陣字的乘號是簡化的「x」；最長的分解（例如2×2×2×2×2×3）會佔到格寬的大部分。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`baseconversion`（進位制轉換）使目前目錄1052→1053種，含plain的gallery為1054項。每tile是12列的進位制對照表：每列由左到右是同一個0到255之間整數的十進位、8位數的二進位、3位數的八進位與2位數的十六進位（A到F是大寫字母）；12個整數由seed從0到255中取12個不重複的數，依由小到大排列；表身偶數列與奇數列底色交替，十六進位欄含字母A到F的格子底色較深。Metallic與mortar為0。

這是作者設計的示意：只有四種進位制、數值限在0到255，沒有負數、小數或其他進位制；點陣字母（A到F）是簡化字形，B與8、D與0在小尺寸下容易混淆（字形本身不同，測試以精確的像素圖案區分）。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`caesarcipher`（凱薩密碼）使目前目錄1053→1054種，含plain的gallery為1055項。每tile由上而下有三組：字母表A到M與其下一列移位後的密文、字母表N到Z與其密文、一段短訊息與其密文（較淺的灰底表示密文列）；每組之間有一條細線。移位量由seed從3、5、7、13中挑一個（每個字母都往後移這麼多，超過Z就繞回A），訊息由seed從五句預設短句中挑一句。Metallic與mortar為0。

這是作者設計的示意：只有凱薩移位（單一固定的移位量），沒有解密提示、頻率分析或其他密碼；預設短句只有五句，字母用3×5點陣字，某些字母（例如M與N、U與V）在小尺寸下相近。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`wordsquares`（對稱字方陣）使目前目錄1054→1055種，含plain的gallery為1056項。每tile畫一個字方陣：每一列的字與同號的那一欄讀起來相同（第i列等於第i欄）。方陣由seed從六個預設中挑一個：5×5的拉丁文SATOR方陣（SATOR、AREPO、TENET、OPERA、ROTAS）與五個4×4的英文方陣（例如BALL／AREA／LEAD／LADY）。左上到右下的對角線格子（對稱軸）用較深的底色。Metallic與mortar為0。

這是作者設計的示意：只有六個預設方陣，沒有任何由程式搜尋出來的內容；4×4的英文方陣是我用一份手寫的約六百個常見四字母單字清單搜尋、再挑出看起來合理的，不是對照某本辭典驗證，個別字（例如ROTAS、AREPO屬於拉丁文）不保證在標準英文辭典中；字母是3×5點陣字，M與N、U與V等在小尺寸下相近。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`vectorfieldarrows`（向量場箭頭）使目前目錄1055→1056種，含plain的gallery為1057項。每tile在10×10的格點上各畫一支箭頭，方向沿著一個向量場、長度與深淺隨該點向量的大小增加（最弱的箭頭最短最淺，最強的最長最深）。向量場由seed從四個預設中挑一個：旋轉、鞍點、源（向外發散）與螺旋（源加旋轉），座標以tile中心為原點（格點不會落在中心，所以沒有零向量）。Metallic與mortar為0。

這是作者設計的示意：只有四個線性向量場，箭頭只標示格點的方向與相對大小，沒有數值標示或流線；箭頭長度只用0.3到0.88個格寬表示相對大小，不是向量的實際長度；箭頭的頭在很短時按比例縮小，以免超過尾端。預設0.6 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`fordcircles`（福特圓）使目前目錄1056→1057種，含plain的gallery為1058項。每tile畫出福特圓：對每個最簡分數 p/q（0 ≤ p/q ≤ 1，分母q不超過某個上限），在數線上的 p/q 處畫一個與數線相切、直徑為 1/q² 的圓；Farey序列中相鄰的兩個分數（p·q′ − p′·q 的絕對值為1）的圓彼此相切。數線在tile底邊，圓依分母q由大（分母1，最深）到小（較淺）用不同亮度填色，並描深色細邊。分母上限由seed從4、6、8挑一個。Metallic與mortar為0。

這是作者設計的示意：只有 0 到 1 之間的分數、上限只有三個值，沒有標示分數；分母為1的兩個大圓（0/1與1/1）半徑為0.5，所以占滿tile高度並分居左右兩邊；上限8與6、6與4的差別只是幾個很小的圓，在小尺寸下幾乎看不出差別。預設0.6 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`mobiusgrid`（莫比烏斯格網）使目前目錄1057→1058種，含plain的gallery為1059項。每tile是一個黑白棋盤式的方格網經過莫比烏斯變換 w = (az + b)/(cz + d) 之後的樣子：在z平面上的垂直與水平格線（間距0.5）與方格的棋盤式明暗，變換後格線變成圓或直線（圓與圓在交點仍然垂直，因為這是保角變換），方格的明暗跟著搬過來。取樣器對每個像素先用反變換 z = (dw − b)/(−cw + a) 求出z，再用該點的縮放比例 |ad − bc|/|cz + d|² 把z平面中到最近格線的距離換成w平面（畫面上）的距離，使線寬在畫面上是均勻的。變換由seed從三個預設中挑一個：反演 w = 1/z、一個橢圓型變換與一個螺旋（loxodromic）型變換；座標以折疊方式取得，所以圖在tile邊界連續並左右、上下鏡射。Metallic與mortar為0。

這是作者設計的示意：只有三個預設變換，沒有標示極點與固定點；在對應到z平面無窮遠的那一點附近格線無限密，會變成一整片深色（見圖中心深色的團塊）；線寬只在畫面上均勻，不代表z平面的線寬；因為取座標時做了鏡射，圖形是鏡射排列的。預設0.6 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`dipolefieldlines`（偶極場線）使目前目錄1058→1059種，含plain的gallery為1060項。每tile是一對相反電荷的二維線電荷（位於(−h, 0)的正電荷與(h, 0)的負電荷，h由seed從0.25、0.4、0.55挑一個，單位是視窗半寬）的等位線與電場線：電位 V = ln(r₂/r₁)（r₁、r₂是到正、負電荷的距離）每隔0.4畫一條深色等位線（阿波羅尼斯圓），夾角差 θ₁ − θ₂ 每隔18度（π/10）畫一條較淡的電場線（通過兩個電荷的圓）；V大於0的區域用較亮的底色、小於0的用較暗的底色，兩個電荷各畫一個小圓核（正電荷最深、負電荷較淺）。線寬以梯度長度 2h/(r₁r₂) 換算，在畫面上是均勻的。座標以折疊方式取得，所以圖在tile邊界連續並鏡射。Metallic與mortar為0。

這是作者設計的示意：只有一對等量相反的二維線電荷（不是三維點電荷的場，三維的等位線與場線不是圓），沒有電荷符號或數值標示；等位線與場線的間隔是固定的，所以靠近電荷處線非常密，會變成深色的一團；因為取座標時做了鏡射，圖形是鏡射排列的。預設0.6 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`numberwords`（數字的英文拼寫）使目前目錄1059→1060種，含plain的gallery為1061項。每tile是12列的表：左邊是0到99之間的整數，右邊是它的英文名稱（例如FORTY TWO、NINETY）；12個整數由seed從0到99中取12個不重複的數，依由小到大排列；奇偶列底色交替，小於20的數（名稱是單一獨立的字，不是十位加個位）的數字格底色較深。Metallic與mortar為0。

這是作者設計的示意：只有0到99、美式拼寫（NINETY、FORTY），沒有連字號（複合數字以空格分開，例如TWENTY ONE）；字母是3×5點陣大寫字，某些字母（例如M與N、U與V）在小尺寸下相近。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`sorobanabacus`（算盤）使目前目錄1060→1061種，含plain的gallery為1062項。每tile由上而下是兩把七檔的日式算盤（soroban）：邊框、中間一條橫梁與七根檔桿，每根檔桿在橫梁上方有一顆「五珠」、下方有四顆「一珠」；珠子靠向橫梁代表有算入（五珠靠橫梁表示加5，一珠靠橫梁的顆數表示加0到4），遠離橫梁代表未算入，每根檔桿因此表示一位0到9的數字。每把算盤的下方用點陣字印出它所表示的七位數；每位數字由seed決定（雜湊亂數）。Metallic與mortar為0。

這是作者設計的示意：只有日式算盤（一顆五珠、四顆一珠）且固定七檔，沒有小數點標記、計算過程或其他算盤形式（例如中式的二加五）；珠子是同一個色調，靠橫梁或遠離只用位置區分，在下方五個位置中總有一個空位；兩把算盤的數字都是隨機的七位數，可以有前導的0。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`boxplots`（箱型圖）使目前目錄1061→1062種，含plain的gallery為1063項。每tile由上而下是三組箱型圖：每組有15個資料點，分成上下兩列交錯畫成小圓點（資料由小到大的奇偶順序交替，使相鄰的點不重疊），點的上方是這組資料的箱型圖——中間的箱子從第一四分位數（Q1）畫到第三四分位數（Q3），箱內的一條線是中位數，左右各有一條細線（鬚）延伸到最小值與最大值，鬚的末端有小短線。四分位數用Tukey的「折點」定義：15個資料的第8個是中位數，Q1是下方7個值的中位數（第4個）、Q3是上方7個值的中位數（第12個），沒有內插。三組資料的分佈形狀不同（各自的指數0.7、1、1.3使資料偏向一側）。Metallic與mortar為0。

這是作者設計的示意：只有15個點的資料、沒有離群值（鬚就是最小到最大），沒有座標軸或數值標示；資料是由雜湊亂數產生的，不是任何真實資料；箱子的顏色與線條只表示位置，不代表不同組別的意義。預設0.6 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`stemandleaf`（莖葉圖）使目前目錄1062→1063種，含plain的gallery為1064項。每tile是一張莖葉圖：29個10到99之間的整數，以十位數為「莖」（1到9共九列），個位數為「葉」，每一列的葉由小到大排在豎線右邊；29是奇數，所以中位數是排序後的第15個值，那一片葉的底色較深。數值由seed以兩個隨機數的平均產生（三角分佈），所以中間的莖通常葉子較多，外側較少。Metallic與mortar為0。

這是作者設計的示意：只有兩位數的整數、固定29個值，沒有圖例（例如「5|3 = 53」）或其他統計量；資料是雜湊亂數產生的，不是真實資料；同一個值出現多次時重複畫出多片葉；某一列沒有任何葉時只畫莖。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`substitutionwords`（替換序列）使目前目錄1063→1064種，含plain的gallery為1065項。每tile由上而下是一列列由0與1組成的字：第一列是「0」，之後每一列都是把上一列每個字母依規則替換而成（0變成01，1依規則變成0、10或00）；1用深色格、0用中灰色格，所有列共用同一個格寬而靠左對齊，所以可以看出字不斷增長的階梯形狀。規則由seed從三個預設中挑一個：費氏字（0→01、1→0，長度為1、2、3、5、8…，共9列）、Thue–Morse序列（0→01、1→10，長度加倍，共7列）與週期倍增序列（0→01、1→00，長度加倍，共7列）。Metallic與mortar為0。

這是作者設計的示意：只有這三個替換規則與固定的列數；沒有標示規則或索引；列數受tile寬度限制（最長的一列至少有55或64個格），所以格子很窄，小尺寸下深色與中灰色的差別不明顯；seed只影響規則的選擇，同一個規則的畫面對不同seed完全相同（紙面顆粒除外）。預設0.6 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`dicesumbars`（骰子點數和）使目前目錄1064→1065種，含plain的gallery為1066項。每tile是擲兩顆骰子的點數和的次數分佈：橫軸是點數和（從2到面數的兩倍，每欄下方印出該數），每一欄上方用一格一格的小方塊堆疊起來，方塊數就是「兩顆骰子的有序面組合中和等於該數的組數」（例如六面骰的7有6格、2與12各有1格）；組數最多（最可能）的那一欄用較深的色調。骰子的面數由seed從4、6、8挑一個，所以欄數是7、11或15。Metallic與mortar為0。

這是作者設計的示意：只有兩顆相同面數的公正骰子，沒有機率數值或頻率標示（每個方塊只是一種有序組合，(a, b)與(b, a)分開算）；格子很多時（8面骰、15欄）數字很小，小尺寸下不易辨識；與既有的`dicefaces`（骰子的面）是不同的材質。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`binaryheaptree`（二元堆積樹）使目前目錄1065→1066種，含plain的gallery為1067項。每tile是一棵4層、15個節點的完全二元樹：每個節點是一個圓，圓內用點陣字寫一個10到99之間的雙位數，父節點與子節點之間以直線相連；數值滿足堆積（heap）的性質——最小堆積中每個父節點都比兩個子節點小，最大堆積中則都比子節點大，根節點是最小（或最大）值，用較深的底色。seed決定是最小堆積還是最大堆積，並從10到99中取15個不重複的值，依序用標準的「插入後向上調整（sift-up）」放進陣列堆積。Metallic與mortar為0。

這是作者設計的示意：只有15個節點、4層，沒有標示陣列索引或調整的過程；圖上同一層的節點之間沒有大小順序（堆積只保證父子之間的順序）；點陣字在小尺寸下很小。預設0.6 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`bubblesortpasses`（氣泡排序的趟）使目前目錄1066→1067種，含plain的gallery為1068項。每tile是一個8×8的方格表：第一列是1到8的一個隨機排列（由seed決定），之後每一列是對上一列做一趟氣泡排序（由左到右比較相鄰兩數，左邊較大就交換）的結果，共7趟；每一趟之後，最大的那幾個數已經就定位在右端，所以第k列最右邊的k格（它們等於最大的k個數、已排好）用較深的底色。第8列（7趟後）是排好序的1到8。數字用大的點陣字印在每格中。Metallic與mortar為0。

這是作者設計的示意：只有8個數的氣泡排序，沒有標出每一趟交換了哪些相鄰對，也不是其他排序法；即使提前排好，之後的列也照畫（內容相同）；深色底色只表示「已就定位」，不是交換次數。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`graphcoloring`（圖著色）使目前目錄1067→1068種，含plain的gallery為1069項。每tile畫一個圖：頂點是圓，邊是直線；每個頂點依它的顏色類別填上一個亮度（程序材質只有深到淺的亮度漸層，所以用四個亮度代表最多四個顏色），並且是「合法著色」——任何一條邊的兩端不會是同一個亮度。圖由seed從三個預設中挑一個：立方體（8個頂點，2色）、彼得森圖（10個頂點，3色）與五輻的輪圖（一個中心頂點接5個外圈頂點，4色）；每個圖用的色數都是該圖的色數（用最少的顏色著色）。Metallic與mortar為0。

這是作者設計的示意：只有三個預設圖與預設的著色（不是由取樣器現場搜尋出來的）；頂點位置固定，沒有標示頂點編號；立方體畫成兩個同向的方形加四條連線（不是立體透視圖）；同一個亮度的兩個頂點不會相鄰，但不同亮度之間沒有順序意義。預設0.6 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`runlengthrows`（遊程編碼列）使目前目錄1068→1069種，含plain的gallery為1070項。每tile由上而下有五組：每組上面是一列20格的黑白格子（黑色是深色格、白色是淺灰格），格子由長度2到6的隨機遊程（連續同色的一段）交替組成（最後一段可能被列尾截短）；列的下方用點陣字寫出這一列的遊程編碼——每一段的長度後接字母W（白）或B（黑），例如「5W4B6W4B1W」。起始的顏色與各段長度由seed決定。Metallic與mortar為0。

這是作者設計的示意：只有黑白兩色的一維遊程編碼，沒有其他壓縮法或解碼說明；段長只在2到6之間（最後一段除外），所以編碼最長約20個字元，長度剛好放得進tile；字母W與B的點陣是簡化字形，在小尺寸下W與B可能不易分辨。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`isbn10checks`（ISBN-10檢查碼）使目前目錄1069→1070種，含plain的gallery為1071項。每tile是11列的ISBN-10書號表：每列寫成「語區—出版者—書名—檢查碼」（1、3、5、1個字元，用「-」分隔，例如2-909-58056-3），前9位數字由seed決定，第10位（最右邊、底色較深的那一格）是檢查碼：使 10·d₁ + 9·d₂ + … + 1·d₁₀ 是11的倍數；檢查值為10時寫成X。奇偶列底色交替。Metallic與mortar為0。

這是作者設計的示意：只有隨機產生的書號，不是真實的書；語區、出版者與書名的位數固定為1、3、5位（真實ISBN-10的出版者與書名欄位長度不固定）；沒有ISBN-13、條碼或換算。字符是3×5點陣字，X與連字號為簡化字形。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`projectilearcs`（拋體軌跡）使目前目錄1070→1071種，含plain的gallery為1072項。每tile由上而下重複兩個「噴泉」：同一速度的五發拋射體，仰角15°、30°、45°、60°、75°，從tile中線出發向左右兩側對稱飛行，畫成深色的拋物線（無空氣阻力）並落在淺灰色的地面線上；另有一條較淡的「安全拋物線」y = L/2 − x²/(2L)，與每一條軌跡相切、位於所有軌跡之上。其中 L = v²/g 是最大射程，由seed從0.4、0.44、0.48個tile寬中選一個；仰角45°的軌跡落在x = L，其他軌跡落在L·sin(2θ)。Metallic與mortar為0。

這是作者設計的示意：理想的真空拋體，水平與垂直使用同一個長度單位（形狀沒有被拉伸）；沒有標註角度、數字或座標軸，也不是物理模擬；兩個噴泉完全一樣，只是沿垂直方向週期重複。預設0.6 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`sternbrocottree`（分數二元樹）使目前目錄1071→1072種，含plain的gallery為1073項。每tile由上而下畫四層分數：第0層1/1，第1層2個、第2層4個、第3層8個，每個分數用點陣字寫在它的位置（第n層共2ⁿ個，均勻排列在tile寬度上），並用直線把每個分數的下方連到它的兩個子節點上方。seed決定樹的種類：Stern–Brocot樹（每個節點是它所屬區間兩端分數的中項，例如第2層為1/3、2/3、3/2、3/1）或Calkin–Wilf樹（a/b的子節點是a/(a+b)與(a+b)/b，第2層為1/3、3/2、2/3、3/1）。Metallic與mortar為0。

這是作者設計的示意：只畫四層（葉子層沒有再向下的連線，因為再往下一層的分數是兩位數、會擠在一起）；分數都已約分，這兩棵樹都恰好列出每個正有理數一次，但這個材質只畫前四層，沒有標出完整性或與連分數的關係；點陣字的斜線「/」為簡化字形。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`cycloidcusps`（擺線尖點）使目前目錄1072→1073種，含plain的gallery為1074項。每tile分成3×3格，每格畫一條有k個尖點的曲線與它的固定圓（淡灰細線）：第一列是外擺線（圓在固定圓外側滾動）k = 1、2、3（心形線、腎形線…）；第二列是內擺線（圓在固定圓內側滾動）k = 3、4、5（三尖點線、星形線…）；第三列由seed決定畫外擺線k = 4、5、6或內擺線k = 6、7、8；每格的固定圓半徑是k倍的滾動圓半徑，尖點都落在固定圓上。seed另外從四個旋轉角中選一個整體旋轉所有曲線。Metallic與mortar為0。

這是作者設計的示意：理想的曲線，各格以同一個「最遠點離格中心的距離」縮放，所以不同k的滾動圓半徑不同；沒有標註k值或公式；曲線以360段折線近似，並不是解析距離，在尖點處線條可能略有不同。預設0.9 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`zeckendorfrows`（Zeckendorf表示列）使目前目錄1073→1074種，含plain的gallery為1075項。每tile有兩欄、每欄12列，共24個連續整數：每列左邊是十進位數字，右邊是八位的Zeckendorf表示——以費氏數 34、21、13、8、5、3、2、1 為位值（最高位在左）的0與1，且任兩個相鄰位不會同時是1（例如 34 寫成 10000000、35 寫成 10000001、29 寫成 01010000）。起始數由seed從1到31選一個，所以最大的數不超過54（34 + 13 + 5 + 2）。奇數列有淡淡的底色條。Metallic與mortar為0。

這是作者設計的示意：只有費氏位值的0與1，沒有列出位值的標題或加總式；點陣字是3×5字形，沒有零以外的前導零說明（Zeckendorf的位數固定為8位，所以數字前面可能有零）。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`ferrersdiagrams`（費勒斯圖）使目前目錄1074→1075種，含plain的gallery為1076項。每tile是5×3格，每格畫7的一個整數分割（共15個分割）的費勒斯圖：每一列是一排灰色小方格（邊框為深色），列的長度依序是分割的各個部分，靠左對齊，每個圖依自己的寬與高置中在格內；例如[7]是一長排、[6, 1]是6格加下面1格。15個格依「反字典序」排列（[7]、[6, 1]、[5, 2]、[5, 1, 1]、…、[1, 1, 1, 1, 1, 1, 1]）。seed決定兩件事：用英式（最長列在上）還是法式（最長列在下）畫，以及整個圖是否轉置（把每列變成每行，即共軛分割，這會讓15個格依序換成轉置後的分割）。Metallic與mortar為0。

這是作者設計的示意：只畫7的分割，沒有標註分割的數字或計數；格子是固定大小的方格，沒有Young表（沒有填入數字）；英式與法式只改變方向。預設0.7 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`pairingtables`（配對函數表）使目前目錄1075→1076種，含plain的gallery為1077項。每tile是8×8的數字表，每格寫出把「欄x與列y」配成一個自然數的結果，格子有淡淡的棋盤格底色。seed決定三種配對法之一：Cantor配對（沿斜對角線依序編號：π(x, y) = (x + y)(x + y + 1)/2 + y，最大105）、Szudzik配對（沿正方形外殼依序：x < y 時 y² + x，否則 x² + x + y，最大63）或Morton（Z階，把x與y的二進位位元交錯：y的位元在上，最大63），並決定是否把x與y對調（等於把表轉置）。Metallic與mortar為0。

這是作者設計的示意：固定8×8、最多三位數；沒有標示欄列的座標與公式；Cantor的最大值是3位數，其他兩種最多2位數，所以字會有不同寬度（置中）；點陣字是3×5字形。預設0.8 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`hexdumprows`（十六進位傾印列）使目前目錄1076→1077種，含plain的gallery為1078項。每tile有14列隨機位元組的傾印：每列是兩位十六進位的位移、六個位元組（各兩位十六進位）與同樣六個位元組對應的文字，例如「3C 51 45 12 58 0F 55 QE.X.U」；位移每列增加6（對256取餘），起始位移由seed決定且是6的倍數。可顯示的位元組取自 A–Z、0–9 與空白（ASCII 0x41–0x5A、0x30–0x39、0x20）；約14%的位元組是控制碼（0x00–0x1F），文字欄顯示為「.」。奇數列有淡淡的底色條。Metallic與mortar為0。

這是作者設計的示意：位元組是隨機產生的，不是真實檔案；可顯示的只限大寫字母、數字與空白，沒有小寫字母或標點；位移固定為兩位十六進位（超過255會回繞）；點陣字是3×5字形，在小尺寸下0與O、8與B可能不易分辨。預設0.6 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`pythagoreantriples`（畢氏三元數表）使目前目錄1077→1078種，含plain的gallery為1079項。每tile是12列的本原畢氏三元數表：每列依序寫出歐幾里得公式的參數m、n（m > n，一奇一偶，互質）以及由它們算出的兩股a = m² − n²（奇數）、b = 2mn（偶數）與斜邊c = m² + n²，例如「3 2　5 12 13」；斜邊欄有較深的底色，奇數列有淡淡的底色條。m最多為9，這樣一共有18組合法的(m, n)，seed決定12組並依斜邊由小到大排列（斜邊相同時如65，順序由seed決定）。Metallic與mortar為0。

這是作者設計的示意：只列本原三元數（三邊互質），不列倍數；沒有標題列或驗算式；a、b、c固定為3位寬、靠右對齊；點陣字是3×5字形。預設0.5 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`figuratenumbers`（形數點陣）使目前目錄1078→1079種，含plain的gallery為1080項。每tile是4列×5欄：每一欄是n = 1到5，每一列是一種形數的點陣圖，點是深色的小圓：三角形數（每行多一點，共n(n+1)/2個：1、3、6、10、15）、正方形數（n×n個：1、4、9、16、25）、長方形數（n×(n+1)個：2、6、12、20、30）與中心正方形數（以一個點為中心、菱形排列，共2n² − 2n + 1個：1、5、13、25、41）。seed用Fisher–Yates洗牌決定這四種形數從上到下的順序；偶數列有淡淡的底色條。Metallic與mortar為0。

這是作者設計的示意：只畫n = 1到5；點的間距固定，每個圖依自己的大小置中在格內，沒有標註個數；三角形數的列距是點距的√3/2（等邊三角形格點），其他是正方形格點。預設0.8 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`dyckpaths`（Dyck路徑）使目前目錄1079→1080種，含plain的gallery為1081項。每tile是2欄×7列共14格，每格畫出一條長度為4的Dyck路徑：由8步組成，每步向右上或右下走一個單位，從基準線出發、結束在基準線、中途絕不低於基準線；半長為4的Dyck路徑恰好有14條（卡塔蘭數C₄ = 14），14格各畫一條且互不相同。路徑用深色折線與頂點小圓點畫出，基準線用淺灰細線畫出；奇數列有淡淡的底色條。seed用Fisher–Yates洗牌決定14條路徑在格子中的順序。Metallic與mortar為0。

這是作者設計的示意：只畫半長4的路徑，沒有標註步驟字母（U、D）或編號；路徑置中在格內、單位長度固定；不是對所有n的Dyck路徑通用。預設0.7 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`sacksspiral`（薩克斯螺線）使目前目錄1080→1081種，含plain的gallery為1082項。整張tile是一個薩克斯螺線：自然數n放在半徑 c·√n、角度 2π·√n 的位置（阿基米德螺線，因此每個完全平方數都落在同一條射線上），只有質數畫成深色小圓點，其他數不畫。c使最後一個數落在離tile中心0.475處。seed決定兩件事：最後一個數（900、1200或1600三種之一），以及畫哪些質數——全部質數、只畫形如4k + 1的質數，或只畫形如4k + 3的質數（這會讓質數在螺線上的曲線圖案不同）。Metallic與mortar為0。

這是作者設計的示意：沒有畫螺線本身、座標軸或數字標示，只有質數的點；點是固定大小的圓點，質數很密的地方點會彼此靠近或重疊；沒有說明質數分布的任何結論。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`sierpinskipascal`（帕斯卡奇偶三角）使目前目錄1081→1082種，含plain的gallery為1083項。整張tile是2^d × 2^d個方格（d由seed從5、6、7選一個）：第i欄第j列的方格填成深色，當且僅當帕斯卡三角形的數C(i + j, i)是奇數（等價於i與j的二進位沒有共同的1），這就是Sierpiński三角形；另一個三角形是同一張圖轉半圈，所以兩個三角形在對角線上相接，組成整個方形。seed另外決定是否左右鏡像。Metallic與mortar為0。

這是作者設計的示意：只有奇數／偶數兩種顏色，不標註數字；方格是硬邊的（深色方格沒有邊線，邊緣沒有抗鋸齒的色階，只有紋理的顆粒）；深度最多7（128×128個方格），更深在512像素以下會變成不到4像素；兩個三角形在tile邊緣與對角線處的深色格會相連、顯得較粗。預設0.8 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`cobwebplots`（蛛網圖）使目前目錄1082→1083種，含plain的gallery為1084項。整張tile畫一幅邏輯斯諦映射 f(x) = r·x·(1 − x) 的蛛網圖：一個細框方形座標、灰色的拋物線 y = f(x) 與對角線 y = x，以及深色的蛛網——從 (x₀, 0) 垂直走到拋物線，水平走到對角線，再垂直走到拋物線，如此反覆14次迭代。seed從r = 2.8、3.2、3.5、3.74、3.9中選一個、並從x₀ = 0.11、0.27、0.46、0.83中選一個（共20種組合）。Metallic與mortar為0。

這是作者設計的示意：只畫14次迭代，沒有標註r、x₀或座標軸數字；座標軸是一個細方框；r較大時蛛網沒有收斂到不動點，14步之後仍在變動，不代表任何長期行為的結論。預設0.8 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`divisorcountbars`（因數個數長條）使目前目錄1083→1084種，含plain的gallery為1085項。整張tile是一幅長條圖：從seed決定的起點（1到400）開始的64個連續整數，每個整數一條，長條由「每個因數一個小方塊」堆疊而成，所以長條的高度（方塊數）就是該整數的正因數個數 d(n)；質數（d = 2）的方塊最深色、完全平方數（d 為奇數）最淺色、其他介於兩者之間；底下有一條灰色基準線，方塊之間有細縫。Metallic與mortar為0。

這是作者設計的示意：沒有標註整數與座標軸；方塊高度固定，64個整數的 d(n) 最大值在n < 465時不超過24，所以長條不會超出tile的上緣；深淺只表示質數、平方數與其他，不是數值；方塊是硬邊的。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`timestablecircles`（乘法表圓）使目前目錄1084→1085種，含plain的gallery為1086項。每tile是3×3格，每格有一個圓，圓上有72個等分點（從正上方起順時針編號0到71），並用細線把每個點i連到點 k·i（對72取餘）；每一格有不同的乘數k，由seed從2到20中洗牌取9個（k = 2時是心形線的包絡），所以九格的圖案都不同（有些k因與72有公因數而畫出方格或扇形）。每格還畫出圓環（淺灰）與72個深色圓點，棋盤格交錯底色。Metallic與mortar為0。

這是作者設計的示意：點數固定為72；沒有標註k值；用線段而不是曲線，因此細節是由72條弦形成的包絡；k與72有公因數時有些弦重合或退化成點（i到自己）而不畫。預設0.9 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`gaussianprimes`（高斯質數）使目前目錄1085→1086種，含plain的gallery為1087項。整張tile是高斯整數 a + bi 的40×40視窗（a向右增加、b向上增加）：若 a + bi 是高斯質數就在那一格畫一個深色圓點，棋盤格交錯底色。判斷規則是：a、b都不為0時，範數 a² + b² 是質數；a或b有一個為0時，另一個的絕對值是形如 4k + 3 的質數。視窗左下角 [a, b] 由seed從 [0, 0]、[−20, −20]、[−12, −30]、[5, −8]、[−35, 4]、[18, 21] 六種中選一個。Metallic與mortar為0。

這是作者設計的示意：沒有標出座標軸或數字；視窗固定為40×40；沒有畫出單位（±1、±i）與合成數。預設0.8 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`josephuscircle`（約瑟夫圓環）使目前目錄1086→1087種，含plain的gallery為1088項。整張tile是一個約瑟夫問題的示意：n個人站成一圈（編號從正上方起順時針），每數到第k個人就淘汰他；每個人用小圓盤表示，圓盤中寫出這個人被淘汰的順序（1是第一個被淘汰的），最後留下的倖存者（順序為n）用較深的灰色圓盤標出；圈中央用大點陣字寫出步數k。seed決定人數n（17、19、21、23或24）與步數k（2、3、4或5）。Metallic與mortar為0。

這是作者設計的示意：圓盤上只寫淘汰順序，不標示原來的位置編號；中央的大字是k而不是人數；人數與步數限於這幾種，圓盤不重疊。預設0.9 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`periodictablecells`（週期表格）使目前目錄1087→1088種，含plain的gallery為1089項。整張tile畫週期表前四個週期（元素1到36）的版面：18欄、4列，每個元素一格，格內上方是原子序（小的點陣字）、下方是元素符號（大寫字母，例如HE、FE、CU），周期表中沒有元素的位置留白。每格有三種深淺的底色之一，seed決定這三種底色代表什麼：(0) 區塊（依欄別：第1–2族、第3–12族、第13–18族）、(1) 金屬、類金屬與非金屬，或 (2) 在25 °C下是固體、液體（溴）或氣體。Metallic與mortar為0。

這是作者設計的示意：只畫前四個週期（沒有鑭系與錒系，也沒有第5週期以後）；元素符號為了簡化字形一律用大寫（He寫成HE），小尺寸時「MN」與「NA」等字樣可能不易分辨；分類採常見的教科書分法（類金屬為B、Si、Ge、As；非金屬含惰性氣體；氫算非金屬與氣體），不同教材對個別元素的分類可能不同；不標示圖例。資料是由作者依記憶輸入、再用測試檔另外手寫一份比對，沒有對照外部資料來源。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`circleoffifths`（五度圈）使目前目錄1088→1089種，含plain的gallery為1090項。整張tile是一幅五度圈：外圈依序（順時針）寫出12個大調主音（C、G、D、A、E、B、F#、Db、Ab、Eb、Bb、F，每一個比前一個高純五度），中圈寫出各自的關係小調（Am、Em、Bm、F#m、C#m、G#m、Ebm、Bbm、Fm、Cm、Gm、Dm），內圈寫出調號的升降記號數（0、1#到6#、5b到1b），12個扇形交錯淡淡的底色，三圈之間有細線。seed決定頭頂是哪一個調（12種），並決定五度是順時針還是逆時針遞增（逆時針時變成四度圈）。Metallic與mortar為0。

這是作者設計的示意：只寫大調、關係小調與調號數，不畫譜號與音符；F#／Gb這一格只寫F#（6升）；音名用大寫字母加「#」「b」（升降記號用簡化的點陣符號，「#」畫成雙橫雙直的符號）與小寫的m，小尺寸時「b」與「B」、「#」與其他字可能不易分辨。調號與關係小調的資料是我依記憶輸入，測試檔用音高計算（五度＝7個半音、關係小調＝低三個半音、升降記號數＝(音高×7) mod 12）另外驗證，但沒有對照外部資料來源，也沒有驗證同音異名（如C#m與Dbm）的拼法選擇是否符合慣例。預設0.9 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`roulettewheel`（輪盤）使目前目錄1089→1090種，含plain的gallery為1091項。整張tile是一個歐式輪盤的37個口袋環形排列：口袋依輪盤的實際順序（0、32、15、19、4、21、2、25、17、34、6、27、13、36、11、30、8、23、10、5、24、16、33、1、20、14、31、9、22、18、29、7、28、12、35、3、26，繞一圈回到0）排成圓環，每個口袋寫出號碼（點陣字，直立不隨角度旋轉）；紅色口袋是中灰、黑色口袋是深色、0是淺色，號碼在紅黑口袋上用淺色字、在0上用深色字，口袋之間有細分隔線；中央有一個灰色圓盤。seed決定頭頂的是哪一個口袋（37種），並決定從頭頂順時針讀是依輪盤的順序還是反方向。Metallic與mortar為0。

這是作者設計的示意：不畫輪盤的轉軸、小球、賠率桌或美式輪盤的00；紅黑只用明度區分（紅色是中灰、黑色是深色），不是色相；號碼與紅色名單是我依記憶輸入，並用「36個非零口袋紅黑交錯」這個已知特性在測試中交叉驗證，但沒有對照外部資料來源；兩位數號碼在口袋很窄處接近相鄰口袋的邊界。預設0.9 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`roundrobintable`（循環賽賽程表）使目前目錄1090→1091種，含plain的gallery為1092項。整張tile是一張循環賽賽程表：n支隊伍（n由seed選8或10）用圓圈法排出n − 1輪，每輪n/2場比賽——第一支隊伍固定，其餘隊伍每輪沿圓圈移動一格——每一列依序寫出輪次號碼（深色標籤）與該輪每場比賽「甲-乙」，這樣每支隊伍每輪恰好出賽一次、每一對隊伍整個賽程恰好交手一次。隊伍編號由seed用Fisher–Yates洗牌決定；奇數列有淡淡的底色條。Metallic與mortar為0。

這是作者設計的示意：只有賽程，沒有隊名、場地或比分；n只用8與10（沒有輪空的奇數隊情形）；沒有區分主客場；點陣字是3×5字形，字高依n而定（n = 10時較小）。預設0.8 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`kaprekarsteps`（卡普雷卡爾步驟）使目前目錄1091→1092種，含plain的gallery為1093項。整張tile分成2欄×2個區塊，每個區塊是一條卡普雷卡爾常式（Kaprekar's routine）的演算鏈：從一個四位數（不是四位全相同，也不是6174）開始，把各位數字由大到小排成一個數、由小到大排成另一個數，兩者相減得到差，再對這個差（補零成四位）重複，直到得到6174為止；每一步寫成一行「大-小=差」（例如7641-1467=6174），差的四個字元有較深的底色，奇數行有淡淡的底色條。四個起點由seed決定。一條鏈最多7步（四位數的卡普雷卡爾常式最多7步）。Metallic與mortar為0。

這是作者設計的示意：只處理四位數、只寫出每步的算式（起點本身由第一行的位數隱含，沒有另外寫出）；沒有標註步數或說明6174是不動點；有些鏈較短，區塊下半留白。預設0.8 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`lookandsayrows`（外觀數列）使目前目錄1092→1093種，含plain的gallery為1094項。整張tile由上而下列出外觀數列（look-and-say sequence）的各項：每一項是把上一項「唸出來」——數連續相同數字的個數，再寫出那個數字，例如1 → 11（一個1）→ 21（兩個1）→ 1211 → 111221 → 312211 …；每一列的第一個數字有較深的底色，奇數列有淡淡的底色條。第一項由seed從1到6中選一個；各項的位數成長很快，所以只列到下一項會超過26位為止（最多11列）。Metallic與mortar為0。

這是作者設計的示意：只列出數列的項，沒有標註項次或說明外觀數列的規則；各項只用0到9的數字；位數限制26是版面寬度所決定的（不是數列的性質），因此不同起點的列數可能不同（實際預覽的起點6是9列）。預設0.8 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。建議1024以上；32僅粗預覽；不宣稱本段已完成三backend或跨瀏覽器驗證。

`happynumberchains`（快樂數鏈）使目前目錄1093→1094種，含plain的gallery為1095項。整張tile由上而下寫出12條「各位數字平方和」的演算鏈：從2到99中由seed選出的一個起點開始，每次取各位數字的平方和得到下一個數，用「>」連接，例如19>82>68>100>1；鏈到1為止（起點是快樂數），或到第一次出現4為止（其他所有數最後都會落進 4、16、37、58、89、145、42、20 的循環，所以在4停止）。到1結束的列，第一個數字下方有較深的底色。12條鏈的起點互不相同，字串寬度不超過34個字元的才會被採用（太長的起點會換下一個由seed產生的數）；奇數列有淡淡的底色條。Metallic與mortar為0。

這是作者設計的示意：沒有標註「快樂」或「不快樂」，也沒有標示循環的其他成員；起點限制在2到99且鏈的寬度不超過34個字元，所以像99這樣鏈很長的起點不會出現（實際預覽中的起點都是兩位數以內）；點陣字是3×5字形，「>」為簡化字形，字高較小，建議1024以上才清楚。預設0.8 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`recamanarcs`（雷卡曼數列弧線）使目前目錄1094→1095種，含plain的gallery為1096項。整張tile畫出雷卡曼數列（a(0)=0；a(n)在a(n−1)−n為正且尚未出現過時取a(n−1)−n，否則取a(n−1)+n）：每一步n是兩個數之間的半圓，奇數步畫在水平線上方、偶數步畫在下方，每個數在線上有一個小圓點。seed由40、50、60、70四種項數中挑一種，整體縮放使最大的數貼近tile右側。Metallic與mortar為0。

這是作者設計的示意：沒有數字標示，也沒有標出某個數是第幾項；左側許多小弧線會重疊成密集的環帶，所以512以下難以分辨；項數四個選項只是在已有的圖上多畫或少畫弧線（40、50、60項的最大值同為114，所以縮放相同）。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`thuemorsegrid`（Thue–Morse格）使目前目錄1095→1096種，含plain的gallery為1097項。整張tile是正方形格子，第k格的顏色由Thue–Morse數列決定：k加上一個由seed決定的位移後，二進位中1的個數為奇數就是深色格、偶數是淺色格；格與格之間有一條較矮的中灰色溝縫。seed決定每邊的格數（8、16、32三種）、位移（0到255）與編號方向（沿列或沿欄）。Metallic與mortar為0。

這是作者設計的示意：格子本身沒有數字；數列沒有被標出，也沒有圖例。圖案在整張tile內是一個網格，邊緣與對邊無縫相接（因為格數整除tile），但網格內的數列不會在邊界連續。預設1 m nominal tile、0.005 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`digitalroottable`（數根表）使目前目錄1096→1097種，含plain的gallery為1098項。整張tile是方格表，列i與欄j從1開始數，格內是數根（把各位數字反覆相加直到只剩一位數，結果為1到9）：seed從三種表中挑一種——i×j、i＋j、i²＋j²——並決定每邊格數（9、12、18）。每格依數根上色（1最深、9最淺，線性色階），格內以3×5點陣字寫出該數根，字色與底色反相；格間有一條較矮的中灰溝縫。Metallic與mortar為0。

這是作者設計的示意：沒有表頭（看不出i與j的值），也沒有圖例說明三種表的差別；字形是3×5點陣，在512以下的小格（18格）接近極限，建議1024以上。i²＋j²的表只出現部分數根（平方對9取餘只有0、1、4、7），因此色階有缺口。預設1 m nominal tile、0.005 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`henonattractor`（埃農吸引子）使目前目錄1097→1098種，含plain的gallery為1099項。整張tile是埃農映射 x′＝1−a·x²＋y、y′＝b·x 迭代60萬次後的點密度圖：點數落在256×256的格子中，取對數後雙線性內插成墨色濃淡，淺色紙面上的深藍弧線就是吸引子的細密層次。seed從四組混沌參數（a,b）＝（1.4,0.3）、（1.35,0.3）、（1.4,0.25）、（1.2,0.3）中挑一組，並決定是否左右、上下鏡射；視窗固定為x∈[−1.35,1.35]、y∈[−0.45,0.45]，因此y方向相對x約拉長1.5倍；視窗四周有3%的留白，所以整張tile可無縫重複。Metallic與mortar為0。

這是作者設計的示意：沒有座標軸、刻度或參數標示；y方向是拉長的，不是等比例；弧線很細，在512以下只有一兩個像素寬。四組參數是從我用腳本試過的組合中挑出會產生混沌（填滿多數格子）的幾組，沒有做數學證明。這次也試了a＝1.3、b＝0.3與a＝1.25、b＝0.3，但它們只占7個格子（是週期軌道），所以沒有被使用。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。每個取樣器建立時要迭代60萬次（512單次約111到160 ms，非效能認證）。不宣稱本段已完成三backend或跨瀏覽器驗證。

`golombrulers`（Golomb尺）使目前目錄1098→1099種，含plain的gallery為1100項。整張tile由上而下畫九把尺，標記數為3到11，所有尺用同一個比例，因此愈往下愈長（最長的一把有72個單位）：Golomb尺是任兩個標記之間的距離都不重複的尺，這裡畫的是我記得的最短（最佳）尺——標記位置分別為0 1 3、0 1 4 6、0 1 4 9 11、0 1 4 10 12 17、0 1 4 10 18 23 25、0 1 4 9 15 22 32 34、0 1 5 12 25 27 35 41 44、0 1 6 10 23 26 34 41 53 55、0 1 4 13 28 33 47 54 64 70 72。每把尺有一條淺色的尺身、每個單位一個小刻度、標記位置一條高的深色線；seed對每把尺隨機決定是否左右鏡射（鏡射後仍是Golomb尺）。Metallic與mortar為0。

這是作者設計的示意：沒有數字、也沒有標示距離；最長的尺是72單位，因此短尺（3、4個標記）只占左側一小段；這些尺的位置來自我記憶中的已發表最佳尺，沒有外部來源可對照，所以文件與測試只保證「沒有重複距離」，以及3到8個標記的長度用暴力搜尋確認是最短的，9到11個標記的長度（44、55、72）沒有被測試證明是最短。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`bitwisetable`（位元運算表）使目前目錄1099→1100種，含plain的gallery為1101項。整張tile是方格表，列i與欄j從0數到邊長減1，格內是 i AND j、i OR j 或 i XOR j 的值：seed從三種運算中挑一種，並決定每邊格數（8、16、32）。每格依數值線性上色（0最深、邊長減1最淺），並用小方塊以二進位寫出該值（最高位元在左、方塊代表1，位元數為3、4、5），方塊的顏色與底色反相；格間有一條較矮的中灰溝縫。三種表在大尺度上分別呈現不同的分形格局（AND偏暗、OR偏亮、XOR對稱且對角線為0）。Metallic與mortar為0。

這是作者設計的示意：沒有表頭、沒有運算符號；方塊很小——32格時每個位元在512貼圖上只有一兩個像素，建議1024以上；方塊只畫1，0的位元沒有標記。預設1 m nominal tile、0.005 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`peanocurve`（皮亞諾曲線）使目前目錄1100→1101種，含plain的gallery為1102項。整張tile畫出皮亞諾空間填充曲線穿過方格中心：階數由seed從2、3、4中挑一種（每邊9、27、81格，一共81、729、6561格），曲線從最深的色調開始、逐漸變成較淺的藍灰色，直到終點；曲線由3×3個前一階的曲線組成，三欄各三個、依蛇形順序排列，每一個還經過上下／左右鏡射使它從前一個結束的地方開始；seed另外決定八種鏡射與轉置中的一種（包含轉置）。曲線寬度約為半格，四周留4%的空白，所以整張tile可無縫重複。Metallic與mortar為0。

這是作者設計的示意：曲線沒有標示起點、終點或編號，只能靠漸層色調分辨方向；81格時一格只有約六個像素寬（以512計），因此建議1024以上。曲線的轉換規則由遞迴建構，並在測試中與另一種「以三進位數字互補」的公式比對。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`cliffordattractor`（克利福德吸引子）使目前目錄1101→1102種，含plain的gallery為1103項。整張tile是克利福德映射 x′＝sin(a·y)＋c·cos(a·x)、y′＝sin(b·x)＋d·cos(b·y) 迭代80萬次後的點密度圖：點數落在256×256的格子中，取對數後雙線性內插成墨色濃淡（深藍墨在淺色紙面上）。seed從五組參數（a,b,c,d）＝（−1.4,1.6,1,0.7）、（1.7,1.7,0.6,1.2）、（−1.7,1.3,−0.1,−1.2）、（−1.7,1.8,−1.9,−0.4）、（1.6,−0.6,−1.2,1.6）中挑一組並決定是否左右、上下鏡射；視窗等於映射的精確範圍（x在1＋|c|以內、y在1＋|d|以內），四周留3%空白，所以整張tile可無縫重複。Metallic與mortar為0。

這是作者設計的示意：沒有座標軸或參數標示；五組參數是我試過八組（其中三組不用）之後挑的：一組只占76格（週期軌道）、兩組占約八成格子（過滿，不容易分辨），在我用的48×48小格統計中；這些「混沌」判斷只是格數統計，沒有數學證明；每個取樣器建立時要迭代80萬次（512單次約135到149 ms，非效能認證）。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`voronoicells`（Voronoi細胞）使目前目錄1102→1103種，含plain的gallery為1104項。整張tile是Voronoi分割：每個方格內有一個被抖動的站點（網格邊長5、7、9，抖動量0.25、0.32、0.38個格寬，seed各挑一種；網格環繞整張tile，所以左右、上下無縫相接），每個點取最近站點的色調（每個站點有隨機的中等到淺的灰階），兩個最近站點距離差很小的地方畫較深的細邊界，每個站點中央有一個深色小圓點。Metallic與mortar為0。

這是作者設計的示意：沒有編號或標示，色調只是隨機灰階；邊界寬度用「最近與次近距離之差的一半」近似到邊界的距離，所以在邊界的尖角處（三個細胞交會處）邊界會變得略寬；每個像素檢查周圍5×5格的站點（試過3×3在較早版本的測試中也通過，但我沒有證明3×3在抖動0.38時一定足夠）。預設1 m nominal tile、0.005 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`euclidsquares`（歐幾里得方塊）使目前目錄1103→1104種，含plain的gallery為1105項。整張tile畫出歐幾里得輾轉相除法的方塊分割：長方形W×H先沿較長邊從左上角切出盡量多、邊長等於較短邊的正方形，再對剩下的長方形重複，直到沒有剩餘（最後的正方形邊長是gcd(W,H)）。seed從六個長方形（57×22、43×16、49×19、58×35、60×24、55×21）中挑一個，並決定是否轉置、左右鏡射、上下鏡射（共八種方向）；方塊依切出的順序由深（第一個）到淺（最後一個）上色，每個方塊有深色細邊界，外框也有，長方形置中、長邊占94%的tile。Metallic與mortar為0。

這是作者設計的示意：沒有標示數字、商數或gcd；60×24與55×21等會產生許多邊長相同的方塊，只靠色調的順序區分切出順序；長方形置中且四周留白，因此貼圖整體不是無縫連續花紋，只是重複排列。預設1 m nominal tile、0.005 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`youngtableaux`（楊表）使目前目錄1104→1105種，含plain的gallery為1106項。整張tile是2×2個面板，每個面板畫一個10格的標準楊表：形狀是10的分拆（最多5個部分、每部分最多5），格內填入1到10各一次，沿每一列和每一欄嚴格遞增。seed從所有符合條件的形狀中洗牌挑出四個不同的形狀，並用「依序把1到10放進一個隨機的可加格（上方與左方的格子都已填入）」來填數，所以每個面板的填法都是有效的標準楊表（但不是在所有標準楊表上均勻抽樣）；seed另外決定使用英式（第一列在上）或法式（第一列在下）畫法，以及整體是否轉置（轉置後仍是有效的標準楊表）。格子依數字由深（1）到淺（10）上色，數字用3×5點陣字（10用兩位數），格間有深色細線。Metallic與mortar為0。

這是作者設計的示意：沒有標示形狀的分拆或鉤長；一個圖無法分辨它是否被轉置（轉置後仍是標準楊表）；寬度最多5格、點陣字小，512下需要靠像素邊緣讀字，建議1024以上。預設1 m nominal tile、0.005 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`braiddiagram`（辮圖）使目前目錄1105→1106種，含plain的gallery為1107項。整張tile畫出數學上的辮圖：4、5或6條股線（由seed決定）從上到下，每一層（共3×股數層）有兩條相鄰的股線交叉、一條在上一條在下（被壓在下的股線被上面股線的深色外框擋住），同一對位置不會連續交叉兩次，左邊在上或右邊在上隨機；每條股線依起點位置固定一個灰階（最左最深、最右最淺），所以最下方各位置的灰階順序就是這個辮子所做出的置換。交叉處用S形曲線，股線寬度沿垂直於曲線的方向量測，斜的部分不會變細。Metallic與mortar為0。

這是作者設計的示意：沒有標示辮子字（σ₁、σ₂…）或置換；每層只有一個交叉，所以不會有同一層同時交叉兩處；灰階僅用亮度區分股線，與色相無關（材質只有一個由暗到亮的色階）；股線的外框會讓下方的股線在交叉處看起來被切斷，但這是畫法，不是三維繩結。預設1 m nominal tile、0.005 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`countingrods`（算籌）使目前目錄1106→1107種，含plain的gallery為1108項。整張tile是八列，每列左邊用3×5點陣字寫出一個十進位數（2到5位數，由seed決定），右邊用中國算籌記數法再寫一次：每位數一個方形位置，個位在最右；1到5是對應根數的籌，6到9是一條橫槓（代表五）下面加1到4根籌，0是空位；位置交替擺放——個位、百位、萬位用縱式（籌直立、橫槓在上），十位、千位轉九十度用橫式（籌橫放、橫槓在左）。奇數列有淡色底帶。Metallic與mortar為0。

這是作者設計的示意：算籌的零是空位，沒有圓圈符號；沒有負數（紅黑籌）、小數或乘除；只畫到五位數；右邊的算籌需要比對左邊的數字才有意義；3×5點陣字很小，建議1024以上。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`quadtreecells`（四叉樹格）使目前目錄1107→1108種，含plain的gallery為1109項。整張tile是自適應四叉樹：單位正方形先一律切成四個，再依規則一層一層繼續切——當形狀函數在一個方格的四個角與中心不是同一個正負號（形狀的邊緣穿過這個方格）時就再切四份，直到最大深度6（64×64的最細格）；至少一律切到深度2。形狀由seed從12個預設中挑一個：圓盤三個、圓環兩個、橢圓兩個、波浪線三個、斜線兩個。形狀內的格子較深色，越深的格子再略深一點，格子之間有深色細邊界，邊界半寬為`min(0.0025, 0.07×格邊長)`，所以小格的邊界較細。Metallic與mortar為0。

這是作者設計的示意：沒有標示深度或形狀名稱；切割規則只檢查四個角與中心，如果形狀的細部比格子小，可能漏掉（這12個形狀在目前的最大深度下沒有這個問題；另外我發現在這12個形狀上，拿掉「中心」這個取樣點也得到完全相同的結果，所以中心取樣在這些形狀上是多餘的，我保留它是為了萬一增加更細的形狀）；形狀只畫在一個tile內，不會跨tile邊界延伸，所以貼圖不是連續花紋；斜線的形狀會切到大部分格子，使整張都是細格。預設1 m nominal tile、0.005 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`lsystemplant`（L-system植物）使目前目錄1108→1109種，含plain的gallery為1110項。整張tile畫出一棵由L-system（Lindenmayer系統）用海龜繪圖法畫出的分枝植物：F向前走一單位並畫線，+與−依角度轉向，［與］儲存與還原海龜的位置與方向。seed從四組文法中挑一組（公理與規則：X→F+[[X]-X]-F[-FX]+X、F→FF，25°；F→FF-[-F+F+F]+[+F-F-F]，22.5°；X→F[+X]F[-X]+X、F→FF，20°；X→F[+X][-X]FX、F→FF，25.7°）、其中兩個迭代次數之一（4或5、3或4、5或6、5或6），並決定是否左右鏡射；植物等比例縮放並置中，最長邊占tile的90%，線條依分枝深度由主幹的深色漸變成枝梢較淺的灰綠色。Metallic與mortar為0。

這是作者設計的示意：植物是示意的線條畫，沒有葉子、花或粗細變化（所有線段寬度相同）；L-system文法是我記得的常見寫法（沒有外部來源可對照）；對稱的文法（第四組）鏡射後與原圖相同，所以seed的鏡射旗標對它沒有效果；植物只畫在一個tile內，不會跨tile邊界延伸。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`htreefractal`（H樹）使目前目錄1109→1110種，含plain的gallery為1111項。整張tile畫出H樹：一條線段（H的橫槓），在它的兩端各畫一條垂直於它、長度為它的1/√2的線段，這兩條再各自在兩端畫更短的垂直線段，如此一層層深入到seed挑的深度（6、7、8或9）。第0層的線段置中、半長0.25；seed另外決定整棵樹是否轉九十度。線段越深越細（線寬由0.0034每層乘0.88、下限0.00085），色調由最深的主幹（第0層）漸變成較淺的灰藍（最深的一層）。Metallic與mortar為0。

這是作者設計的示意：沒有標示層次；這棵樹不是空間填滿的（1/√2的比例在極限下才趨近填滿整個矩形），樹的外框沿一個方向約占tile的七成、沿另一個方向約占全部（哪個方向依是否轉九十度；我只看過轉了的那種預覽，另一種是由幾何推算），所以一個方向有空白而另一個方向接近相接；樹只畫在一個tile內（沒有周期性延伸）；渲染時每個像素會走訪樹的一部分節點（用範圍估計剪掉太遠的子樹），512單次取樣在這台機器上約134到184 ms（單次量測，不是效能認證），比大多數其他材質慢。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`wangtiles`（王氏磁磚）使目前目錄1110→1111種，含plain的gallery為1112項。整張tile是一個方格陣列，每片方磚的四邊（上、右、下、左）各有一種顏色，並以兩條對角線把磚分成四個三角形，各塗成那一邊的顏色；相鄰的兩片磚相接的邊顏色一定相同（包括跨過整張tile邊界的環繞相接）。邊的顏色是由低到高的灰階（3或4種），seed決定每邊的磚數（6、8、10）、顏色數與每條邊的顏色；磚的邊與對角線有深色細線。Metallic與mortar為0。

這是作者設計的示意：這是「依邊色一致的方式隨機鋪滿」的圖案（先隨機決定每條邊的顏色，再讓兩側的磚取同一個顏色），不是從一組固定的王氏磚集合挑出磚來鋪，也沒有證明或標示這個磚集合的性質（例如是否能非週期鋪滿）；顏色只用亮度區分，不是色相。預設1 m nominal tile、0.005 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`marchingsquares`（行進方塊等值線）使目前目錄1111→1112種，含plain的gallery為1113項。一個環繞tile邊界的metaball場（每顆球貢獻 半徑²／（距離²＋epsilon），距離環繞計算）在方格的角點取值，高於門檻（1）的角點畫深色小點、低於門檻的畫較淡的點；等值線則以經典marching squares（16種情形，兩個鞍點格用四角平均值決定）畫成穿過每個格子的直線段，端點由線性內插落在格邊上。seed決定十組球（每組5–7顆）之一與格數（16、24、32）。Metallic與mortar為0。

這是作者設計的示意：球的位置與半徑是我用固定偏移的亂數產生器寫入preset的常數，不是外部資料；前八組在這三種格數下都沒有鞍點格，後兩組是我另外用隨機搜尋挑出「兩種鞍點（中心高於／低於門檻）都出現」的組合，目的是讓鞍點分支有真實資料可測。已知限制：線只畫在自己線段所在的格子內，貼著格邊平行走的線段在鄰格那一側的線寬會被格邊切掉（線端點與相鄰格的線段在格邊上相接，一般看不出來，我沒有量化這個現象）。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`tsquarefractal`（T方塊碎形）使目前目錄1112→1113種，含plain的gallery為1114項。tile被切成2或3乘2或3個格子（seed決定），每個格子中央有一個邊長為格寬一半的方塊，方塊的四個角各有一個邊長減半的方塊，再在那些方塊的角上放邊長再減半的方塊，直到seed決定的層數（4、5、6層）；深的方塊畫在淺的上面，色調由最低到最高依層次遞進（深層較亮或較暗由seed決定），每個方塊有細深色輪廓、紙面為淺色。Metallic與mortar為0。

這是作者設計的示意：輪廓寬度上限是方塊邊長的6%，因為第一版（輪廓固定寬、層數5–7）因T方塊碎形會幾乎鋪滿格子，小方塊的輪廓把整張圖畫成一片深色，所以改成上限縮小與層數4–6。不宣稱這是特定文獻中的T-square圖樣，沒有量測碎形維度。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`superformulacells`（超級公式格）使目前目錄1113→1114種，含plain的gallery為1115項。tile切成3乘3或4乘4個格子（seed決定），每個格子中央有一條封閉曲線 r(φ) = (|cos(mφ/4)|^n2 + |sin(mφ/4)|^n3)^(−1/n1)（a = b = 1的Gielis超級公式），縮放成最大半徑為0.9×半個格寬×該格的比例，填上一個色調並加細深色輪廓。每個格子各自由seed從十組參數列 [m, n1, n2, n3]、三種比例（0.7、0.85、1）與六種色調中各挑一個。Metallic與mortar為0。

這是作者設計的示意：十組參數是我挑的常數，沒有取自任何文獻的圖表；奇數m只配n2 = n3，因為n2 ≠ n3時曲線在±π處不閉合。形狀以每個格子中心為原點、用角度（極座標）判斷內外，所以非星形的曲線不在範圍內；最大半徑由4096個角度取樣估計。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`paleygraphmatrix`（Paley圖鄰接矩陣）使目前目錄1114→1115種，含plain的gallery為1116項。tile是p×p個格子的矩陣：p是模4餘1的質數（13、17、29、37、41、53之一，由seed決定），頂點為0至p−1，當i−j除以p的餘數是非零平方數時i、j相連；第i欄第j列的格子顯示i−j（模p）是零（對角線，中間色）、平方數（有邊，深色）還是非平方數（沒有邊，淺色），格子之間有細深色線。Metallic與mortar為0。

這是作者設計的示意：只畫鄰接矩陣，不畫圖本身，也沒有標示或證明Paley圖的性質（自補、強正則等）；p限定在列出的六個質數，每個都是模4餘1所以矩陣對稱。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`candlestickcharts`（K線圖）使目前目錄1115→1116種，含plain的gallery為1117項。三個上下堆疊的圖表面板，每個面板有16、24或32根蠟燭（seed決定根數）。每根蠟燭是一個從開盤到收盤的實體，上漲時為淺色、下跌時為深色，上下各有一條細影線到最高與最低價。每根的開盤價等於前一根的收盤價，整串首尾相接（環繞），所以每個面板是封閉的走勢：一半的步伐向上、一半向下且幅度兩兩相同（0.04–0.09），順序由seed洗牌，再把整條走勢拉伸到剛好佔滿面板的0.12至0.88高度；影線長度0.012–0.05。Metallic與mortar為0。

這是作者設計的示意：價格是隨機走勢，不是任何市場資料，也不代表交易訊號；所謂「封閉」只是為了讓tile無縫。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`tetrominoes`（四格骨牌鋪面）使目前目錄1116→1117種，含plain的gallery為1118項。tile是8×8或12×12個格子（seed決定），由七種四格骨牌（I、O、T、S、Z、J、L，只轉不翻面，各四個方向）剛好鋪滿且環繞相接；seed洗牌後以深度優先搜尋找出一種鋪法（最多50次嘗試、每次至多20000步；若都失敗改用水平I形排滿，我量測的300個seed沒有出現過這種情形），每片依種類填上七種灰階之一，不同片之間的格邊有深色線。Metallic與mortar為0。

這是作者設計的示意：七種色調只用亮度區分；不宣稱鋪法在統計上均勻（搜尋順序有偏）或每個seed都含全部七種骨牌。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`errordiffusion`（誤差擴散抖色）使目前目錄1117→1118種，含plain的gallery為1119項。把一幅平滑且週期的灰階圖（三個正弦項，頻率為整數所以可無縫重複）取成n×n個格子（n為48、64或96，由seed決定），由上而下逐列掃描，每格四捨五入成0或1（亮／暗兩種色調），把進位誤差用六種核（Floyd–Steinberg、Atkinson、Jarvis–Judice–Ninke、Stucki、Burkes、Sierra）之一分給之後掃描到的格子；seed決定格數、核與圖。鄰格計算環繞，但誤差只傳給掃描順序在後面的格子。格邊有一小段柔化的混色。Metallic與mortar為0。

這是作者設計的示意：六種核的權重是我憑記憶寫的，沒有查閱任何文獻確認，所以不宣稱與標準演算法逐字相同，只保證「同一份權重在取樣器與測試端的獨立實作一致」；誤差不傳回前面的格子，所以並非嚴格的環面誤差擴散。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`worleycells`（Worley細胞噪聲）使目前目錄1118→1119種，含plain的gallery為1120項。n×n個格子（n為6、8或10）每格一個特徵點，落在格子中央附近jitter×格寬（0.5、0.7或0.9）的範圍內，格子環繞tile邊界；F1與F2是到最近與第二近特徵點的距離（在周圍5×5個格子中找，距離環繞），可用三種距離（歐氏、曼哈頓、切比雪夫）之一。顏色是F1、F2、F2−F1、F1／F2四種函數之一的灰階（前三者以1.1個格寬為單位），高度是每個特徵點周圍的圓丘（0.8個格寬內由1降到0，點上為1，所以可從高度讀回特徵點）。格數、jitter、距離與函數都由seed決定。Metallic與mortar為0。

這是作者設計的示意：不是Perlin／simplex噪聲，也不宣稱與任何標準Worley實作逐位相同；搜尋範圍從3×3擴大到5×5是因為第一版測試發現第二近的點可能在兩格以外；jitter上限0.9是為了避免兩個特徵點靠得太近、測試端無法從高度分辨。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`equalizerbars`（等化器LED柱）使目前目錄1119→1120種，含plain的gallery為1121項。tile是16、24或32個頻帶並排，每個頻帶是一柱16、20或24個LED段，從底部往上點亮到該頻帶的高度，再在上方隔1至3段處亮一段峰值段；段依高度分三個區間上色（下方60%、其後25%、其餘），未亮的段是暗色，段與段之間有暗縫。高度是兩個正弦（整數頻率，所以左右環繞相接）加隨機散布。頻帶數、段數與曲線由seed決定。Metallic與mortar為0。

這是作者設計的示意：色調只用亮度區分，所謂「綠／黃／紅」分區是三個灰階；高度曲線是示意，不是任何音訊資料。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`intelhexrecords`（Intel HEX記錄）使目前目錄1120→1121種，含plain的gallery為1122項。27行資料記錄「:10AAAA00」＋16個資料位元組＋檢查碼，每行用3×5像素的字元寫成，最後一行是結束記錄「:00000001FF」。第一筆的位址AAAA由seed決定（16的倍數），之後每行加16；資料位元組是隨機的；檢查碼是記錄中所有位元組總和的二補數，所以整筆記錄（含檢查碼）的位元組相加模256為0。六個欄位（起始冒號、長度、位址、類型、資料、檢查碼）各用一種墨色。字元的像素格間有一小段柔化。Metallic與mortar為0。

這是作者設計的示意：只實作資料記錄（類型00）與結束記錄（類型01），沒有擴充位址等其他類型；3×5字元是我自己畫的位圖。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`flagpatterns`（旗幟圖案）使目前目錄1121→1122種，含plain的gallery為1123項。3×3或4×4的格子，每格一面3:2的旗，圖案是簡單幾何：橫三色、直三色、橫二色、四分、北歐十字（內有較窄的十字）、斜十字、中央圓盤、七條橫紋加左上角方塊；底布是中間色調，旗周圍有一圈細深色外框。seed決定格數，以及每格的圖案與三個互不相同的色調（從六個色調中選）。Metallic與mortar為0。

這是作者設計的幾何圖案，不代表任何真實的旗幟；只有色調（亮度）而沒有色相。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`gaugedials`（儀表圓盤）使目前目錄1122→1123種，含plain的gallery為1124項。2×2或3×3的格子，每格一個圓形類比儀表：外圈是bezel，淺色錶面，沿刻度弧有三段色調區（兩個交界由seed決定），11條長刻度之間各有4條短刻度，一根帶短尾的指針與中心圓。刻度從正上方起順時針−135°（0）到+135°（1），底部那四分之一圈沒有刻度與色調區。seed決定格數，以及每個儀表的指針位置與兩個色調區交界；底布是中間色調並有細微顆粒。Metallic與mortar為0。

這是作者設計的示意，不是任何真實儀表的複製；只有色調（亮度）而沒有色相或數字。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`qrcodemodules`（QR碼模組）使目前目錄1123→1124種，含plain的gallery為1125項。一個邊長21、25或29個模組（版本1至3）的方形符號，四周各有4個模組寬的淺色靜區。三個定位圖案（7×7的外環與3×3的中心）與其淺色分隔線、沿第6列與第6行的時序圖案、暗模組，以及版本2與3的5×5對齊圖案，都放在QR標準規定的位置；其餘模組（包含格式資訊區）是隨機的。seed決定版本與隨機模組。模組邊緣有很小的柔化，只在鄰格色調不同處混合。Metallic與mortar為0。

這看起來像QR碼，但不是可以讀取的QR碼：資料、錯誤更正、遮罩與格式資訊都沒有實作，我也沒有用任何QR讀取器驗證。標準規定的位置是我憑記憶寫的，並以測試端另外寫的位圖表檢查。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`mahjongdots`（麻將筒子牌）使目前目錄1124→1125種，含plain的gallery為1126項。3×3或4×4格、3:4的圓角牌放在布面上，每張牌有1到9個圓點，排列依常見的筒子牌（一個大點；兩點直排；三點斜排；四點在四角；五點加中央一點；六點兩行三列；七點為上方斜排三點加下方兩行兩列；八點兩行四列；九點三行三列）。每個圓點由外環、淺色間隙與中心組成；牌有一圈較暗的邊緣、圓角，底布是中間色調並有細微顆粒。seed決定格數，以及每張牌的點數與外環、中心的色調。Metallic與mortar為0。

這是作者設計的示意：排列是我憑記憶寫的，沒有對照真實麻將牌，只有色調（亮度）而沒有色相。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`smithchart`（史密斯圖）使目前目錄1125→1126種，含plain的gallery為1127項。反射係數的單位圓盤上，有等電阻圓（0、0.2、0.5、1、2、5；圓心在軸上的r/(1+r)、半徑1/(1+r)）、等電抗弧（正負0.2、0.5、1、2、5；圓心(1, 1/x)、半徑1/|x|，只畫在單位圓內）與水平軸，都是細線；另有一個較深的等駐波比圓與圓上一點，點與圓心之間有一條線。seed決定圖轉幾個四分之一圈、深色圓的半徑（0.3、0.5或0.7）與點在圓上的位置。圖外是有細微顆粒的布面。Metallic與mortar為0。

這是作者設計的示意：沒有數值標記與文字，只有色調（亮度），也不是工程用的圖。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`compassrose`（羅盤玫瑰）使目前目錄1126→1127種，含plain的gallery為1128項。中央是16個尖角的星（4個長角、4個中等、8個短角，每個是細長三角形，順時針的一半是深色，另一半是中間色調），中心有一個小圓環；外圍是刻度盤：一圈外環，每5°一條刻度，每45°的較長、每90°的最長，北在正上方。seed把星（不含刻度盤）轉5°的倍數（小於90°）。底是淺色紙面並有細微顆粒。Metallic與mortar為0。

這是作者設計的示意：沒有文字與方位字母，只有色調（亮度），也不是航海用的圖。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`windbarbs`（風標）使目前目錄1127→1128種，含plain的gallery為1129項。3×3或4×4格的氣象圖風標：每格一個測站圓環與一根指向風向的桿，桿的順時針一側從桿端往內，每50節一個三角旗、每10節一條長羽、5節一條短羽；單獨一條5節短羽放在離桿端一格處；靜風是兩層圓環、沒有桿。這裡的風速是0到65之間5的倍數，風向是10°的倍數，由seed對每一格決定。淺色紙面有細微顆粒。Metallic與mortar為0。

這是作者設計的示意：只畫風標，沒有氣壓、溫度等其他測站資料，也不是氣象作業用的圖。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`rankchevrons`（階級人字紋）使目前目錄1128→1129種，含plain的gallery為1130項。3×3或4×4格的圓形布章放在布面上，每個布章縫著1到4條人字紋（V形，尖端朝上）、人字紋下0到2條弧形橫條（rocker），以及可有可無的上方圓點，外有一圈細環。seed決定格數，以及每個布章的人字紋與弧條數和有無圓點。布章是深橄欖色，圖案是淺色，布面是中間色調並有細微顆粒。Metallic與mortar為0。

這些是單純的幾何圖形，不代表任何真實的軍階或標誌，只有色調（亮度）而沒有色相。預設1 m nominal tile、0.005 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`segmenttree`（線段樹）使目前目錄1129→1130種，含plain的gallery為1131項。由方格疊成的金字塔：頂端是根，底端是葉，每一層一列（第`level`層有2^level個方格），根之下有3、4或5層。葉的值由seed隨機決定（色調就是值），每個上層方格的值是兩個子方格的平均，所以它的色調是兩個子方格色調的平均。seed另外選一段葉的範圍，線段樹用來剛好蓋住該範圍的方格（數量最少、彼此不包含）畫上深色外框。方格之間是有細微顆粒的縫。Metallic與mortar為0。

這是作者設計的示意：沒有數字或文字，只有色調（亮度）；用「平均」而不是常見的「總和」，是為了讓色調落在0到1之間。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`vicsekfractal`（維切克碎形）使目前目錄1130→1131種，含plain的gallery為1132項。把正方形切成每邊3^depth格（27或81）。一格屬於碎形，當它的depth組三進位數字對（欄位的數字與列的數字，從最粗的一層起）每一組都在圖樣內：「加號」是欄或列的數字為中間（1），「叉號」是兩個數字都在中間或都不在中間。seed決定層數與圖樣。碎形內的格以「數字對中有幾組是（中間、中間）」上色，愈多愈深；格與格之間留一小段縫，紙面有細微顆粒。Metallic與mortar為0。

這是作者設計的示意，只有色調（亮度）而沒有色相。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`jacobisymbols`（雅可比符號表）使目前目錄1131→1132種，含plain的gallery為1133項。每邊N格（24或32）的表格：第r列、第c欄的格顯示雅可比符號 (a / b)，其中 a = 列起點＋r＋1、b = 2×(欄起點＋c)＋1（奇數）：+1是淺色、−1是深色、a與b有公因數時為0（中間色調）。seed決定N以及兩個起點（N的倍數、小於4N），所以視窗可以落在4N×4N的表格範圍內任何一處。格之間有一小段縫，縫有細微顆粒。Metallic與mortar為0。

這是作者設計的示意：只有色調（亮度），沒有數字。取樣器用二次互反律算符號，測試端另用質因數分解加歐拉判別法，兩者算法不同。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`fenwicktree`（樹狀數組）使目前目錄1132→1133種，含plain的gallery為1134項。橫向N（16或32）個位置、每個層級一列：索引i（1到N）有一條長條，涵蓋以i結尾的lowbit(i)個位置，畫在它的lowbit對應的那一列（單個位置在最底層，整個寬度在最上層），例如索引12（lowbit為4）涵蓋位置9到12。同一列的長條依層級上色。seed選一個查詢索引q與一個更新索引u：前綴查詢的路徑（q，再來q減lowbit(q)，直到0）上的長條畫深色外框，更新路徑（u，再來u加lowbit(u)，直到超過N）上的長條在其內側畫淺色外框。Metallic與mortar為0。

這是作者設計的示意：沒有數字，只有色調（亮度）。預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`semaphorefigures`（手旗信號人像）使目前目錄1133→1134種，含plain的gallery為1135項。3×3或4×4格的火柴人（頭與軀幹），每人雙手各持一面旗，手臂指向8個方向之一（從正上方順時針每45度；左右手方向不同）；旗是手臂末端外的正方形，沿對角線分成兩個色調。seed決定格數與每個人的兩個方向。不編碼任何字母。手臂各自從左右肩出發，內指的手臂會穿過軀幹與頭，不求解剖正確。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`hofstadterq`（霍夫施塔特Q數列散點圖）使目前目錄1134→1135種，含plain的gallery為1136項。Q(1)=Q(2)=1、Q(n)=Q(n−Q(n−1))+Q(n−Q(n−2))，畫連續128項的散點圖，每欄一個點，高度縮放到視窗內最小項與最大項剛好落在上下邊界；seed決定視窗從第幾項開始（1、129、257、513、1025、2049）。另畫一條表示Q=n/2的細斜線與把圖分成8格的9條細橫線。這是作者設計的示意，色調（亮度）從左到右依欄位漸變。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`countertimings`（計數器時序圖）使目前目錄1135→1136種，含plain的gallery為1137項。上方一列是時脈（16個週期，每週期前半高、後半低），下面四列是4位元計數器的輸出Q0到Q3，在每個時脈上升緣一起改變；seed決定計數方式（二進位遞增、二進位遞減、格雷碼、約翰遜扭環、單熱環）與第一個週期的狀態，另有淡淡的垂直線標示時脈週期。五種計數的週期都能整除16，圖塊左右無縫。這是作者設計的示意：理想化的方波，沒有傳播延遲；色調（亮度）隨列變化。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`qamconstellation`（QAM星座圖）使目前目錄1136→1137種，含plain的gallery為1138項。2×2、4×4或8×8個符號（QPSK、16-QAM、64-QAM）的格子，每格有該符號的星座點，點下面兩列方塊是同相軸與正交軸的位元（實心方塊是1、只有外框是0，高位元在左）。seed決定大小，以及每軸的位元是格雷碼（相鄰符號只差一個位元）還是一般二進位（相鄰符號有時差多個位元）；2×2時兩種編碼的字相同，無法區分。同相軸的值往右增加，正交軸的值往上增加；四個象限的紙色略有不同，圖中間有兩條軸線。這是作者設計的示意，色調（亮度）表示不同元素。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`chorddiagrams`（吉他和弦圖）使目前目錄1137→1138種，含plain的gallery為1139項。2×2或3×3格的和弦框，每個框有6條弦（左邊是低音E弦）、較粗的琴枕與5個琴格；實心圓點是手指按在某弦某格，弦上方的圓圈是空弦、叉號是悶音。十個和弦（C、G、D、A、E、F大三和弦，A、E、D、B小三和弦）的按法是依一般第一把位按法憑記憶寫成每弦的格數，測試以標準調弦下各弦的音名驗證；seed決定格數與顯示哪些和弦（全部不同）。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱這些是唯一或最標準的按法，也不宣稱本段已完成三backend或跨瀏覽器驗證。

`waterfallchart`（瀑布圖）使目前目錄1138→1139種，含plain的gallery為1140項。從零開始的起始長條，接著每一步是從目前累計值往上或往下浮動的一條長條，最後是從零到終點累計值的總計長條，累計值的位置有細連接線。縱軸從0到100，每步是3到18的整數、累計值保持在10到90之間；每10格一條淡格線，0處是較深的基準線。seed決定步數（6、10或14）與所有數值。這是作者設計的示意；色調（亮度）區分起訖長條、上升與下降的步驟。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`intervalpartition`（區間分組）使目前目錄1139→1140種，含plain的gallery為1141項。橫向64個時間單位，上方是最多28個區間，依貪婪規則（按起點排序、各放入第一個空著的那條，共6條車道）排成車道，同一車道內不重疊；下方是深度條，每個時間單位一欄，高度等於該時刻同時存在的區間數。貪婪分組用到的車道數等於最深的重疊，所以用到的車道數等於最高的那一欄；需要第七條車道的區間會被丟掉（圖上看不到）。seed決定各區間的起點與長度；每條車道有各自的色調，並有淡淡的每8單位導線與車道分隔線。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`ecdfplot`（經驗累積分布圖）使目前目錄1140→1141種，含plain的gallery為1142項。n（8、12、16或20）個資料點的階梯曲線，每個資料點處上升1/n：新水準處有實心點（曲線右連續）、舊水準處有空心圓；圖下方的刻度排（rug）標出資料點，並有四分位數處的淡導線。資料點是寬度的1/256的整數倍，大致均勻分布在寬度上並各有位移，相鄰至少隔4單位。seed決定n與位移。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`spanningtree`（最小生成樹）使目前目錄1141→1142種，含plain的gallery為1143項。24×24格點上的8、12或16個點，用Kruskal演算法接受的邊連起來（最短的邊先、會形成環的略過），每條邊依被接受的順序上色，第一條最深、最後一條最淺。seed決定點數與位置。這是作者設計的示意，色調（亮度）表示邊的接受順序。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`kdtreesplits`（k-d樹分割）使目前目錄1142→1143種，含plain的gallery為1144項。15或31個點，每一列與每一行恰有一個點，以交替的垂直與水平線在中位數處遞迴分割；每個區域的中位點決定通過它的分割線，線延伸到該區域的邊界。越深的分割線色調越淺、也越細。seed決定點數、點的位置（欄的洗牌）與第一刀是垂直還是水平。這是作者設計的示意；色調（亮度）表示分割的深度。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`bsttreeorder`（二元搜尋樹）使目前目錄1143→1144種，含plain的gallery為1145項。二元搜尋樹畫成每個節點的橫向位置是它在中序中的順序、縱向位置是它的深度，所以每個節點的左子節點一定在它左邊、右子節點在它右邊。鍵是11、15或19個整數，依seed洗牌的順序逐一插入，插入順序以節點的色調表示，第一個插入的最深、最後一個最淺；若洗牌後的樹深度超過7層（根為第0層，最深第6層）就重洗。邊把每個節點連到它的父節點。這是作者設計的示意。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`karnaughmap`（卡諾圖）使目前目錄1144→1145種，含plain的gallery為1146項。3或4個變數的布林函數卡諾圖：2×4或4×4的格子，函數為1的格子填滿，格子上方與左側用格雷碼標示每行每列（實心方塊是1、只有外框是0），因此相鄰的格子只差一個變數。圖的右邊是同一個函數的真值表：每個最小項一個方塊，依編號排列，第一個變數是最高位。seed決定變數數與函數（至少3個1與3個0）。這是作者設計的示意；圖中同時有兩種表示，可以互相核對。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`nearesttour`（最近鄰路徑）使目前目錄1145→1146種，含plain的gallery為1147項。在24×24格點上有8、10或12個點（任三點不共線，也沒有點離不屬於它的路段太近），從其中一個點出發（外面圍一圈環），每一步都走到還沒走過的最近的點；每段路徑依走的先後上色（第一段最深、最後一段最淺），路徑不封閉。seed決定點數、位置與起點。這是作者設計的示意；每段路徑都可以回頭驗證是不是當時最近的點。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`editdistance`（編輯距離表）使目前目錄1146→1147種，含plain的gallery為1148項。兩個4到7個符號的短字串（字母表有三個符號，用一到三個點表示），第一個沿上緣、第二個沿左緣，下方是Levenshtein編輯距離表：每格是第一個字串前i個符號與第二個字串前j個符號的距離，0最淺、7最深；從最後一格回到第一格的最便宜路徑（可走對角線就走對角線，否則往上，否則往左）上的格子有外框。seed決定兩個字串的長度與內容。這是作者設計的示意；表中的數字可以用另一種算法（遞迴）驗證。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`hashchains`（鏈結雜湊表）使目前目錄1147→1148種，含plain的gallery為1149項。拉鍊法的雜湊表：6、7或8個桶（每桶一列），依序插入10、14或18個7位元的鍵，每個鍵放進「鍵除以桶數的餘數」那個桶；每個桶從左邊的方塊向右接一串盒子，每個盒子是一個鍵，裡面用二進位（最高位在左，深色小方塊是1），外框的灰度表示插入的先後（最早最深、最晚最淺），所以每一串都是依插入順序排列；沒有一串超過5個。seed決定桶數、鍵數與鍵。這是作者設計的示意；每個鍵在哪一串可以用餘數重新算出。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`huffmancodes`（霍夫曼編碼）使目前目錄1148→1149種，含plain的gallery為1150項。5、6或7個符號的霍夫曼編碼，每個符號一列、頻率高的在上：每列左邊是長度等於頻率（1到30）的橫條，右邊是它的編碼，深色方塊是1、空的方框是0，第一位在左。編碼的做法是反覆合併最輕的兩棵樹（重量相同時取編號小的），先取到的一棵得0、後取到的得1。seed決定符號數與頻率。這是作者設計的示意；編碼是否為前綴碼、是否完整、總成本是否最小都可以回頭驗證。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`bodeplots`（波德圖）使目前目錄1149→1150種，含plain的gallery為1151項。濾波器的波德圖：上方是增益（分貝，−60到+20），下方是相位（度，−180到+180），橫軸是頻率1到1000的對數刻度（三個十倍頻，每個十倍頻一條格線）。濾波器是一階低通，或二階的低通、高通、帶通，轉折頻率為10的1、1.25、1.5、1.75或2次方，二階的再有品質因數0.5、0.707、1、2或4。seed決定這三項。這是作者設計的示意；曲線可以用複數運算（另一種算法）驗證。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`sankeyflows`（桑基圖）使目前目錄1150→1151種，含plain的gallery為1152項。三欄節點的桑基圖：左邊3個、中間3或4個、右邊3個，以S形的色帶相連。每個左節點對每個中間節點有1到3單位的色帶；每個中間節點把收到的總量分成三份（每份至少1單位）送到右邊三個節點，所以每個節點的高度都等於流過它的總量（每單位一個固定高度）。色帶依目標的順序離開節點、依來源的順序抵達節點，每條色帶有自己的灰度，欄與欄之間以平滑的S形過渡。seed決定中間節點數與所有流量。這是作者設計的示意；流量守恆與節點高度都可以回頭驗證。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`histogrambins`（直方圖）使目前目錄1151→1152種，含plain的gallery為1153項。直方圖加上原始資料：0到1之間的20、28或36個值，每個值是下方一排中的一條細刻線（彼此至少相隔兩格）；上方在基準線上有8、10或12個區間的長條，高度是區間內的值的個數（每個固定一個高度）；基準線下方在每個區間邊界有一小段標記，所以空的區間也看得出來。值偏向中間（兩次抽樣的平均）。seed決定值與區間的個數與值本身。這是作者設計的示意；長條的高度可以由下方的刻線重新數出。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`zordercurve`（Z階曲線）使目前目錄1152→1153種，含plain的gallery為1154項。4×4或8×8格子上的Z階（莫頓）曲線：依格子編號的順序走訪，編號的偶數位元是欄、奇數位元是列，每個格子到下一個格子以一條線段連接，灰度從最深（第一段）到最淺（最後一段），每個格子中心有一個圓點。seed決定大小與曲線八種轉向與翻轉之一（欄列互換、左右翻轉、上下翻轉的組合）。這是作者設計的示意；曲線可以用遞迴切成四個象限（另一種算法）重建並比對整張圖。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`lorenzcurve`（羅倫茲曲線）使目前目錄1153→1154種，含plain的gallery為1155項。下方是8、10或12筆收入（1到20）的長條，依由小到大的順序；上方是正方形的圖：橫軸是人口的累積比例，縱軸是收入的累積比例，每一步一個圓點、之間以折線連接，另有一條均等線（對角線），兩者之間的淺色區域面積是這些收入的吉尼係數的一半。seed決定筆數與收入（偏向小的）。這是作者設計的示意；曲線可以用長條重新算出，填色面積可以用吉尼係數驗證。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`ganttschedule`（甘特圖）使目前目錄1154→1155種，含plain的gallery為1156項。6、7或8個任務的甘特圖，每個任務一列，時間軸共16個單位。每個任務持續1到4個單位，依賴上方的零個、一個或兩個任務，並在它們全部完成後立刻開始（沒有依賴就從0開始）。依賴以連接線表示：從較早任務的結束處沿它的列走到較晚任務的開始時間，再往下連到較晚任務的那一列，連接線離開較早任務那一列的位置有一個圓點。seed決定任務數、持續時間與依賴。這是作者設計的示意；每個任務的開始時間可以從畫面上的依賴與結束時間重新算出。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`quicksortsteps`（快速排序步驟）使目前目錄1155→1156種，含plain的gallery為1157項。一排8、9或10根長條（高度為1到n的亂序排列）的快速排序：第一列是起點，之後每一次分割各一列。分割以範圍的最後一根當基準（Lomuto：比基準矮的換到前面，再把基準放到它們後面），其下一列顯示分割的結果，列上有括弧標出被分割的範圍，並有一個圓點標出基準最後落的位置；範圍照左邊先、右邊後的順序處理。高度等於所在位置序號的長條（1在第一、2在第二……）顏色較深。seed決定長條數與亂序。這是作者設計的示意；每一列都可以從前一列、括弧範圍與基準重新算出。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`binarysearchsteps`（二分搜尋步驟）使目前目錄1156→1157種，含plain的gallery為1158項。在一排12、14或16根由左到右遞增的長條（每根比前一根高1或2個單位）裡做二分搜尋。每一列左側有一小段刻度標出要找的高度，目標可能剛好是某根長條的高度，也可能落在兩根之間。每一列是一個步驟：還沒排除的長條比紙面深但比已排除的淺，其中間那一根最深並在上方有圓點，下一列只留下仍可能含有目標的那一半，直到中間那一根就是目標或已無長條可找。seed決定長條數、高度與目標。這是作者設計的示意；每一列的範圍都可以從前一列與目標重新算出。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`dijkstragrid`（Dijkstra格子最短路徑）使目前目錄1157→1158種，含plain的gallery為1159項。7、8或9格見方的格子，每一格有一個成本：1到4，或（十格中有三格，最深的顏色）20，格子越深踏進去越貴。一條深色線連出從左上格（小圓點）到右下格（大圓點）最便宜的走法，可以往左右上下走，每進入一格就付那一格的成本，也就是Dijkstra演算法找到的路徑。seed決定大小與各格成本。這是作者設計的示意；路徑總成本可以從畫面上的格子顏色重新算出，且必須等於最小值。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`kmpfailure`（KMP失敗函數表）使目前目錄1158→1159種，含plain的gallery為1160項。三個由字母a與b組成、長度8、9或10的樣式（深色的格子是a，較淺的是b），每個樣式由2到4個字母重複而成、之後有一個字母被改成另一個；每一格下面有一根從橫線垂下的長條，長度是樣式到那個字母為止的最長邊界（border），也就是它的結尾與開頭共有的字母數（沒有時為0，也不會是整個前綴）。這就是Knuth-Morris-Pratt搜尋在不吻合時決定要退回多遠的表。seed決定長度、字母與被改的位置。這是作者設計的示意；每根長條都可以從格子的字母直接重新算出。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`vernierscale`（游標尺讀數）使目前目錄1159→1160種，含plain的gallery為1161項。五組游標尺讀數：主尺共28格，每格一條刻度（每第五條較長），主尺下方是一塊游標板，上面有11條刻度，間距是主尺格距的十分之九，第一條停在距主尺起點「整數格加上幾個十分之一格」的位置。游標板上恰有一條刻度與主尺某條刻度對齊，它畫得較長、顏色較深，它的編號（1到9）就是十分之幾格的讀數。seed決定每組的整數格（1到17）與十分之幾格。這是作者設計的示意；每組讀數都可以從畫面上第一條游標刻度的位置獨立算出，且必須與被標出的那一條相符。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`paretochart`（柏拉圖）使目前目錄1160→1161種，含plain的gallery為1162項。柏拉圖：7、8或9根立在基準線上的長條，由高到低排序，上方有一條穿過各點的折線，每根長條上方一個點，高度是到該根為止的累計值占總和的比例（最後一點在圖的最上緣，也就是100％），另有一條橫越全圖的細線標出80％。長條高度是1到30的整數，多數偏小。seed決定長條數與各自的高度。這是作者設計的示意；每個點的位置都可以從畫面上的長條高度獨立算出。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`radixsortpasses`（基數排序各回合）使目前目錄1161→1162種，含plain的gallery為1163項。對10、12或14個0到63的數字做由低位數開始的基數排序，數字畫成立在基準線上的長條，第一列是起點。三個回合各看一個4進位的位數（兩個位元），由右邊的位數開始：在它處理的那一列，每根長條依該位數染色，下一列是同樣的長條依該位數做穩定排序（位數0的先、再1、2、3，每一組維持原來的先後）。最後一回合之後長條已經排好，全部畫成最深的色調。seed決定個數與數字。這是作者設計的示意；每一列都可以從上一列與該回合的位數重新算出。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`mergesortruns`（合併排序各層）使目前目錄1162→1163種，含plain的gallery為1164項。對13到16根長條（高度1到n的亂序）做由下而上的合併排序，一層一列。最上列每根長條各自是一段；每一列把上一列相鄰的兩段合併（第一段與第二段、第三段與第四段，依此類推，沒有伴的最後一段原封不動帶下來）成兩倍長且已排序的段。相鄰的段交替用淺色與深色著色；最後一次合併後整列是一段，用最深的色調。seed決定長條數與亂序。這是作者設計的示意；每一列都可以從上一列重新算出。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`bresenhamlines`（Bresenham畫線）使目前目錄1163→1164種，含plain的gallery為1165項。四塊面板，每塊是16×16格的格子，格子上有一條用Bresenham演算法在兩個格子之間畫出的線：被填滿的格子是深色（兩個端點格更深），兩個端點格中心之間的真正直線以細線畫在上面。線恰好在兩格正中間時取較前進的那一格，並由左邊的端點格開始畫。seed決定端點格（沿某個方向至少相隔8格）。這是作者設計的示意；被填滿的格子可以從兩個端點格用四捨五入的公式獨立算出，且必須完全相同。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`bfswavefront`（BFS波前）使目前目錄1164→1165種，含plain的gallery為1166項。10、11或12格見方的格子，有一些牆（最深的格子）與一個起點格（上面有一個圓點），廣度優先搜尋從起點一步一步擴散到上下左右的格子（不穿過牆）。每個開放格依它離起點的步數著色：0到6步與7步以上共八種由深到淺的色調；被牆圍住、到不了的開放格是第九種較淡的色調。seed決定大小、牆與起點。這是作者設計的示意；每個格子的步數都可以從牆與起點用另一種方法獨立重新算出。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`knapsacktable`（背包問題表）使目前目錄1165→1166種，含plain的gallery為1167項。兩個0/1背包問題，各畫成動態規劃的表。左邊每個物品一列：重量是同樣數目的小方塊（1到4個），價值是一根長條（1到6單位）。右邊每個物品一列格子，容量0到9各一格：格子裡的長條是「用到這一列為止的物品、在這個容量下」最多能裝的價值；若這一列的物品被放進最佳解（價值比上一列大），這一格顏色較深。最後一列最後一格（答案）有框。seed決定物品數（4或5）、重量與價值。這是作者設計的示意；每一格都可以從物品的重量與價值用另一種方式重新算出，答案也必須等於窮舉所有物品子集的最大值。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`prefixtrie`（前綴樹）使目前目錄1166→1167種，含plain的gallery為1168項。由6到8個長度2到4、字母為a、b、c的單字組成的前綴樹（trie）。根在左邊，每向右一步多一個字母，字母用進入該節點最後一段線的深淺表示（a最深、b中、c最淺）；開頭相同的單字共用路徑的前段；單字結束的節點在圓點外多一圈環。葉子由上而下依字母順序一格一格排列，其他節點在第一個與最後一個子節點的正中間。seed決定單字。這是作者設計的示意；樹的結構與每個節點的位置都可以從畫面上的單字集合獨立重新算出。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`lrucachetrace`（LRU快取軌跡）使目前目錄1167→1168種，含plain的gallery為1169項。最久未使用（LRU）快取在一連串頁面請求下的軌跡：3或4個槽，14次對0到5號頁面的請求，每次請求一欄。最上面一列是請求，用頁面的深淺（頁面由深到淺）著色的小方塊；它下面是請求之後各槽的內容：頁面會留在它的槽直到被換出，新頁面放進第一個空槽，或放進最久未使用的那個頁面所在的槽；空槽是淺色的方塊，這次請求用到的槽有一個框。槽的下面，環表示頁面本來就在快取裡（命中），圓點表示不在（未命中）。seed決定槽數與請求（約半數請求會重複最近三次之一）。這是作者設計的示意；每一欄的內容、用到的槽與命中與否都可以用另一種方式（記錄使用順序）獨立重新模擬。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`funnelchart`（漏斗圖）使目前目錄1168→1169種，含plain的gallery為1170項。5或6個階段由上往下排成漏斗：每個階段是置中的橫條，寬度正比於還留下的人數；第一階段為滿寬，之後每個階段留下前一階段的45%到95%；階段之間以斜邊相連；每個階段右側有一條短橫條，長度是留下的比例（第一階段留下全部，是滿長），底下襯一條淡色的完整長度軌道。seed決定階段數與留下的比例。這是作者設計的示意；每個階段的寬度必須等於前一階段乘以右側橫條的長度，可由畫面獨立解出並驗算。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`wordlefeedback`（猜字回饋）使目前目錄1169→1170種，含plain的gallery為1171項。一個猜字遊戲：祕密單字有5個字母（每個字母是6種之一，以小方塊的深淺表示，因此字母可以重複），下面是4到6次猜測，每次猜測每個位置有0.4機率沿用祕密單字的字母、否則隨機取字母，最後一次猜測有一半機率就是祕密單字。每個猜測方塊的底色是回饋：最深表示字母在正確位置，中間表示祕密單字別處有這個字母而且還沒被用掉，最淡表示沒有；祕密單字畫在猜測的下方。這是作者設計的示意；回饋必須符合標準規則（字母出現次數只算祕密單字裡有的份數），測試以另一種逐字母計數的方式重新算出每一列回饋並與畫面逐格比對。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`nimgame`（Nim遊戲）使目前目錄1170→1171種，含plain的gallery為1172項。一局取石子遊戲（Nim），每個狀態一欄：3或4堆（各佔一列），每堆畫成一條長條，高度是石子數（開始時1到7顆）。兩位玩家輪流從某一堆取走石子；先手能的時候取成讓各堆的互斥或（nim-sum）為0，否則隨機選一堆取隨機數量，後手一律隨機；到第5個狀態之後，隨機的一步一律取走整堆，使遊戲在欄數內結束；誰取走最後一顆誰贏。剛被取過的那堆長條用「移動色」，取走的石子以淡色的殘影畫在它上面；堆的下面是nim-sum的三個位元，1是實心圓點、0是圓環。這是作者設計的示意；每一步是否合法、先手是否取成nim-sum 0、nim-sum位元是否等於各堆的互斥或，都可以由畫面獨立解出並驗算。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`gamblersruin`（賭徒破產）使目前目錄1171→1172種，含plain的gallery為1173項。賭徒破產問題：5位賭徒各佔一條橫帶，起始有1到7枚硬幣，每回合贏或輸一枚（贏的機率由該橫帶決定：0.4、0.5或0.6），直到沒有硬幣（破產）、到達8枚（贏光莊家）或打滿24回合。每回合畫一個圓點表示手上的硬幣數，一回合一欄，上下各有一條線標示0枚與8枚；橫帶左側的一、二或三個小方塊表示該橫帶的贏率是0.4、0.5或0.6。seed決定起始硬幣、贏率與每一回合的輸贏。這是作者設計的示意；每一步必須剛好差一枚、遊戲只在碰到0或8枚或打滿24回合時結束、結束後不再有圓點，且以大量橫帶統計時各贏率的實際上升比例接近小方塊所示的贏率。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`bloomfilter`（布隆過濾器）使目前目錄1172→1173種，含plain的gallery為1174項。布隆過濾器：最上面一列24個位元（設了的是深色方塊、沒設的是淡色方塊）；6個放進去的鍵，每個鍵的3個雜湊各指向一個位元，在該鍵自己的一列、對應位元的位置畫一個圓點；再來是6個查詢（其中2個是放進去過的鍵，4個不是），各有一列圓點，列的右端用圓環表示「它的位元全都設了」（可能在裡面）、用實心方塊表示「有位元沒設」（一定不在裡面）。沒放進去過的鍵也可能得到圓環（誤判）。seed決定每個雜湊指向的位元與哪些鍵被查詢。這是作者設計的示意；位元列必須剛好是所有放進去的鍵所指位元的聯集，每個查詢的圓環與方塊必須剛好等於「它的位元是否全都設了」，由畫面獨立解出並驗算。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`linearprobing`（線性探測）使目前目錄1173→1174種，含plain的gallery為1175項。開放定址法的線性探測：16格的雜湊表排成一列，依序放入8、10或12個鍵，每放一個鍵就畫一列，顯示當時的表。每個鍵有一個「家」格（列上方的圓點），放進從家格開始往右第一個空格，超過最後一格就繞回第一格。空格是淡色；第n個放進去的鍵所在的格用第n深的色調，因此最後放的鍵最淡。seed決定鍵的個數與各鍵的家格。這是作者設計的示意；每一列必須剛好比上一列多一個格、那一格是從家格起第一個空格（含繞回）、其餘格不變，由畫面獨立解出並驗算。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`unionfindmerges`（並查集合併）使目前目錄1174→1175種，含plain的gallery為1176項。並查集（union-find）：14個元素排成一列，第一列是開始時的狀態，之後10列各是一次合併請求之後的狀態。每個元素是一個方塊，色調代表它所在的集合（集合以其中最小的元素命名，集合0最深）；一次請求點名兩個元素，在該列的兩個元素上方各畫一個圓點；點名的兩個元素若本來就在同一集合，這一列與上一列相同。seed決定每次請求。這是作者設計的示意；每一列的集合必須等於把前面所有請求依序合併後的結果，由畫面獨立解出並用另一種方式（父節點森林）重新算出驗算。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`fareysequence`（法里數列）使目前目錄1175→1176種，含plain的gallery為1177項。法里數列：第n列（n從1到7、8或9）在0到1之間，每個最簡分數a/b（b不超過n）的位置畫一條刻度（該列才新出現的，也就是b＝n的刻度，比上面列來的深）。每一列下方有一個圓點標出同一個被選中的分數（分母在11到23之間，所以絕不落在任何刻度上），列內有一條淡色的帶子，從被選中分數在該列的兩個鄰居（它之前最大的刻度與它之後最小的刻度）之間。seed決定列數與被選中的分數。這是作者設計的示意；每一列的刻度必須剛好是分母不超過n的最簡分數，帶子兩端必須是被選中分數的法里鄰居（兩端分數的交叉乘積為1），由畫面獨立解出並驗算。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`lfsrstates`（LFSR狀態）使目前目錄1176→1177種，含plain的gallery為1178項。8位元的線性回饋移位暫存器（LFSR），每一列是它的一個狀態（16、20或24個，第一個由seed決定且不為0）。設為1的位元是深色方塊、為0的是淡色方塊，第7位元在左、第0位元在右。每一步暫存器向右移一位：第0位元移出（列右側的輸出小方塊），被選位元（taps）的互斥或從左端進入（輸出旁的回饋小方塊）。taps一定包含第0位元（因此暫存器不會變成0），畫成第一列上方的圓點，是seed選的三組之一。這是作者設計的示意；每一列必須是上一列右移後左端補上回饋位元，輸出必須等於第0位元，回饋必須等於被選位元的互斥或，由畫面獨立解出並驗算。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`crcdivision`（CRC長除法）使目前目錄1177→1178種，含plain的gallery為1179項。CRC檢查碼的長除法：12位元的訊息（1是深色方塊、0是淡色方塊）後面接4個0，除以三個5位元多項式之一（位元的除法，沒有進位）。除數是最上面一列小方塊；第一列是被除數，之後每一列是一步，處理從左邊數來的下一位元：該位元為1時，把除數從它底下的位元減掉（互斥或），列左邊的圓點畫成實心；為0時什麼也不減，圓點是圓環。最後一列的後四位元（外面有框）是餘數，也就是檢查碼。seed決定訊息與除數。這是作者設計的示意；每一列必須是上一列依規則減（或不減）除數的結果，最後一列前12位元必須全為0，餘數必須等於另一種做法（移位暫存器）算出的結果，訊息接上餘數後必須能被除數整除，由畫面獨立解出並驗算。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`kolakoskisequence`（Kolakoski數列）使目前目錄1178→1179種，含plain的gallery為1180項。Kolakoski數列是會描述自己的數列：它由兩個符號交替的連續段（run）組成（符號對是1與2、2與1、1與3或3與1，第一個符號就是數列的開頭），而第n個連續段的長度正是數列的第n個符號。上面4列放前64個符號，每個符號是一個方塊，色調代表符號（1最深、3最淡）；空一列後的3列依序放各連續段的長度（64個符號裡放得下完整連續段的那些），那其實就是同一個數列的開頭，畫法相同。seed決定符號對。這是作者設計的示意；連續段由畫面上的方塊獨立找出，每一段的長度必須等於數列對應位置的符號、連續段必須在兩個符號間交替、長度列必須等於這些完整連續段的長度，由畫面獨立解出並驗算。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`slopegraph`（斜率圖）使目前目錄1179→1180種，含plain的gallery為1181項。斜率圖：6、8或10個項目，每個項目在左軸有一個圓點（之前的值）、在右軸有一個圓點（之後的值），兩點以直線相連。值是20個等距層級中的位置（圓點越高值越大），同一軸上沒有兩個項目共用同一層級；上升的線是深色、下降的線是中間色調、維持同一層級的線是淡色。seed決定項目數、各項目的層級與左右圓點的配對。這是作者設計的示意；每個左圓點必須剛好與一個右圓點相連（一對一配對）、連線必須是直線（沿線各處都在）、線的色調必須依上升或下降而定，由畫面獨立解出並驗算。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`astroidladder`（星形線的滑動梯子）使目前目錄1180→1181種，含plain的gallery為1182項。星形線（astroid）的滑動梯子：一把長度固定的梯子靠在牆角，上端在一條軸上、腳在另一條軸上，往下滑時畫在14、18或22個位置（四個角落依兩軸鏡射都畫）。位置在四分之一圈上均勻排開，或依seed選的冪次偏向一端。每個梯子在兩條軸上各有一個端點圓點，以及它與所有梯子共同相切的曲線（星形線）相切處的一個較小圓點，那一點是(L cos³θ, L sin³θ)。seed決定梯子數、長度與位置的分佈。這是作者設計的示意；梯子數、長度與分佈冪次都可以只從畫面讀出（端點圓點的位置），每個端點對應的另一端必須落在長度為L的圓上（x²＋y²＝L²）、線的中點必須畫了線、相切點必須在梯子的線上，由畫面獨立解出並驗算。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`eulerlinetriangle`（三角形的歐拉線）使目前目錄1181→1182種，含plain的gallery為1183項。銳角三角形的歐拉線：畫出三角形（三個角各有一個深色圓點）、外接圓、三條高（交於垂心H，一個小方塊）、外心O（一個小圓環，在外接圓的中心）、重心G（一個小圓點）以及穿過O、G、H的歐拉線，G在O到H的三分之一處。三個角在圓上，角度使每一段弧都小於半圈（所以是銳角三角形，H在三角形內），而且不會太接近正三角形（O與H相距約0.11以上）或等腰三角形（等腰時歐拉線會與一條高重合）。seed決定圓的半徑、弧長的差異與整體的轉向。這是作者設計的示意；測試端只從畫面讀圓的半徑與三個角（沿圓掃描、再用對分法精確定位），其餘由這三個角獨立算出：外心O、重心G（三角的平均）、垂心H（解兩條高的交點，不用取樣端的「角向量相加」公式），再驗證畫面上這些位置的標記、三條高、三邊、外接圓與歐拉線。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`arbelos`（阿基米德的鞋匠刀形）使目前目錄1182→1183種，含plain的gallery為1184項。阿基米德的鞋匠刀形（arbelos）：線段AB上有一個大半圓，裡面在AC與CB上各有一個較小的半圓（C在AB上的位置依seed而定，不會在中間附近，份額落在0.25到0.42之間，左右隨機），從C向上畫一條垂線到大半圓上的D，以及阿基米德的雙生圓：垂線兩側各一個圓，各自與垂線及它所在位置的兩個半圓相切，兩個圓的半徑相同，等於ab/(a+b)（a、b為AC與CB的一半）。A、B、C、D各有一個深色圓點。這是作者設計的示意；測試端只從畫面讀出線上的三個圓點（在線下方一小段、只有圓點的地方，用對分法找每個圓點兩邊的邊緣取中點），其餘獨立算出：a、b、大半圓半徑、D的高度（AC乘CB的平方根）、雙生圓的半徑與圓心（圓心用「與垂線相切且與大半圓內切」解出，不用取樣端的公式），並驗算它們同時與小半圓外切；再驗證畫面上每個圓、半圓、垂線、基線與圓點的位置、色調、高度、粗糙度與粗細。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`contributiongraph`（貢獻日曆圖）使目前目錄1183→1184種，含plain的gallery為1185項。貢獻日曆圖：把一年的每一天畫成一格、依當天做了多少事上五種深淺的顏色（一欄一週、一列一個星期幾，星期日在最上面）；上下疊五年，每一欄在換月份時前面多留一小段空隙，底下有五種深淺的圖例。第一年取自預設列出的年份之一（1990到2017年之間十二個），之後的年份依序接下去，閏年也包含在內；一月一日是星期幾、一年有幾天都是該年真實日曆的樣子。週末比平日安靜，有些週比別的週忙。這是作者設計的示意；測試端從畫面讀出每一格的深淺（五年各約五十三欄、每欄七列，沒有日期的格子是紙面），並用自己重新算過的真實日曆驗證：每一年的天數、一月一日是星期幾（由五年之間起始星期幾的差推算，在預設年份中恰好有一個年份吻合）、每週欄的位置（含換月份的空隙，以該週最上面一天的月份判斷，二月在閏年有二十九天），以及圖例的五種深淺；各深淺的比例與平均則由預設的數字（每週的忙碌程度與當天的隨機數、週末係數、深淺刻度）在測試中獨立推出並比對。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`pythagoreanproof`（畢氏定理圖）使目前目錄1184→1185種，含plain的gallery為1186項。畢氏定理的圖：一個直角三角形，三邊各向外畫一個正方形，每個正方形都畫上單位格線（邊上有幾個單位就切成幾格），可以數格子：兩條短邊上的正方形有a×a與b×b格，長邊上的正方形沿著自己的邊畫格線，有c×c格，而a²＋b²＝c²。邊長取自預設列出的畢氏三元數（3,4,5、6,8,10、5,12,13、8,15,17）之一；seed決定是哪一組、兩條短邊哪條在前，以及八種轉向／鏡射中的哪一種。三角形的三個頂點各有一個深色圓點。這是作者設計的示意；測試端從畫面讀出三個圓點（先粗掃整張圖，再取周圍深色像素的中心），在可能畫出的六十四種圖（四組三元數、兩種短邊順序、四個轉向、鏡射與否）中找出三個頂點與三個正方形的填色都吻合的那一種；再沿每個正方形的一邊走半個格子的位置數格線的色調，數出每個正方形的格數，驗證a×a＋b×b＝c×c、三條邊的長度與格數成同一比例、兩條短邊成直角，以及整張圖最大的寬或高等於預設的範圍。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`keplerorbit`（克卜勒第二定律的軌道圖）使目前目錄1185→1186種，含plain的gallery為1187項。克卜勒第二定律：行星在橢圓軌道上、太陽在其中一個焦點，等間隔的時間（平近點角等間隔增加）標出行星的位置；從太陽到這些位置的線把軌道切成楔形，兩種交替的色調上色。所有楔形面積相同（這就是定律），儘管遠離太陽的楔形又細又長、靠近太陽的又短又寬。seed決定軌道的半長軸、離心率、楔形數（8、10或12）、軌道朝哪個方向，以及第一個位置的時間。這是作者設計的示意；測試端從畫面讀出太陽與行星的圓點位置（先粗掃整張圖找出圓點的精確色調，再取周圍同色調像素的中心），用最小平方法擬合1/r＝A＋B cosθ＋C sinθ（太陽在焦點的橢圓極座標式）得到半長軸、離心率與方向，驗證擬合值與預設吻合；再由各行星的位置算出真近點角、偏近點角、平近點角（克卜勒方程式），驗證它們等間隔；並在畫面上數每個楔形的像素（以色調判斷、以平近點角分楔形，加回線條與太陽佔掉的面積），驗證各楔形面積都等於橢圓面積除以楔形數（容許差3%）。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`eisensteinprimes`（艾森斯坦質數）使目前目錄1186→1187種，含plain的gallery為1188項。艾森斯坦質數：形如 a ＋ b·ω（ω為一的立方根）的數是三角格點，它們有自己的質數：不能寫成兩個非單位數的乘積的數即為質數（單位是範數為1的六個數）。圖中是28×28個格點（一列一個b，每列比上一列向右半格），質數畫成大的深色圓點，其他數畫成小的淺色圓點，原點畫成中等圓點外加一圈環；seed決定原點是哪個格點（八個預設位置之一）。質數在轉六分之一圈（乘以ω與乘以−1）下相同，只要圖的範圍裡有對應的格點。這是作者設計的示意；測試端從畫面讀出每個格點中心的色調分出質數、其他與原點，再以完全不同的方法判斷每個數是否為質數：逐一試所有範數較小的因子c＋dω，用除法（乘以共軛，兩個分量都要被範數整除）判斷整除；並且只從畫面驗證六分之一圈與半圈對稱（把每個點對應到旋轉後的點，其類別必須相同，只比對旋轉後落在圖內的點）。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`catalantriangulations`（卡特蘭三角剖分）使目前目錄1187→1188種，含plain的gallery為1189項。把凸多邊形用互不相交的對角線切成三角形的所有方法：五邊形5種、六邊形14種、七邊形42種（卡特蘭數），每一種畫在格子中的一格（五邊形用6格中的5格、六邊形用15格中的14格，七邊形剛好42格）。每個多邊形的邊是較粗的深線、對角線較細較淺、每個頂點一個圓點、多邊形內部淺灰填色；seed決定是哪種多邊形、各種剖分的排列順序（五邊形與六邊形還有哪一格空著）。這是作者設計的示意；測試端從畫面讀出多邊形的種類（三種版面中頂點圓點色調對得上的那一種）與每一格有哪些對角線（沿弦在三個位置都是對角線色調才算，避免剛好穿過弦的另一條對角線誤判），並以完全不同的方法（試遍所有大小為n−3的對角線子集、檢查互不相交）窮舉出所有剖分，驗證畫面上的剖分恰好就是這些、每一種出現一次、數量等於卡特蘭數C(n−2)（由公式C(2m,m)/(m+1)算出）、每一種恰有n−3條互不相交的對角線，且空格是紙面。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`binarynecklaces`（二元項鍊）使目前目錄1188→1189種，含plain的gallery為1190項。所有n顆珠子的二元項鍊（每顆珠子深色或淺色，兩條項鍊能互相轉動成同一條就算同一條）：6顆有14種、7顆20種、8顆36種。每一條畫在環上、放在格子中的一格（6顆時15格用14格，其他剛好填滿），每格依seed轉過不同的珠數，所以同一條項鍊不會以相同的樣子畫兩次；seed決定珠子數、各條項鍊的排列順序與空格。這是作者設計的示意；測試端從畫面讀出是哪一種版面（珠子位置上是珠子色調的那一種）、每格是否有項鍊與每顆珠子的深淺，並獨立驗證：畫面上的格子數等於項鍊數公式 (1/n)Σφ(d)2^(n/d)、任兩格轉動後都不相同、所有格子轉到最小的轉法之後恰好是「n顆珠子的全部2^n種圖樣各轉到最小」得到的集合、不少於四成的格子不是以最小的轉法呈現，以及（對於每種轉法都不同的項鍊）各個轉珠數出現的次數大致相同。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`baumsweetgrid`（鮑姆－斯威特方格）使目前目錄1189→1190種，含plain的gallery為1191項。Baum-Sweet數列b(n)：n的二進位表示中沒有長度為奇數的連續0時為1，否則為0（b(0)=1）。本材質把n依列排在64×64方格中（每列64格，從seed選的起點offset開始往下數），每格依「n的二進位中長度為奇數的0連續段有幾段」（0、1、2、3、4段以上）塗五階色調與高度：沒有奇數段（b=1）最深。八個起點offset之間彼此畫面不同。這是作者設計的示意；測試端從畫面讀出每一格的階，並用獨立的二進位字串（以正規表示式找出0的連續段）算出每格的值，驗證畫面恰好和八個offset中的一個吻合（只有一個吻合）、五階都出現、每個offset在60個seed中都被選到。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`rudinshapirogrid`（魯丁－夏皮羅方格）使目前目錄1190→1191種，含plain的gallery為1192項。Rudin-Shapiro數列r(n)=(−1)的「n的二進位中11出現（可重疊）次數」次方。本材質把n依列排在64×64方格中（每列64格，從seed選的起點offset開始往下數），每格依11出現的次數（0到5，超過5時只保留奇偶）塗六階色調與高度：次數為偶數（r=1）塗淺色系、奇數（r=−1）塗深色系，所以數列的正負一眼可見，次數再細分深淺。八個起點offset之間彼此畫面不同。這是作者設計的示意；測試端從畫面讀出每一格的階，並用獨立的二進位字串（以正規表示式數出重疊的11）算出每格的階，驗證畫面恰好和八個offset中的一個吻合（只有一個吻合）、六階都出現、每格的奇偶等於以r(2k)=r(k)、r(2k+1)=(−1)^k r(k)遞迴算出的數列值，以及每個offset在60個seed中都被選到。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`paperfoldingruler`（折紙尺數列方格）使目前目錄1191→1192種，含plain的gallery為1193項。把n依列排在61×61方格中（每列61格，從seed選的起點offset開始往下數；列長取質數61，因為取2的次方時每一列都一樣，只剩直條紋），畫兩個數列：尺數列（n能被2整除幾次，0到4次與5次以上，共六階）決定方格的色調與高度（整除次數越多越深）；正規折紙數列（n去掉所有2的因子後的奇數部分除以4餘1時為1，餘3時為0）只在值為1的格子裡畫一個較小的方塊，色調另有六階。八個起點offset之間彼此畫面不同。這是作者設計的示意；測試端從畫面讀出每一格的階（方格外圈的色調）與小方塊（中心色調是否為小方塊色），並用獨立的二進位字串（尾端0的個數；去掉尾端0之後以4除的餘數）算出，驗證畫面恰好和八個offset中的一個吻合（只有一個吻合）、六階各有有無小方塊的格子、每個offset在60個seed中都被選到。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`walshmatrix`（沃爾什矩陣）使目前目錄1192→1193種，含plain的gallery為1194項。階數n為8、16或32（由seed選）的Hadamard矩陣：第i列第j欄的符號是(−1)的「二進位i AND j中1的個數」次方，+1畫深色、−1畫淺色。列的排列有兩種（由seed選）：自然順序，或依該列沿行符號改變的次數由少到多排列（第一列0次、最後一列n−1次）的Walsh順序；seed也選是否把全部符號反轉。這是作者設計的示意；測試端從畫面讀出符號矩陣（取各階數方格中心中最小且全為符號色調者為階數），並獨立驗證：任兩列、任兩欄正交（內積為0，自己與自己為n）、第一列只有一種符號、其餘每列兩種符號各一半、恰好是自然順序（以二進位字串數1的個數計算）或Walsh順序（第k列符號改變k次）兩者之一、150個seed中三種階數、兩種排列、兩種符號反轉的十二種組合都出現、400個seed中Walsh順序與反轉各約一半。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`beattypartition`（貝蒂分割方格）使目前目錄1193→1194種，含plain的gallery為1195項。貝蒂定理（Beatty's theorem）：a為大於1的無理數、b=a/(a−1)（即1/a+1/b=1）時，floor(k·a)與floor(k·b)（k=1,2,3…）兩個數列把所有正整數恰好分成兩份，每個整數剛好屬於其中一個。本材質把n依列排在47×47方格中（每列47格，從seed選的起點offset開始往下數），第一個數列的數畫深色系、第二個畫淺色系，色調再依該數在自己數列中的名次k除以3的餘數分三階，共六階色調與高度；a由seed從黃金比例、√2、√3與e中選，offset由seed從四個值中選。這是作者設計的示意；測試端從畫面讀出每一格的階，並用獨立的方式（直接迭代k產生兩個數列，用k·a與k·b取整數，記錄每個數的名次）算出，驗證畫面恰好和十六組（a、offset）中的一組吻合（只有一組吻合）、每個數剛好屬於兩個數列中的一個（貝蒂定理）、六階都出現、第一個數列的比例接近1/a、60個seed中四個a與四個offset都被選到。Metallic與mortar為0。

預設1 m nominal tile、0.004 UV-relative relief（非公尺位移）與metallic factor 0；沿用既有週期不透明四maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。不宣稱本段已完成三backend或跨瀏覽器驗證。

`to92packagefaces`（TO-92封裝正面示意）使目前目錄885→886種，含plain的gallery為887項。2×2四個旋轉／微移的霧黑D形本體：直側、平底、上半橢圓穹頂；三支等間距平行直中性金屬腳有寬根肩與窄尾，本體遮住腳根。無金屬片、安裝孔或印字。完整腳面M1，本體／背底M0，邊界C1混合；作者正規化高度為背底.02 < 腳.44 < 本體.68。

尺寸參考是實際下載並raster實看的[onsemi P2N2222A/D，January 2013 Rev.7，PDF第6頁](https://www.onsemi.com/pdf/datasheet/p2n2222a-d.pdf#page=6)：內附98ASB42022B，TO-92（TO-226）CASE29-11，Issue AM，09 MAR 2007，圖面第1／2頁，STRAIGHT LEAD BULK PACK視圖。A4.45–5.20 mm、B4.32–5.33 mm、G1.15–1.39 mm及K≥12.70 mm僅是原廠尺寸參考，非插圖量測值。D形上半橢圓、比例、肩寬、色彩、roughness、AO及高度皆作者簡化，不是精確CAD；不推定化學成分、鍍層、光學或電氣特性，不打包來源圖。

預設0.08 m nominal tile、0.0042 UV-relative relief（非公尺位移）與metallic factor1；explicit `createMaterial({ metallic: 0 })`僅改scalar factor，不改stored M mask。沿用TO-220的constructor快取pose／grain及C1角色替換結構、既有週期不透明maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。先移除借用材質再銷毀擁有textures的preset，並另行管理自有pool／cache。建議512辨識三支窄尾，32僅粗預覽；不宣稱本段已完成runtime或browser驗證。

使用`await ProceduralMaterial.create('mudcloth', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的布料材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('turingpattern', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的皮毛紋材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('bayerdither', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的像素方磚材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('patchworkquilt', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的拼布被面材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('amberresin', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的琥珀樹脂材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('ammonitestone', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的化石灰岩材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('octopussuckers', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的吸盤材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('expandedpolystyrene', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的發泡珠粒材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('asphaltshingle', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的屋頂瓦材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('lawnstripes', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的草坪材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('atomicboomerang', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的層壓板材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('celticplait', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的雕刻石面材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('garnetschist', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的片岩材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('topographiccontours', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的等高線圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('digitalcamo', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的迷彩布料材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('radarscope', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的雷達顯示材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('hazardstripes', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得預設金屬factor；explicit `createMaterial({ metallic: 0 })`保留stored mask與既有texture清理方式。

使用`await ProceduralMaterial.create('kiwislices', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的水果切片材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('mandalaflower', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的花形裝飾材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('needlepoint', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的針繡織錦材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('dicefaces', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的骰子面材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('cinderblockwall', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的空心磚牆材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('moirefringes', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的疊紋材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('azulejotiles', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的彩繪瓷磚材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('tumblingblocks', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的翻滾方塊拼布材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('kilimflatweave', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的平織地毯材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('ean13barcodes', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的條碼標籤材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('morsetape', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的摩斯紙帶材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('sandripples', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的風成沙紋材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('frostpolygons', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的凍土多邊形材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('datamatrixcodes', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的二維碼標籤材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('ecgpaper', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的心電圖記錄紙材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('sheetmusic', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的樂譜材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('sudokugrid', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的數獨格材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('measuringtape', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的卷尺材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('calendarpage', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的月曆頁材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('fretboard', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的吉他指板材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('crosswordgrid', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的填字格材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('flipdotdisplay', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的翻轉點陣顯示器材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('minesweeperboard', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的踩地雷盤面材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('tetrisstack', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的方塊堆疊材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('battleshipgrid', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的海戰棋盤材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('hilbertcurve', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的希爾伯特曲線材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('mondriancomposition', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的矩形構圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('lissajousgrid', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的李沙育圖形材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('zoneplates', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的波帶片材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('backgammonboard', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的雙陸棋盤材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('jigsawpuzzle', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的拼圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('ramennoodles', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的拉麵麵條材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('connectfourboard', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的四子棋盤材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('bingocard', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的賓果卡材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('pegsolitaire', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的單人跳棋材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('xylophonebars', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的木琴音條材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('sliderulescale', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的計算尺刻度材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('spirographrosettes', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的繪圖尺花紋材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('juliacells', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的Julia集合方格材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('nonogrampuzzle', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的數織材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('lightsoutboard', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的熄燈遊戲材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('weavingdraft', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的織造圖解材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('scrambledcubenet', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的魔術方塊展開圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('knightstour', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的騎士巡邏棋盤材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('graycodediscs', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的格雷碼編碼盤材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('code39barcodes', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的Code 39條碼材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('amidakuji', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的阿彌陀籤材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('featherbarbs', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的羽毛羽枝材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('dartboardsectors', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的飛鏢靶材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('tictactoegames', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的井字遊戲材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('quasicrystalwaves', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的準晶波紋材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('tallymarks', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的計數記號材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('polargraphpaper', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的極座標方格紙材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('chesterfieldtufting', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的菱格縫釦皮革材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('louvershutter', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的百葉窗板材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('ledgersheet', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的帳簿紙材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('sundialplate', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的日晷盤面材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('doubleslitfringes', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的雙狹縫干涉條紋材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('fibonaccisquares', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的斐波那契方塊材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('bluenoisemask', { size: 64, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的藍噪聲遮罩材質（size 64時每個像素對應一個texel）；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('elementaryautomata', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的基本細胞自動機材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('mastermindboard', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的Mastermind棋盤材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('wordsearchgrid', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的找字遊戲材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('magicsquares', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的幻方材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('slidingpuzzle', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的滑塊拼圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('kaleidoscope', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的萬花筒材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('oghaminscription', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的歐甘文刻石材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('gameoflife', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的生命遊戲材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('pascalmodulo', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的巴斯卡三角形同餘材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('dragoncurve', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的龍形曲線材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('cantordust', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的康托爾塵材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('eightqueens', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的八皇后材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('hanoitowers', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的河內塔材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('latinsquares', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的拉丁方陣材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('mayansums', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的馬雅數字加法材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('sortingnetworks', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的排序網路材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('primesieve', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的質數篩材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('knockoutbracket', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的淘汰賽對戰表材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('skyscraperpuzzles', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的摩天樓謎題材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('pianoroll', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的鋼琴捲簾材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('binaryclock', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的二進位時鐘材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('othelloboard', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的黑白棋盤材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('goboards', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的圍棋盤材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('dewbeads', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的露珠材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('bowlingscoresheet', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的保齡球計分表材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('hexresourceboard', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的六邊形資源島材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('kakuropuzzle', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的數和謎題材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('hashibridges', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的橋樑謎題材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('slitherlinkloop', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的四角迴路謎題材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('masyupearls', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的珍珠謎題材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('stringartcurves', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的弦線藝術材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('fillominoregions', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的數塊謎題材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('futoshikigrid', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的不等式謎題材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('nurikabeislands', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的島嶼謎題材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('tentsandtrees', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的帳篷謎題材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('shikakurects', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的矩形分割謎題材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('hitorishading', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的數字塗黑謎題材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('akarilights', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的點燈謎題材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('takuzugrid', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的二進位謎題材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('kenkencages', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的算術方陣謎題材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('numberlinkpaths', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的數字連線謎題材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('rushhourjam', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的交通阻塞盤面材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('mancalaboard', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的播棋材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('hidatochain', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的數字連鎖謎題材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('euclideanrhythms', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的歐幾里得節奏材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('chinesecheckersboard', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的中國跳棋材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('colormapregions', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的地圖著色材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('draughtsposition', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的西洋跳棋材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('multiplicationtable', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的乘法表材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('moonphases', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的月相材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('treemaprects', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的樹狀圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('analogclocks', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的類比時鐘材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('piechartwedges', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的圓餅圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('regressionscatter', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的迴歸散佈圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('barchartbars', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的長條圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('truthtablelogic', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的真值表材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('fouriersquarewaves', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的傅立葉方波材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('pascaltrianglenumbers', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的帕斯卡三角形材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('convexhullpoints', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的凸包材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('delaunaytriangles', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的德勞內三角剖分材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('collatzsequences', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的考拉茲序列材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('hammingcodewords', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的漢明碼字材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('cayleytables', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的凱萊表材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('romannumerals', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的羅馬數字材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('signedencodings', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的帶號整數編碼材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('matrixproducts', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的矩陣乘積材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('kochsnowflake', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的科赫雪花材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('newtonbasins', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的牛頓吸引盆材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('mandelbrotbands', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的曼德博等高帶材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('cantorsetrows', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的康托集合列材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('conicsections', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的圓錐曲線材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('rosecurves', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的玫瑰線材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('cassiniovals', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的卡西尼卵形線材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('twosourceripples', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的雙波源漣漪材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('luhnnumbers', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的盧恩校驗碼材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('bezierconstruction', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的貝茲曲線作圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('vennregions', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的文氏圖區域材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('ieee754floats', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的單精度浮點數材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('bellcurvebands', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的鐘形曲線標準差帶材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('roundingmodes', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的取整方式材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('binaryaddition', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的二進位加法材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('abeliansandpile', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的阿貝爾沙堆材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('percolationclusters', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的滲流群集材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('gcdtable', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的最大公因數表材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('bitwiselogic', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的位元邏輯運算材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('logisticbifurcation', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的邏輯斯蒂分岔圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('burningship', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的燃燒船碎形材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('modularpowers', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的模冪表材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('primefactors', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的質因數分解材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('baseconversion', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的進位制轉換材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('caesarcipher', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的凱薩密碼材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('wordsquares', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的對稱字方陣材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('vectorfieldarrows', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的向量場箭頭材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('fordcircles', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的福特圓材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('mobiusgrid', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的莫比烏斯格網材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('dipolefieldlines', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的偶極場線材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('numberwords', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的數字英文拼寫材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('sorobanabacus', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的算盤材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('boxplots', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的箱型圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('stemandleaf', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的莖葉圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('substitutionwords', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的替換序列材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('dicesumbars', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的骰子點數和材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('binaryheaptree', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的二元堆積樹材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('bubblesortpasses', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的氣泡排序材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('graphcoloring', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的圖著色材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('runlengthrows', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的遊程編碼列材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('isbn10checks', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的ISBN-10檢查碼材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('projectilearcs', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的拋體軌跡材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('sternbrocottree', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的分數二元樹材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('cycloidcusps', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的擺線尖點材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('zeckendorfrows', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的Zeckendorf表示列材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('ferrersdiagrams', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的費勒斯圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('pairingtables', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的配對函數表材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('hexdumprows', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的十六進位傾印列材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('pythagoreantriples', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的畢氏三元數表材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('figuratenumbers', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的形數點陣材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('dyckpaths', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的Dyck路徑材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('sacksspiral', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的薩克斯螺線材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('sierpinskipascal', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的帕斯卡奇偶三角材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('cobwebplots', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的蛛網圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('divisorcountbars', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的因數個數長條材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('timestablecircles', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的乘法表圓材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('gaussianprimes', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的高斯質數材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('josephuscircle', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的約瑟夫圓環材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('periodictablecells', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的週期表格材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('circleoffifths', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的五度圈材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('roulettewheel', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的輪盤材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('roundrobintable', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的循環賽賽程表材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('kaprekarsteps', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的卡普雷卡爾步驟材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('lookandsayrows', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的外觀數列材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('happynumberchains', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的快樂數鏈材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('recamanarcs', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的雷卡曼弧線材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('thuemorsegrid', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的Thue–Morse格材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('digitalroottable', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的數根表材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('henonattractor', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的埃農吸引子材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('golombrulers', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的Golomb尺材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('bitwisetable', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的位元運算表材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('peanocurve', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的皮亞諾曲線材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('cliffordattractor', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的克利福德吸引子材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('voronoicells', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的Voronoi細胞材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('euclidsquares', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的歐幾里得方塊材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('youngtableaux', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的楊表材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('braiddiagram', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的辮圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('countingrods', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的算籌材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('quadtreecells', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的四叉樹格材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('lsystemplant', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的L-system植物材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('htreefractal', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的H樹材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('wangtiles', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的王氏磁磚材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('marchingsquares', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的行進方塊等值線材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('tsquarefractal', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的T方塊碎形材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('superformulacells', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的超級公式格材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('paleygraphmatrix', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的Paley圖鄰接矩陣材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('candlestickcharts', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的K線圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('tetrominoes', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的四格骨牌鋪面材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('errordiffusion', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的誤差擴散抖色材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('worleycells', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的Worley細胞噪聲材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('equalizerbars', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的等化器LED柱材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('intelhexrecords', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的Intel HEX記錄材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('flagpatterns', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的旗幟圖案材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('gaugedials', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的儀表圓盤材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('qrcodemodules', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的QR碼模組材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('mahjongdots', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的麻將筒子牌材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('smithchart', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的史密斯圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('compassrose', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的羅盤玫瑰材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('windbarbs', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的風標材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('rankchevrons', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的階級人字紋材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('segmenttree', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的線段樹材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('vicsekfractal', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的維切克碎形材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('jacobisymbols', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的雅可比符號表材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('fenwicktree', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的樹狀數組材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('semaphorefigures', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的手旗信號人像材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('hofstadterq', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的霍夫施塔特Q數列散點圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('countertimings', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的計數器時序圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('qamconstellation', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的QAM星座圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('chorddiagrams', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的吉他和弦圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('waterfallchart', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的瀑布圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('intervalpartition', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的區間分組材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('ecdfplot', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的經驗累積分布圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('spanningtree', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的最小生成樹材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('kdtreesplits', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的k-d樹分割材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('bsttreeorder', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的二元搜尋樹材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('karnaughmap', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的卡諾圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('nearesttour', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的最近鄰路徑材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('editdistance', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的編輯距離表材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('hashchains', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的鏈結雜湊表材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('huffmancodes', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的霍夫曼編碼材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('bodeplots', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的波德圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('sankeyflows', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的桑基圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('histogrambins', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的直方圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('zordercurve', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的Z階曲線材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('lorenzcurve', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的羅倫茲曲線材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('ganttschedule', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的甘特圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('quicksortsteps', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的快速排序步驟材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('binarysearchsteps', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的二分搜尋步驟材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('dijkstragrid', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的Dijkstra格子最短路徑材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('kmpfailure', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的KMP失敗函數表材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('vernierscale', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的游標尺讀數材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('paretochart', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的柏拉圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('radixsortpasses', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的基數排序各回合材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('mergesortruns', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的合併排序各層材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('bresenhamlines', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的Bresenham畫線材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('bfswavefront', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的BFS波前材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('knapsacktable', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的背包問題表材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('prefixtrie', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的前綴樹材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('lrucachetrace', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的LRU快取軌跡材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('funnelchart', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的漏斗圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('wordlefeedback', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的猜字回饋材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('nimgame', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的Nim遊戲材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('gamblersruin', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的賭徒破產材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('bloomfilter', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的布隆過濾器材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('linearprobing', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的線性探測材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('unionfindmerges', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的並查集合併材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('fareysequence', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的法里數列材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('lfsrstates', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的LFSR狀態材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('crcdivision', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的CRC長除法材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('kolakoskisequence', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的Kolakoski數列材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('slopegraph', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的斜率圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('astroidladder', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的星形線滑動梯子材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('eulerlinetriangle', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的三角形歐拉線材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('arbelos', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的鞋匠刀形材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('contributiongraph', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的貢獻日曆圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('pythagoreanproof', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的畢氏定理圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('keplerorbit', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的克卜勒軌道圖材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('eisensteinprimes', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的艾森斯坦質數材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('catalantriangulations', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的卡特蘭三角剖分材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('binarynecklaces', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的二元項鍊材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('baumsweetgrid', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的Baum-Sweet方格材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('rudinshapirogrid', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的Rudin-Shapiro方格材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('paperfoldingruler', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的折紙尺數列方格材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('walshmatrix', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的Walsh矩陣材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('beattypartition', { size: 1024, seed: 7, heightMap: true })`後`createMaterial()`取得非金屬（metallic factor 0）的貝蒂分割方格材質；borrowed材質與texture清理方式同其他程序材質。

使用`await ProceduralMaterial.create('to92packagefaces', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`取得預設腳面金屬factor；explicit `createMaterial({ metallic: 0 })`保留stored mask與既有texture清理方式。

`ftypefemalefaces`（F型母頭穿板接座正面示意）使目錄883→884種：2×2四個裸正面，依序為六平面鍍鎳金屬六角底座、同心凸圓肩、封閉無鍵槽的凸圓唇、淡色P.P.介電圓盤，以及更深的微小暗色不透明中央母入口。外部硬體M1；背底／P.P.／入口M0。作者正規化高度為背底.02 < 入口.06 < 六角底座.26 < 凸肩.36 < P.P..48 < 唇.66；入口是真正height凹陷，不是塗黑點，周圍P.P.保持連續。不同於ST，沒有開放鍵槽或卡口柱，也無公針或虛構的可見中央金屬接點環。

主要依據實際下載並raster實看的歷史[Amphenol Connex CAT-103 ©2001目錄，PDF第159頁／印刷第158頁](https://docs.rs-online.com/1ab7/A700000006717073.pdf#page=159)：222121 BULKHEAD ADAPTER JACK-TO-JACK照片、圖面及該型號Nickel／P.P.／75Ω表格。其他頁通用Delrin／Teflon說明不覆蓋此型號P.P.；不推定基底合金或精確接點材質。11 HEX與21.3 mm軸向總長僅是圖面參考，非量測正面幾何；墊圈／螺帽側面尺寸也非正面高度。原照片解析度不足以確定微小入口實際截面，這裡刻意簡化成圓形，是作者示意，非精確CAD。比例、色彩、roughness、AO、層高、預設0.04 m tile與0.0042 UV-relief factor皆作者設定；.0042不是公尺或校準深度。不畫螺紋螺旋／裝飾螺紋圈、墊圈齒、背部／線纜／PCB、真通孔、透明或新mesh；不作RF／75Ω、電氣、光學、插合或安全模擬／認證，歷史75Ω僅識別料號。不打包來源素材，擴充既有`pbr3d` gallery，不新增examples入口。

獨立46-field preset（44數值欄位及2色盤）使用10個C1 profiles：六個smooth六角半平面與四組平方半徑圓形profiles。巢狀凸組合角色替換及20組constructor快取C／H／R／AO差值避免非零hard min／max接縫。四組四欄Float64 pose128 B加96² Float64 grain73,728 B，共73,856 B typed-array payload，不含JS物件／closure開銷，非總RAM、FPS或效能改善宣稱。旋轉不變owner上界maxScale × nutInradius / (sqrt(3)/2) + jitter約.369958 < .5。constructor快取pose／grain，逐點無配置／迴圈／hash／trig／sqrt，略過零支撐與完整P.P.／入口／背底不需要的grain；保留owner索引前第二次fract以處理極小負UV。Default metallic1；explicit `createMaterial({ metallic: 0 })`僅改factor、不抹除硬體／非金屬stored mask。沿用opaque四maps、optional height、tint／repeats、同步／Worker／cache API與ownership：先移除借用材質再銷毀擁有textures的preset，並另行管理自有pool／cache。不增依賴或API；上述是來源／實作描述，不宣稱full-suite、runtime、browser或built-distribution驗證。

使用`await ProceduralMaterial.create('ftypefemalefaces', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`。建議512以呈現淡色圓盤與微小凹入口；32僅粗預覽，不保證入口可辨。Explicit `createMaterial({ metallic: 0 })`保留stored mask與既有texture ownership／清理方式。

`rcafemalefaces`（RCA／Cinch母座正面示意）使當時目錄增至879種：2×2四個寬圓形黑絕緣墊圈，各有較小圓金屬肩、再小一層的六平面前端筒鼻、暗色環形絕緣體與深圓腔；腔內為簡化的凹入導電母座環與暗色不透明底，不是公中心針。無BNC卡口凸耳，不把大型後側安裝螺帽放到正面。這是接頭家族變體，不是新的渲染或接頭模擬技術。

外觀依據已實讀／實看的原廠[REAN NYS367-0圖面](https://www.rean-connectors.com/media/14879/download/NYS367-0.pdf?v=1)（3.652.052，2020-11-13）與通用[NYS367產品PDF](https://www.rean-connectors.com/en/product/nys367-1.pdf)。圖面列墊圈Ø15.5、筒Ø8.3、前段7.5、M8×0.75及全長(29)；AF12是大型後螺帽，不是正面尺寸。圖內不一致的NYS373-x註記不構成新變體證據，產品PDF網址也不代表存在NYS367-1變體。產品照片顯示小型前端平面、較寬墊圈與後螺帽／焊片；PDF列外殼、螺帽、焊片、接點為黃銅／金、墊圈為PA+30%GF，不推定內絕緣樹脂。中性灰刻意省略真實金光學；形狀、位置、深度、顏色、粗糙度、0.04 m nominal tile與0.0042 UV relief皆作者近似，不是量測CAD、公差或隱藏剖面。

使用`await ProceduralMaterial.create('rcafemalefaces', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`。建議512辨識六平面前筒與凹入母座；32僅粗預覽。Default metallic1保留金屬／非金屬map；`createMaterial({ metallic: 0 })`只改factor、不改stored map。沿用opaque四maps、optional height、tint／repeats、同步／module Worker pool／cache及preset-owned texture生命週期：先移除借用材質再destroy preset，呼叫者自管pool／cache。獨立56-field preset／kernel組合六組徑向平方距離C1 profiles、三個smooth folded hex slabs與27組快取channel差值。四組四欄pose128B及96² Float64 grain73,728B，共73,856 typed-array payload bytes，非總RAM或FPS。逐點無配置／hash／trig／sqrt／逐邊迴圈；`Math.sqrt(3) / 2`只在construction時計算。Default metallic1保留金屬肩／筒／母座接點與非金屬墊圈／絕緣體／底；explicit0只改material factor、不改stored map。沿用opaque四maps、optional height、tint／repeats、同步／module Worker pool／cache與preset-owned texture清理，既有878種不變；不增依賴或API入口。建議512，32僅粗預覽，不保證小母座可辨。不含後螺帽／焊片／焊尾、實際螺紋或接點彈簧細縫、面板／PCB geometry、mesh、透明穿孔或碰撞，不提供電氣／音訊／RF／插合／EMC／安全模擬或認證。

`rj45femalefaces`（RJ45型8P8C母座正面示意）新增四個薄矩形金屬屏蔽框、霧黑絕緣內襯與低主腔；一側較窄的階梯卡扣延伸連通主腔，對側單排八個獨立長金屬接點，不是既有四接點矩形插座或USB-C雙排24接點舌片。實讀[TE 1734795-6產品頁](https://www.te.com/en/product-1734795-6.html)列8位置／8接點、無指示燈、黑PA9T GF30、鍍金／鎳磷青銅接點與鍍鎳黃銅殼；中性灰省略鍍金光學。階梯、接點佈局、尺寸、深度、顏色與粗糙度皆作者近似，不是精確CAD或原廠機械圖面重現。

使用`await ProceduralMaterial.create('rj45femalefaces', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`。建議512辨識階梯腔與八接點；32僅粗預覽，不保證每個接點可辨。Default metallic1保留屏蔽框／接點M1、絕緣內襯／低底M0；`createMaterial({ metallic: 0 })`只改factor、不改stored map。0.054 m nominal tile與0.0044 UV relief為作者近似，不是插合尺寸校準。沿用opaque四maps、optional height、tint／repeats、sync／native Worker pool／cache及preset-owned texture生命週期；銷毀preset前移除借用者，caller-owned pool／cache另由呼叫者管理，舊877種不變。無LED、插頭／線材、磁性元件、PCB／焊尾或面板EMI片；不模擬實體空腔mesh、Ethernet／PoE／Cat／速度／電氣／EMC／安全或認證。

`usbcfemalefaces`（USB-C母座正面示意）新增四個圓角扁平金屬口、低霧黑腔與中央薄絕緣舌，每面兩排各12個金屬接點（共24），不同於九組四接點`rectangularsocketfaces`。已實看的[GCT USB4050圖面](https://gct.co/files/drawings/usb4050.pdf)日期2016-04-21、revision C（2023-06-29），帶OBSOLETE戳記，不宣稱料號現行或認證。圖面只列黑色耐高溫塑膠，不推定樹脂；中性灰金屬省略實際鍍金光學。圓角扁口不是精確膠囊，省略側接地／卡扣、疊層殼與PCB尾端。

使用`await ProceduralMaterial.create('usbcfemalefaces', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`。建議512辨識兩排各12個接點；32僅粗預覽，不保證每個接點可辨。Default metallic1保留金屬口／接點M1與絕緣舌／低底M0；`createMaterial({ metallic: 0 })`只改factor，不改stored map。0.032 m tile與0.0045 UV relief為作者近似，不是插合尺寸校準；opaque height／normal不是實體空腔、CAD、電氣／USB速度／PD／安全模擬或認證。沿用既有四maps、optional height、tint／repeats、sync／native Worker／cache及preset-owned texture生命週期；backend限制仍見ACCEPTANCE，不新增認證。

`iecc6inlets`（IEC C6公入口正面示意）新增四片平坦黑PA6圓角矩形法蘭，各有一個上單瓣／下雙瓣的三葉形共腔、三個上單／下雙實心圓金屬腳端與左右兩個寬沉頭安裝孔；腳端高於腔底、低於法蘭，不套用C8凸護罩。原廠PDF本次403，實際下載、渲染並放大[RS代存的SCHURTER 2561原廠三頁PDF](https://docs.rs-online.com/a592/0900766b814421a9.pdf)第1頁照片／第2頁正面圖，讀取C6、black PA6及solid turned contacts；檔案日期為2015-04-22。正面是37×19 mm／R4法蘭、28 mm孔距、Ø3.2孔／Ø6.4沉頭，18 mm是側視深度，不誤作正面高度。法蘭、共腔、沉頭及孔內opaque低底共用PA6 albedo，凹凸由height／AO表達；僅三個簡化腳端M1，不推定合金或鍍層。省略同心接點基部、字樣、後端端子、腳長與接地先接順序；不是C5母孔、C14扁腳、實體通孔、市電模擬或IEC／安規認證。

使用`await ProceduralMaterial.create('iecc6inlets', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`。建議512辨識三葉共腔、三個圓腳端與雙沉頭；32僅粗預覽，不保證每個seed／作者變體都可解析所有subpixel腳端。五圖不透明，metal blue僅在腳端core為1、其餘為0，邊界C1且normal非平坦／Z正。Default metallic1；`createMaterial({ metallic: 0 })`只改呈現factor，不改寫metal blue或材料組成。0.1 m tile與0.0045 UV relief為作者近似，非插合尺寸、孔深、額定電壓或安規校準。沿用sync／native Worker／cache及preset-owned texture生命週期；實際backend驗證與限制見ACCEPTANCE，不外推其他瀏覽器或Canvas2D 3D。

`iecc8inlets`（IEC C8公入口正面示意）新增四片黑色PA6圓角矩形法蘭：外層凸起護罩為膠囊形，內腔兩端為半圓，中間以上下對稱圓角V形縮口形成八字形；各有兩個實心圓金屬插針端面，高於共同低底、低於護罩。實讀[SCHURTER2572產品頁](https://www.schurter.com/en/datasheet/2572)的C8、PA6及solid-contact說明；原站PDF／JPEG本次403，實際下載、渲染並放大[TME代存的2023原廠五頁PDF](https://www.tme.eu/Document/3aea005c480575d6ca262e097188b992/6160.0008.pdf)第1／3頁照片與正面圖。不是兩個相交圓孔，也不是C7母座、C14三片腳或有極性外形。法蘭、護罩、縮口及低底共用黑PA6 albedo，以height／AO表達凹凸；只有兩個簡化可見腳端M1，其餘M0，不推定金屬合金或鍍層。省略接點同心／齒狀基部細節、照片的小型成形凹部、標記及後端端子；不是實體通孔、市電模擬或IEC／安規認證。

使用`await ProceduralMaterial.create('iecc8inlets', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`。建議512辨識膠囊護罩、兩個圓腳與上下圓角V形縮口；32只作粗預覽，不保證所有seed／作者變體的subpixel腳端可辨。五圖不透明，metal blue僅在兩腳端為1、其餘為0並有C1邊界；normal維持非平坦／Z正。Default metallic1；`createMaterial({ metallic: 0 })`可改成dielectric呈現，但不改寫blue或材料組成。0.08 m tile及0.0045 UV relief是作者選定，不是C8插合尺寸、孔深、額定電壓或安規校準。沿用既有sync／native Worker／cache及preset-owned texture生命週期；實際backend驗證與限制見ACCEPTANCE，不擴大到其他瀏覽器或Canvas2D。

`din5femalefaces`（標準DIN五孔母座正面示意）新增四片黑色PBT圓角矩形法蘭，各有上中／下左／下右三個安裝孔、封閉凸圓口、上方鍵形缺口與下方連接肋的絕緣芯。五個中央膨大的長形凹入母孔，按上二／下二／底中配置在近似下半圓上；不是mini-DIN。實讀[Same Sky SDS-50J產品頁](https://www.sameskydevices.com/product/interconnect/connectors/din-connectors/sds-50j)的standard DIN、five contacts、180° family與Shielding No，並實看[對應照片](https://cdn.sameskydevices.com/products/image/getproductimage/1184?typecode=m&width=300)及六頁[原廠圖面](https://www.sameskydevices.com/product/resource/sds-j.pdf)第3頁下半SDS-50J圖／材料表，不混用上半SDS-40J。表列black PBT housing、copper/tin phosphor-bronze ground／terminals及PE cover；PE的plating/color欄為空，不把端子的鍍層套給塑膠。可見PBT共用albedo，凹凸陰影交給height／AO；未解析孔底是M0 opaque stand-in，不宣稱實際金屬接點是塑膠或整個接頭無金屬。省略下緣金屬件／細小外殼缺口、PCB／後端端子、內部接觸彈片、字樣與pin編號；不是透明真孔、MIDI／音訊／電氣模擬或標準認證。

使用`await ProceduralMaterial.create('din5femalefaces', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`。512適合辨識五個中央膨大長孔、上方缺口與下方肋；32僅粗預覽，兩種解析度的五圖皆不透明、metal blue全0且normal非平坦／Z正。Default metallic0；例如`createMaterial({ metallic: 0.63 })`只改factor，不重寫blue0、不假裝黑PBT導電。0.08 m nominal tile與0.0045 UV normal relief是作者近似，不是原廠孔位／孔深／鍍層或標準校準。沿用既有sync／native Worker／cache與preset-owned texture生命週期，不新增公開入口、runtime依賴或MIDI／電氣能力；以ACCEPTANCE記載的實際backend驗證為準。

`xlrfemalefaces`（XLR三孔母座正面示意）新增四片D尺寸圓角矩形金屬法蘭，各有真正的左上／右下兩個安裝孔、封閉凸圓口、黑色高絕緣芯、頂部釋放卡扣與內側金屬小片。內側薄金屬環在上方開口，三個凹入母孔為上二／下一配置。實讀[Neutrik NC3FD-LX原廠材料表](https://www.neutrik.com/en/product/nc3fd-lx)，並實看[對應原廠照片](https://www.neutrik.com/uploads/media/400x/00/540-nc3fd-lx.jpg?v=1-0)及[原廠圖面](https://www.neutrik.com/media/8412/download/nc3fd-lx-3.pdf?v=1)第1頁；區分front與rear view，不把另兩個圓形壓印當成通孔。D-size是安裝規格，不是D形正面輪廓。表列鍍鎳ZnAl4Cu1壓鑄殼、PA66 insert、鍍2μm Ag的CuSn6 contacts及鍍鎳Ck67 locking element；未據此推定PA66玻纖比例或小金屬片的接地功能。可見金屬共用中性灰albedo，凹凸陰影交給height／AO；省略文字、pin編號、後端焊杯、內部接觸籠與銀鍍層色譜。母孔M0低底是未解析內部的opaque stand-in，不宣稱真實接點是塑膠，也不是公針、透明真孔或音訊／電氣模擬。

使用`await ProceduralMaterial.create('xlrfemalefaces', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`。512適合辨識開口薄環、內側小片與三個母孔；32是粗預覽，兩種解析度都檢查近全金屬及polymer core，不能假定raster金屬面積比例不隨解析度變。Default metallic1保留可見金屬M1與黑芯／opaque低孔底M0，explicit0只改factor、不重寫圖。0.09 m nominal tile與0.0045 UV normal relief皆作者近似，不是加工尺寸、真實孔深、銀接點光譜或電氣認證。五圖alpha不透明，沿用既有sync／Worker／cache與preset-owned texture生命週期，無新增公開入口或runtime依賴。

`bncfemalefaces`（BNC母座配接正面示意）新增四個低圓形金屬法蘭，各有較高圓筒口、兩個對向且低於筒緣的卡榫、內側金屬壁與白色絕緣環。中央母接點簡化為金屬環與opaque低底，不是凸公針。實讀[TTI對應031-221-RFX資料](https://www.tti.com/content/ttiinc/en/apps/part-detail.html?partsNumber=031-221-RFX&mfgShortname=ACO)，並實看其連結的[Amphenol原圖](https://s3-us-west-2.amazonaws.com/catsy.582/C31-221-RFX.pdf)及[對應照片](https://s3.us-west-2.amazonaws.com/catsy.582/031-221-RFX_1.jpg)。取得的原圖檔只有一頁、圖框標sheet2/3，不冒稱完整三頁；註記確立鍍鎳壓鑄鋅body、鍍金磷青銅contact及natural Delrin絕緣體，不混用無RFX版或PTFE。整個鍍鎳body共用中性灰albedo，凹腔陰影交給height／AO；不重現鍍金色譜、接點開槽／彈片、背端螺紋、獨立螺帽／墊圈／焊片、字樣、實體穿孔或射頻／阻抗模擬。孔內M0低底是未解析內部的opaque stand-in，不宣稱原件孔底材質。

使用`await ProceduralMaterial.create('bncfemalefaces', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`。512適合辨識兩側卡榫、內壁與薄母接點環；32只是粗預覽。Default metallic1保留外部與接點金屬M1、白絕緣環及opaque低底M0；explicit0只改factor、不重寫圖。0.04 m nominal tile與0.0045 UV normal relief皆作者近似，不是製造尺寸、鍍層色譜、實際孔深或射頻認證。五圖alpha不透明，沿用既有sync／Worker／cache與preset-owned texture生命週期；沒有新增公開入口或runtime依賴。

`iecc14inlets`（IEC C14公入口正面示意）新增四個黑色非金屬長方形護罩：封閉凸緣內的低腔有兩個對稱上削角，以及上方居中一片、下方等高兩片的直立矩形金屬插腳端面；腳端高於腔底、仍低於保護凸緣。實讀[SCHURTER6100-4原廠頁](https://www.schurter.com/en/datasheet/6100-4)，並渲染實看[第三方代存的2017原廠PDF](https://eu.components-store.com/datasheets/86/6100.4225.pdf)第1／2頁：檔名雖為4225，內文是6100-4全系列，含6100.4215的1.5 mm snap-in／4.8×0.8 mm背端選項；正面三個實心腳端與背面帶孔quick-connect分開。另實看[對應料號代存照片](https://eu.components-store.com/thumb/product/59/6100.4215.jpg)。原廠只確立黑色thermoplastic外殼，未取得腳端合金／鍍層證據，不推定PA6、鍍錫或鍍鎳。護罩、腔底及背底M0，腳端M1；冷灰RGB ramp與高度皆作者近似，不複製照片陰影，不建C13母孔、背端孔、真幾何穿孔、螺絲耳片或市電／安規模擬。

使用`await ProceduralMaterial.create('iecc14inlets', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`。512適合辨識兩上削角、封閉護罩與三片實心腳端；32只作粗預覽。Default metallic1保留腳端M1與護罩／opaque低腔底M0；explicit0只改factor、不重寫圖。0.08 m nominal tile與0.0045 UV normal relief皆作者近似，不對應原件尺寸、插接行程或安規間距；五圖alpha不透明，不建真孔或傳輸／市電模擬。沿用既有sync／Worker／cache、UV repeats及borrowed texture ownership，省略背端帶孔端子、snap latch側壁細節、文字與螺絲耳片。

`dsubsocketfaces`（DE-9母座正面示意）新增四片金屬長方形法蘭，各有封閉凸起D形金屬框、黑色非金屬絕緣芯、上下5／4排共九個錯位圓形凹入插孔，以及兩端安裝開口與短圓領。實讀[NorComp171系列頁](https://www.norcomp.net/series/171)與[原廠female drawing／specification](https://content.norcomp.net/rohspdfs/Connectors/17Y/171/171-YYY-20YLYY1.pdf)，並渲染實看原PDF兩頁：第1頁列黑色PBT＋30%GF、鍍鎳／錫鋼殼、鍍金銅合金接點及009尺寸表；通用正面線圖本身為25位，不當成九孔實照。第2頁01為0.098in solder-side 4-40 clinch nut；選用同硬體版本171-009-203L011的[DigiKey代存雙視圖照片](https://mm.digikey.com/Volume0/opasdata/d220001/medias/images/938/171-009-203L011.jpg)確認下方對接正面五／四黑孔，未混用L001無硬體版本或上方背面金色焊杯。法蘭與D框M1，絕緣芯M0；安裝開口及未能辨識的插孔內部以不透明深色M0底示意，不推定藏內接點材質或捏造可見金色口沿。單一冷灰RGB ramp、尺寸與剖面均作者近似，不複製照片光照，不認證鍍層、thread、pinout、RS-232／電學或製造尺寸。

使用`await ProceduralMaterial.create('dsubsocketfaces', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`。512適合辨識D形凸框、錯位五／四排九孔與兩端開口；32只作粗預覽。Default metallic1保留法蘭與框M1、絕緣芯及不明孔內stand-in底M0；explicit0只改factor、不重寫圖。0.08 m nominal tile與0.0045 UV normal relief均作者選定，不對應原件尺寸、孔深或鍍層厚度。五圖均不透明，不建真孔或透射；省略數字、thread、背面焊杯、wiring及電氣協定，不把這個表面圖案當可連接元件。

`topadjusttrimmers`（上調式微調電位器頂面示意）新增四個非金屬矩形外殼，各有偏近一角的圓形金屬調整螺絲、單一全寬直線盲槽與兩片較高金屬唇。整個螺絲含槽底皆M1，外殼及背底M0，不畫通孔。實讀[TT Electronics 64W產品頁](https://www.ttelectronics.com/products/passive-components/trimmers/64w/)及其連結的[Model64原廠圖](https://www.ttelectronics.com/TTElectronics/media/ProductFiles/Datasheet/64.pdf)，並實際渲染檢視原PDF第2–5頁；第3頁明載64W／64Y的Metal Adjustment Screw，頂面6.35×4.19 mm為矩形，不因catalog的square分類改畫方形。連結的[Model64材質聲明](https://www.ttelectronics.com/TTElectronics/media/ProductFiles/Compliance/Model-64-Material-Declaration.pdf)列Housing PBT blend、Shaft Brass及exposed nickel；可見金屬調整螺絲的判定另由原廠機械圖直接確認，不把PTFE rotor畫成外露塑膠螺絲。原廠灰階側照不顯示頂面，單一中性灰RGB ramp為作者示意，不認證顏色、頭部合金、鍍層、尺寸、電阻、pinout或法規。省略接腳及字樣，不模擬調整動作或電路。

使用`await ProceduralMaterial.create('topadjusttrimmers', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`。512適合辨識矩形外殼、偏角小圓頭與單一直線盲槽；32只作粗預覽。Default metallic1保留螺絲及槽底M1、外殼與背底M0；explicit0只改factor、不重寫圖。0.02 m nominal tile與0.0045 UV normal relief均作者選定，不對應參考圖的真實尺寸或鍍層厚度。五圖均不透明，盲槽不切掉金屬mask；此為表面示意，不是可轉動元件、接腳配置或電學模型。

`crownprobetips`（四點皇冠探針金屬端面示意）新增九個圓形金屬探針端面，各有圍住較低中央throat的四個圓化凸接觸峰與四道低谷；整個端面含中央及低谷皆M1、外部背底M0，不畫通孔。實讀TME代存的[INGUN GKS-100-0038原廠規格](https://www.tme.eu/Document/e4740a4985139d06fa07bdd3136f6db8/INGUN_GKS-100-0038_EN.pdf)所列Style04四點皇冠／steel／gold finish，並實讀及渲染檢視鏡像站代存[原廠tip-style指南](https://globaltc.in/Catalogues/ingun_gks_overview_tip_styles.pdf)第1頁04圖；兩者是原廠 authored、非原廠host。金色單一RGB ramp、九片配置、圓化峰、杯面曲線與尺寸皆作者近似，不校準鍍層／合金／光學或加工剖面。不是十字驅動凹槽、外齒齒輪、城堡螺帽、03倒錐、06多齒、14自清潔或三／八點頭，也不模擬彈簧行程、電流／接觸電阻或測試治具；未收錄參考圖片。

使用`await ProceduralMaterial.create('crownprobetips', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`。512適合辨識每端面的四個凸峰、低谷與較低中央金屬杯，32只作粗預覽。Default metallic1保留完整端面M1及背底M0；explicit0只改factor、不重寫圖。0.008 m nominal tile與0.0035 UV normal relief均作者選定，不是原件tip直徑／鍍層厚度或電學模型。單一金色RGB ramp不認證光學／合金；中央及低谷仍是不透明金屬，不建幾何孔或彈簧。沿用既有同步／Worker／cache、height及destroy／borrowed ownership契約。

`piezodiaphragms`（金屬外板與陶瓷邊中央電極示意）新增四個圓形表面：平坦金屬外板托住稍高的象牙白陶瓷片，中央為接近陶瓷同高的單一平坦金屬電極。外露金屬邊與中央盤各M1，陶瓷露邊與背底M0，共8個M1區；白環表示電極未覆蓋的陶瓷邊，不是陶瓷通孔。實讀[Murata P15E-8手冊](https://www.murata.com/~/media/webrenewal/support/library/catalog/products/sound/p15e.ashx)，實看[原廠結構圖](https://pim.murata.com/asset/pim4/piezoelectricDiaphragm/E84G0210_GIF_PIEZOELECTRICDIAPHRAGM)標示的Metal(Brass)／Ceramic／Silver Electrode；中性灰至象牙白的單一RGB ramp、四片配置、尺寸及表面finish皆作者化，不認證實際合金／鍍層／化學或製造尺寸。不做分割回授電極、背面、喇叭錐、鏡片、真幾何孔、壓電振動或音訊／電路／聲學模擬；未收錄參考圖片。

使用`await ProceduralMaterial.create('piezodiaphragms', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`。512適合辨識分離的金屬外邊、陶瓷露邊與中央電極，32只作粗預覽；default metallic1保留M1金屬與M0陶瓷／背底，explicit0只改factor。0.06 m nominal tile及0.006 UV normal relief皆作者設定，不是實際料號／厚度或聲學參數。單一中性灰至象牙白ramp不獨立指定黃銅／銀／陶瓷RGB；整張不透明，無振動、真幾何孔或音訊能力。沿用既有同步／Worker／cache、height及destroy／borrowed ownership契約。

`castellatedboards`（PCB板邊開放半孔與金屬面焊盤示意）新增四塊作者化深綠方形板面，各有四排、每排七個通向板外的半圓凹口與分離淡銀色面焊盤，共112個M1區；mask板面、開口背底與板外皆M0。焊盤呈環抱開口的平坦半環，不是填滿的圓via、QFN平指接點或castle nut。Seed改整板位置／方向與微紋，不打亂排距。實讀[OSH Park Castellated Edges](https://docs.oshpark.com/tips+tricks/castellation/)，實看其[板界穿過圓via的設計圖](https://docs.oshpark.com/images/castellation/callout-in-design-tool.png)、[未修整成品照片](https://docs.oshpark.com/images/castellation/fabricated-pcb.jpg)，以及Adafruit的[俯視](https://cdn-shop.adafruit.com/970x728/2491-05.jpg)與[斜視](https://cdn-shop.adafruit.com/970x728/2491-03.jpg)照片；面焊盤／開口和厚度方向的plated barrel不可混成實心頂面圓片。配色、四邊七孔及尺寸是作者設定，不複製ESP模組／走線／marking、照片資產或製造缺陷，也不認證金屬鍍層、FR4組成、pinout、IPC、電熱性能或加工品質。

使用`await ProceduralMaterial.create('castellatedboards', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`。Default metallic1保留面焊盤M1與板面／開口背底M0；explicit metallic0只改factor、不重寫圖。512較適合辨識板邊開放半孔與半環land，32只作粗預覽。0.06 m tile、四邊七孔及0.006 UV normal relief是作者設定，不是實測PCB尺寸／鑽孔／pinout或電熱模型。整張仍不透明，開口只通往同一低背底，不建立幾何孔或完整鍍孔側壁。沿用tint／repeats、四maps／optional height、preset destroy及borrowed caller pool／cache的再用、clear與destroy；height map本身不啟用parallax。

`qfnlandpads`（QFN四邊平接點與中央裸焊盤示意）新增四塊深色霧面方形封裝底面，各有四排、每排七個等距銀色平接點及一個分開的中央裸焊盤，共116個M1區；塑膠與背底為M0。各接點及中央盤保持平坦、近乎共面，接點內端圓潤、外端平直，並非BGA圓頂、DIP外引腳或PCB散熱via。Seed只改整塊封裝的位置／方向與微紋，不打亂排距。實讀[TI SLUA271C](https://www.ti.com/lit/an/slua271c/slua271c.pdf)相關頁並實看第5頁Fig3-1封裝輪廓，另實讀[TI SLOA122](https://www.ti.com/lit/an/sloa122/sloa122.pdf)並實看第1頁封裝剖面與第2頁PCB圖；PCB熱via及stencil開窗不能移植到封裝底面。四邊七接點、配色與高度是作者設定，不是指定型號、pinout／pin1標記、中央盤必定接地、JEDEC／IPC、鍍層／合金或熱電／reflow認證，不複製圖像。

使用`await ProceduralMaterial.create('qfnlandpads', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`。Default metallic1保留平接點／中央盤M1與塑膠／背底M0；explicit metallic0只改factor、不重寫圖。512較適合辨識四排分離平接點，32只作粗預覽。0.02 m tile、每邊七接點及0.006 UV normal relief是作者設定，不是實測尺寸／引腳配置或電熱模型。既有tint／repeats、opaque四maps／optional height、preset destroy與borrowed caller pool／cache的再用、clear、destroy契約不變；不產生封裝mesh或自動parallax。

`radiolariandiscs`（放射蟲骨盤赤道剖面示意）新增四個象牙白礦質骨架：四道同心環包圍中央腔，三層環帶由內向外分成6／12／18格，每盤37個封閉暗腔，外緣另有六根平滑漸細短棘。骨架較高、亮且平滑，深色粗背底較低而遮蔽；seed改位置、方向、尺度及微紋。這是作者化的equatorial cutaway，不是外殼面上的porous sieve plates；也不是spiderweb貫穿中心的固定數放射絲、orbicularjasper／thomsonite平齊色帶或diatomvalves舟形細孔列。實讀[Haeckel Discoidea概述與Stylodictya條目](https://en.wikisource.org/wiki/Report_on_the_Radiolaria/Discoidea)及[Plate41圖說](https://en.wikisource.org/wiki/Report_on_the_Radiolaria/Plates5)，並實看Plate41；圖2／3／6／7明標rings alone／equatorial section，不能把完整篩板外觀誤當裸環肋。4環、6／12／18格及6短棘是作者簡化配置，不是特定物種、現代分類、完整細胞、量測顯微或矽質光學認證；不複製或打包圖像。

使用`await ProceduralMaterial.create('radiolariandiscs', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`。Default metallic0；explicit metallic1只改factor，不重寫M0圖。512較適合辨識分層腔室和短棘，32只作粗預覽。0.00024 m tile、顏色、格數及0.0022 UV normal relief是作者設定，不是生物尺度或顯微量測；整張仍不透明，暗腔不是實體通孔。既有tint／repeat、四maps／optional height、preset destroy及borrowed caller pool／cache的再用、clear、destroy契約不變，height map本身不啟用parallax。

`bgasolderballs`（完整BGA焊球矩陣）新增四塊隆起的深色方形非金屬載板，每塊完整排列13×13個等徑、等距銀色金屬圓頂，共676球；球心較高、亮、平滑，接觸帶較遮蔽。Seed改整塊載板的位置／方向及微紋，不擾亂製造格點。這是未裝配封裝底面的作者示意，不是dualinlinechips兩排外引腳、ballbearingfaces環形滾珠、ballchain連鏈或lensarray非金屬透鏡。實讀[TI SSZA002B PBGA文件](https://www.ti.com/lit/pdf/ssza002)第2頁的laminate／solder-ball構造及第5頁可完整覆蓋底面的array說明；實看[Pentium MMX BGA底面照片](https://commons.wikimedia.org/wiki/File:Kl_Intel_Pentium_MMX_embedded_BGA_Bottom.jpg)有綠載板、規則銀球及中央黑色無球區，不能當本完整矩陣的直接樣本。此處選深灰載板與完整方格，不複製照片資產，也不聲稱特定TI／Intel型號、pinout、JEDEC、錫合金、焊接／reflow／可靠度或電氣功能。沿用cachedNoise與單owner compact C1支撐：四組cached姿態共128B，加128² grain為131,200B retained typed storage，非總RAM或FPS。Default owner單軸上界0.34√2＋0.012＝0.492833＜0.5；球半徑0.0125小於pitch0.04的一半，最近row／column只查一球，不逐顆掃描。每軸owner floor只算一次，取樣無配置、hash、sqrt、trig或鄰居搜尋。成對signed half-plane乘積保留方板角的C1，球圓頂與接觸支撐在格點owner邊界前歸零；連續grain不跟格點owner跳色。Metallic圖為球1／基板與背底0，default factor1保留金屬區，explicit0只改factor。0.05 m nominal tile與0.012 UV relief為作者參數，不是公尺深度或尺寸校準。目錄862→863；four opaque maps／optional min–max height、tint／repeats、Worker／cache及caller所有權沿用，不新增真球mesh、underfill／routing／焊料流動、透明或其他browser／Canvas2D認證。

使用`await ProceduralMaterial.create('bgasolderballs', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；default metallic1保留球M1、基板／背底M0，explicit metallic0只改factor，不重寫圖。512較適合完整球陣與接觸帶，32只是粗預覽。0.05 m tile、13×13配置與normal relief是作者選定，不是實際pinout、焊球直徑／pitch量測、JEDEC、合金或reflow認證。沿用tint、repeat、four opaque maps／optional min–max height、preset destroy與caller-owned pool／cache借用、再用及清理；height map本身不啟用parallax，也不建立球體mesh。

`pigskinleather`（三孔群豬皮示意）新增暖褐、霧面皮革底上的64組三孔群：每組三個分開、稍不規則的圓潤毛孔排成小三角，孔心較低、暗、粗糙且遮蔽；位置、方向、群半徑、各孔尺寸與橢圓方向隨seed改變。三角的是孔群排列，不是單一三角形孔；也不是既有leather的Voronoi顆粒、ostrichleather單孔隆圈、cowhide毛皮色塊或perforatedleather等大單孔的人工錯列。實讀[Etherington／Roberts書籍保護字典的pigskin條目](https://cool.culturalheritage.org/don/dt/dt2578.html)、[Kawanishi Kaban的∴辨識段](https://shop.kawanishikaban.com/en/blogs/%E7%B4%A0%E6%9D%90%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6/material-pigskin)及[Leather Repair Company pigskin頁](https://prorestorers.co.uk/knowledgebase/pig-leather-skin/)；後者兩張300px近照已實看，但不拿低解析照片逐組認證三孔。孔群依字典的roughly triangular groups of three作者化，不聲稱天然皮料真偽、品種、鞣法、Nappa等級或毛孔密度校準。重用cachedNoise、compact C1 cavity與單owner tables慣例，以三個有界橢圓凹坑配連續雙尺度皮紋；不是新增通用皮革API。192孔×5個中心／quadratic係數與64²＋128² grain合計171,520B retained typed storage，不含JS物件／輸出圖或總RAM；取樣固定查三孔，無配置、hash、sqrt、trig或鄰居掃描。Default每軸support上界0.426782＜0.5，組內孔心距上界0.250337小於組間下界0.272686，避免owner截斷及孔群誤併。0.028 m nominal tile與relief0.0038 UV units皆為作者參數，不是物理孔深；全不透明非金屬，不重建穿透真皮的毛囊管、背面、皺摺網絡或透氣／透光性。

使用`await ProceduralMaterial.create('pigskinleather', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`，保留default metallic0；explicit metallic1只改factor，M0 map不會變成金屬。512較適合看分離三孔與細皮紋，32僅粗預覽。0.028 m tile、孔密度、色澤與normal relief是作者近似；不是皮料鑑定、透明孔、完整毛囊或American Pig／未鞣半透明rawhide的加工重建。沿用tint、repeat、four opaque maps／optional min–max height、preset destroy及caller-owned worker pool／cache的借用、重用與清理；height map不自行啟用parallax。

`trianglesocketheads`（TA 三角盲槽圓頭）新增25個銀灰色鋼製圓頭，每個有三條直邊的三角盲凹槽、稍圓滑的槽角與封閉平坦鋼底，周圍保留完整頭盤；粗灰底為非金屬。Seed改位置、方向、細紋與色調，不改頭盤尺寸；不是既有三條放射Y槽的tripointscrewheads、方孔、六角孔或曲邊TP3。外觀參考實讀的[Mingxing TA pan-head triangle-recess產品頁](http://www.mx-fastener.com/pan-head-triangle-shaped-recess-ta-screw.html)及實看兩張產品照片；該頁明確區分TA直邊與TP3，並列碳鋼／galvanized，這裡只作者化銀灰表面，不認證鋼種、鍍層化學、DIN／ISO尺寸、扭矩或防拆等級，也不複製照片資產。重用twopin／square／hex的既有shared sampler，只增加三個signed half-plane的平滑乘積而非paired abs或min交集；保留既有金屬槽底、圓肩及運算順序。Constructor的25×5 pose與128² grain共132,072B retained typed storage，非總RAM或FPS報告；新增取樣分支沒有配置、hash、sqrt、trig或鄰居搜尋。Owner bound為0.38＋√2×0.025＜0.5，槽外接半徑2×0.135＜fullRadius0.33。0.06 m nominal tile與relief0.03為作者參數，relief是UV單位，不是公尺或量測深度；不產生螺紋、真正通孔或pan-head mesh。

使用`await ProceduralMaterial.create('trianglesocketheads', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`，default metallic1使map中的鋼面／鋼底為金屬、灰底仍由M0 mask保持非金屬；explicit metallic0只是factor override，不改map。512較適合看三條直邊與封閉槽底，32只作粗預覽。0.06 m tile不是產品尺寸校準，height map亦不自行啟用parallax或挖出幾何孔。沿用tint、repeat、four opaque maps／optional min–max height、preset destroy及caller-owned worker pool／cache借用、重用與清理契約。

`diatomvalves`（舟形矽藻外殼面示意）以四個大小、位置及方向不同的象牙白披針形殼面，呈現兩側橫向striae中的縱向狹長lineolae、較寬且平齊的中央留白，以及中央中斷、末端向同側微彎的兩段raphe。長軸sternum略高，孔與細縫則低、暗、較粗糙而遮蔽；不是八片石鱉板、整圈守衛細胞或深槽狀內殼。形貌參考已實讀的[Diatoms of North America Navicula guide](https://diatoms.org/genera/navicula/guide)、[N. tripunctata描述及外／內SEM標註](https://diatoms.org/species/navicula_tripunctata/images)，並實看其external SEM2、internal SEM1作區分；另實讀[Yılmaz等人（2024）形貌段及Fig.3圖說](https://pmc.ncbi.nlm.nih.gov/articles/PMC11019260/)，實看A–D外殼與E–H內殼，不把內側深溝／helictoglossae搬到外面。這是Navicula式外殼的作者圖樣，不是特定物種、SEM金鍍層、活細胞或一整對frustule重建。0.00012 m tile、2²配置、象牙色與誇張的normal用relief0.0022均為作者參數，不作微米孔密度、殼厚或真實反射率校準。沿既有cached pose／C1 compact support／grain模式，以有界最近row／column查單一狹孔；constructor預算四pose、24筆row bounds與96² grain，保留typed storage為160＋768＋73,728＝74,656B，不含JS／輸出maps，亦不等於fps改善。Whole lineolae依各row的完整支撐排除中央區，避免逐pixel裁出破碎半孔；default半徑加jitter0.47070<0.5，row／column換界在孔外，採樣無配置、hash、sqrt、trig、鄰格或逐孔掃描。全opaque M0，孔下仍有實心襯底；不新增幾何、透明／透射、完整girdle／內殼、光子效應、運動或生物模型。

使用`await ProceduralMaterial.create('diatomvalves', { size: 512, seed: 7, heightMap: true })`再`createMaterial()`，保留非金屬default metallic0。512較適合看狹孔列與雙raphe，32只作粗預覽；0.00012 m tile與四組配置是作者示意，不是顯微尺度／物種孔密度校準，normal relief亦刻意誇張。既有tint、repeat、四opaque maps與optional min–max-normalized height契約不變，並不產生透明孔或矽藻mesh；沿用preset／material destroy及caller-owned worker pool／cache的借用、重用與清理規則。

`chitonshells`（石鱉八殼板覆瓦示意）新增九個長橢圓背面圖樣，每組八片隆起殼板（兩端帽片與六片中板）、七道帶方向性的非對稱接合肩，以及環繞殼底的深色粗糙外套膜帶。殼面沿覆瓦方向爬升，中線有圓滑低脊；接縫下面仍有較低、較暗且遮蔽的連續殼底，不是單一橢圓上刻七條對稱線。[UCMP Polyplacophora](https://ucmp.berkeley.edu/taxa/inverts/mollusca/polyplacophora.php)及已實看的Lined Chiton照片／anatomy圖提供八片背殼與girdle的參考；[Connors等人（2019）Fig.1a–b](https://pmc.ncbi.nlm.nih.gov/articles/PMC6904579/)的實際dorsal／side SEM分清八塊primary plates與周圍小鱗片。此處girdle只用fine grain，不重建該論文的數百片鱗片或μ-CT幾何。暖褐色盤、0.12 m tile與3²配置為作者選擇，不是灰階SEM色彩復原、特定物種或生物尺度校準。沿用compact squared ellipse肩與既有C1 corner-ramp概念，以rounded absolute彎接合線；一個owner、單一active course即可求值，沒有每pixel八片掃描。Constructor預算hash、旋轉／scale basis、各片tone及96² grain，retained typed storage為pose／tone864B＋grain73,728B＝74,592B，不含JS／輸出maps，也不當作fps提升。Default最大旋轉半徑加jitter0.47335<0.5；彎曲座標在尾帽可能超過最後interval，必須保留最後valve，不能讀下一owner的tone或undefined。Field hot path無配置、hash、sqrt或trig，肩與ramp維持C1。這是全不透明非金屬的二維浮雕示意，不建立隱藏重疊體積、八個可動mesh、捲曲動作、殼眼光學、透光／SSS、殼層／肌肉或生物力學模型。

使用`await ProceduralMaterial.create('chitonshells', { size: 512, seed: 7, heightMap: true })`再`createMaterial()`，保留非金屬default metallic0。512較適合看每組八片與細接合，32只作粗預覽；0.12 m tile與每tile九組是作者配置，不是生物尺寸／密度標定。既有tint、repeat、四opaque maps與optional min–max-normalized height契約不變；不會把貼圖轉成可關節活動的石鱉mesh。材質／preset destroy與caller擁有worker pool／cache的資源契約照舊，沒有捲曲、殼眼、透光或生物力學模式。

`leafstomata`（葉片氣孔守衛細胞示意）以25組大小、位置、方向與孔寬不同的腎形守衛細胞，圍住深色、低而遮蔽的不透明孔底。兩個較亮、較平滑的細胞隆起在長軸兩端以稍低、但仍高於葉面背景的接合區相連；不是無分界的整圈殼唇、帶齒的寶貝殼口或單顆咖啡豆刻痕。已實讀[Nadeau與Sack（2002）Stomatal Development in Arabidopsis](https://pmc.ncbi.nlm.nih.gov/articles/PMC3243354/)章節並實看Fig.1的TEM／cryo-SEM，以及[Jaafar與Anderson（2024）stomatal cell-wall review](https://pmc.ncbi.nlm.nih.gov/articles/PMC11232514/)和Fig.1示意圖：雙子葉腎形守衛細胞在兩極接合，與禾本科啞鈴形不同。這些是綜述／章節與其引述的顯微圖，不冒稱本引擎重做原始實驗。0.00025 m tile、5²排列與綠色盤是作者示意選擇，不是從灰階SEM量得的顏色、氣孔密度或特定物種重建。沿用既有compact squared shoulders與cached grain；內外橢圓肩、徑向隆起與兩端接合皆C1，孔內跳過不定的徑向座標。Constructor預算hash、旋轉／scale basis、inverse pore width及96² grain／12² skin noise；field hot path無配置、hash、sqrt或trig。Pose1,200B＋grain73,728B＋skin1,152B＝76,080B retained typed storage，不含JS容器與輸出maps，也不是fps提升證據。Default旋轉支撐加jitter保守半幅0.448<0.5，只需本owner。粗綠底僅抽象葉面，不重建pavement細胞拓樸、one-cell spacing發育規則、細胞器、真三維通氣孔、透光／SSS、動態開閉或蒸散／生物力學。

使用`await ProceduralMaterial.create('leafstomata', { size: 512, seed: 7, heightMap: true })`再`createMaterial()`，保留非金屬default metallic0。512較適合看成對腎形隆起、兩端接合與細孔，32僅粗預覽；0.00025 m是作者標稱tile，不是生物尺度校準。既有tint／repeat與四opaque maps、optional min–max-normalized height契約不變；height圖不建立真通孔或開閉動畫。維持既有材質／preset destroy與caller擁有worker pool／cache的資源契約，不把綠色示意背景當成完整葉表皮細胞圖譜。

`watermelontourmaline`（西瓜碧璽三角切片鑲板）新增16個分離的近似圓角三角拋光切片：粉紅核心、淺灰過渡帶與綠色外圈共用同一平面，放在較粗糙的暖灰背板上，不是果皮條紋、綠粉換色的立方fluorite或刻溝嵌線。[GIA Tourmaline Quality Factors](https://www.gia.edu/tourmaline-quality-factor)說明pink core／thin green skin與薄切片，已實看的典型標本照片提供分色參考；[GIA Micro-Features of Tourmaline（2024）](https://www.gia.edu/gems-gemology/summer-2024-micro-features-tourmaline)說明trigonal結構、triangular cross section與color zoning。0.08 m tile、4²配置與理想化三重對稱是作者選擇，不是標本／化學成分／尺寸重建。沿用fluorite／chiastolite的平面色帶原則與既有固定灰色neutral-pigment路徑；外形、核心與灰帶邊界都用三個compact circle的C1 products，沒有nearest-arc接縫或新公開幾何／色彩API。Constructor預算帶radius normalization的旋轉basis、core／pale inverse與平方值、hash、96² grain及8² cloud；field hot path無配置、hash、sqrt或trig，離開切片便不讀內層／grain。Pose1,152B＋grain73,728B＋cloud512B＝75,392B retained typed storage，不含JS容器／輸出maps、不冒稱fps提升。預設最大support0.34＋jitter0.07＝0.41<0.5 cell，只需本owner。這是正面不透明PBR色盤近似，不提供寶石透射／折射、多色性、貓眼／iris effect、內部包裹體光學、真切片mesh或寶石產地／品質認證；照片未複製為資源。

使用`await ProceduralMaterial.create('watermelontourmaline', { size: 512, seed: 7, heightMap: true })`再呼叫`createMaterial()`，保留非金屬default metallic0。512較適合分辨三角切片與細過渡帶，32只是粗預覽；0.08 m是作者標稱tile。核心／外圈遵循既有tint，中性mask保留既有固定灰色；三種分色共用拋光height／roughness，不把灰帶當凹溝。四opaque maps與optional height不會建立真寶石mesh或啟用透光／折射／pleochroism；需要parallax仍由消費者設定既有finish。移除消費者後destroy preset；借入pool／cache仍由caller持有與清理。

`cuttlebone`（烏賊骨層板波壁示意切面）以暖白、粗糙的非金屬薄壁／層板包圍深色、低而遮蔽的不透明底面。視覺依據是已實讀的[Yang等人2020年wall–septa研究與Fig.1](https://pmc.ncbi.nlm.nih.gov/articles/PMC7519314/)及其實際SEM／重建圖：烏賊骨是內殼，不是脊椎動物骨。作者0.0024 m nominal tile含六個不等高層區，每層24條錯位、彎向與幅度不同的五次波壁，以C1 product union併入層板；不是把`cardboardedge`的橫向連續中紙換成白色。這是二維示意切面，真正三維壁為含分叉的開放迷宮，144個二維視窗不代表144個封閉氣室或文獻93 vol%孔隙率。未重建micro-CT、三維波度梯度／成長方向、真幾何孔洞、透射／SSS、流體浮力、強度或生物尺度；標稱尺寸及曲線是作者選擇，不是量測複製。Constructor預算hash、layer bounds／inverse scales與96² grain；field hot path沒有陣列／物件配置、hash、sqrt或trig。壁／層界共2,456B加grain73,728B，retained typed storage76,184B，不包含JS容器與輸出maps，也不當作fps提升。預設column-support保守半幅0.45675<0.5、界面偏移0.12<0.5，故只需本column與最多一個相鄰row修正；平方局部tangent距離避免斜壁變細，row切換藏在平頂層板內。

使用`await ProceduralMaterial.create('cuttlebone', { size: 512, seed: 7, heightMap: true })`再呼叫`createMaterial()`，保留default metallic0；需要分辨層板／波壁時採512，32只是粗預覽。0.0024 m為作者標稱tile，repeat／tint仍用既有選項。四opaque maps與optional height表現低底與薄壁，不會建立真正開孔mesh、透明孔或啟用SSS／parallax；height仍須消費者明確啟用既有finish。移除消費者後destroy preset；借入WorkerPool／cache仍由caller持有與清理。

`pallasite`（拋光橄欖隕鐵）新增不透明切片近似：橄欖綠至蜜黃色非金屬晶粒包在連通銀灰金屬基質中，兩相近乎平齊，晶粒內有細暗、微凹而略粗的裂紋，不是凸石卵或灰色水泥填縫。[NASA Mittlefehldt／Rumble摘要](https://ntrs.nasa.gov/api/citations/20060020744/downloads/20060020744.pdf)實際說明magnesian olivine＋iron-nickel，[ASU Buseck Center](https://meteorites.asu.edu/stony-iron-meteorites/pallasites)說明greenish olivine；並實看[Esquel切片照片](https://commons.wikimedia.org/wiki/Special:FilePath/Esquel.jpg)的晶粒／反光金屬網，沒有複製影像。這是正面不透明PBR作者模型，不提供照片中的背光透射、折射、寶石品質、精確鐵鎳光學常數、蝕刻Widmanstätten結構或成因／成分認證。0.16 m tile以8² jittered periodic Voronoi晶粒、可變內縮與C1 half-plane products構成；私有`buildPeriodicVoronoiPlanes`直接抽用原`septarian`裁剪，原inline副本刪除，沒有新公開幾何API。Constructor才做clip／hash／sqrt／trig，pixel僅查3²局部owner候選與存活facet，不配置陣列／物件或重建polygon；晶粒support互斥，找到正support即可停。三seed實量每圖384個unit-plane triplets、每晶粒4–8 facets／平均6；含96²grain的retained typed storage88,064B，constructor共用scratch1,608B，不含JS容器／輸出maps，不是FPS。Seed改晶粒位置、大小、色調與裂紋；晶粒M0、連通基質M1，使用既有neutral-matrix pigment路徑；預設factor1，明確override0可全部非金屬化。保留四opaque maps、optional height、tint／repeats、sync／Worker／cache及ownership；不新增依賴、入口或mesh，也不擴大Canvas2D／跨瀏覽器認證。

使用`await ProceduralMaterial.create('pallasite', { size: 512, seed: 7, heightMap: true })`，再以`createMaterial()`保留default metallic1的晶粒／鐵鎳基質mask；`{ metallic: 0 }`會把整體變為非金屬。Tint只作用於有色礦物，基質保留既有中性灰路徑；0.16 m tile、四opaque maps與optional height照舊。這是拋光平面與細裂紋的正面不透明近似，沒有背光透光；32為粗預覽，不用來逐粒計64。移除消費者後再destroy preset；借入Worker pool與cache仍由呼叫者管理／清理。

`gosperinlay`（三階Gosper黃銅嵌線）在粗糙海軍藍非金屬底面上新增一條略凸、較光滑的黃銅色金屬線。依已實讀的[Gosper curve](https://en.wikipedia.org/wiki/Gosper_curve)及其原始wikitext的60°、axiom A、兩個A／B production，離線三次展開為343個等長連結、344個不同三角晶格頂點，只有兩個端點，不閉合、不分岔；這是有限三階圖樣，不是極限空間填充集合或Gosper island的平面鑲嵌。不同於`moorecurve`的64格正交封閉凹槽、`boullebrassinlay`的S形植物卷紋與`kintsugiceramic`的裂縫網。0.5 m tile的preset保存343字元方向word；constructor只建4值線段與16²局部bbox索引，pixel不解L-system、不配置物件／陣列、不作全343線段掃描或sqrt／trig／hash。重用`vogelspiral`的prefix-end原地填表，以及`fiddleheads`的product-union rounded joins；801 references、257 offsets、max11／全tile各bin mean3.12890625候選，含96² Float64 grain共86,820B typed storage，不含JS string／物件／輸出maps，不是FPS量測。Squared capsule距離與C1 cubic shoulder相乘聯集保留圓帽與平core。Seed只改grain finish，不移動路徑或metal mask；線M1、底M0，default material metallic1才保留mask，explicit0可整體非金屬化。四張不透明PBR maps、optional height與既有tint／repeats／sync／Worker／cache及ownership維持；不新增入口、依賴、mesh或alloy／導電／製造模擬，也不以Canvas2D或未測瀏覽器認證。

使用`await ProceduralMaterial.create('gosperinlay', { size: 512, seed: 7, heightMap: true })`取得三階Gosper黃銅嵌線，再由`createMaterial()`保留預設metallic1和逐像素金屬／非金屬mask；若傳`{ metallic: 0 }`會刻意把整張改為非金屬。四張不透明PBR maps、optional height與0.5 m tile維持現有tint／repeats、sync／borrowed Worker／cache及destroy契約。32只作低解析預覽，343個連結與兩端點的完整外觀請用512；有限曲線不是實體嵌線mesh或極限填充集合。

`vogelspiral`（97圓片黃金角葉序鑲板）將97個等大、平頂圓肩釉面圓片按黃金角放在粗灰底上，深青／鼠尾草／象牙三色族各33／32／32片。已實讀[Fermat’s spiral的Vogel葉序段](https://en.wikipedia.org/wiki/Fermat%27s_spiral#The_golden_ratio_and_the_golden_angle)：原式r=c√n、θ=n×137.508°；本作者明確改為r=0.044√(n+0.5)、θ=nπ(3−√5)，n=0–96，以半步徑向偏移避開中央擁擠，不宣稱是原式n=0的中心點。這是離散等大圓片，不是連續螺旋線、半徑遞增相切的Doyle圖樣、植物模擬或Fibonacci條數認證。0.5 m名義tile，UV圓半徑0.033（名義16.5 mm）；最小圓心距0.06802551、大於直徑0.066，外包圓半徑0.46523142，均留灰縫與外框，不作施工認證。平方半徑斜肩保持C1，seed只變tone／grain。沿用預算化鄰片查詢方式，8×8空間CSR表224個references、每bucket最多8／平均3.5個候選，不逐點掃97圓。固定Float64資料291＋96²個、Uint16 offsets65＋references224，共76,634 B typed儲存（不含JS物件／輸出maps）；constructor才算trig／sqrt／hash，逐點無配置。略過通用detail；不透明M0、四maps＋可選height、periodic signed-UV與既有所有權不變。

使用 `await ProceduralMaterial.create('vogelspiral', {size:512,seed:7,heightMap:true})`。512能分97圓片；32僅保留粗點狀圖與maps，小球亦不能逐片計數或認證植物葉序。97／半步偏移為內部作者設定，非新公開模擬選項。預設metallic factor0，明確override不改maps；先移除消費者再destroy preset，借入pool／cache仍由呼叫者管理。

`langtonsant`（蘭頓蟻1024步快照棋磚）把122個深色亮面邏輯黑格置於32×32淺暖色粗釉格板，奶油色凸三角標出終點與朝向。採實讀[MathWorld Langton’s Ant](https://mathworld.wolfram.com/LangtonsAnt.html)的白格左轉90°／黑格右轉90°、翻色再前進一格約定；它與常見鏡射慣例不可混用。本作者從(16,16)朝上、全白無限平面離線前進1024步，終點(8,8)朝下，122黑格、226曾訪格；全軌跡x=5–24／y=6–22，未碰32格邊界。只存32個row位元數及終點方向向量，不在runtime跑模擬、不複製來源圖像。0.32 m名義tile、0.01 m格距；圓肩方格與三條半平面相乘的三角指標保持C1，邏輯白格呈淡暖色而非純白。不是QR碼、可互動自動機或104步highway／無限演化證明。每sampler只新增96² Float64 grain（73,728 B typed-array儲存，不含JS資料與輸出maps），bitmap查詢O(1)、逐點無配置／重算hash，略過通用detail。維持不透明非金屬M0、四maps＋可選height、periodic signed-UV與既有所有權。

使用 `await ProceduralMaterial.create('langtonsant', {size:512,seed:7,heightMap:true})`。1024步與起點是作者圖樣定義，不是新增公開step選項。512可讀指標朝向與格狀態；32只保留一像素格心資料，不能直接辨三角形方向，小球也不能認證演化。預設metallic factor0，明確override不改maps。先移除消費者再destroy preset；借入pool／cache仍由呼叫者管理。

`pentominotiles`（十二種自由五連方拼磚）將每塊由五個等大邊連通方格構成、旋轉／鏡射視為同形的12種自由五連方，各放一次於作者6×10格矩形，再5×3重複成30×30格、180塊釉面拼磚。已讀[Pentomino](https://en.wikipedia.org/wiki/Pentomino)的定義、12種自由形／63種固定取向與6×10拼合說明；佈局由離線exact-cover求得並逐格確認，不複製圖片、不是正五邊形鋪磚。A–L只是私有作者ID，不是慣用字母名稱。海軍藍／灰藍／象牙三色族各60塊，粗灰縫；0.6 m名義tile，900個等大格的名義邊長0.02 m。相鄰格的平滑權重按整塊ID合併，消除同塊內部格線；不同ID的平手落在平灰縫內，凹角與四格交會保持C1圓肩。這是加權圓角作者圖樣，不是等距幾何offset、施工規格或互動拼圖／通用求解器。初始化只有900個Uint16 owner、180個Float64 tone與96² Float64 grain，共76,968 B固定typed-array儲存（不含JS物件／暫存與輸出maps），逐點無配置、不重建hash／解題；略過通用detail。維持不透明M0、四maps＋可選height、periodic signed-UV及既有所有權。

使用 `await ProceduralMaterial.create('pentominotiles', {size:512,seed:7,heightMap:true})`。512可分辨180塊與12形；32只有較粗色塊／maps，圖鑑小球亦不能逐塊計數。Seed只變釉色與微grain，不重排拼圖。預設metallic factor 0，明確override不改maps；先移除消費者再destroy preset，借入pool／cache仍由呼叫者管理。正式dist已在嚴格CSP下實跑同步／原生module Worker／cache，五個512 maps各1,048,576 B逐byte相同，repeat=3五槽UV一致，清理成功；只記錄本機Chrome的WebGPU／WebGL2，未新增Canvas2D或跨瀏覽器認證。

`pythagorastree`（有限畢氏樹釉面方磚）新增每棵31個分枝方形的四代圖樣（根＋四代，1／2／4／8／16片）：深赤褐樹幹逐代變淡至象牙色小方片，置於粗糙灰縫上。不同於既有`pythagoreantiles`的2:1雙尺寸、每tile五大五小的平面鋪滿。[Wikipedia Pythagoras tree](<https://en.wikipedia.org/wiki/Pythagoras_tree_(fractal)>)與[MathWorld](https://mathworld.wolfram.com/PythagorasTree.html)描述在朝外邊的等腰直角三角形兩腿上立子方形，子邊長為母邊長的√2/2、兩子名義面積合為母面積；一般無限樹可能重疊，不能把帶重數面積當union面積。本作者有限31方形以精確dyadic座標SAT確認沒有內部重疊、46對名義角／邊接觸，各代總名義面積皆等於根；有限bounds為4.5L×3.25L，不引用無限樹的6L×4L來冒稱本圖樣尺寸。4個週期motif、scale0.2／centerY1.625、grout0.002／shoulder0.003、roughness0.3／UV relief0.012、色盤100,32,30／240,221,180及tile0.4 m皆為作者設定。31×7幾何值＋124 tone＋96² grain共76,456 B Float64 tables，另有JS scalar與初始化遞迴，非總RAM。逐點只查單owner的31片，平方包圍半徑早拒絕，再乘兩軸平方C1 profile，無逐點配置／hash／trig／sqrt或鄰owner掃描；空灰縫略過grain、generic detail略過。四張opaque dielectric map、M0、optional height與既有factory／Worker／cache／ownership不變；不是無限碎形、真樹、完整mesh、分形維數或磁磚／結構／施工認證。

使用 `await ProceduralMaterial.create('pythagorastree', {size:512,seed:7,heightMap:true})`。tile名義0.4 m（2×2個0.2 m motif）；depth4為內部作者設定，不是新增公開遞迴選項。512可辨31方片；32只能看大枝與色塊，不可認證五代、分枝圖或46個名義接觸；球體小圖亦不可逐片計數。Seed只變finish，不移動／重排樹形。預設metallic factor 0，明確override不改maps；移除使用者後destroy preset，借入pool／cache仍由呼叫者管理。

`ichinghexagrams`（六十四卦浮雕爻紋）新增8×8個六行符號：深炭綠平頂圓肩爻線立於奶油色粗底，陽爻連通、陰爻左右等分且中央留空；全圖192陽爻＋192陰爻，共576個分離長條。已讀[Hexagram (I Ching)](<https://en.wikipedia.org/wiki/Hexagram_(I_Ching)>)的六條堆疊線、陽實陰斷、自下而上數爻及多種卦序說明。本preset用作者自定0–63 row-major二進位排列，最低bit在最下爻；不是文王卦序、Unicode碼位順序或伏羲圖式認證。不同於sevensegment的數字、EAN-13碼條、點字圓頂或Rule30演化格。line pitch0.1、halfWidth0.36／halfGap0.08／halfHeight0.032、shoulder0.012、roughness0.3、UV relief0.003、色盤28,34,30／226,216,178及tile0.32 m（8×8個名義0.04 m glyph cell）都是作者設定。64 tone與96² grain共74,240 B Float64 tables，另有JS scalar／初始化暫存，非總RAM。每點僅選單glyph最近一行，快取平方半徑與inverse bands的分離C1 profile相乘，沒有逐點配置／hash／trig／sqrt或鄰字掃描；generic detail略過。四張opaque dielectric map、M0／mortar0、optional height與既有factory／Worker／cache／ownership不變；不是書法字型、可操作文字、透明孔、mesh、占卜或歷史／文化認證。

使用 `await ProceduralMaterial.create('ichinghexagrams', {size:512,seed:7,heightMap:true})`。tile名義0.32 m；逐列向右、向下的cell index＝8×row＋col，bit0在最下爻，0全陰、63全陽；不要把index當文王卦號。Seed只變finish，不重排或改變符號。512用於辨識完整爻線，32只能看部分爻紋；在球體的展示尺度也不可逐卦解碼。預設metallic factor 0，明確override不改maps；移除使用者後destroy preset，借入pool／cache仍由呼叫者管理。

`apollonianmosaic`（Apollonian相切圓馬賽克）新增有限兩輪Descartes反射的圓形釉面鑲嵌：深青綠、鼠尾草與象牙圓盤逐層填入三個等大圓的相切空隙，四個週期圖樣各19圓。不同於`pennyround`的等大交錯圓磚、`circularpavers`的同心扇形鋪面或方孔`Sierpinski`圖樣。[Apollonian gasket](https://en.wikipedia.org/wiki/Apollonian_gasket)提供相切圓遞迴；[Descartes's theorem](https://en.wikipedia.org/wiki/Descartes%27s_theorem)提供帶號曲率與複數圓心方程。作者由二次式兩根導出b′＝2Σ其他b−b、(bz)′＝2Σ其他bz−bz，使用負曲率包圍圓與三個等大初始圓；相鄰反射禁止立即回頭，遞迴後還原quad，不配置每分支quad副本。R0.47、初始半徑R(2√3−3)、2×2圖樣、depth2、grout0.0015／shoulder0.003、roughness0.3／relief0.012、色盤28,68,62／236,218,170與tile0.24 m是作者設定；負曲率外圓不畫成磚。19圓×4個幾何值＋76 tone＋96² grain共74,944 B Float64 tables，另有3個JS tone數字及初始化暫存，非總RAM。取樣只讀單owner的19個圓，以預算平方半徑及肩寬倒數作C1斜邊，無逐點配置、hash、trig或sqrt；空灰縫略過grain，generic detail略過。不透明非金屬四maps、optional height與既有Worker／cache／ownership不變；這是有限圖樣與平坦倒角圓片，不是無限碎形、圓頂mesh、透明、數學分形維數或實際馬賽克施工認證。

使用 `await ProceduralMaterial.create('apollonianmosaic', {size:512,seed:7,heightMap:true})`。一個tile名義0.24 m（2×2個0.12 m motif）；預設depth為內部固定兩輪，不是新增公開選項。512可辨三大圓與兩輪小圓，32不能保證小圓圖或全部相切關係；不用低解析map宣稱數學圖樣完整。預設metallic factor 0，可明確override而不改maps；移除使用者後destroy preset，借入Worker pool與cache仍由呼叫者管理。

`prismaticpentagonaltiles`（稜柱房形五角磁磚）新增V3.3.3.4.4對偶鑲嵌：藍灰、灰綠與象牙三色的上下交錯房形磚，有相鄰的兩個90°底角與三個120°屋頂角，不同於`cairotiles`的分隔直角、`floretpentagonaltiles`的六瓣60°尖角或`elongatedtriangulartiles`的正方／三角面。[Wikipedia Elongated triangular tiling的Prismatic pentagonal tiling段落](https://en.wikipedia.org/wiki/Elongated_triangular_tiling#Prismatic_pentagonal_tiling)提供對偶關係、三120°加二90°、cmm對稱與平行線平分拉長六角形的描述；沒有座標。作者取單位正多邊形中心連成(−1/2,−1/2)、(1/2,−1/2)、(1/2,√3/6)、(0,√3/3)、(−1/2,√3/6)房形，內切圓0.5，底邊1、側邊(3+√3)/6、屋頂邊1/√3，四個上下交錯房形組成1×(2+√3)單元，15×4單元共240面。8個位置、10個法線、240個色調與96² grain共75,792 B Float64 tables，另有三個JS tone數字，非總RAM；取樣以3×3週期owner與平方半徑0.5早拒絕，無逐點配置、hash、trig或sqrt，略過generic detail。30,58,76／224,236,222色盤、roughness0.3、relief0.012、grout0.025、shoulder0.018及tile0.6 m都是作者設定，不含真實磁磚尺寸、釉料或施工認證；不透明非金屬maps、optional height與既有Worker／cache／ownership維持不變。

使用 `await ProceduralMaterial.create('prismaticpentagonaltiles', {size:512,seed:7,heightMap:true})`。一個tile名義0.6 m（15欄、作者單位邊長0.04 m；與正方形UV的幾何比例差約0.5%）。512可解析房形底部直角、屋頂斜縫與bevel normals，32只保留色塊，窄縫與法線斜面未解析。預設metallic factor 0，可明確override而不重寫maps；移除使用者後destroy preset，借入Worker pool與cache由呼叫者管理。

`floretpentagonaltiles`（花形五角磁磚）新增V3.3.3.3.6手性對偶鑲嵌：森林綠、橄欖與象牙釉面五角磚，每六瓣繞一點形成花形，五個內角為60°與四個120°，兩長邊為三短邊的兩倍。不同於`cairotiles`的直角五邊形、`deltoidaltrihexagonaltiles`的四角鳶形或`snubtrihexagonaltiles`的三角／六角面。[Wikipedia Snub trihexagonal tiling的6-fold pentille段落](https://en.wikipedia.org/wiki/Snub_trihexagonal_tiling#Floret_pentagonal_tiling)提供六瓣、內角、手性、p6與對偶關係；座標與邊比為作者從相鄰正多邊形中心推導。基礎五邊形為(0,0)、(3/7,−√3/21)、(4/7,√3/21)、(1/2,√3/6)、(2/7,4√3/21)，旋轉六次、置於7×8三角點陣；內切圓半徑1/(2√7)。90個edge-plane、336個seeded tone與96² grain共77,136 B Float64 tables，另有三個JS tone數字及初始化頂點，不是總RAM。逐點3×3 owner搜尋以半徑√(1/3)剔除，無配置、hash、trig或平方根；略過通用detail。36,66,42／236,218,150色盤、roughness 0.3、relief 0.012、灰縫0.012、肩寬0.008及tile 0.84 m為作者設定；不透明非金屬四maps、可選height與既有Worker／cache／ownership不變，不含真實磁磚尺寸、釉料或施工認證。

使用 `await ProceduralMaterial.create('floretpentagonaltiles', {size:512,seed:7,heightMap:true})`。名義tile 0.84 m（七欄、作者間距0.12 m；UV與正方形的幾何比例差約1%），512可解析五角磚縫與斜邊法線，32只有花瓣色塊。預設metallic factor 0，可明確override而不重寫maps；先移除使用者再destroy preset，借入的Worker pool與cache由呼叫者清理。

`snubtrihexagonaltiles`（扭稜三六角磁磚）新增3.3.3.3.6手性鑲嵌：靛藍正六角形、象牙側三角形與棕黃中央三角形置於粗糙灰縫，四個正三角形與一個正六角形在每個頂點相遇。不同於`trihexagonaltiles`的3.6.3.6及`snubsquaretiles`的三角形與正方形。[Wikipedia Snub trihexagonal tiling](https://en.wikipedia.org/wiki/Snub_trihexagonal_tiling)提供頂點配置、snub operation、缺少鏡射對稱與floret pentagonal對偶；讀取的文字沒有座標，因此單位三角點陣上的邊長1/√7、轉角atan(√3/5)、7×8個點與選定手性皆為作者建構。初始化列舉相鄰六角頂點的等邊三角形，每格一六角與八三角；198個面幾何、504個色調與96² grain合計79,344 B Float64 tables，另有9個JS色調數字及初始化暫存，非總RAM。取樣查詢週期3×3點陣與預算edge normals，無逐點配置、hash、trig或平方根，通用detail略過。色盤24,60,86／244,226,170、roughness 0.3、relief 0.012、灰縫0.012與肩寬0.008均為作者近似；四張不透明非金屬map、metallic 0、可選height與既有Worker／cache／ownership不變，沒有實際磁磚、釉料或施工規格認證。

使用root factory `await ProceduralMaterial.create('snubtrihexagonaltiles', {size:512,seed:7,heightMap:true})`；一個tile名義0.84 m（七欄、作者間距0.12 m），512可解析灰縫與斜邊法線，32只能保留色塊、不能解析窄縫。預設metallic factor 0，可明確override而不改寫maps；先移除使用者再destroy preset，借入的Worker pool與cache由呼叫者管理。

`deltoidaltrihexagonaltiles`（鳶形三六角磁磚）新增作者鳶形三六角（V3.4.6.4）鑲嵌：三角點陣上每個點最近的六角胞被六條通向邊中點的輻條切成六塊鳶形，繞每個點的鳶形依序採用勃艮第紅、玫瑰與象牙釉色，所以每個點陣三角形的三塊鳶形也彼此不同；鳶形磚為斜面釉面，嵌在較粗糙的灰縫中，所有直邊落在相隔30°的六組平行線上。它不是`kisrhombilletiles`（30-60-90三角形，V4.6.12）、`trihexagonaltiles`（六邊形與三角形，3.6.3.6）、`rhombille`（每個六角三塊菱形）、其對偶`rhombitrihexagonaltiles`（3.4.6.4）或其他既有磁磚preset，且以3.4.6.4對偶、deltoidal、tetrakis／triakis／floret與prismatic pentagonal搜尋README／PLAN／DESIGN／CURRENT及preset目錄，只有`kisrhombilletiles`條目把此鑲嵌列為相關鑲嵌，沒有preset實作它。實際讀取的Wikipedia Rhombitrihexagonal tiling頁面的鳶形三六角段落（Deltoidal trihexagonal tiling重新導向到此）提供：面為鳶形、類型為對偶半正（面傳遞）鑲嵌、面配置V3.4.6.4、對稱群p6m [6,3]（*632）與旋轉群p6、對偶為菱形三六角鑲嵌、Conway稱tetrille、與三六角鑲嵌的關係是把三角形與六邊形分成中央三角形並把相鄰三角形合併成鳶形，以及面傳遞的變形（p31m）。取得的文字沒有座標、角度或邊長，所以邊長1的三角點陣建構（邊心距0.5的六角胞由通過邊中點的輻條切開，使點陣點度數為6、邊中點度數為4、點陣三角形中心度數為3）、由這些頂點度數得出的鳶形角度60°、90°、120°、90°（360°除以度數）與長短邊比√3，以及其他所有數值都是作者設定：色調0.1、0.48、0.82再加每塊至多0.12、102,34,44 / 238,228,204色盤、釉面粗糙度0.3對灰縫0.92、relief 0.012、以點陣單位的灰縫半寬0.014與斜面肩寬0.01，以及每個0.84 m UV tile含7×8點陣（7欄與4個列對，與正方形差1%，採作者設定的0.12 m點陣間距）；不主張真實磁磚尺寸、釉料或施工規格，也不複製或打包圖片。獨立kernel存336個逐鳶形色調、14個輻條分量與96² grain，共76,528 B tables，非總RAM；每點檢視九個點陣候選與最近者的六塊鳶形，所以每點無平方根、trig、hash或配置，通用detail略過，mortar即灰縫。Seed只改變逐鳶形色調與顆粒，幾何保持固定；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明或位移。

使用root factory `await ProceduralMaterial.create('deltoidaltrihexagonaltiles', {size:512,seed:7,heightMap:true})`；預設material factor為0，`preset.createMaterial({metallic:1})`明確override，不改寫非金屬maps。Seed只改變逐鳶形色調與顆粒；一個UV tile代表0.84 m（七欄、每欄0.12 m點陣間距），512 maps每塊鳶形約寬30 px（長邊約37 px）並解析灰縫與斜面法線，32則保留點陣與鳶形色調但灰縫窄於一個像素（0.21875的灰縫比例是像素混疊），所以斜面不解析。先移除consumers再destroy preset與其擁有的textures；呼叫端擁有的Worker pool與cache仍由呼叫端管理。

`soroban`（算盤）新增作者算盤磁磚：日本算盤的七棒區段，雙錐木珠位在七根類竹棒上，上下各一條框條、中間一條隔條，木珠顯示4567890，隔條上每第三根棒有一個點。它不是`seedbeads`（散落的種子珠）或其他既有preset，且以abacus、soroban、suanpan／reckoning與bicone／biconical搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何算盤preset。實際讀取的Wikipedia Soroban頁面提供結構：棒數為奇數且不少於七根（標準型十三根）、每根棒在隔條上方有一個五珠（go-dama）、下方有四個一珠（ichi-dama）、雙五進制編碼十進位（往隔條移動的木珠為有效，五珠向下、一珠向上）、每第三根的單位棒點、木珠通常為雙錐（biconal）木質、棒為木、金屬、藤或竹，以及其現代算盤圖說右側顯示1234567890、下方為一、上方為五。頁面沒有尺寸、木珠比例、顏色或框架配置，所以取自圖說末七位的4567890七棒區段、自右數第一、第四與第七根棒的點、以棒距為單位的框條0.52與隔條0.5厚、木珠槽0.78且木珠寬0.9高0.78（帶圓角赤道稜脊的雙錐輪廓，高度由邊緣0.7升至中心1.0 relief單位）、棒寬0.1、點半徑0.11、48,28,18 / 228,198,142色盤、色調（底板0.6 + 0.08×顆粒、木珠0.3–0.4、框條0.1、隔條0.16、棒0.88、點0.95）、粗糙度底板0.8與木珠0.45、relief 0.03與木珠邊緣柔度0.08皆為作者近似；不主張真實算盤尺寸、材料或教學正確性，不繪製框架側邊所以tile可重複成更長的算盤區段，也不複製或打包圖片。一個UV tile代表0.056 m（七根棒、作者設定的8 mm棒距）。獨立kernel存七個數字與128²木紋grain，共約131,128 B tables（7個Float64與16,384個Float64 grain），非總RAM；每點只處理所在的那根棒與那個木珠槽，最多七個平滑ramp，所以每點無hypot、平方根、trig、hash或配置，通用detail略過，mortar保持0。Seed只改變木紋顆粒，木珠保持固定；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明或位移。

使用root factory `await ProceduralMaterial.create('soroban', {size:512,seed:7,heightMap:true})`；預設material factor為0，`preset.createMaterial({metallic:1})`明確override，不改寫非金屬maps。Seed只改變木紋顆粒，木珠保持固定；一個UV tile代表0.056 m（七根棒），512 maps每顆木珠約66×57 px並解析雙錐刻面法線，32則木珠約寬4 px，數字仍可辨讀但不解析刻面。先移除consumers再destroy preset與其擁有的textures；呼叫端擁有的Worker pool與cache仍由呼叫端管理。

`ean13label`（EAN-13條碼標籤）新增作者EAN-13條碼標籤磁磚：淺色紙面上印著Wikipedia頁面範例號碼4 003994 155486的30條黑色條，起始、中央與結尾護線比其餘條長，墨比紙面略粗糙且略微凸起。它不是`papertape`（打孔ASCII孔洞）、`sevensegment`或其他既有條紋preset，且以barcode、EAN-13／EAN13、UPC、QR code與label搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何條碼preset（barcode命中是相鄰`papertape`條目裡的搜尋用字列表；label命中是無關條目）。實際讀取的Wikipedia International Article Number頁面提供結構：95個等寬區間（3個起始區間101、第一碼之後六碼的42個區間、5個中央區間01010、後六碼的42個區間、3個結尾區間101）、數字0–9的L、G、R碼（R碼是L碼的逐位元補數、G碼是R碼的位元反序，每個數字兩條黑條與兩段空白）、由第一碼決定左側六碼使用L或G的表（4為LGLLGG）、範例4 003994 155486與其OEOOEE EEEEEE奇偶，以及校驗碼規則（權重3與1交替，最後一個資料碼權重3；範例400638133393x得89而x = 1）。取得的頁面文字沒有X尺寸、空白區、條高、印刷或文字排版，所以兩側各9個區間的空白區（整張113個區間寬、方形tile）、條自上方14個區間起向下70個區間而護線再長5個區間、下方留白（原本印數字處，不繪製文字）、紙面色調0.86 + 0.08×顆粒對墨色調0.04、22,22,26 / 246,244,236色盤、粗糙度紙面0.55與墨0.8、墨比紙面高0.3 relief單位（relief 0.012）、occlusion 0.98而墨上減0.03，以及每個模組邊界兩側各0.1個區間的柔邊皆為作者近似；不主張GS1合規、掃描器可讀性、印刷品質或商品識別，也不複製或打包圖片。一個UV tile代表0.0373 m（113個區間，採作者設定的0.33 mm X尺寸）。獨立kernel存113區間bit表、113個條底值與128² grain，共132,089 B tables（113 B、113個Float64與16,384個Float64 grain），非總RAM；每點選一個模組，在邊界上最多以平滑步階混合兩個模組欄，條端再乘兩個平滑步階，所以每點無hypot、平方根、trig、hash或配置，通用detail略過，mortar保持0。Seed只改變紙面顆粒，條保持固定；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明或位移。

使用root factory `await ProceduralMaterial.create('ean13label', {size:512,seed:7,heightMap:true})`；預設material factor為0，`preset.createMaterial({metallic:1})`明確override，不改寫非金屬maps。Seed只改變紙面顆粒，條保持固定；一個UV tile代表0.0373 m（113個區間），512 maps每個區間約4.5 px並解析條邊（10–90%寬約0.55 px），32則因每個區間只有約0.28 px而使條混疊，沒有任何一條被解析。先移除consumers再destroy preset與其擁有的textures；呼叫端擁有的Worker pool與cache仍由呼叫端管理。

`embossedbraille`（浮凸點字紙）新增作者浮凸點字紙磁磚：奶油色紙面上有7×4個點字格，光滑隆起的圓點依序拼出a到z的字母（跳過w，結尾留三個空白格），圓點比平坦紙面略光滑、略深。它不是`tactilepaving`（規則排列的截錐警示凸點）、`dominoes`（標準點數）或其他既有點狀preset，且以braille、tactile、emboss與raised dot搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何點字preset（braille命中是相鄰條目裡的搜尋用字列表；tactile與emboss命中的是無關preset）。實際讀取的Wikipedia Braille頁面（點字格由兩欄各三個的六個凸點組成，共64種圖樣含無點，位置由上到下左欄編號1到3、右欄4到6，點圖樣1-3-4是字母m；前十個字母a–j使用上方四個位置，即⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚，k–t是同樣圖樣再加第3點，即⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞，之後的u v x y z加第3與第6點，w被略過）提供點字格；頁面沒有點距、tile或渲染方式，所以7×4版面、格距2.4與行距4.2個點距（16.8×16.8點距的方形）、空白格、半徑0.3點距的圓頂與其他數值都是作者設定：每個凸點是高度剖面為(1 − s²)²（s為正規化半徑平方，邊緣斜率為零、不需平方根）的圓頂，置於格內欄位±0.5與列−1、0、1，紙面高度0.4、點頂1.0，色調0.82±0.1顆粒、點上減0.12，色盤168,152,128 / 244,236,216，粗糙度紙面0.85、點頂0.7，occlusion 0.97、點上減0.1，relief 0.03皆為作者近似；不主張任何紙張材料、點距標準、壓印工法或可讀性，也不複製或打包圖片。一個UV tile代表0.042 m（16.8個2.5 mm點距，2.5 mm為作者採用的常見點距）。獨立kernel存28格代碼表與128² grain，共131,100 B tables（grain 16,384 Float64），非總RAM；每點讀一個格代碼、選最近的點位並最多計算一個圓頂，無hypot、平方根、trig、hash或配置，通用detail略過，mortar保持0。Seed只改變紙面顆粒，凸點保持固定；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明或位移。

使用root factory `await ProceduralMaterial.create('embossedbraille', {size:512,seed:7,heightMap:true})`；預設material factor為0，`preset.createMaterial({metallic:1})`明確override，不改寫非金屬maps。Seed只改變紙面顆粒，凸點保持固定；一個UV tile代表0.042 m（7×4格、80個點），512 maps可解析每個圓點與其緣側法線（半高輪廓處寬約10 px），32只剩紙面，因為每個圓點都小於一個像素而落在像素中心之間。先移除consumers再destroy preset與其擁有的textures；呼叫端擁有的Worker pool與cache仍由呼叫端管理。

`rule30`（Rule 30元胞自動機）新增作者Rule 30元胞自動機磁磚：33×33格的tile顯示Wolfram初等元胞自動機Rule 30從頂列中央單一黑格長出的33代（時間向下），黑格是凸起、光滑的深色方塊，白格是較低、較粗糙的淡色方塊，格間有凹陷細溝。它不是`sierpinskicarpet`、`moorecurve`、`ulamspiral`、`perfectmaze`或其他既有幾何或由數字決定的preset，且以cellular automaton、Wolfram、rule 30、cone snail與pseudorandom搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何preset（命中的只有相鄰條目裡的搜尋用字列表）。實際讀取的Wikipedia Rule 30頁面（Stephen Wolfram於1983年提出的初等元胞自動機，屬Class III、行為非週期且混沌；規則表111→0、110→0、101→0、100→1、011→1、010→1、001→1、000→0，即左 xor (中 or 右)，因二進位00011110為30而得名；從一群0中的單一狀態1出發、時間向下，常出現白色三角形，左側有明確的條紋圖樣；各代的黑格數為1、3、3、6、4、9、5、12、7、12、11、14、12、19、13、22、15、19……；芋螺Conus textile的殼上有類似圖樣）提供規則與計數；頁面沒有tile、格網大小、邊界或外觀，所以33×33格網（陣列外的格為0，因此第十六代之後會被左右邊界截斷）與所有尺度都是作者設定：每格是半尺寸0.42格、肩部0.05格的方塊（兩個平滑區間的乘積，半覆蓋輪廓寬0.79格），黑格凸起到0.9、色調0.1、粗糙度0.3，白格在0.4、色調0.7±0.08顆粒、粗糙度0.8，溝在0.3、色調0.35，色盤20,22,30 / 226,222,208，occlusion 0.97、溝內減0.3，relief 0.03皆為作者近似；不主張任何材料、尺寸規格或隨機性質，也不複製或打包圖片。一個UV tile代表0.66 m（33格、每格2 cm）。獨立kernel存1,089 byte的格表與128² grain，共132,161 B tables（grain 16,384 Float64），非總RAM；自動機只在建立sampler時執行，每點讀一個格byte並計算兩個區間，無hypot、平方根、trig、hash或配置，通用detail略過，mortar保持0。Seed只改變白格顆粒，圖樣保持固定；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明或位移。

使用root factory `await ProceduralMaterial.create('rule30', {size:512,seed:7,heightMap:true})`；預設material factor為0，`preset.createMaterial({metallic:1})`明確override，不改寫非金屬maps。Seed只改變白格顆粒，圖樣保持固定；一個UV tile代表0.66 m（33×33格、每格2 cm、33代），512 maps可解析每一格與其邊緣法線（格寬約15.5 px、方塊約12 px），32只把圖樣保留成粗略的斑點（格寬不到1 px）。先移除consumers再destroy preset與其擁有的textures；呼叫端擁有的Worker pool與cache仍由呼叫端管理。

`perfectmaze`（種子完美迷宮）新增作者種子完美迷宮磁磚：8×8格的迷宮，通道是凹陷、深色、較光滑的溝，夾在淡色、較粗糙的凸牆之間，64格以63條連結相連，所以每格都到得了且沒有迴圈，每個seed是不同的迷宮。它不是`moorecurve`（單一確定性的封閉溝槽迴路、沒有分岔）、`braincoral`（自然迷宮狀脊線）、`guilloche`、`greekkey`、`truchettiles`、`hextruchettiles`、`circuitboard`或其他既有溝槽與磁磚類preset，且以maze、labyrinth、spanning tree與backtrack搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何迷宮preset（labyrinth命中是`braincoral`的自然脊線與`moorecurve`自己的用字）。實際讀取的Wikipedia Maze generation algorithm頁面（迷宮可視為節點是格、邊是牆位的連通圖，生成常以隨機生成樹處理，使沒有到不了的區域也沒有迴圈；隨機深度優先搜尋即遞迴回溯法，從一格出發、移到隨機的未訪問鄰格並移除兩者之間的牆、在死路回溯，得到低分岔係數與許多長通道）提供構造；8×8尺寸、由seed播種的xorshift產生器、鄰格順序（東、南、西、北）、通道幾何與所有尺度都是作者設定：每一格以一條水平帶與一條垂直帶連到有連結的鄰格，各是兩個平滑區間的乘積，半寬0.25格、肩部0.05格（所以半覆蓋的通道寬0.45格，8 cm格下為3.6 cm），帶狀區直接穿過格邊朝有連結的鄰格延伸所以格與格C1相接，地面為聯集1 − (1 − 水平)(1 − 垂直)，且沒有連結穿過tile邊界，所以每個重複的tile各有一座迷宮。地面凹進0.8牆面之下0.45；牆面色調0.8±0.1顆粒、地面0.2，色盤48,42,36 / 214,204,184，粗糙度牆面0.55、通道0.85，occlusion 0.97、通道降到0.6，relief 0.03皆為作者近似；不主張任何材料、尺寸規格或難度，也不複製或打包圖片。一個UV tile代表0.64 m（8×8格、每格8 cm）。獨立kernel存64個連結byte與128² grain，加上產生器的128個暫存byte共131,264 B tables（grain 16,384 Float64），非總RAM；深度優先搜尋只在建立sampler時執行，每點讀一個連結byte並計算四個區間，無hypot、平方根、trig、hash或配置，通用detail略過，mortar保持0。Seed改變迷宮與牆面顆粒；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明或位移。

使用root factory `await ProceduralMaterial.create('perfectmaze', {size:512,seed:7,heightMap:true})`；預設material factor為0，`preset.createMaterial({metallic:1})`明確override，不改寫非金屬maps。每個seed長出自己的迷宮（同一個seed永遠得到同一座迷宮）；一個UV tile代表0.64 m（8×8格、每格8 cm）並含一整座迷宮，512 maps可解析通道邊緣與緣側法線（64 px的格內通道約寬29 px），32只把迷宮保留成粗略圖樣（格寬4 px、通道約寬1.8 px）。先移除consumers再destroy preset與其擁有的textures；呼叫端擁有的Worker pool與cache仍由呼叫端管理。

`sevensegment`（七段顯示器）新增作者七段顯示器面板：深色、表面光滑的非金屬面板上以5×2格的數字格顯示0123456789，亮起的段是明亮的琥珀色斜角長條，未亮的段是暗淡殘影，全部凹進面層之下。它不是`chipresistors`（元件本體上以連續筆劃畫出的白色103標記）或其他既有會畫字元的preset，且以seven-segment、segment display、digit與calculator搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何preset把數字畫成線段。實際讀取的Wikipedia Segment display頁面（七段顯示器顯示數字與部分字母；各段以字母a到g稱呼，另有可選的小數點；一個byte可以表示整個狀態，常用gfedcba編碼中0x06點亮c與b段而顯示1；最常見的十進位圖樣為0 abcdef、1 bc、2 abdeg、3 abcdg、4 bcfg、5 acdfg、6 acdefg、7 abc、8 abcdefg、9 abcdfg，另有如帶尾巴的7等替代圖樣）提供數字圖樣；取得的頁面文字沒有段位置、比例或外觀，所以版面（a上、b右上、c右下、d下、e左下、f左上、g中，UV中y向下）、依閱讀順序的5×2格與所有尺度都是作者設定：每條長條的半長0.3、半寬0.06（以數字格寬為單位）、兩端45°斜角，中心在(0, ±0.8)、(±0.34, ±0.4)與(0, 0)，數字格寬1、高2.5，每條長條是四個平滑半平面遮罩（兩側與兩個斜角，沿長條方向的符號摺疊）的乘積，所以尖端保持C1。長條凹進0.6的面層之下0.1；面板色調0.05±0.02顆粒，未亮殘影加0.15、亮條加0.75，色盤14,10,10 / 255,150,40，粗糙度面板0.45、亮條0.2，occlusion 0.97、殘影減0.25，relief 0.03皆為作者近似；沒有建模或主張任何LED、LCD、發光或標準，也不複製或打包圖片。一個UV tile代表0.2 m（5×2格、每格寬4 cm高10 cm）。獨立kernel存128² grain，共131,072 B table（16,384 Float64），非總RAM；每點摺疊一個圖樣碼、略過範圍外的長條並最多計算幾個平滑遮罩，無hypot、平方根、trig、hash或配置，通用detail略過，mortar保持0。Seed只改變面板顆粒，數字保持固定；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明、發光或位移。

使用root factory `await ProceduralMaterial.create('sevensegment', {size:512,seed:7,heightMap:true})`；預設material factor為0，`preset.createMaterial({metallic:1})`明確override，不改寫非金屬maps。Seed只改變面板顆粒，數字保持固定；一個UV tile代表0.2 m（5×2格、每格4×10 cm），512 maps可解析每條長條與其邊緣法線（長條約厚12 px、長61 px），32只把數字保留成稀疏的小點（長條厚不到1 px）。先移除consumers再destroy preset與其擁有的textures；呼叫端擁有的Worker pool與cache仍由呼叫端管理。

`ulamspiral`（Ulam質數螺旋）新增作者Ulam質數螺旋磁磚：15×15格的tile以正方形螺旋寫入整數1–225，1在正中央，質數所在的格以光滑深色凸圓頂標記，位於較粗糙的淡色非金屬石板上，板面在每個格邊有凹陷的格線溝。它不是`tactilepaving`（規則排列的截錐警示凸點）、`dominoes`（標準0–6凹點排列）或其他既有凸點與孔洞preset，且以ulam、prime、spiral與number theory搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何preset的圖樣來自數字（既有的spiral命中是蕨類卷芽、肉桂皮捲與蝴蝶酥等捲曲形狀）。實際讀取的Wikipedia Ulam spiral頁面（Stanisław Ulam於1963年設計、由Martin Gardner推廣；把正整數寫成正方形螺旋，最常見是1在中央，再標記質數；螺旋中的線對應二次多項式4n² + bn + c，且同一條斜線上的數全為奇數或全為偶數，所以2以外的質數都落在交替的斜線上）提供構造；取得的頁面文字沒有描述圖的方向，所以方向（2在1的右側，之後逆時針，UV中列向下延伸）、15×15尺寸與所有尺度都是作者設定：距中心偏移(x, y)的格依環r = max(|x|, |y|)從(2r + 1)²與所在邊編號，再以226項篩法標出質數（225個數中有48個）。每個被標記的格有一個半徑0.38格的圓頂，高度剖面為(1 − s²)²（s為正規化半徑，邊緣斜率為零、不需平方根），石板高度0.3、每個格邊有深0.12、半寬0.05格的溝（兩個平滑一維方盒的乘積聯集，所以格角C1相接），圓頂最高0.9，板面色調0.74±0.12顆粒、溝內減0.3、圓頂0.09，色盤30,38,58 / 234,226,206，粗糙度板面0.8、圓頂0.3，occlusion由0.97降到溝內0.65，relief 0.02皆為作者近似；不主張任何材料、標準、產品或數學認證，也不複製或打包圖片。一個UV tile代表0.375 m（15格、每格2.5 cm）。獨立kernel存226 byte篩表、225個質數旗標與128² grain，共131,523 B tables（grain 16,384 Float64），非總RAM；螺旋編號與篩法只在建立sampler時執行，每點讀一個旗標並計算兩個方盒與最多一個圓頂，無hypot、平方根、trig、hash或配置，通用detail略過，mortar保持0。Seed只改變石板顆粒，被標記的質數保持固定；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明或位移。

使用root factory `await ProceduralMaterial.create('ulamspiral', {size:512,seed:7,heightMap:true})`；預設material factor為0，`preset.createMaterial({metallic:1})`明確override，不改寫非金屬maps。Seed只改變石板顆粒，被標記的質數保持固定；一個UV tile代表0.375 m（15×15格、每格2.5 cm，整數1–225），512 maps可解析每個圓頂與其邊緣法線（34 px的格內圓頂約寬26 px），32只把質數保留成粗略點狀圖樣（格寬2.1 px）。先移除consumers再destroy preset與其擁有的textures；呼叫端擁有的Worker pool與cache仍由呼叫端管理。

`papertape`（打孔紙帶）新增作者打孔紙帶：一吋寬、十個0.1吋字元列×九條孔軌的八軌紙帶tile，淡色非金屬紙面上以孔洞編碼ASCII文字「PAPER TAPE」，並有一列較小的導孔偏向一側邊緣，每個孔中都露出深色底襯，孔較粗糙、較深色且遮蔽較強。它不是`punchcard`（2×4張奶油色卡片與20×8矩形打孔）或其他既有穿孔、點狀preset，且以punched tape、braille、morse、barcode、QR、seven-segment、dot-matrix、ulam、cellular automaton、piano roll與music box搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何preset以圖樣編碼資料。實際讀取的Wikipedia Punched tape頁面（資料是紙帶橫列上有孔或無孔；一列較小的導孔永遠打出，略偏向一側邊緣，把紙帶分成不等寬，較窄一側放最低有效位元；常見1吋寬紙帶供六位元以上使用，孔距兩方向皆0.1吋，資料孔直徑0.072吋（1.8 mm）、導孔直徑0.046吋（1.2 mm）；其範例二進位01011010為ASCII Z）提供幾何；取得的頁面文字沒有訊息內容、孔軌分配或同位慣例，這些是自行決定：有孔為1位元，導孔列是九軌中的第4軌（距窄邊0.4個紙帶寬、距另一邊0.6），第1–3軌放位元0–2、第5–9軌放位元3–7，位元7是偶同位，所以每個字元列的資料孔數都是偶數。Kernel由「PAPER TAPE」的ASCII碼加同位位元建立每列byte，孔為半徑0.36（資料）與0.23（導孔）列距、0.05平滑肩部的圓盤（頁面的0.072與0.046吋直徑除以0.1吋孔距），紙面高度0.7、底襯0.1（落差0.6），紙帶邊緣縫線寬0.012個tile（深0.15），紙面色調0.72±0.14顆粒，色盤58,48,38 / 236,224,196，紙面粗糙度0.75、孔內0.92，occlusion由0.97降到孔內0.30，relief 0.008皆為作者近似；0.1 mm紙厚、半透明、上油或chadless紙、紙帶捲與沖孔公差沒有建模，也不主張任何標準、設備或產品，不複製或打包圖片。一個UV tile代表0.0254 m（一吋紙帶、十個字元列）。獨立kernel存10個列byte與128² grain，共131,082 B tables（grain 16,384 Float64），非總RAM；每點讀一個列byte、選最近孔軌並最多計算一個圓盤（一次平方根），無hypot、trig、hash或配置，通用detail略過，mortar保持0。Seed只改變紙纖維，打孔文字保持固定；四張不透明非金屬map、預設metallic 0、選用height、tint／repeats、Worker／cache與各texture所有權維持不變，不新增mesh、透明或位移。

使用root factory `await ProceduralMaterial.create('papertape', {size:512,seed:7,heightMap:true})`；預設material factor為0，`preset.createMaterial({metallic:1})`明確override，不改寫非金屬maps。Seed只改變紙纖維，打孔文字保持固定；一個UV tile代表0.0254 m（一吋紙帶、十個0.1吋字元列），512 maps可解析孔洞與孔緣法線（資料孔直徑約37 px、導孔約24 px），32只把打孔保留成粗略的點狀圖樣。先移除consumers再destroy preset與其擁有的textures；呼叫端擁有的Worker pool與cache仍由呼叫端管理。

`moorecurve`（Moore曲線磁磚）新增作者Moore曲線溝槽磁磚：在淡色非金屬面層的8×8格tile上，一條封閉且連續的深色溝槽穿過每一格，溝槽凹陷、較粗糙且較深色。它不是`braincoral`（自然迷宮狀脊線）、`guilloche`、`greekkey`、`truchettiles`、`hextruchettiles`、`circuitboard`或其他既有溝槽、迷宮與磁磚類preset，且以hilbert、peano、moore與space-filling搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何preset具有這種曲線（既有的meander與labyrinth命中是自然脊線與鏈條）。實際讀取的Wikipedia Moore curve頁面（連續的碎形填滿空間曲線，是Hilbert曲線的封閉版本，可視為四條Hilbert曲線讓端點重合而成）提供概念；取得的頁面文字沒有L-system規則，所以離散構造是在此自行建立並以數值檢查：4×4區塊上的二階Hilbert曲線（以迭代位元轉換由曲線索引求格子，起點為角落(0,0)、終點為(3,0)，相鄰步進）旋轉進四個象限（左下與左上逆時針、右上與右下順時針，皆在垂直中線進出），使64格形成一個漢米頓迴路，且閉合步也是相鄰步。溝槽是中央方塊與每個連結鄰格方向的臂的聯集，每一項都是平滑一維方盒的乘積（半寬0.17格、肩部0.04格，所以寬0.3格，在0.64 m名義tile、每格8 cm時為2.4 cm），聯集用1−∏(1−項)，臂直達格邊界，所以相鄰格以C1相接；沒有臂越過tile邊界，每個重複的tile各自有一條迴路。溝槽比0.7的面層凹0.45，面層色調0.70–0.80、溝槽約0.14–0.24（色盤46,42,40／228,220,202），粗糙度面層0.45、溝槽0.9，occlusion 0.96降到0.46，relief 0.015皆標示為作者近似，不宣稱材料、雕刻工法、標準或產品，也不複製或打包任何圖片。獨立kernel儲存64個連結byte、128個路徑byte與128² grain，共131,264B tables（grain為16,384個Float64），非總RAM；Hilbert轉換只在建立sampler時執行，每點讀一個連結byte並計算兩個方盒與最多四條臂，因此每點不執行hypot、平方根、三角函數、hash或配置；通用detail略過，mortar保持0。Seed只改變面層顆粒，迴路保持固定；不透明非金屬四張map、預設metallic 0、選用height、tint／repeats、Worker／cache與個別texture所有權皆不變，沒有新增網格、透明或位移。

使用root factory `await ProceduralMaterial.create('moorecurve', {size:512,seed:7,heightMap:true})`；預設material factor為0，`preset.createMaterial({metallic:1})`明確override，不改寫非金屬maps。Seed只改變面層顆粒，迴路保持固定；一個UV tile代表0.64 m（8×8格、每格8 cm）並含一條封閉溝槽，512 maps可解析溝槽邊緣與法線（約19 px寬），32只把迴路保留成粗略溝槽。先移除consumers再destroy preset與其擁有的textures；呼叫端擁有的Worker pool與cache仍由呼叫端管理。

`sierpinskicarpet`（Sierpinski地毯）新增作者Sierpinski地毯石磚：在81×81格的tile上做四層地毯遞迴，每個保留區塊的中央三分之一向下凹，得到1個27×27格、8個9×9格、64個3×3格與512個1×1格（共585個）凹方，位於淡色非金屬石面上，越大的凹方越深越暗。它不是`perforatedmetal`、`cofferedconcrete`、`splitfaceblock`、`breezeblock`、`tactilepaving`或其他既有點蝕、嵌板或磁磚類preset，且以sierpinski、fractal、menger、cantor與space-filling搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何preset具有這種遞迴圖樣。實際讀取的Wikipedia頁面（Sierpiński carpet：正方形分成3×3共9個全等子方形、移除中央一格，並對剩下8格遞迴套用；等價於單位正方形中以三進位表示的座標在同一位置沒有同時出現數字1的點，極限面積為零、Hausdorff維度log 8／log 3≈1.8928）提供構造規則。這個材質是有限四層近似，不是極限集合：4,096＝8⁴個保留格與2,465＝81²−8⁴個凹陷格，名義凹陷比例1−(8/9)⁴≈0.3757。每個凹方是兩個平滑一維方盒的乘積，每側內縮0.04格並有0.14格肩部，因此邊緣為C1且不需smooth minimum，tile邊界格從不凹陷，所以tile可無縫重複。凹方底部的相對高度為0.1、0.17、0.24與0.31（對面層0.7，越大越深），底部色調0.14–0.32（面層0.58–0.70），粗糙度面層0.55、凹方0.88，occlusion由0.96降到0.46，色盤62,52,44／218,200,168、相對UV起伏0.02與0.81 m名義tile（1 cm格）皆標示為作者近似，不宣稱石種、雕刻工法、尺寸標準或產品，也不複製或打包任何圖片。獨立kernel儲存128² grain，共16,384個Float64／131,072B table，非總RAM，另有四項常數；每點最多測試四層並以三進位數字迴圈判斷，只對保留區塊計算兩個smooth方盒，每點不執行hypot、平方根、三角函數、hash或配置；通用detail略過，mortar保持0所以不混入灰色填縫。Seed只改變石面顆粒與色調，凹方配置保持固定；不透明非金屬四張map、預設metallic 0、選用height、tint／repeats、Worker／cache與個別texture所有權皆不變，沒有新增網格、透明或位移。

使用root factory `await ProceduralMaterial.create('sierpinskicarpet', {size:512,seed:7,heightMap:true})`；預設material factor為0，`preset.createMaterial({metallic:1})`明確override，不改寫非金屬maps。Seed只改變石面顆粒，凹方配置保持固定；一個UV tile代表0.81 m（81格、每格1 cm），512 maps可解析四個層級的斜邊（一格凹方約6 px寬），32只保留較粗的層級。先移除consumers再destroy preset與其擁有的textures；呼叫端擁有的Worker pool與cache仍由呼叫端管理。

`chladnifigure`（Chladni圖形）新增作者Chladni圖形表面：在深色、較光滑的非金屬板上，淡色細沙沿著駐波圖樣的節線聚集，沙略高於板面且比板面粗糙。它不是`sanddune`、`pebblebeach`、`sandstone`、`perforatedmetal`或其他既有沙、石與板類preset，且以chladni與cymatic搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何preset具有這種圖樣（Fibonacci／phyllotaxis、sierpinski、hilbert等數學圖樣搜尋同樣為空）。實際讀取的Wikipedia頁面（要求的Chladni figure網址回傳標題為Ernst Chladni的頁面，其Chladni figures章節說明共振的板或膜被分成振動方向相反的區域，以沒有振動的節線為界，且Chladni用弓拉薄薄覆沙的金屬片，沙會集中在表面靜止的節線上）只提供物理概念。該頁沒有公式，所以節函數是作者的理想化，並非任何實體板的模型：f(u,v)＝cos(aπu)cos(bπv)−cos(bπu)cos(aπv)，a＝5、b＝9；同奇偶的模態使f(u+1,v)＝±f且f(u,v+1)＝±f，因此零集與UV tile精確重複（奇偶不同會破壞接縫），u與v對調使f變號，u→1−u或v→1−v只翻轉符號，所以圖樣對兩軸與對角線鏡射。沙寬使用到零集的一階距離|f|／√(|∇f|²＋3²)，而非對f設門檻，因此線寬均勻，只有交叉點會稍微堆高；沙覆蓋率為smooth(1−distance／(0.012×(0.75＋0.5×grain)))，grain為seed決定的週期128²雜訊，使沙緣粗糙度在寬度±25%內變動（一條線約為tile的0.012，在0.6 m名義tile約7 mm），沙高出板面約0.5個relief，粗糙度由板面0.34升到沙0.93，occlusion由0.97降到0.72，色盤26,29,34／232,220,194使板面很深（約0.12–0.15）、沙很淡（0.82–0.95）。模態數、寬度、梯度下限3、relief 0.01與粗糙度皆為作者設定；不宣稱邊界條件、材料、激振、沙粒物理或任何產品，也不複製或打包任何圖片。獨立kernel儲存128² grain，共16,384個Float64／131,072B table，非總RAM，每點計算四個cos、四個sin與一個平方根，沒有hash或配置；通用detail略過。它寫入mortar 0，因為非零值會把灰色填縫色混進板面。Seed只改變沙粒（沙緣粗糙度與色調），節線保持固定；不透明非金屬四張map、預設metallic 0、選用height、tint／repeats、Worker／cache與個別texture所有權皆不變，沒有新增網格、透明或位移。

使用root factory `await ProceduralMaterial.create('chladnifigure', {size:512,seed:7,heightMap:true})`；預設material factor為0，`preset.createMaterial({metallic:1})`明確override，不改寫非金屬maps。Seed只改變沙粒，節線保持固定；一個UV tile代表0.6 m並無縫重複同一個沙圖形，512 maps可解析沙線（約6 px寬）與其法線，32只保留粗略圖形。先移除consumers再destroy preset與其擁有的textures；呼叫端擁有的Worker pool與cache仍由呼叫端管理。

`kisrhombilletiles`（Kisrhombille磁磚）新增作者V4.6.12 kisrhombille釉面鑲嵌近似：三角晶格上的每個六邊形被六條通往角點與六條通往邊中點的輻線切成十二個全等的30-60-90直角三角形，深青色與奶油色三角形繞每個六邊形中心交替，因此每條直邊都落在相隔30°的六組平行線之一；每個面都有窄斜邊並被較粗糙的灰色填縫圍出。它不是`rhombille`（每個六邊形三個菱形）、`trihexagonaltiles`（六邊形與三角形，3.6.3.6）、`righttriangletiles`（分割正方形中的等腰直角三角形）、其對偶`truncatedtrihexagonaltiles`（4.6.12）或其他既有磁磚preset，且以kisrhombille、30-60-90、deltoidal、tetrakis、triakis、floret與prismatic pentagon搜尋README／PLAN／DESIGN／CURRENT及preset目錄，沒有任何preset具有這種鑲嵌（唯一的floret命中是無關的花椰菜小花）。實際讀取的Wikipedia頁面（要求的Kisrhombille tiling網址回傳標題為Truncated trihexagonal tiling的頁面，其Kisrhombille tiling章節說明該鑲嵌由全等30-60-90三角形構成、每個頂點交會4、6或12個三角形，可視為正六邊形鑲嵌且每個六邊形由中心分成12個三角形，或視為二等分的三角鑲嵌，或六組平行線的無限排列，標記為V4.6.12，三角形是p6m [6,3]對稱的基本域）提供拓樸。幾何是推導並以數值檢查，不是抄自來源：六邊形邊長為1時，六邊形內切半徑為√3/2，六邊形中心位於間距√3≈1.73205的三角晶格，每個三角形斜邊為1（通往角點的輻線）、長股√3/2、短股1/2（面積√3/8≈0.21651），六邊形面積3√3/2≈2.59808，並以30萬點sampler檢查12個扇形：磁磚占比0.72137，與由內縮30-60-90幾何推得的0.72205相符。每個UV tile為7欄×4雙列（56個六邊形＝672個三角形，超晶格比高度寬1.04%並被拉到正方形UV tile，沿用既有7×8六角磁磚preset的近正方形慣例）、填縫每側0.02、肩部0.015、青綠／奶油色盤（28,70,84／236,226,200）、釉面粗糙度0.3、填縫粗糙度0.92、相對UV起伏0.012與1.2 m名義tile（六邊形邊長約0.1 m）皆標示為作者近似，不宣稱磁磚厚度、釉料化學、填縫材料、尺寸規格或產品。獨立kernel儲存26個輻線cos／sin值、672個三角形色調與96² grain，共9,914個Float64／79,312B tables，非總RAM；每點在九個晶格節點中選最近者，再以兩條輻線半平面檢查12個扇形，只對通過者計算六邊形邊半平面與三個smooth邊，因此每點不執行hypot、平方根、三角函數、hash或配置；通用detail略過。每個面是以填縫內縮的三個smooth半平面乘積，相鄰支撐不重疊，轉角不需smooth minimum。Seed只改變三角形色調（深青0.11–0.24、奶油0.80–0.92）與細顆粒，晶格保持固定；色調索引含傾斜週期的晶格位移，但所有接縫都落在填縫上，因此該索引無法觀察。不透明非金屬四張map、預設metallic 0、選用height、tint／repeats、Worker／cache與個別texture所有權皆不變，沒有新增網格、透明或位移。

使用root factory `await ProceduralMaterial.create('kisrhombilletiles', {size:512,seed:7,heightMap:true})`；預設material factor為0，`preset.createMaterial({metallic:1})`明確override，不改寫非金屬maps。Seed只改變每個三角形的色調與細顆粒，晶格、三角形邊與填縫保持固定；一個UV tile代表1.2 m（7欄×4雙列：56個六邊形，每個12個三角形），512 maps可解析兩股約37 px與21 px三角形的斜邊與填縫，32只保留巨觀的青綠／奶油色星形圖樣。先移除consumers再destroy preset與其擁有的textures；呼叫端擁有的Worker pool與cache仍由呼叫端管理。

`truncatedtrihexagonaltiles`（截角三六角磁磚）新增作者4.6.12截角三六角（truncated trihexagonal）釉面鑲嵌近似：大型奶油色正十二邊形位於三角晶格，每條晶格邊上有一個旋轉到三個相差60°方向之一的靛藍小正方形，每個晶格三角形中心有一個薰衣草色正六邊形，因此每個頂點交會一個正方形、一個六邊形與一個十二邊形；每個面都有窄斜邊並被較粗糙的灰色填縫圍出。它不是`dodecagontiles`（標準3.12.12）、`trihexagonaltiles`（3.6.3.6）、`rhombitrihexagonaltiles`（3.4.6.4）或其他既有磁磚preset，且以truncated trihexagonal與4.6.12搜尋README／PLAN／DESIGN／CURRENT／TECHNICAL與preset目錄，沒有任何preset具有這種頂點類型。實際讀取Wikipedia Truncated trihexagonal tiling頁面（八種半正則鑲嵌之一，每個頂點一個正方形、一個六邊形與一個十二邊形，Schläfli符號tr{3,6}；該名稱容易誤導，因為三六角鑲嵌的真正截角會得到矩形，且六邊形與十二邊形無法同時是正多邊形；只有一種均勻著色，對偶為kisrhombille鑲嵌V4.6.12）取得拓樸；取得的頁面其別名清單是空的，所以「great rhombitrihexagonal」只是常見別名，並非取自該頁。幾何則是推導並以數值檢查，不是抄自來源：單位邊長時十二邊形的內切半徑是(2 + √3)/2，十二邊形中心位於間距3 + √3 ≈ 4.73205的三角晶格（兩個內切半徑加一個正方形邊長），每條晶格邊的中點有一個正方形，其沿晶格邊的兩側面向十二邊形、橫跨晶格邊的兩側面向六邊形，每個晶格三角形的形心有一個六邊形，其邊交替面向正方形與十二邊形，一格為1個十二邊形＋3個正方形＋2個六邊形、面積(3 + √3)²√3/2 ≈ 19.3923，7×4超晶格內30萬個隨機點在±1與±2兩種節點鄰域下都恰好落在一個多邊形內（無空隙、無重疊）。每個UV tile 7欄×4雙列（56個十二邊形＋168個正方形＋112個六邊形；此超晶格比高度寬1.04%並被拉到正方形UV tile上，與既有7×8的六角磁磚preset相同的近正方形慣例）、每側0.03的填縫（總寬0.06邊長）、0.02肩部、靛藍／奶油色盤（40,40,86／242,230,206）、釉面粗糙度0.3、填縫粗糙度0.92、UV相對起伏0.012與1.6 m名目tile（邊長約0.0483 m）皆為作者近似，不宣稱磁磚厚度、釉料化學、填縫材料、尺寸規格或產品。獨立kernel只有12個多邊形中心值、144個邊法線值、336個磁磚色調與96²顆粒，共9,708個Float64／77,664 B表格（不是總RAM），另有三個六項常數；每點測試3×3個晶格節點鄰域×6個多邊形（54次圓外接半徑平方檢查），只對可能包含該點的多邊形逐邊計算一個smooth半平面，因此每點沒有hypot、平方根、三角函數、hash或配置，並略過通用detail。每個面是以填縫內縮的smooth半平面乘積，所以相鄰磁磚的支撐不會重疊，角落也不需要smooth minimum；色調索引以傾斜週期的晶格位移在超晶格上環繞。Seed只改變磁磚色調（十二邊形0.82–0.94、六邊形0.3–0.4、正方形0.08–0.18）與細顆粒，晶格固定；不透明非金屬四張map、預設metallic 0、可選height、tint／repeats、Worker／cache與逐張texture所有權不變，不新增mesh、透明或位移。

使用root factory `await ProceduralMaterial.create('truncatedtrihexagonaltiles', {size:512,seed:7,heightMap:true})`；預設material factor為0，`preset.createMaterial({metallic:1})`明確override，不改寫非金屬maps。Seed只改變每塊磁磚的色調與細顆粒，晶格、磁磚邊與填縫保持固定；一個UV tile代表1.6 m（7欄×4雙列：56個十二邊形、168個正方形與112個六邊形），512 maps可解析較大磁磚的斜邊與填縫，小正方形只有約14 px寬，32只保留巨觀奶油／薰衣草／靛藍鑲嵌。銷毀preset與其擁有的texture前先移除consumers；呼叫端擁有的Worker pool與cache仍由呼叫端管理。

`elongatedtriangulartiles`（長三角磁磚）新增作者3.3.3.4.4長三角（elongated triangular）釉面鑲嵌近似：赤陶色的單位邊長正方形排成直立列，與奶油色朝上／朝下正三角形列交替，相鄰的正方形列錯開半個邊長，每個頂點交會三個三角形與兩個並排的正方形；每個面都有窄斜邊並被較粗糙的灰色填縫圍出。它與`snubsquaretiles`的頂點含三個三角形與兩個正方形相同但順序不同（那裡的正方形旋轉±15°且不共邊，這裡的正方形直立並在列內共用垂直邊），也不是既有六邊形加三角形（`trihexagonaltiles`）、`rhombitrihexagonaltiles`（3.4.6.4）、Cairo五邊形或直角三角形磁磚；以elongated triangular與3.3.3.4.4搜尋README／PLAN／DESIGN／CURRENT／TECHNICAL與preset目錄，沒有任何preset具有這種鑲嵌。實際讀取Wikipedia Elongated triangular tiling頁面（每個頂點三個三角形與兩個正方形的半正則鑲嵌，是以正方形列拉長的三角鑲嵌，Schläfli符號{3,6}:e，與扭稜正方形鑲嵌相似但頂點順序不同，Conway稱isosnub quadrille）取得拓樸；幾何則是推導並以數值檢查，不是抄自來源：單位邊長時一個週期寬1、高2 + √3 ≈ 3.73205，含2個正方形與4個三角形（一列正方形、一列朝上／朝下三角形、錯開0.5的一列正方形、第二列三角形），15×4個週期內30萬個隨機點都恰好落在一個多邊形內（無空隙、無重疊）。每個UV tile 15欄×4週期（120個正方形＋240個三角形；此tile比高度寬0.5%並被拉到正方形UV tile上）、每側0.035的填縫（總寬0.07邊長）、0.02肩部、赤陶／奶油色盤（112,48,36／232,214,170）、釉面粗糙度0.34、填縫粗糙度0.92、UV相對起伏0.012與1.2 m名目tile（邊長0.08 m）皆為作者近似，不宣稱磁磚厚度、釉料化學、填縫材料、尺寸規格或產品。獨立kernel只有12個多邊形中心值、48個邊法線值、360個磁磚色調與96²顆粒，共9,636個Float64／77,088 B表格（不是總RAM），另有三個六項常數；每點測試3×3個週期格鄰域×6個多邊形（54次圓外接半徑平方檢查），只對可能包含該點的多邊形逐邊計算一個smooth半平面，因此每點沒有hypot、平方根、三角函數、hash或配置，並略過通用detail。每個面是以填縫內縮的smooth半平面乘積，所以相鄰磁磚的支撐不會重疊，角落也不需要smooth minimum。Seed只改變磁磚色調（正方形0.1–0.22、三角形0.78–0.92）與細顆粒，晶格固定；不透明非金屬四張map、預設metallic 0、可選height、tint／repeats、Worker／cache與逐張texture所有權不變，不新增mesh、透明或位移。

使用root factory `await ProceduralMaterial.create('elongatedtriangulartiles', {size:512,seed:7,heightMap:true})`；預設material factor為0，`preset.createMaterial({metallic:1})`明確override，不改寫非金屬maps。Seed只改變每塊磁磚的色調與細顆粒，列、磁磚邊與填縫保持固定；一個UV tile代表1.2 m（15欄×4週期：120個正方形與240個三角形），512 maps可解析斜邊與填縫，32只保留巨觀赤陶／奶油色列。銷毀preset與其擁有的texture前先移除consumers；呼叫端擁有的Worker pool與cache仍由呼叫端管理。

`rhombitrihexagonaltiles`（菱形三六角磁磚）新增作者3.4.6.4菱形三六角（rhombitrihexagonal）釉面鑲嵌近似：正六邊形位於三角晶格，每條晶格邊上有一個旋轉到三個相差60°方向之一的正方形，每個晶格三角形中心有一個正三角形，因此每個頂點交會一個三角形、一個正方形、一個六邊形與另一個正方形；六邊形為奶油色釉、正方形為石板藍、三角形為海軍藍，每個面都有窄斜邊並被較粗糙的灰色填縫圍出。它不是`snubsquaretiles`（3.3.4.3.4）、`trihexagonaltiles`（六邊形加三角形）、`dodecagontiles`（標準3.12.12）或其他既有磁磚preset，且以rhombitri與3.4.6.4搜尋README／PLAN／DESIGN／CURRENT／TECHNICAL與preset目錄，沒有任何preset具有這種頂點類型。實際讀取Wikipedia Rhombitrihexagonal tiling頁面（每個頂點一個三角形、兩個正方形與一個六邊形的半正則鑲嵌，Schläfli符號rr{3,6}，即expanded hexagonal tiling，與truncated trihexagonal tiling相關）取得拓樸；幾何則是推導並以數值檢查，不是抄自來源：單位邊長時六邊形中心位於間距1 + √3 ≈ 2.73205的三角晶格（內切半徑√3/2＋正方形邊長1＋內切半徑√3/2），六邊形的邊面向晶格方向，每條晶格邊的中點有一個正方形，每個晶格三角形的形心有一個三角形，一格為1個六邊形＋3個正方形＋2個三角形、面積(1 + √3)²√3/2 ≈ 6.4641，7×4超晶格內30萬個隨機點都恰好落在一個多邊形內（無空隙、無重疊）。每個UV tile 7欄×4雙列（56個六邊形＋168個正方形＋112個三角形；此超晶格比高度寬1.04%並被拉到正方形UV tile上，與既有7×8的六角磁磚preset相同的近正方形慣例）、每側0.03的填縫（總寬0.06邊長）、0.02肩部、海軍藍／奶油色盤（20,52,88／244,232,200）、釉面粗糙度0.3、填縫粗糙度0.92、UV相對起伏0.012與1.2 m名目tile（邊長約0.0628 m）皆為作者近似，不宣稱磁磚厚度、釉料化學、填縫材料、尺寸規格或產品。獨立kernel只有12個多邊形中心值、72個邊法線值、336個磁磚色調與96²顆粒，共9,636個Float64／77,088 B表格（不是總RAM），另有三個六項常數；每點測試3×3個晶格節點鄰域×6個多邊形（54次圓外接半徑平方檢查），只對可能包含該點的多邊形逐邊計算一個smooth半平面，因此每點沒有hypot、平方根、三角函數、hash或配置，並略過通用detail。每個面是以填縫內縮的smooth半平面乘積，所以相鄰磁磚的支撐不會重疊，角落也不需要smooth minimum；色調索引以傾斜週期的晶格位移在超晶格上環繞。Seed只改變磁磚色調（六邊形0.82–0.94、正方形0.3–0.4、三角形0.08–0.18）與細顆粒，晶格固定；不透明非金屬四張map、預設metallic 0、可選height、tint／repeats、Worker／cache與逐張texture所有權不變，不新增mesh、透明或位移。

使用root factory `await ProceduralMaterial.create('rhombitrihexagonaltiles', {size:512,seed:7,heightMap:true})`；預設material factor為0，`preset.createMaterial({metallic:1})`明確override，不改寫非金屬maps。Seed只改變每塊磁磚的色調與細顆粒，晶格、磁磚邊與填縫保持固定；一個UV tile代表1.2 m（7欄×4雙列：56個六邊形、168個正方形與112個三角形），512 maps可解析斜邊與填縫，32只保留巨觀奶油／石板藍／海軍藍鑲嵌。銷毀preset與其擁有的texture前先移除consumers；呼叫端擁有的Worker pool與cache仍由呼叫端管理。

`snubsquaretiles`（扭稜正方形磁磚）新增作者3.3.4.3.4扭稜正方形釉面鑲嵌近似：單位邊長的正方形在半格子棋盤上交替旋轉約+15°與−15°，正三角形填滿所有空隙，因此每個頂點交會三個三角形與兩個正方形；正方形為深藍釉、三角形為奶油色釉，每個面都有窄斜邊並被較粗糙的灰色填縫圍出。它不是既有六角形加三角形（`trihexagonaltiles`）、Cairo五邊形（`cairotiles`）或直角等腰三角形（`righttriangletiles`）磁磚，且以snub、3.3.4.3.4與Archimedean搜尋README／PLAN／DESIGN／CURRENT／TECHNICAL與preset目錄，沒有任何preset具有這種頂點類型（唯一命中是`cinnamonbarkcoils`的阿基米德螺線）。實際讀取Wikipedia Snub square tiling頁面（每個頂點三個三角形與兩個正方形的半正則鑲嵌，Schläfli符號s{4,4}，與頂點類型3.3.3.4.4的elongated triangular tiling相關）取得拓樸；幾何則是推導並以數值檢查，不是抄自來源：單位邊長時方格晶格常數為(1 + √3)/√2 ≈ 1.93185，正方形位於晶格節點（旋轉+15°）與格心（旋轉−15°），節點正方形四邊向外的四個正三角形補滿一格，20萬個隨機點都恰好落在每格2個正方形＋4個三角形之一（無空隙、無重疊，面積總和等於格面積）。每個UV tile 3×3個晶格格（18個正方形＋36個三角形）、每側0.035的填縫（總寬0.07邊長）、0.02肩部、藍／奶油色盤（34,64,98／238,226,192）、釉面粗糙度0.3、填縫粗糙度0.92、UV相對起伏0.012與0.6 m名目tile（邊長約0.1035 m）皆為作者近似，不宣稱磁磚厚度、釉料化學、填縫材料、尺寸規格或產品。獨立kernel只有12個多邊形中心值、48個邊法線值、54個磁磚色調與96²顆粒，共9,330個Float64／74,640 B表格（不是總RAM），另有三個六項常數；每點測試3×3個晶格節點鄰域×6個多邊形（54次圓外接半徑平方檢查），只對可能包含該點的多邊形逐邊計算一個smooth半平面，因此每點沒有hypot、平方根、三角函數、hash或配置，並略過通用detail。每個面是以填縫內縮的smooth半平面乘積，所以相鄰磁磚的支撐不會重疊，角落也不需要smooth minimum。Seed只改變磁磚色調（正方形0.1–0.22、三角形0.78–0.92）與細顆粒，晶格固定；不透明非金屬四張map、預設metallic 0、可選height、tint／repeats、Worker／cache與逐張texture所有權不變，不新增mesh、透明或位移。

使用root factory `await ProceduralMaterial.create('snubsquaretiles', {size:512,seed:7,heightMap:true})`；預設material factor為0，`preset.createMaterial({metallic:1})`明確override，不改寫非金屬maps。Seed只改變每塊磁磚的色調與細顆粒，晶格、磁磚邊與填縫保持固定；一個UV tile代表0.6 m（3×3個晶格格、18個正方形與36個三角形），512 maps可解析斜邊與填縫，32只保留巨觀藍／奶油色鑲嵌。銷毀preset與其擁有的texture前先移除consumers；呼叫端擁有的Worker pool與cache仍由呼叫端管理。

`starfish`（海星）新增作者五臂海星近似：多數owner各有一隻隨機旋轉的海星，由圓潤的中央圓盤與五條由根到尖逐漸變窄的圓臂組成，臂的夾角與長度略不規則，每條臂有圓頂與沿臂的脊線，脊線上與兩側有三列小瘤點，星與星之間是較粗糙、較暗的灰色砂底。它不是Starcoral（珊瑚杯與放射隔片）、Staranise（八個木質果莢圍繞凹陷種子腔）、Seaurchintest（象牙色殼與成對孔列）或扇貝疊壓家族（`scalemail`、`fishscales`）。實際讀取Wikipedia Starfish條目（中央圓盤、通常五臂、背面平滑、顆粒或多刺並由重疊骨板構成、常為紅或橘色、篩狀篩板），並實際檢視Wikimedia Commons的Starfish montage圖；以PIL量測圖中橘色標本輪廓，得到五個臂尖距中心171–183 px、谷深約為臂尖半徑的0.17–0.26、臂寬在0.5倍與0.85倍半徑處約為0.195與0.148倍半徑、相鄰臂尖夾角63.5–88.5°；同圖其他標本更窄或更寬（有角的沙色標本約0.25–0.3倍半徑），因此這些數字只描述一個標本，不代表物種。3×3格、固定五臂、軸向±0.1 rad抖動、臂長±6%、0.4格半徑、0.25R圓盤、根／尖半寬0.1R／0.07R、瘤點列（間距0.05格、半徑0.017）、灰砂底、灰到橘色盤、粗糙度0.66、UV相對起伏0.02與0.3 m名目tile皆為作者近似，不宣稱物種、篩板、管足、棘刺、色彩校正、真實尺寸或海洋生物學數據。獨立kernel只有180個pose Float64（9個owner×20）加128²顆粒與16²底面場，共16,820個Float64／134,560 B表格，不是總RAM；每點以最大投影選臂（不做角度三角函數），用2次hypot與12次SmoothStep，無逐點配置、hash或三角函數（`cos`／`sin`只在建立pose時使用），並略過通用detail。臂寬以smoothstep漸縮，使尖端與根部斜率為零；臂專屬起伏僅在離中心0.2R–0.25R之外淡入，因此相鄰兩臂交接的折線沒有起伏斜率折點；圓盤與臂以`1 − (1 − 臂)(1 − 圓盤)`合併。Seed改變哪些owner有海星，以及旋轉、臂抖動、色調與細顆粒；不透明非金屬四張map、預設metallic 0、可選height、tint／repeats、Worker／cache與逐張texture所有權不變，不新增mesh、透明或真實臂幾何。

使用root factory `await ProceduralMaterial.create('starfish', {size:512,seed:7,heightMap:true})`；預設material factor為0，`preset.createMaterial({metallic:1})`明確override，不改寫非金屬maps。Seed改變哪些owner有海星，以及旋轉、臂抖動、色調與細顆粒，五臂配置、preset半徑與瘤點列保持固定；一個UV tile代表0.3 m（3×3隻海星），512 maps可解析臂、脊與瘤點列，32只保留巨觀臂形與遮蔽。銷毀preset與其擁有的texture前先移除consumers；呼叫端擁有的Worker pool與cache仍由呼叫端管理。

`fishscaleshingles`（魚鱗瓦片）新增作者魚鱗狀金屬瓦片近似：8層各12個半圓形下緣瓣的橫列，每片瓦寬兩瓣，逐層交錯半瓣，上層下緣疊壓下層並在下層留下底部陰影；瓦片之間有窄深縫與略不同的塗裝色。它不是Hopsack／Waffleweave的織物格、Slate／Tiles的矩形瓦，也不是Snowflaketiles或Circularpavers的幾何鋪面。已讀Berridge Fish Scale Shingles頁（24 gauge鋼、輕微紋理的圓形扇貝輪廓、每片覆蓋8 1/2英寸高×11 1/2英寸寬、每square 148片；8.5×11.5×148＝14,467 in²，與100 ft²＝14,400 in²約略一致（差約0.5%）），並實看兩張白色／米色產品圖（每片下緣有兩個半圓瓣、相鄰層錯位疊壓、表面有淡波紋壓花）；另讀Yusheng Fish-Scale石粒金屬瓦頁（小型重疊扇貝單元，約2.8片／m²），但沒有取用其數字。由Berridge覆蓋比取課高對瓣寬比：每片兩瓣，故課高／瓣寬＝2×8.5／11.5≈1.478，本材質12瓣×8層為1.5（差約1.5%），並以12×5.75 in≈1.75 m作為nominal tile。來源與圖沒有可讀的瓣偏移量，所以相鄰層錯半瓣、唇厚、陰影寬度、縫寬、塗裝色與每片色差都是作者近似；不模擬壓花紋理、金屬反射、鋼板彎折、固定件或規格認證，也不是木瓦。獨立kernel：只有8×6片的色調表與128² grain，共16,432 Float64／131,456B tables，非總RAM；逐點四次hypot與12次SmoothStep，兩個最近瓣距離以多項式smooth-min合併（避免距離場中軸的斜率折點），無每點配置、hash或trig，通用detail略過。每層先各自算好顏色、高度與AO再依覆蓋率混合，使縫中心的色階被縫色蓋住而不留下階跳。0.012 UV-relative relief與配色為作者近似；seed只改每片色調與grain，瓣與縫位置固定；維持opaque dielectric四maps、預設metallic 0、optional height、tint／repeats、Worker／cache與各自texture ownership；不新增mesh、透明、折射或真實疊壓幾何。與既有`scallopedslate`（4欄×6列、1.2 m tile、每片單一圓尾的藍灰板岩、片間無縫）、`fishscaletiles`（4欄×8列共平面釉面馬賽克）及`scalemail`同屬扇貝疊壓家族，本材質只是由Berridge覆蓋比取得的變體：12瓣×8層、每片兩瓣、片間有窄縫與塗裝色差、1.75 m tile與下層陰影，不應被視為全新的屋瓦類別。

使用root factory `await ProceduralMaterial.create('fishscaleshingles', {size:512,seed:7,heightMap:true})`；預設material factor為0，`preset.createMaterial({metallic:1})`明確override，不改寫非金屬maps。Seed只改每片瓦的色調與細grain，瓣、縫與層位置固定；一個UV tile代表1.75 m，512圖解析瓣緣、唇階與下緣陰影，32只保留宏觀色階與粗normal。移除consumer後才destroy preset及其own textures；借入的Worker pool與cache仍由caller管理。

`waffleweave`（華夫格織）新增作者華夫格織布近似：14×16個固定格的圓脊圍出內凹小方格，格底呈淺碗狀，橫向脊比縱向脊高，兩向脊交點隆起成小結；不是Matelasse的凸菱接結、Basketweave／Hopsack的連續籃紋，也不是Honeycomb的黃色六角蜂巢。已讀Wikipedia Waffle fabric（又稱honeycomb fabric；平紋格心周圍以長經緯浮線形成方形脊與凹陷）、Ashford〈The Squish is real〉（長浮線在方格上互鎖，脊是格的外框、凹格是交織較緊處，整理後浮線鼓起）與LinenMe waffle towel指南（凹格與凸脊；新布較平、洗後更明顯），並實看Wikimedia Commons〈An example of waffle fabric〉特寫（橫向脊較明顯、交點有圓結、格內凹陷）；Ashford與LinenMe頁面的圖片實看後只見織機與掛著的毛巾，沒有可讀的織構，不當作外觀依據。這些來源沒有格尺寸、脊高或經緯脊比例數字，所以14×16格（0.12m tile上約8.6×7.5 mm）、凹格寬度、橫／縱脊高0.9／0.7、碗深與交點結量都是作者近似；「橫脊較強」只是單張特寫的觀察，不是織物規格。不聲稱真實經緯交織、織紋圖、織物物理、吸水性或棉／亞麻／微纖維規格。獨立kernel：沒有逐格表，只有128² grain與8² cloud共16,448 Float64／131,584B tables，非總RAM；逐點兩次fract／abs與最多四個SmoothStep，無配置、hash、trig或sqrt，通用detail略過。0.12m nominal tile、0.012 UV-relative relief與冷灰白配色皆為作者近似；seed只移動細grain與雲狀明暗，格線與脊位不隨seed改變；維持opaque dielectric四maps、預設metallic 0、optional height、tint／repeats、Worker／cache與各自texture ownership；不新增mesh、透明孔洞、布料模擬、真實針織／梭織結構或規格認證。與既有`wafflecloth`（8×8對稱隆起邊框；實測縱／橫脊高只差約0.6%、交點不比脊高）屬同一織物家族，本材質只是較細的14×16近似變體：橫脊比縱脊高約0.08個relief單位、凹格為碗形、每個交點另有高出橫脊約0.10單位的結，且取材於不同參考，不應被視為新的織物類別。

使用root factory `await ProceduralMaterial.create('waffleweave', {size:512,seed:7,heightMap:true})`；預設material factor為0，`preset.createMaterial({metallic:1})`明確override，不改寫非金屬maps。Seed只改變細grain與雲狀明暗，格線與脊位固定；512圖解析圓脊、凹格碗面與交點結的normal，32只保留宏觀明暗與粗normal。移除consumer後才destroy preset及其own textures；借入的Worker pool與cache仍由caller管理。

`halite`（岩鹽）新增作者乳白立方hopper晶面近似：多數owner各有一片隨機旋轉的平齊正方形立方面，面內依序往內下陷兩層同心的正方階面，像hopper晶體的逐級凹面；晶面為乳白色低粗糙度，貼在淡灰粉色的粗糙鹽底上。它不是Calcite的75°斜方板、Celestine／Barite的長方形板、Wulfenite的近方板，也不是沒有階面的平整方塊。已讀Handbook of Mineralogy（等軸晶系、{001}完全解理、skeletal／hopper-shaped faces、純淨時無色或白色）與Minerals.net（立方體有時帶hopper生長），並實看其粉色hopper群與Death Valley白色立方群照片；這些來源沒有可讀的階面比例或深度數字，因此晶面半徑、兩層階面約0.74／0.44倍半徑（各±0.06）及每層0.08個height單位的下降都是作者近似，不聲稱量測或認證鹽晶尺寸、透明度、溶蝕物理或礦物種類。獨立kernel：16個seeded owner各存9個pose／階面值，加128² grain與16² host共16,784 Float64／134,272B tables，非總RAM；方形晶面最大支撐含jitter約0.4455小於0.5 owner；逐點一次旋轉與最多六個SmoothStep，無配置、hash、trig或sqrt，通用detail略過。0.08m nominal tile、0.004 UV-relative relief與配色皆為作者近似；維持opaque dielectric四maps、預設metallic 0、optional height、tint／repeats、Worker／cache與各自texture ownership；不新增mesh、透明、折射、晶格、溶解模擬或化學認證。與既有`bismuthhoppers`（4×4個旋轉方形晶面、六層金屬階面、金紫色、0.16 m tile）屬同一旋轉巢狀方形hopper家族；本材質只是白色非金屬鹽晶變體：兩層階面、較小的晶面半寬0.21–0.27（對0.34）、0.08 m tile與粗糙鹽底，不應被視為全新的晶體類別。

使用root factory `await ProceduralMaterial.create('halite', {size:512,seed:7,heightMap:true})`；預設material factor為0，`preset.createMaterial({metallic:1})`明確override，不改寫非金屬maps。Seed改變晶面位置、轉向與兩層階面比例；512圖解析晶面緣與階面normal，32只保留宏觀顏色與粗normal。移除consumer後才destroy preset及其own textures；借入的Worker pool與cache仍由caller管理。

`calcite`（方解石）新增作者乳白斜方解理板近似：多數owner各有一片平齊的斜方形板，兩組平行邊夾約75°，內有一片與外形平行、位置略偏的巢狀階面；板面為乳白色低粗糙度，貼在深褐粗糙礦底上。它不是Celestine／Barite的長方形板、Wulfenite的近方板，也不是Pyromorphite／Vanadinite的六角端面。75°是作者近似值：已讀Handbook of Mineralogy（解理{1011}完全）、Wikipedia與LibreTexts（rhombohedral解理、常見白色解理片）及Minerals.net透明冰洲石照片，這些來源沒有提供可讀取的面角數值，因此不聲稱量測或認證解理角、晶體光學、透明度或雙折射。獨立kernel：16個seeded owner各存10個pose／階面值，加128² grain與16² host共16,800 Float64／134,400B tables，非總RAM；板最大支撐含jitter約0.4692小於0.5 owner；逐點一次旋轉、一次斜交換算與最多四個SmoothStep，無配置、hash、trig或sqrt，通用detail略過。0.1m nominal tile、0.0035 UV-relative relief與配色皆為作者近似；維持opaque dielectric四maps、預設metallic 0、optional height、tint／repeats、Worker／cache與各自texture ownership；不新增mesh、透明、折射、晶格或化學認證。

使用root factory `await ProceduralMaterial.create('calcite', {size:512,seed:7,heightMap:true})`；預設material factor為0，`preset.createMaterial({metallic:1})`明確override，不改寫非金屬maps。Seed改變板位置、轉向與階面偏移；512圖解析板緣與階面normal，32只保留宏觀顏色與粗normal。移除consumer後才destroy preset及其own textures；借入的Worker pool與cache仍由caller管理。

`flangenuts`（六角法蘭螺帽）新增作者鋼製六角法蘭螺帽頂視近似：六個直平側的削角六角本體座在較低的圓形錐面法蘭上，中央為開放圓孔並露出較粗糙的深色鋼底；不是Hex Nuts的無法蘭外形，也不是Cap Nuts的封閉球冠。比例只取DIN 6923 M5–M20尺寸表與圖面趨勢：法蘭直徑dc約為對邊s的1.38–1.48倍，最小對角e約為1.10–1.115×s，最小孔徑da約0.60–0.67×s，法蘭面圖示為15°–30°；本材質法蘭／平邊約1.40、孔／平邊約0.68。16個seeded owner預存六條平面法線；16×12 plane值加96² grain共9,408 Float64／75,264B tables，非總RAM。法蘭半徑0.413小於0.5 owner；逐點為六個smooth平面乘積、一次hypot與少量SmoothStep，無配置、hash、trig或鄰格掃描，通用detail略過。0.08m nominal tile沿用Hex Nuts，0.03 UV-relative relief與配色是作者近似。整個tile含深色鋼底均為metallic1，root factory預設1，explicit factor0不改寫maps；不含底面鋸齒、完整3D螺帽、內螺紋、透明、鋼材硬度、防鏽或DIN／ISO認證。

使用root factory `await ProceduralMaterial.create('flangenuts', {size:512,seed:7,heightMap:true})`；預設material factor為1，`preset.createMaterial({metallic:0})`明確override，不改寫鋼面／背板maps。Seed改變螺帽轉向與細grain；512圖解析陡峭六角、孔與法蘭normal，32只保留宏觀顏色與粗normal。移除consumer後才destroy preset及其own textures；借入的Worker pool與cache仍由caller管理。

`capnuts`（六角蓋形螺帽）新增作者鋼製六角蓋形螺帽頂視近似：六個直平側與稍削角的六角本體、封閉圓形球冠與深色粗糙鋼底；不是Hex Nuts的貫穿圓孔。比例只取DIN 1587尺寸表的趨勢：圓冠直徑dk約為對邊s的0.93–0.96，最小對角e約為s的1.106–1.113，並以較低高度的30度削角環近似角隅。16個seeded owner預存六條平面法線，constructor算一次；16×12 plane值加96² grain共9,408 Float64／75,264B tables，非總RAM。削角半徑0.421小於0.5 owner；逐點只有六個smooth平面乘積、一次hypot、少量平方／SmoothStep，無配置、hash、trig或鄰格掃描，通用detail略過。0.08m nominal tile沿用Hex Nuts，0.03 UV-relative relief、dome crown與配色皆是作者近似，非實際螺帽尺寸、螺紋、防鏽或材質認證。整個tile含深色鋼底均為metallic1，root factory預設1，explicit factor0不改寫maps；不含完整3D螺帽、內螺紋、透明、鋼材硬度、DIN／ISO認證或真實鋼材數據。

使用root factory `await ProceduralMaterial.create('capnuts', {size:512,seed:7,heightMap:true})`；預設material factor為1，`preset.createMaterial({metallic:0})`明確override，不改寫鋼面／背板maps。Seed改變螺帽轉向與細grain；512圖解析陡峭bevel／球冠normal，32只保留宏觀顏色與粗normal。移除consumer後才destroy preset及其own textures；借入的Worker pool與cache仍由caller管理。

`bedfordcord`（貝德福德燈芯布）新增作者卡其色經向織入凸棱表面近似：20條垂直棱各由24行扁平緯向短棱組成，相鄰棱交錯半個行距，棱間以連續細溝隔開，棱身低於短棱、溝更低；不是Corduroy的割絨絨條，也不是Ribknit針織圈、Faille／Grosgrain橫向緯肋或逐紗draft浮點。新增獨立case而非塞入既有經緯逐紗kernel：每點只做floor／fract、平方與SmoothStep組合，無配置、hash、trig、sqrt或鄰格掃描，通用detail略過。20×24個短棱tone table與96² grain共9,696 Float64／77,568B，非總RAM；短棱支撐半寬0.45／0.46小於0.5 owner。seed只改短棱色調與細grain，棱距、列距與交錯固定。0.07m nominal tile、0.0018 UV-relative relief、20棱／24列與khaki palette均是作者近似，非布重量、紗支或照片比例校準；金屬maps與root factory預設均0，explicit factor1不改寫maps。不含真實經緯／襯紗交織、布料物理、透光、毛羽、纖維mesh或棉布規格／來源認證。

使用root factory `await ProceduralMaterial.create('bedfordcord', {size:512,seed:7,heightMap:true})`；`preset.createMaterial({metallic:1})`明確override預設factor0，不改寫非金屬maps。不同seed只改短棱色調與細grain，不改變棱格。實際512圖解析淺色交錯短棱，32保留宏觀顏色與極低幅normal。移除consumer後才destroy preset及其own textures；借入的Worker pool與cache仍由caller管理。

`staurolite`（十字石）新增作者深褐色60°交叉雙柱側面近似：兩組直平側、鈍平端的柱形輪廓連成四臂，交叉處共用平坦頂面而非堆疊兩倍高度；淺色粗顆粒礦底與較低roughness晶面均為不透明非金屬。16個seeded owner預存雙軸cos／sin、中心、inverse scale與tint，constructor計算相對角；16×8 poses加128²grain共16,512 Float64／132,096B tables，非總RAM。每軸support上界hypot(0.32,0.07)×0.98＋0.07＝0.391016＜0.5，逐點無配置、hash、trig、sqrt或鄰格掃描，略過通用detail。0.12m nominal tile、0.0035 UV-relative relief與60°UV交角是作者表面近似，非晶體尺寸校準；不含完整晶柱mesh、片岩片理、透光折射、礦物鑑定或化學／收藏品認證。

使用root factory `await ProceduralMaterial.create('staurolite', {size:512,seed:7,heightMap:true})`；`preset.createMaterial({metallic:1})`明確override預設factor0，不改寫非金屬maps。實際512圖解析淺邊，32保留宏觀顏色與低幅normal，不代表相同細邊解析度。移除consumer後才destroy preset及其own textures；借入的Worker pool與cache仍由caller管理。

`dowelpins`（無頭圓柱定位銷）新增作者銀色實心無螺紋銷的側影：平行直軸、一端圓弧端、對端小導入倒角與淺橫向圓柱冠面；沒有Clevis Pins凸頭／尾孔、Linchpin閉環或平鍵平坦面。重用Clevis Pins的seeded pose／smooth cover／crown核心，constructor選擇無頭無孔分支並預算端曲率，不計算被略過的head／hole profile；不另造pin kernel。16×6 poses加96²grain仍為9,312 Float64／74,496B tables，非總RAM，不新增table。最大旋轉支撐hypot(0.36,0.095)×0.95＋0.016＝0.369708＜0.5 owner；逐點無配置、hash、trig、sqrt或鄰格掃描，空底略grain、通用detail略過。鋼面metallic1／不透明灰色非金屬背板0，default material factor1／explicit0；0.12m nominal tile、0.0032 UV-relative relief與比例為作者近似，非DIN尺寸或硬度校準。保留四maps／optional height、tint／repeats、Worker／cache與獨立texture ownership，不生成完整圓柱mesh、透明、拔出螺孔、壓入／配合物理、負載、防鏽或DIN／ISO認證。

使用root factory `await ProceduralMaterial.create('dowelpins', {size:512,seed:7,heightMap:true})`；`preset.createMaterial({metallic:0})`明確override預設factor1，不改寫鋼／非金屬背板maps。移除consumer後才destroy preset及其own textures。

`europeanbeech`（歐洲山毛櫸）新增作者淡粉褐細直紋徑切面、密而均勻的淺凹縱導管與短小平齊射線斑，不是White Ash早材集中粗孔、White Oak寬長射線或凸木瘤。重用既有White Ash／White Oak的cached-noise／compact vessel／curved-ray核心，令早晚材孔寬與機率相同、降低帶狀色差，constructor-only pore jitter減輕規則列格；射線只改顏色／finish並遮去導管，不額外抬高height。48×24×4孔、6×18×6射線與4×3、96×4、128² noise共22,036 Float64／176,288B tables，非總RAM；孔支撐含jitter為X≤0.445、Y≤0.485 cell，射線X≤0.42、Y≤0.25844，皆小於0.5 owner。逐點無配置、hash、trig、sqrt或鄰格掃描，略過通用detail。0.24m nominal tile、0.0012 UV-relative relief、色彩與密度為作者近似，非木材尺寸或孔徑校準。保留opaque dielectric M0／explicit override、四maps／optional height、tint／repeats、Worker／cache與個別texture ownership；不新增木孔mesh、透光、木種鑑定、蒸煮／化學、防水、結構或來源認證。

使用root factory `await ProceduralMaterial.create('europeanbeech', {size:512,seed:7,heightMap:true})`；`preset.createMaterial({metallic:1})`明確override factor，不改寫dielectric maps。移除consumer後才destroy preset及其own textures。

`habotai`（羽二重平織絲綢）新增作者珍珠白細密1/1平織面、相同染色的經緯紗、低交織起伏與柔和光澤；不是霧面Batiste棉布、Surah斜紋、Sateen長浮紗或Shantung不規則粗節。重用既有balanced-plain核心與平滑紗肩，只新增preset／constructor分派；僅128²grain共16,384 Float64／131,072B tables，非總RAM，不新增float table。逐點無配置、hash、trig或sqrt，略過通用detail；84／84紗與336／336 filament shading、0.04m nominal tile及0.0002 UV-relative relief為作者選樣，非實際織物密度或厚度校準。珍珠白與低roughness形成柔和反光，並非新增各向異性絲綢BRDF；保留opaque dielectric M0／explicit override、四maps／optional height、tint／repeats、Worker／cache與個別texture ownership。真Habotai可有薄透型態，本preset只選不透明表面近似，不新增透光、皺褶／毛絲mesh、布料物理、momme／纖維成分或保存性能認證。

使用root factory `await ProceduralMaterial.create('habotai', {size:512,seed:7,heightMap:true})`；`preset.createMaterial({metallic:1})`明確override factor，不改寫dielectric maps。移除consumer後才destroy preset及其own textures。

`azurite`（藍銅礦）新增作者深藍色、寬板柱狀的斜端平坦晶面，局部三片平行、群組各自轉向，晶面帶淺縱紋並高於深色粗礦底；不是Cavansite放射短針、Kyanite細長高起刀片或Wulfenite近方橙板。重用既有Celestine／Barite／Kyanite的seeded plate kernel，只新增profile，不另造晶體核心；25×6 poses加128²grain共16,534 Float64／132,272B tables，非總RAM。旋轉支撐hypot(0.23,0.3446)×0.975＋0.025＝0.428948＜0.5 owner；逐點無配置、hash或鄰格搜尋，沿用一個既有縱紋cosine，略過通用detail。板面是低roughness的opaque dielectric M0，不把照片白色鏡面反射烘焙成金屬或白色染料。0.1m nominal tile、0.0034 UV-relative relief、色彩與晶群密度為作者近似。保留四maps／optional height、tint／repeats、Worker／cache與獨立texture ownership；不新增完整晶柱／晶群mesh、透明折射、pleochroism、晶體生長、礦物／化學或含銅安全認證。

使用root factory `await ProceduralMaterial.create('azurite', {size:512,seed:7,heightMap:true})`；`preset.createMaterial({metallic:1})`是明確factor override，不改寫dielectric maps。移除consumer後才destroy preset及其own textures。

`whiteoak`（徑切白橡木）新增作者暖橄欖褐木面、橫過直木紋的寬長平齊射線斑，以及較淺的縱向凹導管；不同於White Ash無寬射線斑、Lacewood細密鱗斑及凸起木瘤。重用White Ash的環孔材／cached noise核心，只為White Oak加入18組六值曲線射線table，共18,680 Float64／149,440B tables，非總RAM。射線支撐含jitter為X≤0.46、Y≤0.47124 cell，均小於0.5 owner；取樣無配置、hash、trig、sqrt或鄰格掃描，通用detail略過。射線只改顏色與finish，完整射線遮去導管、不額外抬高height；微grain與凹導管才形塑法線。0.24m nominal tile、0.0016 UV-relative relief、色彩與密度是作者近似，並非木材標本校準。保留opaque dielectric M0／explicit override、四maps／optional height、tint／repeats、Worker／cache與個別texture ownership；不新增木孔mesh、透光、木種鑑定、樹脂化學、防水、結構或來源認證。

使用root factory `await ProceduralMaterial.create('whiteoak', {size:512,seed:7,heightMap:true})`；`preset.createMaterial({metallic:1})`是明確factor override，不改寫dielectric maps。移除consumer後才destroy preset與其own textures。

`clevispins`（有頭連接銷）新增作者銀色無螺紋圓柱銷的側影：短頭在軸兩側凸出，對端保留單一封閉圓形橫孔；軸面有淺圓冠，沒有Linchpin閉環、R-clip彎線、Gib-head單側凸頭或平鍵實心端。獨立kernel沿既有seeded pose／smooth cover慣例，以短矩形頭及帶小端倒角的直軸聯集，再扣圓孔；16×6 poses加96²grain共9,312 Float64／74,496B tables，非總RAM。最大旋轉支撐sqrt(0.38²＋0.18²)×0.95＋0.016＝0.415452＜0.5 owner；逐點無配置、hash、trig、sqrt或鄰格搜尋，空底與全孔略grain、通用detail亦略。鋼面metallic1／opaque孔底與背板0，default material factor1／explicit0；0.12m nominal tile、0.0032 UV-relative relief與比例是作者近似，不是DIN量測。保留四maps／optional height、tint／repeats、Worker／cache及獨立texture ownership；不生成完整圓柱／通孔mesh、透明、插入split pin／R-clip裝配、轉軸物理、負載或規格認證。

使用root factory `await ProceduralMaterial.create('clevispins', {size:512,seed:7,heightMap:true})`；`preset.createMaterial({metallic:0})`是明確factor override，不改寫map。移除全部consumer後才destroy preset與其own textures。

`whipcord`（鞭繩斜紋布）新增作者深灰色單條粗斜脊與同色經緯紗：選用3/1經面連續三pick長浮紗、較低的單點緯紗接結、稠密經紗與較疏緯紗，約72°斜紋；不是現有Gabardine的細短斜紋、Cavalry Twill雙脊、平紋、橫向Grosgrain或剪絨Corduroy。重用既有profiled-weave／whole-float tables與平滑紗肩，不建立第二套織布kernel；4×4×6 profiles及128² grain共16,480 Float64／131,840B tables，非總RAM。取樣無配置、hash、trig或sqrt，略過未使用的通用detail noise；0.06m nominal tile、0.0016 UV-relative relief、紗數／染色為作者近似，3/1不是所有Whipcord的規格。保留opaque dielectric M0／override1、四maps／optional height、tint／repeats、Worker／cache及個別texture ownership，不新增透光、毛羽／布料mesh、異向性反射或服裝物理。

以root公開`ProceduralMaterial.create('whipcord', {size:512,seed:7,heightMap:true})`建立preset，再用`preset.createMaterial({finish:{heightScale:0.0016}})`明確選擇POM；未選擇即不啟用，銷毀前移除全部consumer，材質不轉移texture ownership，不是布料位移或碰撞。

`vanadinite`（釩鉛礦）新增作者橙褐色凸六角晶緣、單一內縮六角凹面與較暗平坦不透明底，散布在淡色粗礦底；不是 Pyromorphite／Red Beryl 的實心平頂、四角 Bismuth hopper、尖晶或透明管。獨立 kernel 沿既有平滑六角 half-plane／seeded pose 慣例，分別平滑外緣與較小同向內凹 cover，不以 max／abs 徑向距離製造內接縫。5×5×6 poses、8² cloud、128² grain 共16,598 Float64／132,784B tables，非總 RAM；支撐(0.24＋0.05)/sqrt(0.75)＋0.06＝0.394863＜0.5 owner。取樣無配置、hash、trig、sqrt 或鄰格搜尋，並略過通用 detail noise；0.1m nominal tile、0.0038 UV-relative relief、色彩與密度是作者近似。維持 opaque dielectric M0／明確 override、四maps／optional height、tint／repeats、Worker／cache 與各自 texture ownership；只選凹晶端，不新增完整晶柱／群晶 mesh、透明折射、晶體生長／成因、化學／XRD、來源或含鉛安全認證。 使用 `await ProceduralMaterial.create('vanadinite', { size: 512, seed: 7, heightMap: true })`；移除 consumers 後再 destroy preset 及其擁有的 textures。

`tabwashers`（單外舌止動墊圈）新增銀色平坦圓環、封閉圓孔與唯一向外延伸的直邊平舌；圓環／舌片共面，不是 split lock、內齒、球面或杯形墊圈。獨立 kernel 沿用 seeded pose／compact cover 慣例，以平滑圓面與矩形 cover 聯集再扣除圓孔；4×4×6 poses 加96² grain，共9,312 Float64／74,496B tables，非總 RAM。最遠支撐 sqrt(0.43²＋0.09²)×0.95＋0.02＝0.437352＜0.5 owner。逐點無配置、hash、trig、sqrt 或鄰格搜尋，空背板略過 grain，也略過通用 detail noise。鋼面 metallic 1／opaque 孔與背板0，預設材質 factor 1／明確 override 0；height／roughness／AO 共用 cover。0.1m nominal tile、0.0028 UV-relative relief、比例與色彩是作者近似，非 DIN 尺寸。保留四 maps／optional height、tint／repeats、Worker／cache 與各自 texture ownership；不新增 mesh 通孔、透明、彎舌／螺母裝配、防鬆力學、負載或規格符合認證。 使用 `await ProceduralMaterial.create('tabwashers', { size: 512, seed: 7, heightMap: true })`；先移除 consumers，再 destroy preset 與其擁有的 textures。

`whiteash`（白蠟木）新增淺暖褐直紋縱切面：平齊生長帶中的早材導管較粗且集中，晚材導管細疏；只有長向開口凹入、變暗且較粗糙，不是深色條紋木換色、端面圓孔、凸木肋或橡木寬射線。獨立 kernel 沿用 compact vessel／cached periodic noise 慣例，32×14×4 pore cache 加 4×3 warp、96×4 fiber、128² grain，共18,572 Float64／148,576B tables，非總 RAM；pore 的局部 x 支撐在0.2–0.8、y 在0.02–0.98內，平滑 warp 不切斷 owner。逐點無配置、hash、trig、sqrt 或鄰格搜尋，並略過未使用的通用 detail noise。0.24m nominal tile、0.0018 UV-relative relief、色彩與密度是作者近似，不是照片量測。維持 opaque dielectric／metallic 0、optional height、tint／repeats／明確因子 override、Worker／cache 與獨立 texture ownership；不提供木板／樹 geometry、透明孔洞、木材物性、樹種／來源或合法採購認證。 使用 root factory `await ProceduralMaterial.create('whiteash', { size: 512, seed: 7, heightMap: true })`；移除 consumers 後 destroy 回傳 preset 及其擁有的 textures。

`gibheadkeys`（鉤頭錐鍵）選作者銀色實心鉤頭錐鍵的平坦側視輪廓：同一平面上一端有凸起、外端斜削的鉤頭，單側垂直階差連到略呈1:100斜度的直條鍵身；不是雙圓端 parallelkeys 或半月 Woodruff 鍵。4×4 組小幅旋轉／jitter／縮放 pose 共 96 值，加 96² grain，共 9,312 Float64／74,496B tables，僅為 table 預算、非總 RAM；最遠支撐 sqrt(0.42²＋0.2²)×0.97＋0.025＝0.476232＜0.5，不越 owner。取樣無配置／hash／trig／sqrt／鄰格掃描，空背板略過 grain；金屬面、height、roughness 與 AO 同 cover 混合，metallic 圖為鋼面1／opaque 背板0，預設材質 factor 1。0.2m nominal tile、0.0022 UV-relative relief 及銀色 palette 為作者近似，非尺寸、配合或標準量測。維持四 maps、optional height、tint／repeats／Worker／cache 與獨立 texture ownership；不新增完整3D鍵身／頂面、鍵槽／輪轂配合或拔出動作、公差、材料／負載額定或標準符合認證。 使用 root factory `await ProceduralMaterial.create('gibheadkeys', { size: 512, seed: 7, heightMap: true })`，不再需要時 destroy 回傳材質及其擁有的 textures。

`grosgrain` 選作者灰藍羅緞表面：細密縱向經線逐根交錯較寬的單條圓凸橫肋，肋面往兩側平滑下降，保留交叉抬升、細纖維與低凹不透明紗隙；不是 Faille 的寬平緯棱、Poplin 的較淺肋冠、Ottoman 成對粗棱、平衡平織、開網或緞面長浮紗。只擴充既有連續紗線 constructor 的 crown 選擇，整個逐點 evaluator 逐字不變，無新增逐點配置、hash、三角函數、搜尋或 runtime 依賴。參數集中 `src/data/materials.ts`；重用 128² grain 的 16,384 Float64／131,072B tables，非總 RAM；經／緯支撐 0.21／0.46＜0.5 owner，lift 在 owner 邊界前平滑歸零。0.025m nominal tile、0.00045 UV-relative relief、密度與配色均為作者近似，非照片／紡織量測。維持 opaque dielectric、預設 metallic=0、明確因子 override、height／tint／repeats、Worker／cache 及各自 texture ownership；不新增布邊／緞帶 mesh、Petersham 波浪邊、透明、垂墜／挺度／強度物理、各向異性或聚酯／纖維成分／厚度／洗滌認證。 使用 root factory `await ProceduralMaterial.create('grosgrain', { size: 512, seed: 7, heightMap: true })`，不再需要時 destroy 回傳材質及其擁有的 textures。

`pyromorphite` 選作者黃綠色磷氯鉛礦的平坦六角晶體端面，散布於淡色粗顆粒礦底：端面凸起、較滑，保留六邊直線、不同方向／大小與近乎平坦頂面；不是綠色 Smithsonite 葡萄狀圓頂、紅色 Red Beryl、圓斑或方晶片。本 preset 只近似六角柱的端面，不生成完整稜柱／桶狀晶體、針晶、晶簇 mesh 或透明折射。完整重用既有 Red Beryl constructor／逐點 evaluator，只以 kind 選 preset，不新增逐點配置、hash、三角函數或搜尋。6×6×8 poses 加 8² cloud 與 128² grain，共 16,736 Float64／133,888B tables，非總 RAM；最遠支撐 (0.18＋0.13)/sqrt(0.75)＋0.10=0.457958＜0.5，不越 owner。0.1m nominal tile、0.0048 UV-relative relief 與黃綠配色為作者近似，不是標本色彩／尺寸量測。維持 opaque dielectric、預設 metallic=0、height／tint／repeats／明確因子 override、Worker／cache 與獨立 texture ownership；不提供化學／XRD 鑑定、礦物成因／來源或含鉛安全認證。

`kingwood` 選作者深紅褐心材的磨光近直縱切面：不等寬紫黑細縱紋與木底平齊，只有稀疏短導管較凹、暗、粗；不是奶油粉紅 Brazilian Tulipwood、琥珀褐 Macassar、純紫 Purpleheart、等寬 pinstripes、凸木肋或照片中的山形／節眼／黃色邊材。只擴充既有 Macassar／Tulipwood／Zebrawood／Bocote constructor 的 fineStreaks／streakPreset 選擇，完整逐點 evaluator 逐字不變，不新增逐點配置、hash、三角函數或搜尋。參數集中 `src/data/materials.ts`；32×20×4 pore cache 加 32×4 warp、36×4 width、64×4 fiber 與 128² grain，共 19,472 Float64／155,776B tables，非總 RAM。最寬 band support 0.3×(0.18＋1.25)=0.429＜0.5，pore 的 x support 在 0.17–0.83、y 在 0.08–0.92 cell 內，owner 不截斷。0.24m nominal tile、0.0016 UV-relative relief 與染色為作者近似，非木紋量測。維持 opaque dielectric、預設 metallic=0、height／tint／repeats、Worker／cache 與獨立紋理銷毀；不提供木板／樹 mesh、老化／油脂／物性／毒性、現行法規／合法採購、來源或木種認證。

`faille` 是象牙白平紋橫棱織物：細密經紗與較寬、較平的單根緯棱逐根一上一下交錯，保留低凹不透明紗隙、真實交叉抬升及細纖維；不是 Ottoman 的成對粗棱，也不是平衡經緯的 batiste。新材質只在既有連續紗線 sampler 的建構期選擇較平緯冠；整個逐點 evaluator 原樣重用，沒有新增逐點配置、hash、三角函數或搜尋。顏色、粗糙度、relief、紗線密度／支撐與緯冠均在 `src/data/materials.ts`，名義 tile 為 0.03 m，不是實測密度或纖維尺寸。維持 opaque、預設 metallic=0、可覆寫因子、height／tint／repeat、Worker／cache 與各自紋理銷毀契約；不提供透布、布料厚度／垂墜模擬、各向異性或纖維成分認證。

`celestine` 選作者淡藍色平坦寬板狀天青石與中性粗礦底：5×5組各三片局部平行、錯開端部的凸晶面，比礦底亮滑；不是奶油Barite、橙色近方Wulfenite、深藍細長三條raised striae的Kyanite或圓帽。只加kind／preset選擇，完整既有Barite／Kyanite evaluator逐字不變，保既有stria cosine，不新增逐點配置／hash／鄰格搜尋或runtime依賴；802舊kind32px四maps與七相鄰礦材32／512三seed五maps逐byte不變。25×6 cached poses＋128² grain共16,534 Float64／132,272B tables，非總RAM；最遠角點sqrt((0.18＋0.083)²＋(0.27＋0.12×0.083)²)×0.96＋jitter0.04＝0.408754＜0.5，owner切換不截斷板面。0.1m nominal tile、0.0025 UV-relative relief及淡藍palette為作者近似，不是標本量測、m晶片厚度或校準礦物光學。Opaque M0、optional height／tint／repeats／Worker／cache及獨立texture ownership不變；不新增transmission／refraction、真晶洞／晶簇mesh、纖維狀／prismatic形、元素／鑑礦／來源／價值或安全認證。 使用root factory `await ProceduralMaterial.create('celestine', { size: 512, seed: 7, heightMap: true })`，不再需要時destroy回傳材質及其擁有的textures。

`braziliantulipwood` 選作者磨光巴西鬱金香木縱切面：奶油黃底與不等寬粉紅紅色近直縱紋維持平齊，只有稀疏短導管較凹、暗、粗；不是美洲Tulip Poplar、Macassar黑紋、橫紋、等寬pinstripes或凸木肋。完整沿用Macassar／Zebrawood／Bocote核心，只在constructor選fineStreaks與streakPreset／warp cache尺寸，逐點evaluator逐字不變；801舊kind32px四maps及七相鄰木材32／512三seed五maps逐byte不變，不增逐點配置／hash／trig／sqrt或runtime依賴。32×20×4 pore poses、24×4 warp、28×4 width、64×4 fiber及128² grain共19,408 Float64／155,264B tables，非總RAM；pore半寬至0.08＜0.25 owner margin、半長至0.27＜0.35，compact C1 shoulders與整數periodic caches保signed UV。0.12m nominal tile、0.0016 UV-relative relief與pink／cream palette為作者近似，非標本量測、m厚度或材種鑑定。Opaque M0、optional height／tint／repeats／Worker／cache及獨立texture ownership不變；不新增整塊板材／樹木mesh、老化／油脂／硬度／毒性、法規／來源／價值或合法採購認證。 使用root factory `await ProceduralMaterial.create('braziliantulipwood', { size: 512, seed: 7, heightMap: true })`，不再需要時destroy回傳材質及其擁有的textures。

`batiste` 選作者象牙白細棉平織面：60×60條均衡經緯以一上一下交織、240×240微纖維帶細緻normal，兩軸同色同高度、交點上浮、紗間不透明凹底；不是Poplin橫肋、Ramie較深粗凹凸、長浮緞、印色方格、紗網真洞或起毛絨。沿用完整連續紗核心，只把constructor ramie旗標正名balancedPlain並選preset；逐點evaluator逐字不變，800舊材質32px四maps及七相鄰織物32／512三seed五maps逐byte不變。僅128² noise共16,384 Float64／131,072B tables（非總RAM），不配置float-profile／pose表或增加逐點配置／hash／trig／sqrt。偶數60條、整數240fibers／128grain維持signed UV period；radius0.42＜0.5、lift shoulder在owner邊界前歸零。0.04m nominal tile、0.0002 UV-relative relief與roughness0.72為作者近似，不是量測紗支／克重、物理厚度或絲光處理。Opaque M0、optional height／tint／repeats／Worker／cache與獨立texture ownership不變，不新增半透明透光、布片／皺褶／蕾絲mesh、異方性BRDF、洗滌／透氣／纖維或安全認證。 使用root factory `await ProceduralMaterial.create('batiste', { size: 512, seed: 7, heightMap: true })`，不再需要時destroy回傳材質及其擁有的textures。

`wulfenite` 選作者橙色近方形板狀鉬鉛礦：不等大小、分散方向的平坦凸晶面比深褐粗礦底較亮、較滑，不是圓頂、窄藍blade、規則三片Barite或印色方塊。獨立leaf沿用cached seeded poses／periodic noise／smooth compact shoulders，7×7 sites各七個Float64，加128² grain與16² host共16,983 Float64／135,864B tables（非總RAM）；chance0.68不保證每seed相同晶數。最大旋轉角點支撐sqrt(0.22²＋(0.22×1.08)²)＋jitter0.16＝0.483812＜0.5，owner切換不截斷晶面；肩部以平方距離smooth乘積形成，中心無abs cusp，逐點不配置、不hash、不trig／sqrt或掃鄰格，constructor預存倒平方、方向與tone。0.06m nominal tile、0.003 UV-relative relief及橙palette為作者參考，不是標本尺寸、m單位晶片厚度或校準光學。Opaque M0、optional height、tint／repeats／cache／native Worker及獨立texture ownership沿用原契約，不新增透明／折射、真晶體／礦簇mesh、雙錐形、鉛化學／毒性或礦物／產地／價值／安全認證。 使用root factory `await ProceduralMaterial.create('wulfenite', { size: 512, seed: 7, heightMap: true })`，不再需要時destroy回傳材質及其擁有的textures。

`lignumvitae` 選作者深橄欖褐磨光癒創木縱切面：細密長木理與柔和交錯明暗維持平齊，只有稀疏短導管較凹、較暗、較粗糙；不是金褐Iroko、鮮紅Bloodwood、紫色Purpleheart或誇張斑馬條紋。沿用完整Iroko／細木理核心，只增constructor kind／preset選擇及未用generic detail排除，逐點evaluator逐字不變；798舊kind四maps與七個相鄰木材的32／512三seed五maps逐byte不變，不新增逐點配置／hash／trig／sqrt或runtime依賴。32×20×4 pore poses、3×4 warp、256×10 fiber與128² grain共21,516 Float64／172,128B tables，非總RAM。最大pore半寬0.06小於0.25 owner margin，半長0.21小於0.35；band支撐0.46＜0.5、整數5 bands與periodic caches維持C1及signed UV週期。0.12m nominal tile、0.002 UV-relative relief、roughness0.32及olive-brown palette為作者參考，非木纖維尺寸、m單位厚度或量測光澤。Opaque M0、optional height、tint／repeats／cache／native Worker及獨立texture ownership不變；不新增木材／導管mesh、透明孔洞、油層／清漆層或方向性BRDF，不認證木種、端面解剖、Guaiacum／替代材鑑定、油脂／密度／自潤滑物性、產地或合法採購。 使用root factory `await ProceduralMaterial.create('lignumvitae', { size: 512, seed: 7, heightMap: true })`，不再需要時destroy回傳材質及其擁有的textures。

`sateen` 選作者象牙白、五枚緯面棉緞：5×5組織內每列／每欄一個孤立經組織點，以2步飛數分散接結，其餘四格為跨四根經紗的連續緯浮長；不是鄰接斜紋、平織、逐交點凸珠或既有紫色經面Satin。只在constructor選preset，將原fineTwill旗標正名為fineCloth以涵蓋緞組織，完整逐點evaluator不變；797舊材質32px四maps與七個相鄰織物32／512三seed五maps逐byte不變。55×55紗、220×220微纖維與5×5×6 float profiles加128² grain共16,534 Float64／132,272B tables，非總RAM；55為5的倍數使draft在UV接縫閉合，且避免最低32px的all-gap alias，沒有依解析度特判。支撐半徑0.495＜0.5、連續浮長與C1紗肩沿用既有核心，不新增逐點配置／hash／trig／sqrt或runtime依賴。0.04m nominal tile、0.0008 UV-relative relief、象牙白與roughness0.45為作者參考，不是量測紗密、厚度、校準染色或光澤。保持opaque M0、optional height、tint／repeats／cache／native Worker及獨立texture ownership；不新增紗線／布片mesh、透射、垂墜物理或方向性BRDF，不認證棉含量、纖維、織物等級、整理工藝或耐久。 使用root factory `await ProceduralMaterial.create('sateen', { size: 512, seed: 7, heightMap: true })`，不再需要時destroy回傳材質及其擁有的textures。

`parallelkeys` 近似雙圓端Form A平鍵的俯視外觀：銀灰實心長條具有平坦寬面、平行側邊與兩端圓弧，平滑邊肩連到暗色較粗糙的非金屬底，不是圓柱、橢圓、方端棒、空心環或Woodruff半月鍵。沿用既有硬體的seeded pose與cached grain模式，以到直線段的平方距離形成有界capsule支撐；逐點不配置、不hash、不trig或sqrt，沒有新增runtime依賴。4×4 poses各六個Float64加96² grain，共9,312 Float64／74,496B tables（非總RAM）；最長旋轉支撐乘最大scale再加jitter上界0.399525＜0.5，owner切換不截斷平鍵。0.12m nominal tile與0.003 UV-relative relief為作者參考，不是CAD尺寸或m單位displacement。金屬頂面與M0底保持分離，factory的metallic factor預設1以保留map，明確override0仍有效；保持opaque四maps、optional height、tint／repeats／cache／native Worker及獨立texture ownership。不新增平鍵mesh、keyway裝配或力學，不認證DIN尺寸／公差、C45鋼種、熱處理、扭矩或安全。 使用root factory `await ProceduralMaterial.create('parallelkeys', { size: 512, seed: 7, heightMap: true })`，不再需要時destroy回傳材質及其擁有的textures。

`smithsonite` 選取作者蘋果綠葡萄狀菱鋅礦外觀：不等距圓頂連生成一層有界凸礦殼，圓頂較亮、較滑，凹隙則是較暗、較粗糙的綠底；不是平面綠斑或天藍／淺色凹隙的Hemimorphite。沿用完整平滑連生圓頂核心，只在constructor選preset並排除未用generic detail，不增加逐點配置、hash、trig、sqrt或runtime依賴。0.12m nominal tile與0.006 UV-relative relief均為作者參考，不是實測晶粒尺度或m單位displacement。維持opaque M0及既有height／tint／repeats／cache／native Worker與獨立texture ownership；未增加透射、折射、色散、clearcoat或晶體mesh，也不認證礦物鑑定、化學、產地或物性。 從root使用 `await ProceduralMaterial.create('smithsonite', { size: 512, seed: 7, heightMap: true })`；不再需要時destroy回傳材質及其獨立擁有的textures。

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

`basswood`（淺米色細密直木理椴木）近似選定Tilia americana未塗裝細砂磨縱向木面：均勻淺米白／淡褐色、低對比長直木理與淺micrograin，不是所有Tilia、端木解剖、粗黑導管、橫向curl、節疤、塗層或物種鑑定。已實讀Wood Database並實看raw／finished兩圖，只選raw外觀；來源實際稱diffuse-porous與endgrain medium／very numerous vessels，平滑縱面近似不等於樹種無孔。直接fallthrough重用正式NickelSilver兩cached affine field，只在constructor選p：96×4縱向長grain＋128² micrograin共16,768 Float64／134,144B為lattice算術預算，非總RAM／texture cache。較低pigment與relief係數、不同長grain方向與奶米色palette不是把金屬factor改0而保留原橫刷紋；既有NickelSilver全部鍵／值與point算術順序不變。每點兩cached lookups、無新逐點配置／hash／trig／sqrt／kind branch／neighbor scan，不引入zero-curl的Anigre無用欄位／第三cache或第二合成器。細grain的color／roughness與極淺height為砂磨木面shading，不是coarse grooves／凸條、true grain fiber或displacement。0.10m nominal tile與0.0012 UV relief作者選定，不是照片量測厚度；金屬map與default／createMaterial factor0、AO1／mortar0、四張opaque default maps與optional height沿用options／tint／Worker／cache／repeats／ownership。無runtime依賴／mesh／coatshader／木材物理、聲學、硬度、健康或解剖認證。 實際512 normal的極淺signed slope主要量化至127／128相鄰byte，不誇稱可解析較大凹凸；以raw height斜率方向交叉檢查normal、非放大relief換取視覺。

`sphericalwashers`（凸球面朝上的不鏽鋼球面墊圈）近似選定form-C-style銀色完整圓環，刻意翻面展示向外遞降的凸球形座面；正常裝配朝上的平bearing面、配對D／G凹錐座、cupwasher向外升高的直錐壁與wavewasher三波起伏均不是此surface。Halder實際不鏽鋼產品圖及剖面已查看：剖面明示球面在正常裝配下方，故此kind必須明記翻面而非把flat top錯稱convex。25個固定中心owners只cache單環tone及128² grain，共16,409 Float64／131,272B field-table算術預算，非總RAM／texture cache。沿用正式annular squared-radius C1內外肩、低opaque dielectric背底及cachedNoise模式，真正球面採sqrt(R²-q)而非拋物面／反向cup cone／torus；幾何不同而保留短獨立case，不替舊cup熱路徑加profile dispatch或新closure。只在非空金屬面計一次必要sqrt及一次grain lookup，沒有逐點配置／hash／trig或鄰格掃描；R0.54大於outer0.36，整個支撐內根號項≥0.162，外支撐到owner半寬0.5留0.14。grain只改pigment／roughness，不把球面刻成同心槽；內高外低的完整金屬面M1、圓孔及背底M0、C1部分覆蓋與AO0.3／0.95相干，default與createMaterial factor1保留authored B。0.10m nominal tile及0.025 UV relief為作者選定、不是DIN尺寸或量測厚度。四張opaque default maps與optional height沿用options／tint／Worker／cache／repeats／ownership，不新增mesh真孔／knurled側壁／透光／配對零件／傾角補償／夾緊或接觸力學；沒有牌號／耐蝕／硬度／負載／DIN認證或照片打包。

`mungbeans`（綠種皮、深綠圈白種臍乾綠豆）近似選定完整乾燥綠豆的種臍朝上表面：綠色種皮、窄深綠環及較長乳白種臍，不是奶白黑眼豇豆、紅豆、黑吉豆Vigna mungo、黃分瓣豆／熟豆／綠莢／芽。已實看USDA／APHIS SeedImages三豆原圖，來源稱cylindrical至rhombic、常有壓平端面；此preset採平滑圓橢圓凸帽的stylized approximation，不冒稱精準重建截平端面／wrinkle／dust-layer微結構或完整volume。直接fallthrough共享正式eye-pigmented bean sampler、constructor只選p，36格各cos／sin／底色三值與5×7 coat／128² grain共16,527 Float64／132,216B的field-table算術預算，非總RAM／texture cache。最大半長0.32小於owner半寬0.5、餘0.18；foreground兩cached lookups、低opaque背底早return，無新逐點配置／hash／trig／sqrt／kind branch／neighbor scan。halo與種臍只變pigment、不刻槽／穿孔／裂豆／凸種阜，height只為完整凸種皮，AO前景0.98、背底0.3；眼紋與種臍不改height／AO。0.045m nominal tile及0.018 UV relief是作者選定、不是量測豆粒厚度或實體位移。M0／mortar0、四張opaque default maps與optional height沿用options／tint／Worker／cache／repeats／ownership；無新mesh／runtime依賴，不提供植物解剖／品種鑑定／營養健康／光學／物理認證。

`thomsonite`（粉紅／乳白同心眼紋拋光石）近似選定opaque粉紅與乳白眼紋切面，不涵蓋稀有綠黑變體、玄武岩宿岩或所有Thomsonite。直接fallthrough共用正式Orbicularjasper sampler，只在constructor選preset：36個中心／倒平方半徑／三或四色環數各四值pose，加96² grain與8² matrix，共9,424 Float64／75,392B的table／record算術預算，非總RAM／texture cache。最大半徑0.43加偏移0.04＝0.47小於owner半寬0.5（餘0.03），compact squared-radial裙緣讓色環在owner前退回完整基質；保留既有support內一次cosine，不冒稱零trig，但沒有新逐點配置／hash／sqrt／kind branch／neighbor scan。環只改color／roughness，height0.4＋0.004grain及AO1維持平齊，原Orbicularjasper所有參數／point算術不變。0.048m nominal tile與0.004 UV relief作者自選、非量測厚度；微height跨度最多0.000016 UV，actual512 normal可落在8-bit近flat量化底，不能聲稱看見凸環／凹槽。四張default opaque M0／mortar0 maps及optional height沿用options／tint／Worker／cache／repeats／ownership，無新增晶體／纖維geometry、透明、礦物生長、光譜／物理／地質認證或runtime依賴。

`nickelsilver`（暖銀色細緞紋鎳銀合金片）新增略暖銀白色、長而不規則的細刷紋與淺微粒起伏，不是純銀／鍍銀、鍍膜、腐蝕氧化、錘凹或粗48道刻槽。重用正式C1 periodic cachedNoise builder及既有每preset一closure模式：4×192 brush和128² grain共17,152個Float64／137,216B lattice算術預算（非總RAM／texture cache），無逐點配置／hash／trig／sqrt／新kind branch／neighbor scan，原metal算術與data不變。0.025m nominal tile與0.0012 UV relief為作者選定、不是量測厚度；全opaque conductor的metallic map及`material`／`createMaterial()`預設factor均1、AO1／mortar0，四張default maps與optional height沿用options／tint／Worker／cache／repeats／ownership。方向微normal不等於新增anisotropic BRDF；不新增片材geometry、鍍層／光譜／組成／牌號／力學／物理認證或runtime依賴。

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

榻榻米（`tatami`）呈現黃綠色藺草細長凸脊、凹陷草莖間隙、交替上下穿越草莖的橫向綁線與縱向纖維。四份貼圖皆為 seeded periodic；opaque dielectric、metallic 為 0，每張 UV tile 對應 0.16 m。僅為表面 shading／normal map，不新增草莖 geometry、透明孔洞或物理功能；沿用既有 options、repeats 與 ownership。

果皮表面包含鳳梨皮（pineapple，金黃／橄欖色菱形多邊形果目，沿斜向交錯排列，帶狹窄棕綠色凹縫及圓潤冠部內的小凹陷中央果眼）、草莓皮（strawberry，紅色表皮、不規則交錯的細長凹陷種子窩，內有小型赭黃色種子）及荔枝皮（lychee，粉紅／紅色密集不規則多邊形凸疣、柔化尖冠與狹窄暗色凹裂縫），分別區別於松果搭接鱗片、橘皮圓形油腺及鳳梨規整大果目。三者皆為 opaque dielectric，metallic B 通道與預設 factor 為 0，沿用既有 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps。起伏僅為 shading／normal map 效果，不新增 geometry、displacement、透明度、次表面散射（SSS）、transmission 或 BRDF；既有 options、physical repeat、呼叫者 ownership 與借用 maps 的生命週期不變。

真菌表面包含菌褶（mushroomgills，奶油／棕褐色密集放射狀長菌褶與起於外側的短菌褶，環繞平靜附著區）、羊肚菌表面（morel，暖赭／棕色不規則細長凹陷腔室與狹窄圓潤相連隆脊，不是規則六角格或正向珊瑚迷宮）及層孔菌表面（bracketfungus，奶油／鏽紅／棕色重疊薄扇面、寬幅多色同心帶、淡色平滑外緣與細絲絨感顆粒）。三者皆為 opaque dielectric，metallic B 通道與預設 factor 為 0，沿用相同四份 seeded deterministic periodic maps 與 physical repeat。起伏僅為表面 shading／normal map 效果，不新增 geometry、displacement、alpha、次表面散射（SSS）、transmission、生物生長模擬或 BRDF；既有 options、呼叫者 ownership 與借用 maps 的生命週期不變。

市政表面包含警示導盲磚（tactilepaving，柔和安全黃色水泥／陶瓷磚、凹陷磚縫與規整平頂截錐警示凸點，帶圓潤肩部及次要細顆粒）、道路標線（roadmarking，深色顆粒瀝青上的寬幅磨損米白漆帶，連貫局部掉漆露出底層，漆面比瀝青平滑並略微隆起，邊緣圓潤）及排水蓋（draincover，矩形鑄鐵框、平行長條圓端槽、隆起柵條與橫向支撐，帶鑄造顆粒及磨圓肩部）。警示導盲磚與道路標線皆為 opaque dielectric，metallic B 通道與預設 factor 為 0；排水蓋預設 metallic factor 為 1，完整外框／柵條／橫向支撐的 metallic B 為 1，不透明暗色凹槽底面與外部為 0，僅於圓潤肩部平滑過渡。沿用 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps 與 physical repeat；既有 options、呼叫者 ownership、借用 maps 的生命週期與 backend 邊界不變。起伏僅為 shading／normal map 效果，不新增實際開孔、geometry、displacement、alpha 或 BRDF；純視覺素材，不提供逆反射、無障礙認證或道路安全合規保證。

動物皮膚表面包含象皮（elephanthide，霧面灰色皮膚、粗大蜿蜒交錯的凹陷皺褶、圓潤肩部與次要細摺紋）、鴕鳥皮革（ostrichleather，暖棕褐色皮革、稀疏不規則的凹陷羽管毛囊，外圍為低矮隆起圓環，細卵石底紋為次要紋理）及鯊魚皮（sharkskin，灰藍色細密定向微小盾鱗，沿流向逐漸收尖，每片有兩至三條細縱脊與淺搭接陰影），區別於一般皮革凸粒、杏仁凹孔、大型圓潤魚鱗或單脊蛇皮菱形。三者皆為 opaque dielectric，metallic B 通道與預設 metallic factor 為 0，沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps 與 physical repeat。既有 size／seed／contrast／roughnessBias／repeats options、呼叫者 ownership、借用 maps 的生命週期與 backend 邊界不變。僅為表面 shading／normal map 效果，不新增 geometry、displacement、透明度、transmission、次表面散射（SSS）或 anisotropic BRDF。

樹皮表面包含白樺樹皮（birchbark，淺色紙質表面、短而不規則的深色橫向皮孔，帶淺凹與 occlusion，以及淺紙層接縫）、棕櫚樹幹（palmtrunk，乾燥棕褐纖維、不等距橫向葉痕環、凹陷葉痕與隆起肩部，細縱纖維為次要紋理）及懸鈴木樹皮（sycamorebark，奶油／橄欖灰色多層次寬大不規則剝落斑塊與淺剝落邊緣），區別於縱向木紋、竹節或剝漆換色。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用相同四份 seeded deterministic periodic maps 與 physical repeat。僅為 shading／normal map 效果，不新增 geometry、displacement、alpha、transmission、SSS 或 BRDF；既有 options、呼叫者 ownership、借用 maps 的生命週期與 backend 邊界不變。

堅果殼表面包含核桃殼（walnutshell，不規則蜿蜒分岔的粗隆脊與深棕色凹谷）、花生殼（peanutshell，淡稻草／棕褐色網紋，較強縱肋與次要橫向連結圍成不規則細長網格，不是織物交錯）及杏仁殼（almondshell，淺黃褐色殼面、零散細長凹孔與細微定向紋理，以負向起伏與 occlusion 表現孔洞，不是純顏料斑點或隆起珠粒）。三者皆為 opaque dielectric，metallic B 通道與預設 metallic factor 為 0，沿用相同四份 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps 與 physical repeat；僅為表面 shading／normal map 效果，不建立完整堅果 geometry、displacement、cutout、半透明、transmission、次表面散射（SSS）或新 BRDF。

花瓣表面包含玫瑰花瓣（rosepetal，酒紅至玫瑰紅色的柔和流動摺紋、密集細小隆起乳突與高粗糙度的絲絨感微紋，不是布料織紋、毛髮或凹孔）、百合花瓣（lilypetal，奶油／象牙白至暖黃色的細縱肋、淺摺紋與零散不規則細長紅褐色顏料斑點，較玫瑰平滑的緞面粗糙度，斑點不是凹洞）及棋盤貝母花瓣（fritillarypetal，紫／奶油色沿兩軸交替的棋盤顏料、柔和游移格界與細縱紋，淺肋起伏獨立於色格，不是磁磚填縫或織物）。三者皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 metallic factor 均為 0，僅沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps 與 physical repeat defaults。前一百六十二種四份 maps 輸出須逐位元組保持不變；公開 size／seed／contrast／roughnessBias／repeats options、呼叫者 ownership 與借用 maps 的生命週期均不變。各 scalar fields 在週期接縫與內部支撐交界須保持 C1。這些僅為表面 shading／normal map 效果，不建立花朵 geometry、alpha、displacement、transmission、次表面散射（SSS）、模擬或新 BRDF 能力。

新增水果表皮包含網紋瓜皮（cantaloupe，柔和綠／赭色瓜皮上的棕褐色隆起、不規則相連曲線網紋，不是六角蜂巢壁或長頸鹿顏料網絡換色）、火龍果皮（dragonfruit，飽和玫瑰紅／洋紅蠟質表皮、錯列漸尖苞片朝尖端過渡至黃綠色，帶淺層翹起尖端與搭接陰影，不是規則三角形或松果換色）及奇異果皮（kiwiskin，棕色果皮上方向多變的密集細短毛痕與小毛囊凹點，不是粗長縱向椰纖維或垂直斑馬毛紋換色）。三者皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，僅沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps 與 physical repeat defaults。呼叫者 ownership、借用 maps 的生命週期及公開 size／seed／contrast／roughnessBias／repeats options 均不變。這些僅為表面 shading／normal map 效果，不建立 alpha、geometry、displacement、真實毛髮 geometry、transmission、次表面散射（SSS）、模擬或新 BRDF 能力。

貝殼表面可選扇貝殼（scallopshell，暖奶油／粉紅色扇形殼面、向外發散的放射肋與交錯的細微生長環，不是星珊瑚換色）、牡蠣殼（oystershell，粗糙灰／奶油色鈣化表面、不規則重疊生長薄層、翹起層唇與下切陰影，不是規則波紋或層疊紙換色）及鸚鵡螺殼（nautilusshell，奶油／赤褐色盤捲殼面、彎曲螺旋生長紋與腔室／條帶分區，不是同心木材年輪或普通圓點）。三者形態各異，皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，僅沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps、physical repeat sampling、呼叫者 ownership 與不變的 size／seed options。這些僅為風格化殼面 shading／normal map 效果，不建立 geometry、displacement、透明、transmission、次表面散射（SSS）、虹彩或動物模擬。

短毛皮紋可選斑馬短毛皮紋（zebrafur，蜿蜒、寬窄變化且分岔／匯合的黑／象牙白條紋，不是均勻正弦條帶）、豹短毛皮紋（leopardfur，環繞暖色中心的不規則斷續深色玫瑰斑，不是實心圓點或石材換色）或長頸鹿短毛皮紋（giraffefur，由相連淡色網絡分隔的不規則角狀棕色斑塊，不是矩形磚塊／磁磚格）。各自的顏料圖案結合細密短纖維的定向淺起伏與粗糙度；顏料邊界不形成隆起甲片或深裂縫。三者皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，僅沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps、physical repeat sampling、呼叫者 ownership 與不變的 size／seed options。這些僅為淺層表面 shading／normal map 效果，不建立真實毛髮 geometry、alpha、displacement、各向異性 BRDF 或動物模擬。

圖案織物可選千鳥格（houndstooth，黑／象牙白斷格與源於斜紋交織的階梯狀齒形，不是普通棋盤格）、蘇格蘭格紋（tartan，暖色柔和的寬細交叉條帶與可見的紗線交織，不是平鋪磁磚）或花卉提花（damask，成對對稱的花葉與花瓣圖案，在織紋底布上呈現隆起的提花浮雕）。三者圖案形態各異，不是 fabric、herringbone、tweed 或 seersucker 的換色或縮放。皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps、physical repeat sampling、呼叫者 ownership 與不變的 size／seed options。這些僅為表面 shading／normal map 效果，不建立真實纖維、geometry、alpha、displacement、各向異性、新 BRDF 能力或布料模擬。

海洋骨骼表面可選腦珊瑚（braincoral，蜿蜒迷宮狀圓潤隆脊與脊間暗色谷地）、星珊瑚（starcoral，各自分明的珊瑚杯與環繞下陷口部的放射狀隔片）及海綿（seasponge，多尺度通道與不規則相連的多孔骨架）。三者結構各異，不是火山渣、浮石、泡棉或彼此的換色或縮放。皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，沿用 CPU 一次生成的 baseColor／normal／metallicRoughness／occlusion 四份 seeded deterministic periodic maps、physical repeat sampling、呼叫者 ownership 與 size／seed options。凹凸僅為表面 shading／normal map 效果，不建立真實珊瑚或海綿 geometry、孔洞、活體珊瑚蟲 geometry、alpha、displacement、次表面散射（SSS）或水下光學／模擬／行為。

綠葉表面可選荷葉（lotusleaf，寬闊圓潤葉片、放射狀葉脈與中央附著點起伏）、香蕉葉（bananaleaf，細長寬葉面、強烈中肋與密集平行／斜向側脈）或蕨葉（fernleaf，沿葉軸交替排列的漸尖羽片，各有細緻葉脈）。三者形態各異，不是換色或縮放的落葉層；皆為不透明綠色 dielectric，metallic 通道與預設 factor 為 0，沿用相同四份 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps、repeat sampling、呼叫者 ownership 與 size／seed options。這些僅為表面 shading／normal map 效果，不提供 alpha cutout、真實植被 geometry、displacement、次表面散射（SSS）、濕潤模擬或風動行為。

風格化散粒表面可選米粒（rice，象牙白細長米粒、不同朝向與柔和縱向起伏）、芝麻（sesame，暖棕褐色小型不對稱淚滴種子、圓潤隆起中脊與漸尖端部）或咖啡豆（coffeebeans，較寬的深烘焙棕色橢圓豆粒、彎曲中央裂縫與細密不均烘焙紋理）。三者各有不同形狀場，不是同一圖樣換色或縮放；皆為 opaque dielectric，metallic 通道與預設 factor 為 0，沿用相同四份 seeded deterministic periodic maps、repeat sampling、呼叫者 ownership 與 size／seed options。凹凸僅為 shading／normal map 效果，不提供逐粒模擬、物理堆疊、geometry、displacement、透明或次表面散射。

鋪面可選瀝青（暗色顆粒黏結料與嵌入骨材）、礫石（不規則石粒與暗色凹隙）或鵝卵石鋪面（錯列圓角鋪石）。三者均使用 opaque、repeat 的 color／normal／metallic-roughness／occlusion maps。

自然表面可選樹皮（隆起紋理與深裂隙）、苔蘚（密集柔軟的綠色覆層）或泥土（土塊與淺裂紋）。三者皆為 opaque dielectric，沿用相同四份 repeat maps。

石材飾面可選花崗岩（斑點礦物顆粒）、板岩（帶細微脊紋的深色層理）或磨石子（平滑黏結料中的對比色石片）。三者皆為 opaque dielectric，沿用相同四份 repeat maps，metallic 通道為 0。

紡織表面可選丹寧布（denim，斜向斜紋）、粗麻布（burlap，粗經緯交織）或地毯（carpet，割絨表面）。三者皆為 opaque dielectric，沿用相同四份 repeat maps，metallic 通道為 0；不是 geometry 或毛髮模擬，也不產生透明織孔。

柔軟紡織表面可選針織（knit，柔和色調的平針式重複 V 形針目、圓潤隆起紗線與凹陷線圈間隙）、燈芯絨（corduroy，暖棕色平行圓潤隆起絨條、細密絨毛斑點與深窄溝槽）或毛氈（felt，柔和灰綠色霧面不織表面、隨機方向細纖維與低起伏）。三者皆為 opaque dielectric，沿用相同四份 deterministic periodic maps，metallic 通道與預設 factor 為 0；凹凸僅由 normal map 表現，不新增紗線／毛髮 geometry 或透明線圈。

建材飾面可選石膏（plaster，淺色石膏的淺抹刀弧痕與細孔）、陶土（terracotta，未上釉紅褐燒製陶土的不規則窯色與凹孔，無磁磚填縫）或軟木（cork，棕褐壓製碎片與細胞邊界）。三者皆為 opaque dielectric，沿用相同四份 repeat maps，metallic 通道為 0，不新增 geometry 或物理模擬。

工業表面可選橡膠（rubber，炭黑色模製彈性體與細密卵石狀顆粒）、碳纖維（carbonfiber，樹脂覆層下深色纖維束與交替斜向斜紋編織）或止滑花紋鋼板（diamondplate，銀色軋製金屬與交替斜向隆起菱形紋）。橡膠與碳纖維皆為 opaque dielectric、metallic 通道為 0；鋼板 metallic 通道及預設 factor 均為 1。三者沿用相同四份 periodic RGBA maps，凹凸僅由 normal map 表現，不新增 geometry；碳纖維不是特殊 anisotropic shader、clearcoat 或物理模擬。

工藝素材可選紙張（paper，象牙白未塗佈紙的細密不規則紙漿纖維與輕微雲狀成紙紋）、藤編（wicker，棕褐寬圓角藤條交織、細縱向條紋與深色不透明凹隙）或竹材（bamboo，金黃縱向纖維與週期錯列的深色竹節帶）。紙張不是石膏換色，藤編區別於粗麻布。三者皆為 opaque dielectric，沿用相同四份 periodic maps，metallic 通道與預設 factor 為 0；凹凸僅由 normal map 表現，不新增 geometry、透明孔洞、分節物件或物理模擬。

成形金屬可選錘紋金屬（hammeredmetal，暖銅色金屬、重疊的淺圓錘凹與平滑連續起伏，不是粗岩）、鍍鋅板（galvanized，冷銀色鋅花晶粒的色調與粗糙度對比、極淺起伏，不是礫石）或波紋金屬板（corrugatedmetal，銀色軋製板的平行平滑波槽與細微縱向磨痕）。三者沿用相同四份 deterministic periodic maps，metallic B 全為 255（1）、預設 factor 為 1，區別於混合金屬度的 rust。凹凸僅由 normal map 表現，不位移 geometry 或改變輪廓。

多孔與沉積石材可選砂岩（sandstone，暖色波狀沉積層理與砂粒，區別於深色板岩和鬆散沙）、洞石（travertine，奶油色石灰岩、不規則細長淺孔與細微水平礦物帶）或浮石（pumice，淺灰火山岩、密集隨機分布的小圓氣孔，不是礫石或石材換色）。三者皆為 opaque dielectric，沿用相同四份 deterministic periodic maps，metallic 通道與預設 factor 為 0；凹孔僅由 normal map 表現，不是透明或 geometry 孔洞。

地板飾面可選拼花木地板（parquet，籃編式木塊拼排，每塊含多根窄木條，縱向木紋方向交替並帶深色凹縫）、馬賽克（mosaic，細小方形釉面磚粒，具有 seed 決定的逐磚色調差異與窄凹填縫，區別於較大的 tiles）或六角磚（hexagontiles，六邊形陶瓷單元與窄凹填縫，可無接邊斷裂地週期重複）。三者皆為 opaque dielectric，僅沿用相同四份 maps，metallic 通道與預設 factor 為 0；凹凸僅由 normal map 表現，接縫不分割 geometry。

外牆與屋面飾面可選瀝青屋瓦（roofshingles，暗色礦物顆粒瀝青瓦層、錯列矩形瓦片與搭接陰影帶）、陶製屋瓦（rooftiles，赤陶筒瓦層、彎曲瓦冠、凹陷水槽與層間搭接帶）或粗灰泥（stucco，暖米白噴塗／抹製灰泥、不規則隆起骨材與凹孔，起伏比 plaster 更粗）。三者皆為 opaque dielectric，沿用相同四份 deterministic periodic maps，metallic 通道與預設 factor 為 0；屋瓦搭接與表面凹凸僅由 shading／normal map 表現，不新增 geometry、輪廓變化或物理模擬。

自然細節可選地衣（lichen，不規則淺殼狀群落）、落葉層（leaflitter，具方向性的乾葉、中央葉脈與凹陷間隙）或木頭端面（endgrain，彎曲木材年輪、導管孔與放射狀乾裂）。三者皆為 opaque dielectric，沿用相同四份 deterministic periodic maps，metallic 通道與預設 factor 為 0；凹凸僅由 shading／normal map 表現，不新增植被或木材 geometry。

室內機能表面可選吸音泡棉（acousticfoam，炭黑色柔化金字塔狀起伏）、閉孔泡棉（closedcellfoam，藍灰色細密閉孔膜面與淺凹）或油氈地材（linoleum，柔和綠／青綠色平滑大理石紋片材地板與細長顏料斑點）。三者皆為 opaque dielectric，沿用相同四份 seeded deterministic periodic maps，metallic 通道與預設 factor 為 0；凹凸僅由 shading／normal map 表現，不新增泡棉 geometry、吸音或物理模擬。

皮革飾面可選麂皮（suede，棕褐色短刷絨與細孔）、蛇鱗紋皮革（snakeskin，橄欖綠／棕色錯列的小型尖端／圓角菱形鱗紋、中央脊線與凹陷邊界）或鱷魚壓紋皮革（crocodile，深棕色大型圓角矩形鱗板與皺褶凹紋）。三者皆為 opaque dielectric，沿用相同四份 seeded deterministic periodic maps，metallic 通道與預設 factor 為 0；只是合成表面紋樣，凹凸僅由 shading／normal map 表現，不新增動物 geometry 或 displacement。

織物飾面可選人字紋織物（herringbone，交替斜向的斷續斜紋人字形）、粗花呢（tweed，粗糙雜色紗線、細斑點與交叉纖維）或泡泡紗（seersucker，淺藍／奶油色交替平整與皺褶條帶及細密織紋）。三者皆為 opaque dielectric，沿用相同四份 seeded deterministic periodic maps，metallic 通道與預設 factor 為 0；僅為表面 shading／normal map 效果，不新增布料 geometry、anisotropy 或模擬。

加工金屬可選滾花金屬（knurledmetal，細密交叉斜向脊線與隆起菱形止滑紋）、魚鱗旋紋金屬（engineturned，重疊的銀色圓形加工旋紋）或金箔（goldleaf，暖金色揉皺紋與搭接縫）。三者皆為 opaque，僅沿用相同四份 seeded deterministic periodic maps，metallic B 全為 255（1），`material` 與 `createMaterial()` 的預設 metallic factor 均為 1，明確的呼叫者覆寫仍有效。rust 保持變化的 metallic map 與預設 factor 1，dielectric 預設仍為 0。僅為表面 shading／normal map 效果，不新增實際 anisotropy、金箔厚度、加工 geometry 或透光效果。

水果表面可選橘皮（orangepeel，細密油腺凹點與蠟質橙色表皮）、椰殼（coconut，粗糙棕色外殼、細縱向椰纖維與裂隙）或西瓜皮（watermelon，綠色不規則波狀縱向瓜皮條帶與雜色斑點）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；只是表面 shading／normal map 效果，不新增水果 geometry、transmission 或 subsurface scattering。

地質表面可選石灰岩（limestone，暖淺色圓潤碳酸鹽顆粒與多孔基質）、角礫岩（breccia，膠結物中的稜角破碎岩屑）或片麻岩（gneiss，褶曲的明暗交替礦物帶與結晶斑點）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增實際岩石 geometry、displacement 或透光效果。

木質複合板可選膠合板（plywood，暖色旋切面單板的山形木紋與節眼，非板邊疊層）、定向粒片板（osb，大型重疊且具方向性的細長木片）或粒片板（chipboard，黏結料中密集較細且隨機定向的木屑）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增板材 geometry 或 displacement。

立體紋理織物可選華夫格布（wafflecloth，隆起的華夫格編織邊框與凹陷方格口袋）、麻花針織（cableknit，相互纏繞的羊毛麻花辮、交叉處起伏及兩側較細的針織凸條）或菱格絎縫（quilting，蓬鬆填充的菱形布面單元與凹陷斜向縫線）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增布料 geometry、displacement、transmission 或 SSS。

裝飾陶瓷與花磚可選冰裂釉（crackleglaze，淺青瓷色平滑釉面與細密不規則深色凹陷裂紋網）、直槽陶瓷（flutedceramic，象牙白拋光陶瓷與垂直圓潤槽紋）或嵌彩水泥花磚（encaustictiles，奶油色／柔和藍色裝飾水泥磚、花卉／幾何顏料嵌紋及凹陷填縫）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；只是表面 shading／normal map 效果，不新增實際裂縫、geometry、displacement、transmission 或塗層系統。

生物覆層可選魚鱗（fishscales，藍灰／青綠色錯列重疊的圓潤扇貝狀鱗片、同心生長紋與露出邊唇）、龜甲（tortoiseshell，棕／琥珀色不規則多邊形盾片、深色接縫、圓頂與生長環）或羽毛（feathers，灰褐色層疊尖端羽片、羽軸與斜向羽枝）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；只是表面顏料與 normal map 效果，不新增 geometry、cutout、transmission、iridescence、SSS 或 shader feature。

植物纖維表面可選蘆葦蓆（reedmat，纖細平行蘆葦與橫向綁線）、繩索（rope，相鄰三股扭繩帶、螺旋凹槽與細纖維）或稻草（straw，金黃乾燥纖細散落直莖、偶見節點與層疊鋪墊）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；只是表面 shading／normal map 效果，不新增圓柱、geometry、cutout 或 displacement。

橡膠地材可選圓釘橡膠（studdedrubber，圓形平頂炭黑凸釘與斜面肩部）、溝槽橡膠（groovedrubber，寬平深灰肋條與窄排水槽）或再生橡膠（recycledrubber，暗色黏結料中的密集細小藍灰不規則橡膠顆粒）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；只是表面 shading／normal map 效果，不提供實際摩擦／止滑或排水物理，不新增 geometry 或 displacement。

金屬網孔可選穿孔金屬板（perforatedmetal，亮面金屬板上錯列的圓形凹孔與孔間平整網面）、擴張網（expandedmetal，兩組對角條帶在隆起節點相接並圍出凹陷的菱形開口）或編織金屬網（wiremesh，圓形金屬線平紋交織、上下交錯於深色開放網孔之上）。三者皆為 opaque metal，metallic 通道與預設 factor 為 1，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增板材 geometry、真實孔洞、彎折條帶或 displacement。

絨面織物可選天鵝絨（velvet，細密平整的直立絨面，柔和的壓褶雲塊改變色素與光澤）、毛圈布（terrycloth，錯列隆起的圓潤毛圈冠）或圈圈紗（boucle，紗節上隆起的環狀線圈、環心凹陷且紗節之間留有開放凹槽）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增布料 geometry、剪開線圈、displacement 或 SSS。

礦石晶體可選晶洞（geode，環繞細密晶簇核心的同心礦物縞帶）、石英（quartz，高低錯落的六方柱體與錐狀頂端）或黃鐵礦（pyrite，相互咬合的階梯狀立方晶面與細密平行條紋）。晶洞與石英為 opaque dielectric，metallic 通道與預設 factor 為 0；黃鐵礦為 opaque metal，metallic 通道與預設 factor 為 1。三者僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增晶體 geometry、切割晶面或 displacement。

建築外殼可選搭接木板（shiplap，搭接處的陰影凹槽、板材色調在接縫淡出且木紋沿板面延伸）、玻璃磚（glassblock，圓角磚面與凹陷接縫、內部氣泡隆起）或茅草（thatch，層層下垂的草束與陰影搭接、細長草莖沿坡面延伸）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增板材、磚體或草束 geometry，也不做 displacement。

風化表面可選炭化木（charredwood，隆起於深邃鱷魚裂紋之上的圓潤炭塊）、漂流木（driftwood，銀灰木紋脊與沿木紋開裂的風化裂隙）或剝落漆面（peelingpaint，翹起捲邊的完整漆面與外露的底材）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增樹皮、木板或漆片 geometry，也不做 displacement。

功能紋面可選胎紋（tiretread，錯列墊高的胎塊與其間溝槽、胎面細割紋）、蜂巢（honeycomb，環繞凹陷巢房的隆起蠟質六角壁）或霜花（frost，自淡出中心放射的羽狀冰晶）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增胎塊、巢房或冰晶 geometry，也不做 displacement。

裝飾面板可選彩繪玻璃（stainedglass，墊高鉛條與其間不同色調的不規則玻璃片）、皂石（soapstone，深色滑石底上的柔和淺色紋帶）或端面砧板（butcherblock，錯色棋盤格端面木塊與凹陷接縫）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增鉛條、石材或木塊 geometry，也不做 displacement。

居家織品可選壁紙（wallpaper，以精確鏡像對稱重複的大馬士革團花）、刺繡（embroidery，在自身支撐處淡出的墊高緞面繡線）或流蘇編繩（macrame，墊高於交錯扭繩之上的錯列圓潤繩結）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增線材、繡線或繩結 geometry，也不做 displacement。

戶外硬景可選磚鋪面（brickpaving，錯縫墊高於砂質接縫之上的磚面）、踏石（steppingstone，墊高於礫石地面的圓潤石板）或木平台（woodendeck，窄縫上方的板面、隆起螺絲釘頭與凹陷十字槽）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增磚、石板、木板或螺絲 geometry，也不做 displacement。

廚房與燭光可選起司（cheese，沉入麵體、大小不一的圓潤孔洞）、糖霜（sugarfrosting，隆起於平滑糖面的擠花玫瑰峰）或蠟淚（candleswax，圓潤下垂的蠟流與其下端鼓起的淚頭）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增食品或蠟體 geometry，也不做 displacement。

聲音與紙面可選黑膠唱片（vinylrecord，環繞平整標籤圓面的細密同心溝紋）、方格紙（graphpaper，深於細格線的粗格線）或筆記本紙（notebookpaper，依序沉入紙面的橫線、邊界線與打孔）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增唱片、紙張或孔洞 geometry，也不做 displacement。

編織工藝可選蕾絲（lace，菱形網眼上方交叉的對角線網紋）、鉤織（crochet，交錯半格位移的隆起線圈列）或籃織（basketweave，依區塊交替方向且帶凸脊的條帶）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增線材、毛線或藤編 geometry，也不做 displacement。

扣合配件可選拉鍊（zipper，交錯嚙合於凹陷接縫上方的鏈齒列與織紋布帶）、魔鬼氈（velcro，錯列鉤針圓環與凹陷針芯）或鈕扣（button，隆起扣緣、縫線扣面與孔洞凹點）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增鏈齒、針扣或鈕扣 geometry，也不做 displacement。

道路與軌道可選鐵軌（traintracks，鋼軌、橫向枕木與道碴顆粒）、人孔蓋（manholecover，外框環與放射／同心圓肋紋蓋面）或減速丘（speedbump，圓拱、坡腳、凹陷接縫與警示條紋）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增鋼軌、蓋體或丘體 geometry，也不做 displacement。

科技表面可選電路板（circuitboard，銲盤、走線與導孔凹點）、太陽能板（solarpanel，匯流條、細柵線與凸起電池片）或隔熱瓦（heattile，圓角瓦面與凹陷接縫）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增線路、電池片或瓦片 geometry，也不做 displacement。

樂器與聲學可選琴鍵（pianokeys，黑鍵、白鍵面與凹陷縫線）、鼓皮（drumskin，鼓耳、鼓框與放射褶鼓膜）或鑼面（gongsurface，錘打環紋與中央凸起）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增琴鍵、鼓皮或鑼體 geometry，也不做 displacement。

光學表面可選微透鏡陣列（lensarray，圓頂微透鏡與細支撐網）、稜鏡膠帶（prismtape，斜向稜脊與膠帶底面）或菲涅耳面（fresnel，同心鋸齒環帶與中央凸起）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增透鏡、稜鏡或階梯透鏡 geometry，也不做 displacement。

醫療與衛生可選繃帶（bandage，圓角軟墊與織紋紗布）、藥丸泡殼（pillblister，半球泡殼與壓痕鋁箔）或縫合線（sutures，縫線、切口凹溝與針孔凹點）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增軟墊、泡殼、縫線或縫針 geometry，也不做 displacement。

園藝與戶外可選格柵（trellis，交叉木條、繩結與鏤空格）、陶盆（terracottapot，凸緣與盆壁旋紋）或樹籬（hedgerow，葉團與枝條縫隙）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增木條、盆體或枝葉 geometry，也不做 displacement。

寵物與動物照護可選項圈（collar，扣環、縫線織帶與素面底布）、寵物床（petbed，環形床緣、內凹軟墊與織紋底）或貓抓柱（scratchpost，麻繩脊與繩圈溝縫）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增扣環、床緣或繩索 geometry，也不做 displacement。

運動場地可選跑道（runningtrack，分道線、膠粒表面與排水縫）、攀岩墊（bouldermat，菱形壓紋與邊緣縫合帶）或泳池磚（pooltile，磚面、填縫與水光條紋）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增劃線、壓紋或瓷磚 geometry，也不做 displacement。

辦公與文具可選信封（envelope，交叉壓紋與封口縫）、黑板（chalkboard，木框、粉筆擦痕與素板面）或軟木板（corkboard，軟木顆粒與圖釘孔）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增封口、框體或圖釘 geometry，也不做 displacement。

自然現象可選雪堆（snowdrift，風紋波浪脊與細雪粒）、冰柱（icicle，圓潤冰柱與陰影隙縫）或露珠（dewdrops，大小水珠與淡葉脈）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增雪堆、冰柱或水珠 geometry，也不做 displacement。

天文與太空可選月坑（mooncrater，坑緣、坑底與地表）、星空（starfield，亮星、塵點與星雲底色）或星雲（nebula，渦卷條紋與暗塵帶）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增隕坑、星體或雲氣 geometry，也不做 displacement。

服裝細節可選褶襉（pleats，風琴褶與布面谷線）、鞋帶（shoelace，交織圓繩與鞋眼孔）或流蘇（tassel，穗帶與束結環）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增褶片、繩體或穗帶 geometry，也不做 displacement。

烹飪器具可選炒鍋（woksurface，錘打凹點、刮痕鋼面與油光）、餐具（cutlery，串珠邊框與拉絲柄面）或砧板（choppingboard，端面木塊、刀痕與凹陷邊框）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增凹點、串珠或木塊 geometry，也不做 displacement。

浴室與水電可選水龍頭（faucet，拋光弧面、底盤與水垢斑）、蓮蓬頭（showerhead，出水孔與溝紋面板）或浴墊（bathmat，吸盤圓頂與織紋底面）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增弧面、噴孔或吸盤 geometry，也不做 displacement。

窗簾與遮光可選百葉窗（blinds，傾斜葉片面、遮蔭縫隙）、窗簾（curtain，布褶波峰與布面谷地）或遮陽網（shadecloth，交織網線與開口網眼）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增葉片、布褶或網線 geometry，也不做 displacement。

食品表面可選麵包脆皮（breadcrust，裂開的烤焦麵包脆皮）、威化餅（wafer，細密正交凹格與烘烤凸肋）或巧克力（chocolate，寬大平滑的巧克力方塊與分割刻槽）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps 與 physical repeats；只是平坦表面的 shading／normal map 效果，不新增 geometry、displacement、SSS、transmission、半透明或食品／物理模擬。

烘焙點心可選蝴蝶脆餅（pretzel，交錯麵繩、結點與鹽粒）、貝果（bagel，Q彈環面、凹陷中孔與芝麻）或可頌（croissant，奶油層片斜脊與烘烤接縫）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增結點、環面或層片 geometry，也不做 displacement。

昆蟲與蛛網可選蝶翅（butterflywing，鱗片格面與凹陷翅脈）、甲蟲翅（beetlewing，弧形鞘翅板與分節接縫）或蛛網（spiderweb，放射蛛絲、同心絲環與露珠）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增鱗片、鞘翅、蛛絲或絲環 geometry，也不做 displacement。

天空與天氣可選卷雲（cirrus，風梳細絲條紋與高空留白）、積雲（cumulus，花椰菜狀雲團與陰影縫隙）或閃電（lightning，鋸齒電光核心與暗沉雷天空）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增絲條、雲團或電光 geometry，也不做 displacement。

海洋植物與生物可選海帶（kelp，寬亮葉帶與陰影波谷）、海藻（seaweed，細分枝絲與陰影空隙）或海葵（anemone，環狀觸手與凹陷中央口盤）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增葉帶、分枝或觸手 geometry，也不做 displacement。

糖果與甜點可選硬糖（candy，光亮扭轉條紋與淺接縫）、棉花糖（marshmallow，柔軟擠花圓稜、圓弧凹槽與灑粉）或牛軋糖（nougat，堅果塊、氣泡孔與耐嚼糖體）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增條紋、圓稜或堅果塊 geometry，也不做 displacement。

玻璃表面可選磨砂玻璃（frostedglass，細酸蝕顆粒）、波紋玻璃（rippledglass，垂直壓延波肋）或氣泡玻璃（bubbleglass，圓氣泡與透明玻璃體）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增顆粒、波肋或氣泡 geometry，也不做 displacement。

皮革加工可選馬鞍縫線（saddlestitch，斜向虛線縫線與粗面皮革）、壓花皮革（tooledleather，浮雕圓章、渦紋與壓縮底面）或漆皮（patentleather，細橘皮波紋與鏡面漆層）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增縫線、圓章或漆層 geometry，也不做 displacement。

果皮果肉可選蘋果皮（appleskin，紅暈條紋、果點與緊繃果皮）、桃皮（peachskin，細絨、紅暈與凹陷縫線溝）或葡萄皮（grapeskin，白霜粉斑與緊繃光滑果皮）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增條紋、絨毛或粉斑 geometry，也不做 displacement。

蔬菜表面可選青花菜（broccoli，密集花球粒與陰影空隙）、高麗菜（cabbage，葉片波皺與凹陷葉脈）或洋蔥（onion，同心層弧條紋與乾皮纖維）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增花球粒、葉皺或層弧 geometry，也不做 displacement。

寢具床品可選床單（bedsheet，柔壓皺褶與織面）、枕頭（pillow，蓬鬆衍縫墊與凹陷滾邊縫線）或床墊（mattress，鈕扣拉扣凹點與粗織面）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增皺褶、衍縫墊或拉扣 geometry，也不做 displacement。

茶與飲品可選茶葉（tealeaf，捲曲葉片與陰影空隙）、抹茶（matcha，刷痕條紋與細粉面）或茶包（teabag，濾紙網線、開口網眼與茶影）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增葉片、刷痕或網線 geometry，也不做 displacement。

沙灘與海岸可選沙丘（sanddune，風紋波脊與細沙面）、卵石灘（pebblebeach，圓卵石與粗砂）或浪花泡沫（foamedge，泡沫團、氣泡與薄水膜）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增波脊、卵石或泡沫 geometry，也不做 displacement。

火山與熔岩可選熔岩流（lavaflow，繩狀熔岩紋與暗色裂縫）、冷卻熔岩（cooledlava，結殼岩塊、裂縫與孔洞）或火山灰（ashfield，細灰堆與灰面）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增繩紋、岩塊或灰堆 geometry，也不做 displacement。

洞穴與地下可選鐘乳石（stalactite，滴水錐尖與陰影凹處）、流石（flowstone，梯田流紋台階與細滴水波紋）或洞底（cavefloor，碎石泥面與平淺水窪）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增錐尖、台階或碎石 geometry，也不做 displacement。

甜點配料可選果醬（jam，光亮果肉塊與透明果膠）、花生醬（peanutbutter，花生碎與綿滑漩渦醬面）或糖針（sprinkles，糖針條與糖霜底面）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增果肉塊、花生碎或糖針 geometry，也不做 displacement。

冰品與冷飲可選冰淇淋（icecream，擠花奶油稜與融化滴點）、冰棒（popsicle，冷凍滴掛稜與霜面冰體）或雪酪（sorbet，刮匙刮脊與果粒面）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增擠花、滴掛或刮匙 geometry，也不做 displacement。

義式麵食可選義大利麵（spaghetti，蜿蜒麵條與醬底）、通心粉（macaroni，短彎管殼與空隙）或千層麵（lasagna，層層麵片與醬料縫）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增麵條、管殼或麵片 geometry，也不做 displacement。

紙藝可選折紙（origami，折面與壓折痕線）、紙蕾絲（paperlace，鏤空孔洞與紙橋面）或剪紙（papercut，層疊剪影與平底紙面）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增折面、孔洞或剪影 geometry，也不做 displacement。

花卉可選向日葵（sunflower，花盤種籽與圓盤）、雛菊（daisy，放射花瓣與凹陷花心）或三葉草（clover，三心葉瓣與葉脈）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增種籽、花瓣或葉瓣 geometry，也不做 displacement。

玩具與休閒可選拼圖磚（puzzletile，拼片、圓弧接點與接縫）、積木（legobrick，圓柱凸點與平滑磚面）或橡皮筋（rubberband，交叉彈條與底層包覆）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增拼片、凸點或彈條 geometry，也不做 displacement。

農場與穀倉可選乾草捆（haybale，稻稈條紋與捆帶）、穀倉（corncrib，木條柵欄與開口空隙）或柵欄柱（fencepost，直木紋稜與深裂紋）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增稈條、木條或木紋 geometry，也不做 displacement。

運動與遊樂可選撞球桌絨布（poolfelt，白色標記點與濃密絨毛）、冰面（icesurface，掃冰弧紋與霜斑）或攀岩牆（climbingwall，圓形岩點與顆粒牆面）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增圓點、弧紋或岩點 geometry，也不做 displacement。

顯示與周邊可選 OLED 面板（oledpanel，子像素條紋與矩陣遮罩）、CRT 掃描線（crtscanline，磷光掃描線與暗隙）或鍵盤鍵帽（keyboardkey，圓角鍵帽與凹陷縫隙）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增條紋、掃描線或鍵帽 geometry，也不做 displacement。

影像與印刷可選底片（filmstrip，打孔圓洞與分格凹槽）、郵票（postagestamp，齒孔邊框與中央圖案）或網點印刷（halftoneprint，色調墨點與留白紙面）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增圓孔、齒孔、圖案或墨點 geometry，也不做 displacement。

暖氣與五金可選散熱管（radiator，圓管與凹陷接縫）、螺絲頭（screwhead，十字凹槽與頭環面板）或菱形鐵絲網（chainlink，交叉節點與鏤空網格）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增圓管、螺絲或鐵絲 geometry，也不做 displacement。

餐桌食物可選煎蛋（friedegg，蛋黃、蛋白與鍋面）、壽司飯（sushirice，米粒與縫隙）或巧克力碎片餅乾（chocolatechip，巧克力片與餅乾底）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增蛋黃、米粒或碎片 geometry，也不做 displacement。

車輛內裝可選貨車踏墊（cargomat，橡膠長肋與橫向凹槽）、儀表皮革紋（dashboardgrain，顆粒谷底與縫線凹痕）或車牌（licenseplate，凸框、字條與底板）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增肋條、顆粒或邊框 geometry，也不做 displacement。

花園植栽可選花圃（flowerbed，四瓣花簇與土壤）、草坪條紋（grassstripe，剪草亮帶與溝底）或修剪灌木（topiary，葉團與修邊空隙）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增花朵、草葉或葉團 geometry，也不做 displacement。

節慶裝飾可選紙屑（confetti，碎片與紙面）、緞帶波紋（ribbonstreamer，扭轉寬帶與溝底）或彩帶流蘇（pinatafringe，密集垂條、層帶與空隙）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增碎片、緞帶或垂條 geometry，也不做 displacement。

樂器與演奏可選木琴（xylophone，琴條、穿繩孔與空隙）、鈴鼓（tambourine，斜置鈴片與鼓皮）或響板（castanet，殼緣、中央凹與氈底）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增琴條、鈴片或殼體 geometry，也不做 displacement。

保健與美容可選膠囊（pillcapsule，兩半、接縫與底板）、藥錠（pilltablet，圓頂與刻痕）或入浴球（bathbomb，顆粒與斜向裂隙）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增膠囊、錠劑或裂隙 geometry，也不做 displacement。

運動球表面可選籃球（basketball，橙色顆粒皮革與深色凹陷拼片縫）、網球（tennisball，黃綠色毛氈與淡色彎曲接縫）或高爾夫球（golfball，白色光澤表面與規則圓形凹點）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps 與 physical repeats；只是週期表面 shading／normal map 近似，不提供真實球面拼片拓撲、geometry、displacement、纖維或殼體體積、SSS、transmission 或球體物理。

建築混凝土飾面可選木模板清水混凝土（boardformedconcrete，灰色澆置混凝土的水平木板壓印、細長木紋與凹陷板縫，不是木材換色）、肋紋混凝土（ribbedconcrete，垂直等距寬肋、圓潤肩部、凹槽與細孔）或劈面砌塊（splitfaceblock，錯列矩形砌塊的粗糙破裂面與平滑凹陷砂漿縫，不是磚牆換色）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps 與 physical repeats；只是 shading／normal map 效果，不新增實際澆置 geometry、displacement 或砌體物理。

組裝金屬可選鎖子甲（chainmail，深色不透明 dielectric 襯底上重疊交錯的金屬環浮雕，不是真實開孔或透明網）、鉚接金屬板（rivetedmetal，板片凹縫與離散圓潤隆起鉚釘）或焊接金屬板（weldedmetal，較平坦金屬板上的隆起週期扇貝狀焊道）。三者皆為 opaque，僅沿用相同四份 seeded deterministic periodic maps 與 physical repeats。`material` 與 `createMaterial()` 預設 metallic factor 均為 1，呼叫者覆寫仍最後套用；chainmail 的 metallic 通道隨金屬環覆蓋率變化，襯底為 0，rivetedmetal／weldedmetal 則全為 255（1）。僅為 shading／normal map 效果，不新增 geometry、displacement 或物理模擬；options 與呼叫者 ownership 不變。

植物表面可選仙人掌（cactus，縱向綠色肋紋、重複刺座與細放射狀刺痕）、松果（pinecone，錯列重疊的木質角狀鱗片、隆起露出尖端與凹陷搭接縫，而非圓潤魚鱗）或玉米穗（corncob，緊密排列的飽滿長橢圓籽粒、圓潤冠部與狹窄粒間凹隙，而非磚牆換色）。三者皆為 opaque dielectric，metallic 通道及 `material`／`createMaterial()` 預設 factor 均為 0，僅沿用相同四份 seeded deterministic periodic maps 與 physical repeats；只是表面 shading／normal map 效果，不提供完整植株／果實拓撲、geometry、真實刺、displacement 或刺與植株物理；options 與呼叫者 ownership 不變。

紙材包裝可選瓦楞紙板（corrugatedcardboard，外露的圓潤紙質楞脊與谷槽、帶纖維的牛皮紙表面，而非金屬換色）、摺痕紙（creasedpaper，細微紙漿底紋上的交叉隆起摺脊與凹陷摺肩，而非僅有雜訊）或層疊紙（layeredpaper，不規則毛邊紙條交疊、明確階緣與下切陰影，而非紙張換色）。三者皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，僅沿用相同四份 seeded deterministic periodic baseColor／normal／metallicRoughness／occlusion maps 與 physical repeats；楞紋、摺痕與層緣僅為表面 shading／normal map 效果，不建立 geometry、切面、displacement、透明撕邊輪廓或撕裂物理；公開 options、呼叫者 ownership 與借用 maps 的生命週期不變。

火山石表面可選玄武岩（basalt，深色細粒底紋、圓角多邊形柱頂與凹陷節理）、火山渣（scoria，暖暗紅色岩面、大小不一的緊湊凹氣孔與隆起孔緣）或黑曜石（obsidian，極深色、有光澤的不透明火山玻璃與彎曲貝殼狀剝片痕）。三者皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，僅沿用相同四份 seeded deterministic periodic maps 與 physical repeat；凹凸僅為表面 shading／normal map 效果，不建立真實岩柱、孔洞、geometry、displacement、透明玻璃、折射或發光。

打磨與清潔可選砂紙（sandpaper，錯列磨料凸粒、背板與脫落凹坑）、鋼絲棉（steelwool，三向斜向纏繞絲脊與交點）或鋼絲刷（wirebrush，密排平行刷毛與溝槽）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增磨料、絲線或刷毛 geometry，也不做 displacement。

廚房器具可選起司刨刀（cheesegrater，沖孔與凸起孔環）、烤架（ovenrack，圓桿、細橫桿與交點）或馬芬烤盤（muffintin，圓槽與凸起模環）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增孔洞、圓桿或圓槽 geometry，也不做 displacement。

醫療敷料可選紗布（gauze，交織經緯紗與孔隙）、彈性繃帶（elasticbandage，斜向羅紋與布邊溝）或冰袋（icepack，方圓絎縫格與接縫網）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增紗線、羅紋或絎縫格 geometry，也不做 displacement。

圓形單元可選氣泡布（bubblewrap，封氣圓凸與薄膜網）、亮片布（sequin，交錯圓片與中央縫窩）或小圓馬賽克（pennyround，圓瓷磚與凹陷填縫）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增圓凸、圓片或瓷磚 geometry，也不做 displacement。

球類表面可選排球（volleyball，弧形面板、接縫與細點凹紋）、保齡球（bowlingball，珍珠環繞紋與三個指孔）或橄欖球（rugbyball，顆粒皮革與縫線繫帶）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增球體、指孔或繫帶 geometry，也不做 displacement。

烘焙甜點可選甜筒（wafflecone，斜向格紋與烘烤凹格）、甜甜圈糖霜（donutglaze，糖霜垂滴與多孔蛋糕體）或布朗尼（brownie，粗裂頂面與核桃塊）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增格紋、糖霜、裂紋或核桃 geometry，也不做 displacement。

浴室清潔可選香皂（soapbar，圓角皂塊、橢圓壓印與氣孔）、絲瓜絡（loofah，交錯波浪纖維網絡）或菜瓜布（scrubbypad，粗礪磨砂與六角切孔）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增皂塊、纖維或切孔 geometry，也不做 displacement。

水果剖面可選柳橙果肉（orangeflesh，凸起汁囊瓣片匯聚於凹陷果白）、奇異果果肉（kiwiflesh，凸起種子凸點與果心凸起於輻射纖維之上）或酪梨果肉（avocadoflesh，平滑果肉圍繞凹陷中央果核）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增果瓣、種子或果核 geometry，也不做 displacement。

裝飾礦石表面可選孔雀石（malachite，濃綠色圓潤葡萄狀巢套生長帶與細微拋光起伏）、瑪瑙（agate，暖奶油、紅與橙色的拉長波浪巢套生長帶，輪廓尺度與拓撲區別於孔雀石）或青金石（lapislazuli，深群青色顆粒石面與淺色不規則方解石脈及內含物，不含金色黃鐵礦或金屬碎斑）。三者皆為 opaque dielectric，metallic B 通道及 `material`／`createMaterial()` 預設 factor 均為 0，僅沿用相同四份 seeded deterministic periodic maps、physical repeat 與公開 options；拋光與凹凸僅為表面 shading／normal map 效果，不提供透明、折射、虹彩或寶石 geometry。

裝飾礦石二可選綠松石（turquoise，青綠色石面與深色不規則蛛網狀基岩細脈）、薔薇輝石（rhodonite，玫瑰粉紅石面與分岔黑色錳質細脈）或虎眼石（tigereye，金棕色波浪平行纖維條帶與絲光色調）。三者皆為 opaque dielectric，metallic 通道與預設 factor 為 0，僅沿用相同四份 seeded deterministic periodic maps；凹凸只是表面 shading／normal map 效果，不新增細脈、纖維或寶石 geometry，也不做 displacement、透明、折射或真實貓眼光學。

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

唯讀 `kind`、`material`、`textures` 提供預設內容：`textures.baseColor` 的 RGB 為 sRGB；`normal` 為 linear tangent-space；`metallicRoughness` 的 G 存 roughness、B 存 metallic；`occlusion` 的 R 存 linear occlusion。四份不可變 `Texture` source 沿既有 PBR／renderer 路徑使用。預設 opaque、全部 slots 使用 repeat sampling、roughness factor 為 1；具有 authored 金屬區域的預設（如全金屬 nickelsilver 與 mixed 的 rust）使用 metallic factor 1 保留 B 通道，純 dielectric 使用 0；完整規則見各 kind 說明。

`createMaterial(options?: Partial<PBRMaterialOptions>)` 建立新的 `PBRMaterial`，借用同一組 maps，最後套用呼叫者覆寫，不重新產生貼圖。Scene／mesh 不自動擁有預設；同步且冪等的 `destroy()` 只釋放預設產生的貼圖，不釋放覆寫的外部貼圖。`destroyed` 回報狀態，銷毀後 `createMaterial()` 會拒絕；已釋放 maps 不可再使用。[pbr3d gallery](../examples/pbr3d/) 提供預設切換與貼圖預覽，Canvas2D 仍只支援 2D。

#### 材質 finish、material asset 與 glTF variants

對任何 `PBRMaterial`（或 `preset.createMaterial`）傳入 `finish`，即可在既有貼圖上加入 anisotropy、iridescence、subsurface wrap、dispersion、視差高度、潮濕、積雪、髒汙、損傷、detail 層、triplanar 取樣或 lightmap。強度為 0 沒有額外成本，也不佔用額外貼圖 slot。

```js
import { MaterialAsset, setMeshMaterial } from 'xyz.js';

const asset = await MaterialAsset.fromImages(
  { base: baseBlob, normal: normalBlob, lightmap: bakedBlob },
  { roughness: 0.4, finish: { wetness: 0.6, lightmapStrength: 1 } },
);
setMeshMaterial(mesh, asset.material); // 有驗證，renderer 會重新綁定
// 所有使用它的 mesh 都移除後：
asset.destroy(); // 只釋放它自己解碼的貼圖
```

含 `KHR_materials_variants` 的 glTF 以 `gltfVariants(gltf)` 讀取：`.variants` 列出名稱，`.selectVariant('red')` 切換，`.selectVariant(undefined)` 還原預設。[pbr3d gallery](../examples/pbr3d/) 有 Finish 選單。各效果都是近似，其做法與未驗證範圍見技術參考。

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

Scene.physics.overlap(collider,owner)回shape-accurate contacts；raycast(origin,direction,maxDistance,mask?)回distance-sorted hits。Fixed-step capped、droppedTime記discard。P31有`body.ccd`掃dynamic平移對static非sensor（無rotation／dynamic-pair sweep）、sleep與`DistanceJoint`／`RevoluteJoint`／`PrismaticJoint`／`WeldJoint`／`MouseJoint`（addJoint／removeJoint）。`Colliders.polygon`仍strict convex，static凹形／chain用`StaticConcave2D`／`StaticChain2D`凸片composites；dynamic 凹形用`convexHull(points, options?)`（3–256 點→polygon collider）、`Compound2D(pieces, options?)`（1–256 個 convex 片共用一個 dynamic body、推導 mass／inertia）或`DynamicConcave2D(vertices, options?)`（`decomposeConvex` 分片共用一個 body），hit-testing 與 contacts 走`colliderPieces`。Zero-width edge 與 deforming sweep 仍不支援。P42另批准3D colliders／queries／character／dynamic bodies與navigation／pathfinding，舊排除項不刪減新scope，詳見[TECHNICAL](TECHNICAL-zh.md)。

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

Recipe 在各 bundle choices 保留 variants、anisotropy／iridescence maps 與 dispersion（需 transmission），以 `gltfVariants(asset).selectVariant(name)` 選材質。Optical maps 為 linear data，trusted profile 需明示 texture semantics。自製材質在 `finish` 旁傳入 `opticalMaps: { anisotropyTexture, iridescenceTexture, iridescenceThicknessTexture, iridescenceThicknessMinimum: 100, iridescenceThicknessMaximum: 400 }`；貼圖借用，共用既有 optical sampler array。UV transforms 使用 `textureCoordinates.anisotropy`／`.iridescence`／`.iridescenceThickness`。

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
- **Audio：**Channel／master native biquad／compressor／prepared convolution effects 處理 sample／stream／OPM；activity ducking、absolute manager-clock automation／cancel-and-hold、listener／emitter world bindings 使用 manager 的單一共用 context（P137 起；之前為八 contexts）。Pause 用 explicit audio reasons，不假設 `Game.pause()` 停聲。Bindings 借用 objects／playbacks，owner teardown 前 unbind。

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

| 能力                      | 使用契約／邊界                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P71 audio                 | 非手勢載入先用 `autoplay:false`，再由可信操作直接呼叫 `play()`。Context unlock 不保證所有 media autoplay。Pause／stop／cancel supersede pending startup；原生錯誤可觀測。各 context 保留本地 rendered gain envelope，不承諾 hard-real-time／實機時序。                                                                                                                                                                              |
| P72–P73 consumer          | 使用上述 starter 與已安裝公開 root，保留完整 dist／vendor／worker 樹。既有 counts／日期屬歷史版本，不是本輪證據。                                                                                                                                                                                                                                                                                                                   |
| P74 saves                 | SaveManager revision 拒絕已觀測的 stale owner；IndexedDB transaction／LocalStorage Web Locks 協調分頁。Custom backend 僅 process-local；LocalStorage 非 crash-atomic。`load(slot,{recovery:true})` 唯讀 backup、不改 corrupt 原文；明示 `restore(slot)` archive 損壞 payload。AutosaveController owns timers／pending writes、呈現 state、錯誤後明示 retry，owner 必須 destroy；stale 先載入／解決衝突。                            |
| P75 platforms             | 真 hardware gate 要 identity／version／session 與 native scenario 證據。Emulation、managed WebKit、AX tree 不等於實機／Safari／輔具認證。禁止發聲使 audible-output proof 明列 blocked。                                                                                                                                                                                                                                             |
| P76 2D motion             | CharacterController2D 借用已註冊 upright root convex owner／world；在 `Scene.fixedUpdate` 呼叫 `move` 並帶 `epoch:scene.fixedFrame`，caller 提供 gravity／jump、結束 destroy controller。平台 carry 每 epoch 一次。Bounded relative rotational CCD 耗盡只回報未證明省略時間，不偽造 contact／clamp velocity；sensor discrete，deforming sweeps 不支援，dynamic concave compound 見 `convexHull`／`Compound2D`／`DynamicConcave2D`。 |
| P77 locomotion            | `scene.createLocomotion3D(controller,options)` owns 獨立 fixed mixer／driver、借用 capsule／visual skeleton。FixedUpdate 設 input，不再 manual advance 或把 mixer 加入 Scene 普通動畫。Scene destroy driver 不 destroy 借用物件。限 upright capsule／yaw，不是通用攀爬／游泳 controller。                                                                                                                                           |
| P78 navigation            | 有限多層 sampled lattice：default4／max8 support slots、總8192 slots、有限 support sampling／capsule clearance；非 polygon navmesh／連續支撐證明。Projection 必須水平／垂直距離上限與 certified radius。Bake／search 共用 Scene quota。特殊 link 要真 traversal handler，缺少即 blocked，不穿樓板 teleport。                                                                                                                        |
| P79 visibility            | Renderer-owned 集合保留 offscreen shadow caster／完整 shadow instances。Screen LOD／HLOD 使用 coverage 與 owned node replacement、借用資源不銷毀。Native occlusion 是 opt-in exact-state depth-query proof，pending／stale／exhausted 保持可見。Mutable pose refresh O(meshes)、instance tests O(instances)；未知 custom displacement 保守可見。                                                                                    |
| P80／P84 material／lights | NativeMaterial3D 提供明示 WGSL／GLSL mesh hooks、借用 textures／uniforms 與可用時的有限 deformation bound；無 transpiler／Canvas3D fallback。Publication 前處理 native preparation failure。有限 camera／shadow distance 與 per-draw point／spot selection 不等於 Scene pool；budget 明示 select／reject，不保證全部 authored lights／shadows 影響每 draw。Native backend 驗收另記。                                                |
| P81 streaming             | `scene.createWorldStreaming` owns bounded cell admission／pause／publication／retirement。Loader 在 fallible await 前 own detached root，使用 pooled scopes，consumer teardown 後 release。只有 active cells 提供 collider／navigation；cancelled late reservation 保留至 settlement。Error sticky、retry 明示。Cell caps 不是 VRAM budget／CPU preemption。                                                                        |
| P82 workers               | NativeWorkerPool 以可信 module URL 執行真 Workers，bounded queue／bytes、明示 transfer／copy ownership、running cancel 真 terminate。Destroy 終止 owned workers。成功 output caller-owned；definition 回收未發布 native payload。Geometry publication 仍在 main-thread validate／interleave／copy 並回報成本，transfer 非 zero-copy publication／FPS 保證。                                                                         |
| P83 import                | Tiled finite orthogonal right-down JSON 支援 atlas tilesets／GID transforms／layers／properties／真 object與tile collider。Unsupported field／format 精確拒絕；無 editor GUI／外部 arbitrary code。ResourcePool／content scopes 保護 shared borrower 與 late decoded assets。                                                                                                                                                       |
| P85 particles             | Native GPU particles 在 GPU／GL 以 bounded seed／time／rate／burst／capacity／lifetime／space 契約執行；Canvas2D unsupported。Scene owns simulation time／lifetime；GPU visual particles 非 CPU physics collider、非 exact replay／readback 保證。                                                                                                                                                                                  |
| P86 measurement           | WebGPU timestamp 是真 render／compute pass duration 總和，不含 gaps／queue／presentation；WebGL 為 native command interval。Unsupported／empty／quantized／invalid 為 nullable，不捏造 CPU fallback。代表 loading／steady workload 分開 frame／CPU／GPU／hitch／heap／RSS／residency estimates，以裝置明示 limits 比較，不承諾通用 FPS。                                                                                            |
| P87 accessibility         | Game-local preferences 真正調整 canvas text scale／contrast／decorative reduced motion，OS 預設、玩家 override；必要 simulation 繼續。Semantic DOM 只鏡射 focus／modal／live announcement；application owns modal 關閉、remap、localization。完整英語／繁中 route 可鍵盤遊玩；真 spoken AT 未驗／blocked，不以 AX snapshot 冒稱認證。                                                                                               |

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
WebCodecs 容器輸入限有界 MP4 快照萃取（`demuxMP4`／`VideoTextureDecoder.fromMP4`）。

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
`textureSource`。WebCodecs 接受已設定 codec 的 elementary chunks，或經`demuxMP4`／
`VideoTextureDecoder.fromMP4`的有界 MP4 快照（單一 video track、avc1／vp09／av01，
fragmented／encrypted 容器拒絕）；
Canvas2D 支援 video Sprite，不支援 3D material。

Mesh feature variants 自動 lazy 編譯，無需 opt-in；避免 cold draw 編譯可在
publication 前 prepare resources，cache eviction／recovery 後仍可能重編。
Native vertex 可選 `xyzDeformInstance(position, normal, uv, instance)`，
回傳 `XYZVertex`；WGSL `mat4x4f`／GLSL `mat4` 是 local instance matrix。
Color／shadow 共用此 hook，缺省維持既有 `xyzDeform`。

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

## Byte-offset bundle archive

`loadAssetBundleRange('/manifest.json', configuration)` 沿用既有 renderer／loader、
signal 與 manifest SHA-256 pin。manifest 增加
`archive: { path: 'archive.bin', bytes, members: [{ path, offset, bytes }] }`，
每個 member 對應原 files 的 bytes／SHA-256。offset 指向未壓縮串接資料，不是 ZIP 壓縮 entry。
一般目錄 bundle 仍使用 `loadAssetBundle`。

Range 成功必須回傳精確 `206 Content-Range`；忽略 Range 的 `200` 只保留一次有界完整讀取，
`405`／`416`／`501` 則重試不帶 Range。完整讀取上限是宣告 archive size（最多 128 MiB）；
錯誤 partial headers、超量或 hash 不符會拒絕。abort／load 結束釋放 reader 與暫存 URL，
回傳 model 的 ownership 不變。

## GIF／APNG 動態影像

從 `xyz.js` import `AnimatedImageTexture`／`SpriteSheet`。自行讀取有界 bytes 後呼叫
`await AnimatedImageTexture.decode(bytes, 'image/gif')`；APNG 使用 `'image/png'`。
必須有 ImageDecoder，不支援時明確拒絕，沒有 fallback。將結果借給 Sprite，
在 simulation update 呼叫 `texture.updateAnimation(deltaSeconds)`；pause／reset／play
由 caller 控制，reset 保留 pause，有限 file loops 停在末 frame。

需要 SpriteSheet 時使用 `const atlas = texture.createAtlas()` 與
`new SpriteSheet(atlas.texture, atlas.frames)`；animation frame 對應的秒數為
`atlas.durations[index]`。atlas 不隨動態 texture 銷毀。移除 consumers 後分別 destroy
動態 texture／atlas；SpriteSheet 不銷毀借用 texture。

## Frame profiling

`const profiler = new Profiler(game.graphics, { enabled: true, windowFrames: 240 })`
附掛實際 Game frames；`report()` 回傳可 JSON 序列化 snapshot，`format()` 回傳文字。
GPU timing 須於 `Game.create` 設定 `gpuTiming: { enabled: true }`，不支援／尚無結果為 null。
`profiler.enabled = false` 停止 collection，`destroy()` 解除附掛。
CPU frame、CPU submit、原始 RAF cadence 與 GPU latency 分開，不從 clamp delta
推算 FPS；JS allocation、GPU／presentation FPS 不宣称量測。
Chromium `regression:browser --renderer webgl2` 或 `--renderer webgpu` 會額外執行兩個
強制 native backend 的 deterministic pixel parity gate。

## 匯出 glTF 快照

由 root import `exportGLTF`／`exportGLB`。`await exportGLTF(scene,
{bufferURI:'scene.bin',animations:clips})` 回傳 `{json,buffers}`，自行 serialize
JSON 並將 binary 寫成相符的 filename；`await exportGLB(scene,{animations:clips})`
可直接建立 `new Blob([bytes],{type:'model/gltf-binary'})`。engine 不下載／寫檔，
caller 管理 blob URLs 與 source textures 的 lifetime。
預設 embedded PNG 需要 browser canvas；外部圖像使用
`{textures:'external',textureURI:texture=>imageURLs.get(texture)!}`，每張圖皆須 URL。
也接受無 parent mesh／group／root array。只匯出明確傳入的 source clips，不 bake
mixer 狀態；unsupported features 拒絕，詳見 [契約](TECHNICAL.md#gltf-export)。

## 建立自然場景

開啟 [world-nature](../examples/world-nature/)，使用 `?renderer=webgl2` 或
`?renderer=webgpu`；Canvas2D 明確不支援此 3D 場景。`&stress=1` 請求
1,048,576 source height samples 與 10,000 grass instances，非實測 FPS 保證。

由 `xyz.js` import `Terrain3D`／`Water3D`／`VegetationMaterial`／
`createGrassGeometry`／`scatterVegetation`。在既有 scene 與 live borrowed texture 下：

```ts
const terrain = scene.add(
  new Terrain3D({
    heightmap: { width: 3, height: 3, heights: [0, 0, 0, 0, 1, 0, 0, 0, 0] },
    material: new TextureMaterial({ texture }),
    width: 20,
    depth: 20,
  }),
);
const water = scene.add(
  new Water3D({ texture, width: 20, depth: 20, foam: true }),
);
const wind = new VegetationMaterial({ texture, doubleSided: true });
const normal = new Vector3();
const foliage = scatterVegetation({
  geometry: createGrassGeometry(),
  material: wind,
  bounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 },
  count: 1000,
  seed: 1,
  sampleSurface: (x, z) => {
    terrain.normalAt(x, z, normal);
    return {
      height: terrain.heightAt(x, z)!,
      normal: [normal.x, normal.y, normal.z],
    };
  },
});
scene.add(foliage.root);
// Scene.update(deltaTime) 中：
// water.update(deltaTime);          // delta seconds
// wind.update(game.clock.elapsedTime); // absolute 模擬時間
```

上例另需 import `TextureMaterial`／`Vector3`。Height／surface sampling 是 local，
上例假設 terrain 與 scatter root 同為 identity transform；normal 只篩 slope，不使
blade 傾斜。編輯 terrain.heights 後呼叫 terrain.markUpdated()，不自動生成 physics／
navigation。多 layer 使用 `await TerrainSplatMaterial.create({layers,weights,size})`，
把 preset.material 交給 Terrain3D；靜態 bake 要更新時建立新 preset。

Scene teardown 清 owned objects，Water3D 一併 destroy 自有 material。Terrain／foliage
借用材質／maps，所有 consumers 移除或 destroy 後才 destroy wind／splat preset，
borrowed texture 另行釋放。GPU 水面／wind 不改 CPU picking／collision geometry；
foam 是 crest height 效果，不是 shoreline depth foam。Moving-object trail 可直接使用：

```ts
import { Trail3D } from 'xyz.js';

// target 為既有 Object3D；trailMaterial 是借用的 transparent material。
const trail = scene.add(
  new Trail3D({
    target,
    material: trailMaterial,
    lifetime: 1,
    maxPoints: 128,
    minimumDistance: 0.05,
    mode: 'flat',
  }),
);
// 在更新 target 後、Scene.update 內：
// trail.sample(game.clock.elapsedTime);
// 重置時間／重新開始取樣前：trail.clear();
```

Trail 保持無 parent、identity transform，因 sample 記錄的是 target world position。
時間為非遞減模擬秒數，固定容量滿時覆寫最舊點，停留仍會淘汰到期資料。
camera-facing 模式另外提供 mesh-local 非零 camera view direction。
Scene teardown 清 trail object，不清借用 target／material／maps。
完整 API 上限與 streaming ownership 見
[技術參考](TECHNICAL-zh.md#自然世界地形水面與植被)；實測證據由 ACCEPTANCE／CURRENT 另記。

## 重現材質參考

`pnpm build` 後執行 `pnpm check:material-reference`，以真 managed Chromium
強制兩 native backends 驗證 committed numeric baseline。只有明確採納並審查
rendering 改動時才使用 `pnpm check:material-reference --regenerate`；
檢查 measured JSON／PNG 與 golden JSON diff。`pnpm dev` 後開啟
`/tests/browser/material-reference.html?renderer=webgl2` 或 `renderer=webgpu`
觀察固定 grids；`perturb=1` 真正改動 material，預期 baseline comparison 失敗。

## 執行材質 lifecycle

Build 後執行 `pnpm regression:browser --browser chromium --renderer
webgl2,webgpu --require-webgpu`；也可在 `pnpm dev` 開啟
`/tests/browser/material-lifecycle.html?renderer=webgl2` 或 `webgpu`。
檢查每 cycle baseline／peak／after counters、真 loss／recovery events、
pixels 與 unexpected errors。先 destroy consumers，再釋放借用的 texture／
volume／capture／atlas；最後 consumer 離開後 unload renderer geometry。
空 renderer bytes 歸零不是 physical VRAM qualification，實測範圍與 BLOCKED
項目見 ACCEPTANCE。

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

目前目錄共1063種，完整union見[CURRENT.md](CURRENT.md)。下段459種列舉保留歷史基底清單，後續種類另行逐項增補，不代表目前完整union。

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

`paleyhadamard`（佩利阿達馬矩陣）使目前目錄1062→1063種，含plain的gallery為1064項。Paley第一構造的阿達馬矩陣：對質數q（q mod 4 = 3），階為q + 1的矩陣——第0列全為+1、第0欄其餘全為−1、其餘對角線為+1，第i列第j欄（i、j為1到q）是(i − j) mod q的二次特徵（非零平方為+1、否則為−1）；seed從質數43、47、59、67、71、79中擇一，所以階是44、48、60、68、72或80；+1是亮金黃、−1是暗藍灰的圓角方塊磚，磚面凸起、磚縫較暗帶AO。因為只依賴i − j，主體呈斜向的帶狀（Toeplitz結構），第0列與第0欄形成一個十字。這是示意的圖樣，不模擬任何實物。（不同於既有的`hadamardmatrix`——它是Sylvester構造的64階，也不同於`paleytable`——它是61階的勒壤得符號表，沒有第0列與第0欄也不是阿達馬矩陣。）

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；六個質數的選法（`hash(0, 36, seed ^ 鹽值)`的六等分）、−1的色調為+1的0.3倍、金黃與藍灰色調（span 0.7、floor 0.14）及0.5 m nominal tile皆作者設定（預覽只看了seed 7一張，階68）。測試**只靠讀回取樣結果**：以seed 3、1、0、7、6、16依序對應階44、48、60、68、72、80（這個對應是我先用探針量到的），每格中心顏色高於0.6讀成+1、否則−1，沒有任何讀回值落在門檻±0.1內；對讀回的矩陣檢查：任兩列的內積為0、自己與自己的內積為階數（也就是阿達馬矩陣的定義，依定義逐對計算）、第0列全為+1、第0欄其餘全為−1、對角線全為+1；並確認翻轉任何一個項目、或用錯誤的階（多4）去讀，都會破壞正交性，所以檢查不是空洞的。這證明sampler畫出的是這六個階的阿達馬矩陣；**不**證明Paley構造本身的定理（我沒有另外驗證該定理，只驗證了這六個畫出的矩陣符合定義），也**不**證明所有seed都落在這六個階（探針的13個seed，0到11與0xffffffff，都是六個階之一，另外掃到seed 16是階80；沒有檢查其他seed）。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0421）。256²與512²取樣的亮處占比略有不同（見下），因為取樣點在格內的位置不同；測試採用256²的數值範圍。

啟動時（每個sampler）以`hash(0, 36, seed ^ 鹽值)`選質數`q`，階`size = q + 1`；對`1 ≤ t < q`標出平方剩餘`t² mod q`；第`row`列第`col`欄的值：`row = 0`為+1，`col = 0`（`row > 0`）為−1，否則`delta = row − col`，當`delta = 0`或`(delta + q) mod q`是平方剩餘時為+1、否則−1，存入`Uint8Array(size²)`；色調為+1時`0.7`、−1時`0.7 × 0.3`；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1）：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height＝`0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫處降至0.6、金屬factor為0；保留的cache是最多（階80）`Uint8Array(6,400)`加上79個位元組的平方剩餘表，與`Float64Array(128²)` 131,072 B，共約137.6 kB，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**。實測（工具實跑）：13個seed（0–11與0xffffffff）都在六個階之一讀回正交的阿達馬矩陣、沒有模稜兩可的讀回；+1的最低讀回色調0.825–0.826、−1的最高讀回色調0.364–0.365；seed 3／1／0／7／6／16依序是階44／48／60／68／72／80（seed 4、5也是44，2是48，8、9、0xffffffff是60，10是72，11是68）；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）36.35%–36.67%、color 0.02521–0.02586至0.85421–0.85459、平均0.44404–0.44443、roughness恆為0.4、AO最低0.6、height至多0.8467–0.8479 relief；512²取樣（seed 0／1／0xffffffff／7）亮處36.28%–36.68%、color 0.02509–0.02529至0.85460–0.85487、平均0.44381–0.44431、AO最低0.6、height至多0.8494–0.8500 relief；seed 0與1相比，512²中color>0.5的取樣41.6%不同；seed 7（階68）的512²maps平均r／g／b約(117.6, 103.2, 65.5)、法線tilt²最大約0.0421、z分量最小252。我實看了預覽（seed 7，2×2個tile）：斜向的金黃與暗色帶，在第0列與第0欄形成十字。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('paleyhadamard', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`cayleytable`（凱萊表）使目前目錄1061→1062種，含plain的gallery為1063項。階為16的群的乘法表（凱萊表）：seed從六個群中擇一——循環群Z16、Z8×Z2、Z4×Z4、Z4×Z2×Z2、Z2×Z2×Z2×Z2，以及八邊形的二面體群（旋轉a與反射位元b，元素編號`8b + a`，`(a, b)(c, d) = (a + (−1)^b c, b + d)`）；直積群的元素以混合進位編號（第一個因子變動最快），所以元素0是單位元；第row列第col欄的磚是元素row與元素col的乘積的編號，以16階由深到亮的玫瑰色調表示，磚面凸起、磚縫較暗帶AO。每一列、每一欄都恰好出現每個編號一次（拉丁方陣）。這是示意的圖樣，不模擬任何實物。（不同於既有`xortable`——它是Z2⁶的表，與`modulartable`、`paleytable`等數論表。）

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；16×16、六個群的選法（`hash(0, 35, seed ^ 鹽值)`的六等分）、玫瑰色調（span 0.7、floor 0.14）及0.5 m nominal tile皆作者設定（預覽只看了seed 0與5兩張，兩者在探針中都是Z2×Z2×Z2×Z2，所以兩張一樣，其餘四個群我**沒有實看預覽**）。測試**只靠讀回取樣結果**：每格中心的顏色是`toneFloor`加上`toneSpan / 15`的整數倍加上不超過一階三分之一的grain，四捨五入就得到編號（讀回與整數階的最大差距為0.317–0.321階）；以seed 0、1、4、8、12、13涵蓋六個群，從讀回的16×16表檢查：每一列與每一欄都有16個不同的編號（拉丁方陣）、第0列與第0欄是單位元、乘法對全部4,096個三元組結合，再讀出三個能區分階為16的群的量——表是否對稱、除單位元外平方為單位元的元素個數、元素的最大階——預期值（我自己手算，沒有對照文獻）是：Z2⁴為（對稱, 15, 2）、Z4×Z2×Z2為（對稱, 7, 4）、Z8×Z2為（對稱, 3, 8）、Z4×Z4為（對稱, 3, 4）、Z16為（對稱, 1, 16）、二面體群為（不對稱, 9, 8），六個全部吻合。這證明sampler畫出的是這六個群的乘法表（以這些不變量辨識，六個群彼此不同構）；**不**證明該表與課本上的群的乘法表逐格相同——這些不變量不能唯一決定同構類以外的事情（例如元素的編號方式），也**不**證明所有seed都落在這六個群（探針的200個seed只出現這六種不變量組合，各為41／34／37／32／33／23個，分別是Z2⁴、Z4×Z2×Z2、Z8×Z2、Z4×Z4、Z16、二面體群，其中二面體群的23個較少，我沒有檢查這個分布是否均勻）。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0069）。256²與512²取樣的亮處占比略有不同（見下），因為取樣點在格內的位置不同；測試採用256²的數值範圍。

啟動時（每個sampler）以`hash(0, 35, seed ^ 鹽值)`選一個群，產生`Uint8Array(256)`的乘法表：直積群用混合進位，逐個因子取`(x mod m + y mod m) mod m`並乘上進位的權重；二面體群用`(b xor d)·8 + ((a + (b = 0 ? c : 8 − c)) mod 8)`；第`row`列第`col`欄的值是元素`row`乘元素`col`的編號，色調為`0.7·值 / 15`；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1）：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height＝`0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫處降至0.6、金屬factor為0；保留的cache是`Uint8Array(256)` 256 B與`Float64Array(128²)` 131,072 B，共131,328 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**。實測（工具實跑）：13個seed（0–11與0xffffffff）都是拉丁方陣、單位元在第0列與第0欄、結合律失敗0個；seed 0／1／4／8／12／13分別是Z2⁴、Z4×Z2×Z2、Z8×Z2、Z4×Z4、Z16、二面體群；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）35.74%、color 0.02561–0.02575至0.85352–0.85447、平均0.36491–0.36498、roughness恆為0.4、AO最低0.6、height至多0.8444–0.8466 relief；512²取樣（seed 0／1／0xffffffff／7）亮處35.35%–35.37%、color 0.02517–0.02537至0.85447–0.85485、平均0.36478–0.36493、AO最低0.6、height至多0.8483–0.8507 relief；seed 0（Z2⁴）與seed 1（Z4×Z2×Z2）相比，512²中color>0.5的取樣只有0.33%不同，但格中心顏色差>0.05的格子占25%；seed 7（Z8×Z2）的512²maps平均r／g／b約(105.8, 48.9, 70.1)、法線tilt²最大約0.0069、z分量最小255。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('cayleytable', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`sortingnetwork`（排序網路）使目前目錄1060→1061種，含plain的gallery為1062項。16條線的排序網路示意圖：16條水平的線（wire）上，比較器（comparator）畫成連接兩條線的垂直連桿，兩端各有一個亮點；比較器把兩條線上較小的值放到編號較小的線；seed從三種經典網路中擇一——Batcher的奇偶合併排序（63個比較器、24欄）、奇偶換位排序（120個、16欄）、雙調排序的標準形式（80個、26欄）；同一層的比較器以區間著色分到不同欄、各層由左向右排列；深藍綠底上的綠色電路圖樣，線較暗、連桿較亮、端點最亮。這是示意的圖樣，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；16條線、線半寬0.0035、連桿半寬0.0035、端點半徑0.014、色調（線為0.45、連桿再加0.2、端點再加0.35個span，span 0.7、floor 0.14）、深藍綠到綠色的調色及0.5 m nominal tile皆作者設定（預覽看了seed 7、1、0三張）。測試**只靠讀回取樣結果**：在512×512網格上把色調高於0.7的像素以環面上4-連通的flood fill分組，取圓形平均得到每個端點的中心（每點約8–14像素）；把端點依u（容許0.004）分成欄，欄內依v排序後兩兩配對，檢查每個端點都落在某條線上（v偏離線的列不超過0.05條線距）、一對的連桿中點色調高於0.52、與下一對之間的間隙中點不高於0.52；再依由左到右的順序把讀回的比較器套用到全部65,536個0與1的輸入上，確認全部排序成功——依0–1原理，這就證明這個網路確實能對任意輸入排序（0–1原理是標準的排序網路結論，這裡拿來用，我沒有另外驗證它）；並確認拿掉第一個、中間或最後一個比較器就不再排序，使這個檢查不是空洞的。另外檢查每條線在欄外是0.43–0.48的線、線之間的列色調低於0.06。這證明sampler畫出的是真的能排序的網路；**不**證明圖樣上沒有多餘的圖形（只檢查了亮點、連桿與線的位置與色調），也**不**證明三個網路是最佳或最小的，也不是每個seed都檢查過（只檢查了seed 0、1、0xffffffff，探針另外看了seed 2–7，只會落在這三種網路）。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0192）。256²與512²取樣的亮處占比、最高色調與平均都差異很大（見下），因為端點很小，取樣點落在端點內的位置與解析度影響很大；測試採用256²的數值範圍。

啟動時（每個sampler）依`hash(0, 34, seed ^ 鹽值)`選一種網路，產生比較器串列`(上, 下)`：奇偶合併排序用標準的遞迴`merge(low, size, reach)`（每個`step = 2·reach`，遞迴兩次後在`i = low + reach`起每隔`step`加入`(i, i + reach)`；`step ≥ size`時加入`(low, low + reach)`）；雙調排序的標準形式對`size = 2, 4, …, 16`先做「翻轉」`(start + i, start + size − 1 − i)`，再對`span = size / 4`逐次減半、對`i mod 2span < span`加入`(i, i + span)`；奇偶換位排序做16輪、每輪對`i = 輪 mod 2`起每隔2的`(i, i + 1)`；每個比較器放到兩條線最後一層的下一層，同層的比較器依上端排序後以貪婪的區間著色分到欄，各層的欄由左到右接續；取樣時線是`t = max(0, 1 − 到最近一條線的距離² / 半寬²)`，連桿與端點是自己欄與左右各一欄中每個比較器的同樣公式（連桿用到垂直線段的距離、端點用到點的距離、端點半徑較大所以要看相鄰欄），各自取`1 − Π(1 − t²)`聯集（每個t²皆為C1且在邊緣恰為零，所以聯集與整個場為C1）；`total = 1 − (線的補)(連桿的補)(端點的補)`，`mask = smooth(clamp(total / 0.35))`，color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`tone`＝`0.7·(0.45 + 0.2·連桿聯集 + 0.35·端點聯集)`）、height＝`0.8·total·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫處降至0.6、金屬factor為0；保留的cache是`Float64Array(128²)` 131,072 B加上比較器與欄的表（最多120個比較器，位元組數未逐項計算）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構（比較器串列與著色）與取樣耗時未量測**。實測（工具實跑）：seed 0讀回63個比較器、24欄、126個端點；seed 1讀回120個、16欄、240個；seed 0xffffffff讀回80個、26欄、160個（探針另看了seed 2–7，seed 3、6是奇偶合併排序，seed 2、4、5、7是奇偶換位排序）；各seed都沒有奇數個端點的欄、沒有偏離線的端點、沒有連桿不亮或間隙被連桿填滿；讀回的網路都能對65,536個輸入排序成功；探針中把這三個網路的任何一個比較器拿掉（共63＋120＋80次）都不再排序；seed 0在欄外的線色調0.4448–0.4699、線之間0.0251–0.0546（以16條線與16個列檢查）；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）8.72%–11.72%、color 0.02523–0.02564至0.7601–0.8416、平均0.13286–0.14309、roughness恆為0.4、AO最低0.6、height至多0.8195–0.8411 relief；512²取樣（seed 0／1／0xffffffff／7）亮處8.00%–10.08%、color 0.02512–0.02530至0.8278–0.8497、平均0.11642–0.12685、AO最低0.6、height至多0.8435–0.8470 relief；seed 0與1相比，512²中color>0.5的取樣15.1%不同；seed 7（奇偶換位排序）的512²maps平均r／g／b約(19.9, 43.5, 44.3)、法線tilt²最大約0.0192、z分量最小254。我實看了預覽（seed 7與1是磚牆般的規則格子，seed 0是複雜的電路圖）。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('sortingnetwork', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`relativeneighborhood`（相對鄰近圖）使目前目錄1059→1060種，含plain的gallery為1061項。環面上Poisson-disk點集的相對鄰近圖（relative neighbourhood graph）：先用dart throwing在單位環面上取最小間距0.085的點（約90個，取法與`poissondisk`、`gabrielgraph`、`euclideanmst`相同、鹽值不同），再把「沒有任何第三點同時比兩點之間的距離更靠近兩點」（即兩點的「月牙形區域」是空的）的兩點連成邊（沿環面最短路徑、距離不超過0.25）；點畫成較亮的小圓，邊畫成較細的線，粉紅色的網路在深紫色底上，比Gabriel圖稀疏、比最小生成樹多出一些環。seed決定點集。這是示意的圖樣，不模擬任何實物。（和`gabrielgraph`、`euclideanmst`的差別在於邊的選法；「最小生成樹 ⊆ 相對鄰近圖 ⊆ Gabriel圖」是標準的幾何圖論結論，我沒有在此另外驗證。）

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；最小間距0.085、點半徑0.024、邊半寬0.0075、最長邊0.25、粉紅色調（span 0.7、floor 0.14、邊的色調為點的0.55倍）及0.5 m nominal tile皆作者設定（預覽只看了一版）。測試**只靠讀回取樣結果**：與`gabrielgraph`相同地在512×512網格上把色調高於0.66的像素分組並取圓形平均得到節點中心（約90個點、每個150–180像素、兩兩距離至少0.083）；對每一對距離不超過0.25的點，用測試端依定義另外寫的判斷（沿環面最短路徑，沒有其他中心同時比這兩點之間的距離更靠近兩點）分類：其他中心離「較遠的那一端」都至少比這對距離大0.003的「明確是邊」，要求連線上25%、40%、50%、60%、75%五個取樣點色調都高於0.3；有中心至少小0.003、且沒有第三個中心距離該線段小於0.02的「明確不是邊」，要求這五點不全亮；其餘配對（差距在0.003內或鏈狀）不判定。這證明sampler畫出的邊與相對鄰近圖的定義在被判定的配對上一致；**不**證明所有被排除或差距在0.003內的配對也一致，也不證明圖連通或平面。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0157）。256²與512²取樣的亮處占比不同（見下），因為取樣點的位置與解析度不同；測試採用256²的數值範圍。

啟動時（每個sampler）以`hash(k, 0/1, seed ^ 鹽值)`逐個取6,000個候選點，與已留下的點的環面最短距離至少0.085才留下（約87–92個）；對每一對點（沿環面最短向量，長度不超過0.25），當不存在任何第三點k使`max(到i的距離, 到j的距離) < 這對的距離`時成為邊；每條邊登記到取樣點可能落入的12×12個bucket（沿路徑每0.25/12一步，加上邊半寬與半步的範圍），所以取樣時只看自己的bucket；取樣時節點是對3×3個bucket內的點的`t = max(0, 1 − 距離² / 半徑²)`，邊是對bucket內線段的同樣公式（距離為到線段的距離），各自取`1 − Π(1 − t²)`聯集（每個t²皆為C1且在邊緣恰為零，所以聯集與整個場為C1）；`total = 1 − (節點聯集的補) × (邊聯集的補)`，`mask = smooth(clamp(total / 0.35))`，color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`tone`＝`0.7·(0.55 + 0.45·節點聯集)`）、height＝`0.8·total·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫處降至0.6、金屬factor為0；保留的cache是`Float64Array(128²)` 131,072 B加上點與邊的表（點約90個、邊約百餘條，位元組數未逐項計算）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**。實測（工具實跑，seed 0／1／0xffffffff／7）：讀回的節點89／89／87／92個、最近兩點距離0.0848／0.0846／0.0851／0.0849、512²網格每點157–172像素（seed 0／1／0xffffffff）；明確的邊配對127／133／130／134對、五點皆亮（誤判0）；明確的非邊配對（已排除鏈狀配對）452／447／415／476對、沒有五點全亮者（誤判0）；被排除的鏈狀配對149／140／136／155對；差距在0.003內而不判定的配對18／15／16／25對；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）17.63%–18.16%、color 0.02543–0.02580至0.84884–0.85075、平均0.15242–0.15594、roughness恆為0.4、AO最低0.6、height至多0.8427–0.8456 relief；512²取樣（四個seed）亮處17.63%–18.58%、color 0.02519–0.02526至0.85096–0.85246、平均0.15240–0.15852、AO最低0.6、height至多0.8456–0.8485 relief；seed 0與1相比，512²中color>0.5的取樣29.3%不同；seed 7的512²maps平均r／g／b約(52.2, 32.2, 58.5)、法線tilt²最大約0.0157、z分量最小254。我實看了預覽（seed 7，2×2個tile）：粉紅色的網路，有許多四邊形與少數懸掛的葉。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('relativeneighborhood', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`euclideanmst`（歐氏最小生成樹）使目前目錄1058→1059種，含plain的gallery為1060項。環面上Poisson-disk點集的歐氏最小生成樹：先用dart throwing在單位環面上取最小間距0.085的點（約90個，取法與`poissondisk`、`gabrielgraph`相同、鹽值不同），再用Kruskal演算法在「沿環面最短向量、距離不超過0.25」的點對中取出連接所有點、總長最短的邊（共約點數−1條）；點畫成較亮的小圓，邊畫成較細的線，琥珀色的樹狀網路在深褐色底上，像星座連線，邊與點的交接處是光滑的聯集。seed決定點集。這是示意的圖樣，不模擬任何實物。（和`gabrielgraph`的差別在於邊的選法：最小生成樹是Gabriel圖的子圖，邊少得多。這個子圖關係是標準的幾何圖論結論，我沒有在此另外驗證。）

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；最小間距0.085、點半徑0.024、邊半寬0.0075、最長邊0.25、琥珀色調（span 0.7、floor 0.14、邊的色調為點的0.55倍）及0.5 m nominal tile皆作者設定（預覽只看了一版）。測試**只靠讀回取樣結果**：與`gabrielgraph`相同地在512×512網格上把色調高於0.66的像素分組並取圓形平均得到節點中心；sampler用Kruskal演算法，測試端改用**不同的判準**——圈性質（cycle property）：一對點在樹中，若兩點之間所有不經過這條直接連線的路徑（沿環面最短距離）最長的一步都比這對點自己的距離長；不在樹中，若存在只由更短的步組成的路徑；與自身距離差不超過0.003的配對不判定。明確在樹中的配對，要求連線上25%、40%、50%、60%、75%五個取樣點色調都高於0.3；明確不在樹中、且沒有第三個中心距離線段小於0.02的配對，要求這五點不全亮（鏈狀配對與`gabrielgraph`相同的理由被排除）。這證明sampler畫出的邊與最小生成樹在被判定的配對上一致；**不**證明所有配對（包含差距在0.003內的）一致，也不證明該樹是連通的——不過，用讀回的中心以Prim演算法算出的樹，邊數恰為點數−1（見下）。重要的實測教訓：第一版用Prim演算法在讀回的中心上直接比對，三個seed各有一對誤判（一條應在的邊與一條不該在的邊互換），原因是Poisson-disk的鄰近距離集中在0.085–0.115，很多邊長度相差不到讀回的中心誤差，所以才改成帶門檻的圈性質判準。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0157）。256²與512²取樣的亮處占比不同（見下），因為取樣點的位置與解析度不同；測試採用256²的數值範圍。

啟動時（每個sampler）以`hash(k, 0/1, seed ^ 鹽值)`逐個取6,000個候選點，與已留下的點的環面最短距離至少0.085才留下（約86–93個）；列出所有沿環面最短向量、長度不超過0.25的點對，依長度由短到長排序，用union-find（路徑減半）逐對檢查：兩端還不在同一棵樹時就留下這條邊（Kruskal演算法，得到最小生成樹；若0.25切斷了圖則為森林）；每條邊登記到取樣點可能落入的12×12個bucket（沿路徑每0.25/12一步，加上邊半寬與半步的範圍），所以取樣時只看自己的bucket；取樣時節點是對3×3個bucket內的點的`t = max(0, 1 − 距離² / 半徑²)`，邊是對bucket內線段的同樣公式（距離為到線段的距離），各自取`1 − Π(1 − t²)`聯集（每個t²皆為C1且在邊緣恰為零，所以聯集與整個場為C1）；`total = 1 − (節點聯集的補) × (邊聯集的補)`，`mask = smooth(clamp(total / 0.35))`，color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`tone`＝`0.7·(0.55 + 0.45·節點聯集)`）、height＝`0.8·total·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫處降至0.6、金屬factor為0；保留的cache是`Float64Array(128²)` 131,072 B加上點與邊的表（點約90個、邊約點數−1條，位元組數未逐項計算）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**。實測（工具實跑，seed 0／1／0xffffffff／7）：讀回的節點93／87／86／92個、每點156–174像素（512²網格）；以圈性質、門檻0.003判定：明確在樹中的配對75／78／73／76對、五點皆亮（誤判0）；明確不在樹中的配對（已排除鏈狀配對）539／493／452／526對、沒有五點全亮者（誤判0）；被排除的鏈狀配對162／122／140／152對；不判定的配對33／16／26／31對；用Prim演算法在讀回的中心上算出的樹邊數92／86／85／91（點數−1）、最長邊0.1138／0.1148／0.1095／0.1102；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）13.17%–14.08%、color 0.02553–0.02572至0.84778–0.85061、平均0.12817–0.13472、roughness恆為0.4、AO最低0.6、height至多0.8412–0.8444 relief；512²取樣（四個seed）亮處13.10%–14.04%、color 0.02511–0.02522至0.85174–0.85329、平均0.12812–0.13471、AO最低0.6、height至多0.8451–0.8497 relief；seed 0與1相比，512²中color>0.5的取樣23.7%不同；seed 7的512²maps平均r／g／b約(54.9, 37.2, 23.0)、法線tilt²最大約0.0157、z分量最小254。我實看了預覽（seed 7，2×2個tile）：琥珀色的樹狀網路，像星座連線。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('euclideanmst', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`gabrielgraph`（Gabriel圖）使目前目錄1057→1058種，含plain的gallery為1059項。環面上Poisson-disk點集的Gabriel圖：先用dart throwing在單位環面上取最小間距0.085的點（約90個，和`poissondisk`同一類取法、鹽值不同），再把「以兩點連線為直徑的圓盤內沒有第三點」的兩點連成邊（沿環面最短路徑、距離不超過0.25）；點畫成較亮的小圓，邊畫成較細的線，青藍色網路在深藍底上，邊與點的交接處是光滑的聯集。seed決定點集。這是示意的圖樣，不模擬任何實物。（和既有`poissondisk`的差別在於本材質另外畫了Gabriel圖的邊。）

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；最小間距0.085、點半徑0.024、邊半寬0.0075、最長邊0.25、青藍色調（span 0.7、floor 0.14、邊的色調為點的0.55倍）及0.5 m nominal tile皆作者設定（預覽只看了一版）。測試**只靠讀回取樣結果**：在512×512網格上把色調高於0.66的像素以環面上4-連通的flood fill分組，取圓形平均得到每個點的中心（約90個點、每個150–175像素、兩兩距離至少0.083）；對每一對距離不超過0.25的點，用測試端依定義另外寫的判斷（沿環面最短路徑、以連線為直徑的圓盤內沒有其他中心）分類：其他中心全部在圓外至少0.006的「明確是Gabriel邊」，要求連線上25%、40%、50%、60%、75%五個取樣點色調都高於0.3；有中心在圓內至少0.006、且沒有第三個中心距離該線段小於0.02的「明確不是邊」，要求這五點不全亮。圓邊界±0.006內的曖昧配對不判定；有第三個中心落在線段附近0.02內的配對也不判定——這類配對很常見（「一次中點取樣」的第一版就因此誤判：非邊配對的中點常落在第三個點的其他邊上，所以改成五點全亮的條件並排除這類鏈狀配對）。這證明sampler畫出的邊與「Gabriel圖」的定義在被判定的配對上一致；**不**證明所有曖昧配對也一致，也不證明圖在環面上是平面圖或連通的。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0152）。256²與512²取樣的亮處占比不同（見下），因為取樣點的位置與解析度不同；測試採用256²的數值範圍。

啟動時（每個sampler）以`hash(k, 0/1, seed ^ 鹽值)`逐個取6,000個候選點，與已留下的點的環面最短距離至少0.085才留下（約88–92個）；對每一對點（沿環面最短向量，長度不超過0.25），以兩點連線中點為圓心、半徑為連線一半的圓盤內沒有第三個點時成為邊；每條邊登記到取樣點可能落入的12×12個bucket（沿路徑每0.25/12一步，加上邊半寬與半步的範圍），所以取樣時只看自己的bucket；取樣時節點是對3×3個bucket內的點的`t = max(0, 1 − 距離² / 半徑²)`，邊是對bucket內線段的同樣公式（距離為到線段的距離），各自取`1 − Π(1 − t²)`聯集（每個t²皆為C1且在邊緣恰為零，所以聯集與整個場為C1）；`total = 1 − (節點聯集的補) × (邊聯集的補)`，`mask = smooth(clamp(total / 0.35))`，color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`tone`＝`0.7·(0.55 + 0.45·節點聯集)`）、height＝`0.8·total·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫處降至0.6、金屬factor為0；保留的cache是`Float64Array(128²)` 131,072 B加上點與邊的表（點約90個、邊約數百條，位元組數未逐項計算）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**。實測（工具實跑，seed 0／1／0xffffffff／7）：點數91／89／92／88、最近兩點距離0.0849／0.0851／0.0850／0.0846；512²網格色調高於0.66的像素分組在seed 0／1／0xffffffff為每點155–171像素；明確的Gabriel邊配對227／229／223／215對、全部五點皆亮（誤判0）；明確的非邊配對（已排除鏈狀配對）364／321／386／328對、沒有任何一對五點全亮（誤判0）；被排除的鏈狀配對152／153／157／139對；曖昧配對（圓邊界±0.006內）不判定；探針把這類與「長度在0.25±0.01內」的配對合計為157／138／172／143對，後者在長度不超過0.25時其實仍會被判定，所以這個合計數略高於實際不判定的配對數；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）27.26%–29.03%、color 0.02534–0.02580至0.85028–0.85206、平均0.20498–0.21366、roughness恆為0.4、AO最低0.6、height至多0.8428–0.8445 relief；512²取樣（四個seed）亮處26.86%–28.98%、color 0.02510–0.02521至0.85166–0.85355、平均0.20193–0.21368、AO最低0.6、height至多0.8462–0.8486 relief；seed 0與1相比，512²中color>0.5的取樣40.3%不同；seed 7的512²maps平均r／g／b約(34.7, 60.2, 75.4)、法線tilt²最大約0.0152、z分量最小254。我實看了預覽（seed 7，2×2個tile）：青藍色的三角形網路，節點略亮。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('gabrielgraph', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`schelling`（謝林隔離模型）使目前目錄1056→1057種，含plain的gallery為1058項。48×48環面上的謝林（Schelling）隔離模型：每格是空格（約10%）或兩種住戶（約各45%）之一；住戶「滿意」的條件是周圍8個鄰格（繞環面接合）中已被佔用者至少有40%與自己同種（沒有鄰居也算滿意）；起始是由hash決定的隨機混合，之後依格序掃描，不滿意的住戶搬到空格清單中（從hash決定的位置起算）第一個搬過去會滿意的空格，直到沒有人搬動或達60輪；結果是兩種住戶各自聚成塊、中間散布深色空格的迷彩狀圖樣（空格深紫、一種住戶為褐色、另一種為琥珀色）。seed決定起始混合。這是示意的圖樣，不模擬任何實際城市。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；48×48、10%空格、40%滿意門檻、60輪上限、紫—琥珀色調（span 0.7、floor 0.14）及0.5 m nominal tile皆作者設定（預覽只看了一版）。測試**只靠讀回取樣結果**檢查「這是一個安定的謝林狀態」：從每格中心顏色讀出空／種類1／種類2（顏色門檻0.31與0.665，且沒有任何讀回值落在門檻±0.05內），再用測試端依定義另外寫的滿意判斷（8鄰格、繞環面、至少40%同種）確認每位住戶都滿意、沒有不滿意的住戶能靠任何空格變滿意，兩種住戶各占40%–60%、空格占8%–12%、鄰居中同種占78%–86%（隨機混合約為50%，我沒有在測試中檢查這個數字）。這證明sampler畫出的是一個滿足定義的安定狀態；**不**證明它是由「某個特定的搬遷順序」產生的（起始與搬遷由hash決定，測試端無法也沒有重播），也不證明所有seed都會收斂到全員滿意（只檢查了測試與探針用的seed，共六個，見下）。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0296）。256²與512²取樣的亮處占比不同（見下），因為格寬（約5.3與10.7像素）與取樣點在格內位置不同；測試採用256²的數值範圍。

啟動時（每個sampler）以`Uint8Array(2304)`存格子（0＝空、1與2＝兩種住戶）：`hash(i, 0, seed ^ 鹽值)`小於0.1為空、小於0.55為種類1、其餘為種類2；之後最多60輪，每輪依格序對每位不滿意的住戶，建立空格清單，從`hash(輪 × 2304 + i, 1, seed ^ 鹽值)`決定的位置起算，找第一個「搬過去（原格視為空）會滿意」的空格並搬過去；一輪都沒人搬動就停止；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1）：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14，`tone`為`0.7·{0, 1, 2}/2`）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫處降至0.6、金屬factor為0；保留的cache為`Uint8Array(2304)` 2,304 B與`Float64Array(128²)` 131,072 B，共133,376 B，皆為lattice算術預算（非總RAM；搬遷時暫存的空格清單不計）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時僅有單次、未控制條件的量測**：探針中六個seed的sampler建立時間依序約50.0（含第一次呼叫的暖機）、8.9、8.7、9.4、8.8、8.3 ms，不是可靠的效能數字。實測（工具實跑，seed 0／1／0xffffffff／7／12345／99）：空格232／216／232／249／248／220個（共2,304）；不滿意的住戶與「能靠空格變滿意的不滿意住戶」皆為0個；鄰居中同種的比例0.8147／0.8202／0.8172／0.8180／0.8179／0.8303；各seed都沒有模稜兩可的讀回；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）34.45%–35.16%、color 0.02548–0.02591至0.85407–0.85463、平均0.45537–0.45802、roughness恆為0.4、AO最低0.6、height至多0.8474–0.8500 relief；512²取樣（四個seed 0／1／0xffffffff／7）亮處33.94%–35.57%、color 0.02524–0.02548至0.85463–0.85485、平均0.45041–0.45840、AO最低0.6、height至多0.8499–0.8507 relief；seed 0與1相比，512²中color>0.5的取樣37.5%不同、格中心顏色差>0.05的格子60.2%；seed 7的512²maps平均r／g／b約(126.9, 84.3, 53.5)、法線tilt²最大約0.0296、z分量最小253。我實看了預覽（seed 7，2×2個tile）：琥珀與褐色成塊的迷彩，夾雜深紫色的小空格。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('schelling', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`josephus`（約瑟夫問題）使目前目錄1055→1056種，含plain的gallery為1057項。64×64的約瑟夫問題表：n個人圍成一圈，從頭開始每數到第k個人就淘汰他，直到只剩一人；第n−1列、第k−1欄（n與k從1到64）的格子顯示倖存者站的位置落在圓圈的哪一個八分之一（`⌊8·J(n)/n⌋`，0到7），以7階由深海軍藍到金黃的色調表示，seed決定表格在環面上的平移。表呈現出k=1（最後一位）、k=2（鋸齒）等規則的斜紋與帶狀結構與其餘看似雜亂的區域交織的圖樣。這是示意的圖樣，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；64×64、取八分之一（8階）、深海軍藍與金黃色調（span 0.7、floor 0.14）及0.5 m nominal tile皆作者設定（預覽只看了一版）。sampler用遞迴`J(1) = 0`、`J(m) = (J(m − 1) + k) mod m`；測試用**另一個獨立的方式**——真的在一個串列上把淘汰過程演一遍——重算整張表，我先用探針確認遞迴與演出在4,096格上完全相同；測試檢查k=1時倖存者恆為n、k=2時倖存者是`2(n − 2^⌊log₂n⌋) + 1`（這個封閉形式是標準的約瑟夫問題結論，這裡拿來交叉核對演出的實作，我沒有另外驗證該定理本身）、41個人每數3個淘汰留下第31位、八個色階各自出現707／425／494／463／566／473／527／441次（共4,096），並對4,096個可能的平移逐一比較格中心顏色（grain振幅0.015，容許誤差0.03），確認每個seed恰有一個平移完全吻合。這證明sampler畫出的是這張約瑟夫表的八分之一色階；**不**證明表中不規則區域有任何特別的統計性質。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0378）。256²與512²取樣的亮處占比不同（見下），因為格寬（4與8像素）與取樣點在格內位置不同；測試採用256²的數值範圍。

啟動時（每個sampler）對每格`(n, k)`（1 ≤ n, k ≤ 64）：以`J = 0`起算，對`m = 2…n`做`J = (J + k) mod m`，色調為`0.7·⌊8J / n⌋ / 7`，存入`Float64Array(4096)`；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），格索引加上由`hash(0, 32, seed ^ 鹽值)`、`hash(1, 32, seed ^ 鹽值)`決定的平移（對64取餘）：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫處降至約0.7344、金屬factor為0；保留的cache為`Float64Array(4096)` 32,768 B與`Float64Array(128²)` 131,072 B，共163,840 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構（共129,024次遞迴步（64×2,016））與取樣耗時未量測**。實測（工具實跑）：遞迴與演出在4,096格上完全相同；四個seed（0／1／0xffffffff／7）各有唯一符合的平移(57, 36)、(7, 38)、(11, 48)、(62, 16)，最大擬合誤差0.014995–0.015；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）恆為36.75%、color 0.05929–0.06033至0.85361–0.85400、平均0.40192–0.40200、roughness恆為0.4、AO最低0.7344、height至多0.8468–0.8471 relief；512²取樣（四個seed）亮處29.60%–29.65%、color 0.02528–0.02541至0.85406–0.85475、平均0.34779–0.34794、AO最低0.7344、height至多0.8487–0.8505 relief；seed 0與1相比，512²中color>0.5的取樣31.2%不同、格中心顏色差>0.05的格子87.96%；seed 7的512²maps平均r／g／b約(95.2, 85.6, 63.9)、法線tilt²最大約0.0378、z分量最小253。我實看了預覽（seed 7，2×2個tile）：金黃與深色的點狀格陣中有斜向與帶狀的結構，不規則的區域與規則的帶交織。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('josephus', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`dominotiling`（骨牌鋪磚）使目前目錄1054→1055種，含plain的gallery為1056項。32×32格環面的隨機骨牌（domino）鋪磚：每一格與一個鄰格配成一塊骨牌（1×2的長方形），整個環面被骨牌完整鋪滿；從全部橫放的磚牆排列出發，反覆做40,000次翻轉——隨機選一個2×2的方塊（左上角由hash決定、繞環面接合），如果裡面是兩塊平行的骨牌就把它們一起轉90°——所以鋪磚在整個過程中始終是完美配對；橫放的骨牌是淺沙色、直放的是深石板灰色，骨牌間有深色接縫；seed決定所有翻轉的位置。這是示意的圖樣，不模擬任何實物。（不同於既有`dominoes`的遊戲骨牌。）

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；32×32、40,000次翻轉、橫放與直放的色調（0.8與0.35倍的span）、色調（span 0.7、floor 0.14）、沙色與石板灰色及0.5 m nominal tile皆作者設定（預覽只看了一版）。測試**只靠讀回取樣結果**檢查「完美配對」這個鋪磚的定義：對1,024格各讀出中心色調（高於0.54是橫放、低於是直放），以及與四個鄰格的中點顏色（高於0.2表示沒有深色接縫、屬於同一塊骨牌），確認每一格恰好與一個鄰格相連、相連是雙向的（對方也只與它相連）、相連的方向與兩格的橫放／直放一致、共512塊骨牌，且橫放的格子占40%到60%，並且沒有任何讀回值在判斷門檻附近而模稜兩可。這證明sampler畫出的是完整的骨牌鋪磚；**不**證明這個鋪磚在所有骨牌鋪磚中是「均勻隨機」的（翻轉鏈在40,000步後是否混合均勻沒有驗證，預覽可以看到橫放與直放各自成片的區域），也不證明seed選擇的品質（測試只檢查seed 0與1的格子中，配對方向不同的比例在70%到80%之間）。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0168）。256²與512²取樣的亮處占比不同（見下），因為格寬（8與16像素）與取樣點在格內位置不同；測試採用256²的數值範圍。

啟動時（每個sampler）以`Int32Array(1024)`存每格的配對對象，起始為`x`與`x xor 1`配對（橫放的磚牆）；對`步 = 0…39,999`：以`hash(步, 0, seed ^ 鹽值)`、`hash(步, 1, seed ^ 鹽值)`決定一個2×2方塊的左上角`(x, y)`（繞環面），若`A = (x, y)`與`B = (x + 1, y)`配對、`C = (x, y + 1)`與`D = (x + 1, y + 1)`配對，就改成`A–C`、`B–D`；否則若`A–C`、`B–D`配對，就改成`A–B`、`C–D`；其餘不動；取樣時由點所在的格與它的配對對象決定骨牌，以骨牌中心為基準，`s = (fx / (0.46 + |步X| / 2))^4 + (fy / (0.46 + |步Y| / 2))^4`（四次超橢圓，在格邊界前恰為零，所以格的查找不會跳變、場為C1），`mask = smooth(clamp((1 − s) / 0.3))`：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14，`tone`橫放為`0.56`、直放為`0.245`）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO接縫處降至0.6、金屬factor為0；保留的cache為`Int32Array(1024)` 4,096 B與`Float64Array(128²)` 131,072 B，共135,168 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構（40,000次翻轉各一次hash對）與取樣耗時未量測**。實測（工具實跑，seed 0／1／0xffffffff／7）：1,024格每一格恰好一個相連鄰格、相連雙向一致、方向與橫直放一致、無模稜兩可（各seed 0個例外）；橫放的格子516／540／540／500個（共1,024）；seed 0與1相比配對方向不同的格子75.2%；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）33.07%–34.61%、color 0.02567–0.02618至0.71389–0.71453、平均0.41423–0.41980、roughness恆為0.4、AO最低0.6、height至多0.8332–0.8343 relief；512²取樣（四個seed）亮處36.58%–39.51%、color 0.02520–0.02538至0.71463–0.71480、平均0.41664–0.42608、AO最低0.6、height至多0.8361–0.8368 relief；seed 0與1相比，512²中color>0.5的取樣41.2%不同；seed 7的512²maps平均r／g／b約(107.0, 104.5, 87.2)、法線tilt²最大約0.0168、z分量最小254。我實看了預覽（seed 7，2×2個tile）：深色接縫間的淺沙色橫放骨牌與深灰色直放骨牌，像磚牆，兩個方向各自聚成成片的區域。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('dominotiling', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`stirlingparity`（第二類斯特林數奇偶）使目前目錄1053→1054種，含plain的gallery為1055項。64×64圓角方磚表：第`n`列第`k`欄放第二類斯特林數（Stirling number of the second kind）`S(n, k)`（把`n`個東西分成`k`個非空的組的方法數）的奇偶——`S(n, k)`是奇數時格子發光；`S(0, 0) = 1`，`k > n`時為0（對角線上方全暗）；奇偶可由位元運算得到：`S(n, k)`是奇數，恰當`z = n − ⌈(k + 1)/2⌉`與`w = ⌊(k − 1)/2⌋`滿足`z ≥ w`且`w`的每個1位元在`z`中也是1（即二項係數`C(z, w)`是奇數，這是盧卡斯定理（Lucas' theorem）的結果）；畫出一個傾斜的、像謝爾賓斯基三角形的碎形，銅橘色圓點在深褐色底上；4,096格中有723格是奇數；seed讓整張表在環面上平移。這是示意的圖樣，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；64×64、深褐與銅橘色調（span 0.7、floor 0.14）及0.5 m nominal tile皆作者設定（預覽只看了一版）。sampler用上述位元運算的**定理**（盧卡斯定理）直接判斷奇偶；測試用**另一個獨立的方式**——第二類斯特林數的遞迴`S(n, k) = k·S(n − 1, k) + S(n − 1, k − 1)`（`S(0, 0) = 1`，取模2）——重算整張表，我先用探針確認位元運算與遞迴在4,096格上完全相同（這也就在這張表上驗證了該定理的用法）；測試檢查奇數格共723個、對角線上方（`k > n`）全為0、前5列的前5欄是10000／01000／01100／01110／01101（即`S(n, k)`為1；1；1, 1；1, 3, 1；1, 7, 6, 1的奇偶），並對4,096個可能的平移逐一比對每格中心顏色，每個seed**恰好一個**平移符合（最大誤差0.0150，來自grain，門檻0.03）。這證明sampler的奇偶表與獨立的遞迴一致；**不**證明該位元運算規則對所有大小的表成立。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0399）。256²與512²取樣的亮處占比與最小色值、AO不同（見下），因為格寬（4與8像素）與取樣點在格內位置不同；測試採用256²的數值。

啟動時（每個sampler）對每格`(n, k)`：`n = k = 0`為奇數；`1 ≤ k ≤ n`時取`z = n − ⌈(k + 1) / 2⌉`、`w = ⌊(k − 1) / 2⌋`，當`z ≥ w`且`(z & w) = w`時為奇數；其餘為偶數；色調為奇數`0.7`、偶數0，存入`Float64Array(4096)`；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），格索引加上由`hash(0, 31, seed ^ 鹽值)`、`hash(1, 31, seed ^ 鹽值)`決定的平移（對64取餘）：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；保留的cache為`Float64Array(4096)` 32,768 B與`Float64Array(128²)` 131,072 B，共163,840 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**。實測（工具實跑）：位元運算與遞迴在4,096格上完全相同；奇數格723個；四個seed（0／1／0xffffffff／7）各有唯一符合的平移(47, 57)、(38, 45)、(41, 30)、(5, 30)，最大擬合誤差0.014994–0.015；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）恆為13.24%、color 0.05901–0.05944至0.85359–0.85480、平均0.22639–0.22647、roughness恆為0.4、AO最低0.7344、height至多0.8472–0.8488 relief；512²取樣（四個seed）亮處恆為12.14%、color 0.02524–0.02532至0.85432–0.85475、平均0.19846–0.19862、AO最低0.6、height至多0.8494–0.8505 relief；seed 0與1相比，格中心顏色相差超過0.05的格子28.3%（512²中color>0.5的取樣19.4%不同）；seed 7的512²maps平均r／g／b約(73.1, 37.8, 25.9)、法線tilt²最大約0.0399、z分量最小253。我實看了預覽（seed 7，2×2個tile）：深褐色底上銅橘色圓點排成傾斜的碎形三角形與一整欄的亮線，大片的暗區是對角線上方。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('stirlingparity', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`partitionmod5`（分割數模5）使目前目錄1052→1053種，含plain的gallery為1054項。64×64圓角方磚表：第`i`列第`j`欄放分割數（partition number）`p(n)`（把`n`寫成正整數之和、不計順序的方法數）在`n = 64i + j`的除以5的餘數——`p(0), p(1), … = 1, 1, 2, 3, 5, 7, 11, 15, 22, 30, 42, 56, …`，除以5的餘數是1, 1, 2, 3, 0, 2, 1, 0, 2, 0, 2, 1, …；餘數0的格子最亮，其餘的格子較暗、餘數越小越暗；由於`64 ≡ 4 (mod 5)`，拉馬努金（Ramanujan）同餘式`p(5k + 4) ≡ 0 (mod 5)`使所有`n ≡ 4 (mod 5)`的格子都亮，在表中排成斜向的條紋；深綠底上祖母綠色的圓點，像人字紋；seed讓整張表在環面上平移。這是示意的圖樣，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；64×64、模數5、餘數0最亮而其餘每階0.1的色調對應、深綠與祖母綠色調（span 0.7、floor 0.14）及0.5 m nominal tile皆作者設定（預覽只看了一版）。sampler以歐拉的五邊形數遞迴式（取模5）建立分割數；測試用**另一個獨立的方式**——逐一加入大小為1、2、3、…的部分、以「換零錢」的遞迴`ways[n] += ways[n − part]`計算——重算整張表，我先用探針確認兩種算法在4,096項上完全相同；測試檢查前12項餘數、餘數0到4的個數1448、648、688、636、676，檢查拉馬努金同餘式在4,096以內的819個`n ≡ 4 (mod 5)`上全部成立（這是定理在這個範圍內的實測，不是證明），並對4,096個可能的平移逐一比對每格中心顏色，每個seed**恰好一個**平移符合（最大誤差0.0150，來自grain，門檻0.03）。這證明sampler的分割數表與獨立的換零錢計算一致；**不**證明同餘式對所有`n`成立。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0399）。256²與512²取樣的亮處占比與最小色值、AO不同（見下），因為格寬（4與8像素）與取樣點在格內位置不同；測試採用256²的數值。

啟動時（每個sampler）以`Uint8Array(4096)`存`p(n) mod 5`：`p(0) = 1`，對`n = 1…4095`做`sum = Σ_{k ≥ 1} (−1)^(k+1)·(p(n − k(3k − 1)/2) + p(n − k(3k + 1)/2))`（下標為負時略過），再取`((sum mod 5) + 5) mod 5`；色調為`0.7`（餘數0）或`0.7·0.1·餘數`（餘數1到4），存入`Float64Array(4096)`；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），格索引加上由`hash(0, 30, seed ^ 鹽值)`、`hash(1, 30, seed ^ 鹽值)`決定的平移（對64取餘）：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；保留的cache為`Uint8Array(4096)` 4,096 B、`Float64Array(4096)` 32,768 B與`Float64Array(128²)` 131,072 B，共167,936 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構（4,095項各最多約80個五邊形數項）與取樣耗時未量測**。實測（工具實跑）：兩種算法在4,096項上完全相同；前12項餘數1, 1, 2, 3, 0, 2, 1, 0, 2, 0, 2, 1；餘數0到4的個數1448／648／688／636／676；819個`n ≡ 4 (mod 5)`全為0；四個seed（0／1／0xffffffff／7）各有唯一符合的平移(23, 48)、(47, 53)、(58, 37)、(36, 25)，最大擬合誤差0.014998–0.014999；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）恆為26.51%、color 0.08268–0.08318至0.85403–0.85437、平均0.42431–0.42438、roughness恆為0.4、AO最低0.7344、height至多0.8479–0.8485 relief；512²取樣（四個seed）亮處恆為24.30%、color 0.02515–0.02533至0.85453–0.85471、平均0.36689–0.36704、AO最低0.6、height至多0.8500–0.8504 relief；seed 0與1相比，格中心顏色相差超過0.05的格子73.7%（512²中color>0.5的取樣28.8%不同）；seed 7的512²maps平均r／g／b約(47.8, 105.0, 83.5)、法線tilt²最大約0.0399、z分量最小253。我實看了預覽（seed 7，2×2個tile）：深綠與祖母綠色的圓點密布，有斜向的條紋，像人字紋。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('partitionmod5', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`nimproduct`（尼姆乘積）使目前目錄1051→1052種，含plain的gallery為1053項。64×64圓角方磚表：第`a`列第`b`欄放尼姆數（nimber）的尼姆乘積`a ⊗ b`（康威的尼姆乘法：`a ⊗ b`是「不屬於所有`(x' ⊗ b) xor (a ⊗ y') xor (x' ⊗ y')`（`x' < a`、`y' < b`）」的最小自然數；`a, b < 64`時乘積在0到255之間）的其中一個二進位位元——位元為1的格子發光；seed從位元2到7中選一個（共6種不同的圖樣），並讓整張表在環面上平移；粉紅色圓點在深紫色底上，自相似的分形織紋。這是示意的圖樣，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；64×64、可選的位元範圍2到7、深紫與粉紅色調（span 0.7、floor 0.14）及0.5 m nominal tile皆作者設定（預覽看了seed 7與seed 0兩個）。sampler以定義（最小未出現自然數規則）逐格建構尼姆乘積表；測試用**完全不同的演算法**——費馬2次冪`F`（2、4、16、256）的遞迴：`a = a1·F + a0`、`b = b1·F + b0`、`F ⊗ F = F xor F/2`，得`a ⊗ b = ((a1b1) xor (a1b0) xor (a0b1))·F xor (a0b0) xor ((a1b1) ⊗ F/2)`——重算整張表，我先用探針確認兩種演算法在4,096格上完全相同；測試檢查幾個常見的小例子（`2 ⊗ 2 = 3`、`2 ⊗ 3 = 1`、`3 ⊗ 3 = 2`、`4 ⊗ 4 = 6`、`8 ⊗ 8 = 13`）、乘積最大255、在抽樣的約286對數上乘積交換且對xor分配（`x ⊗ (y xor 21) = x ⊗ y xor x ⊗ 21`）、位元2到7為1的格子數2016、2016、1920、1920、1920、1920，並對「6個位元×4,096個平移」共24,576種組合逐一比對每格中心顏色，每個seed**恰好一種組合**符合（最大誤差0.0150，來自grain，門檻0.03）。這證明sampler的尼姆乘積表與獨立的費馬遞迴一致；**不**證明尼姆數構成體（field）等一般定理（交換與分配只在抽樣的格子上檢查）。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0378）。256²與512²取樣的亮處占比與最小色值、AO不同（見下），因為格寬（4與8像素）與取樣點在格內位置不同；測試採用256²的數值範圍。

啟動時（每個sampler）以`bit = 2 + floor(hash(2, 29, seed ^ 鹽值)·6)`選位元，以`Uint8Array(4096)`存乘積表，對`a = 1…63`、`b = 1…63`依序（第0列與第0欄為0）：把`x < a`、`y < b`的所有`product(x, b) xor product(a, y) xor product(x, y)`標記在一張256項的表上，取最小未被標記的自然數；色調為`0.7·((乘積 >> bit) & 1)`，存入`Float64Array(4096)`；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），格索引加上由`hash(0, 28, seed ^ 鹽值)`、`hash(1, 28, seed ^ 鹽值)`決定的平移（對64取餘）：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；保留的cache為`Uint8Array(4096)` 4,096 B、`Float64Array(4096)` 32,768 B與`Float64Array(128²)` 131,072 B，共167,936 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構（約400萬次xor與標記）與取樣耗時未量測**。實測（工具實跑）：兩種演算法在4,096格上完全相同；乘積最大255；位元2到7為1的格子數2016／2016／1920／1920／1920／1920；四個seed（0／1／0xffffffff／7）各有唯一符合的（位元, x平移, y平移）(4, 15, 60)、(6, 10, 31)、(3, 1, 29)、(3, 62, 18)，最大擬合誤差0.01499–0.015；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）35.16%、35.16%、36.91%、color 0.05944–0.06022至0.85428–0.85447、平均0.39698–0.41078、roughness恆為0.4、AO最低0.7344、height至多0.8477–0.8490 relief；512²取樣（四個seed）亮處32.23%、32.23%、33.84%、33.84%、color 0.02522–0.02539至0.85453–0.85475、平均0.34365–0.35540、AO最低0.6、height至多0.8499–0.8505 relief；seed 0與1相比，格中心顏色相差超過0.05的格子49.2%；seed 7的512²maps平均r／g／b約(103.5, 65.6, 93.9)、法線tilt²最大約0.0378、z分量最小253。我實看了預覽（seed 7與seed 0）：粉紅色圓點在深紫色底上，seed 7是密集的格狀織紋，seed 0是橫條、直條與棋盤狀區塊交織的自相似圖樣。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('nimproduct', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`wythoffnim`（威佐夫取子遊戲）使目前目錄1050→1051種，含plain的gallery為1052項。64×64圓角方磚表：第`y`列第`x`欄放威佐夫（Wythoff）取子遊戲的Grundy值（nim-value）`G(x, y)`——兩堆分別有`x`與`y`個棋子，一步可從一堆取任意個，或從兩堆各取相同個數，取到最後一個的人贏；一個局面的Grundy值是「一步可到達的各局面的Grundy值都沒有的最小自然數」，`G(0, 0) = 0`；色調為`G`（最多取7）除以7，所以`G = 0`的格子（輪到的人必輸的局面）最暗，數值越大越亮，大多數格子是飽和的亮色，暗色的小值排成兩條向外張開的線與一個小團塊，像一把張開的剪刀；冰藍色到深紫色；seed讓整張表在環面上平移。這是示意的圖樣，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；64×64、色調取`min(G, 7) / 7`、深紫與冰藍色調（span 0.7、floor 0.14）及0.5 m nominal tile皆作者設定（預覽看了兩版：第一版色調取`G`對5的餘數，畫面是看不出結構的雜點，改成取`min(G, 7)`後才看得到兩條線的結構）。sampler與測試都由定義（mex規則）計算Grundy值，但測試是**另一份獨立寫的程式**（用`Set`），並且多做一項**不同建構的交叉檢查**：`G = 0`的49個格子恰好等於`(⌊k·φ⌋, ⌊k·φ²⌋)`與其鏡像（`φ`為黃金比例）落在表內的位置，這是威佐夫定理（Wythoff's theorem）在這張表上的實際驗證（我用探針確認4,096格全部吻合）；另外檢查0到6的值各出現49、51、49、49、49、49、47次、7以上的有3,753格，並對4,096個可能的平移逐一比對每格中心顏色，每個seed**恰好一個**平移符合（最大誤差0.0150，來自grain，門檻0.03）。這證明sampler的Grundy表與獨立計算一致、且`G = 0`的位置符合威佐夫定理；**不**證明威佐夫定理對所有大小的表成立（只驗證這張64×64的表）。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0399）。256²與512²取樣的亮處占比與最小色值、AO不同（見下），因為格寬（4與8像素）與取樣點在格內位置不同；測試採用256²的數值。

啟動時（每個sampler）以`Int32Array(4096)`存Grundy值，對`y = 0…63`、`x = 0…63`依序：收集可到達的局面`G(x − k, y)`（`k = 1…x`）、`G(x, y − k)`（`k = 1…y`）與`G(x − k, y − k)`（`k = 1…min(x, y)`）的值，取最小的沒出現過的自然數；色調為`0.7·min(G, 7) / 7`，存入`Float64Array(4096)`；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），格索引加上由`hash(0, 28, seed ^ 鹽值)`、`hash(1, 28, seed ^ 鹽值)`決定的平移（對64取餘）：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；保留的cache為`Int32Array(4096)` 16,384 B、`Float64Array(4096)` 32,768 B與`Float64Array(128²)` 131,072 B，共180,224 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構（4,096格各最多189個可到達局面）與取樣耗時未量測**。實測（工具實跑）：`G`的最大值95；`G = 0`的格子49個，與`⌊k·φ⌋`公式在4,096格上全部吻合；0到6的值的格子數49／51／49／49／49／49／47、7以上3,753；四個seed（0／1／0xffffffff／7）各有唯一符合的平移(14, 42)、(30, 26)、(29, 14)、(40, 45)，最大擬合誤差0.014990–0.014999；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）恆為71.37%、color 0.06113–0.06133至0.85423–0.85451、平均0.67902–0.67912、roughness恆為0.4、AO最低0.7344、height至多0.8485–0.8496 relief；512²取樣（四個seed）亮處恆為65.05%、color 0.02512–0.02523至0.85459–0.85488、平均0.58354–0.58367、AO最低0.6、height至多0.8501–0.8509 relief；seed 0與1相比，格中心顏色相差超過0.05的格子15.5%（512²中color>0.5的取樣6.6%不同）；seed 7的512²maps平均r／g／b約(97.5, 144.2, 163.8)、法線tilt²最大約0.0399、z分量最小253。我實看了預覽（seed 7，2×2個tile，取`min(G, 7)`的版本）：冰藍色的圓角方磚鋪滿，暗色的小值格子排成兩條向外張開的線與一個小團塊。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('wythoffnim', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`golombruns`（高倫布數列）使目前目錄1049→1050種，含plain的gallery為1051項。64×64圓角方磚表：第`i`列第`j`欄放高倫布（Golomb）數列的第`64i + j + 1`項`a(n)`（`a(1) = 1`、`a(n) = 1 + a(n − a(a(n − 1)))`，這是唯一一個不遞減且每個`n`恰好出現`a(n)`次的數列：1, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 6, …），色調為`a(n)`除以7的餘數（0到6），所以每一段相等的項是同一色調的平台，而且平台越來越長（`a(n)`約為`1.2·n^0.618`）；帶橫紋的粗花呢狀圖樣，深青色到沙金色；seed讓整張表在環面上平移。這是示意的圖樣，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；64×64、對7取餘數的色調對應、深青與沙金色調（span 0.7、floor 0.14）及0.5 m nominal tile皆作者設定（預覽只看了一版）。sampler以遞迴式建立數列；測試用**另一個獨立的方式**——直接用定義「值`k`重複`a(k)`次」從數列自己建構（從1, 2, 2起）——重建整張表，我先用探針確認兩種建構在4,096項上完全相同；測試檢查前15項、4,096項內最大值205、餘數0到6的個數590、595、597、574、577、579、584，並對4,096個可能的平移逐一比對每格中心顏色，每個seed**恰好一個**平移符合（最大誤差0.0150，來自grain，門檻0.03）。這證明sampler的數列表與獨立的建構一致；**不**證明「唯一不遞減且每個`n`出現`a(n)`次」這個定義性質對所有項成立，也不證明`a(n) ≈ 1.2·n^0.618`（這是標準理論，本次未驗證）。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0377）。256²與512²取樣的亮處占比、最小色值與AO不同（見下），因為格寬（4與8像素）與取樣點在格內位置不同；測試採用256²的數值。

啟動時（每個sampler）以`Int32Array(4097)`存`a(1) = 1`與`a(n) = 1 + a(n − a(a(n − 1)))`（`n = 2…4096`），色調為`0.7·(a(n) mod 7) / 6`，存入`Float64Array(4096)`；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），格索引加上由`hash(0, 27, seed ^ 鹽值)`、`hash(1, 27, seed ^ 鹽值)`決定的平移（對64取餘）：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；保留的cache為`Int32Array(4097)` 16,388 B、`Float64Array(4096)` 32,768 B與`Float64Array(128²)` 131,072 B，共180,228 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**。實測（工具實跑）：兩種建構在4,096項上完全相同；最大項205；餘數0到6的個數590／595／597／574／577／579／584；四個seed（0／1／0xffffffff／7）各有唯一符合的平移(24, 38)、(7, 41)、(39, 62)、(50, 30)，最大擬合誤差0.014984–0.014999；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）32.36%–32.43%、color 0.05918–0.06055至0.85413–0.85448、平均0.41360–0.41367、roughness恆為0.4、AO最低0.7344、height至多0.8462–0.8490 relief；512²取樣（四個seed）亮處26.08%–26.13%、color 0.02508–0.02539至0.85437–0.85475、平均0.35778–0.35786、AO最低0.6、height至多0.8495–0.8505 relief；seed 0與1相比，格中心顏色相差超過0.05的格子81.3%（512²中color>0.5的取樣24.6%不同）；seed 7的512²maps平均r／g／b約(91.0, 90.6, 68.1)、法線tilt²最大約0.0377、z分量最小253。我實看了預覽（seed 7，2×2個tile）：深青與沙金色的圓角小方塊排成橫向的條帶，每條是一段同色調的平台，長短不一，像粗花呢。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('golombruns', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`diamondsquare`（鑽石方塊）使目前目錄1048→1049種，含plain的gallery為1050項。64×64頂點環面上以鑽石—方塊（diamond-square）中點位移法產生的電漿（plasma）狀高度場：左上角頂點起始為0，步寬由64、32、…、2逐級減半（共6個層級），每一級先做方塊步（把每個方塊的中心設為四個角的平均）再做鑽石步（把每條邊的中點設為四個鄰點的平均），各加上由hash來的隨機量，範圍是`±0.55^層級`；高度繞環面接合，減去平均值後以`1/2 + 高度 / 2.2`當色調；頂點之間以smoothstep在兩個方向混合四個周圍的高度（所以C1）；琥珀色亮處與深紫色暗處的雲狀圖樣；seed改變所有隨機量。這是示意的圖樣，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；64×64、衰減0.55、色調尺度2.2、琥珀與深紫色調（span 0.7、floor 0.14）、較小的grain（色調0.005、高度0.02，讓讀回高度時的雜訊遠小於最細層級的隨機量）、relief 0.004（比多數新材質的0.0008大，因為起伏平緩、否則法線圖幾乎是平的）及0.5 m nominal tile皆作者設定。預覽與參數看了多次修改（見ACCEPTANCE）：第一版尺度4對比太低；改尺度2.2後，探針顯示隨機的最粗層級會把整張圖的平均高度推高或推低，使seed 1的色調有三分之一的頂點被壓到下限（以釘死的0到1截斷、讀回的高度失真），所以加上「減去平均高度」，修正後四個seed都沒有任何頂點被截斷。測試**只靠讀回取樣結果**，以頂點座標獨立推導鑽石—方塊的結構：從`(x / 64, y / 64)`讀回4,096個頂點的高度（`色調 = (顏色 − floor) / span`，高度 = `(色調 − 1/2)·尺度`，色調須在0.01到0.99之間，沒有被截斷），對除原點外的每個頂點，由座標中最小的末尾零個數得到層級與父點（兩座標都是半步長的奇數倍為方塊步，取四個斜向鄰點；否則為鑽石步，取四個軸向鄰點，繞環面接合），確認各層級的頂點數為3、12、48、192、768、3072（共4,095個），每個頂點與父點平均的差都不超過`0.55^層級`（讀回的grain雜訊另給0.03容許），並且在頂點數192個以上的三個層級上，差與容許量的平均比例在0.45到0.56之間，這與在`±0.55^層級`上平均分布的量一致（平均會是0.5）；另外在3,000個頂點之間的點上，以測試中另寫的smoothstep混合公式從讀回的高度重算色調，與sampler相差在0.02以內（實測最大0.0043–0.0046）。這證明sampler的高度確實依鑽石—方塊的規則（平均加上有界的隨機量）、層級與父點的關係及頂點之間的smoothstep混合建構；**不**證明隨機量真的是均勻分布（只測了平均比例），也不證明這個高度場在頻譜上有`1/f`的「分形」性質，也不證明seed選擇的品質（測試只檢查seed 0與1的頂點色調在50%到70%的頂點上相差超過0.05）。

啟動時（每個sampler）以`Float64Array(4096)`存頂點高度，從`高度(0, 0) = 0`起，對步寬`step = 64, 32, …, 2`（層級`0…5`）：方塊步把`(x + step/2, y + step/2)`設為四個角`(x, y)`、`(x + step, y)`、`(x, y + step)`、`(x + step, y + step)`的平均，鑽石步把`(x + step/2, y)`與`(x, y + step/2)`設為各自四個軸向鄰點（`step/2`遠，座標繞環面）的平均，每個值再加上`(2·hash(x, y, seed ^ (鹽值 + 層級)) − 1)·0.55^層級`；全部算完後減去平均高度；取樣時以`fract(u)·64`、`fract(v)·64`找到四個周圍頂點，以`smooth`（smoothstep）在兩個方向混合，`level = clamp(0.5 + 混合高度 / 2.2)`：color＝`toneFloor + 0.7·level + 0.005·(128²細grain − 0.5)`（`toneFloor` 0.14）、height ＝ `0.8·level + 0.02·grain`、roughness固定0.4、AO隨低處降至`1 − 0.4·(1 − level)`、金屬factor為0；因為在頂點間是smoothstep混合，頂點處斜率為零，所以場為C1；保留的cache為`Float64Array(4096)` 32,768 B與`Float64Array(128²)` 131,072 B，共163,840 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.004 UV-relative relief（非公尺位移）。**建構（4,095個頂點各一次hash）與取樣耗時未量測**。實測（工具實跑，seed 0／1／0xffffffff／7）：各層級頂點數3／12／48／192／768／3072；`|差|／0.55^層級`的最大值在最粗層級0.75–0.90、其餘層級到1.014（層級1、2）、1.044（層級3）、1.100（層級4）、1.224（層級5，容許量只有0.050，grain雜訊佔相當比例），層級3到5的平均比例0.487–0.520；頂點色調的範圍0.1897到0.7709，沒有頂點被截斷；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）37.78%–51.50%、color 0.2088–0.3088至0.6999–0.7702、平均0.48998–0.49001、roughness恆為0.4、AO最低0.6387–0.6973、height至多0.6513–0.7338 relief；512²取樣（四個seed）亮處37.74%–51.46%、color 0.1903–0.3063至0.6763–0.7709、平均0.48998–0.49001、AO最低0.6289–0.6962、height至多0.6244–0.7352 relief；seed 0與1相比，頂點色調相差超過0.05的頂點60.2%（512²中color>0.5的取樣42.0%不同）；seed 7的512²maps平均r／g／b約(131.1, 104.5, 83.3)、法線tilt²最大約0.00126、z分量最小255。我實看了預覽（seed 7，2×2個tile，最後的版本）：琥珀色的雲狀亮區夾著深紫色暗斑，沒有明顯的格線。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('diamondsquare', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`moirefringes`（莫列條紋）使目前目錄1047→1048種，含plain的gallery為1049項。兩組柔邊線條光柵相乘的莫列（moiré）條紋：第一組是整個tile橫跨`base`個週期、線條沿`u`方向的橫紋，第二組的波向量是整數向量`(beatU, base + beatV)`，光只在兩組都開的地方通過（兩個光柵值的乘積）；兩組線條對齊處出現亮條紋、交錯處是暗條紋，條紋以兩個波向量的差`(beatU, beatV)`每個tile重複（所有波向量都是整數，所以tile可無縫重複）；淡藍色在深藍黑色底上；seed從`base`（16／20／24／28）、8種差向量（`(1,0)`、`(2,0)`、`(3,0)`、`(0,1)`、`(0,2)`、`(1,1)`、`(2,1)`、`(1,2)`）與兩個相位中選。這是示意的圖樣，不模擬任何實物光柵。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；基本頻率清單、差向量清單、柔邊寬度0.6、色調（span 0.7、floor 0.14）、淡藍與深藍黑色調及0.5 m nominal tile皆作者設定（預覽看了兩個seed）。測試**只靠讀回取樣結果**檢查頻率成分：把128×128格中心的顏色以測試中另寫的離散傅立葉轉換分析（`m`在−8到8、`n`在0到40，只取半平面），確認最強的兩個高頻峰（`n ≥ 10`、`|m| ≤ 4`）振幅都在0.115到0.125之間，這兩個峰就是兩組光柵的波向量，其中一個是`(0, base)`且`base`在清單內；最強的低頻峰（`n ≤ 8`，振幅0.075到0.085）剛好等於兩個波向量的差（換到半平面）、是清單中的差向量之一，而次強的低頻峰低於0.02；四個seed的光柵組合各不相同，同一seed重複讀取完全相同。這證明sampler畫出的條紋頻率確實等於兩個光柵波向量之差；**不**證明條紋的形狀與柔邊的形狀，也不證明seed選擇的品質（測試只檢查四個seed的光柵組合各不相同）。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0286）。256²與512²取樣的亮處占比略有不同，測試採用256²（seed 0／1／0xffffffff）的數值。

取樣時`base = frequencies[floor(hash(0, 25, seed ^ 鹽值)·4)]`、`(beatU, beatV) = beats[floor(hash(1, 25, seed ^ 鹽值)·8)]`、相位`hash(2, 25, …)`與`hash(3, 25, …)`；`one = cos(2π(base·fract(v) + 相位1))`、`two = cos(2π(beatU·fract(u) + (base + beatV)·fract(v) + 相位2))`，`open = smooth(clamp(one / 0.6 + 0.5))·smooth(clamp(two / 0.6 + 0.5))`：color＝`gapTone + (toneFloor + 0.7·open − gapTone)·open + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·open·(0.45 + 0.55·open) + 0.08·grain`、roughness固定0.4、AO暗處降至0.6、金屬factor為0；全都是光滑函數（平滑階梯與cos的合成），所以場為C1；保留的cache只有`Float64Array(128²)` 131,072 B（沒有表），為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**（沒有建構表，取樣含兩次`cos`）。實測（工具實跑，seed 0／1／0xffffffff／7）：兩個光柵的波向量為(0, 28)與(2, 28)、(0, 20)與(1, 20)、(0, 28)與(3, 28)、(0, 20)與(1, 21)，即base 28／20／28／20、差向量(2, 0)／(1, 0)／(3, 0)／(1, 1)；光柵峰振幅0.1206–0.1207、低頻的差向量峰0.0795–0.0796、次強低頻峰0.0057–0.0127；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）21.81%–21.88%、color 0.02559–0.02581至0.85430–0.85456、平均0.22320–0.22321、roughness恆為0.4、AO最低0.6、height至多0.8781–0.8788 relief；512²取樣（四個seed）亮處21.72%–21.86%、color 0.02512–0.02528至0.85446–0.85481、平均0.22315–0.22321、AO最低0.6、height至多0.8786–0.8795 relief；seed 0與1相比，512²中color>0.5的取樣34.5%不同；seed 7的512²maps平均r／g／b約(52.0, 59.5, 74.0)、法線tilt²最大約0.0286、z分量最小253。我實看了預覽（seed 7與seed 0）：深藍黑底上淡藍色的橫向細長線條，線條呈尖銳的透鏡形，間隔排成緩緩傾斜（seed 7）或垂直方向（seed 0）的條紋。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('moirefringes', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`stringart`（弦線藝術）使目前目錄1046→1047種，含plain的gallery為1048項。乘法表圓（times-table circle）的弦線圖：圓周上平均分布96個點，編號0到95，每個點`i`用一條直線連到點`(m·i + c) mod 96`，這些線包絡出一條曲線（乘數`m = 2`是心臟線、3是腎臟線、4是三個尖點、5是四個尖點，這些名稱是常見的叫法，本次未驗證）；seed選出乘數`m`（2到5）與偏移`c`（0到95）；粉紅色細線在深紫黑色底上，每個0.5 m tile一個圓盤。這是示意的圖樣，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；96個點、半徑0.47、線半徑0.003與邊緣柔化0.002、乘數與偏移的範圍、色調（span 0.7、floor 0.14）、粉紅與深紫黑色調及0.5 m nominal tile皆作者設定（預覽看了三版：第一版沒有偏移`c`，我發現seed 0與seed 1選到同一個乘數，畫面幾乎一模一樣（兩者遮罩差只有0.07%），所以加上偏移`c`，再看一次預覽）。測試**只靠讀回取樣結果**檢查：對乘數2到5、偏移0到95的每一組，先檢查96條線的中點在sampler中是否都是亮的，再對通過的候選以測試中另寫的「點到線段距離」比對3000個點（距離線0.001以內該是亮、0.0045以外該是暗），取不一致最少者為讀出的參數，並要求不一致為0、清楚的點超過2,000個，而次佳的候選有超過100個不一致——**這最後一項是修正後才加的**：我發現只檢查中點時，會有只差一小個轉角的假候選也通過（seed 0有兩個、0xffffffff有三個、1有兩個候選全亮），所以必須用逐點比對才能唯一決定參數。這證明sampler畫出的線確實是乘數與偏移所指的那組弦，且參數被唯一決定；**不**證明這些線的包絡真的是心臟線、腎臟線等曲線，也不證明seed選擇的品質（測試只檢查四個seed的（乘數, 偏移）彼此不同、乘數出現3種）。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0543，比多數材質大，因為線很細）。256²取樣與512²取樣的亮處占比略有不同（線細），測試採用256²（seed 0／1／0xffffffff）的數值範圍。

啟動時（每個sampler）以`multiplier = 2 + floor(hash(0, 24, seed ^ 鹽值)·4)`與`offset = floor(hash(1, 24, seed ^ 鹽值)·96)`決定參數，96個點為`0.5 + 0.47·(cos, sin)(2π·i / 96)`，對每個`i`得`j = (multiplier·i + offset) mod 96`（`j = i`時略過），記下線段`(點i, 點j)`；取樣時只有離tile中心不超過`半徑 + 線半徑`的點才計算，對每條線段求點到線段距離，線為`smooth(clamp((0.003 − 距離) / 0.002))`，合成為`1 − Π(1 − 線)`（光滑；距離小於0.001為平台，所以場為C1）：color＝`gapTone + (toneFloor + 0.7·mask − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·mask·(0.45 + 0.55·mask) + 0.08·grain`、roughness固定0.4、AO線外降至0.6、金屬factor為0；保留的cache為`Float64Array(128²)` 131,072 B加最多96條線段（各4個數字）的小陣列（未計入），為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**（每次取樣在盤面內對最多96條線段算距離）。實測（工具實跑，seed 0／1／0xffffffff／7）：讀出的（乘數, 偏移）為(4, 61)、(4, 65)、(5, 26)、(3, 63)；每個seed中線的中點全亮的候選有2／2／3／1個，其中正確者與獨立距離的不一致為0（清楚的點約2,206–2,281個），其餘候選不一致378–406個（seed 7只有一個候選）；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）16.55%–16.83%、color 0.02521–0.02569至0.85370–0.85426、平均0.17865–0.18097、roughness恆為0.4、AO最低0.6、height至多0.8765–0.8781 relief；512²取樣（四個seed）亮處16.33%–16.85%、color 0.02509–0.02523至0.85449–0.85479、平均0.17684–0.18109、AO最低0.6、height至多0.8786–0.8794 relief；seed 0與1相比，512²中color>0.5的取樣21.9%不同；seed 7的512²maps平均r／g／b約(53.3, 31.3, 49.6)、法線tilt²最大約0.0543、z分量最小251。我實看了預覽：深紫黑底上粉紅色細線圍成的圓盤，線的包絡在圓內形成尖點（乘數4時可見三個、乘數3時可見兩個），圓周邊緣有密集的線端；加上偏移後我重看了seed 7（乘數3）的預覽，尖點的位置不再左右對稱。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('stringart', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`happynumbers`（快樂數）使目前目錄1045→1046種，含plain的gallery為1047項。64×64圓角方磚表，第`i`列第`j`欄放數字`n = 64i + j + 1`（1到4096）；把一個數反覆換成它各位數字的平方和，若最後到1，這個數就是快樂數（happy number），否則會掉進4, 16, 37, 58, 89, 145, 42, 20, 4的循環；不快樂的數是暗的，快樂數發光，所需替換次數越少越亮（數字1不需要替換，最亮）；4,096個數中有614個快樂數；深綠底上萊姆綠的星點；seed讓整張表在環面上平移。這是示意的圖樣，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；64×64、快樂數的色調對應（次數0到6，色調`0.7·(0.35 + 0.65·(1 − 次數 / 6))`）、深綠與萊姆綠色調（span 0.7、floor 0.14）及0.5 m nominal tile皆作者設定（預覽看了兩版：第一版因為我在產生程式中沒有替換調色盤，仍是前一個材質的暗褐與橘色，我看圖才發現，改成深綠與萊姆綠；表的內容不變）。sampler以「到1或4就停止」判斷快樂與否；測試用**另一個獨立的方式**——以十進位字串取各位數字，並用集合偵測數字是否重複（不依賴「循環一定經過4」這個事實）——重新計算整張表，檢查4,096個數中有614個快樂數，替換次數0到6次的個數分別為1、3、42、157、150、173、88，並對4,096個可能的平移逐一比對每格中心顏色，每個seed**恰好一個**平移符合（最大誤差0.0150，來自grain，門檻0.03）。這證明sampler的快樂數表與獨立計算一致（含「所有不快樂的數在4096以內都掉進含4的循環」這一事實在這個範圍內成立，因為兩種判斷在4,096個數上一致）；**不**證明這個事實的一般性定理。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0377）。256²與512²取樣的亮處占比不同（見下），因為格寬（4與8像素）與取樣點在格內位置不同，測試採用256²的數值。

啟動時（每個sampler）對每個數`n = 1…4096`做`while (n ≠ 1 且 n ≠ 4) { n = 各位數字平方和; 次數++ }`，若結束時`n = 1`則色調為`0.7·(0.35 + 0.65·(1 − 次數 / 6))`，否則為0，存入`Float64Array(4096)`；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），格索引加上由`hash(0, 23, seed ^ 鹽值)`、`hash(1, 23, seed ^ 鹽值)`決定的平移（對64取餘）：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；保留的cache為`Float64Array(4096)` 32,768 B與`Float64Array(128²)` 131,072 B，共163,840 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**。實測（工具實跑，seed 0／1／0xffffffff／7）：快樂數614個，替換次數0到6次的個數1／3／42／157／150／173／88；四個seed各有唯一符合的平移(23, 39)、(48, 6)、(45, 31)、(0, 21)，最大擬合誤差0.014984–0.014999；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）恆為6.46%、color 0.05919–0.05949至0.84451–0.84637、平均0.17149–0.17164、roughness恆為0.4、AO最低0.7344、height至多0.8280–0.8348 relief；512²取樣（四個seed）亮處恆為4.86%、color 0.02518–0.02539至0.84269–0.84878、平均0.15184–0.15199、AO最低0.6、height至多0.8326–0.8400 relief；seed 0與1相比，格中心顏色相差超過0.05的格子26.3%（512²中color>0.5的取樣8.6%不同）；seed 7的512²maps平均r／g／b約(34.3, 55.7, 33.1)、法線tilt²最大約0.0377、z分量最小253。我實看了預覽（seed 7，深綠與萊姆綠版本）：深綠底上散布的萊姆綠亮點，亮度不一，像星空。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('happynumbers', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`euclidsteps`（輾轉相除步數）使目前目錄1044→1045種，含plain的gallery為1046項。64×64圓角方磚表：第`i`列第`j`欄的方磚是數對`(i + 1, j + 1)`做歐幾里得輾轉相除法`(a, b) → (b, a mod b)`直到餘數為0所需的除法步數，色調隨步數增加（步數1為最暗、最長的9步最亮）；`b`整除`a`的數對只要1步（最暗），所以最暗的是`b = 1`的整欄與`b`整除`a`的線，最長的是接近黃金比例的數對；由此出現從原點放射狀的有理數扇形暗線；暗紫到金色的色調；seed讓整張表在環面上平移。這是示意的圖樣，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；64×64、以最長步數正規化的色調、暗紫與金色色調（span 0.7、floor 0.14）及0.5 m nominal tile皆作者設定（預覽看了兩版：第一版用暗褐到橘色，對比低、顏色偏髒，改成暗紫到金色，表的內容不變）。sampler以迴圈計算步數；測試用**另一個獨立的方式**——遞迴`steps(a, b) = b = 0 ? 0 : 1 + steps(b, a mod b)`——重新計算整張表，檢查最長為9步，1到9步的格子數分別為280、671、1006、1005、699、327、94、13、1，並對4,096個可能的平移逐一比對每格中心顏色，每個seed**恰好一個**平移符合（最大誤差0.0150，來自grain，門檻0.03）。這證明sampler的步數表與獨立的遞迴計算一致；**不**證明輾轉相除法在數論上的定理（這些只是實測的次數）。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0377）。256²與512²取樣的亮處占比、最高色值與AO不同（見下），因為格寬（4與8像素）與取樣點在格內位置不同，而且只有一格是最亮的9步，取樣到的最高色值隨取樣格網而不同；測試採用256²的數值。

啟動時（每個sampler）對每格`(row, col)`從`(a, b) = (row + 1, col + 1)`起做`while (b ≠ 0) { (a, b) = (b, a mod b); 步數++ }`，把步數存進`Int32Array(4096)`，並記下最長步數`longest`（9），色調為`0.7·(步數 − 1) / (longest − 1)`，存入`Float64Array(4096)`；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），格索引加上由`hash(0, 22, seed ^ 鹽值)`、`hash(1, 22, seed ^ 鹽值)`決定的平移（對64取餘）：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；保留的cache為`Int32Array(4096)` 16,384 B、`Float64Array(4096)` 32,768 B與`Float64Array(128²)` 131,072 B，共180,224 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**（建構為4096對各最多9步的迴圈）。實測（工具實跑）：1到9步的格子數280／671／1006／1005／699／327／94／13／1；四個seed（0／1／0xffffffff／7）各有唯一符合的平移(38, 62)、(47, 26)、(35, 15)、(43, 31)，最大擬合誤差0.014989–0.014999；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）8.52%–8.62%、color 0.06021–0.06042至0.84833–0.85052、平均0.31565–0.31568、roughness恆為0.4、AO最低0.7344、height至多0.8270–0.8390 relief；512²取樣（四個seed）亮處6.41%–6.47%、color 0.02517–0.02538至0.84374–0.85155、平均0.27447–0.27450、AO最低0.6、height至多0.8331–0.8420 relief；seed 0與1相比，格中心顏色相差超過0.05的格子82.1%（512²中color>0.5的取樣11.9%不同）；seed 7的512²maps平均r／g／b約(80.2, 63.1, 61.8)、法線tilt²最大約0.0377、z分量最小253。我實看了預覽（seed 7，最後的暗紫到金色版本）：暗紫與金色的圓角小方塊，有一整欄與一整列較暗的條帶，並有從原點放射出的暗色扇形線。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('euclidsteps', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`phasevortices`（相位渦旋）使目前目錄1043→1044種，含plain的gallery為1045項。複數場`F = cos(2π(2x + a)) + i·cos(2π(2y + b))`的相位圖：`F`在兩個餘弦同時為零的地方消失，每個tile上有4×4＝16個孤立的零點（渦旋，彼此相距1/4），相位繞每個渦旋轉一圈；顏色畫出相位的線——`cos(6·相位)`高於門檻處是亮的——所以每個渦旋周圍恰好交會6條亮色輻條，相鄰渦旋的輻條連成透鏡形；高度另外加上`|F|`等值的同心環；淡紫色在深紫黑色底上；seed決定平移`(a, b)`也就是整個渦旋格點的位置。這是示意的圖樣，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；每軸2個週期、6條輻條、渦旋核心大小0.05、門檻0.35、4個高度環、色調（span 0.7、floor 0.14）、淡紫與深紫黑色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。測試**只靠讀回取樣結果**檢查渦旋的拓撲性質：沿半徑0.02的圓（96個取樣點）繞一圈數顏色穿過中點的次數（等於亮弧數的兩倍）；在一格1/4×1/4的範圍內以0.005為步長掃描，圓繞一圈穿過12次（6條輻條）的點包圍著一個渦旋，這些點形成一小塊（實測37–39個掃描點），其圓周平均（週期1/4，所以在格邊緣的渦旋不會被切成兩半）就是渦旋位置對1/4取餘數；再確認16個格點位置的圓都恰好穿過12次，而16個渦旋之間正中間（兩個方向各偏1/8）的圓都穿過0次，也就是沒有繞數。這證明sampler畫出的渦旋確實是16個、每個恰好6條輻條，而且是從顏色讀出來的拓撲性質；**不**證明相位轉動的方向（順時針或逆時針，亮暗線看不出來）、也**不**證明高度環的形狀，也不證明seed選擇的品質（測試只檢查四個seed的渦旋格點位置彼此不同）。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0090）。256²與512²取樣的亮處占比略有不同，測試採用256²（seed 0／1／0xffffffff）的數值。

取樣時`real = cos(2π(2·fract(u) + a))`、`imaginary = cos(2π(2·fract(v) + b))`，`a = hash(0, 21, seed ^ 鹽值)`、`b = hash(1, 21, seed ^ 鹽值)`；`magnitude = hypot(real, imaginary)`，相位單位向量`(real, imaginary) / magnitude`以反覆相乘取6次方的實部`powerX = cos(6·相位)`；`fade = smooth(clamp(magnitude / 0.05))`（渦旋核心內輻條淡出，使場在渦旋處光滑），`spoke = smooth(clamp((fade·powerX − 0.35) / 0.3))`，`ring = 0.5 + 0.5·cos(2π·4·magnitude)`：color＝`gapTone + (toneFloor + 0.7·spoke − gapTone)·spoke + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·(0.45 + 0.55·(0.6·spoke + 0.4·ring)) + 0.08·grain`、roughness固定0.4、AO輻條外降至0.6、金屬factor為0；保留的cache只有`Float64Array(128²)` 131,072 B（沒有表），為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**（沒有建構表；取樣含兩次`cos`、一次`hypot`與6次複數乘法）。實測（工具實跑，seed 0／1／0xffffffff／7）：圍繞渦旋的圓穿過12次的掃描點為39／37／39／39個，渦旋位置對1/4取餘數為(0.0489, 0.1670)、(0.1113, 0.1263)、(0.1783, 0.0075)、(0.2261, 0.0380)；16個渦旋位置的圓都恰好穿過12次（各seed 16／16），16個渦旋之間正中間的圓都穿過0次（各seed 16／16）；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）27.96%–28.45%、color 0.02537–0.02567至0.85410–0.85439、平均0.26940–0.27032、roughness恆為0.4、AO最低0.6、height至多0.8749–0.8772 relief；512²取樣（四個seed）亮處28.08%–28.17%、color 0.02511–0.02520至0.85459–0.85484、平均0.26949–0.26977、AO最低0.6、height至多0.8782–0.8789 relief；seed 0與1相比，512²中color>0.5的取樣46.8%不同；seed 7的512²maps平均r／g／b約(62.7, 53.2, 90.7)、法線tilt²最大約0.0090、z分量最小254。我實看了預覽（seed 7，2×2個tile，8×8個渦旋）：深紫黑底上淡紫色的輻條在格點交會成星形，相鄰渦旋之間的輻條圍出透鏡形。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('phasevortices', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`recamanarcs`（雷卡曼弧線）使目前目錄1042→1043種，含plain的gallery為1044項。雷卡曼（Recamán）數列的弧線圖：`a(0) = 0`，`a(n)`為`a(n − 1) − n`（若為正且沒有出現過）否則`a(n − 1) + n`；取前60步（序列開頭是0, 1, 3, 6, 2, 7, 13, 20, 12, 21, …，共61個位置、57個不同的值，最大114），每一步畫成數線上從`a(n − 1)`到`a(n)`的半圓（直徑`n`），奇數步畫在數線一側、偶數步畫在另一側，所以相鄰的大半圓連成近乎圓形的巢狀弧圈；每個tile有上下兩條帶（第二條的兩側對調），青綠色細線在深青黑色底上；seed讓整幅圖左右平移最多5.5個單位（tile寬128單位）並可能對調兩側。這是示意的圖樣，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；60步、128單位的寬度、左右邊距7、線半徑0.3與邊緣柔化0.2、色調（span 0.7、floor 0.14）、青綠與深青黑色調及0.5 m nominal tile皆作者設定（預覽看了兩版：第一版線半徑0.9，相鄰大半圓的半徑只差1，疊成很厚的圓環看不出線條，改成0.3）。sampler以`Set`記錄已出現的數字；測試用**另一份獨立寫的雷卡曼數列**（同樣用集合，但寫在測試中）重建61個位置，再只靠讀回取樣結果檢查：以數線（第一條帶的中線）為基準，在0.02的步長上找出所有「61個位置都亮、263個距離任何位置至少0.6的空隙都暗」的平移，保留下來的平移連成一段（10到25步，實測17步，約0.32單位寬），以這段的中點當平移，再確認60個半圓的頂點在其中一側全部亮（另一側最多只有幾個，實測4個，只是巧合）、平移落在允許的範圍內，並以測試中另寫的多邊形（每半圓240段）到弧線的距離，檢查4000個點中距弧線0.1以內的都亮、0.4以外的都暗（約3,260個點這樣明確，實測不一致0個）。這證明sampler畫出的半圓確實對應雷卡曼數列、奇偶步在相反兩側；**不**證明邊緣柔化區（距離0.1到0.4）的形狀，也不證明seed選擇的品質（測試只檢查四個seed的平移各不相同且兩種側邊對調都出現）。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0543，比多數材質大，因為線很細）。256²取樣因為線細而取樣不足，亮處占比與512²不同（見下），測試採用256²（seed 0／1／0xffffffff）的數值範圍。

啟動時（每個sampler）以`Set`算出前60步的位置，並依`hash(0, 20, seed ^ 鹽值)`得到平移（±5.5單位）、`hash(1, 20, seed ^ 鹽值) < 0.5`得到兩側是否對調；每個半圓記錄圓心（`(a(n−1) + a(n)) / 2 + 7 + 平移`）、半徑（`n / 2`）與所在側。取樣時把`(u, v)`換成單位（`x = fract(u)·128`、`y = fract(v)·128`），依`y`屬於上半或下半選擇帶（帶中線在`y = 32`與`96`，第二條帶的側邊對調），`dy`為離帶中線的偏移；對每個半圓（橫向距離超過`半徑 + 0.3`者略過）：若點在半圓所在側則距離為`|hypot(橫距, dy) − 半徑|`，否則為到直徑兩端點的距離；每個半圓是`smooth(clamp((0.3 − 距離) / 0.2))`的線，線的合成為`1 − Π(1 − 線)`（光滑，且線在距離小於0.1時為平台，所以場為C1）：color＝`gapTone + (toneFloor + 0.7·mask − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·mask·(0.45 + 0.55·mask) + 0.08·grain`、roughness固定0.4、AO線外降至0.6、金屬factor為0；保留的cache為`Float64Array(128²)` 131,072 B加61個位置與60個半圓的小陣列（未計入），為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構（60步）與取樣耗時未量測**（每次取樣最多對60個半圓算距離，橫向超出者略過）。實測（工具實跑，seed 0／1／0xffffffff／7）：保留的平移連續17步（各seed），平移的中點為2.44／3.64／11.14／7.88；60個頂點在一側全亮、另一側分別為4／4／4／4個（seed 0與7的亮側為一側、seed 1與0xffffffff為另一側）；4000個點中約3,260個點足夠明確（亮約275–308、暗約2,977–2,983），與獨立多邊形距離不一致0個；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）10.58%–11.04%、color 0.02520–0.02568至0.85385–0.85434、平均0.13175–0.13343、roughness恆為0.4、AO最低0.6、height至多0.8769–0.8782 relief；512²取樣（四個seed）亮處11.31%–11.38%、color 0.02508–0.02528至0.85435–0.85480、平均0.13574–0.13656、AO最低0.6、height至多0.8783–0.8795 relief；seed 0與1相比，512²中color>0.5的取樣13.5%不同；seed 7的512²maps平均r／g／b約(24.2, 50.9, 55.1)、法線tilt²最大約0.0543、z分量最小251。我實看了預覽（seed 7，2×2個tile，最後的細線版本）：深青黑底上青綠色細線，大半圓連成近乎圓形、巢狀的弧圈，左端有幾個小圈，每個tile上下各一條。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('recamanarcs', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`kaleidoscope`（萬花筒）使目前目錄1041→1042種，含plain的gallery為1043項。萬花筒／曼陀羅圖樣：把平滑的value noise場，對tile中心的8重二面體群（dihedral group，每45°的旋轉各有與沒有鏡像，共16個元素）取平均，所以整個圖樣恰好有8重旋轉對稱加鏡射對稱，而且鏡線上沒有折痕；再取平均值的等高帶（13個帶）當作圖樣，銅橘色圓盤在深紫色底上，中心是細密的同心環，往外是一圈圈的對稱花紋；每個0.5 m tile一個圓盤；seed決定noise場，也就決定整個花紋。這是示意的圖樣，不模擬任何實物萬花筒。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；8重對稱、10×10的noise格、13個帶、銳利度0.7、半徑0.47、色調（span 0.7、floor 0.14）、銅橘與深紫色調及0.5 m nominal tile皆作者設定（預覽看了三版：帶數7時整個圓盤幾乎一整片亮色，帶數18時中心的細環太密、有混疊風險，最後採13）。這個材質的測試是**幾何性質檢查**，不依賴sampler的任何公式：在半徑0.44以內取3000個點（黃金比例序列），比較每個點與它在群作用下的像的顏色——旋轉45°、對水平軸的鏡像、對45°/2＝22.5°線的鏡像——顏色差都在grain（兩處加起來至多0.03，且不對稱）以內（實測最大0.0289）；而旋轉22.5°或72°（不屬於這16個元素）時，平均顏色差都在0.1以上（實測0.18–0.30）。這證明sampler的輸出確實有這個群的對稱，而且不是更高的對稱；**不**證明這是「正確的」萬花筒，也不證明noise場本身的品質，更不證明seed選擇的品質（測試只檢查seed 0與1在超過15%的點上顏色相差超過0.2、同一seed重複取樣完全相同）。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0163）。256²與512²取樣的亮處占比略有不同，測試採用256²（seed 0／1／0xffffffff）的數值範圍（各seed的亮處占比差異大：28.8%–35.4%）。

取樣時以`dx = fract(u) − 0.5`、`dy = fract(v) − 0.5`為離tile中心的位移；對`k = 0…7`把`(dx, dy)`旋轉`k·45°`得`(rx, ry)`，並分別取noise場在`(0.5 + rx, 0.5 + ry)`與`(0.5 + rx, 0.5 − ry)`（鏡像）的值，共16個值取平均`average`；`wave = cos(2π·13·average)`，`value = smooth(clamp(wave / 0.7 / 2 + 0.5))`，盤面遮罩`mask = smooth(clamp((0.47 − r) / 0.01))`：color＝`gapTone + (toneFloor + 0.7·value − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·mask·(0.45 + 0.55·value) + 0.08·grain`、roughness固定0.4、AO圓盤外降至0.6、金屬factor為0；因為是對群取平均而不是折疊到基本區域，鏡線上沒有折痕，場為C1；圓盤在tile內（半徑0.47，旋轉保持半徑），所以所有旋轉後的點都在tile內。保留的cache為`Float64Array(128²)` 131,072 B加10×10的noise場100個double 800 B，共131,872 B，為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**（每次取樣有16次noise查找與8次旋轉）。實測（工具實跑，seed 0／1／0xffffffff／7）：對旋轉45°的最大顏色差0.02688／0.02813／0.02687／0.02804，對水平軸鏡像0.02792／0.02768／0.02887／0.02797，對22.5°線鏡像0.02686／0.02819／0.02698／0.02758；旋轉22.5°的平均顏色差0.2263／0.2973／0.2826／0.1775，旋轉72°為0.2484／0.2694／0.2904／0.1923；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）28.77%–35.37%、color 0.02572–0.02605至0.85398–0.85416、平均0.31689–0.35844、roughness恆為0.4、AO最低0.6、height至多0.8773–0.8778 relief；512²取樣（四個seed）亮處28.97%–44.78%、color 0.02517–0.02536至0.85468–0.85475、平均0.31714–0.41332、AO最低0.6、height至多0.8790–0.8793 relief；seed 0與1相比，512²中color>0.5的取樣31.1%不同；seed 7的512²maps平均r／g／b約(120.6, 77.3, 75.4)、法線tilt²最大約0.0163、z分量最小254。我實看了預覽（seed 7，2×2個tile，最後採用13帶的版本）：深紫底上四個銅橘色圓盤，中心是細密的同心環，往外是一圈暗色環與一圈圈對稱的花瓣狀暗斑。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('kaleidoscope', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`zoneplate`（菲涅耳波帶片）使目前目錄1040→1041種，含plain的gallery為1042項。菲涅耳波帶片（Fresnel zone plate）：以圓心為中心的明暗同心環，第`n`個明暗交界在半徑`0.47·√((n + ½) / 14)`處，所以環越往外越窄（14個環帶、半徑0.47），明暗之間以平滑階梯過渡；淺黃綠色的環在深藍黑色底上，每個0.5 m tile一個圓盤；seed讓圓心在tile中央附近移動最多0.03，並可能把明暗對調。這是示意的圖樣，不模擬任何實物波帶片。（不同於既有`fresnel`的等距鋸齒環菲涅耳透鏡。）

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；14個環帶、半徑0.47、移動量0.03、過渡寬度、色調（span 0.7、floor 0.14）、淺黃綠與深藍黑色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。測試**只靠讀回取樣結果**檢查：以256²取樣格中亮的像素（color>0.5）的平均位置作為圓心（圓環對圓心對稱，所以平均位置就是圓心），再從圓心往8個方向每0.0005前進，找出顏色穿過色調範圍中點的半徑（線性內插），確認每個方向的前13次明暗交界都在`半徑·√((n + ½) / 環帶數)`的0.002以內——這個`√`公式只出現在測試中；每個方向的交界數為14加上外圍邊緣（當最外圈環帶是亮的時候，這恰好發生在中心環帶也是亮的時候，因為環帶數是偶數）；圓心離tile中央不超過0.03；四個seed的圓心互不相同，且明暗對調與否兩種情形都有出現。這證明的是sampler畫出的環帶半徑符合波帶片的√n律；**不**證明交界處平滑階梯的形狀，也不證明seed選擇的品質。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0225）。256²與512²取樣的亮處占比略有不同（seed 7的明暗對調使亮處占比也不同），測試採用256²（seed 0／1／0xffffffff）的數值。

取樣時以`fract(u)`、`fract(v)`減去圓心得到`dx`、`dy`，圓心為`0.5 + (hash(0／1, 19, seed ^ 鹽值) − 0.5)·2·0.03`，明暗對調為`hash(2, 19, seed ^ 鹽值) < 0.5`；波為`wave = 0.5 + 0.5·cos(π·14·(dx² + dy²) / 0.47²)`，亮度`lit = smooth(clamp((wave − 0.5) / 0.3 + 0.5))`（對調時`1 − lit`），盤面遮罩`mask = smooth(clamp((0.47 − r) / 0.01))`：color＝`gapTone + (toneFloor + 0.7·value − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·mask·(0.45 + 0.55·value) + 0.08·grain`、roughness固定0.4、AO圓盤外降至0.6、金屬factor為0；所有函數都是`r²`的平滑函數（光滑階梯與cos的合成），所以場為C1；保留的cache只有`Float64Array(128²)` 131,072 B（沒有表），為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**（沒有建構表，取樣含一次`cos`與一次`sqrt`）。實測（工具實跑，seed 0／1／0xffffffff／7）：以亮像素平均位置估計的圓心依序為(0.5216, 0.4885)、(0.4858, 0.4706)、(0.5263, 0.4879)、(0.4844, 0.5264)；前13次交界與`√`公式的最大誤差0.00063／0.00064／0.00019／0.00020（探針的射線步長0.00047）；每個方向的交界數在seed 0／1／0xffffffff（中心環帶為亮）為15、在seed 7（中心環帶為暗，即對調）為14；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）32.89%–32.99%、color 0.02542–0.02567至0.85387–0.85419、平均0.34066–0.34070、roughness恆為0.4、AO最低0.6、height至多0.8770–0.8778 relief；512²取樣（四個seed）亮處32.91%–32.93%（seed 0／1／0xffffffff）與34.55%（seed 7）、color 0.02515–0.02525至0.85456–0.85478、平均0.34066–0.35077、AO最低0.6、height至多0.8788–0.8794 relief；seed 0與1相比，512²中color>0.5的取樣35.3%不同；seed 7的512²maps平均r／g／b約(84.6, 90.7, 83.1)、法線tilt²最大約0.0225、z分量最小254。我實看了預覽（seed 7，2×2個tile）：深藍黑底上四個淺黃綠色的同心環圓盤，中心是暗色圓、環越往外越窄越密，邊緣有細亮環。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('zoneplate', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`graycode`（格雷碼）使目前目錄1039→1040種，含plain的gallery為1041項。旋轉編碼器（rotary encoder）圓盤：圓周分成128個扇區，7圈同心環，扇區`n`在各環上依序放數字`n`的反射二進位格雷碼（Gray code，`n xor (n >> 1)`）的各位元——最內圈是最高位元，最外圈是最低位元——位元1是亮的銀白色弧、位元0是暗色弧，所以相鄰扇區（包含最後一個與第一個）剛好只有一圈不同；環與環之間有深色細溝，每個0.5 m tile一個圓盤，圓盤外是深藍黑色底；seed讓圓盤轉過整數個扇區。這是示意的圖樣，不模擬任何實物編碼器。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；128個扇區、7圈、內外半徑0.10與0.46、環溝寬、色調（span 0.7、floor 0.14）、銀白與深藍黑色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。sampler以`n xor (n >> 1)`得到格雷碼；測試用**另一個獨立的方式**——反射法：`k + 1`位元的碼是`k`位元的碼，接上同一串反向排列並把新的最高位元設為1——重建整張128項的表，再從sampler讀回（每個扇區中央、每一圈中央的色調，以中點判斷亮或暗，讀回值離中點至少0.1，沒有模稜兩可的情形）。測試檢查：讀回的位元與獨立表剛好符合**一個**扇區轉動量（128種可能的轉動量中，四個seed各自唯一）；相鄰的每一對扇區（含最後與第一個）恰好只有一圈不同——這是格雷碼的定義，與表的寫法無關；896個位元中恰有一半（448個）是亮的。這證明sampler的位元排列與獨立的反射法格雷碼一致；**不**證明環與扇區邊緣混合區（扇區最後35%以平滑階梯混向下一個扇區的位元）的形狀，那一帶只靠C1檢查。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0241，比多數材質大，因為環邊與扇區邊的高低差陡）。256²與512²取樣的亮處占比略有不同，測試採用256²的數值。

取樣時以`fract(u) − 0.5`、`fract(v) − 0.5`得到離tile中心的位移，半徑`r`決定環（`ring = floor((r − 0.10) / ((0.46 − 0.10) / 7))`，在0到6之間才有圓弧），角度`atan2`換成「扇區單位」`around = angle / 2π · 128`，扇區`n = (floor(around) + turn) mod 128`，`turn = floor(hash(0, 18, seed ^ 鹽值) · 128)`；該環的位元為`((n xor (n >> 1)) >> (6 − ring)) & 1`，扇區最後35%以smoothstep混向下一個扇區的位元（兩端斜率為零，所以跨扇區邊值連續且為C1），環的遮罩為`smooth(clamp(min(r − 起點, 終點 − r) / 0.006))`（環兩側各縮進0.004形成溝）：color＝`gapTone + (toneFloor + 0.7·value − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·mask·(0.45 + 0.55·value) + 0.08·grain`、roughness固定0.4、AO溝與圓盤外降至0.6、金屬factor為0；保留的cache只有`Float64Array(128²)` 131,072 B（沒有表），為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**（沒有建構表，取樣含一次`atan2`與`hypot`）。實測（工具實跑，seed 0／1／0xffffffff／7）：獨立反射表唯一符合的扇區轉動量分別是10／71／101／125；128對相鄰扇區都恰好只有一圈不同；亮位元448個（共896個）；讀回無模稜兩可的情形；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）22.57%–22.67%、color 0.02551–0.02600至0.85383–0.85454、平均0.24738–0.24749、roughness恆為0.4、AO最低0.6、height至多0.8769–0.8788 relief；512²取樣（四個seed）亮處22.58%–22.60%、color 0.02521–0.02532至0.85467–0.85493、平均0.24738–0.24750、AO最低0.6、height至多0.8791–0.8798 relief；seed 0與1相比，512²中color>0.5的取樣23.0%不同；seed 7的512²maps平均r／g／b約(62.8, 69.2, 82.7)、法線tilt²最大約0.0241、z分量最小253。我實看了預覽（2×2個tile）：深藍黑底上四個銀白色編碼器圓盤，內圈弧最長、越往外越碎，最外圈是細密的短弧，環間有暗色細溝。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('graycode', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`poissondisk`（泊松圓盤）使目前目錄1038→1039種，含plain的gallery為1040項。以投點法（dart throwing）在環面上選出彼此至少相距0.085（環面上的最短距離）的隨機點，也就是泊松圓盤取樣；每個點畫一個半徑0.034（小於最小距離的一半，所以圓盤不會相碰）的圓盤，薄荷綠圓盤平均散布在深青黑色底上；seed決定所有點的位置與數量（我實測的seed 0／1／0xffffffff／7分別是92／90／88／86個圓盤）。這是示意的圖樣，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；最小距離0.085、圓盤半徑0.034、6000次候選點、12×12的桶、色調（span 0.7、floor 0.14）、薄荷綠與深青黑色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。測試**只靠讀回取樣結果**檢查：把256²取樣格中亮的像素（color>0.5）以測試中另外寫的洪水填色在環面上分成4連通的圓盤，各圓盤中心取圓周平均（跨過磚邊的圓盤也正確），然後確認圓盤數在80到100之間、每個圓盤大小在170到190像素之間、任兩個圓盤中心的環面距離都大於0.083（最小距離0.085，讀回的中心約有一個像素1/256的誤差）、64×64格上每一點到最近圓盤中心的距離都小於0.095（沒有留下還放得下另一個點的空洞，也就是投點法有達到飽和）。這證明的是sampler畫出的圓盤確實互不相碰、間距符合最小距離、分布沒有大空洞；並**不**證明這樣的點集在統計上就是均勻的泊松圓盤分布（投點法本身的性質我沒有另外驗證），也不證明seed選擇的品質（測試只檢查seed 0與1的圓盤中心中，在seed 1的圓盤中心0.01以內有對應者的比例低於15%）。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0016）。256²取樣與512²取樣的亮處占比略有不同，測試採用256²的數值。

啟動時（每個sampler）依序取`hash(k, 0, seed ^ 鹽值)`、`hash(k, 1, seed ^ 鹽值)`為第`k`個候選點（`k`從0到5999），若它到所有已接受的點的環面最短距離都不小於0.085就接受，並把接受的點放進12×12個桶（桶寬1/12，比圓盤半徑大，所以查找只需要看周圍3×3個桶）；取樣時找出3×3個桶內離取樣點最近的點，`t = clamp(1 − d²/0.034²)`，`mask = smooth(clamp(t/0.35))`，`dome = t²`，色調為`0.7·(0.7 + 0.3·dome)`：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO圓盤外降至0.6、金屬factor為0；圓盤只是到點的距離平方的函數，在邊緣恰為零，圓盤也不會重疊，所以場為C1。保留的cache有`Float64Array(128²)` 131,072 B，另有約90個點的座標與桶的小陣列（未計入），皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構（約90個點、6000個候選點乘已接受點數的距離比較）與取樣耗時未量測**。實測（工具實跑，seed 0／1／0xffffffff／7）：圓盤數92／90／88／86（256²與512²取樣一致）；圓盤中心最小距離在256²為0.08470／0.08445／0.08440（seed 7為0.08483），512²為0.08490–0.08520；圓盤大小256²為177–185像素、512²為718–731像素；64×64格上到最近圓盤中心的最大距離0.0871–0.0898；seed 0的92個圓盤中心中，只有1個在seed 1的圓盤中心0.01以內；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）24.31%–25.38%、color 0.02535–0.02559至0.85011–0.85301、平均0.21783–0.22576、roughness恆為0.4、AO最低0.6、height至多0.8363–0.8454 relief；512²取樣（四個seed）亮處23.77%–25.39%、color 0.02509–0.02527至0.85148–0.85324、平均0.21369–0.22578、AO最低0.6、height至多0.8396–0.8461 relief；seed 0與1相比，512²中color>0.5的取樣38.4%不同；seed 7的512²maps平均r／g／b約(44.2, 74.9, 69.5)、法線tilt²最大約0.0016、z分量最小255。我實看了預覽：深青黑色底上大小一致的薄荷綠圓盤，間距平均、沒有重疊，也沒有明顯的規則排列。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('poissondisk', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`wangtiles`（王氏磁磚）使目前目錄1037→1038種，含plain的gallery為1039項。16×16圓角方磚表上的隨機王氏（Wang）鋪磚：每條相鄰磁磚之間的邊以隨機選一種顏色（深或亮），每塊磁磚依自己四條邊（上、下、左、右）的顏色畫出——也就是說共用一條邊的兩塊磁磚在這條邊上顏色必然一致，這是王氏磁磚的配對規則；磁磚內部的色調是四邊顏色依到各邊中點的距離加權的平滑平均，所以邊的色塊在兩側磁磚合成模糊的菱形。琥珀色在深紫底上；seed決定所有邊的顏色。這是示意的圖樣，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；16×16、兩種邊顏色、權重`(1 − d²/reach²)²`（reach 0.9）、色調（span 0.7、floor 0.14）、琥珀與深紫色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。sampler先對環面上每條水平邊與垂直邊各用`hash`隨機決定顏色，兩側磁磚共用同一份資料，所以配對規則是構造出來的；測試**只靠讀回取樣結果**檢查：以離磁磚中心0.4格往四個邊的方向讀回每塊磁磚四條邊的顏色（讀回值離中點至少0.1，沒有模稜兩可的情形），確認每一條共用邊從兩側讀回的顏色相同（含環面繞回），16種磁磚（四條邊顏色的組合）全部出現，並在約2,500個磁磚內部的點上以測試中另外寫的加權公式（用讀回的邊顏色作輸入）重算色調，與sampler的差在grain（0.015）內。這證明的是sampler的邊顏色一致、色調公式與獨立公式相符，並不證明隨機分布的統計性質，也不證明seed選擇的品質（測試只檢查seed 0與1的上邊顏色不同的比例介於35%與65%）。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0068）。

啟動時（每個sampler）對每個格子`(i, j)`以`hash(i, j, seed ^ 鹽值)`決定「磁磚上方的水平邊」顏色（< 0.5為深＝0、否則亮＝1），以`hash(i, j, seed ^ (鹽值 + 1))`決定「磁磚左邊的垂直邊」顏色，各存入`Uint8Array(256)`；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），磁磚的上、下、左、右邊分別取自本格與下方、右方的格子（對16取餘），各邊權重為`max(0, 1 − d²/0.9²)²`（`d`為到該邊中點的距離，以格寬為單位），色調為`0.7·Σ權重·邊顏色 / Σ權重`：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；保留的cache為`Uint8Array(256)`兩份共512 B加`Float64Array(128²)` 131,072 B，共131,584 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**。實測（工具實跑，seed 0／1／0xffffffff／7）：每一條共用邊從兩側讀回的顏色不一致的數量為0，16種磁磚全部出現，讀回無模稜兩可的情形；用讀回的邊顏色以獨立公式重算2,541個點，最大色差0.01445–0.01485；上邊與左邊共512條邊中亮邊（1）有243–249條；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）32.56%–32.89%、color 0.02570–0.02586至0.85340–0.85405、平均0.35701–0.35805、roughness恆為0.4、AO最低0.6、height至多0.8422–0.8461 relief；512²取樣（四個seed）亮處31.69%–32.56%、color 0.02520–0.02542至0.85425–0.85473、平均0.35193–0.35792、AO最低0.6、height至多0.8477–0.8491 relief；seed 0與1相比，512²中color>0.5的取樣30.0%不同；seed 7的512²maps平均r／g／b約(102.7, 75.9, 57.6)、法線tilt²最大約0.0068、z分量最小255。我實看了預覽：深紫底上琥珀色的圓角方磚，每塊內部是平滑的明暗漸層，邊的色塊跨兩側磁磚形成模糊的菱形。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('wangtiles', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`bayerdither`（拜爾抖色）使目前目錄1036→1037種，含plain的gallery為1038項。64×64圓角方磚表上的有序抖色（ordered dither）灰階漸層：8×8的拜爾（Bayer）門檻矩陣（由`M(1) = [0]`以倍增遞迴`M(2s) = [[4M, 4M + 2], [4M + 3, 4M + 1]]`建立，值0到63盡量均勻分散）在整張表上重複，一個格子在它的門檻低於所在欄的「亮度等級」時發光；等級從表的左右邊緣的2、每欄增加2，一路升到中間的64（全部的格子都亮），再對稱降回去，所以發光的比例由約3%平滑增加到100%再降回，就像半色調印刷輸出灰階漸層。銀白色的方磚在深藍底上；整張表中有2,112個格子發光（共4,096格）；seed讓整張表在環面上平移。這是示意的半色調圖，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；64×64、8×8的拜爾矩陣、等級每欄加2的三角形漸層、色調（span 0.7、floor 0.14）、銀白與深藍色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。sampler以倍增遞迴建立拜爾矩陣；測試用**另一個獨立的方式**——封閉形式：座標每一位元`j`貢獻`4^(2 − j)·(2·(x_j xor y_j) + y_j)`——重新計算，我先用探針確認這個封閉形式與遞迴結果在8×8的64個格子上完全相同；測試檢查矩陣含0到63各一次、發光格共2,112個，並對4,096個可能的平移逐一比對每格中心顏色。**這個材質的平移不是唯一的**：因為抖色矩陣每8列重複，垂直方向平移8格不會改變任何東西，所以每個seed恰有**8個**符合的平移（水平平移相同、垂直平移彼此差8的倍數），測試明確檢查這一點，而不是期待唯一解（最大誤差0.0150，來自grain，門檻0.03）。這證明sampler的拜爾矩陣、等級漸層與發光規則和獨立公式一致。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0378）。256²與512²取樣的亮處占比與最小色值、AO不同（見下），這是格寬（4與8像素）與取樣點在格內位置不同造成的，不是不同的seed；測試使用256²的數值。

啟動時（每個sampler）以`Int32Array(64)`從`M(1) = [0]`起，對`size = 1, 2, 4`把每個舊格`v = 4·M`放在原位、右邊`+size`格放`v + 2`、下方放`v + 3`、右下放`v + 1`，得到8×8拜爾矩陣；再對每格`(row, col)`建立色調表：`bayer[(row mod 8)·8 + (col mod 8)] < 2·min(col, 63 − col) + 2`時為0.7、否則為0，存入`Float64Array(4096)`；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），格索引加上由`hash(0, 17, seed ^ 鹽值)`、`hash(1, 17, seed ^ 鹽值)`決定的平移（對64取餘）：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；保留的cache為`Float64Array(4096)` 32,768 B加`Float64Array(128²)` 131,072 B，共163,840 B，另有建構時的`Int32Array(64)`，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**。實測（工具實跑）：獨立封閉形式的矩陣含0到63各一次，發光格2,112個；四個seed（0／1／0xffffffff／7）各有**8個**符合的平移，水平平移依序為14、26、42、43，垂直平移除以8的餘數依序為5、7、5、0（同一seed的8個垂直平移彼此差8的倍數），最大擬合誤差0.014990–0.014997；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）恆為38.67%、color 0.05888–0.05957至0.85409–0.85462、平均0.42440–0.42454、roughness恆為0.4、AO最低0.7344、height至多0.8471–0.8499 relief；512²取樣（四個seed）亮處恆為35.45%、color 0.02511–0.02530至0.85448–0.85485、平均0.36698–0.36712、AO最低0.6、height至多0.8498–0.8508 relief；seed 0與1相比，格中心顏色相差超過0.05的格子占31.3%（512²中color>0.5的取樣21.5%不同）；seed 7的512²maps平均r／g／b約(91.3, 95.7, 110.0)、法線tilt²最大約0.0378、z分量最小253。我實看了預覽：深藍底上銀白色方磚的半色調漸層，兩條較暗的垂直帶與兩條全亮的垂直帶交錯。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('bayerdither', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`baumsweet`（鮑姆—斯威特序列）使目前目錄1035→1036種，含plain的gallery為1037項。把鮑姆—斯威特序列（Baum–Sweet sequence）`b(n)`（n = 0, 1, 2, …）依列寫進列長64的64×64圓角方磚表：若n的二進位表示中沒有任何長度為奇數的連續0（0的游程），則`b(n) = 1`，否則`b(n) = 0`（`b(0) = 1`），前幾項是`1 1 0 1 1 0 0 1 0 1 0 0 1 0 0 1 1 0 0 1 …`。前4,096項中只有377項是1（約9.2%），所以畫面取其負片：`b(n) = 0`的格子發光、`b(n) = 1`的格子停在底色調，成為一整片琥珀金的鉚釘板，上面散布著呈格狀、成群的深色孔洞。深褐的孔洞在琥珀金方磚上；seed讓整張表在環面上平移。這是示意的組合序列圖，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；64×64、取負片、色調（span 0.7、floor 0.14）、琥珀金與深褐色調及0.5 m nominal tile皆作者設定。調整紀錄：第一版直接讓`b(n) = 1`的格子發光，實看預覽後只有稀疏的一點點金色點、整體非常暗，所以改成取負片（`b(n) = 0`發光），再看一次預覽：滿版的琥珀金方磚加上格狀成群的深色孔洞（兩個版本的預覽都實看了）。sampler以逐位元計算零游程的方式判斷；測試用**另一個獨立的方式**——把n轉成二進位字串，用正規表示式`/0+/g`取出所有零游程，檢查是否有奇數長度——重新計算，檢查前20項為`11011001010010011001`、前4,096項中恰有377項是1，並對4,096個可能的平移逐一比對每格中心顏色，檢查**恰好有一個**平移符合（最大誤差0.0150，來自grain，門檻0.03）。「這個定義下的序列是鮑姆—斯威特序列」是標準定義；兩種判斷方式在4,096項上一致由測試實測。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0399）。256²與512²取樣的亮處占比、最小色值與AO不同（見下），這是格寬（4與8像素）與取樣點在格內位置不同造成的，不是不同的seed；測試使用256²的數值。

啟動時（每個sampler）對`n = 0 … 4095`從最低位往上逐位掃描二進位表示，累計連續0的個數`zeros`，遇到1時若`zeros`為奇數就判定`b(n) = 0`並把`zeros`歸零（n的最高位是1，所以沒有前導0的游程；低位的0游程在遇到第一個1時才檢查），`b(n) = 0`時色調為0.7、否則為0，存入`Float64Array(4096)`；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），格索引加上由`hash(0, 16, seed ^ 鹽值)`、`hash(1, 16, seed ^ 鹽值)`決定的平移（對64取餘）：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；保留的cache為`Float64Array(4096)` 32,768 B加`Float64Array(128²)` 131,072 B，共163,840 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**。實測（工具實跑）：獨立正規表示式判斷的前20項`11011001010010011001`，前4,096項有377項是1；四個seed（0／1／0xffffffff／7）各有**唯一**符合的平移，分別為(28, 27)、(37, 36)、(27, 8)、(33, 10)，最大擬合誤差0.014997–0.015000；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）恆為68.10%、color 0.05971–0.06054至0.85444–0.85452、平均0.65341–0.65360、roughness恆為0.4、AO最低0.7344、height至多0.8482–0.8497 relief；512²取樣（四個seed）亮處恆為62.42%、color 0.02517–0.02532至0.85463–0.85477、平均0.56178–0.56197、AO最低0.6、height至多0.8503–0.8506 relief；seed 0與1相比，格中心顏色相差超過0.05的格子占16.5%（512²中color>0.5的取樣11.3%不同）；seed 7的512²maps平均r／g／b約(153.8, 115.9, 46.3)、法線tilt²最大約0.0399、z分量最小253。我實看了預覽（兩個版本）：最後的版本是深褐孔洞點綴的琥珀金方磚板。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('baumsweet', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`kolakoski`（科拉科斯基序列）使目前目錄1034→1035種，含plain的gallery為1036項。把科拉科斯基序列（Kolakoski sequence）`1 2 2 1 1 2 1 2 2 1 2 2 1 1 2 1 1 2 2 1 …`的一段依列寫進48×48的圓角方磚表：這個只由1與2組成的序列等於它自己各個「連續相同符號」的長度（1、22、11、2、1、22、1、22、11、……），以讀取自己的項當作游程長度的方式一路產生；表顯示從seed決定的起點（4,096個可能的起點之一）開始的2,304項，1的格子發光、2的格子停在底色調，所以整張表是細碎、沒有長程重複的垂直條紋與點。青綠色的方磚在深紫黑底上；seed決定序列的起點。這是示意的組合序列圖，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；48×48、4,096個起點、色調（span 0.7、floor 0.14）、青綠與深紫黑色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。sampler以「一路讀取自己的項當作游程長度」的單次掃描產生序列；測試用**另一個獨立的方式**——從`(1, 2, 2)`出發反覆做游程解碼`R(s)`（把s的各項當作交替符號1、2、1、2、……的游程長度），直到長度足夠——產生序列，檢查前20項為`12211212212211211221`、前100項的游程長度等於前面的項（自我描述性質，這是對獨立模型本身的檢查，不是對sampler的檢查），並把sampler每格中心的顏色對4,096個可能的起點逐一比對，檢查**恰好有一個**起點符合（最大誤差0.0150，來自grain，門檻0.03）。「游程解碼的不動點就是科拉科斯基序列」是標準的理論事實，這裡由測試在約6,500項上實測一致，沒有證明對所有n成立。我在寫sampler的產生迴圈時，一度寫成`kolakoski[write++] = kolakoski[write - 1] === 1 ? 2 : 1`，注意到這在JavaScript中會因為`write++`先遞增而讀到錯的位置（會讀到尚未寫入的格子），**在第一次執行之前、閱讀程式碼時就發現並改寫**成先算出符號再寫入的版本，所以沒有執行過錯誤版本。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0296）。

啟動時（每個sampler）以`Uint8Array(6403)`從`1, 2, 2`出發：令`read = 2`，每一輪取出`kolakoski[read]`當作長度，寫入該長度個與前一個符號不同的符號（1與2交替），再`read++`，直到寫滿；起點由`floor(hash(0, 15, seed ^ 鹽值) · 4096)`決定，把從起點開始的2,304項轉成`Float64Array(2304)`色調表（1為0.7、2為0）；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），不做環面平移：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；保留的cache為`Float64Array(2304)` 18,432 B加`Float64Array(128²)` 131,072 B，共149,504 B，另有建構時的`Uint8Array(6403)`暫存，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**。實測（工具實跑）：獨立游程解碼法產生的序列長度6,526，前20項`12211212212211211221`，從起點0開始的2,304項中有1,154個1；四個seed（0／1／0xffffffff／7）各有**唯一**符合的起點，分別為867、3651、2016、3029，最大擬合誤差0.01486–0.01497；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）占35.38%–35.75%、color 0.02571–0.02588至0.85422–0.85446、平均0.36060–0.36366、roughness恆為0.4、AO最低0.6、height至多0.8480–0.8490 relief；512²取樣（四個seed）亮處占35.61%–36.17%、color 0.02524–0.02554至0.85474–0.85481、平均0.36291–0.36600、height至多0.8493–0.8502 relief；seed 0與1相比，格中心顏色相差超過0.05的格子占57.6%（512²中color>0.5的取樣41.3%不同）；seed 7的512²maps平均r／g／b約(41.6, 89.8, 89.0)、法線tilt²最大約0.0296、z分量最小253。我實看了預覽：深紫黑底上青綠色的細碎方塊，略帶垂直的條紋傾向。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('kolakoski', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`sterndiatomic`（斯特恩雙原子序列）使目前目錄1033→1034種，含plain的gallery為1035項。把2,304個數字依列排成48×48的圓角方磚表，第`row`列第`col`欄放`n = row·48 + col + 1`，色調由斯特恩雙原子序列（Stern's diatomic sequence）`s(n)`除以4的餘數決定：`(s(n) mod 4) / 3`，只有四種色調。序列由`s(1) = 1`、`s(2k) = s(k)`、`s(2k + 1) = s(k) + s(k + 1)`定義，前幾項是`1 1 2 1 3 2 3 1 4 3 5 2 5 3 4 1 …`，它同時是把`n − 1`寫成2的冪之和、每個冪至多用兩次的方法數（超二進位表示）。前2,304項中`s mod 4 = 0、1、2、3`各有391、770、377、766項（最大的`s`是157）。琥珀橘與深藍紫的圓角方磚，呈現帶垂直條帶的馬賽克；seed讓整張表在環面上平移。這是示意的數論序列圖，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；48×48、模4、色調（span 0.7、floor 0.14）、琥珀橘與深藍紫色調及0.5 m nominal tile皆作者設定（預覽只看了一版，畫面很滿、以橘色為主，我沒有再調整）。sampler以遞迴式`s(2k) = s(k)`、`s(2k + 1) = s(k) + s(k + 1)`逐項計算；測試用**另一個獨立的方式**——以動態規劃數『把`n − 1`寫成2的冪之和、每個冪至多用兩次』的方法數（超二進位表示）——取代遞迴式，檢查前16項為`1 1 2 1 3 2 3 1 4 3 5 2 5 3 4 1`、前2,304項中除以4的餘數0到3的個數為391、770、377、766，並對2,304個可能的平移逐一比對每格中心顏色，檢查**恰好有一個**平移符合（最大誤差0.0150，來自grain，門檻0.03）。「超二進位表示的個數等於斯特恩序列」是標準的理論事實，這裡由測試在2,304項上實測一致，沒有證明對所有n成立。為什麼取模4：因為四個色調（間距0.7/3 ≈ 0.233）遠大於grain的誤差，可以明確區分；我沒有試其他的模數。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0296）。

啟動時（每個sampler）以遞迴式逐項計算`Int32Array(2306)`的`s(n)`（`n = 1 … 2305`），再把`tones[n − 1] = 0.7·(s(n) mod 4) / 3`存入`Float64Array(2304)`；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），格索引加上由`hash(0, 14, seed ^ 鹽值)`、`hash(1, 14, seed ^ 鹽值)`決定的平移（對48取餘）：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；保留的cache為`Float64Array(2304)` 18,432 B加`Float64Array(128²)` 131,072 B，共149,504 B，另有建構時的`Int32Array(2306)`（9,224 B）暫存，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**。實測（工具實跑）：獨立動態規劃求得前16項`1 1 2 1 3 2 3 1 4 3 5 2 5 3 4 1`，前2,304項除以4的餘數0到3的個數391、770、377、766，最大的`s`為157；四個seed（0／1／0xffffffff／7）各有**唯一**符合的平移，分別為(31, 3)、(29, 42)、(30, 39)、(39, 6)，最大擬合誤差0.01490–0.01500；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）占35.61%–35.64%、color 0.02558–0.02586至0.85415–0.85442、平均0.38884–0.39705、roughness恆為0.4、AO最低0.6、height至多0.8471–0.8486 relief；512²取樣（四個seed）亮處占35.46%–35.58%、color 0.02516–0.02556至0.85446–0.85481、平均0.38979–0.39263、height至多0.8490–0.8502 relief；seed 0與1相比，格中心顏色相差超過0.05的格子占83.2%（512²中color>0.5的取樣35.5%不同）；seed 7的512²maps平均r／g／b約(106.2, 66.2, 53.3)、法線tilt²最大約0.0296、z分量最小253。我實看了預覽：橘色為主的方磚，夾著深色與棕色，隱約有垂直條帶。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('sterndiatomic', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`cassiniovals`（卡西尼卵形線）使目前目錄1032→1033種，含plain的gallery為1034項。8×8的卡西尼卵形線（Cassini ovals）圖鑑，每格一個圓盤：欄決定兩個焦點`(−f, 0)`與`(f, 0)`之間的半距離`f`（0.15、0.25、…、0.85，單位為圓盤半徑），列決定亮環的數目（2、3、…、9）。圓盤內的點到兩個焦點的距離之積等於`|z² − f²|`（`z = x + iy`），在單位圓盤上最大為`1 + f²`，色調為`(1 + cos(2π·環數·|z² − f²| / (1 + f²))) / 2`，所以亮環就是卡西尼卵形線本身：距離積小於`f²`時是繞著兩個焦點的兩個分離的封閉圈，等於`f²`時是八字形（雙紐線），大於`f²`時是同時圍住兩個焦點的單一封閉圈；`f`小的欄接近同心圓，`f`大的欄分得很開。琥珀金的亮環在深藍黑底上，圓盤邊緣柔化；seed讓整張圖鑑在環面上平移（以格為單位）。這是示意的數學圖鑑，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；8×8格、圓盤半徑0.46、邊緣柔化0.05、焦點與環數的數列、色調（floor 0.1、span 0.72）、琥珀金與深藍黑色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。「距離積為`|z² − f²|`」「距離積小於、等於、大於`f²`時分別是兩個圈、八字形、一個圈」是標準的數學事實，我沒有在這裡證明，也沒有用程式檢查亮環的拓樸（連通分量數）。sampler以複數形式`|z² − f²|`計算距離積；測試用**另一個獨立的形式**——直接取點到兩個焦點的距離再相乘——重新計算色調，在8,000個黃金比例點上比對sampler的顏色（圓盤內半徑0.85以內比對色調，圓盤外半徑超過1.005者比對縫隙色調，其餘的邊緣柔化區不比較），並對64個可能的平移逐一嘗試，檢查**恰好有一個**平移符合（最大誤差0.0149，來自grain，門檻0.03）。這證明每格的焦點位置、環數、正規化與色調和獨立公式一致，**不涵蓋圓盤邊緣柔化區的形狀**。我原先在測試裡還寫了一個「圓盤中心的距離積等於`f²`」的斷言，但它只是把同一條公式再算一次、沒有檢查任何東西，違反測試守則，在commit前已刪除。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0052，幾乎平坦）。

取樣時（沒有啟動時預先計算，只建立128²的細grain noise）`x = fract(u)·8`、`y = fract(v)·8`，格內位置除以圓盤半徑得到`(px, py)`，`半徑r = hypot(px, py)`，格索引加上由`hash(0, 13, seed ^ 鹽值)`、`hash(1, 13, seed ^ 鹽值)`決定的平移（對8取餘）得到欄與列；`f = 0.15 + 0.1·欄`、`環數 = 2 + 列`，`距離積 = hypot(px² − py² − f², 2·px·py)`、`tone = (1 + cos(2π·環數·距離積 / (1 + f²))) / 2`、`mask = smoothstep(clamp((1 − r)·圓盤半徑 / 0.05))`、`dome = smoothstep(clamp(1 − r²))`：color＝`gapTone + (toneFloor + toneSpan·tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.1、`toneSpan` 0.72）、height ＝ `0.8·dome·(0.7 + 0.3·tone) + 0.08·grain`、roughness固定0.4、AO圓盤外降至0.6、金屬factor為0；保留的cache只有`Float64Array(128²)` 131,072 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**（每次取樣一次`hypot`、一次`cos`）。實測（工具實跑）：四個seed（0／1／0xffffffff／7）各有**唯一**符合的平移，分別為(2, 3)、(5, 4)、(0, 0)、(6, 2)，最大擬合誤差0.01476–0.01490（每個seed在8,000個點中有6,501個用於比較，其中3,857個在圓盤內）；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）占26.06%–26.09%、color 0.02548–0.02589至0.83253–0.83313、平均0.28494–0.28509、roughness恆為0.4、AO最低0.6、height至多0.8689–0.8720 relief；512²取樣（四個seed）亮處占25.95%–25.97%、color 0.02511–0.02530至0.83407–0.83474、平均0.28489–0.28502、height至多0.8717–0.8764 relief；seed 0與1相比，512²中color>0.5的取樣28.0%不同；seed 7的512²maps平均r／g／b約(78.4, 68.1, 58.5)、法線tilt²最大約0.0052、z分量最小255。我實看了預覽：整齊的8×8圓盤，每個圓盤內是深藍黑與琥珀金的卵形環，焦點靠近的欄像同心圓，焦點分開的欄則出現雙環與啞鈴狀的環（由於seed的平移，這些欄在預覽中不在固定的左右位置）。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('cassiniovals', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`chessqueens`（棋盤皇后）使目前目錄1031→1032種，含plain的gallery為1033項。10×10的西洋棋盤：深色格與淺色格交錯成棋盤格，在其中放上十個互不攻擊的皇后——每一列、每一欄、每一條斜線上都恰有至多一個皇后——以發亮的象牙白磚表示。10×10棋盤共有724種這樣的放法，sampler以回溯法逐列找出全部，再依seed挑出其中一種，所以每個seed的皇后位置不同。因為皇后的斜線不會繞過環面，棋盤不做環面平移（平移後就不再是解）。深紫黑的格縫、深色與灰色的棋盤格、象牙白的皇后磚。這是示意的棋盤圖，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；10×10、色調（淺色格0.2、皇后0.7、floor 0.14）、象牙白與深紫黑色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。724這個數字是10皇后問題的已知解數，我另外用獨立寫的位元遮罩求解器計得724。sampler以旗標陣列做逐列回溯；測試用**另一個獨立的求解器**——以位元遮罩（已用的欄與兩個斜線方向）逐列搜尋——在測試中重新求出全部724個解，再從sampler每格中心讀回棋盤，檢查恰有十個皇后、每列一個，並且讀回的皇后位置是這724個解之一（因此沒有兩個皇后共欄或共斜線），深色格的顏色低於0.16、淺色格在0.32到0.36之間，並檢查四個seed選出的解都不同、同一seed每次相同。**這驗證輸出是十皇后問題的一個合法解，但不驗證seed如何選解**（`floor(hash · 724)`這個索引沒有被獨立檢查；兩個求解器依設計都是由小到大的欄逐列搜尋，但我沒有對照sampler的解列表順序是否與獨立求解器逐一相同；我另外觀察到四個seed讀回的解在獨立求解器列舉中的序號是361、307、46、478，但沒有把它寫成斷言）。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.00298，幾乎平坦）。

啟動時（每個sampler）以回溯法逐列放置皇后（用已用欄與兩個斜線方向的旗標陣列，`Uint8Array(10)`與兩個`Uint8Array(20)`）找出全部724個解，依`floor(hash(0, 12, seed ^ 鹽值) · 724)`挑出一個，建立`Float64Array(100)`的色調表（皇后0.7、淺色格`(row + col)`為奇數時0.2、深色格0）；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），不平移：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.5 + 0.5·tone) + 0.08·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；保留的cache為`Float64Array(100)` 800 B加`Float64Array(128²)` 131,072 B，共131,872 B，另有建構時的解列表（724個長度10的陣列，我沒有計算這部分的位元組數），皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。sampler建構在bun中量到約23.6 ms（第一次，含JIT）、3.6 ms、2.8 ms、2.7 ms、2.5 ms（對seed 0／1／0xffffffff／7／2各建一次），是單次量測、不是benchmark；取樣本身只做常數次運算，我沒有量測。實測（工具實跑）：獨立位元遮罩求解器求得724個解；四個seed（0／1／0xffffffff／7）讀回的皇后位置（每列的欄，0起算）依序為`4970286135`、`4295186370`、`0718529364`、`6257903148`，都恰有十個皇后且都是這724個解之一；深色格的顏色0.1257–0.1537、淺色格0.3261–0.3540；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）占7.15%–7.16%、color 0.02544–0.02566至0.85364–0.85385、平均0.22649–0.22932、roughness恆為0.4、AO最低0.6、height至多0.7520–0.7563 relief；512²取樣（四個seed）亮處占7.17%–7.18%、color 0.02520–0.02546至0.85459–0.85471、平均0.22649–0.22933、height至多0.7561–0.7589 relief；seed 0與1相比，512²中color>0.5的取樣10.0%不同；seed 7的512²maps平均r／g／b約(69.9, 61.4, 67.0)、法線tilt²最大約0.00298、z分量最小255。我實看了預覽：深紫黑與灰色交錯的棋盤格，散布著幾顆象牙白的皇后磚。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('chessqueens', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`thuemorse`（圖厄—莫爾斯序列）使目前目錄1030→1031種，含plain的gallery為1032項。把圖厄—莫爾斯序列（Thue–Morse sequence）`t(n)`（n = 0, 1, 2, …，即n的二進位表示中1的個數的奇偶：`0 1 1 0 1 0 0 1 1 0 0 1 0 1 1 0 …`）依列寫進列長48的48×48圓角方磚表，1的格子發光、0的格子停在底色調。48不是2的冪，所以各列彼此滑動，畫面呈現斜向、不規則的帶狀與編織般的圖案（像電路板）；前2,304項中恰有1,152個1。萊姆綠的方磚在深褐黑底上；seed讓整張表在環面上平移。這是示意的組合序列圖，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；48×48、色調（span 0.7、floor 0.14）、萊姆綠與深褐黑色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。sampler以「1的個數的奇偶」產生序列；測試用**另一個獨立的方式**——從字0出發反覆套用替換規則`0 → 01`、`1 → 10`——產生序列，檢查前16個字母為`0110100110010110`、前2,304個字母中恰有1,152個1，並對2,304個可能的平移逐一比對每格中心顏色，檢查**恰好有一個**平移符合（最大誤差0.0150，來自grain，門檻0.03）。「兩種方式產生同一序列」是標準的理論事實，這裡由測試在2,304個字母上實測一致，沒有證明對所有n成立；「每個長度為2^k且從2^k的倍數開始的區塊中0與1各半」同樣是標準事實，我只驗證了前2,304項的1的個數為1,152。我選48作為列長，是因為2的冪的列長會讓表退化成兩個一維序列的逐位元互斥或（規則而單調的方格）；我沒有實際渲染2的冪列長來比較。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0296）。亮處占比隨seed與取樣格寬（256²是5.3像素、512²是10.7像素）略有不同。

啟動時（每個sampler）對`n = 0 … 2303`逐位計算二進位1的個數的奇偶，奇數則色調為0.7、否則為0，存入`Float64Array(2304)`；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），格索引加上由`hash(0, 11, seed ^ 鹽值)`、`hash(1, 11, seed ^ 鹽值)`決定的平移（對48取餘）：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；保留的cache為`Float64Array(2304)` 18,432 B加`Float64Array(128²)` 131,072 B，共149,504 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**。實測（工具實跑）：獨立替換法產生的字長度（替換到不少於2,304個字母時）為4,096，前16個字母`0110100110010110`，前2,304個字母有1,152個1；四個seed（0／1／0xffffffff／7）各有**唯一**符合的平移，分別為(4, 39)、(30, 19)、(29, 21)、(42, 27)，最大擬合誤差0.014973–0.014996；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）占35.50%–36.46%、color 0.02533–0.02577至0.85424–0.85440、平均0.36143–0.36918、roughness恆為0.4、AO最低0.6、height至多0.8473–0.8493 relief；512²取樣（四個seed）亮處占35.66%–36.16%、color 0.02510–0.02536至0.85471–0.85489、平均0.36342–0.36594、height至多0.8494–0.8502 relief；seed 0與1相比，格中心顏色相差超過0.05的格子占52.4%（512²中color>0.5的取樣37.6%不同）；seed 7的512²maps平均r／g／b約(59.1, 91.8, 60.0)、法線tilt²最大約0.0296、z分量最小253。我實看了預覽：深褐黑底上萊姆綠的方塊，編織成像電路板般的垂直條與框。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('thuemorse', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`graecolatin`（希臘—拉丁方陣）使目前目錄1029→1030種，含plain的gallery為1031項。13×13的希臘—拉丁方陣（Graeco-Latin square，也叫歐拉方陣）：每個格子有兩個符號——顏色符號`(row + col) mod 13`與高度符號`(2·row + col) mod 13`。每個符號在每一列、每一欄都恰好出現一次（兩個都是拉丁方陣），而且169格的符號配對全都不同（兩個方陣正交），因為兩條線性式的行列式`1 − 2`對13而言可逆。顏色符號決定磚的色調（`0.7·符號 / 12`，從深藍到琥珀橘），高度符號決定磚的高度（以0.4到1.0的比例），所以畫面是斜向漸層的琥珀橘磚，另一個方向的斜向對角起伏只出現在浮雕與法線上。seed讓整張方陣在環面上平移。這是示意的組合設計圖，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；13×13、乘數2、色調（span 0.7、floor 0.14）、高度（base 0.4、span 0.6）、琥珀橘與深藍色調及0.5 m nominal tile皆作者設定（預覽只看了一版，預覽中只看得到顏色符號的斜向漸層，高度符號只在浮雕上）。與其他表格材質不同，這個材質的測試**不是**與另一個模型比對，而是直接檢查性質：測試從sampler在每格中心讀回兩個符號（顏色符號由顏色換算、高度符號由以relief為單位的高度扣掉grain平均後換算，各取最近的13個等級），檢查讀回的兩個13×13陣列都是拉丁方陣（每個符號在每列每欄恰好一次）、兩者正交（169個配對全都不同），且讀回值離等級格點不超過0.3個等級（實測最大約0.245，來自grain）。**這驗證輸出確實是一個希臘—拉丁方陣，但不驗證它就是`(row + col)`與`(2·row + col)`這兩個公式**（任何正交拉丁方陣組合都會通過）。為確認檢查不是空轉，我在探針中第一次錯用了高度的比例（沒有除以relief）使高度符號恆為同一個值，探針立刻顯示「高度的拉丁性不成立、配對只有13個」，修正讀回後才得到169個配對；這個錯誤只出現在臨時探針，後來寫進測試的讀回公式一開始就是正確的。相同的格寬問題：256²取樣與512²取樣統計略有不同。relief沿用0.0008、未另外調整（512²maps法線tilt²最大只有0.00458，幾乎平坦）。

取樣時（沒有啟動時預先計算，只建立128²的細grain noise）每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），格索引加上由`hash(0, 10, seed ^ 鹽值)`、`hash(1, 10, seed ^ 鹽值)`決定的平移（對13取餘）後得到`R`、`C`，顏色符號`(R + C) mod 13`、高度符號`(2R + C) mod 13`：color＝`gapTone + (toneFloor + 0.7·顏色符號 / 12 − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.4 + 0.6·高度符號 / 12) + 0.02·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；保留的cache只有`Float64Array(128²)` 131,072 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**。實測（工具實跑）：四個seed（0／1／0xffffffff／7）讀回的顏色符號與高度符號都涵蓋0到12，兩個陣列都是拉丁方陣（不符合的列與欄為0），169個符號配對全都不同；顏色符號讀回離格點最大0.2452個等級、高度符號最大0.2384個等級；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）占32.74%–32.79%、color 0.02553–0.02565至0.85370–0.85386、平均0.36529–0.36532、roughness恆為0.4、AO最低0.6、height至多0.8186–0.8189 relief；512²取樣（四個seed）亮處占32.78%–32.86%、color 0.02510–0.02527至0.85447–0.85466、平均0.36525–0.36532、height至多0.8192–0.8195 relief；seed 0與1相比，169個格子的顏色符號全部不同（格中心顏色相差超過0.05的格子為100%，512²中color>0.5的取樣54.4%不同）；seed 7的512²maps平均r／g／b約(99.5, 80.8, 62.9)、法線tilt²最大約0.00458、z分量最小255。我實看了預覽：深藍到琥珀橘的斜向鋸齒漸層方磚。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('graecolatin', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`rudinshapiro`（魯丁—夏皮羅序列）使目前目錄1028→1029種，含plain的gallery為1030項。把魯丁—夏皮羅序列（Rudin–Shapiro sequence）`a(n)`（n = 0, 1, 2, …）依列寫進64×64的圓角方磚表：n的二進位表示中，相鄰兩個1（「11」）的組數若為偶數則`a(n) = +1`、奇數則`−1`，+1的格子發光、−1的格子停在底色調。序列的前16項是`+ + + − + + − + + + + − − − + −`；前4,096項中有2,080項是+1、2,016項是−1。因為列長64是2的冪，表在兩個方向上都由序列的片段交織而成，看起來像一塊格子呢（plaid）：大小不一的方塊與細線交錯，64欄全都不是由上到下恆定（這點與摺紙序列表不同）。粉紅色的方磚在深藍灰底上；seed讓整張表在環面上平移。這是示意的組合序列圖，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；64×64、色調（span 0.7、floor 0.14）、粉紅與深藍灰色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。sampler以「相鄰1的組數」公式產生序列；測試用**另一個獨立的方式**——夏皮羅多項式（Shapiro polynomials）的倍增遞迴：從`P = Q = (1)`出發，`P' = P接Q`、`Q' = P接−Q`——產生序列，檢查前16項為`+++-++-++++---+-`、前4,096項有2,080個+1，並對4,096個可能的平移逐一比對每格中心顏色，檢查**恰好有一個**平移符合（最大誤差0.0150，來自grain，門檻0.03）。「兩種方式產生同一序列」是標準的理論事實，這裡由測試在4,096項上實測一致，沒有證明對所有n成立。序列的其他標準性質（例如部分和的大小約為√n）我沒有驗證。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0399）。256²與512²取樣的亮處占比與最小色值、AO不同（見下），這是格寬（4與8像素）與取樣點在格內位置不同造成的，不是不同的seed；測試使用256²的數值。「格子呢」是我對預覽的描述。

啟動時（每個sampler）對`n = 0 … 4095`逐位檢查`n & (n >> 1)`的各位元得到相鄰1的組數，偶數則色調為0.7、否則為0，存入`Float64Array(4096)`；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），格索引加上由`hash(0, 9, seed ^ 鹽值)`、`hash(1, 9, seed ^ 鹽值)`決定的平移（對64取餘）：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；保留的cache為`Float64Array(4096)` 32,768 B加`Float64Array(128²)` 131,072 B，共163,840 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**。實測（工具實跑）：獨立夏皮羅倍增法產生的序列長度正好4,096，前16項`+++-++-++++---+-`，前4,096項有2,080個+1；四個seed（0／1／0xffffffff／7）各有**唯一**符合的平移，分別為(2, 30)、(56, 2)、(56, 25)、(24, 29)，最大擬合誤差0.014994–0.015000；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）恆為38.09%、color 0.05932–0.05980至0.85417–0.85460、平均0.41975–0.41994、roughness恆為0.4、AO最低0.7344、height至多0.8480–0.8495 relief；512²取樣（四個seed）亮處恆為34.91%、color 0.02523–0.02533至0.85461–0.85484、平均0.36301–0.36320、AO最低0.6、height至多0.8501–0.8508 relief；seed 0與1相比，格中心顏色相差超過0.05的格子占50.0%（512²中color>0.5的取樣34.4%不同）；seed 7的512²maps平均r／g／b約(98.9, 77.0, 94.3)、法線tilt²最大約0.0399、z分量最小253。我實看了預覽：深藍灰底上粉紅色的方塊與細線交織成格子呢般的圖案。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('rudinshapiro', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`paperfolding`（摺紙序列）使目前目錄1027→1028種，含plain的gallery為1029項。把正則摺紙序列（regular paperfolding sequence，把一條紙帶反覆對折再展開所得的摺痕方向，也是龍形曲線的轉向序列）依列寫進64×64的圓角方磚表：對`n = 2^k·(2j + 1)`，第`n`項（n = 1, 2, …）在`j`為偶數時是1、奇數時是0，即`1 1 0 1 1 0 0 1 1 1 0 0 1 0 0 …`，1的格子發光。因為列長64是2的冪，表中除了兩欄（未平移時的第32欄與第64欄）之外，每一欄由上到下都是同一個值，所以整張表是一片條碼般的垂直條紋，條紋的寬窄排列本身就是這個序列的前63項；第32欄是逐列交替的虛線，第64欄則一路寫出整個序列。奶油卡其色的方磚在深綠黑底上；seed讓整張表在環面上平移。這是示意的組合序列圖，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；64×64、色調（span 0.7、floor 0.14）、奶油卡其與深綠黑色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。sampler以「n的奇數部分」公式產生序列；測試用**另一個獨立的方式**——真的『摺紙』：從單一摺痕1出發，每多摺一次就得到`S, 1, 反轉並取補數的S`——產生序列，檢查前15項為`110110011100100`、前4,096項有2,049個1，並對4,096個可能的平移逐一比對每格中心顏色，檢查**恰好有一個**平移符合（最大誤差0.0150，來自grain，門檻0.03）。「兩種方式產生同一序列」是標準的理論事實，這裡由測試在4,096項上實測一致，沒有證明對所有n成立。我另用探針確認：在這個獨立模型中，64欄裡只有第32欄（0起算第31欄，交替的`1010…`）與第64欄（0起算第63欄，序列本身）不是由上到下恆定的，這是由模型直接計數得到、不是只靠推理。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0378）。256²與512²取樣的亮處占比與最小色值、AO不同（見下），這是格寬（4與8像素）與取樣點在格內位置不同造成的，不是不同的seed；測試使用256²的數值。

啟動時（每個sampler）對`n = 1 … 4096`反覆除以2取得奇數部分`odd`，若`(odd − 1) / 2`是偶數則色調為0.7、否則為0，存入`Float64Array(4096)`；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），格索引加上由`hash(0, 8, seed ^ 鹽值)`、`hash(1, 8, seed ^ 鹽值)`決定的平移（對64取餘）：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；保留的cache為`Float64Array(4096)` 32,768 B加`Float64Array(128²)` 131,072 B，共163,840 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**。實測（工具實跑）：獨立摺紙法產生的序列（摺到不少於4,096項時）長度為8,191，前15項`110110011100100`，前4,096項有2,049個1；四個seed（0／1／0xffffffff／7）各有**唯一**符合的平移，分別為(10, 21)、(16, 38)、(4, 31)、(15, 7)，最大擬合誤差0.01500（皆在0.014994–0.014999之間）；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）恆為37.52%、color 0.05901–0.05967至0.85434–0.85454、平均0.41539–0.41557、roughness恆為0.4、AO最低0.7344、height至多0.8490–0.8497 relief；512²取樣（四個seed）亮處恆為34.39%、color 0.02525–0.02527至0.85466–0.85483、平均0.35931–0.35949、AO最低0.6、height至多0.8503–0.8507 relief；seed 0與1相比，格中心顏色相差超過0.05的格子占75.0%（512²中color>0.5的取樣51.6%不同）；seed 7的512²maps平均r／g／b約(93.9, 95.0, 72.9)、法線tilt²最大約0.0378、z分量最小253。我實看了預覽：深綠黑底上奶油卡其色的垂直條紋，像條碼，其中有兩條虛線欄。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('paperfolding', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`fibonacciword`（斐波那契字）使目前目錄1026→1027種，含plain的gallery為1028項。把斐波那契字（Fibonacci word）`0100101001001010…`依列寫進55×55的圓角方磚表（55是斐波那契數）：第`n`個字母（n = 1, 2, …）是`floor((n + 1) / φ²) − floor(n / φ²)`，是斜率為`1 / φ²`的斯圖爾米序列（Sturmian sequence），字母為1的格子發光（約占`1 / φ² ≈ 0.382`）。因為每列的長度是斐波那契數，相鄰兩列幾乎重複、只以固定的小步長漂移，所以整張表佈滿接近垂直、偶爾斜一格的準週期條紋。珊瑚紅的方磚在深紫黑的縫隙上；seed讓整張表在環面上平移。這是示意的數論／組合序列圖，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；55×55、色調（span 0.7、floor 0.14）、珊瑚紅與深紫黑色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。sampler用`floor`公式（以倍精度的`φ`相關常數）產生序列；測試用**另一個獨立的方式**——從字0出發反覆套用替換規則`0 → 01`、`1 → 0`——產生斐波那契字，檢查前16個字母為`0100101001001010`、前3,025個字母中有1,155個1（占0.3818，接近`1 / φ² = 0.3820`），並對3,025個可能的平移逐一比對每格中心顏色，檢查**恰好有一個**平移符合（最大誤差0.0150，來自grain，門檻0.03）。「兩種方式產生同一個序列」是標準的理論事實（斯圖爾米序列與斐波那契字的對應），這裡由測試在3,025個字母上實測一致，沒有證明對所有n成立。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0356）。256²與512²取樣、以及不同seed的亮處占比略有差異（約27.2%–27.6%），這是格寬（4.65與9.3像素）不是整數、取樣點落在格內的位置隨平移不同所造成，並非序列本身改變（平移不改變表中1的總數）。

啟動時（每個sampler）對`n = 1 … 3025`計算`floor((n + 1)·s) − floor(n·s)`（`s = (3 − √5) / 2 = 1 / φ²`），為1時色調為0.7，否則為0，存入`Float64Array(3025)`；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），格索引加上由`hash(0, 7, seed ^ 鹽值)`、`hash(1, 7, seed ^ 鹽值)`決定的平移（對55取餘）：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；保留的cache為`Float64Array(3025)` 24,200 B加`Float64Array(128²)` 131,072 B，共155,272 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**。實測（工具實跑）：獨立替換法產生的字長度（替換到不少於3,025個字母時）為4,181，前16個字母`0100101001001010`，前3,025個字母有1,155個1；四個seed（0／1／0xffffffff／7）各有**唯一**符合的平移，分別為(1, 2)、(47, 4)、(6, 18)、(2, 28)，最大擬合誤差0.01495／0.01475／0.01489／0.01468；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）占27.18%–27.60%、color 0.02536–0.02597至0.85393–0.85422、平均0.30453–0.30639、roughness恆為0.4、AO最低0.6、height至多0.8468–0.8476 relief；512²取樣（四個seed）亮處占27.16%–27.57%、color 0.02512–0.02534至0.85454–0.85472、平均0.30452–0.30639、height至多0.8489–0.8501 relief；seed 0與1相比，格中心顏色相差超過0.05的格子占74.5%（512²中color>0.5的取樣53.4%不同）；seed 7的512²maps平均r／g／b約(90.5, 42.3, 57.6)、法線tilt²最大約0.0356、z分量最小253。我實看了預覽：深紫黑底上珊瑚紅的接近垂直條紋，偶爾錯開一格，條紋寬度有長有短。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('fibonacciword', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`zeckendorftable`（澤肯多夫表）使目前目錄1025→1026種，含plain的gallery為1027項。把數字1到2,304依列排成48×48的圓角方磚表，第`row`列第`col`欄的磚放的是`n = row·48 + col + 1`，色調由`n`的澤肯多夫表示（Zeckendorf representation）用了幾項斐波那契數（1、2、3、5、8、13……，不連續的和）決定：項數越多越亮，色調為`0.7·((項數 − 1) / (最大項數 − 1))`；斐波那契數本身（一項）最暗。澤肯多夫表示以貪心法求得，它同時也是加起來等於`n`所需的最少斐波那契數個數。2,304個數字需要1到8項：項數為1到8的數字各有16、105、362、693、710、351、65、2個，所以大部分的磚落在中間的色調。表中出現明暗的橫向與縱向塊狀結構（我只描述預覽中看到的樣子，沒有驗證是否自相似）。萊姆綠的圓角方磚在深綠黑的縫隙上；seed讓整張表在環面上平移。這是示意的數論表，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；48×48、色調（span 0.7、floor 0.14、指數1）、萊姆綠與深綠黑色調及0.5 m nominal tile皆作者設定。調整紀錄：第一版色調直接用`項數 / 最大項數`，實看預覽後因為多數數字落在3到5項，所有磚都是差不多的中綠、對比很低，所以改成從1項算起的`(項數 − 1) / (最大項數 − 1)`（再看一次預覽，對比稍好，但大部分磚仍是中間的綠色，這是分佈本身的結果，我沒有再用更強的指數去硬拉）。「貪心的澤肯多夫表示同時是最少項數的表示」是已知的標準定理，我沒有在這裡證明；但測試用**另一個獨立的方式**——對所有`n ≤ 2304`做動態規劃求加起來等於`n`的最少斐波那契數個數——取代sampler的貪心法，所以兩者在2,304個數字上一致這件事本身被測到了。測試檢查項數1到8的數字個數（16、105、362、693、710、351、65、2）、最大項數為8，並對2,304個可能的平移逐一比對每格中心顏色，檢查**恰好有一個**平移符合（最大誤差0.0150，來自grain，門檻0.03）。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0280）。

啟動時（每個sampler）列出不超過2,304的斐波那契數（1、2、3、5、8、……、1597，共16個），對每個`n = 1 … 2304`由大到小貪心取不超過餘數的斐波那契數並計數，存入`Int32Array(2305)`，取最大項數（8），再把色調`0.7·((項數 − 1) / 7)`存入`Float64Array(2304)`；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），格索引加上由`hash(0, 6, seed ^ 鹽值)`、`hash(1, 6, seed ^ 鹽值)`決定的平移（對48取餘）：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；保留的cache為`Float64Array(2304)` 18,432 B加`Float64Array(128²)` 131,072 B，共149,504 B，另有建構時的`Int32Array(2305)`（9,220 B）暫存，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**建構與取樣耗時未量測**。實測（工具實跑）：獨立動態規劃求得的項數分布（1到8項）為16、105、362、693、710、351、65、2個（合計2,304），16個斐波那契數各一項；四個seed（0／1／0xffffffff／7）各有**唯一**符合的平移，分別為(38, 40)、(16, 12)、(41, 36)、(1, 7)，最大擬合誤差0.01498／0.01498／0.01495／0.01479；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）占34.91%–34.96%、color 0.02548–0.02601至0.85044–0.85170、平均0.35986–0.35992、roughness恆為0.4、AO最低0.6、height至多0.8356–0.8390 relief；512²取樣（四個seed）亮處占34.28%–34.29%、color 0.02525–0.02535至0.84195–0.85237、平均0.35983–0.35995、height至多0.8361–0.8439 relief；seed 0與1相比，格中心顏色相差超過0.05的格子占76.0%（512²中color>0.5的取樣36.6%不同）；seed 7的512²maps平均r／g／b約(75.8, 104.6, 53.4)、法線tilt²最大約0.0280、z分量最小253。我實看了預覽：萊姆綠的方磚表，大部分是中間的綠色，夾著明暗的橫向與縱向塊狀結構。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('zeckendorftable', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`walshmatrix`（沃爾什矩陣）使目前目錄1024→1025種，含plain的gallery為1026項。32×32的沃爾什—阿達馬矩陣（Walsh–Hadamard matrix），以頻序（sequency order）排列，畫成圓角方磚：第`r`列沿著該列恰好變號`r`次（第0列全是+1，第31列每格都變號），+1的格子發光（亮度從第一列到最後一列以0.3的比例漸暗），−1的格子停在底色調。矩陣取`2^5 = 32`階，第`r`列對應的阿達馬列是`h = 位元反轉(格雷碼(r))`，第`c`欄的值是`(−1)^popcount(h & c)`。任兩個不同的列彼此正交（內積為0），所以圖案是有高度結構的二值方陣：頻率由上而下遞增。琥珀金的方磚在深藍底上；seed讓整張表在環面上平移。這是示意的數學表，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；32×32、列漸暗0.3、色調（span 0.7、floor 0.14）、琥珀金與深藍色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。sampler以格雷碼加位元反轉建立頻序列；測試用**另一個獨立的方式**——Sylvester倍增法（`H = [[H, H], [H, −H]]`）建立阿達馬矩陣，再依各列的變號次數排序——建立整張表，檢查排序後各列的變號次數正好是0到31，並從sampler每格中心顏色讀回±1（亮格為+1），檢查讀回的矩陣是阿達馬矩陣（任兩個不同列的內積為0、每列與自己的內積為32，不論平移為何都成立），再對1,024個可能的平移逐一比對每格中心的顏色，檢查**恰好有一個**平移符合（最大誤差0.0150，來自grain，門檻0.03）。這證明sampler的矩陣與獨立建立的沃爾什矩陣（含頻序）一致，且讀回的符號確實彼此正交。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0177）。256²與512²取樣的亮處占比不同（見下），這是格子寬度（8與16像素）與取樣點在格內位置不同造成的，不是不同的seed。

啟動時（每個sampler）建立`Float64Array(1024)`色調表：第`row`列取`gray = row xor (row >> 1)`，把其5個位元反轉得到`hadamard`，第`col`欄取`parity = popcount(hadamard & col) mod 2`，`parity = 0`（+1）時`tones = 0.7·(1 − 0.3·row / 31)`，否則0；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），格索引加上由`hash(0, 5, seed ^ 鹽值)`、`hash(1, 5, seed ^ 鹽值)`決定的平移（對32取餘）：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；保留的cache為`Float64Array(1024)` 8,192 B加`Float64Array(128²)` 131,072 B，共139,264 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。建構與取樣耗時**未量測**。實測（工具實跑）：獨立建立的沃爾什矩陣各列的變號次數為0、1、2、……、31；四個seed（0／1／0xffffffff／7）讀回的矩陣皆為阿達馬矩陣（不正交的列對為0）；各有**唯一**符合的平移，分別為(12, 22)、(4, 1)、(22, 13)、(2, 6)，最大擬合誤差0.01499／0.01499／0.01500／0.01498；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）占32.09%–32.17%、color 0.02581–0.02604至0.85314–0.85387、平均0.32965–0.32984、roughness恆為0.4、AO最低0.6、height至多0.8431–0.8452 relief；512²取樣（四個seed）亮處恆為37.06%、color 0.02523–0.02538至0.85422–0.85461、平均0.33488–0.33499、height至多0.8463–0.8492 relief；seed 0與1相比，格中心顏色相差超過0.05的格子占76.2%（512²中color>0.5的取樣35.9%不同）；seed 7的512²maps平均r／g／b約(90.7, 74.9, 44.0)、法線tilt²最大約0.0177、z分量最小254。我實看了預覽：深藍底上琥珀金的方磚，有一條全亮的橫列（第0列）與愈往下愈密的垂直條紋與棋盤結構。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('walshmatrix', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`hermitemodes`（厄米—高斯模）使目前目錄1023→1024種，含plain的gallery為1025項。8×8格的圖表，畫出雷射光束橫模TEM(m, n)（也是二維簡諧振子的能階狀態）的厄米—高斯模（Hermite–Gauss modes）：欄是x方向的指數m、列是y方向的指數n（各為0到7）；每格顯示強度`I = (f_m(x)·f_n(y) / (峰值_m·峰值_n))²`，其中`f_k(x) = H_k(x)·exp(−x² / 2)`、`H_k`是物理學家的厄米多項式，每個一維函數以其在範圍內的最大絕對值正規化，所以每格最亮處接近1。每格的x、y座標都對應到−4.2到4.2，所以低階模是中央的小光斑、高階模則是被暗的節線分隔的一格格亮瓣（m、n各是各方向的節線數）。橘紅色的亮瓣在深紫黑底上，圓角方塊磚；seed讓整張圖表在環面上平移（以格為單位）。這是示意的數學圖表，不是雷射光束的物理模擬（真實光束的光腰會隨模階變化，這裡所有模共用同一個範圍）。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；8×8格、座標範圍±4.2、圓角方塊的kernel尺寸、色調（floor 0.1、span 0.74）、橘紅與深紫黑色調及0.5 m nominal tile皆作者設定（預覽只看了一版，整體偏暗、高階模的亮瓣很密，我沒有再調整）。厄米—高斯模是雷射橫模與簡諧振子本徵態，以及`m = 7`的古典轉折點約為`√15 ≈ 3.87`（所以範圍±4.2足以容納）都是標準的物理／數學事實，我沒有在這裡驗證。sampler以遞迴式`H_(k+1) = 2x·H_k − 2k·H_(k−1)`計算厄米多項式，並以4,097點的細格找一維峰值；測試以**另一個獨立的形式**——明確的和`H_k(x) = k!·Σ_j (−1)^j (2x)^(k − 2j) / (j! (k − 2j)!)`，並以8,193點（與sampler不同大小）的細格找峰值——重新計算，在8,000個黃金比例點上比對sampler的顏色（kernel內部（四次範數不大於0.65）比對強度色調，kernel之外（範數大於1.02）比對縫隙色調，其餘邊緣柔化區不比較），並對64個可能的平移逐一嘗試，檢查**恰好有一個**平移符合（最大誤差0.0150，來自grain，門檻0.03）；測試另外檢查一維峰值（`k = 0`為1、`k = 7`約在580到590之間）以及`H_1(0) = 0`。這證明每格的強度公式、正規化、座標對應與排列與獨立寫的公式一致，**不涵蓋kernel邊緣柔化區的形狀**。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.00274，幾乎平坦）。

啟動時（每個sampler）對`k = 0 … 7`各以4,097個等距點在−4.2到4.2之間找出`|f_k|`的最大值（`peaks`），共8組、約32,776次函數評估（我沒有量測這部分耗時）；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），格內位置`(fx, fy)`（−0.5到0.5）對應`x = fx·2·4.2`、`y = fy·2·4.2`，格索引加上由`hash(0, 4, seed ^ 鹽值)`、`hash(1, 4, seed ^ 鹽值)`決定的平移（對8取餘）得到`(m, n)`，`amplitude = f_m(x)·f_n(y) / (peaks[m]·peaks[n])`、`tone = amplitude²`：color＝`gapTone + (toneFloor + toneSpan·tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.1、`toneSpan` 0.74）、height ＝ `0.8·dome·(0.7 + 0.3·tone) + 0.08·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；保留的cache為`Float64Array(128²)` 131,072 B加8個峰值，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**取樣耗時未量測**（每次取樣做兩次最多7階的遞迴與兩次指數函數）。實測（工具實跑）：一維峰值`k = 0 … 7`依序為1.0000、1.2131、2.2920、5.4226、14.9596、46.3971、158.1936、584.0201；四個seed（0／1／0xffffffff／7）各有**唯一**符合的平移，分別為(0, 2)、(2, 4)、(3, 4)、(5, 1)，最大擬合誤差0.01500／0.01489／0.01482／0.01477（每個seed在8,000個點中有6,718個用於比較，其中5,081個在kernel內）；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）占4.81%–4.83%、color 0.02551–0.02588至0.84838–0.85010、平均0.15925–0.15940、roughness恆為0.4、AO最低0.6、height至多0.8541–0.8609 relief；512²取樣（四個seed）亮處占4.55%–4.57%、color 0.02519–0.02543至0.8526–0.8544、平均0.15929–0.15944、height至多0.8671–0.8774 relief；seed 0與1相比，512²中color>0.5的取樣9.1%不同；seed 7的512²maps平均r／g／b約(47.4, 19.4, 29.7)、法線tilt²最大約0.00274、z分量最小255。我實看了預覽：深紫黑底上排列整齊的8×8格，最簡單的小光斑（m = n = 0）出現在seed平移後的某一格，離它愈遠（m、n愈大）愈是密集的橘紅亮瓣網格。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('hermitemodes', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`supershapes`（超橢圓星形）使目前目錄1022→1023種，含plain的gallery為1024項。一張8×8的超公式（Gielis風格superformula）形狀圖鑑，每格一個形狀：欄決定摺數`m`（2、4、6、8、10、12、14、16，只取偶數），列決定尖銳指數`n`（0.35、0.5、0.7、1、1.4、2、3、5，由上到下從很尖到接近圓）。形狀在方位角`t`的半徑，相對於它最長的半徑，是`(2·(cos⁴(m·t / 4) + sin⁴(m·t / 4)))^(−1 / n)`：在`t = π / m`的奇數倍（共m個尖角）處為1，在`t = 0`的奇數倍之間（谷）降到`2^(−1 / n)`（n = 0.35時約0.138，n = 5時約0.871）；使用四次方與偶數的m，讓半徑函數在角度的分支切口上仍然平滑。形狀的色調隨欄加列增大（從深青綠到亮薄荷綠），薄荷綠的星形與花形在深藍黑底上；形狀邊緣柔化，內部有圓頂高度。seed讓整張圖鑑在環面上平移（以格為單位）。這是示意的數學圖鑑，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；8×8格、摺數與尖銳度的數列、圓盤半徑0.46、邊緣柔化0.05、色調（floor 0.14、span 0.7）、薄荷綠與深藍黑色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。我用的是自己簡化的形狀公式（兩個指數都用4、a = b = 1），不是完整的Gielis superformula，也沒有對照原論文的參數。公式在這裡有一個值得注意的地方：因為`cos⁴ + sin⁴`的範圍是[0.5, 1]，形狀半徑比的最小值固定是`2^(−1 / n)`，所以n愈小愈像針狀的星，n = 0.35時的尖端非常細。測試用**另一個獨立的形式**（`cos⁴x + sin⁴x = 1 − sin²(2x) / 2`，半徑為`(2 − sin²(2x))^(−1 / n)`）重新計算，在8,000個黃金比例點上比對sampler的顏色（形狀內距離邊緣超過0.06格者比對形狀色調，邊緣外超過0.005個圓盤半徑者比對縫隙色調，其餘邊緣柔化區不比較），並對64個可能的平移逐一嘗試，檢查**恰好有一個**平移符合（最大誤差0.01497，來自grain，門檻0.03）；測試也檢查尖角處半徑為1、谷處為`2^(−1 / n)`。這證明形狀的位置、大小、摺數、尖銳度與色調與獨立寫的公式一致，**不涵蓋柔化邊緣區的形狀**（該區只由C1與有界檢查涵蓋，這些檢查通過）。我第一次執行測試時有一項失敗：我把測試註解與期望寫成「角度0是尖角」，實際上角度0是谷、尖角在`π / m`（與sampler的註解一致），修正測試的註解與期望後重跑通過。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0378）。

啟動時沒有預先計算（只建立128²的細grain noise）；取樣時`x = fract(u)·8`、`y = fract(v)·8`，格內位置除以圓盤半徑得到`(px, py)`，`半徑r = hypot(px, py)`，格索引加上由`hash(0, 3, seed ^ 鹽值)`、`hash(1, 3, seed ^ 鹽值)`決定的平移（對8取餘）；`t = m·atan2(py, px) / 4`、`邊緣 = (2·(cos⁴t + sin⁴t))^(−1 / n)`、`mask = smoothstep(clamp((邊緣 − r)·圓盤半徑 / 0.05))`、`dome = smoothstep(clamp(1 − (r / 邊緣)²))`、`tone = (欄 + 列) / 14`：color＝`gapTone + (toneFloor + toneSpan·tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14、`toneSpan` 0.7）、height ＝ `0.8·dome·(0.7 + 0.3·tone) + 0.08·grain`、roughness固定0.4、AO形狀外降至0.6、金屬factor為0；保留的cache只有`Float64Array(128²)` 131,072 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。**我沒有量測**建構或取樣耗時（每次取樣一次`atan2`、一次`cos`、一次`sin`與一次冪運算）。實測（工具實跑）：四個seed（0／1／0xffffffff／7）各有**唯一**符合的平移，分別為(7, 1)、(5, 5)、(7, 7)、(3, 4)，最大擬合誤差0.01473／0.01497／0.01479／0.01489（每個seed在8,000個點中有7,057–7,098個用於比較，其中2,129–2,167個在形狀內）；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）占17.07%–17.13%、color 0.02528–0.02590至0.85335–0.85415、平均0.20254–0.20261、roughness恆為0.4、AO最低0.6、height至多0.8583–0.8717 relief；512²取樣（四個seed）亮處占17.13%–17.19%、color 0.02520–0.02528至0.85391–0.85458、平均0.20219–0.20228、height至多0.8600–0.8736 relief；seed 0與1相比，512²中color>0.5的取樣28.0%不同；seed 7的512²maps平均r／g／b約(34.7, 58.1, 64.4)、法線tilt²最大約0.0378、z分量最小253。我實看了預覽：整齊的8×8星形與花形，上方的列非常尖、下方的列接近圓，左右的摺數遞增。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('supershapes', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`zernikemodes`（澤尼克模）使目前目錄1021→1022種，含plain的gallery為1023項。8×8格的圓盤，每個圓盤畫一個澤尼克多項式（Zernike polynomial），依OSA／ANSI單一索引的順序排列（`j = (n(n + 2) + m) / 2`：第0格是`n = 0, m = 0`，第1、2格是`n = 1, m = −1、1`，第3到5格是`n = 2, m = −2、0、2`……，共64個，最後一個是`n = 10, m = 6`）。每個模是徑向多項式乘上方位角的餘弦（`m ≥ 0`）或正弦（`m < 0`），徑向多項式在圓盤邊緣的值為1，所以`|Z| ≤ 1`；圓盤的色調為`(1 + Z) / 2`，從暗到亮，所以每個圓盤內部是同心環、花瓣與馬鞍狀的明暗圖案，像光學像差的圖鑑（n = 0的圓盤整個最亮）。淡奶白色的圓盤在深藍黑的底上，邊緣柔化。seed讓整張表在環面上平移（以圓盤為單位）。這是示意的數學圖表，不模擬任何實物，也不是任何光學系統的真實波前。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；8×8格、圓盤半徑0.46格、邊緣柔化0.08、色調（floor 0.1、span 0.72）、淡奶白與深藍黑色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。OSA／ANSI單一索引與正弦／餘弦的符號慣例是我憑記憶採用的寫法，**這次沒有對照標準文件確認**；Zernike徑向多項式在邊緣為1、`|Z| ≤ 1`是標準的理論事實，我沒有在這裡證明，只在探針的取樣中看到所有輸出顏色落在[0, 1]內。sampler用階乘級數計算徑向多項式；測試用**另一個獨立的形式**——Jacobi多項式的二項式和（`R = (−1)^k r^|m| P_k^(|m|,0)(1 − 2r²)`，`k = (n − |m|) / 2`）——重新計算，在每個圓盤內半徑0.6處取四個角度（共256個點）比對sampler的顏色，並對64個可能的平移逐一嘗試，檢查**恰好有一個**平移符合（最大誤差0.0134，來自grain，門檻0.03），另外檢查前六個與最後一個模的索引，以及邊緣值為1。這證明sampler的多項式、符號與排列與獨立寫的公式一致，**不證明該公式本身對應標準Zernike定義**（測試中的公式也是我寫的）。因為relief沿用0.0008、圓盤的高度變化小，512²maps的法線tilt²最大只有0.00126（幾乎是平的），這是預期的，沒有另外調整。

啟動時（每個sampler）依序列出64個`(n, m)`（n由0起、m從−n到n每次加2），為每個模預先算出徑向多項式的各項冪次`n − 2k`與係數`(−1)^k (n − k)! / (k! ((n + |m|) / 2 − k)! ((n − |m|) / 2 − k)!)`（k從0到`(n − |m|) / 2`），並保存`Int32Array(64)`的n與m各一個以及小型的每模陣列；取樣時`x = fract(u)·8`、`y = fract(v)·8`，格內位置除以圓盤半徑得到`(px, py)`，`半徑r = hypot(px, py)`，格索引加上由`hash(0, 2, seed ^ 鹽值)`、`hash(1, 2, seed ^ 鹽值)`決定的平移（對8取餘）；`Z = R(min(r, 1))·cos(m·atan2(py, px))`（m ≥ 0）或`·sin(−m·atan2)`（m < 0）、`tone = 0.5 + 0.5·Z`、`mask = smoothstep(clamp((1 − r) / 0.08))`、`dome = smoothstep(clamp(1 − r²))`：color＝`gapTone + (toneFloor + toneSpan·tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.1、`toneSpan` 0.72）、height ＝ `0.8·dome·(0.7 + 0.3·tone) + 0.08·grain`、roughness固定0.4、AO圓盤外降至0.6、金屬factor為0；保留的cache為`Float64Array(128²)` 131,072 B加每模的小型陣列（我沒有計算這部分的位元組數）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。建構與取樣耗時**未量測**（每次取樣計算一個格的多項式，最多6項，加一次`atan2`與`cos`或`sin`）。實測（工具實跑）：四個seed（0／1／0xffffffff／7）各有**唯一**符合的平移，分別為(5, 2)、(2, 5)、(4, 1)、(4, 2)，最大擬合誤差0.01265／0.01343／0.01269／0.01304；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）占16.84%–16.90%、color 0.02549–0.02579至0.83229–0.83345、平均0.30005–0.30010、roughness恆為0.4、AO最低0.6、height至多0.8587–0.8693 relief；512²取樣（四個seed）亮處占16.83%–16.86%、color 0.02517–0.02525至0.8337–0.8339、平均0.30003–0.30012、height至多0.8653–0.8723 relief；seed 0與1相比，512²中color>0.5的取樣24.1%不同；seed 7的512²maps平均r／g／b約(82.0, 79.2, 79.8)、法線tilt²最大約0.00126、z分量最小255。我實看了預覽：整齊的8×8圓盤，每個圓盤內是不同的同心環、花瓣與馬鞍圖案，n = 0的圓盤最亮。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('zernikemodes', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`rule110`（規則110）使目前目錄1020→1021種，含plain的gallery為1022項。把一維的基本細胞自動機（elementary cellular automaton）規則110畫成96×96的時空圖：第0列是隨機的一列（每格以0.5的機率亮起），其後每一列的每一格，由它上方左、中、右三格（環繞）的狀態當作三位元數（左＝4、中＝2、右＝1），取規則號碼110的對應位元決定亮或暗；每一列是一代，往下演化。結果是圖案中典型的大小不一的暗三角形與斜向滑翔體（規則110的這些結構是已知的，是標準的理論事實，我沒有在這裡驗證）。亮格為橘色、暗格為深紫色，圓角方塊磚。seed決定第0列的隨機狀態，並使整張圖水平平移；垂直方向不平移（時間軸固定）。這是示意的自動機時空圖，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；規則110、96×96、第0列密度0.5、橘色與深紫色及0.5 m nominal tile皆作者設定（預覽只看了一版，畫面高頻、很滿，亮格占約四成，我沒有再調整）。規則110是確定性的，所以測試**可以獨立驗證動力學**：測試從每格中心的顏色讀回狀態（顏色高於0.5為亮，且必須落在兩個色調的grain範圍內，誤差小於0.03），以獨立寫的規則套用（左＝4、中＝2、右＝1的位元）檢查**第1到95列的每一格**都符合規則110（不符合的格子數必須為0），並檢查第0列約有一半亮起、全表亮格占50%到60%。因為規則是平移不變的，水平平移不影響這項檢查，所以不需要找出平移。為了確認這項檢查不是空轉，我用一個臨時探針把規則號碼換成30，四個seed分別得到3,214／3,218／3,193／3,301個不符合的格子（規則110本身為0個）。這驗證了sampler產生的時空圖確實遵守規則110的更新，但第0列的隨機性（雜湊）本身沒有獨立驗證。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0468）。

啟動時（每個sampler）建立`Float64Array(9216)`色調表：第0列的`tones[col] = hash(col, 0, seed ^ 鹽值) < 0.5 ? 0.7 : 0`，其後第`row`列的每格以上一列左、中、右三格（對96取餘環繞）組成`4·左 + 2·中 + 右`，取`(110 >> 該值) & 1`決定色調為0.7或0；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），欄索引加上由`hash(0, 1, seed ^ 鹽值)`決定的水平平移（對96取餘）：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；保留的cache為`Float64Array(9216)` 73,728 B加`Float64Array(128²)` 131,072 B，共204,800 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。sampler建構在bun中量到約1.5 ms（對seed 0／1／0xffffffff／7／2各建一次，皆約1.5–1.6 ms），是單次量測、不是benchmark；取樣本身只做常數次運算，我沒有量測。實測（工具實跑）：四個seed（0／1／0xffffffff／7）不符合規則110的格子數皆為0；全表亮格5,121／5,127／5,090／5,256個（占55.6%／55.6%／55.2%／57.0%）；第0列亮格45／47／52／49個（共96格）；最後一列亮格51／55／55／58個；顏色與兩個色調的最大誤差0.0150以內；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）占38.10%–38.25%、color 0.02549–0.02613至0.85415–0.85447、平均0.38544–0.38724、roughness恆為0.4、AO最低0.6、height至多0.8472–0.8475 relief；512²取樣（四個seed）亮處占39.75%–41.04%、color 0.02523–0.02550至0.85463–0.85485、平均0.3917–0.4008、height至多0.8497–0.8503 relief；seed 0與1相比，格中心顏色相差超過0.05的格子占46.5%（512²中color>0.5的取樣33.3%不同）；seed 7的512²maps平均r／g／b約(108.2, 68.9, 46.1)、法線tilt²最大約0.0468、z分量最小252。我實看了預覽：深紫底上橘色的細碎方塊，夾著大小不一的暗三角形。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('rule110', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`chromaticant`（彩色螞蟻）使目前目錄1019→1020種，含plain的gallery為1021項。在96×96的環面上跑一隻多色的蘭頓螞蟻（Langton's ant）：棋盤一開始全是顏色0，螞蟻在中央面朝上，規則字串為`RRLLLRLLLRRR`（12種顏色）；每一步螞蟻看腳下格子的顏色c，若`rule[c]`是R就右轉、是L就左轉，把該格的顏色推進到`(c + 1) mod 12`，再往前走一格（環繞）；一共走100,000步。最後每格以圓角方塊磚呈現，色調為`0.7·顏色 / 11`：奶油色到深青綠色。結果是一個混亂的中央區塊，周圍是被筆直的斜線與水平／垂直線圍起的大片平坦區域，且因環面而環繞回來（我只描述預覽中看到的樣子，沒有分析這個規則的動力學）。12種顏色在9,216格中的數量為4,869、521、293、180、337、246、1,288、292、234、275、319、362（顏色0最多，其次是顏色6）。螞蟻的模擬與seed無關（確定性），seed只讓整張棋盤在環面上平移。這是示意的模擬結果，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；96×96、規則字串、100,000步、青綠與奶油色及0.5 m nominal tile皆作者設定。調整紀錄：我先用一個獨立的小原型把五個規則（RLLR 20,000步、LLRR 20,000步、RLR 12,000步、LRRRRRLLR 60,000步、RRLLLRLLLRRR 100,000步）各跑一次，實看了其中三個（LRRRRRLLR、RLLR、RRLLLRLLLRRR）的預覽：RLLR只在中央長成一個小而對稱的圖形、沒有填滿磚面；LRRRRRLLR有菱形的線與混亂區塊；RRLLLRLLLRRR的混亂區塊最大並有很多環繞的直線，所以選了它（LLRR與RLR只印出非零格數、沒有看圖）。螞蟻的規則是確定性的，所以測試**可以獨立重寫**：測試用不同的寫法（方向向量而非轉向計數器）重新模擬螞蟻，檢查12種顏色的格數與上面的數字完全相同，再重建色調表，對每個seed在9,216個可能的平移中逐一比對每格中心的顏色，檢查**恰好有一個**平移符合（最大誤差0.0150，來自grain，門檻0.03）。我沒有分析規則本身的行為（例如是否出現螞蟻高速公路），只驗證sampler與一個獨立模擬一致。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0468）。第一次產生的測試註解把「有非零顏色的4,347格」寫成「被走過的格子」，這是錯的（一格被走了12次又會回到顏色0），已在跑測試後更正。

啟動時（每個sampler）建立`Uint8Array(9216)`的顏色棋盤，從`(48, 48)`、面向上開始跑100,000步（見上），之後把每格的色調設為`0.7·顏色 / 11`存入`Float64Array(9216)`；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），格索引加上由`hash(0, 0, seed ^ 鹽值)`、`hash(1, 0, seed ^ 鹽值)`決定的平移（對96取餘）：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；保留的cache為`Uint8Array(9216)` 9,216 B、`Float64Array(9216)` 73,728 B加`Float64Array(128²)` 131,072 B，共214,016 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。sampler建構（100,000步）在bun中量到約29.3 ms（第一次，含JIT）、9.5 ms、9.1 ms、6.9 ms、1.9 ms（對seed 0／1／0xffffffff／7／2各建一次），是單次量測、不是benchmark；取樣本身只做常數次運算，我沒有量測。實測（工具實跑）：12種顏色格數同上；四個seed（0／1／0xffffffff／7）各有**唯一**符合的平移，分別為(87, 75)、(74, 2)、(55, 37)、(76, 34)，最大擬合誤差0.01496–0.01500；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）占17.75%–17.89%、color 0.02549–0.02601至0.85372–0.85416、平均0.23586–0.23604、roughness恆為0.4、AO最低0.6、height至多0.8440–0.8460 relief；512²取樣（四個seed）亮處占21.15%–21.20%、color 0.02526–0.02547至0.8545–0.8549、平均0.23939–0.23951、height至多0.8483–0.8503 relief；seed 0與1相比，512²中color>0.5的取樣31.7%不同；seed 7的512²maps平均r／g／b約(64.4, 73.3, 63.5)、法線tilt²最大約0.0468、z分量最小252。我實看了預覽：深青綠為底、奶油色的混亂區塊與筆直的環繞線。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('chromaticant', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`gaussianprimes`（高斯質數）使目前目錄1018→1019種，含plain的gallery為1020項。把一張64×64的表排成圓角方塊磚，每格代表一個高斯整數`a + bi`（a、b各為−32到31，原點在表的中央），高斯質數的格子發光：`a + bi`若在軸上（`b = 0`或`a = 0`）則當`|a|`（或`|b|`）是除以4餘3的質數時為高斯質數，否則當範數`a² + b²`是一般質數時為高斯質數；其餘的格子停在底色調。發光強度隨離原點的距離減弱（色調`0.7·(1 − 0.55·√(範數 / 最大範數))`），所以中央較亮、四周較暗。64×64格中共有844個高斯質數，其中24個在軸上（±3、±7、±11、±19、±23、±31，各在四個半軸）；表對兩軸與兩條對角線鏡射對稱（−32那一列／欄沒有對稱的夥伴，因為範圍是−32到31），呈現一圈圈菱形與星形的點陣。玫瑰粉色的點在深暗紫色上；seed讓整張表在環面上平移。這是示意的數論表，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；64×64格、範數色調漸弱0.55、色調（span 0.7、floor 0.14）、玫瑰粉與深暗紫色及0.5 m nominal tile皆作者設定（預覽只看了一版）。sampler以試除法判斷質數；測試則以**另一種獨立的方式**判斷高斯質數——暴力搜尋是否有範數較小的高斯整數因子`c + di`（`(a + bi)(c − di)`的實部與虛部是否都能被`c² + d²`整除），與sampler的「軸上看餘3、其他看範數是否為質數」這套標準定理公式獨立；該定理（Gaussian prime的刻劃）我沒有另外證明，只是測試中兩種判斷在4096個格子上結果一致。測試重建整張色調表後，對每個seed在4096個可能的平移中逐一比對每格中心的顏色，檢查**恰好有一個**平移符合（最大誤差0.0150，來自grain，門檻0.03），並檢查844個質數、24個在軸上，以及幾個特例（1 + i是質數，2、5、0與單位不是，3是）。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0377）。256²與512²取樣的統計不同（見下），這是格子只有4（或8）像素寬、取樣點在格內位置不同造成的，不是不同的seed；測試使用256²的數值。

啟動時（每個sampler）建立`Float64Array(4096)`色調表：對每格取`a = |col − 32|`、`b = |row − 32|`，若在軸上則檢查`max(a, b) % 4 === 3`且是質數，否則檢查`a² + b²`是否為質數（試除法），是的話`tones[row · 64 + col] = 0.7 · (1 − 0.55·√((a² + b²) / 2048))`，否則0；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），格索引加上由`hash(0, 0, seed ^ 鹽值)`、`hash(1, 0, seed ^ 鹽值)`決定的平移（對64取餘）：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；保留的cache為`Float64Array(4096)` 32,768 B加`Float64Array(128²)` 131,072 B，共163,840 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。建構（4,096格的試除法）與取樣耗時**未量測**。實測（工具實跑）：844個高斯質數、24個在軸上；四個seed（0／1／0xffffffff／7）各有**唯一**符合的平移，分別為(22, 34)、(40, 21)、(51, 61)、(51, 37)，最大擬合誤差0.01499–0.01500；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）占14.94%–14.98%、color 0.05897–0.05967至0.8357–0.8397、平均0.21017–0.21026、roughness恆為0.4、AO最低0.7344、height至多0.8395–0.8433 relief；512²取樣（四個seed）亮處占11.58%–11.63%、color 0.02517–0.02532至0.8353–0.8390、平均0.18475–0.18484、AO最低0.6、height至多0.8443–0.8462 relief；seed 0與1相比，512²中color>0.5的取樣23.1%不同；seed 7的512²maps平均r／g／b約(58.5, 30.3, 49.1)、法線tilt²最大約0.0377、z分量最小253。我實看了預覽：深暗紫上的玫瑰粉色點陣，中央較亮，呈現菱形與星形的對稱結構。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('gaussianprimes', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`fordcircles`（福特圓）使目前目錄1017→1018種，含plain的gallery為1019項。福特圓（Ford circles）：對每個既約分數`n / d`（0 ≤ n < d，分母d ≤ 12，共46個）畫一個半徑`1 / (2 d²)`、立在磚面底邊、圓心在`u = n / d`的圓盤（`0 / 1`的圓直徑正好是整塊磚高），並以磚的中線鏡射一份立在頂邊（共91個圓盤，因為`0 / 1`的大圓與其鏡射是同一個）；相鄰的法里（Farey）分數的圓盤彼此恰好相切，大圓之間的縫隙裡由大到小排著一串串的小圓盤，像一個個階梯式的碎形串珠。圓盤的色調隨分母變小而變亮（`0.55·((13 − d) / 12)^1.5`），琥珀金的圓盤在深海軍藍的縫隙上，邊緣柔化；圓盤的內部有圓頂形的高度。seed讓整張圖在水平方向平移（256分之幾的倍數）。這是示意的數論幾何圖案，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；分母上限12、256階的水平平移、邊緣柔化0.2、色調（span 0.55、floor 0.2、指數1.5）、琥珀金與深海軍藍色調及0.5 m nominal tile皆作者設定。調整紀錄：第一版只有立在底邊的一排圓盤，實看預覽後小圓盤串只出現在磚的一側邊緣（預覽中的上緣），另一側大圓之間的縫隙是空的，畫面上下不對稱，所以加上以中線鏡射的頂邊那一排（第二版預覽實看確認：兩排小圓盤在鏡射處相接成一串串對稱的珠子）。圓盤的幾何（切點與互不重疊）我用探針另行驗證，**不在測試中**：用獨立寫的程式量到相鄰法里分數的46對圓盤，圓心距離與半徑和的差最大為1.1e-16；把91個圓盤（含鏡射、環繞）兩兩比較，距離減半徑和的最小值為−9.7e-17（即圓盤互相相切而內部不重疊，差在浮點誤差內）。測試則以獨立寫的福特圓幾何（用最大公因數挑既約分數、圓心n / d、半徑1 / (2 d²)、色調同預設的公式）比對sampler：對6,000個黃金比例點，凡是離任何圓盤邊緣足夠遠的（半徑平方比小於0.75為圓內、大於1.3為縫隙，其餘的柔化邊緣區不比較），顏色要與圓盤色調（或縫隙色調）相差不到0.03，並對256個可能的水平平移逐一試，檢查**恰好有一個**平移符合；這證明圓盤位置、大小與色調的公式正確，**不證明柔化邊緣區的形狀**（該區只由C1與有界檢查涵蓋）。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0315）。我第一次執行測試產生腳本時，因為Hamming測試位在檔案結尾、搜尋下一個describe失敗而中途停止，沒有寫入任何檔案，修正腳本後重跑。

啟動時（每個sampler）以輾轉相除法挑出46個既約分數，建立三個長度46的陣列（圓心、半徑、色調）；取樣時`x = fract(u + 平移)`、`y = min(fract(v), 1 − fract(v))`，對每個圓盤取環繞的水平距離`dx`與`dy = y − 半徑`，`s = (dx² + dy²) / 半徑²`，只有`s < 1`的圓盤才有貢獻（圓盤的內部互不重疊，所以最多一個非零）：`mask = smoothstep(clamp((1 − s) / 0.2))`、`dome = smoothstep(1 − s)`，color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.05、`toneFloor` 0.2）、height ＝ `0.8·dome·(0.85 + 0.15·tone) + 0.08·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；平移為`floor(hash(0, 0, seed ^ 鹽值) · 256) / 256`；保留的cache為三個46個數字的陣列加`Float64Array(128²)` 131,072 B。每次取樣迴圈走過46個圓盤（我沒有量測耗時），建構時間也沒有量測。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑）：46個既約分數；四個seed（0／1／0xffffffff／7）各有**唯一**符合的平移，分別為133、45、240、173（各除以256），最大擬合誤差0.01477–0.01488（約為grain最大振幅0.015；每個seed用於比較的點約3,875–3,887／6,000）；圓盤面積總和（含鏡射、不含柔化）為整塊磚的0.9560；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5，涵蓋分母≤4的圓盤）占82.45%–82.49%、color 0.03553–0.03645至0.76426–0.76446、平均0.63341–0.63359、roughness恆為0.4、AO最低0.6、height至多0.8205–0.8228 relief；512²取樣（四個seed）亮處占82.45%–82.56%、color 0.03518–0.03558至0.76469–0.76490、平均0.63332–0.63349、height至多0.8234–0.8244 relief；seed 0與1相比，512²中color>0.5的取樣26.1%不同；seed 7的512²maps平均r／g／b約(160.5, 136.7, 86.3)、法線tilt²最大約0.0315、z分量最小253。我實看了預覽：深海軍藍上的琥珀金圓盤，大圓之間排著一串串小圓，兩排鏡射成對稱的珠串。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('fordcircles', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`hammingtable`（漢明距離表）使目前目錄1016→1017種，含plain的gallery為1018項。把一張32×32的表排成圓角方塊磚：第`row`列、第`col`欄的磚，色調由兩個索引的二進位表示（5個位元）有幾個位元不同——即漢明距離`popcount(row xor col)`——決定：距離0（對角線）最暗，距離5（兩個索引互為補數）最亮，色調為`0.7·(距離 / 5)^1.6`。32×32格中距離0到5的格數依序為32、160、320、320、160、32（二項式係數的32倍）。因為是二進位的互斥或，表在每個2的冪次重複相同的方塊配置（2、4、8、16個一組），整體像把超立方體展開的碎形方格，沿一條斜線有最亮的磚。琥珀黃的方磚在深梅紫色的縫隙底上；seed讓整張表在環面上平移（移動的格數由seed決定）。這是示意的數論／位元運算表，不模擬任何實物。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；32×32格、5個位元、色調指數1.6、色調（span 0.7、floor 0.14）、琥珀黃與深梅紫及0.5 m nominal tile皆作者設定。調整紀錄：我先試了64×64格、6個位元、色調指數1，實看預覽後覺得方磚太小、色調集中在中間距離，畫面很雜、對比偏低，所以改成32×32格、5個位元、指數1.6（兩個版本都實看了預覽，各看一次）。因為互斥或的對稱，把整張表同時在兩個方向平移16格（半張表）會得到完全相同的表，所以測試中每個seed都有**兩個**符合的環面平移（真實的平移與兩個方向各加16的平移），測試明確檢查剛好是這兩個、且互為加16的關係（半個表的位移是互斥或的對稱，不是兩個獨立解）。測試以獨立寫的位元計數（把`row xor col`轉為二進位字串數1的個數）重建整張色調表，與sampler在每格中心的顏色比對（最大誤差0.0150，來自grain，門檻0.03）。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0177）。

啟動時（每個sampler）建立`Float64Array(1024)`色調表：`tones[row · 32 + col] = 0.7 · (popcount(row xor col) / 5)^1.6`；取樣時每格一個緊緻支撐的圓角方塊kernel（四次超橢圓經smoothstep，在格邊界前恰為零，所以格的查找不會跳變、場為C1），格索引加上由`hash(0, 0, seed ^ 鹽值)`、`hash(1, 0, seed ^ 鹽值)`決定的平移（對32取餘）：color＝`gapTone + (toneFloor + tone − gapTone)·mask + 0.03·(128²細grain − 0.5)`（`gapTone` 0.04、`toneFloor` 0.14）、height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`、roughness固定0.4、AO縫隙處降至0.6、金屬factor為0；保留的cache為`Float64Array(1024)` 8,192 B加`Float64Array(128²)` 131,072 B，共139,264 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。建構只是1,024次位元計數與一個噪聲表，**我沒有量測建構耗時**，取樣是常數次運算，也沒有量測。實測（工具實跑）：每個seed皆有兩個符合的環面平移，seed 0／1／0xffffffff／7分別為(30, 2)與(14, 18)、(10, 13)與(26, 29)、(21, 12)與(5, 28)、(26, 9)與(10, 25)，最大擬合誤差0.01498–0.01499（等於grain最大振幅0.015）；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）恆為10.94%、color 0.02568–0.02574至0.8530–0.8535、平均0.2910–0.2911、roughness恆為0.4、AO最低0.6、height至多0.8401–0.8467 relief；512²取樣（四個seed）亮處恆為13.48%、color 0.02509–0.02529至0.8540–0.8545、平均0.2955、height至多0.8440–0.8475 relief；seed 0與1相比，512²中color>0.5的取樣有24.7%不同，格中心顏色相差超過0.05的格子占77.9%；seed 7的512²maps平均r／g／b約(89.4, 66.1, 56.6)、法線tilt²最大約0.0177、z分量最小254。我實看了預覽：深梅紫上的琥珀黃方磚，斜向有一條最亮的磚帶並有層層重複的方塊結構。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('hammingtable', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`aggregationfrost`（聚集霜）使目前目錄1015→1016種，含plain的gallery為1017項。在96×96的環面上做擴散限制聚集（diffusion-limited aggregation, DLA）：中央的格子是第一個成員，之後的每個粒子從一個隨機的空格出發，每步隨機走向上下左右四個鄰格之一（環繞），一旦與團簇的某個成員共用一邊就黏住；共900個粒子（中央加899個隨機行走者），形成像霜花或樹枝的碎形枝狀團簇。每個粒子依黏上的先後順序有一個「年齡」，色調從中央（最老）向枝端漸暗；呈冰藍色細枝在深藍黑底上，團簇獨立一塊（不與相鄰拼貼相連，因為最遠的枝離中央只有約37–44格，而環面半寬為48格）。seed決定每個粒子的出發點與每步方向，所以每個seed的枝狀圖案完全不同。這是示意的模擬結果，不是對真實結霜或電擊紋的模擬。目錄中另有名稱相近的`dendriticfrost`與`frost`，那些是不同的材質，與這個模擬式聚集無關。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；900個粒子、96×96大小、60,000步的單次行走上限、tanh銳利度8、色調（線0.72、年齡下限0.3）、冰藍與深藍黑色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。我先用一個獨立的小原型（64×64、520個粒子，只用來確認方法與速度）確認DLA可行，再調整為96×96與900個粒子。我沒有檢查是否有任何行走達到60,000步的上限（若發生會放棄並重新出發），也沒有檢查團簇的碎形維數是否符合DLA的文獻值，所以不聲稱它是「標準DLA」，只是這個演算法的一個實作結果。測試無法獨立重現隨機行走（雜湊亂數是sampler內部的），所以我**沒有獨立重寫聚集演算法**：測試從節點顏色反推被佔據的格，以獨立的廣度優先搜尋檢查團簇連通且恰好有900個格、顏色隨與中央的圖距離增加而下降（相關係數低於−0.6），**這證明團簇確實是連通的樹狀結構、年齡色調的方向正確，但不證明隨機行走本身是均勻的**。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0377）。第一次嘗試產生測試的腳本因為一個期望字串不符（滲流測試的height下限是0.98而非0.99）中途失敗，沒有寫入任何檔案，修正後重跑。

啟動時（每個sampler）把中央格`(48, 48)`設為團簇的第一個成員（色調1），然後對每個粒子`particle = 1 … 899`重複：以`hash(particle, attempt, seed ^ 鹽值)`決定出發的格（若該格已被佔據就換下一個attempt），最多走60,000步，每步若與團簇共邊（四個鄰格中有被佔據者）就黏住（標記為佔據、色調`1 − particle / 900`），否則以`hash(particle × 65537 + attempt, step, seed ^ (鹽值 + 3))`決定四個方向之一前進（環繞）；取樣時以`latticeField`（C1 smoothstep）混合佔據圖並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化，另一個`latticeField`混合年齡色調圖：顏色＝`0.05 + 0.72·line·(0.3 + 0.7·年齡) + 0.03·(128²細grain − 0.5)`、height ＝ `0.8·line·(0.7 + 0.3·年齡) + 0.2·grain`、線處roughness降低0.2（底0.4）、AO恆為1、金屬factor為0；保留的cache為兩個`Float64Array(9216)`（佔據與年齡）加`Float64Array(128²)`，共278,528 B，另有建構時的`Uint8Array(9216)`佔據表，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個sampler的建構在bun中量到約150 ms（第一次）、135 ms、126 ms、130 ms（四個seed各一次），是單次量測、不是benchmark；取樣本身只做常數次運算，我沒有量測。實測（工具實跑）於seed 0／1／0xffffffff／7：900個格被佔據，且四個seed都能從中央經四鄰邊走到全部900個格（團簇連通）；團簇中的最大圖距離59／62／51／59；離中央最遠的格（環面最短距離）41.1／40.5／36.9／44.0格；被佔據節點的顏色0.2564–0.7794、空節點最亮0.0651、中央節點0.7561–0.7733；圖距離與顏色的相關係數−0.7945／−0.7536／−0.8800／−0.8088；256²取樣下亮處（color>0.5）占3.95%–4.06%、color 0.0356–0.0358至0.7725–0.7758、平均0.0922–0.0925、roughness 0.2001–0.3999、AO恆為1、height至多0.9697–0.9848 relief；512²取樣亮處占3.97%–4.05%、color 0.0352–0.0353至0.7734–0.7779、平均0.0922–0.0925、height至多0.9795–0.9870 relief；seed 0與1的佔據格有14.8%位置不同；seed 7的512²maps平均r／g／b約(23.0, 31.2, 45.3)、法線tilt²最大約0.0377、z分量最小253。我實看了預覽（seed 7）：深藍黑底上冰藍色的霜花狀樹枝，每塊拼貼一朵，近中央較亮、枝端較暗。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('aggregationfrost', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`cyclicwaves`（循環波）使目前目錄1014→1015種，含plain的gallery為1016項。在96×96環面上執行八狀態的循環細胞自動機（cyclic cellular automaton）：每格有0到7的狀態，隨機起始；每個同步步驟中，狀態為k的格子若上下左右（馮紐曼鄰域，環繞）四個鄰居中至少有一個已經是狀態`k + 1`（7之後回到0），就前進到`k + 1`，否則維持原狀；執行150步。結果是一圈圈循序相接的波（每個狀態緊接著前一個），在隨機起始中局部有序的地方形成螺旋與迷宮狀的波紋；狀態0到7對應由暗靛藍到琥珀黃的八階色調，波前呈現短短的由亮到暗的陡坡。八個狀態的格數各約占一個等份（四個seed每個狀態占11.96%–13.19%），相鄰格相差不超過一個狀態的比例約97%（隨機起始只有37.5%）。seed決定起始狀態，所以每個seed的波紋完全不同。這是示意的自動機快照，不是對化學波或任何實物的模擬。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；8個狀態、馮紐曼鄰域、閾值1、150步、96×96大小、色調（span 0.72）、靛藍與琥珀黃色調及0.5 m nominal tile皆作者設定。調整紀錄：我先用一個獨立的小原型試了幾組規則（摩爾鄰域閾值2或3等）：摩爾鄰域搭配閾值2或3、100步後相鄰相差≤1個狀態的比例只有0.18–0.68（8狀態閾值2為0.684、閾值3為0.371；12狀態閾值3為0.242；16狀態閾值3為0.182；10狀態閾值2為0.344），摩爾鄰域閾值1（6、8、10、12個狀態、150到250步）為0.74–0.88，馮紐曼鄰域閾值1則為0.95–0.98（5個狀態0.952、8個狀態0.976），所以選了8個狀態的馮紐曼鄰域；每組都只用同一個種子跑一次，是粗略的比較；這個原型的隨機數與sampler的雜湊不同，只用來挑規則。預覽只看了一版。測試無法獨立重現動力學（雜湊亂數是sampler內部的），所以我**沒有獨立重寫細胞自動機的更新規則**：測試從sampler輸出的節點顏色反推每格的狀態（取最近的八階色調之一），檢查顏色落在八階色調上，並檢查統計量（約97%的相鄰格相差不超過一個狀態、每個格子都有一個鄰居的狀態比自己多1或少1、八個狀態的占比各在11.5%–14%之間），**這證明結果不是隨機雜訊、各狀態都有出現、且上色邏輯正確，但不證明更新規則本身正確**。我在測試註解初稿中把隨機起始時相鄰格相差不超過一個狀態的比例寫成「約四分之一」，這是錯的（8個狀態時應為3/8 = 37.5%），commit前已更正。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0120）。

啟動時（每個sampler）以`floor(hash(x, y, seed ^ 鹽值) · 8)`決定每格的初始狀態，然後做150個同步步驟：每格若四個（環繞的）鄰居中任何一個的狀態等於`(自己 + 1) mod 8`，就進到該後繼狀態，否則維持，並交換新舊兩個`Uint8Array(9216)`；之後把每格的色調設為`狀態 / 7`；取樣時以`latticeField`（C1 smoothstep）混合色調圖：顏色＝`0.05 + 0.72·色調 + 0.03·(128²細grain − 0.5)`、height ＝ `0.8·色調 + 0.2·grain`、roughness固定0.4、AO恆為1、金屬factor為0；保留的cache為`Float64Array(9216)` 73,728 B加`Float64Array(128²)` 131,072 B，共204,800 B，另有建構時的兩個`Uint8Array(9216)`暫存，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個sampler的建構（150步）在bun中量到約78 ms（第一次）、39 ms、44 ms、40 ms（四個seed各一次），是單次量測、不是benchmark；取樣本身只做常數次運算，我沒有量測。實測（工具實跑）於seed 0／1／0xffffffff／7：96×96個node（取樣在node上）中每個狀態的格數為1,102–1,216（占11.96%–13.19%）；相鄰格相差不超過一個狀態的比例0.9779／0.9746／0.9782／0.9715；每個格子都至少有一個鄰居的狀態比自己多1或少1（四個seed皆為全部9,216格）；9,216個節點的顏色與八階色調一致，最大誤差0.0150以內（誤差來自grain；測試判定門檻為0.03）；256²取樣下亮處（color>0.5）占35.93%–37.11%、color 0.0378–0.0398至0.7800–0.7816、平均0.4049–0.4120、roughness恆為0.4、AO恆為1、height至多0.9792–0.9899 relief；512²取樣亮處占36.22%–37.50%、color 0.0366–0.0389至0.7818–0.7831、平均0.4049–0.4120、height至多0.9862–0.9884 relief；seed 0與1相比，狀態≥4的格子有49.3%位置不同、color>0.5的節點有46.5%不同；seed 7的512²maps平均r／g／b約(109.8, 93.9, 67.8)、法線tilt²最大約0.0120、z分量最小254。我實看了預覽（seed 7）：靛藍與琥珀黃的螺旋與迷宮狀波紋，波前呈短短的漸層。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('cyclicwaves', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`isingdomains`（伊辛域）使目前目錄1013→1014種，含plain的gallery為1015項。對64×64環面上的二維伊辛模型（Ising model）做Metropolis動力學的快照：每格是向上或向下的自旋，隨機起始，在溫度2.35（耦合常數與波茲曼常數取1；二維伊辛模型的臨界溫度約2.269，這是標準值、我沒有在此驗證）下以棋盤順序進行150個掃描，每次翻轉若使能量變化dE，當`dE ≤ 0`或雜湊產生的均勻亂數小於`exp(−dE/溫度)`時接受；結果是同向自旋聚成的磁區（domain）：向上為亮色、向下為暗色，並以「四個鄰居中與自己同向的比例」輕微染色，讓磁區邊界較暗，呈萊姆綠的迷彩狀圖案。四個seed的向上自旋比例在24.3%到55.3%之間，與鄰格相同的比例約79%–83%（隨機起始時為50%）。seed決定起始組態與每步的亂數，所以每個seed的圖案完全不同。這是示意的模型快照，不是對磁性材料的模擬或量測，也不保證已達平衡。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；溫度2.35、150個掃描、tanh銳利度8、色調（自旋0.6、同向0.12）、萊姆綠與暗綠色調及0.5 m nominal tile皆作者設定（預覽只看了一版，預覽中的圖案因偏向多數自旋而以暗色為主）。測試無法獨立重現動力學（雜湊亂數序列是sampler內部的），所以我**沒有獨立重寫Metropolis更新**：測試從sampler輸出的節點顏色反推自旋，檢查顏色與（自旋、同向鄰居數）一致，並檢查統計量（相鄰同向比例約0.78–0.84，而不是隨機起始的0.5；同向區域數100–150；最大區域大於1,800格；向上比例在0.2到0.6之間），**這證明結果不是隨機雜訊、且上色邏輯正確，但不證明它是正確的Metropolis取樣，也沒有驗證平衡狀態**。測試中途有一次失敗：我從滲流團簇的測試複製了roughness檢查（期望線處降到約0.2），但此材質的roughness固定為0.4，失敗的是複製過來的期望值；我之前在沙堆單位元已遇過同樣的問題，這次還是漏改，改為檢查roughness等於preset值後通過。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0244）。

啟動時（每個sampler）以`hash(x, y, seed ^ 鹽值) < 0.5`決定初始自旋（±1），然後做150個掃描，每個掃描分兩個半掃描（棋盤的兩種奇偶，同一奇偶的格子彼此不相鄰、可獨立更新），對每個格子算鄰居（環繞）自旋和`around`、能量變化`dE = 2·自旋·around`，當`dE ≤ 0`或`hash(格子, 掃描 × 2 + 奇偶, seed ^ 鹽值 + 2) < exp(−dE / 2.35)`時翻轉；之後記下每格是否向上（`marks`）與四個鄰居中與自己同向的比例（`agree`）；取樣時以`latticeField`（C1 smoothstep）混合向上圖並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化，另一個`latticeField`混合同向比例圖：顏色＝`0.05 + 0.6·line + 0.12·agree + 0.03·(128²細grain − 0.5)`、height ＝ `0.7·line + 0.1·agree + 0.2·grain`、roughness固定0.4、AO恆為1、金屬factor為0；保留的cache為兩個`Float64Array(4096)`（向上圖與同向比例）加`Float64Array(128²)`，共196,608 B，另有4,096 B的`Int8Array`自旋。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個sampler的建構（150個掃描）在bun中量到約102 ms（第一次）、64 ms、65 ms、65 ms（四個seed各一次），是單次量測、不是benchmark；取樣本身只做常數次運算，我沒有量測。實測（工具實跑）於seed 0／1／0xffffffff／7：向上自旋比例55.3%／24.3%／52.4%／32.5%；相鄰同向比例0.8164／0.8296／0.8115／0.7908；四連通同向區域109／144／133／127個、最大區域2,153／3,058／1,863／2,683格、第二大1,590／573／1,834／619格；4,096個節點的顏色與測試中獨立的模型（自旋與同向鄰居數）一致，最大誤差0.0150以內（誤差來自grain；測試判定門檻為0.03）；256²取樣下亮處（color>0.4）占55.39%／23.71%／52.35%／32.05%、color 0.0415–0.0441至0.7830–0.7843、平均0.2931–0.4803（隨seed而異）、roughness恆為0.4、AO恆為1、height至多0.9895–0.9962 relief；512²取樣亮處占55.37%／23.85%／52.35%／32.17%、color 0.0370–0.0388至0.7839–0.7846、平均0.2929–0.4803、height至多0.9956–0.9983 relief；seed 0與1的向上自旋有54.0%位置不同；seed 7的512²maps平均r／g／b約(77.6, 100.8, 36.4)、法線tilt²最大約0.0244、z分量最小253。我實看了預覽（seed 7）：暗綠底上萊姆綠的磁區，邊緣呈像素化的圓角，有許多孤立的小點。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('isingdomains', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`percolationclusters`（滲流團簇）使目前目錄1012→1013種，含plain的gallery為1014項。在64×64的環面上做臨界點位滲流（site percolation）：每個格子以雜湊決定是否被佔據，佔據機率取0.5927（這是我所知的正方格點位滲流臨界機率的標準值，我沒有在此驗證）；上下左右相鄰（環繞）的佔據格連成一個團簇，用union-find找出；每個被佔據的格依「所屬團簇大小的對數 / 最大團簇大小的對數」上色（最大團簇最亮、單獨一格的最暗但仍亮於空格），空格是暗色底，呈硫磺黃色的迷彩狀圖案。實際佔據格比例因隨機波動略低於目標（四個seed共2,358–2,414格，占57.6%–58.9%）。seed決定哪些格被佔據，所以每個seed的圖案完全不同。這是示意的隨機圖案，不是對真實滲流現象的模擬或量測。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；佔據機率0.5927、tanh銳利度8、色調（線0.72、色調下限0.3）、硫磺黃與暗橄欖色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。測試先量錯了一個門檻：我第一版測試的亮區占比範圍是用「color > 0.3」的探針數字寫的，而測試用「color > 0.5」，所以第一次測試失敗（0.4475 < 0.55）；改用`color > 0.5`量得的範圍（256²取樣44.75%–48.62%）後通過；之後平均值範圍又因為我只算了三個seed而漏掉seed 7（0.3844）失敗一次，放寬為0.38後通過。這兩次都是我測試期望值的錯誤，不是sampler的問題。這個材質的團簇標記由測試從sampler輸出的節點顏色反推佔據格，再以獨立的洪水填充演算法重新標記團簇並計算預期顏色，所以驗證的是團簇邏輯（含環面環繞），**並不驗證雜湊決定的佔據格本身**。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0260）。

啟動時對`64 × 64`的每格以`hash(x, y, seed ^ 鹽值) < 0.5927`決定是否佔據，對每個佔據格把它與右邊與下面（環繞）的佔據格以union-find（路徑壓縮）合併，統計每個團簇的大小，`largest`為最大團簇大小（至少2），佔據格的標記設為1、色調為`ln(團簇大小) / ln(largest)`；取樣時以`latticeField`（C1 smoothstep）混合佔據圖並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化，另一個`latticeField`混合色調圖：顏色＝`0.05 + 0.72·line·(0.3 + 0.7·tone) + 0.03·(128²細grain − 0.5)`、height ＝ `0.8·line·(0.7 + 0.3·tone) + 0.2·grain`、線處roughness降低0.2（底0.4）、AO恆為1、金屬factor為0；保留的cache為兩個`Float64Array(4096)`（佔據與色調）加`Float64Array(128²)`，共196,608 B，另有建構時的暫存陣列（佔據4,096 B、父節點16,384 B、團簇大小16,384 B），皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個取樣點只做常數次運算，我沒有量測耗時。實測（工具實跑）於seed 0／1／0xffffffff／7：獨立洪水填充演算法得到的結果——佔據格2,358／2,414／2,391／2,408個、團簇105–138個、最大團簇1,212–1,846格、第二大72–639格、單獨一格的團簇66–78個、最大團簇涵蓋全部64列（四個seed）與全部64欄（三個seed，seed 1為50欄）；4,096個節點的顏色與獨立模型一致，最大誤差0.0150以內（誤差來自grain；測試判定門檻為0.03）；256²取樣下亮處（color>0.5）占44.75%–48.62%、color 0.0357–0.0360至0.7837–0.7842、平均0.3844–0.3984、roughness 0.2001–0.3999、AO恆為1、height至多0.9929–0.9962 relief；512²取樣亮處占40.83%–44.44%、color 0.0352–0.0354至0.7844–0.7846、平均0.3840–0.3979、height至多0.9974–0.9988 relief；seed 0與1的佔據格有49.5%的位置不同；seed 7的512²maps平均r／g／b約(112.7, 107.6, 48.5)、法線tilt²最大約0.0260、z分量最小253。我實看了預覽（seed 7）：暗橄欖色底上硫磺黃色的迷彩狀圖案，大團簇呈亮黃、小團簇較暗。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('percolationclusters', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`voronoifacets`（Voronoi切面）使目前目錄1011→1012種，含plain的gallery為1013項。與`voronoicells`相同的Voronoi板塊（8×8格各一個抖動位置點、軟權重分區、64塊板塊與深色細縫），但每塊板塊不是單一色調，而是沿一個隨機方向的線性漸層（切面狀）：每個位置點有各自的色調與漸層方向／大小（每格寬至多±0.35的色調變化），板塊內的色調從一側較暗漸變到另一側較亮，像是翡翠或寶石的切面；呈翡翠綠，縫仍是深色、粗糙（roughness升高0.4）、被AO加深。seed決定位置點、色調與漸層。這是示意的切面寶石外觀，不是真實的礦物，沒有對照任何實物。與`voronoicells`、`voronoipillows`共用同一個sampler分支，新增漸層欄位；已知缺點同voronoicells：銳角交會處有模糊污點。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；漸層強度0.35、色調（板塊0.7、色調下限0.3）、roughness底0.3、縫的roughness增量0.4、relief 0.0012、翡翠綠色調與0.4 m nominal tile皆作者設定（預覽只看了一版）。為了共用分支，我在`voronoicells`與`voronoipillows`的preset新增了欄位`facet: 0`；漸層項在facet為0時加上0（數值不變），且只有facet不為0時才對色調做`smoothstep(clamp())`，所以它們的行為不變，兩者的測試（各8個測試案例）仍通過；我沒有另外逐位比對修改前後的輸出，只靠這些測試。已知缺點與voronoicells相同（模糊污點、沒有獨立重寫位置點的模型、測試只檢查可觀測行為）。錯誤紀錄：我寫的第一版測試斷言「每塊板塊的色彩差距都大於0.2」，4個seed全部失敗（實測最小的板塊差距只有0.083）；我當時只量過全體的最大差距（0.31–0.36）而沒有量分布，之後量得各板塊差距的最小值約0.029–0.036、中位數0.135–0.175、平均0.141–0.168，改為斷言平均差距在0.13到0.18之間、最大差距大於0.28、每塊小於0.4後通過；這是我測試期望的錯誤，不是sampler的問題。

沿用voronoicells的sampler（現在同時服務`voronoicells`、`voronoipillows`與`voronoifacets`）：啟動時每格額外以內部雜湊算出漸層`gradientX = 0.35·2·(hash − 0.5)`與`gradientY`（以兩個不同的seed鹽值）；取樣時在5×5鄰近格的25個位置點上，除了權重`w_i = exp(−(d_i − d_min)/0.02)`之外，記下取樣點到位置點的位移`(fromX, fromY)`，色調為`Σ w_i·(tone_i + gradientX_i·fromX_i + gradientY_i·fromY_i) / Σ w_i`，再以`smoothstep(clamp(色調))`限制在[0, 1]；邊界量（吉尼不純度）、顏色、height等其餘與voronoicells相同：顏色＝`0.05 + 0.7·(0.3 + 0.7·色調)·(1 − edge) + 0.02·edge + 0.02·(128²細grain − 0.5)`、height ＝ `0.8·(1 − edge)·(0.8 + 0.2·色調) + 0.06·grain`、`roughness = 0.3 + 0.4·edge`、`occlusion = 1 − 0.45·edge`、金屬factor為0；cache合計五個`Float64Array(64)`、四個`Float64Array(25)`、一個`Int32Array(25)`加`Float64Array(128²)`，共134,432 B加100 B，皆為lattice算術預算（非總RAM）。預設0.4 m nominal tile與0.0012 UV-relative relief（非公尺位移）。每個取樣點約25次距離與指數運算，我沒有量測此材質的耗時。實測（工具實跑）：四個seed（0／1／0xffffffff／7）在512²取樣下，把occlusion大於0.97的像素以4連通（環繞）分區，每個seed恰好64個區域；區域大小最小1,325–1,739像素、最大4,681–5,242像素；各板塊內色彩差距（最大減最小）的平均為0.141–0.168、中位數0.135–0.175、最小0.029–0.036、最大0.307–0.356（平板的voronoicells最大只有0.0654，來自grain）；各區域平均色彩最暗0.2595–0.2609、最亮0.7445–0.7469；內部像素占74.54%–75.93%；256²取樣（seed 0／1／0xffffffff／7）color 0.0619–0.0626至0.7589–0.7592、平均0.4211–0.4377（隨seed而異）、roughness 0.3至約0.6997、AO最低0.5503–0.5504、height至多0.8569–0.8583 relief；512²取樣（四個seed）color 0.0610–0.0617至0.7595–0.7597、平均0.4211–0.4377、height至多0.8588–0.8592 relief；seed 0與1的內部遮罩（512²）有36.3%像素不同；二階差分C1掃描（seed 0，含格線與16,384個黃金比例點）沒有任何點超過0.03；seed 7的512²maps平均r／g／b約(67.9, 125.1, 105.3)、法線tilt²最大約0.0468、z分量最小252。我實看了預覽（seed 7）：翡翠綠的多邊形板塊，每塊有由一側向另一側的明暗漸層，被深色細縫隔開，只在少數銳角交會處有模糊污點。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('voronoifacets', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`multiplicativeorder`（乘法階表）使目前目錄1010→1011種，含plain的gallery為1012項。48×48個方格，格(col, row)代表模`n = row + 2`（2到49）下的剩餘`a = col + 1`（1到48）：若a與n有公因數，a沒有乘法階，該格塗成最暗的色調（共887格）；否則以乘法階`ord_n(a)`（使`a^k ≡ 1 (mod n)`的最小正整數k）除以`φ(n)`（與n互質的剩餘個數）上色，再取1.5次方：比值1代表a是模n的原根（共406格，只有n為2、4、質數的冪或2倍質數的冪時才存在，這是標準的數論事實，我沒有在測試中驗證），階為1的格子（a ≡ 1）共189格，最大的階是46（模質數47的原根）。呈現冰藍色在深藏青底上，亮格像是不規則散布的點與短線。方格是帶圓角的拉升方塊，隨高度與AO顯示間隙，seed把整張表在環面上平移。與`totienttable`、`divisorcount`等數論表共用相同的方格形狀（沿用Mandelbrot方塊的「內部」色調處理沒有乘法階的格子）。這只是前48×48個剩餘的乘法階比值表示，不是證明或圖解任何數論定理。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；toneExponent 1.5、toneFloor 0.14、toneSpan 0.7、insideTone 0.02、冰藍與深藏青色調及0.3 m nominal tile皆作者設定（預覽只看了一版）。我沒有檢查a ≥ n時的剩餘（a mod n）是否會讓表有明顯的週期性重複（例如n = 2、3等小模數的列是週期性的），這是這個取值方式的特性。方格形狀與色調組合沿用totienttable的參數。測試一次通過，無需調整區間；沒有乘法階的格子數（887）、原根格數（406）、階為1的格數（189）與最大階46是測試中用獨立的重複乘法與互質計數算出的值，並非與原理論值比對。

啟動時對每格（`n = row + 2`、`a = col + 1`）檢查`gcd(a, n)`：不為1則記為`−1`（沒有乘法階），否則以重複乘法求乘法階（`power = a % n`起，反覆乘以`a % n`取模直到回到1，次數即階），再以互質計數得`φ(n)`，色調為`(階 / φ(n))^1.5`；取樣時每個方格用一個緊緻支撐的圓角方塊核（四次超橢圓經smoothstep，在方格邊界之前就恰好為零，所以方格查找不會跳動，場為C1）：色調`tone ≥ 0`時顏色＝`0.04 + (0.14 + 0.7·tone − 0.04)·遮罩 + 0.03·(128²細grain − 0.5)`，`tone < 0`時用`0.02`取代`0.14 + 0.7·tone`；height ＝ `0.8·dome·(0.88 + 0.12·tone)`（沒有階的格用0.5取代括號內的值）`+ 0.08·grain`、`occlusion = 1 − 0.4·(1 − 遮罩)`、roughness固定0.4、金屬factor為0；cache合計`Float64Array(2304)` 18,432 B加`Float64Array(128²)` 131,072 B，共149,504 B，皆為lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個取樣點只做常數次運算，我沒有量測耗時。實測（工具實跑）：2304格中沒有乘法階的有887格、原根格406個、階為1的189個、最大階46；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）占12.50%–12.64%、color 0.0055–0.0058至0.8541–0.8544、平均0.2146–0.2153、AO最低0.6、height至多0.8753–0.8768 relief；512²取樣（seed 0／1／0xffffffff／7）亮處占12.47%–12.74%、color 0.0052–0.0054至0.8545–0.8547、平均0.2142–0.2163、height至多0.8772–0.8784 relief；每個seed恰好有一種環面平移（seed 0為(28, 20)、1為(38, 22)、0xffffffff為(20, 37)、7為(37, 9)）能使2304格中心的顏色與測試中獨立重寫的色調一致，最大誤差0.0150以內（誤差來自grain；測試判定門檻為0.03）；seed 0與1相比，有59.9%的格子中心色差大於0.05，亮區遮罩（512²）有20.4%像素不同；seed 7的512²maps平均r／g／b約(45.4, 59.2, 78.2)、法線tilt²最大約0.0300、z分量最小253。我實看了預覽（seed 7）：深藏青底上冰藍色的圓角方格散布成不規則的點與短線圖案，有幾列呈現規則的重複。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('multiplicativeorder', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`sandpileidentity`（沙堆單位元）使目前目錄1009→1010種，含plain的gallery為1011項。畫出64×64格的阿貝爾沙堆群（abelian sandpile group）的單位元：每格放一堆沙，滿4粒就倒塌、給上下左右四個鄰居各1粒，邊界格掉出去的沙進入「沙漏」消失；單位元由Dhar的方法得到：把每格都放3粒的最大穩定組態的兩倍（每格6粒）穩定化、用6減去結果得到餘量、再穩定化一次。結果是一個高度（0到3粒）的圖案：396格為0、152格為1、1,476格為2、2,072格為3，左右、上下與對角（轉置）都對稱，呈現華麗的曼陀羅般花紋；用4個高度等級對應金色的深淺（0最暗、3最亮），邊緣與平坦的方塊區域是單位元的特徵。seed只把整個64×64圖案沿環面平移；因為單位元本身不是週期的（邊界是沙漏），拼貼時會看到圖案邊界形成的方框接縫。這只是這個數學物件的視覺化，不是真正的沙堆。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；64×64的大小、tanh銳利度8、色調（span 0.72）、金色與暗褐色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。我沒有查證Dhar的單位元公式的原始文獻，公式（兩倍最大組態穩定化後相減再穩定化）是依我的了解寫成，並在測試中用「`e + e`穩定化後仍等於`e`」這個單位元的必要性質以及獨立的掃描式倒塌演算法（與sampler用的堆疊式演算法不同）驗證，而不是只靠公式本身；**這只證明結果是這個群中滿足`e + e = e`的元素，我沒有另外驗證它對所有可復現組態都是單位元**。拼貼接縫是設計上的結果，我沒有嘗試把它隱藏。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0297）。測試中途有一次失敗：我從T方塊碎形的測試複製了roughness的檢查（期望線處roughness降到約0.2），但這個材質的roughness固定為0.4，所以失敗的是複製過來的期望值，不是sampler；我改為檢查roughness恆等於preset值後通過。

啟動時（每個process只算一次、以大小為鍵快取，所有seed與sampler共用）在`64 × 64`的格上對全為6的組態做穩定化（用堆疊逐一處理高度≥4的格：`toppled = floor(高度/4)`，該格減`4·toppled`、四個存在的鄰居各加`toppled`，邊界外的沙消失），用6減去結果，再穩定化一次，得到`Uint8Array(4096)`的單位元（我的計時腳本中第一次穩定化共2,323,784次倒塌、第二次881,488次，整段在bun中約69 ms，是單次量測、不是benchmark）；每個sampler依高度門檻1、2、3各建一個`Float64Array(4096)`（高度 ≥ 門檻則為1，依seed的環面平移），取樣時各以`latticeField`（C1 smoothstep）混合並以`0.5 + 0.5·tanh(8·(field − 0.5))`重新銳化，三者相加除以3為色調：顏色＝`0.05 + 0.72·色調 + 0.03·(128²細grain − 0.5)`、height ＝ `0.8·色調 + 0.2·grain`、roughness固定0.4、AO恆為1、金屬factor為0；每個sampler的cache為3×4,096 + 128² = 28,672個Float64／229,376 B，另有共用的4,096 B單位元，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個取樣點只做常數次運算，我沒有量測取樣的耗時。實測（工具實跑）：測試中以獨立掃描式演算法算出的單位元高度分布為0／1／2／3各396／152／1,476／2,072格，左右、上下、轉置皆對稱，且`e + e`穩定化後等於`e`；於seed 0／1／0xffffffff／7：256²取樣下亮處（color>0.5）占86.28%–86.31%（seed 0／1／0xffffffff）、color 0.0364–0.0374至0.7840–0.7844、平均0.6030–0.6031、roughness恆為0.4、AO恆為1、height至多0.9950–0.9973 relief；512²取樣亮處占85.87%–85.88%、color 0.0356–0.0358至0.7846–0.7847、平均0.6034–0.6036、height至多0.9984–0.9991 relief；每個seed的64×64個node（取樣在node上）恰好有一種環面平移（seed 0為(52, 10)、1為(14, 48)、0xffffffff為(9, 46)、7為(6, 37)）使4,096個node的顏色與獨立模型一致，最大誤差0.0150以內（等於grain的最大振幅0.03×0.5，測試判定門檻為0.03）、亮node（高度2或3）數皆為3,548（= 1,476 + 2,072）；seed 0與1的亮node有23.3%不同；seed 7的512²maps平均r／g／b約(165.0, 143.7, 93.7)、法線tilt²最大約0.0297、z分量最小253。我實看了預覽（seed 7）：金黃色底上深色的點陣與曼陀羅般的花紋，與較大的平坦方塊區域。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('sandpileidentity', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`voronoipillows`（Voronoi枕塊）使目前目錄1008→1009種，含plain的gallery為1010項。與`voronoicells`相同的Voronoi板塊（8×8格各一個抖動位置點、軟權重分區、64塊板塊與深色細縫），但每塊板塊的高度是隆起的圓頂（枕頭狀）：高度隨「到加權平均位置點的距離」平滑下降，板塊中央最高、靠近縫處降到底；顏色是赤陶土色（每塊板塊有各自的亂數深淺），縫仍是深色、粗糙、被AO加深。seed決定位置點與色調。這是示意的陶磚／枕塊外觀，不是真實的陶土，沒有對照任何實物。與`voronoicells`共用同一個sampler分支，只有preset不同，並新增圓頂欄位。已知缺點同voronoicells：銳角交會處有模糊污點。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；圓頂半徑0.55格、圓頂高度0.5、板塊基礎高度0.4、roughness 0.45、relief 0.0016、赤陶土色調與0.4 m nominal tile皆作者設定（預覽只看了一版，而預覽只顯示底色，看不出圓頂，所以圓頂以探針與測試的高度統計驗證，**我沒有看到實際打光的3D外觀**）。為了共用分支，我在`voronoicells`的preset新增了欄位`domeRadius: 0.55`與`domeHeight: 0`（圓頂高度0使其行為與數值不變，它的8個測試案例仍通過）。已知缺點與voronoicells相同（模糊污點、沒有獨立重寫位置點的模型、測試只檢查可觀測行為）。測試一次通過，無需調整區間。

沿用voronoicells的sampler（現在同時服務`voronoicells`與`voronoipillows`）：在5×5鄰近格的25個位置點上算出權重`w_i = exp(−(d_i − d_min)/0.02)`後，除了色調加權平均與吉尼不純度（邊界量）之外，再算加權平均距離`Σw_i·d_i / Σw_i`（平滑，因為是歸一化權重的平滑函數），圓頂項為`domeHeight·(1 − edge)·smoothstep(clamp(1 − 平均距離/0.55))`；height ＝ `0.4·(1 − edge)·(0.8 + 0.2·色調) + 0.5·(1 − edge)·圓頂 + 0.08·grain`（最大約0.98，不超過1）；其餘與voronoicells相同：顏色＝`0.06 + 0.62·(0.35 + 0.65·色調)·(1 − edge) + 0.02·edge + 0.03·(128²細grain − 0.5)`、`roughness = 0.45 + 0.3·edge`、`occlusion = 1 − 0.45·edge`、金屬factor為0，cache同voronoicells（133,008 B加100 B）。預設0.4 m nominal tile與0.0016 UV-relative relief（非公尺位移）。每個取樣點約25次距離與指數運算，我沒有量測此材質的耗時。實測（工具實跑）：四個seed（0／1／0xffffffff／7）在512²取樣下，把occlusion大於0.97的像素以4連通（環繞）分區，每個seed恰好64個區域；區域大小最小1,326–1,850像素、最大4,559–4,956像素；區域內色彩最大差距不超過0.0687；各區域平均色彩最暗0.2770–0.2825、最亮0.6731–0.6768；內部像素占74.27%–75.37%；每塊板塊內部的高度差（最大減最小，以relief為單位）為0.5297–0.5966（約半個relief，平板只有grain的差異），每塊板塊的峰值高度0.8482–0.9677 relief；256²取樣（seed 0／1／0xffffffff）color 0.0674–0.0689至0.6880–0.6915、平均0.4115–0.4312、roughness 0.45至0.7497–0.7498、AO最低0.5503–0.5504、height至多0.9585–0.9625 relief；512²取樣（四個seed）color 0.0667–0.0676至0.6894–0.6941、平均0.4115–0.4312、height至多0.9646–0.9677 relief；seed 0與1的內部遮罩（512²）有35.8%像素不同；seed 7的512²maps平均r／g／b約(116.4, 78.6, 59.4)、法線tilt²最大約0.0820、z分量最小250。我實看了預覽（seed 7，只有底色）：赤陶土色的多邊形板塊與深色細縫，只在少數銳角交會處有模糊污點。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('voronoipillows', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`voronoicells`（Voronoi細胞）使目前目錄1007→1008種，含plain的gallery為1009項。這是引擎第一個Voronoi（最近點）家族的材質：在8×8格的週期網格上每格放一個抖動的位置點（site，離格中心至多±0.4格），共64個位置點，每個點有一個亂數色調；整張貼圖依「最近的位置點」分成64塊多邊形板塊，每塊板塊一個色調（藍灰色，由暗到亮），板塊之間是深色的細縫（較粗糙、被AO加深、高度較低）。邊界用軟權重（見技術細節）而非硬性的最近點查找，因此場是平滑（C1）的，縫的寬度是固定的小量。seed只決定位置點與色調（每個seed的板塊排列都不同）。這是示意的石板／馬賽克外觀，不是真實的石材，板塊的亮暗是亂數、沒有對照任何真實石頭。已知的缺點：在邊緣以非常尖的角度交會的地方，縫會變成一小片模糊的三角形污點（預覽中可見幾處）。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；8×8格、抖動0.8、軟度0.02、edgeGain 10、色調（板塊0.62、色調下限0.35、縫0.02）、藍灰色調、relief 0.0012及0.4 m nominal tile皆作者設定。調整與錯誤紀錄：(1)第一版軟度0.04、edgeGain 6，預覽看到多處模糊的污點，改為軟度0.02、edgeGain 10後污點變小但沒有消失（共看了3張預覽，其中後兩張在整理程式碼後逐位元組相同）。(2)第一版使用3×3的鄰近格視窗，C1測試失敗（二階差分比332.8）：我用探針逐點掃描（seed 0），有213個（點、軸、通道）組合超過0.03；原因是點穿過格邊界時視窗換邊，掉出視窗的位置點與最近距離之差有時只有約0.1格寬，權重不可忽略，造成斜率跳動；改成5×5視窗後同一個掃描為0個超標，統計數字與修正前逐位相同（到1e-15）。測試通過是在改成5×5之後。(3)這個材質我沒有獨立重寫位置點的模型：位置點由內部雜湊決定，測試只檢查可觀測的行為（64個板塊、每塊一個色調、縫的特性、C1、週期），**沒有比對位置點座標**。

啟動時在8×8的週期網格上對每格以內部雜湊（三個不同的seed鹽值）算出位置點的x、y偏移（`0.8·(hash − 0.5)`格寬）與色調（`hash`）；取樣時對取樣點所在格周圍的5×5格（共25個位置點，位置用展開座標，格索引取模）算出距離`d_i`與最近距離`d_min`，權重`w_i = exp(−(d_i − d_min) / 0.02)`（用最近距離平移只是避免數值下溢，歸一化後不影響結果），色調取加權平均、邊界量取吉尼不純度`1 − Σ(w_i / Σw)²`（格內為0、兩板塊交界為1/2）、`edge = 1 − exp(−10·不純度)`：顏色＝`0.06 + 0.62·(0.35 + 0.65·色調)·(1 − edge) + 0.02·edge + 0.03·(128²細grain − 0.5)`、height ＝ `0.8·(1 − edge)·(0.8 + 0.2·色調) + 0.08·grain`、`roughness = 0.4 + 0.3·edge`、`occlusion = 1 − 0.45·edge`、金屬factor為0；cache合計三個`Float64Array(64)`、兩個`Float64Array(25)`、一個`Int32Array(25)`加`Float64Array(128²)`，共133,008 B加100 B，皆為lattice算術預算（非總RAM）。預設0.4 m nominal tile與0.0012 UV-relative relief（非公尺位移）。每個取樣點約25次距離與指數運算；我只量過三次512² maps生成（seed 0、1、2各一次）約143–182 ms，是單次量測、不是benchmark，也沒有與其他材質比較。實測（工具實跑）：四個seed（0／1／0xffffffff／7）在512²取樣下，把occlusion大於0.97的像素（遠離縫）以4連通（環繞）分區，每個seed恰好得到64個區域；區域大小最小974–1,851像素、最大4,536–5,019像素；每個區域內色彩最大差距不超過0.0654；各區域平均色彩最暗0.2764–0.2892、最亮0.6676–0.6765；這些內部像素占74.47%–75.25%；256²取樣（seed 0／1／0xffffffff）color 0.0668–0.0694至0.6842–0.6902、平均0.3962–0.4315（隨seed而異）、roughness 0.4至約0.6998、AO最低0.5503–0.5505、height至多0.8734–0.8754 relief；512²取樣（四個seed）color 0.0664–0.0671至0.6850–0.6938、平均0.3959–0.4315、height至多0.8755–0.8790 relief；seed 0與1的內部遮罩（512²）有35.9%像素不同；seed 7的512²maps平均r／g／b約(87.3, 99.6, 111.6)、法線tilt²最大約0.0468、z分量最小252。我實看了最終預覽（seed 7）：藍灰色的多邊形板塊與深色細縫，板塊色調深淺不一，只在少數銳角交會處有模糊污點。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('voronoicells', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`cantordust`（康托爾塵）使目前目錄1006→1007種，含plain的gallery為1008項。在81×81的lattice上畫出第4階的二維康托爾集（Cantor dust）：把方格切成3×3，只保留四個角、挖掉十字形的五塊（四條邊與中心），重複四次；也就是一個格子（x, y）存活的條件是從最粗到最細的每一對三進位數字中，x與y的數字都不是1。存活格共4⁴ = 256個，以金黃色的小圓點呈現，其餘格依「在哪一層被挖掉」用深淺不同的暗色上色：最粗層（十字形的五塊27×27，共3,645格）最亮，往細層（1,620、720、320格）依序變暗，整體像是星座般的點陣，點與點的間隔至少兩格。seed只把整個lattice沿環面平移。與`vicsekfractal`共用同一個sampler分支，只有存活規則不同（Vicsek保留十字、Cantor塵保留四個角）。這只是示意的碎形圖案，不是精確的數學圖解。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；階數4、tanh銳利度8、色調（線0.72、深度0.14）、金黃與暗靛色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。這個材質亮的部分很少（約3%），畫面主體是暗褐色的深度色調，我沒有嘗試放大點的半徑。為了共用分支，我在`vicsekfractal`的preset新增了欄位`rule: 0`（0＝十字、2＝康托爾塵），其行為與數值不變，其測試仍通過；規則1（X形）我沒有實作，所以preset也沒有使用它。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0426）。測試一次通過，無需調整區間；測試中的層級格數與存活格數是由以細分法獨立重寫的模型算出，並與我的封閉形式推算（5·27²、4·5·9²、16·5·9、64·5）一致。

沿用vicsekfractal的sampler分支（現在同時服務`vicsekfractal`與`cantordust`）：啟動時在`81 × 81`的lattice上對每個格子逐層檢查（`unit = 3^(3 − 層)`，取x與y在該層的三進位數字是否為1），規則0（Vicsek）在兩個數字都不是1時、規則2（Cantor塵）在任一個數字是1時記下此層為「被挖掉的層」，存活者設`marks = 1`、被挖掉的設`marks = 0`並記`depth = (4 − 層) / 4`，並依seed的環面平移把格子寫入兩個`Float64Array`；取樣時與vicsekfractal完全相同：`latticeField`（C1 smoothstep）混合存活圖並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化，另一個`latticeField`混合depth圖，顏色＝`0.05 + 0.72·line + 0.14·depth·(1 − line) + 0.03·(128²細grain − 0.5)`、height ＝ `0.8·line + 0.2·grain`、線處roughness降低0.2（底0.4）、AO恆為1、金屬factor為0；cache合計81² × 2 + 128² = 29,506個Float64／236,048 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個取樣點只做常數次運算，我沒有量測耗時。實測（工具實跑）於seed 0／1／0xffffffff／7：存活格256個、被挖掉的格依層為3,645／1,620／720／320；256²取樣下亮處（color>0.5）占2.96%–2.98%、color 0.0688–0.0705至0.7819–0.7838、平均0.1861–0.1864、roughness 0.2001–0.3999、AO恆為1、height至多0.9818–0.9934 relief；512²取樣亮處占2.97%–2.98%、color 0.0678–0.0682至0.7834–0.7844、平均0.1862–0.1864、height至多0.9917–0.9974 relief；每個seed的81×81個node（取樣在node上）恰好有一種環面平移（seed 0為(74, 64)、1為(62, 2)、0xffffffff為(47, 31)、7為(64, 29)）使6,561個node的顏色（含各層深度色調）與獨立重寫的模型一致，最大誤差0.0149以內（誤差來自grain；測試判定門檻為0.03）、亮node數皆為256；seed 0與1的亮node有7.6%不同；seed 7的512²maps平均r／g／b約(54.0, 43.8, 41.9)、法線tilt²最大約0.0426、z分量最小252。我實看了預覽（seed 7）：暗褐色的底上一組組金黃色小圓點，像星座，點群的排列依層級分塊，點群之間有較亮與較暗的塊狀色調。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('cantordust', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`tsquarefractal`（T方塊碎形）使目前目錄1005→1006種，含plain的gallery為1007項。在64×64的lattice上畫出第5階的T方塊碎形（T-square fractal）：先在正中央畫邊長32的方塊，再在每個方塊的四個角上畫邊長減半、以該角為中心的方塊，共5層（邊長32、16、8、4、2，方塊數1、4、16、64、256，共341個）；方塊會互相重疊，每個被覆蓋的格子記住覆蓋它的最深層（最小的方塊畫在最上面）。被覆蓋的格子共3,124個（占4,096格的76.3%），依最深層分別為324、432、576、768、1,024格，沒被覆蓋的972格形成深褐色的十字與T形骨架；被覆蓋處是奶油色，層越深越亮。seed只把整個lattice沿環面平移。這只是示意的碎形圖案，不是精確的數學圖解，覆蓋區（不是方塊的邊界線）才是亮的部分。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；階數5、tanh銳利度8、色調（線0.5、層0.22）、奶油與深褐色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。我沒有嘗試調整為「只畫方塊邊界線」的樣式，所以畫面以大片奶油色覆蓋區為主、骨架是暗色。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0260）。測試一次通過，無需調整區間；測試的層級格數（324／432／576／768／1,024與972未覆蓋）由獨立以遞迴重寫的模型算出。

啟動時在`64 × 64`的lattice上，先令正中央一個邊長32的方塊為第0層，之後每層對上一層每個方塊的四個角各放一個邊長減半、以該角為中心的方塊（共5層），把方塊覆蓋的格子（依seed的環面平移、環繞）寫入兩個`Float64Array`：`marks = 1`與`levels = (層 + 1) / 5`（較深的層後寫，所以覆蓋同一格的方塊取最深層）；取樣時以`latticeField`（C1 smoothstep）混合覆蓋圖，再以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化，另一個`latticeField`混合層級圖：顏色＝`0.05 + 0.5·line + 0.22·level + 0.03·(128²細grain − 0.5)`、height ＝ `0.8·line·(0.7 + 0.3·level) + 0.2·grain`、線處roughness降低0.2（底0.4）、AO恆為1、金屬factor為0；cache合計64² × 2 + 128² = 24,576個Float64／196,608 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個取樣點只做常數次運算，我沒有量測耗時。實測（工具實跑）於seed 0／1／0xffffffff／7：被覆蓋的格3,124個、各層最深覆蓋格數324／432／576／768／1,024、未覆蓋972格；256²取樣下亮處（color>0.5）占75.78%（四個seed相同）、color 0.0362–0.0366至0.7833–0.7843、平均0.5505–0.5506、roughness 0.2001–0.3999、AO恆為1、height至多0.9905–0.9960 relief；512²取樣亮處占75.64%–75.65%、color 0.0355–0.0356至0.7842–0.7846、平均0.5505–0.5506、height至多0.9963–0.9984 relief；每個seed的64×64個node（取樣在node上）恰好有一種環面平移（seed 0為(26, 49)、1為(24, 40)、0xffffffff為(56, 59)、7為(39, 48)）使4,096個node的顏色（含各層色調）與獨立重寫的模型一致，最大誤差0.0150以內（這個數字等於grain的最大振幅0.03×0.5，測試判定門檻為0.03）、亮node數皆為3,124；seed 0與1的亮node有35.1%不同；seed 7的512²maps平均r／g／b約(152.1, 132.9, 96.3)、法線tilt²最大約0.0260、z分量最小253。我實看了預覽（seed 7）：奶油色大片覆蓋區上有深褐色的十字與T形骨架碎形，覆蓋區內有淡淡的層級色調。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('tsquarefractal', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`vicsekfractal`（維澤克碎形）使目前目錄1004→1005種，含plain的gallery為1006項。在81×81的lattice上畫出第4階維澤克碎形（Vicsek fractal，十字形碎形）：把方格切成3×3，保留十字形的五個區塊、挖掉四個角，重複四次；也就是一個格子（x, y）存活的條件是從最粗到最細的每一對三進位數字（x的數字, y的數字）中，至少有一個等於1。存活格共5⁴ = 625個，以金色的細線呈現（最細的一層為一格寬的十字臂），其餘格依「在哪一層被挖掉」用深淺不同的暗青綠色上色：最粗層（四個27×27的角，共2,916格）最亮，往細層（1,620、900、500格）依序變暗。seed只把整個lattice沿環面平移。與`sierpinskicarpet`同屬方塊碎形，但這個是十字形而非挖中心，存活格以略微凸起的細線（height高於周圍）呈現，不像`sierpinskicarpet`把方塊挖成凹陷。這只是示意的碎形圖案，不是精確的數學圖解。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；階數4、tanh銳利度8、色調（線0.72、深度0.14）、金色與暗青綠色調及0.5 m nominal tile皆作者設定（預覽只看了一版）。我把存活格設成「亮」、被挖掉的格以深度著色，沒有嘗試反過來。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0426）。測試一次通過，無需調整區間；測試中每個層級的格數（2,916／1,620／900／500）與存活格數625是由以細分法獨立重寫的模型算出，並與我的封閉形式推算（4·27²、5·4·9²、25·4·3²、125·4）一致。

啟動時在`81 × 81`的lattice上對每個格子逐層檢查（`unit = 3^(3 − 層)`，取x與y在該層的三進位數字），若某層兩個數字都不是1就記下此層為「被挖掉的層」，存活者設`marks = 1`、被挖掉的設`marks = 0`並記`depth = (4 − 層) / 4`，並依seed的環面平移把格子寫入兩個`Float64Array`；取樣時以`latticeField`（C1 smoothstep）混合存活圖，再以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化，另一個`latticeField`混合depth圖：顏色＝`0.05 + 0.72·line + 0.14·depth·(1 − line) + 0.03·(128²細grain − 0.5)`、height ＝ `0.8·line + 0.2·grain`、線處roughness降低0.2（底0.4）、AO恆為1、金屬factor為0；cache合計81² × 2 + 128² = 29,506個Float64／236,048 B，皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個取樣點只做常數次運算，我沒有量測耗時。實測（工具實跑）於seed 0／1／0xffffffff／7：存活格625個、被挖掉的格依層為2,916／1,620／900／500；256²取樣下亮處（color>0.5）占9.18%–9.24%、color 0.0687–0.0698至0.7830–0.7838、平均0.2184–0.2185、roughness 0.2001–0.3999、AO恆為1、height至多0.9902–0.9947 relief；512²取樣亮處占9.18%–9.22%、color 0.0678–0.0688至0.7841–0.7844、平均0.2184–0.2185、height至多0.9964–0.9976 relief；每個seed的81×81個node（取樣在node上）恰好有一種環面平移（seed 0為(43, 9)、1為(13, 9)、0xffffffff為(73, 77)、7為(60, 0)）使6,561個node的顏色（含各層深度色調）與獨立重寫的模型一致，最大誤差0.0149以內（誤差來自grain；測試判定門檻為0.03）、亮node數皆為625；seed 0與1的亮node有13.1%不同；seed 7的512²maps平均r／g／b約(58.8, 68.6, 51.2)、法線tilt²最大約0.0426、z分量最小252。我實看了預覽（seed 7）：暗青綠底上金色的細十字碎形，四個角的大塊顏色深淺依層級不同。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('vicsekfractal', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`squarekoch`（方形科赫島）使目前目錄1003→1004種，含plain的gallery為1005項。暗赤褐底上一條鮭魚粉色細線，描出第3階的第一型二次科赫島（type 1 quadratic Koch island）：從`F+F+F+F`（正方形）出發，把每個`F`取代為`F+F−F−F+F`三次，得到500個單位步、376個相異格點的封閉迴圈（終點回到起點）；與閔考斯基香腸（`minkowskisausage`，用`F+F−F−FF+F+F−F`）不同，這個島的邊在角落彼此接觸（500條邊沒有重複走過，但376個頂點中有重複造訪的），外框為27×27格，放在32×32格的環面上，與相鄰拼貼的島之間約有4格空白、不會相連；線寬為三分之一格，線外有淡淡的光暈。seed只把整條曲線沿環面平移。這是示意的碎形走線，不是真實的島嶼或地圖。與`dragoncurve`、`peanocurve`、`levycurve`、`minkowskisausage`共用同一個走線sampler分支，只有頂點串與取代規則不同。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；階數3、32×32格的環面、偏移(2, 2)、三分之一格的線寬、tanh銳利度8、鮭魚粉與暗赤褐色調與0.25 m nominal tile皆作者設定（預覽只看了一版）。先計算過：階數3的外框為27×27格，放在32×32格的環面上且偏移2，所以與相鄰拼貼的島之間約有4格空白，不會相連；我沒有嘗試階數4（會是500×5 = 2,500步、外框約135格，超過此走線分支使用的環面大小）。我沒有查證「type 1」這個名稱的標準文獻，名稱沿用我對該L系統的了解，這裡不聲稱來源。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0468）。測試一次通過，無需調整區間。

沿用走線sampler分支（現在同時服務`dragoncurve`、`peanocurve`、`levycurve`、`minkowskisausage`與`squarekoch`）：方形科赫模式下以turtle字串`F+F+F+F`、把每個`F`取代為`F+F-F-F+F`三次，`F`前進一格、`+`左轉90°、`−`右轉90°，得到501個頂點（最後一個回到起點）；在96×96的lattice上，格點放在每3個座標的位置（501個頂點中376個相異），相鄰兩格之間以2個連接node填滿（500條邊各2個，共1,000個），亮node合計1,376個（376 + 1,000）；曲線座標加上固定偏移(2, 2)與seed決定的環面平移；之後與dragoncurve相同：`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化，顏色＝`0.06 + 0.76·line + 0.1·glow·(1 − line) + 0.03·(128²細grain − 0.5)`，height ＝ `0.8·line + 0.2·grain`，線處roughness降低0.2（底0.4），金屬factor為0；cache合計96² + 8² + 128² = 25,664個Float64／205,312 B，皆為lattice算術預算（非總RAM）。預設0.25 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑）於seed 0／1／0xffffffff／7：256²取樣下亮處（color>0.5）占12.59%（四個seed相同）、color 0.0459–0.0461至0.8330–0.8336、平均0.1694–0.1695、roughness 0.2001–0.3999、AO恆為1、height至多0.9915–0.9944 relief；512²取樣亮處占16.32%（256²與512²不同是因為取樣格點密度不同，不是不一致）、color 0.0455–0.0456至0.8342–0.8345、平均0.1785–0.1787、height至多0.9965–0.9981 relief；每個seed的96×96個node（取樣在node上）恰好有一種環面平移（seed 0為(18, 3)、1為(23, 13)、0xffffffff為(2, 0)、7為(2, 30)）與測試中獨立以遞迴重寫的島嶼一致，亮node數皆為1,376；seed 0與1的node有24.3%不同；seed 7的512²maps平均r／g／b約(68.6, 36.9, 34.9)、法線tilt²最大約0.0468、z分量最小252。我實看了預覽（seed 7）：暗赤褐底上鮭魚粉色的細線構成一個菱形的碎形島，邊緣有許多小方框，各處的線寬一致。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證，也沒有量測耗時。

使用`await ProceduralMaterial.create('squarekoch', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`radicaltable`（根基表）使目前目錄1002→1003種，含plain的gallery為1004項。48×48個方格，格(col, row)代表整數`n = row·48 + col + 1`（1到2304），以`ln(rad(n)) / ln(n)`上色，其中`rad(n)`是n所有相異質因數的乘積（根基，radical）：無平方因數的數（共1400個，n = 1定義為比值1）比值為1最亮；質數的冪`p^k`比值是`1/k`（例如4是1/2、8是1/3、2048是最小的1/11）；比值再取2次方以拉開差距；4、8、9的倍數留下暗色條紋與斜線，呈淡鼠尾草綠在暗綠底上。方格是帶圓角的拉升方塊，隨高度與AO顯示間隙，seed把整張表在環面上平移。與`divisorcount`、`totienttable`等數論表共用相同的方格形狀，只有取值與色調不同。這只是前2304個正整數的根基比值表示，不是證明或圖解abc猜想。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；toneExponent 2、toneFloor 0.14、toneSpan 0.7、鼠尾草綠與暗綠色調及0.3 m nominal tile皆作者設定（預覽只看了一版）。方格形狀與色調組合沿用divisorcount的參數，沒有為radical重新調整。測試一次通過，無需調整區間。表中亮格占多數（無平方因數的數約占61%），所以整體偏亮，這是取值方式造成的，不是缺陷。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0296）。

啟動時以篩法算出`n ≤ 2304`的根基（先令`rad(n) = 1`，對每個尚未被乘過的質數`q`——此時`rad(q) = 1`——把它的每個倍數`m`做`rad(m) *= q`），預先算出每格色調`0.7·(ln(rad(n)) / ln(n))^2`（n = 1以比值1處理）；取樣時每個方格用一個緊緻支撐的圓角方塊核（四次超橢圓經smoothstep，在方格邊界之前就恰好為零，所以方格查找不會跳動，場為C1）：顏色＝`0.04 + (0.14 + 色調 − 0.04)·遮罩 + 0.03·(128²細grain − 0.5)`、height ＝ `0.8·dome·(0.88 + 0.12·色調) + 0.08·grain`、`occlusion = 1 − 0.4·(1 − 遮罩)`、roughness固定0.4、金屬factor為0；cache合計`Float64Array(2305)`（根基）18,440 B加`Float64Array(2304)`（色調）18,432 B加`Float64Array(128²)` 131,072 B，共167,944 B，皆為lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個取樣點只做常數次運算，我沒有量測耗時，所以不宣稱效能數字。實測（工具實跑）：2304以內無平方因數的數共1400個、`rad(4) = 2`使比值為1/2、`rad(2048) = 2`使比值為最小的1/11、`rad(2304) = 6`；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）占60.65%–60.87%、color 0.0255–0.0257至0.8542–0.8545、平均0.5278–0.5308、AO最低0.6（等於`1 − 0.4`）、height至多0.8472–0.8483 relief；512²取樣（seed 0／1／0xffffffff／7）亮處占60.26%–60.57%、color 0.0251–0.0254至0.8547–0.8549、平均0.5278–0.5290、height至多0.8493–0.8505 relief；每個seed恰好有一種環面平移（seed 0為(46, 4)、1為(4, 7)、0xffffffff為(17, 42)、7為(30, 23)）能使2304格中心的顏色與測試中獨立以試除法重寫的色調一致，最大誤差0.0150以內（誤差來自grain；測試判定門檻為0.03）；seed 0與1相比，有64.3%的格子中心色差大於0.05，亮區遮罩（512²）有19.8%像素不同；seed 7的512²maps平均r／g／b約(123.0, 137.3, 101.8)、法線tilt²最大約0.0296、z分量最小253。我實看了預覽（seed 7）：暗綠底上淺鼠尾草綠的圓角方格，間雜暗色的直條與斜向暗點。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('radicaltable', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`goldbachtable`（哥德巴赫分拆表）使目前目錄1001→1002種，含plain的gallery為1003項。48×48個方格，格(col, row)代表偶數`n = 2·(row·48 + col + 2)`（4、6、8、…、4610），以n的哥德巴赫分拆數`g(n)`（質數`p ≤ n/2`且`n − p`也是質數的個數）上色：直接用g(n)的話會隨n變大而一路變亮、在表的接縫處出現生硬的色差，所以我先乘上`ln(n)²/n`消掉整體成長，再除以表內最大值並取0.75次方；剩下的是所謂「哥德巴赫彗星」的條帶結構，6與30的倍數比鄰近數亮（最亮在n = 2310 = 2·3·5·7·11），呈紫羅蘭色在暗紫底上。方格是帶圓角的拉升方塊，隨高度與AO顯示間隙，seed把整張表在環面上平移。與`divisorcount`、`totienttable`等數論表共用相同的方格形狀，只有取值與色調不同。這只是前2304個偶數的分拆數表示，不是證明或圖解哥德巴赫猜想。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；toneExponent 0.75、toneFloor 0.14、toneSpan 0.7、紫羅蘭與暗紫色調及0.3 m nominal tile皆作者設定。調整紀錄：第一版直接以g(n)除以最大值上色，預覽看到上半部很暗、下半部很亮，並在表的接縫出現橫向色帶（因為g(n)隨n成長），所以改成先乘`ln(n)²/n`；第二版預覽的接縫只剩少數較暗的方格（n = 4附近），整體不再有大幅色差。第一版的測試與探針數字沒有保存，文件與測試只使用第二版。我沒有寫「n剛好高於2的冪的數分拆數少」這類說法，因為沒有驗證。測試一次通過，無需調整區間。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0280）。

啟動時以篩法標出`4611`以內的合成數，對每個偶數`n`逐一檢查`q = 2 … n/2`是否`q`與`n − q`都是質數來計數（約270萬次檢查，我只量過sampler建構3次：約76 ms（第一次）、17 ms、16 ms，不是benchmark），算出`g(n)·ln(n)²/n`，取最大值正規化，預先算出每格色調`0.7·(比值/最大值)^0.75`；取樣時每個方格用一個緊緻支撐的圓角方塊核（四次超橢圓經smoothstep，在方格邊界之前就恰好為零，所以方格查找不會跳動，場為C1）：顏色＝`0.04 + (0.14 + 色調 − 0.04)·遮罩 + 0.03·(128²細grain − 0.5)`、height ＝ `0.8·dome·(0.88 + 0.12·色調) + 0.08·grain`、`occlusion = 1 − 0.4·(1 − 遮罩)`、roughness固定0.4、金屬factor為0；cache合計`Uint8Array(4611)` 4,611 B加兩個`Float64Array(2304)`（比值與色調）加`Float64Array(128²)`，共172,547 B，皆為lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個取樣點只做常數次運算，我沒有量測其耗時。實測（工具實跑）：g(4) = 1（2 + 2）、g(10) = 2（3 + 7與5 + 5），表內每個偶數至少有1個分拆，g的最大值為171，g(4610) = 72，`g(n)·ln(n)²/n`的最大值在n = 2310；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）占26.77%–29.34%、color 0.0257–0.0261至0.8451–0.8511、平均0.3765–0.3830、AO最低0.6（等於`1 − 0.4`）、height至多0.8347–0.8425 relief；512²取樣（seed 0／1／0xffffffff／7）亮處占27.77%–29.11%、color 0.0252–0.0255至0.8463–0.8527、平均0.3803–0.3826、height至多0.8418–0.8461 relief；每個seed恰好有一種環面平移（seed 0為(33, 9)、1為(21, 40)、0xffffffff為(8, 0)、7為(11, 34)）能使2304格中心的顏色與測試中獨立以試除法重寫的色調一致，最大誤差0.0150以內（誤差來自grain；測試判定門檻為0.03）；seed 0與1相比，有39.7%的格子中心色差大於0.05，亮區遮罩（512²）有9.1%像素不同；seed 7的512²maps平均r／g／b約(98.0, 63.3, 111.8)、法線tilt²最大約0.0280、z分量最小253。我實看了第二版預覽（seed 7）：暗紫底上紫羅蘭色圓角方格，亮暗呈不規則的細直條，沒有明顯的橫向色帶。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('goldbachtable', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`totienttable`（歐拉函數表）使目前目錄1000→1001種，含plain的gallery為1002項。48×48個方格，格(col, row)代表整數`n = row·48 + col + 1`（1到2304），以歐拉函數比值`φ(n)/n`上色：把表中最小比值（在n = 210，為48/210）對應到0、比值1（n = 1，質數也只比1小一點點）對應到頂端，再取1.5次方，所以質數與只含大質因數的數最亮；偶數的比值至多1/2，3的倍數、5的倍數等也被壓低，整張表呈現明顯的直條紋（寬度48是偶數，所以每一欄的奇偶固定，奇數欄較亮），呈琥珀金色在暗褐底上。方格是帶圓角的拉升方塊，隨高度與AO顯示間隙，seed把整張表在環面上平移。與`divisorcount`、`abundantnumbers`等數論表共用相同的方格形狀，只有取值與色調不同。這只是前2304個正整數的函數值表示，不是證明或圖解任何數論定理。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；toneExponent 1.5、toneFloor 0.14、toneSpan 0.7、琥珀金與暗褐色調及0.3 m nominal tile皆作者設定（預覽只看了一版）。方格形狀與色調組合沿用divisorcount的參數，沒有為totient重新調整。我沒有去檢查直條紋是否過於單調：預覽看得出明顯的垂直條紋（因表寬48為偶數），這是此取值方式的特性，不是缺陷，也沒有以改變表寬來打散。測試通過一次，無需調整區間。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0296）。

啟動時以篩法算出`n ≤ 2304`的`φ(n)`（先令`φ(n) = n`，再對每個質數`q`的每個倍數`m`做`φ(m) −= φ(m)/q`），取得`least = min φ(n)/n`，並預先算出每格的色調`0.7·((φ(n)/n − least)/(1 − least))^1.5`；取樣時每個方格用一個緊緻支撐的圓角方塊核（四次超橢圓經smoothstep，在方格邊界之前就恰好為零，所以方格查找不會跳動，場為C1）：顏色＝`0.04 + (0.14 + 色調 − 0.04)·遮罩 + 0.03·(128²細grain − 0.5)`、height ＝ `0.8·dome·(0.88 + 0.12·色調) + 0.08·grain`、`occlusion = 1 − 0.4·(1 − 遮罩)`、roughness固定0.4、金屬factor為0；cache合計`Int32Array(2305)` 9,220 B加`Float64Array(2304 + 128²)` 149,504 B，共158,724 B，皆為lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個取樣點只做常數次運算，我沒有量測耗時，所以不宣稱效能數字。實測（工具實跑）：n = 210為第一個達到最小比值48/210的整數，2304以內共有342個質數，所有偶數的比值最大為0.5；256²取樣（seed 0／1／0xffffffff）亮處（color>0.5）占22.23%–23.72%、color 0.0255–0.0259至0.8527–0.8529、平均0.3109–0.3183、AO最低0.6（等於`1 − 0.4`）、height至多0.8459–0.8471 relief；512²取樣（seed 0／1／0xffffffff／7）亮處占22.13%–22.78%、color 0.0252–0.0254至0.8536–0.8542、平均0.3114–0.3142、height至多0.8486–0.8500 relief；每個seed恰好有一種環面平移（seed 0為(39, 33)、1為(23, 23)、0xffffffff為(19, 33)、7為(42, 4)）能使2304格中心的顏色與測試中獨立以互質計數重寫的`φ(n)/n`色調一致，最大誤差0.0150以內（誤差來自grain；測試判定門檻為0.03）；seed 0與1相比，有78.5%的格子中心色差大於0.05，亮區遮罩（512²）有23.6%像素不同；seed 7的512²maps平均r／g／b約(96.6, 80.1, 37.3)、法線tilt²最大約0.0296、z分量最小253。我實看了預覽（seed 7）：暗褐底上琥珀色的圓角方格排成明顯的直條紋，最亮的欄是奇數欄。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('totienttable', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`spirographtable`（螺旋規曲線表）使目前目錄999→1000種，含plain的gallery為1001項。6×6個格子，格(col, row)畫出半徑`a = col + 1`的小輪在半徑`b = row + 7`的大環內滾動所產生的內擺線（hypotrochoid），畫筆位於小輪圓心外`0.8·a`處；a從1到6、b從7到12，所以a恆小於b；曲線縮放到離格中心最遠`0.4`個格寬後，以seed決定的角度（0到0.5弧度）整體旋轉，每格各畫一個封閉曲線，呈現銅色曲線、微光暈在暗紅褐底上的模樣。曲線經過自己時用高斯和（而非距離最小值）所以不產生折痕。36格中有13格的a與b有公因數，曲線在不到`a`圈時就封閉，我只畫一個完整封閉週期，不重複描繪。這只是`a`、`b`的整數比值表，不是各種筆距的比較表（筆距比固定為0.8），也不是真正的實體螺旋規玩具。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；筆距比0.8、amplitude 0.4、線寬0.016、光暈半徑0.1、銅色與暗紅褐色調皆作者設定（預覽看了兩版：第一版沿用`t ∈ [0, 2π·a)`，對a與b有公因數的格子會重複描繪同一條曲線使線條加倍，所以我改為`t ∈ [0, 2π·a / gcd(a, b))`，第二版的預覽肉眼看不出明顯差異，我沒有做量化比較，只是依數學上正確的封閉週期修改）。第一次預覽只是外觀判斷，並非定量檢查。測試通過是在修改之後；我沒有保存修改前的測試結果，所以不聲稱修改前後的比較。relief沿用0.0008、未另外調整（512²maps法線tilt²最大0.0495）。

使用與玫瑰線表（rhodoneatable）相同的軟聯集：36個格各自預先算出360個點的封閉折線（儲存在以格寬為單位、相對格中心的`Float64Array`），取樣時只走訪取樣點所在格自己的360個線段，計算`Σ exp(−d²/0.016²)`（d為取樣點到線段的距離）後以`1 − exp(−4·sum)`壓縮為線強度，加上緊緻的smoothstep光暈（半徑0.1，因為曲線離格中心至多0.4，所以光暈在格邊界剛好為零，相鄰格不會互相跳動）；顏色＝`0.04 + 0.74·線 + 0.12·光暈·(1 − 線) + 0.02·(128²細grain − 0.5)`、height ＝ `0.8·線 + 0.2·grain`、線處roughness降低0.2、AO恆為1、金屬factor為0；cache合計2×36×360 + 128² = 42,304個Float64／338,432 B，皆為lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。每個取樣點走訪360個線段；我只量過一次512² maps生成（seed 7）約444 ms，那是單次量測，不是benchmark，也沒有和其他材質比較。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占19.06%–19.20%、color 0.0303–0.0304至0.7892–0.7898、平均0.2033–0.2035、roughness 0.2–0.4、AO恆為1、height至多0.9919–0.9984 relief；512²取樣亮處占19.07%–19.10%、color 0.0301–0.0302至0.7898–0.7899、平均0.2034–0.2035、height至多0.9975–0.9992 relief；四格角落（距離格角0.02格寬）的最大color為0.0487–0.0495；四個seed在101種旋轉角（0到0.5弧度）中，有25–29種使「36格×96個獨立計算的曲線點」全都落在亮處（color>0.5），最佳最小亮度0.7702–0.7704（所以曲線確實是這張表的內擺線，不是一般亮紋）；seed 0與1的亮區遮罩（512²）18.5%像素不同；seed 7的512²maps平均r／g／b約(72.6, 43.4, 29.2)、法線tilt²最大約0.0495，AO與alpha檢查無異常。我實看了預覽（seed 7）：暗紅褐底上，銅色的星形、多角形與細橢圓曲線排成規則的格子，邊緣有微弱的光暈。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('spirographtable', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`dodecagridfilled`（上色十二重網格拼貼）使目前目錄998→999種，含plain的gallery為1000項。與`dodecagridtiling`相同的十二重補丁（相同的六組網格與偏移；151塊瓷磚、330條邊、180個頂點、歐拉示性數1，頂點邊數2到10），但每塊瓷磚內部有色調：30°菱形最暗（0.10）、60°菱形中等（0.18）、正方形最亮（0.26），邊緣為淺萊姆綠細線，呈現深森林綠底上的萊姆綠線條。色調的權重與`penrosefilled`相同（四條邊各自平滑步階的連乘，C1）。seed只把整塊補丁旋轉30°的整數倍（12種）。這只是一小塊補丁，不是無限延伸的拼貼；色調只依瓷磚形狀而定，不是真正的配色規則。與`penrosefilled`、`ammannfilled`、`heptagridfilled`共用同一個多重網格sampler分支的填色功能，只有preset不同。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；三種瓷磚的色調0.10／0.18／0.26、邊緣寬度0.15、內部高度加成0.05、線色調0.7、萊姆綠與森林綠色調與0.5 m nominal tile皆作者設定（預覽只看了一版）。填色類別`k − j − 1`對應的瓷磚形狀，我吸取`heptagridfilled`的教訓，先用方向夾角`(k − j)·30°`算過（類別0與4是30°、1與3是60°、2是90°正方形），再寫`fills`，沒有再弄反。填色功能的折痕問題已在`penrosefilled`修正，C1測試一次通過。結構檢查同dodecagridtiling，是構造自洽性的檢查，不是形式證明。relief沿用0.0007、未另外調整（512²maps法線tilt²最大0.0335）。

沿用多重網格sampler分支的填色功能（見`penrosefilled`）：`roots`為12、六組網格、偏移`(0.13, −0.31, 0.22, 0.07, −0.19, 0.08)`，建構出與dodecagridtiling相同的151塊瓷磚與330條邊，並保留每塊瓷磚的旋轉後四個角、中心、面積正負號與類別`k − j − 1`；取樣時對中心附近每塊瓷磚以`Π_{四條邊} smooth(clamp(有號距離 / 0.15))`作權重，色調加上`fills[類別]·權重`（類別0與4為30°菱形0.10、類別1與3為60°菱形0.18、類別2為正方形0.26），高度加上`0.05·權重`；其餘與dodecagridtiling相同（線權重`(1 − d²/r²)²`，r = 0.09，加總後以`1 − exp(−1.6·sum)`壓縮；顏色＝`0.06 + 0.7·thread + 填色 + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·thread + 填色高度 + 0.15·grain`；線處roughness降低0.1；AO恆為1；金屬factor為0）；cache合計330×4 + 151×8 + 151×3 + 128² = 19,365個Float64／154,920 B（再加151 B的類別陣列），皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0007 UV-relative relief（非公尺位移）。每個取樣點走訪330條邊與151塊瓷磚，沒有量測耗時，所以不宣稱效能數字。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占11.54%–11.72%、color 0.0455–0.0456至0.7705–0.7736、平均0.2002–0.2004、roughness 0.3–0.4、AO恆為1、height至多0.9341–0.9421 relief；512²取樣亮處占11.51%–11.53%、color 0.0452至0.7734–0.7746、平均0.2002–0.2004、height至多0.9419–0.9487 relief；四個seed各自在恰好一個旋轉步（依序為第0、7、1、7步，共12步）下，補丁上每三個頂點以及每三塊瓷磚中心的顏色（含內部色調）與測試中獨立重寫的模型一致（最大誤差小於0.03，這是測試的判定門檻）；seed 0與1的亮區遮罩（512²）14.1%像素不同；seed 7的512²maps平均r／g／b約(51.3, 75.1, 41.3)、法線tilt²最大約0.0335、z分量最小253。結構（151塊、330條邊、180個頂點、歐拉示性數1、邊長1、頂點邊數2到10、30°菱形／60°菱形／正方形各41／70／40塊）同dodecagridtiling。我實看了預覽（seed 7）：深森林綠底上萊姆綠細線框出綠色的瓷磚，正方形最亮。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('dodecagridfilled', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`heptagridfilled`（上色七重網格拼貼）使目前目錄997→998種，含plain的gallery為999項。與`heptagridtiling`相同的七重網格補丁（相同的七組網格與偏移；154塊菱形、335條邊、182個頂點、歐拉示性數1，頂點邊數2到9），但每塊菱形內部有色調：銳角25.7°的細菱形最暗（0.10）、51.4°的中等（0.18）、77.1°的寬菱形最亮（0.26），邊緣為淺藍色細線，呈現藏青底上的藍圖風格。色調的權重與`penrosefilled`相同（四條邊各自平滑步階的連乘，C1）。seed只把整塊補丁旋轉360°／14的整數倍（14種）。這只是一小塊補丁，不是無限延伸的拼貼；色調只依菱形形狀而定，不是真正的配色規則。與`penrosefilled`、`ammannfilled`共用同一個多重網格sampler分支的填色功能，只有preset不同。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；三種菱形的色調0.10／0.18／0.26、邊緣寬度0.15、內部高度加成0.05、線色調0.7、淺藍與藏青色調與0.5 m nominal tile皆作者設定。調整與錯誤紀錄：(1)第一版預覽的配色是琥珀色配深綠，與`ammannfilled`太像，我改成淺藍配藏青，之後的預覽都是新配色（過程中發現讀圖工具對同一路徑可能顯示舊圖，我改寫到新檔名後才看到新配色）。(2)我第一版把填色類別`k − j − 1`對應到菱形形狀時弄錯了：我預期類別0到5依序是寬到窄再對稱，但實際上菱形的銳角由兩組網格方向的夾角`(k − j)·360°/7`決定，類別0與5是51.4°、類別1與4是77.1°、類別2與3是25.7°；所以第一版`fills`為`[0.10, 0.18, 0.26, 0.26, 0.18, 0.10]`時，是最細的25.7°菱形最亮，與我想要的相反。發現後改為`[0.18, 0.26, 0.10, 0.10, 0.26, 0.18]`，重新跑探針，並更新測試的亮區占比、平均、maps區間（測試通過是在修正之後），文件只使用修正後的數字，也只看過修正後的最終預覽。(3)填色功能已在`penrosefilled`修正過折痕問題，C1測試一次通過。結構檢查同heptagridtiling，是構造自洽性的檢查，不是形式證明。relief沿用0.0007、未另外調整（512²maps法線tilt²最大0.0336）。

沿用多重網格sampler分支的填色功能（見`penrosefilled`）：`roots`為7、七組網格、偏移`(0.11, −0.23, 0.19, −0.07, 0.05, −0.17, 0.12)`，建構出與heptagridtiling相同的154塊菱形與335條邊，並保留每塊菱形的旋轉後四個角、中心、面積正負號與類別`k − j − 1`；取樣時對中心附近每塊菱形以`Π_{四條邊} smooth(clamp(有號距離 / 0.15))`作權重，色調加上`fills[類別]·權重`（類別0與5為51.4°菱形0.18、類別1與4為77.1°寬菱形0.26、類別2與3為25.7°細菱形0.10），高度加上`0.05·權重`；其餘與heptagridtiling相同（線權重`(1 − d²/r²)²`，r = 0.09，加總後以`1 − exp(−1.6·sum)`壓縮；顏色＝`0.06 + 0.7·thread + 填色 + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·thread + 填色高度 + 0.15·grain`；線處roughness降低0.1；AO恆為1；金屬factor為0）；cache合計335×4 + 154×8 + 154×3 + 128² = 19,418個Float64／155,344 B（再加154 B的類別陣列），皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0007 UV-relative relief（非公尺位移）。每個取樣點走訪335條邊與154塊菱形，沒有量測耗時，所以不宣稱效能數字。實測（工具實跑，seed 0／1／0xffffffff／7，修正後的fills）：256²取樣下亮處（color>0.5）占11.85%–11.89%、color 0.0455–0.0459至0.7712–0.7721、平均0.2107–0.2108、roughness 0.3–0.4、AO恆為1、height至多0.9367–0.9399 relief；512²取樣亮處占11.90%–11.92%、color 0.0452–0.0453至0.7719–0.7745、平均0.2108、height至多0.9403–0.9430 relief；四個seed各自在恰好一個旋轉步（依序為第9、6、10、9步，共14步）下，補丁上每三個頂點以及每三塊菱形中心的顏色（含內部色調）與測試中獨立重寫的模型一致（最大誤差小於0.03，這是測試的判定門檻）；seed 0與1的亮區遮罩（512²）14.5%像素不同；seed 7的512²maps平均r／g／b約(40.0, 56.9, 85.3)、法線tilt²最大約0.0336、z分量最小253。結構（154塊、335條邊、182個頂點、歐拉示性數1、邊長1、頂點邊數2到9、銳角25.7°／51.4°／77.1°的菱形各27／58／69塊）同heptagridtiling。我實看了修正後的最終預覽（seed 7）：藏青底上淺藍細線框出藍灰色的菱形，寬菱形比細菱形亮。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('heptagridfilled', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`ammannfilled`（上色阿曼—本克爾拼貼）使目前目錄996→997種，含plain的gallery為998項。與`ammannbeenker`相同的阿曼—本克爾補丁（相同的四組網格與偏移，148塊：62個正方形、86個45°／135°菱形、322條邊、175個頂點、歐拉示性數1），但每塊瓷磚內部有色調：正方形較亮（0.24）、菱形較暗（0.12），邊緣是琥珀色細線，呈現深青綠底上琥珀色線條、橄欖色瓷磚的模樣；色調的權重與`penrosefilled`相同（四條邊各自平滑步階的連乘，C1）。seed只把整塊補丁旋轉45°的整數倍（8種）。這只是一小塊補丁，不是無限延伸的拼貼；色調只依瓷磚形狀而定，不是真正的配色規則。與`penrosefilled`共用同一個多重網格sampler分支的填色功能，只有preset不同。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；正方形色調0.24、菱形0.12、邊緣寬度0.15、內部高度加成0.05、線色調0.7、琥珀與深青綠色調與0.5 m nominal tile皆作者設定（預覽只看了一版）。relief沿用0.0007、未另外調整（512²maps法線tilt²最大0.0335）。填色功能已在`penrosefilled`修正過一次折痕問題（最小值改為連乘），這個材質直接使用修正後的版本，C1測試一次通過。我在測試中訂的亮區占比上限0.1107第一次寫錯（seed 0xffffffff實測0.11090，測試失敗），改為0.1111；這是測試期望的錯誤，不是sampler問題。結構檢查（個數、歐拉示性數、邊長、頂點邊數、正方形與菱形數）與ammannbeenker相同，是構造自洽性的檢查，不是形式證明。

沿用多重網格sampler分支的填色功能（見`penrosefilled`）：`roots`為8、四組網格、偏移`(0.13, −0.31, 0.22, −0.04)`，建構出與ammannbeenker相同的148塊瓷磚與322條邊，並保留每塊瓷磚的旋轉後四個角、中心、面積正負號與類別`k − j − 1`；取樣時對中心附近每塊瓷磚以`Π_{四條邊} smooth(clamp(有號距離 / 0.15))`作權重，色調加上`fills[類別]·權重`（類別0與2為45°／135°菱形0.12、類別1為正方形0.24），高度加上`0.05·權重`；其餘與ammannbeenker相同（線權重`(1 − d²/r²)²`，r = 0.09，加總後以`1 − exp(−1.6·sum)`壓縮；顏色＝`0.06 + 0.7·thread + 填色 + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·thread + 填色高度 + 0.15·grain`；線處roughness降低0.1；AO恆為1；金屬factor為0）；cache合計322×4 + 148×8 + 148×3 + 128² = 19,300個Float64／154,400 B（再加148 B的類別陣列），皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0007 UV-relative relief（非公尺位移）。每個取樣點走訪322條邊與148塊瓷磚，沒有量測耗時，所以不宣稱效能數字。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占11.02%–11.09%、color 0.0455–0.0458至0.7704–0.7726、平均0.1960–0.1962、roughness 0.3–0.4、AO恆為1、height至多0.9275–0.9386 relief；512²取樣亮處占11.22%–11.26%、color 0.0451–0.0454至0.7724–0.7742、平均0.1960–0.1963、height至多0.9374–0.9449 relief；四個seed各自在恰好一個旋轉步（依序為第7、6、7、0步）下，補丁上每三個頂點以及每三塊瓷磚中心的顏色（含內部色調）與測試中獨立重寫的模型一致（最大誤差小於0.03，這是測試的判定門檻）；seed 0與1的亮區遮罩（512²）16.4%像素不同；seed 7的512²maps平均r／g／b約(58.1, 65.3, 50.9)、法線tilt²最大約0.0335、z分量最小253。我實看了預覽（seed 7）：深青綠底上琥珀色線條框出橄欖色的正方形與菱形，正方形較亮，八角星形清楚。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('ammannfilled', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`penrosefilled`（上色潘洛斯拼貼）使目前目錄995→996種，含plain的gallery為997項。與`penrosetiling`相同的潘洛斯菱形補丁（相同的五重網格偏移，149個菱形、323條邊、175個頂點），但每個菱形內部有色調：胖菱形（72°）較亮、瘦菱形（36°）較暗，邊緣仍是淺色細線，所以呈現深紫底上奶油色線條、棕紫色菱形的模樣。每個菱形的色調以其四條邊的距離權重連乘決定：靠近邊時趨近0（斜率為零）、離每條邊超過0.15個邊長後為1，所以相鄰菱形的色調不會跳動，線條蓋住接縫。seed只把整塊補丁旋轉36°的整數倍（10種）。這只是一小塊補丁，不是無限延伸的拼貼；色調只依菱形的兩種形狀而定，不是真正的配色方案（例如沒有遵守任何配對規則）。與`penrosetiling`等共用同一個多重網格sampler分支，新增了`fills`（各格網配對類別的內部色調）、`fillRim`與`fillHeight`欄位，其他材質的`fills`全為0，行為不變。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；胖菱形色調0.2、瘦菱形0.1、邊緣寬度0.15、內部高度加成0.05、線色調0.7、奶油與深紫色調與0.5 m nominal tile皆作者設定（預覽看了兩版：第一版後的測試發現問題，修正後我再看了一次）。relief沿用0.0007、未另外調整（512²maps法線tilt²最大0.0335）。錯誤紀錄：第一版內部色調的權重用「四條邊距離的最小值」的平滑步階，C1測試失敗（最大二階差分比值51.8）——最小值在銳角的角平分線上有折痕，而該處離邊仍小於0.15，所以色調有斜率不連續；改成「四條邊各自平滑步階的連乘」後C1測試通過，此時統計值也跟著改變（最亮從0.79降到0.77），我已用修正後的探針輸出更新測試的數值區間。我只在這個修正版本上寫文件與驗證。

沿用多重網格sampler分支（現在同時服務`penrosetiling`、`penrosestar`、`ammannbeenker`、`heptagridtiling`、`dodecagridtiling`與`penrosefilled`），新增瓷磚填色：建構時除了邊之外也保留每個菱形（旋轉後的四個角、中心、面積正負號、以及類別`k − j − 1`）；取樣時對中心附近（距離1.2以內）的每個菱形，以`Π_{四條邊} smooth(clamp(到該邊的有號距離 / 0.15))`作為權重（在菱形外必有一條邊的有號距離為負而權重為0；這個連乘在每條邊上為0且斜率為零，所以是C1，而「最小值」在銳角處有折痕），色調加上`fills[類別]·權重`（胖菱形類別0與3為0.2，瘦菱形類別1與2為0.1），高度加上`0.05·權重`；`fills`全為0的材質略過這個迴圈。其餘與penrosetiling相同：邊的線條權重`(1 − d²/r²)²`（r = 0.09，C1）加總後以`1 − exp(−1.6·sum)`壓縮，顏色＝`0.06 + 0.7·thread + 填色 + 0.03·(128²細grain − 0.5)`，height ＝ `0.8·thread + 填色高度 + 0.15·grain`，線處roughness降低0.1，AO恆為1，金屬factor為0；cache合計323×4 + 149×8 + 149×3 + 128² = 19,315個Float64／154,520 B（再加149 B的類別陣列），皆為lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0007 UV-relative relief（非公尺位移）。每個取樣點走訪323條邊與149個菱形（中心1.2以外直接略過），沒有量測耗時，所以不宣稱效能數字。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占11.16%–11.28%、color 0.0455–0.0461至0.7718–0.7734、平均0.1933–0.1934、roughness 0.3–0.4、AO恆為1、height至多0.9329–0.9424 relief；512²取樣亮處占11.24%–11.25%、color 0.0452–0.0453至0.7732–0.7742、平均0.1933–0.1934、height至多0.9390–0.9451 relief；四個seed各自在恰好一個旋轉步（依序為第3、0、0、4步）下，補丁上每三個頂點以及每三個菱形中心的顏色（含內部色調）與測試中獨立重寫的模型一致（最大誤差小於0.03，這是測試的判定門檻）；seed 0與1的亮區遮罩（512²）5.9%像素不同；seed 7的512²maps平均r／g／b約(68.7, 51.1, 60.0)、法線tilt²最大約0.0335、z分量最小253。結構（149個菱形、323條邊、175個頂點、歐拉示性數1、95個胖與54個瘦）與penrosetiling相同。我實看了最終版預覽（seed 7）：深紫底上奶油色細線框出棕紫色的菱形，胖菱形與瘦菱形的色調差別不大。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('penrosefilled', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`dodecagridtiling`（十二重網格拼貼）使目前目錄994→995種，含plain的gallery為996項。深藍紫黑底上淡紫色的細線畫出一塊近似十二重旋轉對稱的非週期拼貼補丁：德布魯因多重網格構造，六組網格、單位向量取十二次單位根的前六個（0°、30°、…、150°）、偏移`(0.13, −0.31, 0.22, 0.07, −0.19, 0.08)`（和為0），每個網格交點是一塊菱形或正方形，共151塊，依銳角分成三種（30°菱形41塊、60°菱形70塊、90°正方形40塊）、330條單位長度的邊、180個頂點，頂點的邊數從2到10，補丁是單連通的圓盤（歐拉示性數1）；補丁半徑6.2個邊長，放在週期16個邊長的磚中央，四周留有空白、不會與相鄰拼貼相連。seed只把整塊補丁旋轉30°的整數倍（12種）。這只是一小塊補丁，不是無限延伸的拼貼，也不是週期的拼貼；十二重對稱是近似的。與`penrosetiling`、`penrosestar`、`ammannbeenker`、`heptagridtiling`共用同一個多重網格sampler分支，只有preset不同。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；六個偏移是我手選的一組（和為0，沒有掃描其他偏移）、補丁半徑6.2、線半徑0.09、gain 1.6、淡紫與深藍紫色調與0.5 m nominal tile皆作者設定（預覽只看了一版）。relief沿用penrosetiling的0.0007、未另外調整（512²maps法線tilt²最大0.0401）。我沒有查證這個拼貼與文獻中的十二重準晶拼貼（例如Stampfli或Socolar拼貼）的關係，所以只稱它為「十二重網格拼貼」，不宣稱是其中任何一種。結構檢查（個數、歐拉示性數、邊長、頂點邊數、三種瓷磚的數目）是構造自洽性的檢查，不是形式證明。

沿用多重網格sampler分支（現在同時服務`penrosetiling`、`penrosestar`、`ammannbeenker`、`heptagridtiling`與`dodecagridtiling`）：`roots`為12、網格數為偏移個數6，單位向量`e_j`取`exp(2πi·j/12)`（`j`為0到5）；對每一對網格`(j, k)`與整數`(r, s)`（−6到6）解出兩條線的交點`x`，其他四個索引取`ceil(x·e_l − offsets[l])`，`j`與`k`取`r`、`r+1`與`s`、`s+1`，得到一塊瓷磚的四個角`Σ K_l e_l`；只保留中心距原點不超過6.2的瓷磚，共用的邊以座標鍵去重（330條），整塊補丁依seed旋轉（0到11個30°）；取樣時對每條邊取點線距離，權重`(1 − d²/r²)²`（r = 0.09，C1）加總後以`1 − exp(−1.6·sum)`壓縮；顏色＝`0.06 + 0.78·thread + 0.03·(128²細grain − 0.5)`；height ＝ `0.85·thread + 0.15·grain`；線處roughness降低0.1；AO恆為1；金屬factor為0；cache合計330×4 + 128² = 17,704個Float64／141,632 B lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0007 UV-relative relief（非公尺位移）。每個取樣點走訪330條邊，沒有量測耗時，所以不宣稱效能數字。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占11.71%–11.75%、color 0.0454–0.0456至0.8492–0.8506、平均0.1468–0.1469、roughness 0.3–0.4、AO恆為1、height至多0.9734–0.9881 relief；512²取樣亮處占11.83%–11.89%、color 0.0451–0.0452至0.8521–0.8528、平均0.1468–0.1469、height至多0.9898–0.9935 relief；四個seed各自在恰好一個旋轉步（依序為第8、0、10、2步）下，補丁上每三個頂點的顏色與測試中獨立重寫的模型一致（最大誤差小於0.03，這是測試的判定門檻）；seed 0與1的亮區遮罩（512²）8.1%像素不同；seed 7的512²maps平均r／g／b約(46.2, 39.8, 66.5)、法線tilt²最大約0.0401、z分量最小253。我實看了預覽（seed 7）：深藍紫底上淡紫色的圓盤狀補丁，由正方形與菱形組成，邊界鋸齒，在環面上重複排列。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('dodecagridtiling', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`heptagridtiling`（七重網格拼貼）使目前目錄993→994種，含plain的gallery為995項。深紫紅黑底上玫瑰色的細線畫出一塊七重旋轉近似對稱的非週期菱形拼貼補丁：德布魯因多重網格構造，七組網格、單位向量取七次單位根、偏移`(0.11, −0.23, 0.19, −0.07, 0.05, −0.17, 0.12)`（和為0），每個網格交點是一塊菱形，共154塊，依銳角分成三種（25.7°共27塊、51.4°共58塊、77.1°共69塊，由七個方向之間的夾角決定）、335條單位長度的邊、182個頂點，頂點的邊數從2到9，補丁是單連通的圓盤（歐拉示性數1）；補丁半徑6.2個邊長，放在週期16個邊長的磚中央，四周留有空白、不會與相鄰拼貼相連。seed只把整塊補丁旋轉360°/14的整數倍（14種）。這只是一小塊補丁，不是無限延伸的拼貼，也不是週期的拼貼；它的七重對稱是近似的（拼貼本身不是嚴格七重對稱）。與`penrosetiling`、`penrosestar`、`ammannbeenker`共用同一個多重網格sampler分支，只有preset不同。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；七個偏移是我手選的一組（和為0，沒有掃描其他偏移）、補丁半徑6.2、線半徑0.09、gain 1.6、玫瑰與深紫紅色調與0.5 m nominal tile皆作者設定（預覽只看了一版）。relief沿用penrosetiling的0.0007、未另外調整（512²maps法線tilt²最大0.0382）。我沒有查證這個拼貼是否有既有的名稱，所以只稱它為「七重網格拼貼」。結構檢查（個數、歐拉示性數、邊長、頂點邊數、三種菱形的數目）是構造自洽性的檢查，不是形式證明。

沿用多重網格sampler分支（現在同時服務`penrosetiling`、`penrosestar`、`ammannbeenker`與`heptagridtiling`）：`roots`為7、網格數為偏移個數7，單位向量`e_j`取`exp(2πi·j/7)`（`j`為0到6）；對每一對網格`(j, k)`與整數`(r, s)`（−6到6）解出兩條線的交點`x`，其他五個索引取`ceil(x·e_l − offsets[l])`，`j`與`k`取`r`、`r+1`與`s`、`s+1`，得到一塊菱形的四個角`Σ K_l e_l`；只保留中心距原點不超過6.2的菱形，共用的邊以座標鍵去重（335條），整塊補丁依seed旋轉（0到13個360°/14）；取樣時對每條邊取點線距離，權重`(1 − d²/r²)²`（r = 0.09，C1）加總後以`1 − exp(−1.6·sum)`壓縮；顏色＝`0.06 + 0.78·thread + 0.03·(128²細grain − 0.5)`；height ＝ `0.85·thread + 0.15·grain`；線處roughness降低0.1；AO恆為1；金屬factor為0；cache合計335×4 + 128² = 17,724個Float64／141,792 B lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0007 UV-relative relief（非公尺位移）。每個取樣點走訪335條邊，沒有量測耗時，所以不宣稱效能數字。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占11.99%–12.03%、color 0.0454–0.0457至0.8507–0.8518、平均0.1480–0.1482、roughness 0.3–0.4、AO恆為1、height至多0.9804–0.9852 relief；512²取樣亮處占11.93%–11.96%、color 0.0452至0.8521–0.8524、平均0.1480–0.1482、height至多0.9878–0.9932 relief；四個seed各自在恰好一個旋轉步（依序為第7、2、13、9步）下，補丁上每三個頂點的顏色與測試中獨立重寫的模型一致（最大誤差小於0.03，這是測試的判定門檻）；seed 0與1的亮區遮罩（512²）7.5%像素不同；seed 7的512²maps平均r／g／b約(63.3, 22.9, 31.0)、法線tilt²最大約0.0382、z分量最小253。我實看了預覽（seed 7）：深紫紅底上玫瑰色的圓盤狀七重星形補丁，中心附近有明顯的七重旋轉感，在環面上重複排列。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('heptagridtiling', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`ammannbeenker`（阿曼—本克爾拼貼）使目前目錄992→993種，含plain的gallery為994項。深綠黑底上薄荷色的細線畫出一塊阿曼—本克爾（Ammann–Beenker）八重非週期拼貼的補丁：以德布魯因多重網格構造——四組網格、單位向量取八次單位根的前四個（0°、45°、90°、135°）、偏移`(0.13, −0.31, 0.22, −0.04)`，每個網格交點是一塊正方形（90°）或菱形（45°／135°）——共148塊（62個正方形、86個菱形，約1.39個菱形對1個正方形；無限拼貼的比例是√2 ≈ 1.41）、322條單位長度的邊、175個頂點，頂點的邊數從2到8（八邊星形處為8），補丁是單連通的圓盤（歐拉示性數1）；補丁半徑6.2個邊長，放在週期16個邊長的磚中央，四周留有空白、不會與相鄰拼貼相連。seed只把整塊補丁旋轉45°的整數倍（8種）。這只是一小塊補丁，不是無限延伸的拼貼，也不是週期的拼貼。與`penrosetiling`、`penrosestar`共用同一個多重網格sampler分支，只有preset不同（新增`roots`欄位，網格數由偏移個數決定）。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；四個偏移`(0.13, −0.31, 0.22, −0.04)`（和為0，是我手選的一組，沒有掃描其他偏移）、補丁半徑6.2、線半徑0.09、gain 1.6、薄荷與深綠色調與0.5 m nominal tile皆作者設定（預覽只看了一版；預覽左下角補丁邊界有一塊孤立的細菱形，這是「中心在半徑內就保留」的規則造成的鋸齒邊界，結構檢查（歐拉示性數1）仍成立）。relief沿用penrosetiling的0.0007、未另外調整（512²maps法線tilt²最大0.0378）。共用分支的修改（`roots`欄位與網格數由偏移個數決定）讓`penrosetiling`與`penrosestar`的preset多了`roots: 5`，其建構結果不變，這兩個材質的測試在這次修改後仍通過。結構檢查（個數、歐拉示性數、邊長、頂點邊數、正方形與菱形數）是構造自洽性的檢查，不是形式證明；我也沒有驗證補丁的菱形／正方形比例必然收斂到√2。測試中我自己訂的亮區占比下限（0.113）第一次寫錯（seed 1實測0.11298），改為0.1125。

沿用多重網格sampler分支（現在同時服務`penrosetiling`、`penrosestar`與`ammannbeenker`）：`roots`為8、網格數為偏移個數4，單位向量`e_j`取`exp(2πi·j/8)`（`j`為0到3）；對每一對網格`(j, k)`與整數`(r, s)`（−6到6）解出兩條線的交點`x`，其他兩個索引取`ceil(x·e_l − offsets[l])`，`j`與`k`取`r`、`r+1`與`s`、`s+1`，得到一塊瓷磚的四個角`Σ K_l e_l`；只保留中心距原點不超過6.2的瓷磚，共用的邊以座標鍵去重（322條），整塊補丁依seed旋轉（0到7個45°）；取樣時對每條邊取點線距離，權重`(1 − d²/r²)²`（r = 0.09，C1）加總後以`1 − exp(−1.6·sum)`壓縮；顏色＝`0.06 + 0.78·thread + 0.03·(128²細grain − 0.5)`；height ＝ `0.85·thread + 0.15·grain`；線處roughness降低0.1；AO恆為1；金屬factor為0；cache合計322×4 + 128² = 17,672個Float64／141,376 B lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0007 UV-relative relief（非公尺位移）。每個取樣點走訪322條邊，沒有量測耗時，所以不宣稱效能數字。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占11.30%–11.40%、color 0.0453–0.0457至0.8492–0.8534、平均0.1450–0.1452、roughness 0.3–0.4、AO恆為1、height至多0.9792–0.9961 relief；512²取樣亮處占11.47%–11.49%、color 0.0452至0.8517–0.8542、平均0.1450–0.1452、height至多0.9884–0.9975 relief；四個seed各自在恰好一個旋轉步（依序為第5、4、1、5步）下，補丁上每三個頂點的顏色與測試中獨立重寫的模型一致（最大誤差小於0.03，這是測試的判定門檻）；seed 0與1的亮區遮罩（512²）16.6%像素不同；seed 7的512²maps平均r／g／b約(36.1, 57.6, 46.1)、法線tilt²最大約0.0378、z分量最小253。我實看了預覽（seed 7）：深綠底上薄荷色的八重星形補丁（正方形與菱形組成的八角星），圓盤狀、邊界鋸齒，在環面上重複排列。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('ammannbeenker', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`penrosestar`（潘洛斯星）使目前目錄991→992種，含plain的gallery為993項。深紫黑底上桃色的細線畫出一塊接近五重旋轉對稱的潘洛斯菱形拼貼補丁：與`penrosetiling`相同的德布魯因五重網格構造，但五個網格偏移取接近零的值`(0.011, −0.006, 0.004, −0.013, 0.004)`（和為0），拼貼會接近奇異（五重對稱）的情形——160個菱形（95個胖菱形、65個瘦菱形，約1.46 : 1）、345條邊、186個頂點，頂點的邊數從2到7，補丁是單連通的圓盤（歐拉示性數1）；345條邊中有258條（75%）在旋轉72°後仍與另一條邊重合，而`penrosetiling`的一般偏移補丁只有72/323（22%）。seed只把整塊補丁旋轉36°的整數倍（10種）；因為補丁接近對稱，旋轉後的差異很小。這只是一小塊補丁，不是無限的拼貼，也不是嚴格的五重對稱（75%而非100%）。與`penrosetiling`共用同一個sampler分支，只有preset不同。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；偏移`(0.011, −0.006, 0.004, −0.013, 0.004)`是我手選的接近零的值（我只試了這一組，沒有掃描其他偏移）、其餘數值沿用penrosetiling（補丁半徑6.2、線半徑0.09、gain 1.6、0.5 m nominal tile、relief 0.0007，未另外調整；512²maps法線tilt²最大0.0401）、桃色與深紫色調為作者設定（預覽只看了一版）。我第一次用探針量到72°旋轉重合率63%（探針把座標先四捨五入再解析，損失了精度），測試改用精確座標得到258/345（75%），並確認一般偏移的penrosetiling為72/323（22%）；文件採用精確座標的數字。測試中的結構檢查（菱形、邊、頂點個數、歐拉示性數、邊長、頂點邊數、胖瘦菱形數）同樣是構造自洽性的檢查，不是形式證明。

沿用`penrosetiling`的五重網格sampler分支（現在同時服務`penrosetiling`與`penrosestar`）：偏移取`(0.011, −0.006, 0.004, −0.013, 0.004)`，其餘建構與取樣流程相同——五個單位向量取五次單位根，對每一對網格與整數`(r, s)`（−6到6）解出交點、取`ceil(x·e_l − offsets[l])`得到菱形四角，保留中心距原點不超過6.2的菱形並以座標鍵去重共用邊（345條），整塊補丁依seed旋轉（0到9個36°）；取樣時對每條邊取點線距離，權重`(1 − d²/r²)²`（r = 0.09，C1）加總後以`1 − exp(−1.6·sum)`壓縮；顏色＝`0.06 + 0.78·thread + 0.03·(128²細grain − 0.5)`；height ＝ `0.85·thread + 0.15·grain`；線處roughness降低0.1；AO恆為1；金屬factor為0；cache合計345×4 + 128² = 17,764個Float64／142,112 B lattice算術預算（非總RAM）。預設0.5 m nominal tile與0.0007 UV-relative relief（非公尺位移）。每個取樣點走訪345條邊，沒有量測耗時，所以不宣稱效能數字。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占12.35%–12.36%、color 0.0453–0.0457至0.8515–0.8528、平均0.1507–0.1509、roughness 0.3–0.4、AO恆為1、height至多0.9857–0.9919 relief；512²取樣亮處占12.30%–12.32%、color 0.0451–0.0453至0.8525–0.8540、平均0.1507–0.1509、height至多0.9916–0.9968 relief；四個seed各自在恰好一個旋轉步（依序為第4、8、9、5步）下，補丁上每三個頂點的顏色與測試中獨立重寫的模型一致（最大誤差小於0.03，這是測試的判定門檻）；seed 0與1的亮區遮罩（512²）只有2.9%像素不同（旋轉144°的近對稱補丁）；seed 7的512²maps平均r／g／b約(63.9, 38.1, 43.0)、法線tilt²最大約0.0401、z分量最小252。我實看了預覽（seed 7）：深紫底上桃色的圓盤狀潘洛斯補丁，中心附近的星形比penrosetiling更對稱。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('penrosestar', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`penrosetiling`（潘洛斯拼貼）使目前目錄990→991種，含plain的gallery為992項。深藍黑底上淺藍色的細線畫出一塊潘洛斯（Penrose）菱形非週期拼貼：由德布魯因（de Bruijn）的五重網格（pentagrid）構造，每個網格交點對應一個菱形，共149個菱形（95個胖菱形72°／108°、54個瘦菱形36°／144°，比例約1.76 : 1）、323條單位長度的邊、175個頂點，頂點的邊數從2到7，補丁是單連通的圓盤（歐拉示性數V − E + F = 1）；補丁半徑為6.2個邊長，放在週期16個邊長的磚中央，四周留有空白、不會與相鄰拼貼相連；邊交會的頂點因權重相加而較亮。seed只把整塊補丁旋轉36°的整數倍（10種）。這只是潘洛斯拼貼的一小塊補丁，不是無限延伸的拼貼，也不是週期的拼貼；它在環面上是一塊獨立的圓盤。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；五個網格偏移`(0.13, −0.31, 0.22, 0.07, −0.11)`（和為0）、補丁半徑6.2、線的半徑0.09、gain 1.6、淡藍與深藍色調與0.5 m nominal tile皆作者設定（預覽只看了一版）。偏移是固定的，所以不同seed只改變旋轉，沒有改變拼貼本身。relief 0.0012時512²maps的法線tilt²最大為0.1000（z分量最小248），降到0.0007後為0.0378（253）。測試以另一份獨立重寫的五重網格程式確認結構（149個菱形、323條邊、175個頂點、歐拉示性數1、所有邊長為1、頂點邊數2到7、95個胖菱形與54個瘦菱形），這些性質本身也是對拼貼構造是否正確的獨立檢查，但不是對「這就是真正的潘洛斯拼貼」的形式證明。

新增專用sampler：建構時以五重網格構造產生補丁——五個單位向量`e_j`取五次單位根，網格`j`是`x·e_j = 整數 + offsets[j]`的直線，對每一對`(j, k)`與每一對整數`(r, s)`（−6到6），解出兩條線的交點`x`，其他三個索引取`ceil(x·e_l − offsets[l])`，`j`與`k`兩個索引取`r`、`r+1`與`s`、`s+1`，得到菱形的四個角`Σ K_l e_l`；只保留中心距原點不超過6.2的菱形，共用的邊以座標鍵去重（323條），再把整塊補丁依seed旋轉；每條邊以中點與半長向量儲存（4個Float64陣列）。每個取樣點把座標換到拼貼單位（週期16），對每條邊取點線距離，權重`(1 − d²/r²)²`（r = 0.09，在邊界上值與斜率為零，C1）加總，再以`1 − exp(−1.6·sum)`壓縮；顏色＝`0.06 + 0.78·thread + 0.03·(128²細grain − 0.5)`；height ＝ `0.85·thread + 0.15·grain`；線處roughness降低0.1；AO恆為1；金屬factor為0；cache合計323×4 + 128² = 17,676個Float64／141,408 B lattice算術預算（非總RAM；建構時的交點與去重表只在建構時存在）。預設0.5 m nominal tile與0.0007 UV-relative relief（非公尺位移）。每個取樣點走訪323條邊（半長之外直接略過），建構時走訪1,690個網格交點，兩者都沒有量測耗時，所以不宣稱效能數字。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占11.54%–11.60%、color 0.0454–0.0458至0.8512–0.8520、平均0.1450–0.1453、roughness 0.3–0.4、AO恆為1、height至多0.9811–0.9872 relief；512²取樣亮處占11.54%–11.55%、color 0.0451–0.0452至0.8526–0.8538、平均0.1451–0.1453、height至多0.9887–0.9967 relief；四個seed各自在恰好一個旋轉步（依序為第4、3、2、1步）下，補丁上每三個頂點的顏色與測試中獨立重寫的模型一致（最大誤差小於0.03，這是測試的判定門檻，我沒有逐seed記錄實際最大誤差）；seed 0與1的亮區遮罩（512²）12.7%像素不同；seed 7的512²maps平均r／g／b約(31.5, 44.6, 62.7)、法線tilt²最大約0.0378、z分量最小253。我實看了預覽（seed 7）：深藍底上淺藍色的潘洛斯菱形補丁，圓盤狀、邊界略有鋸齒，在環面上重複排列。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('penrosetiling', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`kagome`（籠目）使目前目錄989→990種，含plain的gallery為991項。深橄欖綠底上淺稻草色的細線畫出籠目（kagome）格子：把蜂巢每個六邊形的六條邊的中點依序連起來，得到三組互相交錯的直線，形成六邊形與正三角形交替的格子（竹籠的編法）；7欄×8列（56個蜂巢單元，共336條線段），水平與垂直週期比`7√3 : 12`（約1.04%的拉伸，所以不是正六邊形與正三角形）。兩條線段相交的頂點因權重相加而較亮。seed只把整張紋樣沿環面平移（1/64磚為單位）。這是示意的格子圖樣，不是真實竹籠的照片，也沒有表現上下交織。與`tulle`、`kikko`共用同一個蜂巢線段sampler分支，只有preset不同（新增`outer`與`innerDegrees`欄位）。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；內接六邊形半徑`√3/2`（正好連到邊的中點）、旋轉30°、線的半徑0.12、gain 1.8、稻草與橄欖綠色調與0.3 m nominal tile皆作者設定（預覽只看了一版）。relief沿用kikko的0.0009，未另外調整（512²maps法線tilt²最大0.0323）。共用分支新增`outer`（1或0，是否畫外框邊）與`innerDegrees`（內框旋轉角）欄位：`tulle`為`outer 1`、`innerDegrees 0`、`inner 0`，`kikko`為`outer 1`、`innerDegrees 0`，兩者的線段與行為不變，`Tulle as`與`Kikko as`的測試在這次修改後仍通過。

沿用蜂巢線段sampler分支（現在同時服務`tulle`、`kikko`與`kagome`）：建構時在尖頂蜂巢（寬`√3`、列距1.5）上，每個六邊形在`outer`為1時存下朝東、東北、西北三條外框邊；在`inner > 0`時再存下半徑`inner`、旋轉`innerDegrees`的同心六邊形的6條邊；籠目為`outer 0`、`inner √3/2`、`innerDegrees 30`，所以只有336條連接邊中點的線段（每條以中點與半長向量儲存，4個Float64陣列）；每個取樣點把座標換到蜂巢單位（水平週期`7√3`、垂直週期12），對每條線段取環面上最近鏡像的點線距離，權重`(1 − d²/r²)²`（r = 0.12，在邊界上值與斜率為零，C1）加總，再以`1 − exp(−1.8·sum)`壓縮；顏色＝`0.08 + 0.78·thread + 0.03·(128²細grain − 0.5)`；height ＝ `0.85·thread + 0.15·grain`；線處roughness降低0.1（基準0.6）；AO恆為1；金屬factor為0；cache合計336×4 + 128² = 17,728個Float64／141,824 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0009 UV-relative relief（非公尺位移）。每個取樣點走訪336條線段，沒有量測耗時，所以不宣稱效能數字。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占26.21%–26.29%、color 0.0653–0.0658至0.8712–0.8724、平均0.2644–0.2645、roughness 0.5001–0.6、AO恆為1、height至多0.9880–0.9905 relief；512²取樣亮處占25.94%–25.95%、color 0.0652至0.8728–0.8736、平均0.2652–0.2653、height至多0.9929–0.9958 relief；四個seed各自在恰好8個（64×64個候選中）環面平移下，48個取樣點的顏色與測試中獨立重寫的模型一致（最大誤差0.0120–0.0138，約等於細grain幅度），這8個平移正是蜂巢本身的平移對稱；seed 0與1的亮區遮罩（512²）29.4%像素不同；seed 7的512²maps平均r／g／b約(69.2, 78.9, 39.2)、法線tilt²最大約0.0323、z分量最小253。我實看了預覽（seed 7）：深橄欖綠底上淺色的三向直線格，形成六邊形與三角形。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('kagome', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`kikko`（龜甲紋）使目前目錄988→989種，含plain的gallery為990項。深棕色底上琥珀色的細線畫出龜甲形的六角蜂巢：尖頂六邊形的外框，每個六邊形中央再有一個半徑為外框一半的同心小六邊形；7欄×8列（56個六邊形，共504條線段：每格3條外框邊加6條內框邊），水平與垂直週期比`7√3 : 12`（六邊形約拉伸1.04%）。外框線在三線交會處因權重相加而較亮。seed只把整張紋樣沿環面平移（1/64磚為單位）。這是仿日本傳統龜甲紋的示意圖樣，不是真實龜甲或織品的照片。與`tulle`共用同一個蜂巢線段sampler分支，只有preset不同（新增`inner`欄位）。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；內框半徑為外框的0.5、線的半徑0.1、gain 1.8、琥珀與深棕色調與0.3 m nominal tile皆作者設定（預覽只看了一版）。relief 0.0012時512²maps的法線tilt²最大為0.0710（z分量最小250），降到0.0009後為0.0414（252）。共用分支新增`inner`欄位：`tulle`的`inner`為0、線段數仍是168，行為不變，`Tulle as`的測試在這次修改後仍通過。傳統龜甲紋常有花紋或更複雜的內部，這裡只有同心六邊形線。

沿用`tulle`的蜂巢線段sampler分支（現在同時服務`tulle`與`kikko`）：建構時在尖頂蜂巢（寬`√3`、列距1.5）上為每個六邊形存下朝東、東北、西北三條外框邊，並在`inner > 0`時再存下半徑`inner`（0.5）的同心六邊形的6條邊（每條邊以中點與半長向量儲存，共504條，4個Float64陣列）；每個取樣點把座標換到蜂巢單位（水平週期`7√3`、垂直週期12），對每條線段取環面上最近鏡像的點線距離，權重`(1 − d²/r²)²`（r = 0.1，在邊界上值與斜率為零，C1）加總，再以`1 − exp(−1.8·sum)`壓縮；顏色＝`0.08 + 0.78·thread + 0.03·(128²細grain − 0.5)`；height ＝ `0.85·thread + 0.15·grain`；線處roughness降低0.1（基準0.35）；AO恆為1；金屬factor為0；cache合計504×4 + 128² = 18,400個Float64／147,200 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0009 UV-relative relief（非公尺位移）。每個取樣點走訪504條線段（半長之外直接略過），沒有量測耗時，所以不宣稱效能數字。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占27.66%–27.72%、color 0.0654–0.0659至0.8663–0.8697、平均0.2772–0.2774、roughness 0.2505–0.35、AO恆為1、height至多0.9751–0.9895 relief（seed 0／1／0xffffffff）；512²取樣亮處占27.27%–27.29%、color 0.0651–0.0653至0.8684–0.8700、平均0.2773–0.2775、height至多0.9849–0.9917 relief；四個seed各自在恰好8個（64×64個候選中）環面平移下，48個取樣點的顏色與測試中獨立重寫的模型（含內框六邊形）一致（最大誤差0.0127–0.0144，約等於細grain幅度），這8個平移正是蜂巢本身的平移對稱；seed 0與1的亮區遮罩（512²）41.3%像素不同；seed 7的512²maps平均r／g／b約(92.4, 62.8, 23.8)、法線tilt²最大約0.0414、z分量最小252。我實看了預覽（seed 7）：深棕底上琥珀色的雙層六邊形（大六邊形套小六邊形）規則排列。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('kikko', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`vermiculation`（蟲跡雕紋）使目前目錄987→988種，含plain的gallery為989項。淺棕褐色的石面上刻有彎曲、分叉、互不相連的深色蠕蟲狀溝槽，仿建築石材的「蟲跡雕紋」（vermiculated rustication）：圖案來自週期性的Gray-Scott反應擴散在`feed 0.078`、`kill 0.061`的「蠕蟲」區間，溝槽占約35%的面積、約20到30條彼此分離，石面是單一連通的整體；溝槽處顏色較深、粗糙度較高（0.85 → 約0.93）、高度較低，石面帶細顆粒。seed改變反應擴散的初始擾動，所以每個seed的蟲跡排列都不同。與`turingmaze`共用同一個sampler分支，只有preset不同（以及新增的`baseHeight`欄位）。這是示意的石面紋理，不是真實石材的照片或掃描。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；`feed 0.078`、`kill 0.061`取自常見的Gray-Scott「蠕蟲」區間，我先用調查腳本在96×96、`seedCells 8`、6000與9000步下掃描12個seed（0到9、0xffffffff與12345），結果亮區占比35%–37%、24到31個連通元件、6000與9000步幾乎相同；其他數值（石色、溝槽深度、顆粒、0.4 m nominal tile、relief 0.0015）皆作者設定。為了讓溝槽比石面低，我在共用的sampler中新增`baseHeight`欄位：`height = baseHeight + ridgeHeight·ridge + grainHeight·grain`，`turingmaze`的`baseHeight`設為0，所以行為不變，`Turing maze as`的測試在這次修改後仍通過。512²maps的法線tilt²最大為0.0512（我沒有調整relief）。我也只掃描了這一組參數，沒有比較其他區間（例如coral：`feed 0.0545`、`kill 0.062`，在64×64的掃描中呈現單一連通網路）。

沿用`turingmaze`的sampler分支（現在同時服務`turingmaze`與`vermiculation`）：建構時以`grayScott(96, 8, 0.078, 0.061, 6000, seed)`在96×96的環面網格上做6000步反應擴散（只用加減乘，跨引擎位元相同；結果正規化到[0, 1]），再以`latticeField`建成C1的插值場；取樣時把座標以5×5的雜訊輕微扭曲（幅度0.05）後查表，以`0.5 + 0.5·tanh(9·(pattern − level))`（`level = 0.5 + 0.24·(7×7雜訊 − 0.5)`）切出溝槽，`ink = ridge·(0.85 + 0.15·7×7雜訊)`；顏色＝`0.9 − 0.75·ink + 0.06·(160²細grain − 0.5)`；height ＝ `0.7 − 0.55·ridge + 0.3·grain`；溝槽處roughness增加0.08（基準0.85）；AO恆為1；金屬factor為0；cache合計96² + 5² + 7² + 7² + 160² = 34,939個Float64／279,512 B lattice算術預算（非總RAM；反應擴散的暫存陣列只在建構時存在）。預設0.4 m nominal tile與0.0015 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，256²取樣）：溝槽（color<0.5）占34.76%–36.02%、石面（color>0.8）占58.33%–59.48%、溝槽的4連通元件22–28個、石面的連通元件恰為1個、溝槽邊緣的相鄰格對4,418–4,610對、color 0.1270–0.1331至0.9293–0.9297、平均0.6455–0.6528、roughness 0.85–0.9297、height至多0.9978–0.9990 relief；seed 0與1的溝槽遮罩（256²）46.8%像素不同；seed 7的512²maps平均r／g／b約(161.0, 146.5, 121.9)、r<128的像素占36.3%、法線tilt²最大約0.0512、z分量最小252。單次量測（bun於本機）：sampler建構（含反應擴散）每個seed約110–132 ms、512² maps約157 ms，只是4個seed與一次maps的單次量測，不是基準測試。我實看了預覽（seed 7）：淺棕褐色石面上深色的彎曲蟲狀溝槽，邊緣柔和。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('vermiculation', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`minkowskisausage`（閔考斯基香腸）使目前目錄986→987種，含plain的gallery為988項。深藍黑底上一條淡藍色細線，描出第2階二次科赫島（quadratic Koch island，又稱閔考斯基香腸）：從`F+F+F+F`（正方形）出發，把每個`F`取代為`F+F−F−FF+F+F−F`兩次，得到256個單位步、256個相異格點的簡單封閉迴圈（終點回到起點），外框約27×27格，放在36×36格的環面上，四周留有空白、不會與相鄰拼貼相連；線寬為三分之一格，線外有淡淡的光暈。seed只把整條曲線沿環面平移。這是示意的碎形走線，不是真實的香腸或地圖。與`dragoncurve`、`peanocurve`、`levycurve`共用同一個走線sampler分支，只有頂點串不同。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；階數2、36×36格環面、三分之一格線寬、tanh銳度8、淡藍與深藍色調與0.25 m nominal tile皆作者設定。階數3會有2,048步、外框約107×107格，超出這個走線分支使用的環面大小，所以只做到階數2。relief沿用dragoncurve的0.0008，未另外調整（512²maps法線tilt²最大為0.0492）。頂點串的取代規則我先以獨立小程式確認階數2的步數、相異格點數與外框，再決定環面大小。

沿用走線sampler分支（現在同時服務`dragoncurve`、`peanocurve`、`levycurve`與`minkowskisausage`）：閔考斯基模式下以turtle字串`F+F+F+F`、把每個`F`取代為`F+F-F-FF+F+F-F`兩次，`F`前進一格、`+`左轉90°、`−`右轉90°，得到257個頂點（最後一個回到起點）；在108×108的lattice上，格點放在每3個座標的位置（256個），相鄰兩格之間以2個連接node填滿（512個），亮node合計768個；曲線座標加上固定偏移(7, 7)與seed決定的環面平移；之後與dragoncurve相同：`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化，顏色＝`0.06 + 0.76·line + 0.1·glow·(1 − line) + 0.03·(128²細grain − 0.5)`，height ＝ `0.8·line + 0.2·grain`，線處roughness降低0.2（基準0.4），金屬factor為0；cache合計108² + 9² + 128² = 28,129個Float64／225,032 B lattice算術預算（非總RAM）。預設0.25 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，256²取樣）：亮處（color>0.5）占6.38%–6.43%、color 0.0458–0.0460至0.8331–0.8335、平均0.1113–0.1114、roughness 0.2001–0.3999、AO恆為1、height至多0.9887–0.9918 relief；四個seed的108×108 node盤面各自與測試中以區塊遞迴獨立寫出的曲線在唯一一個環面平移下完全一致（(28, 24)、(31, 33)、(30, 32)、(30, 29)；亮node皆為768）；seed 0與1的node盤面有9.8%不同；seed 7的512²maps平均r／g／b約(26.2, 31.2, 55.1)、法線tilt²最大約0.0492、z分量最小252。測試另外確認獨立曲線為257個頂點、終點等於起點、256個相異格點（簡單封閉迴圈）。我實看了預覽（seed 7）：深藍底上淡藍色的鋸齒狀十字形島嶼輪廓，在環面上重複排列。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('minkowskisausage', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`pisanotable`（皮薩諾週期表）使目前目錄985→986種，含plain的gallery為987項。48×48個圓角方塊磚，第(col, row)格代表整數`n = row × 48 + col + 1`（1到2304），色調依費波那契數列模`n`的皮薩諾週期（Pisano period）`π(n)`相對於上界`6n`的比值：`0.7·(π(n)/6n)^0.5`——`π(n)`只有在`n = 2·5^k`時達到上界`6n`（2304以內為10、50、250、1250四個，最亮），週期很短的`n`偏暗；開頭的週期是1、3、8、6、20、24、16、12、24、60、10、24。整體是看似雜訊、但由數論決定的方塊馬賽克。seed只把整張表沿環面平移。這是示意的數論圖案，不是真實材質。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；48×48格、色調`0.14 + 0.7·(π(n)/6n)^0.5`（指數0.5是我預先挑的，沒有比較其他指數）、珊瑚紅色調與0.3 m nominal tile皆作者設定。relief沿用既有表格類的0.0008，未另外調整（512²maps法線tilt²最大0.0280）。預覽上整體偏中間色調、對比不高，看起來像雜訊。seed差異測試只斷言「兩個seed的表有超過20%的格子色調差超過0.05」，沒有量測實際比例。建構時對每個`n`逐步產生模`n`的費波那契數對直到回到(0, 1)（最多`6n`步），我沒有量測這段建構時間，所以不宣稱效能數字。

沿用表格類磚的sampler寫法（與`mobiustable`同型）：建構時對每個`n ≤ 2304`逐步產生費波那契數列模`n`的數對`(F_k, F_{k+1})`直到回到`(0, 1)`得到週期`π(n)`，色調表（Float64）取`0.7·(π(n)/(6n))^0.5`；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.46格，在格界前恰好歸零，C1），顏色＝`0.04 + (0.14 + tone − 0.04)·mask + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`；磚縫AO為0.6；roughness恆為0.4；金屬factor為0；cache合計48² + 128² = 18,688個Float64／149,504 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占11.48%–11.56%、color 0.0257–0.0258至0.8505–0.8537、平均0.2850–0.2854、AO最低0.6、height至多0.8312–0.8380 relief（seed 0／1／0xffffffff）；512²取樣下亮處占11.38%–11.55%、color 0.0252–0.0255至0.8526–0.8540、平均0.2853–0.2859、roughness恆為0.4、AO最低0.6、height至多0.8349–0.8448 relief；2,304個磚中心的顏色與測試中獨立以數對產生法寫出的週期表在唯一一個環面平移下一致（(41, 2)、(9, 30)、(12, 32)、(22, 22)；最大誤差約0.0149–0.0150，約等於細grain幅度）；seed 0與1的亮區遮罩（512²）19.3%像素不同；seed 7的512²maps平均r／g／b約(91.3, 48.5, 41.4)、法線tilt²最大約0.0280、z分量最小253。測試另外確認開頭12個週期與達到上界`6n`的`n`（10、50、250、1250）。我實看了預覽（seed 7）：深紅褐底上深淺不一的珊瑚色方塊，近似雜訊。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('pisanotable', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`mobiustable`（莫比烏斯表）使目前目錄984→985種，含plain的gallery為986項。48×48個圓角方塊磚，第(col, row)格代表整數`n = row × 48 + col + 1`（1到2304），色調依莫比烏斯函數`μ(n)`分三類：`n`被某個平方數整除時`μ = 0`（暗，904個）、`n`是偶數個相異質數的乘積時`μ = +1`（亮紫，699個，含`n = 1`）、奇數個時`μ = −1`（中間的灰紫，701個）；因為每列48格是4的倍數，4的倍數所在的欄全是暗格，形成暗直條。seed只把整張表沿環面平移。這是示意的數論圖案，不是真實材質。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；48×48格、三類色調`0.14 + 0.08`／`0.14 + 0.7`／`0.14 + 0.38`、紫色調與0.3 m nominal tile皆作者設定。relief沿用既有表格類的0.0008，未另外調整（512²maps法線tilt²最大0.0296）。這個材質的seed差異測試只斷言「兩個seed的表有超過20%的格子色調差超過0.05」，我沒有量測實際比例。

沿用表格類磚的sampler寫法（與`abundantnumbers`同型）：建構時對每個`n ≤ 2304`以試除法找出相異質因數個數與是否有平方因子，填入色調表（`μ = 0`→0.08、`μ = +1`→0.7、`μ = −1`→0.38，Float64）；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.46格，在格界前恰好歸零，C1），顏色＝`0.04 + (0.14 + tone − 0.04)·mask + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`；磚縫AO為0.6；roughness恆為0.4；金屬factor為0；cache合計48² + 128² = 18,688個Float64／149,504 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占42.45%–42.47%、color 0.0256–0.0259至0.8536–0.8541、平均0.3702–0.3706、AO最低0.6、height至多0.8460–0.8486 relief（seed 0／1／0xffffffff）；512²取樣下亮處占42.65%–42.69%、color 0.0252–0.0253至0.8545–0.8547、平均0.3719–0.3720、roughness恆為0.4、AO最低0.6、height至多0.8485–0.8498 relief；2,304個磚中心的顏色與測試中以完整質因數分解獨立算出的`μ(n)`表在唯一一個環面平移下一致（(6, 7)、(8, 21)、(39, 45)、(8, 28)；最大誤差約0.0149–0.0150，約等於細grain幅度）；seed 0與1的亮區遮罩（512²）40.7%像素不同；seed 7的512²maps平均r／g／b約(86.9, 72.0, 113.7)、法線tilt²最大約0.0296、z分量最小253。我實看了預覽（seed 7）：深紫底上亮紫與灰紫的方塊，有暗直條。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('mobiustable', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`abundantnumbers`（盈數表）使目前目錄983→984種，含plain的gallery為985項。48×48個圓角方塊磚，第(col, row)格代表整數`n = row × 48 + col + 1`（1到2304），色調依`σ(n)`（`n`的所有正因數之和）與`2n`的比較分三類：虧數（`σ(n) < 2n`，1,732個）偏暗、盈數（`σ(n) > 2n`，569個）較亮、完全數（`σ(n) = 2n`，6、28、496共3個）最亮；因為每列48格是12與6的倍數，盈數（如12、18、20、24、…）排成明顯的亮直條，其餘零星亮點多為其他盈數。seed只把整張表沿環面平移。這是示意的數論圖案，不是真實材質。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；48×48格、三類色調`0.14 + 0.1`／`0.14 + 0.55`／`0.14 + 0.7`、青銅色調與0.3 m nominal tile皆作者設定。relief沿用既有表格類的0.0008，未另外調整（512²maps法線tilt²最大0.0296）。我預先寫的「兩個seed表的差異格數>20%」斷言失敗（實測8.9%）：seed 0與1的平移差(12, 6)，而盈數的結構以12與6為週期，所以大多數格子換了位置仍是同一類；我改為依實測訂定的區間（6%–12%）並在測試中註明原因。完全數只有3格，預覽上不容易和一般盈數區分。

沿用表格類磚的sampler寫法（與`xortable`同型）：建構時以篩法累加每個`n ≤ 2304`的因數和`σ(n)`（暫存於Float64陣列，建構後不保留），依`σ(n)`與`2n`分類填入色調表（虧數0.1、盈數0.55、完全數0.7，Float64）；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.46格，在格界前恰好歸零，C1），顏色＝`0.04 + (0.14 + tone − 0.04)·mask + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`；磚縫AO為0.6；roughness恆為0.4；金屬factor為0；cache合計48² + 128² = 18,688個Float64／149,504 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占17.04%–18.24%（seed 0／1／0xffffffff）、color 0.0255–0.0261至0.8503–0.8506、平均0.2612–0.2672、AO最低0.6、height至多0.8325–0.8388 relief；512²取樣下亮處占17.48%–18.01%、color 0.0252–0.0254至0.8520–0.8536、平均0.2644–0.2665、roughness恆為0.4、AO最低0.6、height至多0.8346–0.8473 relief；2,304個磚中心的顏色與測試中以試除法獨立算出的分類表在唯一一個環面平移下一致（(46, 30)、(34, 24)、(27, 38)、(10, 15)；最大誤差約0.0149–0.0150，約等於細grain幅度）；seed 0與1的亮區遮罩（512²）6.1%像素不同；seed 7的512²maps平均r／g／b約(84.1, 62.1, 36.4)、法線tilt²最大約0.0296、z分量最小253。我實看了預覽（seed 7）：深褐底上青銅色的亮直條與零星亮點。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('abundantnumbers', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`xortable`（互斥或表）使目前目錄982→983種，含plain的gallery為984項。64×64個圓角方塊磚，第(row, col)格的色調正比於`row XOR col`（按位元互斥或）除以63：主對角線（`row = col`，結果為0）最暗，`row XOR col`越大越亮、最亮是黃綠色（萊姆綠）；圖案由二進位位元形成巢狀、類似謝爾賓斯基的方塊（經典的「XOR texture」，亦即尼姆和表）。seed只把整張表沿環面平移。這是示意的數學圖案，不是真實材質。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；64×64格、色調`0.14 + 0.7·(row XOR col)/63`、萊姆綠與深綠色調與0.3 m nominal tile皆作者設定。relief沿用既有表格類的0.0008，未另外調整（512²maps法線tilt²最大0.0378）。我預先猜測每個seed只會有一個符合的環面平移，探針顯示是2個：`(row + 32) XOR (col + 32)`與`row XOR col`相同（兩軸同時加32只會翻轉第5位元兩次），所以測試斷言恰有兩個符合的平移且彼此差`(32, 32)`。另外256²取樣下每格只有4個取樣點、不會落在磚縫中心，最暗color（0.0602–0.0607）與AO最低（0.7344）和512²取樣（0.0251–0.0254與0.6）不同。

沿用表格類磚的sampler寫法（與`hadamardmatrix`同型）：建構時以`0.7·(row ^ col)/63`填入色調表（Float64）；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.46格，在格界前恰好歸零，C1），顏色＝`0.04 + (0.14 + tone − 0.04)·mask + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`；磚縫AO為0.6；roughness恆為0.4；金屬factor為0；cache合計64² + 128² = 20,480個Float64／163,840 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占36.40%–36.46%、color 0.0602–0.0607至0.8538–0.8541、平均0.4153–0.4154、AO最低0.7344、height至多0.8453–0.8484 relief（seed 0／1／0xffffffff）；512²取樣下亮處占29.12%–29.20%、color 0.0251–0.0254至0.8538–0.8548、平均0.3593–0.3594、roughness恆為0.4、AO最低0.6、height至多0.8478–0.8506 relief；4,096個磚中心的顏色與測試中獨立寫出的表在恰好2個環面平移下一致（彼此差(32, 32)；第一個平移依序為(52, 2)、(14, 2)、(6, 24)、(46, 2)；最大誤差約0.0150，約等於細grain幅度）；seed 0與1的亮區遮罩（512²）48.4%像素不同；seed 7的512²maps平均r／g／b約(73.4, 101.9, 49.5)、法線tilt²最大約0.0378、z分量最小253。我實看了預覽（seed 7）：萊姆綠由深到亮的巢狀方塊，呈經典的XOR texture外觀。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('xortable', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`paleytable`（佩利表）使目前目錄981→982種，含plain的gallery為983項。61×61個圓角方塊磚，第(row, col)格是`col − row`對質數61的勒壤得符號（Legendre symbol，Paley構造）：差為0（對角線）取中間色調、差是61的非零平方剩餘（共30個）取亮玫瑰粉、不是平方剩餘取暗紫紅；因為61 ≡ 1 (mod 4)，符號是對稱的，且表只依賴`col − row`，所以整張表沿對角線方向呈現平行的帶狀圖案，並在環面上無縫重複。seed只把整張表沿環面平移，而平移只有`(sx − sy) mod 61`有差別。這是示意的數論圖案，不是真實材質。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；61×61格、殘餘／非殘餘／零的色調`0.14 + 0.7`／`0.14 + 0.1`／`0.14 + 0.4`、玫瑰粉與深紫色調與0.3 m nominal tile皆作者設定。relief沿用既有表格類的0.0008，未另外調整（512²maps法線tilt²最大0.0378）。我預先猜測每個seed只會有一個符合的環面平移，探針顯示實際是61個（表只依賴`col − row`），測試改為斷言這個結構：61個平移的`sx − sy`皆相同，且四個seed的`(sx − sy) mod 61`各不相同。預覽（512²）每格約8像素，圖案呈斜向帶狀，我沒有逐格目視核對。

沿用表格類磚的sampler寫法（與`hadamardmatrix`同型）：建構時以暴力平方法算出61的非零平方剩餘集合（共30個），每格依`(col − row) mod 61`決定色調（0→0.4、剩餘→0.7、非剩餘→0.1，Float64表）；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.46格，在格界前恰好歸零，C1），顏色＝`0.04 + (0.14 + tone − 0.04)·mask + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`；磚縫AO為0.6；roughness恆為0.4；金屬factor為0；cache合計61² + 128² = 20,105個Float64／160,840 B lattice算術預算（非總RAM；平方剩餘集合只在建構時存在）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占36.34%–36.42%、color 0.0252–0.0259至0.8541–0.8545、平均0.4012–0.4014、AO最低0.6、height至多0.8478–0.8486 relief；512²取樣下亮處占36.35%–36.36%、color 0.0251–0.0254至0.8547–0.8549、平均0.4011–0.4014、roughness恆為0.4、AO最低0.6、height至多0.8494–0.8504 relief；3,721個磚中心的顏色與測試中獨立寫出的表在恰好61個環面平移下一致（它們的`sx − sy`皆相同，四個seed的`(sx − sy) mod 61`依序為51、59、10、23；最大誤差約0.0148–0.0149，約等於細grain幅度）；seed 0與1的亮區遮罩（512²）37.5%像素不同；seed 7的512²maps平均r／g／b約(116.7, 83.5, 99.1)、法線tilt²最大約0.0378、z分量最小253。測試另外確認三種色調的格數（零61個、殘餘與非殘餘各1,830個）。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('paleytable', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`hadamardmatrix`（阿達馬矩陣）使目前目錄980→981種，含plain的gallery為982項。64×64個圓角方塊磚，第(row, col)格是Sylvester型阿達馬矩陣的第(row, col)項：`row`與`col`的二進位按位元相與後，1的個數為偶數時是+1（亮冷白）、奇數時是−1（暗藍灰）；第0列與第0欄全為+1，其餘每列的+1與−1各占一半（4,096項中有2,016項是−1），整體由巢狀的2×2區塊組成。seed只把整張表沿環面平移。這是示意的數學矩陣圖案，不是真實材質。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；64×64格、+1／−1的色調`0.14 + 0.7`／`0.14 + 0.1`、冷白與深藍色調與0.3 m nominal tile皆作者設定。relief沿用既有表格類的0.0008，未另外調整（512²maps法線tilt²最大0.0378）。測試的256²取樣每格只有4個取樣點，且全部落在磚面上、不會落在磚縫中心，所以256²的最暗color 0.0927–0.0936、AO最低0.7344，與512²取樣的0.0251–0.0253與0.6不同；我最初沿用其他表格類測試的「AO最低等於1 − gapOcclusion」斷言，改為256²取樣的區間，並另外在四格交會角落（1/64, 1/64）取樣確認AO恰為0.6。

沿用表格類磚的sampler寫法（與`divisorcount`同型）：建構時以`popcount(row & col)`的奇偶決定每格色調（偶數→0.7、奇數→0.1，Float64表）；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.46格，在格界前恰好歸零，C1），顏色＝`0.04 + (0.14 + tone − 0.04)·mask + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`；磚縫AO為0.6（`1 − 0.4·(1 − mask)`）；roughness恆為0.4；金屬factor為0；cache合計64² + 128² = 20,480個Float64／163,840 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占38.09%（四個seed完全相同：seed平移是整格，在256²取樣上等於整數個取樣點的平移）、color 0.0927–0.0936至0.8542–0.8545、平均0.4608–0.4610、AO最低0.7344、height至多0.8487–0.8497 relief；512²取樣下亮處占34.91%（四個seed相同）、color 0.0251–0.0253至0.8547–0.8549、平均0.3980–0.3981、roughness恆為0.4、AO最低0.6、height至多0.8504–0.8509 relief；4,096個磚中心的顏色與測試中獨立寫出的阿達馬矩陣在唯一一個環面平移下一致（(41, 29)、(0, 18)、(34, 7)、(41, 51)，最大誤差約0.0150，約等於細grain的幅度）；seed 0與1的亮區遮罩（512²）34.1%像素不同；seed 7的512²maps平均r／g／b約(97.6, 99.5, 115.9)、法線tilt²最大約0.0378、z分量最小253。我實看了預覽（seed 7）：冷白與暗藍灰的圓角方塊組成細密、帶斜向條紋感的圖案，我沒有從預覽辨認出巢狀的2×2區塊結構（逐磚的正確性由上述測試比對確認，不是靠目視）。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('hadamardmatrix', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`levycurve`（列維曲線）使目前目錄979→980種，含plain的gallery為981項。深青黑底上一條薄荷綠細線，描出第9階列維C曲線（Lévy C curve）：512個單位步，第`k`步的方向是`i^popcount(k)`（`popcount`為`k`二進位中1的個數，方向依序為東、北、西、南），共416個相異格點與462條相異邊——有50步會沿著已走過的邊折返，所以有些線段是被重複描繪的；外框約39×39格，放在48×48格的環面上，四周留有空白、不會與相鄰拼貼相連；線寬為三分之一格，線外有淡淡的光暈。seed只把整條曲線沿環面平移。這是示意的碎形走線，曲線不封閉。與`dragoncurve`、`peanocurve`共用同一個走線sampler分支，只有頂點串不同。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；階數9、48×48格環面、三分之一格線寬、tanh銳度8、薄荷綠與深青色調與0.25 m nominal tile皆作者設定。relief沿用dragoncurve的0.0008，未另外調整（512²maps的法線tilt²最大為0.0543）。頂點串的方向規則我先以獨立的小程式確認格點與邊的個數（階數9：416個相異格點、462條相異邊、外框x −7至31、y −15至23），再決定環面大小與偏移。

沿用`dragoncurve`的sampler分支（現在同時服務`dragoncurve`、`peanocurve`與`levycurve`）：列維模式下從(0, 0)出發，第`k`步（`k = 0 … 511`）依`popcount(k) mod 4`選擇東、北、西、南前進一格；在144×144的lattice上，格點放在每3個座標的位置（416個），相鄰兩格之間以2個連接node填滿（重複走過的邊只是重複標記，共924個），亮node合計1,340個；曲線座標加上固定偏移(8, 16)與seed決定的環面平移；之後與dragoncurve相同：`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化，顏色＝`0.06 + 0.76·line + 0.1·glow·(1 − line) + 0.03·(128²細grain − 0.5)`，height ＝ `0.8·line + 0.2·grain`，線處roughness降低0.2（基準0.4），金屬factor為0；cache合計144² + 9² + 128² = 37,201個Float64／297,608 B lattice算術預算（非總RAM）。預設0.25 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，256²取樣）：亮處（color>0.5）占7.08%–7.12%、color 0.0457–0.0459至0.8328–0.8339、平均0.1109–0.1112、roughness 0.2001–0.3999、AO恆為1、height至多0.9872–0.9944 relief；四個seed的144×144 node盤面各自與測試中獨立以位元計數寫出的列維曲線在唯一一個環面平移下完全一致（(26, 39)、(12, 40)、(40, 7)、(29, 40)；亮node皆為1,340）；seed 0與1的node盤面有11.3%不同；seed 7的512²maps平均r／g／b約(16.8, 46.0, 43.5)、法線tilt²最大約0.0543、z分量最小252。測試另外確認獨立曲線的416個相異格點與462條相異邊。我實看了預覽（seed 7）：深青底上薄荷綠的列維C曲線輪廓（有小方框與缺口的C形），在環面上重複排列、被seed的平移切在圖的邊緣。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('levycurve', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`tulle`（薄紗網）使目前目錄978→979種，含plain的gallery為980項。深紫黑底上一張由細小的象牙白線編成的六角蜂巢網：尖頂六邊形，每個格子外接圓半徑為1，7欄×8列（共56個六邊形、168條線段，每條邊只存一次）鋪滿整張磚；線是緊湊支撐的二次曲線輪廓，三條線交會的節點加總後較亮，像網結。為了讓蜂巢能整齊鋪滿方形的環面，水平與垂直的週期比為`7√3 : 12`，六邊形約有1.04%的拉伸（非正六邊形）。seed只把整張網沿環面平移（1/64磚為單位）。這是示意的網眼紡織品，不是真實薄紗的照片，也沒有半透明（深色底只是網眼的底色）。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；7欄×4組列、線的半徑0.15、gain 1.8、象牙白與深紫色調與0.3 m nominal tile皆作者設定。調整紀錄：第一版線半徑0.2、gain 1.5，預覽上線偏粗，改成0.15與1.8後採用（只看了這兩版預覽）；relief 0.0015時512²maps的法線tilt²最大為0.0643，降到0.0012後為0.0424（z分量最小251→252）。探針第一次的獨立模型有bug（邊去重的鍵寫錯，得到176條而不是168條線段），那次seed 0xffffffff找不到符合的平移；修正去重後四個seed都有符合的平移。

新增專用sampler：建構時在尖頂蜂巢（寬`√3`、列距1.5）上為每個六邊形存下朝東、東北、西北三條邊（每條邊以中點與半長向量儲存，共168條，4個Float64陣列）；每個取樣點把座標換到蜂巢單位（水平週期`7√3`、垂直週期12），對每條線段取環面上最近鏡像的點線距離，權重`(1 − d²/r²)²`（r = 0.15，在邊界上值與斜率為零，C1）加總，再以`1 − exp(−1.8·sum)`壓縮；顏色＝`0.08 + 0.78·thread + 0.03·(128²細grain − 0.5)`；height ＝ `0.85·thread + 0.15·grain`；線處roughness降低0.1（基準0.65）；AO恆為1；金屬factor為0；cache合計168×4 + 128² = 17,056個Float64／136,448 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0012 UV-relative relief（非公尺位移）。每個取樣點走訪168條線段（半長之外直接略過），沒有量測耗時，所以不宣稱效能數字。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占19.57%–19.59%、color 0.0651–0.0657至0.8686–0.8695、平均0.2215–0.2217、roughness 0.5505–0.65、AO恆為1、height至多0.9827–0.9866 relief（512²取樣亮處占19.65%–19.66%）；四個seed各自在恰好8個（64×64個候選中）環面平移下，48個取樣點的顏色與測試中獨立重寫的蜂巢模型一致（最大誤差0.0113–0.0138，約等於細grain幅度），這8個平移正是蜂巢本身的平移對稱（x模32與y模8固定）；seed 0與1的亮區遮罩（512²）33.8%像素不同；seed 7的512²maps平均r／g／b約(74.7, 69.8, 74.3)、法線tilt²最大約0.0424、z分量最小252。我實看了預覽（seed 7）：深色底上整齊的象牙白蜂巢細線，線結略亮。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('tulle', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`sacksspiral`（薩克斯螺旋）使目前目錄977→978種，含plain的gallery為979項。深藍黑底上，整數1到500依薩克斯螺旋（Sacks spiral）排成點陣：整數`n`放在阿基米德螺線上半徑`0.45·√(n/500)`（以磚為單位1）、角度`2π√n`處，所以完全平方數排成同一條射線；質數（共95個）是亮金色圓點，合成數是暗淡的金棕色圓點，質數沿著幾條彎曲的臂特別密集。螺旋在整張磚中央，外緣不超出磚邊，所以磚間沒有交疊；在環面上每張磚各有一個圓盤狀的螺旋。seed只把整個螺旋旋轉整數度（0到359度）。這是示意的數論圖案，不是星圖或照片。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；500個整數、半徑0.45、圓點半徑0.014、金色與深藍色調與0.4 m nominal tile皆作者設定。調整紀錄：第一版（圓點半徑0.012、質數色調0.7、合成數色調0.2、gain 2、relief 0.0008）在預覽上圓點偏小偏暗，探針量到最亮0.667、平均0.077、512²maps法線tilt²最大只有0.0048；改成圓點半徑0.014、質數色調0.85、合成數色調0.3、gain 3、relief 0.002後最亮0.871、平均0.111、tilt²最大0.0441，兩版的旋轉比對結果（每個seed唯一的整數度）不變。

新增專用sampler：建構時以試除法判斷`n = 1 … 500`是否為質數，並把每個整數的位置存成兩個Float64陣列（再加一個Uint8質數旗標）；每個整數擁有一個緊湊支撐的四次方圓點（權重`(1 − d²/r²)²`，半徑0.014，在邊界上值與斜率皆為零，C1），質數與合成數各自加總，再以`1 − exp(−3·sum)`壓縮到[0, 1)；顏色＝`0.05 + 0.85·質數圓點 + 0.3·合成數圓點·(1 − 質數圓點) + 0.03·(128²細grain − 0.5)`；height ＝ `0.6·質數圓點 + 0.25·合成數圓點·(1 − 質數圓點) + 0.1·grain`；質數處roughness降低0.15（基準0.4）；AO恆為1；金屬factor為0；cache合計500×2 + 128² = 17,384個Float64（139,072 B）＋500 B質數旗標，皆為lattice算術預算（非總RAM）。每個取樣點要走訪500個整數（半徑外直接略過），我沒有量測它在512²下的耗時，所以不宣稱效能數字。預設0.4 m nominal tile與0.002 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7）：256²取樣下亮處（color>0.5）占2.93%–2.96%、color 0.0355–0.0358至0.8670–0.8696、平均0.1114–0.1115、roughness 0.2575–0.4、AO恆為1、height至多0.6547–0.6647 relief（512²取樣的亮處占2.94%–2.95%）；四個seed各自在唯一一個整數度旋轉（298°、161°、4°、107°）下，500個圓點中心的顏色都與測試中獨立重寫的模型一致（最大誤差0.0143–0.0148，約等於細grain幅度）；seed 7的512²maps平均r／g／b約(33.7, 32.8, 37.1)、法線tilt²最大約0.0441、z分量最小252。我實看了預覽（seed 7）：深藍底上金色的螺旋圓盤，彎曲的亮臂清晰，每張磚一個圓盤。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('sacksspiral', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`peanocurve`（皮亞諾曲線）使目前目錄976→977種，含plain的gallery為978項。深藍黑底上一條粉紅色細線，走的是第3階皮亞諾空間填充曲線：27×27個格子每格恰好經過一次（728步，共2,185個亮node），由一個角落（0, 0）蛇形走到對角（26, 26），放在32×32格的環面上，四周留有5格寬的空白、不會與相鄰拼貼相連；線寬為三分之一格，線外有淡淡的光暈。seed只把整條曲線沿環面平移。這是示意的碎形走線，不是真實電路板，曲線不封閉。與`dragoncurve`共用同一個走線sampler分支，只有頂點串不同。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；階數3、32×32格環面、三分之一格線寬、tanh銳度8、粉紅與深藍色調與0.25 m nominal tile皆作者設定。調整紀錄：第一版以三進位數字翻轉公式產生頂點，我把第二軸的翻轉判斷少算了當前這組的第一個數字，預覽上線段不連續（只有直線段）；修正為「y數字在x數字（含同組）之和為奇數時翻轉」後預覽出現連續的皮亞諾曲線。relief沿用dragoncurve的0.0008，未另外調整（512²maps的法線tilt²最大為0.0468）。

沿用`dragoncurve`的sampler分支（現在同時服務`peanocurve`）：皮亞諾模式下以0到728的三進位索引產生頂點，x數字取偶數位、y數字取奇數位，x數字在其前面y數字之和為奇數時取`2 − 數字`、y數字在含同組的x數字之和為奇數時取`2 − 數字`；在96×96的lattice上，格點放在每3個座標的位置（729個），相鄰兩格之間以2個連接node填滿（1,456個），亮node合計2,185個；曲線座標加上固定偏移(2, 2)與seed決定的環面平移；之後與dragoncurve相同：`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化，顏色＝`0.06 + 0.76·line + 0.1·glow·(1 − line) + 0.03·(128²細grain − 0.5)`，height ＝ `0.8·line + 0.2·grain`，線處roughness降低0.2（基準0.4），金屬factor為0；cache合計96² + 9² + 128² = 25,681個Float64／205,448 B lattice算術預算（非總RAM）。預設0.25 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，256²取樣）：亮處（color>0.5）占18.33%（四個seed完全相同：seed平移是整格，在256²取樣上等於整數個取樣點的平移）、color 0.0457–0.0461至0.8331–0.8336、平均0.2272–0.2273、roughness 0.2001–0.3999、AO恆為1、height至多0.9913–0.9952 relief；四個seed的96×96 node盤面各自與測試中以區塊遞迴獨立建構的皮亞諾曲線在唯一一個環面平移下完全一致（(0, 4)、(23, 28)、(21, 27)、(24, 29)；亮node皆為2,185）；seed 0與1的node盤面有23.8%不同；seed 7的512²maps平均r／g／b約(70.3, 45.6, 72.0)、法線tilt²最大約0.0468、z分量最小252。測試另外確認遞迴所得的729個頂點相異且相鄰頂點的曼哈頓距離恆為1。我實看了預覽（seed 7）：深藍底上粉紅色的連續蛇形走線，在環面上重複排列。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('peanocurve', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`divisorcount`（因數個數表）使目前目錄975→976種，含plain的gallery為977項。48×48個圓角方塊磚，第(col, row)格代表整數`n = row × 48 + col + 1`（1到2304），色調依`n`的因數個數`d(n)`而定：質數（`d = 2`，共342個）偏暗，因數多的合成數（高合成數）發亮，表中最大的`d`是40（`n = 1680`）；因為每列48格是12的倍數，12的倍數所在的欄會連成明顯的亮直條，6、4等的倍數則形成較淡的直條。seed只把整張表沿環面平移，所以統計不變、位置改變。這是示意的數論表，不是礦物或材質照片。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；48×48格、色調`0.14 + 0.7·(d(n)/40)^0.75`、青綠色調與0.3 m nominal tile皆作者設定。調整紀錄：第一版色調用開平方（指數0.5），預覽上大部分格子色調太接近、整體偏單調，改為指數0.75（新增`toneExponent`欄位）後採用；我只看了這兩版預覽，沒有掃描其他指數。

新增專用sampler：建構時以篩法累加每個`n ≤ 2304`的因數個數（對每個`k`把`k`的倍數加1，暫存於Int32Array，建構後不保留），色調表（Float64）取`0.7·(d(n)/最大d)^0.75`；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.46格，在格界前恰好歸零，C1），顏色＝`0.04 + (0.14 + tone − 0.04)·mask + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`；磚縫AO為0.6（`1 − 0.4·(1 − mask)`）；roughness恆為0.4；金屬factor為0；cache合計48² + 128² = 18,688個Float64／149,504 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，256²取樣）：亮處（color>0.5）占5.58%–6.13%、color 0.0252–0.0258至0.8466–0.8502、平均0.2529–0.2565、roughness恆為0.4、AO最低0.6、height至多0.8372–0.8389 relief；512²取樣下seed 0／1／0xffffffff／7的亮處占5.70%–5.98%；2,304個磚中心的顏色與測試中獨立以試除法算出的因數個數表在唯一一個環面平移下一致（(6, 14)、(45, 46)、(4, 3)、(43, 5)，最大誤差約0.0149–0.0150，約等於細grain的幅度）；seed 0與1的亮區遮罩（512²）11.3%像素不同；seed 7的512²maps平均r／g／b約(41.4, 75.7, 78.2)、法線tilt²最大約0.0280、z分量最小253。我實看了預覽（seed 7）：深青綠色的像素格，以亮直條為主。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('divisorcount', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`dragoncurve`（龍形曲線）使目前目錄974→975種，含plain的gallery為976項。深紫黑底上一條金黃色的細線，描出第9階海威（Heighway）龍形曲線：512個單位步，轉向依規則的摺紙序列（第`k = 2^m(2j+1)`步在j為偶數時左轉、奇數時右轉），曲線與自己在格點上相碰但不共用邊（共361個相異格點、512條邊），外框約27×32格，放在40×40格的環面上，所以四周有空白、不會與相鄰拼貼相連；線寬為三分之一格，線外有淡淡的光暈。seed只把整條曲線沿環面平移。這是示意的碎形走線，不是摺紙實物，也不封閉。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；階數9、40×40格環面、三分之一格線寬、tanh銳度8、金黃與深紫色調與0.25 m nominal tile皆作者設定。調整紀錄：第一版線寬為半格（lattice每格2個node），預覽上相鄰線幾乎連成一片，改成每格3個node（線寬三分之一格）；改寬度時我只改了連接點的座標，漏改格點座標，預覽出現大片只有點的區域，探針量到亮node 1,376個、預期1,385個，修正格點座標後為1,385個。relief 0.0015時512²maps的法線tilt²最大為0.1602、法線z分量最小244，降到0.0008後為0.0517與252（同一批探針的前後值）。

新增專用sampler：建構時以摺紙序列逐步走出512步，在120×120的lattice上，格點放在每3個座標的位置（共361個），相鄰兩格之間以2個連接node填滿（共1,024個），亮node合計1,385個；曲線座標加上固定偏移(9, 10)與seed決定的環面平移；用`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化；顏色＝`0.06 + 0.76·line + 0.1·glow·(1 − line) + 0.03·(128²細grain − 0.5)`，其中`glow`是未銳化的混合值乘上`(1 − 0.14·9×9雜訊)`；height ＝ `0.8·line + 0.2·grain`；線處roughness降低0.2（基準0.4）；金屬factor為0；cache合計120² + 9² + 128² = 30,865個Float64／246,920 B lattice算術預算（非總RAM）。預設0.25 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，256²取樣）：亮處（color>0.5）占9.38%–9.44%、color 0.0457–0.0460至0.8329–0.8337、平均0.1359–0.1361、roughness 0.2001–0.3999、AO恆為1、height至多0.9871–0.9940 relief；四個seed的120×120 node盤面各自與測試中獨立重寫的龍形曲線在唯一一個環面平移下完全一致（(11, 27)、(38, 16)、(6, 16)、(13, 25)；亮node皆為1,385）；seed 0與1的node盤面有16.0%不同；seed 7的512²maps平均r／g／b約(48.5, 34.3, 37.8)、法線tilt²最大約0.0517。我實看了預覽（seed 7）：深紫底上金黃色的格網狀龍形線，環面上重複排列。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('dragoncurve', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`juliatiles`（朱利亞集合磚）使目前目錄973→974種，含plain的gallery為975項。64×64個圓角方塊磚組成的朱利亞集合（Julia set，`c = −0.8 + 0.156i`）鑲嵌：第(col, row)格以複平面（實部與虛部皆−1.6到1.6）中該格中心點作為`z₀`，迭代`z → z² + c`，色調是逃逸迭代次數（`|z| > 2`，最多64次）除以64後開平方，由暗紅褐（快逃逸）到亮橙（逃逸前迭代次數多，位於集合邊界附近）；永不逃逸的格子（共404個，約9.9%）是最暗的深褐黑。磚面凸起、磚縫較暗並帶遮蔽（AO），seed只把整張表沿環面平移。解析度只有64×64，所以是像素風的朱利亞集合；與`mandelbrottiles`共用同一個sampler分支，只是起點與常數不同。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；64×64格、視窗範圍−1.6到1.6、常數c = −0.8 + 0.156i、64次迭代上限、開平方的色調映射、紅褐與橙色調與0.3 m nominal tile皆作者設定。預覽第一次就採用，relief 0.0008沿用mandelbrottiles的調整結果，沒有再調整。

沿用`mandelbrottiles`的sampler分支（現在同時服務`juliatiles`）：朱利亞模式下`z₀`是格中心的複數、`c`是固定常數（−0.8 + 0.156i），迭代`z → z² + c`直到`|z|² > 4`或64次，色調表（Float64）取`√(迭代次數/64)`，永不逃逸者記為−1（顏色取0.02）；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.47格，在格界前恰好歸零，C1）；顏色＝`0.04 + (level − 0.04)·mask + 0.02·(128²細grain − 0.5)`，`level = 0.1 + 0.82·tone`（集合內為0.02）；height ＝ `0.8·dome·(0.88 + 0.12·tone)`（集合內取0.5倍）加`0.08·grain`；磚縫AO為0.7；roughness恆為0.4；金屬factor為0；cache合計64²個Float64（色調表）＋128²細grain = 20,480個Float64／163,840 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：亮處（color>0.5）占6.48%–6.51%、color 0.0102–0.0104至0.9212–0.9227、平均0.2152、roughness恆為0.4、AO最低0.7、height至多0.8724–0.8746 relief；4,096個磚中心的顏色與測試中獨立重寫的朱利亞逃逸時間一致（永不逃逸404格），四個seed各自唯一對應的平移為(1, 5)、(2, 59)、(55, 24)、(22, 21)，最大誤差0.0100（即細grain的幅度）；seed 0與1的亮區遮罩11.7%像素不同；seed 7的512²maps平均r／g／b約(73.7, 39.7, 35.2)、法線tilt²最大約0.0421。我實看了預覽（seed 7）：紅褐色底上的朱利亞集合，集合邊界有亮橙色點與碎形的樹枝狀結構，被seed的環面平移切在圖的邊緣。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('juliatiles', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`mandelbrottiles`（曼德博集合磚）使目前目錄972→973種，含plain的gallery為974項。64×64個圓角方塊磚組成的曼德博集合（Mandelbrot set）鑲嵌：第(col, row)格對複平面上實部−2.2到0.8、虛部−1.5到1.5中對應小塊的中心點`c`迭代`z → z² + c`，色調是逃逸迭代次數（`|z| > 2`，最多48次）除以48後開平方，由暗藍（快逃逸）到亮青藍（逃逸前迭代次數多，位於集合邊界附近）；永不逃逸的格子（共726個，約17.7%）是最暗的深藍黑。磚面凸起、磚縫較暗並帶遮蔽（AO），seed只把整張表沿環面平移。解析度只有64×64，所以是像素風的曼德博集合；環面接縫處集合並不連續，不是無縫的碎形。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；64×64格、視窗範圍、48次迭代上限、開平方的色調映射、藍色調與0.3 m nominal tile皆作者設定。第一版色調是線性的迭代次數比，預覽上多數區域太暗，我改成開平方後採用。relief 0.0012時512²maps的法線tilt²最大為0.0865，降到0.0008後為0.0399（同一批探針的前後值）。

新增專用sampler：建構時對每格以`z₀ = 0`、`c`＝格中心對應的複數迭代`z → z² + c`直到`|z|² > 4`或達48次，色調表（Float64）取`√(迭代次數/48)`，永不逃逸者記為−1（顏色取0.02）；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.47格，在格界前恰好歸零，與modulartable系列相同，C1）；顏色＝`0.04 + (level − 0.04)·mask + 0.02·(128²細grain − 0.5)`，`level = 0.1 + 0.82·tone`（集合內為0.02）；height ＝ `0.8·dome·(0.88 + 0.12·tone)`（集合內取0.5倍）加`0.08·grain`；磚縫AO為0.7；roughness恆為0.4；金屬factor為0；cache合計64²個Float64（色調表）＋128²細grain = 20,480個Float64／163,840 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：亮處（color>0.5）占3.42%–3.43%、color 0.0102–0.0103至0.9004–0.9029、平均0.2257–0.2259、roughness恆為0.4、AO最低0.7、height至多0.8548–0.8637 relief；4,096個磚中心的顏色與測試中獨立重寫的逃逸時間一致（永不逃逸726格），四個seed各自唯一對應的平移為(21, 1)、(13, 20)、(2, 37)、(48, 47)，最大誤差0.0100（即細grain的幅度）；seed 0與1的亮區遮罩6.6%像素不同；seed 7的512²maps平均r／g／b約(30.2, 52.8, 77.7)、法線tilt²最大約0.0399。我實看了預覽：深藍色的像素風曼德博集合，邊緣有亮青色的點、外圍有逃逸帶的色階，環面接縫處有輕微的色階不連續。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('mandelbrottiles', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`rhodoneatable`（玫瑰線表）使目前目錄971→972種，含plain的gallery為973項。粉紅霓虹風格的玫瑰線（rhodonea curve）表：6×6格，第(col, row)格畫出`r = cos(k·θ)`，`k = (col + 1)/(row + 1)`（θ從0到2π·(row + 1)，所以每個有理數k都封閉），從單圓、三葉、四葉、多瓣花到纏繞的環狀都有，深紫黑底上帶淡淡光暈；seed只把所有玫瑰線旋轉同一個角度（0到0.5弧度）。是數學圖案，不是真實霓虹燈管（沒有管徑變化、端點電極或反光）。k = 1的對角格是一個通過格心的小圓。

此材質是作者示意，沒有引用特定來源或霓虹燈照片，也沒有對照照片；6×6格、振幅0.4格、192段多邊形、線寬0.018格、粉紅與紫黑色調與0.3 m nominal tile皆作者設定。線的處理沿用`lissajoustable`剛調好的版本（`lineGain = 4`、緊湊的光暈核），所以沒有再經歷珠狀與格界跳變的問題；預覽第一次就採用。relief 0.0008，沒有調整。

新增專用sampler：建構時對每格以`θ = 2π·(row + 1)·k/192`取玫瑰線`r = 0.4·cos((col + 1)/(row + 1)·θ)`為192點封閉多邊形（單位為格，相對格中心，並整體旋轉seed決定的角度）；每個取樣點對該格的192條線段各算平方距離，線以`1 − exp(−4·Σ exp(−d²/0.018²))`（高斯和，自交處無折痕），光暈以`1 − exp(−0.1·Σ smoothstep(clamp(1 − d²/0.1²)))`（半徑0.1格不超過玫瑰線到格界的最短距離0.1格，格界處恰好為零）；顏色＝`0.04 + 0.74·line + 0.12·glow·(1 − line) + 0.02·(128²細grain − 0.5)`；height ＝ `0.8·line + 0.2·grain`；線處roughness降低0.2；cache合計2×6×6×192 = 13,824個Float64（多邊形點座標）＋128²細grain = 30,208個Float64／241,664 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。成本：每次取樣要量該格192條線段，本機bun量測512²取樣約232–243 ms、512² maps約257 ms（單次量測，非benchmark）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：亮處（color>0.5）占25.48%–25.53%、color 0.0301至0.7896–0.7899、平均0.2483–0.2484、roughness 0.2–0.4、height至多0.9961–0.9988 relief；各格四個角落的最大color為0.0489–0.0493；在0到0.5弧度之間掃描101個旋轉角，恰有29–30個角度使6×6×64 = 2,304個玫瑰線點全部落在亮度大於0.5的像素上（最小值0.7598–0.7617），其餘角度則否；seed 0與1的亮區遮罩15.0%像素不同；seed 7的512²maps平均r／g／b約(72.3, 40.3, 66.2)、法線tilt²最大約0.0469。我實看了預覽：深紫底上粉紅色的玫瑰線，一眼就是玫瑰線（rhodonea）表，k較大的格子密密麻麻、像編織的圓盤。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('rhodoneatable', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`lissajoustable`（李薩如曲線表）使目前目錄970→971種，含plain的gallery為972項。示波器風格的綠色磷光曲線表：6×6格，第(col, row)格畫出李薩如曲線`x = sin((col + 1)·t + φ)`、`y = sin((row + 1)·t)`（頻率比(col + 1):(row + 1)，從橢圓到緊密的編織狀），暗綠黑底上帶淡淡光暈；seed只改變共同的相位φ（0.25π到0.75π）。是數學圖案，不是真實示波器畫面（沒有網格刻度、掃描線或雜訊）。

此材質是作者示意，沒有引用特定來源或示波器照片，也沒有對照照片；6×6格、振幅0.36格、128段多邊形、線寬0.018格、青綠色調與0.3 m nominal tile皆作者設定。調整紀錄：第一版以96段、線寬0.022的高斯和疊加，預覽上線條有明顯的珠狀起伏（相鄰線段重疊處的高斯和較大），我加入`lineGain = 4`並提高到128段後才變平滑；另外第一版的光暈是寬0.07的高斯，在格界不為零，C1測試因此失敗（最大二階差分比值2.2×10⁷，等於相鄰格之間約2×10⁻³的函數跳變），我改為半徑0.12格的緊湊smoothstep核（小於曲線到格界的距離0.14格，所以在格界恰好為零）後通過。

新增專用sampler：建構時對每格以`t = 2π·k/128`把曲線取為128點的封閉多邊形（單位為格，相對格中心）；每個取樣點對該格的128條線段各算平方距離`d²`，線以`Σ exp(−d²/0.018²)`、再以`1 − exp(−4·Σ)`壓進[0, 1]（高斯和而非距離最小值，所以曲線自交處沒有折痕），光暈以`Σ smoothstep(clamp(1 − d²/0.12²))`、再以`1 − exp(−0.1·Σ)`壓縮；顏色＝`0.04 + 0.72·line + 0.12·glow·(1 − line) + 0.02·(128²細grain − 0.5)`；height ＝ `0.8·line + 0.2·grain`；線處roughness降低0.2；cache合計2×6×6×128 = 9,216個Float64（多邊形點座標）＋128²細grain = 25,600個Float64／204,800 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移；0.0012時512²maps的法線tilt²最大為0.0965，0.0008時為0.0444，同一批探針的前後值）。成本：每次取樣要對該格的128條線段求距離，本機bun量測512²取樣約182–201 ms、512² maps約216 ms（單次量測，非benchmark）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：亮處（color>0.5）占25.07%–25.24%、color 0.0302至0.7696–0.7698、平均0.2473–0.2487、roughness 0.2–0.4、height至多0.9970–0.9986 relief；各格四個角落（離曲線最遠處）的最大color為0.0482–0.0494；在0.25π到0.75π之間掃描501個相位，恰有46–47個相位使6×6×64 = 2,304個曲線點全部落在亮度大於0.5的像素上（最小值0.7500–0.7503），其餘相位則否（相位不對時曲線點會落在暗處）；seed 0與1的亮區遮罩25.6%像素不同；seed 7的512²maps平均r／g／b約(31.2, 72.1, 43.1)、法線tilt²最大約0.0444。我實看了預覽：暗綠底上的綠色李薩如曲線，從橢圓到編織狀，一眼就是經典的李薩如曲線表，線條略有珠狀感。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('lissajoustable', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`primesieve`（埃拉托斯特尼篩）使目前目錄969→970種，含plain的gallery為971項。32×32個圓角方塊磚代表整數1到1024：質數（共172個）是明亮的金黃色，1是暗色，合數的色調依最小質因數`p`為`0.4·(1 − 1/p)`（2的倍數最暗、較大質因數的合數稍亮），因此2、3、5、7的倍數在橄欖色的底上留下規則的直條與斜紋，質數則散布其間。磚面凸起、磚縫較暗並帶遮蔽（AO），seed只把整張表沿環面平移。是數論圖案，不是任何真實材質；合數之間的對比偏低，看起來像橄欖色底上的金色點。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；32×32格、1到1024、質數色調0.8、合數色調跨度0.4、金黃與橄欖色調與0.3 m nominal tile皆作者設定。第一版質數色調為0.92，色調加上底色會超出[0, 1]（約1.06），我在載入前就改成0.8；沒有再調整其他參數。

新增專用sampler：建構時以埃拉托斯特尼篩算出1到1024每個整數的最小質因數，色調表（Float64）為：1取0.1、質數取0.8、合數取`0.4·(1 − 1/最小質因數)`；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.46格，在格界前恰好歸零，與modulartable系列相同，C1）；顏色＝`0.05 + (0.14 + tone − 0.05)·mask + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`；磚縫AO為0.6；roughness恆為0.45；金屬factor為0；cache合計32²個Float64（色調表）＋128²細grain = 17,408個Float64／139,264 B lattice算術預算（非總RAM；建構時另有一個1,025項的Int32篩表為暫存）。預設0.3 m nominal tile與0.0012 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：亮處（color>0.5）占15.9%–16.0%、color 0.0351–0.0352至0.9545–0.9547、平均0.3573–0.3576、roughness恆為0.45、AO最低0.6、height至多0.8579–0.8595 relief；1,024個磚中心的顏色與測試中以試除法獨立重寫的最小質因數一致（其中質數172個），四個seed各自唯一對應的平移為(18, 21)、(0, 10)、(10, 29)、(18, 23)，最大誤差0.0150（即細grain的幅度）；seed 0與1的亮區遮罩19.1%像素不同；seed 7的512²maps平均r／g／b約(106.5, 89.3, 55.2)、法線tilt²最大約0.0399。我實看了預覽：橄欖色磚面上的金黃色質數點，可看出直條規律，但合數之間的對比偏低。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('primesieve', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`gcdtable`（最大公因數表）使目前目錄968→969種，含plain的gallery為970項。32×32個圓角方塊磚：第(col, row)格代表`gcd(col + 1 + a, row + 1 + b)`（歐幾里得演算法，偏移a、b在0到63之間由seed決定），色調為`1 − 1/gcd`——互質的格子（約六成）保持暗色，公因數愈大的格子愈亮，沿著通過格網的直線與斜線亮起。磚面凸起、磚縫較暗並帶遮蔽（AO）。是一個數論圖案，不是任何真實材質。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；32×32格、偏移範圍64、色調`1 − 1/gcd`的映射、青綠色調與0.3 m nominal tile皆作者設定。預覽第一次就採用，沒有調整參數。

新增專用sampler：建構時對每格以歐幾里得演算法算出最大公因數並寫入色調表（Float64，`tone = 1 − 1/gcd`）；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.46格，在格界前恰好歸零，與modulartable／pascalmod3／collatzsteps相同，C1）；顏色＝`0.05 + (0.14 + 0.78·tone − 0.05)·mask + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`；磚縫AO為0.6；roughness恆為0.45；金屬factor為0；cache合計32²個Float64（色調表）＋128²細grain = 17,408個Float64／139,264 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0012 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：亮處（color>0.5）占26.4%–27.9%、color 0.0351–0.0353至0.9088–0.9166、平均0.2555–0.2671、roughness恆為0.45、AO最低0.6、height至多0.8697–0.8733 relief；1,024個磚中心的顏色與測試中獨立重寫的gcd一致，四個seed各自唯一對應的偏移為(21, 59)、(36, 0)、(47, 11)、(12, 36)，最大誤差0.0149–0.0150（即細grain的幅度）；seed 0與1的亮區遮罩40.6%像素不同；seed 7的512²maps平均r／g／b約(44.0, 75.5, 78.9)、法線tilt²最大約0.0400。我實看了預覽：暗藍底上青綠色方塊磚，有斜線與整行整列的規則亮線，像數論的網格圖。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('gcdtable', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`collatzsteps`（考拉茲步數）使目前目錄967→968種，含plain的gallery為969項。32×32個圓角方塊磚：第(col, row)格代表整數`n = row·32 + col + 1`（1到1024），色調是n依考拉茲規則（偶數除以2、奇數乘3加1）走到1所需的步數除以178（1到1024中最長的是n = 871的178步），從暗紫到暖橙共連續變化。磚面凸起、磚縫較暗並帶遮蔽（AO），seed只把整張表沿環面平移。看起來是帶有結構的雜訊（相鄰整數的步數有微妙的關聯，但整體近似隨機），不是任何真實材質，只是數學圖案。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；32×32格、涵蓋1到1024、以178為步數上限、暖橙色調與0.3 m nominal tile皆作者設定。預覽第一次就採用，沒有調整參數。

新增專用sampler：建構時對1到1024的每個整數以考拉茲規則（`n → n/2`或`3n + 1`）計算走到1的步數，色調`tone = 步數/178`（Float64表）；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.46格，在格界前恰好歸零，與modulartable／pascalmod3相同，C1）；顏色＝`0.05 + (0.14 + 0.78·tone − 0.05)·mask + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`；磚縫AO為0.6；roughness恆為0.5；金屬factor為0；cache合計32²個Float64（步數表）＋128²細grain = 17,408個Float64／139,264 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0012 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：亮處（color>0.5）占22.6%、color 0.0352至0.9302–0.9334、平均0.3043–0.3046、roughness恆為0.5、AO最低0.6、height至多0.8642–0.8717 relief；1,024個磚中心的顏色與測試中獨立重寫的考拉茲步數一致，四個seed各自唯一對應的平移為(7, 13)、(9, 1)、(7, 24)、(23, 5)，最大誤差0.0149–0.0150（即細grain的幅度）；seed 0與1的亮區遮罩32.5%像素不同；seed 7的512²maps平均r／g／b約(87.3, 63.4, 54.3)、法線tilt²最大約0.0380。我實看了預覽：暗紫色底上散布著橙色的方塊磚，近似雜訊但帶有垂直與水平的條狀結構，不像是會讓人看出數學意義的圖案。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('collatzsteps', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`pascalmod3`（帕斯卡三角形模3）使目前目錄966→967種，含plain的gallery為968項。青綠色圓角方塊磚排成的48×48格：左下三角形部分是帕斯卡三角形（楊輝三角）每個數字除以3的餘數（0、1、2分別是暗、中、亮三階），形成分形般的嵌套三角形；對角線以外的格子是更暗的空格，磚縫帶遮蔽（AO）。seed只把整張表沿環面平移。不是任何真實材質，只是數學圖案。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；48×48格、模數3、三階色調與0.3 m nominal tile皆作者設定。表格只畫了三角形的一半，其餘是空格，所以約有一半面積是暗色空白。

新增專用sampler：建構時以加法規則`C(n, k) = C(n − 1, k − 1) + C(n − 1, k)`逐列算出模3的餘數（Int8表，對角線以外為−1）；每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經smoothstep，半寬0.46格，在格界前恰好歸零，與modulartable相同，C1）；色調＝`0.28 + 0.62·(residue/2)`（空格為0.1）；顏色＝`0.04 + (level − 0.04)·mask + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·dome·(0.88 + 0.12·tone)`（空格取0.5倍）加`0.08·grain`；磚縫AO為0.6；roughness恆為0.45；金屬factor為0；cache合計2,304個Int8（餘數表）＋128²細grain = 16,384個Float64／131,072 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0012 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：亮處（color>0.5）占14.4%–14.6%、color 0.0252–0.0254至0.9144–0.9146、平均0.2094–0.2107、roughness恆為0.45、AO最低0.6、height至多0.8763–0.8779 relief；表中餘數0／1／2各有708／318／150個格子、空格1,128個；2,304個磚中心的顏色與獨立重寫的帕斯卡三角形一致，四個seed各自唯一對應的平移為(14, 28)、(8, 11)、(21, 12)、(44, 17)，最大誤差0.0149–0.0150（即細grain的幅度）；seed 0與1的亮區遮罩23.8%像素不同；seed 7的512²maps平均r／g／b約(29.9, 67.6, 68.5)、法線tilt²最大約0.0679。我實看了預覽：暗色底上青綠色的方塊磚，一個個嵌套的三角形（Sierpinski風格的三階版本），像數學海報。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('pascalmod3', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`modulartable`（模運算乘法表）使目前目錄965→966種，含plain的gallery為967項。31×31個圓角方塊磚排成的鑲嵌：第(col, row)格的色調由模11乘法表的餘數`((a + col)·(b + row)) mod 11`決定（從暗紫到金黃共11階，seed決定偏移a與b），磚面凸起、磚縫較暗並帶遮蔽（AO）。因為0的餘數出現在`a + col`或`b + row`是11的倍數時，整行或整列會變成暗磚的帶狀，其餘部分呈現乘法表的對稱圖案。不是任何真實鑲嵌或磁磚，只是數學圖案。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；31×31格、模數11、11階色調、磚大小與0.3 m nominal tile皆作者設定。第一版relief 0.003時512²maps的法線tilt²最大為0.2140，降到0.0012後為0.0412（同一批探針的前後值）。

新增專用sampler（沒有per-cell陣列，色調即時算出）：每格擁有一個緊湊支撐的圓角方塊kernel（四次超橢圓經過smoothstep：`mask = smooth(clamp((1 − (ax⁴ + ay⁴))/0.3))`，半寬0.46格，在格界前恰好歸零，所以逐格查詢不會有跳變，C1）；色調`tone = (((a + col)·(b + row)) mod 11)/10`；顏色＝`0.05 + (0.12 + 0.8·tone − 0.05)·mask + 0.03·(128²細grain − 0.5)`；height ＝ `0.8·dome·(0.88 + 0.12·tone) + 0.08·grain`；磚縫AO為0.6（`gapOcclusion` 0.4）；roughness恆為0.5；金屬factor為0；cache只有128²細grain = 16,384個Float64／131,072 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0012 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：亮處（color>0.5）占35.6%–36.9%、color 0.0351–0.0354至0.9345–0.9347、平均0.369–0.379、roughness恆為0.5、AO最低0.6、height至多0.8755–0.8791 relief；961個磚中心的色調與乘法表一致（四個seed分別唯一對應偏移(a, b) = (10, 1)、(2, 9)、(1, 3)、(1, 1)，最大誤差0.0178–0.0185，即細grain的幅度）；seed 0與1的亮區遮罩36.7%像素不同；seed 7的512²maps平均r／g／b約(109.0, 86.0, 67.8)、法線tilt²最大約0.0412。我實看了預覽：金黃與暗紫的方塊鑲嵌，有明顯的對稱圖案與暗色帶，像模運算的視覺化。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('modulartable', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`elementaryautomata`（基本元胞自動機）使目前目錄964→965種，含plain的gallery為966項。琥珀色LED點陣上並排四段Wolfram基本元胞自動機（每段32列、128欄，欄在環面上相接）：規則30（單一活細胞開局的混沌三角形）、規則90（Sierpinski三角形）、規則110（複雜的不對稱結構）與規則184（以重複的「110」圖樣開局的斜條紋交通流）；seed只把整張圖的欄做環狀旋轉，圖案本身固定。每個細胞是圓角方塊LED，熄滅的LED保留暗褐色。因為是環面，規則30等的三角形在128欄的寬度內不會碰到邊界，所以看起來與無限寬的結果相同。

此材質是作者示意，沒有引用特定來源或照片，也沒有對照照片；欄數128、每段32列、四條規則與開局圖樣、琥珀色調與0.3 m nominal tile皆作者設定。第一版（尚未調整）預覽就採用；512²maps的法線tilt²最大只有0.0038（relief 0.001），沒有調整。

新增專用sampler：建構時對每個規則段先寫入開局列（單一活細胞位於第64欄；規則184是重複的`x % 3 ≠ 2`圖樣），之後每一列依規則編號的位元表（`(rule >> (left·4 + center·2 + right)) & 1`）在環狀欄上演化；整張圖的欄再依seed旋轉；128×128的0／1格用`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化，每個細胞為`cos²`在兩軸切出的圓角方塊LED（C∞）；顏色＝`0.04 + cell·(0.08 + 0.78·lit) + 0.02·(128²細grain − 0.5)`；height ＝ `0.8·cell + 0.2·grain`；亮處roughness降低0.2；cache合計128² + 128² = 32,768個Float64／262,144 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.001 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：亮處（color>0.5）占23.39%（四個seed完全相同）、color 0.0940–0.0942至0.9094–0.9095、平均0.2803–0.2804、roughness 0.25–0.45、height至多0.9983–0.9995 relief；16,384個細胞node中亮的為3,893個、沒有node顏色落在0.3到0.6之間；四個seed取到的盤面都與測試中獨立重寫的四條規則自動機完全一致，只差一個欄旋轉（seed 0、1、0xffffffff、7的旋轉分別為74、4、49、31欄）；seed 0與1的亮區遮罩29.6%像素不同；seed 7的512²maps平均r／g／b約(84.4, 53.7, 20.8)、法線tilt²最大約0.0038。我實看了預覽：琥珀色的規則30混沌三角形、規則90的Sierpinski三角形、規則110的結構與規則184的斜條紋，一眼就是Wolfram的元胞自動機海報，但規則30與90、110的三角形只佔每段的中央區，其餘是暗色空白。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('elementaryautomata', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`gameoflife`（生命遊戲）使目前目錄963→964種，含plain的gallery為965項。暗藍綠LED點陣上的康威生命遊戲（Conway's Game of Life）湯：64×64的環面，以seed決定的38%密度隨機開局，演化250代，亮綠色的活細胞形成方塊、蜂巢、閃爍器與滑翔機等結構。**演化後的盤面並未完全靜止**（仍有滑翔機與閃爍器在動；後續12代每代仍有約4%–9%的細胞改變），只是一張靜態快照。每個細胞是圓角方塊的LED，熄滅的LED保留暗色。

此材質是作者示意，沒有引用特定來源或真實螢幕照片，也沒有對照照片；盤面64×64、密度0.38、250代、色調與0.2 m nominal tile皆作者設定。第一版relief 0.0015時512²maps的法線tilt²最大為0.0900，降到0.001後為0.0422（同一批探針的前後值）。生命遊戲只在sampler建構時跑一次，建構約30 ms。

新增專用sampler：建構時以hash < 0.38初始化64×64環面，依康威規則（3個鄰居誕生、2或3個鄰居存活）執行250代；最終盤面用`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化；每個細胞是`cos²`在兩軸切出的圓角方塊LED（`0.5 + 0.5·tanh(12·(cos²(π·64·u) − 0.06))`乘以v向對應項，C∞）；顏色＝`0.04 + cell·(0.08 + 0.78·lit) + 0.02·(128²細grain − 0.5)`；height ＝ `0.8·cell + 0.2·grain`；亮處roughness降低0.2；cache合計64² + 128² = 20,480個Float64／163,840 B lattice算術預算（非總RAM；建構時另有兩個64²的Uint8盤面與一個Float64轉換陣列為暫存）。預設0.2 m nominal tile與0.001 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：亮處（color>0.5）占3.7%–5.5%、color 0.0411–0.0413至0.9090–0.9096、平均0.133–0.150、roughness 0.25–0.45、height至多0.9976–0.9988 relief；4,096個細胞node中活細胞272–401個、沒有node顏色落在0.3到0.6之間；以我在測試中獨立重寫的康威規則從取到的盤面再演化12代，每代改變的細胞為157–383個（占3.8%–9.4%）；seed 0與1的亮區遮罩8.1%像素不同；seed 7的512²maps平均r／g／b約(20.7, 45.2, 42.1)、法線tilt²最大約0.0422。我實看了預覽：暗色LED點陣上散布著亮綠色的方塊、蜂巢、閃爍器與滑翔機，一眼就是生命遊戲。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('gameoflife', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`hilbertcurve`（希爾伯特曲線）使目前目錄962→963種，含plain的gallery為964項。深藍黑底上一條青藍色的電路走線，走的是第4階希爾伯特空間填充曲線：16×16個格子每格恰好經過一次，並在拼貼邊界處把終點接回起點形成封閉迴圈（希爾伯特曲線的起點與終點是環面上相鄰的格子）；線寬約半格，線外有淡淡的光暈。seed選擇八種方形對稱（鏡射與轉置）之一並把曲線沿環面平移，所以統計不變、只有走向與位置改變。不是真實電路板（沒有焊盤、通孔或多層走線）。

此材質是作者示意，沒有引用特定來源或電路板照片，也沒有對照照片；階數4、線寬為半格、tanh銳度8、青藍色調與0.2 m nominal tile皆作者設定。第一版relief 0.002時512²maps的法線tilt²最大為0.0901，我降到0.0015後為0.0512（同一批探針的前後值）。

新增專用sampler：建構時以標準的希爾伯特距離到座標轉換（`d2xy`）逐一產生256個格子，套用seed選出的方形對稱與環面平移；在32×32的lattice上，格子中心放在偶數座標、相鄰兩格之間的連接點放在中間的奇數座標（含終點到起點跨越接縫的那一個連接），共512個亮node；用`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化；顏色＝`0.06 + 0.74·line + 0.1·glow·(1 − line) + 0.03·(128²細grain − 0.5)`，其中`glow`是未銳化的混合值乘上`(1 − 0.14·9×9雜訊)`；height ＝ `0.8·line + 0.2·grain`；線處roughness降低0.2；cache合計32² + 9² + 128² = 17,489個Float64／139,912 B lattice算術預算（非總RAM）。預設0.2 m nominal tile與0.0015 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7等八個seed，512²取樣）：亮處（color>0.5）占49.7%（八個seed皆為49.71%–49.73%）、color 0.0456–0.0460至0.8143–0.8146、平均0.4384–0.4387、roughness 0.2001–0.3999、height至多0.9969–0.9987 relief；512個node中256個為格子中心（每個恰有兩個亮鄰居）、256個為連接點，沒有node顏色落在0.3到0.6之間；在12個seed（0至9、0xffffffff、12345）上從任一格子中心沿線走，都恰好走256步回到起點並訪問256個不同的格子（單一封閉迴圈）；seed 7的512²maps平均r／g／b約(56.0, 108.7, 125.3)、法線tilt²最大約0.0512。我實看了預覽：青藍色的希爾伯特曲線布滿深色底，轉折整齊，像電路走線或迷宮，但因為只有一階的單線寬，比真實電路板單調。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('hilbertcurve', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`quasicrystal`（準晶干涉）使目前目錄961→962種，含plain的gallery為963項。五個平面波以接近72°間隔的整數波向量干涉，形成看似五重對稱的藍白圖案：深藍色的圓點、五邊形環與五角星狀結構疊在淺藍底上。因為每個波向量都是整數，圖案**在tile上精確週期**，所以它是五波干涉的近似、不是真正的準晶或Penrose鋪磚（波向量長度為14與約13.6，角度為0°、72.9°、144.0°、216.0°、287.1°，只近似72°等分）；seed只改變各波的相位，統計不變。

此材質是作者示意，沒有引用準晶文獻或實測繞射圖，也沒有對照照片；五個整數波向量(14, 0)、(4, 13)、(−11, 8)、(−11, −8)、(4, −13)、tanh對比1.5、色調與0.3 m nominal tile皆作者設定。relief 0.004時512²maps的法線tilt²最大為0.358，降到0.0015後為0.0716（同一批探針的前後值）。

新增專用sampler：`sum = Σᵢ cos(2π·(kxᵢ·u + kyᵢ·v) + φᵢ)`（五個整數波向量，相位φᵢ由hash決定），`level = 0.5 + 0.5·tanh(1.5·sum)`（C∞；sum範圍−5到5），顏色＝`0.06 + 0.88·level`，height ＝ `level`，roughness ＝ `0.3 + 0.35·(1 − level)`；金屬factor為0，無mortar，AO 1；沒有lattice cache（只有5個相位）。預設0.3 m nominal tile與0.0015 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：亮處（color>0.5）占47.3%–52.8%、color 0.0600至0.9400、平均0.484–0.517、roughness 0.30–0.65；seed 0與1的亮區遮罩51.5%像素不同；在128×128網格上做離散傅立葉分量，五個波向量處的振幅為0.1051–0.1060（五者彼此相差不到1%），而(3, 5)、(6, 1)、(9, 9)、(1, 10)、(7, 3)、(12, 12)等非波向量處皆不超過0.0007；seed 7的512²maps平均r／g／b約(103.4, 119.6, 149.1)、法線tilt²最大約0.0716。我實看了預覽：深藍的五邊形環與圓點在淺藍底上，一看就是五重對稱的干涉圖案，但是tile是週期的，不是準晶。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('quasicrystal', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`sudoku`（數獨）使目前目錄960→961種，含plain的gallery為962項。報紙上的數獨題目格：9×9格的深藍灰細線，每個3×3宮格以較粗的兩像素線框起，約四成的格子（每個seed約32–36格）放一個由seed決定的3×5像素數字（1至9），其餘為空。**數字是隨機放置的，不是合法或有解的數獨**，也不是任何真實題目。數字是3×5像素字形，因平滑混合而略帶圓角、筆畫偏粗。

此材質是作者示意，沒有引用特定題目、報紙版面或字體，也沒有對照照片；9×9格、每格7像素、3×5像素數字字形（十個字形由我手寫的位元圖）、數字機率0.4、色調與0.2 m nominal tile皆作者設定。第一版宮格線為三像素粗，預覽上深色線占面積過大，我改成兩像素後採用；數字筆畫在預覽中偏粗而略顯糊，這是3×5像素字形的限制，我沒有為此加大格數。

新增專用sampler：建構時對63×63的像素格寫入0／1（`x % 7 = 0`或`y % 7 = 0`為細線；`x % 21 = 20`或`y % 21 = 20`與其相鄰的細線形成兩像素粗的宮格線；每個格子以hash < 0.4放置一個在格內偏移(2, 1)的3×5數字字形，字形取自十個手寫位元圖的第1至9個）；用`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化；墨＝標記×(0.88 + 0.12·7×7雜訊)；顏色＝`0.92 − 0.8·ink + 0.04·(160²紙grain − 0.5)`；height ＝ `0.7·ink + 0.3·grain`；墨處roughness降低0.2；cache合計63² + 7² + 160² = 29,618個Float64／236,944 B lattice算術預算（非總RAM）。預設0.2 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：墨（color<0.5）占42.3%–44.0%、color 0.102–0.110至0.9396–0.9397、平均0.584–0.598、roughness 0.6004–0.8、height至多0.983–0.990 relief；每個seed的81個格子中32–36格放了數字、其餘45–49格為空，沒有任何一格出現不屬於十個字形的圖樣；3,969個像素節點中沒有節點顏色落在0.3到0.7之間；seed 0與1的墨遮罩11.6%像素不同；seed 7的512²maps平均r／g／b約(147.0, 147.5, 150.0)、法線tilt²最大約0.0297。我實看了預覽：淺色格子被深藍灰的線與粗宮格線分開，格內有粗體的像素數字，看得出是數獨，但深色線偏多、數字偏糊。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('sudoku', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`datamatrix`（Data Matrix二維碼）使目前目錄959→960種，含plain的gallery為961項。奶油白標籤上的黑色方形二維碼：每個符號是18×18模組，左邊與下邊是實心的L形定位圖案，上邊與右邊是黑白交替的時序軌，內部16×16是由seed決定的隨機資料模組（約一半為黑），符號之間留4模組的靜區，一個tile是2×2個符號。**資料是隨機的，不是有效的Data Matrix編碼**（沒有Reed-Solomon糾錯、也不能被掃描器解碼），只模仿外觀。模組因平滑混合而略帶圓角。

此材質是作者示意，沒有引用Data Matrix規格（ISO/IEC 16022）以外的來源、也沒有對照照片或掃描驗證；符號為18×18模組、靜區4模組、資料機率0.5、色調與0.12 m nominal tile皆作者設定，不宣稱符合任何規格版本的符號大小或資料編排。

新增專用sampler：建構時對44×44的模組格寫入0／1（每個符號：`x = 0`或`y = 17`為黑；上緣`y = 0`在偶數`x`為黑；右緣`x = 17`在奇數`y`為黑；其餘模組以hash < 0.5為黑，每個符號用不同的位置鹽值；靜區全白）；用`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化；墨＝標記×(0.9 + 0.1·7×7雜訊)；顏色＝`0.94 − 0.84·ink + 0.03·(160²紙grain − 0.5)`；height ＝ `0.7·ink + 0.3·grain`；墨處roughness降低0.15；cache合計44² + 7² + 160² = 27,585個Float64／220,680 B lattice算術預算（非總RAM）。預設0.12 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：墨（color<0.5）占36.2%–38.4%、color 0.0866–0.0899至0.9546–0.9547、平均0.633–0.646、roughness 0.40–0.55、height至多0.9857–0.9936 relief；1,936個模組節點中，所有定位L、時序軌與靜區節點都與規則一致（靜區640個節點全白、內部1,024個資料節點的黑色比例為49.8%–53.7%）、沒有節點顏色落在0.3到0.7之間；seed 0與1的墨遮罩27.2%像素不同；seed 7的512²maps平均r／g／b約(163.0, 163.0, 160.6)、法線tilt²最大約0.0235。我實看了預覽：奶油白底上整齊的黑色方形碼，L形定位與時序軌清楚，像Data Matrix，但模組是圓角的、資料沒有任何意義。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('datamatrix', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`couscous`（庫斯庫斯）使目前目錄958→959種，含plain的gallery為960項。淡米黃色的微小球狀穀粒（semolina）緊密堆疊的表面：26×26格、每格一粒略帶旋轉與大小變化的圓粒，彼此重疊，粒縫露出較暗的底色並帶遮蔽（AO）。不是真實庫斯庫斯的粒徑分布、表面細粉、蒸煮後的結塊或光澤，預覽也只有單一暗褐到淺米黃的漸層，粒子形狀比較圓而均勻。

此材質是作者示意，沒有引用特定來源、食物照片或量測，也沒有對照照片；它直接沿用granola／tilledsoil／sherpafleece共用的重疊旋轉橢圓粒子sampler（關閉了第二層chunk層：`chunkChance`為0），格數26、粒徑0.58 ± 0.15格、色調與0.1 m nominal tile皆作者設定。第一版粒子較小（0.5）且底色偏暗（0.1），預覽上粒縫太黑；我把粒徑加到0.58、底色提高到0.26後採用。relief 0.008時512²maps的法線tilt²最大為0.731，0.002時為0.1425，最後取0.0012得0.0570（同一批探針的三個值）。

沿用既有的piece sampler（`granola`、`tilledsoil`、`sherpafleece`的共用分支，現在加入`couscous`）：兩層旋轉橢圓粒子以固定5×5鄰域順序合成（`value = value·(1 − m) + piece·m`，`m`是`smooth(1 − q)`的平滑遮罩，因此重疊處維持C1），其中第二層因`chunkChance = 0`沒有任何粒子；顏色＝`0.26·rest + shade·(1 − rest) + 0.04·(128²細grain − 0.5)`；height ＝ `0.8·lift + 0.2·grain`；AO在底色處為0.4（`groundOcclusion` 0.6）；roughness恆為0.88；金屬factor為0；cache合計兩層各7個每格陣列（26²＋8²格）＋64²邊緣雜訊＋128²細grain = 25,660個Float64／205,280 B lattice算術預算（非總RAM）。預設0.1 m nominal tile與0.0012 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：底色處（occlusion<0.46）占13.8%–14.6%、其平均color 0.2583–0.2588、粒子（color>0.5）占74.3%–75.2%、沒有任何像素color<0.2、color 0.2058–0.2071至0.9529–0.9571、平均0.614–0.622、height至多0.9929–0.9954 relief；seed 0與1的底色遮罩23.4%像素不同（256²）；seed 7的512²maps平均r／g／b約(173.4, 146.4, 98.6)、occlusion<200的像素占21.4%、法線tilt²最大約0.0570。我實看了預覽：淺米黃色的圓粒緊密堆疊，粒縫為暗褐色，一眼是庫斯庫斯或小米類的穀粒表面，但形狀偏圓、粒徑偏均勻。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('couscous', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`morse`（摩斯電碼）使目前目錄957→958種，含plain的gallery為959項。奶油色紙帶上的14行摩斯電碼：每行是一串由seed決定的隨機訊息，點為1格、劃為3格，符號之間空1格、字母之間空3格、單字之間空7格，墨跡是深灰色的圓角短條。不是真實電報的內容（訊息是隨機符號而不是可譯的文字）、也沒有穿孔紙帶的孔或墨水暈染；每行在右緣截斷並與左緣相接（週期），所以接縫處的標記可能連在一起。

此材質是作者示意，沒有引用特定來源、電報紙帶照片或量測，也沒有對照照片；欄列數72×14、劃長3格、劃機率0.45、字母最多4個符號、換字機率0.2、色調與0.3 m nominal tile皆作者設定。第一版行遮罩門檻0.22時標記是又高又粗的方塊，看起來不像電碼，我把門檻改為0.8讓每行變細後採用。

新增專用sampler：建構時對每一行以hash產生訊息（每個符號先決定點或劃，後面空1格；以`symbols / 4`的機率結束一個字母並多空2格、其中20%機率改多空6格形成單字間隔），把標記寫入72×14的0／1圖；用`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(8·(pattern − 0.5))`重新銳化；列間距以`0.5 + 0.5·tanh(12·(cos²(π·14·v) − 0.8))`遮罩（C∞）；墨＝標記×列遮罩×(0.85 + 0.15·9×9雜訊)；顏色＝`0.9 − 0.78·ink + 0.04·(160²紙grain − 0.5)`；height ＝ `0.7·ink + 0.3·grain`；墨處roughness降低0.25；cache合計72×14 + 9² + 160² = 26,689個Float64／213,512 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0012 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：墨（color<0.5）占12.4%–13.4%、color 0.114–0.119至0.9199–0.9200、平均0.801–0.807、roughness 0.503–0.75、height至多0.966–0.979 relief；各行節點的內部（未觸及行首行尾）亮段長度只有1與3、空段只有1、3、7（每seed約118–139個點與90–108個劃，沒有任何其他長度）；seed 0與1的墨遮罩11.0%像素不同；seed 7的512²maps平均r／g／b約(197.8, 187.8, 163.2)、法線tilt²最大約0.065。我實看了預覽：奶油色紙上排列整齊的深灰色點與劃，一眼就是電碼。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('morse', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`pizza`（披薩）使目前目錄956→957種，含plain的gallery為958項。融化起司上散布紅棕色香腸片（pepperoni）的披薩表面示意：5×5格、每格以72%機率放一片稍有抖動與大小變化的圓片（所以每個seed約14–20片，沿格子排列、不是真實的隨機散布），起司底色淺黃，帶較深的烤焦色塊（blister）與淡淡露出的番茄醬色，香腸片中央略高、帶少量油亮斑點且roughness較低。不是真實披薩的香腸片捲邊、起司拉絲與油光、餅皮邊緣或其他配料，香腸片也是棕紅而不是鮮紅（單一暗→亮漸層），預覽比較像圓點花紋。

此材質是作者示意，沒有引用特定來源、食物照片或量測，也沒有對照照片；格數、出現機率0.72、圓片半徑0.3 ± 16%、抖動0.12、色調與0.25 m nominal tile皆作者設定與調整。第一版（全格皆有、半徑變化10%、油斑96格）看起來像整齊的棕色圓點格子，我加入隨機缺席、加大半徑變化、把油斑改成44格的柔和斑點後採用，仍然看得出格子排列。

新增專用sampler：每格一片圓片，中心有抖動，最大半徑0.348格加抖動0.12格小於半格，所以圓片在自己的格界前就歸零、逐格查詢不會產生跳變；圓片輪廓是`smoothstep(clamp((1 − r²)/0.12))`（C1），並以`present`（hash < 0.72）決定是否出現；起司＝`0.86 − 0.3·blister − 0.12·sauce + 0.04·(128²細grain − 0.5)`，其中blister與sauce是9×9與6×6慢雜訊通過tanh門檻（0.62、0.7）的平滑遮罩；香腸片＝`0.12 + 0.1·dome + 0.1·speck`，speck是44×44雜訊的tanh斑點；顏色是兩者以圓片遮罩混合；height ＝ `0.6·dome·mask + 0.25·blister雜訊 + 0.15·grain`；香腸片處roughness降低0.2；cache合計25×4個每格陣列（offsetX、offsetY、halves、present）＋9² ＋6² ＋44² ＋128² = 18,537個Float64／148,296 B lattice算術預算（非總RAM）。預設0.25 m nominal tile與0.004 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，256²取樣）：香腸片（color<0.3）占14.5%–22.1%、連通區14–20、起司（color>0.6）占59.3%–70.6%、color 0.1240至0.8776–0.8791、平均0.609–0.646、roughness 0.35–0.55、height至多0.918–0.963 relief；seed 0與1的香腸片遮罩18.3%像素不同；seed 7的512²maps平均r／g／b約(189.7, 139.6, 83.4)、法線tilt²最大約0.0329。我實看了預覽：淺黃色起司底上有棕紅色圓片，圓片沿5×5格子排列，像圓點花紋，不太像真實披薩。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('pizza', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`invaders`（街機外星人）使目前目錄955→956種，含plain的gallery為957項。綠色LED點陣面板上的街機風格像素外星人：三列各一種造型（8×8、11×8、12×8像素），每列在一個42×33的LED格上重複3次；每顆LED是圓角方塊，未亮的LED保留暗綠色。seed只改變細grain，**圖樣固定**。造型是作者依一般街機外星人風格手寫的像素圖，**不保證與任何既有遊戲的圖案相同**，也沒有發光（emission）——亮度只是底色。

此材質是作者示意，沒有引用特定來源、遊戲截圖或美術資產，也沒有對照照片；三個像素圖、LED格數42×33、間距與0.3 m nominal tile皆作者設定。第一版relief 0.002時，512²maps的法線tilt²最大為0.197，我降到0.001後為0.0588。

新增專用sampler：建構時把三個sprite（字串陣列，放在`src/data/materials.ts`的preset）各置於14格寬的欄位中央並重複3次，排成42×33的0／1像素圖（每列間距11格、上方留1格）；用`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(7·(pattern − 0.5))`重新銳化；每顆LED以`cos²`在兩軸上切成圓角方塊（`0.5 + 0.5·tanh(14·(cos²(π·42·u) − 0.12))`乘以v向對應項，C∞，兩顆LED之間留縫）；顏色＝`0.04 + cell·(0.1 + 0.72·lit) + 0.06·glow·(1 − cell) + 0.02·(128²細grain − 0.5)`；height ＝ `0.8·cell + 0.2·grain`；亮處roughness降低0.2；cache合計42×33 + 128² = 17,770個Float64／142,160 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.001 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：color 0.0305–0.0307至0.8688–0.8691、亮處（color>0.5）占18.0%、平均0.2445、roughness 0.150–0.350、height至多0.9976–0.9987 relief；1,386個LED節點中426顆亮、其餘最亮0.1507、最暗亮顆0.8496，沒有節點落在0.3到0.5之間；seed 7的512²maps平均r／g／b約(41.2, 71.4, 35.4)、法線tilt²最大約0.0588。我實看了預覽：暗綠底上排列整齊的綠色像素外星人，LED格縫清楚，一眼就是復古街機。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('invaders', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`fairisle`（費爾島針織）使目前目錄954→955種，含plain的gallery為956項。北歐費爾島（Fair Isle）針織毛衣圖樣的示意：40×30針的針目，每針是一個斜向的V形針腳；圖樣由15列為一組的橫帶構成（實心帶、交替的小點帶、以及每8針重複、帶開孔中心的菱形圖案），單一深藍與淺灰兩色，細絨毛以160²雜訊表示。seed只改變細絨毛，**圖樣本身與seed無關**。不是真實針織的毛圈與紗線粗細變化、色線的浮線（floats）或不規則的針目張力，也只有深藍與淺灰兩色（單一暗→亮漸層）。

此材質是作者示意，沒有引用特定來源、費爾島圖樣圖譜或照片，也沒有對照照片；針目數40×30、圖樣的帶與菱形規則、色調、roughness 0.92與0.3 m nominal tile皆作者設定，不宣稱符合任何真實的費爾島圖樣。第一版relief 0.004時，512²maps的法線tilt²最大為0.335，我降到0.0015後為0.0668。

新增專用sampler：建構時以規則算出40×30的0／1針目圖（每個lattice node一針；`y % 15`為0、3、11、14是實心列，1與12是偶數針、2與13是奇數針，4至10是以`|x%8 − 3.5| + |y%15 − 7|`在(1.5, 3.5]內的菱形環），再用`latticeField`以C1 smoothstep混合並以`0.5 + 0.5·tanh(7·(pattern − 0.5))`重新銳化，所以色彩邊緣在每一針內部維持C∞；針腳形狀＝`cos²`柱凸起`((0.5 + 0.5·cos(2π·40·u))^1.6)`乘以腿脊`0.5 + 0.5·cos(2π·(30·v + 0.22·sin(2π·40·u)))`，相位隨欄位位置傾斜而成V形；顏色＝`(0.22 + 0.6·yarn)·(0.78 + 0.22·ridge) + 0.05·(fuzz − 0.5)`；height ＝ `0.8·ridge + 0.2·fuzz`；roughness恆為0.92；金屬factor為0；cache合計40×30 + 160² = 26,800個Float64／214,400 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0015 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7，512²取樣）：color 0.1472–0.1477至0.8426–0.8430、深色（color<0.4）占37.5%、全圖平均0.4862–0.4863、height至多0.9938–0.9975 relief；每個針目節點的顏色與規則一致（1,200針中720針淺色、480針深色、沒有節點落在0.4到0.6之間）；seed 7的512²maps平均r／g／b約(129.1, 132.3, 144.0)、法線tilt²最大約0.0668。我實看了預覽：深藍菱形與小點橫帶，淺灰底上有細小的針腳，一眼就像北歐針織圖樣，但是針腳是均勻的重複，沒有真實紗線的不規則。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('fairisle', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`mackerel`（鯖魚）使目前目錄953→954種，含plain的gallery為955項。藍綠色魚背上被切斷、彎曲的深藍色波浪帶，沿v方向堆疊（v方向的明暗轉換次數約為u方向的2.5倍），帶的形狀被慢雜訊扭曲而不規則，雜訊閘門讓部分帶斷開或淡出；帶處roughness略高，魚鱗以細grain表示。不是真實鯖魚的銀白腹部、背腹漸層、魚鱗、虹彩光澤或帶的錐形收尾，預覽比較像波浪或虎斑條紋而不是魚皮。

此材質是作者示意，沒有引用特定來源、魚類照片或量測，也沒有對照照片；12條帶、3個整數週期的正弦、雜訊扭曲量0.9、斷帶門檻、藍綠色調與0.3 m nominal tile皆作者設定與調整，不宣稱符合任何魚種。預覽第一版（14條帶、6個週期、扭曲0.55）太規則、像水波；我加大扭曲到1.3，結果過度扭曲而出現模糊的深色塊，再退到0.9，仍然偏波浪／虎斑而不像魚皮。

新增專用sampler：相位＝`12·v + 0.3·sin(2π·3·u) + 0.9·(7×7雜訊 − 0.5)`（整數條帶與整數週期的正弦加週期雜訊，因此維持週期）；帶＝`0.5 + 0.5·tanh(4·(cos(2π·phase) − 0.25)/0.75)`（C∞）乘以斷帶閘門`0.5 + 0.5·tanh(12·(11×11雜訊 − 0.4))`；顏色＝`0.66 + 0.1·(7×7雜訊 − 0.5) + 0.06·(110²鱗grain − 0.5) − 0.52·band`；height ＝ `0.4·band + 0.6·scale`；帶處roughness增加0.12；cache合計7²＋11²＋7²＋110² = 12,319個Float64／98,552 B lattice算術預算（非總RAM）。預設0.3 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff／7）：帶（color<0.35）占23.8%–27.1%（512²取樣）、color 0.0776–0.0825至0.7334–0.7354、全圖平均0.510–0.524、roughness 0.30–0.42、height至多0.9964–0.9986 relief；seed 0與1的帶遮罩34.9%像素不同；seed 7的512²maps平均r／g／b約(96.0, 120.1, 134.6)、法線tilt²最大約0.0155。我實看了預覽：藍灰色底上的深藍波浪斷帶，像水波紋或虎斑，不像魚皮。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('mackerel', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`hestain`（H&E染色組織）使目前目錄952→953種，含plain的gallery為954項。顯微鏡下H&E（蘇木精與伊紅）染色組織切片的示意：淺粉紫色、帶斑駁與沿v方向纖維紋的細胞質底色，上面分布著深紫色、橢圓的細胞核，核的位置與形狀來自週期Gray-Scott反應擴散的斑點區（高門檻只留核心），核外有一圈極淡的亮緣。不是真實的組織學結構：沒有細胞膜、細胞核內的染色質結構、細胞類型差異、血管或組織層次，細胞核分布也比真實組織均勻，且由於單一暗→亮漸層，細胞質偏薰衣草紫而不是伊紅的粉紅色。

此材質是作者示意，沒有引用特定來源、組織學圖譜或量測，也沒有對照照片；反應擴散參數與`cheetahfur`相同（feed 0.04、kill 0.065、6000步、96×96格），核門檻0.6（比cheetahfur的0.5高，所以核較小）、銳度、亮緣、紫粉色調、0.05 m nominal tile皆作者設定與調整，不宣稱符合任何實際組織。預覽第一版細胞質偏暗的薰衣草色（0.72），我把基調提高到0.8並降低亮緣到0.04（也為了讓色調總和不超出[0, 1]），仍然是薰衣草紫而不是粉紅，這是單一漸層的限制。

沿用`latticeField`與`grayScott`，專用sampler用`nucleus = 0.5 + 0.5·tanh(12·(pattern − level))`取平滑核遮罩（level = 0.6 ± 0.1隨5×5慢雜訊移動），亮緣是較低iso-level附近的薄帶`exp(−((pattern − level + 0.14)/0.1)²)·(1 − nucleus)`（C∞）；顏色＝`0.8 + 0.14·(14×14雜訊 − 0.5) + 0.1·(110×26纖維雜訊 − 0.5) − 0.62·nucleus + 0.04·halo + 0.03·(128²細grain − 0.5)`；height ＝ `0.6·nucleus + 0.4·grain`；核處roughness增加0.1；cache合計96²＋7²＋5²＋14²＋110×26＋128² = 28,730個Float64／229,840 B lattice算術預算（非總RAM；建構時另有約294,912 B暫存，結束後只保留v）。預設0.05 m nominal tile與0.0008 UV-relative relief（非公尺位移）。模擬成本：本機bun量測每個sampler建構約190–296 ms、512² maps約281 ms（單次量測，非benchmark）。

使用`await ProceduralMaterial.create('hestain', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`；每個seed首次建構約多0.2秒的模擬時間。

`petricolonies`（培養皿菌落）使目前目錄951→952種，含plain的gallery為953項。琥珀色瓊脂（agar）平面上散布奶油色的圓形菌落，菌落位置與形狀來自週期Gray-Scott反應擴散的斑點區，大小有變化；菌落邊緣有一圈略深的細緣，菌落中央略高（height與roughness都隨菌落變化），瓊脂表面有細grain。不是真實培養皿的圓形邊框、菌落的黏液光澤、菌落內的同心結構、氣泡或透明度，預覽只有單一琥珀到奶油色的漸層。

此材質是作者示意，沒有引用特定來源、微生物照片或量測，也沒有對照照片；反應擴散參數與`cheetahfur`相同（feed 0.04、kill 0.065、6000步、96×96格），門檻、銳度、緣寬、琥珀與奶油色調、roughness、0.12 m nominal tile皆作者設定與調整，不宣稱符合任何實際菌種。預覽第一版的緣幾乎看不見，我把緣寬由0.07加到0.12、緣色深度由0.2加到0.4，並把菌落大小變化由0.3加到0.5後採用；調整以我對預覽的主觀判斷為準。

沿用`latticeField`與`grayScott`，專用sampler用`fill = 0.5 + 0.5·tanh(9·(pattern − level))`取平滑菌落遮罩（level = 0.5 ± 0.25隨5×5慢雜訊移動，所以菌落大小不同），緣是同一iso-level附近的薄帶`exp(−((pattern − level)/0.12)²)·(1 − fill)`（C∞，只在菌落外側）；顏色＝`0.42 + 0.42·fill − 0.4·rim + 0.04·(128²細grain − 0.5)`；height ＝ `0.8·fill·pattern + 0.2·grain`，菌落中央（pattern大）較高；菌落處roughness增加0.4；cache合計96²＋7²＋5²＋128² = 25,674個Float64／205,392 B lattice算術預算（非總RAM；建構時另有約294,912 B暫存，結束後只保留v）。預設0.12 m nominal tile與0.0015 UV-relative relief（非公尺位移；第一版0.003時512²maps的法線tilt²最大達0.117，降到0.0015後約0.0314）。模擬成本：本機bun量測每個sampler建構約190–309 ms、512² maps約270–304 ms（單次量測，非benchmark）。

使用`await ProceduralMaterial.create('petricolonies', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`；每個seed首次建構約多0.2秒的模擬時間。

`turingmaze`（圖靈迷宮）使目前目錄950→951種，含plain的gallery為952項。白色紙面上的深色墨跡迷宮：彎曲、分岔、部分封閉的粗條紋，由週期Gray-Scott反應擴散在「迷宮（labyrinth）」參數下產生，墨跡的粗細與濃淡隨慢雜訊略為變化，紙面有細grain。墨跡在測試的seed上形成單一連通網路。這是反應擴散的條紋圖案，**不是指紋**（指紋的脊線間距細得多，且有螺旋與分叉結構），也不是真實印刷或墨水；預覽只有單一墨色到紙色的漸層。

此材質是作者示意，沒有引用特定來源或對照照片；反應擴散參數（feed 0.03、kill 0.057、6000步、96×96格）、門檻與銳度、warp量、墨與紙的色調、0.3 m nominal tile皆作者設定與調整，不宣稱符合任何實際物件。我先嘗試命名為指紋（fingerprint），預覽後發現條紋間距約為其五到十倍、也沒有螺旋，所以改名為`turingmaze`。

沿用`cheetahfur`新增的共用helper `latticeField`與`grayScott`，專用sampler把同一個週期pattern在輕微noise扭曲（±0.025 UV）後的位置，用`0.5 + 0.5·tanh(9·(pattern − level))`取平滑條紋遮罩（level = 0.5 ± 0.12隨7×7慢雜訊移動），墨濃度＝條紋×(0.82 + 0.18·7×7雜訊)，顏色＝`0.94 − 0.86·ink + 0.05·(160²細grain − 0.5)`；cache合計96²＋5²＋7²＋7²＋160² = 34,939個Float64／279,512 B lattice算術預算（非總RAM；建構時另有約294,912 B暫存，結束後只保留v）。height ≈ 0.7×條紋＋0.3×grain；墨處roughness降低最多0.15。預設0.3 m nominal tile與0.0012 UV-relative relief（非公尺位移）。迷宮參數在我掃描的12個seed上穩定（未正規化v最大值0.32–0.35、邊界密度一致），但不保證任意seed穩定。模擬成本：本機bun量測每個sampler建構約192–252 ms、512² maps約293 ms（單次量測，非benchmark）。

使用`await ProceduralMaterial.create('turingmaze', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`；每個seed首次建構約多0.2秒的模擬時間。

`cheetahfur`（獵豹毛皮）使目前目錄949→950種，含plain的gallery為951項。黃褐色短毛皮上分布著黑色的橢圓斑點，斑點的位置、大小與形狀來自週期Gray-Scott反應擴散（reaction-diffusion）模擬，因此是不規則但間距相近的自然斑點，而非隨機圓點或固定格點；毛皮沿v方向有細纖維紋，斑處roughness略高。不是真實獵豹的毛色漸層、斑點外圍的淺色暈、腹部白毛或毛的方向性，預覽只有單一黃褐色與黑色兩段漸層。

此材質是作者依一般獵豹斑紋外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；反應擴散參數（feed 0.04、kill 0.065、6000步、96×96格）、斑的門檻與銳度、warp量、毛色與斑色、0.25 m nominal tile皆作者設定與調整，不宣稱符合任何實際獵豹。反應擴散是這個引擎第一次在建立sampler時執行模擬，其他材質仍是純函數式雜訊。

新增專用sampler與兩個共用helper：`latticeField(values, nx, ny)`是週期lattice取樣器（與既有`cachedNoise`相同的smoothstep混合，C1，`cachedNoise`改為呼叫它）；`grayScott(size, seedCells, feed, kill, steps, seed)`在週期size×size格上執行Gray-Scott（Du 0.2097、Dv 0.105、dt 1，只用加減乘，沒有超越函數，所以位元結果與引擎無關），初始擾動是每個`seedCells×seedCells`抖動格一個3×3區塊（讓任一seed都不會一開始就形成長條），輸出把抑制劑濃度正規化到[0, 1]。取樣時以`warpField`稍微扭曲（±0.015 UV）後查詢pattern，用`0.5 + 0.5·tanh(7·(pattern − level))`取平滑斑點遮罩（level = 0.5 ± 0.1隨5×5慢雜訊移動，所以斑點大小略有差異），毛色＝`0.86·(1 − spot) + 0.05·spot`加沿v方向拉長的200×28纖維雜訊與128²細grain；cache合計96²＋6²＋5²＋200×28＋128² = 31,261個Float64／250,088 B lattice算術預算（非總RAM；建構時另有u、v、nextU、nextV四個96²暫存陣列，約294,912 B，結束後只保留v）。模擬成本：本機bun量測每個sampler建構約169–176 ms、512² maps約271 ms（單次量測，非benchmark）。預設0.25 m nominal tile與0.0015 UV-relative relief（非公尺位移）。

使用`await ProceduralMaterial.create('cheetahfur', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。注意每個seed的第一次建構會多花約0.2秒的模擬時間。

`jade`（軟玉）使目前目錄948→949種，含plain的gallery為950項。拋光的綠色軟玉（nephrite）表面：中綠色的雲霧狀濃淡底色（寬雲加細雲），上面是淡綠色的脈紋（沿雜訊場的等值線，形成封閉或蜿蜒的曲線）與更細的髮絲狀淡脈；表面光滑（roughness低），脈處略粗。不是真實玉石的半透明、內部光散射、棉絮狀雜質、橙色皮殼或真實的脈絡分布，預覽比較像沿等值線繪成的大理石紋。

此材質是作者依一般拋光軟玉外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；各雜訊場的格數、雲霧濃淡的權重、脈紋的等值線位置與寬度、深綠與淺綠的色調、roughness與0.15 m nominal tile皆作者設定，不宣稱符合任何實際玉料。

新增專用sampler：雲霧 = `0.7·cloud(5×5) + 0.3·fine(18×18)`的週期雜訊；脈紋是雜訊場等值線附近的薄帶`exp(−((n − c)/w)²)`（C∞；若用`|n − c|`的脊狀則不是C1），`n`為7×7雜訊、`c = 0.5`、`w = 0.045`，另有13×13雜訊、`c = 0.45`、`w = 0.03`的髮絲脈，兩者以聯集`1 − Π(1 − x)`合併；底色另有128²細grain；cache合計25＋324＋49＋169＋16,384 = 16,951個Float64／135,608 B lattice算術預算（非總RAM）。顏色是顏料，height約0.5 relief×雲霧＋0.2×脈＋0.3×grain；脈處roughness升高0.06；金屬factor為0、無mortar、AO 1。預設0.15 m nominal tile與0.0008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color>0.6的淡脈占2.3–4.9%（隨seed差異大），color 0.201–0.768，全圖平均0.376–0.399，roughness 0.20–0.26，height至多0.859–0.902 relief；seed 0與1的脈遮罩有8.5%像素不同；seed 7的512²maps平均r／g／b約(77, 115, 87)、法線tilt²最大約0.0057。我實看了預覽：中綠色的雲霧底上有淡綠色的等值線脈，像大理石紋的綠色石材；脈線的走向（封閉曲線與直角轉折）比真實玉石的脈絡規則、不自然，而且完全沒有半透明感。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('jade', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`spectrogram`（頻譜圖）使目前目錄947→948種，含plain的gallery為949項。深藍底的聲音頻譜圖風格：12條被顫音（vibrato）彎成波浪的黃色諧波水平線、5條垂直的寬頻爆發亮帶、散布的雜訊斑點，並由一個時間—頻率能量場決定哪裡顯示（局部暗淡）。不是真實音訊的頻譜、真實的諧波比例、時間／頻率刻度、色階圖例或文字；所有諧波使用相同的顫音幅度（真實聲音的高次諧波波動較大），顏色是單一暗藍到亮黃的線性漸層而非真實頻譜圖常見的多色色階。

此材質是作者依一般頻譜圖（spectrogram）外觀所作示意，沒有引用特定來源文件、照片、音訊資料或量測，也沒有對照任何實際頻譜圖；諧波數（12）、顫音幅度與次數、漂移量、能量場解析度與門檻、爆發數與權重、暗藍與亮黃的色調、roughness與0.3 m nominal tile皆作者設定。

新增專用sampler：諧波線是整數條（12條）的`exp(−sin²(π·12·(v − 偏移))/w²)`（C∞，隨tile wrap），偏移 = `(0.2·sin(2π·6·u) + 0.18·(drift(u) − 0.5))/12`（顫音加一個8×2週期雜訊的緩慢漂移）；爆發是整數條（5條）垂直的`exp(−sin²(π·5·u)/w²)`；散斑是96×96的週期雜訊；三者都乘上20×14能量場經`0.5 + 0.5·tanh(5·(雜訊 − 0.35))`得到的平滑閘門，並以聯集`1 − Π(1 − x)`合併，使強度保持在[0, 1]；cache合計16＋280＋9,216＋16,384 = 25,896個Float64／207,168 B lattice算術預算（非總RAM）。顏色是強度對應的顏料（0.04＋0.9×強度），height約0.6 relief×強度＋0.4 relief×紙grain；roughness恆為0.4；金屬factor為0、無mortar、AO 1。預設0.3 m nominal tile與0.002 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color>0.5的亮線占6.31–6.76%，color 0.0400–0.939，全圖平均0.155–0.161，height至多0.971–0.982 relief；諧波線位置依顫音變化（在顫音正峰處偏移約+0.2個間距、負峰處約−0.2個間距，測試以每個seed驗證，容差含漂移的上限0.09）；seed 0與1的亮區遮罩（color>0.2）有超過5%像素不同；seed 7的512²maps平均r／g／b約(50, 41, 67)、r>128占7.0%、法線tilt²最大約0.092。我實看了預覽：深藍底上整齊的黃色波浪線與垂直亮帶，像風格化的頻譜圖，但太規則（所有諧波同相彎曲、等距）。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('spectrogram', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`barchart`（長條圖紙）使目前目錄946→947種，含plain的gallery為948項。淡藍灰色圖表紙：每tile 2張圖表（上下排列），每張有12根深海軍藍的長條（高度各自隨機，為繪圖區高度的15–95%，頂端略淡的漸層）、4條橫向的淡灰格線與一條較深的基線。不是真實圖表的座標軸刻度、數字標籤、圖例、標題或多系列資料。

此材質是作者依一般長條圖外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；圖表數與長條數（2張×12根）、長條寬度、高度範圍、格線數與寬度、繪圖區邊界、海軍藍與紙色的色調、roughness與0.25 m nominal tile皆作者設定，不宣稱符合任何實際圖表。

新增專用sampler：每根長條是平滑方盒——寬度項`smooth(clamp((0.34 − |dx|)/0.03))`、頂端項與基線項各一個`smooth(clamp(…/0.03))`，完全留在自己的欄內（半寬0.34 < 0.5）；格線是繪圖區內`exp(−sin²(π·步數)/w²)`（C∞，並以繪圖區遮罩限制在繪圖區內），基線是`exp(−d²/w²)`；長條頂端高度由逐欄雜湊決定；全部以凸組合混合；cache合計24＋16,384 = 16,408個Float64／131,264 B lattice算術預算（非總RAM）。顏色是顏料，長條與基線height約0.6 relief＋紙grain 0.4 relief、長條處roughness降低0.08；金屬factor為0、無mortar、AO 1。預設0.25 m nominal tile與0.0012 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color<0.3的長條占25.1–29.4%，color>0.85的紙面占65.0–69.4%，color 0.025–0.970，全圖平均0.695–0.730，roughness 0.54–0.62，height至多0.994–0.999 relief；從欄中心向下掃描找到的24根長條高度占繪圖區的13–91%，且彼此高低差大於0.5；seed 0與1的長條高度平均差約0.22；seed 7的512²maps平均r／g／b約(182, 189, 206)、r<110占26.6%、法線tilt²最大約0.061。我實看了預覽：整齊的深藍長條與淡灰格線，像圖表紙，但沒有刻度與文字。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('barchart', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`ecgpaper`（心電圖紙）使目前目錄945→946種，含plain的gallery為947項。淡粉紅色醫療記錄紙：每tile 40×40格的細格線（每5格一條較粗的粗格線，共8×8大格），3條橫向的記錄帶，每帶重複6個心跳波形（P、Q、R、S、T波，各心跳振幅有±18%的差異），以深褐紅色細線描繪在各帶的基線上。不是真實心電圖的導程標示、校準方波、時間刻度、病理波形或列印文字；波形是示意的簡化曲線（T波的頂部偏平）。

此材質是作者依一般心電圖記錄紙外觀所作示意，沒有引用特定來源文件、照片、醫學標準或量測，也沒有對照照片；格數（每tile 40×40、粗格每5格）、記錄帶數與心跳數（3帶×6拍）、各波形的位置與幅度、線寬、粉紅紙色與暗紅墨色、roughness與0.3 m nominal tile皆作者設定，不宣稱符合任何實際心電圖紙或可作醫療用途。

新增專用sampler：細格與粗格各是每個方向一組整數線數的`exp(−sin²(π·n·s)/w²)`（C∞，隨tile wrap），兩個方向以聯集`1 − Π(1 − x)`合併；每一帶的心跳由P、Q、R、S、T五個緊支撐凸起組成——`a·smooth(1 − ((x − c)/s)²)`在`|x − c| ≥ s`時恰好為零且為C1，因此每一拍在自己的兩端精確歸零，各拍不同的振幅不會在拍與拍之間留下階梯（我最初用高斯，其尾端不是精確的零，使取樣在拍界產生約10⁻¹²的跳變，被C1測試放大成約0.038而失敗）；描線是寬0.0035的`exp(−d²/w²)`，`d = dy / √(1 + 斜率²)`為到曲線的一階距離，使陡峭的筆畫仍有相近的粗細，並以兩個C1視窗限制在曲線可到達的垂直範圍與自己的記錄帶內；格線與紙grain合成後以凸組合混入墨色；cache合計18＋16,384 = 16,402個Float64／131,216 B lattice算術預算（非總RAM）。顏色是顏料，墨線height約0.6 relief＋紙grain 0.4 relief、墨處roughness降低0.1；金屬factor為0、無mortar、AO 1。預設0.3 m nominal tile與0.0012 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color<0.3的墨線占3.23–3.27%（seed 7為3.13%），color>0.85的紙面占73.8–73.9%，color 0.05–0.955，全圖平均0.859–0.860，roughness 0.60–0.70，height至多0.983–0.992 relief；每一條記錄帶的基線處與每一拍R波頂端皆為墨色（測試逐拍驗證，3帶×6拍）；seed 0與1的墨色遮罩只有0.75%像素不同（只有逐拍振幅與紙grain隨seed變）；seed 7的512²maps平均r／g／b約(228, 206, 206)、r<110占2.9%、法線tilt²最大約0.061。我實看了預覽：粉紅格紙上三條重複的心跳描線，整體像心電圖紙；但R波偏矮、T波頂部偏平，不像真實波形。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('ecgpaper', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。建議size至少512，使細格線（每格約13像素）與描線（約2像素寬）可辨。

`redalder`（紅赤楊／北美西部赤楊）使目前目錄944→945種，含plain的gallery為946項。近似Alnus rubra未塗裝縱向木面：淡黃褐到略帶紅的均勻底色、細而均勻的質地、2條很淡的暗帶、縱向纖維與極少量（約0.15%）的細暗短痕（對應偶爾出現的聚合木射線）。不是邊材與心材的區別、聚合木射線的寬大條紋、節疤、波浪紋或塗層。

外觀依據實際閱讀的[Wood Database Red Alder](https://www.wood-database.com/red-alder/)（Color／Appearance：淡黃褐到略帶紅的褐色，隨時間變深變紅，邊材與心材無明顯差別，偶爾有聚合木射線形成的小條紋；Grain／Texture：紋理通常平直、質地中等偏細而均勻；Endgrain：散孔材，導管小到中等且很多）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/alnus-rubra.jpg)（淡黃褐的均勻面、極淡的縱向色變、零星細小的暗色短痕）；僅作配色與紋理形態參考，**不**重現聚合木射線的寬大條紋、節疤或波浪紋，不打包來源圖，也不由照片反推真色、roughness或實際尺寸；導管（散孔、很多）在本材質中因為過小而不可見，只以少量暗痕代表偶爾可見的木射線。

直接fallthrough重用既有Padauk／Bloodwood系細長橢圓導管sampler（與`blackwalnut`、`teak`、`honduranmahogany`、`shagbarkhickory`、`eastindianrosewood`、`bubinga`、`jarrah`、`merbau`同路徑），constructor只選preset：36×12個導管site（pose表13,824 B）、2條起伏（bandWarp 0.8）且對比很低（bandContrast 0.1）的暗帶、220×9縱向fiber、128²細grain與固定3×4 warp，共20,104個Float64／160,832 B lattice算術預算（非總RAM）。金屬factor為0；暗痕是真的height凹陷，色紋只是顏料。預設0.18 m nominal tile與0.002 UV-relative relief（非公尺位移）皆作者設定。因為共用sampler的本體色被限制在palette的約0.25–0.46處，我把palette選成較亮的暖褐（dark (178, 124, 80)／light (246, 204, 150)）才讓本體色接近照片的淡黃褐。實測（工具實跑，三seed 0／1／0xffffffff、256²取樣）：暗痕（AO<0.9）占0.12–0.15%，無凹陷的本體占99.8%，本體色0.254–0.459，橫／縱色差比9.98–10.64，roughness 0.50–0.602、height 0.45–0.503 relief、最低AO 0.75；seed 7的512²maps平均r／g／b約(204, 155, 107)、AO<230占0.147%、法線tilt²最大約0.0008。我實看了預覽：淡黃褐的均勻面、極淡的暗帶與零星細暗痕，與照片的整體色調與均勻感相近；照片更細緻、更偏橙黃（照片肉眼估計約(215, 170, 120)，這只是目視估計，不是量測）。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('redalder', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`sherpafleece`（雪帕／泰迪絨刷毛布）使目前目錄943→944種，含plain的gallery為945項。奶油白的捲曲絨毛布面：大量任意旋轉、邊緣不規則的奶油色團塊彼此疊成蓬鬆的捲簇，簇間偶有受遮蔽的淺褐色縫（約1%），每個團塊帶有各自的明暗與穹頂高光。不是真實刷毛布的纖維、捲曲的立體感、織底或毛向，預覽比較像凹凸的奶油色碎屑或爆米花，只是勉強近似。

此材質是作者依一般雪帕刷毛布外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；兩層團塊的格數、機率、大小、長寬比、邊緣雜訊、色調、roughness與0.15 m nominal tile皆作者設定，不宣稱符合任何實際織物。

直接fallthrough重用既有`granola`的兩層旋轉橢圓塊sampler（constructor只選preset，不新增sampler）：大團塊（12×12格，機率1，半軸0.7–1.1格×0.55–1.45長寬比）與小團塊（24×24格，機率0.7，半軸0.45–0.85格）各自在格內抖動±0.5並帶任意旋轉角，每個像素依固定順序合成5×5鄰格（這個preset的團塊最遠可延伸約1.8格，3×3視窗會把它們切斷，這正是我後來把共用sampler擴大為5×5的原因）——`value = value·(1 − m) + 塊值·m`，遮罩`m = smooth(clamp((1 − q)/0.6))`，`q`乘上64×64週期雜訊的邊緣擾動——先合成大團塊、再合成小團塊，所有項皆為C1；沒被蓋住的部分顏色為底色0.3、AO降到0.4；cache合計1,008＋4,032＋4,096＋16,384 = 25,520個Float64／204,160 B lattice算術預算（非總RAM）。顏色是顏料，穹頂height約0.85 relief＋grain 0.15 relief；金屬factor為0、無mortar。預設0.15 m nominal tile與0.012 UV-relative relief（非公尺位移）。這個preset我調整過兩次：第一版（22×22格、較小的團塊）像粗砂或碎屑；第二版放大團塊後較像蓬鬆的絨團才採用；另外第一版色調使color最高達1.01（超出[0,1]），把大小團塊色調降為0.52／0.58、穹頂0.2後最高才回到0.93。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color>0.7的亮簇占38.8–41.3%，縫隙地（AO<0.45）占0.92–1.72%，color 0.234–0.931，全圖平均0.659–0.670，縫隙地平均0.296，roughness恆為0.92，最低AO 0.4，height至多0.996–0.998 relief；seed 0與1的亮簇遮罩有48.2%像素不同；seed 7的512²maps平均r／g／b約(203, 191, 174)、AO<200占5.2%、法線tilt²最大約0.788。我實看了預覽：奶油色的蓬鬆團塊堆疊而成，但不像真實刷毛布的纖維。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('sherpafleece', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`tilledsoil`（翻耕土壤）使目前目錄942→943種，含plain的gallery為944項。深褐色土壤表面：任意旋轉、邊緣不規則的土塊（中褐色，彼此可重疊，約占六成），間隙處是更深而受遮蔽的細土，並散布少量（約7–9%）較小的淺色卵石或砂礫。不是真實土壤的根系、蟲孔、濕度光澤、植物殘體或粒徑分布，預覽也容易被看成迷彩圖樣。

此材質是作者依一般翻耕後土壤外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；土塊與卵石兩層的格數、機率、大小、長寬比、邊緣雜訊、各層色調、roughness與0.4 m nominal tile皆作者設定，不宣稱符合任何實際土質。

直接fallthrough重用既有`granola`的兩層旋轉橢圓塊sampler（constructor只選preset，不新增sampler）：土塊（8×8格，機率1，半軸0.34–0.62格×0.7–1.3長寬比）與淺色卵石（16×16格，機率0.3，半軸0.1–0.22格）各自在格內抖動±0.45並帶任意旋轉角，每個像素依固定順序合成5×5鄰格（最大的塊在最大長寬比與最大邊緣擾動下可能越過自己的格超過一格，3×3視窗會把它切斷）——`value = value·(1 − m) + 塊值·m`，遮罩`m = smooth(clamp((1 − q)/0.4))`，`q`乘上48×48週期雜訊的邊緣擾動——先合成土塊、再合成卵石，所有項皆為C1；沒被任何塊蓋住的部分顏色為底色0.14、AO降到0.45；cache合計448＋1,792＋2,304＋16,384 = 20,928個Float64／167,424 B lattice算術預算（非總RAM）。顏色是顏料，穹頂height約0.8 relief＋grain 0.2 relief；金屬factor為0、無mortar。預設0.4 m nominal tile與0.012 UV-relative relief（非公尺位移）。我在寫這個preset時，第一版把卵石色調設為0.78，探測發現color最高到1.03（超出[0,1]），把卵石色調降為0.66±0.08後才符合範圍。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：土塊間的縫隙地（AO<0.46）占35.9–41.8%（seed 7為42.0%），color>0.5的淺色卵石占6.8–9.4%，color 0.094–0.899，全圖平均0.270–0.288，縫隙地平均0.140，roughness恆為0.92，最低AO 0.45，height至多0.994–0.997 relief；seed 0與1的覆蓋遮罩有43.7%像素不同；seed 7的512²maps平均r／g／b約(62, 47, 35)、AO<200占50.9%、法線tilt²最大約0.894。我實看了預覽：深褐的縫隙上疊著較亮的褐色土塊與小卵石，像鬆散的土壤，但相當像迷彩，且遠比真實土壤平坦。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('tilledsoil', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`heatsinkfins`（散熱鰭片）使目前目錄941→942種，含plain的gallery為943項。陽極處理的擠型鋁散熱片：每tile 20片沿u方向排列的鰭片，鰭頂平坦而明亮、鰭間是深而受遮蔽的窄縫（寬度與鰭頂約相同），鰭頂沿v方向有細微的擠型線、極淡的陽極處理斑駁與細grain；整面金屬（metallic為1）。不是真實散熱片的鰭片高度與厚度、基板、導熱管、扣具或切削毛邊。

此材質是作者依一般擠型鋁散熱片外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；鰭片數（每tile 20）、鰭頂與縫的比例與銳度、金屬色調、擠型線與斑駁強度、roughness與0.1 m nominal tile皆作者設定，不宣稱符合任何實際散熱片的規格。

新增專用sampler：鰭片 = `0.5 + 0.5·tanh(3.5·sin(2π·20·u))`（`tanh`的正弦是平滑方波，C∞；整數鰭數隨tile wrap），鰭頂mask使顏色在縫色0.14與鰭色0.7之間混合；鰭頂另有4×160沿v方向拉長的擠型線雜訊（只作用於鰭頂）、4×4的陽極處理斑駁與128²細grain；縫處roughness升高0.2、AO降到0.5；cache合計640＋16＋16,384 = 17,040個Float64／136,320 B lattice算術預算（非總RAM）。`metallic`在整個取樣範圍為1，並已加入`ProceduralMaterial`的金屬factor清單與測試的非金屬例外清單。顏色是金屬的反射色，鰭頂height約0.8 relief、擠型線0.1、grain 0.1；無mortar。預設0.1 m nominal tile與0.01 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color>0.5的鰭頂占47.1–47.3%、color<0.25的縫占43.4–43.7%，AO<0.9的區域固定為56.25%（與seed無關），color 0.099–0.777，全圖平均0.416–0.421，roughness 0.38–0.58，最低AO 0.50，metallic恆為1，height至多0.988–0.992 relief；在鰭頂上沿u方向（跨鰭）的逐像素色差約為沿v方向（擠型線）的4.9–5.3倍；seed 7的512²maps平均r／g／b約(76, 79, 86)、metallic通道平均255、法線tilt²最大約0.716。我實看了四格預覽：整齊的直條鰭片與深縫，像擠型鋁散熱片，但太簡化（沒有鰭片的高度、倒角與基板）。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('heatsinkfins', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為1（整面金屬），texture清理沿用既有`destroy()`。建議size至少512，使鰭片（約26像素一個週期）與縫可辨。

`jerky`（牛肉乾）使目前目錄940→941種，含plain的gallery為942項。風乾牛肉條表面：深紅褐色底上沿u方向延伸的細密肌纖維、沿同方向的寬低頻色調變化、逐處變化的光澤（roughness）與零星的近黑胡椒碎粒。不是真實肉乾的皺縮輪廓、脂肪粒、鹽結晶或油亮度，預覽也容易被看成髮絲拋光的深色木紋。

此材質是作者依一般牛肉乾外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；纖維與色調雜訊的格數、胡椒密度與大小、紅褐色調、roughness與0.12 m nominal tile皆作者設定，不宣稱符合任何實際肉乾。

新增專用sampler：14×240的纖維雜訊（沿u方向拉長）、4×8的寬低頻色調雜訊、6×36的光澤雜訊（roughness ± 0.1）與128²細grain；胡椒碎粒是36×36格、約14%機率、半徑0.22格、中心抖動0.26的`smooth(1 − q)`圓點（半徑加抖動小於半格，完全留在自己的格內），並以**乘法**壓暗肉色（`color = 肉色 × (1 − 0.85·胡椒)`）；cache合計2,592＋3,360＋216＋32＋16,384 = 22,584個Float64（180,672 B）＋1,296 B Uint8的胡椒存在表 = 181,968 B lattice算術預算（非總RAM）。顏色是顏料，height以纖維0.45 relief、胡椒0.15、grain 0.4組成；金屬factor為0、無mortar、AO 1。預設0.12 m nominal tile與0.004 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color<0.14的近黑胡椒占0.84–0.95%，color 0.020–0.562，全圖平均0.336–0.343，roughness 0.40–0.60，height至多0.970–0.979 relief；沿v方向的逐像素色差約為沿u方向的7.3–7.5倍（纖維沿u拉長）；seed 0與1沿一條水平線取樣的色差平均約0.127；seed 7的512²maps平均r／g／b約(73, 39, 24)、法線tilt²最大約0.297。我實看了預覽：深紅褐色的水平纖維與細小黑點，像牛肉乾也像髮絲拋光的暗色木紋，缺乏真實肉乾的形狀與起伏。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('jerky', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`garlicskin`（蒜皮）使目前目錄939→940種，含plain的gallery為941項。大蒜外皮：奶油白的紙質底上，約11條沿v方向延伸、被低頻雜訊扭曲且寬窄隨位置變化的淡紫色縱向條紋（實測占36–40%），帶縱向纖維、柔和皺褶與細grain；條紋處略凹且較光滑。不是真實蒜皮的剝離邊緣、破損、泥土、蒜瓣輪廓或半透明感，預覽看起來比較像波浪紫條紋紙，而不太像蒜皮。

此材質是作者依一般大蒜外皮外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；條紋數（每tile 11）、扭曲與寬度變化量、紫色門檻與濃度、纖維與皺褶強度、紙白與紫色的色調、roughness與0.1 m nominal tile皆作者設定，不宣稱符合任何真實蒜種。

新增專用sampler：相位 = `11·u + 0.9·(warp(u, v) − 0.5)`（`warp`為4×6週期雜訊），紫色權重 = `0.5 + 0.5·tanh(2.5·(sin(2π·相位) − 0.35 − 1.1·(width(u, v) − 0.5)))`（`tanh`的正弦是平滑方波，C∞；`width`為5×12週期雜訊使條紋寬窄與出現位置平滑變化；整數條紋數隨tile wrap）；紙質另有220×10沿v方向的纖維雜訊、24×40的柔和皺褶雜訊與128²細grain；cache合計24＋60＋2,200＋960＋16,384 = 19,628個Float64／157,024 B lattice算術預算（非總RAM）。顏色是顏料，紫色使color降低0.4，條紋脊的height約0.35 relief、皺褶0.35、纖維0.15、grain 0.15，紫色處roughness降低0.1；金屬factor為0、無mortar、AO 1。預設0.1 m nominal tile與0.003 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color<0.7的紫色條紋區占36.0–40.3%，color>0.82的紙面占51.0–54.9%，color 0.467–0.978，全圖平均0.756–0.774，roughness 0.45–0.55，height至多0.917–0.939 relief；在紙面上沿u方向的逐像素色差約為沿v方向的3.9–4.5倍；seed 0與1的條紋遮罩有39.4%像素不同；seed 7的512²maps平均r／g／b約(213, 196, 201)、法線tilt²最大約0.038。我實看了預覽：淡紫色波浪縱條紋疊在奶油白紙面上，但太規則而像條紋紙，不太像真實蒜皮；我曾兩次調淡條紋濃度與覆蓋（第一版太像斑馬紋）仍只是勉強接近。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('garlicskin', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`pancake`（鬆餅／煎餅）使目前目錄938→939種，含plain的gallery為940項。煎餅表面：金黃色底上有低頻、邊緣帶蕾絲狀不規則的焦褐色斑塊（面積隨seed差異很大，約25–63%），散布著微小的氣孔凹洞；表面略粗糙。不是真實煎餅的邊緣、厚度、焦糖光澤、奶油或糖漿，也不是特定的鬆餅、可麗餅或薄餅。

此材質是作者依一般煎餅表面外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；兩層雜訊的格數與權重、焦褐色的門檻與銳度、氣孔密度與大小、金黃與焦褐的色調、roughness與0.25 m nominal tile皆作者設定，不宣稱符合任何實際煎餅。

新增專用sampler：焦褐程度 = `0.5 + 0.5·tanh(6·(0.5 − (0.65·broad + 0.35·fine)))`，`broad`為5×5、`fine`為22×22的週期低頻雜訊，`tanh`使斑塊邊緣平滑（C∞）而因細雜訊呈蕾絲狀；氣孔是30×30格、約55%機率、半徑0.14–0.28格、中心抖動±0.2的`smooth(1 − q)`凹洞（半徑加抖動小於半格，完全留在自己的格內）；另有128²細grain；cache合計25＋484＋16,384＋3×900 = 19,593個Float64／156,744 B lattice算術預算（非總RAM）。顏色是顏料，height以氣孔凹陷0.4 relief＋焦褐0.15＋grain 0.45組成，氣孔處roughness升高0.08、AO降到0.7；金屬factor為0、無mortar。預設0.25 m nominal tile與0.004 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color<0.45的焦褐區占24.7–63.4%、color>0.6的金黃區占18.3–44.3%（取決於低頻雜訊，seed差異很大），氣孔（AO<0.9）占4.84–5.15%，color 0.073–0.716，全圖平均0.428–0.544，roughness 0.62–0.70，最低AO 0.7，height至多0.983–0.990 relief；seed 0與1的焦褐遮罩有41.2%像素不同；seed 7的512²maps平均r／g／b約(161, 122, 73)、AO<230占4.87%、法線tilt²最大約0.325。我實看了預覽：金黃底上帶蕾絲邊的焦褐斑塊與小氣孔，像煎餅或可麗餅，但斑塊邊緣有明顯的方塊雜訊感（來自22×22格的細雜訊），且沒有真實煎餅的光澤與厚度。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('pancake', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`kawung`（卡翁紋巴迪克）使目前目錄937→938種，含plain的gallery為939項。深靛藍棉布上以蠟防染出的乳白色幾何紋：4×4個單元格，每格一個橢圓，偶數格長軸沿u、奇數格長軸沿v（棋盤式交錯），橢圓長到伸入鄰格而與鄰格的橢圓交疊，形成印尼卡翁（kawung）紋的四瓣交疊感；每個橢圓中心有一個小圓點。不是真實卡翁紋的精確幾何與比例（本材質是簡化示意）、手繪蠟線的粗細起伏、蠟裂紋或染色滲開。

此材質是作者依一般卡翁紋巴迪克外觀所作的簡化示意，沒有引用特定來源文件、照片或量測，也沒有對照照片或圖譜；格數（每tile 4×4）、橢圓長短半軸（0.72／0.30格）、線寬、圓點大小、靛藍與蠟的色調、roughness與0.3 m nominal tile皆作者設定，不宣稱符合任何真實卡翁紋的規格。

新增專用sampler：每個像素合成3×3鄰格的橢圓——每格一個橢圓，`(col + row)`為偶數時長軸沿u、奇數時沿v（格數為偶數，所以棋盤隨tile wrap），環線 = `smooth(clamp(1 − ((q − 1)/0.14)²))`（`q`為橢圓式，緊支撐且為C1），中心圓點為`smooth(1 − q)`，全部以聯集`1 − Π(1 − x)`合併；靛藍底另有5×5週期染色雜訊與192²逐紗線雜訊；cache合計25＋36,864 = 36,889個Float64／295,112 B lattice算術預算（非總RAM）。顏色是顏料，蠟線略凸起（height 0.5 relief、紗線0.5）、蠟處roughness降低0.06；金屬factor為0、無mortar、AO 1。預設0.3 m nominal tile與0.004 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color>0.5的蠟占12.75–12.78%，color 0.072–0.907，全圖平均0.2125–0.2146，靛藍底（color<0.25）平均0.121–0.123，roughness 0.76–0.82，height至多0.994–0.999 relief；四個橢圓之間的格角（無蠟處）最亮約0.140–0.164；seed 0與1的格角色差平均約0.024；seed 7的512²maps平均r／g／b約(60, 64, 84)、r>110占13.5%、法線tilt²最大約0.450。我實看了預覽：交錯的橢圓與圓點排成與卡翁紋相似的圖樣，但幾何比真實巴迪克簡化、線條也過於均勻機械；第一版把四個花瓣橢圓沿格線排列，看起來像鏈條格而非卡翁，改成棋盤式交錯的橢圓後才採用。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('kawung', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。建議size至少512，使蠟線（約3像素寬）與圓點可辨。

`granola`（燕麥穀物脆片）使目前目錄936→937種，含plain的gallery為938項。蜂蜜褐色底面上疊著兩層任意角度的橢圓塊：較大的淡奶油色燕麥片（約0.4的面積）與較小的深色堅果、果乾塊，邊緣被雜訊弄得不規則、相鄰的塊會互相重疊，每塊有各自的色調與穹頂明暗；底面露出處受遮蔽變暗。不是真實燕麥片的片狀纖維、蜂蜜光澤的黏結塊、種子或糖粉，預覽也讓人聯想到迷彩圖樣。

此材質是作者依一般穀物脆片（granola）外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；兩層塊的格數、機率、大小、長寬比、邊緣雜訊、各層色調、roughness與0.2 m nominal tile皆作者設定，不宣稱符合任何真實產品。

新增專用sampler：兩層塊（燕麥片9×9格、堅果與果乾14×14格）各自在格內抖動±0.45、帶任意旋轉角與0.65–1.35的長寬比；塊可能溢出到鄰格，每個像素依固定順序合成5×5鄰格（最大的塊在最大長寬比與最大邊緣擾動下可能越過自己的格超過一格，3×3視窗會把它切斷）——`value = value·(1 − m) + 塊值·m`，遮罩`m = smooth(clamp((1 − q)/0.4))`，`q`為旋轉橢圓的距離平方乘上`1 + 0.45·(雜訊 − 0.5)·2`的邊緣擾動（40×40週期雜訊），且先合成燕麥片、再合成深色塊，所有項皆為C1；底面露出處（沒被任何塊蓋住的部分）顏色為底色0.3，AO降到0.6；cache合計567＋1,372＋1,600＋16,384 = 19,923個Float64／159,384 B lattice算術預算（非總RAM）。顏色是顏料，穹頂height約0.7 relief＋grain 0.3 relief；金屬factor為0、無mortar。預設0.2 m nominal tile與0.008 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：底面外露（AO<0.61）占37.0–39.7%（seed 7為41.1%），color>0.5的淡色塊占39.2–40.7%，color<0.2的深色塊占0.49–0.58%，color 0.142–0.957，全圖平均0.461–0.477，外露底面平均0.300，roughness恆為0.78，最低AO 0.6，height至多0.993–0.996 relief；seed 0與1的覆蓋遮罩有48.0%像素不同；seed 7的512²maps平均r／g／b約(141, 116, 78)、AO<200占47.9%、法線tilt²最大約0.722。我實看了預覽：不規則的奶油色塊與暗色小塊散在褐色底上，像燕麥脆片，但也像迷彩，且遠比真實的乾燥脆片平坦；第一版（正橢圓、邊緣光滑）像豆子或藥丸，加入邊緣雜訊後才採用。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('granola', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`raspberry`（覆盆子）使目前目錄935→936種，含plain的gallery為937項。覆盆子果面：16×18排成交錯格（奇數行偏移半欄）的圓形小核果（drupelet），彼此略為重疊，每顆有各自的紅色色調、穹頂明暗與偏左上的高光，顆粒之間是較暗、受遮蔽的細縫。不是真實覆盆子的整顆形狀、細絨毛、花萼、中空凹陷或大小與形狀的變化。

此材質是作者依一般覆盆子果面外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；欄列數（16×18）、顆粒半徑、縫的色調與遮蔽、顆粒色調變化、高光位置與大小、roughness與0.08 m nominal tile皆作者設定，不宣稱符合任何真實品種或尺寸。

新增專用sampler：顆粒中心在交錯格上（奇數行右移半欄，偶數行數使位移隨tile wrap），因顆粒會互相重疊，每個像素依固定順序合成3×3鄰格的顆粒——`value = value·(1 − m) + 顆粒值·m`，其中遮罩`m = smooth(clamp((1 − q)/0.35))`（`q`為半徑0.56格的圓盤距離平方，列距以欄寬換算成相同的實際長度）——所有項皆為C1；顆粒色調 = 基底0.38 + 逐顆變化（±0.1）+ 穹頂`smooth(1 − q)`×0.3 + 偏左上的高光×0.18；縫處roughness升高0.2、AO降到0.55；逐顆色調表18×16 = 288個Float64＋128²紙grain（16,384個Float64）= 16,672個／133,376 B lattice算術預算（非總RAM）。顏色是顏料，穹頂height約0.7 relief＋grain 0.3 relief；金屬factor為0、無mortar。預設0.08 m nominal tile與0.006 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color 0.035–0.956，全圖平均0.517–0.529，顆粒中心color 0.567–0.792（平均0.672–0.685），相鄰顆粒間縫的中點平均0.352–0.364，roughness 0.42–0.62，最低AO 0.55，AO<0.9的縫占15.04%（與seed無關，因為排列是固定的格點），height至多0.993–0.998 relief；seed 0與1的顆粒中心色差平均約0.068；seed 7的512²maps平均r／g／b約(154, 40, 54)、AO<230占15.0%、法線tilt²最大約0.256。我實看了預覽：整齊交錯的圓形紅色小核果與暗縫，像覆盆子的果面，但比真實的規則許多（每顆大小形狀都相同，沒有絨毛）；第一版因顆粒過度重疊而像平坦的六角形鋪磚，調整半徑、縫與高光後才採用。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('raspberry', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。建議size至少512，使每顆（約32像素）與縫可辨。

`salami`（薩拉米）使目前目錄934→935種，含plain的gallery為936項。薩拉米香腸切面：帶低頻斑駁的深紅色醃肉底，上面散布乳白色的橢圓脂肪斑塊（大小與長寬比各異、相鄰者會相連）與更細小的近黑色胡椒粒；脂肪處較亮、略光滑。不是真實香腸的外皮、白色黴層、肉的纖維或切面紋理，也不是任何特定品種。

此材質是作者依一般薩拉米切面外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；脂肪斑塊的格數、機率、大小與長寬比、胡椒粒密度、肉與脂肪的色調、roughness與0.12 m nominal tile皆作者設定，不宣稱符合任何實際香腸的規格。

新增專用sampler：脂肪斑是11×11格、每格約55%機率有一個橢圓（半軸0.2–0.45格再乘0.7–1.3的長寬比）、中心在格內抖動±0.45，因為可能溢出到鄰格，每個像素以3×3鄰格的聯集`1 − Π(1 − smooth(1 − q))`合併；胡椒粒是40×40格、約14%機率、半徑0.22格的`smooth(1 − q)`圓點，中心抖動0.26，半徑加抖動小於半格而完全留在自己的格內；脂肪先把肉色混向乳白，再把胡椒粒以凸組合混向近黑，皆為C1；底色另有6×6低頻斑駁與128²細grain；cache合計20,104個Float64（160,832 B）＋1,600 B Uint8的胡椒存在表 = 162,432 B lattice算術預算（非總RAM）。顏色是顏料，脂肪height約0.4 relief、胡椒處凹下（0.2）、grain 0.4，脂肪處roughness降低0.12；金屬factor為0、無mortar、AO 1。預設0.12 m nominal tile與0.002 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color>0.6的脂肪占7.6–9.6%、color<0.12的胡椒占0.83–0.91%、color在0.12–0.45的肉占86.4–89.0%（平均0.281–0.285），color 0.0066–0.914，全圖平均0.326–0.339，roughness 0.48–0.60，height至多0.98–0.99 relief；seed 0與1的脂肪遮罩有16.3%像素不同；seed 7的512²maps平均r／g／b約(143, 69, 62)、法線tilt²最大約0.063。我實看了預覽：深紅底上有大小不一的乳白橢圓脂肪斑與細黑胡椒點，像薩拉米切面但比真實的規則許多，且前幾版調整過（第一版格狀太明顯、第二版斑塊太小太疏）。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('salami', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`baconstrips`（培根片）使目前目錄933→934種，含plain的gallery為935項。條紋培根片表面：約5條帶狀的紅色瘦肉與乳白色肥肉交錯，帶的相位被低頻雜訊扭成波浪，肥瘦比例隨位置平滑變化；瘦肉帶有沿u方向的肌纖維，肥肉較亮、略凸起且較光滑，兩者交界略暗（煎烤邊）。不是真實培根的皺縮、油脂氣泡、焦邊、片狀厚度或肉皮。

此材質是作者依一般條紋培根外觀所作示意，沒有引用特定來源文件、照片或量測，也沒有對照照片；帶數（每tile 5）、波浪幅度、肥肉比例、瘦肉與肥肉色調、纖維強度、roughness與0.2 m nominal tile皆作者設定，不宣稱符合任何實際培根的規格或烹調狀態。

新增專用sampler：相位 = `5·v + 1.4·(warp(u, v) − 0.5)`，`warp`為6×3的週期低頻雜訊，肥肉權重 = `0.5 + 0.5·tanh(3·(sin(2π·相位) − 0.2 − 0.6·(width(u, v) − 0.5)))`（`tanh`的正弦是平滑方波，C∞；`width`為5×5週期雜訊，使肥瘦寬度平滑變化；整數帶數隨tile wrap）；煎烤邊 `4·fat·(1 − fat)` 使交界略暗；瘦肉另有12×160的沿u方向纖維雜訊與128²細grain；cache合計18＋25＋1,920＋16,384 = 18,347個Float64／146,776 B lattice算術預算（非總RAM）。顏色是顏料，肥肉height約0.5 relief、纖維0.3、grain 0.2，肥肉處roughness降低0.14；金屬factor為0、無mortar、AO 1。預設0.2 m nominal tile與0.003 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：color>0.6的肥肉占38.4–39.7%、color<0.4的瘦肉占54.0–55.4%，color 0.138–0.912，全圖平均0.471–0.485，肥肉平均0.829–0.839、瘦肉平均0.221–0.224，roughness 0.410–0.550，height至多0.693–0.697 relief；瘦肉處沿v方向的逐像素色差約為沿u方向的2.5–2.7倍（seed 7為3.6倍）；seed 0與1的肥肉遮罩有48.3%像素不同；seed 7的512²maps平均r／g／b約(188, 124, 109)、法線tilt²最大約0.058。我實看了預覽：紅白相間的波浪條紋像培根，但條帶比真實培根平滑規則（沒有皺縮與氣泡）。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('baconstrips', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`sweetcorn`（甜玉米）使目前目錄932→933種，含plain的gallery為934項。玉米穗表面：14×14排成整齊行列的圓角方形黃色玉米粒，每粒有各自的色調（淡金黃到飽和黃）、微小的位置抖動與穹頂高光，粒與粒之間是較暗、受遮蔽的細縫。不是真實玉米穗的弧形包覆、粒的凹陷、花絲、苞葉、粒的大小變化或蒸煮後的外觀。

此材質是作者依一般新鮮甜玉米外觀所作示意，沒有引用特定來源文件、照片或量測；每tile 14×14粒、粒的大小（0.47格半寬）、抖動量、縫的色調與遮蔽、粒色變化量、roughness與0.13 m nominal tile皆作者設定，不宣稱符合任何真實玉米品種或尺寸，也沒有對照照片。

新增專用sampler：每粒是以抖動後位置為中心的四次超橢圓（圓角方形，`s = x⁴ + y⁴`為多項式），半寬0.47加抖動0.02小於半格，因此每粒在自己的格邊界前就歸零，逐粒查表不產生跳變；粒遮罩`smooth(clamp((1 − s)/0.25))`、穹頂`smooth(clamp(1 − s))`皆為C1；顏色在縫色與粒色（含逐粒色調與穹頂）之間依遮罩混合；縫處roughness升高0.3、AO降到0.5；cache合計3×196個Float64（4,704 B）＋128²紙grain（16,384個Float64／131,072 B）= 135,776 B lattice算術預算（非總RAM）。顏色是顏料，穹頂height約0.7 relief＋grain 0.3 relief；金屬factor為0、無mortar。預設0.13 m nominal tile與0.006 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：粒面（AO為1處）占70.9–71.0%，color 0.285–0.924，全圖平均0.685–0.693，粒心color 0.760–0.917（平均0.835–0.845），縫處（格角）平均0.300，roughness 0.38–0.68，最低AO 0.5，height至多0.994–0.997 relief；seed 0與1的粒心色差平均約0.049；seed 7的512²maps平均r／g／b約(222, 186, 66)、AO<230占25.8%、法線tilt²最大約0.351。我實看了預覽：整齊排列的圓角黃色玉米粒，比真實玉米規則許多（粒皆為同一大小的方格排列）。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('sweetcorn', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。建議size至少512，使每粒（約36像素）與縫可辨。

`crosswordgrid`（填字格）使目前目錄931→932種，含plain的gallery為933項。白紙上15×15格的填字遊戲方格：約兩成的黑格依180°旋轉對稱（與印刷填字格相同）分布，白格之間有淡灰細格線，字詞起始的白格（左／上為黑格或tile邊界而右／下為白格）左上角有小圓點作為題號標記。不是真實的填字謎題、可解的字詞、數字題號、題目文字或答案；黑格也不保證符合填字謎的全部排版規則（如連通性或最小字長）。

此材質是作者依一般報紙填字格外觀所作示意，沒有引用特定來源文件、照片或量測；格數（每tile 15×15）、黑格比例（0.2）、格線濃度與寬度、題號圓點的位置與大小、墨與紙的色調、roughness與0.3 m nominal tile皆作者設定，不宣稱符合任何實際填字格的規格。

新增專用sampler：黑格表為225項Uint8，只對一半格抽雜湊並以格序`i`與`224 − i`共用同一雜湊鏡射到tile中心（180°旋轉對稱），鄰格隨tile wrap；題號表為225項Uint8（白格且左／上為黑格而右／下為白格即為1）。格填色以smoothstep權重在格邊界混合（格中心斜率為零），格線是`exp(−sin²(π·n·s)/w²)`（C∞，隨tile在整數格數wrap），題號點是只在自己格內的`smooth(1 − q)`圓點，三者以聯集`1 − Π(1 − x)`合併，使每一項皆為C1且保持在[0, 1]；cache合計450 B＋128²紙grain（16,384個Float64／131,072 B）= 131,522 B lattice算術預算（非總RAM）。顏色是顏料，墨處height約0.7 relief＋紙grain 0.3 relief、roughness略降0.06；金屬factor為0、無mortar、AO 1。預設0.3 m nominal tile與0.0012 UV-relative relief（非公尺位移）。實測（工具實跑）：seed 0／1／0xffffffff的黑格數為32／52／56（共225格），題號點為47／66／55個，每個seed黑格皆對tile中心鏡射對稱（測試逐格驗證，題號點與左右／上下規則逐格一致）；512²取樣墨色（color<0.5）占15.3%／24.6%／26.4%，color 0.045–0.955，roughness 0.74–0.80、height至多0.9975–0.9982 relief；黑格中心color至多0.074、白格中心至少0.925；兩個白格之間的格線處比格中心暗約0.43（峰值設定0.45）；seed 0與1的225格中有64格黑白不同；seed 7的512²maps平均r／g／b約(177, 175, 172)、r<110占23.9%、法線tilt²最大約0.058。我實看了預覽：整齊的黑白格、細格線與題號點。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('crosswordgrid', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。建議size至少512，使格線（每格約34像素）與題號點可辨。

`windowpane`（窗格紋）使目前目錄930→931種，含plain的gallery為932項。暗炭灰藍的斜紋法蘭絨布面，上面是每tile 3×3格、橫直各一組的淡色細線（窗格），線在交叉處平滑相接；布面帶斜向2/2斜紋脊（80條）與逐紗線的雜訊。不是真實的毛織結構、每條紗線的幾何、雙線或不等距格線、縫線、毛邊或褪色。

此材質是作者依一般窗格紋（windowpane check）法蘭絨外觀所作示意，沒有引用特定來源文件、照片或量測；格數（每tile 3）、線寬、底色與線色的色調、斜紋線數、roughness與0.3 m nominal tile皆作者設定，不宣稱符合任何實際織物規格。

新增專用sampler：每個方向一組線，單條線是`exp(−sin²(π·n·s)/w²)`（C∞，隨tile在整數格數wrap），兩個方向以聯集`1 − (1 − a)(1 − b)`合併，使線在交叉處仍平滑；另加斜向2/2斜紋脊（`cos`，整數線數）與192²逐紗線雜訊（36,864個Float64／294,912 B lattice算術預算，非總RAM）。顏色是顏料，淡線略凸起（height 0.35 relief，斜紋0.4、紗線雜訊0.25）、roughness略降0.04；金屬factor為0、無mortar、AO 1。預設0.3 m nominal tile與0.004 UV-relative relief（非公尺位移）。實測（工具實跑，三seed 0／1／0xffffffff，512²取樣）：color>0.45的線占6.69–6.71%，color 0.150–0.798，全圖平均0.2365–0.2366，格內本體（遠離線處）平均0.1999–0.2001、本體色至多約0.250，roughness 0.84–0.88、height至多0.994–0.996 relief；沿斜紋脊方向與橫越脊方向的色差比約2.25–2.28；線中心平均約0.75、格中心平均約0.22；seed 0與1的逐點色差平均約0.0146；seed 7的512²maps平均r／g／b約(69, 70, 74)、r>110占6.6%、法線tilt²最大約0.362。我實看了四格預覽：整齊的炭灰藍法蘭絨與淡色窗格。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('windowpane', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。建議size至少512，使斜紋脊（80條）與窗格線有足夠像素。

`merbau`（印茄木）使目前目錄929→930種，含plain的gallery為931項。近似Intsia spp.未塗裝縱向木面：帶灰調的橙棕底色、粗質地、1條很淡的暗帶、縱向纖維與密集散布的細暗導管短痕（約1.4%）。不是新切時偏橙的鮮明色、黃色礦物沉積（yellow mineral deposits）、交錯紋或塗層。

外觀依據實際閱讀的[Wood Database Merbau](https://www.wood-database.com/merbau/)（Color／Appearance：新切為橙棕色，日久轉為較深的紅棕，板與板之間色差大，並有零星黃色礦物沉積；Grain／Texture：直紋到交錯紋、粗質地，中等光澤；Endgrain：散孔材，導管大到極大但很少）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/merbau.jpg)（帶灰調的暗棕面、許多縱向的細暗短導管痕、極少數黃色細線）；僅作配色與紋理形態參考，**不**重現黃色礦物沉積、交錯紋、板間色差或塗層，不打包來源圖，也不由照片反推真色、roughness或實際尺寸；導管密度為依照片外觀作者設定，不代表Wood Database「導管很少」的端面描述。

直接fallthrough重用既有Padauk／Bloodwood系細長橢圓導管sampler（與`blackwalnut`、`teak`、`honduranmahogany`、`shagbarkhickory`、`eastindianrosewood`、`bubinga`、`jarrah`同路徑），constructor只選preset：40×16個導管site（pose表20,480 B）、1條起伏（bandWarp 0.6）且對比低（bandContrast 0.1）的暗帶、200×8縱向fiber、128²細grain與固定3×4 warp，共20,556個Float64／164,448 B lattice算術預算（非總RAM）。金屬factor為0；導管凹點是真的height凹陷，色紋只是顏料。預設0.18 m nominal tile與0.0025 UV-relative relief（非公尺位移）皆作者設定。實測（工具實跑，三seed 0／1／0xffffffff、256²取樣）：導管（AO<0.9）占1.27–1.53%，無凹陷的本體占98.1–98.3%，本體色0.254–0.499，橫／縱色差比8.42–8.82，roughness 0.50–0.604、height 0.41–0.503 relief、最低AO 0.75；seed 7的512²maps平均r／g／b約(95, 69, 51)、AO<230占1.40%、法線tilt²最大約0.0069。我實看了預覽：暗棕底上有密集的細短導管痕，與照片的形態相近但規則得多（導管落在格狀site上）。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('merbau', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`crosshatchengraving`（交叉排線版畫）使目前目錄928→929種，含plain的gallery為930項。奶油色紙面上的黑色細排線，依低頻明暗場逐步加線：暗部出現第一組對角線，更暗處加上反向對角線形成交叉，最暗處再加水平線；線寬也隨明暗增加，亮部保持留白。不是真實版畫的刻線軌跡、可變線距、輪廓線、透視或圖像內容。

此材質是作者依一般銅版／鋼筆交叉排線（crosshatching）外觀所作示意，沒有引用特定來源文件、照片或量測；線數（每方向48條）、三組線的出現門檻（0.25／0.55／0.8）、線寬範圍、明暗場的6×6格解析度、墨與紙的色調、roughness與0.25 m nominal tile皆作者設定，不宣稱符合任何實際版畫或印刷規格。

新增專用sampler：6×6低頻雜訊決定明暗，三組整數線數的線族（`u+v`對角、`u−v`反向對角、水平`v`）各以平滑ramp在自己的門檻淡入，單條線是`exp(−sin²(π·n·s)/w²)`（C∞，隨tile整數wrap），線寬隨明暗由0.06增至0.3；三族以聯集`1 − Π(1 − x)`合併（不用`max`，因為`max`在兩族相等處有折角、不是C1——我實作時測試曾因此失敗，詳見ACCEPTANCE），整體為C1；cache合計6²（36個）＋128²紙grain（16,384個）= 16,420個Float64／131,360 B lattice算術預算（非總RAM）。顏色是顏料，墨線height約0.7 relief＋紙grain 0.3 relief；墨處roughness略降0.08；金屬factor為0、無mortar、AO 1。預設0.25 m nominal tile與0.0015 UV-relative relief（非公尺位移）。實測（工具實跑，seed 0／1／0xffffffff，512²取樣）：墨色（color<0.5）占5.33–14.64%（隨明暗場而異）、color>0.85的紙面占70.3–87.3%、color 0.040–0.960、平均0.796–0.883、roughness 0.72–0.80、height至多0.997 relief；seed 0與1的墨色遮罩有8.01%像素不同；seed 7的512²maps平均r／g／b約(201, 192, 172)、r<110占9.6%、法線tilt²最大約0.168。我實看了四格預覽：交叉排線的明暗層次清楚。未新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('crosshatchengraving', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。建議size至少512，使排線（每方向48條）至少有約5像素的間距。

`sheetmusic`（樂譜）使目前目錄927→928種，含plain的gallery為929項。奶油色紙面上6組五線譜（每組5條連續的細黑譜線，間以小節線：每tile 4條），每組16個音符位置，約八成有一個四分音符（隨機音高0–7個半階、符頭＋符桿，低音符桿朝上、高音符桿朝下），其餘為休止；譜組之間留白。不是真實樂曲或可演奏的音符、譜號、拍號、升降記號、符尾、連結線或歌詞。

此材質是作者依一般樂譜外觀所作示意，沒有引用特定來源文件、照片或量測；譜線間距、符頭大小、音符分布規則、墨與紙的色調、roughness與0.25 m nominal tile皆作者設定，不宣稱符合任何實際樂譜印刷規格，音符也不構成有意義的旋律。

新增專用sampler：每個譜組擁有自己的垂直間距、每個音符位置擁有自己的水平間距，所有標記都嚴格限制在自己的範圍內——五條譜線與小節線用`smooth(1 − d²/w²)`，符頭是`smooth(1 − q)`橢圓，符桿是帶平滑端點的線輪廓，標記間以聯集`ink += x·(1 − ink)`合併，因此墨色在任何擁有權邊界前就歸零，整體為C1；音符表為96項Uint8（0為休止，否則1 + 音高階）；cache合計96 B＋128²紙grain（16,384 Float64／131,072 B）= 131,168 B lattice算術預算（非總RAM）。顏色是顏料，墨線height約0.7 relief＋紙grain 0.3 relief；金屬factor為0、無mortar、AO 1。預設0.25 m nominal tile與0.0012 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）量測：512²取樣color<0.5的墨色占7.12–7.17%、color 0.031–0.960、平均約0.881、roughness 0.72到0.82、高度最高0.99 relief；每組5條譜線沿40個u取樣的最大color 0.069；譜組間留白位置的最小color 0.921；每個音符位置在「間」的高度上至多1個符頭，三seed共288個位置中有0.396在「間」上有符頭；seed 0與1的墨色遮罩有2.98%像素不同；seed7的512² r／g／b平均約(218,210,191)、r<100占5.5%、法線max tilt²約0.104。我實看了四圖：整齊的五線譜、小節線與帶符桿的音符。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('sheetmusic', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。建議size至少512，使譜線（約0.0011 UV寬）有約1像素。

`buffaloplaid`（水牛格紋）使目前目錄926→927種，含plain的gallery為928項。紅布上橫向與縱向各4條寬條紋（相位為整數，隨tile wrap），單一方向的條紋使布面變成暗紅，兩方向重疊處最暗近黑，形成經典的紅黑大格；布面帶斜向2/2斜紋脊（96條）與逐紗線的雜訊。不是真實織紋結構、每條紗線的幾何、縫線、毛邊或褪色。

此材質是作者依一般水牛格紋（buffalo plaid）襯衫布外觀所作示意，沒有引用特定來源文件、照片或量測；格數、條紋柔邊、斜紋線數、紅與近黑的色調、roughness與0.25 m nominal tile皆作者設定，不宣稱符合任何實際織物規格或配色。

新增專用sampler：條紋 = `0.5 + 0.5·tanh(5·sin(2π·4u))`（平滑方波，C∞，整數格數隨tile wrap），縱向同理；顏色 = `0.92 − 0.42·(橫條紋 + 縱條紋)`，加上斜紋`cos(2π·96·(u+v))`（整數線數）與192²逐紗線值雜訊（36,864 Float64／294,912 B lattice算術預算，非總RAM）；斜紋與紗線決定height，重疊處roughness略升（0.86→0.90）並帶AO 0.12。顏色是顏料，金屬factor為0、無mortar。預設0.25 m nominal tile與0.004 UV-relative relief（非公尺位移）皆作者設定。實作中修正兩處：首版baseTone 0.96，依推算（0.96＋斜紋0.025＋紗線0.03）無條紋處的color最高可能超過1（此為推算、未實測），故改為0.92；首版height含`− 0.1·重疊`，使重疊處height為負（−0.022 relief，超出[0,1]），改為`+ 0.1·(1 − 重疊)`。三seed（0／1／0xffffffff）量測：各格中心的16點平均——雙向重疊0.081、單向0.502、無條紋0.921；整體color 0.026–0.973、平均約0.500；roughness 0.86／重疊0.90；重疊處AO 0.88；seed只改變紗線雜訊，seed 0與1的取樣色差平均僅0.0114；seed7的512² r／g／b平均約(117,18,17)、r<70占23.6%、r>170占22.6%、法線max tilt²約0.460。我實看了四圖：整齊的紅黑大格與斜紋法線。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('buffaloplaid', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。建議size至少512，使96條斜紋線約5像素一條。

`jarrah`（賈拉木／澳洲桉）使目前目錄925→926種，含plain的gallery為927項。近似Eucalyptus marginata未塗裝縱向木面：磚紅偏棕的底色、中到粗的質地、2條很淡的暗紅褐起伏帶、縱向纖維與散布的細暗導管短痕（約0.65%）。不是淡黃至粉紅的窄邊材、膠囊／膠線（gum pockets）、捲曲紋、交錯／波浪紋或塗層。

外觀依據實際閱讀的[Wood Database Jarrah](https://www.wood-database.com/jarrah/)（Color／Appearance：心材由淡紅或棕到較深的磚紅、見光變深；窄邊材為淡黃到粉紅；Grain／Texture：交錯或波浪紋、中到粗質地，可能有膠囊或膠線瑕疵）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/jarrah-s-400x400.jpg)（磚紅偏紫灰的均勻面、極淡的縱向色變與零星暗點）；僅作配色與紋理形態參考，**不**重現邊材、膠線、捲曲或交錯紋，不打包來源圖，也不由照片反推真色、roughness或實際尺寸。

直接fallthrough重用既有Padauk／Bloodwood系細長橢圓導管sampler（與`blackwalnut`、`teak`、`honduranmahogany`、`shagbarkhickory`、`eastindianrosewood`、`bubinga`同路徑），constructor只選preset：36×12個導管site（pose表13,824 B）、2條起伏（bandWarp 0.7）且對比低（bandContrast 0.14）的暗帶、180×8縱向fiber、128²細grain與固定3×4 warp，共19,564 Float64／156,512 B lattice算術預算（非總RAM）。金屬factor為0；導管凹點是真的height凹陷，色紋只是顏料。預設0.18 m nominal tile與0.0025 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：導管占0.64–0.66%，本體色0.259–0.559，橫／縱色差比10.5–11.3，roughness 0.500–0.603，高度0.41–0.503 relief；seed7的512²平均base color約(105,58,52)、導管占0.63%、法線max tilt²約0.0069。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('jarrah', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`amberbubbles`（含氣泡的琥珀樹脂）使目前目錄924→925種，含plain的gallery為926項。橘黃色的光滑樹脂，由4個整數波數正弦彎曲的3條流動帶形成緩慢捲動的明暗紋；14×14格中約45%有一顆被困住的氣泡（隨機大小與位置），氣泡略凸、更光滑、帶一圈明亮的透鏡邊緣與淡淡的光暈；另有10×10的低頻混濁。不是半透明（次表面）、內含物（昆蟲、植物）、裂紋或打磨痕。

此材質是作者依一般琥珀樹脂（流紋與氣泡）外觀所作示意，沒有引用特定來源文件、照片或量測；流動帶數、氣泡密度與大小、色調、roughness與0.12 m nominal tile皆作者設定，不宣稱符合任何實際琥珀或樹脂，也不模擬半透明與折射。

新增專用sampler：流動 = `0.5 + 0.5·sin(2π·3u + 0.8·Σ sin(2π(m·u + n·v) + φ))`（四個整數波數正弦，含seed相位）；每格存3個Float64（抖動位置x、y與大小）的14²格氣泡，每顆氣泡是`smooth(1 − q/(size·r)²)`圓頂（r = 0.36格）加上位於0.55倍半徑、寬0.25的以半徑平方表示的高斯亮環（乘圓頂包絡，避免圓心處的尖點），取3×3鄰格，並以`S/(1+S)`飽和；混濁為10²值雜訊；全部C1。cache合計100＋588＋4 = 692 Float64／5,536 B lattice算術預算（非總RAM）。顏色是顏料，height只用於法線與AO；金屬factor為0、無mortar。預設0.12 m nominal tile與0.004 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、512²取樣：高度超過0.13 relief的氣泡占6.95–7.49%、color>0.8占1.35–1.84%、color 0.432–0.896、平均0.584–0.597、roughness 0.08到0.13、最低AO 0.905、高度0到0.38 relief；seed 0與1的氣泡遮罩有13.1%像素不同；seed7的512² r／g／b平均約(189,119,25)、AO<250占7.8%、法線max tilt²約0.080。我實看了四圖：流動明暗紋與帶亮緣的氣泡、法線圖氣泡為淺凸。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('amberbubbles', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`cauliflowercurd`（花椰菜凝乳）使目前目錄923→924種，含plain的gallery為925項。奶白色花球表面，由三個尺度（10²、26²、64²格）的圓頂花蕾堆疊：大花球上長較小的花蕾、再長更小的凸粒；花蕾頂較亮，間隙帶灰米色並有AO遮蔽（AO<0.7約占15%）；整體粗糙（roughness恆為0.78）、帶細grain。不是莖、葉、花球的整體曲面、斑點或褐變。

此材質是作者依一般花椰菜（白花椰）花球表面外觀所作示意，沒有引用特定來源文件、照片或量測；三個尺度的格數、半徑、振幅、色調、roughness與0.12 m nominal tile皆作者設定，不宣稱符合任何花椰菜品種，也不是真正的碎形（只有三層疊加）。

新增專用sampler：三個尺度各存每格3個Float64（抖動位置x、y與大小），共(10²＋26²＋64²)×3 = 14,616 Float64，加128²細grain（16,384 Float64），合計31,000 Float64／248,000 B lattice算術預算（非總RAM）。每個尺度把`smooth(1 − q/r²)`花蕾圓頂（r = 0.62格）加總於3×3鄰格，三層高度以振幅1、0.45、0.2相加，`H/(1+0.12H)`飽和為高度；顏色用`H/(1+H)`映射以免超出[0,1]，AO為`1 − 0.55/(1+8H²)`，全部C∞／C1。顏色是顏料，height只用於法線與AO；金屬factor為0、無mortar。預設0.12 m nominal tile與0.016 UV-relative relief（非公尺位移）皆作者設定。調整過程：首版（8／20／48格、r = 0.95、saturation 0.55）渲染成模糊的雲狀起伏、看不出花蕾，改為10／26／64格、r = 0.62、saturation 0.12後實看確認有成簇的圓蕾；此外調整後color最高達1.277（超出[0,1]），改成`H/(1+H)`映射並把heightTone設為1，探測確認最高為0.925–0.951。三seed（0／1／0xffffffff）、512²取樣：AO<0.7占13.8–16.2%、AO<0.6占7.2–9.0%、color>0.75占35.2–38.5%、color 0.281–0.951、平均0.678–0.689、AO 0.45–0.978、高度0到1.66–1.78 relief；seed 0與1的AO<0.7遮罩有22.5%像素不同；seed7的512² r／g／b平均約(216,210,187)、AO<178占15.1%、法線max tilt²約0.715。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('cauliflowercurd', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。建議size至少512，使最小尺度的凸粒至少有數個像素。

`bubinga`（非洲紫檀／布賓加）使目前目錄922→923種，含plain的gallery為924項。近似Guibourtia屬未塗裝縱向木面：粉紅紅褐底色、均勻細質地、3條較暗的紅褐起伏淡條紋、縱向纖維與散布的細暗導管凹點（約1.2%）。不是紫或黑色條紋、稻草色邊材、波紋（pommele）、火焰、瀑布或絞絲等花紋、交錯紋或塗層。

外觀依據實際閱讀的[Wood Database Bubinga](https://www.wood-database.com/bubinga/)（Color／Appearance：心材由粉紅紅色到較深的紅褐，帶更暗的紫或黑色條紋；邊材為淡稻草色且與心材分明；常見多種花紋；Grain／Texture：直到交錯紋、均勻的細到中等質地與適度天然光澤）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/guibourtia-spp-300x600.jpg)（均勻紅褐面、細暗導管線與淡淡的縱向起伏）；僅作配色與紋理形態參考，**不**重現頁面所述的紫／黑色條紋、淡色邊材與各種花紋，不打包來源圖，也不由照片反推真色、roughness或實際尺寸。

直接fallthrough重用既有Padauk／Bloodwood系細長橢圓導管sampler（與`blackwalnut`、`teak`、`honduranmahogany`、`shagbarkhickory`、`eastindianrosewood`同路徑），constructor只選preset：44×14個導管site（pose表19,712 B）、3條起伏（bandWarp 0.6）且對比低（bandContrast 0.25）的暗帶、220×9縱向fiber、128²細grain與固定3×4 warp，共20,840 Float64／166,720 B lattice算術預算（非總RAM）。金屬factor為0；導管凹點是真的height凹陷，色紋只是顏料。預設0.18 m nominal tile與0.0025 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：導管占1.13–1.23%，本體色0.257–0.729，橫／縱色差比11.9–12.9，roughness 0.460–0.564，高度0.41–0.503 relief；seed7的512²平均base color約(141,71,42)、導管占1.29%、法線max tilt²約0.0061。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('bubinga', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`pomegranatearils`（石榴籽囊）使目前目錄921→922種，含plain的gallery為923項。20×20格、每格一個抖動位置、大小與色調各異的圓形紅寶石色籽囊緊密堆疊並互相重疊，每顆上有偏左上的小高光，籽囊光滑、略高、無遮蔽；籽囊之間的縫隙很暗、較粗糙並帶AO（AO<0.5約占面積8.7%）。不是半透明（次表面）、果肉汁液、白色隔膜、果皮或籽的內部結構。

此材質是作者依一般石榴籽囊（紅色圓粒緊密堆疊）外觀所作示意，沒有引用特定來源文件、照片或量測；籽囊大小、色調、高光、縫隙色、roughness與0.12 m nominal tile皆作者設定，不宣稱符合任何石榴品種，也不模擬半透明。

新增專用sampler：每格存4個Float64（抖動位置x、y，相對大小與色調），20²格共1,600 Float64／12,800 B lattice算術預算（非總RAM）。每顆籽囊是`smooth(1 − q/(size·r)²)`圓頂（r = 0.78格）加總於3×3鄰格；覆蓋度為`g·W/(1+g·W)`（W為圓頂權重和、g = 1.3），顏色取圓頂加權的色調平均，再加上各顆偏左上的小圓頂高光；縫隙處覆蓋度小，退回很暗的縫隙色並提高roughness與AO遮蔽。全部為C1。顏色是顏料，height只用於法線與AO；金屬factor為0、無mortar。預設0.12 m nominal tile與0.01 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、512²取樣：AO<0.5占8.67–8.84%、AO<0.7占20.3–20.5%、color 0.06（縫隙色）到0.815–0.880、平均0.373–0.382、roughness 0.230–0.238到0.58、最低AO 0.30、高度0到0.510–0.519 relief；seed 0與1的AO<0.5遮罩有14.0%像素不同；seed7的512² r／g／b平均約(129,26,41)、AO<230占95.4%、法線max tilt²約0.102。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('pomegranatearils', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。建議size至少512，使每顆籽囊約有數十像素。

`pumpkinskin`（南瓜皮）使目前目錄920→921種，含plain的gallery為922項。橙色果皮上有8條沿v方向縱貫的隆起稜（稜相位被低頻場輕微彎曲），稜間溝槽較暗、較粗糙並帶AO（約四成面積在溝槽中），稜上有細縱向皮紋與約三分之一格有的小疣點。不是果蒂、果瓣曲面、白斑、傷痕或塗層。

此材質是作者依一般南瓜皮縱稜外觀所作示意，沒有引用特定來源文件、照片或量測；稜數、彎曲量、疣點密度、色調、roughness與0.4 m nominal tile皆作者設定，不宣稱符合任何南瓜品種。

新增專用sampler：稜 = `0.5 + 0.5cos(2π·(8u + 0.07·8·(噪聲−0.5)))`（8個整數稜，噪聲為6×6低頻雜訊使溝槽略為彎曲），皮紋為150×6的縱向拉長值雜訊，疣點為24×24格每格3個Float64的抖動位置與大小（約35%的格有疣）、以`smooth(1 − q/r²)`圓頂加總並以`W/(1+W)`飽和，故皆為C1。cache合計36＋900＋1,728 = 2,664 Float64／21,312 B lattice算術預算（非總RAM）。顏色是顏料，height只用於法線與AO；金屬factor為0、無mortar。預設0.4 m nominal tile與0.012 UV-relative relief（非公尺位移）皆作者設定。調整過程：首版ribWarp 0.12、疣點偏淡，實看後稜過度蜿蜒，改為0.07並加強疣點；另外首版baseTone 0.78使color最高達1.0036（超出[0,1]），改為0.72。三seed（0／1／0xffffffff）、512²取樣：color 0.572–0.942、平均約0.728、AO<0.95的溝槽占43.5–44.2%、最低AO 0.60、roughness 0.55–0.67、高度0.0015–0.958 relief、橫／縱色差比5.2–6.2；沿三條水平線（v = 0.13、0.5、0.81）各數到恰好8個溝槽；seed 0與1的取樣色差平均0.059；seed7的512²中r／g／b平均約(224,126,23)、AO<242占43.3%、法線max tilt²約0.243。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('pumpkinskin', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`citruspeel`（柑橘果皮）使目前目錄919→920種，含plain的gallery為921項。明亮橙色果皮，48×48格、約九成格有一個抖動位置的油胞凹點（隨機深度），相鄰凹點可重疊，約四成面積落在凹點中（凹點較暗、較低、較粗糙並帶AO），另有柔和的6×6低頻色斑與細grain。不是橘瓣紋、果蒂、果皮厚度、白色內皮、油珠或傷痕。

此材質是作者依一般橙子果皮（油胞凹點）外觀所作示意，沒有引用特定來源文件、照片或量測；凹點密度與半徑、色調、roughness與0.12 m nominal tile皆作者設定，不宣稱符合任何柑橘品種。

新增專用sampler：每格存3個Float64（抖動位置x、y與深度；缺凹點時深度0），48²格共6,912 Float64，加6×6色斑雜訊（36 Float64）與128²細grain（16,384 Float64），合計23,332 Float64／186,656 B lattice算術預算（非總RAM）。凹點以加總處理：每個是`smooth(1 − q/r²)`碗（r = 0.55格、邊緣值與斜率歸零），取3×3鄰格，以`D/(1+D)`飽和後降低color、height並提高roughness與AO遮蔽，因此重疊處仍為C1。顏色是顏料，height只用於法線與AO；金屬factor為0、無mortar。預設0.12 m nominal tile與0.006 UV-relative relief（非公尺位移）皆作者設定。首版baseTone 0.72，渲染後偏暗褐、不像橙色，改為0.86（pitTone 0.26、mottleTone 0.14）並重看。三seed（0／1／0xffffffff）、512²取樣：AO<0.9的凹點占40.9–41.4%、color 0.624–0.941、平均0.799–0.808、roughness 0.420–0.496、高度0.377–0.799 relief、最低AO 0.778–0.783、平地比凹點高約0.172 relief；seed 0與1的凹點遮罩有41.9%像素不同；seed7的512²中r／g／b平均約(234,148,27)、AO<230占40.7%、法線max tilt²約0.170。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('citruspeel', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。建議size至少512，使每個凹點約有數個像素。

`coirdoormat`（椰殼纖維門墊）使目前目錄918→919種，含plain的gallery為920項。深褐到淡褐的粗硬纖維，在5×5低頻分塊中分成四種方向（水平、垂直、兩個斜向），各塊內是細長條狀的纖維紋，塊間以平滑權重交接；整體粗糙、帶些許縫隙陰影（AO最低約0.55）與細小絨毛起伏。不是單根纖維的幾何、編織底布、橡膠框邊、字樣或磨損。

此材質是作者依一般椰殼纖維（coir）門墊外觀所作示意，沒有引用特定來源文件、照片或量測；方向分塊、纖維粗細、色調、roughness與0.3 m nominal tile皆作者設定，不宣稱符合任何實際產品或材質規格。

新增專用sampler：4個以不同方向拉長的細條值雜訊——水平（12×170格）、垂直（170×12格）與兩個以整數剪切`(u+v, v)`、`(u−v, v)`取樣的斜向（各170×12格，因係整數剪切，仍隨tile wrap）——加上128²細絨毛雜訊與5×5低頻分塊雜訊；分塊雜訊×4決定方向，四個方向權重為`cos²(π/2·距離)`（距離為環形，≤1才非零），它們在交接處斜率為0且總和恆為1，因此混合為C1。cache合計24,569 Float64／196,552 B lattice算術預算（非總RAM）。顏色是顏料，height只用於法線與AO；金屬factor為0、無mortar。預設0.3 m nominal tile與0.006 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：color 0.007–0.053到0.654–0.678、平均0.348–0.358、標準差約0.101、roughness 0.935–0.965、高度0.024–0.953 relief、最低AO 0.553–0.558、橫／縱色差比1.03–1.23（無全域纖維方向）；seed 0與1的取樣色差平均0.113；seed7的512²中r／g／b平均約(91,65,40)、r<90占45.2%、AO<200占15.7%、法線max tilt²約0.618。我實看了四圖：呈粗硬的方向性分塊纖維、法線圖紋理強烈。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('coirdoormat', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`europeanyew`（歐洲紫杉）使目前目錄917→918種，含plain的gallery為919項。近似Taxus baccata未塗裝弦切面心材：橙褐色底、細而均勻的質地、16條密集起伏帶拱形的較深褐生長紋（約占面積七分之一）與細縱向纖維。不是淡黃褐的窄邊材帶、偏紫的暗褐色變、節、瘤或塗層。

外觀依據實際閱讀的[Wood Database European Yew](https://www.wood-database.com/european-yew/)（Color／Appearance：邊材通常為淡黃或棕褐的窄帶，心材為橙褐色、有時帶更暗的棕或紫調；Grain／Texture：直紋、細而均勻的質地、天然光澤佳）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/taxus-baccata-300x600.jpg)（橙褐色面、細密生長紋與拱形、一個暗色節）；僅作配色與紋理形態參考，**不**重現照片中的節、邊材帶或紫調，不打包來源圖，也不由照片反推真色、roughness或實際尺寸。

直接fallthrough重用`douglasfir`年輪sampler（與`longleafpine`、`westernredcedar`、`sitkaspruce`、`europeanlarch`、`europeanolive`同路徑），constructor只選新preset（rings 16、arch 1.9、warp 0.6、latewood 0.55–0.9、lateTone 0.32、earlyTone 0.82）；warp 36＋fiber 200×6＋128²細grain共17,620 Float64／140,960 B lattice算術預算（非總RAM）。金屬factor為0，晚材略高，年輪紋色是顏料。預設0.18 m nominal tile與0.0025 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：color<0.6占14.9–15.2%、color>0.75占70.2–70.5%、色域0.469–0.881、roughness 0.421–0.490、高度0.498–0.642 relief、橫／縱色差比3.64–3.66、最低AO 0.96；seed7的512²中r／g／b平均約(216,143,68)、g≥140占72.4%（g<140占27.6%）、法線max tilt²約0.0149。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('europeanyew', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`raindropripples`（雨滴漣漪）使目前目錄916→917種，含plain的gallery為918項。深灰藍的光滑水面上，8×8個位置抖動的雨滴各自擴散出同心漣漪環（隨機振幅與相位），相鄰漣漪疊加成干涉圖樣；環的亮／暗波峰各占約6–9%面積，水面反光顏色圍繞中灰藍，波處roughness略升、法線顯示清楚的環狀起伏。不是隨時間擴散、水面下的折射、水花、泡沫或岸邊反射。

此材質是作者依「雨滴落在水面形成的同心漣漪」一般印象所作示意，沒有引用特定來源文件、照片或量測；格數、環波長、包絡半徑、振幅範圍、色調、roughness與0.4 m nominal tile皆作者設定，不宣稱符合任何實際水體或流體力學模型（沒有色散、衰減律或波速關係）。

新增專用sampler：每格存4個Float64（抖動位置x、y，振幅與環相位），8×8格共256 Float64，另有96²細grain（9,216 Float64），合計9,472 Float64／75,776 B lattice算術預算（非總RAM）。漣漪以加總處理：每個雨滴貢獻`振幅·smooth(1 − q/R²)·cos(2π√q/λ − 相位)`（包絡R = 0.78格、於外緣值與斜率歸零；`cos(k√q)`對半徑為偶函數，故在圓心亦光滑），取3×3鄰格；以`tanh(1.1·Σ)`把無界的加總映射為反光亮／暗，所以重疊處仍為C1。顏色是顏料（水面反光），height只用於法線；金屬factor為0、無mortar、AO 1。預設0.4 m nominal tile與0.0022 UV-relative relief（非公尺位移）皆作者設定。我修正過一次：首版把環頻率錯誤地再除以格數，渲染出過寬的環，改正後並實看四圖確認呈細密的同心圈（波長0.2格×每格64像素≈12.8像素，為計算值）。三seed（0／1／0xffffffff）、512²取樣：color>0.75占6.1–8.6%、color<0.25占6.1–8.6%（兩者相差不到0.3個百分點）、color 0.111–0.887、平均0.4999–0.5004、roughness 0.080–0.122、高度0.044–0.954 relief、AO 1；沿三條水平線的色相穿越中灰次數為32–66；seed 0與1的影像取樣平均色差0.189；seed7的512² r／g／b平均約(115,132,143)、r<80占12.8%、r>150占12.9%、法線max tilt²約0.107。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('raindropripples', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。建議size至少512，使環波長（約13像素）有足夠取樣。

`gamedice`（遊戲骰子）使目前目錄915→916種，含plain的gallery為917項。6×6顆象牙白圓角方骰排成一盤，骰面壓入黑色圓形點數（標準1–6點配置，每顆隨seed擲出），骰子間是較暗、較粗糙且帶AO的托盤；骰面光滑、點數凹陷且較粗糙。不是立體骰子的三個面、斜放或堆疊、骰邊倒角之外的幾何、點數塗漆厚度或磨損。

此材質是作者依一般六面骰子的標準點數配置（1–6點）所作示意，沒有引用特定來源文件、照片或量測；骰子大小、圓角、點數半徑與深度、色調、roughness與0.3 m nominal tile皆作者設定，不宣稱符合任何實際骰子規格（如尺寸或對面和為7的排列），也不模擬真實骰子的點數凹陷方式。

新增專用sampler：36顆骰各以`hash`依seed擲出1–6，點數位置取自七個候選位置（四角、左右中央與中心）的標準配置；骰身為兩個平滑邊緣斜坡的乘積（頂面平坦、邊緣斜率為0），點數 = `smooth(1 − q/r²)`壓入面內，托盤色與骰色以骰身權重混合，因此皆C1。cache為36項Uint8點數表與64²細grain（4,096 Float64），共32,804 B lattice算術預算（非總RAM）。顏色是顏料，height只用於法線與AO；金屬factor為0、無mortar。預設0.3 m nominal tile與0.012 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）量測：每顆骰的七個位置中暗點構成的集合都恰為六種標準配置之一；三seed共108顆骰的點數分布為1點21、2點17、3點19、4點18、5點21、6點12顆；骰面color 0.921–0.939、點數0.04、托盤0.16；骰面高度1.0 relief、點數0.78、托盤0；roughness骰面0.30／點數0.55／托盤0.40；托盤AO 0.5、骰面1；seed7的512²中r平均143.7、r<60占33.0%、r>180占46.3%、AO<200占39.2%、法線max tilt²約0.532。我實看了四圖，確認2、3、5、6點的配置與標準骰面一致。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('gamedice', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。建議size至少512，使每顆骰約85像素。

`europeanolive`（歐洲橄欖木）使目前目錄914→915種，含plain的gallery為916項。近似Olea europaea未塗裝弦切面：淡黃褐底色、細而均勻的質地、6條細長起伏帶拱形的深黃褐生長紋（約占面積一成以下）與細縱向纖維。不是深褐至近黑的縱向條紋與紋理、彎曲／野生紋、瘤紋、邊心材界線或塗層。

外觀依據實際閱讀的[Wood Database Olive](https://www.wood-database.com/olive/)（Color／Appearance：心材由黃到淺紅褐，帶更暗的棕到黑色條紋與脈；邊材淡黃且與心材分明；Grain／Texture：紋理可為直、交錯或野生；細而均勻的質地、帶適度天然光澤）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/olea-europaea-300x600.jpg)（淡黃褐面、細暗生長紋與拱形）；僅作配色與紋理形態參考，**不**重現頁面所述的深褐至近黑條紋與脈、野生紋或瘤紋，不打包來源圖，也不由照片反推真色、roughness或實際尺寸。

直接fallthrough重用`douglasfir`年輪sampler（與`longleafpine`、`westernredcedar`、`sitkaspruce`、`europeanlarch`同路徑），constructor只選新preset（rings 6、arch 3.4、warp 0.9、latewood 0.8–0.96的窄線、lateTone 0.14、earlyTone 0.78）；warp 49＋fiber 220×5＋128²細grain共17,533 Float64／140,264 B lattice算術預算（非總RAM）。金屬factor為0，晚材略高，年輪紋色是顏料。預設0.18 m nominal tile與0.002 UV-relative relief（非公尺位移）皆作者設定。我先把lateTone設為0.3，渲染後年輪線太淡，改為0.14。三seed（0／1／0xffffffff）、256²取樣：color<0.72占9.1–9.9%、color>0.8占33.1–34.1%、色域0.605–0.847、roughness 0.381–0.450、高度0.498–0.602 relief、橫／縱色差比2.44–2.49、最低AO 0.97；seed7的512²中r／g／b平均約(223,194,141)、g≥185占95.9%（g<185占4.1%）、法線max tilt²約0.0052。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('europeanolive', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`poolcaustics`（泳池焦散）使目前目錄913→914種，含plain的gallery為915項。藍色池底上有一張明亮、分岔的細光網，網眼間是較暗的深藍色塊；約三分之一面積偏亮，光網處roughness略低，池底有細微顆粒起伏。不是隨時間流動的焦散、真實折射光線追蹤、池磚縫、水面反射或深度漸層。

此材質是作者依「泳池底焦散光網」一般印象所作示意，沒有引用特定來源文件、照片或量測；光網由我自行設計的三組彎曲線族疊成，只在視覺上近似光網，並非物理上的焦散模型。線族方向、寬度、增益、色調、roughness與0.5 m nominal tile皆作者設定，不宣稱符合任何真實水池或光學規格。

新增專用sampler：三組整數波數線族`(6,0)`、`(3,5)`、`(−3,5)`，各自的相位再被三個整數波數正弦（含seed相位）彎曲，每族貢獻`exp(−sin²(π·相位)/w²)`（C∞），加總後以`S/(1+S)`飽和映射到color與roughness；線被彎曲擠在一起處光暈疊加，形成較亮較細的分岔網。cache為96²池底grain（9,216 Float64）加3相位與3偏移共9,222 Float64／73,776 B lattice算術預算（非總RAM）。顏色是顏料，height只用於法線；金屬factor為0、無mortar、AO 1。預設0.5 m nominal tile與0.002 UV-relative relief（非公尺位移）皆作者設定。調整過程：首版（warpAmplitude 0.9、lineWidth 0.2、gain 0.9）渲染成纏繞的細線圈，不像焦散；第二版放寬線寬（0.55）、降低彎曲與增益後成為軟光網但對比偏低；最後把lineWidth設0.42、gain 0.9、baseTone 0.16以提高對比，並實看確認呈現有深色網眼的亮色分岔網。三seed（0／1／0xffffffff）、512²取樣：color>0.55占33.3–36.9%、color<0.3占22.3–24.3%、color 0.144–0.793、平均0.449–0.461、roughness 0.554–0.698、AO 1；seed 0與1的亮區遮罩有43.9%像素不同；seed7的512² r／g／b平均約(99,138,165)、法線max tilt²約0.066。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('poolcaustics', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`metalflakepaint`（金屬片漆）使目前目錄912→913種，含plain的gallery為914項。深藍清漆底色上散布隨機位置、隨機傾斜與亮度的圓形金屬片（64×64格、約半數格有片），約21–22%的面積被片覆蓋；片本身淡薰衣草銀色，在metallic通道中形成部分金屬遮罩（最高約0.68，不是全金屬），片的小傾斜使法線閃爍，清漆底則為非金屬。不是珠光／變色（多色）、片的多邊形形狀、各片獨立反射方向或清漆層厚度。

此材質是作者依一般金屬片車漆外觀所作示意，沒有引用特定來源文件、照片或量測；片大小、密度、色調、metallic覆蓋、roughness與0.1 m nominal tile皆作者設定，不宣稱符合任何實際塗料或色號。

新增專用sampler：每格存5個Float64（抖動位置x、y，傾斜x、y與色調；缺片時色調0），64²格共20,480 Float64，另有128²清漆grain 16,384 Float64，合計36,864 Float64／294,912 B lattice算術預算（非總RAM）。金屬片以加總而非擁有權處理：每片是`smooth(1 − q/r²)`圓頂（半徑0.55格、值與斜率於邊緣歸零），取3×3鄰格（片最遠達半徑加抖動共0.9格，足夠涵蓋）；高度為各片圓頂乘以`1 + 2·tilt·(tiltX·dx + tiltY·dy)`的加總，因此重疊處仍為C1。覆蓋度`S/(1+S)`（S為加權和乘flakeGain 1.2）飽和映射到color、metallic、roughness與AO，不做硬剪裁。這是此kind之所以加入`procedural-material.ts`的metallic清單（金屬factor 1，由逐樣本metallic通道控制）與測試的通用「非金屬」例外清單。預設0.1 m nominal tile與0.003 UV-relative relief（非公尺位移）皆作者設定。首版以48格、半徑0.78、存在率0.85渲染，實看後幾乎整面是銀色而看不到藍色底，所以改成64格、半徑0.55、存在率0.5、flakeGain 1.2。三seed（0／1／0xffffffff）、512²取樣：metallic>0.3占21.5–22.3%、metallic最高0.671–0.683、最低0、平均0.117–0.121、color 0.165–0.748、高度0.25到1.31–1.38 relief、roughness 0.052–0.12、AO最低0.932、color與metallic的相關係數約0.999；seed 0與1的片遮罩有33.3%像素不同；seed7的512²中r／b平均約(73,113)、metallic通道平均30.3／255、其中>76占21.9%、法線max tilt²約0.351。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('metalflakepaint', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為1並由逐像素metallic通道決定片的金屬度，texture清理沿用既有`destroy()`。建議size至少512，使每片約有數個像素。

`tapemeasure`（捲尺）使目前目錄911→912種，含plain的gallery為913項。一個tile是黃色捲尺的100 mm段：100條毫米刻度（長0.2 tile高）、每5 mm一條較長（0.3）、每10 mm一條最長而較粗（0.42）的近黑刻線，從帶邊下方0.08起向下垂；橫截面是兩緣升起、中央下凹的餘弦弧，光滑塗層因此在縱向有法線梯度。沒有數字、英制刻度、端鉤、捲尺外殼或磨損。

此材質是作者依一般公制捲尺外觀所作示意，沒有引用特定來源文件、照片或量測；刻線長度與寬度、黃色、凹弧深度、roughness與0.1 m nominal tile（正好對應100 mm段）皆作者設定，不宣稱符合任何實際捲尺標準或精度等級。

新增專用sampler：以`k = round(u·100)`找最近刻線，長度依k的1／5／10 mm階層決定，墨 = `smooth(1 − d²/w²)`乘以上下0.004斜坡，超出刻線寬度即為0，因此最近刻線擁有權在半毫米處切換時不會跳變；凹弧高度 = `0.1 + 0.55·(0.5+0.5cos 2πv)`，兩緣斜率為0，故跨tile C1，緣部並帶AO（至多0.25）。cache只有64²紙／塗層grain（4,096 Float64／32,768 B lattice算術預算，非總RAM）。顏色是顏料，墨線height 0.04 relief；金屬factor為0（塗裝捲尺）、無mortar。預設0.1 m nominal tile與0.03 UV-relative relief（非公尺位移）皆作者設定；我先用0.01，實看後發現法線過平，改為0.03。三seed（0／1／0xffffffff）量測：v = tickTop + 0.1處100條刻線全暗（color 0.016–0.043）、刻線之間color≥0.886；在長度0.25／0.35處分別有20／10條暗刻線、超過最長刻線則為0；整體color 0.016–0.915、height 0.100–0.653 relief、AO 0.75–1、roughness 0.375–0.544；seed7的512²中r／g／b平均約(217,185,35)、黃色像素（r>180、g>150、b<70）占94.3%、r<100占4.3%、法線max tilt²約0.111。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('tapemeasure', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。建議size至少512，使毫米刻線至少約1像素寬。

`ledmatrix`（LED點陣面板）使目前目錄910→911種，含plain的gallery為912項。48×48顆圓形LED，分成8×6個字元格（每格5×7顆LED加一欄一列空白）；每格隨seed點亮2–4條隨機的水平、垂直或斜向短筆畫（偽字形，不是字型），亮的LED為紅橘色高亮、暗的為暗紅，LED透鏡光滑而略凸，黑色底板較粗糙、帶AO。不是真實字型或可讀文字、捲動動畫、發光（emission）、混色或RGB子像素。

此材質是作者依一般LED點陣顯示面板結構所作示意，沒有引用特定來源文件、照片或量測；LED數、字元格大小、筆畫產生規則、色調、roughness、AO與0.16 m nominal tile皆作者設定，不宣稱符合任何實際產品。

新增專用sampler：建構時依seed以`hash`為每個字元格抽出筆畫並寫入2,304項Uint8亮燈表，另有2,304項Float64亮度抖動（共2,304 B＋18,432 B = 20,736 B lattice算術預算，非總RAM）。採樣時每顆LED擁有自己的方格，透鏡 = `smooth(1 − q/r²)`且r = 0.46 < 0.5，於格界歸零（值與斜率），因此亮暗色調不會在格界跳變；底板在透鏡之間露出。顏色是顏料（沒有emission），亮LED再加0.1的透鏡高光色調；height只用於法線與AO；金屬factor為0、無mortar。預設0.16 m nominal tile與0.004 UV-relative relief（非公尺位移）皆作者設定。我先把litTone設為0.88，探測發現亮LED的color最高達1.0199（超出[0,1]），改為0.84後亮LED color為0.900–0.980。三seed（0／1／0xffffffff）量測：亮燈比例12.9–14.1%、亮LED color 0.900–0.980、暗LED 0.150–0.170、透鏡高度1.0 relief／底板0、透鏡roughness 0.17／底板0.62、底板AO 0.55／透鏡1、底板color 0.02；seed 0與1的亮燈遮罩有21.5%的LED不同；seed7的512²中r平均48.0、r>160占3.07%、AO<200占67.6%、法線max tilt²約0.413。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('ledmatrix', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。建議size至少512，使每顆LED約10像素。

`barcodelabel`（條碼標籤）使目前目錄909→910種，含plain的gallery為911項。一個tile是一張完整標籤寬度：左右各10模組靜區、Code 128 Start B 起始樣式（11模組）、9個資料符號（每個為6段交替的條／空寬度，各1–4模組、合計11模組）與13模組停止樣式，共143模組；條只佔v 0.1–0.9的標籤帶，上下是留白。黑色近黑碳粉（略高、略平滑）印在偏白粗糙紙面上，並有細紙纖維grain。不是可解碼的Code 128：資料符號是隨seed抽出的隨機寬度，沒有檢查碼、沒有奇偶（條寬和為偶、空寬和為奇）限制，也沒有人眼可讀文字、其他標籤元素或曲面。

結構依據實際閱讀的[Wikipedia「Code 128」](https://en.wikipedia.org/wiki/Code_128)：每個符號為三條黑條與三條空白、各1–4模組、合計11模組，且以條起、以空結束；停止樣式為13模組（含結尾2模組條）；左右靜區至少10模組。我使用的Start B位元樣式`11010010000`與停止樣式`1100011101011`來自我對標準樣式表的記憶，該頁擷取到的文字沒有包含這些表格，所以這兩串位元**未由該頁驗證**。外觀（黑條白紙、0.14 m tile、碳粉高度、roughness、紙色）皆作者設定，沒有引用特定標籤照片或量測。

新增專用sampler：建構時依seed以`hash`抽出9個符號（五段寬度各1–4、第六段由「合計11」推出並要求落在1–4，最多重試4,096次，失敗則回退為Start B寬度），組成143模組位元陣列；採樣時以x = fract(u)·143找模組，條邊在模組界線兩側各`edgeRamp/2 = 0.11`模組內以`smooth`混合（兩端斜率為0，故C1），標籤帶上下緣亦以0.012的`smooth`斜坡。cache為96²紙纖維grain（9,216 Float64／73,728 B）加143項模組位元陣列。顏色是顏料，碳粉height 0.35 relief、紙grain至多0.1；金屬factor為0、無mortar、AO 1。預設0.14 m nominal tile與0.0006 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、512²取樣：color<0.5占30.1–34.8%、最低color 0.0276、最高0.982、碳粉平均高度約0.39 relief對紙面約0.055、roughness 0.445–0.575；seed7的512²中r平均173.3、r<128占31.1%、法線max tilt²約0.0036。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('barcodelabel', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。建議size至少512，使每個模組至少約3像素。

`topographicmap`（等高線地形圖紙）使目前目錄908→909種，含plain的gallery為910項。暖米白紙面上以定值寬度的棕色等高線印出一塊由7個整數波數正弦疊成的地形（16個等高階、每5條一條較粗較深的計曲線），紙面隨高度有極淡的色調變化與細紙纖維grain；墨線略高於紙面。不是真實地形資料、標高註記、水系、道路、網格或圖例文字。

此材質是作者依「等高線地形圖」一般樣式所作示意，沒有引用特定來源文件、照片或量測；等高階數、計曲線間隔、線寬、墨色、紙色與0.3 m nominal tile皆作者設定，不宣稱符合任何實際地圖規格或比例尺。

新增專用sampler：以7個整數波數、含seed決定相位與±20%振幅抖動的正弦疊成週期解析地形（C∞），等高線距離以`sin²(πd)/π² ÷ (levels·|∇|)²`換算成UV空間距離平方（|∇|加下限0.4使山頂與鞍部平滑），因此線寬不隨坡度變寬；線 = `smooth(1 − 距離²/寬²)`，計曲線權重 = `((1+cos(2πd/5))/2)^6`，故線寬與墨色皆C∞。cache為128²紙纖維grain加7相位與7振幅，共16,398 Float64／131,184 B lattice算術預算（非總RAM）。顏色是顏料，墨線height 0.6 relief、紙面grain至多0.15；金屬factor為0、無mortar、AO 1。預設0.3 m nominal tile與0.0015 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、512²取樣：color<0.7（含邊緣漸層）占9.3–10.5%、color<0.45占6.7–7.6%、最低color 0.14（計曲線墨色）、最高0.925–0.930、平均0.839–0.846、墨線平均高度約0.575 relief對紙面約0.077；seed 0與1的墨線遮罩有17.6%像素不同；seed7的512² base color平均約(222,206,180)、b<170占10.9%、法線max tilt²約0.111。我先實看了首版渲染，確認線寬在平坦與陡峭區都大致一致後才定稿。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('topographicmap', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。建議size至少512，使細線至少有1至2像素。

`eastindianrosewood`（東印度黃檀）使目前目錄907→908種，含plain的gallery為909項。近似Dalbergia latifolia未塗裝縱向木面：深紫褐底色、5條較暗近黑的起伏條紋、細縱向纖維紋與散布短小開放導管凹點（約1.2%）。不是金褐色淺色面、白色邊材、拋光面、交錯／波浪紋或油脂光澤。

外觀依據實際閱讀的[Wood Database East Indian Rosewood](https://www.wood-database.com/east-indian-rosewood/)（Color／Appearance：心材由金褐到深紫褐，帶更暗近黑的條紋，隨時間變深、通常成深褐）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/dalbergia-latifolia-1-300x600.jpg)（深褐帶紫調的縱向木面、較暗條紋與細孔）；僅作配色與紋理形態參考，不重現金褐淺色變化、淺色邊材或真實導管分布，不打包來源圖，也不由照片反推真色、roughness或實際尺寸。

直接fallthrough重用既有Padauk／Bloodwood系細長橢圓導管sampler（與`blackwalnut`、`teak`、`honduranmahogany`、`shagbarkhickory`同路徑），constructor只選preset：40×14個導管site（pose表17,920 B）、5條起伏明顯（bandWarp 0.8）且對比高（bandContrast 0.45）的暗帶、220×9縱向fiber、128²細grain與固定3×4 warp，共20,616 Float64／164,928 B lattice算術預算（非總RAM）。金屬factor為0；導管凹點是真的height凹陷，色紋只是顏料。預設0.18 m nominal tile與0.0025 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：導管占1.18–1.22%，本體色0.255–0.908，橫／縱色差比8.6–10.2，roughness 0.460–0.564，高度0.42–0.503 relief；seed7的512²平均base color約(97,61,49)、導管占1.18%、法線max tilt²約0.0052。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('eastindianrosewood', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`lenticularsheet`（柱狀透鏡印刷片）使目前目錄906→907種，含plain的gallery為908項。每tile 32條平行的圓柱透鏡（沿v方向的長條），透鏡頂高亮光滑、透鏡間接縫低且較粗糙並帶AO（0.65）；底色為藍銀漸層，由斜向「翻轉」條紋（每透鏡2個週期、沿v 3個週期）與8×8低頻印刷影像疊成。不是真實的多幀交錯影像、隨視角變化的動畫、透鏡折射或可讀的圖案。

此材質是作者依「柱狀透鏡印刷片」一般結構所作的示意，沒有引用特定來源文件、照片或量測；透鏡數、色調、翻轉條紋、roughness、AO與0.1 m nominal tile皆作者設定，不宣稱符合任何實際產品或光學規格。

新增專用sampler：每透鏡f = fract(u·32)，透鏡高度 = 0.5 − 0.5·cos(2πf)（頂與縫的斜率皆0，故跨透鏡C1），翻轉條紋 = sin(2π(2f + 3v))（整數週期故隨tile wrap），再加8×8 cachedNoise低頻影像（64 Float64／512 B lattice算術預算，非總RAM）。顏色是顏料，height只用於法線與AO；金屬factor為0、無mortar。預設0.1 m nominal tile與0.008 UV-relative relief（非公尺位移）。三seed（0／1／0xffffffff）、256²取樣：頂高度1.0 relief、縫0.1、頂roughness 0.1、縫0.4、頂AO 1、縫0.65；color域約0.094–0.902；橫／縱色差比約21.0–21.1；沿透鏡頂沿v的翻轉色幅0.25–0.30到0.87–0.90；seed 0與1的影像色差平均0.070；seed7的512²中藍通道平均179.1、AO<230占37.5%、法線max tilt²約0.323。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('lenticularsheet', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。建議size至少256，使每條透鏡約有8像素寬。

`europeanlarch`（歐洲落葉松）使目前目錄905→906種，含plain的gallery為907項。近似Larix decidua未塗裝弦切面：淡粉紅褐／淡黃褐的早材底，12條流動的紅褐晚材年輪線（中等偏寬、約占面積四分之一、彎曲起伏並有拱形），帶細縱向纖維紋。不是樹脂囊、節、窄而近白的邊材與心材界線、螺旋紋或塗層。

外觀依據實際閱讀的[Wood Database European Larch](https://www.wood-database.com/european-larch/)（Color／Appearance：心材由黃到中等紅褐、窄邊材近白且與心材分明、弦切面生長輪呈現許多特色紋樣；Grain／Texture：多直紋或螺旋紋、中到細質地、帶油脂感）與實際下載並實看的[弦切面照片](https://www.wood-database.com/wp-content/uploads/european-larch-s-400x400.jpg)（淡粉褐面、流動的紅褐年輪線與拱形）；僅作配色與紋理形態參考，不重現邊／心材界線、節或油脂光澤，不打包來源圖，也不由照片反推真色、roughness或實際尺寸。開發中我先把warp設為1.4，渲染成封閉的漩渦環，與照片不符；實看後降到0.55、年輪數12、arch 2.2，波動仍偏規律但接近照片的流動拱形。

直接fallthrough重用`douglasfir`年輪sampler（與`longleafpine`、`westernredcedar`、`sitkaspruce`同路徑），constructor只選新preset（rings 12、arch 2.2、warp 0.55、latewood 0.45–0.9、lateTone 0.52、earlyTone 0.86）；warp 36＋fiber 180×6＋128²細grain共17,500 Float64／140,000 B lattice算術預算（非總RAM）。金屬factor為0，晚材略高，年輪紋色是顏料。預設0.2 m nominal tile與0.003 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：晚材色（color<0.6）占25.7–26.5%、早材色（>0.75）占62.6–63.6%、色域0.316–0.907、roughness 0.531–0.610、高度0.498–0.662 relief、橫／縱色差比2.84–2.88；seed7的512²中g≥165占69.9%、g<165占30.1%、法線max tilt²約0.028、平均base color約(220,176,142)。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('europeanlarch', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`shagbarkhickory`（粗皮山胡桃木）使目前目錄904→905種，含plain的gallery為906項。近似Carya ovata未塗裝縱向木面：偏淺的黃褐／淡棕底色、中等質地、3條寬而起伏的較暖淺褐條紋（近似心／邊材交錯的calico感）、細長的縱向纖維紋，以及散布的短小開放導管凹點。不是紅褐心材主導的深色面、環孔材大型早材導管列、交錯／波浪紋、塗層或實際心邊材邊界。

外觀依據實際閱讀的[Wood Database Shagbark Hickory](https://www.wood-database.com/shagbark-hickory/)（Color／Appearance：心材淺到中等棕且帶紅調、邊材較淡的黃褐，心邊材對比的板材被稱為Calico Hickory；Grain／Texture：多直紋、偶有波浪、中等質地；Endgrain：ring-porous，早材導管大到極大且呈單列）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/shagbark-hickory-400x400.jpg)（淡黃褐面、縱向條紋與細孔）；僅作配色與紋理形態參考，不重現環孔材早材導管列或真正的心／邊材邊界，不打包來源圖，也不由照片反推真色、roughness或實際尺寸。

直接fallthrough重用既有Padauk／Bloodwood系細長橢圓導管sampler（與`blackwalnut`、`blackcherry`、`teak`、`honduranmahogany`同一路徑），constructor只選preset：40×14個導管site（Float64×4共17,920 B pose表）、3條起伏明顯（bandWarp 0.7）且對比中等（bandContrast 0.25）的帶、240×10縱向fiber與128²細grain（含warp共21,036 Float64／168,288 B lattice算術預算，非總RAM）。金屬factor為0；導管凹點是真的height凹陷，縱向色紋只是顏料。預設0.18 m nominal tile與0.002 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：導管占0.77–0.82%，本體色0.254–0.728，橫／縱色差比11.89–12.2，roughness 0.520–0.624；seed7的512²平均base color約(195,158,111)、導管占0.78%、法線max tilt²約0.0015。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('shagbarkhickory', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`monitorlizardskin`（巨蜥風格顆粒狀鱗皮）使目前目錄903→904種，含plain的gallery為905項。14欄×16列的六角緊密排列圓形隆起鱗片（奇數列錯半欄），每片有自己的色調（標準差約0.09–0.10）、略亮、較光滑，鱗間是窄而深的暗溝（AO 0.4、color 0.04、roughness 0.7）；4條橫向的深淺色帶沿v方向起伏，整體為橄欖褐色。不是特定物種的鱗片形狀／大小分區、斑點或環紋，沒有腹鱗、背脊或皮褶。

此材質是作者依「巨蜥類粗顆粒鱗皮」的一般印象所作示意，沒有引用特定來源文件、照片或量測；我閱讀的[Wikipedia「Monitor lizard」](https://en.wikipedia.org/wiki/Monitor_lizard)導言只描述屬別、分布與體型，未描述皮膚，所以鱗片尺寸、色調、色帶、roughness、AO與0.14 m nominal tile皆作者設定，不宣稱符合任何實際物種或個體。

新增專用sampler：以六角緊密排列（奇數列偏移半欄、取上下相鄰三列）找最近鱗片中心，鱗片 = `smooth(1 − q/r²)`，半徑 r = 0.5 為六角Voronoi內切半徑，使鱗片在擁有權切換前歸零（因此各鱗各自的色調查表不產生跳變），中心與邊緣斜率皆0；14×16格表（224個每鱗色調Float64）與160²細grain共25,824 Float64／206,592 B lattice算術預算（非總RAM）。列數為偶數，錯位奇偶與4條橫向色帶才隨tile週期。金屬factor為0、無mortar；預設0.14 m nominal tile、0.01 UV-relative relief（非公尺位移）。我先試了半徑0.48與0.9的橫向壓扁，但壓扁會使擁有權邊界出現未歸零的跳變，已改回等向與半徑0.5。三seed（0／1／0xffffffff）量測：鱗頂高度0.780–0.795 relief、AO 1、color 0.336–0.701、roughness 0.550–0.609；同列相鄰鱗間的溝高度0.08、AO 0.4、color 0.04、roughness 0.7；每鱗色調標準差0.090–0.099。seed7的512²中r平均67.9、AO<180占55.3%、r<50占39.9%、法線max tilt²約0.17。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('monitorlizardskin', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。建議size至少256，使每片鱗有數個像素。

`sitkaspruce`（北美雲杉／Sitka spruce）使目前目錄902→903種，含plain的gallery為904項。近似Picea sitchensis未塗裝縱向木面：奶白偏淡黃的底色、極細而幾乎筆直的縱向年輪線（對比極低、年輪輕微起伏）與細纖維grain。不是bearclaw紋、粉紅紅色調、樹脂道、節疤、邊材／心材界線或塗層。

外觀依據實際閱讀的[Wood Database Sitka Spruce](https://www.wood-database.com/sitka-spruce/)（Color／Appearance：奶白到黃色，心材偶帶淡粉紅，邊材不明顯分界，部分有bearclaw紋；Grain／Texture：細而均勻的質地、一致的直紋；Endgrain：中型樹脂道）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/sitka-spruce-400x400.jpg)（奶白色面與極細淡色縱線）；僅作配色與年輪線形態參考，不重現bearclaw或粉紅色調，不打包來源圖，也不由照片反推真色、roughness或實際尺寸。

直接fallthrough重用`douglasfir`的年輪指標sampler（與`longleafpine`、`westernredcedar`同一路徑），constructor只選preset：22個ring係數（鏡像後橫跨tile 44條）、很小的縱向拱與skew、窄晚材（start 0.7／peak 0.93）與極低晚材色差（lateTone 0.24）。3個constructor cache為5×5 warp、200×5縱向fiber與128² grain（共17,409 Float64／139,272 B lattice算術預算，非總RAM）；金屬factor為0、無mortar，晚材略抬高、較光滑，早材AO略低。預設0.12 m nominal tile與0.002 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：color<0.6的暗線僅占0.47–0.62%、color>0.75占84.1–84.8%，color 0.580–0.882，橫／縱色差比15.0–15.15，roughness 0.462–0.530；seed7的512²平均base color約(244,226,187)、法線max tilt²約0.0027。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('sitkaspruce', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`honduranmahogany`（宏都拉斯桃花心木）使目前目錄901→902種，含plain的gallery為903項。近似Swietenia macrophylla未塗裝縱向木面：偏深的紅褐色、中等均勻質地、7條寬而幾乎筆直的低對比緞帶狀條紋（近似徑切的ribbon figure）與極稀疏、短小的開放導管凹點。不是淺粉褐色新切材、經年變深色、交錯／不規則／波浪紋、cathedral紋、閃光（chatoyancy）光學效果或塗層。

外觀依據實際閱讀的[Wood Database Honduran Mahogany](https://www.wood-database.com/honduran-mahogany/)（Color／Appearance：心材由淺粉褐到較深紅褐，隨年份變深，具chatoyancy；Grain／Texture：可直、交錯、不規則或波浪，中等均勻質地、中等光澤；Porosity：diffuse porous，生長輪常因邊緣薄壁組織帶而明顯）、前述實際閱讀的[Wood Database Black Walnut](https://www.wood-database.com/black-walnut/)中「徑切面的mahogany通常有ribbon紋」一句，以及實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/swietenia-macrophylla-alt.jpg)（均勻深紅褐面、細導管線，底部有一處巢狀年輪紋）；僅作配色與紋理形態參考，不重現巢狀年輪或chatoyancy，不打包來源圖，也不由照片反推真色、roughness或實際尺寸。

直接fallthrough重用既有Padauk／Bloodwood系細長橢圓導管sampler（與`blackwalnut`、`blackcherry`、`teak`同一路徑），constructor只選preset：56×18個導管site（Float64×4共32,256 B pose表）、7條幾乎筆直（bandWarp 0.18）低對比（bandContrast 0.1）緞帶、220×9縱向fiber與128²細grain（含warp共22,408 Float64／179,264 B lattice算術預算，非總RAM）。金屬factor為0；導管凹點是真的height凹陷，縱向色紋只是顏料。預設0.18 m nominal tile與0.0015 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：導管占0.145–0.197%，本體色0.255–0.459，橫／縱色差比9.28–10.34，roughness 0.420–0.523；seed7的512²平均base color約(128,68,38)、導管占0.156%、法線max tilt²約0.0008。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('honduranmahogany', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`woodenpalletdeck`（木棧板面板）使目前目錄900→901種，含plain的gallery為902項。一個tile內4塊沿u方向的木板，板間是約9%寬度的低窄深縫（AO 0.2、color≈0.02、高度0.04 relief），每塊板各有自己的整體色調、起伏的年輪線、長縱向纖維與細grain，板中線上每個tile有2顆深色略凸的圓形釘頭（每板位置有微小偏移）。不是完整棧板（沒有橫梁／縱梁、板端、裂縫、節疤或金屬釘的金屬性）。

概念依據實際閱讀的[Wikipedia「Pallet」](https://en.wikipedia.org/wiki/Pallet)導言：pallet（skid）是供堆高機等抬升、穩定承載貨物的平面運輸結構，多數為木製。該條目不提供板寬、釘距或顏色，因此板數、縫寬、釘頭尺寸／位置、色彩、roughness與0.4 m nominal tile皆為作者設定，不宣稱符合任何棧板標準或實物。

新增專用sampler：以`fract(v)·4`分出板號與板內位置，縫與釘頭皆為到各自邊的smoothstep（在板交界前已歸零，所以逐板查表不產生跳變），年輪線為`sin(2π(rings·fy + warp·noise + 每板相位))`、另有6×96縱向fiber與160²細grain；每板色調與釘位偏移只在constructor以hash抽取（共12個Float64）。cache共25 + 576 + 25,600 + 12 = 26,213 Float64（含每板表12個），約209,704 B lattice算術預算（非總RAM）。釘頭是dielectric（metallic 0），僅降低roughness；金屬factor為0、無mortar。預設0.4 m nominal tile、0.006 UV-relative relief（非公尺位移）。三seed（0／1／0xffffffff）量測：縫color 0.02、AO 0.2、高度0.04 relief；板面color 0.388–0.765、高度0.575–0.648 relief、roughness 0.78–0.86；板中線每板恰有2個寬約0.042–0.045的釘頭（color 0.2、高度約0.78 relief）；各板平均色差於seed間可見（seed0板均值0.502–0.655、seed1 0.552–0.683）。seed7的512²中r平均129、AO<100的縫占10.9%、法線max tilt²約0.21。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('woodenpalletdeck', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`forgedcarbon`（鍛造碳纖維風格複合材）使目前目錄899→900種，含plain的gallery為901項。10×10格、每格5個隨機位置／方向／長寬／灰階與疊放權重的圓角長條碎片，覆蓋在近黑樹脂背景上；碎片內有細密的平行編織漣漪（沿碎片長軸）與輕微高度／粗糙度起伏，整體為亮面（roughness約0.18–0.30）。不是規則斜紋或平紋編織（那是既有`carbonfiber`），沒有環氧樹脂厚度、反射清漆或金屬光澤。

此材質是作者依一般鍛造（forged）／短切碳纖維複合材外觀所作示意，沒有引用特定來源文件、產品照片或量測，因此不宣稱符合任何實際製程、纖維長度、碎片尺寸、纖維方向統計或色彩；色調、roughness、高度與0.2 m nominal tile皆作者設定。

新增專用sampler：constructor填10×10×5個碎片表（每片9個Float64：中心、cos／sin、1/半長²、1/半寬²、灰階、疊放權重、漣漪相位；共4,500 Float64／36,000 B）。取樣時搜尋周圍3×3格，每片碎片為四次方超橢圓smoothstep涵蓋度，顏色取「涵蓋度×疊放權重」加權平均並加入權重0.25的背景（光滑函數之商、分母恆正），所以碎片邊緣與重疊C1；碎片中心跨滿所屬格、半長≤0.64，使每片都落在被搜尋的3×3格內。另160² grain（25,600 Float64，合計30,100 Float64／240,800 B lattice算術預算，非總RAM）。初版背景權重0.02使邊緣過窄（局部坡度約7,700／UV、C1掃描最大值0.035超過我設的0.03），調為0.25後掃描最大值≤0.007。金屬factor為0、無mortar；預設0.2 m nominal tile、0.0012 UV-relative relief（非公尺位移）。三seed（0／1／0xffffffff）、256²取樣：color 0.039–0.592、color<0.1的背景占18.8–20.4%、0.2–0.4的中灰碎片占49.6–52.2%、>0.45的亮碎片占6.6–10.2%、roughness 0.178–0.303，橫／縱色差比0.993–1.027；seed 0與1的平均色差0.158。seed7的512²中r平均49.2、最大98，r<25占20.3%、r>70占15.4%，法線max tilt²約0.0089。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('forgedcarbon', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`popcornceiling`（爆米花／吸音天花板噴塗）使目前目錄898→899種，含plain的gallery為900項。20×20格、每格一個隨機偏移、半徑與高度各異的圓形顆粒（半徑0.55–0.85格）以`1 − Π(1 − 顆粒)`軟合併，形成起伏不規則的顆粒團，顆粒間為較低且被遮蔽的谷（AO約0.55）；偏白微暖，帶細斑點grain，粗糙度高。沒有水漬、剝落、刮平區、纖維（石棉）或接縫。

概念依據實際閱讀的[Wikipedia「Popcorn ceiling」](https://en.wikipedia.org/wiki/Popcorn_ceiling)導言：噴塗或刷塗的凹凸天花板處理，凹凸由微小蛭石或聚苯乙烯顆粒形成，有細、中、粗等級。該條目未提供顆粒尺寸或色彩，故顆粒半徑、高度、色調、roughness與0.25 m tile皆作者設定；材質只描述外觀，不含也不暗示任何材料成分（包含早期配方可能含石棉的歷史說明）。

新增專用sampler：constructor填20×20格的顆粒表（中心x／y、1/半徑²、高度，共1,600 Float64／12,800 B），取樣時計算周圍3×3格顆粒的smoothstep圓帽並以`1 − Π(1 − b)`合併，故C1且有界；半徑與偏移使每顆粒不會超出被搜尋的3×3格，tile則以格索引取模週期。另有160² grain（共25,600 + 1,600 = 27,200 Float64／217,600 B lattice算術預算，非總RAM）。金屬factor為0、無mortar；預設0.25 m nominal tile、0.006 UV-relative relief（非公尺位移）。三seed（0／1／0xffffffff）、256²取樣：高度0.100–0.918 relief、高度>0.6占53.0–54.0%、<0.3占17.5–18.2%、AO 0.55–1、color 0.516–0.962、roughness 0.895–0.945，橫／縱高度變化比0.978–1.005（各向同性）；seed 0與1的平均高度差0.243 relief。seed7的512²中r平均231、範圍210–247，AO<180占22.9%，法線max tilt²約0.148。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('popcornceiling', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`kilimdiamonds`（kilim風格階梯菱形平織）使目前目錄897→898種，含plain的gallery為899項。64×64個緯線格組成的平織場：每個16格的方塊中心與四角各有一個同心階梯菱形，菱形由四個寬2格的環（深褐／奶白／中間灰褐／奶白，角上菱形的色調順序對調）構成；每列有微小的色調差異，每格有一道橫向緯線凸脊與細纖維grain。不是特定地區或部族的圖案，沒有流蘇、邊飾、起絨或斷緯（slit）幾何。

概念依據實際閱讀的[Wikipedia「Kilim」](https://en.wikipedia.org/wiki/Kilim)：kilim是傳統上產於波斯帝國舊地、土耳其與巴爾幹等地的平織（tapestry-woven）地毯。該條目導言未提供具體紋樣或尺寸，因此階梯菱形的圖案、環寬、色調、roughness與0.32 m tile皆為作者設定，**沒有**引用特定來源的紋樣照片或實物，不宣稱忠實再現任何傳統紋樣。

新增專用sampler：constructor先填一個64×64的`Float64Array`格色調表（32,768 B），每格依到最近菱形中心的曼哈頓距離決定環序號（centerTones／cornerTones各4個色調）並加列變異；取樣時以零斜率smoothstep權重在格邊界雙線性混合，邊緣柔和但C1，格索引依64取模，故tile週期。每格一道週期的橫向緯線脊`0.5 − 0.5·cos(2π·64v)`，另有128² grain（共16,384 + 4,096 = 20,480 Float64／163,840 B lattice算術預算，非總RAM）。金屬factor為0、無mortar；預設0.32 m nominal tile（每格5 mm為作者設定）、0.003 UV-relative relief（非公尺位移）。三seed（0／1／0xffffffff）：每格中心色與預期環色調最大差0.058–0.059，總色域0.042–0.978，緯線脊使格中心比列界高約0.14 relief；seed7的512²中r<80占15.2%、r>180占54.6%、法線max tilt²約0.0056。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('kilimdiamonds', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。建議size至少256，使每個緯線格有數個像素。

`teak`（柚木縱向面）使目前目錄896→897種，含plain的gallery為898項。近似Tectona grandis心材未塗裝縱向木面：金黃到中等棕色底、直而不均勻的粗質地、長而起伏的深棕縱向條紋與散布的短小開放導管凹點。不是已老化的深色柚木、邊材、波浪／交錯紋figure、油亮塗層，也不是導管內淺色矽質沉積。

外觀依據實際閱讀的[Wood Database Teak](https://www.wood-database.com/teak/)（Color／Appearance：心材金黃或中棕、隨年份變深；Grain／Texture：多直紋，偶有波浪或交錯、粗而不均的質地、中到低光澤、未處理表面略帶油脂感；Porosity：ring-porous或semi-ring-porous）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/tectona-grandis.jpg)（棕色面、長深色縱條紋與淺色導管斑點）；僅作配色與紋理形態參考。本preset的導管是深色高度凹陷，不重現照片中的淺色導管斑；不打包來源圖，也不由照片反推真色、roughness或實際尺寸。

直接fallthrough重用既有Padauk／Bloodwood系細長橢圓導管sampler（與`blackwalnut`、`blackcherry`同一路徑），constructor只選preset：36×12個導管site（Float64×4共13,824 B pose表）、5個強起伏帶（bandWarp 0.9、bandContrast 0.28）、240×10縱向fiber與128²細grain（含warp共20,524 Float64／164,192 B lattice算術預算，非總RAM）。金屬factor為0；導管凹點是真的height凹陷，縱向色紋只是顏料。預設0.2 m nominal tile與0.003 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：導管占0.96–1.02%，本體色0.254–0.758，橫／縱色差比11.25–12.98，roughness 0.600–0.703，導管比本體低約0.092–0.093 relief；seed7的512²平均base color約(139,90,38)、導管占1.03%、法線max tilt²約0.010。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('teak', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`blackcherry`（美洲黑櫻桃木）使目前目錄895→896種，含plain的gallery為897項。近似Prunus serotina心材的未塗裝縱向木面：均勻的中等紅褐色、細而平直的縱向纖維紋、極低對比的寬弱帶，以及極稀疏、短而小的深色導管凹點。不是淺色邊材條帶、捲紋figure、樹膠袋／深色礦物斑、塗層或加深後的老化色。

外觀依據實際閱讀的[Wood Database Black Cherry](https://www.wood-database.com/black-cherry/)（Color／Appearance：心材新切為淺粉褐，隨時間與光照轉為中等紅褐，邊材寬而淡黃；Grain／Texture：多直紋、細而均勻的質地、中等自然光澤；Porosity：semi-ring-porous到diffuse-porous）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/prunus-serotina.jpg)（均勻紅褐面、左緣淺色邊材、少數小深色斑）；僅作配色與紋理形態參考，不重現邊材條帶或深色斑，不打包來源圖，也不由照片反推真色、roughness或實際尺寸。

直接fallthrough重用既有Padauk／Bloodwood系細長橢圓導管sampler（與`blackwalnut`同一路徑），constructor只選preset：48×16個導管site（Float64×4共24,576 B pose表）、3個弱帶、200×8縱向fiber與128²細grain（含warp共21,068 Float64／168,544 B lattice算術預算，非總RAM）。金屬factor為0；導管凹點是真的height凹陷，縱向色紋只是顏料。預設0.18 m nominal tile與0.0015 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：導管占0.11–0.14%，本體色0.253–0.399，橫／縱色差比7.95–8.29，roughness 0.450–0.553；seed7的512²平均base color約(155,93,54)、法線max tilt²約0.0008。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('blackcherry', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`golfballdimples`（高爾夫球風格凹坑）使目前目錄894→895種，含plain的gallery為896項。7欄×8列的六角緊密排列圓形淺凹坑（奇數列錯半欄），凹坑為半徑0.46欄的球碗狀，碗中央較低、較暗（AO 0.55）且較粗糙，凹坑之間是較高、光滑、略亮的窄平台；整體為偏白的亮面塑膠。不是完整球體曲率、接縫線、印字或實際球上的凹坑數／分布。

此材質是作者依一般高爾夫球凹坑外觀所作的平面示意，沒有引用特定來源文件、產品照片或量測，因此不宣稱符合任何實際球種、凹坑直徑／深度／數量或規範；色彩、roughness、AO、層高與0.028 m nominal tile（7欄、每欄4 mm）皆作者設定。7×8是為了讓六角列距（7/8≈0.875）近似理想的0.866且列數為偶數、錯位奇偶才能隨tile週期對齊。

新增專用sampler：以各列的最近凹坑中心（奇數列偏移半欄、取上下相鄰三列）計算等向距離平方`q`，凹坑 = `smooth(1 − q/r²)`，在中心與邊緣的斜率皆為0，所以碗形與平台為C1；列數為偶數使錯位奇偶隨v週期對齊。只快取128² grain（16,384 Float64／131,072 B lattice算術預算，非總RAM）。金屬factor為0、無mortar；預設0.012 UV-relative relief（非公尺位移；提高到此值是因0.0012時法線幾乎全平）。三seed（0／1／0xffffffff）量測：碗心高度0.220–0.226 relief、碗心AO 0.55、碗心roughness 0.441–0.479；同列相鄰凹坑中點的平台高度0.620–0.626、AO 1、roughness 0.321–0.360；256²取樣AO<0.9占52.9%。seed7的512²平均base color r約231.8、AO<230占52.8%、法線max tilt²約0.030。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('golfballdimples', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`laptopkeycaps`（chiclet筆電鍵帽）使目前目錄893→894種，含plain的gallery為895項。8×8格方陣，每格一顆圓角方形深色霧面鍵帽（以四次方超橢圓為輪廓，半寬0.43格，約占面積68%），鍵頂中央微凹（越近鍵緣越高），鍵與鍵之間是深色低窄縫（AO 0.25、roughness≥0.9）；每顆有細微不同的色調、霧面細grain與邊緣高光。沒有字符、背光、鍵軸或機身。

此材質是作者依一般chiclet（島狀）鍵盤外觀所作示意，沒有引用特定來源文件、產品照片或量測，因此不宣稱符合任何實際鍵盤、鍵距、鍵帽輪廓或材料；色彩、roughness、AO、層高與0.152 m nominal tile（8格、每格19 mm）皆作者設定。

新增專用sampler：`s = ((dx/hw)²)² + ((dy/hw)²)²`是四次方超橢圓多項式，`smooth(clamp((1−s)/bevel))`得到C1的圓角方形，鍵在到達格界前已歸零，所以`fract()`換格及每鍵tone查表不影響連續性；頂面高度 = topHeight − dishDepth·(1 − r²)。constructor快取64個每鍵tone（512 B）與160²霧面stipple（共25,664 Float64／205,312 B lattice算術預算，非總RAM）。金屬factor為0、無mortar；預設0.004 UV-relative relief（非公尺位移）。三seed（0／1／0xffffffff）量測：鍵心高度0.620–0.632 relief、距鍵心0.75半寬處0.649–0.660（凹面向外升高）、縫高度0.06、縫AO 0.25；256²取樣AO>0.9占68.4%；每鍵tone標準差0.022–0.024。seed7的512²中r<20的縫占32.9%、r≥30的鍵面占66.9%、法線max tilt²約0.465（鍵緣陡）。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('laptopkeycaps', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`qrcodelabel`（QR風格印刷標籤）使目前目錄892→893種，含plain的gallery為894項。一張紙質標籤佔滿一個tile：29×29個模組外加四模組寬的白色安靜區（共37×37）；左上、右上、左下各有7×7的finder pattern（深外框、淺環、3×3深核心）及白色separator，第6列／行有深淺交替的timing pattern，右下有5×5 alignment pattern，其餘為依seed決定的偽隨機資料模組。深色油墨在淺色帶細纖維grain的紙上。**這不是可解碼的QR**：沒有編碼訊息、格式資訊、遮罩或錯誤更正，僅是QR風格的外觀。

結構概念依據實際閱讀的[Wikipedia「QR code」](https://en.wikipedia.org/wiki/QR_code)：三個位於左上、右上與左下的finder pattern（三層同心方形）以及第四角附近的較小方形。29×29模組、四模組安靜區、7×7／5×5尺寸、timing位置、油墨與紙色、roughness、0.05 m tile皆作者設定，沒有逐條對照ISO／IEC 18004，不宣稱符合任何QR版本或可被掃描。

新增專用sampler：constructor依seed與hash填一個37×37的`Uint8Array`（1,369 B）模組表，取樣時以smoothstep權重在模組邊界附近雙線性混合相鄰四模組，權重在模組中心保持零斜率，因此邊緣窄但C1，且模組索引以tile大小取模，整張標籤週期重複。另有128²紙grain與48²纖維兩個cache（共18,688 Float64／149,504 B）。金屬factor為0、無mortar；預設0.05 m nominal tile、0.0006 UV-relative relief（非公尺位移）。三seed（0／1／0xffffffff）以模組中心實測：油墨color恆為0.04、紙color 0.876–0.925；資料區（排除finder／timing／alignment）深色占46.9%／49.1%／50.4%，seed0與seed1資料位置有49.1%不同；seed7的512²中r<60占28.3%、r>200占66.8%，法線max tilt²約0.0004。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('qrcodelabel', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。建議size至少256，使每個模組有足夠像素。

`perforatedhardboard`（棕色鑽孔硬纖維板）使目前目錄891→892種，含plain的gallery為893項。16×16格的方格陣列，每格中心有一個圓形暗色不透明孔（孔半徑0.13格、孔徑約占5.1%面積），孔緣有略暗的圓角環；孔間為連續的棕色回火硬纖維板面，含細纖維grain、較大的碎屑斑與低頻光澤起伏。孔不是透明通孔（不含背景穿透），也不含掛鉤、螺絲或金屬板。

概念依據實際閱讀的[Wikipedia「Perforated hardboard」](https://en.wikipedia.org/wiki/Pegboard)：回火硬纖維板（以亞麻仁油薄層塗佈並高溫烘烤）預鑽等距孔，Peg-Board為Masonite舊商標、常泛稱穿孔收納板。**未**查看或引用任何實物照片／規格圖，故孔距、孔徑、色彩、roughness與0.4 m tile皆為作者設定，不宣稱符合任何標準孔徑／孔距或商品。

新增專用sampler：以到每格中心的距離`r`做smoothstep孔洞與圓角環，兩者在格內自行歸零，所以`fract()`換格不影響連續性與C1；孔外為`(base + sheen + grain + fleck − rim)`，孔內為近黑色、低高度、AO約0.15、roughness≥0.92。3個constructor cache為192²細grain、64²碎屑斑與6²光澤（共40,996 Float64／327,968 B lattice算術預算，非總RAM）；金屬factor為0、無mortar。預設0.4 m nominal tile、0.004 UV-relative relief（非公尺位移）。三seed（0／1／0xffffffff）量測：孔心color≤0.04、高度≤0.02 relief；板面color 0.486–0.671、AO 1、高度0.60–0.67 relief；圓角環AO 0.875；256²取樣AO<0.5占4.69%。seed7的512²平均base color約(98,66,41)、r<60的暗孔占5.08%、法線max tilt²約0.415（孔緣陡）。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('perforatedhardboard', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`westernredcedar`（北美香柏紅褐直紋）使目前目錄890→891種，含plain的gallery為892項。近似Thuja plicata未塗裝縱向木面：偏紅的金褐色底、細而平行的暗色年輪線，年輪輕微起伏。不是邊材、較暗的紅褐隨機條帶、節疤、塗層或Douglas-fir式大型尖拱，也沒有樹脂道（此樹種原本即無樹脂道）。

外觀依據實際閱讀的[Wood Database Western Red Cedar](https://www.wood-database.com/western-red-cedar/)（Color／Appearance：心材紅到粉褐色且常有更暗的隨機條帶、邊材黃白；Grain／Texture：直紋、粗質地、中等光澤；Resin canals：無）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/thuja-plicata.jpg)（金褐色底配細密平行暗線）；僅作配色與年輪線形態參考，不重現來源的隨機暗帶或邊材，不打包來源圖，也不由照片反推真色、roughness或實際尺寸。

直接fallthrough重用`douglasfir`的年輪指標sampler，constructor只選preset：20個ring係數（鏡像後橫跨tile 40條）、很小的縱向拱與skew、窄晚材（start0.7／peak0.92）與低晚材色差，得到細而低對比的線。3個constructor cache為5×5 warp、192×5縱向fiber與128² grain（共17,369 Float64／138,952 B lattice算術預算，非總RAM）；金屬factor為0、無mortar，晚材略抬高、較光滑，早材AO略低。預設0.12 m nominal tile、0.003 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：color<0.5的暗線占12.2–12.5%、color>0.6占81.0–81.7%，橫／縱色差比11.9–12.1，晚材比早材高約0.12 relief；seed7的512²平均base color約(148,100,54)、法線max tilt²約0.012。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('westernredcedar', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`chesterfieldleather`（Chesterfield菱格縫釦棕色皮革）使目前目錄889→890種，含plain的gallery為891項。6×6格的每隔一格中心有一顆小釦（每tile 18顆），釦與釦之間以斜向折線連接，其間為鼓起的菱形軟墊；折線處深暗且AO低，軟墊頂較亮、較光滑。棕色皮革細grain與低頻皺紋。不是真實家具尺寸或特定產品的幾何，沒有釦面金屬、縫線、皮革破裂或透明孔洞。

此材質是作者依一般菱格縫釦（diamond-tufted）皮革外觀所作的示意，沒有引用特定來源文件、產品照片或量測，因此不宣稱符合任何實際家具、釦距、皮革種類或顏色；色彩、roughness、AO、層高與0.5 m nominal tile皆作者設定。

新增專用sampler：兩個對角座標`a=u·N+v·N−1`、`b=u·N−v·N`各取到最近偶數的有號距離`da`／`db`；`smooth(clamp(|d|/pillowSpan))`在折線上的斜率為0，兩者相乘即菱形軟墊並維持C1；釦以到最近偶數格點的距離做smoothstep圓頂。N必須為偶數，tile才會週期對齊。constructor快取128² grain與24²皺紋共16,960 Float64／135,680 B lattice算術預算（非總RAM）。金屬factor為0、無mortar；預設0.5 m nominal tile、0.012 UV-relative relief（非公尺位移）。三seed（0／1／0xffffffff）量測：軟墊頂高度為0.688–0.717 relief、折線高度約0.08、釦高度約0.30；折線AO為0.5、軟墊頂AO為1；seed7的512²平均base color約(108,55,33)、AO<160占35.3%、法線max tilt²約0.040。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('chesterfieldleather', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`longleafpine`（長葉松縱向年輪紋）使目前目錄888→889種，含plain的gallery為890項。近似Pinus palustris未塗裝木面：淡黃白早材與窄而高對比的橙褐色晚材條紋，年輪近乎平行、輕微起伏。不是樹脂道、節疤、紅褐心材整面、塗層或Douglas-fir式的大型尖拱。

外觀依據實際閱讀的[Wood Database Longleaf Pine](https://www.wood-database.com/longleaf-pine/)（Color／Appearance：心材紅褐、邊材黃白；Grain／Texture：直紋、細到中等質地；Endgrain：大型樹脂道多而均勻，早晚材過渡abrupt、色差高）與實際下載並實看的[木面照片](https://www.wood-database.com/wp-content/uploads/longleaf-pine.jpg)（淡黃白底與平行橙褐晚材條紋）；僅作配色與條紋形態參考，不打包來源圖，也不由照片反推真色、roughness或實際尺寸。

直接fallthrough重用`douglasfir`的年輪指標sampler，constructor只選preset；本preset以較多年輪、很小的縱向拱與skew、較寬的晚材漸暗區和較強晚材色差取得近乎平行的條紋。3個constructor cache為5×5 warp、192×5縱向fiber與128² grain（共17,369 Float64／138,952 B lattice算術預算，非總RAM）；金屬factor為0、無mortar，晚材略抬高、較光滑，早材AO略低。預設0.12 m nominal tile、0.003 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：color<0.4晚材占21.1–24.0%、color>0.75早材占52.7–55.9%，橫／縱色差比12.0–12.9，晚材比早材高約0.19 relief；seed7的512²平均base color約(232,186,125)、法線max tilt²約0.030。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('longleafpine', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`douglasfir`（Douglas-fir弦切面）使目前目錄887→888種，含plain的gallery為889項。近似Pseudotsuga menziesii未塗裝弦切縱向木面：淺橙褐色早材、較暗橙褐色晚材年輪，年輪沿弦切面形成多重尖拱（cathedral）並圍繞較大的同心橢圓。不是節疤、樹脂囊／樹脂道、邊材／心材分界、塗層，也不是徑切（quartersawn）的平行直線年輪。

外觀依據實際閱讀的[Wood Database Douglas-Fir](https://www.wood-database.com/douglas-fir/)（Color／Appearance：淺褐帶紅或黃、年輪較暗，弦切可見強烈花紋；Grain／Texture：多直紋或略起伏、中到粗質地；Identification：樹脂道小到中型且稀疏，早晚材過渡abrupt）與實際下載並實看的[弦切樣板照片](https://www.wood-database.com/wp-content/uploads/pseudotsuga-menziesii.jpg)（巢狀弧形年輪與一處小節）；僅作配色與年輪形態參考，不打包來源圖、不重現節疤，也不由照片反推真色、roughness或實際尺寸。

新增專用sampler（非既有導管sampler的fallthrough）：以平滑週期cosine構成年輪指標場——橫向項、縱向拱項、斜向skew與seeded低頻warp——再取fract()通過兩端值與斜率皆為0的smoothstep年輪剖面（較寬的早材到晚材漸暗，之後abrupt回到早材），因此tile仍是C1週期。晚材略抬高並較光滑，早材AO略低；金屬factor為0、無mortar。3個constructor cache為5×5 warp、160×5縱向fiber與128² grain（共17,209 Float64／137,672 B lattice算術預算，非總RAM）。預設0.2 m nominal tile、0.0035 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：color<0.4晚材占15.2%、color>0.75早材占70.5–70.9%，橫向／縱向色差比2.95–3.09；seed7的512²平均base color約(214,165,107)、法線max tilt²約0.049。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('douglasfir', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`blackwalnut`（深巧克力褐色黑胡桃木弦切面）使目前目錄886→887種，含plain的gallery為888項。近似選定Juglans nigra心材的未塗裝弦切縱向木面：中深巧克力褐色、較暗的長縱向條紋、直紋到略起伏的紋理與稀疏短小的開放導管凹點。不是紫／灰偏色、邊材、捲紋／瘤／鳥眼／分叉figure、塗層，也沒有半環孔材由早材到晚材逐漸變小的導管梯度——導管凹點大小一致，僅為示意。

外觀依據實際閱讀的[Wood Database Black Walnut](https://www.wood-database.com/black-walnut/)（Color/Appearance：淺褐到深巧克力褐色並帶更暗的條紋；Grain/Texture：通常直紋、可不規則、中等質地、中等自然光澤；Porosity：semi-ring-porous），以及實際下載並實看的[弦切整板掃描](https://www.wood-database.com/wp-content/uploads/juglans-nigra-full.jpg)；僅作配色與紋理方向參考，不打包來源圖、不由照片反推真色、roughness或尺寸。

直接fallthrough重用既有Padauk／Bloodwood系細長橢圓導管sampler，constructor只選preset：40×14個導管site（Float64×4共17,920 B pose表）、4個帶狀起伏、192×9縱向fiber與128²細grain。M0、AO在導管處降低；導管凹陷為真height凹陷，縱向色紋只是顏料不抬高。預設0.16 m nominal tile與0.0025 UV-relative relief（非公尺位移）皆作者設定。三seed（0／1／0xffffffff）、256²取樣：導管占0.54–0.59%，本體色0.254–0.579，橫向與縱向色差比8.8–10.0；seed7的512²平均base color約(86,59,40)。不新增API或依賴，Worker／cache／texture ownership沿既有路徑；本段不宣稱瀏覽器gallery驗證。

使用`await ProceduralMaterial.create('blackwalnut', { size: 512, seed: 7, heightMap: true })`後`createMaterial()`；metallic factor為0，texture清理沿用既有`destroy()`。

`to92packagefaces`（TO-92封裝正面示意）使目前目錄885→886種，含plain的gallery為887項。2×2四個旋轉／微移的霧黑D形本體：直側、平底、上半橢圓穹頂；三支等間距平行直中性金屬腳有寬根肩與窄尾，本體遮住腳根。無金屬片、安裝孔或印字。完整腳面M1，本體／背底M0，邊界C1混合；作者正規化高度為背底.02 < 腳.44 < 本體.68。

尺寸參考是實際下載並raster實看的[onsemi P2N2222A/D，January 2013 Rev.7，PDF第6頁](https://www.onsemi.com/pdf/datasheet/p2n2222a-d.pdf#page=6)：內附98ASB42022B，TO-92（TO-226）CASE29-11，Issue AM，09 MAR 2007，圖面第1／2頁，STRAIGHT LEAD BULK PACK視圖。A4.45–5.20 mm、B4.32–5.33 mm、G1.15–1.39 mm及K≥12.70 mm僅是原廠尺寸參考，非插圖量測值。D形上半橢圓、比例、肩寬、色彩、roughness、AO及高度皆作者簡化，不是精確CAD；不推定化學成分、鍍層、光學或電氣特性，不打包來源圖。

預設0.08 m nominal tile、0.0042 UV-relative relief（非公尺位移）與metallic factor1；explicit `createMaterial({ metallic: 0 })`僅改scalar factor，不改stored M mask。沿用TO-220的constructor快取pose／grain及C1角色替換結構、既有週期不透明maps、optional height、tint／repeats、Worker／cache與texture ownership，不新增API或依賴。先移除借用材質再銷毀擁有textures的preset，並另行管理自有pool／cache。建議512辨識三支窄尾，32僅粗預覽；不宣稱本段已完成runtime或browser驗證。

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

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

`huckaback`（五挑浮經平紋毛巾布）新增40×40經緯、10×10 draft與32組斜向交替的成對五挑浮經（共64條長浮經），不以waffle凹格或逐挑珠狀凸點代替。重用正式cloth sampler；僅新kind建立600個Float64值／4800 bytes的完整同draft-run offset／平方half／inverse shoulder快取，長浮線跨內部owner維持連續、在run ends以C1退回平紋，舊材質不建立該快取。128² grain與160×160纖維週期，無逐點配置／hash／trig／sqrt。0.032 m參考tile／0.022 UV relief，單側lift0.00308 UV（按參考尺度換算98.56μm，非位移或實機量測）；全opaque M0／mortar0。沿用options／Worker／cache／ownership，不新增紗線geometry、pile loops、透光、吸水或各向異性光學模擬。

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

`pietersite` 是藍灰與金褐纖維角礫膠結的風格化拋光切面，不是平行整片tigereye條帶，也不把顏色當金屬或挖成凹溝。36個不規則五半平面clast各自含纖維方向、彎曲band／細fiber與blue/gold相，23值pose共828個Float64／6,624 B；5×7 cloud與128² grain共16,419值皆快取。3×3 owner加圓界cull，半徑保守上界1.045164小於漏除owner最短1.15；五個C1 shoulder乘積沒有nearest-plane角稜，surface sampler無逐點配置／hash／trig／sqrt，needsDetail bypass保留。單一藍灰→金褐authored ramp讓全部礦物顏料沿用tint，M0／mortar0／AO1及opaque。全相同一平切面，只含grain理論高度跨度0.000003 UV；0.06 m參考tile／0.001 UV relief按參考尺度換算0.18μm，不是幾何位移或實測纖維尺度。沿用options／Worker／cache／ownership，不宣稱視角相關chatoyancy、anisotropy、半透明、產地鑑定或地質生成模擬。

`castorbeans` 為16個各自seeded旋轉／微偏移的亮面斑駁橢圓種皮，每顆只在同一端接上一個較淡、較粗糙的種阜（caruncle）；不是乾皺tonka、縱槽date pit、雙種阜或透明種子。80個Float64 pose／640 B及16×9 spots、5×7 warp、128² grain共16,563值皆初始化快取。沿用既有oval seed squared-cap／C1肩及順序compositing，種阜與種皮重疊連通；保守旋轉支撐界0.29+0.09加jitter0.025為0.405，小於owner半寬0.5。深色testa斑紋只改顏料、不雕凹高度；種皮凸面與種阜各自smooth dome，M0／mortar0／全opaque。surface sampler無逐點配置／hash／trig／sqrt，needsDetail bypass保留。0.064 m參考tile／0.03 UV relief下主體長軸換算9.6 mm、種阜寬2.88 mm；grain理論高度跨度0.000045 UV換算2.88μm，只是參考尺度，不是植物測量或geometry displacement。沿用options／tint／Worker／cache／ownership，不新增生長、果莢、藥用或食用功能。

`zebrawood` 是淺金黃褐木面、深褐變寬微彎縱紋與分布於深淺部位的稀疏開放導管，不是斑馬毛皮、端面年輪、雕凹條紋或只替wenge換色。沿用既有hardwood的seeded橢圓導管／C1肩與cache-noise，額外讓深色縱紋寬度連續變化；暗紋只改顏料，真正淺凹只有導管，全部opaque M0／mortar0。導管pose 512個Float64／4,096 bytes與3×5 warp、18×4 width、64×4 fiber、128² grain共16,727值皆初始化快取；無逐點配置／hash／trig／sqrt，needsDetail bypass保留。0.16 m參考tile／0.002 UV relief下導管名義深度0.0002 UV換算32μm，grain理論高度跨度0.000006 UV換算0.96μm，只是參考尺度、不是真實解剖測量或geometry displacement。沿用既有options／tint／Worker／cache／ownership，不新增生長、樹種辨識、anisotropy或動態chatoyancy。

`twopinscrewheads` 為25個各自seeded旋轉／微偏移的圓鋼head，每顆有兩個相對、彼此分離的圓形盲凹穴，保留平坦金屬底與完整中央鋼橋；不是連通槽、三孔、中心柱或打穿backing。直接fallthrough共用既有hex／square的head／backing／blind-floor核心，以兩個不重疊squared-circle C1肩相加；原四／六平邊乘法次序不變。125個Float64 pose／1,000 bytes及128² grain皆只初始化一次，surface sampler無逐點配置／hash／trig／sqrt，needsDetail bypass保留。單孔最外支撐0.222小於完整head半徑0.32；孔心距0.31大於兩倍孔半徑0.134，中央鋼橋寬0.176；head外半徑加jitter為0.395小於owner半寬0.5。head及盲穴底M1、低backing M0，mortar為1−face、全opaque，public facade的metallic factor為1。0.06 m參考tile／0.03 UV relief下名義穴深0.0129 UV換算0.774 mm，floor grain理論跨度0.00006 UV換算3.6μm；只是參考尺度，不是實測機械尺寸、真正geometry displacement、螺紋或driver配合認證。沿用既有options／tint／Worker／cache／ownership。

`thulite` 近似選定細粒粉紅／淡色礦物斑駁的Thulite磨光面：粉紅主體混有密集細淡粒，而非把所有粉紅zoisite、粗黑副礦物、宿主條帶或原石破裂面重建為同一圖樣。與既有Unakite共用三層cached-noise有界多項式field；只在constructor選一次variant並正規化底色／inclusion contrast，保留Unakite全部既有greenBase／pinkContrast參數鍵與point算術順序，不建立第二份合成器。0.12 m nominal tile採7² coarse／37² medium／191² fine及0.12／0.18／0.70權重，改為fine主導分布，不是只換palette；共37,899個Float64／303,192 bytes field tables，不是總RAM或texture cache量。每point維持三次cached lookup，無新增point分支、配置、hash、sqrt、trig或鄰格搜尋；C1 polynomial色斑不形成hard白粒、grout格線、假晶肋或深度／AO切口。色斑共用近乎平整的fine微grain拋光面，AO1／M0／mortar0／正式factor0；UV relief 0.00012不是m厚度。保留四張opaque maps與optional height及tint／Worker／cache／repeats／ownership，不新增mesh、透明石英、真實位移、礦物／比例／產地鑑定或物理／光學／療效認證API。

`blackeyedpeas` 近似選定乾燥、象牙奶白長橢圓黑眼豇豆的種臍朝上表面：完整凸起種皮上，一圈局部深色橢圓眼圈包圍短白色種臍；眼圈與種臍都只改pigment，不形成穿孔、裂豆、刻槽或蓖麻種阜，也不描繪綠莢／熟豆或所有豇豆品種。0.06 m nominal tile內5×5固定中心的owners採seeded方向／種皮明度；constructor預算cos／sin／單豆底色及肩部倒數，75 pose值加5×7 coat與128² grain共16,494個Float64／131,952 bytes field tables，不是整體RAM或texture cache量。獨立case重用既有豆粒凸體／短capsule圖樣，加C1橢圓色圈；前景兩次cached lookup，空背底先return，無逐點配置、hash、trig、sqrt或鄰格掃描。height僅為平滑凸體，細grain只影響色／roughness；UV relief 0.025不是m厚度，metallic map／正式預設factor0，保留不透明低位背底。不是新增mesh、真實位移、植物解剖／品種鑑定或物理／光學認證API。

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

唯讀 `kind`、`material`、`textures` 提供預設內容：`textures.baseColor` 的 RGB 為 sRGB；`normal` 為 linear tangent-space；`metallicRoughness` 的 G 存 roughness、B 存 metallic；`occlusion` 的 R 存 linear occlusion。四份不可變 `Texture` source 沿既有 PBR／renderer 路徑使用。預設 opaque、全部 slots 使用 repeat sampling、roughness factor 為 1；metal／rust／diamondplate／hammeredmetal／galvanized／corrugatedmetal／perforatedmetal／expandedmetal／wiremesh／knurledmetal／engineturned／goldleaf／chainmail／rivetedmetal／weldedmetal／pyrite 的 metallic factor 為 1，其餘種類為 0。

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

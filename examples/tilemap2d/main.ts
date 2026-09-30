import {
  CameraStrategies,
  Colliders,
  Game,
  Primitive2D,
  RigidBody2D,
  Scene,
  SpriteSheet,
  Sprite,
  Texture,
  TileMap,
  type RendererPreference,
} from '../../src/index.js';

const WIDTH = 800;
const HEIGHT = 450;
const TILE = 32;
const COLUMNS = 50;
const ROWS = 40;
const SPEED = 180;
const ZOOM_MIN = 0.75;
const ZOOM_MAX = 2.5;

const GRASS = 0;
const FLOWERS = 1;
const STONE = 2;

const $ = <T extends HTMLElement>(id: string): T =>
  document.querySelector<T>(`#${id}`)!;
const backend = $<HTMLSelectElement>('backend');
const canvasElement = $<HTMLCanvasElement>('game');
const readout = $<HTMLParagraphElement>('readout');
const status = $<HTMLParagraphElement>('status');

backend.value = new URLSearchParams(location.search).get('renderer') ?? 'auto';
backend.addEventListener('change', () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
});

/** Deterministic pseudo-random sequence so the generated map is identical every run. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/** Draws a three-tile atlas (grass, flowers, stone) so the example needs no asset file. */
async function createTileset(): Promise<Texture> {
  const canvas = document.createElement('canvas');
  canvas.width = TILE * 3;
  canvas.height = TILE;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#3f8f4a';
  c.fillRect(0, 0, TILE, TILE);
  c.fillStyle = '#4aa556';
  for (const [x, y] of [
    [4, 6],
    [18, 10],
    [9, 22],
    [25, 24],
  ])
    c.fillRect(x, y, 4, 2);
  c.fillStyle = '#3f8f4a';
  c.fillRect(TILE, 0, TILE, TILE);
  for (const [x, y, color] of [
    [8, 9, '#ffe27a'],
    [21, 14, '#ff8fb1'],
    [13, 24, '#ffffff'],
  ] as const) {
    c.fillStyle = color;
    c.fillRect(TILE + x, y, 5, 5);
  }
  c.fillStyle = '#7d8793';
  c.fillRect(TILE * 2, 0, TILE, TILE);
  c.fillStyle = '#9aa4b0';
  c.fillRect(TILE * 2 + 2, 2, TILE - 4, 12);
  c.fillStyle = '#626b76';
  c.fillRect(TILE * 2 + 2, 18, TILE - 4, 12);
  return Texture.fromImage(canvas);
}

let game: Game | undefined;
let tileset: Texture | undefined;
const release = (): void => {
  game?.destroy();
  tileset?.destroy();
};

try {
  game = await Game.create({
    canvas: '#game',
    width: WIDTH,
    height: HEIGHT,
    renderer: backend.value as RendererPreference,
  });
  const runtime = game;
  runtime.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });
  tileset = await createTileset();
  const sheet = SpriteSheet.grid(tileset, {
    frameWidth: TILE,
    frameHeight: TILE,
  });

  class World extends Scene {
    readonly ground = this.add(
      new TileMap({
        columns: COLUMNS,
        rows: ROWS,
        tileWidth: TILE,
        tileHeight: TILE,
        sheet,
      }),
    );
    /** Stone lives on its own layer: only these cells are solid. */
    readonly walls = this.add(
      new TileMap({
        columns: COLUMNS,
        rows: ROWS,
        tileWidth: TILE,
        tileHeight: TILE,
        sheet,
      }),
    );
    private shakes = 0;
    player: Sprite | undefined;

    protected override async initialize(
      _game: Game,
      signal: AbortSignal,
    ): Promise<void> {
      this.physics.gravity.set(0, 0);
      this.walls.zIndex = 1;
      const random = createRandom(42);
      for (let row = 0; row < ROWS; row++)
        for (let column = 0; column < COLUMNS; column++) {
          this.ground.setTile(column, row, {
            frame: random() < 0.12 ? FLOWERS : GRASS,
          });
          const border =
            row === 0 ||
            column === 0 ||
            row === ROWS - 1 ||
            column === COLUMNS - 1;
          const clump = random() < 0.07 && (column > 7 || row > 7);
          if (border || clump)
            this.walls.setTile(column, row, { frame: STONE, solid: true });
        }
      const player = await Primitive2D.rectangle(20, 20, '#ffd24a');
      if (signal.aborted) {
        player.destroy();
        signal.throwIfAborted();
      }
      player.position.set(4.5 * TILE, 4.5 * TILE);
      player.zIndex = 2;
      player.collider = Colliders.box(20, 20);
      player.body = new RigidBody2D({ lockRotation: true, gravityScale: 0 });
      this.player = this.add(player);
      this.camera2D.position.set(0, 0);
      this.camera2D.addBehavior(
        CameraStrategies.follow(player, {
          smoothTime: 0.15,
          deadZone: { x: 320, y: 170, width: 160, height: 110 },
        }),
      );
      this.camera2D.addBehavior(
        CameraStrategies.bounds({
          x: 0,
          y: 0,
          width: COLUMNS * TILE,
          height: ROWS * TILE,
        }),
      );
    }

    override update(): void {
      const keyboard = runtime.input.keyboard;
      const x =
        (keyboard.isDown('KeyD') || keyboard.isDown('ArrowRight') ? 1 : 0) -
        (keyboard.isDown('KeyA') || keyboard.isDown('ArrowLeft') ? 1 : 0);
      const y =
        (keyboard.isDown('KeyS') || keyboard.isDown('ArrowDown') ? 1 : 0) -
        (keyboard.isDown('KeyW') || keyboard.isDown('ArrowUp') ? 1 : 0);
      const length = Math.hypot(x, y) || 1;
      this.player?.body?.velocity.set(
        (x / length) * SPEED,
        (y / length) * SPEED,
      );
    }

    shake(): void {
      this.camera2D.shake({
        duration: 0.6,
        amplitude: [10, 8],
        frequency: 25,
        seed: ++this.shakes,
      });
    }

    zoomBy(factor: number): void {
      const target = Math.min(
        ZOOM_MAX,
        Math.max(ZOOM_MIN, this.camera2D.zoom * factor),
      );
      this.camera2D.zoomTo(target, 0.2);
    }

    describe(): string {
      const player = this.player;
      if (!player) return '';
      const tile = this.walls.worldToTile(player.position);
      let drawn = 0;
      for (const map of [this.ground, this.walls])
        for (const child of map.children)
          if (child instanceof Sprite && child.renderEnabled) drawn++;
      const camera = this.camera2D;
      return `Player tile (${tile.x}, ${tile.y}) · camera (${camera.position.x.toFixed(0)}, ${camera.position.y.toFixed(0)}) zoom ${camera.zoom.toFixed(2)} · tiles drawn ${drawn} of ${COLUMNS * ROWS * 2}`;
    }
  }

  const scene = new World();
  await runtime.setScene(scene);
  runtime.start();
  $('zoom-in').addEventListener('click', () => scene.zoomBy(1.25));
  $('zoom-out').addEventListener('click', () => scene.zoomBy(0.8));
  $('shake').addEventListener('click', () => scene.shake());
  canvasElement.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      scene.zoomBy(event.deltaY < 0 ? 1.1 : 1 / 1.1);
    },
    { passive: false },
  );
  const report = window.setInterval(() => {
    readout.textContent = scene.describe();
  }, 100);
  status.textContent = `${runtime.graphics.backend} · ${COLUMNS}×${ROWS} TileMap layers, solid stone tiles as static colliders, Camera2D follow + bounds + shake`;
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    window.clearInterval(report);
    release();
  });
} catch (error) {
  release();
  status.textContent = error instanceof Error ? error.message : String(error);
}

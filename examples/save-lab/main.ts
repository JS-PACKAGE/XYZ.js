import {
  Game,
  IndexedDBStorage,
  LocalStorageBackend,
  Scene,
  Serializer,
  Sprite,
  Text2D,
  Texture,
  type RendererPreference,
  isSceneSnapshot,
  type SaveStorage,
} from '../../src/index.js';

const WIDTH = 640;
const HEIGHT = 300;
const params = new URLSearchParams(location.search);
const $ = <T extends HTMLElement>(id: string): T =>
  document.querySelector<T>(`#${id}`)!;
const storageSelect = $<HTMLSelectElement>('storage');
const slotSelect = $<HTMLSelectElement>('slot');
const status = $<HTMLParagraphElement>('status');

storageSelect.value = params.get('storage') ?? 'local';
slotSelect.value = params.get('slot') ?? 'one';
// Storage and renderer are fixed at Game.create, so changing them reloads the page.
storageSelect.addEventListener('change', () => {
  const url = new URL(location.href);
  url.searchParams.set('storage', storageSelect.value);
  location.href = url.href;
});

let game: Game | undefined;
let texture: Texture | undefined;
const release = (): void => {
  game?.destroy();
  texture?.destroy();
};

try {
  const saveStorage: SaveStorage =
    storageSelect.value === 'indexed'
      ? new IndexedDBStorage('save-lab')
      : new LocalStorageBackend('save-lab');
  game = await Game.create({
    canvas: '#game',
    width: WIDTH,
    height: HEIGHT,
    renderer: (params.get('renderer') ?? 'auto') as RendererPreference,
    saveStorage,
  });
  const runtime = game;
  runtime.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, 32, 32);
  texture = await Texture.fromImage(canvas);
  const square = texture;

  class SaveScene extends Scene {
    readonly player = this.add(
      new Sprite({
        texture: square,
        position: [80, HEIGHT / 2],
        scale: [1.5, 1.5],
        tint: [1, 0.82, 0.29, 1],
      }),
    );
    readonly serializer = new Serializer(this);
    playTime = 0;
    override update(dt: number): void {
      this.playTime += dt;
    }
  }

  const scene = new SaveScene();
  scene.serializer.register('player', scene.player);
  await runtime.setScene(scene);
  const label = await Text2D.create('Move, save, reload the page.', {
    fontSize: 18,
    color: '#ffffff',
  });
  label.position.set(WIDTH / 2, 30);
  scene.add(label);
  runtime.start();

  const report = async (message: string): Promise<void> => {
    const slots = await runtime.saves.slots();
    status.textContent = `${runtime.graphics.backend} · ${storageSelect.value} · slots [${slots.join(', ')}] · ${message}`;
    await label.setText(message);
  };
  const load = async (): Promise<void> => {
    const result = await runtime.saves.load(slotSelect.value);
    if (result.status === 'missing') {
      await report(`slot ${slotSelect.value} is empty`);
    } else if (result.status === 'corrupt') {
      await report(
        `slot ${slotSelect.value} is corrupt: ${result.error.message}`,
      );
    } else {
      const { data } = result.record;
      if (!isSceneSnapshot(data)) throw new Error('Slot is not a snapshot.');
      await scene.serializer.restore(data);
      await report(
        `loaded ${slotSelect.value}: x=${scene.player.position.x.toFixed(0)} (saved ${result.record.metadata.savedAt})`,
      );
    }
  };

  $('move').addEventListener('click', () => {
    const next = scene.player.position.x + 50;
    scene.player.position.set(next > WIDTH - 40 ? 80 : next, HEIGHT / 2);
    void report(`x=${scene.player.position.x.toFixed(0)} (unsaved)`);
  });
  $('save').addEventListener('click', () => {
    const snapshot = scene.serializer.capture();
    void runtime.saves
      .save(slotSelect.value, snapshot, scene.playTime)
      .then(() => report(`saved ${slotSelect.value}`))
      .catch((error: unknown) =>
        report(error instanceof Error ? error.message : String(error)),
      );
  });
  $('load').addEventListener('click', () => void load());
  $('remove').addEventListener('click', () => {
    void runtime.saves
      .remove(slotSelect.value)
      .then(() => report(`removed ${slotSelect.value}`));
  });

  await load();
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) release();
  });
} catch (error) {
  release();
  status.textContent = error instanceof Error ? error.message : String(error);
}

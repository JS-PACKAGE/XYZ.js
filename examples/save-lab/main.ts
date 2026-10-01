import {
  Game,
  IndexedDBStorage,
  LocalStorageBackend,
  Scene,
  Serializer,
  Sprite,
  Text2D,
  Texture,
  type I18nParams,
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
const langSelect = $<HTMLSelectElement>('lang');
const status = $<HTMLParagraphElement>('status');

storageSelect.value = params.get('storage') ?? 'local';
slotSelect.value = params.get('slot') ?? 'one';
langSelect.value = params.get('lang') ?? 'en';
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

const messages = {
  en: {
    title: 'Move, save, reload the page.',
    ready: 'Ready',
    empty: 'Slot {slot} is empty',
    corrupt: 'Slot {slot} is corrupt',
    loaded: 'Loaded {slot}: x={x}',
    unsaved: 'x={x} (unsaved)',
    saved: 'Saved {slot}',
    removed: 'Removed {slot}',
    slots: { one: '{count} slot stored', other: '{count} slots stored' },
  },
  'zh-Hant': {
    title: '移動、存檔，然後重新載入頁面。',
    ready: '就緒',
    empty: '欄位 {slot} 是空的',
    corrupt: '欄位 {slot} 已損毀',
    loaded: '已載入 {slot}：x={x}',
    unsaved: 'x={x}（尚未存檔）',
    saved: '已儲存 {slot}',
    removed: '已移除 {slot}',
    slots: { other: '已存 {count} 個欄位' },
  },
  ja: {
    title: '動かして保存し、ページを再読み込みします。',
    ready: '準備完了',
    empty: 'スロット {slot} は空です',
    corrupt: 'スロット {slot} は破損しています',
    loaded: '{slot} を読み込みました：x={x}',
    unsaved: 'x={x}（未保存）',
    saved: '{slot} を保存しました',
    removed: '{slot} を削除しました',
    slots: { other: '{count} スロット保存済み' },
  },
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
    i18n: { locale: langSelect.value, fallback: 'en', messages },
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
  const title = await Text2D.create('', { fontSize: 18, color: '#ffffff' });
  title.position.set(WIDTH / 2, 30);
  scene.add(title);
  const message = await Text2D.create('', { fontSize: 16, color: '#ffd34a' });
  message.position.set(WIDTH / 2, HEIGHT - 30);
  scene.add(message);
  runtime.i18n.bindText(title, 'title');
  runtime.start();

  // The last report is kept as key + params so a language switch can re-render it.
  let last: { key: string; values: I18nParams } = { key: 'ready', values: {} };
  const render = async (): Promise<void> => {
    const slots = await runtime.saves.slots();
    const text = runtime.i18n.t(last.key, last.values);
    status.textContent = `${runtime.graphics.backend} · ${storageSelect.value} · ${runtime.i18n.t('slots', { count: slots.length })} · ${text}`;
    await message.setText(text);
  };
  const report = (key: string, values: I18nParams = {}): Promise<void> => {
    last = { key, values };
    return render();
  };
  const slot = (): string => slotSelect.value;
  const load = async (): Promise<void> => {
    const result = await runtime.saves.load(slot());
    if (result.status === 'missing') {
      await report('empty', { slot: slot() });
    } else if (result.status === 'corrupt') {
      await report('corrupt', { slot: slot() });
    } else {
      const { data } = result.record;
      if (!isSceneSnapshot(data)) throw new Error('Slot is not a snapshot.');
      await scene.serializer.restore(data);
      await report('loaded', {
        slot: slot(),
        x: Math.round(scene.player.position.x),
      });
    }
  };

  langSelect.addEventListener('change', () => {
    runtime.i18n.setLocale(langSelect.value);
    const url = new URL(location.href);
    url.searchParams.set('lang', langSelect.value);
    history.replaceState(null, '', url);
    void render();
  });
  $('move').addEventListener('click', () => {
    const next = scene.player.position.x + 50;
    scene.player.position.set(next > WIDTH - 40 ? 80 : next, HEIGHT / 2);
    void report('unsaved', { x: Math.round(scene.player.position.x) });
  });
  $('save').addEventListener('click', () => {
    const snapshot = scene.serializer.capture();
    void runtime.saves
      .save(slot(), snapshot, scene.playTime)
      .then(() => report('saved', { slot: slot() }))
      .catch((error: unknown) => {
        status.textContent =
          error instanceof Error ? error.message : String(error);
      });
  });
  $('load').addEventListener('click', () => void load());
  $('remove').addEventListener('click', () => {
    void runtime.saves
      .remove(slot())
      .then(() => report('removed', { slot: slot() }));
  });

  await load();
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) release();
  });
} catch (error) {
  release();
  status.textContent = error instanceof Error ? error.message : String(error);
}

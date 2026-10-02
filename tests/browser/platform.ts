import {
  Game,
  Scene,
  Sprite,
  Texture,
  UIRoot,
  UIButton,
  UITextInput,
  LocalStorageBackend,
  type RendererPreference,
} from '../../src/index.js';
import { frameProofs, errorDetail } from './frame-proof.js';
import { installPhysicalCollector } from './physical-qualification.js';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const output = document.querySelector<HTMLPreElement>('#report')!;
const renderer = (new URLSearchParams(location.search).get('renderer') ??
  'canvas2d') as RendererPreference;
const report = {
  renderer,
  userAgent: navigator.userAgent,
  physicalDeviceCertification: false,
  assertions: [] as string[],
  activations: 0,
  pointerTypes: [] as string[],
  compositions: [] as {
    type: string;
    trusted: boolean;
    composing: boolean;
    value: string;
  }[],
  nativeEdits: [] as { trusted: boolean; value: string; inputType: string }[],
  visibility: [] as { state: string; trusted: boolean; audioPaused: boolean }[],
  frozenLifecycle: [] as { type: string; trusted: boolean; ticks: number }[],
  ticks: 0,
  value: '',
  selection: [0, 0],
  audioUnlocked: false,
  audioGestureTrusted: false,
  restored: false,
  lifecycleChecked: false,
  destroyed: false,
  png: '',
  error: '',
};
let game: Game | undefined;
let field: UITextInput | undefined;
let texture: Texture | undefined;
let state = 'starting';
function publish(next = state): void {
  state = next;
  if (field) {
    report.value = field.value;
    report.selection = [field.selectionStart, field.selectionEnd];
  }
  output.dataset.state = state;
  output.textContent = JSON.stringify(report, null, 2);
}
function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
  report.assertions.push(message);
}
function fail(error: unknown): void {
  report.error = errorDetail(error);
  publish('failed');
}
const frames = async (count = 3): Promise<void> => {
  for (let i = 0; i < count; i++)
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
};
class PlatformScene extends Scene {
  ticks = 0;
  override update(): void {
    this.ticks++;
    report.ticks = this.ticks;
    publish();
  }
}
function destroy(): void {
  game?.destroy();
  texture?.destroy();
  report.destroyed = game?.state === 'destroyed';
  check(report.destroyed, 'Game reaches destroyed state');
  check(
    !document.querySelector('input[aria-label="Native field"]'),
    'Teardown removes native editing control',
  );
  publish('destroyed');
}

addEventListener('error', (event) =>
  fail(event.error ?? new Error(event.message)),
);
addEventListener('unhandledrejection', (event) => fail(event.reason));

try {
  game = await Game.create({
    canvas,
    renderer,
    width: 400,
    height: 260,
    pixelRatio: 1,
    autoResize: false,
    antialias: false,
    saveStorage: new LocalStorageBackend(`platform-probe-${renderer}`),
  });
  const runtime = game;
  runtime.addEventListener('error', (event) =>
    fail((event as CustomEvent<Error>).detail),
  );
  check(
    runtime.graphics.backend === renderer,
    'Explicit backend is honored without fallback',
  );
  const scene = new PlatformScene();
  for (const type of ['freeze', 'resume'])
    document.addEventListener(type, (event) => {
      report.frozenLifecycle.push({
        type,
        trusted: event.isTrusted,
        ticks: scene.ticks,
      });
      publish();
    });
  const source = document.createElement('canvas');
  source.width = source.height = 8;
  const painter = source.getContext('2d')!;
  painter.fillStyle = '#00ff00';
  painter.fillRect(0, 0, 8, 8);
  texture = await Texture.fromImage(source);
  scene.add(
    new Sprite({
      texture,
      anchor: [0, 0],
      position: [300, 190],
      scale: [8, 8],
    }),
  );
  const root = scene.add(
    new UIRoot(runtime, { direction: 'column', padding: 8, gap: 8 }),
  );
  field = root.add(
    await UITextInput.create({
      label: 'Native field',
      layout: { width: 240, height: 40 },
    }),
  );
  const input = field;
  const action = root.add(
    await UIButton.create('Canvas action', {
      layout: { width: 240, height: 40 },
    }),
  );
  action.addEventListener('click', () => {
    report.activations++;
    publish();
  });
  const audio = root.add(
    await UIButton.create('Unlock audio', {
      layout: { width: 240, height: 40 },
    }),
  );
  audio.addEventListener('click', () => {
    if (new URLSearchParams(location.search).has('physical')) return;
    void runtime.audio
      .unlock()
      .then(() => {
        report.audioUnlocked = runtime.audio.unlocked;
        check(
          report.audioUnlocked,
          'Native audio manager unlocks from activation',
        );
        publish();
      })
      .catch(fail);
  });
  // Accessible activation originates from Enter; its semantic click is a CustomEvent.
  document.addEventListener(
    'keydown',
    (event) => {
      if (
        event.code === 'Enter' &&
        (event.target as HTMLElement)?.getAttribute('aria-label') ===
          'Unlock audio'
      )
        report.audioGestureTrusted ||= event.isTrusted;
    },
    true,
  );
  canvas.addEventListener('pointerdown', (event) => {
    if (!report.pointerTypes.includes(event.pointerType))
      report.pointerTypes.push(event.pointerType);
    publish();
  });
  const captured = frameProofs(runtime.graphics, canvas);
  await runtime.setScene(scene);
  runtime.start();
  await frames();
  const native = document.querySelector<HTMLInputElement>(
    'input[aria-label="Native field"]',
  );
  check(!!native, 'Live UI publishes a native browser text input');
  native!.addEventListener('input', (event) => {
    report.nativeEdits.push({
      trusted: event.isTrusted,
      value: native!.value,
      inputType: (event as InputEvent).inputType,
    });
    publish();
  });
  for (const type of [
    'compositionstart',
    'compositionupdate',
    'compositionend',
  ])
    native!.addEventListener(type, (event) => {
      report.compositions.push({
        type,
        trusted: event.isTrusted,
        composing: input.isComposing,
        value: input.value,
      });
      publish();
    });
  const saved = await runtime.saves.load('field');
  if (saved.status === 'corrupt') throw saved.error;
  if (saved.status === 'loaded') {
    const data = saved.record.data as { value?: unknown };
    if (typeof data.value !== 'string')
      throw new Error('Saved field payload is invalid');
    await input.setValue(data.value);
    report.restored = true;
    check(
      input.value === data.value,
      'Save manager restores the field value on a real reload',
    );
  }
  async function lifecycle(): Promise<void> {
    runtime.pause();
    const ticks = scene.ticks;
    await frames(4);
    check(
      scene.ticks === ticks && runtime.state === 'paused',
      'Pause stops Scene updates',
    );
    runtime.resize(420, 280);
    check(
      canvas.width === 420 && canvas.height === 280,
      'Resize updates native backing pixels',
    );
    runtime.resume();
    await frames(4);
    check(
      scene.ticks > ticks && runtime.state === 'running',
      'Resume advances Scene updates',
    );
    const proof = await captured.next();
    const offset = (210 * proof.width + 320) * 4;
    check(
      proof.bytes[offset] < 4 &&
        proof.bytes[offset + 1] > 250 &&
        proof.bytes[offset + 2] < 4 &&
        proof.bytes[offset + 3] === 255,
      'Actual Game render contains expected opaque green sprite pixels',
    );
    report.png = proof.png;
    report.lifecycleChecked = true;
    publish('ready');
  }
  async function save(): Promise<void> {
    await runtime.saves.save('field', { value: input.value });
    publish('saved');
  }
  const api = { report, lifecycle, save, destroy };
  window.__xyzPlatform = api;
  document.querySelector('#lifecycle')!.addEventListener('click', () => {
    void lifecycle().catch(fail);
  });
  document.querySelector('#save')!.addEventListener('click', () => {
    void save().catch(fail);
  });
  document.querySelector('#destroy')!.addEventListener('click', () => {
    try {
      destroy();
    } catch (error) {
      fail(error);
    }
  });
  document
    .querySelector('#reload')!
    .addEventListener('click', () => location.reload());
  document.addEventListener('visibilitychange', (event) => {
    report.visibility.push({
      state: document.visibilityState,
      trusted: event.isTrusted,
      audioPaused: runtime.audio.paused,
    });
    publish();
  });
  addEventListener('pagehide', (event) => {
    try {
      if (!event.persisted) destroy();
      sessionStorage.setItem(
        'xyz-platform-pagehide',
        JSON.stringify({
          persisted: event.persisted,
          state: runtime.state,
          sceneDestroyed: scene.destroyed,
        }),
      );
    } catch (error) {
      fail(error);
    }
  });
  if (new URLSearchParams(location.search).has('physical')) {
    installPhysicalCollector(
      runtime,
      () => scene.ticks,
      () => captured.next(),
    );
  }
  document.querySelector('#download')!.addEventListener('click', () => {
    const operator =
      document.querySelector<HTMLTextAreaElement>('#operator')!.value;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            ...report,
            operator,
            mode: 'manual-unverified',
            physicalDeviceCertification: false,
          },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `xyz-platform-${renderer}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  });
  publish('ready');
} catch (error) {
  fail(error);
  game?.destroy();
  texture?.destroy();
}

declare global {
  interface Window {
    __xyzPlatform?: {
      report: typeof report;
      lifecycle(): Promise<void>;
      save(): Promise<void>;
      destroy(): void;
    };
  }
}

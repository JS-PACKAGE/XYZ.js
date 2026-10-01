import {
  Game,
  Group2D,
  Sprite,
  UIRoot,
  UIElement,
  UILabel,
  UIButton,
  UICheckbox,
  UISlider,
  FactoryRegistry,
  defineFactory,
  parseContentScene,
  buildContentScene,
  LocalStorageBackend,
  isSceneSnapshot,
  type ContentNodeDefinition,
  type InputContext,
  type SpriteOptions,
  type Texture,
  type TextureLease,
  type RendererPreference,
  type WarmupProgress,
} from '../../src/index.js';

const element = <T extends HTMLElement>(id: string): T =>
  document.querySelector<T>(`#${id}`)!;
const canvas = element<HTMLCanvasElement>('game');
const backend = element<HTMLSelectElement>('backend');
const status = element<HTMLParagraphElement>('status');
const loading = element<HTMLParagraphElement>('loading');
const pause = element<HTMLButtonElement>('pause');
const destroy = element<HTMLButtonElement>('destroy');
const lifetime = new AbortController();
const params = new URLSearchParams(location.search);
backend.value = params.get('renderer') ?? 'auto';
backend.addEventListener(
  'change',
  () => {
    const url = new URL(location.href);
    url.searchParams.set('renderer', backend.value);
    location.href = url.href;
  },
  { signal: lifetime.signal },
);

let game: Game | undefined;
let atlas: TextureLease | undefined;
let atlasURL: string | undefined;
let meter: number | undefined;
let touchAxis: UISlider | undefined;
let note = 'Ready';
let progress: WarmupProgress | undefined;
let levelNumber = 0;
const preferences = { speed: 120, grid: true };
const reportError = (error: unknown): void => {
  note = error instanceof Error ? error.message : String(error);
  status.textContent = note;
};
const resetAxis = (): void => {
  game?.input.virtual.reset();
  if (touchAxis && !touchAxis.destroyed) touchAxis.value = 0;
};
const release = (): void => {
  if (lifetime.signal.aborted) return;
  lifetime.abort();
  window.clearInterval(meter);
  game?.destroy();
  atlas?.release();
  if (atlasURL) URL.revokeObjectURL(atlasURL);
  pause.disabled = destroy.disabled = true;
  loading.textContent =
    'Destroyed; scene, UI scopes and resource borrowers released.';
  status.textContent = 'Destroyed';
};
window.addEventListener(
  'pagehide',
  (event) => {
    if (!event.persisted) release();
  },
  { signal: lifetime.signal },
);
window.addEventListener('pointerup', resetAxis, { signal: lifetime.signal });
window.addEventListener('pointercancel', resetAxis, {
  signal: lifetime.signal,
});
window.addEventListener('blur', resetAxis, { signal: lifetime.signal });
window.addEventListener(
  'keyup',
  (event) => {
    if (touchAxis && event.target === game?.accessibility.element(touchAxis))
      resetAxis();
  },
  { signal: lifetime.signal },
);
canvas.addEventListener(
  'pointerdown',
  () => canvas.focus({ preventScroll: true }),
  { signal: lifetime.signal },
);

interface PositionOptions {
  x: number;
  y: number;
}
interface VisualOptions extends PositionOptions {
  asset: string;
  size: number;
  tint: [number, number, number, number];
}
interface Services {
  textures: Readonly<Record<string, Texture>>;
  input: InputContext;
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new TypeError('Factory options must be an object.');
  return value as Record<string, unknown>;
}
function number(options: Record<string, unknown>, key: string): number {
  const value = options[key];
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new TypeError(`Invalid ${key}.`);
  return value;
}
function parsePosition(value: unknown): PositionOptions {
  const options = record(value);
  return { x: number(options, 'x'), y: number(options, 'y') };
}
function parseVisual(value: unknown): VisualOptions {
  const options = record(value);
  const tint = options.tint;
  if (
    typeof options.asset !== 'string' ||
    !Array.isArray(tint) ||
    tint.length !== 4 ||
    !tint.every(
      (channel) => typeof channel === 'number' && channel >= 0 && channel <= 1,
    )
  )
    throw new TypeError('Invalid asset or tint.');
  const size = number(options, 'size');
  if (size <= 0 || size > 256)
    throw new RangeError('Visual size must be in (0, 256].');
  return {
    ...parsePosition(value),
    asset: options.asset,
    size,
    tint: [tint[0], tint[1], tint[2], tint[3]],
  };
}
function textureFor(options: VisualOptions, services: Services): Texture {
  const texture = services.textures[options.asset];
  if (!texture || texture.destroyed)
    throw new Error(`Missing asset alias: ${options.asset}.`);
  return texture;
}
function visual(options: VisualOptions, services: Services): SpriteOptions {
  const texture = textureFor(options, services);
  return {
    texture,
    position: [options.x, options.y],
    scale: [options.size / texture.width, options.size / texture.height],
    tint: options.tint,
  };
}
class Actor extends Sprite {
  constructor(
    options: VisualOptions,
    private readonly services: Services,
  ) {
    super(visual(options, services));
  }
  override update(dt: number): void {
    const input = this.services.input;
    let x = input.value('right') - input.value('left');
    let y = input.value('down') - input.value('up');
    const length = Math.hypot(x, y);
    if (length > 1) {
      x /= length;
      y /= length;
    }
    const speed = preferences.speed * (input.value('boost') > 0 ? 2 : 1);
    const width = this.scene?.camera2D.viewportWidth ?? 960;
    const height = this.scene?.camera2D.viewportHeight ?? 600;
    this.position.set(
      Math.max(
        Math.min(320, width - 30),
        Math.min(width - 30, this.position.x + x * speed * dt),
      ),
      Math.max(30, Math.min(height - 30, this.position.y + y * speed * dt)),
    );
  }
}
class Follower extends Sprite {
  constructor(
    options: VisualOptions,
    services: Services,
    private readonly leader: Actor,
  ) {
    super(visual(options, services));
  }
  override update(dt: number): void {
    if (this.leader.destroyed) return;
    const amount = 1 - Math.exp(-dt * 3);
    this.position.set(
      this.position.x +
        (this.leader.position.x - 55 - this.position.x) * amount,
      this.position.y +
        (this.leader.position.y + 55 - this.position.y) * amount,
    );
  }
}

try {
  game = await Game.create({
    canvas,
    width: 960,
    height: 600,
    renderer: backend.value as RendererPreference,
    saveStorage: new LocalStorageBackend('xyz-authoring-lab'),
    resourceBudgets: {
      decodedTextureBytes: 65536,
      nativeTextureBytes: 4 * 1024 * 1024,
      nativeGeometryBytes: 1024 * 1024,
    },
  });
  const runtime = game;
  runtime.addEventListener('error', (event) =>
    reportError((event as CustomEvent<Error>).detail),
  );
  const source = document.createElement('canvas');
  source.width = source.height = 64;
  const paint = source.getContext('2d')!;
  paint.fillStyle = '#ffffff';
  paint.fillRect(0, 0, 64, 64);
  paint.fillStyle = '#d5deeb';
  paint.fillRect(4, 4, 56, 4);
  paint.fillRect(4, 4, 4, 56);
  const blob = await new Promise<Blob>((resolve, reject) =>
    source.toBlob(
      (value) =>
        value ? resolve(value) : reject(new Error('Atlas encoding failed.')),
      'image/png',
    ),
  );
  atlasURL = URL.createObjectURL(blob);
  atlas = await runtime.assets.acquireTexture(atlasURL, {
    signal: lifetime.signal,
  });
  const input = runtime.input.contexts.create('authoring-world', {
    priority: 10,
    consume: true,
    bindings: {
      left: [
        { key: 'KeyA' },
        { key: 'ArrowLeft' },
        { axis: 'leftX', direction: -1 },
        { virtual: 'move', direction: -1 },
      ],
      right: [
        { key: 'KeyD' },
        { key: 'ArrowRight' },
        { axis: 'leftX', direction: 1 },
        { virtual: 'move', direction: 1 },
      ],
      up: [
        { key: 'KeyW' },
        { key: 'ArrowUp' },
        { axis: 'leftY', direction: -1 },
      ],
      down: [
        { key: 'KeyS' },
        { key: 'ArrowDown' },
        { axis: 'leftY', direction: 1 },
      ],
      boost: [{ key: 'ShiftLeft' }, { button: 'a' }],
    },
  });
  input.activate();
  const services: Services = { textures: { tile: atlas.texture }, input };
  const registry = new FactoryRegistry({
    group: defineFactory<PositionOptions, Group2D, Services>({
      parse: parsePosition,
      create(options) {
        const group = new Group2D();
        group.position.set(options.x, options.y);
        return group;
      },
    }),
    sprite: defineFactory<VisualOptions, Sprite, Services>({
      parse: parseVisual,
      create(options, context) {
        return new Sprite(visual(options, context.services));
      },
    }),
    actor: defineFactory<VisualOptions, Actor, Services>({
      parse: parseVisual,
      create(options, context) {
        return new Actor(options, context.services);
      },
    }),
    follower: defineFactory<VisualOptions, Follower, Services>({
      parse: parseVisual,
      create(options, context) {
        const leader = context.reference('leader');
        if (!(leader instanceof Actor))
          throw new TypeError('Follower requires an actor reference.');
        return new Follower(options, context.services, leader);
      },
    }),
  });
  const common = {
    layout: { width: 'fill' as const, height: 36 },
    textStyle: { fontSize: 16, color: '#eff6ff' },
  };
  const makeButton = async (
    text: string,
    run: () => void | Promise<void>,
  ): Promise<UIButton> => {
    const button = await UIButton.create(text, common);
    button.addEventListener('click', () => {
      void Promise.resolve().then(run).catch(reportError);
    });
    return button;
  };
  const buildLevel = async (): Promise<void> => {
    resetAxis();
    const nodes: ContentNodeDefinition<typeof registry.definitions>[] = [
      { id: 'world', kind: 'group', options: { x: 0, y: 0 } },
    ];
    for (let row = 0; row < 5; row++)
      for (let column = 0; column < 8; column++)
        nodes.push({
          id: `tile-${row}-${column}`,
          parent: 'world',
          kind: 'sprite',
          options: {
            asset: 'tile',
            x: 350 + column * 70,
            y: 100 + row * 85,
            size: 18,
            tint: [0.28, 0.42, 0.61, 1],
          },
        });
    nodes.push({
      id: 'actor',
      kind: 'actor',
      parent: 'world',
      options: {
        asset: 'tile',
        x: 640,
        y: 270,
        size: 36,
        tint: [0.3, 0.95, 0.66, 1],
      },
    });
    nodes.push({
      id: 'follower',
      kind: 'follower',
      parent: 'world',
      references: { leader: 'actor' },
      options: {
        asset: 'tile',
        x: 570,
        y: 335,
        size: 26,
        tint: [1, 0.73, 0.3, 1],
      },
    });
    // Round-trip actual author data, then preflight it before any factory runs.
    const definition = parseContentScene(
      registry,
      JSON.parse(JSON.stringify({ version: 1, nodes })) as unknown,
    );
    const content = await buildContentScene(registry, definition, services, {
      signal: lifetime.signal,
    });
    try {
      const root = content.scene.add(
        new UIRoot(runtime, { direction: 'overlay', padding: 16 }),
      );
      const panel = root.add(
        new UIElement({
          direction: 'column',
          width: 268,
          height: 'fill',
          gap: 8,
        }),
      );
      panel.add(
        await UILabel.create('Typed JSON level', {
          ...common,
          layout: { width: 'fill', height: 30 },
        }),
      );
      let rebuilding = false;
      const rebuild = await makeButton('Rebuild level', async () => {
        if (rebuilding) throw new Error('Rebuild already in progress.');
        rebuilding = true;
        rebuild.disabled = true;
        try {
          await buildLevel();
        } finally {
          if (!rebuild.destroyed) rebuild.disabled = false;
          rebuilding = false;
        }
      });
      panel.add(rebuild);
      const save = panel.add(
        await makeButton('Save positions', async () => {
          await runtime.saves.save('positions', content.serializer.capture());
          note = 'Positions saved';
        }),
      );
      panel.add(
        await makeButton('Restore positions', async () => {
          const result = await runtime.saves.load('positions');
          if (result.status !== 'loaded') {
            note = `Save slot: ${result.status}`;
            return;
          }
          if (!isSceneSnapshot(result.record.data))
            throw new TypeError('Save slot is not a scene snapshot.');
          await content.serializer.restore(result.record.data);
          note = 'Positions restored';
        }),
      );
      const grid = panel.add(
        await UICheckbox.create('Show grid', {
          ...common,
          checked: preferences.grid,
        }),
      );
      const setGrid = (): void => {
        preferences.grid = grid.checked;
        for (const node of nodes)
          if (node.kind === 'sprite')
            content.require(node.id, 'sprite').visible = grid.checked;
      };
      grid.addEventListener('change', setGrid);
      setGrid();
      const speed = panel.add(
        await UISlider.create('Movement speed', {
          ...common,
          layout: { width: 'fill', height: 64 },
          min: 40,
          max: 300,
          step: 10,
          value: preferences.speed,
        }),
      );
      speed.addEventListener('change', () => {
        preferences.speed = speed.value;
      });
      const axis = panel.add(
        await UISlider.create('Touch axis (release=0)', {
          ...common,
          layout: { width: 'fill', height: 64 },
          min: -1,
          max: 1,
          step: 0.1,
          value: 0,
        }),
      );
      axis.addEventListener('change', () =>
        runtime.input.virtual.set('move', axis.value),
      );
      // DOM release precedes deferred engine routing, including a same-frame down/up.
      for (const type of [
        'pointerup',
        'pointerupoutside',
        'pointercancel',
        'blur',
      ])
        axis.addEventListener(type, () => {
          if (!axis.destroyed && runtime.state !== 'destroyed') axis.value = 0;
        });
      const modal = root.add(
        new UIElement({
          direction: 'column',
          width: 288,
          height: 220,
          gap: 12,
          padding: 12,
        }),
      );
      modal.setVisible(false);
      modal.add(await UILabel.create('Focus-trapped settings', common));
      const modalGrid = modal.add(
        await UICheckbox.create('Show world grid', {
          ...common,
          checked: preferences.grid,
        }),
      );
      modalGrid.addEventListener('change', () => {
        grid.checked = modalGrid.checked;
      });
      modal.add(
        await makeButton('Close settings', () => {
          panel.setVisible(true);
          modal.setVisible(false);
          root.focus.popModal();
        }),
      );
      panel.add(
        await makeButton('Settings', () => {
          modalGrid.checked = grid.checked;
          modal.setVisible(true);
          root.focus.pushModal(modal);
          panel.setVisible(false);
        }),
      );
      panel.add(
        await UILabel.create('Green: actor / gold: follower', {
          ...common,
          textStyle: { fontSize: 14, color: '#eff6ff' },
        }),
      );
      root.focus.focus(save);
      loading.textContent = 'Preparing candidate scene…';
      await runtime.setScene(content.scene, {
        warmup: {
          maxItems: 2,
          maxMilliseconds: 4,
          signal: lifetime.signal,
          onProgress(value) {
            progress = value;
            loading.textContent = `Warm-up ${value.completed}/${value.total} · ${value.chunks} RAF chunks`;
          },
        },
      });
      touchAxis = axis;
      levelNumber++;
      loading.textContent = `Level ${levelNumber} published atomically · ${progress?.chunks ?? 0} warm-up chunks`;
      note = 'Ready — click the world to move';
    } catch (error) {
      if (runtime.scene !== content.scene) content.scene.destroy();
      throw error;
    }
  };
  await buildLevel();
  runtime.start();
  pause.disabled = destroy.disabled = false;
  pause.addEventListener(
    'click',
    () => {
      resetAxis();
      if (runtime.state === 'paused') {
        runtime.resume();
        pause.textContent = 'Pause';
      } else {
        runtime.pause();
        pause.textContent = 'Resume';
      }
    },
    { signal: lifetime.signal },
  );
  destroy.addEventListener('click', release, { signal: lifetime.signal });
  meter = window.setInterval(() => {
    const native = runtime.graphics.residency;
    const cpu = runtime.assets.residency;
    status.textContent = `${runtime.graphics.backend} · ${runtime.state} · decoded ${cpu.liveBytes} B / ${cpu.borrowers} borrower(s) · native textures ${native.textures.liveBytes} B · geometry ${native.geometry.liveBytes} B · ${note}`;
  }, 200);
} catch (error) {
  release();
  reportError(error);
}

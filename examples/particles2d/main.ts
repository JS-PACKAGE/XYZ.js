import {
  Game,
  IsolatedGroup2D,
  ParticleEmitter,
  Scene,
  Texture,
  type BlendMode2D,
  type ColorRGBA,
  type ParticleEmitterOptions,
  type RendererPreference,
} from '../../src/index.js';

const WIDTH = 800;
const HEIGHT = 450;
const CAPACITY = 4000;

const $ = <T extends HTMLElement>(id: string): T =>
  document.querySelector<T>(`#${id}`)!;
const backend = $<HTMLSelectElement>('backend');
const presetSelect = $<HTMLSelectElement>('preset');
const rate = $<HTMLInputElement>('rate');
const lifetime = $<HTMLInputElement>('lifetime');
const gravity = $<HTMLInputElement>('gravity');
const stats = $<HTMLParagraphElement>('stats');
const status = $<HTMLParagraphElement>('status');

backend.value = new URLSearchParams(location.search).get('renderer') ?? 'auto';
backend.addEventListener('change', () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
});

type Shape = Omit<
  ParticleEmitterOptions,
  'texture' | 'capacity' | 'seed' | 'space'
>;

interface Params {
  readonly rate: number;
  readonly lifetime: number;
  readonly gravity: number;
}

interface Preset {
  readonly blend: BlendMode2D;
  readonly space: 'local' | 'world';
  readonly origin: readonly [number, number];
  readonly followsPointer?: true;
  readonly defaults: Params;
  shape(params: Params): Shape;
}

const color = (r: number, g: number, b: number, a: number): ColorRGBA => [
  r,
  g,
  b,
  a,
];
const span = (life: number): [number, number] => [life * 0.6, life];

const presets: Readonly<Record<string, Preset>> = {
  fountain: {
    blend: 'normal',
    space: 'world',
    origin: [WIDTH / 2, HEIGHT - 40],
    defaults: { rate: 160, lifetime: 2.4, gravity: 420 },
    shape: (p) => ({
      rate: p.rate,
      lifetime: span(p.lifetime),
      speed: [260, 340],
      angle: [-1.9, -1.24],
      acceleration: [0, p.gravity],
      startSize: [14, 14],
      endSize: [4, 4],
      startColor: color(0.4, 0.9, 1, 1),
      endColor: color(0.1, 0.3, 1, 0.2),
    }),
  },
  fire: {
    blend: 'add',
    // A world-space emitter inside an isolated blend layer renders nothing (observed on
    // Canvas2D), so additive fire emits in local space.
    space: 'local',
    origin: [WIDTH / 2, HEIGHT - 60],
    defaults: { rate: 220, lifetime: 1.2, gravity: -80 },
    shape: (p) => ({
      rate: p.rate,
      lifetime: span(p.lifetime),
      speed: [30, 90],
      angle: [-2.0, -1.14],
      acceleration: [0, p.gravity],
      startSize: [34, 34],
      endSize: [6, 6],
      startColor: color(1, 0.65, 0.15, 0.9),
      endColor: color(0.9, 0.1, 0, 0),
      nozzle: { kind: 'circle', radius: 24 },
    }),
  },
  snow: {
    blend: 'normal',
    space: 'world',
    origin: [WIDTH / 2, -10],
    defaults: { rate: 70, lifetime: 6, gravity: 20 },
    shape: (p) => ({
      rate: p.rate,
      lifetime: span(p.lifetime),
      speed: [20, 50],
      angle: [1.3, 1.85],
      acceleration: [0, p.gravity],
      startSize: [10, 10],
      endSize: [7, 7],
      startColor: color(1, 1, 1, 0.95),
      endColor: color(0.8, 0.9, 1, 0.3),
      nozzle: { kind: 'rectangle', width: WIDTH, height: 1 },
    }),
  },
  trail: {
    blend: 'normal',
    space: 'world',
    origin: [WIDTH / 2, HEIGHT / 2],
    followsPointer: true,
    defaults: { rate: 240, lifetime: 1, gravity: 0 },
    shape: (p) => ({
      rate: p.rate,
      lifetime: span(p.lifetime),
      speed: [10, 70],
      angle: [-Math.PI, Math.PI],
      acceleration: [0, p.gravity],
      startSize: [22, 22],
      endSize: [2, 2],
      startColor: color(1, 0.3, 0.9, 0.9),
      endColor: color(0.2, 0.8, 1, 0),
    }),
  },
};

let game: Game | undefined;
let glow: Texture | undefined;
const release = (): void => {
  game?.destroy();
  glow?.destroy();
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

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const context = canvas.getContext('2d')!;
  const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 32, 32);
  glow = await Texture.fromImage(canvas);
  const texture = glow;

  class ParticleScene extends Scene {
    private layer = this.add(new IsolatedGroup2D());
    private emitter: ParticleEmitter | undefined;
    private preset = presets.fountain;
    private emitting = true;
    private readonly burstEmitter = this.add(
      new ParticleEmitter({
        texture,
        capacity: 512,
        rate: 0,
        lifetime: [0.6, 1.4],
        speed: [80, 260],
        angle: [-Math.PI, Math.PI],
        acceleration: [0, 200],
        startSize: [20, 20],
        endSize: [2, 2],
        startColor: color(1, 0.9, 0.3, 1),
        endColor: color(1, 0.2, 0.1, 0),
        space: 'world',
      }),
    );

    get active(): number {
      return (this.emitter?.activeCount ?? 0) + this.burstEmitter.activeCount;
    }

    get isEmitting(): boolean {
      return this.emitting;
    }

    build(name: string, params: Params): void {
      this.preset = presets[name];
      this.emitter?.destroy();
      this.layer.blendMode = this.preset.blend;
      this.emitter = this.layer.add(
        new ParticleEmitter({
          ...this.preset.shape(params),
          texture,
          capacity: CAPACITY,
          space: this.preset.space,
        }),
      );
      this.emitter.position.set(...this.preset.origin);
      if (this.emitting) this.emitter.start();
    }

    burst(x: number, y: number): void {
      this.burstEmitter.position.set(x, y);
      this.burstEmitter.emit(80);
    }

    clear(): void {
      this.emitter?.clear();
      this.burstEmitter.clear();
    }

    toggle(): void {
      this.emitting = !this.emitting;
      if (this.emitting) this.emitter?.start();
      else this.emitter?.stop();
    }

    override update(): void {
      const pointer = runtime.input.pointer;
      if (this.preset.followsPointer && pointer.active)
        this.emitter?.position.set(pointer.position.x, pointer.position.y);
      if (pointer.wasPressed(0))
        this.burst(pointer.position.x, pointer.position.y);
    }
  }

  const scene = new ParticleScene();
  const read = (): Params => ({
    rate: Number(rate.value),
    lifetime: Number(lifetime.value),
    gravity: Number(gravity.value),
  });
  const show = (): void => {
    $('rate-value').textContent = rate.value;
    $('lifetime-value').textContent = lifetime.value;
    $('gravity-value').textContent = gravity.value;
  };
  const load = (name: string): void => {
    const defaults = presets[name].defaults;
    rate.value = String(defaults.rate);
    lifetime.value = String(defaults.lifetime);
    gravity.value = String(defaults.gravity);
    show();
    scene.build(name, defaults);
  };
  presetSelect.addEventListener('change', () => load(presetSelect.value));
  for (const input of [rate, lifetime, gravity])
    input.addEventListener('input', () => {
      show();
      scene.build(presetSelect.value, read());
    });
  $('burst').addEventListener('click', () =>
    scene.burst(WIDTH / 2, HEIGHT / 2),
  );
  $('clear').addEventListener('click', () => scene.clear());
  $<HTMLButtonElement>('toggle').addEventListener('click', (event) => {
    scene.toggle();
    (event.currentTarget as HTMLButtonElement).textContent = scene.isEmitting
      ? 'Stop emitting'
      : 'Start emitting';
  });

  load(presetSelect.value);
  await runtime.setScene(scene);
  runtime.start();
  const report = window.setInterval(() => {
    stats.textContent = `Active particles: ${scene.active} · preset capacity ${CAPACITY} · emitting ${scene.isEmitting}`;
  }, 100);
  status.textContent = `${runtime.graphics.backend} · CPU ParticleEmitter pools, additive IsolatedGroup2D, seeded world-space simulation`;
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    window.clearInterval(report);
    release();
  });
} catch (error) {
  release();
  status.textContent = error instanceof Error ? error.message : String(error);
}

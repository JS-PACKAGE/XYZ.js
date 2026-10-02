import {
  Game,
  Scene,
  Sprite,
  Text2D,
  Texture,
  type RendererPreference,
} from '../../src/index.js';

const WIDTH = 800;
const HEIGHT = 450;
const $ = <T extends HTMLElement>(id: string): T =>
  document.querySelector<T>(`#${id}`)!;
const backend = $<HTMLSelectElement>('backend');
const status = $<HTMLParagraphElement>('status');
const stats = $<HTMLParagraphElement>('stats');
const services = $<HTMLParagraphElement>('services');
const controls = ['pause', 'resume', 'reset', 'destroy'].map((id) =>
  $<HTMLButtonElement>(id),
);
backend.value =
  new URLSearchParams(location.search).get('renderer') ?? 'canvas2d';
backend.addEventListener('change', () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
});

let game: Game | undefined;
const textures: Texture[] = [];
let monitor: number | undefined;
const lifetime = new AbortController();
let candidate: Scene | undefined;
const reportError = (error: unknown): void => {
  status.textContent = error instanceof Error ? error.message : String(error);
};
const release = (): void => {
  lifetime.abort();
  clearInterval(monitor);
  const errors: unknown[] = [];
  try {
    game?.destroy();
  } catch (error) {
    errors.push(error);
  }
  try {
    candidate?.destroy();
  } catch (error) {
    errors.push(error);
  }
  for (const texture of textures) texture.destroy();
  textures.length = 0;
  controls.forEach((button) => {
    button.disabled = true;
  });
  if (errors.length)
    throw new AggregateError(errors, 'Game and scene cleanup failed.');
};
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) {
    try {
      release();
    } catch (error) {
      reportError(error);
    }
  }
});

try {
  game = await Game.create({
    canvas: '#game',
    width: WIDTH,
    height: HEIGHT,
    renderer: backend.value as RendererPreference,
  });
  lifetime.signal.throwIfAborted();
  const runtime = game;
  runtime.addEventListener('error', (event) =>
    reportError((event as CustomEvent<Error>).detail),
  );
  const source = document.createElement('canvas');
  source.width = WIDTH;
  source.height = HEIGHT;
  const context = source.getContext('2d')!;
  const sky = context.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, '#17273d');
  sky.addColorStop(1, '#193e40');
  context.fillStyle = sky;
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = '#ddece0';
  context.beginPath();
  context.arc(665, 92, 35, 0, Math.PI * 2);
  context.fill();
  for (let i = 0; i < 42; i++) {
    context.fillStyle = i % 2 ? '#344e53' : '#416960';
    context.beginPath();
    context.ellipse(
      i * 21,
      435,
      20,
      55 + (i % 7) * 13,
      ((i % 3) - 1) * 0.2,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  const garden = await Texture.fromImage(source);
  textures.push(garden);
  lifetime.signal.throwIfAborted();
  source.width = source.height = 40;
  const glow = source.getContext('2d')!;
  const light = glow.createRadialGradient(20, 20, 1, 20, 20, 20);
  light.addColorStop(0, '#ffffdd');
  light.addColorStop(0.18, '#fff48d');
  light.addColorStop(0.5, '#b1e86f77');
  light.addColorStop(1, '#b1e86f00');
  glow.fillStyle = light;
  glow.fillRect(0, 0, 40, 40);
  const firefly = await Texture.fromImage(source);
  textures.push(firefly);
  lifetime.signal.throwIfAborted();

  class Garden extends Scene {
    elapsed = 0;
    readonly flies: Sprite[] = [];
    constructor() {
      super();
      this.add(
        new Sprite({ texture: garden, position: [WIDTH / 2, HEIGHT / 2] }),
      );
      for (let i = 0; i < 28; i++) {
        this.flies.push(
          this.add(
            new Sprite({
              texture: firefly,
              scale: [0.5 + (i % 4) * 0.12, 0.5 + (i % 4) * 0.12],
            }),
          ),
        );
      }
      this.update(0);
    }
    override update(dt: number): void {
      this.elapsed += dt;
      for (let i = 0; i < this.flies.length; i++) {
        const phase = this.elapsed * (0.35 + (i % 5) * 0.07) + i * 2.39;
        this.flies[i]!.position.set(
          400 + Math.sin(phase) * (100 + (i % 6) * 41),
          245 + Math.cos(phase * 1.7 + i) * (35 + (i % 4) * 20),
        );
        this.flies[i]!.opacity = 0.45 + (0.55 * (1 + Math.sin(phase * 3))) / 2;
      }
    }
  }
  const scene = new Garden();
  candidate = scene;
  const heading = await Text2D.create('FIREFLY GARDEN', {
    fontSize: 26,
    color: '#eef8d9',
  });
  if (lifetime.signal.aborted) {
    heading.destroy();
    lifetime.signal.throwIfAborted();
  }
  heading.position.set(220, 58);
  scene.add(heading);
  const caption = await Text2D.create('28 lights · no physics · no tweens', {
    fontSize: 16,
    color: '#a6d8ce',
  });
  if (lifetime.signal.aborted) {
    caption.destroy();
    lifetime.signal.throwIfAborted();
  }
  caption.position.set(230, 93);
  scene.add(caption);
  await runtime.setScene(scene, { signal: lifetime.signal });
  runtime.start();
  const refresh = (): void => {
    const frame = runtime.graphics.stats;
    stats.textContent = `${runtime.graphics.backend} · ${runtime.state} · flight ${scene.elapsed.toFixed(2)} s · frame ${frame.frame} · 2D draws ${frame.drawCalls2D} · instances ${frame.instances2D} · passes ${frame.renderPasses2D} · upload ${frame.uploadBytes} B · CPU submit ${frame.cpuSubmitMs?.toFixed(2) ?? 'n/a'} ms`;
    // These read-only diagnostics do not invoke the lazy service getters.
    services.textContent = `Initialized: physics2D ${!!scene.initializedPhysics} · physics3D ${!!scene.initializedPhysics3D} · tweens ${!!scene.initializedTweens} · navigation ${!!scene.initializedNavigation}. Backend capabilities: 3D ${runtime.graphics.capabilities.threeD}, compute ${runtime.graphics.capabilities.compute} (not used).`;
    controls[0]!.disabled = runtime.state !== 'running';
    controls[1]!.disabled = runtime.state !== 'paused';
  };
  controls.forEach((button) => {
    button.disabled = false;
  });
  $<HTMLButtonElement>('pause').addEventListener('click', () => {
    runtime.pause();
    refresh();
    status.textContent = 'Paused: flight time and rendered frame remain fixed.';
  });
  $<HTMLButtonElement>('resume').addEventListener('click', () => {
    runtime.resume();
    refresh();
    status.textContent = 'Resumed flight.';
  });
  $<HTMLButtonElement>('reset').addEventListener('click', () => {
    scene.elapsed = 0;
    scene.update(0);
    runtime.resume();
    refresh();
    status.textContent = 'Flight reset to phase zero and resumed.';
  });
  $<HTMLButtonElement>('destroy').addEventListener('click', () => {
    try {
      release();
      refresh();
      controls.forEach((button) => {
        button.disabled = true;
      });
      status.textContent =
        'Destroyed Game and both owned textures. Reload to start again.';
    } catch (error) {
      reportError(error);
    }
  });
  refresh();
  monitor = setInterval(refresh, 250);
  status.textContent =
    'Ready. Canvas2D is the default; select another backend to compare real counters.';
} catch (error) {
  reportError(error);
  try {
    release();
  } catch (cleanupError) {
    status.textContent += ` · Cleanup: ${String(cleanupError)}`;
  }
}

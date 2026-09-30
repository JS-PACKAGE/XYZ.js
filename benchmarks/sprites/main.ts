import {
  Game,
  Scene,
  Sprite,
  type RendererPreference,
} from '../../src/index.js';

const settings = {
  count: 1000,
  warmup: 120,
  samples: 600,
  width: 1280,
  height: 720,
} as const;
const output = document.querySelector<HTMLPreElement>('#result')!;
let game: Game | undefined;
let frame = 0;
let handle = 0;
let previous = 0;
const intervals = new Float64Array(settings.samples);
const submissions = new Float64Array(settings.samples);

function stats(values: Float64Array) {
  const sorted = values.slice().sort();
  return {
    mean: values.reduce((sum, value) => sum + value, 0) / values.length,
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    max: sorted[sorted.length - 1],
  };
}

try {
  game = await Game.create({
    canvas: '#game',
    renderer: (new URLSearchParams(location.search).get('renderer') ??
      'webgpu') as RendererPreference,
    width: settings.width,
    height: settings.height,
    pixelRatio: 1,
    autoResize: false,
  });
  const runtime = game;
  const texture = await game.assets.loadTexture(
    new URL('../../examples/sprite/texture.png', import.meta.url).href,
  );
  const scene = new Scene();
  const sprites = Array.from(
    { length: settings.count },
    (_, index) =>
      new Sprite({
        texture,
        position: [(index % 40) * 32 + 16, Math.floor(index / 40) * 28 + 14],
        scale: [0.45, 0.45],
        opacity: 0.85,
      }),
  );
  for (const sprite of sprites) scene.add(sprite);
  await game.setScene(scene);
  output.textContent = 'Measuring…';
  const render = (time: number) => {
    if (document.hidden) {
      output.textContent = 'Aborted: tab became hidden. Reload while visible.';
      runtime.destroy();
      return;
    }
    const elapsed = previous ? time - previous : 0;
    previous = time;
    for (const sprite of sprites)
      sprite.position.x = (sprite.position.x + elapsed * 0.02) % settings.width;
    try {
      const start = performance.now();
      runtime.graphics.beginFrame();
      runtime.graphics.render(scene);
      runtime.graphics.endFrame();
      const submitted = performance.now() - start;
      if (frame >= settings.warmup) {
        intervals[frame - settings.warmup] = elapsed;
        submissions[frame - settings.warmup] = submitted;
      }
      frame++;
      if (frame < settings.warmup + settings.samples) {
        handle = requestAnimationFrame(render);
        return;
      }
      const raf = stats(intervals);
      output.textContent = JSON.stringify(
        {
          date: new Date().toISOString(),
          userAgent: navigator.userAgent,
          backend: runtime.graphics.backend,
          sprites: settings.count,
          warmupFrames: settings.warmup,
          measuredFrames: settings.samples,
          logicalSize: [runtime.width, runtime.height],
          backingSize: [runtime.canvas.width, runtime.canvas.height],
          pixelRatio: 1,
          fps: 1000 / raf.mean,
          frameIntervalMs: raf,
          cpuSubmitMs: stats(submissions),
          notes:
            'CPU submit excludes animation update and is not GPU completion time. No GPU/GC timing instrumentation. One shared texture, moving sprites, no per-frame resource creation requested by benchmark.',
        },
        null,
        2,
      );
      runtime.destroy();
    } catch (error) {
      output.textContent = String(error);
      runtime.destroy();
    }
  };
  handle = requestAnimationFrame(render);
  window.addEventListener('pagehide', () => {
    cancelAnimationFrame(handle);
    runtime.destroy();
  });
} catch (error) {
  game?.destroy();
  output.textContent = String(error);
}

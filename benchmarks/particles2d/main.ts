import {
  Game,
  ParticleEmitter,
  Scene,
  type RendererPreference,
} from '../../src/index.js';
import { measure, settings } from '../measurement.js';

const EMITTERS = 4;
const CAPACITY = 8192;
const output = document.querySelector<HTMLPreElement>('#result')!;
let game: Game | undefined;
try {
  game = await Game.create({
    canvas: '#game',
    renderer: (new URLSearchParams(location.search).get('renderer') ??
      'webgpu') as RendererPreference,
    width: settings.width,
    height: settings.height,
    pixelRatio: settings.pixelRatio,
    autoResize: false,
  });
  const runtime = game;
  const texture = await runtime.assets.loadTexture(
    new URL('../../examples/sprite/texture.png', import.meta.url).href,
  );
  const scene = new Scene();
  const emitters = Array.from({ length: EMITTERS }, (_, index) => {
    const emitter = scene.add(
      new ParticleEmitter({
        texture,
        capacity: CAPACITY,
        rate: CAPACITY / 1.5,
        lifetime: [1, 2],
        speed: [40, 160],
        angle: [-Math.PI, Math.PI],
        acceleration: [0, 60],
        startSize: [10, 10],
        endSize: [2, 2],
        startColor: [1, 0.8, 0.3, 0.8],
        endColor: [1, 0.2, 0.1, 0],
        space: 'world',
        seed: index + 1,
      }),
    );
    emitter.position.set(
      settings.width * (0.2 + index * 0.2),
      settings.height / 2,
    );
    emitter.start();
    return emitter;
  });
  await runtime.setScene(scene);
  output.textContent = 'Measuring…';
  const result = await measure(runtime, scene, {
    benchmark: 'particles2d',
    workload: { emitters: EMITTERS, capacityEach: CAPACITY },
    updateMetric: 'particleUpdateMs',
    update: () => {
      for (const emitter of emitters)
        emitter.updateSimulation(settings.simulationDelta);
    },
    finalMetrics: () => ({
      activeParticles: emitters.reduce((sum, e) => sum + e.activeCount, 0),
    }),
  });
  output.textContent = JSON.stringify(result, null, 2);
} catch (error) {
  output.textContent = String(error);
} finally {
  game?.destroy();
}

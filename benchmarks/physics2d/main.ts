import {
  Colliders,
  Game,
  RigidBody2D,
  Scene,
  Sprite,
  type RendererPreference,
} from '../../src/index.js';
import { measure, settings } from '../measurement.js';

const COUNT = 600;
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
  scene.physics.gravity.set(0, 600);
  const wall = (x: number, y: number, w: number, h: number): void => {
    const sprite = scene.add(
      new Sprite({ texture, position: [x, y], scale: [w / 64, h / 64] }),
    );
    sprite.opacity = 0.3;
    sprite.collider = Colliders.box(64, 64);
  };
  const { width, height } = settings;
  wall(width / 2, height + 20, width, 40);
  wall(-20, height / 2, 40, height * 2);
  wall(width + 20, height / 2, 40, height * 2);
  const radius = 12;
  const bodies: Sprite[] = [];
  for (let i = 0; i < COUNT; i++) {
    const sprite = scene.add(
      new Sprite({
        texture,
        position: [80 + (i % 50) * 24, 40 + Math.floor(i / 50) * 26],
        anchor: [0.5, 0.5],
        scale: [(radius * 2) / 64, (radius * 2) / 64],
      }),
    );
    sprite.collider = Colliders.circle(32);
    sprite.body = new RigidBody2D({ mass: 1, restitution: 0.2, friction: 0.3 });
    bodies.push(sprite);
  }
  await runtime.setScene(scene);
  output.textContent = 'Measuring…';
  const result = await measure(runtime, scene, {
    benchmark: 'physics2d',
    workload: { circles: COUNT, radius, gravity: 600 },
    updateMetric: 'physicsStepMs',
    update: () => scene.physics.update(settings.simulationDelta),
    finalMetrics: () => ({
      colliders: scene.physics.colliderCount,
      sleepingBodies: bodies.filter((b) => b.body?.isSleeping).length,
    }),
  });
  output.textContent = JSON.stringify(result, null, 2);
} catch (error) {
  output.textContent = String(error);
} finally {
  game?.destroy();
}

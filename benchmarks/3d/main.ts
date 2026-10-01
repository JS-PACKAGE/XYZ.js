import {
  Game,
  Geometry,
  Mesh,
  Scene,
  TextureMaterial,
  type RendererPreference,
} from '../../src/index.js';
import { measure, settings } from '../measurement.js';

const COUNT = 400;
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
  if (!runtime.graphics.capabilities.threeD)
    throw new Error('This backend has no 3D capability.');
  const texture = await runtime.assets.loadTexture(
    new URL('../../examples/sprite/texture.png', import.meta.url).href,
  );
  const geometry = Geometry.cube();
  const material = new TextureMaterial({ texture });
  const scene = new Scene();
  scene.camera3D.position.set(0, 0, 28);
  const meshes = Array.from({ length: COUNT }, (_, index) => {
    const mesh = scene.add(new Mesh({ geometry, material }));
    mesh.position.set(
      ((index % 20) - 9.5) * 1.6,
      (Math.floor(index / 20) - 9.5) * 1.3,
      -(index % 7) * 0.8,
    );
    mesh.scale.set(0.6, 0.6, 0.6);
    return mesh;
  });
  await runtime.setScene(scene);
  output.textContent = 'Measuring…';
  const result = await measure(runtime, scene, {
    benchmark: '3d',
    workload: { meshes: COUNT, sharedGeometry: true, sharedMaterial: true },
    updateMetric: 'animationUpdateMs',
    update: (frame) => {
      const angle = frame * settings.simulationDelta;
      for (let i = 0; i < meshes.length; i++)
        meshes[i]!.rotation.setFromEuler(angle * 0.7 + i, angle + i * 0.3, 0);
    },
  });
  output.textContent = JSON.stringify(result, null, 2);
} catch (error) {
  output.textContent = String(error);
} finally {
  game?.destroy();
}

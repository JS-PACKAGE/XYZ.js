import {
  PlanarReflectionCamera,
  type PlanarReflection,
} from '../../core/src/planar-reflection.js';
import type { Scene } from '../../core/src/scene.js';
import { GraphicsError } from './errors.js';

const activeScenes = new WeakSet<Scene>();
/** Encode synchronously: temporary camera/visibility state never survives an await. Backends own readback. */
export function encodePlanarReflection(
  scene: Scene,
  reflection: PlanarReflection,
  encode: (camera: PlanarReflectionCamera) => void,
): void {
  if (scene.destroyed || reflection.destroyed)
    throw new GraphicsError(
      'Cannot capture a destroyed scene or planar reflection.',
    );
  if (activeScenes.has(scene))
    throw new GraphicsError('Recursive scene reflection capture.');
  const original = scene.camera3D;
  const camera = new PlanarReflectionCamera(original, reflection);
  const settings = scene.postProcessing;
  const enabled = settings.enabled,
    taa = settings.taa,
    ssr = settings.ssr;
  const graph = scene.renderGraph;
  const probes = scene.reflectionProbes.map(
    (probe) => [probe, probe.enabled] as const,
  );
  const excluded = reflection.exclude.map(
    (object) => [object, object.visible] as const,
  );
  activeScenes.add(scene);
  try {
    scene.camera3D = camera;
    settings.enabled = settings.taa = settings.ssr = false;
    scene.renderGraph = undefined;
    for (const [probe] of probes) probe.enabled = false;
    for (const [object] of excluded) object.visible = false;
    camera.updateMatrix(1);
    encode(camera);
  } finally {
    scene.camera3D = original;
    settings.enabled = enabled;
    settings.taa = taa;
    settings.ssr = ssr;
    scene.renderGraph = graph;
    for (const [probe, value] of probes) probe.enabled = value;
    for (const [object, value] of excluded) object.visible = value;
    activeScenes.delete(scene);
  }
}

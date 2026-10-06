import {
  createRenderer,
  type Renderer,
  type RendererPreference,
} from '../../src/index.js';
import { errorDetail, frameProofs } from './frame-proof.js';
import {
  createMaterialReferenceScenes,
  type MaterialReferenceScenes,
} from './material-reference-scenes.js';

export interface MaterialReferenceReport {
  renderer: RendererPreference;
  scenarios: {
    name: string;
    width: number;
    height: number;
    pixels: number[];
    repeat: number[];
    png: string;
  }[];
  error?: string;
}

/** Capture the actual native renderer twice, with no clock-driven scene state. */
export async function renderMaterialReferences(
  canvas: HTMLCanvasElement,
  preference: RendererPreference,
  perturb = false,
): Promise<MaterialReferenceReport> {
  const report: MaterialReferenceReport = {
    renderer: preference,
    scenarios: [],
  };
  let renderer: Renderer | undefined;
  let references: MaterialReferenceScenes | undefined;
  let runtimeError: Error | undefined;
  try {
    try {
      if (preference !== 'webgl2' && preference !== 'webgpu')
        throw new Error('Material references require a forced native backend.');
      canvas.width = canvas.height = 128;
      renderer = await createRenderer(
        canvas,
        preference,
        (error) => {
          runtimeError = error;
        },
        { antialias: false, recover: false },
      );
      if (renderer.backend !== preference)
        throw new Error('Forced material reference backend changed.');
      renderer.resize(128, 128);
      if (runtimeError) throw runtimeError;
      const native = renderer;
      const proofs = frameProofs(native, canvas);
      references = await createMaterialReferenceScenes(perturb);
      for (const { name, scene, meshes } of references.scenarios) {
        for (const mesh of meshes) {
          await native.prepareGeometry(mesh.geometry);
        }
        const draw = async () => {
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve()),
          );
          if (runtimeError) throw runtimeError;
          const proof = proofs.next();
          // Attach immediately so a synchronous submission failure cannot leave
          // frameProofs' rejected capture promise unobserved.
          void proof.catch(() => {});
          native.beginFrame();
          native.render(scene, 128, 128);
          native.endFrame();
          const frame = await proof;
          if (runtimeError) throw runtimeError;
          if (proofs.graphicsEvents.length)
            throw new Error(proofs.graphicsEvents.join('\n'));
          if (
            frame.width !== 128 ||
            frame.height !== 128 ||
            frame.stats.drawCalls === 0
          )
            throw new Error(`Invalid material reference frame: ${name}.`);
          return frame;
        };
        // Warm material/environment uploads before either measured frame.
        await draw();
        await draw();
        const first = await draw();
        const repeat = await draw();
        report.scenarios.push({
          name,
          width: first.width,
          height: first.height,
          pixels: Array.from(first.bytes),
          repeat: Array.from(repeat.bytes),
          png: first.png,
        });
      }
    } finally {
      try {
        renderer?.destroy();
      } finally {
        references?.destroy();
      }
    }
  } catch (error) {
    report.error = errorDetail(error);
  }
  return report;
}

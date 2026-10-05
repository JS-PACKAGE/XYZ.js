import {
  ComputeBuffer,
  ComputeProgram,
} from '../../packages/graphics/src/compute.js';
import type { Renderer } from '../../packages/graphics/src/index.js';
import { UnsupportedGraphicsError } from '../../packages/graphics/src/errors.js';

/** Two GPU programs share an engine-owned output buffer; the second consumes the first's results. */
export async function runComputeScenario(
  renderer: Renderer,
  signal?: AbortSignal,
): Promise<number[]> {
  if (
    renderer.backend !== 'webgpu' ||
    !renderer.prepareCompute ||
    !renderer.uploadCompute ||
    !renderer.dispatchCompute ||
    !renderer.readCompute
  )
    throw new UnsupportedGraphicsError(
      'GPU compute requires the WebGPU renderer; WebGL2 and Canvas2D do not emulate it.',
    );
  const input = new ComputeBuffer({ type: 'f32', length: 128 }),
    intermediate = new ComputeBuffer({ type: 'f32', length: 128 }),
    output = new ComputeBuffer({ type: 'f32', length: 128 });
  const bindings = [
    { type: 'f32' as const, access: 'read' as const },
    { type: 'f32' as const, access: 'read-write' as const },
  ];
  const double = new ComputeProgram({
    bindings,
    wgsl: 'fn compute(i:vec3u) { if(i.x < arrayLength(&buffer1)) { buffer1[i.x] = buffer0[i.x] * 2.0; } }',
  });
  const add = new ComputeProgram({
    bindings,
    wgsl: 'fn compute(i:vec3u) { if(i.x < arrayLength(&buffer1)) { buffer1[i.x] = buffer0[i.x] + 3.0; } }',
  });
  try {
    await Promise.all([
      renderer.prepareCompute(double, { signal }),
      renderer.prepareCompute(add, { signal }),
    ]);
    renderer.uploadCompute(
      input,
      Float32Array.from({ length: 128 }, (_, index) => index / 4),
    );
    await renderer.dispatchCompute(double, {
      bindings: [input, intermediate],
      workgroups: [2],
      signal,
    });
    await renderer.dispatchCompute(add, {
      bindings: [intermediate, output],
      workgroups: [2],
      signal,
    });
    return Array.from(await renderer.readCompute(output, { signal }));
  } finally {
    double.destroy();
    add.destroy();
    input.destroy();
    intermediate.destroy();
    output.destroy();
  }
}

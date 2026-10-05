import { describe, expect, it } from 'vitest';
import {
  ComputeBuffer,
  ComputeProgram,
  gpuOperation,
} from '../packages/graphics/src/compute.js';
import { RenderGraph } from '../packages/graphics/src/render-graph.js';
import { PostProcessor2D } from '../packages/core/src/materials2d/material2d.js';

const identity = (): PostProcessor2D =>
  new PostProcessor2D({
    wgsl: 'fn effect(c:vec4f,u:vec2f,s:vec2f)->vec4f{return c;}',
    glsl: 'vec4 effect(vec4 c,vec2 u,vec2 s){return c;}',
  });

describe('bounded compute consumer contracts', () => {
  it('validates uploads without touching previously accepted payloads and rejects scalar/range mismatches', () => {
    const buffer = new ComputeBuffer({ type: 'f32', length: 4 });
    buffer.validateUpload(new Float32Array([2, 3]), 2);
    expect(() => buffer.validateUpload(new Uint32Array([1]))).toThrow(
      TypeError,
    );
    expect(() => buffer.validateUpload(new Float32Array([Infinity]))).toThrow(
      RangeError,
    );
    expect(() => buffer.validateUpload(new Float32Array([1, 2]), 3)).toThrow(
      RangeError,
    );
    expect(() => buffer.range(2, 3)).toThrow(RangeError);
    buffer.destroy();
    expect(() => buffer.validateUpload(new Float32Array([1]))).toThrow();
  });
  it('permits output reuse by dependent programs while rejecting writable aliasing and oversized dispatch', () => {
    const program = new ComputeProgram({
      wgsl: 'fn compute(i:vec3u){buffer1[i.x]=buffer0[i.x]*2.0;}',
      bindings: [
        { type: 'f32', access: 'read' },
        { type: 'f32', access: 'read-write' },
      ],
    });
    const a = new ComputeBuffer({ type: 'f32', length: 64 }),
      b = new ComputeBuffer({ type: 'f32', length: 64 });
    expect(
      program.validateDispatch({ bindings: [a, b], workgroups: [1] }),
    ).toEqual([1, 1, 1]);
    expect(
      program.validateDispatch({ bindings: [b, a], workgroups: [2, 3] }),
    ).toEqual([2, 3, 1]);
    expect(() =>
      program.validateDispatch({ bindings: [a, a], workgroups: [1] }),
    ).toThrow(/alias/);
    expect(() =>
      program.validateDispatch({ bindings: [a, b], workgroups: [65536] }),
    ).toThrow(RangeError);
    expect(
      () =>
        new ComputeProgram({
          wgsl: program.wgsl,
          bindings: program.bindings,
          workgroupSize: [32, 32],
        }),
    ).toThrow(RangeError);
  });
  it('rejects pending caller waits promptly on abort or descriptor teardown', async () => {
    const never = new Promise<number>(() => {}),
      controller = new AbortController();
    const aborted = gpuOperation(never, controller.signal);
    controller.abort(new Error('caller cancelled'));
    await expect(aborted).rejects.toThrow('caller cancelled');
    const buffer = new ComputeBuffer({ type: 'u32', length: 1 });
    const released = gpuOperation(never, undefined, [buffer]);
    buffer.destroy();
    await expect(released).rejects.toThrow(/destroyed/);
    await expect(
      gpuOperation(Promise.resolve(7), undefined, [buffer]),
    ).rejects.toThrow(/destroyed/);
  });
});

describe('declarative attachment DAG consumer contracts', () => {
  it('schedules a reversed authored diamond and resolves mixed fixed/scaled outputs', () => {
    const effect = identity();
    const graph = new RenderGraph({
      targets: [
        { name: 'left', scale: 0.5 },
        { name: 'right', width: 8, height: 4 },
        { name: 'merged', format: 'rgba16float' },
      ],
      passes: [
        { name: 'merge', inputs: ['left', 'right'], output: 'merged', effect },
        { name: 'rightPass', inputs: ['$scene'], output: 'right', effect },
        { name: 'leftPass', inputs: ['$scene'], output: 'left', effect },
      ],
      output: 'merged',
    });
    expect(graph.schedule.map((pass) => pass.name)).toEqual([
      'leftPass',
      'rightPass',
      'merge',
    ]);
    expect(
      graph
        .resolutions(100, 60)
        .map((resolution) => [resolution.width, resolution.height]),
    ).toEqual([
      [50, 30],
      [8, 4],
      [100, 60],
    ]);
    graph.destroy();
    expect(effect.destroyed).toBe(false);
    expect(() => graph.resolutions(10, 10)).toThrow(/destroyed/);
  });
  it('rejects cycles, undefined reads, feedback and duplicate writers before native allocation', () => {
    const effect = identity(),
      targets = [{ name: 'a' }, { name: 'b' }];
    expect(
      () =>
        new RenderGraph({
          targets,
          passes: [
            { name: 'first', inputs: ['b'], output: 'a', effect },
            { name: 'second', inputs: ['a'], output: 'b', effect },
          ],
          output: 'b',
        }),
    ).toThrow(/cycle/);
    expect(
      () =>
        new RenderGraph({
          targets: [targets[0]],
          passes: [{ name: 'first', inputs: ['absent'], output: 'a', effect }],
          output: 'a',
        }),
    ).toThrow(/reads/);
    expect(
      () =>
        new RenderGraph({
          targets: [targets[0]],
          passes: [{ name: 'first', inputs: ['a'], output: 'a', effect }],
          output: 'a',
        }),
    ).toThrow(/alias/);
    expect(
      () =>
        new RenderGraph({
          targets: [targets[0]],
          passes: [
            { name: 'first', inputs: ['$scene'], output: 'a', effect },
            { name: 'second', inputs: ['$scene'], output: 'a', effect },
          ],
          output: 'a',
        }),
    ).toThrow(/writer/);
  });
  it('validates borrowed uniform changes and aggregate resource budget transactionally', () => {
    const effect = identity(),
      graph = new RenderGraph({
        targets: [{ name: 'large', format: 'rgba16float' }],
        passes: [{ name: 'draw', inputs: ['$scene'], output: 'large', effect }],
        output: 'large',
      });
    expect(() => graph.resolutions(8192, 8192)).toThrow(/budget/);
    expect(graph.resolutions(32, 16)[0].width).toBe(32);
    effect.uniforms[0] = Infinity;
    expect(() => graph.validate()).toThrow(/finite/);
    effect.uniforms[0] = 1;
    effect.destroy();
    expect(() => graph.validate()).toThrow(/destroyed/);
  });
});

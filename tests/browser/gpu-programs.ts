import {
  createRenderer,
  Scene,
  Geometry,
  Mesh,
  Texture,
  TextureMaterial,
  Sprite,
  OrthographicCamera,
  Vector3,
  type Renderer,
  type RendererPreference,
  type FrameEffects,
} from '../../src/index.js';
import {
  ComputeBuffer,
  ComputeProgram,
} from '../../packages/graphics/src/compute.js';
import { PostProcessor2D } from '../../packages/core/src/materials2d/material2d.js';
import { RenderGraph } from '../../packages/graphics/src/render-graph.js';
import { createChannelGraph } from '../../examples/render-graph/graph.js';
import { runComputeScenario } from '../../examples/gpu-compute/scenario.js';
import { frameProofs, errorDetail, type FrameProof } from './frame-proof.js';

const preference = (new URLSearchParams(location.search).get('renderer') ??
  'webgpu') as RendererPreference;
const canvas = document.querySelector<HTMLCanvasElement>('#game')!,
  output = document.querySelector<HTMLPreElement>('#report')!;
const report = {
  renderer: preference as string,
  assertions: [] as string[],
  error: undefined as string | undefined,
};
let renderer: Renderer | undefined;
let intentionalLoss = false;
function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
  report.assertions.push(message);
}
async function rejected(
  operation: () => unknown | Promise<unknown>,
  message: string,
): Promise<void> {
  let failed = false;
  try {
    await operation();
  } catch {
    failed = true;
  }
  check(failed, message);
}
async function run(): Promise<typeof report> {
  output.dataset.state = 'running';
  const channels = createChannelGraph();
  let texture: Texture | undefined;
  try {
    canvas.width = 128;
    canvas.height = 96;
    renderer = await createRenderer(
      canvas,
      preference,
      (error) => {
        if (!intentionalLoss) report.error = errorDetail(error);
      },
      { recover: false },
    );
    const native = renderer,
      proofs = frameProofs(native, canvas);
    if (native.backend === 'webgpu') {
      const values = await runComputeScenario(native);
      check(
        values.length === 128 &&
          values.every((value, index) => value === index / 2 + 3),
        'Two real GPU dispatches consume shared outputs and read back the arithmetic oracle.',
      );
      for (const type of ['u32', 'i32'] as const) {
        const buffer = new ComputeBuffer({ type, length: 4 });
        const program = new ComputeProgram({
          bindings: [{ type, access: 'read-write' }],
          workgroupSize: [4],
          wgsl: `fn compute(i:vec3u){ if(i.x<arrayLength(&buffer0)){buffer0[i.x]=buffer0[i.x]+${type === 'i32' ? '2i' : '2u'};} }`,
        });
        try {
          native.uploadCompute!(
            buffer,
            type === 'i32'
              ? new Int32Array([-5, -1, 0, 7])
              : new Uint32Array([0, 1, 4, 7]),
          );
          await native.dispatchCompute!(program, {
            bindings: [buffer],
            workgroups: [1],
          });
          const result = await native.readCompute!(buffer, {
            offset: 1,
            count: 2,
          });
          check(
            result[0] === (type === 'i32' ? 1 : 3) &&
              result[1] === (type === 'i32' ? 2 : 6),
            `${type} native storage and partial typed readback preserve signedness.`,
          );
          const controller = new AbortController();
          controller.abort();
          await rejected(
            () => native.readCompute!(buffer, { signal: controller.signal }),
            'Pre-aborted readback rejects.',
          );
        } finally {
          buffer.destroy();
          program.destroy();
        }
      }
      const invalid = new ComputeProgram({
        bindings: [{ type: 'f32', access: 'read' }],
        wgsl: 'fn compute(i:vec3u) { this is not WGSL; }',
      });
      try {
        await rejected(
          () => native.prepareCompute!(invalid),
          'Native compute compilation errors reject preparation.',
        );
      } finally {
        invalid.destroy();
      }
    } else {
      await rejected(
        () => runComputeScenario(native),
        'Non-WebGPU compute is explicitly unsupported, with no emulation.',
      );
      check(
        !native.capabilities.compute,
        'Unsupported backend reports compute capability false.',
      );
    }
    if (native.backend === 'canvas2d') {
      await rejected(
        () =>
          native.prepareRenderGraph
            ? native.prepareRenderGraph(channels.graph)
            : Promise.reject(new Error('Unsupported')),
        'Canvas2D native graph preparation is unsupported.',
      );
      return report;
    }
    const image = new OffscreenCanvas(8, 8),
      context = image.getContext('2d')!;
    context.fillStyle = '#d7b7f7';
    context.fillRect(0, 0, 8, 8);
    texture = await Texture.fromImage(image);
    const scene = new Scene(),
      camera = new OrthographicCamera();
    camera.height = 4;
    camera.position.set(0, 0, 6);
    camera.lookAt(new Vector3());
    scene.camera3D = camera;
    scene.add(
      new Mesh({
        geometry: Geometry.sphere(1, 24, 16),
        material: new TextureMaterial({ texture }),
      }),
    );
    scene.add(new Sprite({ texture, position: [8, 8], scale: [3, 3] }));
    async function draw(effects?: FrameEffects): Promise<FrameProof> {
      const pending = proofs.next();
      native.beginFrame();
      native.render(scene, canvas.width, canvas.height, effects);
      native.endFrame();
      return pending;
    }
    const baseline = await draw();
    check(
      native.stats.drawCalls > 0,
      'Real 3D scene mesh is rendered before graph input sampling.',
    );
    await native.prepareRenderGraph!(channels.graph);
    scene.renderGraph = channels.graph;
    const graphed = await draw();
    let mismatch = 0,
      sourcePixels = 0;
    for (let index = 0; index < graphed.bytes.length; index += 4) {
      if (
        Math.abs(graphed.bytes[index] - baseline.bytes[index]) > 3 ||
        graphed.bytes[index + 1] > 3 ||
        Math.abs(graphed.bytes[index + 2] - baseline.bytes[index + 2]) > 3
      )
        mismatch++;
      if (baseline.bytes[index] > 100 && baseline.bytes[index + 2] > 100)
        sourcePixels++;
    }
    check(
      sourcePixels > 100 && mismatch < canvas.width * canvas.height * 0.01,
      'Reversed diamond scheduling merges red/blue attachments to the real scene + HUD pixel oracle.',
    );
    channels.merge.setUniforms([0]);
    const redOnly = await draw();
    check(
      redOnly.bytes
        .filter((_, index) => index % 4 === 2)
        .every((value) => value <= 3),
      'Native mutable pass uniforms update the multi-input output.',
    );
    const transitioned = await draw({
      transition: {
        kind: 'fade',
        progress: 0.5,
        color: [0, 1, 0, 1],
        direction: 'left',
      },
    });
    check(
      transitioned.bytes
        .filter((_, index) => index % 4 === 1)
        .every((value) => value >= 250),
      'P19 transitions run after the graph and are not filtered by graph shaders.',
    );
    const snapshot = await native.captureScene(
      scene,
      canvas.width,
      canvas.height,
    );
    try {
      scene.renderGraph = undefined;
      const restored = await draw({
        transition: {
          kind: 'crossfade',
          progress: 0,
          snapshot,
          color: [0, 0, 0, 1],
          direction: 'left',
        },
      });
      check(
        restored.bytes.every(
          (value, index) => Math.abs(value - redOnly.bytes[index]) <= 3,
        ),
        'Full-scene capture contains graph output, including actual 3D and HUD.',
      );
    } finally {
      snapshot.destroy();
    }
    native.resize(64, 48);
    scene.renderGraph = channels.graph;
    const resized = await draw();
    check(
      resized.width === canvas.width && resized.height === canvas.height,
      'Graph resolves native targets after backend resize.',
    );
    const malformed = new PostProcessor2D({
      wgsl: 'not WGSL',
      glsl: 'not GLSL',
    });
    const broken = new RenderGraph({
      targets: [{ name: 'output' }],
      passes: [
        {
          name: 'broken',
          inputs: ['$scene'],
          output: 'output',
          effect: malformed,
        },
      ],
      output: 'output',
    });
    try {
      await rejected(
        () => native.prepareRenderGraph!(broken),
        'Native graph shader compilation errors reject preparation.',
      );
    } finally {
      broken.destroy();
      malformed.destroy();
    }
    scene.renderGraph = undefined;
    scene.destroy();
    check(!report.error, 'No renderer errors during valid native operations.');
    if (native.backend === 'webgpu') {
      const released = new ComputeBuffer({ type: 'u32', length: 4 });
      native.uploadCompute!(released, new Uint32Array([1, 2, 3, 4]));
      const waiting = native.readCompute!(released);
      released.destroy();
      await rejected(
        () => waiting,
        'Destroying an engine-owned buffer rejects pending native readback.',
      );
      const lostBuffer = new ComputeBuffer({ type: 'u32', length: 4 });
      native.uploadCompute!(lostBuffer, new Uint32Array([5, 6, 7, 8]));
      type DeviceHost = Renderer & { device?: GPUDevice; current?: Renderer };
      let host: DeviceHost | undefined = native as DeviceHost;
      while (host && !host.device)
        host = host.current as DeviceHost | undefined;
      if (!host?.device)
        throw new Error(
          'Fixture cannot reach the actual GPU device for loss injection.',
        );
      const pending = native.readCompute!(lostBuffer);
      intentionalLoss = true;
      host.device.destroy();
      try {
        await rejected(
          () => pending,
          'Actual device destruction rejects pending compute readback.',
        );
        await rejected(
          () => native.prepareRenderGraph!(channels.graph),
          'Graph preparation rejects after actual device loss.',
        );
      } finally {
        lostBuffer.destroy();
      }
    }
    return report;
  } catch (error) {
    report.error = errorDetail(error);
    return report;
  } finally {
    renderer?.destroy();
    channels.destroy();
    texture?.destroy();
    output.textContent = JSON.stringify(report, null, 2);
    output.dataset.state = report.error ? 'failed' : 'passed';
  }
}
declare global {
  interface Window {
    __xyzGpuPrograms: { run(): Promise<typeof report>; report: typeof report };
  }
}
window.__xyzGpuPrograms = { run, report };
void run();

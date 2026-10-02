import type { Matrix4 } from '../../math/src/index.js';
import type { Mesh } from '../../core/src/mesh.js';
import type {
  OcclusionCandidate,
  OcclusionProofSource,
} from '../../core/src/render-visibility.js';
import { visibilityLimits } from '../../../src/data/visibility.js';
import {
  occlusionProxyIndices,
  occlusionProxyVertices,
} from './occlusion-proxy.js';
import { beginTimedRenderPass } from './gpu-timing.js';

const source = `
struct Proxy { viewProjection: mat4x4<f32>, minimum: vec4<f32>, maximum: vec4<f32> };
@group(0) @binding(0) var<uniform> proxy: Proxy;
@vertex fn vertex(@location(0) position: vec3<f32>) -> @builtin(position) vec4<f32> {
  return proxy.viewProjection * vec4<f32>(mix(proxy.minimum.xyz, proxy.maximum.xyz, position), 1.0);
}`;

interface QueryRecord {
  mesh: Mesh | undefined;
  epoch: number;
}
interface QueryFrame {
  query: GPUQuerySet;
  resolve: GPUBuffer;
  readback: GPUBuffer;
  uniforms: GPUBuffer;
  group: GPUBindGroup;
  data: Float32Array;
  records: QueryRecord[];
  count: number;
  state: 'idle' | 'encoded' | 'mapping';
  generation: number;
}

/** Native depth proof, never a CPU bounding-overlap approximation. */
export class WebGPUOcclusionBackend implements OcclusionProofSource {
  private readonly frames: QueryFrame[] = [];
  private readonly results = new Map<
    Mesh,
    { epoch: number; visible: boolean }
  >();
  private readonly activeMeshes = new Set<Mesh>();
  private readonly pipelines = new Map<string, GPURenderPipeline>();
  private readonly layout: GPUBindGroupLayout;
  private readonly pipelineLayout: GPUPipelineLayout;
  private readonly shader: GPUShaderModule;
  private readonly vertex: GPUBuffer;
  private readonly index: GPUBuffer;
  private destroyed = false;
  private generation = 0;
  /** Readback failure disables optional culling and leaves all objects visible. */
  failure: unknown = undefined;

  constructor(private readonly device: GPUDevice) {
    this.layout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: 'uniform',
            hasDynamicOffset: true,
            minBindingSize: 96,
          },
        },
      ],
    });
    this.pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [this.layout],
    });
    this.shader = device.createShaderModule({ code: source });
    this.vertex = device.createBuffer({
      size: occlusionProxyVertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.index = device.createBuffer({
      size: occlusionProxyIndices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.vertex, 0, occlusionProxyVertices);
    device.queue.writeBuffer(this.index, 0, occlusionProxyIndices);
    for (let i = 0; i < visibilityLimits.occlusionFramesInFlight; i++) {
      const uniforms = device.createBuffer({
        size: visibilityLimits.occlusionQueries * 256,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      this.frames.push({
        query: device.createQuerySet({
          type: 'occlusion',
          count: visibilityLimits.occlusionQueries,
        }),
        resolve: device.createBuffer({
          size: visibilityLimits.occlusionQueries * 8,
          usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
        }),
        readback: device.createBuffer({
          size: visibilityLimits.occlusionQueries * 8,
          usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
        }),
        uniforms,
        group: device.createBindGroup({
          layout: this.layout,
          entries: [{ binding: 0, resource: { buffer: uniforms, size: 96 } }],
        }),
        data: new Float32Array(visibilityLimits.occlusionQueries * 64),
        records: Array.from(
          { length: visibilityLimits.occlusionQueries },
          () => ({ mesh: undefined, epoch: 0 }),
        ),
        count: 0,
        state: 'idle',
        generation: 0,
      });
    }
  }

  visible(mesh: Mesh, epoch: number): boolean {
    if (this.destroyed || this.failure !== undefined) return true;
    const proof = this.results.get(mesh);
    return !proof || proof.epoch !== epoch || proof.visible;
  }

  /**
   * Encode AFTER opaque depth, before its attachment is discarded. No color/depth writes.
   * Call afterSubmit immediately AFTER queue.submit; otherwise no readback is scheduled.
   */
  encode(
    encoder: GPUCommandEncoder,
    depth: GPUTextureView,
    matrix: Matrix4,
    candidates: readonly OcclusionCandidate[],
    width: number,
    height: number,
    sampleCount = 1,
    depthFormat: GPUTextureFormat = 'depth24plus',
  ): void {
    if (this.destroyed || this.failure !== undefined) return;
    this.activeMeshes.clear();
    for (const candidate of candidates) this.activeMeshes.add(candidate.mesh);
    for (const mesh of this.results.keys())
      if (!this.activeMeshes.has(mesh) || mesh.destroyed)
        this.results.delete(mesh);
    if (!candidates.length) return;
    const frame = this.frames.find((entry) => entry.state === 'idle');
    if (!frame) return;
    const key = `${depthFormat}:${sampleCount}`;
    let pipeline = this.pipelines.get(key);
    if (!pipeline) {
      pipeline = this.device.createRenderPipeline({
        layout: this.pipelineLayout,
        vertex: {
          module: this.shader,
          entryPoint: 'vertex',
          buffers: [
            {
              arrayStride: 12,
              attributes: [
                { shaderLocation: 0, offset: 0, format: 'float32x3' },
              ],
            },
          ],
        },
        primitive: { topology: 'triangle-list', cullMode: 'none' },
        depthStencil: {
          format: depthFormat,
          depthWriteEnabled: false,
          depthCompare: 'less-equal',
        },
        multisample: { count: sampleCount },
      });
      this.pipelines.set(key, pipeline);
    }
    frame.count = Math.min(
      candidates.length,
      visibilityLimits.occlusionQueries,
    );
    const data = frame.data,
      m = matrix.elements;
    for (let i = 0; i < frame.count; i++) {
      const candidate = candidates[i]!,
        offset = i * 64,
        record = frame.records[i]!;
      for (let j = 0; j < 16; j++) data[offset + j] = m[j]!;
      data[offset + 16] = candidate.minX;
      data[offset + 17] = candidate.minY;
      data[offset + 18] = candidate.minZ;
      data[offset + 20] = candidate.maxX;
      data[offset + 21] = candidate.maxY;
      data[offset + 22] = candidate.maxZ;
      record.mesh = candidate.mesh;
      record.epoch = candidate.epoch;
    }
    this.device.queue.writeBuffer(
      frame.uniforms,
      0,
      data.buffer,
      0,
      frame.count * 256,
    );
    const pass = beginTimedRenderPass(encoder, {
      colorAttachments: [],
      occlusionQuerySet: frame.query,
      depthStencilAttachment: { view: depth, depthReadOnly: true },
    });
    try {
      pass.setViewport(0, 0, width, height, 0, 1);
      pass.setPipeline(pipeline);
      pass.setVertexBuffer(0, this.vertex);
      pass.setIndexBuffer(this.index, 'uint16');
      for (let i = 0; i < frame.count; i++) {
        pass.setBindGroup(0, frame.group, [i * 256]);
        pass.beginOcclusionQuery(i);
        pass.drawIndexed(occlusionProxyIndices.length);
        pass.endOcclusionQuery();
      }
    } finally {
      pass.end();
    }
    encoder.resolveQuerySet(frame.query, 0, frame.count, frame.resolve, 0);
    encoder.copyBufferToBuffer(
      frame.resolve,
      0,
      frame.readback,
      0,
      frame.count * 8,
    );
    frame.state = 'encoded';
    frame.generation = this.generation;
  }

  afterSubmit(): void {
    if (this.destroyed || this.failure !== undefined) return;
    for (const frame of this.frames) {
      if (frame.state !== 'encoded') continue;
      frame.state = 'mapping';
      void frame.readback
        .mapAsync(GPUMapMode.READ, 0, frame.count * 8)
        .then(() => {
          if (this.destroyed) return;
          const samples = new BigUint64Array(
            frame.readback.getMappedRange(0, frame.count * 8),
          );
          for (let i = 0; i < frame.count; i++) {
            const record = frame.records[i]!,
              mesh = record.mesh;
            if (
              mesh &&
              !mesh.destroyed &&
              frame.generation === this.generation
            ) {
              const previous = this.results.get(mesh);
              if (!previous)
                this.results.set(mesh, {
                  epoch: record.epoch,
                  visible: samples[i] !== 0n,
                });
              else if (previous.epoch <= record.epoch) {
                previous.epoch = record.epoch;
                previous.visible = samples[i] !== 0n;
              }
            }
            record.mesh = undefined;
          }
          frame.readback.unmap();
          frame.state = 'idle';
        })
        .catch((error: unknown) => {
          if (!this.destroyed) {
            this.failure = error;
            this.results.clear();
            frame.state = 'idle';
          }
        });
    }
  }

  clear(): void {
    ++this.generation;
    this.results.clear();
    this.activeMeshes.clear();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.clear();
    this.pipelines.clear();
    this.vertex.destroy();
    this.index.destroy();
    for (const frame of this.frames) {
      frame.query.destroy();
      frame.resolve.destroy();
      frame.readback.destroy();
      frame.uniforms.destroy();
      for (const record of frame.records) record.mesh = undefined;
    }
    this.frames.length = 0;
  }
}

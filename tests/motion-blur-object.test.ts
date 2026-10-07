import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import {
  Geometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MotionBlurSettings,
  MorphTargets,
  MorphWeights,
  PostEffectsSettings,
  PostProcessingSettings,
  Texture,
  TextureMaterial,
  Vector3,
  setPostEffects,
} from '../src/index.js';
import {
  ObjectMotionHistory,
  type ObjectMotionDraw,
} from '../packages/graphics/src/object-motion.js';
import { TemporalPostState } from '../packages/graphics/src/temporal-post.js';
import { writeMotionBlurUniforms } from '../packages/graphics/src/motion-blur-post.js';
import { WebGPUObjectMotion } from '../packages/graphics/src/webgpu-object-motion.js';
import { WebGLObjectMotion } from '../packages/graphics/src/webgl-object-motion.js';
import { FrameStats } from '../packages/graphics/src/render-stats.js';

function fixture(count?: number) {
  const geometry = Geometry.cube();
  const material = new TextureMaterial({
    texture: new Texture({ kind: 'native', width: 1, height: 1 }),
  });
  const mesh = count
    ? new InstancedMesh({ geometry, material, count })
    : new Mesh({ geometry, material });
  mesh.updateWorldMatrix();
  const state = new TemporalPostState();
  state.width = 100;
  state.height = 80;
  state.reprojectionValid = true;
  return { mesh, state, history: new ObjectMotionHistory() };
}

function velocity(
  draw: ObjectMotionDraw,
  point = new Vector3(),
): [number, number] {
  const current = new Matrix4(),
    previous = new Matrix4();
  current.elements.set(draw.data.subarray(0, 16));
  previous.elements.set(draw.data.subarray(16, 32));
  const now = current.transformPoint(point),
    old = previous.transformPoint(point);
  return [(now.x - old.x) * 0.5, (now.y - old.y) * 0.5];
}

afterEach(() => vi.unstubAllGlobals());

describe('additive per-object motion blur', () => {
  it('preserves camera-only defaults and existing bounded parameters', () => {
    const blur = new MotionBlurSettings();
    expect(blur.perObject).toBe(false);
    expect([blur.enabled, blur.strength, blur.samples, blur.maxRadius]).toEqual(
      [true, 1, 12, 32],
    );
    expect(new MotionBlurSettings({ perObject: true }).perObject).toBe(true);
  });
  it('rejects nonboolean object settings both initially and after mutation', () => {
    expect(
      () => new MotionBlurSettings({ perObject: 1 as unknown as boolean }),
    ).toThrow(TypeError);
    const blur = new MotionBlurSettings({ perObject: true });
    const effects = new PostEffectsSettings({ motionBlur: blur });
    blur.perObject = 'true' as unknown as boolean;
    expect(() => effects.validate()).toThrow(TypeError);
    expect(
      () => new MotionBlurSettings({ perObject: true, samples: 33 }),
    ).toThrow(RangeError);
  });
  it('produces motion under a stationary camera and preserves fast movement before gather clamping', () => {
    const f = fixture();
    expect(f.history.build([f.mesh], f.state)).toHaveLength(0);
    f.mesh.position.x = 12;
    f.mesh.position.y = -4;
    f.mesh.updateWorldMatrix();
    expect(velocity(f.history.build([f.mesh], f.state)[0]!)).toEqual([6, -2]);
  });
  it('reverses velocity on the next frame rather than comparing against an initial pose', () => {
    const f = fixture();
    f.history.build([f.mesh], f.state);
    f.mesh.position.x = 2;
    f.mesh.updateWorldMatrix();
    expect(velocity(f.history.build([f.mesh], f.state)[0]!)[0]).toBe(1);
    f.mesh.position.x = -1;
    f.mesh.updateWorldMatrix();
    expect(velocity(f.history.build([f.mesh], f.state)[0]!)[0]).toBe(-1.5);
  });
  it('tracks rotation at the surface, not just object-center translation', () => {
    const f = fixture();
    f.history.build([f.mesh], f.state);
    f.mesh.rotation.setFromEuler(0, 0, Math.PI / 2);
    f.mesh.updateWorldMatrix();
    const draw = f.history.build([f.mesh], f.state)[0]!;
    expect(velocity(draw)).toEqual([0, 0]);
    const v = velocity(draw, new Vector3(1, 0, 0));
    expect(v[0]).toBeCloseTo(-0.5);
    expect(v[1]).toBeCloseTo(0.5);
  });
  it('composes camera and object motion once in clip space', () => {
    const f = fixture();
    f.history.build([f.mesh], f.state);
    f.state.currentVP.elements[12] = -0.5;
    f.mesh.position.x = 1;
    f.mesh.updateWorldMatrix();
    expect(velocity(f.history.build([f.mesh], f.state)[0]!)[0]).toBeCloseTo(
      0.25,
    );
  });
  it('keeps independent previous transforms for every instance plus its mesh world pose', () => {
    const f = fixture(2),
      mesh = f.mesh as InstancedMesh;
    f.history.build([mesh], f.state);
    const matrix = new Matrix4();
    matrix.elements[12] = 2;
    mesh.setMatrixAt(0, matrix);
    matrix.elements[12] = -4;
    mesh.setMatrixAt(1, matrix);
    mesh.position.y = 1;
    mesh.updateWorldMatrix();
    const draws = f.history.build([mesh], f.state);
    expect(draws).toHaveLength(2);
    expect(velocity(draws[0]!)).toEqual([1, 0.5]);
    expect(velocity(draws[1]!)).toEqual([-2, 0.5]);
  });
  it('does not bridge invisible/missing frames or reuse invalid camera history', () => {
    const f = fixture();
    f.history.build([f.mesh], f.state);
    f.history.build([], f.state);
    expect(f.history.build([f.mesh], f.state)).toHaveLength(0);
    expect(f.history.build([f.mesh], f.state)).toHaveLength(1);
    f.state.invalidate();
    expect(f.history.build([f.mesh], f.state)).toHaveLength(0);
  });
  it('falls back for geometry changes and returns to rigid tracking only after a fresh pose', () => {
    const f = fixture();
    f.history.build([f.mesh], f.state);
    f.mesh.geometry.vertices[0] = 0.25;
    f.mesh.geometry.markUpdated();
    expect(f.history.build([f.mesh], f.state)).toHaveLength(0);
    expect(f.history.build([f.mesh], f.state)).toHaveLength(1);
  });
  it('does not publish invalid rigid velocities for morphs, deformation or transparent surfaces', () => {
    const f = fixture();
    const morphed = new Mesh({
      geometry: Geometry.cube(),
      material: f.mesh.material,
      morph: new MorphTargets({
        positions: [undefined],
        weights: new MorphWeights([0]),
      }),
    });
    class DeformingMaterial extends TextureMaterial {
      override readonly deformationBounds = 1;
    }
    const deformed = new Mesh({
      geometry: Geometry.cube(),
      material: new DeformingMaterial({ texture: f.mesh.material.texture }),
    });
    const transparent = new Mesh({
      geometry: Geometry.cube(),
      material: new TextureMaterial({
        texture: f.mesh.material.texture,
        opacity: 0.5,
      }),
    });
    const meshes = [morphed, deformed, transparent];
    f.history.build(meshes, f.state);
    expect(f.history.build(meshes, f.state)).toHaveLength(0);
  });
  it('leaves camera-only reprojection active when there is no object velocity', () => {
    const f = fixture(),
      settings = new PostProcessingSettings({ enabled: true });
    setPostEffects(
      settings,
      new PostEffectsSettings({
        motionBlur: new MotionBlurSettings({ perObject: true, strength: 0.75 }),
      }),
    );
    f.state.previousVP.elements[12] = 0.5;
    expect(f.history.build([f.mesh], f.state)).toHaveLength(0);
    const data = new Float32Array(20);
    writeMotionBlurUniforms(data, 0, settings, f.state);
    expect(data[12]).toBe(0.5);
    expect(data[16]).toBe(0.75);
    f.state.invalidate();
    writeMotionBlurUniforms(data, 0, settings, f.state);
    expect(data[16]).toBe(0);
  });
});

function gpuFixture() {
  vi.stubGlobal('GPUShaderStage', { VERTEX: 1, FRAGMENT: 2 });
  vi.stubGlobal('GPUTextureUsage', {
    TEXTURE_BINDING: 4,
    RENDER_ATTACHMENT: 16,
  });
  vi.stubGlobal('GPUBufferUsage', { UNIFORM: 64, COPY_DST: 8 });
  const textures: { destroy: Mock; createView: Mock }[] = [];
  const buffers: { destroy: Mock }[] = [];
  const pipeline = vi.fn(() => ({}));
  const device = {
    limits: { minUniformBufferOffsetAlignment: 256 },
    createBindGroupLayout: vi.fn(() => ({})),
    createPipelineLayout: vi.fn(() => ({})),
    createShaderModule: vi.fn(() => ({})),
    createRenderPipeline: pipeline,
    createTexture: vi.fn(() => {
      const view = {};
      const texture = { destroy: vi.fn(), createView: vi.fn(() => view) };
      textures.push(texture);
      return texture;
    }),
    createBuffer: vi.fn(() => {
      const buffer = { destroy: vi.fn() };
      buffers.push(buffer);
      return buffer;
    }),
    createBindGroup: vi.fn(() => ({})),
    queue: { writeBuffer: vi.fn() },
  } as unknown as GPUDevice;
  const pass = {
    setPipeline: vi.fn(),
    setBindGroup: vi.fn(),
    setVertexBuffer: vi.fn(),
    setIndexBuffer: vi.fn(),
    drawIndexed: vi.fn(),
    end: vi.fn(),
  };
  const encoder = {
    beginRenderPass: vi.fn(() => pass),
  } as unknown as GPUCommandEncoder;
  return { device, encoder, pass, textures, buffers, pipeline };
}

describe('renderer-owned velocity attachment lifecycle', () => {
  it.each([1, 4])(
    'GPU samples=%i resize/disable/destroy release targets while preserving the prepared pipeline',
    (samples) => {
      const gpu = gpuFixture(),
        f = fixture(),
        stats = new FrameStats();
      const owner = new WebGPUObjectMotion(gpu.device, samples, stats);
      const depth = {} as GPUTextureView;
      const cached = { vertex: {} as GPUBuffer, index: {} as GPUBuffer };
      const view = owner.render(
        gpu.encoder,
        [f.mesh],
        f.state,
        depth,
        () => cached,
      );
      expect(stats.renderTargetBytes).toBe(100 * 80 * 8);
      expect(gpu.pass.drawIndexed).not.toHaveBeenCalled();
      expect(
        owner.render(gpu.encoder, [f.mesh], f.state, depth, () => cached),
      ).toBe(view);
      expect(gpu.pass.drawIndexed).toHaveBeenCalledTimes(1);
      expect(gpu.buffers).toHaveLength(1);
      owner.resize(200, 100);
      expect(gpu.textures[0]!.destroy).toHaveBeenCalledTimes(1);
      expect(gpu.buffers[0]!.destroy).toHaveBeenCalledTimes(1);
      expect(stats.renderTargetBytes).toBe(0);
      f.state.width = 200;
      f.state.height = 100;
      owner.render(gpu.encoder, [f.mesh], f.state, depth, () => cached);
      expect(gpu.pass.drawIndexed).toHaveBeenCalledTimes(1);
      owner.releaseTarget();
      owner.releaseTarget();
      expect(stats.renderTargetBytes).toBe(0);
      expect(gpu.textures[1]!.destroy).toHaveBeenCalledTimes(1);
      owner.render(gpu.encoder, [], f.state, depth, () => cached);
      owner.destroy();
      expect(gpu.textures[2]!.destroy).toHaveBeenCalledTimes(1);
      expect(stats.renderTargetBytes).toBe(0);
      expect(gpu.pipeline).toHaveBeenCalledTimes(1);
    },
  );
  it('GPU allocates one aligned pose per instance and clears stale velocities after disable', () => {
    const gpu = gpuFixture(),
      f = fixture(2),
      owner = new WebGPUObjectMotion(gpu.device, 1, new FrameStats());
    const cached = { vertex: {} as GPUBuffer, index: {} as GPUBuffer };
    owner.render(
      gpu.encoder,
      [f.mesh],
      f.state,
      {} as GPUTextureView,
      () => cached,
    );
    owner.render(
      gpu.encoder,
      [f.mesh],
      f.state,
      {} as GPUTextureView,
      () => cached,
    );
    expect(gpu.pass.setBindGroup.mock.calls.map((args) => args[2])).toEqual([
      [0],
      [256],
    ]);
    owner.releaseTarget();
    owner.render(
      gpu.encoder,
      [f.mesh],
      f.state,
      {} as GPUTextureView,
      () => cached,
    );
    expect(gpu.pass.drawIndexed).toHaveBeenCalledTimes(2);
    owner.destroy();
  });
  it('GL releases float framebuffer attachments on resize/disable and the program only on destroy', () => {
    const deletedTextures: object[] = [],
      deletedFramebuffers: object[] = [],
      deletedPrograms: object[] = [];
    const program = {},
      vao = {};
    const calls: Record<string, unknown> = {
      createShader: () => ({}),
      createProgram: () => program,
      createVertexArray: () => vao,
      createTexture: () => ({}),
      createFramebuffer: () => ({}),
      getShaderParameter: () => true,
      getProgramParameter: () => true,
      getUniformLocation: () => ({}),
      checkFramebufferStatus: () => 1,
      FRAMEBUFFER_COMPLETE: 1,
      deleteTexture: (texture: object) => deletedTextures.push(texture),
      deleteFramebuffer: (framebuffer: object) =>
        deletedFramebuffers.push(framebuffer),
      deleteProgram: (value: object) => deletedPrograms.push(value),
    };
    const gl = new Proxy(calls, {
      get(target, key: string) {
        return target[key] ?? (() => undefined);
      },
    }) as unknown as WebGL2RenderingContext;
    const f = fixture(),
      stats = new FrameStats(),
      owner = new WebGLObjectMotion(gl, stats);
    const cached = { vertex: {} as WebGLBuffer, index: {} as WebGLBuffer },
      depth = {} as WebGLTexture;
    const first = owner.render([f.mesh], f.state, depth, () => cached);
    expect(owner.render([f.mesh], f.state, depth, () => cached)).toBe(first);
    expect(stats.renderTargetBytes).toBe(64000);
    owner.resize(200, 100);
    expect(deletedTextures).toEqual([first]);
    expect(deletedFramebuffers).toHaveLength(1);
    expect(deletedPrograms).toHaveLength(0);
    expect(stats.renderTargetBytes).toBe(0);
    f.state.width = 200;
    f.state.height = 100;
    const second = owner.render([], f.state, depth, () => cached);
    owner.releaseTarget();
    owner.releaseTarget();
    expect(deletedTextures).toEqual([first, second]);
    expect(deletedPrograms).toHaveLength(0);
    owner.destroy();
    expect(deletedPrograms).toEqual([program]);
    expect(stats.renderTargetBytes).toBe(0);
  });
});

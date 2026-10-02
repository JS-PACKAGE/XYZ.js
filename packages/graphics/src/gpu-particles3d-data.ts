import type { GPUParticleEmitter3D } from '../../core/src/gpu-particles3d.js';
import type { Camera3D } from '../../core/src/orthographic-camera.js';
import { Matrix4, Vector3 } from '../../math/src/index.js';
import { GPU_PARTICLE_UNIFORM_FLOATS } from '../../../src/data/gpu-particles3d.js';

/** Reused command/config adapter; deliberately contains no particle state. */
export class ParticleUniforms3D {
  readonly data = new Float32Array(GPU_PARTICLE_UNIFORM_FLOATS);
  private readonly words = new Uint32Array(this.data.buffer);
  private readonly cameraPose = new Matrix4();
  private readonly unit = new Vector3(1, 1, 1);

  fill(
    emitter: GPUParticleEmitter3D,
    camera: Camera3D,
    aspect: number,
    linear: boolean,
  ): Float32Array {
    const data = this.data;
    data.set(camera.updateMatrix(aspect).elements, 0);
    data.set(emitter.updateWorldMatrix().elements, 16);
    const axes = this.cameraPose.compose(
      camera.position,
      camera.rotation,
      this.unit,
    ).elements;
    data[32] = axes[0];
    data[33] = axes[1];
    data[34] = axes[2];
    data[36] = axes[4];
    data[37] = axes[5];
    data[38] = axes[6];
    data[40] = emitter.shaderTime;
    data[41] = emitter.lifetime;
    data[42] = emitter.space === 'world' ? 1 : 0;
    data[43] = linear ? 1 : 0;
    data.set(emitter.velocityMin, 44);
    data.set(emitter.velocityMax, 48);
    data.set(emitter.gravity, 52);
    data.set(emitter.startColor, 56);
    data.set(emitter.endColor, 60);
    data[64] = emitter.startSize;
    data[65] = emitter.endSize;
    this.words[66] = emitter.seed;
    return data;
  }
}

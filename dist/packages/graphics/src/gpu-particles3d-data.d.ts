import type { GPUParticleEmitter3D } from '../../core/src/gpu-particles3d.js';
import type { Camera3D } from '../../core/src/orthographic-camera.js';
/** Reused command/config adapter; deliberately contains no particle state. */
export declare class ParticleUniforms3D {
    readonly data: Float32Array<ArrayBuffer>;
    private readonly words;
    private readonly cameraPose;
    private readonly unit;
    fill(emitter: GPUParticleEmitter3D, camera: Camera3D, aspect: number, linear: boolean): Float32Array;
}

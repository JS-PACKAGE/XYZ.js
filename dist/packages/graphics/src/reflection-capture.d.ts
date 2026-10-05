import { PerspectiveCamera } from '../../core/src/perspective-camera.js';
import { EnvironmentMap } from '../../core/src/environment.js';
import { ReflectionProbe, type ReflectionProbeCaptureOptions } from '../../core/src/reflection-probe.js';
import type { Scene } from '../../core/src/scene.js';
export declare function captureConfiguration(probe: ReflectionProbe, options?: ReflectionProbeCaptureOptions): {
    size: number;
    near: number;
    far: number;
    bytes: number;
};
/** All face encoding is synchronous: no temporarily changed Scene state crosses an await. */
export declare function encodeProbeFaces(scene: Scene, probe: ReflectionProbe, options: ReflectionProbeCaptureOptions, encode: (face: number, camera: PerspectiveCamera) => void): void;
export declare function halfFloat(value: number): number;
export declare function capturedEnvironment(size: number, faces: Float32Array[], signal?: AbortSignal): EnvironmentMap;
/** One pending capture and at most one due probe per frame, paced by Scene simulation time. */
export declare class ProbeCaptureScheduler {
    private readonly next;
    private pending;
    schedule(scene: Scene, capture: (probe: ReflectionProbe) => Promise<EnvironmentMap>, error: (error: unknown) => void): void;
}

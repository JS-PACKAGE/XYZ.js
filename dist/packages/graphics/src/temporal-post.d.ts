import { Matrix4 } from '../../math/src/index.js';
import type { Camera3D } from '../../core/src/orthographic-camera.js';
import type { PostProcessingSettings } from '../../core/src/render-settings.js';
/** History belongs to one scene, camera, viewport and uninterrupted rendered sequence. */
export declare class TemporalPostState {
    readonly currentVP: Matrix4;
    readonly inverseVP: Matrix4;
    readonly previousVP: Matrix4;
    readonly cameraPosition: Float32Array<ArrayBuffer>;
    readonly jitter: Float32Array<ArrayBuffer>;
    historyValid: boolean;
    reprojectionValid: boolean;
    width: number;
    height: number;
    private scene;
    private camera;
    private sample;
    private enabled;
    private readonly previousPosition;
    private readonly previousRotation;
    private readonly projection;
    private near;
    private far;
    private projectionScale;
    private aspect;
    begin(scene: object, camera: Camera3D, width: number, height: number, settings: PostProcessingSettings, aspect?: number): Matrix4;
    commit(): void;
    invalidate(): void;
}
/** Shared std140/WGSL layout: three matrices followed by three vec4s. */
export declare function writeTemporalUniforms(data: Float32Array, state: TemporalPostState, settings: PostProcessingSettings): void;

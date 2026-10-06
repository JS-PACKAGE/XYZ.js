import type { Game } from './game.js';
import type { Scene } from './scene.js';
import { type XRLoopDriver } from './xr-loop.js';
export type XRSessionMode = 'immersive-vr' | 'immersive-ar';
export interface XRPoseTransform {
    readonly position: {
        readonly x: number;
        readonly y: number;
        readonly z: number;
    };
    readonly orientation: {
        readonly x: number;
        readonly y: number;
        readonly z: number;
        readonly w: number;
    };
    readonly inverse: {
        readonly matrix: Float32Array;
    };
}
export interface XRViewData {
    readonly projectionMatrix: Float32Array;
    readonly transform: XRPoseTransform;
}
export interface XRViewport {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}
export interface XRInputSourceData {
    readonly handedness: string;
    readonly targetRaySpace: object;
    readonly gripSpace?: object;
    readonly gamepad?: {
        readonly buttons: readonly {
            readonly value: number;
        }[];
        readonly axes: readonly number[];
    };
}
export interface XRFrameData {
    getViewerPose(space: object): {
        readonly transform: XRPoseTransform;
        readonly views: readonly XRViewData[];
    } | null;
    getPose(space: object, referenceSpace: object): {
        readonly transform: XRPoseTransform;
    } | null;
}
export interface XRSessionData extends EventTarget {
    readonly inputSources: readonly XRInputSourceData[];
    readonly visibilityState: string;
    requestReferenceSpace(type: string): Promise<object>;
    updateRenderState(state: {
        baseLayer?: object;
        layers?: object[];
        depthNear?: number;
        depthFar?: number;
    }): void;
    requestAnimationFrame(callback: (timestamp: number, frame: XRFrameData) => void): number;
    cancelAnimationFrame(id: number): void;
    end(): Promise<void>;
}
export interface XRSystemData {
    isSessionSupported(mode: XRSessionMode): Promise<boolean>;
    requestSession(mode: XRSessionMode, options: {
        requiredFeatures: string[];
        optionalFeatures: string[];
    }): Promise<XRSessionData>;
}
export interface XRSessionOptions {
    requiredFeatures?: readonly string[];
    optionalFeatures?: readonly string[];
}
export interface XRController {
    readonly source: XRInputSourceData;
    readonly targetRay: XRPoseTransform | null;
    readonly grip: XRPoseTransform | null;
    /** Bind actions to virtual controls `${prefix}.button.N` / `${prefix}.axis.N`. */
    readonly prefix: string;
}
/** One immersive session per Game. Construct adjacent to Game; no published Game shape changes. */
export declare class XRSessionManager extends EventTarget implements XRLoopDriver {
    readonly game: Game;
    private readonly system;
    tick?: (timestamp: number) => void;
    private current;
    private referenceSpace;
    private layer;
    private gpuBinding;
    private gpuLayer;
    private frame;
    private requestId;
    private pending;
    private disposed;
    private readonly camera;
    private readonly controls;
    private controllerValues;
    private readonly sourceIds;
    private nextSource;
    private readonly onEnd;
    private readonly onLoss;
    private readonly onVisibility;
    constructor(game: Game, system?: XRSystemData | undefined);
    get session(): XRSessionData | undefined;
    get controllers(): readonly XRController[];
    isSessionSupported(mode: XRSessionMode): Promise<boolean>;
    requestSession(mode: XRSessionMode, options?: XRSessionOptions): Promise<XRSessionData>;
    end(): Promise<void>;
    destroy(): void;
    private readonly onFrame;
    render(scene: Scene | undefined): void;
    private updateInput;
    private clearControls;
    private cleanup;
}

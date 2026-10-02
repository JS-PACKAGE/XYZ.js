import type { Object3D } from '../../core/src/object3d.js';
import type { Scene } from '../../core/src/scene.js';
import type { AudioListenerState, AudioVec3 } from './samples/spatial.js';
export interface SpatialAudioPlayback {
    readonly state: string;
    position3D: Readonly<AudioVec3> | undefined;
    stop(): void;
}
/** Objects are borrowed; disposing a binding never destroys its Object3D. */
export declare class AudioTransformBinding {
    readonly object: Object3D;
    private readonly target;
    private readonly listener;
    private readonly release;
    private disposed;
    readonly scene: Scene | undefined;
    private readonly position;
    private readonly forward;
    private readonly up;
    /** @internal */
    constructor(object: Object3D, target: AudioListenerState | SpatialAudioPlayback, listener: boolean, release: (binding: AudioTransformBinding) => void);
    get destroyed(): boolean;
    /** Releases follow ownership; emitter playback is stopped by default. */
    unbind(stop?: boolean): void;
    /** Called after Scene simulation/world transforms; uses no renderer resources. */
    update(): void;
    private readonly onObjectDestroyed;
}

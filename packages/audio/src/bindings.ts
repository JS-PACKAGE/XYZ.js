import type { Object3D } from '../../core/src/object3d.js';
import type { Scene } from '../../core/src/scene.js';
import type { AudioListenerState, AudioVec3 } from './samples/spatial.js';
import { AudioError } from './errors.js';

export interface SpatialAudioPlayback {
  readonly state: string;
  position3D: Readonly<AudioVec3> | undefined;
  stop(): void;
}
/** Objects are borrowed; disposing a binding never destroys its Object3D. */
export class AudioTransformBinding {
  private disposed = false;
  readonly scene: Scene | undefined;
  private readonly position = { x: 0, y: 0, z: 0 };
  private readonly forward = { x: 0, y: 0, z: -1 };
  private readonly up = { x: 0, y: 1, z: 0 };

  /** @internal */
  constructor(
    readonly object: Object3D,
    private readonly target: AudioListenerState | SpatialAudioPlayback,
    private readonly listener: boolean,
    private readonly release: (binding: AudioTransformBinding) => void,
  ) {
    if (object.destroyed || object.scene?.destroyed)
      throw new AudioError('Cannot bind a destroyed audio transform.');
    if (!listener && (target as SpatialAudioPlayback).position3D === undefined)
      throw new AudioError(
        'Emitter playback must be created with spatial options.',
      );
    this.scene = object.scene;
    object.addEventListener('destroy', this.onObjectDestroyed);
    this.update();
  }
  get destroyed(): boolean {
    return this.disposed;
  }
  /** Releases follow ownership; emitter playback is stopped by default. */
  unbind(stop = true): void {
    if (this.disposed) return;
    this.disposed = true;
    this.object.removeEventListener('destroy', this.onObjectDestroyed);
    this.release(this);
    if (!this.listener && stop) (this.target as SpatialAudioPlayback).stop();
  }
  /** Called after Scene simulation/world transforms; uses no renderer resources. */
  update(): void {
    if (this.disposed) return;
    if (this.object.destroyed || this.scene?.destroyed) {
      this.unbind();
      return;
    }
    if (!this.listener) {
      const state = (this.target as SpatialAudioPlayback).state;
      if (state === 'stopped' || state === 'ended') {
        this.unbind(false);
        return;
      }
    }
    const e = this.object.updateWorldMatrix().elements;
    this.position.x = e[12]!;
    this.position.y = e[13]!;
    this.position.z = e[14]!;
    if (this.listener) {
      const listener = this.target as AudioListenerState;
      listener.setPosition(this.position.x, this.position.y, this.position.z);
      this.forward.x = -e[8]!;
      this.forward.y = -e[9]!;
      this.forward.z = -e[10]!;
      this.up.x = e[4]!;
      this.up.y = e[5]!;
      this.up.z = e[6]!;
      // Scale does not affect AudioListener orientation. A singular transform leaves the last
      // valid orientation intact rather than aborting the game frame.
      const fl = Math.hypot(this.forward.x, this.forward.y, this.forward.z),
        ul = Math.hypot(this.up.x, this.up.y, this.up.z);
      if (fl > 0 && ul > 0) {
        this.forward.x /= fl;
        this.forward.y /= fl;
        this.forward.z /= fl;
        this.up.x /= ul;
        this.up.y /= ul;
        this.up.z /= ul;
        const dot =
          this.forward.x * this.up.x +
          this.forward.y * this.up.y +
          this.forward.z * this.up.z;
        if (Math.abs(dot) < 1 - 1e-6)
          listener.setOrientation(this.forward, this.up);
      }
    } else (this.target as SpatialAudioPlayback).position3D = this.position;
  }
  private readonly onObjectDestroyed = (): void => {
    this.unbind();
  };
}

import type { Camera3D } from './orthographic-camera.js';

export interface FirstPersonKeys {
  forward: string;
  back: string;
  left: string;
  right: string;
  up: string;
  down: string;
  sprint: string;
}

/**
 * Mouse-look (Pointer Lock) and WASD movement. Call `lock()` from a user gesture,
 * then `update(dt)` once per frame with the simulation delta. Input is ignored while
 * the pointer is not locked (unless `requireLock` is false) and cleared when it unlocks.
 * Dispatches `lock` and `unlock` events.
 */
export class FirstPersonControls extends EventTarget {
  enabled = true;
  /** Only react to input while the canvas owns the pointer lock. */
  requireLock = true;
  /** Units per second. */
  moveSpeed = 5;
  sprintMultiplier = 2;
  /** Radians per pixel of pointer movement. */
  lookSpeed = 0.002;
  /** When true, forward/back follow the view pitch instead of staying horizontal. */
  fly = false;
  /** KeyboardEvent.code values; mutate freely to rebind. */
  readonly keys: FirstPersonKeys = {
    forward: 'KeyW',
    back: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    up: 'Space',
    down: 'KeyC',
    sprint: 'ShiftLeft',
  };
  minPitch = -Math.PI / 2 + 0.01;
  maxPitch = Math.PI / 2 - 0.01;
  private yawAngle = 0;
  private pitchAngle = 0;
  private destroyed = false;
  private readonly pressed = new Set<string>();
  private readonly document: Document;

  constructor(
    readonly camera: Camera3D,
    readonly canvas: HTMLCanvasElement,
  ) {
    super();
    this.document = canvas.ownerDocument;
    // Recover yaw/pitch from the camera's current forward direction (roll is dropped).
    const q = camera.rotation;
    const fx = -2 * (q.x * q.z + q.w * q.y);
    const fy = -2 * (q.y * q.z - q.w * q.x);
    const fz = -(1 - 2 * (q.x * q.x + q.y * q.y));
    this.yawAngle = Math.atan2(-fx, -fz);
    this.pitchAngle = Math.asin(Math.max(-1, Math.min(1, fy)));
    const doc = this.document;
    doc.addEventListener('mousemove', this.onMouseMove);
    doc.addEventListener('keydown', this.onKeyDown);
    doc.addEventListener('keyup', this.onKeyUp);
    doc.addEventListener('pointerlockchange', this.onLockChange);
    canvas.addEventListener('blur', this.onBlur);
    this.applyRotation();
  }

  get isLocked(): boolean {
    return !this.destroyed && this.document.pointerLockElement === this.canvas;
  }

  get yaw(): number {
    return this.yawAngle;
  }

  get pitch(): number {
    return this.pitchAngle;
  }

  /** Points the camera; pitch is clamped to [minPitch, maxPitch]. */
  setRotation(yaw: number, pitch: number): void {
    if (!Number.isFinite(yaw) || !Number.isFinite(pitch))
      throw new RangeError('Yaw and pitch must be finite.');
    this.yawAngle = yaw;
    this.pitchAngle = Math.max(this.minPitch, Math.min(this.maxPitch, pitch));
    this.applyRotation();
  }

  /** Requests pointer lock. Must run inside a user gesture; rejects if the browser refuses. */
  async lock(): Promise<void> {
    if (this.destroyed) throw new Error('FirstPersonControls is destroyed.');
    if (this.isLocked) return;
    const doc = this.document;
    await new Promise<void>((resolve, reject) => {
      const done = (): void => {
        doc.removeEventListener('pointerlockchange', changed);
        doc.removeEventListener('pointerlockerror', failed);
      };
      const changed = (): void => {
        if (doc.pointerLockElement !== this.canvas) return;
        done();
        resolve();
      };
      const failed = (): void => {
        done();
        reject(new Error('The browser refused pointer lock.'));
      };
      doc.addEventListener('pointerlockchange', changed);
      doc.addEventListener('pointerlockerror', failed);
      try {
        const result: unknown = this.canvas.requestPointerLock();
        // Newer browsers return a promise that rejects on refusal.
        if (result instanceof Promise) result.catch(failed);
      } catch (error) {
        done();
        reject(error);
      }
    });
  }

  unlock(): void {
    if (this.isLocked) this.document.exitPointerLock();
  }

  /** Applies held movement keys for `deltaTime` seconds (finite, nonnegative). */
  update(deltaTime: number): void {
    if (this.destroyed || !this.enabled) return;
    if (!Number.isFinite(deltaTime) || deltaTime < 0)
      throw new RangeError('deltaTime must be finite and nonnegative.');
    if (this.requireLock && !this.isLocked) return;
    const k = this.keys;
    const has = (code: string): number => (this.pressed.has(code) ? 1 : 0);
    const forward = has(k.forward) - has(k.back);
    const strafe = has(k.right) - has(k.left);
    const vertical = has(k.up) - has(k.down);
    if (!forward && !strafe && !vertical) return;
    const speed =
      this.moveSpeed *
      (this.pressed.has(k.sprint) ? this.sprintMultiplier : 1) *
      deltaTime;
    const sinYaw = Math.sin(this.yawAngle);
    const cosYaw = Math.cos(this.yawAngle);
    const cosPitch = this.fly ? Math.cos(this.pitchAngle) : 1;
    const sinPitch = this.fly ? Math.sin(this.pitchAngle) : 0;
    const position = this.camera.position;
    position.x += (-sinYaw * cosPitch * forward + cosYaw * strafe) * speed;
    position.y += (sinPitch * forward + vertical) * speed;
    position.z += (-cosYaw * cosPitch * forward - sinYaw * strafe) * speed;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.unlock();
    this.destroyed = true;
    this.pressed.clear();
    const doc = this.document;
    doc.removeEventListener('mousemove', this.onMouseMove);
    doc.removeEventListener('keydown', this.onKeyDown);
    doc.removeEventListener('keyup', this.onKeyUp);
    doc.removeEventListener('pointerlockchange', this.onLockChange);
    this.canvas.removeEventListener('blur', this.onBlur);
  }

  private applyRotation(): void {
    // q = qYaw(about +Y) * qPitch(about +X); the camera looks down -Z.
    const hy = this.yawAngle / 2;
    const hp = this.pitchAngle / 2;
    const sy = Math.sin(hy);
    const cy = Math.cos(hy);
    const sp = Math.sin(hp);
    const cp = Math.cos(hp);
    const q = this.camera.rotation;
    q.x = cy * sp;
    q.y = sy * cp;
    q.z = -sy * sp;
    q.w = cy * cp;
  }

  private readonly onMouseMove = (event: MouseEvent): void => {
    if (!this.enabled || (this.requireLock && !this.isLocked)) return;
    const dx = event.movementX;
    const dy = event.movementY;
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
    this.setRotation(
      this.yawAngle - dx * this.lookSpeed,
      this.pitchAngle - dy * this.lookSpeed,
    );
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (this.enabled && (!this.requireLock || this.isLocked)) {
      this.pressed.add(event.code);
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.pressed.delete(event.code);
  };

  private readonly onBlur = (): void => {
    this.pressed.clear();
  };

  private readonly onLockChange = (): void => {
    if (this.isLocked) {
      this.dispatchEvent(new Event('lock'));
    } else {
      // Held keys would otherwise stay stuck: keyup goes to the browser UI, not us.
      this.pressed.clear();
      this.dispatchEvent(new Event('unlock'));
    }
  };
}

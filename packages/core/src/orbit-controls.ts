import { Matrix4, Vector3 } from '../../math/src/index.js';
import { OrthographicCamera, type Camera3D } from './orthographic-camera.js';

/** Canvas-local orbit input: left drag rotates, right/modified-left pans, middle/wheel dollies. */
export class OrbitControls {
  readonly target = new Vector3();
  enabled = true;
  enableRotate = true;
  enablePan = true;
  enableZoom = true;
  rotateSpeed = 1;
  panSpeed = 1;
  zoomSpeed = 1;
  minDistance = 0;
  maxDistance = Infinity;
  minZoom = 0.01;
  maxZoom = 100;
  minPolarAngle = 0;
  maxPolarAngle = Math.PI;
  minAzimuthAngle = -Infinity;
  maxAzimuthAngle = Infinity;
  private pointerId: number | undefined;
  private mode: 'rotate' | 'pan' | 'dolly' = 'rotate';
  private lastX = 0;
  private lastY = 0;
  private destroyed = false;
  private readonly basis = new Matrix4();
  private readonly unitScale = new Vector3(1, 1, 1);
  private readonly previousTouchAction: string;

  constructor(
    readonly camera: Camera3D,
    readonly canvas: HTMLCanvasElement,
  ) {
    this.previousTouchAction = canvas.style.touchAction;
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerEnd);
    canvas.addEventListener('pointercancel', this.onPointerEnd);
    canvas.addEventListener('lostpointercapture', this.onPointerEnd);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    canvas.addEventListener('contextmenu', this.onContextMenu);
    this.update();
  }

  /** Reconciles externally changed target/position with the orbit limits and orientation. */
  update(): void {
    if (this.destroyed) return;
    this.orbit(0, 0);
    if (this.camera instanceof OrthographicCamera)
      this.camera.zoom = Math.max(
        this.minZoom,
        Math.min(this.maxZoom, this.camera.zoom),
      );
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.releasePointer();
    const canvas = this.canvas;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointermove', this.onPointerMove);
    canvas.removeEventListener('pointerup', this.onPointerEnd);
    canvas.removeEventListener('pointercancel', this.onPointerEnd);
    canvas.removeEventListener('lostpointercapture', this.onPointerEnd);
    canvas.removeEventListener('wheel', this.onWheel);
    canvas.removeEventListener('contextmenu', this.onContextMenu);
    if (canvas.style.touchAction === 'none')
      canvas.style.touchAction = this.previousTouchAction;
  }

  private orbit(azimuthDelta: number, polarDelta: number): void {
    const position = this.camera.position;
    const x = position.x - this.target.x;
    const y = position.y - this.target.y;
    const z = position.z - this.target.z;
    const distance = Math.max(
      1e-6,
      Math.max(
        this.minDistance,
        Math.min(this.maxDistance, Math.hypot(x, y, z)),
      ),
    );
    const originalDistance = Math.hypot(x, y, z);
    const polar = Math.max(
      1e-6,
      Math.min(
        Math.PI - 1e-6,
        Math.max(
          this.minPolarAngle,
          Math.min(
            this.maxPolarAngle,
            (originalDistance === 0
              ? Math.PI / 2
              : Math.acos(Math.max(-1, Math.min(1, y / originalDistance)))) +
              polarDelta,
          ),
        ),
      ),
    );
    const azimuth = Math.max(
      this.minAzimuthAngle,
      Math.min(this.maxAzimuthAngle, Math.atan2(x, z) + azimuthDelta),
    );
    const horizontal = distance * Math.sin(polar);
    position.set(
      this.target.x + horizontal * Math.sin(azimuth),
      this.target.y + distance * Math.cos(polar),
      this.target.z + horizontal * Math.cos(azimuth),
    );
    this.camera.lookAt(this.target);
  }

  private pan(dx: number, dy: number): void {
    const camera = this.camera;
    const height = Math.max(1, this.canvas.clientHeight);
    const distance = Math.hypot(
      camera.position.x - this.target.x,
      camera.position.y - this.target.y,
      camera.position.z - this.target.z,
    );
    const worldHeight =
      camera instanceof OrthographicCamera
        ? camera.height / camera.zoom
        : 2 * distance * Math.tan(camera.fov / 2);
    const factor = (worldHeight * this.panSpeed) / height;
    const e = this.basis.compose(
      camera.position,
      camera.rotation,
      this.unitScale,
    ).elements;
    const x = (-dx * e[0] + dy * e[4]) * factor;
    const y = (-dx * e[1] + dy * e[5]) * factor;
    const z = (-dx * e[2] + dy * e[6]) * factor;
    this.target.x += x;
    this.target.y += y;
    this.target.z += z;
    camera.position.x += x;
    camera.position.y += y;
    camera.position.z += z;
    this.update();
  }

  private dolly(delta: number): void {
    const factor = Math.exp(
      Math.max(-20, Math.min(20, delta * this.zoomSpeed * 0.001)),
    );
    const camera = this.camera;
    if (camera instanceof OrthographicCamera) {
      camera.zoom = Math.max(
        this.minZoom,
        Math.min(this.maxZoom, camera.zoom / factor),
      );
    } else {
      const x = camera.position.x - this.target.x;
      const y = camera.position.y - this.target.y;
      const z = camera.position.z - this.target.z;
      const distance = Math.hypot(x, y, z);
      const next = Math.max(
        1e-6,
        Math.max(
          this.minDistance,
          Math.min(this.maxDistance, distance * factor),
        ),
      );
      if (distance !== 0)
        camera.position.set(
          this.target.x + (x * next) / distance,
          this.target.y + (y * next) / distance,
          this.target.z + (z * next) / distance,
        );
    }
    this.update();
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (
      !this.enabled ||
      this.destroyed ||
      this.pointerId !== undefined ||
      event.button > 2
    )
      return;
    const mode =
      event.button === 1
        ? 'dolly'
        : event.button === 2 || event.shiftKey || event.ctrlKey || event.metaKey
          ? 'pan'
          : 'rotate';
    if (
      (mode === 'rotate' && !this.enableRotate) ||
      (mode === 'pan' && !this.enablePan) ||
      (mode === 'dolly' && !this.enableZoom)
    )
      return;
    this.pointerId = event.pointerId;
    this.mode = mode;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.canvas.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    if (!this.enabled) return;
    if (this.mode === 'rotate' && this.enableRotate) {
      const factor =
        (2 * Math.PI * this.rotateSpeed) /
        Math.max(1, this.canvas.clientHeight);
      this.orbit(-dx * factor, -dy * factor);
    } else if (this.mode === 'pan' && this.enablePan) this.pan(dx, dy);
    else if (this.mode === 'dolly' && this.enableZoom) this.dolly(dy * 5);
    event.preventDefault();
  };

  private releasePointer(): void {
    const id = this.pointerId;
    this.pointerId = undefined;
    if (id !== undefined && this.canvas.hasPointerCapture(id))
      this.canvas.releasePointerCapture(id);
  }

  private readonly onPointerEnd = (event: PointerEvent): void => {
    if (event.pointerId === this.pointerId) this.releasePointer();
  };

  private readonly onWheel = (event: WheelEvent): void => {
    if (!this.enabled || !this.enableZoom || this.destroyed) return;
    const delta =
      event.deltaY *
      (event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? Math.max(1, this.canvas.clientHeight)
          : 1);
    this.dolly(delta);
    event.preventDefault();
  };

  private readonly onContextMenu = (event: Event): void => {
    if (this.enabled && this.enablePan && !this.destroyed)
      event.preventDefault();
  };
}

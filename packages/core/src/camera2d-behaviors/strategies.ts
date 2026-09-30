import type { Camera2D } from '../camera2d.js';
import type { GameObject } from '../game-object.js';
import type { Rect2D } from '../gameplay/contracts.js';
import { validateTime } from '../actions2d/actions.js';

export interface CameraBehavior2D {
  update(camera: Camera2D, dt: number): void;
  destroy?(): void;
}
export interface CameraFollowOptions {
  axis?: 'both' | 'x' | 'y';
  smoothTime?: number;
  /** Viewport-relative logical screen pixels, unaffected by shake. */
  deadZone?: Rect2D;
}

function assertRect(rect: Rect2D, name: string): void {
  if (
    !Number.isFinite(rect.x) ||
    !Number.isFinite(rect.y) ||
    !Number.isFinite(rect.width) ||
    !Number.isFinite(rect.height) ||
    rect.width < 0 ||
    rect.height < 0 ||
    !Number.isFinite(rect.x + rect.width) ||
    !Number.isFinite(rect.y + rect.height)
  )
    throw new RangeError(
      `${name} must have finite coordinates and nonnegative finite extents.`,
    );
}

export const CameraStrategies = Object.freeze({
  follow(
    target: GameObject,
    options: CameraFollowOptions = {},
  ): CameraBehavior2D {
    const axis = options.axis ?? 'both';
    if (axis !== 'both' && axis !== 'x' && axis !== 'y')
      throw new RangeError('Unknown camera follow axis.');
    const smoothTime = options.smoothTime ?? 0;
    validateTime(smoothTime, 'smooth time');
    const deadZone = options.deadZone ? { ...options.deadZone } : undefined;
    if (deadZone) assertRect(deadZone, 'Camera dead zone');
    let scene = target.scene;
    let followed: GameObject | undefined = target;
    return {
      update(camera, dt) {
        validateTime(dt, 'delta time');
        const owner = followed;
        if (!owner || owner.destroyed || owner.worldSpace === 'screen') return;
        if (scene && owner.scene !== scene) return;
        scene ??= owner.scene;
        const matrix = owner.updateWorldMatrix().elements;
        const x = matrix[6],
          y = matrix[7];
        let desiredX = x - camera.viewportWidth / (2 * camera.zoom);
        let desiredY = y - camera.viewportHeight / (2 * camera.zoom);
        if (deadZone) {
          const screenX = (x - camera.position.x) * camera.zoom;
          const screenY = (y - camera.position.y) * camera.zoom;
          desiredX =
            camera.position.x +
            (screenX -
              Math.max(
                deadZone.x,
                Math.min(screenX, deadZone.x + deadZone.width),
              )) /
              camera.zoom;
          desiredY =
            camera.position.y +
            (screenY -
              Math.max(
                deadZone.y,
                Math.min(screenY, deadZone.y + deadZone.height),
              )) /
              camera.zoom;
        }
        const weight = smoothTime === 0 ? 1 : -Math.expm1(-dt / smoothTime);
        if (axis !== 'y')
          camera.position.x += (desiredX - camera.position.x) * weight;
        if (axis !== 'x')
          camera.position.y += (desiredY - camera.position.y) * weight;
      },
      destroy() {
        followed = undefined;
        scene = undefined;
      },
    };
  },
  bounds(rect: Rect2D): CameraBehavior2D {
    assertRect(rect, 'Camera bounds');
    const { x, y, width, height } = rect;
    return {
      update(camera, dt) {
        validateTime(dt, 'delta time');
        const viewWidth = camera.viewportWidth / camera.zoom;
        const viewHeight = camera.viewportHeight / camera.zoom;
        camera.position.x =
          width < viewWidth
            ? x + (width - viewWidth) / 2
            : Math.max(x, Math.min(camera.position.x, x + width - viewWidth));
        camera.position.y =
          height < viewHeight
            ? y + (height - viewHeight) / 2
            : Math.max(y, Math.min(camera.position.y, y + height - viewHeight));
      },
    };
  },
});

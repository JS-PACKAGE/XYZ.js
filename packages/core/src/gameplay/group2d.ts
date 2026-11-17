import { Matrix3 } from '../../../math/src/index.js';
import { GameObject } from '../game-object.js';
import type { Rect2D } from './contracts.js';

/** Non-drawing container whose bounds are composed from its children. */
export class Group2D extends GameObject {
  private readonly childBounds: Rect2D = { x: 0, y: 0, width: 0, height: 0 };
  private relativeChildMatrix: Matrix3 | undefined;

  override getLocalBounds(
    out: Rect2D = { x: 0, y: 0, width: 0, height: 0 },
  ): Rect2D {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const child of this.children) {
      if (!child.visible || child.destroyed) continue;
      const bounds = child.getLocalBounds(this.childBounds);
      if (bounds.width <= 0 || bounds.height <= 0) continue;
      const baseComposition =
        child.updateWorldMatrix === GameObject.prototype.updateWorldMatrix;
      const body = baseComposition ? child.body : undefined;
      if (
        !baseComposition ||
        (body &&
          body.type !== 'static' &&
          !body.isSleeping &&
          child.scene?.presentingPhysics)
      ) {
        // Public matrix callbacks can re-enter bounds queries.
        const x0 = bounds.x + 0;
        const x1 = bounds.x + bounds.width;
        const y0 = bounds.y + 0;
        const y1 = bounds.y + bounds.height;
        const parent = this.updateWorldMatrix();
        const world = child.updateWorldMatrix();
        const matrix = (this.relativeChildMatrix ??= new Matrix3())
          .copy(parent)
          .invert()
          .multiply(world).elements;
        for (let corner = 0; corner < 4; corner++) {
          const x = corner & 1 ? x1 : x0;
          const y = corner & 2 ? y1 : y0;
          const px = matrix[0] * x + matrix[3] * y + matrix[6];
          const py = matrix[1] * x + matrix[4] * y + matrix[7];
          minX = Math.min(minX, px);
          minY = Math.min(minY, py);
          maxX = Math.max(maxX, px);
          maxY = Math.max(maxY, py);
        }
        continue;
      }
      const matrix = child.transform.updateMatrix().elements;
      for (let corner = 0; corner < 4; corner++) {
        const x = bounds.x + (corner & 1 ? bounds.width : 0);
        const y = bounds.y + (corner & 2 ? bounds.height : 0);
        const px = matrix[0] * x + matrix[3] * y + matrix[6];
        const py = matrix[1] * x + matrix[4] * y + matrix[7];
        minX = Math.min(minX, px);
        minY = Math.min(minY, py);
        maxX = Math.max(maxX, px);
        maxY = Math.max(maxY, py);
      }
    }
    out.x = minX === Infinity ? 0 : minX;
    out.y = minY === Infinity ? 0 : minY;
    out.width = minX === Infinity ? 0 : maxX - minX;
    out.height = minY === Infinity ? 0 : maxY - minY;
    return out;
  }
}

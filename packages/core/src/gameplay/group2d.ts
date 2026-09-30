import { GameObject } from '../game-object.js';
import type { Rect2D } from './contracts.js';

/** Non-drawing container whose bounds are composed from its children. */
export class Group2D extends GameObject {
  private readonly childBounds: Rect2D = { x: 0, y: 0, width: 0, height: 0 };

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

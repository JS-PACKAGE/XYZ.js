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
    // Query-local inverse values survive public callbacks re-entering this group.
    let inverseReady = false;
    let parentA = 0,
      parentB = 0,
      parentC = 0,
      parentD = 0,
      parentTx = 0,
      parentTy = 0;
    let inverseA = 0,
      inverseB = 0,
      inverseC = 0,
      inverseD = 0,
      inverseTx = 0,
      inverseTy = 0;
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
        const relative = (this.relativeChildMatrix ??= new Matrix3());
        const matrix = relative.elements;
        const source = parent.elements;
        const a = source[0],
          b = source[1],
          row2 = source[2],
          c = source[3],
          d = source[4],
          row5 = source[5],
          tx = source[6],
          ty = source[7],
          row8 = source[8];
        if (
          !inverseReady ||
          !Object.is(a, parentA) ||
          !Object.is(b, parentB) ||
          !Object.is(c, parentC) ||
          !Object.is(d, parentD) ||
          !Object.is(tx, parentTx) ||
          !Object.is(ty, parentTy)
        ) {
          parentA = a;
          parentB = b;
          parentC = c;
          parentD = d;
          parentTx = tx;
          parentTy = ty;
          matrix[0] = a;
          matrix[1] = b;
          matrix[2] = row2;
          matrix[3] = c;
          matrix[4] = d;
          matrix[5] = row5;
          matrix[6] = tx;
          matrix[7] = ty;
          matrix[8] = row8;
          relative.invert();
          inverseA = matrix[0];
          inverseB = matrix[1];
          inverseC = matrix[3];
          inverseD = matrix[4];
          inverseTx = matrix[6];
          inverseTy = matrix[7];
          inverseReady = true;
        } else {
          matrix[0] = inverseA;
          matrix[1] = inverseB;
          matrix[2] = 0;
          matrix[3] = inverseC;
          matrix[4] = inverseD;
          matrix[5] = 0;
          matrix[6] = inverseTx;
          matrix[7] = inverseTy;
          matrix[8] = 1;
        }
        relative.multiply(world);
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

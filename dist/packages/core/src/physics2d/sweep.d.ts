import type { ShapeGeometry } from './collider.js';
/**
 * Time of impact in [0,1] of `moving` translating by (dx, dy) against `target`, or Infinity when
 * they do not touch during the move or already overlap at its start. `moving` holds the END
 * pose; the start pose is that shape shifted by (-dx, -dy). Rotation is not swept. The shapes
 * are convex, so contact happens exactly when the origin ray enters target ⊕ (−moving).
 */
export declare function sweepTimeOfImpact(moving: ShapeGeometry, dx: number, dy: number, target: ShapeGeometry): number;

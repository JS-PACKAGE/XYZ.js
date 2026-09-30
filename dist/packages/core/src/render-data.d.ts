import { Matrix4 } from '../../math/src/index.js';
import type { Scene } from './scene.js';
/** Validate mutable settings before either backend allocates frame resources. */
export declare function validateRenderSettings(scene: Scene): void;
/**
 * Allocation-free vec4-aligned lighting block, with offsets in src/data/rendering.ts:
 * direction.xyz/intensity, directional color.rgb/ambient, pointCount/spotCount/0/0;
 * points: position.xyz/range, color.rgb/intensity;
 * spots: point fields, normalized light-to-surface direction.xyz/cosOuter, cosInner/0/0/0.
 * Unused slots are cleared so a reused block never retains lights removed from a Scene.
 */
export declare function fillLightingData(scene: Scene, out: Float32Array): void;
/**
 * Right-handed directional shadow view-projection with depth in [0, 1].
 * WebGL remaps rasterized clip Z to [-W, W], but shadow sampling uses this matrix directly.
 * The light camera is target + normalized surface-to-light direction * far / 2.
 */
export declare function computeShadowMatrix(scene: Scene, out: Matrix4): Matrix4;

import type { GameObject } from '../game-object.js';

/** @internal Rendering and picking share the same stable layer/z ordering. */
export function compareObjects2D(a: GameObject, b: GameObject): number {
  const aScreen = a.worldSpace === 'screen';
  const bScreen = b.worldSpace === 'screen';
  return aScreen === bScreen ? a.worldZIndex - b.worldZIndex : aScreen ? 1 : -1;
}

export interface Rect2D {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ColorRGBA = readonly [number, number, number, number];

export function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite.`);
}

export function validateSource(
  source: Rect2D,
  width: number,
  height: number,
): void {
  if (
    !Number.isFinite(source.x) ||
    !Number.isFinite(source.y) ||
    !Number.isFinite(source.width) ||
    !Number.isFinite(source.height) ||
    source.x < 0 ||
    source.y < 0 ||
    source.width <= 0 ||
    source.height <= 0 ||
    source.x + source.width > width ||
    source.y + source.height > height
  )
    throw new RangeError(
      'Sprite source must be a positive finite rectangle within its Texture.',
    );
}

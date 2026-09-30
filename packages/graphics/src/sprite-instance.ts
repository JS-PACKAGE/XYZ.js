import type { Sprite } from '../../core/src/sprite.js';
import type { Camera2D } from '../../core/src/camera2d.js';

export const SPRITE_FLOATS = 20;
export const SPRITE_BYTES = SPRITE_FLOATS * Float32Array.BYTES_PER_ELEMENT;

/** Keep the complete ancestor affine transform, including shear and reflection. */
export function writeSpriteInstance(
  sprite: Sprite,
  camera: Camera2D,
  data: Float32Array,
  offset: number,
): void {
  const matrix = sprite.updateWorldMatrix().elements;
  const world = sprite.worldSpace === 'world';
  const zoom = world ? camera.zoom : 1;
  const cameraX = world ? camera.position.x : 0;
  const cameraY = world ? camera.position.y : 0;
  const texture = sprite.texture;
  const source = sprite.source;
  const tint = sprite.worldTint;
  data[offset] = matrix[0] * zoom;
  data[offset + 1] = matrix[1] * zoom;
  data[offset + 2] = matrix[3] * zoom;
  data[offset + 3] = matrix[4] * zoom;
  data[offset + 4] =
    (matrix[6] - cameraX) * zoom + (world ? camera.renderOffset.x : 0);
  data[offset + 5] =
    (matrix[7] - cameraY) * zoom + (world ? camera.renderOffset.y : 0);
  data[offset + 6] = sprite.width;
  data[offset + 7] = sprite.height;
  data[offset + 8] = sprite.anchor.x;
  data[offset + 9] = sprite.anchor.y;
  data[offset + 10] = sprite.worldOpacity;
  data[offset + 11] = 0;
  data[offset + 12] = (source?.x ?? 0) / texture.width;
  data[offset + 13] = (source?.y ?? 0) / texture.height;
  data[offset + 14] = sprite.width / texture.width;
  data[offset + 15] = sprite.height / texture.height;
  data[offset + 16] = tint[0];
  data[offset + 17] = tint[1];
  data[offset + 18] = tint[2];
  data[offset + 19] = tint[3];
}

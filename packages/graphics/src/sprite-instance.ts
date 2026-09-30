import type { Sprite } from '../../core/src/sprite.js';
import type { Texture2DSource, TextureView2D } from '../../assets/src/index.js';
import type { GameObject } from '../../core/src/game-object.js';
import type { Rect2D } from '../../core/src/gameplay/contracts.js';
import { TilingSprite2D } from '../../core/src/graphics2d/tiling-sprite2d.js';

/** Unpacked local coverage and packed UV basis, shared by every native backend. */
export interface TextureQuad2D {
  x: number;
  y: number;
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
  u0: number;
  v0: number;
  ux: number;
  vx: number;
  uy: number;
  vy: number;
  trimX: number;
  trimY: number;
  trimWidth: number;
  trimHeight: number;
  resolution: number;
}

export function createTextureQuad2D(): TextureQuad2D {
  return {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    naturalWidth: 0,
    naturalHeight: 0,
    u0: 0,
    v0: 0,
    ux: 0,
    vx: 0,
    uy: 0,
    vy: 0,
    trimX: 0,
    trimY: 0,
    trimWidth: 0,
    trimHeight: 0,
    resolution: 1,
  };
}

export function getTextureQuad2D(
  texture: Texture2DSource,
  view: TextureView2D | undefined,
  source: Readonly<Rect2D> | undefined,
  out: TextureQuad2D,
): TextureQuad2D {
  if (texture.destroyed)
    throw new Error('Cannot draw a destroyed texture source.');
  if (view && view.source !== texture)
    throw new RangeError('Texture quad view must match its source.');
  view?.validate();
  const frame = view?.frame ?? source;
  const x = frame?.x ?? 0;
  const y = frame?.y ?? 0;
  const width = frame?.width ?? texture.width;
  const height = frame?.height ?? texture.height;
  if (
    source &&
    (!Number.isFinite(x + y + width + height) ||
      x < 0 ||
      y < 0 ||
      width <= 0 ||
      height <= 0 ||
      x + width > texture.width ||
      y + height > texture.height)
  )
    throw new RangeError(
      'Texture quad source must fit the current source dimensions.',
    );
  const resolution =
    view?.resolution ??
    (!source && texture.kind === 'render' ? texture.resolution : 1);
  out.resolution = resolution;
  out.naturalWidth =
    view?.width ??
    (!source && texture.kind === 'render' ? texture.logicalWidth : width);
  out.naturalHeight =
    view?.height ??
    (!source && texture.kind === 'render' ? texture.logicalHeight : height);
  out.trimX = (view?.trim.x ?? 0) / resolution;
  out.trimY = (view?.trim.y ?? 0) / resolution;
  out.trimWidth = view ? view.trim.width / resolution : out.naturalWidth;
  out.trimHeight = view ? view.trim.height / resolution : out.naturalHeight;
  out.x = out.trimX;
  out.y = out.trimY;
  out.width = out.trimWidth;
  out.height = out.trimHeight;
  if (view?.rotation === 90) {
    out.u0 = (x + width) / texture.width;
    out.v0 = y / texture.height;
    out.ux = 0;
    out.vx = height / texture.height;
    out.uy = -width / texture.width;
    out.vy = 0;
  } else {
    out.u0 = x / texture.width;
    out.v0 = y / texture.height;
    out.ux = width / texture.width;
    out.vx = 0;
    out.uy = 0;
    out.vy = height / texture.height;
  }
  return out;
}

const spriteBounds: Rect2D = { x: 0, y: 0, width: 0, height: 0 };
export function getSpriteQuad2D(
  sprite: Sprite,
  out: TextureQuad2D,
): TextureQuad2D {
  getTextureQuad2D(sprite.texture, sprite.view, sprite.source, out);
  const bounds = sprite.getLocalBounds(spriteBounds);
  if (sprite instanceof TilingSprite2D) {
    sprite.validateTileTransform();
    out.x = bounds.x;
    out.y = bounds.y;
    out.width = sprite.width;
    out.height = sprite.height;
  } else {
    const scaleX = sprite.width / out.naturalWidth;
    const scaleY = sprite.height / out.naturalHeight;
    out.x = bounds.x + out.trimX * scaleX;
    out.y = bounds.y + out.trimY * scaleY;
    out.width *= scaleX;
    out.height *= scaleY;
  }
  return out;
}

/** Root appearance is applied at composition, never baked into a reusable local cache. */
export function getRelativeAppearance2D(
  object: GameObject,
  root: GameObject | undefined,
  out: Float32Array,
): void {
  out[0] = out[1] = out[2] = out[3] = 1;
  for (
    let current: GameObject | undefined = object;
    current && current !== root;
    current = current.parent
  ) {
    const tint = current.tint;
    out[0] *= tint[0];
    out[1] *= tint[1];
    out[2] *= tint[2];
    out[3] *= tint[3] * current.opacity;
  }
}

/** Nine float32x4 attributes shared by every native quad, sprite and particle draw. */
export const QUAD_FLOATS = 36;
export const QUAD_BYTES = QUAD_FLOATS * Float32Array.BYTES_PER_ELEMENT;

import { rendering2dLimits } from '../../../../src/data/rendering2d.js';
import {
  AssetError,
  type Texture2DSource,
  type TextureView2D,
} from '../../../assets/src/index.js';
import type { Vector2 } from '../../../math/src/index.js';
import type { Rect2D } from '../gameplay/contracts.js';
import {
  GraphicsPath2D,
  type Affine2D,
} from '../graphics2d/graphics-path2d.js';

export interface Mask2DOptions {
  inverse?: boolean;
  transform?: Affine2D;
}
/** Immutable borrowed mask. Image hit testing intentionally uses bounds, never sampled pixels. */
export class Mask2D {
  readonly kind: 'rect' | 'path' | 'image';
  readonly rect: Readonly<Rect2D> | undefined;
  readonly path: GraphicsPath2D | undefined;
  readonly texture: Texture2DSource | undefined;
  readonly view: TextureView2D | undefined;
  readonly channel: 'alpha' | 'red';
  readonly inverse: boolean;
  readonly transform: Affine2D;
  private constructor(
    kind: 'rect' | 'path' | 'image',
    options: Mask2DOptions,
    rect?: Readonly<Rect2D>,
    path?: GraphicsPath2D,
    texture?: Texture2DSource,
    view?: TextureView2D,
    channel: 'alpha' | 'red' = 'alpha',
  ) {
    const transform = options.transform ?? [1, 0, 0, 1, 0, 0];
    if (
      transform.length !== 6 ||
      !transform.every(
        (v) =>
          Number.isFinite(v) && Math.abs(v) <= rendering2dLimits.coordinate,
      ) ||
      transform[0] * transform[3] - transform[1] * transform[2] === 0
    )
      throw new RangeError('Mask2D transform must be finite and invertible.');
    if (options.inverse !== undefined && typeof options.inverse !== 'boolean')
      throw new TypeError('Mask2D inverse must be boolean.');
    this.kind = kind;
    this.rect = rect;
    this.path = path;
    this.texture = texture;
    this.view = view;
    this.channel = channel;
    this.inverse = options.inverse ?? false;
    this.transform = Object.freeze([...transform]) as unknown as Affine2D;
    Object.freeze(this);
  }
  static rectangle(
    rect: Readonly<Rect2D>,
    options: Mask2DOptions = {},
  ): Mask2D {
    if (
      ![rect.x, rect.y, rect.width, rect.height].every(
        (v) =>
          Number.isFinite(v) && Math.abs(v) <= rendering2dLimits.coordinate,
      ) ||
      rect.width <= 0 ||
      rect.height <= 0
    )
      throw new RangeError('Mask2D rectangle must be bounded and positive.');
    return new Mask2D(
      'rect',
      options,
      Object.freeze({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      }),
    );
  }
  static path(path: GraphicsPath2D, options: Mask2DOptions = {}): Mask2D {
    if (!(path instanceof GraphicsPath2D))
      throw new TypeError('Mask2D.path requires GraphicsPath2D.');
    return new Mask2D('path', options, undefined, path);
  }
  static image(
    options: Mask2DOptions & {
      texture?: Texture2DSource;
      view?: TextureView2D;
      channel?: 'alpha' | 'red';
    },
  ): Mask2D {
    const texture = options.texture ?? options.view?.source,
      channel = options.channel ?? 'alpha';
    if (
      !texture ||
      texture.destroyed ||
      (options.view && options.view.source !== texture)
    )
      throw new AssetError(
        'Mask2D image requires a live matching source/view.',
      );
    if (channel !== 'alpha' && channel !== 'red')
      throw new RangeError('Mask2D channel must be alpha or red.');
    options.view?.validate();
    return new Mask2D(
      'image',
      options,
      undefined,
      undefined,
      texture,
      options.view,
      channel,
    );
  }
  containsPoint(point: Vector2): boolean {
    const [a, b, c, d, tx, ty] = this.transform,
      determinant = a * d - b * c;
    const px = point.x - tx,
      py = point.y - ty,
      x = (d * px - c * py) / determinant,
      y = (a * py - b * px) / determinant;
    let inside: boolean;
    if (this.path) inside = this.path.containsPoint(x, y);
    else {
      const rect = this.rect,
        source = this.texture;
      const left = rect?.x ?? 0,
        top = rect?.y ?? 0;
      const width =
        rect?.width ??
        this.view?.width ??
        (source?.kind === 'render' ? source.logicalWidth : source!.width);
      const height =
        rect?.height ??
        this.view?.height ??
        (source?.kind === 'render' ? source.logicalHeight : source!.height);
      inside = x >= left && x <= left + width && y >= top && y <= top + height;
    }
    return this.inverse ? !inside : inside;
  }
  getBounds(out: Rect2D = { x: 0, y: 0, width: 0, height: 0 }): Rect2D {
    const bounds = this.rect ?? this.path?.bounds;
    const source = this.texture;
    const x = bounds?.x ?? 0,
      y = bounds?.y ?? 0;
    const width =
      bounds?.width ??
      this.view?.width ??
      (source?.kind === 'render' ? source.logicalWidth : source!.width);
    const height =
      bounds?.height ??
      this.view?.height ??
      (source?.kind === 'render' ? source.logicalHeight : source!.height);
    const [a, b, c, d, tx, ty] = this.transform;
    let left = Infinity,
      top = Infinity,
      right = -Infinity,
      bottom = -Infinity;
    for (let corner = 0; corner < 4; corner++) {
      const px = x + (corner & 1 ? width : 0),
        py = y + (corner & 2 ? height : 0),
        wx = a * px + c * py + tx,
        wy = b * px + d * py + ty;
      left = Math.min(left, wx);
      top = Math.min(top, wy);
      right = Math.max(right, wx);
      bottom = Math.max(bottom, wy);
    }
    out.x = left;
    out.y = top;
    out.width = right - left;
    out.height = bottom - top;
    return out;
  }
}

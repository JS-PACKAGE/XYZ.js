import { rendering2dLimits } from '../../../../src/data/rendering2d.js';
import {
  AssetError,
  type Texture2DSource,
  type TextureView2D,
} from '../../../assets/src/index.js';
import { Vector2 } from '../../../math/src/index.js';
import { GameObject } from '../game-object.js';
import type { ColorRGBA, Rect2D } from '../gameplay/contracts.js';
import { Geometry2D } from './geometry2d.js';

export interface Mesh2DOptions {
  geometry: Geometry2D;
  texture?: Texture2DSource;
  view?: TextureView2D;
  position?: [number, number];
  rotation?: number;
  scale?: [number, number];
  opacity?: number;
  visible?: boolean;
  zIndex?: number;
  tint?: ColorRGBA;
  space?: 'world' | 'screen';
}

/** Unlit indexed 2D mesh; geometry and texture are borrowed, never destroyed here. */
export class Mesh2D extends GameObject {
  readonly geometry: Geometry2D;
  private image: Texture2DSource;
  private frame: TextureView2D | undefined;
  private readonly hitPoint = new Vector2();
  renderEnabled = true;

  constructor(options: Mesh2DOptions) {
    super();
    if (!(options.geometry instanceof Geometry2D))
      throw new TypeError('Mesh2D requires Geometry2D.');
    options.geometry.validate();
    const source = options.texture ?? options.view?.source;
    if (
      !source ||
      source.destroyed ||
      (options.view && options.view.source !== source)
    )
      throw new AssetError('Mesh2D requires a live matching source/view.');
    options.view?.validate();
    this.geometry = options.geometry;
    this.image = source;
    this.frame = options.view;
    if (options.position) this.position = new Vector2(...options.position);
    if (options.scale) this.scale = new Vector2(...options.scale);
    this.rotation = options.rotation ?? 0;
    this.opacity = options.opacity ?? 1;
    this.visible = options.visible ?? true;
    this.zIndex = options.zIndex ?? 0;
    if (options.tint) this.tint = options.tint;
    if (options.space) this.space = options.space;
  }

  get texture(): Texture2DSource {
    return this.image;
  }
  set texture(value: Texture2DSource) {
    if (
      !value ||
      value.destroyed ||
      (this.frame && this.frame.source !== value)
    )
      throw new AssetError('Mesh2D texture must match its live view.');
    this.image = value;
  }
  get view(): TextureView2D | undefined {
    return this.frame;
  }
  set view(value: TextureView2D | undefined) {
    value?.validate();
    if (value) this.image = value.source;
    this.frame = value;
  }
  override getLocalBounds(out?: Rect2D): Rect2D {
    return this.geometry.getBounds(out);
  }
  override containsPoint(point: Vector2): boolean {
    if (this.hitTestMode === 'collider') return super.containsPoint(point);
    try {
      this.toLocal(point, this.hitPoint);
    } catch (error) {
      if (error instanceof RangeError) return false;
      throw error;
    }
    return this.geometry.containsPoint(this.hitPoint.x, this.hitPoint.y);
  }
}

export interface Plane2DOptions extends Omit<Mesh2DOptions, 'geometry'> {
  width: number;
  height: number;
  columns?: number;
  rows?: number;
}
export class Plane2D extends Mesh2D {
  constructor(options: Plane2DOptions) {
    const columns = options.columns ?? 1,
      rows = options.rows ?? 1;
    if (
      !Number.isInteger(columns) ||
      !Number.isInteger(rows) ||
      columns < 1 ||
      rows < 1 ||
      (columns + 1) * (rows + 1) > rendering2dLimits.meshVertices ||
      columns * rows * 6 > rendering2dLimits.meshIndices ||
      !Number.isFinite(options.width) ||
      !Number.isFinite(options.height) ||
      options.width <= 0 ||
      options.height <= 0 ||
      options.width > rendering2dLimits.coordinate ||
      options.height > rendering2dLimits.coordinate
    )
      throw new RangeError(
        'Plane2D requires positive dimensions and bounded subdivisions.',
      );
    const positions: number[] = [],
      uvs: number[] = [],
      indices: number[] = [];
    for (let y = 0; y <= rows; y++)
      for (let x = 0; x <= columns; x++) {
        positions.push(
          (x / columns) * options.width,
          (y / rows) * options.height,
        );
        uvs.push(x / columns, y / rows);
      }
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < columns; x++) {
        const a = y * (columns + 1) + x,
          b = a + 1,
          c = a + columns + 1;
        indices.push(a, b, c, b, c + 1, c);
      }
    super({
      ...options,
      geometry: new Geometry2D({ positions, uvs, indices }),
    });
  }
}

export interface Rope2DOptions extends Omit<Mesh2DOptions, 'geometry'> {
  points: readonly (readonly [number, number])[];
  width: number;
  textureMode?: 'stretch' | 'repeat';
  repeatLength?: number;
}
/** Averaged-normal joins; consecutive duplicate points are rejected rather than inventing a tangent. */
export class Rope2D extends Mesh2D {
  readonly width: number;
  readonly textureMode: 'stretch' | 'repeat';
  readonly repeatLength: number;
  constructor(options: Rope2DOptions) {
    const width = options.width,
      mode = options.textureMode ?? 'stretch',
      repeat = options.repeatLength ?? width;
    if (
      !Number.isFinite(width) ||
      width <= 0 ||
      !Number.isFinite(repeat) ||
      repeat <= 0 ||
      (mode !== 'stretch' && mode !== 'repeat')
    )
      throw new RangeError('Invalid Rope2D width or texture policy.');
    super({
      ...options,
      geometry: Rope2D.makeGeometry(options.points, width, mode, repeat),
    });
    this.width = width;
    this.textureMode = mode;
    this.repeatLength = repeat;
  }
  setPoints(points: readonly (readonly [number, number])[]): void {
    const next = Rope2D.makeGeometry(
      points,
      this.width,
      this.textureMode,
      this.repeatLength,
    );
    if (next.positions.length !== this.geometry.positions.length)
      throw new RangeError('Rope2D point count cannot change.');
    this.geometry.positions.set(next.positions);
    this.geometry.uvs.set(next.uvs);
    this.geometry.markUpdated();
  }
  private static makeGeometry(
    points: readonly (readonly [number, number])[],
    width: number,
    mode: 'stretch' | 'repeat',
    repeat: number,
  ): Geometry2D {
    if (
      points.length < 2 ||
      points.length * 2 > rendering2dLimits.meshVertices ||
      (points.length - 1) * 6 > rendering2dLimits.meshIndices ||
      points.some(
        (p) =>
          p.length !== 2 ||
          !p.every(
            (v) =>
              Number.isFinite(v) && Math.abs(v) <= rendering2dLimits.coordinate,
          ),
      )
    )
      throw new RangeError('Rope2D requires bounded finite points.');
    const lengths = [0];
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1]!,
        b = points[i]!,
        distance = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (distance === 0)
        throw new RangeError('Rope2D consecutive points must differ.');
      lengths.push(lengths[i - 1]! + distance);
    }
    const positions: number[] = [],
      uvs: number[] = [],
      indices: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const point = points[i]!,
        previous = points[Math.max(0, i - 1)]!,
        next = points[Math.min(points.length - 1, i + 1)]!;
      let dx = next[0] - previous[0],
        dy = next[1] - previous[1];
      const length = Math.hypot(dx, dy);
      if (length === 0)
        throw new RangeError('Rope2D reversing joins are degenerate.');
      dx = ((dx / length) * width) / 2;
      dy = ((dy / length) * width) / 2;
      positions.push(
        point[0] - dy,
        point[1] + dx,
        point[0] + dy,
        point[1] - dx,
      );
      const u =
        lengths[i]! /
        (mode === 'repeat' ? repeat : lengths[lengths.length - 1]!);
      uvs.push(u, 0, u, 1);
      if (i + 1 < points.length) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    return new Geometry2D({ positions, uvs, indices });
  }
}

export interface PerspectiveQuad2DOptions extends Omit<
  Mesh2DOptions,
  'geometry'
> {
  corners: readonly (readonly [number, number])[];
}
/** True projective interpolation: native backends interpolate (uv*q,q) and divide. */
export class PerspectiveQuad2D extends Mesh2D {
  constructor(options: PerspectiveQuad2DOptions) {
    super({
      ...options,
      geometry: PerspectiveQuad2D.makeGeometry(options.corners),
    });
  }
  setCorners(corners: readonly (readonly [number, number])[]): void {
    const next = PerspectiveQuad2D.makeGeometry(corners);
    this.geometry.positions.set(next.positions);
    this.geometry.uvQ.set(next.uvQ);
    this.geometry.markUpdated();
  }
  private static makeGeometry(
    corners: readonly (readonly [number, number])[],
  ): Geometry2D {
    if (
      corners.length !== 4 ||
      corners.some(
        (p) =>
          p.length !== 2 ||
          !p.every(
            (v) =>
              Number.isFinite(v) && Math.abs(v) <= rendering2dLimits.coordinate,
          ),
      )
    )
      throw new RangeError(
        'PerspectiveQuad2D requires four bounded finite corners in perimeter order.',
      );
    // Validate the actual Float32 payload too: rounding must not collapse a valid input quad.
    corners = corners.map(
      (point) => [Math.fround(point[0]), Math.fround(point[1])] as const,
    );
    let sign = 0;
    for (let i = 0; i < 4; i++) {
      const a = corners[i]!,
        b = corners[(i + 1) % 4]!,
        c = corners[(i + 2) % 4]!;
      const cross =
        (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
      if (
        cross === 0 ||
        !Number.isFinite(cross) ||
        (sign && Math.sign(cross) !== sign)
      )
        throw new RangeError(
          'PerspectiveQuad2D must be strictly convex and nondegenerate.',
        );
      sign = Math.sign(cross);
    }
    const [a, b, c, d] = corners as readonly [
      readonly [number, number],
      readonly [number, number],
      readonly [number, number],
      readonly [number, number],
    ];
    const dx1 = b[0] - c[0],
      dx2 = d[0] - c[0],
      dx3 = a[0] - b[0] + c[0] - d[0];
    const dy1 = b[1] - c[1],
      dy2 = d[1] - c[1],
      dy3 = a[1] - b[1] + c[1] - d[1];
    const determinant = dx1 * dy2 - dx2 * dy1;
    if (determinant === 0 || !Number.isFinite(determinant))
      throw new RangeError('PerspectiveQuad2D has a singular homography.');
    const g = (dx3 * dy2 - dx2 * dy3) / determinant,
      h = (dx1 * dy3 - dx3 * dy1) / determinant;
    const denominators = [1, 1 + g, 1 + g + h, 1 + h];
    if (denominators.some((q) => !Number.isFinite(q) || q <= 1e-8))
      throw new RangeError(
        'PerspectiveQuad2D crosses its homogeneous horizon.',
      );
    return new Geometry2D({
      positions: corners.flatMap((p) => [p[0], p[1]]),
      uvs: [0, 0, 1, 0, 1, 1, 0, 1],
      uvQ: denominators.map((q) => 1 / q),
      indices: [0, 1, 2, 0, 2, 3],
    });
  }
}

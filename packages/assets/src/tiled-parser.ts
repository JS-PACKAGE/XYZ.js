import { tiledLimits } from '../../../src/data/tiled.js';

export class TiledError extends Error {
  constructor(
    readonly path: string,
    message: string,
  ) {
    super(`Tiled ${path}: ${message}`);
    this.name = 'TiledError';
  }
}
export type TiledProperties = Readonly<
  Record<string, string | number | boolean>
>;
export interface TiledObject {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  properties: TiledProperties;
  polygon?: readonly (readonly [number, number])[];
  ellipse: boolean;
}
export interface TiledLayer {
  id: number;
  name: string;
  type: 'tilelayer' | 'objectgroup';
  opacity: number;
  visible: boolean;
  x: number;
  y: number;
  properties: TiledProperties;
  data: readonly number[];
  objects: readonly TiledObject[];
}
export interface TiledTileset {
  firstgid: number;
  name: string;
  image: string;
  tileWidth: number;
  tileHeight: number;
  imageWidth: number;
  imageHeight: number;
  columns: number;
  tileCount: number;
  margin: number;
  spacing: number;
  properties: TiledProperties;
  tiles: ReadonlyMap<number, TiledProperties>;
}
export interface TiledMapData {
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  properties: TiledProperties;
  layers: readonly TiledLayer[];
  tilesets: readonly TiledTileset[];
}
type Obj = Record<string, unknown>;
export function tiledRecord(value: unknown, path: string): Obj {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new TiledError(path, 'expected an object');
  return value as Obj;
}
function number(o: Obj, key: string, path: string, fallback?: number): number {
  const v = o[key] ?? fallback;
  if (typeof v !== 'number' || !Number.isFinite(v))
    throw new TiledError(`${path}.${key}`, 'expected a finite number');
  return v;
}
function integer(
  o: Obj,
  key: string,
  path: string,
  min = 0,
  fallback?: number,
): number {
  const v = number(o, key, path, fallback);
  if (!Number.isSafeInteger(v) || v < min)
    throw new TiledError(`${path}.${key}`, `expected an integer >= ${min}`);
  return v;
}
function text(o: Obj, key: string, path: string, fallback?: string): string {
  const v = o[key] ?? fallback;
  if (typeof v !== 'string')
    throw new TiledError(`${path}.${key}`, 'expected a string');
  return v;
}
function bool(o: Obj, key: string, path: string, fallback: boolean): boolean {
  const v = o[key] ?? fallback;
  if (typeof v !== 'boolean')
    throw new TiledError(`${path}.${key}`, 'expected a boolean');
  return v;
}
function array(value: unknown, path: string, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max)
    throw new TiledError(path, `expected an array of at most ${max} entries`);
  return value;
}
function unsupported(o: Obj, keys: string[], path: string): void {
  for (const k of keys)
    if (o[k] !== undefined)
      throw new TiledError(`${path}.${k}`, 'unsupported feature');
}
function properties(value: unknown, path: string): TiledProperties {
  const out: Record<string, string | number | boolean> = Object.create(
    null,
  ) as Record<string, string | number | boolean>;
  for (const [i, raw] of array(
    value ?? [],
    path,
    tiledLimits.properties,
  ).entries()) {
    const p = tiledRecord(raw, `${path}[${i}]`);
    const name = text(p, 'name', path);
    const type = text(p, 'type', path, 'string');
    if (!['string', 'bool', 'int', 'float', 'color', 'file'].includes(type))
      throw new TiledError(path, `unsupported property type ${type}`);
    const v = p.value;
    if (
      (type === 'bool' && typeof v !== 'boolean') ||
      (['int', 'float'].includes(type) &&
        (typeof v !== 'number' ||
          !Number.isFinite(v) ||
          (type === 'int' && !Number.isSafeInteger(v)))) ||
      (['string', 'color', 'file'].includes(type) && typeof v !== 'string')
    )
      throw new TiledError(path, 'invalid property value');
    if (Object.hasOwn(out, name))
      throw new TiledError(path, `duplicate property ${name}`);
    out[name] = v as string | number | boolean;
  }
  return Object.freeze(out);
}
export function parseTiledTileset(
  value: unknown,
  firstgid: number,
  path = 'tileset',
): TiledTileset {
  const o = tiledRecord(value, path);
  unsupported(
    o,
    ['source', 'tileoffset', 'grid', 'wangsets', 'terrains', 'transformations'],
    path,
  );
  const tileWidth = integer(o, 'tilewidth', path, 1),
    tileHeight = integer(o, 'tileheight', path, 1),
    columns = integer(o, 'columns', path, 1),
    tileCount = integer(o, 'tilecount', path, 1);
  if (tileCount > tiledLimits.tiles || firstgid + tileCount > 0x10000000)
    throw new TiledError(path, 'tileset exceeds GID/frame budget');
  const tiles = new Map<number, TiledProperties>();
  for (const raw of array(o.tiles ?? [], `${path}.tiles`, tiledLimits.tiles)) {
    const t = tiledRecord(raw, path);
    unsupported(
      t,
      ['animation', 'objectgroup', 'image', 'imagewidth', 'imageheight'],
      path,
    );
    const id = integer(t, 'id', path);
    if (id >= tileCount || tiles.has(id))
      throw new TiledError(path, 'invalid/duplicate tile ID');
    tiles.set(id, properties(t.properties, `${path}.tile.properties`));
  }
  const imageWidth = integer(o, 'imagewidth', path, 1),
    imageHeight = integer(o, 'imageheight', path, 1),
    margin = integer(o, 'margin', path, 0, 0),
    spacing = integer(o, 'spacing', path, 0, 0);
  if (
    2 * margin + columns * tileWidth + (columns - 1) * spacing > imageWidth ||
    2 * margin +
      Math.ceil(tileCount / columns) * tileHeight +
      (Math.ceil(tileCount / columns) - 1) * spacing >
      imageHeight
  )
    throw new TiledError(path, 'atlas regions exceed image dimensions');
  return Object.freeze({
    firstgid,
    name: text(o, 'name', path, ''),
    image: text(o, 'image', path),
    tileWidth,
    tileHeight,
    columns,
    tileCount,
    imageWidth,
    imageHeight,
    margin,
    spacing,
    properties: properties(o.properties, `${path}.properties`),
    tiles,
  });
}
export function parseTiledMap(
  value: unknown,
  tilesets: readonly TiledTileset[],
): TiledMapData {
  const o = tiledRecord(value, 'map');
  if (o.orientation !== 'orthogonal')
    throw new TiledError(
      'map.orientation',
      'only orthogonal maps are supported',
    );
  if (o.infinite !== false)
    throw new TiledError(
      'map.infinite',
      'only bounded finite maps are supported',
    );
  if (o.renderorder !== undefined && o.renderorder !== 'right-down')
    throw new TiledError('map.renderorder', 'only right-down is supported');
  unsupported(o, ['chunks'], 'map');
  const width = integer(o, 'width', 'map', 1),
    height = integer(o, 'height', 'map', 1),
    tileWidth = integer(o, 'tilewidth', 'map', 1),
    tileHeight = integer(o, 'tileheight', 'map', 1);
  if (width * height > tiledLimits.cells)
    throw new TiledError('map', 'cell budget exceeded');
  if (!tilesets.length || tilesets.length > tiledLimits.tilesets)
    throw new TiledError('map.tilesets', 'invalid tileset count');
  let end = 0;
  for (const ts of tilesets) {
    if (ts.firstgid < end || ts.firstgid < 1)
      throw new TiledError(
        'map.tilesets',
        'overlapping or unsorted GID ranges',
      );
    end = ts.firstgid + ts.tileCount;
    if (ts.tileWidth !== tileWidth || ts.tileHeight !== tileHeight)
      throw new TiledError(
        'map.tilesets',
        'tile dimensions must match the map',
      );
  }
  let cells = 0,
    objects = 0;
  const ids = new Set<number>();
  const layers = array(o.layers, 'map.layers', tiledLimits.layers).map(
    (raw, index): TiledLayer => {
      const path = `map.layers[${index}]`,
        l = tiledRecord(raw, path);
      unsupported(
        l,
        ['chunks', 'encoding', 'compression', 'startx', 'starty'],
        path,
      );
      if (l.type !== 'tilelayer' && l.type !== 'objectgroup')
        throw new TiledError(
          `${path}.type`,
          `unsupported layer ${String(l.type)}`,
        );
      for (const k of ['parallaxx', 'parallaxy'])
        if (l[k] !== undefined && l[k] !== 1)
          throw new TiledError(`${path}.${k}`, 'parallax is unsupported');
      const id = integer(l, 'id', path, 1);
      if (ids.has(id)) throw new TiledError(path, 'duplicate layer ID');
      ids.add(id);
      const opacity = number(l, 'opacity', path, 1);
      if (opacity < 0 || opacity > 1)
        throw new TiledError(path, 'opacity must be in [0,1]');
      let data: number[] = [];
      const parsedObjects: TiledObject[] = [];
      if (l.type === 'tilelayer') {
        if (
          integer(l, 'width', path, 1) !== width ||
          integer(l, 'height', path, 1) !== height
        )
          throw new TiledError(path, 'layer dimensions must match map');
        const a = array(l.data, `${path}.data`, tiledLimits.cells);
        cells += a.length;
        if (a.length !== width * height || cells > tiledLimits.cells)
          throw new TiledError(path, 'cell count/budget mismatch');
        data = a.map((gid, i) => {
          if (
            typeof gid !== 'number' ||
            !Number.isInteger(gid) ||
            gid < 0 ||
            gid > 0xffffffff
          )
            throw new TiledError(`${path}.data[${i}]`, 'expected uint32 GID');
          if ((gid & 0x10000000) !== 0)
            throw new TiledError(
              path,
              'hexagonal rotation GID flag is unsupported',
            );
          const base = gid & 0x0fffffff;
          if (
            (base === 0 && gid !== 0) ||
            (base !== 0 &&
              !tilesets.some(
                (t) => base >= t.firstgid && base < t.firstgid + t.tileCount,
              ))
          )
            throw new TiledError(path, `unresolved GID ${gid}`);
          return gid;
        });
      } else
        for (const [i, rawObject] of array(
          l.objects,
          `${path}.objects`,
          tiledLimits.objects,
        ).entries()) {
          if (++objects > tiledLimits.objects)
            throw new TiledError(path, 'object budget exceeded');
          const p = `${path}.objects[${i}]`,
            ob = tiledRecord(rawObject, p);
          unsupported(ob, ['gid', 'template', 'text', 'polyline', 'point'], p);
          const w = number(ob, 'width', p, 0),
            h = number(ob, 'height', p, 0),
            ellipse = bool(ob, 'ellipse', p, false);
          let polygon: [number, number][] | undefined;
          if (ob.polygon !== undefined)
            polygon = array(ob.polygon, `${p}.polygon`, 32).map((v) => {
              const point = tiledRecord(v, p);
              return [number(point, 'x', p), number(point, 'y', p)];
            });
          if (
            polygon
              ? polygon.length < 3
              : w <= 0 || h <= 0 || (ellipse && w !== h)
          )
            throw new TiledError(
              p,
              'requires a rectangle, circle, or convex polygon',
            );
          parsedObjects.push(
            Object.freeze({
              id: integer(ob, 'id', p, 1),
              name: text(ob, 'name', p, ''),
              x: number(ob, 'x', p),
              y: number(ob, 'y', p),
              width: w,
              height: h,
              rotation: number(ob, 'rotation', p, 0),
              visible: bool(ob, 'visible', p, true),
              ellipse,
              polygon,
              properties: properties(ob.properties, `${p}.properties`),
            }),
          );
        }
      return Object.freeze({
        id,
        name: text(l, 'name', path, ''),
        type: l.type,
        opacity,
        visible: bool(l, 'visible', path, true),
        x: number(l, 'offsetx', path, 0) + number(l, 'x', path, 0) * tileWidth,
        y: number(l, 'offsety', path, 0) + number(l, 'y', path, 0) * tileHeight,
        properties: properties(l.properties, `${path}.properties`),
        data: Object.freeze(data),
        objects: Object.freeze(parsedObjects),
      });
    },
  );
  return Object.freeze({
    width,
    height,
    tileWidth,
    tileHeight,
    properties: properties(o.properties, 'map.properties'),
    layers: Object.freeze(layers),
    tilesets: Object.freeze([...tilesets]),
  });
}

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
  type: 'tilelayer' | 'objectgroup' | 'group' | 'imagelayer';
  opacity: number;
  visible: boolean;
  x: number;
  y: number;
  properties: TiledProperties;
  data: readonly number[];
  objects: readonly TiledObject[];
  parentId?: number;
  parallaxX?: number;
  parallaxY?: number;
  image?: string;
  repeatX?: boolean;
  repeatY?: boolean;
  chunks?: readonly TiledChunk[];
}
export interface TiledChunk {
  x: number;
  y: number;
  width: number;
  height: number;
  data: readonly number[];
}
export interface TiledAnimationFrame {
  tileid: number;
  /** Tiled durations are milliseconds. */
  duration: number;
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
  animations?: ReadonlyMap<number, readonly TiledAnimationFrame[]>;
}
export interface TiledMapData {
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  properties: TiledProperties;
  layers: readonly TiledLayer[];
  tilesets: readonly TiledTileset[];
  infinite?: boolean;
  parallaxOriginX?: number;
  parallaxOriginY?: number;
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
  const animations = new Map<number, readonly TiledAnimationFrame[]>();
  let animationFrames = 0;
  for (const raw of array(o.tiles ?? [], `${path}.tiles`, tiledLimits.tiles)) {
    const t = tiledRecord(raw, path);
    unsupported(t, ['objectgroup', 'image', 'imagewidth', 'imageheight'], path);
    const id = integer(t, 'id', path);
    if (id >= tileCount || tiles.has(id))
      throw new TiledError(path, 'invalid/duplicate tile ID');
    tiles.set(id, properties(t.properties, `${path}.tile.properties`));
    if (t.animation !== undefined) {
      const frames = array(t.animation, `${path}.animation`, tiledLimits.tiles);
      if (
        !frames.length ||
        (animationFrames += frames.length) > tiledLimits.tiles
      )
        throw new TiledError(path, 'animation frame budget exceeded');
      animations.set(
        id,
        Object.freeze(
          frames.map((raw) => {
            const frame = tiledRecord(raw, `${path}.animation`);
            const tileid = integer(frame, 'tileid', path);
            const duration = integer(frame, 'duration', path, 1);
            if (tileid >= tileCount)
              throw new TiledError(path, 'unresolved animation tile');
            return Object.freeze({ tileid, duration });
          }),
        ),
      );
    }
  }
  const imageWidth = integer(o, 'imagewidth', path, 1),
    imageHeight = integer(o, 'imageheight', path, 1),
    margin = integer(o, 'margin', path, 0, 0),
    spacing = integer(o, 'spacing', path, 0, 0);
  if (
    !Number.isSafeInteger(imageWidth * imageHeight * 4) ||
    imageWidth * imageHeight * 4 > tiledLimits.imageBytes
  )
    throw new TiledError(path, 'decoded atlas image byte budget exceeded');
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
    animations,
  });
}
function chunkBound(
  chunks: readonly TiledChunk[],
  value: number,
  axis: 'x' | 'y',
): number {
  let low = 0,
    high = chunks.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (chunks[middle]![axis] < value) low = middle + 1;
    else high = middle;
  }
  return low;
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
  const infinite = bool(o, 'infinite', 'map', false);
  if (o.renderorder !== undefined && o.renderorder !== 'right-down')
    throw new TiledError('map.renderorder', 'only right-down is supported');
  const width = integer(o, 'width', 'map', infinite ? 0 : 1),
    height = integer(o, 'height', 'map', infinite ? 0 : 1),
    tileWidth = integer(o, 'tilewidth', 'map', 1),
    tileHeight = integer(o, 'tileheight', 'map', 1);
  if (!infinite && width * height > tiledLimits.cells)
    throw new TiledError('map', 'cell budget exceeded');
  if (tilesets.length > tiledLimits.tilesets)
    throw new TiledError('map.tilesets', 'invalid tileset count');
  let end = 0,
    frames = 0;
  const gidRanges: number[] = [];
  for (const ts of tilesets) {
    frames += ts.tileCount;
    if (frames > tiledLimits.tiles)
      throw new TiledError(
        'map.tilesets',
        'aggregate atlas frame budget exceeded',
      );
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
    // Adjacent atlases form one valid interval; only gaps matter to GID validation.
    if (gidRanges.length && gidRanges[gidRanges.length - 1] === ts.firstgid)
      gidRanges[gidRanges.length - 1] = end;
    else gidRanges.push(ts.firstgid, end);
  }
  // Ranges were checked in ascending, non-overlapping order above.
  const resolvesGid = (gid: number): boolean => {
    let low = 0,
      high = (gidRanges.length >>> 1) - 1;
    while (low <= high) {
      const middle = (low + high) >>> 1;
      const offset = middle * 2;
      if (gid < gidRanges[offset]!) high = middle - 1;
      else if (gid >= gidRanges[offset + 1]!) low = middle + 1;
      else return true;
    }
    return false;
  };
  let cells = 0,
    objects = 0;
  const ids = new Set<number>(),
    objectIds = new Set<number>();
  const layers: TiledLayer[] = [];
  const gids = (
    value: unknown,
    count: number,
    path: string,
  ): readonly number[] => {
    if (
      !Number.isSafeInteger(count) ||
      count <= 0 ||
      (cells += count) > tiledLimits.cells
    )
      throw new TiledError(path, 'cell count/budget mismatch');
    const values =
      typeof value === 'string'
        ? decodeTiledBase64(value, count, path)
        : array(value, path, tiledLimits.cells);
    if (values.length !== count)
      throw new TiledError(path, 'cell count/budget mismatch');
    return Object.freeze(
      values.map((gid, i) => {
        if (
          typeof gid !== 'number' ||
          !Number.isInteger(gid) ||
          gid < 0 ||
          gid > 0xffffffff
        )
          throw new TiledError(`${path}[${i}]`, 'expected uint32 GID');
        if (gid & 0x10000000)
          throw new TiledError(
            path,
            'hexagonal rotation GID flag is unsupported',
          );
        const base = gid & 0x0fffffff;
        if ((!base && gid) || (base && !resolvesGid(base)))
          throw new TiledError(path, `unresolved GID ${gid}`);
        return gid;
      }),
    );
  };
  const visit = (
    value: unknown,
    prefix: string,
    parentId?: number,
    parentPX = 1,
    parentPY = 1,
  ): void => {
    for (const [index, raw] of array(
      value,
      prefix,
      tiledLimits.layers,
    ).entries()) {
      const path = `${prefix}[${index}]`,
        l = tiledRecord(raw, path);
      if (layers.length >= tiledLimits.layers)
        throw new TiledError(path, 'layer budget exceeded');
      if (
        !['tilelayer', 'objectgroup', 'group', 'imagelayer'].includes(
          String(l.type),
        )
      )
        throw new TiledError(
          `${path}.type`,
          `unsupported layer ${String(l.type)}`,
        );
      const id = integer(l, 'id', path, 1);
      if (ids.has(id)) throw new TiledError(path, 'duplicate layer ID');
      ids.add(id);
      const opacity = number(l, 'opacity', path, 1);
      if (opacity < 0 || opacity > 1)
        throw new TiledError(path, 'opacity must be in [0,1]');
      const parallaxX = parentPX * number(l, 'parallaxx', path, 1),
        parallaxY = parentPY * number(l, 'parallaxy', path, 1);
      if (!Number.isFinite(parallaxX) || !Number.isFinite(parallaxY))
        throw new TiledError(path, 'parallax overflow');
      let data: readonly number[] = [],
        chunks: TiledChunk[] | undefined;
      const parsedObjects: TiledObject[] = [];
      if (l.type === 'tilelayer') {
        if (typeof l.data === 'string' && l.encoding !== 'base64')
          throw new TiledError(
            `${path}.encoding`,
            'string data requires base64 encoding',
          );
        if (l.encoding !== undefined && l.encoding !== 'base64')
          throw new TiledError(
            `${path}.encoding`,
            'only base64 encoding is supported',
          );
        if (l.compression !== undefined && l.compression !== '')
          throw new TiledError(
            `${path}.compression`,
            'compressed data requires loadTiledMap',
          );
        if (infinite) {
          chunks = [];
          // Sorted axis indexes bound possible overlaps without scanning every prior
          // chunk. Use the narrower interval, including for vertical chunk strips.
          const byX: TiledChunk[] = [],
            byY: TiledChunk[] = [];
          let maxWidth = 0,
            maxHeight = 0;
          for (const rawChunk of array(
            l.chunks,
            `${path}.chunks`,
            tiledLimits.chunks,
          )) {
            const c = tiledRecord(rawChunk, `${path}.chunks`);
            if (typeof c.data === 'string' && l.encoding !== 'base64')
              throw new TiledError(
                path,
                'string chunk data requires base64 encoding',
              );
            const x = integer(c, 'x', path, -Number.MAX_SAFE_INTEGER),
              y = integer(c, 'y', path, -Number.MAX_SAFE_INTEGER),
              cw = integer(c, 'width', path, 1),
              ch = integer(c, 'height', path, 1);
            if (
              ![x * tileWidth, y * tileHeight, x + cw, y + ch].every(
                Number.isSafeInteger,
              )
            )
              throw new TiledError(path, 'chunk coordinates exceed safe range');
            const xAt = chunkBound(byX, x, 'x'),
              yAt = chunkBound(byY, y, 'y'),
              x0 = chunkBound(byX, x - maxWidth, 'x'),
              x1 = chunkBound(byX, x + cw, 'x'),
              y0 = chunkBound(byY, y - maxHeight, 'y'),
              y1 = chunkBound(byY, y + ch, 'y');
            const useX = x1 - x0 <= y1 - y0,
              candidates = useX ? byX : byY,
              stop = useX ? x1 : y1;
            let overlaps = false;
            for (let i = useX ? x0 : y0; i < stop; i++) {
              const other = candidates[i]!;
              if (
                x < other.x + other.width &&
                x + cw > other.x &&
                y < other.y + other.height &&
                y + ch > other.y
              ) {
                overlaps = true;
                break;
              }
            }
            if (overlaps) throw new TiledError(path, 'overlapping chunks');
            chunks.push(
              Object.freeze({
                x,
                y,
                width: cw,
                height: ch,
                data: gids(c.data, cw * ch, `${path}.chunks.data`),
              }),
            );
            const chunk = chunks[chunks.length - 1]!;
            byX.splice(xAt, 0, chunk);
            byY.splice(yAt, 0, chunk);
            maxWidth = Math.max(maxWidth, cw);
            maxHeight = Math.max(maxHeight, ch);
          }
        } else {
          unsupported(l, ['chunks'], path);
          if (
            integer(l, 'width', path, 1) !== width ||
            integer(l, 'height', path, 1) !== height
          )
            throw new TiledError(path, 'layer dimensions must match map');
          data = gids(l.data, width * height, `${path}.data`);
        }
      } else if (l.type === 'objectgroup') {
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
          const objectId = integer(ob, 'id', p, 1);
          if (objectIds.has(objectId))
            throw new TiledError(p, 'duplicate object ID');
          objectIds.add(objectId);
          const w = number(ob, 'width', p, 0),
            h = number(ob, 'height', p, 0),
            ellipse = bool(ob, 'ellipse', p, false);
          const polygon =
            ob.polygon === undefined
              ? undefined
              : array(ob.polygon, `${p}.polygon`, 32).map((v) => {
                  const point = tiledRecord(v, p);
                  return Object.freeze([
                    number(point, 'x', p),
                    number(point, 'y', p),
                  ] as const);
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
              id: objectId,
              name: text(ob, 'name', p, ''),
              x: number(ob, 'x', p),
              y: number(ob, 'y', p),
              width: w,
              height: h,
              rotation: number(ob, 'rotation', p, 0),
              visible: bool(ob, 'visible', p, true),
              ellipse,
              polygon: polygon && Object.freeze(polygon),
              properties: properties(ob.properties, `${p}.properties`),
            }),
          );
        }
      }
      if (l.type === 'imagelayer') unsupported(l, ['transparentcolor'], path);
      layers.push(
        Object.freeze({
          id,
          parentId,
          name: text(l, 'name', path, ''),
          type: l.type as TiledLayer['type'],
          opacity,
          visible: bool(l, 'visible', path, true),
          x:
            number(l, 'offsetx', path, 0) +
            number(l, 'x', path, 0) * (l.type === 'tilelayer' ? tileWidth : 1),
          y:
            number(l, 'offsety', path, 0) +
            number(l, 'y', path, 0) * (l.type === 'tilelayer' ? tileHeight : 1),
          parallaxX,
          parallaxY,
          ...(l.type === 'imagelayer'
            ? {
                image: text(l, 'image', path),
                repeatX: bool(l, 'repeatx', path, false),
                repeatY: bool(l, 'repeaty', path, false),
              }
            : {}),
          properties: properties(l.properties, `${path}.properties`),
          data,
          chunks: chunks && Object.freeze(chunks),
          objects: Object.freeze(parsedObjects),
        }),
      );
      if (l.type === 'group')
        visit(l.layers, `${path}.layers`, id, parallaxX, parallaxY);
    }
  };
  visit(o.layers, 'map.layers');
  return Object.freeze({
    width,
    height,
    tileWidth,
    tileHeight,
    infinite,
    parallaxOriginX: number(o, 'parallaxoriginx', 'map', 0),
    parallaxOriginY: number(o, 'parallaxoriginy', 'map', 0),
    properties: properties(o.properties, 'map.properties'),
    layers: Object.freeze(layers),
    tilesets: Object.freeze([...tilesets]),
  });
}

/** Strict, bounded uint32 little-endian data for the synchronous parser. */
export function decodeTiledBase64(
  value: string,
  count: number,
  path: string,
): number[] {
  if (!Number.isSafeInteger(count) || count <= 0 || count > tiledLimits.cells)
    throw new TiledError(path, 'cell budget exceeded');
  const bytes = tiledBase64Bytes(value, count * 4, path);
  if (bytes.byteLength !== count * 4)
    throw new TiledError(path, 'decoded cell count mismatch');
  const cells: number[] = [];
  for (let i = 0; i < bytes.length; i += 4)
    cells.push(
      (bytes[i]! |
        (bytes[i + 1]! << 8) |
        (bytes[i + 2]! << 16) |
        (bytes[i + 3]! << 24)) >>>
        0,
    );
  return cells;
}

export function tiledBase64Bytes(
  value: string,
  maxBytes: number,
  path: string,
): Uint8Array<ArrayBuffer> {
  if (value.length > Math.ceil(maxBytes / 3) * 4 + 4096)
    throw new TiledError(path, 'encoded byte budget exceeded');
  const compact = value.replace(/\s/g, '');
  if (
    compact.length > Math.ceil(maxBytes / 3) * 4 ||
    compact.length % 4 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      compact,
    )
  )
    throw new TiledError(path, 'invalid/budget-exceeding base64');
  const decoded = atob(compact);
  if (decoded.length > maxBytes)
    throw new TiledError(path, 'decoded byte budget exceeded');
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
  return bytes;
}

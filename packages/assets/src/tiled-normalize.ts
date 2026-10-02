import { tiledLimits } from '../../../src/data/tiled.js';
import { readResponse } from './read-response.js';
import { tiledRecord, tiledBase64Bytes, TiledError } from './tiled-parser.js';

type RecordData = Record<string, unknown>;
/** Normalize asynchronous profiles before the synchronous, fully validating parser. */
export async function normalizeTiledMap(
  map: RecordData,
  base: string,
  resolve: (path: string, base: string) => string,
  json: (href: string) => Promise<unknown>,
  signal: AbortSignal,
): Promise<void> {
  let cells = 0,
    layers = 0,
    objects = 0;
  const templates = new Map<string, Promise<RecordData>>();
  const template = async (
    href: string,
    ancestors: readonly string[],
  ): Promise<RecordData> => {
    if (ancestors.includes(href) || ancestors.length >= tiledLimits.layers)
      throw new TiledError(href, 'cyclic/deep object template');
    let pending = templates.get(href);
    if (!pending) {
      if (templates.size >= tiledLimits.objects)
        throw new TiledError(href, 'template budget exceeded');
      pending = (async () => {
        const raw = tiledRecord(await json(href), href);
        const object = tiledRecord(raw.object, `${href}.object`);
        return mergeTemplate(object, href, [...ancestors, href]);
      })();
      templates.set(href, pending);
    }
    return pending;
  };
  const mergeTemplate = async (
    object: RecordData,
    href: string,
    ancestors: readonly string[],
  ): Promise<RecordData> => {
    if (object.template === undefined) return object;
    if (typeof object.template !== 'string')
      throw new TiledError(href, 'template must be a URL');
    const inherited = await template(resolve(object.template, href), ancestors);
    const merged: RecordData = { ...inherited, ...object };
    delete merged.template;
    if (inherited.properties !== undefined || object.properties !== undefined) {
      const properties = new Map<string, unknown>();
      for (const list of [
        inherited.properties ?? [],
        object.properties ?? [],
      ]) {
        if (!Array.isArray(list) || list.length > tiledLimits.properties)
          throw new TiledError(href, 'template property budget exceeded');
        const seen = new Set<string>();
        for (const raw of list) {
          const p = tiledRecord(raw, href);
          if (typeof p.name !== 'string' || seen.has(p.name))
            throw new TiledError(href, 'invalid/duplicate template property');
          seen.add(p.name);
          properties.set(p.name, p);
        }
      }
      if (properties.size > tiledLimits.properties)
        throw new TiledError(href, 'template property budget exceeded');
      merged.properties = [...properties.values()];
    }
    // Shape overrides replace rather than combine a template's old shape.
    if (
      ['polygon', 'ellipse', 'polyline', 'point', 'gid', 'text'].some((key) =>
        Object.hasOwn(object, key),
      )
    )
      for (const key of [
        'polygon',
        'ellipse',
        'polyline',
        'point',
        'gid',
        'text',
      ])
        if (!Object.hasOwn(object, key)) delete merged[key];
    return merged;
  };
  const decode = async (
    holder: RecordData,
    layer: RecordData,
    path: string,
  ): Promise<void> => {
    const count = Number(holder.width) * Number(holder.height);
    if (
      !Number.isSafeInteger(count) ||
      count <= 0 ||
      (cells += count) > tiledLimits.cells
    )
      throw new TiledError(path, 'cell count/budget mismatch');
    if (typeof holder.data !== 'string') {
      if (layer.compression && layer.compression !== '')
        throw new TiledError(path, 'compressed data requires base64');
      return;
    }
    if (layer.encoding !== 'base64')
      throw new TiledError(path, 'string data requires base64 encoding');
    const compression = layer.compression ?? '';
    if (!['', 'gzip', 'zlib'].includes(String(compression)))
      throw new TiledError(path, 'unsupported compression');
    if (!compression) return;
    if (typeof DecompressionStream === 'undefined')
      throw new TiledError(path, 'native decompression unavailable');
    signal.throwIfAborted();
    const bytes = tiledBase64Bytes(holder.data, tiledLimits.jsonBytes, path);
    try {
      const stream = new Blob([bytes])
        .stream()
        .pipeThrough(
          new DecompressionStream(compression === 'gzip' ? 'gzip' : 'deflate'),
        );
      const blob = await readResponse(new Response(stream), count * 4, signal);
      if (blob.size !== count * 4)
        throw new TiledError(path, 'decoded cell count mismatch');
      const view = new DataView(await blob.arrayBuffer());
      signal.throwIfAborted();
      holder.data = Array.from({ length: count }, (_, i) =>
        view.getUint32(i * 4, true),
      );
    } catch (error) {
      signal.throwIfAborted();
      if (error instanceof TiledError) throw error;
      throw new TiledError(
        path,
        `native decode rejected: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };
  const visit = async (raw: unknown, path: string): Promise<void> => {
    if (!Array.isArray(raw) || raw.length > tiledLimits.layers)
      throw new TiledError(path, 'invalid layer list');
    for (const [index, value] of raw.entries()) {
      signal.throwIfAborted();
      if (++layers > tiledLimits.layers)
        throw new TiledError(path, 'layer budget exceeded');
      const layer = tiledRecord(value, `${path}[${index}]`);
      if (layer.type === 'group')
        await visit(layer.layers, `${path}[${index}].layers`);
      else if (layer.type === 'tilelayer') {
        if (map.infinite === true) {
          if (
            !Array.isArray(layer.chunks) ||
            layer.chunks.length > tiledLimits.chunks
          )
            throw new TiledError(path, 'infinite maps require bounded chunks');
          for (const chunk of layer.chunks)
            await decode(tiledRecord(chunk, path), layer, path);
        } else await decode(layer, layer, path);
        if (layer.compression === 'gzip' || layer.compression === 'zlib')
          delete layer.compression;
      } else if (layer.type === 'objectgroup') {
        if (
          !Array.isArray(layer.objects) ||
          (objects += layer.objects.length) > tiledLimits.objects
        )
          throw new TiledError(path, 'object budget exceeded');
        for (let i = 0; i < layer.objects.length; i++)
          layer.objects[i] = await mergeTemplate(
            tiledRecord(layer.objects[i], path),
            base,
            [],
          );
      }
    }
  };
  await visit(map.layers, 'map.layers');
}

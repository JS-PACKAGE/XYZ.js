import {
  AssetError,
  AssetLoader,
  TextureView2D,
  type Texture,
  type TextureView2DOptions,
} from '../../../assets/src/index.js';
import { rendering2dLimits } from '../../../../src/data/rendering2d.js';
export interface AtlasAnimationFrame2D {
  readonly view: TextureView2D;
  readonly duration: number;
}

export interface AtlasAsset {
  readonly views: ReadonlyMap<string, TextureView2D>;
  readonly animations: ReadonlyMap<string, readonly AtlasAnimationFrame2D[]>;
  destroy(): void;
}
export interface AtlasLoadOptions {
  signal?: AbortSignal;
}
interface Page {
  url: string;
  frames: [string, Record<string, unknown>][];
  resolution: number;
}
function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new AssetError(`Invalid atlas ${label}.`);
  return value as Record<string, unknown>;
}
function rect(
  value: unknown,
  label: string,
): { x: number; y: number; width: number; height: number } {
  const data = record(value, label);
  const { x, y, w, h } = data;
  if (
    ![x, y, w, h].every((v) => typeof v === 'number' && Number.isInteger(v)) ||
    (x as number) < 0 ||
    (y as number) < 0 ||
    (w as number) <= 0 ||
    (h as number) <= 0
  )
    throw new AssetError(
      `Atlas ${label} requires positive integer dimensions and nonnegative integer coordinates.`,
    );
  return {
    x: x as number,
    y: y as number,
    width: w as number,
    height: h as number,
  };
}
function url(value: unknown, base: string | undefined): string {
  if (typeof value !== 'string' || !value.length)
    throw new AssetError('Atlas requires an image or metadata URL.');
  const resolved = new URL(value, base);
  if (!['http:', 'https:', 'blob:', 'data:'].includes(resolved.protocol))
    throw new AssetError('Unsupported atlas URL protocol.');
  resolved.hash = '';
  return resolved.href;
}

/** TexturePacker JSON hash/array and bounded multipage acquisition; pages are uniquely owned. */
export class AtlasLoader {
  constructor(private readonly baseURL?: string) {}

  async load(
    address: string,
    options: AtlasLoadOptions = {},
  ): Promise<AtlasAsset> {
    options.signal?.throwIfAborted();
    const base =
      this.baseURL ??
      (typeof document !== 'undefined' ? document.baseURI : undefined) ??
      (typeof location !== 'undefined' ? location.href : undefined);
    const rootURL = url(address, base);
    const reader = new AssetLoader();
    const pages: Page[] = [];
    const definitions = new Map<string, unknown>();
    const visited = new Set<string>();
    const pending = [rootURL];
    const acquired = new Map<string, Texture>();
    let frameCount = 0;
    try {
      while (pending.length) {
        const metadataURL = pending.shift()!;
        if (visited.has(metadataURL)) continue;
        visited.add(metadataURL);
        if (visited.size > rendering2dLimits.atlasPages)
          throw new AssetError('Atlas metadata exceeds its page budget.');
        const json = record(
          await reader.loadJSON(metadataURL, options),
          'document',
        );
        const animations =
          json.animations === undefined
            ? {}
            : record(json.animations, 'animations');
        for (const [name, sequence] of Object.entries(animations)) {
          if (definitions.has(name))
            throw new AssetError(`Duplicate atlas animation: ${name}.`);
          definitions.set(name, sequence);
          if (definitions.size > rendering2dLimits.atlasFrames)
            throw new AssetError('Atlas animation count exceeds its budget.');
        }
        const documents = json.textures === undefined ? [json] : json.textures;
        if (
          !Array.isArray(documents) ||
          !documents.length ||
          documents.length > rendering2dLimits.atlasPages
        )
          throw new AssetError('Invalid atlas multipage textures.');
        for (const document of documents) {
          const data = record(document, 'page');
          const meta =
            data.meta === undefined ? {} : record(data.meta, 'metadata');
          const rawScale = meta.scale ?? data.scale ?? 1;
          if (
            (typeof rawScale !== 'number' && typeof rawScale !== 'string') ||
            (typeof rawScale === 'string' && !rawScale.trim())
          )
            throw new AssetError('Invalid atlas resolution.');
          const scale = Number(rawScale);
          if (
            !Number.isFinite(scale) ||
            scale <= 0 ||
            scale > rendering2dLimits.resolution
          )
            throw new AssetError('Invalid atlas resolution.');
          if (
            meta.format !== undefined &&
            meta.format !== 'RGBA8888' &&
            meta.format !== 'RGBA'
          )
            throw new AssetError('Unsupported atlas pixel format.');
          const frameData = data.frames;
          let frames: [string, Record<string, unknown>][];
          if (Array.isArray(frameData)) {
            if (frameData.length > rendering2dLimits.atlasFrames)
              throw new AssetError('Atlas frame count exceeds its budget.');
            frames = frameData.map((value) => {
              const frame = record(value, 'frame');
              if (typeof frame.filename !== 'string' || !frame.filename)
                throw new AssetError('Atlas array frames require filenames.');
              return [frame.filename, frame];
            });
          } else {
            const entries = Object.entries(record(frameData, 'frames'));
            if (entries.length > rendering2dLimits.atlasFrames)
              throw new AssetError('Atlas frame count exceeds its budget.');
            frames = entries.map(([name, value]) => [
              name,
              record(value, 'frame'),
            ]);
          }
          frameCount += frames.length;
          if (
            !frames.length ||
            frameCount > rendering2dLimits.atlasFrames ||
            pages.length >= rendering2dLimits.atlasPages
          )
            throw new AssetError('Atlas exceeds its page or frame budget.');
          pages.push({
            url: url(meta.image ?? data.image, metadataURL),
            frames,
            resolution: scale,
          });
          if (meta.related_multi_packs !== undefined) {
            if (
              !Array.isArray(meta.related_multi_packs) ||
              meta.related_multi_packs.length > rendering2dLimits.atlasPages
            )
              throw new AssetError('Invalid related atlas pages.');
            for (const related of meta.related_multi_packs)
              pending.push(url(related, metadataURL));
          }
        }
      }
      const views = new Map<string, TextureView2D>();
      for (const page of pages) {
        options.signal?.throwIfAborted();
        let texture = acquired.get(page.url);
        if (!texture) {
          texture = await reader.loadTextureOwned(page.url, options);
          acquired.set(page.url, texture);
        }
        for (const [name, data] of page.frames) {
          if (!name || views.has(name))
            throw new AssetError(`Duplicate or empty atlas frame: ${name}.`);
          if (data.rotated !== undefined && typeof data.rotated !== 'boolean')
            throw new AssetError('Atlas rotated must be boolean.');
          if (data.trimmed !== undefined && typeof data.trimmed !== 'boolean')
            throw new AssetError('Atlas trimmed must be boolean.');
          const frame = rect(data.frame, 'frame');
          const viewOptions: TextureView2DOptions = {
            frame,
            rotation: data.rotated ? 90 : 0,
            resolution: page.resolution,
          };
          if (data.sourceSize !== undefined) {
            const original = record(data.sourceSize, 'sourceSize');
            if (
              ![original.w, original.h].every(
                (v) => typeof v === 'number' && Number.isInteger(v),
              )
            )
              throw new AssetError(
                'Atlas original dimensions must be integer pixels.',
              );
            viewOptions.originalSize = [
              original.w as number,
              original.h as number,
            ];
          }
          if (data.spriteSourceSize !== undefined)
            viewOptions.trim = rect(data.spriteSourceSize, 'spriteSourceSize');
          if (
            data.trimmed === true &&
            (!viewOptions.trim || !viewOptions.originalSize)
          )
            throw new AssetError(
              'Trimmed atlas frames require sourceSize and spriteSourceSize.',
            );
          const pivot = data.pivot ?? data.anchor;
          if (pivot !== undefined) {
            const anchor = record(pivot, 'anchor');
            viewOptions.defaultAnchor = [
              anchor.x as number,
              anchor.y as number,
            ];
          }
          if (data.borders !== undefined) {
            const borders = record(data.borders, 'borders');
            viewOptions.defaultBorders = {
              left: borders.left as number,
              top: borders.top as number,
              right: borders.right as number,
              bottom: borders.bottom as number,
            };
          }
          views.set(name, new TextureView2D(texture, viewOptions));
        }
      }
      const animations = new Map<string, readonly AtlasAnimationFrame2D[]>();
      let animationFrames = 0;
      for (const [name, definition] of definitions) {
        if (!Array.isArray(definition) || !definition.length)
          throw new AssetError(
            'Atlas animations require nonempty frame arrays.',
          );
        animationFrames += definition.length;
        if (animationFrames > rendering2dLimits.atlasFrames)
          throw new AssetError('Atlas animation frames exceed their budget.');
        const frames = definition.map((entry) => {
          const descriptor =
            typeof entry === 'string'
              ? { frame: entry, duration: 1 / 60 }
              : record(entry, 'animation frame');
          const view = views.get(descriptor.frame as string);
          const duration = descriptor.duration;
          if (
            !view ||
            typeof duration !== 'number' ||
            !Number.isFinite(duration) ||
            duration <= 0
          )
            throw new AssetError(
              'Atlas animation requires a named frame and a positive duration in seconds.',
            );
          return Object.freeze({ view, duration });
        });
        animations.set(name, Object.freeze(frames));
      }
      options.signal?.throwIfAborted();
      let destroyed = false;
      return Object.freeze({
        views,
        animations,
        destroy() {
          if (destroyed) return;
          destroyed = true;
          for (const texture of acquired.values()) texture.destroy();
          acquired.clear();
        },
      });
    } catch (error) {
      for (const texture of acquired.values()) texture.destroy();
      throw error;
    } finally {
      reader.destroy();
    }
  }
}

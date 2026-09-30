import { rendering2dLimits } from '../../../../src/data/rendering2d.js';
import {
  AssetError,
  Texture,
  TextureView2D,
} from '../../../assets/src/index.js';
import { CanvasSpriteSource } from '../../../graphics/src/canvas-sprite-source.js';
import {
  createTextureQuad2D,
  getTextureQuad2D,
} from '../../../graphics/src/sprite-instance.js';
import { Vector2 } from '../../../math/src/index.js';
import type { Rect2D } from '../gameplay/contracts.js';
import { Sprite, type SpriteOptions } from '../sprite.js';
import {
  GraphicsPath2D,
  type GraphicsInstruction2D,
  type Paint2D,
} from './graphics-path2d.js';

export interface Graphics2DOptions extends Omit<
  SpriteOptions,
  'texture' | 'view' | 'source'
> {
  resolution?: number;
}
interface Raster2D {
  texture: Texture;
  bounds: Readonly<Rect2D>;
}

function snapshotPaint(
  paint: Paint2D,
  context: CanvasRenderingContext2D,
): Paint2D {
  const color = (value: string): string => {
    if (
      typeof value !== 'string' ||
      value.length > rendering2dLimits.pathCommands
    )
      throw new RangeError('Graphics paint requires a bounded native color.');
    context.fillStyle = '#000000';
    context.fillStyle = value;
    if (context.fillStyle === '#000000') {
      context.fillStyle = '#ffffff';
      context.fillStyle = value;
      if (context.fillStyle === '#ffffff')
        throw new RangeError('Invalid native Graphics color.');
    }
    return value;
  };
  if (typeof paint === 'string') return color(paint);
  if (!paint || typeof paint !== 'object')
    throw new TypeError('Invalid Graphics paint.');
  if (paint.kind === 'linear-gradient' || paint.kind === 'radial-gradient') {
    const size = paint.kind === 'linear-gradient' ? 2 : 3;
    if (
      paint.from.length !== size ||
      paint.to.length !== size ||
      ![...paint.from, ...paint.to].every(
        (value) =>
          Number.isFinite(value) &&
          Math.abs(value) <= rendering2dLimits.coordinate,
      ) ||
      (paint.kind === 'radial-gradient' &&
        (paint.from[2] < 0 || paint.to[2] < 0))
    )
      throw new RangeError(
        'Graphics gradient coordinates must be bounded and finite.',
      );
    if (
      !Array.isArray(paint.stops) ||
      !paint.stops.length ||
      paint.stops.length > rendering2dLimits.pathCommands
    )
      throw new RangeError('Graphics gradient requires bounded color stops.');
    const stops = Object.freeze(
      paint.stops.map((stop) => {
        if (!Number.isFinite(stop.offset) || stop.offset < 0 || stop.offset > 1)
          throw new RangeError('Gradient stop offset must be in [0,1].');
        return Object.freeze({ offset: stop.offset, color: color(stop.color) });
      }),
    );
    if (paint.kind === 'linear-gradient')
      return Object.freeze({
        kind: paint.kind,
        from: Object.freeze([paint.from[0], paint.from[1]] as const),
        to: Object.freeze([paint.to[0], paint.to[1]] as const),
        stops,
      });
    return Object.freeze({
      kind: paint.kind,
      from: Object.freeze([
        paint.from[0],
        paint.from[1],
        paint.from[2],
      ] as const),
      to: Object.freeze([paint.to[0], paint.to[1], paint.to[2]] as const),
      stops,
    });
  }
  if (paint.kind !== 'pattern')
    throw new RangeError('Unsupported Graphics paint.');
  const texture = paint.texture ?? paint.view?.source;
  if (
    !texture ||
    texture.destroyed ||
    texture.kind === 'render' ||
    (paint.view && paint.view.source !== texture)
  )
    throw new AssetError(
      'Raster patterns require a live matching bitmap or canvas source/view.',
    );
  paint.view?.validate();
  const repetition = paint.repetition ?? 'repeat';
  if (!['repeat', 'repeat-x', 'repeat-y', 'no-repeat'].includes(repetition))
    throw new RangeError('Invalid Graphics pattern repetition.');
  const transform = paint.transform ?? [1, 0, 0, 1, 0, 0];
  if (
    transform.length !== 6 ||
    !transform.every(
      (value) =>
        Number.isFinite(value) &&
        Math.abs(value) <= rendering2dLimits.coordinate,
    )
  )
    throw new RangeError(
      'Graphics pattern transform must be bounded and finite.',
    );
  return Object.freeze({
    kind: 'pattern',
    texture,
    view: paint.view,
    repetition,
    transform: Object.freeze([
      transform[0],
      transform[1],
      transform[2],
      transform[3],
      transform[4],
      transform[5],
    ] as const),
  });
}

function snapshotInstructions(
  instructions: readonly GraphicsInstruction2D[],
): readonly GraphicsInstruction2D[] {
  if (
    !Array.isArray(instructions) ||
    instructions.length > rendering2dLimits.pathCommands
  )
    throw new RangeError('Graphics instructions exceed their resource budget.');
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const context = canvas.getContext('2d');
  if (!context)
    throw new AssetError('Native Canvas2D is required for raster Graphics.');
  let commands = 0;
  return Object.freeze(
    instructions.map((instruction) => {
      if (
        !(instruction.path instanceof GraphicsPath2D) ||
        (instruction.fill === undefined && instruction.stroke === undefined)
      )
        throw new TypeError(
          'Graphics instruction requires a path and fill or stroke.',
        );
      commands += instruction.path.commandCount;
      if (commands > rendering2dLimits.pathCommands)
        throw new RangeError(
          'Graphics instructions exceed their aggregate path budget.',
        );
      const alpha = instruction.alpha ?? 1;
      if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1)
        throw new RangeError('Graphics instruction alpha must be in [0,1].');
      const stroke = instruction.stroke;
      if (
        stroke &&
        (!Number.isFinite(stroke.width) ||
          stroke.width <= 0 ||
          stroke.width > rendering2dLimits.coordinate ||
          !['butt', 'round', 'square'].includes(stroke.cap ?? 'butt') ||
          !['miter', 'round', 'bevel'].includes(stroke.join ?? 'miter') ||
          !Number.isFinite(stroke.miterLimit ?? 10) ||
          (stroke.miterLimit ?? 10) <= 0 ||
          (stroke.miterLimit ?? 10) > rendering2dLimits.coordinate)
      )
        throw new RangeError('Invalid centered Graphics stroke.');
      return Object.freeze({
        path: instruction.path,
        alpha,
        fill:
          instruction.fill === undefined
            ? undefined
            : snapshotPaint(instruction.fill, context),
        stroke:
          stroke &&
          Object.freeze({
            paint: snapshotPaint(stroke.paint, context),
            width: stroke.width,
            cap: stroke.cap ?? 'butt',
            join: stroke.join ?? 'miter',
            miterLimit: stroke.miterLimit ?? 10,
          }),
      });
    }),
  );
}

function rasterBounds(
  instructions: readonly GraphicsInstruction2D[],
  resolution: number,
): Readonly<Rect2D> {
  if (
    !Number.isFinite(resolution) ||
    resolution <= 0 ||
    resolution > rendering2dLimits.resolution
  )
    throw new RangeError(
      'Graphics resolution must be positive and within its budget.',
    );
  let left = Infinity,
    top = Infinity,
    right = -Infinity,
    bottom = -Infinity;
  for (const instruction of instructions) {
    const bounds = instruction.path.bounds,
      stroke = instruction.stroke;
    // Centered square caps can project sqrt(2)*halfWidth; miter joins use their declared limit.
    const padding = stroke
      ? (stroke.width / 2) *
        Math.max(
          stroke.cap === 'square' ? Math.SQRT2 : 1,
          stroke.join === 'miter' ? (stroke.miterLimit ?? 10) : 1,
        )
      : 0;
    left = Math.min(left, bounds.x - padding);
    top = Math.min(top, bounds.y - padding);
    right = Math.max(right, bounds.x + bounds.width + padding);
    bottom = Math.max(bottom, bounds.y + bounds.height + padding);
  }
  if (left === Infinity) left = top = right = bottom = 0;
  left = Math.floor(left * resolution) / resolution;
  top = Math.floor(top * resolution) / resolution;
  const width = Math.max(1, Math.ceil((right - left) * resolution)),
    height = Math.max(1, Math.ceil((bottom - top) * resolution));
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width > rendering2dLimits.targetDimension ||
    height > rendering2dLimits.targetDimension ||
    width * height > rendering2dLimits.targetPixels
  )
    throw new AssetError(
      'Graphics raster exceeds its texture resource budget.',
    );
  return Object.freeze({
    x: left,
    y: top,
    width: width / resolution,
    height: height / resolution,
  });
}

/** Retained immutable CPU paths rasterized into an owned bitmap, not GPU vector geometry. */
export class Graphics2D extends Sprite {
  private revision = 0;
  private requestedInstructions: readonly GraphicsInstruction2D[];
  private requestedResolution: number;
  private displayedInstructions: readonly GraphicsInstruction2D[];
  private displayedResolution: number;
  private rasterOrigin: Readonly<Rect2D>;
  private ownedTexture: Texture;
  private readonly hitPoint = new Vector2();

  private constructor(
    instructions: readonly GraphicsInstruction2D[],
    resolution: number,
    raster: Raster2D,
    options: Graphics2DOptions,
  ) {
    super({
      ...options,
      view: new TextureView2D(raster.texture, {
        frame: {
          x: 0,
          y: 0,
          width: raster.texture.width,
          height: raster.texture.height,
        },
        resolution,
      }),
    });
    this.requestedInstructions = this.displayedInstructions = instructions;
    this.requestedResolution = this.displayedResolution = resolution;
    this.rasterOrigin = raster.bounds;
    this.ownedTexture = raster.texture;
  }

  static async create(
    instructions: readonly GraphicsInstruction2D[],
    options: Graphics2DOptions = {},
  ): Promise<Graphics2D> {
    const snapshot = snapshotInstructions(instructions),
      resolution = options.resolution ?? 1;
    const bounds = rasterBounds(snapshot, resolution);
    const raster = await Graphics2D.rasterize(snapshot, resolution, bounds);
    try {
      return new Graphics2D(snapshot, resolution, raster, options);
    } catch (error) {
      raster.texture.destroy();
      throw error;
    }
  }
  get instructions(): readonly GraphicsInstruction2D[] {
    return this.displayedInstructions;
  }
  get resolution(): number {
    return this.displayedResolution;
  }

  async setInstructions(
    instructions: readonly GraphicsInstruction2D[],
  ): Promise<void> {
    if (this.destroyed)
      throw new AssetError('Cannot update destroyed Graphics2D.');
    const snapshot = snapshotInstructions(instructions);
    rasterBounds(snapshot, this.requestedResolution);
    this.requestedInstructions = snapshot;
    await this.refresh();
  }
  async setResolution(resolution: number): Promise<void> {
    if (this.destroyed)
      throw new AssetError('Cannot update destroyed Graphics2D.');
    rasterBounds(this.requestedInstructions, resolution);
    this.requestedResolution = resolution;
    await this.refresh();
  }
  private async refresh(): Promise<void> {
    const revision = ++this.revision,
      instructions = this.requestedInstructions,
      resolution = this.requestedResolution;
    let raster: Raster2D;
    try {
      raster = await Graphics2D.rasterize(
        instructions,
        resolution,
        rasterBounds(instructions, resolution),
      );
    } catch (error) {
      if (revision === this.revision) {
        this.requestedInstructions = this.displayedInstructions;
        this.requestedResolution = this.displayedResolution;
      }
      throw error;
    }
    if (this.destroyed || revision !== this.revision) {
      raster.texture.destroy();
      return;
    }
    const previous = this.ownedTexture;
    try {
      this.view = new TextureView2D(raster.texture, {
        frame: {
          x: 0,
          y: 0,
          width: raster.texture.width,
          height: raster.texture.height,
        },
        resolution,
      });
    } catch (error) {
      raster.texture.destroy();
      this.requestedInstructions = this.displayedInstructions;
      this.requestedResolution = this.displayedResolution;
      throw error;
    }
    this.ownedTexture = raster.texture;
    this.rasterOrigin = raster.bounds;
    this.displayedInstructions = instructions;
    this.displayedResolution = resolution;
    previous.destroy();
  }
  override getLocalBounds(
    out: Rect2D = { x: 0, y: 0, width: 0, height: 0 },
  ): Rect2D {
    out.x = this.rasterOrigin.x - this.anchor.x * this.width;
    out.y = this.rasterOrigin.y - this.anchor.y * this.height;
    out.width = this.width;
    out.height = this.height;
    return out;
  }
  override containsPoint(point: Vector2): boolean {
    if (this.hitTestMode === 'collider') return super.containsPoint(point);
    try {
      this.toLocal(point, this.hitPoint);
    } catch (error) {
      if (error instanceof RangeError) return false;
      throw error;
    }
    const x = this.hitPoint.x + this.anchor.x * this.width,
      y = this.hitPoint.y + this.anchor.y * this.height;
    return this.displayedInstructions.some(
      (instruction) =>
        (instruction.alpha ?? 1) > 0 &&
        ((instruction.fill !== undefined &&
          instruction.path.containsPoint(x, y)) ||
          (instruction.stroke !== undefined &&
            instruction.path.containsPoint(x, y, instruction.stroke))),
    );
  }
  protected override onDestroy(): void {
    this.revision++;
    this.ownedTexture.destroy();
  }

  private static async rasterize(
    instructions: readonly GraphicsInstruction2D[],
    resolution: number,
    bounds: Readonly<Rect2D>,
  ): Promise<Raster2D> {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bounds.width * resolution);
    canvas.height = Math.round(bounds.height * resolution);
    const context = canvas.getContext('2d');
    if (!context)
      throw new AssetError('Native Canvas2D is required for raster Graphics.');
    const sources = new CanvasSpriteSource(() => {
      throw new AssetError(
        'Raster Graphics patterns cannot read native render targets.',
      );
    });
    const quad = createTextureQuad2D(),
      patterns: HTMLCanvasElement[] = [];
    const paints = new Map<Paint2D, string | CanvasGradient | CanvasPattern>();
    const nativePaint = (
      paint: Paint2D,
    ): string | CanvasGradient | CanvasPattern => {
      if (typeof paint === 'string') return paint;
      const cached = paints.get(paint);
      if (cached) return cached;
      let native: CanvasGradient | CanvasPattern;
      if (
        paint.kind === 'linear-gradient' ||
        paint.kind === 'radial-gradient'
      ) {
        native =
          paint.kind === 'linear-gradient'
            ? context.createLinearGradient(...paint.from, ...paint.to)
            : context.createRadialGradient(...paint.from, ...paint.to);
        for (const stop of paint.stops)
          native.addColorStop(stop.offset, stop.color);
      } else {
        const texture = paint.texture ?? paint.view!.source;
        getTextureQuad2D(texture, paint.view, undefined, quad);
        const tile = document.createElement('canvas');
        tile.width = Math.round(quad.naturalWidth * quad.resolution);
        tile.height = Math.round(quad.naturalHeight * quad.resolution);
        patterns.push(tile);
        const tileContext = tile.getContext('2d');
        if (!tileContext)
          throw new AssetError(
            'Native Canvas2D is required for local patterns.',
          );
        tileContext.drawImage(
          sources.image(texture, quad, [1, 1, 1]),
          quad.trimX * quad.resolution,
          quad.trimY * quad.resolution,
        );
        const pattern = context.createPattern(
          tile,
          paint.repetition ?? 'repeat',
        );
        if (!pattern)
          throw new AssetError('Unable to create native Graphics pattern.');
        const [a, b, c, d, e, f] = paint.transform ?? [1, 0, 0, 1, 0, 0];
        pattern.setTransform(
          new DOMMatrix([
            a / quad.resolution,
            b / quad.resolution,
            c / quad.resolution,
            d / quad.resolution,
            e,
            f,
          ]),
        );
        native = pattern;
      }
      paints.set(paint, native);
      return native;
    };
    try {
      context.setTransform(
        resolution,
        0,
        0,
        resolution,
        -bounds.x * resolution,
        -bounds.y * resolution,
      );
      for (const instruction of instructions) {
        const path = instruction.path.nativePath2D;
        context.globalAlpha = instruction.alpha ?? 1;
        if (instruction.fill !== undefined) {
          context.fillStyle = nativePaint(instruction.fill);
          context.fill(path, instruction.path.fillRule);
        }
        if (instruction.stroke) {
          const stroke = instruction.stroke;
          context.strokeStyle = nativePaint(stroke.paint);
          context.lineWidth = stroke.width;
          context.lineCap = stroke.cap ?? 'butt';
          context.lineJoin = stroke.join ?? 'miter';
          context.miterLimit = stroke.miterLimit ?? 10;
          context.stroke(path);
        }
      }
      return { texture: await Texture.fromImage(canvas), bounds };
    } finally {
      sources.destroy();
      for (const pattern of patterns) pattern.width = pattern.height = 0;
      canvas.width = canvas.height = 0;
    }
  }
}

import {
  PostProcessor2D,
  validateEffect2D,
} from '../../core/src/materials2d/material2d.js';
import { renderGraphLimits } from '../../../src/data/gpu-programs.js';
import { GraphicsError } from './errors.js';

export type RenderGraphFormat = 'rgba8unorm' | 'rgba16float';
export interface RenderGraphTarget {
  readonly name: string;
  readonly format?: RenderGraphFormat;
  /** Fixed pixel dimensions, or scale relative to the frame (default 1). */
  readonly width?: number;
  readonly height?: number;
  readonly scale?: number;
}
export interface RenderGraphPass {
  readonly name: string;
  /** Ordered sampled attachments; '$scene' is the full real 3D+2D frame before transitions. */
  readonly inputs: readonly string[];
  readonly output: string;
  /** Existing native hook ABI: effect(color,uv,screen), uniformValue, sampleInput; extra inputs use sampleInput1..7. */
  readonly effect: PostProcessor2D;
}
export interface RenderGraphOptions {
  readonly targets: readonly RenderGraphTarget[];
  readonly passes: readonly RenderGraphPass[];
  readonly output: string;
  readonly label?: string;
}
export interface RenderGraphPreparationOptions {
  readonly signal?: AbortSignal;
}

/** Immutable resource DAG. Shader descriptors are borrowed, never destroyed by the graph. */
export class RenderGraph extends EventTarget {
  readonly targets: readonly RenderGraphTarget[];
  readonly passes: readonly RenderGraphPass[];
  readonly schedule: readonly RenderGraphPass[];
  readonly output: string;
  readonly label: string;
  private disposed = false;
  constructor(options: RenderGraphOptions) {
    super();
    const validName = (name: string): boolean =>
      typeof name === 'string' && /^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(name);
    if (
      !options.targets.length ||
      options.targets.length > renderGraphLimits.targets ||
      !options.passes.length ||
      options.passes.length > renderGraphLimits.passes
    )
      throw new RangeError(
        'Render graph resource/pass count exceeds engine limits.',
      );
    const targets = new Map<string, RenderGraphTarget>();
    for (const target of options.targets) {
      if (!validName(target.name) || targets.has(target.name))
        throw new TypeError(
          'Render graph target names must be unique identifiers.',
        );
      if (
        target.format !== undefined &&
        !['rgba8unorm', 'rgba16float'].includes(target.format)
      )
        throw new TypeError('Unsupported render graph target format.');
      if (
        (target.width === undefined) !== (target.height === undefined) ||
        (target.width !== undefined && target.scale !== undefined)
      )
        throw new RangeError(
          'Graph target resolution must be fixed width/height or relative scale.',
        );
      for (const dimension of [target.width, target.height])
        if (
          dimension !== undefined &&
          (!Number.isSafeInteger(dimension) ||
            dimension < 1 ||
            dimension > renderGraphLimits.dimension)
        )
          throw new RangeError('Graph target dimensions exceed limits.');
      if (
        target.scale !== undefined &&
        (!Number.isFinite(target.scale) ||
          target.scale <= 0 ||
          target.scale > 4)
      )
        throw new RangeError('Graph target scale must be in (0,4].');
      targets.set(
        target.name,
        Object.freeze({ ...target, format: target.format ?? 'rgba8unorm' }),
      );
    }
    const writers = new Map<string, RenderGraphPass>(),
      names = new Set<string>();
    const passes = options.passes.map((pass) => {
      if (!validName(pass.name) || names.has(pass.name))
        throw new TypeError(
          'Render graph pass names must be unique identifiers.',
        );
      names.add(pass.name);
      if (!targets.has(pass.output) || writers.has(pass.output))
        throw new GraphicsError(
          'Every graph target has exactly one declared writer.',
        );
      if (
        !pass.inputs.length ||
        pass.inputs.length > renderGraphLimits.inputs ||
        pass.inputs.some(
          (input) => input !== '$scene' && !targets.has(input),
        ) ||
        pass.inputs.includes(pass.output)
      )
        throw new GraphicsError(
          'Graph attachment reads are missing, excessive, or alias the write target.',
        );
      if (!(pass.effect instanceof PostProcessor2D))
        throw new TypeError(
          'Graph passes require native PostProcessor2D descriptors.',
        );
      validateEffect2D(pass.effect);
      const copy = Object.freeze({
        ...pass,
        inputs: Object.freeze([...pass.inputs]),
      });
      writers.set(pass.output, copy);
      return copy;
    });
    if (targets.size !== writers.size || !targets.has(options.output))
      throw new GraphicsError(
        'Graph targets must all be written and the presentation output must exist.',
      );
    const scheduled: RenderGraphPass[] = [],
      visited = new Set<string>(),
      active = new Set<string>();
    const visit = (pass: RenderGraphPass): void => {
      if (visited.has(pass.name)) return;
      if (active.has(pass.name))
        throw new GraphicsError('Render graph attachment dependency cycle.');
      active.add(pass.name);
      for (const input of pass.inputs)
        if (input !== '$scene') visit(writers.get(input)!);
      active.delete(pass.name);
      visited.add(pass.name);
      scheduled.push(pass);
    };
    for (const pass of passes) visit(pass);
    this.targets = Object.freeze([...targets.values()]);
    this.passes = Object.freeze(passes);
    this.schedule = Object.freeze(scheduled);
    this.output = options.output;
    this.label = options.label ?? 'RenderGraph';
  }
  get destroyed(): boolean {
    return this.disposed;
  }
  validate(): void {
    if (this.disposed) throw new GraphicsError('RenderGraph is destroyed.');
    for (const pass of this.passes) validateEffect2D(pass.effect);
  }
  /** Resolves dimensions transactionally before any native targets are replaced. */
  resolutions(
    width: number,
    height: number,
    maxDimension: number = renderGraphLimits.dimension,
  ): readonly { target: RenderGraphTarget; width: number; height: number }[] {
    this.validate();
    if (
      !Number.isSafeInteger(width) ||
      !Number.isSafeInteger(height) ||
      width < 1 ||
      height < 1
    )
      throw new RangeError(
        'Graph frame dimensions must be positive integer pixels.',
      );
    let bytes = 0;
    const resolutions = this.targets.map((target) => {
      const w =
          target.width ?? Math.max(1, Math.round(width * (target.scale ?? 1))),
        h =
          target.height ??
          Math.max(1, Math.round(height * (target.scale ?? 1)));
      if (
        w > Math.min(maxDimension, renderGraphLimits.dimension) ||
        h > Math.min(maxDimension, renderGraphLimits.dimension)
      )
        throw new RangeError('Graph target exceeds texture dimension limits.');
      bytes += w * h * (target.format === 'rgba16float' ? 8 : 4);
      return { target, width: w, height: h };
    });
    if (bytes > renderGraphLimits.targetBytes)
      throw new RangeError(
        'Render graph exceeds the aggregate target byte budget.',
      );
    return resolutions;
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.dispatchEvent(new Event('destroy'));
  }
}

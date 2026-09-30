import type { Scene } from '../../core/src/scene.js';
import { logger } from '../../core/src/logger.js';
import {
  GraphicsBackendUnavailableError,
  UnsupportedGraphicsError,
} from './errors.js';
import { WebGPURenderer } from './webgpu-renderer.js';
import { WebGL2Renderer } from './webgl2-renderer.js';
import { Canvas2DRenderer } from './canvas2d-renderer.js';
import { PresentedRenderer } from './presented-renderer.js';
import type {
  Material2D,
  PostProcessor2D,
} from '../../core/src/materials2d/index.js';
import type { FrameEffects, RenderSnapshot } from './render2d-contract.js';
export type {
  FrameEffects,
  RenderSnapshot,
  TransitionFrame,
} from './render2d-contract.js';

export {
  XYZError,
  GraphicsError,
  WebGPUNotSupportedError,
  WebGPUInitializationError,
  WebGPUDeviceLostError,
  GraphicsBackendUnavailableError,
  UnsupportedGraphicsError,
  WebGL2InitializationError,
  WebGL2ContextLostError,
  Canvas2DInitializationError,
} from './errors.js';

export type GraphicsBackend = 'webgpu' | 'webgl2' | 'canvas2d';
export type RendererPreference = GraphicsBackend | 'auto';

export interface GraphicsCapabilities {
  readonly threeD: boolean;
  readonly compute: boolean;
  readonly customShaders: boolean;
  readonly storageBuffers: boolean;
  readonly instancing: boolean;
  readonly maxTextureSize: number;
}

export interface Renderer {
  readonly backend: GraphicsBackend;
  readonly capabilities: GraphicsCapabilities;
  initialize(canvas: HTMLCanvasElement): Promise<void>;
  beginFrame(): void;
  render(
    scene?: Scene,
    width?: number,
    height?: number,
    effects?: FrameEffects,
  ): void;
  captureScene(
    scene: Scene,
    width: number,
    height: number,
  ): Promise<RenderSnapshot>;
  prepareMaterial(material: Material2D): Promise<void>;
  preparePostProcessor(processor: PostProcessor2D): Promise<void>;
  endFrame(): void;
  resize(width: number, height: number): void;
  destroy(): void;
}

export async function createRenderer(
  canvas: HTMLCanvasElement,
  preference: RendererPreference,
  onError: (error: Error) => void,
): Promise<Renderer> {
  if (!['auto', 'webgpu', 'webgl2', 'canvas2d'].includes(preference))
    throw new GraphicsBackendUnavailableError(
      `Unknown graphics renderer preference ${String(preference)}.`,
    );
  const candidates: GraphicsBackend[] =
    preference === 'auto' ? ['webgpu', 'webgl2', 'canvas2d'] : [preference];
  const failures: unknown[] = [];
  for (const backend of candidates) {
    let published = false;
    let active = true;
    let initializationError: Error | undefined;
    const report = (error: Error): void => {
      if (!active) return;
      if (published) onError(error);
      else initializationError = error;
    };
    const renderer =
      backend === 'webgpu'
        ? new WebGPURenderer(report)
        : backend === 'webgl2'
          ? new WebGL2Renderer(report)
          : new Canvas2DRenderer(report);
    // A bound context cannot change type. Failed candidates never bind the user's canvas.
    const target =
      preference === 'auto' ? document.createElement('canvas') : canvas;
    if (target !== canvas) {
      target.width = canvas.width;
      target.height = canvas.height;
    }
    try {
      await renderer.initialize(target);
      if (initializationError) throw initializationError;
    } catch (cause) {
      active = false;
      let failure = cause;
      try {
        renderer.destroy();
      } catch (cleanup) {
        failure = new AggregateError(
          [cause, cleanup],
          `${backend} initialization and cleanup failed.`,
        );
      }
      if (preference !== 'auto') {
        logger.error(`${backend} initialization failed.`, failure);
        throw failure;
      }
      logger.warn(
        `${backend} unavailable during automatic selection.`,
        failure,
      );
      failures.push(failure);
      continue;
    }
    if (preference === 'auto') {
      const presented = new PresentedRenderer(renderer, target);
      try {
        await presented.initialize(canvas);
        if (initializationError) throw initializationError;
      } catch (cause) {
        active = false;
        try {
          presented.destroy();
        } catch (cleanup) {
          const failure = new AggregateError(
            [cause, cleanup],
            'Presentation cleanup failed.',
          );
          failures.push(failure);
          logger.warn(
            `${backend} presentation failed during automatic selection.`,
            failure,
          );
          continue;
        }
        failures.push(cause);
        logger.warn(
          `${backend} presentation failed during automatic selection.`,
          cause,
        );
        continue;
      }
      published = true;
      logger.info(`Using ${backend} graphics backend.`);
      return presented;
    }
    published = true;
    logger.info(`Using ${backend} graphics backend.`);
    return renderer;
  }
  logger.error('No graphics backend could initialize.', ...failures);
  throw new UnsupportedGraphicsError(
    'No graphics backend could initialize (WebGPU → WebGL2 → Canvas2D).',
    {
      cause: new AggregateError(failures, 'Graphics initialization failures.'),
    },
  );
}

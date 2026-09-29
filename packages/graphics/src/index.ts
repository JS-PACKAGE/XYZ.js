import type { Scene } from '../../core/src/scene.js';
import {
  GraphicsBackendUnavailableError,
  UnsupportedGraphicsError,
} from './errors.js';
import { WebGPURenderer } from './webgpu-renderer.js';
import { WebGL2Renderer } from './webgl2-renderer.js';
import { Canvas2DRenderer } from './canvas2d-renderer.js';
import { PresentedRenderer } from './presented-renderer.js';

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
  render(scene?: Scene, width?: number, height?: number): void;
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
      if (preference !== 'auto') throw failure;
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
          failures.push(
            new AggregateError(
              [cause, cleanup],
              'Presentation cleanup failed.',
            ),
          );
          continue;
        }
        failures.push(cause);
        continue;
      }
      published = true;
      return presented;
    }
    published = true;
    return renderer;
  }
  throw new UnsupportedGraphicsError(
    'No graphics backend could initialize (WebGPU → WebGL2 → Canvas2D).',
    {
      cause: new AggregateError(failures, 'Graphics initialization failures.'),
    },
  );
}

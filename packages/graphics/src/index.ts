import {
  GraphicsBackendUnavailableError,
  UnsupportedGraphicsError,
  WebGPUNotSupportedError,
} from './errors.js';
import { WebGPURenderer } from './webgpu-renderer.js';

export {
  XYZError,
  GraphicsError,
  WebGPUNotSupportedError,
  WebGPUInitializationError,
  WebGPUDeviceLostError,
  GraphicsBackendUnavailableError,
  UnsupportedGraphicsError,
} from './errors.js';

export type GraphicsBackend = 'webgpu' | 'webgl2' | 'canvas2d';
export type RendererPreference = GraphicsBackend | 'auto';

export interface Renderer {
  readonly backend: GraphicsBackend;
  initialize(canvas: HTMLCanvasElement): Promise<void>;
  beginFrame(): void;
  render(): void;
  endFrame(): void;
  resize(width: number, height: number): void;
  destroy(): void;
}

export async function createRenderer(
  canvas: HTMLCanvasElement,
  preference: RendererPreference,
  onError: (error: Error) => void,
): Promise<Renderer> {
  if (preference === 'webgl2' || preference === 'canvas2d') {
    throw new GraphicsBackendUnavailableError(
      `${preference} renderer is not implemented in P01; compatibility backends are planned for P06. No fallback was selected.`,
    );
  }
  const renderer = new WebGPURenderer(onError);
  try {
    await renderer.initialize(canvas);
    return renderer;
  } catch (error) {
    if (preference === 'auto' && error instanceof WebGPUNotSupportedError) {
      throw new UnsupportedGraphicsError(
        'No graphics backend is available: WebGPU is unavailable, and WebGL2/Canvas2D are not implemented until P06.',
        { cause: error },
      );
    }
    throw error;
  }
}

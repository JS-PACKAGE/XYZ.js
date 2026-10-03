import type { Renderer, RenderStats } from '../../src/index.js';

export interface FrameProof {
  bytes: Uint8ClampedArray;
  width: number;
  height: number;
  stats: RenderStats;
  png: string;
}
export interface FrameProofs {
  readonly graphicsEvents: string[];
  next(): Promise<FrameProof>;
}

export function errorDetail(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const own = error.stack ?? error.message;
  const causes = error instanceof AggregateError ? [...error.errors] : [];
  if (error.cause !== undefined) causes.push(error.cause);
  return [
    own,
    ...causes.map((cause) => `Caused by: ${errorDetail(cause)}`),
  ].join('\n');
}

/** Fixture-only access, also used by native-profiles for real device-loss injection. */
function activeDevice(renderer: Renderer): GPUDevice | undefined {
  const native = renderer as Renderer & {
    current?: Renderer;
    device?: GPUDevice;
  };
  return native.device ?? (native.current && activeDevice(native.current));
}

/** Capture the submitted frame, not a canvas buffer the compositor may have discarded. */
export function frameProofs(
  renderer: Renderer,
  canvas: HTMLCanvasElement,
  onGraphicsEvent?: () => void,
): FrameProofs {
  let configuredDevice: GPUDevice | undefined;
  const graphicsEvents: string[] = [];
  const recordGraphicsEvent = (message: string): void => {
    graphicsEvents.push(message);
    onGraphicsEvent?.();
  };
  const observedDevices = new WeakSet<GPUDevice>();
  const observeDevice = (): void => {
    const device = activeDevice(renderer);
    if (!device || observedDevices.has(device)) return;
    observedDevices.add(device);
    const destroy = device.destroy.bind(device);
    device.destroy = (): undefined => {
      recordGraphicsEvent(
        errorDetail(new Error('Fixture observed GPUDevice.destroy()')),
      );
      destroy();
      return undefined;
    };
    void device.lost.then((info) => {
      recordGraphicsEvent(`GPUDevice lost (${info.reason}): ${info.message}`);
    });
    device.addEventListener(
      'uncapturederror',
      (event: GPUUncapturedErrorEvent) => {
        recordGraphicsEvent(
          `GPUDevice uncaptured error: ${errorDetail(event.error)}`,
        );
      },
    );
  };
  observeDevice();
  let pending:
    | { resolve(proof: FrameProof): void; reject(error: unknown): void }
    | undefined;
  let frameStarted = false;
  canvas.addEventListener('webglcontextlost', (event) => {
    const { statusMessage } = event as WebGLContextEvent;
    recordGraphicsEvent(
      `WebGL context lost: ${statusMessage || 'No driver status message.'}`,
    );
  });
  canvas.addEventListener('webglcontextrestored', () => {
    recordGraphicsEvent('WebGL context restored');
  });
  const beginFrame = renderer.beginFrame.bind(renderer);
  const endFrame = renderer.endFrame.bind(renderer);
  const copy = document.createElement('canvas');
  const context = copy.getContext('2d', { willReadFrequently: true });
  if (!context)
    throw new Error('Pixel readback unavailable: no Canvas2D copy context.');

  renderer.beginFrame = (): void => {
    observeDevice();
    if (renderer.backend === 'webgpu') {
      const device = activeDevice(renderer);
      if (device && device !== configuredDevice) {
        const gpu = canvas.getContext('webgpu');
        if (!gpu)
          throw new Error(
            'Pixel readback unavailable: no WebGPU canvas context.',
          );
        const configuration = gpu.getConfiguration();
        if (!configuration || configuration.device !== device)
          throw new Error(
            'Pixel readback unavailable: WebGPU device/configuration mismatch.',
          );
        // No product API or alternate renderer: only permit copying its actual output.
        gpu.configure({
          ...configuration,
          usage:
            (configuration.usage ?? GPUTextureUsage.RENDER_ATTACHMENT) |
            GPUTextureUsage.COPY_SRC,
        });
        configuredDevice = device;
      }
    }
    const previousFrame = renderer.stats.frame;
    beginFrame();
    frameStarted = renderer.stats.frame > previousFrame;
  };

  const capture = async (stats: RenderStats): Promise<FrameProof> => {
    const width = canvas.width;
    const height = canvas.height;
    copy.width = width;
    copy.height = height;
    let bytes: Uint8ClampedArray;
    if (renderer.backend === 'webgpu') {
      const device = activeDevice(renderer);
      if (!device || device !== configuredDevice)
        throw new Error(
          'Pixel readback unavailable: no active configured WebGPU device.',
        );
      const texture = canvas.getContext('webgpu')!.getCurrentTexture();
      if (!['rgba8unorm', 'bgra8unorm'].includes(texture.format))
        throw new Error(
          `Pixel readback unavailable: unsupported canvas format ${texture.format}.`,
        );
      const bytesPerRow = Math.ceil((width * 4) / 256) * 256;
      const buffer = device.createBuffer({
        size: bytesPerRow * height,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });
      try {
        const encoder = device.createCommandEncoder();
        encoder.copyTextureToBuffer({ texture }, { buffer, bytesPerRow }, [
          width,
          height,
        ]);
        // Enqueued synchronously after endFrame, before this surface is presented.
        device.queue.submit([encoder.finish()]);
        await buffer.mapAsync(GPUMapMode.READ);
        const mapped = new Uint8Array(buffer.getMappedRange());
        const image = context.createImageData(width, height);
        bytes = image.data;
        for (let y = 0; y < height; y++)
          bytes.set(
            mapped.subarray(y * bytesPerRow, y * bytesPerRow + width * 4),
            y * width * 4,
          );
        if (texture.format === 'bgra8unorm')
          for (let i = 0; i < bytes.length; i += 4) {
            const red = bytes[i + 2];
            bytes[i + 2] = bytes[i];
            bytes[i] = red;
          }
        context.putImageData(image, 0, 0);
      } finally {
        buffer.destroy();
      }
    } else {
      // WebGL's unpreserved drawing buffer is still alive in the submission task.
      context.drawImage(canvas, 0, 0);
      bytes = context.getImageData(0, 0, width, height).data;
    }
    return { bytes, width, height, stats, png: copy.toDataURL('image/png') };
  };

  renderer.endFrame = (): void => {
    try {
      endFrame();
      const request = pending;
      if (!request) return;
      pending = undefined;
      if (!frameStarted) {
        request.reject(
          new Error(
            'Frame proof requires a newly submitted frame; native recovery skipped this frame.',
          ),
        );
        return;
      }
      frameStarted = false;
      void capture({ ...renderer.stats }).then(request.resolve, request.reject);
    } catch (error) {
      pending?.reject(error);
      pending = undefined;
      throw error;
    }
  };
  return {
    graphicsEvents,
    next: () => {
      if (pending) throw new Error('A frame proof is already pending.');
      return new Promise((resolve, reject) => {
        pending = { resolve, reject };
      });
    },
  };
}

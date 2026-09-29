export class XYZError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class GraphicsError extends XYZError {}

export class WebGPUNotSupportedError extends GraphicsError {}

export class WebGPUInitializationError extends GraphicsError {}

export class WebGPUDeviceLostError extends GraphicsError {}

export class GraphicsBackendUnavailableError extends GraphicsError {}

export class UnsupportedGraphicsError extends GraphicsError {}

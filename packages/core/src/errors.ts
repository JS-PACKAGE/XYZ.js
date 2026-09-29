import { XYZError } from '../../graphics/src/index.js';

export class RuntimeError extends XYZError {
  constructor(message: string, options?: ErrorOptions) {
    super(`[XYZ Runtime] ${message}`, options);
    this.name = 'RuntimeError';
  }
}

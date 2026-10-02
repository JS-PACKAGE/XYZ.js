import type { TrustedWorkerJob } from '../../assets/src/worker-job-runtime.js';
import {
  processHeightfieldGeometry,
  type HeightfieldGeometryRequest,
  type HeightfieldGeometryResult,
} from './geometry-processing.js';

/** The execute path validates the entire request once, before doing CPU work. */
export const trustedHeightfieldGeometryJob: TrustedWorkerJob<
  HeightfieldGeometryRequest,
  HeightfieldGeometryResult
> = {
  decode(value) {
    if (!value || typeof value !== 'object')
      throw new TypeError('A heightfield request is required.');
    return value as HeightfieldGeometryRequest;
  },
  execute(request) {
    const value = processHeightfieldGeometry(request);
    const streams = [value.positions, value.normals, value.uvs, value.indices];
    const transfer =
      request.transferResult === false
        ? []
        : streams.map((stream) => stream.buffer as ArrayBuffer);
    const byteLength = streams.reduce(
      (sum, stream) => sum + stream.byteLength,
      0,
    );
    return { value, transfer, byteLength };
  },
};

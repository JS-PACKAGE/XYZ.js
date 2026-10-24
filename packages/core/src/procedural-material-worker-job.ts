import type { TrustedWorkerJob } from '../../assets/src/worker-job-runtime.js';
import {
  generateProceduralMaps,
  type ProceduralMaps,
} from './procedural-material-maps.js';
import type { ProceduralMapsRequest } from './procedural-material.js';

/** Runs inside an application-trusted Worker; the main thread validated the request. */
export const trustedProceduralMapsJob: TrustedWorkerJob<
  ProceduralMapsRequest,
  ProceduralMaps
> = {
  decode(value) {
    if (!value || typeof value !== 'object')
      throw new TypeError('A procedural maps request is required.');
    return value as ProceduralMapsRequest;
  },
  execute(request) {
    const value = generateProceduralMaps(
      request.kind,
      request.size,
      request.seed,
      {
        contrast: request.contrast,
        roughnessBias: request.roughnessBias,
        tint: request.tint,
        heightMap: request.heightMap,
      },
    );
    const streams = [
      value.baseColor,
      value.normal,
      value.metallicRoughness,
      value.occlusion,
    ];
    if (value.height) streams.push(value.height);
    return {
      value,
      transfer: streams.map((stream) => stream.buffer as ArrayBuffer),
      byteLength: streams.reduce((sum, stream) => sum + stream.byteLength, 0),
    };
  },
};

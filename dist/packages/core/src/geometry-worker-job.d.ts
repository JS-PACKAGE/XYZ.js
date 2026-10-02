import type { TrustedWorkerJob } from '../../assets/src/worker-job-runtime.js';
import { type HeightfieldGeometryRequest, type HeightfieldGeometryResult } from './geometry-processing.js';
/** The execute path validates the entire request once, before doing CPU work. */
export declare const trustedHeightfieldGeometryJob: TrustedWorkerJob<HeightfieldGeometryRequest, HeightfieldGeometryResult>;

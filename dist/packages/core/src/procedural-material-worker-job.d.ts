import type { TrustedWorkerJob } from '../../assets/src/worker-job-runtime.js';
import { type ProceduralMaps } from './procedural-material-maps.js';
import type { ProceduralMapsRequest } from './procedural-material.js';
/** Runs inside an application-trusted Worker; the main thread validated the request. */
export declare const trustedProceduralMapsJob: TrustedWorkerJob<ProceduralMapsRequest, ProceduralMaps>;

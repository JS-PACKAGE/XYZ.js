import { installWorkerJobs } from '../../../assets/src/worker-job-runtime.js';
import { trustedHeightfieldGeometryJob } from '../geometry-worker-job.js';

installWorkerJobs({ 'geometry.heightfield': trustedHeightfieldGeometryJob });

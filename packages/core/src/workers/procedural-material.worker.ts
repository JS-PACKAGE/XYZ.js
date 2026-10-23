import { installWorkerJobs } from '../../../assets/src/worker-job-runtime.js';
import { trustedProceduralMapsJob } from '../procedural-material-worker-job.js';

installWorkerJobs({ 'procedural.maps': trustedProceduralMapsJob });

import {
  installWorkerJobs,
  trustedHeightfieldGeometryJob,
} from '../../src/index.js';

installWorkerJobs({ 'geometry.heightfield': trustedHeightfieldGeometryJob });

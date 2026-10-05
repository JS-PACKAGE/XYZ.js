//#region dist/src/data/worker-jobs.js
var workerJobLimits = Object.freeze({
	workers: 8,
	defaultWorkers: 2,
	queuedJobs: 128,
	defaultQueuedJobs: 16,
	requestBytes: 67108864,
	resultBytes: 67108864,
	admittedBytes: 134217728,
	executionMilliseconds: 3e4,
	typeLength: 128,
	keyLength: 256,
	errorLength: 4096,
	geometryVertices: 1048576,
	geometryIterations: 512
});
//#endregion
exports.workerJobLimits = workerJobLimits;

//# sourceMappingURL=worker-jobs.cjs.map
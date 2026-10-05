const require_worker_jobs = require("../../../src/data/worker-jobs.cjs");
//#region dist/packages/assets/src/worker-job-protocol.js
var workerJobProtocol = `xyz-worker-job-v1`;
function workerByteCount(e, t, n) {
	if (!Number.isSafeInteger(e) || e < 0 || e > t) throw RangeError(`${n} must be an integer in [0, ${t}].`);
}
function workerTransferBytes(e) {
	let t = /* @__PURE__ */ new Set(), n = 0;
	for (let r of e) {
		if (t.has(r)) throw TypeError(`Duplicate worker transfer ownership.`);
		t.add(r), r instanceof ArrayBuffer && (n += r.byteLength);
	}
	return n;
}
function validWorkerType(t) {
	return typeof t == `string` && t.length > 0 && t.length <= require_worker_jobs.workerJobLimits.typeLength && /^[a-zA-Z0-9_.-]+$/.test(t);
}
//#endregion
exports.validWorkerType = validWorkerType;
exports.workerByteCount = workerByteCount;
exports.workerJobProtocol = workerJobProtocol;
exports.workerTransferBytes = workerTransferBytes;

//# sourceMappingURL=worker-job-protocol.cjs.map
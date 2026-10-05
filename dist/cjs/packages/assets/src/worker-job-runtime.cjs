const require_worker_jobs = require("../../../src/data/worker-jobs.cjs");
const require_worker_job_protocol = require("./worker-job-protocol.cjs");
//#region dist/packages/assets/src/worker-job-runtime.js
function installWorkerJobs(a, o = globalThis) {
	let s = !1, c = !1, l = /* @__PURE__ */ new Map(), u = { own(e, t) {
		if (s) throw t(e), Error(`Trusted worker owner was disposed before the payload claim.`);
		if (l.has(e)) throw TypeError(`Worker response ownership was already claimed.`);
		return l.set(e, t), e;
	} }, clean = (e) => {
		let t = [];
		for (let [n, r] of l) if (n !== e) {
			l.delete(n);
			try {
				r(n);
			} catch (e) {
				t.push(e);
			}
		}
		if (t.length) throw AggregateError(t, `Worker owned payload cleanup failed.`);
	};
	return o.onmessage = (d) => {
		let f = d.data;
		if (s || !f || f.protocol !== require_worker_job_protocol.workerJobProtocol || f.type !== `run` || !Number.isSafeInteger(f.id) || f.id <= 0) return;
		let p = f.id, respond = (n) => {
			let r = n instanceof Error ? n : Error(String(n));
			o.postMessage({
				protocol: require_worker_job_protocol.workerJobProtocol,
				type: `error`,
				id: p,
				error: {
					name: r.name.slice(0, require_worker_jobs.workerJobLimits.typeLength),
					message: r.message.slice(0, require_worker_jobs.workerJobLimits.errorLength)
				}
			}, []);
		};
		if (c) {
			respond(Error(`Trusted worker received concurrent work.`));
			return;
		}
		c = !0;
		let run = async () => {
			let d = !1;
			try {
				if (!require_worker_job_protocol.validWorkerType(f.jobType)) throw TypeError(`Invalid worker job type.`);
				if (require_worker_job_protocol.workerByteCount(f.requestBytes, require_worker_jobs.workerJobLimits.requestBytes, `Request bytes`), !Object.hasOwn(a, f.jobType)) throw TypeError(`Unknown trusted worker job type.`);
				let c = a[f.jobType], m = performance.now(), h = await c.execute(c.decode(f.request), u), g = performance.now() - m;
				require_worker_job_protocol.workerByteCount(h.byteLength, require_worker_jobs.workerJobLimits.resultBytes, `Result bytes`);
				let _ = require_worker_job_protocol.workerTransferBytes(h.transfer);
				if (_ > h.byteLength) throw RangeError(`Worker response transfer exceeds its declared byte count.`);
				if (s) return;
				clean(h.value), o.postMessage({
					protocol: require_worker_job_protocol.workerJobProtocol,
					type: `result`,
					id: p,
					value: h.value,
					computeMilliseconds: g,
					resultBytes: h.byteLength,
					transferredBytes: _
				}, h.transfer), l.delete(h.value), d = !0;
			} catch (e) {
				let t = e;
				try {
					clean();
				} catch (n) {
					t = AggregateError([e, n], `Worker execution and cleanup failed.`);
				}
				s || respond(t);
			} finally {
				c = !1, d || clean();
			}
		};
		run();
	}, () => {
		s || (s = !0, o.onmessage = null, clean());
	};
}
//#endregion
exports.installWorkerJobs = installWorkerJobs;

//# sourceMappingURL=worker-job-runtime.cjs.map
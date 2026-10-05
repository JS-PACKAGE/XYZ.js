const require_worker_jobs = require("../../../src/data/worker-jobs.cjs");
const require_worker_job_protocol = require("./worker-job-protocol.cjs");
//#region dist/packages/assets/src/worker-jobs.js
var WorkerJobError = class extends Error {
	code;
	constructor(e, t, n) {
		super(t, n), this.code = e, this.name = `WorkerJobError`;
	}
};
function boundedPositive(e, t, r) {
	if (require_worker_job_protocol.workerByteCount(e, t, r), e === 0) throw RangeError(`${r} must be positive.`);
}
function lateHandler(e) {
	return (n) => {
		let r = n.data;
		r?.protocol === require_worker_job_protocol.workerJobProtocol && r.type === `result` && e(r.value);
	};
}
var NativeWorkerPool = class {
	moduleURL;
	workerCount;
	queueLimit;
	byteLimit;
	executionLimit;
	factory;
	slots = /* @__PURE__ */ new Set();
	jobs = /* @__PURE__ */ new Map();
	keyedJobs = /* @__PURE__ */ new Map();
	queue = [];
	nextId = 1;
	bytes = 0;
	completed = 0;
	cancelled = 0;
	failed = 0;
	disposed = !1;
	pumping = !1;
	constructor(t) {
		if (this.moduleURL = new URL(t.moduleURL), ![
			`http:`,
			`https:`,
			`file:`
		].includes(this.moduleURL.protocol) || this.moduleURL.username || this.moduleURL.password) throw TypeError(`A trusted HTTP(S) or file module URL without credentials is required.`);
		if (this.workerCount = t.workers ?? require_worker_jobs.workerJobLimits.defaultWorkers, this.queueLimit = t.queuedJobs ?? require_worker_jobs.workerJobLimits.defaultQueuedJobs, this.byteLimit = t.admittedBytes ?? require_worker_jobs.workerJobLimits.admittedBytes, this.executionLimit = t.executionMilliseconds ?? require_worker_jobs.workerJobLimits.executionMilliseconds, boundedPositive(this.workerCount, require_worker_jobs.workerJobLimits.workers, `Worker count`), require_worker_job_protocol.workerByteCount(this.queueLimit, require_worker_jobs.workerJobLimits.queuedJobs, `Queued jobs`), boundedPositive(this.byteLimit, require_worker_jobs.workerJobLimits.admittedBytes, `Admitted bytes`), boundedPositive(this.executionLimit, require_worker_jobs.workerJobLimits.executionMilliseconds, `Execution milliseconds`), !t.workerFactory && typeof Worker > `u`) throw new WorkerJobError(`unsupported`, `Native module Workers are unavailable.`);
		this.factory = t.workerFactory ?? ((e) => new Worker(e, { type: `module` }));
	}
	get destroyed() {
		return this.disposed;
	}
	get stats() {
		return {
			workers: this.slots.size,
			running: this.jobs.size - this.queue.length,
			queued: this.queue.length,
			admittedBytes: this.bytes,
			completed: this.completed,
			cancelled: this.cancelled,
			failed: this.failed
		};
	}
	submit(t, a, o) {
		if (this.disposed) throw new WorkerJobError(`destroyed`, `Worker pool is destroyed.`);
		if (!t || !require_worker_job_protocol.validWorkerType(t.type) || typeof t.decode != `function` || typeof t.release != `function`) throw TypeError(`A typed worker definition with decode and release is required.`);
		if (require_worker_job_protocol.workerByteCount(o.requestBytes, require_worker_jobs.workerJobLimits.requestBytes, `Request bytes`), o.key !== void 0 && (typeof o.key != `string` || o.key.length === 0 || o.key.length > require_worker_jobs.workerJobLimits.keyLength)) throw TypeError(`Invalid worker supersession key.`);
		if (o.signal?.aborted) throw new WorkerJobError(`cancelled`, `Worker job was already aborted.`, { cause: o.signal.reason });
		let s = o.transfer ? [...o.transfer] : [], c = require_worker_job_protocol.workerTransferBytes(s);
		if (c > o.requestBytes) throw RangeError(`Transferred bytes exceed the declared request bytes.`);
		let l = o.key === void 0 ? void 0 : this.keyedJobs.get(o.key), u = this.bytes - (l?.bytes ?? 0) + o.requestBytes, d = this.jobs.size - this.queue.length - +(l?.status === `running`), f = this.queue.length - +(l?.status === `queued`);
		if (u > this.byteLimit || d >= this.workerCount && f >= this.queueLimit) throw new WorkerJobError(`admission`, `Worker job queue or admitted byte budget is full.`);
		l && this.cancelJob(l, new WorkerJobError(`cancelled`, `Worker job was superseded.`), !1);
		let p, m, h = new Promise((e, t) => {
			p = e, m = t;
		}), g = {
			id: this.nextId++,
			definition: t,
			request: a,
			transfer: s,
			bytes: o.requestBytes,
			transferredBytes: c,
			created: performance.now(),
			started: 0,
			dispatchMilliseconds: 0,
			status: `queued`,
			key: o.key,
			signal: o.signal,
			resolve: p,
			reject: m
		};
		return this.jobs.set(g.id, g), this.bytes += g.bytes, this.queue.push(g), g.key !== void 0 && this.keyedJobs.set(g.key, g), g.abort = () => this.cancelJob(g, new WorkerJobError(`cancelled`, `Worker job was aborted.`, { cause: g.signal?.reason })), g.signal?.addEventListener(`abort`, g.abort, { once: !0 }), this.pump(), {
			id: g.id,
			get status() {
				return g.status;
			},
			promise: h,
			cancel: (e) => this.cancelJob(g, new WorkerJobError(`cancelled`, `Worker job was cancelled.`, { cause: e }))
		};
	}
	destroy() {
		if (this.disposed) return;
		this.disposed = !0;
		let e = new WorkerJobError(`destroyed`, `Worker pool was destroyed.`);
		for (let t of this.jobs.values()) t.slot && this.retire(t.slot, t.definition.release), this.finish(t, `failed`, e);
		for (let e of this.slots) this.retire(e);
		this.queue.length = 0, this.keyedJobs.clear();
	}
	pump() {
		if (!(this.pumping || this.disposed)) {
			this.pumping = !0;
			try {
				for (; this.queue.length;) {
					let e;
					for (let t of this.slots) if (!t.job) {
						e = t;
						break;
					}
					if (!e && this.slots.size >= this.workerCount) break;
					let n = this.queue.shift();
					if (!e) try {
						e = {
							worker: this.factory(this.moduleURL),
							retired: !1
						}, this.slots.add(e);
					} catch (e) {
						this.finish(n, `failed`, new WorkerJobError(`worker-failed`, `Native worker creation failed.`, { cause: e }));
						continue;
					}
					let r = e;
					r.job = n, n.slot = r, n.status = `running`, n.started = performance.now(), r.worker.onmessage = (e) => this.receive(r, n, e), r.worker.onerror = (e) => {
						e.preventDefault(), this.failWorker(r, n, new WorkerJobError(`worker-failed`, e.message || `Native worker failed.`));
					}, r.worker.onmessageerror = () => this.failWorker(r, n, new WorkerJobError(`protocol`, `Worker response could not be deserialized.`)), n.timeout = setTimeout(() => this.failWorker(r, n, new WorkerJobError(`timeout`, `Worker job exceeded its execution limit.`)), this.executionLimit);
					try {
						let e = performance.now();
						r.worker.postMessage({
							protocol: require_worker_job_protocol.workerJobProtocol,
							type: `run`,
							id: n.id,
							jobType: n.definition.type,
							request: n.request,
							requestBytes: n.bytes
						}, n.transfer), n.dispatchMilliseconds = performance.now() - e, n.request = void 0, n.transfer = [];
					} catch (e) {
						this.failWorker(r, n, new WorkerJobError(`worker-failed`, `Worker request transfer failed.`, { cause: e }));
					}
				}
			} finally {
				this.pumping = !1;
			}
		}
	}
	receive(r, i, a) {
		let o = a.data;
		if (r.retired || !this.jobs.has(i.id)) {
			lateHandler(i.definition.release)(a);
			return;
		}
		if (!o || o.protocol !== require_worker_job_protocol.workerJobProtocol || o.id !== i.id || o.type !== `result` && o.type !== `error`) {
			try {
				o?.type === `result` && i.definition.release(o.value);
			} finally {
				this.failWorker(r, i, new WorkerJobError(`protocol`, `Unexpected worker response.`));
			}
			return;
		}
		if (o.type === `error`) {
			if (!o.error || typeof o.error.name != `string` || typeof o.error.message != `string`) {
				this.failWorker(r, i, new WorkerJobError(`protocol`, `Malformed worker error.`));
				return;
			}
			let t = Error(o.error.message.slice(0, require_worker_jobs.workerJobLimits.errorLength));
			t.name = o.error.name.slice(0, require_worker_jobs.workerJobLimits.typeLength), this.failWorker(r, i, new WorkerJobError(`job-failed`, t.message, { cause: t }));
			return;
		}
		let s = o, c;
		try {
			if (require_worker_job_protocol.workerByteCount(s.resultBytes, require_worker_jobs.workerJobLimits.resultBytes, `Result bytes`), require_worker_job_protocol.workerByteCount(s.transferredBytes, s.resultBytes, `Result transferred bytes`), typeof s.computeMilliseconds != `number` || !Number.isFinite(s.computeMilliseconds) || s.computeMilliseconds < 0) throw TypeError(`Invalid worker compute duration.`);
			c = i.definition.decode(s.value);
		} catch (e) {
			try {
				i.definition.release(s.value);
			} finally {
				this.failWorker(r, i, new WorkerJobError(`protocol`, `Worker result validation failed.`, { cause: e }));
			}
			return;
		}
		if (!this.jobs.has(i.id)) {
			i.definition.release(s.value);
			return;
		}
		let l = {
			value: c,
			timing: {
				queueMilliseconds: i.started - i.created,
				dispatchMilliseconds: i.dispatchMilliseconds,
				computeMilliseconds: s.computeMilliseconds,
				elapsedMilliseconds: performance.now() - i.created,
				requestBytes: i.bytes,
				requestTransferredBytes: i.transferredBytes,
				requestCopiedBytes: i.bytes - i.transferredBytes,
				resultBytes: s.resultBytes,
				resultTransferredBytes: s.transferredBytes,
				resultCopiedBytes: s.resultBytes - s.transferredBytes
			}
		}, u = i.resolve;
		this.finish(i, `succeeded`), r.worker.onmessage = null, r.worker.onerror = (e) => {
			e.preventDefault(), this.retire(r), this.pump();
		}, r.worker.onmessageerror = () => {
			this.retire(r), this.pump();
		}, u?.(l), this.pump();
	}
	finish(e, t, n) {
		if (!this.jobs.delete(e.id)) return;
		this.bytes -= e.bytes;
		let r = this.queue.indexOf(e);
		r !== -1 && this.queue.splice(r, 1), e.key !== void 0 && this.keyedJobs.get(e.key) === e && this.keyedJobs.delete(e.key), e.abort && e.signal?.removeEventListener(`abort`, e.abort), clearTimeout(e.timeout), e.slot?.job === e && (e.slot.job = void 0), e.slot = void 0, e.request = void 0, e.transfer = [], e.abort = void 0, e.timeout = void 0, e.status = t, t === `succeeded` ? this.completed++ : t === `cancelled` ? this.cancelled++ : this.failed++;
		let i = e.reject;
		e.resolve = void 0, e.reject = void 0, n !== void 0 && i?.(n);
	}
	retire(e, t) {
		e.retired || (e.retired = !0, e.worker.onmessage = t ? lateHandler(t) : null, e.worker.onerror = null, e.worker.onmessageerror = null, e.worker.terminate(), this.slots.delete(e));
	}
	failWorker(e, t, n) {
		this.jobs.has(t.id) && (this.retire(e, t.definition.release), this.finish(t, `failed`, n), this.pump());
	}
	cancelJob(e, t, n = !0) {
		this.jobs.has(e.id) && (e.slot && this.retire(e.slot, e.definition.release), this.finish(e, `cancelled`, t), n && this.pump());
	}
};
//#endregion
exports.NativeWorkerPool = NativeWorkerPool;
exports.WorkerJobError = WorkerJobError;

//# sourceMappingURL=worker-jobs.cjs.map
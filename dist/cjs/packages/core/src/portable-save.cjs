const require_subscribe_load = require("../../assets/src/preload/subscribe-load.cjs");
const require_storage = require("../../../src/data/storage.cjs");
const require_storage$1 = require("./storage.cjs");
//#region dist/packages/core/src/portable-save.js
async function readSaveFile(r, i) {
	if (i?.throwIfAborted(), r.size > require_storage.storageLimits.maxBytes) throw new require_storage$1.StorageError(`size`, `Save exceeds ${require_storage.storageLimits.maxBytes} bytes.`);
	let a = await require_subscribe_load.subscribeLoad(r.text(), i);
	return i?.throwIfAborted(), a;
}
var PortableSaveFiles = class {
	saves;
	options;
	pending;
	lifetime = new AbortController();
	constructor(e, t) {
		this.saves = e, this.options = t;
	}
	async exportFile(e) {
		let t = e ? AbortSignal.any([e, this.lifetime.signal]) : this.lifetime.signal;
		t.throwIfAborted();
		let n = await this.saves.export(this.options.slot, { signal: t });
		return t.throwIfAborted(), new Blob([n], { type: `application/json` });
	}
	async importFile(e, n = {}) {
		this.lifetime.signal.throwIfAborted(), this.pending?.abort(new DOMException(`File import was superseded.`, `AbortError`));
		let r = new AbortController();
		this.pending = r;
		let i = AbortSignal.any([
			r.signal,
			this.lifetime.signal,
			...n.signal ? [n.signal] : []
		]);
		try {
			let r = await this.saves.load(this.options.slot, { signal: i });
			if (r.status === `corrupt`) throw r.error;
			let a = n.expectedRevision ?? this.saves.observedRevision(this.options.slot), o = await readSaveFile(e, i), s = await this.saves.decodeImport(o, { signal: i });
			return await require_subscribe_load.subscribeLoad(this.options.validateCandidate(s, i), i), i.throwIfAborted(), await this.saves.save(this.options.slot, s.data, s.metadata.playTime, {
				...n,
				expectedRevision: a,
				signal: i
			});
		} finally {
			this.pending === r && (this.pending = void 0);
		}
	}
	destroy() {
		this.lifetime.abort(new DOMException(`Portable save owner is destroyed.`, `AbortError`)), this.pending?.abort(this.lifetime.signal.reason);
	}
};
function downloadSaveFile(e, t, n = globalThis.document) {
	let r = URL.createObjectURL(e), i = n.createElement(`a`);
	i.href = r, i.download = t, i.hidden = !0, n.body.append(i);
	try {
		i.click();
	} catch (e) {
		throw URL.revokeObjectURL(r), e;
	} finally {
		i.remove();
	}
	return () => URL.revokeObjectURL(r);
}
//#endregion
exports.PortableSaveFiles = PortableSaveFiles;
exports.downloadSaveFile = downloadSaveFile;
exports.readSaveFile = readSaveFile;

//# sourceMappingURL=portable-save.cjs.map
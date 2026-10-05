const require_errors = require("./errors.cjs");
const require_gpu_programs = require("../../../src/data/gpu-programs.cjs");
const require_material2d = require("../../core/src/materials2d/material2d.cjs");
//#region dist/packages/graphics/src/render-graph.js
var RenderGraph = class extends EventTarget {
	targets;
	passes;
	schedule;
	output;
	label;
	disposed = !1;
	constructor(i) {
		super();
		let validName = (e) => typeof e == `string` && /^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(e);
		if (!i.targets.length || i.targets.length > require_gpu_programs.renderGraphLimits.targets || !i.passes.length || i.passes.length > require_gpu_programs.renderGraphLimits.passes) throw RangeError(`Render graph resource/pass count exceeds engine limits.`);
		let a = /* @__PURE__ */ new Map();
		for (let e of i.targets) {
			if (!validName(e.name) || a.has(e.name)) throw TypeError(`Render graph target names must be unique identifiers.`);
			if (e.format !== void 0 && ![`rgba8unorm`, `rgba16float`].includes(e.format)) throw TypeError(`Unsupported render graph target format.`);
			if (e.width === void 0 != (e.height === void 0) || e.width !== void 0 && e.scale !== void 0) throw RangeError(`Graph target resolution must be fixed width/height or relative scale.`);
			for (let t of [e.width, e.height]) if (t !== void 0 && (!Number.isSafeInteger(t) || t < 1 || t > require_gpu_programs.renderGraphLimits.dimension)) throw RangeError(`Graph target dimensions exceed limits.`);
			if (e.scale !== void 0 && (!Number.isFinite(e.scale) || e.scale <= 0 || e.scale > 4)) throw RangeError(`Graph target scale must be in (0,4].`);
			a.set(e.name, Object.freeze({
				...e,
				format: e.format ?? `rgba8unorm`
			}));
		}
		let o = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Set(), c = i.passes.map((i) => {
			if (!validName(i.name) || s.has(i.name)) throw TypeError(`Render graph pass names must be unique identifiers.`);
			if (s.add(i.name), !a.has(i.output) || o.has(i.output)) throw new require_errors.GraphicsError(`Every graph target has exactly one declared writer.`);
			if (!i.inputs.length || i.inputs.length > require_gpu_programs.renderGraphLimits.inputs || i.inputs.some((e) => e !== `$scene` && !a.has(e)) || i.inputs.includes(i.output)) throw new require_errors.GraphicsError(`Graph attachment reads are missing, excessive, or alias the write target.`);
			if (!(i.effect instanceof require_material2d.PostProcessor2D)) throw TypeError(`Graph passes require native PostProcessor2D descriptors.`);
			require_material2d.validateEffect2D(i.effect);
			let c = Object.freeze({
				...i,
				inputs: Object.freeze([...i.inputs])
			});
			return o.set(i.output, c), c;
		});
		if (a.size !== o.size || !a.has(i.output)) throw new require_errors.GraphicsError(`Graph targets must all be written and the presentation output must exist.`);
		let l = [], u = /* @__PURE__ */ new Set(), d = /* @__PURE__ */ new Set(), visit = (e) => {
			if (!u.has(e.name)) {
				if (d.has(e.name)) throw new require_errors.GraphicsError(`Render graph attachment dependency cycle.`);
				d.add(e.name);
				for (let t of e.inputs) t !== `$scene` && visit(o.get(t));
				d.delete(e.name), u.add(e.name), l.push(e);
			}
		};
		for (let e of c) visit(e);
		this.targets = Object.freeze([...a.values()]), this.passes = Object.freeze(c), this.schedule = Object.freeze(l), this.output = i.output, this.label = i.label ?? `RenderGraph`;
	}
	get destroyed() {
		return this.disposed;
	}
	validate() {
		if (this.disposed) throw new require_errors.GraphicsError(`RenderGraph is destroyed.`);
		for (let e of this.passes) require_material2d.validateEffect2D(e.effect);
	}
	resolutions(e, t, r = require_gpu_programs.renderGraphLimits.dimension) {
		if (this.validate(), !Number.isSafeInteger(e) || !Number.isSafeInteger(t) || e < 1 || t < 1) throw RangeError(`Graph frame dimensions must be positive integer pixels.`);
		let i = 0, a = this.targets.map((a) => {
			let o = a.width ?? Math.max(1, Math.round(e * (a.scale ?? 1))), s = a.height ?? Math.max(1, Math.round(t * (a.scale ?? 1)));
			if (o > Math.min(r, require_gpu_programs.renderGraphLimits.dimension) || s > Math.min(r, require_gpu_programs.renderGraphLimits.dimension)) throw RangeError(`Graph target exceeds texture dimension limits.`);
			return i += o * s * (a.format === `rgba16float` ? 8 : 4), {
				target: a,
				width: o,
				height: s
			};
		});
		if (i > require_gpu_programs.renderGraphLimits.targetBytes) throw RangeError(`Render graph exceeds the aggregate target byte budget.`);
		return a;
	}
	destroy() {
		this.disposed || (this.disposed = !0, this.dispatchEvent(new Event(`destroy`)));
	}
};
//#endregion
exports.RenderGraph = RenderGraph;

//# sourceMappingURL=render-graph.cjs.map
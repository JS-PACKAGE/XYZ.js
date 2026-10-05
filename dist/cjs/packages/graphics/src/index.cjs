const require_errors = require("./errors.cjs");
const require_logger = require("../../core/src/logger.cjs");
const require_compute = require("./compute.cjs");
const require_render_graph = require("./render-graph.cjs");
const require_render_texture2d = require("./render-texture2d.cjs");
//#region dist/packages/graphics/src/index.js
async function createRenderer(r, i, a, o = {}) {
	if (![
		`auto`,
		`webgpu`,
		`webgl2`,
		`canvas2d`
	].includes(i)) throw new require_errors.GraphicsBackendUnavailableError(`Unknown graphics renderer preference ${String(i)}.`);
	let s = i === `auto` ? [
		`webgpu`,
		`webgl2`,
		`canvas2d`
	] : [i], c = [];
	for (let t of s) {
		let n = !1, s = !0, l, report = (e) => {
			s && (n ? a(e) : l = e);
		}, u = o.antialias ?? !0, d, f = i === `auto` ? document.createElement(`canvas`) : r;
		f !== r && (f.width = r.width, f.height = r.height);
		try {
			let create;
			if (t === `canvas2d`) {
				let { Canvas2DRenderer: e } = await Promise.resolve().then(() => require("./canvas2d-renderer.cjs"));
				create = (t) => new e(t, o.gpuTiming);
			} else if (t === `webgpu`) {
				let { WebGPURenderer: e } = await Promise.resolve().then(() => require("./webgpu-renderer.cjs"));
				create = (t) => new e(t, u, o.gpuTiming);
			} else {
				let { WebGL2Renderer: e } = await Promise.resolve().then(() => require("./webgl2-renderer.cjs"));
				create = (t) => new e(t, u, o.gpuTiming);
			}
			if (t === `canvas2d` || o.recover === !1) d = create(report);
			else {
				let { ResilientRenderer: e } = await Promise.resolve().then(() => require("./resilient-renderer.cjs"));
				d = new e(t, create, report, o);
			}
			if (d.configureResidency(o.residency ?? {}), await d.initialize(f), l) throw l;
		} catch (n) {
			s = !1;
			let r = n;
			try {
				d?.destroy();
			} catch (e) {
				r = AggregateError([n, e], `${t} initialization and cleanup failed.`);
			}
			if (i !== `auto`) throw require_logger.logger.error(`${t} initialization failed.`, r), r;
			require_logger.logger.warn(`${t} unavailable during automatic selection.`, r), c.push(r);
			continue;
		}
		if (i === `auto`) {
			let i;
			try {
				let { PresentedRenderer: e } = await Promise.resolve().then(() => require("./presented-renderer.cjs"));
				if (i = new e(d, f), await i.initialize(r), l) throw l;
			} catch (n) {
				s = !1;
				try {
					(i ?? d).destroy();
				} catch (r) {
					let i = AggregateError([n, r], `Presentation cleanup failed.`);
					c.push(i), require_logger.logger.warn(`${t} presentation failed during automatic selection.`, i);
					continue;
				}
				c.push(n), require_logger.logger.warn(`${t} presentation failed during automatic selection.`, n);
				continue;
			}
			return n = !0, require_logger.logger.info(`Using ${t} graphics backend.`), i;
		}
		return n = !0, require_logger.logger.info(`Using ${t} graphics backend.`), d;
	}
	throw require_logger.logger.error(`No graphics backend could initialize.`, ...c), new require_errors.UnsupportedGraphicsError(`No graphics backend could initialize (WebGPU → WebGL2 → Canvas2D).`, { cause: AggregateError(c, `Graphics initialization failures.`) });
}
//#endregion
exports.Canvas2DInitializationError = require_errors.Canvas2DInitializationError;
exports.ComputeBuffer = require_compute.ComputeBuffer;
exports.ComputeProgram = require_compute.ComputeProgram;
exports.GraphicsBackendUnavailableError = require_errors.GraphicsBackendUnavailableError;
exports.GraphicsError = require_errors.GraphicsError;
exports.RenderGraph = require_render_graph.RenderGraph;
exports.RenderTexture2D = require_render_texture2d.RenderTexture2D;
exports.UnsupportedGraphicsError = require_errors.UnsupportedGraphicsError;
exports.WebGL2ContextLostError = require_errors.WebGL2ContextLostError;
exports.WebGL2InitializationError = require_errors.WebGL2InitializationError;
exports.WebGPUDeviceLostError = require_errors.WebGPUDeviceLostError;
exports.WebGPUInitializationError = require_errors.WebGPUInitializationError;
exports.WebGPUNotSupportedError = require_errors.WebGPUNotSupportedError;
exports.XYZError = require_errors.XYZError;
exports.createRenderer = createRenderer;

//# sourceMappingURL=index.cjs.map
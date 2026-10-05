//#region dist/packages/graphics/src/errors.js
var XYZError = class extends Error {
	constructor(e, t) {
		super(e, t), this.name = new.target.name;
	}
};
var GraphicsError = class extends XYZError {};
var WebGPUNotSupportedError = class extends GraphicsError {};
var WebGPUInitializationError = class extends GraphicsError {};
var WebGPUDeviceLostError = class extends GraphicsError {};
var GraphicsBackendUnavailableError = class extends GraphicsError {};
var UnsupportedGraphicsError = class extends GraphicsError {};
var WebGL2InitializationError = class extends GraphicsError {};
var WebGL2ContextLostError = class extends GraphicsError {};
var Canvas2DInitializationError = class extends GraphicsError {};
//#endregion
exports.Canvas2DInitializationError = Canvas2DInitializationError;
exports.GraphicsBackendUnavailableError = GraphicsBackendUnavailableError;
exports.GraphicsError = GraphicsError;
exports.UnsupportedGraphicsError = UnsupportedGraphicsError;
exports.WebGL2ContextLostError = WebGL2ContextLostError;
exports.WebGL2InitializationError = WebGL2InitializationError;
exports.WebGPUDeviceLostError = WebGPUDeviceLostError;
exports.WebGPUInitializationError = WebGPUInitializationError;
exports.WebGPUNotSupportedError = WebGPUNotSupportedError;
exports.XYZError = XYZError;

//# sourceMappingURL=errors.cjs.map
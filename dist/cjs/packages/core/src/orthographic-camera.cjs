const require_math3d = require("../../math/src/math3d.cjs");
const require_camera_utils = require("./camera-utils.cjs");
//#region dist/packages/core/src/orthographic-camera.js
var OrthographicCamera = class {
	position = new require_math3d.Vector3(0, 0, 5);
	rotation = new require_math3d.Quaternion();
	height = 10;
	zoom = 1;
	near = .1;
	far = 100;
	matrix = new require_math3d.Matrix4();
	view = new require_math3d.Matrix4();
	unitScale = new require_math3d.Vector3(1, 1, 1);
	lookAt(e) {
		require_camera_utils.lookAtRotation(this.position, e, this.rotation);
	}
	updateMatrix(e) {
		if (!Number.isFinite(e) || e <= 0 || !Number.isFinite(this.height) || this.height <= 0 || !Number.isFinite(this.zoom) || this.zoom <= 0 || !Number.isFinite(this.near) || this.near < 0 || !Number.isFinite(this.far) || this.far <= this.near) throw RangeError(`Orthographic camera requires positive aspect, height and zoom, and 0 <= near < far.`);
		this.view.compose(this.position, this.rotation, this.unitScale).invert();
		let t = this.matrix.identity().elements;
		return t[0] = 2 * this.zoom / (this.height * e), t[5] = 2 * this.zoom / this.height, t[10] = 1 / (this.near - this.far), t[14] = this.near / (this.near - this.far), this.matrix.multiply(this.view);
	}
};
//#endregion
exports.OrthographicCamera = OrthographicCamera;

//# sourceMappingURL=orthographic-camera.cjs.map
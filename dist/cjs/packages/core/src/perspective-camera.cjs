const require_math3d = require("../../math/src/math3d.cjs");
const require_camera_utils = require("./camera-utils.cjs");
//#region dist/packages/core/src/perspective-camera.js
var PerspectiveCamera = class {
	position = new require_math3d.Vector3(0, 0, 5);
	rotation = new require_math3d.Quaternion();
	fov = Math.PI / 3;
	near = .1;
	far = 100;
	view = new require_math3d.Matrix4();
	unitScale = new require_math3d.Vector3(1, 1, 1);
	matrix = new require_math3d.Matrix4();
	lookAt(e) {
		require_camera_utils.lookAtRotation(this.position, e, this.rotation);
	}
	updateMatrix(e) {
		if (!Number.isFinite(e) || e <= 0 || !Number.isFinite(this.fov) || this.fov <= 0 || this.fov >= Math.PI || !Number.isFinite(this.near) || this.near <= 0 || !Number.isFinite(this.far) || this.far <= this.near) throw RangeError(`Camera requires positive aspect, fov in (0, PI), and 0 < near < far.`);
		return this.view.compose(this.position, this.rotation, this.unitScale).invert(), this.matrix.perspective(this.fov, e, this.near, this.far).multiply(this.view);
	}
};
//#endregion
exports.PerspectiveCamera = PerspectiveCamera;

//# sourceMappingURL=perspective-camera.cjs.map
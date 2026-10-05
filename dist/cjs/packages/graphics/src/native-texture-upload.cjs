const require_errors = require("./errors.cjs");
const require_native_texture = require("../../assets/src/native-texture.cjs");
//#region dist/packages/graphics/src/native-texture-upload.js
var compressionFeatures = [
	`texture-compression-bc`,
	`texture-compression-etc2`,
	`texture-compression-astc`
];
function webgpuTextureFormats(t) {
	return Object.freeze(Object.keys(require_native_texture.nativeTextureFormats).filter((n) => {
		let r = require_native_texture.nativeTextureFormats[n][5];
		return !r || t.features.has(r);
	}));
}
function validateNativeWebGPU(t, r) {
	let [i, a, , , , o] = require_native_texture.nativeTextureFormats[r.format];
	if (o && !t.features.has(o)) throw new require_errors.GraphicsError(`WebGPU does not support native texture format ${r.format}.`);
	if (o && (r.width % i !== 0 || r.height % a !== 0)) throw new require_errors.GraphicsError(`WebGPU compressed base dimensions must be multiples of ${i}×${a} for ${r.format}.`);
}
function uploadNativeWebGPU(n, r, i) {
	let [a, o] = require_native_texture.nativeTextureFormats[i.format];
	for (let e = 0; e < i.levels.length; e++) {
		let s = i.levels[e], c = require_native_texture.nativeTextureLayout(i.format, s.width, s.height);
		n.queue.writeTexture({
			texture: r,
			mipLevel: e
		}, s.data, {
			bytesPerRow: c.bytesPerRow,
			rowsPerImage: c.rows
		}, [Math.ceil(s.width / a) * a, Math.ceil(s.height / o) * o]);
	}
}
function nativeUploadFormat(e) {
	return e.replace(/-srgb$/, ``);
}
function webglTextureFormats(t) {
	let n = t.getExtension(`WEBGL_compressed_texture_s3tc`), r = t.getExtension(`WEBGL_compressed_texture_s3tc_srgb`), i = t.getExtension(`EXT_texture_compression_rgtc`), a = t.getExtension(`EXT_texture_compression_bptc`), o = t.getExtension(`WEBGL_compressed_texture_etc`), s = t.getExtension(`WEBGL_compressed_texture_astc`), c = new Set(t.getParameter(t.COMPRESSED_TEXTURE_FORMATS));
	return Object.freeze(Object.keys(require_native_texture.nativeTextureFormats).filter((t) => {
		let [, , , , l, u] = require_native_texture.nativeTextureFormats[t];
		return !u || !!(t.startsWith(`bc1-`) || t.startsWith(`bc2-`) || t.startsWith(`bc3-`) ? t.endsWith(`-srgb`) ? r && n : n : t.startsWith(`bc4-`) || t.startsWith(`bc5-`) ? i : t.startsWith(`bc6h-`) || t.startsWith(`bc7-`) ? a : u === `texture-compression-etc2` ? o : s) && c.has(l);
	}));
}
function uploadNativeWebGL(t, n) {
	let r = nativeUploadFormat(n.format), [, , , , i, a] = require_native_texture.nativeTextureFormats[r];
	t.pixelStorei(t.UNPACK_ALIGNMENT, 1);
	try {
		t.texParameteri(t.TEXTURE_2D, t.TEXTURE_BASE_LEVEL, 0), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MAX_LEVEL, n.levels.length - 1);
		for (let e = 0; e < n.levels.length; e++) {
			let r = n.levels[e];
			a ? t.compressedTexImage2D(t.TEXTURE_2D, e, i, r.width, r.height, 0, r.data) : t.texImage2D(t.TEXTURE_2D, e, i, r.width, r.height, 0, t.RGBA, t.UNSIGNED_BYTE, r.data);
		}
	} finally {
		t.pixelStorei(t.UNPACK_ALIGNMENT, 4);
	}
}
//#endregion
exports.compressionFeatures = compressionFeatures;
exports.nativeUploadFormat = nativeUploadFormat;
exports.uploadNativeWebGL = uploadNativeWebGL;
exports.uploadNativeWebGPU = uploadNativeWebGPU;
exports.validateNativeWebGPU = validateNativeWebGPU;
exports.webglTextureFormats = webglTextureFormats;
exports.webgpuTextureFormats = webgpuTextureFormats;

//# sourceMappingURL=native-texture-upload.cjs.map
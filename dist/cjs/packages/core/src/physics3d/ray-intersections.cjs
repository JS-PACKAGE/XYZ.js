const require_hypot = require("../../../math/src/hypot.cjs");
const require_physics_ray = require("../../../../src/data/physics-ray.cjs");
//#region dist/packages/core/src/physics3d/ray-intersections.js
function rayIntersections3D(n, r, i, a, o, s) {
	let c = require_physics_ray.physicsRayLimits.tolerance, l = r.x, u = r.y, d = r.z, f = i.x, p = i.y, m = i.z, h = l - n.center.x, g = u - n.center.y, _ = d - n.center.z, publish = (e, t, n, r) => {
		e >= -c && e <= a + c && o(Math.max(0, Math.min(a, e)), t, n, r);
	};
	if (s) {
		let e = s.a, t = s.b, r = s.c, i = t.x - e.x, a = t.y - e.y, o = t.z - e.z, h = r.x - e.x, g = r.y - e.y, _ = r.z - e.z, v = p * _ - m * g, y = m * h - f * _, b = f * g - p * h, x = i * v + a * y + o * b;
		if (Math.abs(x) <= c || n.collider.kind === `mesh` && `sidedness` in n.collider && n.collider.sidedness === `front` && x <= c) return;
		let S = l - e.x, C = u - e.y, w = d - e.z, T = (S * v + C * y + w * b) / x;
		if (T < -c || T > 1 + c) return;
		let E = C * o - w * a, D = w * i - S * o, O = S * a - C * i, k = (f * E + p * D + m * O) / x;
		if (k < -c || T + k > 1 + c) return;
		let A = s.normal, j = x > 0 ? 1 : -1;
		publish((h * E + g * D + _ * O) / x, A.x * j, A.y * j, A.z * j);
	} else if (n.collider.kind === `plane`) {
		let e = n.normal, t = f * e.x + p * e.y + m * e.z;
		if (Math.abs(t) <= c) return;
		let r = t < 0 ? 1 : -1;
		publish(-(h * e.x + g * e.y + _ * e.z) / t, e.x * r, e.y * r, e.z * r);
	} else if (n.collider.kind === `box`) {
		let e = -1 / 0, t = 1 / 0, r = 0, i = 0, a = 0, o = 0, s = 0, l = 0;
		for (let u = 0; u < 3; u++) {
			let d = n.axes[u], v = h * d.x + g * d.y + _ * d.z, y = f * d.x + p * d.y + m * d.z, b = u === 0 ? n.half.x : u === 1 ? n.half.y : n.half.z;
			if (Math.abs(y) <= c) {
				if (Math.abs(v) > b) return;
				continue;
			}
			let x = (-b - v) / y, S = (b - v) / y, C = Math.min(x, S), w = Math.max(x, S), T = y > 0 ? -1 : 1;
			if (C > e && (e = C, r = d.x * T, i = d.y * T, a = d.z * T), w < t && (t = w, o = -d.x * T, s = -d.y * T, l = -d.z * T), e > t + c) return;
		}
		publish(e, r, i, a), t - e > c && publish(t, o, s, l);
	} else if (n.collider.kind === `sphere` || n.collider.kind === `capsule`) {
		let e = n.start, r = n.end, i = n.radius, a = r.x - e.x, o = r.y - e.y, s = r.z - e.z, h = require_hypot.hypot3(a, o, s), g = h > c ? a / h : 0, _ = h > c ? o / h : 1, v = h > c ? s / h : 0, y = l - e.x, b = u - e.y, x = d - e.z, S = y * g + b * _ + x * v, C = f * g + p * _ + m * v;
		if (h > c) {
			let e = y - g * S, t = b - _ * S, n = x - v * S, r = f - g * C, a = p - _ * C, o = m - v * C, s = r * r + a * a + o * o, l = e * r + t * a + n * o, u = e * e + t * t + n * n - i * i, d = l * l - s * u;
			if (s > c && d >= -c) {
				let c = Math.sqrt(Math.max(0, d));
				for (let u = -1; u <= 1; u += 2) {
					let d = (-l + u * c) / s, f = S + d * C;
					if (f >= 0 && f <= h && publish(d, (e + d * r) / i, (t + d * a) / i, (n + d * o) / i), c === 0) break;
				}
			}
		}
		for (let t = 0; t < (h > c ? 2 : 1); t++) {
			let n = t === 0 ? e : r, a = l - n.x, o = u - n.y, s = d - n.z, g = a * f + o * p + s * m, _ = a * a + o * o + s * s - i * i, v = g * g - _;
			if (v < -c) continue;
			let y = Math.sqrt(Math.max(0, v));
			for (let e = -1; e <= 1; e += 2) {
				let n = -g + e * y, r = S + n * C;
				if ((h <= c || (t === 0 ? r < 0 : r > h)) && publish(n, (a + n * f) / i, (o + n * p) / i, (s + n * m) / i), y === 0) break;
			}
		}
	}
}
//#endregion
exports.rayIntersections3D = rayIntersections3D;

//# sourceMappingURL=ray-intersections.cjs.map
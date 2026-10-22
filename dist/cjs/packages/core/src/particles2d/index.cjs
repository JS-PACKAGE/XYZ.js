const require_texture = require("../../../assets/src/texture.cjs");
const require_rendering2d = require("../../../../src/data/rendering2d.cjs");
const require_contracts = require("../gameplay/contracts.cjs");
const require_world2d = require("../../../../src/data/world2d.cjs");
const require_sprite = require("../sprite.cjs");
const require_group2d = require("../gameplay/group2d.cjs");
const require_particle_layer2d = require("./particle-layer2d.cjs");
//#region dist/packages/core/src/particles2d/index.js
function pair(e, t, n = -1 / 0) {
	if (e.length !== 2 || !e.every((e) => Number.isFinite(e) && e >= n)) throw RangeError(`${t} must contain two finite values >= ${n}.`);
	return [e[0], e[1]];
}
function range(e, t, n = -1 / 0) {
	let r = pair(e, t, n);
	if (r[1] < r[0]) throw RangeError(`${t} must be an ordered range.`);
	return r;
}
function color(e, t) {
	if (e.length !== 4 || !e.every((e) => Number.isFinite(e) && e >= 0 && e <= 1)) throw RangeError(`${t} must contain four channels between 0 and 1.`);
	return [
		e[0],
		e[1],
		e[2],
		e[3]
	];
}
var ParticleSprite = class extends require_sprite.Sprite {
	simulationSpace;
	axisXX = 1;
	axisXY = 0;
	axisYX = 0;
	axisYY = 1;
	particleColor = this.tint;
	place = this.position;
	extent = this.scale;
	constructor(e, t) {
		super(e), this.simulationSpace = t, this.renderEnabled = !1, this.visible = !1;
	}
	retainAxes(e) {
		let t = e.elements;
		this.axisXX = t[0], this.axisXY = t[1], this.axisYX = t[3], this.axisYY = t[4];
	}
	updateWorldMatrix() {
		if (this.simulationSpace === `local`) return super.updateWorldMatrix();
		let e = this.worldMatrix.elements, t = this.extent, n = this.place;
		return e[0] = this.axisXX * t.x, e[1] = this.axisXY * t.x, e[2] = 0, e[3] = this.axisYX * t.y, e[4] = this.axisYY * t.y, e[5] = 0, e[6] = n.x, e[7] = n.y, e[8] = 1, this.worldMatrix;
	}
};
var ParticleEmitter = class extends require_group2d.Group2D {
	simulationSpace;
	pool = [];
	state;
	active;
	free;
	freeCount;
	count = 0;
	running = !1;
	fraction = 0;
	spriteWidth = 1;
	spriteHeight = 1;
	sizeTexture;
	sizeView;
	sizeSource;
	sizeWidth = 1;
	sizeHeight = 1;
	randomState;
	rate;
	lifetime;
	speed;
	angle;
	acceleration;
	startSize;
	endSize;
	startColor;
	endColor;
	nozzle;
	target;
	capacity;
	targetSlots;
	targetGenerations;
	birthAxes;
	birthOptions;
	particleTransform = {
		a: 1,
		b: 0,
		c: 0,
		d: 1,
		tx: 0,
		ty: 0
	};
	particleTint = [
		1,
		1,
		1,
		1
	];
	constructor(r) {
		super();
		let a = r.target ? require_rendering2d.rendering2dLimits.particleCapacity : require_world2d.world2dLimits.particles;
		if (!Number.isSafeInteger(r.capacity) || r.capacity < 1 || r.capacity > a) throw RangeError(`capacity must be an integer between 1 and ${a}.`);
		if (!Number.isFinite(r.rate) || r.rate < 0) throw RangeError(`rate must be finite and nonnegative.`);
		if (this.rate = r.rate, this.lifetime = range(r.lifetime, `lifetime`, 0), this.lifetime[0] === 0) throw RangeError(`lifetime must be positive.`);
		if (this.speed = range(r.speed, `speed`, 0), this.angle = range(r.angle, `angle`), this.acceleration = pair(r.acceleration ?? [0, 0], `acceleration`), this.startSize = pair(r.startSize, `startSize`, 0), this.endSize = pair(r.endSize, `endSize`, 0), this.startColor = color(r.startColor, `startColor`), this.endColor = color(r.endColor, `endColor`), this.simulationSpace = r.space ?? `local`, this.simulationSpace !== `local` && this.simulationSpace !== `world`) throw RangeError(`Unknown particle simulation space.`);
		let o = r.seed ?? 0;
		if (!Number.isSafeInteger(o)) throw RangeError(`seed must be a safe integer.`);
		this.randomState = o >>> 0;
		let s = r.nozzle ?? { kind: `point` };
		switch (s.kind) {
			case `point`:
				this.nozzle = { kind: `point` };
				break;
			case `rectangle`:
				pair([s.width, s.height], `rectangle dimensions`, 0), this.nozzle = {
					kind: `rectangle`,
					width: s.width,
					height: s.height
				};
				break;
			case `circle`:
				if (!Number.isFinite(s.radius) || s.radius < 0) throw RangeError(`nozzle radius must be finite and nonnegative.`);
				this.nozzle = {
					kind: `circle`,
					radius: s.radius
				};
				break;
			default: throw RangeError(`Unknown particle nozzle.`);
		}
		let c = r.texture ?? r.view?.source;
		if (!c || c.destroyed) throw new require_texture.AssetError(`Cannot use a destroyed or missing Texture for particles.`);
		if (r.view && (r.view.source !== c || r.source)) throw RangeError(`Particle view conflicts with texture or source rectangle.`);
		if (r.view?.validate(), r.source && require_contracts.validateSource(r.source, c.width, c.height), r.target && (r.target.destroyed || r.target.parent || r.target.scene || r.target.activeCount || r.target.capacity !== r.capacity)) throw RangeError(`Particle target must be an empty detached layer with matching capacity.`);
		this.capacity = r.capacity, this.target = r.target, this.targetSlots = new Int32Array(this.target ? r.capacity : 0).fill(-1), this.targetGenerations = new Float64Array(this.target ? r.capacity : 0), this.birthAxes = new Float64Array(this.target && this.simulationSpace === `world` ? r.capacity * 4 : 0), this.birthOptions = Object.freeze({
			texture: c,
			view: r.view,
			source: r.source ? Object.freeze({ ...r.source }) : void 0,
			transform: this.particleTransform,
			tint: this.particleTint
		}), this.state = new Float64Array(r.capacity * 8), this.active = new Int32Array(r.capacity), this.free = new Int32Array(r.capacity), this.freeCount = r.capacity;
		for (let e = 0; e < r.capacity; e++) this.target || this.pool.push(this.add(new ParticleSprite({
			texture: c,
			view: r.view,
			source: r.source
		}, this.simulationSpace))), this.free[e] = r.capacity - e - 1;
		this.target && this.add(this.target);
	}
	get activeCount() {
		return this.count;
	}
	get emitting() {
		return this.running;
	}
	start() {
		this.assertAlive(), this.running = !0;
	}
	stop() {
		this.running = !1;
	}
	emit(e) {
		if (this.assertAlive(), !Number.isSafeInteger(e) || e < 0) throw RangeError(`Particle count must be a nonnegative safe integer.`);
		let t = Math.min(e, this.freeCount, this.target?.availableCount ?? this.capacity);
		if (t === 0) return;
		this.validateBirthSource(), this.refreshSpriteSize();
		let n = this.simulationSpace === `world` ? this.updateWorldMatrix() : this.worldMatrix;
		for (let e = 0; e < t; e++) this.spawn(n);
	}
	clear() {
		for (let e = 0; e < this.count; e++) {
			let t = this.active[e];
			if (this.target) this.releaseTargetSlot(t);
			else {
				let e = this.pool[t];
				e.renderEnabled = !1, e.visible = !1;
			}
		}
		this.count = 0, this.freeCount = this.destroyed ? 0 : this.capacity;
		for (let e = 0; e < this.freeCount; e++) this.free[e] = this.freeCount - e - 1;
		this.fraction = 0;
	}
	updateSimulation(e) {
		if (this.destroyed) return;
		if (this.target?.destroyed) {
			this.running = !1, this.clear();
			return;
		}
		if (!Number.isFinite(e) || e < 0) throw RangeError(`Particle delta must be finite and nonnegative.`);
		if (e === 0) return;
		if (this.refreshSpriteSize(), this.target) {
			let t = 0;
			for (; t < this.count;) this.advance(this.active[t], e) ? t++ : this.retire(t);
		} else this.advanceSprites(e);
		if (!this.running || this.rate === 0) return;
		let t = this.fraction, n = t + this.rate * e, r = Math.floor(n);
		this.fraction = Number.isFinite(n) ? n - r : 0;
		let i = Math.min(r, this.freeCount, this.target?.availableCount ?? this.capacity);
		if (i === 0) return;
		this.validateBirthSource();
		let a = this.simulationSpace === `world` ? this.updateWorldMatrix() : this.worldMatrix;
		for (let n = 0; n < i; n++) {
			let r = this.spawn(a), i = Math.max(0, e - (1 - t + n) / this.rate);
			this.advance(r, i) || this.retire(this.count - 1);
		}
	}
	advanceSprites(e) {
		let t = this.state, n = this.active, r = this.pool, i = this.startSize[0], a = this.startSize[1], o = this.endSize[0] - i, s = this.endSize[1] - a, c = this.spriteWidth, l = this.spriteHeight, u = this.startColor[0], d = this.startColor[1], f = this.startColor[2], p = this.startColor[3], m = this.endColor[0] - u, h = this.endColor[1] - d, g = this.endColor[2] - f, _ = this.endColor[3] - p, v = 0;
		for (; v < this.count;) {
			let y = n[v], b = y * 8, x = t[b + 6] + e, S = t[b + 7];
			if (x >= S) {
				this.retire(v);
				continue;
			}
			t[b + 6] = x;
			let C = t[b + 4], w = t[b + 5], T = t[b + 0] += t[b + 2] * e + C * e * e * .5, E = t[b + 1] += t[b + 3] * e + w * e * e * .5;
			t[b + 2] += C * e, t[b + 3] += w * e;
			let D = r[y];
			D.place.set(T, E);
			let O = x / S;
			D.extent.set((i + o * O) / c, (a + s * O) / l);
			let k = D.particleColor;
			k[0] = u + m * O, k[1] = d + h * O, k[2] = f + g * O, k[3] = p + _ * O, v++;
		}
	}
	destroy() {
		if (!this.destroyed) {
			this.running = !1, this.clear();
			try {
				super.destroy();
			} finally {
				this.pool.length = 0, this.freeCount = 0, this.state = /* @__PURE__ */ new Float64Array(), this.active = /* @__PURE__ */ new Int32Array(), this.free = /* @__PURE__ */ new Int32Array();
			}
		}
	}
	assertAlive() {
		if (this.destroyed) throw Error(`Cannot emit from a destroyed ParticleEmitter.`);
	}
	validateBirthSource() {
		let t = this.birthOptions;
		if (t.texture.destroyed) throw new require_texture.AssetError(`Cannot emit from a destroyed particle source.`);
		t.view?.validate(), t.source && require_contracts.validateSource(t.source, t.texture.width, t.texture.height);
	}
	random() {
		let e = this.randomState = this.randomState + 1831565813 >>> 0;
		return e = Math.imul(e ^ e >>> 15, e | 1), e ^= e + Math.imul(e ^ e >>> 7, e | 61), ((e ^ e >>> 14) >>> 0) / 4294967296;
	}
	sample(e) {
		return e[0] + (e[1] - e[0]) * this.random();
	}
	spawn(e) {
		let t = this.free[this.freeCount - 1], n = t * 8, r = this.pool[t], i = this.randomState, a = 0, o = 0;
		if (this.nozzle.kind === `rectangle`) a = (this.random() - .5) * this.nozzle.width, o = (this.random() - .5) * this.nozzle.height;
		else if (this.nozzle.kind === `circle`) {
			let e = this.random() * Math.PI * 2, t = Math.sqrt(this.random()) * this.nozzle.radius;
			a = Math.cos(e) * t, o = Math.sin(e) * t;
		}
		let s = this.sample(this.speed), c = this.sample(this.angle), l = Math.cos(c) * s, u = Math.sin(c) * s, d = this.acceleration[0], f = this.acceleration[1];
		if (this.simulationSpace === `world`) {
			let n = e.elements, i = n[0] * a + n[3] * o + n[6];
			o = n[1] * a + n[4] * o + n[7], a = i;
			let s = n[0] * l + n[3] * u;
			u = n[1] * l + n[4] * u, l = s;
			let c = n[0] * d + n[3] * f;
			if (f = n[1] * d + n[4] * f, d = c, this.target) {
				let e = t * 4;
				this.birthAxes[e] = n[0], this.birthAxes[e + 1] = n[1], this.birthAxes[e + 2] = n[3], this.birthAxes[e + 3] = n[4];
			} else r.retainAxes(e);
		}
		let p = this.sample(this.lifetime);
		if (this.target) {
			this.writeTargetAppearance(t, 0, a, o, this.birthOptions);
			let e;
			try {
				e = this.target.addParticle(this.birthOptions);
			} catch (e) {
				throw this.randomState = i, e;
			}
			if (e < 0) throw this.randomState = i, Error(`Particle target capacity changed during emission.`);
			this.targetSlots[t] = e, this.targetGenerations[t] = this.target.getSlot(e).generation;
		}
		return this.freeCount--, this.active[this.count++] = t, this.state[n + 0] = a, this.state[n + 1] = o, this.state[n + 2] = l, this.state[n + 3] = u, this.state[n + 4] = d, this.state[n + 5] = f, this.state[n + 6] = 0, this.state[n + 7] = p, this.target || (r.place.set(a, o), r.rotation = 0, r.opacity = 1, r.visible = !0, r.renderEnabled = !0, this.appearance(r, 0)), t;
	}
	advance(e, t) {
		if (this.target && !this.hasTargetSlot(e)) return !1;
		let n = e * 8, r = this.state[n + 6] + t;
		if (r >= this.state[n + 7]) return !1;
		if (this.state[n + 6] = r, this.state[n + 0] += this.state[n + 2] * t + this.state[n + 4] * t * t * .5, this.state[n + 1] += this.state[n + 3] * t + this.state[n + 5] * t * t * .5, this.state[n + 2] += this.state[n + 4] * t, this.state[n + 3] += this.state[n + 5] * t, this.target) this.targetAppearance(e, r / this.state[n + 7]);
		else {
			let t = this.pool[e];
			t.place.set(this.state[n + 0], this.state[n + 1]), this.appearance(t, r / this.state[n + 7]);
		}
		return !0;
	}
	refreshSpriteSize() {
		this.sizeTexture = void 0;
		let e = this.birthOptions;
		this.spriteWidth = e.view?.width ?? e.source?.width ?? (e.texture.kind === `render` ? e.texture.logicalWidth : e.texture.width), this.spriteHeight = e.view?.height ?? e.source?.height ?? (e.texture.kind === `render` ? e.texture.logicalHeight : e.texture.height);
	}
	appearance(e, t) {
		e.extent.set((this.startSize[0] + (this.endSize[0] - this.startSize[0]) * t) / this.spriteWidth, (this.startSize[1] + (this.endSize[1] - this.startSize[1]) * t) / this.spriteHeight);
		let n = e.particleColor;
		for (let e = 0; e < 4; e++) n[e] = this.startColor[e] + (this.endColor[e] - this.startColor[e]) * t;
	}
	hasTargetSlot(e) {
		let t = this.targetSlots[e];
		return !!this.target && !this.target.destroyed && this.target.hasSlot(t) && this.target.liveSlot(t).generation === this.targetGenerations[e];
	}
	releaseTargetSlot(e) {
		this.hasTargetSlot(e) && this.target.removeSlot(this.targetSlots[e]), this.targetSlots[e] = -1;
	}
	targetAppearance(e, t) {
		let n = this.target, r = this.targetSlots[e];
		this.writeTargetAppearance(e, t, this.state[e * 8 + 0], this.state[e * 8 + 1], n.liveSlot(r)), n.setLiveAppearance(r, this.particleTransform, this.particleTint);
	}
	writeTargetAppearance(e, t, n, r, i) {
		let a = i.texture, o = i.view, s = i.source;
		(a !== this.sizeTexture || o !== this.sizeView || s !== this.sizeSource) && (this.sizeWidth = o?.width ?? s?.width ?? (a.kind === `render` ? a.logicalWidth : a.width), this.sizeHeight = o?.height ?? s?.height ?? (a.kind === `render` ? a.logicalHeight : a.height), this.sizeTexture = a, this.sizeView = o, this.sizeSource = s);
		let c = this.startSize, l = this.endSize, u = (c[0] + (l[0] - c[0]) * t) / this.sizeWidth, d = (c[1] + (l[1] - c[1]) * t) / this.sizeHeight, f = this.particleTransform;
		if (this.simulationSpace === `world`) {
			let t = e * 4, n = this.birthAxes;
			f.a = n[t] * u, f.b = n[t + 1] * u, f.c = n[t + 2] * d, f.d = n[t + 3] * d, f.space = `world`;
		} else f.a = u, f.b = 0, f.c = 0, f.d = d, f.space = `local`;
		f.tx = n, f.ty = r;
		let p = this.startColor, m = this.endColor, h = this.particleTint;
		h[0] = p[0] + (m[0] - p[0]) * t, h[1] = p[1] + (m[1] - p[1]) * t, h[2] = p[2] + (m[2] - p[2]) * t, h[3] = p[3] + (m[3] - p[3]) * t;
	}
	retire(e) {
		let t = this.active[e];
		if (this.target) this.releaseTargetSlot(t);
		else {
			let e = this.pool[t];
			e.visible = !1, e.renderEnabled = !1;
		}
		this.free[this.freeCount++] = t, this.active[e] = this.active[--this.count];
	}
};
//#endregion
exports.ParticleAttribute2D = require_particle_layer2d.ParticleAttribute2D;
exports.ParticleEmitter = ParticleEmitter;
exports.ParticleLayer2D = require_particle_layer2d.ParticleLayer2D;

//# sourceMappingURL=index.cjs.map
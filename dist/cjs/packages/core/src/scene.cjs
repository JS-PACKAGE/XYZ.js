const require_preload_batch = require("../../assets/src/preload/preload-batch.cjs");
const require_math3d = require("../../math/src/math3d.cjs");
const require_index = require("../../math/src/index.cjs");
const require_game_object = require("./game-object.cjs");
const require_tween = require("./tween.cjs");
const require_object3d = require("./object3d.cjs");
const require_mesh = require("./mesh.cjs");
const require_sprite = require("./sprite.cjs");
const require_gpu_particles3d = require("./gpu-particles3d.cjs");
const require_world = require("../../ecs/src/world.cjs");
const require_camera2d = require("./camera2d.cjs");
const require_perspective_camera = require("./perspective-camera.cjs");
const require_animation = require("./animation.cjs");
const require_render_settings = require("./render-settings.cjs");
const require_scene_timers = require("./scene-timers.cjs");
const require_objects3d = require("./objects3d.cjs");
const require_world$1 = require("./physics2d/world.cjs");
const require_world$2 = require("./physics3d/world.cjs");
const require_index$1 = require("./particles2d/index.cjs");
const require_pointer_router = require("./gameplay/pointer-router.cjs");
const require_simulation = require("../../../src/data/simulation.cjs");
const require_navigation = require("../../../src/data/navigation.cjs");
const require_scheduler = require("./navigation/scheduler.cjs");
const require_locomotion3d = require("./locomotion3d.cjs");
const require_world_streaming = require("./world-streaming.cjs");
const require_light_selection = require("./light-selection.cjs");
//#region dist/packages/core/src/scene.js
var Scene = class {
	world = new require_world.World();
	camera2D = new require_camera2d.Camera2D();
	camera3DValue;
	timerQueue;
	tweenGroup;
	animationMixer;
	physicsWorld;
	physicsWorld3D;
	navigationScheduler;
	navigationWorkBudget;
	locomotionDrivers;
	streamingControllers;
	lightSelector;
	presentationElapsed = 0;
	get presentationTime() {
		return this.presentationElapsed;
	}
	get presentationViewportHeight() {
		return this.owner?.height;
	}
	get lightSelection() {
		return this.lightSelector ||= (this.assertCanInitialize(), new require_light_selection.SpatialLightSelector()), this.lightSelector;
	}
	set lightSelection(e) {
		if (this.assertCanInitialize(), !(e instanceof require_light_selection.SpatialLightSelector)) throw TypeError(`Scene light selection requires a SpatialLightSelector.`);
		this.lightSelector = e;
	}
	createLocomotion3D(e, t) {
		if (this.assertCanInitialize(), e.world !== this.physicsWorld3D) throw Error(`Scene locomotion requires its own physics controller.`);
		let n = new require_locomotion3d.CharacterLocomotion3D(e, t);
		return (this.locomotionDrivers ??= /* @__PURE__ */ new Set()).add(n), n;
	}
	createWorldStreaming(e) {
		if (this.assertCanInitialize(), !this.owner) throw Error(`Scene streaming requires a Game-owned Scene.`);
		let t = new require_world_streaming.WorldStreamingController(this, this.owner.resources, e);
		return t.setPaused(this.owner.state !== `running` || typeof document < `u` && document.hidden), (this.streamingControllers ??= /* @__PURE__ */ new Set()).add(t), t;
	}
	get initializedWorldStreaming() {
		return this.streamingControllers;
	}
	setWorldStreamingPaused(e) {
		if (this.streamingControllers) for (let t of this.streamingControllers) t.setPaused(e);
	}
	advanceWorldStreaming(e) {
		if (!this.disposed && this.streamingControllers) for (let t of this.streamingControllers) {
			if (!e() || this.disposed) return;
			t.destroyed ? this.streamingControllers.delete(t) : t.update();
		}
	}
	get navigation() {
		return this.navigationScheduler ||= (this.assertCanInitialize(), new require_scheduler.NavigationScheduler({ workBudget: this.navigationWorkBudget })), this.navigationScheduler;
	}
	get initializedNavigation() {
		return this.navigationScheduler;
	}
	advanceNavigation(e) {
		!this.disposed && this.navigationScheduler && (this.navigationScheduler.update(), this.disposed || this.navigationScheduler.updateFollowers(e));
	}
	get camera3D() {
		return this.camera3DValue ||= (this.assertCanInitialize(), new require_perspective_camera.PerspectiveCamera()), this.camera3DValue;
	}
	set camera3D(e) {
		this.assertCanInitialize(), this.camera3DValue = e;
	}
	get timers() {
		return this.timerQueue ||= (this.assertCanInitialize(), new require_scene_timers.SceneTimers()), this.timerQueue;
	}
	get tweens() {
		return this.tweenGroup ||= (this.assertCanInitialize(), new require_tween.TweenGroup()), this.tweenGroup;
	}
	get animations() {
		return this.animationMixer ||= (this.assertCanInitialize(), new require_animation.AnimationMixer()), this.animationMixer;
	}
	get physics() {
		return this.physicsWorld ||= (this.assertCanInitialize(), new require_world$1.PhysicsWorld2D()), this.physicsWorld;
	}
	get physics3D() {
		return this.physicsWorld3D ||= (this.assertCanInitialize(), new require_world$2.PhysicsWorld3D()), this.physicsWorld3D;
	}
	get initializedPhysics() {
		return this.physicsWorld;
	}
	get initializedPhysics3D() {
		return this.physicsWorld3D;
	}
	get initializedTweens() {
		return this.tweenGroup;
	}
	advanceTimers(e) {
		this.disposed || this.timerQueue?.update(e);
	}
	advanceTweens(e) {
		this.disposed || this.tweenGroup?.update(e);
	}
	advanceAnimations(e) {
		this.disposed || this.animationMixer?.update(e);
	}
	assertCanInitialize() {
		if (this.disposed) throw Error(`Cannot initialize services on a destroyed Scene.`);
	}
	fixedDelta;
	maxFixedSteps;
	interpolatePhysics;
	fixedElapsed = 0;
	fixedFrame = 0;
	droppedSimulationTime = 0;
	fixedAccumulator = 0;
	advancingFixed = !1;
	presenting = !1;
	constructor(e = {}) {
		if (this.fixedDelta = e.fixedDelta ?? require_simulation.simulationDefaults.fixedDelta, this.maxFixedSteps = e.maxFixedSteps ?? require_simulation.simulationDefaults.maxFixedSteps, !Number.isFinite(this.fixedDelta) || this.fixedDelta <= 0 || !Number.isInteger(this.maxFixedSteps) || this.maxFixedSteps < 1) throw RangeError(`Scene fixed timing requires a positive delta and step limit.`);
		if (this.interpolatePhysics = e.interpolatePhysics ?? !1, this.navigationWorkBudget = e.navigationWorkBudget ?? require_navigation.navigationLimits.sceneWork, !Number.isInteger(this.navigationWorkBudget) || this.navigationWorkBudget < 1 || this.navigationWorkBudget > require_navigation.navigationLimits.scheduledWork) throw RangeError(`navigationWorkBudget must be an integer in [1, ${require_navigation.navigationLimits.scheduledWork}].`);
	}
	get fixedInterpolationAlpha() {
		return Math.min(1, Math.max(0, this.fixedAccumulator / this.fixedDelta));
	}
	get presentingPhysics() {
		return this.presenting && this.interpolatePhysics;
	}
	beginPresentation() {
		this.presenting = !0;
	}
	endPresentation() {
		this.presenting = !1;
	}
	effects2D = [];
	effects3D = [];
	renderGraph;
	pointLightList;
	spotLightList;
	get pointLights() {
		return this.pointLightList ||= (this.assertCanInitialize(), []), this.pointLightList;
	}
	get spotLights() {
		return this.spotLightList ||= (this.assertCanInitialize(), []), this.spotLightList;
	}
	shadowSettings;
	postProcessingSettings;
	get shadows() {
		return this.shadowSettings ||= (this.assertCanInitialize(), new require_render_settings.ShadowSettings()), this.shadowSettings;
	}
	get postProcessing() {
		return this.postProcessingSettings ||= (this.assertCanInitialize(), new require_render_settings.PostProcessingSettings()), this.postProcessingSettings;
	}
	transparency = `sorted`;
	ambientLight = .3;
	fogSettings;
	get fog() {
		return this.fogSettings ||= (this.assertCanInitialize(), new require_render_settings.FogSettings()), this.fogSettings;
	}
	environment;
	environmentIntensity = 1;
	reflectionProbeList;
	get reflectionProbes() {
		return this.reflectionProbeList ||= (this.assertCanInitialize(), []), this.reflectionProbeList;
	}
	background;
	backgroundIntensity = 1;
	directionalLightValue;
	get directionalLight() {
		return this.directionalLightValue ||= (this.assertCanInitialize(), {
			direction: new require_math3d.Vector3(1, 1, 1).normalize(),
			color: [
				1,
				1,
				1
			],
			intensity: .7
		}), this.directionalLightValue;
	}
	set directionalLight(e) {
		this.assertCanInitialize(), this.directionalLightValue = e;
	}
	registrations = /* @__PURE__ */ new Map();
	registeredObjects = /* @__PURE__ */ new Set();
	registeredMeshes;
	meshRevision = 0;
	registeredGPUParticles;
	cameraDependents;
	objectUpdates = /* @__PURE__ */ new Map();
	nextObjectUpdate = 0;
	frameObjectUpdate = 0;
	pointerRouter;
	get pointerEvents() {
		return this.pointerRouter ||= (this.assertCanInitialize(), new require_pointer_router.PointerRouter(this)), this.pointerRouter;
	}
	routePointers(e, t) {
		this.disposed || (this.pointerRouter || e.samples.length) && (this.pointerRouter ??= new require_pointer_router.PointerRouter(this)).update(e, t);
	}
	resetPointerRouting() {
		this.pointerRouter?.reset();
	}
	owner;
	controller;
	disposed = !1;
	committingStreamingMembership = !1;
	get objects() {
		return this.registeredObjects;
	}
	get renderMeshes() {
		return this.registeredMeshes;
	}
	get renderMeshRevision() {
		return this.meshRevision;
	}
	get gpuParticleEmitters() {
		return this.registeredGPUParticles;
	}
	get has3DContent() {
		return (this.registeredMeshes?.size ?? 0) !== 0 || (this.registeredGPUParticles?.size ?? 0) !== 0 || !!this.background && !this.background.destroyed || this.effects3D.length !== 0;
	}
	get destroyed() {
		return this.disposed;
	}
	has(e) {
		return this.registrations.has(e);
	}
	add(e) {
		return this.addObject(e, !0);
	}
	addChild(e, t) {
		return this.addObject(e, !1, t);
	}
	publishStreamingSubtree(e, t) {
		if (this.committingStreamingMembership) throw Error(`Streaming membership publication is not reentrant.`);
		if (e.destroyed || e.scene || (e instanceof require_object3d.Object3D || e instanceof require_game_object.GameObject) && e.parent) throw Error(`Streaming publication requires a live detached owned root.`);
		this.addObject(e, !0, void 0, t);
	}
	retireStreamingSubtree(e, t) {
		if (this.committingStreamingMembership) throw Error(`Streaming membership retirement is not reentrant.`);
		if (e.scene !== this) throw Error(`Cannot retire a foreign streaming subtree.`);
		this.removeObject(e, t);
	}
	commitStreamingMembership(e) {
		this.committingStreamingMembership = !0;
		try {
			e();
		} finally {
			this.committingStreamingMembership = !1;
		}
	}
	addObject(e, t, n, r) {
		if (this.disposed) throw Error(`Cannot add to a destroyed Scene.`);
		if (this.registrations.has(e)) return e;
		let i = [e];
		for (let e = 0; e < i.length; e++) {
			let t = i[e];
			if (t.destroyed) throw Error(`Cannot add a destroyed scene object.`);
			if (t.scene && t.scene !== this) throw Error(`Scene object already belongs to a scene.`);
			if (r && t.scene) throw Error(`Streaming subtree members must all be detached.`);
			if (t instanceof require_object3d.Object3D || t instanceof require_game_object.GameObject) for (let e of t.children) i.push(e);
		}
		let a = [], o = e instanceof require_object3d.Object3D && (n || t && e.parent) ? e.setParentForRegistration(n) : void 0;
		try {
			for (let e of i) this.registrations.has(e) || (this.register(e), a.push(e));
			r && this.commitStreamingMembership(r);
		} catch (e) {
			for (let e = a.length - 1; e >= 0; e--) this.unregister(a[e]);
			throw o?.(), e;
		}
		e instanceof require_game_object.GameObject && e.detachParent();
		for (let e of a) e.scene === this && !e.destroyed && e.dispatchObjectEvent(`add`, { scene: this });
		return e;
	}
	register(n) {
		n.attach(this);
		let r;
		try {
			r = this.world.createEntity(), n instanceof require_game_object.GameObject && this.world.addComponent(r, require_index.Transform2D, n.transform), n instanceof require_sprite.Sprite && this.world.addComponent(r, require_sprite.Sprite, n), n instanceof require_object3d.Object3D && this.world.addComponent(r, require_math3d.Transform3D, n.transform), n instanceof require_mesh.Mesh && this.world.addComponent(r, require_mesh.Mesh, n), n instanceof require_game_object.GameObject && (n.body || n.collider) && this.physics.register(n), n instanceof require_object3d.Object3D && (n.body || n.collider) && this.physics3D.register(n), this.registrations.set(n, r), this.registeredObjects.add(n), n instanceof require_mesh.Mesh && ((this.registeredMeshes ??= /* @__PURE__ */ new Set()).add(n), ++this.meshRevision), n instanceof require_gpu_particles3d.GPUParticleEmitter3D && (this.registeredGPUParticles ??= /* @__PURE__ */ new Set()).add(n), require_objects3d.isCameraDependent(n) && (this.cameraDependents ??= /* @__PURE__ */ new Set()).add(n), n instanceof require_game_object.GameObject && this.objectUpdates.set(n, ++this.nextObjectUpdate);
		} catch (e) {
			throw n instanceof require_game_object.GameObject && this.physicsWorld?.unregister(n), n instanceof require_object3d.Object3D && this.physicsWorld3D?.unregister(n), r !== void 0 && this.world.removeEntity(r), n.detach(this), e;
		}
	}
	remove(e) {
		return this.removeObject(e);
	}
	removeObject(e, t) {
		if (!this.registrations.has(e)) return !1;
		let n = [e];
		for (let e = 0; e < n.length; e++) {
			let t = n[e];
			if (t instanceof require_object3d.Object3D || t instanceof require_game_object.GameObject) for (let e of t.children) n.push(e);
		}
		(e instanceof require_object3d.Object3D || e instanceof require_game_object.GameObject) && e.detachParent();
		for (let e of n) this.unregister(e);
		t && this.commitStreamingMembership(t);
		for (let e of n) e.scene || e.dispatchObjectEvent(`remove`, { scene: this });
		return !0;
	}
	unregister(e) {
		let t = this.registrations.get(e);
		t !== void 0 && (this.registrations.delete(e), this.registeredObjects.delete(e), e instanceof require_mesh.Mesh && (this.registeredMeshes?.delete(e), ++this.meshRevision), e instanceof require_gpu_particles3d.GPUParticleEmitter3D && this.registeredGPUParticles?.delete(e), require_objects3d.isCameraDependent(e) && this.cameraDependents?.delete(e), e instanceof require_game_object.GameObject && this.objectUpdates.delete(e), e.detach(this), this.world.removeEntity(t), e instanceof require_game_object.GameObject && this.physicsWorld?.unregister(e), e instanceof require_object3d.Object3D && this.physicsWorld3D?.unregister(e), e instanceof require_game_object.GameObject && this.pointerRouter?.forget(e));
	}
	claim(e) {
		if (this.disposed || this.owner) throw Error(`Scene is destroyed or already owned by a Game.`);
		return this.owner = e, this.controller = new AbortController(), this.controller.signal;
	}
	cancel() {
		this.controller?.abort(), this.destroy();
	}
	prepare(e, t) {
		let n = this.preload(e, t);
		return !n || n instanceof require_preload_batch.PreloadBatch ? this.prepareBatch(n, e, t) : n.then((n) => this.prepareBatch(n, e, t));
	}
	prepareBatch(e, t, n) {
		if (n.aborted || this.disposed) throw e?.cancel(n.reason), n.reason ?? new DOMException(`Scene preparation cancelled.`, `AbortError`);
		return e ? (t.setLoading(this, e), e.load({ signal: n }).then(() => {
			if (n.aborted || this.disposed) throw n.reason ?? new DOMException(`Scene preparation cancelled.`, `AbortError`);
			return this.initialize(t, n);
		}).finally(() => t.setLoading(this, void 0))) : this.initialize(t, n);
	}
	preload(e, t) {}
	initialize(e, t) {}
	beginObjectFrame() {
		this.frameObjectUpdate = this.nextObjectUpdate;
	}
	beginObjectUpdates(e, t) {
		for (let [n, r] of this.objectUpdates) {
			if (r > this.frameObjectUpdate) break;
			if (!t() || this.disposed || (n.initializeEvents(), !t() || this.disposed)) return;
			this.objectUpdates.get(n) !== r || n.destroyed || n.emitUpdate(`preupdate`, e);
		}
	}
	advanceFrameAnimations(e, t) {
		for (let [n, r] of this.objectUpdates) {
			if (r > this.frameObjectUpdate) break;
			if (!t() || this.disposed) return;
			n instanceof require_sprite.Sprite && n.animation?.update(e);
		}
	}
	advanceActions(e, t) {
		for (let [n, r] of this.objectUpdates) {
			if (r > this.frameObjectUpdate) break;
			if (!t() || this.disposed) return;
			n.advanceActions(e, t);
		}
	}
	advanceObjects(e, t) {
		for (let [n, r] of this.objectUpdates) {
			if (r > this.frameObjectUpdate) break;
			if (!t() || this.disposed || (n.update(e), !t() || this.disposed)) return;
			this.objectUpdates.get(n) === r && !n.destroyed && n.emitUpdate(`postupdate`, e);
		}
	}
	advanceAfterUpdate(e, t) {
		if (!t() || this.disposed) return;
		if (!Number.isFinite(e) || e < 0) throw RangeError(`Scene simulation delta must be nonnegative and finite.`);
		if (this.advancingFixed) throw Error(`Scene fixed update is not reentrant.`);
		this.presentationElapsed += e, this.physicsWorld?.sampleForces(e), this.physicsWorld3D?.enabled && this.physicsWorld3D.sampleForces(e);
		let n = this.fixedAccumulator + e, r = Math.floor((n + this.fixedDelta * 1e-9) / this.fixedDelta), i = Math.min(r, this.maxFixedSteps), a = Math.max(0, n - r * this.fixedDelta), o = Math.max(0, (r - i) * this.fixedDelta);
		this.droppedSimulationTime += o, this.physicsWorld?.discardFrameTime(o), this.physicsWorld3D?.discardFrameTime(o), this.fixedAccumulator = i * this.fixedDelta + a, this.advancingFixed = !0;
		try {
			for (let e = 0; e < i && t() && !this.disposed; e++) {
				if (this.fixedAccumulator = Math.max(0, this.fixedAccumulator - this.fixedDelta), this.fixedUpdate(this.fixedDelta), !t() || this.disposed) return;
				if (this.locomotionDrivers) for (let e of this.locomotionDrivers) {
					if (!t() || this.disposed) return;
					e.destroyed ? this.locomotionDrivers.delete(e) : e.fixedUpdate(this.fixedDelta, this.fixedFrame);
				}
				if (this.physicsWorld?.sampleFixedForces(this.fixedDelta), this.physicsWorld3D?.enabled && this.physicsWorld3D.sampleFixedForces(this.fixedDelta), this.physicsWorld?.update(this.fixedDelta, t, !1), !t() || this.disposed) return;
				this.physicsWorld3D?.update(this.fixedDelta, t, !1), this.fixedElapsed += this.fixedDelta, ++this.fixedFrame;
			}
		} finally {
			if (this.advancingFixed = !1, this.fixedAccumulator >= this.fixedDelta && (!t() || this.disposed)) {
				let e = Math.floor(this.fixedAccumulator / this.fixedDelta) * this.fixedDelta;
				this.fixedAccumulator = Math.max(0, this.fixedAccumulator - e), this.physicsWorld?.discardFrameTime(e), this.physicsWorld3D?.discardFrameTime(e);
			}
		}
		if (t() && !this.disposed) {
			for (let [n, r] of this.objectUpdates) {
				if (r > this.frameObjectUpdate) break;
				if (!t() || this.disposed) return;
				n instanceof require_index$1.ParticleEmitter && n.updateSimulation(e);
			}
			if (this.registeredGPUParticles) for (let n of this.registeredGPUParticles) {
				if (!t() || this.disposed) return;
				n.updateSimulation(e);
			}
			t() && !this.disposed && this.camera2D.updateBehaviors(e), t() && !this.disposed && this.updateCameraDependents();
		}
	}
	updateCameraDependents(e = this.presentationViewportHeight) {
		if (!this.disposed && this.cameraDependents?.size) for (let t of [...this.cameraDependents]) t.worldVisible && t.updateForCamera(this.camera3D, e, this.presentationTime);
	}
	update(e) {}
	fixedUpdate(e) {}
	destroy() {
		if (this.disposed) return;
		this.disposed = !0, this.timerQueue?.destroy(), this.tweenGroup?.destroy(), this.controller?.abort();
		let e = [];
		if (this.streamingControllers) {
			for (let t of this.streamingControllers) try {
				t.destroy();
			} catch (t) {
				e.push(t);
			}
			this.streamingControllers.clear();
		}
		if (this.locomotionDrivers) {
			for (let t of this.locomotionDrivers) try {
				t.destroy();
			} catch (t) {
				e.push(t);
			}
			this.locomotionDrivers.clear();
		}
		try {
			this.navigationScheduler?.destroy();
		} catch (t) {
			e.push(t);
		}
		try {
			this.animationMixer?.destroy();
		} catch (t) {
			e.push(t);
		}
		try {
			this.owner?.audio.stopScene(this);
		} catch (t) {
			e.push(t);
		}
		let t = [...this.registeredObjects], n = t.filter((e) => !((e instanceof require_object3d.Object3D || e instanceof require_game_object.GameObject) && e.parent));
		for (let n of t) try {
			this.unregister(n);
		} catch (t) {
			e.push(t);
		}
		for (let e of t) e.dispatchObjectEvent(`remove`, { scene: this });
		for (let t of n) if (!t.destroyed) try {
			t.destroy();
		} catch (t) {
			e.push(t);
		}
		try {
			this.physicsWorld?.destroy();
		} catch (t) {
			e.push(t);
		}
		try {
			this.physicsWorld3D?.destroy();
		} catch (t) {
			e.push(t);
		}
		this.lightSelector?.clear();
		try {
			this.camera2D.destroy();
		} catch (t) {
			e.push(t);
		}
		try {
			this.pointerRouter?.destroy();
		} catch (t) {
			e.push(t);
		}
		try {
			this.onDestroy();
		} catch (t) {
			e.push(t);
		}
		try {
			this.world.destroy();
		} catch (t) {
			e.push(t);
		}
		if (this.owner?.onSceneDisposed(this), e.length) throw AggregateError(e, `Scene cleanup failed.`);
	}
	onDestroy() {}
};
//#endregion
exports.Scene = Scene;

//# sourceMappingURL=scene.cjs.map
const require_defaults = require("../../../src/data/defaults.cjs");
const require_clock = require("./clock.cjs");
const require_xr_loop = require("./xr-loop.cjs");
const require_resource_scope = require("../../assets/src/resource-scope.cjs");
const require_index = require("../../assets/src/index.cjs");
const require_index$1 = require("../../input/src/index.cjs");
const require_audio_manager = require("../../audio/src/audio-manager.cjs");
const require_logger = require("./logger.cjs");
const require_index$2 = require("../../graphics/src/index.cjs");
const require_errors = require("./errors.cjs");
const require_index$3 = require("./transitions2d/index.cjs");
const require_index$4 = require("./accessibility/index.cjs");
const require_preferences = require("./accessibility/preferences.cjs");
const require_storage = require("./storage.cjs");
const require_i18n = require("./i18n.cjs");
const require_warmup = require("../../graphics/src/warmup.cjs");
const require_frame_work = require("./frame-work.cjs");
//#region dist/packages/core/src/game.js
var SceneCancelledError = class extends require_errors.RuntimeError {
	constructor() {
		super(`Scene initialization was cancelled.`);
	}
};
var v = /* @__PURE__ */ new WeakSet();
var Game = class Game extends EventTarget {
	canvas;
	graphics;
	clock;
	assets;
	input;
	saves;
	i18n;
	audio = new require_audio_manager.AudioManager(() => this.currentScene, (e) => this.dispatchEvent(new CustomEvent(`error`, { detail: e })));
	currentState = `idle`;
	currentScene;
	updatingScene;
	canUpdateScene = () => this.currentState === `running` && this.updatingScene === this.currentScene && !!this.updatingScene && !this.updatingScene.destroyed;
	pendingScene;
	pendingCompletion;
	loadingBatch;
	loadingScene;
	activeTransition;
	frameEffects = {};
	frameWorkCounter = new require_frame_work.FrameWorkCounter();
	get frameWork() {
		return this.frameWorkCounter;
	}
	sceneVersion = 0;
	switchingScene = !1;
	requestId;
	observer;
	logicalWidth;
	logicalHeight;
	fixedPixelRatio;
	appliedPixelRatio = 0;
	fatalError;
	appliedContain;
	appliedIntrinsicSize;
	previousContain;
	previousIntrinsicSize;
	autoResize;
	audioPause;
	accessibilityManager;
	accessibilitySize = {
		width: 0,
		height: 0
	};
	preferencePolicy;
	onMotionPreferenceChange = () => {
		this.preferencePolicy?.values.reducedMotion && this.activeTransition && this.completeTransition(this.activeTransition);
	};
	warmupControllers = /* @__PURE__ */ new Set();
	warmupLeases = /* @__PURE__ */ new Set();
	currentWarmup;
	warmupProtections = /* @__PURE__ */ new Map();
	resourcePool;
	contentLifetime;
	get resources() {
		if (!this.resourcePool) {
			if (this.currentState === `destroyed`) throw new require_errors.RuntimeError(`Cannot create resources for a destroyed Game.`);
			this.resourcePool = new require_resource_scope.ResourcePool(this.assets);
		}
		return this.resourcePool;
	}
	get preferences() {
		if (!this.preferencePolicy) {
			if (this.currentState === `destroyed`) throw new require_errors.RuntimeError(`Cannot create preferences for a destroyed Game.`);
			this.preferencePolicy = new require_preferences.AccessibilityPreferences(), this.preferencePolicy.addEventListener(`change`, this.onMotionPreferenceChange);
		}
		return this.preferencePolicy;
	}
	async createContentLoader(e, t) {
		if (this.currentState === `destroyed`) throw new require_errors.RuntimeError(`Cannot create a content loader for a destroyed Game.`);
		let { ContentLoadCoordinator: n } = await Promise.resolve().then(() => require("./content-storage.cjs"));
		if (this.state === `destroyed`) throw new require_errors.RuntimeError(`Game was destroyed while creating a content loader.`);
		this.contentLifetime ??= new AbortController();
		let r = {
			owner: this,
			signal: this.contentLifetime.signal,
			get destroyed() {
				return this.owner.state === `destroyed`;
			},
			get revision() {
				return this.owner.sceneVersion;
			},
			get scene() {
				return this.owner.scene;
			},
			async publish(e, t, n) {
				if (t.throwIfAborted(), this.owner.state === `destroyed` || this.owner.sceneVersion !== n) throw new SceneCancelledError();
				await this.owner.setScene(e.scene, { signal: t });
			}
		};
		return new n(e, t, this.resources, r);
	}
	get accessibility() {
		return this.accessibilityManager;
	}
	async warmup(e, t = {}) {
		if (this.currentState === `destroyed`) throw new require_errors.RuntimeError(`Cannot warm up a destroyed Game.`);
		let n = new AbortController(), abort = () => n.abort(t.signal?.reason);
		t.signal?.addEventListener(`abort`, abort, { once: !0 }), t.signal?.aborted && abort(), this.warmupControllers.add(n);
		let r, i;
		try {
			let a = this.currentScene;
			r = this.graphics.retainFrameResources(), a && !a.destroyed && (i = await require_warmup.warmupScene(this.graphics, a, {
				maxItems: t.maxItems,
				maxMilliseconds: t.maxMilliseconds,
				signal: n.signal
			}, !0));
			let o = await require_warmup.warmupScene(this.graphics, e, {
				...t,
				signal: n.signal
			});
			if (n.signal.aborted || this.state === `destroyed`) throw o.release(), n.signal.throwIfAborted(), new require_errors.RuntimeError(`Game was destroyed during warmup.`);
			let s = r, c = i, releasePrevious = () => {
				this.warmupProtections.delete(u), c?.release(), s?.release();
			}, u = {
				progress: o.progress,
				get released() {
					return o.released;
				},
				release: () => {
					this.warmupLeases.delete(u), releasePrevious(), o.release();
				}
			};
			return this.warmupLeases.add(u), (s || c) && this.warmupProtections.set(u, releasePrevious), r = void 0, i = void 0, u;
		} finally {
			i?.release(), r?.release(), this.warmupControllers.delete(n), t.signal?.removeEventListener(`abort`, abort);
		}
	}
	constructor(t, n, i, o) {
		super(), this.canvas = t, this.graphics = n, this.clock = i, this.assets = new require_index.AssetLoader(void 0, { decodedTextureBytes: o.resourceBudgets?.decodedTextureBytes }), this.logicalWidth = o.width ?? require_defaults.defaults.width, this.logicalHeight = o.height ?? require_defaults.defaults.height, this.fixedPixelRatio = o.pixelRatio, this.autoResize = o.autoResize !== !1, this.input = new require_index$1.InputManager(t, () => this), this.saves = new require_storage.SaveManager(o.saveStorage, o.saveSchema), this.i18n = new require_i18n.I18n(o.i18n), this.frameWorkCounter.budgetMs = o.frameWorkBudgetMs ?? null, this.audioPause = {
			onPause: o.audioPause?.onPause ?? !1,
			onHidden: o.audioPause?.onHidden ?? !1
		}, this.accessibilityManager = new require_index$4.AccessibilityManager(t, () => (this.accessibilitySize.width = this.logicalWidth, this.accessibilitySize.height = this.logicalHeight, this.accessibilitySize)), this.previousContain = {
			value: t.style.getPropertyValue(`contain`),
			priority: t.style.getPropertyPriority(`contain`)
		}, this.previousIntrinsicSize = {
			value: t.style.getPropertyValue(`contain-intrinsic-size`),
			priority: t.style.getPropertyPriority(`contain-intrinsic-size`)
		};
		try {
			this.installLayout(), this.resize(this.logicalWidth, this.logicalHeight), this.autoResize && (this.observer = new ResizeObserver((e) => {
				let t = e[0];
				if (t && this.currentState !== `destroyed` && t.contentRect.width > 0 && t.contentRect.height > 0) try {
					this.resizeBacking(t.contentRect.width, t.contentRect.height);
				} catch (e) {
					this.fail(e instanceof Error ? e : new require_errors.RuntimeError(`Canvas resize failed.`, { cause: e }));
				}
			}), this.observer.observe(t)), document.addEventListener(`visibilitychange`, this.onVisibilityChange);
		} catch (e) {
			try {
				this.cleanup();
			} catch (t) {
				throw AggregateError([e, t], `Game initialization and cleanup failed.`, { cause: t });
			}
			throw e;
		}
	}
	static async create(t) {
		let n;
		try {
			n = typeof t.canvas == `string` ? document.querySelector(t.canvas) : t.canvas;
		} catch (e) {
			throw new require_errors.RuntimeError(`Canvas selector is invalid. Supply a valid selector or HTMLCanvasElement.`, { cause: e });
		}
		if (!(n instanceof HTMLCanvasElement)) throw new require_errors.RuntimeError(`Canvas was not found or is not an HTMLCanvasElement. Create the canvas before Game.create().`);
		let r = t.width ?? require_defaults.defaults.width, i = t.height ?? require_defaults.defaults.height;
		if (!Number.isFinite(r) || r <= 0 || !Number.isFinite(i) || i <= 0) throw new require_errors.RuntimeError(`Canvas width and height must be finite positive CSS pixel values.`);
		if (t.pixelRatio !== void 0 && (!Number.isFinite(t.pixelRatio) || t.pixelRatio <= 0)) throw new require_errors.RuntimeError(`Canvas pixelRatio must be a finite positive number.`);
		if (t.frameWorkBudgetMs !== void 0 && (!Number.isFinite(t.frameWorkBudgetMs) || t.frameWorkBudgetMs <= 0)) throw new require_errors.RuntimeError(`frameWorkBudgetMs must be a finite positive CPU target.`);
		let a = new require_clock.Clock(t.maxDeltaTime);
		if (v.has(n)) throw new require_errors.RuntimeError(`Canvas is already owned by a Game. Destroy the existing Game before creating another on this canvas.`);
		v.add(n);
		let o, u, d;
		try {
			if (u = await require_index$2.createRenderer(n, t.renderer ?? `auto`, (e) => {
				o ? o.fail(e) : d = e;
			}, {
				antialias: t.antialias,
				recover: t.recoverGraphics,
				gpuTiming: t.gpuTiming,
				residency: {
					textureBytes: t.resourceBudgets?.nativeTextureBytes,
					geometryBytes: t.resourceBudgets?.nativeGeometryBytes
				},
				onLost: (e) => {
					o?.cancelTransition(), o?.dispatchEvent(new CustomEvent(`graphicslost`, { detail: e }));
				},
				onRecovered: () => o?.dispatchEvent(new CustomEvent(`graphicsrecovered`))
			}), d) throw d;
			return o = new Game(n, u, a, t), o;
		} catch (e) {
			try {
				u?.destroy();
			} catch (t) {
				throw AggregateError([e, t], `Game initialization and renderer cleanup failed.`, { cause: t });
			} finally {
				v.delete(n);
			}
			throw e;
		}
	}
	get state() {
		return this.currentState;
	}
	get width() {
		return this.logicalWidth;
	}
	get height() {
		return this.logicalHeight;
	}
	get scene() {
		return this.currentScene;
	}
	get loading() {
		return this.loadingBatch;
	}
	setLoading(e, t) {
		if (t) {
			if (this.pendingScene !== e || this.currentState === `destroyed` || e.destroyed) return;
			this.loadingScene = e, this.loadingBatch = t;
		} else this.loadingScene === e && (this.loadingScene = void 0, this.loadingBatch = void 0);
	}
	get transitioning() {
		return !!this.activeTransition;
	}
	cancelTransition() {
		let e = this.activeTransition;
		if (e) {
			this.activeTransition = void 0, this.frameEffects.transition = void 0;
			try {
				e.controller.destroy();
			} finally {
				e.reject(new SceneCancelledError()), this.dispatchEvent(new CustomEvent(`transitioncancel`, { detail: e.detail }));
			}
		}
	}
	completeTransition(e) {
		if (this.activeTransition === e) {
			this.activeTransition = void 0, this.frameEffects.transition = void 0;
			try {
				e.controller.destroy();
			} catch (t) {
				throw e.reject(t), t;
			}
			e.resolve(), this.dispatchEvent(new CustomEvent(`transitioncomplete`, { detail: e.detail }));
		}
	}
	beginTransition(e, t, n) {
		let r, i, a = new Promise((e, t) => {
			r = e, i = t;
		}), o = {
			controller: e,
			detail: Object.freeze({
				from: t,
				to: n,
				kind: e.kind
			}),
			finished: a,
			resolve: r,
			reject: i
		};
		return this.activeTransition = o, e.blockInput && (n.resetPointerRouting(), this.input.pointer.reset()), this.dispatchEvent(new CustomEvent(`transitionstart`, { detail: o.detail })), this.preferencePolicy?.values.reducedMotion && this.completeTransition(o), o;
	}
	start(e) {
		if (this.currentState === `destroyed`) throw new require_errors.RuntimeError(`Cannot start a destroyed Game. Create a new Game instance.`);
		if (this.fatalError) throw new require_errors.RuntimeError(`Cannot start a Game after a fatal runtime error. Destroy it and create a new Game.`, { cause: this.fatalError });
		e && this.setScene(e).catch((e) => {
			!(e instanceof SceneCancelledError) && this.currentState !== `destroyed` && this.dispatchEvent(new CustomEvent(`error`, { detail: e }));
		}), this.currentState !== `running` && (this.currentState = `running`, this.currentScene?.setWorldStreamingPaused(document.hidden), this.audioPause.onPause && this.audio.resume(`game`), this.clock.suspend(), this.graphics.profiler?.suspend(), this.input.reset(), (!document.hidden || require_xr_loop.xrLoops.has(this)) && (this.requestId = require_xr_loop.requestGameFrame(this, this.onFrame)));
	}
	async setScene(e, t = {}) {
		if (this.currentState === `destroyed`) throw new require_errors.RuntimeError(`Cannot set a Scene on a destroyed Game.`);
		if (this.switchingScene) throw new require_errors.RuntimeError(`Cannot switch Scenes during scene disposal.`);
		if (t.signal?.throwIfAborted(), e === this.pendingScene) return this.pendingCompletion;
		let n = t.transition ? this.preferences.transition(t.transition) : void 0, r = n ? new require_index$3.TransitionController(n) : void 0;
		if (e === this.currentScene) {
			r?.destroy();
			try {
				if (this.pendingScene) {
					let e = this.pendingScene;
					this.pendingScene = void 0, this.pendingCompletion = void 0, this.sceneVersion++, this.switchingScene = !0;
					try {
						e.cancel();
					} finally {
						this.switchingScene = !1;
					}
				}
			} finally {
				this.cancelTransition();
			}
			return;
		}
		let i = e.claim(this), a = this.pendingScene;
		this.pendingScene = e;
		let o = ++this.sceneVersion, s, abortCandidate = () => {
			if (this.pendingScene === e && this.currentScene !== e) try {
				e.cancel();
			} catch (e) {
				s = e;
			}
		};
		t.signal?.addEventListener(`abort`, abortCandidate, { once: !0 }), t.signal?.aborted && abortCandidate();
		try {
			if (this.cancelTransition(), a) {
				this.switchingScene = !0;
				try {
					a.cancel();
				} finally {
					this.switchingScene = !1;
				}
			}
		} catch (n) {
			r?.destroy(), this.pendingScene === e && (this.pendingScene = void 0), t.signal?.removeEventListener(`abort`, abortCandidate);
			try {
				e.cancel();
			} catch (e) {
				throw AggregateError([n, e], `Scene cancellation and cleanup failed.`, { cause: e });
			}
			throw n;
		}
		let c = Promise.resolve().then(async () => {
			let n, a;
			try {
				if (t.signal?.throwIfAborted(), i.aborted) throw new SceneCancelledError();
				if (await e.prepare(this, i), t.warmup) {
					let n = new AbortController(), abortScene = () => n.abort(i.reason), abortWarmup = () => n.abort(t.warmup?.signal?.reason);
					i.addEventListener(`abort`, abortScene, { once: !0 }), t.warmup.signal?.addEventListener(`abort`, abortWarmup, { once: !0 }), i.aborted && abortScene(), t.warmup.signal?.aborted && abortWarmup();
					try {
						a = await this.warmup(e, {
							...t.warmup,
							signal: n.signal
						});
					} finally {
						i.removeEventListener(`abort`, abortScene), t.warmup.signal?.removeEventListener(`abort`, abortWarmup);
					}
				}
				if (t.warmup?.signal?.throwIfAborted(), s !== void 0) throw s;
				if (t.signal?.throwIfAborted(), i.aborted || o !== this.sceneVersion || this.currentState === `destroyed` || this.fatalError) throw new SceneCancelledError();
				let c = this.currentScene, l = !!(c && r && !this.preferencePolicy?.values.reducedMotion && r.duration > 0 && this.currentState !== `idle`);
				if (l) {
					if (n = await this.graphics.captureScene(c, this.logicalWidth, this.logicalHeight), t.signal?.throwIfAborted(), i.aborted || o !== this.sceneVersion || this.state === `destroyed` || this.fatalError) throw new SceneCancelledError();
					r.attachSnapshot(n), n = void 0;
				}
				t.signal?.removeEventListener(`abort`, abortCandidate), this.pendingScene = void 0, this.pendingCompletion = void 0, this.switchingScene = !0;
				try {
					for (let e of this.warmupControllers) e.abort(new SceneCancelledError());
					let t = this.currentWarmup;
					this.currentWarmup = a, a && this.warmupProtections.get(a)?.(), a = void 0, t?.release(), this.currentScene = e, e.setWorldStreamingPaused(this.currentState !== `running` || document.hidden), this.accessibilityManager.reset(), c?.destroy();
				} finally {
					this.switchingScene = !1;
				}
				if (i.aborted || e.destroyed || this.currentScene !== e || this.state === `destroyed` || this.fatalError) throw new SceneCancelledError();
				l && !this.preferencePolicy?.values.reducedMotion && await this.beginTransition(r, c, e).finished;
			} catch (t) {
				this.pendingScene === e && (this.pendingScene = void 0, this.pendingCompletion = void 0);
				let n = s === void 0 ? i.aborted && this.currentScene !== e ? new SceneCancelledError() : t : AggregateError([t, s], `Scene cancellation and cleanup failed.`, { cause: s });
				if (this.currentScene !== e) try {
					e.cancel();
				} catch (e) {
					throw AggregateError([n, e], `Scene preparation and cleanup failed.`, { cause: e });
				}
				throw n;
			} finally {
				t.signal?.removeEventListener(`abort`, abortCandidate), a?.release(), n?.destroy(), this.activeTransition?.controller !== r && r?.destroy();
			}
		});
		return this.pendingScene === e && this.sceneVersion === o && (this.pendingCompletion = c), c;
	}
	onSceneDisposed(e) {
		if (this.setLoading(e, void 0), this.currentScene === e) {
			for (let e of this.warmupControllers) e.abort(new SceneCancelledError());
			this.currentScene = void 0, this.currentWarmup?.release(), this.currentWarmup = void 0, this.accessibilityManager.reset();
		}
		this.activeTransition?.detail.to === e && this.cancelTransition(), this.pendingScene === e && (this.pendingScene = void 0, this.sceneVersion++);
	}
	pause() {
		this.currentState !== `destroyed` && this.currentState !== `paused` && (this.currentState = `paused`, this.currentScene?.setWorldStreamingPaused(!0), this.audioPause.onPause && this.audio.pause(`game`), this.requestId !== void 0 && cancelAnimationFrame(this.requestId), this.requestId = void 0, this.clock.suspend(), this.graphics.profiler?.suspend(), this.currentScene?.resetPointerRouting(), this.accessibilityManager.reset(), this.input.reset());
	}
	resume() {
		this.start();
	}
	resize(e, t) {
		if (this.currentState === `destroyed`) throw new require_errors.RuntimeError(`Cannot resize a destroyed Game.`);
		this.validateSize(e, t);
		let n = this.appliedIntrinsicSize, r = this.canvas.width, i = this.canvas.height, a = this.logicalWidth, o = this.logicalHeight, s = this.appliedPixelRatio, c = !1;
		try {
			if (this.setIntrinsicSize(e, t), this.resizeBacking(e, t), c = !0, this.autoResize) {
				let n = this.contentSize();
				n && (n.width !== e || n.height !== t) && this.resizeBacking(n.width, n.height);
			}
		} catch (e) {
			if (n !== void 0 && (this.canvas.style.setProperty(`contain-intrinsic-size`, n, this.previousIntrinsicSize.priority), this.appliedIntrinsicSize = n), c) try {
				this.graphics.resize(r, i);
			} catch (t) {
				throw AggregateError([e, t], `Canvas resize and backing restoration failed.`, { cause: t });
			} finally {
				this.logicalWidth = a, this.logicalHeight = o, this.appliedPixelRatio = s;
			}
			throw e;
		}
	}
	destroy() {
		if (this.currentState === `destroyed`) return;
		this.pause(), this.currentState = `destroyed`, require_xr_loop.xrLoops.get(this)?.destroy(), this.sceneVersion++, this.contentLifetime?.abort(new require_errors.RuntimeError(`Game content owner was destroyed.`));
		for (let e of this.warmupControllers) e.abort(new require_errors.RuntimeError(`Game was destroyed during warmup.`));
		for (let e of this.warmupLeases) e.release();
		this.currentWarmup = void 0;
		let e = this.pendingScene, t = this.currentScene;
		this.pendingScene = void 0, this.currentScene = void 0;
		let r = [];
		try {
			this.cancelTransition();
		} catch (e) {
			r.push(e);
		}
		try {
			e?.cancel();
		} catch (e) {
			r.push(e);
		}
		try {
			t?.destroy();
		} catch (e) {
			r.push(e);
		}
		try {
			this.cleanup();
		} catch (e) {
			r.push(e);
		}
		try {
			this.graphics.destroy();
		} catch (e) {
			r.push(e);
		} finally {
			v.delete(this.canvas);
		}
		let i = !0;
		try {
			this.resourcePool?.destroy();
		} catch (e) {
			i = !1, r.push(e);
		}
		if (i) try {
			this.assets.destroy();
		} catch (e) {
			r.push(e);
		}
		try {
			this.audio.destroy();
		} catch (e) {
			r.push(e);
		}
		try {
			this.saves.destroy();
		} catch (e) {
			r.push(e);
		}
		try {
			this.preferencePolicy?.removeEventListener(`change`, this.onMotionPreferenceChange), this.preferencePolicy?.destroy();
		} catch (e) {
			r.push(e);
		}
		if (r.length === 1) throw r[0];
		if (r.length) throw AggregateError(r, `Game cleanup failed.`);
	}
	installLayout() {
		let e = getComputedStyle(this.canvas).contain, t = e === `strict` || e === `content` ? `strict` : [`size`, ...e.split(/\s+/).filter((e) => e && e !== `none` && e !== `inline-size` && e !== `size`)].join(` `);
		this.canvas.style.setProperty(`contain`, t, this.previousContain.priority), this.appliedContain = this.canvas.style.getPropertyValue(`contain`), this.setIntrinsicSize(this.logicalWidth, this.logicalHeight);
	}
	setIntrinsicSize(e, t) {
		let n = `${e}px ${t}px`;
		this.canvas.style.setProperty(`contain-intrinsic-size`, n, this.previousIntrinsicSize.priority), this.appliedIntrinsicSize = this.canvas.style.getPropertyValue(`contain-intrinsic-size`);
	}
	validateSize(e, t) {
		if (!Number.isFinite(e) || e <= 0 || !Number.isFinite(t) || t <= 0) throw new require_errors.RuntimeError(`Canvas resize requires finite positive CSS pixel dimensions.`);
	}
	contentSize() {
		let e = getComputedStyle(this.canvas), t = parseFloat(e.paddingLeft) + parseFloat(e.paddingRight) + parseFloat(e.borderLeftWidth) + parseFloat(e.borderRightWidth), n = parseFloat(e.paddingTop) + parseFloat(e.paddingBottom) + parseFloat(e.borderTopWidth) + parseFloat(e.borderBottomWidth), r = e.width.endsWith(`px`) ? parseFloat(e.width) - (e.boxSizing === `border-box` ? t : 0) : this.canvas.clientWidth - parseFloat(e.paddingLeft) - parseFloat(e.paddingRight), i = e.height.endsWith(`px`) ? parseFloat(e.height) - (e.boxSizing === `border-box` ? n : 0) : this.canvas.clientHeight - parseFloat(e.paddingTop) - parseFloat(e.paddingBottom);
		return r > 0 && i > 0 ? {
			width: r,
			height: i
		} : void 0;
	}
	resizeBacking(t, n) {
		this.validateSize(t, n);
		let r = this.fixedPixelRatio ?? Math.min(window.devicePixelRatio || 1, require_defaults.defaults.maxPixelRatio);
		this.graphics.resize(Math.max(1, Math.round(t * r)), Math.max(1, Math.round(n * r))), this.logicalWidth = t, this.logicalHeight = n, this.appliedPixelRatio = r;
	}
	cleanup() {
		try {
			try {
				try {
					try {
						this.accessibilityManager.destroy();
					} finally {
						this.input.destroy();
					}
				} finally {
					this.i18n.destroy();
				}
			} finally {
				this.observer?.disconnect();
			}
		} finally {
			try {
				document.removeEventListener(`visibilitychange`, this.onVisibilityChange);
			} finally {
				let e = this.canvas.style;
				try {
					this.appliedIntrinsicSize !== void 0 && e.getPropertyValue(`contain-intrinsic-size`) === this.appliedIntrinsicSize && e.getPropertyPriority(`contain-intrinsic-size`) === this.previousIntrinsicSize.priority && (this.previousIntrinsicSize.value ? e.setProperty(`contain-intrinsic-size`, this.previousIntrinsicSize.value, this.previousIntrinsicSize.priority) : e.removeProperty(`contain-intrinsic-size`));
				} finally {
					this.appliedContain !== void 0 && e.getPropertyValue(`contain`) === this.appliedContain && e.getPropertyPriority(`contain`) === this.previousContain.priority && (this.previousContain.value ? e.setProperty(`contain`, this.previousContain.value, this.previousContain.priority) : e.removeProperty(`contain`));
				}
			}
		}
	}
	onVisibilityChange = () => {
		this.audioPause.onHidden && (document.hidden ? this.audio.pause(`hidden`) : this.audio.resume(`hidden`)), this.currentScene?.setWorldStreamingPaused(document.hidden || this.currentState !== `running`), this.clock.suspend(), this.graphics.profiler?.suspend(), this.currentScene?.resetPointerRouting(), this.accessibilityManager.reset(), this.input.reset(), this.requestId !== void 0 && cancelAnimationFrame(this.requestId), this.requestId = void 0, !document.hidden && this.currentState === `running` && (this.requestId = require_xr_loop.requestGameFrame(this, this.onFrame));
	};
	onFrame = (r) => {
		if (this.requestId = void 0, this.currentState !== `running` || document.hidden && !require_xr_loop.xrLoops.has(this)) return;
		let i = this.graphics.profiler;
		i?.beginFrame(r);
		let a = this.frameWorkCounter.enabled ? this.frameWorkCounter : void 0;
		a?.begin(this.clock.frame + 1);
		let o = a ? performance.now() : 0;
		try {
			(this.fixedPixelRatio ?? Math.min(window.devicePixelRatio || 1, require_defaults.defaults.maxPixelRatio)) !== this.appliedPixelRatio && this.resizeBacking(this.logicalWidth, this.logicalHeight), this.clock.tick(r);
			let t = this.currentScene;
			if (this.updatingScene = t, t?.beginObjectFrame(), t?.camera2D.resize(this.logicalWidth, this.logicalHeight), this.input.update(), t && this.canUpdateScene() && !this.activeTransition?.controller.blockInput && t.routePointers(this.input.pointer, this.canUpdateScene), t && this.canUpdateScene() && (t.advanceTimers(this.clock.deltaTime), this.canUpdateScene() && t.advanceTweens(this.clock.deltaTime)), this.currentState !== `running` || (t && this.canUpdateScene() && t.beginObjectUpdates(this.clock.deltaTime, this.canUpdateScene), t && t === this.currentScene && !t.destroyed && t.advanceAnimations(this.clock.deltaTime), t && this.canUpdateScene() && t.advanceFrameAnimations(this.clock.deltaTime, this.canUpdateScene), t && this.canUpdateScene() && t.advanceActions(this.clock.deltaTime, this.canUpdateScene), t && this.canUpdateScene() && t.update(this.clock.deltaTime), t && this.canUpdateScene() && t.advanceObjects(this.clock.deltaTime, this.canUpdateScene), this.currentState !== `running`)) return;
			if (t && t === this.currentScene && !t.destroyed && t.world.update(this.clock.deltaTime), a && (a.simulationMs = performance.now() - o, o = performance.now()), t && this.canUpdateScene() && t.advanceWorldStreaming(this.canUpdateScene), t && this.canUpdateScene() && t.advanceNavigation(this.clock.deltaTime), a) {
				a.navigationMs = performance.now() - o;
				let e = t?.initializedNavigation?.stats;
				a.navigationWork = e?.work ?? 0, a.navigationExpansions = e?.expansions ?? 0, a.navigationBakeWork = e?.bakeWork ?? 0, o = performance.now();
			}
			if (t && this.canUpdateScene() && t.advanceAfterUpdate(this.clock.deltaTime, this.canUpdateScene), this.currentState === `running` && this.audio.updateBindings(), a && (a.afterUpdateMs = performance.now() - o), this.currentState !== `running`) return;
			let i = this.activeTransition;
			this.frameEffects.transition = i?.controller.advance(this.clock.deltaTime);
			let s = this.currentScene;
			a && (o = performance.now()), s?.beginPresentation();
			try {
				let e = require_xr_loop.xrLoops.get(this);
				e ? e.render(s) : (this.graphics.beginFrame(), this.graphics.render(s, this.logicalWidth, this.logicalHeight, this.frameEffects), this.graphics.endFrame());
			} finally {
				s?.endPresentation();
			}
			a && (a.renderSubmitMs = performance.now() - o), this.accessibilityManager.update(this.currentScene), i?.controller.complete && this.completeTransition(i);
		} catch (e) {
			this.fail(e instanceof Error ? e : new require_errors.RuntimeError(`Frame rendering failed.`, { cause: e }));
			return;
		} finally {
			this.updatingScene = void 0, this.input.endFrame(), a?.finish(), i?.endFrame();
		}
		this.currentState === `running` && (this.requestId = require_xr_loop.requestGameFrame(this, this.onFrame));
	};
	fail(e) {
		if (this.currentState === `destroyed` || this.fatalError) return;
		this.fatalError = e, this.pause();
		let t = [e];
		try {
			this.cancelTransition();
		} catch (e) {
			t.push(e);
		}
		let n = this.pendingScene;
		this.pendingScene = void 0, this.pendingCompletion = void 0, this.sceneVersion++;
		try {
			n?.cancel();
		} catch (e) {
			t.push(e);
		}
		let r = t.length > 1 ? AggregateError(t, `Fatal runtime error and cancellation cleanup failed.`, { cause: e }) : e;
		require_logger.logger.error(`Runtime paused after a fatal error.`, r), this.dispatchEvent(new CustomEvent(`error`, { detail: r }));
	}
};
//#endregion
exports.Game = Game;

//# sourceMappingURL=game.cjs.map
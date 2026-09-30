import { Matrix3, Vector2 } from '../../../math/src/index.js';
import type { Pointer, PointerSample } from '../../../input/src/index.js';
import { GameObject } from '../game-object.js';
import { Sprite } from '../sprite.js';
import type { Scene } from '../scene.js';
import { compareObjects2D } from './contracts.js';
import {
  InteractionListeners2D,
  type InteractionPhase2D,
} from './interaction-events.js';
import type { Mask2D } from '../rendering2d/mask2d.js';

export interface PointerTargetEventDetail {
  pointerId: number;
  button: number;
  screen: Vector2;
  world: Vector2;
  readonly target: GameObject;
  readonly path: readonly GameObject[];
  readonly currentTarget: GameObject;
  readonly phase: InteractionPhase2D;
  originalEvent?: PointerEvent | WheelEvent;
  deltaX: number;
  deltaY: number;
  deltaZ: number;
  readonly propagationStopped: boolean;
  readonly immediatePropagationStopped: boolean;
  readonly defaultPrevented: boolean;
  stopPropagation(): void;
  stopImmediatePropagation(): void;
  preventDefault(): void;
}
interface PointerState {
  hover?: GameObject;
  capture?: GameObject;
  drag?: GameObject;
  press?: GameObject;
  pressGeneration?: number;
  moved: boolean;
  button: number;
  readonly screen: Vector2;
  readonly origin: Vector2;
  readonly offset: Vector2;
}
interface PathEntry {
  object: GameObject;
  generation: number;
  parent?: GameObject;
}

/** Scene-local native interaction routing; global moves are explicit router observers. */
export class PointerRouter extends EventTarget {
  private readonly targets: GameObject[] = [];
  private readonly states = new Map<number, PointerState>();
  private readonly dragging = new Map<GameObject, number>();
  private readonly world = new Vector2();
  private readonly local = new Vector2();
  private readonly inverse = new Matrix3();
  private resetVersion = -1;
  private disposed = false;
  private canContinue: () => boolean = () => true;
  private pointer?: Pointer;
  private globalListeners: InteractionListeners2D | undefined;
  private epoch = 0;
  private routing = false;

  constructor(private readonly scene: Scene) {
    super();
  }
  override addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void {
    if (type === 'globalpointermove')
      (this.globalListeners ??= new InteractionListeners2D()).add(
        type,
        callback,
        options,
      );
    else super.addEventListener(type, callback, options);
  }
  override removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ): void {
    if (type === 'globalpointermove')
      this.globalListeners?.remove(type, callback, options);
    else super.removeEventListener(type, callback, options);
  }
  override dispatchEvent(event: Event): boolean {
    if (event.type === 'globalpointermove')
      return (
        this.globalListeners?.dispatchNative(event, this) ??
        !event.defaultPrevented
      );
    return super.dispatchEvent(event);
  }
  private alive(target: GameObject): boolean {
    return (
      !this.disposed &&
      !this.scene.destroyed &&
      !target.destroyed &&
      target.scene === this.scene &&
      this.scene.has(target)
    );
  }
  /** Geometric ancestor clips; image masks intentionally use bounds, not pixel alpha. */
  private clipped(target: GameObject, point: Vector2): boolean {
    for (
      let object: GameObject | undefined = target;
      object;
      object = object.parent
    ) {
      if (object !== target && !object.interactiveChildren) return true;
      const maskedObject: GameObject & { readonly mask?: Mask2D } = object;
      const mask = maskedObject.mask;
      if (mask) {
        try {
          object.toLocal(point, this.local);
        } catch (error) {
          if (error instanceof RangeError) return true;
          throw error;
        }
        if (!mask.containsPoint(this.local)) return true;
      }
    }
    return false;
  }
  private pick(screen: Vector2): GameObject | undefined {
    this.scene.camera2D.screenToWorld(screen, this.world);
    for (let index = this.targets.length - 1; index >= 0; index--) {
      const target = this.targets[index];
      if (
        !this.alive(target) ||
        !target.worldVisible ||
        target.worldOpacity <= 0 ||
        target.worldTint[3] <= 0 ||
        !(target.pointerEnabled || target.draggable) ||
        (target instanceof Sprite &&
          (!target.renderEnabled || target.texture.destroyed))
      )
        continue;
      const point = target.worldSpace === 'screen' ? screen : this.world;
      if (this.clipped(target, point)) continue;
      if (target.hitArea) {
        try {
          target.toLocal(point, this.local);
        } catch (error) {
          if (error instanceof RangeError) continue;
          throw error;
        }
        if (target.hitArea.containsPoint(this.local)) return target;
      } else if (target.containsPoint(point)) return target;
    }
    return undefined;
  }
  private dispatch(
    target: GameObject,
    name: string,
    id: number,
    state: PointerState,
    sample?: PointerSample,
  ): void {
    const path: PathEntry[] = [];
    const hierarchy =
      target.eventPropagation === 'hierarchy' &&
      name !== 'pointerenter' &&
      name !== 'pointerleave';
    for (
      let object: GameObject | undefined = target;
      object;
      object = hierarchy ? object.parent : undefined
    )
      path.push({
        object,
        generation: object.registrationGeneration,
        parent: object.parent,
      });
    const detached = target.scene !== this.scene;
    const epoch = this.epoch;
    let stopped = false,
      immediate = false;
    let currentTarget = target;
    let currentPhase: InteractionPhase2D = 'target';
    const detail: PointerTargetEventDetail = {
      pointerId: id,
      button: sample?.button ?? state.button,
      target,
      path: Object.freeze(path.map((entry) => entry.object)),
      get currentTarget() {
        return currentTarget;
      },
      get phase() {
        return currentPhase;
      },
      screen: state.screen.clone(),
      world: this.scene.camera2D.screenToWorld(state.screen),
      originalEvent: sample?.originalEvent,
      deltaX: sample?.deltaX ?? 0,
      deltaY: sample?.deltaY ?? 0,
      deltaZ: sample?.deltaZ ?? 0,
      get propagationStopped() {
        return stopped;
      },
      get immediatePropagationStopped() {
        return immediate;
      },
      get defaultPrevented() {
        return event.defaultPrevented;
      },
      stopPropagation() {
        event.stopPropagation();
      },
      stopImmediatePropagation() {
        event.stopImmediatePropagation();
      },
      preventDefault() {
        event.preventDefault();
        sample?.originalEvent?.preventDefault();
      },
    };
    const event = new CustomEvent(name, {
      detail,
      cancelable: true,
      bubbles: hierarchy,
    });
    const stop = event.stopPropagation.bind(event);
    const stopImmediate = event.stopImmediatePropagation.bind(event);
    event.stopPropagation = () => {
      stopped = true;
      stop();
    };
    event.stopImmediatePropagation = () => {
      stopped = immediate = true;
      stopImmediate();
    };
    const guard = (): boolean =>
      this.epoch === epoch &&
      !this.disposed &&
      !this.scene.destroyed &&
      this.canContinue() &&
      path.every(
        ({ object, generation, parent }) =>
          !object.destroyed &&
          object.registrationGeneration === generation &&
          object.parent === parent &&
          (detached
            ? object.scene === undefined
            : object.scene === this.scene && this.scene.has(object)),
      );
    const deliver = (entry: PathEntry, phase: InteractionPhase2D): void => {
      if (!guard()) return;
      currentTarget = entry.object;
      currentPhase = phase;
      entry.object.dispatchInteractionEvent(event, phase, guard);
    };
    for (let i = path.length - 1; i > 0 && !stopped && guard(); i--)
      deliver(path[i], 'capture');
    if (!stopped && guard()) deliver(path[0], 'target');
    for (let i = 1; i < path.length && !stopped && guard(); i++)
      deliver(path[i], 'bubble');
  }
  private hover(
    id: number,
    state: PointerState,
    target: GameObject | undefined,
    sample?: PointerSample,
  ): void {
    if (state.hover === target) return;
    const previous = state.hover;
    state.hover = undefined;
    if (previous) this.dispatch(previous, 'pointerleave', id, state, sample);
    if (target && this.alive(target) && this.canContinue()) {
      state.hover = target;
      this.dispatch(target, 'pointerenter', id, state, sample);
    }
  }
  private parentPoint(
    target: GameObject,
    screen: Vector2,
  ): Vector2 | undefined {
    if (target.worldSpace === 'screen') this.local.copy(screen);
    else this.scene.camera2D.screenToWorld(screen, this.local);
    if (target.parent) {
      try {
        this.inverse.copy(target.parent.updateWorldMatrix()).invert();
      } catch (error) {
        if (error instanceof RangeError) return undefined;
        throw error;
      }
      this.inverse.transformPoint(this.local, this.local);
    }
    return this.local;
  }
  private endDrag(
    id: number,
    state: PointerState,
    sample?: PointerSample,
  ): void {
    const drag = state.drag;
    if (!drag) return;
    state.drag = undefined;
    this.dragging.delete(drag);
    this.dispatch(drag, 'dragend', id, state, sample);
  }
  private cancel(
    id: number,
    state: PointerState,
    sample?: PointerSample,
  ): void {
    const capture = state.capture;
    state.capture = state.press = undefined;
    if (capture) this.dispatch(capture, 'pointercancel', id, state, sample);
    this.endDrag(id, state, sample);
    this.hover(id, state, undefined, sample);
  }
  /** @internal Called after membership removal, including synchronous destruction. */
  forget(object: GameObject): void {
    for (const [id, state] of this.states) {
      if (state.hover === object) this.pointer?.setCursor();
      if (state.capture === object) this.cancel(id, state);
      else {
        if (state.press === object) state.press = undefined;
        if (state.drag === object) this.endDrag(id, state);
        if (state.hover === object) this.hover(id, state, undefined);
      }
    }
  }
  reset(): void {
    this.epoch++;
    for (const [id, state] of this.states) this.cancel(id, state);
    this.states.clear();
    this.dragging.clear();
    this.pointer?.setCursor();
  }
  destroy(): void {
    if (this.disposed) return;
    this.reset();
    this.disposed = true;
    this.targets.length = 0;
    this.pointer = undefined;
    this.globalListeners?.destroy();
    this.globalListeners = undefined;
  }
  update(pointer: Pointer, canContinue: () => boolean): void {
    if (this.routing || this.disposed || this.scene.destroyed) return;
    this.pointer = pointer;
    this.canContinue = canContinue;
    if (this.resetVersion !== pointer.resetVersion) {
      this.resetVersion = pointer.resetVersion;
      this.reset();
    }
    const epoch = this.epoch;
    const continuing = (): boolean =>
      this.epoch === epoch &&
      pointer.resetVersion === this.resetVersion &&
      canContinue() &&
      !this.disposed &&
      !this.scene.destroyed;
    this.routing = true;
    try {
      this.targets.length = 0;
      for (const object of this.scene.objects)
        if (
          object instanceof GameObject &&
          (object.pointerEnabled || object.draggable)
        )
          this.targets.push(object);
      this.targets.sort(compareObjects2D);
      for (const sample of pointer.samples) {
        if (!continuing()) return;
        if (sample.kind === 'wheel') {
          const hit = this.pick(sample.position);
          if (hit)
            this.dispatch(
              hit,
              'wheel',
              sample.id,
              {
                button: 0,
                moved: false,
                screen: sample.position,
                origin: sample.position,
                offset: this.local,
              },
              sample,
            );
          continue;
        }
        let state = this.states.get(sample.id);
        if (!state) {
          state = {
            button: sample.button,
            moved: false,
            screen: new Vector2(),
            origin: new Vector2(),
            offset: new Vector2(),
          };
          this.states.set(sample.id, state);
        }
        state.screen.copy(sample.position);
        if (
          state.press &&
          (state.screen.x - state.origin.x) ** 2 +
            (state.screen.y - state.origin.y) ** 2 >
            64
        )
          state.moved = true;
        if (state.capture && !this.alive(state.capture))
          this.cancel(sample.id, state, sample);
        const hit =
          sample.kind === 'leave' || sample.kind === 'cancel'
            ? undefined
            : this.pick(state.screen);
        this.hover(sample.id, state, hit, sample);
        if (sample.type !== 'touch') pointer.setCursor(hit?.cursor);
        if (!continuing()) return;
        if (sample.kind === 'cancel') this.cancel(sample.id, state, sample);
        else if (sample.kind === 'down') {
          const target =
            state.capture ?? (hit && this.alive(hit) ? hit : undefined);
          if (!target) continue;
          if (!state.capture) {
            state.capture = state.press = target;
            state.pressGeneration = target.registrationGeneration;
            state.button = sample.button;
            state.origin.copy(state.screen);
            state.moved = false;
          }
          this.dispatch(target, 'pointerdown', sample.id, state, sample);
          if (!continuing()) return;
          if (!this.alive(target) || state.capture !== target) continue;
          if (target.draggable && !state.drag && !this.dragging.has(target)) {
            const point = this.parentPoint(target, state.screen);
            if (point) {
              state.offset.set(
                target.position.x - point.x,
                target.position.y - point.y,
              );
              state.drag = target;
              this.dragging.set(target, sample.id);
              this.dispatch(target, 'dragstart', sample.id, state, sample);
            }
          }
        } else if (sample.kind === 'move') {
          const target =
            state.capture ?? (hit && this.alive(hit) ? hit : undefined);
          if (target)
            this.dispatch(target, 'pointermove', sample.id, state, sample);
          if (!continuing()) return;
          if (this.globalListeners?.has('globalpointermove'))
            this.globalListeners.dispatchNative(
              new CustomEvent('globalpointermove', {
                detail: {
                  pointerId: sample.id,
                  screen: state.screen.clone(),
                  world: this.scene.camera2D.screenToWorld(state.screen),
                  target,
                  originalEvent: sample.originalEvent,
                },
              }),
              this,
              continuing,
            );
          if (!continuing()) return;
          const drag = state.drag;
          if (drag && this.alive(drag)) {
            const point = this.parentPoint(drag, state.screen);
            if (point) {
              drag.position.set(
                point.x + state.offset.x,
                point.y + state.offset.y,
              );
              this.dispatch(drag, 'dragmove', sample.id, state, sample);
            }
          }
        } else if (sample.kind === 'up') {
          const target =
            state.capture ?? (hit && this.alive(hit) ? hit : undefined);
          const release = state.button === sample.button;
          const press = state.press;
          const generation = state.pressGeneration;
          if (release) state.capture = state.press = undefined;
          if (target)
            this.dispatch(target, 'pointerup', sample.id, state, sample);
          if (
            release &&
            press &&
            this.alive(press) &&
            generation === press.registrationGeneration &&
            continuing()
          ) {
            if (hit !== press)
              this.dispatch(
                press,
                'pointerupoutside',
                sample.id,
                state,
                sample,
              );
            else if (!state.moved)
              this.dispatch(press, 'pointertap', sample.id, state, sample);
          }
          if (release) this.endDrag(sample.id, state, sample);
          if (sample.type === 'touch')
            this.hover(sample.id, state, undefined, sample);
        }
        if (!state.capture && !state.hover && !state.drag)
          this.states.delete(sample.id);
      }
      for (const [id, state] of this.states) {
        if (state.capture && !pointer.isPointerDown(id)) this.cancel(id, state);
        if (!state.capture && !state.hover && !state.drag)
          this.states.delete(id);
      }
    } finally {
      this.routing = false;
    }
  }
}

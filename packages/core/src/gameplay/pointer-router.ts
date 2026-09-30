import { Matrix3, Vector2 } from '../../../math/src/index.js';
import type { Pointer, PointerSample } from '../../../input/src/index.js';
import { GameObject } from '../game-object.js';
import { Sprite } from '../sprite.js';
import type { Scene } from '../scene.js';
import { compareObjects2D } from './contracts.js';

export interface PointerTargetEventDetail {
  pointerId: number;
  button: number;
  screen: Vector2;
  world: Vector2;
  target: GameObject;
  originalEvent?: PointerEvent;
}
interface PointerState {
  hover?: GameObject;
  capture?: GameObject;
  drag?: GameObject;
  button: number;
  readonly screen: Vector2;
  readonly offset: Vector2;
}

/** Scene-local targeting. DOM capture and aggregate polling remain owned by Pointer. */
export class PointerRouter {
  private readonly targets: GameObject[] = [];
  private readonly states = new Map<number, PointerState>();
  private readonly dragging = new Map<GameObject, number>();
  private readonly world = new Vector2();
  private readonly local = new Vector2();
  private readonly inverse = new Matrix3();
  private resetVersion = -1;
  private disposed = false;

  constructor(private readonly scene: Scene) {}

  private alive(target: GameObject): boolean {
    return (
      !this.disposed &&
      !this.scene.destroyed &&
      !target.destroyed &&
      target.scene === this.scene &&
      this.scene.has(target)
    );
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
      if (target.hitTestMode === 'collider') {
        if (target.collider?.containsPoint(point, target)) return target;
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
    const detail: PointerTargetEventDetail = {
      pointerId: id,
      button: sample?.button ?? state.button,
      target,
      screen: state.screen.clone(),
      world: this.scene.camera2D.screenToWorld(state.screen),
      originalEvent: sample?.originalEvent,
    };
    target.dispatchObjectEvent(name, detail);
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
    if (target && this.alive(target)) {
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
    state.capture = undefined;
    if (capture) this.dispatch(capture, 'pointercancel', id, state, sample);
    this.endDrag(id, state, sample);
    this.hover(id, state, undefined, sample);
  }

  /** @internal Called after membership removal, including synchronous destruction. */
  forget(object: GameObject): void {
    for (const [id, state] of this.states) {
      if (state.capture === object) this.cancel(id, state);
      else {
        if (state.drag === object) this.endDrag(id, state);
        if (state.hover === object) this.hover(id, state, undefined);
      }
    }
  }
  reset(): void {
    for (const [id, state] of this.states) this.cancel(id, state);
    this.states.clear();
    this.dragging.clear();
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.reset();
    this.targets.length = 0;
  }

  update(pointer: Pointer, canContinue: () => boolean): void {
    if (this.disposed || this.scene.destroyed) return;
    if (this.resetVersion !== pointer.resetVersion) {
      this.resetVersion = pointer.resetVersion;
      this.reset();
    }
    this.targets.length = 0;
    for (const object of this.scene.objects) {
      if (
        object instanceof GameObject &&
        (object.pointerEnabled || object.draggable)
      )
        this.targets.push(object);
    }
    this.targets.sort(compareObjects2D);
    for (const sample of pointer.samples) {
      if (!canContinue() || this.disposed || this.scene.destroyed) return;
      let state = this.states.get(sample.id);
      if (!state) {
        state = {
          button: sample.button,
          screen: new Vector2(),
          offset: new Vector2(),
        };
        this.states.set(sample.id, state);
      }
      state.screen.copy(sample.position);
      if (state.capture && !this.alive(state.capture))
        this.cancel(sample.id, state, sample);
      const hit =
        sample.kind === 'leave' || sample.kind === 'cancel'
          ? undefined
          : this.pick(state.screen);
      this.hover(sample.id, state, hit, sample);
      if (!canContinue() || this.disposed || this.scene.destroyed) return;
      if (sample.kind === 'cancel') {
        this.cancel(sample.id, state, sample);
      } else if (sample.kind === 'down') {
        const target =
          state.capture ?? (hit && this.alive(hit) ? hit : undefined);
        if (!target) continue;
        if (!state.capture) {
          state.capture = target;
          state.button = sample.button;
        }
        this.dispatch(target, 'pointerdown', sample.id, state, sample);
        if (!canContinue() || !this.alive(target) || state.capture !== target)
          continue;
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
        if (!canContinue() || this.disposed || this.scene.destroyed) return;
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
        if (release) state.capture = undefined;
        if (target)
          this.dispatch(target, 'pointerup', sample.id, state, sample);
        if (release) this.endDrag(sample.id, state, sample);
        if (sample.type === 'touch')
          this.hover(sample.id, state, undefined, sample);
      }
      if (!state.capture && !state.hover && !state.drag)
        this.states.delete(sample.id);
    }
    // A bounded ingestion queue may coalesce overflow; final physical state still releases capture.
    for (const [id, state] of this.states) {
      if (state.capture && !pointer.isPointerDown(id)) this.cancel(id, state);
      if (!state.capture && !state.hover && !state.drag) this.states.delete(id);
    }
  }
}

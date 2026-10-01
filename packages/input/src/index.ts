import { Vector2 } from '../../math/src/index.js';
import { inputLimits } from '../../../src/data/input.js';
import { ActionMap, GamepadState } from './gamepad.js';
import { GestureRecognizer } from './gestures.js';
import type { GestureType } from './gestures.js';
import { InputContexts } from './contexts.js';
import { VirtualInput } from './virtual.js';

export { InputContext, InputContexts } from './contexts.js';
export type { InputContextOptions } from './contexts.js';
export { VirtualInput } from './virtual.js';

export { GestureRecognizer } from './gestures.js';
export type {
  GestureDetail,
  GestureOptions,
  GesturePhase,
  GesturePoint,
  GestureThresholds,
  GestureType,
} from './gestures.js';

export {
  ActionMap,
  GamepadState,
  gamepadAxisIndex,
  gamepadButtonIndex,
} from './gamepad.js';
export type {
  ActionBinding,
  ActionKeyboard,
  GamepadAxisName,
  GamepadBinding,
  GamepadButtonName,
  GamepadMapping,
  GamepadRumbleOptions,
  GamepadSnapshot,
  GamepadVibrationActuator,
  GamepadStick,
} from './gamepad.js';

export interface PointerSample {
  id: number;
  type: string;
  kind: 'move' | 'down' | 'up' | 'cancel' | 'leave' | 'wheel';
  readonly position: Vector2;
  button: number;
  buttons: number;
  sequence: number;
  originalEvent?: PointerEvent | WheelEvent;
  deltaX?: number;
  deltaY?: number;
  deltaZ?: number;
}

export interface ActivePointer {
  readonly id: number;
  readonly type: string;
  readonly position: Vector2;
  buttons: number;
}

const NO_GAMEPADS: readonly (Gamepad | null)[] = [];

function isTextEditable(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName;
  return (
    element.isContentEditable === true ||
    element.hasAttribute?.('data-xyz-accessibility') === true ||
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT'
  );
}

export class Keyboard {
  private readonly down = new Set<string>();
  private readonly pressed = new Set<string>();
  private readonly released = new Set<string>();
  private readonly pressVersions = new Map<string, number>();
  private pressSequence = 0;

  isDown(code: string): boolean {
    return this.down.has(code);
  }

  wasPressed(code: string): boolean {
    return this.pressed.has(code);
  }

  wasReleased(code: string): boolean {
    return this.released.has(code);
  }

  /** @internal Distinguishes a new native press from a consumed held press. */
  pressVersion(code: string): number {
    return this.pressVersions.get(code) ?? 0;
  }

  /** @internal */
  keyDown(event: KeyboardEvent): void {
    if (isTextEditable(event.target)) return;
    if (!this.down.has(event.code)) {
      this.down.add(event.code);
      this.pressed.add(event.code);
      this.pressVersions.set(event.code, ++this.pressSequence);
    }
  }

  /** @internal */
  keyUp(event: KeyboardEvent): void {
    // Focus may move into an editable field while a gameplay key is held.
    if (this.down.delete(event.code)) this.released.add(event.code);
  }

  /** @internal */
  endFrame(): void {
    this.pressed.clear();
    this.released.clear();
  }

  /** @internal */
  reset(): void {
    this.down.clear();
    this.pressVersions.clear();
    this.endFrame();
  }
}

export class Pointer {
  readonly position = new Vector2();
  private readonly down = new Set<number>();
  private readonly pressed = new Set<number>();
  private readonly released = new Set<number>();
  private readonly pressVersions = new Map<number, number>();
  private pressSequence = 0;
  private readonly pointers = new Map<number, Set<number>>();
  private hovered = false;
  private readonly views = new Map<number, ActivePointer>();
  private readonly queued: PointerSample[] = [];
  private readonly samplePool: PointerSample[] = [];
  private sequence = 0;
  private readonly wheelValues = { x: 0, y: 0, z: 0 };
  private readonly wheelVersions = { x: 0, y: 0, z: 0 };
  private generation = 0;
  private cursorOwned = false;
  private originalCursor = '';
  private originalCursorPriority = '';
  private assignedCursor = '';

  get activePointers(): ReadonlyMap<number, ActivePointer> {
    return this.views;
  }
  /** @internal Valid until endFrame; consumed once by the scene router. */
  get samples(): readonly PointerSample[] {
    return this.queued;
  }
  /** @internal Reset invalidates scene-local capture/hover state. */
  get resetVersion(): number {
    return this.generation;
  }

  /** @internal Independent of frame boundaries and pointer sample coalescing. */
  pressVersion(button: number): number {
    return this.pressVersions.get(button) ?? 0;
  }

  /** @internal */
  wheelVersion(axis: 'x' | 'y' | 'z'): number {
    return this.wheelVersions[axis];
  }

  /** @internal Individual capture state, unlike aggregate mouse-button polling. */
  isPointerDown(id: number): boolean {
    return this.pointers.has(id);
  }

  private record(event: PointerEvent, kind: PointerSample['kind']): void {
    let view = this.views.get(event.pointerId);
    if (!view) {
      if (this.views.size >= inputLimits.maxActivePointers) return;
      view = {
        id: event.pointerId,
        type: event.pointerType,
        position: new Vector2(),
        buttons: event.buttons,
      };
      this.views.set(event.pointerId, view);
    }
    view.position.copy(this.position);
    view.buttons = event.buttons;
    const last = this.queued[this.queued.length - 1];
    let sample: PointerSample;
    if (
      kind === 'move' &&
      last?.kind === 'move' &&
      last.id === event.pointerId
    ) {
      sample = last;
    } else {
      if (this.queued.length === inputLimits.maxPointerSamples) {
        if (kind === 'move') return;
        let discard = this.queued.findIndex(
          (value) =>
            value.kind === 'move' ||
            value.kind === 'leave' ||
            value.kind === 'down',
        );
        if (discard < 0)
          discard = this.queued.findIndex(
            (value) => value.id === event.pointerId,
          );
        if (discard < 0) discard = 0;
        sample = this.queued[discard];
        for (let i = discard; i < this.queued.length - 1; i++)
          this.queued[i] = this.queued[i + 1];
        this.queued[this.queued.length - 1] = sample;
      } else {
        const index = this.queued.length;
        sample = this.samplePool[index] ??= {
          id: 0,
          type: '',
          kind,
          position: new Vector2(),
          button: 0,
          buttons: 0,
          sequence: 0,
        };
        this.queued.push(sample);
      }
    }
    sample.id = event.pointerId;
    sample.type = event.pointerType;
    sample.kind = kind;
    sample.position.copy(this.position);
    sample.button = event.button;
    sample.buttons = event.buttons;
    sample.sequence = ++this.sequence;
    sample.originalEvent = event;
    sample.deltaX = sample.deltaY = sample.deltaZ = undefined;
    this.observe?.(sample);
    if (
      kind === 'cancel' ||
      (kind === 'up' && event.pointerType === 'touch') ||
      (kind === 'leave' && !this.pointers.has(event.pointerId))
    )
      this.views.delete(event.pointerId);
  }

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly getSize: () => { width: number; height: number },
    private readonly observe?: (sample: PointerSample) => void,
    private readonly onReset?: () => void,
  ) {}

  get active(): boolean {
    return this.hovered || this.pointers.size > 0;
  }

  isDown(button: number): boolean {
    return this.down.has(button);
  }

  wasPressed(button: number): boolean {
    return this.pressed.has(button);
  }

  wasReleased(button: number): boolean {
    return this.released.has(button);
  }

  /** Accumulated CSS-pixel wheel movement for the current frame. */
  wheelDelta(axis: 'x' | 'y' | 'z'): number {
    return this.wheelValues[axis];
  }

  /** CSS-pixel deltas; line mode uses 16px and page mode uses the content height. */
  wheel(event: WheelEvent): void {
    this.updatePosition(event);
    const factor =
      event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? this.canvas.clientHeight || this.getSize().height
          : 1;
    const finite = (value: number): number =>
      Number.isFinite(value)
        ? Math.max(-1000000, Math.min(1000000, value * factor))
        : 0;
    this.wheelValues.x = Math.max(
      -1000000,
      Math.min(1000000, this.wheelValues.x + finite(event.deltaX)),
    );
    this.wheelValues.y = Math.max(
      -1000000,
      Math.min(1000000, this.wheelValues.y + finite(event.deltaY)),
    );
    this.wheelValues.z = Math.max(
      -1000000,
      Math.min(1000000, this.wheelValues.z + finite(event.deltaZ)),
    );
    if (event.deltaX && Number.isFinite(event.deltaX)) this.wheelVersions.x++;
    if (event.deltaY && Number.isFinite(event.deltaY)) this.wheelVersions.y++;
    if (event.deltaZ && Number.isFinite(event.deltaZ)) this.wheelVersions.z++;
    const last = this.queued[this.queued.length - 1];
    if (
      last?.kind === 'wheel' &&
      last.position.x === this.position.x &&
      last.position.y === this.position.y
    ) {
      last.position.copy(this.position);
      last.deltaX = finite((last.deltaX ?? 0) / factor + event.deltaX);
      last.deltaY = finite((last.deltaY ?? 0) / factor + event.deltaY);
      last.deltaZ = finite((last.deltaZ ?? 0) / factor + event.deltaZ);
      last.originalEvent = event;
      last.sequence = ++this.sequence;
      return;
    }
    if (this.queued.length >= inputLimits.maxPointerSamples) return;
    const index = this.queued.length;
    const sample = (this.samplePool[index] ??= {
      id: 0,
      type: 'mouse',
      kind: 'wheel',
      position: new Vector2(),
      button: 0,
      buttons: 0,
      sequence: 0,
    });
    sample.id = 0;
    sample.type = 'mouse';
    sample.kind = 'wheel';
    sample.position.copy(this.position);
    sample.button = 0;
    sample.buttons = 0;
    sample.sequence = ++this.sequence;
    sample.originalEvent = event;
    sample.deltaX = finite(event.deltaX);
    sample.deltaY = finite(event.deltaY);
    sample.deltaZ = finite(event.deltaZ);
    this.queued.push(sample);
  }

  /** @internal */
  setCursor(cursor?: string): void {
    const style = this.canvas.style;
    if (cursor === undefined) {
      if (this.cursorOwned && style.cursor === this.assignedCursor) {
        if (this.originalCursor)
          style.setProperty(
            'cursor',
            this.originalCursor,
            this.originalCursorPriority,
          );
        else style.removeProperty('cursor');
      }
      this.cursorOwned = false;
      return;
    }
    if (!this.cursorOwned) {
      this.originalCursor = style.cursor;
      this.originalCursorPriority = style.getPropertyPriority('cursor');
      this.cursorOwned = true;
    }
    style.setProperty('cursor', cursor, this.originalCursorPriority);
    this.assignedCursor = style.cursor;
  }
  /** @internal */
  enter(event: PointerEvent): void {
    this.hovered = true;
    this.updatePosition(event);
    this.record(event, 'move');
  }

  /** @internal */
  leave(event: PointerEvent): void {
    this.hovered = false;
    this.updatePosition(event);
    this.record(event, 'leave');
  }

  /** @internal */
  move(event: PointerEvent): void {
    this.updatePosition(event);
    this.record(event, 'move');
  }

  /** @internal */
  pointerDown(event: PointerEvent): void {
    this.updatePosition(event);
    if (event.button < 0) return;
    let buttons = this.pointers.get(event.pointerId);
    if (!buttons) {
      if (this.pointers.size >= inputLimits.maxActivePointers) return;
      this.canvas.setPointerCapture?.(event.pointerId);
      buttons = new Set<number>();
      this.pointers.set(event.pointerId, buttons);
    }
    if (buttons.has(event.button)) return;
    buttons.add(event.button);
    if (!this.down.has(event.button)) {
      this.down.add(event.button);
      this.pressed.add(event.button);
      this.pressVersions.set(event.button, ++this.pressSequence);
    }
    this.record(event, 'down');
  }

  /** @internal */
  pointerUp(event: PointerEvent): void {
    this.updatePosition(event);
    const buttons = this.pointers.get(event.pointerId);
    if (buttons?.delete(event.button)) this.releaseButton(event.button);
    if (buttons?.size === 0) {
      this.pointers.delete(event.pointerId);
      this.releaseCapture(event.pointerId);
    }
    if (event.pointerType === 'touch') this.hovered = false;
    this.record(event, 'up');
  }

  /** @internal */
  cancel(event: PointerEvent): void {
    this.updatePosition(event);
    this.clearPointer(event.pointerId);
    this.hovered = false;
    this.record(event, 'cancel');
  }

  /** @internal */
  lostCapture(event: PointerEvent): void {
    const held = this.pointers.has(event.pointerId);
    this.clearPointer(event.pointerId);
    if (held) this.record(event, 'cancel');
    if (event.pointerType === 'touch') this.hovered = false;
  }

  /** @internal */
  endFrame(): void {
    this.pressed.clear();
    this.released.clear();
    for (const sample of this.queued) sample.originalEvent = undefined;
    this.queued.length = 0;
    this.wheelValues.x = this.wheelValues.y = this.wheelValues.z = 0;
  }

  /** @internal */
  reset(): void {
    this.generation++;
    this.onReset?.();
    for (const id of this.pointers.keys()) this.releaseCapture(id);
    this.pointers.clear();
    this.down.clear();
    this.pressVersions.clear();
    this.hovered = false;
    this.views.clear();
    this.endFrame();
    this.setCursor();
  }

  private releaseButton(button: number): void {
    for (const buttons of this.pointers.values()) {
      if (buttons.has(button)) return;
    }
    if (this.down.delete(button)) this.released.add(button);
  }

  private clearPointer(id: number): void {
    const buttons = this.pointers.get(id);
    if (!buttons) return;
    this.pointers.delete(id);
    for (const button of buttons) this.releaseButton(button);
    this.releaseCapture(id);
  }

  private releaseCapture(id: number): void {
    if (this.canvas.hasPointerCapture?.(id)) {
      this.canvas.releasePointerCapture(id);
    }
  }

  private updatePosition(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const style = getComputedStyle(this.canvas);
    const scaleX =
      this.canvas.offsetWidth > 0 ? rect.width / this.canvas.offsetWidth : 1;
    const scaleY =
      this.canvas.offsetHeight > 0 ? rect.height / this.canvas.offsetHeight : 1;
    const borderLeft = (parseFloat(style.borderLeftWidth) || 0) * scaleX;
    const borderRight = (parseFloat(style.borderRightWidth) || 0) * scaleX;
    const borderTop = (parseFloat(style.borderTopWidth) || 0) * scaleY;
    const borderBottom = (parseFloat(style.borderBottomWidth) || 0) * scaleY;
    const paddingLeft = (parseFloat(style.paddingLeft) || 0) * scaleX;
    const paddingRight = (parseFloat(style.paddingRight) || 0) * scaleX;
    const paddingTop = (parseFloat(style.paddingTop) || 0) * scaleY;
    const paddingBottom = (parseFloat(style.paddingBottom) || 0) * scaleY;
    const width =
      rect.width - borderLeft - borderRight - paddingLeft - paddingRight;
    const height =
      rect.height - borderTop - borderBottom - paddingTop - paddingBottom;
    if (width <= 0 || height <= 0) return;
    const size = this.getSize();
    this.position.set(
      ((event.clientX - rect.left - borderLeft - paddingLeft) / width) *
        size.width,
      ((event.clientY - rect.top - borderTop - paddingTop) / height) *
        size.height,
    );
  }
}

export class InputManager {
  readonly keyboard = new Keyboard();
  readonly pointer: Pointer;
  /** Tap, double tap, long press, swipe, pan, pinch and rotate recognized from `pointer`. */
  readonly gestures = new GestureRecognizer();
  /** First standard-mapping gamepad with deadzones, analog buttons and press edges. */
  readonly gamepad = new GamepadState();
  /** Legacy named actions, routed below every active input context. */
  readonly actions: ActionMap;
  readonly contexts: InputContexts;
  readonly virtual = new VirtualInput();
  private readonly gesturePulses = new Set<GestureType>();
  private readonly gestureVersions: Record<GestureType, number> = {
    tap: 0,
    doubletap: 0,
    longpress: 0,
    swipe: 0,
    pan: 0,
    pinch: 0,
    rotate: 0,
  };
  private readonly gestureUnsubscribe: Array<() => void> = [];
  /** Snapshot from the latest update; disconnected gamepad indices retain null slots. */
  get gamepads(): readonly (Gamepad | null)[] {
    return this.gamepadSnapshot;
  }
  private gamepadSnapshot: readonly (Gamepad | null)[] = NO_GAMEPADS;
  private destroyed = false;
  private readonly onKeyDown = (event: KeyboardEvent): void =>
    this.keyboard.keyDown(event);
  private readonly onKeyUp = (event: KeyboardEvent): void =>
    this.keyboard.keyUp(event);
  private readonly onBlur = (): void => this.reset();
  private readonly onVisibilityChange = (): void => {
    if (document.hidden) this.reset();
  };
  private readonly onPointerEnter = (event: PointerEvent): void =>
    this.pointer.enter(event);
  private readonly onPointerLeave = (event: PointerEvent): void =>
    this.pointer.leave(event);
  private readonly onPointerMove = (event: PointerEvent): void =>
    this.pointer.move(event);
  private readonly onPointerDown = (event: PointerEvent): void =>
    this.pointer.pointerDown(event);
  private readonly onPointerUp = (event: PointerEvent): void =>
    this.pointer.pointerUp(event);
  private readonly onPointerCancel = (event: PointerEvent): void =>
    this.pointer.cancel(event);
  private readonly onLostPointerCapture = (event: PointerEvent): void =>
    this.pointer.lostCapture(event);
  private readonly onWheel = (event: WheelEvent): void =>
    this.pointer.wheel(event);

  constructor(
    private readonly canvas: HTMLCanvasElement,
    getSize: () => { width: number; height: number },
  ) {
    this.pointer = new Pointer(
      canvas,
      getSize,
      (sample) => this.gestures.feed(sample),
      () => {
        this.gestures.reset();
        this.gesturePulses.clear();
      },
    );
    const sources = {
      pointer: this.pointer,
      virtual: this.virtual,
      gesture: (type: GestureType): boolean => this.gesturePulses.has(type),
      gestureVersion: (type: GestureType): number => this.gestureVersions[type],
    };
    this.actions = new ActionMap(this.gamepad, this.keyboard, sources, true);
    this.contexts = new InputContexts(
      this.actions,
      this.gamepad,
      this.keyboard,
      sources,
    );
    const gestureTypes: readonly GestureType[] = [
      'tap',
      'doubletap',
      'longpress',
      'swipe',
      'pan',
      'pinch',
      'rotate',
    ];
    for (const type of gestureTypes)
      this.gestureUnsubscribe.push(
        this.gestures.on(type, (detail) => {
          if (detail.phase === 'cancel') this.gesturePulses.delete(type);
          else if (
            type === 'pan' || type === 'pinch' || type === 'rotate'
              ? detail.phase === 'start' || detail.phase === 'change'
              : detail.phase === 'end'
          ) {
            this.gesturePulses.add(type);
            this.gestureVersions[type]++;
          }
        }),
      );
    // Minimal headless canvas/window stand-ins may not implement EventTarget.
    // When they do, listener registration errors are real initialization failures.
    try {
      if (typeof canvas.addEventListener === 'function') {
        canvas.addEventListener('pointerenter', this.onPointerEnter);
        canvas.addEventListener('pointerleave', this.onPointerLeave);
        canvas.addEventListener('pointermove', this.onPointerMove);
        canvas.addEventListener('pointerdown', this.onPointerDown);
        canvas.addEventListener('pointerup', this.onPointerUp);
        canvas.addEventListener('pointercancel', this.onPointerCancel);
        canvas.addEventListener('wheel', this.onWheel, { passive: false });
        canvas.addEventListener(
          'lostpointercapture',
          this.onLostPointerCapture,
        );
      }
      if (typeof window.addEventListener === 'function') {
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('blur', this.onBlur);
      }
      document.addEventListener('visibilitychange', this.onVisibilityChange);
    } catch (error) {
      this.destroy();
      throw error;
    }
  }

  update(): void {
    if (this.destroyed) return;
    this.gestures.update();
    if (typeof navigator === 'undefined' || !navigator.getGamepads) {
      this.gamepadSnapshot = NO_GAMEPADS;
    } else {
      const pads = navigator.getGamepads();
      this.gamepadSnapshot = pads.length ? Array.from(pads) : NO_GAMEPADS;
    }
    this.gamepad.update(this.gamepadSnapshot);
    this.contexts.update(this.gamepadSnapshot);
  }

  endFrame(): void {
    this.keyboard.endFrame();
    this.pointer.endFrame();
    this.virtual.endFrame();
    this.gesturePulses.clear();
    this.contexts.endFrame();
  }

  reset(): void {
    this.keyboard.reset();
    this.pointer.reset();
    this.gamepadSnapshot = NO_GAMEPADS;
    this.gamepad.reset();
    this.virtual.reset();
    this.virtual.endFrame();
    this.gesturePulses.clear();
    this.contexts.reset();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.reset();
    this.gestures.destroy();
    for (const unsubscribe of this.gestureUnsubscribe) unsubscribe();
    this.gestureUnsubscribe.length = 0;
    this.contexts.destroy();
    this.virtual.destroy();
    const canvas = this.canvas;
    if (typeof canvas.removeEventListener === 'function') {
      canvas.removeEventListener('pointerenter', this.onPointerEnter);
      canvas.removeEventListener('pointerleave', this.onPointerLeave);
      canvas.removeEventListener('pointermove', this.onPointerMove);
      canvas.removeEventListener('pointerdown', this.onPointerDown);
      canvas.removeEventListener('pointerup', this.onPointerUp);
      canvas.removeEventListener('pointercancel', this.onPointerCancel);
      canvas.removeEventListener('wheel', this.onWheel);
      canvas.removeEventListener(
        'lostpointercapture',
        this.onLostPointerCapture,
      );
    }
    if (typeof window.removeEventListener === 'function') {
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
      window.removeEventListener('blur', this.onBlur);
    }
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }
}

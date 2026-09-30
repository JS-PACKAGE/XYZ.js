import { Vector2 } from '../../math/src/index.js';

const NO_GAMEPADS: readonly (Gamepad | null)[] = [];

function isTextEditable(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName;
  return (
    element.isContentEditable === true ||
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT'
  );
}

export class Keyboard {
  private readonly down = new Set<string>();
  private readonly pressed = new Set<string>();
  private readonly released = new Set<string>();

  isDown(code: string): boolean {
    return this.down.has(code);
  }

  wasPressed(code: string): boolean {
    return this.pressed.has(code);
  }

  wasReleased(code: string): boolean {
    return this.released.has(code);
  }

  /** @internal */
  keyDown(event: KeyboardEvent): void {
    if (isTextEditable(event.target)) return;
    if (!this.down.has(event.code)) {
      this.down.add(event.code);
      this.pressed.add(event.code);
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
    this.endFrame();
  }
}

export class Pointer {
  readonly position = new Vector2();
  private readonly down = new Set<number>();
  private readonly pressed = new Set<number>();
  private readonly released = new Set<number>();
  private readonly pointers = new Map<number, Set<number>>();
  private hovered = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly getSize: () => { width: number; height: number },
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

  /** @internal */
  enter(event: PointerEvent): void {
    this.hovered = true;
    this.updatePosition(event);
  }

  /** @internal */
  leave(event: PointerEvent): void {
    this.hovered = false;
    this.updatePosition(event);
  }

  /** @internal */
  move(event: PointerEvent): void {
    this.updatePosition(event);
  }

  /** @internal */
  pointerDown(event: PointerEvent): void {
    this.updatePosition(event);
    if (event.button < 0) return;
    let buttons = this.pointers.get(event.pointerId);
    if (!buttons) {
      this.canvas.setPointerCapture?.(event.pointerId);
      buttons = new Set<number>();
      this.pointers.set(event.pointerId, buttons);
    }
    if (buttons.has(event.button)) return;
    buttons.add(event.button);
    if (!this.down.has(event.button)) {
      this.down.add(event.button);
      this.pressed.add(event.button);
    }
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
  }

  /** @internal */
  cancel(event: PointerEvent): void {
    this.updatePosition(event);
    this.clearPointer(event.pointerId);
    this.hovered = false;
  }

  /** @internal */
  lostCapture(event: PointerEvent): void {
    this.clearPointer(event.pointerId);
    if (event.pointerType === 'touch') this.hovered = false;
  }

  /** @internal */
  endFrame(): void {
    this.pressed.clear();
    this.released.clear();
  }

  /** @internal */
  reset(): void {
    for (const id of this.pointers.keys()) this.releaseCapture(id);
    this.pointers.clear();
    this.down.clear();
    this.hovered = false;
    this.endFrame();
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

  private updatePosition(event: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const style = getComputedStyle(this.canvas);
    const borderLeft = parseFloat(style.borderLeftWidth) || 0;
    const borderRight = parseFloat(style.borderRightWidth) || 0;
    const borderTop = parseFloat(style.borderTopWidth) || 0;
    const borderBottom = parseFloat(style.borderBottomWidth) || 0;
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingRight = parseFloat(style.paddingRight) || 0;
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const paddingBottom = parseFloat(style.paddingBottom) || 0;
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

  constructor(
    private readonly canvas: HTMLCanvasElement,
    getSize: () => { width: number; height: number },
  ) {
    this.pointer = new Pointer(canvas, getSize);
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
    if (typeof navigator === 'undefined' || !navigator.getGamepads) {
      this.gamepadSnapshot = NO_GAMEPADS;
      return;
    }
    const pads = navigator.getGamepads();
    this.gamepadSnapshot = pads.length ? Array.from(pads) : NO_GAMEPADS;
  }

  endFrame(): void {
    this.keyboard.endFrame();
    this.pointer.endFrame();
  }

  reset(): void {
    this.keyboard.reset();
    this.pointer.reset();
    this.gamepadSnapshot = NO_GAMEPADS;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.reset();
    const canvas = this.canvas;
    if (typeof canvas.removeEventListener === 'function') {
      canvas.removeEventListener('pointerenter', this.onPointerEnter);
      canvas.removeEventListener('pointerleave', this.onPointerLeave);
      canvas.removeEventListener('pointermove', this.onPointerMove);
      canvas.removeEventListener('pointerdown', this.onPointerDown);
      canvas.removeEventListener('pointerup', this.onPointerUp);
      canvas.removeEventListener('pointercancel', this.onPointerCancel);
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

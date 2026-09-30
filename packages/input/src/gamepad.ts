/** W3C "standard" gamepad layout (https://w3c.github.io/gamepad/#remapping). */
export const gamepadButtonIndex = {
  a: 0,
  b: 1,
  x: 2,
  y: 3,
  lb: 4,
  rb: 5,
  lt: 6,
  rt: 7,
  back: 8,
  start: 9,
  ls: 10,
  rs: 11,
  up: 12,
  down: 13,
  left: 14,
  right: 15,
  home: 16,
} as const;

export const gamepadAxisIndex = {
  leftX: 0,
  leftY: 1,
  rightX: 2,
  rightY: 3,
} as const;

export type GamepadButtonName = keyof typeof gamepadButtonIndex;
export type GamepadAxisName = keyof typeof gamepadAxisIndex;

const BUTTON_NAMES = Object.keys(gamepadButtonIndex) as GamepadButtonName[];
const AXIS_NAMES = Object.keys(gamepadAxisIndex) as GamepadAxisName[];

export interface GamepadStick {
  x: number;
  y: number;
}

export type GamepadBinding =
  | { readonly button: GamepadButtonName }
  | {
      readonly axis: GamepadAxisName;
      /** Which half of the axis triggers the action. */
      readonly direction: 1 | -1;
    }
  | { readonly key: string };

/** Structural subset of `Gamepad`, so tests and non-DOM hosts can supply snapshots. */
export interface GamepadSnapshot {
  readonly index: number;
  readonly id: string;
  readonly connected: boolean;
  readonly mapping: string;
  readonly buttons: ReadonlyArray<{ readonly value: number }>;
  readonly axes: ReadonlyArray<number>;
}

/**
 * Tracks one standard-mapping gamepad. Non-standard devices are ignored rather than
 * guessed at: their button order is vendor specific and cannot be named reliably.
 */
export class GamepadState {
  private padIndex = -1;
  private padId = '';
  private preferred: number | undefined;
  private deadzoneValue = 0.15;
  private thresholdValue = 0.5;
  private values: number[] = new Array<number>(BUTTON_NAMES.length).fill(0);
  private previous: number[] = new Array<number>(BUTTON_NAMES.length).fill(0);
  private rawAxes: number[] = [0, 0, 0, 0];

  /** Index of the active pad, or -1 while none is connected with the standard mapping. */
  get index(): number {
    return this.padIndex;
  }

  get id(): string {
    return this.padId;
  }

  get connected(): boolean {
    return this.padIndex >= 0;
  }

  /** Lock selection to a `navigator.getGamepads()` slot, or undefined for the first standard pad. */
  get preferredIndex(): number | undefined {
    return this.preferred;
  }

  set preferredIndex(value: number | undefined) {
    if (value !== undefined && (!Number.isInteger(value) || value < 0))
      throw new RangeError('preferredIndex must be a nonnegative integer.');
    this.preferred = value;
  }

  /** Radial stick deadzone in [0, 1). */
  get deadzone(): number {
    return this.deadzoneValue;
  }

  set deadzone(value: number) {
    if (!Number.isFinite(value) || value < 0 || value >= 1)
      throw new RangeError('deadzone must be finite and within [0, 1).');
    this.deadzoneValue = value;
  }

  /** Analog button value at or above which a button counts as down, in (0, 1]. */
  get pressThreshold(): number {
    return this.thresholdValue;
  }

  set pressThreshold(value: number) {
    if (!Number.isFinite(value) || value <= 0 || value > 1)
      throw new RangeError('pressThreshold must be finite and within (0, 1].');
    this.thresholdValue = value;
  }

  /** Analog button value in [0, 1]. */
  button(name: GamepadButtonName): number {
    return this.values[buttonSlot(name)];
  }

  isDown(name: GamepadButtonName): boolean {
    return this.values[buttonSlot(name)] >= this.thresholdValue;
  }

  wasPressed(name: GamepadButtonName): boolean {
    const slot = buttonSlot(name);
    return (
      this.values[slot] >= this.thresholdValue &&
      this.previous[slot] < this.thresholdValue
    );
  }

  wasReleased(name: GamepadButtonName): boolean {
    const slot = buttonSlot(name);
    return (
      this.values[slot] < this.thresholdValue &&
      this.previous[slot] >= this.thresholdValue
    );
  }

  /** First button pressed this update; intended for "press a button to rebind" UI. */
  firstPressed(): GamepadButtonName | undefined {
    return BUTTON_NAMES.find((name) => this.wasPressed(name));
  }

  /**
   * Stick axis with a radial deadzone: the vector is zero inside the deadzone and
   * rescaled so magnitude ramps from 0 at the edge to 1 at full deflection.
   */
  axis(name: GamepadAxisName): number {
    const slot = axisSlot(name);
    const stick = slot < 2 ? this.stick('left') : this.stick('right');
    return slot % 2 === 0 ? stick.x : stick.y;
  }

  stick(which: 'left' | 'right'): GamepadStick {
    const base = which === 'left' ? 0 : 2;
    const x = this.rawAxes[base];
    const y = this.rawAxes[base + 1];
    const magnitude = Math.hypot(x, y);
    if (magnitude <= this.deadzoneValue) return { x: 0, y: 0 };
    const scaled =
      Math.min(1, (magnitude - this.deadzoneValue) / (1 - this.deadzoneValue)) /
      magnitude;
    return { x: x * scaled, y: y * scaled };
  }

  /** @internal Called once per frame with `navigator.getGamepads()`. */
  update(pads: ArrayLike<GamepadSnapshot | null>): void {
    const pad = this.select(pads);
    const next = new Array<number>(BUTTON_NAMES.length).fill(0);
    const switched = (pad?.index ?? -1) !== this.padIndex;
    if (!pad) {
      // A vanished pad reports released edges once, then stays neutral.
      this.previous = this.values;
      this.values = next;
      this.rawAxes = [0, 0, 0, 0];
      this.padIndex = -1;
      this.padId = '';
      return;
    }
    for (const [slot, name] of BUTTON_NAMES.entries()) {
      const raw = pad.buttons[gamepadButtonIndex[name]]?.value;
      next[slot] = Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : 0;
    }
    this.rawAxes = AXIS_NAMES.map((name) => {
      const raw = pad.axes[gamepadAxisIndex[name]];
      return Number.isFinite(raw) ? Math.min(1, Math.max(-1, raw)) : 0;
    });
    // A newly selected pad must not report already-held buttons as fresh presses.
    this.previous = switched ? next.slice() : this.values;
    this.values = next;
    this.padIndex = pad.index;
    this.padId = pad.id;
  }

  /** @internal */
  reset(): void {
    this.values.fill(0);
    this.previous.fill(0);
    this.rawAxes = [0, 0, 0, 0];
    this.padIndex = -1;
    this.padId = '';
  }

  private select(
    pads: ArrayLike<GamepadSnapshot | null>,
  ): GamepadSnapshot | undefined {
    const usable = (pad: GamepadSnapshot | null | undefined) =>
      pad && pad.connected && pad.mapping === 'standard' ? pad : undefined;
    if (this.preferred !== undefined) return usable(pads[this.preferred]);
    for (let i = 0; i < pads.length; i++) {
      const pad = usable(pads[i]);
      if (pad) return pad;
    }
    return undefined;
  }
}

function buttonSlot(name: GamepadButtonName): number {
  const slot = BUTTON_NAMES.indexOf(name);
  if (slot < 0) throw new RangeError(`Unknown gamepad button: ${name}`);
  return slot;
}

function axisSlot(name: GamepadAxisName): number {
  const slot = AXIS_NAMES.indexOf(name);
  if (slot < 0) throw new RangeError(`Unknown gamepad axis: ${name}`);
  return slot;
}

/** Keyboard surface needed by ActionMap; satisfied by `Keyboard`. */
export interface ActionKeyboard {
  isDown(code: string): boolean;
  wasPressed(code: string): boolean;
  wasReleased(code: string): boolean;
}

function checkBinding(binding: GamepadBinding): GamepadBinding {
  if ('button' in binding) {
    buttonSlot(binding.button);
    return { button: binding.button };
  }
  if ('axis' in binding) {
    axisSlot(binding.axis);
    if (binding.direction !== 1 && binding.direction !== -1)
      throw new RangeError('Axis binding direction must be 1 or -1.');
    return { axis: binding.axis, direction: binding.direction };
  }
  if (typeof binding.key !== 'string' || !binding.key)
    throw new RangeError('Key binding must be a non-empty KeyboardEvent.code.');
  return { key: binding.key };
}

/**
 * Named actions bound to gamepad buttons, stick directions and keys. Bindings can be
 * replaced at runtime (`rebind`) and round-tripped through `export`/`import`.
 */
export class ActionMap {
  private readonly map = new Map<string, GamepadBinding[]>();
  private readonly down = new Map<string, boolean>();
  private readonly edgePressed = new Set<string>();
  private readonly edgeReleased = new Set<string>();

  constructor(
    private readonly pad: GamepadState,
    private readonly keyboard?: ActionKeyboard,
  ) {}

  /** Adds bindings without disturbing existing ones. */
  bind(action: string, ...bindings: GamepadBinding[]): void {
    const checked = bindings.map(checkBinding);
    checkAction(action);
    const list = this.map.get(action) ?? [];
    for (const binding of checked)
      if (!list.some((other) => sameBinding(other, binding)))
        list.push(binding);
    this.map.set(action, list);
  }

  /** Replaces every binding for the action atomically. */
  rebind(action: string, bindings: readonly GamepadBinding[]): void {
    checkAction(action);
    this.map.set(action, bindings.map(checkBinding));
  }

  unbind(action: string): boolean {
    this.down.delete(action);
    return this.map.delete(action);
  }

  bindings(action: string): readonly GamepadBinding[] {
    return this.map.get(action) ?? [];
  }

  /** Analog strength in [0, 1]: the strongest bound source. */
  value(action: string): number {
    let best = 0;
    for (const binding of this.map.get(action) ?? []) {
      let v: number;
      if ('button' in binding) v = this.pad.button(binding.button);
      else if ('axis' in binding)
        v = Math.max(0, this.pad.axis(binding.axis) * binding.direction);
      else v = this.keyboard?.isDown(binding.key) ? 1 : 0;
      if (v > best) best = v;
    }
    return best;
  }

  isDown(action: string): boolean {
    return this.value(action) >= this.pad.pressThreshold;
  }

  wasPressed(action: string): boolean {
    return this.edgePressed.has(action);
  }

  wasReleased(action: string): boolean {
    return this.edgeReleased.has(action);
  }

  /** @internal Recomputes edges; call after the pad and keyboard state for this frame. */
  update(): void {
    this.edgePressed.clear();
    this.edgeReleased.clear();
    for (const [action, list] of this.map) {
      const now = this.isDown(action);
      const before = this.down.get(action) ?? false;
      this.down.set(action, now);
      // Key edges are OR-ed in so a tap shorter than one frame is not lost.
      const keyPress = list.some(
        (b) => 'key' in b && this.keyboard?.wasPressed(b.key),
      );
      const keyRelease = list.some(
        (b) => 'key' in b && this.keyboard?.wasReleased(b.key),
      );
      if ((now && !before) || keyPress) this.edgePressed.add(action);
      if ((!now && before) || keyRelease) this.edgeReleased.add(action);
    }
  }

  /** Plain JSON-safe copy for persisting player rebinding. */
  export(): Record<string, GamepadBinding[]> {
    const out: Record<string, GamepadBinding[]> = {};
    for (const [action, list] of this.map)
      out[action] = list.map((b) => ({ ...b }));
    return out;
  }

  /**
   * Replaces all bindings from `export()` data. Validation runs first, so bad data
   * leaves the current bindings untouched.
   */
  import(data: Readonly<Record<string, readonly GamepadBinding[]>>): void {
    const next = new Map<string, GamepadBinding[]>();
    for (const action of Object.keys(data)) {
      checkAction(action);
      const list = data[action];
      if (!Array.isArray(list))
        throw new RangeError(`Bindings for "${action}" must be an array.`);
      next.set(action, list.map(checkBinding));
    }
    this.map.clear();
    this.down.clear();
    this.edgePressed.clear();
    this.edgeReleased.clear();
    for (const [action, list] of next) this.map.set(action, list);
  }
}

function checkAction(action: string): void {
  // Guards prototype-shaped names when actions come from persisted JSON.
  if (typeof action !== 'string' || !action || action === '__proto__')
    throw new RangeError('Action name must be a non-empty string.');
}

function sameBinding(a: GamepadBinding, b: GamepadBinding): boolean {
  if ('button' in a && 'button' in b) return a.button === b.button;
  if ('axis' in a && 'axis' in b)
    return a.axis === b.axis && a.direction === b.direction;
  if ('key' in a && 'key' in b) return a.key === b.key;
  return false;
}

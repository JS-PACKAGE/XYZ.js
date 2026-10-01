import type { GestureType } from './gestures.js';

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

export type ActionBinding =
  | GamepadBinding
  | { readonly pointerButton: number }
  | { readonly wheel: 'x' | 'y' | 'z'; readonly direction: 1 | -1 }
  | { readonly gesture: GestureType }
  | { readonly virtual: string; readonly direction?: 1 | -1 };

/** Structural subset of `GamepadHapticActuator` (Chromium's dual-rumble effect). */
export interface GamepadVibrationActuator {
  readonly type?: string;
  playEffect?(
    type: string,
    params: {
      startDelay?: number;
      duration: number;
      weakMagnitude?: number;
      strongMagnitude?: number;
    },
  ): Promise<string>;
  reset?(): Promise<string>;
}

/** Structural subset of `Gamepad`, so tests and non-DOM hosts can supply snapshots. */
export interface GamepadSnapshot {
  readonly index: number;
  readonly id: string;
  readonly connected: boolean;
  readonly mapping: string;
  readonly buttons: ReadonlyArray<{ readonly value: number }>;
  readonly axes: ReadonlyArray<number>;
  readonly vibrationActuator?: GamepadVibrationActuator | null;
  /** Older Firefox haptics: `pulse(intensity, durationMs)`. */
  readonly hapticActuators?: ReadonlyArray<{
    pulse?(value: number, duration: number): Promise<boolean>;
  }>;
}

/**
 * Maps a non-standard pad's raw indices onto the standard layout. The browser only guarantees
 * the standard layout for pads it recognizes; for anything else the order is vendor specific, so
 * the mapping has to come from you (or from testing the device). Indices that are not listed read
 * as released/centered.
 */
export interface GamepadMapping {
  /** Matches `pad.id`: a string as a case-insensitive substring, or a RegExp. */
  readonly match: string | RegExp;
  readonly name?: string;
  /** Raw `buttons[]` index for each standard button. */
  readonly buttons?: Partial<Record<GamepadButtonName, number>>;
  /** Triggers reported on axes in [-1, 1] (-1 released): raw `axes[]` index per trigger. */
  readonly triggerAxes?: Partial<Record<'lt' | 'rt', number>>;
  /** Raw `axes[]` index per stick axis; `invert` flips the sign. */
  readonly axes?: Partial<
    Record<
      GamepadAxisName,
      number | { readonly index: number; readonly invert?: boolean }
    >
  >;
}

export interface GamepadRumbleOptions {
  /** Milliseconds, default 200, at most 5000. */
  duration?: number;
  /** Low-frequency motor in [0, 1]; default 1. */
  strong?: number;
  /** High-frequency motor in [0, 1]; defaults to `strong`. */
  weak?: number;
  /** Milliseconds before the effect starts, default 0. */
  startDelay?: number;
}

/**
 * Tracks one gamepad. Standard-mapping pads work out of the box. Non-standard devices are
 * ignored unless a {@link GamepadMapping} matching their id was added: their button order is
 * vendor specific and cannot be guessed reliably.
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
  private previousAxes: number[] = [0, 0, 0, 0];
  private readonly profiles: GamepadMapping[] = [];
  private readonly buttonSources: string[] = [];
  private readonly axisSources: string[] = [];
  private activePad: GamepadSnapshot | undefined;
  private activeProfile: GamepadMapping | undefined;
  private pollVersion = 0;

  /** @internal A gamepad press edge belongs to one device poll. */
  get pressVersion(): number {
    return this.pollVersion;
  }

  /** @internal Routed devices share the manager's mapping registrations. */
  constructor(private readonly profileSource?: GamepadState) {}

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

  /** The mapping applied to the active pad, or undefined for a standard-layout pad. */
  get mapping(): GamepadMapping | undefined {
    return this.activeProfile;
  }

  /**
   * Registers a mapping for non-standard pads whose `id` matches. Later registrations win.
   * Returns a function that removes it.
   */
  addMapping(mapping: GamepadMapping): () => void {
    const checkIndex = (value: number, label: string): void => {
      if (!Number.isInteger(value) || value < 0 || value > 255)
        throw new RangeError(`${label} must be an integer within 0..255.`);
    };
    if (typeof mapping.match === 'string' ? !mapping.match : !mapping.match)
      throw new RangeError('Gamepad mapping needs a non-empty match.');
    for (const [name, index] of Object.entries(mapping.buttons ?? {})) {
      buttonSlot(name as GamepadButtonName);
      checkIndex(index, `buttons.${name}`);
    }
    for (const [name, index] of Object.entries(mapping.triggerAxes ?? {}))
      checkIndex(index, `triggerAxes.${name}`);
    for (const [name, entry] of Object.entries(mapping.axes ?? {})) {
      axisSlot(name as GamepadAxisName);
      checkIndex(
        typeof entry === 'number' ? entry : entry.index,
        `axes.${name}`,
      );
    }
    const stored = { ...mapping };
    this.profiles.push(stored);
    return () => {
      const at = this.profiles.indexOf(stored);
      if (at >= 0) this.profiles.splice(at, 1);
    };
  }

  /**
   * Plays a dual-rumble effect on the active pad. Resolves true when it ran to completion and
   * false when the pad has no usable actuator, the effect was replaced, or the browser refused.
   */
  async rumble(options: GamepadRumbleOptions = {}): Promise<boolean> {
    const duration = options.duration ?? 200;
    const strong = options.strong ?? 1;
    const weak = options.weak ?? strong;
    const startDelay = options.startDelay ?? 0;
    if (!Number.isFinite(duration) || duration < 0 || duration > 5000)
      throw new RangeError('Rumble duration must be within 0..5000 ms.');
    if (!Number.isFinite(startDelay) || startDelay < 0 || startDelay > 5000)
      throw new RangeError('Rumble startDelay must be within 0..5000 ms.');
    for (const magnitude of [strong, weak])
      if (!Number.isFinite(magnitude) || magnitude < 0 || magnitude > 1)
        throw new RangeError('Rumble magnitudes must be within 0..1.');
    const pad = this.activePad;
    if (!pad) return false;
    try {
      const actuator = pad.vibrationActuator;
      if (actuator?.playEffect) {
        const result = await actuator.playEffect(
          actuator.type ?? 'dual-rumble',
          {
            startDelay,
            duration,
            weakMagnitude: weak,
            strongMagnitude: strong,
          },
        );
        return result === 'complete';
      }
      const legacy = pad.hapticActuators?.[0];
      if (legacy?.pulse) {
        if (startDelay > 0)
          await new Promise((resolve) => setTimeout(resolve, startDelay));
        return await legacy.pulse(Math.max(strong, weak), duration);
      }
    } catch {
      // A pad that vanished or a browser that refused simply has no rumble.
    }
    return false;
  }

  /** Cancels the current rumble effect; false when there was nothing to cancel. */
  async stopRumble(): Promise<boolean> {
    try {
      const result = await this.activePad?.vibrationActuator?.reset?.();
      return result === 'complete';
    } catch {
      return false;
    }
  }

  /** Lock selection to a browser gamepad's actual index, or undefined for the first usable pad. */
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
    const base = slot < 2 ? 0 : 2;
    const magnitude = Math.hypot(this.rawAxes[base], this.rawAxes[base + 1]);
    if (magnitude <= this.deadzoneValue) return 0;
    return (
      (this.rawAxes[slot] *
        Math.min(
          1,
          (magnitude - this.deadzoneValue) / (1 - this.deadzoneValue),
        )) /
      magnitude
    );
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

  /** @internal Physical identities also account for custom mappings sharing a raw source. */
  source(binding: ActionBinding): string | undefined {
    if (!this.connected) return undefined;
    if ('button' in binding)
      return this.buttonSources[buttonSlot(binding.button)];
    if ('axis' in binding) return this.axisSources[axisSlot(binding.axis)];
    return undefined;
  }

  /** @internal An already-deflected newly selected device is not a fresh press. */
  axisWasPressed(name: GamepadAxisName, direction: 1 | -1): boolean {
    const slot = axisSlot(name);
    const base = slot < 2 ? 0 : 2;
    const magnitude = Math.hypot(
      this.previousAxes[base],
      this.previousAxes[base + 1],
    );
    const before =
      magnitude <= this.deadzoneValue
        ? 0
        : (this.previousAxes[slot] *
            Math.min(
              1,
              (magnitude - this.deadzoneValue) / (1 - this.deadzoneValue),
            )) /
          magnitude;
    return (
      this.axis(name) * direction >= this.thresholdValue &&
      before * direction < this.thresholdValue
    );
  }

  /** @internal Called once per frame with `navigator.getGamepads()`. */
  update(pads: ArrayLike<GamepadSnapshot | null>): void {
    this.pollVersion++;
    const pad = this.select(pads);
    const next = this.previous;
    this.previous = this.values;
    this.values = next;
    const nextAxes = this.previousAxes;
    this.previousAxes = this.rawAxes;
    this.rawAxes = nextAxes;
    const profile =
      pad && pad.mapping !== 'standard' ? this.profileFor(pad) : undefined;
    const switched =
      (pad?.index ?? -1) !== this.padIndex ||
      (pad?.id ?? '') !== this.padId ||
      profile !== this.activeProfile;
    if (!pad) {
      this.activePad = undefined;
      this.activeProfile = undefined;
      this.values.fill(0);
      this.rawAxes.fill(0);
      this.padIndex = -1;
      this.padId = '';
      return;
    }
    for (let slot = 0; slot < BUTTON_NAMES.length; slot++) {
      const name = BUTTON_NAMES[slot];
      let raw: number | undefined;
      if (!profile) raw = pad.buttons[gamepadButtonIndex[name]]?.value;
      else {
        const index = profile.buttons?.[name];
        if (index !== undefined) raw = pad.buttons[index]?.value;
        else if (
          (name === 'lt' || name === 'rt') &&
          profile.triggerAxes?.[name] !== undefined
        ) {
          const axis = pad.axes[profile.triggerAxes[name]!];
          raw = Number.isFinite(axis) ? (axis + 1) / 2 : 0;
        }
      }
      this.values[slot] = Number.isFinite(raw)
        ? Math.min(1, Math.max(0, raw!))
        : 0;
      if (switched) {
        const button = profile
          ? profile.buttons?.[name]
          : gamepadButtonIndex[name];
        const trigger =
          name === 'lt' || name === 'rt'
            ? profile?.triggerAxes?.[name]
            : undefined;
        this.buttonSources[slot] =
          button !== undefined
            ? `gamepad:${pad.index}:button:${button}`
            : trigger !== undefined
              ? `gamepad:${pad.index}:axis:${trigger}`
              : '';
      }
    }
    for (let slot = 0; slot < AXIS_NAMES.length; slot++) {
      const name = AXIS_NAMES[slot];
      const entry = profile ? profile.axes?.[name] : gamepadAxisIndex[name];
      const index = typeof entry === 'number' ? entry : entry?.index;
      let raw = index === undefined ? undefined : pad.axes[index];
      if (typeof entry === 'object' && entry.invert) raw = -raw!;
      this.rawAxes[slot] = Number.isFinite(raw)
        ? Math.min(1, Math.max(-1, raw!))
        : 0;
      if (switched)
        this.axisSources[slot] =
          index === undefined ? '' : `gamepad:${pad.index}:axis:${index}`;
    }
    this.activePad = pad;
    this.activeProfile = profile;
    if (switched) {
      for (let i = 0; i < this.values.length; i++)
        this.previous[i] = this.values[i];
      for (let i = 0; i < this.rawAxes.length; i++)
        this.previousAxes[i] = this.rawAxes[i];
    }
    this.padIndex = pad.index;
    this.padId = pad.id;
  }

  /** @internal */
  reset(): void {
    this.activePad = undefined;
    this.activeProfile = undefined;
    this.values.fill(0);
    this.previous.fill(0);
    this.rawAxes.fill(0);
    this.previousAxes.fill(0);
    this.padIndex = -1;
    this.padId = '';
  }

  private profileFor(pad: GamepadSnapshot): GamepadMapping | undefined {
    const profiles = this.profileSource?.profiles ?? this.profiles;
    for (let i = profiles.length - 1; i >= 0; i--)
      if (matches(profiles[i]!.match, pad.id)) return profiles[i];
    return undefined;
  }

  private select(
    pads: ArrayLike<GamepadSnapshot | null>,
  ): GamepadSnapshot | undefined {
    const usable = (pad: GamepadSnapshot | null | undefined) =>
      pad &&
      pad.connected &&
      (pad.mapping === 'standard' || this.profileFor(pad))
        ? pad
        : undefined;
    if (this.preferred !== undefined) {
      for (let i = 0; i < pads.length; i++)
        if (pads[i]?.index === this.preferred) return usable(pads[i]);
      return undefined;
    }
    for (let i = 0; i < pads.length; i++) {
      const pad = usable(pads[i]);
      if (pad) return pad;
    }
    return undefined;
  }
}

function matches(pattern: string | RegExp, id: string): boolean {
  return typeof pattern === 'string'
    ? id.toLowerCase().includes(pattern.toLowerCase())
    : new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, '')).test(id);
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
  pressVersion?(code: string): number;
}

/** @internal Additional sources supplied by InputManager, without changing raw polling. */
export interface ActionSources {
  readonly pointer: {
    isDown(button: number): boolean;
    wasPressed(button: number): boolean;
    wasReleased(button: number): boolean;
    pressVersion(button: number): number;
    wheelVersion(axis: 'x' | 'y' | 'z'): number;
    wheelDelta(axis: 'x' | 'y' | 'z'): number;
  };
  readonly virtual: {
    value(control: string): number;
    wasPressed(control: string, direction: 1 | -1, threshold: number): boolean;
    wasReleased(control: string, direction: 1 | -1, threshold: number): boolean;
  };
  gesture(type: GestureType): boolean;
  gestureVersion(type: GestureType): number;
}

const GESTURE_TYPES: Readonly<Record<GestureType, true>> = {
  tap: true,
  doubletap: true,
  longpress: true,
  swipe: true,
  pan: true,
  pinch: true,
  rotate: true,
};

function checkBinding(binding: ActionBinding): ActionBinding {
  if (!binding || typeof binding !== 'object')
    throw new RangeError('Action binding must be an object.');
  const kinds = [
    'button',
    'axis',
    'key',
    'pointerButton',
    'wheel',
    'gesture',
    'virtual',
  ];
  if (kinds.filter((kind) => Object.hasOwn(binding, kind)).length !== 1)
    throw new RangeError('Action binding must specify exactly one source.');
  if ('button' in binding) {
    buttonSlot(binding.button);
    return { button: binding.button };
  }
  if ('axis' in binding) {
    axisSlot(binding.axis);
    checkDirection(binding.direction);
    return { axis: binding.axis, direction: binding.direction };
  }
  if ('pointerButton' in binding) {
    if (
      !Number.isInteger(binding.pointerButton) ||
      binding.pointerButton < 0 ||
      binding.pointerButton > 31
    )
      throw new RangeError('Pointer button must be an integer within 0..31.');
    return { pointerButton: binding.pointerButton };
  }
  if ('wheel' in binding) {
    if (binding.wheel !== 'x' && binding.wheel !== 'y' && binding.wheel !== 'z')
      throw new RangeError('Wheel axis must be x, y or z.');
    checkDirection(binding.direction);
    return { wheel: binding.wheel, direction: binding.direction };
  }
  if ('gesture' in binding) {
    if (!Object.hasOwn(GESTURE_TYPES, binding.gesture))
      throw new RangeError('Unknown gesture binding.');
    return { gesture: binding.gesture };
  }
  if ('virtual' in binding) {
    checkAction(binding.virtual);
    if (binding.direction !== undefined) checkDirection(binding.direction);
    return binding.direction === undefined
      ? { virtual: binding.virtual }
      : { virtual: binding.virtual, direction: binding.direction };
  }
  if (typeof binding.key !== 'string' || !binding.key)
    throw new RangeError('Key binding must be a non-empty KeyboardEvent.code.');
  return { key: binding.key };
}

function checkDirection(direction: number): void {
  if (direction !== 1 && direction !== -1)
    throw new RangeError('Axis binding direction must be 1 or -1.');
}

/**
 * Named cross-device actions. Bindings can be replaced atomically and round-tripped
 * through JSON; InputManager contexts use this same map with physical-source routing.
 */
export class ActionMap {
  private readonly map = new Map<string, ActionBinding[]>();
  private readonly down = new Map<string, boolean>();
  private readonly values = new Map<string, number>();
  private readonly frameDown = new Map<string, boolean>();
  private readonly identities = new WeakMap<ActionBinding, string>();
  private blocked = new WeakSet<ActionBinding>();
  private mutedPressVersions = new WeakMap<ActionBinding, number>();
  private pulseFrame = 0;
  private readonly edgePressed = new Set<string>();
  private readonly edgeReleased = new Set<string>();
  private readonly pendingReleased = new Set<string>();

  constructor(
    private readonly pad: GamepadState,
    private readonly keyboard?: ActionKeyboard,
    private readonly sources?: ActionSources,
    private readonly managed = false,
  ) {}

  /** Adds bindings without disturbing existing ones. */
  bind(action: string, ...bindings: ActionBinding[]): void {
    checkAction(action);
    const checked = bindings.map((binding) => this.compile(binding));
    const list = this.map.get(action) ?? [];
    for (const binding of checked)
      if (!list.some((other) => sameBinding(other, binding)))
        list.push(binding);
    this.map.set(action, list);
  }

  /** Replaces every binding for the action atomically. */
  rebind(action: string, bindings: readonly ActionBinding[]): void {
    checkAction(action);
    if (!Array.isArray(bindings))
      throw new RangeError('Action bindings must be an array.');
    this.map.set(
      action,
      bindings.map((binding) => this.compile(binding)),
    );
  }

  unbind(action: string): boolean {
    if (!this.map.delete(action)) return false;
    this.release(action);
    this.down.delete(action);
    this.values.delete(action);
    return true;
  }

  bindings(action: string): readonly ActionBinding[] {
    return this.map.get(action) ?? [];
  }

  /** Analog strength in [0, 1]: the strongest bound, unconsumed source. */
  value(action: string): number {
    if (this.managed) return this.values.get(action) ?? 0;
    let best = 0;
    for (const binding of this.map.get(action) ?? [])
      best = Math.max(best, this.bindingValue(binding));
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

  /** @internal Consumption reserves physical sources, not action names or axis halves. */
  update(
    consumed?: ReadonlySet<string>,
    claim?: Set<string>,
    preserveEdges = false,
  ): void {
    if (!preserveEdges) {
      this.edgePressed.clear();
      this.edgeReleased.clear();
    }
    for (const action of this.pendingReleased) this.edgeReleased.add(action);
    this.pendingReleased.clear();
    for (const [action, list] of this.map) {
      const previousDown = this.managed
        ? (this.frameDown.get(action) ?? this.down.get(action) ?? false)
        : (this.down.get(action) ?? false);
      if (this.managed && !this.frameDown.has(action))
        this.frameDown.set(action, previousDown);
      let value = 0;
      let pressed = false;
      let pulsePressed = false;
      let released = false;
      for (const binding of list) {
        const source = this.identities.get(binding) || this.pad.source(binding);
        const wasBlocked = this.blocked.has(binding);
        const blocked = source !== undefined && consumed?.has(source) === true;
        const physicalPress = this.bindingPressed(binding);
        const pressVersion = this.bindingPressVersion(binding);
        if (physicalPress && blocked)
          this.mutedPressVersions.set(binding, pressVersion);
        if (!blocked) {
          value = Math.max(value, this.bindingValue(binding));
          if (this.mutedPressVersions.get(binding) !== pressVersion) {
            pressed ||= physicalPress;
            pulsePressed ||=
              physicalPress && ('wheel' in binding || 'gesture' in binding);
          }
          if (!wasBlocked) released ||= this.bindingReleased(binding);
          this.blocked.delete(binding);
        } else this.blocked.add(binding);
        if (source) claim?.add(source);
      }
      const now = value >= this.pad.pressThreshold;
      if ((previousDown && !now) || (!now && released))
        this.edgeReleased.add(action);
      if (pressed && (!previousDown || pulsePressed))
        this.edgePressed.add(action);
      else if (!now) this.edgePressed.delete(action);
      this.values.set(action, value);
      this.down.set(action, now);
    }
  }

  /** @internal Baselines only edge provenance, never transient unconsumed action values. */
  baseline(): void {
    for (const list of this.map.values())
      for (const binding of list)
        if (this.bindingPressed(binding))
          this.mutedPressVersions.set(
            binding,
            this.bindingPressVersion(binding),
          );
  }

  /** @internal Releases remain observable immediately and on the next update. */
  reset(): void {
    for (const action of this.map.keys()) this.release(action);
    this.values.clear();
    this.down.clear();
    this.frameDown.clear();
    this.blocked = new WeakSet<ActionBinding>();
    this.mutedPressVersions = new WeakMap<ActionBinding, number>();
    this.edgePressed.clear();
  }

  /** @internal */
  endFrame(): void {
    this.edgePressed.clear();
    this.edgeReleased.clear();
    this.frameDown.clear();
    this.pulseFrame++;
  }

  /** @internal Inactive contexts still publish queued releases for one frame. */
  updateInactive(): void {
    this.edgePressed.clear();
    this.edgeReleased.clear();
    for (const action of this.pendingReleased) this.edgeReleased.add(action);
    this.pendingReleased.clear();
  }

  /** Plain JSON-safe copy for persisting player rebinding. */
  export(): Record<string, ActionBinding[]> {
    const out: Record<string, ActionBinding[]> = {};
    for (const [action, list] of this.map)
      Object.defineProperty(out, action, {
        value: list.map((binding) => ({ ...binding })),
        enumerable: true,
        configurable: true,
        writable: true,
      });
    return out;
  }

  /** Validation runs first, so invalid persisted data leaves current bindings untouched. */
  import(data: Readonly<Record<string, readonly ActionBinding[]>>): void {
    if (!data || typeof data !== 'object' || Array.isArray(data))
      throw new RangeError('Action bindings must be an object.');
    const next = new Map<string, ActionBinding[]>();
    for (const action of Object.keys(data)) {
      checkAction(action);
      const list = data[action];
      if (!Array.isArray(list))
        throw new RangeError(`Bindings for "${action}" must be an array.`);
      next.set(
        action,
        list.map((binding) => this.compile(binding)),
      );
    }
    this.reset();
    this.map.clear();
    for (const [action, list] of next) this.map.set(action, list);
  }

  private release(action: string): void {
    if (this.down.get(action)) {
      this.edgeReleased.add(action);
      this.pendingReleased.add(action);
    }
    this.edgePressed.delete(action);
    this.values.set(action, 0);
    this.down.set(action, false);
  }

  private compile(binding: ActionBinding): ActionBinding {
    const checked = checkBinding(binding);
    let source: string | undefined;
    if ('key' in checked) source = `key:${checked.key}`;
    else if ('pointerButton' in checked)
      source = `pointer:${checked.pointerButton}`;
    else if ('wheel' in checked) source = `wheel:${checked.wheel}`;
    // Recognized gestures originate from the primary pointer stream. Reserving
    // that stream also prevents a consumed tap leaking as a lower pointer action.
    else if ('gesture' in checked) source = 'pointer:0';
    else if ('virtual' in checked) source = `virtual:${checked.virtual}`;
    if (source) this.identities.set(checked, source);
    return checked;
  }

  private bindingPressVersion(binding: ActionBinding): number {
    if ('button' in binding || 'axis' in binding) return this.pad.pressVersion;
    if ('key' in binding)
      return this.keyboard?.pressVersion?.(binding.key) ?? this.pulseFrame;
    if ('pointerButton' in binding)
      return (
        this.sources?.pointer.pressVersion(binding.pointerButton) ??
        this.pulseFrame
      );
    if ('wheel' in binding)
      return (
        this.sources?.pointer.wheelVersion(binding.wheel) ?? this.pulseFrame
      );
    if ('gesture' in binding)
      return this.sources?.gestureVersion(binding.gesture) ?? this.pulseFrame;
    return this.pulseFrame;
  }

  private bindingValue(binding: ActionBinding): number {
    if ('button' in binding) return this.pad.button(binding.button);
    if ('axis' in binding)
      return Math.max(0, this.pad.axis(binding.axis) * binding.direction);
    if ('key' in binding) return this.keyboard?.isDown(binding.key) ? 1 : 0;
    if ('pointerButton' in binding)
      return this.sources?.pointer.isDown(binding.pointerButton) ? 1 : 0;
    if ('wheel' in binding)
      return Math.min(
        1,
        Math.max(
          0,
          (this.sources?.pointer.wheelDelta(binding.wheel) ?? 0) *
            binding.direction,
        ),
      );
    if ('gesture' in binding)
      return this.sources?.gesture(binding.gesture) ? 1 : 0;
    return Math.max(
      0,
      (this.sources?.virtual.value(binding.virtual) ?? 0) *
        (binding.direction ?? 1),
    );
  }

  private bindingPressed(binding: ActionBinding): boolean {
    if ('button' in binding) return this.pad.wasPressed(binding.button);
    if ('axis' in binding)
      return this.pad.axisWasPressed(binding.axis, binding.direction);
    if ('key' in binding)
      return this.keyboard?.wasPressed(binding.key) ?? false;
    if ('pointerButton' in binding)
      return this.sources?.pointer.wasPressed(binding.pointerButton) ?? false;
    if ('virtual' in binding)
      return (
        this.sources?.virtual.wasPressed(
          binding.virtual,
          binding.direction ?? 1,
          this.pad.pressThreshold,
        ) ?? false
      );
    return this.bindingValue(binding) >= this.pad.pressThreshold;
  }

  private bindingReleased(binding: ActionBinding): boolean {
    if ('key' in binding)
      return this.keyboard?.wasReleased(binding.key) ?? false;
    if ('pointerButton' in binding)
      return this.sources?.pointer.wasReleased(binding.pointerButton) ?? false;
    if ('virtual' in binding)
      return (
        this.sources?.virtual.wasReleased(
          binding.virtual,
          binding.direction ?? 1,
          this.pad.pressThreshold,
        ) ?? false
      );
    return false;
  }
}

function checkAction(action: string): void {
  if (typeof action !== 'string' || !action || action === '__proto__')
    throw new RangeError('Action name must be a non-empty string.');
}

function sameBinding(a: ActionBinding, b: ActionBinding): boolean {
  if ('button' in a && 'button' in b) return a.button === b.button;
  if ('axis' in a && 'axis' in b)
    return a.axis === b.axis && a.direction === b.direction;
  if ('key' in a && 'key' in b) return a.key === b.key;
  if ('pointerButton' in a && 'pointerButton' in b)
    return a.pointerButton === b.pointerButton;
  if ('wheel' in a && 'wheel' in b)
    return a.wheel === b.wheel && a.direction === b.direction;
  if ('gesture' in a && 'gesture' in b) return a.gesture === b.gesture;
  if ('virtual' in a && 'virtual' in b)
    return a.virtual === b.virtual && (a.direction ?? 1) === (b.direction ?? 1);
  return false;
}

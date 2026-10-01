import type { GestureType } from './gestures.js';
/** W3C "standard" gamepad layout (https://w3c.github.io/gamepad/#remapping). */
export declare const gamepadButtonIndex: {
    readonly a: 0;
    readonly b: 1;
    readonly x: 2;
    readonly y: 3;
    readonly lb: 4;
    readonly rb: 5;
    readonly lt: 6;
    readonly rt: 7;
    readonly back: 8;
    readonly start: 9;
    readonly ls: 10;
    readonly rs: 11;
    readonly up: 12;
    readonly down: 13;
    readonly left: 14;
    readonly right: 15;
    readonly home: 16;
};
export declare const gamepadAxisIndex: {
    readonly leftX: 0;
    readonly leftY: 1;
    readonly rightX: 2;
    readonly rightY: 3;
};
export type GamepadButtonName = keyof typeof gamepadButtonIndex;
export type GamepadAxisName = keyof typeof gamepadAxisIndex;
export interface GamepadStick {
    x: number;
    y: number;
}
export type GamepadBinding = {
    readonly button: GamepadButtonName;
} | {
    readonly axis: GamepadAxisName;
    /** Which half of the axis triggers the action. */
    readonly direction: 1 | -1;
} | {
    readonly key: string;
};
export type ActionBinding = GamepadBinding | {
    readonly pointerButton: number;
} | {
    readonly wheel: 'x' | 'y' | 'z';
    readonly direction: 1 | -1;
} | {
    readonly gesture: GestureType;
} | {
    readonly virtual: string;
    readonly direction?: 1 | -1;
};
/** Structural subset of `GamepadHapticActuator` (Chromium's dual-rumble effect). */
export interface GamepadVibrationActuator {
    readonly type?: string;
    playEffect?(type: string, params: {
        startDelay?: number;
        duration: number;
        weakMagnitude?: number;
        strongMagnitude?: number;
    }): Promise<string>;
    reset?(): Promise<string>;
}
/** Structural subset of `Gamepad`, so tests and non-DOM hosts can supply snapshots. */
export interface GamepadSnapshot {
    readonly index: number;
    readonly id: string;
    readonly connected: boolean;
    readonly mapping: string;
    readonly buttons: ReadonlyArray<{
        readonly value: number;
    }>;
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
    readonly axes?: Partial<Record<GamepadAxisName, number | {
        readonly index: number;
        readonly invert?: boolean;
    }>>;
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
export declare class GamepadState {
    private readonly profileSource?;
    private padIndex;
    private padId;
    private preferred;
    private deadzoneValue;
    private thresholdValue;
    private values;
    private previous;
    private rawAxes;
    private previousAxes;
    private readonly profiles;
    private readonly buttonSources;
    private readonly axisSources;
    private activePad;
    private activeProfile;
    private pollVersion;
    /** @internal A gamepad press edge belongs to one device poll. */
    get pressVersion(): number;
    /** @internal Routed devices share the manager's mapping registrations. */
    constructor(profileSource?: GamepadState | undefined);
    /** Index of the active pad, or -1 while none is connected with the standard mapping. */
    get index(): number;
    get id(): string;
    get connected(): boolean;
    /** The mapping applied to the active pad, or undefined for a standard-layout pad. */
    get mapping(): GamepadMapping | undefined;
    /**
     * Registers a mapping for non-standard pads whose `id` matches. Later registrations win.
     * Returns a function that removes it.
     */
    addMapping(mapping: GamepadMapping): () => void;
    /**
     * Plays a dual-rumble effect on the active pad. Resolves true when it ran to completion and
     * false when the pad has no usable actuator, the effect was replaced, or the browser refused.
     */
    rumble(options?: GamepadRumbleOptions): Promise<boolean>;
    /** Cancels the current rumble effect; false when there was nothing to cancel. */
    stopRumble(): Promise<boolean>;
    /** Lock selection to a browser gamepad's actual index, or undefined for the first usable pad. */
    get preferredIndex(): number | undefined;
    set preferredIndex(value: number | undefined);
    /** Radial stick deadzone in [0, 1). */
    get deadzone(): number;
    set deadzone(value: number);
    /** Analog button value at or above which a button counts as down, in (0, 1]. */
    get pressThreshold(): number;
    set pressThreshold(value: number);
    /** Analog button value in [0, 1]. */
    button(name: GamepadButtonName): number;
    isDown(name: GamepadButtonName): boolean;
    wasPressed(name: GamepadButtonName): boolean;
    wasReleased(name: GamepadButtonName): boolean;
    /** First button pressed this update; intended for "press a button to rebind" UI. */
    firstPressed(): GamepadButtonName | undefined;
    /**
     * Stick axis with a radial deadzone: the vector is zero inside the deadzone and
     * rescaled so magnitude ramps from 0 at the edge to 1 at full deflection.
     */
    axis(name: GamepadAxisName): number;
    stick(which: 'left' | 'right'): GamepadStick;
    /** @internal Physical identities also account for custom mappings sharing a raw source. */
    source(binding: ActionBinding): string | undefined;
    /** @internal An already-deflected newly selected device is not a fresh press. */
    axisWasPressed(name: GamepadAxisName, direction: 1 | -1): boolean;
    /** @internal Called once per frame with `navigator.getGamepads()`. */
    update(pads: ArrayLike<GamepadSnapshot | null>): void;
    /** @internal */
    reset(): void;
    private profileFor;
    private select;
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
/**
 * Named cross-device actions. Bindings can be replaced atomically and round-tripped
 * through JSON; InputManager contexts use this same map with physical-source routing.
 */
export declare class ActionMap {
    private readonly pad;
    private readonly keyboard?;
    private readonly sources?;
    private readonly managed;
    private readonly map;
    private readonly down;
    private readonly values;
    private readonly frameDown;
    private readonly identities;
    private blocked;
    private mutedPressVersions;
    private pulseFrame;
    private readonly edgePressed;
    private readonly edgeReleased;
    private readonly pendingReleased;
    constructor(pad: GamepadState, keyboard?: ActionKeyboard | undefined, sources?: ActionSources | undefined, managed?: boolean);
    /** Adds bindings without disturbing existing ones. */
    bind(action: string, ...bindings: ActionBinding[]): void;
    /** Replaces every binding for the action atomically. */
    rebind(action: string, bindings: readonly ActionBinding[]): void;
    unbind(action: string): boolean;
    bindings(action: string): readonly ActionBinding[];
    /** Analog strength in [0, 1]: the strongest bound, unconsumed source. */
    value(action: string): number;
    isDown(action: string): boolean;
    wasPressed(action: string): boolean;
    wasReleased(action: string): boolean;
    /** @internal Consumption reserves physical sources, not action names or axis halves. */
    update(consumed?: ReadonlySet<string>, claim?: Set<string>, preserveEdges?: boolean): void;
    /** @internal Baselines only edge provenance, never transient unconsumed action values. */
    baseline(): void;
    /** @internal Releases remain observable immediately and on the next update. */
    reset(): void;
    /** @internal */
    endFrame(): void;
    /** @internal Inactive contexts still publish queued releases for one frame. */
    updateInactive(): void;
    /** Plain JSON-safe copy for persisting player rebinding. */
    export(): Record<string, ActionBinding[]>;
    /** Validation runs first, so invalid persisted data leaves current bindings untouched. */
    import(data: Readonly<Record<string, readonly ActionBinding[]>>): void;
    private release;
    private compile;
    private bindingPressVersion;
    private bindingValue;
    private bindingPressed;
    private bindingReleased;
}

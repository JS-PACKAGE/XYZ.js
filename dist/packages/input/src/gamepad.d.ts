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
    private padIndex;
    private padId;
    private preferred;
    private deadzoneValue;
    private thresholdValue;
    private values;
    private previous;
    private rawAxes;
    private readonly profiles;
    private activePad;
    private activeProfile;
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
    /** Lock selection to a `navigator.getGamepads()` slot, or undefined for the first standard pad. */
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
}
/**
 * Named actions bound to gamepad buttons, stick directions and keys. Bindings can be
 * replaced at runtime (`rebind`) and round-tripped through `export`/`import`.
 */
export declare class ActionMap {
    private readonly pad;
    private readonly keyboard?;
    private readonly map;
    private readonly down;
    private readonly edgePressed;
    private readonly edgeReleased;
    constructor(pad: GamepadState, keyboard?: ActionKeyboard | undefined);
    /** Adds bindings without disturbing existing ones. */
    bind(action: string, ...bindings: GamepadBinding[]): void;
    /** Replaces every binding for the action atomically. */
    rebind(action: string, bindings: readonly GamepadBinding[]): void;
    unbind(action: string): boolean;
    bindings(action: string): readonly GamepadBinding[];
    /** Analog strength in [0, 1]: the strongest bound source. */
    value(action: string): number;
    isDown(action: string): boolean;
    wasPressed(action: string): boolean;
    wasReleased(action: string): boolean;
    /** @internal Recomputes edges; call after the pad and keyboard state for this frame. */
    update(): void;
    /** Plain JSON-safe copy for persisting player rebinding. */
    export(): Record<string, GamepadBinding[]>;
    /**
     * Replaces all bindings from `export()` data. Validation runs first, so bad data
     * leaves the current bindings untouched.
     */
    import(data: Readonly<Record<string, readonly GamepadBinding[]>>): void;
}

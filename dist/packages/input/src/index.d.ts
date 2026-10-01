import { Vector2 } from '../../math/src/index.js';
import { ActionMap, GamepadState } from './gamepad.js';
import { GestureRecognizer } from './gestures.js';
export { GestureRecognizer } from './gestures.js';
export type { GestureDetail, GestureOptions, GesturePhase, GesturePoint, GestureThresholds, GestureType, } from './gestures.js';
export { ActionMap, GamepadState, gamepadAxisIndex, gamepadButtonIndex, } from './gamepad.js';
export type { ActionKeyboard, GamepadAxisName, GamepadBinding, GamepadButtonName, GamepadMapping, GamepadRumbleOptions, GamepadSnapshot, GamepadVibrationActuator, GamepadStick, } from './gamepad.js';
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
export declare class Keyboard {
    private readonly down;
    private readonly pressed;
    private readonly released;
    isDown(code: string): boolean;
    wasPressed(code: string): boolean;
    wasReleased(code: string): boolean;
    /** @internal */
    keyDown(event: KeyboardEvent): void;
    /** @internal */
    keyUp(event: KeyboardEvent): void;
    /** @internal */
    endFrame(): void;
    /** @internal */
    reset(): void;
}
export declare class Pointer {
    private readonly canvas;
    private readonly getSize;
    private readonly observe?;
    private readonly onReset?;
    readonly position: Vector2;
    private readonly down;
    private readonly pressed;
    private readonly released;
    private readonly pointers;
    private hovered;
    private readonly views;
    private readonly queued;
    private readonly samplePool;
    private sequence;
    private generation;
    private cursorOwned;
    private originalCursor;
    private originalCursorPriority;
    private assignedCursor;
    get activePointers(): ReadonlyMap<number, ActivePointer>;
    /** @internal Valid until endFrame; consumed once by the scene router. */
    get samples(): readonly PointerSample[];
    /** @internal Reset invalidates scene-local capture/hover state. */
    get resetVersion(): number;
    /** @internal Individual capture state, unlike aggregate mouse-button polling. */
    isPointerDown(id: number): boolean;
    private record;
    constructor(canvas: HTMLCanvasElement, getSize: () => {
        width: number;
        height: number;
    }, observe?: ((sample: PointerSample) => void) | undefined, onReset?: (() => void) | undefined);
    get active(): boolean;
    isDown(button: number): boolean;
    wasPressed(button: number): boolean;
    wasReleased(button: number): boolean;
    /** CSS-pixel deltas; line mode uses 16px and page mode uses the content height. */
    wheel(event: WheelEvent): void;
    /** @internal */
    setCursor(cursor?: string): void;
    /** @internal */
    enter(event: PointerEvent): void;
    /** @internal */
    leave(event: PointerEvent): void;
    /** @internal */
    move(event: PointerEvent): void;
    /** @internal */
    pointerDown(event: PointerEvent): void;
    /** @internal */
    pointerUp(event: PointerEvent): void;
    /** @internal */
    cancel(event: PointerEvent): void;
    /** @internal */
    lostCapture(event: PointerEvent): void;
    /** @internal */
    endFrame(): void;
    /** @internal */
    reset(): void;
    private releaseButton;
    private clearPointer;
    private releaseCapture;
    private updatePosition;
}
export declare class InputManager {
    private readonly canvas;
    readonly keyboard: Keyboard;
    readonly pointer: Pointer;
    /** Tap, double tap, long press, swipe, pan, pinch and rotate recognized from `pointer`. */
    readonly gestures: GestureRecognizer;
    /** First standard-mapping gamepad with deadzones, analog buttons and press edges. */
    readonly gamepad: GamepadState;
    /** Named actions bound to gamepad buttons, stick directions and keys. */
    readonly actions: ActionMap;
    /** Snapshot from the latest update; disconnected gamepad indices retain null slots. */
    get gamepads(): readonly (Gamepad | null)[];
    private gamepadSnapshot;
    private destroyed;
    private readonly onKeyDown;
    private readonly onKeyUp;
    private readonly onBlur;
    private readonly onVisibilityChange;
    private readonly onPointerEnter;
    private readonly onPointerLeave;
    private readonly onPointerMove;
    private readonly onPointerDown;
    private readonly onPointerUp;
    private readonly onPointerCancel;
    private readonly onLostPointerCapture;
    private readonly onWheel;
    constructor(canvas: HTMLCanvasElement, getSize: () => {
        width: number;
        height: number;
    });
    update(): void;
    endFrame(): void;
    reset(): void;
    destroy(): void;
}

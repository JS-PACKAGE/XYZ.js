import { Vector2 } from '../../math/src/index.js';
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
    readonly position: Vector2;
    private readonly down;
    private readonly pressed;
    private readonly released;
    private readonly pointers;
    private hovered;
    constructor(canvas: HTMLCanvasElement, getSize: () => {
        width: number;
        height: number;
    });
    get active(): boolean;
    isDown(button: number): boolean;
    wasPressed(button: number): boolean;
    wasReleased(button: number): boolean;
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
    constructor(canvas: HTMLCanvasElement, getSize: () => {
        width: number;
        height: number;
    });
    update(): void;
    endFrame(): void;
    reset(): void;
    destroy(): void;
}

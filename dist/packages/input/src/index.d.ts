import { Vector2 } from '../../math/src/index.js';
export interface PointerSample {
    id: number;
    type: string;
    kind: 'move' | 'down' | 'up' | 'cancel' | 'leave';
    readonly position: Vector2;
    button: number;
    buttons: number;
    sequence: number;
    originalEvent?: PointerEvent;
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

import { Vector2 } from '../../math/src/index.js';
/** Top-left-origin world-to-screen camera in logical pixels. */
export declare class Camera2D {
    readonly position: Vector2;
    private currentZoom;
    private width;
    private height;
    get zoom(): number;
    set zoom(value: number);
    get viewportWidth(): number;
    get viewportHeight(): number;
    resize(width: number, height: number): void;
    worldToScreen(point: Vector2, out?: Vector2): Vector2;
    screenToWorld(point: Vector2, out?: Vector2): Vector2;
}

/** Named analog sources for canvas touch buttons and joysticks, within [-1, 1]. */
export declare class VirtualInput {
    private readonly controls;
    private destroyed;
    set(control: string, value: number): void;
    value(control: string): number;
    /** Neutralizes controls without losing release edges for the current frame. */
    reset(): void;
    /** @internal Preserves even a complete touch-button tap between updates. */
    wasPressed(control: string, direction: 1 | -1, threshold: number): boolean;
    /** @internal */
    wasReleased(control: string, direction: 1 | -1, threshold: number): boolean;
    /** @internal */
    endFrame(): void;
    /** @internal */
    destroy(): void;
}

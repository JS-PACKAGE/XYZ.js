import { ActionMap, GamepadState } from './gamepad.js';
import type { ActionBinding, ActionKeyboard, ActionSources, GamepadSnapshot } from './gamepad.js';
export interface InputContextOptions {
    readonly bindings?: Readonly<Record<string, readonly ActionBinding[]>>;
    readonly priority?: number;
    /** Reserves bound physical sources against lower contexts and legacy actions. */
    readonly consume?: boolean;
    /** Actual browser Gamepad.index, not the position in a compact snapshot array. */
    readonly gamepadIndex?: number;
}
/** An initially inactive, named layer of the InputManager's shared action stack. */
export declare class InputContext {
    readonly name: string;
    private readonly owner;
    private readonly defaultPad;
    private enabled;
    private destroyed;
    private readonly actionMap;
    private readonly routedPad;
    readonly priority: number;
    readonly consume: boolean;
    readonly gamepadIndex: number | undefined;
    /** @internal Created and owned by InputContexts. */
    constructor(name: string, owner: InputContexts, defaultPad: GamepadState, keyboard: ActionKeyboard, sources: ActionSources, options: InputContextOptions);
    get active(): boolean;
    activate(): void;
    deactivate(): void;
    destroy(): void;
    value(action: string): number;
    isDown(action: string): boolean;
    wasPressed(action: string): boolean;
    wasReleased(action: string): boolean;
    rebind(action: string, bindings: readonly ActionBinding[]): void;
    unbind(action: string): boolean;
    exportBindings(): Record<string, ActionBinding[]>;
    importBindings(bindings: Readonly<Record<string, readonly ActionBinding[]>>): void;
    /** @internal Each routed pad retains its own disconnect/release history. */
    poll(pads: ArrayLike<GamepadSnapshot | null>): void;
    /** @internal */
    update(consumed: ReadonlySet<string>, claimed: Set<string>, preserveEdges: boolean): void;
    /** @internal */
    updateInactive(): void;
    /** @internal */
    reset(): void;
    /** @internal */
    endFrame(): void;
    private assertAlive;
}
/** Priority-ordered contexts; the legacy InputManager.actions is always the bottom layer. */
export declare class InputContexts {
    private readonly legacy;
    private readonly gamepad;
    private readonly keyboard;
    private readonly sources;
    private readonly contexts;
    private readonly active;
    private readonly retired;
    private readonly consumed;
    private readonly claimed;
    private snapshot;
    private destroyed;
    /** @internal Constructed by InputManager. */
    constructor(legacy: ActionMap, gamepad: GamepadState, keyboard: ActionKeyboard, sources: ActionSources);
    create(name: string, options?: InputContextOptions): InputContext;
    /** @internal Inserting before equal priorities gives the newest activation precedence. */
    activate(context: InputContext): void;
    /** @internal */
    deactivate(context: InputContext): void;
    /** @internal */
    remove(context: InputContext): void;
    /** @internal Existing layers retain genuine new edges while consumed edges stay muted. */
    reconcile(): void;
    /** @internal */
    update(pads: ArrayLike<GamepadSnapshot | null>): void;
    /** @internal */
    reset(): void;
    /** @internal */
    endFrame(): void;
    /** @internal */
    destroy(): void;
    private route;
}

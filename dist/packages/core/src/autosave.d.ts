import type { JsonValue, SaveManager, SaveRecord } from './storage.js';
export type AutosaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error' | 'cancelled' | 'destroyed';
export interface AutosaveState {
    readonly status: AutosaveStatus;
    readonly pendingChanges: boolean;
    readonly revision: number | null;
    readonly error: unknown | null;
    readonly retryRequired: boolean;
}
export interface AutosaveOptions {
    readonly slot: string;
    /** Capture synchronously so a snapshot cannot cross a scene publication barrier. */
    readonly capture: () => JsonValue;
    readonly playTime?: () => number;
    readonly intervalMs?: number;
    readonly signal?: AbortSignal;
    readonly onState?: (state: AutosaveState) => void;
}
/** Opt-in autosave. Failed attempts stop scheduling until the player explicitly retries.
 * `change` is a CustomEvent<AutosaveState>; state can drive both visible UI and live regions. */
export declare class AutosaveController extends EventTarget {
    private readonly saves;
    private readonly options;
    private current;
    private readonly intervalMs;
    private timer?;
    private generation;
    private savedGeneration;
    private epoch;
    private disposed;
    private active?;
    private controller?;
    private drain;
    private readonly ownerAbort;
    private readonly notify?;
    constructor(saves: SaveManager, options: AutosaveOptions);
    get state(): AutosaveState;
    private publish;
    private assertAlive;
    private schedule;
    /** Mark changed player state; a failure remains visible even when further edits arrive. */
    request(): void;
    /** Wait until changes requested before/during this flush are durably acknowledged. */
    flush(): Promise<SaveRecord | null>;
    /** Explicit player/application action; stale errors still require reloading/resolving the conflict. */
    retry(): Promise<SaveRecord | null>;
    private run;
    /** Cancels queued/precommit work; an already committed write is not rolled back. */
    cancel(): void;
    destroy(): void;
}

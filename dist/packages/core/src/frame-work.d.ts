/** CPU wall-time attribution. The target is observational, not a preemptive deadline. */
export interface FrameWorkStats {
    readonly enabled: boolean;
    readonly frame: number;
    readonly budgetMs: number | null;
    readonly totalMs: number;
    readonly simulationMs: number;
    readonly navigationMs: number;
    readonly afterUpdateMs: number;
    readonly renderSubmitMs: number;
    readonly overBudget: boolean;
    readonly navigationWork: number;
    readonly navigationExpansions: number;
    readonly navigationBakeWork: number;
}
/** @internal One record per Game; no per-frame objects or timestamps when disabled. */
export declare class FrameWorkCounter implements FrameWorkStats {
    frame: number;
    budgetMs: number | null;
    totalMs: number;
    simulationMs: number;
    navigationMs: number;
    afterUpdateMs: number;
    renderSubmitMs: number;
    overBudget: boolean;
    navigationWork: number;
    navigationExpansions: number;
    navigationBakeWork: number;
    private startedAt;
    get enabled(): boolean;
    begin(frame: number): void;
    finish(): void;
}

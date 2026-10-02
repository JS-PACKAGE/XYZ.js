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
export class FrameWorkCounter implements FrameWorkStats {
  frame = 0;
  budgetMs: number | null = null;
  totalMs = 0;
  simulationMs = 0;
  navigationMs = 0;
  afterUpdateMs = 0;
  renderSubmitMs = 0;
  overBudget = false;
  navigationWork = 0;
  navigationExpansions = 0;
  navigationBakeWork = 0;
  private startedAt = 0;
  get enabled(): boolean {
    return this.budgetMs !== null;
  }
  begin(frame: number): void {
    this.frame = frame;
    this.totalMs =
      this.simulationMs =
      this.navigationMs =
      this.afterUpdateMs =
      this.renderSubmitMs =
        0;
    this.navigationWork =
      this.navigationExpansions =
      this.navigationBakeWork =
        0;
    this.overBudget = false;
    if (this.enabled) this.startedAt = performance.now();
  }
  finish(): void {
    if (!this.enabled) return;
    this.totalMs = performance.now() - this.startedAt;
    this.overBudget = this.totalMs > this.budgetMs!;
  }
}

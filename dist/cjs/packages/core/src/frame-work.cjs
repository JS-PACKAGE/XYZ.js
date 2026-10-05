//#region dist/packages/core/src/frame-work.js
var FrameWorkCounter = class {
	frame = 0;
	budgetMs = null;
	totalMs = 0;
	simulationMs = 0;
	navigationMs = 0;
	afterUpdateMs = 0;
	renderSubmitMs = 0;
	overBudget = !1;
	navigationWork = 0;
	navigationExpansions = 0;
	navigationBakeWork = 0;
	startedAt = 0;
	get enabled() {
		return this.budgetMs !== null;
	}
	begin(e) {
		this.frame = e, this.totalMs = this.simulationMs = this.navigationMs = this.afterUpdateMs = this.renderSubmitMs = 0, this.navigationWork = this.navigationExpansions = this.navigationBakeWork = 0, this.overBudget = !1, this.enabled && (this.startedAt = performance.now());
	}
	finish() {
		this.enabled && (this.totalMs = performance.now() - this.startedAt, this.overBudget = this.totalMs > this.budgetMs);
	}
};
//#endregion
exports.FrameWorkCounter = FrameWorkCounter;

//# sourceMappingURL=frame-work.cjs.map
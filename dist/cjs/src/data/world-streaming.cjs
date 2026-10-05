//#region dist/src/data/world-streaming.js
var worldStreamingLimits = Object.freeze({
	cells: 4096,
	idLength: 48,
	activeCells: 16,
	pendingLoads: 4,
	residentCells: 24,
	admissionsPerFrame: 2,
	ownedNodesPerCell: 4096,
	coordinateExtent: 1e9,
	defaultPrefetchDistance: 16,
	defaultRetireDistance: 24,
	seamTolerance: .001
});
//#endregion
exports.worldStreamingLimits = worldStreamingLimits;

//# sourceMappingURL=world-streaming.cjs.map
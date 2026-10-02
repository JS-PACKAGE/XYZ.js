export const worldStreamingLimits = Object.freeze({
  cells: 4_096,
  idLength: 48,
  activeCells: 16,
  pendingLoads: 4,
  residentCells: 24,
  admissionsPerFrame: 2,
  ownedNodesPerCell: 4_096,
  coordinateExtent: 1_000_000_000,
  defaultPrefetchDistance: 16,
  defaultRetireDistance: 24,
  seamTolerance: 0.001,
});

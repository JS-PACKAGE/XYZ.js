export const world2dLimits = Object.freeze({
  polygonVertices: 32,
  geometryExtent: 1_000_000,
  mapCells: 65_536,
  particles: 16_384,
  physicsBodies: 16_384,
  maxSubSteps: 120,
  solverIterations: 64,
});

export const physicsDefaults = Object.freeze({
  fixedDelta: 1 / 120,
  maxSubSteps: 12,
  velocityIterations: 8,
  positionIterations: 3,
  gravityY: 980,
  penetrationSlop: 0.005,
  positionCorrection: 0.6,
  restitutionThreshold: 1,
  geometryEpsilon: 1e-8,
  sleepLinearVelocity: 0.1,
  sleepAngularVelocity: 0.05,
  sleepTime: 0.5,
});

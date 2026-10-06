export const vegetationDefaults = {
  windAmplitude: 0.15,
  windFrequency: 2,
  bladeHeight: 1,
  phaseScale: 3,
  seed: 1,
  tileSize: 16,
  batchSize: 1024,
  fadeStart: 80,
  fadeEnd: 100,
} as const;

export const vegetationLimits = {
  candidates: 1000000,
  grassSegments: 1024,
} as const;

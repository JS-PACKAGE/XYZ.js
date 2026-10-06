export const water3DDefaults = {
  width: 10,
  depth: 10,
  segments: 64,
  maxSegments: 512,
  maxWaves: 8,
  minimumLength: 0.0001,
  maximumLength: 1e6,
  maximumAmplitude: 1e6,
  maximumSpeed: 1e4,
  boundsMargin: 1e-6,
  foamThresholdFraction: 0.6,
  foamFadeFraction: 0.3,
  color: [0.12, 0.35, 0.4] as [number, number, number],
  roughness: 0.08,
  ior: 1.333,
  transmission: 0.85,
  thickness: 0.5,
  attenuationColor: [0.55, 0.85, 0.9] as [number, number, number],
  attenuationDistance: 5,
};

export const water3DWaves = [
  { direction: [1, 0.3] as const, amplitude: 0.12, wavelength: 4, speed: 1.1 },
  {
    direction: [-0.4, 1] as const,
    amplitude: 0.06,
    wavelength: 2.3,
    speed: -1.4,
  },
] as const;

export const water3DNormalWaves = [
  {
    direction: [0.7, 1] as const,
    amplitude: 0.012,
    wavelength: 0.45,
    speed: 2.1,
  },
  {
    direction: [-1, 0.2] as const,
    amplitude: 0.008,
    wavelength: 0.3,
    speed: -2.7,
  },
] as const;

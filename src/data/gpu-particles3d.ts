/** Admission and native-buffer limits; not a claimed device performance budget. */
export const gpuParticles3DLimits = Object.freeze({
  maxCapacity: 65_536,
  maxRate: 1_000_000,
  maxLifetime: 3_600,
  maxMagnitude: 1_000_000,
  clockEpochSeconds: 1_024,
});

export const GPU_PARTICLE_COMMAND_FLOATS = 20;
export const GPU_PARTICLE_UNIFORM_FLOATS = 68;

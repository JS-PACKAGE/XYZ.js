/** Admission and native-buffer limits; not a claimed device performance budget. */
export declare const gpuParticles3DLimits: Readonly<{
    maxCapacity: 65536;
    maxRate: 1000000;
    maxLifetime: 3600;
    maxMagnitude: 1000000;
    clockEpochSeconds: 1024;
}>;
export declare const GPU_PARTICLE_COMMAND_FLOATS = 20;
export declare const GPU_PARTICLE_UNIFORM_FLOATS = 68;

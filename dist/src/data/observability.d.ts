/** Opt-in query pools stay bounded even when the GPU/readback falls behind. */
export declare const gpuTimingDefaults: Readonly<{
    maxInFlight: 4;
    maxInFlightLimit: 32;
    maxTimedPasses: 128;
    warmupFrames: 120;
    sampleInterval: 1;
}>;
/** Plateau classification needs sustained, meaningful growth, not a positive slope. */
export declare const measurementDefaults: Readonly<{
    tailSamples: 32;
    minimumTrendSamples: 12;
    minimumTrendSeconds: 60;
    plateauAbsoluteBytes: number;
    plateauRelativeFraction: 0.05;
    growthBytesPerMinute: number;
    memorySampleSeconds: 5;
    longDurationSeconds: 3600;
    longTaskMilliseconds: 50;
    traceBufferKiB: 8192;
}>;
/** These emulate CPU/network pressure; none represents certification on low-tier hardware. */
export declare const soakProfiles: Readonly<{
    native: {
        cpuRate: number;
        latencyMs: number;
        downloadBytesPerSecond: number;
        uploadBytesPerSecond: number;
    };
    'simulated-low-tier': {
        cpuRate: number;
        latencyMs: number;
        downloadBytesPerSecond: number;
        uploadBytesPerSecond: number;
    };
    'simulated-low-tier-heavy': {
        cpuRate: number;
        latencyMs: number;
        downloadBytesPerSecond: number;
        uploadBytesPerSecond: number;
    };
}>;
export declare const soakWorkload: Readonly<{
    navigationWorkBudget: 512;
    navigationConcurrentSearches: 4;
    routeIntervalSeconds: 2;
    gpuPhaseHistoryFrames: 256;
    networkPayloadBytes: 65536;
    bakeColumns: 16;
    bakeRows: 16;
    bakeCellSize: 20;
}>;
/** Reproducible authored workloads, not universal hardware/FPS promises. */
export declare const productionWorkload: Readonly<{
    width: 1280;
    height: 720;
    pixelRatio: 1;
    warmupFrames: 120;
    measuredFrames: 600;
    loadStageFrames: 180;
    textures: 8;
    sprites2D: 768;
    transparentSprites2D: 128;
    meshes3D: 256;
    transparentMeshes3D: 64;
    pointLights: 8;
    spotLights: 4;
    overlaySprites3D: 64;
    hitchMilliseconds: 50;
}>;

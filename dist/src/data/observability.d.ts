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
/** Authored quality tiers; changing tier changes workload, not measured device identity. */
export declare const productionQualityProfiles: Readonly<{
    baseline: Readonly<{
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
    low: Readonly<{
        width: 960;
        height: 540;
        sprites2D: 384;
        transparentSprites2D: 64;
        meshes3D: 128;
        transparentMeshes3D: 32;
        pointLights: 4;
        spotLights: 2;
        overlaySprites3D: 32;
        pixelRatio: 1;
        warmupFrames: 120;
        measuredFrames: 600;
        loadStageFrames: 180;
        textures: 8;
        hitchMilliseconds: 50;
    }>;
    high: Readonly<{
        width: 1920;
        height: 1080;
        sprites2D: 1536;
        transparentSprites2D: 256;
        meshes3D: 512;
        transparentMeshes3D: 128;
        pointLights: 16;
        spotLights: 8;
        overlaySprites3D: 128;
        pixelRatio: 1;
        warmupFrames: 120;
        measuredFrames: 600;
        loadStageFrames: 180;
        textures: 8;
        hitchMilliseconds: 50;
    }>;
}>;
/** Revision changes invalidate pinned profiles when authored work or phase semantics change. */
export declare const productionRegressionWorkload: Readonly<{
    revision: 4;
    denseColliders: 96;
    denseRadius: 32;
    navigationColumns: 48;
    navigationRows: 48;
    navigationConcurrentSearches: 8;
    navigationWorkBudget: 512;
    visibleMeshes: 256;
    invisibleMeshes: 4096;
    mutationIntervalFrames: 60;
    maximumWallSeconds: 300;
    minimumSteadySeconds: 5;
    minimumLoadingSeconds: 2;
    teardownMaximumMs: 5000;
}>;
/** Calibration margins are explicit policy, never silently adapted by a failing gate. */
export declare const productionCalibrationDefaults: Readonly<{
    minimumRuns: 3;
    defaultRuns: 5;
    maximumRuns: 20;
    relativeMargin: 0.25;
    absoluteMarginMs: 2;
    hitchFractionMargin: 0.02;
}>;

export declare const water3DDefaults: {
    width: number;
    depth: number;
    segments: number;
    maxSegments: number;
    maxWaves: number;
    minimumLength: number;
    maximumLength: number;
    maximumAmplitude: number;
    maximumSpeed: number;
    boundsMargin: number;
    foamThresholdFraction: number;
    foamFadeFraction: number;
    color: [number, number, number];
    roughness: number;
    ior: number;
    transmission: number;
    thickness: number;
    attenuationColor: [number, number, number];
    attenuationDistance: number;
};
export declare const water3DWaves: readonly [{
    readonly direction: readonly [1, 0.3];
    readonly amplitude: 0.12;
    readonly wavelength: 4;
    readonly speed: 1.1;
}, {
    readonly direction: readonly [-0.4, 1];
    readonly amplitude: 0.06;
    readonly wavelength: 2.3;
    readonly speed: -1.4;
}];
export declare const water3DNormalWaves: readonly [{
    readonly direction: readonly [0.7, 1];
    readonly amplitude: 0.012;
    readonly wavelength: 0.45;
    readonly speed: 2.1;
}, {
    readonly direction: readonly [-1, 0.2];
    readonly amplitude: 0.008;
    readonly wavelength: 0.3;
    readonly speed: -2.7;
}];

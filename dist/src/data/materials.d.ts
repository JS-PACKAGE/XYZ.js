export declare const proceduralMaterialLimits: Readonly<{
    minSize: 32;
    maxSize: 1024;
    defaultSize: 256;
    defaultSeed: 1;
}>;
/** Base colors are authored in sRGB; relief is measured in UV units. */
export declare const proceduralMaterialPresets: Readonly<{
    wood: Readonly<{
        dark: readonly [65, 30, 13];
        light: readonly [188, 120, 57];
        roughness: 0.62;
        relief: 0.012;
    }>;
    brick: Readonly<{
        dark: readonly [109, 43, 29];
        light: readonly [195, 98, 65];
        roughness: 0.87;
        relief: 0.025;
    }>;
    stone: Readonly<{
        dark: readonly [66, 72, 73];
        light: readonly [169, 173, 164];
        roughness: 0.88;
        relief: 0.035;
    }>;
    metal: Readonly<{
        dark: readonly [96, 110, 120];
        light: readonly [192, 201, 208];
        roughness: 0.3;
        relief: 0.002;
    }>;
    fabric: Readonly<{
        dark: readonly [23, 46, 69];
        light: readonly [93, 136, 163];
        roughness: 0.93;
        relief: 0.006;
    }>;
    marble: Readonly<{
        dark: readonly [58, 70, 82];
        light: readonly [232, 231, 217];
        roughness: 0.23;
        relief: 0.003;
    }>;
    concrete: Readonly<{
        dark: readonly [78, 80, 82];
        light: readonly [176, 176, 170];
        roughness: 0.78;
        relief: 0.008;
    }>;
    tiles: Readonly<{
        dark: readonly [168, 92, 58];
        light: readonly [236, 214, 186];
        roughness: 0.16;
        relief: 0.012;
    }>;
    leather: Readonly<{
        dark: readonly [62, 28, 16];
        light: readonly [154, 86, 48];
        roughness: 0.55;
        relief: 0.004;
    }>;
    sand: Readonly<{
        dark: readonly [166, 132, 78];
        light: readonly [232, 208, 150];
        roughness: 0.92;
        relief: 0.006;
    }>;
    rust: Readonly<{
        dark: readonly [42, 36, 32];
        light: readonly [176, 72, 28];
        roughness: 0.72;
        relief: 0.015;
    }>;
    snow: Readonly<{
        dark: readonly [186, 198, 208];
        light: readonly [248, 250, 252];
        roughness: 0.28;
        relief: 0.01;
    }>;
}>;
/** One generated UV tile covers this many meters at repeats = 1. */
export declare const proceduralTileMeters: Readonly<{
    wood: 0.2;
    brick: 0.24;
    stone: 0.5;
    metal: 0.15;
    fabric: 0.08;
    marble: 0.6;
    concrete: 0.8;
    tiles: 0.3;
    leather: 0.12;
    sand: 0.4;
    rust: 0.2;
    snow: 1;
}>;
/** Preserve the published normalized finish thickness; native packing uses nanometers. */
export declare const iridescenceFilmRange: Readonly<{
    minNm: 100;
    maxNm: 800;
}>;

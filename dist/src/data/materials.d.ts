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
}>;

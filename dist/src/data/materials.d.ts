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
    asphalt: Readonly<{
        dark: readonly [22, 25, 27];
        light: readonly [115, 117, 112];
        roughness: 0.88;
        relief: 0.003;
    }>;
    gravel: Readonly<{
        dark: readonly [38, 34, 29];
        light: readonly [185, 173, 148];
        roughness: 0.82;
        relief: 0.025;
    }>;
    cobblestone: Readonly<{
        dark: readonly [43, 46, 44];
        light: readonly [173, 174, 160];
        roughness: 0.79;
        relief: 0.022;
    }>;
    bark: Readonly<{
        dark: readonly [29, 19, 13];
        light: readonly [151, 111, 69];
        roughness: 0.9;
        relief: 0.025;
    }>;
    moss: Readonly<{
        dark: readonly [17, 34, 10];
        light: readonly [123, 153, 48];
        roughness: 0.92;
        relief: 0.018;
    }>;
    mud: Readonly<{
        dark: readonly [34, 24, 16];
        light: readonly [144, 110, 70];
        roughness: 0.84;
        relief: 0.012;
    }>;
    granite: Readonly<{
        dark: readonly [30, 29, 28];
        light: readonly [229, 220, 205];
        roughness: 0.36;
        relief: 0.0015;
    }>;
    slate: Readonly<{
        dark: readonly [24, 34, 43];
        light: readonly [99, 119, 132];
        roughness: 0.8;
        relief: 0.012;
    }>;
    terrazzo: Readonly<{
        dark: readonly [46, 43, 39];
        light: readonly [235, 228, 211];
        roughness: 0.22;
        relief: 0.0008;
    }>;
    denim: Readonly<{
        dark: readonly [13, 28, 54];
        light: readonly [148, 171, 192];
        roughness: 0.88;
        relief: 0.0035;
    }>;
    burlap: Readonly<{
        dark: readonly [48, 33, 18];
        light: readonly [204, 173, 119];
        roughness: 0.94;
        relief: 0.012;
    }>;
    carpet: Readonly<{
        dark: readonly [48, 25, 24];
        light: readonly [174, 91, 75];
        roughness: 0.96;
        relief: 0.016;
    }>;
    plaster: Readonly<{
        dark: readonly [167, 158, 142];
        light: readonly [247, 243, 231];
        roughness: 0.85;
        relief: 0.003;
    }>;
    terracotta: Readonly<{
        dark: readonly [102, 36, 21];
        light: readonly [206, 116, 72];
        roughness: 0.86;
        relief: 0.006;
    }>;
    cork: Readonly<{
        dark: readonly [53, 30, 13];
        light: readonly [206, 158, 91];
        roughness: 0.92;
        relief: 0.008;
    }>;
    rubber: Readonly<{
        dark: readonly [13, 15, 16];
        light: readonly [66, 70, 72];
        roughness: 0.82;
        relief: 0.0015;
    }>;
    carbonfiber: Readonly<{
        dark: readonly [8, 10, 12];
        light: readonly [67, 72, 78];
        roughness: 0.3;
        relief: 0.0012;
    }>;
    diamondplate: Readonly<{
        dark: readonly [102, 111, 119];
        light: readonly [222, 228, 233];
        roughness: 0.36;
        relief: 0.012;
    }>;
    paper: Readonly<{
        dark: readonly [185, 174, 150];
        light: readonly [255, 251, 236];
        roughness: 0.91;
        relief: 0.0015;
    }>;
    wicker: Readonly<{
        dark: readonly [48, 28, 12];
        light: readonly [215, 173, 111];
        roughness: 0.68;
        relief: 0.018;
    }>;
    bamboo: Readonly<{
        dark: readonly [99, 65, 20];
        light: readonly [229, 194, 105];
        roughness: 0.48;
        relief: 0.003;
    }>;
    hammeredmetal: Readonly<{
        dark: readonly [117, 51, 26];
        light: readonly [239, 167, 105];
        roughness: 0.3;
        relief: 0.009;
    }>;
    galvanized: Readonly<{
        dark: readonly [103, 119, 133];
        light: readonly [229, 236, 240];
        roughness: 0.34;
        relief: 0.001;
    }>;
    corrugatedmetal: Readonly<{
        dark: readonly [110, 124, 135];
        light: readonly [224, 232, 238];
        roughness: 0.29;
        relief: 0.025;
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
    asphalt: 0.8;
    gravel: 0.48;
    cobblestone: 1.2;
    bark: 0.5;
    moss: 0.3;
    mud: 0.6;
    granite: 0.24;
    slate: 0.6;
    terrazzo: 0.6;
    denim: 0.024;
    burlap: 0.04;
    carpet: 0.072;
    plaster: 0.8;
    terracotta: 0.36;
    cork: 0.16;
    rubber: 0.12;
    carbonfiber: 0.048;
    diamondplate: 0.4;
    paper: 0.12;
    wicker: 0.18;
    bamboo: 0.6;
    hammeredmetal: 0.24;
    galvanized: 0.36;
    corrugatedmetal: 1.2;
}>;
/** Preserve the published normalized finish thickness; native packing uses nanometers. */
export declare const iridescenceFilmRange: Readonly<{
    minNm: 100;
    maxNm: 800;
}>;

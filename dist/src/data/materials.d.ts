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
    sandstone: Readonly<{
        dark: readonly [133, 83, 43];
        light: readonly [238, 205, 150];
        roughness: 0.85;
        relief: 0.006;
    }>;
    travertine: Readonly<{
        dark: readonly [139, 116, 81];
        light: readonly [247, 235, 205];
        roughness: 0.72;
        relief: 0.009;
    }>;
    pumice: Readonly<{
        dark: readonly [101, 104, 101];
        light: readonly [227, 229, 222];
        roughness: 0.88;
        relief: 0.012;
    }>;
    parquet: Readonly<{
        dark: readonly [48, 22, 9];
        light: readonly [207, 149, 78];
        roughness: 0.42;
        relief: 0.004;
    }>;
    mosaic: Readonly<{
        dark: readonly [15, 68, 77];
        light: readonly [151, 218, 203];
        roughness: 0.18;
        relief: 0.003;
    }>;
    hexagontiles: Readonly<{
        dark: readonly [123, 135, 145];
        light: readonly [244, 240, 225];
        roughness: 0.24;
        relief: 0.004;
    }>;
    knit: Readonly<{
        dark: readonly [58, 45, 63];
        light: readonly [156, 127, 158];
        roughness: 0.91;
        relief: 0.008;
    }>;
    corduroy: Readonly<{
        dark: readonly [49, 29, 16];
        light: readonly [157, 111, 68];
        roughness: 0.9;
        relief: 0.007;
    }>;
    felt: Readonly<{
        dark: readonly [49, 65, 62];
        light: readonly [128, 149, 140];
        roughness: 0.94;
        relief: 0.002;
    }>;
    roofshingles: Readonly<{
        dark: readonly [24, 27, 29];
        light: readonly [105, 108, 104];
        roughness: 0.87;
        relief: 0.018;
    }>;
    rooftiles: Readonly<{
        dark: readonly [102, 37, 22];
        light: readonly [211, 115, 66];
        roughness: 0.72;
        relief: 0.055;
    }>;
    stucco: Readonly<{
        dark: readonly [174, 162, 139];
        light: readonly [244, 235, 214];
        roughness: 0.9;
        relief: 0.018;
    }>;
    lichen: Readonly<{
        dark: readonly [83, 87, 76];
        light: readonly [209, 214, 148];
        roughness: 0.92;
        relief: 0.004;
    }>;
    leaflitter: Readonly<{
        dark: readonly [42, 27, 17];
        light: readonly [177, 119, 58];
        roughness: 0.88;
        relief: 0.012;
    }>;
    endgrain: Readonly<{
        dark: readonly [82, 43, 20];
        light: readonly [207, 163, 99];
        roughness: 0.72;
        relief: 0.005;
    }>;
    acousticfoam: Readonly<{
        dark: readonly [12, 14, 16];
        light: readonly [91, 96, 101];
        roughness: 0.94;
        relief: 0.065;
    }>;
    closedcellfoam: Readonly<{
        dark: readonly [57, 78, 91];
        light: readonly [153, 176, 187];
        roughness: 0.86;
        relief: 0.0018;
    }>;
    linoleum: Readonly<{
        dark: readonly [48, 80, 70];
        light: readonly [158, 176, 133];
        roughness: 0.54;
        relief: 0.0008;
    }>;
    suede: Readonly<{
        dark: readonly [102, 64, 34];
        light: readonly [207, 165, 111];
        roughness: 0.91;
        relief: 0.0007;
    }>;
    snakeskin: Readonly<{
        dark: readonly [42, 39, 19];
        light: readonly [147, 139, 78];
        roughness: 0.57;
        relief: 0.0024;
    }>;
    crocodile: Readonly<{
        dark: readonly [28, 17, 11];
        light: readonly [114, 76, 43];
        roughness: 0.62;
        relief: 0.0045;
    }>;
    herringbone: Readonly<{
        dark: readonly [71, 61, 50];
        light: readonly [182, 174, 157];
        roughness: 0.89;
        relief: 0.0007;
    }>;
    tweed: Readonly<{
        dark: readonly [52, 39, 25];
        light: readonly [165, 161, 105];
        roughness: 0.93;
        relief: 0.0012;
    }>;
    seersucker: Readonly<{
        dark: readonly [137, 170, 194];
        light: readonly [243, 239, 222];
        roughness: 0.86;
        relief: 0.0015;
    }>;
    knurledmetal: Readonly<{
        dark: readonly [104, 112, 120];
        light: readonly [223, 229, 234];
        roughness: 0.39;
        relief: 0.0024;
    }>;
    engineturned: Readonly<{
        dark: readonly [118, 125, 132];
        light: readonly [232, 236, 239];
        roughness: 0.31;
        relief: 0.00045;
    }>;
    goldleaf: Readonly<{
        dark: readonly [163, 100, 18];
        light: readonly [255, 221, 112];
        roughness: 0.32;
        relief: 0.0007;
    }>;
    orangepeel: Readonly<{
        dark: readonly [205, 68, 3];
        light: readonly [255, 159, 19];
        roughness: 0.43;
        relief: 0.0025;
    }>;
    coconut: Readonly<{
        dark: readonly [53, 27, 12];
        light: readonly [166, 114, 61];
        roughness: 0.91;
        relief: 0.003;
    }>;
    watermelon: Readonly<{
        dark: readonly [17, 49, 17];
        light: readonly [133, 166, 57];
        roughness: 0.36;
        relief: 0.0006;
    }>;
    limestone: Readonly<{
        dark: readonly [151, 137, 112];
        light: readonly [246, 237, 211];
        roughness: 0.76;
        relief: 0.0014;
    }>;
    breccia: Readonly<{
        dark: readonly [89, 61, 48];
        light: readonly [202, 193, 175];
        roughness: 0.68;
        relief: 0.003;
    }>;
    gneiss: Readonly<{
        dark: readonly [48, 51, 53];
        light: readonly [224, 220, 201];
        roughness: 0.57;
        relief: 0.0015;
    }>;
    plywood: Readonly<{
        dark: readonly [105, 54, 24];
        light: readonly [233, 193, 130];
        roughness: 0.57;
        relief: 0.0007;
    }>;
    osb: Readonly<{
        dark: readonly [90, 54, 24];
        light: readonly [226, 191, 124];
        roughness: 0.81;
        relief: 0.0022;
    }>;
    chipboard: Readonly<{
        dark: readonly [95, 67, 35];
        light: readonly [212, 181, 127];
        roughness: 0.84;
        relief: 0.001;
    }>;
    wafflecloth: Readonly<{
        dark: readonly [153, 143, 124];
        light: readonly [247, 240, 219];
        roughness: 0.91;
        relief: 0.0018;
    }>;
    cableknit: Readonly<{
        dark: readonly [106, 70, 44];
        light: readonly [223, 192, 145];
        roughness: 0.94;
        relief: 0.004;
    }>;
    quilting: Readonly<{
        dark: readonly [36, 57, 77];
        light: readonly [137, 167, 188];
        roughness: 0.88;
        relief: 0.006;
    }>;
    crackleglaze: Readonly<{
        dark: readonly [56, 79, 67];
        light: readonly [214, 232, 210];
        roughness: 0.19;
        relief: 0.003;
    }>;
    flutedceramic: Readonly<{
        dark: readonly [166, 145, 112];
        light: readonly [250, 243, 222];
        roughness: 0.24;
        relief: 0.009;
    }>;
    encaustictiles: Readonly<{
        dark: readonly [63, 103, 133];
        light: readonly [239, 230, 204];
        roughness: 0.64;
        relief: 0.003;
    }>;
    fishscales: Readonly<{
        dark: readonly [22, 48, 56];
        light: readonly [133, 173, 174];
        roughness: 0.42;
        relief: 0.0016;
    }>;
    tortoiseshell: Readonly<{
        dark: readonly [31, 19, 12];
        light: readonly [186, 126, 53];
        roughness: 0.48;
        relief: 0.004;
    }>;
    feathers: Readonly<{
        dark: readonly [52, 45, 39];
        light: readonly [178, 164, 143];
        roughness: 0.86;
        relief: 0.0018;
    }>;
    reedmat: Readonly<{
        dark: readonly [83, 79, 39];
        light: readonly [232, 218, 153];
        roughness: 0.77;
        relief: 0.0024;
    }>;
    rope: Readonly<{
        dark: readonly [87, 55, 29];
        light: readonly [224, 188, 130];
        roughness: 0.88;
        relief: 0.004;
    }>;
    straw: Readonly<{
        dark: readonly [83, 55, 18];
        light: readonly [239, 207, 113];
        roughness: 0.9;
        relief: 0.006;
    }>;
    studdedrubber: Readonly<{
        dark: readonly [12, 15, 17];
        light: readonly [55, 61, 65];
        roughness: 0.83;
        relief: 0.003;
    }>;
    groovedrubber: Readonly<{
        dark: readonly [15, 18, 20];
        light: readonly [64, 70, 74];
        roughness: 0.81;
        relief: 0.0024;
    }>;
    recycledrubber: Readonly<{
        dark: readonly [12, 16, 20];
        light: readonly [110, 129, 145];
        roughness: 0.91;
        relief: 0.0008;
    }>;
    breadcrust: Readonly<{
        dark: readonly [49, 20, 8];
        light: readonly [224, 159, 69];
        roughness: 0.84;
        relief: 0.004;
    }>;
    wafer: Readonly<{
        dark: readonly [123, 65, 22];
        light: readonly [242, 205, 133];
        roughness: 0.79;
        relief: 0.0016;
    }>;
    chocolate: Readonly<{
        dark: readonly [24, 10, 6];
        light: readonly [91, 44, 25];
        roughness: 0.28;
        relief: 0.003;
    }>;
    basketball: Readonly<{
        dark: readonly [23, 16, 12];
        light: readonly [239, 113, 33];
        roughness: 0.79;
        relief: 0.0018;
    }>;
    tennisball: Readonly<{
        dark: readonly [153, 190, 15];
        light: readonly [249, 251, 217];
        roughness: 0.94;
        relief: 0.0006;
    }>;
    golfball: Readonly<{
        dark: readonly [191, 197, 201];
        light: readonly [255, 255, 253];
        roughness: 0.18;
        relief: 0.0012;
    }>;
    boardformedconcrete: Readonly<{
        dark: readonly [91, 94, 93];
        light: readonly [187, 188, 180];
        roughness: 0.86;
        relief: 0.003;
    }>;
    ribbedconcrete: Readonly<{
        dark: readonly [89, 92, 91];
        light: readonly [190, 191, 184];
        roughness: 0.83;
        relief: 0.018;
    }>;
    splitfaceblock: Readonly<{
        dark: readonly [84, 82, 76];
        light: readonly [198, 193, 177];
        roughness: 0.94;
        relief: 0.012;
    }>;
    chainmail: Readonly<{
        dark: readonly [17, 21, 25];
        light: readonly [195, 202, 210];
        roughness: 0.36;
        relief: 0.009;
    }>;
    rivetedmetal: Readonly<{
        dark: readonly [62, 70, 76];
        light: readonly [174, 184, 192];
        roughness: 0.43;
        relief: 0.008;
    }>;
    weldedmetal: Readonly<{
        dark: readonly [65, 69, 73];
        light: readonly [182, 187, 193];
        roughness: 0.39;
        relief: 0.006;
    }>;
    cactus: Readonly<{
        dark: readonly [24, 65, 31];
        light: readonly [121, 165, 73];
        roughness: 0.57;
        relief: 0.008;
    }>;
    pinecone: Readonly<{
        dark: readonly [47, 25, 13];
        light: readonly [174, 125, 73];
        roughness: 0.86;
        relief: 0.012;
    }>;
    corncob: Readonly<{
        dark: readonly [156, 89, 9];
        light: readonly [255, 224, 87];
        roughness: 0.38;
        relief: 0.004;
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
    sandstone: 0.6;
    travertine: 0.48;
    pumice: 0.18;
    parquet: 0.8;
    mosaic: 0.24;
    hexagontiles: 0.6;
    knit: 0.064;
    corduroy: 0.048;
    felt: 0.1;
    roofshingles: 1.2;
    rooftiles: 1.8;
    stucco: 0.6;
    lichen: 0.28;
    leaflitter: 0.72;
    endgrain: 0.3;
    acousticfoam: 0.6;
    closedcellfoam: 0.084;
    linoleum: 0.6;
    suede: 0.12;
    snakeskin: 0.16;
    crocodile: 0.24;
    herringbone: 0.048;
    tweed: 0.06;
    seersucker: 0.096;
    knurledmetal: 0.048;
    engineturned: 0.12;
    goldleaf: 0.36;
    orangepeel: 0.048;
    coconut: 0.12;
    watermelon: 0.24;
    limestone: 0.12;
    breccia: 0.6;
    gneiss: 0.6;
    plywood: 0.72;
    osb: 0.72;
    chipboard: 0.24;
    wafflecloth: 0.096;
    cableknit: 0.16;
    quilting: 0.48;
    crackleglaze: 0.16;
    flutedceramic: 0.24;
    encaustictiles: 0.8;
    fishscales: 0.12;
    tortoiseshell: 0.3;
    feathers: 0.16;
    reedmat: 0.24;
    rope: 0.18;
    straw: 0.4;
    studdedrubber: 0.3;
    groovedrubber: 0.24;
    recycledrubber: 0.24;
    breadcrust: 0.21;
    wafer: 0.072;
    chocolate: 0.12;
    basketball: 0.24;
    tennisball: 0.12;
    golfball: 0.045;
    boardformedconcrete: 1.6;
    ribbedconcrete: 1.2;
    splitfaceblock: 1.6;
    chainmail: 0.12;
    rivetedmetal: 1.2;
    weldedmetal: 0.6;
    cactus: 0.32;
    pinecone: 0.16;
    corncob: 0.12;
}>;
/** Preserve the published normalized finish thickness; native packing uses nanometers. */
export declare const iridescenceFilmRange: Readonly<{
    minNm: 100;
    maxNm: 800;
}>;

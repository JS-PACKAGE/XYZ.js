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
    corrugatedcardboard: Readonly<{
        dark: readonly [91, 55, 27];
        light: readonly [202, 161, 103];
        roughness: 0.94;
        relief: 0.006;
    }>;
    creasedpaper: Readonly<{
        dark: readonly [169, 157, 133];
        light: readonly [252, 246, 224];
        roughness: 0.9;
        relief: 0.0025;
    }>;
    layeredpaper: Readonly<{
        dark: readonly [139, 121, 91];
        light: readonly [242, 226, 192];
        roughness: 0.93;
        relief: 0.003;
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
    perforatedmetal: Readonly<{
        dark: readonly [62, 68, 74];
        light: readonly [202, 210, 216];
        roughness: 0.35;
        relief: 0.016;
    }>;
    expandedmetal: Readonly<{
        dark: readonly [54, 60, 66];
        light: readonly [186, 195, 203];
        roughness: 0.4;
        relief: 0.02;
    }>;
    wiremesh: Readonly<{
        dark: readonly [58, 62, 68];
        light: readonly [198, 206, 212];
        roughness: 0.33;
        relief: 0.004;
    }>;
    velvet: Readonly<{
        dark: readonly [46, 10, 28];
        light: readonly [166, 48, 88];
        roughness: 0.62;
        relief: 0.0012;
    }>;
    terrycloth: Readonly<{
        dark: readonly [150, 146, 138];
        light: readonly [250, 248, 242];
        roughness: 0.95;
        relief: 0.006;
    }>;
    boucle: Readonly<{
        dark: readonly [122, 100, 76];
        light: readonly [233, 216, 188];
        roughness: 0.92;
        relief: 0.005;
    }>;
    geode: Readonly<{
        dark: readonly [26, 20, 46];
        light: readonly [176, 156, 212];
        roughness: 0.4;
        relief: 0.005;
    }>;
    quartz: Readonly<{
        dark: readonly [136, 134, 140];
        light: readonly [252, 250, 254];
        roughness: 0.16;
        relief: 0.005;
    }>;
    pyrite: Readonly<{
        dark: readonly [92, 74, 30];
        light: readonly [236, 204, 112];
        roughness: 0.34;
        relief: 0.006;
    }>;
    shiplap: Readonly<{
        dark: readonly [88, 56, 30];
        light: readonly [206, 166, 112];
        roughness: 0.68;
        relief: 0.008;
    }>;
    glassblock: Readonly<{
        dark: readonly [128, 156, 168];
        light: readonly [222, 238, 242];
        roughness: 0.14;
        relief: 0.004;
    }>;
    thatch: Readonly<{
        dark: readonly [96, 72, 32];
        light: readonly [216, 184, 112];
        roughness: 0.9;
        relief: 0.01;
    }>;
    charredwood: Readonly<{
        dark: readonly [12, 11, 10];
        light: readonly [72, 70, 68];
        roughness: 0.82;
        relief: 0.012;
    }>;
    driftwood: Readonly<{
        dark: readonly [86, 82, 76];
        light: readonly [196, 192, 184];
        roughness: 0.88;
        relief: 0.008;
    }>;
    peelingpaint: Readonly<{
        dark: readonly [70, 84, 94];
        light: readonly [214, 222, 218];
        roughness: 0.66;
        relief: 0.005;
    }>;
    tiretread: Readonly<{
        dark: readonly [14, 15, 16];
        light: readonly [58, 62, 64];
        roughness: 0.72;
        relief: 0.01;
    }>;
    honeycomb: Readonly<{
        dark: readonly [128, 88, 24];
        light: readonly [238, 196, 92];
        roughness: 0.44;
        relief: 0.008;
    }>;
    frost: Readonly<{
        dark: readonly [176, 200, 216];
        light: readonly [250, 253, 255];
        roughness: 0.38;
        relief: 0.004;
    }>;
    stainedglass: Readonly<{
        dark: readonly [28, 42, 86];
        light: readonly [222, 176, 96];
        roughness: 0.18;
        relief: 0.006;
    }>;
    soapstone: Readonly<{
        dark: readonly [44, 52, 56];
        light: readonly [166, 176, 178];
        roughness: 0.42;
        relief: 0.003;
    }>;
    butcherblock: Readonly<{
        dark: readonly [92, 54, 22];
        light: readonly [222, 172, 104];
        roughness: 0.58;
        relief: 0.006;
    }>;
    wallpaper: Readonly<{
        dark: readonly [58, 28, 48];
        light: readonly [214, 178, 186];
        roughness: 0.72;
        relief: 0.002;
    }>;
    embroidery: Readonly<{
        dark: readonly [22, 48, 62];
        light: readonly [226, 176, 96];
        roughness: 0.86;
        relief: 0.004;
    }>;
    macrame: Readonly<{
        dark: readonly [110, 88, 62];
        light: readonly [228, 210, 182];
        roughness: 0.88;
        relief: 0.005;
    }>;
    brickpaving: Readonly<{
        dark: readonly [88, 46, 34];
        light: readonly [188, 116, 88];
        roughness: 0.82;
        relief: 0.007;
    }>;
    steppingstone: Readonly<{
        dark: readonly [66, 70, 66];
        light: readonly [174, 178, 166];
        roughness: 0.86;
        relief: 0.008;
    }>;
    woodendeck: Readonly<{
        dark: readonly [96, 72, 42];
        light: readonly [214, 182, 132];
        roughness: 0.74;
        relief: 0.006;
    }>;
    cheese: Readonly<{
        dark: readonly [176, 128, 32];
        light: readonly [250, 220, 130];
        roughness: 0.52;
        relief: 0.006;
    }>;
    sugarfrosting: Readonly<{
        dark: readonly [196, 128, 158];
        light: readonly [252, 238, 244];
        roughness: 0.44;
        relief: 0.004;
    }>;
    candleswax: Readonly<{
        dark: readonly [176, 148, 88];
        light: readonly [246, 228, 176];
        roughness: 0.58;
        relief: 0.007;
    }>;
    vinylrecord: Readonly<{
        dark: readonly [12, 12, 14];
        light: readonly [52, 52, 58];
        roughness: 0.38;
        relief: 0.003;
    }>;
    graphpaper: Readonly<{
        dark: readonly [140, 168, 196];
        light: readonly [250, 252, 252];
        roughness: 0.92;
        relief: 0.0008;
    }>;
    notebookpaper: Readonly<{
        dark: readonly [150, 172, 196];
        light: readonly [252, 250, 242];
        roughness: 0.92;
        relief: 0.001;
    }>;
    lace: Readonly<{
        dark: readonly [196, 178, 172];
        light: readonly [252, 244, 238];
        roughness: 0.62;
        relief: 0.0028;
    }>;
    crochet: Readonly<{
        dark: readonly [176, 150, 118];
        light: readonly [238, 218, 186];
        roughness: 0.9;
        relief: 0.005;
    }>;
    basketweave: Readonly<{
        dark: readonly [128, 88, 48];
        light: readonly [212, 170, 112];
        roughness: 0.8;
        relief: 0.006;
    }>;
    zipper: Readonly<{
        dark: readonly [70, 72, 78];
        light: readonly [188, 192, 200];
        roughness: 0.42;
        relief: 0.004;
    }>;
    velcro: Readonly<{
        dark: readonly [38, 42, 52];
        light: readonly [122, 130, 145];
        roughness: 0.88;
        relief: 0.0045;
    }>;
    button: Readonly<{
        dark: readonly [92, 78, 66];
        light: readonly [232, 218, 198];
        roughness: 0.38;
        relief: 0.0035;
    }>;
    traintracks: Readonly<{
        dark: readonly [72, 68, 62];
        light: readonly [168, 162, 152];
        roughness: 0.68;
        relief: 0.006;
    }>;
    manholecover: Readonly<{
        dark: readonly [46, 48, 52];
        light: readonly [128, 132, 138];
        roughness: 0.62;
        relief: 0.005;
    }>;
    speedbump: Readonly<{
        dark: readonly [52, 50, 48];
        light: readonly [228, 202, 62];
        roughness: 0.82;
        relief: 0.007;
    }>;
    circuitboard: Readonly<{
        dark: readonly [16, 48, 34];
        light: readonly [196, 172, 88];
        roughness: 0.45;
        relief: 0.0035;
    }>;
    solarpanel: Readonly<{
        dark: readonly [18, 30, 58];
        light: readonly [96, 132, 196];
        roughness: 0.28;
        relief: 0.003;
    }>;
    heattile: Readonly<{
        dark: readonly [86, 82, 78];
        light: readonly [212, 206, 198];
        roughness: 0.88;
        relief: 0.005;
    }>;
    pianokeys: Readonly<{
        dark: readonly [62, 58, 54];
        light: readonly [242, 238, 228];
        roughness: 0.32;
        relief: 0.0028;
    }>;
    drumskin: Readonly<{
        dark: readonly [92, 74, 58];
        light: readonly [222, 196, 158];
        roughness: 0.72;
        relief: 0.0035;
    }>;
    gongsurface: Readonly<{
        dark: readonly [112, 84, 32];
        light: readonly [228, 182, 96];
        roughness: 0.36;
        relief: 0.004;
    }>;
    lensarray: Readonly<{
        dark: readonly [26, 34, 46];
        light: readonly [168, 196, 226];
        roughness: 0.22;
        relief: 0.0028;
    }>;
    prismtape: Readonly<{
        dark: readonly [122, 96, 42];
        light: readonly [242, 214, 122];
        roughness: 0.3;
        relief: 0.0035;
    }>;
    fresnel: Readonly<{
        dark: readonly [88, 116, 142];
        light: readonly [212, 232, 246];
        roughness: 0.26;
        relief: 0.004;
    }>;
    bandage: Readonly<{
        dark: readonly [196, 182, 158];
        light: readonly [252, 248, 236];
        roughness: 0.92;
        relief: 0.0035;
    }>;
    pillblister: Readonly<{
        dark: readonly [188, 192, 198];
        light: readonly [242, 244, 248];
        roughness: 0.3;
        relief: 0.004;
    }>;
    sutures: Readonly<{
        dark: readonly [208, 178, 158];
        light: readonly [252, 232, 218];
        roughness: 0.68;
        relief: 0.003;
    }>;
    trellis: Readonly<{
        dark: readonly [92, 70, 46];
        light: readonly [202, 172, 128];
        roughness: 0.78;
        relief: 0.005;
    }>;
    terracottapot: Readonly<{
        dark: readonly [142, 78, 52];
        light: readonly [222, 142, 106];
        roughness: 0.82;
        relief: 0.004;
    }>;
    hedgerow: Readonly<{
        dark: readonly [38, 62, 34];
        light: readonly [122, 162, 88];
        roughness: 0.86;
        relief: 0.006;
    }>;
    collar: Readonly<{
        dark: readonly [62, 46, 92];
        light: readonly [188, 164, 222];
        roughness: 0.62;
        relief: 0.0035;
    }>;
    petbed: Readonly<{
        dark: readonly [92, 72, 62];
        light: readonly [214, 186, 164];
        roughness: 0.88;
        relief: 0.005;
    }>;
    scratchpost: Readonly<{
        dark: readonly [128, 102, 62];
        light: readonly [222, 194, 142];
        roughness: 0.84;
        relief: 0.0055;
    }>;
    runningtrack: Readonly<{
        dark: readonly [122, 42, 38];
        light: readonly [238, 228, 218];
        roughness: 0.88;
        relief: 0.004;
    }>;
    bouldermat: Readonly<{
        dark: readonly [38, 52, 78];
        light: readonly [142, 162, 198];
        roughness: 0.82;
        relief: 0.005;
    }>;
    pooltile: Readonly<{
        dark: readonly [22, 88, 122];
        light: readonly [168, 222, 238];
        roughness: 0.3;
        relief: 0.003;
    }>;
    envelope: Readonly<{
        dark: readonly [188, 172, 142];
        light: readonly [248, 238, 214];
        roughness: 0.82;
        relief: 0.0028;
    }>;
    chalkboard: Readonly<{
        dark: readonly [32, 48, 44];
        light: readonly [122, 142, 132];
        roughness: 0.72;
        relief: 0.0035;
    }>;
    corkboard: Readonly<{
        dark: readonly [142, 102, 58];
        light: readonly [222, 182, 122];
        roughness: 0.88;
        relief: 0.0045;
    }>;
    snowdrift: Readonly<{
        dark: readonly [178, 196, 218];
        light: readonly [252, 254, 255];
        roughness: 0.68;
        relief: 0.005;
    }>;
    icicle: Readonly<{
        dark: readonly [152, 192, 212];
        light: readonly [238, 250, 254];
        roughness: 0.22;
        relief: 0.006;
    }>;
    dewdrops: Readonly<{
        dark: readonly [72, 112, 58];
        light: readonly [182, 222, 148];
        roughness: 0.36;
        relief: 0.003;
    }>;
    mooncrater: Readonly<{
        dark: readonly [92, 92, 102];
        light: readonly [212, 212, 218];
        roughness: 0.82;
        relief: 0.005;
    }>;
    starfield: Readonly<{
        dark: readonly [12, 16, 42];
        light: readonly [222, 232, 255];
        roughness: 0.42;
        relief: 0.002;
    }>;
    nebula: Readonly<{
        dark: readonly [42, 22, 62];
        light: readonly [188, 132, 222];
        roughness: 0.52;
        relief: 0.003;
    }>;
    pleats: Readonly<{
        dark: readonly [82, 62, 92];
        light: readonly [202, 172, 212];
        roughness: 0.72;
        relief: 0.004;
    }>;
    shoelace: Readonly<{
        dark: readonly [62, 52, 48];
        light: readonly [222, 212, 198];
        roughness: 0.78;
        relief: 0.0035;
    }>;
    tassel: Readonly<{
        dark: readonly [92, 58, 72];
        light: readonly [222, 168, 188];
        roughness: 0.76;
        relief: 0.005;
    }>;
    woksurface: Readonly<{
        dark: readonly [42, 42, 46];
        light: readonly [128, 130, 136];
        roughness: 0.38;
        relief: 0.0028;
    }>;
    cutlery: Readonly<{
        dark: readonly [92, 92, 98];
        light: readonly [232, 232, 236];
        roughness: 0.24;
        relief: 0.0022;
    }>;
    choppingboard: Readonly<{
        dark: readonly [142, 102, 58];
        light: readonly [222, 182, 122];
        roughness: 0.72;
        relief: 0.0035;
    }>;
    faucet: Readonly<{
        dark: readonly [92, 96, 102];
        light: readonly [232, 236, 240];
        roughness: 0.22;
        relief: 0.003;
    }>;
    showerhead: Readonly<{
        dark: readonly [122, 128, 136];
        light: readonly [222, 228, 234];
        roughness: 0.32;
        relief: 0.0028;
    }>;
    bathmat: Readonly<{
        dark: readonly [42, 92, 92];
        light: readonly [142, 202, 198];
        roughness: 0.86;
        relief: 0.004;
    }>;
    blinds: Readonly<{
        dark: readonly [122, 118, 112];
        light: readonly [232, 228, 220];
        roughness: 0.62;
        relief: 0.0035;
    }>;
    curtain: Readonly<{
        dark: readonly [92, 62, 72];
        light: readonly [212, 168, 178];
        roughness: 0.82;
        relief: 0.004;
    }>;
    shadecloth: Readonly<{
        dark: readonly [42, 62, 42];
        light: readonly [132, 172, 112];
        roughness: 0.86;
        relief: 0.0028;
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
    lotusleaf: Readonly<{
        dark: readonly [17, 49, 28];
        light: readonly [112, 160, 85];
        roughness: 0.61;
        relief: 0.006;
    }>;
    bananaleaf: Readonly<{
        dark: readonly [18, 52, 19];
        light: readonly [132, 174, 66];
        roughness: 0.53;
        relief: 0.007;
    }>;
    fernleaf: Readonly<{
        dark: readonly [13, 39, 22];
        light: readonly [89, 146, 60];
        roughness: 0.69;
        relief: 0.005;
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
    pretzel: Readonly<{
        dark: readonly [82, 44, 22];
        light: readonly [182, 128, 66];
        roughness: 0.58;
        relief: 0.0045;
    }>;
    bagel: Readonly<{
        dark: readonly [92, 58, 32];
        light: readonly [212, 172, 112];
        roughness: 0.62;
        relief: 0.004;
    }>;
    croissant: Readonly<{
        dark: readonly [102, 58, 26];
        light: readonly [232, 186, 112];
        roughness: 0.52;
        relief: 0.0048;
    }>;
    butterflywing: Readonly<{
        dark: readonly [92, 38, 88];
        light: readonly [232, 148, 212];
        roughness: 0.42;
        relief: 0.0028;
    }>;
    beetlewing: Readonly<{
        dark: readonly [22, 62, 42];
        light: readonly [112, 212, 148];
        roughness: 0.32;
        relief: 0.003;
    }>;
    spiderweb: Readonly<{
        dark: readonly [82, 88, 96];
        light: readonly [222, 228, 236];
        roughness: 0.42;
        relief: 0.0022;
    }>;
    cirrus: Readonly<{
        dark: readonly [122, 138, 168];
        light: readonly [242, 246, 252];
        roughness: 0.62;
        relief: 0.0018;
    }>;
    cumulus: Readonly<{
        dark: readonly [132, 142, 168];
        light: readonly [250, 250, 254];
        roughness: 0.78;
        relief: 0.0026;
    }>;
    lightning: Readonly<{
        dark: readonly [18, 22, 48];
        light: readonly [232, 236, 255];
        roughness: 0.38;
        relief: 0.0022;
    }>;
    kelp: Readonly<{
        dark: readonly [32, 58, 34];
        light: readonly [112, 168, 72];
        roughness: 0.42;
        relief: 0.0035;
    }>;
    seaweed: Readonly<{
        dark: readonly [38, 62, 48];
        light: readonly [122, 172, 118];
        roughness: 0.62;
        relief: 0.0026;
    }>;
    anemone: Readonly<{
        dark: readonly [88, 42, 62];
        light: readonly [232, 128, 158];
        roughness: 0.52;
        relief: 0.003;
    }>;
    candy: Readonly<{
        dark: readonly [122, 22, 62];
        light: readonly [252, 132, 172];
        roughness: 0.22;
        relief: 0.002;
    }>;
    marshmallow: Readonly<{
        dark: readonly [188, 148, 168];
        light: readonly [252, 232, 242];
        roughness: 0.86;
        relief: 0.003;
    }>;
    nougat: Readonly<{
        dark: readonly [92, 62, 38];
        light: readonly [232, 202, 152];
        roughness: 0.62;
        relief: 0.0032;
    }>;
    frostedglass: Readonly<{
        dark: readonly [142, 158, 168];
        light: readonly [222, 238, 246];
        roughness: 0.72;
        relief: 0.0016;
    }>;
    rippledglass: Readonly<{
        dark: readonly [112, 138, 152];
        light: readonly [212, 236, 248];
        roughness: 0.38;
        relief: 0.0024;
    }>;
    bubbleglass: Readonly<{
        dark: readonly [122, 148, 138];
        light: readonly [222, 246, 238];
        roughness: 0.28;
        relief: 0.0022;
    }>;
    saddlestitch: Readonly<{
        dark: readonly [82, 52, 32];
        light: readonly [172, 122, 82];
        roughness: 0.58;
        relief: 0.003;
    }>;
    tooledleather: Readonly<{
        dark: readonly [92, 58, 34];
        light: readonly [192, 138, 92];
        roughness: 0.62;
        relief: 0.0034;
    }>;
    patentleather: Readonly<{
        dark: readonly [42, 22, 32];
        light: readonly [152, 82, 112];
        roughness: 0.18;
        relief: 0.0018;
    }>;
    appleskin: Readonly<{
        dark: readonly [122, 22, 32];
        light: readonly [232, 112, 82];
        roughness: 0.36;
        relief: 0.0018;
    }>;
    peachskin: Readonly<{
        dark: readonly [132, 62, 62];
        light: readonly [242, 172, 132];
        roughness: 0.82;
        relief: 0.0026;
    }>;
    grapeskin: Readonly<{
        dark: readonly [58, 32, 72];
        light: readonly [162, 112, 182];
        roughness: 0.42;
        relief: 0.002;
    }>;
    broccoli: Readonly<{
        dark: readonly [42, 68, 38];
        light: readonly [122, 172, 82];
        roughness: 0.78;
        relief: 0.0034;
    }>;
    cabbage: Readonly<{
        dark: readonly [72, 108, 62];
        light: readonly [192, 222, 152];
        roughness: 0.68;
        relief: 0.003;
    }>;
    onion: Readonly<{
        dark: readonly [132, 92, 42];
        light: readonly [232, 192, 112];
        roughness: 0.52;
        relief: 0.0026;
    }>;
    bedsheet: Readonly<{
        dark: readonly [142, 148, 178];
        light: readonly [232, 236, 252];
        roughness: 0.78;
        relief: 0.0024;
    }>;
    pillow: Readonly<{
        dark: readonly [162, 158, 178];
        light: readonly [242, 238, 252];
        roughness: 0.82;
        relief: 0.003;
    }>;
    mattress: Readonly<{
        dark: readonly [102, 98, 118];
        light: readonly [192, 188, 212];
        roughness: 0.86;
        relief: 0.003;
    }>;
    tealeaf: Readonly<{
        dark: readonly [42, 62, 32];
        light: readonly [122, 152, 72];
        roughness: 0.72;
        relief: 0.003;
    }>;
    matcha: Readonly<{
        dark: readonly [82, 108, 42];
        light: readonly [182, 212, 112];
        roughness: 0.88;
        relief: 0.002;
    }>;
    teabag: Readonly<{
        dark: readonly [122, 102, 72];
        light: readonly [232, 218, 182];
        roughness: 0.82;
        relief: 0.0022;
    }>;
    sanddune: Readonly<{
        dark: readonly [152, 122, 72];
        light: readonly [242, 218, 162];
        roughness: 0.72;
        relief: 0.0024;
    }>;
    pebblebeach: Readonly<{
        dark: readonly [82, 84, 92];
        light: readonly [182, 186, 192];
        roughness: 0.58;
        relief: 0.003;
    }>;
    foamedge: Readonly<{
        dark: readonly [112, 142, 152];
        light: readonly [242, 250, 252];
        roughness: 0.66;
        relief: 0.0022;
    }>;
    lavaflow: Readonly<{
        dark: readonly [52, 22, 12];
        light: readonly [212, 72, 22];
        roughness: 0.62;
        relief: 0.0032;
    }>;
    cooledlava: Readonly<{
        dark: readonly [42, 42, 48];
        light: readonly [112, 112, 122];
        roughness: 0.78;
        relief: 0.003;
    }>;
    ashfield: Readonly<{
        dark: readonly [72, 68, 72];
        light: readonly [162, 156, 158];
        roughness: 0.9;
        relief: 0.0022;
    }>;
    stalactite: Readonly<{
        dark: readonly [92, 82, 72];
        light: readonly [212, 198, 172];
        roughness: 0.66;
        relief: 0.0034;
    }>;
    flowstone: Readonly<{
        dark: readonly [112, 92, 62];
        light: readonly [232, 208, 162];
        roughness: 0.52;
        relief: 0.003;
    }>;
    cavefloor: Readonly<{
        dark: readonly [62, 56, 52];
        light: readonly [142, 132, 122];
        roughness: 0.86;
        relief: 0.0026;
    }>;
    jam: Readonly<{
        dark: readonly [112, 12, 32];
        light: readonly [232, 72, 92];
        roughness: 0.18;
        relief: 0.002;
    }>;
    peanutbutter: Readonly<{
        dark: readonly [122, 82, 32];
        light: readonly [222, 172, 92];
        roughness: 0.58;
        relief: 0.0022;
    }>;
    sprinkles: Readonly<{
        dark: readonly [222, 172, 202];
        light: readonly [252, 232, 242];
        roughness: 0.42;
        relief: 0.0024;
    }>;
    icecream: Readonly<{
        dark: readonly [222, 182, 192];
        light: readonly [252, 238, 242];
        roughness: 0.82;
        relief: 0.0026;
    }>;
    popsicle: Readonly<{
        dark: readonly [122, 42, 62];
        light: readonly [232, 132, 152];
        roughness: 0.32;
        relief: 0.002;
    }>;
    sorbet: Readonly<{
        dark: readonly [162, 72, 42];
        light: readonly [242, 172, 112];
        roughness: 0.58;
        relief: 0.0022;
    }>;
    spaghetti: Readonly<{
        dark: readonly [192, 152, 82];
        light: readonly [252, 232, 162];
        roughness: 0.62;
        relief: 0.0024;
    }>;
    macaroni: Readonly<{
        dark: readonly [172, 132, 72];
        light: readonly [242, 212, 142];
        roughness: 0.58;
        relief: 0.0026;
    }>;
    lasagna: Readonly<{
        dark: readonly [102, 42, 22];
        light: readonly [232, 182, 112];
        roughness: 0.52;
        relief: 0.0028;
    }>;
    origami: Readonly<{
        dark: readonly [132, 112, 142];
        light: readonly [242, 232, 246];
        roughness: 0.72;
        relief: 0.0028;
    }>;
    paperlace: Readonly<{
        dark: readonly [162, 152, 142];
        light: readonly [252, 248, 242];
        roughness: 0.78;
        relief: 0.0024;
    }>;
    papercut: Readonly<{
        dark: readonly [142, 32, 42];
        light: readonly [242, 212, 212];
        roughness: 0.68;
        relief: 0.0026;
    }>;
    sunflower: Readonly<{
        dark: readonly [72, 52, 22];
        light: readonly [232, 192, 62];
        roughness: 0.62;
        relief: 0.003;
    }>;
    daisy: Readonly<{
        dark: readonly [182, 172, 62];
        light: readonly [252, 252, 242];
        roughness: 0.58;
        relief: 0.0026;
    }>;
    clover: Readonly<{
        dark: readonly [42, 88, 42];
        light: readonly [122, 192, 92];
        roughness: 0.68;
        relief: 0.0028;
    }>;
    puzzletile: Readonly<{
        dark: readonly [162, 102, 42];
        light: readonly [242, 192, 112];
        roughness: 0.52;
        relief: 0.003;
    }>;
    legobrick: Readonly<{
        dark: readonly [152, 42, 42];
        light: readonly [232, 142, 112];
        roughness: 0.38;
        relief: 0.0028;
    }>;
    rubberband: Readonly<{
        dark: readonly [72, 112, 62];
        light: readonly [172, 222, 142];
        roughness: 0.58;
        relief: 0.0022;
    }>;
    haybale: Readonly<{
        dark: readonly [162, 132, 62];
        light: readonly [242, 218, 132];
        roughness: 0.72;
        relief: 0.0032;
    }>;
    corncrib: Readonly<{
        dark: readonly [102, 82, 62];
        light: readonly [192, 162, 112];
        roughness: 0.68;
        relief: 0.0028;
    }>;
    fencepost: Readonly<{
        dark: readonly [92, 72, 52];
        light: readonly [182, 152, 112];
        roughness: 0.78;
        relief: 0.003;
    }>;
    poolfelt: Readonly<{
        dark: readonly [22, 62, 42];
        light: readonly [62, 142, 92];
        roughness: 0.9;
        relief: 0.0022;
    }>;
    icesurface: Readonly<{
        dark: readonly [142, 172, 202];
        light: readonly [242, 250, 255];
        roughness: 0.16;
        relief: 0.0018;
    }>;
    climbingwall: Readonly<{
        dark: readonly [72, 68, 78];
        light: readonly [182, 172, 192];
        roughness: 0.86;
        relief: 0.0034;
    }>;
    oledpanel: Readonly<{
        dark: readonly [12, 12, 16];
        light: readonly [212, 220, 232];
        roughness: 0.3;
        relief: 0.0016;
    }>;
    crtscanline: Readonly<{
        dark: readonly [8, 12, 10];
        light: readonly [112, 188, 128];
        roughness: 0.42;
        relief: 0.0012;
    }>;
    keyboardkey: Readonly<{
        dark: readonly [28, 28, 32];
        light: readonly [172, 172, 182];
        roughness: 0.62;
        relief: 0.003;
    }>;
    filmstrip: Readonly<{
        dark: readonly [10, 10, 14];
        light: readonly [88, 92, 104];
        roughness: 0.3;
        relief: 0.0024;
    }>;
    postagestamp: Readonly<{
        dark: readonly [150, 132, 100];
        light: readonly [238, 228, 200];
        roughness: 0.82;
        relief: 0.0026;
    }>;
    halftoneprint: Readonly<{
        dark: readonly [26, 28, 32];
        light: readonly [214, 214, 210];
        roughness: 0.68;
        relief: 0.0018;
    }>;
    radiator: Readonly<{
        dark: readonly [122, 122, 128];
        light: readonly [228, 230, 236];
        roughness: 0.36;
        relief: 0.003;
    }>;
    screwhead: Readonly<{
        dark: readonly [62, 64, 70];
        light: readonly [188, 192, 200];
        roughness: 0.42;
        relief: 0.0018;
    }>;
    chainlink: Readonly<{
        dark: readonly [92, 96, 102];
        light: readonly [172, 178, 186];
        roughness: 0.52;
        relief: 0.0016;
    }>;
    friedegg: Readonly<{
        dark: readonly [222, 176, 66];
        light: readonly [252, 251, 246];
        roughness: 0.52;
        relief: 0.0026;
    }>;
    sushirice: Readonly<{
        dark: readonly [188, 182, 172];
        light: readonly [250, 249, 246];
        roughness: 0.66;
        relief: 0.0018;
    }>;
    chocolatechip: Readonly<{
        dark: readonly [72, 42, 26];
        light: readonly [218, 186, 140];
        roughness: 0.72;
        relief: 0.0022;
    }>;
    cargomat: Readonly<{
        dark: readonly [28, 30, 34];
        light: readonly [92, 96, 102];
        roughness: 0.8;
        relief: 0.0028;
    }>;
    dashboardgrain: Readonly<{
        dark: readonly [36, 34, 36];
        light: readonly [118, 112, 110];
        roughness: 0.72;
        relief: 0.0022;
    }>;
    licenseplate: Readonly<{
        dark: readonly [142, 152, 168];
        light: readonly [232, 238, 246];
        roughness: 0.38;
        relief: 0.0018;
    }>;
    flowerbed: Readonly<{
        dark: readonly [42, 66, 30];
        light: readonly [232, 148, 176];
        roughness: 0.78;
        relief: 0.0028;
    }>;
    grassstripe: Readonly<{
        dark: readonly [46, 82, 36];
        light: readonly [122, 172, 78];
        roughness: 0.84;
        relief: 0.0022;
    }>;
    topiary: Readonly<{
        dark: readonly [28, 52, 26];
        light: readonly [96, 138, 62];
        roughness: 0.8;
        relief: 0.0026;
    }>;
    confetti: Readonly<{
        dark: readonly [214, 72, 96];
        light: readonly [252, 232, 128];
        roughness: 0.62;
        relief: 0.0018;
    }>;
    ribbonstreamer: Readonly<{
        dark: readonly [122, 42, 148];
        light: readonly [228, 148, 232];
        roughness: 0.48;
        relief: 0.0022;
    }>;
    pinatafringe: Readonly<{
        dark: readonly [222, 82, 62];
        light: readonly [252, 192, 96];
        roughness: 0.7;
        relief: 0.0024;
    }>;
    xylophone: Readonly<{
        dark: readonly [152, 102, 52];
        light: readonly [238, 192, 128];
        roughness: 0.58;
        relief: 0.0026;
    }>;
    tambourine: Readonly<{
        dark: readonly [168, 122, 62];
        light: readonly [236, 208, 152];
        roughness: 0.62;
        relief: 0.0022;
    }>;
    castanet: Readonly<{
        dark: readonly [132, 52, 48];
        light: readonly [222, 148, 132];
        roughness: 0.56;
        relief: 0.0024;
    }>;
    pillcapsule: Readonly<{
        dark: readonly [232, 92, 72];
        light: readonly [252, 232, 224];
        roughness: 0.54;
        relief: 0.0022;
    }>;
    pilltablet: Readonly<{
        dark: readonly [222, 222, 218];
        light: readonly [252, 252, 248];
        roughness: 0.62;
        relief: 0.0018;
    }>;
    bathbomb: Readonly<{
        dark: readonly [142, 82, 192];
        light: readonly [232, 192, 242];
        roughness: 0.72;
        relief: 0.0022;
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
    basalt: Readonly<{
        dark: readonly [18, 22, 25];
        light: readonly [87, 94, 96];
        roughness: 0.87;
        relief: 0.009;
    }>;
    scoria: Readonly<{
        dark: readonly [34, 14, 12];
        light: readonly [126, 63, 43];
        roughness: 0.92;
        relief: 0.012;
    }>;
    obsidian: Readonly<{
        dark: readonly [5, 7, 10];
        light: readonly [44, 49, 57];
        roughness: 0.12;
        relief: 0.004;
    }>;
    malachite: Readonly<{
        dark: readonly [6, 42, 24];
        light: readonly [87, 183, 110];
        roughness: 0.22;
        relief: 0.002;
    }>;
    agate: Readonly<{
        dark: readonly [106, 30, 15];
        light: readonly [249, 223, 174];
        roughness: 0.19;
        relief: 0.002;
    }>;
    lapislazuli: Readonly<{
        dark: readonly [12, 24, 108];
        light: readonly [231, 228, 216];
        roughness: 0.27;
        relief: 0.003;
    }>;
    rice: Readonly<{
        dark: readonly [123, 109, 79];
        light: readonly [255, 248, 222];
        roughness: 0.57;
        relief: 0.004;
    }>;
    sesame: Readonly<{
        dark: readonly [100, 61, 26];
        light: readonly [239, 203, 140];
        roughness: 0.61;
        relief: 0.003;
    }>;
    coffeebeans: Readonly<{
        dark: readonly [12, 5, 3];
        light: readonly [125, 66, 32];
        roughness: 0.39;
        relief: 0.008;
    }>;
    braincoral: Readonly<{
        dark: readonly [38, 47, 24];
        light: readonly [198, 190, 109];
        roughness: 0.76;
        relief: 0.008;
    }>;
    starcoral: Readonly<{
        dark: readonly [51, 29, 24];
        light: readonly [222, 167, 119];
        roughness: 0.8;
        relief: 0.006;
    }>;
    seasponge: Readonly<{
        dark: readonly [65, 40, 12];
        light: readonly [230, 190, 91];
        roughness: 0.91;
        relief: 0.009;
    }>;
    houndstooth: Readonly<{
        dark: readonly [17, 16, 15];
        light: readonly [239, 231, 210];
        roughness: 0.9;
        relief: 0.0024;
    }>;
    tartan: Readonly<{
        dark: readonly [49, 29, 26];
        light: readonly [207, 174, 119];
        roughness: 0.88;
        relief: 0.0028;
    }>;
    damask: Readonly<{
        dark: readonly [71, 53, 41];
        light: readonly [210, 185, 137];
        roughness: 0.74;
        relief: 0.004;
    }>;
    zebrafur: Readonly<{
        dark: readonly [14, 12, 10];
        light: readonly [244, 234, 211];
        roughness: 0.87;
        relief: 0.002;
    }>;
    leopardfur: Readonly<{
        dark: readonly [22, 13, 7];
        light: readonly [232, 180, 93];
        roughness: 0.87;
        relief: 0.002;
    }>;
    giraffefur: Readonly<{
        dark: readonly [106, 48, 20];
        light: readonly [246, 223, 172];
        roughness: 0.87;
        relief: 0.002;
    }>;
    scallopshell: Readonly<{
        dark: readonly [151, 71, 65];
        light: readonly [249, 233, 204];
        roughness: 0.55;
        relief: 0.006;
    }>;
    oystershell: Readonly<{
        dark: readonly [62, 65, 59];
        light: readonly [227, 222, 198];
        roughness: 0.89;
        relief: 0.009;
    }>;
    nautilusshell: Readonly<{
        dark: readonly [124, 46, 25];
        light: readonly [249, 234, 196];
        roughness: 0.38;
        relief: 0.004;
    }>;
    walnutshell: Readonly<{
        dark: readonly [65, 30, 12];
        light: readonly [177, 126, 70];
        roughness: 0.88;
        relief: 0.003;
    }>;
    peanutshell: Readonly<{
        dark: readonly [146, 105, 53];
        light: readonly [237, 213, 164];
        roughness: 0.9;
        relief: 0.0015;
    }>;
    almondshell: Readonly<{
        dark: readonly [133, 91, 47];
        light: readonly [224, 193, 143];
        roughness: 0.86;
        relief: 0.0012;
    }>;
    cantaloupe: Readonly<{
        dark: readonly [70, 83, 36];
        light: readonly [215, 188, 132];
        roughness: 0.81;
        relief: 0.005;
    }>;
    dragonfruit: Readonly<{
        dark: readonly [190, 17, 91];
        light: readonly [193, 211, 58];
        roughness: 0.35;
        relief: 0.006;
    }>;
    kiwiskin: Readonly<{
        dark: readonly [66, 38, 17];
        light: readonly [170, 133, 76];
        roughness: 0.91;
        relief: 0.002;
    }>;
    rosepetal: Readonly<{
        dark: readonly [91, 8, 32];
        light: readonly [228, 89, 126];
        roughness: 0.87;
        relief: 0.0012;
    }>;
    lilypetal: Readonly<{
        dark: readonly [116, 30, 17];
        light: readonly [255, 238, 175];
        roughness: 0.48;
        relief: 0.001;
    }>;
    fritillarypetal: Readonly<{
        dark: readonly [88, 26, 83];
        light: readonly [245, 232, 195];
        roughness: 0.57;
        relief: 0.001;
    }>;
    birchbark: Readonly<{
        dark: readonly [43, 36, 29];
        light: readonly [242, 235, 213];
        roughness: 0.79;
        relief: 0.003;
    }>;
    palmtrunk: Readonly<{
        dark: readonly [66, 43, 25];
        light: readonly [191, 151, 96];
        roughness: 0.93;
        relief: 0.009;
    }>;
    sycamorebark: Readonly<{
        dark: readonly [95, 102, 74];
        light: readonly [225, 219, 188];
        roughness: 0.84;
        relief: 0.004;
    }>;
    elephanthide: Readonly<{
        dark: readonly [50, 49, 46];
        light: readonly [160, 157, 147];
        roughness: 0.88;
        relief: 0.007;
    }>;
    ostrichleather: Readonly<{
        dark: readonly [92, 51, 25];
        light: readonly [217, 168, 103];
        roughness: 0.69;
        relief: 0.004;
    }>;
    sharkskin: Readonly<{
        dark: readonly [39, 54, 63];
        light: readonly [145, 163, 171];
        roughness: 0.78;
        relief: 0.002;
    }>;
    tactilepaving: Readonly<{
        dark: readonly [105, 82, 28];
        light: readonly [230, 199, 91];
        roughness: 0.83;
        relief: 0.009;
        tiles: 2;
        domes: 6;
        jointInner: 0.455;
        jointOuter: 0.49;
        domeInner: 0.2;
        domeOuter: 0.34;
    }>;
    roadmarking: Readonly<{
        dark: readonly [24, 27, 28];
        light: readonly [232, 231, 213];
        roughness: 0.93;
        relief: 0.0015;
        bands: 2;
        bandInner: 0.26;
        bandOuter: 0.3;
        wearInner: 0.36;
        wearOuter: 0.56;
        wearColumns: 12;
        wearRows: 20;
    }>;
    draincover: Readonly<{
        dark: readonly [14, 17, 18];
        light: readonly [139, 146, 144];
        roughness: 0.64;
        relief: 0.012;
        frameInnerX: 0.43;
        frameOuterX: 0.46;
        frameInnerY: 0.4;
        frameOuterY: 0.43;
        slots: 6;
        slotStart: 0.15;
        slotSpacing: 0.14;
        slotHalfLength: 0.25;
        slotInner: 0.026;
        slotOuter: 0.042;
        braceInner: 0.035;
        braceOuter: 0.055;
    }>;
    mushroomgills: Readonly<{
        dark: readonly [91, 61, 37];
        light: readonly [247, 233, 197];
        roughness: 0.78;
        relief: 0.0024;
        cells: 3;
        scale: 0.58;
        blades: 44;
        bladePower: 8;
        shortStart: 0.62;
        shortEnd: 0.82;
    }>;
    morel: Readonly<{
        dark: readonly [53, 29, 12];
        light: readonly [211, 164, 85];
        roughness: 0.86;
        relief: 0.0038;
        columns: 7;
        rows: 4;
        jitter: 0.18;
        support: 1.6;
        weightPower: 12;
    }>;
    bracketfungus: Readonly<{
        dark: readonly [87, 34, 17];
        light: readonly [242, 221, 177];
        roughness: 0.83;
        relief: 0.0028;
        cells: 3;
        scale: 0.58;
        zones: 2.8;
        lobe: 0.055;
        marginStart: 1.1;
        marginEnd: 1.22;
    }>;
    pineapple: Readonly<{
        dark: readonly [62, 61, 17];
        light: readonly [232, 174, 43];
        roughness: 0.73;
        relief: 0.0035;
        cells: 8;
        shoulder: 0.09;
        eyeRadius: 0.18;
    }>;
    strawberry: Readonly<{
        dark: readonly [173, 8, 21];
        light: readonly [245, 192, 70];
        roughness: 0.43;
        relief: 0.0018;
        columns: 12;
        rows: 10;
        width: 0.22;
        length: 0.34;
        core: 0.13;
    }>;
    lychee: Readonly<{
        dark: readonly [103, 22, 37];
        light: readonly [236, 124, 143];
        roughness: 0.76;
        relief: 0.0024;
        columns: 18;
        rows: 16;
        shoulder: 0.075;
        edge: 0.48;
        jitter: 0.015;
    }>;
    sandpaper: Readonly<{
        dark: readonly [86, 66, 48];
        light: readonly [214, 172, 118];
        roughness: 0.93;
        relief: 0.0028;
    }>;
    steelwool: Readonly<{
        dark: readonly [96, 99, 104];
        light: readonly [214, 218, 224];
        roughness: 0.82;
        relief: 0.003;
    }>;
    wirebrush: Readonly<{
        dark: readonly [64, 62, 60];
        light: readonly [202, 200, 196];
        roughness: 0.68;
        relief: 0.0026;
    }>;
    cheesegrater: Readonly<{
        dark: readonly [96, 100, 104];
        light: readonly [222, 226, 230];
        roughness: 0.42;
        relief: 0.002;
    }>;
    ovenrack: Readonly<{
        dark: readonly [72, 70, 68];
        light: readonly [196, 194, 190];
        roughness: 0.55;
        relief: 0.0028;
    }>;
    muffintin: Readonly<{
        dark: readonly [88, 76, 62];
        light: readonly [214, 198, 176];
        roughness: 0.5;
        relief: 0.0026;
    }>;
    gauze: Readonly<{
        dark: readonly [214, 214, 208];
        light: readonly [252, 252, 248];
        roughness: 0.88;
        relief: 0.0016;
    }>;
    elasticbandage: Readonly<{
        dark: readonly [188, 178, 156];
        light: readonly [242, 236, 218];
        roughness: 0.86;
        relief: 0.0028;
    }>;
    icepack: Readonly<{
        dark: readonly [58, 96, 132];
        light: readonly [188, 222, 240];
        roughness: 0.36;
        relief: 0.0032;
    }>;
    bubblewrap: Readonly<{
        dark: readonly [178, 198, 212];
        light: readonly [240, 247, 251];
        roughness: 0.28;
        relief: 0.0042;
    }>;
    sequin: Readonly<{
        dark: readonly [128, 36, 72];
        light: readonly [242, 156, 188];
        roughness: 0.24;
        relief: 0.0022;
    }>;
    pennyround: Readonly<{
        dark: readonly [148, 148, 146];
        light: readonly [240, 238, 232];
        roughness: 0.3;
        relief: 0.003;
    }>;
    volleyball: Readonly<{
        dark: readonly [42, 62, 110];
        light: readonly [238, 240, 244];
        roughness: 0.42;
        relief: 0.003;
    }>;
    bowlingball: Readonly<{
        dark: readonly [52, 12, 24];
        light: readonly [214, 96, 108];
        roughness: 0.16;
        relief: 0.0028;
    }>;
    rugbyball: Readonly<{
        dark: readonly [72, 38, 22];
        light: readonly [214, 178, 132];
        roughness: 0.5;
        relief: 0.0034;
    }>;
    wafflecone: Readonly<{
        dark: readonly [122, 74, 30];
        light: readonly [232, 186, 112];
        roughness: 0.55;
        relief: 0.0034;
    }>;
    donutglaze: Readonly<{
        dark: readonly [132, 84, 56];
        light: readonly [246, 232, 226];
        roughness: 0.32;
        relief: 0.0038;
    }>;
    brownie: Readonly<{
        dark: readonly [42, 24, 18];
        light: readonly [148, 96, 62];
        roughness: 0.46;
        relief: 0.0032;
    }>;
    soapbar: Readonly<{
        dark: readonly [96, 142, 150];
        light: readonly [232, 246, 246];
        roughness: 0.38;
        relief: 0.0032;
    }>;
    loofah: Readonly<{
        dark: readonly [142, 112, 62];
        light: readonly [232, 212, 158];
        roughness: 0.62;
        relief: 0.0048;
    }>;
    scrubbypad: Readonly<{
        dark: readonly [46, 92, 62];
        light: readonly [168, 208, 152];
        roughness: 0.58;
        relief: 0.003;
    }>;
    orangeflesh: Readonly<{
        dark: readonly [186, 92, 24];
        light: readonly [252, 196, 96];
        roughness: 0.42;
        relief: 0.0032;
    }>;
    kiwiflesh: Readonly<{
        dark: readonly [88, 116, 42];
        light: readonly [198, 226, 128];
        roughness: 0.46;
        relief: 0.003;
    }>;
    avocadoflesh: Readonly<{
        dark: readonly [92, 118, 58];
        light: readonly [222, 232, 152];
        roughness: 0.44;
        relief: 0.0036;
    }>;
    turquoise: Readonly<{
        dark: readonly [28, 126, 134];
        light: readonly [96, 218, 206];
        roughness: 0.24;
        relief: 0.0028;
    }>;
    rhodonite: Readonly<{
        dark: readonly [142, 58, 78];
        light: readonly [236, 154, 172];
        roughness: 0.26;
        relief: 0.0025;
    }>;
    tigereye: Readonly<{
        dark: readonly [62, 36, 16];
        light: readonly [218, 160, 52];
        roughness: 0.2;
        relief: 0.0022;
    }>;
    tatami: Readonly<{
        dark: readonly [83, 78, 32];
        light: readonly [208, 195, 116];
        roughness: 0.81;
        relief: 0.006;
        reeds: 32;
        bindings: 4;
        bindingWidth: 0.09;
    }>;
    flutedwood: Readonly<{
        dark: readonly [39, 20, 10];
        light: readonly [189, 128, 65];
        roughness: 0.48;
        relief: 0.028;
        slats: 8;
        halfWidth: 0.44;
    }>;
    subwaytiles: Readonly<{
        dark: readonly [12, 45, 40];
        light: readonly [130, 188, 157];
        roughness: 0.2;
        relief: 0.012;
        columns: 2;
        rows: 4;
        grout: 0.012;
        shoulder: 0.012;
        bevel: 0.065;
    }>;
    canewebbing: Readonly<{
        dark: readonly [27, 17, 8];
        light: readonly [221, 179, 106];
        roughness: 0.58;
        relief: 0.016;
        cells: 8;
        ribbonWidth: 0.13;
        diagonalWidth: 0.075;
    }>;
    rammedearth: Readonly<{
        dark: readonly [111, 60, 34];
        light: readonly [228, 194, 144];
        roughness: 0.86;
        relief: 0.008;
        layers: 8;
        warp: 0.12;
        fineWarp: 0.04;
        transition: 0.1;
        seamWidth: 0.05;
    }>;
    copperpatina: Readonly<{
        dark: readonly [177, 92, 51];
        light: readonly [49, 146, 124];
        roughness: 0.24;
        relief: 0.006;
        coverageStart: 0.4;
        coverageRange: 0.2;
    }>;
    birdseyemaple: Readonly<{
        dark: readonly [116, 67, 27];
        light: readonly [242, 218, 166];
        roughness: 0.38;
        relief: 0.003;
        cells: 6;
        radiusX: 0.22;
        radiusY: 0.28;
    }>;
    breezeblock: Readonly<{
        dark: readonly [21, 20, 17];
        light: readonly [225, 217, 193];
        roughness: 0.84;
        relief: 0.032;
        cells: 4;
        lobeOffset: 0.12;
        lobeRadius: 0.18;
        lobeShoulder: 0.01;
        grout: 0.012;
        edgeShoulder: 0.03;
    }>;
    basketweavepavers: Readonly<{
        dark: readonly [83, 42, 29];
        light: readonly [211, 135, 91];
        roughness: 0.86;
        relief: 0.018;
        cells: 4;
        grout: 0.018;
        shoulder: 0.04;
    }>;
    ripstop: Readonly<{
        dark: readonly [34, 48, 24];
        light: readonly [142, 157, 101];
        roughness: 0.48;
        relief: 0.002;
        cells: 4;
        threads: 64;
        reinforcementOffset: 0.0625;
        reinforcementWidth: 0.025;
    }>;
    octagondot: Readonly<{
        dark: readonly [34, 43, 51];
        light: readonly [235, 230, 214];
        roughness: 0.32;
        relief: 0.014;
        cells: 4;
        grout: 0.012;
        shoulder: 0.025;
        clippedCorner: 0.82;
        dotRadius: 0.15;
        dotShoulder: 0.006;
    }>;
    truchettiles: Readonly<{
        dark: readonly [21, 48, 74];
        light: readonly [238, 231, 206];
        roughness: 0.28;
        relief: 0.012;
        cells: 4;
        grout: 0.014;
        shoulder: 0.03;
        arcRadius: 0.5;
        arcWidthSquared: 0.055;
    }>;
    standingseam: Readonly<{
        dark: readonly [101, 116, 126];
        light: readonly [214, 225, 231];
        roughness: 0.32;
        relief: 0.035;
        panels: 4;
        capHalfWidth: 0.015;
        shoulder: 0.03;
        toeOffset: 0.065;
        toeWidth: 0.02;
    }>;
    damascus: Readonly<{
        dark: readonly [46, 56, 65];
        light: readonly [214, 223, 227];
        roughness: 0.22;
        relief: 0.002;
        cells: 4;
        layers: 20;
        foldRadius: 0.32;
        foldStrength: 3.2;
    }>;
    windmillpavers: Readonly<{
        dark: readonly [65, 38, 29];
        light: readonly [220, 148, 99];
        roughness: 0.86;
        relief: 0.045;
        cells: 2;
        grout: 0.035;
        shoulder: 0.045;
    }>;
    castiron: Readonly<{
        dark: readonly [56, 59, 61];
        light: readonly [145, 148, 150];
        roughness: 0.68;
        relief: 0.022;
        cells: 10;
        poreChance: 0.35;
        poreRadiusMin: 0.1;
        poreRadiusRange: 0.12;
    }>;
    porphyry: Readonly<{
        dark: readonly [96, 36, 45];
        light: readonly [222, 180, 158];
        roughness: 0.5;
        relief: 0.006;
        cells: 8;
        crystalChance: 0.8;
        halfLengthMin: 0.16;
        halfLengthRange: 0.12;
        halfWidthMin: 0.06;
        halfWidthRange: 0.07;
        edge: 0.018;
    }>;
    linen: Readonly<{
        dark: readonly [122, 110, 87];
        light: readonly [238, 226, 195];
        roughness: 0.91;
        relief: 0.03;
        threads: 16;
        halfWidth: 0.2;
        slubWidth: 0.23;
    }>;
    chippedenamel: Readonly<{
        dark: readonly [80, 84, 88];
        light: readonly [240, 237, 221];
        roughness: 0.14;
        relief: 0.012;
        cells: 4;
        chipChance: 0.6;
        radiusMin: 0.22;
        radiusRange: 0.07;
        edges: 5;
        edge: 0.025;
    }>;
    perforatedleather: Readonly<{
        dark: readonly [18, 9, 5];
        light: readonly [172, 103, 56];
        roughness: 0.44;
        relief: 0.014;
        cells: 8;
        coreRadius: 0.13;
        outerRadius: 0.24;
    }>;
    argyle: Readonly<{
        dark: readonly [55, 12, 26];
        light: readonly [239, 207, 194];
        roughness: 0.8;
        relief: 0.008;
        diamonds: 2;
        threads: 48;
        colorEdge: 0.08;
        lineOuter: 0.12;
        lineInner: 0.08;
    }>;
    chevronparquet: Readonly<{
        dark: readonly [35, 18, 9];
        light: readonly [210, 160, 91];
        roughness: 0.38;
        relief: 0.025;
        rows: 4;
        grainBands: 12;
        endGap: 0.02;
        endBevel: 0.05;
        sideGap: 0.015;
        sideBevel: 0.075;
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
    corrugatedcardboard: 0.064;
    creasedpaper: 0.24;
    layeredpaper: 0.16;
    wicker: 0.18;
    bamboo: 0.6;
    hammeredmetal: 0.24;
    galvanized: 0.36;
    corrugatedmetal: 1.2;
    perforatedmetal: 0.5;
    expandedmetal: 0.6;
    wiremesh: 0.09;
    velvet: 0.12;
    terrycloth: 0.09;
    boucle: 0.16;
    geode: 0.5;
    quartz: 0.24;
    pyrite: 0.3;
    shiplap: 0.9;
    glassblock: 0.4;
    thatch: 0.8;
    charredwood: 0.36;
    driftwood: 1.2;
    peelingpaint: 0.6;
    tiretread: 0.28;
    honeycomb: 0.12;
    frost: 0.35;
    stainedglass: 0.7;
    soapstone: 0.9;
    butcherblock: 0.45;
    wallpaper: 0.5;
    embroidery: 0.18;
    macrame: 0.24;
    brickpaving: 0.8;
    steppingstone: 1;
    woodendeck: 0.9;
    cheese: 0.3;
    sugarfrosting: 0.24;
    candleswax: 0.35;
    vinylrecord: 0.3;
    graphpaper: 0.3;
    notebookpaper: 0.3;
    lace: 0.24;
    crochet: 0.18;
    basketweave: 0.36;
    zipper: 0.12;
    velcro: 0.06;
    button: 0.12;
    traintracks: 0.6;
    manholecover: 0.6;
    speedbump: 0.9;
    circuitboard: 0.12;
    solarpanel: 0.24;
    heattile: 0.18;
    pianokeys: 0.16;
    drumskin: 0.4;
    gongsurface: 0.3;
    lensarray: 0.06;
    prismtape: 0.12;
    fresnel: 0.24;
    bandage: 0.12;
    pillblister: 0.18;
    sutures: 0.12;
    trellis: 0.3;
    terracottapot: 0.36;
    hedgerow: 0.24;
    collar: 0.06;
    petbed: 0.4;
    scratchpost: 0.12;
    runningtrack: 0.9;
    bouldermat: 0.6;
    pooltile: 0.24;
    envelope: 0.12;
    chalkboard: 0.6;
    corkboard: 0.18;
    snowdrift: 0.9;
    icicle: 0.24;
    dewdrops: 0.06;
    mooncrater: 0.6;
    starfield: 0.3;
    nebula: 0.45;
    pleats: 0.18;
    shoelace: 0.06;
    tassel: 0.12;
    woksurface: 0.12;
    cutlery: 0.1;
    choppingboard: 0.3;
    faucet: 0.24;
    showerhead: 0.18;
    bathmat: 0.3;
    blinds: 0.12;
    curtain: 0.24;
    shadecloth: 0.06;
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
    lotusleaf: 0.9;
    bananaleaf: 1.5;
    fernleaf: 0.66;
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
    pretzel: 0.2;
    bagel: 0.24;
    croissant: 0.24;
    butterflywing: 0.12;
    beetlewing: 0.16;
    spiderweb: 0.3;
    cirrus: 0.48;
    cumulus: 0.6;
    lightning: 0.9;
    kelp: 0.5;
    seaweed: 0.3;
    anemone: 0.24;
    candy: 0.18;
    marshmallow: 0.2;
    nougat: 0.24;
    frostedglass: 0.06;
    rippledglass: 0.18;
    bubbleglass: 0.12;
    saddlestitch: 0.16;
    tooledleather: 0.2;
    patentleather: 0.12;
    appleskin: 0.12;
    peachskin: 0.16;
    grapeskin: 0.1;
    broccoli: 0.18;
    cabbage: 0.24;
    onion: 0.16;
    bedsheet: 0.24;
    pillow: 0.3;
    mattress: 0.36;
    tealeaf: 0.12;
    matcha: 0.18;
    teabag: 0.08;
    sanddune: 0.48;
    pebblebeach: 0.18;
    foamedge: 0.12;
    lavaflow: 0.36;
    cooledlava: 0.24;
    ashfield: 0.4;
    stalactite: 0.3;
    flowstone: 0.36;
    cavefloor: 0.24;
    jam: 0.12;
    peanutbutter: 0.14;
    sprinkles: 0.1;
    icecream: 0.18;
    popsicle: 0.14;
    sorbet: 0.16;
    spaghetti: 0.2;
    macaroni: 0.16;
    lasagna: 0.24;
    origami: 0.2;
    paperlace: 0.12;
    papercut: 0.18;
    sunflower: 0.24;
    daisy: 0.2;
    clover: 0.24;
    puzzletile: 0.24;
    legobrick: 0.2;
    rubberband: 0.16;
    haybale: 0.5;
    corncrib: 0.3;
    fencepost: 0.18;
    poolfelt: 0.3;
    icesurface: 0.24;
    climbingwall: 0.4;
    oledpanel: 0.12;
    crtscanline: 0.16;
    keyboardkey: 0.24;
    filmstrip: 0.18;
    postagestamp: 0.24;
    halftoneprint: 0.06;
    radiator: 0.3;
    screwhead: 0.12;
    chainlink: 0.2;
    friedegg: 0.24;
    sushirice: 0.16;
    chocolatechip: 0.24;
    cargomat: 0.3;
    dashboardgrain: 0.24;
    licenseplate: 0.3;
    flowerbed: 0.3;
    grassstripe: 0.4;
    topiary: 0.28;
    confetti: 0.24;
    ribbonstreamer: 0.3;
    pinatafringe: 0.2;
    xylophone: 0.24;
    tambourine: 0.3;
    castanet: 0.2;
    pillcapsule: 0.24;
    pilltablet: 0.16;
    bathbomb: 0.2;
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
    basalt: 1.2;
    scoria: 0.2;
    obsidian: 0.3;
    malachite: 0.24;
    agate: 0.32;
    lapislazuli: 0.3;
    rice: 0.06;
    sesame: 0.05;
    coffeebeans: 0.1;
    braincoral: 0.24;
    starcoral: 0.18;
    seasponge: 0.16;
    houndstooth: 0.064;
    tartan: 0.16;
    damask: 0.24;
    zebrafur: 0.32;
    leopardfur: 0.36;
    giraffefur: 0.6;
    scallopshell: 0.28;
    oystershell: 0.32;
    nautilusshell: 0.24;
    walnutshell: 0.06;
    peanutshell: 0.04;
    almondshell: 0.035;
    cantaloupe: 0.14;
    dragonfruit: 0.18;
    kiwiskin: 0.045;
    rosepetal: 0.025;
    lilypetal: 0.055;
    fritillarypetal: 0.035;
    birchbark: 0.18;
    palmtrunk: 0.28;
    sycamorebark: 0.3;
    elephanthide: 0.3;
    ostrichleather: 0.1;
    sharkskin: 0.035;
    tactilepaving: 0.6;
    roadmarking: 2;
    draincover: 0.7;
    mushroomgills: 0.12;
    morel: 0.08;
    bracketfungus: 0.25;
    pineapple: 0.16;
    strawberry: 0.055;
    lychee: 0.055;
    sandpaper: 0.12;
    steelwool: 0.16;
    wirebrush: 0.1;
    cheesegrater: 0.2;
    ovenrack: 0.3;
    muffintin: 0.35;
    gauze: 0.09;
    elasticbandage: 0.14;
    icepack: 0.3;
    bubblewrap: 0.12;
    sequin: 0.096;
    pennyround: 0.2;
    volleyball: 0.3;
    bowlingball: 0.24;
    rugbyball: 0.28;
    wafflecone: 0.18;
    donutglaze: 0.24;
    brownie: 0.2;
    soapbar: 0.24;
    loofah: 0.2;
    scrubbypad: 0.14;
    orangeflesh: 0.12;
    kiwiflesh: 0.08;
    avocadoflesh: 0.1;
    turquoise: 0.16;
    rhodonite: 0.2;
    tigereye: 0.18;
    tatami: 0.16;
    flutedwood: 0.32;
    subwaytiles: 0.6;
    canewebbing: 0.24;
    rammedearth: 2;
    copperpatina: 0.5;
    birdseyemaple: 0.24;
    breezeblock: 0.8;
    basketweavepavers: 0.8;
    ripstop: 0.04;
    octagondot: 0.8;
    truchettiles: 0.8;
    standingseam: 2;
    damascus: 0.12;
    windmillpavers: 0.9;
    castiron: 0.1;
    porphyry: 0.3;
    linen: 0.04;
    chippedenamel: 0.25;
    perforatedleather: 0.04;
    argyle: 0.16;
    chevronparquet: 0.6;
}>;

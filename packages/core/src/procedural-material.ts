import { Texture } from '../../assets/src/index.js';
import {
  proceduralMaterialLimits,
  proceduralTileMeters,
} from '../../../src/data/materials.js';
import { PBRMaterial, type PBRMaterialOptions } from './pbr-material.js';
import { generateProceduralMaps } from './procedural-material-maps.js';

export type ProceduralMaterialKind =
  | 'wood'
  | 'brick'
  | 'stone'
  | 'metal'
  | 'fabric'
  | 'marble'
  | 'concrete'
  | 'tiles'
  | 'leather'
  | 'sand'
  | 'rust'
  | 'snow'
  | 'asphalt'
  | 'gravel'
  | 'cobblestone'
  | 'bark'
  | 'moss'
  | 'mud'
  | 'granite'
  | 'slate'
  | 'terrazzo'
  | 'denim'
  | 'burlap'
  | 'carpet'
  | 'plaster'
  | 'terracotta'
  | 'cork'
  | 'rubber'
  | 'carbonfiber'
  | 'diamondplate'
  | 'paper'
  | 'corrugatedcardboard'
  | 'creasedpaper'
  | 'layeredpaper'
  | 'wicker'
  | 'bamboo'
  | 'hammeredmetal'
  | 'galvanized'
  | 'corrugatedmetal'
  | 'perforatedmetal'
  | 'expandedmetal'
  | 'wiremesh'
  | 'velvet'
  | 'terrycloth'
  | 'boucle'
  | 'geode'
  | 'quartz'
  | 'pyrite'
  | 'shiplap'
  | 'glassblock'
  | 'thatch'
  | 'charredwood'
  | 'driftwood'
  | 'peelingpaint'
  | 'tiretread'
  | 'honeycomb'
  | 'frost'
  | 'stainedglass'
  | 'soapstone'
  | 'butcherblock'
  | 'wallpaper'
  | 'embroidery'
  | 'macrame'
  | 'brickpaving'
  | 'steppingstone'
  | 'woodendeck'
  | 'cheese'
  | 'sugarfrosting'
  | 'candleswax'
  | 'vinylrecord'
  | 'graphpaper'
  | 'notebookpaper'
  | 'lace'
  | 'crochet'
  | 'basketweave'
  | 'zipper'
  | 'velcro'
  | 'button'
  | 'traintracks'
  | 'manholecover'
  | 'speedbump'
  | 'circuitboard'
  | 'solarpanel'
  | 'heattile'
  | 'pianokeys'
  | 'drumskin'
  | 'gongsurface'
  | 'lensarray'
  | 'prismtape'
  | 'fresnel'
  | 'bandage'
  | 'pillblister'
  | 'sutures'
  | 'trellis'
  | 'terracottapot'
  | 'hedgerow'
  | 'collar'
  | 'petbed'
  | 'scratchpost'
  | 'runningtrack'
  | 'bouldermat'
  | 'pooltile'
  | 'envelope'
  | 'chalkboard'
  | 'corkboard'
  | 'snowdrift'
  | 'icicle'
  | 'dewdrops'
  | 'mooncrater'
  | 'starfield'
  | 'nebula'
  | 'pleats'
  | 'shoelace'
  | 'tassel'
  | 'woksurface'
  | 'cutlery'
  | 'choppingboard'
  | 'faucet'
  | 'showerhead'
  | 'bathmat'
  | 'blinds'
  | 'curtain'
  | 'shadecloth'
  | 'sandstone'
  | 'travertine'
  | 'pumice'
  | 'parquet'
  | 'mosaic'
  | 'hexagontiles'
  | 'knit'
  | 'corduroy'
  | 'felt'
  | 'roofshingles'
  | 'rooftiles'
  | 'stucco'
  | 'lichen'
  | 'leaflitter'
  | 'lotusleaf'
  | 'bananaleaf'
  | 'fernleaf'
  | 'endgrain'
  | 'acousticfoam'
  | 'closedcellfoam'
  | 'linoleum'
  | 'suede'
  | 'snakeskin'
  | 'crocodile'
  | 'herringbone'
  | 'tweed'
  | 'seersucker'
  | 'knurledmetal'
  | 'engineturned'
  | 'goldleaf'
  | 'orangepeel'
  | 'coconut'
  | 'watermelon'
  | 'limestone'
  | 'breccia'
  | 'gneiss'
  | 'plywood'
  | 'osb'
  | 'chipboard'
  | 'wafflecloth'
  | 'cableknit'
  | 'quilting'
  | 'crackleglaze'
  | 'flutedceramic'
  | 'encaustictiles'
  | 'fishscales'
  | 'tortoiseshell'
  | 'feathers'
  | 'reedmat'
  | 'rope'
  | 'straw'
  | 'studdedrubber'
  | 'groovedrubber'
  | 'recycledrubber'
  | 'breadcrust'
  | 'wafer'
  | 'chocolate'
  | 'pretzel'
  | 'bagel'
  | 'croissant'
  | 'butterflywing'
  | 'beetlewing'
  | 'spiderweb'
  | 'cirrus'
  | 'cumulus'
  | 'lightning'
  | 'kelp'
  | 'seaweed'
  | 'anemone'
  | 'candy'
  | 'marshmallow'
  | 'nougat'
  | 'frostedglass'
  | 'rippledglass'
  | 'bubbleglass'
  | 'saddlestitch'
  | 'tooledleather'
  | 'patentleather'
  | 'appleskin'
  | 'peachskin'
  | 'grapeskin'
  | 'broccoli'
  | 'cabbage'
  | 'onion'
  | 'bedsheet'
  | 'pillow'
  | 'mattress'
  | 'tealeaf'
  | 'matcha'
  | 'teabag'
  | 'sanddune'
  | 'pebblebeach'
  | 'foamedge'
  | 'lavaflow'
  | 'cooledlava'
  | 'ashfield'
  | 'stalactite'
  | 'flowstone'
  | 'cavefloor'
  | 'jam'
  | 'peanutbutter'
  | 'sprinkles'
  | 'icecream'
  | 'popsicle'
  | 'sorbet'
  | 'spaghetti'
  | 'macaroni'
  | 'lasagna'
  | 'origami'
  | 'paperlace'
  | 'papercut'
  | 'sunflower'
  | 'daisy'
  | 'clover'
  | 'puzzletile'
  | 'legobrick'
  | 'rubberband'
  | 'haybale'
  | 'corncrib'
  | 'fencepost'
  | 'poolfelt'
  | 'icesurface'
  | 'climbingwall'
  | 'oledpanel'
  | 'crtscanline'
  | 'keyboardkey'
  | 'filmstrip'
  | 'postagestamp'
  | 'halftoneprint'
  | 'radiator'
  | 'screwhead'
  | 'chainlink'
  | 'friedegg'
  | 'sushirice'
  | 'chocolatechip'
  | 'cargomat'
  | 'dashboardgrain'
  | 'licenseplate'
  | 'flowerbed'
  | 'grassstripe'
  | 'topiary'
  | 'confetti'
  | 'ribbonstreamer'
  | 'pinatafringe'
  | 'xylophone'
  | 'tambourine'
  | 'castanet'
  | 'pillcapsule'
  | 'pilltablet'
  | 'bathbomb'
  | 'basketball'
  | 'tennisball'
  | 'golfball'
  | 'boardformedconcrete'
  | 'ribbedconcrete'
  | 'splitfaceblock'
  | 'chainmail'
  | 'rivetedmetal'
  | 'weldedmetal'
  | 'cactus'
  | 'pinecone'
  | 'corncob'
  | 'basalt'
  | 'scoria'
  | 'obsidian'
  | 'malachite'
  | 'agate'
  | 'lapislazuli'
  | 'rice'
  | 'sesame'
  | 'coffeebeans'
  | 'braincoral'
  | 'starcoral'
  | 'seasponge'
  | 'houndstooth'
  | 'tartan'
  | 'damask'
  | 'zebrafur'
  | 'leopardfur'
  | 'giraffefur'
  | 'scallopshell'
  | 'oystershell'
  | 'nautilusshell'
  | 'walnutshell'
  | 'peanutshell'
  | 'almondshell'
  | 'cantaloupe'
  | 'dragonfruit'
  | 'kiwiskin'
  | 'rosepetal'
  | 'lilypetal'
  | 'fritillarypetal'
  | 'birchbark'
  | 'palmtrunk'
  | 'sycamorebark'
  | 'elephanthide'
  | 'ostrichleather'
  | 'sharkskin'
  | 'tactilepaving'
  | 'roadmarking'
  | 'draincover'
  | 'mushroomgills'
  | 'morel'
  | 'bracketfungus'
  | 'pineapple'
  | 'strawberry'
  | 'lychee'
  | 'sandpaper'
  | 'steelwool'
  | 'wirebrush'
  | 'cheesegrater'
  | 'ovenrack'
  | 'muffintin'
  | 'gauze'
  | 'elasticbandage'
  | 'icepack'
  | 'bubblewrap'
  | 'sequin'
  | 'pennyround'
  | 'volleyball'
  | 'bowlingball'
  | 'rugbyball'
  | 'wafflecone'
  | 'donutglaze'
  | 'brownie'
  | 'soapbar'
  | 'loofah'
  | 'scrubbypad'
  | 'orangeflesh'
  | 'kiwiflesh'
  | 'avocadoflesh'
  | 'turquoise'
  | 'rhodonite'
  | 'tigereye'
  | 'tatami'
  | 'flutedwood'
  | 'subwaytiles'
  | 'canewebbing'
  | 'rammedearth'
  | 'copperpatina'
  | 'birdseyemaple'
  | 'breezeblock'
  | 'basketweavepavers'
  | 'ripstop'
  | 'octagondot'
  | 'truchettiles'
  | 'standingseam'
  | 'damascus'
  | 'windmillpavers'
  | 'castiron'
  | 'porphyry'
  | 'linen'
  | 'chippedenamel'
  | 'perforatedleather'
  | 'argyle'
  | 'chevronparquet'
  | 'ginkgoleaf'
  | 'pressedtin'
  | 'sashiko'
  | 'ashlar'
  | 'gabion'
  | 'gingham'
  | 'mossypavers'
  | 'bamboocrosscut'
  | 'moire'
  | 'oakleaf'
  | 'rhombille'
  | 'fossillimestone'
  | 'seigaihatiles'
  | 'tuftedleather'
  | 'louveredmetal'
  | 'herringbonebrick'
  | 'shibori'
  | 'scallopedslate'
  | 'saltpan'
  | 'dogbonepavers'
  | 'palmendgrain'
  | 'asanoha'
  | 'lotusseedpod'
  | 'crowncaps'
  | 'cofferedconcrete'
  | 'woodworm'
  | 'calcadawaves'
  | 'ikat'
  | 'slottedwood'
  | 'hollyleaf'
  | 'englishbond'
  | 'rebar'
  | 'starfruit'
  | 'diamondrustication'
  | 'bargello'
  | 'saffiano'
  | 'cocoamat'
  | 'suminagashi'
  | 'vermiculite'
  | 'cairotiles'
  | 'guilloche'
  | 'seaurchintest'
  | 'crystallineglaze';

export interface ProceduralMaterialOptions {
  size?: number;
  seed?: number;
  /** 1 keeps the authored contrast. Finite and at least 0. */
  contrast?: number;
  /** Added to authored roughness, then clamped. Default 0. */
  roughnessBias?: number;
  /** UV repeats of the generated tile. Default 1. */
  repeats?: number;
}

/** UV repeats so one mesh of `meters` uses the preset's physical tile size. */
export function proceduralRepeats(
  kind: ProceduralMaterialKind,
  meters: number,
): number {
  if (!Number.isFinite(meters) || meters <= 0)
    throw new RangeError(
      'Procedural surface size must be finite and positive.',
    );
  return meters / proceduralTileMeters[kind];
}

interface ProceduralTextures {
  readonly baseColor: Texture;
  readonly normal: Texture;
  readonly metallicRoughness: Texture;
  readonly occlusion: Texture;
}

const kinds: readonly ProceduralMaterialKind[] = [
  'wood',
  'brick',
  'stone',
  'metal',
  'fabric',
  'marble',
  'concrete',
  'tiles',
  'leather',
  'sand',
  'rust',
  'snow',
  'asphalt',
  'gravel',
  'cobblestone',
  'bark',
  'moss',
  'mud',
  'granite',
  'slate',
  'terrazzo',
  'denim',
  'burlap',
  'carpet',
  'plaster',
  'terracotta',
  'cork',
  'rubber',
  'carbonfiber',
  'diamondplate',
  'paper',
  'corrugatedcardboard',
  'creasedpaper',
  'layeredpaper',
  'wicker',
  'bamboo',
  'hammeredmetal',
  'galvanized',
  'corrugatedmetal',
  'perforatedmetal',
  'expandedmetal',
  'wiremesh',
  'velvet',
  'terrycloth',
  'boucle',
  'geode',
  'quartz',
  'pyrite',
  'shiplap',
  'glassblock',
  'thatch',
  'charredwood',
  'driftwood',
  'peelingpaint',
  'tiretread',
  'honeycomb',
  'frost',
  'stainedglass',
  'soapstone',
  'butcherblock',
  'wallpaper',
  'embroidery',
  'macrame',
  'brickpaving',
  'steppingstone',
  'woodendeck',
  'cheese',
  'sugarfrosting',
  'candleswax',
  'vinylrecord',
  'graphpaper',
  'notebookpaper',
  'lace',
  'crochet',
  'basketweave',
  'zipper',
  'velcro',
  'button',
  'traintracks',
  'manholecover',
  'speedbump',
  'circuitboard',
  'solarpanel',
  'heattile',
  'pianokeys',
  'drumskin',
  'gongsurface',
  'lensarray',
  'prismtape',
  'fresnel',
  'bandage',
  'pillblister',
  'sutures',
  'trellis',
  'terracottapot',
  'hedgerow',
  'collar',
  'petbed',
  'scratchpost',
  'runningtrack',
  'bouldermat',
  'pooltile',
  'envelope',
  'chalkboard',
  'corkboard',
  'snowdrift',
  'icicle',
  'dewdrops',
  'mooncrater',
  'starfield',
  'nebula',
  'pleats',
  'shoelace',
  'tassel',
  'woksurface',
  'cutlery',
  'choppingboard',
  'faucet',
  'showerhead',
  'bathmat',
  'blinds',
  'curtain',
  'shadecloth',
  'sandstone',
  'travertine',
  'pumice',
  'parquet',
  'mosaic',
  'hexagontiles',
  'knit',
  'corduroy',
  'felt',
  'roofshingles',
  'rooftiles',
  'stucco',
  'lichen',
  'leaflitter',
  'lotusleaf',
  'bananaleaf',
  'fernleaf',
  'endgrain',
  'acousticfoam',
  'closedcellfoam',
  'linoleum',
  'suede',
  'snakeskin',
  'crocodile',
  'herringbone',
  'tweed',
  'seersucker',
  'knurledmetal',
  'engineturned',
  'goldleaf',
  'orangepeel',
  'coconut',
  'watermelon',
  'limestone',
  'breccia',
  'gneiss',
  'plywood',
  'osb',
  'chipboard',
  'wafflecloth',
  'cableknit',
  'quilting',
  'crackleglaze',
  'flutedceramic',
  'encaustictiles',
  'fishscales',
  'tortoiseshell',
  'feathers',
  'reedmat',
  'rope',
  'straw',
  'studdedrubber',
  'groovedrubber',
  'recycledrubber',
  'breadcrust',
  'wafer',
  'chocolate',
  'pretzel',
  'bagel',
  'croissant',
  'butterflywing',
  'beetlewing',
  'spiderweb',
  'cirrus',
  'cumulus',
  'lightning',
  'kelp',
  'seaweed',
  'anemone',
  'candy',
  'marshmallow',
  'nougat',
  'frostedglass',
  'rippledglass',
  'bubbleglass',
  'saddlestitch',
  'tooledleather',
  'patentleather',
  'appleskin',
  'peachskin',
  'grapeskin',
  'broccoli',
  'cabbage',
  'onion',
  'bedsheet',
  'pillow',
  'mattress',
  'tealeaf',
  'matcha',
  'teabag',
  'sanddune',
  'pebblebeach',
  'foamedge',
  'lavaflow',
  'cooledlava',
  'ashfield',
  'stalactite',
  'flowstone',
  'cavefloor',
  'jam',
  'peanutbutter',
  'sprinkles',
  'icecream',
  'popsicle',
  'sorbet',
  'spaghetti',
  'macaroni',
  'lasagna',
  'origami',
  'paperlace',
  'papercut',
  'sunflower',
  'daisy',
  'clover',
  'puzzletile',
  'legobrick',
  'rubberband',
  'haybale',
  'corncrib',
  'fencepost',
  'poolfelt',
  'icesurface',
  'climbingwall',
  'oledpanel',
  'crtscanline',
  'keyboardkey',
  'filmstrip',
  'postagestamp',
  'halftoneprint',
  'radiator',
  'screwhead',
  'chainlink',
  'friedegg',
  'sushirice',
  'chocolatechip',
  'cargomat',
  'dashboardgrain',
  'licenseplate',
  'flowerbed',
  'grassstripe',
  'topiary',
  'confetti',
  'ribbonstreamer',
  'pinatafringe',
  'xylophone',
  'tambourine',
  'castanet',
  'pillcapsule',
  'pilltablet',
  'bathbomb',
  'basketball',
  'tennisball',
  'golfball',
  'boardformedconcrete',
  'ribbedconcrete',
  'splitfaceblock',
  'chainmail',
  'rivetedmetal',
  'weldedmetal',
  'cactus',
  'pinecone',
  'corncob',
  'basalt',
  'scoria',
  'obsidian',
  'malachite',
  'agate',
  'lapislazuli',
  'rice',
  'sesame',
  'coffeebeans',
  'braincoral',
  'starcoral',
  'seasponge',
  'houndstooth',
  'tartan',
  'damask',
  'zebrafur',
  'leopardfur',
  'giraffefur',
  'scallopshell',
  'oystershell',
  'nautilusshell',
  'walnutshell',
  'peanutshell',
  'almondshell',
  'cantaloupe',
  'dragonfruit',
  'kiwiskin',
  'rosepetal',
  'lilypetal',
  'fritillarypetal',
  'birchbark',
  'palmtrunk',
  'sycamorebark',
  'elephanthide',
  'ostrichleather',
  'sharkskin',
  'tactilepaving',
  'roadmarking',
  'draincover',
  'mushroomgills',
  'morel',
  'bracketfungus',
  'pineapple',
  'strawberry',
  'lychee',
  'sandpaper',
  'steelwool',
  'wirebrush',
  'cheesegrater',
  'ovenrack',
  'muffintin',
  'gauze',
  'elasticbandage',
  'icepack',
  'bubblewrap',
  'sequin',
  'pennyround',
  'volleyball',
  'bowlingball',
  'rugbyball',
  'wafflecone',
  'donutglaze',
  'brownie',
  'soapbar',
  'loofah',
  'scrubbypad',
  'orangeflesh',
  'kiwiflesh',
  'avocadoflesh',
  'turquoise',
  'rhodonite',
  'tigereye',
  'tatami',
  'flutedwood',
  'subwaytiles',
  'canewebbing',
  'rammedearth',
  'copperpatina',
  'birdseyemaple',
  'breezeblock',
  'basketweavepavers',
  'ripstop',
  'octagondot',
  'truchettiles',
  'standingseam',
  'damascus',
  'windmillpavers',
  'castiron',
  'porphyry',
  'linen',
  'chippedenamel',
  'perforatedleather',
  'argyle',
  'chevronparquet',
  'ginkgoleaf',
  'pressedtin',
  'sashiko',
  'ashlar',
  'gabion',
  'gingham',
  'mossypavers',
  'bamboocrosscut',
  'moire',
  'oakleaf',
  'rhombille',
  'fossillimestone',
  'seigaihatiles',
  'tuftedleather',
  'louveredmetal',
  'herringbonebrick',
  'shibori',
  'scallopedslate',
  'saltpan',
  'dogbonepavers',
  'palmendgrain',
  'asanoha',
  'lotusseedpod',
  'crowncaps',
  'cofferedconcrete',
  'woodworm',
  'calcadawaves',
  'ikat',
  'slottedwood',
  'hollyleaf',
  'englishbond',
  'rebar',
  'starfruit',
  'diamondrustication',
  'bargello',
  'saffiano',
  'cocoamat',
  'suminagashi',
  'vermiculite',
  'cairotiles',
  'guilloche',
  'seaurchintest',
  'crystallineglaze',
];
const repeatSampler = Object.freeze({
  addressModeU: 'repeat',
  addressModeV: 'repeat',
} as const);

/** Owns four generated maps. Materials, meshes and scenes only borrow them. */
export class ProceduralMaterial {
  readonly kind: ProceduralMaterialKind;
  readonly textures: Readonly<ProceduralTextures>;
  readonly material: PBRMaterial;
  private disposed = false;

  private constructor(
    kind: ProceduralMaterialKind,
    textures: ProceduralTextures,
    readonly repeats: number,
  ) {
    this.kind = kind;
    this.textures = Object.freeze(textures);
    this.material = this.createMaterial();
  }

  static async create(
    kind: ProceduralMaterialKind,
    options: ProceduralMaterialOptions = {},
  ): Promise<ProceduralMaterial> {
    if (!kinds.includes(kind))
      throw new RangeError('Unknown procedural material kind.');
    if (!options || typeof options !== 'object' || Array.isArray(options))
      throw new TypeError('Procedural material options must be an object.');
    const size =
      options.size === undefined
        ? proceduralMaterialLimits.defaultSize
        : options.size;
    const seed =
      options.seed === undefined
        ? proceduralMaterialLimits.defaultSeed
        : options.seed;
    if (
      !Number.isInteger(size) ||
      size < proceduralMaterialLimits.minSize ||
      size > proceduralMaterialLimits.maxSize
    )
      throw new RangeError(
        'Procedural material size must be an integer between 32 and 1024.',
      );
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
      throw new RangeError(
        'Procedural material seed must be an unsigned 32-bit integer.',
      );
    const contrast = options.contrast ?? 1;
    const roughnessBias = options.roughnessBias ?? 0;
    const repeats = options.repeats ?? 1;
    if (
      !Number.isFinite(contrast) ||
      contrast < 0 ||
      !Number.isFinite(roughnessBias) ||
      roughnessBias < -1 ||
      roughnessBias > 1 ||
      !Number.isFinite(repeats) ||
      repeats <= 0
    )
      throw new RangeError(
        'Procedural contrast must be finite and nonnegative, roughnessBias within -1..1, and repeats finite and positive.',
      );
    const maps = generateProceduralMaps(kind, size, seed, {
      contrast,
      roughnessBias,
    });
    const acquired: Texture[] = [];
    // Sequential acquisition keeps cleanup deterministic even when decoding a later map fails.
    try {
      for (const pixels of [
        maps.baseColor,
        maps.normal,
        maps.metallicRoughness,
        maps.occlusion,
      ]) {
        const image = new ImageData(size, size);
        image.data.set(pixels);
        acquired.push(await Texture.fromImage(image));
      }
      return new ProceduralMaterial(
        kind,
        {
          baseColor: acquired[0]!,
          normal: acquired[1]!,
          metallicRoughness: acquired[2]!,
          occlusion: acquired[3]!,
        },
        repeats,
      );
    } catch (error) {
      for (const texture of acquired) texture.destroy();
      throw error;
    }
  }

  /** Creates an independent material borrowing these maps; overrides never transfer ownership. */
  createMaterial(options: Partial<PBRMaterialOptions> = {}): PBRMaterial {
    if (this.disposed)
      throw new Error(
        'Cannot create a material from a destroyed procedural preset.',
      );
    const scale = [this.repeats, this.repeats] as const;
    return new PBRMaterial({
      texture: this.textures.baseColor,
      normalTexture: this.textures.normal,
      metallicRoughnessTexture: this.textures.metallicRoughness,
      occlusionTexture: this.textures.occlusion,
      textureCoordinates:
        this.repeats === 1
          ? undefined
          : {
              texture: { scale },
              metallicRoughness: { scale },
              normal: { scale },
              occlusion: { scale },
            },
      metallic:
        this.kind === 'metal' ||
        this.kind === 'rust' ||
        this.kind === 'copperpatina' ||
        this.kind === 'chippedenamel' ||
        this.kind === 'gabion' ||
        this.kind === 'diamondplate' ||
        this.kind === 'hammeredmetal' ||
        this.kind === 'galvanized' ||
        this.kind === 'corrugatedmetal' ||
        this.kind === 'standingseam' ||
        this.kind === 'damascus' ||
        this.kind === 'castiron' ||
        this.kind === 'pressedtin' ||
        this.kind === 'louveredmetal' ||
        this.kind === 'crowncaps' ||
        this.kind === 'rebar' ||
        this.kind === 'guilloche' ||
        this.kind === 'perforatedmetal' ||
        this.kind === 'expandedmetal' ||
        this.kind === 'wiremesh' ||
        this.kind === 'draincover' ||
        this.kind === 'pyrite' ||
        this.kind === 'knurledmetal' ||
        this.kind === 'engineturned' ||
        this.kind === 'goldleaf' ||
        this.kind === 'chainmail' ||
        this.kind === 'rivetedmetal' ||
        this.kind === 'weldedmetal'
          ? 1
          : 0,
      roughness: 1,
      alphaMode: 'OPAQUE',
      textureSampler: repeatSampler,
      normalSampler: repeatSampler,
      metallicRoughnessSampler: repeatSampler,
      occlusionSampler: repeatSampler,
      ...options,
    });
  }

  get destroyed(): boolean {
    return this.disposed;
  }

  /** Remove every consumer before releasing this preset's maps. Does not destroy materials. */
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.textures.baseColor.destroy();
    this.textures.normal.destroy();
    this.textures.metallicRoughness.destroy();
    this.textures.occlusion.destroy();
  }
}

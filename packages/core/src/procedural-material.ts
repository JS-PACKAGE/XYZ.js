import { Texture } from '../../assets/src/index.js';
import {
  proceduralMaterialLimits,
  proceduralTileMeters,
} from '../../../src/data/materials.js';
import {
  NativeWorkerPool,
  WorkerJobError,
  type NativeWorkerPoolOptions,
  type WorkerJobDefinition,
} from '../../assets/src/worker-jobs.js';
import { PBRMaterial, type PBRMaterialOptions } from './pbr-material.js';
import {
  generateProceduralMaps,
  type ProceduralMaps,
} from './procedural-material-maps.js';

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
  | 'crystallineglaze'
  | 'shirring'
  | 'sunburstveneer'
  | 'rakedgravel'
  | 'flintwall'
  | 'frenchknots'
  | 'artichoke'
  | 'splitlockwashers'
  | 'flemishbond'
  | 'satinweave'
  | 'lotusroot'
  | 'cardboardedge'
  | 'hexnuts'
  | 'orbicularjasper'
  | 'acornbarnacles'
  | 'circularpavers'
  | 'snowflaketiles'
  | 'sawblades'
  | 'pistachios'
  | 'polkadotfabric'
  | 'cucumberslices'
  | 'monsteraleaf'
  | 'crossstitch'
  | 'staranise'
  | 'logcabinparquet'
  | 'countersunkmetal'
  | 'trilobitefossil'
  | 'eyeletcotton'
  | 'dendriticagate'
  | 'ravioli'
  | 'rollerchain'
  | 'mapleleaf'
  | 'smocking'
  | 'quatrefoiltile'
  | 'okraslice'
  | 'eggcarton'
  | 'greekkey'
  | 'seedbeads';

export interface ProceduralMaterialOptions {
  size?: number;
  seed?: number;
  /** Generate a linear height map; parallax still requires finish.heightScale. */
  heightMap?: boolean;
  /** 1 keeps the authored contrast. Finite and at least 0. */
  contrast?: number;
  /** Added to authored roughness, then clamped. Default 0. */
  roughnessBias?: number;
  /** UV repeats of the generated tile. Default 1. */
  repeats?: number;
  /**
   * Per-channel multipliers for the authored sRGB pigment, each finite and
   * within 0..4. Omitted keeps the authored colors byte-identical.
   */
  tint?: readonly [number, number, number];
  /**
   * Generates the maps on this caller-owned pool instead of the calling thread,
   * using `createProceduralWorkerPool()` or an equivalent trusted module.
   * Output is byte-identical to synchronous generation; the pool is borrowed.
   */
  workerPool?: NativeWorkerPool;
  /**
   * Reuses generated CPU maps for identical kind/size/seed/contrast/
   * roughnessBias/tint/heightMap. Every preset still owns its own textures.
   */
  cache?: ProceduralMapCache;
}

/** Validated generation inputs sent to a trusted procedural worker. */
export interface ProceduralMapsRequest {
  readonly kind: ProceduralMaterialKind;
  readonly size: number;
  readonly seed: number;
  readonly contrast: number;
  readonly roughnessBias: number;
  readonly tint?: readonly [number, number, number];
  readonly heightMap?: boolean;
}

function decodeProceduralMaps(value: unknown): ProceduralMaps {
  if (!value || typeof value !== 'object')
    throw new TypeError('A procedural maps response is required.');
  const maps = value as ProceduralMaps;
  const length = (maps.baseColor as unknown as Uint8ClampedArray | undefined)
    ?.length;
  const side = Math.sqrt((length ?? 0) / 4);
  if (
    !Number.isInteger(side) ||
    side < proceduralMaterialLimits.minSize ||
    side > proceduralMaterialLimits.maxSize ||
    ![
      maps.baseColor,
      maps.normal,
      maps.metallicRoughness,
      maps.occlusion,
    ].every(
      (stream) =>
        stream instanceof Uint8ClampedArray && stream.length === length,
    ) ||
    (maps.height !== undefined &&
      (!(maps.height instanceof Uint8ClampedArray) ||
        maps.height.length !== length))
  )
    throw new RangeError('Worker procedural maps do not match their size.');
  return maps;
}

export const proceduralMapsJob: WorkerJobDefinition<
  ProceduralMapsRequest,
  ProceduralMaps
> = {
  type: 'procedural.maps',
  decode: decodeProceduralMaps,
  release() {
    // Responses own only ArrayBuffers; dropping the reference reclaims them.
  },
};

/** Resolves to a real emitted .js module in the published dist tree. */
export function proceduralWorkerURL(): URL {
  return new URL('./workers/procedural-material.worker.js', import.meta.url);
}

/** Static native Worker construction is visible to bundlers. */
export function createProceduralWorkerPool(
  options: Omit<NativeWorkerPoolOptions, 'moduleURL' | 'workerFactory'> = {},
): NativeWorkerPool {
  if (typeof Worker === 'undefined')
    throw new WorkerJobError(
      'unsupported',
      'Native module Workers are unavailable.',
    );
  return new NativeWorkerPool({
    ...options,
    moduleURL: proceduralWorkerURL(),
    workerFactory: () =>
      new Worker(
        new URL('./workers/procedural-material.worker.js', import.meta.url),
        { type: 'module' },
      ),
  });
}

export interface ProceduralMapCacheOptions {
  /** Retained map bytes, including optional RGBA height maps. Default 64 MiB. */
  maxBytes?: number;
  /** Retained entries. Default 32. */
  maxEntries?: number;
}

/**
 * Caller-owned, bounded least-recently-used cache of generated CPU maps.
 * Concurrent identical requests share one generation; failures are not cached.
 * Cached arrays are never handed out, only copied into new textures.
 */
export class ProceduralMapCache {
  readonly maxBytes: number;
  readonly maxEntries: number;
  private readonly entries = new Map<string, ProceduralMaps>();
  private readonly pending = new Map<string, Promise<ProceduralMaps>>();
  private retained = 0;
  private hitCount = 0;
  private missCount = 0;

  constructor(options: ProceduralMapCacheOptions = {}) {
    const maxBytes =
      options.maxBytes ?? proceduralMaterialLimits.cacheDefaultBytes;
    const maxEntries =
      options.maxEntries ?? proceduralMaterialLimits.cacheDefaultEntries;
    if (
      !Number.isSafeInteger(maxBytes) ||
      maxBytes < 0 ||
      maxBytes > proceduralMaterialLimits.cacheMaxBytes ||
      !Number.isSafeInteger(maxEntries) ||
      maxEntries < 0 ||
      maxEntries > proceduralMaterialLimits.cacheMaxEntries
    )
      throw new RangeError(
        'Procedural cache maxBytes must be an integer 0..1 GiB and maxEntries 0..4096.',
      );
    this.maxBytes = maxBytes;
    this.maxEntries = maxEntries;
  }

  /** Number of retained entries. */
  get size(): number {
    return this.entries.size;
  }

  /** Bytes retained by cached maps. */
  get bytes(): number {
    return this.retained;
  }

  get hits(): number {
    return this.hitCount;
  }

  get misses(): number {
    return this.missCount;
  }

  /** Drops retained maps. Generations already in flight still complete and are then retained. */
  clear(): void {
    this.entries.clear();
    this.retained = 0;
  }

  /** @internal Used by ProceduralMaterial.create with an already validated request. */
  async acquire(
    request: ProceduralMapsRequest,
    generate: () => Promise<ProceduralMaps>,
  ): Promise<ProceduralMaps> {
    const key = [
      request.kind,
      request.size,
      request.seed,
      request.contrast,
      request.roughnessBias,
      request.tint?.join(',') ?? '',
      request.heightMap ? 1 : 0,
    ].join('|');
    const cached = this.entries.get(key);
    if (cached) {
      this.hitCount++;
      // Reinsert to mark as most recently used.
      this.entries.delete(key);
      this.entries.set(key, cached);
      return cached;
    }
    const inFlight = this.pending.get(key);
    if (inFlight) {
      this.hitCount++;
      return inFlight;
    }
    this.missCount++;
    const promise = generate();
    this.pending.set(key, promise);
    try {
      const maps = await promise;
      this.store(key, maps);
      return maps;
    } finally {
      this.pending.delete(key);
    }
  }

  private store(key: string, maps: ProceduralMaps): void {
    const bytes =
      maps.baseColor.byteLength * 4 + (maps.height?.byteLength ?? 0);
    if (bytes > this.maxBytes || this.maxEntries === 0) return;
    this.entries.set(key, maps);
    this.retained += bytes;
    for (const [oldest, old] of this.entries) {
      if (
        this.retained <= this.maxBytes &&
        this.entries.size <= this.maxEntries
      )
        break;
      this.entries.delete(oldest);
      this.retained -=
        old.baseColor.byteLength * 4 + (old.height?.byteLength ?? 0);
    }
  }
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
  readonly height?: Texture;
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
  'shirring',
  'sunburstveneer',
  'rakedgravel',
  'flintwall',
  'frenchknots',
  'artichoke',
  'splitlockwashers',
  'flemishbond',
  'satinweave',
  'lotusroot',
  'cardboardedge',
  'hexnuts',
  'orbicularjasper',
  'acornbarnacles',
  'circularpavers',
  'snowflaketiles',
  'sawblades',
  'pistachios',
  'polkadotfabric',
  'cucumberslices',
  'monsteraleaf',
  'crossstitch',
  'staranise',
  'logcabinparquet',
  'countersunkmetal',
  'trilobitefossil',
  'eyeletcotton',
  'dendriticagate',
  'ravioli',
  'rollerchain',
  'mapleleaf',
  'smocking',
  'quatrefoiltile',
  'okraslice',
  'eggcarton',
  'greekkey',
  'seedbeads',
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
    const tint = options.tint;
    if (
      tint !== undefined &&
      (!Array.isArray(tint) ||
        tint.length !== 3 ||
        !tint.every(
          (value) =>
            typeof value === 'number' &&
            Number.isFinite(value) &&
            value >= 0 &&
            value <= 4,
        ))
    )
      throw new RangeError(
        'Procedural tint must be three finite multipliers within 0..4.',
      );
    if (
      options.heightMap !== undefined &&
      typeof options.heightMap !== 'boolean'
    )
      throw new TypeError('Procedural heightMap must be a boolean.');
    const pool = options.workerPool;
    if (pool !== undefined && !(pool instanceof NativeWorkerPool))
      throw new TypeError('Procedural workerPool must be a NativeWorkerPool.');
    const cache = options.cache;
    if (cache !== undefined && !(cache instanceof ProceduralMapCache))
      throw new TypeError('Procedural cache must be a ProceduralMapCache.');
    const request: ProceduralMapsRequest = {
      kind,
      size,
      seed,
      contrast,
      roughnessBias,
      heightMap: options.heightMap ?? false,
      ...(tint === undefined ? {} : { tint: [tint[0], tint[1], tint[2]] }),
    };
    const generate = async (): Promise<ProceduralMaps> => {
      if (pool === undefined)
        return generateProceduralMaps(kind, size, seed, {
          contrast,
          roughnessBias,
          tint,
          heightMap: request.heightMap,
        });
      const generated = (
        await pool.submit(proceduralMapsJob, request, { requestBytes: 0 })
          .promise
      ).value;
      if (
        generated.baseColor.length !== size * size * 4 ||
        (request.heightMap && generated.height?.length !== size * size * 4)
      )
        throw new RangeError('Worker procedural maps do not match their size.');
      return generated;
    };
    const maps =
      cache === undefined
        ? await generate()
        : await cache.acquire(request, generate);
    const acquired: Texture[] = [];
    // Sequential acquisition keeps cleanup deterministic even when decoding a later map fails.
    try {
      for (const pixels of [
        maps.baseColor,
        maps.normal,
        maps.metallicRoughness,
        maps.occlusion,
        ...(maps.height === undefined ? [] : [maps.height]),
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
          ...(acquired[4] === undefined ? {} : { height: acquired[4] }),
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
      ...(this.textures.height === undefined
        ? {}
        : {
            opticalMaps: {
              heightTexture: this.textures.height,
              heightSampler: repeatSampler,
            },
          }),
      textureCoordinates:
        this.repeats === 1
          ? undefined
          : {
              texture: { scale },
              metallicRoughness: { scale },
              normal: { scale },
              occlusion: { scale },
              ...(this.textures.height === undefined
                ? {}
                : { height: { scale } }),
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
        this.kind === 'splitlockwashers' ||
        this.kind === 'hexnuts' ||
        this.kind === 'sawblades' ||
        this.kind === 'countersunkmetal' ||
        this.kind === 'rollerchain' ||
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
    this.textures.height?.destroy();
  }
}

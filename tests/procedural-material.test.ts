import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { proceduralMaterialPresets } from '../src/data/materials.js';
import {
  ProceduralMaterial,
  proceduralRepeats,
  type ProceduralMaterialKind,
} from '../packages/core/src/procedural-material.js';
import {
  createSurfaceSampler,
  generateProceduralMaps,
  writeNormals,
  type SurfaceSample,
} from '../packages/core/src/procedural-material-maps.js';
import { Mesh } from '../packages/core/src/mesh.js';
import { Geometry } from '../packages/core/src/geometry.js';
import { PBRMaterial } from '../packages/core/src/pbr-material.js';

const kinds: ProceduralMaterialKind[] = [
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
];

describe('Snowflake ceramic tiles', () => {
  const p = proceduralMaterialPresets.snowflaketiles;
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (seed: number) => {
    const sample = createSurfaceSampler('snowflaketiles', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'prints six branched arms flush with blue glaze above recessed joints for seed %s',
    (seed) => {
      const sample = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const phase = 2 * Math.PI * hash(col, row, seed ^ 0x4e57);
          const local = (x: number, y: number, angle: number) =>
            sample(
              (col + 0.5 + x * Math.cos(angle) - y * Math.sin(angle)) / p.cells,
              (row + 0.5 + x * Math.sin(angle) + y * Math.cos(angle)) / p.cells,
            );
          const center = local(0, 0, phase);
          for (let arm = 0; arm < 6; arm++) {
            const angle = phase + (arm * Math.PI) / 3;
            const bare = local(0.33, 0, angle + Math.PI / 6);
            const probes = [local(0.32, 0, angle)];
            for (const position of p.branchPositions)
              for (const side of [-1, 1])
                probes.push(
                  local(
                    position + p.branchLength * 0.25,
                    side * p.branchLength * Math.sqrt(3) * 0.25,
                    angle,
                  ),
                );
            for (const printed of [center, ...probes]) {
              expect(printed.color - bare.color).toBeGreaterThan(0.8);
              expect(printed.roughness - bare.roughness).toBeGreaterThan(0.02);
              expect(Math.abs(printed.height - bare.height)).toBeLessThan(
                0.00013,
              );
              expect(printed.occlusion).toBe(bare.occlusion);
              expect(printed.mortar).toBe(0);
              expect(printed.metallic).toBe(0);
            }
          }
          const joint = sample(col / p.cells, (row + 0.5) / p.cells);
          expect(center.height - joint.height).toBeGreaterThan(0.011);
          expect(center.occlusion - joint.occlusion).toBeGreaterThan(0.28);
          expect(joint.roughness - center.roughness).toBeGreaterThan(0.43);
          expect(joint.mortar).toBe(1);
        }
    },
  );
  it('keeps stroke caps, branch junctions, grout shoulders and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      const points: [number, number][] = [];
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++) points.push([x / 80, y / 80]);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const phase = 2 * Math.PI * hash(col, row, seed ^ 0x4e57);
          for (let arm = 0; arm < p.arms; arm++) {
            const angle = phase + (arm * Math.PI) / 3;
            const add = (x: number, y: number) =>
              points.push([
                (col + 0.5 + x * Math.cos(angle) - y * Math.sin(angle)) /
                  p.cells,
                (row + 0.5 + x * Math.sin(angle) + y * Math.cos(angle)) /
                  p.cells,
              ]);
            for (const x of [0, p.radius, p.radius + p.lineWidth]) add(x, 0);
            add(p.radius, p.lineWidth);
            for (const position of p.branchPositions)
              for (const side of [-1, 1]) {
                add(position, 0);
                add(
                  position + p.branchLength / 2,
                  (side * p.branchLength * Math.sqrt(3)) / 2,
                );
              }
          }
          for (const d of [0, p.grout, p.grout + p.bevel]) {
            points.push([(col + d) / p.cells, (row + 0.5) / p.cells]);
            points.push([(col + 0.5) / p.cells, (row + d) / p.cells]);
          }
        }
      for (const [u, v] of points)
        for (const axis of [0, 1]) {
          const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
            b = at(u, v),
            c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
          for (const key of [
            'color',
            'height',
            'roughness',
            'occlusion',
            'mortar',
          ] as const) {
            expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
            expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
              0.02,
            );
          }
        }
    }
  });
});

describe('Concentric circular paving', () => {
  const p = proceduralMaterialPresets.circularpavers;
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (seed: number) => {
    const sample = createSurfaceSampler('circularpavers', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'keeps four concentric wedge courses and a center stone above constant-width joints for seed %s',
    (seed) => {
      const sample = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const phase = 2 * Math.PI * hash(col, row, seed ^ 0x3d51);
          const at = (radius: number, angle: number) =>
            sample(
              (col + 0.5 + radius * Math.cos(angle)) / p.cells,
              (row + 0.5 + radius * Math.sin(angle)) / p.cells,
            );
          const center = at(0, 0),
            outside = at(0.48, 0);
          expect(center.height - outside.height).toBeGreaterThan(0.012);
          expect(center.mortar).toBe(0);
          expect(outside.mortar).toBe(1);
          for (let course = 1; course <= 4; course++) {
            const sectors = 8 * course;
            const origin = phase + ((course % 2) * Math.PI) / sectors;
            const radius = (course + 0.5) * p.courseWidth;
            for (let sector = 0; sector < sectors; sector++) {
              const edge = origin + (sector * 2 * Math.PI) / sectors;
              const middle = edge + Math.PI / sectors;
              const face = at(radius, middle),
                radialJoint = at(course * p.courseWidth, middle),
                sectorJoint = at(radius, edge);
              for (const grout of [radialJoint, sectorJoint]) {
                expect(face.height - grout.height).toBeGreaterThan(0.012);
                expect(face.occlusion - grout.occlusion).toBeGreaterThan(0.4);
                expect(grout.roughness - face.roughness).toBeGreaterThan(0.09);
                expect(grout.mortar).toBe(1);
              }
              expect(face.mortar).toBe(0);
              expect(face.metallic).toBe(0);
              expect(Math.abs(face.height - center.height)).toBeLessThan(
                0.00035,
              );
              const distance = p.grout + p.bevel / 2;
              const radialHalf = at(course * p.courseWidth + distance, middle);
              const angularHalf = at(
                radius,
                edge + Math.asin(distance / radius),
              );
              expect(radialHalf.mortar).toBeCloseTo(0.5, 8);
              expect(angularHalf.mortar).toBeCloseTo(0.5, 8);
              expect(
                Math.abs(radialHalf.height - angularHalf.height),
              ).toBeLessThan(0.0002);
            }
          }
        }
    },
  );
  it('keeps course ownership, wedge angle wrap, grout shoulders and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      const points: [number, number][] = [];
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++) points.push([x / 80, y / 80]);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const phase = 2 * Math.PI * hash(col, row, seed ^ 0x3d51);
          const add = (radius: number, angle: number) =>
            points.push([
              (col + 0.5 + radius * Math.cos(angle)) / p.cells,
              (row + 0.5 + radius * Math.sin(angle)) / p.cells,
            ]);
          for (let course = 1; course <= p.courses; course++) {
            const sectors = p.sectors * course;
            const origin = phase + ((course % 2) * Math.PI) / sectors;
            const radius = (course + 0.5) * p.courseWidth;
            for (let sector = 0; sector < sectors; sector++) {
              const edge = origin + (sector * 2 * Math.PI) / sectors;
              for (const distance of [0, p.grout, p.grout + p.bevel]) {
                add(radius, edge + Math.asin(distance / radius));
                add(
                  course * p.courseWidth + distance,
                  edge + Math.PI / sectors,
                );
                add(
                  (course + 1) * p.courseWidth - distance,
                  edge + Math.PI / sectors,
                );
              }
            }
          }
        }
      for (const [u, v] of points)
        for (const axis of [0, 1]) {
          const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
            b = at(u, v),
            c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
          for (const key of [
            'color',
            'height',
            'roughness',
            'occlusion',
            'mortar',
          ] as const) {
            expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
            expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
              0.02,
            );
          }
        }
    }
  });
});

describe('Acorn barnacle shells', () => {
  const p = proceduralMaterialPresets.acornbarnacles;
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (seed: number) => {
    const sample = createSurfaceSampler('acornbarnacles', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'raises six radially seamed shell plates around a deep diamond aperture for seed %s',
    (seed) => {
      const sample = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const phase = 2 * Math.PI * hash(col, row, seed ^ 0x5b47);
          const at = (radius: number, angle: number) =>
            sample(
              (col + 0.5 + radius * Math.cos(angle + phase)) / p.cells,
              (row + 0.5 + radius * Math.sin(angle + phase)) / p.cells,
            );
          const cavity = at(0, 0),
            rim = at(0.14, 0),
            outside = at(0.48, 0);
          expect(rim.height - cavity.height).toBeGreaterThan(0.027);
          expect(rim.color - cavity.color).toBeGreaterThan(0.65);
          expect(rim.occlusion - cavity.occlusion).toBeGreaterThan(0.59);
          expect(Math.abs(cavity.height - outside.height)).toBeLessThan(
            0.00035,
          );
          expect(rim.metallic).toBe(0);
          for (let corner = 0; corner < 4; corner++) {
            const angle = (corner * Math.PI) / 2;
            const opening = at(0.1, angle),
              diagonalWall = at(0.1, angle + Math.PI / 4);
            expect(diagonalWall.height - opening.height).toBeGreaterThan(0.022);
          }
          for (let plate = 0; plate < 6; plate++) {
            const angle = (plate * Math.PI) / 3;
            const seam = at(0.28, angle),
              wall = at(0.28, angle + Math.PI / 12);
            expect(wall.height - seam.height).toBeGreaterThan(0.002);
            expect(wall.color - seam.color).toBeGreaterThan(0.09);
            expect(wall.occlusion - seam.occlusion).toBeGreaterThan(0.1);
            expect(seam.roughness - wall.roughness).toBeGreaterThan(0.05);
            const upper = at(0.18, angle + Math.PI / 12),
              foot = at(0.38, angle + Math.PI / 12),
              betweenRibs = at(0.28, angle + Math.PI / 12 + Math.PI / 48);
            expect(upper.height - wall.height).toBeGreaterThan(0.007);
            expect(wall.height - foot.height).toBeGreaterThan(0.006);
            expect(wall.height - betweenRibs.height).toBeGreaterThan(0.00035);
          }
        }
    },
  );
  it('keeps diamond corners, radial striae supports, shell skirts and wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      const points: [number, number][] = [];
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++) points.push([x / 80, y / 80]);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const phase = 2 * Math.PI * hash(col, row, seed ^ 0x5b47);
          for (let ray = 0; ray < 24; ray++) {
            const angle = phase + (ray * Math.PI) / 12;
            for (const radius of [
              p.radius,
              p.radius - p.edge,
              p.crownStart,
              p.crownStart + p.crownWidth,
              p.ribStart,
              p.ribStart + p.ribShoulder,
            ])
              points.push([
                (col + 0.5 + radius * Math.cos(angle)) / p.cells,
                (row + 0.5 + radius * Math.sin(angle)) / p.cells,
              ]);
          }
          for (const bound of [
            p.apertureInner,
            p.apertureInner + p.apertureShoulder,
          ]) {
            const radius = Math.sqrt(
              (bound - p.apertureRound) ** 2 - p.apertureRound ** 2,
            );
            for (let ray = 0; ray < 4; ray++) {
              const angle = phase + (ray * Math.PI) / 2;
              points.push([
                (col + 0.5 + radius * Math.cos(angle)) / p.cells,
                (row + 0.5 + radius * Math.sin(angle)) / p.cells,
              ]);
            }
          }
        }
      for (const [u, v] of points)
        for (const axis of [0, 1]) {
          const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
            b = at(u, v),
            c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
          for (const key of [
            'color',
            'height',
            'roughness',
            'occlusion',
          ] as const) {
            expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
            expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
              0.02,
            );
          }
        }
    }
  });
});

describe('Polished orbicular jasper', () => {
  const p = proceduralMaterialPresets.orbicularjasper;
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (seed: number) => {
    const sample = createSurfaceSampler('orbicularjasper', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'keeps separate three- or four-ring orbicles flush with polished green matrix for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const cx =
            p.centerMin + p.centerVariation * hash(col, row, seed ^ 0x2d47);
          const cy =
            p.centerMin + p.centerVariation * hash(col, row, seed ^ 0x3e59);
          const radius =
            p.radiusMin + p.radiusVariation * hash(col, row, seed ^ 0x4f6b);
          const cycles = hash(col, row, seed ^ 0x5a7d) < 0.5 ? 3 : 4;
          const sample = (q: number, angle: number) =>
            at(
              (col + cx + radius * Math.sqrt(q) * Math.cos(angle)) / p.cells,
              (row + cy + radius * Math.sqrt(q) * Math.sin(angle)) / p.cells,
            );
          const matrix = at(col / p.cells, row / p.cells),
            core = sample(0, 0);
          expect(matrix.color - core.color).toBeGreaterThan(0.035);
          for (let ray = 0; ray < 8; ray++)
            for (let ring = 0; ring < cycles; ring++) {
              const angle = (ray * Math.PI) / 4;
              const pale = sample((ring + 0.5) / cycles, angle),
                dark = sample(ring / cycles, angle);
              expect(pale.color - dark.color).toBeGreaterThan(0.55);
              expect(pale.color - matrix.color).toBeGreaterThan(0.45);
              expect(pale.roughness - dark.roughness).toBeGreaterThan(0.035);
              for (const point of [pale, dark]) {
                expect(Math.abs(point.height - matrix.height)).toBeLessThan(
                  0.00002,
                );
                expect(point.occlusion).toBe(1);
                expect(point.metallic).toBe(0);
              }
            }
        }
    },
  );
  it('keeps radial centers, compact orbicle rims and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      const points: [number, number][] = [];
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++) points.push([x / 80, y / 80]);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const cx =
            p.centerMin + p.centerVariation * hash(col, row, seed ^ 0x2d47);
          const cy =
            p.centerMin + p.centerVariation * hash(col, row, seed ^ 0x3e59);
          const radius =
            p.radiusMin + p.radiusVariation * hash(col, row, seed ^ 0x4f6b);
          points.push([(col + cx) / p.cells, (row + cy) / p.cells]);
          for (const scale of [1, Math.sqrt(1 - p.shoulder)])
            for (let ray = 0; ray < 8; ray++) {
              const angle = (ray * Math.PI) / 4;
              points.push([
                (col + cx + radius * scale * Math.cos(angle)) / p.cells,
                (row + cy + radius * scale * Math.sin(angle)) / p.cells,
              ]);
            }
        }
      for (const [u, v] of points)
        for (const axis of [0, 1]) {
          const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
            b = at(u, v),
            c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
          for (const key of [
            'color',
            'height',
            'roughness',
            'occlusion',
          ] as const) {
            expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
            expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
              0.02,
            );
          }
        }
    }
  });
});

describe('Hexagonal metal nuts', () => {
  const p = proceduralMaterialPresets.hexnuts;
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (seed: number) => {
    const sample = createSurfaceSampler('hexnuts', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'separates six straight flats and extended corners from circular recessed bores for seed %s',
    (seed) => {
      const sample = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const at = (x: number, y: number) =>
            sample((col + 0.5 + x) / p.cells, (row + 0.5 + y) / p.cells);
          const polar = (r: number, a: number) =>
            at(r * Math.cos(a), r * Math.sin(a));
          const phase = 2 * Math.PI * hash(col, row, seed ^ 0x4c71);
          const bore = at(0, 0),
            backing = at(0.49, 0.49);
          expect(Math.abs(bore.height - backing.height)).toBeLessThan(0.0001);
          for (let side = 0; side < 6; side++) {
            const angle = phase + (2 * Math.PI * side) / 6;
            const top = polar(0.3, angle),
              flatOutside = polar(0.4, angle),
              corner = polar(0.4, angle + Math.PI / 6);
            expect(top.height - bore.height).toBeGreaterThan(0.02);
            expect(top.color - bore.color).toBeGreaterThan(0.48);
            expect(top.occlusion - bore.occlusion).toBeGreaterThan(0.5);
            expect(bore.roughness - top.roughness).toBeGreaterThan(0.13);
            expect(corner.height - flatOutside.height).toBeGreaterThan(0.015);
            const half = polar(p.inradius - p.outerBevel / 2, angle);
            const tangent = at(
              (p.inradius - p.outerBevel / 2) * Math.cos(angle) -
                0.08 * Math.sin(angle),
              (p.inradius - p.outerBevel / 2) * Math.sin(angle) +
                0.08 * Math.cos(angle),
            );
            expect(Math.abs(half.height - tangent.height)).toBeLessThan(0.0002);
            let previousOuter = polar(p.inradius, angle).height,
              previousBore = polar(p.boreRadius, angle).height;
            for (let step = 1; step <= 4; step++) {
              const outer = polar(
                p.inradius - (p.outerBevel * step) / 4,
                angle,
              );
              const inner = polar(
                p.boreRadius + (p.boreBevel * step) / 4,
                angle,
              );
              expect(outer.height).toBeGreaterThan(previousOuter);
              expect(inner.height).toBeGreaterThan(previousBore);
              previousOuter = outer.height;
              previousBore = inner.height;
              expect(outer.metallic).toBe(1);
              expect(inner.metallic).toBe(1);
            }
          }
        }
    },
  );
  it('keeps hexagonal bevel intersections, circular bore skirts and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      const points: [number, number][] = [];
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++) points.push([x / 80, y / 80]);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const phase = 2 * Math.PI * hash(col, row, seed ^ 0x4c71);
          for (let side = 0; side < 12; side++) {
            const angle = phase + (Math.PI * side) / 6;
            const correction = side % 2 ? Math.cos(Math.PI / 6) : 1;
            for (const radius of [
              p.inradius / correction,
              (p.inradius - p.outerBevel) / correction,
              p.boreRadius,
              p.boreRadius + p.boreBevel,
            ])
              points.push([
                (col + 0.5 + radius * Math.cos(angle)) / p.cells,
                (row + 0.5 + radius * Math.sin(angle)) / p.cells,
              ]);
          }
        }
      for (const [u, v] of points)
        for (const axis of [0, 1]) {
          const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
            b = at(u, v),
            c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
          for (const key of [
            'color',
            'height',
            'roughness',
            'occlusion',
          ] as const) {
            expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
            expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
              0.02,
            );
          }
        }
    }
  });
});

describe('Corrugated cardboard cut edge', () => {
  const p = proceduralMaterialPresets.cardboardedge;
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (seed: number) => {
    const sample = createSurfaceSampler('cardboardedge', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'joins sinusoidal medium to paired flat liners above hollow cavities for seed %s',
    (seed) => {
      const sample = field(seed);
      for (let row = 0; row < p.rows; row++) {
        const phase = hash(0, row, seed ^ 0x3a57);
        for (let col = 0; col < p.columns; col++)
          for (let step = 0; step < 16; step++) {
            const turn = step / 16;
            const u = (col + turn - phase) / p.columns;
            const at = (y: number) => sample(u, (row + 0.5 + y) / p.rows);
            const wave = p.amplitude * Math.cos(2 * Math.PI * turn);
            const medium = at(wave);
            const cavity = at(wave >= 0 ? -0.2 : 0.2);
            const upper = at(p.linerCenter),
              lower = at(-p.linerCenter);
            for (const paper of [medium, upper, lower]) {
              expect(paper.height - cavity.height).toBeGreaterThan(0.013);
              expect(paper.color - cavity.color).toBeGreaterThan(0.58);
              expect(paper.occlusion - cavity.occlusion).toBeGreaterThan(0.7);
              expect(cavity.roughness - paper.roughness).toBeGreaterThan(0.045);
              expect(paper.metallic).toBe(0);
            }
            expect(Math.abs(medium.height - upper.height)).toBeLessThan(0.0005);
            expect(Math.abs(lower.height - upper.height)).toBeLessThan(0.0005);
            if (step === 0 || step === 8) {
              const side = step === 0 ? 1 : -1;
              // The medium must meet its liner, rather than ending in a dark gap.
              for (let i = 0; i <= 8; i++) {
                const contact = at(
                  side *
                    (p.amplitude + ((p.linerCenter - p.amplitude) * i) / 8),
                );
                expect(contact.height - cavity.height).toBeGreaterThan(0.007);
                expect(contact.occlusion - cavity.occlusion).toBeGreaterThan(
                  0.38,
                );
              }
            }
          }
      }
    },
  );
  it('keeps paper skirts, liner contacts, row ownership and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      const points: [number, number][] = [];
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++) points.push([x / 80, y / 80]);
      for (let row = 0; row < p.rows; row++) {
        const phase = hash(0, row, seed ^ 0x3a57);
        for (let step = 0; step < 16; step++) {
          const turn = step / 16,
            angle = 2 * Math.PI * turn,
            u = (turn - phase) / p.columns;
          const wave = p.amplitude * Math.cos(angle);
          const slope =
            ((p.amplitude * 2 * Math.PI * p.columns) / p.rows) *
            Math.sin(angle);
          for (const side of [-1, 1]) {
            const y =
              wave + side * p.mediumHalfWidth * Math.sqrt(1 + slope * slope);
            points.push([u, (row + 0.5 + y) / p.rows]);
            for (const edge of [-1, 1])
              points.push([
                u,
                (row + 0.5 + side * (p.linerCenter + edge * p.linerHalfWidth)) /
                  p.rows,
              ]);
          }
        }
      }
      for (const [u, v] of points)
        for (const axis of [0, 1]) {
          const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
            b = at(u, v),
            c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
          for (const key of [
            'color',
            'height',
            'roughness',
            'occlusion',
          ] as const) {
            expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
            expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
              0.02,
            );
          }
        }
    }
  });
});

describe('Lotus root air canals', () => {
  const p = proceduralMaterialPresets.lotusroot;
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (seed: number) => {
    const sample = createSurfaceSampler('lotusroot', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'keeps eight radial elongated canals and a central hole below pale flush flesh for seed %s',
    (seed) => {
      const sample = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const at = (x: number, y: number) =>
            sample((col + 0.5 + x) / p.cells, (row + 0.5 + y) / p.cells);
          const polar = (radius: number, angle: number) =>
            at(radius * Math.cos(angle), radius * Math.sin(angle));
          const phase = 2 * Math.PI * hash(col, row, seed ^ 0x2c59);
          const center = at(0, 0),
            flesh = polar(0.1, phase),
            rind = polar(0.425, phase),
            backing = at(0.49, 0.49);
          expect(flesh.height - center.height).toBeGreaterThan(0.012);
          expect(flesh.color - center.color).toBeGreaterThan(0.68);
          expect(flesh.color - rind.color).toBeGreaterThan(0.35);
          expect(Math.abs(flesh.height - rind.height)).toBeLessThan(0.00025);
          expect(flesh.height - backing.height).toBeGreaterThan(0.014);
          expect(center.metallic).toBe(0);
          for (let canal = 0; canal < 8; canal++) {
            const angle = phase + (2 * Math.PI * canal) / 8;
            const floor = polar(p.canalDistance, angle);
            const along = polar(p.canalDistance + 0.08, angle);
            const across = at(
              p.canalDistance * Math.cos(angle) - 0.08 * Math.sin(angle),
              p.canalDistance * Math.sin(angle) + 0.08 * Math.cos(angle),
            );
            const bridge = polar(p.canalDistance, angle + Math.PI / 8);
            expect(bridge.height - floor.height).toBeGreaterThan(0.012);
            expect(bridge.color - floor.color).toBeGreaterThan(0.68);
            expect(bridge.occlusion - floor.occlusion).toBeGreaterThan(0.6);
            expect(floor.roughness - bridge.roughness).toBeGreaterThan(0.16);
            expect(across.height - along.height).toBeGreaterThan(0.01);
            expect(Math.abs(bridge.height - flesh.height)).toBeLessThan(
              0.00025,
            );
            expect(Math.abs(floor.height - center.height)).toBeLessThan(
              0.00025,
            );
          }
        }
    },
  );
  it('keeps canal walls, rind, slice skirts and wrapped ownership C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      const points: [number, number][] = [];
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++) points.push([x / 80, y / 80]);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const phase = 2 * Math.PI * hash(col, row, seed ^ 0x2c59);
          for (const radius of [
            p.radius,
            p.radius - p.edge,
            p.rindStart,
            p.rindStart + p.rindWidth,
            p.centralRadius,
            p.centralRadius * Math.sqrt(1 - p.wallShoulder),
          ])
            points.push([
              (col + 0.5 + radius) / p.cells,
              (row + 0.5) / p.cells,
            ]);
          for (let canal = 0; canal < p.canals; canal++) {
            const angle = phase + (2 * Math.PI * canal) / p.canals;
            const long =
              p.canalLong +
              p.canalLongVariation *
                hash(col * p.canals + canal, row, seed ^ 0x3d61);
            for (const side of [-1, 1])
              for (const scale of [1, Math.sqrt(1 - p.wallShoulder)]) {
                const radius = p.canalDistance + side * scale * long;
                points.push([
                  (col + 0.5 + radius * Math.cos(angle)) / p.cells,
                  (row + 0.5 + radius * Math.sin(angle)) / p.cells,
                ]);
              }
          }
        }
      for (const [u, v] of points)
        for (const axis of [0, 1]) {
          const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
            b = at(u, v),
            c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
          for (const key of [
            'color',
            'height',
            'roughness',
            'occlusion',
          ] as const) {
            expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
            expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
              0.02,
            );
          }
        }
    }
  });
});

describe('Five-harness warp satin', () => {
  const p = proceduralMaterialPresets.satinweave;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('satinweave', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'keeps four warp floats per isolated weft interlacing with a two-thread course step for seed %s',
    (seed) => {
      const sample = field(seed);
      for (let row = 0; row < p.cells; row++) {
        let exposed = 0;
        for (let col = 0; col < p.cells; col++) {
          const at = (x: number, y: number) =>
            sample((col + 0.5 + x) / p.cells, (row + 0.5 + y) / p.cells);
          const alongWarp = at(0, 0.38),
            alongWeft = at(0.38, 0);
          const interlace = (col + 2 * row) % 5 === 0;
          const top = interlace ? alongWeft : alongWarp,
            bottom = interlace ? alongWarp : alongWeft;
          expect(top.height - bottom.height).toBeGreaterThan(0.0008);
          expect(bottom.roughness - top.roughness).toBeGreaterThan(0.04);
          if (alongWeft.height > alongWarp.height) exposed++;
          const center = at(0, 0),
            gap = at(0.5, 0.5);
          expect(center.height - gap.height).toBeGreaterThan(0.0017);
          expect(center.occlusion - gap.occlusion).toBeGreaterThan(0.21);
          expect(center.metallic).toBe(0);
        }
        expect(exposed).toBe(5);
      }
    },
  );
  it('keeps yarn skirts, isolated ownership transitions and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      const points: [number, number][] = [];
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++) points.push([x / 80, y / 80]);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++)
          if ((col + 2 * row) % 5 === 0)
            for (const offset of [
              -p.exposureHalf,
              p.exposureShoulder - p.exposureHalf,
              p.exposureHalf - p.exposureShoulder,
              p.exposureHalf,
            ])
              points.push([
                (col + 0.5 + offset) / p.cells,
                (row + 0.5) / p.cells,
              ]);
      for (const [u, v] of points)
        for (const axis of [0, 1]) {
          const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
            b = at(u, v),
            c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
          for (const key of [
            'color',
            'height',
            'roughness',
            'occlusion',
          ] as const) {
            expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
            expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
              0.02,
            );
          }
        }
    }
  });
});

describe('Flemish bond brickwork', () => {
  const p = proceduralMaterialPresets.flemishbond;
  const units = p.modules * 3;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('flemishbond', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'alternates dark headers and long stretchers in every course with aligned centers and equal physical joints for seed %s',
    (seed) => {
      const sample = field(seed);
      const halfBevel = (p.grout + p.bevel / 2) / p.rows;
      for (let row = 0; row < p.rows; row++)
        for (let module = 0; module < p.modules; module++) {
          const start = module * 3 + 1.5 * (row % 2),
            v = (row + 0.5) / p.rows;
          const headerU = (start + 0.5) / units,
            stretcherU = (start + 2) / units;
          const header = sample(headerU, v),
            stretcher = sample(stretcherU, v);
          expect(stretcher.color - header.color).toBeGreaterThan(0.08);
          expect(Math.abs(stretcher.height - header.height)).toBeLessThan(
            0.001,
          );
          const above = sample(stretcherU, (row + 1.5) / p.rows);
          expect(above.mortar).toBe(0);
          expect(stretcher.color - above.color).toBeGreaterThan(0.08);
          for (const joint of [start, start + 1]) {
            const u = joint / units;
            const gap = sample(u, v);
            expect(gap.mortar).toBe(1);
            expect(header.height - gap.height).toBeGreaterThan(0.017);
            expect(header.occlusion - gap.occlusion).toBeGreaterThan(0.35);
            for (const side of [-1, 1])
              expect(sample(u + side * halfBevel, v).mortar).toBeCloseTo(
                0.5,
                8,
              );
          }
          for (const u of [headerU, stretcherU]) {
            expect(sample(u, v).mortar).toBe(0);
            expect(sample(u, row / p.rows).mortar).toBe(1);
            for (const side of [-1, 1])
              expect(
                sample(u, row / p.rows + side * halfBevel).mortar,
              ).toBeCloseTo(0.5, 8);
          }
          expect(header.metallic).toBe(0);
        }
    },
  );
  it('keeps alternating brick ownership, bevel shoulders and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      const points: [number, number][] = [];
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++) points.push([x / 80, y / 80]);
      for (let row = 0; row < p.rows; row++)
        for (let module = 0; module < p.modules; module++)
          for (const joint of [0, 1])
            for (const distance of [0, p.grout, p.grout + p.bevel])
              for (const side of [-1, 1])
                points.push([
                  (3 * module + 1.5 * (row % 2) + joint) / units +
                    (side * distance) / p.rows,
                  (row + 0.5) / p.rows,
                ]);
      for (const [u, v] of points)
        for (const axis of [0, 1]) {
          const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
            b = at(u, v),
            c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
          for (const key of [
            'color',
            'height',
            'roughness',
            'occlusion',
            'mortar',
          ] as const) {
            expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
            expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
              0.02,
            );
          }
        }
    }
  });
});

describe('Split lock washers', () => {
  const p = proceduralMaterialPresets.splitlockwashers;
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (seed: number) => {
    const sample = createSurfaceSampler('splitlockwashers', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'separates helical ring ends with a cut sector exposing the same plate as the center hole for seed %s',
    (seed) => {
      const sample = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const phase = 2 * Math.PI * hash(col, row, seed ^ 0x2b49);
          const at = (r: number, angle: number) =>
            sample(
              (col + 0.5 + r * Math.cos(angle + phase)) / p.cells,
              (row + 0.5 + r * Math.sin(angle + phase)) / p.cells,
            );
          const radius = (p.inner + p.outer) / 2;
          const low = at(radius, p.gap + 0.1),
            high = at(radius, 2 * Math.PI - p.gap - 0.1),
            middle = at(radius, Math.PI),
            gap = at(radius, 0),
            hole = at(0, 0);
          expect(low.height - gap.height).toBeGreaterThan(0.007);
          expect(high.height - low.height).toBeGreaterThan(0.0068);
          expect(middle.height - low.height).toBeGreaterThan(0.003);
          expect(high.height - middle.height).toBeGreaterThan(0.003);
          expect(Math.abs(hole.height - gap.height)).toBeLessThan(0.0001);
          expect(low.color - gap.color).toBeGreaterThan(0.39);
          expect(gap.roughness - low.roughness).toBeGreaterThan(0.23);
          expect(low.occlusion - gap.occlusion).toBeGreaterThan(0.32);
          for (const r of [p.inner - 0.01, p.outer + 0.01])
            expect(Math.abs(at(r, Math.PI).height - hole.height)).toBeLessThan(
              0.0001,
            );
          expect(
            Math.abs(at(p.inner + 0.04, Math.PI).height - middle.height),
          ).toBeLessThan(0.0002);
          for (const value of [low, high, middle, hole, gap])
            expect(value.metallic).toBe(1);
        }
    },
  );
  it('keeps cut ends, radial bevels, the angle branch cut and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      const points: [number, number][] = [];
      for (let y = 0; y <= 64; y++)
        for (let x = 0; x <= 64; x++) points.push([x / 64, y / 64]);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const phase = 2 * Math.PI * hash(col, row, seed ^ 0x2b49);
          for (const angle of [
            0,
            p.gap,
            p.gap + p.angularBevel,
            2 * Math.PI - p.gap,
            2 * Math.PI - p.gap - p.angularBevel,
            Math.PI,
          ])
            for (const r of [
              p.inner,
              p.inner + p.bevel,
              (p.inner + p.outer) / 2,
              p.outer - p.bevel,
              p.outer,
            ])
              points.push([
                (col + 0.5 + r * Math.cos(angle + phase)) / p.cells,
                (row + 0.5 + r * Math.sin(angle + phase)) / p.cells,
              ]);
        }
      for (const [u, v] of points)
        for (const axis of [0, 1]) {
          const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
            b = at(u, v),
            c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
          for (const key of [
            'color',
            'height',
            'roughness',
            'occlusion',
          ] as const) {
            expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
            expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
              0.02,
            );
          }
        }
    }
  });
});

describe('Artichoke bracts', () => {
  const p = proceduralMaterialPresets.artichoke;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('artichoke', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'overlaps pointed bracts above broad roots with a midrib and paired branching veins for seed %s',
    (seed) => {
      const sample = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const at = (x: number, y: number) =>
            sample(
              (col + 0.5 + 0.5 * (row % 2) + x) / p.cells,
              (row + 0.5 + y) / p.cells,
            );
          const rib = at(0, 0.05),
            tip = at(0, 0.45);
          for (const side of [-1, 1]) {
            expect(rib.height - at(side * 0.12, 0.05).height).toBeGreaterThan(
              0.0015,
            );
            expect(tip.height - at(side * 0.35, 0.45).height).toBeGreaterThan(
              0.006,
            );
            expect(at(side * 0.3, 0).occlusion).toBeGreaterThan(0.95);
            for (let branch = 0; branch < 3; branch++) {
              const y =
                -0.3 + 0.25 * branch + 0.55 * Math.sqrt(0.18 * 0.18 + 0.0001);
              const peak = at(side * 0.18, y);
              const sides =
                (at(side * 0.18, y - 0.04).height +
                  at(side * 0.18, y + 0.04).height) /
                2;
              expect(peak.height - sides).toBeGreaterThan(0.0003);
            }
          }
          expect(tip.height - rib.height).toBeGreaterThan(0.003);
          expect(rib.metallic).toBe(0);
        }
    },
  );
  it('keeps pointed outlines, overlap order, veins and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('French knot embroidery', () => {
  const p = proceduralMaterialPresets.frenchknots;
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (seed: number) => {
    const sample = createSurfaceSampler('frenchknots', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'raises two yarn wraps around a closed central dimple over woven cloth for seed %s',
    (seed) => {
      const sample = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const cx = col + 0.45 + 0.1 * hash(col, row, seed ^ 0x1c41),
            cy = row + 0.45 + 0.1 * hash(col, row, seed ^ 0x2d53);
          const turn = 2 * Math.PI * hash(col, row, seed ^ 0x3a65),
            phase = 2 * Math.PI * hash(col, row, seed ^ 0x4b77);
          const at = (r: number, angle: number) => {
            const x = r * Math.cos(angle),
              y = (r * Math.sin(angle)) / p.aspect;
            return sample(
              (cx + x * Math.cos(turn) - y * Math.sin(turn)) / p.cells,
              (cy + x * Math.sin(turn) + y * Math.cos(turn)) / p.cells,
            );
          };
          const center = at(0, 0),
            cloth = at(0.38, 0);
          expect(center.height - cloth.height).toBeGreaterThan(0.005);
          expect(cloth.color - center.color).toBeGreaterThan(0.56);
          expect(cloth.roughness - center.roughness).toBeGreaterThan(0.07);
          for (let step = 0; step < 12; step++) {
            const angle = (2 * Math.PI * step) / 12;
            const warp = p.warp * Math.cos(3 * angle + phase);
            const inner = at(p.inner + warp, angle),
              outer = at(p.outer + warp, angle),
              valley = at((p.inner + p.outer) / 2 + warp, angle);
            expect(inner.height - center.height).toBeGreaterThan(0.004);
            expect(outer.height - center.height).toBeGreaterThan(0.001);
            expect(inner.height - valley.height).toBeGreaterThan(0.002);
            expect(outer.height - valley.height).toBeGreaterThan(0.0008);
            expect(at(0.04, angle).height - center.height).toBeGreaterThan(
              0.0005,
            );
          }
          expect(center.metallic).toBe(0);
        }
    },
  );
  it('keeps wrapped yarn, dimples, knot skirts and tile boundaries C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('Knapped flint wall', () => {
  const p = proceduralMaterialPresets.flintwall;
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (seed: number) => {
    const sample = createSurfaceSampler('flintwall', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'surrounds staggered dark knapped stones with chalk cortex above recessed mortar for seed %s',
    (seed) => {
      const sample = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const phase = 2 * Math.PI * hash(col, row, seed ^ 0x3651);
          const at = (r: number, angle: number) =>
            sample(
              (col + 0.5 + 0.5 * (row % 2) + r * Math.cos(angle)) / p.cells,
              (row + 0.5 + r * Math.sin(angle)) / p.cells,
            );
          const center = at(0, 0);
          for (let edge = 0; edge < p.edges; edge++) {
            const angle = phase + (2 * Math.PI * edge) / p.edges;
            const radius =
              p.radiusMin +
              p.radiusRange * hash(col * p.edges + edge, row, seed ^ 0x5875);
            const cortex = at(radius - 0.035, angle),
              mortar = at(radius + 0.015, angle);
            expect(cortex.color - center.color).toBeGreaterThan(0.55);
            expect(cortex.roughness - center.roughness).toBeGreaterThan(0.29);
            expect(cortex.height - mortar.height).toBeGreaterThan(0.014);
            expect(center.height - mortar.height).toBeGreaterThan(0.014);
            expect(cortex.occlusion - mortar.occlusion).toBeGreaterThan(0.31);
            expect(cortex.mortar).toBeCloseTo(0);
            expect(center.mortar).toBeCloseTo(0);
            expect(mortar.mortar).toBeCloseTo(1);
            expect(mortar.roughness - cortex.roughness).toBeGreaterThan(0.11);
          }
          expect(center.metallic).toBe(0);
        }
    },
  );
  it('keeps polygon bevels, chalk boundaries, staggered rows and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
              'mortar',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('Raked garden gravel', () => {
  const p = proceduralMaterialPresets.rakedgravel;
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (seed: number) => {
    const sample = createSurfaceSampler('rakedgravel', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'retains individual stones on flat-bottomed rake channels and raised banks for seed %s',
    (seed) => {
      const sample = field(seed);
      for (let furrow = 0; furrow < p.furrows; furrow++)
        for (let n = 0; n < 32; n++) {
          const v = (n + 0.37) / 32;
          const floor = sample((furrow + 0.5) / p.furrows, v),
            bank = sample(furrow / p.furrows, v),
            shoulder = sample((furrow + 0.71) / p.furrows, v);
          expect(bank.height - floor.height).toBeGreaterThan(0.01);
          expect(shoulder.height - floor.height).toBeGreaterThan(0.003);
          expect(bank.height - shoulder.height).toBeGreaterThan(0.003);
          expect(bank.occlusion - floor.occlusion).toBeGreaterThan(0.21);
          // Both probes stay on the flat rake bed; differences are stone-scale.
          const bottomEdge = sample((furrow + 0.58) / p.furrows, v);
          expect(Math.abs(bottomEdge.height - floor.height)).toBeLessThan(
            0.0041,
          );
        }
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const cx = 0.4 + 0.2 * hash(col, row, seed ^ 0x3157),
            cy = 0.4 + 0.2 * hash(col, row, seed ^ 0x4269);
          const u = (col + cx) / p.cells;
          const stone = sample(u, (row + cy) / p.cells),
            gap = sample(u, (row + cy + 0.34) / p.cells);
          expect(stone.height - gap.height).toBeGreaterThan(0.003);
          expect(stone.color - gap.color).toBeGreaterThan(0.07);
          expect(stone.occlusion - gap.occlusion).toBeGreaterThan(0.079);
          expect(gap.roughness - stone.roughness).toBeGreaterThan(0.099);
          expect(stone.metallic).toBe(0);
        }
    },
  );
  it('keeps rake shoulders, channel floors, stone caps and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('Sunburst veneer marquetry', () => {
  const p = proceduralMaterialPresets.sunburstveneer;
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (seed: number) => {
    const sample = createSurfaceSampler('sunburstveneer', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'inlays twelve radial-grained wedges around a flush centre plug for seed %s',
    (seed) => {
      const sample = field(seed);
      let alongVariation = 0,
        acrossVariation = 0;
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const phase = 2 * Math.PI * hash(col, row, seed ^ 0x4153);
          const at = (a: number, b: number, angle: number) =>
            sample(
              (col + 0.5 + a * Math.cos(angle) - b * Math.sin(angle)) / p.cells,
              (row + 0.5 + a * Math.sin(angle) + b * Math.cos(angle)) / p.cells,
            );
          const plug = at(0, 0, 0),
            board = at(0.48, 0, 0);
          for (let wedge = 0; wedge < p.wedges; wedge++) {
            const angle = phase + (2 * Math.PI * (wedge + 0.5)) / p.wedges;
            const face = at(0.3, 0, angle),
              joint = at(0.3, 0, angle - Math.PI / p.wedges),
              outer = at(p.radius, 0, angle),
              inner = at((p.plugRadius + p.innerRadius) / 2, 0, angle);
            for (const recess of [joint, outer, inner]) {
              expect(face.height - recess.height).toBeGreaterThan(0.0033);
              expect(face.color - recess.color).toBeGreaterThan(0.3);
              expect(recess.roughness - face.roughness).toBeGreaterThan(0.16);
              expect(face.occlusion - recess.occlusion).toBeGreaterThan(0.34);
            }
            expect(Math.abs(face.height - plug.height)).toBeLessThan(0.0003);
            expect(Math.abs(face.height - board.height)).toBeLessThan(0.0003);
            expect(face.metallic).toBe(0);
            for (let n = 0; n < 9; n++) {
              const r = 0.17 + 0.02 * n,
                base = at(r, 0, angle);
              alongVariation += Math.abs(
                at(r + 0.003, 0, angle).color - base.color,
              );
              acrossVariation += Math.abs(
                at(r, 0.003, angle).color - base.color,
              );
            }
          }
        }
      expect(acrossVariation).toBeGreaterThan(alongVariation * 3);
    },
  );
  it('keeps wedge ownership, plug rings, outer inlays and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('Shirred gathered fabric', () => {
  const p = proceduralMaterialPresets.shirring;
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (seed: number) => {
    const sample = createSurfaceSampler('shirring', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'compresses tall gathers into four stitched elastic rows for seed %s',
    (seed) => {
      const sample = field(seed),
        phase = hash(0, 0, seed ^ 0x2941);
      for (let row = 0; row < p.rows; row++) {
        for (let n = 0; n < p.folds; n++) {
          const u = (n - phase) / p.folds;
          const crown = sample(u, (row + 0.5) / p.rows),
            valley = sample(u + 0.5 / p.folds, (row + 0.5) / p.rows),
            compressed = sample(u, row / p.rows);
          expect(crown.height - valley.height).toBeGreaterThan(0.015);
          expect(crown.occlusion - valley.occlusion).toBeGreaterThan(0.29);
          expect(crown.height - compressed.height).toBeGreaterThan(0.012);
          for (const fraction of [0.25, 0.75]) {
            const crestU =
              (n - phase - p.wander * Math.sin(2 * Math.PI * fraction)) /
              p.folds;
            const crest = sample(crestU, (row + fraction) / p.rows),
              groove = sample(
                crestU + 0.5 / p.folds,
                (row + fraction) / p.rows,
              );
            expect(crest.height - groove.height).toBeGreaterThan(0.008);
          }
        }
        for (let n = 0; n < p.stitches; n++) {
          const thread = sample((n + 0.5) / p.stitches, row / p.rows),
            gap = sample(n / p.stitches, row / p.rows);
          expect(thread.height - gap.height).toBeGreaterThan(0.0005);
          expect(thread.color - gap.color).toBeGreaterThan(0.04);
          expect(gap.roughness - thread.roughness).toBeGreaterThan(0.02);
          expect(thread.occlusion - gap.occlusion).toBeGreaterThan(0.09);
          expect(thread.metallic).toBe(0);
        }
      }
    },
  );
  it('keeps gathered crests, compressed rows, stitch ends and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('Crystalline ceramic glaze', () => {
  const p = proceduralMaterialPresets.crystallineglaze;
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (seed: number) => {
    const sample = createSurfaceSampler('crystallineglaze', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'embeds radial crystal needles and growth bands in a flat glossy coating for seed %s',
    (seed) => {
      const sample = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const cx = 0.44 + 0.12 * hash(col, row, seed ^ 0x2a51),
            cy = 0.44 + 0.12 * hash(col, row, seed ^ 0x3b63);
          const radius =
              p.radiusMin + p.radiusRange * hash(col, row, seed ^ 0x4c75),
            phase = 2 * Math.PI * hash(col, row, seed ^ 0x5d87);
          const arms =
            p.armsMin + Math.floor(p.armsRange * hash(col, row, seed ^ 0x6e99));
          const at = (r: number, angle: number) =>
            sample(
              (col + cx + r * radius * Math.cos(angle)) / p.cells,
              (row + cy + r * radius * Math.sin(angle)) / p.cells,
            );
          for (let arm = 0; arm < arms; arm++) {
            const angle = (2 * Math.PI * arm - phase) / arms;
            const needle = at(0.6, angle),
              gap = at(0.6, angle + Math.PI / arms);
            expect(needle.color - gap.color).toBeGreaterThan(0.5);
            expect(needle.roughness - gap.roughness).toBeGreaterThan(0.07);
            expect(Math.abs(needle.height - gap.height)).toBeLessThan(0.00002);
            expect(needle.occlusion).toBe(1);
            expect(gap.occlusion).toBe(1);
            const growthBright = at(Math.sqrt(1 / 3), angle),
              growthDark = at(Math.sqrt(1 / 6), angle);
            expect(growthBright.color - growthDark.color).toBeGreaterThan(0.1);
          }
          const center = at(0, 0),
            clear = sample((col + 0.01) / p.cells, (row + 0.01) / p.cells);
          expect(center.color - clear.color).toBeGreaterThan(0.45);
          expect(Math.abs(center.height - clear.height)).toBeLessThan(0.00002);
          expect(clear.roughness).toBeCloseTo(0.18);
          expect(clear.occlusion).toBe(1);
          expect(center.metallic).toBe(0);
        }
    },
  );
  it('keeps crystal centres, irregular rims, needles and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('Sea urchin skeletal shell', () => {
  const p = proceduralMaterialPresets.seaurchintest;
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (seed: number) => {
    const sample = createSurfaceSampler('seaurchintest', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'forms five paired pore rows, an apical opening and interradial tubercles for seed %s',
    (seed) => {
      const sample = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const phase = 2 * Math.PI * hash(col, row, seed ^ 0x6c51);
          const at = (a: number, b: number, angle: number) =>
            sample(
              (col + 0.5 + a * Math.cos(angle) - b * Math.sin(angle)) / p.cells,
              (row + 0.5 + a * Math.sin(angle) + b * Math.cos(angle)) / p.cells,
            );
          for (let ray = 0; ray < 5; ray++) {
            const angle = phase + (2 * Math.PI * ray) / 5;
            for (let n = 0; n < p.poreRows; n++)
              for (const side of [-1, 1]) {
                const r = p.poreStart + n * p.poreSpacing;
                const pore = at(r, side * p.poreOffset, angle),
                  bridge = at(r, 0, angle);
                expect(bridge.height - pore.height).toBeGreaterThan(0.0045);
                expect(bridge.color - pore.color).toBeGreaterThan(0.25);
                expect(bridge.occlusion - pore.occlusion).toBeGreaterThan(0.44);
                expect(pore.roughness - bridge.roughness).toBeGreaterThan(0.09);
              }
            for (const r of [0.2, 0.3]) {
              const crown = at(r, 0, angle + Math.PI / 5),
                flank = at(r, 0.05, angle + Math.PI / 5);
              expect(crown.height - flank.height).toBeGreaterThan(0.0018);
              expect(flank.roughness - crown.roughness).toBeGreaterThan(0.05);
            }
          }
          const center = at(0, 0, phase),
            cap = at(0.06, 0, phase),
            edge = at(0.41, 0, phase),
            backing = at(0.47, 0, phase);
          expect(cap.height - center.height).toBeGreaterThan(0.004);
          expect(cap.occlusion - center.occlusion).toBeGreaterThan(0.44);
          expect(cap.height).toBeGreaterThan(edge.height);
          expect(edge.height - backing.height).toBeGreaterThan(0.005);
          expect(backing.occlusion).toBeCloseTo(0.3);
          expect(cap.metallic).toBe(0);
        }
    },
  );
  it('keeps pores, tubercles, ray selection, shell edges and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('Guilloche rosette engraving', () => {
  const p = proceduralMaterialPresets.guilloche;
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (seed: number) => {
    const sample = createSurfaceSampler('guilloche', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'engraves three nested eight-lobed contours into an unbroken metal plate for seed %s',
    (seed) => {
      const sample = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const phase = 2 * Math.PI * hash(col, row, seed ^ 0x4a31);
          const at = (r: number, angle: number) =>
            sample(
              (col + 0.5 + r * Math.cos(angle)) / p.cells,
              (row + 0.5 + r * Math.sin(angle)) / p.cells,
            );
          for (let sector = 0; sector < p.lobes * 2; sector++) {
            const angle = (sector * Math.PI - phase) / p.lobes;
            for (let ring = -1; ring <= 1; ring++) {
              const r =
                p.radius +
                p.amplitude * (sector % 2 ? -1 : 1) +
                ring * p.spacing;
              const cut = at(r, angle),
                plate = at(r + p.width * 2, angle);
              expect(plate.height - cut.height).toBeGreaterThan(0.0014);
              expect(plate.color - cut.color).toBeGreaterThan(0.19);
              expect(cut.roughness - plate.roughness).toBeGreaterThan(0.1);
              expect(plate.occlusion - cut.occlusion).toBeGreaterThan(0.17);
              expect(cut.metallic).toBe(1);
            }
            const center = at(0, angle),
              perimeter = at(0.45, angle);
            expect(Math.abs(center.height - perimeter.height)).toBeLessThan(
              0.00006,
            );
            expect(center.occlusion).toBe(perimeter.occlusion);
            expect(perimeter.metallic).toBe(1);
          }
        }
    },
  );
  it('keeps cut shoulders, lobe tips, polar centres and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('Cairo pentagonal tiles', () => {
  const p = proceduralMaterialPresets.cairotiles;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('cairotiles', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'joins all five edges to neighbouring tiles with shared grout and bevel widths for seed %s',
    (seed) => {
      const sample = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++)
          for (let axis = 0; axis < 2; axis++) {
            const sign = (row + col) & 1 ? -1 : 1;
            const points = Array.from({ length: 5 }, (_, i) => {
              const x = p.vertices[i * 2],
                y = sign * p.vertices[i * 2 + 1];
              return [col + (axis ? -y : x), row + (axis ? x : y)] as const;
            });
            const at = (x: number, y: number) =>
              sample(x / p.cells, y / p.cells);
            const center = at(
              points.reduce((sum, v) => sum + v[0], 0) / 5,
              points.reduce((sum, v) => sum + v[1], 0) / 5,
            );
            expect(center.height).toBeGreaterThan(0.019);
            for (let edge = 0; edge < 5; edge++) {
              const a = points[edge],
                b = points[(edge + 1) % 5];
              const mx = (a[0] + b[0]) / 2,
                my = (a[1] + b[1]) / 2;
              const inverse = sign / Math.hypot(b[0] - a[0], b[1] - a[1]);
              const nx = (a[1] - b[1]) * inverse,
                ny = (b[0] - a[0]) * inverse;
              const joint = at(mx, my);
              expect(joint.height).toBeLessThan(0.003);
              expect(center.occlusion - joint.occlusion).toBeGreaterThan(0.4);
              for (const side of [-1, 1]) {
                const face = at(mx + side * nx * 0.07, my + side * ny * 0.07);
                expect(face.height - joint.height).toBeGreaterThan(0.016);
                expect(joint.roughness - face.roughness).toBeGreaterThan(0.12);
                const early = p.grout + p.shoulder * 0.25,
                  late = p.grout + p.shoulder * 0.75;
                expect(
                  at(mx + side * nx * late, my + side * ny * late).height -
                    at(mx + side * nx * early, my + side * ny * early).height,
                ).toBeGreaterThan(0.01);
              }
            }
          }
    },
  );
  it('keeps pentagon corners, three-way and four-way joints and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
              'mortar',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('Expanded vermiculite lamellae', () => {
  const p = proceduralMaterialPresets.vermiculite;
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (seed: number) => {
    const sample = createSurfaceSampler('vermiculite', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'keeps raised lamella crests above darker rougher interlayers for seed %s',
    (seed) => {
      const sample = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const angle = 2 * Math.PI * hash(col, row, seed ^ 0x4d27);
          const phase = hash(col, row, seed ^ 0x5e39);
          const at = (x: number, y: number) =>
            sample(
              (col +
                0.5 +
                0.5 * (row % 2) +
                x * Math.cos(angle) -
                y * Math.sin(angle)) /
                p.cells,
              (row + 0.5 + x * Math.sin(angle) + y * Math.cos(angle)) / p.cells,
            );
          for (let layer = -1; layer <= 1; layer++) {
            const x = ((layer - phase) * 2 * p.halfLength) / p.layers;
            const crest = at(x, 0),
              valley = at(x + p.halfLength / p.layers, 0);
            expect(crest.height - valley.height).toBeGreaterThan(0.005);
            expect(crest.color - valley.color).toBeGreaterThan(0.2);
            expect(valley.roughness - crest.roughness).toBeGreaterThan(0.07);
            expect(crest.occlusion - valley.occlusion).toBeGreaterThan(0.2);
          }
          for (const outside of [at(0.49, 0), at(0, 0.4)]) {
            expect(outside.height).toBeLessThan(0.002);
            expect(outside.occlusion).toBeLessThan(0.4);
            expect(outside.roughness).toBeGreaterThan(0.85);
          }
          const crestX = (-phase * 2 * p.halfLength) / p.layers;
          const edgeY = p.halfWidth - 0.015;
          expect(at(crestX, edgeY).height).toBeGreaterThan(
            at(crestX + p.halfLength / p.layers, edgeY).height + 0.005,
          );
        }
    },
  );
  it('keeps lamella shoulders, expanding edges and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('Suminagashi ink-marbled paper', () => {
  const field = (seed: number) => {
    const sample = createSurfaceSampler('suminagashi', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'retains alternating ink and bare paper without engraving the ink for seed %s',
    (seed) => {
      const at = field(seed);
      let darkest = at(0, 0),
        lightest = darkest;
      let low = Infinity,
        high = -Infinity,
        ink = 0,
        paper = 0;
      for (let y = 0; y < 96; y++)
        for (let x = 0; x < 96; x++) {
          const sample = at(x / 96, y / 96);
          if (sample.color < darkest.color) darkest = sample;
          if (sample.color > lightest.color) lightest = sample;
          low = Math.min(low, sample.height);
          high = Math.max(high, sample.height);
          if (sample.color < 0.2) ink++;
          if (sample.color > 0.85) paper++;
        }
      expect(lightest.color - darkest.color).toBeGreaterThan(0.7);
      expect(lightest.roughness - darkest.roughness).toBeGreaterThan(0.07);
      expect(high - low).toBeLessThan(0.00012);
      expect(darkest.occlusion).toBe(lightest.occlusion);
      expect(ink / 9216).toBeGreaterThan(0.025);
      expect(ink / 9216).toBeLessThan(0.4);
      expect(paper / 9216).toBeGreaterThan(0.35);
    },
  );
  it('keeps warped ink contours, paper tooth and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('Coir coconut-fiber mat', () => {
  const p = proceduralMaterialPresets.cocoamat;
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (seed: number) => {
    const sample = createSurfaceSampler('cocoamat', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'keeps curved fibers raised across cell edges while retaining dark backing for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++)
          for (let strand = 0; strand < p.fibers; strand++) {
            const salt = seed ^ Math.imul(strand + 1, 0x9e37);
            const angle = 2 * Math.PI * hash(col, row, salt ^ 0x5a29);
            const cx = col + 0.2 + 0.6 * hash(col, row, salt ^ 0x3145),
              cy = row + 0.2 + 0.6 * hash(col, row, salt ^ 0x4267);
            const amplitude = 0.08 + 0.08 * hash(col, row, salt ^ 0x6b31);
            for (const x of [-0.45, -0.25, 0, 0.25, 0.45]) {
              const y = amplitude * Math.sin((Math.PI * x) / p.halfLength);
              const fiber = at(
                (cx + x * Math.cos(angle) - y * Math.sin(angle)) / p.cells,
                (cy + x * Math.sin(angle) + y * Math.cos(angle)) / p.cells,
              );
              expect(fiber.height).toBeGreaterThan(0.018);
              expect(fiber.color).toBeGreaterThan(0.55);
              expect(fiber.occlusion).toBeGreaterThan(0.95);
              expect(fiber.roughness).toBeLessThan(0.91);
            }
          }
      let backing = 0;
      for (let y = 0; y < 64; y++)
        for (let x = 0; x < 64; x++) {
          const sample = at(x / 64, y / 64);
          if (sample.height < 0.003) {
            backing++;
            expect(sample.color).toBeLessThan(0.11);
            expect(sample.occlusion).toBeLessThan(0.42);
            expect(sample.roughness).toBeGreaterThan(0.95);
          }
        }
      // Neither a solid plate nor isolated sparse noodles: the felted pile
      // retains substantial shadowed interstices between overlapping strands.
      expect(backing / 4096).toBeGreaterThan(0.1);
      expect(backing / 4096).toBeLessThan(0.7);
    },
  );
  it('keeps strand ends, crossings, neighbour windows and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('Saffiano crosshatched leather', () => {
  const p = proceduralMaterialPresets.saffiano;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('saffiano', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'keeps both diagonal grooves below leather plateaus without doubling crossing depth for seed %s',
    (seed) => {
      const at = field(seed);
      const point = (a: number, b: number) =>
        at((a + b) / (2 * p.lines), (a - b) / (2 * p.lines));
      for (let a = 0; a < 8; a++)
        for (let b = 0; b < 8; b++) {
          const plateau = point(a + 0.5, b + 0.5),
            crossing = point(a, b);
          const rising = point(a, b + 0.5),
            falling = point(a + 0.5, b);
          for (const groove of [rising, falling, crossing]) {
            expect(plateau.height - groove.height).toBeGreaterThan(0.0004);
            expect(plateau.color - groove.color).toBeGreaterThan(0.04);
            expect(groove.roughness - plateau.roughness).toBeGreaterThan(0.05);
            expect(plateau.occlusion - groove.occlusion).toBeGreaterThan(0.12);
          }
          expect(Math.abs(crossing.height - rising.height)).toBeLessThan(
            0.00011,
          );
          expect(Math.abs(crossing.height - falling.height)).toBeLessThan(
            0.00011,
          );
        }
    },
  );
  it('keeps diagonal groove shoulders, crossings and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('Bargello flame needlepoint', () => {
  const p = proceduralMaterialPresets.bargello;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('bargello', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'preserves long raised stitches, quarter-step flame seams and color-independent yarn relief for seed %s',
    (seed) => {
      const at = field(seed);
      for (let col = 0; col < p.columns; col++) {
        const zig = col % 16,
          step = Math.min(zig, 15 - zig);
        const u = (col + 0.5) / p.columns;
        const point = (row: number, x = 0, y = 0) =>
          at(u + x / p.columns, (row + 0.5 + step * 0.25 + y) / p.rows);
        for (let row = 0; row < p.rows; row++) {
          const crown = point(row),
            end = point(row, 0, 0.49),
            side = point(row, 0.45);
          expect(crown.height - end.height).toBeGreaterThan(0.0065);
          expect(crown.height - side.height).toBeGreaterThan(0.0065);
          expect(crown.occlusion - end.occlusion).toBeGreaterThan(0.47);
          expect(
            Math.abs(crown.height - point(row, 0, 0.3).height),
          ).toBeLessThan(0.00015);
          expect(
            Math.abs(crown.height - point(row, 0, -0.3).height),
          ).toBeLessThan(0.00015);
        }
        const dark = point(0),
          pale = point(3),
          repeated = point(4);
        expect(pale.color - dark.color).toBeGreaterThan(0.75);
        expect(Math.abs(pale.height - dark.height)).toBeLessThan(0.00015);
        expect(Math.abs(repeated.color - dark.color)).toBeLessThan(0.026);
        if (zig !== 7 && zig !== 15) {
          const seam = (step * 0.25) / p.rows;
          expect(
            at((col + 1.5) / p.columns, seam).height - at(u, seam).height,
          ).toBeGreaterThan(0.0065);
        }
      }
    },
  );
  it('keeps yarn sides, stepped stitch ends, flame reversals and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('diamond-point stone rustication', () => {
  const p = proceduralMaterialPresets.diamondrustication;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('diamondrustication', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'preserves four planar flanks, diagonal ridges, a flat stone collar and lower mortar for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const point = (x: number, y: number) =>
            at((col + 0.5 + x) / p.cells, (row + 0.5 + y) / p.cells);
          const apex = point(0, 0);
          for (let side = 0; side < 4; side++) {
            const angle = (side * Math.PI) / 2,
              c = Math.cos(angle),
              s = Math.sin(angle);
            const flank = (x: number, y: number) =>
              point(x * c - y * s, x * s + y * c);
            const near = flank(0.12, 0.03),
              middle = flank(0.2, 0.03),
              far = flank(0.28, 0.03);
            expect(near.height - middle.height).toBeGreaterThan(0.005);
            expect(middle.height - far.height).toBeGreaterThan(0.005);
            expect(
              Math.abs(near.height - 2 * middle.height + far.height),
            ).toBeLessThan(0.0008);
            const collar = flank(0.4, 0),
              outerCollar = flank(0.42, 0),
              joint = flank(0.5, 0);
            expect(apex.height - collar.height).toBeGreaterThan(0.024);
            expect(Math.abs(collar.height - outerCollar.height)).toBeLessThan(
              0.0004,
            );
            expect(collar.height - joint.height).toBeGreaterThan(0.0075);
            expect(collar.mortar).toBe(0);
            expect(joint.mortar).toBe(1);
            expect(collar.occlusion - joint.occlusion).toBeGreaterThan(0.42);
            expect(
              flank(0.25 / Math.SQRT2, 0.25 / Math.SQRT2).height -
                flank(0.25, 0).height,
            ).toBeGreaterThan(0.003);
          }
        }
    },
  );
  it('keeps apexes, diagonal ridges, flat collars, bevel corners and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
              'mortar',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('golden starfruit slices', () => {
  const p = proceduralMaterialPresets.starfruit;
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (seed: number) => {
    const sample = createSurfaceSampler('starfruit', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'preserves five golden lobes, recessed seed chambers and an unbroken pale core for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const rotation = 2 * Math.PI * hash(col, row, seed ^ 0x4a67);
          const point = (r: number, angle: number) =>
            at(
              (col + 0.5 + r * Math.cos(angle + rotation)) / p.cells,
              (row + 0.5 + r * Math.sin(angle + rotation)) / p.cells,
            );
          const core = point(0, 0);
          expect(core.color).toBeGreaterThan(0.85);
          expect(core.height).toBeGreaterThan(0.01);
          for (let j = 0; j < 5; j++) {
            const angle = (2 * Math.PI * j) / 5;
            const flesh = point(0.18, angle),
              lobe = point(0.36, angle);
            const chamber = point(p.seedRadius, angle),
              rind = point(0.4, angle);
            const notch = point(0.32, angle + Math.PI / 5);
            expect(lobe.height).toBeGreaterThan(0.01);
            expect(point(0.46, angle).height).toBeLessThan(0.001);
            expect(notch.height).toBeLessThan(0.001);
            expect(notch.occlusion).toBeLessThan(0.4);
            expect(flesh.height - chamber.height).toBeGreaterThan(0.0023);
            expect(flesh.color - chamber.color).toBeGreaterThan(0.7);
            expect(flesh.occlusion - chamber.occlusion).toBeGreaterThan(0.29);
            expect(chamber.roughness - flesh.roughness).toBeGreaterThan(0.05);
            expect(flesh.color - rind.color).toBeGreaterThan(0.15);
            expect(Math.abs(flesh.height - core.height)).toBeLessThan(0.0003);
          }
        }
    },
  );
  it('keeps lobes, rind, seed ellipses, polar cores and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('rolled steel rebar', () => {
  const p = proceduralMaterialPresets.rebar;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('rebar', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'preserves rounded steel shafts, raised diagonal ribs and recessed metal backing for seed %s',
    (seed) => {
      const at = field(seed);
      for (let col = 0; col < p.columns; col++) {
        const hand = col % 2 ? -1 : 1;
        const point = (x: number, phase: number) =>
          at(
            (col + 0.5 + x) / p.columns,
            (phase - hand * p.slant * x) / p.ribs,
          );
        for (let rib = 0; rib < p.ribs; rib++) {
          const center = point(0, rib),
            shoulder = point(0.28, rib),
            gap = point(0.42, rib);
          expect(center.height - shoulder.height).toBeGreaterThan(0.002);
          expect(center.height - gap.height).toBeGreaterThan(0.016);
          expect(gap.occlusion).toBeLessThan(0.45);
          expect(center.occlusion).toBeGreaterThan(0.9);
          expect(center.metallic).toBe(1);
          expect(gap.metallic).toBe(1);
          for (const x of [-0.25, 0, 0.25]) {
            const ridge = point(x, rib),
              valley = point(x, rib + 0.5);
            expect(ridge.height - valley.height).toBeGreaterThan(0.002);
            expect(valley.roughness - ridge.roughness).toBeGreaterThan(0.02);
          }
          const wrongSlope = at(
            (col + 0.75) / p.columns,
            (rib + hand * p.slant * 0.25) / p.ribs,
          );
          expect(point(0.25, rib).height - wrongSlope.height).toBeGreaterThan(
            0.002,
          );
        }
      }
    },
  );
  it('keeps shaft silhouettes, diagonal rib slopes and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('English-bond brick courses', () => {
  const p = proceduralMaterialPresets.englishbond;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('englishbond', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'alternates header and stretcher courses without widening mortar for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.rows; row++) {
        const headers = row % 2 === 0,
          columns = headers ? 8 : 4,
          offset = headers ? 0.5 : 0;
        const v = (row + 0.5) / p.rows;
        for (let col = 0; col < columns; col++) {
          const u = (col + 0.5 - offset) / columns;
          const center = at(u, v),
            joint = at((col + 1 - offset) / columns, v);
          expect(center.height - joint.height).toBeGreaterThan(0.017);
          expect(center.occlusion - joint.occlusion).toBeGreaterThan(0.35);
          expect(center.mortar).toBe(0);
          expect(joint.mortar).toBe(1);
          expect(at(u, (row + 1) / p.rows).mortar).toBe(1);
          const side = at((col + 1 - offset) / columns - 0.05 / p.rows, v);
          const bed = at(u, (row + 1) / p.rows - 0.05 / p.rows);
          expect(side.mortar).toBeGreaterThan(0.3);
          expect(side.mortar).toBeLessThan(0.5);
          expect(Math.abs(side.mortar - bed.mortar)).toBeLessThan(1e-12);
          expect(Math.abs(side.height - bed.height)).toBeLessThan(0.001);
        }
      }
      for (let row = 0; row < p.rows; row += 2) {
        const header = (row + 0.5) / p.rows,
          stretcher = (row + 1.5) / p.rows;
        for (let col = 0; col < 4; col++) {
          const perpend = col / 4;
          expect(
            at(perpend, header).height - at(perpend, stretcher).height,
          ).toBeGreaterThan(0.017);
          expect(
            at(perpend + 0.0625, stretcher).height -
              at(perpend + 0.0625, header).height,
          ).toBeGreaterThan(0.017);
        }
      }
    },
  );
  it('keeps alternating course ownership, bevel corners and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
              'mortar',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('spiny holly leaves', () => {
  const p = proceduralMaterialPresets.hollyleaf;
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (seed: number) => {
    const sample = createSurfaceSampler('hollyleaf', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'preserves paired pointed margins, recessed notches, an apical point and raised veins for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const angle = 2 * Math.PI * hash(col, row, seed ^ 0x6b29),
            c = Math.cos(angle),
            s = Math.sin(angle);
          const point = (x: number, y: number) =>
            at(
              (col + 0.5 + x * c - y * s) / p.cells,
              (row + 0.5 + x * s + y * c) / p.cells,
            );
          const face = point(0, 0);
          expect(face.height).toBeGreaterThan(0.018);
          expect(face.roughness).toBeLessThan(0.4);
          for (const side of [-1, 1]) {
            for (const center of [-0.18, 0, 0.18]) {
              const spine = point(side * 0.235, center + 0.0247);
              expect(spine.height).toBeGreaterThan(0.018);
              expect(point(side * 0.32, center + 0.035).height).toBeLessThan(
                0.002,
              );
            }
            for (const y of [-0.09, 0.09]) {
              const notch = point(side * 0.22, y);
              expect(notch.height).toBeLessThan(0.002);
              expect(notch.occlusion).toBeLessThan(0.4);
            }
          }
          expect(point(0, 0.35).height).toBeGreaterThan(0.018);
          expect(point(0, 0.43).height).toBeLessThan(0.002);
          const stem = point(0, -0.38);
          expect(stem.height).toBeGreaterThan(0.004);
          expect(face.height - stem.height).toBeGreaterThan(0.009);
          expect(
            point(0, 0.08).height - point(0.04, 0.08).height,
          ).toBeGreaterThan(0.0008);
          expect(
            point(0.1, 0.012).height - point(0.1, 0.05).height,
          ).toBeGreaterThan(0.00015);
        }
    },
  );
  it('keeps spiny margins, pointed tips, vein junctions and tile wrap C1 continuous', () => {
    const h = 1e-10;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('round-ended slotted wood', () => {
  const p = proceduralMaterialPresets.slottedwood;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('slottedwood', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'cuts finite staggered capsule slots while retaining wood bridges and circular ends for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.rows; row++)
        for (let col = 0; col < p.columns; col++) {
          const u = (col + 0.5 + (row % 2) * 0.5) / p.columns,
            v = (row + 0.5) / p.rows;
          const point = (x: number, y: number) =>
            at(u + x / p.columns, v + y / p.rows);
          const floor = point(0, 0),
            bridge = point(0, 0.4);
          expect(bridge.height - floor.height).toBeGreaterThan(0.016);
          expect(bridge.color - floor.color).toBeGreaterThan(0.5);
          expect(floor.occlusion).toBeLessThan(0.3);
          expect(floor.roughness - bridge.roughness).toBeGreaterThan(0.2);
          for (const side of [-1, 1]) {
            expect(
              Math.abs(point(side * 0.22, 0).height - floor.height),
            ).toBeLessThan(0.0001);
            expect(
              Math.abs(point(side * 0.305, 0).height - floor.height),
            ).toBeLessThan(0.0001);
            expect(point(side * 0.36, 0).height).toBeGreaterThan(0.018);
            const axial = point(side * 0.32, 0),
              transverse = point(side * 0.29, 0.06);
            expect(Math.abs(axial.height - transverse.height)).toBeLessThan(
              0.001,
            );
            expect(
              point(side * 0.32, 0.06).height - axial.height,
            ).toBeGreaterThan(0.009);
          }
          expect(at(u, v + 1 / p.rows).height - floor.height).toBeGreaterThan(
            0.016,
          );
          expect(
            Math.abs(
              at(u + 0.5 / p.columns, v + 1 / p.rows).height - floor.height,
            ),
          ).toBeLessThan(0.0001);
        }
    },
  );
  it('keeps slot sidewalls, semicircular ends, staggered rows and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('warp-dyed ikat cloth', () => {
  const p = proceduralMaterialPresets.ikat;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('ikat', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'feathers diamond dye along warp yarns without embossing the pigment for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const u = (col + 0.5) / p.cells,
            v = (row + 0.5) / p.cells;
          const light = at(u, v),
            dark = at(u, v + 0.5 / p.cells);
          expect(light.color).toBeGreaterThan(0.85);
          expect(dark.color).toBeLessThan(0.1);
          expect(Math.abs(light.height - dark.height)).toBeLessThan(0.0001);
          expect(Math.abs(light.roughness - dark.roughness)).toBeLessThan(0.03);
          expect(Math.abs(light.occlusion - dark.occlusion)).toBeLessThan(
            0.001,
          );
        }
      const midpoints: number[] = [];
      for (let yarn = 0; yarn <= 16; yarn++) {
        const x = -0.24 + (0.48 * yarn) / 16,
          u = (0.5 + x) / p.cells;
        const center = (row: number) => {
          const roots: number[] = [];
          for (const side of [-1, 1]) {
            let low = 0,
              high = 0.49;
            for (let step = 0; step < 24; step++) {
              const middle = (low + high) / 2;
              if (at(u, (row + 0.5 + side * middle) / p.cells).color > 0.45)
                low = middle;
              else high = middle;
            }
            roots.push((side * (low + high)) / 2);
          }
          return (roots[0]! + roots[1]!) / 2;
        };
        const first = center(0);
        midpoints.push(first);
        expect(Math.abs(first - center(1))).toBeLessThan(0.004);
      }
      // A straight printed diamond would have one common centerline;
      // warp dye shifts it differently for neighboring yarns.
      const spread = Math.max(...midpoints) - Math.min(...midpoints);
      expect(spread).toBeGreaterThan(0.025);
      expect(spread).toBeLessThan(0.17);
    },
  );
  it('keeps feathered dye edges, diamond tips and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('Portuguese wave stone pavement', () => {
  const p = proceduralMaterialPresets.calcadawaves;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('calcadawaves', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'forms alternating wave bands from whole coplanar black and white stones for seed %s',
    (seed) => {
      const at = field(seed);
      const stone = (col: number, row: number, x = 0, y = 0) =>
        at((col + 0.5 + x) / p.cells, (row + 0.5 + y) / p.cells);
      expect(stone(3, 1).color).toBeLessThan(0.2);
      expect(stone(11, 1).color).toBeGreaterThan(0.7);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const center = stone(col, row),
            white = center.color > 0.5;
          const opposite = stone(col, (row + 4) % p.cells),
            repeat = stone(col, (row + 8) % p.cells);
          expect(opposite.color > 0.5).toBe(!white);
          expect(repeat.color > 0.5).toBe(white);
          expect(Math.abs(center.height - opposite.height)).toBeLessThan(0.001);
          expect(Math.abs(center.roughness - opposite.roughness)).toBeLessThan(
            0.04,
          );
          expect(center.occlusion).toBe(opposite.occlusion);
          for (const x of [-0.25, 0.25])
            for (const y of [-0.25, 0.25]) {
              const corner = stone(col, row, x, y);
              if (white) expect(corner.color).toBeGreaterThan(0.7);
              else expect(corner.color).toBeLessThan(0.2);
            }
          for (const [x, y] of [
            [-0.5, 0],
            [0.5, 0],
            [0, -0.5],
            [0, 0.5],
          ]) {
            const joint = stone(col, row, x, y);
            expect(center.height - joint.height).toBeGreaterThan(0.009);
            expect(joint.occlusion).toBeLessThan(0.5);
            expect(joint.mortar).toBe(1);
          }
        }
    },
  );
  it('keeps tessera bevels, black-white boundaries and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
              'mortar',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('woodworm galleries', () => {
  const p = proceduralMaterialPresets.woodworm;
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (seed: number) => {
    const sample = createSurfaceSampler('woodworm', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'cuts winding galleries into intact timber and places deeper exit bores at their ends for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const angle = 2 * Math.PI * hash(col, row, seed ^ 0x5e31);
          const c = Math.cos(angle),
            s = Math.sin(angle),
            amplitude = 0.06 + 0.05 * hash(col, row, seed ^ 0x2b47);
          const point = (x: number, y: number) =>
            at(
              (col + 0.5 + x * c - y * s) / p.cells,
              (row + 0.5 + x * s + y * c) / p.cells,
            );
          const middle = point(0, 0);
          for (const x of [-0.21, -0.1, 0, 0.1, 0.21]) {
            const y = amplitude * Math.sin((2 * Math.PI * x) / 0.6);
            const channel = point(x, y),
              wood = point(x, y + 0.1);
            expect(wood.height - channel.height).toBeGreaterThan(0.007);
            expect(wood.color - channel.color).toBeGreaterThan(0.15);
            expect(channel.occlusion).toBeLessThan(0.65);
            expect(wood.occlusion).toBeGreaterThan(0.93);
          }
          for (const side of [-1, 1]) {
            const bore = point(side * 0.3, 0);
            expect(middle.height - bore.height).toBeGreaterThan(0.004);
            expect(bore.occlusion).toBeLessThan(0.4);
            expect(point(side * 0.4, 0).height).toBeGreaterThan(0.018);
            expect(
              point(side * 0.3, 0.08).height - bore.height,
            ).toBeGreaterThan(0.014);
          }
        }
    },
  );
  it('keeps gallery walls, exit rims, rotated supports and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('coffered concrete slab', () => {
  const p = proceduralMaterialPresets.cofferedconcrete;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('cofferedconcrete', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'keeps shared flat ribs above tapered square chambers for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const point = (x: number, y: number) =>
            at((col + 0.5 + x) / p.cells, (row + 0.5 + y) / p.cells);
          const bed = point(0, 0),
            corner = point(0.46, 0.46);
          expect(corner.height - bed.height).toBeGreaterThan(0.025);
          expect(corner.color - bed.color).toBeGreaterThan(0.14);
          expect(bed.occlusion).toBeLessThan(0.55);
          expect(corner.occlusion).toBeGreaterThan(0.93);
          for (const side of [-1, 1]) {
            for (const t of [-0.46, -0.2, 0, 0.2, 0.46]) {
              expect(point(side * 0.46, t).height).toBeGreaterThan(0.031);
              expect(point(t, side * 0.46).height).toBeGreaterThan(0.031);
            }
            for (const t of [-0.2, 0, 0.2])
              expect(
                Math.abs(point(side * 0.2, t).height - bed.height),
              ).toBeLessThan(0.001);
            for (const axis of [0, 1]) {
              const wall = (r: number) =>
                point(axis ? 0 : side * r, axis ? side * r : 0);
              expect(wall(0.33).height - wall(0.29).height).toBeGreaterThan(
                0.008,
              );
              expect(wall(0.37).height - wall(0.33).height).toBeGreaterThan(
                0.008,
              );
            }
          }
          expect(
            point(0.33, 0.33).height - point(0.33, 0).height,
          ).toBeGreaterThan(0.006);
        }
    },
  );
  it('keeps chamber beds, sloped walls, rib junctions and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('crimped metal crown caps', () => {
  const p = proceduralMaterialPresets.crowncaps;
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (seed: number) => {
    const sample = createSurfaceSampler('crowncaps', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'keeps flat crowns above twenty-one crimped skirt folds and below rolled rims for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const polar = (r: number, angle: number) =>
            at(
              (col + 0.5 + r * Math.cos(angle)) / p.cells,
              (row + 0.5 + r * Math.sin(angle)) / p.cells,
            );
          const center = polar(0, 0),
            phase = 2 * Math.PI * hash(col, row, seed ^ 0x7a13);
          expect(center.height).toBeGreaterThan(0.013);
          expect(center.metallic).toBe(1);
          for (let tooth = 0; tooth < p.teeth; tooth++) {
            const peak = (tooth * 2 * Math.PI - phase) / p.teeth,
              valley = peak + Math.PI / p.teeth;
            const inner = polar(0.2, peak),
              rim = polar(0.325, peak),
              fold = polar(0.39, peak),
              groove = polar(0.39, valley);
            expect(Math.abs(inner.height - center.height)).toBeLessThan(0.0001);
            expect(rim.height - center.height).toBeGreaterThan(0.0015);
            expect(center.height - fold.height).toBeGreaterThan(0.005);
            expect(fold.height - groove.height).toBeGreaterThan(0.001);
            expect(
              polar(0.435, peak).height - polar(0.435, valley).height,
            ).toBeGreaterThan(0.004);
            expect(polar(0.48, peak).height).toBeLessThan(0.001);
            expect(groove.occlusion).toBeLessThan(fold.occlusion);
          }
        }
    },
  );
  it('keeps crown poles, rolled lips, crimp edges and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('dried lotus seedpod chambers', () => {
  const p = proceduralMaterialPresets.lotusseedpod;
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (seed: number) => {
    const sample = createSurfaceSampler('lotusseedpod', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'separates raised rims, recessed chambers and embedded seeds for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const local = (x: number, y: number) =>
            at((col + 0.5 + x) / p.cells, (row + 0.5 + y) / p.cells);
          const face = local(0.39, 0),
            gap = local(0.5, 0.5);
          expect(face.height).toBeGreaterThan(0.02);
          expect(face.color).toBeGreaterThan(0.6);
          expect(gap.height).toBeLessThan(0.002);
          expect(gap.occlusion).toBeLessThan(0.4);
          const phase = 2 * Math.PI * hash(col, row, seed ^ 0x2f51);
          for (let chamber = 0; chamber < 7; chamber++) {
            // Locate the seeded chamber without reproducing surface outputs.
            const id = col * 7 + chamber;
            const angle =
              phase +
              ((chamber - 1) * 2 * Math.PI) / 6 +
              0.1 * (hash(id, row, seed ^ 0x7b31) - 0.5);
            const distance =
              chamber === 0 ? 0 : 0.235 + 0.03 * hash(id, row, seed ^ 0x3c49);
            const radius = 0.07 + 0.015 * hash(id, row, seed ^ 0x8e17);
            const x = distance * Math.cos(angle),
              y = distance * Math.sin(angle);
            const embedded = local(x, y),
              floor = local(x + radius * Math.sqrt(0.3), y),
              rim = local(x + radius * Math.sqrt(1.1), y);
            expect(embedded.height - floor.height).toBeGreaterThan(0.005);
            expect(face.height - embedded.height).toBeGreaterThan(0.007);
            expect(rim.height - face.height).toBeGreaterThan(0.002);
            expect(floor.occlusion).toBeLessThan(0.51);
            expect(embedded.occlusion).toBeLessThan(face.occlusion);
            expect(embedded.roughness).toBeLessThan(face.roughness - 0.1);
            expect(face.color - embedded.color).toBeGreaterThan(0.3);
          }
        }
    },
  );
  it('keeps seed caps, chamber lips, pod edges and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('asanoha hemp leaf printed cloth', () => {
  const p = proceduralMaterialPresets.asanoha;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('asanoha', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'prints connected triangular lattice and three-spoke leaf divisions without embossed dye for seed %s',
    (seed) => {
      const at = field(seed),
        step = Math.sqrt(3) / 2;
      for (let row = 0; row < p.rows; row++)
        for (let col = 0; col < p.columns; col++)
          for (const upper of [false, true]) {
            const local = (x: number, y: number) => {
              if (upper) {
                x = 1.5 - x;
                y = step - y;
              }
              return at(
                (col + 0.5 * row + x) / p.columns,
                (row + y / step) / p.rows,
              );
            };
            let minHeight = Infinity,
              maxHeight = -Infinity;
            for (const [x, y] of [
              [0.5, 0],
              [0.25, step / 2],
              [0.75, step / 2],
              [0.5, step / 3],
              [0.25, step / 6],
              [0.75, step / 6],
              [0.5, (2 * step) / 3],
            ]) {
              const stroke = local(x, y);
              expect(stroke.color).toBeGreaterThan(0.88);
              minHeight = Math.min(minHeight, stroke.height);
              maxHeight = Math.max(maxHeight, stroke.height);
            }
            for (let sector = 0; sector < 3; sector++) {
              const angle = (sector * 2 * Math.PI) / 3;
              const interior = local(
                0.5 - (0.1 - step / 3) * Math.sin(angle),
                step / 3 + (0.1 - step / 3) * Math.cos(angle),
              );
              expect(interior.color).toBeLessThan(0.2);
              minHeight = Math.min(minHeight, interior.height);
              maxHeight = Math.max(maxHeight, interior.height);
            }
            expect(maxHeight - minHeight).toBeLessThan(p.relief * 0.2);
          }
    },
  );
  it('keeps printed intersections, triangle ownership and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('palm wood end grain vascular bundles', () => {
  const p = proceduralMaterialPresets.palmendgrain;
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (seed: number) => {
    const sample = createSurfaceSampler('palmendgrain', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'cuts dark flush bundles and paired recessed vessels without annual rings for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          // Locate the seeded bundle, without reproducing its shading.
          const cx = col + 0.35 + 0.3 * hash(col, row, seed ^ 0x2b19),
            cy = row + 0.35 + 0.3 * hash(col, row, seed ^ 0x6e41);
          const angle = 2 * Math.PI * hash(col, row, seed ^ 0x5d37);
          const local = (x: number, y: number) =>
            at(
              (cx + x * Math.cos(angle) - y * Math.sin(angle)) / p.cells,
              (cy + x * Math.sin(angle) + y * Math.cos(angle)) / p.cells,
            );
          const fiber = local(0, 0);
          expect(fiber.color).toBeLessThan(0.35);
          expect(fiber.occlusion).toBe(0.99);
          for (const x of [-0.09, 0.09]) {
            const vessel = local(x, 0);
            expect(fiber.height - vessel.height).toBeGreaterThan(
              p.relief * 0.26,
            );
            expect(vessel.occlusion).toBeLessThan(0.75);
            expect(vessel.color).toBeLessThan(fiber.color - 0.08);
          }
          for (let direction = 0; direction < 8; direction++) {
            const a = (direction * Math.PI) / 4;
            const matrix = at(
              (cx + 0.32 * Math.cos(a)) / p.cells,
              (cy + 0.32 * Math.sin(a)) / p.cells,
            );
            expect(matrix.color).toBeGreaterThan(0.75);
            expect(Math.abs(matrix.height - fiber.height)).toBeLessThan(
              p.relief * 0.013,
            );
            expect(matrix.occlusion).toBe(0.99);
          }
        }
    },
  );
  it('keeps vessel lips, bundle support, cell boundaries and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('interlocking dogbone concrete pavers', () => {
  const p = proceduralMaterialPresets.dogbonepavers;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('dogbonepavers', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'joins wide ends through narrow waists and interlocks adjacent staggered columns for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.rows; row++)
        for (let col = 0; col < p.columns; col++) {
          const local = (x: number, y: number) =>
            at(
              (col + 0.5 + x) / p.columns,
              (row * 2 + (col % 2) + 1 + y) / (p.rows * 2),
            );
          for (const [x, y] of [
            [0, 0],
            [-0.2, 0],
            [0.2, 0],
            [0, -0.5],
            [0, 0.5],
            [-0.53, -0.85],
            [0.53, -0.85],
            [-0.53, 0.85],
            [0.53, 0.85],
          ]) {
            const face = local(x, y);
            expect(face.height).toBeGreaterThan(0.015);
            expect(face.mortar).toBe(0);
            expect(face.occlusion).toBe(1);
          }
          for (const [x, y] of [
            [0.35, 0],
            [-0.35, 0],
            [0.5, 0],
            [0.5, 0.5],
            [-0.5, -0.5],
            [0.65, 0.85],
            [-0.65, -0.85],
            [0, 1],
            [0, -1],
          ]) {
            const joint = local(x, y);
            expect(joint.height).toBe(0);
            expect(joint.mortar).toBe(1);
            expect(joint.occlusion).toBe(0.5);
          }
          // Wide ends of the neighboring column occupy the waist recess;
          // this would be empty in a grid of isolated dogbone silhouettes.
          for (const x of [-0.5, 0.5]) {
            expect(local(x, 0.15).height).toBeGreaterThan(0.015);
            expect(local(x, -0.15).mortar).toBe(0);
          }
        }
    },
  );
  it('keeps waist shoulders, end corners, column lookup and wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 80; y++)
        for (let x = 0; x <= 80; x++)
          for (const axis of [0, 1]) {
            const u = x / 80,
              v = y / 80;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
              'mortar',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('raised polygonal salt pan crust', () => {
  const p = proceduralMaterialPresets.saltpan;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('saltpan', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'encloses low crust interiors with irregular pale raised ridges rather than depressed cracks for seed %s',
    (seed) => {
      const at = field(seed);
      let displacedEdges = 0;
      for (let y = 0; y < p.cells; y++)
        for (let x = 0; x < p.cells; x++)
          for (const [dx, dy] of [
            [1, 0],
            [y % 2 === 0 ? 0.5 : -0.5, 1],
          ]) {
            const along = (t: number) =>
              at(
                (x + 0.5 + (y % 2) * 0.5 + dx * t) / p.cells,
                (y + 0.5 + dy * t) / p.cells,
              );
            const a = along(0),
              b = along(1);
            expect(a.height).toBeLessThan(0.004);
            expect(b.height).toBeLessThan(0.004);
            expect(a.color).toBeLessThan(0.5);
            let peak = a,
              peakAt = 0;
            for (let step = 1; step < 128; step++) {
              const s = along(step / 128);
              if (s.height > peak.height) {
                peak = s;
                peakAt = step / 128;
              }
            }
            expect(peak.height).toBeGreaterThan(0.018);
            expect(peak.color).toBeGreaterThan(0.75);
            expect(peak.roughness - a.roughness).toBeGreaterThan(0.03);
            expect(peakAt).toBeGreaterThan(0.25);
            expect(peakAt).toBeLessThan(0.75);
            if (Math.abs(peakAt - 0.5) > 0.04) displacedEdges++;
          }
      expect(displacedEdges).toBeGreaterThan(4);
    },
  );
  it('keeps polygon corners, bisectors, spatial lookup and wrapped ridges C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 64; y++)
        for (let x = 0; x <= 64; x++)
          for (const axis of [0, 1]) {
            const u = x / 64,
              v = y / 64;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('overlapping scalloped slate roof', () => {
  const p = proceduralMaterialPresets.scallopedslate;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('scallopedslate', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'overlaps staggered rows with high rounded tails and a recessed shadow below each lip for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.rows; row++)
        for (let col = 0; col < p.columns; col++) {
          const local = (x: number, y: number) =>
            at(
              (col + 0.5 - (row % 2) * 0.5 + x) / p.columns,
              (row + y) / p.rows,
            );
          const body = local(0, 0.65),
            lip = local(0, 1.25),
            shadow = local(0, 1.4),
            exposed = local(0, 1.48);
          expect(lip.height - body.height).toBeGreaterThan(0.0015);
          expect(lip.height - shadow.height).toBeGreaterThan(0.007);
          expect(exposed.occlusion - shadow.occlusion).toBeGreaterThan(0.25);
          expect(lip.occlusion).toBeCloseTo(0.98, 10);
          // The long center survives below both curved corners: a straight
          // rectangular tab or a rounded color decal cannot satisfy this.
          for (const x of [-0.35, 0.35]) {
            expect(local(0, 1.3).height - local(x, 1.3).height).toBeGreaterThan(
              0.004,
            );
            expect(local(x, 0.65).height).toBeGreaterThan(0.013);
          }
          expect(exposed.height).toBeGreaterThan(0.007);
        }
    },
  );
  it('keeps staggered ownership, rounded lips, overlap shadows and wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 96; y++)
        for (let x = 0; x <= 64; x++)
          for (const axis of [0, 1]) {
            const u = x / 64,
              v = y / 96;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('indigo shibori resist dyed cloth', () => {
  const p = proceduralMaterialPresets.shibori;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('shibori', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'retains dark centers and gaps, pale feathered rings and radial tie marks without embossing dye for seed %s',
    (seed) => {
      const at = field(seed);
      for (let y = 0; y < p.cells; y++)
        for (let x = 0; x < p.cells; x++) {
          const radial = (r: number, angle: number) =>
            at(
              (x + 0.5 + r * Math.cos(angle)) / p.cells,
              (y + 0.5 + r * Math.sin(angle)) / p.cells,
            );
          expect(radial(0, 0).color).toBeLessThan(0.1);
          for (const r of [0.17, 0.34]) {
            const ring = Array.from(
              { length: 128 },
              (_, i) => radial(r, (2 * Math.PI * i) / 128).color,
            );
            expect(Math.min(...ring)).toBeGreaterThan(0.35);
            expect(Math.max(...ring)).toBeGreaterThan(0.8);
            expect(Math.max(...ring) - Math.min(...ring)).toBeGreaterThan(0.25);
          }
          for (let i = 0; i < 64; i++) {
            expect(radial(0.25, (2 * Math.PI * i) / 64).color).toBeLessThan(
              0.12,
            );
            expect(radial(0.48, (2 * Math.PI * i) / 64).color).toBeLessThan(
              0.1,
            );
          }
        }
      // Equal weave phases across the dyed and undyed regions must stay flat
      // relative to one another; only the small grain may change their height.
      const points = Array.from({ length: 1024 }, (_, i) =>
        at((i % 32) / 32 + 0.0013, Math.floor(i / 32) / 32 + 0.0027),
      );
      const colors = points.map((s) => s.color),
        heights = points.map((s) => s.height);
      expect(Math.max(...colors) - Math.min(...colors)).toBeGreaterThan(0.7);
      expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(
        0.000037,
      );
      for (const s of points)
        expect(s.occlusion).toBeCloseTo(points[0].occlusion, 10);
    },
  );
  it('keeps dye centers, angular wrap, rings, cell edges and tile wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 72; y++)
        for (let x = 0; x <= 72; x++)
          for (const axis of [0, 1]) {
            const u = x / 72,
              v = y / 72;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('interlocking herringbone brick paving', () => {
  const p = proceduralMaterialPresets.herringbonebrick;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('herringbonebrick', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'interlocks complete horizontal and vertical long bricks without internal cell joints for seed %s',
    (seed) => {
      const at = field(seed);
      const bricks = [
        [0, 0, 2, 1],
        [3, 1, 2, 1],
        [2, 2, 2, 1],
        [1, 3, 2, 1],
        [2, 0, 1, 2],
        [1, 1, 1, 2],
        [0, 2, 1, 2],
        [3, 3, 1, 2],
      ] as const;
      for (const oy of [0, 4])
        for (const ox of [0, 4])
          for (const [x, y, width, depth] of bricks) {
            const local = (a: number, b: number) =>
              at((ox + x + a) / p.cells, (oy + y + b) / p.cells);
            const center = local(width / 2, depth / 2);
            for (const point of [
              center,
              local(width / 2 - 0.1, depth / 2),
              local(width / 2 + 0.1, depth / 2),
              local(width / 2, depth / 2 - 0.1),
              local(width / 2, depth / 2 + 0.1),
              local(0.15, 0.15),
              local(width - 0.15, depth - 0.15),
            ]) {
              expect(point.height).toBeGreaterThan(0.014);
              expect(point.mortar).toBe(0);
              expect(point.occlusion).toBe(1);
            }
            for (const [a, b] of [
              [0, depth / 2],
              [width, depth / 2],
              [width / 2, 0],
              [width / 2, depth],
              [0, 0],
            ]) {
              const joint = local(a, b);
              expect(joint.height).toBe(0);
              expect(joint.mortar).toBe(1);
              expect(joint.roughness - center.roughness).toBeGreaterThan(0.13);
              expect(joint.occlusion).toBe(0.55);
            }
          }
    },
  );
  it('keeps internal domino cell changes, T joints, brick bevels and wrap C1 continuous', () => {
    const h = 1e-8;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 64; y++)
        for (let x = 0; x <= 64; x++)
          for (const axis of [0, 1]) {
            const u = x / 64,
              v = y / 64;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
              'mortar',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('stamped metal louvers', () => {
  const p = proceduralMaterialPresets.louveredmetal;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('louveredmetal', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'raises directional lips over lower slots while retaining both sheet attachments for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.rows; row++)
        for (let col = 0; col < p.columns; col++) {
          const local = (x: number, y: number) =>
            at((col + 0.5 + x) / p.columns, (row + 0.5 + y) / p.rows);
          const plate = local(0, -0.35),
            upper = local(0, -0.12),
            middle = local(0, 0),
            lip = local(0, 0.18),
            slot = local(0, 0.3);
          expect(upper.height).toBeGreaterThan(plate.height + 0.002);
          expect(middle.height).toBeGreaterThan(upper.height + 0.006);
          expect(lip.height).toBeGreaterThan(middle.height + 0.008);
          expect(slot.height).toBeLessThan(plate.height - 0.002);
          expect(lip.color - slot.color).toBeGreaterThan(0.5);
          expect(slot.roughness - lip.roughness).toBeGreaterThan(0.14);
          expect(slot.occlusion).toBeLessThan(0.36);
          for (const x of [-0.46, 0.46]) {
            const side = local(x, 0.18),
              sideSlot = local(x, 0.3);
            expect(Math.abs(side.height - plate.height)).toBeLessThan(0.00025);
            expect(Math.abs(sideSlot.height - plate.height)).toBeLessThan(
              0.00025,
            );
            expect(sideSlot.occlusion).toBe(1);
          }
          for (const point of [plate, upper, middle, lip, slot]) {
            expect(point.metallic).toBe(1);
            expect(point.mortar).toBe(0);
          }
        }
    },
  );
  it('keeps blade ends, upper attachments, lower lips, slot exits and wrap C1 continuous', () => {
    const h = 1e-8;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 64; y++)
        for (let x = 0; x <= 64; x++)
          for (const axis of [0, 1]) {
            const u = x / 64,
              v = y / 64;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('diamond tufted leather', () => {
  const p = proceduralMaterialPresets.tuftedleather;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('tuftedleather', seed);
    return (a: number, b: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample((a + b) / (2 * p.diamonds), (a - b) / (2 * p.diamonds), out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'pulls leather buttons into diamond creases below the padded crowns for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.diamonds; row++)
        for (let col = 0; col < p.diamonds; col++) {
          const crown = at(col + 0.5, row + 0.5);
          const button = at(col, row);
          const pocket = at(col + 0.1, row);
          const creaseA = at(col, row + 0.5),
            creaseB = at(col + 0.5, row);
          expect(crown.height).toBeGreaterThan(0.028);
          expect(crown.height - button.height).toBeGreaterThan(0.018);
          expect(button.height - pocket.height).toBeGreaterThan(0.005);
          expect(button.color - pocket.color).toBeGreaterThan(0.05);
          expect(button.occlusion).toBeGreaterThan(pocket.occlusion + 0.08);
          for (const crease of [creaseA, creaseB]) {
            expect(crease.height).toBeLessThan(0.006);
            expect(crown.color - crease.color).toBeGreaterThan(0.25);
            expect(crease.roughness - crown.roughness).toBeGreaterThan(0.1);
            expect(crown.occlusion - crease.occlusion).toBeGreaterThan(0.45);
          }
          expect(button.metallic).toBe(0);
          // A round covered button has no diamond corners or cross-shaped arms.
          for (const angle of [0, Math.PI / 4, Math.PI / 2]) {
            const inner = at(
              col + 0.04 * Math.cos(angle),
              row + 0.04 * Math.sin(angle),
            );
            const outer = at(
              col + 0.1 * Math.cos(angle),
              row + 0.1 * Math.sin(angle),
            );
            expect(inner.height - outer.height).toBeGreaterThan(0.004);
          }
        }
    },
  );
  it('keeps diagonal folds, circular button lips, pockets and wrap C1 continuous', () => {
    const h = 1e-8;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 64; y++)
        for (let x = 0; x <= 64; x++)
          for (const axis of [0, 1]) {
            const u = (x * p.diamonds) / 64,
              v = (y * p.diamonds) / 64;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('blue seigaiha wave tiles', () => {
  const p = proceduralMaterialPresets.seigaihatiles;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('seigaihatiles', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x, y, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'prints nested ivory arcs on blue coplanar glaze with recessed gray joints for seed %s',
    (seed) => {
      const at = field(seed);
      const point = (radius: number, angle: number) =>
        at(
          (1 + radius * Math.sin(angle)) / p.columns,
          (1.5 - radius * Math.cos(angle)) / (p.rows * 0.5),
        );
      for (const angle of [-0.3, 0, 0.3])
        for (const radius of [0.26, 0.4, 0.54]) {
          const ivory = point(radius, angle),
            blue = point(radius + 0.07, angle);
          expect(ivory.color).toBeGreaterThan(0.85);
          expect(blue.color).toBeLessThan(0.14);
          expect(Math.abs(ivory.height - blue.height)).toBeLessThan(0.00008);
          expect(ivory.height).toBeGreaterThan(0.011);
          expect(ivory.occlusion).toBe(1);
          expect(blue.occlusion).toBe(1);
          expect(ivory.mortar).toBe(0);
          expect(ivory.roughness).toBeLessThan(0.3);
        }
      for (const [u, v] of [
        [0, 0.2],
        [0.5, 0.7],
        [0.2, 0],
        [0.7, 0.5],
        [0.5, 0.5],
      ]) {
        const joint = at(u, v);
        expect(joint.height).toBe(0);
        expect(joint.mortar).toBe(1);
        expect(joint.roughness).toBeGreaterThan(0.65);
        expect(joint.occlusion).toBe(0.5);
      }
    },
  );
  it('keeps staggered paint overlaps, disc nuclei, tile corners and wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 64; y++)
        for (let x = 0; x <= 64; x++)
          for (const axis of [0, 1]) {
            const u = x / 64,
              v = y / 64;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
              'mortar',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('spiral fossil limestone', () => {
  const p = proceduralMaterialPresets.fossillimestone;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('fossillimestone', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x, y, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'exposes contrasting spiral walls within a flush polished matrix for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const local = (x: number, y: number) =>
            at((col + 0.5 + x) / p.cells, (row + 0.5 + y) / p.cells);
          const nucleus = local(0, 0),
            matrix = local(0.46, 0.46);
          expect(nucleus.color).toBeLessThan(0.3);
          expect(matrix.color).toBeGreaterThan(0.48);
          expect(matrix.roughness).toBeGreaterThan(0.43);
          let asymmetricWalls = 0;
          let minHeight = Infinity,
            maxHeight = -Infinity;
          const profile = Array.from({ length: 451 }, (_, i) =>
            local(i / 1000, 0),
          );
          for (let i = 1; i < profile.length - 1; i++) {
            const point = profile[i];
            minHeight = Math.min(minHeight, point.height);
            maxHeight = Math.max(maxHeight, point.height);
            expect(point.occlusion).toBe(0.99);
            expect(point.mortar).toBe(0);
            if (
              point.color > 0.72 &&
              point.color > profile[i - 1].color &&
              point.color > profile[i + 1].color
            ) {
              // Concentric rings would brighten both sides at the same radius.
              const opposite = local(-i / 1000, 0);
              if (opposite.color < 0.58) asymmetricWalls++;
              expect(point.roughness).toBeLessThan(matrix.roughness - 0.06);
            }
          }
          expect(asymmetricWalls).toBeGreaterThanOrEqual(2);
          expect(maxHeight - minHeight).toBeLessThan(0.0001);
        }
    },
  );
  it('keeps fossil outlines, nuclei, angular cuts, cell borders and wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 64; y++)
        for (let x = 0; x <= 64; x++)
          for (const axis of [0, 1]) {
            const u = x / 64,
              v = y / 64;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
              'mortar',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('three-way rhombus tiles', () => {
  const p = proceduralMaterialPresets.rhombille;
  const step = Math.sqrt(3) / 2;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('rhombille', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x, y, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'joins three coplanar four-sided tiles with separate tonal faces for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.rows; row++)
        for (let col = 0; col < p.columns; col++) {
          const local = (x: number, y: number) =>
            at(
              (col + (row % 2) * 0.5 + x) / p.columns,
              (row * step + y) / (p.rows * step),
            );
          const light = local(0.25, 1 / (4 * Math.sqrt(3)));
          const medium = local(0, -1 / (2 * Math.sqrt(3)));
          const dark = local(-0.25, 1 / (4 * Math.sqrt(3)));
          expect(light.color - medium.color).toBeGreaterThan(0.22);
          expect(medium.color - dark.color).toBeGreaterThan(0.22);
          for (const tile of [light, medium, dark]) {
            expect(tile.height).toBeGreaterThan(0.012);
            expect(Math.abs(tile.height - light.height)).toBeLessThan(0.00011);
            expect(tile.roughness).toBeLessThan(0.5);
            expect(tile.mortar).toBe(0);
          }
          // All four inset parallelogram corners belong to the same light tile;
          // a triangular wedge substitution would lose one of these corners.
          for (const x of [0.1, 0.4])
            for (const a of [0.1, 0.4]) {
              const corner = local(x, (a - 0.5 * x) / step);
              expect(corner.color).toBeGreaterThan(medium.color + 0.22);
              expect(corner.height).toBeGreaterThan(0.012);
            }
          for (const [x, y] of [
            [0, 0],
            [0, 1 / (2 * Math.sqrt(3))],
            [0.25, -1 / (4 * Math.sqrt(3))],
            [-0.25, -1 / (4 * Math.sqrt(3))],
            [0.5, 0],
            [0, 1 / Math.sqrt(3)],
          ] as const) {
            const grout = local(x, y);
            expect(grout.height).toBe(0);
            expect(grout.mortar).toBe(1);
            expect(grout.roughness).toBeGreaterThan(0.8);
            expect(light.occlusion - grout.occlusion).toBeGreaterThan(0.5);
          }
        }
    },
  );
  it('keeps bevel corners, three-way junctions, hex owners and wrap C1 continuous', () => {
    const h = 1e-8;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 64; y++)
        for (let x = 0; x <= 64; x++)
          for (const axis of [0, 1]) {
            const u = x / 64,
              v = y / 64;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
              'mortar',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('rounded-lobe oak leaves', () => {
  const p = proceduralMaterialPresets.oakleaf;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('oakleaf', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x, y, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'preserves paired lobes, deep sinuses, petioles and branching ribs for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          // Discover the actual petiole direction without duplicating the seed hash.
          let sx = 0,
            sy = 0,
            covered = 0;
          for (let i = 0; i < 360; i++) {
            const angle = (i * Math.PI) / 180;
            const s = at(
              (col + 0.5 + 0.42 * Math.cos(angle)) / p.cells,
              (row + 0.5 + 0.42 * Math.sin(angle)) / p.cells,
            );
            if (s.color > 0.3) {
              sx += Math.cos(angle);
              sy += Math.sin(angle);
              covered++;
            }
          }
          expect(covered).toBeGreaterThanOrEqual(2);
          expect(covered).toBeLessThan(6);
          const axis = Math.atan2(-sy, -sx),
            cos = Math.cos(axis),
            sin = Math.sin(axis);
          const local = (a: number, b: number) =>
            at(
              (col + 0.5 + b * cos - a * sin) / p.cells,
              (row + 0.5 + b * sin + a * cos) / p.cells,
            );
          for (const side of [-1, 1])
            for (const end of [-1, 1]) {
              const sinus = local(side * 0.14, (end * p.length) / 3);
              const lobe = local(side * 0.14, (end * p.length * 2) / 3);
              expect(lobe.height - sinus.height).toBeGreaterThan(0.004);
              expect(lobe.color - sinus.color).toBeGreaterThan(0.4);
              expect(lobe.occlusion - sinus.occlusion).toBeGreaterThan(0.3);
            }
          const stem = local(0, -0.42),
            outside = local(0.3, 0);
          expect(stem.height - outside.height).toBeGreaterThan(0.005);
          expect(outside.roughness - stem.roughness).toBeGreaterThan(0.15);
          expect(
            local(0, 0.1).height - local(0.025, 0.1).height,
          ).toBeGreaterThan(0.0005);
          const branchY =
            (p.length * 0.75 * Math.sqrt((0.08 / p.width) ** 2 + 0.0004)) / 3;
          const vein = local(0.08, branchY).height;
          const flesh =
            (local(0.08, branchY - 0.025).height +
              local(0.08, branchY + 0.025).height) /
            2;
          expect(vein - flesh).toBeGreaterThan(0.0003);
        }
    },
  );
  it('keeps lobed blades, branch junctions, cell owners and wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      const points: [number, number][] = [];
      for (let y = 0; y <= 64; y++)
        for (let x = 0; x <= 64; x++) points.push([x / 64, y / 64]);
      for (let edge = 0; edge <= p.cells; edge++)
        for (let i = 0; i <= 64; i++)
          points.push([edge / p.cells, i / 64], [i / 64, edge / p.cells]);
      for (const [x, y] of points)
        for (const axis of [0, 1]) {
          const a = at(x - (axis ? 0 : h), y - (axis ? h : 0)),
            b = at(x, y),
            c = at(x + (axis ? 0 : h), y + (axis ? h : 0));
          for (const key of [
            'color',
            'height',
            'roughness',
            'occlusion',
          ] as const) {
            expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
            expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
              0.02,
            );
          }
        }
    }
  });
});

describe('watered silk moire', () => {
  const p = proceduralMaterialPresets.moire;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('moire', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x, y, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'varies watered sheen without embossing broad bands for seed %s',
    (seed) => {
      const at = field(seed);
      for (const row of [0, 7, 19, 31]) {
        const y = row / p.weftThreads;
        const crowns = Array.from({ length: p.warpThreads }, (_, x) =>
          at(x / p.warpThreads, y),
        );
        const sorted = crowns.sort((a, b) => a.color - b.color);
        const dark = sorted[0]!,
          light = sorted[sorted.length - 1]!;
        expect(light.color - dark.color).toBeGreaterThan(0.5);
        expect(dark.roughness - light.roughness).toBeGreaterThan(0.17);
        expect(Math.abs(light.height - dark.height)).toBeLessThan(0.000025);
        expect(Math.abs(light.occlusion - dark.occlusion)).toBeLessThan(
          0.000001,
        );
      }
      const crown = at(0.25, 0.25);
      const valley = at(0.25 + 0.5 / p.warpThreads, 0.25 + 0.5 / p.weftThreads);
      expect(crown.height - valley.height).toBeGreaterThan(0.001);
      expect(crown.occlusion - valley.occlusion).toBeGreaterThan(0.04);
      // Curved bands shift with v instead of degenerating into straight stripes.
      let shift = 0;
      for (let x = 0; x < p.warpThreads; x++)
        shift += Math.abs(
          at(x / p.warpThreads, 0).color -
            at(x / p.warpThreads, 7 / p.weftThreads).color,
        );
      expect(shift / p.warpThreads).toBeGreaterThan(0.1);
    },
  );
  it('keeps broad beat bands, fine yarns and wrap C1 continuous', () => {
    const h = 1e-8;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 64; y++)
        for (let x = 0; x <= 64; x++)
          for (const axis of [0, 1]) {
            const u = x / 64,
              v = y / 64;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('bamboo tube crosscut', () => {
  const p = proceduralMaterialPresets.bamboocrosscut;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('bamboocrosscut', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x, y, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'separates hollow centers, cut walls and smooth rinds for seed %s',
    (seed) => {
      const at = field(seed);
      const outerEdges: number[] = [],
        woodColors: number[] = [];
      for (let y = 0; y < p.cells; y++)
        for (let x = 0; x < p.cells; x++) {
          const cx = (x + 0.5) / p.cells,
            cy = (y + 0.5) / p.cells;
          const hollow = at(cx, cy),
            outside = at(cx + 0.49 / p.cells, cy);
          for (const floor of [hollow, outside]) {
            expect(floor.height).toBe(0);
            expect(floor.color).toBeLessThan(0.04);
            expect(floor.occlusion).toBeLessThan(0.4);
          }
          const profile = Array.from({ length: 201 }, (_, i) =>
            at(cx + i / 400 / p.cells, cy),
          );
          const raised = profile
            .map((s, i) => (s.height > 0.01 ? i / 400 : -1))
            .filter((r) => r >= 0);
          const first = raised[0]!,
            last = raised[raised.length - 1]!;
          expect(first).toBeGreaterThan(0.23);
          expect(last).toBeLessThan(0.46);
          expect(last - first).toBeGreaterThan(0.075);
          expect(last - first).toBeLessThan(0.2);
          outerEdges.push(last);
          const wall = profile.reduce((a, b) => (a.color > b.color ? a : b));
          expect(wall.color).toBeGreaterThan(0.7);
          expect(wall.height).toBeGreaterThan(0.019);
          expect(wall.roughness).toBeGreaterThan(0.72);
          expect(wall.occlusion).toBeGreaterThan(0.9);
          const rind = profile
            .filter((s) => s.height > 0.02 && s.color < 0.3)
            .reduce((a, b) => (a.roughness < b.roughness ? a : b));
          expect(rind.roughness).toBeLessThan(wall.roughness - 0.18);
          expect(rind.color).toBeLessThan(wall.color - 0.4);
          for (const s of profile)
            if (s.height > 0.019 && s.roughness > 0.72 && s.color > 0.5)
              woodColors.push(s.color);
        }
      expect(Math.max(...outerEdges) - Math.min(...outerEdges)).toBeGreaterThan(
        0.015,
      );
      expect(Math.max(...woodColors) - Math.min(...woodColors)).toBeGreaterThan(
        0.15,
      );
    },
  );
  it('keeps radial walls, cell boundaries and wrap C1 continuous', () => {
    const h = 1e-8;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let y = 0; y <= 64; y++)
        for (let x = 0; x <= 64; x++)
          for (const axis of [0, 1]) {
            const u = x / 64,
              v = y / 64;
            const a = at(u - (axis ? 0 : h), v - (axis ? h : 0)),
              b = at(u, v),
              c = at(u + (axis ? 0 : h), v + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('moss-jointed stone pavers', () => {
  const p = proceduralMaterialPresets.mossypavers;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('mossypavers', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x, y, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'grows rough green cushions only inside selected recessed joints for seed %s',
    (seed) => {
      const at = field(seed);
      for (let y = 0; y < p.cells; y++)
        for (let x = 0; x < p.cells; x++) {
          const stone = at((x + 0.5) / p.cells, (y + 0.5) / p.cells);
          expect(stone.height).toBeGreaterThan(0.019);
          expect(stone.mortar).toBeGreaterThanOrEqual(0.75);
          expect(stone.roughness).toBeLessThan(0.7);
          expect(stone.occlusion).toBeGreaterThan(0.95);
        }
      const joints: SurfaceSample[] = [];
      for (let x = 0; x < p.cells; x++)
        for (let y = 0; y < 128; y++) joints.push(at(x / p.cells, y / 128));
      const sorted = joints.sort((a, b) => a.color - b.color);
      const bare = sorted[0]!,
        moss = sorted[sorted.length - 1]!;
      expect(moss.color - bare.color).toBeGreaterThan(0.35);
      expect(bare.height).toBeLessThan(0.001);
      expect(moss.height).toBeGreaterThan(0.004);
      expect(moss.height).toBeLessThan(0.009);
      expect(moss.roughness - bare.roughness).toBeGreaterThan(0.04);
      expect(moss.occlusion - bare.occlusion).toBeGreaterThan(0.15);
      for (const joint of joints) {
        expect(joint.mortar).toBe(0);
        expect(joint.metallic).toBe(0);
      }
      const maps = generateProceduralMaps('mossypavers', 128, seed);
      // Green joints must survive palette composition, not merely the height mask.
      const greens: number[] = [],
        stones: number[] = [];
      for (let y = 0; y < 128; y++)
        for (let x = 0; x < 128; x++) {
          const index = (y * 128 + x) * 4;
          const contrast = maps.baseColor[index + 1]! - maps.baseColor[index]!;
          if (x % 32 === 0) greens.push(contrast);
          if (x % 32 === 16 && y % 32 === 16) stones.push(contrast);
        }
      expect(Math.max(...greens)).toBeGreaterThan(20);
      expect(Math.max(...stones)).toBeLessThan(10);
    },
  );
  it('keeps cell ownership, stone bevels and wrap C1 continuous', () => {
    const h = 1e-8;
    const lines = [0, 1];
    for (let i = 0; i < p.cells; i++)
      for (const edge of [
        0,
        p.gap,
        p.gap + p.bevel,
        1 - p.gap - p.bevel,
        1 - p.gap,
      ])
        lines.push((i + edge) / p.cells);
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (const line of lines)
        for (let i = 0; i <= 64; i++)
          for (const axis of [0, 1]) {
            const x = axis ? i / 64 : line,
              y = axis ? line : i / 64;
            const a = at(x - (axis ? 0 : h), y - (axis ? h : 0)),
              b = at(x, y),
              c = at(x + (axis ? 0 : h), y + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
              'mortar',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('blue and white gingham', () => {
  const p = proceduralMaterialPresets.gingham;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('gingham', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x, y, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'weaves light, dark and mixed checks without raising printed squares for seed %s',
    (seed) => {
      const at = field(seed);
      const mean = (cx: number, cy: number) => {
        let color = 0,
          height = 0;
        for (let y = 0; y < 16; y++)
          for (let x = 0; x < 16; x++) {
            const s = at(
              cx + ((x + 0.5) / 16 - 0.5) / 16,
              cy + ((y + 0.5) / 16 - 0.5) / 16,
            );
            color += s.color;
            height += s.height;
          }
        return { color: color / 256, height: height / 256 };
      };
      const white = mean(0.25, 0.25),
        blue = mean(0.125, 0.125),
        mixed = mean(0.125, 0.25);
      expect(white.color - mixed.color).toBeGreaterThan(0.35);
      expect(mixed.color - blue.color).toBeGreaterThan(0.35);
      expect(
        Math.abs(mixed.color - (white.color + blue.color) / 2),
      ).toBeLessThan(0.025);
      expect(Math.abs(white.height - blue.height)).toBeLessThan(0.00013);
      expect(Math.abs(mixed.height - blue.height)).toBeLessThan(0.00013);
      const dyed = at(0.125, 0.25),
        undyed = at(0.125 + 1 / p.threads, 0.25);
      expect(undyed.color - dyed.color).toBeGreaterThan(0.75);
      expect(Math.abs(undyed.height - dyed.height)).toBeLessThan(0.00013);
      expect(
        at(0.125, 0.125).height -
          at(0.125 + 0.5 / p.threads, 0.125 + 0.5 / p.threads).height,
      ).toBeGreaterThan(0.0015);
    },
  );
  it('keeps yarn crossings, color transitions and wrap C1 continuous', () => {
    const h = 1e-8;
    const lines = [0, 1, 0.125, 0.25, 0.125 + 0.5 / p.threads];
    for (let i = 0; i < p.checks; i++)
      for (const edge of [-p.colorEdge, p.colorEdge]) {
        const t = Math.acos(edge) / (2 * Math.PI);
        lines.push((i + t) / p.checks, (i + 1 - t) / p.checks);
      }
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (const line of lines)
        for (let i = 0; i <= 64; i++)
          for (const axis of [0, 1]) {
            const x = axis ? i / 64 : line,
              y = axis ? line : i / 64;
            const a = at(x - (axis ? 0 : h), y - (axis ? h : 0)),
              b = at(x, y),
              c = at(x + (axis ? 0 : h), y + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('steel mesh stone gabion', () => {
  const p = proceduralMaterialPresets.gabion;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('gabion', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x, y, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'keeps smooth metallic wire above rough dielectric stone crowns for seed %s',
    (seed) => {
      const at = field(seed);
      for (const axis of [0, 1])
        for (let col = 0; col < p.mesh; col++)
          for (let row = 0; row < 8; row++) {
            const along = (x: number, y: number) =>
              axis ? at(y, x) : at(x, y);
            const wire = along(col / p.mesh, (row + 0.37) / 8);
            const backing = along((col + 0.35) / p.mesh, (row + 0.37) / 8);
            expect(wire.metallic).toBe(1);
            expect(backing.metallic).toBe(0);
            expect(wire.height - backing.height).toBeGreaterThan(0.004);
            expect(backing.roughness - wire.roughness).toBeGreaterThan(0.4);
          }
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          let min = Infinity,
            max = -Infinity;
          for (let y = 1; y < 20; y++)
            for (let x = 1; x < 20; x++) {
              const s = at((col + x / 20) / p.cells, (row + y / 20) / p.cells);
              if (s.metallic !== 0) continue;
              min = Math.min(min, s.height);
              max = Math.max(max, s.height);
            }
          expect(max).toBeGreaterThan(0.011);
          expect(min).toBeLessThan(0.006);
        }
    },
  );
  it('keeps steel boundaries, crossings, stone owners and wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      const lines = [0, 1 / 3, 2 / 3, 1];
      for (let i = 0; i < p.mesh; i++)
        lines.push(
          i / p.mesh,
          (i + p.wireWidth) / p.mesh,
          (i - p.wireWidth) / p.mesh,
        );
      for (const line of lines)
        for (let i = 0; i <= 128; i++)
          for (const axis of [0, 1]) {
            const x = axis ? i / 128 : line,
              y = axis ? line : i / 128;
            const a = at(x - (axis ? 0 : h), y - (axis ? h : 0)),
              b = at(x, y),
              c = at(x + (axis ? 0 : h), y + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
              'mortar',
              'metallic',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
    }
  });
});

describe('modular ashlar masonry', () => {
  const p = proceduralMaterialPresets.ashlar;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('ashlar', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x, y, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'preserves complete unequal stone faces and recessed T joints for seed %s',
    (seed) => {
      const at = field(seed);
      for (const [x, y, width, height] of p.stones) {
        const center = at(
          (x + width / 2) / p.cells,
          (y + height / 2) / p.cells,
        );
        const edge = at(x / p.cells, (y + height / 2) / p.cells);
        expect(center.height).toBeGreaterThan(0.015);
        expect(edge.height).toBe(0);
        expect(center.color - edge.color).toBeGreaterThan(0.25);
        expect(edge.roughness - center.roughness).toBeGreaterThan(0.11);
        expect(center.occlusion - edge.occlusion).toBeGreaterThan(0.35);
        for (let i = 1; i < width; i++)
          expect(
            at((x + i) / p.cells, (y + height / 2) / p.cells).height,
          ).toBeGreaterThan(0.015);
        for (let i = 1; i < height; i++)
          expect(
            at((x + width / 2) / p.cells, (y + i) / p.cells).height,
          ).toBeGreaterThan(0.015);
      }
      // A horizontal joint terminates at the side of the larger left stone.
      expect(at(3.2 / p.cells, 1 / p.cells).height).toBe(0);
      expect(at(2.8 / p.cells, 1 / p.cells).height).toBeGreaterThan(0.015);
      expect(at(3 / p.cells, 0.8 / p.cells).height).toBe(0);
      expect(at(3 / p.cells, 1.2 / p.cells).height).toBe(0);
    },
  );
  it('keeps bevel endpoints, T joints, internal lookup boundaries and wrap C1 continuous', () => {
    const h = 1e-8;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      const points: [number, number][] = [];
      for (let cell = 0; cell <= p.cells; cell++)
        for (let i = 0; i <= 96; i++)
          points.push([cell / p.cells, i / 96], [i / 96, cell / p.cells]);
      for (const [x, y, width, height] of p.stones)
        for (const d of [p.gap, p.gap + p.bevel])
          for (const t of [0, 0.2, 0.5, 0.8, 1]) {
            points.push(
              [(x + d) / p.cells, (y + height * t) / p.cells],
              [(x + width - d) / p.cells, (y + height * t) / p.cells],
            );
            points.push(
              [(x + width * t) / p.cells, (y + d) / p.cells],
              [(x + width * t) / p.cells, (y + height - d) / p.cells],
            );
          }
      for (const [x, y] of points)
        for (const axis of [0, 1]) {
          const a = at(x - (axis ? 0 : h), y - (axis ? h : 0)),
            b = at(x, y),
            c = at(x + (axis ? 0 : h), y + (axis ? h : 0));
          for (const key of [
            'color',
            'height',
            'roughness',
            'occlusion',
          ] as const) {
            expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
            expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
              0.02,
            );
          }
        }
    }
  });
});

describe('indigo sashiko cloth', () => {
  const p = proceduralMaterialPresets.sashiko;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('sashiko', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x, y, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'alternates raised light stitches with indigo gaps along both grid axes for seed %s',
    (seed) => {
      const at = field(seed);
      for (const axis of [0, 1])
        for (let row = 0; row < p.cells; row++) {
          const along = (x: number, y: number) => (axis ? at(y, x) : at(x, y));
          const centers = Array.from({ length: p.cells }, (_, col) =>
            along((col + 0.5) / p.cells, row / p.cells),
          );
          expect(centers.filter((s) => s.color > 0.8)).toHaveLength(
            p.cells / 2,
          );
          for (let col = 0; col < p.cells; col++) {
            const here = centers[col],
              next = centers[(col + 1) % p.cells];
            expect(here.color > 0.8).not.toBe(next.color > 0.8);
            if (here.color > 0.8) {
              expect(here.height - next.height).toBeGreaterThan(0.011);
              expect(next.roughness - here.roughness).toBeGreaterThan(0.045);
              expect(
                along((col + 0.5) / p.cells, (row + 0.2) / p.cells).color,
              ).toBeLessThan(0.12);
            } else expect(here.color).toBeLessThan(0.12);
            expect(along(col / p.cells, row / p.cells).color).toBeLessThan(
              0.12,
            );
          }
        }
    },
  );
  it('returns stitch tips and sides to the fabric without seams at owner boundaries or wrap', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      const points: [number, number][] = [];
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          points.push(
            [col / p.cells, row / p.cells],
            [(col + 0.5) / p.cells, (row + 0.5) / p.cells],
          );
          for (let i = 0; i < 16; i++) {
            const a = (i * Math.PI) / 8;
            points.push([
              (col + 0.5 + p.stitchLength * Math.cos(a)) / p.cells,
              (row + p.stitchWidth * Math.sin(a)) / p.cells,
            ]);
            points.push([
              (col + p.stitchWidth * Math.sin(a)) / p.cells,
              (row + 0.5 + p.stitchLength * Math.cos(a)) / p.cells,
            ]);
          }
        }
      for (const [x, y] of points)
        for (const axis of [0, 1]) {
          const a = at(x - (axis ? 0 : h), y - (axis ? h : 0)),
            b = at(x, y),
            c = at(x + (axis ? 0 : h), y + (axis ? h : 0));
          for (const key of [
            'color',
            'height',
            'roughness',
            'occlusion',
          ] as const) {
            expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
            expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
              0.02,
            );
          }
        }
    }
  });
});

describe('pressed tin ceiling panels', () => {
  const p = proceduralMaterialPresets.pressedtin;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('pressedtin', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x, y, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'raises four symmetric petals, a central boss and a frame above metallic sheet for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          const local = (x: number, y: number) =>
            at((col + 0.5 + x) / p.cells, (row + 0.5 + y) / p.cells);
          const sheet = local(0.25, 0.25),
            boss = local(0, 0);
          expect(boss.height - sheet.height).toBeGreaterThan(0.0058);
          expect(local(0.43, 0).height - sheet.height).toBeGreaterThan(0.0022);
          const petals = [
            local(0.2, 0),
            local(-0.2, 0),
            local(0, 0.2),
            local(0, -0.2),
          ];
          for (const petal of petals) {
            expect(petal.height - sheet.height).toBeGreaterThan(0.0068);
            expect(petal.color - sheet.color).toBeGreaterThan(0.16);
            expect(sheet.roughness - petal.roughness).toBeGreaterThan(0.015);
            expect(petal.metallic).toBe(1);
          }
          expect(
            Math.max(...petals.map((s) => s.height)) -
              Math.min(...petals.map((s) => s.height)),
          ).toBeLessThan(0.00011);
        }
    },
  );
  it('keeps stamped support edges, frame corners and tile wrap C1 continuous', () => {
    const h = 1e-8;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      const points: [number, number][] = [];
      for (let i = 0; i <= 64; i++) {
        points.push([0, i / 64], [0.5, i / 64], [i / 64, 0], [i / 64, 0.5]);
        for (const edge of [
          p.frameOuter,
          p.frameOuter - p.frameEdge,
          p.frameInner,
          p.frameInner - p.frameEdge,
        ]) {
          points.push(
            [(0.5 + edge) / p.cells, i / 64],
            [i / 64, (0.5 + edge) / p.cells],
          );
        }
      }
      for (let i = 0; i < 64; i++) {
        const a = (i * Math.PI) / 32;
        points.push([
          (0.5 + p.bossRadius * Math.cos(a)) / p.cells,
          (0.5 + p.bossRadius * Math.sin(a)) / p.cells,
        ]);
        points.push([
          (0.5 + p.petalOffset + p.petalLength * Math.cos(a)) / p.cells,
          (0.5 + p.petalWidth * Math.sin(a)) / p.cells,
        ]);
      }
      for (const [x, y] of points)
        for (const axis of [0, 1]) {
          const a = at(x - (axis ? 0 : h), y - (axis ? h : 0));
          const b = at(x, y);
          const c = at(x + (axis ? 0 : h), y + (axis ? h : 0));
          for (const key of [
            'color',
            'height',
            'roughness',
            'occlusion',
          ] as const) {
            expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
            expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
              0.02,
            );
          }
        }
    }
  });
});

describe('golden ginkgo leaves', () => {
  const p = proceduralMaterialPresets.ginkgoleaf;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('ginkgoleaf', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x, y, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'preserves fan lobes, central notch, petiole and radial veins across seeded orientations for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.cells; row++) {
        for (let col = 0; col < p.cells; col++) {
          const polar = (radius: number, angle: number) =>
            at(
              (col + 0.5 + radius * Math.cos(angle)) / p.cells,
              (row + 0.5 + radius * Math.sin(angle)) / p.cells,
            );
          let sx = 0,
            sy = 0,
            covered = 0;
          for (let i = 0; i < 360; i++) {
            const angle = (i * Math.PI) / 180;
            if (polar(0.24, angle).color > 0.3) {
              sx += Math.cos(angle);
              sy += Math.sin(angle);
              covered++;
            }
          }
          expect(covered).toBeGreaterThan(125);
          expect(covered).toBeLessThan(150);
          const axis = Math.atan2(sy, sx);
          const notch = polar(0.37, axis);
          for (const side of [-1, 1]) {
            const lobe = polar(0.37, axis + side * 0.45);
            expect(lobe.height - notch.height).toBeGreaterThan(0.005);
            expect(lobe.color - notch.color).toBeGreaterThan(0.5);
            expect(lobe.occlusion - notch.occlusion).toBeGreaterThan(0.3);
          }
          const stem = polar(0.09, axis + Math.PI);
          const outside = polar(0.35, axis + Math.PI / 2);
          expect(stem.height - outside.height).toBeGreaterThan(0.005);
          expect(outside.roughness - stem.roughness).toBeGreaterThan(0.2);
          let low = Infinity,
            high = -Infinity;
          for (let i = 0; i <= 80; i++) {
            const s = polar(0.22, axis - 0.8 + i * 0.02);
            low = Math.min(low, s.height);
            high = Math.max(high, s.height);
          }
          expect(high - low).toBeGreaterThan(0.0007);
        }
      }
    },
  );
  it('keeps polar centers, compact leaf supports, cell owners and wrap C1 continuous', () => {
    const h = 1e-9;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      const points: [number, number][] = [];
      for (let edge = 0; edge <= p.cells; edge++)
        for (let i = 0; i <= 64; i++)
          points.push([edge / p.cells, i / 64], [i / 64, edge / p.cells]);
      for (let row = 0; row < p.cells; row++)
        for (let col = 0; col < p.cells; col++) {
          points.push([(col + 0.5) / p.cells, (row + 0.5) / p.cells]);
          for (const radius of [0.035, 0.08, p.radius]) {
            for (let i = 0; i < 32; i++) {
              const angle = (i * Math.PI) / 16;
              points.push([
                (col + 0.5 + radius * Math.cos(angle)) / p.cells,
                (row + 0.5 + radius * Math.sin(angle)) / p.cells,
              ]);
            }
          }
        }
      for (const [x, y] of points)
        for (const axis of [0, 1]) {
          const a = at(x - (axis ? 0 : h), y - (axis ? h : 0));
          const b = at(x, y);
          const c = at(x + (axis ? 0 : h), y + (axis ? h : 0));
          for (const key of [
            'color',
            'height',
            'roughness',
            'occlusion',
          ] as const) {
            expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
            expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
              0.02,
            );
          }
        }
    }
  });
});

describe('chevron parquet flooring', () => {
  const p = proceduralMaterialPresets.chevronparquet;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('chevronparquet', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x, y, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'joins diagonal boards at miters and aligns grain along both V arms for seed %s',
    (seed) => {
      const at = field(seed);
      for (const col of [0, 1]) {
        const sign = col === 0 ? 1 : -1;
        let alongEnergy = 0,
          acrossEnergy = 0;
        for (let row = 0; row < p.rows; row++) {
          const u = col * 0.5 + 0.25;
          const v = (row + 0.5) / p.rows - (col === 0 ? u : 1 - u);
          const face = at(u, v),
            side = at(u, v - 0.5 / p.rows),
            end = at(0.5, v);
          for (const joint of [side, end]) {
            expect(face.height - joint.height).toBeGreaterThan(0.014);
            expect(face.color - joint.color).toBeGreaterThan(0.29);
            expect(joint.roughness - face.roughness).toBeGreaterThan(0.4);
            expect(face.occlusion - joint.occlusion).toBeGreaterThan(0.47);
          }
          for (let i = 0; i < 16; i++) {
            const x = col * 0.5 + 0.1 + i * 0.02;
            const y =
              (row + 0.25 + i * 0.03) / p.rows - (col === 0 ? x : 1 - x);
            const d = 0.0001;
            const along =
              at(x + d, y - sign * d).color - at(x - d, y + sign * d).color;
            const across =
              at(x + d, y + sign * d).color - at(x - d, y - sign * d).color;
            alongEnergy += along * along;
            acrossEnergy += across * across;
          }
        }
        expect(acrossEnergy).toBeGreaterThan(alongEnergy * 8);
      }
    },
  );
  it('keeps miter tips, bevel shoulders and tile wrap C1 continuous', () => {
    const h = 1e-8;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      const points: [number, number][] = [];
      for (let i = 0; i <= 64; i++) {
        for (const x of [0, 0.5, 1]) points.push([x, i / 64]);
        points.push([i / 64, 0]);
      }
      for (const col of [0, 1]) {
        for (let i = 0; i <= 32; i++) {
          const u = col * 0.5 + i / 64;
          for (const cross of [
            0,
            p.sideGap,
            p.sideBevel,
            1 - p.sideBevel,
            1 - p.sideGap,
          ]) {
            points.push([u, cross / p.rows - (col === 0 ? u : 1 - u)]);
          }
        }
      }
      for (const [x, y] of points) {
        for (const axis of [0, 1]) {
          const a = at(x - (axis ? 0 : h), y - (axis ? h : 0));
          const b = at(x, y);
          const c = at(x + (axis ? 0 : h), y + (axis ? h : 0));
          for (const key of [
            'color',
            'height',
            'roughness',
            'occlusion',
          ] as const) {
            expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
            expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
              0.02,
            );
          }
        }
      }
    }
  });
});

describe('argyle diamond cloth', () => {
  const p = proceduralMaterialPresets.argyle;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('argyle', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x, y, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'alternates diamonds beneath fine crossing lines without embossing the pigment for seed %s',
    (seed) => {
      const at = field(seed);
      const diamondAt = (x: number, y: number) => at((x + y) / 4, (x - y) / 4);
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 2; col++) {
          const x = col + 0.25,
            y = row + 0.25;
          const current = diamondAt(x, y);
          const adjacent = diamondAt(x + 1, y);
          const across = diamondAt(x + 1, y + 1);
          expect(Math.abs(current.color - adjacent.color)).toBeGreaterThan(
            0.47,
          );
          expect(Math.abs(current.color - across.color)).toBeLessThan(0.021);
          for (const line of [
            diamondAt(col + 0.5, y),
            diamondAt(x, row + 0.5),
          ]) {
            expect(
              line.color - Math.max(current.color, adjacent.color),
            ).toBeGreaterThan(0.27);
            expect(Math.abs(line.height - current.height)).toBeLessThan(
              0.021 * p.relief,
            );
          }
          expect(Math.abs(current.height - adjacent.height)).toBeLessThan(
            0.021 * p.relief,
          );
          expect(current.metallic).toBe(0);
        }
      }
      const crown = at(0, 0),
        gap = at(0.5 / p.threads, 0.5 / p.threads);
      expect(crown.height - gap.height).toBeGreaterThan(0.001);
      expect(crown.occlusion - gap.occlusion).toBeGreaterThan(0.09);
    },
  );
  it('keeps diamond tips, crossing-line shoulders and wrap C1 continuous', () => {
    const h = 1e-8;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      const points: [number, number][] = [];
      for (let i = 0; i <= 64; i++) {
        points.push([0, i / 64], [i / 64, 0]);
        for (const x of [
          0,
          1,
          Math.acos(p.lineInner) / Math.PI,
          Math.acos(p.lineOuter) / Math.PI,
        ]) {
          const y = i / 32;
          points.push([(x + y) / 4, (x - y) / 4]);
        }
      }
      for (const [x, y] of points) {
        for (const axis of [0, 1]) {
          const a = at(x - (axis ? 0 : h), y - (axis ? h : 0));
          const b = at(x, y);
          const c = at(x + (axis ? 0 : h), y + (axis ? h : 0));
          for (const key of [
            'color',
            'height',
            'roughness',
            'occlusion',
          ] as const) {
            expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
            expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
              0.02,
            );
          }
        }
      }
    }
  });
});

describe('perforated seat leather', () => {
  const p = proceduralMaterialPresets.perforatedleather;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('perforatedleather', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x, y, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'keeps staggered round perforations darker, deeper and rougher than seeded leather for seed %s',
    (seed) => {
      const at = field(seed);
      let low = Infinity,
        high = -Infinity;
      for (let row = 0; row < p.cells; row++) {
        for (let col = 0; col < p.cells; col++) {
          const x = (col + 0.5 + (row % 2) * 0.5) / p.cells;
          const y = (row + 0.5) / p.cells;
          const center = at(x, y);
          const bridge = at(x + 0.5 / p.cells, y);
          expect(bridge.height - center.height).toBeGreaterThan(0.007);
          expect(bridge.color - center.color).toBeGreaterThan(0.5);
          expect(center.roughness - bridge.roughness).toBeGreaterThan(0.4);
          expect(bridge.occlusion - center.occlusion).toBeGreaterThan(0.7);
          expect(center.metallic).toBe(0);
          low = Math.min(low, bridge.height);
          high = Math.max(high, bridge.height);
          for (let angle = 0; angle < 8; angle++) {
            const a = (angle * Math.PI) / 4;
            const wall = at(
              x + (0.19 * Math.cos(a)) / p.cells,
              y + (0.19 * Math.sin(a)) / p.cells,
            );
            expect(wall.height).toBeGreaterThan(center.height + 0.002);
            expect(wall.height).toBeLessThan(bridge.height - 0.002);
          }
        }
      }
      expect(high - low).toBeGreaterThan(0.0001);
      const maps = generateProceduralMaps('perforatedleather', 64, seed);
      for (let i = 3; i < maps.baseColor.length; i += 4) {
        expect(maps.baseColor[i]).toBe(255);
      }
    },
  );
  it('keeps staggered row owners, hole shoulders and wrap C1 continuous', () => {
    const h = 1e-8;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      const points: [number, number][] = [];
      for (let row = 0; row <= p.cells; row++) {
        for (let i = 0; i <= 32; i++) {
          points.push([i / 32, row / p.cells], [row / p.cells, i / 32]);
        }
      }
      for (const radius of [p.coreRadius, p.outerRadius]) {
        for (let angle = 0; angle < 32; angle++) {
          const a = (angle * Math.PI) / 16;
          points.push([
            (0.5 + radius * Math.cos(a)) / p.cells,
            (0.5 + radius * Math.sin(a)) / p.cells,
          ]);
        }
      }
      for (const [x, y] of points) {
        for (const axis of [0, 1]) {
          const a = at(x - (axis ? 0 : h), y - (axis ? h : 0));
          const b = at(x, y);
          const c = at(x + (axis ? 0 : h), y + (axis ? h : 0));
          for (const key of [
            'color',
            'height',
            'roughness',
            'occlusion',
          ] as const) {
            expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
            expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
              0.02,
            );
          }
        }
      }
    }
  });
});

describe('chipped ivory enamel', () => {
  const p = proceduralMaterialPresets.chippedenamel;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('chippedenamel', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x, y, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'exposes rough dark metal beneath glossy dielectric enamel without curled edges for seed %s',
    (seed) => {
      const maps = generateProceduralMaps('chippedenamel', 64, seed);
      let metalCount = 0,
        enamelCount = 0,
        metalRoughness = 0,
        enamelRoughness = 0;
      let metalColor = 0,
        enamelColor = 0;
      for (let i = 0; i < maps.baseColor.length; i += 4) {
        if (maps.metallicRoughness[i + 2]! > 250) {
          metalCount++;
          metalRoughness += maps.metallicRoughness[i + 1]!;
          metalColor += maps.baseColor[i]!;
        } else if (maps.metallicRoughness[i + 2] === 0) {
          enamelCount++;
          enamelRoughness += maps.metallicRoughness[i + 1]!;
          enamelColor += maps.baseColor[i]!;
        }
      }
      expect(metalCount / 4096).toBeGreaterThan(0.02);
      expect(metalCount / 4096).toBeLessThan(0.25);
      expect(enamelCount / 4096).toBeGreaterThan(0.65);
      expect(
        metalRoughness / metalCount - enamelRoughness / enamelCount,
      ).toBeGreaterThan(120);
      expect(
        enamelColor / enamelCount - metalColor / metalCount,
      ).toBeGreaterThan(110);
      const at = field(seed);
      let metalHeight = 0,
        enamelHeight = 0,
        metals = 0,
        enamels = 0,
        maximum = 0;
      for (let y = 0; y < 128; y++) {
        for (let x = 0; x < 128; x++) {
          const s = at(x / 128, y / 128);
          maximum = Math.max(maximum, s.height);
          if (s.metallic === 1) {
            metalHeight += s.height;
            metals++;
          }
          if (s.metallic === 0) {
            enamelHeight += s.height;
            enamels++;
          }
        }
      }
      expect(enamelHeight / enamels - metalHeight / metals).toBeGreaterThan(
        0.0059,
      );
      expect(maximum).toBeLessThanOrEqual(0.655 * p.relief);
    },
  );
  it('keeps chip-cell owners and periodic detail lattices C1 continuous', () => {
    const h = 1e-8;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (const count of [p.cells, 96]) {
        for (let edge = 0; edge <= count; edge++) {
          for (let i = 0; i <= 16; i++) {
            for (const axis of [0, 1]) {
              const x = axis ? i / 16 : edge / count,
                y = axis ? edge / count : i / 16;
              const a = at(x - (axis ? 0 : h), y - (axis ? h : 0)),
                b = at(x, y),
                c = at(x + (axis ? 0 : h), y + (axis ? h : 0));
              for (const key of [
                'color',
                'height',
                'roughness',
                'occlusion',
                'metallic',
              ] as const) {
                expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
                expect(
                  Math.abs((c[key] - 2 * b[key] + a[key]) / h),
                ).toBeLessThan(0.02);
              }
            }
          }
        }
      }
    }
  });
});

describe('natural slub linen', () => {
  const p = proceduralMaterialPresets.linen;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('linen', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x, y, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'varies yarn width along both directions while crossings stay above opaque gaps for seed %s',
    (seed) => {
      const at = field(seed);
      for (const axis of [0, 1]) {
        let minWidth = Infinity,
          maxWidth = -Infinity;
        for (let thread = 0; thread < p.threads; thread++) {
          for (let cut = 0; cut < p.threads; cut++) {
            let width = 0;
            for (let i = 0; i <= 100; i++) {
              const across = (thread + i * 0.0045) / p.threads,
                along = (cut + 0.5) / p.threads;
              if (
                at(axis ? along : across, axis ? across : along).occlusion >
                0.68
              )
                width = i * 0.0045;
            }
            minWidth = Math.min(minWidth, width);
            maxWidth = Math.max(maxWidth, width);
          }
        }
        expect(maxWidth - minWidth).toBeGreaterThan(0.1);
        expect(minWidth).toBeGreaterThan(0.12);
        expect(maxWidth).toBeLessThan(0.45);
      }
      for (let row = 0; row < p.threads; row++) {
        for (let col = 0; col < p.threads; col++) {
          const crossing = at(col / p.threads, row / p.threads);
          const gap = at((col + 0.5) / p.threads, (row + 0.5) / p.threads);
          expect(crossing.height - gap.height).toBeGreaterThan(0.02);
          expect(crossing.color - gap.color).toBeGreaterThan(0.5);
          expect(crossing.occlusion - gap.occlusion).toBeGreaterThan(0.3);
          expect(crossing.metallic).toBe(0);
          expect(gap.roughness).toBeGreaterThan(crossing.roughness);
        }
      }
    },
  );
  it('keeps yarn-owner gaps and tile wraps C1 continuous', () => {
    const h = 1e-8;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let edge = 0; edge <= p.threads; edge++) {
        for (const offset of [0, 0.5]) {
          for (let i = 0; i <= 64; i++) {
            for (const axis of [0, 1]) {
              const x = axis ? i / 64 : (edge + offset) / p.threads,
                y = axis ? (edge + offset) / p.threads : i / 64;
              const a = at(x - (axis ? 0 : h), y - (axis ? h : 0)),
                b = at(x, y),
                c = at(x + (axis ? 0 : h), y + (axis ? h : 0));
              for (const key of [
                'color',
                'height',
                'roughness',
                'occlusion',
              ] as const) {
                expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
                expect(
                  Math.abs((c[key] - 2 * b[key] + a[key]) / h),
                ).toBeLessThan(0.005);
              }
            }
          }
        }
      }
    }
  });
});

describe('polished red porphyry', () => {
  const p = proceduralMaterialPresets.porphyry;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('porphyry', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x, y, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'embeds elongated pale crystals flush in a darker rougher matrix for seed %s',
    (seed) => {
      const at = field(seed);
      let crystals = 0,
        aspectSum = 0,
        brightCount = 0,
        darkCount = 0;
      let brightRoughness = 0,
        darkRoughness = 0,
        brightHeight = 0,
        darkHeight = 0;
      for (let row = 0; row < p.cells; row++) {
        for (let col = 0; col < p.cells; col++) {
          let n = 0,
            sx = 0,
            sy = 0,
            xx = 0,
            yy = 0,
            xy = 0;
          for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 32; x++) {
              const s = at(
                (col + (x + 0.5) / 32) / p.cells,
                (row + (y + 0.5) / 32) / p.cells,
              );
              if (s.color > 0.7) {
                n++;
                sx += x;
                sy += y;
                xx += x * x;
                yy += y * y;
                xy += x * y;
                brightCount++;
                brightRoughness += s.roughness;
                brightHeight += s.height;
              } else if (s.color < 0.4) {
                darkCount++;
                darkRoughness += s.roughness;
                darkHeight += s.height;
              }
            }
          }
          if (n > 8) {
            const vx = xx / n - (sx / n) ** 2,
              vy = yy / n - (sy / n) ** 2;
            const cov = xy / n - (sx * sy) / (n * n);
            const gap = Math.sqrt((vx - vy) ** 2 + 4 * cov * cov);
            aspectSum += Math.sqrt((vx + vy + gap) / (vx + vy - gap));
            crystals++;
          }
        }
      }
      expect(crystals).toBeGreaterThan(35);
      expect(aspectSum / crystals).toBeGreaterThan(1.7);
      expect(brightCount / 65536).toBeGreaterThan(0.02);
      expect(brightCount / 65536).toBeLessThan(0.15);
      expect(
        darkRoughness / darkCount - brightRoughness / brightCount,
      ).toBeGreaterThan(0.18);
      expect(
        Math.abs(brightHeight / brightCount - darkHeight / darkCount),
      ).toBeLessThan(0.00001);
    },
  );
  it('keeps crystal-cell ownership and wraps C1 continuous', () => {
    const h = 1e-8;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let edge = 0; edge <= p.cells; edge++) {
        for (let i = 0; i <= 64; i++) {
          for (const axis of [0, 1]) {
            const x = axis ? i / 64 : edge / p.cells,
              y = axis ? edge / p.cells : i / 64;
            const a = at(x - (axis ? 0 : h), y - (axis ? h : 0)),
              b = at(x, y),
              c = at(x + (axis ? 0 : h), y + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.005,
              );
            }
          }
        }
      }
    }
  });
});

describe('rough cast iron', () => {
  const p = proceduralMaterialPresets.castiron;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('castiron', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x, y, out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'keeps sparse dark pores below a rough granular metal surface for seed %s',
    (seed) => {
      const at = field(seed);
      let cavities = 0,
        coreCount = 0,
        surfaceCount = 0;
      let coreHeight = 0,
        surfaceHeight = 0,
        coreRoughness = 0,
        surfaceRoughness = 0;
      let coreColor = 0,
        surfaceColor = 0,
        low = Infinity,
        high = -Infinity;
      let nonMetal = 0;
      for (let y = 0; y < 256; y++) {
        for (let x = 0; x < 256; x++) {
          const s = at((x + 0.5) / 256, (y + 0.5) / 256);
          if (s.metallic !== 1) nonMetal++;
          if (s.occlusion < 0.9) cavities++;
          if (s.occlusion < 0.685) {
            coreCount++;
            coreHeight += s.height;
            coreRoughness += s.roughness;
            coreColor += s.color;
          } else if (s.occlusion === 1) {
            surfaceCount++;
            surfaceHeight += s.height;
            surfaceRoughness += s.roughness;
            surfaceColor += s.color;
            low = Math.min(low, s.height);
            high = Math.max(high, s.height);
          }
        }
      }
      expect(cavities / 65536).toBeGreaterThan(0.005);
      expect(cavities / 65536).toBeLessThan(0.08);
      expect(coreCount).toBeGreaterThan(30);
      expect(
        surfaceHeight / surfaceCount - coreHeight / coreCount,
      ).toBeGreaterThan(0.0045);
      expect(
        coreRoughness / coreCount - surfaceRoughness / surfaceCount,
      ).toBeGreaterThan(0.08);
      expect(
        surfaceColor / surfaceCount - coreColor / coreCount,
      ).toBeGreaterThan(0.12);
      expect(surfaceRoughness / surfaceCount).toBeGreaterThan(0.7);
      expect(high - low).toBeGreaterThan(0.002);
      expect(nonMetal).toBe(0);
    },
  );
  it('keeps casting-cell ownership and wraps C1 continuous', () => {
    const h = 1e-8;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let edge = 0; edge <= p.cells; edge++) {
        for (let i = 0; i <= 64; i++) {
          for (const axis of [0, 1]) {
            const x = axis ? i / 64 : edge / p.cells,
              y = axis ? edge / p.cells : i / 64;
            const a = at(x - (axis ? 0 : h), y - (axis ? h : 0)),
              b = at(x, y),
              c = at(x + (axis ? 0 : h), y + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.005,
              );
            }
          }
        }
      }
    }
  });
});

describe('windmill clay paving', () => {
  const p = proceduralMaterialPresets.windmillpavers;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('windmillpavers', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x / (3 * p.cells), y / (3 * p.cells), out);
      return out;
    };
  };
  it.each([0, 1, 0xffffffff])(
    'wraps four uninterrupted long pavers around an equally raised dark square for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.cells; row++) {
        for (let col = 0; col < p.cells; col++) {
          const sample = (x: number, y: number) => at(x + col * 3, y + row * 3);
          const center = sample(1.5, 1.5);
          for (const [x, y] of [
            [1, 0.5],
            [2.5, 1],
            [2, 2.5],
            [0.5, 2],
          ]) {
            const brick = sample(x!, y!);
            expect(brick.mortar).toBe(0);
            expect(brick.color - center.color).toBeGreaterThan(0.17);
            expect(Math.abs(brick.height - center.height)).toBeLessThan(0.0004);
          }
          expect(center.mortar).toBe(0);
          expect(center.metallic).toBe(0);
          for (const [x, y] of [
            [1.5, 1],
            [2, 1.5],
            [1.5, 2],
            [1, 1.5],
            [0, 1.5],
          ]) {
            const joint = sample(x!, y!);
            expect(joint.mortar).toBe(1);
            expect(center.height - joint.height).toBeGreaterThan(0.03);
            expect(center.occlusion - joint.occlusion).toBeGreaterThan(0.5);
            expect(joint.roughness).toBeGreaterThan(center.roughness);
          }
        }
      }
    },
  );
  it('keeps all paver owners, bevel shoulders and tile wraps C1 continuous', () => {
    const h = 1e-7;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let edge = 0; edge <= 3 * p.cells; edge++) {
        for (const offset of [
          0,
          p.grout,
          p.grout + p.shoulder,
          -p.grout,
          -p.grout - p.shoulder,
        ]) {
          for (let i = 0; i <= 48; i++) {
            for (const axis of [0, 1]) {
              const x = axis ? i / 8 : edge + offset,
                y = axis ? edge + offset : i / 8;
              const a = at(x - (axis ? 0 : h), y - (axis ? h : 0)),
                b = at(x, y),
                c = at(x + (axis ? 0 : h), y + (axis ? h : 0));
              for (const key of [
                'color',
                'height',
                'roughness',
                'occlusion',
                'mortar',
              ] as const) {
                expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
                expect(
                  Math.abs((c[key] - 2 * b[key] + a[key]) / h),
                ).toBeLessThan(0.001);
              }
            }
          }
        }
      }
    }
  });
});

describe('etched Damascus steel', () => {
  const p = proceduralMaterialPresets.damascus;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('damascus', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x, y, out);
      return out;
    };
  };

  it.each([0, 1, 0xffffffff])(
    'folds fine strata into local eyes while dark etched layers stay rougher and shallow for seed %s',
    (seed) => {
      const at = field(seed);
      const crossings = (u: number): number => {
        let count = 0,
          previous = at(u, 0).color > 0.55;
        for (let i = 1; i <= 2048; i++) {
          const current = at(u, i / 2048).color > 0.55;
          if (current !== previous) count++;
          previous = current;
        }
        return count;
      };
      const straight = crossings(0.02 / p.cells);
      expect(straight).toBeGreaterThan(30);
      expect(straight).toBeLessThan(50);
      expect(crossings(0.5 / p.cells) - straight).toBeGreaterThan(8);
      let dark = at(0, 0),
        light = dark;
      for (let i = 0; i < 256; i++) {
        const sample = at(0.02 / p.cells, i / 256);
        if (sample.color < dark.color) dark = sample;
        if (sample.color > light.color) light = sample;
        expect(sample.metallic).toBe(1);
      }
      expect(light.color - dark.color).toBeGreaterThan(0.6);
      expect(dark.roughness - light.roughness).toBeGreaterThan(0.25);
      expect(light.height - dark.height).toBeGreaterThan(0.00018);
      expect(light.height - dark.height).toBeLessThan(0.00021);
    },
  );

  it('keeps fold-cell ownership and tile wraps C1 continuous', () => {
    const h = 1e-8;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let edge = 0; edge <= p.cells; edge++) {
        for (let i = 0; i <= 64; i++) {
          for (const axis of [0, 1]) {
            const x = axis ? i / 64 : edge / p.cells;
            const y = axis ? edge / p.cells : i / 64;
            const a = at(x - (axis ? 0 : h), y - (axis ? h : 0));
            const b = at(x, y);
            const c = at(x + (axis ? 0 : h), y + (axis ? h : 0));
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
        }
      }
    }
  });
});

describe('standing-seam metal roofing', () => {
  const p = proceduralMaterialPresets.standingseam;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('standingseam', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x / p.panels, y, out);
      out.height /= p.relief;
      return out;
    };
  };

  it.each([0, 1, 0xffffffff])(
    'retains narrow raised seams and recessed toes around broad flat metallic pans for seed %s',
    (seed) => {
      const at = field(seed);
      for (let panel = 0; panel < p.panels; panel++) {
        for (const v of [0, 0.23, 0.51, 0.79, 1]) {
          const cap = at(panel, v),
            pan = at(panel + 0.5, v);
          expect(cap.height - pan.height).toBeGreaterThan(0.71);
          for (const side of [-1, 1]) {
            const toe = at(panel + side * p.toeOffset, v);
            expect(pan.height - toe.height).toBeGreaterThan(0.066);
            expect(pan.occlusion - toe.occlusion).toBeGreaterThan(0.17);
          }
          for (const x of [0.2, 0.35, 0.65, 0.8]) {
            const flat = at(panel + x, v);
            expect(Math.abs(flat.height - pan.height)).toBeLessThan(0.004);
            expect(flat.metallic).toBe(1);
            expect(flat.mortar).toBe(0);
          }
          expect(cap.metallic).toBe(1);
        }
      }
    },
  );

  it('keeps cap shoulders, toe supports, pan centers and wraps C1 continuous', () => {
    const h = 1e-7;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let panel = 0; panel <= p.panels; panel++) {
        for (const side of [-1, 1]) {
          for (const offset of [
            0,
            p.capHalfWidth,
            p.capHalfWidth + p.shoulder,
            p.toeOffset - p.toeWidth,
            p.toeOffset,
            p.toeOffset + p.toeWidth,
            0.5,
          ]) {
            for (const y of [0, 0.23, 0.5, 0.79, 1]) {
              const x = panel + side * offset;
              for (const axis of [0, 1]) {
                const a = at(x - (axis ? 0 : h), y - (axis ? h : 0));
                const b = at(x, y);
                const c = at(x + (axis ? 0 : h), y + (axis ? h : 0));
                for (const key of [
                  'color',
                  'height',
                  'roughness',
                  'occlusion',
                ] as const) {
                  expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
                  expect(
                    Math.abs((c[key] - 2 * b[key] + a[key]) / h),
                  ).toBeLessThan(0.02);
                }
              }
            }
          }
        }
      }
    }
  });
});

describe('Truchet double-arc glazed tiles', () => {
  const p = proceduralMaterialPresets.truchettiles;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('truchettiles', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x / p.cells, y / p.cells, out);
      out.height /= p.relief;
      return out;
    };
  };

  it.each([0, 1, 0xffffffff])(
    'retains paired quarter arcs, aligned edge ports and flat pigment for seed %s',
    (seed) => {
      const at = field(seed);
      const q = p.arcRadius / Math.SQRT2;
      for (let row = 0; row < p.cells; row++) {
        for (let col = 0; col < p.cells; col++) {
          const a = at(col + q, row + q),
            b = at(col + q, row + 1 - q);
          const aa = at(col + 1 - q, row + 1 - q),
            bb = at(col + 1 - q, row + q);
          expect(Math.abs(a.color - b.color)).toBeGreaterThan(0.8);
          expect(Math.abs(a.color - aa.color)).toBeLessThan(0.03);
          expect(Math.abs(b.color - bb.color)).toBeLessThan(0.03);
          expect(Math.abs(a.height - b.height)).toBeLessThan(0.004);
          const blank = at(col + 0.5, row + 0.5);
          for (const [x, y] of [
            [0.06, 0.5],
            [0.94, 0.5],
            [0.5, 0.06],
            [0.5, 0.94],
          ]) {
            const port = at(col + x!, row + y!);
            expect(blank.color - port.color).toBeGreaterThan(0.8);
            expect(Math.abs(blank.height - port.height)).toBeLessThan(0.004);
            expect(port.mortar).toBe(0);
          }
          expect(at(col, row + 0.5).mortar).toBe(1);
        }
      }
    },
  );

  it('keeps rotated motif supports and shared grout C1 continuous', () => {
    const h = 1e-7;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      const check = (x: number, y: number): void => {
        for (const axis of [0, 1]) {
          const a = at(x - (axis ? 0 : h), y - (axis ? h : 0));
          const b = at(x, y);
          const c = at(x + (axis ? 0 : h), y + (axis ? h : 0));
          for (const key of [
            'color',
            'height',
            'roughness',
            'occlusion',
            'mortar',
          ] as const) {
            expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
            expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
              0.02,
            );
          }
        }
      };
      for (let row = 0; row < p.cells; row++) {
        for (let col = 0; col < p.cells; col++) {
          for (let i = 0; i <= 16; i++) {
            const t = i / 16;
            for (const edge of [0, p.grout, p.grout + p.shoulder, 1]) {
              check(col + edge, row + t);
              check(col + t, row + edge);
            }
            for (const radius of [
              Math.sqrt(p.arcRadius ** 2 - p.arcWidthSquared),
              p.arcRadius,
              Math.sqrt(p.arcRadius ** 2 + p.arcWidthSquared),
            ]) {
              const x = radius * Math.cos((t * Math.PI) / 2),
                y = radius * Math.sin((t * Math.PI) / 2);
              check(col + x, row + y);
              check(col + x, row + 1 - y);
              check(col + 1 - x, row + y);
              check(col + 1 - x, row + 1 - y);
            }
          }
        }
      }
    }
  });
});

describe('octagon and diamond inset tiles', () => {
  const p = proceduralMaterialPresets.octagondot;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('octagondot', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x / p.cells, y / p.cells, out);
      out.height /= p.relief;
      return out;
    };
  };

  it.each([0, 1, 0xffffffff])(
    'retains light clipped octagons and equally raised dark diamonds separated by grout for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.cells; row++) {
        for (let col = 0; col < p.cells; col++) {
          const face = at(col + 0.5, row + 0.5);
          const dot = at(col, row);
          const diagonalSeam = at(col + 0.0825, row + 0.0825);
          const edgeSeam = at(col, row + 0.5);
          expect(face.color - dot.color).toBeGreaterThan(0.8);
          expect(Math.abs(face.height - dot.height)).toBeLessThan(0.006);
          for (const seam of [diagonalSeam, edgeSeam]) {
            expect(dot.height - seam.height).toBeGreaterThan(0.64);
            expect(dot.occlusion - seam.occlusion).toBeGreaterThan(0.5);
            expect(seam.roughness - dot.roughness).toBeGreaterThan(0.3);
            expect(seam.mortar).toBe(1);
          }
          expect(face.mortar).toBe(0);
          expect(dot.mortar).toBe(0);
        }
      }
    },
  );

  it('keeps octagon bevels, diamond shoulders and shared corner wraps C1 continuous', () => {
    // Narrow diamond bevels have steep but finite slopes; probe below their scale.
    const h = 1e-7;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      const check = (x: number, y: number): void => {
        for (const axis of [0, 1]) {
          const a = at(x - (axis ? 0 : h), y - (axis ? h : 0));
          const b = at(x, y);
          const c = at(x + (axis ? 0 : h), y + (axis ? h : 0));
          for (const key of [
            'color',
            'height',
            'roughness',
            'occlusion',
            'mortar',
          ] as const) {
            expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
            expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
              0.02,
            );
          }
        }
      };
      for (let i = 0; i <= 32; i++) {
        const t = i / 32;
        for (const edge of [0, p.grout, p.grout + p.shoulder, p.cells]) {
          check(edge, t);
          check(t, edge);
        }
        for (const edge of [p.clippedCorner, p.clippedCorner - p.shoulder]) {
          check(0.5 + edge * t, 0.5 + edge * (1 - t));
        }
        for (const edge of [
          p.dotRadius,
          Math.sqrt(p.dotRadius ** 2 - p.dotShoulder),
        ]) {
          check(edge * t, edge * (1 - t));
          check(-edge * t, edge * (1 - t));
        }
      }
    }
  });
});

describe('double-thread ripstop nylon', () => {
  const p = proceduralMaterialPresets.ripstop;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('ripstop', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x / p.cells, y / p.cells, out);
      out.height /= p.relief;
      return out;
    };
  };

  it.each([0, 1, 0xffffffff])(
    'retains separate reinforcement pairs and fine weave between the grid lines for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.cells; row++) {
        for (let col = 0; col < p.cells; col++) {
          for (const axis of [0, 1]) {
            const gap = at(col + (axis ? 0.5 : 0), row + (axis ? 0 : 0.5));
            for (const side of [-1, 1]) {
              const thread = at(
                col + (axis ? 0.5 : side * p.reinforcementOffset),
                row + (axis ? side * p.reinforcementOffset : 0.5),
              );
              expect(thread.height - gap.height).toBeGreaterThan(0.36);
              expect(thread.color - gap.color).toBeGreaterThan(0.19);
              expect(thread.roughness - gap.roughness).toBeGreaterThan(0.03);
            }
          }
          const thread = at(col + 0.5, row + 0.5);
          const gap = at(col + 0.53125, row + 0.53125);
          expect(thread.height - gap.height).toBeGreaterThan(0.14);
          expect(thread.color - gap.color).toBeGreaterThan(0.07);
        }
      }
    },
  );

  it('keeps paired supports, crossings and tile wraps C1 continuous', () => {
    const h = 1e-6;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let cell = 0; cell <= p.cells; cell++) {
        for (const side of [-1, 1]) {
          for (const delta of [
            -p.reinforcementWidth,
            0,
            p.reinforcementWidth,
          ]) {
            const line = cell + side * p.reinforcementOffset + delta;
            for (const cross of [0, p.reinforcementOffset, 0.5, 1, p.cells]) {
              for (const axis of [0, 1]) {
                const x = axis ? cross : line,
                  y = axis ? line : cross;
                const a = at(x - (axis ? 0 : h), y - (axis ? h : 0));
                const b = at(x, y);
                const c = at(x + (axis ? 0 : h), y + (axis ? h : 0));
                for (const key of [
                  'color',
                  'height',
                  'roughness',
                  'occlusion',
                ] as const) {
                  expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
                  expect(
                    Math.abs((c[key] - 2 * b[key] + a[key]) / h),
                  ).toBeLessThan(0.02);
                }
              }
            }
          }
        }
      }
    }
  });
});

describe('basket weave clay pavers', () => {
  const p = proceduralMaterialPresets.basketweavepavers;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('basketweavepavers', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x / p.cells, y / p.cells, out);
      out.height /= p.relief;
      return out;
    };
  };

  it.each([0, 1, 0xffffffff])(
    'alternates paired long bricks and recessed grout without splitting each brick for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.cells; row++) {
        for (let col = 0; col < p.cells; col++) {
          const vertical = (col + row) % 2 !== 0;
          const face = at(
            col + (vertical ? 0.25 : 0.5),
            row + (vertical ? 0.5 : 0.25),
          );
          const seam = at(
            col + (vertical ? 0.5 : 0.25),
            row + (vertical ? 0.25 : 0.5),
          );
          expect(face.height - seam.height).toBeGreaterThan(0.64);
          expect(face.color - seam.color).toBeGreaterThan(0.25);
          expect(face.occlusion - seam.occlusion).toBeGreaterThan(0.5);
          expect(face.mortar).toBe(0);
          expect(seam.mortar).toBe(1);
          expect(at(col, row + 0.25).mortar).toBe(1);
          expect(at(col + 0.25, row).mortar).toBe(1);
        }
      }
    },
  );

  it('keeps orientation changes, paired seams, bevel shoulders and wraps C1 continuous', () => {
    const h = 1e-6;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let row = 0; row < p.cells; row++) {
        for (let col = 0; col < p.cells; col++) {
          for (const line of [0, 0.5, 1]) {
            for (const offset of [
              0,
              p.grout,
              -p.grout,
              p.grout + p.shoulder,
              -p.grout - p.shoulder,
            ]) {
              for (const cross of [0, 0.25, 0.5, 0.75, 1]) {
                for (const axis of [0, 1]) {
                  const x = col + (axis ? cross : line + offset);
                  const y = row + (axis ? line + offset : cross);
                  const a = at(x - (axis ? 0 : h), y - (axis ? h : 0));
                  const b = at(x, y);
                  const c = at(x + (axis ? 0 : h), y + (axis ? h : 0));
                  for (const key of [
                    'color',
                    'height',
                    'roughness',
                    'occlusion',
                    'mortar',
                  ] as const) {
                    expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
                    expect(
                      Math.abs((c[key] - 2 * b[key] + a[key]) / h),
                    ).toBeLessThan(0.02);
                  }
                }
              }
            }
          }
        }
      }
    }
  });
});

describe('quatrefoil breeze blocks', () => {
  const p = proceduralMaterialPresets.breezeblock;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('breezeblock', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x / p.cells, y / p.cells, out);
      out.height /= p.relief;
      return out;
    };
  };

  it.each([0, 1, 0xffffffff])(
    'retains four dark rounded lobes within a raised concrete frame for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.cells; row++) {
        for (let col = 0; col < p.cells; col++) {
          const frame = at(col + 0.88, row + 0.88);
          const diagonal = at(col + 0.74, row + 0.74);
          for (const [x, y] of [
            [0, 0],
            [0.24, 0],
            [-0.24, 0],
            [0, 0.24],
            [0, -0.24],
          ]) {
            const hollow = at(col + 0.5 + x!, row + 0.5 + y!);
            expect(frame.height - hollow.height).toBeGreaterThan(0.7);
            expect(frame.color - hollow.color).toBeGreaterThan(0.5);
            expect(frame.occlusion - hollow.occlusion).toBeGreaterThan(0.7);
            expect(diagonal.height - hollow.height).toBeGreaterThan(0.7);
            expect(hollow.mortar).toBe(0);
          }
          expect(at(col, row + 0.5).mortar).toBe(1);
        }
      }
    },
  );

  it('keeps lobe shoulders, intersections and block seams C1 continuous', () => {
    const h = 1e-6;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      const check = (x: number, y: number): void => {
        for (const axis of [0, 1]) {
          const a = at(x - (axis ? 0 : h), y - (axis ? h : 0));
          const b = at(x, y);
          const c = at(x + (axis ? 0 : h), y + (axis ? h : 0));
          for (const key of [
            'color',
            'height',
            'roughness',
            'occlusion',
            'mortar',
          ] as const) {
            expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
            expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
              0.02,
            );
          }
        }
      };
      for (const [cx, cy] of [
        [p.lobeOffset, 0],
        [-p.lobeOffset, 0],
        [0, p.lobeOffset],
        [0, -p.lobeOffset],
      ]) {
        for (const radius of [
          p.lobeRadius,
          Math.sqrt(p.lobeRadius ** 2 - p.lobeShoulder),
        ]) {
          for (let i = 0; i < 32; i++) {
            const angle = (i * Math.PI) / 16;
            check(
              0.5 + cx! + radius * Math.cos(angle),
              0.5 + cy! + radius * Math.sin(angle),
            );
          }
        }
      }
      for (let i = 0; i <= 32; i++) {
        for (const edge of [0, p.grout, p.grout + p.edgeShoulder, p.cells]) {
          check(edge, (i * p.cells) / 32);
          check((i * p.cells) / 32, edge);
        }
      }
    }
  });
});

describe('birdseye maple', () => {
  const p = proceduralMaterialPresets.birdseyemaple;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('birdseyemaple', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x / p.cells, y / p.cells, out);
      out.height /= p.relief;
      return out;
    };
  };

  it.each([0, 1, 0xffffffff])(
    'has dark localized eyes without raised knot geometry for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.cells; row++) {
        for (let col = 0; col < p.cells; col++) {
          let darkestEye = 1,
            darkestEdge = 1,
            minHeight = 1,
            maxHeight = 0;
          for (let y = 0; y <= 16; y++) {
            darkestEdge = Math.min(darkestEdge, at(col, row + y / 16).color);
            for (let x = 0; x <= 16; x++) {
              const point = at(col + 0.25 + x / 32, row + 0.25 + y / 32);
              darkestEye = Math.min(darkestEye, point.color);
              minHeight = Math.min(minHeight, point.height);
              maxHeight = Math.max(maxHeight, point.height);
            }
          }
          expect(darkestEdge - darkestEye).toBeGreaterThan(0.12);
          expect(maxHeight - minHeight).toBeLessThan(0.05);
        }
      }
    },
  );

  it('keeps eye-cell ownership boundaries and tile wrap C1 continuous', () => {
    const h = 1e-6;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let cell = 0; cell <= p.cells; cell++) {
        for (let i = 0; i <= 24; i++) {
          const t = (i * p.cells) / 24;
          for (const axis of [0, 1]) {
            const a = axis ? at(t, cell - h) : at(cell - h, t);
            const b = axis ? at(t, cell) : at(cell, t);
            const c = axis ? at(t, cell + h) : at(cell + h, t);
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
        }
      }
    }
  });
});

describe('oxidized copper', () => {
  it.each([0, 1, 0xffffffff])(
    'keeps exposed copper metallic and green oxide rough dielectric for seed %s',
    (seed) => {
      const size = 64;
      const maps = generateProceduralMaps('copperpatina', size, seed);
      let exposed = 0,
        oxidized = 0;
      for (let i = 0; i < maps.baseColor.length; i += 4) {
        const metal = maps.metallicRoughness[i + 2];
        const rough = maps.metallicRoughness[i + 1];
        const red = maps.baseColor[i],
          green = maps.baseColor[i + 1];
        if (metal > 242) {
          exposed++;
          expect(red - green).toBeGreaterThan(50);
          expect(rough).toBeLessThan(85);
        } else if (metal < 13) {
          oxidized++;
          expect(green - red).toBeGreaterThan(70);
          expect(rough).toBeGreaterThan(185);
        }
      }
      expect(exposed / (size * size)).toBeGreaterThan(0.05);
      expect(oxidized / (size * size)).toBeGreaterThan(0.05);
    },
  );

  it('keeps color, metalness and relief continuous through periodic noise joins', () => {
    const empty = (): SurfaceSample => ({
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    });
    const a = empty(),
      b = empty(),
      c = empty();
    const h = 1e-7;
    for (const seed of [0, 1, 0xffffffff]) {
      const sample = createSurfaceSampler('copperpatina', seed);
      for (const count of [4, 20, 96]) {
        for (let cell = 0; cell <= count; cell++) {
          for (const axis of [0, 1]) {
            const edge = cell / count;
            const t = (cell * 0.61803398875) % 1;
            sample(axis ? t : edge - h, axis ? edge - h : t, a);
            sample(axis ? t : edge, axis ? edge : t, b);
            sample(axis ? t : edge + h, axis ? edge + h : t, c);
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
              'metallic',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
        }
      }
    }
  });
});

describe('rammed earth walls', () => {
  const p = proceduralMaterialPresets.rammedearth;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('rammedearth', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      out.height /= p.relief;
      return out;
    };
  };

  it.each([0, 1, 0xffffffff])(
    'retains alternating packed earth layers without turning color bands into raised terraces for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.layers; row += 2) {
        let colorDifference = 0;
        let heightDifference = 0;
        for (let i = 0; i < 64; i++) {
          const dark = at(i / 64, row / p.layers);
          const light = at(i / 64, (row + 1) / p.layers);
          colorDifference += light.color - dark.color;
          heightDifference += light.height - dark.height;
          expect(dark.roughness).toBeGreaterThan(0.85);
          expect(light.roughness).toBeGreaterThan(0.85);
        }
        expect(colorDifference / 64).toBeGreaterThan(0.18);
        expect(Math.abs(heightDifference / 64)).toBeLessThan(0.06);
      }
    },
  );

  it('keeps layer blending, compressed seams and periodic joins C1 continuous', () => {
    const at = field(0);
    const h = 1e-7;
    for (const u of [0, 0.5, 1]) {
      for (let row = 0; row <= p.layers; row++) {
        for (const offset of [
          0,
          0.5 - p.transition,
          0.5 - p.seamWidth,
          0.5,
          0.5 + p.seamWidth,
          0.5 + p.transition,
        ]) {
          const v = (row + offset) / p.layers;
          const a = at(u, v - h),
            b = at(u, v),
            c = at(u, v + h);
          for (const key of [
            'color',
            'height',
            'roughness',
            'occlusion',
          ] as const) {
            expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
            expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
              0.02,
            );
          }
        }
      }
    }
  });
});

describe('octagonal cane webbing', () => {
  const p = proceduralMaterialPresets.canewebbing;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('canewebbing', seed);
    return (x: number, y: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(x / p.cells, y / p.cells, out);
      out.height /= p.relief;
      return out;
    };
  };

  it.each([0, 1, 0xffffffff])(
    'encloses recessed octagons with cardinal and diagonal ribbons for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.cells; row++) {
        for (let col = 0; col < p.cells; col++) {
          const hollow = at(col + 0.5, row + 0.5);
          for (const [x, y] of [
            [0, 0.5],
            [1, 0.5],
            [0.5, 0],
            [0.5, 1],
            [0.25, 0.25],
            [0.75, 0.25],
            [0.25, 0.75],
            [0.75, 0.75],
          ]) {
            const edge = at(col + x!, row + y!);
            expect(edge.height - hollow.height).toBeGreaterThan(0.6);
            expect(edge.color - hollow.color).toBeGreaterThan(0.5);
            expect(edge.occlusion - hollow.occlusion).toBeGreaterThan(0.7);
            expect(hollow.roughness - edge.roughness).toBeGreaterThan(0.2);
          }
        }
      }
    },
  );

  it('keeps ribbon shoulders, diagonal crossings and wrap first derivatives continuous', () => {
    const h = 1e-6;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (let i = 0; i <= 32; i++) {
        const t = (i * p.cells) / 32;
        for (const edge of [
          0,
          p.cells,
          p.ribbonWidth,
          1 - p.ribbonWidth,
          0.5 - t - p.diagonalWidth,
          0.5 - t + p.diagonalWidth,
          t + 0.5 - p.diagonalWidth,
          t + 0.5 + p.diagonalWidth,
        ]) {
          for (const axis of [0, 1]) {
            const a = axis === 0 ? at(edge - h, t) : at(t, edge - h);
            const b = axis === 0 ? at(edge, t) : at(t, edge);
            const c = axis === 0 ? at(edge + h, t) : at(t, edge + h);
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
        }
      }
    }
  });
});

describe('beveled subway tiles', () => {
  const p = proceduralMaterialPresets.subwaytiles;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('subwaytiles', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      out.height /= p.relief;
      return out;
    };
  };

  it.each([0, 1, 0xffffffff])(
    'keeps flat glazed faces above bevels and staggered rough grout for seed %s',
    (seed) => {
      const at = field(seed);
      for (let row = 0; row < p.rows; row++) {
        const shift = (row % 2) * 0.5;
        const v = (row + 0.5) / p.rows;
        for (let column = 0; column < p.columns; column++) {
          const u = (column - shift) / p.columns;
          const face = at(u + 0.5 / p.columns, v);
          const flat = at(u + 0.35 / p.columns, v);
          const bevel = at(
            u + (p.grout + p.shoulder + p.bevel * 0.5) / p.columns,
            v,
          );
          const grout = at(u, v);
          expect(face.height).toBeCloseTo(flat.height, 12);
          expect(face.height - bevel.height).toBeGreaterThan(0.2);
          expect(bevel.height - grout.height).toBeGreaterThan(0.5);
          expect(grout.roughness - face.roughness).toBeGreaterThan(0.55);
          expect(face.occlusion - grout.occlusion).toBeGreaterThan(0.35);
          expect(grout.mortar).toBe(1);
          expect(face.mortar).toBe(0);
          const nextRow = at(u, v + 1 / p.rows);
          expect(nextRow.height - grout.height).toBeGreaterThan(0.75);
        }
      }
    },
  );

  it('keeps staggered joins, bevel shoulders and tile wrap C1 continuous', () => {
    const h = 1e-7;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      const offsets = [
        0,
        p.grout,
        p.grout + p.shoulder,
        p.grout + p.shoulder + p.bevel,
      ];
      for (const axis of [0, 1]) {
        for (let i = 0; i < 25; i++) {
          const t = i / 24;
          const row = Math.floor((t % 1) * p.rows);
          const shift = axis === 0 ? ((row % 2) * 0.5) / p.columns : 0;
          const count = axis === 0 ? p.columns : p.rows;
          for (let cell = 0; cell <= count; cell++) {
            for (const edge of offsets) {
              for (const sign of [-1, 1]) {
                const seam = cell / count - shift + (sign * edge) / p.columns;
                const get = (d: number): SurfaceSample =>
                  at(axis === 0 ? seam + d : t, axis === 1 ? seam + d : t);
                const a = get(-h),
                  b = get(0),
                  c = get(h);
                for (const key of [
                  'color',
                  'height',
                  'roughness',
                  'occlusion',
                  'mortar',
                ] as const) {
                  expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
                  expect(
                    Math.abs((c[key] - 2 * b[key] + a[key]) / h),
                  ).toBeLessThan(0.02);
                }
              }
            }
          }
        }
      }
    }
  });
});

describe('fluted wood panels', () => {
  const p = proceduralMaterialPresets.flutedwood;
  const field = (seed: number) => {
    const sample = createSurfaceSampler('flutedwood', seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      out.height /= p.relief;
      return out;
    };
  };

  it.each([0, 1, 0xffffffff])(
    'keeps rounded wooden crowns above dark rough recessed backing for seed %s',
    (seed) => {
      const at = field(seed);
      for (let slat = 0; slat < p.slats; slat++) {
        for (const v of [0, 0.23, 0.57, 0.91]) {
          const center = at((slat + 0.5) / p.slats, v);
          const shoulder = at((slat + 0.75) / p.slats, v);
          const gap = at(slat / p.slats, v);
          expect(center.height - shoulder.height).toBeGreaterThan(0.12);
          expect(shoulder.height - gap.height).toBeGreaterThan(0.4);
          expect(center.color - gap.color).toBeGreaterThan(0.4);
          expect(center.occlusion - gap.occlusion).toBeGreaterThan(0.45);
          expect(gap.roughness - center.roughness).toBeGreaterThan(0.2);
        }
      }
    },
  );

  it('joins the backing and repeat seams without field or normal-slope jumps', () => {
    const h = 1e-7;
    for (const seed of [0, 1, 0xffffffff]) {
      const at = field(seed);
      for (const axis of [0, 1]) {
        const seams =
          axis === 0
            ? [
                0,
                1,
                ...Array.from({ length: p.slats }, (_, i) => [
                  (i + 0.5 - p.halfWidth) / p.slats,
                  (i + 0.5 + p.halfWidth) / p.slats,
                ]).flat(),
              ]
            : [0, 1];
        for (const seam of seams) {
          for (let i = 0; i < 17; i++) {
            const sample = (delta: number): SurfaceSample =>
              at(
                axis === 0 ? seam + delta : i / 17,
                axis === 1 ? seam + delta : i / 17,
              );
            const a = sample(-h),
              b = sample(0),
              c = sample(h);
            for (const key of [
              'height',
              'color',
              'roughness',
              'occlusion',
            ] as const) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.0001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.02,
              );
            }
          }
        }
      }
    }
  });
});

describe('tatami rush weave', () => {
  it.each([0, 1, 0xffffffff])(
    'keeps raised reeds, recessed gaps and alternating binding crossings for seed %s',
    (seed) => {
      const sample = createSurfaceSampler('tatami', seed);
      const p = proceduralMaterialPresets.tatami;
      const at = (u: number, v: number): SurfaceSample => {
        const out: SurfaceSample = {
          color: 0,
          height: 0,
          roughness: 0,
          occlusion: 0,
          mortar: 0,
          metallic: 0,
        };
        sample(u, v, out);
        out.height /= p.relief;
        return out;
      };
      for (let reed = 0; reed < p.reeds; reed++) {
        const u = reed / p.reeds;
        const crown = at(u, 0.125);
        const gap = at(u + 0.5 / p.reeds, 0.125);
        const crossing = at(u, 0);
        expect(crown.height - gap.height).toBeGreaterThan(0.38);
        expect(crown.occlusion - gap.occlusion).toBeGreaterThan(0.24);
        if (reed % 2 === 0)
          expect(crossing.height - crown.height).toBeGreaterThan(0.22);
        else expect(crown.height - crossing.height).toBeGreaterThan(0.08);
      }
    },
  );

  it('has no field or normal-slope discontinuity at tile and binding support seams', () => {
    const keys = ['color', 'height', 'roughness', 'occlusion'] as const;
    const out = (): SurfaceSample => ({
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    });
    for (const seed of [0, 1, 0xffffffff]) {
      const sample = createSurfaceSampler('tatami', seed);
      const p = proceduralMaterialPresets.tatami;
      for (const axis of [0, 1]) {
        for (const seam of axis === 0
          ? [0, 1]
          : [
              0,
              1,
              p.bindingWidth / p.bindings,
              1 - p.bindingWidth / p.bindings,
            ]) {
          for (let i = 0; i < 17; i++) {
            const a = out(),
              b = out(),
              c = out();
            const h = 1e-6;
            const at = (offset: number, target: SurfaceSample): void =>
              sample(
                axis === 0 ? seam + offset : i / 17,
                axis === 1 ? seam + offset : i / 17,
                target,
              );
            at(-h, a);
            at(0, b);
            at(h, c);
            for (const key of keys) {
              expect(Math.abs(a[key] - c[key])).toBeLessThan(0.001);
              expect(Math.abs((c[key] - 2 * b[key] + a[key]) / h)).toBeLessThan(
                0.15,
              );
            }
          }
        }
      }
    }
  });
});

describe('opaque fruit rind morphology', () => {
  const seeds = [0, 1, 0xffffffff];
  const empty = (): SurfaceSample => ({
    color: 0,
    height: 0,
    roughness: 0,
    occlusion: 0,
    mortar: 0,
    metallic: 0,
  });
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (kind: ProceduralMaterialKind, seed: number) => {
    const sample = createSurfaceSampler(kind, seed);
    return (u: number, v: number, out: SurfaceSample): void => {
      sample(u, v, out);
      out.height /= proceduralMaterialPresets[kind].relief;
    };
  };
  const diamond = (
    x: number,
    y: number,
    a: number,
    b: number,
  ): [number, number] => {
    const n = proceduralMaterialPresets.pineapple.cells;
    return [(x - y + a - b) / (2 * n), (x + y + 1 + a + b) / (2 * n)];
  };
  const berry = (x: number, y: number, seed: number) => {
    const p = proceduralMaterialPresets.strawberry,
      angle = 0.3 * (hash(x, y, seed ^ 0x31a7) - 0.5),
      c = Math.cos(angle),
      s = Math.sin(angle),
      cx = x + (y % 2) * 0.5 + 0.42 + 0.16 * hash(x, y, seed ^ 0x293d),
      cy = y + 0.42 + 0.16 * hash(x, y, seed ^ 0x473b);
    return (a: number, b: number): [number, number] => [
      (cx + a * c - b * s) / p.columns,
      (cy + a * s + b * c) / p.rows,
    ];
  };
  const normals = [
    [1, 0],
    [-1, 0],
    [0.5, 0.75],
    [-0.5, -0.75],
    [-0.5, 0.75],
    [0.5, -0.75],
  ];
  const tubercle = (x: number, y: number, seed: number) => {
    const p = proceduralMaterialPresets.lychee;
    return {
      edges: normals.map(
        (_, side) =>
          p.edge +
          p.jitter * (2 * hash(x, y, seed ^ (0x371b + side * 0x9e37)) - 1),
      ),
      crown: [
        0.24 * (hash(x, y, seed ^ 0x293d) - 0.5),
        0.24 * (hash(x, y, seed ^ 0x473b) - 0.5),
      ],
      point: (a: number, b: number): [number, number] => [
        (x + (y % 2) * 0.5 + 0.5 + a) / p.columns,
        (y + 0.5 + b) / p.rows,
      ],
    };
  };

  it('pineapple has diagonal polygon shoulders, raised crowns and recessed central eyes and seams', () => {
    const p = proceduralMaterialPresets.pineapple;
    for (const seed of seeds) {
      const sample = field('pineapple', seed);
      for (let y = 0; y < p.cells; y++)
        for (let x = 0; x < p.cells; x++) {
          const eye = empty(),
            crown = empty(),
            seam = empty(),
            corner = empty();
          sample(...diamond(x, y, 0, 0), eye);
          sample(...diamond(x, y, p.eyeRadius, 0), crown);
          sample(...diamond(x, y, 0.5, 0), seam);
          sample(...diamond(x, y, 0.5, 0.5), corner);
          expect(crown.height - eye.height).toBeGreaterThan(0.33);
          expect(crown.height - seam.height).toBeGreaterThan(0.46);
          expect(crown.color - seam.color).toBeGreaterThan(0.48);
          expect(crown.occlusion - eye.occlusion).toBeGreaterThan(0.19);
          expect(seam.height).toBeCloseTo(corner.height, 12);
        }
    }
  });

  it('strawberry has elongated depressed pockets with ochre seed cores below broad red skin', () => {
    const p = proceduralMaterialPresets.strawberry;
    for (const seed of seeds) {
      const sample = field('strawberry', seed);
      for (let y = 0; y < p.rows; y++)
        for (let x = 0; x < p.columns; x++) {
          const point = berry(x, y, seed),
            seedCore = empty(),
            pocket = empty(),
            skin = empty(),
            across = empty(),
            along = empty();
          sample(...point(0, 0), seedCore);
          sample(...point(p.width * Math.sqrt(p.core), 0), pocket);
          sample(...point(p.width, 0), skin);
          sample(...point(0.2, 0), across);
          sample(...point(0, 0.2), along);
          expect(seedCore.color).toBeGreaterThan(0.89);
          expect(skin.color).toBeLessThan(0.14);
          expect(seedCore.height - pocket.height).toBeGreaterThan(0.085);
          expect(skin.height - seedCore.height).toBeGreaterThan(0.2);
          expect(skin.occlusion - pocket.occlusion).toBeGreaterThan(0.31);
          expect(across.height - along.height).toBeGreaterThan(0.15);
        }
    }
  });

  it('lychee has densely packed irregular polygon tubercles with displaced crowns and narrow recessed fissures', () => {
    const p = proceduralMaterialPresets.lychee;
    for (const seed of seeds) {
      const sample = field('lychee', seed);
      let covered = 0;
      for (let y = 0; y < p.rows; y++)
        for (let x = 0; x < p.columns; x++) {
          const f = tubercle(x, y, seed),
            peak = empty(),
            flank = empty(),
            fissure = empty();
          sample(...f.point(f.crown[0], f.crown[1]), peak);
          sample(...f.point(0.29, 0), flank);
          sample(...f.point(0.5, 0), fissure);
          expect(peak.height - flank.height).toBeGreaterThan(0.025);
          expect(peak.height - fissure.height).toBeGreaterThan(0.42);
          expect(peak.occlusion - fissure.occlusion).toBeGreaterThan(0.41);
          expect(peak.color - fissure.color).toBeGreaterThan(0.61);
          // Cell-local coverage, including the six-sided clipped corners.
          for (let j = 0; j < 8; j++)
            for (let i = 0; i < 8; i++) {
              const out = empty();
              sample(...f.point((i + 0.5) / 8 - 0.5, (j + 0.5) / 8 - 0.5), out);
              if (out.height > 0.3) covered++;
            }
        }
      expect(covered / (p.columns * p.rows * 64)).toBeGreaterThan(0.73);
    }
  });

  for (const seed of seeds)
    it.each(['pineapple', 'strawberry', 'lychee'] as const)(
      `%s seed ${seed} has common limiting slopes at actual centers, polygon corners, shoulders, supports and cell seams`,
      (kind) => {
        const sample = field(kind, seed),
          points: [number, number][] = [
            [0, 0],
            [0, 0.417],
            [0.391, 1],
          ];
        if (kind === 'pineapple') {
          const p = proceduralMaterialPresets.pineapple;
          for (let y = 0; y < p.cells; y++)
            for (let x = 0; x < p.cells; x++) {
              for (const a of [
                0,
                p.eyeRadius,
                2 * p.eyeRadius,
                0.5 - p.shoulder,
                0.5,
              ])
                points.push(diamond(x, y, a, 0), diamond(x, y, a, a));
              points.push(diamond(x, y, 0.5, -0.5));
            }
        } else if (kind === 'strawberry') {
          const p = proceduralMaterialPresets.strawberry;
          for (let y = 0; y < p.rows; y++)
            for (let x = 0; x < p.columns; x++) {
              const point = berry(x, y, seed);
              points.push(
                point(0, 0),
                [x / p.columns, (y + 0.31) / p.rows],
                [(x + 0.37) / p.columns, y / p.rows],
              );
              for (const q of [p.core, 1])
                for (const theta of [0, 0.7, Math.PI / 2, Math.PI])
                  points.push(
                    point(
                      p.width * Math.sqrt(q) * Math.cos(theta),
                      p.length * Math.sqrt(q) * Math.sin(theta),
                    ),
                  );
            }
        } else {
          const p = proceduralMaterialPresets.lychee;
          for (let y = 0; y < p.rows; y++)
            for (let x = 0; x < p.columns; x++) {
              const f = tubercle(x, y, seed);
              points.push(
                f.point(0, 0),
                f.point(f.crown[0], f.crown[1]),
                [x / p.columns, (y + 0.31) / p.rows],
                [(x + 0.37) / p.columns, y / p.rows],
              );
              for (let side = 0; side < 6; side++) {
                const [a, b] = normals[side],
                  norm = a * a + b * b;
                for (const d of [f.edges[side], f.edges[side] - p.shoulder])
                  points.push(f.point((a * d) / norm, (b * d) / norm));
                // Intersections of real half-planes probe polygon corners,
                // including both ends of every softened shoulder.
                for (let other = side + 1; other < 6; other++) {
                  const [c, d] = normals[other],
                    det = a * d - b * c;
                  if (Math.abs(det) < 0.01) continue;
                  for (const inset of [0, p.shoulder]) {
                    const e = f.edges[side] - inset,
                      g = f.edges[other] - inset,
                      px = (e * d - b * g) / det,
                      py = (a * g - e * c) / det;
                    if (
                      normals.every(
                        ([nx, ny], i) =>
                          nx * px + ny * py <= f.edges[i] + 1e-12,
                      )
                    )
                      points.push(f.point(px, py));
                  }
                }
              }
            }
        }
        const center = empty(),
          left = empty(),
          right = empty(),
          coarseLeft = empty(),
          coarseRight = empty(),
          widerLeft = empty(),
          widerRight = empty(),
          fields = Object.keys(center) as (keyof SurfaceSample)[],
          directions = [
            [1, 0],
            [0, 1],
            [0.6, 0.8],
          ];
        let largestResidual = -Infinity;
        for (const [u, v] of points) {
          sample(u, v, center);
          for (const [du, dv] of directions) {
            const step = 2e-7;
            sample(u - step * du, v - step * dv, left);
            sample(u + step * du, v + step * dv, right);
            sample(u - 4 * step * du, v - 4 * step * dv, coarseLeft);
            sample(u + 4 * step * du, v + 4 * step * dv, coarseRight);
            sample(u - 8 * step * du, v - 8 * step * dv, widerLeft);
            sample(u + 8 * step * du, v + 8 * step * dv, widerRight);
            for (const key of fields) {
              const fine =
                  Math.abs(left[key] + right[key] - 2 * center[key]) / step,
                coarse =
                  Math.abs(
                    coarseLeft[key] + coarseRight[key] - 2 * center[key],
                  ) /
                  (4 * step),
                wider =
                  Math.abs(widerLeft[key] + widerRight[key] - 2 * center[key]) /
                  (8 * step);
              largestResidual = Math.max(
                largestResidual,
                fine - 0.4 * Math.max(coarse, wider),
              );
            }
          }
        }
        expect(largestResidual).toBeLessThanOrEqual(5e-8);
      },
    );
});

describe('opaque fungal morphology', () => {
  const seeds = [0, 1, 0xffffffff];
  const tau = 2 * Math.PI;
  const normalizedField = (kind: ProceduralMaterialKind, seed: number) => {
    const sample = createSurfaceSampler(kind, seed);
    return (u: number, v: number, out: SurfaceSample): void => {
      sample(u, v, out);
      out.height /= proceduralMaterialPresets[kind].relief;
    };
  };
  const empty = (): SurfaceSample => ({
    color: 0,
    height: 0,
    roughness: 0,
    occlusion: 0,
    mortar: 0,
    metallic: 0,
  });
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  // Reconstruct only feature locations/metrics to probe the real sampler.
  const fan = (
    x: number,
    y: number,
    seed: number,
    kind: 'mushroomgills' | 'bracketfungus',
  ) => {
    const p = proceduralMaterialPresets[kind],
      angle = 0.5 * (hash(x, y, seed ^ 0x2d41) - 0.5),
      c = Math.cos(angle),
      s = Math.sin(angle),
      cx = x + 0.4 + 0.2 * hash(x, y, seed ^ 0x17c3),
      cy = y + 0.4 + 0.2 * hash(x, y, seed ^ 0x59b7);
    return {
      phase: tau * hash(x, y, seed ^ 0x73a9),
      point: (radius: number, theta: number): [number, number] => {
        const a = radius * Math.sin(theta) * p.scale,
          b = (radius * Math.cos(theta) - 0.55) * p.scale;
        return [(cx + a * c - b * s) / p.cells, (cy + a * s + b * c) / p.cells];
      },
      local: (u: number, v: number): [number, number] => {
        const dx = u * p.cells - cx,
          dy = v * p.cells - cy;
        return [
          (dx * c + dy * s) / p.scale,
          (dy * c - dx * s) / p.scale + 0.55,
        ];
      },
    };
  };
  const chamber = (x: number, y: number, seed: number) => {
    const p = proceduralMaterialPresets.morel,
      cx = x + 0.5 + p.jitter * (2 * hash(x, y, seed ^ 0x23b9) - 1),
      cy = y + 0.5 + p.jitter * (2 * hash(x, y, seed ^ 0x47a1) - 1),
      stretch = 0.85 + 0.3 * hash(x, y, seed ^ 0x61d7),
      skew = 0.3 * (hash(x, y, seed ^ 0x75c3) - 0.5);
    return {
      center: [cx / p.columns, cy / p.rows] as [number, number],
      weight: (u: number, v: number): number => {
        const dx = u * p.columns - cx,
          dy = v * p.rows - cy,
          a = dx * stretch + dy * skew,
          b = dy / stretch,
          q = (a * a + b * b) / (p.support * p.support);
        return q < 1 ? (1 - q) ** p.weightPower : 0;
      },
      support: (theta: number): [number, number] => {
        const dy = p.support * Math.sin(theta) * stretch,
          dx = (p.support * Math.cos(theta) - dy * skew) / stretch;
        return [(cx + dx) / p.columns, (cy + dy) / p.rows];
      },
    };
  };
  const frontRadius = (front: number, theta: number, phase: number): number =>
    front /
    (1 +
      proceduralMaterialPresets.bracketfungus.lobe *
        Math.cos(5 * theta + phase) +
      0.035 * Math.cos(9 * theta - phase));

  it('gills have narrow long blades, interleaved outward-starting short blades and quiet attachments', () => {
    const p = proceduralMaterialPresets.mushroomgills;
    for (const seed of seeds) {
      const sample = normalizedField('mushroomgills', seed);
      for (let cell = 0; cell < p.cells; cell++) {
        const f = fan(cell, cell, seed, 'mushroomgills'),
          at = (radius: number, phase: number): SurfaceSample => {
            const theta =
                (phase - 0.5 * Math.sin(5 * radius + f.phase)) / p.blades,
              out = empty();
            sample(...f.point(radius, theta), out);
            return out;
          };
        for (const radius of [0.45, 0.98]) {
          const blade = at(radius, 0),
            space = at(radius, Math.PI / 2);
          expect(blade.height - space.height).toBeGreaterThan(0.15);
          expect(blade.color - space.color).toBeGreaterThan(0.35);
          expect(blade.occlusion - space.occlusion).toBeGreaterThan(0.23);
        }
        const innerShort = at(0.45, Math.PI),
          innerSpace = at(0.45, Math.PI / 2),
          outerShort = at(0.98, Math.PI),
          outerSpace = at(0.98, Math.PI / 2);
        expect(Math.abs(innerShort.height - innerSpace.height)).toBeLessThan(
          0.006,
        );
        expect(outerShort.height - outerSpace.height).toBeGreaterThan(0.15);
        const quiet = [-1, 0, 1].map((theta) => {
          const out = empty();
          sample(...f.point(0.1, theta), out);
          return out.height;
        });
        expect(Math.max(...quiet) - Math.min(...quiet)).toBeLessThan(0.005);
      }
    }
  });

  it('morel chambers are negative dark bowls enclosed by a raised connected, elongated ridge network', () => {
    const p = proceduralMaterialPresets.morel;
    for (const seed of seeds) {
      const sample = normalizedField('morel', seed);
      let raised = 0;
      for (let y = 0; y < p.rows; y++)
        for (let x = 0; x < p.columns; x++) {
          const a = chamber(x, y, seed).center,
            b = chamber((x + 1) % p.columns, y, seed).center,
            bowl = empty(),
            ridge = empty();
          if (x === p.columns - 1) b[0] += 1;
          sample(...a, bowl);
          let peak = -Infinity;
          for (let i = 1; i < 32; i++) {
            const out = empty(),
              t = i / 32;
            sample(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, out);
            if (out.height > peak) {
              peak = out.height;
              Object.assign(ridge, out);
            }
          }
          if (
            ridge.height > bowl.height + 0.08 &&
            ridge.color > bowl.color + 0.1 &&
            ridge.occlusion > bowl.occlusion + 0.065
          )
            raised++;
        }
      expect(raised).toBeGreaterThan(p.columns * p.rows * 0.8);
      // The same physical displacement crosses more ridges across the narrow
      // chamber axis than along its elongated axis; no hexagon-cell assumption.
      let across = 0,
        along = 0;
      const a = empty(),
        b = empty(),
        c = empty();
      for (let y = 0; y < 32; y++)
        for (let x = 0; x < 32; x++) {
          sample(x / 32, y / 32, a);
          sample(x / 32 + 0.04, y / 32, b);
          sample(x / 32, y / 32 + 0.04, c);
          across += Math.abs(a.height - b.height);
          along += Math.abs(a.height - c.height);
        }
      expect(across).toBeGreaterThan(along * 1.2);
    }
  });

  it('brackets have broad front-following pigment zones, thin relief and pale smooth margins', () => {
    const p = proceduralMaterialPresets.bracketfungus;
    for (const seed of seeds) {
      const sample = normalizedField('bracketfungus', seed);
      let visibleMargins = 0;
      for (let cell = 0; cell < p.cells; cell++) {
        const f = fan(cell, cell, seed, 'bracketfungus'),
          colors: number[] = [],
          heights: number[] = [];
        let darkest = empty();
        darkest.color = Infinity;
        for (let i = 0; i <= 48; i++) {
          const front = 0.4 + (0.65 * i) / 48,
            out = empty();
          sample(...f.point(frontRadius(front, 0, f.phase), 0), out);
          colors.push(out.color);
          heights.push(out.height);
          if (out.color < darkest.color) darkest = out;
        }
        expect(Math.max(...colors) - Math.min(...colors)).toBeGreaterThan(0.3);
        expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(0.08);
        // Overlap may legitimately hide part of a pale margin.
        for (let i = -8; i <= 8; i++) {
          const theta = i / 20;
          const margin = empty();
          sample(...f.point(frontRadius(1.24, theta, f.phase), theta), margin);
          if (margin.color <= 0.9) continue;
          expect(margin.color - darkest.color).toBeGreaterThan(0.3);
          expect(margin.roughness).toBeLessThan(darkest.roughness - 0.018);
          expect(margin.occlusion).toBeGreaterThan(0.95);
          visibleMargins++;
        }
      }
      expect(visibleMargins).toBeGreaterThan(2);
    }
  });

  it('opaque upper brackets hide lower front edges and their occlusion in actual overlaps', () => {
    const p = proceduralMaterialPresets.bracketfungus;
    for (const seed of seeds) {
      const sample = normalizedField('bracketfungus', seed);
      let overlaps = 0;
      for (let y = 0; y < p.cells; y++)
        for (let x = 0; x < p.cells - 1; x++) {
          const lower = fan(x, y, seed, 'bracketfungus'),
            upper = fan(x + 1, y, seed, 'bracketfungus');
          for (let i = 0; i <= 32; i++) {
            const theta = 0.6 + i / 64,
              point = lower.point(frontRadius(1.32, theta, lower.phase), theta),
              [a, b] = upper.local(...point),
              radius = Math.hypot(a, b),
              angle = Math.atan2(a, b),
              front =
                radius *
                (1 +
                  proceduralMaterialPresets.bracketfungus.lobe *
                    Math.cos(5 * angle + upper.phase) +
                  0.035 * Math.cos(9 * angle - upper.phase));
            if (radius < 0.32 || b / radius < 0.5 || front > 1.15) continue;
            const out = empty();
            sample(...point, out);
            expect(out.occlusion).toBeCloseTo(0.97, 12);
            expect(out.height).toBeGreaterThan(0.4);
            overlaps++;
          }
        }
      expect(overlaps).toBeGreaterThan(0);
    }
  });

  it.each(['mushroomgills', 'morel', 'bracketfungus'] as const)(
    '%s has common limiting slopes at actual supports, attachments, angular cuts and owner changes',
    (kind) => {
      for (const seed of seeds) {
        const sample = normalizedField(kind, seed),
          points: [number, number][] = [
            [0, 0],
            [0, 0.417],
            [0.391, 1],
          ];
        if (kind === 'morel') {
          const p = proceduralMaterialPresets.morel;
          const chambers = Array.from({ length: p.rows * p.columns }, (_, i) =>
            chamber(i % p.columns, Math.floor(i / p.columns), seed),
          );
          const dominanceAt = (u: number, v: number): number => {
            const column = Math.floor(u * p.columns),
              row = Math.floor(v * p.rows);
            let total = 0,
              squared = 0;
            for (let oy = -2; oy <= 2; oy++)
              for (let ox = -2; ox <= 2; ox++) {
                const cx = column + ox,
                  cy = row + oy,
                  wx = ((cx % p.columns) + p.columns) % p.columns,
                  wy = ((cy % p.rows) + p.rows) % p.rows,
                  weight = chambers[wy * p.columns + wx]!.weight(
                    u - (cx - wx) / p.columns,
                    v - (cy - wy) / p.rows,
                  );
                total += weight;
                squared += weight * weight;
              }
            return squared / (total * total);
          };
          for (let y = 0; y < p.rows; y++)
            for (let x = 0; x < p.columns; x++) {
              const a = chamber(x, y, seed),
                b = chamber((x + 1) % p.columns, y, seed),
                end = [...b.center];
              if (x === p.columns - 1) end[0] += 1;
              const shift = x === p.columns - 1 ? 1 : 0;
              let low = 0,
                high = 1;
              for (let i = 0; i < 48; i++) {
                const t = (low + high) / 2,
                  u = a.center[0] + (end[0] - a.center[0]) * t,
                  v = a.center[1] + (end[1] - a.center[1]) * t;
                if (a.weight(u, v) > b.weight(u - shift, v)) low = t;
                else high = t;
              }
              const t = (low + high) / 2;
              points.push(
                a.center,
                a.support(0),
                a.support(1.1),
                [x / p.columns, (y + 0.37) / p.rows],
                [(x + 0.41) / p.columns, y / p.rows],
                [
                  a.center[0] + (end[0] - a.center[0]) * t,
                  a.center[1] + (end[1] - a.center[1]) * t,
                ],
              );
              // Locate both bowl shoulders, rather than hoping a generic grid
              // happens to land on their derivative joins.
              const pointAt = (t: number): [number, number] => [
                a.center[0] + (end[0] - a.center[0]) * t,
                a.center[1] + (end[1] - a.center[1]) * t,
              ];
              for (const threshold of [0.48, 0.96])
                for (let segment = 0; segment < 32; segment++) {
                  let lo = segment / 32,
                    hi = (segment + 1) / 32;
                  const before = dominanceAt(...pointAt(lo)) - threshold,
                    after = dominanceAt(...pointAt(hi)) - threshold;
                  if (before * after > 0) continue;
                  for (let i = 0; i < 48; i++) {
                    const mid = (lo + hi) / 2;
                    if ((dominanceAt(...pointAt(mid)) - threshold) * before > 0)
                      lo = mid;
                    else hi = mid;
                  }
                  points.push(pointAt((lo + hi) / 2));
                }
            }
        } else {
          const p = proceduralMaterialPresets[kind];
          for (let y = 0; y < p.cells; y++)
            for (let x = 0; x < p.cells; x++) {
              const f = fan(x, y, seed, kind);
              points.push(
                f.point(0, 0),
                f.point(0.4, Math.PI),
                [x / p.cells, (y + 0.41) / p.cells],
                [(x + 0.37) / p.cells, y / p.cells],
              );
              for (const radius of [Math.sqrt(0.025), 0.3])
                points.push(f.point(radius, 0));
              for (const cosine of [0.2, 0.45])
                points.push(f.point(0.8, Math.acos(cosine)));
              if (kind === 'mushroomgills') {
                const p = proceduralMaterialPresets.mushroomgills;
                for (const radius of [p.shortStart, p.shortEnd, 1.22, 1.42])
                  points.push(f.point(radius, 0));
              } else {
                const p = proceduralMaterialPresets.bracketfungus;
                for (const theta of [-0.7, 0, 0.9])
                  for (const front of [p.marginStart, p.marginEnd, 1.27, 1.35])
                    points.push(
                      f.point(frontRadius(front, theta, f.phase), theta),
                    );
              }
            }
        }
        const center = empty(),
          left = empty(),
          right = empty(),
          coarseLeft = empty(),
          coarseRight = empty(),
          widerLeft = empty(),
          widerRight = empty();
        for (const [u, v] of points) {
          sample(u, v, center);
          for (const [du, dv] of [
            [1, 0],
            [0, 1],
            [0.6, 0.8],
          ]) {
            const step = 2e-7;
            sample(u - step * du, v - step * dv, left);
            sample(u + step * du, v + step * dv, right);
            sample(u - 4 * step * du, v - 4 * step * dv, coarseLeft);
            sample(u + 4 * step * du, v + 4 * step * dv, coarseRight);
            sample(u - 8 * step * du, v - 8 * step * dv, widerLeft);
            sample(u + 8 * step * du, v + 8 * step * dv, widerRight);
            for (const key of Object.keys(center) as (keyof SurfaceSample)[]) {
              const fine =
                  Math.abs(left[key] + right[key] - 2 * center[key]) / step,
                coarse =
                  Math.abs(
                    coarseLeft[key] + coarseRight[key] - 2 * center[key],
                  ) /
                  (4 * step),
                wider =
                  Math.abs(widerLeft[key] + widerRight[key] - 2 * center[key]) /
                  (8 * step);
              // A nearby C1 noise join can cancel one coarse second difference.
              // Two scales retain the convergence check without raising its tolerance.
              expect(fine).toBeLessThanOrEqual(
                0.4 * Math.max(coarse, wider) + 5e-8,
              );
            }
          }
        }
      }
    },
  );
});

describe('animal skin morphology', () => {
  const hash = (x: number, y: number, seed: number): number => {
    let n = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const field = (kind: ProceduralMaterialKind, seed: number) => {
    const sample = createSurfaceSampler(kind, seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  const follicle = (x: number, y: number, seed: number) => ({
    u: (x + 0.25 + 0.5 * hash(x, y, seed ^ 0x1b37)) / 6,
    v: (y + 0.25 + 0.5 * hash(x, y, seed ^ 0x4f91)) / 6,
    radius: (0.2 + 0.05 * hash(x, y, seed ^ 0x73a5)) / 6,
  });

  it.each([0, 1, 0xffffffff])(
    'elephant wrinkles are dark recessed lines amid broad flatter skin, seed %i',
    (seed) => {
      const at = field('elephanthide', seed);
      let dark = 0,
        flat = 0,
        darkHeight = 0,
        flatHeight = 0,
        darkAO = 0,
        flatAO = 0;
      for (let y = 0; y < 96; y++)
        for (let x = 0; x < 96; x++) {
          const p = at((x + 0.31) / 96, (y + 0.43) / 96);
          if (p.color < 0.35) {
            dark++;
            darkHeight += p.height;
            darkAO += p.occlusion;
          }
          if (p.color > 0.62) {
            flat++;
            flatHeight += p.height;
            flatAO += p.occlusion;
          }
        }
      expect(dark).toBeGreaterThan(300);
      expect(flat).toBeGreaterThan(3000);
      expect(flatHeight / flat - darkHeight / dark).toBeGreaterThan(0.0018);
      expect(flatAO / flat - darkAO / dark).toBeGreaterThan(0.15);
    },
  );

  it.each([0, 1, 0xffffffff])(
    'ostrich follicles have a recessed center and raised rosette collar above fine grain, seed %i',
    (seed) => {
      const at = field('ostrichleather', seed);
      for (let y = 0; y < 6; y++)
        for (let x = 0; x < 6; x++) {
          const p = follicle(x, y, seed),
            center = at(p.u, p.v);
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4,
              collar = at(
                p.u + 0.68 * p.radius * Math.cos(angle),
                p.v + 0.68 * p.radius * Math.sin(angle),
              ),
              background = at(
                p.u + 1.05 * p.radius * Math.cos(angle),
                p.v + 1.05 * p.radius * Math.sin(angle),
              );
            expect(collar.height - background.height).toBeGreaterThan(0.0004);
            expect(background.height - center.height).toBeGreaterThan(0.0004);
            expect(collar.color - center.color).toBeGreaterThan(0.2);
            expect(background.occlusion - center.occlusion).toBeGreaterThan(
              0.15,
            );
          }
        }
    },
  );

  it.each([0, 1, 0xffffffff])(
    'shark denticles carry three lengthwise keels and opaque overlap shading, seed %i',
    (seed) => {
      const at = field('sharkskin', seed);
      for (const row of [0, 1, 23])
        for (const column of [0, 7, 17]) {
          const shift = (row % 2) * 0.5,
            width = 0.39 + 0.04 * hash(column, row, seed ^ 0x3d67);
          for (const dy of [-0.12, 0, 0.12]) {
            const w = width * (1 - (0.45 * dy) / 0.78);
            for (const keel of [-0.48, 0, 0.48]) {
              const peak = at(
                  (column + shift + 0.5 + keel * w) / 18,
                  (row + 0.5 + dy) / 24,
                ),
                trough = at(
                  (column +
                    shift +
                    0.5 +
                    (keel + (keel > 0 ? -0.24 : 0.24)) * w) /
                    18,
                  (row + 0.5 + dy) / 24,
                );
              expect(peak.height - trough.height).toBeGreaterThan(0.000045);
            }
          }
          const upstream = at((column + shift + 0.87) / 18, (row + 0.25) / 24),
            downstream = at((column + shift + 0.87) / 18, (row + 0.75) / 24);
          expect(upstream.height - downstream.height).toBeGreaterThan(0.0002);
        }
      // The upper row is fully opaque here while a lower trailing rim remains
      // geometrically underneath. AO must equal the upper face, not a rim sum.
      const t = -0.5 / 0.78,
        width = (0.39 + 0.04 * hash(0, 1, seed ^ 0x3d67)) * (1 - 0.45 * t),
        q = (-0.3 / width) ** 2 + t * t,
        s = Math.max(0, Math.min(1, (q - 0.56) / 0.2));
      expect(q).toBeLessThan(0.78);
      expect(at(0.7 / 18, 1 / 24).occlusion).toBeCloseTo(
        0.98 - 0.07 * s * s * (3 - 2 * s),
        12,
      );
    },
  );

  it.each(['elephanthide', 'ostrichleather', 'sharkskin'] as const)(
    '%s has C1 scalar fields at actual shoulders, support and lookup boundaries',
    (kind) => {
      for (const seed of [0, 1, 0xffffffff]) {
        const at = field(kind, seed),
          points: [number, number][] = [];
        for (let i = 0; i <= 96; i++)
          points.push([i / 96, 0.391], [0.617, i / 96]);
        if (kind === 'ostrichleather')
          for (const x of [0, 5])
            for (const y of [0, 5]) {
              const p = follicle(x, y, seed);
              for (const r of [0, Math.sqrt(0.12), Math.sqrt(0.8), 1])
                for (let i = 0; i < 16; i++)
                  points.push([
                    p.u + r * p.radius * Math.cos((i * Math.PI) / 8),
                    p.v + r * p.radius * Math.sin((i * Math.PI) / 8),
                  ]);
            }
        if (kind === 'sharkskin')
          for (const row of [0, 1, 23])
            for (const column of [0, 17]) {
              const width = 0.39 + 0.04 * hash(column, row, seed ^ 0x3d67);
              for (const q of [0.56, 0.76, 0.78, 1])
                for (let i = 0; i < 16; i++) {
                  const t = Math.sqrt(q) * Math.sin((i * Math.PI) / 8),
                    dx =
                      Math.sqrt(q) *
                      Math.cos((i * Math.PI) / 8) *
                      width *
                      (1 - 0.45 * t);
                  points.push([
                    (column + (row % 2) * 0.5 + 0.5 + dx) / 18,
                    (row + 0.5 + 0.78 * t) / 24,
                  ]);
                }
            }
        const epsilon = 1e-7;
        for (const [u, v] of points)
          for (const [du, dv] of [
            [epsilon, 0],
            [0, epsilon],
          ]) {
            const center = at(u, v),
              left = at(u - du!, v - dv!),
              right = at(u + du!, v + dv!),
              halfLeft = at(u - du! / 2, v - dv! / 2),
              halfRight = at(u + du! / 2, v + dv! / 2);
            for (const key of Object.keys(center) as (keyof SurfaceSample)[]) {
              expect(Number.isFinite(center[key])).toBe(true);
              expect(center[key]).toBeGreaterThanOrEqual(0);
              expect(center[key]).toBeLessThanOrEqual(1);
              expect(
                Math.abs(
                  4 * (halfLeft[key] + halfRight[key]) -
                    left[key] -
                    right[key] -
                    6 * center[key],
                ) / epsilon,
              ).toBeLessThan(0.001);
            }
          }
      }
    },
  );
});

class TestImageData {
  readonly data: Uint8ClampedArray;
  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.data = new Uint8ClampedArray(width * height * 4);
  }
}

const decoded: {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
  close: Mock;
}[] = [];
let failAt = -1;
let oversizedAt = -1;

beforeEach(() => {
  decoded.length = 0;
  failAt = oversizedAt = -1;
  vi.stubGlobal('ImageData', TestImageData);
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async (image: TestImageData) => {
      if (decoded.length === failAt) throw new Error('late decode failure');
      const bitmap = {
        width: decoded.length === oversizedAt ? 100000 : image.width,
        height: image.height,
        pixels: image.data.slice(),
        close: vi.fn(),
      };
      decoded.push(bitmap);
      return bitmap;
    }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('municipal surface morphology', () => {
  const seeds = [0, 1, 0xffffffff];
  const field = (kind: ProceduralMaterialKind, seed: number) => {
    const sample = createSurfaceSampler(kind, seed);
    return (u: number, v: number): SurfaceSample => {
      const out = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      sample(u, v, out);
      return out;
    };
  };
  it.each(seeds)(
    'tactile paving has flat dome crowns, tile joints and subordinate grain, seed %i',
    (seed) => {
      const at = field('tactilepaving', seed),
        relief = proceduralMaterialPresets.tactilepaving.relief;
      for (let y = 0; y < 6; y++)
        for (let x = 0; x < 6; x++) {
          const u = (x + 0.5) / 6,
            v = (y + 0.5) / 6,
            crown = at(u, v),
            plateau = at(u + 0.15 / 6, v),
            shoulder = at(u + 0.28 / 6, v),
            floor = at(u + 0.4 / 6, v);
          expect(Math.abs(crown.height - plateau.height)).toBeLessThan(
            0.009 * relief,
          );
          expect(crown.height).toBeGreaterThan(shoulder.height);
          expect(shoulder.height).toBeGreaterThan(floor.height);
          expect(crown.height - floor.height).toBeGreaterThan(0.54 * relief);
          expect(crown.metallic).toBe(0);
        }
      const joint = at(0.5, 0.25),
        tile = at(0.46, 0.25);
      expect(tile.height - joint.height).toBeGreaterThan(0.1 * relief);
      expect(tile.color).toBeGreaterThan(joint.color + 0.3);
      expect(tile.occlusion).toBeGreaterThan(joint.occlusion);
    },
  );
  it.each(seeds)(
    'road bands retain coherent paint loss above rough dark asphalt, seed %i',
    (seed) => {
      const at = field('roadmarking', seed),
        relief = proceduralMaterialPresets.roadmarking.relief;
      let intact = 0,
        lost = 0,
        connected = 0;
      for (let y = 0; y < 96; y++)
        for (let x = 0; x < 96; x++) {
          const u = (x + 0.5) / 96,
            v = (y + 0.5) / 96,
            out = at(u, v);
          expect(out.metallic).toBe(0);
          if (out.color > 0.86) {
            expect(out.height).toBeGreaterThan(0.31 * relief);
            expect(out.roughness).toBeLessThan(0.73);
            intact++;
          }
          if (Math.abs(((u * 2) % 1) - 0.5) < 0.24 && out.color < 0.17) {
            expect(out.height).toBeLessThan(0.25 * relief);
            expect(out.roughness).toBeGreaterThan(0.88);
            lost++;
            if (at(u, v + 1 / 192).color < 0.2) connected++;
          }
        }
      expect(intact).toBeGreaterThan(400);
      expect(lost).toBeGreaterThan(100);
      expect(connected).toBeGreaterThan(lost * 0.65);
      // Both long unpainted corridors remain asphalt, unlike zebra/fine line motifs.
      for (let y = 0; y < 20; y++)
        for (const u of [0, 0.5])
          expect(at(u, y / 20).color).toBeLessThan(0.17);
    },
  );
  it.each(seeds)(
    'drain has elongated recesses, rounded ends, metal bars, frame and crossbrace, seed %i',
    (seed) => {
      const at = field('draincover', seed);
      for (let i = 0; i < 6; i++) {
        const u = 0.15 + i * 0.14,
          slot = at(u, 0.35),
          end = at(u, 0.22),
          frame = at(u, 0.14),
          brace = at(u, 0.5),
          bar = at(u + 0.065, 0.35);
        for (const face of [frame, brace, bar]) {
          expect(face.metallic).toBe(1);
          expect(face.height).toBeGreaterThan(slot.height);
          expect(face.color).toBeGreaterThan(slot.color + 0.4);
          expect(face.occlusion).toBeGreaterThan(slot.occlusion);
          expect(face.roughness).toBeLessThan(slot.roughness);
        }
        expect(slot.metallic).toBe(0);
        expect(at(u, 0.65).metallic).toBe(0);
        expect(end.metallic).toBeGreaterThan(0);
        expect(end.metallic).toBeLessThan(1);
        expect(at(u + 0.04, 0.35).metallic).toBeGreaterThan(slot.metallic);
      }
    },
  );
  it.each(['tactilepaving', 'roadmarking', 'draincover'] as const)(
    '%s keeps all fields bounded C1 at actual centers, supports, shoulders and owner joins',
    (kind) => {
      for (const seed of seeds) {
        const at = field(kind, seed),
          points: [number, number][] = [];
        // Cached grain lattice boundaries and periodic seams, including corners.
        for (let i = 0; i <= 96; i++)
          points.push([i / 96, 0.391], [0.617, i / 96], [i / 96, i / 96]);
        if (kind === 'tactilepaving') {
          for (let x = 0; x < 6; x++)
            for (let y = 0; y < 6; y++)
              for (const r of [0, 0.2, 0.34])
                for (let i = 0; i < 8; i++)
                  points.push([
                    (x + 0.5 + r * Math.cos((i * Math.PI) / 4)) / 6,
                    (y + 0.5 + r * Math.sin((i * Math.PI) / 4)) / 6,
                  ]);
          for (const q of [
            0,
            0.5 - 0.49,
            0.5 - 0.455,
            0.5,
            0.5 + 0.455,
            0.5 + 0.49,
            1,
          ])
            points.push([q / 2, 0.25], [0.25, q / 2], [q / 2, q / 2]);
        } else if (kind === 'draincover') {
          for (const x of [0, 0.43, 0.46])
            for (const y of [0, 0.035, 0.055, 0.25, 0.4, 0.43])
              for (const s of [-1, 1]) points.push([0.5 + s * x, 0.5 + s * y]);
          for (let slot = 0; slot < 6; slot++) {
            const u = 0.15 + slot * 0.14;
            for (const y of [
              0.25, 0.35, 0.445, 0.465, 0.5, 0.535, 0.555, 0.65, 0.75,
            ])
              for (const r of [0, 0.026, 0.042])
                points.push([u + r, y], [u - r, y]);
            for (const cy of [0.25, 0.75])
              for (const r of [0.026, 0.042])
                for (let i = 0; i < 16; i++) {
                  const angle = (i * Math.PI) / 8;
                  if ((cy === 0.25 ? -1 : 1) * Math.sin(angle) >= 0)
                    points.push([
                      u + r * Math.cos(angle),
                      cy + r * Math.sin(angle),
                    ]);
                }
          }
        } else {
          for (const q of [0, 0.2, 0.24, 0.5, 0.76, 0.8, 1])
            points.push([q / 2, 0.37], [(1 + q) / 2, 0.63]);
          // Solve the actual seeded wear clamp shoulders on lattice edges.
          const hash = (x: number, y: number): number => {
            let n =
              (seed ^
                0x63d1 ^
                Math.imul(x, 0x9e3779b1) ^
                Math.imul(y, 0x85ebca6b)) >>>
              0;
            n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
            n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
            return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
          };
          for (let y = 0; y < 20; y++)
            for (let x = 0; x < 12; x++) {
              points.push([x / 12, y / 20]);
              const a = hash(x, y),
                b = hash((x + 1) % 12, y);
              for (const threshold of [0.36, 0.56]) {
                if ((a - threshold) * (b - threshold) >= 0) continue;
                let lo = 0,
                  hi = 1;
                const target = (threshold - a) / (b - a);
                for (let i = 0; i < 48; i++) {
                  const t = (lo + hi) / 2;
                  if (t * t * (3 - 2 * t) < target) lo = t;
                  else hi = t;
                }
                points.push([(x + (lo + hi) / 2) / 12, y / 20]);
              }
            }
        }
        for (const [u, v] of points) {
          const center = at(u, v);
          for (const key of Object.keys(center) as (keyof SurfaceSample)[]) {
            expect(Number.isFinite(center[key])).toBe(true);
            expect(center[key]).toBeGreaterThanOrEqual(0);
            expect(center[key]).toBeLessThanOrEqual(1);
          }
          for (const [du, dv] of [
            [1, 0],
            [0, 1],
            [0.6, 0.8],
          ]) {
            const h = 1e-7,
              left = at(u - du * h, v - dv * h),
              right = at(u + du * h, v + dv * h),
              coarseLeft = at(u - du * 4 * h, v - dv * 4 * h),
              coarseRight = at(u + du * 4 * h, v + dv * 4 * h);
            for (const key of Object.keys(center) as (keyof SurfaceSample)[]) {
              const fine =
                  Math.abs(left[key] + right[key] - 2 * center[key]) / h,
                coarse =
                  Math.abs(
                    coarseLeft[key] + coarseRight[key] - 2 * center[key],
                  ) /
                  (4 * h);
              expect(fine).toBeLessThanOrEqual(0.4 * coarse + 1e-6);
            }
          }
        }
      }
    },
  );
});

describe('periodic procedural material fields', () => {
  describe('tree bark morphology', () => {
    const treeKinds = ['birchbark', 'palmtrunk', 'sycamorebark'] as const;
    const seeds = [0, 1, 0xffffffff];
    const keys = ['color', 'height', 'roughness', 'occlusion'] as const;
    const field = (kind: ProceduralMaterialKind, seed: number) => {
      const sample = createSurfaceSampler(kind, seed);
      return (u: number, v: number): SurfaceSample => {
        const out = {
          color: 0,
          height: 0,
          roughness: 0,
          occlusion: 0,
          mortar: 0,
          metallic: 0,
        };
        sample(u, v, out);
        return out;
      };
    };
    // Locate primitive geometry without reproducing expected surface values.
    const hash = (x: number, y: number, seed: number): number => {
      let n =
        (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
      n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
      n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    const scarCenter = (u: number, y: number, seed: number): number => {
      const phase = 2 * Math.PI * hash(0, y, seed ^ 0x41d7);
      return (
        (y + 0.2 + 0.6 * hash(0, y, seed ^ 0x17a9)) / 9 +
        0.006 * Math.sin(2 * Math.PI * u + phase) +
        0.003 * Math.sin(6 * Math.PI * u + phase)
      );
    };

    it('birch has short horizontal dark lenticels with recessed, occluded centers', () => {
      for (const seed of seeds) {
        const at = field('birchbark', seed);
        let recessed = 0,
          horizontal = 0;
        const lengths: number[] = [];
        for (let y = 0; y < 10; y++)
          for (let x = 0; x < 7; x++) {
            const u = (x + 0.25 + 0.5 * hash(x, y, seed ^ 0x19d3)) / 7,
              v = (y + 0.25 + 0.5 * hash(x, y, seed ^ 0x67b9)) / 10,
              center = at(u, v),
              paper = at(u, v + 0.022),
              along = at(u + 0.012, v),
              across = at(u, v + 0.012);
            if (
              paper.color - center.color > 0.4 &&
              paper.height - center.height >
                0.025 * proceduralMaterialPresets.birchbark.relief &&
              paper.occlusion - center.occlusion > 0.09
            )
              recessed++;
            if (across.color - along.color > 0.25) horizontal++;
            let width = 0;
            for (let i = -40; i <= 40; i++)
              if (at(u + i / 1000, v).color < 0.65) width++;
            lengths.push(width);
          }
        expect(recessed).toBeGreaterThan(60);
        expect(horizontal).toBeGreaterThan(55);
        expect(Math.max(...lengths) - Math.min(...lengths)).toBeGreaterThan(8);
        let pale = 0;
        for (let y = 0; y < 80; y++)
          for (let x = 0; x < 80; x++)
            if (at(x / 80, y / 80).color > 0.8) pale++;
        expect(pale / 6400).toBeGreaterThan(0.65);
      }
    });

    it('palm has many irregular transverse recesses and raised shoulders over longitudinal fibers', () => {
      for (const seed of seeds) {
        const at = field('palmtrunk', seed),
          gaps: number[] = [];
        let profiles = 0,
          bands = 0,
          inside = false;
        for (let y = 0; y < 9; y++) {
          const v = scarCenter(0.37, y, seed),
            recess = at(0.37, v),
            shoulder = at(0.37, v + 0.018);
          if (
            shoulder.height - recess.height >
              0.13 * proceduralMaterialPresets.palmtrunk.relief &&
            shoulder.color - recess.color > 0.2 &&
            shoulder.occlusion - recess.occlusion > 0.1
          )
            profiles++;
          gaps.push((scarCenter(0.37, (y + 1) % 9, seed) - v + 1) % 1);
        }
        expect(profiles).toBeGreaterThanOrEqual(7);
        expect(Math.max(...gaps) - Math.min(...gaps)).toBeGreaterThan(0.01);
        for (let i = 0; i <= 2048; i++) {
          const dark = at(0.37, i / 2048).occlusion < 0.9;
          if (dark && !inside) bands++;
          inside = dark;
        }
        expect(bands).toBeGreaterThanOrEqual(8);
        let across = 0,
          along = 0,
          count = 0;
        for (let y = 0; y < 64; y++)
          for (let x = 0; x < 64; x++) {
            const u = x / 64,
              v = y / 64,
              a = at(u, v),
              b = at(u + 1 / 512, v),
              c = at(u, v + 1 / 512);
            let quiet = true;
            for (let ring = 0; ring < 9; ring++) {
              const delta = v - scarCenter(u, ring, seed),
                dy = delta - Math.floor(delta + 0.5);
              if (dy > -0.015 && dy < 0.035) quiet = false;
            }
            if (!quiet) continue;
            across += Math.abs(a.height - b.height);
            along += Math.abs(a.height - c.height);
            count++;
          }
        expect(count).toBeGreaterThan(1000);
        expect(across).toBeGreaterThan(along * 1.5);
      }
    });

    it('sycamore forms broad multitone exfoliating patches with shallow edges rather than deep grout', () => {
      for (const seed of seeds) {
        const at = field('sycamorebark', seed),
          tones = new Set<number>();
        let low = Infinity,
          high = -Infinity,
          minHeight = Infinity,
          maxHeight = -Infinity,
          nearby = 0,
          distant = 0,
          edgeShading = 0;
        for (let y = 0; y < 80; y++)
          for (let x = 0; x < 80; x++) {
            const u = x / 80,
              v = y / 80,
              a = at(u, v);
            low = Math.min(low, a.color);
            high = Math.max(high, a.color);
            minHeight = Math.min(minHeight, a.height);
            maxHeight = Math.max(maxHeight, a.height);
            tones.add(Math.floor(a.color * 5));
            nearby += Math.abs(a.color - at(u + 0.01, v + 0.01).color);
            distant += Math.abs(a.color - at(u + 0.12, v + 0.12).color);
            if (a.occlusion < 0.995) edgeShading++;
            expect(a.occlusion).toBeGreaterThan(0.94);
          }
        expect(high - low).toBeGreaterThan(0.4);
        expect(tones.size).toBeGreaterThanOrEqual(4);
        expect(distant).toBeGreaterThan(nearby * 3);
        expect(maxHeight - minHeight).toBeGreaterThan(
          0.015 * proceduralMaterialPresets.sycamorebark.relief,
        );
        expect(maxHeight - minHeight).toBeLessThan(
          0.08 * proceduralMaterialPresets.sycamorebark.relief,
        );
        expect(edgeShading).toBeGreaterThan(100);
      }
    });

    it('keeps endpoint-seeded sycamore pigment inside the unclipped range', () => {
      // This seed makes the tone lattice at (0, 0) reach hash's inclusive upper endpoint.
      const at = field('sycamorebark', 3589914215);
      let darkest = Infinity,
        lightest = -Infinity;
      for (let y = 0; y < 64; y++)
        for (let x = 0; x < 64; x++) {
          const color = at(x / 64, y / 64).color;
          darkest = Math.min(darkest, color);
          lightest = Math.max(lightest, color);
        }
      expect(darkest).toBeGreaterThan(0);
      expect(lightest).toBeLessThan(1);
    });

    it('hides an underlying peel rim beneath a fully covering sycamore patch', () => {
      // The last visible lobe fully covers an older peel rim at this point.
      expect(field('sycamorebark', 7)(13 / 64, 0).occlusion).toBe(1);
    });

    it.each(treeKinds)(
      '%s is C1 at actual supports, shoulders, lookup joins and periodic seams',
      (kind) => {
        for (const seed of seeds) {
          const at = field(kind, seed),
            points: [number, number][] = [
              [0, 0],
              [0, 0.371],
              [0.619, 0],
              [1, 1],
            ];
          for (let i = 0; i <= 64; i++)
            points.push([i / 64, 0.413], [0.617, i / 64]);
          if (kind === 'palmtrunk') {
            for (let y = 0; y < 9; y++)
              for (const u of [0, 0.37, 0.83]) {
                points.push([u, y / 9]);
                const v = scarCenter(u, y, seed),
                  width = 0.006 + 0.005 * hash(0, y, seed ^ 0x69b3);
                for (const offset of [
                  -width,
                  0,
                  width,
                  0.005,
                  0.018,
                  0.031,
                  0.5,
                ])
                  points.push([u, v + offset]);
              }
          } else {
            const birch = kind === 'birchbark',
              columns = birch ? 7 : 4,
              rows = birch ? 10 : 4;
            for (const x of [0, 1, columns - 1])
              for (const y of [0, 1, rows - 1]) {
                const cx = x + 0.25 + 0.5 * hash(x, y, seed ^ 0x19d3),
                  cy = y + 0.25 + 0.5 * hash(x, y, seed ^ 0x67b9),
                  rx =
                    (birch ? 0.2 : 0.72) +
                    (birch ? 0.23 : 0.13) * hash(x, y, seed ^ 0x43a1),
                  ry =
                    (birch ? 0.035 : 0.72) +
                    (birch ? 0.04 : 0.13) * hash(x, y, seed ^ 0x75d1),
                  phase = 2 * Math.PI * hash(x, y, seed ^ 0x39b7);
                points.push(
                  [cx / columns, cy / rows],
                  [x / columns, cy / rows],
                  [cx / columns, y / rows],
                );
                // Solve the true modulated lobe support/inner shoulder on rays.
                for (let k = 0; k < 8; k++)
                  for (const target of [birch ? 0.25 : 0.76, 1]) {
                    const a = Math.cos((k * Math.PI) / 4),
                      b = Math.sin((k * Math.PI) / 4);
                    let lo = 0,
                      hi = 1.2;
                    for (let i = 0; i < 45; i++) {
                      const r = (lo + hi) / 2,
                        dx = rx * a * r,
                        dy = ry * b * r,
                        q =
                          r *
                          r *
                          (birch
                            ? 1
                            : 1 +
                              0.16 *
                                Math.sin(5 * dx + phase) *
                                Math.sin(6 * dy - phase));
                      if (q < target) lo = r;
                      else hi = r;
                    }
                    const r = (lo + hi) / 2;
                    points.push([
                      (cx + rx * a * r) / columns,
                      (cy + ry * b * r) / rows,
                    ]);
                  }
              }
          }
          for (const [u, v] of points)
            for (const [du, dv] of [
              [1, 0],
              [0, 1],
              [0.6, 0.8],
            ]) {
              const center = at(u, v),
                h = 1e-7,
                left = at(u - du * h, v - dv * h),
                right = at(u + du * h, v + dv * h),
                coarseLeft = at(u - 4 * du * h, v - 4 * dv * h),
                coarseRight = at(u + 4 * du * h, v + 4 * dv * h);
              for (const key of keys) {
                const fine =
                    Math.abs(left[key] + right[key] - 2 * center[key]) / h,
                  coarse =
                    Math.abs(
                      coarseLeft[key] + coarseRight[key] - 2 * center[key],
                    ) /
                    (4 * h);
                // Includes cancellation/periodic wrapping roundoff near zero.
                // A true jump or cusp does not converge under step refinement.
                expect(fine).toBeLessThanOrEqual(0.4 * coarse + 1e-6);
              }
            }
        }
      },
    );
  });
  describe('petal surface morphology', () => {
    const petalKinds = ['rosepetal', 'lilypetal', 'fritillarypetal'] as const;
    const field = (kind: ProceduralMaterialKind, seed: number) => {
      const sample = createSurfaceSampler(kind, seed);
      return (u: number, v: number): SurfaceSample => {
        const out: SurfaceSample = {
          color: 0,
          height: 0,
          roughness: 0,
          occlusion: 0,
          mortar: 0,
          metallic: 0,
        };
        sample(u, v, out);
        return out;
      };
    };
    // Locate primitive geometry, not expected field values. Assertions below
    // measure the public sampler's relief, pigmentation and limiting slopes.
    const geometryHash = (x: number, y: number, seed: number): number => {
      let n =
        (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
      n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
      n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    const markPoint = (
      rose: boolean,
      seed: number,
      x: number,
      y: number,
      across: number,
      along: number,
    ): [number, number] => {
      const angle =
          (rose ? 1 : 0.22) * (geometryHash(x, y, seed ^ 0x59c3) - 0.5),
        width = rose ? 0.38 + 0.07 * geometryHash(x, y, seed ^ 0x6d13) : 0.13,
        length = rose ? 0.38 + 0.07 * geometryHash(x, y, seed ^ 0x1b57) : 0.43,
        px =
          x +
          (rose ? 0.3 : 0.15) +
          (rose ? 0.4 : 0.7) * geometryHash(x, y, seed ^ 0x31a7),
        py =
          y +
          (rose ? 0.3 : 0.15) +
          (rose ? 0.4 : 0.7) * geometryHash(x, y, seed ^ 0x47e9);
      return [
        (px +
          across * width * Math.cos(angle) -
          along * length * Math.sin(angle)) /
          (rose ? 48 : 9),
        (py +
          across * width * Math.sin(angle) +
          along * length * Math.cos(angle)) /
          (rose ? 48 : 7),
      ];
    };
    const checkC1 = (
      at: (u: number, v: number) => SurfaceSample,
      points: readonly [number, number][],
    ) => {
      for (const [u, v] of points) {
        const center = at(u, v);
        for (const [du, dv] of [
          [1, 0],
          [0, 1],
          [0.6, 0.8],
        ]) {
          const h = 1e-7,
            left = at(u - du * h, v - dv * h),
            right = at(u + du * h, v + dv * h),
            coarseLeft = at(u - du * 4 * h, v - dv * 4 * h),
            coarseRight = at(u + du * 4 * h, v + dv * 4 * h);
          for (const key of [
            'color',
            'height',
            'roughness',
            'occlusion',
          ] as const) {
            const fine = Math.abs(left[key] + right[key] - 2 * center[key]) / h,
              coarse =
                Math.abs(coarseLeft[key] + coarseRight[key] - 2 * center[key]) /
                (4 * h);
            expect(fine).toBeLessThanOrEqual(0.4 * coarse + 1e-6);
          }
        }
        for (const key of [
          'color',
          'height',
          'roughness',
          'occlusion',
        ] as const) {
          expect(at(u + 1, v)[key]).toBeCloseTo(center[key], 10);
          expect(at(u, v - 1)[key]).toBeCloseTo(center[key], 10);
        }
      }
    };

    it('rose carries small rounded raised papillae over broad continuous folds', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const at = field('rosepetal', seed);
        let cap = 0,
          broadMin = Infinity,
          broadMax = -Infinity;
        for (let y = 0; y < 12; y++)
          for (let x = 0; x < 12; x++) {
            const center = markPoint(true, seed, x * 4, y * 4, 0, 0);
            let rim = 0;
            for (const [a, b] of [
              [-1, 0],
              [1, 0],
              [0, -1],
              [0, 1],
            ]) {
              const p = markPoint(true, seed, x * 4, y * 4, a, b);
              rim += at(...p).height / 4;
            }
            const sample = at(...center);
            cap += sample.height - rim;
            broadMin = Math.min(broadMin, rim);
            broadMax = Math.max(broadMax, rim);
            expect(sample.roughness).toBeGreaterThan(0.85);
          }
        // Fine caps are raised rather than pore-like, and remain subordinate
        // to the broad flowing petal folds.
        expect(cap / 144).toBeGreaterThan(
          0.025 * proceduralMaterialPresets.rosepetal.relief,
        );
        expect(cap / 144).toBeLessThan(
          0.065 * proceduralMaterialPresets.rosepetal.relief,
        );
        expect(broadMax - broadMin).toBeGreaterThan(
          0.16 * proceduralMaterialPresets.rosepetal.relief,
        );
      }
    });

    it.each([1, 123, 0xffffffff])(
      'lily pigment spots are elongated, varied and not carved holes (seed %i)',
      (seed) => {
        const at = field('lilypetal', seed);
        let acrossEnergy = 0,
          alongEnergy = 0,
          ribAcross = 0,
          ribAlong = 0,
          darkHeight = 0,
          paleHeight = 0,
          darkArea = 0,
          paleArea = 0,
          darkestOcclusion = 1,
          maximumRoughness = 0;
        for (let y = 0; y < 160; y++)
          for (let x = 0; x < 160; x++) {
            const u = x / 160,
              v = y / 160,
              p = at(u, v),
              left = at(u - 0.001, v),
              right = at(u + 0.001, v),
              below = at(u, v - 0.001),
              above = at(u, v + 0.001),
              dx = right.color - left.color,
              dy = above.color - below.color;
            ribAcross += (right.height - left.height) ** 2;
            ribAlong += (above.height - below.height) ** 2;
            acrossEnergy += dx * dx;
            alongEnergy += dy * dy;
            if (p.color < 0.6) {
              darkHeight += p.height;
              darkArea++;
              darkestOcclusion = Math.min(darkestOcclusion, p.occlusion);
            } else if (p.color > 0.93) {
              paleHeight += p.height;
              paleArea++;
            }
            maximumRoughness = Math.max(maximumRoughness, p.roughness);
          }
        expect(darkestOcclusion).toBeGreaterThan(0.98);
        expect(maximumRoughness).toBeLessThan(0.55);
        expect(darkArea / (160 * 160)).toBeGreaterThan(0.01);
        expect(paleArea / (160 * 160)).toBeGreaterThan(0.5);
        expect(acrossEnergy).toBeGreaterThan(4 * alongEnergy);
        expect(ribAcross).toBeGreaterThan(20 * ribAlong);
        expect(
          Math.abs(darkHeight / darkArea - paleHeight / paleArea),
        ).toBeLessThan(0.012 * proceduralMaterialPresets.lilypetal.relief);
        const centerTones = [];
        for (let x = 0; x < 9; x++)
          centerTones.push(at(...markPoint(false, seed, x, 0, 0, 0)).color);
        expect(
          Math.max(...centerTones) - Math.min(...centerTones),
        ).toBeGreaterThan(0.05);
      },
    );

    it('fritillary alternates purple and cream in both directions without checker relief', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const at = field('fritillarypetal', seed);
        let across = 0,
          along = 0,
          repeatedAcross = 0,
          repeatedAlong = 0,
          ribAcross = 0,
          ribAlong = 0,
          minHeight = Infinity,
          maxHeight = -Infinity;
        for (let y = 0; y < 64; y++)
          for (let x = 0; x < 64; x++) {
            const u = x / 64,
              v = y / 64,
              p = at(u, v),
              tone = p.color - 0.52;
            across += tone * (at(u + 1 / 6, v).color - 0.52);
            along += tone * (at(u, v + 1 / 8).color - 0.52);
            repeatedAcross += tone * (at(u + 1 / 3, v).color - 0.52);
            repeatedAlong += tone * (at(u, v + 1 / 4).color - 0.52);
            ribAcross +=
              (at(u + 0.001, v).height - at(u - 0.001, v).height) ** 2;
            ribAlong +=
              (at(u, v + 0.001).height - at(u, v - 0.001).height) ** 2;
            minHeight = Math.min(minHeight, p.height);
            maxHeight = Math.max(maxHeight, p.height);
            expect(p.occlusion).toBeGreaterThan(0.98);
          }
        expect(across).toBeLessThan(0);
        expect(along).toBeLessThan(0);
        expect(repeatedAcross).toBeGreaterThan(0);
        expect(repeatedAlong).toBeGreaterThan(0);
        expect(ribAcross).toBeGreaterThan(20 * ribAlong);
        expect(maxHeight - minHeight).toBeLessThan(
          0.07 * proceduralMaterialPresets.fritillarypetal.relief,
        );
        // Along a longitudinal rib pigment crosses multiple cells, but no
        // matching dark trench or checker-height step appears.
        for (const u of [0.17, 0.43, 0.79]) {
          let minColor = Infinity,
            maxColor = -Infinity,
            low = Infinity,
            high = -Infinity;
          for (let y = 0; y < 128; y++) {
            const p = at(u, y / 128);
            minColor = Math.min(minColor, p.color);
            maxColor = Math.max(maxColor, p.color);
            low = Math.min(low, p.height);
            high = Math.max(high, p.height);
          }
          expect(maxColor - minColor).toBeGreaterThan(0.6);
          expect(high - low).toBeLessThan(
            0.05 * proceduralMaterialPresets.fritillarypetal.relief,
          );
        }
      }
    });

    it.each(petalKinds)(
      '%s is C1 at actual mark centers, supports, margins and toroidal seams',
      (kind) => {
        for (const seed of [1, 123, 0xffffffff]) {
          const at = field(kind, seed),
            points: [number, number][] = [
              [0, 0],
              [0, 0.371],
              [0.629, 0],
              [1, 1],
            ];
          if (kind !== 'fritillarypetal') {
            const rose = kind === 'rosepetal',
              columns = rose ? 48 : 9,
              rows = rose ? 48 : 7;
            for (const x of [0, 1, columns - 1])
              for (const y of [0, 1, rows - 1]) {
                for (const [a, b] of [
                  [0, 0],
                  [-1, 0],
                  [1, 0],
                  [0, -1],
                  [0, 1],
                  [0.5, 0],
                  [0, 0.5],
                ])
                  points.push(markPoint(rose, seed, x, y, a, b));
                points.push(
                  [x / columns, (y + 0.4) / rows],
                  [(x + 0.4) / columns, y / rows],
                );
              }
          } else {
            // Find actual wandering pigment margins from observed tone crossings,
            // rather than assuming a rigid checker grid.
            for (const axis of [0, 1])
              for (const fixed of [0, 0.13, 0.37, 0.69, 0.91]) {
                const tone = (t: number) =>
                  (axis === 0 ? at(t, fixed) : at(fixed, t)).color - 0.52;
                for (let i = 0; i < 128; i++) {
                  let lo = i / 128,
                    hi = (i + 1) / 128;
                  if (tone(lo) * tone(hi) >= 0) continue;
                  for (let j = 0; j < 35; j++) {
                    const mid = (lo + hi) / 2;
                    if (tone(lo) * tone(mid) <= 0) hi = mid;
                    else lo = mid;
                  }
                  points.push(
                    axis === 0
                      ? [(lo + hi) / 2, fixed]
                      : [fixed, (lo + hi) / 2],
                  );
                }
              }
          }
          // Cached-noise lattice joins also enter color/roughness and warped margins.
          for (const t of [0.25, 0.5, 0.75])
            points.push([t, 0.391], [0.617, t], [t, t]);
          checkC1(at, points);
        }
      },
    );
  });
  describe('reticulated and bristled fruit skins', () => {
    const fruitKinds = ['cantaloupe', 'dragonfruit', 'kiwiskin'] as const;
    const hash = (x: number, y: number, seed: number): number => {
      let n =
        (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
      n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
      n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    const field = (kind: ProceduralMaterialKind, seed: number) => {
      const sample = createSurfaceSampler(kind, seed);
      return (u: number, v: number): SurfaceSample => {
        const out = {
          color: 0,
          height: 0,
          roughness: 0,
          occlusion: 0,
          mortar: 0,
          metallic: 0,
        };
        sample(u, v, out);
        return out;
      };
    };
    // Reconstruct primitive coordinates, but assert only real sampled fields.
    const rindPoint = (
      seed: number,
      x: number,
      y: number,
    ): [number, number] => {
      const phase = hash(0, 0, seed) * 2 * Math.PI;
      let u = x / 7,
        v = y / 7;
      for (let i = 0; i < 160; i++) {
        u = (x - 0.38 * Math.sin(6 * Math.PI * v + phase)) / 7;
        v = (y - 0.34 * Math.sin(4 * Math.PI * u - phase)) / 7;
      }
      return [u, v];
    };
    const bractPoint = (
      seed: number,
      x: number,
      y: number,
      a: number,
      b: number,
    ): [number, number] => {
      const angle = 0.24 * (hash(x, y, seed ^ 0x53a9) - 0.5),
        cx =
          x + 0.25 + 0.5 * (y % 2) + 0.12 * (hash(x, y, seed ^ 0x3c71) - 0.5),
        cy = y + 0.5 + 0.12 * (hash(x, y, seed ^ 0x6d13) - 0.5);
      return [
        (cx + 0.34 * a * Math.cos(angle) + 0.7 * b * Math.sin(angle)) / 4,
        (cy - 0.34 * a * Math.sin(angle) + 0.7 * b * Math.cos(angle)) / 6,
      ];
    };
    const hairPoint = (
      seed: number,
      x: number,
      y: number,
      along: number,
      across: number,
    ): [number, number] => {
      const angle = 2 * Math.PI * hash(x, y, seed ^ 0x2f93),
        cx = x + 0.3 + 0.4 * hash(x, y, seed ^ 0x43b7),
        cy = y + 0.3 + 0.4 * hash(x, y, seed ^ 0x6a51);
      return [
        (cx + along * Math.cos(angle) - across * Math.sin(angle)) / 36,
        (cy + along * Math.sin(angle) + across * Math.cos(angle)) / 36,
      ];
    };

    it('cantaloupe raises a pale cork network above its green rind islands', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const at = field('cantaloupe', seed);
        let islandHeight = 0,
          netHeight = 0,
          islandColor = 0,
          netColor = 0;
        for (let y = 0; y < 7; y++)
          for (let x = 0; x < 7; x++) {
            const px = x + 0.25 + 0.5 * hash(x, y, seed ^ 0x32b1),
              py = y + 0.25 + 0.5 * hash(x, y, seed ^ 0x67d9),
              qx = x + 1.25 + 0.5 * hash((x + 1) % 7, y, seed ^ 0x32b1),
              qy = y + 0.25 + 0.5 * hash((x + 1) % 7, y, seed ^ 0x67d9),
              island = at(...rindPoint(seed, px, py)),
              net = at(...rindPoint(seed, (px + qx) / 2, (py + qy) / 2));
            islandHeight += island.height;
            netHeight += net.height;
            islandColor += island.color;
            netColor += net.color;
          }
        expect(netHeight).toBeGreaterThan(2 * islandHeight);
        expect(netColor - islandColor).toBeGreaterThan(49 * 0.35);
      }
    });

    it('cantaloupe net joins across the torus instead of forming isolated pale spots', () => {
      const size = 128,
        at = field('cantaloupe', 123),
        net = new Uint8Array(size * size),
        queue = new Int32Array(size * size);
      let total = 0;
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++)
          if (at((x + 0.5) / size, (y + 0.5) / size).color > 0.65) {
            net[y * size + x] = 1;
            total++;
          }
      let largest = 0;
      for (let start = 0; start < net.length; start++) {
        if (!net[start]) continue;
        let read = 0,
          write = 1;
        queue[0] = start;
        net[start] = 0;
        while (read < write) {
          const index = queue[read++],
            x = index % size,
            y = Math.floor(index / size);
          for (let oy = -1; oy <= 1; oy++)
            for (let ox = -1; ox <= 1; ox++) {
              const next =
                ((y + oy + size) % size) * size + ((x + ox + size) % size);
              if (net[next]) {
                net[next] = 0;
                queue[write++] = next;
              }
            }
        }
        largest = Math.max(largest, write);
      }
      expect(total).toBeGreaterThan(size * size * 0.1);
      expect(total).toBeLessThan(size * size * 0.75);
      expect(largest).toBeGreaterThan(total * 0.97);
    });

    it('dragonfruit has magenta roots, green tapered lifted tips and recessed underlaps', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const at = field('dragonfruit', seed);
        for (let y = 1; y < 5; y++)
          for (let x = 0; x < 4; x++) {
            const tip = at(...bractPoint(seed, x, y, 0, 0.55)),
              root = at(...bractPoint(seed, x, y, 0, -0.55)),
              underlap = at(...bractPoint(seed, x, y, 0, -0.9)),
              outside = at(...bractPoint(seed, x, y, 1.35, 0));
            expect(tip.color - root.color).toBeGreaterThan(0.6);
            expect(tip.height).toBeGreaterThan(root.height * 1.4);
            expect(underlap.occlusion).toBeLessThan(0.94);
            expect(underlap.height).toBeLessThan(outside.height);
            // Follow the sampled groove across two interior sections. A fixed
            // point near the tip can instead land in the next bract's underlap.
            for (const side of [-1, 1]) {
              const grooveWidth = (b: number): number => {
                let darkest = Infinity,
                  width = 0;
                for (let step = 45; step <= 130; step++) {
                  const a = step / 100,
                    sample = at(...bractPoint(seed, x, y, side * a, b));
                  if (sample.occlusion < darkest) {
                    darkest = sample.occlusion;
                    width = a;
                  }
                }
                return width;
              };
              expect(grooveWidth(-0.3)).toBeGreaterThan(grooveWidth(0.3) * 1.1);
            }
          }
      }
    });

    it('kiwi has fine short fibers in varied directions rooted in small pits', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const at = field('kiwiskin', seed);
        let raised = 0,
          recessed = 0,
          horizontal = 0,
          vertical = 0;
        for (let y = 0; y < 8; y++)
          for (let x = 0; x < 8; x++) {
            const center = at(...hairPoint(seed, x, y, 0, 0)),
              side = at(...hairPoint(seed, x, y, 0, 0.18)),
              root = at(...hairPoint(seed, x, y, -0.43, 0)),
              rootSide = at(...hairPoint(seed, x, y, -0.43, 0.18)),
              shortEnd = at(...hairPoint(seed, x, y, 0.6, 0)),
              angle = 2 * Math.PI * hash(x, y, seed ^ 0x2f93);
            if (
              center.height > side.height * 1.5 &&
              center.height > shortEnd.height * 1.5 &&
              center.color > side.color + 0.15
            )
              raised++;
            if (root.height < rootSide.height * 0.8 && root.occlusion < 0.8)
              recessed++;
            const [u, v] = hairPoint(seed, x, y, 0, 0);
            if (
              Math.abs(Math.cos(angle)) > 0.9 &&
              at(u + 0.14 / 36, v).height >
                at(u, v + 0.14 / 36).height + center.height * 0.12
            )
              horizontal++;
            if (
              Math.abs(Math.sin(angle)) > 0.9 &&
              at(u, v + 0.14 / 36).height >
                at(u + 0.14 / 36, v).height + center.height * 0.12
            )
              vertical++;
          }
        expect(raised).toBeGreaterThan(40);
        expect(recessed).toBeGreaterThan(35);
        expect(horizontal).toBeGreaterThan(3);
        expect(vertical).toBeGreaterThan(3);
      }
    });

    it.each(fruitKinds)(
      '%s has C1 slopes at actual centers, supports, pigment shoulders and ownership edges',
      (kind) => {
        for (const seed of [1, 123, 0xffffffff]) {
          const at = field(kind, seed),
            points: [number, number][] = [];
          for (let y = 0; y < 3; y++)
            for (let x = 0; x < 3; x++) {
              if (kind === 'cantaloupe') {
                const px = x + 0.25 + 0.5 * hash(x, y, seed ^ 0x32b1),
                  py = y + 0.25 + 0.5 * hash(x, y, seed ^ 0x67d9),
                  qx = x + 1.25 + 0.5 * hash(x + 1, y, seed ^ 0x32b1),
                  qy = y + 0.25 + 0.5 * hash(x + 1, y, seed ^ 0x67d9),
                  dx = qx - px,
                  dy = qy - py,
                  length = Math.hypot(dx, dy);
                points.push(
                  rindPoint(seed, px, py),
                  rindPoint(seed, x, y + 0.5),
                );
                for (const inset of [0, 0.035, 0.035 + 1 / 6])
                  points.push(
                    rindPoint(
                      seed,
                      (px + qx) / 2 - (inset * dx) / length,
                      (py + qy) / 2 - (inset * dy) / length,
                    ),
                  );
                for (const dx of [-1.1, -Math.sqrt(1.01), Math.sqrt(1.01), 1.1])
                  points.push(rindPoint(seed, px + dx, py));
              } else if (kind === 'dragonfruit') {
                for (const b of [
                  -1,
                  -Math.sqrt(0.8),
                  -0.35,
                  0,
                  0.05,
                  0.45,
                  Math.sqrt(0.8),
                  1,
                ])
                  points.push(bractPoint(seed, x, y, 0, b));
                for (const b of [-0.5, 0.5])
                  for (const radius of [0.8, 1]) {
                    const a = Math.sqrt(
                      (radius - b * b) / (1 + 0.65 * b + 0.2 * b * b),
                    );
                    points.push(
                      bractPoint(seed, x, y, a, b),
                      bractPoint(seed, x, y, -a, b),
                    );
                  }
                points.push([x / 4, (y + 0.37) / 6], [(x + 0.37) / 4, y / 6]);
              } else {
                for (const along of [-0.55, -0.43, -0.31, 0, 0.43])
                  points.push(hairPoint(seed, x, y, along, 0));
                for (const across of [-0.075, 0.075])
                  points.push(hairPoint(seed, x, y, 0, across));
                for (const across of [-0.12, 0.12])
                  points.push(hairPoint(seed, x, y, -0.43, across));
                points.push(
                  [x / 36, (y + 0.37) / 36],
                  [(x + 0.37) / 36, y / 36],
                );
              }
            }
          points.push([0, 0.371], [0.629, 0], [1, 1]);
          for (const [u, v] of points) {
            const center = at(u, v);
            for (const [wu, wv] of [
              [u + 1, v],
              [u, v - 1],
            ])
              for (const key of Object.keys(center) as (keyof SurfaceSample)[])
                expect(at(wu, wv)[key]).toBeCloseTo(center[key], 10);
            for (const [du, dv] of [
              [1, 0],
              [0, 1],
              [0.6, 0.8],
            ]) {
              const h = 1e-7,
                left = at(u - du * h, v - dv * h),
                right = at(u + du * h, v + dv * h),
                coarseLeft = at(u - du * 4 * h, v - dv * 4 * h),
                coarseRight = at(u + du * 4 * h, v + dv * 4 * h);
              for (const key of Object.keys(
                center,
              ) as (keyof SurfaceSample)[]) {
                const fine =
                    Math.abs(left[key] + right[key] - 2 * center[key]) / h,
                  coarse =
                    Math.abs(
                      coarseLeft[key] + coarseRight[key] - 2 * center[key],
                    ) /
                    (4 * h);
                expect(fine).toBeLessThanOrEqual(0.4 * coarse + 1e-6);
              }
            }
          }
        }
      },
    );
  });
  describe('short patterned fur', () => {
    const furKinds = ['zebrafur', 'leopardfur', 'giraffefur'] as const;
    const empty = (): SurfaceSample => ({
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    });

    it('zebra stripes merge and fork instead of remaining parallel waves', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('zebrafur', seed),
          out = empty(),
          counts = new Set<number>();
        for (let y = 0; y < 64; y++) {
          let crossings = 0;
          sample(0, y / 64, out);
          let previous = out.color > 0.5;
          for (let x = 1; x <= 512; x++) {
            sample(x / 512, y / 64, out);
            const current = out.color > 0.5;
            if (current !== previous) crossings++;
            previous = current;
          }
          counts.add(crossings);
        }
        expect(counts.size).toBeGreaterThan(1);
        expect(Math.min(...counts)).toBeGreaterThan(0);
      }
    });

    it('leopard pigment has warm centers surrounded by dark arcs with open sectors', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('leopardfur', seed),
          out = empty();
        let brokenCenters = 0;
        for (let y = 0; y < 80; y++)
          for (let x = 0; x < 80; x++) {
            const u = (x + 0.5) / 80,
              v = (y + 0.5) / 80;
            sample(u, v, out);
            if (out.color < 0.56 || out.color > 0.76) continue;
            let dark = 0,
              open = 0;
            for (let ray = 0; ray < 24; ray++) {
              const angle = (2 * Math.PI * ray) / 24;
              sample(
                u + 0.064 * Math.cos(angle),
                v + 0.064 * Math.sin(angle),
                out,
              );
              if (out.color < 0.3) dark++;
              if (out.color > 0.65) open++;
            }
            if (dark >= 12 && open >= 2) brokenCenters++;
          }
        expect(brokenCenters).toBeGreaterThan(3);
      }
    });

    it('giraffe pale boundaries form one connected network across the torus', () => {
      const size = 128;
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('giraffefur', seed),
          out = empty(),
          pale = new Uint8Array(size * size),
          queue = new Int32Array(size * size);
        let total = 0,
          first = -1;
        for (let y = 0; y < size; y++)
          for (let x = 0; x < size; x++) {
            sample((x + 0.5) / size, (y + 0.5) / size, out);
            if (out.color > 0.6) {
              pale[y * size + x] = 1;
              total++;
              first = y * size + x;
            }
          }
        expect(total).toBeGreaterThan(size * size * 0.1);
        expect(total).toBeLessThan(size * size * 0.6);
        let count = 0,
          end = 1;
        queue[0] = first;
        pale[first] = 0;
        while (count < end) {
          const index = queue[count++],
            x = index % size,
            y = Math.floor(index / size);
          for (const neighbor of [
            y * size + ((x + 1) % size),
            y * size + ((x + size - 1) % size),
            ((y + 1) % size) * size + x,
            ((y + size - 1) % size) * size + x,
          ]) {
            if (!pale[neighbor]) continue;
            pale[neighbor] = 0;
            queue[end++] = neighbor;
          }
        }
        expect(count / total).toBeGreaterThan(0.99);
      }
    });

    it.each(furKinds)(
      '%s keeps directional pile relief separate from pigmentation',
      (kind) => {
        const sample = createSurfaceSampler(kind, 123),
          out = empty(),
          across = empty(),
          along = empty(),
          size = 128,
          count = size * size;
        let colors = 0,
          heights = 0,
          colorSquares = 0,
          heightSquares = 0,
          products = 0,
          acrossEnergy = 0,
          alongEnergy = 0;
        for (let y = 0; y < size; y++)
          for (let x = 0; x < size; x++) {
            const u = (x + 0.37) / size,
              v = (y + 0.29) / size;
            sample(u, v, out);
            sample(u + 1 / 2048, v, across);
            sample(u, v + 1 / 2048, along);
            colors += out.color;
            heights += out.height;
            colorSquares += out.color * out.color;
            heightSquares += out.height * out.height;
            products += out.color * out.height;
            acrossEnergy += (across.height - out.height) ** 2;
            alongEnergy += (along.height - out.height) ** 2;
          }
        const covariance = products - (colors * heights) / count,
          colorVariance = colorSquares - (colors * colors) / count,
          heightVariance = heightSquares - (heights * heights) / count;
        expect(acrossEnergy).toBeGreaterThan(alongEnergy);
        expect(
          Math.abs(covariance) / Math.sqrt(colorVariance * heightVariance),
        ).toBeLessThan(0.15);
      },
    );

    it.each(furKinds)(
      '%s has convergent C1 slopes through pigment shoulders and torus seams',
      (kind) => {
        for (const seed of [1, 123, 0xffffffff]) {
          const sample = createSurfaceSampler(kind, seed);
          const at = (u: number, v: number): SurfaceSample => {
            const out = empty();
            sample(u, v, out);
            return out;
          };
          const points: [number, number][] = [
            [0, 0],
            [0, 0.37],
            [0.63, 0],
          ];
          // Find actual pigment shoulders without duplicating the authored field.
          for (let y = 0; y < 12; y++) {
            const v = (y + 0.31) / 12;
            for (let x = 0; x < 64; x++) {
              let lo = x / 64,
                hi = (x + 1) / 64;
              const below = at(lo, v).color < 0.5;
              if (below === at(hi, v).color < 0.5) continue;
              for (let step = 0; step < 30; step++) {
                const mid = (lo + hi) / 2;
                if (at(mid, v).color < 0.5 === below) lo = mid;
                else hi = mid;
              }
              points.push([(lo + hi) / 2, v]);
            }
          }
          for (let i = 0; i <= 40; i++) points.push([i / 40, 0.419]);
          for (let i = 0; i <= 32; i++) points.push([0.613, i / 32]);
          for (const [u, v] of points)
            for (const [du, dv] of [
              [1, 0],
              [0, 1],
              [0.6, 0.8],
            ]) {
              const h = 1e-7,
                center = at(u, v),
                left = at(u - du * h, v - dv * h),
                right = at(u + du * h, v + dv * h),
                coarseLeft = at(u - 4 * du * h, v - 4 * dv * h),
                coarseRight = at(u + 4 * du * h, v + 4 * dv * h);
              for (const key of Object.keys(
                center,
              ) as (keyof SurfaceSample)[]) {
                expect(center[key]).toBeGreaterThanOrEqual(0);
                expect(center[key]).toBeLessThanOrEqual(1);
                const fineJump =
                    Math.abs(left[key] + right[key] - 2 * center[key]) / h,
                  coarseJump =
                    Math.abs(
                      coarseLeft[key] + coarseRight[key] - 2 * center[key],
                    ) /
                    (4 * h);
                expect(fineJump).toBeLessThanOrEqual(0.4 * coarseJump + 1e-7);
              }
            }
        }
      },
    );
  });
  describe('patterned textile geometry', () => {
    const empty = (): SurfaceSample => ({
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    });

    it('houndstooth shifts the protruding teeth inside each broken check', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('houndstooth', seed),
          a = empty(),
          b = empty(),
          c = empty(),
          d = empty();
        sample(4 / 32, 0, a);
        sample(4 / 32, 2 / 32, b);
        sample(6 / 32, 0, c);
        sample(6 / 32, 2 / 32, d);
        // A checkerboard would not exchange light and dark within one check.
        expect(a.color - b.color).toBeGreaterThan(0.6);
        expect(d.color - c.color).toBeGreaterThan(0.6);
      }
    });

    it('tartan retains broad bands, fine overstripes and alternating yarn crossings', () => {
      const sample = createSurfaceSampler('tartan', 123),
        a = empty(),
        b = empty();
      const column = (u: number) => {
        let total = 0;
        for (let i = 0; i < 512; i++) {
          sample(u, (i + 0.37) / 512, a);
          total += a.color;
        }
        return total / 512;
      };
      const background = column(0.2),
        broadCenter = column(0),
        broadShoulder = column(0.04),
        fineCenter = column(0.375),
        fineShoulder = (column(0.35) + column(0.4)) / 2;
      expect(broadCenter - background).toBeGreaterThan(0.1);
      expect(broadShoulder - background).toBeGreaterThan(0.1);
      expect(fineCenter - fineShoulder).toBeGreaterThan(0.1);
      sample(0.375, 0.25, a);
      sample(0.375, 0.25 + 1 / 64, b);
      expect(a.color - b.color).toBeGreaterThan(0.15);
    });

    it('damask raises paired leaves and a flower above the woven backing', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('damask', seed),
          left = empty(),
          right = empty(),
          backing = empty(),
          flower = empty();
        sample(-0.0575, 0.0475, left);
        sample(0.0575, 0.0475, right);
        sample(0.175, 0.0475, backing);
        sample(0, -0.09, flower);
        expect(left.height).toBeGreaterThan(backing.height * 1.7);
        expect(right.height).toBeGreaterThan(backing.height * 1.7);
        expect(flower.height).toBeGreaterThan(backing.height * 1.7);
        expect(left.color - backing.color).toBeGreaterThan(0.35);
        expect(right.color - backing.color).toBeGreaterThan(0.35);
        expect(Math.abs(left.height - right.height)).toBeLessThan(
          0.1 * (left.height - backing.height),
        );
      }
    });
  });

  describe('opaque nutshell surfaces', () => {
    const nutKinds = ['walnutshell', 'peanutshell', 'almondshell'] as const;
    const empty = (): SurfaceSample => ({
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    });
    const hash = (x: number, y: number, seed: number): number => {
      let n =
        (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
      n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
      n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    const almond = (x: number, y: number, seed: number) => {
      const angle = 0.3 * (hash(x, y, seed ^ 0x37a9) - 0.5),
        cosine = Math.cos(angle),
        sine = Math.sin(angle),
        cx = x + 0.25 + 0.5 * hash(x, y, seed ^ 0x193b),
        cy = y + 0.25 + 0.5 * hash(x, y, seed ^ 0x5d27),
        rx = 0.1 + 0.03 * hash(x, y, seed ^ 0x6b13),
        ry = 0.32 + 0.12 * hash(x, y, seed ^ 0x41d7);
      return (a: number, b: number): [number, number] => [
        (cx + a * rx * cosine - b * ry * sine) / 16,
        (cy + a * rx * sine + b * ry * cosine) / 12,
      ];
    };
    const nutNoise = (u: number, v: number, seed: number): number => {
      // A tiny negative coordinate can round to 1 after subtracting floor.
      // Canonicalize it before indexing the periodic noise lattice.
      const px = ((u - Math.floor(u)) % 1) * 4,
        py = ((v - Math.floor(v)) % 1) * 6,
        ix = Math.floor(px),
        iy = Math.floor(py),
        fx = px - ix,
        fy = py - iy,
        sx = fx * fx * (3 - 2 * fx),
        sy = fy * fy * (3 - 2 * fy),
        a = hash(ix, iy, seed ^ 0x3b59),
        b = hash((ix + 1) % 4, iy, seed ^ 0x3b59),
        c = hash(ix, (iy + 1) % 6, seed ^ 0x3b59),
        d = hash((ix + 1) % 4, (iy + 1) % 6, seed ^ 0x3b59);
      return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
    };
    const walnutUV = (x: number, y: number, seed: number): [number, number] => {
      const v = y / 7;
      let low = (x - 0.5) / 7,
        high = (x + 0.5) / 7;
      // The carrier's u-slope is at least 7 - 0.8 * 4 * 1.5 > 0.
      for (let i = 0; i < 50; i++) {
        const u = (low + high) * 0.5;
        if (7 * u + 0.8 * (nutNoise(u, v, seed) - 0.5) < x) low = u;
        else high = u;
      }
      return [(low + high) * 0.5, v];
    };
    const walnut = (x: number, y: number, branch: number, seed: number) => {
      const ox = branch === 1 ? 0 : 1,
        oy = branch === 0 ? 0 : 1,
        ax = x + 0.2 + 0.6 * hash(x, y, seed ^ 0x196d),
        ay = y + 0.2 + 0.6 * hash(x, y, seed ^ 0x57b3),
        bx =
          x + ox + 0.2 + 0.6 * hash((x + ox) % 7, (y + oy) % 7, seed ^ 0x196d),
        by =
          y + oy + 0.2 + 0.6 * hash((x + ox) % 7, (y + oy) % 7, seed ^ 0x57b3),
        length = Math.hypot(bx - ax, by - ay),
        cosine = (bx - ax) / length,
        sine = (by - ay) / length,
        radius = length * 0.5 + 0.2,
        width = 0.28 + 0.14 * hash(x, y, seed ^ (0x39a1 + branch)),
        bend = 0.64 * (hash(x, y, seed ^ (0x61c7 + branch)) - 0.5);
      return (a: number, b: number): [number, number] => {
        const across = b * width + bend * (1 - a * a);
        return walnutUV(
          (ax + bx) * 0.5 + a * radius * cosine - across * sine,
          (ay + by) * 0.5 + a * radius * sine + across * cosine,
          seed,
        );
      };
    };
    // Invert the periodic carrier to locate actual peanut ribs/link supports.
    const peanut = (x: number, v: number, seed: number): [number, number] => {
      const warp = (u: number): number =>
        10 * u +
        0.28 * Math.sin(2 * Math.PI * (v + hash(0, 0, seed))) +
        0.3 * (nutNoise(u, v, seed) - 0.5);
      let low = (x - 0.5) / 10,
        high = (x + 0.5) / 10;
      for (let i = 0; i < 50; i++) {
        const u = (low + high) * 0.5;
        if (warp(u) < x) low = u;
        else high = u;
      }
      return [(low + high) * 0.5, v];
    };

    it.each(nutKinds)(
      '%s correlates physical relief, pigment and cavity occlusion',
      (kind) => {
        for (const seed of [1, 123, 0xffffffff]) {
          const sample = createSurfaceSampler(kind, seed),
            out = empty();
          let minimum = Infinity,
            maximum = -Infinity,
            lowAO = 1,
            highAO = 0,
            sumH = 0,
            sumC = 0,
            sumAO = 0,
            sumHC = 0,
            sumHAO = 0,
            minRoughness = 1,
            maxRoughness = 0,
            maxMetal = 0,
            maxMortar = 0;
          const count = 96 * 96;
          for (let y = 0; y < 96; y++)
            for (let x = 0; x < 96; x++) {
              sample((x + 0.37) / 96, (y + 0.23) / 96, out);
              const h = out.height / proceduralMaterialPresets[kind].relief;
              minimum = Math.min(minimum, h);
              maximum = Math.max(maximum, h);
              lowAO = Math.min(lowAO, out.occlusion);
              highAO = Math.max(highAO, out.occlusion);
              minRoughness = Math.min(minRoughness, out.roughness);
              maxRoughness = Math.max(maxRoughness, out.roughness);
              maxMetal = Math.max(maxMetal, out.metallic);
              maxMortar = Math.max(maxMortar, out.mortar);
              sumH += h;
              sumC += out.color;
              sumAO += out.occlusion;
              sumHC += h * out.color;
              sumHAO += h * out.occlusion;
            }
          expect(maximum - minimum).toBeGreaterThan(0.27);
          expect(highAO - lowAO).toBeGreaterThan(0.17);
          expect(
            sumHC / count - (sumH * sumC) / (count * count),
          ).toBeGreaterThan(0.001);
          expect(
            sumHAO / count - (sumH * sumAO) / (count * count),
          ).toBeGreaterThan(0.0007);
          expect(minimum).toBeGreaterThan(0);
          expect(maximum).toBeLessThan(1);
          expect(minRoughness).toBeGreaterThan(0.8);
          expect(maxRoughness).toBeLessThan(1);
          expect(maxMetal).toBe(0);
          expect(maxMortar).toBe(0);
        }
      },
    );

    it('peanut retains strong longitudinal ribs with weaker nonalternating cross-links', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('peanutshell', seed),
          rib = empty(),
          side = empty(),
          link = empty(),
          gap = empty(),
          a = empty(),
          b = empty(),
          c = empty();
        let minimumRib = Infinity,
          minimumLink = Infinity,
          maximumLink = 0,
          uEnergy = 0,
          vEnergy = 0;
        for (let y = 0; y < 5; y++)
          for (let x = 0; x < 10; x++) {
            const center = y + 0.25 + 0.5 * hash(x, y, seed ^ 0x2b71);
            sample(...peanut(x, center / 5, seed), rib);
            sample(...peanut(x + 0.25, center / 5, seed), side);
            sample(...peanut(x + 0.5, center / 5, seed), link);
            sample(...peanut(x + 0.5, (center + 0.25) / 5, seed), gap);
            minimumRib = Math.min(
              minimumRib,
              (rib.height - side.height) / 0.0015,
            );
            minimumLink = Math.min(
              minimumLink,
              (link.height - gap.height) / 0.0015,
            );
            maximumLink = Math.max(
              maximumLink,
              (link.height - gap.height) / 0.0015,
            );
          }
        for (let y = 0; y < 64; y++)
          for (let x = 0; x < 64; x++) {
            const u = (x + 0.31) / 64,
              v = (y + 0.43) / 64;
            sample(u, v, a);
            sample(u + 1 / 512, v, b);
            sample(u, v + 1 / 512, c);
            uEnergy += (a.height - b.height) ** 2;
            vEnergy += (a.height - c.height) ** 2;
          }
        expect(minimumRib).toBeGreaterThan(0.25);
        expect(minimumLink).toBeGreaterThan(0.095);
        expect(maximumLink).toBeLessThan(0.13);
        expect(uEnergy / vEnergy).toBeGreaterThan(5);
      }
    });

    it('almond pores are elongated negative relief, not pigment spots or beads', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('almondshell', seed),
          center = empty(),
          across = empty(),
          along = empty();
        let depression = Infinity,
          shadow = Infinity,
          elongation = Infinity,
          count = 0;
        for (let y = 0; y < 12; y++)
          for (let x = 0; x < 16; x++) {
            if (hash(x, y, seed ^ 0x79b1) <= 0.3) continue;
            const point = almond(x, y, seed);
            sample(...point(0, 0), center);
            sample(...point(1.1, 0), across);
            sample(...point(0, 0.4), along);
            depression = Math.min(
              depression,
              (across.height - center.height) / 0.0012,
            );
            shadow = Math.min(shadow, across.occlusion - center.occlusion);
            elongation = Math.min(
              elongation,
              (across.height - along.height) / 0.0012,
            );
            count++;
          }
        expect(count).toBeGreaterThan(90);
        expect(depression).toBeGreaterThan(0.3);
        expect(shadow).toBeGreaterThan(0.35);
        expect(elongation).toBeGreaterThan(0.28);
      }
    });

    it('walnut winding ridges join and branch above deep concavities', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('walnutshell', seed),
          crest = empty(),
          hollow = empty(),
          node = empty();
        let raised = 0,
          branches = 0,
          joined = 0,
          winding = 0;
        for (let y = 0; y < 7; y++)
          for (let x = 0; x < 7; x++) {
            for (let branch = 0; branch < 3; branch++) {
              if (branch === 2 && hash(x, y, seed ^ 0x2d93) >= 0.45) continue;
              if (branch === 0 && hash(x, y, seed ^ 0x42ab) >= 0.6) continue;
              const point = walnut(x, y, branch, seed);
              sample(...point(0, 0), crest);
              // A neighboring branch may occupy one side of a ridge.
              let hasValley = false;
              for (let side = -1; side <= 1; side += 2) {
                sample(...point(0, side * 1.8), hollow);
                if (
                  crest.height > hollow.height + 0.0003 &&
                  crest.occlusion > hollow.occlusion + 0.07
                )
                  hasValley = true;
              }
              if (hasValley) raised++;
              const bend = 0.64 * (hash(x, y, seed ^ (0x61c7 + branch)) - 0.5),
                width = 0.28 + 0.14 * hash(x, y, seed ^ (0x39a1 + branch));
              sample(...point(0, -bend / width), hollow);
              if (crest.height > hollow.height + 0.00003) winding++;
              if (branch === 2 && crest.height > 0.0014) branches++;
            }
            sample(
              ...walnutUV(
                x + 0.2 + 0.6 * hash(x, y, seed ^ 0x196d),
                y + 0.2 + 0.6 * hash(x, y, seed ^ 0x57b3),
                seed,
              ),
              node,
            );
            if (node.height > 0.0011 && node.occlusion > 0.65) joined++;
          }
        expect(raised).toBeGreaterThan(45);
        expect(winding).toBeGreaterThan(25);
        expect(branches).toBeGreaterThan(10);
        expect(joined).toBeGreaterThan(35);
      }
    });

    it.each(nutKinds)(
      '%s is C1 at compact supports, shoulders and toroidal seams',
      (kind) => {
        for (const seed of [1, 123, 0xffffffff]) {
          const sample = createSurfaceSampler(kind, seed),
            points: [number, number][] = [
              [0, 0],
              [0, 0.417],
              [0.391, 1],
            ],
            center = empty(),
            left = empty(),
            right = empty(),
            coarseLeft = empty(),
            coarseRight = empty(),
            keys = Object.keys(center) as (keyof SurfaceSample)[];
          if (kind === 'walnutshell') {
            for (const x of [0, 3, 6])
              for (const y of [0, 3, 6])
                for (let branch = 0; branch < 3; branch++) {
                  const point = walnut(x, y, branch, seed);
                  for (const a of [-1, -Math.sqrt(0.6), 0, Math.sqrt(0.6), 1])
                    for (const b of [-1, 0, 1]) points.push(point(a, b));
                }
          } else if (kind === 'almondshell') {
            for (const x of [0, 7, 15])
              for (const y of [0, 5, 11]) {
                const point = almond(x, y, seed);
                for (let i = 0; i < 8; i++)
                  points.push(
                    point(
                      Math.cos((i * Math.PI) / 4),
                      Math.sin((i * Math.PI) / 4),
                    ),
                  );
                points.push(point(0, 0));
              }
          } else {
            for (const x of [0, 4, 9])
              for (const y of [0, 2, 4]) {
                const cy = y + 0.25 + 0.5 * hash(x, y, seed ^ 0x2b71),
                  width = 0.09 + 0.04 * hash(x, y, seed ^ 0x57d1),
                  tilt = 0.3 * (hash(x, y, seed ^ 0x71b9) - 0.5);
                for (let i = 0; i < 8; i++) {
                  const dx = 0.65 * Math.cos((i * Math.PI) / 4),
                    dy = width * Math.sin((i * Math.PI) / 4) + tilt * dx;
                  points.push(peanut(x + 0.5 + dx, (cy + dy) / 5, seed));
                }
                for (const side of [-1, 0, 1])
                  points.push(
                    peanut(
                      x + (side * Math.acos(0.6)) / (2 * Math.PI),
                      cy / 5,
                      seed,
                    ),
                  );
              }
          }
          const columns =
              kind === 'walnutshell' ? 7 : kind === 'peanutshell' ? 10 : 16,
            rows = kind === 'walnutshell' ? 7 : kind === 'peanutshell' ? 5 : 12;
          for (let x = 0; x <= columns; x++)
            points.push(
              kind === 'walnutshell'
                ? walnutUV(x, 0.419 * rows, seed)
                : [x / columns, 0.419],
            );
          for (let y = 0; y <= rows; y++)
            points.push(
              kind === 'walnutshell'
                ? walnutUV(0.613 * columns, y, seed)
                : [0.613, y / rows],
            );
          let maxPeriodError = 0,
            maxConvergenceExcess = -Infinity;
          for (const [u, v] of points) {
            sample(u, v, center);
            sample(u + 1, v - 1, right);
            for (const key of keys)
              maxPeriodError = Math.max(
                maxPeriodError,
                Math.abs(right[key] - center[key]),
              );
            for (const [du, dv] of [
              [1, 0],
              [0, 1],
              [0.6, 0.8],
            ]) {
              // Mixed curvatures can cancel a coarser slope gap near a join.
              // Refine the interval without relaxing the convergence bound.
              const step = 2.5e-8;
              sample(u - step * du, v - step * dv, left);
              sample(u + step * du, v + step * dv, right);
              sample(u - 4 * step * du, v - 4 * step * dv, coarseLeft);
              sample(u + 4 * step * du, v + 4 * step * dv, coarseRight);
              for (const key of keys) {
                const fine =
                    Math.abs(left[key] + right[key] - 2 * center[key]) / step,
                  coarse =
                    Math.abs(
                      coarseLeft[key] + coarseRight[key] - 2 * center[key],
                    ) /
                    (4 * step);
                maxConvergenceExcess = Math.max(
                  maxConvergenceExcess,
                  fine - 0.4 * coarse,
                );
              }
            }
          }
          expect(maxPeriodError).toBeLessThan(1e-11);
          expect(maxConvergenceExcess).toBeLessThan(1e-7);
        }
      },
    );
  });

  describe('opaque shell growth surfaces', () => {
    const empty = (): SurfaceSample => ({
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    });
    const hash = (x: number, y: number, seed: number): number => {
      let n =
        (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
      n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
      n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    // Locate actual primitives, not a rectangular grid unrelated to the field.
    const shell = (x: number, y: number, seed: number, oyster = false) => {
      const angle = 0.45 * (hash(x, y, seed ^ 0x317b) - 0.5),
        cosine = Math.cos(angle),
        sine = Math.sin(angle),
        cells = oyster ? 3 : 2,
        cx = x + 0.5 + 0.12 * (hash(x, y, seed ^ 0x193d) - 0.5),
        cy = y + 0.5 + 0.12 * (hash(x, y, seed ^ 0x69a1) - 0.5);
      return {
        phase: 2 * Math.PI * hash(x, y, seed ^ 0x4b27),
        point: (a: number, b: number): [number, number] => {
          const dx = a * (oyster ? 0.73 : 0.47),
            dy = b * (oyster ? 0.58 : 0.47);
          return [
            (cx + dx * cosine - dy * sine) / cells,
            (cy + dx * sine + dy * cosine) / cells,
          ];
        },
      };
    };
    const oysterRadius = (q: number, phase: number, b = 0): number => {
      let low = -1.2,
        high = 0;
      for (let i = 0; i < 60; i++) {
        const a = (low + high) * 0.5,
          value =
            ((a + 0.16 * b * b) ** 2 + b * b) *
            (1 + 0.13 * Math.sin(5 * a + phase) * Math.sin(4 * b - phase));
        if (value > q) low = a;
        else high = a;
      }
      return (low + high) * 0.5;
    };
    it('scallop ribs diverge from a hinge inside a forward fan with transverse growth', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('scallopshell', seed),
          out = empty();
        for (let y = 0; y < 2; y++)
          for (let x = 0; x < 2; x++) {
            const face = shell(x, y, seed),
              at = (radius: number, angle: number) => {
                const p = face.point(
                  radius * Math.sin(angle),
                  radius * Math.cos(angle) - 0.6,
                );
                sample(...p, out);
                return { ...out };
              };
            for (const radius of [0.5, 0.8])
              for (const ray of [-1, 0, 1]) {
                const angle = (ray * Math.PI) / 9,
                  rib = at(radius, angle),
                  trough = at(radius, angle + Math.PI / 18);
                expect(rib.height).toBeGreaterThan(trough.height);
                expect(rib.occlusion).toBeGreaterThan(trough.occlusion);
              }
            expect(at(0.65, 0).height).toBeGreaterThan(
              at(0.65, Math.PI).height,
            );
            // Along one rib, successive growth crests stand above neighboring
            // troughs without changing which ray owns the point.
            const crest = (8 * Math.PI - face.phase) / 44;
            expect(at(crest, 0).height).toBeGreaterThan(
              at(crest + Math.PI / 44, 0).height,
            );
          }
      }
    });
    it('oyster laminae lift pale lips above dark occluded outer recesses on curved fronts', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('oystershell', seed),
          lip = empty(),
          recess = empty();
        for (let y = 0; y < 3; y++)
          for (let x = 0; x < 3; x++) {
            const face = shell(x, y, seed, true);
            for (const front of [0.435, 0.28]) {
              for (const b of [-0.2, 0, 0.2]) {
                const lipA = oysterRadius(front - 0.045, face.phase, b),
                  recessA = oysterRadius(front + 0.035, face.phase, b);
                sample(...face.point(lipA, b), lip);
                sample(...face.point(recessA, b), recess);
                expect(lip.height).toBeGreaterThan(recess.height);
                expect(lip.color).toBeGreaterThan(recess.color);
                expect(lip.occlusion).toBeGreaterThan(recess.occlusion);
              }
            }
          }
      }
    });
    it('nautilus relief follows a winding coil rather than concentric rings and bends chamber stripes', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('nautilusshell', seed),
          out = empty();
        for (let y = 0; y < 2; y++)
          for (let x = 0; x < 2; x++) {
            const face = shell(x, y, seed),
              at = (radius: number, angle: number) => {
                sample(
                  ...face.point(
                    radius * Math.cos(angle),
                    radius * Math.sin(angle),
                  ),
                  out,
                );
                return { ...out };
              };
            for (const radius of [0.4, 0.6, 0.8]) {
              const angle = 6 * Math.PI * radius + face.phase,
                ridge = at(radius, angle),
                opposite = at(radius, angle + Math.PI);
              expect(ridge.height).toBeGreaterThan(opposite.height);
              expect(ridge.occlusion).toBeGreaterThan(opposite.occlusion);
            }
            for (const radius of [0.45, 0.7]) {
              const stripe = (13 * radius - face.phase) / 18;
              expect(at(radius, stripe).color).toBeLessThan(
                at(radius, stripe + Math.PI / 18).color,
              );
              // The stripe moves angularly with radius; a fixed radial spoke
              // does not keep the same pigment as a curved chamber boundary.
              expect(at(radius, stripe).color).toBeLessThan(
                at(radius + 0.12, stripe).color,
              );
            }
          }
      }
    });
    it.each(['scallopshell', 'oystershell', 'nautilusshell'] as const)(
      '%s converges to common slopes at actual centers, supports, branch cuts and ownership seams',
      (kind) => {
        for (const seed of [1, 123, 0xffffffff]) {
          const sample = createSurfaceSampler(kind, seed),
            points: [number, number][] = [
              [0, 0],
              [0, 0.417],
              [0.391, 1],
            ],
            oyster = kind === 'oystershell',
            cells = oyster ? 3 : 2;
          for (let y = 0; y < cells; y++)
            for (let x = 0; x < cells; x++) {
              const face = shell(x, y, seed, oyster);
              points.push(
                face.point(0, 0),
                [x / cells, 0.413],
                [0.381, y / cells],
              );
              if (oyster) {
                for (const q of [0.78, 1, 0.41, 0.46, 0.255, 0.305])
                  points.push(face.point(oysterRadius(q, face.phase), 0));
                // Follow actual support through a neighboring shell overlap.
                for (const b of [-0.4, 0.4])
                  points.push(face.point(oysterRadius(1, face.phase, b), b));
              } else if (kind === 'nautilusshell') {
                for (const q of [0.01, 0.01 + 1 / 12, 0.75, 1])
                  points.push(face.point(-Math.sqrt(q), 0));
              } else {
                points.push(face.point(0, -0.6));
                for (const radius of [
                  Math.sqrt(0.015),
                  Math.sqrt(0.0775),
                  1.15,
                  1.35,
                ])
                  points.push(face.point(0, radius - 0.6));
                for (const cosine of [0.55, 0.75])
                  points.push(
                    face.point(
                      0.7 * Math.sqrt(1 - cosine * cosine),
                      0.7 * cosine - 0.6,
                    ),
                  );
                points.push(face.point(0, -0.8));
              }
            }
          const center = empty(),
            left = empty(),
            right = empty(),
            coarseLeft = empty(),
            coarseRight = empty();
          for (const [u, v] of points) {
            sample(u, v, center);
            sample(u + 1, v - 1, right);
            for (const key of Object.keys(center) as (keyof SurfaceSample)[])
              expect(right[key]).toBeCloseTo(center[key], 11);
            for (const [du, dv] of [
              [1, 0],
              [0, 1],
              [0.6, 0.8],
            ]) {
              const step = 2e-7;
              sample(u - step * du, v - step * dv, left);
              sample(u + step * du, v + step * dv, right);
              sample(u - 4 * step * du, v - 4 * step * dv, coarseLeft);
              sample(u + 4 * step * du, v + 4 * step * dv, coarseRight);
              for (const key of Object.keys(
                center,
              ) as (keyof SurfaceSample)[]) {
                const fine =
                    Math.abs(left[key] + right[key] - 2 * center[key]) / step,
                  coarse =
                    Math.abs(
                      coarseLeft[key] + coarseRight[key] - 2 * center[key],
                    ) /
                    (4 * step);
                expect(fine).toBeLessThanOrEqual(0.4 * coarse + 3e-8);
              }
            }
          }
        }
      },
    );
  });
  describe('opaque marine relief', () => {
    const empty = (): SurfaceSample => ({
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    });
    const hash = (x: number, y: number, seed: number): number => {
      let n =
        (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
      n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
      n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    // Placement alone is reconstructed; assertions observe the public fields.
    const corallite = (x: number, y: number, seed: number) => {
      const angle = 2 * Math.PI * hash(x, y, seed ^ 0x2c97),
        radius = 0.5 + 0.055 * hash(x, y, seed ^ 0x6e31);
      return (a: number, b: number): [number, number] => [
        (x +
          0.4 +
          0.2 * hash(x, y, seed ^ 0x1b59) +
          radius * (a * Math.cos(angle) - 0.9 * b * Math.sin(angle))) /
          6,
        (y +
          0.4 +
          0.2 * hash(x, y, seed ^ 0x5f27) +
          radius * (a * Math.sin(angle) + 0.9 * b * Math.cos(angle))) /
          6,
      ];
    };
    const spongeNode = (
      x: number,
      y: number,
      seed: number,
    ): [number, number] => [
      (x + 0.34 + 0.32 * hash((x + 7) % 7, (y + 7) % 7, seed ^ 0x17d3)) / 7,
      (y + 0.34 + 0.32 * hash((x + 7) % 7, (y + 7) % 7, seed ^ 0x59a7)) / 7,
    ];
    const spongePoint = (
      x: number,
      y: number,
      seed: number,
    ): [number, number] => {
      const phase = 2 * Math.PI * hash(0, 0, seed),
        v = y - 0.06 * Math.sin(4 * Math.PI * x - phase);
      return [x - 0.07 * Math.sin(6 * Math.PI * v + phase), v];
    };
    it('brain coral retains repeated rounded ridges and intervening valleys in both directions', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('braincoral', seed),
          out = empty();
        for (const axis of [0, 1]) {
          let peaks = 0,
            valleys = 0;
          for (const along of [0.17, 0.39, 0.73]) {
            const heights: number[] = [],
              exposures: number[] = [];
            for (let i = 0; i < 512; i++) {
              sample(
                axis === 0 ? i / 512 : along,
                axis === 1 ? i / 512 : along,
                out,
              );
              heights.push(out.height);
              exposures.push(out.occlusion);
            }
            const low = Math.min(...heights),
              high = Math.max(...heights),
              range = high - low;
            expect(
              heights[exposures.indexOf(Math.max(...exposures))],
            ).toBeGreaterThan(
              heights[exposures.indexOf(Math.min(...exposures))],
            );
            for (let i = 0; i < 512; i++) {
              const h = heights[i],
                before = heights[(i + 511) % 512],
                after = heights[(i + 1) % 512];
              if (h > low + 0.75 * range && h > before && h > after) peaks++;
              if (h < low + 0.25 * range && h < before && h < after) valleys++;
            }
          }
          expect(peaks).toBeGreaterThan(4);
          expect(valleys).toBeGreaterThan(2);
        }
      }
    });
    it('star coral has recessed mouths surrounded by raised radial septa', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('starcoral', seed),
          out = empty();
        let stars = 0;
        for (let y = 0; y < 6; y++)
          for (let x = 0; x < 6; x++) {
            const point = corallite(x, y, seed),
              at = (radius: number, angle: number): number => {
                const p = point(
                  radius * Math.cos(angle),
                  radius * Math.sin(angle),
                );
                sample(p[0], p[1], out);
                return out.height;
              },
              mouth = at(0, 0);
            let ribs = 0;
            for (let ray = 0; ray < 12; ray++) {
              const angle = (ray * Math.PI) / 6,
                rib = at(0.55, angle);
              if (rib > mouth && rib > at(0.55, angle + Math.PI / 12)) ribs++;
            }
            if (ribs >= 10) stars++;
          }
        expect(stars).toBeGreaterThanOrEqual(30);
      }
    });
    it('sea sponge joins branching nodes while retaining open pore relief and fine channels', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('seasponge', seed),
          out = empty();
        const poreHeights: number[] = [];
        let minimumBranchHeight = Infinity,
          channelled = 0;
        for (let y = 0; y < 7; y++)
          for (let x = 0; x < 7; x++) {
            const pore = spongePoint(x / 7, y / 7, seed);
            sample(pore[0], pore[1], out);
            poreHeights.push(out.height);
            for (const [ox, oy] of [
              [1, 0],
              [0, 1],
            ]) {
              const a = spongeNode(x, y, seed),
                b = spongeNode(x + ox, y + oy, seed),
                heights: number[] = [];
              for (let i = 0; i <= 64; i++) {
                const t = i / 64,
                  point = spongePoint(
                    a[0] + t * (b[0] - a[0]),
                    a[1] + t * (b[1] - a[1]),
                    seed,
                  );
                sample(point[0], point[1], out);
                minimumBranchHeight = Math.min(minimumBranchHeight, out.height);
                heights.push(out.height);
              }
              let troughs = 0;
              for (let i = 1; i < 64; i++)
                if (heights[i] < heights[i - 1] && heights[i] < heights[i + 1])
                  troughs++;
              if (troughs >= 2) channelled++;
            }
          }
        expect(
          poreHeights.filter((height) => height < minimumBranchHeight).length,
        ).toBeGreaterThan(8);
        expect(channelled).toBeGreaterThan(10);
      }
    });
    it.each(['braincoral', 'starcoral', 'seasponge'] as const)(
      '%s has convergent slopes at mouths, supports, nodes, ownership edges and seams',
      (kind) => {
        for (const seed of [1, 123, 0xffffffff]) {
          const sample = createSurfaceSampler(kind, seed),
            points: [number, number][] = [
              [0, 0],
              [0, 0.137],
              [0.791, 1],
            ];
          for (let i = 0; i < 8; i++) {
            points.push([i / 7, 0.417], [0.371, i / 6], [i / 28, 0.51]);
            if (kind === 'seasponge')
              points.push(
                spongePoint(i / 7, 0.417, seed),
                spongePoint(0.371, i / 7, seed),
              );
            if (i < 6) {
              const point = corallite(i, i, seed);
              for (const radius of [0, 0.16, 0.28, Math.sqrt(0.75), 1])
                points.push(point(radius, 0));
              const node = spongeNode(i, i, seed),
                next = spongeNode(i + 1, i, seed),
                dx = next[0] - node[0],
                dy = next[1] - node[1],
                length = Math.sqrt(dx * dx + dy * dy),
                width = (0.14 + 0.03 * hash(i, i, seed ^ 0x41b9)) / 7;
              points.push(spongePoint(node[0], node[1], seed));
              for (const radius of [Math.sqrt(0.2), 1]) {
                points.push(
                  spongePoint(node[0] + (radius * 0.23) / 7, node[1], seed),
                  spongePoint(
                    (node[0] + next[0]) * 0.5 - (radius * width * dy) / length,
                    (node[1] + next[1]) * 0.5 + (radius * width * dx) / length,
                    seed,
                  ),
                );
              }
            }
          }
          const center = empty(),
            left = empty(),
            right = empty(),
            coarseLeft = empty(),
            coarseRight = empty();
          for (const [u, v] of points)
            for (const [du, dv] of [
              [2e-7, 0],
              [0, 2e-7],
              [1.2e-7, 1.6e-7],
            ]) {
              sample(u, v, center);
              sample(u - du, v - dv, left);
              sample(u + du, v + dv, right);
              sample(u - 4 * du, v - 4 * dv, coarseLeft);
              sample(u + 4 * du, v + 4 * dv, coarseRight);
              for (const key of Object.keys(
                center,
              ) as (keyof SurfaceSample)[]) {
                const fineJump =
                    Math.abs(left[key] + right[key] - 2 * center[key]) / 2e-7,
                  coarseJump =
                    Math.abs(
                      coarseLeft[key] + coarseRight[key] - 2 * center[key],
                    ) / 8e-7;
                expect(fineJump).toBeLessThanOrEqual(0.4 * coarseJump + 2e-8);
              }
            }
        }
      },
    );
  });
  describe('opaque foliage relief', () => {
    const empty = (): SurfaceSample => ({
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    });
    const hash = (x: number, y: number, seed: number): number => {
      let n =
        (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
      n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
      n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    // Reconstruct seeded placement only, never the field's channel formulas.
    const feature = (
      kind: 'lotusleaf' | 'bananaleaf' | 'fernleaf',
      x: number,
      y: number,
      seed: number,
    ) => {
      const variation = hash(x, y, seed ^ 0x36d1),
        angle = 2 * Math.PI * hash(x, y, seed ^ 0x5a97),
        length =
          kind === 'lotusleaf'
            ? 0.65 + 0.04 * variation
            : kind === 'bananaleaf'
              ? 0.76 + 0.04 * variation
              : 0.78 + 0.03 * variation,
        width =
          kind === 'lotusleaf'
            ? 0.61 + 0.04 * variation
            : kind === 'bananaleaf'
              ? 0.28 + 0.02 * variation
              : 0.5;
      return {
        variation,
        point: (a: number, b: number): [number, number] => [
          (x +
            0.45 +
            0.1 * hash(x, y, seed ^ 0x21b7) +
            length * a * Math.cos(angle) -
            width * b * Math.sin(angle)) /
            3,
          (y +
            0.45 +
            0.1 * hash(x, y, seed ^ 0x71e3) +
            length * a * Math.sin(angle) +
            width * b * Math.cos(angle)) /
            3,
        ],
      };
    };
    it('lotus leaves retain radial veins and raised central attachments', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('lotusleaf', seed);
        let radial = 0,
          attachments = 0;
        for (let y = 0; y < 3; y++)
          for (let x = 0; x < 3; x++) {
            const f = feature('lotusleaf', x, y, seed),
              at = (radius: number, angle: number) => {
                const out = empty(),
                  p = f.point(
                    radius * Math.cos(angle),
                    radius * Math.sin(angle),
                  );
                sample(p[0], p[1], out);
                return out.height;
              };
            let rays = 0;
            for (let i = 0; i < 12; i++) {
              const angle = (i * Math.PI) / 6 + 0.15 * f.variation;
              if (at(0.5, angle) > at(0.5, angle + Math.PI / 12)) rays++;
            }
            if (rays >= 8) radial++;
            if (at(0, 0) > at(0.2, Math.PI / 12 + 0.15 * f.variation))
              attachments++;
          }
        // Layering may hide one leaf, but must not erase the overall morphology.
        expect(radial).toBeGreaterThanOrEqual(3);
        expect(attachments).toBeGreaterThanOrEqual(3);
      }
    });
    it('banana panels have a strong midrib and repeated oblique side veins', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('bananaleaf', seed);
        let panels = 0;
        for (let y = 0; y < 3; y++)
          for (let x = 0; x < 3; x++) {
            const f = feature('bananaleaf', x, y, seed),
              at = (a: number, b: number) => {
                const out = empty(),
                  p = f.point(a, b);
                sample(p[0], p[1], out);
                return out.height;
              };
            let peaks = 0;
            for (let i = 1; i < 120; i++) {
              const a = -0.6 + i * 0.01;
              if (
                at(a, 0.45) > at(a - 0.01, 0.45) &&
                at(a, 0.45) > at(a + 0.01, 0.45)
              )
                peaks++;
            }
            if (peaks >= 8 && at(0, 0) > at(0, 0.2)) panels++;
          }
        expect(panels).toBeGreaterThanOrEqual(3);
      }
    });
    it('fern fronds separate alternating pinnae and retain fine pinna veins', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('fernleaf', seed);
        let fronds = 0,
          veined = 0;
        for (let y = 0; y < 3; y++)
          for (let x = 0; x < 3; x++) {
            const f = feature('fernleaf', x, y, seed),
              at = (a: number, b: number) => {
                const out = empty(),
                  p = f.point(a, b);
                sample(p[0], p[1], out);
                return out.height;
              };
            let alternating = 0;
            for (let i = 2; i < 12; i++) {
              const root = -0.7 + i * 0.105,
                side = i % 2 === 0 ? 1 : -1;
              if (
                at(root + 0.075, side * 0.25) > at(root + 0.075, -side * 0.25)
              )
                alternating++;
            }
            if (alternating >= 7) fronds++;
            // An off-midrib path inside one pinna must have repeated relief,
            // rather than the single maximum of an un-veined smooth oval.
            let peaks = 0;
            const trace = (t: number) => {
              const b = t * (0.68 - 0.36 * 0.07 * 0.07);
              return at(-0.07 + 0.3 * b + 0.043 * 0.45, b);
            };
            for (let i = 1; i < 80; i++) {
              const t = 0.3 + i * 0.005;
              if (trace(t) > trace(t - 0.005) && trace(t) > trace(t + 0.005))
                peaks++;
            }
            if (peaks >= 2) veined++;
          }
        expect(fronds).toBeGreaterThanOrEqual(3);
        expect(veined).toBeGreaterThanOrEqual(3);
      }
    });
    it.each(['lotusleaf', 'bananaleaf', 'fernleaf'] as const)(
      '%s has convergent slopes at origins, branches, supports, overlaps and wrap seams',
      (kind) => {
        for (const seed of [1, 123, 0xffffffff]) {
          const sample = createSurfaceSampler(kind, seed),
            points: [number, number][] = [
              [0, 0],
              [0, 0.137],
              [0.791, 1],
              [1 / 3, 0.47],
              [0.29, 2 / 3],
            ];
          for (const [x, y] of [
            [0, 0],
            [1, 2],
            [2, 1],
          ]) {
            const f = feature(kind, x, y, seed);
            for (const [a, b] of [
              [0, 0],
              [-1, 0],
              [1, 0],
              [0, -1],
              [0, 1],
              [0, Math.sqrt(0.76)],
              [0, -Math.sqrt(0.76)],
              [Math.sqrt(0.76), 0],
              [-Math.sqrt(0.76), 0],
              [0.5, 0],
              [0.3, 0.2],
              [-0.4, -0.3],
            ])
              points.push(f.point(a, b));
            if (kind === 'lotusleaf')
              for (const radius of [0.03, 0.13, 0.5]) {
                const angle = 0.15 * f.variation;
                points.push(
                  f.point(radius * Math.cos(angle), radius * Math.sin(angle)),
                );
              }
            if (kind === 'fernleaf')
              for (const [a, b] of [
                [-0.9, 0],
                [0.9, 0],
                [0, -0.04],
                [0, 0.04],
                [-0.9 * Math.sqrt(0.65), 0],
                [0.9 * Math.sqrt(0.65), 0],
                [0, -0.04 * Math.sqrt(0.65)],
                [0, 0.04 * Math.sqrt(0.65)],
              ])
                points.push(f.point(a, b));
            if (kind === 'fernleaf')
              for (const i of [0, 6, 13]) {
                const root = -0.7 + i * 0.105,
                  side = i % 2 === 0 ? 1 : -1,
                  length = 0.68 - 0.36 * root * root;
                for (const t of [0, 0.5, 1]) {
                  const b = side * length * t;
                  points.push(f.point(root + 0.3 * b * side, b));
                }
                for (const across of [
                  -1,
                  -Math.sqrt(0.65),
                  Math.sqrt(0.65),
                  1,
                ]) {
                  const b = side * length * 0.5;
                  points.push(
                    f.point(root + 0.3 * b * side + 0.043 * across, b),
                  );
                }
              }
          }
          const center = empty(),
            left = empty(),
            right = empty(),
            coarseLeft = empty(),
            coarseRight = empty();
          for (const [u, v] of points)
            for (const [du, dv] of [
              [2e-7, 0],
              [0, 2e-7],
              [1.2e-7, 1.6e-7],
            ]) {
              sample(u, v, center);
              sample(u - du, v - dv, left);
              sample(u + du, v + dv, right);
              sample(u - 4 * du, v - 4 * dv, coarseLeft);
              sample(u + 4 * du, v + 4 * dv, coarseRight);
              for (const key of Object.keys(
                center,
              ) as (keyof SurfaceSample)[]) {
                const fineJump =
                    Math.abs(left[key] + right[key] - 2 * center[key]) / 2e-7,
                  coarseJump =
                    Math.abs(
                      coarseLeft[key] + coarseRight[key] - 2 * center[key],
                    ) / 8e-7;
                expect(fineJump).toBeLessThanOrEqual(0.4 * coarseJump + 2e-8);
              }
            }
        }
      },
    );
  });
  describe('bulk grain silhouettes and relief', () => {
    const empty = (): SurfaceSample => ({
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    });
    const hash = (x: number, y: number, seed: number): number => {
      let n =
        (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
      n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
      n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    // Reconstruct only seeded placements, not the surface channel formulas.
    const feature = (
      kind: 'rice' | 'sesame' | 'coffeebeans',
      x: number,
      y: number,
      seed: number,
    ) => {
      const variation = hash(x, y, seed ^ 0x37c1),
        angle = 2 * Math.PI * hash(x, y, seed ^ 0x5f39),
        cells = kind === 'rice' ? 12 : kind === 'sesame' ? 16 : 8,
        length =
          kind === 'rice'
            ? 0.62 + 0.09 * variation
            : kind === 'sesame'
              ? 0.48 + 0.06 * variation
              : 0.57 + 0.06 * variation,
        width =
          kind === 'rice'
            ? 0.14 + 0.025 * variation
            : kind === 'sesame'
              ? 0.24 + 0.025 * variation
              : 0.36 + 0.03 * variation;
      return {
        variation,
        cells,
        point: (a: number, b: number): [number, number] => [
          (x +
            0.35 +
            0.3 * hash(x, y, seed ^ 0x18a7) +
            length * a * Math.cos(angle) -
            width * b * Math.sin(angle)) /
            cells,
          (y +
            0.35 +
            0.3 * hash(x, y, seed ^ 0x6d23) +
            length * a * Math.sin(angle) +
            width * b * Math.cos(angle)) /
            cells,
        ],
      };
    };
    it.each(['rice', 'sesame', 'coffeebeans'] as const)(
      '%s retains its kernel, asymmetric keel or recessed curved split',
      (kind) => {
        for (const seed of [1, 123, 0xffffffff]) {
          const sample = createSurfaceSampler(kind, seed);
          let observed = 0;
          for (let y = 0; y < 4; y++)
            for (let x = 0; x < 4; x++) {
              const f = feature(kind, x, y, seed),
                at = (a: number, b: number) => {
                  const out = empty(),
                    p = f.point(a, b);
                  sample(p[0], p[1], out);
                  return out;
                };
              if (kind === 'rice') {
                // A physical offset along the kernel remains on its crown;
                // the same offset across it is outside the slender silhouette.
                if (at(0.45, 0).height > at(0, 2).height) observed++;
              } else if (kind === 'sesame') {
                if (
                  at(-0.5, 0.8).height > at(0.5, 0.8).height &&
                  at(0, 0).height > at(0, 0.5).height
                )
                  observed++;
              } else {
                let splitSections = 0;
                for (const a of [-0.55, 0, 0.55]) {
                  const bend = 0.16 * Math.sin(2.8 * a + f.variation - 0.5),
                    floor = at(a, bend),
                    left = at(a, bend - 0.27),
                    right = at(a, bend + 0.27);
                  if (
                    floor.height < left.height &&
                    floor.height < right.height &&
                    floor.occlusion < left.occlusion &&
                    floor.occlusion < right.occlusion
                  )
                    splitSections++;
                }
                if (splitSections === 3) observed++;
              }
            }
          // Overlaps may cover a particular seed, but cannot erase its
          // characteristic geometry throughout a seeded bulk surface.
          expect(observed).toBeGreaterThanOrEqual(8);
        }
      },
    );
    it.each(['rice', 'sesame', 'coffeebeans'] as const)(
      '%s has convergent slopes at supports, tips, centers, overlaps and wrap seams',
      (kind) => {
        for (const seed of [1, 123, 0xffffffff]) {
          const sample = createSurfaceSampler(kind, seed),
            points: [number, number][] = [
              [0, 0],
              [0, 0.137],
              [0.791, 1],
            ];
          for (let y = 0; y < 3; y++)
            for (let x = 0; x < 3; x++) {
              const f = feature(kind, x, y, seed);
              for (const [a, b] of [
                [0, 0],
                [-1, 0],
                [1, 0],
                [0, -1],
                [0, 1],
                [0, Math.sqrt(0.68)],
                [0, -Math.sqrt(0.68)],
                [-0.5, 0.8],
                [0.5, 0.8],
              ])
                points.push(f.point(a, b));
              if (kind === 'coffeebeans')
                for (const a of [-0.7, 0, 0.7])
                  points.push(
                    f.point(a, 0.16 * Math.sin(2.8 * a + f.variation - 0.5)),
                  );
              // Cell ownership changes must not change any channel.
              points.push([x / f.cells, (y + 0.43) / f.cells]);
              points.push([(x + 0.37) / f.cells, y / f.cells]);
            }
          const center = empty(),
            a = empty(),
            b = empty(),
            coarseA = empty(),
            coarseB = empty();
          for (const [u, v] of points)
            for (const [du, dv] of [
              [2.5e-7, 0],
              [0, 2.5e-7],
              [1.5e-7, 2e-7],
            ]) {
              sample(u, v, center);
              sample(u - du, v - dv, a);
              sample(u + du, v + dv, b);
              sample(u - 4 * du, v - 4 * dv, coarseA);
              sample(u + 4 * du, v + 4 * dv, coarseB);
              for (const key of Object.keys(
                center,
              ) as (keyof SurfaceSample)[]) {
                expect(center[key]).toBeGreaterThanOrEqual(0);
                expect(center[key]).toBeLessThanOrEqual(1);
                expect(Math.abs(a[key] - b[key])).toBeLessThan(0.001);
                const fineJump =
                    Math.abs(a[key] + b[key] - 2 * center[key]) / 2.5e-7,
                  coarseJump =
                    Math.abs(coarseA[key] + coarseB[key] - 2 * center[key]) /
                    1e-6;
                expect(fineJump).toBeLessThanOrEqual(0.4 * coarseJump + 1e-8);
              }
            }
        }
      },
    );
  });
  describe('polished decorative mineral surfaces', () => {
    const tau = 2 * Math.PI;
    const empty = (): SurfaceSample => ({
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    });
    const hash = (x: number, y: number, seed: number): number => {
      let n =
        (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
      n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
      n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    const phase = (seed: number) => [
      tau * hash(0, 0, seed ^ 0x35a7),
      tau * hash(0, 0, seed ^ 0x6c19),
    ];
    const growth = (
      kind: 'malachite' | 'agate',
      a: number,
      b: number,
    ): number => {
      const x = a + 0.28 * Math.sin(b),
        y = b + 0.18 * Math.sin(a);
      return (
        3 *
          (1 -
            0.5 * (Math.cos(x) + Math.cos(y)) +
            (kind === 'agate' ? 0.22 * (1 - Math.cos(2 * x - y)) : 0)) +
        0.1 * Math.sin(x) * Math.sin(y)
      );
    };
    const bisect = (
      fn: (x: number) => number,
      lo: number,
      hi: number,
    ): number => {
      const sign = Math.sign(fn(lo));
      expect(sign * fn(hi)).toBeLessThanOrEqual(0);
      for (let i = 0; i < 56; i++) {
        const mid = (lo + hi) / 2;
        if (Math.sign(fn(mid)) === sign) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    };
    const vein = (u: number, v: number, p: number, q: number): number =>
      Math.sin(tau * (u + v) + p) + 0.22 * Math.sin(tau * 3 * v + q);
    const crossVein = (u: number, v: number, p: number, q: number): number =>
      Math.sin(tau * (2 * u - v) + q) + 0.18 * Math.sin(tau * 2 * v + p);
    const veinU = (v: number, target: number, p: number, q: number): number =>
      (Math.asin(target - 0.22 * Math.sin(tau * 3 * v + q)) - p) / tau - v;
    const calciteNoise = (u: number, v: number, seed: number): number => {
      const x = (u - Math.floor(u)) * 8,
        y = (v - Math.floor(v)) * 8,
        ix = Math.floor(x),
        iy = Math.floor(y),
        sx = (x - ix) ** 2 * (3 - 2 * (x - ix)),
        sy = (y - iy) ** 2 * (3 - 2 * (y - iy)),
        a = hash(ix, iy, seed ^ 0x4d29),
        b = hash((ix + 1) % 8, iy, seed ^ 0x4d29),
        c = hash(ix, (iy + 1) % 8, seed ^ 0x4d29),
        d = hash((ix + 1) % 8, (iy + 1) % 8, seed ^ 0x4d29);
      return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
    };
    it.each(['malachite', 'agate'] as const)(
      '%s has nested raised light bands separated by rougher recessed dark growth',
      (kind) => {
        for (const seed of [1, 123, 0xffffffff]) {
          const [p, q] = phase(seed),
            columns = kind === 'malachite' ? 3 : 1,
            sample = createSurfaceSampler(kind, seed),
            b = 0.55;
          const points = [1, 1.5, 2].map((level) => {
            const a = bisect((a) => growth(kind, a, b) - level, 0, 2.8),
              out = empty();
            sample((a - p) / (tau * columns), (b - q) / (tau * 3), out);
            return out;
          });
          for (const crest of [points[0], points[2]]) {
            expect(crest.color).toBeGreaterThan(points[1].color + 0.7);
            expect(crest.height).toBeGreaterThan(points[1].height);
            expect(crest.roughness).toBeLessThan(points[1].roughness);
            expect(crest.occlusion).toBeGreaterThan(points[1].occlusion);
          }
        }
      },
    );
    it('agate retains distinct growth contours after normalizing its elongated scale', () => {
      const round = createSurfaceSampler('malachite', 123),
        elongated = createSurfaceSampler('agate', 123),
        a = empty(),
        b = empty();
      let difference = 0;
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) {
          const u = (x + 0.31) / 48,
            v = (y + 0.67) / 16;
          round(u, v, a);
          elongated(u * 3, v, b);
          difference += Math.abs(a.color - b.color);
        }
      // Micrograin alone cannot account for a macroscopic contour difference.
      expect(difference / 256).toBeGreaterThan(0.1);
    });
    it('lapis calcite veins own pale raised rougher transitions and blend at crossings', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const [p, q] = phase(seed),
          sample = createSurfaceSampler('lapislazuli', seed);
        let checked = 0,
          crossings = 0,
          inclusions = 0;
        for (let i = 0; i < 96; i++) {
          const v = (i + 0.37) / 96,
            centerU = veinU(v, 0, p, q),
            shoulderU = veinU(v, 0.07, p, q),
            matrixU = veinU(v, 0.14, p, q);
          if (
            Math.abs(crossVein(shoulderU, v, p, q)) > 0.09 &&
            Math.abs(crossVein(matrixU, v, p, q)) > 0.09 &&
            calciteNoise(shoulderU, v, seed) < 0.64 &&
            calciteNoise(matrixU, v, seed) < 0.64
          ) {
            const center = empty(),
              shoulder = empty(),
              matrix = empty();
            sample(centerU, v, center);
            sample(shoulderU, v, shoulder);
            sample(matrixU, v, matrix);
            for (const key of [
              'color',
              'height',
              'roughness',
              'occlusion',
            ] as const) {
              expect(center[key]).toBeGreaterThan(shoulder[key]);
              expect(shoulder[key]).toBeGreaterThan(matrix[key]);
            }
            checked++;
          }
          const nextV = v + 1 / 96,
            crossing = (v: number) => crossVein(veinU(v, 0, p, q), v, p, q);
          if (crossing(v) * crossing(nextV) < 0) {
            const cv = bisect(crossing, v, nextV),
              out = empty();
            sample(veinU(cv, 0, p, q), cv, out);
            expect(out.color).toBeGreaterThan(0.85);
            expect(out.metallic).toBe(0);
            crossings++;
          }
          for (let j = 0; j < 32; j++) {
            const u = (j + 0.41) / 32;
            if (
              Math.abs(vein(u, v, p, q)) < 0.12 ||
              Math.abs(crossVein(u, v, p, q)) < 0.08 ||
              calciteNoise(u, v, seed) < 0.86
            )
              continue;
            const out = empty();
            sample(u, v, out);
            expect(out.color).toBeGreaterThan(0.7);
            expect(out.metallic).toBe(0);
            inclusions++;
          }
        }
        expect(checked).toBeGreaterThan(0);
        expect(crossings).toBeGreaterThan(0);
        expect(inclusions).toBeGreaterThan(0);
      }
    });
    it.each(['malachite', 'agate', 'lapislazuli'] as const)(
      '%s is bounded C1 through actual non-axis ownership, bands and inclusion shoulders',
      (kind) => {
        for (const seed of [1, 123, 0xffffffff]) {
          const [p, q] = phase(seed),
            sample = createSurfaceSampler(kind, seed),
            points: number[][] = [
              [0, 0],
              [0, 0.137],
              [0.791, 1],
              [3 / 64, 7 / 64],
            ];
          if (kind !== 'lapislazuli') {
            const columns = kind === 'malachite' ? 3 : 1;
            for (const [a, b] of [
              [0, 0],
              [Math.PI, 0],
              [Math.PI, Math.PI],
            ])
              points.push([(a - p) / (tau * columns), (b - q) / (tau * 3)]);
            for (const b of [0.55, 0.9])
              for (const level of [1, 1.25, 1.5, 2]) {
                const a = bisect((a) => growth(kind, a, b) - level, 0, 2.8);
                points.push([(a - p) / (tau * columns), (b - q) / (tau * 3)]);
              }
          } else {
            for (const v of [0.137, 0.481, 0.793])
              for (const target of [-0.1, -0.07, 0, 0.07, 0.1])
                points.push([veinU(v, target, p, q), v]);
            for (const v of [0.137, 0.481, 0.793])
              for (const target of [-0.065, 0, 0.065]) {
                const u =
                  ((Math.asin(target - 0.18 * Math.sin(tau * 2 * v + p)) - q) /
                    tau +
                    v) /
                  2;
                points.push([u, v]);
              }
            for (let i = 0; i < 64; i++) {
              const v = (i + 0.37) / 64,
                nextV = v + 1 / 64,
                crossing = (v: number) => crossVein(veinU(v, 0, p, q), v, p, q);
              if (crossing(v) * crossing(nextV) < 0) {
                const cv = bisect(crossing, v, nextV);
                points.push([veinU(cv, 0, p, q), cv]);
              }
              for (const threshold of [0.64, 0.86]) {
                const fn = (u: number) => calciteNoise(u, v, seed) - threshold;
                for (let j = 0; j < 8; j++)
                  if (fn(j / 8) * fn((j + 1) / 8) < 0)
                    points.push([bisect(fn, j / 8, (j + 1) / 8), v]);
              }
            }
          }
          for (const [u, v] of points)
            for (const [du, dv] of [
              [2.5e-7, 0],
              [0, 2.5e-7],
              [1.5e-7, 2e-7],
            ]) {
              const a = empty(),
                b = empty(),
                coarseA = empty(),
                coarseB = empty(),
                center = empty();
              sample(u - du, v - dv, a);
              sample(u, v, center);
              sample(u + du, v + dv, b);
              sample(u - 4 * du, v - 4 * dv, coarseA);
              sample(u + 4 * du, v + 4 * dv, coarseB);
              for (const key of Object.keys(
                center,
              ) as (keyof SurfaceSample)[]) {
                expect(center[key]).toBeGreaterThanOrEqual(0);
                expect(center[key]).toBeLessThanOrEqual(1);
                expect(Math.abs(a[key] - b[key])).toBeLessThan(0.001);
                // C1 requires the slope jump to converge, not a global curvature cap.
                const coarseJump =
                  Math.abs(coarseA[key] + coarseB[key] - 2 * center[key]) /
                  1e-6;
                const fineJump =
                  Math.abs(a[key] + b[key] - 2 * center[key]) / 2.5e-7;
                expect(fineJump).toBeLessThanOrEqual(0.4 * coarseJump + 1e-8);
              }
            }
        }
      },
    );
  });
  describe('volcanic surface relief', () => {
    interface VolcanicFeature {
      x: number;
      y: number;
      rx: number;
      ry: number;
      cosine: number;
      sine: number;
    }
    const empty = (): SurfaceSample => ({
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    });
    const hash = (x: number, y: number, seed: number): number => {
      let n =
        (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
      n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
      n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    const feature = (
      kind: 'scoria' | 'obsidian',
      x: number,
      y: number,
      seed: number,
    ): VolcanicFeature => {
      const cells = kind === 'scoria' ? 10 : 4,
        wx = ((x % cells) + cells) % cells,
        wy = ((y % cells) + cells) % cells,
        variation = hash(wx, wy, seed ^ 0x3d71),
        angle = 2 * Math.PI * hash(wx, wy, seed ^ 0x6a29),
        radius =
          kind === 'scoria' ? 0.32 + 0.12 * variation : 0.65 + 0.13 * variation;
      return {
        x: x + 0.35 + 0.3 * hash(wx, wy, seed ^ 0x2f59),
        y: y + 0.35 + 0.3 * hash(wx, wy, seed ^ 0x7c43),
        rx: radius,
        ry: radius * (0.7 + 0.25 * hash(wx, wy, seed ^ 0x4e13)),
        cosine: Math.cos(angle),
        sine: Math.sin(angle),
      };
    };
    const point = (f: VolcanicFeature, x: number, y: number): number[] => [
      f.x + f.cosine * f.rx * x - f.sine * f.ry * y,
      f.y + f.sine * f.rx * x + f.cosine * f.ry * y,
    ];
    const isolated = (
      kind: 'scoria' | 'obsidian',
      column: number,
      row: number,
      seed: number,
      points: number[][],
    ): boolean => {
      for (let oy = -2; oy <= 2; oy++)
        for (let ox = -2; ox <= 2; ox++) {
          if (ox === 0 && oy === 0) continue;
          const f = feature(kind, column + ox, row + oy, seed);
          for (const [x, y] of points) {
            const dx = x - f.x,
              dy = y - f.y;
            if (
              ((dx * f.cosine + dy * f.sine) / f.rx) ** 2 +
                ((-dx * f.sine + dy * f.cosine) / f.ry) ** 2 <
              1
            )
              return false;
          }
        }
      return true;
    };
    it('basalt caps rise above dark recessed joints with rounded shoulders', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('basalt', seed);
        for (const [column, row] of [
          [0, 0],
          [3, 5],
          [5, 7],
        ]) {
          const x = column + (row % 2) * 0.5 + 0.5,
            y = row + 0.5,
            width = 0.46 + 0.025 * hash(column, row, seed ^ 0x3d71),
            cap = empty(),
            shoulder = empty(),
            joint = empty();
          sample(x / 6, y / 8, cap);
          sample((x + width - 0.0325) / 6, y / 8, shoulder);
          sample((x + 0.5) / 6, y / 8, joint);
          expect(cap.height).toBeGreaterThan(shoulder.height);
          expect(shoulder.height).toBeGreaterThan(joint.height);
          expect(cap.color).toBeGreaterThan(joint.color);
          expect(cap.occlusion).toBeGreaterThan(joint.occlusion);
          expect(joint.roughness).toBeGreaterThan(cap.roughness);
        }
      }
    });
    it('scoria has recessed gas pits, raised rims and intact bodies', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('scoria', seed);
        let checked = 0;
        for (let row = 0; row < 10; row++)
          for (let column = 0; column < 10; column++) {
            const f = feature('scoria', column, row, seed);
            for (let ray = 0; ray < 8; ray++) {
              const angle = (ray * Math.PI) / 4,
                points = [
                  point(f, 0, 0),
                  point(
                    f,
                    Math.sqrt(0.68) * Math.cos(angle),
                    Math.sqrt(0.68) * Math.sin(angle),
                  ),
                  point(f, 1.1 * Math.cos(angle), 1.1 * Math.sin(angle)),
                ];
              if (!isolated('scoria', column, row, seed, points)) continue;
              const [pit, rim, body] = points.map(([x, y]) => {
                const out = empty();
                sample(x / 10, y / 10, out);
                return out;
              });
              expect(pit.height).toBeLessThan(body.height);
              expect(rim.height).toBeGreaterThan(body.height);
              expect(pit.color).toBeLessThan(body.color);
              expect(pit.occlusion).toBeLessThan(body.occlusion);
              expect(pit.roughness).toBeGreaterThan(rim.roughness);
              checked++;
              break;
            }
          }
        expect(checked).toBeGreaterThan(0);
      }
    });
    it('obsidian fracture fronts follow curved flake interiors, not straight scratches', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('obsidian', seed);
        let checked = 0,
          bodies = 0;
        for (let row = 0; row < 4; row++)
          for (let column = 0; column < 4; column++) {
            const f = feature('obsidian', column, row, seed);
            for (let ray = 0; ray < 16; ray++) {
              const angle = (ray * Math.PI) / 8,
                points = [
                  point(f, 0, 0),
                  point(f, 1.1 * Math.cos(angle), 1.1 * Math.sin(angle)),
                ];
              if (!isolated('obsidian', column, row, seed, points)) continue;
              const [flake, body] = points.map(([x, y]) => {
                const out = empty();
                sample(x / 4, y / 4, out);
                return out;
              });
              expect(flake.height).toBeLessThan(body.height);
              expect(flake.occlusion).toBeLessThan(body.occlusion);
              expect(flake.roughness).toBeGreaterThan(body.roughness);
              bodies++;
              break;
            }
            for (const ly of [-0.35, 0, 0.35]) {
              const lx = -0.36 + 1.2 * ly * ly,
                points = [point(f, lx, ly), point(f, lx + 0.16, ly)];
              if (!isolated('obsidian', column, row, seed, points)) continue;
              const [edge, flake] = points.map(([x, y]) => {
                const out = empty();
                sample(x / 4, y / 4, out);
                return out;
              });
              expect(edge.height).toBeGreaterThan(flake.height);
              expect(edge.color).toBeGreaterThan(flake.color);
              expect(edge.roughness).toBeGreaterThan(flake.roughness);
              checked++;
            }
          }
        expect(checked).toBeGreaterThan(0);
        expect(bodies).toBeGreaterThan(0);
      }
    });
    it.each(['basalt', 'scoria', 'obsidian'] as const)(
      '%s is C1 at seeded support boundaries, diagonal corners, origins and seams',
      (kind) => {
        for (const seed of [1, 123, 0xffffffff]) {
          const sample = createSurfaceSampler(kind, seed),
            points: number[][] = [
              [0, 0],
              [0, 0.137],
              [0.791, 1],
            ];
          for (const [column, row] of [
            [0, 0],
            [3, 3],
          ]) {
            if (kind === 'basalt') {
              const a = 0.46 + 0.025 * hash(column, row, seed ^ 0x3d71),
                b = 0.46 + 0.025 * hash(column, row, seed ^ 0x6a29),
                c = 0.46 + 0.025 * hash(column, row, seed ^ 0x7c43),
                x = column + (row % 2) * 0.5 + 0.5,
                y = row + 0.5;
              for (const t of [0, 0.0325, 0.065]) {
                const dx = a - t,
                  dy = (b - t - 0.5 * dx) / 0.75;
                points.push([(x + dx) / 6, (y + dy) / 8]);
                points.push([(x + b - c) / 6, (y + (b + c - 2 * t) / 1.5) / 8]);
              }
            } else {
              const f = feature(kind, column, row, seed),
                cells = kind === 'scoria' ? 10 : 4;
              for (const q of [0, 0.42, 0.6, 0.7, 0.75, 0.8, 1])
                for (const angle of [0.37, 1.13, 2.41]) {
                  const p = point(
                    f,
                    Math.sqrt(q) * Math.cos(angle),
                    Math.sqrt(q) * Math.sin(angle),
                  );
                  points.push([p[0] / cells, p[1] / cells]);
                }
              if (kind === 'obsidian')
                for (const ly of [-0.6, 0, 0.6])
                  for (const offset of [-0.08, 0, 0.08]) {
                    const p = point(f, -0.36 + 1.2 * ly * ly + offset, ly);
                    points.push([p[0] / cells, p[1] / cells]);
                  }
              if (kind === 'obsidian')
                for (const offset of [-0.08, 0, 0.08]) {
                  const k = -0.36 + offset,
                    b = 1 + 2.4 * k,
                    squaredY =
                      (-b + Math.sqrt(b * b - 5.76 * (k * k - 1))) / 2.88;
                  for (const sign of [-1, 1]) {
                    const p = point(
                      f,
                      k + 1.2 * squaredY,
                      sign * Math.sqrt(squaredY),
                    );
                    points.push([p[0] / cells, p[1] / cells]);
                  }
                }
            }
          }
          const a = empty(),
            b = empty(),
            center = empty(),
            halfA = empty(),
            halfB = empty();
          for (const [u, v] of points)
            for (const [du, dv] of [
              [1e-8, 0],
              [0, 1e-8],
              [6e-9, 8e-9],
            ]) {
              sample(u - du, v - dv, a);
              sample(u, v, center);
              sample(u + du, v + dv, b);
              sample(u - du / 2, v - dv / 2, halfA);
              sample(u + du / 2, v + dv / 2, halfB);
              for (const key of Object.keys(a) as (keyof SurfaceSample)[]) {
                expect(center[key]).toBeGreaterThanOrEqual(0);
                expect(center[key]).toBeLessThanOrEqual(1);
                expect(Math.abs(a[key] - b[key])).toBeLessThan(0.001);
                expect(
                  Math.abs(
                    4 * (halfA[key] + halfB[key]) -
                      a[key] -
                      b[key] -
                      6 * center[key],
                  ) / 1e-8,
                ).toBeLessThan(0.001);
              }
            }
        }
      },
    );
  });
  describe('botanical surface relief', () => {
    const empty = (): SurfaceSample => ({
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    });
    const hash = (x: number, y: number, seed: number): number => {
      let n =
        (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
      n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
      n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    it('cactus has longitudinal ribs, rough areoles and recessed radial marks', () => {
      const crest = empty(),
        groove = empty(),
        areole = empty(),
        mark = empty(),
        skin = empty();
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('cactus', seed);
        for (const [column, row] of [
          [0, 0],
          [3, 5],
          [7, 7],
        ]) {
          const x = column + 0.5,
            y = row + 0.5 + 0.12 * (hash(column, row, seed ^ 0x2d59) - 0.5),
            angle = hash(column, row, seed ^ 0x7f31) * Math.PI * 2,
            rx = Math.cos(angle),
            ry = Math.sin(angle);
          sample(x / 8, (y + 0.45) / 8, crest);
          sample((x - 0.5) / 8, (y + 0.45) / 8, groove);
          sample(x / 8, y / 8, areole);
          expect(crest.height).toBeGreaterThan(groove.height);
          expect(areole.roughness).toBeGreaterThan(crest.roughness);
          const mx = x + 0.24 * rx,
            my = y + 0.24 * ry;
          sample(mx / 8, my / 8, mark);
          // The row boundary shares the rib's x coordinate but lies beyond
          // either row's areole support, so relief scaling cancels naturally.
          sample(mx / 8, (row + 1) / 8, skin);
          expect(mark.height).toBeLessThan(skin.height);
          expect(mark.roughness).toBeGreaterThan(skin.roughness);
        }
      }
    });
    it('pinecone exposes raised angular tips above centers and overlap seams', () => {
      const tip = empty(),
        center = empty(),
        seam = empty(),
        root = empty();
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('pinecone', seed);
        for (const [column, row] of [
          [0, 0],
          [3, 5],
          [7, 7],
        ]) {
          const x = column + (row % 2) * 0.5 + 0.5,
            y = row + 0.5;
          sample(x / 8, y / 8, center);
          sample(x / 8, (y + 0.6) / 8, tip);
          sample((x + 0.35) / 8, (y + 0.6) / 8, seam);
          sample(x / 8, (y + 0.86) / 8, root);
          expect(tip.height).toBeGreaterThan(center.height);
          expect(tip.height).toBeGreaterThan(seam.height);
          expect(tip.height).toBeGreaterThan(root.height);
        }
      }
    });
    it('corn has rounded oblong crowns and narrow recessed interstices', () => {
      const crown = empty(),
        shoulder = empty(),
        gap = empty(),
        along = empty(),
        across = empty();
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('corncob', seed);
        for (const [column, row] of [
          [0, 0],
          [5, 3],
          [11, 7],
        ]) {
          const u = (column + 0.5) / 12,
            v = (row + 0.5) / 8;
          sample(u, v, crown);
          for (const [du, dv] of [
            [0.3 / 12, 0],
            [0, 0.3 / 8],
          ]) {
            sample(u + du, v + dv, shoulder);
            sample(u + (du * 5) / 3, v + (dv * 5) / 3, gap);
            expect(crown.height).toBeGreaterThan(shoulder.height);
            expect(shoulder.height).toBeGreaterThan(gap.height);
            expect(crown.occlusion).toBeGreaterThan(gap.occlusion);
          }
          sample(u, v + 0.025, along);
          sample(u + 0.025, v, across);
          expect(along.height).toBeGreaterThan(across.height);
        }
      }
    });
    it.each(['cactus', 'pinecone', 'corncob'] as const)(
      '%s is C1 at actual seeded shoulders, tips, corners and support',
      (kind) => {
        const a = empty(),
          b = empty(),
          center = empty(),
          halfA = empty(),
          halfB = empty();
        for (const seed of [1, 123, 0xffffffff]) {
          const sample = createSurfaceSampler(kind, seed);
          for (const [column, row] of [
            [0, 0],
            [3, 5],
            [7, 7],
          ]) {
            const points: number[][] = [];
            const x = column + 0.5,
              y = row + 0.5;
            if (kind === 'cactus') {
              const cy = y + 0.12 * (hash(column, row, seed ^ 0x2d59) - 0.5),
                angle = hash(column, row, seed ^ 0x7f31) * Math.PI * 2,
                length = 0.28 + 0.08 * hash(column, row, seed ^ 0x4a73);
              points.push([(x + 0.14) / 8, cy / 8], [x / 8, (cy + 0.13) / 8]);
              for (let ray = 0; ray < 8; ray++) {
                const rx = Math.cos(angle + (ray * Math.PI) / 4),
                  ry = Math.sin(angle + (ray * Math.PI) / 4);
                for (const distance of [0.09, 0.145, length - 0.085, length])
                  points.push([
                    (x + distance * rx) / 8,
                    (cy + distance * ry) / 8,
                  ]);
                points.push([
                  (x + 0.24 * rx - 0.015 * ry) / 8,
                  (cy + 0.24 * ry + 0.015 * rx) / 8,
                ]);
              }
            } else if (kind === 'pinecone') {
              const cx = x + (row % 2) * 0.5;
              for (const dy of [-0.78, -0.66, 0.74, 0.86])
                for (const dx of [0, 0.68 - 0.55 * dy, 0.58 - 0.55 * dy])
                  for (const sign of [-1, 1])
                    points.push([(cx + sign * dx) / 8, (y + dy) / 8]);
              points.push([cx / 8, (y - 0.05) / 8], [cx / 8, (y + 0.71) / 8]);
            } else {
              const variation = hash(column, row, seed ^ 0x4a73),
                width = 0.445 + 0.015 * variation,
                length = 0.46 + 0.015 * variation;
              for (const cap of [0, 0.28])
                for (const dx of [0, 0.4, 0.8]) {
                  const dy = Math.sqrt(1 - cap - dx ** 4);
                  for (const sign of [-1, 1])
                    points.push([
                      (x + dx * width) / 12,
                      (y + sign * dy * length) / 8,
                    ]);
                }
            }
            for (const [u, v] of points)
              for (const [du, dv] of [
                [1e-8, 0],
                [0, 1e-8],
              ]) {
                sample(u - du, v - dv, a);
                sample(u, v, center);
                sample(u + du, v + dv, b);
                sample(u - du / 2, v - dv / 2, halfA);
                sample(u + du / 2, v + dv / 2, halfB);
                for (const key of Object.keys(a) as (keyof SurfaceSample)[])
                  expect(
                    Math.abs(
                      4 * (halfA[key] + halfB[key]) -
                        a[key] -
                        b[key] -
                        6 * center[key],
                    ) / 1e-8,
                  ).toBeLessThan(0.001);
              }
          }
        }
      },
    );
  });
  it.each(kinds)(
    '%s is deterministic, seeded, distinct and periodic in both axes',
    (kind) => {
      const first = generateProceduralMaps(kind, 32, 123);
      expect(generateProceduralMaps(kind, 32, 123)).toEqual(first);
      expect(generateProceduralMaps(kind, 32, 124).baseColor).not.toEqual(
        first.baseColor,
      );
      const sample = createSurfaceSampler(kind, 123);
      const a: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      const b = { ...a };
      for (const [u, v] of [
        [0, 0],
        [0.123, 0.456],
        [-0.00001, 0.31],
        [0.6, 0.99999],
      ]) {
        sample(u, v, a);
        for (const [du, dv] of [
          [1, 0],
          [0, 1],
          [-1, 2],
        ]) {
          sample(u + du, v + dv, b);
          for (const key of Object.keys(a) as (keyof SurfaceSample)[])
            expect(b[key]).toBeCloseTo(a[key], 9);
        }
      }
      const metallic = new Set<number>();
      for (let p = 0; p < first.baseColor.length; p += 4) {
        expect(first.baseColor[p + 3]).toBe(255);
        expect(first.normal[p + 3]).toBe(255);
        expect(first.normal[p + 2]).toBeGreaterThanOrEqual(128);
        const nx = (first.normal[p] / 255) * 2 - 1;
        const ny = (first.normal[p + 1] / 255) * 2 - 1;
        const nz = (first.normal[p + 2] / 255) * 2 - 1;
        expect(Math.abs(Math.hypot(nx, ny, nz) - 1)).toBeLessThan(0.008);
        expect(first.metallicRoughness[p]).toBe(255);
        metallic.add(first.metallicRoughness[p + 2]);
        if (
          kind === 'metal' ||
          kind === 'diamondplate' ||
          kind === 'hammeredmetal' ||
          kind === 'galvanized' ||
          kind === 'corrugatedmetal' ||
          kind === 'standingseam' ||
          kind === 'damascus' ||
          kind === 'castiron' ||
          kind === 'pressedtin' ||
          kind === 'louveredmetal' ||
          kind === 'crowncaps' ||
          kind === 'rebar' ||
          kind === 'guilloche' ||
          kind === 'splitlockwashers' ||
          kind === 'hexnuts' ||
          kind === 'perforatedmetal' ||
          kind === 'expandedmetal' ||
          kind === 'wiremesh' ||
          kind === 'pyrite' ||
          kind === 'knurledmetal' ||
          kind === 'engineturned' ||
          kind === 'goldleaf' ||
          kind === 'rivetedmetal' ||
          kind === 'weldedmetal'
        )
          expect(first.metallicRoughness[p + 2]).toBe(255);
        else if (
          kind !== 'rust' &&
          kind !== 'copperpatina' &&
          kind !== 'chippedenamel' &&
          kind !== 'gabion' &&
          kind !== 'chainmail' &&
          kind !== 'draincover'
        )
          expect(first.metallicRoughness[p + 2]).toBe(0);
        expect(first.metallicRoughness[p + 3]).toBe(255);
        expect(first.occlusion[p]).toBeGreaterThan(0);
        expect(first.occlusion[p + 3]).toBe(255);
      }
      if (
        kind === 'rust' ||
        kind === 'copperpatina' ||
        kind === 'chippedenamel' ||
        kind === 'gabion'
      ) {
        expect(Math.min(...metallic)).toBeLessThan(40);
        expect(Math.max(...metallic)).toBeGreaterThan(200);
      }
      if (kind === 'chainmail' || kind === 'draincover') {
        expect(metallic.has(0)).toBe(true);
        expect(metallic.has(255)).toBe(true);
        expect([...metallic].some((value) => value > 0 && value < 255)).toBe(
          true,
        );
      }
    },
  );

  it.each([
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
  ] as const)(
    '%s remains continuous across wrapped seams and textile cell boundaries',
    (kind) => {
      const sample = createSurfaceSampler(kind, 123);
      const a: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      const b = { ...a };
      const epsilon = 1e-7;
      const cells =
        kind === 'burlap' ? 10 : kind === 'denim' || kind === 'carpet' ? 24 : 1;
      for (let edge = 0; edge < cells; edge++) {
        const boundary = edge / cells;
        for (let i = 0; i < 24; i++) {
          const along = i / 24;
          for (const axis of [0, 1]) {
            sample(
              axis === 0 ? boundary - epsilon : along,
              axis === 1 ? boundary - epsilon : along,
              a,
            );
            sample(
              axis === 0 ? boundary + epsilon : along,
              axis === 1 ? boundary + epsilon : along,
              b,
            );
            for (const key of Object.keys(a) as (keyof SurfaceSample)[])
              expect(Math.abs(a[key] - b[key])).toBeLessThan(0.001);
          }
        }
      }
    },
  );

  it.each([
    ['plaster', [3, 5, 18, 32, 64]],
    ['terracotta', [5, 9, 12, 28, 32, 64]],
    ['cork', [14, 32, 64]],
    ['rubber', [32, 44, 64]],
    ['carbonfiber', [12, 24, 32, 48]],
    ['diamondplate', [4, 8, 32, 64]],
    ['paper', [3, 5, 24, 32, 48]],
    ['wicker', [3, 4, 6, 12, 32, 72]],
    ['bamboo', [3, 4, 32, 48, 64]],
    ['hammeredmetal', [4, 12, 32]],
    ['galvanized', [10, 32]],
    ['corrugatedmetal', [4, 8, 32, 48, 64]],
    ['perforatedmetal', [6, 12, 32]],
    ['expandedmetal', [5, 10, 32]],
    ['wiremesh', [12, 24, 32]],
    ['velvet', [3, 5, 32, 96]],
    ['terrycloth', [8, 10, 32]],
    ['boucle', [6, 8, 32]],
    ['geode', [6, 9, 32, 48]],
    ['quartz', [5, 32]],
    ['pyrite', [5, 26, 32]],
    ['shiplap', [5, 12, 32, 48]],
    ['glassblock', [4, 32]],
    ['thatch', [3, 6, 32, 80]],
    ['charredwood', [9, 32, 64]],
    ['driftwood', [2, 3, 7, 12, 32, 64]],
    ['peelingpaint', [3, 5, 32, 40]],
    ['tiretread', [2, 3, 4, 6, 8, 32]],
    ['honeycomb', [5, 10, 32, 48]],
    ['frost', [3, 24, 32]],
    ['stainedglass', [5, 32]],
    ['soapstone', [2, 3, 6, 12, 32, 48]],
    ['butcherblock', [4, 32, 96]],
    ['wallpaper', [2, 32]],
    ['embroidery', [6, 32]],
    ['macrame', [4, 6, 12, 32]],
    ['brickpaving', [3, 4, 24, 32, 64]],
    ['steppingstone', [3, 12, 32, 72]],
    ['woodendeck', [3, 5, 8, 32, 48]],
    ['cheese', [4, 6, 24, 32, 40]],
    ['sugarfrosting', [5, 32]],
    ['candleswax', [2, 6, 16, 32, 48]],
    ['vinylrecord', [3, 32, 52, 64]],
    ['graphpaper', [3, 12, 32, 64]],
    ['notebookpaper', [4, 8, 32, 48]],
    ['lace', [6, 32, 48, 64]],
    ['crochet', [6, 8, 32, 48]],
    ['basketweave', [4, 8, 32, 64]],
    ['zipper', [12, 24, 32, 64]],
    ['velcro', [12, 32, 48, 64]],
    ['button', [4, 32, 48, 64]],
    ['traintracks', [6, 32, 48, 64]],
    ['manholecover', [16, 32, 48, 64]],
    ['speedbump', [2, 4, 32, 64]],
    ['circuitboard', [8, 32, 48, 64]],
    ['solarpanel', [2, 8, 32, 64]],
    ['heattile', [3, 32, 48, 64]],
    ['pianokeys', [7, 32, 48, 64]],
    ['drumskin', [16, 32, 48, 64]],
    ['gongsurface', [10, 24, 32, 64]],
    ['lensarray', [16, 32, 48, 64]],
    ['prismtape', [8, 32, 48, 64]],
    ['fresnel', [10, 32, 48, 64]],
    ['bandage', [24, 32, 48, 64]],
    ['pillblister', [3, 32, 48, 64]],
    ['sutures', [10, 32, 48, 64]],
    ['trellis', [2, 4, 32, 64]],
    ['terracottapot', [8, 32, 48, 64]],
    ['hedgerow', [4, 32, 48, 64]],
    ['collar', [10, 32, 48, 64]],
    ['petbed', [20, 32, 48, 64]],
    ['scratchpost', [8, 32, 48, 64]],
    ['runningtrack', [1, 32, 48, 64]],
    ['bouldermat', [4, 32, 48, 64]],
    ['pooltile', [8, 32, 48, 64]],
    ['envelope', [10, 32, 48, 64]],
    ['chalkboard', [3, 32, 48, 64]],
    ['corkboard', [8, 32, 48, 64]],
    ['snowdrift', [2, 4, 32, 64]],
    ['icicle', [6, 24, 32, 64]],
    ['dewdrops', [12, 24, 32, 64]],
    ['mooncrater', [6, 32, 48, 64]],
    ['starfield', [12, 24, 32, 64]],
    ['nebula', [3, 32, 48, 64]],
    ['pleats', [4, 32, 48, 64]],
    ['shoelace', [8, 32, 48, 64]],
    ['tassel', [10, 32, 48, 64]],
    ['woksurface', [8, 32, 48, 64]],
    ['cutlery', [16, 32, 48, 64]],
    ['choppingboard', [4, 5, 32, 64]],
    ['faucet', [8, 32, 48, 64]],
    ['showerhead', [10, 12, 32, 64]],
    ['bathmat', [8, 12, 32, 64]],
    ['blinds', [4, 32, 48, 64]],
    ['curtain', [5, 32, 48, 64]],
    ['shadecloth', [16, 32, 48, 64]],
    ['sandstone', [3, 5, 8, 19, 32, 64]],
    ['travertine', [3, 6, 12, 18, 32, 64]],
    ['pumice', [5, 26, 32, 64]],
    ['parquet', [4, 8, 12, 32]],
    ['mosaic', [16, 32]],
    ['hexagontiles', [5, 6, 10, 12, 32]],
    ['knit', [8, 16, 32, 48]],
    ['corduroy', [12, 24, 32, 48, 96]],
    ['felt', [20, 32, 40]],
    ['roofshingles', [4, 6, 8, 32, 64]],
    ['rooftiles', [5, 6, 12, 24, 32]],
    ['stucco', [5, 7, 28, 32]],
    ['lichen', [7, 32, 96]],
    ['leaflitter', [6, 32]],
    ['endgrain', [5, 32, 96]],
    ['acousticfoam', [4, 32, 96]],
    ['closedcellfoam', [28, 32]],
    ['linoleum', [4, 5, 8, 32, 48]],
    ['suede', [5, 7, 24, 32, 80, 96]],
    ['snakeskin', [10, 12, 20, 24, 32]],
    ['crocodile', [4, 6, 9, 11, 32]],
    ['herringbone', [2, 4, 8, 16, 32, 128]],
    ['tweed', [4, 20, 24, 32, 80]],
    ['seersucker', [4, 8, 12, 24, 32, 48, 144]],
    ['houndstooth', [4, 8, 16, 32, 96]],
    ['tartan', [2, 4, 8, 32, 64, 128]],
    ['damask', [2, 4, 32, 64, 128]],
    ['knurledmetal', [24, 32, 48]],
    ['engineturned', [6, 12, 24, 32]],
    ['goldleaf', [3, 4, 5, 18, 21, 32]],
    ['orangepeel', [24, 32]],
    ['coconut', [8, 32, 40]],
    ['watermelon', [4, 5, 8, 12, 32, 80, 96]],
    ['limestone', [24, 32, 96]],
    ['breccia', [6, 32, 80]],
    ['gneiss', [4, 32, 96]],
    ['plywood', [3, 4, 32]],
    ['osb', [6, 32]],
    ['chipboard', [28, 32]],
    ['wafflecloth', [8, 24, 32, 96]],
    ['cableknit', [4, 32, 48, 64, 96]],
    ['quilting', [6, 12, 24, 32, 48, 96]],
    ['crackleglaze', [4, 16, 32]],
    ['flutedceramic', [8, 32, 96]],
    ['encaustictiles', [4, 32]],
    ['fishscales', [10, 20, 32]],
    ['tortoiseshell', [6, 19, 23, 32]],
    ['feathers', [4, 8, 16, 32]],
    ['reedmat', [4, 16, 32, 96]],
    ['rope', [6, 18, 32, 54]],
    ['straw', [8, 32]],
    ['studdedrubber', [6, 32, 144]],
    ['groovedrubber', [12, 32, 144]],
    ['recycledrubber', [32, 48, 144]],
    ['breadcrust', [7, 19, 23, 32]],
    ['wafer', [12, 24, 32]],
    ['chocolate', [4, 32]],
    ['pretzel', [3, 32, 48, 64]],
    ['bagel', [2, 32, 48, 64]],
    ['croissant', [4, 32, 48, 64]],
    ['butterflywing', [3, 16, 24, 64]],
    ['beetlewing', [6, 24, 32, 64]],
    ['spiderweb', [2, 6, 32, 64]],
    ['cirrus', [3, 6, 32, 64]],
    ['cumulus', [5, 12, 32, 64]],
    ['lightning', [3, 4, 32, 64]],
    ['kelp', [4, 8, 24, 64]],
    ['seaweed', [3, 24, 32, 64]],
    ['anemone', [2, 8, 24, 64]],
    ['candy', [4, 32, 48, 64]],
    ['marshmallow', [5, 32, 48, 64]],
    ['nougat', [6, 16, 32, 64]],
    ['frostedglass', [6, 12, 32, 64]],
    ['rippledglass', [6, 32, 48, 64]],
    ['bubbleglass', [8, 32, 48, 64]],
    ['saddlestitch', [2, 8, 32, 64]],
    ['tooledleather', [4, 32, 48, 64]],
    ['patentleather', [6, 12, 32, 64]],
    ['appleskin', [5, 24, 32, 64]],
    ['peachskin', [2, 12, 32, 64]],
    ['grapeskin', [6, 24, 32, 64]],
    ['broccoli', [10, 24, 32, 64]],
    ['cabbage', [3, 32, 48, 64]],
    ['onion', [6, 24, 32, 64]],
    ['bedsheet', [4, 32, 48, 64]],
    ['pillow', [2, 5, 32, 64]],
    ['mattress', [4, 32, 48, 64]],
    ['tealeaf', [6, 12, 32, 64]],
    ['matcha', [5, 32, 48, 64]],
    ['teabag', [24, 32, 48, 64]],
    ['sanddune', [6, 32, 48, 64]],
    ['pebblebeach', [5, 32, 48, 64]],
    ['foamedge', [6, 12, 32, 64]],
    ['lavaflow', [5, 32, 48, 64]],
    ['cooledlava', [4, 32, 48, 64]],
    ['ashfield', [6, 12, 32, 64]],
    ['stalactite', [4, 32, 48, 64]],
    ['flowstone', [5, 32, 48, 64]],
    ['cavefloor', [6, 12, 32, 64]],
    ['jam', [5, 32, 48, 64]],
    ['peanutbutter', [6, 12, 32, 64]],
    ['sprinkles', [6, 32, 48, 64]],
    ['icecream', [5, 20, 32, 64]],
    ['popsicle', [8, 32, 48, 64]],
    ['sorbet', [6, 32, 48, 64]],
    ['spaghetti', [6, 32, 48, 64]],
    ['macaroni', [4, 32, 48, 64]],
    ['lasagna', [4, 32, 48, 64]],
    ['origami', [2, 4, 32, 64]],
    ['paperlace', [6, 32, 48, 64]],
    ['papercut', [5, 32, 48, 64]],
    ['sunflower', [8, 16, 32, 64]],
    ['daisy', [4, 32, 48, 64]],
    ['clover', [3, 32, 48, 64]],
    ['puzzletile', [2, 8, 32, 64]],
    ['legobrick', [4, 32, 48, 64]],
    ['rubberband', [3, 32, 48, 64]],
    ['haybale', [3, 10, 32, 64]],
    ['corncrib', [3, 4, 32, 64]],
    ['fencepost', [6, 32, 48, 64]],
    ['poolfelt', [8, 32, 48, 64]],
    ['icesurface', [3, 7, 32, 64]],
    ['climbingwall', [3, 32, 48, 64]],
    ['oledpanel', [6, 18, 36, 64]],
    ['crtscanline', [10, 32, 64]],
    ['keyboardkey', [6, 32, 64]],
    ['filmstrip', [2, 8, 32, 64]],
    ['postagestamp', [8, 32, 64]],
    ['halftoneprint', [3, 6, 32, 64]],
    ['radiator', [5, 32, 64]],
    ['screwhead', [4, 32, 64]],
    ['chainlink', [3, 32, 64]],
    ['friedegg', [4, 32, 64]],
    ['sushirice', [6, 32, 64]],
    ['chocolatechip', [3, 32, 64]],
    ['cargomat', [2, 4, 32, 64]],
    ['dashboardgrain', [2, 10, 32, 64]],
    ['licenseplate', [4, 32, 64]],
    ['flowerbed', [3, 32, 64]],
    ['grassstripe', [2, 32, 64]],
    ['topiary', [3, 32, 64]],
    ['confetti', [4, 32, 64]],
    ['ribbonstreamer', [3, 32, 64]],
    ['pinatafringe', [3, 14, 32, 64]],
    ['xylophone', [2, 4, 32, 64]],
    ['tambourine', [5, 32, 64]],
    ['castanet', [3, 32, 64]],
    ['pillcapsule', [2, 3, 32, 64]],
    ['pilltablet', [4, 32, 64]],
    ['bathbomb', [2, 4, 32, 64]],
    ['basketball', [2, 32, 36]],
    ['tennisball', [1, 24, 32]],
    ['golfball', [10, 32]],
    ['boardformedconcrete', [2, 4, 8, 32, 96, 128]],
    ['ribbedconcrete', [12, 24, 32, 96]],
    ['splitfaceblock', [4, 8, 24, 32, 96]],
    ['chainmail', [6, 8, 48, 64]],
    ['rivetedmetal', [3, 4, 48, 64]],
    ['weldedmetal', [3, 32, 48, 64]],
    ['cactus', [8, 48, 64]],
    ['pinecone', [8, 16, 48, 64]],
    ['corncob', [8, 12, 48, 64]],
    ['basalt', [6, 8, 64]],
    ['scoria', [10, 64]],
    ['obsidian', [4, 64]],
    ['corrugatedcardboard', [4, 24, 32, 48, 64]],
    ['creasedpaper', [2, 24, 32, 48, 64]],
    ['layeredpaper', [2, 4, 24, 32, 48, 64]],
    ['pineapple', [8, 16, 96]],
    ['strawberry', [10, 12, 96]],
    ['lychee', [16, 18, 96]],
    ['sandpaper', [2, 4, 32, 64]],
    ['steelwool', [3, 32, 64]],
    ['wirebrush', [2, 4, 32, 64]],
    ['cheesegrater', [2, 3, 32, 64]],
    ['ovenrack', [2, 4, 32, 64]],
    ['muffintin', [4, 32, 64]],
    ['gauze', [2, 3, 32, 64]],
    ['elasticbandage', [2, 4, 32, 64]],
    ['icepack', [4, 32, 64]],
    ['bubblewrap', [4, 32, 64]],
    ['sequin', [3, 32, 64]],
    ['pennyround', [4, 32, 64]],
    ['volleyball', [3, 32, 64]],
    ['bowlingball', [2, 32, 64]],
    ['rugbyball', [3, 32, 64]],
    ['wafflecone', [4, 32, 64]],
    ['donutglaze', [3, 32, 64]],
    ['brownie', [3, 32, 64]],
    ['soapbar', [2, 32, 64]],
    ['loofah', [3, 32, 64]],
    ['scrubbypad', [3, 32, 64]],
    ['orangeflesh', [3, 32, 64]],
    ['kiwiflesh', [3, 32, 64]],
    ['avocadoflesh', [3, 32, 64]],
    ['turquoise', [3, 32, 64]],
    ['rhodonite', [3, 32, 64]],
    ['tigereye', [3, 32, 64]],
  ] as const)(
    '%s keeps bounded fields continuous at external and internal boundaries',
    (kind, lattices) => {
      const a: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      const b = { ...a };
      const epsilon = 1e-7;
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        for (const cells of lattices)
          for (let edge = 0; edge <= cells; edge++)
            for (const along of [0, 0.137, 0.43, 0.791, 1])
              for (const axis of [0, 1]) {
                const boundary = edge / cells;
                sample(
                  axis === 0 ? boundary - epsilon : along,
                  axis === 1 ? boundary - epsilon : along,
                  a,
                );
                sample(
                  axis === 0 ? boundary + epsilon : along,
                  axis === 1 ? boundary + epsilon : along,
                  b,
                );
                for (const key of Object.keys(a) as (keyof SurfaceSample)[]) {
                  expect(Number.isFinite(a[key])).toBe(true);
                  expect(a[key]).toBeGreaterThanOrEqual(0);
                  expect(a[key]).toBeLessThanOrEqual(1);
                  expect(Math.abs(a[key] - b[key])).toBeLessThan(0.001);
                }
                if (kind !== 'chainmail')
                  expect(a.metallic).toBe(
                    kind === 'diamondplate' ||
                      kind === 'hammeredmetal' ||
                      kind === 'galvanized' ||
                      kind === 'corrugatedmetal' ||
                      kind === 'perforatedmetal' ||
                      kind === 'expandedmetal' ||
                      kind === 'wiremesh' ||
                      kind === 'pyrite' ||
                      kind === 'knurledmetal' ||
                      kind === 'engineturned' ||
                      kind === 'goldleaf' ||
                      kind === 'rivetedmetal' ||
                      kind === 'weldedmetal'
                      ? 1
                      : 0,
                  );
                if (
                  kind !== 'mosaic' &&
                  kind !== 'hexagontiles' &&
                  kind !== 'encaustictiles' &&
                  kind !== 'splitfaceblock'
                )
                  expect(a.mortar).toBe(0);
              }
      }
    },
  );

  it.each([
    ['lichen', 7],
    ['leaflitter', 6],
    ['acousticfoam', 4],
    ['closedcellfoam', 28],
    ['linoleum', 1],
    ['suede', 96],
    ['snakeskin', 10],
    ['snakeskin', 12],
    ['crocodile', 4],
    ['crocodile', 6],
    ['houndstooth', 32],
    ['tartan', 64],
    ['damask', 2],
    ['knurledmetal', 48],
    ['engineturned', 12],
    ['goldleaf', 20],
    ['perforatedmetal', 6],
    ['expandedmetal', 5],
    ['wiremesh', 12],
    ['terrycloth', 8],
    ['terrycloth', 10],
    ['boucle', 6],
    ['boucle', 8],
    ['geode', 6],
    ['quartz', 5],
    ['pyrite', 5],
    ['shiplap', 5],
    ['glassblock', 4],
    ['thatch', 6],
    ['charredwood', 9],
    ['driftwood', 7],
    ['tiretread', 6],
    ['tiretread', 4],
    ['honeycomb', 5],
    ['honeycomb', 4],
    ['stainedglass', 5],
    ['butcherblock', 4],
    ['embroidery', 6],
    ['macrame', 4],
    ['brickpaving', 3],
    ['brickpaving', 4],
    ['woodendeck', 5],
    ['cheese', 6],
    ['candleswax', 6],
    ['candleswax', 2],
    ['graphpaper', 12],
    ['graphpaper', 3],
    ['notebookpaper', 8],
    ['lace', 6],
    ['crochet', 8],
    ['crochet', 6],
    ['basketweave', 8],
    ['basketweave', 4],
    ['zipper', 12],
    ['zipper', 24],
    ['velcro', 12],
    ['button', 4],
    ['traintracks', 6],
    ['manholecover', 16],
    ['speedbump', 2],
    ['speedbump', 4],
    ['circuitboard', 8],
    ['solarpanel', 2],
    ['solarpanel', 8],
    ['heattile', 3],
    ['pianokeys', 7],
    ['drumskin', 16],
    ['gongsurface', 10],
    ['lensarray', 16],
    ['prismtape', 8],
    ['fresnel', 10],
    ['bandage', 24],
    ['pillblister', 3],
    ['sutures', 10],
    ['trellis', 2],
    ['terracottapot', 8],
    ['hedgerow', 4],
    ['collar', 10],
    ['petbed', 20],
    ['scratchpost', 8],
    ['runningtrack', 1],
    ['bouldermat', 4],
    ['pooltile', 8],
    ['envelope', 10],
    ['chalkboard', 3],
    ['corkboard', 8],
    ['snowdrift', 2],
    ['icicle', 6],
    ['dewdrops', 12],
    ['mooncrater', 6],
    ['starfield', 12],
    ['nebula', 3],
    ['pleats', 4],
    ['shoelace', 8],
    ['tassel', 10],
    ['woksurface', 8],
    ['cutlery', 16],
    ['choppingboard', 5],
    ['faucet', 8],
    ['showerhead', 12],
    ['bathmat', 12],
    ['blinds', 4],
    ['curtain', 5],
    ['shadecloth', 16],
    ['orangepeel', 24],
    ['coconut', 8],
    ['coconut', 40],
    ['watermelon', 96],
    ['gneiss', 4],
    ['gneiss', 96],
    ['plywood', 4],
    ['crackleglaze', 16],
    ['flutedceramic', 96],
    ['encaustictiles', 4],
    ['studdedrubber', 144],
    ['groovedrubber', 144],
    ['recycledrubber', 144],
    ['breadcrust', 7],
    ['breadcrust', 19],
    ['breadcrust', 23],
    ['wafer', 12],
    ['wafer', 24],
    ['chocolate', 4],
    ['pretzel', 3],
    ['bagel', 2],
    ['croissant', 4],
    ['butterflywing', 24],
    ['beetlewing', 6],
    ['spiderweb', 6],
    ['cirrus', 6],
    ['cumulus', 5],
    ['lightning', 3],
    ['kelp', 4],
    ['seaweed', 3],
    ['anemone', 8],
    ['candy', 4],
    ['marshmallow', 5],
    ['nougat', 6],
    ['frostedglass', 32],
    ['rippledglass', 6],
    ['bubbleglass', 8],
    ['saddlestitch', 8],
    ['tooledleather', 4],
    ['patentleather', 32],
    ['appleskin', 5],
    ['peachskin', 2],
    ['grapeskin', 6],
    ['broccoli', 10],
    ['cabbage', 3],
    ['onion', 6],
    ['bedsheet', 4],
    ['pillow', 2],
    ['mattress', 4],
    ['tealeaf', 6],
    ['matcha', 5],
    ['teabag', 24],
    ['sanddune', 6],
    ['pebblebeach', 5],
    ['foamedge', 6],
    ['lavaflow', 5],
    ['cooledlava', 4],
    ['ashfield', 6],
    ['stalactite', 4],
    ['flowstone', 5],
    ['cavefloor', 6],
    ['jam', 5],
    ['peanutbutter', 6],
    ['sprinkles', 6],
    ['icecream', 5],
    ['popsicle', 8],
    ['sorbet', 6],
    ['spaghetti', 6],
    ['macaroni', 4],
    ['lasagna', 4],
    ['origami', 2],
    ['paperlace', 6],
    ['papercut', 5],
    ['sunflower', 8],
    ['daisy', 4],
    ['clover', 3],
    ['puzzletile', 2],
    ['legobrick', 4],
    ['rubberband', 3],
    ['haybale', 10],
    ['corncrib', 3],
    ['fencepost', 6],
    ['poolfelt', 8],
    ['icesurface', 7],
    ['climbingwall', 3],
    ['oledpanel', 18],
    ['crtscanline', 10],
    ['keyboardkey', 6],
    ['filmstrip', 8],
    ['postagestamp', 8],
    ['halftoneprint', 6],
    ['radiator', 5],
    ['screwhead', 4],
    ['chainlink', 3],
    ['friedegg', 4],
    ['sushirice', 6],
    ['chocolatechip', 3],
    ['cargomat', 4],
    ['dashboardgrain', 10],
    ['licenseplate', 4],
    ['flowerbed', 3],
    ['grassstripe', 2],
    ['topiary', 3],
    ['confetti', 4],
    ['ribbonstreamer', 3],
    ['pinatafringe', 14],
    ['xylophone', 4],
    ['tambourine', 5],
    ['castanet', 3],
    ['pillcapsule', 3],
    ['pilltablet', 4],
    ['bathbomb', 4],
    ['basketball', 2],
    ['basketball', 36],
    ['tennisball', 24],
    ['tennisball', 32],
    ['golfball', 10],
    ['boardformedconcrete', 4],
    ['boardformedconcrete', 8],
    ['boardformedconcrete', 128],
    ['ribbedconcrete', 12],
    ['ribbedconcrete', 96],
    ['splitfaceblock', 8],
    ['splitfaceblock', 96],
    ['chainmail', 6],
    ['chainmail', 8],
    ['chainmail', 64],
    ['rivetedmetal', 3],
    ['rivetedmetal', 4],
    ['rivetedmetal', 64],
    ['weldedmetal', 3],
    ['weldedmetal', 32],
    ['weldedmetal', 64],
    ['cactus', 8],
    ['cactus', 48],
    ['cactus', 64],
    ['pinecone', 8],
    ['pinecone', 16],
    ['pinecone', 48],
    ['pinecone', 64],
    ['corncob', 8],
    ['corncob', 12],
    ['corncob', 48],
    ['corncob', 64],
    ['corrugatedcardboard', 4],
    ['corrugatedcardboard', 24],
    ['corrugatedcardboard', 64],
    ['creasedpaper', 2],
    ['creasedpaper', 24],
    ['creasedpaper', 64],
    ['layeredpaper', 2],
    ['layeredpaper', 4],
    ['layeredpaper', 24],
    ['layeredpaper', 64],
    ['pineapple', 8],
    ['pineapple', 96],
    ['strawberry', 10],
    ['strawberry', 12],
    ['strawberry', 96],
    ['lychee', 16],
    ['lychee', 18],
    ['lychee', 96],
    ['sandpaper', 3],
    ['steelwool', 4],
    ['wirebrush', 4],
    ['cheesegrater', 3],
    ['ovenrack', 4],
    ['muffintin', 4],
    ['gauze', 4],
    ['elasticbandage', 3],
    ['icepack', 4],
    ['bubblewrap', 12],
    ['sequin', 10],
    ['pennyround', 8],
    ['volleyball', 3],
    ['volleyball', 24],
    ['bowlingball', 2],
    ['rugbyball', 2],
    ['rugbyball', 12],
    ['wafflecone', 8],
    ['donutglaze', 14],
    ['brownie', 7],
    ['soapbar', 2],
    ['soapbar', 40],
    ['loofah', 6],
    ['scrubbypad', 8],
    ['orangeflesh', 2],
    ['kiwiflesh', 2],
    ['avocadoflesh', 2],
    ['turquoise', 3],
    ['rhodonite', 4],
    ['tigereye', 6],
  ] as const)(
    '%s keeps continuous slopes across wrapped and owned cell boundaries',
    (kind, cells) => {
      const a: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      const b = { ...a };
      const epsilon = 1e-7 / cells;
      const keys = Object.keys(a) as (keyof SurfaceSample)[];
      let maximumJump = 0;
      let maximumSlopeResidual = 0;
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        for (let edge = 0; edge <= cells; edge++)
          for (let i = 0; i < 37; i++)
            for (const axis of [0, 1]) {
              const u = axis === 0 ? edge / cells : (i + 0.37) / 37,
                v = axis === 1 ? edge / cells : (i + 0.37) / 37;
              const du = axis === 0 ? epsilon : 0,
                dv = axis === 1 ? epsilon : 0;
              sample(u - du, v - dv, a);
              sample(u + du, v + dv, b);
              for (const key of keys)
                maximumJump = Math.max(maximumJump, Math.abs(a[key] - b[key]));
              const left = a.height,
                right = b.height;
              sample(u, v, a);
              maximumSlopeResidual = Math.max(
                maximumSlopeResidual,
                Math.abs(right - 2 * a.height + left) / epsilon,
              );
            }
      }
      expect(maximumJump).toBeLessThan(0.001);
      expect(maximumSlopeResidual).toBeLessThan(0.001);
    },
  );

  describe('paper packaging relief', () => {
    const empty = (): SurfaceSample => ({
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    });
    const featureHash = (x: number, y: number, seed: number) => {
      let n =
        (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
      n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
      n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };

    it('cardboard has rounded axial flutes over independent kraft pulp', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('corrugatedcardboard', seed),
          ridge = empty(),
          trough = empty(),
          flank = empty();
        let microMin = Infinity,
          microMax = -Infinity,
          contrast = Infinity;
        for (let i = 0; i < 128; i++) {
          const v = i / 128;
          // The carrier repeats at 1/8 UV: these pairs differ only in macrorelief.
          sample(0, v, ridge);
          sample(0.125, v, trough);
          sample(0.0625, v, flank);
          expect(ridge.height).toBeGreaterThan(flank.height);
          expect(flank.height).toBeGreaterThan(trough.height);
          expect(ridge.color).toBeGreaterThan(trough.color);
          expect(ridge.occlusion).toBeGreaterThan(trough.occlusion);
          contrast = Math.min(contrast, ridge.height - trough.height);
          microMin = Math.min(microMin, ridge.height);
          microMax = Math.max(microMax, ridge.height);
        }
        expect(microMax).toBeGreaterThan(microMin);
        expect(microMax - microMin).toBeLessThan(contrast / 10);
      }
    });

    it('creased paper has raised intersecting folds and recessed shoulders, not additive spikes', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('creasedpaper', seed),
          flat = empty(),
          ridge = empty(),
          shoulder = empty(),
          crossing = empty(),
          shoulderCrossing = empty();
        for (const offset of [0, 0.5]) {
          sample(0.25 + offset, 0.25, flat);
          sample(offset, 0.25, ridge);
          sample(0.125 + offset, 0.25, shoulder);
          sample(offset, 0, crossing);
          sample(0.125 + offset, 0.125, shoulderCrossing);
          expect(ridge.height).toBeGreaterThan(flat.height);
          expect(flat.height).toBeGreaterThan(shoulder.height);
          expect(shoulder.occlusion).toBeLessThan(flat.occlusion);
          expect(shoulder.color).toBeLessThan(flat.color);
          expect(crossing.height).toBeCloseTo(ridge.height, 12);
          expect(shoulderCrossing.height).toBeCloseTo(shoulder.height, 12);
          expect(ridge.roughness).toBeLessThan(flat.roughness);
        }
      }
    });

    it('layered paper has ordered overlapping strip ledges and a shaded torn undercut', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('layeredpaper', seed),
          lower = empty(),
          upper = empty(),
          overlap = empty(),
          outside = empty(),
          inside = empty(),
          edge = empty();
        for (let row = 0; row < 3; row++) {
          const v = (row + 0.5) / 4;
          sample(0.25, v, lower);
          sample(0.75, v, upper);
          expect(upper.height).toBeGreaterThan(lower.height);
          sample(0.25, v + 0.125, overlap);
          expect(overlap.height).toBeGreaterThan(lower.height);
          sample(0.25, v + 0.25, upper);
          expect(overlap.height).toBeCloseTo(upper.height, 12);
        }
        const phase = Math.PI * 2 * featureHash(7, 0, seed ^ 0x291d),
          torn = 0.008 * Math.sin(phase) + 0.004 * Math.sin(-phase),
          boundary = 0.875 + 0.18 + torn;
        sample(0.75, boundary - 0.0625, inside);
        sample(0.75, boundary + 0.0625, outside);
        sample(0.75, boundary - 0.0125, edge);
        expect(inside.height).toBeGreaterThan(outside.height);
        expect(edge.height).toBeLessThan(inside.height);
        expect(edge.height).toBeGreaterThan(outside.height);
        expect(edge.occlusion).toBeLessThan(inside.occlusion);
        expect(edge.occlusion).toBeLessThan(outside.occlusion);
      }
    });

    it.each(['corrugatedcardboard', 'creasedpaper', 'layeredpaper'] as const)(
      '%s keeps every field C1 at actual shoulders, corners, intersections and overlaps',
      (kind) => {
        const center = empty(),
          left = empty(),
          right = empty(),
          epsilon = 1e-9;
        for (const seed of [1, 123, 0xffffffff]) {
          const sample = createSurfaceSampler(kind, seed),
            points: [number, number][] = [
              [0, 0],
              [1, 1],
              [0, 0.137],
              [0.791, 0],
            ];
          if (kind === 'corrugatedcardboard') {
            for (let i = 0; i < 4; i++)
              for (const x of [0, 0.0625, 0.125, 0.1875])
                points.push([i / 4 + x, 0.137]);
          } else if (kind === 'creasedpaper') {
            for (const x of [0, 0.07, 0.075, 0.125, 0.175, 0.25, 0.5])
              for (const y of [0, 0.07, 0.075, 0.125, 0.175, 0.25])
                points.push([x, y]);
          } else {
            for (let i = 0; i < 8; i++) {
              const cx = 0.25 + (i % 2) * 0.5,
                cy = (Math.floor(i / 2) + 0.5) / 4,
                phase = Math.PI * 2 * featureHash(i, 0, seed ^ 0x291d);
              for (const dx of [
                -0.34, -0.3275, -0.315, 0, 0.315, 0.3275, 0.34,
              ]) {
                const torn =
                  0.008 * Math.sin(Math.PI * 2 * dx * 12 + phase) +
                  0.004 * Math.sin(Math.PI * 2 * dx * 28 - phase);
                for (const inset of [0, 0.0125, 0.025])
                  for (const side of [-1, 1])
                    points.push([cx + dx, cy + side * (0.18 + torn - inset)]);
              }
              points.push([cx, cy + 0.125], [cx + 0.25, cy], [cx + 0.5, cy]);
            }
          }
          // Include fiber support boundaries, not only the macrostructure.
          for (let y = 0; y < 4; y++)
            for (let x = 0; x < 3; x++) {
              const cx = 0.3 + 0.4 * featureHash(x, y, seed ^ 0x2b71),
                cy = 0.3 + 0.4 * featureHash(x, y, seed ^ 0x5c39),
                angle = Math.PI * 2 * featureHash(x, y, seed ^ 0x6e13),
                length = 0.32 + 0.12 * featureHash(x, y, seed ^ 0x7a51);
              points.push(
                [
                  (x + cx + length * Math.cos(angle)) / 24,
                  (y + cy + length * Math.sin(angle)) / 32,
                ],
                [
                  (x + cx - 0.065 * Math.sin(angle)) / 24,
                  (y + cy + 0.065 * Math.cos(angle)) / 32,
                ],
              );
            }
          for (const [u, v] of points)
            for (const [du, dv] of [
              [epsilon, 0],
              [0, epsilon],
              [epsilon, epsilon],
              [epsilon, -epsilon],
            ]) {
              sample(u - du, v - dv, left);
              sample(u, v, center);
              sample(u + du, v + dv, right);
              for (const key of Object.keys(
                center,
              ) as (keyof SurfaceSample)[]) {
                expect(center[key]).toBeGreaterThanOrEqual(0);
                expect(center[key]).toBeLessThanOrEqual(1);
                expect(Math.abs(right[key] - left[key])).toBeLessThan(0.001);
                expect(
                  Math.abs(right[key] - 2 * center[key] + left[key]) / epsilon,
                ).toBeLessThan(0.001);
              }
            }
        }
      },
    );
  });

  describe('fabricated metal relief', () => {
    const empty = (): SurfaceSample => ({
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    });

    it('chainmail leaves opaque dielectric lining inside raised overlapping metal rings', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('chainmail', seed);
        const lining = empty(),
          wire = empty(),
          shoulder = empty(),
          overlap = empty();
        for (let row = 0; row < 8; row++) {
          const cx = 0.5 + (row % 2) * 0.5,
            cy = row + 0.5;
          sample(cx / 6, cy / 8, lining);
          sample((cx + 0.62) / 6, cy / 8, wire);
          sample((cx + 0.7) / 6, cy / 8, shoulder);
          expect(wire.height).toBeGreaterThan(shoulder.height);
          expect(shoulder.height).toBeGreaterThan(lining.height);
          expect(wire.metallic).toBeGreaterThan(shoulder.metallic);
          expect(shoulder.metallic).toBeGreaterThan(lining.metallic);
          expect(lining.metallic).toBe(0);
          expect(wire.color).toBeGreaterThan(lining.color);
          expect(wire.roughness).toBeLessThan(lining.roughness);
          expect(wire.occlusion).toBeGreaterThan(lining.occlusion);
          const crossY = Math.sqrt(0.62 ** 2 - 0.5 ** 2);
          sample((cx + 0.5) / 6, (cy + crossY) / 8, overlap);
          expect(overlap.height).toBeGreaterThan(lining.height);
          expect(overlap.metallic).toBeGreaterThan(shoulder.metallic);
          const side = Math.sqrt(0.62 ** 2 - 0.12 ** 2);
          sample((cx + side) / 6, (cy + 0.12) / 8, wire);
          sample((cx + side) / 6, (cy - 0.12) / 8, shoulder);
          if (row % 2) expect(wire.height).toBeLessThan(shoulder.height);
          else expect(wire.height).toBeGreaterThan(shoulder.height);
        }
      }
    });

    it('rivets are discrete rounded heads above flat panels and recessed intersecting joints', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('rivetedmetal', seed);
        const head = empty(),
          shoulder = empty(),
          panel = empty(),
          joint = empty();
        for (let row = 0; row < 4; row++)
          for (let column = 0; column < 3; column++) {
            sample((column + 0.5) / 3, (row + 0.5) / 4, panel);
            for (const x of [0.12, 0.88])
              for (const y of [0.12, 0.88]) {
                sample((column + x) / 3, (row + y) / 4, head);
                sample((column + x + 0.03) / 3, (row + y) / 4, shoulder);
                expect(head.height).toBeGreaterThan(shoulder.height);
                expect(shoulder.height).toBeGreaterThan(panel.height);
                expect(head.roughness).toBeLessThan(panel.roughness);
              }
            for (const [x, y] of [
              [0, 0.5],
              [0.5, 0],
              [0, 0],
            ]) {
              sample((column + x) / 3, (row + y) / 4, joint);
              expect(panel.height).toBeGreaterThan(joint.height);
              expect(panel.occlusion).toBeGreaterThan(joint.occlusion);
            }
          }
      }
    });

    it('weld beads have repeated scallops above flatter sheet and darkened recessed toes', () => {
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('weldedmetal', seed);
        const bead = empty(),
          sheet = empty(),
          toe = empty();
        const beadHeights: number[] = [],
          sheetHeights: number[] = [];
        for (let i = 0; i < 128; i++) {
          const v = i / 128;
          sample(0, v, bead);
          sample(0.15, v, sheet);
          sample(0.035, v, toe);
          expect(bead.height).toBeGreaterThan(sheet.height);
          expect(bead.color).toBeGreaterThan(toe.color);
          expect(toe.occlusion).toBeLessThan(sheet.occlusion);
          expect(toe.roughness).toBeGreaterThan(sheet.roughness);
          beadHeights.push(bead.height);
          sheetHeights.push(sheet.height);
        }
        const range = (values: number[]) =>
          Math.max(...values) - Math.min(...values);
        expect(range(beadHeights)).toBeGreaterThan(10 * range(sheetHeights));
        for (let i = 0; i < 124; i++)
          expect(Math.abs(beadHeights[i + 4] - beadHeights[i])).toBeLessThan(
            range(beadHeights) / 4,
          );
      }
    });

    it.each(['chainmail', 'rivetedmetal', 'weldedmetal'] as const)(
      '%s keeps every field C1 at actual joints, shoulders, corners and overlaps',
      (kind) => {
        const center = empty(),
          left = empty(),
          right = empty();
        for (const seed of [1, 123, 0xffffffff]) {
          const sample = createSurfaceSampler(kind, seed);
          const points: [number, number][] = [
            [0, 0],
            [1, 1],
            [0, 0.173],
            [0.317, 0],
          ];
          if (kind === 'chainmail') {
            for (let row = 0; row < 8; row++) {
              const cx = 0.5 + (row % 2) * 0.5,
                cy = row + 0.5;
              for (const radius of [0, 0.515, 0.62, 0.725])
                points.push([(cx + radius) / 6, cy / 8]);
              points.push(
                [(cx + 0.5) / 6, (cy + Math.sqrt(0.62 ** 2 - 0.5 ** 2)) / 8],
                [(cx + 0.25) / 6, (cy + 0.5) / 8],
                [cx / 6, (row + 1) / 8],
              );
            }
          } else if (kind === 'rivetedmetal') {
            for (const x of [0, 0.0225, 0.045, 0.12, 0.88, 0.955, 1])
              for (const y of [0, 0.0225, 0.045, 0.12, 0.88, 1])
                points.push([x / 3, y / 4]);
            for (const radius of [0, 0.026, 0.052])
              for (const angle of [0, Math.PI / 4, Math.PI / 2])
                points.push([
                  (0.12 + radius * Math.cos(angle)) / 3,
                  (0.12 + radius * Math.sin(angle)) / 4,
                ]);
          } else {
            let n = seed >>> 0;
            n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
            n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
            const phase = ((n ^ (n >>> 16)) >>> 0) / 4294967295;
            for (const scallop of [0, 1]) {
              const cycle = (scallop ? 1 : 1.5) - phase;
              const v = cycle / 32,
                width = 0.065 + 0.015 * scallop;
              for (const x of [0, width / 2, width, 0.15])
                points.push([x / 3, v], [-x / 3, v]);
            }
          }
          const epsilon = 1e-9;
          for (const [u, v] of points)
            for (const [du, dv] of [
              [epsilon, 0],
              [0, epsilon],
              [epsilon, epsilon],
            ]) {
              sample(u - du, v - dv, left);
              sample(u, v, center);
              sample(u + du, v + dv, right);
              for (const key of Object.keys(
                center,
              ) as (keyof SurfaceSample)[]) {
                expect(Math.abs(right[key] - left[key])).toBeLessThan(0.001);
                expect(
                  Math.abs(right[key] - 2 * center[key] + left[key]) / epsilon,
                ).toBeLessThan(0.001);
              }
            }
        }
      },
    );
  });

  it('board-formed concrete has recessed horizontal timber joints and shallow long grain', () => {
    const face: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const joint = { ...face },
      along = { ...face },
      across = { ...face };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('boardformedconcrete', seed);
      for (let row = 0; row < 8; row++) {
        const offset = (row % 2) * 0.25;
        sample(0.25 - offset, (row + 0.5) / 8, face);
        for (const [u, v] of [
          [0.25 - offset, row / 8],
          [-offset, (row + 0.5) / 8],
        ]) {
          sample(u, v, joint);
          expect(face.height).toBeGreaterThan(joint.height);
          expect(face.occlusion).toBeGreaterThan(joint.occlusion);
          expect(face.color).toBeGreaterThan(joint.color);
        }
      }
      let longitudinal = 0,
        transverse = 0;
      for (let i = 0; i < 128; i++) {
        const u = 0.1 + (0.3 * (i + 0.5)) / 128,
          v = 0.025 + (0.075 * (((i * 47) % 128) + 0.5)) / 128;
        sample(u, v, face);
        sample(u + 0.0002, v, along);
        sample(u, v + 0.0002, across);
        longitudinal += Math.abs(face.height - along.height);
        transverse += Math.abs(face.height - across.height);
      }
      expect(longitudinal).toBeGreaterThan(0);
      expect(transverse).toBeGreaterThan(longitudinal * 1.3);
    }
  });

  it('cast concrete ribs have broad crowns, rounded shoulders and fine lengthwise pores', () => {
    const crown: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const trough = { ...crown },
      shoulder = { ...crown },
      other = { ...crown };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('ribbedconcrete', seed);
      let pores = 0;
      for (let rib = 0; rib < 12; rib++)
        for (const v of [0.137, 0.43, 0.791]) {
          sample((rib + 0.35) / 12, v, crown);
          sample((rib + 0.65) / 12, v, other);
          sample(rib / 12, v, trough);
          sample((rib + 0.21) / 12, v, shoulder);
          const relief = crown.height - trough.height;
          expect(relief).toBeGreaterThan(0);
          expect(Math.abs(crown.height - other.height)).toBeLessThan(
            relief / 20,
          );
          expect(shoulder.height - trough.height).toBeGreaterThan(relief * 0.4);
          expect(shoulder.height - trough.height).toBeLessThan(relief * 0.6);
          expect(crown.occlusion).toBe(other.occlusion);
          expect(shoulder.occlusion).toBeGreaterThan(trough.occlusion);
          expect(shoulder.occlusion).toBeLessThan(crown.occlusion);
          sample((rib + 0.35) / 12, v + 0.003, other);
          pores += Math.abs(crown.height - other.height);
          expect(Math.abs(crown.height - other.height)).toBeLessThan(
            relief / 20,
          );
        }
      expect(pores).toBeGreaterThan(0);
    }
  });

  it('split-face masonry staggers fractured block faces over smooth recessed mortar', () => {
    const face: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const joint = { ...face },
      other = { ...face };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('splitfaceblock', seed);
      let faceRelief = 0;
      for (let row = 0; row < 8; row++)
        for (let column = 0; column < 4; column++) {
          const u = (column + 0.5 - (row % 2) * 0.5) / 4,
            v = (row + 0.5) / 8;
          sample(u, v, face);
          expect(face.mortar).toBe(0);
          sample(u + 0.04, v + 0.02, other);
          faceRelief += Math.abs(face.height - other.height);
          sample(u - 0.125, v, joint);
          expect(joint.mortar).toBe(1);
          expect(joint.height).toBeLessThan(face.height);
          expect(joint.occlusion).toBeLessThan(face.occlusion);
          expect(joint.roughness).toBeLessThan(face.roughness);
          // The head joint becomes a face halfway across the next row.
          sample(u - 0.125, v + 0.125, other);
          expect(other.mortar).toBe(0);
          expect(other.height).toBeGreaterThan(joint.height);
          sample(u, row / 8, other);
          expect(other.mortar).toBe(1);
          expect(other.height).toBe(joint.height);
          sample(u + 0.07, row / 8 + 0.002, other);
          expect(other.height).toBe(joint.height);
        }
      expect(faceRelief).toBeGreaterThan(0);
    }
  });

  it.each([
    [
      'boardformedconcrete',
      2,
      8,
      [0, 0.018, 0.5, 0.982, 1],
      [0, 0.055, 0.5, 0.945, 1],
    ],
    [
      'ribbedconcrete',
      12,
      1,
      [0, 0.12, 0.21, 0.3, 0.5, 0.7, 0.79, 0.88, 1],
      [0, 0.37, 1],
    ],
    [
      'splitfaceblock',
      4,
      8,
      [0, 0.04, 0.08, 0.12, 0.5, 0.88, 0.92, 0.96, 1],
      [0, 0.06, 0.105, 0.15, 0.5, 0.85, 0.895, 0.94, 1],
    ],
  ] as const)(
    '%s keeps every field C1 at actual shoulders, corners and offset row ownership',
    (kind, columns, rows, xs, ys) => {
      const a: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      const b = { ...a },
        center = { ...a },
        halfA = { ...a },
        halfB = { ...a };
      const epsilon = 1e-7 / Math.max(columns, rows);
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        for (let row = 0; row < rows; row++)
          for (let column = 0; column < columns; column++)
            for (const x of xs)
              for (const y of ys) {
                const offset = kind === 'ribbedconcrete' ? 0 : (row % 2) * 0.5,
                  u = (column + x - offset) / columns,
                  v = (row + y) / rows;
                for (const [du, dv] of [
                  [epsilon, 0],
                  [0, epsilon],
                ]) {
                  sample(u - du, v - dv, a);
                  sample(u, v, center);
                  sample(u + du, v + dv, b);
                  sample(u - du / 2, v - dv / 2, halfA);
                  sample(u + du / 2, v + dv / 2, halfB);
                  for (const key of Object.keys(a) as (keyof SurfaceSample)[]) {
                    expect(Math.abs(a[key] - b[key])).toBeLessThan(0.001);
                    expect(
                      Math.abs(
                        4 * (halfA[key] + halfB[key]) -
                          a[key] -
                          b[key] -
                          6 * center[key],
                      ) / epsilon,
                    ).toBeLessThan(0.001);
                  }
                }
              }
      }
    },
  );
  it('bread crust separates puffed toasted plates with dark recessed cracks', () => {
    const featureHash = (x: number, y: number, seed: number): number => {
      let n =
        (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
      n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
      n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    const plate: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const crack = { ...plate },
      shoulder = { ...plate },
      left = { ...plate },
      right = { ...plate };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('breadcrust', seed);
      for (const [column, row] of [
        [0, 0],
        [3, 4],
        [6, 6],
      ]) {
        const px =
            column + 0.36 + 0.28 * featureHash(column, row, seed ^ 0x24b7),
          py = row + 0.36 + 0.28 * featureHash(column, row, seed ^ 0x59d1);
        const nx =
            column +
            1 +
            0.36 +
            0.28 * featureHash((column + 1) % 7, row, seed ^ 0x24b7),
          ny =
            row +
            0.36 +
            0.28 * featureHash((column + 1) % 7, row, seed ^ 0x59d1);
        const mx = (px + nx) / 2,
          my = (py + ny) / 2;
        sample(px / 7, py / 7, plate);
        sample(mx / 7, my / 7, crack);
        sample((0.3 * px + 0.7 * mx) / 7, (0.3 * py + 0.7 * my) / 7, shoulder);
        expect(plate.height).toBeGreaterThan(shoulder.height);
        expect(shoulder.height).toBeGreaterThan(crack.height);
        expect(plate.color).toBeGreaterThan(crack.color);
        expect(plate.occlusion).toBeGreaterThan(crack.occlusion);
        const distance = Math.hypot(nx - px, ny - py),
          ux = (nx - px) / distance,
          uy = (ny - py) / distance;
        // Both cached polygon owners meet the same bisector. Check each
        // compact shoulder endpoint, not merely the cell-grid boundaries.
        const epsilon = 1e-8;
        for (const inset of [-0.165, -0.025, 0, 0.025, 0.165]) {
          const u = (mx + inset * ux) / 7,
            v = (my + inset * uy) / 7;
          sample(u - epsilon * ux, v - epsilon * uy, left);
          sample(u, v, shoulder);
          sample(u + epsilon * ux, v + epsilon * uy, right);
          for (const key of Object.keys(plate) as (keyof SurfaceSample)[])
            expect(
              Math.abs(right[key] - 2 * shoulder[key] + left[key]) / epsilon,
            ).toBeLessThan(0.001);
        }
      }
    }
  });

  it('wafer has recessed square pocket floors beneath continuous orthogonal ribs', () => {
    const floor: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const rib = { ...floor },
      crossing = { ...floor },
      wall = { ...floor };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('wafer', seed);
      for (const [column, row] of [
        [0, 0],
        [5, 7],
        [11, 11],
      ]) {
        sample((column + 0.5) / 12, (row + 0.5) / 12, floor);
        sample(column / 12, row / 12, crossing);
        for (const axis of [0, 1]) {
          sample(
            (column + (axis === 0 ? 0 : 0.5)) / 12,
            (row + (axis === 1 ? 0 : 0.5)) / 12,
            rib,
          );
          sample(
            (column + (axis === 0 ? 0.15 : 0.5)) / 12,
            (row + (axis === 1 ? 0.15 : 0.5)) / 12,
            wall,
          );
          expect(crossing.height).toBeGreaterThan(wall.height);
          expect(rib.height).toBeGreaterThan(wall.height);
          expect(wall.height).toBeGreaterThan(floor.height);
          expect(rib.occlusion).toBeGreaterThan(floor.occlusion);
          // Baked microtexture must not turn the crossing into woven over/under.
          expect(Math.abs(crossing.height - rib.height)).toBeLessThan(
            (rib.height - floor.height) * 0.03,
          );
        }
      }
    }
  });

  it('chocolate keeps broad segment tops flat above smoothly descending scored shoulders', () => {
    const top: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const out = { ...top };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('chocolate', seed);
      for (const [column, row] of [
        [0, 0],
        [2, 1],
        [3, 3],
      ]) {
        sample((column + 0.5) / 4, (row + 0.5) / 4, top);
        for (const x of [0.16, 0.3, 0.5, 0.7, 0.84])
          for (const y of [0.16, 0.5, 0.84]) {
            sample((column + x) / 4, (row + y) / 4, out);
            expect(out.height).toBe(top.height);
          }
        for (const axis of [0, 1]) {
          let previous = top.height;
          for (const edge of [0.12, 0.09, 0.06, 0.02]) {
            sample(
              (column + (axis === 0 ? edge : 0.5)) / 4,
              (row + (axis === 1 ? edge : 0.5)) / 4,
              out,
            );
            expect(out.height).toBeLessThan(previous);
            previous = out.height;
          }
          expect(out.occlusion).toBeLessThan(top.occlusion);
          expect(out.color).toBeLessThan(top.color);
        }
      }
    }
  });
  it.each(['wafer', 'chocolate'] as const)(
    '%s has differentiable corners where orthogonal mold shoulders meet',
    (kind) => {
      const center: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      const left = { ...center },
        right = { ...center };
      const cells = kind === 'wafer' ? 12 : 4,
        edges = kind === 'wafer' ? [0.11, 0.15, 0.19] : [0.06, 0.09, 0.12],
        epsilon = 1e-8 / cells;
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        for (const edge of edges)
          for (const sx of [1, -1])
            for (const sy of [1, -1]) {
              const u = (sx * edge) / cells,
                v = (sy * edge) / cells;
              sample(u - epsilon, v, left);
              sample(u, v, center);
              sample(u + epsilon, v, right);
              for (const key of ['height', 'occlusion'] as const)
                expect(
                  Math.abs(right[key] - 2 * center[key] + left[key]) / epsilon,
                ).toBeLessThan(0.001);
            }
      }
    },
  );
  describe('sports surface geometry', () => {
    const featureHash = (x: number, y: number, seed: number): number => {
      let n =
        (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
      n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
      n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    const empty = (): SurfaceSample => ({
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    });

    it('basketball has continuous dark recessed panel seams beneath fine rounded pebbles', () => {
      const seam = empty(),
        field = empty(),
        crown = empty(),
        foot = empty();
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('basketball', seed);
        for (const v of [0.125, 0.375, 0.625, 0.875]) {
          const u = -0.06 * Math.sin(2 * Math.PI * v);
          sample(u, v, seam);
          sample(u + 0.08, v, field);
          expect(field.color).toBeGreaterThan(seam.color);
          expect(field.height).toBeGreaterThan(seam.height);
          expect(field.occlusion).toBeGreaterThan(seam.occlusion);
        }
        // This cell is inside a panel for every possible feature jitter.
        const column = 4,
          row = 4,
          u =
            (column + 0.35 + 0.3 * featureHash(column, row, seed ^ 0x19a7)) /
            36,
          v = (row + 0.35 + 0.3 * featureHash(column, row, seed ^ 0x5c23)) / 36;
        sample(u, v, crown);
        for (const direction of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
          sample(
            u + (Math.cos(direction) * 0.4) / 36,
            v + (Math.sin(direction) * 0.4) / 36,
            foot,
          );
          expect(crown.height).toBeGreaterThan(foot.height);
        }
      }
    });

    it('tennis felt surrounds a continuous pale curving recessed seam without a woven crossing', () => {
      const seam = empty(),
        field = empty(),
        fiber = empty(),
        beside = empty();
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('tennisball', seed);
        for (let i = 0; i <= 48; i++) {
          const u = i / 48,
            v = 0.25 + 0.19 * Math.sin(2 * Math.PI * u);
          for (const offset of [0, 0.5]) {
            sample(u, v + offset, seam);
            sample(u, v + offset + 0.08, field);
            expect(seam.color).toBeGreaterThan(field.color);
            expect(seam.height).toBeLessThan(field.height);
            expect(seam.roughness).toBeLessThan(field.roughness);
          }
        }
        const column = 3,
          row = 3,
          u =
            (column + 0.35 + 0.3 * featureHash(column, row, seed ^ 0x19a7)) /
            24,
          v = (row + 0.35 + 0.3 * featureHash(column, row, seed ^ 0x5c23)) / 24,
          angle = 2 * Math.PI * featureHash(column, row, seed ^ 0x37b1);
        sample(u, v, fiber);
        sample(
          u - (Math.sin(angle) * 0.12) / 24,
          v + (Math.cos(angle) * 0.12) / 24,
          beside,
        );
        expect(fiber.height).toBeGreaterThan(beside.height);
      }
    });

    it('golf dimples are regular circular concave bowls meeting smooth rims and flat land', () => {
      const center = empty(),
        out = empty(),
        land = empty();
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler('golfball', seed),
          offsetU = featureHash(0, 0, seed ^ 0x29b7),
          offsetV = featureHash(0, 0, seed ^ 0x61d3);
        for (const [column, row] of [
          [0, 0],
          [4, 7],
          [9, 9],
        ]) {
          const u = (column + offsetU + 0.5) / 10,
            v = (row + offsetV + 0.5) / 10;
          sample(u, v, center);
          sample(u + 0.047, v, land);
          for (let direction = 0; direction < 12; direction++) {
            const angle = (direction * Math.PI) / 6;
            let previous = center.height;
            for (const radius of [0.1, 0.2, 0.3, 0.4, 0.41]) {
              sample(
                u + (Math.cos(angle) * radius) / 10,
                v + (Math.sin(angle) * radius) / 10,
                out,
              );
              expect(out.height).toBeGreaterThan(previous);
              previous = out.height;
              const radialHeight = out.height;
              sample(u + radius / 10, v, out);
              expect(out.height).toBeCloseTo(radialHeight, 12);
            }
            for (const radius of [0.42, 0.46, 0.49]) {
              sample(
                u + (Math.cos(angle) * radius) / 10,
                v + (Math.sin(angle) * radius) / 10,
                out,
              );
              expect(out.height).toBe(land.height);
            }
          }
          sample(u + 0.02, v, out);
          expect(out.height - center.height).toBeLessThan(
            land.height - out.height,
          );
          expect(center.occlusion).toBeLessThan(land.occlusion);
        }
      }
    });

    it.each(['basketball', 'tennisball', 'golfball'] as const)(
      '%s has differentiable feature centers, shoulders and support boundaries',
      (kind) => {
        const center = empty(),
          left = empty(),
          right = empty(),
          epsilon =
            1e-8 /
            (kind === 'basketball' ? 36 : kind === 'tennisball' ? 24 : 10);
        for (const seed of [1, 123, 0xffffffff]) {
          const sample = createSurfaceSampler(kind, seed);
          const points: [number, number][] = [];
          if (kind === 'basketball') {
            const v = 0.125;
            for (const threshold of [0, 0.035, 0.08, 0.14])
              points.push([
                (Math.asin(threshold) / (2 * Math.PI) -
                  0.12 * Math.sin(2 * Math.PI * v)) /
                  2,
                v,
              ]);
            const u = (4.35 + 0.3 * featureHash(4, 4, seed ^ 0x19a7)) / 36,
              pv = (4.35 + 0.3 * featureHash(4, 4, seed ^ 0x5c23)) / 36,
              radius = 0.34 + 0.04 * featureHash(4, 4, seed ^ 0x73d9);
            points.push([u, pv], [u + radius / 36, pv]);
          } else if (kind === 'tennisball') {
            const u = 0.173;
            for (const threshold of [0, 0.025, 0.06, 0.1])
              points.push([
                u,
                0.25 +
                  0.19 * Math.sin(2 * Math.PI * u) +
                  Math.asin(threshold) / (2 * Math.PI),
              ]);
            const fu = (3.35 + 0.3 * featureHash(3, 3, seed ^ 0x19a7)) / 24,
              fv = (3.35 + 0.3 * featureHash(3, 3, seed ^ 0x5c23)) / 24,
              angle = 2 * Math.PI * featureHash(3, 3, seed ^ 0x37b1);
            points.push(
              [fu, fv],
              [
                fu - (Math.sin(angle) * 0.065) / 24,
                fv + (Math.cos(angle) * 0.065) / 24,
              ],
            );
          } else {
            const u = (0.5 + featureHash(0, 0, seed ^ 0x29b7)) / 10,
              v = (0.5 + featureHash(0, 0, seed ^ 0x61d3)) / 10;
            for (const radius of [0, 0.2, 0.41, 0.5])
              points.push([u + radius / 10, v]);
          }
          for (const [u, v] of points)
            for (const [du, dv] of [
              [epsilon, 0],
              [0, epsilon],
            ]) {
              sample(u - du, v - dv, left);
              sample(u, v, center);
              sample(u + du, v + dv, right);
              for (const key of Object.keys(center) as (keyof SurfaceSample)[])
                expect(
                  Math.abs(right[key] - 2 * center[key] + left[key]) / epsilon,
                ).toBeLessThan(0.001);
            }
        }
      },
    );
  });

  it('studded rubber has circular flat crowns and rounded descending shoulders', () => {
    const out: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('studdedrubber', seed);
      for (const [column, row] of [
        [0, 0],
        [3, 4],
        [5, 5],
      ]) {
        const u = (column + 0.5) / 6,
          v = (row + 0.5) / 6;
        sample(u, v, out);
        const crown = out.height;
        for (let direction = 0; direction < 8; direction++) {
          const angle = (direction * Math.PI) / 4;
          const at = (radius: number): number => {
            sample(
              u + (Math.cos(angle) * radius) / 6,
              v + (Math.sin(angle) * radius) / 6,
              out,
            );
            return out.height;
          };
          const plateauDifference = Math.abs(at(0.2) - crown);
          const upper = at(0.27),
            middle = at(0.3),
            lower = at(0.33),
            base = at(0.4);
          expect(plateauDifference).toBeLessThan((crown - base) * 0.01);
          expect(crown).toBeGreaterThan(upper);
          expect(upper).toBeGreaterThan(middle);
          expect(middle).toBeGreaterThan(lower);
          expect(lower).toBeGreaterThan(base);
          // Both shoulder joins flatten, unlike a hard bevel or domed stud.
          for (const join of [0.24, 0.36]) {
            const h = at(join),
              left = at(join - 0.0001),
              right = at(join + 0.0001);
            expect(Math.abs(right - 2 * h + left) / 0.0001).toBeLessThan(0.03);
          }
        }
      }
    }
  });

  it('grooved rubber keeps broad level crowns along narrow parallel recesses', () => {
    const out: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('groovedrubber', seed);
      for (const column of [0, 5, 11]) {
        for (const v of [0.13, 0.47, 0.89]) {
          const at = (across: number): number => {
            sample((column + 0.5 + across) / 12, v, out);
            return out.height;
          };
          const crown = at(0),
            shoulder = at(0.385),
            floor = at(0.48),
            flatTolerance = (crown - floor) * 0.01;
          for (const across of [-0.3, -0.15, 0.15, 0.3])
            expect(Math.abs(at(across) - crown)).toBeLessThan(flatTolerance);
          expect(crown).toBeGreaterThan(shoulder);
          expect(shoulder).toBeGreaterThan(floor);
          expect(Math.abs(at(0.46) - floor)).toBeLessThan(flatTolerance);
          sample((column + 0.5) / 12, v + 0.19, out);
          expect(Math.abs(out.height - crown)).toBeLessThan(flatTolerance);
          for (const join of [0.32, 0.45]) {
            const h = at(join),
              left = at(join - 0.0001),
              right = at(join + 0.0001);
            expect(Math.abs(right - 2 * h + left) / 0.0001).toBeLessThan(0.03);
          }
        }
      }
    }
  });

  it('recycled rubber has fine lighter compressed granules above dark binder', () => {
    const out: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('recycledrubber', seed);
      const heights: number[] = [];
      let low = Infinity,
        high = -Infinity,
        binderColor = 0,
        granuleColor = 0;
      // Resolve the fine aggregate along a physical tile-wide transect.
      for (let step = 0; step <= 3072; step++) {
        sample(step / 3072, 0.371, out);
        heights.push(out.height);
        if (out.height < low) {
          low = out.height;
          binderColor = out.color;
        }
        if (out.height > high) {
          high = out.height;
          granuleColor = out.color;
        }
      }
      expect(high).toBeGreaterThan(low);
      expect(granuleColor).toBeGreaterThan(binderColor);
      const threshold = low + (high - low) * 0.6;
      let run = 0,
        longest = 0;
      for (const height of heights) {
        run = height > threshold ? run + 1 : 0;
        longest = Math.max(longest, run);
      }
      // Dense fine crumbs, not isolated tile-scale terrazzo/asphalt stones.
      expect(longest / 3072).toBeLessThan(6 / 48);
    }
  });

  it('crackle glaze encloses smooth faces with fine dark recessed hairlines', () => {
    const face: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const crack = { ...face },
      beyond = { ...face };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('crackleglaze', seed);
      for (const [column, row] of [
        [0, 0],
        [7, 11],
        [15, 15],
      ]) {
        const u = (column + 0.5) / 16,
          v = (row + 0.5) / 16;
        sample(u, v, face);
        // Every direction leaves the smooth face through a crack and returns
        // to glaze; broad mud fissures cannot satisfy this hairline width.
        for (let direction = 0; direction < 8; direction++) {
          const angle = (direction * Math.PI) / 4,
            du = Math.cos(angle),
            dv = Math.sin(angle);
          let start = -1,
            end = -1,
            darkest = Infinity,
            crackU = 0,
            crackV = 0;
          for (let step = 1; step <= 384; step++) {
            const distance = step / (16 * 256);
            sample(u + du * distance, v + dv * distance, beyond);
            if (beyond.color < 0.5) {
              if (start < 0) start = distance;
              if (beyond.color < darkest) {
                darkest = beyond.color;
                crackU = u + du * distance;
                crackV = v + dv * distance;
                Object.assign(crack, beyond);
              }
            } else if (start >= 0) {
              end = distance;
              break;
            }
          }
          expect(start).toBeGreaterThan(0);
          expect(end).toBeGreaterThan(start);
          // At a network junction both coordinate axes can follow cracks.
          // Include oblique transects to measure width across the hairline.
          let narrowest = Infinity;
          for (let axis = 0; axis < 8; axis++) {
            const angle = (axis * Math.PI) / 8;
            let width = 0;
            for (const side of [-1, 1])
              for (let step = 1; step <= 256; step++) {
                const distance = (side * step) / (16 * 1024);
                sample(
                  crackU + Math.cos(angle) * distance,
                  crackV + Math.sin(angle) * distance,
                  beyond,
                );
                if (beyond.color >= 0.5 || step === 256) {
                  width += step / (16 * 1024);
                  break;
                }
              }
            narrowest = Math.min(narrowest, width);
          }
          expect(narrowest).toBeLessThan(1 / (16 * 8));
          expect(crack.height).toBeLessThan(face.height);
          expect(crack.occlusion).toBeLessThan(face.occlusion);
          expect(crack.roughness).toBeGreaterThan(face.roughness);
        }
      }
    }
  });

  it('ceramic flutes export rounded vertical ridges with no lengthwise normal slope', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('flutedceramic', seed);
      let across = 0,
        along = 0;
      for (let x = 0; x < 128; x++) {
        const u = (x + 0.5) / 128;
        sample(u, 0.23, a);
        sample(u + 1 / 64, 0.23, b);
        across += Math.abs(a.height - b.height);
        sample(u, 0.71, b);
        along += Math.abs(a.height - b.height);
      }
      expect(across).toBeGreaterThan(0);
      expect(along).toBeLessThan(across / 100);
      const maps = generateProceduralMaps('flutedceramic', 128, seed);
      for (let p = 0; p < maps.normal.length; p += 4)
        expect(maps.normal[p + 1]).toBe(128);
      expect(maps.normal.some((value, i) => i % 4 === 0 && value !== 128)).toBe(
        true,
      );
    }
  });

  it('encaustic ornament is flat pigment above recessed square grout', () => {
    const face: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const pigment = { ...face },
      grout = { ...face };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('encaustictiles', seed);
      for (const [column, row] of [
        [0, 0],
        [2, 1],
        [3, 3],
      ]) {
        sample((column + 0.78) / 4, (row + 0.72) / 4, face);
        sample((column + 0.66) / 4, (row + 0.5) / 4, pigment);
        expect(pigment.color).toBeLessThan(face.color);
        expect(face.height).toBe(pigment.height);
        expect(face.mortar).toBe(0);
        expect(pigment.mortar).toBe(0);
        for (const [x, y] of [
          [column, row + 0.5],
          [column + 0.5, row],
        ]) {
          sample(x / 4, y / 4, grout);
          expect(grout.height).toBeLessThan(face.height);
          expect(grout.occlusion).toBeLessThan(face.occlusion);
          expect(grout.mortar).toBeGreaterThan(face.mortar);
        }
        // Crossing a corner bevel's diagonal must not switch abruptly between
        // the horizontal and vertical grout slopes.
        const epsilon = 1e-9;
        for (const edge of [0.04, 0.06, 0.08])
          for (const sx of [1, -1])
            for (const sy of [1, -1]) {
              const u = (column + (sx === 1 ? edge : 1 - edge)) / 4,
                v = (row + (sy === 1 ? edge : 1 - edge)) / 4;
              sample(u - epsilon, v, face);
              sample(u, v, grout);
              sample(u + epsilon, v, pigment);
              for (const key of ['height', 'mortar', 'occlusion'] as const)
                expect(
                  Math.abs(face[key] - 2 * grout[key] + pigment[key]) / epsilon,
                ).toBeLessThan(0.01);
            }
      }
      const maps = generateProceduralMaps('encaustictiles', 128, seed);
      for (let y = 0; y < 128; y++)
        for (let x = 0; x < 128; x++) {
          const tx = x % 32,
            ty = y % 32;
          if (tx < 4 || tx > 27 || ty < 4 || ty > 27) continue;
          const p = (y * 128 + x) * 4;
          expect(maps.normal[p]).toBe(128);
          expect(maps.normal[p + 1]).toBe(128);
        }
    }
  });

  it.each([
    'crackleglaze',
    'flutedceramic',
    'encaustictiles',
    'fishscales',
    'tortoiseshell',
    'feathers',
    'cactus',
    'pinecone',
    'corncob',
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
    'boardformedconcrete',
    'ribbedconcrete',
    'splitfaceblock',
    'sandpaper',
    'steelwool',
    'wirebrush',
    'cheesegrater',
    'ovenrack',
    'muffintin',
    'gauze',
    'elasticbandage',
    'icepack',
  ] as const)(
    '%s has C1 fields through narrow shoulders, overlapping owners and support',
    (kind) => {
      const a: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      const b = { ...a },
        center = { ...a },
        halfA = { ...a },
        halfB = { ...a };
      const cells =
        kind === 'cactus' || kind === 'pinecone' || kind === 'corncob'
          ? 12
          : kind === 'crackleglaze'
            ? 16
            : kind === 'flutedceramic'
              ? 96
              : kind === 'fishscales'
                ? 10
                : kind === 'tortoiseshell'
                  ? 6
                  : kind === 'feathers'
                    ? 8
                    : kind === 'breadcrust'
                      ? 7
                      : kind === 'wafer'
                        ? 12
                        : kind === 'pretzel'
                          ? 3
                          : kind === 'bagel'
                            ? 2
                            : kind === 'butterflywing'
                              ? 24
                              : kind === 'beetlewing'
                                ? 6
                                : kind === 'spiderweb'
                                  ? 2
                                  : kind === 'cirrus'
                                    ? 6
                                    : kind === 'cumulus'
                                      ? 5
                                      : kind === 'lightning'
                                        ? 3
                                        : kind === 'kelp'
                                          ? 4
                                          : kind === 'seaweed'
                                            ? 3
                                            : kind === 'anemone'
                                              ? 8
                                              : kind === 'candy'
                                                ? 4
                                                : kind === 'marshmallow'
                                                  ? 5
                                                  : kind === 'nougat'
                                                    ? 6
                                                    : kind === 'frostedglass'
                                                      ? 32
                                                      : kind === 'rippledglass'
                                                        ? 6
                                                        : kind === 'bubbleglass'
                                                          ? 8
                                                          : kind ===
                                                              'saddlestitch'
                                                            ? 8
                                                            : kind ===
                                                                'tooledleather'
                                                              ? 4
                                                              : kind ===
                                                                  'patentleather'
                                                                ? 32
                                                                : kind ===
                                                                    'appleskin'
                                                                  ? 5
                                                                  : kind ===
                                                                      'peachskin'
                                                                    ? 2
                                                                    : kind ===
                                                                        'grapeskin'
                                                                      ? 6
                                                                      : kind ===
                                                                          'broccoli'
                                                                        ? 10
                                                                        : kind ===
                                                                            'cabbage'
                                                                          ? 3
                                                                          : kind ===
                                                                              'onion'
                                                                            ? 6
                                                                            : kind ===
                                                                                'bedsheet'
                                                                              ? 4
                                                                              : kind ===
                                                                                  'pillow'
                                                                                ? 2
                                                                                : kind ===
                                                                                    'mattress'
                                                                                  ? 4
                                                                                  : kind ===
                                                                                      'tealeaf'
                                                                                    ? 6
                                                                                    : kind ===
                                                                                        'matcha'
                                                                                      ? 5
                                                                                      : kind ===
                                                                                          'teabag'
                                                                                        ? 24
                                                                                        : kind ===
                                                                                            'sanddune'
                                                                                          ? 6
                                                                                          : kind ===
                                                                                              'pebblebeach'
                                                                                            ? 5
                                                                                            : kind ===
                                                                                                'foamedge'
                                                                                              ? 6
                                                                                              : kind ===
                                                                                                  'lavaflow'
                                                                                                ? 5
                                                                                                : kind ===
                                                                                                    'cooledlava'
                                                                                                  ? 4
                                                                                                  : kind ===
                                                                                                      'ashfield'
                                                                                                    ? 6
                                                                                                    : kind ===
                                                                                                        'stalactite'
                                                                                                      ? 4
                                                                                                      : kind ===
                                                                                                          'flowstone'
                                                                                                        ? 5
                                                                                                        : kind ===
                                                                                                            'cavefloor'
                                                                                                          ? 6
                                                                                                          : kind ===
                                                                                                              'jam'
                                                                                                            ? 5
                                                                                                            : kind ===
                                                                                                                'peanutbutter'
                                                                                                              ? 6
                                                                                                              : kind ===
                                                                                                                  'sprinkles'
                                                                                                                ? 6
                                                                                                                : kind ===
                                                                                                                    'icecream'
                                                                                                                  ? 5
                                                                                                                  : kind ===
                                                                                                                      'popsicle'
                                                                                                                    ? 8
                                                                                                                    : kind ===
                                                                                                                        'sorbet'
                                                                                                                      ? 6
                                                                                                                      : kind ===
                                                                                                                          'spaghetti'
                                                                                                                        ? 6
                                                                                                                        : kind ===
                                                                                                                            'macaroni'
                                                                                                                          ? 4
                                                                                                                          : kind ===
                                                                                                                              'lasagna'
                                                                                                                            ? 4
                                                                                                                            : kind ===
                                                                                                                                'origami'
                                                                                                                              ? 2
                                                                                                                              : kind ===
                                                                                                                                  'paperlace'
                                                                                                                                ? 6
                                                                                                                                : kind ===
                                                                                                                                    'papercut'
                                                                                                                                  ? 5
                                                                                                                                  : kind ===
                                                                                                                                      'sunflower'
                                                                                                                                    ? 8
                                                                                                                                    : kind ===
                                                                                                                                        'daisy'
                                                                                                                                      ? 4
                                                                                                                                      : kind ===
                                                                                                                                          'clover'
                                                                                                                                        ? 3
                                                                                                                                        : kind ===
                                                                                                                                            'puzzletile'
                                                                                                                                          ? 2
                                                                                                                                          : kind ===
                                                                                                                                              'legobrick'
                                                                                                                                            ? 4
                                                                                                                                            : kind ===
                                                                                                                                                'rubberband'
                                                                                                                                              ? 3
                                                                                                                                              : kind ===
                                                                                                                                                  'haybale'
                                                                                                                                                ? 10
                                                                                                                                                : kind ===
                                                                                                                                                    'corncrib'
                                                                                                                                                  ? 3
                                                                                                                                                  : kind ===
                                                                                                                                                      'fencepost'
                                                                                                                                                    ? 6
                                                                                                                                                    : kind ===
                                                                                                                                                        'poolfelt'
                                                                                                                                                      ? 8
                                                                                                                                                      : kind ===
                                                                                                                                                          'icesurface'
                                                                                                                                                        ? 7
                                                                                                                                                        : kind ===
                                                                                                                                                            'climbingwall'
                                                                                                                                                          ? 3
                                                                                                                                                          : kind ===
                                                                                                                                                              'oledpanel'
                                                                                                                                                            ? 18
                                                                                                                                                            : kind ===
                                                                                                                                                                'crtscanline'
                                                                                                                                                              ? 10
                                                                                                                                                              : kind ===
                                                                                                                                                                  'keyboardkey'
                                                                                                                                                                ? 6
                                                                                                                                                                : kind ===
                                                                                                                                                                    'filmstrip'
                                                                                                                                                                  ? 8
                                                                                                                                                                  : kind ===
                                                                                                                                                                      'postagestamp'
                                                                                                                                                                    ? 8
                                                                                                                                                                    : kind ===
                                                                                                                                                                        'halftoneprint'
                                                                                                                                                                      ? 6
                                                                                                                                                                      : kind ===
                                                                                                                                                                          'radiator'
                                                                                                                                                                        ? 5
                                                                                                                                                                        : kind ===
                                                                                                                                                                            'screwhead'
                                                                                                                                                                          ? 4
                                                                                                                                                                          : kind ===
                                                                                                                                                                              'chainlink'
                                                                                                                                                                            ? 3
                                                                                                                                                                            : kind ===
                                                                                                                                                                                'friedegg'
                                                                                                                                                                              ? 4
                                                                                                                                                                              : kind ===
                                                                                                                                                                                  'sushirice'
                                                                                                                                                                                ? 6
                                                                                                                                                                                : kind ===
                                                                                                                                                                                    'chocolatechip'
                                                                                                                                                                                  ? 3
                                                                                                                                                                                  : kind ===
                                                                                                                                                                                      'cargomat'
                                                                                                                                                                                    ? 4
                                                                                                                                                                                    : kind ===
                                                                                                                                                                                        'dashboardgrain'
                                                                                                                                                                                      ? 10
                                                                                                                                                                                      : kind ===
                                                                                                                                                                                          'licenseplate'
                                                                                                                                                                                        ? 4
                                                                                                                                                                                        : kind ===
                                                                                                                                                                                            'flowerbed'
                                                                                                                                                                                          ? 3
                                                                                                                                                                                          : kind ===
                                                                                                                                                                                              'grassstripe'
                                                                                                                                                                                            ? 2
                                                                                                                                                                                            : kind ===
                                                                                                                                                                                                'topiary'
                                                                                                                                                                                              ? 3
                                                                                                                                                                                              : kind ===
                                                                                                                                                                                                  'confetti'
                                                                                                                                                                                                ? 4
                                                                                                                                                                                                : kind ===
                                                                                                                                                                                                    'ribbonstreamer'
                                                                                                                                                                                                  ? 3
                                                                                                                                                                                                  : kind ===
                                                                                                                                                                                                      'pinatafringe'
                                                                                                                                                                                                    ? 14
                                                                                                                                                                                                    : kind ===
                                                                                                                                                                                                        'xylophone'
                                                                                                                                                                                                      ? 4
                                                                                                                                                                                                      : kind ===
                                                                                                                                                                                                          'tambourine'
                                                                                                                                                                                                        ? 5
                                                                                                                                                                                                        : kind ===
                                                                                                                                                                                                            'castanet'
                                                                                                                                                                                                          ? 3
                                                                                                                                                                                                          : kind ===
                                                                                                                                                                                                              'pillcapsule'
                                                                                                                                                                                                            ? 3
                                                                                                                                                                                                            : kind ===
                                                                                                                                                                                                                'pilltablet'
                                                                                                                                                                                                              ? 4
                                                                                                                                                                                                              : kind ===
                                                                                                                                                                                                                  'bathbomb'
                                                                                                                                                                                                                ? 4
                                                                                                                                                                                                                : kind ===
                                                                                                                                                                                                                    'sandpaper'
                                                                                                                                                                                                                  ? 3
                                                                                                                                                                                                                  : kind ===
                                                                                                                                                                                                                      'steelwool'
                                                                                                                                                                                                                    ? 4
                                                                                                                                                                                                                    : kind ===
                                                                                                                                                                                                                        'wirebrush'
                                                                                                                                                                                                                      ? 4
                                                                                                                                                                                                                      : kind ===
                                                                                                                                                                                                                          'cheesegrater'
                                                                                                                                                                                                                        ? 3
                                                                                                                                                                                                                        : kind ===
                                                                                                                                                                                                                            'ovenrack'
                                                                                                                                                                                                                          ? 4
                                                                                                                                                                                                                          : kind ===
                                                                                                                                                                                                                              'muffintin'
                                                                                                                                                                                                                            ? 4
                                                                                                                                                                                                                            : kind ===
                                                                                                                                                                                                                                'gauze'
                                                                                                                                                                                                                              ? 4
                                                                                                                                                                                                                              : kind ===
                                                                                                                                                                                                                                  'elasticbandage'
                                                                                                                                                                                                                                ? 3
                                                                                                                                                                                                                                : kind ===
                                                                                                                                                                                                                                    'icepack'
                                                                                                                                                                                                                                  ? 4
                                                                                                                                                                                                                                  : 4;
      // Extrapolate each one-sided slope to cancel smooth curvature. A usable
      // step avoids amplified rounding error from tiny hairline sample offsets.
      const epsilon = 1e-7 / cells;
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        for (let i = 0; i < 1024; i++) {
          const u = i < 64 ? (i % cells) / cells : (i + 0.37) / 1024,
            v =
              i >= 64 && i < 128
                ? (i % cells) / cells
                : (((i * 157) % 1024) + 0.29) / 1024;
          for (const [du, dv] of [
            [epsilon, 0],
            [0, epsilon],
          ]) {
            sample(u - du, v - dv, a);
            sample(u, v, center);
            sample(u + du, v + dv, b);
            sample(u - du / 2, v - dv / 2, halfA);
            sample(u + du / 2, v + dv / 2, halfB);
            for (const key of Object.keys(a) as (keyof SurfaceSample)[])
              expect(
                Math.abs(
                  4 * (halfA[key] + halfB[key]) -
                    a[key] -
                    b[key] -
                    6 * center[key],
                ) / epsilon,
              ).toBeLessThan(0.001);
          }
        }
      }
    },
  );
  it.each(['limestone', 'breccia'] as const)(
    '%s recesses porous or cement matrix below the exposed mineral faces',
    (kind) => {
      const surface: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        let lowestOcclusion = Infinity,
          highestOcclusion = -Infinity,
          recessedHeight = 0,
          faceHeight = 0;
        // Find the matrix and mineral faces from cavity shading rather than
        // duplicating the seeded geometry or pinning incidental relief values.
        for (let y = 0; y < 128; y++)
          for (let x = 0; x < 128; x++) {
            sample((x + 0.5) / 128, (y + 0.5) / 128, surface);
            if (surface.occlusion < lowestOcclusion) {
              lowestOcclusion = surface.occlusion;
              recessedHeight = surface.height;
            }
            if (surface.occlusion > highestOcclusion) {
              highestOcclusion = surface.occlusion;
              faceHeight = surface.height;
            }
          }
        expect(lowestOcclusion).toBeLessThan(highestOcclusion);
        expect(recessedHeight).toBeLessThan(faceHeight);
      }
    },
  );

  it('orange oil glands are depressed below the surrounding rounded skin', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('orangepeel', seed);
      for (const [column, row] of [
        [0, 0],
        [7, 13],
        [23, 19],
      ]) {
        let centerU = 0,
          centerV = 0,
          glandOcclusion = 1,
          glandHeight = 0;
        // Locate a seeded gland by its cavity shading, not a copied hash.
        for (let y = 0; y < 17; y++)
          for (let x = 0; x < 17; x++) {
            const u = (column + (x + 0.5) / 17) / 24,
              v = (row + (y + 0.5) / 17) / 24;
            sample(u, v, a);
            if (a.occlusion < glandOcclusion) {
              centerU = u;
              centerV = v;
              glandOcclusion = a.occlusion;
              glandHeight = a.height;
            }
          }
        let skinHeight = 0,
          skinOcclusion = 0;
        for (let direction = 0; direction < 8; direction++) {
          const angle = (direction / 8) * Math.PI * 2;
          sample(
            centerU + (0.5 / 24) * Math.cos(angle),
            centerV + (0.5 / 24) * Math.sin(angle),
            a,
          );
          skinHeight += a.height / 8;
          skinOcclusion += a.occlusion / 8;
        }
        expect(glandHeight).toBeLessThan(skinHeight);
        expect(glandOcclusion).toBeLessThan(skinOcclusion);
      }
    }
  });

  it.each([
    ['coconut', 'height'],
    ['watermelon', 'color'],
  ] as const)(
    '%s has longitudinal %s features rather than crosswise bands',
    (kind, field) => {
      const a: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      const b = { ...a };
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        let transverse = 0,
          longitudinal = 0;
        for (let y = 0; y < 128; y++)
          for (let x = 0; x < 128; x++) {
            const u = (x + 0.5) / 128,
              v = (y + 0.5) / 128;
            sample(u, v, a);
            sample(u + 1 / 128, v, b);
            transverse += (a[field] - b[field]) ** 2;
            sample(u, v + 1 / 128, b);
            longitudinal += (a[field] - b[field]) ** 2;
          }
        expect(transverse).toBeGreaterThan(longitudinal);
      }
    },
  );

  it('perforatedmetal recesses staggered round holes below the sheet web', () => {
    const floor: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const rim = { ...floor },
      web = { ...floor };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('perforatedmetal', seed);
      for (const row of [0, 1, 4, 5])
        for (const column of [0, 2, 5]) {
          // Hole centers stagger by half a cell on alternating rows.
          const shift = (row % 2) * 0.5;
          const cx = (column + 0.5 + shift) / 6,
            cy = (row + 0.5) / 6;
          sample(cx, cy, floor);
          for (const [dx, dy] of [
            [0.24, 0],
            [-0.24, 0],
            [0, 0.24],
            [0, -0.24],
          ]) {
            sample(cx + dx / 6, cy + dy / 6, rim);
            expect(rim.height).toBeGreaterThan(floor.height);
            expect(rim.occlusion).toBeGreaterThan(floor.occlusion);
          }
          sample((column + 1 + shift) / 6, cy, web);
          expect(web.height).toBeGreaterThan(floor.height);
          expect(web.occlusion).toBeGreaterThan(floor.occlusion + 0.3);
        }
    }
  });

  it('expandedmetal raises both diagonal strand families above rhombic openings', () => {
    const opening: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const strand = { ...opening },
      node = { ...opening };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('expandedmetal', seed);
      for (const k of [0, 2, 5])
        for (const m of [0, 1, 4]) {
          // Crests sit on u+v=k/5 and u-v=m/5; openings center between both.
          sample((k + m) / 10, (k - m) / 10, node);
          sample((k + 0.5) / 10, (k - 0.5) / 10, strand);
          sample((k + m + 1) / 10, (k - m) / 10, opening);
          expect(node.height).toBeGreaterThan(strand.height);
          expect(strand.height).toBeGreaterThan(opening.height);
          expect(strand.occlusion).toBeGreaterThan(opening.occlusion + 0.4);
          expect(opening.color).toBeLessThan(strand.color);
        }
    }
  });

  it('wiremesh exchanges over-under wires across crossings above open gaps', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a },
      crest = { ...a },
      edge = { ...a },
      gap = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('wiremesh', seed);
      for (const column of [0, 3, 7, 11])
        for (const row of [0, 2, 5])
          for (const offset of [0.14, 0.2]) {
            // Crest points just off each crossing expose which wire is over.
            sample((column + 0.5) / 12, (row + 0.5 + offset) / 12, a);
            sample((column + 0.5 + offset) / 12, (row + 0.5) / 12, b);
            const sign = (column + row) % 2 === 0 ? 1 : -1;
            expect((a.height - b.height) * sign).toBeGreaterThan(0);
            // The wire that dives under resumes on top at the next crossing.
            sample((column + 0.5) / 12, (row + 1.5 + offset) / 12, a);
            sample((column + 0.5 + offset) / 12, (row + 1.5) / 12, b);
            expect((a.height - b.height) * sign).toBeLessThan(0);
            // Round crests stay above their own edges and far above gaps.
            sample((column + 0.5) / 12, (row + 1) / 12, crest);
            sample((column + 0.5 + 0.25) / 12, (row + 1) / 12, edge);
            sample((column + 1) / 12, (row + 1) / 12, gap);
            expect(crest.height).toBeGreaterThan(edge.height);
            expect(edge.height).toBeGreaterThan(gap.height);
            expect(gap.occlusion).toBeLessThan(crest.occlusion - 0.2);
          }
    }
  });

  it('velvet keeps a flat fine pile while crush clouds shift pigment and sheen', () => {
    const relief = proceduralMaterialPresets.velvet.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    let low = 1,
      high = 0,
      dark = 1,
      light = 0,
      matte = 1,
      sheen = 0;
    const sample = createSurfaceSampler('velvet', 123);
    for (let i = 0; i < 480; i++) {
      sample((i * 0.618) % 1, (i * 0.7549) % 1, surface);
      low = Math.min(low, surface.height);
      high = Math.max(high, surface.height);
      dark = Math.min(dark, surface.color);
      light = Math.max(light, surface.color);
      matte = Math.min(matte, surface.roughness);
      sheen = Math.max(sheen, surface.roughness);
    }
    expect(high - low).toBeLessThan(0.12 * relief);
    expect(light - dark).toBeGreaterThan(0.15);
    expect(sheen - matte).toBeGreaterThan(0.05);
  });

  it('terrycloth raises staggered loop crowns above the woven ground', () => {
    const ground: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const crown = { ...ground },
      across = { ...ground },
      shifted = { ...ground };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('terrycloth', seed);
      for (const row of [0, 1, 5, 7])
        for (const column of [0, 4, 9]) {
          // Loop crowns stagger by half a cell on alternating rows.
          const shift = (row % 2) * 0.5;
          const cx = (column + 0.5 + shift) / 10,
            cy = (row + 0.5) / 8;
          sample(cx, cy, crown);
          sample((column + 1 + shift) / 10, cy, across);
          expect(crown.height).toBeGreaterThan(across.height);
          expect(crown.occlusion).toBeGreaterThan(across.occlusion);
          sample(
            (column + 0.5 + ((row + 1) % 2) * 0.5) / 10,
            (row + 1.5) / 8,
            shifted,
          );
          sample((column + 0.5 + shift) / 10, (row + 1.5) / 8, ground);
          expect(shifted.height).toBeGreaterThan(ground.height);
        }
    }
  });

  it('boucle curls raised loop rings over yarn courses above recessed channels', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a },
      channel = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('boucle', seed);
      for (const row of [0, 2, 5]) {
        // A fine scan finds the annular crest on each yarn course.
        let peak = 0,
          peakX = 0;
        for (let i = 0; i < 256; i++) {
          const t = (i + 0.5) / 256;
          sample(t, (row + 0.5) / 6, a);
          if (a.height > peak) {
            peak = a.height;
            peakX = t * 8;
          }
        }
        sample(0.5, (row + 1) / 6, channel);
        expect(peak).toBeGreaterThan(channel.height);
        // The ring crest encircles a lower center, still above the channel.
        let inner = peak;
        for (let k = 0; k < 8; k++) {
          const angle = (Math.PI / 4) * k;
          sample(
            (peakX + 0.16 * Math.cos(angle)) / 8,
            (row + 0.5 + 0.16 * Math.sin(angle)) / 6,
            b,
          );
          if (b.height < inner) inner = b.height;
        }
        expect(inner).toBeLessThan(peak);
        expect(inner).toBeGreaterThan(channel.height);
      }
    }
  });

  it('geode alternates concentric mineral bands around its druse core', () => {
    const relief = proceduralMaterialPresets.geode.relief;
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const core = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('geode', seed);
      for (const angle of [0, 1, 2]) {
        const cos = Math.cos(angle),
          sin = Math.sin(angle);
        let previous = 0,
          last = 0,
          flips = 0,
          low = 1,
          high = 0;
        for (let i = 24; i <= 72; i++) {
          const t = i / 240;
          sample(0.5 + t * cos, 0.5 + t * sin, a);
          low = Math.min(low, a.height);
          high = Math.max(high, a.height);
          const delta = a.height - previous;
          if (previous && delta * (last ?? 0) < 0) flips++;
          if (delta) last = delta;
          previous = a.height;
        }
        // Bands ripple through several crest/trough alternations per ray.
        expect(high - low).toBeGreaterThan(0.15 * relief);
        expect(flips).toBeGreaterThanOrEqual(3);
        // The druse core carries fine facet sparkle of its own.
        let coreHigh = 0,
          coreLow = 1;
        for (let i = 0; i < 24; i++) {
          const ray = (Math.PI * 2 * i) / 24;
          sample(0.5 + 0.08 * Math.cos(ray), 0.5 + 0.08 * Math.sin(ray), core);
          coreHigh = Math.max(coreHigh, core.color);
          coreLow = Math.min(coreLow, core.color);
        }
        expect(coreHigh - coreLow).toBeGreaterThan(0.12);
      }
    }
  });

  it('quartz raises pyramidal apices over varied hexagonal prism tops', () => {
    const relief = proceduralMaterialPresets.quartz.relief;
    const probe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const edge = { ...probe },
      gap = { ...probe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('quartz', seed);
      const apices: number[] = [];
      for (const [column, row] of [
        [0, 0],
        [2, 3],
        [4, 1],
      ]) {
        // A fine scan locates each prism's apex inside its own cell.
        let peak = 0,
          peakX = 0,
          low = 1,
          lowX = 0,
          lowY = 0;
        for (let j = 0; j < 20; j++)
          for (let i = 0; i < 20; i++) {
            const u = (column + (i + 0.5) / 20) / 5,
              v = (row + (j + 0.5) / 20) / 5;
            sample(u, v, probe);
            if (probe.height > peak) {
              peak = probe.height;
              peakX = u;
            }
            if (probe.height < low) {
              low = probe.height;
              lowX = u;
              lowY = v;
            }
          }
        apices.push(peak);
        expect(peak).toBeGreaterThan(low + 0.1 * relief);
        sample(peakX + 0.15 / 5, (row + 0.5) / 5, edge);
        expect(peak).toBeGreaterThan(edge.height);
        sample(lowX, lowY, gap);
        expect(peak).toBeGreaterThan(gap.height + 0.1 * relief);
      }
      // Crystal tips grow to different heights across the cluster.
      expect(Math.max(...apices) - Math.min(...apices)).toBeGreaterThan(
        0.05 * relief,
      );
    }
  });

  it('pyrite steps interlocking cube tops above gaps with striated faces', () => {
    const relief = proceduralMaterialPresets.pyrite.relief;
    const probe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const across = { ...probe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('pyrite', seed);
      for (const [column, row] of [
        [1, 1],
        [3, 0],
        [4, 4],
      ]) {
        let peak = 0,
          peakX = 0,
          peakY = 0,
          low = 1;
        for (let j = 0; j < 20; j++)
          for (let i = 0; i < 20; i++) {
            const u = (column + (i + 0.5) / 20) / 5,
              v = (row + (j + 0.5) / 20) / 5;
            sample(u, v, probe);
            if (probe.height > peak) {
              peak = probe.height;
              peakX = u;
              peakY = v;
            }
            low = Math.min(low, probe.height);
          }
        expect(peak).toBeGreaterThan(low + 0.1 * relief);
        // Striations cut fine ridges across the exposed cube top.
        let high = 0,
          matte = 1,
          sheen = 0;
        for (let i = 1; i < 20; i++) {
          sample(peakX + i / 200, peakY, across);
          high = Math.max(high, across.height);
          matte = Math.min(matte, across.roughness);
          sheen = Math.max(sheen, across.roughness);
        }
        expect(high).toBeGreaterThan(peak - 0.05 * relief);
        expect(sheen - matte).toBeGreaterThan(0.02);
      }
    }
  });

  it('shiplap laps boards above recessed seams with running grain', () => {
    const relief = proceduralMaterialPresets.shiplap.relief;
    const face: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const seam = { ...face },
      along = { ...face };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('shiplap', seed);
      const tones = new Set<number>();
      for (const row of [0, 1, 3, 4]) {
        sample(0.37, (row + 0.5) / 5, face);
        tones.add(face.color);
        sample(0.37, row / 5, seam);
        expect(face.height).toBeGreaterThan(seam.height + 0.1 * relief);
        expect(face.occlusion).toBeGreaterThan(seam.occlusion);
      }
      // Seeded boards take different tones and grain runs along each face.
      expect(tones.size).toBeGreaterThan(1);
      let low = 1,
        high = 0;
      for (let i = 0; i < 16; i++) {
        sample(i / 16, 2.5 / 5, along);
        low = Math.min(low, along.color);
        high = Math.max(high, along.color);
      }
      expect(high - low).toBeGreaterThan(0.05);
    }
  });

  it('glassblock domes trapped bubbles over block faces above recessed seams', () => {
    const relief = proceduralMaterialPresets.glassblock.relief;
    const probe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const near = { ...probe },
      seam = { ...probe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('glassblock', seed);
      for (const [column, row] of [
        [0, 0],
        [2, 1],
        [3, 3],
      ]) {
        let peak = 0,
          peakX = 0,
          peakY = 0;
        for (let j = 0; j < 16; j++)
          for (let i = 0; i < 16; i++) {
            const u = (column + (i + 0.5) / 16) / 4,
              v = (row + (j + 0.5) / 16) / 4;
            sample(u, v, probe);
            if (probe.height > peak) {
              peak = probe.height;
              peakX = u;
              peakY = v;
            }
          }
        // The dome peak falls off before the flat face around it.
        for (let k = 0; k < 8; k++) {
          const angle = (Math.PI / 4) * k;
          sample(
            peakX + (0.09 * Math.cos(angle)) / 4,
            peakY + (0.09 * Math.sin(angle)) / 4,
            near,
          );
          expect(peak).toBeGreaterThan(near.height);
        }
        sample((column + 1) / 4, (row + 1) / 4, seam);
        expect(peak).toBeGreaterThan(seam.height + 0.1 * relief);
      }
    }
  });

  it('thatch layers straw courses above their shadowed laps', () => {
    const relief = proceduralMaterialPresets.thatch.relief;
    const crest: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const lap = { ...crest },
      along = { ...crest };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('thatch', seed);
      for (const row of [0, 2, 5])
        for (let i = 0; i < 8; i++) {
          const u = (i + 0.5) / 8;
          sample(u, (row + 0.21) / 6, crest);
          sample(u, (row + 0.73) / 6, lap);
          expect(crest.height).toBeGreaterThan(lap.height + 0.1 * relief);
          expect(crest.occlusion).toBeGreaterThan(lap.occlusion);
        }
      // Individual straws streak pigment along the slope.
      let low = 1,
        high = 0;
      for (let i = 0; i < 16; i++) {
        sample(i / 16, 2.21 / 6, along);
        low = Math.min(low, along.color);
        high = Math.max(high, along.color);
      }
      expect(high - low).toBeGreaterThan(0.05);
    }
  });

  it('charredwood lifts rounded charcoal scales above its alligator cracks', () => {
    const relief = proceduralMaterialPresets.charredwood.relief;
    const probe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const edge = { ...probe },
      crack = { ...probe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('charredwood', seed);
      for (const [column, row] of [
        [0, 0],
        [3, 5],
        [8, 2],
      ]) {
        let peak = 0,
          peakX = 0,
          peakY = 0,
          low = 1,
          lowX = 0,
          lowY = 0;
        for (let j = 0; j < 18; j++)
          for (let i = 0; i < 18; i++) {
            const u = (column + (i + 0.5) / 18) / 9,
              v = (row + (j + 0.5) / 18) / 9;
            sample(u, v, probe);
            if (probe.height > peak) {
              peak = probe.height;
              peakX = u;
              peakY = v;
            }
            if (probe.height < low) {
              low = probe.height;
              lowX = u;
              lowY = v;
            }
          }
        expect(peak).toBeGreaterThan(low + 0.1 * relief);
        // The rounded scale falls toward its own shoulder before the crack.
        for (let k = 0; k < 8; k++) {
          const angle = (Math.PI / 4) * k;
          sample(
            peakX + (0.12 * Math.cos(angle)) / 9,
            peakY + (0.12 * Math.sin(angle)) / 9,
            edge,
          );
          expect(peak).toBeGreaterThan(edge.height);
        }
        sample(lowX, lowY, crack);
        expect(peak).toBeGreaterThan(crack.height + 0.1 * relief);
      }
    }
  });

  it('driftwood opens grain-aligned cracks below silvered ridges', () => {
    const relief = proceduralMaterialPresets.driftwood.relief;
    const probe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const along = { ...probe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('driftwood', seed);
      for (const u of [0.1, 0.5, 0.9]) {
        // Scanning one crack period finds the ridge crest and crack floor
        // wherever the warp drifts their shared line.
        let high = 0,
          highV = 0,
          low = 1,
          lowV = 0;
        for (let i = 0; i < 48; i++) {
          const v = 3 / 7 + i / (48 * 7);
          sample(u, v, probe);
          if (probe.height > high) {
            high = probe.height;
            highV = v;
          }
          if (probe.height < low) {
            low = probe.height;
            lowV = v;
          }
        }
        expect(high).toBeGreaterThan(low + 0.2 * relief);
        sample(u, highV, probe);
        const crestOcclusion = probe.occlusion;
        sample(u, lowV, probe);
        expect(crestOcclusion).toBeGreaterThan(probe.occlusion);
        // The crack floor follows the grain instead of wandering across it.
        expect(
          Math.min(Math.abs(lowV - 3 / 7), Math.abs(lowV - 4 / 7)),
        ).toBeLessThan(0.03);
      }
      // Silvered grain streaks pigment along the board.
      let low = 1,
        high = 0;
      for (let i = 0; i < 16; i++) {
        sample(i / 16, 3.5 / 7, along);
        low = Math.min(low, along.color);
        high = Math.max(high, along.color);
      }
      expect(high - low).toBeGreaterThan(0.05);
    }
  });

  it('peeling paint curls its rim above the intact face and bare substrate', () => {
    const relief = proceduralMaterialPresets.peelingpaint.relief;
    const probe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const bare = { ...probe },
      near = { ...probe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('peelingpaint', seed);
      let rim = 0,
        rimX = 0,
        rimY = 0,
        bareLow = 1;
      for (let j = 0; j < 24; j++)
        for (let i = 0; i < 24; i++) {
          const u = (i + 0.5) / 24,
            v = (j + 0.5) / 24;
          sample(u, v, probe);
          if (probe.height > rim) {
            rim = probe.height;
            rimX = u;
            rimY = v;
          }
          if (probe.height < bareLow) {
            bareLow = probe.height;
            sample(u, v, bare);
          }
        }
      // The curling rim drops off before the surrounding paint and lifts
      // the paint stack well above the exposed substrate.
      for (let k = 0; k < 8; k++) {
        const angle = (Math.PI / 4) * k;
        sample(
          rimX + 0.06 * Math.cos(angle),
          rimY + 0.06 * Math.sin(angle),
          near,
        );
        expect(rim).toBeGreaterThan(near.height);
      }
      expect(rim).toBeGreaterThan(bare.height + 0.25 * relief);
      sample(rimX, rimY, probe);
      expect(probe.occlusion).toBeGreaterThan(bare.occlusion);
    }
  });

  it('tire tread steps staggered blocks above grooves and sipes their faces', () => {
    const relief = proceduralMaterialPresets.tiretread.relief;
    const probe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const shifted = { ...probe },
      across = { ...probe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('tiretread', seed);
      for (const [column, row] of [
        [0, 0],
        [2, 3],
        [3, 5],
      ]) {
        const shift = (row % 2) * 0.5;
        const cx = (column + 0.5 + shift) / 4,
          cy = (row + 0.5) / 6;
        let peak = 0,
          low = 1;
        for (let j = 0; j < 14; j++)
          for (let i = 0; i < 14; i++) {
            const u = (column + shift + (i + 0.5) / 14) / 4,
              v = (row + (j + 0.5) / 14) / 6;
            sample(u, v, probe);
            peak = Math.max(peak, probe.height);
            low = Math.min(low, probe.height);
          }
        expect(peak).toBeGreaterThan(low + 0.1 * relief);
        // Blocks stagger half a cell across alternating rows.
        sample(
          (column + 0.5 + ((row + 1) % 2) * 0.5) / 4,
          (row + 1.5) / 6,
          shifted,
        );
        sample((column + 0.5 + shift) / 4, (row + 1.5) / 6, probe);
        expect(shifted.height).toBeGreaterThan(probe.height);
        // Sipes cut shallow ribs across the exposed block face.
        let high = 0,
          siped = 1;
        for (let i = 0; i < 24; i++) {
          sample(cx + (i - 12) / 240, cy, across);
          high = Math.max(high, across.height);
          siped = Math.min(siped, across.height);
        }
        expect(high).toBeGreaterThan(siped + 0.03 * relief);
      }
    }
  });

  it('honeycomb crests wax walls around recessed cell floors', () => {
    const relief = proceduralMaterialPresets.honeycomb.relief;
    const probe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const near = { ...probe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('honeycomb', seed);
      for (const [column, row] of [
        [0, 0],
        [3, 1],
        [4, 3],
      ]) {
        const shift = (row % 2) * 0.5;
        let crest = 0,
          crestX = 0,
          crestY = 0,
          floor = 1;
        for (let j = 0; j < 16; j++)
          for (let i = 0; i < 16; i++) {
            const u = (column + shift + (i + 0.5) / 16) / 5,
              v = (row + (j + 0.5) / 16) / 4;
            sample(u, v, probe);
            if (probe.height > crest) {
              crest = probe.height;
              crestX = u;
              crestY = v;
            }
            floor = Math.min(floor, probe.height);
          }
        expect(crest).toBeGreaterThan(floor + 0.1 * relief);
        // Wall crests fall toward the recessed cell floor around them.
        let nearLow = 1;
        for (let k = 0; k < 8; k++) {
          const angle = (Math.PI / 4) * k;
          sample(
            crestX + 0.09 * Math.cos(angle),
            crestY + 0.09 * Math.sin(angle),
            near,
          );
          nearLow = Math.min(nearLow, near.height);
        }
        expect(crest).toBeGreaterThan(nearLow);
        sample(crestX, crestY, probe);
        expect(probe.occlusion).toBeGreaterThan(0.7);
      }
    }
  });

  it('frost radiates feathery crystal arms around a faded center', () => {
    const relief = proceduralMaterialPresets.frost.relief;
    const probe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const mid = { ...probe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('frost', seed);
      for (const radius of [0.2, 0.32]) {
        // Alternating arms and gaps ring the faded origin.
        let high = 0,
          low = 1;
        for (let i = 0; i < 64; i++) {
          const angle = (Math.PI * 2 * i) / 64;
          sample(
            0.5 + radius * Math.cos(angle),
            0.5 + radius * Math.sin(angle),
            probe,
          );
          high = Math.max(high, probe.height);
          low = Math.min(low, probe.height);
        }
        expect(high).toBeGreaterThan(low + 0.1 * relief);
      }
      sample(0.5, 0.5, mid);
      let rim = 0;
      for (let i = 0; i < 64; i++) {
        const angle = (Math.PI * 2 * i) / 64;
        sample(
          0.5 + 0.32 * Math.cos(angle),
          0.5 + 0.32 * Math.sin(angle),
          probe,
        );
        rim = Math.max(rim, probe.height);
      }
      expect(rim).toBeGreaterThan(mid.height + 0.1 * relief);
    }
  });

  it('stained glass lifts lead came between differently toned panes', () => {
    const relief = proceduralMaterialPresets.stainedglass.relief;
    const probe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const pane = { ...probe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('stainedglass', seed);
      const tones = new Set<number>();
      for (const [column, row] of [
        [0, 0],
        [2, 3],
        [4, 1],
      ]) {
        // A fine scan finds the pane interior and its surrounding came.
        let high = 0,
          highX = 0,
          highY = 0,
          low = 1;
        for (let j = 0; j < 16; j++)
          for (let i = 0; i < 16; i++) {
            const u = (column + (i + 0.5) / 16) / 5,
              v = (row + (j + 0.5) / 16) / 5;
            sample(u, v, probe);
            if (probe.height > high) {
              high = probe.height;
              highX = u;
              highY = v;
            }
            low = Math.min(low, probe.height);
          }
        expect(high).toBeGreaterThan(low + 0.1 * relief);
        sample((column + 0.5) / 5, (row + 0.5) / 5, pane);
        // Came rises over the pane it surrounds and shadows it slightly.
        expect(high).toBeGreaterThan(pane.height);
        sample(highX, highY, probe);
        expect(probe.occlusion).toBeLessThan(pane.occlusion);
        tones.add(pane.color);
      }
      // Adjacent panes carry different pigment tones.
      expect(tones.size).toBeGreaterThan(1);
    }
  });

  it('soapstone sweeps pale veining above its dark talc ground', () => {
    const probe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const along = { ...probe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('soapstone', seed);
      let light = 0,
        lightX = 0,
        lightY = 0,
        dark = 1,
        darkX = 0,
        darkY = 0;
      for (let j = 0; j < 24; j++)
        for (let i = 0; i < 24; i++) {
          const u = (i + 0.5) / 24,
            v = (j + 0.5) / 24;
          sample(u, v, probe);
          if (probe.color > light) {
            light = probe.color;
            lightX = u;
            lightY = v;
          }
          if (probe.color < dark) {
            dark = probe.color;
            darkX = u;
            darkY = v;
          }
        }
      // Veins sit brighter, slightly higher and less occluded than ground.
      expect(light - dark).toBeGreaterThan(0.15);
      sample(lightX, lightY, probe);
      const veinHeight = probe.height,
        veinOcclusion = probe.occlusion;
      sample(darkX, darkY, probe);
      expect(veinHeight).toBeGreaterThan(probe.height);
      expect(veinOcclusion).toBeGreaterThan(probe.occlusion);
      // Talc streaking varies the polish along the surface.
      let low = 1,
        high = 0;
      for (let i = 0; i < 16; i++) {
        sample(i / 16, 0.5, along);
        low = Math.min(low, along.roughness);
        high = Math.max(high, along.roughness);
      }
      expect(high - low).toBeGreaterThan(0.02);
    }
  });

  it('butcher block alternates checker tones above recessed joints', () => {
    const relief = proceduralMaterialPresets.butcherblock.relief;
    const probe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const neighbor = { ...probe },
      joint = { ...probe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('butcherblock', seed);
      for (const [column, row] of [
        [0, 0],
        [2, 1],
        [3, 3],
      ]) {
        sample((column + 0.5) / 4, (row + 0.5) / 4, probe);
        sample((column + 1.5) / 4, (row + 0.5) / 4, neighbor);
        // Adjacent checker blocks alternate light and dark end grain.
        expect(Math.abs(probe.color - neighbor.color)).toBeGreaterThan(0.1);
        sample((column + 1) / 4, (row + 0.5) / 4, joint);
        expect(probe.height).toBeGreaterThan(joint.height + 0.1 * relief);
        expect(probe.occlusion).toBeGreaterThan(joint.occlusion);
      }
    }
  });

  it('wallpaper repeats its damask with exact mirror symmetry', () => {
    const relief = proceduralMaterialPresets.wallpaper.relief;
    const probe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const mirror = { ...probe },
      border = { ...probe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('wallpaper', seed);
      for (const [u, v] of [
        [0.13, 0.27],
        [0.62, 0.41],
        [0.88, 0.73],
      ]) {
        // Folds map each sample onto its motif mirror on both axes.
        const mirrorU = Math.floor(u * 2) + 0.5 - u,
          mirrorV = Math.floor(v * 2) + 0.5 - v;
        sample(u, v, probe);
        sample(mirrorU, v, mirror);
        expect(mirror.height).toBe(probe.height);
        sample(u, mirrorV, mirror);
        expect(mirror.height).toBe(probe.height);
      }
      // The medallion lifts above the faded motif border.
      let high = 0,
        highU = 0,
        highV = 0;
      for (let j = 0; j < 16; j++)
        for (let i = 0; i < 16; i++) {
          const u = (i + 0.5) / 16,
            v = (j + 0.5) / 16;
          sample(u, v, probe);
          if (probe.height > high) {
            high = probe.height;
            highU = u;
            highV = v;
          }
        }
      sample(Math.floor(highU * 2) * 0.5, highV, border);
      expect(high).toBeGreaterThan(border.height + 0.1 * relief);
    }
  });

  it('embroidery lifts aligned satin stitches above the ground', () => {
    const relief = proceduralMaterialPresets.embroidery.relief;
    const probe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const near = { ...probe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('embroidery', seed);
      for (const [column, row] of [
        [0, 1],
        [3, 2],
        [5, 5],
      ]) {
        let peak = 0,
          peakX = 0,
          peakY = 0,
          low = 1;
        for (let j = 0; j < 14; j++)
          for (let i = 0; i < 14; i++) {
            const u = (column + (i + 0.5) / 14) / 6,
              v = (row + (j + 0.5) / 14) / 6;
            sample(u, v, probe);
            if (probe.height > peak) {
              peak = probe.height;
              peakX = u;
              peakY = v;
            }
            low = Math.min(low, probe.height);
          }
        expect(peak).toBeGreaterThan(low + 0.1 * relief);
        // Each satin stitch drops off around its own raised crest.
        let nearLow = 1;
        for (let k = 0; k < 8; k++) {
          const angle = (Math.PI / 4) * k;
          sample(
            peakX + 0.06 * Math.cos(angle),
            peakY + 0.06 * Math.sin(angle),
            near,
          );
          nearLow = Math.min(nearLow, near.height);
        }
        expect(peak).toBeGreaterThan(nearLow);
      }
    }
  });

  it('macrame steps staggered knots above twisted crossing cords', () => {
    const relief = proceduralMaterialPresets.macrame.relief;
    const probe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const shifted = { ...probe },
      cord = { ...probe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('macrame', seed);
      for (const [column, row] of [
        [0, 0],
        [1, 1],
        [3, 3],
      ]) {
        const shift = (row % 2) * 0.5;
        const cx = (column + 0.5 + shift) / 4,
          cy = (row + 0.5) / 4;
        sample(cx, cy, probe);
        sample((column + 1 + shift) / 4, cy, cord);
        expect(probe.height).toBeGreaterThan(cord.height + 0.1 * relief);
        expect(probe.occlusion).toBeGreaterThan(cord.occlusion);
        // Knots stagger half a cell across alternating rows.
        sample(
          (column + 0.5 + ((row + 1) % 2) * 0.5) / 4,
          (row + 1.5) / 4,
          shifted,
        );
        sample((column + 0.5 + shift) / 4, (row + 1.5) / 4, probe);
        expect(shifted.height).toBeGreaterThan(probe.height);
      }
    }
  });

  it('brick paving steps running-bond pavers above sandy joints', () => {
    const relief = proceduralMaterialPresets.brickpaving.relief;
    const probe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const shifted = { ...probe },
      joint = { ...probe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('brickpaving', seed);
      for (const [column, row] of [
        [0, 0],
        [1, 1],
        [2, 3],
      ]) {
        const shift = (row % 2) * 0.5;
        const cx = (column + 0.5 + shift) / 3,
          cy = (row + 0.5) / 4;
        sample(cx, cy, probe);
        sample((column + 1 + shift) / 3, cy, joint);
        expect(probe.height).toBeGreaterThan(joint.height + 0.1 * relief);
        expect(probe.occlusion).toBeGreaterThan(joint.occlusion);
        // The running bond offsets half a paver across alternate rows.
        sample(
          (column + 0.5 + ((row + 1) % 2) * 0.5) / 3,
          (row + 1.5) / 4,
          shifted,
        );
        sample((column + 0.5 + shift) / 3, (row + 1.5) / 4, probe);
        expect(shifted.height).toBeGreaterThan(probe.height);
      }
    }
  });

  it('stepping stones lift rounded pads above the gritty ground', () => {
    const relief = proceduralMaterialPresets.steppingstone.relief;
    const probe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const near = { ...probe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('steppingstone', seed);
      for (const [column, row] of [
        [0, 0],
        [1, 2],
        [2, 1],
      ]) {
        let peak = 0,
          peakX = 0,
          peakY = 0,
          low = 1;
        for (let j = 0; j < 16; j++)
          for (let i = 0; i < 16; i++) {
            const u = (column + (i + 0.5) / 16) / 3,
              v = (row + (j + 0.5) / 16) / 3;
            sample(u, v, probe);
            if (probe.height > peak) {
              peak = probe.height;
              peakX = u;
              peakY = v;
            }
            low = Math.min(low, probe.height);
          }
        expect(peak).toBeGreaterThan(low + 0.1 * relief);
        // Each pad drops toward the ground around its own crown.
        let nearLow = 1;
        for (let k = 0; k < 8; k++) {
          const angle = (Math.PI / 4) * k;
          sample(
            peakX + 0.11 * Math.cos(angle),
            peakY + 0.11 * Math.sin(angle),
            near,
          );
          nearLow = Math.min(nearLow, near.height);
        }
        expect(peak).toBeGreaterThan(nearLow);
      }
    }
  });

  it('wooden deck sinks screw slots below domed heads on raised boards', () => {
    const relief = proceduralMaterialPresets.woodendeck.relief;
    const probe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const gap = { ...probe },
      head = { ...probe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('woodendeck', seed);
      for (const row of [0, 2, 4]) {
        sample(0.5, (row + 0.5) / 5, probe);
        sample(0.5, row / 5, gap);
        expect(probe.height).toBeGreaterThan(gap.height + 0.1 * relief);
        expect(probe.occlusion).toBeGreaterThan(gap.occlusion);
        // Screw heads dome over a recessed cross slot at fixed stations.
        let high = 0,
          highX = 0,
          highY = 0,
          low = 1,
          lowX = 0,
          lowY = 0;
        for (let j = 0; j < 12; j++)
          for (let i = 0; i < 12; i++) {
            const u = 0.5 + (i - 6) / 36,
              v = (row + 0.5 + (j - 6) / 36) / 5;
            sample(u, v, probe);
            if (probe.height > high) {
              high = probe.height;
              highX = u;
              highY = v;
            }
            if (probe.height < low) {
              low = probe.height;
              lowX = u;
              lowY = v;
            }
          }
        expect(high).toBeGreaterThan(low + 0.05 * relief);
        sample(highX, highY, head);
        sample(lowX, lowY, probe);
        expect(head.occlusion).toBeGreaterThan(probe.occlusion);
      }
    }
  });

  it('cheese sinks smooth rounded eyes of varied sizes below its paste', () => {
    const relief = proceduralMaterialPresets.cheese.relief;
    const probe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const wall = { ...probe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('cheese', seed);
      for (const [column, row] of [
        [0, 1],
        [3, 2],
        [5, 5],
      ]) {
        let high = 0,
          low = 1,
          lowX = 0,
          lowY = 0;
        for (let j = 0; j < 14; j++)
          for (let i = 0; i < 14; i++) {
            const u = (column + (i + 0.5) / 14) / 6,
              v = (row + (j + 0.5) / 14) / 6;
            sample(u, v, probe);
            high = Math.max(high, probe.height);
            if (probe.height < low) {
              low = probe.height;
              lowX = u;
              lowY = v;
            }
          }
        expect(high).toBeGreaterThan(low + 0.1 * relief);
        // Eye walls rise smoothly away from the bowl floor.
        let wallLow = 1;
        for (let k = 0; k < 8; k++) {
          const angle = (Math.PI / 4) * k;
          sample(
            lowX + 0.07 * Math.cos(angle),
            lowY + 0.07 * Math.sin(angle),
            wall,
          );
          wallLow = Math.min(wallLow, wall.height);
        }
        expect(wallLow).toBeGreaterThan(low);
        sample(lowX, lowY, probe);
        expect(probe.occlusion).toBeLessThan(0.6);
      }
    }
  });

  it('sugar frosting swells piped peaks over smooth icing', () => {
    const relief = proceduralMaterialPresets.sugarfrosting.relief;
    const probe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const near = { ...probe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('sugarfrosting', seed);
      for (const [column, row] of [
        [0, 0],
        [2, 3],
        [4, 1],
      ]) {
        let peak = 0,
          peakX = 0,
          peakY = 0,
          low = 1;
        for (let j = 0; j < 14; j++)
          for (let i = 0; i < 14; i++) {
            const u = (column + (i + 0.5) / 14) / 5,
              v = (row + (j + 0.5) / 14) / 5;
            sample(u, v, probe);
            if (probe.height > peak) {
              peak = probe.height;
              peakX = u;
              peakY = v;
            }
            low = Math.min(low, probe.height);
          }
        expect(peak).toBeGreaterThan(low + 0.1 * relief);
        // Each rosette falls toward the icing around its own crest.
        let nearLow = 1;
        for (let k = 0; k < 8; k++) {
          const angle = (Math.PI / 4) * k;
          sample(
            peakX + 0.08 * Math.cos(angle),
            peakY + 0.08 * Math.sin(angle),
            near,
          );
          nearLow = Math.min(nearLow, near.height);
        }
        expect(peak).toBeGreaterThan(nearLow);
      }
    }
  });

  it('candle wax bulges drip noses above their runs and the base', () => {
    const relief = proceduralMaterialPresets.candleswax.relief;
    const probe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const upper = { ...probe },
      base = { ...probe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('candleswax', seed);
      for (const [column, row] of [
        [0, 0],
        [3, 1],
        [5, 0],
      ]) {
        // A scan finds each run's swollen nose wherever the drip jitters.
        let peak = 0,
          peakX = 0,
          peakY = 0,
          low = 1,
          lowX = 0,
          lowY = 0;
        for (let j = 0; j < 16; j++)
          for (let i = 0; i < 16; i++) {
            const u = (column + (i + 0.5) / 16) / 6,
              v = (row + (j + 0.5) / 16) / 2;
            sample(u, v, probe);
            if (probe.height > peak) {
              peak = probe.height;
              peakX = u;
              peakY = v;
            }
            if (probe.height < low) {
              low = probe.height;
              lowX = u;
              lowY = v;
            }
          }
        expect(peak).toBeGreaterThan(low + 0.1 * relief);
        // The nose swells above the same run higher up and over the base.
        sample(peakX, peakY - 0.16, upper);
        sample(lowX, lowY, base);
        expect(peak).toBeGreaterThan(upper.height + 0.03 * relief);
        expect(peak).toBeGreaterThan(base.height + 0.1 * relief);
        sample(peakX, peakY, probe);
        expect(probe.occlusion).toBeGreaterThan(base.occlusion);
      }
    }
  });

  it('vinyl record ripples grooves around its smooth label disc', () => {
    const relief = proceduralMaterialPresets.vinylrecord.relief;
    const probe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const label = { ...probe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('vinylrecord', seed);
      for (const angle of [0, 1, 2]) {
        const cos = Math.cos(angle),
          sin = Math.sin(angle);
        let high = 0,
          low = 1,
          previous = 0,
          lastSign = 0,
          flips = 0;
        for (let i = 12; i <= 40; i++) {
          const t = i / 90;
          sample(0.5 + t * cos, 0.5 + t * sin, probe);
          high = Math.max(high, probe.height);
          low = Math.min(low, probe.height);
          const delta = probe.height - previous;
          if (previous && delta * (lastSign ?? 0) < 0) flips++;
          if (delta) lastSign = delta;
          previous = probe.height;
        }
        expect(high - low).toBeGreaterThan(0.1 * relief);
        expect(flips).toBeGreaterThanOrEqual(3);
      }
      // The label stays smooth where the grooves have faded out.
      let labelHigh = 0,
        labelLow = 1;
      for (let i = 0; i < 16; i++) {
        const angle = (Math.PI * 2 * i) / 16;
        sample(
          0.5 + 0.08 * Math.cos(angle),
          0.5 + 0.08 * Math.sin(angle),
          label,
        );
        labelHigh = Math.max(labelHigh, label.height);
        labelLow = Math.min(labelLow, label.height);
      }
      expect(labelHigh - labelLow).toBeLessThan(0.03 * relief);
    }
  });

  it('graph paper sinks major rules deeper than minor rules', () => {
    const relief = proceduralMaterialPresets.graphpaper.relief;
    const probe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const minor = { ...probe },
      paper = { ...probe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('graphpaper', seed);
      for (const u of [0, 1 / 3, 2 / 3]) {
        sample(u, 0.5, probe);
        sample(u + 1 / 12, 0.5 + 1 / 24, minor);
        sample(u + 1 / 24, 0.5 + 1 / 24, paper);
        // The major rule at u runs deeper than the minor rule beside it.
        expect(probe.height).toBeLessThan(minor.height - 0.05 * relief);
        expect(minor.height).toBeLessThan(paper.height - 0.03 * relief);
        expect(probe.occlusion).toBeLessThan(paper.occlusion);
      }
    }
  });

  it('notebook paper sinks rules, margin and punch holes into the page', () => {
    const relief = proceduralMaterialPresets.notebookpaper.relief;
    const probe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const rule = { ...probe },
      margin = { ...probe },
      paper = { ...probe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('notebookpaper', seed);
      // Punch holes bottom out below the ruled margin line and the sheet.
      let hole = 1,
        holeX = 0,
        holeY = 0;
      for (let j = 0; j < 16; j++)
        for (let i = 0; i < 16; i++) {
          const u = 0.12 + (i - 8) / 80,
            v = 0.25 + (j - 8) / 80;
          sample(u, v, probe);
          if (probe.height < hole) {
            hole = probe.height;
            holeX = u;
            holeY = v;
          }
        }
      sample(0.25, holeY, margin);
      sample(holeX, 0.375, rule);
      sample(holeX + 0.03, holeY + 0.03, paper);
      expect(hole).toBeLessThan(margin.height);
      expect(margin.height).toBeLessThan(paper.height);
      expect(rule.height).toBeLessThan(paper.height);
      expect(paper.height).toBeGreaterThan(hole + 0.2 * relief);
    }
  });

  it('lace crosses diagonal threads above its diamond voids', () => {
    const relief = proceduralMaterialPresets.lace.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const thread = { ...surface },
      void_ = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('lace', seed);
      // (0.5, 0.5) crosses both thread families; the offset point sits
      // on one diagonal only; the shallow pocket is the diamond void.
      sample(0.5, 0.5, surface);
      sample(0.5 + 1 / 24, 0.5 - 1 / 24, thread);
      sample(1 / 6, 1 / 12, void_);
      expect(surface.height).toBeGreaterThan(thread.height + 0.05 * relief);
      expect(thread.height).toBeGreaterThan(void_.height + 0.05 * relief);
      expect(surface.occlusion).toBeGreaterThan(thread.occlusion);
      expect(thread.occlusion).toBeGreaterThan(void_.occlusion);
    }
  });

  it('crochet raises offset loop rows above the recessed gaps', () => {
    const relief = proceduralMaterialPresets.crochet.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const rowOne = { ...surface },
      off = { ...surface },
      gap = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('crochet', seed);
      sample(1 / 16, 1 / 12, surface);
      sample(0.25, 0.25, rowOne);
      sample(1 / 16, 0.25, off);
      sample(1 / 8, 1 / 6, gap);
      // Both rows top out equally, but the upper row shifts half a cell.
      expect(surface.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(rowOne.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(rowOne.height).toBeGreaterThan(off.height + 0.1 * relief);
      expect(Math.abs(surface.height - rowOne.height)).toBeLessThan(
        0.05 * relief,
      );
      expect(surface.occlusion).toBeGreaterThan(gap.occlusion);
      expect(rowOne.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('basketweave alternates strip directions and crests ridges', () => {
    const relief = proceduralMaterialPresets.basketweave.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const shoulder = { ...surface },
      gap = { ...surface },
      along = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('basketweave', seed);
      // Block parity 0 lays strips along u; parity 1 turns them along v.
      sample(1 / 8, 1 / 16, surface);
      sample(1 / 8, 1 / 16 + 1 / 32, shoulder);
      sample(1 / 8, 0, gap);
      sample(1 / 8 + 1 / 32, 1 / 16, along);
      expect(surface.height).toBeGreaterThan(shoulder.height + 0.06 * relief);
      expect(shoulder.height).toBeGreaterThan(gap.height + 0.1 * relief);
      // The crest stays level along its strip but drops across it.
      expect(Math.abs(surface.height - along.height)).toBeLessThan(
        0.05 * relief,
      );
      sample(5 / 16, 1 / 8, surface);
      sample(5 / 16, 1 / 8 + 1 / 32, along);
      sample(5 / 16 + 1 / 32, 1 / 8, shoulder);
      expect(Math.abs(surface.height - along.height)).toBeLessThan(
        0.05 * relief,
      );
      expect(surface.height).toBeGreaterThan(shoulder.height + 0.06 * relief);
      expect(surface.occlusion).toBeGreaterThan(shoulder.occlusion);
      expect(shoulder.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('zipper raises offset tooth rows over tape and seam', () => {
    const relief = proceduralMaterialPresets.zipper.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const tape = { ...surface },
      backing = { ...surface },
      rowGap = { ...surface },
      rightCrest = { ...surface },
      rightGap = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('zipper', seed);
      // Left teeth crest mid-cell in v; right teeth crest half a period
      // later, so the two rows interlock over the recessed seam.
      sample(0.42, 1 / 24, surface);
      sample(0.25, 1 / 24, tape);
      sample(0.05, 0.05, backing);
      sample(0.42, 0, rowGap);
      sample(0.58, 1 / 12, rightCrest);
      sample(0.58, 1 / 24, rightGap);
      expect(surface.height).toBeGreaterThan(tape.height + 0.05 * relief);
      expect(tape.height).toBeGreaterThan(backing.height + 0.05 * relief);
      expect(surface.height).toBeGreaterThan(rowGap.height + 0.1 * relief);
      expect(rightCrest.height).toBeGreaterThan(rightGap.height + 0.1 * relief);
      expect(surface.occlusion).toBeGreaterThan(tape.occlusion);
      expect(tape.occlusion).toBeGreaterThan(backing.occlusion);
    }
  });

  it('velcro rings hook pins above their cores and backing', () => {
    const relief = proceduralMaterialPresets.velcro.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const core = { ...surface },
      backing = { ...surface },
      offsetCore = { ...surface },
      offsetGap = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('velcro', seed);
      sample(1 / 24 + 0.02, 1 / 24, surface);
      sample(1 / 24, 1 / 24, core);
      sample(1 / 12, 1 / 24, backing);
      sample(0, 1 / 8, offsetCore);
      sample(1 / 24, 1 / 8, offsetGap);
      expect(surface.height).toBeGreaterThan(core.height + 0.05 * relief);
      expect(core.height).toBeGreaterThan(backing.height + 0.05 * relief);
      // The next row shifts half a cell, cresting where row zero is bare.
      expect(Math.abs(core.height - offsetCore.height)).toBeLessThan(
        0.05 * relief,
      );
      expect(offsetCore.height).toBeGreaterThan(
        offsetGap.height + 0.1 * relief,
      );
      expect(core.occlusion).toBeGreaterThan(backing.occlusion);
    }
  });

  it('button rings rims above stitched faces and hole pits', () => {
    const relief = proceduralMaterialPresets.button.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const face = { ...surface },
      gap = { ...surface },
      hole = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('button', seed);
      sample(0.1925, 0.125, surface);
      sample(0.125, 0.125, face);
      sample(0.25, 0.125, gap);
      sample(0.1425, 0.1425, hole);
      expect(surface.height).toBeGreaterThan(face.height + 0.1 * relief);
      expect(face.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(hole.height).toBeLessThan(gap.height - 0.02 * relief);
      expect(face.occlusion).toBeGreaterThan(gap.occlusion);
      expect(hole.occlusion).toBeLessThan(gap.occlusion);
    }
  });

  it('train tracks crown rails above sleepers and ballast', () => {
    const relief = proceduralMaterialPresets.traintracks.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const sleeper = { ...surface },
      ballast = { ...surface },
      railFar = { ...surface },
      railGap = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('traintracks', seed);
      sample(0.35, 0, surface);
      sample(0.15, 0, sleeper);
      sample(0.15, 1 / 12, ballast);
      sample(0.65, 0, railFar);
      sample(0.35, 1 / 12, railGap);
      expect(surface.height).toBeGreaterThan(sleeper.height + 0.05 * relief);
      expect(sleeper.height).toBeGreaterThan(ballast.height + 0.05 * relief);
      // The paired rails match, and sleepers pass under both of them.
      expect(Math.abs(surface.height - railFar.height)).toBeLessThan(
        0.05 * relief,
      );
      expect(surface.height).toBeGreaterThan(railGap.height + 0.05 * relief);
      expect(surface.occlusion).toBeGreaterThan(ballast.occlusion);
    }
  });

  it('manhole cover crowns its frame over the ribbed panel', () => {
    const relief = proceduralMaterialPresets.manholecover.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const crest = { ...surface },
      valley = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('manholecover', seed);
      sample(0.92, 0.5, surface);
      sample(0.7, 0.5, crest);
      sample(
        0.5 + 0.2 * Math.cos(Math.PI / 16),
        0.5 + 0.2 * Math.sin(Math.PI / 16),
        valley,
      );
      expect(surface.height).toBeGreaterThan(crest.height + 0.05 * relief);
      expect(crest.height).toBeGreaterThan(valley.height + 0.06 * relief);
      expect(crest.occlusion).toBeGreaterThan(valley.occlusion);
    }
  });

  it('speed bumps crest above their feet and the recessed seams', () => {
    const relief = proceduralMaterialPresets.speedbump.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const foot = { ...surface },
      seam = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('speedbump', seed);
      sample(0.5, 0.25, surface);
      sample(0.5, 0.125, foot);
      sample(0.5, 0, seam);
      expect(surface.height).toBeGreaterThan(foot.height + 0.05 * relief);
      expect(foot.height).toBeGreaterThan(seam.height + 0.1 * relief);
      expect(surface.occlusion).toBeGreaterThan(seam.occlusion);
    }
  });

  it('circuit board crests pads over traces and sinks via pits', () => {
    const relief = proceduralMaterialPresets.circuitboard.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const trace = { ...surface },
      substrate = { ...surface },
      via = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('circuitboard', seed);
      sample(3 / 16, 1 / 16, surface);
      sample(1 / 16, 1 / 16, trace);
      sample(11 / 32, 3 / 16, substrate);
      sample(1 / 16, 3 / 16, via);
      expect(surface.height).toBeGreaterThan(trace.height + 0.05 * relief);
      expect(trace.height).toBeGreaterThan(substrate.height + 0.03 * relief);
      expect(via.height).toBeLessThan(substrate.height - 0.1 * relief);
      expect(surface.occlusion).toBeGreaterThan(substrate.occlusion);
      expect(via.occlusion).toBeLessThan(substrate.occlusion);
    }
  });

  it('solar panel stacks busbars over fingers on raised cells', () => {
    const relief = proceduralMaterialPresets.solarpanel.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const finger = { ...surface },
      face = { ...surface },
      gap = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('solarpanel', seed);
      sample(0.15, 0.25, surface);
      sample(0.25, 0.25, finger);
      sample(0.25, 1 / 16, face);
      sample(0.02, 0.25, gap);
      expect(surface.height).toBeGreaterThan(finger.height + 0.05 * relief);
      expect(finger.height).toBeGreaterThan(face.height + 0.02 * relief);
      expect(face.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(face.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('heat tile raises rounded faces above recessed seams', () => {
    const relief = proceduralMaterialPresets.heattile.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const seam = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('heattile', seed);
      sample(1 / 6, 1 / 6, surface);
      sample(0.02, 0.5, seam);
      expect(surface.height).toBeGreaterThan(seam.height + 0.1 * relief);
      expect(surface.occlusion).toBeGreaterThan(seam.occlusion);
    }
  });

  it('piano keys raise black keys over white faces and seams', () => {
    const relief = proceduralMaterialPresets.pianokeys.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const white = { ...surface },
      seam = { ...surface },
      noBlack = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('pianokeys', seed);
      // Black keys sit on five of the seven key boundaries per octave.
      sample(1 / 7, 0.275, surface);
      sample(1 / 14, 0.275, white);
      sample(0, 0.275, seam);
      sample(3 / 7, 0.275, noBlack);
      expect(surface.height).toBeGreaterThan(white.height + 0.05 * relief);
      expect(white.height).toBeGreaterThan(seam.height + 0.05 * relief);
      expect(surface.height).toBeGreaterThan(noBlack.height + 0.1 * relief);
      expect(white.occlusion).toBeGreaterThan(seam.occlusion);
    }
  });

  it('drum skin crowns lugs over the rim and creased membrane', () => {
    const relief = proceduralMaterialPresets.drumskin.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const rim = { ...surface },
      center = { ...surface },
      crest = { ...surface },
      valley = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('drumskin', seed);
      sample(0.92, 0.5, surface);
      sample(
        0.5 + 0.42 * Math.cos(Math.PI / 8),
        0.5 + 0.42 * Math.sin(Math.PI / 8),
        rim,
      );
      sample(0.5, 0.5, center);
      sample(0.7, 0.5, crest);
      sample(
        0.5 + 0.2 * Math.cos(Math.PI / 16),
        0.5 + 0.2 * Math.sin(Math.PI / 16),
        valley,
      );
      expect(surface.height).toBeGreaterThan(rim.height + 0.05 * relief);
      expect(rim.height).toBeGreaterThan(center.height + 0.05 * relief);
      expect(crest.height).toBeGreaterThan(valley.height + 0.02 * relief);
      expect(crest.occlusion).toBeGreaterThan(valley.occlusion);
    }
  });

  it('gong surface ripples rings around its raised center boss', () => {
    const relief = proceduralMaterialPresets.gongsurface.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const crest = { ...surface },
      trough = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('gongsurface', seed);
      sample(0.5, 0.5, surface);
      sample(0.7, 0.5, crest);
      sample(0.75, 0.5, trough);
      expect(surface.height).toBeGreaterThan(crest.height + 0.1 * relief);
      expect(crest.height).toBeGreaterThan(trough.height + 0.08 * relief);
      expect(crest.occlusion).toBeGreaterThan(trough.occlusion);
    }
  });

  it('lens array lifts microlens domes out of the supporting web', () => {
    const relief = proceduralMaterialPresets.lensarray.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const web = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('lensarray', seed);
      sample(1 / 32, 1 / 32, surface);
      sample(0, 0, web);
      expect(surface.height).toBeGreaterThan(web.height + 0.1 * relief);
      expect(surface.occlusion).toBeGreaterThan(web.occlusion);
    }
  });

  it('prism tape crests diagonal ridges over their feet and base', () => {
    const relief = proceduralMaterialPresets.prismtape.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const foot = { ...surface },
      valley = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('prismtape', seed);
      sample(1 / 16, 0, surface);
      sample(1 / 32, 0, foot);
      sample(0, 0, valley);
      expect(surface.height).toBeGreaterThan(foot.height + 0.05 * relief);
      expect(foot.height).toBeGreaterThan(valley.height + 0.05 * relief);
      expect(surface.occlusion).toBeGreaterThan(valley.occlusion);
    }
  });

  it('fresnel descends saw rings outward from its center boss', () => {
    const relief = proceduralMaterialPresets.fresnel.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const crest = { ...surface },
      foot = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('fresnel', seed);
      sample(0.5, 0.5, surface);
      sample(0.71, 0.5, crest);
      sample(0.78, 0.5, foot);
      expect(surface.height).toBeGreaterThan(crest.height + 0.1 * relief);
      expect(crest.height).toBeGreaterThan(foot.height + 0.08 * relief);
      expect(crest.occlusion).toBeGreaterThan(foot.occlusion);
    }
  });

  it('bandage cushions its pad over the woven gauze backing', () => {
    const relief = proceduralMaterialPresets.bandage.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const weave = { ...surface },
      backing = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('bandage', seed);
      sample(0.5, 0.5, surface);
      sample(1 / 48, 1 / 48, weave);
      sample(0, 0, backing);
      expect(surface.height).toBeGreaterThan(weave.height + 0.1 * relief);
      expect(weave.height).toBeGreaterThan(backing.height + 0.03 * relief);
      expect(weave.occlusion).toBeGreaterThan(backing.occlusion);
    }
  });

  it('pill blister swells domes over scored foil', () => {
    const relief = proceduralMaterialPresets.pillblister.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const foil = { ...surface },
      score = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('pillblister', seed);
      sample(1 / 6, 1 / 6, surface);
      sample(0.05, 0.5, foil);
      sample(1 / 3, 0.5, score);
      expect(surface.height).toBeGreaterThan(foil.height + 0.1 * relief);
      expect(foil.height).toBeGreaterThan(score.height + 0.05 * relief);
      expect(surface.occlusion).toBeGreaterThan(score.occlusion);
    }
  });

  it('sutures bridge cords over the incision and needle pits', () => {
    const relief = proceduralMaterialPresets.sutures.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const skin = { ...surface },
      pit = { ...surface },
      incision = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('sutures', seed);
      sample(0.5, 1 / 20, surface);
      sample(0.35, 0.33, skin);
      sample(0.16, 1 / 20, pit);
      sample(0.5, 0.33, incision);
      expect(surface.height).toBeGreaterThan(skin.height + 0.1 * relief);
      expect(skin.height).toBeGreaterThan(pit.height + 0.1 * relief);
      expect(pit.height).toBeGreaterThan(incision.height + 0.05 * relief);
      expect(surface.occlusion).toBeGreaterThan(incision.occlusion);
    }
  });

  it('trellis knots its crossed slats above the open grid', () => {
    const relief = proceduralMaterialPresets.trellis.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const slat = { ...surface },
      gap = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('trellis', seed);
      sample(0.25, 0.25, surface);
      sample(0.25, 0.5, slat);
      sample(0.5, 0.5, gap);
      expect(surface.height).toBeGreaterThan(slat.height + 0.05 * relief);
      expect(slat.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(surface.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('terracotta pot raises its rim over the thrown wall ribs', () => {
    const relief = proceduralMaterialPresets.terracottapot.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const rib = { ...surface },
      valley = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('terracottapot', seed);
      sample(0.5, 0.1, surface);
      sample(0.5, 0.5625, rib);
      sample(0.5, 0.5, valley);
      expect(surface.height).toBeGreaterThan(rib.height + 0.05 * relief);
      expect(rib.height).toBeGreaterThan(valley.height + 0.05 * relief);
      expect(rib.occlusion).toBeGreaterThan(valley.occlusion);
    }
  });

  it('hedgerow swells leafy clumps over the branch gaps', () => {
    const relief = proceduralMaterialPresets.hedgerow.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const gap = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('hedgerow', seed);
      sample(1 / 8, 1 / 8, surface);
      sample(0.25, 0.25, gap);
      expect(surface.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(surface.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('collar raises its buckle over stitched webbing and backing', () => {
    const relief = proceduralMaterialPresets.collar.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const band = { ...surface },
      stitch = { ...surface },
      backing = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('collar', seed);
      sample(0.3, 0.5, surface);
      sample(0.8, 0.5, band);
      sample(0.8, 0.67, stitch);
      sample(0.8, 0.95, backing);
      expect(surface.height).toBeGreaterThan(band.height + 0.1 * relief);
      expect(band.height).toBeGreaterThan(stitch.height + 0.05 * relief);
      expect(stitch.height).toBeGreaterThan(backing.height + 0.05 * relief);
      expect(surface.occlusion).toBeGreaterThan(backing.occlusion);
    }
  });

  it('pet bed raises its bolster around the dished cushion', () => {
    const relief = proceduralMaterialPresets.petbed.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const cushion = { ...surface },
      base = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('petbed', seed);
      sample(0.88, 0.5, surface);
      sample(0.5, 0.5, cushion);
      sample(0.95, 0.5, base);
      expect(surface.height).toBeGreaterThan(cushion.height + 0.1 * relief);
      expect(cushion.height).toBeGreaterThan(base.height + 0.05 * relief);
      expect(surface.occlusion).toBeGreaterThan(base.occlusion);
    }
  });

  it('scratch post crests rope ridges above the tight grooves', () => {
    const relief = proceduralMaterialPresets.scratchpost.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const groove = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('scratchpost', seed);
      sample(0.5, 0.5625, surface);
      sample(0.5, 0.5, groove);
      expect(surface.height).toBeGreaterThan(groove.height + 0.1 * relief);
      expect(surface.occlusion).toBeGreaterThan(groove.occlusion);
    }
  });

  it('running track lifts lane lines over granular rubber and seams', () => {
    const relief = proceduralMaterialPresets.runningtrack.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const rubber = { ...surface },
      seam = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('runningtrack', seed);
      sample(0.5, 0.25, surface);
      sample(0.5, 0.45, rubber);
      sample(0.5, 0, seam);
      expect(surface.height).toBeGreaterThan(rubber.height + 0.05 * relief);
      expect(rubber.height).toBeGreaterThan(seam.height + 0.1 * relief);
      expect(surface.occlusion).toBeGreaterThan(seam.occlusion);
    }
  });

  it('boulder mat puffs quilted diamonds inside the border band', () => {
    const relief = proceduralMaterialPresets.bouldermat.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const border = { ...surface },
      valley = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('bouldermat', seed);
      sample(0.125, 0.5, surface);
      sample(0.03, 0.5, border);
      sample(0.25, 0.5, valley);
      expect(surface.height).toBeGreaterThan(border.height + 0.05 * relief);
      expect(border.height).toBeGreaterThan(valley.height + 0.05 * relief);
      expect(surface.occlusion).toBeGreaterThan(valley.occlusion);
    }
  });

  it('pool tile raises faces over grout under caustic light bands', () => {
    const relief = proceduralMaterialPresets.pooltile.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const grout = { ...surface },
      crest = { ...surface },
      trough = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('pooltile', seed);
      sample(1 / 16, 1 / 16, surface);
      sample(0, 1 / 16, grout);
      sample(1 / 16, 7 / 16, crest);
      sample(1 / 16, 3 / 16, trough);
      expect(surface.height).toBeGreaterThan(grout.height + 0.08 * relief);
      expect(crest.height).toBeGreaterThan(trough.height + 0.03 * relief);
      expect(surface.occlusion).toBeGreaterThan(grout.occlusion);
    }
  });

  it('envelope crests crosshatch ridges over the recessed flap seam', () => {
    const relief = proceduralMaterialPresets.envelope.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const paper = { ...surface },
      seam = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('envelope', seed);
      sample(0.05, 0, surface);
      sample(0.1, 0.1, paper);
      sample(0.5, 0.3, seam);
      expect(surface.height).toBeGreaterThan(paper.height + 0.04 * relief);
      expect(paper.height).toBeGreaterThan(seam.height + 0.05 * relief);
      expect(paper.occlusion).toBeGreaterThan(seam.occlusion);
    }
  });

  it('chalkboard frames streaked slate above clean passes', () => {
    const relief = proceduralMaterialPresets.chalkboard.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const streak = { ...surface },
      clean = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('chalkboard', seed);
      sample(0.02, 0.5, surface);
      sample(0.5, 1 / 3, streak);
      sample(0.5, 1 / 6, clean);
      expect(surface.height).toBeGreaterThan(streak.height + 0.08 * relief);
      expect(streak.height).toBeGreaterThan(clean.height + 0.01 * relief);
      expect(surface.occlusion).toBeGreaterThan(clean.occlusion);
    }
  });

  it('cork board lifts granules over the board with deep pin holes', () => {
    const relief = proceduralMaterialPresets.corkboard.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const base = { ...surface },
      pit = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('corkboard', seed);
      sample(1 / 16, 1 / 16, surface);
      sample(0, 0, base);
      sample(1 / 8, 1 / 8, pit);
      expect(surface.height).toBeGreaterThan(base.height + 0.08 * relief);
      expect(base.height).toBeGreaterThan(pit.height + 0.1 * relief);
      expect(pit.occlusion).toBeLessThan(base.occlusion);
    }
  });

  it('snow drift rides wind ripples over fine grain', () => {
    const relief = proceduralMaterialPresets.snowdrift.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('snowdrift', seed);
      let high = 0,
        low = 1;
      for (let i = 0; i < 24; i++) {
        sample(i / 24, 0.37, surface);
        high = Math.max(high, surface.height);
        low = Math.min(low, surface.height);
      }
      expect(high - low).toBeGreaterThan(0.15 * relief);
    }
  });

  it('icicle hangs rounded columns over the shadowed gaps', () => {
    const relief = proceduralMaterialPresets.icicle.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const gap = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('icicle', seed);
      sample(1 / 12, 0.5, surface);
      sample(0, 0.5, gap);
      expect(surface.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(surface.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('dew drops bead two sizes over the faint leaf veins', () => {
    const relief = proceduralMaterialPresets.dewdrops.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const small = { ...surface },
      leaf = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('dewdrops', seed);
      sample(1 / 24, 1 / 24, surface);
      sample(1 / 48, 1 / 48, small);
      sample(1 / 16, 0, leaf);
      expect(surface.height).toBeGreaterThan(small.height + 0.05 * relief);
      expect(small.height).toBeGreaterThan(leaf.height + 0.05 * relief);
      expect(surface.occlusion).toBeGreaterThan(leaf.occlusion);
    }
  });

  it('moon crater rims rise over the surface around sunken bowls', () => {
    const relief = proceduralMaterialPresets.mooncrater.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const ground = { ...surface },
      bowl = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('mooncrater', seed);
      sample(0.25, 1 / 6, surface);
      sample(0, 0, ground);
      sample(1 / 6, 1 / 6, bowl);
      expect(surface.height).toBeGreaterThan(ground.height + 0.1 * relief);
      expect(ground.height).toBeGreaterThan(bowl.height + 0.1 * relief);
      expect(surface.occlusion).toBeGreaterThan(bowl.occlusion);
    }
  });

  it('star field twinkles stars and dust over the nebula base', () => {
    const relief = proceduralMaterialPresets.starfield.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const dust = { ...surface },
      base = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('starfield', seed);
      sample(1 / 24, 1 / 24, surface);
      sample(1 / 48, 1 / 48, dust);
      sample(0.031, 0.37, base);
      expect(surface.height).toBeGreaterThan(dust.height + 0.05 * relief);
      expect(dust.height).toBeGreaterThan(base.height + 0.05 * relief);
      expect(surface.occlusion).toBeGreaterThan(base.occlusion);
    }
  });

  it('nebula flows bright swirl bands around dark dust lanes', () => {
    const relief = proceduralMaterialPresets.nebula.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('nebula', seed);
      let high = 0,
        low = 1;
      for (let i = 0; i < 24; i++) {
        sample(i / 24, 0.37, surface);
        high = Math.max(high, surface.height);
        low = Math.min(low, surface.height);
      }
      expect(high - low).toBeGreaterThan(0.12 * relief);
    }
  });

  it('pleats crest accordion folds over the fabric valleys', () => {
    const relief = proceduralMaterialPresets.pleats.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const valley = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('pleats', seed);
      sample(1 / 8, 0.5, surface);
      sample(0, 0.5, valley);
      expect(surface.height).toBeGreaterThan(valley.height + 0.1 * relief);
      expect(surface.occlusion).toBeGreaterThan(valley.occlusion);
    }
  });

  it('shoelace crosses woven cords over base and eyelet pits', () => {
    const relief = proceduralMaterialPresets.shoelace.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const base = { ...surface },
      eyelet = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('shoelace', seed);
      sample(1 / 32, 1 / 32, surface);
      sample(0.25, 0, base);
      sample(0.125, 0.125, eyelet);
      expect(surface.height).toBeGreaterThan(base.height + 0.05 * relief);
      expect(base.height).toBeGreaterThan(eyelet.height + 0.1 * relief);
      expect(eyelet.occlusion).toBeLessThan(base.occlusion);
    }
  });

  it('tassel hangs strands below the raised binding ring', () => {
    const relief = proceduralMaterialPresets.tassel.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const strand = { ...surface },
      gap = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('tassel', seed);
      sample(0.5, 0.1, surface);
      sample(1 / 20, 0.5, strand);
      sample(0, 0.5, gap);
      expect(surface.height).toBeGreaterThan(strand.height + 0.05 * relief);
      expect(strand.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(strand.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('wok surface dims hammered bumps over scratched steel', () => {
    const relief = proceduralMaterialPresets.woksurface.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const base = { ...surface },
      scratch = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('woksurface', seed);
      sample(0.05, 0.05, surface);
      sample(0.1, 0.45, base);
      sample(0.16, 0.0275, scratch);
      expect(surface.height).toBeGreaterThan(base.height + 0.1 * relief);
      expect(base.height).toBeGreaterThan(scratch.height + 0.03 * relief);
      expect(surface.occlusion).toBeGreaterThan(scratch.occlusion);
    }
  });

  it('cutlery beads its border over the brushed handle face', () => {
    const relief = proceduralMaterialPresets.cutlery.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const border = { ...surface },
      face = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('cutlery', seed);
      sample(1 / 16, 0.02, surface);
      sample(1 / 32, 0.02, border);
      sample(0.5, 0.5, face);
      expect(surface.height).toBeGreaterThan(border.height + 0.05 * relief);
      expect(border.height).toBeGreaterThan(face.height + 0.05 * relief);
      expect(surface.occlusion).toBeGreaterThan(face.occlusion);
    }
  });

  it('chopping board scars its blocks above the recessed border', () => {
    const relief = proceduralMaterialPresets.choppingboard.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const scar = { ...surface },
      border = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('choppingboard', seed);
      sample(1 / 8, 1 / 8, surface);
      sample(0.2, 0.1, scar);
      sample(0.01, 0.5, border);
      expect(surface.height).toBeGreaterThan(scar.height + 0.05 * relief);
      expect(scar.height).toBeGreaterThan(border.height + 0.05 * relief);
      expect(surface.occlusion).toBeGreaterThan(scar.occlusion);
    }
  });

  it('faucet domes over its base plate and scale spots', () => {
    const relief = proceduralMaterialPresets.faucet.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const plate = { ...surface },
      base = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('faucet', seed);
      sample(0.5, 0.5, surface);
      sample(0.94, 0.5, plate);
      sample(0.98, 0.98, base);
      expect(surface.height).toBeGreaterThan(plate.height + 0.05 * relief);
      expect(plate.height).toBeGreaterThan(base.height + 0.05 * relief);
      expect(surface.occlusion).toBeGreaterThan(base.occlusion);
    }
  });

  it('shower head sinks spray holes into the grooved panel', () => {
    const relief = proceduralMaterialPresets.showerhead.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const groove = { ...surface },
      hole = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('showerhead', seed);
      sample(0.5, 0.5, surface);
      sample(0.625, 0.5, groove);
      sample(0.55, 0.45, hole);
      expect(surface.height).toBeGreaterThan(groove.height + 0.05 * relief);
      expect(groove.height).toBeGreaterThan(hole.height + 0.05 * relief);
      expect(hole.occlusion).toBeLessThan(surface.occlusion);
    }
  });

  it('bath mat domes suction cups over the woven backing', () => {
    const relief = proceduralMaterialPresets.bathmat.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const base = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('bathmat', seed);
      sample(1 / 16, 1 / 16, surface);
      sample(0, 0, base);
      expect(surface.height).toBeGreaterThan(base.height + 0.1 * relief);
      expect(surface.occlusion).toBeGreaterThan(base.occlusion);
    }
  });

  it('blinds lifts slat faces over the shadowed gaps', () => {
    const relief = proceduralMaterialPresets.blinds.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const gap = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('blinds', seed);
      sample(0.5, 0.125, surface);
      sample(0.5, 0, gap);
      expect(surface.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(surface.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('curtain drapes fold crests over the fabric valleys', () => {
    const relief = proceduralMaterialPresets.curtain.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('curtain', seed);
      let high = 0,
        low = 1;
      for (let i = 0; i < 24; i++) {
        sample(i / 24, 0.37, surface);
        high = Math.max(high, surface.height);
        low = Math.min(low, surface.height);
      }
      expect(high - low).toBeGreaterThan(0.12 * relief);
    }
  });

  it('shade cloth crosses woven threads over the open gaps', () => {
    const relief = proceduralMaterialPresets.shadecloth.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const gap = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('shadecloth', seed);
      sample(1 / 32, 1 / 32, surface);
      sample(0, 0, gap);
      expect(surface.height).toBeGreaterThan(gap.height + 0.05 * relief);
      expect(surface.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('pretzel knots both dough ropes above the single strands and gaps', () => {
    const relief = proceduralMaterialPresets.pretzel.relief;
    const knot: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const rope = { ...knot };
    const gap = { ...knot };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('pretzel', seed);
      sample(0.5, 1 / 3, knot);
      sample(0.25, 0.25, rope);
      sample(1 / 3, 1 / 3, gap);
      expect(knot.height).toBeGreaterThan(rope.height + 0.03 * relief);
      expect(rope.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(knot.occlusion).toBeGreaterThan(rope.occlusion);
      expect(rope.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('bagel lifts its chewy ring over the recessed hole', () => {
    const relief = proceduralMaterialPresets.bagel.relief;
    const ring: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const hole = { ...ring };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('bagel', seed);
      sample(0.5, 0.67, ring);
      sample(0.5, 0.5, hole);
      expect(ring.height).toBeGreaterThan(hole.height + 0.1 * relief);
      expect(ring.occlusion).toBeGreaterThan(hole.occlusion);
    }
  });

  it('croissant stacks buttered layer ridges above the browned seams', () => {
    const relief = proceduralMaterialPresets.croissant.relief;
    const crest: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const seam = { ...crest };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('croissant', seed);
      sample(0.5, 0.375, crest);
      sample(0.125, 0.125, seam);
      expect(crest.height).toBeGreaterThan(seam.height + 0.1 * relief);
      expect(crest.occlusion).toBeGreaterThan(seam.occlusion);
    }
  });

  it('butterfly wing lifts scale tiles above the recessed veins', () => {
    const relief = proceduralMaterialPresets.butterflywing.relief;
    const tile: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const vein = { ...tile };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('butterflywing', seed);
      sample(1 / 48, 1 / 32, tile);
      sample(1 / 3, 1 / 32, vein);
      expect(tile.height).toBeGreaterThan(vein.height + 0.1 * relief);
      expect(tile.occlusion).toBeGreaterThan(vein.occlusion);
    }
  });

  it('beetle wing domes elytra plates over their sutured seams', () => {
    const relief = proceduralMaterialPresets.beetlewing.relief;
    const plate: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const suture = { ...plate };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('beetlewing', seed);
      sample(1 / 12, 0.5, plate);
      sample(1 / 6, 0.5, suture);
      expect(plate.height).toBeGreaterThan(suture.height + 0.1 * relief);
      expect(plate.occlusion).toBeGreaterThan(suture.occlusion);
    }
  });

  it('spider web raises silk threads above the open cells', () => {
    const relief = proceduralMaterialPresets.spiderweb.relief;
    const ring: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const spoke = { ...ring };
    const gap = { ...ring };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('spiderweb', seed);
      sample(0.536084, 0.520833, ring);
      sample(0.5, 0.5833333333333334, spoke);
      sample(0.64896, 0.586, gap);
      expect(ring.height).toBeGreaterThan(gap.height + 0.05 * relief);
      expect(spoke.height).toBeGreaterThan(gap.height + 0.05 * relief);
      expect(ring.occlusion).toBeGreaterThan(gap.occlusion);
      expect(spoke.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it.each(['cirrus', 'cumulus', 'lightning'] as const)(
    '%s lifts its bright relief above the recessed field',
    (kind) => {
      const relief = proceduralMaterialPresets[kind].relief;
      const surface: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        let lowestOcclusion = Infinity,
          highestOcclusion = -Infinity,
          recessedHeight = 0,
          faceHeight = 0;
        // Locate the open field and the relief from cavity shading rather
        // than pinning warp-shifted coordinates or incidental values.
        for (let y = 0; y < 128; y++)
          for (let x = 0; x < 128; x++) {
            sample((x + 0.5) / 128, (y + 0.5) / 128, surface);
            if (surface.occlusion < lowestOcclusion) {
              lowestOcclusion = surface.occlusion;
              recessedHeight = surface.height;
            }
            if (surface.occlusion > highestOcclusion) {
              highestOcclusion = surface.occlusion;
              faceHeight = surface.height;
            }
          }
        expect(highestOcclusion - lowestOcclusion).toBeGreaterThan(0.1);
        expect(faceHeight).toBeGreaterThan(recessedHeight + 0.1 * relief);
      }
    },
  );

  it('kelp ripples broad blade crests above the shadowed troughs', () => {
    const relief = proceduralMaterialPresets.kelp.relief;
    const crest: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const trough = { ...crest };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('kelp', seed);
      sample(0.37, 0.125, crest);
      sample(0.37, 0.25, trough);
      expect(crest.height).toBeGreaterThan(trough.height + 0.1 * relief);
      expect(crest.occlusion).toBeGreaterThan(trough.occlusion);
    }
  });

  it('anemone rings tentacles above the recessed central mouth', () => {
    const relief = proceduralMaterialPresets.anemone.relief;
    const tentacle: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const mouth = { ...tentacle };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('anemone', seed);
      sample(0.6634, 0.5, tentacle);
      sample(0.5, 0.5, mouth);
      expect(tentacle.height).toBeGreaterThan(mouth.height + 0.1 * relief);
      expect(tentacle.occlusion).toBeGreaterThan(mouth.occlusion);
    }
  });

  it('seaweed threads branch above the shaded gaps of the mat', () => {
    const relief = proceduralMaterialPresets.seaweed.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('seaweed', seed);
      let lowestOcclusion = Infinity,
        highestOcclusion = -Infinity,
        recessedHeight = 0,
        faceHeight = 0;
      // Locate the threads and gaps from cavity shading rather than pinning
      // warp-shifted coordinates or incidental relief values.
      for (let y = 0; y < 128; y++)
        for (let x = 0; x < 128; x++) {
          sample((x + 0.5) / 128, (y + 0.5) / 128, surface);
          if (surface.occlusion < lowestOcclusion) {
            lowestOcclusion = surface.occlusion;
            recessedHeight = surface.height;
          }
          if (surface.occlusion > highestOcclusion) {
            highestOcclusion = surface.occlusion;
            faceHeight = surface.height;
          }
        }
      expect(highestOcclusion - lowestOcclusion).toBeGreaterThan(0.1);
      expect(faceHeight).toBeGreaterThan(recessedHeight + 0.1 * relief);
    }
  });

  it('candy twists glossy stripes above their shallow seams', () => {
    const relief = proceduralMaterialPresets.candy.relief;
    const crest: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const seam = { ...crest };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('candy', seed);
      sample(0.0625, 0.0625, crest);
      sample(0.125, 0.125, seam);
      expect(crest.height).toBeGreaterThan(seam.height + 0.1 * relief);
      expect(crest.occlusion).toBeGreaterThan(seam.occlusion);
    }
  });

  it('marshmallow rolls soft piped ridges above their grooves', () => {
    const relief = proceduralMaterialPresets.marshmallow.relief;
    const ridge: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const groove = { ...ridge };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('marshmallow', seed);
      sample(0.05, 0.05, ridge);
      sample(0.1, 0.1, groove);
      expect(ridge.height).toBeGreaterThan(groove.height + 0.1 * relief);
      expect(ridge.occlusion).toBeGreaterThan(groove.occlusion);
    }
  });

  it('nougat raises nut chunks above the chewy base and bubble pits', () => {
    const relief = proceduralMaterialPresets.nougat.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('nougat', seed);
      let lowestOcclusion = Infinity,
        highestOcclusion = -Infinity,
        recessedHeight = 0,
        faceHeight = 0;
      // Locate the chunks and pits from cavity shading rather than pinning
      // seeded blob coordinates or incidental relief values.
      for (let y = 0; y < 128; y++)
        for (let x = 0; x < 128; x++) {
          sample((x + 0.5) / 128, (y + 0.5) / 128, surface);
          if (surface.occlusion < lowestOcclusion) {
            lowestOcclusion = surface.occlusion;
            recessedHeight = surface.height;
          }
          if (surface.occlusion > highestOcclusion) {
            highestOcclusion = surface.occlusion;
            faceHeight = surface.height;
          }
        }
      expect(highestOcclusion - lowestOcclusion).toBeGreaterThan(0.1);
      expect(faceHeight).toBeGreaterThan(recessedHeight + 0.1 * relief);
    }
  });

  it('rippled glass rolls vertical ribs above their troughs', () => {
    const relief = proceduralMaterialPresets.rippledglass.relief;
    const crest: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const trough = { ...crest };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('rippledglass', seed);
      sample(1 / 12, 0.37, crest);
      sample(1 / 6, 0.37, trough);
      expect(crest.height).toBeGreaterThan(trough.height + 0.1 * relief);
      expect(crest.occlusion).toBeGreaterThan(trough.occlusion);
    }
  });

  it('bubble glass domes seeded bubbles over the clear body', () => {
    const relief = proceduralMaterialPresets.bubbleglass.relief;
    const dome: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const body = { ...dome };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('bubbleglass', seed);
      sample(1 / 16, 1 / 16, dome);
      sample(0, 0, body);
      expect(dome.height).toBeGreaterThan(body.height + 0.1 * relief);
      expect(dome.occlusion).toBeGreaterThan(body.occlusion);
    }
  });

  it('frosted glass speckles its etched field above the smoother pane', () => {
    const relief = proceduralMaterialPresets.frostedglass.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('frostedglass', seed);
      let lowestOcclusion = Infinity,
        highestOcclusion = -Infinity,
        recessedHeight = 0,
        faceHeight = 0;
      // Locate the etch and the pane from cavity shading rather than pinning
      // seeded speckle coordinates or incidental relief values.
      for (let y = 0; y < 128; y++)
        for (let x = 0; x < 128; x++) {
          sample((x + 0.5) / 128, (y + 0.5) / 128, surface);
          if (surface.occlusion < lowestOcclusion) {
            lowestOcclusion = surface.occlusion;
            recessedHeight = surface.height;
          }
          if (surface.occlusion > highestOcclusion) {
            highestOcclusion = surface.occlusion;
            faceHeight = surface.height;
          }
        }
      expect(highestOcclusion - lowestOcclusion).toBeGreaterThan(0.1);
      expect(faceHeight).toBeGreaterThan(recessedHeight + 0.1 * relief);
    }
  });

  it('saddle stitching dashes raised thread above the grained leather', () => {
    const relief = proceduralMaterialPresets.saddlestitch.relief;
    const stitch: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const leather = { ...stitch };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('saddlestitch', seed);
      sample(0.09375, 0.96875, stitch);
      sample(0.5, 0.125, leather);
      expect(stitch.height).toBeGreaterThan(leather.height + 0.1 * relief);
      expect(stitch.occlusion).toBeGreaterThan(leather.occlusion);
    }
  });

  it('tooled leather embosses medallions over the compressed ground', () => {
    const relief = proceduralMaterialPresets.tooledleather.relief;
    const medallion: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const ground = { ...medallion };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('tooledleather', seed);
      sample(0.125, 0.125, medallion);
      sample(0, 0, ground);
      expect(medallion.height).toBeGreaterThan(ground.height + 0.1 * relief);
      expect(medallion.occlusion).toBeGreaterThan(ground.occlusion);
    }
  });

  it('patent leather ripples orange peel across the mirror lacquer', () => {
    const relief = proceduralMaterialPresets.patentleather.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('patentleather', seed);
      let lowestOcclusion = Infinity,
        highestOcclusion = -Infinity,
        recessedHeight = 0,
        faceHeight = 0;
      // Locate the peel and the lacquer from cavity shading rather than
      // pinning seeded noise coordinates or incidental relief values.
      for (let y = 0; y < 128; y++)
        for (let x = 0; x < 128; x++) {
          sample((x + 0.5) / 128, (y + 0.5) / 128, surface);
          if (surface.occlusion < lowestOcclusion) {
            lowestOcclusion = surface.occlusion;
            recessedHeight = surface.height;
          }
          if (surface.occlusion > highestOcclusion) {
            highestOcclusion = surface.occlusion;
            faceHeight = surface.height;
          }
        }
      expect(highestOcclusion - lowestOcclusion).toBeGreaterThan(0.1);
      expect(faceHeight).toBeGreaterThan(recessedHeight + 0.1 * relief);
    }
  });

  it('apple skin bands blush streaks above the taut base', () => {
    const relief = proceduralMaterialPresets.appleskin.relief;
    const crest: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const trough = { ...crest };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('appleskin', seed);
      sample(0.37, 0.1, crest);
      sample(0.37, 0.2, trough);
      expect(crest.height).toBeGreaterThan(trough.height + 0.05 * relief);
      expect(crest.occlusion).toBeGreaterThan(trough.occlusion);
    }
  });

  it('peach skin keeps fuzzy blush above the recessed suture groove', () => {
    const relief = proceduralMaterialPresets.peachskin.relief;
    const skin: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const suture = { ...skin };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('peachskin', seed);
      sample(0.25, 0.5, skin);
      sample(0.5, 0.5, suture);
      expect(skin.height).toBeGreaterThan(suture.height + 0.05 * relief);
      expect(skin.occlusion).toBeGreaterThan(suture.occlusion);
    }
  });

  it('grape skin dusts bloom patches above the stretched skin', () => {
    const relief = proceduralMaterialPresets.grapeskin.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('grapeskin', seed);
      let lowestOcclusion = Infinity,
        highestOcclusion = -Infinity,
        recessedHeight = 0,
        faceHeight = 0;
      // Locate the bloom and the skin from cavity shading rather than pinning
      // seeded noise coordinates or incidental relief values.
      for (let y = 0; y < 128; y++)
        for (let x = 0; x < 128; x++) {
          sample((x + 0.5) / 128, (y + 0.5) / 128, surface);
          if (surface.occlusion < lowestOcclusion) {
            lowestOcclusion = surface.occlusion;
            recessedHeight = surface.height;
          }
          if (surface.occlusion > highestOcclusion) {
            highestOcclusion = surface.occlusion;
            faceHeight = surface.height;
          }
        }
      expect(highestOcclusion - lowestOcclusion).toBeGreaterThan(0.1);
      expect(faceHeight).toBeGreaterThan(recessedHeight + 0.1 * relief);
    }
  });

  it('cabbage folds leafy ripples above the recessed veins', () => {
    const relief = proceduralMaterialPresets.cabbage.relief;
    const crest: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const trough = { ...crest };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('cabbage', seed);
      sample(0.08333333333333333, 0.08333333333333333, crest);
      sample(0.16666666666666666, 0.16666666666666666, trough);
      expect(crest.height).toBeGreaterThan(trough.height + 0.1 * relief);
      expect(crest.occlusion).toBeGreaterThan(trough.occlusion);
    }
  });

  it('onion arcs layer bands above the papery seams', () => {
    const relief = proceduralMaterialPresets.onion.relief;
    const crest: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const seam = { ...crest };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('onion', seed);
      sample(0.041666666666666664, 0.041666666666666664, crest);
      sample(0.08333333333333333, 0.08333333333333333, seam);
      expect(crest.height).toBeGreaterThan(seam.height + 0.1 * relief);
      expect(crest.occlusion).toBeGreaterThan(seam.occlusion);
    }
  });

  it('broccoli clusters floret buds above the shaded gaps', () => {
    const relief = proceduralMaterialPresets.broccoli.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('broccoli', seed);
      let lowestOcclusion = Infinity,
        highestOcclusion = -Infinity,
        recessedHeight = 0,
        faceHeight = 0;
      // Locate the buds and gaps from cavity shading rather than pinning
      // seeded noise coordinates or incidental relief values.
      for (let y = 0; y < 128; y++)
        for (let x = 0; x < 128; x++) {
          sample((x + 0.5) / 128, (y + 0.5) / 128, surface);
          if (surface.occlusion < lowestOcclusion) {
            lowestOcclusion = surface.occlusion;
            recessedHeight = surface.height;
          }
          if (surface.occlusion > highestOcclusion) {
            highestOcclusion = surface.occlusion;
            faceHeight = surface.height;
          }
        }
      expect(highestOcclusion - lowestOcclusion).toBeGreaterThan(0.1);
      expect(faceHeight).toBeGreaterThan(recessedHeight + 0.1 * relief);
    }
  });

  it('pillow domes quilted puffs above the recessed piped seams', () => {
    const relief = proceduralMaterialPresets.pillow.relief;
    const loft: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const seam = { ...loft };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('pillow', seed);
      sample(0.25, 0.25, loft);
      sample(0.5, 0.25, seam);
      expect(loft.height).toBeGreaterThan(seam.height + 0.1 * relief);
      expect(loft.occlusion).toBeGreaterThan(seam.occlusion);
    }
  });

  it('mattress keeps the woven surface above the button tuft dimples', () => {
    const relief = proceduralMaterialPresets.mattress.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const tuft = { ...surface };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('mattress', seed);
      sample(0, 0, surface);
      sample(0.125, 0.125, tuft);
      expect(surface.height).toBeGreaterThan(tuft.height + 0.05 * relief);
      expect(surface.occlusion).toBeGreaterThan(tuft.occlusion);
    }
  });

  it('bed sheet presses soft wrinkles over the woven base', () => {
    const relief = proceduralMaterialPresets.bedsheet.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('bedsheet', seed);
      let lowestOcclusion = Infinity,
        highestOcclusion = -Infinity,
        recessedHeight = 0,
        faceHeight = 0;
      // Locate the wrinkles and the base from cavity shading rather than
      // pinning warp-shifted coordinates or incidental relief values.
      for (let y = 0; y < 128; y++)
        for (let x = 0; x < 128; x++) {
          sample((x + 0.5) / 128, (y + 0.5) / 128, surface);
          if (surface.occlusion < lowestOcclusion) {
            lowestOcclusion = surface.occlusion;
            recessedHeight = surface.height;
          }
          if (surface.occlusion > highestOcclusion) {
            highestOcclusion = surface.occlusion;
            faceHeight = surface.height;
          }
        }
      expect(highestOcclusion - lowestOcclusion).toBeGreaterThan(0.1);
      expect(faceHeight).toBeGreaterThan(recessedHeight + 0.1 * relief);
    }
  });

  it('matcha combs whisk streaks above the powder bed', () => {
    const relief = proceduralMaterialPresets.matcha.relief;
    const crest: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const trough = { ...crest };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('matcha', seed);
      sample(0.05, 0.05, crest);
      sample(0.1, 0.1, trough);
      expect(crest.height).toBeGreaterThan(trough.height + 0.1 * relief);
      expect(crest.occlusion).toBeGreaterThan(trough.occlusion);
    }
  });

  it('tea bag threads its filter mesh over the open pores', () => {
    const relief = proceduralMaterialPresets.teabag.relief;
    const crossing: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const pore = { ...crossing };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('teabag', seed);
      sample(1 / 48, 1 / 48, crossing);
      sample(0, 0, pore);
      expect(crossing.height).toBeGreaterThan(pore.height + 0.1 * relief);
      expect(crossing.occlusion).toBeGreaterThan(pore.occlusion);
    }
  });

  it('tea leaf piles curled pieces above the shaded gaps', () => {
    const relief = proceduralMaterialPresets.tealeaf.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('tealeaf', seed);
      let lowestOcclusion = Infinity,
        highestOcclusion = -Infinity,
        recessedHeight = 0,
        faceHeight = 0;
      // Locate the leaves and gaps from cavity shading rather than pinning
      // seeded noise coordinates or incidental relief values.
      for (let y = 0; y < 128; y++)
        for (let x = 0; x < 128; x++) {
          sample((x + 0.5) / 128, (y + 0.5) / 128, surface);
          if (surface.occlusion < lowestOcclusion) {
            lowestOcclusion = surface.occlusion;
            recessedHeight = surface.height;
          }
          if (surface.occlusion > highestOcclusion) {
            highestOcclusion = surface.occlusion;
            faceHeight = surface.height;
          }
        }
      expect(highestOcclusion - lowestOcclusion).toBeGreaterThan(0.1);
      expect(faceHeight).toBeGreaterThan(recessedHeight + 0.1 * relief);
    }
  });

  it('sand dune combs wind ripples above the grain bed', () => {
    const relief = proceduralMaterialPresets.sanddune.relief;
    const crest: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const trough = { ...crest };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('sanddune', seed);
      sample(0.041666666666666664, 0.041666666666666664, crest);
      sample(0.08333333333333333, 0.08333333333333333, trough);
      expect(crest.height).toBeGreaterThan(trough.height + 0.1 * relief);
      expect(crest.occlusion).toBeGreaterThan(trough.occlusion);
    }
  });

  it('pebble beach domes round pebbles over the coarse sand', () => {
    const relief = proceduralMaterialPresets.pebblebeach.relief;
    const pebble: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const sand = { ...pebble };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('pebblebeach', seed);
      sample(0.1, 0.1, pebble);
      sample(0, 0, sand);
      expect(pebble.height).toBeGreaterThan(sand.height + 0.1 * relief);
      expect(pebble.occlusion).toBeGreaterThan(sand.occlusion);
    }
  });

  it('foam edge piles clumps and bubbles over the thin water film', () => {
    const relief = proceduralMaterialPresets.foamedge.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('foamedge', seed);
      let lowestOcclusion = Infinity,
        highestOcclusion = -Infinity,
        recessedHeight = 0,
        faceHeight = 0;
      // Locate the foam and the film from cavity shading rather than pinning
      // seeded noise coordinates or incidental relief values.
      for (let y = 0; y < 128; y++)
        for (let x = 0; x < 128; x++) {
          sample((x + 0.5) / 128, (y + 0.5) / 128, surface);
          if (surface.occlusion < lowestOcclusion) {
            lowestOcclusion = surface.occlusion;
            recessedHeight = surface.height;
          }
          if (surface.occlusion > highestOcclusion) {
            highestOcclusion = surface.occlusion;
            faceHeight = surface.height;
          }
        }
      expect(highestOcclusion - lowestOcclusion).toBeGreaterThan(0.1);
      expect(faceHeight).toBeGreaterThan(recessedHeight + 0.1 * relief);
    }
  });

  it('lava flow coils pahoehoe ropes above the dark cracks', () => {
    const relief = proceduralMaterialPresets.lavaflow.relief;
    const rope: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const crack = { ...rope };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('lavaflow', seed);
      sample(0.05, 0.05, rope);
      sample(0.1, 0.1, crack);
      expect(rope.height).toBeGreaterThan(crack.height + 0.1 * relief);
      expect(rope.occlusion).toBeGreaterThan(crack.occlusion);
    }
  });

  it('cooled lava lifts crusted blocks above the cracks and pores', () => {
    const relief = proceduralMaterialPresets.cooledlava.relief;
    const face: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const crack = { ...face };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('cooledlava', seed);
      sample(0.125, 0.125, face);
      sample(0.25, 0.125, crack);
      expect(face.height).toBeGreaterThan(crack.height + 0.1 * relief);
      expect(face.occlusion).toBeGreaterThan(crack.occlusion);
    }
  });

  it('ash field mounds drifts over the dusted ground', () => {
    const relief = proceduralMaterialPresets.ashfield.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('ashfield', seed);
      let lowestOcclusion = Infinity,
        highestOcclusion = -Infinity,
        recessedHeight = 0,
        faceHeight = 0;
      // Locate the drifts and the ground from cavity shading rather than
      // pinning seeded noise coordinates or incidental relief values.
      for (let y = 0; y < 128; y++)
        for (let x = 0; x < 128; x++) {
          sample((x + 0.5) / 128, (y + 0.5) / 128, surface);
          if (surface.occlusion < lowestOcclusion) {
            lowestOcclusion = surface.occlusion;
            recessedHeight = surface.height;
          }
          if (surface.occlusion > highestOcclusion) {
            highestOcclusion = surface.occlusion;
            faceHeight = surface.height;
          }
        }
      expect(highestOcclusion - lowestOcclusion).toBeGreaterThan(0.1);
      expect(faceHeight).toBeGreaterThan(recessedHeight + 0.1 * relief);
    }
  });

  it('stalactite hangs dripping cones over the shadowed pockets', () => {
    const relief = proceduralMaterialPresets.stalactite.relief;
    const cone: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const pocket = { ...cone };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('stalactite', seed);
      sample(0.125, 0.125, cone);
      sample(0, 0, pocket);
      expect(cone.height).toBeGreaterThan(pocket.height + 0.1 * relief);
      expect(cone.occlusion).toBeGreaterThan(pocket.occlusion);
    }
  });

  it('flowstone terraces flow bands above the drip seams', () => {
    const relief = proceduralMaterialPresets.flowstone.relief;
    const terrace: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const seam = { ...terrace };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('flowstone', seed);
      sample(0.05, 0.05, terrace);
      sample(0.1, 0.1, seam);
      expect(terrace.height).toBeGreaterThan(seam.height + 0.1 * relief);
      expect(terrace.occlusion).toBeGreaterThan(seam.occlusion);
    }
  });

  it('cave floor breaks rubble around the shallow puddles', () => {
    const relief = proceduralMaterialPresets.cavefloor.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('cavefloor', seed);
      let lowestOcclusion = Infinity,
        highestOcclusion = -Infinity,
        recessedHeight = 0,
        faceHeight = 0;
      // Locate the rubble and puddles from cavity shading rather than pinning
      // seeded noise coordinates or incidental relief values.
      for (let y = 0; y < 128; y++)
        for (let x = 0; x < 128; x++) {
          sample((x + 0.5) / 128, (y + 0.5) / 128, surface);
          if (surface.occlusion < lowestOcclusion) {
            lowestOcclusion = surface.occlusion;
            recessedHeight = surface.height;
          }
          if (surface.occlusion > highestOcclusion) {
            highestOcclusion = surface.occlusion;
            faceHeight = surface.height;
          }
        }
      expect(highestOcclusion - lowestOcclusion).toBeGreaterThan(0.1);
      expect(faceHeight).toBeGreaterThan(recessedHeight + 0.1 * relief);
    }
  });

  it('jam sets glossy fruit chunks above the clear syrup', () => {
    const relief = proceduralMaterialPresets.jam.relief;
    const chunk: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const syrup = { ...chunk };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('jam', seed);
      sample(0.1, 0.1, chunk);
      sample(0, 0, syrup);
      expect(chunk.height).toBeGreaterThan(syrup.height + 0.1 * relief);
      expect(chunk.occlusion).toBeGreaterThan(syrup.occlusion);
    }
  });

  it('sprinkles scatter sugar rods over the frosted base', () => {
    const relief = proceduralMaterialPresets.sprinkles.relief;
    const rod: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const base = { ...rod };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('sprinkles', seed);
      sample(1 / 12, 1 / 12, rod);
      sample(0, 0, base);
      expect(rod.height).toBeGreaterThan(base.height + 0.1 * relief);
      expect(rod.occlusion).toBeGreaterThan(base.occlusion);
    }
  });

  it('peanut butter breaks nut pieces through the swirled paste', () => {
    const relief = proceduralMaterialPresets.peanutbutter.relief;
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('peanutbutter', seed);
      let lowestOcclusion = Infinity,
        highestOcclusion = -Infinity,
        recessedHeight = 0,
        faceHeight = 0;
      // Locate the nut pieces and paste from cavity shading rather than
      // pinning seeded noise coordinates or incidental relief values.
      for (let y = 0; y < 128; y++)
        for (let x = 0; x < 128; x++) {
          sample((x + 0.5) / 128, (y + 0.5) / 128, surface);
          if (surface.occlusion < lowestOcclusion) {
            lowestOcclusion = surface.occlusion;
            recessedHeight = surface.height;
          }
          if (surface.occlusion > highestOcclusion) {
            highestOcclusion = surface.occlusion;
            faceHeight = surface.height;
          }
        }
      expect(highestOcclusion - lowestOcclusion).toBeGreaterThan(0.1);
      expect(faceHeight).toBeGreaterThan(recessedHeight + 0.1 * relief);
    }
  });

  it('ice cream rolls piped ridges above the melting grooves', () => {
    const relief = proceduralMaterialPresets.icecream.relief;
    const ridge: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const groove = { ...ridge };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('icecream', seed);
      sample(0.05, 0.05, ridge);
      sample(0.1, 0.1, groove);
      expect(ridge.height).toBeGreaterThan(groove.height + 0.1 * relief);
      expect(ridge.occlusion).toBeGreaterThan(groove.occlusion);
    }
  });

  it('popsicle runs frozen drip ridges above the grooves', () => {
    const relief = proceduralMaterialPresets.popsicle.relief;
    const ridge: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const groove = { ...ridge };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('popsicle', seed);
      sample(0.37, 1 / 16, ridge);
      sample(0.37, 1 / 8, groove);
      expect(ridge.height).toBeGreaterThan(groove.height + 0.1 * relief);
      expect(ridge.occlusion).toBeGreaterThan(groove.occlusion);
    }
  });

  it('sorbet scoops scrape ridges above the fruit-flecked gaps', () => {
    const relief = proceduralMaterialPresets.sorbet.relief;
    const crest: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const gap = { ...crest };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('sorbet', seed);
      sample(0.25, 0.16666666666666666, crest);
      sample(0.25, 0.08333333333333333, gap);
      expect(crest.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(crest.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('spaghetti winds noodle strands over the sauce gaps', () => {
    const relief = proceduralMaterialPresets.spaghetti.relief;
    const strand: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const gap = { ...strand };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('spaghetti', seed);
      sample(0.37, 1 / 12, strand);
      sample(0.37, 1 / 6, gap);
      expect(strand.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(strand.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('macaroni piles tube shells over the gaps between them', () => {
    const relief = proceduralMaterialPresets.macaroni.relief;
    const body: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const gap = { ...body };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('macaroni', seed);
      sample(0.1, 0.125, body);
      sample(0, 0, gap);
      expect(body.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(body.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('lasagna stacks pasta layers above the sauce seams', () => {
    const relief = proceduralMaterialPresets.lasagna.relief;
    const layer: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const seam = { ...layer };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('lasagna', seed);
      sample(0.37, 0.125, layer);
      sample(0.37, 0.25, seam);
      expect(layer.height).toBeGreaterThan(seam.height + 0.1 * relief);
      expect(layer.occlusion).toBeGreaterThan(seam.occlusion);
    }
  });

  it('origami raises folded facets above the pressed creases', () => {
    const relief = proceduralMaterialPresets.origami.relief;
    const facet: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const crease = { ...facet };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('origami', seed);
      sample(0.25, 0, facet);
      sample(0.5, 0, crease);
      expect(facet.height).toBeGreaterThan(crease.height + 0.1 * relief);
      expect(facet.occlusion).toBeGreaterThan(crease.occlusion);
    }
  });

  it('paper lace keeps the webbing above the die-cut holes', () => {
    const relief = proceduralMaterialPresets.paperlace.relief;
    const webbing: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const hole = { ...webbing };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('paperlace', seed);
      sample(0, 0, webbing);
      sample(1 / 12, 1 / 12, hole);
      expect(webbing.height).toBeGreaterThan(hole.height + 0.1 * relief);
      expect(webbing.occlusion).toBeGreaterThan(hole.occlusion);
    }
  });

  it('paper cut lifts layered shapes over the flat backing', () => {
    const relief = proceduralMaterialPresets.papercut.relief;
    const shape: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const backing = { ...shape };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('papercut', seed);
      sample(0.1, 0.1, shape);
      sample(0, 0, backing);
      expect(shape.height).toBeGreaterThan(backing.height + 0.1 * relief);
      expect(shape.occlusion).toBeGreaterThan(backing.occlusion);
    }
  });

  it('sunflower domes seed heads above the disk base', () => {
    const relief = proceduralMaterialPresets.sunflower.relief;
    const head: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const base = { ...head };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('sunflower', seed);
      sample(0.05, 0.05, head);
      sample(0, 0, base);
      expect(head.height).toBeGreaterThan(base.height + 0.1 * relief);
      expect(head.occlusion).toBeGreaterThan(base.occlusion);
    }
  });

  it('daisy fans petals above the gaps and the recessed center', () => {
    const relief = proceduralMaterialPresets.daisy.relief;
    const petal: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const gap = { ...petal };
    const center = { ...petal };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('daisy', seed);
      sample(0.59549, 0.5, petal);
      sample(0.5923, 0.5247, gap);
      sample(0.5, 0.5, center);
      expect(petal.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(petal.height).toBeGreaterThan(center.height + 0.1 * relief);
      expect(petal.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('clover spreads heart lobes above the gaps between them', () => {
    const relief = proceduralMaterialPresets.clover.relief;
    const lobe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const gap = { ...lobe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('clover', seed);
      sample(0.55, 0.5, lobe);
      sample(0.525, 0.5433, gap);
      expect(lobe.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(lobe.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('puzzle tiles lift pieces and knobs above the seams', () => {
    const relief = proceduralMaterialPresets.puzzletile.relief;
    const piece: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const knob = { ...piece };
    const corner = { ...piece };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('puzzletile', seed);
      sample(0.25, 0.25, piece);
      sample(0, 0.25, knob);
      sample(0, 0, corner);
      expect(piece.height).toBeGreaterThan(corner.height + 0.1 * relief);
      expect(knob.height).toBeGreaterThan(corner.height + 0.1 * relief);
      expect(piece.occlusion).toBeGreaterThan(corner.occlusion);
    }
  });

  it('lego brick domes studs above the smooth plate', () => {
    const relief = proceduralMaterialPresets.legobrick.relief;
    const stud: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const plate = { ...stud };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('legobrick', seed);
      sample(1 / 8, 1 / 8, stud);
      sample(0, 0, plate);
      expect(stud.height).toBeGreaterThan(plate.height + 0.1 * relief);
      expect(stud.occlusion).toBeGreaterThan(plate.occlusion);
    }
  });

  it('rubber band stretches crossed bands over the base wrap', () => {
    const relief = proceduralMaterialPresets.rubberband.relief;
    const crossing: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const single = { ...crossing };
    const gap = { ...crossing };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('rubberband', seed);
      sample(1 / 6, 1 / 6, crossing);
      sample(1 / 6, 1 / 3, single);
      sample(1 / 3, 1 / 3, gap);
      expect(crossing.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(single.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(crossing.occlusion).toBeGreaterThan(gap.occlusion);
      expect(single.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('hay bale combs straw streaks above the bind grooves', () => {
    const relief = proceduralMaterialPresets.haybale.relief;
    const straw: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const gap = { ...straw };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('haybale', seed);
      sample(0.05, 0, straw);
      sample(0.1, 0, gap);
      expect(straw.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(straw.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('corn crib crosses slat rails over the open gaps', () => {
    const relief = proceduralMaterialPresets.corncrib.relief;
    const crossing: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const single = { ...crossing };
    const gap = { ...crossing };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('corncrib', seed);
      sample(1 / 6, 0.125, crossing);
      sample(1 / 6, 0.25, single);
      sample(1 / 3, 0.25, gap);
      expect(crossing.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(single.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(crossing.occlusion).toBeGreaterThan(gap.occlusion);
      expect(single.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('fencepost lifts weathered grain ridges above the dark checks', () => {
    const relief = proceduralMaterialPresets.fencepost.relief;
    const ridge: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const check = { ...ridge };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('fencepost', seed);
      sample(1 / 12, 0.37, ridge);
      sample(0, 0.37, check);
      expect(ridge.height).toBeGreaterThan(check.height + 0.1 * relief);
      expect(ridge.occlusion).toBeGreaterThan(check.occlusion);
    }
  });

  it('pool felt raises its white marking dots above the nap', () => {
    const relief = proceduralMaterialPresets.poolfelt.relief;
    const dot: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const felt = { ...dot };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('poolfelt', seed);
      sample(1 / 16, 1 / 16, dot);
      sample(0, 0, felt);
      expect(dot.height).toBeGreaterThan(felt.height + 0.1 * relief);
      expect(dot.occlusion).toBeGreaterThan(felt.occlusion);
    }
  });

  it('ice glosses the sweep crests above the troughs', () => {
    const relief = proceduralMaterialPresets.icesurface.relief;
    const crest: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const trough = { ...crest };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('icesurface', seed);
      sample(1 / 14, 0, crest);
      sample(1 / 7, 0, trough);
      expect(crest.height).toBeGreaterThan(trough.height + 0.1 * relief);
      expect(crest.occlusion).toBeGreaterThan(trough.occlusion);
    }
  });

  it('climbing wall lifts holds over the gritty panels', () => {
    const relief = proceduralMaterialPresets.climbingwall.relief;
    const hold: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const wall = { ...hold };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('climbingwall', seed);
      sample(1 / 6, 1 / 6, hold);
      sample(0, 0, wall);
      expect(hold.height).toBeGreaterThan(wall.height + 0.1 * relief);
      expect(hold.occlusion).toBeGreaterThan(wall.occlusion);
    }
  });

  it('oled panel glows subpixel stripes above the dark matrix', () => {
    const relief = proceduralMaterialPresets.oledpanel.relief;
    const stripe: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const gap = { ...stripe };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('oledpanel', seed);
      sample(1 / 36, 1 / 12, stripe);
      sample(0, 1 / 12, gap);
      expect(stripe.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(stripe.color).toBeGreaterThan(gap.color + 0.1 * relief);
      expect(stripe.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('crt scanlines raise phosphor crests above the line gaps', () => {
    const relief = proceduralMaterialPresets.crtscanline.relief;
    const crest: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const gap = { ...crest };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('crtscanline', seed);
      sample(0, 0.05, crest);
      sample(0, 0, gap);
      expect(crest.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(crest.color).toBeGreaterThan(gap.color + 0.1 * relief);
      expect(crest.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('keyboard keys lift rounded caps over the recessed gaps', () => {
    const relief = proceduralMaterialPresets.keyboardkey.relief;
    const cap: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const gap = { ...cap };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('keyboardkey', seed);
      sample(1 / 12, 1 / 12, cap);
      sample(0, 1 / 12, gap);
      expect(cap.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(cap.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('film strip punches perforations between the divider grooves', () => {
    const relief = proceduralMaterialPresets.filmstrip.relief;
    const film: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const hole = { ...film };
    const groove = { ...film };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('filmstrip', seed);
      sample(1 / 8, 1 / 4, hole);
      sample(0, 1 / 4, film);
      sample(0, 0, groove);
      expect(film.height).toBeGreaterThan(hole.height + 0.1 * relief);
      expect(film.height).toBeGreaterThan(groove.height + 0.1 * relief);
      expect(film.occlusion).toBeGreaterThan(hole.occlusion);
      expect(film.occlusion).toBeGreaterThan(groove.occlusion);
    }
  });

  it('postage stamp raises its medallion over paper and above the perforations', () => {
    const relief = proceduralMaterialPresets.postagestamp.relief;
    const paper: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const hole = { ...paper };
    const medallion = { ...paper };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('postagestamp', seed);
      sample(0, 0, hole);
      sample(1 / 16, 1 / 16, paper);
      sample(1 / 2, 1 / 2, medallion);
      expect(paper.height).toBeGreaterThan(hole.height + 0.1 * relief);
      expect(medallion.height).toBeGreaterThan(paper.height + 0.1 * relief);
      expect(paper.occlusion).toBeGreaterThan(hole.occlusion);
    }
  });

  it('halftone dots rise above the open paper between them', () => {
    const relief = proceduralMaterialPresets.halftoneprint.relief;
    const dot: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const gap = { ...dot };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('halftoneprint', seed);
      sample(1 / 12, 0, dot);
      sample(0, 0, gap);
      expect(dot.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(dot.color).toBeGreaterThan(gap.color + 0.1 * relief);
      expect(dot.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('radiator tubes crest above the recessed seams', () => {
    const relief = proceduralMaterialPresets.radiator.relief;
    const crest: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const gap = { ...crest };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('radiator', seed);
      sample(1 / 10, 1 / 4, crest);
      sample(0, 1 / 4, gap);
      expect(crest.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(crest.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('screw heads keep their cross recesses below the head rings and panel', () => {
    const relief = proceduralMaterialPresets.screwhead.relief;
    const ring: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const center = { ...ring };
    const panel = { ...ring };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('screwhead', seed);
      sample(0.145, 0.145, ring);
      sample(1 / 8, 1 / 8, center);
      sample(0, 0, panel);
      expect(ring.height).toBeGreaterThan(center.height + 0.1 * relief);
      expect(panel.height).toBeGreaterThan(center.height + 0.1 * relief);
      expect(ring.occlusion).toBeGreaterThan(center.occlusion);
      expect(panel.occlusion).toBeGreaterThan(center.occlusion);
    }
  });

  it('chain link twists nodes above the crossing wires and open diamonds', () => {
    const relief = proceduralMaterialPresets.chainlink.relief;
    const node: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const wire = { ...node };
    const hole = { ...node };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('chainlink', seed);
      sample(0, 0, node);
      sample(1 / 4, 3 / 4, wire);
      sample(1 / 2, 0, hole);
      expect(node.height).toBeGreaterThan(wire.height + 0.1 * relief);
      expect(wire.height).toBeGreaterThan(hole.height + 0.1 * relief);
      expect(node.occlusion).toBeGreaterThan(hole.occlusion);
      expect(wire.occlusion).toBeGreaterThan(hole.occlusion);
    }
  });

  it('fried egg domes the yolk above the white and the pan', () => {
    const relief = proceduralMaterialPresets.friedegg.relief;
    const yolk: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const white = { ...yolk };
    const pan = { ...yolk };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('friedegg', seed);
      sample(1 / 2, 1 / 2, yolk);
      sample(1 / 2, 0.35, white);
      sample(0, 0.05, pan);
      expect(yolk.height).toBeGreaterThan(white.height + 0.1 * relief);
      expect(white.height).toBeGreaterThan(pan.height + 0.1 * relief);
      expect(yolk.occlusion).toBeGreaterThan(pan.occlusion);
      expect(white.occlusion).toBeGreaterThan(pan.occlusion);
    }
  });

  it('sushi rice grains dome above the crevices', () => {
    const relief = proceduralMaterialPresets.sushirice.relief;
    const grain: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const gap = { ...grain };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('sushirice', seed);
      sample(1 / 12, 1 / 12, grain);
      sample(0, 0, gap);
      expect(grain.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(grain.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('chocolate chips rise above the cookie crumb', () => {
    const relief = proceduralMaterialPresets.chocolatechip.relief;
    const chip: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const cookie = { ...chip };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('chocolatechip', seed);
      sample(1 / 6, 1 / 6, chip);
      sample(0, 0, cookie);
      expect(chip.height).toBeGreaterThan(cookie.height + 0.1 * relief);
      expect(chip.occlusion).toBeGreaterThan(cookie.occlusion);
    }
  });

  it('cargo mat ribs crest above the grooves and cross seams', () => {
    const relief = proceduralMaterialPresets.cargomat.relief;
    const rib: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const gap = { ...rib };
    const groove = { ...rib };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('cargomat', seed);
      sample(1 / 8, 1 / 4, rib);
      sample(0, 1 / 4, gap);
      sample(0, 0, groove);
      expect(rib.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(gap.height).toBeGreaterThan(groove.height + 0.1 * relief);
      expect(rib.occlusion).toBeGreaterThan(groove.occlusion);
    }
  });

  it('dashboard grain pebbles above the valleys and seam creases', () => {
    const relief = proceduralMaterialPresets.dashboardgrain.relief;
    const bump: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const valley = { ...bump };
    const seam = { ...bump };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('dashboardgrain', seed);
      sample(1 / 20, 1 / 20, bump);
      sample(1 / 8, 0, valley);
      sample(0, 0, seam);
      expect(bump.height).toBeGreaterThan(valley.height + 0.1 * relief);
      expect(valley.height).toBeGreaterThan(seam.height + 0.1 * relief);
      expect(bump.occlusion).toBeGreaterThan(seam.occlusion);
    }
  });

  it('license plate lifts its border above the text bars and inset', () => {
    const relief = proceduralMaterialPresets.licenseplate.relief;
    const border: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const bar = { ...border };
    const inset = { ...border };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('licenseplate', seed);
      sample(0, 1 / 2, border);
      sample(1 / 2, 3 / 8, bar);
      sample(1 / 2, 1 / 2, inset);
      expect(border.height).toBeGreaterThan(bar.height + 0.1 * relief);
      expect(bar.height).toBeGreaterThan(inset.height + 0.1 * relief);
      expect(bar.occlusion).toBeGreaterThan(inset.occlusion);
    }
  });

  it('flower bed rosettes dome above the soil', () => {
    const relief = proceduralMaterialPresets.flowerbed.relief;
    const flower: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const soil = { ...flower };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('flowerbed', seed);
      sample(1 / 6, 1 / 6, flower);
      sample(0, 0, soil);
      expect(flower.height).toBeGreaterThan(soil.height + 0.1 * relief);
      expect(flower.occlusion).toBeGreaterThan(soil.occlusion);
    }
  });

  it('grass stripes gloss above the mowed troughs', () => {
    const relief = proceduralMaterialPresets.grassstripe.relief;
    const crest: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const trough = { ...crest };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('grassstripe', seed);
      sample(0, 1 / 4, crest);
      sample(0, 0, trough);
      expect(crest.height).toBeGreaterThan(trough.height + 0.1 * relief);
      expect(crest.occlusion).toBeGreaterThan(trough.occlusion);
    }
  });

  it('topiary clusters rise above the trimmed gaps', () => {
    const relief = proceduralMaterialPresets.topiary.relief;
    const cluster: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const gap = { ...cluster };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('topiary', seed);
      sample(1 / 6, 1 / 6, cluster);
      sample(0, 0, gap);
      expect(cluster.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(cluster.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('confetti chips rise above the paper gaps', () => {
    const relief = proceduralMaterialPresets.confetti.relief;
    const chip: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const gap = { ...chip };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('confetti', seed);
      sample(1 / 8, 1 / 8, chip);
      sample(0, 0, gap);
      expect(chip.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(chip.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('ribbon streamers crest above the troughs', () => {
    const relief = proceduralMaterialPresets.ribbonstreamer.relief;
    const crest: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const trough = { ...crest };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('ribbonstreamer', seed);
      sample(1 / 12, 1 / 12, crest);
      sample(0, 0, trough);
      expect(crest.height).toBeGreaterThan(trough.height + 0.1 * relief);
      expect(crest.occlusion).toBeGreaterThan(trough.occlusion);
    }
  });

  it('pinata fringe strands hang above the tiers and gaps', () => {
    const relief = proceduralMaterialPresets.pinatafringe.relief;
    const strand: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const gap = { ...strand };
    const tier = { ...strand };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('pinatafringe', seed);
      sample(1 / 28, 1 / 6, strand);
      sample(0, 1 / 6, gap);
      sample(0, 0, tier);
      expect(strand.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(gap.height).toBeGreaterThan(tier.height + 0.1 * relief);
      expect(strand.occlusion).toBeGreaterThan(tier.occlusion);
    }
  });

  it('xylophone bars crest above the cord holes and gaps', () => {
    const relief = proceduralMaterialPresets.xylophone.relief;
    const clear: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const holed = { ...clear };
    const gap = { ...clear };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('xylophone', seed);
      sample(1 / 8, 0, clear);
      sample(1 / 8, 1 / 4, holed);
      sample(0, 1 / 4, gap);
      expect(clear.height).toBeGreaterThan(holed.height + 0.1 * relief);
      expect(holed.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(clear.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('tambourine jingle discs dome above the drum skin', () => {
    const relief = proceduralMaterialPresets.tambourine.relief;
    const disc: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const skin = { ...disc };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('tambourine', seed);
      sample(1 / 10, 1 / 10, disc);
      sample(0, 0, skin);
      expect(disc.height).toBeGreaterThan(skin.height + 0.1 * relief);
      expect(disc.occlusion).toBeGreaterThan(skin.occlusion);
    }
  });

  it('castanet shells rim above their dimples and the felt', () => {
    const relief = proceduralMaterialPresets.castanet.relief;
    const rim: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const center = { ...rim };
    const felt = { ...rim };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('castanet', seed);
      sample(0.18666666666666668, 0.18666666666666668, rim);
      sample(1 / 6, 1 / 6, center);
      sample(0, 0, felt);
      expect(rim.height).toBeGreaterThan(center.height + 0.1 * relief);
      expect(center.height).toBeGreaterThan(felt.height + 0.1 * relief);
      expect(rim.occlusion).toBeGreaterThan(felt.occlusion);
    }
  });

  it('capsule halves dome above their seams and the backing', () => {
    const relief = proceduralMaterialPresets.pillcapsule.relief;
    const half: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const seam = { ...half };
    const base = { ...half };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('pillcapsule', seed);
      sample(1 / 6, 0.28, half);
      sample(1 / 6, 1 / 4, seam);
      sample(0, 0, base);
      expect(half.height).toBeGreaterThan(seam.height + 0.1 * relief);
      expect(seam.height).toBeGreaterThan(base.height + 0.1 * relief);
      expect(half.occlusion).toBeGreaterThan(base.occlusion);
    }
  });

  it('tablet crowns rise above their score grooves and the backing', () => {
    const relief = proceduralMaterialPresets.pilltablet.relief;
    const crown: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const score = { ...crown };
    const base = { ...crown };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('pilltablet', seed);
      sample(0.155, 0.125, crown);
      sample(1 / 8, 1 / 8, score);
      sample(0, 0, base);
      expect(crown.height).toBeGreaterThan(score.height + 0.1 * relief);
      expect(score.height).toBeGreaterThan(base.height + 0.1 * relief);
      expect(crown.occlusion).toBeGreaterThan(base.occlusion);
    }
  });

  it('bath bomb fizz stays above the diagonal fissures', () => {
    const relief = proceduralMaterialPresets.bathbomb.relief;
    const field: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const crack = { ...field };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('bathbomb', seed);
      sample(1 / 8, 0, field);
      sample(0, 0, crack);
      expect(field.height).toBeGreaterThan(crack.height + 0.1 * relief);
      expect(field.occlusion).toBeGreaterThan(crack.occlusion);
    }
  });

  it('grit domes rise above the sandpaper backing', () => {
    const relief = proceduralMaterialPresets.sandpaper.relief;
    const dome: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const backing = { ...dome };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('sandpaper', seed);
      sample(1 / 20, 1 / 24, dome);
      sample(0, 1 / 24, backing);
      expect(dome.height).toBeGreaterThan(backing.height + 0.1 * relief);
      expect(dome.occlusion).toBeGreaterThan(backing.occlusion);
    }
  });

  it('steel wool strands crest above the gaps between crossings', () => {
    const relief = proceduralMaterialPresets.steelwool.relief;
    const strand: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const gap = { ...strand };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('steelwool', seed);
      sample(0.25, 0.25, strand);
      sample(0, 0, gap);
      expect(strand.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(strand.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('wire brush bristles crest above their grooves', () => {
    const relief = proceduralMaterialPresets.wirebrush.relief;
    const bristle: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const groove = { ...bristle };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('wirebrush', seed);
      sample(1 / 48, 0, bristle);
      sample(0, 0, groove);
      expect(bristle.height).toBeGreaterThan(groove.height + 0.1 * relief);
      expect(bristle.occlusion).toBeGreaterThan(groove.occlusion);
    }
  });

  it('grater rims crest above the plane and their punched holes', () => {
    const relief = proceduralMaterialPresets.cheesegrater.relief;
    const rim: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const plane = { ...rim };
    const hole = { ...rim };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('cheesegrater', seed);
      sample(0.136333, 1 / 16, rim);
      sample(0, 0, plane);
      sample(1 / 12, 1 / 16, hole);
      expect(rim.height).toBeGreaterThan(plane.height + 0.1 * relief);
      expect(plane.height).toBeGreaterThan(hole.height + 0.1 * relief);
      expect(rim.occlusion).toBeGreaterThan(hole.occlusion);
    }
  });

  it('oven rack rods crest above their crossbars and the gaps', () => {
    const relief = proceduralMaterialPresets.ovenrack.relief;
    const rod: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const bar = { ...rod };
    const gap = { ...rod };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('ovenrack', seed);
      sample(0.3, 1 / 16, rod);
      sample(1 / 8, 0, bar);
      sample(0, 0, gap);
      expect(rod.height).toBeGreaterThan(bar.height + 0.1 * relief);
      expect(bar.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(rod.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('muffin tin rims crest above the pan and their cup bottoms', () => {
    const relief = proceduralMaterialPresets.muffintin.relief;
    const rim: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const pan = { ...rim };
    const cup = { ...rim };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('muffintin', seed);
      sample(0.225, 0.125, rim);
      sample(0, 0, pan);
      sample(1 / 8, 1 / 8, cup);
      expect(rim.height).toBeGreaterThan(pan.height + 0.1 * relief);
      expect(pan.height).toBeGreaterThan(cup.height + 0.1 * relief);
      expect(rim.occlusion).toBeGreaterThan(cup.occlusion);
    }
  });

  it('gauze threads crest above the open gaps', () => {
    const relief = proceduralMaterialPresets.gauze.relief;
    const over: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const under = { ...over };
    const gap = { ...over };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('gauze', seed);
      sample(1 / 24, 1 / 8, over);
      sample(1 / 24, 1 / 24, under);
      sample(0, 0, gap);
      expect(over.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(under.height).toBeGreaterThan(gap.height + 0.1 * relief);
      expect(over.occlusion).toBeGreaterThan(gap.occlusion);
    }
  });

  it('bandage ribs crest above their selvedge grooves', () => {
    const relief = proceduralMaterialPresets.elasticbandage.relief;
    const rib: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const groove = { ...rib };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('elasticbandage', seed);
      sample(0.3, 0.175, rib);
      sample(0.25, 0.25, groove);
      expect(rib.height).toBeGreaterThan(groove.height + 0.1 * relief);
      expect(rib.occlusion).toBeGreaterThan(groove.occlusion);
    }
  });

  it('ice pack cells bulge above their seam grid', () => {
    const relief = proceduralMaterialPresets.icepack.relief;
    const cell: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const seam = { ...cell };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('icepack', seed);
      sample(1 / 8, 1 / 8, cell);
      sample(0, 0, seam);
      expect(cell.height).toBeGreaterThan(seam.height + 0.1 * relief);
      expect(cell.occlusion).toBeGreaterThan(seam.occlusion);
    }
  });

  it('knurled metal leaves raised diamond tips between both diagonal cuts', () => {
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('knurledmetal', seed);
      for (const offset of [0, 1 / 12, 7 / 12]) {
        sample(offset + 1 / 48, offset, surface);
        const tip = surface.height,
          tipOcclusion = surface.occlusion;
        for (const side of [-1, 1]) {
          sample(offset + 1 / 96, offset + side / 96, surface);
          expect(surface.height).toBeLessThan(tip);
          expect(surface.occlusion).toBeLessThan(tipOcclusion);
        }
      }
    }
  });

  it('engine-turned disk support boundaries blend with continuous field slopes', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a },
      center = { ...a };
    const epsilon = 1e-8;
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('engineturned', seed);
      for (const row of [0, 1, 5])
        for (const column of [0, 3, 5])
          for (let i = 0; i < 19; i++) {
            const angle = (i / 19) * Math.PI * 2,
              dx = Math.cos(angle),
              dy = Math.sin(angle);
            const u = (column + 0.25 + 0.5 * (row % 2) + 0.95 * dx) / 6,
              v = (row + 0.5 + 0.95 * dy) / 6;
            sample(u - epsilon * dx, v - epsilon * dy, a);
            sample(u + epsilon * dx, v + epsilon * dy, b);
            sample(u, v, center);
            for (const key of Object.keys(a) as (keyof SurfaceSample)[]) {
              expect(Math.abs(a[key] - b[key])).toBeLessThan(0.001);
              expect(
                Math.abs(a[key] - 2 * center[key] + b[key]) / epsilon,
              ).toBeLessThan(0.01);
            }
          }
    }
  });

  it.each([
    ['limestone', 24],
    ['breccia', 6],
    ['osb', 6],
    ['chipboard', 28],
    ['straw', 8],
    ['studdedrubber', 6],
    ['groovedrubber', 12],
    ['recycledrubber', 48],
    ['basketball', 36],
    ['tennisball', 24],
    ['golfball', 10],
  ] as const)(
    '%s fades all owned fields smoothly as feature neighborhoods change',
    (kind, cells) => {
      const a: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      const b = { ...a },
        center = { ...a };
      // Use a cell-local step: dense chip edges have high but continuous
      // curvature, which a fixed UV step can mistake for a slope jump.
      const epsilon = 1e-8 / cells;
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        for (let edge = 0; edge <= cells; edge++)
          for (let i = 0; i < 37; i++)
            for (const axis of [0, 1]) {
              const u = axis === 0 ? edge / cells : (i + 0.37) / 37,
                v = axis === 1 ? edge / cells : (i + 0.37) / 37;
              const du = axis === 0 ? epsilon : 0,
                dv = axis === 1 ? epsilon : 0;
              sample(u - du, v - dv, a);
              sample(u + du, v + dv, b);
              sample(u, v, center);
              for (const key of Object.keys(a) as (keyof SurfaceSample)[]) {
                expect(Math.abs(a[key] - b[key])).toBeLessThan(0.001);
                expect(
                  Math.abs(a[key] - 2 * center[key] + b[key]) / epsilon,
                ).toBeLessThan(0.01);
              }
            }
      }
    },
  );

  it('reed mat binding threads lift above slender reed crowns and recessed gaps', () => {
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('reedmat', seed);
      for (let reed = 0; reed < 16; reed++)
        for (let row = 0; row < 4; row++) {
          const u = (reed + 0.5) / 16,
            v = row / 4;
          sample(u, v, surface);
          const binding = surface.height;
          sample(u, v + 1 / 8, surface);
          const crown = surface.height;
          sample(reed / 16, v + 1 / 8, surface);
          const gap = surface.height;
          expect(binding).toBeGreaterThan(crown);
          expect(crown).toBeGreaterThan(surface.height);
          sample(reed / 16, v, surface);
          expect(surface.height).toBeGreaterThan(gap);
        }
    }
  });

  it('rope relief follows diagonal helical grooves rather than crossing knit loops', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a };
    const epsilon = 1e-5;
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('rope', seed);
      let along = 0,
        across = 0;
      for (let band = 0; band < 6; band++)
        for (let step = 0; step < 96; step++) {
          const u = (band + 0.5) / 6,
            v = (step + 0.37) / 96;
          sample(u - epsilon / 3, v - epsilon, a);
          sample(u + epsilon / 3, v + epsilon, b);
          along += (a.height - b.height) ** 2;
          sample(u, v - epsilon, a);
          sample(u, v + epsilon, b);
          across += (a.height - b.height) ** 2;
        }
      expect(across).toBeGreaterThan(along * 4);
    }
  });

  it('thin straw stems stand above bedding gaps and fade all owned fields at their edges', () => {
    const featureHash = (x: number, y: number, seed: number): number => {
      let n =
        (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
      n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
      n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a },
      center = { ...a };
    const epsilon = 1e-8 / 8;
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('straw', seed),
        salt = seed ^ (2 * 0x39a7);
      let isolatedStem = false;
      for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++) {
          const angle = Math.PI * 2 * featureHash(x, y, salt ^ 0x18d3),
            nx = -Math.sin(angle),
            ny = Math.cos(angle),
            u = (x + 0.25 + 0.5 * featureHash(x, y, salt ^ 0x4f17)) / 8,
            v = (y + 0.25 + 0.5 * featureHash(x, y, salt ^ 0x73c9)) / 8,
            width = (0.035 + 0.03 * featureHash(x, y, salt ^ 0x519b)) / 8;
          sample(u, v, center);
          sample(u - 2 * width * nx, v - 2 * width * ny, a);
          sample(u + 2 * width * nx, v + 2 * width * ny, b);
          // Inspect exposed stems, not unrelated stems layered across a gap.
          if (a.occlusion < 0.65 && b.occlusion < 0.65) {
            isolatedStem = true;
            expect(center.height).toBeGreaterThan(a.height);
            expect(center.height).toBeGreaterThan(b.height);
          }
          for (const side of [-1, 1]) {
            const px = u + side * width * nx,
              py = v + side * width * ny;
            sample(px - epsilon * nx, py - epsilon * ny, a);
            sample(px + epsilon * nx, py + epsilon * ny, b);
            sample(px, py, center);
            for (const key of Object.keys(a) as (keyof SurfaceSample)[]) {
              expect(Math.abs(a[key] - b[key])).toBeLessThan(0.001);
              expect(
                Math.abs(a[key] - 2 * center[key] + b[key]) / epsilon,
              ).toBeLessThan(0.01);
            }
          }
        }
      expect(isolatedStem).toBe(true);
    }
  });

  it('OSB relief follows long aligned strands while chipboard has finer unoriented chips', () => {
    const surface: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const geometry = (kind: 'osb' | 'chipboard') => {
      let across = 0,
        along = 0,
        minimum = Infinity,
        maximum = -Infinity;
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        for (let y = 0; y < 64; y++)
          for (let x = 0; x < 64; x++) {
            const u = (x + 0.37) / 64,
              v = (y + 0.61) / 64;
            sample(u, v, surface);
            const center = surface.height;
            minimum = Math.min(minimum, center);
            maximum = Math.max(maximum, center);
            sample(u + 1 / 2048, v, surface);
            across += Math.abs(surface.height - center);
            sample(u, v + 1 / 2048, surface);
            along += Math.abs(surface.height - center);
          }
      }
      return {
        directionality: across / along,
        edgeDensity: (across + along) / (maximum - minimum),
      };
    };
    const strands = geometry('osb'),
      chips = geometry('chipboard');
    // Compare geometry independently of each preset's relief amplitude.
    expect(strands.directionality).toBeGreaterThan(1.5);
    expect(strands.directionality).toBeGreaterThan(chips.directionality);
    expect(chips.edgeDensity).toBeGreaterThan(strands.edgeDensity * 1.5);
  });

  it('acoustic foam has four sloping pyramid faces above recessed cell edges', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('acousticfoam', seed);
      for (const column of [0, 2, 3])
        for (const row of [0, 1, 3]) {
          sample((column + 0.5) / 4, (row + 0.5) / 4, a);
          const peak = a.height,
            peakOcclusion = a.occlusion;
          for (const axis of [0, 1])
            for (const side of [-1, 1]) {
              const heights: number[] = [];
              for (const distance of [0.1, 0.2, 0.3, 0.5]) {
                sample(
                  (column + 0.5 + (axis === 0 ? side * distance : 0)) / 4,
                  (row + 0.5 + (axis === 1 ? side * distance : 0)) / 4,
                  a,
                );
                heights.push(a.height);
              }
              expect(peak).toBeGreaterThan(heights[0]);
              expect(heights[0]).toBeGreaterThan(heights[1]);
              expect(heights[1]).toBeGreaterThan(heights[2]);
              // The middle of each face stays nearly planar, not sinusoidal.
              expect(
                Math.abs(heights[0] - 2 * heights[1] + heights[2]),
              ).toBeLessThan((heights[0] - heights[2]) * 0.15);
              expect(heights[2]).toBeGreaterThan(heights[3]);
              expect(a.occlusion).toBeLessThan(peakOcclusion);
            }
        }
    }
  });

  it('hexagonal cells meet continuously along all six shared edges, including wrapped diagonals', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a };
    const root3 = Math.sqrt(3);
    const epsilon = 1e-7;
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('hexagontiles', seed);
      for (const row of [0, 1, 5, 6])
        for (const column of [0, 2, 5]) {
          const cx = column + (row % 2) * 0.5,
            cy = (row * root3) / 2;
          sample(cx / 5, cy / (3 * root3), a);
          expect(a.mortar).toBe(0);
          expect(a.height).toBeGreaterThan(0);
          for (let side = 0; side < 6; side++) {
            const nx = Math.cos((side * Math.PI) / 3),
              ny = Math.sin((side * Math.PI) / 3);
            for (const along of [-0.2, 0, 0.2]) {
              const x = cx + 0.5 * nx - along * ny,
                y = cy + 0.5 * ny + along * nx;
              sample(
                (x - epsilon * nx) / 5,
                (y - epsilon * ny) / (3 * root3),
                a,
              );
              sample(
                (x + epsilon * nx) / 5,
                (y + epsilon * ny) / (3 * root3),
                b,
              );
              for (const key of Object.keys(a) as (keyof SurfaceSample)[])
                expect(a[key]).toBeCloseTo(b[key], 9);
              expect(a.mortar).toBe(1);
              expect(a.height).toBe(0);
              // Both sides have a flat bottom, so height derivatives cannot
              // pick up a tile-owned normal discontinuity at a shared edge.
              sample((x - 0.001 * nx) / 5, (y - 0.001 * ny) / (3 * root3), a);
              sample((x + 0.001 * nx) / 5, (y + 0.001 * ny) / (3 * root3), b);
              expect(a.height).toBe(0);
              expect(b.height).toBe(0);
              sample((x - 0.08 * nx) / 5, (y - 0.08 * ny) / (3 * root3), a);
              expect(a.mortar).toBe(0);
              expect(a.height).toBeGreaterThan(0);
            }
          }
        }
    }
  });

  it('parquet alternates three-slat baskets with common recessed dark joints', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const sample = createSurfaceSampler('parquet', 123);
    for (let slat = 0; slat < 3; slat++) {
      for (const [u, v] of [
        [0.125, slat / 12],
        [(1 + slat / 3) / 4, 0.125],
      ]) {
        sample(u, v, a);
        expect(a.height).toBe(0);
      }
      for (const [u, v] of [
        [0.125, (slat + 0.5) / 12],
        [(1 + (slat + 0.5) / 3) / 4, 0.125],
      ]) {
        sample(u, v, a);
        expect(a.height).toBeGreaterThan(0);
      }
    }
  });

  it('wafflecloth raises orthogonal woven rims above its square pockets', () => {
    const rim: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const pocket = { ...rim };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('wafflecloth', seed);
      for (const column of [0, 3, 7])
        for (const row of [0, 4, 7]) {
          sample((column + 0.5) / 8, (row + 0.5) / 8, pocket);
          for (const [x, y] of [
            [0, 0.5],
            [0.5, 0],
            [0, 0],
          ]) {
            sample((column + x) / 8, (row + y) / 8, rim);
            expect(rim.height).toBeGreaterThan(pocket.height);
            expect(rim.occlusion).toBeGreaterThan(pocket.occlusion);
          }
        }
    }
  });

  it('cableknit exchanges over-under strand height across successive braid crossings', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a },
      gap = { ...a },
      rib = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('cableknit', seed);
      for (const column of [0, 1, 3])
        for (const row of [0, 2, 3])
          for (const y of [0.125, 0.375, 0.625, 0.875]) {
            const sweep = 0.22 * Math.sin(Math.PI * 2 * y);
            sample((column + 0.5 + sweep) / 4, (row + y) / 4, a);
            sample((column + 0.5 - sweep) / 4, (row + y) / 4, b);
            expect(
              (a.height - b.height) * Math.cos(Math.PI * 2 * y),
            ).toBeGreaterThan(0);
            sample((column + 0.5) / 4, (row + y) / 4, gap);
            expect(a.height).toBeGreaterThan(gap.height);
            expect(b.height).toBeGreaterThan(gap.height);
            sample(column / 4, (row + y) / 4, rib);
            expect(rib.height).toBeGreaterThan(gap.height);
            expect(rib.height).toBeLessThan(Math.min(a.height, b.height));
          }
    }
  });

  it('quilting pads diamond centers above both recessed stitched diagonal seams', () => {
    const center: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const seam = { ...center },
      betweenStitches = { ...center };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('quilting', seed);
      for (const a of [0, 2, 5])
        for (const b of [-2, 0, 3]) {
          sample((a + b + 1) / 12, (a - b) / 12, center);
          for (const axis of [0, 1]) {
            const da = a + (axis === 0 ? 0 : 0.5),
              db = b + (axis === 0 ? 0.5 : 0);
            sample((da + db) / 12, (da - db) / 12, seam);
            expect(center.height).toBeGreaterThan(seam.height);
            expect(center.occlusion).toBeGreaterThan(seam.occlusion);
            const offset = 1 / 16;
            sample(
              (da + db + offset) / 12,
              (da - db + (axis === 0 ? -offset : offset)) / 12,
              betweenStitches,
            );
            expect(seam.height).toBeGreaterThan(betweenStitches.height);
          }
        }
    }
  });

  it.each(['wafflecloth', 'cableknit', 'quilting'] as const)(
    '%s keeps compact textile support slopes continuous',
    (kind) => {
      const a: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      const b = { ...a },
        center = { ...a };
      const cells = kind === 'wafflecloth' ? 8 : kind === 'cableknit' ? 4 : 6;
      const epsilon = 1e-8 / cells;
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        for (const t of [0.037, 0.125, 0.375, 0.68, 0.875])
          for (const side of [-1, 1]) {
            let u: number, v: number;
            if (kind === 'wafflecloth') {
              u = (side * Math.acos(0.35)) / (Math.PI * 2 * cells);
              v = t;
            } else if (kind === 'cableknit') {
              u =
                (0.5 + 0.22 * Math.sin(Math.PI * 2 * t) + side * 0.115) / cells;
              v = t / cells;
            } else {
              const seamEdge =
                (side * Math.acos(1 - 2 * 0.055)) / (Math.PI * 2);
              u = (seamEdge + t) / (2 * cells);
              v = (seamEdge - t) / (2 * cells);
            }
            const points =
              kind === 'cableknit'
                ? [
                    [u, v],
                    [1 / cells - u, v],
                    [side / (6 * cells), v],
                  ]
                : kind === 'wafflecloth'
                  ? [
                      [u, v],
                      [v, u],
                    ]
                  : [
                      [u, v],
                      [u, -v],
                      [
                        (side * Math.acos(0.2)) / (Math.PI * 2 * 8 * 2 * cells),
                        (-side * Math.acos(0.2)) /
                          (Math.PI * 2 * 8 * 2 * cells),
                      ],
                    ];
            for (const [px, py] of points)
              for (const [du, dv] of [
                [epsilon, 0],
                [0, epsilon],
              ]) {
                sample(px - du, py - dv, a);
                sample(px + du, py + dv, b);
                sample(px, py, center);
                for (const key of Object.keys(a) as (keyof SurfaceSample)[]) {
                  expect(Math.abs(a[key] - b[key])).toBeLessThan(0.001);
                  expect(
                    Math.abs(a[key] - 2 * center[key] + b[key]) / epsilon,
                  ).toBeLessThan(0.01);
                }
              }
          }
      }
    },
  );

  it('knit raises both arms of repeating V stitches above recessed loop gaps', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const gap = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('knit', seed);
      for (const column of [0, 3, 7])
        for (const row of [0, 4, 7]) {
          sample((column + 0.5) / 8, (row + 0.4) / 8, gap);
          for (const side of [-1, 1]) {
            sample((column + 0.5 + side * 0.22) / 8, (row + 0.4) / 8, a);
            expect(a.height).toBeGreaterThan(gap.height);
            expect(a.occlusion).toBeGreaterThan(gap.occlusion);
          }
          sample((column + 0.5) / 8, (row + 0.84) / 8, a);
          expect(a.height).toBeGreaterThan(gap.height);
        }
    }
  });

  it('knit yarn remains continuous across rounded ends, joins and finite support', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a };
    const epsilon = 1e-7;
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('knit', seed);
      for (const side of [-1, 1]) {
        const sx = side * 0.34,
          sy = -0.68;
        const length = Math.hypot(sx, sy);
        for (const t of [-0.13 / length, 0, 0.5, 1, 1 + 0.13 / length])
          for (const offset of [-0.13, 0, 0.13]) {
            const u = (0.5 + t * sx - (offset * sy) / length) / 8,
              v = (0.84 + t * sy + (offset * sx) / length) / 8;
            for (const [du, dv] of [
              [epsilon, 0],
              [0, epsilon],
            ]) {
              sample(u - du, v - dv, a);
              sample(u + du, v + dv, b);
              for (const key of Object.keys(a) as (keyof SurfaceSample)[])
                expect(Math.abs(a[key] - b[key])).toBeLessThan(0.001);
              const leftHeight = a.height,
                rightHeight = b.height;
              sample(u, v, a);
              expect(
                Math.abs(rightHeight - a.height - (a.height - leftHeight)) /
                  epsilon,
              ).toBeLessThan(0.001);
            }
          }
      }
    }
  });

  it('corduroy has parallel raised wales with recessed narrow valleys along their length', () => {
    const crest: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const valley = { ...crest };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('corduroy', seed);
      for (let wale = 0; wale < 12; wale++)
        for (const v of [0, 0.137, 0.43, 0.791]) {
          sample(wale / 12, v, crest);
          sample((wale + 0.5) / 12, v, valley);
          expect(crest.height).toBeGreaterThan(valley.height);
          expect(crest.occlusion).toBeGreaterThan(valley.occlusion);
          sample((wale + 0.3) / 12, v, crest);
          expect(crest.height).toBeGreaterThan(valley.height);
        }
    }
  });

  it('herringbone reverses its diagonal twill on alternating chevron halves', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('herringbone', seed);
      for (const half of [0, 1]) {
        let alongTwill = 0,
          acrossTwill = 0;
        const direction = half === 0 ? 1 : -1;
        for (const u of [0.06, 0.1, 0.14, 0.18])
          for (let row = 0; row < 48; row++) {
            const x = u + half * 0.25,
              y = row / 48;
            sample(x, y, a);
            sample(x + 1 / 32, y + direction / 32, b);
            alongTwill += (a.color - b.color) ** 2;
            sample(x + 1 / 32, y - direction / 32, b);
            acrossTwill += (a.color - b.color) ** 2;
          }
        expect(alongTwill).toBeLessThan(acrossTwill);
      }
    }
  });

  it('seersucker puckers vary along raised bands while adjacent bands remain flat-woven', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('seersucker', seed);
      for (let band = 0; band < 4; band++) {
        let raisedVariation = 0,
          flatVariation = 0;
        for (let row = 0; row < 96; row++) {
          const u = band / 4,
            v = row / 96;
          sample(u, v, a);
          sample(u + 1 / 8, v, b);
          expect(a.height).toBeGreaterThan(b.height);
          const raised = a.height,
            flat = b.height;
          // One warp/weft repeat preserves the fine weave but advances
          // the soft pucker; a uniform corduroy wale would not do this.
          sample(u, v + 1 / 24, a);
          sample(u + 1 / 8, v + 1 / 24, b);
          raisedVariation += (a.height - raised) ** 2;
          flatVariation += (b.height - flat) ** 2;
        }
        expect(raisedVariation).toBeGreaterThan(flatVariation);
      }
    }
  });

  it('shingle tabs are staggered, recessed at their lower cuts and shadowed at course laps', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('roofshingles', seed);
      for (let row = 0; row < 6; row++) {
        const cut = (row % 2) / 8;
        sample(cut, (row + 0.75) / 6, a);
        sample(cut + 0.125, (row + 0.75) / 6, b);
        expect(b.height).toBeGreaterThan(a.height);
        expect(b.occlusion).toBeGreaterThan(a.occlusion);
        sample(cut, (row + 0.25) / 6, b);
        expect(b.height).toBeGreaterThan(a.height);
        sample(cut + 0.125, row / 6, a);
        sample(cut + 0.125, (row + 0.5) / 6, b);
        expect(b.height).toBeGreaterThan(a.height);
        expect(b.occlusion).toBeGreaterThan(a.occlusion);
      }
    }
  });

  it.each(['roofshingles', 'rooftiles'] as const)(
    '%s fades owner variation without a normal crease at course, offset or crown seams',
    (kind) => {
      const a: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      const b = { ...a };
      const epsilon = 1e-7;
      const rows = kind === 'roofshingles' ? 6 : 5;
      const columns = kind === 'roofshingles' ? 8 : 12;
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        for (let row = 0; row <= rows; row++)
          for (let column = 0; column <= columns; column++)
            for (const offset of [0, 0.5, 0.75])
              for (const [du, dv] of [
                [epsilon, 0],
                [0, epsilon],
              ]) {
                const u = column / columns,
                  v = (row + offset) / rows;
                sample(u - du, v - dv, a);
                sample(u + du, v + dv, b);
                const leftHeight = a.height,
                  rightHeight = b.height;
                sample(u, v, a);
                expect(
                  Math.abs(rightHeight - 2 * a.height + leftHeight) / epsilon,
                ).toBeLessThan(0.001);
              }
      }
    },
  );

  it('roof tiles have rounded crowns above channels and transverse recessed course laps', () => {
    const crown: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const shoulder = { ...crown },
      channel = { ...crown },
      lap = { ...crown };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('rooftiles', seed);
      for (let row = 0; row < 5; row++)
        for (let column = 0; column < 6; column++) {
          const u = column / 6,
            v = (row + 0.5) / 5;
          sample(u, v, crown);
          sample(u + 1 / 24, v, shoulder);
          sample(u + 1 / 12, v, channel);
          sample(u, row / 5, lap);
          expect(crown.height).toBeGreaterThan(shoulder.height);
          expect(shoulder.height).toBeGreaterThan(channel.height);
          expect(crown.occlusion).toBeGreaterThan(channel.occlusion);
          expect(crown.height).toBeGreaterThan(lap.height);
          expect(crown.occlusion).toBeGreaterThan(lap.occlusion);
        }
    }
  });

  it('tortoiseshell scute shoulders have continuous slopes where polygon edges meet', () => {
    const featureHash = (x: number, y: number, seed: number): number => {
      let n =
        (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b)) >>> 0;
      n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
      n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
    };
    const center: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const left = { ...center },
      right = { ...center },
      halfLeft = { ...center },
      halfRight = { ...center };
    const epsilon = 1e-5 / 6;
    let corners = 0;
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('tortoiseshell', seed);
      for (const [x, y] of [
        [0, 0],
        [2, 3],
        [5, 5],
      ]) {
        const px = 0.22 + 0.56 * featureHash(x, y, seed ^ 0x35b7),
          py = 0.22 + 0.56 * featureHash(x, y, seed ^ 0x6e19);
        const planes: number[][] = [];
        for (let oy = -1; oy <= 1; oy++)
          for (let ox = -1; ox <= 1; ox++) {
            if (ox === 0 && oy === 0) continue;
            const wx = (x + ox + 6) % 6,
              wy = (y + oy + 6) % 6;
            const dx =
                ox + 0.22 + 0.56 * featureHash(wx, wy, seed ^ 0x35b7) - px,
              dy = oy + 0.22 + 0.56 * featureHash(wx, wy, seed ^ 0x6e19) - py;
            const distance = Math.hypot(dx, dy);
            planes.push([dx / distance, dy / distance, distance / 2]);
          }
        // Intersect equal-inset shoulders, not the already-flat dark seam.
        // A nearest-edge bevel has a normal discontinuity at these corners.
        for (let i = 0; i < planes.length; i++)
          for (let j = i + 1; j < planes.length; j++) {
            const a = planes[i]!,
              b = planes[j]!,
              determinant = a[0]! * b[1]! - a[1]! * b[0]!;
            if (Math.abs(determinant) < 0.01) continue;
            const dx =
                ((a[2]! - 0.06) * b[1]! - a[1]! * (b[2]! - 0.06)) / determinant,
              dy =
                (a[0]! * (b[2]! - 0.06) - (a[2]! - 0.06) * b[0]!) / determinant;
            if (
              planes.some((p) => p[2]! - dx * p[0]! - dy * p[1]! < 0.06 - 1e-10)
            )
              continue;
            corners++;
            const u = (x + px + dx) / 6,
              v = (y + py + dy) / 6;
            for (const [du, dv] of [
              [epsilon, 0],
              [0, epsilon],
            ]) {
              sample(u, v, center);
              sample(u - du!, v - dv!, left);
              sample(u + du!, v + dv!, right);
              sample(u - du! / 2, v - dv! / 2, halfLeft);
              sample(u + du! / 2, v + dv! / 2, halfRight);
              for (const key of Object.keys(center) as (keyof SurfaceSample)[])
                expect(
                  Math.abs(
                    4 * (halfLeft[key] + halfRight[key]) -
                      left[key] -
                      right[key] -
                      6 * center[key],
                  ) / epsilon,
                ).toBeLessThan(0.001);
            }
          }
      }
    }
    expect(corners).toBeGreaterThan(0);
  });
  it.each(['fishscales', 'feathers'] as const)(
    '%s has rounded crowns or raised shafts rather than flat repeated pigment',
    (kind) => {
      const crown: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      const shoulder = { ...crown };
      const columns = kind === 'fishscales' ? 10 : 8,
        rows = kind === 'fishscales' ? 10 : 4;
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        for (let row = 0; row < rows; row++)
          for (let column = 0; column < columns; column++) {
            const u = (column + (row % 2) * 0.5 + 0.5) / columns,
              v = (row + 0.5) / rows;
            sample(u, v, crown);
            for (const direction of [-1, 1]) {
              sample(
                u +
                  (direction * (kind === 'fishscales' ? 0.5 : 0.12)) / columns,
                v,
                shoulder,
              );
              expect(crown.height).toBeGreaterThan(shoulder.height);
            }
          }
      }
    },
  );
  it.each(['snakeskin', 'crocodile'] as const)(
    '%s has raised embossed centers above recessed gaps on both axes',
    (kind) => {
      const center: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      const gap = { ...center };
      const columns = kind === 'snakeskin' ? 10 : 4,
        rows = kind === 'snakeskin' ? 12 : 6;
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        for (let row = 0; row < rows; row++)
          for (let column = 0; column < columns; column++) {
            const stagger = kind === 'snakeskin' ? (row % 2) * 0.5 : 0;
            const u = (column + stagger + 0.5) / columns,
              v = (row + 0.5) / rows;
            sample(u, v, center);
            sample(u + 0.5 / columns, v, gap);
            expect(center.height).toBeGreaterThan(gap.height);
            expect(center.occlusion).toBeGreaterThan(gap.occlusion);
            // Pointed staggered scales extend into the next row, so their
            // transverse gap lies between offset owners rather than at a T joint.
            sample(
              u + (kind === 'snakeskin' ? 0.25 / columns : 0),
              v + 0.5 / rows,
              gap,
            );
            expect(center.height).toBeGreaterThan(gap.height);
            expect(center.occlusion).toBeGreaterThan(gap.occlusion);
          }
      }
    },
  );
  it.each(['snakeskin', 'crocodile'] as const)(
    '%s meets the recessed skin with continuous slopes at rounded compact support',
    (kind) => {
      const a: SurfaceSample = {
        color: 0,
        height: 0,
        roughness: 0,
        occlusion: 0,
        mortar: 0,
        metallic: 0,
      };
      const columns = kind === 'snakeskin' ? 10 : 4,
        rows = kind === 'snakeskin' ? 12 : 6;
      const epsilon = 1e-7;
      for (const seed of [1, 123, 0xffffffff]) {
        const sample = createSurfaceSampler(kind, seed);
        for (const row of [0, 1, 3]) {
          const u =
              (0.5 + (kind === 'snakeskin' ? (row % 2) * 0.5 : 0)) / columns,
            v = (row + 0.5) / rows;
          sample(u + 0.5 / columns, v, a);
          const floorOcclusion = a.occlusion;
          let inside = u,
            outside = u + 0.5 / columns;
          // Locate the actual seeded shoulder, not a pinned radius or relief.
          for (let step = 0; step < 48; step++) {
            const middle = (inside + outside) / 2;
            sample(middle, v, a);
            if (a.occlusion > floorOcclusion) inside = middle;
            else outside = middle;
          }
          const boundary = (inside + outside) / 2;
          for (const [du, dv] of [
            [epsilon, 0],
            [0, epsilon],
          ]) {
            sample(boundary - du, v - dv, a);
            const left = a.height;
            sample(boundary + du, v + dv, a);
            const right = a.height;
            sample(boundary, v, a);
            expect(
              Math.abs(right - 2 * a.height + left) / epsilon,
            ).toBeLessThan(0.001);
          }
        }
      }
    },
  );

  it('bubblewrap lifts sealed domes above the thin film web between them', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('bubblewrap', seed);
      for (const cx of [0.5, 1.5, 2.5, 3.5])
        for (const cy of [0.5, 1.5, 2.5, 3.5]) {
          sample(cx / 12, cy / 12, a);
          sample(cx / 12 + 0.5 / 12, cy / 12, b);
          expect(a.height).toBeGreaterThan(b.height);
          expect(a.occlusion).toBeGreaterThan(b.occlusion);
          expect(a.roughness).toBeLessThan(b.roughness);
          expect(a.color).toBeGreaterThan(b.color);
        }
    }
  });

  it('sequin raises staggered discs above their stitched dimples and bare cloth', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('sequin', seed);
      for (const row of [0, 1, 2, 3]) {
        const stagger = 0.5 * (row & 1);
        for (const col of [0, 1, 2, 3]) {
          const u = (col + 0.5 + stagger) / 10,
            v = (row + 0.5) / 10;
          sample(u + 0.02, v, a);
          const crown = { ...a };
          sample(u, v, b);
          expect(crown.height).toBeGreaterThan(b.height);
          expect(crown.occlusion).toBeGreaterThan(b.occlusion);
          sample(u + 0.05, v, b);
          expect(crown.height).toBeGreaterThan(b.height);
          expect(crown.occlusion).toBeGreaterThan(b.occlusion);
        }
      }
      // Odd rows sit half a pitch over, so a shared column lands on a
      // dimpled hub there but on bare cloth in the even row above.
      for (const col of [0, 1, 2, 3]) {
        sample((col + 1) / 10, 0.5 / 10, a);
        sample((col + 1) / 10, 1.5 / 10, b);
        expect(b.occlusion).toBeGreaterThan(a.occlusion);
      }
    }
  });

  it('pennyround glazes round tiles above recessed grainy grout', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('pennyround', seed);
      for (const row of [0, 1, 2, 3]) {
        const stagger = 0.5 * (row & 1);
        for (const col of [0, 1, 2, 3]) {
          const u = (col + 0.5 + stagger) / 8,
            v = (row + 0.5) / 8;
          sample(u, v, a);
          sample(u + 0.5 / 8, v, b);
          expect(a.height).toBeGreaterThan(b.height);
          expect(a.occlusion).toBeGreaterThan(b.occlusion);
          expect(a.roughness).toBeLessThan(b.roughness);
          expect(a.color).toBeGreaterThan(b.color);
        }
      }
    }
  });

  it('volleyball keeps curved panel seams and dimples below the panel skin', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('volleyball', seed);
      for (const v of [0.1, 0.3, 0.55, 0.8]) {
        const shift = 0.18 * Math.sin(Math.PI * 2 * v);
        const panel = (0.5 - shift) / 3,
          seam = (1 - shift) / 3;
        sample(panel, v, a);
        sample(seam, v, b);
        expect(a.height).toBeGreaterThan(b.height);
        expect(a.occlusion).toBeGreaterThan(b.occlusion);
      }
      sample(1 / 24, 1 / 24, a);
      sample(0.5 / 24, 0.5 / 24, b);
      expect(a.height).toBeGreaterThan(b.height);
      expect(a.occlusion).toBeGreaterThan(b.occlusion);
    }
  });

  it('bowlingball sinks three recessed finger holes into the pearl swirl', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('bowlingball', seed);
      for (const [hu, hv] of [
        [0.5, 0.36],
        [0.38, 0.52],
        [0.62, 0.52],
      ] as const) {
        sample(hu, hv, a);
        sample(hu + 0.09, hv, b);
        expect(b.height).toBeGreaterThan(a.height);
        expect(b.occlusion).toBeGreaterThan(a.occlusion);
        expect(b.roughness).toBeLessThan(a.roughness);
      }
    }
  });

  it('rugbyball raises lacing stitches above the band and seam grooves', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a },
      c = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('rugbyball', seed);
      for (const i of [0, 1, 2, 3]) {
        sample((i + 0.5) / 12, 0.25, a);
        sample(i / 12, 0.25, b);
        sample((i + 0.5) / 12, 0, c);
        expect(a.height).toBeGreaterThan(b.height);
        expect(b.height).toBeGreaterThan(c.height);
        expect(a.occlusion).toBeGreaterThan(c.occlusion);
      }
    }
  });

  it('wafflecone crests diagonal lattice ridges above toasted pockets', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('wafflecone', seed);
      for (const k of [1, 2, 3]) {
        sample((k + 0.25) / 8, (k + 0.25) / 8, a);
        sample(k / 8, k / 8, b);
        expect(a.height).toBeGreaterThan(b.height);
        expect(a.occlusion).toBeGreaterThan(b.occlusion);
      }
    }
  });

  it('donutglaze sinks cake pores below the surrounding crumb everywhere', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('donutglaze', seed);
      let lower = 0,
        occluded = 0;
      for (const i of [0, 1, 2, 3])
        for (const j of [0, 1, 2, 3]) {
          sample((i + 0.5) / 14, (j + 0.5) / 14, a);
          sample((i + 1) / 14, (j + 0.5) / 14, b);
          if (a.height < b.height) lower++;
          if (a.occlusion < b.occlusion) occluded++;
        }
      expect(lower).toBeGreaterThanOrEqual(10);
      expect(occluded).toBeGreaterThanOrEqual(10);
    }
  });

  it('brownie lifts walnut chunks above the cracked fudge top', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('brownie', seed);
      for (const [nu, nv] of [
        [0.22, 0.3],
        [0.62, 0.58],
        [0.42, 0.82],
      ] as const) {
        sample(nu, nv, a);
        sample(nu + 0.09, nv, b);
        expect(a.height).toBeGreaterThan(b.height);
        expect(a.roughness).toBeLessThan(b.roughness);
      }
      let lo = 1,
        hi = 0;
      for (let i = 0; i <= 16; i++)
        for (let j = 0; j <= 16; j++) {
          sample(i / 16, j / 16, a);
          if (a.height < lo) lo = a.height;
          if (a.height > hi) hi = a.height;
        }
      expect(hi).toBeGreaterThan(2 * lo);
    }
  });

  it('soapbar steps from embossed oval over the bar shoulder down to the gaps', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a },
      c = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('soapbar', seed);
      sample(0.25, 0.25, a);
      sample(0.36, 0.25, b);
      sample(0.5, 0.25, c);
      expect(a.height).toBeGreaterThan(b.height);
      expect(b.height).toBeGreaterThan(c.height);
      expect(b.occlusion).toBeGreaterThan(c.occlusion);
      expect(a.occlusion).toBeGreaterThanOrEqual(b.occlusion);
    }
  });

  it('loofah crests woven strands over the open network gaps', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('loofah', seed);
      sample(0.25, 0, a);
      sample(1 / 3, 0, b);
      expect(a.height).toBeGreaterThan(b.height);
      expect(a.occlusion).toBeGreaterThan(b.occlusion);
    }
  });

  it('scrubbypad sinks hexagonal cut-outs below the abrasive pad', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('scrubbypad', seed);
      sample(0.5 / 8, 0.5 / 8, a);
      sample(0.5 / 8, 0.92 / 8, b);
      expect(b.height).toBeGreaterThan(a.height);
      expect(b.occlusion).toBeGreaterThan(a.occlusion);
      expect(b.roughness).toBeLessThan(a.roughness);
    }
  });
  it('orangeflesh recesses pith dividers below juice segments and background', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a },
      c = { ...a };
    const thetaFlesh = Math.PI / 10;
    const fleshU = 0.5 + 0.2 * Math.cos(thetaFlesh),
      fleshV = 0.5 + 0.2 * Math.sin(thetaFlesh);
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('orangeflesh', seed);
      sample(0.7, 0.5, a);
      sample(fleshU, fleshV, b);
      sample(0.02, 0.02, c);
      expect(b.height).toBeGreaterThan(a.height);
      expect(b.occlusion).toBeGreaterThan(a.occlusion);
      expect(a.height).toBeGreaterThan(c.height);
    }
  });

  it('kiwiflesh raises seed bumps and pale core above the surrounding flesh and background', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a },
      c = { ...a };
    const thetaGap = Math.PI / 16;
    const gapU = 0.5 + 0.2 * Math.cos(thetaGap),
      gapV = 0.5 + 0.2 * Math.sin(thetaGap);
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('kiwiflesh', seed);
      sample(0.7, 0.5, a);
      sample(gapU, gapV, b);
      sample(0.02, 0.02, c);
      expect(a.height).toBeGreaterThan(b.height);
      expect(a.occlusion).toBeLessThan(b.occlusion);
      expect(b.height).toBeGreaterThan(c.height);
    }
  });

  it('avocadoflesh sinks an elliptical central pit below smooth flesh and background', () => {
    const a: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    const b = { ...a },
      c = { ...a };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('avocadoflesh', seed);
      sample(0.5, 0.5, a);
      sample(0.75, 0.5, b);
      sample(0.02, 0.02, c);
      expect(b.height).toBeGreaterThan(a.height);
      expect(b.occlusion).toBeGreaterThan(a.occlusion);
      expect(b.height).toBeGreaterThan(c.height);
    }
  });
  it('turquoise veins recess below stone and raise roughness', () => {
    const s: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('turquoise', seed);
      let minColor = 1,
        maxColor = 0,
        minR = 1,
        maxR = 0,
        minH = 1,
        maxH = 0;
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) {
          sample(x / 16, y / 16, s);
          if (s.color < minColor) minColor = s.color;
          if (s.color > maxColor) maxColor = s.color;
          if (s.roughness < minR) minR = s.roughness;
          if (s.roughness > maxR) maxR = s.roughness;
          if (s.height < minH) minH = s.height;
          if (s.height > maxH) maxH = s.height;
        }
      expect(maxColor - minColor).toBeGreaterThan(0.35);
      expect(maxR - minR).toBeGreaterThan(0.12);
      expect(maxH - minH).toBeGreaterThan(0.00005);
    }
  });

  it('rhodonite manganese dendrites darken and recess below rose stone', () => {
    const s: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('rhodonite', seed);
      let minColor = 1,
        maxColor = 0,
        minR = 1,
        maxR = 0,
        minH = 1,
        maxH = 0;
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) {
          sample(x / 16, y / 16, s);
          if (s.color < minColor) minColor = s.color;
          if (s.color > maxColor) maxColor = s.color;
          if (s.roughness < minR) minR = s.roughness;
          if (s.roughness > maxR) maxR = s.roughness;
          if (s.height < minH) minH = s.height;
          if (s.height > maxH) maxH = s.height;
        }
      expect(maxColor - minColor).toBeGreaterThan(0.35);
      expect(maxR - minR).toBeGreaterThan(0.1);
      expect(maxH - minH).toBeGreaterThan(0.00005);
    }
  });

  it('tigereye chatoyant bands modulate color, height and roughness', () => {
    const s: SurfaceSample = {
      color: 0,
      height: 0,
      roughness: 0,
      occlusion: 0,
      mortar: 0,
      metallic: 0,
    };
    for (const seed of [1, 123, 0xffffffff]) {
      const sample = createSurfaceSampler('tigereye', seed);
      let minColor = 1,
        maxColor = 0,
        minH = 1,
        maxH = 0;
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) {
          sample(x / 16, y / 16, s);
          if (s.color < minColor) minColor = s.color;
          if (s.color > maxColor) maxColor = s.color;
          if (s.height < minH) minH = s.height;
          if (s.height > maxH) maxH = s.height;
        }
      expect(maxColor - minColor).toBeGreaterThan(0.3);
      expect(maxH - minH).toBeGreaterThan(0.00004);
    }
  });

  it('every preset produces a different base color', () => {
    const signatures = kinds.map((kind) =>
      Array.from(generateProceduralMaps(kind, 32, 1).baseColor).join(','),
    );
    expect(new Set(signatures).size).toBe(kinds.length);
  });

  it('keeps default contrast and applies art controls only when requested', () => {
    const plain = generateProceduralMaps('wood', 32, 1);
    expect(generateProceduralMaps('wood', 32, 1, { contrast: 1 })).toEqual(
      plain,
    );
    expect(
      generateProceduralMaps('wood', 32, 1, { contrast: 1.8 }).baseColor,
    ).not.toEqual(plain.baseColor);
    expect(
      generateProceduralMaps('wood', 32, 1, { roughnessBias: 0.2 })
        .metallicRoughness,
    ).not.toEqual(plain.metallicRoughness);
    expect(proceduralRepeats('brick', 1.2)).toBeCloseTo(5);
    expect(() => proceduralRepeats('brick', 0)).toThrow(RangeError);
  });

  it('wraps normal neighbors and uses negative slopes along both image UV axes', () => {
    const size = 32,
      heights = new Float32Array(size * size),
      normals = new Uint8ClampedArray(size * size * 4);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++)
        heights[y * size + x] =
          0.02 *
          (Math.sin((x * Math.PI * 2) / size) +
            Math.sin((y * Math.PI * 2) / size));
    writeNormals(heights, size, normals);
    for (const [x, y] of [
      [0, 0],
      [31, 31],
      [8, 16],
      [16, 8],
    ]) {
      const slope = 0.02 * size * Math.sin((2 * Math.PI) / size);
      const dx = slope * Math.cos((x * 2 * Math.PI) / size);
      const dy = slope * Math.cos((y * 2 * Math.PI) / size);
      const length = Math.hypot(dx, dy, 1),
        p = (y * size + x) * 4;
      expect(normals[p]).toBe(Math.round((0.5 - dx / length / 2) * 255));
      expect(normals[p + 1]).toBe(Math.round((0.5 - dy / length / 2) * 255));
    }
    expect(normals[0]).toBeLessThan(128);
    expect(normals[1]).toBeLessThan(128);
  });
});

describe('procedural preset acquisition and ownership', () => {
  it('rejects invalid kinds and dimensions/seeds before bitmap acquisition', async () => {
    await expect(
      ProceduralMaterial.create('glass' as ProceduralMaterialKind),
    ).rejects.toThrow(RangeError);
    for (const size of [
      0,
      31,
      1025,
      32.5,
      Infinity,
      NaN,
      Number.MAX_SAFE_INTEGER,
    ])
      await expect(ProceduralMaterial.create('wood', { size })).rejects.toThrow(
        RangeError,
      );
    for (const seed of [-1, 0x100000000, 0.5, Infinity, NaN])
      await expect(ProceduralMaterial.create('wood', { seed })).rejects.toThrow(
        RangeError,
      );
    await expect(
      ProceduralMaterial.create('wood', null as never),
    ).rejects.toThrow(TypeError);
    expect(decoded).toHaveLength(0);
  });

  it('closes every already acquired bitmap when a late decode fails', async () => {
    failAt = 3;
    await expect(
      ProceduralMaterial.create('brick', { size: 32 }),
    ).rejects.toThrow('Unable to decode');
    expect(decoded).toHaveLength(3);
    for (const bitmap of decoded) expect(bitmap.close).toHaveBeenCalledTimes(1);
  });

  it('also closes the late bitmap rejected by Texture resource limits', async () => {
    oversizedAt = 2;
    await expect(
      ProceduralMaterial.create('stone', { size: 32 }),
    ).rejects.toThrow('resource budget');
    expect(decoded).toHaveLength(3);
    for (const bitmap of decoded) expect(bitmap.close).toHaveBeenCalledTimes(1);
  });

  it('releases initial maps if initial material construction fails', async () => {
    vi.spyOn(ProceduralMaterial.prototype, 'createMaterial').mockImplementation(
      function (this: ProceduralMaterial) {
        return new PBRMaterial({
          texture: this.textures.baseColor,
          roughness: -1,
        });
      },
    );
    await expect(
      ProceduralMaterial.create('wood', { size: 32 }),
    ).rejects.toThrow();
    expect(decoded).toHaveLength(4);
    for (const bitmap of decoded) expect(bitmap.close).toHaveBeenCalledTimes(1);
  });

  it.each([
    'metal',
    'copperpatina',
    'chippedenamel',
    'gabion',
    'standingseam',
    'damascus',
    'castiron',
    'pressedtin',
    'louveredmetal',
    'crowncaps',
    'rebar',
    'guilloche',
    'splitlockwashers',
    'hexnuts',
    'basketball',
    'tennisball',
    'golfball',
    'boardformedconcrete',
    'ribbedconcrete',
    'splitfaceblock',
  ] as const)(
    'borrows %s maps across independent materials and never takes ownership of overrides',
    async (kind) => {
      const preset = await ProceduralMaterial.create(kind, { size: 32 });
      expect(preset.material.metallic).toBe(
        kind === 'metal' ||
          kind === 'copperpatina' ||
          kind === 'chippedenamel' ||
          kind === 'gabion' ||
          kind === 'standingseam' ||
          kind === 'damascus' ||
          kind === 'castiron' ||
          kind === 'pressedtin' ||
          kind === 'louveredmetal' ||
          kind === 'crowncaps' ||
          kind === 'rebar' ||
          kind === 'guilloche' ||
          kind === 'splitlockwashers' ||
          kind === 'hexnuts'
          ? 1
          : 0,
      );
      expect(preset.material.alphaMode).toBe('OPAQUE');
      const external = new Texture({
        width: 1,
        height: 1,
        close: vi.fn(),
      } as unknown as ImageBitmap);
      const material = preset.createMaterial({
        texture: external,
        roughness: 0.4,
        metallic: 0.8,
      });
      expect(material).not.toBe(preset.material);
      expect(material.texture).toBe(external);
      expect(material.normalTexture).toBe(preset.textures.normal);
      expect(material.roughness).toBe(0.4);
      expect(preset.material.roughness).toBe(1);
      const mesh = new Mesh({ geometry: Geometry.cube(), material });
      mesh.destroy();
      expect(preset.destroyed).toBe(false);
      expect(preset.textures.normal.destroyed).toBe(false);
      expect(() => preset.createMaterial({ roughness: -1 })).toThrow(
        RangeError,
      );
      expect(
        decoded.every((bitmap) => bitmap.close.mock.calls.length === 0),
      ).toBe(true);
      preset.destroy();
      preset.destroy();
      expect(preset.destroyed).toBe(true);
      expect(
        Object.values(preset.textures).every((texture) => texture.destroyed),
      ).toBe(true);
      for (const bitmap of decoded)
        expect(bitmap.close).toHaveBeenCalledTimes(1);
      expect(external.destroyed).toBe(false);
      expect(() => preset.createMaterial()).toThrow('destroyed');
      external.destroy();
    },
  );
});

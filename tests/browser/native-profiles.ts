import {
  createRenderer,
  Geometry,
  Matrix4,
  Mesh,
  MorphTargets,
  MorphWeights,
  NativeTexture2D,
  Object3D,
  OrthographicCamera,
  PBRMaterial,
  Scene,
  SkinnedMesh,
  Sprite,
  Texture,
  TextureMaterial,
} from '../../src/index.js';
import type {
  FrameEffects,
  NativeTextureFormat,
  Renderer,
  RendererPreference,
  RenderStats,
} from '../../src/index.js';
import { errorDetail, frameProofs, type FrameProofs } from './frame-proof.js';

interface Scenario {
  name: string;
  assertions: string[];
  metrics: Record<string, number | string>;
  stats?: RenderStats;
  png?: string;
  skip?: string;
}
interface NativeReport {
  renderer: string;
  scenarios: Scenario[];
  supportedTextureFormats?: readonly string[];
  graphicsEvents?: string[];
  error?: string;
}
interface ImageProof {
  bytes: Uint8ClampedArray;
  width: number;
  height: number;
}
interface NativeFixture {
  report: NativeReport;
  run(): Promise<NativeReport>;
  destroy(): void;
}
declare global {
  interface Window {
    __xyzP42Native: NativeFixture;
  }
}

const preference = (new URLSearchParams(location.search).get('renderer') ??
  'webgl2') as RendererPreference;
const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const output = document.querySelector<HTMLPreElement>('#report')!;
const report: NativeReport = { renderer: preference, scenarios: [] };
let scenario: Scenario;
let renderer: Renderer | undefined;
let capturedFrames: FrameProofs;
let runtimeError: Error | undefined;
let running: Promise<NativeReport> | undefined;
let destroyed = false;
let losses = 0;
let recoveries = 0;
const textures: Texture[] = [];
const scenes: Scene[] = [];
const compressedReplay: Scene[] = [];

function publish(state: string): void {
  output.textContent = JSON.stringify(report);
  output.dataset.state = state;
}
function begin(name: string): void {
  scenario = { name, assertions: [], metrics: {} };
  report.scenarios.push(scenario);
  publish('running');
}
function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(`${scenario.name}: ${message}`);
  scenario.assertions.push(message);
}
function skip(reason: string): void {
  scenario.skip = reason;
}
function own<T extends Texture>(texture: T): T {
  textures.push(texture);
  return texture;
}
function makeScene(): Scene {
  const scene = new Scene();
  const camera = new OrthographicCamera();
  camera.height = 4;
  scene.camera3D = camera;
  scene.ambientLight = 0.25;
  scene.directionalLight.direction.set(0.6, 0.5, 1).normalize();
  scene.directionalLight.intensity = 0.75;
  scenes.push(scene);
  return scene;
}
async function ordinaryTexture(color: string): Promise<Texture> {
  const source = document.createElement('canvas');
  source.width = source.height = 4;
  const context = source.getContext('2d')!;
  context.fillStyle = color;
  context.fillRect(0, 0, 4, 4);
  return own(await Texture.fromImage(source));
}
function quad(size = 1, z = 0): Geometry {
  return new Geometry({
    positions: [-size, -size, z, size, -size, z, size, size, z, -size, size, z],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
    uvs: [0, 0, 1, 0, 1, 1, 0, 1],
    indices: [0, 1, 2, 0, 2, 3],
  });
}
async function draw(scene: Scene, effects?: FrameEffects): Promise<ImageProof> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  if (runtimeError) throw runtimeError;
  renderer!.beginFrame();
  renderer!.render(scene, canvas.width, canvas.height, effects);
  const proof = capturedFrames.next();
  try {
    renderer!.endFrame();
  } catch {
    // The hook rejects this same proof with the submission error.
  }
  const image = await proof;
  scenario.stats = image.stats;
  scenario.png = image.png;
  return image;
}
function difference(
  a: ImageProof,
  b: ImageProof,
): {
  mean: number;
  changed: number;
  bad: number;
} {
  if (a.width !== b.width || a.height !== b.height)
    throw new Error('Oracle image dimensions differ.');
  let total = 0;
  let changed = 0;
  let bad = 0;
  for (let i = 0; i < a.bytes.length; i += 4) {
    let maximum = 0;
    for (let c = 0; c < 3; c++) {
      const delta = Math.abs(a.bytes[i + c] - b.bytes[i + c]);
      total += delta;
      maximum = Math.max(maximum, delta);
    }
    if (maximum > 2) changed++;
    if (maximum > 8) bad++;
  }
  return { mean: total / (a.width * a.height * 3), changed, bad };
}
function equivalent(a: ImageProof, b: ImageProof, label: string): void {
  const result = difference(a, b);
  scenario.metrics[`${label}:meanRGBError`] = result.mean;
  scenario.metrics[`${label}:badPixels`] = result.bad;
  check(
    result.mean <= 0.6 && result.bad <= a.width * a.height * 0.006,
    `${label}: exact CPU reference matches native pixels (mean ${result.mean.toFixed(4)}, >8 error pixels ${result.bad})`,
  );
}
function center(image: ImageProof): number[] {
  const index =
    (Math.floor(image.height / 2) * image.width + Math.floor(image.width / 2)) *
    4;
  return Array.from(image.bytes.slice(index, index + 4));
}
function dominant(image: ImageProof, component: number, label: string): void {
  const value = center(image);
  check(
    value[3] === 255 &&
      value[component] > 150 &&
      value.filter((_, i) => i < 3 && i !== component).every((v) => v < 35),
    `${label}: center RGBA ${value.join(',')}`,
  );
}
async function rejects(
  action: () => unknown | Promise<unknown>,
  label: string,
): Promise<void> {
  let failure: unknown;
  try {
    await action();
  } catch (error) {
    failure = error;
  }
  check(failure instanceof Error, `${label}: explicit Error rejection`);
  scenario.metrics[`${label}:error`] = (failure as Error).message;
}

const basePositions = new Float32Array([
  -0.7, -0.55, 0, 0.65, -0.5, 0, 0.55, 0.65, 0, -0.55, 0.5, 0,
]);
const baseNormals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
const morphPositions = new Float32Array([
  -0.12, 0.02, 0.08, 0.18, 0.1, 0, 0.1, 0.24, 0.1, -0.08, 0.15, 0,
]);
const morphNormals = new Float32Array([
  0.2, 0.1, 0, -0.15, 0.2, 0, 0.25, -0.1, 0, -0.1, -0.2, 0,
]);
const influences = [
  [0.5, 0.25, 0.125, 0.125],
  [0.125, 0.5, 0.25, 0.125],
  [0.125, 0.125, 0.5, 0.25],
  [0.125, 0.125, 0.125, 0.625],
];
const indices = [0, 1, 2, 0, 2, 3];
const uvs = [0, 0, 1, 0, 1, 1, 0, 1];
interface SkinRig {
  scene: Scene;
  mesh: SkinnedMesh;
  joints: Object3D[];
  weights: MorphWeights;
}
function rig(material: TextureMaterial): SkinRig {
  const scene = makeScene();
  const joints = Array.from({ length: 4 }, () => new Object3D());
  for (const joint of joints) scene.add(joint);
  const weights = new MorphWeights([0]);
  const jointIndices: number[] = [];
  const skinWeights: number[] = [];
  for (const weights of influences) {
    jointIndices.push(0, 1, 2, 3);
    skinWeights.push(...weights);
  }
  const mesh = new SkinnedMesh({
    geometry: new Geometry({
      positions: basePositions,
      normals: baseNormals,
      uvs,
      indices,
    }),
    material,
    joints,
    inverseBindMatrices: joints.map(() => new Matrix4()),
    jointIndices,
    weights: skinWeights,
    morph: new MorphTargets({
      positions: [morphPositions],
      normals: [morphNormals],
      weights,
    }),
  });
  scene.add(mesh);
  return { scene, mesh, joints, weights };
}
function pose(r: SkinRig, x: number, phase: number): void {
  r.joints[0].position.set(x - 0.08, 0.04, 0.5);
  r.joints[1].position.set(x + 0.15, -0.04, 0.65);
  r.joints[0].rotation.setFromEuler(0.12, 0.18, phase);
  r.joints[1].rotation.setFromEuler(-0.16, -0.2, -phase * 0.7);
  r.joints[0].scale.set(1.15, 0.8, 1.05);
  r.joints[1].scale.set(0.75, 1.2, 0.95);
  r.joints[2].position.set(x - 0.1, -0.08, 0.55);
  r.joints[3].position.set(x + 0.05, 0.12, 0.6);
  r.joints[2].rotation.setFromEuler(0.22, -0.08, phase * 0.3);
  r.joints[3].rotation.setFromEuler(-0.1, 0.15, -phase * 0.4);
  r.joints[2].scale.set(1.05, 0.95, 0.8);
  r.joints[3].scale.set(-0.9, 1.1, 1.2);
}
// Independent explicit LBS oracle: never reads mesh.geometry, jointPalette or the
// engine's CPU skinning implementation. Mesh-local and inverse-bind matrices are
// identity in this rig; all four influence slots are supplied by the public API.
function cpuGeometry(r: SkinRig): Geometry {
  const matrices = r.joints.map((joint) => joint.updateWorldMatrix().elements);
  const positions: number[] = [];
  const normals: number[] = [];
  const morph = r.weights.get(0);
  for (let v = 0; v < 4; v++) {
    const e = new Float32Array(16);
    for (let i = 0; i < 16; i++) {
      let value = 0;
      for (let joint = 0; joint < 4; joint++)
        value += matrices[joint][i] * Math.fround(influences[v][joint]);
      e[i] = value;
    }
    const offset = v * 3;
    const p = Array.from({ length: 3 }, (_, c) =>
      Math.fround(
        basePositions[offset + c] + morph * morphPositions[offset + c],
      ),
    );
    for (let row = 0; row < 3; row++)
      positions.push(
        e[row] * p[0] + e[4 + row] * p[1] + e[8 + row] * p[2] + e[12 + row],
      );
    const n = Array.from({ length: 3 }, (_, c) =>
      Math.fround(baseNormals[offset + c] + morph * morphNormals[offset + c]),
    );
    const length = Math.hypot(...n);
    for (let c = 0; c < 3; c++) n[c] = Math.fround(n[c] / length);
    // Cross products of the blend's columns form its cofactor matrix.
    const cofactor = [
      e[5] * e[10] - e[6] * e[9],
      e[6] * e[8] - e[4] * e[10],
      e[4] * e[9] - e[5] * e[8],
      e[9] * e[2] - e[10] * e[1],
      e[10] * e[0] - e[8] * e[2],
      e[8] * e[1] - e[9] * e[0],
      e[1] * e[6] - e[2] * e[5],
      e[2] * e[4] - e[0] * e[6],
      e[0] * e[5] - e[1] * e[4],
    ];
    const determinant =
      e[0] * cofactor[0] + e[1] * cofactor[1] + e[2] * cofactor[2];
    const normal = Array.from(
      { length: 3 },
      (_, row) =>
        (determinant < 0 ? -1 : 1) *
        (cofactor[row] * n[0] +
          cofactor[3 + row] * n[1] +
          cofactor[6 + row] * n[2]),
    );
    const normalLength = Math.hypot(...normal);
    normals.push(...normal.map((value) => value / normalLength));
  }
  return new Geometry({ positions, normals, uvs, indices });
}
function reference(r: SkinRig, material: TextureMaterial): Scene {
  const scene = makeScene();
  scene.add(new Mesh({ geometry: cpuGeometry(r), material }));
  return scene;
}
function enableShadows(scene: Scene, receiverMaterial: TextureMaterial): void {
  scene.shadows.enabled = true;
  scene.shadows.mapSize = 512;
  scene.shadows.extent = 6;
  scene.shadows.near = 0.1;
  scene.shadows.far = 40;
  scene.shadows.bias = 0.001;
  scene.add(
    new Mesh({
      geometry: quad(1.9, -0.55),
      material: receiverMaterial,
      castShadow: false,
    }),
  );
}
async function skinScenarios(white: Texture): Promise<void> {
  const material = new TextureMaterial({
    texture: white,
    color: [0.35, 0.8, 0.25],
  });
  const receiver = new TextureMaterial({ texture: white });
  const r = rig(material);
  begin('gpu-skin-exact-cpu-oracle');
  pose(r, 0, 0.28);
  const empty = await draw(makeScene());
  const native = await draw(r.scene);
  check(
    difference(native, empty).changed > 1500,
    'Native skin produces a visible asymmetric lit surface',
  );
  equivalent(
    native,
    await draw(reference(r, material)),
    'four-joint-mirrored-nonuniform-normal',
  );
  const exact = cpuGeometry(r);
  const renderSource = r.mesh.renderGeometry.vertices.slice();
  const renderVersion = r.mesh.renderGeometry.version;
  const paletteVersion = r.mesh.paletteVersion;
  r.mesh.updateSkin();
  let error = 0;
  for (let i = 0; i < exact.vertices.length; i++)
    error = Math.max(
      error,
      Math.abs(exact.vertices[i] - r.mesh.geometry.vertices[i]),
    );
  scenario.metrics.exactCPUQueryMaximumError = error;
  check(
    error < 0.00001,
    `Public exact CPU skin query matches independent LBS oracle: ${error}`,
  );
  check(
    r.mesh.renderGeometry.version === renderVersion &&
      r.mesh.renderGeometry.vertices.every(
        (value, i) => value === renderSource[i],
      ),
    'Exact CPU query does not mutate or invalidate native render geometry',
  );
  r.mesh.updateRenderDeformation();
  check(
    r.mesh.paletteVersion === paletteVersion,
    'Unchanged pose does not republish the joint palette',
  );

  begin('animated-offscreen-to-visible-culling');
  pose(r, 8, 0.4);
  const outside = await draw(r.scene);
  check(
    r.mesh.paletteVersion > paletteVersion,
    'Joint animation republishes the changed palette while offscreen',
  );
  equivalent(outside, empty, 'offscreen-background');
  check(
    renderer!.stats.culled >= 1 && renderer!.stats.drawCalls === 0,
    'Animated offscreen skin is actually culled before drawing',
  );
  for (const [x, phase] of [
    [0.25, -0.3],
    [-0.2, 0.35],
  ]) {
    pose(r, x, phase);
    const visible = await draw(r.scene);
    check(
      difference(visible, empty).changed > 1500,
      `Pose x=${x} returns to the visible frustum`,
    );
    check(
      renderer!.stats.drawCalls === 1 && renderer!.stats.culled === 0,
      `Pose x=${x} refreshes animated bounds rather than retaining offscreen bounds`,
    );
    equivalent(visible, await draw(reference(r, material)), `animated-${x}`);
  }

  begin('morph-before-gpu-skin');
  pose(r, 0, 0.22);
  r.weights.set(0, 0);
  const unmorphed = await draw(r.scene);
  r.weights.set(0, 0.8);
  const morphed = await draw(r.scene);
  check(
    difference(morphed, unmorphed).changed > 300,
    'Morph position and normal deltas materially change the skinned image',
  );
  equivalent(morphed, await draw(reference(r, material)), 'morph-then-skin');

  begin('gpu-skin-shadow-oracle');
  const casterOnly = await draw(r.scene);
  enableShadows(r.scene, receiver);
  const shadowed = await draw(r.scene);
  check(
    renderer!.stats.shadowDrawCalls > 0,
    'Real directional shadow pass submits the skinned caster',
  );
  const cpu = reference(r, material);
  enableShadows(cpu, receiver);
  equivalent(shadowed, await draw(cpu), 'deformed-caster-and-shadow');
  r.scene.shadows.enabled = false;
  const unshadowed = await draw(r.scene);
  let shadowPixels = 0;
  for (let i = 0; i < shadowed.bytes.length; i += 4) {
    const notCaster =
      Math.max(
        ...[0, 1, 2].map((c) =>
          Math.abs(casterOnly.bytes[i + c] - empty.bytes[i + c]),
        ),
      ) <= 2;
    const darkening = [0, 1, 2].reduce(
      (sum, c) => sum + unshadowed.bytes[i + c] - shadowed.bytes[i + c],
      0,
    );
    if (notCaster && darkening > 24) shadowPixels++;
  }
  scenario.metrics.receiverShadowPixels = shadowPixels;
  check(
    shadowPixels > 25,
    `Deformed caster darkens ${shadowPixels} receiver pixels outside its camera silhouette`,
  );
}

function solidRGBA(size: number, component: number): Uint8Array {
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i + component] = 255;
    data[i + 3] = 255;
  }
  return data;
}
function compressedBlock(
  format: NativeTextureFormat,
  component: number,
): Uint8Array {
  if (format === 'bc1-rgba-unorm') {
    const rgb565 = [0xf800, 0x07e0, 0x001f][component];
    return new Uint8Array([
      rgb565 & 255,
      rgb565 >> 8,
      rgb565 & 255,
      rgb565 >> 8,
      0,
      0,
      0,
      0,
    ]);
  }
  if (format === 'etc2-rgb8unorm') {
    // ETC1-compatible individual mode: equal 4-bit endpoints, table zero,
    // selector zero (+2). ETC2 decodes saturated primary + two in other channels.
    const block = new Uint8Array(8);
    block[component] = 0xff;
    return block;
  }
  if (format === 'astc-4x4-unorm') {
    // ASTC UNORM16 void-extent block; same constant encoding as Arm astcenc's
    // symbolic_to_physical, not an RGBA fallback presented as compressed bytes.
    // https://github.com/ARM-software/astc-encoder/blob/main/Source/astcenc_symbolic_physical.cpp
    const block = new Uint8Array([
      0xfc, 0xfd, 255, 255, 255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 255, 255,
    ]);
    block[8 + component * 2] = block[9 + component * 2] = 255;
    return block;
  }
  throw new Error(`No real solid block encoder for ${format}.`);
}
function nativeScene(texture: NativeTexture2D, lod: number): Scene {
  const scene = makeScene();
  scene.ambientLight = 1;
  scene.directionalLight.intensity = 0;
  scene.add(
    new Mesh({
      geometry: quad(),
      material: new PBRMaterial({
        texture,
        metallic: 0,
        roughness: 1,
        textureSampler: {
          minFilter: 'nearest',
          magFilter: 'nearest',
          mipmapFilter: 'nearest',
          lodMinClamp: lod,
          lodMaxClamp: lod,
        },
      }),
    }),
  );
  return scene;
}
async function nativeScenarios(): Promise<{
  texture: NativeTexture2D;
  scene: Scene;
  image: ImageProof;
}> {
  begin('native-rgba-distinct-mips-and-copy');
  const supplied = [4, 2, 1].map((size, component) => ({
    width: size,
    height: size,
    data: solidRGBA(size, component),
  }));
  const texture = own(
    new NativeTexture2D({
      format: 'rgba8unorm',
      width: 4,
      height: 4,
      levels: supplied,
    }),
  );
  for (const level of supplied) level.data.fill(0);
  await rejects(() => texture.image, 'native image accessor');
  const residentBefore = renderer!.residency.textures.liveBytes;
  const uploadsBefore = renderer!.stats.uploadBytes;
  await renderer!.prepareTextures([texture]);
  check(
    renderer!.residency.textures.liveBytes - residentBefore === 84,
    'Resident bytes include exactly 64 + 16 + 4 RGBA mip bytes',
  );
  check(
    renderer!.stats.uploadBytes - uploadsBefore === 84,
    'Real native upload counter includes every supplied mip byte exactly once',
  );
  const scenesByMip = [0, 1, 2].map((lod) => nativeScene(texture, lod));
  let first!: ImageProof;
  for (let lod = 0; lod < 3; lod++) {
    const image = await draw(scenesByMip[lod]);
    dominant(
      image,
      lod,
      `RGBA mip ${lod}, owned bytes survive caller mutation`,
    );
    if (lod === 0) first = image;
  }

  begin('native-prepare-unload-reprepare');
  const resident = renderer!.residency.textures.liveBytes;
  const uploads = renderer!.stats.uploadBytes;
  await renderer!.prepareTextures([texture]);
  check(
    renderer!.residency.textures.liveBytes === resident &&
      renderer!.stats.uploadBytes === uploads,
    'Preparing resident native mips again does not allocate or upload twice',
  );
  renderer!.unloadTexture(texture);
  check(
    renderer!.residency.textures.liveBytes === residentBefore,
    'Explicit unload retires all allocations belonging to the native mip chain',
  );
  const beforeReprepare = renderer!.stats.uploadBytes;
  await renderer!.prepareTextures([texture]);
  check(
    renderer!.residency.textures.liveBytes === residentBefore + 84 &&
      renderer!.stats.uploadBytes - beforeReprepare === 84,
    'Reprepare uploads every supplied mip into its preparation allocation',
  );
  equivalent(first, await draw(scenesByMip[0]), 'reprepare-pixels');
  check(
    renderer!.residency.textures.liveBytes === resident,
    'Rendering after reprepare restores the previous resident byte total without leaked allocations',
  );

  begin('real-compressed-solid-mips');
  const supported = renderer!.capabilities.supportedTextureFormats;
  const formats: NativeTextureFormat[] = [
    'bc1-rgba-unorm',
    'etc2-rgb8unorm',
    'astc-4x4-unorm',
  ];
  const selected = formats.find((format) => supported.includes(format));
  if (!selected) {
    skip(
      'Actual device advertises no BC1, ETC2 RGB8 or ASTC 4x4 compression extension/feature.',
    );
  } else {
    scenario.metrics.format = selected;
    const levels = [4, 2, 1].map((size, component) => ({
      width: size,
      height: size,
      data: compressedBlock(selected, component),
    }));
    const compressed = own(
      new NativeTexture2D({ format: selected, width: 4, height: 4, levels }),
    );
    const expectedBytes = levels.reduce(
      (sum, level) => sum + level.data.byteLength,
      0,
    );
    const before = renderer!.residency.textures.liveBytes;
    const upload = renderer!.stats.uploadBytes;
    await renderer!.prepareTextures([compressed]);
    check(
      renderer!.residency.textures.liveBytes - before === expectedBytes,
      `Block-rounded 4x4, 2x2 and 1x1 resident bytes equal ${expectedBytes}`,
    );
    check(
      renderer!.stats.uploadBytes - upload === expectedBytes,
      `Actual compressed uploads account for all ${expectedBytes} source bytes`,
    );
    for (let lod = 0; lod < 3; lod++) {
      const scene = nativeScene(compressed, lod);
      compressedReplay.push(scene);
      dominant(await draw(scene), lod, `${selected} compressed mip ${lod}`);
    }
  }

  begin('unsupported-native-format-explicit-failure');
  const unsupported = formats.find((format) => !supported.includes(format));
  if (unsupported) {
    scenario.metrics.format = unsupported;
    const value = own(
      new NativeTexture2D({
        format: unsupported,
        width: 4,
        height: 4,
        levels: [
          { width: 4, height: 4, data: compressedBlock(unsupported, 0) },
        ],
      }),
    );
    const resident = renderer!.residency.textures.liveBytes;
    const upload = renderer!.stats.uploadBytes;
    await rejects(
      () => renderer!.prepareTextures([value]),
      `unsupported ${unsupported}`,
    );
    check(
      renderer!.residency.textures.liveBytes === resident &&
        renderer!.stats.uploadBytes === upload,
      'Unsupported format fails before allocating residency or uploading bogus decoded data',
    );
  } else {
    // A device supporting every family has no unsupported compressed format.
    // Canvas2D is a real unsupported backend, rather than a forged capability set.
    const target = document.createElement('canvas');
    const fallback = await createRenderer(target, 'canvas2d', (error) => {
      throw error;
    });
    try {
      await rejects(
        () => fallback.prepareTextures([texture]),
        'Canvas2D native texture',
      );
    } finally {
      fallback.destroy();
    }
  }
  return { texture, scene: scenesByMip[0], image: first };
}

async function waitUntil(
  predicate: () => boolean,
  label: string,
): Promise<void> {
  const deadline = performance.now() + 15000;
  while (!predicate()) {
    if (runtimeError) throw runtimeError;
    if (performance.now() > deadline) throw new Error(`${label} timed out.`);
    await new Promise<void>((resolve) => setTimeout(resolve, 20));
  }
}
async function lifecycle(native: {
  texture: NativeTexture2D;
  scene: Scene;
  image: ImageProof;
}): Promise<void> {
  begin('native-scene-capture-and-replay');
  const snapshot = await renderer!.captureScene(
    native.scene,
    canvas.width,
    canvas.height,
  );
  try {
    renderer!.unloadTexture(native.texture);
    const replay = await draw(makeScene(), {
      transition: {
        kind: 'crossfade',
        progress: 0,
        snapshot,
        color: [0, 0, 0, 1],
        direction: 'left',
      },
    });
    equivalent(
      native.image,
      replay,
      'captured-native-pixels-after-source-unload',
    );
    await renderer!.prepareTextures([native.texture]);
  } finally {
    snapshot.destroy();
  }

  begin('resize-preserves-native-mips');
  renderer!.resize(192, 192);
  check(
    canvas.width === 192 && canvas.height === 192,
    'Actual native render surface resized to 192x192',
  );
  dominant(
    await draw(nativeScene(native.texture, 2)),
    2,
    'Resize retains the blue 1x1 supplied mip',
  );
  renderer!.resize(256, 256);
  equivalent(native.image, await draw(native.scene), 'resize-roundtrip');

  begin('real-context-loss-residency-replay');
  const lease = renderer!.retainFrameResources();
  const lostBefore = losses;
  const recoveredBefore = recoveries;
  let trigger: (() => Promise<void>) | undefined;
  if (renderer!.backend === 'webgl2') {
    const extension = canvas
      .getContext('webgl2')!
      .getExtension('WEBGL_lose_context');
    if (!extension)
      skip('Actual WebGL implementation lacks WEBGL_lose_context.');
    else
      trigger = async () => {
        extension.loseContext();
        await waitUntil(() => losses > lostBefore, 'WebGL loss notification');
        extension.restoreContext();
      };
  } else {
    // The public renderer intentionally does not expose a destructive device-loss
    // API. This fixture-only structural hook destroys its REAL GPUDevice; all
    // rendering, preparation and recovery still go through public createRenderer.
    const actual = renderer as unknown as {
      current?: { device?: GPUDevice };
      device?: GPUDevice;
    };
    const device = actual.current?.device ?? actual.device;
    check(
      device !== undefined,
      'Fixture loss injection locates the actual active GPUDevice',
    );
    scenario.metrics.lossTrigger =
      'Actual GPUDevice.destroy(), fixture-only structural hook';
    trigger = async () => {
      device!.destroy();
    };
  }
  try {
    if (trigger) {
      await trigger();
      await waitUntil(
        () => recoveries > recoveredBefore,
        'Native recovery and residency replay',
      );
      check(
        losses === lostBefore + 1 && recoveries === recoveredBefore + 1,
        'Exactly one real loss and recovery notification observed',
      );
      check(
        !lease.released,
        'P41 scene preparation lease survives real native recovery',
      );
      equivalent(
        native.image,
        await draw(native.scene),
        'recovered-native-scene',
      );
      dominant(
        await draw(nativeScene(native.texture, 1)),
        1,
        'Recovery replays the green supplied mip, not only the base image',
      );
      for (let lod = 0; lod < compressedReplay.length; lod++)
        dominant(
          await draw(compressedReplay[lod]),
          lod,
          `Recovery replays real compressed mip ${lod}`,
        );
    }
  } finally {
    lease.release();
  }

  begin('native-destroy-and-renderer-release');
  renderer!.unloadTexture(native.texture);
  native.texture.destroy();
  check(native.texture.destroyed, 'Native texture enters destroyed state');
  await rejects(
    () => renderer!.prepareTextures([native.texture]),
    'Destroyed native texture',
  );
  renderer!.destroy();
  check(
    renderer!.residency.textures.liveBytes === 0 &&
      renderer!.residency.geometry.liveBytes === 0,
    'Renderer destroy releases all native texture and geometry residency',
  );
}
function destroy(): void {
  if (destroyed) return;
  destroyed = true;
  try {
    renderer?.destroy();
  } finally {
    for (const scene of scenes) scene.destroy();
    for (const texture of textures) texture.destroy();
  }
}
async function canvasScenario(): Promise<void> {
  begin('ordinary-image-canvas-path');
  const target = document.createElement('canvas');
  target.width = target.height = 32;
  const fallback = await createRenderer(target, 'canvas2d', (error) => {
    throw error;
  });
  try {
    const green = await ordinaryTexture('#00ff00');
    await fallback.prepareTextures([green]);
    const scene = new Scene();
    scenes.push(scene);
    scene.add(
      new Sprite({
        texture: green,
        position: [16, 16],
        scale: [6, 6],
        space: 'screen',
      }),
    );
    fallback.beginFrame();
    fallback.render(scene, 32, 32);
    fallback.endFrame();
    const value = target.getContext('2d')!.getImageData(16, 16, 1, 1).data;
    check(
      value[0] === 0 && value[1] === 255 && value[2] === 0 && value[3] === 255,
      `Ordinary decoded image still renders on actual Canvas2D: ${Array.from(value).join(',')}`,
    );
    begin('canvas-native-explicit-failure');
    const native = own(
      new NativeTexture2D({
        format: 'rgba8unorm',
        width: 1,
        height: 1,
        levels: [
          { width: 1, height: 1, data: new Uint8Array([255, 0, 0, 255]) },
        ],
      }),
    );
    await rejects(
      () => fallback.prepareTextures([native]),
      'Canvas2D cannot use native-only bytes',
    );
  } finally {
    fallback.destroy();
  }
}

async function execute(): Promise<NativeReport> {
  try {
    begin('forced-native-backend');
    renderer = await createRenderer(
      canvas,
      preference,
      (error) => {
        runtimeError = error;
      },
      {
        antialias: false,
        recover: true,
        onLost: () => {
          losses++;
        },
        onRecovered: () => {
          recoveries++;
        },
      },
    );
    capturedFrames = frameProofs(renderer, canvas, () => {
      output.textContent = JSON.stringify(report);
    });
    report.graphicsEvents = capturedFrames.graphicsEvents;
    report.renderer = renderer.backend;
    check(
      preference === 'auto' || renderer.backend === preference,
      `Forced ${preference}, observed actual ${renderer.backend}`,
    );
    report.supportedTextureFormats = [
      ...renderer.capabilities.supportedTextureFormats,
    ];
    if (!renderer.capabilities.threeD) {
      skip(
        'Actual Canvas2D backend has no native 3D or compressed texture support.',
      );
      await canvasScenario();
      destroy();
      publish('passed');
      return report;
    }
    renderer.resize(256, 256);
    const white = await ordinaryTexture('#ffffff');
    await renderer.prepareTextures([white]);
    await skinScenarios(white);
    renderer.unloadTexture(white);
    const native = await nativeScenarios();
    await lifecycle(native);
    await canvasScenario();
    destroy();
    publish('passed');
  } catch (error) {
    report.error = errorDetail(error);
    try {
      destroy();
    } catch (cleanup) {
      report.error += `\nCleanup: ${String(cleanup)}`;
    }
    publish('failed');
  }
  return report;
}
window.__xyzP42Native = {
  report,
  run: () => (running ??= execute()),
  destroy,
};
addEventListener('pagehide', destroy, { once: true });
if (new URLSearchParams(location.search).get('manual') !== '1')
  void window.__xyzP42Native.run();

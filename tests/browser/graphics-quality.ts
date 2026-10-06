import {
  createRenderer,
  Geometry,
  GraphicsError,
  Frustum,
  GLTFLoader,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  NativeMaterial3D,
  NativePBRMaterial,
  OrthographicCamera,
  PBRMaterial,
  PointLight,
  RenderVisibilityCache,
  RenderVisibilitySet,
  Scene,
  SkinnedMesh,
  Texture,
  TextureMaterial,
  Vector3,
  type Renderer,
  type RendererPreference,
} from '../../src/index.js';
import { ShadowAtlas } from '../../packages/core/src/shadow-atlas.js';
import { frameProofs, errorDetail, type FrameProof } from './frame-proof.js';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const output = document.querySelector<HTMLPreElement>('#report')!;
const preference = (new URLSearchParams(location.search).get('renderer') ??
  'webgl2') as RendererPreference;
const report = {
  renderer: preference,
  scenarios: [] as {
    name: string;
    metrics: Record<string, unknown>;
    png?: string;
  }[],
  error: undefined as string | undefined,
};
// Hosted software-GPU hangs never reach the final report; expose where the page is.
const scenarioPush = report.scenarios.push.bind(report.scenarios);
report.scenarios.push = (...items) => {
  output.dataset.progress = items.map((item) => item.name).join(',');
  return scenarioPush(...items);
};
function step(name: string): void {
  output.dataset.step = name;
}
let renderer!: Renderer;
let lost = 0,
  recovered = 0;
let runtimeError: Error | undefined;
const owned: { destroy(): void }[] = [];
const whiteCanvas = document.createElement('canvas');
whiteCanvas.width = whiteCanvas.height = 4;
whiteCanvas.getContext('2d')!.fillStyle = '#fff';
whiteCanvas.getContext('2d')!.fillRect(0, 0, 4, 4);

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}
function delay(milliseconds: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}
function equivalent(a: FrameProof, b: FrameProof, label: string): number {
  check(
    a.width === b.width && a.height === b.height,
    `${label}: dimensions differ`,
  );
  let error = 0,
    bad = 0;
  for (let i = 0; i < a.bytes.length; i += 4) {
    let maximum = 0;
    for (let c = 0; c < 3; c++) {
      const delta = Math.abs(a.bytes[i + c]! - b.bytes[i + c]!);
      error += delta;
      maximum = Math.max(maximum, delta);
    }
    if (maximum > 8) bad++;
  }
  const mean = error / (a.width * a.height * 3);
  check(
    mean <= 0.6 && bad <= a.width * a.height * 0.006,
    `${label}: mean ${mean}, bad pixels ${bad}`,
  );
  return mean;
}
function scene(): Scene {
  const s = new Scene();
  owned.push(s);
  s.camera3D.position.set(8, 10, 18);
  s.camera3D.lookAt(new Vector3(0, 0, -4));
  s.ambientLight = 1;
  s.directionalLight.intensity = 0;
  s.directionalLight.direction.set(1, 2, 1);
  Object.assign(s.shadows, {
    enabled: true,
    mapSize: 64,
    extent: 30,
    far: 60,
    bias: 0.001,
  });
  return s;
}
const identityWGSL =
  'fn xyzDeform(position: vec3f, normal: vec3f, uv: vec2f) -> XYZVertex { return XYZVertex(position,normal); }';
const identityGLSL =
  'XYZVertex xyzDeform(vec3 position,vec3 normal,vec2 uv) { return XYZVertex(position,normal); }';

async function run(): Promise<void> {
  renderer = await createRenderer(
    canvas,
    preference,
    (error) => {
      runtimeError = error;
    },
    {
      antialias: false,
      recover: true,
      gpuTiming: { enabled: true, warmupFrames: 2 },
      onLost: () => {
        lost++;
      },
      onRecovered: () => {
        recovered++;
      },
    },
  );
  report.renderer = renderer.backend;
  check(
    preference === 'auto' || renderer.backend === preference,
    `Forced ${preference}, observed actual ${renderer.backend}.`,
  );
  renderer.resize(320, 320);
  const proofs = frameProofs(renderer, canvas);
  const white = await Texture.fromImage(whiteCanvas);
  owned.push(white);
  const draw = async (s: Scene): Promise<FrameProof> => {
    const previous = output.dataset.step?.split('>')[0];
    step(`${previous}>raf`);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    if (runtimeError) throw runtimeError;
    step(`${previous}>render`);
    renderer.beginFrame();
    renderer.render(s, canvas.width, canvas.height);
    step(`${previous}>proof`);
    const proof = proofs.next();
    step(`${previous}>end`);
    renderer.endFrame();
    step(`${previous}>done events=${JSON.stringify(proofs.graphicsEvents)}`);
    return proof;
  };
  if (!renderer.capabilities.threeD) {
    const s = scene();
    s.add(
      new Mesh({
        geometry: Geometry.cube(),
        material: new TextureMaterial({ texture: white }),
      }),
    );
    let rejected = false;
    try {
      await draw(s);
    } catch {
      rejected = true;
    }
    check(
      rejected,
      'Canvas2D must explicitly reject 3D, not substitute software pixels.',
    );
    let materialRejected = false;
    try {
      await renderer.prepareNativePBRMaterial!(
        new NativePBRMaterial({
          texture: white,
          deformationBounds: 0,
          wgsl: 'fn xyzPhysical(w:vec3f,n:vec3f,uv:vec2f,s:XYZPhysical)->XYZPhysical { return s; }',
          glsl: 'XYZPhysical xyzPhysical(vec3 w,vec3 n,vec2 uv,XYZPhysical s) { return s; }',
        }),
      );
    } catch {
      materialRejected = true;
    }
    check(materialRejected, 'Canvas2D must reject NativePBRMaterial.');
    report.scenarios.push({
      name: 'canvas-explicit-unsupported',
      metrics: { rejected },
    });
    return;
  }
  if (renderer.backend === 'webgl2') {
    const extensionScene = scene();
    const wgsl = `${identityWGSL} fn xyzSurface(world:vec3f,normal:vec3f,uv:vec2f,texel:vec4f)->vec4f { return vec4f(0.15,0.8,0.25,1.0); }`;
    const valid = new NativeMaterial3D({
      texture: white,
      deformationBounds: 0,
      wgsl,
      glsl: `${identityGLSL}\n#ifdef XYZ_FRAGMENT\nvec4 xyzSurface(vec3 world,vec3 normal,vec2 uv,vec4 texel) { return vec4(0.15,0.8,0.25,1.0); }\n#endif`,
    });
    owned.push(valid);
    await renderer.prepareMaterial(valid);
    extensionScene.add(
      new Mesh({ geometry: Geometry.cube(), material: valid }),
    );
    const before = await draw(extensionScene);
    let greenPixels = 0;
    for (let i = 0; i < before.bytes.length; i += 4) {
      if (
        before.bytes[i + 1]! > 150 &&
        before.bytes[i + 1]! > before.bytes[i]! + 60 &&
        before.bytes[i + 1]! > before.bytes[i + 2]! + 50
      )
        greenPixels++;
    }
    check(
      greenPixels > 50,
      'Native extension did not render its authored green surface.',
    );
    const rejectedResources: string[] = [];
    for (const declaration of [
      'uniform vec4 privateShade;',
      'layout(std140) uniform PrivateState { vec4 privateShade; };',
    ]) {
      const invalid = new NativeMaterial3D({
        texture: white,
        deformationBounds: 0,
        wgsl,
        glsl: `${identityGLSL}\n#ifdef XYZ_FRAGMENT\n${declaration}\nvec4 xyzSurface(vec3 world,vec3 normal,vec2 uv,vec4 texel) { return privateShade; }\n#endif`,
      });
      owned.push(invalid);
      let failure: unknown;
      try {
        await renderer.prepareMaterial(invalid);
      } catch (error) {
        failure = error;
      }
      check(
        failure instanceof GraphicsError &&
          failure.constructor === GraphicsError,
        'Active private resources must reject at ABI validation, not merely fail shader compilation.',
      );
      rejectedResources.push((failure as GraphicsError).message);
    }
    const after = await draw(extensionScene);
    const meanError = equivalent(
      after,
      before,
      'Valid native surface after rejected private resources',
    );
    report.scenarios.push({
      name: 'native-extension-private-resource-rejection',
      metrics: { rejectedResources, greenPixels, meanError },
      png: after.png,
    });
  }

  step('physical:omitted');
  const physicalScene = scene();
  const omitted = new NativePBRMaterial({
    texture: white,
    deformationBounds: 0,
    wgsl: identityWGSL,
    glsl: identityGLSL,
  });
  owned.push(omitted);
  let omission: unknown;
  try {
    await renderer.prepareNativePBRMaterial!(omitted);
  } catch (error) {
    omission = error;
  }
  check(
    omission instanceof GraphicsError,
    'A physical material without xyzPhysical must reject before draw.',
  );
  step('physical:prepare');
  const physical = new NativePBRMaterial({
    texture: white,
    deformationBounds: 0,
    uniforms: [1],
    wgsl: 'fn xyzPhysical(world:vec3f,normal:vec3f,uv:vec2f,surface:XYZPhysical)->XYZPhysical { var out=surface; out.base=vec3f(mesh.custom[0].x,0.02,0.02); return out; }',
    glsl: '#if defined(XYZ_FRAGMENT) && !defined(XYZ_SHADOW)\nXYZPhysical xyzPhysical(vec3 world,vec3 normal,vec2 uv,XYZPhysical surface) { XYZPhysical outv=surface; outv.base=vec3(xyzUniforms[0].x,0.02,0.02); return outv; }\n#endif',
  });
  owned.push(physical);
  await renderer.prepareNativePBRMaterial!(physical);
  physicalScene.add(
    new Mesh({
      geometry: Geometry.cube(),
      material: physical,
      castShadow: false,
    }),
  );
  step('physical:draw');
  const colored = await draw(physicalScene);
  let redPixels = 0;
  for (let i = 0; i < colored.bytes.length; i += 4)
    if (
      colored.bytes[i]! > 80 &&
      colored.bytes[i]! > colored.bytes[i + 1]! + 30 &&
      colored.bytes[i]! > colored.bytes[i + 2]! + 30
    )
      redPixels++;
  check(redPixels > 50, 'Physical hook must replace the decoded base color.');
  physical.setUniforms([0]);
  const dimmed = await draw(physicalScene);
  let changed = 0;
  for (let i = 0; i < colored.bytes.length; i += 4)
    if (colored.bytes[i]! > dimmed.bytes[i]! + 40) changed++;
  check(changed > 50, 'Mutable physical uniforms must change the lit surface.');
  physical.destroy();
  check(
    !white.destroyed,
    'Destroying a physical material must not destroy borrowed textures.',
  );
  report.scenarios.push({
    name: 'native-physical-surface',
    metrics: {
      redPixels,
      changed,
      borrowedSurvived: !white.destroyed,
      omission: (omission as Error).message,
    },
    png: colored.png,
  });

  // Native cascade visibility encoded in R; the two individual cascades are G/B.
  // A CPU ray/plane intersection independently verifies the blended R value.
  const quality = scene();
  Object.assign(quality.shadows, {
    cascades: 2,
    cascadeDistance: 45,
    cascadeLambda: 0,
    cascadeBlend: 0.4,
  });
  const debug = new NativeMaterial3D({
    texture: white,
    deformationBounds: 0,
    wgsl: `${identityWGSL} fn xyzSurface(world: vec3f, normal: vec3f, uv: vec2f, texel: vec4f) -> vec4f { return vec4f(directionalShadow(world,normal),atlasVisibility(0,world,normal,true),atlasVisibility(1,world,normal,true),1.0); }`,
    glsl: `${identityGLSL}\n#if defined(XYZ_FRAGMENT) && !defined(XYZ_SHADOW)\nfloat directionalShadow(); float atlasVisibility(int index,vec3 world,vec3 normal,bool filtered); vec4 xyzSurface(vec3 world,vec3 normal,vec2 uv,vec4 texel) { return vec4(directionalShadow(),atlasVisibility(0,world,normal,true),atlasVisibility(1,world,normal,true),1.0); }\n#elif defined(XYZ_SHADOW)\nvec4 xyzSurface(vec3 world,vec3 normal,vec2 uv,vec4 texel) { return texel; }\n#endif`,
  });
  owned.push(debug);
  await renderer.prepareMaterial(debug);
  quality.add(
    new Mesh({
      geometry: Geometry.plane(60, 60),
      material: debug,
      castShadow: false,
    }),
  );
  for (let x = -6; x <= 6; x += 3)
    for (let z = -6; z <= 6; z += 3)
      quality.add(
        new Mesh({
          geometry: Geometry.cube(1.7),
          material: new TextureMaterial({ texture: white }),
          position: [x, 1, z],
        }),
      );
  const atlas = new ShadowAtlas();
  atlas.update(quality, 1);
  const blended = await draw(quality);
  const inverse = new Matrix4().copy(quality.camera3D.matrix).invert();
  const near = new Vector3(),
    far = new Vector3(),
    world = new Vector3();
  let transitionPixels = 0,
    maximumBlendError = 0;
  const split = atlas.data[4]!,
    width =
      (split - Math.max(quality.camera3D.near, quality.shadows.near)) *
      quality.shadows.cascadeBlend;
  for (let y = 0; y < blended.height; y++)
    for (let x = 0; x < blended.width; x++) {
      const at = (y * blended.width + x) * 4;
      const g = blended.bytes[at + 1]!,
        b = blended.bytes[at + 2]!;
      if (Math.abs(g - b) < 20) continue;
      near.set(
        ((x + 0.5) / blended.width) * 2 - 1,
        1 - ((y + 0.5) / blended.height) * 2,
        0,
      );
      far.set(near.x, near.y, 1);
      inverse.transformPoint(near, near);
      inverse.transformPoint(far, far);
      const t = -near.y / (far.y - near.y);
      world.set(
        near.x + (far.x - near.x) * t,
        0,
        near.z + (far.z - near.z) * t,
      );
      const depth =
        (world.x - quality.camera3D.position.x) * atlas.data[8]! +
        (world.y - quality.camera3D.position.y) * atlas.data[9]! +
        (world.z - quality.camera3D.position.z) * atlas.data[10]!;
      const linear = Math.max(0, Math.min(1, (depth - split + width) / width));
      if (linear <= 0.05 || linear >= 0.95) continue;
      const blend = linear * linear * (3 - 2 * linear);
      const expected = g + (b - g) * blend;
      maximumBlendError = Math.max(
        maximumBlendError,
        Math.abs(blended.bytes[at]! - expected),
      );
      transitionPixels++;
    }
  check(
    transitionPixels >= 8 && maximumBlendError <= 3,
    `Cascade blend oracle: ${transitionPixels} pixels, error ${maximumBlendError}.`,
  );
  report.scenarios.push({
    name: 'cascade-native-transition',
    metrics: { transitionPixels, maximumBlendError },
    png: blended.png,
  });

  const seam = scene();
  const camera = new OrthographicCamera();
  camera.height = 14;
  camera.position.set(5, 12, 0);
  camera.lookAt(new Vector3(5, 0, 0));
  seam.camera3D = camera;
  const light = new PointLight({
    position: [0, 5, 0],
    intensity: 0.000001,
    range: 30,
    castShadow: true,
  });
  seam.pointLights.push(light);
  const pointDebug = new NativeMaterial3D({
    texture: white,
    deformationBounds: 0,
    wgsl: `${identityWGSL} fn xyzSurface(world: vec3f, normal: vec3f, uv: vec2f, texel: vec4f) -> vec4f { let v=pointShadow(0u,world,vec3f(0.0,5.0,0.0),normal); return vec4f(vec3f(v),1.0); }`,
    glsl: `${identityGLSL}\n#if defined(XYZ_FRAGMENT) && !defined(XYZ_SHADOW)\nfloat pointShadow(int index,vec3 position); vec4 xyzSurface(vec3 world,vec3 normal,vec2 uv,vec4 texel) { return vec4(vec3(pointShadow(0,vec3(0,5,0))),1.0); }\n#elif defined(XYZ_SHADOW)\nvec4 xyzSurface(vec3 world,vec3 normal,vec2 uv,vec4 texel) { return texel; }\n#endif`,
  });
  owned.push(pointDebug);
  await renderer.prepareMaterial(pointDebug);
  seam.add(
    new Mesh({
      geometry: Geometry.plane(30, 30),
      material: pointDebug,
      castShadow: false,
    }),
  );
  seam.add(
    new Mesh({
      geometry: Geometry.cube(1),
      material: new TextureMaterial({ texture: white }),
      position: [3, 2, 0],
      scale: [2, 2, 4],
    }),
  );
  const seamImage = await draw(seam);
  const seamPixels = [4.85, 5, 5.15].map((x) => {
    camera.matrix.transformPoint(new Vector3(x, 0, 0), world);
    const px = Math.max(
      0,
      Math.min(
        seamImage.width - 1,
        Math.floor((world.x * 0.5 + 0.5) * seamImage.width),
      ),
    );
    const py = Math.max(
      0,
      Math.min(
        seamImage.height - 1,
        Math.floor((0.5 - world.y * 0.5) * seamImage.height),
      ),
    );
    return seamImage.bytes[(py * seamImage.width + px) * 4]!;
  });
  check(
    Math.max(...seamPixels) < 140 &&
      Math.max(...seamPixels) - Math.min(...seamPixels) < 64,
    `Point face seam must stay shadowed on both faces: ${seamPixels}.`,
  );
  report.scenarios.push({
    name: 'point-native-face-seam',
    metrics: { seamPixels },
    png: seamImage.png,
  });

  const bias = scene();
  bias.camera3D = camera;
  bias.directionalLight.direction.set(1, 0.08, 0.2);
  Object.assign(bias.shadows, { bias: 0, slopeBias: 0, extent: 30 });
  bias.add(new Mesh({ geometry: Geometry.plane(30, 30), material: debug }));
  const noBias = await draw(bias);
  bias.shadows.slopeBias = 1;
  const slopeBias = await draw(bias);
  bias.shadows.enabled = false;
  const clearPlane = await draw(bias);
  let removedAcnePixels = 0;
  for (let i = 0; i < clearPlane.bytes.length; i += 4)
    if (
      clearPlane.bytes[i]! > 240 &&
      noBias.bytes[i]! < 180 &&
      slopeBias.bytes[i]! > 230
    )
      removedAcnePixels++;
  check(
    removedAcnePixels >= 8,
    `Slope-scaled bias must remove grazing receiver acne: ${removedAcnePixels}.`,
  );
  report.scenarios.push({
    name: 'slope-bias-native-acne',
    metrics: { removedAcnePixels },
    png: slopeBias.png,
  });

  const cached = scene();
  cached.ambientLight = 0.05;
  cached.directionalLight.intensity = 1;
  const parent = cached.add(new Group());
  const caster = parent.add(
    new Mesh({
      geometry: Geometry.cube(2),
      material: new TextureMaterial({ texture: white }),
      position: [0, 2, 0],
    }),
  );
  cached.add(
    new Mesh({
      geometry: Geometry.plane(30, 30),
      material: new TextureMaterial({ texture: white }),
      castShadow: false,
    }),
  );
  const first = await draw(cached),
    repeated = await draw(cached);
  check(
    first.stats.shadowPasses === 1 &&
      repeated.stats.shadowPasses === 0 &&
      repeated.stats.shadowCacheHits === 1,
    'Static repeated frame must omit the actual native depth pass.',
  );
  equivalent(first, repeated, 'static cached output');
  const invalidations: Record<string, number | undefined> = {};
  const verifyInvalidation = async (name: string): Promise<FrameProof> => {
    const fresh = await draw(cached);
    invalidations[name] = fresh.stats.shadowPasses;
    check(
      fresh.stats.shadowPasses === 1,
      `${name}: missing native cache invalidation.`,
    );
    cached.shadows.cache = false;
    const forced = await draw(cached);
    cached.shadows.cache = true;
    equivalent(fresh, forced, `${name}: cached/uncached oracle`);
    return fresh;
  };
  parent.position.x += 1;
  await verifyInvalidation('mutable-parent-pose');
  cached.directionalLight.direction.x += 0.2;
  await verifyInvalidation('mutable-light');
  caster.geometry.vertices[0]! += 0.5;
  caster.geometry.markUpdated();
  await verifyInvalidation('deformation');
  cached.remove(parent);
  await verifyInvalidation('scene-membership');
  cached.add(parent);
  await verifyInvalidation('caster-restored');
  cached.shadows.invalidate();
  await verifyInvalidation('explicit-material-resource-invalidation');
  renderer.resize(352, 352);
  await verifyInvalidation('resize');
  const replacement = scene();
  replacement.add(
    new Mesh({
      geometry: Geometry.cube(),
      material: new TextureMaterial({ texture: white }),
    }),
  );
  check(
    (await draw(replacement)).stats.shadowPasses === 1,
    'Scene replacement must invalidate the atlas.',
  );
  await verifyInvalidation('scene-restored');
  report.scenarios.push({
    name: 'static-shadow-cache-invalidation',
    metrics: {
      initialDraws: first.stats.shadowDrawCalls,
      repeatedDraws: repeated.stats.shadowDrawCalls,
      invalidations,
    },
    png: repeated.png,
  });

  const tracked = new NativeMaterial3D({
    texture: white,
    deformationBounds: 1,
    shadowCache: 'tracked',
    uniforms: [0, 1],
    wgsl: 'fn xyzDeform(position: vec3f, normal: vec3f, uv: vec2f) -> XYZVertex { return XYZVertex(position+vec3f(mesh.custom[0].x,0.0,0.0),normal); } fn xyzSurface(world: vec3f,normal: vec3f,uv: vec2f,texel: vec4f) -> vec4f { return texel*mesh.custom[0].y; }',
    glsl: 'XYZVertex xyzDeform(vec3 position,vec3 normal,vec2 uv) { return XYZVertex(position+vec3(xyzUniforms[0].x,0,0),normal); }\n#ifdef XYZ_FRAGMENT\nvec4 xyzSurface(vec3 world,vec3 normal,vec2 uv,vec4 texel) { return texel*xyzUniforms[0].y; }\n#endif',
  });
  owned.push(tracked);
  await renderer.prepareMaterial(tracked);
  const custom = cached.add(
    new Mesh({
      geometry: Geometry.cube(),
      material: tracked,
      position: [3, 2, 0],
    }),
  );
  await draw(cached);
  check(
    (await draw(cached)).stats.shadowPasses === 0,
    'Tracked native hooks may reuse an unchanged atlas.',
  );
  tracked.uniforms[0] = 0.5;
  await verifyInvalidation('native-uniform-deformation');
  tracked.uniforms[1] = 0;
  await verifyInvalidation('native-material-alpha');
  custom.visible = false;
  await verifyInvalidation('material-caster-visibility');

  // Real imported eight-influence skin vs exact CPU-mirrored geometry, before/after joint8 motion.
  const asset = await new GLTFLoader().load(
    '/tests/fixtures/gltf-uv-eight.gltf',
  );
  const skin = [...[...asset.scene.children][0]!.children][0] as SkinnedMesh;
  const imported = scene();
  const modelCamera = new OrthographicCamera();
  modelCamera.height = 6;
  modelCamera.position.set(1, 0, 8);
  imported.camera3D = modelCamera;
  imported.shadows.enabled = false;
  imported.directionalLight.intensity = 1;
  imported.directionalLight.direction.set(0.6, 0.3, 1);
  imported.add(asset.scene);
  for (const movement of [0, 9]) {
    if (movement) skin.joints[7]!.position.x += movement;
    const native = await draw(imported);
    skin.updateSkin();
    let coloredPixels = 0;
    for (let i = 0; i < native.bytes.length; i += 4)
      if (
        Math.max(native.bytes[i]!, native.bytes[i + 1]!, native.bytes[i + 2]!) >
        40
      )
        coloredPixels++;
    check(
      coloredPixels >= 32,
      'Eight-influence parity oracle must contain the actual imported triangle.',
    );
    imported.remove(asset.scene);
    const mirror = imported.add(
      new Mesh({ geometry: skin.geometry, material: skin.material }),
    );
    const cpu = await draw(imported);
    const error = equivalent(native, cpu, `eighth-joint-${movement}`);
    report.scenarios.push({
      name: `gltf-eight-native-CPU-${movement}`,
      metrics: { meanRGBError: error },
      png: native.png,
    });
    imported.remove(mirror);
    imported.add(asset.scene);
  }
  imported.shadows.enabled = true;
  await draw(imported);
  check(
    (await draw(imported)).stats.shadowPasses === 0,
    'An unchanged eight-influence skin must reuse its native depth atlas.',
  );
  skin.joints[7]!.position.x += 1;
  const changedSkin = await draw(imported);
  check(
    changedSkin.stats.shadowPasses === 1,
    'Eighth-joint palette mutation must invalidate native shadows.',
  );
  imported.shadows.cache = false;
  equivalent(
    changedSkin,
    await draw(imported),
    'eight-influence-shadow-cache-oracle',
  );
  report.scenarios.push({
    name: 'eight-influence-native-shadow-invalidation',
    metrics: { shadowPasses: changedSkin.stats.shadowPasses },
    png: changedSkin.png,
  });
  imported.remove(asset.scene);
  asset.dispose();

  // Per-slot transforms compared against a separately authored UV stream reference, not an image-difference assertion.
  const maps = [
    'texture',
    'normal',
    'metallicRoughness',
    'occlusion',
    'emissive',
    'specular',
    'specularColor',
    'clearcoat',
    'clearcoatRoughness',
    'clearcoatNormal',
    'sheenColor',
    'sheenRoughness',
    'transmission',
    'thickness',
  ] as const;
  const textureFields = [
    'texture',
    'normalTexture',
    'metallicRoughnessTexture',
    'occlusionTexture',
    'emissiveTexture',
    'specularTexture',
    'specularColorTexture',
    'clearcoatTexture',
    'clearcoatRoughnessTexture',
    'clearcoatNormalTexture',
    'sheenColorTexture',
    'sheenRoughnessTexture',
    'transmissionTexture',
    'thicknessTexture',
  ] as const;
  const pattern = document.createElement('canvas');
  pattern.width = pattern.height = 8;
  const painter = pattern.getContext('2d')!;
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      painter.fillStyle = `rgba(${32 + x * 24},${32 + y * 24},${80 + ((x + y) % 4) * 40},${(x + 1) / 9})`;
      painter.fillRect(x, y, 1, 1);
    }
  const grid = await Texture.fromImage(pattern);
  owned.push(grid);
  const uvScene = scene();
  uvScene.camera3D = modelCamera;
  uvScene.shadows.enabled = false;
  uvScene.ambientLight = 0.2;
  uvScene.directionalLight.intensity = 1;
  uvScene.add(
    new Mesh({
      geometry: Geometry.plane(8, 8),
      material: new TextureMaterial({ texture: grid }),
      rotation: [Math.PI / 2, 0, 0],
      position: [0, 0, -1],
      castShadow: false,
    }),
  );
  const slots: Record<string, number> = {};
  for (let index = 0; index < maps.length; index++) {
    const source = Geometry.plane(3, 3); // Same geometry rendered facing the camera after rotation.
    const uv1 = new Float32Array(source.vertices.length / 4);
    const uvReference = new Float32Array(uv1.length);
    for (let vertex = 0; vertex < source.vertices.length / 8; vertex++) {
      const u = source.vertices[vertex * 8 + 6]!,
        v = source.vertices[vertex * 8 + 7]!;
      uv1[vertex * 2] = v;
      uv1[vertex * 2 + 1] = 1 - u;
      uvReference[vertex * 2] = 0.6 * v + 0.2;
      uvReference[vertex * 2 + 1] = 0.6 * (1 - u) + 0.1;
    }
    const positions = new Float32Array((source.vertices.length / 8) * 3),
      normals = new Float32Array(positions.length),
      uv0 = new Float32Array(uv1.length);
    for (let vertex = 0; vertex < source.vertices.length / 8; vertex++)
      for (let k = 0; k < 3; k++) {
        positions[vertex * 3 + k] = source.vertices[vertex * 8 + k]!;
        normals[vertex * 3 + k] = source.vertices[vertex * 8 + k + 3]!;
      }
    for (let vertex = 0; vertex < source.vertices.length / 8; vertex++) {
      uv0[vertex * 2] = source.vertices[vertex * 8 + 6]!;
      uv0[vertex * 2 + 1] = source.vertices[vertex * 8 + 7]!;
    }
    const geometry = new Geometry({
      positions,
      normals,
      uvs: uv0,
      uvs1: uv1,
      indices: source.indices,
    });
    const reference = new Geometry({
      positions,
      normals,
      uvs: uvReference,
      indices: source.indices,
    });
    const options = {
      texture: white,
      metallic: 0.4,
      roughness: 0.6,
      emissive: [0.2, 0.2, 0.2] as [number, number, number],
      clearcoat: 0.5,
      clearcoatRoughness: 0.4,
      sheenColor: [0.4, 0.3, 0.2] as [number, number, number],
      transmission: 0.4,
      thickness: 0.5,
      attenuationDistance: 1,
      attenuationColor: [0.5, 0.8, 0.3] as [number, number, number],
      doubleSided: true,
      [textureFields[index]!]: grid,
    };
    const candidate = uvScene.add(
      new Mesh({
        geometry,
        material: new PBRMaterial({
          ...options,
          textureCoordinates: {
            [maps[index]!]: {
              texCoord: 1,
              scale: [0.6, 0.6],
              offset: [0.2, 0.1],
            },
          },
        }),
        rotation: [Math.PI / 2, 0, 0],
      }),
    );
    const actual = await draw(uvScene);
    uvScene.remove(candidate);
    const oracle = uvScene.add(
      new Mesh({
        geometry: reference,
        material: new PBRMaterial(options),
        rotation: [Math.PI / 2, 0, 0],
      }),
    );
    slots[maps[index]!] = equivalent(
      actual,
      await draw(uvScene),
      `UV slot ${maps[index]}`,
    );
    uvScene.remove(oracle);
  }
  report.scenarios.push({
    name: 'all-per-map-native-UV-reference',
    metrics: { meanRGBErrorBySlot: slots },
  });

  // CPU-only index fixture: identical visibility before/after steady reuse, then raw mutable pose.
  const scale = scene();
  scale.shadows.enabled = false;
  const instances = scale.add(
    new InstancedMesh({
      geometry: Geometry.cube(),
      material: new TextureMaterial({ texture: white }),
      count: 20000,
    }),
  );
  const matrix = new Matrix4();
  for (let i = 0; i < instances.count; i++) {
    matrix.elements[12] = ((i % 200) - 100) * 2;
    matrix.elements[14] = -Math.floor(i / 200) * 2;
    instances.setMatrixAt(i, matrix);
  }
  const cache = new RenderVisibilityCache(),
    visible = new RenderVisibilitySet(),
    frustum = new Frustum();
  const collect = () => {
    frustum.setFromMatrix(scale.camera3D.updateMatrix(1));
    return cache.collect(scale, scale.camera3D, frustum, visible, {
      viewportHeight: 352,
    });
  };
  collect();
  const membership = [
    ...visible.entries
      .get(instances)!
      .instances!.indices.subarray(
        0,
        visible.entries.get(instances)!.instances!.count,
      ),
  ];
  const firstTests = visible.instanceTests,
    firstRefits = visible.boundsRefits;
  const times: number[] = [];
  for (let i = 0; i < 100; i++) {
    const start = performance.now();
    collect();
    times.push(performance.now() - start);
  }
  check(
    JSON.stringify(membership) ===
      JSON.stringify([
        ...visible.entries
          .get(instances)!
          .instances!.indices.subarray(
            0,
            visible.entries.get(instances)!.instances!.count,
          ),
      ]),
    'Steady visibility optimization must preserve exact instance membership.',
  );
  check(
    visible.instanceTests === 0 &&
      visible.boundsRefits === 0 &&
      visible.poseChecks === 1,
    'Steady index skips refit/instance tests but still checks the mutable mesh pose.',
  );
  const steady = {
    instanceTests: visible.instanceTests,
    refits: visible.boundsRefits,
    poseChecks: visible.poseChecks,
  };
  instances.position.x = 40;
  collect();
  const optimizedMembers = [
    ...visible.entries
      .get(instances)!
      .instances!.indices.subarray(
        0,
        visible.entries.get(instances)!.instances!.count,
      ),
  ];
  const freshSet = new RenderVisibilitySet();
  new RenderVisibilityCache().collect(
    scale,
    scale.camera3D,
    frustum,
    freshSet,
    { viewportHeight: 352 },
  );
  check(
    JSON.stringify(optimizedMembers) ===
      JSON.stringify([
        ...freshSet.entries
          .get(instances)!
          .instances!.indices.subarray(
            0,
            freshSet.entries.get(instances)!.instances!.count,
          ),
      ]),
    'Raw mutable instance parent pose must match a fresh visibility index.',
  );
  times.sort((a, b) => a - b);
  report.scenarios.push({
    name: 'visibility-20000-instance-CPU',
    metrics: {
      initial: { instanceTests: firstTests, refits: firstRefits },
      steady,
      cpuGatherMeanMs:
        times.reduce((sum, value) => sum + value, 0) / times.length,
      cpuGatherP95Ms: times[95],
      gpuMs: null,
      rafMs: null,
      note: 'CPU-only gather, not GPU completion or RAF/FPS; pose checks retained.',
    },
  });
  for (const meshCount of [1000, 4000]) {
    const bulk = scene(),
      root = bulk.add(new Group()),
      geometry = Geometry.cube();
    const material = new TextureMaterial({ texture: white });
    for (let i = 0; i < meshCount; i++)
      root.add(
        new Mesh({
          geometry,
          material,
          position: [((i % 50) - 25) * 2, 0, -Math.floor(i / 50) * 2],
        }),
      );
    const index = new RenderVisibilityCache(),
      set = new RenderVisibilitySet(),
      bounds = new Frustum();
    const gather = () => {
      bounds.setFromMatrix(bulk.camera3D.updateMatrix(1));
      return index.collect(bulk, bulk.camera3D, bounds, set, {
        viewportHeight: 352,
      });
    };
    gather();
    const firstRefits = set.boundsRefits,
      members = new Set(set.color);
    const samples: number[] = [];
    for (let i = 0; i < 30; i++) {
      const start = performance.now();
      gather();
      samples.push(performance.now() - start);
    }
    check(
      set.color.length === members.size &&
        set.color.every((mesh) => members.has(mesh)),
      'Steady mesh visibility must preserve exact consumer membership.',
    );
    check(
      set.boundsRefits === 0 && set.poseChecks === meshCount,
      'Static BVH reuse must still check every public mutable mesh pose.',
    );
    const steady = {
      refits: set.boundsRefits,
      poseChecks: set.poseChecks,
      visibleMeshes: set.color.length,
    };
    root.position.x = 40;
    gather();
    const oracle = new RenderVisibilitySet();
    new RenderVisibilityCache().collect(bulk, bulk.camera3D, bounds, oracle, {
      viewportHeight: 352,
    });
    const actual = new Set(set.color);
    check(
      set.color.length === oracle.color.length &&
        oracle.color.every((mesh) => actual.has(mesh)),
      'Mutable bulk ancestor pose must match a freshly rebuilt visibility index.',
    );
    samples.sort((a, b) => a - b);
    report.scenarios.push({
      name: `visibility-${meshCount}-mesh-CPU`,
      metrics: {
        meshCount,
        initialRefits: firstRefits,
        steady,
        cpuGatherMeanMs:
          samples.reduce((sum, value) => sum + value, 0) / samples.length,
        cpuGatherP95Ms: samples[28],
        gpuMs: null,
        rafMs: null,
      },
    });
  }

  // Fixture-only real context/device loss; no OS/driver changes.
  let trigger: (() => void) | undefined;
  if (renderer.backend === 'webgl2') {
    const extension = canvas
      .getContext('webgl2')!
      .getExtension('WEBGL_lose_context');
    if (extension)
      trigger = () => {
        extension.loseContext();
        setTimeout(() => extension.restoreContext(), 50);
      };
  } else {
    const actual = renderer as unknown as {
      current?: { device?: GPUDevice };
      device?: GPUDevice;
    };
    const device = actual.current?.device ?? actual.device;
    if (device) trigger = () => device.destroy();
  }
  if (trigger) {
    const before = await draw(cached);
    const count = recovered;
    trigger();
    const deadline = performance.now() + 10000;
    while (recovered === count && performance.now() < deadline) await delay(20);
    check(recovered > count && lost > 0, 'Actual native loss must recover.');
    const after = await draw(cached);
    check(
      after.stats.shadowPasses === 1,
      'Recovered native target must redraw shadows before caching.',
    );
    equivalent(before, after, 'loss shadow replay');
    report.scenarios.push({
      name: 'native-loss-shadow-invalidation',
      metrics: { lost, recovered },
      png: after.png,
    });
  } else
    report.scenarios.push({
      name: 'native-loss-shadow-invalidation',
      metrics: {
        unsupported: 'No actual native loss hook/extension available.',
      },
    });
  check(
    proofs.graphicsEvents.every((event) => !event.includes('uncaptured error')),
    'No native GPU validation errors.',
  );
}

try {
  await run();
  output.dataset.state = 'passed';
} catch (error) {
  report.error = errorDetail(error);
  output.dataset.state = 'failed';
} finally {
  output.textContent = JSON.stringify(report);
  renderer?.destroy();
  for (const resource of owned.reverse()) resource.destroy();
}

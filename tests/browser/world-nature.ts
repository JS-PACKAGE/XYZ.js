import {
  createRenderer,
  createGrassGeometry,
  Geometry,
  GraphicsBackendUnavailableError,
  Mesh,
  Object3D,
  OrthographicCamera,
  PBRMaterial,
  Scene,
  Terrain3D,
  Texture,
  TextureMaterial,
  Trail3D,
  Vector3,
  VegetationMaterial,
  Water3D,
  type Renderer,
  type RendererPreference,
} from '../../src/index.js';
import { errorDetail, frameProofs, type FrameProof } from './frame-proof.js';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const output = document.querySelector<HTMLPreElement>('#report')!;
const preference = (new URLSearchParams(location.search).get('renderer') ??
  'webgl2') as RendererPreference;
const report = {
  renderer: preference as string,
  scenarios: [] as {
    name: string;
    metrics: Record<string, unknown>;
    png?: string;
  }[],
  error: undefined as string | undefined,
};
const owned: { destroy(): void }[] = [];
let renderer: Renderer | undefined;

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}
function difference(a: FrameProof, b: FrameProof): number {
  check(a.width === b.width && a.height === b.height, 'Frame sizes agree.');
  let changed = 0;
  for (let i = 0; i < a.bytes.length; i += 4)
    if (
      Math.max(
        Math.abs(a.bytes[i]! - b.bytes[i]!),
        Math.abs(a.bytes[i + 1]! - b.bytes[i + 1]!),
        Math.abs(a.bytes[i + 2]! - b.bytes[i + 2]!),
      ) > 8
    )
      changed++;
  return changed;
}
function colored(
  proof: FrameProof,
  predicate: (r: number, g: number, b: number) => boolean,
): { count: number; x: number; y: number } {
  let count = 0,
    x = 0,
    y = 0;
  for (let i = 0; i < proof.bytes.length; i += 4)
    if (predicate(proof.bytes[i]!, proof.bytes[i + 1]!, proof.bytes[i + 2]!)) {
      count++;
      x += (i / 4) % proof.width;
      y += Math.floor(i / 4 / proof.width);
    }
  return { count, x: x / Math.max(1, count), y: y / Math.max(1, count) };
}
function scene(height: number): Scene {
  const value = new Scene();
  owned.push(value);
  const camera = new OrthographicCamera();
  camera.height = height;
  camera.position.set(0, 0, 8);
  camera.lookAt(new Vector3());
  value.camera3D = camera;
  value.ambientLight = 1;
  value.directionalLight.intensity = 0;
  return value;
}
function save(
  name: string,
  proof: FrameProof,
  metrics: Record<string, unknown>,
): void {
  report.scenarios.push({
    name,
    metrics: {
      ...metrics,
      frame: proof.stats.frame,
      drawCalls: proof.stats.drawCalls,
    },
    png: proof.png,
  });
}

async function run(): Promise<void> {
  output.dataset.state = 'running';
  try {
    renderer = await createRenderer(
      canvas,
      preference,
      (error) => {
        report.error = errorDetail(error);
      },
      { recover: false, antialias: false },
    );
    report.renderer = renderer.backend;
    check(
      renderer.backend === preference,
      `Forced ${preference} remains selected.`,
    );
    renderer.resize(256, 256);
    const native = renderer;
    const proofs = frameProofs(native, canvas);
    async function draw(value: Scene): Promise<FrameProof> {
      value.updateCameraDependents(canvas.height);
      const pending = proofs.next();
      native.beginFrame();
      native.render(value, canvas.width, canvas.height);
      native.endFrame();
      return pending;
    }
    const image = document.createElement('canvas');
    image.width = image.height = 4;
    const context = image.getContext('2d')!;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, 4, 4);
    const texture = await Texture.fromImage(image);
    owned.push(texture);
    const terrainScene = scene(6);
    const terrain = new Terrain3D({
      heightmap: { width: 2, height: 2, heights: [0, 0.4, 0.8, 2.4] },
      material: new PBRMaterial({
        texture,
        color: [0.1, 0.8, 0.2],
        metallic: 0,
        roughness: 1,
        alphaMode: 'OPAQUE',
        doubleSided: false,
      }),
      width: 4,
      depth: 4,
      chunkSize: 1,
      lodDistances: [0],
      skirtDepth: 0.1,
    });
    terrainScene.add(terrain);
    const water = new Water3D({
      texture,
      width: 4,
      depth: 4,
      segments: 32,
      waves: [
        { direction: [1, 0.3], amplitude: 0.35, wavelength: 2, speed: 2 },
      ],
      normalWaves: [],
      foam: { threshold: 0, fade: 0.25, strength: 1 },
      materialOptions: {
        color: [0.05, 0.3, 0.8],
        transmission: 0,
        roughness: 0.5,
      },
    });
    owned.push(water);
    const target = new Object3D();
    owned.push(target);
    const trail = new Trail3D({
      target,
      material: new TextureMaterial({ texture, color: [1, 0.1, 0.8] }),
      lifetime: 2,
      maxPoints: 8,
      minimumDistance: 0.01,
      curve: [
        { age: 0, width: 0.3, color: [1, 1, 1, 1] },
        { age: 1, width: 0.3, color: [1, 1, 1, 1] },
      ],
    });
    owned.push(trail);
    for (let i = 0; i < 3; i++) {
      target.position.set(-1 + i, -0.7, 0);
      trail.sample(i * 0.1, [0, 0, 1]);
    }
    const vegetation = new VegetationMaterial({
      texture,
      color: [0.05, 0.8, 0.1],
      emissive: [0.02, 0.5, 0.03],
      metallic: 0,
      roughness: 1,
      windAmplitude: 0.8,
      windFrequency: 1,
      windDirection: [1, 0],
      bladeHeight: 2,
    });
    owned.push(vegetation);
    const grass = new Mesh({
      geometry: createGrassGeometry(0.5, 2, 12),
      material: vegetation,
    });
    owned.push(grass);

    if (native.backend === 'canvas2d') {
      check(
        !native.capabilities.threeD,
        'Canvas2D explicitly advertises no 3D.',
      );
      // Each facade must reject through the real renderer, rather than quietly disappearing.
      for (const [name, object] of [
        ['terrain', terrain],
        ['water', water],
        ['trail', trail],
        ['vegetation', grass],
      ] as const) {
        const value = name === 'terrain' ? terrainScene : scene(6);
        if (name !== 'terrain') value.add(object);
        value.updateCameraDependents(canvas.height);
        let failure: unknown;
        native.beginFrame();
        try {
          native.render(value, canvas.width, canvas.height);
        } catch (error) {
          failure = error;
        } finally {
          // Rejection happens in preflight; complete the still-active frame with no scene.
          if (failure !== undefined) native.render();
          native.endFrame();
        }
        check(
          failure instanceof GraphicsBackendUnavailableError &&
            /visible 3D meshes/.test(failure.message),
          `Canvas2D ${name} rendering explicitly rejects visible 3D meshes.`,
        );
        report.scenarios.push({
          name: `nature-canvas2d-rejects-${name}`,
          metrics: {
            threeD: native.capabilities.threeD,
            rejection: errorDetail(failure),
          },
        });
      }
      return;
    }
    check(native.capabilities.threeD, 'Native GPU backend advertises 3D.');
    await native.prepareNativePBRMaterial!(water.material);
    await native.prepareNativePBRMaterial!(vegetation);

    terrain.visible = false;
    const empty = await draw(terrainScene);
    terrain.visible = true;
    terrainScene.camera3D.position.set(0, 10, 0.01);
    terrainScene.camera3D.lookAt(new Vector3());
    const top = await draw(terrainScene);
    const topPixels = difference(empty, top);
    check(
      topPixels > 1000 && top.stats.drawCalls > 0,
      'Terrain submits a nonblank top surface.',
    );
    terrainScene.camera3D.position.set(0, -10, 0.01);
    terrainScene.camera3D.lookAt(new Vector3());
    const underside = await draw(terrainScene);
    const undersidePixels = difference(empty, underside);
    check(
      undersidePixels < topPixels * 0.05,
      'Terrain faces upward, not downward (native back-face culling).',
    );
    check(terrain.normalAt(1, 1)!.y > 0, 'Terrain query normals point upward.');
    save('nature-terrain-upward', top, { topPixels, undersidePixels });
    save('nature-terrain-underside', underside, { undersidePixels });

    // Independent oracle for the second triangle: d + (c-d)*(1-u) + (b-d)*(1-v).
    const height = terrain.heightAt(1, 1)!;
    const asymmetric = terrain.heightAt(-1, 1)!;
    check(
      Math.abs(height - 1.5) < 1e-6 && Math.abs(asymmetric - 0.7) < 1e-6,
      'Asymmetric terrain heightAt matches the full-resolution triangle oracle.',
    );
    // A steep view keeps the entire below-surface sphere behind the finite terrain,
    // rather than letting its silhouette peek past the foreground perimeter.
    terrainScene.camera3D.position.set(0, 10, 5);
    terrainScene.camera3D.lookAt(new Vector3(0, 0.8, 0));
    const baseline = await draw(terrainScene);
    const marker = new Mesh({
      geometry: Geometry.sphere(0.12, 16, 12),
      material: new TextureMaterial({ texture, color: [1, 0, 0] }),
      position: [1, height + 0.25, 1],
    });
    terrainScene.add(marker);
    const above = await draw(terrainScene);
    const red = (r: number, g: number, b: number): boolean =>
      r > 80 && r > g * 2 && r > b * 2;
    const aboveMarker = colored(above, red);
    const projected = terrainScene.camera3D
      .updateMatrix(1)
      .transformPoint(new Vector3(1, height + 0.25, 1));
    const expectedX = ((projected.x + 1) * above.width) / 2;
    const expectedY = ((1 - projected.y) * above.height) / 2;
    check(
      aboveMarker.count > 20 &&
        Math.hypot(aboveMarker.x - expectedX, aboveMarker.y - expectedY) < 3,
      'Elevated marker renders at the pixel projected from heightAt.',
    );
    marker.position.y = height - 0.25;
    const below = await draw(terrainScene);
    const belowMarker = colored(below, red);
    check(
      belowMarker.count < 3 && difference(baseline, below) < 3,
      `The same marker below heightAt is occluded by the rendered terrain: red=${JSON.stringify(belowMarker)}, changed=${difference(baseline, below)}.`,
    );
    save('nature-terrain-height-above', above, {
      height,
      asymmetric,
      aboveMarker,
      expectedX,
      expectedY,
    });
    save('nature-terrain-height-below', below, { height, belowMarker });

    const waterScene = scene(6);
    waterScene.camera3D.position.set(0, 5, 6);
    waterScene.camera3D.lookAt(new Vector3());
    waterScene.add(water);
    water.visible = false;
    const waterEmpty = await draw(waterScene);
    water.visible = true;
    water.setTime(0);
    const waterA = await draw(waterScene);
    const waterRepeat = await draw(waterScene);
    water.setTime(0.75);
    const waterB = await draw(waterScene);
    const waterPixels = difference(waterEmpty, waterA);
    const waterChanged = difference(waterA, waterB);
    check(waterPixels > 1000, 'Water renders a nonblank native surface.');
    check(
      difference(waterA, waterRepeat) < 3,
      'Water at a fixed time has stable GPU pixels.',
    );
    check(
      waterChanged > 200,
      'Water GPU pixels change between fixed simulation times.',
    );
    save('nature-water-time-0', waterA, { time: 0, waterPixels });
    save('nature-water-time-075', waterB, { time: 0.75, waterChanged });

    const trailScene = scene(4);
    trailScene.add(trail);
    const trailA = await draw(trailScene);
    const magenta = (r: number, g: number, b: number): boolean =>
      r > 80 && b > 60 && r > g * 2;
    const trailFirst = colored(trailA, magenta);
    check(
      trailFirst.count > 200 && trail.pointCount === 3,
      'Trail3D samples a moving target and produces visible pixels.',
    );
    trail.clear();
    for (let i = 0; i < 3; i++) {
      target.position.set(-1 + i, 0.7, 0);
      trail.sample(0.3 + i * 0.1, [0, 0, 1]);
    }
    const trailB = await draw(trailScene);
    const trailSecond = colored(trailB, magenta);
    check(
      trailSecond.count > 200 &&
        trailFirst.y - trailSecond.y > 70 &&
        difference(trailA, trailB) > 400,
      'Trail3D GPU pixels follow the target to its new path.',
    );
    save('nature-trail-first-path', trailA, { trailFirst });
    save('nature-trail-moved-path', trailB, { trailSecond });

    const grassScene = scene(4);
    grassScene.camera3D.position.set(0, 1, 8);
    grassScene.camera3D.lookAt(new Vector3(0, 1, 0));
    grassScene.add(grass);
    vegetation.update(0);
    const grassA = await draw(grassScene);
    const grassRepeat = await draw(grassScene);
    vegetation.update(Math.PI / 2);
    const grassB = await draw(grassScene);
    const green = (r: number, g: number, b: number): boolean =>
      g > 60 && g > r * 2 && g > b * 2;
    const grassFirst = colored(grassA, green);
    const grassSecond = colored(grassB, green);
    const grassChanged = difference(grassA, grassB);
    check(
      grassFirst.count > 300 && grassSecond.count > 300,
      'VegetationMaterial grass renders visible native pixels.',
    );
    check(
      difference(grassA, grassRepeat) < 3,
      'Grass at a fixed time has stable GPU pixels.',
    );
    check(
      grassChanged > 300 && grassSecond.x - grassFirst.x > 8,
      'VegetationMaterial grass visibly sways in the requested wind direction at fixed times.',
    );
    save('nature-grass-time-0', grassA, { time: 0, grassFirst });
    save('nature-grass-time-quarter-wave', grassB, {
      time: Math.PI / 2,
      grassSecond,
      grassChanged,
    });
    check(
      proofs.graphicsEvents.length === 0,
      'Nature captures have no native graphics errors or loss.',
    );
  } catch (error) {
    report.error = errorDetail(error);
  } finally {
    // Check graphics events before teardown: destroying the owned device is intentional.
    renderer?.destroy();
    for (const value of owned.reverse()) value.destroy();
    output.textContent = JSON.stringify(report, null, 2);
    output.dataset.state = report.error ? 'failed' : 'passed';
  }
}
void run();

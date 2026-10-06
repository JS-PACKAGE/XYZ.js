import {
  EnvironmentMap,
  Game,
  Geometry,
  Mesh,
  PBRMaterial,
  Scene,
  Terrain3D,
  TerrainSplatMaterial,
  Texture,
  TextureMaterial,
  Trail3D,
  Vector3,
  VegetationMaterial,
  Water3D,
  createGrassGeometry,
  scatterVegetation,
  type RendererPreference,
} from '../../src/index.js';

const status = document.querySelector<HTMLParagraphElement>('#status')!;
const statsPanel = document.querySelector<HTMLParagraphElement>('#stats')!;
const parameters = new URLSearchParams(location.search);
const stress = parameters.get('stress') === '1';
const gridSize = stress ? 1000 : 129;
const grassCount = stress ? 10_000 : 1800;
const extent = 72;
const warmupFrames = 120;
const sampleCapacity = 300;
const listeners = new AbortController();

interface TimingSnapshot {
  samples: number[];
  count: number;
  p50: number | null;
  p95: number | null;
}

interface NatureReadout {
  ready: boolean;
  error: string | null;
  renderer: string | null;
  terrainSamples: number;
  terrainVertices: number;
  grassAcceptedCount: number;
  drawCalls: number;
  triangles: number;
  cpuSubmit: TimingSnapshot;
}

declare global {
  interface Window {
    __xyzWorldNature: NatureReadout;
  }
}

const readout: NatureReadout = {
  ready: false,
  error: null,
  renderer: null,
  terrainSamples: gridSize * gridSize,
  terrainVertices: gridSize * gridSize,
  grassAcceptedCount: 0,
  drawCalls: 0,
  triangles: 0,
  cpuSubmit: { samples: [], count: 0, p50: null, p95: null },
};
window.__xyzWorldNature = readout;

/** Bounded rolling samples; sorting happens only when the page readout refreshes. */
class TimingWindow {
  private readonly samples = new Float64Array(sampleCapacity);
  private readonly sorted = new Float64Array(sampleCapacity);
  private cursor = 0;
  private count = 0;

  add(milliseconds: number): void {
    this.samples[this.cursor] = milliseconds;
    this.cursor = (this.cursor + 1) % sampleCapacity;
    this.count = Math.min(this.count + 1, sampleCapacity);
  }

  clear(): void {
    this.cursor = this.count = 0;
  }

  snapshot(): TimingSnapshot {
    this.sorted.fill(Infinity);
    for (let i = 0; i < this.count; i++) this.sorted[i] = this.samples[i]!;
    this.sorted.sort();
    return {
      samples: Array.from(this.samples.subarray(0, this.count)),
      count: this.count,
      p50: this.count ? this.sorted[Math.ceil(this.count * 0.5) - 1]! : null,
      p95: this.count ? this.sorted[Math.ceil(this.count * 0.95) - 1]! : null,
    };
  }
}

function timingSummary(timing: TimingSnapshot): string {
  if (timing.p50 === null || timing.p95 === null) return 'warming up';
  return `p50 ${timing.p50.toFixed(2)} / p95 ${timing.p95.toFixed(2)} ms (${timing.count} samples)`;
}

const submissions = new TimingWindow();
const intervals = new TimingWindow();
let game: Game | undefined;
let scene: Scene | undefined;
let white: Texture | undefined;
let splat: TerrainSplatMaterial | undefined;
let wind: VegetationMaterial | undefined;
let environment: EnvironmentMap | undefined;
let restoreRender: (() => void) | undefined;
let rafHandle = 0;
let renderedFrames = 0;
let previousTimestamp: number | undefined;

function release(): void {
  listeners.abort();
  cancelAnimationFrame(rafHandle);
  restoreRender?.();
  restoreRender = undefined;
  try {
    game?.destroy();
    scene?.destroy();
  } finally {
    wind?.destroy();
    splat?.destroy();
    environment?.destroy();
    white?.destroy();
  }
}

function heightAt(x: number, z: number): number {
  return (
    1.8 +
    Math.sin(x * 0.18) * 0.7 +
    Math.cos(z * 0.14) * 0.6 -
    4 * Math.exp(-(x * x + z * z) / 100)
  );
}

function colorTile(r: number, g: number, b: number): ImageData {
  const image = new ImageData(16, 16);
  for (let z = 0; z < image.height; z++) {
    for (let x = 0; x < image.width; x++) {
      const offset = (z * image.width + x) * 4;
      const grain = ((x * 17 + z * 31) % 13) - 6;
      image.data[offset] = r + grain;
      image.data[offset + 1] = g + grain;
      image.data[offset + 2] = b + grain;
      image.data[offset + 3] = 255;
    }
  }
  return image;
}

try {
  const renderer = (parameters.get('renderer') ?? 'auto') as RendererPreference;
  if (renderer === 'canvas2d')
    throw new Error(
      'Canvas2D is unsupported: terrain, water, trails and vegetation require native 3D. Use ?renderer=webgl2 or ?renderer=webgpu.',
    );
  game = await Game.create({
    canvas: '#game',
    width: 960,
    height: 540,
    pixelRatio: 1,
    renderer,
  });
  const runtime = game;
  runtime.addEventListener(
    'error',
    (event) => {
      readout.ready = false;
      readout.error = (event as CustomEvent<Error>).detail.message;
      status.textContent = readout.error;
    },
    { signal: listeners.signal },
  );
  if (!runtime.graphics.capabilities.threeD)
    throw new Error(
      'Canvas2D is unsupported: this nature scene requires native 3D.',
    );

  white = await Texture.fromImage(
    new ImageData(new Uint8ClampedArray([255, 255, 255, 255]), 1, 1),
  );
  const texture = white;
  const weights = new ImageData(128, 128);
  for (let z = 0; z < weights.height; z++) {
    for (let x = 0; x < weights.width; x++) {
      const wx = (x / (weights.width - 1) - 0.5) * extent;
      const wz = (z / (weights.height - 1) - 0.5) * extent;
      const sand = Math.max(0, Math.min(1, (1.2 - heightAt(wx, wz)) / 1.6));
      const rock = Math.max(0, Math.min(1, (heightAt(wx, wz) - 2.3) / 0.8));
      const offset = (z * weights.width + x) * 4;
      weights.data[offset] = (1 - sand) * (1 - rock) * 255;
      weights.data[offset + 1] = sand * 255;
      weights.data[offset + 2] = rock * (1 - sand) * 255;
    }
  }
  splat = await TerrainSplatMaterial.create({
    layers: [
      { baseColor: colorTile(73, 105, 42), roughness: 0.95, scale: [24, 24] },
      { baseColor: colorTile(191, 169, 114), roughness: 0.9, scale: [20, 20] },
      { baseColor: colorTile(113, 119, 121), roughness: 0.8, scale: [18, 18] },
    ],
    weights,
    size: 256,
  });
  const terrainMaterial = splat.material;
  wind = new VegetationMaterial({
    texture,
    color: [0.3, 0.66, 0.13],
    roughness: 0.9,
    alphaMode: 'OPAQUE',
    doubleSided: true,
    windAmplitude: 0.32,
    windFrequency: 2.3,
    windDirection: [1, 0.4],
    bladeHeight: 0.9,
  });
  const grassMaterial = wind;
  environment = EnvironmentMap.gradient({
    zenith: [0.12, 0.3, 0.58],
    horizon: [0.7, 0.8, 0.83],
    ground: [0.07, 0.1, 0.05],
    sun: { direction: [0.5, 0.8, 0.3], color: [8, 7, 5], radius: 0.06 },
    width: 128,
  });
  const sky = environment;

  class NatureScene extends Scene {
    private terrain!: Terrain3D;
    private water!: Water3D;
    private traveler!: Mesh;
    private trail!: Trail3D;
    private readonly focus = new Vector3(0, 1, 0);
    private time = 0;
    acceptedGrass = 0;
    grassBatches = 0;

    protected override async initialize(game: Game): Promise<void> {
      this.ambientLight = 0.35;
      this.directionalLight.intensity = 2;
      this.directionalLight.direction.set(0.5, 0.8, 0.3).normalize();
      this.environment = sky;
      this.background = sky;
      this.camera3D.far = 240;
      const heights = new Float32Array(gridSize * gridSize);
      for (let z = 0; z < gridSize; z++) {
        const wz = (z / (gridSize - 1) - 0.5) * extent;
        for (let x = 0; x < gridSize; x++) {
          const wx = (x / (gridSize - 1) - 0.5) * extent;
          heights[z * gridSize + x] = heightAt(wx, wz);
        }
      }
      this.terrain = this.add(
        new Terrain3D({
          heightmap: { width: gridSize, height: gridSize, heights },
          material: terrainMaterial,
          width: extent,
          depth: extent,
          chunkSize: 64,
          lodDistances: stress ? [0] : [0, 36, 72],
          skirtDepth: 1,
          castShadow: false,
        }),
      );
      this.water = this.add(
        new Water3D({
          texture,
          width: 25,
          depth: 25,
          segments: 64,
          waves: [
            { direction: [1, 0.3], amplitude: 0.12, wavelength: 4, speed: 1.3 },
            {
              direction: [-0.4, 1],
              amplitude: 0.06,
              wavelength: 2.5,
              speed: 1.8,
            },
          ],
          foam: { threshold: 0.07, fade: 0.13, strength: 0.65 },
          materialOptions: {
            color: [0.16, 0.48, 0.58],
            roughness: 0.14,
            transmission: 0.5,
            thickness: 0.7,
            attenuationColor: [0.3, 0.72, 0.8],
            attenuationDistance: 4,
          },
          castShadow: false,
        }),
      );
      const normal = new Vector3();
      const surface = {
        height: 0,
        normal: [0, 1, 0] as [number, number, number],
      };
      const grass = scatterVegetation({
        geometry: createGrassGeometry(0.14, 0.9, 4),
        material: grassMaterial,
        count: grassCount,
        seed: 73,
        bounds: { minX: 14, maxX: 34, minZ: -34, maxZ: 34 },
        scale: [0.7, 1.5],
        tileSize: 8,
        batchSize: 1024,
        fadeStart: stress ? 160 : 90,
        fadeEnd: stress ? 200 : 130,
        castShadow: false,
        sampleSurface: (x, z) => {
          surface.height = this.terrain.heightAt(x, z)!;
          this.terrain.normalAt(x, z, normal);
          surface.normal[0] = normal.x;
          surface.normal[1] = normal.y;
          surface.normal[2] = normal.z;
          return surface;
        },
      });
      this.add(grass.root);
      this.acceptedGrass = grass.acceptedCount;
      this.grassBatches = grass.batches.length;
      this.traveler = this.add(
        new Mesh({
          geometry: Geometry.sphere(0.45, 16, 12),
          material: new PBRMaterial({
            texture,
            color: [1, 0.6, 0.12],
            emissive: [0.3, 0.1, 0.01],
            roughness: 0.3,
            alphaMode: 'OPAQUE',
          }),
          castShadow: false,
        }),
      );
      this.trail = this.add(
        new Trail3D({
          target: this.traveler,
          material: new TextureMaterial({ texture, transparent: true }),
          mode: 'flat',
          maxPoints: 256,
          lifetime: 4,
          minimumDistance: 0.08,
          curve: [
            { age: 0, width: 0.65, color: [1, 0.7, 0.2, 0.9] },
            { age: 0.5, width: 0.35, color: [1, 0.3, 0.08, 0.6] },
            { age: 1, width: 0, color: [0.6, 0.12, 0.02, 0] },
          ],
        }),
      );
      this.update(0);
      if (!game.graphics.prepareNativePBRMaterial)
        throw new Error(
          'This renderer cannot prepare native PBR nature materials.',
        );
      await game.graphics.prepareNativePBRMaterial(terrainMaterial);
      await game.graphics.prepareNativePBRMaterial(this.water.material);
      await game.graphics.prepareNativePBRMaterial(grassMaterial);
    }

    override update(deltaTime: number): void {
      this.time += deltaTime;
      this.water.setTime(this.time);
      grassMaterial.update(this.time);
      const phase = this.time * 0.45;
      const x = Math.cos(phase) * 12;
      const z = Math.sin(phase) * 9;
      this.traveler.transform.position.set(
        x,
        Math.max(this.terrain.heightAt(x, z)!, 0.2) + 1.6,
        z,
      );
      this.trail.sample(this.time);
      const angle = 0.65 + Math.sin(this.time * 0.08) * 0.3;
      const distance = stress ? 88 : 54;
      this.camera3D.position.set(
        Math.cos(angle) * distance,
        stress ? 70 : 32,
        Math.sin(angle) * distance,
      );
      this.camera3D.lookAt(this.focus);
    }
  }

  const nature = new NatureScene();
  scene = nature;
  await runtime.setScene(nature);

  // Example-local instrumentation: preserve the normal Game loop and renderer receiver.
  const graphics = runtime.graphics;
  const beginFrame = graphics.beginFrame;
  const endFrame = graphics.endFrame;
  let submitStarted = 0;
  graphics.beginFrame = (): void => {
    submitStarted = performance.now();
    beginFrame.call(graphics);
  };
  graphics.endFrame = (): void => {
    endFrame.call(graphics);
    const milliseconds = performance.now() - submitStarted;
    renderedFrames++;
    if (renderedFrames > warmupFrames) submissions.add(milliseconds);
  };
  restoreRender = () => {
    graphics.beginFrame = beginFrame;
    graphics.endFrame = endFrame;
  };
  document.addEventListener(
    'visibilitychange',
    () => {
      previousTimestamp = undefined;
      submissions.clear();
      intervals.clear();
      renderedFrames = 0;
    },
    { signal: listeners.signal },
  );

  let lastReadout = 0;
  let slowFrames = 0;
  const tick = (timestamp: number): void => {
    // Software rasterizers cannot sustain this scene and would starve the page's main thread; stop animating instead.
    if (previousTimestamp !== undefined && timestamp - previousTimestamp > 400)
      slowFrames++;
    else slowFrames = 0;
    if (slowFrames >= 4 && runtime.state === 'running') {
      runtime.pause();
      status.textContent +=
        ' Animation paused: frames took over 400 ms, so this renderer is probably software-rasterized.';
    }
    if (runtime.state === 'running' && !document.hidden) {
      if (previousTimestamp !== undefined && renderedFrames > warmupFrames)
        intervals.add(timestamp - previousTimestamp);
      previousTimestamp = timestamp;
    } else {
      previousTimestamp = undefined;
    }
    if (timestamp - lastReadout >= 500) {
      lastReadout = timestamp;
      const stats = graphics.stats;
      readout.cpuSubmit = submissions.snapshot();
      readout.drawCalls = stats.drawCalls;
      readout.triangles = stats.triangles;
      statsPanel.textContent = [
        `CPU submit (beginFrame/render/endFrame): ${timingSummary(readout.cpuSubmit)}.`,
        `RAF interval: ${timingSummary(intervals.snapshot())}.`,
        `Frame ${stats.frame} · meshes ${stats.meshes} · culled ${stats.culled} · draws ${stats.drawCalls} · triangles ${stats.triangles.toLocaleString()} · grass batches ${nature.grassBatches} · uploads ${(stats.uploadBytes / 1024).toFixed(1)} KiB.`,
        'Rolling 300-frame window after 120 warmup frames; CPU submit includes renderer.render and queue submission, excludes scene update and GPU completion. RAF is display-paced wall time, not GPU execution time.',
      ].join('\n');
    }
    rafHandle = requestAnimationFrame(tick);
  };
  status.textContent = `${graphics.backend} · ${stress ? 'stress' : 'standard'} · ${gridSize * gridSize} heightfield vertices (source grid; chunk borders, skirts and LODs add geometry) · ${nature.acceptedGrass} grass instances · terrain splat, water waves/foam, moving mesh trail and wind.`;
  readout.renderer = graphics.backend;
  readout.grassAcceptedCount = nature.acceptedGrass;
  readout.ready = true;
  window.addEventListener(
    'pagehide',
    (event) => {
      if (!event.persisted) release();
    },
    { signal: listeners.signal },
  );
  runtime.start();
  rafHandle = requestAnimationFrame(tick);
} catch (error) {
  release();
  readout.ready = false;
  readout.error = error instanceof Error ? error.message : String(error);
  status.textContent = readout.error;
}

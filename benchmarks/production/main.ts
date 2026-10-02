import {
  Game,
  Scene,
  Sprite,
  Mesh,
  Geometry,
  PBRMaterial,
  PointLight,
  SpotLight,
  type RendererPreference,
  type Texture,
  type TextureLease,
} from '../../src/index.js';
import {
  productionQualityProfiles,
  productionRegressionWorkload as regressionSettings,
} from '../../src/data/observability.js';
import {
  DenseOverlapWorkload,
  ReplanningWorkload,
  VisibilityWorkload,
} from './regression.js';
import { BoundedTiming } from '../measurement.js';
import { BrowserObservations, browserProvenance } from '../observability.js';

const params = new URLSearchParams(location.search);
const kind = params.get('workload') ?? '2d';
const backend = params.get('renderer') ?? 'webgpu';
const quality = params.get('quality') ?? 'baseline';
if (!Object.hasOwn(productionQualityProfiles, quality))
  throw new Error('Use quality=baseline|low|high.');
const counts =
  productionQualityProfiles[quality as keyof typeof productionQualityProfiles];
const threeD = kind === '3d' || kind === 'visibility';
const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
canvas.style.width = `${counts.width}px`;
canvas.style.height = `${counts.height}px`;
if (
  !['2d', '3d', 'dense2d', 'navigation', 'visibility'].includes(kind) ||
  !['canvas2d', 'webgl2', 'webgpu'].includes(backend)
)
  throw new Error('Invalid production workload or renderer.');
const output = document.querySelector<HTMLPreElement>('#result')!;
const stages = Object.fromEntries(
  ['warmup', 'steady', 'asset-loading'].map((stage) => [
    stage,
    {
      frameIntervalMs: new BoundedTiming(counts.hitchMilliseconds),
      cpuFrameWorkMs: new BoundedTiming(counts.hitchMilliseconds),
      cpuSimulationMs: new BoundedTiming(counts.hitchMilliseconds),
      cpuSubmitMs: new BoundedTiming(counts.hitchMilliseconds),
      gpuNativePassSumMs: new BoundedTiming(counts.hitchMilliseconds),
    },
  ]),
) as Record<string, Record<string, BoundedTiming>>;
const operations = {
  gameCreateWallMs: 0,
  initialAssetsWallMs: 0,
  scenePublishWallMs: 0,
  overlapAssetLoadsWallMs: [] as number[],
  teardownWallMs: 0,
};
const peaks = {
  decodedTextureEstimateBytes: 0,
  nativeTextureEstimateBytes: 0,
  nativeGeometryEstimateBytes: 0,
  renderTargetEstimateBytes: 0,
};
const leases: TextureLease[] = [];
const assets: Texture[] = [];
let game: Game | undefined;
let observations: BrowserObservations | undefined;
let handle = 0;
let stage = 'warmup';
let frame = 0;
let lastWorkFrame = 0;
let lastGpuFrame = 0;
let previous = 0;
let loadStartFrame = 0;
let loadComplete = false;
let stageStarted = 0;
const stageWallMs: Record<string, number> = {};
let failed: unknown;
const gpuStages = new Uint8Array(512);
const gpuFrames = new Float64Array(512);
const stageNames = ['warmup', 'steady', 'asset-loading'];
let unattributedGpuSamples = 0;

class WorkloadScene extends Scene {
  readonly movingSprites: Sprite[] = [];
  readonly movingMeshes: Mesh[] = [];
  readonly dense?: DenseOverlapWorkload;
  readonly replanning?: ReplanningWorkload;
  readonly visibilityWorkload?: VisibilityWorkload;
  private elapsed = 0;
  constructor() {
    super({ navigationWorkBudget: regressionSettings.navigationWorkBudget });
    const spriteCount = threeD ? counts.overlaySprites3D : counts.sprites2D;
    const spriteRowHeight = Math.min(
      28,
      counts.height / Math.ceil(spriteCount / 32),
    );
    for (let index = 0; index < spriteCount; index++) {
      this.movingSprites.push(
        this.add(
          new Sprite({
            texture: assets[index % assets.length]!,
            position: [
              (index % 32) * (counts.width / 32) + counts.width / 64,
              Math.floor(index / 32) * spriteRowHeight + spriteRowHeight / 2,
            ],
            scale: [0.35, 0.35],
            opacity: index < counts.transparentSprites2D ? 0.55 : 1,
          }),
        ),
      );
    }
    if (threeD) {
      this.camera3D.position.set(0, 0, 28);
      this.ambientLight = 0.2;
      this.directionalLight.intensity = 1;
      const geometry = Geometry.cube();
      const meshCount =
        kind === 'visibility'
          ? regressionSettings.visibleMeshes
          : counts.meshes3D;
      const columns = Math.ceil(Math.sqrt(meshCount));
      const rows = Math.ceil(meshCount / columns);
      for (let index = 0; index < meshCount; index++) {
        const transparent = index < counts.transparentMeshes3D;
        const material = new PBRMaterial({
          texture: assets[index % assets.length]!,
          metallic: 0.2,
          roughness: 0.65,
          alphaMode: transparent ? 'BLEND' : 'OPAQUE',
          opacity: transparent ? 0.45 : 1,
        });
        this.movingMeshes.push(
          this.add(
            new Mesh({
              geometry,
              material,
              position: [
                ((index % columns) - (columns - 1) / 2) * (22.4 / columns),
                (Math.floor(index / columns) - (rows - 1) / 2) * (17.6 / rows),
                -(index % 4),
              ],
              scale: [0.6, 0.6, 0.6],
            }),
          ),
        );
      }
      for (let index = 0; index < counts.pointLights; index++)
        this.pointLights.push(
          new PointLight({
            position: [
              (index - (counts.pointLights - 1) / 2) *
                (24 / counts.pointLights),
              2,
              5,
            ],
            intensity: 12,
            range: 18,
          }),
        );
      for (let index = 0; index < counts.spotLights; index++)
        this.spotLights.push(
          new SpotLight({
            position: [
              (index - (counts.spotLights - 1) / 2) * (20 / counts.spotLights),
              8,
              5,
            ],
            direction: [0, -1, -0.5],
            intensity: 15,
            range: 24,
          }),
        );
    }
    if (kind === 'dense2d') this.dense = new DenseOverlapWorkload(this);
    if (kind === 'navigation')
      this.replanning = new ReplanningWorkload(
        this,
        this.movingSprites[this.movingSprites.length - 1]!,
      );
    if (kind === 'visibility')
      this.visibilityWorkload = new VisibilityWorkload(
        this,
        assets[0]!,
        this.movingMeshes.length,
      );
  }
  override update(delta: number): void {
    for (const sprite of this.movingSprites) {
      sprite.position.x = (sprite.position.x + delta * 30) % counts.width;
      sprite.rotation += delta * 0.25;
    }
    this.elapsed += delta;
    for (const mesh of this.movingMeshes)
      mesh.rotation.setFromEuler(this.elapsed * 0.2, this.elapsed * 0.4, 0);
    this.replanning?.update();
    this.visibilityWorkload?.update();
  }
  override fixedUpdate(): void {
    this.dense?.update();
  }
  protected override onDestroy(): void {
    this.replanning?.destroy();
  }
}

try {
  let start = performance.now();
  game = await Game.create({
    canvas: '#game',
    renderer: backend as RendererPreference,
    width: counts.width,
    height: counts.height,
    pixelRatio: counts.pixelRatio,
    autoResize: false,
    gpuTiming: { enabled: true, warmupFrames: counts.warmupFrames },
    frameWorkBudgetMs: counts.hitchMilliseconds,
  });
  operations.gameCreateWallMs = performance.now() - start;
  const runtime = game;
  if (runtime.graphics.backend !== backend)
    throw new Error(
      'Functional workload failure: requested backend was not used.',
    );
  if (threeD && !runtime.graphics.capabilities.threeD)
    throw new Error(
      'Explicit unsupported: selected backend has no 3D renderer.',
    );
  observations = new BrowserObservations();
  start = performance.now();
  for (let index = 0; index < counts.textures; index++) {
    const lease = await runtime.assets.acquireTexture(
      new URL(
        `../../examples/sprite/texture.png?production-initial=${index}`,
        import.meta.url,
      ).href,
    );
    leases.push(lease);
    assets.push(lease.texture);
  }
  operations.initialAssetsWallMs = performance.now() - start;
  const scene = new WorkloadScene();
  start = performance.now();
  await runtime.setScene(scene);
  operations.scenePublishWallMs = performance.now() - start;
  const provenance = await browserProvenance(
    runtime.canvas,
    runtime.graphics.backend,
  );
  runtime.addEventListener('error', (event) => {
    failed = (event as CustomEvent<Error>).detail;
  });
  runtime.start();
  const measurementStarted = performance.now();
  stageStarted = measurementStarted;
  await new Promise<void>((resolve, reject) => {
    const observe = (now: number): void => {
      try {
        if (failed) throw failed;
        if (
          now - measurementStarted >
          regressionSettings.maximumWallSeconds * 1000
        )
          throw new Error(
            'Workload exceeded its bounded measurement deadline.',
          );
        if (document.hidden)
          throw new Error(
            'Workload interrupted by hidden page; results invalid.',
          );
        const work = runtime.frameWork;
        if (work.frame > lastWorkFrame) {
          lastWorkFrame = work.frame;
          if (frame === 0) output.dataset.state = 'measuring';
          const timing = stages[stage]!;
          if (previous) timing.frameIntervalMs!.add(now - previous);
          previous = now;
          timing.cpuFrameWorkMs!.add(work.totalMs);
          timing.cpuSimulationMs!.add(work.simulationMs);
          timing.cpuSubmitMs!.add(work.renderSubmitMs);
          frame++;
          const stats = runtime.graphics.stats;
          scene.visibilityWorkload?.observe(stats);
          const history = stats.frame % gpuFrames.length;
          gpuFrames[history] = stats.frame;
          gpuStages[history] = stageNames.indexOf(stage);
          const gpu = stats.gpuTiming;
          if (
            gpu.sampledFrame !== null &&
            gpu.sampledFrame > lastGpuFrame &&
            gpu.milliseconds !== null
          ) {
            lastGpuFrame = gpu.sampledFrame;
            const slot = gpu.sampledFrame % gpuFrames.length;
            if (gpuFrames[slot] === gpu.sampledFrame)
              stages[stageNames[gpuStages[slot]!]!]!.gpuNativePassSumMs!.add(
                gpu.milliseconds,
              );
            else unattributedGpuSamples++;
          }
          peaks.decodedTextureEstimateBytes = Math.max(
            peaks.decodedTextureEstimateBytes,
            runtime.assets.residency.liveBytes,
          );
          peaks.nativeTextureEstimateBytes = Math.max(
            peaks.nativeTextureEstimateBytes,
            runtime.graphics.residency.textures.liveBytes,
          );
          peaks.nativeGeometryEstimateBytes = Math.max(
            peaks.nativeGeometryEstimateBytes,
            runtime.graphics.residency.geometry.liveBytes,
          );
          peaks.renderTargetEstimateBytes = Math.max(
            peaks.renderTargetEstimateBytes,
            stats.renderTargetBytes,
          );
          observations!.sample(now);
          if (stage === 'warmup' && frame >= counts.warmupFrames) {
            stageWallMs[stage] = now - stageStarted;
            stage = 'steady';
            stageStarted = now;
          }
          if (
            stage === 'steady' &&
            frame >= counts.warmupFrames + counts.measuredFrames &&
            now - stageStarted >= regressionSettings.minimumSteadySeconds * 1000
          ) {
            stage = 'asset-loading';
            stageWallMs.steady = now - stageStarted;
            stageStarted = now;
            loadStartFrame = frame;
            void (async () => {
              for (let index = 0; index < counts.textures; index++) {
                const start = performance.now();
                const lease = await runtime.assets.acquireTexture(
                  new URL(
                    `../../examples/sprite/texture.png?production-overlap=${index}`,
                    import.meta.url,
                  ).href,
                );
                leases.push(lease);
                scene.movingSprites[index]!.texture = lease.texture;
                operations.overlapAssetLoadsWallMs.push(
                  performance.now() - start,
                );
              }
              loadComplete = true;
            })().catch((error: unknown) => {
              failed = error;
            });
          }
          if (
            stage === 'asset-loading' &&
            loadComplete &&
            frame - loadStartFrame >= counts.loadStageFrames &&
            now - stageStarted >=
              regressionSettings.minimumLoadingSeconds * 1000
          ) {
            stageWallMs[stage] = now - stageStarted;
            resolve();
            return;
          }
        }
        handle = requestAnimationFrame(observe);
      } catch (error) {
        reject(error);
      }
    };
    handle = requestAnimationFrame(observe);
  });
  runtime.pause();
  const browserObservations = observations.stop();
  observations = undefined;
  const renderStats = {
    ...runtime.graphics.stats,
    gpuTiming: { ...runtime.graphics.stats.gpuTiming },
  };
  const semantics = {
    denseOverlap: scene.dense?.validate() ?? null,
    navigationReplanning: scene.replanning?.validate() ?? null,
    visibility: scene.visibilityWorkload?.validate() ?? null,
  };
  if (
    scene.movingSprites.some(
      (sprite) =>
        !Number.isFinite(sprite.position.x) ||
        !Number.isFinite(sprite.rotation),
    ) ||
    (threeD ? renderStats.drawCalls === 0 : renderStats.drawCalls2D === 0)
  )
    throw new Error(
      'Functional workload failure: invalid poses or missing native render work.',
    );
  start = performance.now();
  runtime.destroy();
  game = undefined;
  for (const lease of leases) lease.release();
  operations.teardownWallMs = performance.now() - start;
  if (
    !scene.destroyed ||
    scene.objects.size !== 0 ||
    runtime.assets.residency.liveBytes !== 0 ||
    runtime.graphics.residency.textures.liveBytes !== 0 ||
    runtime.graphics.residency.geometry.liveBytes !== 0
  )
    throw new Error(
      'Functional workload failure: teardown left scene or cache allocations live.',
    );
  const result = {
    schema: 'xyz-production-workload-v2',
    result: 'PASS',
    date: new Date().toISOString(),
    workload: kind,
    backend,
    quality,
    provenance,
    counts,
    regressionSettings,
    stageWallMs,
    semantics,
    operations,
    stages: Object.fromEntries(
      Object.entries(stages).map(([name, timings]) => [
        name,
        Object.fromEntries(
          Object.entries(timings).map(([metric, timing]) => [
            metric,
            timing.snapshot(),
          ]),
        ),
      ]),
    ),
    memoryPeaks: peaks,
    browserObservations,
    renderStats,
    unattributedGpuSamples,
    timingScope:
      'RAF wall intervals; CPU frame work/simulation/submission; asynchronous sum native recorded render/compute pass durations excluding gaps/queue/presentation. Asset loads are wall time while frames continue. Memory estimates, JS heap, process RSS and GC are separate. No universal FPS guarantee.',
  };
  output.textContent = JSON.stringify(result, null, 2);
  output.dataset.state = 'complete';
} catch (error) {
  output.textContent = JSON.stringify({
    result: 'FAIL',
    failureKind: 'functional',
    error: String(error),
    workload: kind,
    backend,
  });
  output.dataset.state = 'failed';
} finally {
  cancelAnimationFrame(handle);
  observations?.stop();
  game?.destroy();
  for (const lease of leases) lease.release();
}

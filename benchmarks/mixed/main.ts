import {
  Game,
  Scene,
  Geometry,
  Mesh,
  TextureMaterial,
  RigidBody3D,
  BoxCollider3D,
  PlaneCollider3D,
  Object3D,
  GameObject,
  Collider2D,
  Vector2,
  Vector3,
  Sprite,
  NavigationGrid2D,
  NavigationGridBakeJob2D,
  type NavigationScheduledSearch,
  type NavigationGridPath2D,
  UIRoot,
  UILabel,
  UIButton,
  type RendererPreference,
  type ResidencyStats,
  type ResourceBudgets,
  type TextureLease,
} from '../../src/index.js';
import { BoundedTiming, BoundedTrend, settings } from '../measurement.js';
import { BrowserObservations, browserProvenance } from '../observability.js';
import {
  measurementDefaults,
  soakWorkload,
} from '../../src/data/observability.js';

const params = new URLSearchParams(location.search);
function number(
  name: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const value = Number(params.get(name) ?? fallback);
  if (!Number.isFinite(value) || value < min || value > max)
    throw new RangeError(`${name} must be in [${min}, ${max}].`);
  return value;
}
const output = document.querySelector<HTMLPreElement>('#result')!;
type Phase = 'setup' | 'warmup' | 'running' | 'churn' | 'capture' | 'cleanup';
const phases: Phase[] = [
  'setup',
  'warmup',
  'running',
  'churn',
  'capture',
  'cleanup',
];
const timings = Object.fromEntries(
  phases.map((phase) => [
    phase,
    {
      raf: new BoundedTiming(),
      cpuSimulationWorkMs: new BoundedTiming(),
      cpuPhysicsUpdateMs: new BoundedTiming(),
      cpuSubmitMs: new BoundedTiming(),
    },
  ]),
) as Record<
  Phase,
  {
    raf: BoundedTiming;
    cpuSimulationWorkMs: BoundedTiming;
    cpuPhysicsUpdateMs: BoundedTiming;
    cpuSubmitMs: BoundedTiming;
  }
>;
const operations = {
  gameCreateMs: new BoundedTiming(),
  assetEncodeMs: new BoundedTiming(),
  assetLoadMs: new BoundedTiming(),
  uiRasterMs: new BoundedTiming(),
  scenePublishAndWarmupMs: new BoundedTiming(),
  captureWallMs: new BoundedTiming(),
  cleanupMs: new BoundedTiming(),
};
const frameWorkTimings = {
  totalMs: new BoundedTiming(),
  simulationMs: new BoundedTiming(),
  navigationMs: new BoundedTiming(),
  afterUpdateMs: new BoundedTiming(),
  renderSubmitMs: new BoundedTiming(),
};
const frameWorkTimingNames = Object.keys(
  frameWorkTimings,
) as (keyof typeof frameWorkTimings)[];
const gpuExecution = new BoundedTiming();
const steadyGpuExecution = new BoundedTiming();
const gpuFrameIds = new Float64Array(soakWorkload.gpuPhaseHistoryFrames);
const gpuFramePhases = new Uint8Array(soakWorkload.gpuPhaseHistoryFrames);
let lastGpuSample = 0;
let unattributedGpuSamples = 0;
let lastWorkFrame = 0;
let frameWorkOverBudget = 0;
let navigationWorkMaximum = 0;
let navigationBakeWork = 0;
let nextObservationSeconds = 0;
let navigationBakesCompleted = 0;
let navigationBakedBlockedCells = 0;
let networkRequests = 0;
let networkBytes = 0;
const networkWorkload = new BoundedTiming();
let browserObservations: BrowserObservations | undefined;
let phase: Phase = 'setup';
let game: Game | undefined;
let resourceBudgets: ResourceBudgets | undefined;
let budgetAccounting: Readonly<Record<string, number>> | undefined;
let rafHandle = 0;
let failure: unknown;
let simulationMs = 0;
let completedCycles = 0;
let assetChanges = 0;
let capturesCreated = 0;
let capturesDestroyed = 0;
let leasesAcquired = 0;
let leasesReleased = 0;
let cleanupAssertions = 0;
let routeChanges = 0;
let foundRoutes = 0;
let candidateMax = 0;
let narrowphaseMax = 0;
let physicsStatsAvailable = false;
let spatialRefreshMaximum: number | null = null;
let spatialPoseChecksMaximum: number | null = null;
let spatialRefitsMaximum: number | null = null;
const allRaf = new BoundedTiming();
const trends = {
  decodedBytes: new BoundedTrend(),
  nativeTextureBytes: new BoundedTrend(),
  nativeGeometryBytes: new BoundedTrend(),
  attachmentBytes: new BoundedTrend(),
  decodedEvictions: new BoundedTrend(),
  nativeTextureEvictions: new BoundedTrend(),
};
const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};
async function timed<T>(
  metric: BoundedTiming,
  work: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  try {
    return await work();
  } finally {
    metric.add(performance.now() - start);
  }
}
async function wait(milliseconds: number): Promise<void> {
  await new Promise<void>((resolve) =>
    window.setTimeout(resolve, milliseconds),
  );
  if (failure) throw failure;
  if (document.hidden) throw new Error('Benchmark aborted: hidden tab.');
}
function residencySnapshot(stats: ResidencyStats) {
  return {
    budgetBytes: stats.budgetBytes,
    liveBytes: stats.liveBytes,
    peakBytes: stats.peakBytes,
    entries: stats.entries,
    evictions: stats.evictions,
  };
}
let randomState = 1;
function random(): number {
  randomState ^= randomState << 13;
  randomState ^= randomState >>> 17;
  randomState ^= randomState << 5;
  return (randomState >>> 0) / 4294967296;
}
function release(lease: TextureLease): void {
  if (!lease.released) {
    lease.release();
    leasesReleased++;
  }
}
async function image(runtime: Game): Promise<TextureLease> {
  const source = document.createElement('canvas');
  source.width = source.height = 128;
  const paint = source.getContext('2d')!;
  paint.fillStyle = `hsl(${Math.floor(random() * 360)} 70% 55%)`;
  paint.fillRect(0, 0, 128, 128);
  paint.fillStyle = '#ffffff';
  paint.fillRect(12, 12, 40, 40);
  const blob = await timed(
    operations.assetEncodeMs,
    () =>
      new Promise<Blob>((resolve, reject) => {
        source.toBlob(
          (value) =>
            value ? resolve(value) : reject(new Error('PNG encoding failed.')),
          'image/png',
        );
      }),
  );
  const url = URL.createObjectURL(blob);
  try {
    const lease = await timed(operations.assetLoadMs, () =>
      runtime.assets.acquireTexture(url),
    );
    leasesAcquired++;
    return lease;
  } finally {
    URL.revokeObjectURL(url);
  }
}

class MixedScene extends Scene {
  readonly grid = new NavigationGrid2D({ columns: 48, rows: 48 });
  readonly sprites: Sprite[] = [];
  readonly meshes: Mesh[] = [];
  label?: UILabel;
  button?: UIButton;
  private elapsed = 0;
  private nextRoute = 0;
  private waypoint = 0;
  private route: ReadonlyArray<{ column: number; row: number }> = [];
  private readonly leases: TextureLease[] = [];
  private pendingRoute?: NavigationScheduledSearch<NavigationGridPath2D>;
  private readonly backgroundRoutes: NavigationScheduledSearch<NavigationGridPath2D>[] =
    [];
  private bake?: NavigationGridBakeJob2D;
  private readonly obstacle = new GameObject();
  uiLease?: TextureLease;
  constructor(
    private readonly count: number,
    private readonly threeD: boolean,
  ) {
    super({ navigationWorkBudget: soakWorkload.navigationWorkBudget });
    // A wall with alternating doors forces actual changing detours.
    for (let row = 0; row < 47; row++)
      this.grid.setCell(24, row, { walkable: false });
    const updateWorld = this.world.update.bind(this.world);
    this.world.update = (delta) => {
      const start = performance.now();
      try {
        updateWorld(delta);
      } finally {
        simulationMs += performance.now() - start;
      }
    };
    const updatePhysics = this.physics3D.update.bind(this.physics3D);
    this.physics3D.update = (...args: Parameters<typeof updatePhysics>) => {
      const start = performance.now();
      try {
        updatePhysics(...args);
      } finally {
        timings[phase].cpuPhysicsUpdateMs.add(performance.now() - start);
      }
    };
  }
  protected override async initialize(
    runtime: Game,
    signal: AbortSignal,
  ): Promise<void> {
    for (let index = 0; index < 4; index++) {
      const lease = await image(runtime);
      this.leases.push(lease);
      signal.throwIfAborted();
    }
    this.uiLease = await image(runtime);
    signal.throwIfAborted();
    const geometry = this.threeD ? Geometry.cube() : undefined;
    const materials = this.threeD
      ? this.leases.map(
          (lease) => new TextureMaterial({ texture: lease.texture }),
        )
      : [];
    if (this.threeD) {
      this.camera3D.position.set(0, 14, 34);
      const floor = new Object3D();
      floor.collider = new PlaneCollider3D();
      floor.position.y = -5;
      this.add(floor);
    }
    for (let index = 0; index < this.count; index++) {
      if (this.threeD) {
        const mesh = new Mesh({
          geometry: geometry!,
          material: materials[index % 4]!,
        });
        mesh.position.set(
          ((index % 20) - 9.5) * 1.1,
          1 + Math.floor(index / 20) * 1.2,
          (random() - 0.5) * 4,
        );
        // Nonuniform boxes exercise scaled geometry, not a sphere approximation.
        mesh.scale.set(0.6 + random() * 0.2, 0.5 + random() * 0.3, 0.6);
        mesh.rotation.setFromEuler(0, random() * 0.5, 0);
        mesh.collider = new BoxCollider3D(new Vector3(0.5, 0.5, 0.5));
        mesh.body = new RigidBody3D({
          restitution: 0.15,
          friction: 0.5,
          allowSleep: false,
        });
        this.meshes.push(this.add(mesh));
      } else {
        this.sprites.push(
          this.add(
            new Sprite({
              texture: this.leases[index % 4]!.texture,
              scale: [0.2, 0.2],
              space: 'screen',
            }),
          ),
        );
      }
    }
    this.sprites.push(
      this.add(
        new Sprite({
          texture: this.uiLease.texture,
          scale: [0.5, 0.5],
          position: [1150, 80],
          space: 'screen',
        }),
      ),
    );
    const root = this.add(
      new UIRoot(runtime, {
        direction: 'column',
        width: 350,
        height: 160,
        padding: 12,
        gap: 8,
      }),
    );
    this.label = root.add(
      await UILabel.create('Cycle loading', {
        layout: { width: 'fill', height: 32 },
      }),
    );
    this.button = root.add(
      await UIButton.create('Change route', {
        layout: { width: 'fill', height: 48 },
      }),
    );
    this.button.addEventListener('click', () => {
      this.nextRoute = this.elapsed;
    });
    root.focus.focus(this.button);
    this.obstacle.position.set(580, 320);
    this.obstacle.collider = new Collider2D('polygon', 0, [
      [-12, -45],
      [12, -45],
      [12, 45],
      [-12, 45],
    ]);
    this.add(this.obstacle);
    this.bake = this.navigation.scheduleBake(
      new NavigationGridBakeJob2D(this.physics, {
        columns: soakWorkload.bakeColumns,
        rows: soakWorkload.bakeRows,
        cellSize: soakWorkload.bakeCellSize,
        origin: new Vector2(420, 180),
        agentRadius: 3,
      }),
    );
  }
  override update(delta: number): void {
    const start = performance.now();
    try {
      this.elapsed += delta;
      if (this.pendingRoute && this.pendingRoute.status !== 'pending') {
        const path = this.pendingRoute.result;
        if (path?.status === 'found') {
          foundRoutes++;
          this.route = path.cells;
          this.waypoint = 0;
        }
        this.pendingRoute = undefined;
      }
      if (this.bake && this.bake.status !== 'pending') {
        const baked = this.bake.result;
        if (baked) {
          navigationBakesCompleted++;
          for (let row = 0; row < baked.rows; row++)
            for (let column = 0; column < baked.columns; column++)
              if (!baked.getCell(column, row).walkable)
                navigationBakedBlockedCells++;
          baked.destroy();
        }
        this.bake = undefined;
      }
      if (this.elapsed >= this.nextRoute) {
        this.nextRoute = this.elapsed + soakWorkload.routeIntervalSeconds;
        this.pendingRoute?.cancel();
        for (const route of this.backgroundRoutes) route.cancel();
        this.backgroundRoutes.length = 0;
        const door = routeChanges % 2 ? 12 : 35;
        this.grid.setCells([
          { column: 24, row: 12, walkable: door === 12 },
          { column: 24, row: 35, walkable: door === 35 },
        ]);
        this.pendingRoute = this.grid.scheduleSearch(
          this.navigation,
          { column: 1, row: 1 },
          { column: 46, row: 46 },
          { diagonal: true },
        );
        for (
          let index = 0;
          index < soakWorkload.navigationConcurrentSearches - 1;
          index++
        )
          this.backgroundRoutes.push(
            this.grid.scheduleSearch(
              this.navigation,
              { column: 2, row: index + 2 },
              { column: 45, row: 43 - index },
              { diagonal: true },
            ),
          );
        routeChanges++;
      }
      if (this.route.length) {
        this.waypoint = (this.waypoint + 1) % this.route.length;
        const point = this.route[this.waypoint]!;
        const marker = this.sprites[this.sprites.length - 1]!;
        marker.position.set(450 + point.column * 13, 80 + point.row * 11);
      }
      if (!this.threeD) {
        for (let index = 0; index < this.sprites.length - 1; index++) {
          const sprite = this.sprites[index]!;
          sprite.position.set(
            400 + (index % 20) * 35,
            190 + Math.floor(index / 20) * 35,
          );
          sprite.rotation += delta * (index % 2 ? 1 : -1);
        }
      } else if (this.meshes.length) {
        // Periodic real body impulses keep a long soak active rather than all asleep.
        const index = Math.floor(this.elapsed * 2) % this.meshes.length;
        const body = this.meshes[index]!.body!;
        body.velocity.y = Math.max(body.velocity.y, 2);
        const stats = (
          this.physics3D as typeof this.physics3D & {
            stats?: {
              candidatePairs: number;
              narrowphaseTests: number;
              refreshedLeaves?: number;
              poseChecks?: number;
              refits?: number;
            };
          }
        ).stats;
        if (stats) {
          physicsStatsAvailable = true;
          candidateMax = Math.max(candidateMax, stats.candidatePairs);
          narrowphaseMax = Math.max(narrowphaseMax, stats.narrowphaseTests);
          if (stats.refreshedLeaves !== undefined)
            spatialRefreshMaximum = Math.max(
              spatialRefreshMaximum ?? 0,
              stats.refreshedLeaves,
            );
          if (stats.poseChecks !== undefined)
            spatialPoseChecksMaximum = Math.max(
              spatialPoseChecksMaximum ?? 0,
              stats.poseChecks,
            );
          if (stats.refits !== undefined)
            spatialRefitsMaximum = Math.max(
              spatialRefitsMaximum ?? 0,
              stats.refits,
            );
        }
      }
    } finally {
      simulationMs += performance.now() - start;
    }
  }
  async churn(runtime: Game, cycle: number): Promise<void> {
    if (params.get('network') === '1') {
      await timed(networkWorkload, async () => {
        const response = await fetch(
          `/__xyz-soak-network?cycle=${cycle}&asset=${assetChanges}`,
          { cache: 'no-store' },
        );
        if (!response.ok)
          throw new Error(`Network workload HTTP ${response.status}.`);
        const bytes = (await response.arrayBuffer()).byteLength;
        if (bytes !== soakWorkload.networkPayloadBytes)
          throw new Error(
            'Network workload endpoint did not serve the bounded payload.',
          );
        networkRequests++;
        networkBytes += bytes;
      });
    }
    if (!this.bake) {
      this.obstacle.rotation += 0.25;
      this.bake = this.navigation.scheduleBake(
        new NavigationGridBakeJob2D(this.physics, {
          columns: soakWorkload.bakeColumns,
          rows: soakWorkload.bakeRows,
          cellSize: soakWorkload.bakeCellSize,
          origin: new Vector2(420, 180),
          agentRadius: 3,
        }),
      );
    }
    const next = await image(runtime);
    try {
      const previous = this.uiLease!;
      this.sprites[this.sprites.length - 1]!.texture = next.texture;
      this.uiLease = next;
      release(previous);
      assetChanges++;
      await timed(operations.uiRasterMs, () =>
        this.label!.setText(
          `Cycle ${cycle} / route ${routeChanges} / asset ${assetChanges}`,
        ),
      );
      this.button!.activate();
    } catch (error) {
      if (this.uiLease !== next) release(next);
      throw error;
    }
  }
  protected override onDestroy(): void {
    this.grid.destroy();
    this.bake?.cancel();
    this.bake?.result?.destroy();
    this.pendingRoute?.cancel();
    for (const route of this.backgroundRoutes) route.cancel();
    this.backgroundRoutes.length = 0;
    for (const lease of this.leases) release(lease);
    this.leases.length = 0;
    if (this.uiLease) release(this.uiLease);
    this.route = [];
    this.sprites.length = this.meshes.length = 0;
  }
}
function sceneCleanup(scene: Scene): void {
  assert(
    scene.destroyed && scene.objects.size === 0 && scene.physics3D.size === 0,
    'Scene registrations did not reach zero.',
  );
  cleanupAssertions++;
}

try {
  const duration = number('duration', 60, 1, 604800);
  const cycleSeconds = number('cycle', 3, 0.25, 3600);
  const count = Math.floor(number('bodies', 200, 1, 2000));
  const warmup = Math.floor(number('warmup', 60, 0, 600));
  const seed = Math.floor(number('seed', 42, 1, 4294967295));
  randomState = seed;
  const cube = Geometry.cube();
  const cubeBufferBytes = cube.vertices.byteLength + cube.indices.byteLength;
  // Current WebGPU plain Mesh uses 304 + 52*4 uniform bytes per object;
  // geometry residency includes those uniforms, not just shared vertex/index data.
  const meshUniformBytes = 304 + 52 * 4;
  const sceneGeometryBytes = cubeBufferBytes + count * meshUniformBytes;
  budgetAccounting = {
    cubeBufferBytes,
    meshUniformBytes,
    sceneGeometryBytes,
    overlappingScenes: 2,
    warmupGeometryWorkingSetBytes: 2 * sceneGeometryBytes,
    geometryReserveBytes: 64 * 1024,
  };
  resourceBudgets = {
    decodedTextureBytes: 1024 * 1024,
    nativeTextureBytes: 4 * 1024 * 1024,
    nativeGeometryBytes:
      Math.ceil((2 * sceneGeometryBytes + 64 * 1024) / (64 * 1024)) * 64 * 1024,
  };
  game = await timed(operations.gameCreateMs, () =>
    Game.create({
      canvas: '#game',
      renderer: (params.get('renderer') ?? 'webgl2') as RendererPreference,
      width: settings.width,
      height: settings.height,
      pixelRatio: 1,
      autoResize: false,
      resourceBudgets,
      gpuTiming: { enabled: params.get('gpuTiming') !== '0' },
      frameWorkBudgetMs: number('frameBudgetMs', 1000 / 60, 0.1, 1000),
    }),
  );
  const runtime = game;
  const provenance = await browserProvenance(
    runtime.canvas,
    runtime.graphics.backend,
  );
  browserObservations = new BrowserObservations();
  runtime.addEventListener('error', (event) => {
    failure = (event as CustomEvent<Error>).detail;
  });
  const heldStats = runtime.graphics.stats;
  const heldResidency = runtime.graphics.residency;
  const originalBegin = runtime.graphics.beginFrame.bind(runtime.graphics);
  const originalEnd = runtime.graphics.endFrame.bind(runtime.graphics);
  let submitStart = 0;
  let submitting = false;
  runtime.graphics.beginFrame = () => {
    submitting = runtime.state === 'running';
    if (submitting) {
      timings[phase].cpuSimulationWorkMs.add(simulationMs);
      simulationMs = 0;
      submitStart = performance.now();
    }
    originalBegin();
  };
  runtime.graphics.endFrame = () => {
    originalEnd();
    const gpuFrame = runtime.graphics.stats.frame;
    gpuFrameIds[gpuFrame % gpuFrameIds.length] = gpuFrame;
    gpuFramePhases[gpuFrame % gpuFramePhases.length] = phases.indexOf(phase);
    if (submitting)
      timings[phase].cpuSubmitMs.add(performance.now() - submitStart);
    submitting = false;
  };
  let previous: number | undefined;
  let lastPhase: Phase = phase;
  let observedFrames = 0;
  const observe = (timestamp: number): void => {
    if (document.hidden) {
      failure = new Error('Benchmark aborted: hidden tab.');
      return;
    }
    if (previous !== undefined) allRaf.add(timestamp - previous);
    if (previous !== undefined && phase === lastPhase)
      timings[phase].raf.add(timestamp - previous);
    previous = timestamp;
    lastPhase = phase;
    observedFrames++;
    browserObservations!.sample(timestamp);
    const sample = heldStats.gpuTiming;
    if (
      sample.status === 'available' &&
      sample.sampledFrame !== null &&
      sample.milliseconds !== null &&
      sample.sampledFrame > lastGpuSample
    ) {
      lastGpuSample = sample.sampledFrame;
      gpuExecution.add(sample.milliseconds);
      const slot = sample.sampledFrame % gpuFrameIds.length;
      if (gpuFrameIds[slot] === sample.sampledFrame) {
        if (gpuFramePhases[slot] === phases.indexOf('running'))
          steadyGpuExecution.add(sample.milliseconds);
      } else unattributedGpuSamples++;
    }
    const work = runtime.frameWork;
    if (work.enabled && work.frame > lastWorkFrame) {
      lastWorkFrame = work.frame;
      for (const name of frameWorkTimingNames)
        frameWorkTimings[name].add(work[name]);
      if (work.overBudget) frameWorkOverBudget++;
      navigationWorkMaximum = Math.max(
        navigationWorkMaximum,
        work.navigationWork,
      );
      navigationBakeWork += work.navigationBakeWork;
      assert(
        work.navigationWork <= soakWorkload.navigationWorkBudget,
        'Scene aggregate navigation work quota was exceeded.',
      );
    }
    const observationSeconds = (performance.now() - started) / 1000;
    if (observationSeconds >= nextObservationSeconds) {
      nextObservationSeconds =
        observationSeconds + measurementDefaults.memorySampleSeconds;
      (
        globalThis as typeof globalThis & { __xyzSoakObservation?: unknown }
      ).__xyzSoakObservation = {
        phase,
        completedCycles,
        elapsedSeconds: (performance.now() - started) / 1000,
        frameWork: { ...work },
        renderStats: { ...heldStats, gpuTiming: { ...heldStats.gpuTiming } },
        decodedBytes: runtime.assets.residency.liveBytes,
        nativeTextureBytes: runtime.graphics.residency.textures.liveBytes,
        nativeGeometryBytes: runtime.graphics.residency.geometry.liveBytes,
      };
    }
    rafHandle = requestAnimationFrame(observe);
  };
  rafHandle = requestAnimationFrame(observe);
  const started = performance.now();
  const deadline = started + duration * 1000;
  let current: MixedScene | undefined;
  do {
    phase = 'setup';
    const next = new MixedScene(count, runtime.graphics.capabilities.threeD);
    const old = current;
    await timed(operations.scenePublishAndWarmupMs, () =>
      runtime.setScene(next, { warmup: { maxItems: 4, maxMilliseconds: 4 } }),
    );
    current = next;
    if (old) sceneCleanup(old);
    if (runtime.state === 'idle') runtime.start();
    else runtime.resume();
    phase = 'warmup';
    const warmupStart = observedFrames;
    while (
      observedFrames - warmupStart < warmup &&
      performance.now() < deadline
    )
      await wait(10);
    phase = 'running';
    const cycleEnd = Math.min(
      deadline,
      performance.now() + cycleSeconds * 1000,
    );
    while (performance.now() < cycleEnd) {
      await wait(Math.min(500, Math.max(0, cycleEnd - performance.now())));
      phase = 'churn';
      await next.churn(runtime, completedCycles + 1);
      phase = 'running';
    }
    runtime.pause();
    phase = 'capture';
    await timed(operations.captureWallMs, async () => {
      const lease = runtime.graphics.retainFrameResources();
      let snapshot;
      try {
        snapshot = await runtime.graphics.captureScene(
          next,
          runtime.width,
          runtime.height,
        );
        capturesCreated++;
        assert(
          snapshot.width === runtime.canvas.width &&
            snapshot.height === runtime.canvas.height,
          'Capture backing dimensions differ from the rendered canvas.',
        );
      } finally {
        try {
          if (snapshot) {
            const residentBeforeRelease = heldStats.renderTargetBytes;
            snapshot.destroy();
            capturesDestroyed++;
            assert(
              snapshot.destroyed,
              'Capture did not enter destroyed state.',
            );
            assert(
              residentBeforeRelease - heldStats.renderTargetBytes >=
                runtime.canvas.width * runtime.canvas.height * 4,
              'Capture attachment estimate was not reclaimed immediately.',
            );
          }
        } finally {
          lease.release();
          assert(lease.released, 'Native frame lease was not released.');
        }
      }
    });
    const decoded = runtime.assets.residency;
    const native = runtime.graphics.residency;
    assert(
      decoded.liveBytes <= decoded.budgetBytes &&
        native.textures.liveBytes <= native.textures.budgetBytes &&
        native.geometry.liveBytes <= native.geometry.budgetBytes,
      'Cache budget exceeded.',
    );
    const cycleTime = (performance.now() - started) / 1000;
    trends.decodedBytes.add(decoded.liveBytes, cycleTime);
    trends.nativeTextureBytes.add(native.textures.liveBytes, cycleTime);
    trends.nativeGeometryBytes.add(native.geometry.liveBytes, cycleTime);
    trends.attachmentBytes.add(heldStats.renderTargetBytes, cycleTime);
    trends.decodedEvictions.add(decoded.evictions);
    trends.nativeTextureEvictions.add(native.textures.evictions);
    completedCycles++;
    output.textContent = `Running ${runtime.graphics.backend}: ${completedCycles} cycles, ${((performance.now() - started) / 1000).toFixed(1)} seconds`;
  } while (performance.now() < deadline);
  const backend = runtime.graphics.backend;
  const renderStats = { ...heldStats, gpuTiming: { ...heldStats.gpuTiming } };
  const browserMeasurements = browserObservations.stop();
  phase = 'cleanup';
  const cleanupStart = performance.now();
  runtime.destroy();
  operations.cleanupMs.add(performance.now() - cleanupStart);
  sceneCleanup(current!);
  cancelAnimationFrame(rafHandle);
  const finalDecoded = runtime.assets.residency;
  const finalNative = {
    textures: residencySnapshot(heldResidency.textures),
    geometry: residencySnapshot(heldResidency.geometry),
  };
  assert(
    finalDecoded.liveBytes === 0 &&
      finalDecoded.borrowers === 0 &&
      finalDecoded.entries === 0,
    'Decoded cache/borrowers did not reach zero.',
  );
  assert(
    finalNative.textures.liveBytes === 0 &&
      finalNative.textures.entries === 0 &&
      finalNative.geometry.liveBytes === 0 &&
      finalNative.geometry.entries === 0,
    'Held native residency did not reach zero.',
  );
  assert(
    heldStats.renderTargetBytes === 0,
    'Held attachment stats did not reach zero.',
  );
  assert(
    capturesCreated === capturesDestroyed && leasesAcquired === leasesReleased,
    'Capture/texture lease lifecycle imbalance.',
  );
  assert(foundRoutes > 0, 'No navigation route completed.');
  assert(
    navigationBakesCompleted > 0 && navigationBakedBlockedCells > 0,
    'No geometry navigation bake detected the real collider.',
  );
  const result = {
    schema: 'xyz-mixed-soak-v2',
    date: new Date().toISOString(),
    userAgent: navigator.userAgent,
    backend,
    provenance,
    profile: {
      name: params.get('profile') ?? 'native',
      simulated: (params.get('profile') ?? 'native') !== 'native',
      note: 'CDP throttling is simulated CPU/network pressure, not actual low-tier hardware.',
    },
    browserMeasurements,
    gpu: {
      timing: renderStats.gpuTiming,
      observedExecutionMs: gpuExecution.snapshot(),
      observedSteadyExecutionMs: steadyGpuExecution.snapshot(),
      unattributedGpuSamples,
      meanCompletedExecutionMs: renderStats.gpuTiming.samples
        ? renderStats.gpuTiming.totalMilliseconds /
          renderStats.gpuTiming.samples
        : null,
      scope:
        'Asynchronous native frame commands only, excludes queue wait and presentation. Observer histograms can miss multiple completions between RAFs; renderer aggregate includes every valid completed query.',
    },
    frameWork: {
      budgetMs: runtime.frameWork.budgetMs,
      overBudgetFrames: frameWorkOverBudget,
      stages: Object.fromEntries(
        Object.entries(frameWorkTimings).map(([name, value]) => [
          name,
          value.snapshot(),
        ]),
      ),
      navigationWorkQuota: soakWorkload.navigationWorkBudget,
      navigationWorkMaximum,
      navigationBakeWork,
      scope:
        'CPU frame budget is a reporting target, not preemption. Navigation search+bake work has a hard aggregate cooperative quota; user callbacks and atomic collision work can exceed the CPU target.',
    },
    networkWorkload: {
      requested: params.get('network') === '1',
      requests: networkRequests,
      bytes: networkBytes,
      wallMs: networkWorkload.snapshot(),
    },
    variant:
      backend === 'canvas2d'
        ? '2d-navigation-ui-render-churn (3D unsupported)'
        : '3d-physics-navigation-ui-render-churn',
    config: {
      durationSeconds: duration,
      cycleSeconds,
      bodies: count,
      warmupFramesPerCycle: warmup,
      seed,
      width: settings.width,
      height: settings.height,
      pixelRatio: 1,
      resourceBudgets,
      budgetAccounting,
    },
    elapsedSeconds: (performance.now() - started) / 1000,
    completedCycles,
    frameIntervalMs: allRaf.snapshot(),
    phases: Object.fromEntries(
      phases.map((name) => [
        name,
        Object.fromEntries(
          Object.entries(timings[name]).map(([metric, value]) => [
            metric,
            value.snapshot(),
          ]),
        ),
      ]),
    ),
    operations: Object.fromEntries(
      Object.entries(operations).map(([name, value]) => [
        name,
        value.snapshot(),
      ]),
    ),
    trends: Object.fromEntries(
      Object.entries(trends).map(([name, value]) => [name, value.snapshot()]),
    ),
    workload: {
      routeChanges,
      foundRoutes,
      assetChanges,
      physics3D: backend !== 'canvas2d',
      colliderCount: backend === 'canvas2d' ? 0 : count + 1,
      physicsStatsAvailable,
      spatialRefreshesMax: spatialRefreshMaximum,
      spatialPoseChecksMax: spatialPoseChecksMaximum,
      spatialRefitsMax: spatialRefitsMaximum,
      navigationBakesCompleted,
      navigationBakedBlockedCells,
      navigationConcurrency: soakWorkload.navigationConcurrentSearches,
      geometryBakePhysics2D: true,
      candidatePairsMax: physicsStatsAvailable ? candidateMax : null,
      narrowphaseTestsMax: physicsStatsAvailable ? narrowphaseMax : null,
    },
    renderStats,
    cleanup: {
      assertions: cleanupAssertions,
      registrations: current!.objects.size,
      physicsRegistrations: current!.physics3D.size,
      leasesAcquired,
      leasesReleased,
      capturesCreated,
      capturesDestroyed,
      decoded: finalDecoded,
      native: finalNative,
      heldRenderTargetBytes: heldStats.renderTargetBytes,
    },
    notes: [
      'Native browser RAF wall intervals, not synthetic FPS. Histogram p50/p95 are 0.25ms upper bucket estimates; null means empty or percentile overflow beyond 1024ms. Exact max/mean and >50ms counts remain tracked.',
      'CPU frameWork follows the full Game pipeline and separately reports navigation and afterUpdate (including physics/particles/camera/audio). Legacy cpuSimulationWorkMs remains Scene.update+ECS World.update only. CPU submit never waits for GPU; operation timings are awaited wall durations, not exclusive CPU time.',
      'Setup, warmup, running, churn, capture and cleanup are separate; mixed RAF observer also runs while Game is paused for capture. Overall frameIntervalMs includes phase-boundary stalls; phase-specific intervals crossing boundaries are discarded. Warmup samples are not steady-state samples.',
      'Engine cache/attachment estimates, browser JS heap estimates and runner CDP heap/OS process RSS are separate observations, never total VRAM. Bounded tail trends classify only after sufficient time/samples with absolute+relative tolerances and sustained-growth thresholds; positive slopes alone are not leak assertions. GC is supported only where real CDP trace events are available.',
      'Duration is a finite minimum observation deadline; one in-flight setup/churn/capture/cleanup finishes after it. Seed fixes authored random workload, not browser frame timing or solver scheduling.',
    ],
  };
  output.textContent = JSON.stringify(result, null, 2);
  output.dataset.state = 'complete';
} catch (error) {
  let reportError = error;
  cancelAnimationFrame(rafHandle);
  browserObservations?.stop();
  const failureContext = {
    resourceBudgets,
    budgetAccounting,
    observedAfterFailure: game
      ? {
          backend: game.graphics.backend,
          decoded: game.assets.residency,
          native: {
            textures: residencySnapshot(game.graphics.residency.textures),
            geometry: residencySnapshot(game.graphics.residency.geometry),
          },
          renderStats: {
            ...game.graphics.stats,
            gpuTiming: { ...game.graphics.stats.gpuTiming },
          },
        }
      : null,
    nativeAllocationRequestBytes: null,
    note: 'Native allocation request bytes are not exposed by the public API. Residency is observed after failure, possibly after candidate cancellation, but before Game.destroy.',
  };
  try {
    game?.destroy();
  } catch (cleanupError) {
    reportError = new AggregateError(
      [error, cleanupError],
      'Benchmark and cleanup failed.',
    );
  }
  output.textContent = JSON.stringify({
    schema: 'xyz-mixed-soak-v2',
    error: String(
      reportError instanceof Error ? reportError.stack : reportError,
    ),
    completedCycles,
    phase,
    failureContext,
  });
  output.dataset.state = 'failed';
}

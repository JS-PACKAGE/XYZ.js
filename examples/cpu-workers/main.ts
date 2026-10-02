import {
  Game,
  Scene,
  Mesh,
  Geometry,
  Texture,
  TextureMaterial,
  Vector3,
  NativeWorkerPool,
  heightfieldGeometryJob,
  processHeightfieldGeometry,
  publishHeightfieldGeometry,
  type HeightfieldGeometryRequest,
  type HeightfieldGeometryResult,
  type WorkerJobHandle,
  type RendererPreference,
} from '../../src/index.js';

const $ = <T extends HTMLElement>(id: string): T =>
  document.querySelector<T>(`#${id}`)!;
const backend = $<HTMLSelectElement>('backend');
const status = $('status');
backend.value = new URLSearchParams(location.search).get('renderer') ?? 'auto';
backend.onchange = () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
};
let game: Game | undefined;
let texture: Texture | undefined;
let pool: NativeWorkerPool | undefined;
let handle: WorkerJobHandle<HeightfieldGeometryResult> | undefined;
let disposed = false;
let revision = 0;
let frame = 0;
let heartbeatFrame = 0;
let previousFrame = performance.now();
let largestFrameGap = 0;
const evidence = {
  heartbeat: 0,
  workerHeartbeats: 0,
  largestFrameGap: 0,
  logicalResultsIdentical: false,
  inputDetached: false,
  lastOutcome: 'initializing',
  published: 0,
  timing: {},
  pool: {},
};
Object.assign(window, { __xyzCpuWorkers: evidence });
const heartbeat = (): void => {
  if (disposed) return;
  const now = performance.now();
  largestFrameGap = Math.max(largestFrameGap, now - previousFrame);
  previousFrame = now;
  evidence.heartbeat = ++frame;
  evidence.largestFrameGap = largestFrameGap;
  evidence.pool = pool?.stats ?? {};
  $('pulse').style.opacity = String(0.25 + (frame % 40) / 55);
  $('heartbeat').textContent =
    `${frame} RAF heartbeats · largest interval ${largestFrameGap.toFixed(1)} ms`;
  heartbeatFrame = requestAnimationFrame(heartbeat);
};
const destroy = (): void => {
  if (disposed) return;
  disposed = true;
  revision++;
  cancelAnimationFrame(heartbeatFrame);
  game?.destroy();
  pool?.destroy();
  texture?.destroy();
  evidence.pool = pool?.stats ?? {};
  evidence.lastOutcome = 'destroyed';
  status.textContent =
    'Destroyed. All owned workers terminated; reload to restart.';
  $('stats').textContent = JSON.stringify(evidence.pool, null, 2);
};
function request(size: number, seed = 0): HeightfieldGeometryRequest {
  const heights = new Float32Array(size * size);
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      heights[row * size + column] =
        0.6 * Math.sin(column * 0.045 + seed) * Math.cos(row * 0.04) +
        0.08 * Math.sin(column * 17.7 + row * 9.1);
    }
  }
  return {
    columns: size,
    rows: size,
    width: 12,
    depth: 12,
    heights,
    iterations: size,
    smoothing: 0.65,
  };
}
function identical(
  left: HeightfieldGeometryResult,
  right: HeightfieldGeometryResult,
): boolean {
  for (const key of ['positions', 'normals', 'uvs', 'indices'] as const) {
    const a = left[key],
      b = right[key];
    if (a.length !== b.length) return false;
    for (let index = 0; index < a.length; index++)
      if (a[index] !== b[index]) return false;
  }
  return true;
}

try {
  pool = new NativeWorkerPool({
    moduleURL: new URL('./geometry.worker.ts', import.meta.url),
    workerFactory: () =>
      new Worker(new URL('./geometry.worker.ts', import.meta.url), {
        type: 'module',
      }),
    workers: 1,
    queuedJobs: 4,
  });
  const workers = pool;
  game = await Game.create({
    canvas: '#game',
    width: 900,
    height: 450,
    renderer: backend.value as RendererPreference,
  });
  if (!game.graphics.capabilities.threeD)
    throw new Error('3D requires WebGPU or WebGL2; Canvas2D is unsupported.');
  const pixel = document.createElement('canvas');
  pixel.width = pixel.height = 1;
  const context = pixel.getContext('2d')!;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, 1, 1);
  texture = await Texture.fromImage(pixel);
  const material = new TextureMaterial({ texture, color: [0.35, 0.8, 0.62] });
  class WorkerLab extends Scene {
    terrain = new Mesh({ geometry: Geometry.plane(12, 12), material });
    constructor() {
      super();
      this.camera3D.position.set(10, 9, 11);
      this.camera3D.lookAt(new Vector3());
      this.add(this.terrain);
    }
    publish(value: HeightfieldGeometryResult): void {
      const published = publishHeightfieldGeometry(value);
      this.remove(this.terrain);
      this.terrain.destroy();
      this.terrain = new Mesh({ geometry: published.geometry, material });
      this.add(this.terrain);
      evidence.published++;
      evidence.timing = {
        ...evidence.timing,
        publicationMilliseconds: published.publicationMilliseconds,
        publicationCopiedBytes: published.publicationCopiedBytes,
      };
    }
    override destroy(): void {
      workers.destroy();
      super.destroy();
    }
  }
  const scene = new WorkerLab();
  await game.setScene(scene);
  game.start();
  heartbeatFrame = requestAnimationFrame(heartbeat);
  const runWorker = async (
    transfer: boolean,
    invalid = false,
    seed = 0,
  ): Promise<void> => {
    if (disposed) return;
    const ownRevision = ++revision;
    largestFrameGap = 0;
    const before = frame;
    const input = request(384, seed);
    const heights = input.heights;
    if (invalid) heights[10] = NaN;
    const bytes = heights.byteLength;
    status.textContent =
      'Native worker executing. The RAF heartbeat should continue.';
    try {
      handle = workers.submit(
        heightfieldGeometryJob,
        { ...input, transferResult: transfer },
        {
          requestBytes: bytes,
          transfer: transfer ? [heights.buffer as ArrayBuffer] : [],
          key: 'terrain',
        },
      );
      evidence.inputDetached = heights.byteLength === 0;
      const result = await handle.promise;
      if (disposed || revision !== ownRevision) return;
      evidence.workerHeartbeats = frame - before;
      evidence.timing = result.timing;
      scene.publish(result.value);
      evidence.lastOutcome = 'succeeded';
      evidence.pool = workers.stats;
      status.textContent = `Published worker terrain; ${evidence.workerHeartbeats} RAF heartbeats occurred during work.`;
      $('stats').textContent = JSON.stringify(
        {
          timing: evidence.timing,
          pool: evidence.pool,
          inputDetached: evidence.inputDetached,
          workerHeartbeats: evidence.workerHeartbeats,
        },
        null,
        2,
      );
    } catch (error) {
      if (disposed || revision !== ownRevision) return;
      evidence.lastOutcome =
        error instanceof Error ? error.message : String(error);
      evidence.pool = workers.stats;
      status.textContent = `Job rejected, previous terrain preserved: ${String(error)}`;
      $('stats').textContent = JSON.stringify(evidence.pool, null, 2);
    }
  };
  $('worker-transfer').onclick = () => {
    void runWorker(true);
  };
  $('worker-copy').onclick = () => {
    void runWorker(false);
  };
  $('supersede').onclick = () => {
    void runWorker(true, false, 0);
    void runWorker(true, false, 1);
  };
  $('abort').onclick = () =>
    handle?.cancel('User aborted the geometry computation.');
  $('error').onclick = () => {
    void runWorker(true, true);
  };
  $('main').onclick = () => {
    if (disposed) return;
    revision++;
    handle?.cancel('Main-thread request superseded the worker job.');
    const input = request(384);
    const started = performance.now();
    const value = processHeightfieldGeometry(input);
    evidence.timing = {
      mainThreadComputeMilliseconds: performance.now() - started,
    };
    scene.publish(value);
    evidence.lastOutcome = 'main-thread-succeeded';
    status.textContent =
      'Identical CPU algorithm ran synchronously: the RAF heartbeat could not update during computation.';
    $('stats').textContent = JSON.stringify(evidence.timing, null, 2);
  };
  $('verify').onclick = async () => {
    if (disposed) return;
    const ownRevision = ++revision;
    handle?.cancel('Verification superseded the worker job.');
    const input = request(17);
    const reference = processHeightfieldGeometry(input);
    try {
      handle = workers.submit(heightfieldGeometryJob, input, {
        requestBytes: input.heights.byteLength,
        transfer: [input.heights.buffer as ArrayBuffer],
        key: 'terrain',
      });
      const result = await handle.promise;
      if (disposed || revision !== ownRevision) return;
      evidence.logicalResultsIdentical = identical(reference, result.value);
      if (!evidence.logicalResultsIdentical)
        throw new Error(
          'Worker geometry differs from the main-thread reference.',
        );
      evidence.timing = result.timing;
      scene.publish(result.value);
      evidence.lastOutcome = 'identical';
      status.textContent =
        'PASS: every position, normal, UV and index is bit-for-bit identical.';
      $('stats').textContent = JSON.stringify(evidence.timing, null, 2);
    } catch (error) {
      if (!disposed && revision === ownRevision)
        status.textContent = String(error);
    }
  };
  $('destroy').onclick = destroy;
  status.textContent = `${game.graphics.backend}: ready. Compare worker transfer/copy against main-thread computation.`;
  void runWorker(true);
} catch (error) {
  destroy();
  status.textContent = `Initialization failed: ${String(error)}`;
}
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) destroy();
});

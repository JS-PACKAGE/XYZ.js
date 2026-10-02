import {
  CharacterController2D,
  Collider2D,
  GameObject,
  IndexedDBStorage,
  NavigationGrid2D,
  Serializer,
  Sprite,
  Vector2,
  gameObjectState,
  type Game,
  type JsonValue,
  type NavigationGridPath2D,
  type NavigationScheduledSearch,
  type ResourceScope,
  type SampleAudioAsset,
  type SamplePlayback,
  type Scene,
  type RenderTexture2D,
  type SceneSnapshot,
  type WorldStreamingController,
} from '../../src/index.js';

const originX = 420;
const originY = 500;
const cellSize = 12;
const columns = 36;
const rows = 8;
const wallColumns = [5, 17, 29];
export const journeyCounters = {
  routes: 0,
  goals: 0,
  sweptDistance: 0,
  collisionBlocks: 0,
  streamingPublications: 0,
  streamingRetirements: 0,
  streamingAdmissions: 0,
  scopesCreated: 0,
  scopesReleased: 0,
  textureLeasesAcquired: 0,
  textureLeasesReleased: 0,
  audioPlaybacksCreated: 0,
  audioPlaybacksStopped: 0,
  restoredSnapshots: 0,
};
export function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}
export interface NativeObservation {
  nativeContexts: number;
  contextStates: string[];
  zeroGainDestinations: number;
  gains: number[];
  sourcesStarted: number;
  sourcesEnded: number;
  activeSources: number;
  errorCount: number;
  errors: string[];
  gpuDevicesCreated: number;
  gpuDevicesLost: number;
  deviceLossTail: unknown[];
}
interface OwnedNative {
  snapshot(): NativeObservation;
  loseOwnedDevice(): void;
}
export function nativeSurface(): OwnedNative {
  const native = (
    globalThis as typeof globalThis & { __xyzMixedNative?: OwnedNative }
  ).__xyzMixedNative;
  check(
    Boolean(native),
    'Mixed soak requires an owned silent native browser fixture; direct interactive playback is disabled.',
  );
  return native!;
}
export function assertSilentNative(): NativeObservation {
  const snapshot = nativeSurface().snapshot();
  check(
    snapshot.nativeContexts === 8 &&
      snapshot.zeroGainDestinations === 8 &&
      snapshot.gains.every((gain) => gain === 0),
    'All eight native contexts must have private zero-gain physical sinks.',
  );
  check(
    snapshot.errorCount === 0,
    `Native fixture errors: ${snapshot.errors.join('; ')}`,
  );
  return snapshot;
}
export function ownedSaveStorage(): IndexedDBStorage {
  return new IndexedDBStorage(`xyz-mixed-soak-${crypto.randomUUID()}`);
}
function sampleBlob(): Blob {
  const sampleRate = 24000;
  const frames = sampleRate * 2;
  const bytes = new ArrayBuffer(44 + frames * 2);
  const view = new DataView(bytes);
  const text = (offset: number, value: string): void => {
    for (let index = 0; index < value.length; index++)
      view.setUint8(offset + index, value.charCodeAt(index));
  };
  text(0, 'RIFF');
  view.setUint32(4, bytes.byteLength - 8, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, frames * 2, true);
  for (let index = 0; index < frames; index++)
    view.setInt16(
      44 + index * 2,
      Math.round(Math.sin((index * Math.PI * 2 * 220) / sampleRate) * 4096),
      true,
    );
  return new Blob([bytes], { type: 'audio/wav' });
}
export class JourneyAssets {
  textureURL = '';
  sampleURL = '';
  sample!: SampleAudioAsset;
  async initialize(runtime: Game): Promise<void> {
    nativeSurface();
    const source = document.createElement('canvas');
    source.width = source.height = 128;
    const paint = source.getContext('2d')!;
    paint.fillStyle = '#39dca5';
    paint.fillRect(0, 0, 128, 128);
    const textureBlob = await new Promise<Blob>((resolve, reject) =>
      source.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error('Journey texture encoding failed.')),
        'image/png',
      ),
    );
    this.textureURL = URL.createObjectURL(textureBlob);
    this.sampleURL = URL.createObjectURL(sampleBlob());
    const start = document.querySelector<HTMLButtonElement>('#start')!;
    start.hidden = false;
    await new Promise<void>((resolve, reject) => {
      start.addEventListener(
        'click',
        () => {
          start.disabled = true;
          // unlock is issued synchronously inside the original trusted gesture; no synthetic gesture/retry.
          runtime.audio.unlock().then(resolve, reject);
        },
        { once: true },
      );
    });
    assertSilentNative();
    this.sample = await runtime.audio.loadSample(this.sampleURL);
    await this.sample.decode();
    check(
      this.sample.decoded && this.sample.duration === 2,
      'Native procedural PCM must decode to the authored two-second buffer.',
    );
  }
  destroy(): void {
    if (this.textureURL) URL.revokeObjectURL(this.textureURL);
    if (this.sampleURL) URL.revokeObjectURL(this.sampleURL);
  }
}

/** One actor owns navigation, physics sweeps, streamed collision cells and Scene-bound audio. */
export class StreamingJourney {
  readonly grid = new NavigationGrid2D({ columns, rows });
  readonly serializer: Serializer;
  readonly actor: GameObject;
  readonly controller: CharacterController2D;
  readonly stream: WorldStreamingController;
  playback!: SamplePlayback;
  ticks = 0;
  elapsed = 0;
  distance = 0;
  goals = 0;
  target = columns - 2;
  private readonly scopes: ResourceScope[] = [];
  private readonly displacement = new Vector2();
  private readonly focus = { x: originX + 18, y: 0, z: 0 };
  private readonly actorScope: ResourceScope;
  private pending?: NavigationScheduledSearch<NavigationGridPath2D>;
  private route: NavigationGridPath2D['cells'] = [];
  private waypoint = 0;
  private probed = false;
  private disposed = false;
  private lastPublications = 0;
  private lastRetirements = 0;
  private lastAdmissions = 0;
  private constructor(
    private readonly scene: Scene,
    assets: JourneyAssets,
    texture: Sprite['texture'],
    actorScope: ResourceScope,
  ) {
    this.actorScope = actorScope;
    this.actor = new GameObject();
    this.actor.position.set(originX + 18, originY + 42);
    this.actor.collider = new Collider2D('circle', 3, []);
    this.actor.collider.category = 2;
    this.actor.collider.mask = 1;
    this.actor.add(
      new Sprite({
        texture,
        scale: [8 / 128, 8 / 128],
        space: 'world',
        zIndex: 100,
      }),
    );
    scene.add(this.actor);
    this.controller = new CharacterController2D(this.actor, scene.physics, {
      mask: 1,
      groundSnap: 0,
      stepHeight: 0,
      skin: 0.05,
    });
    this.serializer = new Serializer(scene);
    this.serializer.register(
      'journey-player',
      this.actor,
      gameObjectState(this.actor, {
        serialize: () => ({
          ticks: this.ticks,
          elapsed: this.elapsed,
          distance: this.distance,
          goals: this.goals,
          target: this.target,
          probed: this.probed,
        }),
        restore: (value: JsonValue): void => {
          check(
            Boolean(value) &&
              typeof value === 'object' &&
              !Array.isArray(value),
            'Invalid journey custom snapshot.',
          );
          const state = value as Record<string, JsonValue>;
          for (const name of [
            'ticks',
            'elapsed',
            'distance',
            'goals',
            'target',
          ])
            check(
              typeof state[name] === 'number' && Number.isFinite(state[name]),
              `Invalid journey ${name}.`,
            );
          check(
            state.target === 1 || state.target === columns - 2,
            'Invalid journey goal.',
          );
          check(
            typeof state.probed === 'boolean',
            'Invalid journey collision proof state.',
          );
          this.ticks = state.ticks as number;
          this.elapsed = state.elapsed as number;
          this.distance = state.distance as number;
          this.goals = state.goals as number;
          this.target = state.target as number;
          this.probed = state.probed as boolean;
          this.focus.x = this.actor.position.x;
        },
      }),
    );
    for (const column of wallColumns)
      for (let row = 2; row <= 5; row++)
        this.grid.setCell(column, row, { walkable: false });
    this.stream = scene.createWorldStreaming({
      cells: wallColumns.map((column, index) => ({
        id: `corridor-${index}`,
        bounds: {
          min: { x: originX + index * 144, y: -1, z: -1 },
          max: { x: originX + (index + 1) * 144, y: 1, z: 1 },
        },
        load: async (context) => {
          const root = context.own(new GameObject());
          this.trackScope(context.resources);
          const lease = await context.resources.acquireTexture(
            assets.textureURL,
          );
          journeyCounters.textureLeasesAcquired++;
          context.resources.attach(() => {
            journeyCounters.textureLeasesReleased++;
          });
          context.signal.throwIfAborted();
          const wall = new GameObject();
          wall.position.set(originX + (column + 0.5) * cellSize, originY + 48);
          wall.collider = new Collider2D('polygon', 0, [
            [-4, -24],
            [4, -24],
            [4, 24],
            [-4, 24],
          ]);
          wall.collider.category = 1;
          wall.collider.mask = 2;
          wall.add(
            new Sprite({
              texture: lease.value,
              scale: [8 / 128, 48 / 128],
              space: 'world',
              tint: [0.5, 0.6, 1, 1],
              zIndex: 90,
            }),
          );
          root.add(wall);
          return { root };
        },
      })),
      focus: () => this.focus,
      activeDistance: 24,
      prefetchDistance: 72,
      retireDistance: 96,
      maxActive: 2,
      maxPending: 2,
      maxResident: 3,
      admissionsPerFrame: 2,
      onError: (failure) => {
        throw new Error(
          `Integrated streaming ${failure.cell}/${failure.phase}: ${String(failure.error)}`,
        );
      },
    });
  }
  static async create(
    scene: Scene,
    runtime: Game,
    assets: JourneyAssets,
    signal: AbortSignal,
  ): Promise<StreamingJourney> {
    const scope = runtime.resources.createScope({ signal });
    try {
      const texture = await scope.acquireTexture(assets.textureURL);
      journeyCounters.textureLeasesAcquired++;
      scope.attach(() => {
        journeyCounters.textureLeasesReleased++;
      });
      signal.throwIfAborted();
      const journey = new StreamingJourney(scene, assets, texture.value, scope);
      journey.trackScope(scope);
      journey.playback = await assets.sample.play({
        scene,
        loop: true,
        volume: 0.1,
      });
      journeyCounters.audioPlaybacksCreated++;
      return journey;
    } catch (error) {
      scope.release();
      throw error;
    }
  }
  private trackScope(scope: ResourceScope): void {
    this.scopes.push(scope);
    journeyCounters.scopesCreated++;
    scope.attach(() => {
      journeyCounters.scopesReleased++;
    });
  }
  update(delta: number): void {
    this.ticks++;
    this.elapsed += delta;
    const stats = this.stream.stats;
    journeyCounters.streamingPublications +=
      stats.publications - this.lastPublications;
    journeyCounters.streamingRetirements +=
      stats.retirements - this.lastRetirements;
    journeyCounters.streamingAdmissions +=
      stats.admissions - this.lastAdmissions;
    this.lastPublications = stats.publications;
    this.lastRetirements = stats.retirements;
    this.lastAdmissions = stats.admissions;
    check(
      stats.failed === 0 &&
        stats.active <= 2 &&
        stats.pending <= 2 &&
        stats.resident <= 3,
      'Integrated streaming failed or exceeded admission bounds.',
    );
    const cell = Math.max(
      0,
      Math.min(2, Math.floor((this.actor.position.x - originX) / 144)),
    );
    if (this.stream.getCell(`corridor-${cell}`).state !== 'active') return;
    if (!this.probed) {
      const x = this.actor.position.x;
      const y = this.actor.position.y;
      const move = this.controller.move(this.displacement.set(180, 0));
      check(
        move.blocked &&
          this.actor.position.x <
            originX + (wallColumns[0]! + 0.5) * cellSize - 6,
        'The real streamed wall must block the gameplay actor sweep.',
      );
      journeyCounters.collisionBlocks++;
      this.actor.position.set(x, y);
      this.probed = true;
    }
    if (this.pending && this.pending.status !== 'pending') {
      const path = this.pending.result;
      check(
        path?.status === 'found',
        'Integrated gameplay route must complete rather than silently teleport/fallback.',
      );
      this.route = path!.cells;
      this.waypoint = 0;
      this.pending = undefined;
      journeyCounters.routes++;
    }
    if (!this.pending && !this.route.length) {
      this.pending = this.grid.scheduleSearch(
        this.scene.navigation,
        {
          column: Math.max(
            0,
            Math.min(
              columns - 1,
              Math.floor((this.actor.position.x - originX) / cellSize),
            ),
          ),
          row: Math.max(
            0,
            Math.min(
              rows - 1,
              Math.floor((this.actor.position.y - originY) / cellSize),
            ),
          ),
        },
        { column: this.target, row: 3 },
        { diagonal: false, agentRadius: 0.25 },
      );
    }
    if (this.waypoint >= this.route.length) return;
    const point = this.route[this.waypoint]!;
    const dx =
      originX + (point.column + 0.5) * cellSize - this.actor.position.x;
    const dy = originY + (point.row + 0.5) * cellSize - this.actor.position.y;
    const length = Math.hypot(dx, dy);
    if (length <= 0.1) {
      this.waypoint++;
      if (this.waypoint === this.route.length) {
        this.goals++;
        journeyCounters.goals++;
        this.target = this.target === 1 ? columns - 2 : 1;
        this.route = [];
      }
      return;
    }
    const scale = Math.min(length, delta * 240) / length;
    const movement = this.controller.move(
      this.displacement.set(dx * scale, dy * scale),
    );
    check(
      !movement.exhausted && !movement.unresolvedPenetration,
      'Gameplay collision movement must stay within its actual sweep budget.',
    );
    const travelled = Math.hypot(
      movement.displacement.x,
      movement.displacement.y,
    );
    this.distance += travelled;
    journeyCounters.sweptDistance += travelled;
    this.focus.x = this.actor.position.x;
  }
  async restore(snapshot: SceneSnapshot): Promise<void> {
    const report = await this.serializer.restore(snapshot, 'error');
    // The built-in adapter restores custom data before its transform.
    this.focus.x = this.actor.position.x;
    check(
      report.unknown.length === 0 && report.missing.length === 0,
      'Saved stable IDs must exactly round-trip.',
    );
    check(
      JSON.stringify(this.serializer.capture()) === JSON.stringify(snapshot),
      'Candidate player/body/custom state must exactly match the saved snapshot before publication.',
    );
    journeyCounters.restoredSnapshots++;
  }
  observe() {
    return {
      ticks: this.ticks,
      elapsed: this.elapsed,
      distance: this.distance,
      goals: this.goals,
      target: this.target,
      player: { x: this.actor.position.x, y: this.actor.position.y },
      streaming: { ...this.stream.stats },
      audioState: this.playback.state,
      audioPosition: this.playback.position,
    };
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.pending?.cancel();
    this.grid.destroy();
    this.controller.destroy();
    this.playback.stop();
    journeyCounters.audioPlaybacksStopped++;
    this.actorScope.release();
  }
  assertCleanup(): void {
    check(
      this.stream.destroyed &&
        this.stream.stats.active === 0 &&
        this.stream.stats.resident === 0 &&
        this.stream.stats.pending === 0,
      'Scene streaming roots/reservations must reach zero after settlement.',
    );
    check(
      this.scopes.every((scope) => scope.destroyed),
      'Every actor/cell resource scope must release.',
    );
    check(
      this.playback.state === 'stopped' && this.actor.destroyed,
      'Scene audio and actor must stop/destroy.',
    );
  }
}

export async function proveRenderedActor(
  runtime: Game,
  journey: StreamingJourney,
): Promise<{ rgba: number[]; x: number; y: number }> {
  const wasRunning = runtime.state === 'running';
  if (wasRunning) runtime.pause();
  let target: RenderTexture2D | undefined;
  try {
    target = runtime.graphics.createRenderTexture({
      width: runtime.width,
      height: runtime.height,
    });
    await runtime.graphics.renderToTexture(target, runtime.scene!);
    const pixels = await runtime.graphics.extractPixels(target);
    const x = Math.round(journey.actor.position.x);
    const y = Math.round(journey.actor.position.y);
    const offset = (y * target.width + x) * 4;
    const rgba = Array.from(pixels.subarray(offset, offset + 4));
    check(
      rgba.length === 4 &&
        Math.abs(rgba[0]! - 57) <= 1 &&
        Math.abs(rgba[1]! - 220) <= 1 &&
        Math.abs(rgba[2]! - 165) <= 1 &&
        rgba[3] === 255,
      `Current integrated ${runtime.graphics.backend} Scene must render the actual moving player into native RGBA pixels: (${x}, ${y}) returned [${rgba.join(', ')}].`,
    );
    return { rgba, x, y };
  } finally {
    target?.destroy();
    if (wasRunning) runtime.resume();
  }
}

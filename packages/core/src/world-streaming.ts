import { worldStreamingLimits } from '../../../src/data/world-streaming.js';
import type {
  ResourcePool,
  ResourceScope,
} from '../../assets/src/resource-scope.js';
import {
  FactoryRegistry,
  collectFactoryNodes,
  destroyFactoryNodes,
  type FactoryDefinitions,
  type FactoryNode,
  type FactoryOptions,
  type FactoryServices,
} from './factories.js';
import type { Scene } from './scene.js';
import type { SceneObject } from './scene-object.js';
import type { NavigationGraph3D } from './navigation/graph.js';
import {
  WorldStreamingNavigation3D,
  type WorldStreamingNavigationFragment3D,
} from './world-streaming-navigation.js';

export interface WorldStreamingPoint {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface WorldStreamingBounds {
  readonly min: WorldStreamingPoint;
  readonly max: WorldStreamingPoint;
}

export interface WorldStreamingCandidate {
  /** One fresh detached prefab; its descendants are owned, resources are borrowed through the scope. */
  readonly root: SceneObject;
  readonly navigation?: WorldStreamingNavigationFragment3D;
}

export interface WorldStreamingLoadContext {
  readonly cell: WorldStreamingCell;
  readonly signal: AbortSignal;
  readonly resources: ResourceScope;
  /** Claim the root before awaiting fallible work. Late returned roots are also reclaimed. */
  own<Node extends SceneObject>(root: Node): Node;
  createFactory<
    Definitions extends FactoryDefinitions,
    Kind extends Extract<keyof Definitions, string>,
  >(
    registry: FactoryRegistry<Definitions>,
    kind: Kind,
    options: FactoryOptions<Definitions[Kind]>,
    services: FactoryServices<Definitions>,
  ): Promise<FactoryNode<Definitions[Kind]>>;
}

export interface WorldStreamingCell {
  readonly id: string;
  readonly bounds: WorldStreamingBounds;
  /** Higher priority wins, then distance, then catalog order. */
  readonly priority?: number;
  readonly load: (
    context: WorldStreamingLoadContext,
  ) => WorldStreamingCandidate | Promise<WorldStreamingCandidate>;
}

export interface WorldStreamingOptions {
  readonly cells: readonly WorldStreamingCell[];
  /** World-space selection point; no camera or physics service is initialized implicitly. */
  readonly focus: () => WorldStreamingPoint;
  readonly activeDistance?: number;
  readonly prefetchDistance?: number;
  /** Hysteresis for already-active cells; nearest/priority admission still respects maxActive. */
  readonly retireDistance?: number;
  readonly maxActive?: number;
  /** Includes cancelled non-cooperative loads until they actually settle. */
  readonly maxPending?: number;
  /** Admission reservations include active, prefetched and pending candidates, not GPU-byte estimates. */
  readonly maxResident?: number;
  readonly admissionsPerFrame?: number;
  readonly onError?: (failure: WorldStreamingFailure) => void;
}

export type WorldStreamingCellState =
  'unloaded' | 'loading' | 'cancelling' | 'ready' | 'active' | 'failed';
export interface WorldStreamingFailure {
  readonly cell: string;
  readonly phase: 'load' | 'publish' | 'retire' | 'cleanup';
  readonly error: unknown;
}
export interface WorldStreamingCellStatus {
  readonly id: string;
  readonly state: WorldStreamingCellState;
  readonly error: unknown;
  readonly activeWanted: boolean;
  readonly residentWanted: boolean;
}
export interface WorldStreamingStats {
  readonly active: number;
  readonly ready: number;
  readonly pending: number;
  readonly cancelling: number;
  readonly resident: number;
  readonly failed: number;
  readonly admissions: number;
  readonly publications: number;
  readonly retirements: number;
  readonly cancellations: number;
}
interface CellRecord {
  readonly cell: WorldStreamingCell;
  readonly order: number;
  state: WorldStreamingCellState;
  error: unknown;
  distance: number;
  activeWanted: boolean;
  residentWanted: boolean;
  resources?: ResourceScope;
  controller?: AbortController;
  task?: Promise<void>;
  owned?: Set<SceneObject>;
  root?: SceneObject;
  fragment?: WorldStreamingNavigationFragment3D;
}

/** Scene-owned cell lifecycle. Async work only prepares; publication occurs at visible frame boundaries. */
export class WorldStreamingController extends EventTarget {
  readonly navigation = new WorldStreamingNavigation3D();
  readonly maxActive: number;
  readonly maxPending: number;
  readonly maxResident: number;
  readonly admissionsPerFrame: number;
  readonly activeDistance: number;
  readonly prefetchDistance: number;
  readonly retireDistance: number;
  private readonly records = new Map<string, CellRecord>();
  private readonly ranked: CellRecord[] = [];
  private readonly fragments = new Map<
    string,
    WorldStreamingNavigationFragment3D
  >();
  private running = true;
  private paused = false;
  private disposed = false;
  private processing = false;
  private admissions = 0;
  private publications = 0;
  private retirements = 0;
  private cancellations = 0;

  constructor(
    readonly scene: Scene,
    readonly resources: ResourcePool,
    private readonly options: WorldStreamingOptions,
  ) {
    super();
    if (scene.destroyed || resources.destroyed)
      throw new Error('Streaming requires a live Scene and ResourcePool.');
    this.maxActive = options.maxActive ?? worldStreamingLimits.activeCells;
    this.maxPending = options.maxPending ?? worldStreamingLimits.pendingLoads;
    this.maxResident =
      options.maxResident ?? worldStreamingLimits.residentCells;
    this.admissionsPerFrame =
      options.admissionsPerFrame ?? worldStreamingLimits.admissionsPerFrame;
    this.activeDistance = options.activeDistance ?? 0;
    this.prefetchDistance =
      options.prefetchDistance ?? worldStreamingLimits.defaultPrefetchDistance;
    this.retireDistance =
      options.retireDistance ?? worldStreamingLimits.defaultRetireDistance;
    if (
      typeof options.focus !== 'function' ||
      ![
        this.maxActive,
        this.maxPending,
        this.maxResident,
        this.admissionsPerFrame,
      ].every(
        (value) =>
          Number.isInteger(value) &&
          value > 0 &&
          value <= worldStreamingLimits.cells,
      ) ||
      this.maxResident < this.maxActive ||
      this.maxPending > this.maxResident ||
      ![this.activeDistance, this.prefetchDistance, this.retireDistance].every(
        (value) =>
          Number.isFinite(value) &&
          value >= 0 &&
          value <= worldStreamingLimits.coordinateExtent,
      ) ||
      this.prefetchDistance < this.activeDistance ||
      this.retireDistance < this.prefetchDistance ||
      !options.cells.length ||
      options.cells.length > worldStreamingLimits.cells
    )
      throw new RangeError('Invalid streaming distances or admission budgets.');
    for (const cell of options.cells) {
      if (
        !cell.id ||
        typeof cell.id !== 'string' ||
        cell.id.length > worldStreamingLimits.idLength ||
        this.records.has(cell.id) ||
        typeof cell.load !== 'function' ||
        !Number.isFinite(cell.priority ?? 0)
      )
        throw new RangeError(
          'Streaming cells require unique bounded IDs, finite priorities and loaders.',
        );
      for (const axis of ['x', 'y', 'z'] as const) {
        const min = cell.bounds.min[axis],
          max = cell.bounds.max[axis];
        if (
          !Number.isFinite(min) ||
          !Number.isFinite(max) ||
          min > max ||
          Math.abs(min) > worldStreamingLimits.coordinateExtent ||
          Math.abs(max) > worldStreamingLimits.coordinateExtent
        )
          throw new RangeError(
            'Streaming cell bounds must be finite ordered world coordinates.',
          );
      }
      const immutable = Object.freeze({
        ...cell,
        bounds: Object.freeze({
          min: Object.freeze({ ...cell.bounds.min }),
          max: Object.freeze({ ...cell.bounds.max }),
        }),
      });
      this.records.set(cell.id, {
        cell: immutable,
        order: this.records.size,
        state: 'unloaded',
        error: undefined,
        distance: Infinity,
        activeWanted: false,
        residentWanted: false,
      });
    }
  }

  get destroyed(): boolean {
    return this.disposed;
  }
  get enabled(): boolean {
    return this.running && !this.disposed;
  }
  set enabled(value: boolean) {
    if (typeof value !== 'boolean')
      throw new TypeError('Streaming enabled must be boolean.');
    if (this.disposed && value) throw new Error('Streaming is destroyed.');
    this.running = value;
    if (!value && !this.processing) this.clear();
  }
  get isPaused(): boolean {
    return this.paused;
  }

  setPaused(value: boolean): void {
    if (typeof value !== 'boolean')
      throw new TypeError('Streaming pause must be boolean.');
    this.paused = value;
  }

  getCell(id: string): WorldStreamingCellStatus {
    const record = this.records.get(id);
    if (!record) throw new RangeError(`Unknown streaming cell ${id}.`);
    return {
      id,
      state: record.state,
      error: record.error,
      activeWanted: record.activeWanted,
      residentWanted: record.residentWanted,
    };
  }

  get stats(): WorldStreamingStats {
    let active = 0,
      ready = 0,
      pending = 0,
      cancelling = 0,
      resident = 0,
      failed = 0;
    for (const record of this.records.values()) {
      if (record.state === 'active') active++;
      if (record.state === 'ready') ready++;
      if (record.task) pending++;
      if (record.state === 'cancelling') cancelling++;
      if (record.resources || record.task) resident++;
      if (record.state === 'failed') failed++;
    }
    return {
      active,
      ready,
      pending,
      cancelling,
      resident,
      failed,
      admissions: this.admissions,
      publications: this.publications,
      retirements: this.retirements,
      cancellations: this.cancellations,
    };
  }

  /** Failures are sticky. Explicit retry never silently replaces a live/erroring cell with a fallback. */
  retry(id: string): void {
    if (this.disposed) throw new Error('Streaming is destroyed.');
    if (this.processing)
      throw new Error('Cannot retry during a streaming membership callback.');
    const record = this.records.get(id);
    if (!record) throw new RangeError(`Unknown streaming cell ${id}.`);
    if (record.state !== 'failed' || record.task) return;
    this.release(record);
    record.state = 'unloaded';
    record.error = undefined;
  }

  /** Run once per visible Game frame after focus input and before navigation. Never publishes during pause. */
  update(focus?: WorldStreamingPoint): void {
    if (this.disposed || !this.running || this.paused || this.processing)
      return;
    if (this.scene.destroyed) {
      this.destroy();
      return;
    }
    focus ??= this.options.focus();
    if (![focus.x, focus.y, focus.z].every((value) => Number.isFinite(value)))
      throw new RangeError(
        'Streaming focus must contain finite world coordinates.',
      );
    this.processing = true;
    try {
      this.ranked.length = 0;
      for (const record of this.records.values()) {
        record.activeWanted = record.residentWanted = false;
        const { min, max } = record.cell.bounds;
        record.distance = Math.hypot(
          Math.max(min.x - focus.x, 0, focus.x - max.x),
          Math.max(min.y - focus.y, 0, focus.y - max.y),
          Math.max(min.z - focus.z, 0, focus.z - max.z),
        );
        if (
          record.distance <= this.prefetchDistance ||
          (record.state === 'active' && record.distance <= this.retireDistance)
        )
          this.ranked.push(record);
      }
      this.ranked.sort(
        (a, b) =>
          (b.cell.priority ?? 0) - (a.cell.priority ?? 0) ||
          a.distance - b.distance ||
          a.order - b.order,
      );
      let active = 0,
        selected = 0;
      for (const record of this.ranked) {
        if (active >= this.maxActive) break;
        if (
          record.distance <= this.activeDistance ||
          (record.state === 'active' && record.distance <= this.retireDistance)
        ) {
          record.activeWanted = record.residentWanted = true;
          active++;
          selected++;
        }
      }
      for (const record of this.ranked) {
        if (selected >= this.maxResident) break;
        if (
          !record.residentWanted &&
          record.distance <= this.prefetchDistance
        ) {
          record.residentWanted = true;
          selected++;
        }
      }
      // Retire authoritative colliders and paths before freeing their shared asset leases.
      for (const record of this.records.values()) {
        if (!this.enabled || this.paused) break;
        if (record.state === 'active' && !record.activeWanted)
          this.retire(record);
        if (!record.residentWanted && record.resources) {
          if (record.task) this.cancel(record);
          else if (record.state !== 'failed') this.release(record);
        }
      }
      for (const record of this.ranked) {
        if (!this.enabled || this.paused) break;
        if (record.activeWanted && record.state === 'ready')
          this.publish(record);
      }
      let admitted = 0;
      const { pending, resident } = this.stats;
      for (const record of this.ranked) {
        if (!this.enabled || this.paused || admitted >= this.admissionsPerFrame)
          break;
        if (
          pending + admitted >= this.maxPending ||
          resident + admitted >= this.maxResident
        )
          break;
        if (
          !record.residentWanted ||
          record.state !== 'unloaded' ||
          record.task
        )
          continue;
        this.admit(record);
        admitted++;
      }
    } finally {
      this.processing = false;
      if (!this.enabled) this.clear();
    }
  }

  /** Wait for admitted work, including non-cooperative cancelled loaders. Does not admit/publish work. */
  async settled(): Promise<void> {
    await Promise.all(
      [...this.records.values()].flatMap((record) =>
        record.task ? [record.task] : [],
      ),
    );
  }

  destroy(): void {
    this.disposed = true;
    this.running = false;
    if (!this.processing) this.clear();
  }

  private admit(record: CellRecord): void {
    const resources = this.resources.createScope();
    const controller = new AbortController();
    const owned = new Set<SceneObject>();
    const roots = new Set<SceneObject>();
    resources.attach(() => destroyFactoryNodes(owned));
    record.resources = resources;
    record.controller = controller;
    record.owned = owned;
    record.state = 'loading';
    this.admissions++;
    const signal = AbortSignal.any([controller.signal, resources.signal]);
    const own = <Node extends SceneObject>(root: Node): Node => {
      collectFactoryNodes(root, owned);
      roots.add(root);
      if (owned.size > worldStreamingLimits.ownedNodesPerCell || roots.size > 1)
        throw new RangeError(
          'A streamed cell must own one bounded prefab root.',
        );
      if (signal.aborted || this.disposed || !this.running) {
        destroyFactoryNodes(owned);
        throw (
          signal.reason ??
          new DOMException('Streaming candidate retired.', 'AbortError')
        );
      }
      return root;
    };
    const context: WorldStreamingLoadContext = {
      cell: record.cell,
      signal,
      resources,
      own,
      async createFactory(registry, kind, options, services) {
        const root = await registry.createParsed(
          kind,
          registry.parse(kind, options),
          services,
          {
            signal,
            resources,
          },
        );
        return own(root);
      },
    };
    record.task = Promise.resolve()
      .then(() => {
        signal.throwIfAborted();
        return record.cell.load(context);
      })
      .then((candidate) => {
        if (!candidate || !candidate.root)
          throw new TypeError('Streaming loader must return an owned prefab.');
        own(candidate.root);
        // Validate navigation while still detached; malformed live content is never published.
        if (candidate.navigation) {
          const graph = this.navigation.prepare(
            new Map([[record.cell.id, candidate.navigation]]),
          );
          graph?.destroy();
        }
        record.root = candidate.root;
        record.fragment = candidate.navigation;
        record.state = 'ready';
      })
      .catch((error: unknown) => {
        const cancelled =
          signal.aborted ||
          this.disposed ||
          !this.running ||
          !record.residentWanted;
        try {
          this.release(record);
        } catch (cleanupError) {
          this.fail(
            record,
            'cleanup',
            new AggregateError(
              [error, cleanupError],
              'Streaming candidate cleanup failed.',
            ),
          );
          return;
        }
        if (!cancelled) this.fail(record, 'load', error);
      })
      .finally(() => {
        record.task = undefined;
        record.controller = undefined;
        if (record.state === 'cancelling') record.state = 'unloaded';
      });
  }

  private publish(record: CellRecord): void {
    const root = record.root!;
    const fragments = new Map(this.fragments);
    if (record.fragment) fragments.set(record.cell.id, record.fragment);
    let graph: NavigationGraph3D | undefined;
    let committed = false;
    try {
      graph = this.navigation.prepare(fragments);
      this.scene.publishStreamingSubtree(root, () => {
        record.state = 'active';
        if (record.fragment)
          this.fragments.set(record.cell.id, record.fragment);
        this.navigation.commit(graph);
        this.publications++;
        committed = true;
      });
      // Native lifecycle handlers may synchronously dispose the Scene or the just-published root.
      if (record.state === 'active' && root.scene !== this.scene) {
        this.retire(record);
        this.release(record);
      }
    } catch (error) {
      let failure = error;
      if (!committed) graph?.destroy();
      try {
        this.release(record);
      } catch (cleanupError) {
        failure = new AggregateError(
          [error, cleanupError],
          'Streaming publication cleanup failed.',
        );
      }
      this.fail(record, 'publish', failure);
    }
  }

  private retire(record: CellRecord): void {
    const fragments = new Map(this.fragments);
    fragments.delete(record.cell.id);
    const graph = this.navigation.prepare(fragments);
    const commit = (): void => {
      record.state = 'ready';
      this.fragments.delete(record.cell.id);
      this.navigation.commit(graph);
      this.retirements++;
    };
    try {
      if (record.root?.scene === this.scene)
        this.scene.retireStreamingSubtree(record.root, commit);
      else commit();
    } catch (error) {
      graph?.destroy();
      this.fail(record, 'retire', error);
      throw error;
    }
  }

  private cancel(record: CellRecord): void {
    if (record.state === 'cancelling') {
      this.release(record);
      return;
    }
    record.state = 'cancelling';
    this.cancellations++;
    const reason = new DOMException(
      `Streaming cell ${record.cell.id} is no longer resident.`,
      'AbortError',
    );
    record.controller?.abort(reason);
    record.resources?.cancelPending(reason);
    this.release(record);
  }

  private release(record: CellRecord): void {
    if (record.root?.scene === this.scene || this.fragments.has(record.cell.id))
      this.retire(record);
    record.resources?.release();
    record.resources = undefined;
    record.root = undefined;
    record.fragment = undefined;
    record.owned = undefined;
    if (record.state !== 'failed')
      record.state = record.task ? 'cancelling' : 'unloaded';
  }

  private fail(
    record: CellRecord,
    phase: WorldStreamingFailure['phase'],
    error: unknown,
  ): void {
    record.state = 'failed';
    record.error = error;
    const failure = { cell: record.cell.id, phase, error };
    this.dispatchEvent(
      new CustomEvent<WorldStreamingFailure>('error', { detail: failure }),
    );
    this.options.onError?.(failure);
  }

  private clear(): void {
    this.processing = true;
    const errors: unknown[] = [];
    try {
      for (const record of this.records.values()) {
        record.activeWanted = record.residentWanted = false;
        try {
          if (record.task) this.cancel(record);
          else this.release(record);
        } catch (error) {
          errors.push(error);
        }
      }
      if (this.disposed && !errors.length) this.navigation.destroy();
      if (errors.length)
        throw new AggregateError(
          errors,
          'Streaming teardown failed; resources remain owned for retry.',
        );
    } finally {
      this.processing = false;
    }
  }
}

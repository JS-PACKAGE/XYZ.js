import { Vector3 } from '../../../math/src/math3d.js';
import { navigationLimits } from '../../../../src/data/navigation.js';
import {
  NavigationGraph3D,
  type NavigationGraphOptions3D,
  type NavigationGraphPath3D,
  type NavigationGraphSearchOptions3D,
  type NavigationConnection3D,
  type NavigationConnectionEdit3D,
  type NavigationNode3D,
  type NavigationProjection3D,
  type NavigationProjectionOptions3D,
} from './graph.js';
import { PartitionNavigationJob, PartitionSearch } from './partition-search.js';
import {
  NavigationScheduler,
  type NavigationScheduledSearch,
} from './scheduler.js';

export interface NavigationGraphTile3D {
  readonly id: string;
  /** Existing authored or collision-baked lattice graph, snapshotted at construction. */
  readonly geometry: NavigationGraphOptions3D;
}
export interface NavigationTiledGraphOptions3D {
  readonly tiles: readonly NavigationGraphTile3D[];
  /** Endpoints use nodeId(tileId, localId); seams are explicit certified connections. */
  readonly seams: readonly NavigationConnection3D[];
  readonly tileSize?: number;
}
interface Edge {
  readonly to: number;
  readonly connection: number;
}

/** Partitioned sampled/authored world. Keeps per-tile validation limits and old graph semantics,
 * but local projection and sparse search never initialize a world-sized A* workspace.
 */
export class NavigationTiledGraph3D {
  readonly nodes: readonly NavigationNode3D[];
  private currentConnections: readonly NavigationConnection3D[];
  private readonly ids = new Map<string, number>();
  private readonly spatial = new Map<string, number[]>();
  private readonly edges: Edge[][] = [];
  private readonly jobs = new Set<
    PartitionNavigationJob<NavigationGraphPath3D>
  >();
  private readonly paths = new WeakSet<NavigationGraphPath3D>();
  private epoch = 0;
  private disposed = false;
  readonly tileSize: number;
  /** Length-prefixing preserves arbitrary existing local IDs without separator collisions. */
  static nodeId(tile: string, local: string): string {
    return `${tile.length}:${tile}${local}`;
  }
  constructor(options: NavigationTiledGraphOptions3D) {
    this.tileSize = options.tileSize ?? navigationLimits.meshTileSize;
    if (
      !options.tiles.length ||
      options.tiles.length > navigationLimits.partitionTiles ||
      options.seams.length > navigationLimits.partitionSeams ||
      !Number.isFinite(this.tileSize) ||
      this.tileSize <= 0 ||
      this.tileSize > navigationLimits.coordinateExtent
    )
      throw new RangeError('Invalid tiled navigation world.');
    let totalNodes = 0,
      totalConnections = options.seams.length;
    for (const tile of options.tiles) {
      totalNodes += tile.geometry.nodes.length;
      totalConnections += tile.geometry.connections.length;
      if (
        totalNodes > navigationLimits.partitionNodes ||
        totalConnections > navigationLimits.partitionConnections
      )
        throw new RangeError(
          'Tiled world exceeds its aggregate geometry budget.',
        );
    }
    const tiles = new Set<string>(),
      nodes: NavigationNode3D[] = [],
      connections: NavigationConnection3D[] = [];
    for (const tile of options.tiles) {
      if (
        typeof tile.id !== 'string' ||
        !tile.id ||
        tiles.has(tile.id) ||
        tile.id.length > navigationLimits.nodeIdLength
      )
        throw new RangeError('Invalid or duplicate navigation tile ID.');
      tiles.add(tile.id);
      const graph = new NavigationGraph3D(tile.geometry);
      try {
        for (const node of graph.nodes) {
          const id = NavigationTiledGraph3D.nodeId(tile.id, node.id);
          this.ids.set(id, nodes.length);
          nodes.push(Object.freeze({ ...node, id }));
        }
        for (const connection of graph.connections)
          connections.push(
            Object.freeze({
              ...connection,
              from: NavigationTiledGraph3D.nodeId(tile.id, connection.from),
              to: NavigationTiledGraph3D.nodeId(tile.id, connection.to),
            }),
          );
      } finally {
        graph.destroy();
      }
    }
    this.nodes = Object.freeze(nodes);
    for (let i = 0; i < nodes.length; i++) {
      this.edges.push([]);
      const p = nodes[i]!.position,
        x = Math.floor(p.x / this.tileSize),
        z = Math.floor(p.z / this.tileSize);
      if (!Number.isSafeInteger(x) || !Number.isSafeInteger(z))
        throw new RangeError(
          'Tiled spatial coordinates must be safe integers.',
        );
      const key = `${x}:${z}`;
      const bucket = this.spatial.get(key) ?? [];
      if (bucket.length >= navigationLimits.partitionTileNodes)
        throw new RangeError(
          'Spatial tile node budget exceeded; reduce tileSize.',
        );
      bucket.push(i);
      this.spatial.set(key, bucket);
    }
    for (const seam of options.seams) {
      const from = this.ids.get(seam.from),
        to = this.ids.get(seam.to);
      if (from === undefined || to === undefined || from === to)
        throw new RangeError('Unknown or identical seam endpoint.');
      // Validate local aliases so qualified IDs retain the full original 1.x ID budget.
      const validator = new NavigationGraph3D({
        nodes: [
          { ...nodes[from]!, id: 'from' },
          { ...nodes[to]!, id: 'to' },
        ],
        connections: [{ ...seam, from: 'from', to: 'to' }],
      });
      try {
        connections.push(
          Object.freeze({
            ...validator.connections[0]!,
            from: seam.from,
            to: seam.to,
          }),
        );
      } finally {
        validator.destroy();
      }
    }
    const pairs = new Set<string>();
    for (let i = 0; i < connections.length; i++) {
      const c = connections[i]!,
        from = this.ids.get(c.from)!,
        to = this.ids.get(c.to)!;
      const forward = `${from}:${to}`,
        reverse = `${to}:${from}`;
      if (pairs.has(forward) || (!c.directed && pairs.has(reverse)))
        throw new RangeError('Duplicate tiled connection.');
      pairs.add(forward);
      this.edges[from]!.push({ to, connection: i });
      if (!c.directed) {
        pairs.add(reverse);
        this.edges[to]!.push({ to: from, connection: i });
      }
    }
    for (const edges of this.edges) {
      if (edges.length > navigationLimits.partitionNodeEdges)
        throw new RangeError('Tiled node degree budget exceeded.');
      edges.sort((a, b) => a.to - b.to);
    }
    this.currentConnections = Object.freeze(connections);
  }
  get connections(): readonly NavigationConnection3D[] {
    return this.currentConnections;
  }
  get revision(): number {
    return this.epoch;
  }
  get destroyed(): boolean {
    return this.disposed;
  }
  get availableSearchSlots(): number {
    return this.disposed
      ? 0
      : navigationLimits.concurrentSearches - this.jobs.size;
  }
  isPathCurrent(path: NavigationGraphPath3D): boolean {
    return (
      !this.disposed && this.paths.has(path) && path.revision === this.epoch
    );
  }
  getNode(id: string): NavigationNode3D {
    const index = this.ids.get(id);
    if (index === undefined) throw new RangeError('Unknown tiled node.');
    return this.nodes[index]!;
  }
  getConnectionIndex(from: string, to: string): number | undefined {
    const a = this.ids.get(from),
      b = this.ids.get(to);
    if (a === undefined || b === undefined)
      throw new RangeError('Unknown tiled endpoint.');
    return this.edges[a]!.find((edge) => edge.to === b)?.connection;
  }
  setConnection(
    index: number,
    state: Omit<NavigationConnectionEdit3D, 'index'>,
  ): void {
    this.setConnections([{ index, ...state }]);
  }
  setConnections(edits: readonly NavigationConnectionEdit3D[]): void {
    if (this.disposed) throw new Error('Tiled graph is destroyed.');
    if (edits.length > navigationLimits.partitionSeams)
      throw new RangeError('Tiled edit budget exceeded.');
    const changes = new Map<number, NavigationConnection3D>();
    for (const edit of edits) {
      if (
        !Number.isInteger(edit.index) ||
        edit.index < 0 ||
        edit.index >= this.connections.length
      )
        throw new RangeError('Unknown tiled connection.');
      const prior = changes.get(edit.index) ?? this.connections[edit.index]!;
      const enabled = edit.enabled ?? prior.enabled!,
        clearance = edit.clearance ?? prior.clearance!;
      if (
        typeof enabled !== 'boolean' ||
        !(
          clearance === Infinity ||
          (Number.isFinite(clearance) &&
            clearance >= 0 &&
            clearance <= navigationLimits.coordinateExtent)
        )
      )
        throw new RangeError('Invalid tiled connection state.');
      changes.set(edit.index, Object.freeze({ ...prior, enabled, clearance }));
    }
    if (
      ![...changes].some(
        ([i, c]) =>
          c.enabled !== this.connections[i]!.enabled ||
          c.clearance !== this.connections[i]!.clearance,
      )
    )
      return;
    const next = this.connections.slice();
    for (const [index, value] of changes) next[index] = value;
    this.currentConnections = Object.freeze(next);
    this.epoch++;
    for (const job of this.jobs) job.invalidate();
  }
  project(
    position: Readonly<Vector3>,
    options: NavigationProjectionOptions3D,
  ): NavigationProjection3D | undefined {
    if (this.disposed) throw new Error('Tiled graph is destroyed.');
    const radius = options.agentRadius ?? 0;
    if (
      ![
        position.x,
        position.y,
        position.z,
        options.maxDistance,
        options.maxVerticalDistance,
        radius,
      ].every(
        (v) =>
          Number.isFinite(v) &&
          Math.abs(v) <= navigationLimits.coordinateExtent,
      ) ||
      radius < 0 ||
      options.maxDistance < 0 ||
      options.maxVerticalDistance < 0
    )
      throw new RangeError('Invalid tiled projection bounds.');
    const span = Math.ceil((2 * options.maxDistance) / this.tileSize) + 2;
    if (span * span > navigationLimits.projectionTiles)
      throw new RangeError('Projection spans too many tiles.');
    const minX = Math.floor((position.x - options.maxDistance) / this.tileSize);
    const maxX = Math.floor((position.x + options.maxDistance) / this.tileSize);
    const minZ = Math.floor((position.z - options.maxDistance) / this.tileSize);
    const maxZ = Math.floor((position.z + options.maxDistance) / this.tileSize);
    if (![minX, maxX, minZ, maxZ].every(Number.isSafeInteger))
      throw new RangeError(
        'Tiled projection coordinates must be safe integers.',
      );
    let best: NavigationNode3D | undefined,
      distance = options.maxDistance;
    for (let x = minX; x <= maxX; x++)
      for (let z = minZ; z <= maxZ; z++)
        for (const index of this.spatial.get(`${x}:${z}`) ?? []) {
          const node = this.nodes[index]!;
          if (
            !node.walkable ||
            node.clearance! < radius ||
            Math.abs(node.position.y - position.y) > options.maxVerticalDistance
          )
            continue;
          const d = Math.hypot(
            node.position.x - position.x,
            node.position.y - position.y,
            node.position.z - position.z,
          );
          if (
            d < distance ||
            (d === distance && (!best || this.ids.get(best.id)! > index))
          ) {
            best = node;
            distance = d;
          }
        }
    return (
      best && Object.freeze({ node: best, distance, revision: this.epoch })
    );
  }
  scheduleSearch(
    scheduler: NavigationScheduler,
    start: string,
    goal: string,
    options: NavigationGraphSearchOptions3D = {},
  ): NavigationScheduledSearch<NavigationGraphPath3D> {
    this.validate(start, goal, options);
    const snapshot = {
      ...options,
      excludedConnections: options.excludedConnections?.slice(),
    };
    return scheduler.schedule(this, () =>
      this.createSearch(start, goal, snapshot),
    );
  }
  findPath(
    start: string,
    goal: string,
    options: NavigationGraphSearchOptions3D = {},
  ): NavigationGraphPath3D {
    const job = this.createSearch(start, goal, options);
    while (job.status === 'pending')
      job.step(navigationLimits.expansionsPerStep);
    return job.result!;
  }
  createSearch(
    start: string,
    goal: string,
    options: NavigationGraphSearchOptions3D = {},
  ): PartitionNavigationJob<NavigationGraphPath3D> {
    this.validate(start, goal, options);
    if (this.availableSearchSlots === 0)
      throw new RangeError('Navigation concurrent search budget exhausted.');
    const from = this.ids.get(start)!,
      to = this.ids.get(goal)!,
      revision = this.epoch,
      radius = options.agentRadius ?? 0;
    const excluded = new Set(options.excludedConnections),
      search = new PartitionSearch();
    let phase: 'search' | 'backtrack' | 'forward' | 'publish' = 'search',
      back = to,
      cursor = -1,
      found = false;
    const reverse: number[] = [],
      nodes: NavigationNode3D[] = [];
    if (
      this.nodes[from]!.walkable &&
      this.nodes[to]!.walkable &&
      this.nodes[from]!.clearance! >= radius &&
      this.nodes[to]!.clearance! >= radius
    )
      search.offer(from, 0, 0, -1);
    const job = new PartitionNavigationJob<NavigationGraphPath3D>(
      () => {
        if (phase === 'search') {
          const current = search.take();
          if (current === undefined) phase = 'publish';
          else if (current === to) {
            found = true;
            phase = 'backtrack';
          } else
            for (const edge of this.edges[current]!) {
              const connection = this.connections[edge.connection]!,
                node = this.nodes[edge.to]!;
              if (
                !connection.enabled ||
                connection.clearance! < radius ||
                !node.walkable ||
                node.clearance! < radius ||
                excluded.has(edge.connection)
              )
                continue;
              const distance = search.distance.get(current)! + connection.cost;
              if (distance < (search.distance.get(edge.to) ?? Infinity))
                search.offer(edge.to, distance, distance, current);
            }
        } else if (phase === 'backtrack') {
          if (back >= 0) {
            reverse.push(back);
            back = search.parent.get(back)!;
          } else {
            cursor = reverse.length - 1;
            phase = 'forward';
          }
        } else if (phase === 'forward') {
          if (cursor >= 0) nodes.push(this.nodes[reverse[cursor--]!]!);
          else phase = 'publish';
        } else {
          const path: NavigationGraphPath3D = Object.freeze({
            status: found ? 'found' : 'unreachable',
            nodes: Object.freeze(nodes),
            cost: found ? search.distance.get(to)! : Infinity,
            revision,
          });
          this.paths.add(path);
          return path;
        }
        return undefined;
      },
      () => !this.disposed && revision === this.epoch,
      () => this.jobs.delete(job),
      (path) => path.status === 'found',
    );
    this.jobs.add(job);
    return job;
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const job of this.jobs) job.cancel();
    this.spatial.clear();
  }
  private validate(
    start: string,
    goal: string,
    options: NavigationGraphSearchOptions3D,
  ): void {
    if (this.disposed) throw new Error('Tiled graph is destroyed.');
    this.getNode(start);
    this.getNode(goal);
    const radius = options.agentRadius ?? 0;
    if (
      !Number.isFinite(radius) ||
      radius < 0 ||
      radius > navigationLimits.coordinateExtent ||
      (options.excludedConnections?.length ?? 0) >
        navigationLimits.partitionSeams ||
      options.excludedConnections?.some(
        (i) => !Number.isInteger(i) || i < 0 || i >= this.connections.length,
      )
    )
      throw new RangeError('Invalid tiled search radius or exclusions.');
  }
}

import { Vector3 } from '../../../math/src/math3d.js';
import { navigationLimits } from '../../../../src/data/navigation.js';
import { NavigationSearchJob, NavigationSearchPool } from './jobs.js';
import {
  NavigationScheduler,
  type NavigationScheduledSearch,
} from './scheduler.js';

export interface NavigationNode3D {
  readonly id: string;
  readonly position: Readonly<Vector3>;
}
export interface NavigationConnection3D {
  readonly from: string;
  readonly to: string;
  /** Nonnegative finite total edge cost, independent of geometric distance. */
  readonly cost: number;
  /** False (default) installs both directions. */
  readonly directed?: boolean;
  readonly enabled?: boolean;
  /** Authored maximum agent radius in world units; omitted means unconstrained. */
  readonly clearance?: number;
}
export interface NavigationGraphOptions3D {
  readonly nodes: readonly NavigationNode3D[];
  readonly connections: readonly NavigationConnection3D[];
}
export interface NavigationGraphSearchOptions3D {
  readonly agentRadius?: number;
  /** Local exclusions, e.g. connections a character found physically blocked. */
  readonly excludedConnections?: readonly number[];
}
export interface NavigationConnectionEdit3D {
  readonly index: number;
  readonly enabled?: boolean;
  readonly clearance?: number;
}
export interface NavigationGraphPath3D {
  readonly status: 'found' | 'unreachable';
  readonly nodes: readonly NavigationNode3D[];
  readonly cost: number;
  readonly revision: number;
}
interface Edge {
  readonly to: number;
  readonly cost: number;
  readonly connection: number;
}

/** Authored waypoint graph with revisioned connection state, not an automatic navmesh. */
export class NavigationGraph3D {
  readonly nodes: readonly NavigationNode3D[];
  private currentConnections: readonly NavigationConnection3D[];
  private readonly indices = new Map<string, number>();
  private readonly edges: Edge[][];
  private readonly searches: NavigationSearchPool<NavigationGraphPath3D>;
  private readonly heuristicScale: number;
  private currentRevision = 0;
  private disposed = false;
  private readonly paths = new WeakSet<NavigationGraphPath3D>();

  constructor(options: NavigationGraphOptions3D) {
    if (
      options.nodes.length === 0 ||
      options.nodes.length > navigationLimits.graphNodes ||
      options.connections.length > navigationLimits.graphConnections
    )
      throw new RangeError(
        'Navigation graph exceeds the node or connection budget.',
      );
    const nodes: NavigationNode3D[] = [];
    for (const node of options.nodes) {
      if (
        typeof node.id !== 'string' ||
        node.id.length === 0 ||
        node.id.length > navigationLimits.nodeIdLength ||
        this.indices.has(node.id)
      )
        throw new RangeError(
          'Navigation node IDs must be unique bounded nonempty strings.',
        );
      const { x, y, z } = node.position;
      if (
        ![x, y, z].every(
          (value) =>
            Number.isFinite(value) &&
            Math.abs(value) <= navigationLimits.coordinateExtent,
        )
      )
        throw new RangeError(
          'Navigation node positions exceed finite coordinate bounds.',
        );
      this.indices.set(node.id, nodes.length);
      nodes.push(
        Object.freeze({
          id: node.id,
          position: Object.freeze(new Vector3(x, y, z)),
        }),
      );
    }
    this.nodes = Object.freeze(nodes);
    this.edges = Array.from({ length: nodes.length }, () => []);
    this.searches = new NavigationSearchPool(nodes.length);
    const connections: NavigationConnection3D[] = [];
    let scale = Infinity;
    const pairs = new Set<number>();
    for (const connection of options.connections) {
      const from = this.indices.get(connection.from);
      const to = this.indices.get(connection.to);
      const directed = connection.directed ?? false;
      const enabled = connection.enabled ?? true;
      const clearance = connection.clearance ?? Infinity;
      if (
        from === undefined ||
        to === undefined ||
        from === to ||
        typeof directed !== 'boolean' ||
        typeof enabled !== 'boolean' ||
        !(
          clearance === Infinity ||
          (Number.isFinite(clearance) &&
            clearance >= 0 &&
            clearance <= navigationLimits.coordinateExtent)
        ) ||
        !Number.isFinite(connection.cost) ||
        connection.cost < 0 ||
        connection.cost > navigationLimits.cost
      )
        throw new RangeError(
          'Navigation connection requires distinct known nodes and nonnegative finite cost.',
        );
      const forward = from * nodes.length + to;
      const reverse = to * nodes.length + from;
      if (pairs.has(forward) || (!directed && pairs.has(reverse)))
        throw new RangeError(
          'Navigation graph cannot contain duplicate directed edges.',
        );
      pairs.add(forward);
      this.edges[from]!.push({
        to,
        cost: connection.cost,
        connection: connections.length,
      });
      if (!directed) {
        pairs.add(reverse);
        this.edges[to]!.push({
          to: from,
          cost: connection.cost,
          connection: connections.length,
        });
      }
      const a = nodes[from]!.position;
      const b = nodes[to]!.position;
      const length = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      if (length > 0) scale = Math.min(scale, connection.cost / length);
      connections.push(
        Object.freeze({
          from: connection.from,
          to: connection.to,
          cost: connection.cost,
          directed,
          enabled,
          clearance,
        }),
      );
    }
    this.currentConnections = Object.freeze(connections);
    // Every edge costs at least scale * distance. Triangle inequality makes this
    // admissible even for arbitrary cheap edges; zero-cost spatial edges give Dijkstra.
    this.heuristicScale = scale === Infinity ? 0 : scale * (1 - 1e-12);
    for (const edges of this.edges) edges.sort((a, b) => a.to - b.to);
  }

  get connections(): readonly NavigationConnection3D[] {
    return this.currentConnections;
  }
  get availableSearchSlots(): number {
    return this.searches.availableSlots;
  }

  scheduleSearch(
    scheduler: NavigationScheduler,
    start: string,
    goal: string,
    options: NavigationGraphSearchOptions3D = {},
  ): NavigationScheduledSearch<NavigationGraphPath3D> {
    this.getNode(start);
    this.getNode(goal);
    if (this.disposed) throw new Error('Navigation graph is destroyed.');
    const radius = options.agentRadius ?? 0;
    if (
      !Number.isFinite(radius) ||
      radius < 0 ||
      radius > navigationLimits.coordinateExtent
    )
      throw new RangeError('Invalid navigation agent radius.');
    if (
      (options.excludedConnections?.length ?? 0) >
        navigationLimits.graphConnections ||
      options.excludedConnections?.some(
        (index) =>
          !Number.isInteger(index) ||
          index < 0 ||
          index >= this.currentConnections.length,
      )
    )
      throw new RangeError('Invalid navigation connection exclusions.');
    const profile = {
      ...options,
      excludedConnections: options.excludedConnections?.slice(),
    };
    return scheduler.schedule(this, () =>
      this.createSearch(start, goal, profile),
    );
  }
  get revision(): number {
    return this.currentRevision;
  }
  get destroyed(): boolean {
    return this.disposed;
  }

  isPathCurrent(path: NavigationGraphPath3D): boolean {
    return (
      !this.disposed &&
      this.paths.has(path) &&
      path.revision === this.currentRevision
    );
  }

  getConnectionIndex(from: string, to: string): number | undefined {
    const source = this.indices.get(from),
      target = this.indices.get(to);
    if (source === undefined || target === undefined)
      throw new RangeError('Unknown navigation endpoint.');
    return this.edges[source]!.find((edge) => edge.to === target)?.connection;
  }

  setConnection(
    index: number,
    state: Omit<NavigationConnectionEdit3D, 'index'>,
  ): void {
    this.setConnections([{ index, ...state }]);
  }

  /** Atomic edits. Undirected connection state affects both directions. */
  setConnections(edits: readonly NavigationConnectionEdit3D[]): void {
    if (this.disposed) throw new Error('Navigation graph is destroyed.');
    if (edits.length > navigationLimits.graphConnections)
      throw new RangeError('Navigation connection edit budget exceeded.');
    const candidates = new Map<number, NavigationConnection3D>();
    for (const edit of edits) {
      if (
        !Number.isInteger(edit.index) ||
        edit.index < 0 ||
        edit.index >= this.currentConnections.length
      )
        throw new RangeError('Unknown navigation connection index.');
      const prior =
        candidates.get(edit.index) ?? this.currentConnections[edit.index]!;
      const enabled = edit.enabled ?? prior.enabled!;
      const clearance = edit.clearance ?? prior.clearance!;
      if (
        typeof enabled !== 'boolean' ||
        !(
          clearance === Infinity ||
          (Number.isFinite(clearance) &&
            clearance >= 0 &&
            clearance <= navigationLimits.coordinateExtent)
        )
      )
        throw new RangeError(
          'Connections require boolean enabled and nonnegative bounded clearance.',
        );
      candidates.set(
        edit.index,
        Object.freeze({ ...prior, enabled, clearance }),
      );
    }
    let changed = false;
    for (const [index, state] of candidates) {
      const prior = this.currentConnections[index]!;
      if (
        prior.enabled !== state.enabled ||
        prior.clearance !== state.clearance
      )
        changed = true;
    }
    if (!changed) return;
    const connections = this.currentConnections.slice();
    for (const [index, state] of candidates) connections[index] = state;
    this.currentConnections = Object.freeze(connections);
    this.currentRevision++;
    this.searches.invalidate();
  }

  getNode(id: string): NavigationNode3D {
    const index = this.indices.get(id);
    if (index === undefined) throw new RangeError('Unknown navigation node.');
    return this.nodes[index]!;
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
  ): NavigationSearchJob<NavigationGraphPath3D> {
    const from = this.indices.get(start);
    const to = this.indices.get(goal);
    if (from === undefined || to === undefined)
      throw new RangeError('Unknown navigation endpoint.');
    const radius = options.agentRadius ?? 0;
    if (
      !Number.isFinite(radius) ||
      radius < 0 ||
      radius > navigationLimits.coordinateExtent
    )
      throw new RangeError(
        'Navigation agent radius exceeds its nonnegative finite bound.',
      );
    const exclusions = options.excludedConnections ?? [];
    if (exclusions.length > navigationLimits.graphConnections)
      throw new RangeError('Navigation exclusion budget exceeded.');
    for (const index of exclusions)
      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= this.currentConnections.length
      )
        throw new RangeError('Unknown excluded navigation connection.');
    const excluded = new Set(exclusions);
    const revision = this.currentRevision;
    const target = this.nodes[to]!.position;
    return this.searches.create({
      from,
      to,
      estimate: (node) => this.heuristic(node, target),
      expand: (current, search) => {
        for (const edge of this.edges[current]!) {
          const connection = this.currentConnections[edge.connection]!;
          if (
            !connection.enabled ||
            connection.clearance! < radius ||
            excluded.has(edge.connection)
          )
            continue;
          const distance = search.distance[current]! + edge.cost;
          if (distance >= search.distance[edge.to]!) continue;
          search.offer(
            edge.to,
            distance,
            distance + this.heuristic(edge.to, target),
            current,
          );
        }
      },
      result: (found, search) => {
        const nodes: NavigationNode3D[] = [];
        if (found) {
          for (let node = to; node >= 0; node = search.parent[node]!)
            nodes.push(this.nodes[node]!);
          nodes.reverse();
        }
        const path: NavigationGraphPath3D = Object.freeze({
          status: found ? 'found' : 'unreachable',
          nodes: Object.freeze(nodes),
          cost: found ? search.distance[to]! : Infinity,
          revision,
        });
        this.paths.add(path);
        return path;
      },
    });
  }

  destroy(): void {
    this.disposed = true;
    this.searches.destroy();
  }

  private heuristic(node: number, target: Readonly<Vector3>): number {
    const position = this.nodes[node]!.position;
    return (
      this.heuristicScale *
      Math.hypot(
        position.x - target.x,
        position.y - target.y,
        position.z - target.z,
      )
    );
  }
}

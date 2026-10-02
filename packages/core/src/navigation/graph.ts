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
  readonly walkable?: boolean;
  /** Maximum certified radius; omitted on authored nodes means unconstrained. */
  readonly clearance?: number;
  /** Baked support height. Surface followers let the capsule controller climb steps rather than fly. */
  readonly surfaceY?: number;
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
  /** Special links require an explicit follower traversal handler, never straight-line movement. */
  readonly kind?: 'walk' | 'special';
  readonly linkId?: string;
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
export interface NavigationProjectionOptions3D {
  readonly maxDistance: number;
  /** Prevents selecting a bridge deck when projecting a character underneath it. */
  readonly maxVerticalDistance: number;
  readonly agentRadius?: number;
}
export interface NavigationProjection3D {
  readonly node: NavigationNode3D;
  readonly distance: number;
  readonly revision: number;
}
interface Edge {
  readonly to: number;
  readonly cost: number;
  readonly connection: number;
}

/** Authored waypoint graph with revisioned connection state, not an automatic navmesh. */
export class NavigationGraph3D {
  private currentNodes: readonly NavigationNode3D[];
  private currentConnections: readonly NavigationConnection3D[];
  private indices = new Map<string, number>();
  private edges: Edge[][];
  private readonly searches: NavigationSearchPool<NavigationGraphPath3D>;
  private heuristicScale: number;
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
      if (node.walkable !== undefined && typeof node.walkable !== 'boolean')
        throw new RangeError('Navigation node walkability must be boolean.');
      const clearance = node.clearance ?? Infinity;
      if (!(
        clearance === Infinity ||
        (Number.isFinite(clearance) &&
          clearance >= 0 &&
          clearance <= navigationLimits.coordinateExtent)
      ))
        throw new RangeError('Invalid navigation node clearance.');
      if (
        node.surfaceY !== undefined &&
        (!Number.isFinite(node.surfaceY) ||
          Math.abs(node.surfaceY) > navigationLimits.coordinateExtent)
      )
        throw new RangeError('Invalid sampled support height.');
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
          walkable: node.walkable ?? true,
          clearance,
          surfaceY: node.surfaceY,
        }),
      );
    }
    this.currentNodes = Object.freeze(nodes);
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
      const kind = connection.kind ?? 'walk';
      const linkId = connection.linkId;
      if (
        from === undefined ||
        to === undefined ||
        from === to ||
        (kind !== 'walk' && kind !== 'special') ||
        (kind === 'special' &&
          (typeof linkId !== 'string' ||
            linkId.length === 0 ||
            linkId.length > navigationLimits.nodeIdLength)) ||
        (kind === 'walk' && linkId !== undefined) ||
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
          kind,
          linkId,
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
  get nodes(): readonly NavigationNode3D[] {
    return this.currentNodes;
  }
  get availableSearchSlots(): number {
    return this.searches.availableSlots;
  }

  /** Atomic sampled-surface rebake; stable IDs keep live followers' route anchors valid. */
  replaceGeometry(options: NavigationGraphOptions3D): void {
    if (this.disposed) throw new Error('Navigation graph is destroyed.');
    if (
      options.nodes.length !== this.nodes.length ||
      options.nodes.some((node, index) => node.id !== this.nodes[index]!.id)
    )
      throw new RangeError(
        'A rebake must preserve sampled node IDs and order.',
      );
    const candidate = new NavigationGraph3D(options);
    this.searches.invalidate();
    this.currentNodes = candidate.currentNodes;
    this.currentConnections = candidate.currentConnections;
    this.edges = candidate.edges;
    this.indices = candidate.indices;
    this.heuristicScale = candidate.heuristicScale;
    this.currentRevision++;
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
  /** Bounded nearest certified node, not arbitrary navmesh/geometry projection. */
  project(
    position: Readonly<Vector3>,
    options: NavigationProjectionOptions3D,
  ): NavigationProjection3D | undefined {
    if (this.disposed) throw new Error('Navigation graph is destroyed.');
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
        (value) =>
          Number.isFinite(value) &&
          Math.abs(value) <= navigationLimits.coordinateExtent,
      ) ||
      options.maxDistance < 0 ||
      options.maxVerticalDistance < 0 ||
      radius < 0
    )
      throw new RangeError(
        'Projection requires explicit finite distance bounds and agent radius.',
      );
    let nearest: NavigationNode3D | undefined,
      distance = options.maxDistance;
    for (const node of this.nodes) {
      if (
        !node.walkable ||
        node.clearance! < radius ||
        Math.abs(node.position.y - position.y) > options.maxVerticalDistance
      )
        continue;
      const candidate = Math.hypot(
        node.position.x - position.x,
        node.position.y - position.y,
        node.position.z - position.z,
      );
      if (candidate < distance || (candidate === distance && !nearest)) {
        nearest = node;
        distance = candidate;
      }
    }
    return (
      nearest &&
      Object.freeze({ node: nearest, distance, revision: this.revision })
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
      from:
        this.nodes[from]!.walkable &&
        this.nodes[to]!.walkable &&
        this.nodes[from]!.clearance! >= radius &&
        this.nodes[to]!.clearance! >= radius
          ? from
          : -1,
      to,
      estimate: (node) => this.heuristic(node, target),
      expand: (current, search) => {
        for (const edge of this.edges[current]!) {
          const connection = this.currentConnections[edge.connection]!;
          if (
            !connection.enabled ||
            !this.nodes[edge.to]!.walkable ||
            this.nodes[edge.to]!.clearance! < radius ||
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

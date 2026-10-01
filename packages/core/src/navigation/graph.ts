import { Vector3 } from '../../../math/src/math3d.js';
import { navigationLimits } from '../../../../src/data/navigation.js';
import { NavigationSearch } from './search.js';

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
}
export interface NavigationGraphOptions3D {
  readonly nodes: readonly NavigationNode3D[];
  readonly connections: readonly NavigationConnection3D[];
}
export interface NavigationGraphPath3D {
  readonly status: 'found' | 'unreachable';
  readonly nodes: readonly NavigationNode3D[];
  readonly cost: number;
}
interface Edge {
  readonly to: number;
  readonly cost: number;
}

/** Owned immutable waypoint graph, not a navmesh. Explicit edges describe traversable routes. */
export class NavigationGraph3D {
  readonly nodes: readonly NavigationNode3D[];
  readonly connections: readonly NavigationConnection3D[];
  private readonly indices = new Map<string, number>();
  private readonly edges: Edge[][];
  private readonly search: NavigationSearch;
  private readonly heuristicScale: number;

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
    this.search = new NavigationSearch(nodes.length);
    const connections: NavigationConnection3D[] = [];
    let scale = Infinity;
    const pairs = new Set<number>();
    for (const connection of options.connections) {
      const from = this.indices.get(connection.from);
      const to = this.indices.get(connection.to);
      const directed = connection.directed ?? false;
      if (
        from === undefined ||
        to === undefined ||
        from === to ||
        typeof directed !== 'boolean' ||
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
      this.edges[from]!.push({ to, cost: connection.cost });
      if (!directed) {
        pairs.add(reverse);
        this.edges[to]!.push({ to: from, cost: connection.cost });
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
        }),
      );
    }
    this.connections = Object.freeze(connections);
    // Every edge costs at least scale * distance. Triangle inequality makes this
    // admissible even for arbitrary cheap edges; zero-cost spatial edges give Dijkstra.
    this.heuristicScale = scale === Infinity ? 0 : scale * (1 - 1e-12);
    for (const edges of this.edges) edges.sort((a, b) => a.to - b.to);
  }

  getNode(id: string): NavigationNode3D {
    const index = this.indices.get(id);
    if (index === undefined) throw new RangeError('Unknown navigation node.');
    return this.nodes[index]!;
  }

  findPath(start: string, goal: string): NavigationGraphPath3D {
    const from = this.indices.get(start);
    const to = this.indices.get(goal);
    if (from === undefined || to === undefined)
      throw new RangeError('Unknown navigation endpoint.');
    const search = this.search;
    const target = this.nodes[to]!.position;
    search.reset();
    search.offer(from, 0, this.heuristic(from, target), -1);
    for (let current = search.take(); current >= 0; current = search.take()) {
      if (current === to) {
        const nodes: NavigationNode3D[] = [];
        for (let node = to; node >= 0; node = search.parent[node]!)
          nodes.push(this.nodes[node]!);
        nodes.reverse();
        return Object.freeze({
          status: 'found',
          nodes: Object.freeze(nodes),
          cost: search.distance[to]!,
        });
      }
      for (const edge of this.edges[current]!) {
        const distance = search.distance[current]! + edge.cost;
        if (distance >= search.distance[edge.to]!) continue;
        search.offer(
          edge.to,
          distance,
          distance + this.heuristic(edge.to, target),
          current,
        );
      }
    }
    return Object.freeze({
      status: 'unreachable',
      nodes: Object.freeze([]),
      cost: Infinity,
    });
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

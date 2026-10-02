import { worldStreamingLimits } from '../../../src/data/world-streaming.js';
import { navigationLimits } from '../../../src/data/navigation.js';
import {
  NavigationGraph3D,
  type NavigationGraphOptions3D,
  type NavigationGraphPath3D,
  type NavigationNode3D,
  type NavigationConnection3D,
} from './navigation/graph.js';

export interface WorldStreamingPortal3D {
  /** Exactly two live cells may share a seam. Unmatched portals do not create edges. */
  readonly seam: string;
  readonly node: string;
  readonly clearance: number;
}

/** World-space authored geometry. Node IDs are local to a cell. */
export interface WorldStreamingNavigationFragment3D extends NavigationGraphOptions3D {
  readonly portals?: readonly WorldStreamingPortal3D[];
}

interface Portal extends WorldStreamingPortal3D {
  readonly cell: string;
  readonly endpoint: NavigationNode3D;
}

/** Owns the current streamed graph; every topology change invalidates all old paths and jobs. */
export class WorldStreamingNavigation3D {
  private current: NavigationGraph3D | undefined;
  private generation = 0;
  private disposed = false;

  get graph(): NavigationGraph3D | undefined {
    return this.current;
  }

  get revision(): number {
    return this.generation;
  }

  nodeId(cell: string, node: string): string {
    // Length-prefixing avoids aliases even when authored IDs contain separators.
    const id = `${cell.length}:${cell}${node}`;
    if (id.length > navigationLimits.nodeIdLength)
      throw new RangeError('Streamed navigation node ID exceeds its budget.');
    return id;
  }

  isPathCurrent(path: NavigationGraphPath3D): boolean {
    return this.current?.isPathCurrent(path) ?? false;
  }

  /** Validate/build off-scene. The controller commits only after collider registration succeeds. */
  prepare(
    fragments: ReadonlyMap<string, WorldStreamingNavigationFragment3D>,
  ): NavigationGraph3D | undefined {
    if (this.disposed) throw new Error('Streaming navigation is destroyed.');
    const nodes: NavigationNode3D[] = [];
    const connections: NavigationConnection3D[] = [];
    const portals = new Map<string, Portal[]>();
    for (const [cell, fragment] of fragments) {
      // Validate the fragment independently, including connections to nonexistent local nodes.
      const validated = new NavigationGraph3D(fragment);
      try {
        const local = new Map<string, NavigationNode3D>();
        for (const node of validated.nodes) {
          const endpoint = { ...node, id: this.nodeId(cell, node.id) };
          nodes.push(endpoint);
          local.set(node.id, endpoint);
        }
        for (const edge of validated.connections)
          connections.push({
            ...edge,
            from: this.nodeId(cell, edge.from),
            to: this.nodeId(cell, edge.to),
          });
        if ((fragment.portals?.length ?? 0) > validated.nodes.length)
          throw new RangeError(
            'Streaming portals exceed the fragment node budget.',
          );
        const seen = new Set<string>();
        for (const portal of fragment.portals ?? []) {
          const endpoint = local.get(portal.node);
          if (
            !endpoint ||
            typeof portal.seam !== 'string' ||
            !portal.seam ||
            portal.seam.length > navigationLimits.nodeIdLength ||
            seen.has(portal.seam) ||
            !Number.isFinite(portal.clearance) ||
            portal.clearance < 0 ||
            portal.clearance > navigationLimits.coordinateExtent
          )
            throw new RangeError('Invalid or duplicate streaming seam portal.');
          seen.add(portal.seam);
          const pair = portals.get(portal.seam) ?? [];
          pair.push({ ...portal, cell, endpoint });
          if (pair.length > 2)
            throw new RangeError(
              `Streaming seam ${portal.seam} has more than two owners.`,
            );
          portals.set(portal.seam, pair);
        }
      } finally {
        validated.destroy();
      }
    }
    if (
      nodes.length > navigationLimits.graphNodes ||
      connections.length > navigationLimits.graphConnections
    )
      throw new RangeError(
        'Streamed navigation exceeds the aggregate graph budget.',
      );
    for (const [seam, pair] of portals) {
      if (pair.length !== 2) continue;
      const [a, b] = pair as [Portal, Portal];
      const distance = Math.hypot(
        a.endpoint.position.x - b.endpoint.position.x,
        a.endpoint.position.y - b.endpoint.position.y,
        a.endpoint.position.z - b.endpoint.position.z,
      );
      if (distance > worldStreamingLimits.seamTolerance)
        throw new RangeError(
          `Streaming seam ${seam} endpoints do not coincide.`,
        );
      connections.push({
        from: a.endpoint.id,
        to: b.endpoint.id,
        cost: distance,
        clearance: Math.min(a.clearance, b.clearance),
      });
    }
    return nodes.length
      ? new NavigationGraph3D({ nodes, connections })
      : undefined;
  }

  /** @internal Infallible commit, called at Scene's atomic membership boundary. */
  commit(candidate: NavigationGraph3D | undefined): void {
    const previous = this.current;
    this.current = candidate;
    this.generation++;
    previous?.destroy();
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.current?.destroy();
    this.current = undefined;
    this.generation++;
  }
}

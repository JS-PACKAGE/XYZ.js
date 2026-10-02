import { Vector3 } from '../../../math/src/math3d.js';
import { navigationLimits } from '../../../../src/data/navigation.js';
import type { NavigationProjectionOptions3D } from './graph.js';
import { PartitionNavigationJob, PartitionSearch } from './partition-search.js';
import {
  NavigationScheduler,
  type NavigationScheduledSearch,
} from './scheduler.js';

export interface NavigationPolygon3D {
  readonly id: string;
  /** Ordered convex coplanar vertices. Clockwise or counterclockwise XZ winding. */
  readonly vertices: readonly Readonly<Vector3>[];
  /** Certified free headroom; geometry above the surface is supplied by the author/baker. */
  readonly clearanceHeight: number;
}
export interface NavigationMeshLink3D {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly start: Readonly<Vector3>;
  readonly end: Readonly<Vector3>;
  readonly directed?: boolean;
  readonly clearance: number;
}
export interface NavigationMeshOptions3D {
  readonly polygons: readonly NavigationPolygon3D[];
  readonly links?: readonly NavigationMeshLink3D[];
  readonly tileSize?: number;
}
export interface NavigationMeshSearchOptions3D extends NavigationProjectionOptions3D {
  readonly agentHeight: number;
}
export interface NavigationMeshProjection3D {
  readonly polygon: NavigationPolygon3D;
  readonly position: Readonly<Vector3>;
  readonly distance: number;
  readonly revision: number;
  /** Actual polygon candidates examined, not the total world size. */
  readonly candidates: number;
}
export interface NavigationMeshWaypoint3D {
  readonly position: Readonly<Vector3>;
  /** The transition ending here requires a handler; never move straight through it. */
  readonly link?: NavigationMeshLink3D;
}
export interface NavigationMeshPath3D {
  readonly status: 'found' | 'unreachable';
  readonly polygons: readonly NavigationPolygon3D[];
  readonly waypoints: readonly NavigationMeshWaypoint3D[];
  readonly cost: number;
  readonly revision: number;
  readonly visited: number;
}
interface Polygon {
  readonly surface: NavigationPolygon3D;
  readonly center: Vector3;
  readonly dx: number;
  readonly dz: number;
  readonly base: number;
  readonly edges: Edge[];
  readonly walls: boolean[];
}
interface Edge {
  readonly to: number;
  readonly a: Readonly<Vector3>;
  readonly b: Readonly<Vector3>;
  readonly link?: NavigationMeshLink3D;
}
interface Region {
  readonly vertices: readonly Readonly<Vector3>[];
}
const epsilon = 1e-7;

/** A true convex polygon surface mesh. Exact shared 3D edges join tiles, never overlapping XZ floors.
 * Queries use a spatial tile index and sparse workspaces; smoothing is clearance-certified in the
 * selected polygon corridor. Noncoplanar seams retain surface waypoints rather than cutting in air.
 */
export class NavigationMesh3D {
  readonly polygons: readonly NavigationPolygon3D[];
  readonly tileSize: number;
  private readonly geometry: Polygon[] = [];
  private readonly ids = new Map<string, number>();
  private readonly tiles = new Map<string, number[]>();
  private readonly vertexTopology = new Map<
    string,
    { polygon: Polygon; edge: number }[]
  >();
  private readonly jobs = new Set<
    PartitionNavigationJob<NavigationMeshPath3D>
  >();
  private readonly paths = new WeakSet<NavigationMeshPath3D>();
  private epoch = 0;
  private disposed = false;
  private readonly disabled = new Set<string>();
  private readonly linkIds = new Set<string>();
  private readonly disabledLinks = new Set<string>();
  constructor(options: NavigationMeshOptions3D) {
    this.tileSize = options.tileSize ?? navigationLimits.meshTileSize;
    if (
      !Number.isFinite(this.tileSize) ||
      this.tileSize <= 0 ||
      this.tileSize > navigationLimits.coordinateExtent ||
      options.polygons.length === 0 ||
      options.polygons.length > navigationLimits.meshPolygons ||
      (options.links?.length ?? 0) > navigationLimits.partitionSeams
    )
      throw new RangeError('Invalid bounded navigation mesh.');
    const shared = new Map<
      string,
      { polygon: number; edge: number; joined: boolean }
    >();
    for (const supplied of options.polygons) {
      if (
        typeof supplied.id !== 'string' ||
        !supplied.id ||
        supplied.id.length > navigationLimits.nodeIdLength ||
        this.ids.has(supplied.id) ||
        supplied.vertices.length < 3 ||
        supplied.vertices.length > navigationLimits.meshVertices ||
        !Number.isFinite(supplied.clearanceHeight) ||
        supplied.clearanceHeight < 0 ||
        supplied.clearanceHeight > navigationLimits.coordinateExtent
      )
        throw new RangeError('Invalid polygon ID, vertex count or headroom.');
      let vertices = supplied.vertices.map((point) => {
        validatePoint(point);
        return new Vector3(point.x, point.y, point.z);
      });
      let area = 0;
      for (let i = 1; i + 1 < vertices.length; i++) {
        area += cross(vertices[0]!, vertices[i]!, vertices[i + 1]!);
      }
      if (Math.abs(area) < epsilon)
        throw new RangeError('Degenerate navigation polygon.');
      if (area < 0) vertices = vertices.reverse();
      const a = vertices[0]!,
        b = vertices[1]!,
        c = vertices[2]!;
      const determinant = cross(a, b, c);
      if (determinant <= epsilon)
        throw new RangeError('Navigation polygons require strict convexity.');
      const dx =
        ((b.y - a.y) * (c.z - a.z) - (c.y - a.y) * (b.z - a.z)) / determinant;
      const dz =
        ((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)) / determinant;
      const base = a.y - dx * a.x - dz * a.z;
      for (let i = 0; i < vertices.length; i++) {
        const point = vertices[i]!;
        if (
          cross(
            point,
            vertices[(i + 1) % vertices.length]!,
            vertices[(i + 2) % vertices.length]!,
          ) <= epsilon ||
          vertices.some(
            (v) =>
              cross(point, vertices[(i + 1) % vertices.length]!, v) < -epsilon,
          ) ||
          Math.abs(point.y - (base + dx * point.x + dz * point.z)) > epsilon
        )
          throw new RangeError(
            'Navigation polygons must be strictly convex and coplanar.',
          );
      }
      const surface = Object.freeze({
        id: supplied.id,
        clearanceHeight: supplied.clearanceHeight,
        vertices: Object.freeze(vertices.map((v) => Object.freeze(v))),
      });
      const center = new Vector3();
      for (const v of vertices) {
        center.x += v.x;
        center.y += v.y;
        center.z += v.z;
      }
      center.x /= vertices.length;
      center.y /= vertices.length;
      center.z /= vertices.length;
      const index = this.geometry.length;
      this.ids.set(surface.id, index);
      const polygon: Polygon = {
        surface,
        center,
        dx,
        dz,
        base,
        edges: [],
        walls: vertices.map(() => true),
      };
      this.geometry.push(polygon);
      for (let edge = 0; edge < vertices.length; edge++) {
        for (const vertex of [
          vertices[edge]!,
          vertices[(edge + 1) % vertices.length]!,
        ]) {
          const key = `${vertex.x},${vertex.y},${vertex.z}`;
          const incident = this.vertexTopology.get(key) ?? [];
          if (incident.length >= navigationLimits.meshVertexEdges)
            throw new RangeError(
              'Nonmanifold navigation vertex exceeds the edge budget.',
            );
          incident.push({ polygon, edge });
          this.vertexTopology.set(key, incident);
        }
      }
      const minX = Math.floor(
        Math.min(...vertices.map((v) => v.x)) / this.tileSize,
      );
      const maxX = Math.floor(
        Math.max(...vertices.map((v) => v.x)) / this.tileSize,
      );
      const minZ = Math.floor(
        Math.min(...vertices.map((v) => v.z)) / this.tileSize,
      );
      const maxZ = Math.floor(
        Math.max(...vertices.map((v) => v.z)) / this.tileSize,
      );
      if (![minX, maxX, minZ, maxZ].every(Number.isSafeInteger))
        throw new RangeError(
          'Navigation tile coordinates must be safe integers.',
        );
      if (
        (maxX - minX + 1) * (maxZ - minZ + 1) >
        navigationLimits.meshTilesPerPolygon
      )
        throw new RangeError(
          'Polygon spans too many spatial tiles; subdivide it.',
        );
      for (let x = minX; x <= maxX; x++)
        for (let z = minZ; z <= maxZ; z++) {
          const key = `${x}:${z}`;
          const list = this.tiles.get(key) ?? [];
          if (list.length >= navigationLimits.meshTilePolygons)
            throw new RangeError(
              'Navigation tile polygon budget exceeded; reduce tileSize.',
            );
          list.push(index);
          this.tiles.set(key, list);
        }
      for (let i = 0; i < vertices.length; i++) {
        const v = vertices[i]!,
          w = vertices[(i + 1) % vertices.length]!;
        const first = `${v.x},${v.y},${v.z}`,
          second = `${w.x},${w.y},${w.z}`;
        const key =
          first < second ? `${first}/${second}` : `${second}/${first}`;
        const prior = shared.get(key);
        if (!prior) shared.set(key, { polygon: index, edge: i, joined: false });
        else {
          const other = this.geometry[prior.polygon]!;
          if (prior.joined || !same(other.surface.vertices[prior.edge]!, w))
            throw new RangeError(
              'Nonmanifold or overlapping shared navigation edge.',
            );
          prior.joined = true;
          polygon.walls[i] = false;
          other.walls[prior.edge] = false;
          polygon.edges.push({ to: prior.polygon, a: v, b: w });
          other.edges.push({ to: index, a: w, b: v });
        }
      }
    }
    this.polygons = Object.freeze(this.geometry.map((p) => p.surface));
    const linkIds = this.linkIds;
    for (const supplied of options.links ?? []) {
      const from = this.ids.get(supplied.from),
        to = this.ids.get(supplied.to);
      validatePoint(supplied.start);
      validatePoint(supplied.end);
      if (
        from === undefined ||
        to === undefined ||
        from === to ||
        typeof supplied.id !== 'string' ||
        !supplied.id ||
        supplied.id.length > navigationLimits.nodeIdLength ||
        linkIds.has(supplied.id) ||
        !Number.isFinite(supplied.clearance) ||
        supplied.clearance < 0 ||
        supplied.clearance > navigationLimits.coordinateExtent ||
        (supplied.directed !== undefined &&
          typeof supplied.directed !== 'boolean') ||
        !inside(this.geometry[from]!.surface.vertices, supplied.start) ||
        !inside(this.geometry[to]!.surface.vertices, supplied.end) ||
        Math.abs(
          supplied.start.y - height(this.geometry[from]!, supplied.start),
        ) > epsilon ||
        Math.abs(supplied.end.y - height(this.geometry[to]!, supplied.end)) >
          epsilon
      )
        throw new RangeError('Invalid explicit navigation mesh link.');
      linkIds.add(supplied.id);
      const link = Object.freeze({
        ...supplied,
        start: Object.freeze(
          new Vector3(supplied.start.x, supplied.start.y, supplied.start.z),
        ),
        end: Object.freeze(
          new Vector3(supplied.end.x, supplied.end.y, supplied.end.z),
        ),
      });
      this.geometry[from]!.edges.push({ to, a: link.start, b: link.end, link });
      if (!supplied.directed) {
        const reverse = Object.freeze({
          ...link,
          from: link.to,
          to: link.from,
          start: link.end,
          end: link.start,
        });
        this.geometry[to]!.edges.push({
          to: from,
          a: reverse.start,
          b: reverse.end,
          link: reverse,
        });
      }
    }
    for (const p of this.geometry) {
      if (
        p.edges.length >
        navigationLimits.meshVertices + navigationLimits.meshLinksPerPolygon
      )
        throw new RangeError('Too many links on one navigation polygon.');
      p.edges.sort((a, b) => a.to - b.to);
    }
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
  isPathCurrent(path: NavigationMeshPath3D): boolean {
    return (
      !this.disposed && path.revision === this.epoch && this.paths.has(path)
    );
  }
  /** Polygon topology is immutable; enabled edits atomically invalidate all pending work. */
  setPolygonEnabled(id: string, enabled: boolean): void {
    this.assertLive();
    if (!this.ids.has(id) || typeof enabled !== 'boolean')
      throw new RangeError('Unknown polygon or invalid enabled state.');
    if (this.disabled.has(id) === !enabled) return;
    if (enabled) this.disabled.delete(id);
    else this.disabled.add(id);
    this.epoch++;
    for (const job of this.jobs) job.invalidate();
  }
  setLinkEnabled(id: string, enabled: boolean): void {
    this.assertLive();
    if (!this.linkIds.has(id) || typeof enabled !== 'boolean')
      throw new RangeError('Unknown link or invalid enabled state.');
    if (this.disabledLinks.has(id) === !enabled) return;
    if (enabled) this.disabledLinks.delete(id);
    else this.disabledLinks.add(id);
    this.epoch++;
    for (const job of this.jobs) job.invalidate();
  }
  project(
    position: Readonly<Vector3>,
    options: NavigationMeshSearchOptions3D,
  ): NavigationMeshProjection3D | undefined {
    this.assertLive();
    this.validateQuery(position, options);
    let best: NavigationMeshProjection3D | undefined;
    let count = 0;
    for (const index of this.candidates(position, options.maxDistance)) {
      if (index < 0) continue;
      count++;
      const polygon = this.geometry[index]!;
      if (
        this.disabled.has(polygon.surface.id) ||
        polygon.surface.clearanceHeight < options.agentHeight
      )
        continue;
      const region = this.region(index, options.agentRadius ?? 0);
      const projected = nearest(polygon, region.vertices, position);
      if (
        !projected ||
        Math.abs(projected.y - position.y) > options.maxVerticalDistance
      )
        continue;
      const distance = Math.hypot(
        projected.x - position.x,
        projected.y - position.y,
        projected.z - position.z,
      );
      if (
        distance <= options.maxDistance &&
        (!best || distance < best.distance)
      )
        best = {
          polygon: polygon.surface,
          position: Object.freeze(projected),
          distance,
          revision: this.epoch,
          candidates: count,
        };
    }
    return best && Object.freeze({ ...best, candidates: count });
  }
  scheduleSearch(
    scheduler: NavigationScheduler,
    start: Readonly<Vector3>,
    goal: Readonly<Vector3>,
    options: NavigationMeshSearchOptions3D,
  ): NavigationScheduledSearch<NavigationMeshPath3D> {
    this.assertLive();
    this.validateQuery(start, options);
    this.validateQuery(goal, options);
    const from = new Vector3(start.x, start.y, start.z),
      to = new Vector3(goal.x, goal.y, goal.z);
    const snapshot = { ...options };
    return scheduler.schedule(this, () =>
      this.createSearch(from, to, snapshot),
    );
  }
  findPath(
    start: Readonly<Vector3>,
    goal: Readonly<Vector3>,
    options: NavigationMeshSearchOptions3D,
  ): NavigationMeshPath3D {
    const job = this.createSearch(start, goal, options);
    while (job.status === 'pending')
      job.step(navigationLimits.expansionsPerStep);
    return job.result!;
  }
  createSearch(
    start: Readonly<Vector3>,
    goal: Readonly<Vector3>,
    options: NavigationMeshSearchOptions3D,
  ): PartitionNavigationJob<NavigationMeshPath3D> {
    this.assertLive();
    this.validateQuery(start, options);
    this.validateQuery(goal, options);
    if (this.availableSearchSlots === 0)
      throw new RangeError('Navigation concurrent search budget exhausted.');
    start = new Vector3(start.x, start.y, start.z);
    goal = new Vector3(goal.x, goal.y, goal.z);
    options = { ...options };
    const revision = this.epoch,
      radius = options.agentRadius ?? 0;
    const search = new PartitionSearch();
    const regions = new Map<number, Region>();
    const region = (index: number): Region => {
      let value = regions.get(index);
      if (!value) {
        value = this.region(index, radius);
        regions.set(index, value);
      }
      return value;
    };
    const projections = [
      this.candidates(start, options.maxDistance),
      this.candidates(goal, options.maxDistance),
    ];
    const ends: (
      { index: number; point: Vector3; distance: number } | undefined
    )[] = [];
    const parentEdges = new Map<number, Edge>();
    const backwards: number[] = [],
      corridor: number[] = [],
      raw: NavigationMeshWaypoint3D[] = [];
    const waypointPolygons: number[] = [];
    const surfaces: NavigationPolygon3D[] = [];
    const output: NavigationMeshWaypoint3D[] = [];
    let phase:
      | 'projection'
      | 'search'
      | 'backtrack'
      | 'corridor'
      | 'smooth'
      | 'publish' = 'projection';
    let endpoint = 0,
      cursor = 0,
      back = -1,
      anchor = 0,
      candidate = 0,
      check = 0;
    let successful = false;
    const publish = (): NavigationMeshPath3D => {
      const path: NavigationMeshPath3D = Object.freeze({
        status: successful ? 'found' : 'unreachable',
        polygons: Object.freeze(surfaces),
        waypoints: Object.freeze(output),
        cost: successful ? search.distance.get(ends[1]!.index)! : Infinity,
        revision,
        visited: search.distance.size,
      });
      this.paths.add(path);
      return path;
    };
    const job = new PartitionNavigationJob<NavigationMeshPath3D>(
      () => {
        if (phase === 'projection') {
          const next = projections[endpoint]!.next();
          if (!next.done) {
            if (next.value < 0) return undefined;
            const index = next.value,
              polygon = this.geometry[index]!;
            if (
              !this.disabled.has(polygon.surface.id) &&
              polygon.surface.clearanceHeight >= options.agentHeight
            ) {
              const source = endpoint === 0 ? start : goal;
              const point = nearest(polygon, region(index).vertices, source);
              if (
                point &&
                Math.abs(point.y - source.y) <= options.maxVerticalDistance
              ) {
                const distance = Math.hypot(
                  point.x - source.x,
                  point.y - source.y,
                  point.z - source.z,
                );
                if (
                  distance <= options.maxDistance &&
                  (!ends[endpoint] || distance < ends[endpoint]!.distance)
                )
                  ends[endpoint] = { index, point, distance };
              }
            }
            return undefined;
          }
          if (++endpoint === 2) {
            if (!ends[0] || !ends[1]) {
              phase = 'publish';
              return undefined;
            }
            search.offer(ends[0].index, 0, 0, -1);
            phase = 'search';
          }
        } else if (phase === 'search') {
          const current = search.take();
          if (current === undefined) {
            phase = 'publish';
            return undefined;
          }
          if (current === ends[1]!.index) {
            back = current;
            phase = 'backtrack';
            return undefined;
          }
          const polygon = this.geometry[current]!;
          for (const edge of polygon.edges) {
            const target = this.geometry[edge.to]!;
            if (
              this.disabled.has(target.surface.id) ||
              target.surface.clearanceHeight < options.agentHeight ||
              region(edge.to).vertices.length === 0
            )
              continue;
            const portal = this.portal(
              edge,
              region(current),
              region(edge.to),
              radius,
            );
            if (!portal) continue;
            const distance =
              search.distance.get(current)! +
              Math.hypot(
                target.center.x - polygon.center.x,
                target.center.y - polygon.center.y,
                target.center.z - polygon.center.z,
              );
            if (distance >= (search.distance.get(edge.to) ?? Infinity))
              continue;
            parentEdges.set(edge.to, edge);
            // Dijkstra is deliberate: explicit links may undercut a spatial heuristic.
            search.offer(edge.to, distance, distance, current);
          }
        } else if (phase === 'backtrack') {
          if (back >= 0) {
            backwards.push(back);
            back = search.parent.get(back)!;
          } else {
            cursor = backwards.length - 1;
            phase = 'corridor';
          }
        } else if (phase === 'corridor') {
          if (cursor >= 0) {
            const index = backwards[cursor--]!;
            corridor.push(index);
            surfaces.push(this.geometry[index]!.surface);
            if (corridor.length === 1) {
              raw.push(
                Object.freeze({ position: Object.freeze(ends[0]!.point) }),
              );
              waypointPolygons.push(0);
            } else {
              const edge = parentEdges.get(index)!;
              const prior = corridor[corridor.length - 2]!;
              if (edge.link) {
                raw.push(Object.freeze({ position: edge.a }));
                waypointPolygons.push(corridor.length - 2);
                raw.push(Object.freeze({ position: edge.b, link: edge.link }));
                waypointPolygons.push(corridor.length - 1);
              } else {
                const portal = this.portal(
                  edge,
                  region(prior),
                  region(index),
                  radius,
                )!;
                raw.push(
                  Object.freeze({
                    position: Object.freeze(
                      new Vector3(
                        (portal[0].x + portal[1].x) / 2,
                        (portal[0].y + portal[1].y) / 2,
                        (portal[0].z + portal[1].z) / 2,
                      ),
                    ),
                  }),
                );
                waypointPolygons.push(corridor.length - 1);
              }
            }
          } else {
            raw.push(
              Object.freeze({ position: Object.freeze(ends[1]!.point) }),
            );
            waypointPolygons.push(corridor.length - 1);
            output.push(raw[0]!);
            anchor = 0;
            candidate = raw.length - 1;
            check = waypointPolygons[0]!;
            phase = 'smooth';
          }
        } else if (phase === 'smooth') {
          if (anchor === raw.length - 1) {
            successful = true;
            phase = 'publish';
            return undefined;
          }
          // Links are hard barriers to shortcutting and are retained with their handler contract.
          if (raw[anchor + 1]!.link) {
            output.push(raw[++anchor]!);
            candidate = raw.length - 1;
            check = waypointPolygons[anchor]!;
            return undefined;
          }
          if (candidate <= anchor + 1) {
            output.push(raw[++anchor]!);
            candidate = raw.length - 1;
            check = waypointPolygons[anchor]!;
            return undefined;
          }
          const from = raw[anchor]!.position,
            to = raw[candidate]!.position;
          const firstPolygon = waypointPolygons[anchor]!,
            lastPolygon = waypointPolygons[candidate]!;
          const polygonIndex = corridor[check]!,
            polygon = this.geometry[polygonIndex]!;
          let valid = !raw[candidate]!.link;
          if (check > firstPolygon && parentEdges.get(polygonIndex)?.link)
            valid = false;
          const interval = clipSegment(region(polygonIndex).vertices, from, to);
          if (!interval) valid = false;
          else {
            for (const t of interval) {
              const x = from.x + (to.x - from.x) * t,
                z = from.z + (to.z - from.z) * t;
              if (
                Math.abs(
                  from.y +
                    (to.y - from.y) * t -
                    (polygon.base + polygon.dx * x + polygon.dz * z),
                ) > epsilon
              )
                valid = false;
            }
            if (check === firstPolygon && interval[0] > epsilon) valid = false;
            if (check === lastPolygon && interval[1] < 1 - epsilon)
              valid = false;
            let incoming = interval[0];
            if (check > firstPolygon) {
              const entry = parentEdges.get(polygonIndex)!;
              if (entry.link) valid = false;
              else {
                const portal = this.portal(
                  entry,
                  region(corridor[check - 1]!),
                  region(polygonIndex),
                  radius,
                )!;
                const crossing = segmentCrossing(
                  from,
                  to,
                  portal[0],
                  portal[1],
                );
                if (
                  crossing === undefined ||
                  crossing < interval[0] - epsilon ||
                  crossing > interval[1] + epsilon
                )
                  valid = false;
                else incoming = crossing;
              }
            }
            if (check < lastPolygon) {
              const edge = parentEdges.get(corridor[check + 1]!)!;
              if (edge.link) valid = false;
              else {
                const portal = this.portal(
                  edge,
                  region(polygonIndex),
                  region(edge.to),
                  radius,
                )!;
                const crossing = segmentCrossing(
                  from,
                  to,
                  portal[0],
                  portal[1],
                );
                if (
                  crossing === undefined ||
                  crossing < incoming - epsilon ||
                  crossing > interval[1] + epsilon
                )
                  valid = false;
              }
            }
          }
          if (!valid) {
            candidate--;
            check = firstPolygon;
          } else if (++check > lastPolygon) {
            output.push(raw[candidate]!);
            anchor = candidate;
            candidate = raw.length - 1;
            check = waypointPolygons[anchor]!;
          }
        } else return publish();
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
    this.tiles.clear();
  }
  private assertLive(): void {
    if (this.disposed) throw new Error('Navigation mesh is destroyed.');
  }
  private validateQuery(
    position: Readonly<Vector3>,
    options: NavigationMeshSearchOptions3D,
  ): void {
    validatePoint(position);
    if (
      ![
        options.maxDistance,
        options.maxVerticalDistance,
        options.agentRadius ?? 0,
        options.agentHeight,
      ].every(
        (v) =>
          Number.isFinite(v) &&
          v >= 0 &&
          v <= navigationLimits.coordinateExtent,
      )
    )
      throw new RangeError(
        'Mesh projection requires finite distance, radius and height bounds.',
      );
    const span = Math.ceil((2 * options.maxDistance) / this.tileSize) + 2;
    if (span * span > navigationLimits.projectionTiles)
      throw new RangeError(
        'Projection spans too many tiles; use a local query.',
      );
    const coordinates = [
      Math.floor((position.x - options.maxDistance) / this.tileSize),
      Math.floor((position.x + options.maxDistance) / this.tileSize),
      Math.floor((position.z - options.maxDistance) / this.tileSize),
      Math.floor((position.z + options.maxDistance) / this.tileSize),
    ];
    if (!coordinates.every(Number.isSafeInteger))
      throw new RangeError(
        'Mesh projection tile coordinates must be safe integers.',
      );
  }
  private *candidates(
    position: Readonly<Vector3>,
    distance: number,
  ): Generator<number> {
    const seen = new Set<number>();
    for (
      let x = Math.floor((position.x - distance) / this.tileSize);
      x <= Math.floor((position.x + distance) / this.tileSize);
      x++
    )
      for (
        let z = Math.floor((position.z - distance) / this.tileSize);
        z <= Math.floor((position.z + distance) / this.tileSize);
        z++
      ) {
        yield -1;
        for (const index of this.tiles.get(`${x}:${z}`) ?? []) {
          if (seen.has(index)) yield -1;
          else {
            seen.add(index);
            yield index;
          }
        }
      }
  }
  private region(index: number, radius: number): Region {
    const polygon = this.geometry[index]!;
    if (radius === 0) return { vertices: polygon.surface.vertices };
    let vertices: readonly Readonly<Vector3>[] = polygon.surface.vertices;
    for (
      let i = 0;
      i < polygon.surface.vertices.length && vertices.length > 0;
      i++
    ) {
      const a = polygon.surface.vertices[i]!,
        b =
          polygon.surface.vertices[(i + 1) % polygon.surface.vertices.length]!;
      if (
        !polygon.walls[i] &&
        polygon.edges.some(
          (edge) =>
            !edge.link &&
            same(edge.a, a) &&
            same(edge.b, b) &&
            !this.disabled.has(this.geometry[edge.to]!.surface.id),
        )
      )
        continue;
      vertices = clipPolygon(vertices, a, b, radius);
    }
    // Portal endpoint shrink alone is insufficient at a reentrant corner: a shortcut can
    // approach the outside wall's endpoint after entering its neighbor. A conservative
    // tangent half-plane certifies radius clearance from every incident boundary vertex.
    for (const vertex of polygon.surface.vertices) {
      const incident = this.vertexTopology.get(
        `${vertex.x},${vertex.y},${vertex.z}`,
      )!;
      const boundary = incident.some(({ polygon: owner, edge: i }) => {
        if (this.disabled.has(owner.surface.id)) return false;
        const a = owner.surface.vertices[i]!,
          b = owner.surface.vertices[(i + 1) % owner.surface.vertices.length]!;
        return (
          owner.walls[i] ||
          !owner.edges.some(
            (edge) =>
              !edge.link &&
              same(edge.a, a) &&
              same(edge.b, b) &&
              !this.disabled.has(this.geometry[edge.to]!.surface.id),
          )
        );
      });
      if (!boundary) continue;
      const nx = polygon.center.x - vertex.x,
        nz = polygon.center.z - vertex.z;
      const length = Math.hypot(nx, nz);
      vertices = clipPolygon(
        vertices,
        vertex,
        new Vector3(vertex.x + nz / length, vertex.y, vertex.z - nx / length),
        radius,
      );
    }
    return { vertices };
  }
  private portal(
    edge: Edge,
    from: Region,
    to: Region,
    radius: number,
  ): readonly [Readonly<Vector3>, Readonly<Vector3>] | undefined {
    if (edge.link)
      return !this.disabledLinks.has(edge.link.id) &&
        edge.link.clearance >= radius &&
        inside(from.vertices, edge.a) &&
        inside(to.vertices, edge.b)
        ? [edge.a, edge.b]
        : undefined;
    const length = Math.hypot(edge.b.x - edge.a.x, edge.b.z - edge.a.z);
    if (length <= 2 * radius + epsilon) return undefined;
    const f = clipSegment(from.vertices, edge.a, edge.b),
      t = clipSegment(to.vertices, edge.a, edge.b);
    if (!f || !t) return undefined;
    const lo = Math.max(radius / length, f[0], t[0]),
      hi = Math.min(1 - radius / length, f[1], t[1]);
    if (lo > hi - epsilon) return undefined;
    return [
      new Vector3(
        edge.a.x + (edge.b.x - edge.a.x) * lo,
        edge.a.y + (edge.b.y - edge.a.y) * lo,
        edge.a.z + (edge.b.z - edge.a.z) * lo,
      ),
      new Vector3(
        edge.a.x + (edge.b.x - edge.a.x) * hi,
        edge.a.y + (edge.b.y - edge.a.y) * hi,
        edge.a.z + (edge.b.z - edge.a.z) * hi,
      ),
    ];
  }
}

function validatePoint(point: Readonly<Vector3>): void {
  if (
    ![point.x, point.y, point.z].every(
      (v) =>
        Number.isFinite(v) && Math.abs(v) <= navigationLimits.coordinateExtent,
    )
  )
    throw new RangeError('Navigation mesh coordinates exceed finite bounds.');
}
function cross(
  a: Readonly<Vector3>,
  b: Readonly<Vector3>,
  c: Readonly<Vector3>,
): number {
  return (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
}
function same(a: Readonly<Vector3>, b: Readonly<Vector3>): boolean {
  return a.x === b.x && a.y === b.y && a.z === b.z;
}
function height(p: Polygon, point: Readonly<Vector3>): number {
  return p.base + p.dx * point.x + p.dz * point.z;
}
function inside(
  vertices: readonly Readonly<Vector3>[],
  point: Readonly<Vector3>,
): boolean {
  return (
    vertices.length >= 3 &&
    vertices.every(
      (a, i) =>
        cross(a, vertices[(i + 1) % vertices.length]!, point) >= -epsilon,
    )
  );
}
function clipPolygon(
  vertices: readonly Readonly<Vector3>[],
  a: Readonly<Vector3>,
  b: Readonly<Vector3>,
  radius: number,
): readonly Readonly<Vector3>[] {
  const out: Vector3[] = [],
    offset = radius * Math.hypot(b.x - a.x, b.z - a.z);
  for (let i = 0; i < vertices.length; i++) {
    const p = vertices[i]!,
      q = vertices[(i + 1) % vertices.length]!;
    const d = cross(a, b, p) - offset,
      e = cross(a, b, q) - offset;
    if (d >= -epsilon) out.push(new Vector3(p.x, p.y, p.z));
    if (d >= 0 !== e >= 0) {
      const t = d / (d - e);
      out.push(
        new Vector3(
          p.x + (q.x - p.x) * t,
          p.y + (q.y - p.y) * t,
          p.z + (q.z - p.z) * t,
        ),
      );
    }
  }
  return out;
}
function clipSegment(
  vertices: readonly Readonly<Vector3>[],
  a: Readonly<Vector3>,
  b: Readonly<Vector3>,
): readonly [number, number] | undefined {
  if (vertices.length < 3) return undefined;
  let lo = 0,
    hi = 1;
  for (let i = 0; i < vertices.length; i++) {
    const p = vertices[i]!,
      q = vertices[(i + 1) % vertices.length]!;
    const d = cross(p, q, a),
      e = cross(p, q, b);
    if (d < -epsilon && e < -epsilon) return undefined;
    if (d < 0 !== e < 0) {
      const t = d / (d - e);
      if (d < 0) lo = Math.max(lo, t);
      else hi = Math.min(hi, t);
    }
  }
  return lo <= hi + epsilon ? [lo, hi] : undefined;
}
function nearest(
  polygon: Polygon,
  vertices: readonly Readonly<Vector3>[],
  point: Readonly<Vector3>,
): Vector3 | undefined {
  if (vertices.length < 3) return undefined;
  // Orthogonal 3D plane projection, then exact nearest boundary if outside the convex surface.
  const signed =
    (point.y - height(polygon, point)) /
    (1 + polygon.dx * polygon.dx + polygon.dz * polygon.dz);
  const projected = new Vector3(
    point.x + polygon.dx * signed,
    point.y - signed,
    point.z + polygon.dz * signed,
  );
  if (inside(vertices, projected)) return projected;
  let best: Vector3 | undefined,
    distance = Infinity;
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i]!,
      b = vertices[(i + 1) % vertices.length]!;
    const dx = b.x - a.x,
      dy = b.y - a.y,
      dz = b.z - a.z;
    const t = Math.max(
      0,
      Math.min(
        1,
        ((point.x - a.x) * dx + (point.y - a.y) * dy + (point.z - a.z) * dz) /
          (dx * dx + dy * dy + dz * dz),
      ),
    );
    const candidate = new Vector3(a.x + dx * t, a.y + dy * t, a.z + dz * t);
    const d = Math.hypot(
      candidate.x - point.x,
      candidate.y - point.y,
      candidate.z - point.z,
    );
    if (d < distance) {
      distance = d;
      best = candidate;
    }
  }
  return best;
}
function segmentCrossing(
  a: Readonly<Vector3>,
  b: Readonly<Vector3>,
  p: Readonly<Vector3>,
  q: Readonly<Vector3>,
): number | undefined {
  const dx = b.x - a.x,
    dz = b.z - a.z,
    ex = q.x - p.x,
    ez = q.z - p.z;
  const determinant = dx * ez - dz * ex;
  if (Math.abs(determinant) < epsilon) return undefined;
  const t = ((p.x - a.x) * ez - (p.z - a.z) * ex) / determinant;
  const u = ((p.x - a.x) * dz - (p.z - a.z) * dx) / determinant;
  return t >= -epsilon && t <= 1 + epsilon && u >= -epsilon && u <= 1 + epsilon
    ? t
    : undefined;
}

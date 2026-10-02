import { Vector2, Vector3 } from '../../../math/src/index.js';
import { navigationLimits } from '../../../../src/data/navigation.js';
import { GameObject } from '../game-object.js';
import { Object3D } from '../object3d.js';
import { Collider2D } from '../physics2d/collider.js';
import type { PhysicsWorld2D } from '../physics2d/world.js';
import { CapsuleCollider3D } from '../physics3d/collider.js';
import type {
  PhysicsQueryOptions3D,
  PhysicsWorld3D,
} from '../physics3d/world.js';
import {
  NavigationGrid2D,
  type NavigationCellEdit2D,
  type NavigationCell2D,
} from './grid.js';
import {
  NavigationGraph3D,
  type NavigationNode3D,
  type NavigationConnection3D,
} from './graph.js';
import type { NavigationSearchStatus } from './jobs.js';

export interface NavigationLatticeOptions {
  readonly columns: number;
  readonly rows: number;
  readonly cellSize: number;
  /** Rotation in radians: XY in 2D, around world Y in 3D. */
  readonly rotation?: number;
}
export interface NavigationGridBakeOptions2D extends NavigationLatticeOptions {
  readonly origin?: Readonly<Vector2>;
  readonly agentRadius?: number;
  readonly mask?: number;
  readonly target?: NavigationGrid2D;
  /** Revision of authored tile occupancy or other external geometry inputs. */
  readonly geometryRevision?: () => number;
  /** Optional authored tile occupancy, combined with exact physics collision. */
  readonly blockedCell?: (column: number, row: number) => boolean;
}
export interface NavigationSurfaceBakeOptions3D extends NavigationLatticeOptions {
  /** XZ lattice origin; Y is ignored. Bounds are sampling bounds, never inferred walkable geometry. */
  readonly origin?: Readonly<Vector3>;
  readonly minY: number;
  readonly maxY: number;
  readonly agentRadius: number;
  /** Total capsule height, including both hemispheres. */
  readonly agentHeight: number;
  readonly maxSlopeAngle?: number;
  readonly stepHeight?: number;
  /** Fixed slots per XZ cell, descending support height. Overflow fails rather than dropping floors. */
  readonly maxLayers?: number;
  /** Interior support samples per edge; finite sampled lattice, not a polygon navmesh. */
  readonly supportSamples?: number;
  /** Explicit elevator/ladder/teleport links; execution requires a follower traversal handler. */
  readonly links?: readonly NavigationSurfaceLink3D[];
  readonly query?: PhysicsQueryOptions3D;
  readonly target?: NavigationGraph3D;
  /** Additional authored geometry revision, alongside the physics world revision. */
  readonly geometryRevision?: () => number;
}
export interface NavigationSurfaceLink3D extends NavigationConnection3D {
  readonly kind: 'special';
  readonly linkId: string;
}

/** Mapping uses cell centers and snapshots its transform; caller owns the returned vector. */
export class NavigationLatticeMapping {
  readonly columns: number;
  readonly rows: number;
  readonly cellSize: number;
  private readonly cosine: number;
  private readonly sine: number;
  constructor(
    options: NavigationLatticeOptions,
    readonly originX = 0,
    readonly originZ = 0,
  ) {
    if (
      !Number.isSafeInteger(options.columns) ||
      !Number.isSafeInteger(options.rows) ||
      options.columns < 1 ||
      options.rows < 1 ||
      !Number.isFinite(options.cellSize) ||
      options.cellSize <= 0 ||
      !Number.isFinite(options.rotation ?? 0) ||
      !Number.isFinite(originX) ||
      !Number.isFinite(originZ)
    )
      throw new RangeError(
        'Navigation bake requires finite positive lattice dimensions and transform.',
      );
    this.columns = options.columns;
    this.rows = options.rows;
    this.cellSize = options.cellSize;
    this.cosine = Math.cos(options.rotation ?? 0);
    this.sine = Math.sin(options.rotation ?? 0);
    const extent =
      Math.hypot(
        options.columns * options.cellSize,
        options.rows * options.cellSize,
      ) + Math.hypot(originX, originZ);
    if (extent > navigationLimits.coordinateExtent)
      throw new RangeError('Navigation lattice exceeds coordinate bounds.');
  }
  cellToWorld(column: number, row: number, out = new Vector2()): Vector2 {
    if (
      !Number.isInteger(column) ||
      !Number.isInteger(row) ||
      column < 0 ||
      row < 0 ||
      column >= this.columns ||
      row >= this.rows
    )
      throw new RangeError('Navigation cell is outside the lattice.');
    const x = (column + 0.5) * this.cellSize,
      z = (row + 0.5) * this.cellSize;
    return out.set(
      this.originX + x * this.cosine - z * this.sine,
      this.originZ + x * this.sine + z * this.cosine,
    );
  }
  worldToCell(x: number, z: number): NavigationCell2D | undefined {
    if (!Number.isFinite(x) || !Number.isFinite(z))
      throw new RangeError('Navigation mapping requires finite coordinates.');
    const dx = x - this.originX,
      dz = z - this.originZ;
    const column = Math.floor(
      (dx * this.cosine + dz * this.sine) / this.cellSize,
    );
    const row = Math.floor(
      (-dx * this.sine + dz * this.cosine) / this.cellSize,
    );
    return column >= 0 && row >= 0 && column < this.columns && row < this.rows
      ? { column, row }
      : undefined;
  }
  nodeId(column: number, row: number, layer = 0): string {
    if (
      !Number.isInteger(layer) ||
      layer < 0 ||
      layer >= navigationLimits.maxSurfaceLayers
    )
      throw new RangeError(
        'Navigation surface layer exceeds its bounded slot profile.',
      );
    return layer === 0 ? `${column}:${row}` : `${column}:${row}:${layer}`;
  }
}

/** One exact inflated-cell collision query per work unit; publication is atomic. */
export class NavigationGridBakeJob2D {
  readonly mapping: NavigationLatticeMapping;
  private state: NavigationSearchStatus = 'pending';
  private count = 0;
  private cursor = 0;
  private readonly edits: NavigationCellEdit2D[] = [];
  private readonly probe = new GameObject();
  private readonly shape: Collider2D;
  private readonly radius: number;
  private readonly revision: number | undefined;
  private readonly worldRevision: number;
  private readonly sourceRevision: number | undefined;
  private value: NavigationGrid2D | undefined;
  constructor(
    private readonly world: PhysicsWorld2D,
    private readonly options: NavigationGridBakeOptions2D,
  ) {
    this.options = {
      ...options,
      origin: options.origin && new Vector2(options.origin.x, options.origin.y),
    };
    this.mapping = new NavigationLatticeMapping(
      options,
      options.origin?.x,
      options.origin?.y,
    );
    if (options.columns * options.rows > navigationLimits.gridCells)
      throw new RangeError('Navigation grid bake cell limit exceeded.');
    this.radius = options.agentRadius ?? 0;
    if (
      !Number.isFinite(this.radius) ||
      this.radius < 0 ||
      this.radius > navigationLimits.coordinateExtent
    )
      throw new RangeError('Invalid bake agent radius.');
    if (
      options.target &&
      (options.target.columns !== options.columns ||
        options.target.rows !== options.rows)
    )
      throw new RangeError('Grid rebake dimensions must match.');
    this.revision = options.target?.revision;
    this.worldRevision = world.geometryRevision;
    this.sourceRevision = options.geometryRevision?.();
    const half = options.cellSize / 2 + this.radius;
    this.shape = new Collider2D('polygon', 0, [
      [-half, -half],
      [half, -half],
      [half, half],
      [-half, half],
    ]);
    this.shape.mask = options.mask ?? 0xffffffff;
    this.probe.rotation = options.rotation ?? 0;
  }
  get status(): NavigationSearchStatus {
    return this.state;
  }
  get expansions(): number {
    return this.count;
  }
  get result(): NavigationGrid2D | undefined {
    return this.value;
  }
  step(budget: number): NavigationSearchStatus {
    validateBudget(budget);
    if (this.state !== 'pending') return this.state;
    if (
      this.world.geometryRevision !== this.worldRevision ||
      this.options.geometryRevision?.() !== this.sourceRevision ||
      (this.options.target &&
        (this.options.target.destroyed ||
          this.options.target.revision !== this.revision))
    ) {
      this.state = 'invalidated';
      this.edits.length = 0;
      this.probe.destroy();
      return this.state;
    }
    for (
      let work = 0;
      work < budget && this.cursor < this.mapping.columns * this.mapping.rows;
      work++
    ) {
      const column = this.cursor % this.mapping.columns,
        row = Math.floor(this.cursor / this.mapping.columns);
      this.mapping.cellToWorld(column, row, this.probe.position);
      const walkable =
        !this.options.blockedCell?.(column, row) &&
        !this.world.overlap(this.shape, this.probe).some((hit) => !hit.sensor);
      this.edits.push({
        column,
        row,
        walkable,
        clearance: this.radius / this.mapping.cellSize,
      });
      this.cursor++;
      this.count++;
    }
    if (this.cursor === this.mapping.columns * this.mapping.rows) {
      if (
        this.world.geometryRevision !== this.worldRevision ||
        this.options.geometryRevision?.() !== this.sourceRevision ||
        (this.options.target &&
          (this.options.target.destroyed ||
            this.options.target.revision !== this.revision))
      ) {
        this.state = 'invalidated';
        this.edits.length = 0;
        this.probe.destroy();
        return this.state;
      }
      const grid = this.options.target ?? new NavigationGrid2D(this.mapping);
      grid.setCells(this.edits);
      this.value = grid;
      this.edits.length = 0;
      this.state = 'found';
      this.probe.destroy();
    }
    if (
      this.state === 'pending' &&
      (this.world.geometryRevision !== this.worldRevision ||
        this.options.geometryRevision?.() !== this.sourceRevision ||
        (this.options.target && this.options.target.revision !== this.revision))
    ) {
      this.state = 'invalidated';
      this.edits.length = 0;
      this.probe.destroy();
    }
    return this.state;
  }
  cancel(): void {
    if (this.state !== 'pending') return;
    this.state = 'cancelled';
    this.edits.length = 0;
    this.probe.destroy();
  }
}

/** Multi-surface finite lattice. One public query/candidate transition per work unit;
 * graph publication occurs only after all samples, clearance, support and sweeps complete.
 * Slots are descending surfaces in each cell, not global storeys or a polygon navmesh.
 */
export class NavigationSurfaceBakeJob3D {
  readonly mapping: NavigationLatticeMapping;
  readonly maxLayers: number;
  private state: NavigationSearchStatus = 'pending';
  private count = 0;
  private cursor = 0;
  private layer = -1;
  private edgeCursor = 0;
  private edgePhase = 0;
  private linkCursor = 0;
  private readonly nodes: NavigationNode3D[] = [];
  private readonly connections: NavigationConnection3D[] = [];
  private readonly feet: number[] = [];
  private readonly probe = new Object3D();
  private readonly shape: CapsuleCollider3D;
  private readonly point = new Vector2();
  private readonly ray = new Vector3();
  private readonly down = new Vector3(0, -1, 0);
  private readonly motion = new Vector3();
  private readonly slope: number;
  private readonly stepHeight: number;
  private readonly offset: number;
  private readonly supportSamples: number;
  private readonly query: PhysicsQueryOptions3D;
  private readonly revision: number | undefined;
  private readonly worldRevision: number;
  private readonly sourceRevision: number | undefined;
  private value: NavigationGraph3D | undefined;
  constructor(
    private readonly world: PhysicsWorld3D,
    private readonly options: NavigationSurfaceBakeOptions3D,
  ) {
    this.options = {
      ...options,
      origin:
        options.origin &&
        new Vector3(options.origin.x, options.origin.y, options.origin.z),
      query: { ...options.query },
      links: options.links?.map((link) => ({ ...link })),
    };
    this.mapping = new NavigationLatticeMapping(
      options,
      options.origin?.x,
      options.origin?.z,
    );
    this.maxLayers = options.maxLayers ?? navigationLimits.surfaceLayers;
    this.supportSamples =
      options.supportSamples ?? navigationLimits.supportSamples;
    this.slope = options.maxSlopeAngle ?? Math.PI / 4;
    this.stepHeight = options.stepHeight ?? 0;
    const size = options.columns * options.rows * this.maxLayers;
    if (
      !Number.isSafeInteger(this.maxLayers) ||
      this.maxLayers < 1 ||
      this.maxLayers > navigationLimits.maxSurfaceLayers ||
      !Number.isSafeInteger(this.supportSamples) ||
      this.supportSamples < 1 ||
      this.supportSamples > navigationLimits.maxSupportSamples ||
      size > navigationLimits.graphNodes ||
      !Number.isFinite(options.minY) ||
      !Number.isFinite(options.maxY) ||
      options.maxY <= options.minY ||
      !Number.isFinite(options.agentHeight) ||
      options.agentHeight < 2 * options.agentRadius ||
      !Number.isFinite(this.slope) ||
      this.slope < 0 ||
      this.slope >= Math.PI / 2 ||
      !Number.isFinite(this.stepHeight) ||
      this.stepHeight < 0 ||
      (options.links?.length ?? 0) > navigationLimits.graphConnections
    )
      throw new RangeError(
        'Invalid bounded multi-surface lattice or agent profile.',
      );
    this.shape = new CapsuleCollider3D(
      options.agentRadius,
      options.agentHeight - 2 * options.agentRadius,
    );
    this.probe.collider = this.shape;
    this.offset = options.agentHeight / 2 + navigationLimits.bakeSkin;
    if (
      Math.max(Math.abs(options.minY), Math.abs(options.maxY)) +
        this.offset +
        options.agentRadius * (1 / Math.cos(this.slope) - 1) +
        this.stepHeight >
      navigationLimits.coordinateExtent
    )
      throw new RangeError(
        'Surface agent clearance exceeds coordinate bounds.',
      );
    this.query = { ...options.query };
    this.revision = options.target?.revision;
    this.worldRevision = world.geometryRevision;
    this.sourceRevision = options.geometryRevision?.();
    if (
      options.target &&
      (options.target.nodes.length !== size ||
        options.target.nodes.some((node, index) => {
          const cell = Math.floor(index / this.maxLayers);
          return (
            node.id !==
            this.mapping.nodeId(
              cell % options.columns,
              Math.floor(cell / options.columns),
              index % this.maxLayers,
            )
          );
        }))
    )
      throw new RangeError(
        'Surface rebake must preserve lattice dimensions and layer slots.',
      );
    // Preflight explicit links before performing any geometry work.
    if (
      this.options.links?.some(
        (link) => link.kind !== 'special' || !link.linkId,
      )
    )
      throw new RangeError(
        'Surface connectors must be explicit named special links.',
      );
  }
  get status(): NavigationSearchStatus {
    return this.state;
  }
  get expansions(): number {
    return this.count;
  }
  get result(): NavigationGraph3D | undefined {
    return this.value;
  }
  step(budget: number): NavigationSearchStatus {
    validateBudget(budget);
    if (this.state !== 'pending') return this.state;
    if (this.stale()) {
      this.state = 'invalidated';
      this.release();
      return this.state;
    }
    const cells = this.mapping.columns * this.mapping.rows;
    try {
      for (let work = 0; work < budget && this.state === 'pending'; work++) {
        if (this.cursor < cells) this.sampleCell();
        else if (this.edgeCursor < this.nodes.length * 2 * this.maxLayers)
          this.sampleEdge();
        else if (this.linkCursor < (this.options.links?.length ?? 0)) {
          if (this.connections.length === navigationLimits.graphConnections)
            throw new RangeError('Surface connection limit exceeded.');
          this.connections.push(this.options.links![this.linkCursor++]!);
        } else {
          if (this.stale()) {
            this.state = 'invalidated';
            this.release();
            return this.state;
          }
          const geometry = { nodes: this.nodes, connections: this.connections };
          if (this.options.target) {
            this.options.target.replaceGeometry(geometry);
            this.value = this.options.target;
          } else this.value = new NavigationGraph3D(geometry);
          this.state = 'found';
          this.release();
        }
        this.count++;
      }
    } catch (error) {
      this.state = 'cancelled';
      this.release();
      throw error;
    }
    if (this.state === 'pending' && this.stale()) {
      this.state = 'invalidated';
      this.release();
    }
    return this.state;
  }
  cancel(): void {
    if (this.state !== 'pending') return;
    this.state = 'cancelled';
    this.release();
  }
  private stale(): boolean {
    return (
      this.world.geometryRevision !== this.worldRevision ||
      this.options.geometryRevision?.() !== this.sourceRevision ||
      !!(
        this.options.target &&
        (this.options.target.destroyed ||
          this.options.target.revision !== this.revision)
      )
    );
  }
  private sampleCell(): void {
    const column = this.cursor % this.mapping.columns,
      row = Math.floor(this.cursor / this.mapping.columns);
    const base = this.cursor * this.maxLayers;
    if (this.layer < 0) {
      this.mapping.cellToWorld(column, row, this.point);
      this.ray.set(this.point.x, this.options.maxY, this.point.y);
      const hits = this.world.raycastAll(
        this.ray,
        this.down,
        this.options.maxY - this.options.minY,
        this.query,
      );
      let layers = 0,
        previous = Infinity;
      for (const hit of hits) {
        if (
          hit.normal.y < Math.cos(this.slope) ||
          previous - hit.point.y <= navigationLimits.bakeSkin
        )
          continue;
        if (layers === this.maxLayers)
          throw new RangeError(
            'Surface layer slot limit exceeded; increase maxLayers or narrow bounds.',
          );
        const offset =
          this.offset + this.options.agentRadius * (1 / hit.normal.y - 1);
        this.nodes.push({
          id: this.mapping.nodeId(column, row, layers++),
          position: new Vector3(
            this.point.x,
            hit.point.y + offset,
            this.point.y,
          ),
          walkable: true,
          clearance: this.options.agentRadius,
          surfaceY: hit.point.y,
        });
        this.feet.push(hit.point.y);
        previous = hit.point.y;
      }
      for (; layers < this.maxLayers; layers++) {
        this.nodes.push({
          id: this.mapping.nodeId(column, row, layers),
          position: new Vector3(
            this.point.x,
            this.options.minY + this.offset,
            this.point.y,
          ),
          walkable: false,
          clearance: 0,
        });
        this.feet.push(this.options.minY);
      }
      this.layer = 0;
    } else {
      const index = base + this.layer,
        node = this.nodes[index]!;
      if (node.walkable) {
        this.probe.position.copy(node.position);
        if (this.world.overlap(this.shape, this.probe, this.query).length > 0)
          this.nodes[index] = { ...node, walkable: false };
      }
      if (++this.layer === this.maxLayers) {
        this.layer = -1;
        this.cursor++;
      }
    }
  }
  private sampleEdge(): void {
    const fromIndex = Math.floor(this.edgeCursor / (2 * this.maxLayers));
    const lane = Math.floor(this.edgeCursor / this.maxLayers) % 2;
    const targetLayer = this.edgeCursor % this.maxLayers;
    const cell = Math.floor(fromIndex / this.maxLayers);
    const valid =
      lane === 0
        ? (cell % this.mapping.columns) + 1 < this.mapping.columns
        : cell + this.mapping.columns <
          this.mapping.columns * this.mapping.rows;
    const toIndex =
      (cell + (lane === 0 ? 1 : this.mapping.columns)) * this.maxLayers +
      targetLayer;
    const a = this.nodes[fromIndex]!,
      b = this.nodes[toIndex];
    const rise = b
      ? Math.abs(this.feet[fromIndex]! - this.feet[toIndex]!)
      : Infinity;
    if (
      !valid ||
      !b ||
      !a.walkable ||
      !b.walkable ||
      rise >
        Math.max(
          this.stepHeight,
          Math.tan(this.slope) * this.mapping.cellSize,
        ) +
          navigationLimits.bakeSkin
    ) {
      this.nextEdge();
      return;
    }
    const raised =
      Math.max(a.position.y, b.position.y) + navigationLimits.bakeSkin;
    let clear: boolean;
    if (this.edgePhase < this.supportSamples) {
      const t = (this.edgePhase + 1) / (this.supportSamples + 1);
      const expected =
        this.feet[fromIndex]! +
        (this.feet[toIndex]! - this.feet[fromIndex]!) * t;
      const allowance = this.stepHeight + navigationLimits.bakeSkin;
      this.ray.set(
        a.position.x + (b.position.x - a.position.x) * t,
        expected + allowance,
        a.position.z + (b.position.z - a.position.z) * t,
      );
      const hit = this.world.raycast(
        this.ray,
        this.down,
        allowance * 2,
        this.query,
      );
      clear =
        !!hit &&
        hit.normal.y >= Math.cos(this.slope) &&
        Math.abs(hit.point.y - expected) <= allowance;
    } else {
      const phase = this.edgePhase - this.supportSamples;
      if (phase < 2) {
        const node = phase === 0 ? a : b;
        this.probe.position.copy(node.position);
        this.motion.set(0, raised - node.position.y, 0);
      } else {
        this.probe.position.set(a.position.x, raised, a.position.z);
        this.motion.set(
          b.position.x - a.position.x,
          0,
          b.position.z - a.position.z,
        );
      }
      const hit = this.world.sweepCapsule(this.probe, this.motion, this.query);
      clear =
        !hit ||
        hit.distance >= this.motion.length() - navigationLimits.bakeSkin;
    }
    if (!clear) this.nextEdge();
    else if (++this.edgePhase === this.supportSamples + 3) {
      if (this.connections.length === navigationLimits.graphConnections)
        throw new RangeError('Surface connection limit exceeded.');
      this.connections.push({
        from: a.id,
        to: b.id,
        cost: Math.hypot(
          b.position.x - a.position.x,
          b.position.y - a.position.y,
          b.position.z - a.position.z,
        ),
        clearance: this.options.agentRadius,
      });
      this.nextEdge();
    }
  }
  private nextEdge(): void {
    this.edgeCursor++;
    this.edgePhase = 0;
  }
  private release(): void {
    this.nodes.length = this.connections.length = this.feet.length = 0;
    this.probe.destroy();
  }
}
function validateBudget(budget: number): void {
  if (
    !Number.isSafeInteger(budget) ||
    budget < 0 ||
    budget > navigationLimits.expansionsPerStep
  )
    throw new RangeError(
      'Navigation bake work budget exceeds its finite bound.',
    );
}

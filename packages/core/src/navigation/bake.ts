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
  readonly query?: PhysicsQueryOptions3D;
  readonly target?: NavigationGraph3D;
  /** Additional authored geometry revision, alongside the physics world revision. */
  readonly geometryRevision?: () => number;
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
  nodeId(column: number, row: number): string {
    return `${column}:${row}`;
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

/** Finite single-layer sampled surface graph, not a polygon navmesh. Each work unit is one public physics query. */
export class NavigationSurfaceBakeJob3D {
  readonly mapping: NavigationLatticeMapping;
  private state: NavigationSearchStatus = 'pending';
  private count = 0;
  private cursor = 0;
  private phase = 0;
  private edgeCursor = 0;
  private edgePhase = 0;
  private readonly nodes: NavigationNode3D[] = [];
  private readonly connections: NavigationConnection3D[] = [];
  private readonly probe = new Object3D();
  private readonly shape: CapsuleCollider3D;
  private readonly point = new Vector2();
  private readonly ray = new Vector3();
  private readonly down = new Vector3(0, -1, 0);
  private readonly motion = new Vector3();
  private readonly slope: number;
  private readonly stepHeight: number;
  private readonly offset: number;
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
    };
    this.mapping = new NavigationLatticeMapping(
      options,
      options.origin?.x,
      options.origin?.z,
    );
    const size = options.columns * options.rows;
    this.slope = options.maxSlopeAngle ?? Math.PI / 4;
    this.stepHeight = options.stepHeight ?? 0;
    if (
      size > navigationLimits.graphNodes ||
      !Number.isFinite(options.minY) ||
      !Number.isFinite(options.maxY) ||
      options.maxY <= options.minY ||
      Math.max(Math.abs(options.minY), Math.abs(options.maxY)) +
        options.agentHeight >
        navigationLimits.coordinateExtent ||
      !Number.isFinite(options.agentHeight) ||
      options.agentHeight < 2 * options.agentRadius ||
      !Number.isFinite(this.slope) ||
      this.slope < 0 ||
      this.slope >= Math.PI / 2 ||
      !Number.isFinite(this.stepHeight) ||
      this.stepHeight < 0
    )
      throw new RangeError(
        'Invalid finite surface bake bounds or agent profile.',
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
        options.agentRadius * (1 / Math.cos(this.slope) - 1) >
      navigationLimits.coordinateExtent
    )
      throw new RangeError(
        'Surface agent slope clearance exceeds coordinate bounds.',
      );
    this.query = { ...options.query };
    this.revision = options.target?.revision;
    this.worldRevision = world.geometryRevision;
    this.sourceRevision = options.geometryRevision?.();
    if (
      options.target &&
      (options.target.nodes.length !== size ||
        options.target.nodes.some(
          (node, index) =>
            node.id !==
            this.mapping.nodeId(
              index % options.columns,
              Math.floor(index / options.columns),
            ),
        ))
    )
      throw new RangeError('Surface rebake must preserve lattice IDs.');
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
    if (
      this.world.geometryRevision !== this.worldRevision ||
      this.options.geometryRevision?.() !== this.sourceRevision ||
      (this.options.target &&
        (this.options.target.destroyed ||
          this.options.target.revision !== this.revision))
    ) {
      this.state = 'invalidated';
      this.release();
      return this.state;
    }
    const size = this.mapping.columns * this.mapping.rows;
    for (let work = 0; work < budget && this.state === 'pending'; work++) {
      if (this.cursor < size) {
        if (this.phase === 0) {
          const column = this.cursor % this.mapping.columns,
            row = Math.floor(this.cursor / this.mapping.columns);
          this.mapping.cellToWorld(column, row, this.point);
          this.ray.set(this.point.x, this.options.maxY, this.point.y);
          const hit = this.world.raycast(
            this.ray,
            this.down,
            this.options.maxY - this.options.minY,
            this.query,
          );
          const walkable =
            hit !== undefined && hit.normal.y >= Math.cos(this.slope);
          // A sphere tangent to a slope needs radius / normal.y of vertical clearance.
          const supportOffset =
            this.offset +
            (walkable ? this.options.agentRadius * (1 / hit!.normal.y - 1) : 0);
          const position = new Vector3(
            this.point.x,
            (hit?.point.y ?? this.options.minY) + supportOffset,
            this.point.y,
          );
          this.nodes.push({
            id: this.mapping.nodeId(column, row),
            position,
            walkable,
          });
          if (walkable) this.phase = 1;
          else this.cursor++;
        } else {
          const node = this.nodes[this.cursor]!;
          this.probe.position.copy(node.position);
          if (this.world.overlap(this.shape, this.probe, this.query).length > 0)
            this.nodes[this.cursor] = { ...node, walkable: false };
          this.phase = 0;
          this.cursor++;
        }
      } else if (this.edgeCursor < size * 2) {
        const fromIndex = Math.floor(this.edgeCursor / 2),
          horizontal = this.edgeCursor % 2 === 0;
        const valid = horizontal
          ? (fromIndex % this.mapping.columns) + 1 < this.mapping.columns
          : fromIndex + this.mapping.columns < size;
        const a = this.nodes[fromIndex]!,
          b = this.nodes[fromIndex + (horizontal ? 1 : this.mapping.columns)];
        const rise =
          valid && b ? Math.abs(a.position.y - b.position.y) : Infinity;
        if (
          !valid ||
          !b ||
          !a.walkable ||
          !b.walkable ||
          rise >
            Math.max(
              this.stepHeight,
              Math.tan(this.slope) * this.mapping.cellSize,
            )
        ) {
          this.edgeCursor++;
          this.edgePhase = 0;
          this.count++;
          continue;
        }
        const raised =
          Math.max(a.position.y, b.position.y) + navigationLimits.bakeSkin;
        let clear: boolean;
        if (this.edgePhase === 0) {
          this.ray.set(
            (a.position.x + b.position.x) / 2,
            this.options.maxY,
            (a.position.z + b.position.z) / 2,
          );
          const hit = this.world.raycast(
            this.ray,
            this.down,
            this.options.maxY - this.options.minY,
            this.query,
          );
          clear =
            hit !== undefined &&
            hit.normal.y >= Math.cos(this.slope) &&
            Math.abs(
              hit.point.y +
                this.offset +
                this.options.agentRadius * (1 / hit.normal.y - 1) -
                (a.position.y + b.position.y) / 2,
            ) <=
              this.stepHeight + navigationLimits.bakeSkin;
        } else if (this.edgePhase < 3) {
          const node = this.edgePhase === 1 ? a : b;
          this.probe.position.copy(node.position);
          this.motion.set(0, raised - node.position.y, 0);
          const hit = this.world.sweepCapsule(
            this.probe,
            this.motion,
            this.query,
          );
          clear =
            !hit ||
            hit.distance >= this.motion.length() - navigationLimits.bakeSkin;
        } else {
          this.probe.position.set(a.position.x, raised, a.position.z);
          this.motion.set(
            b.position.x - a.position.x,
            0,
            b.position.z - a.position.z,
          );
          const hit = this.world.sweepCapsule(
            this.probe,
            this.motion,
            this.query,
          );
          clear =
            !hit ||
            hit.distance >= this.motion.length() - navigationLimits.bakeSkin;
        }
        if (!clear) {
          this.edgeCursor++;
          this.edgePhase = 0;
        } else if (++this.edgePhase === 4) {
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
          this.edgeCursor++;
          this.edgePhase = 0;
        }
      } else {
        if (
          this.world.geometryRevision !== this.worldRevision ||
          this.options.geometryRevision?.() !== this.sourceRevision ||
          (this.options.target &&
            (this.options.target.destroyed ||
              this.options.target.revision !== this.revision))
        ) {
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
    if (
      this.state === 'pending' &&
      (this.world.geometryRevision !== this.worldRevision ||
        this.options.geometryRevision?.() !== this.sourceRevision ||
        (this.options.target && this.options.target.revision !== this.revision))
    ) {
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
  private release(): void {
    this.nodes.length = this.connections.length = 0;
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

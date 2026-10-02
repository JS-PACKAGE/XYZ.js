import { navigationLimits } from '../../../../src/data/navigation.js';
import { NavigationSearchJob, NavigationSearchPool } from './jobs.js';
import {
  NavigationScheduler,
  type NavigationScheduledSearch,
} from './scheduler.js';

export interface NavigationCell2D {
  readonly column: number;
  readonly row: number;
}
export interface NavigationCellState2D {
  readonly walkable: boolean;
  /** Positive traversal multiplier, charged on entering this cell. */
  readonly cost: number;
  /** Authored maximum agent radius in cell-space units; Infinity is unconstrained. */
  readonly clearance: number;
}
export interface NavigationCellEdit2D extends NavigationCell2D {
  readonly walkable?: boolean;
  readonly cost?: number;
  readonly clearance?: number;
}
export interface NavigationGridOptions2D {
  readonly columns: number;
  readonly rows: number;
}
export interface NavigationGridSearchOptions2D {
  readonly diagonal?: boolean;
  /** When false, both orthogonal neighbors must be walkable for a diagonal. */
  readonly cornerCutting?: boolean;
  readonly agentRadius?: number;
}
export interface NavigationGridPath2D {
  readonly status: 'found' | 'unreachable';
  readonly cells: readonly NavigationCell2D[];
  readonly cost: number;
  readonly revision: number;
}

/** Finite cell-space weighted A*. Independent of TileMap visuals and collision geometry. */
export class NavigationGrid2D {
  readonly columns: number;
  readonly rows: number;
  private readonly walkable: Uint8Array;
  private readonly costs: Float64Array;
  private readonly clearance: Float64Array;
  private readonly searches: NavigationSearchPool<NavigationGridPath2D>;
  private readonly paths = new WeakSet<NavigationGridPath2D>();
  private minimumCost = 1;
  private currentRevision = 0;
  private disposed = false;

  constructor(options: NavigationGridOptions2D) {
    const { columns, rows } = options;
    if (
      !Number.isSafeInteger(columns) ||
      !Number.isSafeInteger(rows) ||
      columns <= 0 ||
      rows <= 0 ||
      columns * rows > navigationLimits.gridCells
    )
      throw new RangeError(
        'Navigation grid exceeds the positive integer cell budget.',
      );
    this.columns = columns;
    this.rows = rows;
    this.walkable = new Uint8Array(columns * rows).fill(1);
    this.costs = new Float64Array(columns * rows).fill(1);
    this.clearance = new Float64Array(columns * rows).fill(Infinity);
    this.searches = new NavigationSearchPool(columns * rows);
  }

  get revision(): number {
    return this.currentRevision;
  }

  get destroyed(): boolean {
    return this.disposed;
  }
  get availableSearchSlots(): number {
    return this.searches.availableSlots;
  }

  scheduleSearch(
    scheduler: NavigationScheduler,
    start: NavigationCell2D,
    goal: NavigationCell2D,
    options: NavigationGridSearchOptions2D = {},
  ): NavigationScheduledSearch<NavigationGridPath2D> {
    this.index(start.column, start.row);
    this.index(goal.column, goal.row);
    if (this.disposed) throw new Error('Navigation grid is destroyed.');
    const radius = options.agentRadius ?? 0;
    if (
      !Number.isFinite(radius) ||
      radius < 0 ||
      radius > navigationLimits.coordinateExtent
    )
      throw new RangeError('Invalid navigation agent radius.');
    const from = { ...start },
      to = { ...goal },
      profile = { ...options };
    return scheduler.schedule(this, () => this.createSearch(from, to, profile));
  }

  getCell(column: number, row: number): NavigationCellState2D {
    const index = this.index(column, row);
    return Object.freeze({
      walkable: this.walkable[index] === 1,
      cost: this.costs[index]!,
      clearance: this.clearance[index]!,
    });
  }

  setCell(
    column: number,
    row: number,
    state: Partial<NavigationCellState2D>,
  ): void {
    this.setCells([{ ...state, column, row }]);
  }

  /** All edits preflight before publication; repeated coordinates apply in order. */
  setCells(edits: readonly NavigationCellEdit2D[]): void {
    if (this.disposed) throw new Error('Navigation grid is destroyed.');
    if (edits.length > navigationLimits.gridCells)
      throw new RangeError('Navigation edit exceeds the cell budget.');
    const candidates = new Map<number, NavigationCellState2D>();
    for (const edit of edits) {
      const index = this.index(edit.column, edit.row);
      const prior = candidates.get(index);
      const walkable =
        edit.walkable === undefined
          ? (prior?.walkable ?? this.walkable[index] === 1)
          : edit.walkable;
      const cost =
        edit.cost === undefined
          ? (prior?.cost ?? this.costs[index]!)
          : edit.cost;
      const clearance =
        edit.clearance === undefined
          ? (prior?.clearance ?? this.clearance[index]!)
          : edit.clearance;
      if (
        typeof walkable !== 'boolean' ||
        !(
          clearance === Infinity ||
          (Number.isFinite(clearance) &&
            clearance >= 0 &&
            clearance <= navigationLimits.coordinateExtent)
        ) ||
        !Number.isFinite(cost) ||
        cost <= 0 ||
        cost > navigationLimits.cost
      )
        throw new RangeError(
          'Navigation cells require boolean walkability, positive finite cost and nonnegative clearance.',
        );
      candidates.set(index, { walkable, cost, clearance });
    }
    let changed = false;
    for (const [index, candidate] of candidates) {
      if (
        (this.walkable[index] === 1) !== candidate.walkable ||
        this.costs[index] !== candidate.cost ||
        this.clearance[index] !== candidate.clearance
      ) {
        changed = true;
        this.walkable[index] = candidate.walkable ? 1 : 0;
        this.costs[index] = candidate.cost;
        this.clearance[index] = candidate.clearance;
      }
    }
    if (!changed) return;
    this.currentRevision++;
    this.searches.invalidate();
    this.minimumCost = Infinity;
    for (let index = 0; index < this.costs.length; index++) {
      if (this.walkable[index])
        this.minimumCost = Math.min(this.minimumCost, this.costs[index]!);
    }
    if (this.minimumCost === Infinity) this.minimumCost = 0;
  }

  /** A snapshot remains immutable but is stale after any effective cell edit. */
  isPathCurrent(path: NavigationGridPath2D): boolean {
    return (
      !this.disposed &&
      this.paths.has(path) &&
      path.revision === this.currentRevision
    );
  }

  findPath(
    start: NavigationCell2D,
    goal: NavigationCell2D,
    options: NavigationGridSearchOptions2D = {},
  ): NavigationGridPath2D {
    const job = this.createSearch(start, goal, options);
    while (job.status === 'pending')
      job.step(navigationLimits.expansionsPerStep);
    return job.result!;
  }

  createSearch(
    start: NavigationCell2D,
    goal: NavigationCell2D,
    options: NavigationGridSearchOptions2D = {},
  ): NavigationSearchJob<NavigationGridPath2D> {
    const from = this.index(start.column, start.row);
    const to = this.index(goal.column, goal.row);
    const target = { column: goal.column, row: goal.row };
    const diagonal = options.diagonal ?? false;
    const cornerCutting = options.cornerCutting ?? false;
    const radius = options.agentRadius ?? 0;
    if (
      !Number.isFinite(radius) ||
      radius < 0 ||
      radius > navigationLimits.coordinateExtent
    )
      throw new RangeError(
        'Navigation agent radius exceeds its nonnegative finite bound.',
      );
    const traversable = (node: number) =>
      this.walkable[node] === 1 && this.clearance[node]! >= radius;
    return this.searches.create({
      from: traversable(from) && traversable(to) ? from : -1,
      to,
      estimate: (node) =>
        this.heuristic(
          node % this.columns,
          Math.floor(node / this.columns),
          target,
          diagonal,
        ),
      expand: (current, search) => {
        const column = current % this.columns;
        const row = Math.floor(current / this.columns);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if ((dx === 0 && dy === 0) || (!diagonal && dx !== 0 && dy !== 0))
              continue;
            const x = column + dx;
            const y = row + dy;
            if (x < 0 || y < 0 || x >= this.columns || y >= this.rows) continue;
            const next = y * this.columns + x;
            if (!traversable(next)) continue;
            const isDiagonal = dx !== 0 && dy !== 0;
            if (
              isDiagonal &&
              !cornerCutting &&
              (!traversable(row * this.columns + x) ||
                !traversable(y * this.columns + column))
            )
              continue;
            const distance =
              search.distance[current]! +
              this.costs[next]! * (isDiagonal ? Math.SQRT2 : 1);
            if (distance >= search.distance[next]!) continue;
            search.offer(
              next,
              distance,
              distance + this.heuristic(x, y, target, diagonal),
              current,
            );
          }
        }
      },
      result: (found, search) => {
        const cells: NavigationCell2D[] = [];
        if (found) {
          for (let node = to; node >= 0; node = search.parent[node]!)
            cells.push(
              Object.freeze({
                column: node % this.columns,
                row: Math.floor(node / this.columns),
              }),
            );
          cells.reverse();
        }
        return this.result(cells, found ? search.distance[to]! : Infinity);
      },
    });
  }

  /** Cancels active jobs and releases retained search workspaces. */
  destroy(): void {
    this.disposed = true;
    this.searches.destroy();
  }

  private index(column: number, row: number): number {
    if (
      !Number.isInteger(column) ||
      !Number.isInteger(row) ||
      column < 0 ||
      row < 0 ||
      column >= this.columns ||
      row >= this.rows
    )
      throw new RangeError('Navigation coordinates are outside the grid.');
    return row * this.columns + column;
  }

  private heuristic(
    column: number,
    row: number,
    goal: NavigationCell2D,
    diagonal: boolean,
  ): number {
    const dx = Math.abs(column - goal.column);
    const dy = Math.abs(row - goal.row);
    return (
      this.minimumCost *
      (diagonal
        ? Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy)
        : dx + dy)
    );
  }

  private result(
    cells: NavigationCell2D[],
    cost: number,
  ): NavigationGridPath2D {
    const path: NavigationGridPath2D = Object.freeze({
      status: cells.length === 0 ? 'unreachable' : 'found',
      cells: Object.freeze(cells),
      cost,
      revision: this.currentRevision,
    });
    this.paths.add(path);
    return path;
  }
}

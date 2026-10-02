import {
  Collider2D,
  GameObject,
  Geometry,
  Mesh,
  NavigationGrid2D,
  TextureMaterial,
  type NavigationGridPath2D,
  type NavigationScheduledSearch,
  type Scene,
  type Sprite,
  type Texture,
  type RenderStats,
} from '../../src/index.js';
import { productionRegressionWorkload as settings } from '../../src/data/observability.js';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Functional workload failure: ${message}`);
}

/** Exercise the existing dense sweep, not an invented optimized broadphase. */
export class DenseOverlapWorkload {
  private readonly objects: GameObject[] = [];
  private ticks = 0;
  private enters = 0;
  private exits = 0;
  private outside = false;
  constructor(private readonly scene: Scene) {
    scene.physics.gravity.set(0, 0);
    for (let index = 0; index < settings.denseColliders; index++) {
      const object = new GameObject();
      object.collider = new Collider2D('circle', settings.denseRadius, []);
      object.collider.sensor = true;
      object.position.set(320, 240);
      if (index === 0) {
        object.addEventListener('collisionstart', () => this.enters++);
        object.addEventListener('collisionend', () => this.exits++);
      }
      this.objects.push(scene.add(object));
    }
  }
  update(): void {
    this.ticks++;
    this.outside =
      Math.floor(this.ticks / settings.mutationIntervalFrames) % 2 === 1;
    for (let index = 0; index < this.objects.length; index++) {
      const object = this.objects[index]!;
      // All remaining circles overlap even at opposite ends of this moving cluster.
      object.position.set(
        index === 0 && this.outside
          ? 900
          : 320 + Math.sin(this.ticks * 0.02 + index) * 12,
        240 + Math.cos(this.ticks * 0.02 + index) * 12,
      );
    }
  }
  validate() {
    const snapshot = this.scene.physics.debugSnapshot();
    const count = settings.denseColliders - (this.outside ? 1 : 0);
    const expectedContacts = (count * (count - 1)) / 2;
    assert(
      snapshot.contacts.length === expectedContacts,
      `dense overlaps: expected ${expectedContacts} contacts, got ${snapshot.contacts.length}`,
    );
    assert(
      snapshot.contacts.every((contact) => contact.sensor),
      'sensor response mutated',
    );
    assert(
      this.enters >= 2 * (settings.denseColliders - 1) &&
        this.exits >= settings.denseColliders - 1,
      'mutable overlap exit/re-entry was not observed',
    );
    return {
      expectedContacts,
      actualContacts: snapshot.contacts.length,
      enters: this.enters,
      exits: this.exits,
      colliderCount: this.scene.physics.colliderCount,
    };
  }
}

/** Concurrent bounded searches, actual route traversal, and revision-invalidated replans. */
export class ReplanningWorkload {
  private readonly grid = new NavigationGrid2D({
    columns: settings.navigationColumns,
    rows: settings.navigationRows,
  });
  private readonly jobs: NavigationScheduledSearch<NavigationGridPath2D>[] = [];
  private route: NavigationGridPath2D | undefined;
  private waypoint = 0;
  private door = 12;
  private completed = 0;
  private traversed = 0;
  private invalidated = 0;
  private cycles = 0;
  private maxWork = 0;
  constructor(
    private readonly scene: Scene,
    private readonly marker: Sprite,
  ) {
    for (let row = 0; row < this.grid.rows; row++)
      this.grid.setCell(24, row, { walkable: false });
    this.replan();
  }
  private replan(): void {
    const stale = this.grid.scheduleSearch(
      this.scene.navigation,
      { column: 1, row: 1 },
      { column: 46, row: 46 },
    );
    this.door = this.door === 12 ? 35 : 12;
    this.grid.setCells([
      { column: 24, row: 12, walkable: this.door === 12 },
      { column: 24, row: 35, walkable: this.door === 35 },
    ]);
    assert(
      stale.status === 'invalidated',
      'revision mutation left a pending stale search usable',
    );
    this.invalidated++;
    this.cycles++;
    for (let index = 0; index < settings.navigationConcurrentSearches; index++)
      this.jobs.push(
        this.grid.scheduleSearch(
          this.scene.navigation,
          { column: 1, row: 1 + index },
          { column: 46, row: 46 - index },
        ),
      );
  }
  update(): void {
    this.maxWork = Math.max(this.maxWork, this.scene.navigation.stats.work);
    assert(
      this.scene.navigation.stats.work <= settings.navigationWorkBudget,
      'aggregate navigation quota exceeded',
    );
    if (
      this.jobs.length &&
      this.jobs.every((job) => job.status !== 'pending')
    ) {
      for (const job of this.jobs) {
        const route = job.result;
        assert(
          route?.status === 'found' && route.revision === this.grid.revision,
          'replan did not find a current route',
        );
        assert(
          route.cells.every(
            (cell) => this.grid.getCell(cell.column, cell.row).walkable,
          ),
          'route crossed a blocked cell',
        );
        assert(
          route.cells.some(
            (cell) => cell.column === 24 && cell.row === this.door,
          ),
          'route missed the only open door',
        );
        for (let index = 1; index < route.cells.length; index++) {
          const a = route.cells[index - 1]!,
            b = route.cells[index]!;
          assert(
            Math.abs(a.column - b.column) + Math.abs(a.row - b.row) === 1,
            'route contains a non-adjacent step',
          );
        }
        this.completed++;
      }
      this.route = this.jobs[0]!.result!;
      this.waypoint = 0;
      this.jobs.length = 0;
    }
    if (this.route) {
      assert(
        this.route.revision === this.grid.revision,
        'published stale route',
      );
      const cell = this.route.cells[this.waypoint++]!;
      this.marker.position.set(20 + cell.column * 12, 20 + cell.row * 12);
      if (this.waypoint === this.route.cells.length) {
        this.traversed++;
        this.route = undefined;
        this.replan();
      }
    }
  }
  validate() {
    assert(
      this.traversed >= 2 &&
        this.completed >= settings.navigationConcurrentSearches * 2,
      'two alternate-door routes were not executed',
    );
    assert(
      this.invalidated >= 2 && this.maxWork > 0,
      'revision invalidation or scheduled search work was absent',
    );
    return {
      cycles: this.cycles,
      completedSearches: this.completed,
      traversedRoutes: this.traversed,
      invalidatedSearches: this.invalidated,
      maximumWork: this.maxWork,
      quota: settings.navigationWorkBudget,
    };
  }
  destroy(): void {
    for (const job of this.jobs) job.cancel();
    this.grid.destroy();
  }
}

/** Keep invisible membership large, including direct mutation back into the native color pass. */
export class VisibilityWorkload {
  private readonly meshes: Mesh[] = [];
  private ticks = 0;
  private visible = false;
  private visibleObservations = 0;
  private invisibleObservations = 0;
  constructor(
    scene: Scene,
    texture: Texture,
    private readonly visibleCount: number,
  ) {
    const geometry = Geometry.cube();
    const material = new TextureMaterial({ texture });
    for (let index = 0; index < settings.invisibleMeshes; index++)
      this.meshes.push(
        scene.add(
          new Mesh({
            geometry,
            material,
            position: [10000 + index * 2, 0, 0],
            scale: [0.6, 0.6, 0.6],
          }),
        ),
      );
  }
  update(): void {
    this.ticks++;
    this.visible =
      Math.floor(this.ticks / settings.mutationIntervalFrames) % 2 === 1;
    // Mutable poses require the engine's existing O(N) checks; no cache bypass.
    for (let index = 0; index < this.meshes.length; index++)
      this.meshes[index]!.rotation.setFromEuler(0, this.ticks * 0.003, 0);
    this.meshes[0]!.position.x = this.visible ? 0 : 10000;
  }
  observe(stats: RenderStats): void {
    assert(
      stats.drawCalls === this.visibleCount + (this.visible ? 1 : 0),
      `native visible draw membership changed: expected ${this.visibleCount + (this.visible ? 1 : 0)}, got ${stats.drawCalls}`,
    );
    if (this.visible) this.visibleObservations++;
    else this.invisibleObservations++;
  }
  validate() {
    assert(
      this.visibleObservations > settings.mutationIntervalFrames &&
        this.invisibleObservations > settings.mutationIntervalFrames,
      'direct pose entry/exit was not rendered in both states',
    );
    return {
      visibleMeshes: this.visibleCount,
      invisibleMeshes: this.meshes.length,
      visibleObservations: this.visibleObservations,
      invisibleObservations: this.invisibleObservations,
      poseWork:
        'Existing O(N) mutable mesh pose checks retained; no optimization claim.',
    };
  }
}

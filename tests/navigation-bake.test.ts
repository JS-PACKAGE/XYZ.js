import { describe, expect, it } from 'vitest';
import { Vector2, Vector3 } from '../packages/math/src/index.js';
import { Scene } from '../packages/core/src/scene.js';
import { GameObject } from '../packages/core/src/game-object.js';
import { Object3D } from '../packages/core/src/object3d.js';
import { Collider2D } from '../packages/core/src/physics2d/collider.js';
import {
  BoxCollider3D,
  PlaneCollider3D,
  TriangleMeshCollider3D,
} from '../packages/core/src/physics3d/collider.js';
import {
  NavigationGridBakeJob2D,
  NavigationSurfaceBakeJob3D,
} from '../packages/core/src/navigation/bake.js';
import {
  NavigationScheduler,
  type NavigationWork,
} from '../packages/core/src/navigation/scheduler.js';

function finish(scheduler: NavigationScheduler, job: NavigationWork): void {
  scheduler.scheduleBake(job);
  for (let tick = 0; tick < 1000 && job.status === 'pending'; tick++) {
    const stats = scheduler.update(7);
    expect(stats.work).toBeLessThanOrEqual(7);
  }
  expect(job.status).toBe('found');
}

describe('finite collision geometry navigation baking', () => {
  it('invalidates partially sampled geometry after direct collider motion without publishing a mixed grid', () => {
    const scene = new Scene(),
      scheduler = new NavigationScheduler();
    const obstacle = new GameObject();
    obstacle.collider = new Collider2D('circle', 0.15, []);
    obstacle.position.set(2.5, 1.5);
    scene.add(obstacle);
    try {
      const options = { columns: 5, rows: 3, cellSize: 1, agentRadius: 0.1 };
      const original = new NavigationGridBakeJob2D(scene.physics, options);
      finish(scheduler, original);
      const grid = original.result!,
        revision = grid.revision;
      const partial = new NavigationGridBakeJob2D(scene.physics, {
        ...options,
        target: grid,
      });
      scheduler.scheduleBake(partial);
      scheduler.update(2);
      obstacle.position.set(100, 100);
      scheduler.update(2);
      expect(partial.status).toBe('invalidated');
      expect(partial.result).toBeUndefined();
      expect(grid.revision).toBe(revision);
      expect(grid.getCell(2, 1).walkable).toBe(false);
      grid.destroy();
    } finally {
      scheduler.destroy();
      scene.destroy();
    }
  });

  it('bakes supported slopes without capsule penetration and rejects slopes outside the agent profile', () => {
    const scene = new Scene(),
      scheduler = new NavigationScheduler();
    const floor = new Object3D();
    floor.collider = new PlaneCollider3D(new Vector3(-0.5, Math.sqrt(0.75), 0));
    scene.add(floor);
    try {
      const options = {
        columns: 3,
        rows: 1,
        cellSize: 1,
        minY: -1,
        maxY: 4,
        agentRadius: 0.2,
        agentHeight: 1.4,
        maxSlopeAngle: Math.PI / 4,
      };
      const bake = new NavigationSurfaceBakeJob3D(scene.physics3D, options);
      finish(scheduler, bake);
      expect(bake.result!.findPath('0:0', '2:0').status).toBe('found');
      const steep = new NavigationSurfaceBakeJob3D(scene.physics3D, {
        ...options,
        maxSlopeAngle: Math.PI / 8,
        target: bake.result,
      });
      finish(scheduler, steep);
      expect(steep.result!.findPath('0:0', '2:0').status).toBe('unreachable');
      bake.result!.destroy();
    } finally {
      scheduler.destroy();
      scene.destroy();
    }
  });

  it('connects a supported step only when the capsule agent step height permits it', () => {
    const scene = new Scene(),
      scheduler = new NavigationScheduler();
    const floor = new Object3D();
    floor.collider = new PlaneCollider3D();
    scene.add(floor);
    const step = new Object3D();
    step.collider = new BoxCollider3D(new Vector3(0.49, 0.15, 0.49));
    step.position.set(1.5, 0.15, 0.5);
    scene.add(step);
    try {
      const options = {
        columns: 3,
        rows: 1,
        cellSize: 1,
        minY: -1,
        maxY: 3,
        agentRadius: 0.2,
        agentHeight: 1.4,
        maxSlopeAngle: 0,
        stepHeight: 0.35,
      };
      const bake = new NavigationSurfaceBakeJob3D(scene.physics3D, options);
      finish(scheduler, bake);
      expect(bake.result!.findPath('0:0', '2:0').status).toBe('found');
      const lowStep = new NavigationSurfaceBakeJob3D(scene.physics3D, {
        ...options,
        stepHeight: 0.1,
        target: bake.result,
      });
      finish(scheduler, lowStep);
      expect(lowStep.result!.findPath('0:0', '2:0').status).toBe('unreachable');
      bake.result!.destroy();
    } finally {
      scheduler.destroy();
      scene.destroy();
    }
  });

  it('maps a rotated grid, takes an alternate collision-free route and atomically rebakes obstacle edits', () => {
    const scene = new Scene(),
      scheduler = new NavigationScheduler();
    const obstacle = new GameObject();
    obstacle.collider = new Collider2D('circle', 0.15, []);
    obstacle.position.set(8.5, 22.5);
    scene.add(obstacle);
    try {
      const options = {
        columns: 5,
        rows: 3,
        cellSize: 1,
        origin: new Vector2(10, 20),
        rotation: Math.PI / 2,
        agentRadius: 0.1,
      };
      const bake = new NavigationGridBakeJob2D(scene.physics, options);
      finish(scheduler, bake);
      const grid = bake.result!;
      expect(bake.mapping.worldToCell(8.5, 22.5)).toEqual({
        column: 2,
        row: 1,
      });
      const path = grid.findPath({ column: 0, row: 1 }, { column: 4, row: 1 });
      expect(path.cost).toBe(6);
      expect(
        path.cells.some((cell) => cell.column === 2 && cell.row === 1),
      ).toBe(false);
      obstacle.position.set(100, 100);
      const rebake = new NavigationGridBakeJob2D(scene.physics, {
        ...options,
        target: grid,
      });
      finish(scheduler, rebake);
      expect(grid.isPathCurrent(path)).toBe(false);
      expect(
        grid.findPath({ column: 0, row: 1 }, { column: 4, row: 1 }).cost,
      ).toBe(4);
      grid.destroy();
    } finally {
      scheduler.destroy();
      scene.destroy();
    }
  });

  it('rejects unsupported space between real triangle surfaces and enforces capsule headroom', () => {
    const scene = new Scene(),
      scheduler = new NavigationScheduler();
    const floor = new Object3D();
    floor.collider = new TriangleMeshCollider3D(
      [0, 0, 0, 0, 0, 2, 2, 0, 0, 2, 0, 2, 4, 0, 0, 4, 0, 2, 6, 0, 0, 6, 0, 2],
      [0, 1, 2, 2, 1, 3, 4, 5, 6, 6, 5, 7],
    );
    scene.add(floor);
    try {
      const options = {
        columns: 3,
        rows: 1,
        cellSize: 2,
        minY: -1,
        maxY: 4,
        agentRadius: 0.2,
        agentHeight: 1.4,
      };
      const bake = new NavigationSurfaceBakeJob3D(scene.physics3D, options);
      finish(scheduler, bake);
      const graph = bake.result!;
      expect(graph.getNode('0:0').walkable).toBe(true);
      expect(graph.getNode('1:0').walkable).toBe(false);
      expect(graph.findPath('0:0', '2:0').status).toBe('unreachable');
      const ceiling = new Object3D();
      ceiling.collider = new BoxCollider3D(new Vector3(0.5, 0.1, 0.5));
      ceiling.position.set(1, 1.2, 1);
      scene.add(ceiling);
      const rebake = new NavigationSurfaceBakeJob3D(scene.physics3D, {
        ...options,
        maxY: 1,
        target: graph,
      });
      finish(scheduler, rebake);
      expect(graph.getNode('0:0').walkable).toBe(false);
      graph.destroy();
    } finally {
      scheduler.destroy();
      scene.destroy();
    }
  });
});

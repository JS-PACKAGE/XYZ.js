import { describe, expect, it } from 'vitest';
import { Vector3 } from '../packages/math/src/index.js';
import { Scene } from '../packages/core/src/scene.js';
import { Object3D } from '../packages/core/src/object3d.js';
import {
  BoxCollider3D,
  CapsuleCollider3D,
  PlaneCollider3D,
  TriangleMeshCollider3D,
  SphereCollider3D,
} from '../packages/core/src/physics3d/collider.js';
import { CharacterController3D } from '../packages/core/src/physics3d/character.js';
import { NavigationSurfaceBakeJob3D } from '../packages/core/src/navigation/bake.js';
import { NavigationGraph3D } from '../packages/core/src/navigation/graph.js';
import { NavigationFollower3D } from '../packages/core/src/navigation/follower.js';
import { NavigationScheduler } from '../packages/core/src/navigation/scheduler.js';

const profile = {
  columns: 3,
  rows: 1,
  cellSize: 1,
  minY: -1,
  maxY: 5,
  agentRadius: 0.2,
  agentHeight: 1.4,
  maxLayers: 3,
};
function stacked(scene: Scene): Object3D {
  const floor = new Object3D();
  floor.collider = new TriangleMeshCollider3D(
    [0, 0, 0, 0, 0, 1, 3, 0, 0, 3, 0, 1, 0, 3, 0, 0, 3, 1, 3, 3, 0, 3, 3, 1],
    [0, 1, 2, 2, 1, 3, 4, 5, 6, 6, 5, 7],
  );
  scene.add(floor);
  return floor;
}
function complete(job: NavigationSurfaceBakeJob3D): void {
  for (let i = 0; i < 2000 && job.status === 'pending'; i++) job.step(7);
  expect(job.status).toBe('found');
}

describe('multisurface navigation geometry', () => {
  it('retains overlapping bridge and underpass surfaces in one mesh without an implicit floor transition', () => {
    const scene = new Scene();
    try {
      stacked(scene);
      const bake = new NavigationSurfaceBakeJob3D(scene.physics3D, profile);
      complete(bake);
      const graph = bake.result!;
      expect(graph.getNode('0:0').position.y).toBeCloseTo(3.702);
      expect(graph.getNode('0:0:1').position.y).toBeCloseTo(0.702);
      expect(graph.findPath('0:0', '2:0').cost).toBeCloseTo(2);
      expect(graph.findPath('0:0:1', '2:0:1').cost).toBeCloseTo(2);
      expect(graph.findPath('0:0', '0:0:1').status).toBe('unreachable');
      expect(
        graph.project(new Vector3(0.5, 0.702, 0.5), {
          maxDistance: 1,
          maxVerticalDistance: 0.1,
        })?.node.id,
      ).toBe('0:0:1');
      expect(
        graph.project(new Vector3(0.5, 1.8, 0.5), {
          maxDistance: 4,
          maxVerticalDistance: 0.1,
        }),
      ).toBeUndefined();
      expect(
        graph.project(new Vector3(0.5, 0.702, 0.5), {
          maxDistance: 1,
          maxVerticalDistance: 0.1,
          agentRadius: 0.3,
        }),
      ).toBeUndefined();
      graph.destroy();
    } finally {
      scene.destroy();
    }
  });

  it('connects supported stairs across slot numbers but rejects low clearance and walls', () => {
    const scene = new Scene();
    try {
      const floor = new Object3D();
      floor.collider = new PlaneCollider3D();
      scene.add(floor);
      for (let i = 1; i < 3; i++) {
        const step = new Object3D();
        step.collider = new BoxCollider3D(new Vector3(0.5, i * 0.15, 0.5));
        step.position.set(i + 0.5, i * 0.15, 0.5);
        scene.add(step);
      }
      const bake = new NavigationSurfaceBakeJob3D(scene.physics3D, {
        ...profile,
        stepHeight: 0.35,
        maxSlopeAngle: 0,
      });
      complete(bake);
      expect(bake.result!.findPath('0:0', '2:0').status).toBe('found');
      const agent = new Object3D();
      agent.collider = new CapsuleCollider3D(0.2, 1, { category: 2, mask: 1 });
      agent.position.copy(bake.result!.getNode('0:0').position);
      scene.add(agent);
      const controller = new CharacterController3D(agent, scene.physics3D, {
        mask: 1,
        stepHeight: 0.35,
        groundSnap: 0.1,
      });
      const follower = new NavigationFollower3D(controller, {
        speed: 1.6,
        arrivalTolerance: 0.04,
      });
      try {
        follower.navigate({
          graph: bake.result!,
          start: '0:0',
          goal: '2:0',
          agentRadius: 0.2,
        });
        for (
          let tick = 0;
          tick < 600 && follower.state !== 'finished';
          tick++
        ) {
          scene.navigation.update();
          follower.update(1 / 60);
        }
        expect(follower.state).toBe('finished');
        expect(Math.abs(agent.position.x - 2.5)).toBeLessThanOrEqual(0.04);
        expect(
          Math.abs(agent.position.y - bake.result!.getNode('2:0').position.y),
        ).toBeLessThanOrEqual(controller.skin + 0.002);
        follower.navigate({
          graph: bake.result!,
          start: '2:0',
          goal: '0:0',
          agentRadius: 0.2,
        });
        for (
          let tick = 0;
          tick < 600 && follower.state !== 'finished';
          tick++
        ) {
          scene.navigation.update();
          follower.update(1 / 60);
        }
        expect(follower.state).toBe('finished');
        expect(Math.abs(agent.position.x - 0.5)).toBeLessThanOrEqual(0.04);
        expect(
          Math.abs(agent.position.y - bake.result!.getNode('0:0').position.y),
        ).toBeLessThanOrEqual(controller.skin + 0.002);
      } finally {
        follower.destroy();
        controller.destroy();
        agent.destroy();
      }
      const wall = new Object3D();
      wall.collider = new BoxCollider3D(new Vector3(0.03, 1.5, 0.5));
      wall.position.set(1, 1.5, 0.5);
      scene.add(wall);
      const rebake = new NavigationSurfaceBakeJob3D(scene.physics3D, {
        ...profile,
        stepHeight: 0.35,
        maxSlopeAngle: 0,
        target: bake.result,
      });
      complete(rebake);
      expect(bake.result!.findPath('0:0', '2:0').status).toBe('unreachable');
      bake.result!.destroy();
    } finally {
      scene.destroy();
    }
  });

  it('publishes no partial or stale output after direct mesh edits or cancellation', () => {
    const scene = new Scene();
    try {
      const mesh = stacked(scene),
        bake = new NavigationSurfaceBakeJob3D(scene.physics3D, profile);
      complete(bake);
      const graph = bake.result!,
        revision = graph.revision,
        path = graph.findPath('0:0:1', '2:0:1');
      const partial = new NavigationSurfaceBakeJob3D(scene.physics3D, {
        ...profile,
        target: graph,
      });
      partial.step(2);
      mesh.position.y = 0.2;
      partial.step(1);
      expect(partial.status).toBe('invalidated');
      expect(partial.result).toBeUndefined();
      expect(graph.revision).toBe(revision);
      expect(graph.isPathCurrent(path)).toBe(true);
      const cancelled = new NavigationSurfaceBakeJob3D(scene.physics3D, {
        ...profile,
        target: graph,
      });
      cancelled.step(3);
      cancelled.cancel();
      cancelled.step(100);
      expect(cancelled.result).toBeUndefined();
      expect(graph.revision).toBe(revision);
      const fresh = new NavigationSurfaceBakeJob3D(scene.physics3D, {
        ...profile,
        target: graph,
      });
      complete(fresh);
      expect(graph.isPathCurrent(path)).toBe(false);
      expect(graph.getNode('0:0:1').position.y).toBeCloseTo(0.902);
      graph.destroy();
    } finally {
      scene.destroy();
    }
  });

  it('shares the bake/search quota across 120 agents and invalidates queued searches on rebake', () => {
    const scene = new Scene(),
      scheduler = new NavigationScheduler({ workBudget: 17 });
    try {
      stacked(scene);
      const bake = new NavigationSurfaceBakeJob3D(scene.physics3D, profile);
      complete(bake);
      const graph = bake.result!,
        jobs = Array.from({ length: 120 }, () =>
          graph.scheduleSearch(scheduler, '0:0:1', '2:0:1'),
        );
      const rebake = scheduler.scheduleBake(
        new NavigationSurfaceBakeJob3D(scene.physics3D, {
          ...profile,
          target: graph,
        }),
      );
      for (
        let i = 0;
        i < 1000 &&
        (rebake.status === 'pending' ||
          jobs.some((job) => job.status === 'pending'));
        i++
      ) {
        expect(scheduler.update().work).toBeLessThanOrEqual(17);
        expect(scheduler.stats.active).toBeLessThanOrEqual(8);
      }
      expect(rebake.status).toBe('found');
      expect(
        jobs.every(
          (job) => job.status === 'found' || job.status === 'invalidated',
        ),
      ).toBe(true);
      for (const job of jobs)
        if (job.status === 'found') expect(job.result!.cost).toBeCloseTo(2);
      graph.destroy();
    } finally {
      scheduler.destroy();
      scene.destroy();
    }
  });

  it('fails layer overflow instead of silently baking only the top surface', () => {
    const scene = new Scene();
    try {
      stacked(scene);
      const job = new NavigationSurfaceBakeJob3D(scene.physics3D, {
        ...profile,
        maxLayers: 1,
      });
      expect(() => job.step(1)).toThrow(RangeError);
      expect(job.result).toBeUndefined();
    } finally {
      scene.destroy();
    }
  });
});

describe('bounded exact all-boundary ray queries', () => {
  it('returns both floors from one mesh, solid entry/exit, respects filters and explicit overflow', () => {
    const scene = new Scene();
    try {
      stacked(scene);
      const hits = scene.physics3D.raycastAll(
        new Vector3(0.5, 5, 0.5),
        new Vector3(0, -2, 0),
        6,
      );
      expect(hits.map((hit) => hit.point.y)).toEqual([3, 0]);
      const ball = new Object3D();
      ball.collider = new SphereCollider3D(1, { category: 2 });
      ball.position.set(10, 0, 0);
      scene.add(ball);
      const boundaries = scene.physics3D.raycastAll(
        new Vector3(10, 3, 0),
        new Vector3(0, -1, 0),
        6,
        { mask: 2 },
      );
      expect(boundaries.map((hit) => hit.distance)).toEqual([2, 4]);
      expect(boundaries.map((hit) => hit.normal.y)).toEqual([1, -1]);
      const inside = scene.physics3D.raycastAll(
        new Vector3(10, 0, 0),
        new Vector3(0, 1, 0),
        2,
        { mask: 2 },
      );
      expect(inside[0]!.distance).toBe(1);
      expect(
        scene.physics3D.raycast(
          new Vector3(10, 0, 0),
          new Vector3(0, 1, 0),
          2,
          { mask: 2 },
        )!.distance,
      ).toBe(0);
      expect(
        scene.physics3D.raycastAll(
          new Vector3(10, 3, 0),
          new Vector3(0, -1, 0),
          6,
          { ignore: ball },
        ),
      ).toEqual([]);
      expect(() =>
        scene.physics3D.raycastAll(
          new Vector3(10, 3, 0),
          new Vector3(0, -1, 0),
          6,
          { maxHits: 1 },
        ),
      ).toThrow(RangeError);
    } finally {
      scene.destroy();
    }
  });
});

describe('explicit special connector execution', () => {
  it('never moves directly through an elevator link without a handler, and requires actual arrival for completion', () => {
    const scene = new Scene();
    const graph = new NavigationGraph3D({
      nodes: [
        { id: 'lower', position: new Vector3(0, 1, 0) },
        { id: 'upper', position: new Vector3(0, 4, 0) },
      ],
      connections: [
        {
          from: 'lower',
          to: 'upper',
          cost: 3,
          kind: 'special',
          linkId: 'elevator',
        },
      ],
    });
    const agent = new Object3D();
    agent.collider = new CapsuleCollider3D(0.2, 1);
    agent.position.set(0, 1, 0);
    scene.add(agent);
    const controller = new CharacterController3D(agent, scene.physics3D, {
      groundSnap: 0,
    });
    const follower = new NavigationFollower3D(controller, { maxReplans: 0 });
    try {
      follower.navigate({
        graph,
        start: 'lower',
        goal: 'upper',
        agentRadius: 0.2,
      });
      for (let i = 0; i < 20; i++) {
        scene.navigation.update();
        follower.update(1);
      }
      expect(follower.state).toBe('blocked');
      expect(agent.position.y).toBe(1);
      follower.destroy();
      const falseComplete = new NavigationFollower3D(controller, {
        maxReplans: 0,
        traverseLink: () => 'complete',
      });
      falseComplete.navigate({
        graph,
        start: 'lower',
        goal: 'upper',
        agentRadius: 0.2,
      });
      for (let i = 0; i < 20; i++) {
        scene.navigation.update();
        falseComplete.update(1);
      }
      expect(falseComplete.state).toBe('blocked');
      expect(agent.position.y).toBe(1);
      falseComplete.destroy();
      const elevator = new NavigationFollower3D(controller, {
        traverseLink: ({ controller, deltaSeconds }) => {
          controller.move(
            new Vector3(0, Math.min(4 - agent.position.y, deltaSeconds), 0),
          );
          return agent.position.y === 4 ? 'complete' : 'pending';
        },
      });
      elevator.navigate({
        graph,
        start: 'lower',
        goal: 'upper',
        agentRadius: 0.2,
      });
      for (let i = 0; i < 20; i++) {
        scene.navigation.update();
        elevator.update(0.25);
      }
      expect(elevator.state).toBe('finished');
      expect(agent.position.y).toBe(4);
      elevator.destroy();
    } finally {
      follower.destroy();
      controller.destroy();
      graph.destroy();
      scene.destroy();
    }
  });
});

import { describe, expect, it } from 'vitest';
import { Vector3 } from '../packages/math/src/index.js';
import {
  NavigationMesh3D,
  type NavigationPolygon3D,
} from '../packages/core/src/navigation/mesh.js';
import { NavigationScheduler } from '../packages/core/src/navigation/scheduler.js';
import { NavigationTiledGraph3D } from '../packages/core/src/navigation/tiled-graph.js';
import { Scene } from '../packages/core/src/scene.js';
import { Object3D } from '../packages/core/src/object3d.js';
import {
  CapsuleCollider3D,
  PlaneCollider3D,
} from '../packages/core/src/physics3d/collider.js';
import { CharacterController3D } from '../packages/core/src/physics3d/character.js';
import { NavigationMeshFollower3D } from '../packages/core/src/navigation/mesh-follower.js';

const query = {
  maxDistance: 1,
  maxVerticalDistance: 0.2,
  agentRadius: 0.2,
  agentHeight: 1.4,
};
function square(id: string, x: number, z: number, y = 0): NavigationPolygon3D {
  return {
    id,
    clearanceHeight: 2,
    vertices: [
      new Vector3(x, y, z),
      new Vector3(x + 2, y, z),
      new Vector3(x + 2, y, z + 2),
      new Vector3(x, y, z + 2),
    ],
  };
}

describe('polygon navigation surfaces', () => {
  it('projects onto actual triangle interiors and edges, including sloped planes', () => {
    const mesh = new NavigationMesh3D({
      polygons: [
        {
          id: 'triangle',
          clearanceHeight: 2,
          vertices: [
            new Vector3(0, 0, 0),
            new Vector3(4, 0, 0),
            new Vector3(0, 0, 4),
          ],
        },
      ],
    });
    const projection = mesh.project(new Vector3(2.4, 0.1, 2.4), {
      ...query,
      agentRadius: 0,
    });
    expect(projection!.position.x).toBeCloseTo(2);
    expect(projection!.position.z).toBeCloseTo(2);
    expect(projection!.position.y).toBe(0);
    mesh.destroy();
    const slope = new NavigationMesh3D({
      polygons: [
        {
          id: 'slope',
          clearanceHeight: 2,
          vertices: [
            new Vector3(0, 0, 0),
            new Vector3(4, 2, 0),
            new Vector3(4, 2, 4),
            new Vector3(0, 0, 4),
          ],
        },
      ],
    });
    const onSlope = slope.project(new Vector3(2, 1.1, 2), query)!;
    expect(onSlope.position.x).toBeCloseTo(2.04);
    expect(onSlope.position.y).toBeCloseTo(1.02);
    slope.destroy();
  });

  it('joins exact tile seams while keeping overlapping floors disconnected', () => {
    const mesh = new NavigationMesh3D({
      tileSize: 2,
      polygons: [
        square('a', 0, 0),
        square('b', 2, 0),
        square('c', 4, 0),
        square('upper-a', 0, 0, 3),
        square('upper-b', 2, 0, 3),
        square('upper-c', 4, 0, 3),
      ],
    });
    const lower = mesh.findPath(
      new Vector3(0.4, 0.1, 1),
      new Vector3(5.6, 0.1, 1),
      query,
    );
    expect(lower.polygons.map((p) => p.id)).toEqual(['a', 'b', 'c']);
    expect(
      lower.waypoints.map((p) => [p.position.x, p.position.y, p.position.z]),
    ).toEqual([
      [0.4, 0, 1],
      [5.6, 0, 1],
    ]);
    expect(
      mesh.findPath(new Vector3(0.4, 0, 1), new Vector3(5.6, 3, 1), query)
        .status,
    ).toBe('unreachable');
    expect(mesh.project(new Vector3(1, 3.1, 1), query)!.polygon.id).toBe(
      'upper-a',
    );
    mesh.destroy();
  });

  it('retains noncoplanar seam heights instead of cutting across air', () => {
    const mesh = new NavigationMesh3D({
      polygons: [
        square('flat', 0, 0),
        {
          id: 'ramp',
          clearanceHeight: 2,
          vertices: [
            new Vector3(2, 0, 0),
            new Vector3(4, 1, 0),
            new Vector3(4, 1, 2),
            new Vector3(2, 0, 2),
          ],
        },
      ],
    });
    const path = mesh.findPath(
      new Vector3(0.5, 0, 1),
      new Vector3(3.5, 0.75, 1),
      query,
    );
    expect(path.waypoints.map((w) => [w.position.x, w.position.y])).toEqual([
      [0.5, 0],
      [2, 0],
      [3.5, 0.75],
    ]);
    mesh.destroy();
  });

  it('filters narrow radius and headroom, and projects agent centers away from exterior walls', () => {
    const mesh = new NavigationMesh3D({
      polygons: [
        {
          id: 'passage',
          clearanceHeight: 1.5,
          vertices: [
            new Vector3(0, 0, 0),
            new Vector3(6, 0, 0),
            new Vector3(6, 0, 1),
            new Vector3(0, 0, 1),
          ],
        },
      ],
    });
    const from = new Vector3(1, 0, 0.5),
      to = new Vector3(5, 0, 0.5);
    expect(
      mesh.findPath(from, to, { ...query, agentRadius: 0.49 }).status,
    ).toBe('found');
    expect(
      mesh.findPath(from, to, { ...query, agentRadius: 0.51 }).status,
    ).toBe('unreachable');
    expect(mesh.findPath(from, to, { ...query, agentHeight: 1.6 }).status).toBe(
      'unreachable',
    );
    expect(
      mesh.project(new Vector3(2, 0, 0.05), query)!.position.z,
    ).toBeCloseTo(0.2);
    mesh.destroy();
  });

  it('smooths only traversable clearance-safe corridors around a reentrant corner', () => {
    const mesh = new NavigationMesh3D({
      polygons: [
        square('a', 0, 0),
        square('b', 2, 0),
        square('c', 2, 2),
        square('d', 2, 4),
      ],
    });
    const path = mesh.findPath(new Vector3(0.6, 0, 1), new Vector3(3, 0, 5.4), {
      ...query,
      agentRadius: 0.4,
    });
    expect(path.status).toBe('found');
    expect(path.waypoints.length).toBeGreaterThan(2);
    for (let i = 1; i < path.waypoints.length; i++) {
      const a = path.waypoints[i - 1]!.position,
        b = path.waypoints[i]!.position;
      for (let j = 0; j <= 100; j++) {
        const x = a.x + ((b.x - a.x) * j) / 100,
          z = a.z + ((b.z - a.z) * j) / 100;
        const obstacleDistance = Math.hypot(
          Math.max(0, x - 2),
          Math.max(0, 2 - z),
        );
        expect(obstacleDistance).toBeGreaterThanOrEqual(0.4 - 1e-7);
      }
    }
    mesh.destroy();
  });

  it('bounds all projection/search/reconstruction/smoothing work and invalidates admitted and queued queries', () => {
    const mesh = new NavigationMesh3D({
      polygons: Array.from({ length: 50 }, (_, i) => square(`${i}`, i * 2, 0)),
    });
    const scheduler = new NavigationScheduler({ workBudget: 7 });
    const jobs = Array.from({ length: 12 }, () =>
      mesh.scheduleSearch(
        scheduler,
        new Vector3(0.5, 0, 1),
        new Vector3(99.5, 0, 1),
        query,
      ),
    );
    for (
      let tick = 0;
      tick < 10000 && jobs.some((job) => job.status === 'pending');
      tick++
    ) {
      const before = jobs.reduce((n, job) => n + job.expansions, 0);
      expect(scheduler.update().work).toBeLessThanOrEqual(7);
      expect(
        jobs.reduce((n, job) => n + job.expansions, 0) - before,
      ).toBeLessThanOrEqual(7);
    }
    expect(jobs.every((job) => job.status === 'found')).toBe(true);
    const active = mesh.scheduleSearch(
      scheduler,
      new Vector3(0.5, 0, 1),
      new Vector3(99.5, 0, 1),
      query,
    );
    const queued = mesh.scheduleSearch(
      scheduler,
      new Vector3(0.5, 0, 1),
      new Vector3(99.5, 0, 1),
      query,
    );
    scheduler.update(1);
    mesh.setPolygonEnabled('25', false);
    expect(active.status).toBe('invalidated');
    expect(queued.status).toBe('invalidated');
    expect(mesh.isPathCurrent(jobs[0]!.result!)).toBe(false);
    expect(
      mesh.findPath(new Vector3(0.5, 0, 1), new Vector3(99.5, 0, 1), query)
        .status,
    ).toBe('unreachable');
    const cancelled = mesh.createSearch(
      new Vector3(0.5, 0, 1),
      new Vector3(99.5, 0, 1),
      query,
    );
    cancelled.step(2);
    cancelled.cancel();
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.result).toBeUndefined();
    expect(mesh.availableSearchSlots).toBe(8);
    scheduler.destroy();
    mesh.destroy();
  });

  it('requires real link handlers and rejects handler completion away from the destination', () => {
    const scene = new Scene(),
      floor = new Object3D(),
      actor = new Object3D();
    floor.collider = new PlaneCollider3D();
    scene.add(floor);
    actor.collider = new CapsuleCollider3D(0.2, 1, { category: 2, mask: 1 });
    actor.position.set(1, 0.702, 1);
    scene.add(actor);
    const controller = new CharacterController3D(actor, scene.physics3D, {
      mask: 1,
    });
    const mesh = new NavigationMesh3D({
      polygons: [square('lower', 0, 0), square('upper', 0, 0, 3)],
      links: [
        {
          id: 'lift',
          from: 'lower',
          to: 'upper',
          start: new Vector3(1, 0, 1),
          end: new Vector3(1, 3, 1),
          clearance: 0.4,
        },
      ],
    });
    const path = mesh.findPath(
      new Vector3(1, 0, 1),
      new Vector3(1, 3, 1),
      query,
    );
    const missing = new NavigationMeshFollower3D(controller);
    missing.follow(mesh, path, 0.702);
    missing.update(1 / 60);
    expect(missing.state).toBe('blocked');
    expect(actor.position.y).toBeCloseTo(0.702);
    missing.destroy();
    const falseCompletion = new NavigationMeshFollower3D(controller, {
      traverseLink: () => 'complete',
    });
    falseCompletion.follow(mesh, path, 0.702);
    falseCompletion.update(1 / 60);
    expect(falseCompletion.state).toBe('blocked');
    falseCompletion.destroy();
    const real = new NavigationMeshFollower3D(controller, {
      traverseLink: ({ controller: character, to }) => {
        character.object.position.copy(to);
        return 'complete';
      },
    });
    real.follow(mesh, path, 0.702);
    for (let i = 0; i < 3; i++) real.update(1 / 60);
    expect(real.state).toBe('finished');
    expect(actor.position.y).toBeCloseTo(3.702);
    const pending = mesh.createSearch(
      new Vector3(1, 0, 1),
      new Vector3(1, 3, 1),
      query,
    );
    pending.step(1);
    mesh.setLinkEnabled('lift', false);
    expect(pending.status).toBe('invalidated');
    expect(mesh.isPathCurrent(path)).toBe(false);
    expect(
      mesh.findPath(new Vector3(1, 0, 1), new Vector3(1, 3, 1), query).status,
    ).toBe('unreachable');
    real.destroy();
    mesh.destroy();
    controller.destroy();
    scene.destroy();
  });

  it('preserves sampled graph costs, floor projection, exclusions and revisions across partitions', () => {
    const id = NavigationTiledGraph3D.nodeId;
    const graph = new NavigationTiledGraph3D({
      tileSize: 2,
      tiles: ['a', 'b'].map((tile, index) => ({
        id: tile,
        geometry: {
          nodes: [
            {
              id: 'left',
              position: new Vector3(index * 2, 0, 0),
              clearance: 0.3,
              surfaceY: 0,
            },
            {
              id: 'right',
              position: new Vector3(index * 2 + 1, 0, 0),
              clearance: 0.3,
              surfaceY: 0,
            },
          ],
          connections: [{ from: 'left', to: 'right', cost: 1, clearance: 0.3 }],
        },
      })),
      seams: [
        {
          from: id('a', 'right'),
          to: id('b', 'left'),
          cost: 0.5,
          clearance: 0.25,
        },
      ],
    });
    const start = id('a', 'left'),
      goal = id('b', 'right');
    expect(graph.findPath(start, goal, { agentRadius: 0.2 }).cost).toBe(2.5);
    expect(graph.findPath(start, goal, { agentRadius: 0.26 }).status).toBe(
      'unreachable',
    );
    const seam = graph.getConnectionIndex(id('a', 'right'), id('b', 'left'))!;
    expect(
      graph.findPath(start, goal, { excludedConnections: [seam] }).status,
    ).toBe('unreachable');
    expect(
      graph.project(new Vector3(2.1, 0, 0), {
        maxDistance: 0.2,
        maxVerticalDistance: 0.1,
      })!.node.id,
    ).toBe(id('b', 'left'));
    const pending = graph.createSearch(start, goal);
    pending.step(1);
    graph.setConnection(seam, { enabled: false });
    expect(pending.status).toBe('invalidated');
    expect(graph.findPath(start, goal).status).toBe('unreachable');
    graph.destroy();
  });

  it('rejects unrepresentable spatial indices instead of hanging on tiny tile sizes', () => {
    expect(
      () =>
        new NavigationMesh3D({
          tileSize: Number.MIN_VALUE,
          polygons: [square('finite', 2, 2)],
        }),
    ).toThrow(RangeError);
    expect(
      () =>
        new NavigationTiledGraph3D({
          tileSize: Number.MIN_VALUE,
          seams: [],
          tiles: [
            {
              id: 'a',
              geometry: {
                nodes: [{ id: 'node', position: new Vector3(1, 0, 1) }],
                connections: [],
              },
            },
          ],
        }),
    ).toThrow(RangeError);
    for (const tileSize of [Number.MIN_VALUE, 1e-8]) {
      const graph = new NavigationTiledGraph3D({
        tileSize,
        seams: [],
        tiles: [
          {
            id: 'a',
            geometry: {
              nodes: [{ id: 'node', position: new Vector3() }],
              connections: [],
            },
          },
        ],
      });
      expect(() =>
        graph.project(new Vector3(1e9, 0, 1e9), {
          maxDistance: 0,
          maxVerticalDistance: 0,
        }),
      ).toThrow(RangeError);
      graph.destroy();
    }
    const mesh = new NavigationMesh3D({ polygons: [square('finite', 0, 0)] });
    expect(
      mesh.project(new Vector3(1e9, 0, 1e9), { ...query, maxDistance: 0 }),
    ).toBeUndefined();
    mesh.destroy();
  });

  it('rejects aggregate geometry above the world admission budget', () => {
    const geometry = {
      nodes: Array.from({ length: 8192 }, (_, i) => ({
        id: `${i}`,
        position: new Vector3(i, 0, 0),
      })),
      connections: [],
    };
    expect(
      () =>
        new NavigationTiledGraph3D({
          seams: [],
          tiles: Array.from({ length: 33 }, (_, i) => ({
            id: `${i}`,
            geometry,
          })),
        }),
    ).toThrow(RangeError);
  });
});

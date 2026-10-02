import { describe, expect, it } from 'vitest';
import { Vector3 } from '../packages/math/src/math3d.js';
import { Object3D } from '../packages/core/src/object3d.js';
import { Scene } from '../packages/core/src/scene.js';
import {
  BoxCollider3D,
  CapsuleCollider3D,
} from '../packages/core/src/physics3d/collider.js';
import { CharacterController3D } from '../packages/core/src/physics3d/character.js';
import { NavigationGraph3D } from '../packages/core/src/navigation/graph.js';
import { NavigationGrid2D } from '../packages/core/src/navigation/grid.js';
import { NavigationFollower3D } from '../packages/core/src/navigation/follower.js';

function routes() {
  return new NavigationGraph3D({
    nodes: [
      { id: 'start', position: new Vector3(0, 1, 0) },
      { id: 'near', position: new Vector3(0, 1, 2) },
      { id: 'far', position: new Vector3(4, 1, 2) },
      { id: 'goal', position: new Vector3(4, 1, 0) },
    ],
    connections: [
      { from: 'start', to: 'goal', cost: 1, clearance: 0.3 },
      { from: 'start', to: 'near', cost: 2, clearance: 1 },
      { from: 'near', to: 'far', cost: 4, clearance: 1 },
      { from: 'far', to: 'goal', cost: 2, clearance: 1 },
    ],
  });
}

interface NavigationFixture {
  scene: Scene;
  object: Object3D;
  character: CharacterController3D;
  obstacle: Object3D;
  graph: NavigationGraph3D;
  follower: NavigationFollower3D;
}

function setup(): NavigationFixture {
  const scene = new Scene();
  scene.physics3D.gravity.set(0, 0, 0);
  const object = new Object3D();
  object.collider = new CapsuleCollider3D(0.25, 1);
  object.position.set(0, 1, 0);
  scene.add(object);
  const character = new CharacterController3D(object, scene.physics3D, {
    stepHeight: 0,
    groundSnap: 0,
  });
  const obstacle = new Object3D();
  obstacle.collider = new BoxCollider3D(new Vector3(0.5, 1, 1));
  obstacle.position.set(2, 1, 0);
  scene.add(obstacle);
  const graph = routes();
  const follower = new NavigationFollower3D(character, {
    speed: 3,
    expansionBudget: 1,
    maxReplans: 2,
  });
  return { scene, object, character, obstacle, graph, follower };
}

function dispose(value: NavigationFixture) {
  value.follower.destroy();
  value.character.destroy();
  value.scene.destroy();
  value.graph.destroy();
}

function advance(follower: NavigationFollower3D, deltaSeconds: number): void {
  follower.scheduler.update(1);
  follower.update(deltaSeconds);
}

describe('revisioned authored clearance', () => {
  it('filters narrow graph connections by radius, invalidates jobs and snapshots only on effective atomic edits', () => {
    const graph = routes();
    const narrow = graph.findPath('start', 'goal', { agentRadius: 0.25 });
    expect(narrow.cost).toBe(1);
    expect(
      graph
        .findPath('start', 'goal', { agentRadius: 0.5 })
        .nodes.map((node) => node.id),
    ).toEqual(['start', 'near', 'far', 'goal']);
    const job = graph.createSearch('start', 'goal');
    job.step(1);
    graph.setConnection(0, { enabled: true });
    expect(job.status).toBe('pending');
    expect(graph.isPathCurrent(narrow)).toBe(true);
    const revision = graph.revision;
    expect(() =>
      graph.setConnections([
        { index: 0, enabled: false },
        { index: 1, clearance: -1 },
      ]),
    ).toThrow(RangeError);
    expect(graph.revision).toBe(revision);
    expect(graph.connections[0]!.enabled).toBe(true);
    const snapshot = graph.connections;
    graph.setConnection(0, { enabled: false });
    expect(snapshot[0]!.enabled).toBe(true);
    expect(job.status).toBe('invalidated');
    expect(graph.isPathCurrent(narrow)).toBe(false);
    expect(routes().isPathCurrent(narrow)).toBe(false);
    expect(graph.findPath('goal', 'start').cost).toBe(8);
    const fresh = graph.findPath('start', 'goal');
    graph.setConnection(1, { clearance: 0.2 });
    expect(graph.isPathCurrent(fresh)).toBe(false);
    expect(graph.findPath('start', 'goal', { agentRadius: 0.25 }).status).toBe(
      'unreachable',
    );
    graph.destroy();
  });

  it('honors authored cell-space clearance, including diagonal corner constraints, without a geometry bake', () => {
    const grid = new NavigationGrid2D({ columns: 3, rows: 1 });
    grid.setCell(1, 0, { clearance: 0.25 });
    const start = { column: 0, row: 0 },
      goal = { column: 2, row: 0 };
    expect(grid.findPath(start, goal, { agentRadius: 0.25 }).cost).toBe(2);
    expect(grid.findPath(start, goal, { agentRadius: 0.3 }).status).toBe(
      'unreachable',
    );
    const job = grid.createSearch(start, goal);
    grid.setCell(1, 0, { clearance: 0.5 });
    expect(job.status).toBe('invalidated');
    expect(grid.findPath(start, goal, { agentRadius: 0.3 }).cost).toBe(2);
    const square = new NavigationGrid2D({ columns: 2, rows: 2 });
    square.setCells([
      { column: 1, row: 0, clearance: 0 },
      { column: 0, row: 1, clearance: 0 },
    ]);
    expect(
      square.findPath(
        start,
        { column: 1, row: 1 },
        { diagonal: true, agentRadius: 0.1 },
      ).status,
    ).toBe('unreachable');
    grid.destroy();
    square.destroy();
  });
});

describe('bounded dynamic character navigation', () => {
  it('finds and physically executes an alternate route after actual contact without synchronous replanning', () => {
    const value = setup();
    const { follower, graph, object } = value;
    try {
      follower.navigate({
        graph,
        start: 'start',
        goal: 'goal',
        agentRadius: 0.25,
      });
      advance(follower, 1);
      expect(object.position).toEqual(new Vector3(0, 1, 0));
      follower.pause();
      advance(follower, 10);
      expect(object.position).toEqual(new Vector3(0, 1, 0));
      follower.resume();
      let observedReplan = false;
      for (let tick = 0; tick < 200 && follower.state !== 'finished'; tick++) {
        const currentJob = follower.searchJob;
        const expansions = currentJob?.expansions ?? 0;
        const before = object.position.clone();
        advance(follower, 0.1);
        if (currentJob)
          expect(currentJob.expansions - expansions).toBeLessThanOrEqual(1);
        expect(
          object.position.clone().subtract(before).length(),
        ).toBeLessThanOrEqual(0.300001);
        observedReplan ||= follower.replanCount > 0;
      }
      expect(observedReplan).toBe(true);
      expect(follower.replanCount).toBe(1);
      expect(follower.state).toBe('finished');
      expect(
        object.position
          .clone()
          .subtract(new Vector3(4, 1, 0))
          .length(),
      ).toBeLessThanOrEqual(0.0001);
      expect(graph.connections[0]!.enabled).toBe(true);
    } finally {
      dispose(value);
    }
  });

  it('abandons revised routes before movement and reaches the alternate goal', () => {
    const value = setup();
    try {
      value.follower.navigate({
        graph: value.graph,
        start: 'start',
        goal: 'goal',
        agentRadius: 0.25,
      });
      const staleJob = value.follower.searchJob!;
      value.graph.setConnection(0, { enabled: false });
      advance(value.follower, 10);
      expect(staleJob.status).toBe('invalidated');
      expect(value.object.position).toEqual(new Vector3(0, 1, 0));
      for (
        let tick = 0;
        tick < 100 && value.follower.state !== 'finished';
        tick++
      )
        advance(value.follower, 0.1);
      expect(value.follower.state).toBe('finished');
      expect(value.follower.replanCount).toBe(1);
    } finally {
      dispose(value);
    }
  });

  it('reports unreachable topology versus a physically blocked route, with finite revision retries', () => {
    const value = setup();
    try {
      value.graph.setConnections([
        { index: 0, enabled: false },
        { index: 1, enabled: false },
      ]);
      value.follower.navigate({
        graph: value.graph,
        start: 'start',
        goal: 'goal',
        agentRadius: 0.25,
      });
      for (let tick = 0; tick < 10; tick++) advance(value.follower, 0.1);
      expect(value.follower.state).toBe('unreachable');
      value.graph.setConnection(0, { enabled: true });
      for (let tick = 0; tick < 30; tick++) advance(value.follower, 0.1);
      expect(value.follower.state).toBe('blocked');
      expect(value.follower.searchJob).toBeUndefined();
      expect(value.follower.replanCount).toBe(2);
      const position = value.object.position.clone();
      for (let tick = 0; tick < 20; tick++) {
        value.graph.setConnection(1, { enabled: tick % 2 === 0 });
        advance(value.follower, 1);
      }
      expect(value.follower.state).toBe('blocked');
      expect(value.follower.replanCount).toBe(2);
      expect(value.object.position).toEqual(position);
    } finally {
      dispose(value);
    }
  });

  it('retires cancelled searches, stop/destroy jobs, removed characters and destroyed borrowed owners', () => {
    const value = setup();
    try {
      const contract = {
        graph: value.graph,
        start: 'start',
        goal: 'goal',
        agentRadius: 0.25,
      };
      value.follower.navigate(contract);
      const cancelled = value.follower.searchJob!;
      cancelled.cancel();
      advance(value.follower, 0.1);
      expect(value.follower.state).toBe('stopped');
      value.follower.navigate(contract);
      const stopped = value.follower.searchJob!;
      value.follower.stop();
      expect(stopped.status).toBe('cancelled');
      value.follower.navigate(contract);
      const removed = value.follower.searchJob!;
      value.scene.remove(value.object);
      advance(value.follower, 0.1);
      expect(removed.status).toBe('cancelled');
      expect(value.follower.state).toBe('stopped');
      value.scene.add(value.object);
      value.follower.navigate(contract);
      const destroyed = value.follower.searchJob!;
      value.follower.destroy();
      expect(destroyed.status).toBe('cancelled');
      expect(value.character.destroyed).toBe(false);
      value.character.move(new Vector3(0, 0, 0.5));
      expect(value.object.position.z).toBeCloseTo(0.5);
    } finally {
      dispose(value);
    }
  });

  it('cancels jobs when the borrowed controller or graph is destroyed', () => {
    const value = setup();
    try {
      value.follower.navigate({
        graph: value.graph,
        start: 'start',
        goal: 'goal',
        agentRadius: 0.25,
      });
      const job = value.follower.searchJob!;
      value.character.destroy();
      advance(value.follower, 0.1);
      expect(job.status).toBe('cancelled');
      expect(value.follower.state).toBe('stopped');
    } finally {
      dispose(value);
    }
    const other = setup();
    try {
      other.follower.navigate({
        graph: other.graph,
        start: 'start',
        goal: 'goal',
        agentRadius: 0.25,
      });
      other.graph.destroy();
      advance(other.follower, 0.1);
      expect(other.follower.state).toBe('stopped');
    } finally {
      dispose(other);
    }
  });
});

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
import { PathFollower3D } from '../packages/core/src/navigation/follower.js';

function characterWithObstacle() {
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
  return { scene, object, character, obstacle };
}

describe('physics character graph following', () => {
  it('executes a route around an obstacle at bounded speed, pauses, and arrives without overshoot', () => {
    const { scene, object, character } = characterWithObstacle();
    const graph = new NavigationGraph3D({
      nodes: [
        { id: 'start', position: new Vector3(0, 1, 0) },
        { id: 'near', position: new Vector3(0, 1, 2) },
        { id: 'far', position: new Vector3(4, 1, 2) },
        { id: 'goal', position: new Vector3(4, 1, 0) },
      ],
      connections: [
        { from: 'start', to: 'near', cost: 2 },
        { from: 'near', to: 'far', cost: 4 },
        { from: 'far', to: 'goal', cost: 2 },
      ],
    });
    const follower = new PathFollower3D(character, { speed: 2 });
    try {
      expect(character.move(new Vector3(4, 0, 0)).blocked).toBe(true);
      expect(object.position.x).toBeLessThan(1.5);
      object.position.set(0, 1, 0);
      follower.setPath(graph.findPath('start', 'goal'));
      follower.update(0.25);
      expect(object.position).toEqual(new Vector3(0, 1, 0.5));
      follower.pause();
      const paused = object.position.clone();
      follower.update(20);
      expect(follower.state).toBe('paused');
      expect(object.position).toEqual(paused);
      follower.resume();
      for (
        let index = 0;
        index < 60 && follower.state === 'following';
        index++
      ) {
        const before = object.position.clone();
        follower.update(0.1);
        expect(
          object.position.clone().subtract(before).length(),
        ).toBeLessThanOrEqual(0.20000001);
      }
      expect(follower.state).toBe('finished');
      expect(
        object.position
          .clone()
          .subtract(new Vector3(4, 1, 0))
          .length(),
      ).toBeLessThanOrEqual(0.0001);
      const arrived = object.position.clone();
      follower.update(100);
      expect(object.position).toEqual(arrived);
    } finally {
      follower.destroy();
      character.destroy();
      scene.destroy();
    }
  });

  it('blocks on physical contact, retries after removal, stops cleanly and retains the borrowed character', () => {
    const { scene, object, character, obstacle } = characterWithObstacle();
    const graph = new NavigationGraph3D({
      nodes: [
        { id: 'start', position: new Vector3(0, 1, 0) },
        { id: 'goal', position: new Vector3(4, 1, 0) },
      ],
      connections: [{ from: 'start', to: 'goal', cost: 4 }],
    });
    const follower = new PathFollower3D(character, { speed: 2 });
    try {
      follower.setPath(graph.findPath('start', 'goal'));
      expect(() =>
        follower.setPath({ status: 'unreachable', nodes: [], cost: Infinity }),
      ).toThrow(RangeError);
      expect(() => follower.update(-1)).toThrow(RangeError);
      follower.update(10);
      expect(follower.state).toBe('blocked');
      expect(object.position.x).toBeGreaterThan(1);
      expect(object.position.x).toBeLessThan(1.5);
      const blocked = object.position.clone();
      follower.update(10);
      expect(object.position).toEqual(blocked);
      follower.pause();
      follower.update(10);
      expect(object.position).toEqual(blocked);
      scene.remove(obstacle);
      follower.resume();
      follower.update(10);
      expect(follower.state).toBe('finished');
      expect(object.position).toEqual(new Vector3(4, 1, 0));
      follower.setPath(graph.findPath('goal', 'start'));
      follower.stop();
      follower.update(10);
      expect(follower.state).toBe('stopped');
      expect(object.position).toEqual(new Vector3(4, 1, 0));
      follower.destroy();
      expect(() => follower.update(1)).toThrow(Error);
      character.move(new Vector3(1, 0, 0));
      expect(object.position).toEqual(new Vector3(5, 1, 0));
    } finally {
      follower.destroy();
      character.destroy();
      scene.destroy();
      obstacle.destroy();
    }
  });
  it('does not mistake sub-tolerance motion for contact and progresses on the next update', () => {
    const { scene, object, character } = characterWithObstacle();
    const graph = new NavigationGraph3D({
      nodes: [
        { id: 'start', position: new Vector3(0, 1, 0) },
        { id: 'goal', position: new Vector3(0, 1, 2) },
      ],
      connections: [{ from: 'start', to: 'goal', cost: 2 }],
    });
    const follower = new PathFollower3D(character, { speed: 2 });
    try {
      follower.setPath(graph.findPath('start', 'goal'));
      follower.update(1e-10);
      expect(follower.state).toBe('following');
      expect(object.position).toEqual(new Vector3(0, 1, 0));
      follower.update(0.1);
      expect(follower.state).toBe('following');
      expect(object.position.z).toBeCloseTo(0.2);
      follower.update(1);
      expect(follower.state).toBe('finished');
      expect(object.position).toEqual(new Vector3(0, 1, 2));
    } finally {
      follower.destroy();
      character.destroy();
      scene.destroy();
      graph.destroy();
    }
  });
});

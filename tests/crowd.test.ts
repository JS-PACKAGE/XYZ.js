import { describe, expect, it } from 'vitest';
import { Vector3 } from '../packages/math/src/math3d.js';
import { Scene } from '../packages/core/src/scene.js';
import { Object3D } from '../packages/core/src/object3d.js';
import {
  CapsuleCollider3D,
  BoxCollider3D,
} from '../packages/core/src/physics3d/collider.js';
import { CharacterController3D } from '../packages/core/src/physics3d/character.js';
import { PathFollower3D } from '../packages/core/src/navigation/follower.js';
import {
  CrowdSolver,
  type CrowdRegistration,
} from '../packages/core/src/navigation/crowd.js';
import { GameObject } from '../packages/core/src/game-object.js';
import { Colliders } from '../packages/core/src/physics2d/index.js';
import { CharacterController2D } from '../packages/core/src/physics2d/character.js';
import {
  SteeringWander3D,
  steeringSeek,
  steeringFlee,
  steeringArrive,
} from '../packages/core/src/navigation/steering.js';

export interface CrowdSmokeWalker {
  object: Object3D;
  controller: CharacterController3D;
  follower: PathFollower3D;
  registration: CrowdRegistration;
}
/** Runnable fixed-lifecycle smoke consumer; no controller mocks or teleport movement. */
export class CrowdSmokeScene extends Scene {
  readonly crowd = new CrowdSolver({ neighborDistance: 12, timeHorizon: 2 });
  readonly controllers: CharacterController3D[] = [];
  readonly followers: PathFollower3D[] = [];
  override fixedUpdate(delta: number): void {
    this.crowd.update(delta, this.fixedFrame);
  }
  addWalker(id: number, start: Vector3, goal: Vector3): CrowdSmokeWalker {
    const object = new Object3D();
    object.collider = new CapsuleCollider3D(0.25, 1);
    object.position.copy(start);
    this.add(object);
    const controller = new CharacterController3D(object, this.physics3D, {
      groundSnap: 0,
      stepHeight: 0,
    });
    const follower = new PathFollower3D(controller, {
      speed: 1,
      arrivalTolerance: 0.02,
    });
    follower.setPath({
      status: 'found',
      cost: start.clone().subtract(goal).length(),
      nodes: [
        { id: `start-${id}`, position: start },
        { id: `goal-${id}`, position: goal },
      ],
    });
    const registration = this.crowd.register3D(controller, {
      id,
      radius: 0.3,
      maxSpeed: 1,
      follower,
    });
    this.controllers.push(controller);
    this.followers.push(follower);
    return { object, controller, follower, registration };
  }
  override destroy(): void {
    this.crowd.destroy();
    for (const follower of this.followers) follower.destroy();
    for (const controller of this.controllers) controller.destroy();
    super.destroy();
  }
}

function crossing(reverse: boolean) {
  const scene = new CrowdSmokeScene();
  scene.physics3D.gravity.set(0, 0, 0);
  const createA = () =>
    scene.addWalker(1, new Vector3(-3, 1, 0), new Vector3(3, 1, 0));
  const createB = () =>
    scene.addWalker(2, new Vector3(3, 1, 0), new Vector3(-3, 1, 0));
  let a: CrowdSmokeWalker, b: CrowdSmokeWalker;
  if (reverse) {
    b = createB();
    a = createA();
  } else {
    a = createA();
    b = createB();
  }
  const trace: number[] = [];
  try {
    for (let i = 0; i < 1440; i++) {
      scene.advanceAfterUpdate(1 / 120, () => true);
      const distance = Math.hypot(
        a.object.position.x - b.object.position.x,
        a.object.position.z - b.object.position.z,
      );
      expect(distance).toBeGreaterThanOrEqual(0.599);
      expect(a.registration.velocity.length()).toBeLessThanOrEqual(1.00001);
      trace.push(
        a.object.position.x,
        a.object.position.z,
        b.object.position.x,
        b.object.position.z,
      );
    }
    expect(a.object.position.x).toBeGreaterThan(2.8);
    expect(b.object.position.x).toBeLessThan(-2.8);
    expect(a.follower.state).toBe('finished');
    expect(b.follower.state).toBe('finished');
    return trace;
  } finally {
    scene.destroy();
  }
}

describe('bounded reciprocal crowd and steering', () => {
  it('rejects unrepresentable grid cells without moving controllers and permits a repaired epoch', () => {
    const scene = new CrowdSmokeScene();
    const walker = scene.addWalker(
      1,
      new Vector3(0, 1, 0),
      new Vector3(1, 1, 0),
    );
    walker.object.position.x = 1e20;
    expect(() => scene.crowd.update(1 / 60, 1)).toThrow('representable');
    expect(walker.object.position.x).toBe(1e20);
    walker.object.position.x = 0;
    expect(() => scene.crowd.update(1 / 60, 1)).not.toThrow();
    scene.destroy();
  });
  it('passes head-on without disc overlap and reproduces stable-ID trajectories', () => {
    expect(crossing(false)).toEqual(crossing(true));
  });
  it('avoids a stationary disc rather than passing through it', () => {
    const scene = new CrowdSmokeScene();
    const walker = scene.addWalker(
      1,
      new Vector3(-3, 1, 0),
      new Vector3(3, 1, 0),
    );
    scene.crowd.addObstacle(100, new Vector3(0, 1, 0), 0.7);
    try {
      for (let i = 0; i < 1800; i++) {
        scene.advanceAfterUpdate(1 / 120, () => true);
        expect(
          Math.hypot(walker.object.position.x, walker.object.position.z),
        ).toBeGreaterThanOrEqual(0.999);
      }
      expect(walker.object.position.x).toBeGreaterThan(2.8);
    } finally {
      scene.destroy();
    }
  });
  it('blocks at a closed bottleneck, then resumes through the opened physical corridor', () => {
    const scene = new CrowdSmokeScene();
    const walker = scene.addWalker(
      1,
      new Vector3(-2, 1, 0),
      new Vector3(2, 1, 0),
    );
    const door = new Object3D();
    door.position.set(0, 1, 0);
    door.collider = new BoxCollider3D(new Vector3(0.1, 2, 20));
    scene.add(door);
    try {
      for (let i = 0; i < 480; i++)
        scene.advanceAfterUpdate(1 / 120, () => true);
      expect(walker.object.position.x).toBeLessThan(-0.3);
      expect(walker.registration.state).toBe('blocked');
      scene.remove(door);
      for (let i = 0; i < 600; i++)
        scene.advanceAfterUpdate(1 / 120, () => true);
      expect(walker.follower.state).toBe('finished');
      expect(walker.object.position.x).toBeCloseTo(2, 1);
    } finally {
      scene.destroy();
      door.destroy();
    }
  });
  it('projects top-down XY velocities through the real 2D sweep controller', () => {
    const scene = new Scene();
    const crowd = new CrowdSolver();
    const object = new GameObject();
    object.collider = Colliders.circle(0.25);
    scene.add(object);
    const controller = new CharacterController2D(object, scene.physics, {
      groundSnap: 0,
      stepHeight: 0,
    });
    const registration = crowd.register2D(controller, {
      id: 1,
      radius: 0.3,
      maxSpeed: 1,
      preferredVelocity: (_delta, out) => {
        out.set(0, 0, 1);
      },
    });
    try {
      crowd.update(0.05, 0);
      expect(object.position.x).toBe(0);
      expect(object.position.y).toBeCloseTo(0.05, 8);
      expect(registration.velocity.z).toBeCloseTo(1, 8);
    } finally {
      crowd.destroy();
      controller.destroy();
      scene.destroy();
    }
  });
  it('fails closed on neighbor overflow, ignores repeated epochs and releases borrowed controllers', () => {
    const scene = new CrowdSmokeScene();
    const walker = scene.addWalker(1, new Vector3(), new Vector3(5, 0, 0));
    const crowd = new CrowdSolver({ maxNeighbors: 1, neighborDistance: 12 });
    walker.registration.remove();
    const registration = crowd.register3D(walker.controller, {
      id: 1,
      radius: 0.3,
      maxSpeed: 1,
      follower: walker.follower,
    });
    const removeA = crowd.addObstacle(2, new Vector3(2, 0, 2), 0.3);
    const removeB = crowd.addObstacle(3, new Vector3(2, 0, -2), 0.3);
    try {
      crowd.update(1 / 120, 0);
      expect(registration.state).toBe('budget-exceeded');
      expect(walker.object.position.x).toBe(0);
      removeA();
      removeB();
      crowd.update(1 / 120, 1);
      const x = walker.object.position.x;
      expect(x).toBeGreaterThan(0);
      crowd.update(1 / 120, 1);
      expect(walker.object.position.x).toBe(x);
      registration.remove();
      crowd.update(1 / 120, 2);
      expect(walker.object.position.x).toBe(x);
      expect(walker.controller.destroyed).toBe(false);
    } finally {
      crowd.destroy();
      scene.destroy();
    }
  });
  it('produces seek/flee/arrive speeds and deterministic time-partitioned wander', () => {
    const out = new Vector3();
    expect(
      steeringSeek(new Vector3(), new Vector3(3, 0, 4), 2, out).length(),
    ).toBeCloseTo(2);
    expect(steeringFlee(new Vector3(), new Vector3(1, 0, 0), 2, out).x).toBe(
      -2,
    );
    expect(
      steeringArrive(new Vector3(), new Vector3(1, 0, 0), 2, 4, out).x,
    ).toBe(0.5);
    const a = new SteeringWander3D(42),
      b = new SteeringWander3D(42);
    const first = a.update(1, 2, new Vector3());
    b.update(0.5, 2, out);
    b.update(0.5, 2, out);
    expect(first.x).toBeCloseTo(out.x, 12);
    expect(first.z).toBeCloseTo(out.z, 12);
  });
});

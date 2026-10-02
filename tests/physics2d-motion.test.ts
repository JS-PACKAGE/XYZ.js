import { describe, expect, it } from 'vitest';
import { GameObject } from '../packages/core/src/game-object.js';
import { Scene } from '../packages/core/src/scene.js';
import { Vector2 } from '../packages/math/src/index.js';
import {
  CharacterController2D,
  Colliders,
  DistanceJoint,
  PhysicsWorld2D,
  RigidBody2D,
  type Collider2D,
  type RigidBodyOptions,
} from '../packages/core/src/physics2d/index.js';

function object(
  world: PhysicsWorld2D,
  collider: Collider2D,
  x: number,
  y: number,
  options: RigidBodyOptions = { type: 'static' },
): GameObject {
  const owner = new GameObject();
  owner.position.set(x, y);
  owner.collider = collider;
  owner.body = new RigidBody2D(options);
  world.register(owner);
  return owner;
}
function character(world: PhysicsWorld2D, x = 0, y = 0): CharacterController2D {
  const player = object(world, Colliders.box(2, 4), x, y, {
    type: 'kinematic',
    lockRotation: true,
  });
  return new CharacterController2D(player, world, {
    skin: 0.01,
    stepHeight: 1.2,
    groundSnap: 0.15,
  });
}

describe('2D rigid kinematic and conservative continuous motion', () => {
  it('integrates prescribed kinematic translation/rotation without gravity, force, or impulse response', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 900] });
    const platform = object(world, Colliders.box(10, 2), 0, 0, {
      type: 'kinematic',
    });
    platform.body!.velocity.set(12, -6);
    platform.body!.angularVelocity = 3;
    platform.body!.applyForce(new Vector2(1e6, 1e6));
    platform.body!.applyImpulse(new Vector2(1e6, 1e6));
    world.update(1 / 120);
    expect(platform.position.x).toBeCloseTo(0.1);
    expect(platform.position.y).toBeCloseTo(-0.05);
    expect(platform.rotation).toBeCloseTo(0.025);
    expect(platform.body!.velocity.y).toBe(-6);
    expect(platform.body!.inverseMass).toBe(0);
    expect(platform.body!.isSleeping).toBe(false);
    world.destroy();
  });
  it('uses kinematic contact-point velocity for friction, restitution, and sleeping support wake', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 20] });
    const floor = object(world, Colliders.box(40, 2), 0, 10, {
      type: 'kinematic',
      friction: 1,
    });
    const box = object(world, Colliders.box(2, 2), 0, 8, {
      lockRotation: true,
      friction: 1,
    });
    for (let i = 0; i < 240; i++) world.update(1 / 120);
    expect(box.body!.isSleeping).toBe(true);
    floor.body!.velocity.x = 2;
    for (let i = 0; i < 120; i++) world.update(1 / 120);
    expect(box.body!.isSleeping).toBe(false);
    expect(box.body!.velocity.x).toBeCloseTo(2, 3);
    expect(box.position.x).toBeGreaterThan(1.5);
    world.destroy();
  });
  it('keeps a joint attached to a prescribed moving anchor and wakes it after direct mutable pose edits', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const anchor = object(world, Colliders.circle(1), 0, 0, {
      type: 'kinematic',
    });
    const bob = object(world, Colliders.circle(1), 0, 4, { allowSleep: true });
    const joint = world.addJoint(
      new DistanceJoint({
        bodyA: anchor,
        bodyB: bob,
        anchor: [0, 0],
        anchorB: [0, 4],
        length: 4,
      }),
    );
    for (let i = 0; i < 120; i++) world.update(1 / 120);
    expect(bob.body!.isSleeping).toBe(true);
    anchor.position.x = 2;
    world.update(1 / 120);
    expect(bob.body!.isSleeping).toBe(false);
    expect(bob.position.x).toBeGreaterThan(0);
    world.unregister(anchor);
    expect(joint.attached).toBe(false);
    expect(world.joints).toEqual([]);
    world.destroy();
  });
  it('rebounds opposing dynamic bodies at their relative TOI, with real contact events and momentum', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const a = object(world, Colliders.circle(1), -4, 0, {
      ccd: true,
      restitution: 1,
      friction: 0,
      lockRotation: true,
    });
    const b = object(world, Colliders.circle(1), 4, 0, {
      restitution: 1,
      friction: 0,
      lockRotation: true,
    });
    a.body!.velocity.x = 1200;
    b.body!.velocity.x = -1200;
    let starts = 0,
      posts = 0;
    a.addEventListener('collisionstart', () => starts++);
    a.addEventListener('postcollision', () => posts++);
    world.update(1 / 120);
    expect(a.body!.velocity.x).toBeCloseTo(-1200, 4);
    expect(b.body!.velocity.x).toBeCloseTo(1200, 4);
    expect(a.position.x).toBeLessThan(b.position.x);
    expect(starts).toBe(1);
    expect(posts).toBe(1);
    expect(world.ccdStats.impacts).toBe(1);
    expect(world.ccdStats.budgetExhaustions).toBe(0);
    world.destroy();
  });
  it('blocks a rotating thin convex blade, preserving its free prefix and reporting bounded exhaustion', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const blade = object(world, Colliders.box(12, 0.1), 0, 0, {
      ccd: true,
      friction: 0,
    });
    object(world, Colliders.box(0.1, 1), 4, 4);
    const unrelated = object(world, Colliders.circle(1), -100, -100, {
      type: 'kinematic',
    });
    unrelated.body!.velocity.x = 120;
    blade.body!.angularVelocity = Math.PI * 120;
    world.update(1 / 120);
    expect(blade.rotation).toBeGreaterThan(0.5);
    expect(blade.rotation).toBeLessThan(1);
    expect(world.ccdStats.impacts).toBeGreaterThan(0);
    expect(world.ccdStats.budgetExhaustions).toBeGreaterThan(0);
    expect(world.ccdStats.stoppedTime).toBeGreaterThan(0);
    expect(unrelated.position.x).toBeCloseTo(-99);
    expect(blade.body!.angularVelocity).not.toBe(0);
    world.destroy();
  });
  it('does not invent an impact when the advancement budget expires, or clamp the supplied velocity', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0], ccdIterations: 1 });
    object(world, Colliders.box(0.1, 20), 4, 0);
    const shot = object(world, Colliders.circle(1), 0, 0, {
      ccd: true,
      lockRotation: true,
    });
    shot.body!.velocity.x = 1200;
    let starts = 0;
    shot.addEventListener('collisionstart', () => starts++);
    world.update(1 / 120);
    expect(shot.position.x).toBeGreaterThan(0);
    expect(shot.position.x).toBeLessThan(2.95);
    expect(world.ccdStats.budgetExhaustions).toBeGreaterThan(0);
    expect(world.ccdStats.impacts).toBe(0);
    expect(starts).toBe(0);
    expect(shot.body!.velocity.x).toBe(1200);
    world.destroy();
  });
  it('honors reciprocal filters and sensors during dynamic sweeps, and tolerates destruction in impact callbacks', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const sensor = object(world, Colliders.box(0.1, 20), 2, 0);
    sensor.collider!.sensor = true;
    const excluded = object(world, Colliders.box(0.1, 20), 4, 0);
    excluded.collider!.mask = 2;
    const shot = object(world, Colliders.circle(0.5), 0, 0, {
      ccd: true,
      lockRotation: true,
    });
    shot.body!.velocity.x = 1200;
    world.update(1 / 120);
    expect(shot.position.x).toBeCloseTo(10);
    const wall = object(world, Colliders.box(0.1, 20), 14, 0);
    shot.addEventListener(
      'precollision',
      () => {
        world.unregister(shot);
        shot.destroy();
      },
      { once: true },
    );
    world.update(1 / 120);
    expect(shot.destroyed).toBe(true);
    expect(world.has(shot)).toBe(false);
    expect(world.has(wall)).toBe(true);
    world.destroy();
    expect(world.colliderCount).toBe(0);
  });
});

describe('2D exact character sweeps and borrowed moving support', () => {
  it('climbs only a swept, clear stair path and cannot step through a ceiling or wall', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    object(world, Colliders.box(40, 2), 0, 10);
    object(world, Colliders.box(4, 3), 6, 9.5);
    const controller = character(world);
    controller.move(new Vector2(0, 20));
    const stepped = controller.move(new Vector2(6, 0.1));
    expect(stepped.grounded).toBe(true);
    expect(controller.object.position.x).toBeCloseTo(6, 3);
    expect(controller.object.position.y).toBeCloseTo(5.99, 2);
    const wall = object(world, Colliders.box(0.1, 20), 9, 0);
    const blocked = controller.move(new Vector2(100, 0.1));
    expect(blocked.blocked).toBe(true);
    expect(controller.object.position.x).toBeLessThan(7.96);
    world.unregister(wall);
    wall.destroy();
    controller.detachSupport();
    controller.object.position.set(0, 6.99);
    controller.move(new Vector2(0, 0.1));
    object(world, Colliders.box(20, 0.2), 0, 4.8);
    const ceilingBlocked = controller.move(new Vector2(6, 0.1));
    expect(ceilingBlocked.blocked).toBe(true);
    expect(controller.object.position.x).toBeLessThan(3.1);
    controller.destroy();
    world.destroy();
  });
  it('slides along a walkable slope without AABB false contacts and stops at a thin wall', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    object(
      world,
      Colliders.polygon([
        [-10, 3],
        [10, -3],
        [10, 3],
      ]),
      0,
      10,
    );
    const controller = character(world, -7, 0);
    controller.move(new Vector2(0, 20));
    const initialY = controller.object.position.y;
    for (let i = 0; i < 100; i++) controller.move(new Vector2(0.1, 0.05));
    expect(controller.grounded).toBe(true);
    expect(controller.object.position.x).toBeGreaterThan(-1);
    expect(controller.object.position.y).toBeLessThan(initialY - 1);
    object(world, Colliders.box(0.1, 30), 5, 0);
    controller.move(new Vector2(100, 0));
    expect(controller.object.position.x).toBeLessThan(3.96);
    controller.destroy();
    world.destroy();
  });
  it('consumes translation and rotation once per epoch, detaches on jump and invalidates removed support anchors', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const support = object(world, Colliders.box(40, 2), 0, 10, {
      type: 'kinematic',
    });
    const controller = character(world, 4, 0);
    controller.move(new Vector2(0, 20), { epoch: 0 });
    support.position.x = 3;
    support.rotation = 0.1;
    const carried = controller.move(new Vector2(0, 0.1), { epoch: 1 });
    expect(carried.supportRotationDelta).toBeCloseTo(0.1);
    expect(carried.carriedDisplacement.x).toBeGreaterThan(3);
    const x = controller.object.position.x;
    const repeated = controller.move(new Vector2(0, 0.1), { epoch: 1 });
    expect(repeated.carriedDisplacement.x).toBe(0);
    expect(controller.object.position.x).toBeCloseTo(x, 2);
    const jumped = controller.move(new Vector2(0, -2), {
      epoch: 2,
      detachSupport: true,
    });
    expect(jumped.grounded).toBe(false);
    expect(jumped.support).toBeUndefined();
    expect(jumped.supportDetached).toBe('jump');
    support.position.x += 5;
    controller.move(new Vector2(0, -1), { epoch: 3 });
    expect(controller.object.position.x).toBeCloseTo(x, 2);
    controller.move(new Vector2(0, 20), { epoch: 4 });
    world.unregister(support);
    world.register(support);
    support.position.x += 3;
    const removed = controller.move(new Vector2(0, 0.1), { epoch: 5 });
    expect(removed.supportDetached).toBe('removed');
    expect(removed.carriedDisplacement.x).toBe(0);
    controller.destroy();
    world.destroy();
  });
  it('sweeps support carry into a wall without teleporting across it and exposes unresolved crushing', () => {
    const world = new PhysicsWorld2D({ gravity: [0, 0] });
    const support = object(world, Colliders.box(40, 2), 0, 10, {
      type: 'kinematic',
    });
    const controller = character(world, 4, 0);
    controller.move(new Vector2(0, 20));
    object(world, Colliders.box(0.1, 30), 8, 0);
    support.position.x += 10;
    const result = controller.move(new Vector2(0, 0.1));
    expect(result.carryBlocked).toBe(true);
    expect(result.supportDetached).toBe('blocked');
    expect(controller.object.position.x).toBeLessThan(6.96);
    controller.destroy();
    world.destroy();
  });
  it('keeps fixed-step landing and moving/rotating support independent of the render rate', () => {
    const poses: number[][] = [];
    for (const rate of [30, 60, 144, 240]) {
      class FixedLevel extends Scene {
        readonly floor: GameObject;
        readonly player: GameObject;
        readonly character: CharacterController2D;
        speed = 0;
        constructor() {
          super();
          this.physics.gravity.set(0, 0);
          this.floor = object(this.physics, Colliders.box(80, 2), 0, 10, {
            type: 'kinematic',
          });
          this.player = object(this.physics, Colliders.box(2, 4), 3, 0, {
            type: 'kinematic',
            lockRotation: true,
          });
          this.character = new CharacterController2D(
            this.player,
            this.physics,
            { skin: 0.01, groundSnap: 0.15 },
          );
        }
        override fixedUpdate(dt: number): void {
          this.floor.position.x = Math.sin(this.fixedElapsed) * 2;
          this.floor.rotation = Math.sin(this.fixedElapsed * 0.7) * 0.08;
          this.speed += 20 * dt;
          const result = this.character.move(new Vector2(0, this.speed * dt), {
            epoch: this.fixedFrame,
          });
          if (result.grounded) this.speed = 0;
        }
      }
      const level = new FixedLevel();
      for (let i = 0; i < rate * 3; i++)
        level.advanceAfterUpdate(1 / rate, () => true);
      expect(level.character.grounded).toBe(true);
      poses.push([level.player.position.x, level.player.position.y]);
      level.character.destroy();
      level.physics.destroy();
      level.destroy();
    }
    for (const pose of poses) {
      expect(pose[0]).toBeCloseTo(poses[0]![0]!, 6);
      expect(pose[1]).toBeCloseTo(poses[0]![1]!, 6);
    }
  });
});

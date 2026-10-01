import { describe, expect, it } from 'vitest';
import { Scene } from '../packages/core/src/scene.js';
import { Object3D } from '../packages/core/src/object3d.js';
import { Vector3 } from '../packages/math/src/index.js';
import {
  PhysicsWorld3D,
  RigidBody3D,
  SphereCollider3D,
  BoxCollider3D,
  CapsuleCollider3D,
  PlaneCollider3D,
} from '../packages/core/src/physics3d/index.js';
import type {
  Collider3D,
  RigidBodyOptions3D,
  PhysicsContact3D,
} from '../packages/core/src/physics3d/index.js';

function object(
  collider: Collider3D,
  position: Readonly<Vector3> = new Vector3(),
  body?: RigidBodyOptions3D,
): Object3D {
  const object = new Object3D();
  object.position.set(position.x, position.y, position.z);
  object.collider = collider;
  if (body) object.body = new RigidBody3D(body);
  return object;
}
function advance(world: PhysicsWorld3D, seconds: number): void {
  for (let i = 0; i < Math.round(seconds / world.fixedDelta); i++)
    world.update(world.fixedDelta);
}
const shapes: readonly (() => Collider3D)[] = [
  () => new SphereCollider3D(0.5),
  () => new BoxCollider3D(new Vector3(0.5, 0.5, 0.5)),
  () => new CapsuleCollider3D(0.5, 1),
  () => new PlaneCollider3D(new Vector3(1, 0, 0)),
];

describe('bounded 3D primitive dynamics', () => {
  for (let a = 0; a < 3; a++)
    for (let b = a; b < 4; b++) {
      it(`rebounds ${['sphere', 'box', 'capsule'][a]} against ${['sphere', 'box', 'capsule', 'plane'][b]} along the primitive normal`, () => {
        const world = new PhysicsWorld3D({ gravity: new Vector3() });
        const projectile = object(shapes[a](), new Vector3(-3, 0, 0), {
          restitution: 1,
          friction: 0,
          lockRotation: true,
        });
        const target = object(shapes[b](), new Vector3(), {
          type: 'static',
          restitution: 1,
          friction: 0,
        });
        projectile.body!.velocity.x = 4;
        world.register(projectile);
        world.register(target);
        advance(world, 100 / 120);
        expect(projectile.body!.velocity.x).toBeCloseTo(-4, 5);
        expect(projectile.position.x).toBeLessThan(-1);
        expect(projectile.position.y).toBeCloseTo(0, 5);
        world.destroy();
      });
    }

  it('conserves linear momentum for an elastic unequal-mass collision', () => {
    const world = new PhysicsWorld3D({ gravity: new Vector3() });
    const a = object(new SphereCollider3D(0.5), new Vector3(-2, 0, 0), {
      mass: 1,
      restitution: 1,
      friction: 0,
    });
    const b = object(new SphereCollider3D(0.5), new Vector3(2, 0, 0), {
      mass: 3,
      restitution: 1,
      friction: 0,
    });
    a.body!.velocity.x = 6;
    world.register(a);
    world.register(b);
    advance(world, 1);
    expect(a.body!.velocity.x).toBeCloseTo(-3, 5);
    expect(b.body!.velocity.x).toBeCloseTo(3, 5);
    expect(a.body!.velocity.x + 3 * b.body!.velocity.x).toBeCloseTo(6, 5);
    expect(a.position.x).toBeLessThan(b.position.x - 1);
    world.destroy();
  });

  it('rests sphere and an angularly free box at the supported fixed step and wakes sleeping bodies', () => {
    const scene = new Scene();
    scene.add(object(new PlaneCollider3D()));
    const ball = scene.add(
      object(new SphereCollider3D(0.5), new Vector3(-2, 4, 0), {}),
    );
    const box = scene.add(
      object(
        new BoxCollider3D(new Vector3(0.5, 0.5, 0.5)),
        new Vector3(2, 4, 0),
        {},
      ),
    );
    advance(scene.physics3D, 5);
    expect(ball.position.y).toBeCloseTo(0.5, 2);
    expect(box.position.y).toBeCloseTo(0.5, 2);
    expect(ball.body!.isSleeping).toBe(true);
    expect(box.body!.isSleeping).toBe(true);
    ball.body!.applyImpulse(new Vector3(0, 2, 0));
    scene.physics3D.update(1 / 120);
    expect(ball.body!.isSleeping).toBe(false);
    expect(ball.position.y).toBeGreaterThan(0.5);
    box.position.y += 1;
    expect(box.body!.isSleeping).toBe(false);
    scene.destroy();
  });

  it('keeps a three-box dynamic manifold stack supported and asleep', () => {
    const scene = new Scene();
    scene.add(object(new PlaneCollider3D()));
    const stack = [0, 1, 2].map((i) =>
      scene.add(
        object(
          new BoxCollider3D(new Vector3(0.5, 0.5, 0.5)),
          new Vector3(0, 1.2 + i * 1.2, 0),
          {},
        ),
      ),
    );
    advance(scene.physics3D, 10);
    for (let i = 0; i < stack.length; i++) {
      expect(Math.abs(stack[i].position.y - (0.5 + i))).toBeLessThan(0.04);
      expect(Math.abs(stack[i].position.x)).toBeLessThan(0.08);
      expect(Math.abs(stack[i].position.z)).toBeLessThan(0.08);
      expect(stack[i].body!.isSleeping).toBe(true);
    }
    scene.destroy();
  });

  for (const change of ['remove', 'separate'] as const) {
    it(`wakes a sleeping stack and lets it fall after support ${change === 'remove' ? 'removal' : 'separation'}`, () => {
      const scene = new Scene();
      const floor = scene.add(object(new PlaneCollider3D()));
      const stack = [0, 1, 2].map((i) =>
        scene.add(
          object(
            new BoxCollider3D(new Vector3(0.5, 0.5, 0.5)),
            new Vector3(0, 1.2 + i * 1.2, 0),
            {},
          ),
        ),
      );
      advance(scene.physics3D, 10);
      for (const box of stack) expect(box.body!.isSleeping).toBe(true);
      const heights = stack.map((box) => box.position.y);
      let ends = 0,
        awakeOnEnd = false;
      stack[0].addEventListener('collisionend', () => {
        ends++;
        awakeOnEnd = !stack[0].body!.isSleeping;
      });
      if (change === 'remove') scene.remove(floor);
      else {
        floor.position.y = -10;
        scene.physics3D.update(scene.physics3D.fixedDelta);
      }
      expect(ends).toBe(1);
      expect(awakeOnEnd).toBe(true);
      advance(scene.physics3D, 0.5);
      for (let i = 0; i < stack.length; i++) {
        expect(stack[i].body!.isSleeping).toBe(false);
        expect(stack[i].position.y).toBeLessThan(heights[i] - 0.25);
      }
      scene.destroy();
      floor.destroy();
    });
  }

  it('transfers off-center collision momentum into angular motion and dissipates floor slip', () => {
    const world = new PhysicsWorld3D({ gravity: new Vector3() });
    const target = object(
      new BoxCollider3D(new Vector3(0.5, 1, 0.5)),
      new Vector3(),
      { mass: 2, friction: 0 },
    );
    const bullet = object(new SphereCollider3D(0.3), new Vector3(-3, 0.7, 0), {
      friction: 0,
    });
    bullet.body!.velocity.x = 8;
    world.register(target);
    world.register(bullet);
    advance(world, 50 / 120);
    expect(target.body!.angularVelocity.z).toBeLessThan(-0.5);
    expect(target.body!.velocity.x).toBeGreaterThan(1);
    world.destroy();
    const scene = new Scene();
    scene.add(object(new PlaneCollider3D()));
    const box = scene.add(
      object(
        new BoxCollider3D(new Vector3(0.4, 0.4, 0.4)),
        new Vector3(0, 0.4, 0),
        { friction: 1, lockRotation: true },
      ),
    );
    box.body!.velocity.x = 3;
    advance(scene.physics3D, 1);
    expect(Math.abs(box.body!.velocity.x)).toBeLessThan(0.1);
    expect(box.position.x).toBeLessThan(1);
    scene.destroy();
  });

  it('integrates force and eccentric impulse using mass and oriented inertia', () => {
    const world = new PhysicsWorld3D({ gravity: new Vector3() });
    const box = object(
      new BoxCollider3D(new Vector3(0.3, 0.3, 0.3)),
      new Vector3(5, 3, 0),
      { mass: 2 },
    );
    world.register(box);
    box.body!.applyForce(new Vector3(24, 0, 0));
    world.update(1 / 240);
    expect(box.position.x).toBe(5);
    world.update(1 / 240);
    expect(box.body!.velocity.x).toBeCloseTo(0.1, 6);
    box.body!.applyImpulse(
      new Vector3(2, 0, 0),
      new Vector3(box.position.x, 3.3, 0),
    );
    expect(box.body!.velocity.x).toBeCloseTo(1.1, 6);
    expect(box.body!.angularVelocity.z).toBeCloseTo(-5, 5);
    world.update(1 / 120);
    expect(box.rotation.z).toBeLessThan(0);
    world.destroy();
  });

  it('clips rotated box faces rather than responding to world AABBs', () => {
    const world = new PhysicsWorld3D({ gravity: new Vector3() });
    const wall = object(
      new BoxCollider3D(new Vector3(3, 0.25, 0.5)),
      new Vector3(),
      { type: 'static', restitution: 1, friction: 0 },
    );
    wall.rotation.setFromEuler(0, 0, Math.PI / 4);
    const normal = new Vector3(-Math.SQRT1_2, Math.SQRT1_2, 0);
    const moving = object(
      new BoxCollider3D(new Vector3(0.5, 0.5, 0.5)),
      normal.clone().scale(3),
      { restitution: 1, friction: 0, lockRotation: true },
    );
    moving.rotation.copy(wall.rotation);
    moving.body!.velocity.copy(normal).scale(-4);
    let detail: PhysicsContact3D | undefined;
    moving.addEventListener('collisionstart', (event) => {
      detail = (event as CustomEvent<PhysicsContact3D>).detail;
    });
    world.register(moving);
    world.register(wall);
    advance(world, 1);
    expect(detail!.normal.x).toBeCloseTo(normal.x, 5);
    expect(detail!.normal.y).toBeCloseTo(normal.y, 5);
    expect(moving.body!.velocity.x).toBeCloseTo(normal.x * 4, 4);
    expect(moving.body!.velocity.y).toBeCloseTo(normal.y * 4, 4);
    world.destroy();
  });

  it('integrates root kinematic motion with infinite mass and wakes a contacted dynamic body', () => {
    const world = new PhysicsWorld3D({ gravity: new Vector3() });
    const platform = object(
      new BoxCollider3D(new Vector3(0.5, 0.5, 0.5)),
      new Vector3(-2, 0, 0),
      { type: 'kinematic' },
    );
    const target = object(
      new BoxCollider3D(new Vector3(0.5, 0.5, 0.5)),
      new Vector3(),
      { lockRotation: true },
    );
    platform.body!.velocity.x = 2;
    world.register(platform);
    world.register(target);
    advance(world, 1);
    expect(platform.position.x).toBeCloseTo(0, 5);
    expect(platform.body!.velocity.x).toBe(2);
    expect(target.position.x).toBeGreaterThan(0.8);
    expect(target.body!.velocity.x).toBeGreaterThan(1.9);
    world.destroy();
  });

  for (const type of ['kinematic', 'dynamic'] as const) {
    it(`wakes and moves a sleeping body contacted by an angular-only ${type} body`, () => {
      const world = new PhysicsWorld3D({ gravity: new Vector3() });
      const rotating = object(
        new BoxCollider3D(new Vector3(1, 0.5, 0.5)),
        new Vector3(),
        { type, friction: 0 },
      );
      const target = object(
        new SphereCollider3D(0.25),
        new Vector3(0.8, 0.75, 0),
        { friction: 0, lockRotation: true },
      );
      world.register(rotating);
      world.register(target);
      advance(world, 1);
      expect(target.body!.isSleeping).toBe(true);
      const height = target.position.y;
      rotating.body!.angularVelocity.z = 2;
      expect(rotating.body!.velocity.length()).toBe(0);
      world.update(world.fixedDelta);
      expect(target.body!.isSleeping).toBe(false);
      expect(target.body!.velocity.y).toBeGreaterThan(0.1);
      advance(world, 0.1);
      expect(target.position.y).toBeGreaterThan(height + 0.02);
      world.destroy();
    });
  }

  it('keeps a sleeper still when rotation has zero velocity at its contact point', () => {
    const world = new PhysicsWorld3D({ gravity: new Vector3() });
    const rotating = object(new SphereCollider3D(0.5), new Vector3(), {
      type: 'kinematic',
    });
    const target = object(new SphereCollider3D(0.5), new Vector3(1, 0, 0), {});
    world.register(rotating);
    world.register(target);
    advance(world, 1);
    expect(target.body!.isSleeping).toBe(true);
    rotating.body!.angularVelocity.x = 2;
    advance(world, 1);
    expect(target.body!.isSleeping).toBe(true);
    expect(target.position.x).toBe(1);
    expect(target.position.y).toBe(0);
    expect(target.position.z).toBe(0);
    world.destroy();
  });

  it('freezes paused dynamics and contacts without accumulating catch-up time', () => {
    const scene = new Scene();
    const floor = scene.add(object(new PlaneCollider3D()));
    const resting = scene.add(
      object(new SphereCollider3D(0.5), new Vector3(0, 0.5, 0), {
        gravityScale: 0,
      }),
    );
    const moving = scene.add(
      object(new SphereCollider3D(0.5), new Vector3(3, 2, 0), {
        gravityScale: 0,
      }),
    );
    moving.body!.velocity.x = 1;
    let ended = 0;
    floor.addEventListener('collisionend', () => ended++);
    const world = scene.physics3D;
    world.update(world.fixedDelta);
    const x = moving.position.x,
      y = resting.position.y;
    world.update(world.fixedDelta / 2);
    world.enabled = false;
    world.update(120);
    expect(moving.position.x).toBe(x);
    expect(resting.position.y).toBe(y);
    expect(ended).toBe(0);
    world.enabled = true;
    world.update(world.fixedDelta / 2);
    expect(moving.position.x).toBeCloseTo(x + world.fixedDelta, 8);
    expect(ended).toBe(0);
    scene.destroy();
  });
});

describe('3D shape queries and ownership', () => {
  it('reports transformed nested box distance and geometric world normal', () => {
    const scene = new Scene();
    const parent = new Object3D();
    parent.position.set(10, 1, 0);
    parent.rotation.setFromEuler(0, 0, Math.PI / 4);
    const box = object(new BoxCollider3D(new Vector3(1, 0.25, 0.5)));
    parent.add(box);
    scene.add(parent);
    const hit = scene.physics3D.raycast(
      new Vector3(10, 4, 0),
      new Vector3(0, -3, 0),
      10,
    )!;
    expect(hit.object).toBe(box);
    expect(hit.distance).toBeCloseTo(3 - 0.25 * Math.SQRT2, 4);
    expect(hit.normal.x).toBeCloseTo(-Math.SQRT1_2, 5);
    expect(hit.normal.y).toBeCloseTo(Math.SQRT1_2, 5);
    expect(hit.point.y).toBeCloseTo(1 + 0.25 * Math.SQRT2, 4);
    scene.destroy();
  });

  it('sweeps rounded box corners and excludes false AABB overlaps', () => {
    const world = new PhysicsWorld3D();
    const box = object(new BoxCollider3D(new Vector3(1, 1, 1)));
    world.register(box);
    const hit = world.sweepSphere(
      new Vector3(-2, 1.4, 0),
      0.5,
      new Vector3(4, 0, 0),
    )!;
    expect(hit.distance).toBeCloseTo(0.7, 3);
    expect(hit.normal.x).toBeCloseTo(-0.6, 3);
    expect(hit.normal.y).toBeCloseTo(0.8, 3);
    const probe = object(new SphereCollider3D(0.5), new Vector3(1.4, 1.4, 0));
    expect(world.overlap(probe.collider!, probe)).toEqual([]);
    probe.position.set(1.3, 1.3, 0);
    const overlap = world.overlap(probe.collider!, probe);
    expect(overlap[0].object).toBe(box);
    expect(overlap[0].normal.x).toBeCloseTo(Math.SQRT1_2, 5);
    world.destroy();
  });

  it('raycasts capsule cylinder and hemispheres, including transformed orientation', () => {
    const world = new PhysicsWorld3D();
    const capsule = object(new CapsuleCollider3D(0.5, 1));
    world.register(capsule);
    const side = world.raycast(
      new Vector3(3, 0, 0),
      new Vector3(-1, 0, 0),
      10,
    )!;
    expect(side.distance).toBeCloseTo(2.5, 4);
    expect(side.normal.x).toBeCloseTo(1, 5);
    const end = world.raycast(new Vector3(0, 3, 0), new Vector3(0, -1, 0), 10)!;
    expect(end.distance).toBeCloseTo(2, 4);
    expect(end.normal.y).toBeCloseTo(1, 5);
    capsule.rotation.setFromEuler(0, 0, Math.PI / 2);
    const rotated = world.raycast(
      new Vector3(3, 0, 0),
      new Vector3(-1, 0, 0),
      10,
    )!;
    expect(rotated.distance).toBeCloseTo(2, 4);
    expect(rotated.normal.x).toBeCloseTo(1, 5);
    world.destroy();
  });

  it('applies reciprocal collision filters and opt-in sensor queries without sensor impulses', () => {
    const scene = new Scene();
    const trigger = scene.add(
      object(
        new BoxCollider3D(new Vector3(0.5, 1, 1), {
          sensor: true,
          category: 2,
          mask: 1,
        }),
      ),
    );
    const ball = scene.add(
      object(
        new SphereCollider3D(0.25, { category: 1, mask: 2 }),
        new Vector3(-1, 0, 0),
        { gravityScale: 0 },
      ),
    );
    let starts = 0,
      ends = 0;
    trigger.addEventListener('collisionstart', () => starts++);
    trigger.addEventListener('collisionend', () => ends++);
    ball.body!.velocity.x = 2;
    advance(scene.physics3D, 1);
    expect(ball.body!.velocity.x).toBe(2);
    expect(ball.position.x).toBeCloseTo(1, 4);
    expect(starts).toBe(1);
    expect(ends).toBe(1);
    const rayOrigin = new Vector3(0, 3, 0),
      rayDirection = new Vector3(0, -1, 0);
    expect(
      scene.physics3D.raycast(rayOrigin, rayDirection, 10, { mask: 2 }),
    ).toBeUndefined();
    expect(
      scene.physics3D.raycast(rayOrigin, rayDirection, 10, {
        mask: 2,
        includeSensors: true,
      })!.object,
    ).toBe(trigger);
    scene.destroy();
  });

  for (const change of ['remove', 'separate'] as const) {
    it(`does not wake a sleeping dynamic on sensor contact ${change === 'remove' ? 'removal' : 'separation'}`, () => {
      const scene = new Scene();
      const sensor = scene.add(
        object(new BoxCollider3D(new Vector3(0.5, 0.5, 0.5), { sensor: true })),
      );
      const target = scene.add(
        object(new SphereCollider3D(0.25), new Vector3(), { gravityScale: 0 }),
      );
      let ends = 0;
      target.addEventListener('collisionend', () => ends++);
      advance(scene.physics3D, 1);
      expect(target.body!.isSleeping).toBe(true);
      if (change === 'remove') scene.remove(sensor);
      else {
        sensor.position.x = 3;
        scene.physics3D.update(scene.physics3D.fixedDelta);
      }
      expect(ends).toBe(1);
      expect(target.body!.isSleeping).toBe(true);
      advance(scene.physics3D, 0.5);
      expect(target.body!.isSleeping).toBe(true);
      expect(target.position.x).toBe(0);
      expect(target.position.y).toBe(0);
      expect(target.position.z).toBe(0);
      scene.destroy();
      sensor.destroy();
    });
  }

  it('rolls back invalid body/collider attachments and parent changes without losing prior contacts', () => {
    const scene = new Scene();
    const plane = scene.add(object(new PlaneCollider3D()));
    const ball = scene.add(
      object(new SphereCollider3D(0.5), new Vector3(0, 0.5, 0), {}),
    );
    advance(scene.physics3D, 0.1);
    const previous = ball.collider;
    let ended = 0;
    plane.addEventListener('collisionend', () => ended++);
    expect(() => {
      ball.collider = new PlaneCollider3D();
    }).toThrow();
    expect(ball.collider).toBe(previous);
    expect(scene.physics3D.has(ball)).toBe(true);
    expect(ended).toBe(0);
    const parent = scene.add(new Object3D());
    expect(() => parent.add(ball)).toThrow();
    expect(ball.parent).toBeUndefined();
    const shared = new RigidBody3D();
    const owner = new Object3D();
    owner.body = shared;
    expect(() => {
      ball.body = shared;
    }).toThrow();
    expect(shared.owner).toBe(owner);
    const staticSphere = scene.add(
      object(new SphereCollider3D(0.5), new Vector3(2, 0, 0)),
    );
    const old = staticSphere.collider;
    staticSphere.scale.set(1, 2, 1);
    expect(() => {
      staticSphere.collider = new CapsuleCollider3D(0.5, 1);
    }).toThrow();
    expect(staticSphere.collider).toBe(old);
    staticSphere.scale.set(1, 1, 1);
    scene.destroy();
    owner.destroy();
    expect(shared.owner).toBeUndefined();
  });

  it('rejects nested shear and nonuniform rounded scaling before hierarchy mutation', () => {
    const parent = new Object3D();
    parent.scale.set(2, 1, 1);
    const box = object(new BoxCollider3D(new Vector3(1, 1, 1)));
    box.rotation.setFromEuler(0, 0, Math.PI / 4);
    expect(() => parent.add(box)).toThrow();
    expect(box.parent).toBeUndefined();
    const sphere = object(new SphereCollider3D(1));
    expect(() => parent.add(sphere)).toThrow();
    expect(sphere.parent).toBeUndefined();
    parent.destroy();
    box.destroy();
    sphere.destroy();
  });

  it('ends a removed contact once, preserves stable snapshots, and clears Scene destroy registrations', () => {
    const scene = new Scene();
    const floor = scene.add(object(new PlaneCollider3D()));
    const ball = scene.add(
      object(new SphereCollider3D(0.5), new Vector3(0, 0.5, 0), {}),
    );
    let start: PhysicsContact3D | undefined,
      ends = 0;
    floor.addEventListener('collisionstart', (event) => {
      start = (event as CustomEvent<PhysicsContact3D>).detail;
    });
    floor.addEventListener('collisionend', () => ends++);
    advance(scene.physics3D, 0.2);
    expect(start!.other).toBe(ball);
    const y = start!.point.y;
    ball.position.set(3, 2, 0);
    scene.remove(ball);
    expect(ends).toBe(1);
    expect(start!.point.y).toBe(y);
    expect(
      scene.physics3D.raycast(new Vector3(3, 4, 0), new Vector3(0, -1, 0), 10)!
        .object,
    ).toBe(floor);
    scene.add(ball);
    ball.position.set(0, 0.5, 0);
    scene.physics3D.update(1 / 120);
    ball.destroy();
    expect(ends).toBe(2);
    scene.destroy();
    expect(scene.physics3D.size).toBe(0);
    expect(floor.destroyed).toBe(true);
  });

  it('wakes before collision-end callbacks and tolerates reentrant survivor removal', () => {
    const scene = new Scene();
    const floor = scene.add(object(new PlaneCollider3D()));
    const target = scene.add(
      object(new SphereCollider3D(0.5), new Vector3(0, 0.5, 0), {}),
    );
    advance(scene.physics3D, 2);
    expect(target.body!.isSleeping).toBe(true);
    let ends = 0,
      awakeOnEnd = false;
    target.addEventListener('collisionend', () => {
      ends++;
      awakeOnEnd = !target.body!.isSleeping;
      scene.remove(target);
      scene.physics3D.unregister(floor);
    });
    scene.remove(floor);
    expect(ends).toBe(1);
    expect(awakeOnEnd).toBe(true);
    expect(scene.physics3D.size).toBe(0);
    scene.destroy();
    floor.destroy();
    target.destroy();
  });

  it('keeps sleepers inert while world teardown ends contacts reentrantly', () => {
    const world = new PhysicsWorld3D();
    const floor = object(new PlaneCollider3D());
    const target = object(
      new SphereCollider3D(0.5),
      new Vector3(0, 0.5, 0),
      {},
    );
    world.register(floor);
    world.register(target);
    advance(world, 2);
    expect(target.body!.isSleeping).toBe(true);
    let ends = 0;
    target.addEventListener('collisionend', () => {
      ends++;
      world.destroy();
      world.unregister(target);
    });
    world.destroy();
    expect(ends).toBe(1);
    expect(world.size).toBe(0);
    expect(target.body!.isSleeping).toBe(true);
    floor.destroy();
    target.destroy();
  });

  it('guards collision-start teardown so stale pairs never receive impulses or a later start', () => {
    const scene = new Scene();
    const a = scene.add(
      object(new SphereCollider3D(1), new Vector3(), { gravityScale: 0 }),
    );
    const b = scene.add(
      object(new SphereCollider3D(1), new Vector3(1.5, 0, 0), {
        gravityScale: 0,
      }),
    );
    let starts = 0,
      ends = 0;
    b.addEventListener('collisionstart', () => starts++);
    b.addEventListener('collisionend', () => ends++);
    a.addEventListener('collisionstart', () => scene.remove(a));
    scene.physics3D.update(1 / 120);
    expect(starts).toBe(0);
    expect(ends).toBe(1);
    expect(b.body!.velocity.x).toBe(0);
    expect(b.position.x).toBe(1.5);
    scene.destroy();
    a.destroy();
  });
});

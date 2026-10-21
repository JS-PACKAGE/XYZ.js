import { expect, it } from 'vitest';
import { Scene } from '../packages/core/src/scene.js';
import { Object3D } from '../packages/core/src/object3d.js';
import { Vector3 } from '../packages/math/src/index.js';
import {
  SphereCollider3D,
  BoxCollider3D,
  RigidBody3D,
} from '../packages/core/src/physics3d/index.js';
import {
  Bounds3D,
  SpatialIndex3D,
} from '../packages/core/src/physics3d/spatial.js';

it('refits mutable static transforms and removes stale query/solver leaves', () => {
  const scene = new Scene();
  const target = scene.add(new Object3D());
  target.collider = new BoxCollider3D(new Vector3(0.5, 0.5, 0.5));
  expect(
    scene.physics3D.raycast(new Vector3(-3, 0, 0), new Vector3(1, 0, 0), 6)
      ?.object,
  ).toBe(target);
  target.position.y = 5;
  expect(
    scene.physics3D.raycast(new Vector3(-3, 0, 0), new Vector3(1, 0, 0), 6),
  ).toBeUndefined();
  target.position.y = 0;
  scene.remove(target);
  expect(
    scene.physics3D.raycast(new Vector3(-3, 0, 0), new Vector3(1, 0, 0), 6),
  ).toBeUndefined();
  scene.add(target);
  expect(
    scene.physics3D.raycast(new Vector3(-3, 0, 0), new Vector3(1, 0, 0), 6)
      ?.object,
  ).toBe(target);
  scene.destroy();
});
it('matches isolated shape queries while rejecting spatially distant pairs', () => {
  const scene = new Scene();
  const objects: Object3D[] = [];
  for (let i = 0; i < 64; i++) {
    const o = new Object3D();
    o.collider = new SphereCollider3D(0.5);
    o.position.set(i * 4, 0, 0);
    o.body = new RigidBody3D({ gravityScale: 0 });
    objects.push(scene.add(o));
  }
  scene.physics3D.update(scene.physics3D.fixedDelta);
  expect(scene.physics3D.stats.candidatePairs).toBe(0);
  const query = new Object3D();
  query.position.set(20, 0, 0);
  expect(
    scene.physics3D
      .overlap(new SphereCollider3D(0.6), query)
      .map((h) => h.object),
  ).toEqual([objects[5]]);
  expect(scene.physics3D.stats.queryCandidates).toBe(1);
  expect(
    scene.physics3D.sweepSphere(
      new Vector3(17, 0, 0),
      0.25,
      new Vector3(6, 0, 0),
    )?.distance,
  ).toBeCloseTo(2.25, 3);
  scene.destroy();
  expect(scene.physics3D.size).toBe(0);
});

it('pairs earlier static and sensor colliders with later bodies without counting static-static overlaps', () => {
  const scene = new Scene();
  const place = (o: Object3D, x: number) => {
    o.position.set(x, 0, 0);
    return scene.add(o);
  };
  const floor = new Object3D();
  floor.collider = new BoxCollider3D(new Vector3(1, 1, 1));
  place(floor, 0);
  // Overlapping static neighbours of the floor, never a contact pair.
  for (const x of [0.5, 1, 1.5]) {
    const o = new Object3D();
    o.collider = new BoxCollider3D(new Vector3(1, 1, 1));
    place(o, x);
  }
  const zone = new Object3D();
  zone.collider = new SphereCollider3D(1, { sensor: true });
  place(zone, 6);
  const ball = new Object3D();
  ball.collider = new SphereCollider3D(0.5);
  ball.body = new RigidBody3D({ gravityScale: 0 });
  place(ball, -1.2);
  const probe = new Object3D();
  probe.collider = new SphereCollider3D(0.5);
  probe.body = new RigidBody3D({ gravityScale: 0 });
  place(probe, 6.5);
  const started: string[] = [];
  floor.addEventListener('collisionstart', () => started.push('floor'));
  zone.addEventListener('collisionstart', () => started.push('zone'));
  scene.physics3D.update(scene.physics3D.fixedDelta);
  expect(started.sort()).toEqual(['floor', 'zone']);
  expect(scene.physics3D.stats.candidatePairs).toBe(2);
  scene.destroy();
});

it('refreshes static poses after any transform input or ancestor change', () => {
  const scene = new Scene();
  const bar = scene.add(new Object3D());
  bar.collider = new BoxCollider3D(new Vector3(2, 0.1, 0.1));
  const hit = () =>
    scene.physics3D.raycast(new Vector3(1.5, 3, 0), new Vector3(0, -1, 0), 6)
      ?.object;
  expect(hit()).toBe(bar);
  bar.rotation.setFromEuler(0, Math.PI / 2, 0);
  expect(hit()).toBeUndefined();
  bar.rotation.setFromEuler(0, 0, 0);
  expect(hit()).toBe(bar);
  bar.scale.set(0.5, 1, 1);
  expect(hit()).toBeUndefined();
  bar.scale.set(1, 1, 1);
  bar.position.z = 1;
  expect(hit()).toBeUndefined();
  bar.position.z = 0;
  expect(hit()).toBe(bar);
  const holder = scene.add(new Object3D());
  holder.add(bar);
  holder.position.x = 10;
  expect(hit()).toBeUndefined();
  holder.position.x = 0;
  expect(hit()).toBe(bar);
  scene.destroy();
});

it('finds the same contact pairs whether bodies are a minority or a majority of colliders', () => {
  const contacts = (distantStatics: number) => {
    const scene = new Scene();
    const add = (x: number, collider: SphereCollider3D | BoxCollider3D) => {
      const o = new Object3D();
      o.position.set(x, 0, 0);
      o.collider = collider;
      return scene.add(o);
    };
    const floor = add(0, new BoxCollider3D(new Vector3(1, 1, 1)));
    for (const x of [0.5, 1, 1.5])
      add(x, new BoxCollider3D(new Vector3(1, 1, 1)));
    for (let i = 0; i < distantStatics; i++)
      add(100 + i * 3, new BoxCollider3D(new Vector3(1, 1, 1)));
    const zone = add(6, new SphereCollider3D(1, { sensor: true }));
    for (const x of [-1.2, 6.5, 6.9]) {
      const ball = add(x, new SphereCollider3D(0.5));
      ball.body = new RigidBody3D({ gravityScale: 0 });
    }
    const started: string[] = [];
    floor.addEventListener('collisionstart', () => started.push('floor'));
    zone.addEventListener('collisionstart', () => started.push('zone'));
    scene.physics3D.update(scene.physics3D.fixedDelta);
    const result = {
      started: started.sort(),
      pairs: scene.physics3D.stats.candidatePairs,
    };
    scene.destroy();
    return result;
  };
  // Floor-ball, zone with two balls, and the two touching balls.
  const expected = { started: ['floor', 'zone', 'zone'], pairs: 4 };
  expect(contacts(0)).toEqual(expected);
  expect(contacts(40)).toEqual(expected);
});

it('pairs each overlapping leaf pair with an active side once, as per-item queries would', () => {
  let seed = 7;
  const random = () => {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    return seed / 4294967296;
  };
  const items = Array.from({ length: 160 }, (_, order) => {
    const bounds = new Bounds3D();
    const size = 0.2 + random() * 3;
    const x = random() * 40,
      y = random() * 4,
      z = random() * 40;
    bounds.add(new Vector3(x, y, z));
    bounds.add(new Vector3(x + size, y + size, z + size));
    return { bounds, order, active: random() < 0.4 };
  });
  // An unbounded leaf, like a plane, overlaps everything.
  items[3]!.bounds.min.set(-Infinity, -Infinity, -Infinity);
  items[3]!.bounds.max.set(Infinity, 0, Infinity);
  items[3]!.active = false;
  const index = new SpatialIndex3D<(typeof items)[number]>();
  index.rebuild(items);
  const margin = 0.004;
  const check = () => {
    const firsts: (typeof items)[number][] = [],
      seconds: (typeof items)[number][] = [];
    index.pairs((item) => item.active, margin, firsts, seconds);
    const found = firsts
      .map((a, i) => [a.order, seconds[i]!.order].sort((p, q) => p - q).join())
      .sort();
    const expected: string[] = [];
    for (const a of items)
      for (const b of items)
        if (
          a.order < b.order &&
          (a.active || b.active) &&
          b.bounds.overlaps(a.bounds, margin)
        )
          expected.push(`${a.order},${b.order}`);
    expect(found).toEqual(expected.sort());
    // Pairs with no active side are left out.
    expect(expected.length).toBeGreaterThan(20);
  };
  check();
  for (const item of items.slice(0, 50)) {
    item.bounds.min.x += 9;
    item.bounds.max.x += 9;
    index.update(item);
  }
  check();
});

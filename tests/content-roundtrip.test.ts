import { describe, expect, expectTypeOf, it } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import {
  buildContentScene,
  rebuildContentScene,
  type ContentSceneDefinition,
} from '../packages/core/src/content.js';
import {
  defineFactory,
  FactoryRegistry,
} from '../packages/core/src/factories.js';
import { GameObject } from '../packages/core/src/game-object.js';
import { Object3D } from '../packages/core/src/object3d.js';
import { RigidBody3D } from '../packages/core/src/physics3d/body.js';
import { SphereCollider3D } from '../packages/core/src/physics3d/collider.js';
import { RigidBody2D } from '../packages/core/src/physics2d/body.js';
import { Colliders } from '../packages/core/src/physics2d/index.js';
import { Vector2, Vector3 } from '../packages/math/src/index.js';
import { Scene } from '../packages/core/src/scene.js';
import { SceneObject } from '../packages/core/src/scene-object.js';
import {
  Serializer,
  sceneObjectState,
  type Serializable,
} from '../packages/core/src/serialization.js';
import { Sprite } from '../packages/core/src/sprite.js';
import type { JsonValue } from '../packages/core/src/storage.js';

interface Options {
  value: number;
}
function parseOptions(value: unknown): Options {
  if (
    !value ||
    typeof value !== 'object' ||
    !('value' in value) ||
    typeof value.value !== 'number' ||
    !Number.isFinite(value.value)
  )
    throw new TypeError('Invalid authored options.');
  return { value: value.value };
}
class Prefab extends Object3D {
  readonly arm = this.add(new Object3D());
  readonly hand = this.arm.add(new Object3D());
}
class Linked extends GameObject {
  score = 0;
  constructor(readonly target: SceneObject) {
    super();
  }
}
class Counter extends SceneObject {
  value = 0;
}
function counterState(node: Counter): Serializable {
  return {
    serialize: () => node.value,
    restore(value) {
      if (typeof value !== 'number' || !Number.isInteger(value))
        throw new TypeError('Invalid counter state.');
      node.value = value;
    },
  };
}
function createRegistry(created: SceneObject[] = []) {
  return new FactoryRegistry({
    group: defineFactory({
      parse: parseOptions,
      create(options: Options) {
        const node = new GameObject();
        node.position.x = options.value;
        created.push(node);
        return node;
      },
    }),
    body: defineFactory({
      parse: parseOptions,
      create(options: Options) {
        const node = new Object3D();
        node.position.z = options.value;
        node.body = new RigidBody3D();
        created.push(node);
        return node;
      },
    }),
    prefab: defineFactory({
      parse: parseOptions,
      create(options: Options) {
        const node = new Prefab();
        node.position.x = options.value;
        created.push(node, node.arm, node.hand);
        return node;
      },
      children: (node: Prefab) => ({ arm: node.arm, hand: node.hand }),
    }),
    linked: defineFactory({
      parse: parseOptions,
      create(_options: Options, context) {
        const node = new Linked(context.reference('target'));
        created.push(node);
        return node;
      },
      state(node: Linked) {
        return sceneObjectState(node, {
          serialize: () => node.score,
          restore(value) {
            if (typeof value !== 'number')
              throw new TypeError('Invalid score.');
            node.score = value;
          },
        });
      },
    }),
    counter: defineFactory({
      parse: parseOptions,
      create(options: Options) {
        const node = new Counter();
        node.value = options.value;
        created.push(node);
        return node;
      },
      state: counterState,
    }),
  });
}
const options = { value: 0 };

describe('factory-authored content snapshots', () => {
  it('rebuilds mixed dimensional hierarchies, named nested prefab members and cross-dimensional references from JSON', async () => {
    const registry = createRegistry();
    const definition = {
      version: 1,
      nodes: [
        { id: 'hud', kind: 'group', options },
        { id: 'label', kind: 'group', options, parent: 'hud' },
        {
          id: 'actor',
          kind: 'prefab',
          options,
          children: { arm: 'actor-arm', hand: 'actor-hand' },
        },
        {
          id: 'link',
          kind: 'linked',
          options,
          parent: 'hud',
          references: { target: 'actor-hand' },
        },
        { id: 'body', kind: 'body', options },
        { id: 'counter', kind: 'counter', options },
      ],
    } as const satisfies ContentSceneDefinition<typeof registry.definitions>;
    const original = await buildContentScene(registry, definition, undefined);
    original.get('hud')!.position.set(10, 20);
    original.get('label')!.skew.set(0.2, -0.1);
    original.get('label')!.opacity = 0.4;
    original.get('link')!.score = 37;
    original.get('counter')!.value = 12;
    original.get('actor')!.hand.position.set(1, 2, 3);
    original.get('actor')!.arm.visible = false;
    const body = original.get('body')!;
    body.position.set(4, 5, 6);
    body.rotation.set(0, 0.6, 0, 0.8);
    body.scale.set(2, 3, 4);
    body.body!.velocity.set(7, 8, 9);
    body.body!.angularVelocity.set(1, 2, 3);
    body.body!.force.set(4, 5, 6);
    body.body!.torque.set(7, 8, 9);
    body.body!.mass = 3;
    body.body!.friction = 0.7;
    body.body!.gravityScale = -0.5;
    const restored = await rebuildContentScene(
      registry,
      JSON.parse(JSON.stringify(original.capture())),
      undefined,
    );
    const restoredActor = restored.require('actor', 'prefab');
    const restoredBody = restored.require('body', 'body');
    expect(restoredActor).not.toBe(original.get('actor'));
    expect(restored.getById('actor-hand')).toBe(restoredActor.hand);
    expect(restoredActor.hand.parent).toBe(restoredActor.arm);
    expect(restoredActor.hand.position).toMatchObject({ x: 1, y: 2, z: 3 });
    expect(restoredActor.arm.visible).toBe(false);
    expect(restored.require('link', 'linked').target).toBe(restoredActor.hand);
    expect(restored.require('link', 'linked').score).toBe(37);
    expect(restored.require('link', 'linked').parent).toBe(
      restored.require('hud', 'group'),
    );
    expect(restored.require('label', 'group').skew).toMatchObject({
      x: 0.2,
      y: -0.1,
    });
    expect(restored.require('label', 'group').opacity).toBe(0.4);
    expect(restored.require('counter', 'counter').value).toBe(12);
    expect(restoredBody.position).toMatchObject({ x: 4, y: 5, z: 6 });
    expect(restoredBody.rotation).toMatchObject({ x: 0, y: 0.6, z: 0, w: 0.8 });
    expect(restoredBody.scale).toMatchObject({ x: 2, y: 3, z: 4 });
    expect(restoredBody.body!.velocity).toMatchObject({ x: 7, y: 8, z: 9 });
    expect(restoredBody.body!.angularVelocity).toMatchObject({
      x: 1,
      y: 2,
      z: 3,
    });
    expect(restoredBody.body!.force).toMatchObject({ x: 4, y: 5, z: 6 });
    expect(restoredBody.body!.torque).toMatchObject({ x: 7, y: 8, z: 9 });
    expect(restoredBody.body!.mass).toBe(3);
    expect(restoredBody.body!.friction).toBe(0.7);
    expect(restoredBody.body!.gravityScale).toBe(-0.5);
    original.destroy();
    restored.destroy();
  });

  it('captures dynamic spawn/removal, prefab child tombstones and reparented stable child topology', async () => {
    const registry = createRegistry();
    const content = await buildContentScene(
      registry,
      {
        version: 1,
        nodes: [
          { id: 'old', kind: 'group', options },
          {
            id: 'actor',
            kind: 'prefab',
            options,
            children: { arm: 'arm', hand: 'hand' },
          },
          {
            id: 'other',
            kind: 'prefab',
            options,
            children: { arm: 'other-arm', hand: 'other-hand' },
          },
        ],
      },
      undefined,
    );
    const spawned = await content.spawn({
      id: 'new',
      kind: 'group',
      options: { value: 2 },
      parent: 'old',
    });
    expectTypeOf(spawned).toEqualTypeOf<GameObject>();
    spawned.position.y = 8;
    // Reparented named members retain their factory identity as well as their current parent.
    content
      .require('other', 'prefab')
      .add(content.require('actor', 'prefab').arm);
    expect(content.remove('hand')).toBe(true);
    expect(content.getById('hand')).toBeUndefined();
    const snapshot = content.capture();
    const rebuilt = await rebuildContentScene(
      registry,
      JSON.parse(JSON.stringify(snapshot)),
      undefined,
    );
    expect(rebuilt.getById('hand')).toBeUndefined();
    expect(rebuilt.require('actor', 'prefab').hand.destroyed).toBe(true);
    expect(rebuilt.getById('arm')).toBe(rebuilt.require('actor', 'prefab').arm);
    expect(rebuilt.require('actor', 'prefab').arm.parent).toBe(
      rebuilt.require('other', 'prefab'),
    );
    expect(rebuilt.require('new', 'group').parent).toBe(
      rebuilt.require('old', 'group'),
    );
    expect(rebuilt.require('new', 'group').position).toMatchObject({
      x: 2,
      y: 8,
    });
    expect(content.remove('old')).toBe(true);
    expect(spawned.destroyed).toBe(true);
    const withoutOld = await rebuildContentScene(
      registry,
      JSON.parse(JSON.stringify(content.capture())),
      undefined,
    );
    expect(withoutOld.getById('old')).toBeUndefined();
    expect(withoutOld.getById('new')).toBeUndefined();
    content.destroy();
    rebuilt.destroy();
    withoutOld.destroy();
  });

  it('rejects removal through surviving references and disposes only nodes owned by content', async () => {
    const registry = createRegistry();
    const content = await buildContentScene(
      registry,
      {
        version: 1,
        nodes: [{ id: 'root', kind: 'group', options }],
      },
      undefined,
    );
    const reference = await content.spawn({
      id: 'link',
      kind: 'linked',
      options,
      references: { target: 'root' },
    });
    expect(() => content.remove('root')).toThrow('still references');
    expect(content.getById('root')?.destroyed).toBe(false);
    const foreign = content.require('root', 'group').add(new GameObject());
    expect(() => content.capture()).toThrow('authored stable ID');
    expect(content.remove('link')).toBe(true);
    expect(reference.destroyed).toBe(true);
    expect(content.remove('root')).toBe(true);
    expect(foreign.destroyed).toBe(false);
    expect(foreign.parent).toBeUndefined();
    expect(foreign.scene).toBe(content.scene);
    content.destroy();
    expect(foreign.destroyed).toBe(false);
    expect(foreign.scene).toBeUndefined();
    foreign.destroy();
  });

  it('rejects unknown/missing IDs, kinds and cyclic parents before creating a restored candidate', async () => {
    const created: SceneObject[] = [];
    const registry = createRegistry(created);
    const original = await buildContentScene(
      registry,
      {
        version: 1,
        nodes: [{ id: 'root', kind: 'group', options }],
      },
      undefined,
    );
    const snapshot = original.capture();
    const invalid = [
      { ...snapshot, state: { version: 1, objects: {} } },
      {
        ...snapshot,
        state: {
          version: 1,
          objects: { ...snapshot.state.objects, unknown: 3 },
        },
      },
      { ...snapshot, parents: { root: 'missing' } },
      { ...snapshot, parents: { root: 'root' } },
      { ...snapshot, parents: {} },
      {
        ...snapshot,
        content: {
          version: 1,
          nodes: [{ id: 'root', kind: 'unknown', options }],
        },
      },
    ];
    const initialCreations = created.length;
    for (const value of invalid)
      await expect(
        rebuildContentScene(registry, value, undefined),
      ).rejects.toThrow();
    expect(created.length).toBe(initialCreations);
    expect(original.require('root', 'group').scene).toBe(original.scene);
    original.destroy();
  });

  it('cleans failed custom state, adapter and dimension restoration without touching an old scene or borrowed assets', async () => {
    const texture = new Texture({
      width: 2,
      height: 2,
      close() {},
    } as ImageBitmap);
    const old = new Scene();
    const published = old.add(new Sprite({ texture }));
    const created: Sprite[] = [];
    const registry = new FactoryRegistry({
      sprite: defineFactory<Options, Sprite, { texture: Texture }>({
        parse: parseOptions,
        create(_options, context) {
          const node = new Sprite({ texture: context.services.texture });
          created.push(node);
          return node;
        },
        state(node) {
          return sceneObjectState(node, {
            serialize: () => 1,
            restore(value) {
              if (value !== 1)
                throw new Error('Invalid authored custom state.');
            },
          });
        },
      }),
    });
    const original = await buildContentScene(
      registry,
      {
        version: 1,
        nodes: [{ id: 'sprite', kind: 'sprite', options }],
      },
      { texture },
    );
    const snapshot = original.capture();
    const state = snapshot.state.objects.sprite as Record<string, JsonValue>;
    const invalid = {
      ...snapshot,
      state: { version: 1, objects: { sprite: { ...state, custom: 2 } } },
    };
    await expect(
      rebuildContentScene(registry, invalid, { texture }),
    ).rejects.toThrow('Invalid authored custom state');
    expect(created[1].destroyed).toBe(true);
    expect(published.destroyed).toBe(false);
    expect(old.has(published)).toBe(true);
    expect(texture.destroyed).toBe(false);
    expect(original.require('sprite', 'sprite').destroyed).toBe(false);
    const badAdapter = new FactoryRegistry({
      sprite: defineFactory({
        parse: parseOptions,
        create() {
          const node = new Sprite({ texture });
          created.push(node);
          return node;
        },
        state: () => ({}) as Serializable,
      }),
    });
    await expect(
      buildContentScene(badAdapter, snapshot.content, undefined),
    ).rejects.toThrow('Invalid Serializable adapter');
    expect(created[2].destroyed).toBe(true);
    const mixedCreated: SceneObject[] = [];
    const mixed = createRegistry(mixedCreated);
    const mixedOriginal = await buildContentScene(
      mixed,
      {
        version: 1,
        nodes: [
          { id: 'root', kind: 'group', options },
          { id: 'spatial', kind: 'body', options },
        ],
      },
      undefined,
    );
    const mixedSnapshot = mixedOriginal.capture();
    await expect(
      rebuildContentScene(
        mixed,
        {
          ...mixedSnapshot,
          parents: { root: null, spatial: 'root' },
        },
        undefined,
      ),
    ).rejects.toThrow('Incompatible content parent');
    expect(mixedCreated.slice(2).every((node) => node.destroyed)).toBe(true);
    mixedOriginal.destroy();
    original.destroy();
    old.destroy();
    texture.destroy();
  });

  it('requires explicit state for other SceneObject classes and preserves published content on failed dynamic creation', async () => {
    const created: SceneObject[] = [];
    const registry = createRegistry(created);
    const content = await buildContentScene(
      registry,
      {
        version: 1,
        nodes: [{ id: 'root', kind: 'group', options }],
      },
      undefined,
    );
    await expect(
      content.spawn({ id: 'moving', kind: 'body', options, parent: 'root' }),
    ).rejects.toThrow('Incompatible content parent');
    expect(created[1].destroyed).toBe(true);
    expect(content.getById('moving')).toBeUndefined();
    expect(content.require('root', 'group').destroyed).toBe(false);
    await content.spawn({ id: 'moving', kind: 'body', options });
    expect(content.require('moving', 'body').scene).toBe(content.scene);
    const unadapted = new FactoryRegistry({
      custom: defineFactory({
        parse: parseOptions,
        create() {
          const node = new Counter();
          created.push(node);
          return node;
        },
      }),
    });
    await expect(
      buildContentScene(
        unadapted,
        {
          version: 1,
          nodes: [{ id: 'custom', kind: 'custom', options }],
        },
        undefined,
      ),
    ).rejects.toThrow('explicit Serializable');
    expect(created[created.length - 1].destroyed).toBe(true);
    content.destroy();
  });

  it('cleans rejected prefab aliases without claiming foreign members and rejects dangling references to removed children', async () => {
    const created: SceneObject[] = [];
    const registry = createRegistry(created);
    await expect(
      buildContentScene(
        registry,
        {
          version: 1,
          nodes: [
            {
              id: 'actor',
              kind: 'prefab',
              options,
              children: { missing: 'member' },
            },
          ],
        },
        undefined,
      ),
    ).rejects.toThrow('child aliases');
    expect(created.every((node) => node.destroyed)).toBe(true);
    const creations = created.length;
    await expect(
      buildContentScene(
        registry,
        {
          version: 1,
          nodes: [
            {
              id: 'actor',
              kind: 'prefab',
              options,
              children: { arm: 'arm', hand: 'hand' },
              removedChildren: ['hand'],
            },
            {
              id: 'link',
              kind: 'linked',
              options,
              references: { target: 'hand' },
            },
          ],
        },
        undefined,
      ),
    ).rejects.toThrow('Missing content parent or reference');
    expect(created.length).toBe(creations);
    const borrowed = new Object3D();
    let fresh: Prefab | undefined;
    const foreign = new FactoryRegistry({
      prefab: defineFactory({
        parse: parseOptions,
        create() {
          fresh = new Prefab();
          return fresh;
        },
        children: () => ({ arm: borrowed }),
      }),
    });
    await expect(
      buildContentScene(
        foreign,
        {
          version: 1,
          nodes: [
            { id: 'root', kind: 'prefab', options, children: { arm: 'arm' } },
          ],
        },
        undefined,
      ),
    ).rejects.toThrow('distinct owned descendants');
    expect(fresh?.destroyed).toBe(true);
    expect(fresh?.arm.destroyed).toBe(true);
    expect(borrowed.destroyed).toBe(false);
    borrowed.destroy();
  });

  it('removes foreign registrations on failed custom restoration without destroying borrowed nodes', async () => {
    const old = new Scene();
    const published = old.add(new GameObject());
    const borrowed = old.add(new GameObject());
    old.remove(borrowed);
    const created: GameObject[] = [];
    const registry = new FactoryRegistry({
      group: defineFactory({
        parse: parseOptions,
        create() {
          const node = new GameObject();
          created.push(node);
          return node;
        },
        state(node: GameObject) {
          return {
            serialize: () => 1,
            restore(value) {
              if (value === 2) {
                node.scene!.add(borrowed);
                throw new Error('Restore failed after borrowing.');
              }
              if (value === 3) node.destroy();
            },
          };
        },
      }),
    });
    const content = await buildContentScene(
      registry,
      {
        version: 1,
        nodes: [{ id: 'root', kind: 'group', options }],
      },
      undefined,
    );
    const snapshot = content.capture();
    await expect(
      rebuildContentScene(
        registry,
        {
          ...snapshot,
          state: { version: 1, objects: { root: 2 } },
        },
        undefined,
      ),
    ).rejects.toThrow('Restore failed after borrowing');
    expect(created[1].destroyed).toBe(true);
    expect(borrowed.destroyed).toBe(false);
    expect(borrowed.scene).toBeUndefined();
    expect(published.scene).toBe(old);
    await expect(
      rebuildContentScene(
        registry,
        {
          ...snapshot,
          state: { version: 1, objects: { root: 3 } },
        },
        undefined,
      ),
    ).rejects.toThrow('Content restoration');
    expect(created[2].destroyed).toBe(true);
    expect(content.require('root', 'group').destroyed).toBe(false);
    content.destroy();
    old.destroy();
    borrowed.destroy();
  });
});

it('restores Object3D sleeping state and handles strict stable-ID mismatch without mutating known state', async () => {
  const scene = new Scene();
  const node = scene.add(new Object3D());
  node.body = new RigidBody3D();
  node.position.set(1, 2, 3);
  node.body.sleep();
  const serializer = new Serializer(scene);
  serializer.register('body', node);
  const snapshot = serializer.capture();
  node.position.x = 10;
  node.body.wake();
  node.body.velocity.x = 3;
  await serializer.restore(JSON.parse(JSON.stringify(snapshot)), 'error');
  expect(node.body.isSleeping).toBe(true);
  expect(node.body.velocity.x).toBe(0);
  expect(node.position.x).toBe(1);
  node.position.x = 7;
  await expect(
    serializer.restore({ version: 1, objects: { unknown: 1 } }, 'error'),
  ).rejects.toThrow('Snapshot id mismatch');
  const missingBody = {
    ...(snapshot.objects.body as Record<string, JsonValue>),
  };
  delete missingBody.body;
  await expect(
    serializer.restore({ version: 1, objects: { body: missingBody } }),
  ).rejects.toThrow('does not match the adapter');
  await expect(
    serializer.restore({
      version: 1,
      objects: {
        body: {
          ...(snapshot.objects.body as Record<string, JsonValue>),
          custom: 3,
        },
      },
    }),
  ).rejects.toThrow('does not match the adapter');
  expect(node.position.x).toBe(7);
  const unsupported = scene.add(new Counter());
  expect(() => serializer.register('counter', unsupported)).toThrow(
    'explicit Serializable',
  );
  serializer.register('counter', unsupported, counterState(unsupported));
  const state = serializer.capture();
  unsupported.value = 4;
  await serializer.restore(state);
  expect(unsupported.value).toBe(0);
  scene.destroy();
});

it('live Object3D restore cancels queued pre-restore force and torque in a pending half-step', async () => {
  const scene = new Scene();
  const halfStep = scene.physics3D.fixedDelta / 2;
  const node = new Object3D();
  node.collider = new SphereCollider3D(0.5);
  node.body = new RigidBody3D({ gravityScale: 0, allowSleep: false });
  scene.add(node);
  const serializer = new Serializer(scene);
  serializer.register('body', node);
  const snapshot = serializer.capture();
  node.body.applyForce(new Vector3(120, 0, 0), new Vector3(0, 1, 0));
  scene.physics3D.update(halfStep);
  await serializer.restore(JSON.parse(JSON.stringify(snapshot)), 'error');
  scene.physics3D.update(halfStep);
  expect(node.body.velocity.x).toBe(0);
  expect(node.body.angularVelocity.z).toBe(0);
  expect(node.position.x).toBe(0);
  scene.destroy();
});

it('live GameObject restore cancels queued force and torque without changing its existing snapshot payload', async () => {
  const scene = new Scene();
  scene.physics.fixedDelta = 1 / 120;
  const node = new GameObject();
  node.collider = Colliders.circle(0.5);
  node.body = new RigidBody2D({ gravityScale: 0, allowSleep: false });
  scene.add(node);
  const serializer = new Serializer(scene);
  serializer.register('body', node);
  const snapshot = serializer.capture();
  node.body.applyForce(new Vector2(120, 0), new Vector2(0, 1));
  scene.physics.update(1 / 240);
  await serializer.restore(JSON.parse(JSON.stringify(snapshot)), 'error');
  scene.physics.update(1 / 240);
  expect(node.body.velocity.x).toBe(0);
  expect(node.body.angularVelocity).toBe(0);
  expect(node.position.x).toBe(0);
  scene.destroy();
});

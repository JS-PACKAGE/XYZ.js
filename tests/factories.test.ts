import { describe, expect, expectTypeOf, it } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { Vector2, Vector3 } from '../packages/math/src/index.js';
import {
  buildContentScene,
  parseContentScene,
  type ContentSceneDefinition,
} from '../packages/core/src/content.js';
import {
  defineFactory,
  FactoryRegistry,
} from '../packages/core/src/factories.js';
import { GameObject } from '../packages/core/src/game-object.js';
import { Object3D } from '../packages/core/src/object3d.js';
import { Scene } from '../packages/core/src/scene.js';
import { Sprite } from '../packages/core/src/sprite.js';

interface PositionOptions {
  x: number;
  y: number;
}
function positionOptions(value: unknown): PositionOptions {
  if (
    !value ||
    typeof value !== 'object' ||
    !('x' in value) ||
    !('y' in value) ||
    typeof value.x !== 'number' ||
    typeof value.y !== 'number' ||
    !Number.isFinite(value.x) ||
    !Number.isFinite(value.y)
  )
    throw new TypeError('Invalid position options.');
  return { x: value.x, y: value.y };
}
const definitions = {
  group: defineFactory({
    parse: positionOptions,
    create(options: PositionOptions) {
      const node = new GameObject();
      node.position.set(options.x, options.y);
      return node;
    },
  }),
  spatial: defineFactory({
    parse: positionOptions,
    create(options: PositionOptions) {
      const node = new Object3D();
      node.position.set(options.x, options.y, 4);
      return node;
    },
  }),
};
const registry = new FactoryRegistry(definitions);
const position = { x: 0, y: 0 };

function leaf(id: string, parent?: string) {
  return {
    id,
    kind: 'group' as const,
    options: position,
    ...(parent === undefined ? {} : { parent }),
  };
}

describe('typed content factories', () => {
  it('builds literal-typed 2D/3D nodes and composes parent transforms with serializer IDs', async () => {
    const definition = {
      version: 1,
      nodes: [
        { id: 'child', kind: 'group', options: { x: 2, y: 3 }, parent: 'root' },
        { id: 'root', kind: 'group', options: { x: 10, y: 20 } },
        { id: 'spatial-root', kind: 'spatial', options: { x: 5, y: 6 } },
        {
          id: 'spatial-child',
          kind: 'spatial',
          options: { x: 7, y: 8 },
          parent: 'spatial-root',
        },
      ],
    } as const satisfies ContentSceneDefinition<typeof definitions>;
    const built = await buildContentScene(registry, definition, undefined);
    const child = built.get('child');
    const spatial = built.get('spatial-child');
    expectTypeOf(child).toEqualTypeOf<GameObject | undefined>();
    expectTypeOf(spatial).toEqualTypeOf<Object3D | undefined>();
    const directlyCreated = await registry.create(
      'spatial',
      position,
      undefined,
    );
    expectTypeOf(directlyCreated).toEqualTypeOf<Object3D>();
    expect(child?.parent).toBe(built.get('root'));
    expect(child?.updateWorldMatrix().transformPoint(new Vector2())).toEqual(
      new Vector2(12, 23),
    );
    expect(spatial?.updateWorldMatrix().transformPoint(new Vector3())).toEqual(
      new Vector3(12, 14, 8),
    );
    const snapshot = built.serializer.capture();
    spatial!.position.z = 99;
    spatial!.visible = false;
    child!.position.x = 99;
    await built.serializer.restore(snapshot);
    expect(child!.position.x).toBe(2);
    expect(spatial!.position.z).toBe(4);
    expect(spatial!.visible).toBe(true);
    built.scene.destroy();
    expect(built.get('child')).toBeUndefined();
    expect(() => built.require('child', 'group')).toThrow();
    directlyCreated.destroy();
  });

  it('resolves only explicit reference aliases and safely narrows dynamic IDs by factory kind', async () => {
    let observed: GameObject | undefined;
    const linked = new FactoryRegistry({
      ...definitions,
      linked: defineFactory({
        parse: positionOptions,
        create(_options: PositionOptions, context) {
          const target = context.reference('target');
          if (!(target instanceof GameObject))
            throw new TypeError('Target must be 2D.');
          observed = target;
          expect(() => context.reference('root')).toThrow();
          return new GameObject();
        },
      }),
    });
    const parsed = parseContentScene(linked, {
      version: 1,
      nodes: [
        {
          id: 'link',
          kind: 'linked',
          options: position,
          references: { target: 'root' },
        },
        leaf('root'),
      ],
    });
    const built = await buildContentScene(linked, parsed, undefined);
    expect(observed).toBe(built.require('root', 'group'));
    expect(() => built.require('root', 'spatial')).toThrow();
    expect(() => built.require('missing', 'group')).toThrow();
    built.scene.destroy();
  });

  it('rejects invalid finite JSON, options and graph topology before invoking constructors', async () => {
    let creations = 0;
    const checked = new FactoryRegistry({
      group: defineFactory({
        parse: positionOptions,
        create() {
          creations++;
          return new GameObject();
        },
      }),
    });
    const invalid = [
      { version: 1, nodes: [leaf('same'), leaf('same')] },
      { version: 1, nodes: [leaf('a', 'missing')] },
      { version: 1, nodes: [leaf('a', 'b'), leaf('b', 'a')] },
      { version: 1, nodes: [{ ...leaf('a'), references: { self: 'a' } }] },
      {
        version: 1,
        nodes: [{ ...leaf('a'), references: { target: 'missing' } }],
      },
      { version: 1, nodes: [{ ...leaf('a'), kind: 'unknown' }] },
      { version: 1, nodes: [{ ...leaf('a'), options: { x: Infinity, y: 0 } }] },
      { version: 1, nodes: [{ ...leaf('a'), options: { x: 'bad', y: 0 } }] },
      { version: 1, nodes: [leaf('a'.repeat(129))] },
      {
        version: 1,
        nodes: [
          { ...leaf('a'), options: { x: 0, y: 0, text: 'a'.repeat(4097) } },
        ],
      },
      {
        version: 1,
        nodes: Array.from({ length: 4097 }, (_, index) => leaf(String(index))),
      },
    ];
    for (const value of invalid)
      expect(() => parseContentScene(checked, value)).toThrow();
    const recursive: Record<string, unknown> = {};
    recursive.child = recursive;
    expect(() => parseContentScene(checked, recursive)).toThrow();
    expect(creations).toBe(0);
  });

  it('rejects mismatched hierarchy dimensions and cleans both new leaves', async () => {
    const created: (GameObject | Object3D)[] = [];
    const mixed = new FactoryRegistry({
      group: defineFactory({
        parse: positionOptions,
        create() {
          const node = new GameObject();
          created.push(node);
          return node;
        },
      }),
      spatial: defineFactory({
        parse: positionOptions,
        create() {
          const node = new Object3D();
          created.push(node);
          return node;
        },
      }),
    });
    await expect(
      buildContentScene(
        mixed,
        {
          version: 1,
          nodes: [
            leaf('root'),
            { id: 'child', kind: 'spatial', options: position, parent: 'root' },
          ],
        },
        undefined,
      ),
    ).rejects.toThrow();
    expect(created.map((node) => node.destroyed)).toEqual([true, true]);
  });

  it('cleans partial async failures while preserving the old Scene and its borrowed texture', async () => {
    let closed = 0;
    const texture = new Texture({
      width: 2,
      height: 2,
      close() {
        closed++;
      },
    } as ImageBitmap);
    const old = new Scene();
    const oldSprite = old.add(new Sprite({ texture }));
    let candidate: Sprite | undefined;
    let partial: GameObject | undefined;
    let partialChild: Sprite | undefined;
    const assets = new FactoryRegistry({
      sprite: defineFactory<PositionOptions, Sprite, { texture: Texture }>({
        parse: positionOptions,
        create(_options, context) {
          candidate = new Sprite({ texture: context.services.texture });
          return candidate;
        },
      }),
      failing: defineFactory<PositionOptions, GameObject, { texture: Texture }>(
        {
          parse: positionOptions,
          async create(_options, context) {
            const node = new GameObject();
            partial = node;
            partialChild = node.add(
              new Sprite({ texture: context.services.texture }),
            );
            context.own(node);
            await Promise.resolve();
            expect(node.destroyed).toBe(false);
            throw new Error('Asset unavailable.');
          },
        },
      ),
    });
    await expect(
      buildContentScene(
        assets,
        {
          version: 1,
          nodes: [
            { id: 'candidate', kind: 'sprite', options: position },
            { id: 'failure', kind: 'failing', options: position },
          ],
        },
        { texture },
      ),
    ).rejects.toThrow('Asset unavailable');
    expect(candidate?.destroyed).toBe(true);
    expect(partial?.destroyed).toBe(true);
    expect(partialChild?.destroyed).toBe(true);
    expect(oldSprite.destroyed).toBe(false);
    expect(old.has(oldSprite)).toBe(true);
    expect(texture.destroyed).toBe(false);
    expect(closed).toBe(0);
    old.destroy();
    expect(texture.destroyed).toBe(false);
    texture.destroy();
    expect(closed).toBe(1);
  });

  it('cancels promptly and disposes a late node even when the factory ignores its signal', async () => {
    let release!: (node: GameObject) => void;
    let started!: () => void;
    const ready = new Promise<void>((resolve) => {
      started = resolve;
    });
    const late = new FactoryRegistry({
      late: defineFactory({
        parse: positionOptions,
        create() {
          started();
          return new Promise<GameObject>((resolve) => {
            release = resolve;
          });
        },
      }),
    });
    const controller = new AbortController();
    const build = buildContentScene(
      late,
      { version: 1, nodes: [{ id: 'late', kind: 'late', options: position }] },
      undefined,
      { signal: controller.signal },
    );
    await ready;
    controller.abort(new Error('Cancelled by caller.'));
    await expect(build).rejects.toThrow('Cancelled by caller');
    let disposed!: () => void;
    const destroyed = new Promise<void>((resolve) => {
      disposed = resolve;
    });
    const node = new (class extends GameObject {
      protected override onDestroy(): void {
        disposed();
      }
    })();
    release(node);
    await destroyed;
    expect(node.destroyed).toBe(true);
  });

  it('rejects duplicate object identity, preowned, formerly owned and destroyed results without destroying unrelated objects', async () => {
    const old = new Scene();
    const existing = old.add(new GameObject());
    const detached = old.add(new GameObject());
    old.remove(detached);
    const disposed = new GameObject();
    disposed.destroy();
    for (const node of [existing, detached, disposed]) {
      const bad = new FactoryRegistry({
        group: defineFactory({
          parse: positionOptions,
          create() {
            return node;
          },
        }),
      });
      await expect(
        buildContentScene(bad, { version: 1, nodes: [leaf('bad')] }, undefined),
      ).rejects.toThrow();
    }
    expect(existing.destroyed).toBe(false);
    expect(existing.scene).toBe(old);
    expect(detached.destroyed).toBe(false);
    const shared = new GameObject();
    const duplicate = new FactoryRegistry({
      group: defineFactory({
        parse: positionOptions,
        create() {
          return shared;
        },
      }),
    });
    await expect(
      buildContentScene(
        duplicate,
        { version: 1, nodes: [leaf('a'), leaf('b')] },
        undefined,
      ),
    ).rejects.toThrow();
    expect(shared.destroyed).toBe(true);
    old.destroy();
    detached.destroy();
  });
  it('registers fresh prefab descendants but refuses topology saves without authored child IDs', async () => {
    let child: GameObject | undefined;
    const prefabs = new FactoryRegistry({
      prefab: defineFactory({
        parse: positionOptions,
        create(options: PositionOptions) {
          const root = new GameObject();
          root.position.set(options.x, options.y);
          child = root.add(new GameObject());
          child.position.set(3, 4);
          return root;
        },
      }),
    });
    const built = await buildContentScene(
      prefabs,
      {
        version: 1,
        nodes: [{ id: 'prefab', kind: 'prefab', options: { x: 10, y: 20 } }],
      },
      undefined,
    );
    expect(child?.scene).toBe(built.scene);
    expect(child?.parent).toBe(built.require('prefab', 'prefab'));
    expect(child?.updateWorldMatrix().transformPoint(new Vector2())).toEqual(
      new Vector2(13, 24),
    );
    expect(() => built.capture()).toThrow('authored stable ID');
    built.scene.destroy();
    expect(child?.destroyed).toBe(true);
  });

  it('cleans claimed composite cancellation without releasing borrowed assets', async () => {
    const texture = new Texture({
      width: 2,
      height: 2,
      close() {},
    } as ImageBitmap);
    let root: GameObject | undefined;
    let child: Sprite | undefined;
    let started!: () => void;
    let release!: () => void;
    const ready = new Promise<void>((resolve) => {
      started = resolve;
    });
    const waiting = new Promise<void>((resolve) => {
      release = resolve;
    });
    const prefabs = new FactoryRegistry({
      prefab: defineFactory<PositionOptions, GameObject, { texture: Texture }>({
        parse: positionOptions,
        async create(_options, context) {
          const node = new GameObject();
          root = node;
          child = node.add(new Sprite({ texture: context.services.texture }));
          context.own(node);
          started();
          await waiting;
          return node;
        },
      }),
    });
    const controller = new AbortController();
    const build = buildContentScene(
      prefabs,
      {
        version: 1,
        nodes: [{ id: 'prefab', kind: 'prefab', options: position }],
      },
      { texture },
      { signal: controller.signal },
    );
    await ready;
    controller.abort(new Error('Cancel prefab.'));
    await expect(build).rejects.toThrow('Cancel prefab');
    expect(root?.destroyed).toBe(true);
    expect(child?.destroyed).toBe(true);
    expect(texture.destroyed).toBe(false);
    release();
    texture.destroy();
  });

  it('cleans a rejected fresh prefab root but preserves its formerly scene-owned borrowed child', async () => {
    const previous = new Scene();
    const borrowed = previous.add(new GameObject());
    previous.remove(borrowed);
    let root: GameObject | undefined;
    const prefabs = new FactoryRegistry({
      prefab: defineFactory({
        parse: positionOptions,
        create() {
          root = new GameObject();
          root.add(borrowed);
          return root;
        },
      }),
    });
    await expect(
      buildContentScene(
        prefabs,
        {
          version: 1,
          nodes: [{ id: 'prefab', kind: 'prefab', options: position }],
        },
        undefined,
      ),
    ).rejects.toThrow();
    expect(root?.destroyed).toBe(true);
    expect(borrowed.destroyed).toBe(false);
    expect(borrowed.parent).toBeUndefined();
    previous.destroy();
    borrowed.destroy();
  });

  it('rejects attached foreign prefab roots without corrupting detached 2D or 3D hierarchies', async () => {
    const parent2D = new GameObject();
    const child2D = parent2D.add(new GameObject());
    const parent3D = new Object3D();
    const child3D = parent3D.add(new Object3D());
    for (const { parent, child } of [
      { parent: parent2D, child: child2D },
      { parent: parent3D, child: child3D },
    ]) {
      try {
        for (const claim of [false, true]) {
          const foreign = new FactoryRegistry({
            borrowed: defineFactory<
              PositionOptions,
              GameObject | Object3D,
              void
            >({
              parse: positionOptions,
              create(_options, context) {
                return claim ? context.own(child) : child;
              },
            }),
          });
          await expect(
            foreign.create('borrowed', position, undefined),
          ).rejects.toThrow();
          expect(child.destroyed).toBe(false);
          expect(child.parent).toBe(parent);
          expect([...parent.children]).toContain(child);
        }
      } finally {
        parent.destroy();
      }
    }
  });
});

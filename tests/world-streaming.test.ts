import { describe, expect, it } from 'vitest';
import { AssetLoader } from '../packages/assets/src/index.js';
import {
  ResourcePool,
  type ResourceRequest,
} from '../packages/assets/src/resource-scope.js';
import { Scene } from '../packages/core/src/scene.js';
import { Object3D } from '../packages/core/src/object3d.js';
import { BoxCollider3D } from '../packages/core/src/physics3d/collider.js';
import { Vector3 } from '../packages/math/src/math3d.js';
import {
  WorldStreamingController,
  type WorldStreamingCell,
  type WorldStreamingFailure,
} from '../packages/core/src/world-streaming.js';
import { WorldStreamingNavigation3D } from '../packages/core/src/world-streaming-navigation.js';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function fixture() {
  const scene = new Scene();
  const loader = new AssetLoader();
  const pool = new ResourcePool(loader);
  const focus = new Vector3();
  let loads = 0,
    disposals = 0;
  const live = new Set<Object3D>();
  const shared: ResourceRequest<object> = {
    kind: 'custom',
    ownership: 'owned',
    load() {
      loads++;
      return {};
    },
    dispose() {
      expect([...live].every((root) => !scene.physics3D.has(root))).toBe(true);
      disposals++;
    },
  };
  const cells: WorldStreamingCell[] = [0, 10].map((x, index) => ({
    id: String(index),
    bounds: { min: new Vector3(x - 5, -1, -5), max: new Vector3(x + 5, 2, 5) },
    async load(context) {
      await context.resources.acquire(shared);
      const root = context.own(new Object3D());
      root.position.set(x, -0.5, 0);
      root.collider = new BoxCollider3D(new Vector3(5, 0.5, 5));
      live.add(root);
      root.addEventListener('destroy', () => live.delete(root));
      return {
        root,
        navigation: {
          nodes: [
            { id: 'center', position: new Vector3(x, 1, 0) },
            { id: 'seam', position: new Vector3(5, 1, 0) },
          ],
          connections: [
            { from: 'center', to: 'seam', cost: 5, clearance: 0.5 },
          ],
          portals: [{ seam: 'shared', node: 'seam', clearance: 0.5 }],
        },
      };
    },
  }));
  const stream = new WorldStreamingController(scene, pool, {
    cells,
    focus: () => focus,
    activeDistance: 0,
    prefetchDistance: 5,
    retireDistance: 5,
    maxActive: 2,
    maxResident: 2,
    maxPending: 2,
  });
  return {
    scene,
    loader,
    pool,
    focus,
    stream,
    roots: live,
    counts: () => ({ loads, disposals }),
    destroy() {
      stream.destroy();
      scene.destroy();
      pool.destroy();
      loader.destroy();
    },
  };
}

async function publish(stream: WorldStreamingController): Promise<void> {
  stream.update();
  await stream.settled();
  stream.update();
}

describe('world streaming authoritative lifecycle', () => {
  it('prefetches shared resources without colliders, joins live seams, invalidates old paths and retires before last release', async () => {
    const value = fixture();
    try {
      await publish(value.stream);
      expect(value.stream.stats).toMatchObject({
        active: 1,
        ready: 1,
        resident: 2,
      });
      expect(value.scene.physics3D.size).toBe(1);
      expect(
        value.scene.physics3D.raycast(
          new Vector3(10, 3, 0),
          new Vector3(0, -1, 0),
          5,
        ),
      ).toBeUndefined();
      expect(value.counts()).toEqual({ loads: 1, disposals: 0 });
      const before = value.stream.navigation.graph!;
      const oldPath = before.findPath(
        value.stream.navigation.nodeId('0', 'center'),
        value.stream.navigation.nodeId('0', 'seam'),
      );
      value.focus.x = 5;
      value.stream.update();
      const graph = value.stream.navigation.graph!;
      const path = graph.findPath(
        value.stream.navigation.nodeId('0', 'center'),
        value.stream.navigation.nodeId('1', 'center'),
        { agentRadius: 0.4 },
      );
      expect(path.status).toBe('found');
      expect(path.cost).toBe(10);
      expect(path.nodes.map((node) => node.position.x)).toEqual([0, 5, 5, 10]);
      expect(value.stream.navigation.isPathCurrent(oldPath)).toBe(false);
      expect(before.destroyed).toBe(true);
      const job = graph.createSearch(
        value.stream.navigation.nodeId('0', 'center'),
        value.stream.navigation.nodeId('1', 'center'),
      );
      job.step(1);
      value.focus.x = 11;
      value.stream.update();
      expect(value.scene.physics3D.size).toBe(1);
      expect(
        value.scene.physics3D.raycast(
          new Vector3(0, 3, 0),
          new Vector3(0, -1, 0),
          5,
        ),
      ).toBeUndefined();
      expect(
        value.scene.physics3D.raycast(
          new Vector3(10, 3, 0),
          new Vector3(0, -1, 0),
          5,
        )?.point.y,
      ).toBeCloseTo(0);
      expect(graph.isPathCurrent(path)).toBe(false);
      expect(job.status).toBe('cancelled');
      expect(value.counts().disposals).toBe(0);
      value.focus.x = -1;
      await publish(value.stream);
      expect(
        value.scene.physics3D.raycast(
          new Vector3(0, 3, 0),
          new Vector3(0, -1, 0),
          5,
        )?.point.y,
      ).toBeCloseTo(0);
      value.focus.x = 100;
      value.stream.update();
      expect(value.stream.stats).toMatchObject({
        active: 0,
        ready: 0,
        pending: 0,
        resident: 0,
      });
      expect(value.scene.physics3D.size).toBe(0);
      expect(value.stream.navigation.graph).toBeUndefined();
      expect(value.counts().loads).toBe(value.counts().disposals);
    } finally {
      value.destroy();
    }
  });

  it('holds admission reservations for cancelled non-cooperative loads and reclaims late owned subtrees', async () => {
    const scene = new Scene(),
      loader = new AssetLoader(),
      pool = new ResourcePool(loader);
    const gate = deferred<void>(),
      started = deferred<void>();
    const focus = new Vector3();
    let aborted = false,
      destroyed = 0;
    const cells: WorldStreamingCell[] = [0, 100].map((x, index) => ({
      id: String(index),
      bounds: {
        min: new Vector3(x - 1, -1, -1),
        max: new Vector3(x + 1, 1, 1),
      },
      async load(context) {
        context.signal.addEventListener('abort', () => {
          aborted = true;
        });
        started.resolve();
        if (index === 0) await gate.promise;
        const root = new Object3D();
        root.addEventListener('destroy', () => {
          destroyed++;
        });
        context.own(root);
        return { root };
      },
    }));
    const stream = new WorldStreamingController(scene, pool, {
      cells,
      focus: () => focus,
      prefetchDistance: 0,
      retireDistance: 0,
      maxActive: 1,
      maxPending: 1,
      maxResident: 1,
    });
    try {
      stream.update();
      await started.promise;
      focus.x = 100;
      stream.update();
      expect(aborted).toBe(true);
      expect(stream.stats).toMatchObject({
        active: 0,
        pending: 1,
        cancelling: 1,
        resident: 1,
        admissions: 1,
      });
      gate.resolve();
      await stream.settled();
      expect(destroyed).toBe(1);
      expect(scene.objects.size).toBe(0);
      await publish(stream);
      expect(stream.getCell('0').state).toBe('unloaded');
      expect(stream.getCell('1').state).toBe('active');
      expect(stream.stats.publications).toBe(1);
    } finally {
      stream.destroy();
      scene.destroy();
      pool.destroy();
      loader.destroy();
    }
  });

  it('freezes publish/retire/admission on pause, then reselects before publishing completed candidates', async () => {
    const value = fixture();
    try {
      value.stream.update();
      value.stream.setPaused(true);
      await value.stream.settled();
      value.focus.x = 100;
      value.stream.update();
      expect(value.stream.stats).toMatchObject({
        active: 0,
        ready: 2,
        resident: 2,
      });
      expect(value.scene.physics3D.size).toBe(0);
      value.stream.setPaused(false);
      value.stream.update();
      expect(value.stream.stats).toMatchObject({
        active: 0,
        resident: 0,
        publications: 0,
      });
      expect(value.counts()).toEqual({ loads: 1, disposals: 1 });
    } finally {
      value.destroy();
    }
  });

  it('keeps errors explicit and sticky until consumer-requested retry', async () => {
    const scene = new Scene(),
      loader = new AssetLoader(),
      pool = new ResourcePool(loader);
    const failures: WorldStreamingFailure[] = [];
    let attempts = 0;
    const stream = new WorldStreamingController(scene, pool, {
      cells: [
        {
          id: 'bad',
          bounds: { min: new Vector3(-1, -1, -1), max: new Vector3(1, 1, 1) },
          load(context) {
            const root = context.own(new Object3D());
            if (++attempts === 1)
              throw new Error('Real content decode failure');
            return { root };
          },
        },
      ],
      focus: () => new Vector3(),
      onError: (failure) => failures.push(failure),
    });
    try {
      await publish(stream);
      expect(stream.getCell('bad').state).toBe('failed');
      expect(failures[0]!.error).toEqual(
        new Error('Real content decode failure'),
      );
      expect(scene.objects.size).toBe(0);
      await publish(stream);
      expect(attempts).toBe(1);
      stream.retry('bad');
      await publish(stream);
      expect(stream.getCell('bad').state).toBe('active');
      expect(attempts).toBe(2);
    } finally {
      stream.destroy();
      scene.destroy();
      pool.destroy();
      loader.destroy();
    }
  });

  it('enforces priority, active and per-frame admission caps while retaining inactive prefetches', async () => {
    const scene = new Scene(),
      loader = new AssetLoader(),
      pool = new ResourcePool(loader);
    const stream = new WorldStreamingController(scene, pool, {
      cells: [0, 1].map((priority) => ({
        id: String(priority),
        priority,
        bounds: { min: new Vector3(-1, -1, -1), max: new Vector3(1, 1, 1) },
        load(context) {
          const root = context.own(new Object3D());
          root.position.x = priority;
          return { root };
        },
      })),
      focus: () => new Vector3(),
      maxActive: 1,
      maxPending: 2,
      maxResident: 2,
      admissionsPerFrame: 1,
      prefetchDistance: 0,
      retireDistance: 0,
    });
    try {
      stream.update();
      expect(stream.stats.admissions).toBe(1);
      expect(stream.getCell('1').state).toBe('loading');
      expect(stream.getCell('0').state).toBe('unloaded');
      await stream.settled();
      stream.update();
      await stream.settled();
      stream.update();
      expect(stream.stats).toMatchObject({ active: 1, ready: 1, resident: 2 });
      expect(
        [...scene.objects].map((root) => (root as Object3D).position.x),
      ).toEqual([1]);
    } finally {
      stream.destroy();
      scene.destroy();
      pool.destroy();
      loader.destroy();
    }
  });

  it('handles disable reentry from native add events without retaining live colliders or leases', async () => {
    const value = fixture();
    try {
      value.stream.update();
      await value.stream.settled();
      // This observes real Scene events, after physics and navigation have committed together.
      [...value.roots]
        .find((root) => root.position.x === 0)!
        .addEventListener('add', () => {
          expect(value.scene.physics3D.size).toBe(1);
          expect(value.stream.navigation.graph).toBeDefined();
          value.stream.enabled = false;
        });
      value.stream.update();
      expect(value.scene.physics3D.size).toBe(0);
      expect(value.scene.objects.size).toBe(0);
      expect(value.stream.stats.resident).toBe(0);
      expect(value.counts().loads).toBe(value.counts().disposals);
    } finally {
      value.destroy();
    }
  });
});

describe('streaming seam validation', () => {
  it('rejects mismatched, duplicate or ambiguous seam owners instead of manufacturing traversable gaps', () => {
    const navigation = new WorldStreamingNavigation3D();
    const fragment = (x: number) => ({
      nodes: [{ id: 'seam', position: new Vector3(x, 0, 0) }],
      connections: [],
      portals: [{ seam: 'door', node: 'seam', clearance: 0.5 }],
    });
    expect(() =>
      navigation.prepare(
        new Map([
          ['a', fragment(0)],
          ['b', fragment(1)],
        ]),
      ),
    ).toThrow('do not coincide');
    expect(() =>
      navigation.prepare(
        new Map([
          ['a', fragment(0)],
          ['b', fragment(0)],
          ['c', fragment(0)],
        ]),
      ),
    ).toThrow('more than two owners');
    const duplicate = fragment(0);
    duplicate.portals.push({ seam: 'door', node: 'seam', clearance: 0.5 });
    expect(() => navigation.prepare(new Map([['a', duplicate]]))).toThrow();
    navigation.destroy();
  });
});

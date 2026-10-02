import { describe, expect, it } from 'vitest';
import { AssetLoader, AssetManifest } from '../packages/assets/src/index.js';
import {
  ResourcePool,
  type ResourceRequest,
} from '../packages/assets/src/resource-scope.js';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

class Resource {
  disposed = 0;
  consumers = 0;
  dispose(): void {
    if (this.consumers) throw new Error('Disposed while consumed.');
    this.disposed++;
  }
}

describe('cross-resource scopes', () => {
  it('shares one owned acquisition across scenes and detaches every consumer before last disposal', async () => {
    const loader = new AssetLoader();
    const pool = new ResourcePool(loader);
    const first = pool.createScope(),
      second = pool.createScope();
    let acquisitions = 0;
    const request: ResourceRequest<Resource> = {
      kind: 'model',
      ownership: 'owned',
      load: () => {
        acquisitions++;
        return new Resource();
      },
      dispose: (value) => value.dispose(),
    };
    const [a, b] = await Promise.all([
      first.acquire(request),
      second.acquire(request),
    ]);
    expect(a.value).toBe(b.value);
    expect(acquisitions).toBe(1);
    a.value.consumers = 2;
    a.attach(() => {
      a.value.consumers--;
    });
    b.attach(() => {
      b.value.consumers--;
    });
    first.release();
    expect(b.value.consumers).toBe(1);
    expect(b.value.disposed).toBe(0);
    second.release();
    second.release();
    a.release();
    expect(b.value.consumers).toBe(0);
    expect(b.value.disposed).toBe(1);
    pool.destroy();
    loader.destroy();
  });

  it('never destroys borrowed resources, including on owner destruction', async () => {
    const loader = new AssetLoader(),
      pool = new ResourcePool(loader);
    const scope = pool.createScope();
    const value = new Resource();
    const request: ResourceRequest<Resource> = {
      kind: 'audio',
      ownership: 'borrowed',
      load: () => value,
      dispose: (resource) => resource.dispose(),
    };
    const shared = await scope.acquire(request);
    const external = scope.borrow(value);
    value.consumers = 2;
    shared.attach(() => {
      value.consumers--;
    });
    external.attach(() => {
      value.consumers--;
    });
    pool.destroy();
    expect(value.consumers).toBe(0);
    expect(value.disposed).toBe(0);
    loader.destroy();
  });

  it('reclaims claimed acquisitions after load failure and does not double-release aborted late results', async () => {
    const loader = new AssetLoader(),
      pool = new ResourcePool(loader);
    const failed = new Resource(),
      late = new Resource();
    const gate = deferred<Resource>(),
      started = deferred<void>();
    const first = pool.createScope();
    await expect(
      first.acquire({
        kind: 'font',
        ownership: 'owned',
        load: (_signal, context) => {
          context.own(failed);
          throw new Error('decode failure');
        },
        dispose: (value: Resource) => value.dispose(),
      }),
    ).rejects.toThrow('decode failure');
    expect(failed.disposed).toBe(1);
    first.release();
    const second = pool.createScope();
    const pending = second.acquire({
      kind: 'custom',
      ownership: 'owned',
      load: (_signal, context) => {
        context.own(late);
        started.resolve();
        return gate.promise;
      },
      dispose: (value: Resource) => value.dispose(),
    });
    const cancelled = expect(pending).rejects.toThrow('cancel');
    await started.promise;
    second.release(new Error('cancel'));
    await cancelled;
    expect(late.disposed).toBe(1);
    gate.resolve(late);
    await gate.promise;
    await Promise.resolve();
    await Promise.resolve();
    expect(late.disposed).toBe(1);
    pool.destroy();
    loader.destroy();
  });

  it('cancels only a failed subscriber while another scope still needs the shared acquisition', async () => {
    const loader = new AssetLoader(),
      pool = new ResourcePool(loader);
    const first = pool.createScope(),
      second = pool.createScope();
    const gate = deferred<Resource>(),
      started = deferred<AbortSignal>();
    const request: ResourceRequest<Resource> = {
      kind: 'audio',
      ownership: 'owned',
      load: (signal) => {
        started.resolve(signal);
        return gate.promise;
      },
      dispose: (value) => value.dispose(),
    };
    const a = first.acquire(request),
      b = second.acquire(request);
    const cancelled = expect(a).rejects.toThrow('left');
    const loadSignal = await started.promise;
    first.release(new Error('left'));
    await cancelled;
    expect(loadSignal.aborted).toBe(false);
    const resource = new Resource();
    gate.resolve(resource);
    expect((await b).value).toBe(resource);
    expect(resource.disposed).toBe(0);
    second.release();
    expect(resource.disposed).toBe(1);
    pool.destroy();
    loader.destroy();
  });

  it('retains owned acquisitions until failed consumer detachment succeeds on retry', () => {
    const loader = new AssetLoader(),
      pool = new ResourcePool(loader);
    const scope = pool.createScope(),
      value = new Resource();
    const lease = scope.own(value, (resource) => resource.dispose());
    let detachFails = true;
    value.consumers = 1;
    lease.attach(() => {
      if (detachFails) throw new Error('consumer is busy');
      value.consumers--;
    });
    expect(() => scope.release()).toThrow(AggregateError);
    expect(value.disposed).toBe(0);
    expect(lease.released).toBe(false);
    detachFails = false;
    scope.release();
    expect(value.disposed).toBe(1);
    pool.destroy();
    loader.destroy();
  });

  it.each(['scope', 'pool'] as const)(
    'keeps a reentrant failed lease reachable for %s cleanup retry',
    (retry) => {
      const loader = new AssetLoader(),
        pool = new ResourcePool(loader);
      const scope = pool.createScope(),
        value = new Resource();
      const lease = scope.own(value, (resource) => resource.dispose());
      let detachFails = true;
      value.consumers = 1;
      lease.attach(() => {
        scope.release();
        if (detachFails) throw new Error('reentrant consumer is busy');
        value.consumers--;
      });
      expect(() => lease.release()).toThrow(AggregateError);
      expect(lease.released).toBe(false);
      expect(value.disposed).toBe(0);
      detachFails = false;
      if (retry === 'scope') scope.release();
      else pool.destroy();
      expect(lease.released).toBe(true);
      expect(value.consumers).toBe(0);
      expect(value.disposed).toBe(1);
      pool.destroy();
      loader.destroy();
    },
  );

  it('retains a pending acquisition that resolves after pool teardown fails to detach its candidate', async () => {
    const loader = new AssetLoader(),
      pool = new ResourcePool(loader);
    const scope = pool.createScope(),
      value = new Resource();
    const started = deferred<void>(),
      gate = deferred<Resource>();
    let detachFails = true;
    value.consumers = 1;
    scope.attach(() => {
      if (detachFails) throw new Error('candidate is busy');
      value.consumers--;
    });
    const pending = scope.acquire({
      kind: 'model',
      ownership: 'owned',
      load: () => {
        started.resolve();
        return gate.promise;
      },
      dispose: (resource: Resource) => resource.dispose(),
    });
    const rejected = expect(pending).rejects.toThrow(
      'ResourceScope is destroyed.',
    );
    await started.promise;
    expect(() => pool.destroy()).toThrow(AggregateError);
    gate.resolve(value);
    await rejected;
    expect(value.consumers).toBe(1);
    expect(value.disposed).toBe(0);
    detachFails = false;
    pool.destroy();
    expect(value.consumers).toBe(0);
    expect(value.disposed).toBe(1);
    loader.destroy();
  });

  it('retains failed owner-abort detachment without raising an uncaught event-listener exception', () => {
    const loader = new AssetLoader(),
      pool = new ResourcePool(loader);
    const owner = new AbortController(),
      scope = pool.createScope({ signal: owner.signal });
    const value = new Resource(),
      lease = scope.own(value, (resource) => resource.dispose());
    let detachFails = true;
    value.consumers = 1;
    lease.attach(() => {
      if (detachFails) throw new Error('owner consumer is busy');
      value.consumers--;
    });
    owner.abort();
    expect(value.disposed).toBe(0);
    expect(lease.released).toBe(false);
    expect(() => pool.destroy()).toThrow(AggregateError);
    detachFails = false;
    pool.destroy();
    expect(value.consumers).toBe(0);
    expect(value.disposed).toBe(1);
    loader.destroy();
  });

  it('rolls back failed manifest groups without releasing another scene manifest lease', async () => {
    const loader = new AssetLoader(),
      pool = new ResourcePool(loader);
    const resource = new Resource(),
      late = new Resource();
    const gate = deferred<Resource>(),
      started = deferred<void>(),
      lateDisposed = deferred<void>();
    const manifest = new AssetManifest({
      entries: [
        {
          aliases: 'shared',
          type: 'model',
          owned: true,
          load: async () => resource,
          dispose: (value) => (value as Resource).dispose(),
        },
        {
          aliases: 'late',
          type: 'audio',
          owned: true,
          load: () => {
            started.resolve();
            return gate.promise;
          },
          dispose: (value) => {
            (value as Resource).dispose();
            lateDisposed.resolve();
          },
        },
        {
          aliases: 'bad',
          type: 'custom',
          owned: false,
          load: async () => {
            await started.promise;
            throw new Error('group failure');
          },
        },
      ],
    });
    const live = await manifest.acquire(pool, ['shared']);
    const failed = expect(
      manifest.acquire(pool, ['shared', 'late', 'bad']),
    ).rejects.toThrow('group failure');
    await failed;
    expect(resource.disposed).toBe(0);
    gate.resolve(late);
    await lateDisposed.promise;
    expect(late.disposed).toBe(1);
    live.release();
    expect(resource.disposed).toBe(1);
    pool.destroy();
    loader.destroy();
  });
});

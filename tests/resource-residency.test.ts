import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssetLoader, Texture } from '../packages/assets/src/index.js';
import {
  NativeResidency,
  ResidencyPool,
} from '../packages/graphics/src/residency.js';
import {
  prepareNativeResource,
  residencyLease,
} from '../packages/graphics/src/preparation.js';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}
function images() {
  const decoded = new Map<
    string,
    { width: number; height: number; closed: boolean; close(): void }
  >();
  vi.stubGlobal('fetch', async (url: string) => new Response(url));
  vi.stubGlobal('createImageBitmap', async (blob: Blob) => {
    const image = {
      width: 2,
      height: 2,
      closed: false,
      close() {
        this.closed = true;
      },
    };
    decoded.set(await blob.text(), image);
    return image;
  });
  return decoded;
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('decoded texture residency', () => {
  it('evicts the least recently released idle image, never a live lease or legacy borrower', async () => {
    const decoded = images();
    const loader = new AssetLoader('https://example.test/', {
      decodedTextureBytes: 32,
    });
    const a = await loader.acquireTexture('a'),
      b = await loader.acquireTexture('b');
    a.release();
    b.release();
    const touched = await loader.acquireTexture('a');
    expect(touched.texture).toBe(a.texture);
    touched.release();
    const c = await loader.acquireTexture('c');
    expect(a.texture.destroyed).toBe(false);
    expect(b.texture.destroyed).toBe(true);
    expect(decoded.get('https://example.test/b')?.closed).toBe(true);
    expect(loader.residency).toMatchObject({
      liveBytes: 32,
      entries: 2,
      evictions: 1,
    });
    const legacy = await loader.loadTexture('a');
    await expect(loader.acquireTexture('d')).rejects.toThrow();
    expect(legacy.destroyed).toBe(false);
    expect(c.texture.destroyed).toBe(false);
    expect(decoded.get('https://example.test/d')?.closed).toBe(true);
    expect(() => loader.unloadTexture('c')).toThrow();
    c.release();
    c.release();
    loader.unloadTexture('a');
    expect(legacy.destroyed).toBe(true);
    loader.destroy();
    expect(c.texture.destroyed).toBe(true);
    expect(loader.residency.liveBytes).toBe(0);
  });

  it('keeps shared decode alive until the last subscriber is cancelled and closes its late bitmap', async () => {
    const download = deferred<Response>(),
      decode = deferred<ImageBitmap>();
    let decodeStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      decodeStarted = resolve;
    });
    vi.stubGlobal('fetch', () => download.promise);
    vi.stubGlobal('createImageBitmap', () => {
      decodeStarted();
      return decode.promise;
    });
    const loader = new AssetLoader('https://example.test/', {
      decodedTextureBytes: 16,
    });
    const one = new AbortController(),
      two = new AbortController();
    const a = loader.acquireTexture('shared#first', { signal: one.signal });
    const b = loader.acquireTexture('./shared#second', { signal: two.signal });
    const reason = new Error('first left');
    const firstFailure = expect(a).rejects.toBe(reason);
    one.abort(reason);
    await firstFailure;
    download.resolve(new Response('image'));
    await started;
    two.abort(new Error('last left'));
    await expect(b).rejects.toThrow('last left');
    const image = {
      width: 2,
      height: 2,
      closed: false,
      close() {
        this.closed = true;
      },
    };
    decode.resolve(image as unknown as ImageBitmap);
    await vi.waitFor(() => expect(image.closed).toBe(true));
    expect(loader.residency.liveBytes).toBe(0);
    loader.destroy();
  });

  it('counts concurrent leases independently and does not evict on an impossible admission', async () => {
    images();
    const loader = new AssetLoader('https://example.test/', {
      decodedTextureBytes: 16,
    });
    const [a, b] = await Promise.all([
      loader.acquireTexture('a'),
      loader.acquireTexture('a'),
    ]);
    expect(a.texture).toBe(b.texture);
    a.release();
    await expect(loader.acquireTexture('b')).rejects.toThrow();
    expect(b.texture.destroyed).toBe(false);
    expect(loader.residency.borrowers).toBe(1);
    b.release();
    const replacement = await loader.acquireTexture('b');
    expect(a.texture.destroyed).toBe(true);
    replacement.release();
    loader.destroy();
  });
});

describe('native cache admission', () => {
  it('uses LRU only among idle allocations and protects encoded-frame and retained resources', () => {
    const pool = new ResidencyPool();
    pool.configure(12);
    const retired: string[] = [];
    const a = pool.allocate(4, () => retired.push('a'));
    pool.allocate(4, () => retired.push('b'));
    a.touch();
    const c = pool.allocate(4, () => retired.push('c'));
    c.retain();
    pool.beginFrame();
    a.touch();
    const d = pool.allocate(4, () => retired.push('d'));
    expect(retired).toEqual(['b']);
    expect(() => pool.allocate(4, () => retired.push('failed'))).toThrow();
    expect(retired).toEqual(['b']);
    pool.endFrame();
    d.touch();
    pool.allocate(4, () => retired.push('e'));
    expect(retired).toEqual(['b', 'a']);
    c.release();
    pool.clear();
    expect(pool.liveBytes).toBe(0);
    expect(pool.entries).toBe(0);
  });

  it('rejects budget reconfiguration atomically and cannot evict the allocation being resized', () => {
    const native = new NativeResidency();
    native.configure({ textureBytes: 8, geometryBytes: 8 });
    const texture = native.textures.allocate(8, () => {});
    const geometry = native.geometry.allocate(8, () => {});
    geometry.retain();
    expect(() =>
      native.configure({ textureBytes: 0, geometryBytes: 0 }),
    ).toThrow();
    expect(texture.destroyed).toBe(false);
    expect(native.textures.budgetBytes).toBe(8);
    expect(() => texture.resize(9)).toThrow();
    expect(texture.destroyed).toBe(false);
    expect(native.textures.liveBytes).toBe(8);
    native.clear();
  });

  it('retains the submitted frame during handoff and makes stale-generation releases harmless', () => {
    const pool = new ResidencyPool(),
      retired: string[] = [];
    pool.configure(8);
    const old = pool.allocate(8, () => retired.push('old'));
    pool.beginFrame();
    old.touch();
    pool.endFrame();
    const previous = residencyLease(pool.retainFrameResources());
    expect(() => pool.allocate(8, () => {})).toThrow();
    expect(old.destroyed).toBe(false);
    pool.clear();
    expect(retired).toEqual(['old']);
    const replacement = pool.allocate(8, () => retired.push('replacement'));
    pool.beginCapture();
    replacement.touch();
    const current = residencyLease(pool.endCapture());
    previous.release();
    previous.release();
    expect(replacement.destroyed).toBe(false);
    expect(pool.liveBytes).toBe(8);
    expect(() => pool.allocate(8, () => {})).toThrow();
    current.release();
    pool.allocate(8, () => {});
    expect(retired).toEqual(['old', 'replacement']);
    pool.clear();
  });

  it('drops abandoned recording pins without publishing them as the last visible frame', () => {
    const pool = new ResidencyPool();
    pool.configure(16);
    const visible = pool.allocate(8, () => {});
    pool.beginFrame();
    visible.touch();
    pool.endFrame();
    visible.retain();
    pool.beginFrame();
    const partial = pool.allocate(8, () => {});
    expect(() => pool.allocate(8, () => {})).toThrow();
    pool.abortFrame();
    const submitted = residencyLease(pool.retainFrameResources());
    visible.release();
    pool.allocate(8, () => {});
    expect(partial.destroyed).toBe(true);
    expect(visible.destroyed).toBe(false);
    submitted.release();
    pool.clear();
  });

  it('cancels captured upload ownership before completion and cannot retire a later allocation', async () => {
    const native = new NativeResidency(),
      work = deferred<void>();
    native.configure({ textureBytes: 16 });
    const texture = new Texture({
      width: 2,
      height: 2,
      close() {},
    } as ImageBitmap);
    const controller = new AbortController(),
      reason = new Error('leave upload');
    const unsupported = (): never => {
      throw new Error('Unexpected non-texture fixture resource.');
    };
    let retired = false;
    const pending = prepareNativeResource(
      native,
      texture,
      {
        texture: (source) => {
          native.textures.allocate(source.width * source.height * 4, () => {
            retired = true;
          });
        },
        geometry: unsupported,
        mesh: unsupported,
        particles: unsupported,
        environment: unsupported,
        material: unsupported,
        post: unsupported,
        complete: () => work.promise,
      },
      { signal: controller.signal },
    );
    expect(() => native.textures.allocate(16, () => {})).toThrow();
    const cancellation = expect(pending).rejects.toBe(reason);
    controller.abort(reason);
    const replacement = native.textures.allocate(16, () => {});
    expect(retired).toBe(true);
    await cancellation;
    work.reject(new Error('late upload completion failure'));
    await Promise.resolve();
    await Promise.resolve();
    expect(replacement.destroyed).toBe(false);
    expect(native.textures.liveBytes).toBe(16);
    expect(texture.destroyed).toBe(false);
    native.clear();
    texture.destroy();
  });
});

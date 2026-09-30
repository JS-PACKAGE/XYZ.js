import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssetLoader, PreloadBatch } from '../packages/assets/src/index.js';
import {
  GLTFLoader,
  type GLTFAsset,
} from '../packages/core/src/gltf-loader.js';
import { gameplayAssetLimits } from '../src/data/gameplay-assets.js';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('bounded preload ownership', () => {
  it('counts completed tasks, bounds concurrency and returns their actual values', async () => {
    const gates = Array.from({ length: 9 }, () => deferred<number>());
    let active = 0;
    let peak = 0;
    const started: number[] = [];
    const batch = new PreloadBatch(
      gates.map((gate, index) => ({
        key: `item${index}`,
        async load() {
          started.push(index);
          peak = Math.max(peak, ++active);
          const value = await gate.promise;
          active--;
          return value;
        },
      })),
    );
    const ratios: number[] = [];
    batch.addEventListener('progress', (event) =>
      ratios.push((event as CustomEvent).detail.ratio),
    );
    const pending = batch.load();
    await vi.waitFor(() => expect(started).toEqual([0, 1, 2, 3]));
    gates[2].resolve(102);
    await vi.waitFor(() => expect(started).toEqual([0, 1, 2, 3, 4]));
    expect(batch.progress).toEqual({
      completed: 1,
      total: 9,
      ratio: 1 / 9,
      currentKey: 'item2',
    });
    for (let index = 0; index < gates.length; index++)
      gates[index].resolve(100 + index);
    const results = await pending;
    expect([...results].sort()).toEqual(
      gates.map((_, index) => [`item${index}`, 100 + index]),
    );
    expect(peak).toBe(gameplayAssetLimits.preloadConcurrency);
    expect(ratios).toEqual(Array.from({ length: 10 }, (_, index) => index / 9));
    expect(batch.state).toBe('ready');
  });

  it('rejects the real failure, aborts unfinished tasks and never destroys completed resources', async () => {
    const failure = new Error('network broken');
    const gate = deferred<never>();
    const resource = { destroy: vi.fn() };
    let unfinished: AbortSignal | undefined;
    const batch = new PreloadBatch([
      { key: 'ready', load: async () => resource },
      { key: 'failed', load: () => gate.promise },
      {
        key: 'unfinished',
        load: (signal) => {
          unfinished = signal;
          return new Promise<never>(() => {});
        },
      },
    ]);
    let errorDetail: unknown;
    batch.addEventListener('error', (event) => {
      errorDetail = (event as CustomEvent).detail;
    });
    const pending = batch.load();
    await vi.waitFor(() => expect(batch.progress.completed).toBe(1));
    gate.reject(failure);
    await expect(pending).rejects.toBe(failure);
    expect(batch.state).toBe('failed');
    expect(unfinished?.aborted).toBe(true);
    expect(errorDetail).toBe(failure);
    expect(resource.destroy).not.toHaveBeenCalled();
  });

  it('settles cancellation even if a caller task ignores its signal', async () => {
    const controller = new AbortController();
    const batch = new PreloadBatch([
      { key: 'stalled', load: () => new Promise<never>(() => {}) },
    ]);
    const pending = batch.load({ signal: controller.signal });
    await Promise.resolve();
    const reason = new Error('scene replaced');
    controller.abort(reason);
    await expect(pending).rejects.toBe(reason);
    expect(batch.state).toBe('cancelled');
    expect(batch.progress.ratio).toBe(0);
  });

  it('makes an empty batch ready and rejects duplicate keys before any task starts', async () => {
    const empty = new PreloadBatch([]);
    await empty.load();
    expect(empty.progress).toEqual({ completed: 0, total: 0, ratio: 1 });
    expect(empty.state).toBe('ready');
    const load = vi.fn();
    expect(
      () =>
        new PreloadBatch([
          { key: 'x', load },
          { key: 'x', load },
        ]),
    ).toThrow('unique');
    expect(load).not.toHaveBeenCalled();
  });

  it('cancels one texture subscriber without cancelling a concurrent shared acquisition', async () => {
    const download = deferred<Response>();
    const image = { width: 2, height: 2, close: vi.fn() };
    const fetcher = vi.fn().mockReturnValue(download.promise);
    vi.stubGlobal('fetch', fetcher);
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(image));
    const loader = new AssetLoader('https://example.test/');
    const controller = new AbortController();
    const first = loader
      .textureTask('sprite', 'sprite.png#one')
      .load(controller.signal);
    const shared = loader.loadTexture('./sprite.png#two');
    controller.abort();
    await expect(first).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetcher.mock.calls[0][1].signal.aborted).toBe(false);
    download.resolve(new Response('pixels'));
    const texture = await shared;
    expect(texture.destroyed).toBe(false);
    expect(await loader.loadTexture('sprite.png')).toBe(texture);
    expect(fetcher).toHaveBeenCalledTimes(1);
    loader.destroy();
    expect(image.close).toHaveBeenCalledTimes(1);
  });

  it('loads bounded UTF-8 text, JSON and binary while rejecting invalid JSON and oversize streams', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async (url: string) =>
          new Response(url.endsWith('invalid') ? '{' : '{"greeting":"雪"}'),
      ),
    );
    const loader = new AssetLoader('https://example.test/');
    expect(await loader.loadText('text')).toBe('{"greeting":"雪"}');
    expect(await loader.loadJSON('json')).toEqual({ greeting: '雪' });
    expect(new TextDecoder().decode(await loader.loadBinary('binary'))).toBe(
      '{"greeting":"雪"}',
    );
    await expect(loader.loadJSON('invalid')).rejects.toThrow('parse');
    await expect(
      loader.loadText('text', { maxBytes: 2 }),
    ).rejects.toMatchObject({
      cause: { message: 'Asset response exceeds 2 bytes.' },
    });
    await expect(loader.loadBinary('file:///private')).rejects.toThrow(
      'protocol',
    );
    await expect(
      loader.loadBinary('binary', { maxBytes: Infinity }),
    ).rejects.toThrow('byte limit');
    loader.destroy();
  });

  it('releases a completed unique glTF task after batch failure without disposing unrelated direct loads', async () => {
    const model = JSON.stringify({
      asset: { version: '2.0' },
      nodes: [{ name: 'root' }],
      scenes: [{ nodes: [0] }],
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(model)),
    );
    const loader = new GLTFLoader();
    const unrelated = await loader.load('https://example.test/direct.gltf');
    const task = loader.task('model', 'https://example.test/task.gltf');
    const failure = deferred<never>();
    let unique: GLTFAsset | undefined;
    const batch = new PreloadBatch([
      {
        key: task.key,
        load: async (signal) => {
          unique = await task.load(signal);
          return unique;
        },
      },
      { key: 'failure', load: () => failure.promise },
    ]);
    const pending = batch.load();
    await vi.waitFor(() => expect(batch.progress.completed).toBe(1));
    const cause = new Error('another asset failed');
    failure.reject(cause);
    await expect(pending).rejects.toBe(cause);
    expect(unique?.scene.destroyed).toBe(true);
    expect(unrelated.scene.destroyed).toBe(false);
    unrelated.dispose();
  });

  it('transfers a successful unique glTF task to its consumer, independent of later parent cancellation', async () => {
    const model = JSON.stringify({
      asset: { version: '2.0' },
      nodes: [{ name: 'root' }],
      scenes: [{ nodes: [0] }],
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(model)),
    );
    const controller = new AbortController();
    const batch = new PreloadBatch([
      new GLTFLoader().task('model', 'https://example.test/task.gltf'),
    ]);
    const result = await batch.load({ signal: controller.signal });
    const asset = result.get('model') as GLTFAsset;
    controller.abort();
    batch.cancel();
    expect(asset.scene.destroyed).toBe(false);
    asset.dispose();
    expect(asset.scene.destroyed).toBe(true);
  });
});

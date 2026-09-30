import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AssetError,
  AssetLoader,
  Texture,
} from '../packages/assets/src/index.js';
import { XYZError } from '../packages/graphics/src/errors.js';
import { assetLimits } from '../src/data/assets.js';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function bitmap(width = 32, height = 16) {
  return { width, height, close: vi.fn() } as unknown as ImageBitmap;
}

function response(ok = true) {
  return new Response('pixels', { status: ok ? 200 : 404 });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('AssetLoader and Texture lifetime', () => {
  it('rejects an oversized decoded image and closes its owned bitmap', async () => {
    const image = bitmap(2049, 2048);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response()));
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(image));
    const assets = new AssetLoader('https://example.test/');
    await expect(assets.loadTexture('large.png')).rejects.toThrow(AssetError);
    expect(image.close).toHaveBeenCalledOnce();
    assets.destroy();
  });

  it('stops an oversized response before image decoding', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(new Uint8Array(assetLimits.textureBytes + 1)),
        ),
    );
    const decode = vi.fn();
    vi.stubGlobal('createImageBitmap', decode);
    const assets = new AssetLoader('https://example.test/');
    await expect(assets.loadTexture('large.png')).rejects.toThrow(AssetError);
    expect(decode).not.toHaveBeenCalled();
    assets.destroy();
  });
  it('shares a pending promise and decoded bitmap for canonical URLs, including fragments', async () => {
    const download = deferred<Response>();
    const fetchMock = vi.fn().mockReturnValue(download.promise);
    const image = bitmap();
    const decode = vi.fn().mockResolvedValue(image);
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('createImageBitmap', decode);
    const assets = new AssetLoader('https://example.test/game/');

    const first = assets.loadTexture('./art/../sprite.png#left');
    const second = assets.loadTexture('sprite.png#right');
    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://example.test/game/sprite.png',
    );
    download.resolve(response());
    const texture = await first;
    expect(await second).toBe(texture);
    expect(
      await assets.loadTexture('https://example.test/game/sprite.png'),
    ).toBe(texture);
    expect(decode).toHaveBeenCalledOnce();
    assets.destroy();
    assets.destroy();
    expect(image.close).toHaveBeenCalledOnce();
    expect(texture.destroyed).toBe(true);
    await expect(assets.loadTexture('sprite.png')).rejects.toThrow(AssetError);
  });

  it('evicts a failed request and retries without losing the shared error', async () => {
    const failed = deferred<Response>();
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(failed.promise)
      .mockResolvedValue(response());
    const image = bitmap();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(image));
    const assets = new AssetLoader('https://example.test/');
    const first = assets.loadTexture('sprite.png');
    const second = assets.loadTexture('./sprite.png');
    failed.resolve(response(false));
    const error = await first.catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(AssetError);
    expect(error).toBeInstanceOf(XYZError);
    await expect(second).rejects.toBe(error);
    const texture = await assets.loadTexture('sprite.png');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(texture.destroyed).toBe(false);
    assets.destroy();
  });

  it('reloads an explicitly destroyed cached texture', async () => {
    const firstImage = bitmap();
    const secondImage = bitmap();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => response()),
    );
    vi.stubGlobal(
      'createImageBitmap',
      vi
        .fn()
        .mockResolvedValueOnce(firstImage)
        .mockResolvedValueOnce(secondImage),
    );
    const assets = new AssetLoader('https://example.test/');
    const first = await assets.loadTexture('sprite.png');
    first.destroy();
    const second = await assets.loadTexture('sprite.png');
    expect(second).not.toBe(first);
    expect(second.destroyed).toBe(false);
    assets.destroy();
    expect(firstImage.close).toHaveBeenCalledOnce();
    expect(secondImage.close).toHaveBeenCalledOnce();
  });

  it('rejects immediately on destroy even if fetch ignores abort', async () => {
    const download = deferred<Response>();
    const fetchMock = vi.fn().mockReturnValue(download.promise);
    const decode = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('createImageBitmap', decode);
    const assets = new AssetLoader();
    const pending = assets.loadTexture('https://example.test/sprite.png');
    const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;
    assets.destroy();
    expect(signal.aborted).toBe(true);
    await expect(pending).rejects.toThrow(AssetError);
    const late = response();
    download.resolve(late);
    await Promise.resolve();
    await Promise.resolve();
    expect(decode).not.toHaveBeenCalled();
  });

  it('closes an image decoded after its loader was destroyed', async () => {
    const decoded = deferred<ImageBitmap>();
    const started = deferred<void>();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response()));
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockImplementation(() => {
        started.resolve();
        return decoded.promise;
      }),
    );
    const assets = new AssetLoader('https://example.test/');
    const pending = assets.loadTexture('sprite.png');
    await started.promise;
    assets.destroy();
    await expect(pending).rejects.toThrow(AssetError);
    const image = bitmap();
    decoded.resolve(image);
    await vi.waitFor(() => expect(image.close).toHaveBeenCalledOnce());
  });

  it('decodes procedural images independently using straight alpha and closes once', async () => {
    const source = bitmap();
    const image = bitmap(8, 4);
    const decode = vi.fn().mockResolvedValue(image);
    vi.stubGlobal('createImageBitmap', decode);
    const texture = await Texture.fromImage(source);
    texture.destroy();
    texture.destroy();
    expect(image.close).toHaveBeenCalledOnce();
    expect(source.close).not.toHaveBeenCalled();
  });
});

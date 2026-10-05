import { afterEach, describe, expect, it, vi } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { VideoTexture } from '../packages/assets/src/video-texture.js';
import { materialBaseTexture } from '../packages/core/src/mesh.js';
import { PBRMaterial } from '../packages/core/src/pbr-material.js';
import { Sprite } from '../packages/core/src/sprite.js';

class Surface {
  pixel = 0;
  constructor(
    public width: number,
    public height: number,
  ) {}
  getContext() {
    return {
      drawImage: (source: { pixel: number; tainted?: boolean }) => {
        if (source.tainted) throw new DOMException('Tainted', 'SecurityError');
        this.pixel = source.pixel;
      },
      clearRect: () => {},
      getImageData: () => ({
        data: new Uint8ClampedArray([this.pixel, 0, 0, 255]),
      }),
    };
  }
}
class Media extends EventTarget {
  videoWidth = 2;
  videoHeight = 2;
  readyState = 2;
  currentTime = 0;
  paused = true;
  ended = false;
  pixel = 10;
  error = null;
  srcObject = null;
  callbacks = new Map<number, VideoFrameRequestCallback>();
  serial = 0;
  unloaded = false;
  requestVideoFrameCallback(callback: VideoFrameRequestCallback) {
    this.callbacks.set(++this.serial, callback);
    return this.serial;
  }
  cancelVideoFrameCallback(id: number) {
    this.callbacks.delete(id);
  }
  async play() {
    this.paused = false;
    this.dispatchEvent(new Event('play'));
  }
  pause() {
    this.paused = true;
    this.dispatchEvent(new Event('pause'));
  }
  removeAttribute() {
    this.unloaded = true;
  }
  load() {}
  deliver(pixel: number) {
    this.pixel = pixel;
    this.currentTime++;
    const callbacks = [...this.callbacks.values()];
    this.callbacks.clear();
    for (const callback of callbacks)
      callback(0, {} as VideoFrameCallbackMetadata);
  }
}
class Decoder extends EventTarget {
  static instances: Decoder[] = [];
  static async isConfigSupported(config: VideoDecoderConfig) {
    return { supported: true, config };
  }
  state: CodecState = 'unconfigured';
  decodeQueueSize = 0;
  constructor(readonly init: VideoDecoderInit) {
    super();
    Decoder.instances.push(this);
  }
  configure() {
    this.state = 'configured';
  }
  decode() {
    this.decodeQueueSize++;
  }
  async flush() {
    this.decodeQueueSize = 0;
    this.dispatchEvent(new Event('dequeue'));
  }
  close() {
    this.state = 'closed';
  }
}
function frame(pixel: number) {
  return { displayWidth: 2, displayHeight: 2, pixel, close: vi.fn() };
}
afterEach(() => {
  vi.unstubAllGlobals();
  Decoder.instances.length = 0;
});
function setup() {
  vi.stubGlobal('OffscreenCanvas', Surface);
  vi.stubGlobal('VideoDecoder', Decoder);
}

describe('stable video texture consumers and ownership', () => {
  it('advances one shared Sprite/PBR source, freezes on pause and cancels stale delivery on destroy', async () => {
    setup();
    const media = new Media();
    const texture = await VideoTexture.fromVideo(
      media as unknown as HTMLVideoElement,
      { ownVideo: true },
    );
    const sprite = new Sprite({ texture });
    const material = new PBRMaterial({
      texture: Object.create(Texture.prototype) as Texture,
      textureSource: texture,
    });
    const surface = texture.image;
    await texture.play();
    media.deliver(80);
    expect((texture.image as unknown as Surface).pixel).toBe(80);
    expect(texture.image).toBe(surface);
    expect(sprite.texture).toBe(texture);
    expect(materialBaseTexture(material)).toBe(texture);
    const version = texture.version;
    texture.pause();
    media.deliver(120);
    expect(texture.version).toBe(version);
    await texture.play();
    const stale = [...media.callbacks.values()][0]!;
    texture.destroy();
    stale(0, {} as VideoFrameCallbackMetadata);
    expect(media.callbacks.size).toBe(0);
    expect(media.paused).toBe(true);
    expect(media.unloaded).toBe(true);
    expect(texture.destroyed).toBe(true);
    expect(texture.version).toBe(version);
  });
  it('copies external frames synchronously and always closes ownership including rejected frames', () => {
    setup();
    const texture = new VideoTexture();
    const first = frame(55);
    texture.ingest(first as unknown as VideoFrame);
    expect(first.close).toHaveBeenCalledOnce();
    expect((texture.image as unknown as Surface).pixel).toBe(55);
    texture.destroy();
    const second = frame(99);
    expect(() => texture.ingest(second as unknown as VideoFrame)).toThrow(
      'destroyed',
    );
    expect(second.close).toHaveBeenCalledOnce();
  });
  it('coalesces decoder output, closes superseded/pending frames and bounds encoded input', async () => {
    setup();
    const texture = new VideoTexture();
    const adapter = await texture.createDecoder({
      codec: 'vp8',
      codedWidth: 2,
      codedHeight: 2,
    });
    const decoder = Decoder.instances[0]!;
    const first = frame(10),
      latest = frame(90);
    decoder.init.output(first as unknown as VideoFrame);
    decoder.init.output(latest as unknown as VideoFrame);
    expect(first.close).toHaveBeenCalledOnce();
    await Promise.resolve();
    expect(latest.close).toHaveBeenCalledOnce();
    expect((texture.image as unknown as Surface).pixel).toBe(90);
    const chunk = { byteLength: 1 } as EncodedVideoChunk;
    for (let i = 0; i < 16; i++) adapter.decode(chunk);
    expect(() => adapter.decode(chunk)).toThrow('bounded queue');
    await adapter.flush();
    adapter.decode(chunk);
    const pending = frame(150);
    decoder.init.output(pending as unknown as VideoFrame);
    texture.destroy();
    await Promise.resolve();
    expect(pending.close).toHaveBeenCalledOnce();
    expect(decoder.state).toBe('closed');
    expect(texture.version).toBe(1);
  });
  it('stops frame work on security failures and aborts pending media loading without late resurrection', async () => {
    setup();
    const media = new Media();
    const texture = await VideoTexture.fromVideo(
      media as unknown as HTMLVideoElement,
    );
    (media as Media & { tainted: boolean }).tainted = true;
    await texture.play();
    media.deliver(20);
    expect(media.callbacks.size).toBe(0);
    texture.destroy();
    const controller = new AbortController();
    const loadingMedia = new Media();
    loadingMedia.readyState = 0;
    const loading = VideoTexture.fromVideo(
      loadingMedia as unknown as HTMLVideoElement,
      { signal: controller.signal, ownVideo: true },
    );
    controller.abort();
    await expect(loading).rejects.toThrow();
    loadingMedia.readyState = 2;
    loadingMedia.dispatchEvent(new Event('loadeddata'));
    expect(loadingMedia.unloaded).toBe(true);
    expect(loadingMedia.callbacks.size).toBe(0);
  });
});

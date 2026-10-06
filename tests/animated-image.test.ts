import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import {
  AnimatedImageTexture,
  AnimatedImageTimeline,
} from '../packages/assets/src/animated-image.js';

class Surface {
  pixel = 0;
  constructor(
    public width: number,
    public height: number,
  ) {}
  getContext() {
    return {
      drawImage: (source: { pixel: number }) => {
        this.pixel = source.pixel;
      },
      clearRect: () => {},
      getImageData: () => ({
        data: new Uint8ClampedArray([this.pixel, 0, 0, 255]),
      }),
    };
  }
}
class Decoder {
  static supported = true;
  static failAt = -1;
  static frames: Array<{ close: Mock }> = [];
  static instances: Decoder[] = [];
  static async isTypeSupported() {
    return Decoder.supported;
  }
  tracks = {
    ready: Promise.resolve(),
    selectedTrack: { frameCount: 3, repetitionCount: 1 },
  };
  completed = Promise.resolve();
  closed = false;
  constructor(readonly options: { data: Uint8Array }) {
    Decoder.instances.push(this);
  }
  async decode({ frameIndex }: { frameIndex: number }) {
    if (frameIndex === Decoder.failAt) throw new Error('decode failed');
    const image = {
      displayWidth: 2,
      displayHeight: 1,
      duration: [100000, 200000, 300000][frameIndex],
      pixel: frameIndex + 1,
      close: vi.fn(),
    };
    Decoder.frames.push(image);
    return { image, complete: true };
  }
  close() {
    this.closed = true;
  }
}
function setup() {
  vi.stubGlobal('OffscreenCanvas', Surface);
  vi.stubGlobal('ImageDecoder', Decoder);
}
afterEach(() => {
  vi.unstubAllGlobals();
  Decoder.supported = true;
  Decoder.failAt = -1;
  Decoder.frames = [];
  Decoder.instances = [];
});
describe('animated image simulation timing', () => {
  it('uses frame boundaries, pause/reset and finite file repetitions', () => {
    const clock = new AnimatedImageTimeline([0.125, 0.25, 0.125], 2);
    expect(clock.update(0.125)).toBe(1);
    clock.pause();
    expect(clock.update(100)).toBe(1);
    clock.reset();
    expect(clock.frame).toBe(0);
    expect(clock.playing).toBe(false);
    clock.play();
    expect(clock.update(0.5)).toBe(0);
    expect(clock.update(0.375)).toBe(2);
    expect(clock.update(0.125)).toBe(2);
    expect(clock.ended).toBe(true);
    clock.play();
    expect(clock.playing).toBe(false);
    clock.reset();
    clock.play();
    expect(clock.ended).toBe(false);
  });
  it('reduces huge deltas without iterating loops and validates timing', () => {
    const clock = new AnimatedImageTimeline([0.125, 0.375]);
    expect(clock.update(Number.MAX_VALUE)).toBe(0);
    expect(clock.update(0.125)).toBe(1);
    for (const value of [-1, NaN, Infinity])
      expect(() => clock.update(value)).toThrow(RangeError);
    for (const duration of [0, -1, Infinity, NaN])
      expect(() => new AnimatedImageTimeline([duration])).toThrow(RangeError);
    for (const plays of [0, -1, 1.5, NaN])
      expect(() => new AnimatedImageTimeline([1], plays)).toThrow(RangeError);
  });
  it('wraps without overflowing when the cycle duration is near MAX_VALUE', () => {
    const quarter = 3 * 2 ** 1020;
    const clock = new AnimatedImageTimeline([
      quarter,
      quarter,
      quarter,
      quarter,
    ]);
    expect(clock.update(quarter * 3)).toBe(3);
    expect(clock.update(quarter * 3)).toBe(2);
    expect(clock.update(quarter)).toBe(3);
    expect(clock.update(quarter)).toBe(0);
    expect(clock.ended).toBe(false);
  });
});
describe('ImageDecoder-only source ownership', () => {
  it('copies input, closes every frame/decoder, reuses stable surface and owns independent atlas', async () => {
    setup();
    const data = new Uint8Array([1]);
    const texture = await AnimatedImageTexture.decode(data, 'image/gif');
    expect(Decoder.instances[0]!.options.data).not.toBe(data);
    expect(Decoder.instances[0]!.closed).toBe(true);
    for (const frame of Decoder.frames)
      expect(frame.close).toHaveBeenCalledTimes(1);
    const surface = texture.image;
    texture.updateAnimation(0.1);
    expect(texture.frame).toBe(1);
    expect(texture.image).toBe(surface);
    expect(texture.version).toBe(1);
    texture.pause();
    texture.updateAnimation(1);
    expect(texture.frame).toBe(1);
    const atlas = texture.createAtlas();
    expect(atlas.frames).toHaveLength(3);
    expect(atlas.durations).toEqual([0.1, 0.2, 0.3]);
    texture.destroy();
    texture.destroy();
    expect(surface.width).toBe(0);
    expect(atlas.texture.destroyed).toBe(false);
    expect(() => texture.updateAnimation(1)).toThrow('destroyed');
    atlas.destroy();
    atlas.destroy();
    expect(atlas.texture.destroyed).toBe(true);
  });
  it('explicitly rejects absent/unsupported decoders, abort and malformed data', async () => {
    vi.stubGlobal('ImageDecoder', undefined);
    await expect(
      AnimatedImageTexture.decode(new Uint8Array([1]), 'image/png'),
    ).rejects.toThrow('no fallback');
    setup();
    Decoder.supported = false;
    await expect(
      AnimatedImageTexture.decode(new Uint8Array([1]), 'image/png'),
    ).rejects.toThrow('no fallback');
    Decoder.supported = true;
    const controller = new AbortController();
    controller.abort();
    await expect(
      AnimatedImageTexture.decode(new Uint8Array([1]), 'image/png', {
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    await expect(
      AnimatedImageTexture.decode(new Uint8Array(), 'image/png'),
    ).rejects.toThrow('bytes');
  });
  it('closes decoder and acquired frames on partial failure', async () => {
    setup();
    Decoder.failAt = 1;
    await expect(
      AnimatedImageTexture.decode(new Uint8Array([1]), 'image/gif'),
    ).rejects.toThrow('decode failed');
    expect(Decoder.instances[0]!.closed).toBe(true);
    expect(Decoder.frames[0]!.close).toHaveBeenCalledTimes(1);
  });
});

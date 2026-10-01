import { afterEach, describe, expect, it, vi } from 'vitest';
import { SampleAudioEngine } from '../packages/audio/src/samples/sample-audio.js';
import { SamplePlayback } from '../packages/audio/src/samples/sample-playback.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

class FakeContext {
  currentTime = 0;
  state = 'running';
  destination = {};
  starts: Array<{
    when: number;
    offset: number | undefined;
    duration: number | undefined;
    loopStart: number;
    loopEnd: number;
    loop: boolean;
  }> = [];
  media: Array<{ connected: boolean }> = [];
  buffer = {
    duration: 10,
    length: 480000,
    sampleRate: 48000,
    numberOfChannels: 1,
  } as AudioBuffer;
  createGain() {
    return {
      gain: { value: 1 },
      connect() {},
      disconnect() {},
    } as unknown as GainNode;
  }
  createBufferSource() {
    const { starts } = this;
    const source = {
      buffer: null as AudioBuffer | null,
      loop: false,
      loopStart: 0,
      loopEnd: 0,
      playbackRate: { value: 1 },
      onended: null as (() => void) | null,
      connect() {},
      disconnect() {},
      start(when: number, offset?: number, duration?: number) {
        starts.push({
          when,
          offset,
          duration,
          loopStart: source.loopStart,
          loopEnd: source.loopEnd,
          loop: source.loop,
        });
      },
      stop() {},
    };
    return source as unknown as AudioBufferSourceNode;
  }
  createMediaElementSource() {
    const node = {
      connected: true,
      connect() {},
      disconnect: () => (node.connected = false),
    };
    this.media.push(node);
    return node as unknown as MediaElementAudioSourceNode;
  }
  get context() {
    return this as unknown as AudioContext;
  }
}

describe('audio sprites', () => {
  it('plays only the region, wraps loops inside it and ends at the region end', () => {
    const native = new FakeContext();
    const bus = native.createGain();
    const sprite = new SamplePlayback(
      native.context,
      native.buffer,
      bus,
      { region: { start: 2, end: 3 } },
      () => {},
    );
    expect(native.starts[0]).toMatchObject({ offset: 2, duration: 1 });
    expect(sprite.position).toBe(2);
    native.currentTime = 0.4;
    expect(sprite.position).toBeCloseTo(2.4);
    sprite.pause();
    native.currentTime = 5;
    sprite.resume();
    // Resuming restarts from the paused position and only plays what remains of the region.
    expect(native.starts[1]!.offset).toBeCloseTo(2.4);
    expect(native.starts[1]!.duration).toBeCloseTo(0.6);
    native.currentTime = 100;
    expect(sprite.position).toBe(3);

    const loop = new SamplePlayback(
      native.context,
      native.buffer,
      bus,
      { region: { start: 2, end: 3 }, loop: true },
      () => {},
    );
    expect(native.starts.at(-1)).toMatchObject({
      loop: true,
      loopStart: 2,
      loopEnd: 3,
      duration: undefined,
    });
    native.currentTime = 100.25;
    expect(loop.position).toBeCloseTo(2.25);
    expect(() => loop.seek(1.5)).toThrow('sprite region');
    loop.seek(2.9);
    expect(loop.position).toBeCloseTo(2.9);
  });

  it('rejects regions that are empty, reversed or beyond the decoded duration', () => {
    const native = new FakeContext();
    for (const region of [
      { start: 1, end: 1 },
      { start: 3, end: 2 },
      { start: -1, end: 2 },
      { start: 0, end: 11 },
      { start: Number.NaN, end: 2 },
    ])
      expect(
        () =>
          new SamplePlayback(
            native.context,
            native.buffer,
            native.createGain(),
            { region },
            () => {},
          ),
      ).toThrow();
  });
});

class FakeMedia extends EventTarget {
  static instances: FakeMedia[] = [];
  src = '';
  crossOrigin: string | null = null;
  preload = '';
  loop = false;
  playbackRate = 1;
  currentTime = 0;
  duration = Number.NaN;
  paused = true;
  error: { code: number } | null = null;
  playCalls = 0;
  constructor() {
    super();
    FakeMedia.instances.push(this);
  }
  play() {
    this.playCalls++;
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
  removeAttribute(name: string) {
    if (name === 'src') this.src = '';
  }
  load() {}
}

function engineWith(native: FakeContext) {
  const engine = new SampleAudioEngine({
    context: () => native.context,
    scene: () => undefined,
    volume: () => 1,
  });
  return engine;
}

async function opened(
  promise: Promise<unknown>,
  media = () => FakeMedia.instances.at(-1)!,
) {
  await Promise.resolve();
  media().dispatchEvent(new Event('canplay'));
  return promise;
}

describe('audio streaming', () => {
  it('routes a media element into the bus, autoplays and forwards transport controls', async () => {
    vi.stubGlobal('Audio', FakeMedia);
    FakeMedia.instances.length = 0;
    const native = new FakeContext();
    const engine = engineWith(native);
    const stream = (await opened(
      engine.stream('data:audio/wav;base64,AAAA', { loop: true, volume: 0.5 }),
    )) as import('../packages/audio/src/samples/stream.js').AudioStream;
    const media = FakeMedia.instances[0]!;
    expect(media.src).toBe('data:audio/wav;base64,AAAA');
    expect(media.loop).toBe(true);
    expect(stream.state).toBe('playing');
    expect(stream.volume).toBe(0.5);
    media.duration = 12;
    media.currentTime = 3;
    expect(stream.duration).toBe(12);
    expect(stream.position).toBe(3);
    stream.pause();
    expect(media.paused).toBe(true);
    expect(stream.state).toBe('paused');
    stream.seek(8);
    expect(media.currentTime).toBe(8);
    expect(() => stream.seek(-1)).toThrow();
    const ended = vi.fn();
    stream.loop = false;
    stream.addEventListener('ended', ended);
    await stream.play();
    media.dispatchEvent(new Event('ended'));
    expect(ended).toHaveBeenCalledTimes(1);
    expect(stream.state).toBe('ended');
    stream.stop();
    expect(stream.state).toBe('stopped');
    expect(native.media[0]!.connected).toBe(false);
    expect(media.src).toBe('');
    await expect(stream.play()).rejects.toThrow('stopped');
  });

  it('suspends and resumes samples and streams together, and holds new ones', async () => {
    vi.stubGlobal('Audio', FakeMedia);
    FakeMedia.instances.length = 0;
    const native = new FakeContext();
    const engine = engineWith(native);
    const stream = (await opened(
      engine.stream('data:audio/wav;base64,AAAA'),
    )) as import('../packages/audio/src/samples/stream.js').AudioStream;
    const sample = engine.play(native.buffer, {});
    const stoppedByUser = engine.play(native.buffer, {});
    stoppedByUser.pause();
    engine.suspend();
    expect(stream.state).toBe('paused');
    expect(sample.state).toBe('paused');
    const late = engine.play(native.buffer, {});
    expect(late.state).toBe('paused');
    const lateStream = opened(
      engine.stream('data:audio/wav;base64,BBBB'),
      () => FakeMedia.instances[1]!,
    );
    const held =
      (await lateStream) as import('../packages/audio/src/samples/stream.js').AudioStream;
    expect(held.state).toBe('paused');
    expect(FakeMedia.instances[1]!.playCalls).toBe(0);
    engine.resume();
    await Promise.resolve();
    expect(stream.state).toBe('playing');
    expect(sample.state).toBe('playing');
    expect(late.state).toBe('playing');
    expect(held.state).toBe('playing');
    // A playback the user had paused before the freeze stays paused.
    expect(stoppedByUser.state).toBe('paused');
    engine.destroy();
    expect(stream.state).toBe('stopped');
  });

  it('rejects bad URLs, failed loads and aborts, without leaking a stream', async () => {
    vi.stubGlobal('Audio', FakeMedia);
    FakeMedia.instances.length = 0;
    const native = new FakeContext();
    const engine = engineWith(native);
    await expect(engine.stream('ftp://example.com/a.ogg')).rejects.toThrow(
      'protocol',
    );
    await expect(
      engine.stream('data:audio/wav;base64,AAAA', { startTime: -1 }),
    ).rejects.toThrow();
    const failing = engine.stream('https://example.com/missing.ogg');
    await Promise.resolve();
    FakeMedia.instances[0]!.error = { code: 4 };
    FakeMedia.instances[0]!.dispatchEvent(new Event('error'));
    await expect(failing).rejects.toThrow('media error 4');
    expect(FakeMedia.instances[0]!.crossOrigin).toBe(null);
    const controller = new AbortController();
    const aborted = engine.stream('data:audio/wav;base64,CCCC', {
      signal: controller.signal,
    });
    await Promise.resolve();
    controller.abort(new Error('cancelled'));
    await expect(aborted).rejects.toThrow('cancelled');
    expect(native.media).toHaveLength(0);
    await expect(
      engine.stream('data:audio/wav;base64,DDDD', {
        signal: controller.signal,
      }),
    ).rejects.toThrow('cancelled');
  });
});

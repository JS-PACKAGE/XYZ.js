import { afterEach, describe, expect, it, vi } from 'vitest';
import { SampleAudioEngine } from '../packages/audio/src/samples/sample-audio.js';
import { SamplePlayback } from '../packages/audio/src/samples/sample-playback.js';
import type { Scene } from '../packages/core/src/scene.js';
import { gameplayAssetLimits } from '../src/data/gameplay-assets.js';
import { Object3D } from '../packages/core/src/object3d.js';
import { AudioTransformBinding } from '../packages/audio/src/bindings.js';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

class NativeAudioModel {
  currentTime = 0;
  state = 'running';
  destination = {};
  sources: Array<{
    buffer: AudioBuffer | null;
    loop: boolean;
    playbackRate: { value: number };
    onended: (() => void) | null;
    connect: () => void;
    disconnect: () => void;
    start: (time: number, offset: number) => void;
    stop: () => void;
  }> = [];
  buffer = {
    length: 48000,
    sampleRate: 48000,
    numberOfChannels: 1,
    duration: 1,
  } as AudioBuffer;
  decode = async () => this.buffer;

  createGain() {
    return {
      gain: { value: 1 },
      connect() {},
      disconnect() {},
    } as unknown as GainNode;
  }

  createPanner() {
    return {
      positionX: { value: 0 },
      positionY: { value: 0 },
      positionZ: { value: 0 },
      connect() {},
      disconnect() {},
    } as unknown as PannerNode;
  }

  createBufferSource() {
    const source = {
      buffer: null as AudioBuffer | null,
      loop: false,
      playbackRate: { value: 1 },
      onended: null as (() => void) | null,
      connect() {},
      disconnect() {},
      start() {},
      stop() {},
    };
    this.sources.push(source);
    return source as unknown as AudioBufferSourceNode;
  }

  decodeAudioData() {
    return this.decode();
  }

  get context() {
    return this as unknown as AudioContext;
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sample source timeline', () => {
  it('freezes during pause, preserves position across rate/seek/resume and ignores stale natural end', () => {
    const native = new NativeAudioModel();
    const playback = new SamplePlayback(
      native.context,
      native.buffer,
      native.createGain(),
      {},
      () => {},
    );
    native.currentTime = 0.25;
    expect(playback.position).toBe(0.25);
    const oldEnd = native.sources[0].onended!;
    playback.pause();
    native.currentTime = 9;
    expect(playback.state).toBe('paused');
    expect(playback.position).toBe(0.25);
    playback.playbackRate = 2;
    playback.seek(0.4);
    playback.resume();
    oldEnd();
    expect(playback.state).toBe('playing');
    native.currentTime = 9.1;
    expect(playback.position).toBeCloseTo(0.6);
    playback.playbackRate = 0.5;
    native.currentTime = 9.3;
    expect(playback.position).toBeCloseTo(0.7);
    playback.stop();
    expect(playback.state).toBe('stopped');
    native.currentTime = 100;
    expect(playback.position).toBeCloseTo(0.7);
    playback.resume();
    expect(playback.state).toBe('stopped');
  });

  it('does not advance before scheduled start, wraps loops and distinguishes natural end', () => {
    const native = new NativeAudioModel();
    const loop = new SamplePlayback(
      native.context,
      native.buffer,
      native.createGain(),
      { scheduledStartTime: 2, offset: 0.2, loop: true },
      () => {},
    );
    native.currentTime = 1;
    expect(loop.position).toBe(0.2);
    native.currentTime = 3.4;
    expect(loop.position).toBeCloseTo(0.6);
    loop.seek(0.8);
    native.currentTime = 3.7;
    expect(loop.position).toBeCloseTo(0.1);
    loop.stop();
    const finite = new SamplePlayback(
      native.context,
      native.buffer,
      native.createGain(),
      {},
      () => {},
    );
    native.sources.at(-1)!.onended!();
    expect(finite.state).toBe('ended');
    expect(finite.position).toBe(1);
    finite.stop();
    expect(finite.state).toBe('ended');
    expect(() => finite.seek(0)).toThrow('finished');
  });

  it('clamps past scheduled starts to now and rejects nonfinite/out-of-duration controls', () => {
    const native = new NativeAudioModel();
    native.currentTime = 10;
    const playback = new SamplePlayback(
      native.context,
      native.buffer,
      native.createGain(),
      { scheduledStartTime: 1, offset: 0.1 },
      () => {},
    );
    expect(playback.position).toBe(0.1);
    for (const invalid of [-1, NaN, Infinity, 1.01])
      expect(() => playback.seek(invalid)).toThrow();
    for (const invalid of [
      0,
      -1,
      NaN,
      Infinity,
      gameplayAssetLimits.playbackRate + 1,
    ])
      expect(() => {
        playback.playbackRate = invalid;
      }).toThrow();
    for (const invalid of [-1, 1.1, NaN])
      expect(() => {
        playback.volume = invalid;
      }).toThrow();
    expect(playback.playbackRate).toBe(1);
    expect(playback.volume).toBe(1);
    playback.stop();
  });

  it('requires every pause owner to release and retains a future start delay across pause', () => {
    const native = new NativeAudioModel();
    const playback = new SamplePlayback(
      native.context,
      native.buffer,
      native.createGain(),
      { scheduledStartTime: 2 },
      () => {},
    );
    native.currentTime = 0.5;
    playback.pause('manager');
    playback.pause('user');
    native.currentTime = 10;
    playback.resume('manager');
    expect(playback.state).toBe('paused');
    playback.resume('user');
    expect(playback.state).toBe('playing');
    native.currentTime = 11;
    expect(playback.position).toBe(0);
    native.currentTime = 11.75;
    expect(playback.position).toBeCloseTo(0.25);
    playback.stop();
    playback.resume('user');
    expect(playback.state).toBe('stopped');
  });

  it('follows parented world transforms and releases emitter ownership without destroying borrowed objects', () => {
    const native = new NativeAudioModel();
    const parent = new Object3D(),
      emitter = new Object3D();
    parent.position.x = 3;
    emitter.position.x = 2;
    parent.add(emitter);
    const playback = new SamplePlayback(
      native.context,
      native.buffer,
      native.createGain(),
      { spatial: { position: { x: 0, y: 0, z: 0 } } },
      () => {},
    );
    const binding = new AudioTransformBinding(
      emitter,
      playback,
      false,
      () => {},
    );
    expect(playback.position3D?.x).toBe(5);
    parent.position.x = -4;
    binding.update();
    expect(playback.position3D?.x).toBe(-2);
    parent.remove(emitter);
    binding.update();
    expect(playback.position3D?.x).toBe(2);
    binding.unbind(false);
    expect(playback.state).toBe('playing');
    expect(emitter.destroyed).toBe(false);
    const next = new AudioTransformBinding(emitter, playback, false, () => {});
    emitter.destroy();
    expect(next.destroyed).toBe(true);
    expect(playback.state).toBe('stopped');
    expect(parent.destroyed).toBe(false);
    parent.destroy();
  });
});

describe('sample cache and lifetime', () => {
  it('fetches once before unlock without decoding, then lazily decodes and reuses that buffer', async () => {
    const native = new NativeAudioModel();
    let unlocked = false;
    let decodes = 0;
    native.decode = async () => {
      decodes++;
      return native.buffer;
    };
    const fetcher = vi.fn(async () => new Response('encoded'));
    vi.stubGlobal('fetch', fetcher);
    const engine = new SampleAudioEngine({
      context: () => (unlocked ? native.context : undefined),
      scene: () => undefined,
      bus: () => native.createGain(),
    });
    const sample = await engine.load('https://example.test/tone.wav#one');
    expect(await engine.load('https://example.test/./tone.wav#two')).toBe(
      sample,
    );
    expect(sample.decoded).toBe(false);
    expect(sample.duration).toBeUndefined();
    await expect(sample.play()).rejects.toThrow('unlocked');
    await expect(sample.decode()).rejects.toThrow('unlocked');
    expect(decodes).toBe(0);
    expect(fetcher).toHaveBeenCalledTimes(1);
    unlocked = true;
    const [one, two] = await Promise.all([sample.play(), sample.play()]);
    expect(sample.duration).toBe(1);
    expect(decodes).toBe(1);
    one.stop();
    two.stop();
    engine.destroy();
  });

  it('preserves shared acquisition on subscriber abort and cancels late decode on destroy', async () => {
    const native = new NativeAudioModel();
    const download = deferred<Response>();
    const decoded = deferred<AudioBuffer>();
    native.decode = () => decoded.promise;
    vi.stubGlobal(
      'fetch',
      vi.fn(() => download.promise),
    );
    const engine = new SampleAudioEngine({
      context: () => native.context,
      scene: () => undefined,
      bus: () => native.createGain(),
    });
    const controller = new AbortController();
    const first = engine.load('https://example.test/a.wav', {
      signal: controller.signal,
    });
    const second = engine.load('https://example.test/a.wav');
    controller.abort();
    await expect(first).rejects.toMatchObject({ name: 'AbortError' });
    download.resolve(new Response('encoded'));
    const sample = await second;
    const pending = sample.play();
    await Promise.resolve();
    engine.destroy();
    await expect(pending).rejects.toThrow('destroyed');
    decoded.resolve(native.buffer);
    await Promise.resolve();
    await Promise.resolve();
    expect(sample.decoded).toBe(false);
    await expect(sample.play()).rejects.toThrow('destroyed');
  });

  it('stops scene-owned paused/playing handles but preserves persistent ones and enforces independent PCM capacity', async () => {
    const native = new NativeAudioModel();
    const scene = { destroyed: false } as Scene;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('encoded')),
    );
    const engine = new SampleAudioEngine({
      context: () => native.context,
      scene: () => scene,
      bus: () => native.createGain(),
    });
    const sample = await engine.load('https://example.test/a.wav');
    const owned = await sample.play();
    const paused = await sample.play();
    paused.pause();
    const persistent = await sample.play({ persistent: true, loop: true });
    engine.stopScene(scene);
    expect(owned.state).toBe('stopped');
    expect(paused.state).toBe('stopped');
    expect(persistent.state).toBe('playing');
    for (let index = 1; index < gameplayAssetLimits.samplePlaybacks; index++)
      await sample.play({ loop: true });
    await expect(sample.play()).rejects.toThrow('budget');
    engine.destroy();
    expect(persistent.state).toBe('stopped');
  });

  it('rejects decoded amplification beyond frames/channels/rate/value caps without reporting decoded-ready', async () => {
    const native = new NativeAudioModel();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('encoded')),
    );
    const engine = new SampleAudioEngine({
      context: () => native.context,
      scene: () => undefined,
      bus: () => native.createGain(),
    });
    const sample = await engine.load('https://example.test/a.wav');
    for (const buffer of [
      { ...native.buffer, length: gameplayAssetLimits.sampleFrames + 1 },
      {
        ...native.buffer,
        numberOfChannels: gameplayAssetLimits.sampleChannels + 1,
      },
      { ...native.buffer, sampleRate: gameplayAssetLimits.sampleRate + 1 },
      {
        ...native.buffer,
        length: gameplayAssetLimits.sampleFrames,
        numberOfChannels: 5,
      },
    ]) {
      native.buffer = buffer as AudioBuffer;
      await expect(sample.decode()).rejects.toThrow('budget');
      expect(sample.decoded).toBe(false);
    }
    engine.destroy();
  });

  it('rejects encoded overflow before decoding and permits an explicit retry after failure', async () => {
    const native = new NativeAudioModel();
    let decodes = 0;
    native.decode = async () => {
      decodes++;
      return native.buffer;
    };
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(new Uint8Array(gameplayAssetLimits.sampleBytes + 1)),
      )
      .mockResolvedValueOnce(new Response('valid encoded'));
    vi.stubGlobal('fetch', fetcher);
    const engine = new SampleAudioEngine({
      context: () => native.context,
      scene: () => undefined,
      bus: () => native.createGain(),
    });
    await expect(
      engine.load('https://example.test/a.wav'),
    ).rejects.toMatchObject({
      cause: {
        message: `Asset response exceeds ${gameplayAssetLimits.sampleBytes} bytes.`,
      },
    });
    expect(decodes).toBe(0);
    const sample = await engine.load('https://example.test/a.wav');
    await sample.decode();
    expect(sample.decoded).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(2);
    engine.destroy();
  });

  it('rejects a stalled fetch on destroy even when fetch ignores abort and discards its late result', async () => {
    const native = new NativeAudioModel();
    const download = deferred<Response>();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => download.promise),
    );
    const engine = new SampleAudioEngine({
      context: () => native.context,
      scene: () => undefined,
      bus: () => native.createGain(),
    });
    const pending = engine.load('https://example.test/a.wav');
    engine.destroy();
    await expect(pending).rejects.toThrow('destroyed');
    download.resolve(new Response('late encoded'));
    await Promise.resolve();
    await expect(engine.load('https://example.test/a.wav')).rejects.toThrow(
      'destroyed',
    );
  });

  it('does not retarget an in-flight play when its scene is destroyed during decode', async () => {
    const native = new NativeAudioModel();
    const decoded = deferred<AudioBuffer>();
    native.decode = () => decoded.promise;
    const original = { destroyed: false } as Scene;
    const next = { destroyed: false } as Scene;
    let current = original;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('encoded')),
    );
    const engine = new SampleAudioEngine({
      context: () => native.context,
      scene: () => current,
      bus: () => native.createGain(),
    });
    const sample = await engine.load('https://example.test/a.wav');
    const pending = sample.play();
    current = next;
    Object.assign(original, { destroyed: true });
    decoded.resolve(native.buffer);
    await expect(pending).rejects.toThrow('destroyed Scene');
    const playback = await sample.play();
    engine.stopScene(next);
    expect(playback.state).toBe('stopped');
    engine.destroy();
  });
});

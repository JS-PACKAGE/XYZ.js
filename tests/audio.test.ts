import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Scene } from '../packages/core/src/scene.js';
import {
  AudioAsset,
  AudioManager,
  type AudioNote,
} from '../packages/audio/src/audio-manager.js';
import { AudioError } from '../packages/audio/src/errors.js';
import type { OPMVoice } from '../packages/audio/src/opm-adapter.js';
import { assetLimits } from '../src/data/assets.js';

const mock = vi.hoisted(() => {
  const clock = { now: 0 };
  const api = {
    get now() {
      return clock.now;
    },
    unlocked: true,
    opm: undefined,
    unlock: vi.fn().mockResolvedValue(undefined),
    play: vi.fn(),
    stop: vi.fn(),
    reset: vi.fn(),
    setGain: vi.fn(),
    destroy: vi.fn(),
  };
  return { clock, api };
});

vi.mock('../packages/audio/src/opm-adapter.js', () => ({
  OPMAdapter: Object.assign(
    vi.fn(function () {
      return mock.api;
    }),
    {
      validateVoice: vi.fn(async (value: unknown) => value),
    },
  ),
}));

const voice: OPMVoice = {
  version: 1,
  name: 'test',
  algorithm: 4,
  feedback: 0,
  modIndex: 0,
  lfo: { rate: 0, amDepth: 0, pmDepth: 0 },
  ops: Array.from({ length: 4 }, () => ({
    ratio: 1,
    level: 1,
    detune: 0,
    adsr: { a: 0, d: 0, s: 1, r: 0.5 },
  })) as OPMVoice['ops'],
};

beforeEach(() => {
  mock.clock.now = 0;
  mock.api.unlocked = true;
  vi.clearAllMocks();
});

function asset(
  manager: AudioManager,
  notes: readonly AudioNote[],
  channel: 'music' | 'sfx' | 'ui' = 'sfx',
  loop = false,
  period = 1,
) {
  return new AudioAsset(manager, voice, notes, period, channel, loop);
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('AudioManager orchestration', () => {
  it('enforces the note count boundary before scheduling', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        async (url: string) =>
          new Response(
            JSON.stringify({
              voice,
              notes: Array.from(
                {
                  length:
                    assetLimits.audioNotes + (url.endsWith('large') ? 1 : 0),
                },
                () => ({ note: 60, time: 0, duration: 0.1 }),
              ),
            }),
          ),
      ),
    );
    const manager = new AudioManager(
      () => undefined,
      () => {},
    );
    expect(
      (await manager.load('https://example.test/exact')).notes.length,
    ).toBe(assetLimits.audioNotes);
    await expect(manager.load('https://example.test/large')).rejects.toThrow(
      'note count',
    );
    manager.destroy();
  });
  it('rejects non-fetchable URL protocols before any request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const manager = new AudioManager(
      () => undefined,
      () => {},
    );
    await expect(manager.load('file:///etc/passwd')).rejects.toMatchObject({
      cause: { message: 'Unsupported audio URL protocol.' },
    });
    expect(fetchMock).not.toHaveBeenCalled();
    manager.destroy();
  });

  it('rejects oversized audio before parsing JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(' '.repeat(assetLimits.audioBytes + 1)),
        ),
    );
    const manager = new AudioManager(
      () => undefined,
      () => {},
    );
    await expect(
      manager.load('https://example.test/large'),
    ).rejects.toMatchObject({
      cause: {
        message: `Asset response exceeds ${assetLimits.audioBytes} bytes.`,
      },
    });
    manager.destroy();
  });
  it('steals only the oldest SFX when eight slots are reserved, preserving BGM and UI', () => {
    vi.useFakeTimers();
    const { api } = mock;
    const manager = new AudioManager(
      () => undefined,
      () => {},
    );
    const note = [{ note: 60, time: 0, duration: 1 }];
    manager.play(asset(manager, note, 'music'));
    for (let index = 0; index < 7; index++) manager.play(asset(manager, note));
    expect(api.play.mock.calls.map((call) => call[0])).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7,
    ]);
    manager.play(asset(manager, note));
    expect(api.reset).toHaveBeenLastCalledWith(1);
    manager.play(asset(manager, note, 'ui'));
    expect(api.reset).toHaveBeenLastCalledWith(2);
    expect(api.play.mock.calls.at(-1)?.[0]).toBe(2);
    expect(api.reset).not.toHaveBeenCalledWith(0);
    manager.destroy();
  });

  it('updates active channel gains without accepting invalid volume', () => {
    vi.useFakeTimers();
    const { api } = mock;
    const manager = new AudioManager(
      () => undefined,
      () => {},
    );
    const note = [{ note: 60, time: 0, duration: 1 }];
    manager.play(asset(manager, note, 'music'));
    manager.play(asset(manager, note));
    manager.master.volume = 0.5;
    manager.music.volume = 0.25;
    expect(api.setGain).toHaveBeenLastCalledWith(1, 0.5);
    expect(api.setGain).toHaveBeenCalledWith(0, 0.125);
    expect(() => {
      manager.sfx.volume = Number.NaN;
    }).toThrow(AudioError);
    expect(manager.sfx.volume).toBe(1);
    manager.destroy();
  });

  it('reports a failed note and stops only that playback', () => {
    vi.useFakeTimers();
    const { api } = mock;
    const onError = vi.fn();
    const manager = new AudioManager(() => undefined, onError);
    const failure = new Error('Worklet port failed');
    api.play.mockImplementationOnce(() => {
      throw failure;
    });
    const first = manager.play(
      asset(manager, [{ note: 60, time: 0, duration: 1 }]),
    );
    expect(first.state).toBe('stopped');
    expect(onError).toHaveBeenCalledWith(failure);
    const second = manager.play(
      asset(manager, [{ note: 64, time: 0, duration: 1 }]),
    );
    expect(second.state).toBe('playing');
    manager.destroy();
  });

  it('stops scene-local future notes and releasing slots while retaining persistent tracks', () => {
    vi.useFakeTimers();
    const { clock, api } = mock;
    const scene = { destroyed: false } as Scene;
    const manager = new AudioManager(
      () => scene,
      () => {},
    );
    const local = manager.play(
      asset(manager, [
        { note: 60, time: 0, duration: 1 },
        { note: 62, time: 2, duration: 1 },
      ]),
    );
    const stopped = manager.play(
      asset(manager, [{ note: 67, time: 0, duration: 1 }]),
    );
    stopped.stop();
    const lastingAsset = asset(
      manager,
      [{ note: 72, time: 0, duration: 0.1 }],
      'music',
      true,
      0.4,
    );
    lastingAsset.persistent = true;
    const lasting = lastingAsset.play();
    api.reset.mockClear();
    manager.stopScene(scene);
    expect(local.state).toBe('stopped');
    expect(stopped.state).toBe('stopped');
    expect(lasting.state).toBe('playing');
    expect(api.reset.mock.calls.map((call) => call[0])).toEqual([0, 1]);
    clock.now = 2.01;
    vi.advanceTimersByTime(25);
    expect(api.play.mock.calls.some((call) => call[2] === 62)).toBe(false);
    expect(
      api.play.mock.calls.filter((call) => call[2] === 72).length,
    ).toBeGreaterThan(1);
    manager.destroy();
  });

  it('keeps a loop bounded after timer throttling rather than queueing the missed song', () => {
    vi.useFakeTimers();
    const { clock, api } = mock;
    const manager = new AudioManager(
      () => undefined,
      () => {},
    );
    const notes = Array.from({ length: 1000 }, (_, index) => ({
      note: 60,
      time: index * 0.1,
      duration: 0.02,
    }));
    manager.play(asset(manager, notes, 'music', true, 100));
    expect(api.play.mock.calls.length).toBeLessThanOrEqual(2);
    clock.now = 555.03;
    vi.advanceTimersByTime(25);
    expect(api.play.mock.calls.length).toBeLessThanOrEqual(4);
    manager.destroy();
  });

  it('rejects a loop period that would omit trailing notes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            voice,
            notes: [{ note: 60, time: 0.3, duration: 0.5 }],
            duration: 0.4,
            loop: true,
          }),
        ),
      ),
    );
    const manager = new AudioManager(
      () => undefined,
      () => {},
    );
    await expect(manager.load('https://example.test/bad.json')).rejects.toThrow(
      AudioError,
    );
    manager.destroy();
  });

  it('shares canonical pending requests, evicts failure, and aborts immediately on destroy', async () => {
    const first = deferred<Response>();
    const pending = deferred<Response>();
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            voice,
            notes: [{ note: 60, time: 0, duration: 0.1 }],
          }),
        ),
      )
      .mockReturnValueOnce(pending.promise);
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('document', { baseURI: 'https://example.test/game/' });
    const manager = new AudioManager(
      () => undefined,
      () => {},
    );
    const initial = manager.load('audio/../melody.json#intro');
    expect(manager.load('melody.json#verse')).toBe(initial);
    first.resolve({ ok: false, status: 404 } as Response);
    const failure = await initial.catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(AudioError);
    const loaded = await manager.load('melody.json');
    expect(loaded.notes[0].note).toBe(60);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const toAbort = manager.load('next.json');
    const signal = fetchMock.mock.calls[2][1].signal as AbortSignal;
    manager.destroy();
    expect(signal.aborted).toBe(true);
    await expect(toAbort).rejects.toThrow(AudioError);
    pending.resolve({ ok: true, json: vi.fn() } as unknown as Response);
    await Promise.resolve();
    await expect(manager.load('melody.json')).rejects.toThrow(AudioError);
  });
});

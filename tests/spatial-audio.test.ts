import { describe, expect, it } from 'vitest';
import { AudioError } from '../packages/audio/src/errors.js';
import { SamplePlayback } from '../packages/audio/src/samples/sample-playback.js';
import {
  AudioListenerState,
  checkSpatialOptions,
} from '../packages/audio/src/samples/spatial.js';

const param = () => ({ value: 0 });

function node(name: string, log: string[]) {
  return {
    name,
    gain: { value: 1 },
    connect(target: { name?: string }) {
      log.push(`${name}->${target.name ?? 'destination'}`);
    },
    disconnect() {
      log.push(`${name} disconnected`);
    },
  };
}

function nativeContext(log: string[]) {
  const panners: Array<Record<string, unknown>> = [];
  const context = {
    currentTime: 0,
    state: 'running',
    createGain: () => node('gain', log),
    createBufferSource: () => ({
      ...node('source', log),
      playbackRate: { value: 1 },
      onended: null,
      start() {},
      stop() {},
    }),
    createPanner: () => {
      const panner = {
        ...node('panner', log),
        positionX: param(),
        positionY: param(),
        positionZ: param(),
      };
      panners.push(panner);
      return panner;
    },
  };
  return { context: context as unknown as AudioContext, panners };
}

const buffer = { duration: 1 } as AudioBuffer;

describe('spatial sample playback', () => {
  it('routes gain through a configured panner into the bus and updates its position', () => {
    const log: string[] = [];
    const { context, panners } = nativeContext(log);
    const bus = node('bus', log) as unknown as GainNode;
    const playback = new SamplePlayback(
      context,
      buffer,
      bus,
      {
        spatial: {
          position: { x: 1, y: 2, z: 3 },
          distanceModel: 'linear',
          rolloffFactor: 0.5,
          maxDistance: 20,
          refDistance: 2,
          panningModel: 'HRTF',
        },
      },
      () => {},
    );
    expect(log).toContain('gain->panner');
    expect(log).toContain('panner->bus');
    expect(log).not.toContain('gain->bus');
    expect(panners[0]).toMatchObject({
      distanceModel: 'linear',
      rolloffFactor: 0.5,
      maxDistance: 20,
      refDistance: 2,
      panningModel: 'HRTF',
    });
    expect(playback.position3D).toEqual({ x: 1, y: 2, z: 3 });
    playback.position3D = { x: -4, y: 0, z: 9 };
    expect(playback.position3D).toEqual({ x: -4, y: 0, z: 9 });
    expect(() => {
      playback.position3D = { x: Number.NaN, y: 0, z: 0 };
    }).toThrow(AudioError);
    expect(playback.position3D).toEqual({ x: -4, y: 0, z: 9 });
    playback.stop();
    expect(log).toContain('panner disconnected');
  });

  it('keeps non-spatial playback on the direct bus path and rejects 3D moves', () => {
    const log: string[] = [];
    const { context, panners } = nativeContext(log);
    const bus = node('bus', log) as unknown as GainNode;
    const playback = new SamplePlayback(context, buffer, bus, {}, () => {});
    expect(panners).toHaveLength(0);
    expect(log).toContain('gain->bus');
    expect(playback.position3D).toBeUndefined();
    expect(() => {
      playback.position3D = { x: 0, y: 0, z: 0 };
    }).toThrow(AudioError);
  });

  it('rejects invalid spatial options before creating any node', () => {
    const log: string[] = [];
    const { context, panners } = nativeContext(log);
    const bus = node('bus', log) as unknown as GainNode;
    for (const spatial of [
      { position: { x: 0, y: Number.POSITIVE_INFINITY, z: 0 } },
      { position: { x: 0, y: 0, z: 0 }, refDistance: 0 },
      { position: { x: 0, y: 0, z: 0 }, rolloffFactor: -1 },
      {
        position: { x: 0, y: 0, z: 0 },
        distanceModel: 'linear' as const,
        rolloffFactor: 2,
      },
      {
        position: { x: 0, y: 0, z: 0 },
        distanceModel: 'linear' as const,
        refDistance: 5,
        maxDistance: 5,
      },
      { position: { x: 0, y: 0, z: 0 }, panningModel: 'bogus' as 'HRTF' },
    ])
      expect(
        () => new SamplePlayback(context, buffer, bus, { spatial }, () => {}),
      ).toThrow(AudioError);
    expect(panners).toHaveLength(0);
    expect(log).toEqual([]);
    expect(
      checkSpatialOptions({ position: { x: 0, y: 0, z: 0 } }),
    ).toMatchObject({ distanceModel: 'inverse', panningModel: 'equalpower' });
  });
});

describe('AudioListenerState', () => {
  function nativeListener() {
    const names = [
      'positionX',
      'positionY',
      'positionZ',
      'forwardX',
      'forwardY',
      'forwardZ',
      'upX',
      'upY',
      'upZ',
    ];
    return Object.fromEntries(names.map((name) => [name, param()]));
  }

  it('retains state before a context exists and replays it on apply', () => {
    const host: { context?: unknown } = {};
    const listener = new AudioListenerState(
      () => host.context as AudioContext | undefined,
    );
    listener.setPosition(1, 2, 3);
    listener.setOrientation({ x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 1 });
    const native = nativeListener();
    host.context = { state: 'running', listener: native };
    listener.apply();
    expect(native).toMatchObject({
      positionX: { value: 1 },
      positionY: { value: 2 },
      positionZ: { value: 3 },
      forwardX: { value: 1 },
      forwardZ: { value: 0 },
      upZ: { value: 1 },
    });
    listener.setPosition(9, 8, 7);
    expect(native.positionZ.value).toBe(7);
  });

  it('rejects degenerate orientation without changing state', () => {
    const listener = new AudioListenerState(() => undefined);
    for (const [forward, up] of [
      [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ],
      [
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 1, z: 0 },
      ],
      [
        { x: 0, y: 2, z: 0 },
        { x: 0, y: -1, z: 0 },
      ],
      [
        { x: Number.NaN, y: 0, z: 1 },
        { x: 0, y: 1, z: 0 },
      ],
    ] as const)
      expect(() => listener.setOrientation(forward, up)).toThrow(AudioError);
    expect(listener.forward).toEqual({ x: 0, y: 0, z: -1 });
    expect(() => listener.setPosition(0, Number.NaN, 0)).toThrow(AudioError);
    expect(listener.position).toEqual({ x: 0, y: 0, z: 0 });
  });
});

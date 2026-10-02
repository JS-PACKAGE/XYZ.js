import { describe, expect, it } from 'vitest';
import { GainTimeline } from '../packages/audio/src/gain-timeline.js';
import {
  PreparedAudioImpulse,
  snapshotEffects,
} from '../packages/audio/src/effects.js';

describe('audio gain automation', () => {
  it('cancels a ramp at the rendered value without jumping to the scheduled endpoint', () => {
    const envelope = new GainTimeline(1);
    envelope.ramp(0, 2, 4);
    expect(envelope.valueAt(1)).toBe(1);
    expect(envelope.valueAt(3)).toBeCloseTo(0.75);
    expect(envelope.cancel(4)).toBeCloseTo(0.5);
    expect(envelope.valueAt(5)).toBeCloseTo(0.5);
    envelope.ramp(1, 6, 2);
    expect(envelope.valueAt(7)).toBeCloseTo(0.75);
  });

  it('retains an exponential ramp slope across cancellation and rejects zero atomically', () => {
    const envelope = new GainTimeline(1);
    envelope.ramp(0.01, 0, 2, 'exponential');
    expect(envelope.valueAt(1)).toBeCloseTo(0.1);
    expect(() => envelope.ramp(0, 0.5, 1, 'exponential')).toThrow('zero');
    expect(envelope.valueAt(1)).toBeCloseTo(0.1);
    envelope.cancel(1);
    expect(envelope.valueAt(0.5)).toBeCloseTo(Math.sqrt(0.1));
    expect(envelope.valueAt(3)).toBeCloseTo(0.1);
  });

  it('cancels future changes without discarding the preceding interpolation', () => {
    const envelope = new GainTimeline(1);
    envelope.ramp(0.2, 0, 2);
    envelope.ramp(0.8, 4, 2);
    expect(envelope.cancel(3)).toBeCloseTo(0.2);
    expect(envelope.valueAt(1)).toBeCloseTo(0.6);
    expect(envelope.valueAt(10)).toBeCloseTo(0.2);
  });
});

describe('effect preparation ownership', () => {
  it('rejects disposed preparations and nonfinite impulse PCM before changing any graph', () => {
    const pcm = new Float32Array([1, 0.5, 0]);
    const buffer = {
      sampleRate: 48000,
      length: 3,
      numberOfChannels: 1,
      getChannelData: () => pcm,
    } as unknown as AudioBuffer;
    const impulse = new PreparedAudioImpulse(buffer);
    const descriptor = { type: 'reverb' as const, impulse, wet: 0.3 };
    impulse.dispose();
    expect(() => snapshotEffects([descriptor])).toThrow('live');

    pcm[1] = Number.NaN;
    expect(() => new PreparedAudioImpulse(buffer)).toThrow('finite');
  });
});

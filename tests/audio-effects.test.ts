import { describe, expect, it } from 'vitest';
import { audioDefaults } from '../src/data/audio.js';
import { GainTimeline } from '../packages/audio/src/gain-timeline.js';
import { AudioMixer } from '../packages/audio/src/mixer.js';
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

type ParamEvent = {
  kind: 'set' | 'linear' | 'exponential' | 'target';
  time: number;
  value: number;
  tau?: number;
};

/** Native automation model: independent event interpolation, not the engine's envelope class. */
class RenderParam {
  value = 1;
  events: ParamEvent[] = [];
  cancelAndHoldAtTime?: (time: number) => void;
  constructor(nativeHold = false) {
    if (nativeHold)
      this.cancelAndHoldAtTime = (time) => {
        const value = this.at(time);
        const crossing = this.events.find((event) => event.time > time);
        this.cancelScheduledValues(time);
        if (crossing?.kind === 'linear' || crossing?.kind === 'exponential')
          this.events.push({ kind: crossing.kind, time, value });
        else this.setValueAtTime(value, time);
      };
  }
  at(time: number): number {
    let value = this.value,
      previousTime = 0,
      target: ParamEvent | undefined;
    for (const event of this.events) {
      if (event.time > time) {
        if (event.kind === 'linear' || event.kind === 'exponential') {
          const t = (time - previousTime) / (event.time - previousTime);
          return event.kind === 'linear'
            ? value + (event.value - value) * t
            : value * (event.value / value) ** t;
        }
        break;
      }
      if (target)
        value =
          target.value +
          (value - target.value) *
            Math.exp(-(event.time - previousTime) / target.tau!);
      if (event.kind === 'target') target = event;
      else {
        value = event.value;
        target = undefined;
      }
      previousTime = event.time;
    }
    return target
      ? target.value +
          (value - target.value) *
            Math.exp(-(time - previousTime) / target.tau!)
      : value;
  }
  cancelScheduledValues(time: number): void {
    this.events = this.events.filter((event) => event.time < time);
  }
  setValueAtTime(value: number, time: number): void {
    this.events.push({ kind: 'set', value, time });
  }
  linearRampToValueAtTime(value: number, time: number): void {
    this.events.push({ kind: 'linear', value, time });
  }
  exponentialRampToValueAtTime(value: number, time: number): void {
    this.events.push({ kind: 'exponential', value, time });
  }
  setTargetAtTime(value: number, time: number, tau: number): void {
    this.events.push({ kind: 'target', value, time, tau });
  }
}

class RenderNode {
  readonly gain: RenderParam;
  readonly incoming = new Set<RenderNode>();
  readonly outgoing = new Set<RenderNode>();
  constructor(nativeHold: boolean) {
    this.gain = new RenderParam(nativeHold);
  }
  connect(node: RenderNode): void {
    this.outgoing.add(node);
    node.incoming.add(this);
  }
  disconnect(node?: RenderNode): void {
    if (node) {
      node.incoming.delete(this);
      this.outgoing.delete(node);
    } else {
      for (const output of this.outgoing) output.incoming.delete(this);
      this.outgoing.clear();
    }
  }
  render(time: number): number {
    let input = this.incoming.size ? 0 : 1;
    for (const node of this.incoming) input += node.render(time);
    return input * this.gain.at(time);
  }
}

class RenderContext {
  time = 0;
  clockStep = 0;
  readonly destination = new RenderNode(false);
  constructor(private readonly nativeHold: boolean) {}
  get currentTime(): number {
    const value = this.time;
    this.time += this.clockStep;
    return value;
  }
  createGain(): RenderNode {
    return new RenderNode(this.nativeHold);
  }
  createAnalyser(): RenderNode {
    return new RenderNode(this.nativeHold);
  }
  get context(): AudioContext {
    return this as unknown as AudioContext;
  }
}

describe('independent mixer clocks', () => {
  for (const nativeHold of [false, true])
    it(`holds each actually rendered local ramp after clocks diverge (native hold=${nativeHold})`, () => {
      const primary = new RenderContext(nativeHold),
        secondary = new RenderContext(nativeHold),
        mixer = new AudioMixer();
      primary.time = 10;
      secondary.time = 2;
      mixer.attach(primary.context);
      mixer.attach(secondary.context);
      mixer.automate('music', 0, 10, 4);
      primary.time = 12;
      secondary.time = 5.5;
      expect(mixer.cancelAutomation('music')).toBeCloseTo(0.5);
      const first = mixer.analyser('music', 0) as unknown as RenderNode,
        second = mixer.analyser('music', 1) as unknown as RenderNode;
      expect(first.render(20)).toBeCloseTo(0.5);
      expect(second.render(20)).toBeCloseTo(0.125);
      mixer.automate('music', 1, 13, 2);
      expect(first.render(14)).toBeCloseTo(0.75);
      expect(second.render(7.5)).toBeCloseTo(0.5625);
      mixer.destroy();
      expect(mixer.contextCount).toBe(0);
      expect(primary.destination.incoming.size).toBe(0);
      expect(secondary.destination.incoming.size).toBe(0);
    });

  it('keeps immediate gain changes valid when a clock advances at every read', () => {
    const native = new RenderContext(false),
      mixer = new AudioMixer();
    mixer.attach(native.context);
    native.time = 2;
    native.clockStep = 0.01;
    mixer.setGain('music', 0.4);
    const rendered = mixer.analyser('music') as unknown as RenderNode;
    expect(rendered.render(2)).toBeCloseTo(1);
    expect(rendered.render(2.005)).toBeCloseTo(0.4);
    mixer.destroy();
  });

  it('holds exponential ducking continuously across overlap and release', () => {
    const native = new RenderContext(false),
      mixer = new AudioMixer();
    mixer.attach(native.context);
    mixer.setDucking([
      { source: 'sfx', target: 'music', gain: 0.2, attack: 0.3, release: 0.6 },
    ]);
    const first = mixer.acquire('sfx');
    native.time = 0.1;
    const lead = audioDefaults.controlLead,
      rendered = mixer.analyser('music') as unknown as RenderNode,
      held = 0.2 + 0.8 * Math.exp(-(0.1 - lead) / 0.1);
    expect(rendered.render(0.1)).toBeCloseTo(held);
    const second = mixer.acquire('sfx');
    expect(rendered.render(0.1)).toBeCloseTo(held);
    first.release();
    native.time = 0.2;
    // Native control begins one lead ahead, so the attack curve is still unchanged now.
    const releasedFrom = 0.2 + 0.8 * Math.exp(-2);
    second.release();
    expect(rendered.render(0.2)).toBeCloseTo(
      0.2 + 0.8 * Math.exp(-(0.2 - lead) / 0.1),
    );
    expect(rendered.render(0.4)).toBeCloseTo(
      1 + (releasedFrom - 1) * Math.exp(-(0.2 - lead) / 0.2),
    );
    mixer.destroy();
  });

  for (const nativeHold of [false, true])
    it(`updates a same-target attack and removes an obsolete release (native hold=${nativeHold})`, () => {
      const native = new RenderContext(nativeHold),
        mixer = new AudioMixer();
      mixer.attach(native.context);
      mixer.setDucking([
        {
          source: 'sfx',
          target: 'music',
          gain: 0.2,
          attack: 0.3,
          release: 0.6,
        },
      ]);
      const first = mixer.acquire('sfx');
      native.time = 0.1;
      mixer.setDucking([
        {
          source: 'sfx',
          target: 'music',
          gain: 0.2,
          attack: 0.6,
          release: 0.6,
        },
      ]);
      const rendered = mixer.analyser('music') as unknown as RenderNode;
      const lead = audioDefaults.controlLead;
      expect(rendered.render(0.2)).toBeCloseTo(
        0.2 + 0.8 * Math.exp(-1 - (0.1 - lead) / 0.2),
      );
      native.time = 0.2;
      first.release(0.2);
      const releaseFrom = 0.2 + 0.8 * Math.exp(-2.5);
      expect(rendered.render(0.5)).toBeCloseTo(
        1 + (releaseFrom - 1) * Math.exp(-(0.1 - lead) / 0.2),
      );
      native.time = 0.3;
      mixer.acquire('sfx');
      // The new owner keeps ducking beyond the first owner's scheduled release.
      expect(rendered.render(0.6)).toBeCloseTo(
        0.2 + 0.8 * Math.exp(-2 - (0.3 - lead) / 0.2),
      );
      mixer.destroy();
    });
});

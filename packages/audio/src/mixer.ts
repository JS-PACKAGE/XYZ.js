import { audioDefaults } from '../../../src/data/audio.js';
import type { AudioChannelName } from './audio-manager.js';
import { AudioError } from './errors.js';
import {
  createEffectChain,
  snapshotEffects,
  type AudioEffect,
  type EffectChain,
} from './effects.js';
import { GainTimeline, type GainCurve } from './gain-timeline.js';

export type AudioBusName = AudioChannelName | 'master';
export interface AudioDuckingRule {
  readonly source: AudioChannelName;
  readonly target: AudioBusName;
  readonly gain: number;
  readonly attack?: number;
  readonly release?: number;
}
export interface AudioActivity {
  readonly released: boolean;
  /** A paused source does not duck. This does not release ownership. */
  setActive(active: boolean): void;
  release(after?: number): void;
}
interface ActivityRecord {
  channel: AudioChannelName;
  start: number;
  end: number;
  enabled: boolean;
}
interface DuckTarget {
  at: number;
  from: number;
  target: number;
  tau: number;
}
interface BusGraph {
  input: GainNode;
  volume: GainNode;
  duck: GainNode;
  duckPlan: DuckTarget[];
  analyser: AnalyserNode;
  chain: EffectChain;
  chainFadeStartedAt: number;
  retired: Array<{ chain: EffectChain; until: number }>;
}
interface ContextGraph {
  context: AudioContext;
  controlTime: number;
  envelopes: Record<AudioBusName, GainTimeline>;
  buses: Record<AudioBusName, BusGraph>;
}
const names: readonly AudioBusName[] = ['master', 'music', 'sfx', 'ui'];

/** Native setTargetAtTime approaches its target asymptotically, not with a finite ramp. */
function duckValueAt(
  plan: readonly DuckTarget[],
  time: number,
  initial = 1,
): number {
  for (let i = plan.length - 1; i >= 0; i--) {
    const event = plan[i]!;
    if (event.at <= time)
      return (
        event.target +
        (event.from - event.target) * Math.exp(-(time - event.at) / event.tau)
      );
  }
  return initial;
}

/** Shared immutable policies, but one complete native graph per actual AudioContext. */
export class AudioMixer {
  private readonly graphs = new Map<AudioContext, ContextGraph>();
  private readonly effects = {} as Record<AudioBusName, readonly AudioEffect[]>;
  private readonly envelopes = {} as Record<AudioBusName, GainTimeline>;
  private rules: readonly AudioDuckingRule[] = Object.freeze([]);
  private readonly activities = new Set<ActivityRecord>();
  private primary?: AudioContext;
  private disposed = false;
  private cleanupTimer?: number;

  constructor() {
    for (const name of names) {
      this.effects[name] = Object.freeze([]);
      this.envelopes[name] = new GainTimeline();
    }
  }
  get currentTime(): number {
    return this.primary?.currentTime ?? 0;
  }
  get contextCount(): number {
    return this.graphs.size;
  }
  getEffects(name: AudioBusName): readonly AudioEffect[] {
    return this.effects[name];
  }
  get ducking(): readonly AudioDuckingRule[] {
    return this.rules;
  }

  attach(context: AudioContext): void {
    if (this.disposed) throw new AudioError('Audio mixer has been destroyed.');
    if (this.graphs.has(context)) return;
    const previousPrimary = this.primary;
    this.primary ??= context;
    const contextNow = context.currentTime;
    const now = context === this.primary ? contextNow : this.currentTime;
    const graph: ContextGraph = {
      context,
      controlTime: contextNow,
      envelopes: {} as Record<AudioBusName, GainTimeline>,
      buses: {} as Record<AudioBusName, BusGraph>,
    };
    try {
      for (const name of names) {
        const input = context.createGain(),
          volume = context.createGain(),
          duck = context.createGain(),
          analyser = context.createAnalyser();
        const chain = createEffectChain(context, this.effects[name]);
        graph.buses[name] = {
          input,
          volume,
          duck,
          duckPlan: [],
          analyser,
          chain,
          chainFadeStartedAt: -Infinity,
          retired: [],
        };
        input.connect(chain.input);
        chain.output.connect(volume);
        volume.connect(duck);
        duck.connect(analyser);
        const envelope = this.envelopes[name].copy(contextNow - now);
        graph.envelopes[name] = envelope;
        envelope.apply(volume.gain, contextNow);
      }
      graph.buses.master.analyser.connect(context.destination);
      for (const name of ['music', 'sfx', 'ui'] as const)
        graph.buses[name].analyser.connect(graph.buses.master.input);
      this.graphs.set(context, graph);
      this.refreshDucking();
    } catch (error) {
      this.disposeGraph(graph);
      this.primary = previousPrimary;
      throw error;
    }
  }

  input(context: AudioContext, name: AudioBusName): GainNode {
    this.attach(context);
    return this.graphs.get(context)!.buses[name].input;
  }
  /** Borrowed analyser; its signals are local to this context, never a cross-context sum. */
  analyser(name: AudioBusName, contextIndex = 0): AnalyserNode | undefined {
    return [...this.graphs.values()][contextIndex]?.buses[name].analyser;
  }

  setEffects(name: AudioBusName, input: readonly AudioEffect[]): void {
    if (this.disposed) throw new AudioError('Audio mixer has been destroyed.');
    const effects = snapshotEffects(input);
    const prepared: Array<{ graph: ContextGraph; chain: EffectChain }> = [];
    try {
      for (const graph of this.graphs.values())
        prepared.push({
          graph,
          chain: createEffectChain(graph.context, effects),
        });
    } catch (error) {
      for (const item of prepared) item.chain.disconnect();
      throw error;
    }
    this.effects[name] = effects;
    for (const { graph, chain } of prepared) {
      const bus = graph.buses[name],
        now = graph.context.currentTime;
      chain.output.gain.setValueAtTime(0, now);
      chain.output.gain.linearRampToValueAtTime(
        1,
        now + audioDefaults.effectCrossfade,
      );
      // The current chain is either initially constant one or its known 0..1 fade-in.
      const held = Math.min(
        1,
        Math.max(
          0,
          (now - bus.chainFadeStartedAt) / audioDefaults.effectCrossfade,
        ),
      );
      if (
        held < 1 &&
        typeof bus.chain.output.gain.cancelAndHoldAtTime === 'function'
      )
        bus.chain.output.gain.cancelAndHoldAtTime(now);
      else {
        bus.chain.output.gain.cancelScheduledValues(now);
        bus.chain.output.gain.setValueAtTime(held, now);
      }
      bus.chain.output.gain.linearRampToValueAtTime(
        0,
        now + audioDefaults.effectCrossfade,
      );
      bus.input.connect(chain.input);
      chain.output.connect(bus.volume);
      bus.retired.push({
        chain: bus.chain,
        until: now + audioDefaults.effectCrossfade,
      });
      bus.chain = chain;
      bus.chainFadeStartedAt = now;
    }
    if (prepared.length && !this.cleanupTimer)
      this.cleanupTimer = setInterval(
        () => this.collect(),
        audioDefaults.tickMs,
      );
  }

  setGain(name: AudioBusName, value: number): void {
    const now = this.currentTime;
    this.scheduleGain(
      name,
      value,
      now,
      audioDefaults.gainSmoothing,
      'linear',
      now,
    );
  }
  automate(
    name: AudioBusName,
    value: number,
    time: number,
    duration: number,
    curve: GainCurve = 'linear',
  ): void {
    this.scheduleGain(name, value, time, duration, curve, this.currentTime);
  }

  private scheduleGain(
    name: AudioBusName,
    value: number,
    time: number,
    duration: number,
    curve: GainCurve,
    now: number,
  ): void {
    if (this.disposed) throw new AudioError('Audio mixer has been destroyed.');
    if (time < now)
      throw new AudioError('Gain automation cannot start in the past.');
    this.envelopes[name].validateRamp(value, time, duration, curve);
    // Capture every clock before mutating any envelope; preparation is atomic across contexts.
    for (const graph of this.graphs.values()) {
      graph.controlTime =
        graph.context === this.primary ? now : graph.context.currentTime;
      graph.envelopes[name].validateRamp(
        value,
        graph.controlTime + (time - now),
        duration,
        curve,
      );
    }
    this.envelopes[name].ramp(value, time, duration, curve);
    for (const graph of this.graphs.values()) {
      const contextNow = graph.controlTime,
        start = contextNow + (time - now);
      const envelope = graph.envelopes[name],
        param = graph.buses[name].volume.gain;
      const from = envelope.valueAt(start),
        ramping = envelope.isRampingAt(start);
      envelope.ramp(value, start, duration, curve);
      if (typeof param.cancelAndHoldAtTime === 'function') {
        param.cancelAndHoldAtTime(start);
        if (duration === 0) param.setValueAtTime(value, start);
        else {
          // cancelAndHold is a no-op on a constant parameter: anchor a delayed ramp explicitly.
          if (!ramping) param.setValueAtTime(from, start);
          if (curve === 'exponential')
            param.exponentialRampToValueAtTime(value, start + duration);
          else param.linearRampToValueAtTime(value, start + duration);
        }
      } else envelope.apply(param, contextNow);
    }
  }
  cancelAutomation(name: AudioBusName, time?: number): number {
    if (this.disposed) throw new AudioError('Audio mixer has been destroyed.');
    const now = this.currentTime;
    time ??= now;
    if (!Number.isFinite(time) || time < now)
      throw new AudioError('Cancellation time must not be in the past.');
    const envelope = this.envelopes[name];
    const value = envelope.cancel(time);
    for (const graph of this.graphs.values()) {
      const contextNow =
        graph.context === this.primary ? now : graph.context.currentTime;
      const at = contextNow + (time - now);
      const local = graph.envelopes[name],
        param = graph.buses[name].volume.gain;
      local.cancel(at);
      if (typeof param.cancelAndHoldAtTime === 'function')
        param.cancelAndHoldAtTime(at);
      else local.apply(param, contextNow);
    }
    return value;
  }

  setDucking(input: readonly AudioDuckingRule[]): void {
    if (this.disposed) throw new AudioError('Audio mixer has been destroyed.');
    this.rules = Object.freeze(
      input.map((rule) => {
        if (
          !['music', 'sfx', 'ui'].includes(rule.source) ||
          !names.includes(rule.target) ||
          !Number.isFinite(rule.gain) ||
          rule.gain < 0 ||
          rule.gain > 1 ||
          !Number.isFinite(rule.attack ?? audioDefaults.duckAttack) ||
          (rule.attack ?? audioDefaults.duckAttack) < 0 ||
          !Number.isFinite(rule.release ?? audioDefaults.duckRelease) ||
          (rule.release ?? audioDefaults.duckRelease) < 0
        )
          throw new AudioError('Invalid audio ducking rule.');
        return Object.freeze({ ...rule });
      }),
    );
    this.refreshDucking();
  }

  /** Activity lasts through an optional native-time reservation, including OPM release tails. */
  acquire(
    channel: AudioChannelName,
    delay = 0,
    duration = Infinity,
  ): AudioActivity {
    if (this.disposed) throw new AudioError('Audio mixer has been destroyed.');
    if (
      !Number.isFinite(delay) ||
      delay < 0 ||
      duration <= 0 ||
      Number.isNaN(duration)
    )
      throw new AudioError('Invalid audio activity interval.');
    const now = this.currentTime;
    const record: ActivityRecord = {
      channel,
      start: now + delay,
      end: now + delay + duration,
      enabled: true,
    };
    this.activities.add(record);
    this.refreshDucking();
    let released = false;
    return {
      get released() {
        return released;
      },
      setActive: (active) => {
        if (released || record.enabled === active) return;
        record.enabled = active;
        this.refreshDucking();
      },
      release: (after = 0) => {
        if (!Number.isFinite(after) || after < 0)
          throw new AudioError('Activity release delay must be nonnegative.');
        if (released && (after > 0 || !this.activities.has(record))) return;
        released = true;
        if (after === 0) this.activities.delete(record);
        else {
          record.end = Math.min(record.end, this.currentTime + after);
          if (!this.cleanupTimer)
            this.cleanupTimer = setInterval(
              () => this.collect(),
              audioDefaults.tickMs,
            );
        }
        if (!this.disposed) this.refreshDucking();
      },
    };
  }

  private refreshDucking(): void {
    const now = this.currentTime;
    const boundaries = new Set<number>([now]);
    for (const activity of this.activities) {
      if (!activity.enabled) continue;
      if (activity.start > now) boundaries.add(activity.start);
      if (Number.isFinite(activity.end) && activity.end > now)
        boundaries.add(activity.end);
    }
    const times = [...boundaries].sort((a, b) => a - b);
    for (const graph of this.graphs.values()) {
      const contextNow =
        graph.context === this.primary ? now : graph.context.currentTime;
      for (const name of names) {
        const bus = graph.buses[name],
          param = bus.duck.gain;
        // One captured clock serves every bus in this context for this control operation.
        // Keep the exact rendered target envelope; AudioParam.value is not a held value.
        const held = duckValueAt(bus.duckPlan, contextNow);
        let previousTarget: number | undefined;
        for (const time of times) {
          let target = 1,
            attack = 0,
            release = 0;
          for (const rule of this.rules) {
            if (rule.target !== name) continue;
            release = Math.max(
              release,
              rule.release ?? audioDefaults.duckRelease,
            );
            let active = false;
            for (const activity of this.activities)
              if (
                activity.enabled &&
                activity.channel === rule.source &&
                activity.start <= time &&
                activity.end > time
              ) {
                active = true;
                break;
              }
            if (active && rule.gain < target) {
              target = rule.gain;
              attack = rule.attack ?? audioDefaults.duckAttack;
            }
          }
          if (target === previousTarget) continue;
          const at = contextNow + (time - now);
          const tau =
            Math.max(
              audioDefaults.gainSmoothing,
              target < (previousTarget ?? held) ? attack : release,
            ) / 3;
          if (previousTarget === undefined) {
            const previous = bus.duckPlan[0];
            // Overlapping owners do not restart an unchanged native envelope.
            // Repeated hold/target calls can introduce a render-boundary step.
            if (
              bus.duckPlan.length === 1 &&
              previous &&
              previous.at <= contextNow &&
              previous.target === target &&
              previous.tau === tau
            ) {
              previousTarget = target;
              continue;
            }
            if (typeof param.cancelAndHoldAtTime === 'function')
              param.cancelAndHoldAtTime(contextNow);
            else {
              param.cancelScheduledValues(contextNow);
              param.setValueAtTime(held, contextNow);
            }
            bus.duckPlan.length = 0;
          }
          // Every future boundary starts at the previous target's exact exponential value.
          const from = duckValueAt(bus.duckPlan, at, held);
          param.setTargetAtTime(target, at, tau);
          bus.duckPlan.push({ at, from, target, tau });
          previousTarget = target;
        }
      }
    }
  }

  private collect(): void {
    let pending = false;
    const now = this.currentTime;
    for (const activity of this.activities) {
      if (activity.end <= now) this.activities.delete(activity);
      else if (Number.isFinite(activity.end)) pending = true;
    }
    for (const graph of this.graphs.values()) {
      const contextNow =
        graph.context === this.primary ? now : graph.context.currentTime;
      for (const name of names) {
        const bus = graph.buses[name];
        for (let i = bus.retired.length - 1; i >= 0; i--) {
          const retired = bus.retired[i]!;
          if (contextNow < retired.until) {
            pending = true;
            continue;
          }
          bus.input.disconnect(retired.chain.input);
          retired.chain.disconnect();
          bus.retired.splice(i, 1);
        }
      }
    }
    if (!pending) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
  /** @internal Failed unlock rolls back native graphs but retains configured policies. */
  clearContexts(): void {
    clearInterval(this.cleanupTimer);
    this.cleanupTimer = undefined;
    for (const graph of this.graphs.values()) this.disposeGraph(graph);
    this.graphs.clear();
    this.primary = undefined;
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    clearInterval(this.cleanupTimer);
    this.clearContexts();
    this.activities.clear();
  }
  private disposeGraph(graph: ContextGraph): void {
    for (const bus of Object.values(graph.buses)) {
      bus.input.disconnect();
      bus.volume.disconnect();
      bus.duck.disconnect();
      bus.analyser.disconnect();
      bus.chain.disconnect();
      for (const retired of bus.retired) retired.chain.disconnect();
    }
  }
}

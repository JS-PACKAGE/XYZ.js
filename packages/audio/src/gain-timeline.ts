import { AudioError } from './errors.js';

export type GainCurve = 'linear' | 'exponential';
interface GainSegment {
  readonly start: number;
  readonly end: number;
  readonly from: number;
  readonly to: number;
  readonly curve: GainCurve;
}

/** Deterministic envelope used to hold/cancel automation without trusting AudioParam.value,
 * which is not the rendered value of a future ramp on every browser. */
export class GainTimeline {
  private segments: GainSegment[] = [];
  constructor(private initial = 1) {}

  valueAt(time: number): number {
    let value = this.initial;
    for (const segment of this.segments) {
      if (time < segment.start) break;
      if (time >= segment.end) {
        value = segment.to;
        continue;
      }
      const t = (time - segment.start) / (segment.end - segment.start);
      return segment.curve === 'linear'
        ? segment.from + (segment.to - segment.from) * t
        : segment.from * (segment.to / segment.from) ** t;
    }
    return value;
  }

  isRampingAt(time: number): boolean {
    for (const segment of this.segments)
      if (segment.start <= time && segment.end > time) return true;
    return false;
  }
  /** Copies schedules onto another context's captured clock, without sharing mutable segments. */
  copy(offset: number): GainTimeline {
    const result = new GainTimeline(this.initial);
    result.segments = this.segments.map((segment) => ({
      ...segment,
      start: segment.start + offset,
      end: segment.end + offset,
    }));
    return result;
  }

  validateRamp(
    value: number,
    start: number,
    duration: number,
    curve: GainCurve = 'linear',
  ): number {
    if (
      !Number.isFinite(value) ||
      value < 0 ||
      value > 1 ||
      !Number.isFinite(start) ||
      start < 0 ||
      !Number.isFinite(duration) ||
      duration < 0
    )
      throw new AudioError(
        'Gain automation requires gain 0..1 and nonnegative finite time/duration.',
      );
    if (curve !== 'linear' && curve !== 'exponential')
      throw new AudioError('Unknown gain automation curve.');
    const from = this.valueAt(start);
    if (curve === 'exponential' && (from <= 0 || value <= 0))
      throw new AudioError('Exponential gain automation cannot touch zero.');
    return from;
  }

  ramp(
    value: number,
    start: number,
    duration: number,
    curve: GainCurve = 'linear',
  ): void {
    const from = this.validateRamp(value, start, duration, curve);
    this.cancel(start);
    this.segments.push({
      start,
      end: start + duration,
      from,
      to: value,
      curve,
    });
  }

  cancel(time: number): number {
    const value = this.valueAt(time);
    const kept: GainSegment[] = [];
    for (const segment of this.segments) {
      if (segment.start >= time) break;
      if (segment.end > time) kept.push({ ...segment, end: time, to: value });
      else kept.push(segment);
    }
    this.segments = kept;
    return value;
  }

  /** Replays only the current/future envelope onto an independent native context clock. */
  apply(param: AudioParam, now: number, offset = 0): void {
    param.cancelScheduledValues(now + offset);
    param.setValueAtTime(this.valueAt(now), now + offset);
    for (const segment of this.segments) {
      if (segment.end < now) continue;
      if (segment.start > now)
        param.setValueAtTime(segment.from, segment.start + offset);
      const end = Math.max(now, segment.end) + offset;
      if (segment.curve === 'exponential')
        param.exponentialRampToValueAtTime(segment.to, end);
      else param.linearRampToValueAtTime(segment.to, end);
    }
  }
}

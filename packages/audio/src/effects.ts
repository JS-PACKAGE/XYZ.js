import { audioDefaults } from '../../../src/data/audio.js';
import { AudioError } from './errors.js';

export interface BiquadEffect {
  readonly type: 'biquad';
  readonly filter: BiquadFilterType;
  readonly frequency: number;
  readonly Q?: number;
  readonly gain?: number;
  readonly detune?: number;
}
export interface CompressorEffect {
  readonly type: 'compressor';
  readonly threshold?: number;
  readonly knee?: number;
  readonly ratio?: number;
  readonly attack?: number;
  readonly release?: number;
}
export interface ReverbEffect {
  readonly type: 'reverb';
  readonly impulse: PreparedAudioImpulse;
  readonly wet?: number;
  readonly normalize?: boolean;
}
export type AudioEffect = BiquadEffect | CompressorEffect | ReverbEffect;

function range(value: number, min: number, max: number, name: string): void {
  if (!Number.isFinite(value) || value < min || value > max)
    throw new AudioError(`${name} must be within ${min}..${max}.`);
}

interface ImpulsePreparation {
  readonly channels: readonly Float32Array<ArrayBuffer>[];
  readonly buffers: WeakMap<BaseAudioContext, AudioBuffer>;
}
const preparations = new WeakMap<PreparedAudioImpulse, ImpulsePreparation>();

/** Owns a private PCM snapshot, never the caller's AudioBuffer. Disposal prevents new uses;
 * graphs already retaining this preparation keep their buffers until disconnected. */
export class PreparedAudioImpulse {
  #disposed = false;
  readonly sampleRate: number;
  readonly length: number;
  readonly numberOfChannels: number;

  constructor(buffer: AudioBuffer) {
    this.sampleRate = buffer.sampleRate;
    this.length = buffer.length;
    this.numberOfChannels = buffer.numberOfChannels;
    if (![1, 2, 4].includes(this.numberOfChannels))
      throw new AudioError('Convolution impulses require 1, 2 or 4 channels.');
    range(
      this.sampleRate,
      8000,
      audioDefaults.impulseSampleRate,
      'Impulse sample rate',
    );
    range(
      this.length,
      1,
      audioDefaults.impulseValues / this.numberOfChannels,
      'Impulse frames',
    );
    const channels = Array.from({ length: this.numberOfChannels }, (_, i) => {
      const copy = buffer.getChannelData(i).slice();
      for (const value of copy)
        if (!Number.isFinite(value))
          throw new AudioError('Impulse PCM must be finite.');
      return copy;
    });
    preparations.set(this, { channels, buffers: new WeakMap() });
    Object.freeze(this);
  }

  get destroyed(): boolean {
    return this.#disposed;
  }
  dispose(): void {
    this.#disposed = true;
    preparations.delete(this);
  }
}

/** Validation and copying happen before changing any live graph. */
export function snapshotEffects(
  input: readonly AudioEffect[],
): readonly AudioEffect[] {
  if (input.length > audioDefaults.effectsPerBus)
    throw new AudioError('Audio effect budget is exhausted.');
  const filters: readonly string[] = [
    'lowpass',
    'highpass',
    'bandpass',
    'lowshelf',
    'highshelf',
    'peaking',
    'notch',
    'allpass',
  ];
  return Object.freeze(
    input.map((effect) => {
      switch (effect.type) {
        case 'biquad':
          if (!filters.includes(effect.filter))
            throw new AudioError('Unknown biquad filter.');
          range(
            effect.frequency,
            0,
            audioDefaults.impulseSampleRate / 2,
            'Filter frequency',
          );
          range(effect.Q ?? 1, 0, 1000, 'Filter Q');
          range(effect.gain ?? 0, -40, 40, 'Filter gain');
          range(effect.detune ?? 0, -12000, 12000, 'Filter detune');
          return Object.freeze({ ...effect });
        case 'compressor':
          range(effect.threshold ?? -24, -100, 0, 'Compressor threshold');
          range(effect.knee ?? 30, 0, 40, 'Compressor knee');
          range(effect.ratio ?? 12, 1, 20, 'Compressor ratio');
          range(effect.attack ?? 0.003, 0, 1, 'Compressor attack');
          range(effect.release ?? 0.25, 0, 1, 'Compressor release');
          return Object.freeze({ ...effect });
        case 'reverb':
          if (
            !(effect.impulse instanceof PreparedAudioImpulse) ||
            effect.impulse.destroyed
          )
            throw new AudioError('Reverb needs a live PreparedAudioImpulse.');
          range(effect.wet ?? 0.5, 0, 1, 'Reverb wet gain');
          return Object.freeze({ ...effect });
        default:
          throw new AudioError('Unknown audio effect.');
      }
    }),
  );
}

export interface EffectChain {
  readonly input: GainNode;
  readonly output: GainNode;
  disconnect(): void;
}

/** Native nodes only: no replacement of the official OPM DSP. */
export function createEffectChain(
  context: BaseAudioContext,
  effects: readonly AudioEffect[],
): EffectChain {
  const nodes: AudioNode[] = [];
  const gain = (): GainNode => {
    const node = context.createGain();
    nodes.push(node);
    return node;
  };
  const input = gain();
  let tail: AudioNode = input;
  try {
    for (const effect of effects) {
      if (effect.type === 'biquad') {
        const node = context.createBiquadFilter();
        nodes.push(node);
        node.type = effect.filter;
        node.frequency.value = Math.min(
          effect.frequency,
          context.sampleRate / 2,
        );
        node.Q.value = effect.Q ?? 1;
        node.gain.value = effect.gain ?? 0;
        node.detune.value = effect.detune ?? 0;
        tail.connect(node);
        tail = node;
      } else if (effect.type === 'compressor') {
        const node = context.createDynamicsCompressor();
        nodes.push(node);
        node.threshold.value = effect.threshold ?? -24;
        node.knee.value = effect.knee ?? 30;
        node.ratio.value = effect.ratio ?? 12;
        node.attack.value = effect.attack ?? 0.003;
        node.release.value = effect.release ?? 0.25;
        tail.connect(node);
        tail = node;
      } else {
        const convolver = context.createConvolver();
        nodes.push(convolver);
        convolver.normalize = effect.normalize ?? true;
        const preparation = preparations.get(effect.impulse);
        if (!preparation)
          throw new AudioError('Audio impulse preparation has been disposed.');
        let buffer = preparation.buffers.get(context);
        if (!buffer) {
          buffer = context.createBuffer(
            effect.impulse.numberOfChannels,
            effect.impulse.length,
            effect.impulse.sampleRate,
          );
          for (let i = 0; i < preparation.channels.length; i++)
            buffer.copyToChannel(preparation.channels[i]!, i);
          preparation.buffers.set(context, buffer);
        }
        convolver.buffer = buffer;
        const dry = gain(),
          wet = gain(),
          sum = gain();
        dry.gain.value = 1 - (effect.wet ?? 0.5);
        wet.gain.value = effect.wet ?? 0.5;
        tail.connect(dry);
        dry.connect(sum);
        tail.connect(convolver);
        convolver.connect(wet);
        wet.connect(sum);
        tail = sum;
      }
    }
    const output = gain();
    tail.connect(output);
    return {
      input,
      output,
      disconnect: () => {
        for (const node of nodes) node.disconnect();
      },
    };
  } catch (error) {
    for (const node of nodes) node.disconnect();
    throw error;
  }
}

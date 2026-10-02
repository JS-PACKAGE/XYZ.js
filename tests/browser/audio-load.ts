import {
  Game,
  Scene,
  type AudioStream,
  type SamplePlayback,
} from '../../src/index.js';

const output = document.querySelector<HTMLPreElement>('#report')!;
const unlock = document.querySelector<HTMLButtonElement>('#unlock')!;
const run = document.querySelector<HTMLButtonElement>('#run')!;
const report = {
  userAgent: navigator.userAgent,
  physicalDeviceCertification: false,
  safariCertification: false,
  silence: {
    nativeZeroGainDestinations: 0,
    routedMediaRequests: 0,
    directMediaRequestsRejected: 0,
    physicalAudibleGate: 'blocked: user prohibits sound',
  },
  gestures: [] as boolean[],
  contexts: 0,
  arrivals: [] as {
    requested: number;
    captured: number;
    delivered: number;
    target: number;
    tau: number;
  }[],
  errors: [] as unknown[],
  expectedCancellation: false,
  baseline: 0,
  filtered: 0,
  nativeReference: undefined as unknown,
  pauseClockAdvance: [] as number[],
  resumeClockAdvance: [] as number[],
  nativeResumeRequests: 0,
  cleanup: undefined as unknown,
};
function detail(error: unknown, depth = 0): unknown {
  if (!(error instanceof Error)) return String(error);
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    cause:
      depth < 6 && error.cause !== undefined
        ? detail(error.cause, depth + 1)
        : undefined,
  };
}
function publish(state: string): void {
  output.dataset.state = state;
  output.textContent = JSON.stringify(report, null, 2);
}
function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}
const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));
function rms(analyser: AnalyserNode): number {
  const pcm = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(pcm);
  let energy = 0;
  for (const value of pcm) energy += value * value;
  return Math.sqrt(energy / pcm.length);
}
async function signal(analyser: AnalyserNode): Promise<number> {
  const deadline = performance.now() + 5000;
  while (performance.now() < deadline) {
    const value = rms(analyser);
    if (value > 0.01) return value;
    await sleep(20);
  }
  throw new Error(
    'Native PCM did not arrive within five seconds; playback is not retried.',
  );
}
function wave(constant: boolean, sampleRate = 48000): Blob {
  const frames = sampleRate * 2,
    frameBytes = constant ? 4 : 2,
    bytes = new ArrayBuffer(44 + frames * frameBytes),
    view = new DataView(bytes);
  const text = (offset: number, value: string): void => {
    for (let i = 0; i < value.length; i++)
      view.setUint8(offset + i, value.charCodeAt(i));
  };
  text(0, 'RIFF');
  view.setUint32(4, bytes.byteLength - 8, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, constant ? 3 : 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * frameBytes, true);
  view.setUint16(32, frameBytes, true);
  view.setUint16(34, frameBytes * 8, true);
  text(36, 'data');
  view.setUint32(40, frames * frameBytes, true);
  for (let i = 0; i < frames; i++) {
    // Match the independent .25 reference without decoder normalization or resampling.
    if (constant) view.setFloat32(44 + i * frameBytes, 0.25, true);
    else
      view.setInt16(
        44 + i * frameBytes,
        Math.sin((i * 2 * Math.PI * 220) / sampleRate) * 8192,
        true,
      );
  }
  return new Blob([bytes], { type: 'audio/wav' });
}

const urls = [URL.createObjectURL(wave(false))];
const streams: AudioStream[] = [],
  samples: SamplePlayback[] = [];
let game: Game | undefined;
let recorder: AudioWorkletNode | undefined;
let referenceSource: ConstantSourceNode | undefined;
let referenceVolume: GainNode | undefined;
let referenceDuck: GainNode | undefined;
let primary: AudioContext | undefined;
const contexts = new Set<AudioContext>();
const resumeRequests: Promise<void>[] = [];
const nativeResume = AudioContext.prototype.resume;
AudioContext.prototype.resume = function (): Promise<void> {
  const request = nativeResume.call(this);
  resumeRequests.push(request);
  return request;
};
const NativeAudioContext = globalThis.AudioContext;
// Capture construction, including official contexts still awaiting worklet startup/teardown.
globalThis.AudioContext = new Proxy(NativeAudioContext, {
  construct(target, args, newTarget) {
    const context = Reflect.construct(target, args, newTarget) as AudioContext;
    contexts.add(context);
    return context;
  },
});
const paramContexts = new WeakMap<AudioParam, AudioContext>();
const createGain = AudioContext.prototype.createGain;
const setTarget = AudioParam.prototype.setTargetAtTime;
const connect = AudioNode.prototype.connect;
const connectNode = connect as (
  this: AudioNode,
  destination: AudioNode,
  output?: number,
  input?: number,
) => AudioNode;
const connectParam = connect as (
  this: AudioNode,
  destination: AudioParam,
  output?: number,
) => void;
const safetySinks = new Map<BaseAudioContext, GainNode>();
const createMediaSource = AudioContext.prototype.createMediaElementSource;
const nativePlay = HTMLMediaElement.prototype.play;
const routedMedia = new WeakSet<HTMLMediaElement>();
// Install before unlock/play. All physical connections pass through a native zero-gain sink;
// analysers/reference recording remain upstream, so silence cannot masquerade as PCM evidence.
AudioNode.prototype.connect = function (
  this: AudioNode,
  destination: AudioNode | AudioParam,
  outputIndex: number = 0,
  inputIndex: number = 0,
): AudioNode | void {
  if (destination instanceof AudioDestinationNode) {
    let sink = safetySinks.get(destination.context);
    if (!sink) {
      sink = createGain.call(destination.context);
      sink.gain.value = 0;
      sink.gain.setValueAtTime(0, 0);
      safetySinks.set(destination.context, sink);
      connectNode.call(sink, destination);
      report.silence.nativeZeroGainDestinations = safetySinks.size;
    }
    connectNode.call(this, sink, outputIndex, inputIndex);
    // Web Audio connect(AudioNode) returns the argument, not our private safety node.
    return destination;
  }
  if (destination instanceof AudioNode)
    return connectNode.call(this, destination, outputIndex, inputIndex);
  return connectParam.call(this, destination, outputIndex);
} as typeof AudioNode.prototype.connect;
AudioContext.prototype.createMediaElementSource = function (
  media: HTMLMediaElement,
): MediaElementAudioSourceNode {
  const source = createMediaSource.call(this, media);
  routedMedia.add(media);
  return source;
};
HTMLMediaElement.prototype.play = function (): Promise<void> {
  if (!routedMedia.has(this)) {
    report.silence.directMediaRequestsRejected++;
    return Promise.reject(
      new Error(
        'Safety gate refuses media not routed through native Web Audio.',
      ),
    );
  }
  report.silence.routedMediaRequests++;
  return nativePlay.call(this);
};
let targetPlan = {
  at: 0,
  from: 1,
  target: 1,
  tau: 1,
  param: undefined as AudioParam | undefined,
};
AudioContext.prototype.createGain = function (): GainNode {
  const gain = createGain.call(this);
  contexts.add(this);
  paramContexts.set(gain.gain, this);
  return gain;
};
AudioParam.prototype.setTargetAtTime = function (
  target: number,
  at: number,
  tau: number,
): AudioParam {
  const result = setTarget.call(this, target, at, tau);
  if (
    !targetPlan.param &&
    paramContexts.get(this) === primary &&
    target === 0.2 &&
    Math.abs(tau - 0.1) < 1e-9
  )
    targetPlan.param = this;
  if (this === targetPlan.param && referenceDuck && primary) {
    const captured = primary.currentTime;
    const from =
      targetPlan.target +
      (targetPlan.from - targetPlan.target) *
        Math.exp(-(at - targetPlan.at) / targetPlan.tau);
    const reference = referenceDuck.gain;
    // Independent native target integration uses the exact requested clock, not AudioParam.value.
    if (typeof reference.cancelAndHoldAtTime === 'function')
      reference.cancelAndHoldAtTime(at);
    else {
      reference.cancelScheduledValues(at);
      reference.setValueAtTime(from, at);
    }
    setTarget.call(reference, target, at, tau);
    targetPlan = { at, from, target, tau, param: this };
    report.arrivals.push({
      requested: at,
      captured,
      delivered: performance.now(),
      target,
      tau,
    });
  }
  return result;
};

async function cleanup(): Promise<void> {
  game?.destroy();
  recorder?.disconnect();
  recorder?.port.close();
  referenceSource?.stop();
  referenceSource?.disconnect();
  referenceVolume?.disconnect();
  referenceDuck?.disconnect();
  AudioContext.prototype.createGain = createGain;
  AudioParam.prototype.setTargetAtTime = setTarget;
  for (const url of urls) URL.revokeObjectURL(url);
  const deadline = performance.now() + 3000;
  while (
    [...contexts].some((context) => context.state !== 'closed') &&
    performance.now() < deadline
  )
    await sleep(20);
  report.cleanup = {
    audioContextCount: game?.audio.audioContextCount,
    nativeContexts: [...contexts].map((context) => context.state),
    streams: streams.map((stream) => stream.state),
    samples: samples.map((sample) => sample.state),
    urls: 0,
  };
  check(
    game?.audio.audioContextCount === 0 &&
      [...contexts].every((context) => context.state === 'closed'),
    'Owned native contexts were not completely closed.',
  );
  check(
    safetySinks.size === report.contexts &&
      [...safetySinks.values()].every((sink) => sink.gain.value === 0),
    'Physical-output safety sinks changed or missed an owned context.',
  );
  for (const sink of safetySinks.values()) sink.disconnect();
  safetySinks.clear();
  AudioNode.prototype.connect = connect;
  AudioContext.prototype.createMediaElementSource = createMediaSource;
  AudioContext.prototype.resume = nativeResume;
  HTMLMediaElement.prototype.play = nativePlay;
  globalThis.AudioContext = NativeAudioContext;
  check(
    streams.every((stream) => stream.state === 'stopped') &&
      samples.every((sample) => sample.state === 'stopped'),
    'Playback ownership survived teardown.',
  );
}
async function fail(error: unknown): Promise<void> {
  report.errors.push(detail(error));
  try {
    await cleanup();
  } catch (cleanupError) {
    report.errors.push(detail(cleanupError));
  }
  publish('failed');
}
addEventListener('unhandledrejection', (event) => {
  report.errors.push(detail(event.reason));
  publish('failed');
});
addEventListener('error', (event) => {
  report.errors.push(detail(event.error ?? event.message));
  publish('failed');
});

try {
  game = await Game.create({
    canvas: document.querySelector<HTMLCanvasElement>('#game')!,
    renderer: 'canvas2d',
    width: 32,
    height: 32,
  });
  const runtime = game;
  runtime.addEventListener('error', (event) => {
    report.errors.push(detail((event as CustomEvent<Error>).detail));
  });
  await runtime.start(new Scene());
  const tonal = await runtime.audio.loadSample(urls[0]!);
  let constant: typeof tonal;
  const opm = await runtime.audio.load('/examples/sprite/music.json');
  unlock.disabled = false;
  publish('unlock-ready');
  unlock.addEventListener(
    'click',
    (event) => {
      report.gestures.push(event.isTrusted);
      unlock.disabled = true;
      void runtime.audio
        .unlock()
        .then(async () => {
          report.contexts = runtime.audio.audioContextCount;
          check(
            report.contexts === 8,
            'Official eight-context unlock changed.',
          );
          primary = runtime.audio.opm?.context ?? undefined;
          check(!!primary, 'Primary native context is unavailable.');
          const constantURL = URL.createObjectURL(
            wave(true, primary!.sampleRate),
          );
          urls.push(constantURL);
          constant = await runtime.audio.loadSample(constantURL);
          await Promise.all([tonal.decode(), constant.decode()]);
          await primary!.audioWorklet.addModule(
            new URL('./audio-load-recorder.js', import.meta.url),
          );
          recorder = new AudioWorkletNode(primary!, 'xyz-audio-load-recorder', {
            numberOfInputs: 2,
            numberOfOutputs: 1,
            outputChannelCount: [1],
            channelCount: 1,
          });
          runtime.audio.ui.analyser()!.connect(recorder, 0, 0);
          referenceSource = primary!.createConstantSource();
          referenceSource.offset.value = 0.25;
          referenceVolume = primary!.createGain();
          referenceDuck = primary!.createGain();
          // A pristine parameter's cancelAndHold is a no-op. Anchor the initial
          // constant so the first target has the mixer's native event history.
          referenceDuck.gain.setValueAtTime(1, 0);
          referenceSource.connect(referenceVolume);
          referenceVolume.connect(referenceDuck);
          referenceDuck.connect(recorder, 0, 1);
          recorder.connect(primary!.destination);
          referenceSource.start();
          run.disabled = false;
          publish('run-ready');
        })
        .catch(fail);
    },
    { once: true },
  );
  run.addEventListener(
    'click',
    (event) => {
      report.gestures.push(event.isTrusted);
      run.disabled = true;
      // Every HTMLMediaElement gets the same real gesture before any await; no global media unlock is assumed.
      const streamRequests = Array.from({ length: 3 }, () =>
        runtime.audio
          .stream(urls[0]!, { channel: 'music', loop: true, volume: 0.2 })
          .then((stream) => {
            streams.push(stream);
            return stream;
          }),
      );
      const controller = new AbortController(),
        cancellation = new Error('Owned pending acquisition cancelled.');
      const cancelled = runtime.audio
        .stream(urls[0]!, { signal: controller.signal, channel: 'music' })
        .then(
          (stream) => {
            stream.stop();
            throw new Error('Aborted acquisition published a stream.');
          },
          (error: unknown) => {
            check(
              error === cancellation,
              'Acquisition lost its exact abort reason.',
            );
            report.expectedCancellation = true;
          },
        );
      controller.abort(cancellation);
      const sampleRequests = [
        constant.play({ channel: 'ui', loop: true }),
        ...Array.from({ length: 3 }, () =>
          tonal.play({ channel: 'music', loop: true, volume: 0.2 }),
        ),
      ].map((promise) =>
        promise.then((sample) => {
          samples.push(sample);
          return sample;
        }),
      );
      const voices = Array.from({ length: 3 }, () =>
        opm.play({ channel: 'music', loop: true }),
      );
      void (async () => {
        await Promise.all([...streamRequests, ...sampleRequests, cancelled]);
        report.baseline = await signal(runtime.audio.music.analyser()!);
        await signal(runtime.audio.ui.analyser()!);
        await sleep(100);
        recorder!.port.postMessage('start');
        runtime.audio.setDucking([
          { source: 'sfx', target: 'ui', gain: 0.2, attack: 0.3, release: 0.6 },
        ]);
        const handles = [runtime.audio.acquireActivity('sfx')];
        const at = primary!.currentTime + 0.06;
        runtime.audio.ui.automate(0.2, at, 0.4);
        referenceVolume!.gain.setValueAtTime(1, at);
        referenceVolume!.gain.linearRampToValueAtTime(0.2, at + 0.4);
        await sleep(25);
        const replacement = at + 0.15,
          from = 1 - (0.8 * 0.15) / 0.4;
        runtime.audio.ui.automate(0.6, replacement, 0.15);
        const volume = referenceVolume!.gain;
        if (typeof volume.cancelAndHoldAtTime === 'function')
          volume.cancelAndHoldAtTime(replacement);
        else {
          volume.cancelScheduledValues(replacement);
          volume.linearRampToValueAtTime(from, replacement);
        }
        volume.linearRampToValueAtTime(0.6, replacement + 0.15);
        const cancelAt = at + 0.25,
          held = from + (0.6 - from) * (0.1 / 0.15);
        check(
          Math.abs(runtime.audio.ui.cancelAutomation(cancelAt) - held) < 1e-9,
          'Manager cancellation returned a different planned hold.',
        );
        if (typeof volume.cancelAndHoldAtTime === 'function')
          volume.cancelAndHoldAtTime(cancelAt);
        else {
          volume.cancelScheduledValues(cancelAt);
          volume.linearRampToValueAtTime(held, cancelAt);
        }
        for (let i = 0; i < 24; i++) {
          if (i % 4 === 0) handles.push(runtime.audio.acquireActivity('sfx'));
          if (i % 4 === 2) handles.shift()?.release();
          runtime.audio.music.setEffects(
            i % 2 ? [] : [{ type: 'biquad', filter: 'lowpass', frequency: 20 }],
          );
          // Real graph construction and native controls coexist with bounded main-thread arithmetic.
          let work = 0;
          for (let j = 0; j < 12000; j++) work += Math.sin(j + i);
          check(
            Number.isFinite(work),
            'Control workload produced nonfinite arithmetic.',
          );
          await sleep(20);
        }
        for (const handle of handles) handle.release();
        await sleep(500);
        const captured = new Promise<{
          samples: number;
          nativeReferenceMaxError: number;
        }>((resolve) => {
          recorder!.port.onmessage = ({
            data,
          }: MessageEvent<{
            samples: number;
            nativeReferenceMaxError: number;
          }>) => resolve(data);
        });
        recorder!.port.postMessage('stop');
        const native = await captured;
        report.nativeReference = native;
        check(
          native.samples > 10000,
          'Native recorder did not observe a meaningful rendered interval.',
        );
        check(
          native.nativeReferenceMaxError < 0.000001,
          `Control-arrival reference difference ${native.nativeReferenceMaxError}; retain failure, never retry.`,
        );
        runtime.audio.music.setEffects([
          { type: 'biquad', filter: 'lowpass', frequency: 10 },
        ]);
        await sleep(200);
        report.filtered = rms(runtime.audio.music.analyser()!);
        check(
          report.filtered < report.baseline * 0.2,
          'Concurrent streams/samples/official OPM bypassed native effects.',
        );
        runtime.audio.music.setEffects([]);
        await sleep(100);
        runtime.audio.pause('first');
        runtime.audio.pause('second');
        await sleep(100);
        const paused = [...contexts].map((context) => context.currentTime);
        await sleep(100);
        report.pauseClockAdvance = [...contexts].map(
          (context, index) => context.currentTime - paused[index]!,
        );
        check(
          report.pauseClockAdvance.every((advance) => advance === 0),
          'An owned native clock advanced after suspension settled.',
        );
        runtime.audio.resume('first');
        const resumeStart = resumeRequests.length;
        check(
          runtime.audio.paused &&
            streams.every((stream) => stream.state === 'paused'),
          "One pause owner resumed another owner's audio.",
        );
        runtime.audio.resume('second');
        const requests = resumeRequests.slice(resumeStart);
        report.nativeResumeRequests = requests.length;
        await Promise.all(requests);
        const resumeDeadline = performance.now() + 5000;
        while (
          (![...contexts].every(
            (context, index) =>
              context.state === 'running' &&
              context.currentTime > paused[index]!,
          ) ||
            !streams.every((stream) => stream.state === 'playing')) &&
          performance.now() < resumeDeadline
        )
          await sleep(20);
        report.resumeClockAdvance = [...contexts].map(
          (context, index) => context.currentTime - paused[index]!,
        );
        check(
          requests.length === report.contexts &&
            [...contexts].every((context) => context.state === 'running') &&
            report.resumeClockAdvance.every((advance) => advance > 0) &&
            streams.every((stream) => stream.state === 'playing'),
          'Original native resume requests did not restore fresh clocks and playing streams.',
        );
        await signal(runtime.audio.music.analyser()!);
        check(
          report.errors.length === 0,
          'A native playback/control error was reported; see original causes.',
        );
        for (const voice of voices) voice.stop();
        await cleanup();
        check(
          report.errors.length === 0,
          'Native teardown reported an original error; see cleanup causes.',
        );
        publish('passed');
      })().catch(fail);
    },
    { once: true },
  );
} catch (error) {
  await fail(error);
}

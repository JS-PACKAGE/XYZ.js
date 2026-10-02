import {
  Game,
  Scene,
  Object3D,
  Sprite,
  Texture,
  type RendererPreference,
  type SamplePlayback,
  type AudioStream,
  type AudioEffect,
  type PreparedAudioImpulse,
  type AudioTransformBinding,
} from '../../src/index.js';
import { createPcm16Wav } from '../gameplay2d/fixtures.js';
const get = <T extends HTMLElement>(id: string): T =>
  document.querySelector<T>(`#${id}`)!;
const backend = get<HTMLSelectElement>('backend');
const status = get<HTMLParagraphElement>('status');
backend.value = new URLSearchParams(location.search).get('renderer') ?? 'auto';
backend.addEventListener('change', () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
});
let game: Game | undefined;
let texture: Texture | undefined;
let impulse: PreparedAudioImpulse | undefined;
let timer: number | undefined;
const urls: string[] = [];
const events = new AbortController();
const fail = (error: unknown): void => {
  status.textContent = error instanceof Error ? error.message : String(error);
};
const release = (): void => {
  events.abort();
  clearInterval(timer);
  game?.destroy();
  texture?.destroy();
  impulse?.dispose();
  for (const url of urls) URL.revokeObjectURL(url);
};
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) release();
});
try {
  game = await Game.create({
    canvas: '#game',
    width: 900,
    height: 300,
    renderer: backend.value as RendererPreference,
  });
  const runtime = game;
  runtime.addEventListener('error', (event) =>
    fail((event as CustomEvent<Error>).detail),
  );
  const wav = URL.createObjectURL(
    new Blob([createPcm16Wav(660)], { type: 'audio/wav' }),
  );
  urls.push(wav);
  const cue = URL.createObjectURL(
    new Blob([createPcm16Wav(440)], { type: 'audio/wav' }),
  );
  urls.push(cue);
  const [sample, duckSample] = await Promise.all([
    runtime.audio.loadSample(wav),
    runtime.audio.loadSample(cue),
  ]);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 48;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#fff';
  context.beginPath();
  context.arc(24, 24, 22, 0, Math.PI * 2);
  context.fill();
  texture = await Texture.fromImage(canvas);
  const markerTexture = texture;
  class SoundScene extends Scene {
    readonly emitter = this.add(new Object3D());
    readonly listener = this.add(new Object3D());
    readonly emitterMarker = this.add(
      new Sprite({ texture: markerTexture, tint: [1, 0.7, 0.25, 1] }),
    );
    readonly listenerMarker = this.add(
      new Sprite({ texture: markerTexture, tint: [0.3, 1, 0.8, 1] }),
    );
    phase = 0;
    override update(dt: number): void {
      if (get<HTMLInputElement>('motion').checked) this.phase += dt;
      this.emitter.transform.position.set(Math.sin(this.phase) * 4, 0, -2);
      this.listener.transform.position.set(
        Number(get<HTMLInputElement>('listener').value),
        0,
        0,
      );
      this.emitterMarker.position.set(
        450 + this.emitter.transform.position.x * 85,
        100,
      );
      this.listenerMarker.position.set(
        450 + this.listener.transform.position.x * 85,
        225,
      );
    }
  }
  const scene = new SoundScene();
  await runtime.setScene(scene);
  runtime.start();
  runtime.audio.master.volume = 0.3;
  runtime.audio.music.volume = 0.65;
  runtime.audio.sfx.volume = 0.2;
  runtime.audio.setDucking([
    { source: 'sfx', target: 'music', gain: 0.2, attack: 0.03, release: 0.6 },
  ]);
  runtime.audio.bindListener(scene.listener);
  let playback: SamplePlayback | AudioStream | undefined;
  let binding: AudioTransformBinding | undefined;
  const ducks: [SamplePlayback | undefined, SamplePlayback | undefined] = [
    undefined,
    undefined,
  ];
  let held: number | undefined;
  const stop = (): void => {
    binding?.unbind();
    binding = undefined;
    playback?.stop();
    for (const duck of ducks) duck?.stop();
  };
  const on = (
    id: string,
    type: string,
    action: () => void | Promise<void>,
  ): void => {
    get(id).addEventListener(
      type,
      () => {
        try {
          Promise.resolve(action()).catch(fail);
        } catch (error) {
          fail(error);
        }
      },
      { signal: events.signal },
    );
  };
  on('unlock', 'click', async () => {
    await runtime.audio.unlock();
    if (events.signal.aborted) return;
    const buffer = new AudioBuffer({
      numberOfChannels: 1,
      length: 24000,
      sampleRate: 48000,
    });
    const data = buffer.getChannelData(0);
    data[0] = 1;
    data[6000] = 0.45;
    data[12000] = 0.2;
    data[18000] = 0.08;
    impulse = runtime.audio.prepareImpulse(buffer);
    get<HTMLFieldSetElement>('controls').disabled = false;
    get<HTMLButtonElement>('unlock').disabled = true;
  });
  for (const id of ['play', 'stream'])
    on(id, 'click', async () => {
      binding?.unbind();
      playback?.stop();
      const options = {
        channel: 'music' as const,
        scene,
        loop: true,
        volume: 0.5,
        spatial: {
          position: { x: 0, y: 0, z: -2 },
          refDistance: 2,
          rolloffFactor: 0.3,
          panningModel: 'equalpower' as const,
        },
      };
      const next =
        id === 'stream'
          ? await runtime.audio.stream(wav, options)
          : await sample.play(options);
      if (events.signal.aborted) {
        next.stop();
        return;
      }
      playback = next;
      binding = runtime.audio.bindEmitter(scene.emitter, playback);
    });
  const effects = (): void => {
    const chain: AudioEffect[] = [];
    if (get<HTMLInputElement>('eq').checked)
      chain.push({
        type: 'biquad',
        filter: 'lowpass',
        frequency: Number(get<HTMLInputElement>('cutoff').value),
        Q: 0.7,
      });
    if (get<HTMLInputElement>('compressor').checked)
      chain.push({
        type: 'compressor',
        threshold: -35,
        ratio: 6,
        knee: 12,
        attack: 0.005,
        release: 0.15,
      });
    if (get<HTMLInputElement>('reverb').checked && impulse)
      chain.push({ type: 'reverb', impulse, wet: 0.35, normalize: false });
    runtime.audio.music.setEffects(chain);
  };
  for (const id of ['eq', 'compressor', 'reverb', 'cutoff'])
    on(id, 'input', effects);
  on('volume', 'input', () => {
    runtime.audio.music.volume =
      Number(get<HTMLInputElement>('volume').value) / 100;
  });
  on('fade', 'click', () => {
    held = undefined;
    runtime.audio.music.automate(0.1, runtime.audio.currentTime, 4, 'linear');
  });
  on('hold', 'click', () => {
    held = runtime.audio.music.cancelAutomation();
  });
  on('pause', 'click', () => {
    if (runtime.audio.paused) runtime.audio.resume();
    else runtime.audio.pause();
  });
  for (const [index, name] of ['a', 'b'].entries()) {
    on(`duck-${name}`, 'click', async () => {
      ducks[index]?.stop();
      const next = await duckSample.play({
        channel: 'sfx',
        scene,
        loop: true,
        volume: 0.15,
      });
      if (events.signal.aborted) {
        next.stop();
        return;
      }
      ducks[index] = next;
    });
    on(`release-${name}`, 'click', () => {
      ducks[index]?.stop();
    });
  }
  on('stop', 'click', stop);
  on('destroy', 'click', () => {
    stop();
    release();
    status.textContent =
      'Destroyed · native graph, bindings and owned assets released';
  });
  const signal = new Float32Array(1024);
  timer = window.setInterval(() => {
    const analyser = runtime.audio.music.analyser();
    let rms = 0;
    if (analyser) {
      analyser.fftSize = 2048;
      analyser.getFloatTimeDomainData(signal);
      for (const value of signal) rms += value * value;
      rms = Math.sqrt(rms / signal.length);
    }
    const p = playback?.position3D;
    get('metrics').textContent =
      `Audio ${runtime.audio.unlocked ? 'unlocked' : 'locked'} · ${runtime.audio.paused ? 'paused' : 'running'} · contexts ${runtime.audio.audioContextCount}\nPlayback ${playback?.state ?? 'idle'} · position ${playback?.position.toFixed(2) ?? '0'}s\nMusic volume (base): ${runtime.audio.music.volume.toFixed(2)} · cancel-hold value: ${held?.toFixed(3) ?? '—'}\nNative post-effect/bus RMS: ${rms.toFixed(5)} · effects: ${runtime.audio.music.effects.map((effect) => effect.type).join(', ') || 'bypass'}\nDuck A: ${ducks[0]?.state ?? 'idle'} · B: ${ducks[1]?.state ?? 'idle'} · release tail 0.6s\nBound emitter: ${p ? `${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}` : 'not playing'}\nListener X: ${runtime.audio.listener.position.x.toFixed(2)} · amber emitter / mint listener`;
  }, 100);
  status.textContent = `${runtime.graphics.backend} · 2D visualization / native spatial audio independent of graphics backend`;
} catch (error) {
  release();
  fail(error);
}

import {
  Game,
  PreloadBatch,
  Scene,
  Sprite,
  Texture,
  type AudioAsset,
  type AudioPlayback,
  type RendererPreference,
  type SampleAudioAsset,
  type AudioStream,
  type SamplePlayback,
} from '../../src/index.js';
import { createPcm16Wav } from '../gameplay2d/fixtures.js';

const WIDTH = 800;
const HEIGHT = 200;
const LAMP_DIM = 0.2;

const $ = <T extends HTMLElement>(id: string): T =>
  document.querySelector<T>(`#${id}`)!;
const backend = $<HTMLSelectElement>('backend');
const enable = $<HTMLButtonElement>('enable');
const loop = $<HTMLInputElement>('loop');
const progress = $<HTMLProgressElement>('preload');
const audioState = $<HTMLParagraphElement>('audio-state');
const status = $<HTMLParagraphElement>('status');
const controls = [
  'sfx',
  'music',
  'stop-music',
  'loop',
  'sample',
  'stop-all',
  'sprite-head',
  'sprite-tail',
  'stream',
  'pause-audio',
  'master-volume',
  'sfx-volume',
  'music-volume',
].map((id) => $<HTMLInputElement | HTMLButtonElement>(id));

backend.value = new URLSearchParams(location.search).get('renderer') ?? 'auto';
backend.addEventListener('change', () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
});

let game: Game | undefined;
let disc: Texture | undefined;
let wavURL: string | undefined;
const release = (): void => {
  game?.destroy();
  disc?.destroy();
  if (wavURL) URL.revokeObjectURL(wavURL);
};

try {
  game = await Game.create({
    canvas: '#game',
    width: WIDTH,
    height: HEIGHT,
    renderer: backend.value as RendererPreference,
  });
  const runtime = game;
  runtime.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });
  const sfxURL = new URL('../sprite/sfx.json', import.meta.url).href;
  const musicURL = new URL('../sprite/music.json', import.meta.url).href;
  wavURL = URL.createObjectURL(
    new Blob([createPcm16Wav(660)], { type: 'audio/wav' }),
  );
  const sampleURL = wavURL;

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#fff';
  context.beginPath();
  context.arc(32, 32, 32, 0, Math.PI * 2);
  context.fill();
  disc = await Texture.fromImage(canvas);
  const texture = disc;

  class Lab extends Scene {
    sfx: AudioAsset | undefined;
    music: AudioAsset | undefined;
    sample: SampleAudioAsset | undefined;
    readonly sfxPlaybacks: AudioPlayback[] = [];
    musicPlayback: AudioPlayback | undefined;
    pcmPlayback: SamplePlayback | undefined;
    spritePlayback: SamplePlayback | undefined;
    streamPlayback: AudioStream | undefined;
    private readonly lamps = [
      [0.3, 0.8, 1, 1],
      [1, 0.75, 0.25, 1],
      [0.6, 1, 0.5, 1],
    ].map((tint, index) =>
      this.add(
        new Sprite({
          texture,
          position: [WIDTH * (index + 1) * 0.25, HEIGHT / 2],
          scale: [1.2, 1.2],
          tint: tint as [number, number, number, number],
          opacity: LAMP_DIM,
        }),
      ),
    );

    protected override preload(): PreloadBatch {
      const batch = new PreloadBatch([
        runtime.audio.opmTask('sfx', sfxURL),
        runtime.audio.opmTask('music', musicURL),
        runtime.audio.sampleTask('pcm', sampleURL),
      ]);
      batch.addEventListener('progress', () => {
        const { completed, total } = batch.progress;
        progress.max = total;
        progress.value = completed;
        $('preload-state').textContent = `${completed} / ${total} tasks`;
      });
      batch.addEventListener('complete', () => {
        $('preload-state').textContent =
          '3 / 3 tasks · fetched, not decoded (locked)';
      });
      return batch;
    }

    protected override async initialize(): Promise<void> {
      // Loaders share the preload cache, so these resolve from the batch's results.
      [this.sfx, this.music, this.sample] = await Promise.all([
        runtime.audio.load(sfxURL),
        runtime.audio.load(musicURL),
        runtime.audio.loadSample(sampleURL),
      ]);
    }

    get playingSfx(): number {
      return this.sfxPlaybacks.filter((p) => p.state === 'playing').length;
    }

    override update(): void {
      const active = [
        this.playingSfx > 0,
        this.musicPlayback?.state === 'playing',
        this.pcmPlayback?.state === 'playing',
      ];
      this.lamps.forEach((lamp, index) => {
        lamp.opacity = active[index] ? 1 : LAMP_DIM;
      });
    }
  }

  const scene = new Lab();
  await runtime.setScene(scene);
  runtime.start();

  const startMusic = (): void => {
    scene.musicPlayback?.stop();
    scene.musicPlayback = scene.music!.play({
      channel: 'music',
      scene,
      loop: loop.checked,
    });
  };
  enable.disabled = false;
  enable.addEventListener('click', async () => {
    try {
      await runtime.audio.unlock();
      enable.disabled = true;
      for (const control of controls) control.disabled = false;
    } catch (error) {
      status.textContent =
        error instanceof Error ? error.message : String(error);
    }
  });
  $('sfx').addEventListener('click', () => {
    const playback = runtime.audio.play(scene.sfx!, {
      channel: 'sfx',
      scene,
    });
    scene.sfxPlaybacks.push(playback);
    if (scene.sfxPlaybacks.length > 16) scene.sfxPlaybacks.shift();
  });
  $('music').addEventListener('click', startMusic);
  loop.addEventListener('change', () => {
    if (scene.musicPlayback?.state === 'playing') startMusic();
  });
  $('stop-music').addEventListener('click', () => scene.musicPlayback?.stop());
  $('sample').addEventListener('click', async () => {
    scene.pcmPlayback?.stop();
    try {
      scene.pcmPlayback = await scene.sample!.play({
        channel: 'sfx',
        scene,
        volume: 0.6,
      });
    } catch (error) {
      status.textContent =
        error instanceof Error ? error.message : String(error);
    }
  });
  $('stop-all').addEventListener('click', () => {
    scene.musicPlayback?.stop();
    scene.pcmPlayback?.stop();
    scene.spritePlayback?.stop();
    scene.streamPlayback?.stop();
    for (const playback of scene.sfxPlaybacks) playback.stop();
  });
  scene.sample!.defineSprites({
    head: { start: 0, end: 0.2 },
    tail: { start: 0.25, end: 0.5 },
  });
  const playSprite = (name: string, spriteLoop: boolean) => async () => {
    scene.spritePlayback?.stop();
    try {
      scene.spritePlayback = await scene.sample!.playSprite(name, {
        channel: 'sfx',
        scene,
        volume: 0.6,
        loop: spriteLoop,
      });
    } catch (error) {
      status.textContent =
        error instanceof Error ? error.message : String(error);
    }
  };
  $('sprite-head').addEventListener('click', playSprite('head', false));
  $('sprite-tail').addEventListener('click', playSprite('tail', true));
  $('stream').addEventListener('click', async () => {
    scene.streamPlayback?.stop();
    try {
      scene.streamPlayback = await runtime.audio.stream(sampleURL, {
        channel: 'music',
        scene,
        loop: true,
        volume: 0.5,
      });
    } catch (error) {
      status.textContent =
        error instanceof Error ? error.message : String(error);
    }
  });
  $('pause-audio').addEventListener('click', (event) => {
    if (runtime.audio.paused) runtime.audio.resume();
    else runtime.audio.pause();
    (event.currentTarget as HTMLButtonElement).textContent = runtime.audio
      .paused
      ? 'Resume audio'
      : 'Pause audio';
  });
  const bindVolume = (id: string, apply: (value: number) => void): void => {
    const slider = $<HTMLInputElement>(`${id}-volume`);
    slider.addEventListener('input', () => {
      apply(Number(slider.value) / 100);
      $(`${id}-value`).textContent = `${slider.value}%`;
    });
    slider.dispatchEvent(new Event('input'));
  };
  bindVolume('master', (value) => {
    runtime.audio.master.volume = value;
  });
  bindVolume('sfx', (value) => {
    runtime.audio.sfx.volume = value;
  });
  bindVolume('music', (value) => {
    runtime.audio.music.volume = value;
  });

  const report = window.setInterval(() => {
    const pcm = scene.pcmPlayback;
    audioState.textContent = [
      runtime.audio.unlocked
        ? 'Audio unlocked'
        : 'Audio locked (click Enable audio)',
      `OPM SFX handles playing: ${scene.playingSfx}`,
      `OPM music: ${scene.musicPlayback?.state ?? 'idle'}`,
      `PCM sample: ${pcm?.state ?? 'idle'}${pcm ? ` at ${pcm.position.toFixed(2)}s` : ''} · decoded ${scene.sample?.decoded ?? false}${scene.sample?.duration ? ` · ${scene.sample.duration.toFixed(2)}s @ ${scene.sample.sampleRate} Hz` : ''}`,
      `Sprites: ${scene.sample?.sprites.join(', ') || 'none'} · sprite ${scene.spritePlayback?.state ?? 'idle'}${scene.spritePlayback ? ` at ${scene.spritePlayback.position.toFixed(2)}s` : ''}`,
      `Stream: ${scene.streamPlayback?.state ?? 'idle'}${scene.streamPlayback ? ` at ${scene.streamPlayback.position.toFixed(2)}s` : ''} · audio ${runtime.audio.paused ? 'PAUSED' : 'running'}`,
    ].join('\n');
  }, 100);

  status.textContent = `${runtime.graphics.backend} · OPM music/SFX, native PCM sample, PreloadBatch, channel volumes`;
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    window.clearInterval(report);
    release();
  });
} catch (error) {
  release();
  status.textContent = error instanceof Error ? error.message : String(error);
}

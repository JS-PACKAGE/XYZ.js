import {
  type AudioAsset,
  type AudioManager,
  type AudioPlayback,
  type AudioPlayOptions,
  type SamplePlayback,
  type SamplePlayOptions,
  type Scene,
} from '../../src/index.js';

// Compilation only: no unlock, native contexts, network request or audible output.
export function playNotes(
  manager: AudioManager,
  asset: AudioAsset,
  scene: Scene,
): AudioPlayback {
  const options: AudioPlayOptions = {
    channel: 'music',
    scene,
    persistent: false,
    loop: true,
  };
  const playback: AudioPlayback = asset.play(options);
  const state: 'playing' | 'stopped' | 'ended' = playback.state;
  manager.pause('menu');
  manager.resume('menu');
  manager.music.automate(
    state === 'playing' ? 0.5 : 0,
    manager.currentTime,
    0.1,
    'linear',
  );
  playback.stop();
  return playback;
}

export async function sample(
  manager: AudioManager,
  signal: AbortSignal,
  scene: Scene,
): Promise<SamplePlayback> {
  const asset = await manager.loadSample('/effects.wav', { signal });
  const options: SamplePlayOptions = {
    scene,
    volume: 0,
    channel: 'sfx',
    scheduledStartTime: manager.currentTime + 1,
    region: { start: 0.1, end: 0.2 },
    spatial: { position: { x: 0, y: 1, z: 2 } },
  };
  const playback: SamplePlayback = await asset.play(options);
  playback.pause('menu');
  playback.seek(0.15);
  playback.resume('menu');
  return playback;
}

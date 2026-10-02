import { Game, Scene, Sprite } from '../../src/index.js';

const status = document.querySelector<HTMLParagraphElement>('#status')!;
const order = document.querySelector<HTMLButtonElement>('#order')!;
const opacity = document.querySelector<HTMLButtonElement>('#opacity')!;
let game: Game | undefined;
try {
  game = await Game.create({
    canvas: '#game',
    width: 640,
    height: 360,
    renderer: 'webgpu',
  });
  game.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
    order.disabled = opacity.disabled = true;
  });
  const url = new URL('./texture.png', import.meta.url).href;
  const [texture, shared] = await Promise.all([
    game.assets.loadTexture(url),
    game.assets.loadTexture(url),
  ]);
  const scene = new Scene();
  const back = scene.add(
    new Sprite({
      texture,
      position: [250, 170],
      scale: [3, 3],
      rotation: -0.15,
    }),
  );
  const front = scene.add(
    new Sprite({
      texture: shared,
      position: [360, 200],
      scale: [3, 3],
      rotation: 0.2,
      opacity: 0.55,
      zIndex: 1,
    }),
  );
  const report = (): void => {
    status.textContent = `Backend: ${game!.graphics.backend} · Shared texture: ${texture === shared} · Foreground z: ${front.zIndex} · Opacity: ${front.opacity}`;
  };
  order.addEventListener('click', () => {
    front.zIndex = front.zIndex > back.zIndex ? -1 : 1;
    report();
  });
  opacity.addEventListener('click', () => {
    front.opacity = front.opacity === 1 ? 0.55 : 1;
    report();
  });
  await game.setScene(scene);
  game.start();
  order.disabled = opacity.disabled = false;
  report();
  const runtime = game;
  const audioStatus =
    document.querySelector<HTMLParagraphElement>('#audio-status')!;
  const unlock = document.querySelector<HTMLButtonElement>('#audio')!;
  const burst = document.querySelector<HTMLButtonElement>('#sfx')!;
  const stop = document.querySelector<HTMLButtonElement>('#stop-audio')!;
  void (async () => {
    try {
      const [music, sound] = await Promise.all([
        runtime.audio.load(new URL('./music.json', import.meta.url).href),
        runtime.audio.load(new URL('./sfx.json', import.meta.url).href),
      ]);
      if (runtime.state === 'destroyed') return;
      unlock.disabled = false;
      unlock.addEventListener('click', () => {
        void runtime.audio
          .unlock()
          .then(() => {
            music.stop();
            music.play();
            burst.disabled = stop.disabled = false;
            audioStatus.textContent =
              'Audio unlocked · Six-voice music; SFX overflow only steals the oldest SFX.';
          })
          .catch((error: unknown) => {
            audioStatus.textContent = String(error);
          });
      });
      burst.addEventListener('click', () => {
        for (let i = 0; i < 4; i++) runtime.audio.play(sound);
        audioStatus.textContent =
          'Four SFX played; music scheduling is preserved.';
      });
      stop.addEventListener('click', () => {
        music.stop();
        sound.stop();
        audioStatus.textContent = 'Audio stopped';
      });
    } catch (error) {
      audioStatus.textContent = String(error);
    }
  })();
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) game?.destroy();
  });
} catch (error) {
  game?.destroy();
  status.textContent = error instanceof Error ? error.message : String(error);
}

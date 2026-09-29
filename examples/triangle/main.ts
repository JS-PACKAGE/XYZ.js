import { Game } from '../../src/index.js';

const status = document.querySelector<HTMLParagraphElement>('#status')!;
const pause = document.querySelector<HTMLButtonElement>('#pause')!;
const resume = document.querySelector<HTMLButtonElement>('#resume')!;
const destroy = document.querySelector<HTMLButtonElement>('#destroy')!;

try {
  const game = await Game.create({ canvas: '#game', renderer: 'webgpu' });
  game.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
    pause.disabled = true;
    resume.disabled = true;
  });
  game.start();
  status.textContent = `Backend: ${game.graphics.backend} · Running`;
  pause.disabled = false;
  destroy.disabled = false;
  pause.addEventListener('click', () => {
    game.pause();
    status.textContent = `Backend: ${game.graphics.backend} · Paused`;
    pause.disabled = true;
    resume.disabled = false;
  });
  resume.addEventListener('click', () => {
    game.resume();
    status.textContent = `Backend: ${game.graphics.backend} · Running`;
    pause.disabled = false;
    resume.disabled = true;
  });
  destroy.addEventListener('click', () => {
    game.destroy();
    status.textContent =
      'Destroyed · GPU resources and runtime listeners released';
    pause.disabled = true;
    resume.disabled = true;
    destroy.disabled = true;
  });
  window.addEventListener('pagehide', (event) => {
    // A BFCache entry is suspended, not unloaded; its Game must survive restoration.
    if (!event.persisted) game.destroy();
  });
} catch (error) {
  status.textContent = error instanceof Error ? error.message : String(error);
  console.error('[XYZ triangle]', error);
}

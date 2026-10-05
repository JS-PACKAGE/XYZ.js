import { Game, type RendererPreference } from '../../src/index.js';
import { runComputeScenario } from './scenario.js';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!,
  status = document.querySelector<HTMLPreElement>('#status')!;
const preference = (new URLSearchParams(location.search).get('renderer') ??
  'webgpu') as RendererPreference;
const controller = new AbortController();
let game: Game | undefined;
try {
  game = await Game.create({
    canvas,
    width: 640,
    height: 360,
    renderer: preference,
  });
  const values = await runComputeScenario(game.graphics, controller.signal);
  if (values.some((value, index) => value !== index / 2 + 3))
    throw new Error(
      'GPU dependency output differs from the arithmetic oracle.',
    );
  status.textContent = `WebGPU: 128 outputs verified. Input → double → add 3 → readback\nFirst 12: ${values.slice(0, 12).join(', ')}`;
  game.start();
} catch (error) {
  status.textContent = error instanceof Error ? error.message : String(error);
}
window.addEventListener(
  'pagehide',
  () => {
    controller.abort();
    game?.destroy();
  },
  { once: true },
);

import {
  Game,
  HotSceneOwner,
  bindSceneHotReload,
  type SceneHotAdapter,
} from '../../src/index.js';
import * as initial from './scene.js';

const status = document.querySelector<HTMLParagraphElement>('#status')!;
export const game = await Game.create({
  canvas: '#game',
  width: 800,
  height: 450,
  renderer:
    new URLSearchParams(location.search).get('renderer') === 'canvas2d'
      ? 'canvas2d'
      : 'auto',
});
export const owner = new HotSceneOwner(game);
export let generation: string | undefined;
const pointer = new URLSearchParams(location.search).get('assets');
let stopped = false;
let polling = false;
let timer: number | undefined;
const report = (error: unknown): void => {
  status.textContent = `Candidate rejected; live scene retained: ${String(error)}`;
};
async function refreshAssets(): Promise<void> {
  if (!pointer || stopped || polling) return;
  polling = true;
  try {
    const pointerURL = new URL(pointer, location.href);
    const response = await fetch(pointerURL, { cache: 'no-store' });
    if (!response.ok)
      throw new Error(`Generation pointer HTTP ${response.status}.`);
    const next = (await response.json()) as {
      version: number;
      generation: string;
      manifest: string;
    };
    if (
      next.version !== 1 ||
      !/^generation-[1-9]\d*$/.test(next.generation) ||
      next.manifest !== `${next.generation}/project-manifest.json`
    )
      throw new Error('Invalid asset generation pointer.');
    if (generation === next.generation) return;
    await owner.replace((context) =>
      initial.createAssetScene(
        context,
        new URL(next.manifest, pointerURL).href,
      ),
    );
    generation = next.generation;
    status.textContent = `Asset ${generation} published on the same Game.`;
  } catch (error) {
    report(error);
  } finally {
    polling = false;
  }
}
if (pointer) {
  await refreshAssets();
  timer = window.setInterval(() => {
    void refreshAssets();
  }, 250);
} else {
  await owner.replace(initial.createScene);
  status.textContent =
    'Edit scene.ts while Vite runs, or supply ?assets=/path/current.json for real asset generations.';
}
game.start();
const dispose = async (): Promise<void> => {
  stopped = true;
  clearInterval(timer);
  await owner.dispose();
};
// Opt-in development-only protocol; production bundles do not import Vite.
const hot = (
  import.meta as ImportMeta & { hot?: SceneHotAdapter<typeof initial> }
).hot;
if (hot) {
  if (!pointer)
    bindSceneHotReload(
      owner,
      hot,
      './scene.js',
      (module) => module.createScene,
      report,
    );
  hot.dispose(() => {
    void dispose().catch(report);
  });
}
window.addEventListener(
  'pagehide',
  () => {
    void dispose().catch(report);
  },
  { once: true },
);
document.querySelector('#reject')!.addEventListener('click', () => {
  void owner
    .replace(async () => {
      throw new Error('Deliberate candidate error.');
    })
    .catch(report);
});
document.querySelector('#dispose')!.addEventListener('click', () => {
  void dispose().then(() => {
    status.textContent = 'Game disposed; reload to restart.';
  }, report);
});

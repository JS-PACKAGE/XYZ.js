import {
  Game,
  GLTFLoader,
  OrbitControls,
  Scene,
  Vector3,
  type GLTFAsset,
  type RendererPreference,
} from '../../src/index.js';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const backend = document.querySelector<HTMLSelectElement>('#backend')!;
const pause = document.querySelector<HTMLButtonElement>('#pause')!;
const destroy = document.querySelector<HTMLButtonElement>('#destroy')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;
const readout = document.querySelector<HTMLPreElement>('#readout')!;
const lifetime = new AbortController();
let game: Game | undefined;
let asset: GLTFAsset | undefined;
let controls: OrbitControls | undefined;
let scene: RecipeScene | undefined;
let report: number | undefined;
let released = false;

function release(): void {
  if (released) return;
  released = true;
  lifetime.abort();
  if (report !== undefined) window.clearInterval(report);
  controls?.destroy();
  game?.destroy();
  scene?.destroy();
  asset?.dispose();
  pause.disabled = destroy.disabled = backend.disabled = true;
}

backend.value = new URLSearchParams(location.search).get('renderer') ?? 'auto';
backend.addEventListener(
  'change',
  () => {
    const url = new URL(location.href);
    url.searchParams.set('renderer', backend.value);
    location.href = url.href;
  },
  { signal: lifetime.signal },
);
window.addEventListener(
  'pagehide',
  (event) => {
    if (!event.persisted) release();
  },
  { signal: lifetime.signal },
);

class RecipeScene extends Scene {
  override update(): void {
    controls?.update();
  }
}

try {
  game = await Game.create({
    canvas,
    width: 960,
    height: 540,
    renderer: backend.value as RendererPreference,
  });
  if (released) {
    game.destroy();
    throw new Error('Example closed during initialization.');
  }
  const runtime = game;
  runtime.addEventListener(
    'error',
    (event) => {
      status.textContent = (event as CustomEvent<Error>).detail.message;
    },
    { signal: lifetime.signal },
  );
  if (!runtime.graphics.capabilities.threeD)
    throw new Error(
      'Canvas2D does not support this 3D fixture. Select WebGPU or WebGL2.',
    );
  const loaded = await new GLTFLoader().load(
    new URL('./source.gltf', import.meta.url).href,
    {
      signal: lifetime.signal,
    },
  );
  if (released) {
    loaded.dispose();
    throw new Error('Example closed while loading its asset.');
  }
  asset = loaded;
  lifetime.signal.throwIfAborted();
  scene = new RecipeScene();
  scene.camera3D.position.set(0, 0, 5);
  scene.camera3D.lookAt(new Vector3());
  scene.ambientLight = 0.5;
  scene.directionalLight.intensity = 1;
  scene.add(asset.scene);
  controls = new OrbitControls(scene.camera3D, canvas);
  controls.update();
  await runtime.setScene(scene);
  lifetime.signal.throwIfAborted();
  runtime.start();
  status.textContent = `${runtime.graphics.backend} · authored fixture rendered by public GLTFLoader`;
  pause.disabled = destroy.disabled = false;
  pause.addEventListener(
    'click',
    () => {
      if (runtime.state === 'running') {
        runtime.pause();
        pause.textContent = 'Resume';
      } else {
        runtime.start();
        pause.textContent = 'Pause';
      }
    },
    { signal: lifetime.signal },
  );
  destroy.addEventListener(
    'click',
    () => {
      release();
      status.textContent = 'Destroyed owned Game, scene and glTF asset.';
      readout.textContent = JSON.stringify(runtime.graphics.residency, null, 2);
    },
    { signal: lifetime.signal },
  );
  report = window.setInterval(() => {
    readout.textContent = JSON.stringify(runtime.graphics.stats, null, 2);
  }, 250);
} catch (error) {
  release();
  status.textContent = error instanceof Error ? error.message : String(error);
}

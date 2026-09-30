import {
  AnimationClip,
  GLTFLoader,
  Game,
  Geometry,
  KeyframeTrack,
  Mesh,
  MorphTargets,
  MorphWeights,
  OrbitControls,
  PBRMaterial,
  Scene,
  Texture,
  Vector3,
  type AnimationAction,
  type GLTFAsset,
  type RendererPreference,
} from '../../src/index.js';

const WIDTH = 960;
const HEIGHT = 540;

const $ = <T extends HTMLElement>(id: string): T =>
  document.querySelector<T>(`#${id}`)!;
const backend = $<HTMLSelectElement>('backend');
const canvasElement = $<HTMLCanvasElement>('game');
const play = $<HTMLButtonElement>('play');
const speed = $<HTMLInputElement>('speed');
const loop = $<HTMLInputElement>('loop');
const auto = $<HTMLInputElement>('auto');
const stretch = $<HTMLInputElement>('stretch');
const spikes = $<HTMLInputElement>('spikes');
const readout = $<HTMLPreElement>('readout');
const status = $<HTMLParagraphElement>('status');

backend.value = new URLSearchParams(location.search).get('renderer') ?? 'auto';
backend.addEventListener('change', () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
});

let game: Game | undefined;
let white: Texture | undefined;
let asset: GLTFAsset | undefined;
let controls: OrbitControls | undefined;
const release = (): void => {
  controls?.destroy();
  game?.destroy();
  asset?.dispose();
  white?.destroy();
};

/** Two additive targets for a unit-ish sphere: a vertical stretch and position-based spikes. */
function sphereTargets(geometry: Geometry): {
  positions: Float32Array[];
  weights: MorphWeights;
} {
  const v = geometry.vertices;
  const count = v.length / 8;
  const stretchDelta = new Float32Array(count * 3);
  const spikeDelta = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const [x, y, z] = [v[i * 8], v[i * 8 + 1], v[i * 8 + 2]];
    stretchDelta.set([-0.35 * x, 0.8 * y, -0.35 * z], i * 3);
    // Depends on position only, so vertices duplicated along UV seams move together.
    const amount =
      0.8 * Math.max(0, Math.sin(6 * x) * Math.sin(6 * y) * Math.sin(6 * z));
    spikeDelta.set(
      [v[i * 8 + 3] * amount, v[i * 8 + 4] * amount, v[i * 8 + 5] * amount],
      i * 3,
    );
  }
  return {
    positions: [stretchDelta, spikeDelta],
    weights: new MorphWeights([0, 0]),
  };
}

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
  if (!runtime.graphics.capabilities.threeD)
    throw new Error(
      'This backend has no 3D capability. Canvas2D intentionally does not render meshes.',
    );
  const image = new OffscreenCanvas(1, 1);
  const context = image.getContext('2d')!;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, 1, 1);
  white = await Texture.fromImage(image);
  const texture = white;
  const model = await new GLTFLoader().load(
    new URL('../advanced3d/skinned-ribbon.gltf', import.meta.url).href,
  );
  asset = model;

  class Viewer extends Scene {
    readonly actions: AnimationAction[] = [];
    readonly weights: MorphWeights;
    readonly morphAction: AnimationAction;

    constructor() {
      super();
      this.camera3D.position.set(0, 2.6, 7);
      this.camera3D.lookAt(new Vector3(0, 0.9, 0));
      this.ambientLight = 0.25;
      this.directionalLight.intensity = 3;
      this.directionalLight.direction.set(3, 6, 4).normalize();
      model.scene.position.set(-2, 0, 0);
      this.add(model.scene);
      for (const clip of model.animations)
        this.actions.push(this.animations.clipAction(clip).play());

      const geometry = Geometry.sphere(0.9);
      const targets = sphereTargets(geometry);
      this.weights = targets.weights;
      this.add(
        new Mesh({
          geometry,
          material: new PBRMaterial({
            texture,
            color: [0.35, 0.75, 1],
            roughness: 0.35,
          }),
          position: [2, 1, 0],
          morph: new MorphTargets(targets),
        }),
      );
      // A weights track animates the same MorphWeights object the sliders write to.
      this.morphAction = this.animations.clipAction(
        new AnimationClip('Morph weights', [
          new KeyframeTrack(
            this.weights,
            'weights',
            [0, 1, 2, 3, 4],
            [0, 0, 1, 0, 1, 1, 0, 1, 0, 0],
          ),
        ]),
      );
    }

    override update(): void {
      controls?.update();
      if (this.morphAction.playing) {
        stretch.value = String(this.weights.get(0));
        spikes.value = String(this.weights.get(1));
        $('stretch-value').textContent = this.weights.get(0).toFixed(2);
        $('spikes-value').textContent = this.weights.get(1).toFixed(2);
      }
    }
  }

  const scene = new Viewer();
  controls = new OrbitControls(scene.camera3D, canvasElement);
  controls.target.set(0, 0.9, 0);
  controls.update();
  await runtime.setScene(scene);
  runtime.start();

  play.disabled = false;
  play.addEventListener('click', () => {
    const resume = play.textContent === 'Play';
    for (const action of scene.actions) {
      // stop() would rewind to 0; pausing keeps the current time.
      if (resume) action.play();
      else action.playing = false;
    }
    play.textContent = resume ? 'Pause' : 'Play';
  });
  speed.addEventListener('input', () => {
    for (const action of scene.actions) action.timeScale = Number(speed.value);
    $('speed-value').textContent = `${Number(speed.value).toFixed(1)}×`;
  });
  loop.addEventListener('change', () => {
    for (const action of scene.actions) action.loop = loop.checked;
  });
  auto.addEventListener('change', () => {
    stretch.disabled = spikes.disabled = auto.checked;
    if (auto.checked) scene.morphAction.play();
    else scene.morphAction.playing = false;
  });
  for (const [slider, index] of [
    [stretch, 0],
    [spikes, 1],
  ] as const)
    slider.addEventListener('input', () => {
      scene.weights.set(index, Number(slider.value));
      $(`${slider.id}-value`).textContent = Number(slider.value).toFixed(2);
    });

  const report = window.setInterval(() => {
    readout.textContent = [
      ...model.animations.map((clip, i) => {
        const action = scene.actions[i];
        return `glTF clip "${clip.name || `#${i}`}"  ${action.time.toFixed(2)} / ${clip.duration.toFixed(2)} s  tracks ${clip.tracks.length}  ${action.playing ? 'playing' : 'paused'}  ×${action.timeScale.toFixed(1)}`;
      }),
      `morph weights  stretch ${scene.weights.get(0).toFixed(2)}  spikes ${scene.weights.get(1).toFixed(2)}${scene.morphAction.playing ? `  (clip t=${scene.morphAction.time.toFixed(2)} s)` : ''}`,
    ].join('\n');
  }, 100);

  status.textContent = `${runtime.graphics.backend} · GLTFLoader skinned clip + MorphTargets with slider and keyframe-driven weights`;
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    window.clearInterval(report);
    release();
  });
} catch (error) {
  release();
  status.textContent = error instanceof Error ? error.message : String(error);
}

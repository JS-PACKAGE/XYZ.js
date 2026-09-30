import {
  Game,
  Scene,
  Group,
  Mesh,
  Geometry,
  Texture,
  PBRMaterial,
  InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
  PerspectiveCamera,
  OrthographicCamera,
  OrbitControls,
  Raycaster,
  PointLight,
  SpotLight,
  GLTFLoader,
  type GLTFAsset,
  type RendererPreference,
} from '../../src/index.js';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;
const selection = document.querySelector<HTMLParagraphElement>('#pick')!;
const backend = document.querySelector<HTMLSelectElement>('#backend')!;
const cameraChoice = document.querySelector<HTMLSelectElement>('#camera')!;
const shadows = document.querySelector<HTMLInputElement>('#shadows')!;
const post = document.querySelector<HTMLInputElement>('#post')!;
const pause = document.querySelector<HTMLButtonElement>('#pause')!;
const renderer = (new URLSearchParams(location.search).get('renderer') ??
  'webgpu') as RendererPreference;
backend.value = renderer;
backend.addEventListener('change', () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
});

let game: Game | undefined;
let controls: OrbitControls | undefined;
let asset: GLTFAsset | undefined;
let white: Texture | undefined;
const listeners = new AbortController();
function cleanup(): void {
  listeners.abort();
  controls?.destroy();
  game?.destroy();
  asset?.dispose();
  white?.destroy();
}
try {
  game = await Game.create({ canvas, renderer, width: 960, height: 540 });
  game.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });
  if (!game.graphics.capabilities.threeD)
    throw new Error(
      'Canvas2D is 2D-only: the advanced 3D scene is not submitted.',
    );
  const image = new OffscreenCanvas(1, 1);
  const context = image.getContext('2d')!;
  context.fillStyle = 'white';
  context.fillRect(0, 0, 1, 1);
  white = await Texture.fromImage(image);
  asset = await new GLTFLoader().load(
    new URL('./skinned-ribbon.gltf', import.meta.url).href,
  );
  const model = asset;
  class AdvancedScene extends Scene {
    readonly orbit = this.add(new Group());
    readonly pickable = new Map<Mesh, string>();
    private angle = 0;
    constructor() {
      super();
      this.camera3D.position.set(7, 5, 9);
      this.camera3D.lookAt(new Vector3(0, 0.7, 0));
      this.ambientLight = 0.15;
      this.directionalLight.intensity = 3;
      this.directionalLight.direction.set(3, 6, 4).normalize();
      this.shadows.enabled = true;
      this.shadows.extent = 16;
      const floor = this.add(
        new Mesh({
          geometry: Geometry.plane(14, 14),
          material: new PBRMaterial({
            texture: white!,
            color: [0.4, 0.45, 0.5],
            roughness: 0.9,
          }),
        }),
      );
      floor.position.y = -0.6;
      floor.castShadow = false;
      this.pickable.set(floor, 'Floor');
      const sphere = this.orbit.add(
        new Mesh({
          geometry: Geometry.sphere(0.7),
          material: new PBRMaterial({
            texture: white!,
            color: [0.8, 0.25, 0.08],
            metallic: 0.85,
            roughness: 0.25,
          }),
          position: [1.3, 0.7, 0],
        }),
      );
      this.pickable.set(sphere, 'Metal sphere in rotating Group');
      const instances = this.add(
        new InstancedMesh({
          geometry: Geometry.cube(0.45),
          material: new PBRMaterial({
            texture: white!,
            color: [0.2, 0.55, 0.95],
            roughness: 0.4,
          }),
          count: 24,
        }),
      );
      const matrix = new Matrix4();
      const rotation = new Quaternion();
      const position = new Vector3();
      const scale = new Vector3(1, 1, 1);
      for (let i = 0; i < instances.count; i++) {
        const angle = (i / instances.count) * Math.PI * 2;
        position.set(Math.cos(angle) * 3.7, 0, Math.sin(angle) * 3.7);
        rotation.setFromEuler(0, angle, 0);
        instances.setMatrixAt(i, matrix.compose(position, rotation, scale));
      }
      this.pickable.set(instances, 'Instanced cube');
      model.scene.position.set(-1.4, 0, 0);
      this.add(model.scene);
      for (const clip of model.animations)
        this.animations.clipAction(clip).play();
      this.pointLights.push(
        new PointLight({
          position: new Vector3(-2, 3, 2),
          color: [0.2, 0.6, 1],
          intensity: 15,
          range: 10,
        }),
      );
      this.spotLights.push(
        new SpotLight({
          position: new Vector3(3, 5, 0),
          direction: new Vector3(-0.5, -1, 0).normalize(),
          color: [1, 0.4, 0.2],
          intensity: 30,
          range: 12,
        }),
      );
      this.postProcessing.bloomStrength = 0.3;
      this.postProcessing.bloomThreshold = 0.8;
      this.postProcessing.exposure = 1.1;
    }
    override update(dt: number): void {
      this.angle += dt * 0.35;
      this.orbit.rotation.setFromEuler(0, this.angle, 0);
      controls?.update();
    }
    protected override onDestroy(): void {
      controls?.destroy();
      model.dispose();
      white?.destroy();
    }
  }
  const scene = new AdvancedScene();
  function attachControls(): void {
    controls?.destroy();
    controls = new OrbitControls(scene.camera3D, canvas);
    controls.target.set(0, 0.7, 0);
    controls.update();
  }
  attachControls();
  cameraChoice.addEventListener(
    'change',
    () => {
      const previous = scene.camera3D;
      const next =
        cameraChoice.value === 'orthographic'
          ? new OrthographicCamera()
          : new PerspectiveCamera();
      next.position.copy(previous.position);
      next.lookAt(controls!.target);
      scene.camera3D = next;
      attachControls();
    },
    { signal: listeners.signal },
  );
  shadows.addEventListener(
    'change',
    () => {
      scene.shadows.enabled = shadows.checked;
    },
    { signal: listeners.signal },
  );
  post.addEventListener(
    'change',
    () => {
      scene.postProcessing.enabled = post.checked;
    },
    { signal: listeners.signal },
  );
  pause.addEventListener(
    'click',
    () => {
      if (game!.state === 'running') {
        game!.pause();
        pause.textContent = 'Resume';
      } else {
        game!.resume();
        pause.textContent = 'Pause';
      }
    },
    { signal: listeners.signal },
  );
  document.querySelector('#destroy')!.addEventListener(
    'click',
    () => {
      cleanup();
      status.textContent =
        'Destroyed: scene, model textures, controls and GPU resources released.';
    },
    { signal: listeners.signal },
  );
  const raycaster = new Raycaster();
  canvas.addEventListener(
    'click',
    (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = 1 - ((event.clientY - rect.top) / rect.height) * 2;
      const hit = raycaster
        .setFromCamera(x, y, scene.camera3D, rect.width / rect.height)
        .intersectObjects(scene.objects)[0];
      selection.textContent = hit
        ? `${scene.pickable.get(hit.object) ?? 'glTF mesh'}${hit.instanceId === undefined ? '' : ` #${hit.instanceId}`} · distance ${hit.distance.toFixed(2)}`
        : 'No selection';
    },
    { signal: listeners.signal },
  );
  await game.setScene(scene);
  game.start();
  status.textContent = `${game.graphics.backend} · PBR + shadows + 24 GPU instances + animated two-joint glTF`;
  window.addEventListener(
    'pagehide',
    (event) => {
      if (!event.persisted) cleanup();
    },
    { signal: listeners.signal },
  );
} catch (error) {
  cleanup();
  status.textContent = error instanceof Error ? error.message : String(error);
}

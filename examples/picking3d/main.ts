import {
  Game,
  Scene,
  Group,
  Mesh,
  Geometry,
  Texture,
  PBRMaterial,
  Vector3,
  PerspectiveCamera,
  OrthographicCamera,
  OrbitControls,
  Raycaster,
  type RaycastHit,
  type RendererPreference,
} from '../../src/index.js';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;
const selection = document.querySelector<HTMLParagraphElement>('#selection')!;
const cameraState =
  document.querySelector<HTMLParagraphElement>('#camera-state')!;
const cameraButton = document.querySelector<HTMLButtonElement>('#camera')!;
const reparentButton = document.querySelector<HTMLButtonElement>('#reparent')!;
const motionButton = document.querySelector<HTMLButtonElement>('#motion')!;
let game: Game | undefined;
let white: Texture | undefined;
let controls: OrbitControls | undefined;
const listeners = new AbortController();
function cleanup(): void {
  listeners.abort();
  controls?.destroy();
  game?.destroy();
  white?.destroy();
}
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) cleanup();
});

try {
  game = await Game.create({
    canvas: '#game',
    width: 900,
    height: 506,
    renderer: (new URLSearchParams(location.search).get('renderer') ??
      'auto') as RendererPreference,
  });
  game.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });
  if (!game.graphics.capabilities.threeD)
    throw new Error(
      'This backend has no 3D capability. Canvas2D intentionally does not render meshes.',
    );
  const image = new OffscreenCanvas(1, 1);
  const context = image.getContext('2d')!;
  context.fillStyle = 'white';
  context.fillRect(0, 0, 1, 1);
  white = await Texture.fromImage(image);
  const texture = white;
  const raycaster = new Raycaster();
  const hits: RaycastHit[] = [];
  const pointer = { x: 0, y: 0, inside: false };
  const home = new Map<Mesh, Group>();
  const names = new Map<Group | Mesh, string>();
  const colors = new Map<Mesh, [number, number, number]>();
  let selected: Mesh | undefined;
  let hovered: Mesh | undefined;
  let moving = true;

  class PickingScene extends Scene {
    readonly stationary = this.add(new Group());
    readonly orbit = this.stationary.add(new Group());
    readonly moonOrbit = this.orbit.add(new Group());
    private angle = 0;
    private readoutTime = 0;
    constructor() {
      super();
      names.set(this.stationary, 'Stationary Group');
      names.set(this.orbit, 'Planet orbit');
      names.set(this.moonOrbit, 'Moon orbit (child of planet orbit)');
      this.moonOrbit.position.x = 2.5;
      this.camera3D.position.set(0, 3, 6.5);
      this.camera3D.lookAt(new Vector3());
      this.ambientLight = 0.35;
      this.directionalLight.intensity = 2;
      this.directionalLight.direction.set(3, 6, 5).normalize();
      this.body('Sun', this.stationary, 0.8, [1, 0.3, 0.08], [0, 0, 0]);
      this.body('Planet', this.orbit, 0.55, [0.08, 0.45, 1], [2.5, 0, 0]);
      this.body('Moon', this.moonOrbit, 0.28, [1, 0.8, 0.16], [1, 0.3, 0]);
    }
    private body(
      name: string,
      parent: Group,
      radius: number,
      color: [number, number, number],
      position: [number, number, number],
    ): void {
      const mesh = parent.add(
        new Mesh({
          geometry: Geometry.sphere(radius),
          material: new PBRMaterial({ texture, color, roughness: 0.65 }),
          position,
        }),
      );
      names.set(mesh, name);
      home.set(mesh, parent);
      colors.set(mesh, color);
    }
    pick(): Mesh | undefined {
      return pointer.inside
        ? raycaster
            .setFromCamera(
              pointer.x,
              pointer.y,
              this.camera3D,
              canvas.clientWidth / canvas.clientHeight,
            )
            .intersectObjects(this.objects, true, hits)[0]?.object
        : undefined;
    }
    report(): void {
      if (selected) {
        const e = selected.updateWorldMatrix().elements;
        selection.textContent = `${names.get(selected)} · parent: ${names.get(selected.parent as Group)} · world (${e[12].toFixed(2)}, ${e[13].toFixed(2)}, ${e[14].toFixed(2)}) · hover: ${hovered ? names.get(hovered) : 'none'}`;
      } else {
        selection.textContent = `No selection · hover: ${hovered ? names.get(hovered) : 'none'}`;
      }
      reparentButton.disabled =
        !selected || home.get(selected) === this.stationary;
      reparentButton.textContent =
        selected?.parent === this.stationary
          ? 'Return selection to its orbit'
          : 'Move selection to stationary Group';
      const camera = this.camera3D;
      cameraState.textContent = `${camera instanceof OrthographicCamera ? 'Orthographic' : 'Perspective'} · camera (${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)})${camera instanceof OrthographicCamera ? ` · zoom ${camera.zoom.toFixed(2)}` : ''} · orbits ${moving ? 'running' : 'paused'}`;
    }
    override update(dt: number): void {
      if (moving) this.angle += dt * 0.35;
      this.orbit.rotation.setFromEuler(0, this.angle, 0);
      this.moonOrbit.rotation.setFromEuler(0, this.angle * 2.5, 0);
      controls?.update();
      hovered = this.pick();
      for (const [mesh, color] of colors) {
        const tint =
          mesh === hovered
            ? [1, 1, 1]
            : mesh === selected
              ? [1, 0.3, 0.75]
              : color;
        for (let i = 0; i < 3; i++) mesh.material.color[i] = tint[i];
      }
      this.readoutTime += dt;
      if (this.readoutTime >= 0.1) {
        this.readoutTime = 0;
        this.report();
      }
    }
    protected override onDestroy(): void {
      listeners.abort();
      controls?.destroy();
      texture.destroy();
    }
  }
  const scene = new PickingScene();
  function attachControls(target = new Vector3()): void {
    controls?.destroy();
    controls = new OrbitControls(scene.camera3D, canvas);
    controls.target.copy(target);
    controls.minDistance = 3;
    controls.maxDistance = 25;
    controls.minZoom = 0.3;
    controls.maxZoom = 4;
    controls.update();
  }
  attachControls();
  function trackPointer(event: MouseEvent): void {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = 1 - ((event.clientY - rect.top) / rect.height) * 2;
    pointer.inside = Math.abs(pointer.x) <= 1 && Math.abs(pointer.y) <= 1;
  }
  canvas.addEventListener('pointermove', trackPointer, {
    signal: listeners.signal,
  });
  canvas.addEventListener(
    'pointerleave',
    () => {
      pointer.inside = false;
    },
    { signal: listeners.signal },
  );
  let downX = 0,
    downY = 0;
  canvas.addEventListener(
    'pointerdown',
    (event) => {
      downX = event.clientX;
      downY = event.clientY;
    },
    { signal: listeners.signal },
  );
  canvas.addEventListener(
    'click',
    (event) => {
      if (Math.hypot(event.clientX - downX, event.clientY - downY) > 5) return;
      trackPointer(event);
      selected = scene.pick();
      scene.report();
    },
    { signal: listeners.signal },
  );
  cameraButton.addEventListener(
    'click',
    () => {
      const target = controls!.target.clone();
      const next =
        scene.camera3D instanceof OrthographicCamera
          ? new PerspectiveCamera()
          : new OrthographicCamera();
      if (next instanceof OrthographicCamera) next.height = 7;
      next.position.copy(scene.camera3D.position);
      scene.camera3D = next;
      attachControls(target);
      cameraButton.textContent =
        next instanceof OrthographicCamera
          ? 'Use perspective camera'
          : 'Use orthographic camera';
      scene.report();
    },
    { signal: listeners.signal },
  );
  reparentButton.addEventListener(
    'click',
    () => {
      if (!selected) return;
      const parent = home.get(selected)!;
      (selected.parent === scene.stationary ? parent : scene.stationary).add(
        selected,
      );
      scene.report();
    },
    { signal: listeners.signal },
  );
  motionButton.addEventListener(
    'click',
    () => {
      moving = !moving;
      motionButton.textContent = moving ? 'Pause orbits' : 'Resume orbits';
      scene.report();
    },
    { signal: listeners.signal },
  );
  await game.setScene(scene);
  game.start();
  cameraButton.disabled = motionButton.disabled = false;
  scene.report();
  status.textContent = `${game.graphics.backend} · nested Groups, OrbitControls and exact triangle Raycaster picking`;
} catch (error) {
  cleanup();
  status.textContent = error instanceof Error ? error.message : String(error);
}

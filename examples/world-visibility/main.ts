import {
  Game,
  Geometry,
  HLOD,
  InstancedMesh,
  LOD,
  Matrix4,
  Mesh,
  PBRMaterial,
  Quaternion,
  Raycaster,
  Scene,
  Texture,
  Vector3,
  type RendererPreference,
} from '../../src/index.js';

const backend = document.querySelector<HTMLSelectElement>('#backend')!;
const distance = document.querySelector<HTMLInputElement>('#distance')!;
const orbit = document.querySelector<HTMLInputElement>('#orbit')!;
const moving = document.querySelector<HTMLInputElement>('#moving')!;
const occlusion = document.querySelector<HTMLInputElement>('#occlusion')!;
const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;
const info = document.querySelector<HTMLParagraphElement>('#info')!;
const picked = document.querySelector<HTMLParagraphElement>('#picked')!;
backend.value = new URLSearchParams(location.search).get('renderer') ?? 'auto';
backend.addEventListener('change', () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
});
let game: Game | undefined;
let white: Texture | undefined;
let report: number | undefined;
const listeners = new AbortController();
try {
  game = await Game.create({
    canvas,
    width: 900,
    height: 506,
    renderer: backend.value as RendererPreference,
  });
  const runtime = game;
  if (!runtime.graphics.capabilities.threeD)
    throw new Error(
      'World visibility requires WebGPU or WebGL2; Canvas2D is 2D-only.',
    );
  runtime.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });
  const image = new OffscreenCanvas(1, 1),
    context = image.getContext('2d')!;
  context.fillStyle = 'white';
  context.fillRect(0, 0, 1, 1);
  white = await Texture.fromImage(image);
  const texture = white;
  const amber = new PBRMaterial({
    alphaMode: 'OPAQUE',
    texture,
    color: [0.9, 0.45, 0.08],
    roughness: 0.8,
  });
  const green = new PBRMaterial({
    alphaMode: 'OPAQUE',
    texture,
    color: [0.08, 0.8, 0.22],
    roughness: 0.5,
  });
  const blue = new PBRMaterial({
    alphaMode: 'OPAQUE',
    texture,
    color: [0.12, 0.4, 0.9],
    roughness: 0.6,
  });
  const magenta = new PBRMaterial({
    alphaMode: 'OPAQUE',
    texture,
    color: [0.8, 0.12, 0.5],
    roughness: 0.6,
  });
  const names = new Map<Mesh, string>();
  class VisibilityWorld extends Scene {
    readonly wall = this.add(
      new Mesh({
        geometry: Geometry.cube(1),
        material: amber,
        position: [0, 1.5, 2],
        scale: [4, 4, 0.7],
      }),
    );
    readonly hidden = this.add(
      new Mesh({
        geometry: Geometry.sphere(0.7),
        material: green,
        position: [0, 1.2, -2],
      }),
    );
    readonly lod = this.add(
      new LOD({ screenRadius: 0.9, hysteresis: 8, crossFadeDuration: 0.5 }),
    );
    readonly hlod: HLOD;
    readonly instances = this.add(
      new InstancedMesh({
        geometry: Geometry.cube(0.35),
        material: blue,
        count: 160,
      }),
    );
    private time = 0;
    constructor() {
      super();
      this.shadows.enabled = true;
      this.shadows.extent = 35;
      this.ambientLight = 0.2;
      this.directionalLight.intensity = 2;
      this.directionalLight.direction.set(3, 7, 4).normalize();
      this.add(
        new Mesh({
          geometry: Geometry.plane(50, 70),
          material: new PBRMaterial({
            alphaMode: 'OPAQUE',
            texture,
            color: [0.35, 0.4, 0.45],
            roughness: 1,
          }),
          position: [0, -0.7, -12],
          castShadow: false,
        }),
      );
      const fine = new Mesh({
        geometry: Geometry.sphere(0.9, 32, 16),
        material: magenta,
      });
      const coarse = new Mesh({ geometry: Geometry.cube(1.3), material: blue });
      this.lod.position.set(-4, 0.6, -1);
      this.lod.addScreenLevel(fine, 90).addScreenLevel(coarse, 0);
      names.set(fine, 'Detailed screen-size LOD sphere');
      names.set(coarse, 'Coarse screen-size LOD cube');
      const children = [-0.7, 0, 0.7].map(
        (x) =>
          new Mesh({
            geometry: Geometry.sphere(0.45),
            material: green,
            position: [x, Math.abs(x) / 2, 0],
          }),
      );
      for (const child of children) names.set(child, 'HLOD detailed child');
      const proxy = new Mesh({ geometry: Geometry.cube(1.5), material: amber });
      names.set(proxy, 'HLOD aggregate proxy');
      this.hlod = this.add(
        new HLOD({
          proxy,
          children,
          screenSize: 100,
          hysteresis: 8,
          crossFadeDuration: 0.5,
        }),
      );
      this.hlod.position.set(4, 0.3, -1);
      names.set(this.wall, 'Moving native-depth occluder');
      names.set(this.hidden, 'Occlusion candidate');
      names.set(this.instances, 'Individually culled blue instances');
      this.hidden.occlusionCulled = true;
      const matrix = new Matrix4(),
        rotation = new Quaternion(),
        scale = new Vector3(1, 1, 1),
        position = new Vector3();
      for (let i = 0; i < this.instances.count; i++) {
        position.set(((i % 20) - 9.5) * 1.3, -0.3, -5 - Math.floor(i / 20) * 3);
        this.instances.setMatrixAt(
          i,
          matrix.compose(position, rotation, scale),
        );
        this.instances.setColorAt(i, 0.4 + (i % 3) * 0.3, 0.5, 1);
      }
      this.aim();
    }
    aim(): void {
      const angle = (Number(orbit.value) * Math.PI) / 180,
        radius = Number(distance.value);
      this.camera3D.position.set(
        Math.sin(angle) * radius,
        4,
        Math.cos(angle) * radius,
      );
      this.camera3D.lookAt(new Vector3(0, 0, -3));
    }
    override update(deltaTime: number): void {
      this.time += deltaTime;
      this.wall.position.x = moving.checked ? Math.sin(this.time) * 5 : 0;
      this.hidden.occlusionCulled = occlusion.checked;
    }
  }
  const scene = new VisibilityWorld(),
    raycaster = new Raycaster();
  distance.addEventListener('input', () => scene.aim(), {
    signal: listeners.signal,
  });
  orbit.addEventListener('input', () => scene.aim(), {
    signal: listeners.signal,
  });
  document.querySelector<HTMLButtonElement>('#replace')!.addEventListener(
    'click',
    () => {
      const proxy = new Mesh({
        geometry: Geometry.sphere(0.9, 8, 4),
        material: magenta,
      });
      names.delete(scene.hlod.proxy as Mesh);
      names.set(proxy, 'Replacement HLOD proxy');
      scene.hlod.replaceProxy(proxy);
    },
    { signal: listeners.signal },
  );
  canvas.addEventListener(
    'click',
    (event) => {
      const rect = canvas.getBoundingClientRect();
      const hit = raycaster
        .setFromCamera(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          1 - ((event.clientY - rect.top) / rect.height) * 2,
          scene.camera3D,
          rect.width / rect.height,
        )
        .intersectObjects(scene.objects, true)[0];
      picked.textContent = hit
        ? `${names.get(hit.object) ?? 'Floor'} · distance ${hit.distance.toFixed(2)}`
        : 'No hit';
    },
    { signal: listeners.signal },
  );
  await runtime.setScene(scene);
  runtime.start();
  report = window.setInterval(() => {
    info.textContent = `Screen LOD ${scene.lod.level} · HLOD ${scene.hlod.level}\n160 instances · distance ${distance.value} · native occlusion ${occlusion.checked ? 'enabled' : 'disabled'}\nMoving poses invalidate depth proofs; pending/unsupported queries always draw.`;
  }, 100);
  status.textContent = `${runtime.graphics.backend} · native depth queries, screen-size coverage fades, HLOD, instance culling and shadows`;
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    listeners.abort();
    if (report !== undefined) window.clearInterval(report);
    runtime.destroy();
    texture.destroy();
  });
} catch (error) {
  listeners.abort();
  if (report !== undefined) window.clearInterval(report);
  game?.destroy();
  white?.destroy();
  status.textContent = error instanceof Error ? error.message : String(error);
}

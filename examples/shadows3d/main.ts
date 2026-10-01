import {
  Game,
  Scene,
  Mesh,
  Geometry,
  Texture,
  PBRMaterial,
  PointLight,
  SpotLight,
  OrbitControls,
  Vector3,
  type RendererPreference,
} from '../../src/index.js';

const status = document.querySelector<HTMLParagraphElement>('#status')!;
const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const listeners = new AbortController();
let game: Game | undefined;
let white: Texture | undefined;
let controls: OrbitControls | undefined;
function cleanup(): void {
  listeners.abort();
  controls?.destroy();
  game?.destroy();
  white?.destroy();
}
try {
  game = await Game.create({
    canvas,
    width: 960,
    height: 540,
    renderer: (new URLSearchParams(location.search).get('renderer') ??
      'auto') as RendererPreference,
  });
  if (!game.graphics.capabilities.threeD)
    throw new Error('This backend has no 3D capability.');
  game.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });
  const source = new OffscreenCanvas(1, 1);
  const ctx = source.getContext('2d')!;
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 1, 1);
  white = await Texture.fromImage(source);
  const scene = new Scene();
  scene.camera3D.position.set(7, 6, 10);
  scene.camera3D.lookAt(new Vector3(0, 1, 0));
  scene.ambientLight = 0.06;
  Object.assign(scene.shadows, {
    enabled: true,
    mapSize: 512,
    extent: 24,
    cascadeDistance: 45,
  });
  const point = new PointLight({
    position: [-3, 5, 3],
    intensity: 60,
    range: 18,
    castShadow: true,
  });
  const spot = new SpotLight({
    position: [-3, 5, 3],
    direction: [3, -5, -3],
    intensity: 60,
    range: 18,
    innerAngle: 0.35,
    outerAngle: 0.75,
    castShadow: true,
  });
  scene.pointLights.push(point);
  scene.spotLights.push(spot);
  const floor = scene.add(
    new Mesh({
      geometry: Geometry.plane(30, 30),
      material: new PBRMaterial({
        texture: white,
        color: [0.6, 0.65, 0.75],
        roughness: 0.9,
      }),
      castShadow: false,
    }),
  );
  const casters: Mesh[] = [];
  const geometry = Geometry.cube(1.5);
  for (const position of [
    [0, 0.75, 0],
    [-3, 0.75, -4],
    [4, 0.75, -9],
  ] as [number, number, number][])
    casters.push(
      scene.add(
        new Mesh({
          geometry,
          material: new PBRMaterial({
            texture: white,
            color: [0.7, 0.32, 0.12],
            roughness: 0.7,
          }),
          position,
        }),
      ),
    );
  const checkbox = (id: string): boolean =>
    document.querySelector<HTMLInputElement>(`#${id}`)!.checked;
  function apply(): void {
    const mode = document.querySelector<HTMLSelectElement>('#mode')!.value;
    point.intensity = mode === 'point' ? 60 : 0;
    spot.intensity = mode === 'spot' ? 60 : 0;
    scene.directionalLight.intensity =
      mode === 'directional' || mode === 'cascade' ? 2 : 0;
    scene.shadows.cascades = mode === 'cascade' ? 4 : 1;
    scene.shadows.enabled = checkbox('shadows');
    floor.receiveShadow = checkbox('receive');
    for (const caster of casters) caster.castShadow = checkbox('cast');
    status.textContent = `${game!.graphics.backend} · ${mode} shadows · atlas tile 512px`;
  }
  document.body.addEventListener('input', apply, { signal: listeners.signal });
  controls = new OrbitControls(scene.camera3D, canvas);
  controls.target.set(0, 1, 0);
  controls.minDistance = 4;
  controls.maxDistance = 40;
  controls.update();
  apply();
  await game.setScene(scene);
  game.start();
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) cleanup();
  });
} catch (error) {
  cleanup();
  status.textContent = error instanceof Error ? error.message : String(error);
}

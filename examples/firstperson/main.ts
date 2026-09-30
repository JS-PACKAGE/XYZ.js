import {
  FirstPersonControls,
  Game,
  Geometry,
  Mesh,
  PBRMaterial,
  PostProcessor2D,
  Scene,
  Texture,
  type RendererPreference,
} from '../../src/index.js';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;
const stats = document.querySelector<HTMLParagraphElement>('#stats')!;
const backend = document.querySelector<HTMLSelectElement>('#backend')!;
const fog = document.querySelector<HTMLInputElement>('#fog')!;
const effect = document.querySelector<HTMLInputElement>('#effect')!;
const renderer = (new URLSearchParams(location.search).get('renderer') ??
  'webgpu') as RendererPreference;
backend.value = renderer;
backend.addEventListener('change', () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
});

let game: Game | undefined;
let controls: FirstPersonControls | undefined;
let white: Texture | undefined;
const listeners = new AbortController();
function cleanup(): void {
  listeners.abort();
  controls?.destroy();
  game?.destroy();
  white?.destroy();
}
try {
  game = await Game.create({ canvas, renderer, width: 960, height: 540 });
  game.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });
  if (!game.graphics.capabilities.threeD)
    throw new Error('Canvas2D is 2D-only: the 3D scene is not submitted.');
  const image = new OffscreenCanvas(1, 1);
  const context = image.getContext('2d')!;
  context.fillStyle = 'white';
  context.fillRect(0, 0, 1, 1);
  white = await Texture.fromImage(image);
  const texture = white;
  const tint = new PostProcessor2D({
    wgsl: 'fn effect(color:vec4f,uv:vec2f,screen:vec2f)->vec4f { return vec4f(color.r * 1.1, color.g * 0.9, color.b * 0.7, color.a); }',
    glsl: 'vec4 effect(vec4 color,vec2 uv,vec2 screen) { return vec4(color.r * 1.1, color.g * 0.9, color.b * 0.7, color.a); }',
  });
  await game.graphics.preparePostProcessor(tint);

  class WalkScene extends Scene {
    constructor() {
      super();
      this.camera3D.position.set(3, 1.7, 15);
      this.ambientLight = 0.3;
      this.directionalLight.intensity = 2.5;
      this.directionalLight.direction.set(3, 6, 4).normalize();
      this.fog.enabled = true;
      this.fog.near = 10;
      this.fog.far = 60;
      this.fog.color = [0.6, 0.65, 0.75];
      const floor = this.add(
        new Mesh({
          geometry: Geometry.plane(120, 120),
          material: new PBRMaterial({
            texture,
            color: [0.3, 0.4, 0.3],
            roughness: 0.95,
          }),
        }),
      );
      floor.castShadow = false;
      // A 15×15 grid of pillars: most are outside the view at any time, which
      // is what the frustum-culling counter below makes visible.
      const geometry = Geometry.cube(1);
      for (let x = -7; x <= 7; x++) {
        for (let z = -7; z <= 7; z++) {
          const pillar = this.add(
            new Mesh({
              geometry,
              material: new PBRMaterial({
                texture,
                color: [0.5 + (x + 7) / 30, 0.4, 0.5 + (z + 7) / 30],
                roughness: 0.6,
              }),
            }),
          );
          pillar.position.set(x * 6, 1, z * 6);
          pillar.scale.set(1, 2, 1);
        }
      }
    }
    override update(): void {
      controls?.update(game!.clock.deltaTime);
      const s = game!.graphics.stats;
      stats.textContent = `meshes ${s.meshes} · culled ${s.culled} · draw calls ${s.drawCalls}`;
    }
  }
  const scene = new WalkScene();
  controls = new FirstPersonControls(scene.camera3D, canvas);
  controls.setRotation(0, -0.05);
  canvas.addEventListener(
    'click',
    () => void controls!.lock().catch(() => {}),
    {
      signal: listeners.signal,
    },
  );
  fog.addEventListener(
    'change',
    () => {
      scene.fog.enabled = fog.checked;
    },
    { signal: listeners.signal },
  );
  effect.addEventListener(
    'change',
    () => {
      scene.effects3D.length = 0;
      if (effect.checked) scene.effects3D.push(tint);
    },
    { signal: listeners.signal },
  );
  await game.setScene(scene);
  game.start();
  status.textContent = `${game.graphics.backend} · 225 pillars, fog, frustum culling`;
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

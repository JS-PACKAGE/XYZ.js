import {
  Game,
  Scene,
  Mesh,
  Geometry,
  Texture,
  PBRMaterial,
  PointLight,
  EnvironmentMap,
  OrbitControls,
  Vector3,
  PostProcessor2D,
  type RendererPreference,
} from '../../src/index.js';

const status = document.querySelector<HTMLParagraphElement>('#status')!;
const readout = document.querySelector<HTMLParagraphElement>('#readout')!;
const input = (id: string): HTMLInputElement =>
  document.querySelector<HTMLInputElement>(`#${id}`)!;
const listeners = new AbortController();
let game: Game | undefined;
let white: Texture | undefined;
let environment: EnvironmentMap | undefined;
let controls: OrbitControls | undefined;
let effect: PostProcessor2D | undefined;
function release(): void {
  listeners.abort();
  controls?.destroy();
  effect?.destroy();
  environment?.destroy();
  white?.destroy();
}
function cleanup(): void {
  game?.destroy();
  release();
}
try {
  game = await Game.create({
    canvas: '#game',
    width: 960,
    height: 540,
    renderer: (new URLSearchParams(location.search).get('renderer') ??
      'auto') as RendererPreference,
  });
  game.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });
  if (!game.graphics.capabilities.threeD)
    throw new Error(
      'This backend has no 3D capability. Canvas2D intentionally does not render PBR meshes.',
    );
  const source = new OffscreenCanvas(1, 1);
  const context = source.getContext('2d')!;
  context.fillStyle = 'white';
  context.fillRect(0, 0, 1, 1);
  white = await Texture.fromImage(source);
  const texture = white;
  environment = EnvironmentMap.gradient({
    zenith: [0.12, 0.3, 0.65],
    horizon: [0.8, 0.75, 0.6],
    ground: [0.08, 0.09, 0.12],
    sun: { direction: [0.5, 0.7, 0.4], color: [16, 13, 9], radius: 0.08 },
    width: 128,
  });
  effect = new PostProcessor2D({
    wgsl: `fn effect(color: vec4f, uv: vec2f, screen: vec2f) -> vec4f {
      let p = uv * 2.0 - 1.0;
      return vec4f(color.rgb * (1.0 - 0.35 * dot(p, p)), color.a);
    }`,
    glsl: `vec4 effect(vec4 color, vec2 uv, vec2 screen) {
      vec2 p = uv * 2.0 - 1.0;
      return vec4(color.rgb * (1.0 - 0.35 * dot(p, p)), color.a);
    }`,
  });
  await game.graphics.preparePostProcessor(effect);
  const vignette = effect;
  class MaterialScene extends Scene {
    private angle = (35 * Math.PI) / 180;
    readonly point = new PointLight({
      position: [-3, 4, 3],
      color: [1, 0.35, 0.08],
      intensity: 35,
      range: 14,
    });
    readonly marker: Mesh;
    constructor() {
      super();
      this.camera3D.position.set(8, 7, 15);
      this.camera3D.lookAt(new Vector3(0, 3, 0));
      this.environment = environment;
      this.background = environment;
      this.backgroundIntensity = 0.6;
      this.shadows.extent = 20;
      this.shadows.target.set(0, 2, 0);
      this.shadows.far = 50;
      this.postProcessing.enabled = true;
      this.postProcessing.bloomThreshold = 1;
      this.postProcessing.bloomRadius = 4;
      this.fog.mode = 'exp2';
      this.fog.color = [0.5, 0.6, 0.75];
      this.pointLights.push(this.point);
      const sphere = Geometry.sphere(0.55);
      for (let y = 0; y < 5; y++)
        for (let x = 0; x < 5; x++) {
          this.add(
            new Mesh({
              geometry: sphere,
              material: new PBRMaterial({
                texture,
                color: [0.72, 0.46, 0.18],
                metallic: x / 4,
                roughness: 0.05 + (y / 4) * 0.95,
                alphaMode: 'OPAQUE',
              }),
              position: [(x - 2) * 1.45, 0.7 + y * 1.45, 0],
            }),
          );
        }
      this.add(
        new Mesh({
          geometry: Geometry.plane(18, 14),
          material: new PBRMaterial({
            texture,
            color: [0.25, 0.3, 0.38],
            roughness: 0.9,
            alphaMode: 'OPAQUE',
          }),
          castShadow: false,
        }),
      );
      this.marker = this.add(
        new Mesh({
          geometry: Geometry.sphere(0.12, 12, 8),
          material: new PBRMaterial({
            texture,
            emissive: [8, 2, 0.4],
            color: [1, 0.5, 0.1],
            alphaMode: 'OPAQUE',
          }),
          castShadow: false,
        }),
      );
    }
    apply(): void {
      this.shadows.enabled = input('shadows').checked;
      this.directionalLight.intensity = input('directional').checked ? 2.5 : 0;
      this.point.intensity = input('point').checked ? 35 : 0;
      this.point.position.x = Number(input('point-x').value);
      this.marker.position.copy(this.point.position);
      this.marker.visible = input('point').checked;
      this.postProcessing.exposure = Number(input('exposure').value);
      this.postProcessing.bloomStrength = Number(input('bloom').value);
      this.fog.density = Number(input('fog').value);
      this.fog.enabled = this.fog.density > 0;
      this.environmentIntensity = Number(input('environment').value);
      this.effects3D.length = 0;
      if (input('vignette').checked) this.effects3D.push(vignette);
      readout.textContent = `Shadows ${this.shadows.enabled ? 'on' : 'off'} · directional ${this.directionalLight.intensity ? 'on' : 'off'} · point ${this.point.intensity ? 'on' : 'off'} at X ${this.point.position.x.toFixed(1)} · exposure ${this.postProcessing.exposure.toFixed(2)} · bloom ${this.postProcessing.bloomStrength.toFixed(2)} · fog ${this.fog.density.toFixed(3)} · environment ${this.environmentIntensity.toFixed(2)} · vignette ${this.effects3D.length ? 'on' : 'off'}`;
    }
    override update(dt: number): void {
      if (input('animate').checked) this.angle += dt * 0.3;
      else this.angle = (Number(input('angle').value) * Math.PI) / 180;
      this.directionalLight.direction
        .set(Math.sin(this.angle) * 0.7, 1, Math.cos(this.angle) * 0.7)
        .normalize();
      controls?.update();
    }
    protected override onDestroy(): void {
      release();
    }
  }
  const scene = new MaterialScene();
  controls = new OrbitControls(
    scene.camera3D,
    document.querySelector<HTMLCanvasElement>('#game')!,
  );
  controls.target.set(0, 3, 0);
  controls.minDistance = 5;
  controls.maxDistance = 40;
  controls.update();
  document
    .querySelector('.controls')!
    .addEventListener('input', () => scene.apply(), {
      signal: listeners.signal,
    });
  scene.apply();
  await game.setScene(scene);
  game.start();
  status.textContent = `${game.graphics.backend} · 25 metallic/roughness samples · directional shadows + point light · generated environment + fog + HDR/bloom`;
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) cleanup();
  });
} catch (error) {
  cleanup();
  status.textContent = error instanceof Error ? error.message : String(error);
}

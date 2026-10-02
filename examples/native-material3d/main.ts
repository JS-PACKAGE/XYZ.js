import {
  Game,
  Geometry,
  Mesh,
  NativeMaterial3D,
  PBRMaterial,
  PointLight,
  Scene,
  SpotLight,
  Texture,
  Vector3,
  type RendererPreference,
} from '../../src/index.js';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const backend = document.querySelector<HTMLSelectElement>('#backend')!;
const deformation = document.querySelector<HTMLInputElement>('#deformation')!;
const tint = document.querySelector<HTMLInputElement>('#tint')!;
const animate = document.querySelector<HTMLInputElement>('#animate')!;
const lights = document.querySelector<HTMLInputElement>('#lights')!;
const shadows = document.querySelector<HTMLInputElement>('#shadows')!;
const weighted = document.querySelector<HTMLInputElement>('#weighted')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;
const stats = document.querySelector<HTMLParagraphElement>('#stats')!;
const listeners = new AbortController();
backend.value = new URLSearchParams(location.search).get('renderer') ?? 'auto';
backend.addEventListener(
  'change',
  () => {
    const url = new URL(location.href);
    url.searchParams.set('renderer', backend.value);
    location.href = url.href;
  },
  { signal: listeners.signal },
);
const wgsl = `
fn xyzDeform(position: vec3f, normal: vec3f, uv: vec2f) -> XYZVertex {
  let wave = sin(position.y * 6.0 + mesh.custom[0].x) * mesh.custom[0].y;
  return XYZVertex(position + normal * wave, normal);
}
fn xyzSurface(world: vec3f, normal: vec3f, uv: vec2f, texel: vec4f) -> vec4f {
  let pattern = textureSample(xyzMap0, xyzSampler0, uv);
  return vec4f(texel.rgb * mix(vec3f(0.2), pattern.rgb * mesh.custom[1].rgb, 0.9), texel.a);
}`;
const glsl = `
XYZVertex xyzDeform(vec3 position, vec3 normal, vec2 uv) {
  float wave = sin(position.y * 6.0 + xyzUniforms[0].x) * xyzUniforms[0].y;
  return XYZVertex(position + normal * wave, normal);
}
vec4 xyzSurface(vec3 world, vec3 normal, vec2 uv, vec4 texel) {
  vec3 pattern = texture(xyzMap0, uv).rgb;
  return vec4(texel.rgb * mix(vec3(0.2), pattern * xyzUniforms[1].rgb, 0.9), texel.a);
}`;
let game: Game | undefined;
let white: Texture | undefined;
let pattern: Texture | undefined;
let material: NativeMaterial3D | undefined;
let timer: number | undefined;
try {
  game = await Game.create({
    canvas,
    width: 960,
    height: 540,
    renderer: backend.value as RendererPreference,
  });
  const runtime = game;
  if (!runtime.graphics.capabilities.threeD)
    throw new Error(
      'Canvas2D does not support native per-mesh 3D shaders or local 3D lights. Select WebGPU or WebGL2.',
    );
  runtime.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });
  const plainImage = new OffscreenCanvas(1, 1),
    plainContext = plainImage.getContext('2d')!;
  plainContext.fillStyle = 'white';
  plainContext.fillRect(0, 0, 1, 1);
  white = await Texture.fromImage(plainImage);
  const patternImage = new OffscreenCanvas(64, 32),
    patternContext = patternImage.getContext('2d')!;
  patternContext.fillStyle = '#ffffff';
  patternContext.fillRect(0, 0, 64, 32);
  patternContext.fillStyle = '#305dd4';
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 8; x++)
      if ((x + y) % 2 === 0) patternContext.fillRect(x * 8, y * 8, 8, 8);
  pattern = await Texture.fromImage(patternImage);
  const texture = white;
  material = new NativeMaterial3D({
    texture,
    textures: [pattern],
    wgsl,
    glsl,
    deformationBounds: 0.6,
    opacity: 0.85,
    transparent: true,
    label: 'Patterned wave sphere',
  });
  const native = material;
  class NativeWorld extends Scene {
    private time = 0;
    constructor() {
      super();
      this.ambientLight = 0.1;
      this.directionalLight.intensity = 0.6;
      this.directionalLight.direction.set(2, 5, 3).normalize();
      this.shadows.extent = 22;
      this.shadows.mapSize = 512;
      this.add(
        new Mesh({
          geometry: Geometry.sphere(1.25, 32, 24),
          material: native,
          position: [0, 1.75, 3],
        }),
      );
      const tileMaterial = new PBRMaterial({
        texture,
        color: [0.75, 0.8, 0.9],
        roughness: 0.9,
      });
      this.add(
        new Mesh({
          geometry: Geometry.plane(18, 18),
          material: tileMaterial,
          position: [0, -0.06, -4],
          castShadow: false,
        }),
      );
      const colors: [number, number, number][] = [
        [1, 0.15, 0.1],
        [0.12, 1, 0.2],
        [0.12, 0.3, 1],
        [1, 0.65, 0.1],
      ];
      for (let row = 0; row < 4; row++)
        for (let column = 0; column < 6; column++) {
          const x = (column - 2.5) * 2.4,
            z = -2 - row * 2.5,
            color = colors[(column + row) % colors.length];
          this.add(
            new Mesh({
              geometry: Geometry.cube(0.75),
              material: tileMaterial,
              position: [x, 0.4, z],
            }),
          );
          this.pointLights.push(
            new PointLight({
              position: [x, 1.4, z + 0.4],
              color,
              intensity: 3,
              range: 2.4,
              castShadow: true,
            }),
          );
          this.spotLights.push(
            new SpotLight({
              position: [x, 2.4, z],
              direction: [0, -1, 0],
              color,
              intensity: 4,
              range: 3,
              innerAngle: 0.4,
              outerAngle: 0.75,
              castShadow: true,
            }),
          );
        }
      this.camera3D.position.set(11, 12, 17);
      this.camera3D.lookAt(new Vector3(0, 0, -3));
    }
    override update(deltaTime: number): void {
      if (animate.checked) this.time += deltaTime;
      const color = tint.value.slice(1);
      native.setUniforms([
        this.time * 2,
        Number(deformation.value),
        0,
        0,
        parseInt(color.slice(0, 2), 16) / 255,
        parseInt(color.slice(2, 4), 16) / 255,
        parseInt(color.slice(4, 6), 16) / 255,
        1,
      ]);
      for (const point of this.pointLights)
        point.intensity = lights.checked ? 3 : 0;
      for (const spot of this.spotLights)
        spot.intensity = lights.checked ? 4 : 0;
      this.shadows.enabled = shadows.checked;
      this.transparency = weighted.checked ? 'weighted' : 'sorted';
    }
  }
  await runtime.graphics.prepareMaterial(native);
  const scene = new NativeWorld();
  await runtime.setScene(scene);
  runtime.start();
  status.textContent = `${runtime.graphics.backend} · native mesh vertex/surface hooks ready · 24 point + 24 spot lights`;
  timer = window.setInterval(() => {
    const selection = scene.lightSelection.frameStats;
    stats.textContent = `Per-frame selection: ${selection.draws} draw selections · points selected ${selection.points.selected}, culled ${selection.points.culled}, overflow ${selection.points.overflow} · spots selected ${selection.spots.selected}, culled ${selection.spots.culled}, overflow ${selection.spots.overflow}. Shadow budget: up to 8 point / 8 spot lights.`;
  }, 200);
  document.querySelector<HTMLButtonElement>('#invalid')!.addEventListener(
    'click',
    async () => {
      const invalid = new NativeMaterial3D({
        texture,
        wgsl: 'invalid native shader',
        glsl: 'invalid native shader',
        label: 'Intentional diagnostic',
      });
      try {
        await runtime.graphics.prepareMaterial(invalid);
        status.textContent =
          'Unexpected: the invalid native shader was accepted.';
      } catch (error) {
        status.textContent = `Preparation rejected; scene unchanged: ${error instanceof Error ? error.message : String(error)}`;
      } finally {
        invalid.destroy();
      }
    },
    { signal: listeners.signal },
  );
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    listeners.abort();
    if (timer !== undefined) window.clearInterval(timer);
    runtime.destroy();
    native.destroy();
    texture.destroy();
    pattern?.destroy();
  });
} catch (error) {
  listeners.abort();
  if (timer !== undefined) window.clearInterval(timer);
  game?.destroy();
  material?.destroy();
  white?.destroy();
  pattern?.destroy();
  status.textContent = error instanceof Error ? error.message : String(error);
}

import {
  Game,
  Scene,
  Mesh,
  Geometry,
  Texture,
  PBRMaterial,
  ProceduralMaterial,
  type PBRFinishOptions,
  type ProceduralMaterialKind,
  PointLight,
  EnvironmentMap,
  ReflectionProbe,
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
const presets = new Map<ProceduralMaterialKind, ProceduralMaterial>();
const materialSelect = document.querySelector<HTMLSelectElement>('#material')!;
const finishSelect = document.querySelector<HTMLSelectElement>('#finish')!;
const finishes: Readonly<Record<string, PBRFinishOptions>> = {
  none: {},
  anisotropy: { anisotropy: 0.9, anisotropyRotation: 0.7 },
  iridescence: { iridescence: 1, iridescenceThickness: 0.5 },
  subsurface: { subsurface: 0.8, subsurfaceColor: [1, 0.35, 0.25] },
  height: { heightScale: 0.1 },
  wet: { wetness: 1 },
  snow: { snow: 1 },
  dirt: { dirt: 0.8, damage: 0.6 },
  detail: { detailStrength: 1, layerBlend: 1 },
  triplanar: { triplanar: 1 },
};
let cubemap: EnvironmentMap | undefined;
let controls: OrbitControls | undefined;
let effect: PostProcessor2D | undefined;
function release(): void {
  listeners.abort();
  controls?.destroy();
  effect?.destroy();
  environment?.destroy();
  cubemap?.destroy();
  white?.destroy();
  for (const preset of presets.values()) preset.destroy();
  presets.clear();
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
  for (const kind of [
    'wood',
    'brick',
    'stone',
    'metal',
    'fabric',
    'marble',
    'concrete',
    'tiles',
    'leather',
    'sand',
    'rust',
    'snow',
  ] as const) {
    presets.set(kind, await ProceduralMaterial.create(kind, { seed: 7 }));
  }
  environment = EnvironmentMap.gradient({
    zenith: [0.12, 0.3, 0.65],
    horizon: [0.8, 0.75, 0.6],
    ground: [0.08, 0.09, 0.12],
    sun: { direction: [0.5, 0.7, 0.4], color: [16, 13, 9], radius: 0.08 },
    width: 128,
  });
  const face = (r: number, g: number, b: number): ImageData => {
    const image = new ImageData(16, 16);
    for (let p = 0; p < 16 * 16; p++) {
      image.data[p * 4] = r;
      image.data[p * 4 + 1] = g;
      image.data[p * 4 + 2] = b;
      image.data[p * 4 + 3] = 255;
    }
    return image;
  };
  cubemap = EnvironmentMap.fromCubemapImageData([
    face(220, 80, 70),
    face(80, 200, 200),
    face(110, 160, 240),
    face(50, 45, 40),
    face(230, 180, 75),
    face(160, 90, 210),
  ]);
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
    readonly samples: Mesh[] = [];
    readonly sampleGeometry = Geometry.sphere(0.55);
    sampleMaterials: Partial<
      Record<'plain' | ProceduralMaterialKind, PBRMaterial[]>
    > = {};
    private selectedMaterial = '';
    private selectedFinish = '';
    readonly localProbe = new ReflectionProbe({
      environment: cubemap!,
      position: [2, 3.3, 0],
      min: [0.6, 0, -2],
      max: [4, 8, 2],
      enabled: false,
    });
    constructor() {
      super();
      this.camera3D.position.set(8, 7, 15);
      this.camera3D.lookAt(new Vector3(0, 3, 0));
      this.environment = environment;
      this.background = environment;
      this.backgroundIntensity = 0.6;
      this.reflectionProbes.push(this.localProbe);
      this.shadows.extent = 20;
      this.shadows.target.set(0, 2, 0);
      this.shadows.far = 50;
      this.postProcessing.enabled = true;
      this.postProcessing.bloomThreshold = 1;
      this.postProcessing.bloomRadius = 4;
      this.fog.mode = 'exp2';
      this.fog.color = [0.5, 0.6, 0.75];
      this.pointLights.push(this.point);
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
    private rebuildSamples(finish: string): void {
      this.sampleMaterials = {};
      for (const kind of ['plain', ...presets.keys()]) {
        const preset = presets.get(kind as ProceduralMaterialKind);
        const materials: PBRMaterial[] = [];
        for (let y = 0; y < 5; y++)
          for (let x = 0; x < 5; x++) {
            const factors = {
              metallic: x / 4,
              roughness: 0.05 + (y / 4) * 0.95,
              finish: finishes[finish],
            };
            materials.push(
              preset
                ? preset.createMaterial(factors)
                : new PBRMaterial({
                    texture,
                    color: [0.72, 0.46, 0.18],
                    ...factors,
                    alphaMode: 'OPAQUE',
                  }),
            );
          }
        this.sampleMaterials[kind as 'plain' | ProceduralMaterialKind] =
          materials;
      }
    }
    apply(): void {
      if (
        this.selectedMaterial !== materialSelect.value ||
        this.selectedFinish !== finishSelect.value
      ) {
        if (this.selectedFinish !== finishSelect.value) {
          this.selectedFinish = finishSelect.value;
          this.rebuildSamples(this.selectedFinish);
        }
        this.selectedMaterial = materialSelect.value;
        const materials =
          this.sampleMaterials[
            this.selectedMaterial as 'plain' | ProceduralMaterialKind
          ]!;
        // Replace consumers when the material set changes; shared maps and geometry stay.
        for (const sample of this.samples) sample.destroy();
        this.samples.length = 0;
        for (let y = 0; y < 5; y++)
          for (let x = 0; x < 5; x++)
            this.samples.push(
              this.add(
                new Mesh({
                  geometry: this.sampleGeometry,
                  material: materials[y * 5 + x]!,
                  position: [(x - 2) * 1.45, 0.7 + y * 1.45, 0],
                }),
              ),
            );
        const preset = presets.get(
          this.selectedMaterial as ProceduralMaterialKind,
        );
        for (const [slot, id] of [
          ['baseColor', 'base-map'],
          ['normal', 'normal-map'],
          ['metallicRoughness', 'surface-map'],
          ['occlusion', 'occlusion-map'],
        ] as const) {
          const canvas = document.querySelector<HTMLCanvasElement>(`#${id}`)!;
          const ctx = canvas.getContext('2d')!;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(
            preset?.textures[slot].image ?? texture.image,
            0,
            0,
            canvas.width,
            canvas.height,
          );
        }
      }
      this.shadows.enabled = input('shadows').checked;
      this.directionalLight.intensity = input('directional').checked ? 2.5 : 0;
      this.point.intensity = input('point').checked ? 35 : 0;
      this.point.position.x = Number(input('point-x').value);
      this.marker.position.copy(this.point.position);
      this.marker.visible = input('point').checked;
      this.postProcessing.exposure = Number(input('exposure').value);
      this.postProcessing.bloomStrength = Number(input('bloom').value);
      this.postProcessing.fxaa = input('fxaa').checked;
      this.postProcessing.ssao = input('ssao').checked;
      this.postProcessing.depthOfField = input('dof').checked;
      this.postProcessing.dofFocusDistance = Number(input('focus').value);
      this.postProcessing.dofBlurRadius = 12;
      this.fog.density = Number(input('fog').value);
      this.fog.enabled = this.fog.density > 0;
      this.environmentIntensity = Number(input('environment').value);
      this.localProbe.intensity = this.environmentIntensity;
      this.localProbe.enabled = input('probe').checked;
      this.environment = input('cubemap').checked ? cubemap : environment;
      this.background = this.environment;
      this.effects3D.length = 0;
      if (input('vignette').checked) this.effects3D.push(vignette);
      readout.textContent = `Material ${materialSelect.value} · finish ${finishSelect.value} · shadows ${this.shadows.enabled ? 'on' : 'off'} · directional ${this.directionalLight.intensity ? 'on' : 'off'} · point ${this.point.intensity ? 'on' : 'off'} at X ${this.point.position.x.toFixed(1)} · exposure ${this.postProcessing.exposure.toFixed(2)} · bloom ${this.postProcessing.bloomStrength.toFixed(2)} · fog ${this.fog.density.toFixed(3)} · environment ${this.environmentIntensity.toFixed(2)} · local probe ${this.localProbe.enabled ? 'on' : 'off'} · vignette ${this.effects3D.length ? 'on' : 'off'}`;
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
  status.textContent = `${game.graphics.backend} · ${presets.size} procedural material presets + plain · 25 metallic/roughness samples · directional shadows + point light · generated environment + fog + HDR/bloom`;
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) cleanup();
  });
} catch (error) {
  cleanup();
  status.textContent = error instanceof Error ? error.message : String(error);
}

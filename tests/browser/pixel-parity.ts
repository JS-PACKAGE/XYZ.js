import {
  createRenderer,
  EnvironmentMap,
  Geometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  Object3D,
  OrthographicCamera,
  PBRMaterial,
  PointLight,
  Scene,
  SkinnedMesh,
  SpotLight,
  Texture,
  Vector3,
  bakeLightmap,
  BakedIrradianceVolume,
  bindIrradianceVolume,
  PlanarReflection,
  ContactShadows,
  ContactShadowSettings,
  type RendererPreference,
  ColorLUT3D,
  ColorGradingSettings,
  PostEffectsSettings,
  setPostEffects,
  VolumetricFogSettings,
  LensFlareSettings,
  MotionBlurSettings,
} from '../../src/index.js';
import { frameProofs } from './frame-proof.js';

const output = document.querySelector<HTMLPreElement>('#report')!;
const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const preference = new URLSearchParams(location.search).get(
  'renderer',
) as RendererPreference;
const report = {
  renderer: preference,
  scenarios: [] as {
    name: string;
    pixels: number[];
    repeat: number[];
    width: number;
    height: number;
  }[],
  error: undefined as string | undefined,
};
async function run(): Promise<void> {
  let runtimeError: Error | undefined;
  const renderer = await createRenderer(
    canvas,
    preference,
    (error) => {
      runtimeError = error;
    },
    {
      antialias: false,
    },
  );
  if (renderer.backend !== preference)
    throw new Error('Forced backend changed.');
  renderer.resize(128, 128);
  if (runtimeError) throw runtimeError;
  const proofs = frameProofs(renderer, canvas);
  const source = document.createElement('canvas');
  source.width = source.height = 16;
  const ctx = source.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 16, 16);
  const white = await Texture.fromImage(source);
  ctx.fillStyle = '#d7b16a';
  ctx.fillRect(0, 0, 16, 16);
  ctx.fillStyle = '#326d99';
  ctx.fillRect(0, 0, 8, 8);
  ctx.fillStyle = '#bc334d';
  ctx.fillRect(8, 8, 8, 8);
  const texture = await Texture.fromImage(source);
  ctx.fillStyle = 'rgb(160,110,245)';
  ctx.fillRect(0, 0, 16, 16);
  const normal = await Texture.fromImage(source);
  const environment = EnvironmentMap.gradient({
    width: 32,
    zenith: [0.2, 0.5, 1],
    horizon: [0.6, 0.3, 0.15],
    ground: [0.1, 0.04, 0.01],
  });
  const geometry = Geometry.sphere(0.9, 24, 16);
  const draw = async (scene: Scene) => {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    const proof = proofs.next();
    renderer.beginFrame();
    renderer.render(scene, 128, 128);
    renderer.endFrame();
    try {
      return await proof;
    } catch (error) {
      throw new Error(`${String(error)}: ${proofs.graphicsEvents.join('\n')}`, {
        cause: error,
      });
    }
  };
  try {
    for (const name of [
      'plain-lights',
      'normal-mapped',
      'textured',
      'shadowed-ground',
      'ibl-gradient',
      'anisotropy',
      'iridescence',
      'subsurface',
      'dispersion',
      'transparent-blend',
      'instancing',
      'skinned',
      'post-lut',
      'post-agx',
      'post-reinhard',
      'post-neutral',
      'post-volume',
      'post-shafts',
      'post-flare',
      'post-motion',
    ]) {
      const scene = new Scene();
      try {
        const camera = new OrthographicCamera();
        camera.height = 3.6;
        camera.position.set(2.5, 1.8, 5);
        camera.lookAt(new Vector3(0, -0.15, 0));
        scene.camera3D = camera;
        scene.ambientLight = 0.12;
        scene.directionalLight.direction.set(0.3, 0.8, 1).normalize();
        scene.directionalLight.intensity = 0.7;
        scene.pointLights.push(
          new PointLight({
            position: [-2, 1, 2],
            intensity: 5,
            color: [1, 0.3, 0.1],
            range: 10,
          }),
        );
        scene.spotLights.push(
          new SpotLight({
            position: [1, 3, 2],
            direction: [-1, -3, -2],
            intensity: 8,
            color: [0.2, 0.6, 1],
            range: 10,
            outerAngle: 0.8,
          }),
        );
        const finish =
          name === 'anisotropy'
            ? { anisotropy: 0.7, anisotropyRotation: 0.4 }
            : name === 'iridescence'
              ? { iridescence: 0.8, iridescenceThickness: 0.35 }
              : name === 'subsurface'
                ? { subsurface: 0.6 }
                : name === 'dispersion'
                  ? { dispersion: 0.5 }
                  : undefined;
        const material = new PBRMaterial({
          texture: name === 'textured' ? texture : white,
          color: [0.8, 0.6, 0.35],
          opacity: name === 'transparent-blend' ? 0.45 : 1,
          roughness: 0.35,
          metallic: 0.2,
          emissive: name === 'post-flare' ? [4, 3, 1] : [0, 0, 0],
          alphaMode: name === 'transparent-blend' ? 'BLEND' : 'OPAQUE',
          normalTexture: name === 'normal-mapped' ? normal : undefined,
          finish,
          transmission: name === 'dispersion' ? 0.7 : 0,
        });
        if (name === 'ibl-gradient' || name === 'dispersion')
          scene.environment = environment;
        if (name === 'instancing') {
          const mesh = new InstancedMesh({ geometry, material, count: 2 });
          const first = new Matrix4();
          first.elements[12] = -0.65;
          first.elements[13] = 0.25;
          const second = new Matrix4();
          second.elements[12] = 0.65;
          second.elements[13] = -0.25;
          second.elements[14] = -0.4;
          mesh.setMatrixAt(0, first);
          mesh.setMatrixAt(1, second);
          scene.add(mesh);
        } else if (name === 'skinned') {
          const joint = scene.add(new Object3D());
          joint.rotation.setFromEuler(0, 0, 0.25);
          const vertices = geometry.vertices.length / 8;
          const indices = new Uint16Array(vertices * 4);
          const weights = new Float32Array(vertices * 4);
          for (let i = 0; i < vertices; i++) weights[i * 4] = 1;
          scene.add(
            new SkinnedMesh({
              geometry,
              material,
              joints: [joint],
              inverseBindMatrices: [new Matrix4()],
              jointIndices: indices,
              weights,
            }),
          );
        } else scene.add(new Mesh({ geometry, material }));
        if (name === 'shadowed-ground' || name === 'transparent-blend') {
          const ground = scene.add(
            new Mesh({
              geometry: Geometry.cube(),
              material: new PBRMaterial({
                texture,
                roughness: 0.9,
                alphaMode: 'OPAQUE',
              }),
            }),
          );
          ground.position.set(0, -1, 0);
          ground.scale.set(4, 0.1, 4);
        }
        if (name === 'shadowed-ground')
          Object.assign(scene.shadows, {
            enabled: true,
            mapSize: 128,
            extent: 5,
            far: 20,
          });
        if (name.startsWith('post-')) {
          scene.postProcessing.enabled = true;
          const effects = new PostEffectsSettings();
          if (name === 'post-lut')
            effects.colorGrading = new ColorGradingSettings(
              ColorLUT3D.preset(16, 'cool'),
            );
          if (name === 'post-agx') effects.toneMapper = 'agx';
          if (name === 'post-reinhard') effects.toneMapper = 'reinhard';
          if (name === 'post-neutral') effects.toneMapper = 'neutral';
          if (name === 'post-volume')
            effects.volumetricFog = new VolumetricFogSettings({
              density: 0.08,
              shaftStrength: 0,
            });
          if (name === 'post-shafts') {
            effects.volumetricFog = new VolumetricFogSettings({
              density: 0,
              shaftStrength: 0.5,
            });
            scene.directionalLight.direction.set(-2.5, -1.8, -5).normalize();
          }
          if (name === 'post-flare')
            effects.lensFlare = new LensFlareSettings({
              threshold: 0.5,
              strength: 0.5,
            });
          if (name === 'post-motion')
            effects.motionBlur = new MotionBlurSettings({ samples: 12 });
          setPostEffects(scene.postProcessing, effects);
        }
        const initialX = camera.position.x;
        await draw(scene);
        if (name === 'post-motion') camera.position.x = initialX + 0.2;
        const first = await draw(scene);
        if (name === 'post-motion') {
          camera.position.x = initialX;
          await draw(scene);
          camera.position.x = initialX + 0.2;
        }
        const repeat = await draw(scene);
        report.scenarios.push({
          name,
          pixels: Array.from(first.bytes),
          repeat: Array.from(repeat.bytes),
          width: first.width,
          height: first.height,
        });
      } finally {
        scene.destroy();
      }
    }
    for (const name of [
      'baked-lightmap-uv1',
      'irradiance-volume-left',
      'irradiance-volume-right',
      'planar-reflection-capture',
      'directional-contact-shadows',
    ]) {
      const scene = new Scene();
      const owned: { destroy(): void }[] = [];
      try {
        const camera = new OrthographicCamera();
        camera.height = 2.5;
        camera.position.set(0, 0, 3);
        camera.lookAt(new Vector3());
        scene.camera3D = camera;
        scene.ambientLight = 0;
        scene.directionalLight.intensity = 0;
        const surface = new Geometry({
          positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0],
          normals: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
          uvs: [0, 0, 1, 0, 1, 1, 0, 1],
          indices: [0, 1, 2, 0, 2, 3],
        });
        const material = new PBRMaterial({
          texture: white,
          metallic: 0,
          roughness: 1,
        });
        if (name === 'baked-lightmap-uv1') {
          scene.directionalLight.direction.set(0.6, 0, 1);
          scene.directionalLight.intensity = 0.8;
          const receiver = new Mesh({ geometry: surface, material });
          const blocker = new Mesh({
            geometry: Geometry.sphere(0.3, 16, 12),
            material,
            position: [0, 0, 0.5],
          });
          const baked = await bakeLightmap(scene, {
            meshes: [receiver, blocker],
            size: 256,
            padding: 2,
            samples: 8,
          });
          owned.push(baked, receiver, blocker);
          scene.directionalLight.intensity = 0;
          scene.add(
            new Mesh({
              geometry: baked.geometries.get(receiver)!,
              material: new PBRMaterial({
                texture: white,
                metallic: 0,
                roughness: 1,
                ...baked.materialOptions,
              }),
            }),
          );
        } else if (name.startsWith('irradiance-volume-')) {
          const coefficients = new Float32Array(8 * 27);
          for (let z = 0; z < 2; z++)
            for (let y = 0; y < 2; y++)
              for (let x = 0; x < 2; x++) {
                const base = ((z * 2 + y) * 2 + x) * 27;
                coefficients[base] = x ? 0.1 : 2.5;
                coefficients[base + 1] = 0.3;
                coefficients[base + 2] = x ? 2.5 : 0.1;
              }
          const volume = new BakedIrradianceVolume(
            {
              min: [-1, -1, -1],
              max: [1, 1, 1],
              resolution: [2, 2, 2],
            },
            coefficients,
          );
          owned.push(volume);
          const mesh = scene.add(
            new Mesh({
              geometry: Geometry.sphere(0.65, 24, 16),
              material,
            }),
          );
          bindIrradianceVolume(mesh, volume);
          // Reuse the binding after moving, as a dynamic consumer does at runtime.
          mesh.position.x = -0.5;
          if (name === 'irradiance-volume-right') mesh.position.x = 0.5;
          camera.position.x = mesh.position.x;
          camera.lookAt(new Vector3(mesh.position.x, 0, 0));
          scene.environment = environment;
        } else if (name === 'planar-reflection-capture') {
          if (
            !renderer.capturePlanarReflection ||
            !renderer.prepareNativePBRMaterial
          )
            throw new Error('Native planar reflection hooks missing.');
          scene.ambientLight = 1;
          camera.height = 5;
          camera.position.set(0, 3, 6);
          camera.lookAt(new Vector3());
          scene.add(
            new Mesh({
              geometry: Geometry.cube(0.9),
              material: new PBRMaterial({
                texture: white,
                color: [0.8, 0.1, 0.05],
                roughness: 1,
              }),
              position: [0, 1.2, 0],
            }),
          );
          scene.add(
            new Mesh({
              geometry: Geometry.cube(0.9),
              material: new PBRMaterial({
                texture: white,
                color: [0.05, 0.8, 0.1],
                roughness: 1,
              }),
              position: [0, -1.2, 0],
            }),
          );
          const reflection = new PlanarReflection({ size: 128 });
          owned.push(reflection);
          await renderer.capturePlanarReflection(scene, reflection);
          const reflected = reflection.createPBRMaterial({
            texture: white,
            color: [0, 0, 0],
            metallic: 0,
            roughness: 1,
          });
          owned.push(reflected);
          await renderer.prepareNativePBRMaterial(reflected);
          const floor = scene.add(
            new Mesh({
              geometry: Geometry.cube(6),
              material: reflected,
            }),
          );
          floor.scale.set(1, 0.005, 1);
        } else {
          scene.ambientLight = 0.05;
          scene.directionalLight.direction.set(1, 0, 1);
          scene.directionalLight.intensity = 1;
          scene.shadows.enabled = false;
          scene.add(new Mesh({ geometry: surface, material }));
          scene.add(
            new Mesh({
              geometry: Geometry.sphere(0.18, 16, 12),
              material,
              position: [0, 0, 0.24],
            }),
          );
          ContactShadows.set(
            scene,
            new ContactShadowSettings({
              distance: 0.8,
              thickness: 0.04,
              bias: 0.008,
              steps: 64,
            }),
          );
        }
        await draw(scene);
        const first = await draw(scene);
        const repeat = await draw(scene);
        report.scenarios.push({
          name,
          pixels: Array.from(first.bytes),
          repeat: Array.from(repeat.bytes),
          width: first.width,
          height: first.height,
        });
      } finally {
        scene.destroy();
        for (const value of owned) value.destroy();
      }
    }
  } finally {
    renderer.destroy();
    white.destroy();
    texture.destroy();
    normal.destroy();
    environment.destroy();
  }
}
void run()
  .then(() => {
    output.textContent = JSON.stringify(report);
    output.dataset.state = 'passed';
  })
  .catch((error: unknown) => {
    report.error = String(error);
    output.textContent = JSON.stringify(report);
    output.dataset.state = 'failed';
  });

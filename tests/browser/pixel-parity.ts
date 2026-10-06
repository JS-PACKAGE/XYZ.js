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
  type RendererPreference,
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

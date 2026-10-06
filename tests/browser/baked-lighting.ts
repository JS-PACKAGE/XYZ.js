import {
  createRenderer,
  Scene,
  Mesh,
  Geometry,
  PBRMaterial,
  Texture,
  OrthographicCamera,
  Vector3,
  BakedIrradianceVolume,
  bindIrradianceVolume,
  bakeLightmap,
  type RendererPreference,
} from '../../src/index.js';
import { frameProofs, errorDetail, type FrameProof } from './frame-proof.js';
const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const output = document.querySelector<HTMLPreElement>('#report')!;
const preference = (new URLSearchParams(location.search).get('renderer') ??
  'webgl2') as RendererPreference;
const report = {
  renderer: preference,
  scenarios: [] as { name: string; changedPixels: number; png: string }[],
  error: undefined as string | undefined,
};
function difference(a: FrameProof, b: FrameProof): number {
  let count = 0;
  for (let i = 0; i < a.bytes.length; i += 4)
    if (
      Math.max(
        Math.abs(a.bytes[i] - b.bytes[i]),
        Math.abs(a.bytes[i + 1] - b.bytes[i + 1]),
        Math.abs(a.bytes[i + 2] - b.bytes[i + 2]),
      ) > 8
    )
      count++;
  return count;
}
async function run(): Promise<void> {
  const renderer = await createRenderer(
    canvas,
    preference,
    (e) => {
      throw e;
    },
    { antialias: false },
  );
  renderer.resize(128, 128);
  const scene = new Scene(),
    camera = new OrthographicCamera();
  camera.height = 3;
  camera.position.set(0, 0, 5);
  camera.lookAt(new Vector3());
  scene.camera3D = camera;
  scene.ambientLight = 0;
  scene.directionalLight.intensity = 0;
  const image = document.createElement('canvas');
  image.width = image.height = 2;
  const ctx = image.getContext('2d')!;
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 2, 2);
  const texture = await Texture.fromImage(image);
  const proofs = frameProofs(renderer, canvas),
    owned: { destroy(): void }[] = [texture];
  const draw = async () => {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    const pending = proofs.next();
    renderer.beginFrame();
    renderer.render(scene, 128, 128);
    renderer.endFrame();
    return pending;
  };
  try {
    const mesh = new Mesh({
      geometry: Geometry.sphere(0.65, 16, 12),
      material: new PBRMaterial({ texture, metallic: 0, roughness: 1 }),
    });
    scene.add(mesh);
    const coefficients = new Float32Array(8 * 27);
    for (let z = 0; z < 2; z++)
      for (let y = 0; y < 2; y++)
        for (let x = 0; x < 2; x++) {
          const base = ((z * 2 + y) * 2 + x) * 27;
          coefficients[base] = x ? 0 : 3;
          coefficients[base + 2] = x ? 3 : 0;
        }
    const volume = new BakedIrradianceVolume(
      { min: [-1, -1, -1], max: [1, 1, 1], resolution: [2, 2, 2] },
      coefficients,
    );
    owned.push(volume);
    bindIrradianceVolume(mesh, volume);
    mesh.transform.position.x = -0.5;
    camera.position.x = -0.5;
    camera.lookAt(new Vector3(-0.5, 0, 0));
    const red = await draw();
    mesh.transform.position.x = 0.5;
    camera.position.x = 0.5;
    camera.lookAt(new Vector3(0.5, 0, 0));
    const blue = await draw();
    const changed = difference(red, blue);
    if (changed < 200)
      throw new Error(
        'Moving bound PBR mesh did not change irradiance pixels.',
      );
    report.scenarios.push({
      name: 'dynamic-probe-trilinear',
      changedPixels: changed,
      png: blue.png,
    });
    scene.remove(mesh);
    mesh.destroy();
    camera.position.set(0, 0, 5);
    camera.lookAt(new Vector3());
    const geometry = new Geometry({
      positions: [-1, -1, 0, 1, -1, 0, -1, 1, 0],
      normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
      uvs: [0, 0, 1, 0, 0, 1],
      indices: [0, 1, 2],
    });
    const receiver = new Mesh({
      geometry,
      material: new PBRMaterial({ texture }),
    });
    const blocker = new Mesh({
      geometry,
      material: new PBRMaterial({ texture }),
      position: [0, 0, 1],
    });
    scene.directionalLight.direction.set(0, 0, 1);
    scene.directionalLight.intensity = 0.8;
    const lit = await bakeLightmap(scene, {
      meshes: [receiver],
      size: 32,
      padding: 2,
      samples: 4,
    });
    const dark = await bakeLightmap(scene, {
      meshes: [receiver, blocker],
      size: 64,
      padding: 2,
      samples: 4,
    });
    owned.push(lit, dark);
    scene.directionalLight.intensity = 0;
    const litMesh = new Mesh({
      geometry: lit.geometries.get(receiver)!,
      material: new PBRMaterial({
        texture,
        metallic: 0,
        roughness: 1,
        ...lit.materialOptions,
      }),
    });
    scene.add(litMesh);
    const litFrame = await draw();
    scene.remove(litMesh);
    litMesh.destroy();
    const darkMesh = new Mesh({
      geometry: dark.geometries.get(receiver)!,
      material: new PBRMaterial({
        texture,
        metallic: 0,
        roughness: 1,
        ...dark.materialOptions,
      }),
    });
    scene.add(darkMesh);
    const darkFrame = await draw();
    const shadowChanged = difference(litFrame, darkFrame);
    if (shadowChanged < 200)
      throw new Error(
        'Baked sun occlusion did not change rendered PBR lightmap pixels.',
      );
    report.scenarios.push({
      name: 'sun-occlusion-lightmap-uv1',
      changedPixels: shadowChanged,
      png: darkFrame.png,
    });
    output.dataset.state = 'passed';
  } finally {
    scene.destroy();
    for (const value of owned) value.destroy();
    renderer.destroy();
  }
}
void run()
  .catch((error) => {
    report.error = errorDetail(error);
    output.dataset.state = 'failed';
  })
  .finally(() => {
    output.textContent = JSON.stringify(report, null, 2);
    for (const scenario of report.scenarios) {
      const preview = document.createElement('img');
      preview.src = scenario.png;
      preview.alt = scenario.name;
      preview.width = 192;
      preview.height = 192;
      document.body.append(preview);
    }
  });

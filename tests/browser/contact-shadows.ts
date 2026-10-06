import {
  createRenderer,
  Scene,
  Mesh,
  Geometry,
  PBRMaterial,
  Texture,
  OrthographicCamera,
  Vector3,
  ContactShadows,
  ContactShadowSettings,
  type RendererPreference,
} from '../../src/index.js';
import { frameProofs, errorDetail } from './frame-proof.js';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const output = document.querySelector<HTMLPreElement>('#report')!;
const preference = (new URLSearchParams(location.search).get('renderer') ??
  'webgl2') as RendererPreference;
const report = {
  renderer: preference,
  scenarios: [] as { name: string; changedPixels: number; png: string }[],
  error: undefined as string | undefined,
};

async function run(): Promise<void> {
  for (const antialias of [false, true]) {
    const renderer = await createRenderer(
      canvas,
      preference,
      (error) => {
        throw error;
      },
      { antialias },
    );
    renderer.resize(128, 128);
    const scene = new Scene(),
      camera = new OrthographicCamera();
    camera.height = 2.5;
    camera.position.set(0, 0, 3);
    camera.lookAt(new Vector3());
    scene.camera3D = camera;
    scene.ambientLight = 0.05;
    scene.directionalLight.direction.set(1, 0, 1);
    scene.directionalLight.intensity = 1;
    scene.shadows.enabled = false;
    const image = document.createElement('canvas');
    image.width = image.height = 2;
    const ctx = image.getContext('2d')!;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 2, 2);
    const texture = await Texture.fromImage(image);
    const receiverGeometry = new Geometry({
      positions: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0],
      normals: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      uvs: [0, 0, 1, 0, 1, 1, 0, 1],
      indices: [0, 1, 2, 0, 2, 3],
    });
    const material = new PBRMaterial({
      texture,
      metallic: 0,
      roughness: 1,
      alphaMode: 'OPAQUE',
    });
    const receiver = new Mesh({ geometry: receiverGeometry, material });
    const blocker = new Mesh({
      geometry: Geometry.sphere(0.18, 16, 12),
      material,
      position: [0, 0, 0.24],
    });
    scene.add(receiver);
    scene.add(blocker);
    const proofs = frameProofs(renderer, canvas);
    const draw = async () => {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      const proof = proofs.next();
      renderer.beginFrame();
      renderer.render(scene, 128, 128);
      renderer.endFrame();
      return proof;
    };
    try {
      const plain = await draw();
      ContactShadows.set(
        scene,
        new ContactShadowSettings({
          distance: 0.8,
          thickness: 0.04,
          bias: 0.008,
          steps: 64,
        }),
      );
      const shadowed = await draw();
      let darkened = 0,
        brightened = 0;
      for (let i = 0; i < plain.bytes.length; i += 4) {
        const delta = plain.bytes[i]! - shadowed.bytes[i]!;
        if (delta > 12) darkened++;
        if (delta < -12) brightened++;
      }
      if (darkened < 20 || brightened > darkened / 4)
        throw new Error(
          `Camera-depth contact occlusion failed: ${darkened} darkened / ${brightened} brightened pixels.`,
        );
      report.scenarios.push({
        name: antialias ? 'camera-depth-msaa' : 'camera-depth-single-sample',
        changedPixels: darkened,
        png: shadowed.png,
      });
      ContactShadows.set(scene, undefined);
      const restored = await draw();
      let mismatch = 0;
      for (let i = 0; i < plain.bytes.length; i += 4)
        if (Math.abs(plain.bytes[i]! - restored.bytes[i]!) > 8) mismatch++;
      if (mismatch > 4)
        throw new Error(
          'Disabling contact shadows did not restore the original image.',
        );
    } finally {
      ContactShadows.set(scene, undefined);
      scene.destroy();
      texture.destroy();
      renderer.destroy();
    }
  }
  output.dataset.state = 'passed';
}
void run()
  .catch((error) => {
    report.error = errorDetail(error);
    output.dataset.state = 'failed';
  })
  .finally(() => {
    output.textContent = JSON.stringify(report, null, 2);
  });

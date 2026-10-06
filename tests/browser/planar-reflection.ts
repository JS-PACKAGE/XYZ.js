import {
  createRenderer,
  Scene,
  Geometry,
  Mesh,
  Texture,
  TextureMaterial,
  PlanarReflection,
  Vector3,
  type Renderer,
  type RendererPreference,
  type NativePBRMaterial,
} from '../../src/index.js';
import { frameProofs, errorDetail } from './frame-proof.js';

const preference = (new URLSearchParams(location.search).get('renderer') ??
  'webgpu') as RendererPreference;
const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const output = document.querySelector<HTMLPreElement>('#report')!;
const report = {
  renderer: preference as string,
  assertions: [] as string[],
  error: undefined as string | undefined,
  capturePixels: undefined as { red: number; green: number; blue: number } | undefined,
};
function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
  report.assertions.push(message);
}
function colors(bytes: ArrayLike<number>) {
  let red = 0,
    green = 0,
    blue = 0;
  for (let i = 0; i < bytes.length; i += 4) {
    if (
      bytes[i]! > 70 &&
      bytes[i]! > bytes[i + 1]! * 2 &&
      bytes[i]! > bytes[i + 2]! * 2
    )
      red++;
    if (
      bytes[i + 1]! > 70 &&
      bytes[i + 1]! > bytes[i]! * 2 &&
      bytes[i + 1]! > bytes[i + 2]! * 2
    )
      green++;
    if (
      bytes[i + 2]! > 70 &&
      bytes[i + 2]! > bytes[i]! * 2 &&
      bytes[i + 2]! > bytes[i + 1]! * 2
    )
      blue++;
  }
  return { red, green, blue };
}
async function run(): Promise<typeof report> {
  output.dataset.state = 'running';
  let renderer: Renderer | undefined,
    texture: Texture | undefined,
    material: NativePBRMaterial | undefined;
  const scene = new Scene(),
    surface = new Scene();
  let reflection: PlanarReflection | undefined;
  try {
    renderer = await createRenderer(
      canvas,
      preference,
      (error) => {
        report.error = errorDetail(error);
      },
      { recover: false },
    );
    check(
      !!renderer.capturePlanarReflection,
      'Native backend exposes actual planar capture.',
    );
    const image = document.createElement('canvas');
    image.width = image.height = 2;
    const context = image.getContext('2d')!;
    context.fillStyle = 'white';
    context.fillRect(0, 0, 2, 2);
    texture = await Texture.fromImage(image);
    scene.ambientLight = surface.ambientLight = 1;
    scene.camera3D.position.set(0, 3, 6);
    scene.camera3D.lookAt(new Vector3());
    surface.camera3D.position.set(0, 3, 6);
    surface.camera3D.lookAt(new Vector3());
    const above = new Mesh({
      geometry: Geometry.cube(0.9),
      material: new TextureMaterial({ texture, color: [1, 0, 0] }),
    });
    above.position.set(0, 1.2, 0);
    const below = new Mesh({
      geometry: Geometry.cube(0.9),
      material: new TextureMaterial({ texture, color: [0, 1, 0] }),
    });
    below.position.set(0, -1.2, 0);
    const excluded = new Mesh({
      geometry: Geometry.cube(0.9),
      material: new TextureMaterial({ texture, color: [0, 0, 1] }),
    });
    excluded.position.set(-1.4, 1.2, 0);
    scene.add(above);
    scene.add(below);
    scene.add(excluded);
    reflection = new PlanarReflection({ size: 128, exclude: [excluded] });
    const original = scene.camera3D;
    await renderer.capturePlanarReflection!(scene, reflection);
    check(
      scene.camera3D === original && excluded.visible,
      'Camera and borrowed excluded visibility restored after native capture.',
    );
    const captured = reflection.texture!;
    const pixels = (
      captured.image.getContext('2d') as
        CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
    ).getImageData(0, 0, 128, 128).data;
    const counts = colors(pixels);
    report.capturePixels = counts;
    const preview = document.createElement('canvas');
    preview.width = preview.height = 128;
    preview.setAttribute('aria-label', 'Captured mirrored scene');
    preview.getContext('2d')!.drawImage(captured.image, 0, 0);
    canvas.after(preview);
    check(
      counts.red > 40,
      'Actual mirrored target contains above-plane red geometry.',
    );
    check(
      counts.green === 0,
      'Actual oblique clipping removes all below-plane green geometry.',
    );
    check(counts.blue === 0, 'Excluded blue reflector is absent from capture.');
    const version = captured.version;
    await renderer.capturePlanarReflection!(scene, reflection);
    check(
      captured.version === version,
      'Update interval skips redundant native capture.',
    );
    material = reflection.createPBRMaterial({
      texture,
      color: [0, 0, 0],
      metallic: 0,
      roughness: 1,
    });
    check(
      !!renderer.prepareNativePBRMaterial,
      'Native backend prepares physical reflection hooks.',
    );
    await renderer.prepareNativePBRMaterial!(material);
    const floor = new Mesh({ geometry: Geometry.cube(6), material });
    floor.scale.set(1, 0.005, 1);
    surface.add(floor);
    const pending = frameProofs(renderer, canvas).next();
    renderer.beginFrame();
    renderer.render(surface, 128, 128);
    renderer.endFrame();
    const proof = await pending;
    check(
      colors(proof.bytes).red > 10,
      'Real projective native PBR hook displays captured red reflection radiance on the plane.',
    );
    check(
      !report.error,
      'Both capture and native surface submission report no renderer errors.',
    );
  } catch (error) {
    report.error = errorDetail(error);
  } finally {
    scene.destroy();
    surface.destroy();
    material?.destroy();
    reflection?.destroy();
    texture?.destroy();
    renderer?.destroy();
    output.textContent = JSON.stringify(report, null, 2);
    output.dataset.state = report.error ? 'failed' : 'passed';
  }
  return report;
}
declare global {
  interface Window {
    __xyzPlanarReflection: {
      run(): Promise<typeof report>;
      report: typeof report;
    };
  }
}
window.__xyzPlanarReflection = { run, report };
void run();

import {
  createRenderer,
  Scene,
  Geometry,
  Mesh,
  setMeshMaterial,
  PBRMaterial,
  Texture,
  Vector3,
  ColorLUT3D,
  ColorGradingSettings,
  PostEffectsSettings,
  setPostEffects,
  VolumetricFogSettings,
  LensFlareSettings,
  MotionBlurSettings,
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
function changed(a: FrameProof, b: FrameProof, threshold = 3): number {
  let count = 0;
  for (let i = 0; i < a.bytes.length; i += 4)
    if (
      Math.max(
        Math.abs(a.bytes[i]! - b.bytes[i]!),
        Math.abs(a.bytes[i + 1]! - b.bytes[i + 1]!),
        Math.abs(a.bytes[i + 2]! - b.bytes[i + 2]!),
      ) > threshold
    )
      count++;
  return count;
}
async function run(): Promise<void> {
  if (preference === 'canvas2d') {
    const renderer = await createRenderer(canvas, preference, (error) => {
      throw error;
    });
    renderer.resize(128, 128);
    const scene = new Scene();
    scene.postProcessing.enabled = true;
    setPostEffects(
      scene.postProcessing,
      new PostEffectsSettings({ lensFlare: new LensFlareSettings() }),
    );
    let rejected = false;
    try {
      renderer.beginFrame();
      renderer.render(scene, 128, 128);
    } catch (error) {
      rejected = String(error).includes('postprocessing');
    } finally {
      renderer.destroy();
      scene.destroy();
    }
    if (!rejected)
      throw new Error('Canvas2D silently accepted native 3D postprocessing.');
    report.scenarios.push({
      name: 'canvas2d-native-post-rejection',
      changedPixels: 0,
      png: '',
    });
    return;
  }
  for (const antialias of [false, true]) {
    const renderer = await createRenderer(
      canvas,
      preference,
      (error) => {
        throw error;
      },
      { antialias },
    );
    if (renderer.backend !== preference)
      throw new Error('Forced backend changed.');
    renderer.resize(128, 128);
    const scene = new Scene();
    scene.postProcessing.enabled = true;
    scene.postProcessing.toneMapping = 'aces';
    scene.camera3D.position.set(0, 0, 4);
    scene.camera3D.lookAt(new Vector3());
    scene.ambientLight = 1;
    scene.directionalLight.intensity = 0;
    const image = document.createElement('canvas');
    image.width = image.height = 32;
    const ctx = image.getContext('2d')!;
    ctx.fillStyle = '#907052';
    ctx.fillRect(0, 0, 32, 32);
    const texture = await Texture.fromImage(image);
    const geometry = new Geometry({
      positions: [-2, -2, 0, 2, -2, 0, 2, 2, 0, -2, 2, 0],
      normals: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      uvs: [0, 0, 1, 0, 1, 1, 0, 1],
      indices: [0, 1, 2, 0, 2, 3],
    });
    const mesh = new Mesh({
      geometry,
      material: new PBRMaterial({ texture, metallic: 0, roughness: 1 }),
    });
    scene.add(mesh);
    const bright = new Mesh({
      geometry: Geometry.sphere(0.2, 12, 8),
      material: new PBRMaterial({ texture, emissive: [8, 5, 2] }),
      position: [-0.7, 0.4, 0.2],
    });
    scene.add(bright);
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
    const record = (
      name: string,
      plain: FrameProof,
      effected: FrameProof,
      minimum: number,
    ) => {
      const count = changed(plain, effected);
      if (count < minimum)
        throw new Error(
          `${name}: only ${count} visibly changed pixels (need ${minimum}).`,
        );
      report.scenarios.push({
        name: `${name}-${antialias ? 'msaa' : 'single'}`,
        changedPixels: count,
        png: effected.png,
      });
    };
    try {
      const plain = await draw();
      setPostEffects(
        scene.postProcessing,
        new PostEffectsSettings({
          colorGrading: new ColorGradingSettings(ColorLUT3D.preset(16)),
        }),
      );
      const identity = await draw();
      if (changed(plain, identity, 2) > 20)
        throw new Error(
          'Identity LUT altered displayed colors beyond RGBA8 quantization.',
        );
      setPostEffects(
        scene.postProcessing,
        new PostEffectsSettings({
          colorGrading: new ColorGradingSettings(ColorLUT3D.preset(32, 'cool')),
        }),
      );
      record('lut-cool', plain, await draw(), 100);
      for (const toneMapper of ['agx', 'reinhard', 'neutral'] as const) {
        setPostEffects(
          scene.postProcessing,
          new PostEffectsSettings({ toneMapper }),
        );
        record(`tone-${toneMapper}`, plain, await draw(), 100);
      }
      setPostEffects(
        scene.postProcessing,
        new PostEffectsSettings({
          volumetricFog: new VolumetricFogSettings({
            density: 0.35,
            color: [0.05, 0.2, 0.8],
            shaftStrength: 0,
          }),
        }),
      );
      record('height-fog', plain, await draw(), 100);
      mesh.position.x = 5;
      scene.directionalLight.intensity = 1;
      scene.directionalLight.direction.set(0, 0, 1);
      const fog = new VolumetricFogSettings({ density: 0, shaftStrength: 1 });
      setPostEffects(
        scene.postProcessing,
        new PostEffectsSettings({ volumetricFog: fog }),
      );
      const behind = await draw();
      scene.directionalLight.direction.set(0, 0, -1);
      record('directional-depth-shafts', behind, await draw(), 100);
      mesh.position.x = 0;
      scene.directionalLight.intensity = 0;
      setPostEffects(
        scene.postProcessing,
        new PostEffectsSettings({
          lensFlare: new LensFlareSettings({
            strength: 1,
            threshold: 0.5,
            spacing: 1,
          }),
        }),
      );
      record('lens-ghost-halo', plain, await draw(), 30);
      // A real textured plane provides spatial detail for camera-reprojected blur.
      scene.remove(bright);
      ctx.fillStyle = '#101010';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#f0f0f0';
      for (let x = 0; x < 32; x += 4) ctx.fillRect(x, 0, 2, 32);
      const stripes = await Texture.fromImage(image);
      setMeshMaterial(
        mesh,
        new PBRMaterial({
          texture: stripes,
          metallic: 0,
          roughness: 1,
        }),
      );
      const blur = new MotionBlurSettings({
        strength: 0,
        samples: 24,
        maxRadius: 32,
      });
      setPostEffects(
        scene.postProcessing,
        new PostEffectsSettings({ motionBlur: blur }),
      );
      scene.camera3D.position.x = 0;
      await draw();
      scene.camera3D.position.x = 0.2;
      const sharp = await draw();
      scene.camera3D.position.x = 0;
      await draw();
      blur.strength = 1;
      scene.camera3D.position.x = 0.2;
      record('camera-motion-blur', sharp, await draw(), 100);
      const still = await draw();
      if (changed(sharp, still, 1) > 20)
        throw new Error('Static camera retained stale blur velocity.');
      scene.camera3D.position.x = 10;
      const cut = await draw();
      blur.strength = 0;
      const cutSharp = await draw();
      if (changed(cut, cutSharp, 1) > 20)
        throw new Error('Camera cut failed to invalidate blur history.');
      stripes.destroy();
      if (proofs.graphicsEvents.length)
        throw new Error(proofs.graphicsEvents.join('\n'));
    } finally {
      renderer.destroy();
      scene.destroy();
      texture.destroy();
    }
  }
}
void run()
  .then(() => {
    output.textContent = JSON.stringify(report);
    output.dataset.state = 'passed';
  })
  .catch((error) => {
    report.error = errorDetail(error);
    output.textContent = JSON.stringify(report);
    output.dataset.state = 'failed';
  });

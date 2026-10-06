import {
  AnimatedImageTexture,
  BakedIrradianceVolume,
  bindIrradianceVolume,
  ColorGradingSettings,
  ColorLUT3D,
  EnvironmentMap,
  Geometry,
  MaterialAsset,
  Mesh,
  NativePBRMaterial,
  Object3D,
  OrthographicCamera,
  PBRMaterial,
  PlanarReflection,
  PostEffectsSettings,
  ProceduralMaterial,
  Scene,
  setMeshMaterial,
  setPostEffects,
  Sprite,
  SpriteSheet,
  Terrain3D,
  TerrainSplatMaterial,
  Texture,
  Vector3,
  VolumetricFogSettings,
  Water3D,
  type Renderer,
} from '../../src/index.js';
import { animatedGIF } from '../animated-image-fixtures.js';

export interface LifecycleResources {
  scene: Scene;
  resourceKinds: readonly string[];
  prepare(): Promise<void>;
  advance(): void;
  destroy(): void;
}

function solid(r: number, g: number, b: number): ImageData {
  const image = new ImageData(2, 2);
  for (let i = 0; i < image.data.length; i += 4)
    image.data.set([r, g, b, 255], i);
  return image;
}

/** Encoded, local PNG bytes: fromImages must perform a real browser decode. */
async function png(image: ImageData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  try {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Lifecycle PNG encoding needs a 2D context.');
    context.putImageData(image, 0, 0);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Lifecycle PNG encoding failed.'));
      }, 'image/png');
    });
  } finally {
    canvas.width = canvas.height = 0;
  }
}

/** Every source is consumed by a visible mesh or sprite, never merely prepared. */
export async function createMaterialLifecycleResources(
  renderer: Renderer,
  canvas: HTMLCanvasElement,
  cycle: number,
): Promise<LifecycleResources> {
  if (
    !renderer.capabilities.threeD ||
    !renderer.capturePlanarReflection ||
    !renderer.prepareNativePBRMaterial
  )
    throw new Error('Material lifecycle requires a native 3D renderer.');
  const scene = new Scene();
  const captureScene = new Scene();
  const geometries = new Set<Geometry>();
  const sources: { destroy(): void }[] = [];
  const nativeMaterials: NativePBRMaterial[] = [];
  const boundMeshes: Mesh[] = [];
  let destroyed = false;
  let reflectionMaterial: NativePBRMaterial | undefined;
  let water: Water3D | undefined;
  let animated: AnimatedImageTexture | undefined;
  let atlasSprite: Sprite | undefined;
  let sheet: SpriteSheet | undefined;
  let frame = 0;
  const collectGeometries = (object: Object3D): void => {
    if (object instanceof Mesh) geometries.add(object.geometry);
    for (const child of object.children) collectGeometries(child);
  };
  const destroy = (): void => {
    if (destroyed) return;
    destroyed = true;
    const errors: unknown[] = [];
    const release = (operation: () => void): void => {
      try {
        operation();
      } catch (error) {
        errors.push(error);
      }
    };
    release(() => setPostEffects(scene.postProcessing));
    for (const mesh of boundMeshes)
      release(() => bindIrradianceVolume(mesh, undefined));
    release(() => scene.destroy());
    release(() => captureScene.destroy());
    // Geometry has no destroy API, and Mesh/Scene borrow it. Release only this
    // builder's actual geometry allocations, after every consumer is gone.
    for (const geometry of geometries)
      release(() => renderer.unloadGeometry(geometry));
    for (const material of nativeMaterials) release(() => material.destroy());
    for (let i = sources.length - 1; i >= 0; i--)
      release(() => sources[i]!.destroy());
    if (errors.length)
      throw new AggregateError(
        errors,
        'Material lifecycle resource cleanup failed.',
      );
  };
  try {
    const camera = new OrthographicCamera();
    camera.height = 6.4;
    camera.position.set(0, 5, 9);
    camera.lookAt(new Vector3(0, 0.1, 0));
    scene.camera3D = camera;
    scene.ambientLight = 0.15;
    scene.directionalLight.direction.set(-0.4, 0.7, 1).normalize();
    scene.directionalLight.intensity = 1.1;
    const environment = EnvironmentMap.gradient({
      width: 16,
      zenith: [0.2, 0.4, 0.8],
      horizon: [0.8, 0.65, 0.4],
      ground: [0.06, 0.08, 0.12],
    });
    sources.push(environment);
    scene.environment = environment;
    const white = await Texture.fromImage(solid(255, 255, 255));
    sources.push(white);
    const base = solid(220, 85, 35);
    base.data.set([35, 170, 240, 255], 4);
    base.data.set([35, 170, 240, 255], 8);
    const asset = await MaterialAsset.fromImages(
      {
        base: await png(base),
        normal: await png(solid(128, 128, 255)),
        metallicRoughness: await png(solid(255, 145, 40)),
        occlusion: await png(solid(230, 230, 230)),
      },
      { metallic: 0.3, roughness: 0.7 },
    );
    sources.push(asset);
    const sphere = Geometry.sphere(0.62, 20, 12);
    geometries.add(sphere);
    const addSphere = (x: number, material: PBRMaterial): Mesh =>
      scene.add(
        new Mesh({ geometry: sphere, material, position: [x, 1.2, 0] }),
      );
    addSphere(-2.4, asset.material);
    const preset = await ProceduralMaterial.create('metal', {
      size: 32,
      seed: 0x13600000 + cycle,
    });
    sources.push(preset);
    addSphere(
      -0.8,
      preset.createMaterial({
        roughness: 0.3,
        finish: { anisotropy: 0.8, anisotropyRotation: 0.6 },
      }),
    );
    addSphere(
      0.8,
      preset.createMaterial({
        metallic: 0.25,
        roughness: 0.2,
        finish: { iridescence: 1, iridescenceThickness: 0.6 },
      }),
    );
    addSphere(
      2.4,
      new PBRMaterial({
        texture: white,
        color: [0.75, 0.95, 1],
        roughness: 0.12,
        transmission: 0.85,
        thickness: 0.6,
        ior: 1.45,
        attenuationColor: [0.6, 0.85, 1],
        attenuationDistance: 1.5,
        finish: { dispersion: 0.4 },
      }),
    );
    const backdrop = Geometry.quad(6.5, 2);
    geometries.add(backdrop);
    scene.add(
      new Mesh({
        geometry: backdrop,
        material: new PBRMaterial({
          texture: asset.material.texture,
          roughness: 1,
        }),
        position: [0, 1.2, -1],
      }),
    );

    const coefficients = new Float32Array(8 * 27);
    for (let i = 0; i < 8; i++) {
      coefficients[i * 27] = i % 2 ? 0.4 : 2.5;
      coefficients[i * 27 + 1] = 0.5;
      coefficients[i * 27 + 2] = i % 2 ? 2.5 : 0.4;
    }
    const volume = new BakedIrradianceVolume(
      {
        min: [-4, -2, -4],
        max: [4, 3, 4],
        resolution: [2, 2, 2],
      },
      coefficients,
    );
    sources.push(volume);
    const bakedMesh = scene.add(
      new Mesh({
        geometry: sphere,
        material: new PBRMaterial({ texture: white, roughness: 1 }),
        position: [0, -0.1, 1.3],
        scale: [0.65, 0.65, 0.65],
      }),
    );
    bindIrradianceVolume(bakedMesh, volume);
    boundMeshes.push(bakedMesh);

    const weights = solid(255, 0, 0);
    weights.data.set([0, 255, 0, 255], 4);
    weights.data.set([0, 255, 0, 255], 12);
    const splat = await TerrainSplatMaterial.create({
      layers: [
        { baseColor: solid(65, 155, 45), roughness: 0.9 },
        { baseColor: solid(175, 115, 55), roughness: 0.7 },
      ],
      weights,
      size: 16,
    });
    sources.push(splat);
    nativeMaterials.push(splat.material);
    const terrain = new Terrain3D({
      heightmap: {
        width: 3,
        height: 3,
        heights: [0, 0.1, 0, 0.15, 0.4, 0.2, 0, 0.1, 0],
      },
      material: splat.material,
      width: 2.2,
      depth: 2,
      chunkSize: 2,
      lodDistances: [0],
      skirtDepth: 0.1,
    });
    terrain.position.set(-2.1, -0.8, 1.6);
    collectGeometries(terrain);
    scene.add(terrain);
    water = new Water3D({
      texture: white,
      width: 2.2,
      depth: 2,
      segments: 16,
      waves: [
        { direction: [1, 0.3], amplitude: 0.2, wavelength: 1.2, speed: 3 },
      ],
      normalWaves: [],
      foam: { threshold: 0, fade: 0.2, strength: 0.7 },
      materialOptions: {
        color: [0.05, 0.3, 0.8],
        roughness: 0.25,
        transmission: 0.3,
        thickness: 0.2,
      },
      position: [2.1, -0.6, 1.6],
    });
    geometries.add(water.geometry);
    nativeMaterials.push(water.material);
    scene.add(water);

    captureScene.ambientLight = 1;
    captureScene.directionalLight.intensity = 0;
    captureScene.camera3D.position.set(0, 3, 6);
    captureScene.camera3D.lookAt(new Vector3());
    const reflectedGeometry = Geometry.cube(1.2);
    geometries.add(reflectedGeometry);
    captureScene.add(
      new Mesh({
        geometry: reflectedGeometry,
        material: new PBRMaterial({
          texture: white,
          color: [1, 0.05, 0.02],
          roughness: 1,
        }),
        position: [0, 1, 0],
      }),
    );
    const reflection = new PlanarReflection({ size: 64 });
    sources.push(reflection);
    const floorGeometry = Geometry.plane(5.8, 2.2);
    geometries.add(floorGeometry);
    const floor = scene.add(
      new Mesh({
        geometry: floorGeometry,
        material: new PBRMaterial({ texture: white, color: [0.1, 0.1, 0.1] }),
        position: [0, -0.9, -1.6],
      }),
    );

    animated = await AnimatedImageTexture.decode(animatedGIF(), 'image/gif');
    sources.push(animated);
    const atlas = animated.createAtlas();
    sources.push(atlas);
    sheet = new SpriteSheet(atlas.texture, atlas.frames);
    const scale = Math.max(12, Math.min(canvas.width, canvas.height) / 12);
    scene.add(
      new Sprite({
        texture: animated,
        anchor: [0, 0],
        position: [8, 8],
        scale: [scale, scale],
        space: 'screen',
      }),
    );
    atlasSprite = scene.add(
      new Sprite({
        texture: atlas.texture,
        source: sheet.getFrame(0),
        anchor: [0, 0],
        position: [8, 12 + scale],
        scale: [scale, scale],
        space: 'screen',
      }),
    );

    scene.postProcessing.enabled = true;
    scene.postProcessing.fxaa = true;
    scene.postProcessing.depthOfField = true;
    scene.postProcessing.dofFocusDistance = 9;
    scene.postProcessing.dofFocusRange = 3;
    scene.postProcessing.dofBlurRadius = 2;
    setPostEffects(
      scene.postProcessing,
      new PostEffectsSettings({
        colorGrading: new ColorGradingSettings(ColorLUT3D.preset(16, 'cool')),
        volumetricFog: new VolumetricFogSettings({
          density: 0.025,
          color: [0.12, 0.2, 0.4],
          shaftStrength: 0,
        }),
      }),
    );
    return {
      scene,
      resourceKinds: Object.freeze([
        'MaterialAsset',
        'finishes',
        'planar reflection',
        'baked volume',
        'terrain',
        'water',
        'animated image',
        'post effects',
      ]),
      async prepare(): Promise<void> {
        if (destroyed) throw new Error('Lifecycle resources are destroyed.');
        scene.updateCameraDependents(canvas.height);
        await renderer.capturePlanarReflection!(captureScene, reflection);
        if (!reflection.texture)
          throw new Error('Planar capture produced no texture.');
        if (!reflectionMaterial) {
          reflectionMaterial = reflection.createPBRMaterial({
            texture: white,
            color: [0.02, 0.02, 0.02],
            roughness: 0.5,
          });
          nativeMaterials.push(reflectionMaterial);
          setMeshMaterial(floor, reflectionMaterial);
        }
        for (const material of nativeMaterials)
          await renderer.prepareNativePBRMaterial!(material);
      },
      advance(): void {
        if (destroyed) throw new Error('Lifecycle resources are destroyed.');
        water!.update(0.35);
        animated!.updateAnimation(0.100001);
        frame = (frame + 1) % 3;
        atlasSprite!.source = sheet!.getFrame(frame);
        bakedMesh.position.x = frame === 0 ? -0.35 : 0.35;
      },
      destroy,
    };
  } catch (error) {
    try {
      destroy();
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        'Lifecycle creation and cleanup failed.',
        { cause: cleanupError },
      );
    }
    throw error;
  }
}

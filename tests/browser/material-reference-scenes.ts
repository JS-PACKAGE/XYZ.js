import {
  EnvironmentMap,
  exportGLB,
  Geometry,
  GLTFLoader,
  Mesh,
  Object3D,
  OrthographicCamera,
  PBRMaterial,
  PointLight,
  ProceduralMaterial,
  Scene,
  Texture,
  Vector3,
  type GLTFAsset,
  type PBRMaterialOptions,
  type ProceduralMaterialKind,
} from '../../src/index.js';

export interface MaterialReferenceScene {
  name: string;
  scene: Scene;
  meshes: Mesh[];
}

export interface MaterialReferenceScenes {
  scenarios: MaterialReferenceScene[];
  destroy(): void;
}

/** All resources are fixture-owned; scenes and materials only borrow their maps. */
export async function createMaterialReferenceScenes(
  perturb = false,
): Promise<MaterialReferenceScenes> {
  const scenarios: MaterialReferenceScene[] = [];
  const textures: Texture[] = [];
  const presets: ProceduralMaterial[] = [];
  const assets: GLTFAsset[] = [];
  const environment = EnvironmentMap.gradient({
    width: 32,
    zenith: [0.24, 0.42, 0.75],
    horizon: [0.65, 0.52, 0.34],
    ground: [0.08, 0.1, 0.15],
  });
  let destroyed = false;
  const destroy = (): void => {
    if (destroyed) return;
    destroyed = true;
    // Remove consumers before releasing either imported or generated textures.
    try {
      for (const { scene } of scenarios) scene.destroy();
    } finally {
      try {
        for (const asset of assets) asset.dispose();
      } finally {
        for (const preset of presets) preset.destroy();
        for (const texture of textures) texture.destroy();
        environment.destroy();
      }
    }
  };
  try {
    const image = new ImageData(1, 1);
    image.data.set([255, 255, 255, 255]);
    const white = await Texture.fromImage(image);
    textures.push(white);
    const sphere = Geometry.sphere(0.41, 24, 16);
    const makeScene = (name: string): MaterialReferenceScene => {
      const scene = new Scene();
      const camera = new OrthographicCamera();
      camera.height = 4.9;
      camera.position.set(0, 0, 8);
      camera.lookAt(new Vector3(0, 0, 0));
      scene.camera3D = camera;
      scene.environment = environment;
      scene.ambientLight = 0.12;
      scene.directionalLight.direction.set(-0.4, 0.7, 1).normalize();
      scene.directionalLight.intensity = 0.85;
      scene.pointLights.push(
        new PointLight({
          position: [2.5, 1.5, 3],
          color: [0.4, 0.65, 1],
          intensity: 6,
          range: 12,
        }),
      );
      const reference = { name, scene, meshes: [] as Mesh[] };
      scenarios.push(reference);
      return reference;
    };
    const add = (
      reference: MaterialReferenceScene,
      index: number,
      columns: number,
      rows: number,
      options: Partial<PBRMaterialOptions> | PBRMaterial,
    ): void => {
      const mesh = reference.scene.add(
        new Mesh({
          geometry: sphere,
          material:
            options instanceof PBRMaterial
              ? options
              : new PBRMaterial({
                  texture: white,
                  color: [0.72, 0.38, 0.16],
                  roughness: 0.3,
                  metallic: 0,
                  alphaMode: 'OPAQUE',
                  ...options,
                }),
          position: [
            ((index % columns) - (columns - 1) / 2) * 1.08,
            ((rows - 1) / 2 - Math.floor(index / columns)) * 1.08,
            0,
          ],
        }),
      );
      reference.meshes.push(mesh);
    };

    const grid = makeScene('roughness-metallic-grid');
    for (let row = 0; row < 4; row++)
      for (let column = 0; column < 4; column++) {
        const changed = perturb && row === 0 && column === 0;
        add(grid, row * 4 + column, 4, 4, {
          color: changed ? [0.04, 0.85, 0.12] : [0.72, 0.38, 0.16],
          roughness: changed ? 0.92 : [0.05, 0.25, 0.55, 0.9][column],
          metallic: row / 3,
        });
      }

    const finishes = makeScene('finish-grid');
    const finishOptions: Partial<PBRMaterialOptions>[] = [
      { metallic: 0.8, finish: { anisotropy: 0.8 } },
      {
        metallic: 0.8,
        finish: { anisotropy: 0.8, anisotropyRotation: Math.PI / 2 },
      },
      { finish: { iridescence: 1, iridescenceThickness: 0.2 } },
      { finish: { iridescence: 1, iridescenceThickness: 0.7 } },
      {
        finish: {
          subsurface: 0.85,
          subsurfaceColor: [1, 0.25, 0.12],
          subsurfaceRadius: 0.2,
        },
      },
      {
        finish: {
          subsurface: 0.85,
          subsurfaceColor: [0.25, 0.7, 1],
          subsurfaceRadius: 0.8,
        },
      },
      { transmission: 0.85, thickness: 0.5, finish: { dispersion: 0.2 } },
      { transmission: 0.85, thickness: 0.5, finish: { dispersion: 1.5 } },
      { finish: { wetness: 0.85 } },
      { finish: { snow: 0.8 } },
      { finish: { dirt: 0.8 } },
      { finish: { damage: 0.8 } },
    ];
    finishOptions.forEach((options, index) =>
      add(finishes, index, 4, 3, options),
    );

    const imported = makeScene('gltf-sample-like');
    const authored = makeScene('authored-local-glb');
    authored.scene.environment = undefined;
    authored.scene.pointLights.length = 0;
    // Sample-model-like factors, authored locally rather than fetched from a CDN.
    const samples: Partial<PBRMaterialOptions>[] = [
      {
        color: [0.65, 0.025, 0.04],
        metallic: 0.35,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
      },
      {
        color: [0.18, 0.32, 0.65],
        roughness: 0.8,
        sheenColor: [0.65, 0.75, 1],
        sheenRoughness: 0.4,
      },
      { color: [0.95, 0.72, 0.4], metallic: 1, roughness: 0.18 },
      {
        color: [0.8, 0.95, 1],
        roughness: 0.08,
        transmission: 0.9,
        ior: 1.45,
        thickness: 0.65,
        attenuationColor: [0.6, 0.85, 1],
        attenuationDistance: 1.5,
      },
      {
        color: [0.35, 0.1, 0.6],
        roughness: 0.25,
        specular: 0.6,
        specularColor: [0.8, 0.6, 1],
      },
      {
        color: [0.03, 0.18, 0.12],
        roughness: 0.55,
        clearcoat: 0.8,
        emissive: [0.03, 0.15, 0.06],
      },
    ];
    samples.forEach((options, index) => add(authored, index, 3, 2, options));
    let blobURL: string | undefined;
    try {
      blobURL = URL.createObjectURL(
        new Blob([await exportGLB(authored.scene)], {
          type: 'model/gltf-binary',
        }),
      );
      const asset = await new GLTFLoader().load(blobURL);
      assets.push(asset);
      imported.scene.add(asset.scene);
      const collect = (object: Object3D): void => {
        if (object instanceof Mesh) imported.meshes.push(object);
        for (const child of object.children) collect(child);
      };
      collect(asset.scene);
    } finally {
      if (blobURL !== undefined) URL.revokeObjectURL(blobURL);
      authored.scene.destroy();
    }
    scenarios.pop();

    const procedural = makeScene('procedural-preset-grid');
    const kinds: ProceduralMaterialKind[] = [
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
    ];
    for (const [index, kind] of kinds.entries()) {
      const preset = await ProceduralMaterial.create(kind, {
        size: 32,
        seed: 0x13500000 + index,
        repeats: 2,
      });
      presets.push(preset);
      add(procedural, index, 4, 3, preset.material);
    }
    return { scenarios, destroy };
  } catch (error) {
    destroy();
    throw error;
  }
}

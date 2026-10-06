import {
  Texture,
  Geometry,
  exportGLB,
  exportGLTF,
  GLTFLoader,
  Mesh,
  PBRMaterial,
} from '../../src/index.js';

/** Real browser canvas encoding, embedded PNG bytes and loader decode; no image mocks. */
export async function runGLTFExporterSmoke(): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 2;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Missing 2D context.');
  context.fillStyle = '#f02040';
  context.fillRect(0, 0, 2, 2);
  const texture = await Texture.fromImage(canvas);
  const mesh = new Mesh({
    geometry: Geometry.cube(),
    material: new PBRMaterial({ texture, metallic: 0.3, roughness: 0.7 }),
  });
  try {
    const result = await exportGLTF(mesh);
    const image = result.json.images[0];
    const view = result.json.bufferViews[image.bufferView as number];
    const signature = new Uint8Array(
      result.buffers[0],
      view.byteOffset as number,
      8,
    );
    if (signature.join(',') !== '137,80,78,71,13,10,26,10')
      throw new Error('Embedded image is not PNG.');
    const asset = await new GLTFLoader().parse(await exportGLB(mesh));
    try {
      const node = [...asset.scene.children][0];
      const restored = [...node.children][0] as Mesh;
      if (!(restored instanceof Mesh))
        throw new Error('Round-trip mesh missing.');
      context.clearRect(0, 0, 2, 2);
      context.drawImage(restored.material.texture.image, 0, 0);
      const pixel = context.getImageData(0, 0, 1, 1).data;
      if (
        pixel[0] !== 240 ||
        pixel[1] !== 32 ||
        pixel[2] !== 64 ||
        pixel[3] !== 255
      )
        throw new Error('Round-trip texture pixels changed.');
      if (restored.geometry.indices.length !== mesh.geometry.indices.length)
        throw new Error('Round-trip geometry changed.');
    } finally {
      asset.dispose();
    }
  } finally {
    texture.destroy();
    mesh.destroy();
  }
}

if (
  typeof document !== 'undefined' &&
  document.querySelector('[data-gltf-exporter-test]')
) {
  const status = document.querySelector('[data-gltf-exporter-test]')!;
  runGLTFExporterSmoke()
    .then(() => {
      status.textContent = 'passed';
      status.setAttribute('data-result', 'passed');
    })
    .catch((error: unknown) => {
      status.textContent = String(error);
      status.setAttribute('data-result', 'failed');
    });
}

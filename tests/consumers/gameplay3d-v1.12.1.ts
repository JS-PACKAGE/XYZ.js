import {
  Geometry,
  Mesh,
  PerspectiveCamera,
  Scene,
  TextureMaterial,
  Vector3,
  type Texture,
  type MeshOptions,
} from '../../src/index.js';

export function createMesh(texture: Texture, scene: Scene): Mesh {
  const geometry: Geometry = Geometry.cube(2);
  const options: MeshOptions = {
    geometry,
    material: new TextureMaterial({
      texture,
      color: [1, 0.5, 0.25],
      transparent: true,
    }),
    position: [0, 1, -3],
    rotation: [0, 0.5, 0],
    castShadow: true,
    receiveShadow: true,
  };
  const mesh: Mesh = scene.add(new Mesh(options));
  const camera: PerspectiveCamera = new PerspectiveCamera();
  camera.position.set(0, 3, 6);
  camera.lookAt(new Vector3(0, 1, -3));
  scene.camera3D = camera;
  const sphere: Readonly<{ x: number; y: number; z: number; radius: number }> =
    mesh.boundingSphere;
  mesh.distanceSquaredTo(sphere.x, sphere.y, sphere.z);
  mesh.getWorldBoundingSphere({ x: 0, y: 0, z: 0, radius: 0 });
  geometry.markUpdated();
  return mesh;
}

// Protected declarations are part of the existing subclass contract too.
export class ConsumerMesh extends Mesh {
  protected override get cullable(): boolean {
    return super.cullable;
  }
}

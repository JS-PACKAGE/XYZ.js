import { Object3D } from '../object3d.js';
import { Line3D } from '../objects3d.js';
import type { TextureMaterial } from '../mesh.js';
import type { PhysicsWorld3D } from './world.js';
import type { PhysicsDebugSnapshot3D } from './debug-geometry.js';
import { physicsProfiles } from '../../../../src/data/physics-profiles.js';
export interface PhysicsDebugDrawOptions3D {
  colliderMaterial: TextureMaterial;
  contactMaterial?: TextureMaterial;
  jointMaterial?: TextureMaterial;
  width?: number;
}
/** Scene-addable native triangle ribbons. Shared materials/textures remain caller-owned.
 * Call refresh after physics. World-space snapshots require this debug root's identity transform. */
export class PhysicsDebugDraw3D extends Object3D {
  private readonly lines: Line3D[] = [];
  private readonly kinds: string[] = [];
  constructor(
    readonly world: PhysicsWorld3D,
    private readonly options: PhysicsDebugDrawOptions3D,
  ) {
    super();
  }
  refresh(snapshot: PhysicsDebugSnapshot3D = this.world.debugSnapshot()): void {
    if (this.destroyed) throw new Error('PhysicsDebugDraw3D is destroyed.');
    if (
      this.parent ||
      this.position.length() !== 0 ||
      this.scale.x !== 1 ||
      this.scale.y !== 1 ||
      this.scale.z !== 1 ||
      this.rotation.x !== 0 ||
      this.rotation.y !== 0 ||
      this.rotation.z !== 0 ||
      this.rotation.w !== 1
    )
      throw new Error(
        'PhysicsDebugDraw3D requires an identity root transform.',
      );
    const segments = snapshot.segments;
    if (segments.length > physicsProfiles.debug.maxSegments)
      throw new RangeError('Debug segment bound exceeded.');
    while (this.lines.length > segments.length) {
      const line = this.lines.pop()!;
      this.kinds.pop();
      this.remove(line);
      line.destroy();
    }
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]!;
      let line = this.lines[i];
      if (!line || this.kinds[i] !== segment.kind) {
        if (line) {
          this.remove(line);
          line.destroy();
        }
        const material =
          segment.kind === 'contact'
            ? (this.options.contactMaterial ?? this.options.colliderMaterial)
            : segment.kind === 'joint'
              ? (this.options.jointMaterial ?? this.options.colliderMaterial)
              : this.options.colliderMaterial;
        line = new Line3D([segment.from, segment.to], {
          material,
          width: this.options.width ?? physicsProfiles.debug.width,
          castShadow: false,
          receiveShadow: false,
        });
        this.lines[i] = line;
        this.kinds[i] = segment.kind;
        this.add(line);
      } else {
        line.setPoint(0, ...segment.from);
        line.setPoint(1, ...segment.to);
      }
    }
  }
  override destroy(): void {
    if (this.destroyed) return;
    super.destroy();
    this.lines.length = 0;
    this.kinds.length = 0;
  }
}

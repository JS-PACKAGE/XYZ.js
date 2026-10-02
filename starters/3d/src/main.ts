import {
  Scene,
  Group,
  Mesh,
  Geometry,
  PBRMaterial,
  Vector3,
  BoxCollider3D,
  CapsuleCollider3D,
  RigidBody3D,
  CharacterController3D,
  type Texture,
} from 'xyz.js';
import {
  boot,
  validCheckpoint,
  type Arena,
  type Checkpoint,
  type Controls,
  type Events,
  type Outcome,
} from './flow.js';
const crystals = [
  [-6, -6],
  [6, -6],
  [-6, 0],
  [6, 0],
  [0, -5],
] as const;
const obstacles = [
  [-2, -1, 2, 3],
  [2, 2, 2, 3],
] as const;
const capsuleRadius = 0.3;
const capsuleHeight = 1.2;
class Courier extends Scene implements Arena {
  private readonly player = new Group();
  private readonly character: CharacterController3D;
  private readonly motion = new Vector3();
  private readonly gems: Mesh[] = [];
  private readonly patrols: Mesh[] = [];
  private readonly gate: Mesh;
  private collected = Array<boolean>(5).fill(false);
  private remaining = 90;
  private outcome: Outcome = 'playing';
  private velocity = 0;
  private epoch = 0;
  private hudSecond = -1;
  constructor(
    texture: Texture,
    private readonly controls: Controls,
    private readonly events: Events,
  ) {
    super();
    this.ambientLight = 0.7;
    this.directionalLight.intensity = 1.8;
    this.directionalLight.direction.set(-3, 7, 5).normalize();
    this.camera3D.position.set(0, 18, 17);
    this.camera3D.lookAt(new Vector3(0, 0, 0));
    const box = (
      position: [number, number, number],
      scale: [number, number, number],
      color: [number, number, number],
      solid = false,
    ): Mesh => {
      const mesh = new Mesh({
        geometry: Geometry.cube(1),
        material: new PBRMaterial({
          alphaMode: 'OPAQUE',
          texture,
          color,
          roughness: 0.75,
        }),
        position,
        scale,
      });
      if (solid) {
        mesh.collider = new BoxCollider3D(new Vector3(0.5, 0.5, 0.5));
        mesh.body = new RigidBody3D({ type: 'static' });
      }
      return this.add(mesh);
    };
    box([0, -0.3, 0], [18, 0.6, 18], [0.12, 0.18, 0.25], true);
    box([-8, 0.7, 0], [0.4, 1.4, 16], [0.3, 0.4, 0.55], true);
    box([8, 0.7, 0], [0.4, 1.4, 16], [0.3, 0.4, 0.55], true);
    box([0, 0.7, -8], [16, 1.4, 0.4], [0.3, 0.4, 0.55], true);
    box([0, 0.7, 8], [16, 1.4, 0.4], [0.3, 0.4, 0.55], true);
    for (const [x, z, w, d] of obstacles)
      box([x, 1.25, z], [w, 2.5, d], [0.4, 0.48, 0.62], true);
    this.gate = box([6, 0.12, 6], [1.4, 0.24, 1.4], [0.1, 0.5, 0.25]);
    for (const [x, z] of crystals) {
      const gem = box([x, 0.8, z], [0.55, 0.9, 0.55], [0.2, 0.95, 1]);
      gem.rotation.setFromEuler(0, Math.PI / 4, 0);
      this.gems.push(gem);
    }
    this.patrols.push(
      box([0, 0.55, -3], [0.9, 1.1, 0.9], [1, 0.2, 0.25]),
      box([-5, 0.55, 3], [0.9, 1.1, 0.9], [1, 0.2, 0.25]),
    );
    this.player.position.set(0, 1, 6);
    this.player.collider = new CapsuleCollider3D(capsuleRadius, capsuleHeight);
    this.add(this.player);
    this.character = new CharacterController3D(this.player, this.physics3D, {
      groundSnap: 0.15,
    });
    const body = new Mesh({
      geometry: Geometry.cube(1),
      material: new PBRMaterial({
        alphaMode: 'OPAQUE',
        texture,
        color: [1, 0.84, 0.25],
        roughness: 0.7,
      }),
      scale: [0.5, 1.1, 0.5],
    });
    this.player.add(body);
    this.player.add(
      new Mesh({
        geometry: Geometry.sphere(0.3, 12, 8),
        material: new PBRMaterial({
          alphaMode: 'OPAQUE',
          texture,
          color: [1, 0.95, 0.65],
        }),
        position: [0, 0.6, 0],
      }),
    );
  }
  reset(): void {
    this.restore({
      position: [0, 1, 6],
      collected: Array<boolean>(5).fill(false),
      remaining: 90,
      outcome: 'playing',
    });
  }
  valid(value: unknown): value is Checkpoint {
    if (!validCheckpoint(value, '3d')) return false;
    const [x, y, z] = value.position as [number, number, number];
    return (
      y >= 0.89 &&
      Math.abs(x) <= 7.5 &&
      Math.abs(z) <= 7.5 &&
      !obstacles.some(([wx, wz, w, d]) => {
        const dx = Math.max(Math.abs(x - wx) - w / 2, 0);
        const dz = Math.max(Math.abs(z - wz) - d / 2, 0);
        const dy = Math.max(y - capsuleHeight / 2 - 2.5, 0);
        // A capsule's rounded corners are not the expanded box's square corners.
        return dx * dx + dy * dy + dz * dz < capsuleRadius * capsuleRadius;
      })
    );
  }
  restore(checkpoint: Checkpoint): void {
    if (!this.valid(checkpoint))
      throw new Error(
        'Checkpoint player intersects an obstacle or lies outside the arena.',
      );
    this.character.detachSupport();
    this.velocity = 0;
    this.player.position.set(
      checkpoint.position[0]!,
      checkpoint.position[1]!,
      checkpoint.position[2]!,
    );
    this.collected = [...checkpoint.collected];
    this.remaining = checkpoint.remaining;
    this.outcome = checkpoint.outcome;
    this.gems.forEach((gem, index) => {
      gem.visible = !this.collected[index];
    });
    this.hudSecond = -1;
    this.refresh();
  }
  snapshot(): Checkpoint {
    const p = this.player.position;
    return {
      position: [p.x, p.y, p.z],
      collected: [...this.collected],
      remaining: this.remaining,
      outcome: this.outcome,
    };
  }
  dispose(): void {
    this.character.destroy();
  }
  private refresh(): void {
    const count = this.collected.filter(Boolean).length;
    this.gate.scale.y = count === 5 ? 0.6 : 0.24;
    this.events.hud(count, this.remaining);
  }
  override update(delta: number): void {
    if (this.outcome !== 'playing') return;
    const dt = Math.min(delta, 0.03);
    this.remaining = Math.max(0, this.remaining - dt);
    if (this.controls.jump && this.character.grounded) this.velocity = 6;
    this.controls.jump = false;
    this.velocity -= 16 * dt;
    const x =
      Number(this.controls.held.has('right')) -
      Number(this.controls.held.has('left'));
    const z =
      Number(this.controls.held.has('down')) -
      Number(this.controls.held.has('up'));
    const length = Math.max(1, Math.hypot(x, z));
    const result = this.character.move(
      this.motion.set(
        (x / length) * dt * 4,
        this.velocity * dt,
        (z / length) * dt * 4,
      ),
      { epoch: ++this.epoch, detachSupport: this.velocity > 0 },
    );
    if (result.grounded && this.velocity < 0) this.velocity = 0;
    const elapsed = 90 - this.remaining;
    this.patrols[0]!.position.x = Math.sin(elapsed) * 4;
    this.patrols[1]!.position.z = 3 + Math.sin(elapsed * 1.3) * 2;
    const p = this.player.position;
    for (let i = 0; i < this.gems.length; i++) {
      const gem = this.gems[i]!;
      if (
        !this.collected[i] &&
        p.y < 2.4 &&
        Math.hypot(p.x - gem.position.x, p.z - gem.position.z) < 0.85
      ) {
        this.collected[i] = true;
        gem.visible = false;
        this.refresh();
        this.events.collect();
      }
    }
    if (
      this.remaining === 0 ||
      p.y < -2 ||
      this.patrols.some(
        (patrol) =>
          p.y < 1.8 &&
          Math.hypot(p.x - patrol.position.x, p.z - patrol.position.z) < 0.8,
      )
    )
      this.outcome = 'lost';
    else if (
      this.collected.every(Boolean) &&
      p.y < 2 &&
      Math.hypot(p.x - 6, p.z - 6) < 1
    )
      this.outcome = 'won';
    if (Math.ceil(this.remaining) !== this.hudSecond) {
      this.hudSecond = Math.ceil(this.remaining);
      this.refresh();
    }
    if (this.outcome !== 'playing') this.events.finish(this.outcome);
  }
}
void boot(
  '3d',
  (texture, controls, events) => new Courier(texture, controls, events),
);

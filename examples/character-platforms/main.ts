import {
  Game,
  Scene,
  Group,
  Mesh,
  Geometry,
  PBRMaterial,
  Texture,
  Vector3,
  BoxCollider3D,
  CapsuleCollider3D,
  RigidBody3D,
  CharacterController3D,
  type RendererPreference,
} from '../../src/index.js';
const element = <T extends HTMLElement>(id: string): T =>
  document.querySelector<T>(`#${id}`)!;
const backend = element<HTMLSelectElement>('backend');
const status = element<HTMLParagraphElement>('status');
const stats = element<HTMLPreElement>('stats');
backend.value = new URLSearchParams(location.search).get('renderer') ?? 'auto';
backend.onchange = () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
};
const held = new Set<string>();
const keys: Record<string, string> = {
  ArrowUp: 'up',
  w: 'up',
  ArrowDown: 'down',
  s: 'down',
  ArrowLeft: 'left',
  a: 'left',
  ArrowRight: 'right',
  d: 'right',
};
let jump = false;
const keydown = (event: KeyboardEvent): void => {
  if (
    event.target instanceof HTMLSelectElement ||
    event.target instanceof HTMLButtonElement
  )
    return;
  const action = keys[event.key];
  if (action || event.code === 'Space') event.preventDefault();
  if (action) held.add(action);
  if (event.code === 'Space' && !event.repeat) jump = true;
};
const keyup = (event: KeyboardEvent): void => {
  const action = keys[event.key];
  if (action) held.delete(action);
};
const blur = (): void => held.clear();
window.addEventListener('keydown', keydown);
window.addEventListener('keyup', keyup);
window.addEventListener('blur', blur);
for (const button of document.querySelectorAll<HTMLButtonElement>(
  '[data-move]',
)) {
  const action = button.dataset.move!;
  button.onpointerdown = (event) => {
    button.setPointerCapture(event.pointerId);
    held.add(action);
  };
  button.onpointerup = button.onpointercancel = () => held.delete(action);
  button.onclick = (event) => {
    if (event.detail === 0) lab?.step(action);
  };
}
let game: Game | undefined;
let texture: Texture | undefined;
let lab: Platforms | undefined;
let released = false;
function release(): void {
  if (released) return;
  released = true;
  held.clear();
  window.removeEventListener('keydown', keydown);
  window.removeEventListener('keyup', keyup);
  window.removeEventListener('blur', blur);
  lab?.character.destroy();
  game?.destroy();
  texture?.destroy();
  for (const button of document.querySelectorAll('button'))
    button.disabled = true;
  status.textContent = 'Destroyed · input and controller released';
}
class Platforms extends Scene {
  readonly player = new Group();
  readonly character: CharacterController3D;
  readonly lift: Mesh;
  readonly deck: Mesh;
  readonly visual = new Group();
  readonly motion = new Vector3();
  readonly capsuleParts: Mesh[] = [];
  time = 0;
  velocity = 0;
  epoch = 0;
  stanceMessage = 'Standing';
  constructor(private readonly whiteTexture: Texture) {
    super();
    this.ambientLight = 0.65;
    this.directionalLight.intensity = 2;
    this.directionalLight.direction.set(-3, 7, 5).normalize();
    this.camera3D.position.set(11, 12, 16);
    this.camera3D.lookAt(new Vector3(0, 1, 0));
    this.box([0, -0.3, 0], [18, 0.6, 14], [0.19, 0.28, 0.35]);
    this.lift = this.box([-4, 0.25, 0], [3, 0.5, 3], [0.95, 0.65, 0.15], true);
    this.deck = this.box([4, 0.25, 0], [4, 0.5, 2.4], [0.12, 0.75, 0.7], true);
    this.box([0, 1.35, -4], [3.5, 0.3, 3], [0.63, 0.35, 0.85]);
    this.player.position.set(0, 1, 3);
    this.player.collider = new CapsuleCollider3D(0.3, 1.2);
    this.add(this.player);
    this.character = new CharacterController3D(this.player, this.physics3D, {
      crouchHeight: 0.35,
      groundSnap: 0.15,
    });
    const material = new PBRMaterial({
      texture: this.whiteTexture,
      color: [0.95, 0.3, 0.25],
      roughness: 0.6,
    });
    this.capsuleParts.push(
      new Mesh({
        geometry: Geometry.sphere(0.3, 16, 12),
        material,
        position: [0, 0.6, 0],
      }),
    );
    this.capsuleParts.push(
      new Mesh({
        geometry: Geometry.sphere(0.3, 16, 12),
        material,
        position: [0, -0.6, 0],
      }),
    );
    const positions: number[] = [],
      normals: number[] = [],
      uvs: number[] = [],
      indices: number[] = [];
    for (let i = 0; i <= 16; i++) {
      const angle = (i / 16) * Math.PI * 2,
        x = Math.cos(angle),
        z = Math.sin(angle);
      for (const y of [-0.6, 0.6]) {
        positions.push(x * 0.3, y, z * 0.3);
        normals.push(x, 0, z);
        uvs.push(i / 16, y > 0 ? 1 : 0);
      }
      if (i < 16) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
      }
    }
    this.capsuleParts.push(
      new Mesh({
        geometry: new Geometry({ positions, normals, uvs, indices }),
        material,
      }),
    );
    for (const part of this.capsuleParts) this.visual.add(part);
    this.player.add(this.visual);
  }
  box(
    position: [number, number, number],
    scale: [number, number, number],
    color: [number, number, number],
    moving = false,
  ): Mesh {
    const mesh = new Mesh({
      geometry: Geometry.cube(1),
      material: new PBRMaterial({
        texture: this.whiteTexture,
        color,
        roughness: 0.8,
      }),
      position,
      scale,
    });
    mesh.collider = new BoxCollider3D(new Vector3(0.5, 0.5, 0.5));
    mesh.body = new RigidBody3D({ type: moving ? 'kinematic' : 'static' });
    return this.add(mesh);
  }
  stance(crouch: boolean): void {
    const result = this.character.setStance(crouch ? 'crouching' : 'standing');
    this.stanceMessage = result.blocked
      ? 'Stand BLOCKED by real ceiling clearance query'
      : result.stance;
    // Keep radius fixed while changing the cylinder and hemispheres to match the collider.
    const half = result.height / 2;
    this.capsuleParts[0]!.position.y = half;
    this.capsuleParts[1]!.position.y = -half;
    this.capsuleParts[2]!.scale.y = result.height / 1.2;
  }
  visit(station: string): void {
    this.character.detachSupport();
    this.velocity = 0;
    if (station === 'ceiling') {
      this.stance(true);
      this.player.position.set(0, 0.49, -4);
    } else {
      this.player.position.set(0, 1, 3);
      this.stance(false);
      if (station === 'lift')
        this.player.position.set(-4, this.lift.position.y + 1.16, 0);
      if (station === 'rotate') this.player.position.set(5, 1.41, 0);
    }
  }
  step(action: string): void {
    this.character.move(
      this.motion.set(
        action === 'left' ? -0.35 : action === 'right' ? 0.35 : 0,
        -0.02,
        action === 'up' ? -0.35 : action === 'down' ? 0.35 : 0,
      ),
    );
  }
  override update(delta: number): void {
    const dt = Math.min(delta, 0.04);
    this.time += dt;
    this.lift.position.y = 0.25 + (1 - Math.cos(this.time)) * 1.2;
    this.deck.rotation.setFromEuler(0, this.time * 0.45, 0);
    if (jump && this.character.grounded) this.velocity = 6;
    jump = false;
    this.velocity -= 15 * dt;
    let x = Number(held.has('right')) - Number(held.has('left'));
    let z = Number(held.has('down')) - Number(held.has('up'));
    const length = Math.max(1, Math.hypot(x, z));
    x /= length;
    z /= length;
    const result = this.character.move(
      this.motion.set(x * dt * 3, this.velocity * dt, z * dt * 3),
      { epoch: ++this.epoch, detachSupport: this.velocity > 0 },
    );
    if (result.grounded && this.velocity < 0) this.velocity = 0;
    if (this.player.position.y < -4) this.visit('ground');
    const p = this.player.position;
    const carry = result.carriedDisplacement;
    stats.textContent = `Pose: (${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}) · ${this.character.stance}\nGrounded: ${result.grounded} · support: ${result.support === this.lift ? 'moving lift' : result.support === this.deck ? 'rotating deck' : result.support ? 'ground/roof' : 'none'}\nCarried: (${carry.x.toFixed(3)}, ${carry.y.toFixed(3)}, ${carry.z.toFixed(3)}) · yaw: ${result.supportYawDelta.toFixed(3)} rad\n${this.stanceMessage} · blocked movement: ${result.blocked} · detach: ${result.supportDetached}\nLift height: ${this.lift.position.y.toFixed(2)} · deck angle: ${(this.time * 0.45).toFixed(2)} rad`;
  }
}
try {
  const pixel = document.createElement('canvas');
  pixel.width = pixel.height = 1;
  const context = pixel.getContext('2d')!;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, 1, 1);
  texture = await Texture.fromImage(pixel);
  game = await Game.create({
    canvas: '#game',
    width: 960,
    height: 540,
    renderer: backend.value as RendererPreference,
  });
  if (!game.graphics.capabilities.threeD)
    throw new Error('This demo requires WebGPU or WebGL2 3D rendering.');
  game.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });
  lab = new Platforms(texture);
  await game.setScene(lab);
  game.start();
  status.textContent = `${game.graphics.backend} · actual CharacterController3D sweep/slide and support carry`;
  element('jump').onclick = () => {
    jump = true;
  };
  element('crouch').onclick = () => lab?.stance(true);
  element('stand').onclick = () => lab?.stance(false);
  for (const id of ['lift', 'rotate', 'ceiling', 'reset'])
    element(id).onclick = () => lab?.visit(id);
  element('destroy').onclick = release;
} catch (error) {
  game?.destroy();
  texture?.destroy();
  status.textContent = `Initialization failed: ${error instanceof Error ? error.message : String(error)}`;
}
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) release();
});

import {
  Game,
  Scene,
  Mesh,
  Geometry,
  PBRMaterial,
  Texture,
  Vector3,
  BoxCollider3D,
  RigidBody3D,
  DistanceJoint3D,
  HingeJoint3D,
  BallSocketJoint3D,
  type RendererPreference,
} from '../../src/index.js';
const element = <T extends HTMLElement>(id: string): T =>
  document.querySelector<T>(`#${id}`)!;
const backend = element<HTMLSelectElement>('backend'),
  motor = element<HTMLInputElement>('motor');
const status = element<HTMLParagraphElement>('status'),
  stats = element<HTMLPreElement>('stats');
backend.value = new URLSearchParams(location.search).get('renderer') ?? 'auto';
backend.onchange = () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
};
let game: Game | undefined,
  lab: Workshop | undefined,
  released = false;
let texture: Texture | undefined;
function release(): void {
  if (released) return;
  released = true;
  game?.destroy();
  texture?.destroy();
  for (const button of document.querySelectorAll('button'))
    button.disabled = true;
  motor.disabled = true;
  status.textContent =
    'Destroyed · owned scene and physics constraints released';
}
class Workshop extends Scene {
  readonly hinge: HingeJoint3D;
  readonly locked: BallSocketJoint3D;
  readonly chain: Mesh[] = [];
  readonly distances: DistanceJoint3D[] = [];
  readonly ropes: Mesh[] = [];
  readonly pendulum: Mesh;
  readonly payload: Mesh;
  elapsed = 0;
  constructor(private readonly whiteTexture: Texture) {
    super();
    this.ambientLight = 0.65;
    this.directionalLight.intensity = 2;
    this.directionalLight.direction.set(-3, 6, 4).normalize();
    this.camera3D.position.set(11, 9, 15);
    this.camera3D.lookAt(new Vector3(0, 3, 0));
    this.physics3D.gravity.set(0, -9.81, 0);
    this.box([0, -0.3, 0], [14, 0.6, 8], [0.18, 0.26, 0.35], false);
    this.box([0, 6.3, 0], [11, 0.3, 0.5], [0.4, 0.48, 0.6], false);
    this.pendulum = this.box([-3, 4.5, 0], [0.45, 3, 0.45], [0.95, 0.65, 0.15]);
    this.hinge = this.physics3D.addJoint(
      new HingeJoint3D({
        bodyA: this.pendulum,
        anchor: new Vector3(-3, 6, 0),
        axis: new Vector3(0, 0, 1),
        enableMotor: true,
        motorSpeed: 0.8,
        maxMotorTorque: 30,
      }),
    );
    for (let i = 0; i < 4; i++) {
      const y = 5 - i;
      const link = this.box([2, y, 0], [0.45, 0.45, 0.45], [0.12, 0.78, 0.7]);
      this.chain.push(link);
      const previous = this.chain[i - 1];
      this.distances.push(
        this.physics3D.addJoint(
          new DistanceJoint3D({
            bodyA: link,
            ...(previous ? { bodyB: previous } : {}),
            anchor: new Vector3(2, y, 0),
            anchorB: new Vector3(2, y + 1, 0),
            length: 1,
          }),
        ),
      );
      this.ropes.push(
        this.add(
          new Mesh({
            geometry: Geometry.cube(1),
            material: new PBRMaterial({
              texture: this.whiteTexture,
              color: [0.6, 0.86, 0.9],
              roughness: 0.7,
            }),
            scale: [0.06, 1, 0.06],
          }),
        ),
      );
    }
    this.payload = this.box([2.75, 2, 0], [1, 0.4, 0.5], [0.92, 0.3, 0.3]);
    this.locked = this.physics3D.addJoint(
      new BallSocketJoint3D({
        bodyA: this.chain[3]!,
        bodyB: this.payload,
        anchor: new Vector3(2.3, 2, 0),
        swingLimit: 0,
        lowerTwist: 0,
        upperTwist: 0,
      }),
    );
  }
  box(
    position: [number, number, number],
    scale: [number, number, number],
    color: [number, number, number],
    dynamic = true,
  ): Mesh {
    const mesh = new Mesh({
      geometry: Geometry.cube(1),
      material: new PBRMaterial({
        texture: this.whiteTexture,
        color,
        roughness: 0.65,
      }),
      position,
      scale,
    });
    mesh.collider = new BoxCollider3D(new Vector3(0.5, 0.5, 0.5));
    mesh.body = new RigidBody3D({
      type: dynamic ? 'dynamic' : 'static',
      mass: 1,
      linearDamping: 0.15,
      angularDamping: 0.2,
    });
    return this.add(mesh);
  }
  push(): void {
    this.chain[3]!.body!.applyImpulse(new Vector3(3, 0, 2));
  }
  override update(delta: number): void {
    // The lines follow solved anchor snapshots; they do not move or constrain physics bodies.
    let maxError = 0;
    for (let i = 0; i < this.distances.length; i++) {
      const [a, b] = this.distances[i]!.anchors(),
        rope = this.ropes[i]!;
      const dx = b.x - a.x,
        dy = b.y - a.y,
        dz = b.z - a.z,
        length = Math.hypot(dx, dy, dz);
      rope.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
      rope.scale.y = length;
      rope.rotation.setFromEuler(
        Math.atan2(dz, Math.hypot(dx, dy)),
        0,
        -Math.atan2(dx, dy),
      );
      maxError = Math.max(
        maxError,
        Math.abs(length - this.distances[i]!.length),
      );
    }
    this.elapsed += delta;
    if (this.elapsed < 0.15) return;
    this.elapsed = 0;
    const [a, b] = this.locked.anchors();
    stats.textContent = `Hinge angle: ${this.hinge.angle.toFixed(3)} rad · motor ${this.hinge.enableMotor ? 'ON' : 'OFF'} · target ${this.hinge.motorSpeed.toFixed(2)} rad/s\nHinge reaction: ${this.hinge.reactionForce.toFixed(2)} N / ${this.hinge.reactionTorque.toFixed(2)} N·m\nDistance links: ${this.distances.length} · maximum length error: ${maxError.toFixed(4)} m\nLocked payload anchor error: ${Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z).toFixed(4)} m\nPayload pose: (${this.payload.position.x.toFixed(2)}, ${this.payload.position.y.toFixed(2)}, ${this.payload.position.z.toFixed(2)})`;
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
  lab = new Workshop(texture);
  await game.setScene(lab);
  game.start();
  status.textContent = `${game.graphics.backend} · real sequential-impulse joints · gold hinge / teal chain / red angular-locked payload`;
  motor.onchange = () => {
    if (lab) {
      lab.hinge.enableMotor = motor.checked;
      lab.hinge.wake();
    }
  };
  element('reverse').onclick = () => {
    if (lab) {
      lab.hinge.motorSpeed *= -1;
      lab.hinge.wake();
    }
  };
  element('push').onclick = () => lab?.push();
  element('reset').onclick = async () => {
    try {
      if (!game || !texture || released) return;
      const next = new Workshop(texture);
      next.hinge.enableMotor = motor.checked;
      await game.setScene(next);
      lab = next;
    } catch (error) {
      status.textContent = `Reset failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  };
  element('destroy').onclick = release;
} catch (error) {
  game?.destroy();
  texture?.destroy();
  status.textContent = `Initialization failed: ${error instanceof Error ? error.message : String(error)}`;
}
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) release();
});

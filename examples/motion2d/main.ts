import {
  Game,
  Scene,
  Sprite,
  Texture,
  Vector2,
  Colliders,
  RigidBody2D,
  CharacterController2D,
  type ColorRGBA,
  type RendererPreference,
} from '../../src/index.js';

const backend = document.querySelector<HTMLSelectElement>('#backend')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;
const stats = document.querySelector<HTMLPreElement>('#stats')!;
backend.value = new URLSearchParams(location.search).get('renderer') ?? 'auto';
backend.onchange = () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
};
const held = new Set<string>();
let jump = false;
let reset = false;
const keydown = (event: KeyboardEvent): void => {
  if (
    event.target instanceof HTMLButtonElement ||
    event.target instanceof HTMLSelectElement
  )
    return;
  if (
    ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space', 'KeyR'].includes(
      event.code,
    )
  )
    event.preventDefault();
  if (event.code === 'ArrowLeft' || event.code === 'KeyA') held.add('left');
  if (event.code === 'ArrowRight' || event.code === 'KeyD') held.add('right');
  if (event.code === 'Space' && !event.repeat) jump = true;
  if (event.code === 'KeyR' && !event.repeat) reset = true;
};
const keyup = (event: KeyboardEvent): void => {
  if (event.code === 'ArrowLeft' || event.code === 'KeyA') held.delete('left');
  if (event.code === 'ArrowRight' || event.code === 'KeyD')
    held.delete('right');
};
const blur = (): void => {
  held.clear();
  jump = false;
};
window.addEventListener('keydown', keydown);
window.addEventListener('keyup', keyup);
window.addEventListener('blur', blur);
for (const button of document.querySelectorAll<HTMLButtonElement>(
  '[data-move]',
)) {
  const direction = button.dataset.move!;
  button.onpointerdown = (event) => {
    button.setPointerCapture(event.pointerId);
    held.add(direction);
  };
  button.onpointerup = button.onpointercancel = () => held.delete(direction);
  button.onclick = (event) => {
    if (event.detail === 0) lab?.nudge(direction);
  };
}
document.querySelector<HTMLButtonElement>('#jump')!.onclick = () => {
  jump = true;
};
document.querySelector<HTMLButtonElement>('#reset')!.onclick = () => {
  reset = true;
};
const textures: Texture[] = [];
let game: Game | undefined;
let lab: MotionLevel | undefined;
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
  for (const texture of textures) texture.destroy();
  textures.length = 0;
  for (const button of document.querySelectorAll<HTMLButtonElement>('button'))
    button.disabled = true;
  status.textContent =
    'Destroyed · zero owned scene registrations and input listeners';
}
document.querySelector<HTMLButtonElement>('#destroy')!.onclick = release;

class MotionLevel extends Scene {
  readonly player: Sprite;
  readonly character: CharacterController2D;
  readonly lift: Sprite;
  readonly deck: Sprite;
  readonly beacons: Sprite[] = [];
  readonly shots: Sprite[] = [];
  readonly motion = new Vector2();
  projectile: Sprite | undefined;
  blade: Sprite | undefined;
  verticalSpeed = 0;
  score = 0;
  impacts = 0;
  carryDistance = 0;
  lastDetach = 'none';
  constructor(
    private readonly pixel: Texture,
    private readonly disc: Texture,
    slope: Texture,
  ) {
    super({ fixedDelta: 1 / 120, interpolatePhysics: true });
    this.physics.gravity.set(0, 900);
    this.rect(130, 500, 260, 20, [0.25, 0.4, 0.5, 1]);
    this.rect(720, 500, 480, 20, [0.25, 0.4, 0.5, 1]);
    this.lift = this.rect(355, 440, 100, 14, [0.95, 0.65, 0.2, 1], 'kinematic');
    this.deck = this.rect(790, 345, 120, 12, [0.1, 0.75, 0.72, 1], 'kinematic');
    const ramp = this.add(
      new Sprite({
        texture: slope,
        position: [560, 450],
        anchor: [0.5, 0.5],
        tint: [0.4, 0.65, 0.9, 1],
      }),
    );
    ramp.collider = Colliders.polygon([
      [-80, 40],
      [80, -40],
      [80, 40],
    ]);
    ramp.body = new RigidBody2D({ type: 'static' });
    this.rect(650, 450, 20, 80, [0.4, 0.65, 0.9, 1]);
    this.rect(670, 442.5, 20, 95, [0.4, 0.65, 0.9, 1]);
    this.rect(690, 435, 20, 110, [0.4, 0.65, 0.9, 1]);
    this.rect(920, 320, 80, 14, [0.65, 0.4, 0.9, 1]);
    this.rect(470, 120, 2, 90, [1, 0.9, 0.4, 1]);
    this.rect(728, 188, 2, 12, [1, 0.9, 0.4, 1]);
    this.player = this.rect(75, 460, 16, 28, [1, 0.3, 0.35, 1], 'kinematic');
    this.player.body!.lockRotation = true;
    this.character = new CharacterController2D(this.player, this.physics, {
      skin: 0.03,
      stepHeight: 17,
      groundSnap: 1,
    });
    for (const [x, y] of [
      [175, 465],
      [655, 390],
      [920, 290],
    ]) {
      const beacon = this.add(
        new Sprite({
          texture: disc,
          position: [x, y],
          anchor: [0.5, 0.5],
          scale: [0.4, 0.4],
          tint: [1, 0.85, 0.2, 1],
        }),
      );
      beacon.collider = Colliders.circle(16);
      beacon.collider.sensor = true;
      beacon.addEventListener('collisionstart', (event) => {
        const detail = (event as CustomEvent<{ other: Sprite }>).detail;
        if (detail.other !== this.player || !beacon.renderEnabled) return;
        beacon.renderEnabled = false;
        beacon.collider = undefined;
        this.score++;
        if (this.score === 3)
          status.textContent =
            'All three beacons collected — level complete! Restart to play again.';
      });
      this.beacons.push(beacon);
    }
    this.fire();
  }
  rect(
    x: number,
    y: number,
    width: number,
    height: number,
    tint: ColorRGBA,
    type: 'static' | 'kinematic' | 'dynamic' = 'static',
  ): Sprite {
    const sprite = this.add(
      new Sprite({
        texture: this.pixel,
        anchor: [0.5, 0.5],
        position: [x, y],
        scale: [width, height],
        tint,
      }),
    );
    sprite.collider = Colliders.box(1, 1);
    sprite.body = new RigidBody2D({ type, friction: 0.8 });
    return sprite;
  }
  nudge(direction: string): void {
    this.character.move(this.motion.set(direction === 'left' ? -12 : 12, 0));
  }
  restart(): void {
    this.character.detachSupport();
    this.player.position.set(75, 460);
    this.verticalSpeed = 0;
    this.score = 0;
    for (const beacon of this.beacons) {
      beacon.renderEnabled = true;
      if (!beacon.collider) {
        beacon.collider = Colliders.circle(16);
        beacon.collider.sensor = true;
      }
    }
    status.textContent = `${game?.graphics.backend ?? ''} · collect three beacons`;
  }
  fire(): void {
    for (const shot of this.shots) shot.destroy();
    this.shots.length = 0;
    const projectile = this.rect(60, 120, 6, 6, [1, 0.4, 0.2, 1], 'dynamic');
    projectile.body = new RigidBody2D({
      ccd: true,
      lockRotation: true,
      gravityScale: 0,
      restitution: 1,
      friction: 0,
    });
    projectile.body.velocity.x = 9000;
    projectile.addEventListener('collisionstart', () => {
      this.impacts++;
    });
    this.projectile = projectile;
    this.shots.push(projectile);
    for (const [x, velocity, tint] of [
      [80, 9000, [0.4, 0.7, 1, 1]],
      [480, -9000, [1, 0.5, 0.8, 1]],
    ] as const) {
      const shot = this.rect(x, 215, 12, 12, [...tint], 'dynamic');
      shot.body = new RigidBody2D({
        ccd: true,
        lockRotation: true,
        gravityScale: 0,
        restitution: 1,
        friction: 0,
      });
      shot.body.velocity.x = velocity;
      this.shots.push(shot);
    }
    const blade = this.rect(700, 160, 76, 2, [0.65, 1, 0.45, 1], 'dynamic');
    blade.body = new RigidBody2D({ ccd: true, gravityScale: 0, friction: 0 });
    blade.body.angularVelocity = 40;
    this.blade = blade;
    this.shots.push(blade);
  }
  override fixedUpdate(dt: number): void {
    if (reset) {
      reset = false;
      this.restart();
    }
    const t = this.fixedElapsed;
    this.lift.body!.velocity.set(
      Math.cos(t * 0.8) * 38,
      -Math.sin(t * 1.1) * 44,
    );
    this.deck.body!.angularVelocity = Math.cos(t * 0.7) * 0.16;
    if (jump && this.character.grounded) {
      this.verticalSpeed = -390;
      this.character.detachSupport('jump');
    }
    jump = false;
    this.verticalSpeed += 900 * dt;
    const result = this.character.move(
      this.motion.set(
        (Number(held.has('right')) - Number(held.has('left'))) * 165 * dt,
        this.verticalSpeed * dt,
      ),
      { epoch: this.fixedFrame },
    );
    if (result.grounded && this.verticalSpeed > 0) this.verticalSpeed = 0;
    this.carryDistance += Math.hypot(
      result.carriedDisplacement.x,
      result.carriedDisplacement.y,
    );
    this.lastDetach = result.supportDetached;
    if (this.player.position.y > 580) {
      this.character.detachSupport();
      this.player.position.set(75, 460);
      this.verticalSpeed = 0;
    }
    // Retain stopped challenge shapes, but retire projectiles after their visible rebound.
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const shot = this.shots[i]!;
      if (
        shot === this.blade ||
        (shot.position.x > -100 && shot.position.x < 1060)
      )
        continue;
      shot.destroy();
      this.shots.splice(i, 1);
    }
  }
  override update(): void {
    const p = this.player.position,
      ccd = this.physics.ccdStats;
    stats.textContent = `Beacons: ${this.score}/3 · position (${p.x.toFixed(1)}, ${p.y.toFixed(1)})\nGrounded: ${this.character.grounded} · carried ${this.carryDistance.toFixed(1)} px · detach ${this.lastDetach}\nCCD wall contacts: ${this.impacts} · blade angle ${(this.blade?.rotation ?? 0).toFixed(3)} rad\nLast fixed tick: ${ccd.iterations} CCD iterations · ${ccd.impacts} impacts · ${ccd.budgetExhaustions} exhaustion · retained free-prefix ${ccd.stoppedTime.toFixed(5)} s omitted`;
  }
}

try {
  const pixelCanvas = document.createElement('canvas');
  pixelCanvas.width = pixelCanvas.height = 1;
  const pc = pixelCanvas.getContext('2d')!;
  pc.fillStyle = '#fff';
  pc.fillRect(0, 0, 1, 1);
  const discCanvas = document.createElement('canvas');
  discCanvas.width = discCanvas.height = 32;
  const dc = discCanvas.getContext('2d')!;
  dc.fillStyle = '#fff';
  dc.beginPath();
  dc.arc(16, 16, 16, 0, Math.PI * 2);
  dc.fill();
  const slopeCanvas = document.createElement('canvas');
  slopeCanvas.width = 160;
  slopeCanvas.height = 80;
  const sc = slopeCanvas.getContext('2d')!;
  sc.fillStyle = '#fff';
  sc.beginPath();
  sc.moveTo(0, 80);
  sc.lineTo(160, 0);
  sc.lineTo(160, 80);
  sc.closePath();
  sc.fill();
  const loaded = await Promise.all([
    Texture.fromImage(pixelCanvas),
    Texture.fromImage(discCanvas),
    Texture.fromImage(slopeCanvas),
  ]);
  textures.push(...loaded);
  game = await Game.create({
    canvas: '#game',
    width: 960,
    height: 540,
    renderer: backend.value as RendererPreference,
  });
  game.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });
  lab = new MotionLevel(loaded[0]!, loaded[1]!, loaded[2]!);
  await game.setScene(lab);
  Object.assign(window, { __xyzMotion2D: { game, level: lab, release } });
  document.querySelector<HTMLButtonElement>('#fire')!.onclick = () =>
    lab?.fire();
  game.start();
  status.textContent = `${game.graphics.backend} · collect three beacons · fixed-step convex sweep/slide`;
} catch (error) {
  release();
  status.textContent = `Initialization failed: ${error instanceof Error ? error.message : String(error)}`;
}
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) release();
});

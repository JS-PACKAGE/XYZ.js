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
  AnimationClip,
  KeyframeTrack,
  type CharacterLocomotion3D,
  type LocomotionAnimation3D,
  type RendererPreference,
} from '../../src/index.js';

const status = document.querySelector<HTMLParagraphElement>('#status')!;
const stats = document.querySelector<HTMLPreElement>('#stats')!;
const held = new Set<string>();
let jump = false;
let game: Game | undefined;
let lab: LocomotionLab | undefined;
let texture: Texture | undefined;
let destroyed = false;
const onKeyDown = (event: KeyboardEvent): void => {
  if (event.target instanceof HTMLButtonElement) return;
  if (
    ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(
      event.code,
    )
  )
    event.preventDefault();
  held.add(event.code);
  if (event.code === 'Space' && !event.repeat) jump = true;
};
const onKeyUp = (event: KeyboardEvent): void => {
  held.delete(event.code);
};
const onBlur = (): void => {
  held.clear();
  jump = false;
};
window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);
window.addEventListener('blur', onBlur);

class LocomotionLab extends Scene {
  readonly player = new Group();
  readonly root = new Group();
  readonly character: CharacterController3D;
  readonly driver: CharacterLocomotion3D;
  readonly platform: Mesh;
  private time = 0;
  constructor(private readonly white: Texture) {
    super();
    this.ambientLight = 0.7;
    this.directionalLight.intensity = 2;
    this.camera3D.position.set(10, 12, 14);
    this.camera3D.lookAt(new Vector3(0, 0, 0));
    this.box([0, -0.25, 0], [16, 0.5, 16], [0.2, 0.28, 0.36]);
    this.box([0, 1.5, -3], [5, 3, 0.3], [0.65, 0.3, 0.5]);
    this.platform = this.box([-4, 0.3, 0], [3, 0.6, 3], [0.9, 0.7, 0.2], true);
    this.player.collider = new CapsuleCollider3D(0.25, 1);
    this.player.position.set(0, 0.753, 2);
    this.add(this.player);
    this.player.add(this.root);
    this.character = new CharacterController3D(this.player, this.physics3D);
    const torso = new Mesh({
      geometry: Geometry.cube(1),
      material: new PBRMaterial({
        alphaMode: 'OPAQUE',
        texture: white,
        color: [0.1, 0.75, 0.8],
        roughness: 0.7,
      }),
      scale: [0.4, 0.8, 0.3],
    });
    this.root.add(torso);
    const nose = new Mesh({
      geometry: Geometry.cube(1),
      material: new PBRMaterial({
        alphaMode: 'OPAQUE',
        texture: white,
        color: [1, 0.8, 0.2],
      }),
      position: [0, 0.2, 0.25],
      scale: [0.15, 0.15, 0.2],
    });
    this.root.add(nose);
    const animations: Record<string, LocomotionAnimation3D> = {};
    for (const [name, speed, bob] of [
      ['idle', 0, 0.015],
      ['walk', 2, 0.06],
      ['run', 5, 0.12],
      ['jump', 0, 0.1],
      ['fall', 0, 0.05],
    ] as const) {
      animations[name] = {
        clip: new AnimationClip(name, [
          new KeyframeTrack(
            this.root,
            'translation',
            [0, 1],
            [0, 0, 0, 0, 0, speed],
          ),
          new KeyframeTrack(
            torso,
            'translation',
            [0, 0.25, 0.5, 0.75, 1],
            [0, 0, 0, 0, bob, 0, 0, 0, 0, 0, bob, 0, 0, 0, 0],
          ),
        ]),
        ...(speed > 0 ? { motionSpeed: speed } : {}),
      };
    }
    this.driver = this.createLocomotion3D(this.character, {
      root: this.root,
      animations,
      movement: 'root-motion',
      states: {
        idle: 'idle',
        walk: 'walk',
        run: 'run',
        jump: 'jump',
        fall: 'fall',
      },
    });
  }
  private box(
    position: [number, number, number],
    scale: [number, number, number],
    color: [number, number, number],
    moving = false,
  ): Mesh {
    const mesh = new Mesh({
      geometry: Geometry.cube(1),
      material: new PBRMaterial({
        alphaMode: 'OPAQUE',
        texture: this.white,
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
  override fixedUpdate(delta: number): void {
    if (!this.driver.paused) {
      this.time += delta;
      this.platform.position.y = 0.3 + (1 - Math.cos(this.time)) * 0.7;
      this.platform.rotation.setFromEuler(0, this.time * 0.25, 0);
    }
    this.driver.setInput({
      x:
        Number(held.has('KeyD') || held.has('ArrowRight')) -
        Number(held.has('KeyA') || held.has('ArrowLeft')),
      z:
        Number(held.has('KeyS') || held.has('ArrowDown')) -
        Number(held.has('KeyW') || held.has('ArrowUp')),
      run: held.has('ShiftLeft') || held.has('ShiftRight'),
      jump,
    });
    jump = false;
    // Scene owns the independent fixed mixer and advances the driver after this callback.
  }
  override update(): void {
    const p = this.player.position,
      r = this.driver.result;
    stats.textContent = `Phase: ${this.driver.phase} · clip: ${this.driver.animation.current}\nPosition: ${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)}\nGrounded: ${r?.grounded ?? false} · blocked: ${r?.blocked ?? false} · support: ${r?.support === this.platform ? 'moving platform' : 'ground/none'}\nMeasured horizontal speed: ${Math.hypot(this.driver.velocity.x, this.driver.velocity.z).toFixed(3)} m/s\nRoot local translation remains: ${this.root.position.length().toFixed(3)}\nIndependent mixer, 60 Hz fixed simulation; presentation does not advance it.`;
  }
  visit(platform: boolean): void {
    this.driver.stop();
    this.character.detachSupport();
    this.player.position.set(
      platform ? -4 : 0,
      platform ? this.platform.position.y + 1.053 : 0.753,
      platform ? 0 : 2,
    );
    held.clear();
    jump = false;
    this.driver.start();
  }
}
function release(): void {
  if (destroyed) return;
  destroyed = true;
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  window.removeEventListener('blur', onBlur);
  held.clear();
  game?.destroy();
  lab?.character.destroy();
  texture?.destroy();
  for (const button of document.querySelectorAll('button'))
    button.disabled = true;
  status.textContent =
    'Destroyed: independent mixer detached; borrowed controller explicitly released.';
}
try {
  const pixel = document.createElement('canvas');
  pixel.width = pixel.height = 1;
  const context = pixel.getContext('2d')!;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, 1, 1);
  texture = await Texture.fromImage(pixel);
  const renderer = (new URLSearchParams(location.search).get('renderer') ??
    'auto') as RendererPreference;
  game = await Game.create({
    canvas: '#game',
    width: 960,
    height: 540,
    renderer,
  });
  if (!game.graphics.capabilities.threeD)
    throw new Error(
      'Locomotion requires WebGPU or WebGL2; Canvas2D is unsupported.',
    );
  lab = new LocomotionLab(texture);
  await game.setScene(lab);
  game.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });
  game.start();
  status.textContent = `${game.graphics.backend}: fixed root-motion capsule locomotion`;
  document.querySelector<HTMLButtonElement>('#pause')!.onclick = () => {
    if (lab) lab.driver.paused = !lab.driver.paused;
  };
  document.querySelector<HTMLButtonElement>('#seek')!.onclick = () =>
    lab?.driver.seek(0.7);
  document.querySelector<HTMLButtonElement>('#stop')!.onclick = () =>
    lab?.driver.stop();
  document.querySelector<HTMLButtonElement>('#start')!.onclick = () =>
    lab?.driver.start();
  document.querySelector<HTMLButtonElement>('#platform')!.onclick = () =>
    lab?.visit(true);
  document.querySelector<HTMLButtonElement>('#reset')!.onclick = () =>
    lab?.visit(false);
  document.querySelector<HTMLButtonElement>('#destroy')!.onclick = release;
} catch (error) {
  release();
  status.textContent = `Initialization failed: ${error instanceof Error ? error.message : String(error)}`;
}
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) release();
});

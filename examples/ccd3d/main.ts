import {
  Game,
  Scene,
  Mesh,
  Geometry,
  TextureMaterial,
  Texture,
  BoxCollider3D,
  SphereCollider3D,
  RigidBody3D,
  Vector3,
  type RendererPreference,
} from '../../src/index.js';
const $ = <T extends HTMLElement>(id: string): T =>
  document.querySelector<T>(`#${id}`)!;
const backend = $<HTMLSelectElement>('backend');
const ccd = $<HTMLInputElement>('ccd');
const scenario = $<HTMLSelectElement>('scenario');
const status = $('status');
backend.value = new URLSearchParams(location.search).get('renderer') ?? 'auto';
backend.onchange = () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
};
let game: Game | undefined;
let disposed = false;
let texture: Texture | undefined;
const release = (): void => {
  if (disposed) return;
  disposed = true;
  game?.destroy();
  texture?.destroy();
  status.textContent = 'Destroyed. Reload to restart.';
};
try {
  game = await Game.create({
    canvas: '#game',
    width: 900,
    height: 450,
    renderer: backend.value as RendererPreference,
  });
  if (!game.graphics.capabilities.threeD)
    throw new Error('3D requires WebGPU or WebGL2; Canvas2D is unsupported.');
  const runtime = game;
  runtime.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });
  const pixel = document.createElement('canvas');
  pixel.width = pixel.height = 1;
  const context = pixel.getContext('2d')!;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, 1, 1);
  texture = await Texture.fromImage(pixel);
  const white = texture;
  class CollisionLab extends Scene {
    readonly moving: Mesh[] = [];
    ticks = 0;
    contacts = 0;
    iterations = 0;
    impacts = 0;
    exhaustions = 0;
    tests = 0;
    constructor() {
      super({ fixedDelta: 1 / 120, interpolatePhysics: false });
      this.physics3D.gravity.set(0, 0, 0);
      this.camera3D.position.set(0, 0.8, 12);
      this.camera3D.lookAt(new Vector3(0, 0, 0));
      const sphere = (
        x: number,
        y: number,
        color: [number, number, number],
      ): Mesh => {
        const mesh = new Mesh({
          geometry: Geometry.sphere(0.22, 16, 8),
          material: new TextureMaterial({ texture: white, color }),
          position: [x, y, 0],
        });
        mesh.collider = new SphereCollider3D(0.22);
        mesh.body = new RigidBody3D({
          continuous: ccd.checked,
          gravityScale: 0,
          restitution: 1,
          friction: 0,
          allowSleep: false,
        });
        mesh.addEventListener('collisionstart', () => {
          ++this.contacts;
        });
        this.moving.push(mesh);
        return this.add(mesh);
      };
      if (scenario.value === 'pair') {
        sphere(-2, 0, [0.2, 0.85, 1]).body!.velocity.set(480, 0, 0);
        sphere(2, 0, [1, 0.55, 0.15]).body!.velocity.set(-480, 0, 0);
      } else {
        const blade = new Mesh({
          geometry: Geometry.cube(1),
          material: new TextureMaterial({
            texture: white,
            color: [0.2, 0.85, 1],
          }),
          scale: [4, 0.12, 0.3],
        });
        blade.collider = new BoxCollider3D(new Vector3(0.5, 0.5, 0.5));
        blade.body = new RigidBody3D({
          continuous: ccd.checked,
          gravityScale: 0,
          allowSleep: false,
          restitution: 0,
        });
        blade.body.angularVelocity.set(0, 0, Math.PI * 120);
        this.add(blade);
        this.moving.push(blade);
        sphere(0, 1.5, [1, 0.55, 0.15]);
      }
    }
    override fixedUpdate(): void {
      if (!this.physics3D.enabled) return;
      const s = this.physics3D.stats;
      this.iterations += s.ccdIterations;
      this.impacts += s.ccdImpacts;
      this.exhaustions += s.ccdExhaustions;
      this.tests += s.ccdTests;
      if (++this.ticks > 1) this.physics3D.enabled = false;
    }
    override update(): void {
      $('stats').textContent =
        `Physics steps: ${Math.min(this.ticks, 1)} / 1 · ${this.physics3D.enabled ? 'running' : 'paused'}\nProjectile contact-start events: ${this.contacts}\nCCD tests ${this.tests} · iterations ${this.iterations} · impacts ${this.impacts} · exhaustions ${this.exhaustions}\n${this.moving.map((m, i) => `Body ${i + 1}: x=${m.position.x.toFixed(2)}, y=${m.position.y.toFixed(2)}, vx=${m.body!.velocity.x.toFixed(2)}, vy=${m.body!.velocity.y.toFixed(2)}`).join('\n')}`;
    }
  }
  let switching = false;
  const fire = async (): Promise<void> => {
    if (disposed || switching) return;
    switching = true;
    try {
      await runtime.setScene(new CollisionLab());
      status.textContent = `${runtime.graphics.backend} · 3D supported · ${ccd.checked ? 'CCD on' : 'discrete only'} · ${scenario.selectedOptions[0]!.textContent}`;
    } catch (error) {
      status.textContent = String(error);
    } finally {
      switching = false;
    }
  };
  $('fire').onclick = () => {
    void fire();
  };
  ccd.onchange = () => {
    void fire();
  };
  scenario.onchange = () => {
    void fire();
  };
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && event.target === document.body) {
      event.preventDefault();
      void fire();
    }
  });
  $('destroy').onclick = release;
  await fire();
  runtime.start();
} catch (error) {
  game?.destroy();
  texture?.destroy();
  status.textContent = `Initialization failed: ${String(error)}`;
}
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) release();
});

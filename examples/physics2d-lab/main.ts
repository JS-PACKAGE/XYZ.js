import {
  Colliders,
  DistanceJoint,
  Game,
  MouseJoint,
  PhysicsDebugDraw2D,
  RevoluteJoint,
  RigidBody2D,
  Scene,
  Sprite,
  StaticChain2D,
  StaticConcave2D,
  Texture,
  type ColorRGBA,
  type RendererPreference,
} from '../../src/index.js';

const WIDTH = 800;
const HEIGHT = 450;
const WALL_X = 400;
const WALL_Y = 360;
const BULLET_SPEED = 4000;
const BALL_RADIUS = 9;
const MAX_BALLS = 60;
const MAX_MOUSE_FORCE_PER_MASS = 30000;

const $ = <T extends HTMLElement>(id: string): T =>
  document.querySelector<T>(`#${id}`)!;
const backend = $<HTMLSelectElement>('backend');
const ccd = $<HTMLInputElement>('ccd');
const debugToggle = $<HTMLInputElement>('debug');
const stats = $<HTMLParagraphElement>('stats');
const status = $<HTMLParagraphElement>('status');

backend.value = new URLSearchParams(location.search).get('renderer') ?? 'auto';
backend.addEventListener('change', () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
});

async function shapeTexture(
  size: number,
  draw: (context: CanvasRenderingContext2D) => void,
): Promise<Texture> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#fff';
  draw(context);
  return Texture.fromImage(canvas);
}

let game: Game | undefined;
let debug: PhysicsDebugDraw2D | undefined;
const textures: Texture[] = [];
const release = (): void => {
  debug?.destroy();
  game?.destroy();
  for (const texture of textures) texture.destroy();
  textures.length = 0;
};

try {
  game = await Game.create({
    canvas: '#game',
    width: WIDTH,
    height: HEIGHT,
    renderer: backend.value as RendererPreference,
  });
  const runtime = game;
  runtime.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });

  const [pixel, disc] = await Promise.all([
    shapeTexture(1, (c) => c.fillRect(0, 0, 1, 1)),
    shapeTexture(32, (c) => {
      c.beginPath();
      c.arc(16, 16, 16, 0, Math.PI * 2);
      c.fill();
    }),
  ]);
  textures.push(pixel, disc);

  const rect = (
    scene: Scene,
    x: number,
    y: number,
    w: number,
    h: number,
    tint: ColorRGBA,
  ): Sprite =>
    scene.add(
      new Sprite({
        texture: pixel,
        position: [x, y],
        scale: [w, h],
        tint,
      }),
    );
  const ball = (
    scene: Scene,
    x: number,
    y: number,
    radius: number,
    tint: ColorRGBA,
    mass = 1,
  ): Sprite => {
    const sprite = scene.add(
      new Sprite({
        texture: disc,
        position: [x, y],
        anchor: [0.5, 0.5],
        scale: [radius / 16, radius / 16],
        tint,
      }),
    );
    sprite.collider = Colliders.circle(radius);
    sprite.body = new RigidBody2D({ mass, restitution: 0.3, friction: 0.4 });
    return sprite;
  };

  class Lab extends Scene {
    readonly balls: Sprite[] = [];
    readonly grabbable: Sprite[] = [];
    bullet: Sprite | undefined;
    grab: MouseJoint | undefined;
    constructor() {
      super();
      this.physics.gravity.set(0, 600);

      // The room is one closed chain collider (ground, ceiling, both sides).
      this.add(
        new StaticChain2D(
          [
            [10, 10],
            [WIDTH - 10, 10],
            [WIDTH - 10, HEIGHT - 10],
            [10, HEIGHT - 10],
          ],
          { closed: true, thickness: 20 },
        ),
      );
      rect(this, WIDTH / 2, HEIGHT - 10, WIDTH, 20, [0.45, 0.52, 0.62, 1]);
      rect(this, WIDTH / 2, 10, WIDTH, 20, [0.45, 0.52, 0.62, 1]);
      rect(this, 10, HEIGHT / 2, 20, HEIGHT, [0.45, 0.52, 0.62, 1]);
      rect(this, WIDTH - 10, HEIGHT / 2, 20, HEIGHT, [0.45, 0.52, 0.62, 1]);

      // A thin static wall: 4 px thick, far narrower than one bullet step.
      const wall = rect(this, WALL_X, WALL_Y, 4, 140, [1, 0.85, 0.3, 1]);
      wall.collider = Colliders.box(1, 1);

      // One concave polygon becomes several convex static pieces.
      const cup = new StaticConcave2D([
        [0, 0],
        [12, 0],
        [12, 78],
        [68, 78],
        [68, 0],
        [80, 0],
        [80, 90],
        [0, 90],
      ]);
      cup.position.set(640, 330);
      this.add(cup);
      rect(this, 646, 369, 12, 78, [0.45, 0.62, 0.45, 1]);
      rect(this, 714, 369, 12, 78, [0.45, 0.62, 0.45, 1]);
      rect(this, 680, 414, 80, 12, [0.45, 0.62, 0.45, 1]);

      // A pendulum pinned to a fixed world point.
      const bob = ball(this, 270, 50, 16, [0.3, 0.85, 1, 1], 3);
      this.physics.addJoint(
        new RevoluteJoint({ bodyA: bob, anchor: [150, 50] }),
      );
      this.grabbable.push(bob);

      // A chain: revolute links with the first one pinned.
      let previous: Sprite | undefined;
      for (let i = 0; i < 6; i++) {
        const link = ball(
          this,
          330 + 18 * i + 9,
          50,
          7,
          [1, 0.5, 0.78, 1],
          0.5,
        );
        this.physics.addJoint(
          new RevoluteJoint({
            bodyA: link,
            bodyB: previous,
            anchor: [330 + 18 * i, 50],
          }),
        );
        this.grabbable.push(link);
        previous = link;
      }

      // A spring-like distance joint hanging a heavy box-sized ball.
      const weight = ball(this, 560, 160, 14, [1, 0.62, 0.2, 1], 4);
      this.physics.addJoint(
        new DistanceJoint({
          bodyA: weight,
          anchor: [560, 160],
          anchorB: [560, 60],
          length: 100,
          frequencyHz: 2,
        }),
      );
      this.grabbable.push(weight);
    }

    dropBalls(): void {
      for (let i = 0; i < 8; i++) {
        while (this.balls.length >= MAX_BALLS) this.balls.shift()!.destroy();
        const x = 665 + (i % 3) * 18 + (i % 2) * 4;
        const y = 40 + Math.floor(i / 3) * 26;
        const sprite = ball(this, x, y, BALL_RADIUS, [0.5, 1, 0.6, 1]);
        this.balls.push(sprite);
        this.grabbable.push(sprite);
      }
    }

    fire(): void {
      this.bullet?.destroy();
      const bullet = ball(this, 60, WALL_Y, 6, [1, 0.3, 0.3, 1], 1);
      const body = bullet.body!;
      body.ccd = ccd.checked;
      body.gravityScale = 0;
      body.restitution = 0;
      body.velocity.set(BULLET_SPEED, 0);
      this.bullet = bullet;
    }

    get sleeping(): number {
      return Array.from(new Set([...this.balls, ...this.grabbable])).filter(
        (sprite) => !sprite.destroyed && sprite.body?.isSleeping,
      ).length;
    }

    get bulletSide(): string {
      const bullet = this.bullet;
      if (!bullet || bullet.destroyed) return '—';
      return bullet.position.x < WALL_X ? 'blocked (left)' : 'tunneled (right)';
    }

    override update(): void {
      const pointer = runtime.input.pointer;
      const x = pointer.position.x;
      const y = pointer.position.y;
      if (pointer.wasPressed(0) && !this.grab) {
        const target = [...this.grabbable, ...this.balls].find(
          (sprite) =>
            !sprite.destroyed &&
            Math.hypot(sprite.position.x - x, sprite.position.y - y) < 22,
        );
        if (target)
          this.grab = this.physics.addJoint(
            new MouseJoint({
              body: target,
              target: [x, y],
              maxForce: (target.body?.mass ?? 1) * MAX_MOUSE_FORCE_PER_MASS,
            }),
          );
      }
      if (this.grab && pointer.isDown(0)) this.grab.setTarget(x, y);
      if (this.grab && !pointer.isDown(0)) {
        this.physics.removeJoint(this.grab);
        this.grab = undefined;
      }
      void debug?.refresh();
    }
  }

  let scene: Lab;
  const mount = async (): Promise<void> => {
    debug?.destroy();
    scene = new Lab();
    debug = await PhysicsDebugDraw2D.create(scene.physics, {
      region: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
    });
    debug.visible = debugToggle.checked;
    scene.add(debug.display);
    await runtime.setScene(scene);
  };

  debugToggle.addEventListener('change', () => {
    if (debug) debug.visible = debugToggle.checked;
  });
  $('fire').addEventListener('click', () => scene.fire());
  $('drop').addEventListener('click', () => scene.dropBalls());
  $('reset').addEventListener('click', () => void mount());

  await mount();
  runtime.start();
  const report = window.setInterval(() => {
    stats.textContent = `Joints: ${scene.physics.joints.length} · Balls: ${scene.balls.length} · Sleeping: ${scene.sleeping} · Bullet: ${scene.bulletSide}`;
  }, 100);
  status.textContent = `${runtime.graphics.backend} · joints, mouse drag, concave cup, chain room, CCD bullet, sleeping and debug overlay`;
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    window.clearInterval(report);
    release();
  });
} catch (error) {
  release();
  status.textContent = error instanceof Error ? error.message : String(error);
}

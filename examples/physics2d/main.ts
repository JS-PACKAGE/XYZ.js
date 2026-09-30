import {
  Colliders,
  Game,
  RigidBody2D,
  Scene,
  Sprite,
  Texture,
  Trigger2D,
  type ColorRGBA,
  type Collider2D,
  type RendererPreference,
  type RigidBodyOptions,
} from '../../src/index.js';

const WIDTH = 800;
const HEIGHT = 450;
const MAX_BODIES = 80;
const FLASH_SECONDS = 0.12;
const WHITE: ColorRGBA = [1, 1, 1, 1];

const $ = <T extends HTMLElement>(id: string): T =>
  document.querySelector<T>(`#${id}`)!;
const backend = $<HTMLSelectElement>('backend');
const shape = $<HTMLSelectElement>('shape');
const gravity = $<HTMLInputElement>('gravity');
const gravityValue = $<HTMLOutputElement>('gravity-value');
const stats = $<HTMLParagraphElement>('stats');
const status = $<HTMLParagraphElement>('status');

backend.value = new URLSearchParams(location.search).get('renderer') ?? 'auto';
backend.addEventListener('change', () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
});

interface BodyKind {
  readonly texture: Texture;
  readonly anchor: [number, number];
  readonly tint: ColorRGBA;
  readonly body: RigidBodyOptions;
  collider(): Collider2D;
}

/** A white canvas shape; Sprite.tint supplies the colour so a collision can flash it to white. */
async function shapeTexture(
  width: number,
  height: number,
  draw: (context: CanvasRenderingContext2D) => void,
): Promise<Texture> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#fff';
  draw(context);
  return Texture.fromImage(canvas);
}

let game: Game | undefined;
const textures: Texture[] = [];
const release = (): void => {
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

  const [pixel, disc, square, triangle] = await Promise.all([
    shapeTexture(1, 1, (c) => c.fillRect(0, 0, 1, 1)),
    shapeTexture(36, 36, (c) => {
      c.beginPath();
      c.arc(18, 18, 18, 0, Math.PI * 2);
      c.fill();
    }),
    shapeTexture(40, 40, (c) => c.fillRect(0, 0, 40, 40)),
    shapeTexture(40, 36, (c) => {
      c.beginPath();
      c.moveTo(20, 0);
      c.lineTo(40, 36);
      c.lineTo(0, 36);
      c.closePath();
      c.fill();
    }),
  ]);
  textures.push(pixel, disc, square, triangle);

  // Triangle sprite origin sits on its centroid (two thirds down) so it tumbles naturally.
  const kinds: readonly BodyKind[] = [
    {
      texture: disc,
      anchor: [0.5, 0.5],
      tint: [0.3, 0.85, 1, 1],
      body: { mass: 1, restitution: 0.8, friction: 0.1 },
      collider: () => Colliders.circle(18),
    },
    {
      texture: square,
      anchor: [0.5, 0.5],
      tint: [1, 0.62, 0.2, 1],
      body: { mass: 4, restitution: 0.15, friction: 0.8 },
      collider: () => Colliders.box(40, 40),
    },
    {
      texture: triangle,
      anchor: [0.5, 2 / 3],
      tint: [1, 0.5, 0.78, 1],
      body: { mass: 2, restitution: 0.45, friction: 0.4 },
      collider: () =>
        Colliders.polygon([
          [0, -24],
          [20, 12],
          [-20, 12],
        ]),
    },
  ];

  class Playground extends Scene {
    readonly dynamic = new Set<Sprite>();
    private readonly touching = new Map<Sprite, number>();
    collisionStarts = 0;
    triggerEntries = 0;

    constructor() {
      super();
      this.physics.gravity.set(0, Number(gravity.value));
      const wall = (x: number, y: number, w: number, h: number): Sprite => {
        const sprite = this.add(
          new Sprite({
            texture: pixel,
            position: [x, y],
            scale: [w, h],
            tint: [0.45, 0.52, 0.62, 1],
          }),
        );
        // A collider without a RigidBody2D is static.
        sprite.collider = Colliders.box(1, 1);
        return sprite;
      };
      wall(WIDTH / 2, HEIGHT - 10, WIDTH, 20);
      wall(10, HEIGHT / 2, 20, HEIGHT);
      wall(WIDTH - 10, HEIGHT / 2, 20, HEIGHT);
      wall(WIDTH / 2, 10, WIDTH, 20);
      const ramp = wall(250, 300, 280, 14);
      ramp.rotation = 0.35;

      const stripe = this.add(
        new Sprite({
          texture: pixel,
          position: [620, HEIGHT - 60],
          scale: [220, 40],
          tint: [0.2, 1, 0.5, 1],
          opacity: 0.25,
        }),
      );
      // Triggers are static sensors: they report enter/exit but never push bodies.
      const trigger = this.add(
        new Trigger2D(Colliders.box(220, 40), {
          repeat: Infinity,
          onEnter: () => {
            this.triggerEntries++;
            stripe.opacity = 0.7;
            this.timers.after(FLASH_SECONDS * 2, () => {
              stripe.opacity = 0.25;
            });
          },
        }),
      );
      trigger.position.set(620, HEIGHT - 60);
    }

    spawn(kind: BodyKind, x: number, y: number): void {
      if (this.dynamic.size >= MAX_BODIES) {
        const oldest = this.dynamic.values().next().value as Sprite;
        this.dynamic.delete(oldest);
        this.touching.delete(oldest);
        oldest.destroy();
      }
      const sprite = this.add(
        new Sprite({
          texture: kind.texture,
          position: [x, y],
          anchor: kind.anchor,
          tint: kind.tint,
        }),
      );
      sprite.collider = kind.collider();
      sprite.body = new RigidBody2D(kind.body);
      sprite.rotation = Math.random() * Math.PI;
      sprite.addEventListener('collisionstart', () => {
        this.collisionStarts++;
        this.touching.set(sprite, (this.touching.get(sprite) ?? 0) + 1);
        sprite.tint = WHITE;
        this.timers.after(FLASH_SECONDS, () => {
          if (!sprite.destroyed) sprite.tint = kind.tint;
        });
      });
      sprite.addEventListener('collisionend', () => {
        const count = (this.touching.get(sprite) ?? 1) - 1;
        if (count > 0) this.touching.set(sprite, count);
        else this.touching.delete(sprite);
      });
      this.dynamic.add(sprite);
    }

    get touchingBodies(): number {
      return this.touching.size;
    }

    override update(): void {
      const pointer = runtime.input.pointer;
      if (pointer.wasPressed(0))
        this.spawn(
          kinds[Number(shape.value)],
          pointer.position.x,
          pointer.position.y,
        );
    }
  }

  let scene = new Playground();
  const setGravity = (value: number): void => {
    gravity.value = String(value);
    gravityValue.textContent = String(value);
    scene.physics.gravity.set(0, value);
  };
  gravity.addEventListener('input', () => setGravity(Number(gravity.value)));
  $('zero').addEventListener('click', () => setGravity(0));
  $<HTMLButtonElement>('pause').addEventListener('click', (event) => {
    if (runtime.state === 'running') runtime.pause();
    else runtime.resume();
    (event.currentTarget as HTMLButtonElement).textContent =
      runtime.state === 'paused' ? 'Resume' : 'Pause';
  });
  $('reset').addEventListener('click', async () => {
    scene = new Playground();
    scene.physics.gravity.set(0, Number(gravity.value));
    await runtime.setScene(scene);
  });

  await runtime.setScene(scene);
  runtime.start();
  gravityValue.textContent = gravity.value;
  const report = window.setInterval(() => {
    stats.textContent = `Bodies: ${scene.dynamic.size} · Collision starts: ${scene.collisionStarts} · Touching bodies: ${scene.touchingBodies} · Trigger entries: ${scene.triggerEntries}`;
  }, 100);
  status.textContent = `${runtime.graphics.backend} · static walls + ramp, dynamic circle/box/polygon bodies, sensor trigger`;
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    window.clearInterval(report);
    release();
  });
} catch (error) {
  release();
  status.textContent = error instanceof Error ? error.message : String(error);
}

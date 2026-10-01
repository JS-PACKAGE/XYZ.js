import {
  AnimationClip,
  AnimationStateMachine,
  Game,
  Geometry,
  KeyframeTrack,
  Mesh,
  Scene,
  TextureMaterial,
  Timeline,
  Tween,
  type RendererPreference,
} from '../../src/index.js';

const $ = <T extends HTMLElement>(id: string): T =>
  document.querySelector<T>(`#${id}`)!;
const backend = $<HTMLSelectElement>('backend');
const speed = $<HTMLInputElement>('speed');
const status = $<HTMLParagraphElement>('status');
backend.value = new URLSearchParams(location.search).get('renderer') ?? 'auto';
backend.addEventListener('change', () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
});

let game: Game | undefined;
try {
  game = await Game.create({
    canvas: '#game',
    width: 800,
    height: 450,
    renderer: backend.value as RendererPreference,
  });
  if (!game.graphics.capabilities.threeD)
    throw new Error('This backend has no 3D capability.');
  const runtime = game;
  runtime.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });
  const texture = await runtime.assets.loadTexture(
    new URL('../sprite/texture.png', import.meta.url).href,
  );
  const material = new TextureMaterial({ texture });

  class Lab extends Scene {
    readonly cube = this.add(new Mesh({ geometry: Geometry.cube(), material }));
    readonly sphere = this.add(
      new Mesh({ geometry: Geometry.sphere(), material }),
    );
    readonly machine: AnimationStateMachine;

    constructor() {
      super();
      this.camera3D.position.set(0, 0.8, 6);
      this.sphere.position.set(0, -1.6, 0);
      this.sphere.scale.set(0.5, 0.5, 0.5);
      // y-axis quaternion (x, y, z, w) for a turn of `turns` quarter circles.
      const turn = (turns: number): number[] => [
        0,
        Math.sin((turns * Math.PI) / 4),
        0,
        Math.cos((turns * Math.PI) / 4),
      ];
      const idle = new AnimationClip('idle', [
        new KeyframeTrack(
          this.cube,
          'translation',
          [0, 1, 2],
          [0, 0, 0, 0, 0.12, 0, 0, 0, 0],
        ),
        new KeyframeTrack(
          this.cube,
          'rotation',
          [0, 2],
          [...turn(0), ...turn(0.0001)],
        ),
      ]);
      const run = new AnimationClip('run', [
        new KeyframeTrack(
          this.cube,
          'translation',
          [0, 0.5, 1, 1.5, 2],
          [-2, 0, 0, 0, 0.4, 0, 2, 0, 0, 0, 0.4, 0, -2, 0, 0],
        ),
        new KeyframeTrack(
          this.cube,
          'rotation',
          [0, 0.5, 1, 1.5, 2],
          [...turn(0), ...turn(1), ...turn(2), ...turn(3), ...turn(4)],
        ),
      ]);
      const jump = new AnimationClip('jump', [
        new KeyframeTrack(
          this.cube,
          'translation',
          [0, 0.4, 0.8],
          [0, 0, 0, 0, 2, 0, 0, 0, 0],
        ),
      ]);
      this.machine = new AnimationStateMachine(this.animations, {
        initial: 'idle',
        states: {
          idle: { clip: idle },
          run: { clip: run },
          jump: { clip: jump, loop: false },
        },
        parameters: { speed: 0 },
        triggers: ['jump'],
        transitions: [
          {
            from: 'idle',
            to: 'run',
            duration: 0.4,
            when: (p) => (p.speed as number) > 0.1,
          },
          {
            from: 'run',
            to: 'idle',
            duration: 0.4,
            when: (p) => (p.speed as number) <= 0.1,
          },
          { from: '*', to: 'jump', duration: 0.1, trigger: 'jump' },
          { from: 'jump', to: 'idle', duration: 0.2, exitTime: 1 },
        ],
      });
    }

    pulse(): void {
      const { sphere } = this;
      const timeline = new Timeline()
        .add(
          Tween.to(
            sphere,
            { 'scale.x': 1, 'scale.y': 1, 'scale.z': 1 },
            { duration: 0.4, easing: 'cubicOut' },
          ),
        )
        .add(Tween.to(sphere, { 'position.y': -0.6 }, { duration: 0.4 }), 0)
        .then(
          Tween.to(
            sphere,
            { 'scale.x': 0.5, 'scale.y': 0.5, 'scale.z': 0.5 },
            { duration: 0.6, easing: 'sineInOut' },
          ),
        )
        .add(Tween.to(sphere, { 'position.y': -1.6 }, { duration: 0.6 }), 0.4);
      this.tweens.add(timeline);
    }
  }

  const scene = new Lab();
  speed.addEventListener('input', () => {
    scene.machine.setParameter('speed', Number(speed.value));
    $('speed-value').textContent = Number(speed.value).toFixed(2);
  });
  $('jump').addEventListener('click', () => scene.machine.trigger('jump'));
  $('pulse').addEventListener('click', () => scene.pulse());
  await runtime.setScene(scene);
  runtime.start();
  const report = window.setInterval(() => {
    const action = scene.machine.action;
    $('state').textContent = [
      `state: ${scene.machine.current}  (${action.clip.name} at ${action.time.toFixed(2)} s, weight ${action.effectiveWeight.toFixed(2)})`,
      `cube x ${scene.cube.position.x.toFixed(2)}  y ${scene.cube.position.y.toFixed(2)}`,
      `sphere scale ${scene.sphere.scale.x.toFixed(2)}  y ${scene.sphere.position.y.toFixed(2)}  running tweens ${scene.tweens.size}`,
    ].join('\n');
  }, 100);
  status.textContent = `${runtime.graphics.backend} · AnimationStateMachine, cross-fade layering, Tween + Timeline`;
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    window.clearInterval(report);
    runtime.destroy();
  });
} catch (error) {
  game?.destroy();
  status.textContent = error instanceof Error ? error.message : String(error);
}

import {
  Actions,
  Easings,
  Game,
  Scene,
  Sprite,
  Texture,
  gamepadButtonIndex,
  type GamepadBinding,
  type GamepadButtonName,
  type RendererPreference,
} from '../../src/index.js';
import type { ActionBinding } from '../../src/index.js';

const WIDTH = 800;
const HEIGHT = 450;
const SPEED = 220;
const WATCHED_KEYS = [
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowLeft',
  'ArrowDown',
  'ArrowRight',
  'ShiftLeft',
  'Space',
] as const;
const DEFAULT_BINDINGS: Readonly<Record<string, readonly GamepadBinding[]>> = {
  left: [
    { key: 'KeyA' },
    { key: 'ArrowLeft' },
    { button: 'left' },
    { axis: 'leftX', direction: -1 },
  ],
  right: [
    { key: 'KeyD' },
    { key: 'ArrowRight' },
    { button: 'right' },
    { axis: 'leftX', direction: 1 },
  ],
  up: [
    { key: 'KeyW' },
    { key: 'ArrowUp' },
    { button: 'up' },
    { axis: 'leftY', direction: -1 },
  ],
  down: [
    { key: 'KeyS' },
    { key: 'ArrowDown' },
    { button: 'down' },
    { axis: 'leftY', direction: 1 },
  ],
  boost: [{ key: 'ShiftLeft' }, { button: 'a' }],
  fire: [{ key: 'Space' }, { button: 'x' }],
};

const $ = <T extends HTMLElement>(id: string): T =>
  document.querySelector<T>(`#${id}`)!;
const backend = $<HTMLSelectElement>('backend');
const rebindButton = $<HTMLButtonElement>('rebind');
const resetButton = $<HTMLButtonElement>('reset');
const status = $<HTMLParagraphElement>('status');

backend.value = new URLSearchParams(location.search).get('renderer') ?? 'auto';
backend.addEventListener('change', () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
});

const describe = (binding: ActionBinding): string => {
  if ('key' in binding) return binding.key;
  if ('button' in binding) return `pad ${binding.button}`;
  if ('axis' in binding)
    return `pad ${binding.axis}${binding.direction > 0 ? '+' : '-'}`;
  if ('pointerButton' in binding) return `pointer ${binding.pointerButton}`;
  if ('wheel' in binding)
    return `wheel ${binding.wheel}${binding.direction > 0 ? '+' : '-'}`;
  if ('gesture' in binding) return `gesture ${binding.gesture}`;
  return `virtual ${binding.virtual}${(binding.direction ?? 1) > 0 ? '+' : '-'}`;
};

let game: Game | undefined;
let disc: Texture | undefined;
const release = (): void => {
  game?.destroy();
  disc?.destroy();
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
  const { actions, gamepad, keyboard, pointer } = runtime.input;
  const reset = (): void => actions.import(DEFAULT_BINDINGS);
  reset();

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#fff';
  context.beginPath();
  context.arc(16, 16, 16, 0, Math.PI * 2);
  context.fill();
  disc = await Texture.fromImage(canvas);
  const texture = disc;

  class Playground extends Scene {
    readonly player = this.add(
      new Sprite({
        texture,
        position: [WIDTH / 2, HEIGHT / 2],
        scale: [1.2, 1.2],
        tint: [1, 0.82, 0.29, 1],
      }),
    );
    readonly crosshair = this.add(
      new Sprite({
        texture,
        scale: [0.5, 0.5],
        tint: [0.5, 0.9, 1, 0.8],
        zIndex: 5,
      }),
    );
    shots = 0;
    /** wasPressed() is true for one frame only, so count edges to make them readable. */
    readonly presses: Record<string, number> = {};

    private ring(x: number, y: number, tint: [number, number, number, number]) {
      const ring = this.add(
        new Sprite({ texture, position: [x, y], scale: [0.5, 0.5], tint }),
      );
      ring.actions.run(
        Actions.sequence(
          Actions.parallel(
            Actions.scaleTo(4, 4, 0.5, Easings.cubicOut),
            Actions.fadeTo(0, 0.5),
          ),
          Actions.call(() => ring.destroy()),
        ),
      );
    }

    override update(dt: number): void {
      for (const name of Object.keys(DEFAULT_BINDINGS))
        if (actions.wasPressed(name))
          this.presses[name] = (this.presses[name] ?? 0) + 1;
      const x = actions.value('right') - actions.value('left');
      const y = actions.value('down') - actions.value('up');
      const speed = SPEED * (actions.isDown('boost') ? 2 : 1);
      const { position } = this.player;
      position.set(
        Math.min(WIDTH, Math.max(0, position.x + x * speed * dt)),
        Math.min(HEIGHT, Math.max(0, position.y + y * speed * dt)),
      );
      if (actions.wasPressed('fire')) {
        this.shots++;
        this.ring(position.x, position.y, [1, 0.5, 0.3, 1]);
      }
      if (pointer.active) {
        this.crosshair.position.set(pointer.position.x, pointer.position.y);
        this.crosshair.opacity = pointer.isDown(0) ? 1 : 0.6;
      }
      if (pointer.wasPressed(0))
        this.ring(pointer.position.x, pointer.position.y, [0.5, 0.9, 1, 1]);
    }
  }

  const scene = new Playground();
  await runtime.setScene(scene);
  runtime.start();

  let rebinding = false;

  rebindButton.disabled = resetButton.disabled = false;
  resetButton.addEventListener('click', () => {
    reset();
    rebinding = false;
    rebindButton.textContent = 'Rebind Fire…';
  });
  rebindButton.addEventListener('click', () => {
    rebinding = true;
    rebindButton.textContent = 'Press a key or pad button…';
  });
  // Rebinding listens for the raw DOM key code; everything else goes through the engine.
  window.addEventListener(
    'keydown',
    (event) => {
      if (!rebinding) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      rebinding = false;
      actions.rebind('fire', [{ key: event.code }, { button: 'x' }]);
      rebindButton.textContent = 'Rebind Fire…';
    },
    true,
  );

  const gestureLog: string[] = [];
  for (const type of [
    'tap',
    'doubletap',
    'longpress',
    'swipe',
    'pan',
    'pinch',
    'rotate',
  ] as const)
    runtime.input.gestures.on(type, (detail) => {
      // Pan/pinch/rotate report every change; log only their boundaries.
      if (detail.phase === 'change') return;
      const extra =
        detail.type === 'swipe'
          ? ` ${detail.direction}`
          : detail.type === 'pinch'
            ? ` ×${detail.scale.toFixed(2)}`
            : detail.type === 'rotate'
              ? ` ${detail.rotation.toFixed(2)} rad`
              : detail.type === 'pan'
                ? ` Δ${detail.translation.x.toFixed(0)},${detail.translation.y.toFixed(0)}`
                : '';
      gestureLog.push(`${detail.type}:${detail.phase}${extra}`);
      if (gestureLog.length > 8) gestureLog.shift();
      $('gestures').textContent = gestureLog.join('\n');
    });
  const rumbleButton = $<HTMLButtonElement>('rumble');
  rumbleButton.disabled = false;
  rumbleButton.addEventListener('click', async () => {
    const played = await gamepad.rumble({
      duration: 400,
      strong: 0.8,
      weak: 0.4,
    });
    status.textContent = played
      ? 'Rumble completed.'
      : gamepad.connected
        ? 'This pad or browser has no usable rumble actuator.'
        : 'Connect a standard-mapping gamepad first.';
  });
  const padButtons = Object.keys(gamepadButtonIndex) as GamepadButtonName[];
  const report = window.setInterval(() => {
    if (rebinding) {
      const pressed = gamepad.firstPressed();
      if (pressed) {
        actions.rebind('fire', [{ key: 'Space' }, { button: pressed }]);
        rebinding = false;
        rebindButton.textContent = 'Rebind Fire…';
      }
    }
    $('keyboard').textContent = WATCHED_KEYS.map(
      (code) => `${keyboard.isDown(code) ? '■' : '□'} ${code}`,
    ).join('\n');
    $('pointer').textContent = [
      `position  ${pointer.position.x.toFixed(0)}, ${pointer.position.y.toFixed(0)}`,
      `over canvas ${pointer.active}`,
      `left ${pointer.isDown(0)}  middle ${pointer.isDown(1)}  right ${pointer.isDown(2)}`,
      `active pointers ${pointer.activePointers.size}`,
    ].join('\n');
    $('gamepad').textContent = gamepad.connected
      ? [
          `#${gamepad.index} ${gamepad.id}`,
          `left  ${gamepad.stick('left').x.toFixed(2)}, ${gamepad.stick('left').y.toFixed(2)}`,
          `right ${gamepad.stick('right').x.toFixed(2)}, ${gamepad.stick('right').y.toFixed(2)}`,
          `down: ${padButtons.filter((name) => gamepad.isDown(name)).join(' ') || '—'}`,
        ].join('\n')
      : 'No standard-mapping gamepad connected.\nConnect one and press any button; browsers only expose pads after input.';
    $('actions').textContent = [
      ...Object.keys(DEFAULT_BINDINGS).map(
        (name) =>
          `${name.padEnd(6)} ${actions.value(name).toFixed(2)} ${actions.isDown(name) ? 'down' : '    '} ×${scene.presses[name] ?? 0}  ${actions
            .bindings(name)
            .map(describe)
            .join(', ')}`,
      ),
      `shots fired: ${scene.shots}`,
    ].join('\n');
  }, 50);

  status.textContent = `${runtime.graphics.backend} · Keyboard / Pointer / GamepadState polling and runtime-rebindable ActionMap`;
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    window.clearInterval(report);
    release();
  });
} catch (error) {
  release();
  status.textContent = error instanceof Error ? error.message : String(error);
}

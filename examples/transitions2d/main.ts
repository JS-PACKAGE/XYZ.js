import {
  Actions,
  Easings,
  Game,
  Primitive2D,
  Scene,
  Text2D,
  type RendererPreference,
  type TransitionOptions,
} from '../../src/index.js';

const WIDTH = 800;
const HEIGHT = 450;

const $ = <T extends HTMLElement>(id: string): T =>
  document.querySelector<T>(`#${id}`)!;
const backend = $<HTMLSelectElement>('backend');
const kind = $<HTMLSelectElement>('kind');
const direction = $<HTMLSelectElement>('direction');
const easing = $<HTMLSelectElement>('easing');
const duration = $<HTMLInputElement>('duration');
const block = $<HTMLInputElement>('block');
const next = $<HTMLButtonElement>('next');
const pause = $<HTMLButtonElement>('pause');
const log = $<HTMLParagraphElement>('log');
const status = $<HTMLParagraphElement>('status');

backend.value = new URLSearchParams(location.search).get('renderer') ?? 'auto';
backend.addEventListener('change', () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
});
for (const name of Object.keys(Easings)) easing.add(new Option(name, name));
easing.value = 'sineInOut';
duration.addEventListener('input', () => {
  $('duration-value').textContent = Number(duration.value).toFixed(1);
});

let game: Game | undefined;
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

  const names = ['A', 'B', 'C'] as const;
  const backgrounds = ['#27508a', '#7a3a66', '#2f7a5a'] as const;
  const accents = ['#ffd24a', '#7ae0ff', '#ffb86b'] as const;

  /** Every scene motion differs so it is obvious which one is simulating. */
  class Panel extends Scene {
    private spinner: Primitive2D | undefined;
    private seconds = 0;
    private clock: Text2D | undefined;
    constructor(readonly index: number) {
      super();
    }

    protected override async initialize(
      _game: Game,
      signal: AbortSignal,
    ): Promise<void> {
      const background = await Primitive2D.rectangle(
        WIDTH,
        HEIGHT,
        backgrounds[this.index],
      );
      background.position.set(WIDTH / 2, HEIGHT / 2);
      this.add(background);
      const title = await Text2D.create(`Scene ${names[this.index]}`, {
        fontSize: 56,
        fontWeight: 'bold',
        color: '#ffffff',
        resolution: 2,
      });
      title.position.set(WIDTH / 2, 90);
      this.add(title);
      this.clock = await Text2D.create('0 s alive', {
        fontSize: 22,
        color: '#ffffff',
        resolution: 2,
      });
      this.clock.position.set(WIDTH / 2, 150);
      this.add(this.clock);
      const shape = await Primitive2D.rectangle(70, 70, accents[this.index]);
      shape.position.set(WIDTH / 2, 290);
      this.spinner = this.add(shape);
      signal.throwIfAborted();
      if (this.index === 0)
        // A: back-and-forth slide driven by the Actions queue.
        shape.actions.run(
          Actions.repeatForever(
            Actions.sequence(
              Actions.moveTo(WIDTH / 2 + 200, 290, 1.2, Easings.sineInOut),
              Actions.moveTo(WIDTH / 2 - 200, 290, 1.2, Easings.sineInOut),
            ),
          ),
        );
      if (this.index === 2)
        // C: pulsing scale driven by Actions too, plus the rotation below.
        shape.actions.run(
          Actions.repeatForever(
            Actions.sequence(
              Actions.scaleTo(1.8, 1.8, 0.8, Easings.quadInOut),
              Actions.scaleTo(0.6, 0.6, 0.8, Easings.quadInOut),
            ),
          ),
        );
      // Scene timers use simulation seconds, so a paused game or a frozen outgoing scene stops counting.
      this.timers.every(1, () => {
        this.seconds++;
        void this.clock?.setText(`${this.seconds} s alive`);
      });
    }

    override update(dt: number): void {
      if (this.spinner && this.index !== 0)
        this.spinner.rotation += dt * (this.index === 1 ? 3 : 1);
    }
  }

  let current = 0;
  const transitionOptions = (): TransitionOptions => ({
    kind: kind.value as TransitionOptions['kind'],
    duration: Number(duration.value),
    easing: Easings[easing.value as keyof typeof Easings],
    direction: direction.value as TransitionOptions['direction'],
    color: [0.03, 0.05, 0.1, 1],
    blockInput: block.checked,
  });
  for (const type of [
    'transitionstart',
    'transitioncomplete',
    'transitioncancel',
  ])
    runtime.addEventListener(type, () => {
      log.textContent = `Scene: ${names[current]} · last event: ${type}`;
    });

  next.addEventListener('click', () => {
    current = (current + 1) % names.length;
    const target = current;
    const options = transitionOptions();
    runtime
      .setScene(new Panel(target), { transition: options })
      .then(() => {
        if (current === target)
          log.textContent = `Scene: ${names[target]} · ${options.kind} finished (${options.duration.toFixed(1)}s)`;
      })
      .catch((error: unknown) => {
        // A newer setScene() rejects the superseded request; that is expected here.
        const message = error instanceof Error ? error.message : String(error);
        log.textContent = /cancel/i.test(message)
          ? `Scene: ${names[current]} · previous request superseded`
          : message;
      });
  });
  pause.addEventListener('click', () => {
    if (runtime.state === 'running') runtime.pause();
    else runtime.resume();
    pause.textContent = runtime.state === 'paused' ? 'Resume' : 'Pause';
  });

  await runtime.setScene(new Panel(0));
  runtime.start();
  next.disabled = pause.disabled = false;
  status.textContent = `${runtime.graphics.backend} · whole-frame fade / crossfade / slide between three Scenes`;
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) game?.destroy();
  });
} catch (error) {
  game?.destroy();
  status.textContent = error instanceof Error ? error.message : String(error);
}

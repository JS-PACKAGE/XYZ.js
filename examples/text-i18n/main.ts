import {
  Game,
  Scene,
  UIRoot,
  UITextInput,
  Text2D,
  graphemeBoundaries,
  type RendererPreference,
  type Text2DOptions,
} from '../../src/index.js';
const get = <T extends HTMLElement>(id: string): T =>
  document.querySelector<T>(`#${id}`)!;
const backend = get<HTMLSelectElement>('backend');
const status = get<HTMLParagraphElement>('status');
backend.value = new URLSearchParams(location.search).get('renderer') ?? 'auto';
backend.addEventListener('change', () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
});
const presets: Record<string, string> = {
  mixed: 'ABC אבג DEF مرحبا 世界 👩🏽‍🚀 e\u0301',
  rtl: 'שלום עולם — مرحبا بالعالم 123 ABC',
  clusters: '日本語 中文 한글 👨‍👩‍👧‍👦 👩🏽‍🚀 🇹🇼 e\u0301',
};
let game: Game | undefined;
let timer: number | undefined;
const events = new AbortController();
let ownedFont: FontFace | undefined;
const fail = (error: unknown): void => {
  status.textContent = error instanceof Error ? error.message : String(error);
};
const release = (): void => {
  events.abort();
  clearInterval(timer);
  game?.destroy();
  if (ownedFont) document.fonts.delete(ownedFont);
};
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) release();
});
try {
  game = await Game.create({
    canvas: '#game',
    width: 900,
    height: 330,
    renderer: backend.value as RendererPreference,
  });
  const runtime = game;
  runtime.addEventListener('error', (event) =>
    fail((event as CustomEvent<Error>).detail),
  );
  const scene = new Scene();
  const root = scene.add(
    new UIRoot(runtime, {
      direction: 'column',
      padding: 28,
      gap: 16,
      align: 'start',
    }),
  );
  const field = root.add(
    await UITextInput.create({
      label: 'International text editor',
      value: presets.mixed,
      layout: { width: 820, height: 74 },
      textStyle: {
        fontSize: 28,
        color: '#eef5ff',
        direction: 'auto',
        fontFallback: 'sans-serif',
      },
    }),
  );
  const preview = scene.add(
    await Text2D.create(presets.mixed!, {
      fontSize: 28,
      color: '#9ce8d8',
      wrapWidth: 820,
      direction: 'auto',
    }),
  );
  preview.anchor.set(0, 0);
  preview.position.set(28, 145);
  preview.space = 'screen';
  field.addEventListener('error', (event) =>
    fail((event as CustomEvent<Error>).detail),
  );
  const syncPreview = async (): Promise<void> => {
    await preview.setText(field.value);
  };
  field.addEventListener('input', () => {
    void syncPreview().catch(fail);
  });
  await runtime.setScene(scene);
  runtime.start();
  const on = (
    id: string,
    type: string,
    action: () => void | Promise<void>,
  ): void => {
    get(id).addEventListener(
      type,
      () => {
        try {
          Promise.resolve(action()).catch(fail);
        } catch (error) {
          fail(error);
        }
      },
      { signal: events.signal },
    );
  };
  const focus = (): void => {
    root.focus.focus(field);
  };
  const reset = async (): Promise<void> => {
    await field.setValue(presets[get<HTMLSelectElement>('preset').value]!);
    await syncPreview();
    field.setSelectionRange(0, 0);
    focus();
  };
  on('focus', 'click', focus);
  on('all', 'click', () => {
    focus();
    field.setSelectionRange(0, field.value.length);
  });
  on('reset', 'click', reset);
  on('preset', 'change', reset);
  for (const [id, delta] of [
    ['previous', -1],
    ['next', 1],
  ] as const)
    on(id, 'click', () => {
      const boundaries = graphemeBoundaries(field.value);
      const current = field.selectionEnd;
      const target =
        delta < 0
          ? ([...boundaries].reverse().find((index) => index < current) ?? 0)
          : (boundaries.find((index) => index > current) ?? field.value.length);
      focus();
      field.setSelectionRange(
        target,
        target,
        'none',
        delta < 0 ? 'upstream' : 'downstream',
      );
    });
  on('bidi', 'click', async () => {
    get<HTMLSelectElement>('preset').value = 'mixed';
    get<HTMLSelectElement>('direction').value = 'auto';
    await style();
    await field.setValue(presets.mixed!);
    await syncPreview();
    focus();
    field.setSelectionRange(0, 5);
  });
  const style = async (): Promise<void> => {
    const abel = get<HTMLSelectElement>('font').value === 'abel';
    if (abel && !ownedFont) {
      const font = new FontFace(
        'ExampleAbel',
        `url(${new URL('../rendering2d/assets/Abel-Regular.ttf', import.meta.url).href})`,
      );
      await font.load();
      if (events.signal.aborted) return;
      ownedFont = font;
      document.fonts.add(font);
    }
    const options: Text2DOptions = {
      fontSize: Number(get<HTMLInputElement>('size').value),
      direction: get<HTMLSelectElement>('direction').value as
        'auto' | 'ltr' | 'rtl',
      fontFamily: abel ? 'ExampleAbel' : 'sans-serif',
      fontFallback: 'sans-serif',
      fontReadiness: 'wait',
    };
    field.setLayout({
      width: Number(get<HTMLInputElement>('width').value),
      height: 74,
    });
    await field.setTextStyle(options);
    await preview.setStyle({
      ...options,
      wrapWidth: Number(get<HTMLInputElement>('width').value),
    });
  };
  for (const id of ['direction', 'font', 'width', 'size'])
    on(id, 'change', style);
  on('destroy', 'click', () => {
    release();
    status.textContent =
      'Destroyed · native editing surface and textures released';
  });
  timer = window.setInterval(() => {
    const geometry = field.selectionGeometry;
    const bounds = graphemeBoundaries(field.value);
    get('metrics').textContent =
      `Logical UTF-16: ${field.value.length} · graphemes: ${bounds.length - 1}\nBoundary offsets: ${bounds.join(', ')}\nSelection: [${field.selectionStart}, ${field.selectionEnd}] ${field.selectionDirection} · composing: ${field.isComposing}\nVisual caret: UTF-16 ${geometry.caret.index}, x=${geometry.caret.x.toFixed(2)}, ${geometry.caret.affinity}\nDisjoint selection rectangles: ${geometry.rectangles.length}\n${geometry.rectangles.map((rect) => `x=${rect.x.toFixed(1)} width=${rect.width.toFixed(1)}`).join(' | ')}\nLogical value: ${JSON.stringify(field.value)}`;
  }, 100);
  status.textContent = `${runtime.graphics.backend} · UITextInput + Text2D · single-line native editing / wrapped preview`;
} catch (error) {
  release();
  fail(error);
}

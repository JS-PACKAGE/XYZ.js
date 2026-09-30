import {
  Game,
  Scene,
  ScreenElement,
  NineSlice,
  SpriteFont,
  SpriteSheet,
  SpriteText,
  Text2D,
  Texture,
  type ColorRGBA,
  type RendererPreference,
  type Text2DOptions,
} from '../../src/index.js';

const WHITE: ColorRGBA = [1, 1, 1, 1];
const MINT: ColorRGBA = [0.72, 1, 0.91, 1];
const AMBER: ColorRGBA = [1, 0.73, 0.42, 1];
const GOLD: ColorRGBA = [1, 0.87, 0.55, 1];
const TEAL: ColorRGBA = [0.5, 0.9, 0.76, 1];

const status = document.querySelector<HTMLParagraphElement>('#status')!;
const readout = document.querySelector<HTMLParagraphElement>('#readout')!;
const backend = document.querySelector<HTMLSelectElement>('#backend')!;
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
    width: 900,
    height: 500,
    renderer: backend.value as RendererPreference,
  });
  const runtime = game;
  const fail = (error: unknown): void => {
    status.textContent = error instanceof Error ? error.message : String(error);
  };
  runtime.addEventListener('error', (event) => {
    fail((event as CustomEvent<Error>).detail);
  });
  class UI extends Scene {
    private readonly textures: Texture[] = [];
    private readonly listeners = new AbortController();
    private readonly hud = this.add(new ScreenElement());
    private readonly right = this.hud.add(new ScreenElement());
    private readonly bottom = this.hud.add(new ScreenElement());
    private counter: SpriteText | undefined;
    private clicks = 0;
    private buttonState = 'idle';
    private expanded = false;
    private phase = 0;
    private panning = false;
    private async label(
      add: (label: Text2D) => Text2D,
      signal: AbortSignal,
      value: string,
      x: number,
      y: number,
      options: Text2DOptions = {},
    ): Promise<Text2D> {
      const label = await Text2D.create(value, {
        fontSize: 18,
        color: '#d9edff',
        resolution: 2,
        ...options,
      });
      if (signal.aborted) {
        label.destroy();
        signal.throwIfAborted();
      }
      label.anchor.set(0, 0);
      label.position.set(x, y);
      return add(label);
    }
    protected override async initialize(
      _game: Game,
      signal: AbortSignal,
    ): Promise<void> {
      const panelCanvas = document.createElement('canvas');
      panelCanvas.width = panelCanvas.height = 24;
      const panelContext = panelCanvas.getContext('2d')!;
      panelContext.fillStyle = '#6cbbda';
      panelContext.fillRect(0, 0, 24, 24);
      panelContext.fillStyle = '#1e3c5b';
      panelContext.fillRect(4, 4, 16, 16);
      panelContext.fillStyle = '#ffd67a';
      for (const [x, y] of [
        [0, 0],
        [20, 0],
        [0, 20],
        [20, 20],
      ]) {
        panelContext.fillRect(x, y, 4, 4);
      }
      const panelTexture = await Texture.fromImage(panelCanvas);
      if (signal.aborted) {
        panelTexture.destroy();
        signal.throwIfAborted();
      }
      this.textures.push(panelTexture);
      const panel = (width: number, height: number): NineSlice =>
        new NineSlice(panelTexture, {
          left: 4,
          right: 4,
          top: 4,
          bottom: 4,
          width,
          height,
        });
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 :.-';
      const atlas = document.createElement('canvas');
      atlas.width = alphabet.length * 18;
      atlas.height = 26;
      const context = atlas.getContext('2d')!;
      context.font = 'bold 20px monospace';
      context.fillStyle = '#ffd67a';
      context.textBaseline = 'top';
      Array.from(alphabet).forEach((glyph, index) => {
        context.fillText(glyph, index * 18 + 1, 2);
      });
      const fontTexture = await Texture.fromImage(atlas);
      if (signal.aborted) {
        fontTexture.destroy();
        signal.throwIfAborted();
      }
      this.textures.push(fontTexture);
      const font = new SpriteFont(
        SpriteSheet.grid(fontTexture, { frameWidth: 18, frameHeight: 26 }),
        { alphabet, advance: 17, lineHeight: 28 },
      );
      for (const [x, y, width, height] of [
        [30, 155, 245, 105],
        [305, 155, 245, 105],
        [580, 155, 290, 105],
      ]) {
        this.add(panel(width, height)).position.set(x, y);
      }
      await this.label(
        (label) => this.add(label),
        signal,
        'WORLD TEXT · Camera2D pans this layer',
        30,
        95,
        {
          fontSize: 26,
          fontWeight: 'bold',
          stroke: { color: '#102338', width: 2 },
          shadow: { color: '#000a', blur: 4, offsetX: 2, offsetY: 3 },
        },
      );
      const alignments = ['left', 'center', 'right'] as const;
      for (const [index, align] of alignments.entries()) {
        await this.label(
          (label) => this.add(label),
          signal,
          `${align.toUpperCase()} ALIGNED\nText2D wraps text\nwith styled lines`,
          42 + index * 275,
          170,
          {
            wrapWidth: index === 2 ? 266 : 220,
            align,
            fontStyle: index === 2 ? 'italic' : 'normal',
            color: index === 1 ? '#ffd67a' : '#d9edff',
          },
        );
      }
      const bitmap = this.add(
        new SpriteText(
          font,
          'SPRITEFONT ATLAS\nREUSED GLYPHS - NO TEXT RASTER ON CLICK',
          { lineSpacing: 5 },
        ),
      );
      bitmap.position.set(30, 290);
      for (const [x, width, height] of [
        [30, 105, 45],
        [160, 240, 65],
        [425, 445, 90],
      ]) {
        this.add(panel(width, height)).position.set(x, 365);
      }
      await this.label(
        (label) => this.add(label),
        signal,
        'Same source, 4px corners',
        170,
        380,
        { fontSize: 16 },
      );
      await this.label(
        (label) => this.hud.add(label),
        signal,
        'SCREEN HUD',
        20,
        16,
        { fontWeight: 'bold', color: '#80e5c2' },
      );
      this.counter = this.right.add(new SpriteText(font, 'CLICKS: 0'));
      this.counter.position.set(-200, 16);
      await this.label(
        (label) => this.bottom.add(label),
        signal,
        'Fixed bottom edge · Tab / Enter / Space',
        20,
        -33,
        { fontSize: 16, color: '#80e5c2' },
      );
      const button = async (
        title: string,
        x: number,
        activate: () => void,
      ): Promise<void> => {
        const frame = this.hud.add(panel(175, 46));
        frame.position.set(x, 47);
        frame.pointerEnabled = true;
        frame.interactiveChildren = false;
        frame.cursor = 'pointer';
        frame.accessibility = { role: 'button', label: title, tabIndex: 0 };
        await this.label(
          (label) => this.hud.add(label),
          signal,
          title,
          x + 14,
          58,
          { fontSize: 18 },
        );
        const state = (name: string, color: ColorRGBA): void => {
          this.buttonState = `${title}: ${name}`;
          frame.tint = color;
          this.refresh();
        };
        frame.addEventListener('pointerenter', () => state('hover', MINT));
        frame.addEventListener('pointerleave', () => state('idle', WHITE));
        frame.addEventListener('pointerdown', () => state('pressed', AMBER));
        frame.addEventListener('pointerup', () => state('hover', MINT));
        frame.addEventListener('pointerupoutside', () => state('idle', WHITE));
        frame.addEventListener('pointercancel', () => state('idle', WHITE));
        frame.addEventListener('focus', () => state('focused', GOLD));
        frame.addEventListener('blur', () => state('idle', WHITE));
        const click = (): void => {
          activate();
          state('clicked', TEAL);
        };
        frame.addEventListener('pointertap', click);
        frame.addEventListener('activate', click);
      };
      await button('Count click', 20, () => {
        this.clicks++;
        this.counter?.setText(`CLICKS: ${this.clicks}`);
      });
      const resizePanel = this.add(panel(445, 90));
      resizePanel.position.set(425, 365);
      await button('Resize panel', 210, () => {
        this.expanded = !this.expanded;
        resizePanel.resize(this.expanded ? 280 : 445, this.expanded ? 50 : 90);
      });
      document.querySelector('#pan')!.addEventListener(
        'click',
        () => {
          this.panning = !this.panning;
          document.querySelector('#pan')!.textContent = this.panning
            ? 'Stop camera'
            : 'Pan camera';
        },
        { signal: this.listeners.signal },
      );
      runtime.canvas.addEventListener(
        'keydown',
        (event) => {
          if (event.code.startsWith('Arrow')) event.preventDefault();
        },
        { signal: this.listeners.signal },
      );
      this.refresh();
    }
    private refresh(): void {
      readout.textContent = `Clicks: ${this.clicks} · Button: ${this.buttonState} · Camera: ${this.camera2D.position.x.toFixed(0)}, ${this.camera2D.position.y.toFixed(0)}`;
    }
    override update(dt: number): void {
      const keyboard = runtime.input.keyboard;
      this.phase += dt;
      if (this.panning) {
        this.camera2D.position.set(
          Math.sin(this.phase) * 55,
          Math.cos(this.phase * 0.7) * 18,
        );
      } else {
        this.camera2D.position.x +=
          ((keyboard.isDown('ArrowRight') ? 1 : 0) -
            (keyboard.isDown('ArrowLeft') ? 1 : 0)) *
          dt *
          100;
        this.camera2D.position.y +=
          ((keyboard.isDown('ArrowDown') ? 1 : 0) -
            (keyboard.isDown('ArrowUp') ? 1 : 0)) *
          dt *
          100;
      }
      this.right.position.x = runtime.width;
      this.bottom.position.y = runtime.height;
      this.refresh();
    }
    protected override onDestroy(): void {
      this.listeners.abort();
      for (const texture of this.textures) texture.destroy();
    }
  }
  await runtime.setScene(new UI());
  runtime.start();
  status.textContent = `${runtime.graphics.backend} · Text2D / SpriteText / NineSlice · Accessible screen-space buttons`;
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) game?.destroy();
  });
} catch (error) {
  game?.destroy();
  status.textContent = error instanceof Error ? error.message : String(error);
}

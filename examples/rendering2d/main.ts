import {
  AlphaFilter2D,
  AssetLoader,
  AssetManifest,
  AtlasLoader,
  BlurFilter2D,
  CanvasTexture2D,
  ColorMatrixFilter2D,
  DisplacementFilter2D,
  Easings,
  FrameAnimation,
  Game,
  Graphics2D,
  GraphicsPath2D,
  HitArea2D,
  IsolatedGroup2D,
  Mask2D,
  NineSlice,
  NoiseFilter2D,
  ParticleLayer2D,
  PerspectiveQuad2D,
  Scene,
  Sprite,
  SpriteFont,
  SpriteText,
  Text2D,
  TilingSprite2D,
  generateBitmapFont,
  type AtlasAsset,
  type BitmapFontAsset,
  type BlendMode2D,
  type Filter2D,
  type FontAsset,
  type RenderTexture2D,
  type RendererPreference,
  type Texture,
} from '../../src/index.js';
import {
  createRenderingFixtures,
  webFontFixture,
  type RenderingFixtures,
} from './fixtures.js';

const text = (id: string, value: string): void => {
  document.querySelector(`#${id}`)!.textContent = value;
};
const backend = document.querySelector<HTMLSelectElement>('#backend')!;
const selected =
  new URLSearchParams(location.search).get('renderer') ?? 'webgpu';
if (['webgpu', 'webgl2', 'canvas2d', 'auto'].includes(selected))
  backend.value = selected;
const listeners = new AbortController();
backend.addEventListener(
  'change',
  () => {
    location.search = `renderer=${backend.value}`;
  },
  { signal: listeners.signal },
);

let game: Game | undefined;
let fixtures: RenderingFixtures | undefined;
let manifest: AssetManifest | undefined;
let loader: AssetLoader | undefined;
let released = false;
const owned: { destroy(): void }[] = [];

function cleanup(): void {
  if (released) return;
  released = true;
  listeners.abort();
  try {
    game?.destroy();
  } finally {
    // Scenes are gone; only now may owned acquisitions be released.
    try {
      manifest?.unload(['assets'], { borrowersRemoved: true });
    } finally {
      for (const asset of owned) asset.destroy();
      loader?.destroy();
      fixtures?.dispose();
    }
  }
}
addEventListener(
  'pagehide',
  (event) => {
    if (!event.persisted) cleanup();
  },
  { signal: listeners.signal },
);
function report(error: unknown): void {
  if (!released)
    text(
      'status',
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error),
    );
}

interface Assets {
  atlas: AtlasAsset;
  pattern: Texture;
  maskImage: Texture;
  font: FontAsset;
  bitmap: BitmapFontAsset;
}

/** Objects that the page buttons mutate; rebuilt for every published Scene. */
interface Handles {
  scene: Scene;
  atlasSprite: Sprite;
  animation: FrameAnimation;
  graphics: Graphics2D;
  canvasSprite: Sprite;
  cache: IsolatedGroup2D;
  cacheChild: Sprite;
  mesh: PerspectiveQuad2D | undefined;
  title: Text2D;
  spriteText: SpriteText;
  particles: ParticleLayer2D;
  captureView: Sprite;
  background: TilingSprite2D;
}

try {
  fixtures = await createRenderingFixtures();
  if (released) throw new Error('Example was disposed during initialization.');
  loader = new AssetLoader();
  const atlasLoader = new AtlasLoader();
  manifest = new AssetManifest({
    entries: [
      {
        aliases: 'pattern',
        type: 'texture',
        url: fixtures.patternUrl,
        owned: true,
      },
      {
        aliases: 'maskImage',
        type: 'texture',
        url: fixtures.maskUrl,
        owned: true,
      },
      {
        aliases: 'font',
        type: 'font',
        url: webFontFixture.url,
        options: { family: webFontFixture.family },
      },
      {
        aliases: 'bitmap',
        type: 'bitmapFont',
        url: fixtures.fontTextUrl,
        format: 'text',
      },
      {
        aliases: 'atlas',
        type: 'custom',
        owned: true,
        load: (signal) => atlasLoader.load(fixtures!.atlasJsonUrl, { signal }),
        dispose: (value) => (value as AtlasAsset).destroy(),
      },
    ],
    bundles: { assets: ['pattern', 'maskImage', 'font', 'bitmap', 'atlas'] },
  });
  const batch = manifest.compile(loader, ['assets']);
  batch.addEventListener('progress', () =>
    text(
      'loading',
      `Typed manifest loading ${batch.progress.completed}/${batch.progress.total}`,
    ),
  );
  await batch.load();
  if (released) throw new Error('Example was disposed during asset loading.');
  text(
    'loading',
    'Typed manifest ready: atlas, patterns, mask, FontFace and multipage BMFont are owned by the manifest.',
  );
  const assets: Assets = {
    atlas: manifest.get('atlas', 'custom') as AtlasAsset,
    pattern: manifest.get('pattern', 'texture'),
    maskImage: manifest.get('maskImage', 'texture'),
    font: manifest.get('font', 'font'),
    bitmap: manifest.get('bitmap', 'bitmapFont'),
  };
  const dynamicFont = await generateBitmapFont(assets.font, {
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ',
    fontSize: 24,
    color: '#ffe08a',
  });
  owned.push(dynamicFont);
  const bitmapFont = new SpriteFont(assets.bitmap);
  const dynamicSpriteFont = new SpriteFont(dynamicFont);

  game = await Game.create({
    canvas: '#game',
    renderer: backend.value as RendererPreference,
    width: 900,
    height: 500,
  });
  if (released) {
    game.destroy();
    throw new Error('Example was disposed during Game creation.');
  }
  const runtime = game;
  runtime.addEventListener(
    'error',
    (event) => report((event as CustomEvent<Error>).detail),
    { signal: listeners.signal },
  );

  const canvasSource = document.createElement('canvas');
  canvasSource.width = canvasSource.height = 32;
  const paintSnapshot = (color: string): void => {
    const context = canvasSource.getContext('2d')!;
    context.clearRect(0, 0, 32, 32);
    context.fillStyle = color;
    context.fillRect(4, 4, 24, 24);
  };
  paintSnapshot('#ff8a3d');
  const snapshot = new CanvasTexture2D(canvasSource);
  owned.push(snapshot);
  const targets: RenderTexture2D[] = [];
  const holePath = new GraphicsPath2D([
    { op: 'rect', x: 20, y: 20, width: 20, height: 20 },
  ]);
  const shape = (fill: string) => [
    {
      path: new GraphicsPath2D(
        [{ op: 'roundedRect', x: 0, y: 0, width: 80, height: 60, radius: 8 }],
        { holes: [holePath] },
      ),
      fill: {
        kind: 'linear-gradient' as const,
        from: [0, 0] as const,
        to: [80, 60] as const,
        stops: [
          { offset: 0, color: fill },
          { offset: 1, color: '#233b8f' },
        ],
      },
      stroke: { paint: '#ffffff', width: 3, join: 'round' as const },
      alpha: 0.9,
    },
  ];

  async function build(): Promise<Handles> {
    const scene = new Scene();
    const background = scene.add(
      new TilingSprite2D({
        texture: assets.pattern,
        width: 900,
        height: 500,
        anchor: [0, 0],
        zIndex: -10,
        opacity: 0.35,
      }),
    );
    background.pointerEnabled = true;
    background.addEventListener('wheel', (event) => {
      const detail = (event as CustomEvent<{ deltaY: number }>).detail;
      const next = Math.max(
        0.5,
        Math.min(3, background.tileScale.x + Math.sign(detail.deltaY) * 0.25),
      );
      background.tileScale.set(next, next);
      text('events', `wheel: tile scale ${next.toFixed(2)}`);
    });

    const atlasSprite = scene.add(
      new Sprite({
        view: assets.atlas.views.get('asymmetric')!,
        position: [110, 100],
        scale: [6, 6],
        zIndex: 2,
      }),
    );
    atlasSprite.draggable = true;
    atlasSprite.cursor = 'grab';
    atlasSprite.hitArea = HitArea2D.circle(0, 0, 14);
    atlasSprite.eventPropagation = 'hierarchy';
    atlasSprite.accessibility = {
      role: 'button',
      label: 'Activate atlas sprite',
    };
    for (const name of [
      'dragstart',
      'dragmove',
      'dragend',
      'pointertap',
      'pointerupoutside',
      'activate',
    ]) {
      atlasSprite.addEventListener(name, (event) => {
        const detail = (
          event as CustomEvent<{ world?: { x: number; y: number } }>
        ).detail;
        text(
          'events',
          `${name}${detail?.world ? ` at (${detail.world.x.toFixed(1)}, ${detail.world.y.toFixed(1)})` : ''}`,
        );
      });
    }
    const frames = assets.atlas.animations.get('turn')!;
    const animation = new FrameAnimation(
      atlasSprite,
      frames.map((frame) => ({ view: frame.view, duration: 0.6 })),
      { strategy: 'loop' },
    );
    animation.play();

    const graphics = scene.add(
      await Graphics2D.create(shape('#ff6b6b'), {
        position: [230, 60],
        resolution: 2,
      }),
    );
    graphics.anchor.set(0, 0);
    const canvasSprite = scene.add(
      new Sprite({ texture: snapshot, position: [340, 90], scale: [2, 2] }),
    );
    const panelView = assets.atlas.views.get('panel')!;
    scene
      .add(NineSlice.fromView(panelView, { width: 90, height: 50 }))
      .position.set(410, 60);

    const cache = scene.add(new IsolatedGroup2D());
    cache.position.set(560, 90);
    cache.cacheAsTexture = true;
    const cacheChild = cache.add(
      new Sprite({
        view: assets.atlas.views.get('asymmetric')!,
        scale: [3, 3],
      }),
    );
    cache.add(
      new Sprite({ texture: snapshot, position: [50, 0], scale: [1.5, 1.5] }),
    );

    const mesh =
      runtime.graphics.backend === 'canvas2d'
        ? undefined
        : scene.add(
            new PerspectiveQuad2D({
              texture: assets.pattern,
              corners: [
                [640, 40],
                [780, 70],
                [790, 160],
                [650, 150],
              ],
              zIndex: 1,
            }),
          );

    const title = scene.add(
      await Text2D.create('Styled FontFace text', {
        fontFamily: `${webFontFixture.family}, sans-serif`,
        fontSize: 30,
        color: '#fdfdfd',
        stroke: { color: '#1b2d55', width: 3 },
        shadow: { color: '#000a', blur: 4, offsetX: 2, offsetY: 2 },
        resolution: 2,
      }),
    );
    title.position.set(30, 220);
    title.anchor.set(0, 0);
    const spriteText = scene.add(
      new SpriteText(bitmapFont, 'AVA AV iAV 😀', {
        letterSpacing: 1,
        wrapWidth: 260,
        align: 'left',
      }),
    );
    spriteText.position.set(30, 290);
    spriteText.scale.set(3, 3);
    const dynamicText = scene.add(
      new SpriteText(dynamicSpriteFont, 'DYNAMIC RGBA ATLAS 2026', {
        wrapWidth: 360,
      }),
    );
    dynamicText.position.set(30, 390);

    const particles = scene.add(
      new ParticleLayer2D({
        capacity: 64,
        texture: snapshot,
        dynamicAttributes: 0,
      }),
    );
    particles.position.set(560, 260);

    const captureView = scene.add(
      new Sprite({
        texture: assets.pattern,
        position: [760, 320],
        scale: [0.01, 0.01],
        visible: false,
      }),
    );
    return {
      scene,
      atlasSprite,
      animation,
      graphics,
      canvasSprite,
      cache,
      cacheChild,
      mesh,
      title,
      spriteText,
      particles,
      captureView,
      background,
    };
  }

  let handles = await build();
  const active = (): Handles => handles;
  runtime.start(handles.scene);
  text(
    'status',
    `Running on ${runtime.graphics.backend}; ${handles.scene.objects.size} scene objects.`,
  );

  const guarded = (id: string, action: () => void | Promise<void>): void => {
    const button = document.querySelector<HTMLButtonElement>(`#${id}`)!;
    button.disabled = false;
    button.addEventListener(
      'click',
      () => {
        void Promise.resolve()
          .then(action)
          .then(() => {
            if (!released)
              text('status', `${id}: ok on ${runtime.graphics.backend}`);
          })
          .catch(report);
      },
      { signal: listeners.signal },
    );
  };
  let swapped = false;
  guarded('atlas', () => {
    swapped = !swapped;
    active().animation.pause();
    active().atlasSprite.view = assets.atlas.views.get(
      swapped ? 'rotated' : 'asymmetric',
    )!;
  });
  let nearest = false;
  guarded('sampling', () => {
    nearest = !nearest;
    active().atlasSprite.sampler = nearest
      ? { minFilter: 'nearest', magFilter: 'nearest' }
      : undefined;
  });
  let hue = 0;
  guarded('graphics', async () => {
    hue = (hue + 90) % 360;
    await active().graphics.setInstructions(shape(`hsl(${hue} 90% 60%)`));
  });
  guarded('canvas-update', () => {
    paintSnapshot(`hsl(${(hue += 60) % 360} 90% 55%)`);
    snapshot.update(canvasSource);
  });
  guarded('cache-edit', () => {
    active().cacheChild.tint = [0.2, 1, 0.4, 1];
    text(
      'events',
      'Cached child edited; texture stays stale until Invalidate cache.',
    );
  });
  guarded('cache-update', () => active().cache.updateCache());
  guarded('cache-toggle', () => {
    active().cache.cacheAsTexture = !active().cache.cacheAsTexture;
  });
  const clip = new GraphicsPath2D([{ op: 'circle', x: 20, y: 10, radius: 30 }]);
  const masks = [
    undefined,
    Mask2D.rectangle({ x: 0, y: 0, width: 50, height: 25 }),
    Mask2D.path(clip),
    Mask2D.image({ texture: assets.maskImage, transform: [4, 0, 0, 4, 0, 0] }),
    Mask2D.rectangle({ x: 0, y: 0, width: 40, height: 20 }, { inverse: true }),
  ];
  let maskIndex = 0;
  guarded('mask', () => {
    maskIndex = (maskIndex + 1) % masks.length;
    active().cache.mask = masks[maskIndex];
  });
  const blends: BlendMode2D[] = [
    'normal',
    'add',
    'multiply',
    'screen',
    'erase',
  ];
  let blendIndex = 0;
  guarded('blend', () => {
    blendIndex = (blendIndex + 1) % blends.length;
    active().cache.blendMode = blends[blendIndex]!;
    text('events', `blend ${blends[blendIndex]}`);
  });
  const filterStack: Filter2D[] = [
    new BlurFilter2D({ radius: 3, quality: 3 }),
    new ColorMatrixFilter2D([
      0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0,
    ]),
    new NoiseFilter2D({ amount: 0.2, seed: 7 }),
    new AlphaFilter2D(0.85),
    new DisplacementFilter2D({ texture: assets.pattern, scale: [4, 4] }),
  ];
  owned.push(...filterStack);
  const canvasOnly = runtime.graphics.backend === 'canvas2d';
  /** Unsupported native content is rejected by the renderer itself; report that real error. */
  const probe = async (
    label: string,
    populate: (scene: Scene) => void,
  ): Promise<void> => {
    const scene = new Scene();
    populate(scene);
    const target = runtime.graphics.createRenderTexture({
      width: 32,
      height: 32,
    });
    try {
      await runtime.graphics.renderToTexture(target, scene);
      text('events', `${label} rendered natively`);
    } catch (error) {
      text(
        'events',
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      target.destroy();
      scene.destroy();
    }
  };
  let filtersOn = false;
  guarded('filters', async () => {
    if (canvasOnly) {
      await probe('Native filters', (scene) => {
        const group = scene.add(new IsolatedGroup2D());
        group.add(new Sprite({ texture: assets.pattern }));
        group.filters = [filterStack[0]!];
      });
      return;
    }
    filtersOn = !filtersOn;
    active().cache.filters = filtersOn ? filterStack : [];
  });
  let deformed = false;
  guarded('mesh', async () => {
    if (canvasOnly) {
      await probe('Projective mesh', (scene) => {
        scene.add(
          new PerspectiveQuad2D({
            texture: assets.pattern,
            corners: [
              [0, 0],
              [30, 2],
              [28, 30],
              [2, 28],
            ],
          }),
        );
      });
      return;
    }
    deformed = !deformed;
    active().mesh!.setCorners(
      deformed
        ? [
            [640, 60],
            [800, 30],
            [770, 170],
            [660, 130],
          ]
        : [
            [640, 40],
            [780, 70],
            [790, 160],
            [650, 150],
          ],
    );
  });
  guarded('capture', async () => {
    const target = runtime.graphics.createRenderTexture({
      width: 160,
      height: 100,
      resolution: 2,
    });
    targets.push(target);
    await runtime.graphics.renderToTexture(target, active().cache);
    const pixels = await runtime.graphics.extractPixels(target, {
      region: { x: 0, y: 0, width: 4, height: 4 },
    });
    const generated = await runtime.graphics.generateTexture(active().cache);
    owned.push(generated);
    const view = active().captureView;
    view.texture = target;
    view.scale.set(0.4, 0.4);
    view.visible = true;
    text(
      'events',
      `extracted ${pixels.length / 4} straight-alpha pixels; generated independent ${generated.width}×${generated.height} Texture.`,
    );
  });
  let counter = 0;
  guarded('text', async () => {
    counter++;
    await Promise.all([
      active().title.setText(`Latest text ${counter}`),
      active().title.setStyle({
        color: counter % 2 ? '#ffd166' : '#ffffff',
        fontSize: 30 + (counter % 3) * 4,
        letterSpacing: counter % 2,
      }),
    ]);
    active().spriteText.setText(counter % 2 ? 'iVA AVA' : 'AVA AV iAV 😀');
  });
  guarded('particles', () => {
    const layer = active().particles;
    if (layer.activeCount) {
      layer.clear();
      return;
    }
    for (let i = 0; i < 40; i++) {
      const angle = i * 0.61,
        radius = 8 + i * 2.5;
      layer.addParticle({
        transform: {
          a: 0.5,
          b: 0,
          c: 0,
          d: 0.5,
          tx: Math.cos(angle) * radius,
          ty: Math.sin(angle) * radius,
        },
        tint: [1, 0.4 + (i % 5) * 0.1, 0.4, 0.9],
      });
    }
  });
  guarded('unload', async () => {
    runtime.graphics.unloadTexture(assets.pattern);
    await runtime.graphics.prepareTextures([
      assets.pattern,
      assets.atlas.views.get('asymmetric')!.source,
    ]);
    text(
      'events',
      'Native upload dropped and re-prepared; CPU bitmaps stayed owned by the manifest.',
    );
  });
  let transitionRequest = 0;
  guarded('transition', async () => {
    const version = ++transitionRequest;
    const next = await build();
    await runtime.setScene(next.scene, {
      transition: {
        kind: 'crossfade',
        duration: 1,
        easing: Easings.sineInOut,
        direction: 'left',
        color: [0, 0, 0, 1],
        blockInput: true,
      },
    });
    if (version === transitionRequest && !released) handles = next;
    else next.scene.destroy();
  });
  const pause = document.querySelector<HTMLButtonElement>('#pause')!;
  pause.disabled = false;
  pause.addEventListener(
    'click',
    () => {
      if (runtime.state === 'running') {
        runtime.pause();
        pause.textContent = 'Resume';
      } else {
        runtime.resume();
        pause.textContent = 'Pause';
      }
    },
    { signal: listeners.signal },
  );
  const destroy = document.querySelector<HTMLButtonElement>('#destroy')!;
  destroy.disabled = false;
  destroy.addEventListener(
    'click',
    () => {
      cleanup();
      text(
        'status',
        'Destroyed: Game, scenes, owned manifest assets, targets, fixtures and object URLs released.',
      );
      for (const button of document.querySelectorAll<HTMLButtonElement>(
        'button',
      ))
        button.disabled = true;
    },
    { signal: listeners.signal },
  );
} catch (error) {
  report(error);
  cleanup();
}

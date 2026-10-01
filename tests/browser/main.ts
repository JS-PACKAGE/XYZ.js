import {
  AlphaFilter2D,
  Game,
  IsolatedGroup2D,
  LocalStorageBackend,
  Mask2D,
  Material2D,
  ParticleLayer2D,
  Scene,
  Serializer,
  Sprite,
  Texture,
  TextureView2D,
  TilingSprite2D,
  isSceneSnapshot,
  type RenderStats,
  type RendererPreference,
  type SpriteOptions,
} from '../../src/index.js';

const params = new URLSearchParams(location.search);
const renderer = params.get('renderer') as RendererPreference;
const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const output = document.querySelector<HTMLPreElement>('#report')!;
const saveButton = document.querySelector<HTMLButtonElement>('#save')!;
const destroyButton = document.querySelector<HTMLButtonElement>('#destroy')!;
interface Scenario {
  name: string;
  assertions: string[];
  stats?: RenderStats;
  png?: string;
  skip?: string;
}
const report: { renderer: string; scenarios: Scenario[]; error?: string } = {
  renderer,
  scenarios: [],
};
let scenario: Scenario = { name: 'forced-backend', assertions: [] };
report.scenarios.push(scenario);
let game: Game | undefined;
const owned: { destroy(): void }[] = [];
let released = false;
function publish(state: string): void {
  output.textContent = JSON.stringify(report);
  output.dataset.state = state;
}
function begin(name: string): void {
  scenario = { name, assertions: [] };
  report.scenarios.push(scenario);
  publish('running');
}
function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(`${scenario.name}: ${message}`);
  scenario.assertions.push(message);
}
function release(): void {
  if (released) return;
  released = true;
  try {
    game?.destroy();
  } finally {
    for (const resource of owned) resource.destroy();
  }
}
function fail(error: unknown): void {
  report.error =
    error instanceof Error ? (error.stack ?? error.message) : String(error);
  publish('failed');
}
addEventListener('pagehide', () => release(), { once: true });
const frames = async (count = 3): Promise<void> => {
  for (let i = 0; i < count; i++)
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
  if (report.error) throw new Error(report.error);
};
interface ImageProof {
  bytes: Uint8ClampedArray;
  width: number;
}
async function proof(): Promise<ImageProof> {
  return new Promise((resolve, reject) =>
    requestAnimationFrame(() => {
      try {
        const copy = document.createElement('canvas');
        copy.width = canvas.width;
        copy.height = canvas.height;
        const context = copy.getContext('2d', { willReadFrequently: true });
        if (!context)
          throw new Error(
            'Pixel readback unavailable: no Canvas2D copy context.',
          );
        context.drawImage(canvas, 0, 0);
        const bytes = context.getImageData(0, 0, copy.width, copy.height).data;
        scenario.png = copy.toDataURL('image/png');
        scenario.stats = { ...game!.graphics.stats };
        resolve({ bytes, width: copy.width });
      } catch (error) {
        reject(error);
      }
    }),
  );
}
function pixel(
  image: ImageProof,
  x: number,
  y: number,
  rgb: readonly number[],
  label: string,
  tolerance = 4,
): void {
  const offset = (y * image.width + x) * 4;
  const actual = Array.from(image.bytes.slice(offset, offset + 4));
  check(
    rgb.every((value, index) => Math.abs(actual[index] - value) <= tolerance) &&
      actual[3] === 255,
    `${label}: (${x},${y}) expected ${rgb.join(',')}, observed ${actual.join(',')}`,
  );
}
function batching(instances: number): void {
  const stats = scenario.stats!;
  check(
    stats.instances2D >= instances && stats.instances2D <= instances + 4,
    `submitted instances ${stats.instances2D} include ${instances} visible objects and bounded composition`,
  );
  if (renderer !== 'canvas2d') {
    check(
      stats.drawCalls2D >= 1 && stats.drawCalls2D <= 3,
      `one same-state run uses ${stats.drawCalls2D} draws, not ${instances} per-object draws`,
    );
    check(
      stats.renderPasses2D > 0,
      `native passes counted: ${stats.renderPasses2D}`,
    );
    check(
      stats.peakRenderTargetBytes >= stats.renderTargetBytes &&
        stats.renderTargetBytes > 0,
      `resident/peak target estimates: ${stats.renderTargetBytes}/${stats.peakRenderTargetBytes}`,
    );
  } else {
    check(
      stats.drawCalls2D >= instances,
      `Canvas2D counts actual unbatched drawImage commands: ${stats.drawCalls2D}`,
    );
  }
}
class TickScene extends Scene {
  ticks = 0;
  override update(): void {
    this.ticks++;
  }
}

try {
  game = await Game.create({
    canvas,
    renderer,
    width: 512,
    height: 512,
    pixelRatio: 1,
    autoResize: false,
    antialias: false,
    recoverGraphics: true,
    saveStorage: new LocalStorageBackend(`browser-regression-${renderer}`),
  });
  const runtime = game;
  runtime.addEventListener('error', (event) =>
    fail((event as CustomEvent<Error>).detail),
  );
  check(
    runtime.graphics.backend === renderer,
    `forced ${renderer}; observed ${runtime.graphics.backend}`,
  );
  const source = document.createElement('canvas');
  source.width = 16;
  source.height = 8;
  const painter = source.getContext('2d')!;
  painter.fillStyle = '#fff';
  painter.fillRect(0, 0, 8, 8);
  painter.fillStyle = '#f00';
  painter.fillRect(8, 0, 4, 8);
  painter.fillStyle = '#0f0';
  painter.fillRect(12, 0, 4, 8);
  const atlas = await Texture.fromImage(source);
  owned.push(atlas);
  const white = new TextureView2D(atlas, {
    frame: { x: 0, y: 0, width: 8, height: 8 },
  });
  const colored = new TextureView2D(atlas, {
    frame: { x: 8, y: 0, width: 8, height: 8 },
  });
  const trimmed = new TextureView2D(atlas, {
    frame: { x: 0, y: 0, width: 8, height: 8 },
    originalSize: [12, 12],
    trim: { x: 2, y: 2, width: 8, height: 8 },
  });
  const rotated = new TextureView2D(atlas, {
    frame: { x: 8, y: 0, width: 8, height: 8 },
    rotation: 90,
  });
  const square = (
    x: number,
    y: number,
    color: [number, number, number, number],
    options: SpriteOptions = {},
  ): Sprite =>
    new Sprite({
      view: white,
      anchor: [0, 0],
      position: [x, y],
      scale: [4, 4],
      tint: color,
      ...options,
    });
  const background = (scene: Scene): void => {
    scene.add(square(0, 0, [0, 0, 0, 1], { scale: [80, 80], zIndex: -100 }));
  };
  const show = async (scene: Scene): Promise<void> => {
    await runtime.setScene(scene);
    runtime.start();
    await frames();
  };
  class SaveScene extends TickScene {
    readonly player = this.add(square(144, 144, [1, 0, 1, 1], { zIndex: 1 }));
    readonly serializer = new Serializer(this);
    constructor() {
      super();
      background(this);
      this.serializer.register('player', this.player);
    }
  }
  let saveScene: SaveScene;
  if (params.get('restore') === '1') {
    begin('save-reload-restore');
    saveScene = new SaveScene();
    saveScene.player.position.set(32, 32);
    const saved = await runtime.saves.load('browser-proof');
    check(
      saved.status === 'loaded',
      `persistent save reload status: ${saved.status}`,
    );
    if (saved.status !== 'loaded' || !isSceneSnapshot(saved.record.data))
      throw new Error('Persistent save is not a Scene snapshot.');
    await saveScene.serializer.restore(saved.record.data);
    await show(saveScene);
    const image = await proof();
    pixel(image, 150, 150, [255, 0, 255], 'restored magenta player');
    pixel(image, 38, 38, [0, 0, 0], 'unsaved position absent');
    check(
      saveScene.player.position.x === 144 &&
        saveScene.player.position.y === 144,
      'serializer restores the saved transform across an actual page reload',
    );
    publish('loaded');
  } else {
    begin('adjacent-atlas-sprites');
    const adjacent = new TickScene();
    background(adjacent);
    for (let i = 0; i < 1024; i++) {
      const variant = i % 4;
      adjacent.add(
        new Sprite({
          view: [white, colored, trimmed, rotated][variant],
          position: [(i % 32) * 16 + 8, Math.floor(i / 32) * 16 + 8],
          scale: [variant === 1 ? -1 : 1, 1],
          tint: [i % 2 ? 1 : 0.5, 1, 1, 1],
          opacity: i % 3 === 0 ? 0.5 : 1,
          sampler: { minFilter: 'nearest', magFilter: 'nearest' },
          roundPixels: true,
        }),
      );
    }
    // Keep the backing black quad in the same sampler run.
    for (const object of adjacent.objects)
      if (object instanceof Sprite)
        object.sampler = { minFilter: 'nearest', magFilter: 'nearest' };
    await show(adjacent);
    let image = await proof();
    pixel(image, 8, 8, [64, 128, 128], 'per-instance tint and opacity');
    pixel(image, 21, 8, [0, 255, 0], 'reflected packed frame left');
    pixel(image, 26, 8, [255, 0, 0], 'reflected packed frame right');
    pixel(image, 35, 8, [0, 0, 0], 'trimmed frame empty margin');
    pixel(image, 40, 8, [128, 255, 255], 'trimmed frame content');
    pixel(image, 56, 5, [0, 128, 0], 'rotated atlas unpack top');
    pixel(image, 56, 10, [128, 0, 0], 'rotated atlas unpack bottom');
    pixel(
      image,
      8,
      264,
      [128, 255, 255],
      'sprite instance beyond the first 512 rows',
    );
    pixel(
      image,
      504,
      501,
      [0, 128, 0],
      'last rotated sprite reaches the expanded native instance buffer',
    );
    batching(1025);
    check(
      scenario.stats!.uploadBytes > 0 || renderer === 'canvas2d',
      'changing sprite instance geometry is counted as native uploads',
    );

    begin('particle-layer-holes-and-refill');
    const particles = new TickScene();
    background(particles);
    const layer = particles.add(
      new ParticleLayer2D({
        capacity: 1024,
        view: white,
        dynamicAttributes: 0,
      }),
    );
    for (let i = 0; i < 1024; i++)
      layer.addParticle({
        transform: {
          a: 1,
          b: 0,
          c: 0,
          d: 1,
          tx: (i % 32) * 16 + 8,
          ty: Math.floor(i / 32) * 16 + 8,
        },
        tint: [1, 0, 0, 1],
      });
    await show(particles);
    image = await proof();
    pixel(image, 8, 8, [255, 0, 0], 'initial resident particle geometry');
    for (let i = 0; i < 1024; i += 2) layer.removeSlot(i);
    for (let i = 0; i < 1024; i += 2)
      layer.addParticle({
        transform: {
          a: 1,
          b: 0,
          c: 0,
          d: 1,
          tx: (i % 32) * 16 + 8,
          ty: Math.floor(i / 32) * 16 + 8,
        },
        tint: [0, 1, 0, 1],
      });
    image = await proof();
    pixel(image, 8, 8, [0, 255, 0], 'reused slot has new geometry/tint');
    pixel(image, 24, 8, [255, 0, 0], 'surviving slot remains visible');
    pixel(
      image,
      504,
      504,
      [255, 0, 0],
      'last surviving particle renders after resident-buffer compaction',
    );
    batching(1025);
    check(
      layer.activeCount === 1024,
      'hole compaction and slot refill retain all 1024 particles',
    );
    const compactedUpload = scenario.stats!.uploadBytes;
    begin('static-particle-cache-invalidation');
    image = await proof();
    const unchangedUpload = scenario.stats!.uploadBytes;
    layer.setTint(1, [0, 0, 1, 1]);
    image = await proof();
    pixel(
      image,
      24,
      8,
      [0, 0, 255],
      'static tint setter invalidates an already uploaded particle slot',
    );
    if (renderer !== 'canvas2d') {
      check(
        unchangedUpload < compactedUpload,
        `unchanged static particles avoid compaction uploads: ${unchangedUpload} < ${compactedUpload}`,
      );
      check(
        scenario.stats!.uploadBytes > unchangedUpload &&
          scenario.stats!.uploadBytes < compactedUpload,
        `single changed slot uploads bounded dirty data: ${scenario.stats!.uploadBytes}, unchanged ${unchangedUpload}, compacted ${compactedUpload}`,
      );
    }

    begin('interleaved-texture-stable-order-opacity');
    const blueSource = document.createElement('canvas');
    blueSource.width = blueSource.height = 8;
    const blueContext = blueSource.getContext('2d')!;
    blueContext.fillStyle = '#00f';
    blueContext.fillRect(0, 0, 8, 8);
    const blue = await Texture.fromImage(blueSource);
    owned.push(blue);
    const order = new TickScene();
    background(order);
    order.add(square(32, 32, [1, 0, 0, 1]));
    order.add(
      new Sprite({
        texture: blue,
        anchor: [0, 0],
        position: [40, 32],
        scale: [4, 4],
        opacity: 0.5,
      }),
    );
    order.add(square(48, 32, [0, 1, 0, 1], { opacity: 0.5 }));
    await show(order);
    image = await proof();
    pixel(image, 36, 40, [255, 0, 0], 'first texture');
    pixel(image, 44, 40, [128, 0, 128], 'second texture alpha over first');
    pixel(
      image,
      52,
      40,
      [64, 128, 64],
      'returning texture preserves insertion order, not global texture sorting',
    );

    begin('particle-texture-runs-preserve-order');
    const particleOrder = new TickScene();
    background(particleOrder);
    const runs = particleOrder.add(
      new ParticleLayer2D({ capacity: 4, view: white, dynamicAttributes: 0 }),
    );
    const transform = { a: 4, b: 0, c: 0, d: 4, tx: 64, ty: 64 };
    const old = runs.addParticle({ transform, tint: [1, 0, 0, 1] });
    runs.addParticle({ texture: blue, transform, tint: [1, 1, 1, 0.5] });
    runs.addParticle({ transform, tint: [0, 1, 0, 0.5] });
    runs.removeSlot(old);
    runs.addParticle({ transform, tint: [1, 0, 0, 0.5] });
    await show(particleOrder);
    image = await proof();
    pixel(
      image,
      64,
      64,
      [128, 64, 32],
      'recycled low-index slot renders last in active insertion order',
    );

    begin('sampler-tiling-world-hud-boundaries');
    const boundaries = new TickScene();
    background(boundaries);
    boundaries.camera2D.position.set(20, 0);
    boundaries.add(
      square(80, 80, [1, 0, 0, 1], {
        sampler: { minFilter: 'nearest', magFilter: 'nearest' },
        zIndex: 100,
      }),
    );
    boundaries.add(
      new TilingSprite2D({
        view: white,
        width: 32,
        height: 32,
        anchor: [0, 0],
        position: [128, 80],
        tint: [0, 1, 0, 1],
      }),
    );
    boundaries.add(
      square(80, 80, [0, 0, 1, 1], { space: 'screen', zIndex: -1 }),
    );
    await show(boundaries);
    image = await proof();
    pixel(image, 65, 90, [255, 0, 0], 'world sprite follows camera');
    pixel(
      image,
      90,
      90,
      [0, 0, 255],
      'HUD stays fixed and is composited after world despite lower z',
    );
    pixel(
      image,
      115,
      90,
      [0, 255, 0],
      'tiling sprite survives ordinary run boundary',
    );

    if (renderer === 'canvas2d') {
      begin('canvas-scratch-pass-accounting');
      const scratchScene = new TickScene();
      background(scratchScene);
      const scratchGroup = scratchScene.add(new IsolatedGroup2D());
      scratchGroup.isolate = true;
      scratchGroup.position.set(32, 96);
      scratchGroup.add(square(0, 0, [1, 1, 1, 1]));
      await show(scratchScene);
      image = await proof();
      pixel(image, 40, 110, [255, 255, 255], 'plain isolated group');
      const plainPasses = scenario.stats!.renderPasses2D;
      scratchGroup.tint = [0, 1, 0, 1];
      await frames();
      image = await proof();
      pixel(
        image,
        40,
        110,
        [0, 255, 0],
        'group RGB uses a separate tinted scratch',
      );
      check(
        scenario.stats!.renderPasses2D > plainPasses,
        'group tint scratch contributes additional Canvas target work',
      );
      scratchGroup.tint = [1, 1, 1, 1];
      scratchScene.add(
        new TilingSprite2D({
          view: white,
          width: 32,
          height: 32,
          anchor: [0, 0],
          position: [80, 96],
          tint: [1, 0, 0, 1],
        }),
      );
      await frames();
      image = await proof();
      pixel(
        image,
        90,
        110,
        [255, 0, 0],
        'tiling scratch paints actual repeated content',
      );
      check(
        scenario.stats!.renderPasses2D > plainPasses,
        'tiling scratch contributes additional Canvas target work',
      );
    }

    if (renderer !== 'canvas2d') {
      begin('native-material-isolation-mask-filter-boundaries');
      const material = new Material2D({
        wgsl: 'fn effect(color: vec4f, uv: vec2f, screen: vec2f) -> vec4f { return vec4f(color.b, color.r, color.g, color.a); }',
        glsl: 'vec4 effect(vec4 color, vec2 uv, vec2 screen) { return vec4(color.b, color.r, color.g, color.a); }',
      });
      const alpha = new AlphaFilter2D(0.5);
      owned.push(material, alpha);
      await runtime.graphics.prepareMaterial(material);
      const effects = new TickScene();
      background(effects);
      effects.add(square(32, 32, [1, 0, 0, 1]));
      effects.add(square(72, 32, [1, 0, 0, 1], { material }));
      effects.add(square(112, 32, [1, 0, 0, 1]));
      const group = effects.add(new IsolatedGroup2D());
      group.position.set(32, 96);
      group.isolate = true;
      group.mask = Mask2D.rectangle({ x: 0, y: 0, width: 16, height: 32 });
      group.filters = [alpha];
      group.add(square(0, 0, [1, 1, 1, 1]));
      effects.add(square(80, 96, [0, 0, 1, 1]));
      await show(effects);
      image = await proof();
      pixel(image, 40, 40, [255, 0, 0], 'ordinary sprite before material');
      pixel(image, 80, 40, [0, 255, 0], 'native effect swizzles red to green');
      pixel(
        image,
        120,
        40,
        [255, 0, 0],
        'native material does not leak into next run',
      );
      pixel(image, 40, 110, [128, 128, 128], 'isolated alpha filter');
      pixel(image, 56, 110, [0, 0, 0], 'mask clips outside local rectangle');
      pixel(
        image,
        90,
        110,
        [0, 0, 255],
        'mask/filter state does not leak after isolation',
      );
      check(
        scenario.stats!.drawCalls2D >= 6 && scenario.stats!.renderPasses2D >= 3,
        `real boundary/effect draws and passes counted: ${scenario.stats!.drawCalls2D}/${scenario.stats!.renderPasses2D}`,
      );
    }

    begin('resize-pause-resume-and-visual-scene-transition');
    const lifecycle = new TickScene();
    background(lifecycle);
    lifecycle.add(square(48, 48, [1, 0, 0, 1]));
    await show(lifecycle);
    runtime.pause();
    const ticks = lifecycle.ticks;
    await frames(4);
    check(
      lifecycle.ticks === ticks && runtime.state === 'paused',
      'pause stops actual Scene.update callbacks',
    );
    runtime.resize(320, 240);
    check(
      canvas.width === 320 &&
        canvas.height === 240 &&
        runtime.width === 320 &&
        runtime.height === 240,
      'resize changes logical and backing dimensions at pixelRatio 1',
    );
    runtime.resume();
    await frames();
    check(
      lifecycle.ticks > ticks && runtime.state === 'running',
      'resume advances Scene.update callbacks',
    );
    image = await proof();
    pixel(image, 56, 56, [255, 0, 0], 'resized surface renders current scene');
    const next = new TickScene();
    background(next);
    next.add(square(48, 48, [0, 0, 1, 1]));
    let completed = 0;
    runtime.addEventListener('transitioncomplete', () => completed++, {
      once: true,
    });
    const transition = runtime.setScene(next, {
      transition: { kind: 'crossfade', duration: 0.25 },
    });
    for (let i = 0; i < 30 && !runtime.transitioning; i++) await frames(1);
    check(runtime.transitioning, 'scene switch starts a real visual crossfade');
    image = await proof();
    const blend = (56 * image.width + 56) * 4;
    check(
      image.bytes[blend] > 0 && image.bytes[blend + 2] > 0,
      `crossfade actually blends old/new scene pixels: ${Array.from(image.bytes.slice(blend, blend + 4)).join(',')}`,
    );
    await transition;
    await frames();
    image = await proof();
    pixel(image, 56, 56, [0, 0, 255], 'transition completes with new scene');
    check(
      lifecycle.destroyed &&
        runtime.scene === next &&
        !runtime.transitioning &&
        completed === 1,
      'old scene destroyed, new scene published, transition completion emitted exactly once',
    );
    runtime.resize(512, 512);

    begin('public-render-target-readback-and-residency');
    runtime.pause();
    const captureScene = new Scene();
    captureScene.add(square(0, 0, [0, 1, 0, 1]));
    const target = runtime.graphics.createRenderTexture({
      width: 32,
      height: 32,
    });
    try {
      await runtime.graphics.renderToTexture(target, captureScene);
      const readback = await runtime.graphics.extractPixels(target);
      check(
        readback.length === 32 * 32 * 4 &&
          readback[0] === 0 &&
          readback[1] === 255 &&
          readback[2] === 0 &&
          readback[3] === 255,
        'public extractPixels returns real green RGBA data, never unavailable-as-PASS',
      );
      const resident = runtime.graphics.stats.renderTargetBytes;
      target.destroy();
      check(
        runtime.graphics.stats.renderTargetBytes < resident,
        `destroy releases resident target estimate: ${resident} -> ${runtime.graphics.stats.renderTargetBytes}`,
      );
    } finally {
      target.destroy();
      captureScene.destroy();
    }
    runtime.resume();
    await frames();

    begin('actual-graphics-context-loss-recovery');
    if (renderer === 'webgl2') {
      const gl = canvas.getContext('webgl2');
      const extension = gl?.getExtension('WEBGL_lose_context');
      if (!extension) {
        scenario.skip =
          'WEBGL_lose_context is unavailable; actual loss recovery was not exercised.';
      } else {
        const event = (name: string): Promise<void> =>
          new Promise((resolve, reject) => {
            const listener = (): void => {
              clearTimeout(timer);
              resolve();
            };
            const timer = setTimeout(() => {
              runtime.removeEventListener(name, listener);
              reject(new Error(`Timed out waiting for ${name}`));
            }, 15000);
            runtime.addEventListener(name, listener, { once: true });
          });
        const lost = event('graphicslost');
        extension.loseContext();
        await lost;
        check(
          gl!.isContextLost(),
          'browser reports a genuinely lost WebGL2 context',
        );
        const recovered = event('graphicsrecovered');
        await new Promise<void>((resolve) => setTimeout(resolve, 100));
        extension.restoreContext();
        await recovered;
        await frames(5);
        image = await proof();
        pixel(
          image,
          56,
          56,
          [0, 0, 255],
          'CPU-owned sprite texture reuploaded after context restoration',
        );
        check(
          runtime.state === 'running' && runtime.scene === next,
          'recovery preserves running Game and published Scene',
        );
      }
    } else {
      scenario.skip =
        renderer === 'webgpu'
          ? 'WebGPU has no public browser canvas device-loss injection; private engine GPUDevice access is deliberately not used.'
          : 'Canvas2D has no GPU graphics context to lose.';
    }
    begin('persistent-scene-save');
    saveScene = new SaveScene();
    await show(saveScene);
    image = await proof();
    pixel(image, 150, 150, [255, 0, 255], 'persistent player before save');
    publish('complete');
  }
  saveButton.disabled = false;
  destroyButton.disabled = false;
  saveButton.addEventListener('click', () => {
    void runtime.saves
      .save('browser-proof', saveScene.serializer.capture())
      .then(() => {
        publish('saved');
      })
      .catch(fail);
  });
  destroyButton.addEventListener('click', () => {
    const statsBeforeDestroy = runtime.graphics.stats;
    release();
    begin('destroy-lifecycle');
    check(
      runtime.state === 'destroyed' && saveScene.destroyed,
      'destroy disposes Game and active Scene',
    );
    check(
      statsBeforeDestroy.renderTargetBytes === 0 &&
        runtime.graphics.stats.renderTargetBytes === 0,
      'destroy releases all resident render-target estimates, including the previously published stats object',
    );
    publish('destroyed');
  });
} catch (error) {
  fail(error);
  release();
}

import {
  AssetLoader,
  Game,
  Geometry,
  Group2D,
  Scene,
  Sprite,
  UIRoot,
  UIElement,
  UIButton,
  UICheckbox,
  UISlider,
  FactoryRegistry,
  defineFactory,
  buildContentScene,
  parseContentScene,
} from '../../src/index.js';
import type {
  InputContext,
  RendererPreference,
  Texture,
  TextureLease,
} from '../../src/index.js';

interface Probe {
  clicks: number;
  fires: number;
  defaultFires: number;
  rawDown: boolean;
  confirms: number;
  defaultConfirms: number;
  confirmValue: number;
  updates: number;
  x: number;
  gain: number;
  checked: boolean;
  modalClicks: number;
  pad7: number;
  pad2: number;
  virtual: number;
  focused: string;
}
declare global {
  interface Window {
    __xyzP41?: Probe;
  }
}
interface Scenario {
  name: string;
  assertions: string[];
  skip?: string;
  readback?: {
    samples: { x: number; y: number; rgba: number[] }[];
    colors: Record<string, number>;
    decodedImageCanvasRGBA?: number[];
    webglDitherEnabled?: boolean;
    webglUnpackColorSpaceConversion?: number;
    imageColorIsolation?: Record<string, unknown>;
    colorDiagnosticError?: string;
  };
}
const renderer = new URLSearchParams(location.search).get(
  'renderer',
) as RendererPreference;
const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const output = document.querySelector<HTMLPreElement>('#report')!;
const finish = document.querySelector<HTMLButtonElement>('#finish')!;
const report: { renderer: string; scenarios: Scenario[]; error?: string } = {
  renderer,
  scenarios: [],
};
let scenario: Scenario = {
  name: 'typed-content-and-chunked-publication',
  assertions: [],
};
report.scenarios.push(scenario);
const probe: Probe = {
  clicks: 0,
  fires: 0,
  defaultFires: 0,
  rawDown: false,
  confirms: 0,
  defaultConfirms: 0,
  confirmValue: 0,
  updates: 0,
  x: 340,
  gain: 0,
  checked: false,
  modalClicks: 0,
  pad7: 0,
  pad2: 0,
  virtual: 0,
  focused: '',
};
window.__xyzP41 = probe;
let runtime: Game | undefined;
const leases: TextureLease[] = [];
const controls = new AbortController();
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
function fail(error: unknown): void {
  // Windows WebKit's stack can contain only locations, without the Error message.
  report.error =
    error instanceof Error
      ? `${String(error)}${error.stack ? `\n${error.stack}` : ''}`
      : String(error);
  controls.abort();
  runtime?.destroy();
  for (const lease of leases) lease.release();
  publish('failed');
}
async function frames(count = 3): Promise<void> {
  for (let index = 0; index < count; index++)
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
}
const imageSources: HTMLCanvasElement[] = [];
function imageURL(color: string): string {
  const image = document.createElement('canvas');
  image.width = image.height = 4;
  const context = image.getContext('2d')!;
  context.fillStyle = color;
  context.fillRect(0, 0, 4, 4);
  imageSources.push(image);
  return image.toDataURL('image/png');
}
const urls = [imageURL('#00ff00'), imageURL('#ff0000'), imageURL('#0000ff')];

async function imageColorEvidence(
  actual: Texture,
): Promise<Record<string, unknown>> {
  // Failure-only, engine-free readbacks never replace or alter the native oracle.
  const evidence: Record<string, unknown> = {
    encodedImageURL: urls[0],
    sources: {},
  };
  const sources = evidence.sources as Record<string, unknown>;
  const copy = document.createElement('canvas');
  copy.width = copy.height = 4;
  const context = copy.getContext('2d', { willReadFrequently: true })!;
  const surface = document.createElement('canvas');
  const gl = surface.getContext('webgl2', { antialias: false });
  if (!gl)
    throw new Error('Image color diagnostic WebGL2 context unavailable.');
  const texture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  try {
    if (!texture || !framebuffer)
      throw new Error('Image color diagnostic allocation failed.');
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );
    const inspect = (
      name: string,
      source: HTMLCanvasElement | HTMLImageElement | ImageBitmap,
    ): void => {
      context.clearRect(0, 0, 4, 4);
      context.drawImage(source, 0, 0);
      const width =
        source instanceof HTMLImageElement ? source.naturalWidth : source.width;
      const height =
        source instanceof HTMLImageElement
          ? source.naturalHeight
          : source.height;
      const uploads: Record<string, unknown>[] = [];
      sources[name] = {
        width,
        height,
        canvasRGBA: Array.from(context.getImageData(0, 0, 4, 4).data),
        uploads,
      };
      for (const conversion of [gl.BROWSER_DEFAULT_WEBGL, gl.NONE]) {
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, conversion);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          source,
        );
        const uploadError = gl.getError();
        const framebufferStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        const raw = new Uint8Array(4 * 4 * 4);
        if (
          uploadError === gl.NO_ERROR &&
          framebufferStatus === gl.FRAMEBUFFER_COMPLETE
        )
          gl.readPixels(0, 0, 4, 4, gl.RGBA, gl.UNSIGNED_BYTE, raw);
        const readError = gl.getError();
        uploads.push({
          unpackColorSpaceConversion: conversion,
          uploadError,
          framebufferStatus,
          readError,
          contextLost: gl.isContextLost(),
          rgba:
            uploadError === gl.NO_ERROR &&
            framebufferStatus === gl.FRAMEBUFFER_COMPLETE &&
            readError === gl.NO_ERROR &&
            !gl.isContextLost()
              ? Array.from(raw)
              : null,
        });
      }
    };
    inspect('originalCanvas', imageSources[0]);
    inspect('actualAssetBitmap', actual.image);
    const blob = await (await fetch(urls[0])).blob();
    evidence.blob = { type: blob.type, size: blob.size };
    const inspectBitmap = async (
      name: string,
      source: ImageBitmapSource,
      conversion: 'default' | 'none',
    ): Promise<void> =>
      new Promise<void>((resolve) => {
        let expired = false;
        const timer = window.setTimeout(() => {
          expired = true;
          sources[name] = { error: 'Native bitmap decode exceeded 5000ms.' };
          resolve();
        }, 5000);
        void Promise.resolve()
          .then(() =>
            createImageBitmap(source, {
              premultiplyAlpha: 'none',
              colorSpaceConversion: conversion,
            }),
          )
          .then(
            (bitmap) => {
              window.clearTimeout(timer);
              try {
                if (!expired) inspect(name, bitmap);
              } catch (error) {
                sources[name] = { error: String(error) };
              } finally {
                bitmap.close();
                resolve();
              }
            },
            (error: unknown) => {
              window.clearTimeout(timer);
              if (!expired) sources[name] = { error: String(error) };
              resolve();
            },
          );
      });
    for (const conversion of ['default', 'none'] as const)
      await inspectBitmap(`blob-${conversion}`, blob, conversion);
    // The URL refers to the same Blob: no profile removal or PNG re-encoding.
    const objectURL = URL.createObjectURL(blob);
    const image = new Image();
    let timer: number | undefined;
    try {
      await new Promise<void>((resolve, reject) => {
        timer = window.setTimeout(
          () => reject(new Error('Native image load exceeded 5000ms.')),
          5000,
        );
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('Native image load failed.'));
        image.src = objectURL;
      });
      window.clearTimeout(timer);
      if (image.naturalWidth !== 4 || image.naturalHeight !== 4)
        throw new Error('Native image diagnostic expected a 4×4 PNG.');
      inspect('blob-imageElement', image);
      for (const conversion of ['default', 'none'] as const)
        await inspectBitmap(`imageElement-${conversion}`, image, conversion);
      // Capture only the decoded image, never the original procedural canvas.
      for (const conversion of ['default', 'none'] as const) {
        context.clearRect(0, 0, 4, 4);
        context.drawImage(image, 0, 0);
        await inspectBitmap(`imageCanvas-${conversion}`, copy, conversion);
      }
    } catch (error) {
      sources['blob-imageElement'] = { error: String(error) };
    } finally {
      window.clearTimeout(timer);
      image.onload = image.onerror = null;
      image.removeAttribute('src');
      URL.revokeObjectURL(objectURL);
    }
  } finally {
    gl.deleteFramebuffer(framebuffer);
    gl.deleteTexture(texture);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
  return evidence;
}

interface ActorOptions {
  x: number;
  y: number;
}
interface Services {
  game: Game;
  input: InputContext;
  secondPad: InputContext;
  texture: Texture;
}
function position(value: unknown): ActorOptions {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new TypeError('Position options must be an object.');
  const data = value as Record<string, unknown>;
  if (
    typeof data.x !== 'number' ||
    !Number.isFinite(data.x) ||
    typeof data.y !== 'number' ||
    !Number.isFinite(data.y)
  )
    throw new TypeError('Position coordinates must be finite.');
  return { x: data.x, y: data.y };
}
class Recorder extends Sprite {
  root?: UIRoot;
  constructor(
    options: ActorOptions,
    private readonly services: Services,
  ) {
    super({
      texture: services.texture,
      position: [options.x, options.y],
      scale: [8, 8],
    });
  }
  override update(dt: number): void {
    const { game, input, secondPad } = this.services;
    if (input.wasPressed('fire')) probe.fires++;
    probe.updates++;
    if (game.input.actions.wasPressed('defaultFire')) probe.defaultFires++;
    if (input.wasPressed('confirm')) probe.confirms++;
    if (game.input.actions.wasPressed('defaultConfirm'))
      probe.defaultConfirms++;
    probe.confirmValue = input.value('confirm');
    probe.rawDown = game.input.pointer.isDown(0);
    this.position.x = Math.min(
      450,
      this.position.x + input.value('move') * dt * 120,
    );
    probe.x = this.position.x;
    probe.pad7 = input.value('pad');
    probe.pad2 = secondPad.value('pad');
    probe.virtual = game.input.virtual.value('drive');
    probe.focused = this.root?.focus.focused?.accessibility?.label ?? '';
  }
}

async function cpuResidency(): Promise<void> {
  begin('decoded-bitmap-borrowers-admission-and-lru');
  const loader = new AssetLoader(undefined, { decodedTextureBytes: 128 });
  const a = await loader.acquireTexture(urls[0]);
  const b = await loader.acquireTexture(urls[1]);
  try {
    let rejected = false;
    try {
      const extra = await loader.acquireTexture(urls[2]);
      extra.release();
    } catch {
      rejected = true;
    }
    check(
      rejected && !a.texture.destroyed && !b.texture.destroyed,
      'exhausted decoded admission rejects without closing either existing borrower',
    );
    a.release();
    const c = await loader.acquireTexture(urls[2]);
    try {
      check(
        a.texture.destroyed && !b.texture.destroyed && !c.texture.destroyed,
        'released least-recent decoded image evicts while live borrowers remain usable',
      );
      check(
        loader.residency.liveBytes <= 128 &&
          loader.residency.peakBytes <= 128 &&
          loader.residency.evictions > 0,
        'resident decoded allocations remain within the configured byte boundary',
      );
    } finally {
      c.release();
    }
  } finally {
    a.release();
    b.release();
    loader.destroy();
  }
  check(
    a.texture.destroyed &&
      b.texture.destroyed &&
      loader.residency.liveBytes === 0,
    'loader cleanup closes owned images and releases decoded residency',
  );
}

async function nativeResidency(): Promise<void> {
  begin('native-cache-admission-live-old-scene-and-reprepare');
  const surface = document.createElement('canvas');
  surface.width = 480;
  surface.height = 360;
  document.body.insertBefore(surface, finish);
  runtime = await Game.create({
    canvas: surface,
    renderer,
    width: 480,
    height: 360,
    autoResize: false,
    pixelRatio: 1,
    resourceBudgets: { decodedTextureBytes: 192, nativeTextureBytes: 128 },
  });
  const game = runtime;
  game.addEventListener('error', (event) =>
    fail((event as CustomEvent<Error>).detail),
  );
  const a = await game.assets.acquireTexture(urls[0]);
  const b = await game.assets.acquireTexture(urls[1]);
  const c = await game.assets.acquireTexture(urls[2]);
  leases.push(a, b, c);
  const old = new Scene();
  old.add(new Sprite({ texture: a.texture, anchor: [0, 0], scale: [120, 90] }));
  await game.setScene(old, { warmup: { maxItems: 1 } });
  game.start();
  await frames();
  const next = new Scene();
  next.add(
    new Sprite({ texture: b.texture, position: [20, 20], scale: [8, 8] }),
  );
  next.add(
    new Sprite({ texture: c.texture, position: [80, 80], scale: [8, 8] }),
  );
  let failed = false;
  try {
    await game.setScene(next, { warmup: { maxItems: 1 } });
  } catch {
    failed = true;
  }
  if (renderer === 'canvas2d') {
    check(
      !failed &&
        game.scene === next &&
        game.graphics.residency.textures.liveBytes === 0 &&
        game.graphics.residency.geometry.liveBytes === 0,
      'Canvas prepares CPU images without inventing native GPU residency',
    );
  } else {
    check(
      failed && game.scene === old && !old.destroyed && next.destroyed,
      'combined old/candidate native admission rejects before publication',
    );
    await frames(5);
    check(
      game.state === 'running' &&
        game.scene === old &&
        game.graphics.residency.textures.liveBytes <= 128,
      'the previously visible Scene continues actual frames after failed warmup',
    );
    game.pause();
    const target = game.graphics.createRenderTexture({
      width: 32,
      height: 32,
      resolution: 1,
    });
    try {
      await game.graphics.renderToTexture(target, old);
      const pixels = await game.graphics.extractPixels(target);
      if (
        pixels[0] !== 0 ||
        pixels[1] !== 255 ||
        pixels[2] !== 0 ||
        pixels[3] !== 255
      ) {
        const colors = new Map<string, number>();
        for (let offset = 0; offset < pixels.length; offset += 4) {
          const rgba = Array.from(pixels.subarray(offset, offset + 4)).join(
            ',',
          );
          colors.set(rgba, (colors.get(rgba) ?? 0) + 1);
        }
        scenario.readback = {
          samples: (
            [
              [0, 0],
              [31, 0],
              [0, 31],
              [16, 16],
              [31, 31],
            ] as const
          ).map(([x, y]) => {
            const offset = (y * 32 + x) * 4;
            return {
              x,
              y,
              rgba: Array.from(pixels.subarray(offset, offset + 4)),
            };
          }),
          colors: Object.fromEntries(colors),
        };
        try {
          const decoded = document.createElement('canvas');
          decoded.width = a.texture.width;
          decoded.height = a.texture.height;
          const context = decoded.getContext('2d', {
            willReadFrequently: true,
          })!;
          context.drawImage(a.texture.image, 0, 0);
          scenario.readback.decodedImageCanvasRGBA = Array.from(
            context.getImageData(0, 0, decoded.width, decoded.height).data,
          );
        } catch (error) {
          scenario.readback.colorDiagnosticError = `Decoded canvas: ${String(error)}`;
        }
        if (renderer === 'webgl2') {
          try {
            const gl = surface.getContext('webgl2')!;
            scenario.readback.webglDitherEnabled = gl.isEnabled(gl.DITHER);
            scenario.readback.webglUnpackColorSpaceConversion = gl.getParameter(
              gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,
            ) as number;
            scenario.readback.imageColorIsolation = await imageColorEvidence(
              a.texture,
            );
          } catch (error) {
            scenario.readback.colorDiagnosticError = [
              scenario.readback.colorDiagnosticError,
              `WebGL isolation: ${String(error)}`,
            ]
              .filter(Boolean)
              .join('; ');
          }
        }
      }
      check(
        pixels[0] === 0 &&
          pixels[1] === 255 &&
          pixels[2] === 0 &&
          pixels[3] === 255,
        'preserved old resources produce real green render-target pixels after rejection',
      );
    } finally {
      target.destroy();
    }
    const first = Geometry.quad();
    const second = Geometry.quad();
    await game.graphics.prepareGeometry(first);
    const geometryBytes = game.graphics.residency.geometry.liveBytes;
    check(
      geometryBytes ===
        first.vertices.byteLength +
          first.indices.byteLength +
          (first.colors?.byteLength ?? 0),
      'explicit native geometry preparation accounts exact vertex, index and optional color buffer bytes',
    );
    game.graphics.configureResidency({ textureBytes: 128, geometryBytes });
    let retainedRejected = false;
    try {
      await game.graphics.prepareGeometry(second);
    } catch {
      retainedRejected = true;
    }
    check(
      retainedRejected &&
        game.graphics.residency.geometry.liveBytes === geometryBytes,
      'explicit geometry preparation stays pinned until unload and rejects excess admission without losing it',
    );
    game.graphics.unloadGeometry(first);
    const idleFirst = await game.graphics.prepareResource(first);
    idleFirst.release();
    const idleSecond = await game.graphics.prepareResource(second);
    idleSecond.release();
    check(
      game.graphics.residency.geometry.liveBytes === geometryBytes &&
        game.graphics.residency.geometry.evictions > 0,
      'idle geometry evicts and a new geometry remains within one-allocation budget',
    );
    const restoredFirst = await game.graphics.prepareResource(first);
    restoredFirst.release();
    check(
      game.graphics.residency.geometry.liveBytes === geometryBytes,
      'evicted geometry re-prepares successfully at the same memory boundary',
    );
    game.graphics.unloadGeometry(first);
    game.graphics.unloadGeometry(second);
    check(
      game.graphics.residency.geometry.liveBytes === 0,
      'explicit geometry unload releases native cache allocation',
    );
    begin('native-offscreen-pins-and-abandoned-capture');
    const background = new Scene();
    background.add(
      new Sprite({ texture: b.texture, anchor: [0, 0], scale: [8, 8] }),
    );
    let generation: Promise<Texture> | undefined;
    let updates = 0;
    class GenerateDuringUpdate extends Sprite {
      override update(): void {
        updates++;
        generation ??= game.graphics.generateTexture(background, {
          bounds: { x: 0, y: 0, width: 32, height: 32 },
          resolution: 1,
        });
      }
    }
    const active = new Scene();
    active.add(
      new GenerateDuringUpdate({
        texture: a.texture,
        anchor: [0, 0],
        scale: [120, 90],
      }),
    );
    await game.setScene(active);
    game.graphics.configureResidency({ textureBytes: 64, geometryBytes });
    const originalBitmap = window.createImageBitmap;
    const captureBitmap = originalBitmap.bind(window);
    let releaseBitmap: (() => void) | undefined;
    const bitmapGate = new Promise<void>((resolve) => {
      releaseBitmap = resolve;
    });
    let bitmapReady = false;
    window.createImageBitmap = async (
      source: ImageBitmapSource,
      sxOrOptions?: number | ImageBitmapOptions,
      sy?: number,
      sw?: number,
      sh?: number,
      options?: ImageBitmapOptions,
    ): Promise<ImageBitmap> => {
      const image =
        typeof sxOrOptions === 'number'
          ? await captureBitmap(source, sxOrOptions, sy!, sw!, sh!, options)
          : await captureBitmap(source, sxOrOptions);
      bitmapReady = true;
      await bitmapGate;
      return image;
    };
    try {
      game.resume();
      const deadline = performance.now() + 10000;
      while (!bitmapReady && performance.now() < deadline) await frames(1);
      check(
        bitmapReady,
        'real native offscreen readback reaches delayed platform bitmap completion',
      );
      const before = updates;
      await frames(3);
      check(
        game.state === 'running' &&
          updates > before &&
          game.scene === active &&
          game.graphics.residency.textures.liveBytes === 64,
        'main Scene keeps rendering within one-texture budget while offscreen bitmap completion is pending',
      );
      window.createImageBitmap = originalBitmap;
      releaseBitmap?.();
      if (!generation)
        throw new Error('Scene did not start native generation.');
      const generated = await generation;
      const inspection = document.createElement('canvas');
      inspection.width = inspection.height = 32;
      const context = inspection.getContext('2d')!;
      context.drawImage(generated.image, 0, 0);
      const color = context.getImageData(16, 16, 1, 1).data;
      check(
        color[0] === 255 &&
          color[1] === 0 &&
          color[2] === 0 &&
          color[3] === 255,
        'pending generation returns actual red native pixels despite subsequent main resource eviction/reprepare',
      );
    } finally {
      window.createImageBitmap = originalBitmap;
      releaseBitmap?.();
      try {
        if (generation) (await generation).destroy();
      } finally {
        background.destroy();
      }
    }
    game.pause();
    const rejected = new Scene();
    rejected.add(
      new Sprite({ texture: b.texture, anchor: [0, 0], scale: [8, 8] }),
    );
    rejected.add(
      new Sprite({
        texture: c.texture,
        anchor: [0, 0],
        position: [8, 8],
        scale: [8, 8],
      }),
    );
    let captureFailed = false;
    try {
      (await game.graphics.captureScene(rejected, 32, 32)).destroy();
    } catch {
      captureFailed = true;
    } finally {
      rejected.destroy();
    }
    check(
      captureFailed,
      'capture exceeding one-texture native admission rejects',
    );
    const idleTexture = await game.graphics.prepareResource(c.texture);
    idleTexture.release();
    check(
      game.graphics.residency.textures.liveBytes === 64,
      'failed capture releases abandoned frame pins so a distinct idle texture admits',
    );
    game.resume();
    await frames(3);
    check(
      game.state === 'running' && game.scene === active,
      'visible main Scene renders again after failed capture and idle reprepare',
    );
  }
  const heldStats = game.graphics.stats;
  game.destroy();
  check(
    heldStats.renderTargetBytes === 0 && game.assets.residency.liveBytes === 0,
    'Game destruction releases render targets and decoded resource owners',
  );
  for (const lease of [a, b, c]) lease.release();
  await cpuResidency();
}

try {
  runtime = await Game.create({
    canvas,
    renderer,
    width: 480,
    height: 360,
    autoResize: false,
    pixelRatio: 1,
    resourceBudgets: {
      decodedTextureBytes: 64,
      nativeTextureBytes: 4 * 1024 * 1024,
      nativeGeometryBytes: 1024 * 1024,
    },
  });
  const game = runtime;
  game.addEventListener('error', (event) =>
    fail((event as CustomEvent<Error>).detail),
  );
  const lease = await game.assets.acquireTexture(urls[0]);
  leases.push(lease);
  const input = game.input.contexts.create('world', {
    priority: 10,
    consume: false,
    gamepadIndex: 7,
    bindings: {
      fire: [{ pointerButton: 0 }],
      confirm: [{ button: 'a' }],
      move: [{ key: 'ArrowRight' }, { key: 'KeyD' }, { virtual: 'drive' }],
      pad: [{ axis: 'leftX', direction: 1 }],
    },
  });
  const secondPad = game.input.contexts.create('second-pad', {
    consume: false,
    gamepadIndex: 2,
    bindings: { pad: [{ axis: 'leftX', direction: 1 }] },
  });
  input.activate();
  secondPad.activate();
  game.input.actions.bind('defaultFire', { pointerButton: 0 });
  game.input.actions.bind('defaultConfirm', { button: 'a' });
  const services: Services = { game, input, secondPad, texture: lease.texture };
  let creates = 0;
  const registry = new FactoryRegistry({
    group: defineFactory<ActorOptions, Group2D, Services>({
      parse: position,
      create(options) {
        creates++;
        const group = new Group2D();
        group.position.set(options.x, options.y);
        return group;
      },
    }),
    player: defineFactory<ActorOptions, Recorder, Services>({
      parse: position,
      create(options, context) {
        creates++;
        return new Recorder(options, context.services);
      },
    }),
  });
  const definition = parseContentScene(
    registry,
    JSON.parse(
      '{"version":1,"nodes":[{"id":"world","kind":"group","options":{"x":0,"y":0}},{"id":"player","kind":"player","parent":"world","options":{"x":340,"y":240}}]}',
    ) as unknown,
  );
  const content = await buildContentScene(registry, definition, services);
  const player = content.require('player', 'player');
  check(
    player.parent === content.require('world', 'group') && creates === 2,
    'validated JSON constructs a live explicitly-parented typed prefab graph',
  );
  const snapshot = content.serializer.capture();
  player.position.x = 400;
  await content.serializer.restore(snapshot);
  check(
    player.position.x === 340,
    'content stable IDs round-trip real consumer transform state',
  );
  let cycleRejected = false;
  try {
    await buildContentScene(
      registry,
      {
        version: 1,
        nodes: [
          { id: 'a', kind: 'group', parent: 'b', options: { x: 0, y: 0 } },
          { id: 'b', kind: 'group', parent: 'a', options: { x: 0, y: 0 } },
        ],
      },
      services,
    );
  } catch {
    cycleRejected = true;
  }
  check(
    cycleRejected && creates === 2 && !player.destroyed,
    'invalid parent topology rejects before constructors without touching the existing prefab',
  );
  const root = content.scene.add(
    new UIRoot(game, { direction: 'overlay', padding: 8 }),
  );
  player.root = root;
  const panel = root.add(
    new UIElement({ direction: 'column', width: 220, height: 300, gap: 8 }),
  );
  const options = {
    layout: { width: 'fill' as const, height: 44 },
    textStyle: { fontSize: 16 },
  };
  const button = panel.add(await UIButton.create('UI action', options));
  button.addEventListener('click', () => {
    probe.clicks++;
  });
  const checkbox = panel.add(await UICheckbox.create('Enabled', options));
  checkbox.addEventListener('change', () => {
    probe.checked = checkbox.checked;
  });
  const gain = panel.add(
    await UISlider.create('Gain', {
      ...options,
      layout: { width: 'fill', height: 64 },
      min: 0,
      max: 1,
      step: 0.25,
      value: 0,
    }),
  );
  gain.addEventListener('change', () => {
    probe.gain = gain.value;
    game.input.virtual.set('drive', gain.value);
  });
  const reset = panel.add(await UIButton.create('Reset gain', options));
  reset.addEventListener('click', () => {
    gain.value = 0;
  });
  const opener = panel.add(await UIButton.create('Open modal', options));
  const modal = root.add(
    new UIElement({ direction: 'column', width: 220, height: 120, gap: 8 }),
  );
  modal.setVisible(false);
  const one = modal.add(await UIButton.create('Modal one', options));
  one.addEventListener('click', () => {
    probe.modalClicks++;
  });
  const two = modal.add(await UIButton.create('Modal two', options));
  two.addEventListener('click', () => {
    panel.setVisible(true);
    modal.setVisible(false);
    root.focus.popModal();
  });
  opener.addEventListener('click', () => {
    modal.setVisible(true);
    root.focus.pushModal(modal);
    panel.setVisible(false);
  });
  canvas.addEventListener(
    'pointerdown',
    () => canvas.focus({ preventScroll: true }),
    { signal: controls.signal },
  );
  root.focus.focus(button);
  let chunks = 0;
  await game.setScene(content.scene, {
    warmup: {
      maxItems: 1,
      maxMilliseconds: 4,
      onProgress(value) {
        chunks = value.chunks;
      },
    },
  });
  game.start();
  await frames(5);
  check(
    chunks > 1 && game.scene === content.scene && game.state === 'running',
    'candidate uploads span actual RAF chunks before publication and rendering',
  );
  begin('trusted-ui-pointer-keyboard-modal-and-simulated-pads');
  finish.disabled = false;
  publish('ui-ready');
  finish.addEventListener(
    'click',
    () => {
      finish.disabled = true;
      void (async () => {
        check(
          probe.clicks === 2 && probe.fires === 2 && probe.defaultFires === 2,
          'native UI tap and simulated pad activation each activate once without leaking gameplay/default fire; each world tap fires once',
        );
        check(
          probe.confirms === 1 && probe.defaultConfirms === 1,
          'held menu close does not manufacture a confirm; a fresh world gamepad press does',
        );
        check(
          probe.checked && probe.modalClicks === 1 && probe.gain === 0,
          'native checkbox, slider reset and modal activation change real widget state',
        );
        check(
          probe.x > 370 && probe.focused === '',
          'native world focus clears UI consumption and keyboard movement advances the actor',
        );
        game.input.virtual.set('drive', 0.5);
        await frames();
        check(
          input.value('move') === 0.5,
          'virtual device state reaches the live gameplay context',
        );
        game.pause();
        const updates = probe.updates;
        check(
          input.value('move') === 0 && game.input.virtual.value('drive') === 0,
          'pause neutralizes context and virtual held state',
        );
        await frames();
        check(
          probe.updates === updates,
          'pause stops the actual Scene consumer, not just UI labels',
        );
        game.resume();
        await frames();
        check(
          probe.updates > updates &&
            input.value('move') === 0 &&
            game.input.virtual.value('drive') === 0,
          'resume advances frames without replaying held virtual input',
        );
        game.resize(660, 420);
        await frames();
        check(
          root.layoutWidth === 660 &&
            root.layoutHeight === 420 &&
            canvas.width === 660 &&
            canvas.height === 420 &&
            game.graphics.stats.drawCalls2D > 0,
          'responsive retained layout follows a real rendered backing resize',
        );
        const held = game.graphics.stats;
        controls.abort();
        game.destroy();
        lease.release();
        check(
          root.destroyed &&
            !root.focus.focused &&
            !input.active &&
            !secondPad.active &&
            !document.querySelector('[data-xyz-accessibility]') &&
            held.renderTargetBytes === 0,
          'teardown clears native semantic nodes, scoped contexts/focus and renderer targets',
        );
        await nativeResidency();
        publish('complete');
      })().catch(fail);
    },
    { signal: controls.signal },
  );
} catch (error) {
  fail(error);
}

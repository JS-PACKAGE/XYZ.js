import {
  Game,
  Group2D,
  Scene,
  ScreenElement,
  Sprite,
  SpriteSheet,
  FrameAnimation,
  SpriteFont,
  SpriteText,
  NineSlice,
  Actions,
  Easings,
  CameraStrategies,
  RigidBody2D,
  Colliders,
  Trigger2D,
  TileMap,
  IsometricMap,
  ParticleEmitter,
  PreloadBatch,
  Material2D,
  PostProcessor2D,
  UnsupportedGraphicsError,
  Vector2,
  type PointerTargetEventDetail,
  type RendererPreference,
  type AudioAsset,
  type SampleAudioAsset,
  type SamplePlayback,
  type Texture,
} from '../../src/index.js';
import {
  createAtlasFixture,
  createGlyphFixture,
  createPanelFixture,
  createPcm16Wav,
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
const owned: { destroy(): void }[] = [];
const urls: string[] = [];
let released = false;
let monitor: number | undefined;
function ownFixture<T extends { texture: { destroy(): void } }>(fixture: T): T {
  if (released) fixture.texture.destroy();
  else owned.push(fixture.texture);
  return fixture;
}
function cleanup(): void {
  if (released) return;
  released = true;
  listeners.abort();
  window.clearInterval(monitor);
  try {
    game?.destroy();
  } finally {
    for (const asset of owned) asset.destroy();
    for (const url of urls) URL.revokeObjectURL(url);
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
try {
  const [atlas, glyphs, panel] = await Promise.all([
    createAtlasFixture().then(ownFixture),
    createGlyphFixture().then(ownFixture),
    createPanelFixture().then(ownFixture),
  ]);
  if (released) throw new Error('Example was disposed during initialization.');
  game = await Game.create({
    canvas: '#game',
    renderer: backend.value as RendererPreference,
    width: 800,
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
  const sampleURL = URL.createObjectURL(
    new Blob([createPcm16Wav()], { type: 'audio/wav' }),
  );
  urls.push(sampleURL);
  const musicURL = new URL('../sprite/music.json', import.meta.url).href;
  const textureURL = new URL('../sprite/texture.png', import.meta.url).href;
  const sheet = new SpriteSheet(atlas.texture, [
    atlas.regions.red,
    atlas.regions.green,
    atlas.regions.blue,
  ]);
  const tiles = new SpriteSheet(atlas.texture, [
    atlas.regions.cyanTile,
    atlas.regions.orangeTile,
    atlas.regions.violetTile,
  ]);
  const font = new SpriteFont(
    new SpriteSheet(glyphs.texture, Object.values(glyphs.regions)),
    { alphabet: glyphs.alphabet, lineHeight: 10, fallback: '0' },
  );
  let serial = 0;
  let request = 0;
  let pcm: SamplePlayback | undefined;
  class Showcase extends Scene {
    readonly id = ++serial;
    readonly group = new Group2D();
    readonly animated = sheet.createSprite(0);
    readonly map = new TileMap({
      columns: 48,
      rows: 2,
      tileWidth: 24,
      tileHeight: 24,
      sheet: tiles,
    });
    readonly iso = new IsometricMap({
      columns: 4,
      rows: 3,
      tileWidth: 40,
      tileHeight: 20,
      elevationStep: 8,
      sheet: tiles,
    });
    readonly bodies: Sprite[] = [];
    readonly emitters: ParticleEmitter[] = [];
    readonly material = new Material2D({
      wgsl: 'fn effect(color:vec4f,uv:vec2f,screen:vec2f)->vec4f { return color * uniformValue(0); }',
      glsl: 'vec4 effect(vec4 color,vec2 uv,vec2 screen) { return color * uniformValue(0); }',
      uniforms: [0.3, 1, 0.5, 1],
    });
    readonly processor = new PostProcessor2D({
      wgsl: 'fn effect(color:vec4f,uv:vec2f,screen:vec2f)->vec4f { return color.grba; }',
      glsl: 'vec4 effect(vec4 color,vec2 uv,vec2 screen) { return color.grba; }',
    });
    spinning = true;
    following = false;
    ticks = 0;
    elapsed = 0;
    collisions = 0;
    triggers = 0;
    music?: AudioAsset;
    sample?: SampleAudioAsset;
    sharedImage?: Texture;
    protected override preload(): PreloadBatch {
      const batch = new PreloadBatch([
        runtime.audio.opmTask('music', musicURL),
        runtime.audio.sampleTask('pcm', sampleURL),
        runtime.assets.textureTask('shared-image', textureURL),
      ]);
      batch.addEventListener('progress', () => {
        if (released || this.destroyed) return;
        const progress = batch.progress;
        document.querySelector<HTMLProgressElement>('#progress')!.value =
          progress.ratio;
        text(
          'loading',
          `Scene ${this.id}: ${progress.completed}/${progress.total} actual resources · ${batch.state} · Game.loading owns batch ${runtime.loading === batch}`,
        );
      });
      batch.addEventListener('complete', () => {
        text(
          'loading',
          `Scene ${this.id}: 3/3 actual resources · ready · Game.loading owned batch at completion ${runtime.loading === batch}`,
        );
      });
      return batch;
    }
    protected override async initialize(): Promise<void> {
      [this.music, this.sample, this.sharedImage] = await Promise.all([
        runtime.audio.load(musicURL),
        runtime.audio.loadSample(sampleURL),
        runtime.assets.loadTexture(textureURL),
      ]);
      if (runtime.graphics.backend !== 'canvas2d') {
        await Promise.all([
          runtime.graphics.prepareMaterial(this.material),
          runtime.graphics.preparePostProcessor(this.processor),
        ]);
      }
      this.group.position.set(270, 190);
      this.group.scale.set(3, 3);
      this.group.tint = [1, 0.8, 1, 1];
      const nested = this.group.add(new Group2D());
      nested.position.set(12, 0);
      nested.rotation = 0.4;
      nested.add(this.animated);
      this.animated.scale.set(2, 2);
      new FrameAnimation(
        this.animated,
        sheet.frames.map((source) => ({ source, duration: 0.3 })),
        { strategy: 'pingpong' },
      ).play();
      this.animated.draggable = true;
      this.animated.addEventListener('dragstart', () => {
        this.spinning = false;
      });
      this.animated.addEventListener('dragend', () => {
        this.spinning = true;
      });
      const flipped = this.group.add(
        new Sprite({
          texture: atlas.texture,
          source: atlas.regions.orangeTile,
          position: [-20, 16],
          scale: [-2, 2],
        }),
      );
      flipped.opacity = 0.7;
      this.add(this.group);
      const hud = this.add(new ScreenElement());
      const label = hud.add(new SpriteText(font, 'AB012\n210BA'));
      label.position.set(24, 24);
      label.scale.set(3, 3);
      label.draggable = true;
      for (const target of [this.animated, label])
        for (const name of [
          'pointerdown',
          'pointerup',
          'pointercancel',
          'dragstart',
          'dragmove',
          'dragend',
        ]) {
          target.addEventListener(name, (event) => {
            const detail = (event as CustomEvent<PointerTargetEventDetail>)
              .detail;
            text(
              'events',
              `${name}: pointer ${detail.pointerId}, local (${target.position.x.toFixed(1)}, ${target.position.y.toFixed(1)}), screen (${detail.screen.x.toFixed(1)}, ${detail.screen.y.toFixed(1)})`,
            );
          });
        }
      const modes = ['stretch', 'tile', 'tile-fit'] as const;
      for (let i = 0; i < modes.length; i++) {
        const frame = hud.add(
          new NineSlice(panel.texture, {
            ...panel.margins,
            source: panel.region,
            width: 86.5,
            height: 42.5,
            mode: modes[i],
          }),
        );
        frame.position.set(24 + i * 115, 360);
        frame.scale.set(1.2, 1.2);
      }
      hud.add(
        sheet.createSprite(2, {
          anchor: [0, 0],
          position: [740, 24],
          scale: [3, 3],
        }),
      ).zIndex = 100;
      hud.add(
        new Sprite({
          texture: this.sharedImage,
          position: [740, 132],
          scale: [0.5, 0.5],
        }),
      );
      this.map.position.set(24, 435);
      this.map.zIndex = -5;
      for (let row = 0; row < 2; row++)
        for (let col = 0; col < 48; col++)
          this.map.setTile(col, row, {
            frame: (col + row + this.id) % 3,
            solid: row === 0,
          });
      this.add(this.map);
      this.iso.position.set(600, 340);
      this.iso.zIndex = -4;
      for (let row = 0; row < 3; row++)
        for (let col = 0; col < 4; col++)
          this.iso.setTile(col, row, {
            frame: (col + row) % 3,
            elevation: col === 2 ? 1 : 0,
            solid: true,
          });
      this.add(this.iso);
      this.physics.gravity.set(0, 300);
      const floor = this.add(
        new Sprite({
          texture: atlas.texture,
          source: atlas.regions.orangeTile,
          position: [620, 280],
          scale: [30, 1.5],
        }),
      );
      floor.collider = Colliders.box(240, 12);
      const trigger = this.add(
        new Trigger2D(Colliders.box(240, 24), {
          repeat: Infinity,
          onEnter: () => {
            this.triggers++;
          },
        }),
      );
      trigger.position.set(620, 220);
      const zone = this.add(
        new Sprite({
          texture: atlas.texture,
          source: atlas.regions.blue,
          position: [620, 220],
          scale: [20, 1],
        }),
      );
      zone.opacity = 0.15;
      for (let index = 0; index < 2; index++) {
        const body = this.add(
          sheet.createSprite(index, {
            position: [560 + index * 75, 100 - index * 40],
            scale: [1.5, 1.5],
          }),
        );
        body.collider =
          index === 0
            ? Colliders.box(24, 24)
            : Colliders.polygon([
                [-18, -9],
                [18, -9],
                [18, 9],
                [-18, 9],
              ]);
        body.body = new RigidBody2D({
          mass: index + 1,
          restitution: 0.45,
          friction: 0.6,
          angularDamping: 0.1,
        });
        body.rotation = index * 0.35;
        body.addEventListener('collisionstart', () => {
          this.collisions++;
        });
        this.bodies.push(body);
      }
      for (const space of ['local', 'world'] as const) {
        const emitter = this.add(
          new ParticleEmitter({
            texture: atlas.texture,
            source: atlas.regions.particle,
            capacity: 64,
            rate: 12,
            lifetime: [1, 2],
            speed: [20, 45],
            angle: [-2.8, -0.4],
            acceleration: [0, 25],
            startSize: [8, 8],
            endSize: [2, 2],
            startColor: space === 'local' ? [1, 0.7, 0.2, 1] : [0.2, 0.8, 1, 1],
            endColor: [0.3, 0.2, 1, 0],
            seed: 7,
            space,
          }),
        );
        emitter.position.set(space === 'local' ? 420 : 470, 120);
        emitter.start();
        this.emitters.push(emitter);
      }
    }
    override update(dt: number): void {
      this.ticks++;
      this.elapsed += dt;
      if (this.spinning) this.group.rotation += dt * 0.25;
      const movement = Math.sin(this.elapsed * 2) * 35;
      for (let index = 0; index < this.emitters.length; index++)
        this.emitters[index].position.x = 420 + index * 50 + movement;
    }
    protected override onDestroy(): void {
      this.material.destroy();
      this.processor.destroy();
      this.group.destroy();
      this.animated.destroy();
      this.map.destroy();
      this.iso.destroy();
    }
  }
  const active = (): Showcase => runtime.scene as Showcase;
  const bind = (id: string, action: () => void | Promise<void>): void => {
    document.querySelector(`#${id}`)!.addEventListener(
      'click',
      () => {
        try {
          void Promise.resolve(action()).catch(report);
        } catch (error) {
          report(error);
        }
      },
      { signal: listeners.signal },
    );
  };
  await runtime.setScene(new Showcase());
  runtime.start();
  text(
    'status',
    `Running ${runtime.graphics.backend} — P13–P20 real consumer; HUD stays fixed when camera moves.`,
  );
  for (const button of document.querySelectorAll<HTMLButtonElement>('button'))
    button.disabled = false;
  bind('pause', () => {
    if (runtime.state === 'running') runtime.pause();
    else if (runtime.state === 'paused') runtime.resume();
    text('pause', runtime.state === 'paused' ? 'Resume' : 'Pause');
  });
  bind('camera', () => {
    const scene = active();
    const moved = scene.camera2D.position.x === 0;
    scene.camera2D.position.set(moved ? 80 : 0, moved ? 30 : 0);
    scene.camera2D.zoom = moved ? 1.3 : 1;
  });
  bind('visibility', () => {
    active().group.visible = !active().group.visible;
  });
  bind('actions', () => {
    const scene = active();
    scene.group.actions.clear();
    scene.group.actions.run(
      Actions.sequence(
        Actions.parallel(
          Actions.moveTo(440, 250, 1, Easings.sineInOut),
          Actions.fadeTo(0.25, 1),
        ),
        Actions.delay(0.2),
        Actions.parallel(
          Actions.moveTo(270, 190, 1, Easings.sineInOut),
          Actions.fadeTo(1, 1),
        ),
        Actions.call(() =>
          text(
            'status',
            `Running ${runtime.graphics.backend} — action sequence completed.`,
          ),
        ),
      ),
    );
  });
  bind('follow', () => {
    const scene = active();
    scene.camera2D.clearBehaviors();
    scene.following = !scene.following;
    if (scene.following) {
      scene.camera2D.addBehavior(
        CameraStrategies.follow(scene.animated, { smoothTime: 0.15 }),
      );
      scene.camera2D.addBehavior(
        CameraStrategies.bounds({ x: 0, y: 0, width: 1200, height: 800 }),
      );
    }
    text(
      'status',
      `Running ${runtime.graphics.backend} — camera follow ${scene.following ? 'enabled' : 'disabled'}.`,
    );
  });
  bind('shake', () => {
    active().camera2D.shake({
      duration: 1,
      amplitude: [12, 8],
      frequency: 20,
      seed: 7,
    });
  });
  const impulse = new Vector2(35, -180);
  const impulsePoint = new Vector2();
  bind('impulse', () => {
    const scene = active();
    scene.bodies.forEach((body) => {
      impulsePoint.set(body.position.x + 8, body.position.y);
      body.body!.applyImpulse(impulse, impulsePoint);
    });
  });
  bind('tile', () => {
    const scene = active();
    const tile = scene.map.getTile(2, 0);
    scene.map.setTile(2, 0, {
      frame: ((tile.frame ?? 0) + 1) % 3,
      solid: !tile.solid,
    });
    const iso = scene.iso.getTile(2, 1);
    scene.iso.setTile(2, 1, { elevation: iso.elevation ? 0 : 1 });
    text(
      'tile-status',
      `Orthogonal (2,0): frame ${scene.map.getTile(2, 0).frame}, solid ${scene.map.getTile(2, 0).solid}; isometric (2,1): elevation ${scene.iso.getTile(2, 1).elevation}`,
    );
  });
  bind('particles', () => {
    const emitters = active().emitters;
    emitters.forEach((emitter) =>
      emitter.emitting ? emitter.stop() : emitter.start(),
    );
  });
  bind('emit', () => {
    active().emitters.forEach((emitter) => emitter.emit(24));
  });
  let audioRequest = 0;
  bind('audio', async () => {
    const version = ++audioRequest;
    await runtime.audio.unlock();
    if (released || version !== audioRequest) return;
    const scene = active();
    scene.music!.stop();
    scene.music!.play({ channel: 'music', scene });
    pcm?.stop();
    const playback = await scene.sample!.play({
      channel: 'sfx',
      scene,
      loop: true,
      volume: 0.4,
    });
    if (released || version !== audioRequest || active() !== scene) {
      playback.stop();
      return;
    }
    pcm = playback;
    text(
      'audio-status',
      `OPM music + native PCM: ${pcm.state}, decoded ${scene.sample!.decoded}, ${scene.sample!.duration}s; shared eight-context adapter`,
    );
  });
  bind('pcm-pause', () => {
    if (!pcm) throw new Error('Unlock and play audio first.');
    if (pcm.state === 'paused') pcm.resume();
    else pcm.pause();
    text(
      'audio-status',
      `PCM ${pcm.state} at ${pcm.position.toFixed(3)}s; OPM remains independent`,
    );
  });
  bind('pcm-seek', () => {
    if (!pcm) throw new Error('Unlock and play audio first.');
    pcm.playbackRate = 1.5;
    pcm.seek(0.2);
    text(
      'audio-status',
      `PCM ${pcm.state}: seek 0.2s, rate ${pcm.playbackRate}, loop ${pcm.loop}`,
    );
  });
  bind('audio-stop', () => {
    audioRequest++;
    pcm?.stop();
    active().music!.stop();
    text('audio-status', 'PCM + OPM stopped');
  });
  document.querySelector<HTMLInputElement>('#volume')!.addEventListener(
    'input',
    (event) => {
      runtime.audio.master.volume =
        Number((event.target as HTMLInputElement).value) / 100;
      text('volume-value', `${Math.round(runtime.audio.master.volume * 100)}%`);
    },
    { signal: listeners.signal },
  );
  bind('material', async () => {
    const scene = active();
    try {
      await runtime.graphics.prepareMaterial(scene.material);
      if (active() === scene && !released) {
        scene.animated.material = scene.animated.material
          ? undefined
          : scene.material;
        text(
          'effects',
          `Native Sprite material ${scene.animated.material ? 'enabled' : 'disabled'} · ${runtime.graphics.backend}`,
        );
      }
    } catch (error) {
      if (!(error instanceof UnsupportedGraphicsError)) throw error;
      text('effects', `${error.name}: ${error.message}`);
    }
  });
  bind('post', async () => {
    const scene = active();
    try {
      await runtime.graphics.preparePostProcessor(scene.processor);
      if (active() === scene && !released) {
        if (scene.effects2D.length) scene.effects2D.length = 0;
        else scene.effects2D.push(scene.processor);
        text(
          'effects',
          `Native world + HUD post ${scene.effects2D.length ? 'enabled' : 'disabled'} · ${runtime.graphics.backend}`,
        );
      }
    } catch (error) {
      if (!(error instanceof UnsupportedGraphicsError)) throw error;
      text('effects', `${error.name}: ${error.message}`);
    }
  });
  for (const name of [
    'transitionstart',
    'transitioncomplete',
    'transitioncancel',
  ])
    runtime.addEventListener(
      name,
      () => {
        text('transition-events', `${name} · published Scene ${active().id}`);
      },
      { signal: listeners.signal },
    );
  bind('transition', () => {
    const version = ++request;
    const next = new Showcase();
    const kind = document.querySelector<HTMLSelectElement>('#transition-kind')!
      .value as 'fade' | 'crossfade' | 'slide';
    text(
      'transition-status',
      `Preparing Scene ${next.id} · ${kind}; old remains active until capture succeeds`,
    );
    void runtime
      .setScene(next, {
        transition: {
          kind,
          duration: 1.5,
          easing: Easings.sineInOut,
          direction: 'left',
          color: [0.1, 0.2, 0.4, 1],
          blockInput: true,
        },
      })
      .then(() => {
        if (request === version && !released)
          text('transition-status', `Completed ${kind} · Scene ${active().id}`);
      })
      .catch((error) => {
        if (request === version && !released) {
          text(
            'transition-status',
            error instanceof Error ? error.message : String(error),
          );
          report(error);
        }
      });
  });
  bind('cancel', async () => {
    const version = ++request;
    const scene = runtime.scene;
    if (scene) await runtime.setScene(scene);
    if (version === request && !released)
      text(
        'transition-status',
        `Cancelled pending/effect · retained published Scene ${active().id}`,
      );
  });
  bind('destroy', () => {
    cleanup();
    text(
      'status',
      'Destroyed: Game, scenes, descriptor pipelines, borrowed fixtures, audio contexts and object URL released.',
    );
    for (const button of document.querySelectorAll<HTMLButtonElement>('button'))
      button.disabled = true;
  });
  const visibleTiles = (map: TileMap): number => {
    let count = 0;
    for (const child of map.children)
      if (child instanceof Sprite && child.renderEnabled) count++;
    return count;
  };
  monitor = window.setInterval(() => {
    if (released || !runtime.scene) return;
    const scene = active();
    text(
      'simulation',
      `Scene ${scene.id} · ticks ${scene.ticks} · ${runtime.state} · transitioning ${runtime.transitioning} · loading ${runtime.loading?.state ?? 'none'} · body y ${scene.bodies[0].position.y.toFixed(1)}/${scene.bodies[1].position.y.toFixed(1)} · contacts ${scene.collisions} · triggers ${scene.triggers} · local/world particles ${scene.emitters[0].activeCount}/${scene.emitters[1].activeCount} · visible tiles ${visibleTiles(scene.map)}/96 + ${visibleTiles(scene.iso)}/12`,
    );
  }, 200);
} catch (error) {
  report(error);
  cleanup();
}

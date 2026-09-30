import {
  Game,
  Scene,
  Sprite,
  Primitive2D,
  Mesh,
  Geometry,
  TextureMaterial,
  type AudioAsset,
  type RendererPreference,
  type Texture,
} from '../../src/index.js';

const backend = document.querySelector<HTMLSelectElement>('#backend')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;
const audioStatus =
  document.querySelector<HTMLParagraphElement>('#audio-status')!;
const pause = document.querySelector<HTMLButtonElement>('#pause')!;
const switchScene = document.querySelector<HTMLButtonElement>('#switch-scene')!;
const audio = document.querySelector<HTMLButtonElement>('#audio')!;
const sfx = document.querySelector<HTMLButtonElement>('#sfx')!;
const stopMusic = document.querySelector<HTMLButtonElement>('#stop-music')!;
const volume = document.querySelector<HTMLInputElement>('#volume')!;
const volumeValue = document.querySelector<HTMLOutputElement>('#volume-value')!;

const selected = new URLSearchParams(location.search).get('renderer');
backend.value =
  selected && ['auto', 'webgpu', 'webgl2', 'canvas2d'].includes(selected)
    ? selected
    : 'auto';
backend.addEventListener('change', () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
});

class ShowcaseScene extends Scene {
  private readonly sprite: Sprite;
  private readonly badge: Primitive2D;
  private readonly cube?: Mesh;
  private readonly sphere?: Mesh;
  private angle = 0;

  constructor(texture: Texture, badge: Primitive2D, threeD: boolean) {
    super();
    this.badge = this.add(badge);
    this.badge.position.set(175, 92);
    this.badge.zIndex = 1;
    this.sprite = this.add(
      new Sprite({
        texture,
        position: [105, 92],
        scale: [1.5, 1.5],
        rotation: -0.2,
      }),
    );
    if (threeD) {
      const material = new TextureMaterial({ texture });
      this.cube = this.add(
        new Mesh({
          geometry: Geometry.cube(),
          material,
          position: [-1.2, 0, 0],
        }),
      );
      this.sphere = this.add(
        new Mesh({
          geometry: Geometry.sphere(),
          material,
          position: [1.2, 0, -0.6],
        }),
      );
      this.camera3D.position.set(0, 0, 5);
      this.ambientLight = 0.35;
      this.directionalLight.intensity = 0.85;
    }
  }

  override update(dt: number): void {
    this.angle += dt;
    this.sprite.rotation = -0.2 + Math.sin(this.angle * 1.2) * 0.18;
    this.badge.position.set(175, 92 + Math.sin(this.angle * 2) * 14);
    this.cube?.rotation.setFromEuler(this.angle * 0.6, this.angle, 0);
    this.sphere?.rotation.setFromEuler(0, -this.angle * 0.9, 0);
  }
}

async function createScene(
  texture: Texture,
  threeD: boolean,
  alternate: boolean,
): Promise<ShowcaseScene> {
  const badge = await Primitive2D.circle(18, alternate ? '#ffda59' : '#6ce4eb');
  return new ShowcaseScene(texture, badge, threeD);
}

let game: Game | undefined;
try {
  game = await Game.create({
    canvas: '#game',
    width: 800,
    height: 450,
    renderer: backend.value as RendererPreference,
  });
  const runtime = game;
  runtime.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) runtime.destroy();
  });
  const texture = await runtime.assets.loadTexture(
    new URL('../sprite/texture.png', import.meta.url).href,
  );
  const threeD = runtime.graphics.capabilities.threeD;
  const describe = (alternate: boolean): void => {
    status.textContent = `${runtime.graphics.backend} · 2D animated Sprite + Primitive overlay · ${threeD ? 'lit, depth-tested 3D cube + sphere' : 'Canvas2D has no 3D; 2D + audio remain available'} · Scene ${alternate ? 'B' : 'A'}`;
  };
  await runtime.setScene(await createScene(texture, threeD, false));
  runtime.start();
  describe(false);
  pause.disabled = switchScene.disabled = false;
  pause.addEventListener('click', () => {
    if (runtime.state === 'running') {
      runtime.pause();
      pause.textContent = 'Resume animation';
    } else if (runtime.state === 'paused') {
      runtime.resume();
      pause.textContent = 'Pause animation';
    }
  });

  let alternate = false;
  switchScene.addEventListener('click', () => {
    switchScene.disabled = audio.disabled = sfx.disabled = true;
    let next: ShowcaseScene | undefined;
    void (async () => {
      try {
        next = await createScene(texture, threeD, !alternate);
        if (runtime.state === 'destroyed') {
          next.destroy();
          return;
        }
        await runtime.setScene(next);
        alternate = !alternate;
        describe(alternate);
        stopMusic.disabled = true;
        audioStatus.textContent = runtime.audio.unlocked
          ? 'Scene switched · nonpersistent music stopped; play it again when ready.'
          : 'Scene switched · audio still locked.';
      } catch (error) {
        if (next && runtime.scene !== next && !next.destroyed) next.destroy();
        status.textContent =
          error instanceof Error ? error.message : String(error);
      } finally {
        if (runtime.state !== 'destroyed') {
          switchScene.disabled = false;
          audio.disabled = !music;
          sfx.disabled = !sound || !runtime.audio.unlocked;
        }
      }
    })();
  });

  runtime.audio.master.volume = Number(volume.value) / 100;
  volume.disabled = false;
  volume.addEventListener('input', () => {
    runtime.audio.master.volume = Number(volume.value) / 100;
    volumeValue.value = `${volume.value}%`;
  });

  let music: AudioAsset | undefined;
  let sound: AudioAsset | undefined;
  void Promise.all([
    runtime.audio.load(new URL('../sprite/music.json', import.meta.url).href),
    runtime.audio.load(new URL('../sprite/sfx.json', import.meta.url).href),
  ])
    .then(([loadedMusic, loadedSound]) => {
      if (runtime.state === 'destroyed') return;
      music = loadedMusic;
      sound = loadedSound;
      audio.disabled = switchScene.disabled;
      audioStatus.textContent =
        'Audio ready · click Enable audio & play music.';
      audio.addEventListener('click', () => {
        audio.disabled = switchScene.disabled = true;
        void (async () => {
          try {
            await runtime.audio.unlock();
            if (runtime.state === 'destroyed') return;
            loadedMusic.stop();
            loadedMusic.play();
            sfx.disabled = stopMusic.disabled = false;
            audio.textContent = 'Restart music';
            audioStatus.textContent =
              'Music playing · scene-owned, nonpersistent.';
          } catch (error) {
            audioStatus.textContent =
              error instanceof Error ? error.message : String(error);
          } finally {
            if (runtime.state !== 'destroyed') {
              audio.disabled = false;
              switchScene.disabled = false;
            }
          }
        })();
      });
      sfx.addEventListener('click', () => {
        try {
          loadedSound.play();
          audioStatus.textContent = 'SFX played alongside music.';
        } catch (error) {
          audioStatus.textContent =
            error instanceof Error ? error.message : String(error);
        }
      });
      stopMusic.addEventListener('click', () => {
        loadedMusic.stop();
        stopMusic.disabled = true;
        audioStatus.textContent =
          'Music stopped · click Restart music to play again.';
      });
    })
    .catch((error: unknown) => {
      if (runtime.state !== 'destroyed')
        audioStatus.textContent =
          error instanceof Error ? error.message : String(error);
    });
} catch (error) {
  game?.destroy();
  status.textContent = error instanceof Error ? error.message : String(error);
}

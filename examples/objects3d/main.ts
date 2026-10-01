import {
  Billboard,
  Game,
  Geometry,
  Line3D,
  LOD,
  Mesh,
  Scene,
  Sprite3D,
  SpriteSheet,
  Text3D,
  TextureMaterial,
  Vector3,
  type RendererPreference,
} from '../../src/index.js';

const $ = <T extends HTMLElement>(id: string): T =>
  document.querySelector<T>(`#${id}`)!;
const backend = $<HTMLSelectElement>('backend');
const distance = $<HTMLInputElement>('distance');
const orbit = $<HTMLInputElement>('orbit');
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
  const sheet = SpriteSheet.grid(texture, {
    frameWidth: Math.max(1, Math.floor(texture.width / 2)),
    frameHeight: Math.max(1, Math.floor(texture.height / 2)),
  });

  class Gallery extends Scene {
    readonly lod = new LOD();
    readonly card = this.add(
      new Billboard({
        material,
        width: 1.4,
        height: 1.4,
        position: [-3, 1, 0],
      }),
    );
    readonly sprite = this.add(
      new Sprite3D({
        texture,
        source: sheet.getFrame(0),
        width: 1.2,
        height: 1.2,
        position: [-3, -1, 0],
      }),
    );
    readonly ribbon = this.add(
      new Line3D(
        Array.from({ length: 48 }, (_, i): [number, number, number] => {
          const t = (i / 47) * Math.PI * 4;
          return [
            3 + Math.cos(t) * 0.8,
            -0.8 + (i / 47) * 3,
            Math.sin(t) * 0.8,
          ];
        }),
        { material, width: 0.18 },
      ),
    );
    label: Text3D | undefined;

    constructor() {
      super();
      // Detail falls off with distance: 32, 12 and 6 segment spheres, then a plain cube.
      const detail = [
        new Mesh({ geometry: Geometry.sphere(0.8, 32, 16), material }),
        new Mesh({ geometry: Geometry.sphere(0.8, 12, 6), material }),
        new Mesh({ geometry: Geometry.sphere(0.8, 6, 3), material }),
        new Mesh({ geometry: Geometry.cube(1.2), material }),
      ];
      [0, 10, 18, 28].forEach((from, i) => this.lod.addLevel(detail[i]!, from));
      this.lod.hysteresis = 0.5;
      this.lod.position.set(0, 0, 0);
      this.add(this.lod);
      this.camera3D.far = 200;
    }

    aim(cameraDistance: number, degrees: number): void {
      const angle = (degrees * Math.PI) / 180;
      this.camera3D.position.set(
        Math.sin(angle) * cameraDistance,
        2,
        Math.cos(angle) * cameraDistance,
      );
      this.camera3D.lookAt(new Vector3(0, 0.5, 0));
    }
  }

  const scene = new Gallery();
  scene.label = await Text3D.create('Text3D', {
    fontSize: 72,
    height: 0.6,
    position: [0, 2, 0],
    color: '#ffe08a',
  });
  scene.add(scene.label);
  let frame = 0;
  $('frame').addEventListener('click', () => {
    frame = (frame + 1) % sheet.frames.length;
    scene.sprite.setSource(sheet.getFrame(frame));
  });
  const aim = (): void => {
    scene.aim(Number(distance.value), Number(orbit.value));
    $('distance-value').textContent = Number(distance.value).toFixed(1);
    $('orbit-value').textContent = `${orbit.value}°`;
  };
  distance.addEventListener('input', aim);
  orbit.addEventListener('input', aim);
  aim();
  await runtime.setScene(scene);
  runtime.start();
  const report = window.setInterval(() => {
    const names = ['sphere 32×16', 'sphere 12×6', 'sphere 6×3', 'cube'];
    $('info').textContent =
      `LOD level ${scene.lod.level} (${names[scene.lod.level] ?? 'not yet chosen'}) at distance ${Number(distance.value).toFixed(1)}\nbillboard facing ${scene.card.mode}, ribbon points ${scene.ribbon.pointCount}, Sprite3D frame ${frame + 1}/${sheet.frames.length}`;
  }, 100);
  status.textContent = `${runtime.graphics.backend} · LOD, Billboard, Sprite3D, Text3D, Line3D`;
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    window.clearInterval(report);
    runtime.destroy();
  });
} catch (error) {
  game?.destroy();
  status.textContent = error instanceof Error ? error.message : String(error);
}

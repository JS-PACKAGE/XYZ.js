import {
  Game,
  Scene,
  Mesh,
  Geometry,
  TextureMaterial,
  Sprite,
} from '../../src/index.js';

const status = document.querySelector<HTMLParagraphElement>('#status')!;
let game: Game | undefined;
try {
  game = await Game.create({ canvas: '#game', width: 800, height: 450 });
  game.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });
  const texture = await game.assets.loadTexture(
    new URL('../sprite/texture.png', import.meta.url).href,
  );
  const material = new TextureMaterial({ texture });
  class CubeScene extends Scene {
    readonly cube = this.add(new Mesh({ geometry: Geometry.cube(), material }));
    readonly sphere = this.add(
      new Mesh({ geometry: Geometry.sphere(), material }),
    );
    readonly overlay = this.add(
      new Sprite({
        texture,
        position: [50, 50],
        scale: [0.75, 0.75],
        opacity: 0.8,
      }),
    );
    private angle = 0;
    constructor() {
      super();
      this.cube.position.set(-1, 0, 0);
      this.sphere.position.set(1, 0, -0.4);
      this.camera3D.position.set(0, 0, 5);
    }
    override update(dt: number): void {
      this.angle += dt * 0.6;
      this.cube.rotation.setFromEuler(this.angle * 0.7, this.angle, 0);
      this.sphere.rotation.setFromEuler(0, -this.angle, 0);
    }
  }
  await game.setScene(new CubeScene());
  game.start();
  status.textContent = `${game.graphics.backend} · Textured cube / sphere · Depth + ambient / directional light · 2D overlay`;
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) game?.destroy();
  });
} catch (error) {
  game?.destroy();
  status.textContent = error instanceof Error ? error.message : String(error);
}

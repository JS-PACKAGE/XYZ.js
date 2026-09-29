import {
  Game,
  Scene,
  Sprite,
  Mesh,
  Geometry,
  TextureMaterial,
  Primitive2D,
  type RendererPreference,
} from '../../src/index.js';
const select = document.querySelector<HTMLSelectElement>('#backend')!;
select.value = new URLSearchParams(location.search).get('renderer') ?? 'auto';
select.addEventListener('change', () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', select.value);
  location.href = url.href;
});
const status = document.querySelector<HTMLParagraphElement>('#status')!;
let game: Game | undefined;
try {
  game = await Game.create({
    canvas: '#game',
    width: 640,
    height: 360,
    renderer: select.value as RendererPreference,
  });
  game.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });
  const texture = await game.assets.loadTexture(
    new URL('../sprite/texture.png', import.meta.url).href,
  );
  const scene = new Scene();
  scene.add(
    new Sprite({
      texture,
      position: [180, 170],
      scale: [2, 2],
      rotation: -0.2,
    }),
  );
  scene.add(
    new Sprite({
      texture,
      position: [230, 190],
      scale: [2, 2],
      opacity: 0.5,
      zIndex: 1,
    }),
  );
  const circle = await Primitive2D.circle(18, '#ffffff');
  circle.position.set(50, 50);
  scene.add(circle);
  if (game.graphics.capabilities.threeD)
    scene.add(
      new Mesh({
        geometry: Geometry.cube(),
        material: new TextureMaterial({ texture }),
        position: [1.8, 0, 0],
        rotation: [0.3, 0.5, 0],
      }),
    );
  await game.setScene(scene);
  game.start();
  status.textContent = `Backend: ${game.graphics.backend} · Capabilities: ${JSON.stringify(game.graphics.capabilities)}`;
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) game?.destroy();
  });
} catch (error) {
  game?.destroy();
  status.textContent = error instanceof Error ? error.message : String(error);
}

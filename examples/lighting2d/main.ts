import {
  Game,
  Scene,
  Sprite,
  CanvasTexture2D,
  Light2D,
  Lighting2D,
} from '../../src/index.js';
const status = document.querySelector<HTMLElement>('#status')!;
const backend =
  new URLSearchParams(location.search).get('renderer') ?? 'webgpu';
let game: Game | undefined;
try {
  if (
    backend !== 'auto' &&
    backend !== 'webgpu' &&
    backend !== 'webgl2' &&
    backend !== 'canvas2d'
  )
    throw new Error('Unknown backend');
  game = await Game.create({
    canvas: '#game',
    width: 640,
    height: 360,
    renderer: backend,
  });
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = albedoCanvas.height = 128;
  const color = albedoCanvas.getContext('2d')!;
  color.fillStyle = '#e3af65';
  color.fillRect(0, 0, 128, 128);
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = normalCanvas.height = 128;
  const context = normalCanvas.getContext('2d')!;
  const pixels = context.createImageData(128, 128);
  for (let y = 0; y < 128; y++)
    for (let x = 0; x < 128; x++) {
      const nx = (x - 63.5) / 80,
        ny = (y - 63.5) / 80;
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      const length = Math.hypot(nx, ny, nz),
        o = (y * 128 + x) * 4;
      pixels.data[o] = (nx / length + 1) * 127.5;
      pixels.data[o + 1] = (ny / length + 1) * 127.5;
      pixels.data[o + 2] = (nz / length + 1) * 127.5;
      pixels.data[o + 3] = 255;
    }
  context.putImageData(pixels, 0, 0);
  const texture = new CanvasTexture2D(albedoCanvas),
    normalTexture = new CanvasTexture2D(normalCanvas);
  const light = new Light2D({
    position: [240, 160],
    height: 75,
    radius: 300,
    intensity: 2,
    color: [1, 0.8, 0.6],
  });
  const lighting = new Lighting2D({
    ambient: [0.08, 0.08, 0.12],
    lights: [light],
  });
  const scene = new Scene();
  scene.add(
    new Sprite({
      texture,
      normalTexture,
      lighting,
      position: [210, 180],
      scale: [1.5, 1.5],
    }),
  );
  scene.add(
    new Sprite({
      texture,
      normalTexture,
      lighting,
      position: [430, 180],
      scale: [-1.5, 1.5],
      skew: [0.25, 0],
      rotation: 0.25,
    }),
  );
  document
    .querySelector<HTMLCanvasElement>('#game')!
    .addEventListener('pointermove', (event) => {
      const rect = (
        event.currentTarget as HTMLCanvasElement
      ).getBoundingClientRect();
      light.position[0] = ((event.clientX - rect.left) * 640) / rect.width;
      light.position[1] = ((event.clientY - rect.top) * 360) / rect.height;
    });
  game.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });
  await game.setScene(scene);
  game.start();
  status.textContent = `${game.graphics.backend}: move pointer to move the light. Right sprite is reflected and sheared. Canvas explicitly rejects lighting.`;
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) {
      game?.destroy();
      texture.destroy();
      normalTexture.destroy();
    }
  });
} catch (error) {
  game?.destroy();
  status.textContent = String(error);
}

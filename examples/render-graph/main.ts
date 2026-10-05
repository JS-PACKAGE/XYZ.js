import {
  Game,
  Scene,
  Mesh,
  Geometry,
  PBRMaterial,
  Texture,
  Sprite,
  Vector3,
  type RendererPreference,
} from '../../src/index.js';
import { createChannelGraph } from './graph.js';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!,
  status = document.querySelector<HTMLParagraphElement>('#status')!,
  amount = document.querySelector<HTMLInputElement>('#amount')!;
const preference = (new URLSearchParams(location.search).get('renderer') ??
  'auto') as RendererPreference;
const channels = createChannelGraph(0.5);
let game: Game | undefined, texture: Texture | undefined;
try {
  game = await Game.create({
    canvas,
    width: 640,
    height: 360,
    renderer: preference,
  });
  if (!game.graphics.prepareRenderGraph)
    throw new Error('This renderer does not support native render graphs.');
  await game.graphics.prepareRenderGraph(channels.graph);
  const image = new OffscreenCanvas(8, 8),
    context = image.getContext('2d')!;
  context.fillStyle = '#e0b0ff';
  context.fillRect(0, 0, 8, 8);
  texture = await Texture.fromImage(image);
  class GraphWorld extends Scene {
    constructor() {
      super();
      this.renderGraph = channels.graph;
      this.ambientLight = 0.8;
      this.camera3D.position.set(0, 1, 6);
      this.camera3D.lookAt(new Vector3(0, 0, 0));
      this.add(
        new Mesh({
          geometry: Geometry.sphere(1.2, 24, 16),
          material: new PBRMaterial({
            texture: texture!,
            color: [0.8, 0.8, 1],
            roughness: 0.6,
          }),
        }),
      );
      this.add(
        new Sprite({ texture: texture!, position: [24, 24], scale: [8, 8] }),
      );
    }
    override update(delta: number): void {
      super.update(delta);
      channels.merge.setUniforms([Number(amount.value)]);
    }
  }
  await game.setScene(new GraphWorld());
  game.start();
  status.textContent = `${game.graphics.backend}: real 3D + HUD → red/full-resolution and blue/half-resolution → native two-input merge → canvas. Transitions remain after the graph.`;
} catch (error) {
  status.textContent = error instanceof Error ? error.message : String(error);
}
window.addEventListener(
  'pagehide',
  () => {
    game?.destroy();
    channels.destroy();
    texture?.destroy();
  },
  { once: true },
);

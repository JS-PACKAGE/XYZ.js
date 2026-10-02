import {
  Game,
  GameObject,
  Colliders,
  FactoryRegistry,
  TiledContent,
  tiledContentFactory,
  produceTiledContentNode,
  parseContentScene,
  buildContentScene,
  type RendererPreference,
} from '../../src/index.js';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const status = document.querySelector<HTMLElement>('#status')!;
const buttons = [...document.querySelectorAll<HTMLButtonElement>('button')];
let game: Game | undefined;

async function start(): Promise<void> {
  game = await Game.create({
    canvas,
    renderer: (new URLSearchParams(location.search).get('renderer') ??
      'auto') as RendererPreference,
    width: 768,
    height: 384,
    autoResize: false,
  });
  const registry = new FactoryRegistry({ tiled: tiledContentFactory });
  try {
    // Vite serves/copies public assets unchanged, preserving Tiled's relative TSJ/image URLs.
    const mapURL = new URL(
      '../../tiled-import/orthogonal.tmj',
      window.location.href,
    ).href;
    const node = await produceTiledContentNode(game.resources, 'level', {
      url: mapURL,
    });
    const definition = parseContentScene(registry, {
      version: 1,
      nodes: [node],
    });
    const content = await buildContentScene(
      registry,
      definition,
      game.resources,
      { resourcePool: game.resources },
    );
    const root = content.getById('level');
    if (!(root instanceof TiledContent))
      throw new Error('Tiled content root is unavailable.');
    const level = root;
    content.scene.camera2D.zoom = 8;
    content.scene.camera2D.position.set(-8, -8);
    const physics = content.scene.physics;
    await game.setScene(content.scene);
    game.start();
    const probe = new GameObject();
    const shape = Colliders.circle(2);
    let changed = false;
    const describe = (): void => {
      probe.position.set(8, 8);
      const tileHits = physics.overlap(shape, probe).length;
      probe.position.set(40, 24);
      const wallHits = physics.overlap(shape, probe).length;
      status.textContent = `Loaded orthogonal.tmj → terrain.tsj → terrain.png\nFirst tile: ${changed ? 'blue, non-solid GID 2' : 'green, solid GID 1'}; tile collider hits: ${tileHits}\nImported wall collider hits: ${wallHits}; ground visible: ${level.layers.get(1)!.visible}\nValidated ContentScene, actual ${game!.graphics.backend} rendering and Scene physics.`;
    };
    document.querySelector<HTMLButtonElement>('#mutate')!.onclick = () => {
      changed = !changed;
      level.setGid(1, 0, 0, changed ? 2 : 1);
      describe();
    };
    document.querySelector<HTMLButtonElement>('#query')!.onclick = describe;
    document.querySelector<HTMLButtonElement>('#visibility')!.onclick = () => {
      const layer = level.layers.get(1)!;
      layer.visible = !layer.visible;
      describe();
    };
    document.querySelector<HTMLButtonElement>('#destroy')!.onclick = () => {
      game!.destroy();
      probe.destroy();
      for (const button of buttons) button.disabled = true;
      status.textContent = `Destroyed game, validated content and resource scope. Texture leases released: ${level.asset.scope.destroyed}.`;
    };
    for (const button of buttons) button.disabled = false;
    describe();
  } catch (error) {
    game.destroy();
    throw error;
  }
}

window.addEventListener('pagehide', () => game?.destroy(), { once: true });
void start().catch((error) => {
  status.textContent = `Tiled import failed: ${error instanceof Error ? error.message : String(error)}`;
  for (const button of buttons) button.disabled = true;
});

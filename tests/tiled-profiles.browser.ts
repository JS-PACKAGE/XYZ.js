import {
  Game,
  GameObject,
  Sprite,
  TiledContent,
  Colliders,
  RigidBody2D,
  FactoryRegistry,
  tiledContentFactory,
  produceTiledContentNode,
  parseContentScene,
  buildContentScene,
  type RendererPreference,
} from '../src/index.js';

/** Run through the Vite origin; preserves a real rendered surface until dispose(). */
export async function runTiledProfileSmoke(
  renderer: RendererPreference = 'canvas2d',
) {
  const host = document.createElement('section');
  const canvas = document.createElement('canvas');
  const status = document.createElement('pre');
  host.append(canvas, status);
  document.body.append(host);
  const game = await Game.create({
    canvas,
    renderer,
    width: 512,
    height: 384,
    autoResize: false,
    pixelRatio: 1,
  });
  const assert = (condition: boolean, message: string): void => {
    if (!condition) throw new Error(message);
  };
  try {
    const registry = new FactoryRegistry({ tiled: tiledContentFactory });
    const url = new URL('/tests/fixtures/tiled/infinite.tmj', location.href)
      .href;
    const node = await produceTiledContentNode(game.resources, 'level', {
      url,
    });
    const content = await buildContentScene(
      registry,
      parseContentScene(registry, { version: 1, nodes: [node] }),
      game.resources,
      { resourcePool: game.resources },
    );
    const level = content.getById('level');
    if (!(level instanceof TiledContent))
      throw new Error('Formal Tiled content missing');
    const scene = content.scene;
    scene.camera2D.zoom = 4;
    scene.physics.gravity.set(0, 100);
    await game.setScene(scene);
    const plane = level.tileMaps.get(12)!.get(level.asset.data.tilesets[0]!)!;
    const animated = [...plane.children].find(
      (child) => child instanceof Sprite,
    )! as Sprite;
    const body = new GameObject();
    body.position.set(24, 0);
    body.collider = Colliders.circle(3);
    body.body = new RigidBody2D({ restitution: 0 });
    scene.add(body);
    const target = game.graphics.createRenderTexture({
      width: 512,
      height: 384,
    });
    const pixels = async (): Promise<Uint8ClampedArray> => {
      await game.graphics.renderToTexture(target, scene);
      return game.graphics.extractPixels(target);
    };
    const sample = (bytes: Uint8ClampedArray): number[] =>
      Array.from(bytes.subarray((96 * 512 + 96) * 4, (96 * 512 + 96) * 4 + 4));
    const show = (): void => {
      status.textContent = `${game.graphics.backend}: negative chunks, nested .25 opacity, native gzip, animation, object template, repeating parallax image\nbody y=${body.position.y.toFixed(3)}, tile frame=${animated.animation?.frame ?? 'static'}, leases released=${level.asset.scope.destroyed}`;
    };
    const button = (label: string, action: () => void): void => {
      const control = document.createElement('button');
      control.textContent = label;
      control.onclick = () => {
        action();
        show();
        if (game.state === 'paused') {
          game.graphics.beginFrame();
          game.graphics.render(scene, 512, 384);
          game.graphics.endFrame();
        }
      };
      host.append(control);
    };
    button('Pan camera', () => {
      scene.camera2D.position.x += 8;
    });
    button('Toggle group', () => {
      const group = level.layers.get(10)!;
      group.visible = !group.visible;
    });
    button('Edit negative solid', () => {
      level.setGid(12, -2, -1, plane.getTile(-2, -1).solid ? 2 : 1);
    });
    button('Pause / resume', () => {
      if (game.state === 'paused') game.resume();
      else game.pause();
    });
    scene.beginObjectFrame();
    animated.animation!.goToFrame(0).pause();
    const first = sample(await pixels());
    scene.advanceFrameAnimations(0.11, () => true);
    const frozen = sample(await pixels());
    assert(
      first.every((value, i) => value === frozen[i]),
      'Paused animation changed native pixels',
    );
    animated.animation!.play();
    scene.advanceFrameAnimations(0.11, () => true);
    const changed = sample(await pixels());
    assert(
      first[1]! > first[2]! &&
        changed[2]! > changed[1]! &&
        changed[2]! > first[2]!,
      `Native animated atlas pixels did not change green to blue: ${JSON.stringify({ first, frozen, changed, frame: animated.animation!.frame, source: animated.source })}`,
    );
    animated.animation!.pause();
    assert(animated.worldOpacity === 0.25, 'Nested opacity inheritance failed');
    const tileWorld = plane.tileToWorld(-2, -1);
    assert(
      tileWorld.x === 16 && tileWorld.y === 16,
      'Negative tile world coordinate failed',
    );
    for (let i = 0; i < 240; i++) scene.physics.update(1 / 120);
    const restingY = body.position.y;
    assert(
      restingY > 12 && restingY < 14,
      'Imported negative-coordinate tile did not support body',
    );
    level.setGid(12, -2, -1, 2);
    level.setGid(12, -2, 0, 2);
    for (let i = 0; i < 120; i++) scene.physics.update(1 / 120);
    assert(
      body.position.y > 40,
      'Atomic tile edits did not retire solid ownership',
    );
    level.setGid(12, -2, -1, 1);
    level.setGid(12, -2, 0, 0x80000001);
    scene.camera2D.position.x = 40;
    assert(
      level.layers.get(14)!.updateWorldMatrix().elements[6] === 20,
      'Parallax did not follow current camera',
    );
    scene.camera2D.position.x = 0;
    animated.animation!.pause();
    game.start();
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    game.pause();
    show();
    target.destroy();
    return {
      host,
      canvas,
      game,
      scene,
      level,
      evidence: {
        backend: game.graphics.backend,
        first,
        frozen,
        changed,
        restingY,
        afterEditY: body.position.y,
      },
      dispose() {
        game.destroy();
        assert(
          level.asset.scope.destroyed,
          'Tiled leases survived Game.destroy',
        );
        host.remove();
      },
    };
  } catch (error) {
    game.destroy();
    host.remove();
    throw error;
  }
}

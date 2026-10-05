import {
  AtlasLoader,
  Scene,
  Sprite,
  Text2D,
  type AtlasAsset,
  type HotSceneContext,
} from '../../src/index.js';

export async function createScene({
  resources,
  signal,
}: HotSceneContext): Promise<Scene> {
  // Edit this label/color, or throw here to inspect transactional rejection.
  const scene = new Scene();
  resources.attach(() => scene.destroy());
  const label = await resources.acquire<Text2D>(
    {
      kind: 'custom',
      ownership: 'owned',
      async load(_signal, context) {
        return context.own(
          await Text2D.create('HOT SCENE · ONE GAME', {
            fontSize: 32,
            color: '#70eeff',
          }),
        );
      },
      dispose: (text) => text.destroy(),
    },
    { signal },
  );
  label.value.position.set(400, 225);
  scene.add(label.value);
  return scene;
}

/** Every candidate acquires a fresh atlas at its immutable generation URL. */
export async function createAssetScene(
  context: HotSceneContext,
  manifestURL: string,
): Promise<Scene> {
  const response = await fetch(manifestURL, {
    signal: context.signal,
    cache: 'no-store',
  });
  if (!response.ok)
    throw new Error(`Project manifest HTTP ${response.status}.`);
  const manifest = (await response.json()) as {
    entries?: { id: string; type: string; url: string }[];
  };
  const entry = manifest.entries?.find(
    (item) => item.id === 'sprite' && item.type === 'atlas',
  );
  if (!entry) throw new Error('Project needs the sprite atlas entry.');
  const atlas = await context.resources.acquire<AtlasAsset>(
    {
      kind: 'custom',
      ownership: 'owned',
      async load(signal, resources) {
        return resources.own(
          await new AtlasLoader().load(new URL(entry.url, manifestURL).href, {
            signal,
          }),
        );
      },
      dispose: (value) => value.destroy(),
    },
    { signal: context.signal },
  );
  const view = atlas.value.views.get('sprite');
  if (!view) throw new Error('Atlas needs the sprite frame.');
  const scene = new Scene();
  context.resources.attach(() => scene.destroy());
  scene.add(new Sprite({ view, position: [400, 225], scale: [4, 4] }));
  return scene;
}

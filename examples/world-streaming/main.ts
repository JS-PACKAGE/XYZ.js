import {
  Game,
  Scene,
  Object3D,
  Mesh,
  Geometry,
  TextureMaterial,
  FactoryRegistry,
  defineFactory,
  BoxCollider3D,
  CapsuleCollider3D,
  CharacterController3D,
  NavigationFollower3D,
  Vector3,
  type RendererPreference,
  type ResourceRequest,
  type ResourceScope,
  type WorldStreamingController,
  type WorldStreamingCell,
} from '../../src/index.js';

const $ = <T extends HTMLElement>(id: string): T =>
  document.querySelector<T>(`#${id}`)!;
const backend = $<HTMLSelectElement>('backend');
const status = $('status');
backend.value = new URLSearchParams(location.search).get('renderer') ?? 'auto';
backend.onchange = () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
};
interface TerrainData {
  id: string;
  x: number;
  color: [number, number, number];
}
function parseTerrain(value: unknown): TerrainData {
  if (
    !value ||
    typeof value !== 'object' ||
    !('id' in value) ||
    !('x' in value) ||
    !('color' in value) ||
    typeof value.id !== 'string' ||
    !['west', 'center', 'east'].includes(value.id) ||
    typeof value.x !== 'number' ||
    ![-12, 0, 12].includes(value.x) ||
    !Array.isArray(value.color) ||
    value.color.length !== 3 ||
    !value.color.every(
      (channel: unknown) =>
        typeof channel === 'number' &&
        Number.isFinite(channel) &&
        channel >= 0 &&
        channel <= 1,
    )
  )
    throw new TypeError(
      'Terrain payload requires an authored ID, center and RGB color.',
    );
  return {
    id: value.id,
    x: value.x,
    color: value.color as [number, number, number],
  };
}
let game: Game | undefined;
let scene: StreamingLab | undefined;
let monitor: number | undefined;
let reversing: number | undefined;
let failNext = false;
let released = false;
let geometryLoads = 0,
  geometryReleases = 0;
const focus = new Vector3();
const textureURL = new URL('./shared.png', import.meta.url).href;
const terrainURLs: Record<string, string> = {
  west: new URL('./west.json', import.meta.url).href,
  center: new URL('./center.json', import.meta.url).href,
  east: new URL('./east.json', import.meta.url).href,
};

class StreamingLab extends Scene {
  stream!: WorldStreamingController;
  actor!: Object3D;
  character!: CharacterController3D;
  follower!: NavigationFollower3D;
  actorResources!: ResourceScope;
  override update(): void {
    this.camera3D.position.set(focus.x, 16, 19);
    this.camera3D.lookAt(new Vector3(focus.x, 0, 0));
  }
  protected override onDestroy(): void {
    this.follower?.destroy();
    this.character?.destroy();
    this.actorResources?.release();
  }
}
function select(x: number): void {
  focus.x = x;
  scene?.follower.stop();
}
function release(): void {
  if (released) return;
  released = true;
  clearInterval(monitor);
  clearInterval(reversing);
  game?.destroy();
  status.textContent =
    'Destroyed. All Scene objects, streaming reservations and texture borrowers released.';
  $('stats').textContent = JSON.stringify(
    {
      streaming: scene?.stream.stats,
      physics: scene?.initializedPhysics3D?.size,
      decoded: game?.assets.residency,
      native: game?.graphics.residency,
      geometryLoads,
      geometryReleases,
    },
    null,
    2,
  );
}
try {
  game = await Game.create({
    canvas: '#game',
    width: 900,
    height: 450,
    renderer: backend.value as RendererPreference,
  });
  if (!game.graphics.capabilities.threeD)
    throw new Error(
      'World streaming terrain uses 3D: Canvas2D is explicitly unsupported.',
    );
  const runtime = game;
  runtime.addEventListener('error', (event) => {
    status.textContent = String((event as CustomEvent<Error>).detail);
  });
  const geometryRequest: ResourceRequest<Geometry> = {
    kind: 'custom',
    ownership: 'owned',
    load() {
      geometryLoads++;
      return Geometry.cube(1);
    },
    dispose(geometry) {
      runtime.graphics.unloadGeometry(geometry);
      geometryReleases++;
    },
  };
  const registry = new FactoryRegistry({
    terrain: defineFactory<TerrainData, Object3D>({
      parse: parseTerrain,
      async create(data, context) {
        const root = context.own(new Object3D());
        if (!context.resources)
          throw new Error('Terrain requires its owned resource scope.');
        const [texture, geometry] = await Promise.all([
          context.resources.acquireTexture(textureURL),
          context.resources.acquire(geometryRequest),
        ]);
        const floor = new Mesh({
          geometry: geometry.value,
          material: new TextureMaterial({
            texture: texture.value,
            color: data.color,
          }),
          position: [data.x, -0.25, 0],
          scale: [12, 0.5, 8],
        });
        floor.collider = new BoxCollider3D(new Vector3(0.5, 0.5, 0.5), {
          category: 1,
        });
        root.add(floor);
        const wall = new Mesh({
          geometry: geometry.value,
          material: new TextureMaterial({
            texture: texture.value,
            color: [0.8, 0.85, 0.9],
          }),
          position: [data.x, 1, 2.5],
          scale: [6, 2, 0.5],
        });
        wall.collider = new BoxCollider3D(new Vector3(0.5, 0.5, 0.5), {
          category: 1,
        });
        root.add(wall);
        return root;
      },
    }),
  });
  scene = new StreamingLab();
  const lab = scene;
  lab.physics3D.gravity.set(0, 0, 0);
  await runtime.setScene(lab);
  lab.actorResources = runtime.resources.createScope();
  const [actorTexture, actorGeometry] = await Promise.all([
    lab.actorResources.acquireTexture(textureURL),
    lab.actorResources.acquire(geometryRequest),
  ]);
  lab.actor = new Object3D();
  lab.actor.position.set(0, 0.85, 0);
  lab.actor.collider = new CapsuleCollider3D(0.25, 1.2, {
    category: 2,
    mask: 1,
  });
  lab.actor.add(
    new Mesh({
      geometry: actorGeometry.value,
      material: new TextureMaterial({
        texture: actorTexture.value,
        color: [1, 0.2, 0.5],
      }),
      scale: [0.5, 1.7, 0.5],
    }),
  );
  lab.add(lab.actor);
  lab.actorResources.attach(() => lab.actor.destroy());
  lab.character = new CharacterController3D(lab.actor, lab.physics3D, {
    mask: 1,
    groundSnap: 0.1,
  });
  lab.follower = new NavigationFollower3D(lab.character, {
    speed: 3,
    arrivalTolerance: 0.04,
  });
  lab.navigation.addFollower(lab.follower);
  const cells: WorldStreamingCell[] = [-12, 0, 12].map((x, index) => ({
    id: ['west', 'center', 'east'][index],
    bounds: { min: new Vector3(x - 6, -1, -4), max: new Vector3(x + 6, 3, 4) },
    async load(context) {
      const bytes = await runtime.assets.loadBinary(
        terrainURLs[context.cell.id],
        { signal: context.signal, maxBytes: 1024 },
      );
      const data = parseTerrain(JSON.parse(new TextDecoder().decode(bytes)));
      if (data.id !== context.cell.id || data.x !== x)
        throw new Error('Terrain payload does not match its catalog bounds.');
      const root = await context.createFactory(
        registry,
        'terrain',
        data,
        undefined,
      );
      const delay = Math.max(
        0,
        Math.min(3000, Number($<HTMLInputElement>('delay').value) || 0),
      );
      await new Promise<void>((resolve, reject) => {
        const abort = (): void => {
          clearTimeout(timer);
          context.signal.removeEventListener('abort', abort);
          reject(context.signal.reason);
        };
        const timer = setTimeout(() => {
          context.signal.removeEventListener('abort', abort);
          resolve();
        }, delay);
        context.signal.addEventListener('abort', abort, { once: true });
        if (context.signal.aborted) abort();
      });
      if (failNext) {
        failNext = false;
        throw new Error(
          'Explicit authored cell failure; no fallback is published.',
        );
      }
      return {
        root,
        navigation: {
          nodes: [
            { id: 'left', position: new Vector3(x - 6, 0.85, 0) },
            { id: 'center', position: new Vector3(x, 0.85, 0) },
            { id: 'right', position: new Vector3(x + 6, 0.85, 0) },
          ],
          connections: [
            { from: 'left', to: 'center', cost: 6, clearance: 0.5 },
            { from: 'center', to: 'right', cost: 6, clearance: 0.5 },
          ],
          portals: [
            { seam: `seam:${x - 6}`, node: 'left', clearance: 0.5 },
            { seam: `seam:${x + 6}`, node: 'right', clearance: 0.5 },
          ],
        },
      };
    },
  }));
  lab.stream = lab.createWorldStreaming({
    cells,
    focus: () => focus,
    activeDistance: 1,
    prefetchDistance: 4,
    retireDistance: 4,
    maxActive: 2,
    maxPending: 2,
    maxResident: 3,
    admissionsPerFrame: 2,
    onError(failure) {
      status.textContent = `${failure.cell} ${failure.phase}: ${String(failure.error)}`;
    },
  });
  $('west').onclick = () => select(-12);
  $('center').onclick = () => select(0);
  $('seam').onclick = () => select(6);
  $('east').onclick = () => select(12);
  $('retire').onclick = () => select(100);
  $('reverse').onclick = () => {
    clearInterval(reversing);
    let iteration = 0;
    reversing = window.setInterval(() => {
      select(iteration++ % 2 ? -12 : 12);
      if (iteration === 12) {
        clearInterval(reversing);
        select(6);
      }
    }, 70);
  };
  $('route').onclick = () => {
    try {
      const graph = lab.stream.navigation.graph;
      if (
        !graph ||
        lab.stream.getCell('center').state !== 'active' ||
        lab.stream.getCell('east').state !== 'active'
      )
        throw new Error(
          'Select Center / east seam and wait for both cells to publish first.',
        );
      lab.actor.position.set(0, 0.85, 0);
      lab.follower.navigate({
        graph,
        start: lab.stream.navigation.nodeId('center', 'center'),
        goal: lab.stream.navigation.nodeId('east', 'center'),
        agentRadius: 0.25,
      });
      status.textContent =
        'Walking across the real joined floor colliders. Retiring either cell invalidates this route.';
    } catch (error) {
      status.textContent = String(error);
    }
  };
  $('pause').onclick = () => {
    if (runtime.state === 'paused') {
      runtime.resume();
      $('pause').textContent = 'Pause';
    } else {
      runtime.pause();
      $('pause').textContent = 'Resume';
    }
  };
  $('fail').onclick = () => {
    failNext = true;
    select(100);
    status.textContent =
      'Next fresh load will fail explicitly. Select a terrain cell.';
  };
  $('retry').onclick = () => {
    for (const cell of cells)
      if (lab.stream.getCell(cell.id).state === 'failed')
        lab.stream.retry(cell.id);
  };
  $('destroy').onclick = release;
  monitor = window.setInterval(() => {
    const colliderHits = [-12, 0, 12].map((x) =>
      Boolean(
        lab.physics3D.raycast(new Vector3(x, 3, 0), new Vector3(0, -1, 0), 5, {
          mask: 1,
        }),
      ),
    );
    $('stats').textContent = JSON.stringify(
      {
        focus: focus.x,
        game: runtime.state,
        streaming: lab.stream.stats,
        cells: cells.map((cell) => lab.stream.getCell(cell.id)),
        physics: lab.physics3D.size,
        floorHitsWestCenterEast: colliderHits,
        navigationRevision: lab.stream.navigation.revision,
        follower: lab.follower.state,
        actorX: lab.actor.position.x,
        decoded: runtime.assets.residency,
        native: runtime.graphics.residency,
        geometryLoads,
        geometryReleases,
        baseline:
          'Actor owns one texture borrower and one shared geometry lease until Game.destroy().',
      },
      null,
      2,
    );
  }, 100);
  runtime.start();
  status.textContent = `${runtime.graphics.backend}: select cells, reverse rapidly, then walk across the seam.`;
} catch (error) {
  game?.destroy();
  status.textContent = `Initialization failed: ${String(error)}`;
}
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) release();
});

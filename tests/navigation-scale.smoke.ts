import { Vector3 } from '../packages/math/src/index.js';
import {
  NavigationMesh3D,
  type NavigationPolygon3D,
} from '../packages/core/src/navigation/mesh.js';
import { NavigationMeshFollower3D } from '../packages/core/src/navigation/mesh-follower.js';
import {
  NavigationTiledGraph3D,
  type NavigationGraphTile3D,
} from '../packages/core/src/navigation/tiled-graph.js';
import { NavigationScheduler } from '../packages/core/src/navigation/scheduler.js';
import { NavigationSurfaceBakeJob3D } from '../packages/core/src/navigation/bake.js';
import { NavigationFollower3D } from '../packages/core/src/navigation/follower.js';
import { Scene } from '../packages/core/src/scene.js';
import { Object3D } from '../packages/core/src/object3d.js';
import {
  PlaneCollider3D,
  CapsuleCollider3D,
  BoxCollider3D,
} from '../packages/core/src/physics3d/collider.js';
import { CharacterController3D } from '../packages/core/src/physics3d/character.js';

/** Real CPU consumer smoke, usable with Vite SSR or emitted imports. No vitest or DOM required.
 * Reports native wall duration independently from deterministic cooperative work/visited counts.
 */
export function runNavigationScaleSmoke(): Record<string, number | string> {
  const boundaryOperations = [
    () =>
      new NavigationMesh3D({
        tileSize: Number.MIN_VALUE,
        polygons: [
          {
            id: 'tiny',
            clearanceHeight: 2,
            vertices: [
              new Vector3(2, 0, 2),
              new Vector3(4, 0, 2),
              new Vector3(4, 0, 4),
              new Vector3(2, 0, 4),
            ],
          },
        ],
      }),
    () =>
      new NavigationTiledGraph3D({
        tileSize: Number.MIN_VALUE,
        seams: [],
        tiles: [
          {
            id: 'a',
            geometry: {
              nodes: [{ id: 'n', position: new Vector3(1, 0, 1) }],
              connections: [],
            },
          },
        ],
      }),
  ];
  for (const operation of boundaryOperations) {
    let rejected = false;
    try {
      operation();
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
      rejected = true;
    }
    if (!rejected) throw new Error('Unsafe spatial index admitted.');
  }
  for (const tileSize of [Number.MIN_VALUE, 1e-8]) {
    const owner = new NavigationTiledGraph3D({
      tileSize,
      seams: [],
      tiles: [
        {
          id: 'a',
          geometry: {
            nodes: [{ id: 'n', position: new Vector3() }],
            connections: [],
          },
        },
      ],
    });
    let rejected = false;
    try {
      owner.project(new Vector3(1e9, 0, 1e9), {
        maxDistance: 0,
        maxVerticalDistance: 0,
      });
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
      rejected = true;
    }
    owner.destroy();
    if (!rejected) throw new Error('Unsafe projection index admitted.');
  }
  let geometryReads = 0,
    worldRejected = false;
  const oversizedGeometry = {
    nodes: Array.from({ length: 8192 }, (_, i) => ({
      id: `${i}`,
      get position(): Vector3 {
        geometryReads++;
        return new Vector3(i, 0, 0);
      },
    })),
    connections: [],
  };
  try {
    new NavigationTiledGraph3D({
      seams: [],
      tiles: Array.from({ length: 33 }, (_, i) => ({
        id: `${i}`,
        geometry: oversizedGeometry,
      })),
    });
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    worldRejected = true;
  }
  if (!worldRejected || geometryReads !== 0)
    throw new Error('Aggregate admission occurred after geometry copying.');
  const polygons: NavigationPolygon3D[] = [];
  for (let island = 0; island < 100; island++)
    for (let cell = 0; cell < 100; cell++) {
      const x = cell * 2,
        z = island * 100;
      polygons.push({
        id: `${island}:${cell}`,
        clearanceHeight: 2,
        vertices: [
          new Vector3(x, 0, z),
          new Vector3(x + 2, 0, z),
          new Vector3(x + 2, 0, z + 2),
          new Vector3(x, 0, z + 2),
        ],
      });
    }
  const beforeMesh = performance.now();
  const mesh = new NavigationMesh3D({ polygons, tileSize: 8 });
  const meshBuildMilliseconds = performance.now() - beforeMesh;
  const query = {
    maxDistance: 0.5,
    maxVerticalDistance: 0.1,
    agentRadius: 0.2,
    agentHeight: 1.4,
  };
  const projected = mesh.project(new Vector3(0.5, 0.05, 1), query)!;
  const scheduler = new NavigationScheduler({ workBudget: 17 });
  const beforeSearch = performance.now();
  const job = mesh.scheduleSearch(
    scheduler,
    new Vector3(0.5, 0.05, 1),
    new Vector3(199.5, 0.05, 1),
    query,
  );
  let maximumWork = 0,
    ticks = 0;
  while (job.status === 'pending' && ticks++ < 10000) {
    const work = scheduler.update().work;
    maximumWork = Math.max(maximumWork, work);
    if (work > 17) throw new Error('Mesh exceeded shared scheduler budget.');
  }
  const meshSearchMilliseconds = performance.now() - beforeSearch;
  if (
    job.status !== 'found' ||
    job.result!.waypoints.length !== 2 ||
    job.result!.polygons.length !== 100 ||
    projected.candidates > 10 ||
    job.result!.visited > 100
  )
    throw new Error('Scalable mesh route failed.');
  const meshWork = job.expansions,
    meshVisited = job.result!.visited;
  scheduler.destroy();
  mesh.destroy();

  const triangle = new NavigationMesh3D({
    polygons: [
      {
        id: 'triangle',
        clearanceHeight: 2,
        vertices: [
          new Vector3(0, 0, 0),
          new Vector3(4, 0, 0),
          new Vector3(0, 0, 4),
        ],
      },
    ],
  });
  const edgeProjection = triangle.project(new Vector3(2.4, 0.05, 2.4), {
    ...query,
    maxDistance: 1,
    agentRadius: 0,
  })!;
  if (
    Math.abs(edgeProjection.position.x - 2) > 1e-7 ||
    Math.abs(edgeProjection.position.z - 2) > 1e-7
  )
    throw new Error('Polygon edge projection failed.');
  triangle.destroy();
  const narrow = new NavigationMesh3D({
    polygons: [
      {
        id: 'narrow',
        clearanceHeight: 2,
        vertices: [
          new Vector3(0, 0, 0),
          new Vector3(6, 0, 0),
          new Vector3(6, 0, 1),
          new Vector3(0, 0, 1),
        ],
      },
    ],
  });
  if (
    narrow.findPath(new Vector3(1, 0, 0.5), new Vector3(5, 0, 0.5), {
      ...query,
      agentRadius: 0.49,
    }).status !== 'found' ||
    narrow.findPath(new Vector3(1, 0, 0.5), new Vector3(5, 0, 0.5), {
      ...query,
      agentRadius: 0.51,
    }).status !== 'unreachable'
  )
    throw new Error('Agent clearance filter failed.');
  narrow.destroy();
  const corner = new NavigationMesh3D({
    polygons: [
      [0, 0],
      [2, 0],
      [2, 2],
      [2, 4],
    ].map(([x, z], index) => ({
      id: `${index}`,
      clearanceHeight: 2,
      vertices: [
        new Vector3(x!, 0, z!),
        new Vector3(x! + 2, 0, z!),
        new Vector3(x! + 2, 0, z! + 2),
        new Vector3(x!, 0, z! + 2),
      ],
    })),
  });
  const cornerRoute = corner.findPath(
    new Vector3(0.6, 0, 1),
    new Vector3(3, 0, 5.4),
    { ...query, agentRadius: 0.4 },
  );
  if (cornerRoute.status !== 'found' || cornerRoute.waypoints.length <= 2)
    throw new Error('Corner corridor smoothing failed.');
  for (let segment = 1; segment < cornerRoute.waypoints.length; segment++) {
    const a = cornerRoute.waypoints[segment - 1]!.position,
      b = cornerRoute.waypoints[segment]!.position;
    for (let sample = 0; sample <= 100; sample++) {
      const x = a.x + ((b.x - a.x) * sample) / 100,
        z = a.z + ((b.z - a.z) * sample) / 100;
      if (Math.hypot(Math.max(0, x - 2), Math.max(0, 2 - z)) < 0.4 - 1e-7)
        throw new Error('Smoothed corridor violated radius clearance.');
    }
  }
  corner.destroy();
  const tiles: NavigationGraphTile3D[] = [];
  for (let tile = 0; tile < 100; tile++)
    tiles.push({
      id: `${tile}`,
      geometry: {
        nodes: Array.from({ length: 100 }, (_, index) => ({
          id: `${index}`,
          position: new Vector3(tile * 100 + index, 0, 0),
          clearance: 0.2,
          surfaceY: 0,
        })),
        connections: Array.from({ length: 99 }, (_, index) => ({
          from: `${index}`,
          to: `${index + 1}`,
          cost: 1,
          clearance: 0.2,
        })),
      },
    });
  const id = NavigationTiledGraph3D.nodeId;
  const beforeGraph = performance.now();
  const graph = new NavigationTiledGraph3D({
    tiles,
    tileSize: 16,
    seams: Array.from({ length: 99 }, (_, tile) => ({
      from: id(`${tile}`, '99'),
      to: id(`${tile + 1}`, '0'),
      cost: 1,
      clearance: 0.2,
    })),
  });
  const graphBuildMilliseconds = performance.now() - beforeGraph;
  const shared = new NavigationScheduler({ workBudget: 17 });
  const beforeGraphSearch = performance.now();
  const route = graph.scheduleSearch(shared, id('0', '0'), id('99', '99'), {
    agentRadius: 0.2,
  });
  ticks = 0;
  while (route.status === 'pending' && ticks++ < 10000) {
    const work = shared.update().work;
    maximumWork = Math.max(maximumWork, work);
    if (work > 17)
      throw new Error('Sampled world exceeded shared scheduler budget.');
  }
  const graphSearchMilliseconds = performance.now() - beforeGraphSearch;
  if (
    route.status !== 'found' ||
    route.result!.cost !== 9999 ||
    route.result!.nodes.length !== 10000
  )
    throw new Error('Partitioned sampled route failed.');
  const sampledWork = route.expansions;
  const cancel = graph.scheduleSearch(shared, id('0', '0'), id('99', '99'));
  shared.update(1);
  cancel.cancel();
  if (cancel.status !== 'cancelled') throw new Error('Cancellation failed.');
  const stale = graph.scheduleSearch(shared, id('0', '0'), id('99', '99'));
  shared.update(1);
  graph.setConnection(
    graph.getConnectionIndex(id('50', '99'), id('51', '0'))!,
    { enabled: false },
  );
  if (stale.status !== 'invalidated')
    throw new Error('Revision invalidation failed.');
  shared.destroy();
  graph.destroy();

  // Exercise actual collision bake -> tile seam -> shared Scene scheduler -> capsule motion.
  const scene = new Scene(),
    floor = new Object3D();
  floor.collider = new PlaneCollider3D();
  scene.add(floor);
  const baked: NavigationGraphTile3D[] = [];
  for (let tile = 0; tile < 2; tile++) {
    const bake = new NavigationSurfaceBakeJob3D(scene.physics3D, {
      columns: 2,
      rows: 1,
      cellSize: 1,
      origin: new Vector3(tile * 2, 0, 0),
      minY: -1,
      maxY: 2,
      maxLayers: 1,
      agentRadius: 0.2,
      agentHeight: 1.4,
    });
    scene.navigation.scheduleBake(bake);
    while (bake.status === 'pending') scene.navigation.update(17);
    if (bake.status !== 'found') throw new Error('Collision tile bake failed.');
    baked.push({
      id: `${tile}`,
      geometry: {
        nodes: bake.result!.nodes,
        connections: bake.result!.connections,
      },
    });
    bake.result!.destroy();
  }
  const physicalGraph = new NavigationTiledGraph3D({
    tiles: baked,
    seams: [
      { from: id('0', '1:0'), to: id('1', '0:0'), cost: 1, clearance: 0.2 },
    ],
  });
  const actor = new Object3D();
  actor.collider = new CapsuleCollider3D(0.2, 1, { category: 2, mask: 1 });
  actor.position.copy(physicalGraph.getNode(id('0', '0:0')).position);
  scene.add(actor);
  const controller = new CharacterController3D(actor, scene.physics3D, {
    mask: 1,
    groundSnap: 0.1,
  });
  const follower = new NavigationFollower3D(controller, { speed: 3 });
  follower.navigate({
    graph: physicalGraph,
    start: id('0', '0:0'),
    goal: id('1', '1:0'),
    agentRadius: 0.2,
  });
  for (let tick = 0; tick < 600 && follower.state !== 'finished'; tick++) {
    scene.navigation.update(17);
    follower.update(1 / 60);
  }
  if (follower.state !== 'finished' || Math.abs(actor.position.x - 3.5) > 0.001)
    throw new Error('Physical sampled seam traversal failed.');
  const sampledCharacterX = actor.position.x;
  follower.destroy();
  physicalGraph.destroy();

  const physicalMesh = new NavigationMesh3D({
    tileSize: 2,
    polygons: Array.from({ length: 3 }, (_, cell) => ({
      id: `${cell}`,
      clearanceHeight: 2,
      vertices: [
        new Vector3(cell * 2, 0, 0),
        new Vector3(cell * 2 + 2, 0, 0),
        new Vector3(cell * 2 + 2, 0, 2),
        new Vector3(cell * 2, 0, 2),
      ],
    })),
  });
  actor.position.set(0.5, 0.702, 1);
  const meshRoute = physicalMesh.scheduleSearch(
    scene.navigation,
    new Vector3(0.5, 0, 1),
    new Vector3(5.5, 0, 1),
    query,
  );
  while (meshRoute.status === 'pending') scene.navigation.update(17);
  const meshFollower = new NavigationMeshFollower3D(controller, { speed: 3 });
  meshFollower.follow(physicalMesh, meshRoute.result!, 0.702);
  for (let tick = 0; tick < 600 && meshFollower.state !== 'finished'; tick++)
    meshFollower.update(1 / 60);
  if (
    meshFollower.state !== 'finished' ||
    Math.abs(actor.position.x - 5.5) > 0.001
  )
    throw new Error('Physical polygon traversal failed.');
  const meshCharacterX = actor.position.x;
  meshFollower.destroy();
  physicalMesh.destroy();
  const upperFloor = new Object3D();
  upperFloor.collider = new BoxCollider3D(new Vector3(1, 0.1, 1));
  upperFloor.position.set(1, 2.9, 1);
  scene.add(upperFloor);
  const floors: NavigationPolygon3D[] = [0, 3].map((y) => ({
    id: `${y}`,
    clearanceHeight: 2,
    vertices: [
      new Vector3(0, y, 0),
      new Vector3(2, y, 0),
      new Vector3(2, y, 2),
      new Vector3(0, y, 2),
    ],
  }));
  const separate = new NavigationMesh3D({ polygons: floors });
  if (
    separate.findPath(new Vector3(1, 0, 1), new Vector3(1, 3, 1), query)
      .status !== 'unreachable' ||
    separate.project(new Vector3(1, 3.05, 1), query)!.polygon.id !== '3'
  )
    throw new Error('Floor separation/projection failed.');
  separate.destroy();
  const linked = new NavigationMesh3D({
    polygons: floors,
    links: [
      {
        id: 'teleport',
        from: '0',
        to: '3',
        start: new Vector3(1, 0, 1),
        end: new Vector3(1, 3, 1),
        clearance: 0.4,
      },
    ],
  });
  const linkPath = linked.findPath(
    new Vector3(1, 0, 1),
    new Vector3(1, 3, 1),
    query,
  );
  actor.position.set(1, 0.702, 1);
  const noHandler = new NavigationMeshFollower3D(controller);
  noHandler.follow(linked, linkPath, 0.702);
  noHandler.update(1 / 60);
  if (
    noHandler.state !== 'blocked' ||
    Math.abs(actor.position.y - 0.702) > 1e-7
  )
    throw new Error('Link moved without handler.');
  noHandler.destroy();
  const teleporter = new NavigationMeshFollower3D(controller, {
    traverseLink: ({ controller: character, to }) => {
      character.object.position.copy(to);
      return 'complete';
    },
  });
  teleporter.follow(linked, linkPath, 0.702);
  for (let tick = 0; tick < 3; tick++) teleporter.update(1 / 60);
  if (
    teleporter.state !== 'finished' ||
    Math.abs(actor.position.y - 3.702) > 1e-7
  )
    throw new Error('Explicit teleport handler failed.');
  const linkedCharacterY = actor.position.y;
  teleporter.destroy();
  linked.destroy();
  controller.destroy();
  scene.destroy();
  return {
    status: 'NAVIGATION_SCALE_SMOKE_OK',
    meshPolygons: polygons.length,
    meshBuildMilliseconds,
    meshSearchMilliseconds,
    projectionCandidates: projected.candidates,
    meshVisited,
    meshWork,
    sampledNodes: 10000,
    graphBuildMilliseconds,
    graphSearchMilliseconds,
    sampledWork,
    maximumWork,
    sampledCharacterX,
    meshCharacterX,
    linkedCharacterY,
  };
}

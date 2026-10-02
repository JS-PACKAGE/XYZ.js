import {
  Game,
  Scene,
  Object3D,
  Mesh,
  Geometry,
  Texture,
  TextureMaterial,
  BoxCollider3D,
  CapsuleCollider3D,
  RigidBody3D,
  CharacterController3D,
  NavigationFollower3D,
  NavigationSurfaceBakeJob3D,
  Vector3,
  type RendererPreference,
} from '../../src/index.js';
const $ = <T extends HTMLElement>(id: string): T =>
  document.querySelector<T>(`#${id}`)!;
const backend = $<HTMLSelectElement>('backend');
const budget = $<HTMLSelectElement>('budget');
const goal = $<HTMLSelectElement>('goal');
const status = $('status');
backend.value = new URLSearchParams(location.search).get('renderer') ?? 'auto';
backend.onchange = () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
};
let game: Game | undefined;
let texture: Texture | undefined;
let disposed = false;
const release = (): void => {
  if (disposed) return;
  disposed = true;
  game?.destroy();
  texture?.destroy();
  status.textContent = 'Destroyed. Reload to restart.';
};
try {
  game = await Game.create({
    canvas: '#game',
    width: 900,
    height: 450,
    renderer: backend.value as RendererPreference,
  });
  if (!game.graphics.capabilities.threeD)
    throw new Error('3D requires WebGPU or WebGL2; Canvas2D is unsupported.');
  const runtime = game;
  runtime.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });
  const pixel = document.createElement('canvas');
  pixel.width = pixel.height = 1;
  const context = pixel.getContext('2d')!;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, 1, 1);
  texture = await Texture.fromImage(pixel);
  const white = texture;
  class NavigationLab extends Scene {
    readonly bake: NavigationSurfaceBakeJob3D;
    readonly followers: NavigationFollower3D[] = [];
    readonly controllers: CharacterController3D[] = [];
    published = false;
    walkable = 0;
    peakWork = 0;
    frameStart = performance.now();
    observedFrame = 0;
    constructor() {
      super({ navigationWorkBudget: Number(budget.value) });
      this.physics3D.gravity.set(0, 0, 0);
      this.camera3D.position.set(0, 16, 13);
      this.camera3D.lookAt(new Vector3(0, 0, 0));
      this.box([0, -0.25, 0], [18, 0.5, 12], [0.15, 0.2, 0.27], true);
      this.box([-1.5, 1, -1.5], [1, 2, 7], [0.85, 0.55, 0.18], true);
      this.box([2.5, 1, 2], [1, 2, 6], [0.85, 0.55, 0.18], true);
      this.box([0, 2.3, 0.5], [8, 0.2, 3], [0.3, 0.38, 0.52], true);
      for (let step = 1; step <= 3; step++)
        this.box(
          [-7.5 + step, step * 0.3, 0.5],
          [1, step * 0.6, 1],
          [0.5, 0.55, 0.65],
          true,
        );
      this.bake = this.navigation.scheduleBake(
        new NavigationSurfaceBakeJob3D(this.physics3D, {
          columns: 18,
          rows: 12,
          cellSize: 1,
          origin: new Vector3(-9, 0, -6),
          minY: -0.1,
          maxY: 3,
          agentRadius: 0.2,
          agentHeight: 0.8,
          stepHeight: 0.65,
          maxLayers: 4,
          query: { mask: 1 },
        }),
      );
    }
    box(
      position: [number, number, number],
      scale: [number, number, number],
      color: [number, number, number],
      physical = false,
    ): Mesh {
      const mesh = new Mesh({
        geometry: Geometry.cube(1),
        material: new TextureMaterial({ texture: white, color }),
        position,
        scale,
      });
      if (physical) {
        mesh.collider = new BoxCollider3D(new Vector3(0.5, 0.5, 0.5), {
          category: 1,
        });
        mesh.body = new RigidBody3D({ type: 'static' });
      }
      return this.add(mesh);
    }
    override update(): void {
      const now = performance.now();
      this.observedFrame = now - this.frameStart;
      this.frameStart = now;
      const graph = this.bake.result;
      if (graph && !this.published) {
        this.published = true;
        for (const node of graph.nodes) {
          if (node.walkable === false) continue;
          ++this.walkable;
          this.box(
            [node.position.x, node.position.y - 0.38, node.position.z],
            [0.72, 0.03, 0.72],
            node.position.y > 2 ? [0.3, 0.65, 0.8] : [0.15, 0.45, 0.3],
          );
        }
        const target = graph.project(
          new Vector3(0.5, goal.value === 'upper' ? 2.802 : 0.402, 0.5),
          { maxDistance: 0.2, maxVerticalDistance: 0.1, agentRadius: 0.2 },
        )?.node;
        if (!target)
          throw new Error(
            'Selected bridge/underpass goal was not baked walkable.',
          );
        for (let i = 0; i < 120; ++i) {
          const row = 1 + (i % 10),
            column = 1 + (Math.floor(i / 10) % 2);
          const start = graph.nodes.find(
            (node) => node.id === this.bake.mapping.nodeId(column, row),
          );
          if (!start || start.walkable === false)
            throw new Error('Agent start was not baked walkable.');
          const agent = new Object3D();
          agent.position.copy(start.position);
          this.add(agent);
          agent.collider = new CapsuleCollider3D(0.2, 0.4, {
            category: 2,
            mask: 1,
          });
          agent.add(
            new Mesh({
              geometry: Geometry.sphere(0.25, 12, 8),
              material: new TextureMaterial({
                texture: white,
                color: [0.2, 0.8, 1],
              }),
              position: [0, 0, 0],
            }),
          );
          const controller = new CharacterController3D(agent, this.physics3D, {
            mask: 1,
            groundSnap: 0.1,
            stepHeight: 0.65,
          });
          const follower = new NavigationFollower3D(controller, {
            speed: 1.6 + i * 0.04,
            arrivalTolerance: 0.04,
          });
          this.controllers.push(controller);
          this.followers.push(follower);
          this.navigation.addFollower(follower);
          follower.navigate({
            graph,
            start: start.id,
            goal: target.id,
            agentRadius: 0.2,
          });
        }
      }
      const s = this.navigation.stats;
      this.peakWork = Math.max(this.peakWork, s.work);
      const states = this.followers.map((follower) => follower.state);
      $('stats').textContent =
        `Bake: ${this.bake.status} · query work ${this.bake.expansions}\nOccupancy: ${this.walkable} walkable surfaces / 216 XZ cells × ${this.bake.maxLayers} layer slots\nAggregate work ${s.work} <= quota ${this.navigation.workBudget} · peak ${this.peakWork}\nBake work ${s.bakeWork} · expansions ${s.expansions} · total work ${s.totalWork}\nPending ${s.queued + s.active} · completed jobs ${s.completed}\nAgents: searching ${states.filter((s) => s === 'searching').length}, moving ${states.filter((s) => s === 'following').length}, arrived ${states.filter((s) => s === 'finished').length}, blocked/unreachable ${states.filter((s) => s === 'blocked' || s === 'unreachable').length}\nObserved update-to-update interval: ${this.observedFrame.toFixed(2)} ms (includes rendering, not a CPU deadline)`;
    }
    override destroy(): void {
      for (const follower of this.followers) follower.destroy();
      for (const controller of this.controllers) controller.destroy();
      this.bake.result?.destroy();
      super.destroy();
    }
  }
  let switching = false;
  const reset = async (): Promise<void> => {
    if (disposed || switching) return;
    switching = true;
    try {
      await runtime.setScene(new NavigationLab());
      status.textContent = `${runtime.graphics.backend} · exact collision bake · Scene quota ${budget.value} / frame`;
    } catch (error) {
      status.textContent = String(error);
    } finally {
      switching = false;
    }
  };
  $('route').onclick = () => {
    void reset();
  };
  budget.onchange = () => {
    void reset();
  };
  goal.onchange = () => {
    void reset();
  };
  $('destroy').onclick = release;
  await reset();
  runtime.start();
} catch (error) {
  game?.destroy();
  texture?.destroy();
  status.textContent = `Initialization failed: ${String(error)}`;
}
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) release();
});

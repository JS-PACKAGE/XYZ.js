import {
  Game,
  Geometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  PBRMaterial,
  Quaternion,
  Scene,
  Texture,
  Vector3,
  type RendererPreference,
} from '../../src/index.js';

const WIDTH = 960;
const HEIGHT = 540;
const SPACING = 1.6;
const BATCHES = 3;
const PROBES = 48;
const COLORS: readonly [number, number, number][] = [
  [0.25, 0.6, 1],
  [1, 0.55, 0.2],
  [0.45, 0.9, 0.5],
];

const $ = <T extends HTMLElement>(id: string): T =>
  document.querySelector<T>(`#${id}`)!;
const backend = $<HTMLSelectElement>('backend');
const countSlider = $<HTMLInputElement>('count');
const animate = $<HTMLInputElement>('animate');
const orbit = $<HTMLInputElement>('orbit');
const statsPanel = $<HTMLPreElement>('stats');
const status = $<HTMLParagraphElement>('status');

backend.value = new URLSearchParams(location.search).get('renderer') ?? 'auto';
backend.addEventListener('change', () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
});

let game: Game | undefined;
let white: Texture | undefined;
const release = (): void => {
  game?.destroy();
  white?.destroy();
};

try {
  game = await Game.create({
    canvas: '#game',
    width: WIDTH,
    height: HEIGHT,
    renderer: backend.value as RendererPreference,
  });
  const runtime = game;
  runtime.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });
  if (!runtime.graphics.capabilities.threeD)
    throw new Error(
      'This backend has no 3D capability. Canvas2D intentionally does not render meshes.',
    );
  const image = new OffscreenCanvas(1, 1);
  const context = image.getContext('2d')!;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, 1, 1);
  white = await Texture.fromImage(image);
  const texture = white;

  const matrix = new Matrix4();
  const position = new Vector3();
  const scale = new Vector3();
  const rotation = new Quaternion();

  class Field extends Scene {
    private batches: InstancedMesh[] = [];
    private probes: Mesh[] = [];
    private columns = 1;
    private extent = 1;
    private time = 0;
    private angle = 0;
    updateMilliseconds = 0;

    constructor(readonly total: number) {
      super();
      this.ambientLight = 0.3;
      this.directionalLight.intensity = 2.5;
      this.directionalLight.direction.set(3, 6, 4).normalize();
      this.build();
      this.write();
    }

    private build(): void {
      this.columns = Math.ceil(Math.sqrt(this.total));
      this.extent = (this.columns * SPACING) / 2;
      const base = Math.floor(this.total / BATCHES);
      for (let batch = 0; batch < BATCHES; batch++) {
        const count = batch === BATCHES - 1 ? this.total - base * batch : base;
        this.batches.push(
          this.add(
            new InstancedMesh({
              geometry: Geometry.cube(0.9),
              material: new PBRMaterial({
                texture,
                color: COLORS[batch],
                roughness: 0.45,
              }),
              count,
            }),
          ),
        );
        const mesh = this.batches[batch]!;
        const vertexColors = new Float32Array(
          (mesh.geometry.vertices.length / 8) * 3,
        );
        for (let vertex = 0; vertex < vertexColors.length / 3; vertex++) {
          const shade = mesh.geometry.vertices[vertex * 8 + 1]! > 0 ? 1 : 0.25;
          vertexColors.fill(shade, vertex * 3, vertex * 3 + 3);
        }
        mesh.geometry.setColors(vertexColors);
        for (let instance = 0; instance < count; instance++) {
          const brightness = 0.35 + (0.65 * (instance % 7)) / 6;
          mesh.setColorAt(instance, brightness, brightness, brightness);
        }
      }
      // Ordinary meshes hovering around the grid edge: frustum culling applies to these,
      // so the culled count changes as the orbiting camera turns.
      const radius = this.extent * 0.95;
      for (let i = 0; i < PROBES; i++) {
        const theta = (i / PROBES) * Math.PI * 2;
        this.probes.push(
          this.add(
            new Mesh({
              geometry: Geometry.sphere(Math.max(2, this.extent * 0.06)),
              material: new PBRMaterial({
                texture,
                color: [0.9, 0.9, 0.95],
                metallic: 0.6,
                roughness: 0.3,
              }),
              position: [
                Math.cos(theta) * radius,
                this.extent * 0.2,
                Math.sin(theta) * radius,
              ],
            }),
          ),
        );
      }
    }

    /** Re-uploads every instance matrix (setMatrixAt bumps the mesh version). */
    private write(): void {
      const started = performance.now();
      let global = 0;
      for (const batch of this.batches)
        for (let i = 0; i < batch.count; i++, global++) {
          const column = global % this.columns;
          const row = Math.floor(global / this.columns);
          const phase = this.time * 1.6 + (column + row) * 0.22;
          position.set(
            (column - this.columns / 2) * SPACING,
            Math.sin(phase) * 1.4,
            (row - this.columns / 2) * SPACING,
          );
          rotation.setFromEuler(0, this.time + global * 0.01, 0);
          const pulse = 1 + 0.3 * Math.sin(phase);
          scale.set(pulse, pulse, pulse);
          batch.setMatrixAt(i, matrix.compose(position, rotation, scale));
        }
      this.updateMilliseconds = performance.now() - started;
    }

    override update(dt: number): void {
      if (animate.checked) {
        this.time += dt;
        this.write();
      }
      if (orbit.checked) this.angle += dt * 0.25;
      const distance = this.extent * 1.3 + 12;
      this.camera3D.position.set(
        Math.cos(this.angle) * distance,
        this.extent * 0.55 + 6,
        Math.sin(this.angle) * distance,
      );
      this.camera3D.lookAt(new Vector3(0, 0, 0));
    }
  }

  let scene = new Field(Number(countSlider.value));
  await runtime.setScene(scene);
  runtime.start();
  countSlider.addEventListener('input', () => {
    $('count-value').textContent = countSlider.value;
  });
  // Instance count is fixed at construction, so a change swaps in a rebuilt scene.
  countSlider.addEventListener('change', async () => {
    scene = new Field(Number(countSlider.value));
    await runtime.setScene(scene);
  });

  // Own RAF loop: real frame intervals, unaffected by the engine's clamped simulation delta.
  let frames = 0;
  let windowStart = performance.now();
  let fps = 0;
  const tick = (now: number): void => {
    frames++;
    if (now - windowStart >= 500) {
      fps = (frames * 1000) / (now - windowStart);
      frames = 0;
      windowStart = now;
      const stats = runtime.graphics.stats;
      statsPanel.textContent = [
        `RAF ${fps.toFixed(1)} fps  ·  JS matrix update ${scene.updateMilliseconds.toFixed(2)} ms for ${scene.total} instances`,
        `frame ${stats.frame}  meshes ${stats.meshes}  culled ${stats.culled}  drawCalls ${stats.drawCalls}  triangles ${stats.triangles}  shadowDrawCalls ${stats.shadowDrawCalls}`,
        `${BATCHES} InstancedMesh draws (never culled) + ${PROBES} ordinary probe meshes (culled when out of view)`,
      ].join('\n');
    }
    rafHandle = requestAnimationFrame(tick);
  };
  let rafHandle = requestAnimationFrame(tick);

  status.textContent = `${runtime.graphics.backend} · InstancedMesh ×${BATCHES}, per-instance color, vertex gradients, per-frame setMatrixAt, engine RenderStats`;
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    cancelAnimationFrame(rafHandle);
    release();
  });
} catch (error) {
  release();
  status.textContent = error instanceof Error ? error.message : String(error);
}

import {
  Game,
  GPUParticleEmitter3D,
  Scene,
  type RendererPreference,
} from '../../src/index.js';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const backend = document.querySelector<HTMLSelectElement>('#backend')!;
const status = document.querySelector<HTMLOutputElement>('#status')!;
const stats = document.querySelector<HTMLOutputElement>('#stats')!;
backend.value =
  new URLSearchParams(location.search).get('renderer') ?? 'webgpu';
backend.addEventListener('change', () => {
  const url = new URL(location.href);
  url.searchParams.set('renderer', backend.value);
  location.href = url.href;
});

let game: Game | undefined;
let report: number | undefined;
try {
  game = await Game.create({
    canvas,
    width: 960,
    height: 540,
    renderer: backend.value as RendererPreference,
  });
  const runtime = game;
  runtime.addEventListener('error', (event) => {
    status.textContent = (event as CustomEvent<Error>).detail.message;
  });
  class ParticleScene extends Scene {
    local!: GPUParticleEmitter3D;
    worldEmitter!: GPUParticleEmitter3D;
    private phase = 0;
    constructor() {
      super();
      this.camera3D.position.set(0, 1, 8);
      this.restart();
    }
    restart(): void {
      this.local?.destroy();
      this.worldEmitter?.destroy();
      this.phase = 0;
      this.local = this.add(
        new GPUParticleEmitter3D({
          capacity: 512,
          rate: 140,
          lifetime: 3,
          seed: 77,
          space: 'local',
          velocityMin: [-0.7, 1.6, -0.4],
          velocityMax: [0.7, 2.7, 0.4],
          gravity: [0, -1.2, 0],
          startSize: 0.16,
          endSize: 0.03,
          startColor: [0.1, 0.8, 1, 0.9],
          endColor: [0.1, 0.1, 1, 0],
        }),
      );
      this.worldEmitter = this.add(
        new GPUParticleEmitter3D({
          capacity: 512,
          rate: 140,
          lifetime: 3,
          seed: 77,
          space: 'world',
          velocityMin: [-0.7, 1.6, -0.4],
          velocityMax: [0.7, 2.7, 0.4],
          gravity: [0, -1.2, 0],
          startSize: 0.16,
          endSize: 0.03,
          startColor: [1, 0.4, 0.05, 0.9],
          endColor: [1, 0.05, 0.01, 0],
        }),
      );
      this.local.position.set(-2, -1, 0);
      this.worldEmitter.position.set(2, -1, 0);
      this.local.burst(80);
      this.worldEmitter.burst(80);
    }
    override update(delta: number): void {
      if (this.local.destroyed || this.local.paused) return;
      this.phase += delta;
      const x = Math.sin(this.phase) * 0.6;
      this.local.position.x = -2 + x;
      this.worldEmitter.position.x = 2 + x;
    }
  }
  const scene = new ParticleScene();
  document.querySelector('#burst')!.addEventListener('click', () => {
    if (scene.local.destroyed) return;
    scene.local.burst(5000);
    scene.worldEmitter.burst(5000);
  });
  document.querySelector('#pause')!.addEventListener('click', (event) => {
    if (scene.local.destroyed) return;
    if (scene.local.paused) {
      scene.local.resume();
      scene.worldEmitter.resume();
    } else {
      scene.local.pause();
      scene.worldEmitter.pause();
    }
    (event.currentTarget as HTMLButtonElement).textContent = scene.local.paused
      ? 'Resume emitters'
      : 'Pause emitters';
  });
  document.querySelector('#stop')!.addEventListener('click', () => {
    if (scene.local.destroyed) return;
    if (scene.local.emitting) {
      scene.local.stop();
      scene.worldEmitter.stop();
    } else {
      scene.local.start();
      scene.worldEmitter.start();
    }
  });
  document.querySelector('#clear')!.addEventListener('click', () => {
    scene.local.clear();
    scene.worldEmitter.clear();
  });
  document
    .querySelector('#restart')!
    .addEventListener('click', () => scene.restart());
  document.querySelector('#destroy')!.addEventListener('click', () => {
    scene.local.destroy();
    scene.worldEmitter.destroy();
  });
  await runtime.setScene(scene);
  runtime.start();
  status.textContent = `${runtime.graphics.backend} · analytic native vertex simulation · capacity 512 per emitter · fixed seed 77`;
  report = window.setInterval(() => {
    stats.textContent = `Local ${scene.local.activeCount}/512 · world ${scene.worldEmitter.activeCount}/512 · dropped ${scene.local.droppedCount}/${scene.worldEmitter.droppedCount} · time ${scene.local.time.toFixed(2)} · ${scene.local.paused ? 'paused' : scene.local.emitting ? 'emitting' : 'stopped'}`;
  }, 100);
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    if (report !== undefined) window.clearInterval(report);
    runtime.destroy();
  });
} catch (error) {
  if (report !== undefined) window.clearInterval(report);
  game?.destroy();
  status.textContent = error instanceof Error ? error.message : String(error);
}

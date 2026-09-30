import { describe, expect, it } from 'vitest';
import { Camera2D } from '../packages/core/src/camera2d.js';
import { GameObject } from '../packages/core/src/game-object.js';
import { Scene } from '../packages/core/src/scene.js';
import { Vector2 } from '../packages/math/src/index.js';
import {
  CameraController2D,
  CameraStrategies,
  type CameraBehavior2D,
} from '../packages/core/src/camera2d-behaviors/index.js';

function setup() {
  const camera = new Camera2D();
  camera.resize(200, 100);
  return { camera, controller: new CameraController2D(camera) };
}

describe('camera strategies and independent shake', () => {
  it('follows transformed world position on selected axes and stops after removal', () => {
    const { camera, controller } = setup();
    const scene = new Scene();
    const parent = scene.add(new GameObject());
    parent.position.set(100, 20);
    parent.rotation = Math.PI / 2;
    const target = parent.add(new GameObject());
    target.position.set(30, 0);
    camera.zoom = 2;
    controller.addBehavior(CameraStrategies.follow(target, { axis: 'x' }));
    controller.update(0);
    expect(camera.position.x).toBeCloseTo(50);
    expect(camera.position.y).toBe(0);
    scene.remove(target);
    parent.position.x = 200;
    controller.update(1);
    expect(camera.position.x).toBeCloseTo(50);
  });

  it('uses screen dead zones and exponential smooth time without timestep dependence', () => {
    const { camera, controller } = setup();
    const target = new GameObject();
    target.position.set(100, 50);
    controller.addBehavior(
      CameraStrategies.follow(target, {
        deadZone: { x: 80, y: 40, width: 40, height: 20 },
      }),
    );
    controller.update(1);
    expect(camera.position.x).toBe(0);
    target.position.set(150, 80);
    camera.zoom = 2;
    controller.update(1);
    expect(camera.position.x).toBe(90);
    expect(camera.position.y).toBe(50);
    const a = setup(),
      b = setup();
    target.position.set(200, 100);
    a.controller.addBehavior(
      CameraStrategies.follow(target, { smoothTime: 0.5 }),
    );
    b.controller.addBehavior(
      CameraStrategies.follow(target, { smoothTime: 0.5 }),
    );
    a.controller.update(1);
    for (let i = 0; i < 4; i++) b.controller.update(0.25);
    expect(a.camera.position.x).toBeCloseTo(100 * (1 - Math.exp(-2)));
    expect(b.camera.position.x).toBeCloseTo(a.camera.position.x);
    expect(b.camera.position.y).toBeCloseTo(a.camera.position.y);
  });

  it('applies ordered bounds using zoom and resize including small-area centering', () => {
    const { camera, controller } = setup();
    const target = new GameObject();
    target.position.set(500, -20);
    controller.addBehavior(CameraStrategies.follow(target));
    controller.addBehavior(
      CameraStrategies.bounds({ x: 10, y: 20, width: 300, height: 200 }),
    );
    controller.update(1);
    expect(camera.position).toEqual(new Vector2(110, 20));
    camera.zoom = 2;
    controller.update(1);
    expect(camera.position).toEqual(new Vector2(210, 20));
    camera.resize(800, 600);
    controller.update(1);
    expect(camera.position).toEqual(new Vector2(-40, -30));
  });

  it('moves and zooms concurrently with fresh starts and settles cancelled queued work', async () => {
    const { camera, controller } = setup();
    const move = controller.moveTo(100, 50, 2);
    const zoom = controller.zoomTo(3, 1);
    controller.update(1);
    expect(camera.position).toEqual(new Vector2(50, 25));
    expect(camera.zoom).toBe(3);
    expect(await zoom.finished).toBe('completed');
    controller.update(1);
    expect(await move.finished).toBe('completed');
    const queued = controller.moveTo(200, 200, 10);
    controller.destroy();
    expect(await queued.finished).toBe('cancelled');
    expect(() => controller.moveTo(1, 1, 1)).toThrow();
  });

  it('produces seeded dt-independent render offsets without focus drift and picks rendered coordinates', async () => {
    const a = setup(),
      b = setup();
    a.camera.position.set(12, 34);
    b.camera.position.set(12, 34);
    const options = {
      duration: 1,
      amplitude: [10, 20] as const,
      seed: 42,
      frequency: 13,
    };
    const handle = a.controller.shake(options);
    b.controller.shake(options);
    a.controller.update(0.5);
    b.controller.update(0.25);
    b.controller.update(0.25);
    expect(a.camera.renderOffset).toEqual(b.camera.renderOffset);
    expect(a.camera.renderOffset.x).not.toBe(0);
    expect(Math.abs(a.camera.renderOffset.x)).toBeLessThanOrEqual(5);
    expect(Math.abs(a.camera.renderOffset.y)).toBeLessThanOrEqual(10);
    expect(a.camera.position).toEqual(new Vector2(12, 34));
    const world = new Vector2(60, 70);
    const rendered = a.camera.worldToScreen(world);
    expect(rendered.x).toBeCloseTo(48 + a.camera.renderOffset.x);
    const picked = a.camera.screenToWorld(rendered);
    expect(picked.x).toBeCloseTo(world.x);
    expect(picked.y).toBeCloseTo(world.y);
    a.controller.update(0.5);
    expect(await handle.finished).toBe('completed');
    expect(a.camera.renderOffset).toEqual(new Vector2());
    expect(a.camera.position).toEqual(new Vector2(12, 34));
    const cancelled = a.controller.shake(options);
    a.controller.update(0.1);
    cancelled.cancel();
    expect(await cancelled.finished).toBe('cancelled');
    expect(a.camera.renderOffset).toEqual(new Vector2());
  });

  it('replaces shake atomically and defers reentrant behavior additions', async () => {
    const { camera, controller } = setup();
    const first = controller.shake({ duration: 1, amplitude: [2, 2], seed: 1 });
    controller.update(0.1);
    const second = controller.shake({ duration: 0, amplitude: [4, 4] });
    expect(await first.finished).toBe('cancelled');
    expect(camera.renderOffset).toEqual(new Vector2());
    controller.update(0);
    expect(await second.finished).toBe('completed');
    const later: CameraBehavior2D = {
      update(cam) {
        cam.position.x += 100;
      },
    };
    const firstBehavior: CameraBehavior2D = {
      update(cam) {
        cam.position.x += 1;
        controller.removeBehavior(firstBehavior);
        controller.addBehavior(later);
      },
    };
    controller.addBehavior(firstBehavior);
    controller.update(1);
    expect(camera.position.x).toBe(1);
    controller.update(1);
    expect(camera.position.x).toBe(101);
  });

  it('rejects invalid bounds, time, frequency and amplitudes without replacing active effects', () => {
    const { controller } = setup();
    const valid = controller.shake({ duration: 1, amplitude: [2, 2] });
    expect(() =>
      controller.shake({ duration: 1, amplitude: [NaN, 2] }),
    ).toThrow(RangeError);
    expect(() =>
      controller.shake({ duration: 1, amplitude: [2, 2], frequency: 0 }),
    ).toThrow(RangeError);
    expect(valid.state).toBe('queued');
    expect(() => controller.zoomTo(0, 1)).toThrow(RangeError);
    expect(() =>
      CameraStrategies.bounds({ x: 0, y: 0, width: -1, height: 10 }),
    ).toThrow(RangeError);
    expect(() =>
      CameraStrategies.follow(new GameObject(), { smoothTime: -1 }),
    ).toThrow(RangeError);
    expect(() => controller.update(Infinity)).toThrow(RangeError);
  });
});

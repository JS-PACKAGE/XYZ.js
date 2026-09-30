import { describe, expect, it, vi } from 'vitest';
import { FirstPersonControls } from '../packages/core/src/first-person-controls.js';
import { PerspectiveCamera } from '../packages/core/src/perspective-camera.js';

class FakeDocument extends EventTarget {
  pointerLockElement: unknown = null;
  exitPointerLock = vi.fn(() => {
    this.pointerLockElement = null;
    this.dispatchEvent(new Event('pointerlockchange'));
  });
}

function setup(refuse = false) {
  const document = new FakeDocument();
  const canvas = Object.assign(new EventTarget(), {
    ownerDocument: document,
    requestPointerLock: vi.fn(() => {
      queueMicrotask(() => {
        if (refuse) document.dispatchEvent(new Event('pointerlockerror'));
        else {
          document.pointerLockElement = canvas;
          document.dispatchEvent(new Event('pointerlockchange'));
        }
      });
    }),
  }) as unknown as HTMLCanvasElement & { requestPointerLock: () => void };
  const camera = new PerspectiveCamera();
  camera.position.set(0, 0, 0);
  const controls = new FirstPersonControls(camera, canvas);
  const move = (movementX: number, movementY: number) =>
    document.dispatchEvent(
      Object.assign(new Event('mousemove'), { movementX, movementY }),
    );
  const key = (type: 'keydown' | 'keyup', code: string) =>
    document.dispatchEvent(Object.assign(new Event(type), { code }));
  return { document, canvas, camera, controls, move, key };
}

/** Forward direction (-Z rotated by the camera quaternion). */
function forward(camera: PerspectiveCamera): [number, number, number] {
  const q = camera.rotation;
  return [
    -2 * (q.x * q.z + q.w * q.y),
    -2 * (q.y * q.z - q.w * q.x),
    -(1 - 2 * (q.x * q.x + q.y * q.y)),
  ];
}

describe('FirstPersonControls', () => {
  it('locks the pointer and reports lock and unlock events', async () => {
    const { controls, document } = setup();
    const events: string[] = [];
    controls.addEventListener('lock', () => events.push('lock'));
    controls.addEventListener('unlock', () => events.push('unlock'));
    expect(controls.isLocked).toBe(false);
    await controls.lock();
    expect(controls.isLocked).toBe(true);
    controls.unlock();
    expect(document.exitPointerLock).toHaveBeenCalledOnce();
    expect(events).toEqual(['lock', 'unlock']);
  });

  it('rejects when the browser refuses the lock', async () => {
    const { controls } = setup(true);
    await expect(controls.lock()).rejects.toThrow(/refused/);
  });

  it('turns with mouse movement and clamps pitch', async () => {
    const { controls, camera, move } = setup();
    move(100, 0); // ignored while unlocked
    expect(controls.yaw).toBe(0);
    await controls.lock();
    move(100, 0);
    expect(controls.yaw).toBeCloseTo(-100 * controls.lookSpeed);
    // Moving the mouse right turns right: the view direction gains +X.
    expect(forward(camera)[0]).toBeGreaterThan(0);
    move(0, -1e6); // mouse far up
    expect(controls.pitch).toBeCloseTo(controls.maxPitch);
    expect(forward(camera)[1]).toBeGreaterThan(0.99);
    move(0, 1e7);
    expect(controls.pitch).toBeCloseTo(controls.minPitch);
  });

  it('walks on the horizontal plane along the yaw direction', async () => {
    const { controls, camera, key } = setup();
    await controls.lock();
    controls.setRotation(Math.PI / 2, -0.7); // facing -X while looking down
    key('keydown', 'KeyW');
    controls.update(1);
    expect(camera.position.x).toBeCloseTo(-controls.moveSpeed);
    expect(camera.position.y).toBeCloseTo(0);
    expect(camera.position.z).toBeCloseTo(0);
    key('keyup', 'KeyW');
    key('keydown', 'KeyD'); // right of a -X heading is -Z
    camera.position.set(0, 0, 0);
    controls.update(1);
    expect(camera.position.z).toBeCloseTo(-controls.moveSpeed);
  });

  it('flies along the view pitch, sprints, and moves vertically', async () => {
    const { controls, camera, key } = setup();
    await controls.lock();
    controls.fly = true;
    controls.setRotation(0, Math.PI / 4);
    key('keydown', 'KeyW');
    key('keydown', 'ShiftLeft');
    controls.update(0.5);
    const distance = controls.moveSpeed * controls.sprintMultiplier * 0.5;
    expect(camera.position.y).toBeCloseTo(distance * Math.SQRT1_2);
    expect(camera.position.z).toBeCloseTo(-distance * Math.SQRT1_2);
    key('keyup', 'KeyW');
    key('keyup', 'ShiftLeft');
    camera.position.set(0, 0, 0);
    key('keydown', 'Space');
    controls.update(1);
    expect(camera.position.y).toBeCloseTo(controls.moveSpeed);
  });

  it('ignores input while unlocked, clears held keys on unlock, and validates delta', async () => {
    const { controls, camera, key } = setup();
    key('keydown', 'KeyW');
    controls.update(1);
    expect(camera.position.z).toBe(0);
    await controls.lock();
    key('keydown', 'KeyW');
    controls.unlock();
    await controls.lock();
    controls.update(1); // key was released by the unlock, not stuck
    expect(camera.position.z).toBe(0);
    expect(() => controls.update(-1)).toThrow(RangeError);
    expect(() => controls.update(Number.NaN)).toThrow(RangeError);
    expect(() => controls.setRotation(Number.NaN, 0)).toThrow(RangeError);
  });

  it('starts from the camera orientation and stops listening once destroyed', async () => {
    const { controls, camera, move, document } = setup();
    controls.setRotation(1.2, 0.3);
    const again = new FirstPersonControls(camera, controls.canvas);
    expect(again.yaw).toBeCloseTo(1.2);
    expect(again.pitch).toBeCloseTo(0.3);
    again.destroy();
    await controls.lock();
    controls.destroy();
    expect(document.exitPointerLock).toHaveBeenCalled();
    const yaw = controls.yaw;
    move(50, 50);
    expect(controls.yaw).toBe(yaw);
    await expect(controls.lock()).rejects.toThrow(/destroyed/);
  });
});

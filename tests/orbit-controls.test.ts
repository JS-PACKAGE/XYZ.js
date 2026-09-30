import { describe, expect, it } from 'vitest';
import { OrbitControls } from '../packages/core/src/orbit-controls.js';
import { OrthographicCamera } from '../packages/core/src/orthographic-camera.js';
import { PerspectiveCamera } from '../packages/core/src/perspective-camera.js';

class InputCanvas extends EventTarget {
  readonly style = { touchAction: 'pan-x' };
  readonly clientHeight = 400;
  private readonly captured = new Set<number>();
  setPointerCapture(id: number): void {
    this.captured.add(id);
  }
  hasPointerCapture(id: number): boolean {
    return this.captured.has(id);
  }
  releasePointerCapture(id: number): void {
    this.captured.delete(id);
  }
}

function input(
  canvas: InputCanvas,
  type: string,
  values: Record<string, number | boolean>,
): Event {
  const event = new Event(type, { cancelable: true });
  for (const [key, value] of Object.entries(values))
    Object.defineProperty(event, key, { value });
  canvas.dispatchEvent(event);
  return event;
}

describe('OrbitControls', () => {
  it('rotates about the target and ends capture on pointer cancellation', () => {
    const canvas = new InputCanvas();
    const camera = new PerspectiveCamera();
    const controls = new OrbitControls(
      camera,
      canvas as unknown as HTMLCanvasElement,
    );
    input(canvas, 'pointerdown', {
      pointerId: 1,
      button: 0,
      clientX: 0,
      clientY: 0,
    });
    input(canvas, 'pointermove', { pointerId: 1, clientX: 100, clientY: 0 });
    expect(camera.position.x).toBeCloseTo(-5);
    expect(camera.position.z).toBeCloseTo(0);
    const projected = camera.updateMatrix(1).transformPoint(controls.target);
    expect(projected.x).toBeCloseTo(0);
    expect(projected.y).toBeCloseTo(0);
    input(canvas, 'pointercancel', { pointerId: 1 });
    const position = camera.position.clone();
    input(canvas, 'pointermove', { pointerId: 1, clientX: 200, clientY: 0 });
    expect(camera.position).toEqual(position);
    expect(canvas.hasPointerCapture(1)).toBe(false);
    controls.destroy();
  });

  it('pans both position and target and clamps dolly distance and polar angle', () => {
    const canvas = new InputCanvas();
    const camera = new PerspectiveCamera();
    const controls = new OrbitControls(
      camera,
      canvas as unknown as HTMLCanvasElement,
    );
    input(canvas, 'pointerdown', {
      pointerId: 2,
      button: 2,
      clientX: 0,
      clientY: 0,
    });
    input(canvas, 'pointermove', { pointerId: 2, clientX: 40, clientY: 20 });
    input(canvas, 'pointerup', { pointerId: 2 });
    expect(controls.target.x).toBeLessThan(0);
    expect(controls.target.y).toBeGreaterThan(0);
    expect(
      camera.position.clone().subtract(controls.target).length(),
    ).toBeCloseTo(5);
    const projected = camera.updateMatrix(1).transformPoint(controls.target);
    expect(projected.x).toBeCloseTo(0);
    expect(projected.y).toBeCloseTo(0);
    controls.minDistance = 2;
    controls.maxDistance = 6;
    expect(
      input(canvas, 'wheel', { deltaY: 1000, deltaMode: 0 }).defaultPrevented,
    ).toBe(true);
    expect(
      camera.position.clone().subtract(controls.target).length(),
    ).toBeCloseTo(6);
    input(canvas, 'wheel', { deltaY: -5000, deltaMode: 0 });
    expect(
      camera.position.clone().subtract(controls.target).length(),
    ).toBeCloseTo(2);
    controls.minPolarAngle = 0.3;
    controls.maxPolarAngle = 0.8;
    controls.update();
    const offset = camera.position.clone().subtract(controls.target);
    expect(Math.acos(offset.y / offset.length())).toBeCloseTo(0.8);
    controls.destroy();
  });

  it('dollies orthographic zoom and stops changing the camera after disable/destroy', () => {
    const canvas = new InputCanvas();
    const camera = new OrthographicCamera();
    const controls = new OrbitControls(
      camera,
      canvas as unknown as HTMLCanvasElement,
    );
    controls.minZoom = 0.5;
    controls.maxZoom = 2;
    const position = camera.position.clone();
    input(canvas, 'wheel', { deltaY: -5000, deltaMode: 0 });
    expect(camera.zoom).toBe(2);
    expect(camera.position.x).toBeCloseTo(position.x);
    expect(camera.position.y).toBeCloseTo(position.y);
    expect(camera.position.z).toBeCloseTo(position.z);
    input(canvas, 'wheel', { deltaY: 5000, deltaMode: 0 });
    expect(camera.zoom).toBe(0.5);
    controls.enabled = false;
    expect(
      input(canvas, 'wheel', { deltaY: -5000, deltaMode: 0 }).defaultPrevented,
    ).toBe(false);
    expect(camera.zoom).toBe(0.5);
    controls.enabled = true;
    input(canvas, 'pointerdown', {
      pointerId: 3,
      button: 0,
      clientX: 0,
      clientY: 0,
    });
    controls.destroy();
    controls.destroy();
    expect(canvas.style.touchAction).toBe('pan-x');
    expect(canvas.hasPointerCapture(3)).toBe(false);
    input(canvas, 'wheel', { deltaY: -5000, deltaMode: 0 });
    input(canvas, 'pointermove', { pointerId: 3, clientX: 100, clientY: 100 });
    expect(camera.zoom).toBe(0.5);
    expect(camera.position.x).toBeCloseTo(position.x);
    expect(camera.position.y).toBeCloseTo(position.y);
    expect(camera.position.z).toBeCloseTo(position.z);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InputManager } from '../packages/input/src/index.js';
import { Vector2 } from '../packages/math/src/index.js';

class FakeCanvas extends EventTarget {
  readonly captures = new Set<number>();
  readonly setPointerCapture = vi.fn((id: number) => {
    this.captures.add(id);
  });
  readonly hasPointerCapture = vi.fn((id: number) => this.captures.has(id));
  readonly releasePointerCapture = vi.fn((id: number) => {
    this.captures.delete(id);
  });
  getBoundingClientRect(): DOMRect {
    return { left: 100, top: 50, width: 230, height: 120 } as DOMRect;
  }
}

function pointerEvent(
  type: string,
  properties: Partial<PointerEvent> = {},
): Event {
  return Object.assign(new Event(type), {
    pointerId: 1,
    pointerType: 'mouse',
    button: 0,
    clientX: 160,
    clientY: 90,
    ...properties,
  });
}

function keyEvent(type: string, code: string): Event {
  return Object.assign(new Event(type, { cancelable: true }), { code });
}

let canvas: FakeCanvas;
let windowEvents: EventTarget;
let documentEvents: EventTarget & { hidden: boolean };
let input: InputManager;

beforeEach(() => {
  canvas = new FakeCanvas();
  windowEvents = new EventTarget();
  documentEvents = Object.assign(new EventTarget(), { hidden: false });
  vi.stubGlobal('window', windowEvents);
  vi.stubGlobal('document', documentEvents);
  vi.stubGlobal('getComputedStyle', () => ({
    borderLeftWidth: '5px',
    borderRightWidth: '5px',
    borderTopWidth: '10px',
    borderBottomWidth: '10px',
    paddingLeft: '10px',
    paddingRight: '10px',
    paddingTop: '5px',
    paddingBottom: '5px',
  }));
  input = new InputManager(canvas as unknown as HTMLCanvasElement, () => ({
    width: 400,
    height: 180,
  }));
});

afterEach(() => {
  input.destroy();
  vi.unstubAllGlobals();
});

describe('InputManager', () => {
  it('tracks keyboard edges within a frame without consuming browser shortcuts', () => {
    const first = keyEvent('keydown', 'Space');
    windowEvents.dispatchEvent(first);
    windowEvents.dispatchEvent(keyEvent('keydown', 'Space'));
    expect(first.defaultPrevented).toBe(false);
    expect(input.keyboard.isDown('Space')).toBe(true);
    expect(input.keyboard.wasPressed('Space')).toBe(true);
    input.endFrame();
    expect(input.keyboard.isDown('Space')).toBe(true);
    expect(input.keyboard.wasPressed('Space')).toBe(false);
    windowEvents.dispatchEvent(keyEvent('keyup', 'Space'));
    expect(input.keyboard.isDown('Space')).toBe(false);
    expect(input.keyboard.wasReleased('Space')).toBe(true);
    input.endFrame();
    expect(input.keyboard.wasReleased('Space')).toBe(false);
    windowEvents.dispatchEvent(keyEvent('keydown', 'KeyA'));
    windowEvents.dispatchEvent(keyEvent('keyup', 'KeyA'));
    expect(input.keyboard.wasPressed('KeyA')).toBe(true);
    expect(input.keyboard.wasReleased('KeyA')).toBe(true);
  });

  it('ignores editable targets and resets held state on blur or hidden document', () => {
    input.keyboard.keyDown({
      code: 'KeyX',
      target: { tagName: 'INPUT' },
    } as unknown as KeyboardEvent);
    input.keyboard.keyDown({
      code: 'KeyX',
      target: { isContentEditable: true },
    } as unknown as KeyboardEvent);
    expect(input.keyboard.isDown('KeyX')).toBe(false);
    windowEvents.dispatchEvent(keyEvent('keydown', 'KeyX'));
    windowEvents.dispatchEvent(new Event('blur'));
    expect(input.keyboard.isDown('KeyX')).toBe(false);
    expect(input.keyboard.wasReleased('KeyX')).toBe(false);
    windowEvents.dispatchEvent(keyEvent('keydown', 'KeyX'));
    documentEvents.hidden = true;
    documentEvents.dispatchEvent(new Event('visibilitychange'));
    expect(input.keyboard.isDown('KeyX')).toBe(false);
    expect(input.keyboard.wasPressed('KeyX')).toBe(false);
  });

  it('maps pointer coordinates from CSS content box to logical pixels without using DPR', () => {
    vi.stubGlobal('devicePixelRatio', 3);
    canvas.dispatchEvent(pointerEvent('pointerenter'));
    expect(input.pointer.active).toBe(true);
    expect(input.pointer.position).toEqual(new Vector2(90, 50));
    canvas.dispatchEvent(
      pointerEvent('pointermove', { clientX: 115, clientY: 65 }),
    );
    expect(input.pointer.position).toEqual(new Vector2(0, 0));
    canvas.dispatchEvent(pointerEvent('pointerleave'));
    expect(input.pointer.active).toBe(false);
  });

  it('captures mouse and touch pointers, releases held buttons on up, cancel and lost capture', () => {
    canvas.dispatchEvent(pointerEvent('pointerdown', { pointerId: 1 }));
    expect(canvas.captures.has(1)).toBe(true);
    expect(input.pointer.isDown(0)).toBe(true);
    expect(input.pointer.wasPressed(0)).toBe(true);
    input.endFrame();
    canvas.dispatchEvent(
      pointerEvent('pointerdown', { pointerId: 2, pointerType: 'touch' }),
    );
    canvas.dispatchEvent(pointerEvent('pointerup', { pointerId: 1 }));
    expect(input.pointer.isDown(0)).toBe(true);
    expect(input.pointer.wasReleased(0)).toBe(false);
    canvas.dispatchEvent(
      pointerEvent('pointercancel', { pointerId: 2, pointerType: 'touch' }),
    );
    expect(canvas.captures.size).toBe(0);
    expect(input.pointer.active).toBe(false);
    expect(input.pointer.isDown(0)).toBe(false);
    expect(input.pointer.wasReleased(0)).toBe(true);
    input.endFrame();
    canvas.dispatchEvent(
      pointerEvent('pointerdown', { pointerId: 3, button: 2 }),
    );
    canvas.dispatchEvent(pointerEvent('lostpointercapture', { pointerId: 3 }));
    expect(input.pointer.wasReleased(2)).toBe(true);
    expect(input.pointer.isDown(2)).toBe(false);
  });

  it('polls a gamepad snapshot, retains disconnected slots and clears state on reset and destroy', () => {
    const pad = { axes: [0.5] } as unknown as Gamepad;
    let slots: (Gamepad | null)[] = [null, pad];
    vi.stubGlobal('navigator', { getGamepads: () => slots });
    input.update();
    const snapshot = input.gamepads;
    slots = [pad];
    expect(snapshot).toEqual([null, pad]);
    input.update();
    expect(input.gamepads).toEqual([pad]);
    windowEvents.dispatchEvent(keyEvent('keydown', 'KeyA'));
    canvas.dispatchEvent(pointerEvent('pointerdown'));
    input.reset();
    expect(input.keyboard.isDown('KeyA')).toBe(false);
    expect(input.pointer.isDown(0)).toBe(false);
    expect(input.gamepads).toEqual([]);
    input.destroy();
    windowEvents.dispatchEvent(keyEvent('keydown', 'KeyB'));
    canvas.dispatchEvent(pointerEvent('pointerdown'));
    expect(input.keyboard.isDown('KeyB')).toBe(false);
    expect(input.pointer.isDown(0)).toBe(false);
  });

  it('works with the lightweight Game test canvas while preserving registration failures', () => {
    input.destroy();
    const minimal = {} as HTMLCanvasElement;
    const headlessWindow = { devicePixelRatio: 2 };
    vi.stubGlobal('window', headlessWindow);
    const headless = new InputManager(minimal, () => ({ width: 1, height: 1 }));
    headless.update();
    headless.destroy();
    const failure = new Error('listener registration failed');
    vi.stubGlobal('document', {
      addEventListener: () => {
        throw failure;
      },
      removeEventListener: vi.fn(),
    });
    expect(
      () => new InputManager(minimal, () => ({ width: 1, height: 1 })),
    ).toThrow(failure);
  });
});

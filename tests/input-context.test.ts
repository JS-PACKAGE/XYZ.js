import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InputManager } from '../packages/input/src/index.js';
import type {
  ActionBinding,
  GamepadSnapshot,
  GestureDetail,
} from '../packages/input/src/index.js';

class Canvas extends EventTarget {
  readonly captures = new Set<number>();
  readonly style = {
    cursor: '',
    getPropertyPriority: () => '',
    setProperty: (_name: string, value: string) => {
      this.style.cursor = value;
    },
    removeProperty: () => {
      this.style.cursor = '';
    },
  };
  readonly offsetWidth = 100;
  readonly offsetHeight = 100;
  readonly clientHeight = 100;
  getBoundingClientRect(): DOMRect {
    return { left: 0, top: 0, width: 100, height: 100 } as DOMRect;
  }
  setPointerCapture(id: number): void {
    this.captures.add(id);
  }
  hasPointerCapture(id: number): boolean {
    return this.captures.has(id);
  }
  releasePointerCapture(id: number): void {
    this.captures.delete(id);
  }
}

function pad(index: number, button = 0, axes = [0, 0, 0, 0]): GamepadSnapshot {
  return {
    index,
    id: `player-${index}`,
    connected: true,
    mapping: 'standard',
    axes,
    buttons: Array.from({ length: 17 }, (_, slot) => ({
      value: slot === 0 ? button : 0,
    })),
  };
}

let input: InputManager;
let canvas: Canvas;
let windowEvents: EventTarget;
let pads: Array<GamepadSnapshot | null>;

function key(type: 'keydown' | 'keyup', code = 'Space'): void {
  windowEvents.dispatchEvent(Object.assign(new Event(type), { code }));
}

function pointer(type: string, properties: Partial<PointerEvent> = {}): void {
  canvas.dispatchEvent(
    Object.assign(new Event(type), {
      pointerId: 1,
      pointerType: 'touch',
      button: 0,
      buttons: type === 'pointerdown' ? 1 : 0,
      clientX: 20,
      clientY: 20,
      ...properties,
    }),
  );
}

function wheel(deltaY: number, deltaMode = 0): void {
  canvas.dispatchEvent(
    Object.assign(new Event('wheel'), {
      clientX: 20,
      clientY: 20,
      deltaX: 0,
      deltaY,
      deltaZ: 0,
      deltaMode,
    }),
  );
}

beforeEach(() => {
  canvas = new Canvas();
  windowEvents = new EventTarget();
  pads = [];
  vi.stubGlobal('window', windowEvents);
  vi.stubGlobal(
    'document',
    Object.assign(new EventTarget(), { hidden: false }),
  );
  vi.stubGlobal('navigator', { getGamepads: () => pads });
  vi.stubGlobal('getComputedStyle', () => ({}));
  input = new InputManager(canvas as unknown as HTMLCanvasElement, () => ({
    width: 100,
    height: 100,
  }));
});

afterEach(() => {
  input.destroy();
  vi.unstubAllGlobals();
});

describe('cross-device input contexts', () => {
  it('routes final release samples into gestures once and preserves pair identities', () => {
    let time = 0;
    const clock = vi.spyOn(performance, 'now').mockImplementation(() => time);
    const seen: GestureDetail[] = [];
    input.gestures.on('swipe', (detail) => seen.push(detail));
    input.gestures.on('tap', (detail) => seen.push(detail));
    input.gestures.on('pinch', (detail) => seen.push(detail));
    try {
      pointer('pointerdown', { clientX: 0, clientY: 0 });
      time = 20;
      pointer('pointerup', { clientX: 120, clientY: 0 });
      expect(seen).toHaveLength(1);
      expect(seen[0]).toMatchObject({
        type: 'swipe',
        center: { x: 120, y: 0 },
        pointerIds: [1],
      });
      input.endFrame();
      pointer('pointerdown', { pointerId: 19, clientX: 0, clientY: 0 });
      pointer('pointerdown', { pointerId: 3, clientX: 100, clientY: 0 });
      time = 40;
      pointer('pointermove', {
        pointerId: 3,
        clientX: 150,
        clientY: 0,
        buttons: 1,
      });
      time = 60;
      pointer('pointerup', { pointerId: 3, clientX: 200, clientY: 0 });
      expect(seen.at(-1)).toMatchObject({
        type: 'pinch',
        phase: 'end',
        scale: 2,
        pointerIds: [19, 3],
        center: { x: 100, y: 0 },
      });
      pointer('pointerup', { pointerId: 19, clientX: 0, clientY: 0 });
      expect(seen.filter((detail) => detail.type === 'tap')).toEqual([]);
    } finally {
      clock.mockRestore();
    }
  });

  it('reserves physical sources across differently named actions without mutating raw devices', () => {
    input.actions.bind('shoot', { key: 'Space' }, { pointerButton: 2 });
    const gameplay = input.contexts.create('gameplay', {
      bindings: { jump: [{ key: 'Space' }] },
    });
    const menu = input.contexts.create('menu', {
      priority: 10,
      bindings: {
        accept: [{ key: 'Space' }],
        sameSource: [{ key: 'Space' }],
        back: [{ pointerButton: 2 }],
      },
    });
    gameplay.activate();
    menu.activate();
    key('keydown');
    pointer('pointerdown', { button: 2, pointerType: 'mouse', buttons: 2 });
    input.update();
    expect(menu.wasPressed('accept')).toBe(true);
    expect(menu.wasPressed('sameSource')).toBe(true);
    expect(menu.wasPressed('back')).toBe(true);
    expect(gameplay.value('jump')).toBe(0);
    expect(gameplay.wasPressed('jump')).toBe(false);
    expect(input.actions.value('shoot')).toBe(0);
    expect(input.actions.wasPressed('shoot')).toBe(false);
    expect(input.keyboard.isDown('Space')).toBe(true);
    expect(input.pointer.isDown(2)).toBe(true);
  });

  it('keeps an action held across device-source handoff without duplicate presses or releases', () => {
    const gameplay = input.contexts.create('handoff', {
      bindings: {
        move: [
          { button: 'a' },
          { axis: 'leftX', direction: 1 },
          { key: 'KeyD' },
        ],
      },
    });
    gameplay.activate();
    pads = [pad(0)];
    input.update();
    input.endFrame();
    pads = [pad(0, 1)];
    input.update();
    expect(gameplay.wasPressed('move')).toBe(true);
    input.endFrame();
    pads = [pad(0, 0, [1, 0, 0, 0])];
    input.update();
    expect(gameplay.value('move')).toBe(1);
    expect(gameplay.wasPressed('move')).toBe(false);
    expect(gameplay.wasReleased('move')).toBe(false);
    input.endFrame();
    key('keydown', 'KeyD');
    pads = [pad(0)];
    input.update();
    expect(gameplay.value('move')).toBe(1);
    expect(gameplay.wasPressed('move')).toBe(false);
    expect(gameplay.wasReleased('move')).toBe(false);
    input.endFrame();
    key('keyup', 'KeyD');
    input.update();
    expect(gameplay.value('move')).toBe(0);
    expect(gameplay.wasReleased('move')).toBe(true);
  });

  it('uses priority then latest activation, while non-consuming overlays allow lower actions', () => {
    const first = input.contexts.create('first', {
      priority: 3,
      bindings: { first: [{ key: 'Space' }] },
    });
    const second = input.contexts.create('second', {
      priority: 3,
      bindings: { second: [{ key: 'Space' }] },
    });
    const overlay = input.contexts.create('overlay', {
      priority: 4,
      consume: false,
      bindings: { overlay: [{ key: 'Space' }] },
    });
    first.activate();
    second.activate();
    overlay.activate();
    key('keydown');
    input.update();
    expect(first.value('first')).toBe(0);
    expect(second.wasPressed('second')).toBe(true);
    expect(overlay.wasPressed('overlay')).toBe(true);
    input.endFrame();
    key('keyup');
    input.update();
    input.endFrame();
    first.deactivate();
    first.activate();
    key('keydown');
    input.update();
    expect(first.wasPressed('first')).toBe(true);
    expect(second.value('second')).toBe(0);
    expect(overlay.wasPressed('overlay')).toBe(true);
  });

  it('captures a UI pointer after polling without leaking or replaying the same-frame gameplay press', () => {
    input.actions.bind('legacyFire', { pointerButton: 0 });
    const gameplay = input.contexts.create('gameplay', {
      bindings: { fire: [{ pointerButton: 0 }] },
      consume: false,
    });
    const ui = input.contexts.create('ui', {
      priority: 100,
      bindings: { capture: [{ pointerButton: 0 }] },
    });
    gameplay.activate();
    pointer('pointerdown');
    input.update();
    expect(gameplay.wasPressed('fire')).toBe(true);
    expect(input.actions.wasPressed('legacyFire')).toBe(true);
    ui.activate();
    expect(gameplay.value('fire')).toBe(0);
    expect(gameplay.wasPressed('fire')).toBe(false);
    expect(input.actions.value('legacyFire')).toBe(0);
    expect(input.actions.wasPressed('legacyFire')).toBe(false);
    expect(ui.value('capture')).toBe(1);
    expect(ui.wasPressed('capture')).toBe(false);
    expect(input.pointer.isDown(0)).toBe(true);
    expect(input.pointer.wasPressed(0)).toBe(true);
    input.endFrame();
    input.update();
    expect(ui.wasPressed('capture')).toBe(false);
    ui.deactivate();
    expect(gameplay.value('fire')).toBe(1);
    expect(gameplay.wasPressed('fire')).toBe(false);
    expect(input.actions.value('legacyFire')).toBe(1);
    expect(input.actions.wasPressed('legacyFire')).toBe(false);
  });

  it('preserves a fresh world pointerdown that clears UI focus before polling while held controls remain neutral', () => {
    pads = [pad(7)];
    input.actions.bind('fire', { pointerButton: 0 });
    input.actions.bind('confirm', { button: 'a' });
    input.actions.bind('jump', { key: 'Space' });
    const gameplay = input.contexts.create('gameplay', {
      gamepadIndex: 7,
      consume: false,
      bindings: {
        fire: [{ pointerButton: 0 }],
        confirm: [{ button: 'a' }],
        jump: [{ key: 'Space' }],
      },
    });
    const ui = input.contexts.create('ui', {
      priority: 100,
      gamepadIndex: 7,
      bindings: {
        capture: [{ pointerButton: 0 }, { button: 'a' }, { key: 'Space' }],
      },
    });
    gameplay.activate();
    ui.activate();
    input.update();
    input.endFrame();
    pads = [pad(7, 1)];
    key('keydown');
    input.update();
    input.endFrame();
    canvas.addEventListener('pointerdown', () => ui.deactivate());
    pointer('pointerdown', { pointerType: 'mouse' });
    expect(gameplay.wasPressed('fire')).toBe(true);
    expect(input.actions.wasPressed('fire')).toBe(true);
    expect(gameplay.wasPressed('confirm')).toBe(false);
    expect(input.actions.wasPressed('confirm')).toBe(false);
    expect(gameplay.wasPressed('jump')).toBe(false);
    expect(input.actions.wasPressed('jump')).toBe(false);
    input.update();
    expect(gameplay.wasPressed('fire')).toBe(true);
    expect(input.actions.wasPressed('fire')).toBe(true);
    expect(input.pointer.isDown(0)).toBe(true);
    expect(input.keyboard.isDown('Space')).toBe(true);
    expect(input.gamepad.isDown('a')).toBe(true);
    input.endFrame();
    pointer('pointerup', { pointerType: 'mouse' });
    input.update();
    expect(gameplay.wasReleased('fire')).toBe(true);
    expect(gameplay.wasPressed('fire')).toBe(false);
    input.endFrame();
    pointer('pointerdown', { pointerType: 'mouse' });
    input.update();
    expect(gameplay.wasPressed('fire')).toBe(true);
    expect(input.actions.wasPressed('fire')).toBe(true);
    expect(gameplay.wasPressed('confirm')).toBe(false);
    expect(gameplay.wasPressed('jump')).toBe(false);
  });

  it('distinguishes a new pointer press from the consumed UI click even without an intervening frame', () => {
    input.actions.bind('fire', { pointerButton: 0 });
    const gameplay = input.contexts.create('gameplay', {
      consume: false,
      bindings: { fire: [{ pointerButton: 0 }] },
    });
    const ui = input.contexts.create('ui', {
      priority: 100,
      bindings: { capture: [{ pointerButton: 0 }] },
    });
    gameplay.activate();
    canvas.addEventListener('pointerdown', (event) => {
      if ((event as PointerEvent).clientX < 50) ui.activate();
      else ui.deactivate();
    });
    pointer('pointerdown');
    input.update();
    expect(gameplay.wasPressed('fire')).toBe(false);
    expect(input.actions.wasPressed('fire')).toBe(false);
    pointer('pointerup');
    pointer('pointerdown', { clientX: 80 });
    input.update();
    expect(gameplay.wasPressed('fire')).toBe(true);
    expect(input.actions.wasPressed('fire')).toBe(true);
    ui.activate();
    ui.deactivate();
    expect(gameplay.wasPressed('fire')).toBe(false);
    expect(input.actions.wasPressed('fire')).toBe(false);
    expect(input.pointer.isDown(0)).toBe(true);
  });

  it('does not manufacture held presses on activation, unblocking, or removal and emits releases', () => {
    input.actions.bind('shoot', { key: 'Space' });
    key('keydown');
    input.update();
    expect(input.actions.wasPressed('shoot')).toBe(true);
    input.endFrame();
    const menu = input.contexts.create('menu', {
      bindings: { accept: [{ key: 'Space' }] },
    });
    menu.activate();
    expect(menu.value('accept')).toBe(1);
    expect(menu.wasPressed('accept')).toBe(false);
    expect(input.actions.wasReleased('shoot')).toBe(true);
    input.update();
    expect(menu.wasPressed('accept')).toBe(false);
    input.endFrame();
    menu.deactivate();
    expect(menu.wasReleased('accept')).toBe(true);
    expect(input.actions.value('shoot')).toBe(1);
    expect(input.actions.wasPressed('shoot')).toBe(false);
    input.update();
    expect(input.actions.wasPressed('shoot')).toBe(false);
    input.endFrame();
    key('keyup');
    input.update();
    input.endFrame();
    menu.activate();
    key('keydown');
    input.update();
    expect(menu.wasPressed('accept')).toBe(true);
    menu.destroy();
    expect(menu.wasReleased('accept')).toBe(true);
    expect(menu.value('accept')).toBe(0);
    expect(input.actions.value('shoot')).toBe(1);
    expect(input.actions.wasPressed('shoot')).toBe(false);
  });

  it('routes actual browser gamepad indices independently and releases disconnected players', () => {
    pads = [pad(7), pad(3)];
    input.actions.bind('legacy', { button: 'a' });
    const one = input.contexts.create('one', {
      gamepadIndex: 7,
      bindings: { jump: [{ button: 'a' }] },
    });
    const two = input.contexts.create('two', {
      gamepadIndex: 3,
      bindings: { jump: [{ button: 'a' }] },
    });
    one.activate();
    two.activate();
    input.update();
    input.endFrame();
    pads = [pad(7, 1), pad(3, 0.75)];
    input.update();
    expect(one.value('jump')).toBe(1);
    expect(two.value('jump')).toBe(0.75);
    expect(one.wasPressed('jump')).toBe(true);
    expect(two.wasPressed('jump')).toBe(true);
    expect(input.actions.value('legacy')).toBe(0);
    expect(input.gamepad.index).toBe(7);
    input.endFrame();
    pads = [null, pad(3, 0.75)];
    input.update();
    expect(one.wasReleased('jump')).toBe(true);
    expect(one.value('jump')).toBe(0);
    expect(two.value('jump')).toBe(0.75);
    expect(two.wasPressed('jump')).toBe(false);
    input.endFrame();
    pads = [pad(7, 1), pad(3, 0.75)];
    input.update();
    expect(one.value('jump')).toBe(1);
    expect(one.wasPressed('jump')).toBe(false);
    input.endFrame();
    one.destroy();
    const replacement = input.contexts.create('replacement', {
      gamepadIndex: 7,
      bindings: { accept: [{ button: 'a' }] },
    });
    replacement.activate();
    expect(replacement.value('accept')).toBe(1);
    expect(replacement.wasPressed('accept')).toBe(false);
    expect(input.actions.value('legacy')).toBe(0);
  });

  it('uses custom raw mapping identities, including trigger-axis aliases and axis halves', () => {
    input.gamepad.addMapping({
      match: 'custom',
      buttons: { a: 2, b: 2 },
      triggerAxes: { rt: 0 },
      axes: { leftX: 0 },
    });
    const lower = input.contexts.create('lower', {
      gamepadIndex: 9,
      bindings: {
        button: [{ button: 'b' }],
        left: [{ axis: 'leftX', direction: -1 }],
      },
    });
    const upper = input.contexts.create('upper', {
      priority: 1,
      gamepadIndex: 9,
      bindings: { button: [{ button: 'a' }], trigger: [{ button: 'rt' }] },
    });
    lower.activate();
    upper.activate();
    const custom = (button: number, axis: number): GamepadSnapshot => ({
      ...pad(9),
      id: 'custom pad',
      mapping: '',
      axes: [axis],
      buttons: [{ value: 0 }, { value: 0 }, { value: button }],
    });
    pads = [custom(0, -1)];
    input.update();
    input.endFrame();
    pads = [custom(1, -0.8)];
    input.update();
    expect(upper.wasPressed('button')).toBe(true);
    expect(upper.value('trigger')).toBeCloseTo(0.1);
    expect(lower.value('button')).toBe(0);
    expect(lower.value('left')).toBe(0);
    expect(lower.wasPressed('button')).toBe(false);
  });

  it('pulses normalized wheel and real recognized gestures without replaying stale input', () => {
    input.actions.bind('lowerTap', { pointerButton: 0 });
    const menu = input.contexts.create('menu', {
      bindings: {
        scroll: [{ wheel: 'y', direction: -1 }],
        tap: [{ gesture: 'tap' }],
        pan: [{ gesture: 'pan' }],
      },
    });
    menu.activate();
    wheel(-0.05, 1);
    pointer('pointerdown');
    pointer('pointerup');
    input.update();
    expect(menu.value('scroll')).toBeCloseTo(0.8);
    expect(menu.wasPressed('scroll')).toBe(true);
    expect(menu.wasPressed('tap')).toBe(true);
    expect(input.actions.wasPressed('lowerTap')).toBe(false);
    input.endFrame();
    input.update();
    expect(menu.value('scroll')).toBe(0);
    expect(menu.wasReleased('scroll')).toBe(true);
    expect(menu.wasReleased('tap')).toBe(true);
    expect(menu.wasPressed('tap')).toBe(false);
    input.endFrame();
    pointer('pointerdown');
    pointer('pointermove', { clientX: 80, buttons: 1 });
    input.update();
    expect(menu.wasPressed('pan')).toBe(true);
    input.endFrame();
    pointer('pointermove', { clientX: 90, buttons: 1 });
    input.update();
    expect(menu.wasPressed('pan')).toBe(true);
    input.reset();
    input.update();
    expect(menu.value('pan')).toBe(0);
    expect(menu.wasPressed('pan')).toBe(false);
    input.endFrame();
    pointer('pointerdown');
    pointer('pointerup');
    input.pointer.reset();
    input.update();
    expect(menu.value('tap')).toBe(0);
    expect(menu.wasPressed('tap')).toBe(false);
  });

  it('exposes analog joystick halves, short touch taps and neutral release on reset, blur and teardown', () => {
    const touch = input.contexts.create('touch', {
      bindings: {
        left: [{ virtual: 'stickX', direction: -1 }],
        right: [{ virtual: 'stickX' }],
        tap: [{ virtual: 'button' }],
      },
    });
    touch.activate();
    input.virtual.set('stickX', -0.8);
    input.virtual.set('button', 1);
    input.virtual.set('button', 0);
    input.update();
    expect(touch.value('left')).toBe(0.8);
    expect(touch.value('right')).toBe(0);
    expect(touch.wasPressed('left')).toBe(true);
    expect(touch.wasPressed('tap')).toBe(true);
    expect(touch.wasReleased('tap')).toBe(true);
    input.endFrame();
    input.virtual.reset();
    input.update();
    expect(touch.wasReleased('left')).toBe(true);
    expect(touch.wasPressed('left')).toBe(false);
    input.endFrame();
    input.virtual.set('stickX', 0.7);
    input.update();
    input.endFrame();
    input.reset();
    expect(input.virtual.value('stickX')).toBe(0);
    expect(touch.wasReleased('right')).toBe(true);
    input.update();
    expect(touch.wasReleased('right')).toBe(true);
    expect(touch.wasPressed('right')).toBe(false);
    input.endFrame();
    input.virtual.set('stickX', 1);
    input.update();
    windowEvents.dispatchEvent(new Event('blur'));
    expect(input.virtual.value('stickX')).toBe(0);
    expect(touch.value('right')).toBe(0);
    input.virtual.set('stickX', 1);
    input.update();
    input.destroy();
    expect(input.virtual.value('stickX')).toBe(0);
    expect(touch.wasReleased('right')).toBe(true);
    expect(() => input.virtual.set('stickX', 1)).toThrow();
  });

  it('round-trips every supported binding through JSON and rejects invalid imports atomically', () => {
    const bindings: Record<string, readonly ActionBinding[]> = {
      key: [{ key: 'Space' }],
      button: [{ button: 'a' }],
      axis: [{ axis: 'leftX', direction: 1 }],
      pointer: [{ pointerButton: 2 }],
      wheel: [{ wheel: 'y', direction: 1 }],
      gesture: [{ gesture: 'tap' }],
      virtual: [{ virtual: 'stick', direction: -1 }],
    };
    const original = input.contexts.create('original', { bindings });
    const restored = input.contexts.create('restored');
    restored.importBindings(
      JSON.parse(JSON.stringify(original.exportBindings())),
    );
    expect(() =>
      restored.importBindings({
        bad: [{ wheel: 'invalid', direction: 1 } as never],
      }),
    ).toThrow(RangeError);
    expect(() =>
      restored.rebind('key', [{ key: 'Space', virtual: 'ambiguous' } as never]),
    ).toThrow(RangeError);
    expect(() => input.contexts.create('bad', { gamepadIndex: -1 })).toThrow(
      RangeError,
    );
    expect(() => input.contexts.create('bad', { priority: Infinity })).toThrow(
      RangeError,
    );
    expect(() => input.virtual.set('stick', NaN)).toThrow(RangeError);
    restored.activate();
    pads = [pad(0)];
    input.update();
    input.endFrame();
    pads = [pad(0, 1, [1, 0, 0, 0])];
    key('keydown');
    pointer('pointerdown', {
      pointerId: 2,
      button: 2,
      pointerType: 'mouse',
      buttons: 2,
    });
    pointer('pointerdown');
    pointer('pointerup');
    wheel(1);
    input.virtual.set('stick', -0.75);
    input.update();
    for (const action of Object.keys(bindings))
      expect(restored.wasPressed(action)).toBe(true);
    expect(restored.value('virtual')).toBe(0.75);
    expect(restored.value('pointer')).toBe(1);
    expect(restored.value('axis')).toBe(1);
  });
});

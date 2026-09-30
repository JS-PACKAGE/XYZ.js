import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ActionMap,
  GamepadState,
  InputManager,
  Keyboard,
  type GamepadSnapshot,
} from '../packages/input/src/index.js';

function pad(
  overrides: {
    index?: number;
    mapping?: string;
    connected?: boolean;
    buttons?: Record<number, number>;
    axes?: number[];
  } = {},
): GamepadSnapshot {
  const buttons = Array.from({ length: 17 }, (_, i) => ({
    value: overrides.buttons?.[i] ?? 0,
  }));
  return {
    index: overrides.index ?? 0,
    id: 'test pad',
    connected: overrides.connected ?? true,
    mapping: overrides.mapping ?? 'standard',
    buttons,
    axes: overrides.axes ?? [0, 0, 0, 0],
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GamepadState', () => {
  it('reports press and release edges once and analog trigger values', () => {
    const state = new GamepadState();
    state.update([pad()]);
    expect(state.connected).toBe(true);
    state.update([pad({ buttons: { 0: 1, 7: 0.4 } })]);
    expect(state.wasPressed('a')).toBe(true);
    expect(state.isDown('a')).toBe(true);
    expect(state.button('rt')).toBeCloseTo(0.4);
    expect(state.isDown('rt')).toBe(false);
    expect(state.firstPressed()).toBe('a');
    state.update([pad({ buttons: { 0: 1, 7: 0.9 } })]);
    expect(state.wasPressed('a')).toBe(false);
    expect(state.wasPressed('rt')).toBe(true);
    state.update([pad()]);
    expect(state.wasReleased('a')).toBe(true);
    expect(state.wasReleased('rt')).toBe(true);
    state.update([pad()]);
    expect(state.wasReleased('a')).toBe(false);
  });

  it('applies a radial deadzone that ramps from zero to full deflection', () => {
    const state = new GamepadState();
    state.deadzone = 0.2;
    state.update([pad({ axes: [0.19, 0, 0, 0] })]);
    expect(state.stick('left')).toEqual({ x: 0, y: 0 });
    state.update([pad({ axes: [1, 0, 0, -0.6] })]);
    expect(state.axis('leftX')).toBeCloseTo(1);
    expect(state.stick('right').y).toBeCloseTo(-0.5);
    // Diagonal input beyond magnitude 1 is clamped, not amplified.
    state.update([pad({ axes: [1, 1, 0, 0] })]);
    expect(Math.hypot(state.axis('leftX'), state.axis('leftY'))).toBeCloseTo(1);
    expect(() => {
      state.deadzone = 1;
    }).toThrow(RangeError);
  });

  it('ignores non-standard and disconnected pads and honours preferredIndex', () => {
    const state = new GamepadState();
    state.update([
      pad({ mapping: '', buttons: { 0: 1 } }),
      pad({ index: 1, connected: false, buttons: { 0: 1 } }),
      null,
      pad({ index: 3, buttons: { 1: 1 } }),
    ]);
    expect(state.index).toBe(3);
    expect(state.isDown('b')).toBe(true);
    state.preferredIndex = 2;
    state.update([pad({ index: 0 }), null, null, pad({ index: 3 })]);
    expect(state.connected).toBe(false);
    expect(() => {
      state.preferredIndex = -1;
    }).toThrow(RangeError);
  });

  it('does not report already-held buttons as presses when a pad is first selected', () => {
    const state = new GamepadState();
    state.update([pad({ buttons: { 0: 1 } })]);
    expect(state.isDown('a')).toBe(true);
    expect(state.wasPressed('a')).toBe(false);
    state.update([]);
    expect(state.connected).toBe(false);
    expect(state.wasReleased('a')).toBe(true);
    expect(state.isDown('a')).toBe(false);
  });
});

describe('ActionMap', () => {
  function setup() {
    const state = new GamepadState();
    const keys = new Set<string>();
    const pressed = new Set<string>();
    const keyboard = {
      isDown: (code: string) => keys.has(code),
      wasPressed: (code: string) => pressed.has(code),
      wasReleased: () => false,
    };
    const actions = new ActionMap(state, keyboard);
    const frame = (snapshot: GamepadSnapshot | null) => {
      state.update(snapshot ? [snapshot] : []);
      actions.update();
    };
    return { state, keys, pressed, actions, frame };
  }

  it('combines button, stick-direction and key sources with edges', () => {
    const { keys, pressed, actions, frame } = setup();
    actions.bind(
      'jump',
      { button: 'a' },
      { key: 'Space' },
      { axis: 'leftX', direction: -1 },
    );
    frame(pad());
    expect(actions.isDown('jump')).toBe(false);
    frame(pad({ buttons: { 0: 1 } }));
    expect(actions.wasPressed('jump')).toBe(true);
    frame(pad({ buttons: { 0: 1 } }));
    expect(actions.wasPressed('jump')).toBe(false);
    frame(pad({ axes: [-1, 0, 0, 0] }));
    expect(actions.isDown('jump')).toBe(true);
    expect(actions.wasPressed('jump')).toBe(false);
    expect(actions.value('jump')).toBeCloseTo(1);
    frame(pad({ axes: [1, 0, 0, 0] }));
    expect(actions.isDown('jump')).toBe(false);
    expect(actions.wasReleased('jump')).toBe(true);
    // A key tap contained within one frame still yields a press edge.
    pressed.add('Space');
    frame(pad());
    expect(actions.wasPressed('jump')).toBe(true);
    pressed.clear();
    keys.add('Space');
    frame(pad());
    expect(actions.isDown('jump')).toBe(true);
  });

  it('rebinds atomically and round-trips through export/import, rejecting bad data untouched', () => {
    const { actions, frame } = setup();
    actions.bind('fire', { button: 'x' });
    actions.bind('fire', { button: 'x' });
    expect(actions.bindings('fire')).toHaveLength(1);
    actions.rebind('fire', [{ button: 'b' }, { axis: 'rightY', direction: 1 }]);
    frame(pad({ buttons: { 2: 1 } }));
    expect(actions.isDown('fire')).toBe(false);
    frame(pad({ buttons: { 1: 1 } }));
    expect(actions.isDown('fire')).toBe(true);

    const saved = JSON.parse(JSON.stringify(actions.export()));
    const other = setup().actions;
    other.import(saved);
    expect(other.bindings('fire')).toEqual([
      { button: 'b' },
      { axis: 'rightY', direction: 1 },
    ]);

    expect(() =>
      other.import({
        ok: [{ button: 'a' }],
        bad: [{ button: 'nope' } as never],
      }),
    ).toThrow(RangeError);
    expect(other.bindings('fire')).toHaveLength(2);
    expect(() =>
      other.bind('x', { axis: 'leftX', direction: 0 } as never),
    ).toThrow(RangeError);
    expect(() => other.bind('__proto__', { button: 'a' })).toThrow(RangeError);
    expect(other.unbind('fire')).toBe(true);
    expect(other.value('fire')).toBe(0);
  });
});

describe('InputManager gamepad integration', () => {
  it('feeds navigator.getGamepads into the shared gamepad and actions once per update', () => {
    const windowEvents = new EventTarget();
    vi.stubGlobal('window', windowEvents);
    vi.stubGlobal(
      'document',
      Object.assign(new EventTarget(), { hidden: false }),
    );
    let current: GamepadSnapshot[] = [pad()];
    vi.stubGlobal('navigator', { getGamepads: () => current });
    const input = new InputManager(
      new EventTarget() as unknown as HTMLCanvasElement,
      () => ({ width: 100, height: 100 }),
    );
    input.actions.bind('confirm', { button: 'a' });
    input.update();
    current = [pad({ buttons: { 0: 1 } })];
    input.update();
    expect(input.gamepad.isDown('a')).toBe(true);
    expect(input.actions.wasPressed('confirm')).toBe(true);
    input.update();
    expect(input.actions.wasPressed('confirm')).toBe(false);
    expect(input.keyboard).toBeInstanceOf(Keyboard);
    input.destroy();
    expect(input.gamepad.connected).toBe(false);
  });
});

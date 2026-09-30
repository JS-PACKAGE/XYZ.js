import { describe, expect, it } from 'vitest';
import { GameObject } from '../packages/core/src/game-object.js';
import { Scene } from '../packages/core/src/scene.js';
import {
  Actions,
  ActionQueue,
  Easings,
  type ActionHandle,
} from '../packages/core/src/actions2d/index.js';

function setup() {
  const owner = new GameObject();
  const queue = new ActionQueue(owner);
  return { owner, queue };
}

describe('2D action time and ownership', () => {
  it('consumes overshoot through sequence and FIFO runs with exact completion', async () => {
    const { owner, queue } = setup();
    const events: string[] = [];
    for (const name of ['actionstart', 'actioncomplete', 'actioncancel'])
      owner.addEventListener(name, () => events.push(name));
    const first = queue.run(
      Actions.sequence(
        Actions.moveTo(10, 20, 1),
        Actions.delay(0.5),
        Actions.moveBy(20, -10, 1),
      ),
    );
    const second = queue.run(Actions.fadeTo(0, 1));
    queue.update(2);
    expect(owner.position.x).toBe(20);
    expect(owner.position.y).toBe(15);
    expect(first.state).toBe('running');
    expect(second.state).toBe('queued');
    queue.update(1);
    expect(owner.position.x).toBe(30);
    expect(owner.position.y).toBe(10);
    expect(owner.opacity).toBe(0.5);
    expect(await first.finished).toBe('completed');
    queue.update(0.5);
    expect(await second.finished).toBe('completed');
    expect(events).toEqual([
      'actionstart',
      'actioncomplete',
      'actionstart',
      'actioncomplete',
    ]);
  });

  it('captures every fresh run at start, repeats relative moves, and waits for all parallel branches', async () => {
    const { owner, queue } = setup();
    const move = Actions.moveBy(10, 0, 1);
    const handle = queue.run(
      Actions.sequence(
        Actions.repeat(move, 3),
        Actions.parallel(
          Actions.rotateTo(Math.PI, 1),
          Actions.scaleTo(-2, 3, 2),
        ),
      ),
    );
    owner.position.x = 5;
    queue.update(3.5);
    expect(owner.position.x).toBe(35);
    expect(owner.rotation).toBeCloseTo(Math.PI / 2);
    expect(owner.scale.x).toBe(0.25);
    queue.update(1.5);
    expect(await handle.finished).toBe('completed');
    expect(owner.rotation).toBe(Math.PI);
    expect(owner.scale.x).toBe(-2);
    expect(owner.scale.y).toBe(3);
    const second = queue.run(move);
    queue.update(1);
    expect(await second.finished).toBe('completed');
    expect(owner.position.x).toBe(45);
  });

  it('keeps reused descriptors independent across owners and supports numeric snapshots', () => {
    const a = setup(),
      b = setup();
    const move = Actions.moveBy(12, 0, 2, Easings.quadIn);
    a.queue.run(move);
    b.queue.run(move);
    a.queue.update(1);
    b.queue.update(2);
    expect(a.owner.position.x).toBe(3);
    expect(b.owner.position.x).toBe(12);
    const target = { score: 2, energy: 4 };
    const values = { score: 10, energy: 12 };
    const tween = Actions.tween(target, values, 1);
    values.score = 100;
    a.queue.run(tween);
    target.score = 6;
    a.queue.update(1.5);
    expect(target).toEqual({ score: 8, energy: 8 });
    a.queue.update(0.5);
    expect(target).toEqual({ score: 10, energy: 12 });
  });

  it('stops cancellation reentry before subsequent children and settles without rejection', async () => {
    const { owner, queue } = setup();
    const handle: ActionHandle = queue.run(
      Actions.sequence(
        Actions.call(() => handle.cancel()),
        Actions.moveTo(100, 0, 0),
      ),
    );
    queue.update(10);
    expect(owner.position.x).toBe(0);
    expect(await handle.finished).toBe('cancelled');
    const target = {
      value: 0,
      get first() {
        return this.value;
      },
      set first(value: number) {
        this.value = value;
        active.cancel();
      },
      second: 0,
    };
    const active = queue.run(
      Actions.tween(target, { first: 10, second: 20 }, 1),
    );
    queue.update(1);
    expect(target.value).toBe(10);
    expect(target.second).toBe(0);
    expect(await active.finished).toBe('cancelled');
  });

  it('defers callback-enqueued actions, supports clear reentry, and ignores recursive update', async () => {
    const { owner, queue } = setup();
    let next: ActionHandle | undefined;
    owner.addEventListener(
      'actioncancel',
      () => {
        next = queue.run(Actions.moveTo(8, 0, 0));
      },
      { once: true },
    );
    const handle = queue.run(
      Actions.call(() => {
        queue.update(99);
        queue.clear();
      }),
    );
    queue.update(1);
    expect(await handle.finished).toBe('cancelled');
    expect(next?.state).toBe('queued');
    expect(owner.position.x).toBe(0);
    queue.update(0);
    expect(owner.position.x).toBe(8);
    expect(next?.state).toBe('completed');
    const queued = queue.run(Actions.delay(20));
    queue.destroy();
    expect(await queued.finished).toBe('cancelled');
    expect(() => queue.run(Actions.delay(1))).toThrow();
  });

  it('settles running and queued actions when the owner is destroyed during a callback', async () => {
    const { owner, queue } = setup();
    const active = queue.run(
      Actions.sequence(
        Actions.call(() => owner.destroy()),
        Actions.moveBy(50, 0, 0),
      ),
    );
    const waiting = queue.run(Actions.delay(10));
    queue.update(1);
    expect(owner.position.x).toBe(0);
    expect(await active.finished).toBe('cancelled');
    expect(await waiting.finished).toBe('cancelled');
  });

  it('stops a removed owner at callback barriers but preserves its reusable action', () => {
    const scene = new Scene();
    const { owner, queue } = setup();
    scene.add(owner);
    const handle = queue.run(
      Actions.sequence(
        Actions.call(() => scene.remove(owner)),
        Actions.moveBy(10, 0, 1),
      ),
    );
    queue.update(2);
    expect(owner.position.x).toBe(0);
    expect(handle.state).toBe('running');
    queue.update(0.5);
    expect(owner.position.x).toBe(5);
  });

  it('does not continue after removal and re-addition to the same scene in one callback', () => {
    const scene = new Scene();
    const { owner, queue } = setup();
    scene.add(owner);
    const handle = queue.run(
      Actions.sequence(
        Actions.call(() => {
          scene.remove(owner);
          scene.add(owner);
        }),
        Actions.moveBy(10, 0, 1),
      ),
    );
    queue.update(2);
    expect(owner.scene).toBe(scene);
    expect(owner.position.x).toBe(0);
    expect(handle.state).toBe('running');
    queue.update(0.5);
    expect(owner.position.x).toBe(5);
  });

  it('honors scene continuation changes inside callbacks and resumes remaining work later', () => {
    const scene = new Scene();
    const owner = scene.add(new GameObject());
    let canContinue = true;
    const handle = owner.actions.run(
      Actions.sequence(
        Actions.call(() => {
          canContinue = false;
        }),
        Actions.moveBy(10, 0, 1),
      ),
    );
    scene.beginObjectFrame();
    scene.advanceActions(2, () => canContinue);
    expect(owner.position.x).toBe(0);
    expect(handle.state).toBe('running');
    canContinue = true;
    scene.beginObjectFrame();
    scene.advanceActions(0.5, () => canContinue);
    expect(owner.position.x).toBe(5);
  });

  it('bounds zero-time work and rejects non-progressing infinite loops', async () => {
    const { queue } = setup();
    expect(() =>
      Actions.repeatForever(
        Actions.sequence(
          Actions.delay(0),
          Actions.call(() => {}),
        ),
      ),
    ).toThrow(RangeError);
    const finite = queue.run(Actions.repeat(Actions.delay(0), 20000));
    expect(() => queue.update(0)).toThrow(/bounded iteration/);
    expect(await finite.finished).toBe('cancelled');
    const looping = queue.run(Actions.repeatForever(Actions.moveBy(1, 0, 0.5)));
    queue.update(2.25);
    expect(queue.owner.position.x).toBe(4.5);
    looping.cancel();
    expect(await looping.finished).toBe('cancelled');
  });

  it('validates numeric properties and normalized easing boundaries', () => {
    for (const easing of Object.values(Easings)) {
      expect(easing(-1)).toBe(0);
      expect(easing(0)).toBe(0);
      expect(easing(1)).toBe(1);
      expect(easing(2)).toBe(1);
      for (const progress of [0.1, 0.3, 0.7, 0.9]) {
        expect(easing(progress)).toBeGreaterThanOrEqual(0);
        expect(easing(progress)).toBeLessThanOrEqual(1);
      }
    }
    expect(Easings.quadIn(0.5)).toBe(0.25);
    expect(Easings.cubicOut(0.5)).toBe(0.875);
    expect(Easings.sineInOut(0.5)).toBeCloseTo(0.5);
    expect(() =>
      Actions.tween({ nested: { x: 1 } }, { 'nested.x': 2 }, 1),
    ).toThrow(TypeError);
    expect(() => Actions.tween({ x: Infinity }, { x: 2 }, 1)).toThrow(
      RangeError,
    );
    expect(() => Actions.delay(-1)).toThrow(RangeError);
    expect(() => Actions.fadeTo(2, 1)).toThrow(RangeError);
    const { queue } = setup();
    const invalid = queue.run(Actions.moveTo(5, 0, 1, () => NaN));
    expect(() => queue.update(0.5)).toThrow(RangeError);
    expect(invalid.state).toBe('cancelled');
  });
});

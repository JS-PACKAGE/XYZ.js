import { expect, it, vi } from 'vitest';
import { Scene, Sprite, Texture } from '../../src/index.js';

it('keeps a cross-scene borrowed texture alive when a timer destroys its scene and publishes detached removal state', () => {
  const close = vi.fn();
  const texture = new Texture({
    width: 8,
    height: 8,
    close,
  } as unknown as ImageBitmap);
  const retired = new Scene();
  const surviving = new Scene();
  const first = retired.add(new Sprite({ texture }));
  const second = surviving.add(new Sprite({ texture }));
  const events: string[] = [];
  first.addEventListener('remove', () => {
    events.push(`remove:${retired.has(first)}:${first.scene === undefined}`);
  });
  first.addEventListener('destroy', () => {
    events.push(
      `destroy:${first.destroyed}:${second.destroyed}:${texture.destroyed}`,
    );
  });
  const pending = retired.timers.after(2, () => events.push('obsolete'));
  retired.timers.after(1, () => retired.destroy());
  retired.advanceTimers(0.5);
  expect(events).toEqual([]);
  retired.advanceTimers(0.5);
  retired.advanceTimers(2);
  expect(events).toEqual(['remove:false:true', 'destroy:true:false:false']);
  expect(pending.active).toBe(false);
  expect(second.texture).toBe(texture);
  expect(surviving.has(second)).toBe(true);
  expect(close).not.toHaveBeenCalled();
  surviving.destroy();
  expect(texture.destroyed).toBe(false);
  texture.destroy();
  expect(close).toHaveBeenCalledOnce();
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Pointer } from '../packages/input/src/index.js';
import { Texture } from '../packages/assets/src/index.js';
import { Scene } from '../packages/core/src/scene.js';
import { Sprite } from '../packages/core/src/sprite.js';
import { Group2D } from '../packages/core/src/gameplay/group2d.js';
import { Colliders } from '../packages/core/src/physics2d/collider.js';
import { Vector2 } from '../packages/math/src/index.js';
import type { PointerTargetEventDetail } from '../packages/core/src/gameplay/pointer-router.js';
import { inputLimits } from '../src/data/input.js';

let scene: Scene;
let pointer: Pointer;
let texture: Texture;
const continueFrame = () => true;

beforeEach(() => {
  const captures = new Set<number>();
  const canvas = {
    getBoundingClientRect: () => ({
      left: 10,
      top: 20,
      width: 400,
      height: 300,
    }),
    setPointerCapture: (id: number) => captures.add(id),
    hasPointerCapture: (id: number) => captures.has(id),
    releasePointerCapture: (id: number) => captures.delete(id),
  } as unknown as HTMLCanvasElement;
  vi.stubGlobal('getComputedStyle', () => ({}));
  pointer = new Pointer(canvas, () => ({ width: 200, height: 150 }));
  scene = new Scene();
  texture = new Texture({
    width: 20,
    height: 20,
    close: vi.fn(),
  } as unknown as ImageBitmap);
});
afterEach(() => {
  scene.destroy();
  pointer.reset();
  texture.destroy();
  vi.unstubAllGlobals();
});

function sample(
  kind: 'down' | 'move' | 'up' | 'cancel' | 'leave',
  x: number,
  y: number,
  id = 1,
  type = 'mouse',
): void {
  const event = Object.assign(new Event(`pointer${kind}`), {
    pointerId: id,
    pointerType: type,
    clientX: 10 + x * 2,
    clientY: 20 + y * 2,
    button: 0,
    buttons: kind === 'up' || kind === 'cancel' ? 0 : 1,
  }) as PointerEvent;
  if (kind === 'down') pointer.pointerDown(event);
  else if (kind === 'up') pointer.pointerUp(event);
  else if (kind === 'move') pointer.move(event);
  else if (kind === 'leave') pointer.leave(event);
  else pointer.cancel(event);
}
function route(): void {
  scene.routePointers(pointer, continueFrame);
  pointer.endFrame();
}
function object(x = 50, y = 50): Sprite {
  const sprite = new Sprite({ texture, position: [x, y] });
  sprite.pointerEnabled = true;
  return sprite;
}

describe('targeted 2D pointer lifecycle', () => {
  it('picks HUD before world z and drags a rotated nested target in parent coordinates with stable event points', () => {
    scene.camera2D.position.set(5, 6);
    scene.camera2D.zoom = 2;
    scene.camera2D.renderOffset.set(3, 4);
    const group = scene.add(new Group2D());
    group.position.set(40, 10);
    group.rotation = Math.PI / 2;
    group.scale.set(2, 2);
    const world = group.add(object(25, 10));
    world.draggable = true;
    world.zIndex = 999;
    const center = world.updateWorldMatrix().transformPoint(new Vector2());
    const screen = scene.camera2D.worldToScreen(center);
    const hud = scene.add(object(screen.x, screen.y));
    hud.space = 'screen';
    hud.zIndex = -999;
    const hudDown = vi.fn();
    hud.addEventListener('pointerdown', hudDown);
    sample('down', screen.x, screen.y);
    sample('up', screen.x, screen.y);
    route();
    expect(hudDown).toHaveBeenCalledOnce();
    hud.visible = false;
    let detail: PointerTargetEventDetail | undefined;
    world.addEventListener('pointerdown', (event) => {
      detail = (event as CustomEvent<PointerTargetEventDetail>).detail;
    });
    sample('down', screen.x, screen.y);
    route();
    expect(detail!.world.x).toBeCloseTo(center.x);
    expect(detail!.world.y).toBeCloseTo(center.y);
    sample('move', screen.x + 20, screen.y);
    route();
    expect(world.position.x).toBeCloseTo(25);
    expect(world.position.y).toBeCloseTo(5);
    expect(detail!.screen.x).toBeCloseTo(screen.x);
    expect(detail!.screen.y).toBeCloseTo(screen.y);
    sample('move', 400, screen.y);
    route();
    expect(world.position.y).toBeCloseTo(10 - (400 - screen.x) / 4);
    sample('up', 400, screen.y);
    route();
  });

  it('keeps one drag owner across two touch pointers, outside leave, cancellation and teardown', () => {
    const target = scene.add(object());
    target.draggable = true;
    const starts = vi.fn(),
      ends = vi.fn(),
      cancels = vi.fn();
    target.addEventListener('dragstart', starts);
    target.addEventListener('dragend', ends);
    target.addEventListener('pointercancel', cancels);
    sample('down', 50, 50, 1, 'touch');
    sample('down', 50, 50, 2, 'touch');
    route();
    expect(starts).toHaveBeenCalledOnce();
    sample('move', 60, 50, 2, 'touch');
    route();
    expect(target.position.x).toBe(50);
    sample('up', 60, 50, 2, 'touch');
    route();
    expect(ends).not.toHaveBeenCalled();
    sample('leave', 210, 50, 1, 'touch');
    sample('move', 220, 50, 1, 'touch');
    route();
    expect(target.position.x).toBeCloseTo(220);
    sample('cancel', 220, 50, 1, 'touch');
    route();
    expect(ends).toHaveBeenCalledOnce();
    expect(cancels).toHaveBeenCalledOnce();
    scene.destroy();
    expect(ends).toHaveBeenCalledOnce();
    expect(cancels).toHaveBeenCalledOnce();
  });

  it('cancels captured removal once and does not start dragging a target removed by pointerdown', () => {
    const removedOnDown = scene.add(object());
    removedOnDown.draggable = true;
    const starts = vi.fn(),
      cancels = vi.fn();
    removedOnDown.addEventListener('dragstart', starts);
    removedOnDown.addEventListener('pointercancel', cancels);
    removedOnDown.addEventListener('pointerdown', () => {
      scene.remove(removedOnDown);
    });
    sample('down', 50, 50);
    route();
    expect(starts).not.toHaveBeenCalled();
    expect(cancels).toHaveBeenCalledOnce();
    sample('up', 50, 50);
    route();
    const target = scene.add(object());
    target.draggable = true;
    const ends = vi.fn(),
      cancelled = vi.fn();
    target.addEventListener('dragend', ends);
    target.addEventListener('pointercancel', cancelled);
    target.addEventListener('dragmove', () => {
      scene.remove(target);
    });
    sample('down', 50, 50);
    route();
    sample('move', 55, 50);
    route();
    sample('up', 55, 50);
    route();
    expect(ends).toHaveBeenCalledOnce();
    expect(cancelled).toHaveBeenCalledOnce();
  });

  it('bounds/coalesces no-RAF ingestion and retains terminal capture cleanup after reset or overflow', () => {
    const target = scene.add(object());
    target.draggable = true;
    const ends = vi.fn(),
      cancels = vi.fn();
    target.addEventListener('dragend', ends);
    target.addEventListener('pointercancel', cancels);
    sample('down', 50, 50);
    route();
    for (let i = 0; i < 1000; i++) sample('move', 50 + (i % 5), 50);
    expect(pointer.samples).toHaveLength(1);
    for (let i = 0; i < 1000; i++)
      sample('move', 180, 140, (i % inputLimits.maxActivePointers) + 1);
    sample('cancel', 180, 140);
    expect(pointer.samples.length).toBeLessThanOrEqual(
      inputLimits.maxPointerSamples,
    );
    expect(pointer.activePointers.size).toBeLessThanOrEqual(
      inputLimits.maxActivePointers,
    );
    route();
    expect(ends).toHaveBeenCalledOnce();
    expect(cancels).toHaveBeenCalledOnce();
    sample('down', target.position.x, target.position.y);
    route();
    pointer.reset();
    route();
    expect(ends).toHaveBeenCalledTimes(2);
    expect(cancels).toHaveBeenCalledTimes(2);
    expect(pointer.samples).toHaveLength(0);
  });

  it('uses exact collider hit mode outside natural graphics bounds and skips singular graphics transforms', () => {
    const target = scene.add(object());
    target.collider = Colliders.box(40, 40);
    target.hitTestMode = 'collider';
    const down = vi.fn();
    target.addEventListener('pointerdown', down);
    expect(target.containsPoint(new Vector2(65, 50))).toBe(true);
    sample('down', 65, 50);
    sample('up', 65, 50);
    route();
    expect(down).toHaveBeenCalledOnce();
    target.hitTestMode = 'graphics';
    target.scale.set(0, 1);
    sample('down', 50, 50);
    sample('up', 50, 50);
    route();
    expect(down).toHaveBeenCalledOnce();
  });

  it('defers remove/readd during preupdate and initializes once while destroy fires after disposal', () => {
    const target = object();
    const update = vi.fn();
    target.update = update;
    const events: string[] = [];
    for (const type of [
      'add',
      'remove',
      'initialize',
      'preupdate',
      'postupdate',
      'destroy',
    ])
      target.addEventListener(type, () => events.push(type));
    scene.add(target);
    target.addEventListener(
      'preupdate',
      () => {
        scene.remove(target);
        scene.add(target);
      },
      { once: true },
    );
    scene.beginObjectFrame();
    scene.beginObjectUpdates(0.1, continueFrame);
    scene.advanceObjects(0.1, continueFrame);
    expect(update).not.toHaveBeenCalled();
    expect(events).toEqual(['add', 'initialize', 'preupdate', 'remove', 'add']);
    scene.beginObjectFrame();
    scene.beginObjectUpdates(0.1, continueFrame);
    scene.advanceObjects(0.1, continueFrame);
    expect(update).toHaveBeenCalledOnce();
    expect(events.filter((event) => event === 'initialize')).toHaveLength(1);
    let disposedOnDestroy = false;
    target.addEventListener('destroy', () => {
      disposedOnDestroy = target.destroyed && !target.scene;
    });
    target.destroy();
    expect(disposedOnDestroy).toBe(true);
    expect(events.slice(-2)).toEqual(['remove', 'destroy']);
  });

  it('does not resurrect or overwrite a child changed by its registration callback', () => {
    const parent = scene.add(new Group2D());
    const killed = object();
    killed.addEventListener('add', () => killed.destroy(), { once: true });
    parent.add(killed);
    expect(killed.destroyed).toBe(true);
    expect(parent.children.has(killed)).toBe(false);
    const other = scene.add(new Group2D());
    const moved = object();
    moved.addEventListener(
      'add',
      () => {
        other.add(moved);
      },
      { once: true },
    );
    parent.add(moved);
    expect(moved.parent).toBe(other);
    expect(other.children.has(moved)).toBe(true);
    expect(parent.children.has(moved)).toBe(false);
  });
});

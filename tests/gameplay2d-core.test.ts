import { describe, expect, it, vi } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { GameObject } from '../packages/core/src/game-object.js';
import { Scene } from '../packages/core/src/scene.js';
import { Sprite } from '../packages/core/src/sprite.js';
import { Group2D } from '../packages/core/src/gameplay/group2d.js';
import { ScreenElement } from '../packages/core/src/gameplay/screen-element.js';
import { FrameAnimation } from '../packages/core/src/gameplay/frame-animation.js';
import { Vector2 } from '../packages/math/src/index.js';
import {
  collectRenderCommands2D,
  RenderCommandBuffer2D,
} from '../packages/graphics/src/render2d-contract.js';

function texture(width = 32, height = 16): Texture {
  return new Texture({
    width,
    height,
    close: vi.fn(),
  } as unknown as ImageBitmap);
}

const continueFrame = () => true;

function advance(scene: Scene, dt: number): void {
  scene.beginObjectFrame();
  scene.advanceFrameAnimations(dt, continueFrame);
  scene.advanceObjects(dt, continueFrame);
}

describe('2D composed scene ownership', () => {
  it('composes transforms and visual inheritance through nested groups without losing local transforms', () => {
    const root = new Group2D();
    root.position.set(30, 20);
    root.rotation = Math.PI / 2;
    root.scale.set(2, 3);
    root.opacity = 0.5;
    root.tint = [0.5, 1, 0.5, 1];
    root.zIndex = 4;
    const branch = root.add(new Group2D());
    branch.position.set(5, 0);
    branch.opacity = 0.5;
    const leaf = branch.add(
      new Sprite({
        texture: texture(),
        position: [0, 2],
        tint: [1, 0.5, 1, 1],
        zIndex: -1,
      }),
    );
    const world = leaf.updateWorldMatrix().transformPoint(new Vector2());
    expect(world.x).toBeCloseTo(24);
    expect(world.y).toBeCloseTo(30);
    expect(leaf.position).toEqual(new Vector2(0, 2));
    expect(leaf.worldOpacity).toBe(0.25);
    expect(leaf.worldTint).toEqual([0.5, 0.5, 0.5, 1]);
    expect(leaf.worldZIndex).toBe(3);
    expect(leaf.containsPoint(world)).toBe(true);
    root.visible = false;
    expect(leaf.worldVisible).toBe(false);
    root.visible = true;
    root.scale.x = 0;
    expect(leaf.containsPoint(world)).toBe(false);
  });

  it('keeps a pixel pivot at its position with skew and reflects output coordinates and bounds', () => {
    const root = new Group2D();
    root.position.set(30, 20);
    root.rotation = 0.4;
    root.scale.set(-2, 3);
    const leaf = root.add(
      new Sprite({ texture: texture(20, 10), anchor: [0, 0] }),
    );
    leaf.position.set(8, 6);
    leaf.pivot.set(4, 2);
    leaf.skew.set(0.2, -0.3);
    const expectedPivot = root.toWorld(leaf.position);
    const actualPivot = leaf.toWorld(leaf.pivot);
    expect(actualPivot.x).toBeCloseTo(expectedPivot.x, 5);
    expect(actualPivot.y).toBeCloseTo(expectedPivot.y, 5);
    const point = new Vector2(3, 7);
    expect(leaf.toWorld(point, point)).toBe(point);
    expect(leaf.toLocal(point, point)).toBe(point);
    expect(point.x).toBeCloseTo(3, 5);
    expect(point.y).toBeCloseTo(7, 5);
    const out = { x: 0, y: 0, width: 0, height: 0 };
    expect(leaf.getWorldBounds(out)).toBe(out);
    for (const corner of [
      new Vector2(),
      new Vector2(20, 0),
      new Vector2(0, 10),
      new Vector2(20, 10),
    ]) {
      leaf.toWorld(corner, corner);
      expect(corner.x).toBeGreaterThanOrEqual(out.x - 1e-5);
      expect(corner.x).toBeLessThanOrEqual(out.x + out.width + 1e-5);
      expect(corner.y).toBeGreaterThanOrEqual(out.y - 1e-5);
      expect(corner.y).toBeLessThanOrEqual(out.y + out.height + 1e-5);
    }
    leaf.skew.x = -0.25;
    expect(leaf.toWorld(new Vector2()).x).not.toBeCloseTo(out.x, 5);
    leaf.scale.x = 0;
    expect(() => leaf.toLocal(new Vector2())).toThrow(RangeError);
    expect(leaf.containsPoint(new Vector2())).toBe(false);
    leaf.texture.destroy();
    root.destroy();
  });

  it('keeps same-scene reparent registration, rejects cycles/cross-owner, detaches and recursively destroys subtrees', () => {
    const scene = new Scene();
    const other = new Scene();
    const first = scene.add(new Group2D());
    const second = scene.add(new Group2D());
    const branch = first.add(new Group2D());
    const image = texture();
    const leaf = branch.add(new Sprite({ texture: image }));
    expect(scene.has(leaf)).toBe(true);
    second.add(branch);
    expect(scene.has(leaf)).toBe(true);
    expect(first.children.has(branch)).toBe(false);
    expect(() => branch.add(second)).toThrow();
    const outsider = other.add(new Group2D());
    expect(() => outsider.add(branch)).toThrow();
    expect(branch.parent).toBe(second);
    scene.remove(branch);
    expect(leaf.scene).toBeUndefined();
    expect(leaf.destroyed).toBe(false);
    first.add(branch);
    expect(leaf.scene).toBe(scene);
    scene.destroy();
    expect(leaf.destroyed).toBe(true);
    expect(branch.destroyed).toBe(true);
    expect(image.destroyed).toBe(false);
    image.destroy();
    other.destroy();
  });

  it('culls against final camera displacement and sorts HUD after world independent of z', () => {
    const scene = new Scene();
    const image = texture(4, 4);
    const world = scene.add(
      new Sprite({ texture: image, position: [20, 20], zIndex: 100 }),
    );
    const hud = scene.add(new ScreenElement());
    hud.zIndex = -100;
    const screen = hud.add(new Sprite({ texture: image, position: [4, 4] }));
    scene.camera2D.position.set(100, 100);
    scene.camera2D.renderOffset.set(80, 80);
    const commands = new RenderCommandBuffer2D();
    collectRenderCommands2D(scene, 32, 32, commands);
    expect(commands.items.map((command) => command.object)).toEqual([
      world,
      screen,
    ]);
    scene.camera2D.renderOffset.set(0, 0);
    collectRenderCommands2D(scene, 32, 32, commands);
    expect(commands.items.map((command) => command.object)).toEqual([screen]);
    const point = scene.camera2D.worldToScreen(new Vector2(102, 104));
    expect(scene.camera2D.screenToWorld(point)).toEqual(new Vector2(102, 104));
    scene.destroy();
    image.destroy();
  });

  it('defers additions and re-additions during a frame and stops safely when an update tears down ownership', () => {
    const scene = new Scene();
    const log: string[] = [];
    class Updating extends GameObject {
      constructor(private readonly name: string) {
        super();
      }
      override update(): void {
        log.push(this.name);
      }
    }
    const late = new Updating('late');
    class Adding extends GameObject {
      override update(): void {
        scene.add(late);
        scene.remove(this);
      }
    }
    scene.add(new Adding());
    advance(scene, 0.1);
    expect(log).toEqual([]);
    advance(scene, 0.1);
    expect(log).toEqual(['late']);
    scene.beginObjectFrame();
    scene.advanceObjects(0.1, () => {
      scene.destroy();
      return false;
    });
    expect(log).toEqual(['late']);
    expect(late.destroyed).toBe(true);
  });
});

describe('atlas geometry and simulation frame animation', () => {
  it('copies source regions, permits exact fractional clipping and rejects texture replacement atomically', () => {
    const image = texture();
    const source = { x: 2, y: 1, width: 4.5, height: 3 };
    const sprite = new Sprite({ texture: image, source, anchor: [0.5, 1] });
    source.width = 30;
    expect(sprite.width).toBe(4.5);
    expect(sprite.getLocalBounds()).toEqual({
      x: -2.25,
      y: -3,
      width: 4.5,
      height: 3,
    });
    const small = texture(4, 4);
    expect(() => {
      sprite.texture = small;
    }).toThrow(RangeError);
    expect(sprite.texture).toBe(image);
    expect(() => {
      sprite.source = { x: 0, y: 0, width: 0, height: 1 };
    }).toThrow(RangeError);
    expect(sprite.width).toBe(4.5);
    sprite.source = undefined;
    expect(sprite.width).toBe(32);
    sprite.destroy();
    image.destroy();
    small.destroy();
  });

  it('advances ping-pong durations, reverse, aggregate loops and freeze/hide end without wall time', () => {
    const scene = new Scene();
    const image = texture();
    const sprite = scene.add(new Sprite({ texture: image }));
    const frames = [0, 1, 2].map((index) => ({
      source: { x: index * 4, y: 0, width: 4, height: 4 },
      duration: 0.125,
    }));
    const animation = new FrameAnimation(sprite, frames, {
      strategy: 'pingpong',
    }).play();
    advance(scene, 0.125);
    expect(animation.frame).toBe(1);
    advance(scene, 0.125);
    expect(animation.frame).toBe(2);
    advance(scene, 0.125);
    expect(animation.frame).toBe(1);
    advance(scene, 0.125);
    expect(animation.frame).toBe(0);
    animation.reverse();
    advance(scene, 0.125);
    expect(animation.frame).toBe(1);
    animation.pause();
    advance(scene, 1);
    expect(animation.frame).toBe(1);
    let loops = 0;
    animation.addEventListener('animationloop', (event) => {
      loops += (event as CustomEvent<{ count: number }>).detail.count;
    });
    animation.reset().play();
    advance(scene, 100);
    expect(animation.frame).toBe(0);
    expect(loops).toBe(200);
    const freeze = new FrameAnimation(sprite, frames, {
      strategy: 'freeze',
    }).play();
    advance(scene, 1);
    expect(freeze.frame).toBe(2);
    expect(freeze.playing).toBe(false);
    expect(sprite.visible).toBe(true);
    const hide = new FrameAnimation(sprite, frames, {
      strategy: 'hide',
    }).play();
    advance(scene, 1);
    expect(sprite.visible).toBe(false);
    hide.reset();
    expect(sprite.visible).toBe(true);
    hide.play();
    scene.remove(sprite);
    advance(scene, 1);
    expect(hide.frame).toBe(0);
    scene.add(sprite);
    advance(scene, 0.125);
    expect(hide.frame).toBe(1);
    sprite.destroy();
    expect(hide.playing).toBe(false);
    expect(sprite.animation).toBeUndefined();
    scene.destroy();
    image.destroy();
  });
});

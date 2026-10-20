import { describe, expect, it, vi } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { GameObject } from '../packages/core/src/game-object.js';
import { Scene } from '../packages/core/src/scene.js';
import { Sprite } from '../packages/core/src/sprite.js';
import { Group2D } from '../packages/core/src/gameplay/group2d.js';
import { ScreenElement } from '../packages/core/src/gameplay/screen-element.js';
import { FrameAnimation } from '../packages/core/src/gameplay/frame-animation.js';
import { Vector2 } from '../packages/math/src/index.js';
import { IsolatedGroup2D } from '../packages/core/src/rendering2d/isolated-group.js';
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
  it('reuses world matrices only within one presentation and never doubles override adjustments', () => {
    class Shaken extends Group2D {
      override updateWorldMatrix() {
        const matrix = super.updateWorldMatrix();
        matrix.elements[6] += 5;
        return matrix;
      }
    }
    const scene = new Scene();
    const group = scene.add(new Group2D());
    const shaken = group.add(new Shaken());
    const leaf = shaken.add(new GameObject());
    group.position.set(10, 0);
    scene.beginPresentation();
    expect(leaf.updateWorldMatrix().elements[6]).toBe(15);
    expect(shaken.updateWorldMatrix().elements[6]).toBe(15);
    expect(leaf.updateWorldMatrix().elements[6]).toBe(15);
    scene.endPresentation();
    // Moves between and after presentations are always observed.
    group.position.set(20, 0);
    expect(leaf.updateWorldMatrix().elements[6]).toBe(25);
    scene.beginPresentation();
    expect(leaf.updateWorldMatrix().elements[6]).toBe(25);
    scene.endPresentation();
    group.position.set(30, 0);
    scene.beginPresentation();
    expect(leaf.updateWorldMatrix().elements[6]).toBe(35);
    scene.endPresentation();
    scene.destroy();
  });

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

  it('hit-tests correctly when a bounds override hit-tests another object', () => {
    const far = new Sprite({
      texture: new Texture({ width: 4, height: 4, close() {} }),
    });
    far.position.set(500, 500);
    class Probe extends GameObject {
      override getLocalBounds(out = { x: 0, y: 0, width: 0, height: 0 }) {
        far.containsPoint(new Vector2(500, 500));
        out.x = -5;
        out.y = -5;
        out.width = out.height = 10;
        return out;
      }
    }
    const probe = new Probe();
    probe.position.set(10, 10);
    expect(probe.containsPoint(new Vector2(12, 12))).toBe(true);
    expect(probe.containsPoint(new Vector2(30, 30))).toBe(false);
    expect(probe.toLocal(new Vector2(12, 7))).toEqual(new Vector2(2, -3));
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
  it('keeps a leaf children set live and stable once it has been read', () => {
    const scene = new Scene();
    const image = texture();
    const leaf = scene.add(new Sprite({ texture: image }));
    const children = leaf.children;
    expect(children.size).toBe(0);
    const child = leaf.add(new Sprite({ texture: image }));
    expect(leaf.children).toBe(children);
    expect([...children]).toEqual([child]);
    expect(scene.has(child)).toBe(true);
    leaf.remove(child);
    expect(children.size).toBe(0);
    scene.destroy();
    image.destroy();
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

  it('orders world before screen by summed z with registration-order ties for few and many layers', () => {
    const image = texture(4, 4);
    let seed = 7;
    const random = () => (seed = (seed * 1103515245 + 12345) % 2147483648);
    // 5 layers use bucketed ordering; 40 exceed the bucket budget; equal z is already ordered.
    for (const layers of [5, 40, 1]) {
      const scene = new Scene();
      const expected: { sprite: Sprite; screen: boolean; z: number }[] = [];
      for (let i = 0; i < 300; i++) {
        const z = (random() % layers) - 2;
        const sprite = scene.add(
          new Sprite({ texture: image, position: [2, 2], zIndex: z }),
        );
        const screen = layers > 1 && random() % 4 === 0;
        if (screen) sprite.space = 'screen';
        expected.push({ sprite, screen, z });
      }
      expected.sort((a, b) =>
        a.screen === b.screen ? a.z - b.z : a.screen ? 1 : -1,
      );
      const commands = new RenderCommandBuffer2D();
      for (let pass = 0; pass < 2; pass++) {
        collectRenderCommands2D(scene, 32, 32, commands);
        expect(commands.items.map((command) => command.object)).toEqual(
          expected.map((entry) => entry.sprite),
        );
      }
      scene.destroy();
    }
    image.destroy();
  });

  it('collects each isolation boundary once with its own members, order and visibility', () => {
    const scene = new Scene();
    const image = texture(4, 4);
    const sprite = (parent: Scene | GameObject, z = 0): Sprite => {
      const child = new Sprite({ texture: image, position: [8, 8], zIndex: z });
      return parent instanceof Scene ? parent.add(child) : parent.add(child);
    };
    const before = sprite(scene);
    const outer = scene.add(new IsolatedGroup2D());
    outer.isolate = true;
    const outerFirst = sprite(outer, 1);
    const plain = outer.add(new Group2D());
    const throughPlain = sprite(plain);
    const inner = outer.add(new IsolatedGroup2D());
    inner.isolate = true;
    const innerSprite = sprite(inner);
    const outerLast = sprite(outer);
    const hidden = scene.add(new Group2D());
    hidden.visible = false;
    const hiddenLayer = hidden.add(new IsolatedGroup2D());
    hiddenLayer.isolate = true;
    sprite(hiddenLayer);
    const after = sprite(scene);
    const shape = (buffer: RenderCommandBuffer2D): unknown[] =>
      buffer.items.map((command) =>
        command.kind === 'layer'
          ? [command.object, shape(command.commands)]
          : command.object,
      );
    const commands = new RenderCommandBuffer2D();
    collectRenderCommands2D(scene, 32, 32, commands);
    expect(shape(commands)).toEqual([
      before,
      [outer, [throughPlain, [inner, [innerSprite]], outerLast, outerFirst]],
      after,
    ]);
    plain.visible = false;
    collectRenderCommands2D(scene, 32, 32, commands, { root: outer });
    expect(shape(commands)).toEqual([
      [inner, [innerSprite]],
      outerLast,
      outerFirst,
    ]);
    expect(commands.boundaryMembers.size).toBe(0);
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
    const spriteEvents: string[] = [];
    for (const type of ['animationframe', 'animationend'])
      sprite.addEventListener(type, (event) =>
        spriteEvents.push(
          `${type}:${(event as CustomEvent<{ frame: number }>).detail.frame}`,
        ),
      );
    const hide = new FrameAnimation(sprite, frames, {
      strategy: 'hide',
    }).play();
    advance(scene, 1);
    expect(sprite.visible).toBe(false);
    // The animated Sprite observes the same frame and end events as the animation.
    expect(spriteEvents).toEqual(['animationframe:2', 'animationend:2']);
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

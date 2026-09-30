import { describe, expect, it, vi } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { Geometry } from '../packages/core/src/geometry.js';
import { Group } from '../packages/core/src/group.js';
import { Mesh, TextureMaterial } from '../packages/core/src/mesh.js';
import { Object3D } from '../packages/core/src/object3d.js';
import { Scene } from '../packages/core/src/scene.js';
import { Transform3D, Vector3 } from '../packages/math/src/index.js';

function entityFor(scene: Scene, object: Object3D): number | undefined {
  return [...scene.world.query(Transform3D)].find(
    (entity) =>
      scene.world.getComponent(entity, Transform3D) === object.transform,
  );
}

describe('Object3D scene hierarchy', () => {
  it('registers nested and later-added descendants, preserving registrations during same-scene reparenting', () => {
    const scene = new Scene();
    const root = new Group();
    const branch = root.add(new Group());
    const leaf = branch.add(new Object3D());
    scene.add(root);
    expect(new Set(scene.objects)).toEqual(new Set([root, branch, leaf]));
    for (const object of [root, branch, leaf]) {
      expect(object.scene).toBe(scene);
      expect(
        scene.world.getComponent(entityFor(scene, object)!, Transform3D),
      ).toBe(object.transform);
    }
    const destination = root.add(new Group());
    const entity = entityFor(scene, leaf);
    destination.add(leaf);
    expect(entityFor(scene, leaf)).toBe(entity);
    expect(leaf.parent).toBe(destination);
    expect(branch.children.has(leaf)).toBe(false);
    expect(destination.children.has(leaf)).toBe(true);
    expect(scene.remove(leaf)).toBe(true);
    expect(destination.children.has(leaf)).toBe(false);
    expect(leaf.parent).toBeUndefined();
    expect(leaf.scene).toBeUndefined();
    expect(entityFor(scene, leaf)).toBeUndefined();
    destination.add(leaf);
    scene.destroy();
  });

  it('removes an entire subtree without destroying it and permits explicit transfer to another scene', () => {
    const scene = new Scene();
    const otherScene = new Scene();
    const root = scene.add(new Group());
    const branch = root.add(new Group());
    const leaf = branch.add(new Object3D());
    expect(root.remove(branch)).toBe(true);
    expect(root.remove(branch)).toBe(false);
    expect(new Set(scene.objects)).toEqual(new Set([root]));
    expect(branch.parent).toBeUndefined();
    expect(leaf.parent).toBe(branch);
    for (const object of [branch, leaf]) {
      expect(object.scene).toBeUndefined();
      expect(object.destroyed).toBe(false);
      expect(entityFor(scene, object)).toBeUndefined();
    }
    otherScene.add(branch);
    expect(new Set(otherScene.objects)).toEqual(new Set([branch, leaf]));
    expect(leaf.scene).toBe(otherScene);
    scene.destroy();
    expect(leaf.destroyed).toBe(false);
    otherScene.destroy();
    expect(leaf.destroyed).toBe(true);
  });

  it('composes parent translation, rotation and scale and recomputes mutations without changing local transforms', () => {
    const root = new Group();
    root.position.set(10, 1, 0);
    root.rotation.setFromEuler(0, 0, Math.PI / 2);
    root.scale.set(2, 3, 1);
    const branch = root.add(new Group());
    branch.position.set(1, 0, 0);
    const leaf = branch.add(new Object3D());
    leaf.position.set(1, 0, 0);
    const world = leaf.updateWorldMatrix().transformPoint(new Vector3());
    expect(world.x).toBeCloseTo(10);
    expect(world.y).toBeCloseTo(5);
    root.position.x = 20;
    branch.position.x = 2;
    const changed = leaf.updateWorldMatrix().transformPoint(new Vector3());
    expect(changed.x).toBeCloseTo(20);
    expect(changed.y).toBeCloseTo(7);
    expect(leaf.position.x).toBe(1);
    branch.remove(leaf);
    expect(leaf.updateWorldMatrix().transformPoint(new Vector3())).toEqual(
      new Vector3(1, 0, 0),
    );
    root.destroy();
    leaf.destroy();
  });

  it('inherits visibility through all ancestors and responds to reparenting and destruction', () => {
    const root = new Group();
    const hidden = root.add(new Group());
    const visible = root.add(new Group());
    const leaf = hidden.add(new Object3D());
    hidden.visible = false;
    expect(leaf.worldVisible).toBe(false);
    visible.add(leaf);
    expect(leaf.worldVisible).toBe(true);
    root.visible = false;
    expect(leaf.worldVisible).toBe(false);
    root.visible = true;
    leaf.visible = false;
    expect(leaf.worldVisible).toBe(false);
    leaf.visible = true;
    root.destroy();
    expect(leaf.worldVisible).toBe(false);
  });

  it('rejects cycles without altering parents, children or ECS registrations', () => {
    const scene = new Scene();
    const root = scene.add(new Group());
    const branch = root.add(new Group());
    const leaf = branch.add(new Group());
    const entities = [...scene.world.query(Transform3D)];
    expect(() => leaf.add(root)).toThrow('cycles');
    expect(() => branch.add(branch)).toThrow('cycles');
    expect(root.parent).toBeUndefined();
    expect(branch.parent).toBe(root);
    expect(leaf.parent).toBe(branch);
    expect([...root.children]).toEqual([branch]);
    expect([...branch.children]).toEqual([leaf]);
    expect([...scene.world.query(Transform3D)]).toEqual(entities);
    scene.destroy();
  });

  it('rejects cross-scene or owned-to-detached reparenting before mutating the previous state', () => {
    const scene = new Scene();
    const otherScene = new Scene();
    const parent = scene.add(new Group());
    const branch = parent.add(new Group());
    const leaf = branch.add(new Object3D());
    const otherParent = otherScene.add(new Group());
    const detachedParent = new Group();
    const entities = [...scene.world.query(Transform3D)];
    expect(() => otherParent.add(branch)).toThrow('across scenes');
    expect(() => detachedParent.add(branch)).toThrow('across scenes');
    expect(() => otherScene.add(branch)).toThrow('already belongs');
    expect(branch.parent).toBe(parent);
    expect(leaf.parent).toBe(branch);
    expect(parent.children.has(branch)).toBe(true);
    expect(otherParent.children.size).toBe(0);
    expect(detachedParent.children.size).toBe(0);
    expect(branch.scene).toBe(scene);
    expect(leaf.scene).toBe(scene);
    expect([...scene.world.query(Transform3D)]).toEqual(entities);
    expect(new Set(otherScene.objects)).toEqual(new Set([otherParent]));
    scene.destroy();
    otherScene.destroy();
    detachedParent.destroy();
  });

  it('rolls back subtree registration failures without unlinking the previous detached parent', () => {
    const scene = new Scene();
    const destination = scene.add(new Group());
    const previousParent = new Group();
    const branch = previousParent.add(new Group());
    const leaf = branch.add(new Object3D());
    const create = scene.world.createEntity.bind(scene.world);
    const failure = new Error('registration failed');
    const spy = vi
      .spyOn(scene.world, 'createEntity')
      .mockImplementationOnce(create)
      .mockImplementationOnce(() => {
        throw failure;
      });
    expect(() => destination.add(branch)).toThrow(failure);
    expect(branch.parent).toBe(previousParent);
    expect(previousParent.children.has(branch)).toBe(true);
    expect(leaf.parent).toBe(branch);
    expect(branch.scene).toBeUndefined();
    expect(leaf.scene).toBeUndefined();
    expect(new Set(scene.objects)).toEqual(new Set([destination]));
    expect([...scene.world.query(Transform3D)]).toEqual([
      entityFor(scene, destination),
    ]);
    spy.mockRestore();
    destination.add(branch);
    expect(previousParent.children.size).toBe(0);
    expect(leaf.scene).toBe(scene);
    scene.destroy();
    previousParent.destroy();
  });

  it('destroys descendants once, completes cleanup after failures, and retains borrowed mesh resources', () => {
    const calls: string[] = [];
    class CountingGroup extends Group {
      constructor(
        private readonly name: string,
        private readonly fail = false,
      ) {
        super();
      }
      override destroy(): void {
        calls.push(`destroy:${this.name}`);
        super.destroy();
      }
      protected override onDestroy(): void {
        calls.push(`cleanup:${this.name}`);
        if (this.fail) throw new Error('cleanup failed');
      }
    }
    const close = vi.fn();
    const texture = new Texture({
      width: 1,
      height: 1,
      close,
    } as unknown as ImageBitmap);
    const material = new TextureMaterial({ texture });
    const geometry = Geometry.quad();
    const scene = new Scene();
    const root = new CountingGroup('root', true);
    const branch = root.add(new CountingGroup('branch', true));
    const leaf = branch.add(new CountingGroup('leaf'));
    const mesh = branch.add(new Mesh({ geometry, material }));
    const independent = new CountingGroup('independent');
    scene.add(root);
    scene.add(independent);
    expect(() => scene.destroy()).toThrow(AggregateError);
    scene.destroy();
    for (const object of [root, branch, leaf, mesh, independent]) {
      expect(object.destroyed).toBe(true);
      expect(object.scene).toBeUndefined();
      expect(object.parent).toBeUndefined();
      expect(object.children.size).toBe(0);
    }
    for (const name of ['root', 'branch', 'leaf', 'independent']) {
      expect(calls.filter((call) => call === `destroy:${name}`)).toHaveLength(
        1,
      );
      expect(calls.filter((call) => call === `cleanup:${name}`)).toHaveLength(
        1,
      );
    }
    expect(scene.objects.size).toBe(0);
    expect([...scene.world.query(Transform3D)]).toEqual([]);
    expect(texture.destroyed).toBe(false);
    expect(close).not.toHaveBeenCalled();
    texture.destroy();
  });

  it('unregisters and recursively cleans an explicitly destroyed subtree without destroying its parent', () => {
    const scene = new Scene();
    const root = scene.add(new Group());
    const branch = root.add(new Group());
    const leaf = branch.add(new Object3D());
    branch.destroy();
    branch.destroy();
    expect(root.destroyed).toBe(false);
    expect(root.children.size).toBe(0);
    expect(branch.destroyed).toBe(true);
    expect(leaf.destroyed).toBe(true);
    expect(new Set(scene.objects)).toEqual(new Set([root]));
    expect(() => root.add(branch)).toThrow('destroyed');
    scene.destroy();
  });
});

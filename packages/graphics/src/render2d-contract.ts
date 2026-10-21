import type { Scene } from '../../core/src/scene.js';
import { Sprite } from '../../core/src/sprite.js';
import type { GraphicsBackend } from './index.js';
import type { ColorRGBA } from '../../core/src/gameplay/contracts.js';
import { GameObject } from '../../core/src/game-object.js';
import { IsolatedGroup2D } from '../../core/src/rendering2d/isolated-group.js';
import { Mesh2D } from '../../core/src/rendering2d/mesh2d.js';
import { ParticleLayer2D } from '../../core/src/particles2d/particle-layer2d.js';
import { rendering2dLimits } from '../../../src/data/rendering2d.js';

export interface RenderSnapshot {
  readonly backend: GraphicsBackend;
  readonly width: number;
  readonly height: number;
  readonly destroyed: boolean;
  destroy(): void;
}
export interface TransitionFrame {
  kind: 'fade' | 'crossfade' | 'slide';
  progress: number;
  snapshot?: RenderSnapshot;
  color: ColorRGBA;
  direction: 'left' | 'right' | 'up' | 'down';
}
export interface FrameEffects {
  transition?: TransitionFrame;
}

export interface SpriteCommand2D {
  readonly kind: 'sprite';
  object: Sprite;
}
export interface LayerCommand2D {
  readonly kind: 'layer';
  object: IsolatedGroup2D;
  commands: RenderCommandBuffer2D;
}
export interface MeshCommand2D {
  readonly kind: 'mesh';
  object: Mesh2D;
}
export interface ParticlesCommand2D {
  readonly kind: 'particles';
  object: ParticleLayer2D;
}
export type RenderCommand2D =
  SpriteCommand2D | LayerCommand2D | MeshCommand2D | ParticlesCommand2D;
interface PooledCommand2D {
  kind: RenderCommand2D['kind'];
  object?: GameObject;
  commands?: RenderCommandBuffer2D;
  /** compareObjects2D keys, captured once at append instead of per comparison. */
  screen: boolean;
  z: number;
}
/** @internal A reused list whose entries past `count` are cleared, not truncated. */
export interface MemberList2D {
  readonly objects: (GameObject | undefined)[];
  count: number;
}
/** Commands and nested buffers are reused after the peak visible count. */
export class RenderCommandBuffer2D {
  readonly items: RenderCommand2D[] = [];
  private readonly pool: PooledCommand2D[] = [];
  private readonly traversal: GameObject[] = [];
  /** Items appended since the last clear or reset; see reset(). */
  private appended = 0;
  /** @internal Aggregate collection budget, including nested boundaries. */
  collectedCount = 0;
  /** @internal Members of each isolation boundary, filled once per collection. */
  readonly boundaryMembers = new Map<
    IsolatedGroup2D | undefined,
    MemberList2D
  >();
  private readonly memberLists: MemberList2D[] = [];
  /** Scratch for the stable bucketed sort; see sort(). */
  private sortSlots = new Int32Array(0);
  private readonly sortOutput: RenderCommand2D[] = [];
  private readonly sortKeys: PooledCommand2D[] = [];
  private readonly sortRanks = new Int32Array(rendering2dLimits.sortBuckets);
  private readonly sortStarts = new Int32Array(rendering2dLimits.sortBuckets);

  clear(): void {
    for (const command of this.items) {
      const pooled = command as unknown as PooledCommand2D;
      pooled.object = undefined;
      pooled.commands?.clear();
    }
    this.items.length = 0;
    this.appended = 0;
    this.traversal.length = 0;
    this.collectedCount = 0;
  }
  /**
   * @internal Like clear(), but keeps the item storage: emptying an array drops its backing
   * store, and refilling it then regrew on every collection. Appends overwrite from index 0
   * and finishAppends() truncates the stale tail, so read `items` only after that.
   */
  reset(): void {
    const items = this.items;
    for (let i = 0; i < items.length; i++) {
      const pooled = items[i] as unknown as PooledCommand2D;
      pooled.object = undefined;
      pooled.commands?.reset();
    }
    this.appended = 0;
    this.traversal.length = 0;
    this.collectedCount = 0;
  }
  /** @internal Drops items left over from before reset(). */
  finishAppends(): void {
    // Assigning length is a runtime call even when it does not change.
    if (this.items.length !== this.appended) this.items.length = this.appended;
  }
  private append(
    kind: RenderCommand2D['kind'],
    object: GameObject,
  ): PooledCommand2D {
    const index = this.appended++;
    const screen = object.worldSpace === 'screen',
      z = object.worldZIndex;
    let command = this.pool[index];
    if (!command) {
      command = { kind, object, screen, z };
      this.pool.push(command);
    } else {
      command.kind = kind;
      command.object = object;
      command.screen = screen;
      command.z = z;
    }
    const liveCommand = command as unknown as RenderCommand2D;
    this.items[index] = liveCommand;
    return command;
  }
  appendSprite(object: Sprite): void {
    this.append('sprite', object);
  }
  appendMesh(object: Mesh2D): void {
    this.append('mesh', object);
  }
  appendParticles(object: ParticleLayer2D): void {
    this.append('particles', object);
  }
  appendLayer(object: IsolatedGroup2D): RenderCommandBuffer2D {
    const command = this.append('layer', object);
    return (command.commands ??= new RenderCommandBuffer2D());
  }
  /**
   * Orders by the keys captured at append; callers sort right after collection.
   * Scenes usually use a few layer depths, so a stable counting sort over the
   * distinct keys replaces the comparison sort. With finite z the comparator is a
   * total preorder, so any stable sort yields the identical order; other inputs
   * keep Array#sort.
   */
  sort(): void {
    const items = this.items,
      count = items.length,
      keys = this.sortKeys;
    if (this.sortSlots.length < count)
      this.sortSlots = new Int32Array(
        Math.max(count, this.sortSlots.length * 2),
      );
    const slots = this.sortSlots;
    keys.length = 0;
    let ordered = true,
      slot = -1,
      previous: PooledCommand2D | undefined;
    for (let i = 0; i < count; i++) {
      const command = items[i] as unknown as PooledCommand2D;
      if (!Number.isFinite(command.z)) {
        items.sort(compareCommands2D);
        return;
      }
      if (ordered && previous && comparePooled2D(previous, command) > 0)
        ordered = false;
      previous = command;
      if (slot < 0 || comparePooled2D(keys[slot]!, command) !== 0) {
        slot = 0;
        while (
          slot < keys.length &&
          comparePooled2D(keys[slot]!, command) !== 0
        )
          slot++;
        if (slot === keys.length) {
          if (slot === rendering2dLimits.sortBuckets) {
            items.sort(compareCommands2D);
            return;
          }
          keys.push(command);
        }
      }
      slots[i] = slot;
    }
    if (ordered) return;
    // Rank the few distinct keys, then place each command after earlier equal keys.
    const ranks = this.sortRanks,
      starts = this.sortStarts,
      distinct = keys.length;
    for (let k = 0; k < distinct; k++) {
      let rank = 0;
      for (let other = 0; other < distinct; other++)
        if (comparePooled2D(keys[other]!, keys[k]!) < 0) rank++;
      ranks[k] = rank;
      starts[rank] = 0;
    }
    for (let i = 0; i < count; i++) starts[ranks[slots[i]!]!]!++;
    for (let rank = 0, start = 0; rank < distinct; rank++) {
      const size = starts[rank]!;
      starts[rank] = start;
      start += size;
    }
    const output = this.sortOutput;
    // Grown by push so the scratch stays packed; it only references pooled commands.
    while (output.length < count) output.push(items[0]!);
    for (let i = 0; i < count; i++)
      output[starts[ranks[slots[i]!]!]!++] = items[i]!;
    for (let i = 0; i < count; i++) items[i] = output[i]!;
  }
  /** @internal Detached target collection borrows descendants without Scene.add side effects. */
  collectDetachedObjects(root: IsolatedGroup2D): readonly GameObject[] {
    this.traversal.length = 0;
    for (const child of root.children) this.traversal.push(child);
    for (let i = 0; i < this.traversal.length; i++) {
      if (this.traversal.length > rendering2dLimits.commands)
        throw new RangeError(
          'Detached target subtree exceeds the traversal budget.',
        );
      const children = this.traversal[i].existingChildren;
      if (children) for (const child of children) this.traversal.push(child);
    }
    return this.traversal;
  }
  /** @internal Only command records retain live frame references. */
  releaseTraversal(): void {
    this.traversal.length = 0;
  }
  /** @internal */
  membersOf(boundary: IsolatedGroup2D | undefined): MemberList2D {
    let members = this.boundaryMembers.get(boundary);
    if (!members) {
      members = this.memberLists.pop() ?? { objects: [], count: 0 };
      this.boundaryMembers.set(boundary, members);
    }
    return members;
  }
  /** @internal */
  releaseBoundaryMembers(): void {
    for (const members of this.boundaryMembers.values()) {
      // Overwrite rather than truncate: emptying an array drops its storage, which then
      // regrew every frame. Released lists still hold no live frame references.
      const objects = members.objects;
      for (let i = 0; i < members.count; i++) objects[i] = undefined;
      members.count = 0;
      this.memberLists.push(members);
    }
    this.boundaryMembers.clear();
  }
  destroy(): void {
    this.clear();
    for (const command of this.pool) command.commands?.destroy();
    this.pool.length = 0;
  }
}

// Mirrors compareObjects2D: world before screen, then summed z; stable for ties.
function comparePooled2D(x: PooledCommand2D, y: PooledCommand2D): number {
  return x.screen === y.screen ? x.z - y.z : x.screen ? 1 : -1;
}
function compareCommands2D(a: RenderCommand2D, b: RenderCommand2D): number {
  return comparePooled2D(
    a as unknown as PooledCommand2D,
    b as unknown as PooledCommand2D,
  );
}
export interface RenderCollectionOptions2D {
  root?: IsolatedGroup2D;
  skipCulling?: boolean;
}

/** One collection path for every backend, capture and explicit local target. */
export function collectRenderCommands2D(
  scene: Scene,
  width: number,
  height: number,
  out: RenderCommandBuffer2D,
  options?: RenderCollectionOptions2D,
): void {
  out.reset();
  if (!options?.skipCulling && scene.renderTileMaps)
    for (const map of scene.renderTileMaps)
      map.updateCulling(scene.camera2D, width, height);
  const root = options?.root;
  try {
    partitionBoundaries2D(
      root && root.scene !== scene
        ? out.collectDetachedObjects(root)
        : scene.objects,
      root,
      out,
    );
    collectBoundary2D(
      scene,
      width,
      height,
      out,
      root,
      options?.skipCulling ?? false,
      0,
      out,
    );
  } catch (error) {
    out.clear();
    throw error;
  } finally {
    out.releaseTraversal();
    out.releaseBoundaryMembers();
  }
}

/**
 * Assigns every visible object to its nearest isolation boundary in Scene
 * registration order, so nested layers never rescan the whole Scene.
 */
function partitionBoundaries2D(
  objects: Iterable<object>,
  root: IsolatedGroup2D | undefined,
  out: RenderCommandBuffer2D,
): void {
  let lastBoundary: IsolatedGroup2D | undefined,
    lastMembers: MemberList2D | undefined;
  for (const object of objects) {
    if (!(object instanceof GameObject) || object === root) continue;
    // Collection drops disabled sprites and meshes without any other effect, so skipping
    // them here spares the ancestor walk for pooled particles and culled tiles.
    if (
      (object instanceof Sprite || object instanceof Mesh2D) &&
      !object.renderEnabled
    )
      continue;
    let visible = true,
      boundary: IsolatedGroup2D | undefined;
    for (
      let current: GameObject | undefined = object;
      current;
      current = current.parent
    ) {
      if (
        current !== object &&
        current instanceof IsolatedGroup2D &&
        (current === root || current.isolationEnabled)
      ) {
        boundary = current;
        break;
      }
      if (!current.visible || current.opacity <= 0 || current.tint[3] <= 0) {
        visible = false;
        break;
      }
    }
    if (!visible) continue;
    if (!lastMembers || boundary !== lastBoundary) {
      lastBoundary = boundary;
      lastMembers = out.membersOf(boundary);
    }
    lastMembers.objects[lastMembers.count++] = object;
  }
}

const cullingBounds = { x: 0, y: 0, width: 0, height: 0 };
const noMembers: MemberList2D = { objects: [], count: 0 };
function collectBoundary2D(
  scene: Scene,
  width: number,
  height: number,
  out: RenderCommandBuffer2D,
  root: IsolatedGroup2D | undefined,
  skipCulling: boolean,
  depth: number,
  budget: RenderCommandBuffer2D,
): void {
  if (depth > rendering2dLimits.layerDepth)
    throw new RangeError('Isolated layer nesting exceeds the render budget.');
  const camera = scene.camera2D;
  const members = budget.boundaryMembers.get(root) ?? noMembers;
  for (let index = 0; index < members.count; index++) {
    const object = members.objects[index]!;
    const layer = object instanceof IsolatedGroup2D && object.isolationEnabled;
    if (
      !layer &&
      !(object instanceof Sprite) &&
      !(object instanceof Mesh2D) &&
      !(object instanceof ParticleLayer2D)
    )
      continue;
    if (object instanceof Sprite || object instanceof Mesh2D) {
      if (!object.renderEnabled || object.texture.destroyed) continue;
      object.view?.validate();
    }
    // Explicit caches retain their previous coverage even after the live subtree becomes empty.
    if (!skipCulling && !(layer && object.cacheAsTexture)) {
      const bounds = object.getWorldBounds(cullingBounds);
      const world = object.worldSpace === 'world';
      const zoom = world ? camera.zoom : 1;
      const x =
        bounds.x * zoom +
        (world ? -camera.position.x * zoom + camera.renderOffset.x : 0);
      const y =
        bounds.y * zoom +
        (world ? -camera.position.y * zoom + camera.renderOffset.y : 0);
      const right = x + bounds.width * zoom;
      const bottom = y + bounds.height * zoom;
      if (
        right < 0 ||
        bottom < 0 ||
        x > width ||
        y > height ||
        !Number.isFinite(x + y + right + bottom)
      )
        continue;
    }
    if (++budget.collectedCount > rendering2dLimits.commands)
      throw new RangeError('Visible render commands exceed the render budget.');
    if (layer) {
      const nested = out.appendLayer(object);
      collectBoundary2D(
        scene,
        width,
        height,
        nested,
        object,
        true,
        depth + 1,
        budget,
      );
    } else if (object instanceof Sprite) out.appendSprite(object);
    else if (object instanceof Mesh2D) out.appendMesh(object);
    else if (object instanceof ParticleLayer2D) out.appendParticles(object);
  }
  // Stable sort retains Scene registration order for equal summed z in each space.
  out.finishAppends();
  out.sort();
}

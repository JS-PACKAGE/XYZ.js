import type { Scene } from '../../core/src/scene.js';
import { Sprite } from '../../core/src/sprite.js';
import type { GraphicsBackend } from './index.js';
import type { ColorRGBA } from '../../core/src/gameplay/contracts.js';
import { TileMap, IsometricMap } from '../../core/src/maps2d/index.js';
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

/** Commands and nested buffers are reused after the peak visible count. */
export class RenderCommandBuffer2D {
  readonly items: RenderCommand2D[] = [];
  private readonly pool: PooledCommand2D[] = [];
  private readonly traversal: GameObject[] = [];
  /** @internal Aggregate collection budget, including nested boundaries. */
  collectedCount = 0;
  /** @internal Members of each isolation boundary, filled once per collection. */
  readonly boundaryMembers = new Map<
    IsolatedGroup2D | undefined,
    GameObject[]
  >();
  private readonly memberLists: GameObject[][] = [];

  clear(): void {
    for (const command of this.items) {
      const pooled = command as unknown as PooledCommand2D;
      pooled.object = undefined;
      pooled.commands?.clear();
    }
    this.items.length = 0;
    this.traversal.length = 0;
    this.collectedCount = 0;
  }
  private append(
    kind: RenderCommand2D['kind'],
    object: GameObject,
  ): PooledCommand2D {
    const index = this.items.length;
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
    this.items.push(liveCommand);
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
  /** Orders by the keys captured at append; callers sort right after collection. */
  sort(): void {
    this.items.sort(compareCommands2D);
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
      for (const child of this.traversal[i].children)
        this.traversal.push(child);
    }
    return this.traversal;
  }
  /** @internal Only command records retain live frame references. */
  releaseTraversal(): void {
    this.traversal.length = 0;
  }
  /** @internal */
  membersOf(boundary: IsolatedGroup2D | undefined): GameObject[] {
    let members = this.boundaryMembers.get(boundary);
    if (!members) {
      members = this.memberLists.pop() ?? [];
      this.boundaryMembers.set(boundary, members);
    }
    return members;
  }
  /** @internal */
  releaseBoundaryMembers(): void {
    for (const members of this.boundaryMembers.values()) {
      members.length = 0;
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
function compareCommands2D(a: RenderCommand2D, b: RenderCommand2D): number {
  const x = a as unknown as PooledCommand2D,
    y = b as unknown as PooledCommand2D;
  return x.screen === y.screen ? x.z - y.z : x.screen ? 1 : -1;
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
  out.clear();
  if (!options?.skipCulling) {
    for (const object of scene.objects) {
      if (object instanceof TileMap || object instanceof IsometricMap)
        object.updateCulling(scene.camera2D, width, height);
    }
  }
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
    lastMembers: GameObject[] | undefined;
  for (const object of objects) {
    if (!(object instanceof GameObject) || object === root) continue;
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
    lastMembers.push(object);
  }
}

const cullingBounds = { x: 0, y: 0, width: 0, height: 0 };
const noMembers: readonly GameObject[] = [];
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
  for (const object of budget.boundaryMembers.get(root) ?? noMembers) {
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
  out.sort();
}

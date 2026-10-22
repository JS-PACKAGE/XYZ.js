import type { Scene } from '../../core/src/scene.js';
import { Sprite } from '../../core/src/sprite.js';
import type { GraphicsBackend } from './index.js';
import type { ColorRGBA, Rect2D } from '../../core/src/gameplay/contracts.js';
import type { Mask2D } from '../../core/src/rendering2d/mask2d.js';
import { GameObject } from '../../core/src/game-object.js';
import { IsolatedGroup2D } from '../../core/src/rendering2d/isolated-group.js';
import { Mesh2D } from '../../core/src/rendering2d/mesh2d.js';
import { ParticleLayer2D } from '../../core/src/particles2d/particle-layer2d.js';
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
export type RenderCommand2D = SpriteCommand2D | LayerCommand2D | MeshCommand2D | ParticlesCommand2D;
/** @internal A reused list whose entries past `count` are cleared, not truncated. */
export interface MemberList2D {
    readonly objects: (GameObject | undefined)[];
    count: number;
}
/** Commands and nested buffers are reused after the peak visible count. */
export declare class RenderCommandBuffer2D {
    readonly items: RenderCommand2D[];
    private readonly pool;
    private readonly traversal;
    /** Items appended since the last clear or reset; see reset(). */
    private appended;
    /** @internal Aggregate collection budget, including nested boundaries. */
    collectedCount: number;
    /** @internal Members of each isolation boundary, filled once per collection. */
    readonly boundaryMembers: Map<IsolatedGroup2D | undefined, MemberList2D>;
    private readonly memberLists;
    /** Scratch for the stable bucketed sort; see sort(). */
    private sortSlots;
    private readonly sortOutput;
    private readonly sortKeys;
    private readonly sortRanks;
    private readonly sortStarts;
    clear(): void;
    /**
     * @internal Like clear(), but keeps the item storage: emptying an array drops its backing
     * store, and refilling it then regrew on every collection. Appends overwrite from index 0
     * and finishAppends() truncates the stale tail, so read `items` only after that.
     */
    reset(): void;
    /** @internal Drops items left over from before reset(). */
    finishAppends(): void;
    private append;
    appendSprite(object: Sprite): void;
    appendMesh(object: Mesh2D): void;
    appendParticles(object: ParticleLayer2D): void;
    appendLayer(object: IsolatedGroup2D): RenderCommandBuffer2D;
    /**
     * Orders by the keys captured at append; callers sort right after collection.
     * Scenes usually use a few layer depths, so a stable counting sort over the
     * distinct keys replaces the comparison sort. With finite z the comparator is a
     * total preorder, so any stable sort yields the identical order; other inputs
     * keep Array#sort.
     */
    sort(): void;
    /** @internal Detached target collection borrows descendants without Scene.add side effects. */
    collectDetachedObjects(root: IsolatedGroup2D): readonly GameObject[];
    /** @internal Only command records retain live frame references. */
    releaseTraversal(): void;
    /** @internal */
    membersOf(boundary: IsolatedGroup2D | undefined): MemberList2D;
    /** @internal */
    releaseBoundaryMembers(): void;
    destroy(): void;
}
export interface RenderCollectionOptions2D {
    root?: IsolatedGroup2D;
    skipCulling?: boolean;
}
/** One collection path for every backend, capture and explicit local target. */
export declare function collectRenderCommands2D(scene: Scene, width: number, height: number, out: RenderCommandBuffer2D, options?: RenderCollectionOptions2D): void;
/** The geometric mask last rasterized into an isolated layer's retained mask target. */
export interface MaskRaster2D {
    mask: Mask2D | undefined;
    maskX: number;
    maskY: number;
    maskWidth: number;
    maskHeight: number;
}
/**
 * Whether `mask` over `bounds` is already in the layer's mask target. A geometric mask is frozen
 * and its raster depends only on it, the bounds and the target size (fixed for a layer entry),
 * and nothing else writes that target, so an unchanged pair keeps the previous coverage. Image
 * masks always redraw: their texture source can change between frames.
 */
export declare function maskRasterCurrent(layer: MaskRaster2D, mask: Mask2D, bounds: Readonly<Rect2D>): boolean;
export declare function recordMaskRaster(layer: MaskRaster2D, mask: Mask2D, bounds: Readonly<Rect2D>): void;
/**
 * One reused canvas for geometric mask coverage. A mask that changes every frame (a scrolling
 * view) would otherwise create, size and release a canvas and its 2D context each time. Both
 * uploads (`texSubImage2D`, `copyExternalImageToTexture`) read the canvas when called, so it
 * may be redrawn for the next mask right away. A size change replaces it, as a fresh canvas.
 */
export declare class MaskCanvas2D {
    private canvas;
    private context;
    draw(mask: Mask2D, width: number, height: number, bounds: Readonly<Rect2D>): HTMLCanvasElement;
    release(): void;
}

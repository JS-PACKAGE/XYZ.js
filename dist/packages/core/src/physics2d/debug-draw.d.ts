import { Graphics2D, type GraphicsInstruction2D } from '../graphics2d/index.js';
import type { PhysicsDebugSnapshot, PhysicsWorld2D } from './world.js';
export interface PhysicsDebugDrawOptions {
    /** Draw collider outlines (default true). */
    colliders?: boolean;
    /** Draw contact points and normals (default true). */
    contacts?: boolean;
    /** Draw joint anchors and the links between them (default true). */
    joints?: boolean;
    /** Draw each collider's AABB (default false). */
    bounds?: boolean;
    /** zIndex of the overlay sprite (default 10000). */
    zIndex?: number;
    /**
     * Only draw what touches this world-space rectangle. The overlay raster covers everything drawn,
     * so give a region (for example the visible area) when bodies can fly far outside it.
     */
    region?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
/** Resolved drawing switches shared by {@link PhysicsDebugDraw2D.instructions}. */
export interface PhysicsDebugDrawConfig {
    colliders: boolean;
    contacts: boolean;
    joints: boolean;
    bounds: boolean;
    region: PhysicsDebugDrawOptions['region'];
}
/**
 * Overlay of a PhysicsWorld2D drawn through the retained {@link Graphics2D} raster, so it works
 * on every backend. Colours: static blue, awake dynamic green, sleeping gray, sensor yellow,
 * contacts red, joints cyan. It re-rasterizes on {@link refresh}, which is meant for debugging
 * rather than per-frame production use; the raster covers the bounding box of everything drawn,
 * so a world that spans a huge area can exceed the Graphics2D size budget and reject.
 */
export declare class PhysicsDebugDraw2D {
    private readonly world;
    readonly display: Graphics2D;
    private readonly options;
    private refreshing;
    private disposed;
    private constructor();
    /** Creates the overlay; add `debug.display` to the Scene and call `refresh()` as needed. */
    static create(world: PhysicsWorld2D, options?: PhysicsDebugDrawOptions): Promise<PhysicsDebugDraw2D>;
    get destroyed(): boolean;
    get visible(): boolean;
    set visible(value: boolean);
    /**
     * Redraws from the world's current state. Calls made while a previous redraw is still
     * rasterizing are skipped (resolving immediately), so calling every frame cannot queue work.
     */
    refresh(): Promise<void>;
    destroy(): void;
    /** Pure conversion from a snapshot to Graphics2D instructions. */
    static instructions(snapshot: PhysicsDebugSnapshot, options: PhysicsDebugDrawConfig): GraphicsInstruction2D[];
}

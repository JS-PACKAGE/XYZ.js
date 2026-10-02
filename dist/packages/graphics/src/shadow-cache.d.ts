import type { Scene } from '../../core/src/scene.js';
import type { Mesh } from '../../core/src/mesh.js';
import type { ShadowAtlas } from '../../core/src/shadow-atlas.js';
import type { RenderVisibilityEntry } from '../../core/src/render-visibility.js';
/** Whole-atlas reuse; a changed caster or light invalidates every tile, never just color visibility. */
export declare class ShadowCache {
    private scene;
    private readonly atlasValues;
    private readonly casters;
    private revision;
    private width;
    private height;
    private frame;
    private valid;
    private readonly scalarValues;
    invalidate(): void;
    needsRender(scene: Scene, atlas: ShadowAtlas, meshes: readonly Mesh[], entries: ReadonlyMap<Mesh, RenderVisibilityEntry>, width: number, height: number): boolean;
    commit(): void;
}

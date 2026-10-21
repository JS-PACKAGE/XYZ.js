import type { Matrix4 } from '../../math/src/index.js';
import type { Mesh } from '../../core/src/mesh.js';
import type { OcclusionCandidate, OcclusionProofSource } from '../../core/src/render-visibility.js';
/** ANY_SAMPLES_PASSED_CONSERVATIVE over a solid enclosing proxy against real opaque depth. */
export declare class WebGLOcclusionBackend implements OcclusionProofSource {
    private readonly gl;
    private readonly slots;
    private readonly results;
    private readonly activeMeshes;
    private readonly program;
    private readonly vao;
    private readonly vertex;
    private readonly index;
    private readonly viewProjection;
    private readonly minimum;
    private readonly maximum;
    private readonly matrixData;
    private generation;
    private destroyed;
    constructor(gl: WebGL2RenderingContext);
    visible(mesh: Mesh, epoch: number): boolean;
    /** Poll once before gather; never block on unavailable GPU query results. */
    beginFrame(): void;
    /**
     * Caller keeps the opaque-depth framebuffer/viewport bound with all color channels
     * writable, and passes its depth write mask; all modified GL state is restored. Those
     * fixed-function values are not read back: each such query is a synchronous
     * GPU-process round trip. The depth function is the engine's only resting one, LESS.
     */
    draw(candidates: readonly OcclusionCandidate[], matrix: Matrix4, depthWrites: boolean): void;
    private poll;
    clear(): void;
    destroy(): void;
}

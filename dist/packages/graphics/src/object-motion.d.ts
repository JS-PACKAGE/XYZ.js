import type { Mesh } from '../../core/src/mesh.js';
import type { TemporalPostState } from './temporal-post.js';
export interface ObjectMotionDraw {
    mesh: Mesh;
    /** Current and previous clip transforms, column-major. */
    data: Float32Array;
}
/** Renderer-owned rigid pose history. No object/material/geometry ownership is transferred. */
export declare class ObjectMotionHistory {
    private poses;
    private frame;
    private readonly world;
    private readonly instance;
    private readonly clip;
    private readonly draws;
    private count;
    build(meshes: readonly Mesh[], state: TemporalPostState): readonly ObjectMotionDraw[];
    invalidate(): void;
}
export declare const objectMotionWGSL: (samples: number) => string;
export declare const objectMotionGLVertex = "#version 300 es\nprecision highp float;\nlayout(location=0) in vec3 position;\nuniform mat4 currentClip;\nuniform mat4 previousClip;\nout vec4 currentPosition;\nout vec4 previousPosition;\nvoid main() { currentPosition=currentClip*vec4(position,1.0); previousPosition=previousClip*vec4(position,1.0);\n gl_Position=currentPosition; gl_Position.z=2.0*gl_Position.z-gl_Position.w; }\n";
export declare const objectMotionGLFragment: string;

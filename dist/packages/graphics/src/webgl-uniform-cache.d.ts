/**
 * Skips scalar uniform writes that would leave program state unchanged.
 *
 * Uniform values persist per linked program and every location belongs to one
 * program, so keying by location is exact provided that every write to a
 * cached location goes through this cache. A relinked or restored program
 * yields new location objects and therefore starts uncached. The sent values
 * live on the location object itself: renderers make dozens of these checks
 * per draw, and a property load is much cheaper than a WeakMap lookup.
 */
export declare class WebGLUniformCache {
    /** Vector/array form; the sent data is copied, so callers may keep reusing `data`. */
    uniform4fv(gl: WebGL2RenderingContext, location: WebGLUniformLocation | null, data: Float32Array): void;
    /** Array form for data that never changes: resending the same array is skipped by identity. */
    sharedUniform4fv(gl: WebGL2RenderingContext, location: WebGLUniformLocation | null, data: Float32Array): void;
    private changed;
    uniform1i(gl: WebGL2RenderingContext, location: WebGLUniformLocation | null, x: number): void;
    uniform1f(gl: WebGL2RenderingContext, location: WebGLUniformLocation | null, x: number): void;
    uniform2f(gl: WebGL2RenderingContext, location: WebGLUniformLocation | null, x: number, y: number): void;
    uniform3f(gl: WebGL2RenderingContext, location: WebGLUniformLocation | null, x: number, y: number, z: number): void;
    uniform4f(gl: WebGL2RenderingContext, location: WebGLUniformLocation | null, x: number, y: number, z: number, w: number): void;
}

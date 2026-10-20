/**
 * Skips scalar uniform writes that would leave program state unchanged.
 *
 * Uniform values persist per linked program and every location belongs to one
 * program, so keying by location is exact provided that every write to a
 * cached location goes through this cache. A relinked or restored program
 * yields new location objects and therefore starts uncached.
 */
export declare class WebGLUniformCache {
    private readonly values;
    private changed;
    uniform1i(gl: WebGL2RenderingContext, location: WebGLUniformLocation | null, x: number): void;
    uniform1f(gl: WebGL2RenderingContext, location: WebGLUniformLocation | null, x: number): void;
    uniform2f(gl: WebGL2RenderingContext, location: WebGLUniformLocation | null, x: number, y: number): void;
    uniform3f(gl: WebGL2RenderingContext, location: WebGLUniformLocation | null, x: number, y: number, z: number): void;
    uniform4f(gl: WebGL2RenderingContext, location: WebGLUniformLocation | null, x: number, y: number, z: number, w: number): void;
}

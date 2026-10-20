/**
 * Skips scalar uniform writes that would leave program state unchanged.
 *
 * Uniform values persist per linked program and every location belongs to one
 * program, so keying by location is exact provided that every write to a
 * cached location goes through this cache. A relinked or restored program
 * yields new location objects and therefore starts uncached.
 */
export class WebGLUniformCache {
  private readonly values = new WeakMap<WebGLUniformLocation, Float64Array>();

  private changed(
    location: WebGLUniformLocation,
    x: number,
    y: number,
    z: number,
    w: number,
  ): boolean {
    let value = this.values.get(location);
    if (!value) this.values.set(location, (value = new Float64Array(4)));
    else if (
      same(value[0]!, x) &&
      same(value[1]!, y) &&
      same(value[2]!, z) &&
      same(value[3]!, w)
    )
      return false;
    value[0] = x;
    value[1] = y;
    value[2] = z;
    value[3] = w;
    return true;
  }

  uniform1i(
    gl: WebGL2RenderingContext,
    location: WebGLUniformLocation | null,
    x: number,
  ): void {
    if (location && this.changed(location, x, 0, 0, 0))
      gl.uniform1i(location, x);
  }

  uniform1f(
    gl: WebGL2RenderingContext,
    location: WebGLUniformLocation | null,
    x: number,
  ): void {
    if (location && this.changed(location, x, 0, 0, 0))
      gl.uniform1f(location, x);
  }

  uniform2f(
    gl: WebGL2RenderingContext,
    location: WebGLUniformLocation | null,
    x: number,
    y: number,
  ): void {
    if (location && this.changed(location, x, y, 0, 0))
      gl.uniform2f(location, x, y);
  }

  uniform3f(
    gl: WebGL2RenderingContext,
    location: WebGLUniformLocation | null,
    x: number,
    y: number,
    z: number,
  ): void {
    if (location && this.changed(location, x, y, z, 0))
      gl.uniform3f(location, x, y, z);
  }

  uniform4f(
    gl: WebGL2RenderingContext,
    location: WebGLUniformLocation | null,
    x: number,
    y: number,
    z: number,
    w: number,
  ): void {
    if (location && this.changed(location, x, y, z, w))
      gl.uniform4f(location, x, y, z, w);
  }
}

/** `===` except that -0 and +0 differ, since shaders can observe the sign. */
function same(a: number, b: number): boolean {
  return a === b && (a !== 0 || 1 / a === 1 / b);
}

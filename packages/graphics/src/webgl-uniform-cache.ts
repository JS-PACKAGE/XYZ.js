const sentScalar = Symbol('xyz.sentUniformScalar');
const sentVector = Symbol('xyz.sentUniformVector');
const sentShared = Symbol('xyz.sentUniformShared');

/** A location carrying the last values written through a `WebGLUniformCache`. */
interface SentLocation {
  [sentScalar]?: Float64Array;
  [sentVector]?: Float32Array;
  /** The never-changing array last sent by `sharedUniform4fv`, if that was the last write. */
  [sentShared]?: Float32Array;
}

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
export class WebGLUniformCache {
  /** Vector/array form; the sent data is copied, so callers may keep reusing `data`. */
  uniform4fv(
    gl: WebGL2RenderingContext,
    location: WebGLUniformLocation | null,
    data: Float32Array,
  ): void {
    if (!location) return;
    const entry = location as SentLocation;
    const sent = entry[sentVector];
    if (sent?.length === data.length) {
      let i = 0;
      while (i < data.length && same(sent[i]!, data[i]!)) i++;
      if (i === data.length) return;
      sent.set(data);
    } else entry[sentVector] = data.slice();
    entry[sentShared] = undefined;
    gl.uniform4fv(location, data);
  }

  /** Array form for data that never changes: resending the same array is skipped by identity. */
  sharedUniform4fv(
    gl: WebGL2RenderingContext,
    location: WebGLUniformLocation | null,
    data: Float32Array,
  ): void {
    if (!location) return;
    const entry = location as SentLocation;
    if (entry[sentShared] === data) return;
    entry[sentShared] = data;
    entry[sentVector] = undefined;
    gl.uniform4fv(location, data);
  }

  private changed(
    location: WebGLUniformLocation,
    x: number,
    y: number,
    z: number,
    w: number,
  ): boolean {
    const entry = location as SentLocation;
    let value = entry[sentScalar];
    if (!value) entry[sentScalar] = value = new Float64Array(4);
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

  uniform4i(
    gl: WebGL2RenderingContext,
    location: WebGLUniformLocation | null,
    x: number,
    y: number,
    z: number,
    w: number,
  ): void {
    if (location && this.changed(location, x, y, z, w))
      gl.uniform4i(location, x, y, z, w);
  }
}

/** `===` except that -0 and +0 differ, since shaders can observe the sign. */
function same(a: number, b: number): boolean {
  return a === b && (a !== 0 || 1 / a === 1 / b);
}

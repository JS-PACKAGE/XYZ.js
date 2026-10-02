export interface GeometryData {
  positions: ArrayLike<number>;
  normals: ArrayLike<number>;
  uvs: ArrayLike<number>;
  /** Optional TEXCOORD_1; UV0 remains in the legacy interleaved vertex stream. */
  uvs1?: ArrayLike<number>;
  indices: ArrayLike<number>;
  /** Optional linear RGB or RGBA per vertex, multiplied into the base color. */
  colors?: ArrayLike<number>;
}

function positive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0)
    throw new RangeError(`${name} must be positive and finite.`);
}

function segments(value: number, minimum: number, name: string): void {
  if (!Number.isInteger(value) || value < minimum)
    throw new RangeError(`${name} must be an integer >= ${minimum}.`);
}

/** CPU-only indexed triangles. Input arrays are copied; call markUpdated after changing vertices. */
export class Geometry {
  /** xyz, normal xyz, uv, interleaved at a stride of eight floats. */
  readonly vertices: Float32Array;
  readonly indices: Uint32Array;
  /** Two floats per vertex; edit in place then call markUpdated, like vertices. */
  readonly uvs1: Float32Array | undefined;
  version = 0;
  private vertexColors: Float32Array | undefined;

  /**
   * Per-vertex linear RGBA (four floats per vertex) or undefined. Renderers multiply it into
   * the base color, together with `InstancedMesh` colors and the material tint.
   * Replace the array with {@link setColors}, or edit it in place and call {@link markUpdated}.
   */
  get colors(): Float32Array | undefined {
    return this.vertexColors;
  }

  /** Copies RGB(A) colors, supplying alpha 1 for RGB input, or removes vertex colors. */
  setColors(colors: ArrayLike<number> | undefined): void {
    if (colors === undefined) {
      if (this.vertexColors === undefined) return;
      this.vertexColors = undefined;
      this.version++;
      return;
    }
    const count = this.vertices.length / 8;
    const components = colors.length / count;
    if (components !== 3 && components !== 4)
      throw new RangeError(
        'Geometry colors must contain RGB or RGBA per vertex.',
      );
    const copy = new Float32Array(count * 4);
    for (let vertex = 0; vertex < count; vertex++) {
      for (let component = 0; component < 4; component++) {
        const value =
          component < components ? colors[vertex * components + component] : 1;
        if (
          !Number.isFinite(value) ||
          value < 0 ||
          !Number.isFinite(Math.fround(value)) ||
          (component === 3 && value > 1)
        )
          throw new RangeError(
            'Geometry colors must be finite, nonnegative, with alpha in [0, 1].',
          );
        copy[vertex * 4 + component] = value;
      }
    }
    this.vertexColors = copy;
    this.version++;
  }

  markUpdated(): void {
    this.version++;
  }

  constructor(data: GeometryData) {
    const { positions, normals, uvs, indices } = data;
    const count = positions.length / 3;
    if (!Number.isSafeInteger(count) || count < 3)
      throw new RangeError(
        'Geometry requires at least three vertex positions.',
      );
    if (normals.length !== count * 3 || uvs.length !== count * 2)
      throw new RangeError(
        'Geometry normal and UV counts must match positions.',
      );
    if (
      !Number.isSafeInteger(indices.length) ||
      indices.length < 3 ||
      indices.length % 3 !== 0
    )
      throw new RangeError('Geometry indices must contain complete triangles.');

    const vertices = new Float32Array(count * 8);
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < 3; j++) {
        const position = positions[i * 3 + j];
        const normal = normals[i * 3 + j];
        if (!Number.isFinite(position) || !Number.isFinite(normal))
          throw new RangeError(
            'Geometry positions and normals must be finite.',
          );
        vertices[i * 8 + j] = position;
        vertices[i * 8 + 3 + j] = normal;
        if (
          !Number.isFinite(vertices[i * 8 + j]) ||
          !Number.isFinite(vertices[i * 8 + 3 + j])
        )
          throw new RangeError('Geometry coordinates must fit in Float32.');
      }
      for (let j = 0; j < 2; j++) {
        const uv = uvs[i * 2 + j];
        if (!Number.isFinite(uv))
          throw new RangeError('Geometry UVs must be finite.');
        vertices[i * 8 + 6 + j] = uv;
        if (!Number.isFinite(vertices[i * 8 + 6 + j]))
          throw new RangeError('Geometry UVs must fit in Float32.');
      }
    }
    const copiedIndices = new Uint32Array(indices.length);
    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];
      if (!Number.isSafeInteger(index) || index < 0 || index >= count)
        throw new RangeError('Geometry index is outside the vertex range.');
      copiedIndices[i] = index;
    }
    this.vertices = vertices;
    this.indices = copiedIndices;
    if (data.uvs1 !== undefined) {
      if (data.uvs1.length !== count * 2)
        throw new RangeError('Geometry UV1 counts must match positions.');
      const copy = new Float32Array(count * 2);
      for (let i = 0; i < copy.length; i++) {
        const value = data.uvs1[i];
        if (!Number.isFinite(value) || !Number.isFinite(Math.fround(value)))
          throw new RangeError(
            'Geometry UV1 must be finite and fit in Float32.',
          );
        copy[i] = value;
      }
      this.uvs1 = copy;
    }
    if (data.colors !== undefined) {
      this.setColors(data.colors);
      this.version = 0;
    }
  }

  private boundsVersion = -1;
  private readonly sphere = { x: 0, y: 0, z: 0, radius: 0 };

  /** Bounding sphere of the box around all vertices; recomputed only after `markUpdated`. */
  get boundingSphere(): Readonly<{
    x: number;
    y: number;
    z: number;
    radius: number;
  }> {
    if (this.boundsVersion === this.version) return this.sphere;
    const v = this.vertices;
    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity,
      maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;
    for (let i = 0; i < v.length; i += 8) {
      minX = Math.min(minX, v[i]);
      maxX = Math.max(maxX, v[i]);
      minY = Math.min(minY, v[i + 1]);
      maxY = Math.max(maxY, v[i + 1]);
      minZ = Math.min(minZ, v[i + 2]);
      maxZ = Math.max(maxZ, v[i + 2]);
    }
    const s = this.sphere;
    s.x = (minX + maxX) / 2;
    s.y = (minY + maxY) / 2;
    s.z = (minZ + maxZ) / 2;
    s.radius = Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2;
    this.boundsVersion = this.version;
    return s;
  }

  static cube(size = 1): Geometry {
    positive(size, 'Cube size');
    const h = size / 2;
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    // Each face has separate vertices, so edges keep hard normals and independent UVs.
    const faces = [
      [
        [h, 0, 0],
        [0, h, 0],
        [0, 0, -h],
      ],
      [
        [-h, 0, 0],
        [0, h, 0],
        [0, 0, h],
      ],
      [
        [0, h, 0],
        [0, 0, -h],
        [h, 0, 0],
      ],
      [
        [0, -h, 0],
        [0, 0, h],
        [h, 0, 0],
      ],
      [
        [0, 0, h],
        [0, h, 0],
        [h, 0, 0],
      ],
      [
        [0, 0, -h],
        [0, h, 0],
        [-h, 0, 0],
      ],
    ];
    for (const [normal, up, right] of faces) {
      const base = positions.length / 3;
      for (const [u, v] of [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]) {
        const sx = 2 * u - 1;
        const sy = 1 - 2 * v;
        positions.push(
          normal[0] + right[0] * sx + up[0] * sy,
          normal[1] + right[1] * sx + up[1] * sy,
          normal[2] + right[2] * sx + up[2] * sy,
        );
        normals.push(normal[0] / h, normal[1] / h, normal[2] / h);
        uvs.push(u, v);
      }
      indices.push(base, base + 2, base + 1, base, base + 3, base + 2);
    }
    return new Geometry({ positions, normals, uvs, indices });
  }

  static sphere(
    radius = 0.5,
    widthSegments = 32,
    heightSegments = 16,
  ): Geometry {
    positive(radius, 'Sphere radius');
    segments(widthSegments, 3, 'Sphere widthSegments');
    segments(heightSegments, 2, 'Sphere heightSegments');
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    for (let y = 0; y <= heightSegments; y++) {
      const theta = (Math.PI * y) / heightSegments;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      for (let x = 0; x <= widthSegments; x++) {
        const phi = (2 * Math.PI * x) / widthSegments;
        const nx = sinTheta * Math.cos(phi);
        const nz = sinTheta * Math.sin(phi);
        positions.push(radius * nx, radius * cosTheta, radius * nz);
        normals.push(nx, cosTheta, nz);
        uvs.push(x / widthSegments, y / heightSegments);
      }
    }
    const stride = widthSegments + 1;
    for (let y = 0; y < heightSegments; y++) {
      for (let x = 0; x < widthSegments; x++) {
        const a = y * stride + x;
        const b = a + stride;
        if (y > 0) indices.push(a, a + 1, b + 1);
        if (y < heightSegments - 1) indices.push(a, b + 1, b);
      }
    }
    return new Geometry({ positions, normals, uvs, indices });
  }

  /** Horizontal XZ plane, facing +Y; UV origin is at the near-left corner. */
  static plane(width = 1, depth = 1): Geometry {
    positive(width, 'Plane width');
    positive(depth, 'Plane depth');
    const x = width / 2;
    const z = depth / 2;
    return new Geometry({
      positions: [-x, 0, z, x, 0, z, x, 0, -z, -x, 0, -z],
      normals: [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
      uvs: [0, 1, 1, 1, 1, 0, 0, 0],
      indices: [0, 1, 2, 0, 2, 3],
    });
  }

  /** XY quad facing +Z, with texture V increasing downward. */
  static quad(width = 1, height = 1): Geometry {
    positive(width, 'Quad width');
    positive(height, 'Quad height');
    const x = width / 2;
    const y = height / 2;
    return new Geometry({
      positions: [-x, y, 0, x, y, 0, x, -y, 0, -x, -y, 0],
      normals: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      uvs: [0, 0, 1, 0, 1, 1, 0, 1],
      indices: [0, 2, 1, 0, 3, 2],
    });
  }
}

/** Named unit-box factory for scene construction. */
export class BoxGeometry {
  static unit(): Geometry {
    return Geometry.cube();
  }
}

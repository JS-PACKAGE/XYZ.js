import { workerJobLimits } from '../../../src/data/worker-jobs.js';
import {
  NativeWorkerPool,
  WorkerJobError,
  type NativeWorkerPoolOptions,
  type WorkerJobDefinition,
} from '../../assets/src/worker-jobs.js';
import { Geometry } from './geometry.js';

export interface HeightfieldGeometryRequest {
  readonly columns: number;
  readonly rows: number;
  readonly width: number;
  readonly depth: number;
  readonly heights: Float32Array;
  /** Jacobi smoothing passes; boundary samples remain fixed. */
  readonly iterations: number;
  readonly smoothing: number;
  /** Transfer the generated streams back, or structured-clone them for a measured comparison. */
  readonly transferResult?: boolean;
}

export interface HeightfieldGeometryResult {
  readonly columns: number;
  readonly rows: number;
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly uvs: Float32Array;
  readonly indices: Uint32Array;
}

export function decodeHeightfieldGeometryRequest(
  value: unknown,
): HeightfieldGeometryRequest {
  if (!value || typeof value !== 'object')
    throw new TypeError('A heightfield request is required.');
  const request = value as HeightfieldGeometryRequest;
  const count = request.columns * request.rows;
  if (
    !Number.isSafeInteger(request.columns) ||
    request.columns < 2 ||
    !Number.isSafeInteger(request.rows) ||
    request.rows < 2 ||
    !Number.isSafeInteger(count) ||
    count > workerJobLimits.geometryVertices
  )
    throw new RangeError('Heightfield dimensions exceed the vertex budget.');
  if (
    !(request.heights instanceof Float32Array) ||
    request.heights.length !== count
  )
    throw new RangeError(
      'Height samples must match the heightfield dimensions.',
    );
  if (
    !Number.isSafeInteger(request.iterations) ||
    request.iterations < 0 ||
    request.iterations > workerJobLimits.geometryIterations
  )
    throw new RangeError('Heightfield iterations exceed the smoothing budget.');
  if (
    !Number.isFinite(request.smoothing) ||
    request.smoothing < 0 ||
    request.smoothing > 1 ||
    !Number.isFinite(request.width) ||
    request.width <= 0 ||
    !Number.isFinite(request.depth) ||
    request.depth <= 0 ||
    !Number.isFinite(Math.fround(request.width)) ||
    !Number.isFinite(Math.fround(request.depth)) ||
    Math.fround(request.width) === 0 ||
    Math.fround(request.depth) === 0
  )
    throw new RangeError(
      'Heightfield extents and smoothing must be finite and in range.',
    );
  if (
    request.transferResult !== undefined &&
    typeof request.transferResult !== 'boolean'
  )
    throw new TypeError('Heightfield result transfer must be boolean.');
  for (const height of request.heights) {
    if (!Number.isFinite(height))
      throw new RangeError('Height samples must be finite.');
  }
  return request;
}

/** Real CPU smoothing, indexed topology and finite-difference normals; the worker and main thread share this implementation. */
export function processHeightfieldGeometry(
  input: HeightfieldGeometryRequest,
): HeightfieldGeometryResult {
  const request = decodeHeightfieldGeometryRequest(input);
  const { columns, rows, width, depth, iterations, smoothing } = request;
  const count = columns * rows;
  let current = request.heights;
  if (iterations > 0 && smoothing > 0) {
    let next: Float32Array = new Float32Array(current);
    let spare: Float32Array = iterations > 1 ? new Float32Array(current) : next;
    for (let pass = 0; pass < iterations; pass++) {
      for (let row = 1; row < rows - 1; row++) {
        const offset = row * columns;
        for (let column = 1; column < columns - 1; column++) {
          const index = offset + column;
          next[index] =
            current[index] * (1 - smoothing) +
            smoothing *
              (current[index - 1] +
                current[index + 1] +
                current[index - columns] +
                current[index + columns]) *
              0.25;
        }
      }
      current = next;
      next = spare;
      spare = current;
    }
  }
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  const indices = new Uint32Array((columns - 1) * (rows - 1) * 6);
  const stepX = width / (columns - 1);
  const stepZ = depth / (rows - 1);
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const index = row * columns + column;
      const left = Math.max(0, column - 1),
        right = Math.min(columns - 1, column + 1);
      const up = Math.max(0, row - 1),
        down = Math.min(rows - 1, row + 1);
      const dx =
        (current[row * columns + right] - current[row * columns + left]) /
        ((right - left) * stepX);
      const dz =
        (current[up * columns + column] - current[down * columns + column]) /
        ((down - up) * stepZ);
      const length = Math.hypot(dx, 1, dz);
      positions[index * 3] = column * stepX - width / 2;
      positions[index * 3 + 1] = current[index];
      positions[index * 3 + 2] = depth / 2 - row * stepZ;
      normals[index * 3] = -dx / length;
      normals[index * 3 + 1] = 1 / length;
      normals[index * 3 + 2] = -dz / length;
      uvs[index * 2] = column / (columns - 1);
      uvs[index * 2 + 1] = row / (rows - 1);
      if (column < columns - 1 && row < rows - 1) {
        const base = (row * (columns - 1) + column) * 6;
        indices[base] = index;
        indices[base + 1] = index + 1;
        indices[base + 2] = index + columns + 1;
        indices[base + 3] = index;
        indices[base + 4] = index + columns + 1;
        indices[base + 5] = index + columns;
      }
    }
  }
  return { columns, rows, positions, normals, uvs, indices };
}

export function decodeHeightfieldGeometryResult(
  value: unknown,
): HeightfieldGeometryResult {
  if (!value || typeof value !== 'object')
    throw new TypeError('A geometry response is required.');
  const result = value as HeightfieldGeometryResult;
  const count = result.columns * result.rows;
  if (
    !Number.isSafeInteger(result.columns) ||
    result.columns < 2 ||
    !Number.isSafeInteger(result.rows) ||
    result.rows < 2 ||
    count > workerJobLimits.geometryVertices ||
    !(result.positions instanceof Float32Array) ||
    result.positions.length !== count * 3 ||
    !(result.normals instanceof Float32Array) ||
    result.normals.length !== count * 3 ||
    !(result.uvs instanceof Float32Array) ||
    result.uvs.length !== count * 2 ||
    !(result.indices instanceof Uint32Array) ||
    result.indices.length !== (result.columns - 1) * (result.rows - 1) * 6
  )
    throw new RangeError(
      'Worker geometry streams do not match their dimensions.',
    );
  return result;
}

export const heightfieldGeometryJob: WorkerJobDefinition<
  HeightfieldGeometryRequest,
  HeightfieldGeometryResult
> = {
  type: 'geometry.heightfield',
  decode: decodeHeightfieldGeometryResult,
  release() {
    // These responses own only ArrayBuffers, with no native close/destroy handle.
    // Dropping the pool's response reference reclaims unpublished data via the JS memory owner.
  },
};

export interface PublishedWorkerGeometry {
  readonly geometry: Geometry;
  readonly publicationMilliseconds: number;
  /** Existing Geometry validates/interleaves and copies the supplied streams. Not hidden as zero-copy publication. */
  readonly publicationCopiedBytes: number;
}

/** Publish through the existing Geometry consumer, never a second asset loader/cache. */
export function publishHeightfieldGeometry(
  result: HeightfieldGeometryResult,
): PublishedWorkerGeometry {
  const data = decodeHeightfieldGeometryResult(result);
  const started = performance.now();
  const geometry = new Geometry(data);
  return {
    geometry,
    publicationMilliseconds: performance.now() - started,
    publicationCopiedBytes:
      geometry.vertices.byteLength +
      geometry.indices.byteLength +
      geometry.tangents.byteLength,
  };
}
/** Resolves to a real emitted .js module in the published dist tree. */
export function geometryWorkerURL(): URL {
  return new URL('./workers/geometry.worker.js', import.meta.url);
}

/** Static native Worker construction is visible to bundlers; moduleURL remains explicit on the underlying pool. */
export function createGeometryWorkerPool(
  options: Omit<NativeWorkerPoolOptions, 'moduleURL' | 'workerFactory'> = {},
): NativeWorkerPool {
  if (typeof Worker === 'undefined')
    throw new WorkerJobError(
      'unsupported',
      'Native module Workers are unavailable.',
    );
  return new NativeWorkerPool({
    ...options,
    moduleURL: geometryWorkerURL(),
    workerFactory: () =>
      new Worker(new URL('./workers/geometry.worker.js', import.meta.url), {
        type: 'module',
      }),
  });
}

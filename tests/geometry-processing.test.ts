import { describe, expect, it } from 'vitest';
import {
  processHeightfieldGeometry,
  publishHeightfieldGeometry,
  type HeightfieldGeometryRequest,
} from '../packages/core/src/geometry-processing.js';
import {
  installWorkerJobs,
  type WorkerJobHost,
} from '../packages/assets/src/worker-job-runtime.js';
import {
  workerJobProtocol,
  type WorkerJobResponse,
} from '../packages/assets/src/worker-job-protocol.js';

function terrain(
  heights: number[],
  changes: Partial<HeightfieldGeometryRequest> = {},
): HeightfieldGeometryRequest {
  return {
    columns: 3,
    rows: 3,
    width: 2,
    depth: 2,
    heights: new Float32Array(heights),
    iterations: 2,
    smoothing: 0.5,
    ...changes,
  };
}

describe('CPU geometry preprocessing', () => {
  it('smooths interior terrain without modifying source samples or the authored boundary', () => {
    const source = terrain([0, 0, 0, 0, 8, 0, 0, 0, 0]);
    const result = processHeightfieldGeometry(source);
    expect(result.positions[4 * 3 + 1]).toBe(2);
    expect(source.heights[4]).toBe(8);
    for (const boundary of [0, 1, 2, 3, 5, 6, 7, 8])
      expect(result.positions[boundary * 3 + 1]).toBe(0);
    const published = publishHeightfieldGeometry(result);
    expect(published.geometry.boundingSphere).toEqual({
      x: 0,
      y: 1,
      z: 0,
      radius: Math.sqrt(3),
    });
    expect(published.geometry.vertices[4 * 8 + 1]).toBe(2);
  });

  it('produces +Y-wound topology and finite normals for a sloped XZ surface with correct UV edges', () => {
    const heights = [2, 5, 8, 0, 3, 6, -2, 1, 4];
    const result = processHeightfieldGeometry(terrain(heights));
    const length = Math.sqrt(14);
    for (let vertex = 0; vertex < 9; vertex++) {
      expect(result.normals[vertex * 3]).toBeCloseTo(-3 / length);
      expect(result.normals[vertex * 3 + 1]).toBeCloseTo(1 / length);
      expect(result.normals[vertex * 3 + 2]).toBeCloseTo(-2 / length);
    }
    expect(Array.from(result.indices.slice(0, 6))).toEqual([0, 1, 4, 0, 4, 3]);
    const [a, b, c] = result.indices;
    const abx = result.positions[b * 3] - result.positions[a * 3];
    const abz = result.positions[b * 3 + 2] - result.positions[a * 3 + 2];
    const acx = result.positions[c * 3] - result.positions[a * 3];
    const acz = result.positions[c * 3 + 2] - result.positions[a * 3 + 2];
    expect(abz * acx - abx * acz).toBeGreaterThan(0);
    expect(Array.from(result.uvs.slice(-2))).toEqual([1, 1]);
  });

  it('rejects nonfinite samples and out-of-budget work before publishing any consumer geometry', () => {
    expect(() =>
      processHeightfieldGeometry(terrain([0, 0, 0, 0, NaN, 0, 0, 0, 0])),
    ).toThrow(RangeError);
    expect(() =>
      processHeightfieldGeometry(
        terrain(new Array(9).fill(0), { iterations: 513 }),
      ),
    ).toThrow(RangeError);
    expect(() =>
      processHeightfieldGeometry(terrain(new Array(9).fill(0), { columns: 1 })),
    ).toThrow(RangeError);
    expect(() =>
      processHeightfieldGeometry(
        terrain(new Array(9).fill(0), { width: Number.MIN_VALUE }),
      ),
    ).toThrow(RangeError);
  });

  it('cleans claimed owned response/scratch resources when actual trusted execution throws', async () => {
    let claimedClosed = false;
    let scratchClosed = false;
    let response!: WorkerJobResponse;
    let accept!: () => void;
    const finished = new Promise<void>((resolve) => {
      accept = resolve;
    });
    const host: WorkerJobHost = {
      onmessage: null,
      postMessage(message) {
        response = message;
        accept();
      },
    };
    const uninstall = installWorkerJobs(
      {
        fail: {
          decode(value) {
            return value;
          },
          execute(_request, context) {
            context.own({ nativeOwner: 'response' }, () => {
              claimedClosed = true;
            });
            context.own({ nativeOwner: 'scratch' }, () => {
              scratchClosed = true;
            });
            throw new Error('Geometry preprocessing rejected');
          },
        },
      },
      host,
    );
    host.onmessage!(
      new MessageEvent('message', {
        data: {
          protocol: workerJobProtocol,
          type: 'run',
          id: 1,
          jobType: 'fail',
          request: null,
          requestBytes: 0,
        },
      }),
    );
    await finished;
    expect(response).toMatchObject({
      type: 'error',
      error: { message: 'Geometry preprocessing rejected' },
    });
    expect(claimedClosed).toBe(true);
    expect(scratchClosed).toBe(true);
    uninstall();
  });
});

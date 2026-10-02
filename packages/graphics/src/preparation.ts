import type { Texture2DSource } from '../../assets/src/index.js';
import { Geometry } from '../../core/src/geometry.js';
import { Geometry2D } from '../../core/src/rendering2d/geometry2d.js';
import { Mesh } from '../../core/src/mesh.js';
import { EnvironmentMap } from '../../core/src/environment.js';
import {
  Material2D,
  PostProcessor2D,
} from '../../core/src/materials2d/material2d.js';
import { NativeMaterial3D } from '../../core/src/native-material3d.js';
import type { NativeResidency, ResidencyAllocation } from './residency.js';
import { ParticleLayer2D } from '../../core/src/particles2d/particle-layer2d.js';
import { GPUParticleEmitter3D } from '../../core/src/gpu-particles3d.js';

export type PreparationResource =
  | Texture2DSource
  | Geometry
  | Geometry2D
  | Mesh
  | ParticleLayer2D
  | GPUParticleEmitter3D
  | EnvironmentMap
  | Material2D
  | NativeMaterial3D
  | PostProcessor2D;
export interface ResourcePreparationOptions {
  readonly signal?: AbortSignal;
}
interface NativePreparationOperations {
  texture(source: Texture2DSource): void;
  geometry(source: Geometry | Geometry2D): void;
  mesh(source: Mesh): void;
  particles(source: ParticleLayer2D): void;
  gpuParticles(source: GPUParticleEmitter3D): Promise<void>;
  environment(source: EnvironmentMap): void;
  material(source: Material2D | NativeMaterial3D): Promise<void>;
  post(source: PostProcessor2D): Promise<void>;
  complete(): Promise<void>;
}
export interface PreparedResourceLease {
  readonly released: boolean;
  release(): void;
}
export function preparationResourceDestroyed(
  resource: PreparationResource,
): boolean {
  return (
    !(resource instanceof Geometry || resource instanceof Geometry2D) &&
    resource.destroyed
  );
}
export function residencyLease(
  allocations: readonly ResidencyAllocation[],
): PreparedResourceLease {
  let released = false;
  return {
    get released() {
      return released;
    },
    release() {
      if (released) return;
      released = true;
      for (const allocation of allocations) allocation.release();
    },
  };
}
export async function prepareNativeResource(
  residency: NativeResidency,
  resource: PreparationResource,
  operations: NativePreparationOperations,
  options: ResourcePreparationOptions = {},
): Promise<PreparedResourceLease> {
  options.signal?.throwIfAborted();
  if (resource instanceof GPUParticleEmitter3D) {
    return completePreparation(
      operations.gpuParticles(resource),
      residencyLease([]),
      options.signal,
    );
  }
  if (resource instanceof PostProcessor2D) {
    return completePreparation(
      operations.post(resource),
      residencyLease([]),
      options.signal,
    );
  }
  if (resource instanceof Material2D) {
    return completePreparation(
      operations.material(resource),
      residencyLease([]),
      options.signal,
    );
  }
  residency.beginCapture();
  let lease: PreparedResourceLease;
  try {
    if (resource instanceof Geometry || resource instanceof Geometry2D)
      operations.geometry(resource);
    else if (resource instanceof Mesh) operations.mesh(resource);
    else if (resource instanceof ParticleLayer2D)
      operations.particles(resource);
    else if (resource instanceof EnvironmentMap)
      operations.environment(resource);
    else if (resource instanceof NativeMaterial3D) {
      operations.texture(resource.texture);
      for (const texture of resource.textures) operations.texture(texture);
    } else operations.texture(resource);
    lease = residencyLease(residency.endCapture());
  } catch (error) {
    residencyLease(residency.endCapture()).release();
    throw error;
  }
  try {
    return await completePreparation(
      resource instanceof NativeMaterial3D
        ? operations.material(resource)
        : operations.complete(),
      lease,
      options.signal,
    );
  } catch (error) {
    lease.release();
    throw error;
  }
}

async function completePreparation(
  completion: Promise<void>,
  lease: PreparedResourceLease,
  signal?: AbortSignal,
): Promise<PreparedResourceLease> {
  let abort: (() => void) | undefined;
  try {
    if (signal) {
      const cancelled = new Promise<never>((_resolve, reject) => {
        abort = (): void => {
          lease.release();
          reject(signal.reason);
        };
        signal.addEventListener('abort', abort, { once: true });
        if (signal.aborted) abort();
      });
      await Promise.race([completion, cancelled]);
    } else await completion;
    signal?.throwIfAborted();
    return lease;
  } catch (error) {
    lease.release();
    throw error;
  } finally {
    if (abort) signal?.removeEventListener('abort', abort);
  }
}

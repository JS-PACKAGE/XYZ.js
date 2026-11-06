import type { Scene } from '../../core/src/scene.js';
import { Mesh } from '../../core/src/mesh.js';
import { GameObject } from '../../core/src/game-object.js';
import { Sprite } from '../../core/src/sprite.js';
import { Mesh2D } from '../../core/src/rendering2d/mesh2d.js';
import { IsolatedGroup2D } from '../../core/src/rendering2d/isolated-group.js';
import { DisplacementFilter2D } from '../../core/src/rendering2d/filters2d.js';
import { ParticleLayer2D } from '../../core/src/particles2d/particle-layer2d.js';
import { NativeMaterial3D } from '../../core/src/native-material3d.js';
import { NativePBRMaterial } from '../../core/src/native-pbr-material.js';
import { GPUParticleEmitter3D } from '../../core/src/gpu-particles3d.js';
import { Object3D } from '../../core/src/object3d.js';
import type { Renderer } from './index.js';
import type {
  PreparationResource,
  PreparedResourceLease,
} from './preparation.js';
import { GraphicsError, UnsupportedGraphicsError } from './errors.js';

export interface WarmupProgress {
  readonly completed: number;
  readonly total: number;
  readonly ratio: number;
  readonly chunks: number;
}
export interface WarmupOptions {
  /** Maximum resources begun in a RAF chunk; defaults to eight. */
  maxItems?: number;
  /** CPU wall-clock boundary between resources; one item can exceed it. Defaults to four ms. */
  maxMilliseconds?: number;
  signal?: AbortSignal;
  onProgress?(progress: WarmupProgress): void;
}
export interface WarmupLease {
  readonly progress: WarmupProgress;
  readonly released: boolean;
  /** Release residency protection, not the borrowed CPU resources. */
  release(): void;
}

/** Snapshot descriptors, then upload/compile one typed resource at a time. */
export async function warmupScene(
  renderer: Renderer,
  scene: Scene,
  options: WarmupOptions = {},
  visibleOnly = false,
): Promise<WarmupLease> {
  const maxItems = options.maxItems ?? 8,
    maxMilliseconds = options.maxMilliseconds ?? 4;
  if (
    !Number.isSafeInteger(maxItems) ||
    maxItems < 1 ||
    !Number.isFinite(maxMilliseconds) ||
    maxMilliseconds <= 0
  )
    throw new RangeError(
      'Warmup requires positive maxItems and maxMilliseconds.',
    );
  options.signal?.throwIfAborted();
  if (scene.destroyed)
    throw new GraphicsError('Cannot warm up a destroyed Scene.');
  const resources = new Set<PreparationResource | NativePBRMaterial>();
  for (const object of scene.objects) {
    if (
      visibleOnly &&
      (object instanceof GameObject || object instanceof Object3D) &&
      !object.worldVisible
    )
      continue;
    if (object instanceof GPUParticleEmitter3D) resources.add(object);
    if (object instanceof Mesh) {
      if (
        object.material instanceof NativeMaterial3D ||
        object.material instanceof NativePBRMaterial
      )
        resources.add(object.material);
      resources.add(object);
    } else if (object instanceof Sprite) {
      resources.add(object.texture);
      if (object.material) resources.add(object.material);
    } else if (object instanceof Mesh2D) {
      resources.add(object.texture);
      resources.add(object.geometry);
    } else if (object instanceof ParticleLayer2D) {
      resources.add(object);
      for (let i = 0; i < object.activeCount; i++)
        resources.add(object.getSlot(object.activeSlotAt(i)).texture);
    }
    if (object instanceof IsolatedGroup2D) {
      if (object.mask?.texture) resources.add(object.mask.texture);
      for (const filter of object.filters)
        if (filter instanceof DisplacementFilter2D)
          resources.add(filter.texture);
    }
  }
  if (scene.environment) resources.add(scene.environment);
  if (scene.background) resources.add(scene.background);
  for (const probe of scene.reflectionProbes)
    if (probe.enabled) resources.add(probe.environment);
  for (const effect of scene.effects2D) resources.add(effect);
  for (const effect of scene.effects3D) resources.add(effect);
  const leases: PreparedResourceLease[] = [];
  let started = 0,
    completed = 0,
    chunks = 0,
    released = false;
  const progress = (): WarmupProgress =>
    Object.freeze({
      completed,
      total: resources.size,
      ratio: resources.size ? completed / resources.size : 1,
      chunks,
    });
  const release = (): void => {
    if (released) return;
    released = true;
    for (const lease of leases) lease.release();
    leases.length = 0;
  };
  const iterator = resources.values();
  const prepare = async (
    resource: PreparationResource | NativePBRMaterial,
  ): Promise<void> => {
    let lease: PreparedResourceLease;
    if (resource instanceof NativePBRMaterial) {
      if (!renderer.prepareNativePBRMaterial)
        throw new UnsupportedGraphicsError(
          'The selected renderer does not support native physical materials.',
        );
      await renderer.prepareNativePBRMaterial(resource);
      lease = { released: false, release() {} };
    } else
      lease = await renderer.prepareResource(resource, {
        signal: options.signal,
        scene,
      });
    if (options.signal?.aborted || released) {
      lease.release();
      options.signal?.throwIfAborted();
      return;
    }
    leases.push(lease);
    options.signal?.throwIfAborted();
    if (scene.destroyed)
      throw new GraphicsError('Scene was destroyed during warmup.');
    completed++;
    options.onProgress?.(progress());
  };
  options.signal?.addEventListener('abort', release, { once: true });
  try {
    options.onProgress?.(progress());
    options.signal?.throwIfAborted();
    if (scene.destroyed)
      throw new GraphicsError('Scene was destroyed during warmup.');
    while (started < resources.size) {
      await new Promise<void>((resolve, reject) => {
        const signal = options.signal;
        const abort = (): void => {
          cancelAnimationFrame(id);
          signal?.removeEventListener('abort', abort);
          reject(signal?.reason);
        };
        const id = requestAnimationFrame(() => {
          signal?.removeEventListener('abort', abort);
          resolve();
        });
        signal?.addEventListener('abort', abort, { once: true });
        if (signal?.aborted) abort();
      });
      options.signal?.throwIfAborted();
      if (scene.destroyed)
        throw new GraphicsError('Scene was destroyed during warmup.');
      chunks++;
      const start = performance.now();
      // A chunk issues its items one after another, measuring the budget between them, but
      // does not wait for each to finish before issuing the next: completion includes GPU
      // work (WebGPU waits for the queue), and waiting per item let one item take a frame or
      // two, so large scenes warmed at one or two meshes per frame.
      const pending: Promise<void>[] = [];
      for (
        let items = 0;
        items < maxItems && started < resources.size;
        items++
      ) {
        options.signal?.throwIfAborted();
        started++;
        pending.push(prepare(iterator.next().value!));
        if (performance.now() - start >= maxMilliseconds) break;
      }
      const results = await Promise.allSettled(pending);
      for (const result of results)
        if (result.status === 'rejected') throw result.reason;
    }
    options.signal?.throwIfAborted();
    if (scene.destroyed)
      throw new GraphicsError('Scene was destroyed during warmup.');
    return {
      progress: progress(),
      get released() {
        return released;
      },
      release,
    };
  } catch (error) {
    release();
    throw error;
  } finally {
    options.signal?.removeEventListener('abort', release);
  }
}
